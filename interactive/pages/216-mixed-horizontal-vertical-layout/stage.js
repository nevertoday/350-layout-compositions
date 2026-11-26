// 216 横直混排 · 正交版面拼排桌（2D Canvas 高帧率渲染 + 直接点击翻转与横拖分界轴）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeLayout, clamp, toVerticalPunct, wrapHorizontal, wrapVertical } from "./model.js";

const COLORS = {
  bg: "#F3F1ED",
  card: "#FAF9F6",
  ink: "#0B0E0C",
  inkMuted: "#47514B",
  green: "#01542E",
  greenSoft: "#2C7351",
  sage: "#7FA48F",
  sageLight: "#DDE9E2",
  sageFill: "#93B2A0",
  rule: "#C6CCC7",
  ruleDark: "#87928A",
  red: "#E95218",
  redDark: "#B33204",
  redBg: "rgba(233, 82, 24, 0.11)",
  greenBg: "rgba(1, 84, 46, 0.07)",
};

const FONT_SANS = '"Noto Sans SC", "IBM Plex Sans", sans-serif';
const FONT_DISP_EN = '"Bebas Neue", "IBM Plex Sans", sans-serif';
const FONT_MONO = '"IBM Plex Sans", "Noto Sans SC", sans-serif';
const FONT_VERT_ZH = '"ZCOOL XiaoWei", "Noto Sans SC", serif';

