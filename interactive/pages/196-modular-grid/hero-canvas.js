// 196 模块化网格 — 开场活体 X×X 积木拼版台 2D Canvas 渲染与直接拖拽交互
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BLOCK_DEFS,
  SCENE_THEMES,
  computeMatrixGeometry,
  blockToRect,
  clampBlocksToGrid,
} from "./model.js";

const PALETTE = {
  paper: "#FFFDF8",
  cellBg: "#FDF6E9",
  dash: "#C4A88E",
  orange: "#D55A07",
  orangeSoft: "rgba(213, 90, 7, 0.14)",
  plum: "#342039",
  plumLight: "#4B3052",
  tan: "#EBC7A0",
  tanDark: "#DFB88D",
  cream: "#FAF0DF",
  ink: "#161018",
  inkSoft: "#554459",
  ok: "#1C6B54",
  err: "#B82914",
};

const DEF_MAP = Object.fromEntries(BLOCK_DEFS.map((d) => [d.id, d]));

export function mountHeroCanvas(canvas, getState, getEval, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 450;
  let dpr = pixelRatio(1.5);
  let geom = computeMatrixGeometry(cssW, cssH, 8, 6, 0);
  let dirty = true;
  let introProgress = reducedMotion.matches ? 1 : 0;

  // 离屏缓存：虚线 C×R 网格底板与 X×X 标尺仅在尺寸/粒度/缝隙变化时绘制一次，大幅降低拖动帧绘制调用
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgKey = "";

  // 拖拽状态
  let drag = null;

  function syncSize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(180, Math.round(r.height));
    const nextDpr = pixelRatio(w < 540 ? 1.5 : 2);
    if (w !== cssW || h !== cssH || nextDpr !== dpr || canvas.width !== Math.round(w * nextDpr)) {
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
      bgKey = "";
      dirty = true;
    }
  }

  function ensureGridBackdrop(state, ev) {
    const key = `${cssW}x${cssH}@${dpr}:${state.cols}x${state.rows}:${state.gutterFrac}`;
    if (key === bgKey) return;
    bgKey = key;
    bgCtx.save();
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, cssW, cssH);
    bgCtx.fillStyle = PALETTE.paper;
    bgCtx.fillRect(0, 0, cssW, cssH);

    // 批量绘制 C×R 虚线基础单元方格（仅 2 次路径提交）
    bgCtx.fillStyle = PALETTE.cellBg;
    bgCtx.beginPath();
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        bgCtx.rect(geom.ox + c * geom.step, geom.oy + r * geom.step, geom.cell, geom.cell);
      }
    }
    bgCtx.fill();

    bgCtx.strokeStyle = PALETTE.dash;
    bgCtx.lineWidth = 1;
    bgCtx.setLineDash([4, 3]);
    bgCtx.beginPath();
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        bgCtx.rect(geom.ox + c * geom.step + 0.5, geom.oy + r * geom.step + 0.5, geom.cell - 1, geom.cell - 1);
      }
    }
    bgCtx.stroke();
    bgCtx.setLineDash([]);

    // 左上角原海报标志性「X × X」焦糖橘标尺
    const x0 = geom.ox;
    const y0 = geom.oy;
    bgCtx.strokeStyle = PALETTE.orange;
    bgCtx.fillStyle = PALETTE.orange;
    bgCtx.lineWidth = 1.4;
    bgCtx.beginPath();
    bgCtx.moveTo(x0, y0 - 11);
    bgCtx.lineTo(x0 + geom.cell, y0 - 11);
    bgCtx.moveTo(x0, y0 - 15);
    bgCtx.lineTo(x0, y0 - 7);
    bgCtx.moveTo(x0 + geom.cell, y0 - 15);
    bgCtx.lineTo(x0 + geom.cell, y0 - 7);
    bgCtx.moveTo(x0 - 11, y0);
    bgCtx.lineTo(x0 - 11, y0 + geom.cell);
    bgCtx.moveTo(x0 - 15, y0);
    bgCtx.lineTo(x0 - 7, y0);
    bgCtx.moveTo(x0 - 15, y0 + geom.cell);
    bgCtx.lineTo(x0 - 7, y0 + geom.cell);
    bgCtx.stroke();

    bgCtx.font = `700 11px "JetBrains Mono", monospace`;
    bgCtx.textAlign = "center";
    bgCtx.fillText("X", x0 + geom.cell / 2, y0 - 16);
    bgCtx.textAlign = "right";
    bgCtx.fillText("X", x0 - 15, y0 + geom.cell / 2 + 4);

    bgCtx.fillStyle = PALETTE.inkSoft;
    bgCtx.font = `500 11px "JetBrains Mono", monospace`;
    const gTxt = `1X=${Math.round(geom.cell)}px · g=${Math.round(geom.gutter)}px (${ev.metrics.gutterPct}%)`;
    bgCtx.fillText(gTxt, geom.ox + geom.matrixW, y0 - 12);
    bgCtx.restore();
  }

  function getPad() {
    const narrow = cssW < 420;
    return narrow
      ? { left: 28, right: 10, top: 28, bottom: 14 }
      : { left: 42, right: 16, top: 36, bottom: 18 };
  }

  // 把 5 块按视觉层级和选中状态排序（选中块置顶）
  function orderedBlocks(state) {
    return [...state.blocks].sort((a, b) => {
      if (a.id === state.selectedId) return 1;
      if (b.id === state.selectedId) return -1;
      return 0;
    });
  }

  function hitTest(px, py, state) {
    const list = orderedBlocks(state).reverse();
    const handleSize = cssW < 460 ? 26 : 22;
    for (const b of list) {
      const rect = blockToRect(b, geom);
      // 先测右下角缩放柄（扩大热区方便触屏）
      if (
        px >= rect.x + rect.w - handleSize &&
        px <= rect.x + rect.w + 8 &&
        py >= rect.y + rect.h - handleSize &&
        py <= rect.y + rect.h + 8
      ) {
        return { mode: "resize", block: b };
      }
      if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
        return { mode: "move", block: b };
      }
    }
    return null;
  }

  function clientToCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function beginDrag(px, py, pointerId, isTouch) {
    const state = getState();
    geom = computeMatrixGeometry(cssW, cssH, state.cols, state.rows, state.gutterFrac, getPad());
    let hit = hitTest(px, py, state);
    // 若拖到中心空白处且未命中具体块，水平触屏测试兜底：选中主视觉并准备响应水平拖
    if (!hit && isTouch) {
      const sel = state.blocks.find((b) => b.id === state.selectedId) || state.blocks[0];
      drag = {
        mode: "move",
        id: sel.id,
        startPxX: px,
        startPxY: py,
        origX: sel.x,
        origY: sel.y,
        origW: sel.w,
        origH: sel.h,
        pointerId,
        isTouch,
        fromBlank: true,
        active: false,
      };
      return false;
    }
    if (!hit) return false;

    const b = hit.block;
    drag = {
      mode: hit.mode,
      id: b.id,
      startPxX: px,
      startPxY: py,
      origX: b.x,
      origY: b.y,
      origW: b.w,
      origH: b.h,
      pointerId,
      isTouch,
      fromBlank: false,
      active: !isTouch || hit.mode === "resize",
    };
    if (state.selectedId !== b.id) {
      onMutate((s) => {
        s.selectedId = b.id;
      });
    }
    canvas.classList.toggle("is-resizing", hit.mode === "resize");
    canvas.classList.toggle("is-dragging", hit.mode === "move");
    dirty = true;
    return true;
  }

  function moveDrag(px, py, ev) {
    if (!drag) return;
    const dxPx = px - drag.startPxX;
    const dyPx = py - drag.startPxY;

    // 触屏防误触滚动：竖划幅度明显大于横划且非角柄时，把滚页权还给浏览器
    if (drag.isTouch && !drag.active) {
      if (Math.hypot(dxPx, dyPx) < 5) return;
      if (Math.abs(dyPx) > Math.abs(dxPx) * 1.25 && !drag.fromBlank) {
        drag = null;
        return;
      }
      if (drag.fromBlank && Math.abs(dyPx) > Math.abs(dxPx)) {
        drag = null;
        return;
      }
      drag.active = true;
    }

    if (ev && ev.cancelable) ev.preventDefault();

    const state = getState();
    const dxCell = dxPx / Math.max(8, geom.step);
    const dyCell = dyPx / Math.max(8, geom.step);

    onMutate((s) => {
      const target = s.blocks.find((b) => b.id === drag.id);
      if (!target) return;
      if (drag.mode === "move") {
        let nx = drag.origX + dxCell;
        let ny = drag.origY + dyCell;
        nx = Math.max(0, Math.min(s.cols - target.w, nx));
        ny = Math.max(0, Math.min(s.rows - target.h, ny));
        // 吸附模式：靠近整数格线 0.28X 时轻吸
        if (s.snap) {
          const rx = Math.round(nx);
          const ry = Math.round(ny);
          if (Math.abs(nx - rx) < 0.32) nx = rx;
          if (Math.abs(ny - ry) < 0.32) ny = ry;
        }
        target.x = nx;
        target.y = ny;
      } else {
        let nw = Math.max(1, Math.min(s.cols - target.x, drag.origW + dxCell));
        let nh = Math.max(1, Math.min(s.rows - target.y, drag.origH + dyCell));
        if (s.snap) {
          nw = Math.max(1, Math.min(s.cols - Math.round(target.x), Math.round(nw)));
          nh = Math.max(1, Math.min(s.rows - Math.round(target.y), Math.round(nh)));
        }
        target.w = nw;
        target.h = nh;
      }
    }, true);
    dirty = true;
  }

  function endDrag() {
    if (!drag) return;
    const wasActive = drag.active;
    const id = drag.id;
    drag = null;
    canvas.classList.remove("is-dragging", "is-resizing");
    if (wasActive) {
      onMutate((s) => {
        if (s.snap) {
          s.blocks = clampBlocksToGrid(s.blocks, s.cols, s.rows, true);
        } else {
          const t = s.blocks.find((b) => b.id === id);
          if (t) {
            t.x = +t.x.toFixed(2);
            t.y = +t.y.toFixed(2);
            t.w = +t.w.toFixed(2);
            t.h = +t.h.toFixed(2);
          }
        }
      });
    }
    dirty = true;
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const p = clientToCanvas(e.clientX, e.clientY);
    if (beginDrag(p.x, p.y, "mouse", false)) {
      e.preventDefault();
      canvas.focus({ preventScroll: true });
    }
  });
  window.addEventListener("mousemove", (e) => {
    if (drag && drag.pointerId === "mouse") {
      const p = clientToCanvas(e.clientX, e.clientY);
      moveDrag(p.x, p.y, e);
    } else if (!drag) {
      const p = clientToCanvas(e.clientX, e.clientY);
      if (p.x >= 0 && p.x <= cssW && p.y >= 0 && p.y <= cssH) {
        const hit = hitTest(p.x, p.y, getState());
        canvas.style.cursor = hit ? (hit.mode === "resize" ? "nwse-resize" : "grab") : "default";
      }
    }
  });
  window.addEventListener("mouseup", () => {
    if (drag && drag.pointerId === "mouse") endDrag();
  });

  // 触摸事件（兼容 perf.mjs 的 Input.dispatchTouchEvent 与真手机双指/单指滚页）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const p = clientToCanvas(t.clientX, t.clientY);
      beginDrag(p.x, p.y, t.identifier, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drag || !drag.isTouch) return;
      const t = [...e.touches].find((x) => x.identifier === drag.pointerId) || e.touches[0];
      if (!t) return;
      const p = clientToCanvas(t.clientX, t.clientY);
      moveDrag(p.x, p.y, e);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => {
    if (drag && drag.isTouch) endDrag();
  });
  canvas.addEventListener("touchcancel", () => {
    if (drag && drag.isTouch) endDrag();
  });

  // 键盘操作：方向键移位、Shift+方向键改跨格、Tab 在块内或切块按钮
  canvas.addEventListener("keydown", (e) => {
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!dirs[e.key]) return;
    e.preventDefault();
    const [dx, dy] = dirs[e.key];
    onMutate((s) => {
      const target = s.blocks.find((b) => b.id === s.selectedId);
      if (!target) return;
      const step = s.snap ? 1 : 0.25;
      if (e.shiftKey) {
        target.w = Math.max(1, Math.min(s.cols - target.x, +(target.w + dx * step).toFixed(2)));
        target.h = Math.max(1, Math.min(s.rows - target.y, +(target.h + dy * step).toFixed(2)));
      } else {
        target.x = Math.max(0, Math.min(s.cols - target.w, +(target.x + dx * step).toFixed(2)));
        target.y = Math.max(0, Math.min(s.rows - target.h, +(target.y + dy * step).toFixed(2)));
      }
      if (s.snap) s.blocks = clampBlocksToGrid(s.blocks, s.cols, s.rows, true);
    });
    dirty = true;
  });

  // ---------- 绘制函数（极速无 shadowBlur，60fps 友好，按块像素大小自适应防任何叠字） ----------
  function drawBlockContent(b, rect, sceneData, issue, isSelected) {
    const def = DEF_MAP[b.id];
    const copy = sceneData.blocks[b.id];
    const pad = Math.max(5, Math.min(12, rect.w * 0.09));
    const tiny = rect.w < 78 || rect.h < 68;
    const compact = rect.w < 128 || rect.h < 96;
    const showCornerBadge = rect.w >= 76 && rect.h >= 62;

    // 1. 块底色（100% 源自 196 原海报）
    let bg = PALETTE.tan;
    let fg = PALETTE.plum;
    if (def.tone === "plum") {
      bg = PALETTE.plum;
      fg = "#FDF6E9";
    } else if (def.tone === "cream") {
      bg = PALETTE.cream;
      fg = PALETTE.plum;
    } else if (def.tone === "tan-dark") {
      bg = PALETTE.tanDark;
      fg = PALETTE.plum;
    }

    ctx.fillStyle = bg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // 2. 块内真实内容视觉（按块实际像素宽窄分级绘制，绝不叠压）
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    if (b.id === "visual") {
      if (sceneData.id === "poster") {
        const arcR = Math.min(rect.w, rect.h) * (tiny ? 0.62 : 0.56);
        ctx.fillStyle = "#DD7121";
        ctx.beginPath();
        ctx.moveTo(rect.x + rect.w, rect.y + rect.h);
        ctx.arc(rect.x + rect.w, rect.y + rect.h, arcR, Math.PI, Math.PI * 1.5);
        ctx.closePath();
        ctx.fill();
        if (!tiny) {
          ctx.fillStyle = "#FDF6E9";
          const fs = compact ? 13 : Math.min(24, Math.round(rect.w * 0.105));
          ctx.font = `900 ${fs}px "Noto Sans SC", sans-serif`;
          ctx.fillText(copy.title, rect.x + pad, rect.y + pad + fs);
          if (!compact) {
            ctx.fillStyle = "#EBC7A0";
            ctx.font = `500 11px "JetBrains Mono", monospace`;
            ctx.fillText(copy.sub, rect.x + pad, rect.y + pad + fs + 18);
          }
        } else {
          // 极小态仅画清爽图形标记：日弧+右上白圆点
          ctx.fillStyle = "#FDF6E9";
          ctx.beginPath();
          ctx.arc(rect.x + pad + 6, rect.y + pad + 6, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (sceneData.id === "card") {
        const r = Math.min(rect.w, rect.h) * 0.24;
        ctx.fillStyle = "#EBC7A0";
        ctx.beginPath();
        ctx.arc(rect.x + (tiny ? rect.w * 0.5 : pad + r), rect.y + rect.h * 0.5, r, 0, Math.PI * 2);
        ctx.fill();
        if (!tiny) {
          ctx.fillStyle = "#FDF6E9";
          ctx.font = `700 ${compact ? 13 : 18}px "Noto Sans SC", sans-serif`;
          ctx.fillText(copy.title, rect.x + pad * 2 + r * 2, rect.y + rect.h * 0.48);
          if (!compact) {
            ctx.fillStyle = "#EBC7A0";
            ctx.font = `500 11px "Noto Sans SC", sans-serif`;
            ctx.fillText(copy.sub, rect.x + pad * 2 + r * 2, rect.y + rect.h * 0.48 + 18);
          }
        }
      } else {
        if (!tiny) {
          ctx.fillStyle = "#FDF6E9";
          ctx.font = `700 ${compact ? 11.5 : 13.5}px "Noto Sans SC", sans-serif`;
          ctx.fillText(copy.title, rect.x + pad, rect.y + pad + 12);
        }
        ctx.strokeStyle = "#FF9A4D";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        const topOff = tiny ? pad : pad + 18;
        const pts = [0.78, 0.65, 0.5, 0.58, 0.36, 0.22];
        pts.forEach((p, idx) => {
          const px = rect.x + pad + (idx / (pts.length - 1)) * (rect.w - pad * 2);
          const py = rect.y + topOff + p * Math.max(12, rect.h - topOff - pad - (showCornerBadge ? 16 : 4));
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
    } else if (b.id === "text") {
      ctx.fillStyle = PALETTE.plum;
      const barH = tiny ? 5 : 9;
      ctx.fillRect(rect.x + pad, rect.y + pad, Math.min(rect.w - pad * 2, rect.w * 0.56), barH);
      const lineY0 = rect.y + pad + barH + (tiny ? 6 : 10);
      const lineStep = tiny ? 7 : 11;
      const bottomLimit = rect.y + rect.h - (showCornerBadge ? 22 : pad);
      const lines = Math.max(2, Math.floor((bottomLimit - lineY0) / lineStep));
      ctx.fillStyle = issue.fitProblem ? PALETTE.err : "#523D54";
      for (let i = 0; i < Math.min(lines, 6); i++) {
        const lw = (rect.w - pad * 2) * (i === lines - 1 ? 0.62 : 0.92);
        ctx.fillRect(rect.x + pad, lineY0 + i * lineStep, Math.max(8, lw), tiny ? 2.5 : 3);
      }
    } else if (b.id === "quote") {
      ctx.fillStyle = PALETTE.orange;
      ctx.font = `800 ${tiny ? 20 : 28}px "Syne", sans-serif`;
      ctx.fillText("“", rect.x + pad, rect.y + pad + (tiny ? 16 : 22));
      if (!compact) {
        ctx.fillStyle = PALETTE.plum;
        ctx.font = `700 13px "Noto Sans SC", sans-serif`;
        ctx.fillText(copy.title, rect.x + pad + 20, rect.y + pad + 20);
        if (rect.h > 88) {
          ctx.fillStyle = PALETTE.inkSoft;
          ctx.font = `500 10.5px "JetBrains Mono", monospace`;
          ctx.fillText(copy.sub, rect.x + pad, rect.y + rect.h - 24);
        }
      } else {
        // 紧凑块用两条干净引文横线代替被截断的汉字
        ctx.fillStyle = "#523D54";
        const lx = rect.x + pad + (tiny ? 16 : 22);
        const lw = Math.max(10, rect.x + rect.w - pad - lx);
        ctx.fillRect(lx, rect.y + pad + 8, lw, 3);
        ctx.fillRect(lx, rect.y + pad + 16, lw * 0.72, 3);
      }
    } else if (b.id === "data") {
      ctx.fillStyle = PALETTE.plum;
      const numFs = tiny ? 13 : compact ? 17 : Math.min(26, Math.round(rect.w * 0.2));
      ctx.font = `700 ${numFs}px "JetBrains Mono", monospace`;
      ctx.fillText(copy.value, rect.x + pad, rect.y + pad + numFs);
      if (!compact) {
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.font = `500 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(copy.label, rect.x + pad, rect.y + pad + numFs + 17);
        // 宽裕块才在左下角标上方留位画原海报三圆点
        const dotY = rect.y + rect.h - 26;
        if (dotY > rect.y + pad + numFs + 22) {
          for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i === 0 ? PALETTE.orange : PALETTE.plum;
            ctx.beginPath();
            ctx.arc(rect.x + pad + 4 + i * 11, dotY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else {
      // 原海报四圆点徽章母题
      const r = Math.max(2.4, Math.min(6.5, Math.min(rect.w, rect.h) * 0.085));
      const cx = rect.x + (compact ? rect.w * 0.5 : pad + r * 2.4);
      const cy = rect.y + (showCornerBadge ? (rect.h - 14) * 0.5 : rect.h * 0.5);
      ctx.fillStyle = PALETTE.plum;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(cx + ox * r * 1.5, cy + oy * r * 1.5, r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (!compact && rect.w > 130) {
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.fillText(copy.title, cx + r * 4, cy + 4);
      }
    }

    // 3. 左下跨格角标（仅当块够宽够高，确保零遮挡）
    const spanText = `${Number.isInteger(b.w) ? b.w : b.w.toFixed(1)}×${Number.isInteger(b.h) ? b.h : b.h.toFixed(1)}`;
    if (showCornerBadge) {
      ctx.font = `600 10px "JetBrains Mono", monospace`;
      const badgeW = ctx.measureText(spanText).width + 8;
      ctx.fillStyle = def.tone === "plum" ? "rgba(253,246,233,0.18)" : "rgba(52,32,57,0.12)";
      ctx.fillRect(rect.x + 4, rect.y + rect.h - 18, badgeW, 14);
      ctx.fillStyle = fg;
      ctx.fillText(spanText, rect.x + 8, rect.y + rect.h - 7.5);
    }

    // 4. 右上错态提示：宽裕大块显示红签，紧凑小块仅显示一枚极克制的赤红感叹号圆章，杜绝遮挡块内文字！
    const showInlineWarn = (issue.fitProblem || issue.isOff) && rect.w >= 136 && rect.h >= 94;
    if (issue.fitProblem || issue.isOff) {
      const warn = issue.fitProblem || `+${issue.off.toFixed(2)}X`;
      if (showInlineWarn) {
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(warn).width + 10;
        ctx.fillStyle = PALETTE.err;
        ctx.fillRect(rect.x + rect.w - tw - 4, rect.y + 4, tw, 16);
        ctx.fillStyle = "#FFFDF8";
        ctx.fillText(warn, rect.x + rect.w - tw + 1, rect.y + 15.5);
      } else {
        ctx.fillStyle = PALETTE.err;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w - 9, rect.y + 9, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFDF8";
        ctx.font = `700 9.5px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText("!", rect.x + rect.w - 9, rect.y + 12.5);
        ctx.textAlign = "left";
      }
    }

    ctx.restore();

    // 5. 外描边与右下角橘色跨格缩放手柄
    if (issue.overlap || issue.isOff || issue.fitProblem) {
      ctx.save();
      ctx.strokeStyle = PALETTE.err;
      ctx.lineWidth = isSelected ? 2.4 : 1.5;
      ctx.setLineDash(issue.isOff ? [5, 3] : []);
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
      ctx.restore();
    } else if (isSelected) {
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    } else {
      ctx.strokeStyle = "rgba(52, 32, 57, 0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    }

    const hs = isSelected ? 14 : 9;
    ctx.fillStyle = isSelected ? PALETTE.orange : "rgba(213, 90, 7, 0.68)";
    ctx.fillRect(rect.x + rect.w - hs, rect.y + rect.h - hs, hs, hs);
    ctx.strokeStyle = "#FFFDF8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w - hs + 3.5, rect.y + rect.h - 3.5);
    ctx.lineTo(rect.x + rect.w - 3.5, rect.y + rect.h - hs + 3.5);
    ctx.stroke();

    // 6. 仅当未显示块内红签时，在选中块正下方（空旷区）显示一枚简洁浮标，不重复、不压左上方邻居块
    if (isSelected && (issue.fitProblem || issue.isOff) && !showInlineWarn && cssW >= 340) {
      const label = cssW < 520 ? `${issue.fitProblem || `+${issue.off.toFixed(2)}X`}` : `${def.name} · ${issue.fitProblem || `+${issue.off.toFixed(2)}X`}`;
      ctx.save();
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      const lw = ctx.measureText(label).width + 12;
      const lx = Math.max(geom.ox, Math.min(geom.ox + geom.matrixW - lw, rect.x + rect.w / 2 - lw / 2));
      const belowY = rect.y + rect.h + 5;
      const ly = belowY + 18 <= geom.oy + geom.matrixH + 8 ? belowY : Math.max(geom.oy + 2, rect.y - 22);
      ctx.fillStyle = PALETTE.err;
      ctx.fillRect(lx, ly, lw, 18);
      ctx.fillStyle = "#FFFDF8";
      ctx.fillText(label, lx + 6, ly + 12.5);
      ctx.restore();
    }
  }

  function render(t, dt, { still }) {
    syncSize();
    if (!still && introProgress < 1) {
      introProgress = Math.min(1, introProgress + (dt > 0 ? dt / 0.55 : 0.04));
      dirty = true;
    } else if (still) {
      introProgress = 1;
    }
    if (!dirty && !drag) return;
    dirty = false;

    const state = getState();
    const ev = getEval();
    const sceneData = SCENE_THEMES[state.scene] || SCENE_THEMES.poster;
    geom = computeMatrixGeometry(cssW, cssH, state.cols, state.rows, state.gutterFrac, getPad());
    ensureGridBackdrop(state, ev);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.scale(dpr, dpr);

    // 3. 拖动时绘出目标吸附幽灵框（反馈极直观）
    if (drag && drag.active && state.snap) {
      const tb = state.blocks.find((b) => b.id === drag.id);
      if (tb) {
        const snapped = {
          x: Math.max(0, Math.min(state.cols - Math.round(tb.w), Math.round(tb.x))),
          y: Math.max(0, Math.min(state.rows - Math.round(tb.h), Math.round(tb.y))),
          w: Math.max(1, Math.min(state.cols, Math.round(tb.w))),
          h: Math.max(1, Math.min(state.rows, Math.round(tb.h))),
        };
        const sr = blockToRect(snapped, geom);
        ctx.save();
        ctx.fillStyle = PALETTE.orangeSoft;
        ctx.strokeStyle = PALETTE.orange;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.fillRect(sr.x, sr.y, sr.w, sr.h);
        ctx.strokeRect(sr.x, sr.y, sr.w, sr.h);
        ctx.restore();
      }
    }

    // 4. 绘制 5 块活体内容模块（入场时轻缓展开）
    const ease = 1 - (1 - introProgress) ** 3;
    const list = orderedBlocks(state);
    for (let idx = 0; idx < list.length; idx++) {
      const b = list[idx];
      const rect = blockToRect(b, geom);
      const liftY = (1 - ease) * (10 + idx * 3);
      const drawRect = { x: rect.x, y: rect.y + liftY, w: rect.w, h: rect.h };
      drawBlockContent(b, drawRect, sceneData, ev.blockIssues[b.id], b.id === state.selectedId);
    }

    // 5. 若存在重叠撞车，画赤红斜线告警区
    if (ev.overlaps.length > 0) {
      ctx.save();
      for (const ov of ev.overlaps) {
        const r = blockToRect(ov, geom);
        ctx.fillStyle = "rgba(184, 41, 20, 0.28)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.w, r.y + r.h);
        ctx.moveTo(r.x + r.w, r.y);
        ctx.lineTo(r.x, r.y + r.h);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. 中央光学重心平衡区与当前加权重心标记（直观解释原则⑤ 视觉平衡）
    ctx.save();
    const midX = geom.ox + geom.matrixW * 0.5;
    const midY = geom.oy + geom.matrixH * 0.5;
    const boxW = geom.matrixW * 0.24;
    const boxH = geom.matrixH * 0.24;
    ctx.strokeStyle = ev.principles[4].ok ? "rgba(28, 107, 84, 0.45)" : "rgba(184, 41, 20, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);
    ctx.setLineDash([]);

    const gxPx = geom.ox + ev.metrics.gx * geom.matrixW;
    const gyPx = geom.oy + ev.metrics.gy * geom.matrixH;
    ctx.strokeStyle = ev.principles[4].ok ? PALETTE.ok : PALETTE.err;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(gxPx, gyPx);
    ctx.stroke();

    ctx.fillStyle = ev.principles[4].ok ? PALETTE.ok : PALETTE.err;
    ctx.beginPath();
    ctx.arc(gxPx, gyPx, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFDF8";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
  };
}