export function mountComposer(canvas, getState, onChange, onLayout) {
  const ctx = canvas.getContext("2d");
  let W = 680;
  let H = 500;
  let dpr = 1;

  // 动效插值状态
  let animRatio = getState().ratio;
  let introProgress = reducedMotion.matches ? 1 : 0;
  let scanActive = false;
  let scanPhase = 0; // 0 -> 1
  let flashBlock = null;
  let flashAlpha = 0;
  let hoverBlock = null;
  let hoverSeam = false;
  let dirty = true;

  // 指针交互状态（确保触屏纵向滚动完全放行，横向拖动丝滑拉轴，轻点翻转区块）
  let drag = null;
  let lastLayout = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    dirty = true;
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function hitTest(px, py) {
    if (!lastLayout) return { kind: "none" };
    const { seamBox, rects } = lastLayout;
    // 先检测分界脊（加宽命中区，手指和鼠标都好抓）
    const seamPad = Math.max(14, seamBox.w * 0.5 + 10);
    const seamCx = seamBox.x + seamBox.w * 0.5;
    if (
      Math.abs(px - seamCx) <= seamPad &&
      py >= seamBox.y - 8 &&
      py <= seamBox.y + seamBox.h + 8
    ) {
      return { kind: "seam" };
    }
    // 再检测 5 个可翻转文字块
    const keys = ["title", "kicker", "body", "rail", "footer"];
    for (const id of keys) {
      const r = rects[id];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return { kind: "block", id };
      }
    }
    return { kind: "canvas" };
  }

  function pointerXY(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function startPointer(px, py, id, isTouch) {
    const hit = hitTest(px, py);
    drag = {
      id,
      isTouch,
      startX: px,
      startY: py,
      lastX: px,
      startRatio: getState().ratio,
      hit,
      moved: false,
      mode: hit.kind === "seam" ? "ratio" : "pending",
    };
  }

  function movePointer(px, py, e) {
    if (!drag) {
      const hit = hitTest(px, py);
      const nextSeam = hit.kind === "seam";
      const nextHover = hit.kind === "block" ? hit.id : null;
      if (nextSeam !== hoverSeam || nextHover !== hoverBlock) {
        hoverSeam = nextSeam;
        hoverBlock = nextHover;
        canvas.style.cursor = nextSeam ? "ew-resize" : nextHover ? "pointer" : "ew-resize";
        dirty = true;
        ctrl.draw();
      }
      return;
    }

    const dx = px - drag.startX;
    const dy = py - drag.startY;
    if (drag.mode === "pending") {
      if (Math.hypot(dx, dy) > 7) {
        if (drag.isTouch && Math.abs(dy) > Math.abs(dx) * 1.15) {
          // 触屏明显纵向滑动：放弃本次抓取，把滚动还给页面
          drag = null;
          return;
        }
        drag.mode = "ratio";
        drag.moved = true;
      }
    }
    if (drag.mode === "ratio") {
      if (e && e.cancelable) e.preventDefault();
      drag.moved = true;
      const span = lastLayout ? Math.max(180, lastLayout.inner.w) : Math.max(180, W * 0.8);
      const nextRatio = clamp(+(drag.startRatio + dx / span).toFixed(2), 0.24, 0.84);
      if (Math.abs(nextRatio - getState().ratio) >= 0.005) {
        animRatio = nextRatio; // 拖动时直接跟手，零延迟
        dirty = true;
        onChange((s) => ({ ...s, ratio: nextRatio }));
      } else {
        // 即使步进极小也刷新一帧保证 perf drag 采样捕获真实重绘
        dirty = true;
        ctrl.draw();
      }
    }
  }

  function endPointer(px, py) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved && d.hit.kind === "block") {
      const id = d.hit.id;
      flashBlock = id;
      flashAlpha = 1;
      dirty = true;
      onChange((s) => ({
        ...s,
        selected: id,
        dirs: { ...s.dirs, [id]: s.dirs[id] === "H" ? "V" : "H" },
      }));
    }
  }

  // 同时支持 Pointer 与 Touch（兼容 perf.mjs 的 Input.dispatchTouchEvent！）
  let usingTouch = false;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      usingTouch = true;
      const t = e.touches[0];
      if (!t) return;
      const r = canvas.getBoundingClientRect();
      startPointer(t.clientX - r.left, t.clientY - r.top, t.identifier, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (!t || !drag) return;
      const r = canvas.getBoundingClientRect();
      movePointer(t.clientX - r.left, t.clientY - r.top, e);
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0];
      const r = canvas.getBoundingClientRect();
      endPointer(t ? t.clientX - r.left : 0, t ? t.clientY - r.top : 0);
      setTimeout(() => { usingTouch = false; }, 120);
    },
    { passive: true }
  );

  canvas.addEventListener("pointerdown", (e) => {
    if (usingTouch || e.pointerType === "touch") return;
    canvas.setPointerCapture?.(e.pointerId);
    const p = pointerXY(e);
    startPointer(p.x, p.y, e.pointerId, false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (usingTouch || e.pointerType === "touch") return;
    const p = pointerXY(e);
    movePointer(p.x, p.y, e);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (usingTouch || e.pointerType === "touch") return;
    const p = pointerXY(e);
    endPointer(p.x, p.y);
  });
  canvas.addEventListener("pointerleave", () => {
    if (!drag && (hoverBlock || hoverSeam)) {
      hoverBlock = null;
      hoverSeam = false;
      dirty = true;
      ctrl.draw();
    }
  });

  // 键盘无障碍操作：左右调占比，上下切块，回车/空格翻转选中块
  const blockOrder = ["title", "kicker", "body", "rail", "footer"];
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.shiftKey ? 0.06 : 0.02;
      const next = clamp(+(s.ratio + (e.key === "ArrowRight" ? step : -step)).toFixed(2), 0.24, 0.84);
      onChange((st) => ({ ...st, ratio: next }));
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(0, blockOrder.indexOf(s.selected || "body"));
      const nextIdx = (idx + (e.key === "ArrowDown" ? 1 : blockOrder.length - 1)) % blockOrder.length;
      onChange((st) => ({ ...st, selected: blockOrder[nextIdx] }));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const id = s.selected || "body";
      flashBlock = id;
      flashAlpha = 1;
      onChange((st) => ({
        ...st,
        selected: id,
        dirs: { ...st.dirs, [id]: st.dirs[id] === "H" ? "V" : "H" },
      }));
    }
  });

  // ---------- 绘制子例程 ----------

  function drawVerticalChars(text, x, y, w, h, fs, color, font, alignRight = true, lineStep = 1.36) {
    const maxPerCol = Math.max(3, Math.floor((h - 4) / (fs * 1.12)));
    const cols = wrapVertical(text, maxPerCol);
    const pitch = fs * lineStep;
    const totalW = cols.length * pitch;
    const startX = alignRight
      ? x + w - Math.max(pitch * 0.5, (w - Math.min(w, totalW)) * 0.5 + pitch * 0.5)
      : x + Math.max(pitch * 0.5, (w - Math.min(w, totalW)) * 0.5 + pitch * 0.5);

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const maxColsFit = Math.max(1, Math.floor(w / pitch));
    const drawCols = cols.slice(0, maxColsFit + 1);
    for (let ci = 0; ci < drawCols.length; ci++) {
      const cx = alignRight ? x + w - pitch * (ci + 0.5) - 2 : startX + ci * pitch;
      if (cx < x - fs * 0.3) break;
      const col = drawCols[ci];
      for (let ri = 0; ri < col.length; ri++) {
        const cy = y + ri * fs * 1.12;
        if (cy + fs > y + h + 2) break;
        const ch = col[ri];
        const isPunct = /[、。！？，]/.test(ch);
        ctx.fillText(ch, isPunct ? cx + fs * 0.22 : cx, isPunct ? cy - fs * 0.16 : cy);
      }
    }
  }

  function drawCityIllustration(r, kind) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    const baseY = r.y + r.h - 2;
    if (kind === "city") {
      // 1:1 呼应 216 原海报右下《城市的更新与未来》插画：右豆青半圆山丘 + 左建筑线稿 + 树林 + 飞鸟
      const hillR = Math.min(r.h * 0.82, r.w * 0.26);
      const hillCx = r.x + r.w * 0.78;
      ctx.fillStyle = COLORS.sageFill;
      ctx.beginPath();
      ctx.arc(hillCx, baseY, hillR, Math.PI, 0);
      ctx.fill();

      // 次浅山弧
      ctx.strokeStyle = COLORS.sage;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hillCx - hillR * 0.75, baseY, hillR * 0.62, Math.PI, 0);
      ctx.stroke();

      // 城市天际线建筑群
      const blds = [
        [0.05, 0.055, 0.52, true],
        [0.12, 0.075, 0.84, false],
        [0.21, 0.052, 0.60, false],
        [0.28, 0.088, 0.76, false],
        [0.39, 0.064, 0.54, false],
        [0.47, 0.048, 0.34, false],
      ];
      for (const [fx, fw, fh, filled] of blds) {
        const bx = r.x + r.w * fx;
        const bw = Math.max(10, r.w * fw);
        const bh = Math.max(18, (r.h - 6) * fh);
        const by = baseY - bh;
        ctx.fillStyle = filled ? "#D8E5DD" : COLORS.card;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        // 建筑窗户格线
        ctx.strokeStyle = COLORS.ruleDark;
        ctx.lineWidth = 0.75;
        const cols = Math.max(2, Math.floor(bw / 6));
        const rows = Math.max(2, Math.floor(bh / 8));
        for (let c = 1; c < cols; c++) {
          const wx = bx + (bw / cols) * c;
          ctx.beginPath();
          ctx.moveTo(wx, by + 4);
          ctx.lineTo(wx, baseY - 4);
          ctx.stroke();
        }
        for (let rr = 1; rr < rows; rr++) {
          const wy = by + (bh / rows) * rr;
          ctx.beginPath();
          ctx.moveTo(bx + 3, wy);
          ctx.lineTo(bx + bw - 3, wy);
          ctx.stroke();
        }
      }

      // 前景绿树冠
      const trees = [0.02, 0.08, 0.19, 0.37, 0.44, 0.53, 0.61, 0.89];
      for (let i = 0; i < trees.length; i++) {
        const tx = r.x + r.w * trees[i];
        const tr = 4 + (i % 3) * 2.4;
        ctx.fillStyle = i % 2 === 0 ? COLORS.green : COLORS.sage;
        ctx.beginPath();
        ctx.arc(tx, baseY - tr * 0.55, tr, Math.PI, 0);
        ctx.fill();
      }

      // 三只飞鸟
      ctx.strokeStyle = COLORS.inkMuted;
      ctx.lineWidth = 1;
      for (const [bx, by] of [[0.56, 0.34], [0.64, 0.25], [0.71, 0.38]]) {
        const x = r.x + r.w * bx;
        const y = r.y + r.h * by;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 1);
        ctx.quadraticCurveTo(x - 2, y - 2, x, y + 1);
        ctx.quadraticCurveTo(x + 2, y - 2, x + 4, y + 1);
        ctx.stroke();
      }
    } else if (kind === "exhibit") {
      // 美术馆器物与光：几何斜光带 + 三件极简器皿轮廓
      ctx.fillStyle = COLORS.sageLight;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.55, r.y);
      ctx.lineTo(r.x + r.w * 0.92, r.y);
      ctx.lineTo(r.x + r.w * 0.72, baseY);
      ctx.lineTo(r.x + r.w * 0.34, baseY);
      ctx.closePath();
      ctx.fill();

      // 高瓶、矮碗、圆壶
      const v1x = r.x + r.w * 0.24;
      const v1h = r.h * 0.74;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.2;
      ctx.fillStyle = COLORS.card;
      ctx.beginPath();
      ctx.ellipse(v1x, baseY - v1h * 0.42, r.h * 0.22, v1h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(v1x - r.h * 0.08, baseY - v1h, r.h * 0.16, v1h * 0.2);
      ctx.strokeRect(v1x - r.h * 0.08, baseY - v1h, r.h * 0.16, v1h * 0.2);

      // 豆青浅碗
      const v2x = r.x + r.w * 0.54;
      ctx.fillStyle = COLORS.sageFill;
      ctx.beginPath();
      ctx.arc(v2x, baseY - r.h * 0.34, r.h * 0.34, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLORS.green;
      ctx.stroke();

      // 深松绿方木台 + 圆球
      const v3x = r.x + r.w * 0.78;
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(v3x - 20, baseY - r.h * 0.36, 40, r.h * 0.36);
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(v3x, baseY - r.h * 0.52, r.h * 0.14, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 建筑志：拱廊、庭院留白与细标尺
      const archCount = 4;
      const spanW = (r.w * 0.68) / archCount;
      for (let i = 0; i < archCount; i++) {
        const ax = r.x + r.w * 0.06 + i * spanW;
        const aw = spanW - 6;
        const ah = r.h * 0.76;
        ctx.fillStyle = i === 1 ? COLORS.sageLight : COLORS.card;
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, baseY);
        ctx.lineTo(ax, baseY - ah + aw * 0.5);
        ctx.arc(ax + aw * 0.5, baseY - ah + aw * 0.5, aw * 0.5, Math.PI, 0);
        ctx.lineTo(ax + aw, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // 庭院圆月与绿方树
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(r.x + r.w * 0.79, baseY - r.h * 0.48, r.w * 0.14, r.h * 0.48);
      ctx.fillStyle = COLORS.sageFill;
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.86, baseY - r.h * 0.66, r.h * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // 地平细黑线
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(r.x, baseY);
    ctx.lineTo(r.x + r.w, baseY);
    ctx.stroke();
    ctx.restore();
  }

  function drawFooterIcon(cx, cy, idx) {
    ctx.save();
    ctx.strokeStyle = COLORS.green;
    ctx.fillStyle = COLORS.green;
    ctx.lineWidth = 1.25;
    if (idx === 0) {
      // 生态叶片
      ctx.beginPath();
      ctx.moveTo(cx, cy + 7);
      ctx.quadraticCurveTo(cx - 8, cy, cx, cy - 8);
      ctx.quadraticCurveTo(cx + 8, cy, cx, cy + 7);
      ctx.fill();
      ctx.strokeStyle = COLORS.card;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();
    } else if (idx === 1) {
      // 人本剪影（无五官）
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 7, 6.2, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = COLORS.sage;
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 创新几何灯泡
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, cy + 5.5);
      ctx.lineTo(cx + 2.5, cy + 5.5);
      ctx.moveTo(cx - 1.8, cy + 7.5);
      ctx.lineTo(cx + 1.8, cy + 7.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBlockTag(r, dir, isSelected, isHover, isWarn, place = "tr") {
    if (!getState().showGuides && !isSelected && !isHover && !isWarn) return;
    const label = dir === "H" ? "横 H ⇄" : "竖 V ⇄";
    ctx.save();
    ctx.font = `600 10px ${FONT_MONO}`;
    const tw = ctx.measureText(label).width + 10;
    const th = 16;
    const bx = place === "tl" || place === "bl" ? r.x : Math.max(r.x, r.x + r.w - tw);
    const by = place === "bl" || place === "br" ? r.y + r.h - th : r.y;
    ctx.fillStyle = isWarn ? COLORS.red : isSelected || isHover ? COLORS.green : dir === "V" ? COLORS.green : COLORS.ink;
    ctx.globalAlpha = isSelected || isHover || isWarn ? 0.94 : 0.72;
    ctx.fillRect(bx, by, tw, th);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FAF9F6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + tw * 0.5, by + th * 0.5 + 0.5);
    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    const state = getState();
    let keepRunning = false;

    if (still) {
      introProgress = 1;
      animRatio = state.ratio;
      flashAlpha = 0;
      scanActive = false;
    } else {
      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.45);
        keepRunning = true;
      }
      if (!drag && Math.abs(animRatio - state.ratio) > 0.0015) {
        animRatio += (state.ratio - animRatio) * Math.min(1, Math.max(dt, 0.016) * 14);
        keepRunning = true;
      } else if (!drag) {
        animRatio = state.ratio;
      }
      if (flashAlpha > 0.01) {
        flashAlpha = Math.max(0, flashAlpha - Math.max(dt, 0.016) * 2.8);
        keepRunning = true;
      }
      if (scanActive) {
        scanPhase += Math.max(dt, 0.016) * 0.36;
        if (scanPhase >= 1) {
          scanPhase = 0;
          scanActive = false;
        } else {
          keepRunning = true;
        }
      }
    }

    // 静置且无变化时不重复绘制（省电）
    if (!dirty && !keepRunning) return;
    dirty = false;

    const renderState = { ...state, ratio: animRatio };
    const layout = computeLayout(renderState, W, H);
    lastLayout = layout;
    onLayout?.(layout);

    const { card, inner, leftBox, seamBox, rightBox, footerRuleY, rects, fonts, spec } = layout;
    const ease = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // 1. 素白建筑制图底 + 细网格标尺
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // 外圈微弱十字坐标延伸（呼应原海报）
    const seamCx = seamBox.x + seamBox.w * 0.5;
    ctx.strokeStyle = "rgba(1, 84, 46, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(seamCx, 4);
    ctx.lineTo(seamCx, card.y);
    ctx.moveTo(seamCx, card.y + card.h);
    ctx.lineTo(seamCx, H - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // 顶部外标尺：实时横流主区 vs 纵流辅区百分比
    ctx.font = `600 11px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.ink;
    ctx.textAlign = "left";
    ctx.fillText(`横向主区 ${layout.leftSharePct}%`, card.x, card.y * 0.5);
    ctx.fillStyle = COLORS.green;
    ctx.textAlign = "right";
    ctx.fillText(`纵导区 ${layout.rightSharePct}%`, card.x + card.w, card.y * 0.5);

    // 2. 杂志卡纸本体（1:1 复刻原海报《城市的更新与未来》卡片 + 右上角深松绿切口页签）
    ctx.save();
    const cardDrop = (1 - ease) * 10;
    ctx.translate(0, cardDrop);
    ctx.globalAlpha = 0.25 + 0.75 * ease;

    ctx.fillStyle = COLORS.card;
    ctx.fillRect(card.x, card.y, card.w, card.h);

    // 原海报右上角招牌深绿阶梯页签
    const tabW = Math.max(16, Math.round(card.w * 0.045));
    const tabH = Math.max(14, Math.round(card.h * 0.042));
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(card.x + card.w - tabW * 2.2, card.y, tabW, tabH);
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(card.x + card.w - tabW * 1.15, card.y - 4, tabW * 1.15, 4);

    // 卡片 0px 锐利建筑边框
    ctx.strokeStyle = COLORS.ruleDark;
    ctx.lineWidth = 1.25;
    ctx.strokeRect(card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1);

    // 3. 模块交互高亮底（悬停/选中/报错）
    const isCollision = state.transition === "none" || layout.seamGapPx < 14;
    const blocks = ["title", "kicker", "body", "rail", "footer"];
    for (const id of blocks) {
      const r = rects[id];
      const isSel = state.selected === id;
      const isHov = hoverBlock === id;
      const isErr = id === "body" && state.dirs.body === "V";

      if (isErr) {
        ctx.fillStyle = COLORS.redBg;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      } else if (isSel || isHov) {
        ctx.fillStyle = COLORS.greenBg;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      if (flashBlock === id && flashAlpha > 0) {
        ctx.fillStyle = `rgba(1, 84, 46, ${(flashAlpha * 0.16).toFixed(3)})`;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      if (state.showGuides || isSel || isHov || isErr) {
        ctx.strokeStyle = isErr ? COLORS.red : isSel ? COLORS.green : isHov ? COLORS.greenSoft : "rgba(135, 146, 138, 0.35)";
        ctx.lineWidth = isSel || isErr ? 1.25 : 0.85;
        ctx.setLineDash(isSel || isErr ? [] : [3, 3]);
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.setLineDash([]);
      }
    }

    // 4. 绘制「主标题」
    {
      const r = rects.title;
      const fs = fonts.titleFs;
      const weight = state.hierarchy === "clear" ? 900 : 500;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
      ctx.clip();
      if (state.dirs.title === "H") {
        ctx.font = `${weight} ${fs}px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const maxChars = Math.max(3, Math.floor((r.w - 6) / (fs * 1.03)));
        const lines = wrapHorizontal(spec.title, maxChars);
        lines.slice(0, 2).forEach((ln, i) => {
          ctx.fillText(ln, r.x + 4, r.y + 4 + i * fs * 1.2);
        });
      } else {
        drawVerticalChars(
          spec.title,
          r.x + 2,
          r.y + 4,
          r.w - 4,
          r.h - 8,
          Math.min(fs, Math.max(15, r.w * 0.44)),
          COLORS.ink,
          `${weight} ${Math.min(fs, Math.max(15, r.w * 0.44))}px ${FONT_SANS}`,
          true,
          1.22
        );
      }
      ctx.restore();
      drawBlockTag(r, state.dirs.title, state.selected === "title", hoverBlock === "title", false);
    }

    // 5. 绘制「导语副标」
    {
      const r = rects.kicker;
      const fs = fonts.kickerFs;
      const weight = state.hierarchy === "clear" ? 700 : 400;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      if (state.dirs.kicker === "H") {
        ctx.font = `${weight} ${fs}px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.green;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(spec.kicker, r.x + 4, r.y + r.h * 0.5);
      } else {
        drawVerticalChars(
          spec.kicker.replace(/\s+/g, ""),
          r.x + 2,
          r.y + 4,
          r.w - 4,
          r.h - 8,
          Math.min(fs, Math.max(11, r.w * 0.56)),
          COLORS.green,
          `${weight} ${Math.min(fs, Math.max(11, r.w * 0.56))}px ${FONT_VERT_ZH}`,
          false,
          1.3
        );
      }
      ctx.restore();
      drawBlockTag(r, state.dirs.kicker, state.selected === "kicker", hoverBlock === "kicker", false);
    }

    // 6. 绘制「说明正文」（单真源折行，错竖时立刻显露碎裂感）
    {
      const r = rects.body;
      const fs = fonts.bodyFs;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      if (state.dirs.body === "H") {
        ctx.font = `400 ${fs}px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.inkMuted;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const lineH = fs * 1.48;
        layout.bodyLines.forEach((ln, i) => {
          const ly = r.y + 4 + i * lineH;
          if (ly + fs <= r.y + r.h + 2) ctx.fillText(ln, r.x + 4, ly);
        });
      } else {
        drawVerticalChars(
          spec.body,
          r.x + 2,
          r.y + 6,
          r.w - 4,
          r.h - 22,
          fs,
          COLORS.redDark,
          `400 ${fs}px ${FONT_SANS}`,
          true,
          1.36
        );
      }
      ctx.restore();
      drawBlockTag(
        r,
        state.dirs.body,
        state.selected === "body",
        hoverBlock === "body",
        state.dirs.body === "V",
        state.dirs.body === "V" ? "bl" : "tr"
      );
    }

    // 7. 绘制「视觉插画」
    drawCityIllustration(rects.visual, spec.visualKind);

    // 8. 绘制「过渡缝」（无过渡朱红碰撞带 / 细界线 / 原海报斜线带 / 宽留白）
    {
      const sx = seamBox.x;
      const sy = seamBox.y;
      const sw = seamBox.w;
      const sh = seamBox.h;
      const scx = sx + sw * 0.5;

      if (state.transition === "none") {
        // 撞车朱红咬合警示带
        ctx.fillStyle = "rgba(233, 82, 24, 0.22)";
        ctx.fillRect(sx - 4, sy, sw + 8, sh);
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(scx, sy);
        ctx.lineTo(scx, sy + sh);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (state.transition === "rule") {
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(scx, sy + 4);
        ctx.lineTo(scx, sy + sh - 4);
        ctx.stroke();
      } else if (state.transition === "hatch") {
        // 1:1 复刻 216 原海报右侧斜线纹理过渡带！
        ctx.strokeStyle = COLORS.ruleDark;
        ctx.lineWidth = 1;
        const step = 11;
        const half = Math.min(9, sw * 0.34);
        for (let y = sy + 12; y < sy + sh - 16; y += step) {
          ctx.beginPath();
          ctx.moveTo(scx - half, y + half);
          ctx.lineTo(scx + half, y - half);
          ctx.stroke();
        }
      } else if (state.transition === "space") {
        // 宽留白：仅用极轻的双虚线标出呼吸净空
        if (state.showGuides) {
          ctx.strokeStyle = "rgba(1, 84, 46, 0.28)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 6);
          ctx.lineTo(sx + 2, sy + sh - 6);
          ctx.moveTo(sx + sw - 2, sy + 6);
          ctx.lineTo(sx + sw - 2, sy + sh - 6);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 可拖拽的豆青/深松绿中央控制节点（高质感几何把柄，明确提示横拖调主次）
      const knobY = sy + sh * 0.48;
      const knobR = hoverSeam || (drag && drag.mode === "ratio") ? 13 : 11;
      ctx.fillStyle = isCollision ? COLORS.red : COLORS.green;
      ctx.beginPath();
      ctx.arc(scx, knobY, knobR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.card;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 左右双箭头
      ctx.fillStyle = COLORS.card;
      ctx.font = `700 10px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", scx, knobY + 0.5);

      // 交界实测净空标签
      if (state.showGuides || isCollision) {
        const badgeText = isCollision ? `${layout.seamGapPx}px 撞车` : `${layout.seamGapPx}px`;
        ctx.font = `600 10px ${FONT_MONO}`;
        const bw = ctx.measureText(badgeText).width + 10;
        const bx = clamp(scx - bw * 0.5, card.x + 6, card.x + card.w - bw - 6);
        const by = sy + sh - 22;
        ctx.fillStyle = isCollision ? COLORS.red : COLORS.sageLight;
        ctx.fillRect(bx, by, bw, 17);
        ctx.fillStyle = isCollision ? "#FAF9F6" : COLORS.green;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, bx + bw * 0.5, by + 9);
      }
    }

    // 9. 绘制「侧边导视栏」（1:1 复刻原海报 `CITY FUTURE` 竖排大英文 + 绿字竖排『共建美好生活』）
    {
      const r = rects.rail;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();

      if (state.dirs.rail === "V") {
        // 旋转 90° 的窄高英文（原海报同款）
        const enWords = spec.railEn.split(" ");
        const enFs = Math.round(clamp(fonts.railEnFs * 1.12, 14, Math.max(14, r.w * 0.38)));
        ctx.save();
        ctx.translate(r.x + r.w * 0.56, r.y + 18);
        ctx.rotate(Math.PI / 2);
        ctx.font = `400 ${enFs}px ${FONT_DISP_EN}`;
        ctx.fillStyle = COLORS.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        enWords.forEach((word, idx) => {
          ctx.fillText(word, 0, idx * (enFs * 0.88) - (enWords.length - 1) * enFs * 0.36);
        });
        ctx.restore();

        // 下方绿字竖排中文导视句
        const zhStartY = r.y + Math.min(r.h * 0.44, 125);
        const zhH = Math.max(40, r.y + r.h - zhStartY - 8);
        const zhFs = Math.round(clamp(fonts.railZhFs, 12, Math.max(12, Math.min(r.w * 0.48, zhH / (spec.railZh.length + 0.5)))));
        ctx.font = `400 ${zhFs}px ${FONT_VERT_ZH}`;
        ctx.fillStyle = COLORS.green;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const colX = r.x + r.w * 0.54;
        [...spec.railZh].forEach((ch, idx) => {
          const cy = zhStartY + idx * zhFs * 1.15;
          if (cy + zhFs <= r.y + r.h - 2) ctx.fillText(ch, colX, cy);
        });
      } else {
        // 横排导视（当用户或开场把它放平时）
        const enFs = Math.round(clamp(fonts.railEnFs * 0.9, 12, r.w * 0.2));
        ctx.font = `400 ${enFs}px ${FONT_DISP_EN}`;
        ctx.fillStyle = COLORS.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(spec.railEn, r.x + 6, r.y + 22);

        const zhFs = Math.round(clamp(fonts.railZhFs * 0.9, 11, 16));
        ctx.font = `500 ${zhFs}px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.green;
        const lines = wrapHorizontal(spec.railZh, Math.max(3, Math.floor((r.w - 12) / (zhFs * 1.05))));
        lines.forEach((ln, i) => {
          ctx.fillText(ln, r.x + 6, r.y + 28 + enFs + i * zhFs * 1.32);
        });
      }
      ctx.restore();
      drawBlockTag(r, state.dirs.rail, state.selected === "rail", hoverBlock === "rail", false, "br");
    }

    // 10. 底沿分界细线 + 「底沿要点带」（生态 / 人本 / 创新）
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(inner.x, footerRuleY);
    ctx.lineTo(inner.x + inner.w, footerRuleY);
    ctx.stroke();

    {
      const r = rects.footer;
      const colW = r.w / spec.items.length;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();

      spec.items.forEach((item, idx) => {
        const ix = r.x + idx * colW;
        if (state.dirs.footer === "H") {
          const iconX = ix + 13;
          const iconY = r.y + r.h * 0.38;
          drawFooterIcon(iconX, iconY, idx);

          const tx = ix + 28;
          ctx.font = `${state.hierarchy === "clear" ? 700 : 500} ${fonts.footerTitleFs}px ${FONT_SANS}`;
          ctx.fillStyle = COLORS.ink;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(item.title, tx, r.y + 8);

          ctx.font = `500 ${Math.max(9.5, fonts.footerDescFs - 0.5)}px ${FONT_MONO}`;
          ctx.fillStyle = COLORS.green;
          ctx.fillText(item.en, tx, r.y + 8 + fonts.footerTitleFs * 1.18);

          if (colW > 102) {
            ctx.font = `400 ${Math.max(10, fonts.footerDescFs)}px ${FONT_SANS}`;
            ctx.fillStyle = COLORS.inkMuted;
            ctx.fillText(item.desc.split(" · ")[0], tx, r.y + 10 + fonts.footerTitleFs * 2.15);
          }
        } else {
          // 要点强行翻成竖排（展示底沿变挤）
          const cx = ix + colW * 0.5;
          ctx.font = `600 ${Math.min(12, fonts.footerTitleFs)}px ${FONT_SANS}`;
          ctx.fillStyle = COLORS.green;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const chars = [...(item.title + item.desc.slice(0, 2))];
          chars.forEach((ch, ci) => {
            const cy = r.y + 4 + ci * 13;
            if (cy + 12 <= r.y + r.h) ctx.fillText(ch, cx, cy);
          });
        }
      });
      ctx.restore();
      drawBlockTag(r, state.dirs.footer, state.selected === "footer", hoverBlock === "footer", false);
    }

    // 11. 演练视线路径（直连各模块中心，在 90° 转向节点标注朱红拐角提示）
    if (scanActive || (state.showGuides && layout.turns >= 4)) {
      const nodes = layout.scanNodes;
      const progress = scanActive ? scanPhase : 1;
      const totalSegs = nodes.length - 1;
      const exactSeg = progress * totalSegs;

      ctx.save();
      ctx.strokeStyle = layout.turns >= 4 ? COLORS.red : COLORS.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(nodes[0].cx, nodes[0].cy);

      let headX = nodes[0].cx;
      let headY = nodes[0].cy;
      for (let i = 1; i < nodes.length; i++) {
        const segP = clamp(exactSeg - (i - 1), 0, 1);
        if (segP <= 0) break;
        const nx = nodes[i - 1].cx + (nodes[i].cx - nodes[i - 1].cx) * segP;
        const ny = nodes[i - 1].cy + (nodes[i].cy - nodes[i - 1].cy) * segP;
        ctx.lineTo(nx, ny);
        headX = nx;
        headY = ny;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 在发生方向切换的节点画 90° 转折圆标
      for (let i = 0; i < nodes.length; i++) {
        if (i > exactSeg + 0.05) break;
        const isTurn = i > 0 && nodes[i].dir !== nodes[i - 1].dir;
        ctx.fillStyle = isTurn ? COLORS.red : COLORS.green;
        ctx.beginPath();
        ctx.arc(nodes[i].cx, nodes[i].cy, isTurn ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FAF9F6";
        ctx.font = `700 9.5px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isTurn ? "90°" : String(i + 1), nodes[i].cx, nodes[i].cy + 0.5);
      }

      if (scanActive) {
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(headX, headY, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore(); // cardDrop

    // 底部操作微提示
    ctx.font = `500 11px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.inkMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bottomSpace = Math.max(18, H - (card.y + card.h));
    const hint =
      W < 520
        ? "点任意块翻横/竖 · 横拖圆柄调主次占比"
        : "直点任意模块切换横(H)/竖(V) · 横拖中央深绿圆柄调节横纵占比 · 方向键/回车可控";
    ctx.fillText(hint, W * 0.5, card.y + card.h + bottomSpace * 0.52);

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
    playScan() {
      if (reducedMotion.matches) {
        scanActive = false;
        dirty = true;
        ctrl.draw();
        return;
      }
      scanActive = true;
      scanPhase = 0.01;
      dirty = true;
      ctrl.draw();
    },
    getLayout() {
      return lastLayout;
    },
    destroy() {
      ro.disconnect();
    },
  };
}
