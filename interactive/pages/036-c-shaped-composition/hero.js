// 036 C形构图 · 开场主角玩具「C 弧抱环·开口定向台」2D Canvas 引擎
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  THEMES,
  clamp,
  normDeg,
  circleRadiiUV,
  computeBlockerGeometry,
  evaluate,
} from "./model.js";

const DEG = Math.PI / 180;

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 510;
  let dpr = 1;
  let dragMode = null; // "wrap" | "focus" | "open" | "center"
  let dragStartX = 0;
  let dragStartWrap = 225;
  let hoverPart = null;
  let introProgress = 0;
  let introDone = false;
  let uiPending = false;
  let lastUiSync = 0;

  function scheduleChange(immediate = false) {
    if (immediate || reducedMotion.matches) {
      uiPending = false;
      onChange(true);
      controller.draw();
      return;
    }
    uiPending = true;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return false;
    dpr = pixelRatio(rect.width < 520 ? 1.5 : 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    cssW = rect.width;
    cssH = rect.height;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    return false;
  }

  function getAspect() {
    return cssW / Math.max(1, cssH);
  }

  function uvToPx(u, v) {
    return { x: u * cssW, y: v * cssH };
  }

  function getHandles() {
    const aspect = getAspect();
    const { ru, rv } = circleRadiiUV(aspect);
    const shortPx = Math.min(cssW, cssH);
    const R = shortPx * 0.305;
    const cx = state.arcCenter.u * cssW;
    const cy = state.arcCenter.v * cssH;
    const fx = state.focus.u * cssW;
    const fy = state.focus.v * cssH;

    // 蓝色开口导向手柄（放在开口偏上外侧轨道，既呼应原海报右上「开口导向」，又永不遮挡挡口块文字）
    const openHandleDeg = state.blockerOn ? normDeg(state.openDeg - 38) : normDeg(state.openDeg);
    const openRad = openHandleDeg * DEG;
    const openDist = Math.min(R * 1.46, Math.max(R * 1.12, Math.min(cssW, cssH) * 0.41));
    const ox = clamp(cx + Math.cos(openRad) * openDist, 42, cssW - 42);
    const oy = clamp(cy + Math.sin(openRad) * openDist, 46, cssH - 46);

    // 弧脊白色定位锚环（弧背中点外缘，用于平移弧心）
    const spineRad = normDeg(state.openDeg + 180) * DEG;
    const sx = clamp(cx + Math.cos(spineRad) * (R * 1.24), 24, cssW - 24);
    const sy = clamp(cy + Math.sin(spineRad) * (R * 1.24), 24, cssH - 24);

    // 挡口块
    const blk = computeBlockerGeometry(state, aspect);
    const bx = blk.u * cssW;
    const by = blk.v * cssH;
    const bw = blk.halfU * 2 * cssW;
    const bh = blk.halfV * 2 * cssH;

    return { R, ru, rv, cx, cy, fx, fy, ox, oy, sx, sy, bx, by, bw, bh };
  }

  function hitTest(px, py) {
    const h = getHandles();
    if (state.blockerOn) {
      if (Math.abs(px - h.bx) <= h.bw * 0.56 && Math.abs(py - h.by) <= h.bh * 0.56) {
        return "blocker";
      }
    }
    if (Math.hypot(px - h.ox, py - h.oy) <= 30) return "open";
    const focusR = Math.max(30, h.R * 0.48);
    if (Math.hypot(px - h.fx, py - h.fy) <= focusR) return "focus";
    if (Math.hypot(px - h.sx, py - h.sy) <= 24) return "center";
    return "wrap";
  }

  function localXY(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function applyMove(px, py) {
    if (!dragMode) return;
    const aspect = getAspect();
    if (dragMode === "wrap") {
      const dx = px - dragStartX;
      // 灵敏而顺滑的横拖包裹角调节
      const next = clamp(Math.round(dragStartWrap + dx * 0.65), 65, 350);
      if (next !== state.wrapDeg) {
        state.wrapDeg = next;
        scheduleChange();
      }
    } else if (dragMode === "focus") {
      let u = clamp(px / cssW, 0.08, 0.92);
      let v = clamp(py / cssH, 0.1, 0.9);
      // 靠近弧心轻吸附，体验细腻
      const { ru, rv } = circleRadiiUV(aspect);
      const distNorm = Math.hypot((u - state.arcCenter.u) / ru, (v - state.arcCenter.v) / rv);
      if (distNorm < 0.12) {
        u = state.arcCenter.u;
        v = state.arcCenter.v;
      }
      state.focus.u = u;
      state.focus.v = v;
      scheduleChange();
    } else if (dragMode === "open") {
      const cx = state.arcCenter.u * cssW;
      const cy = state.arcCenter.v * cssH;
      const offsetComp = state.blockerOn ? 38 : 0;
      let deg = Math.round(normDeg((Math.atan2(py - cy, px - cx) * 180) / Math.PI + offsetComp));
      // 在 0 / 90 / 180 / 270 四个正方位轻微吸附（±4°）
      for (const snap of [0, 90, 180, 270]) {
        if (Math.abs(((deg - snap + 540) % 360) - 180) <= 4) {
          deg = snap;
          break;
        }
      }
      state.openDeg = deg;
      scheduleChange();
    } else if (dragMode === "center") {
      const u = clamp(px / cssW, 0.24, 0.76);
      const v = clamp(py / cssH, 0.28, 0.72);
      // 平移弧心时若焦点已在怀内则保持相对偏移，方便整体挪位；脱抱时只挪弧心
      const prevU = state.arcCenter.u;
      const prevV = state.arcCenter.v;
      const ev = evaluate(state, aspect);
      state.arcCenter.u = u;
      state.arcCenter.v = v;
      if (ev.focusOffsetRatio <= 0.42) {
        state.focus.u = clamp(state.focus.u + (u - prevU), 0.1, 0.9);
        state.focus.v = clamp(state.focus.v + (v - prevV), 0.12, 0.88);
      }
      scheduleChange();
    }
  }

  // Pointer 事件（桌面鼠标 + 现代触控）
  canvas.addEventListener("pointerdown", (e) => {
    const p = localXY(e.clientX, e.clientY);
    const hit = hitTest(p.x, p.y);
    if (hit === "blocker") {
      state.blockerOn = false;
      onChange();
      return;
    }
    dragMode = hit;
    dragStartX = p.x;
    dragStartWrap = state.wrapDeg;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    if (dragMode !== "wrap") applyMove(p.x, p.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = localXY(e.clientX, e.clientY);
    if (dragMode) {
      applyMove(p.x, p.y);
      return;
    }
    const hit = hitTest(p.x, p.y);
    if (hit !== hoverPart) {
      hoverPart = hit;
      canvas.style.cursor =
        hit === "blocker" ? "pointer" : hit === "wrap" ? "ew-resize" : "grab";
    }
  });

  const endDrag = () => {
    const wasDragging = Boolean(dragMode);
    dragMode = null;
    if (wasDragging && uiPending) {
      uiPending = false;
      onChange(true);
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 原生 Touch 兜底，确保 CDP dispatchTouchEvent（perf.mjs）绝对触发实时重绘
  let touchStartY = 0;
  let touchLocked = false;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const p = localXY(t.clientX, t.clientY);
      const hit = hitTest(p.x, p.y);
      touchStartY = p.y;
      touchLocked = false;
      if (hit === "blocker") {
        state.blockerOn = false;
        onChange();
        return;
      }
      dragMode = hit;
      dragStartX = p.x;
      dragStartWrap = state.wrapDeg;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragMode || !e.touches.length) return;
      const t = e.touches[0];
      const p = localXY(t.clientX, t.clientY);
      if (dragMode === "wrap" && !touchLocked) {
        const dx = Math.abs(p.x - dragStartX);
        const dy = Math.abs(p.y - touchStartY);
        if (dy > dx + 8) {
          dragMode = null; // 放行竖向滚屏
          return;
        }
        if (dx > 3) touchLocked = true;
      }
      if (e.cancelable) e.preventDefault();
      applyMove(p.x, p.y);
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", endDrag, { passive: true });
  canvas.addEventListener("touchcancel", endDrag, { passive: true });

  // 键盘可访问操作
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.wrapDeg = clamp(state.wrapDeg - 8, 65, 350);
      onChange();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.wrapDeg = clamp(state.wrapDeg + 8, 65, 350);
      onChange();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.openDeg = normDeg(state.openDeg - 15);
      onChange();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.openDeg = normDeg(state.openDeg + 15);
      onChange();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      state.blockerOn = !state.blockerOn;
      onChange();
    }
  });

  // 绘图辅助：画圆角矩形
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // 绘图辅助：原海报四枚骑脊小图标
  function drawBadgeIcon(kind, x, y, r, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.8, r * 0.14);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const s = r * 0.44;
    if (kind === "enclose") {
      // 四角取景框 [ ]
      const c = s * 0.42;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s + c); ctx.lineTo(x - s, y - s); ctx.lineTo(x - s + c, y - s);
      ctx.moveTo(x + s - c, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s, y - s + c);
      ctx.moveTo(x - s, y + s - c); ctx.lineTo(x - s, y + s); ctx.lineTo(x - s + c, y + s);
      ctx.moveTo(x + s - c, y + s); ctx.lineTo(x + s, y + s); ctx.lineTo(x + s, y + s - c);
      ctx.stroke();
    } else if (kind === "hold") {
      // 简约眼睛
      ctx.beginPath();
      ctx.moveTo(x - s * 1.15, y);
      ctx.quadraticCurveTo(x, y - s * 0.95, x + s * 1.15, y);
      ctx.quadraticCurveTo(x, y + s * 0.95, x - s * 1.15, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "soft") {
      // 微笑柔弧 ◡
      ctx.beginPath();
      ctx.arc(x, y - s * 0.1, s * 0.82, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      // 节奏点箭 •••→
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(x - s * 0.55 + i * s * 0.38, y + s * 0.35 - i * s * 0.28, r * 0.085, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y - s * 0.45);
      ctx.lineTo(x + s * 0.85, y - s * 0.45);
      ctx.lineTo(x + s * 0.62, y - s * 0.15);
      ctx.moveTo(x + s * 0.85, y - s * 0.45);
      ctx.lineTo(x + s * 0.58, y - s * 0.72);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 画箭头尖
  function drawArrowHead(x, y, angRad, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angRad);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size * 0.65, 0);
    ctx.lineTo(-size * 0.55, -size * 0.46);
    ctx.lineTo(-size * 0.25, 0);
    ctx.lineTo(-size * 0.55, size * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 绘制背景皮层（三种真实题材）
  function drawThemeBackdrop(ev, h, t) {
    const theme = state.theme;
    if (theme === "poster") {
      ctx.fillStyle = "#D4EAFC";
      ctx.fillRect(0, 0, cssW, cssH);
      // 极轻的光学极坐标底纹（呼应构图图谱）
      ctx.save();
      ctx.strokeStyle = "rgba(53, 118, 196, 0.12)";
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(h.cx, h.cy, h.R * (0.62 + k * 0.42), 0, Math.PI * 2);
        ctx.stroke();
      }
      // 十字准线（极轻）
      ctx.beginPath();
      ctx.moveTo(0, h.cy); ctx.lineTo(cssW, h.cy);
      ctx.moveTo(h.cx, 0); ctx.lineTo(h.cx, cssH);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (theme === "lighthouse") {
      // 清透海天渐变
      const skyGrad = ctx.createLinearGradient(0, 0, 0, cssH);
      skyGrad.addColorStop(0, "#C7E4FC");
      skyGrad.addColorStop(0.56, "#E3F2FE");
      skyGrad.addColorStop(0.565, "#9BC6ED");
      skyGrad.addColorStop(1, "#6CA4DA");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // 远处海平线与微光
      const horizonY = cssH * 0.56;
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(cssW, horizonY);
      ctx.stroke();

      // 开口开阔方向画一艘远方小白帆，强化故事延伸感
      const openRad = normDeg(state.openDeg) * DEG;
      const sailX = clamp(h.cx + Math.cos(openRad) * h.R * 1.85, 36, cssW - 36);
      const sailY = horizonY - 4;
      if (ev.openMarginPct >= 24 && !state.blockerOn && ev.wrapDeg <= 290) {
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(sailX, sailY - 22);
        ctx.lineTo(sailX + 13, sailY);
        ctx.lineTo(sailX - 4, sailY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1D549B";
        ctx.fillRect(sailX - 7, sailY, 22, 4);
        ctx.restore();
      }

      // 海面波纹（极简、慢速）
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.34)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const wy = horizonY + 18 + i * ((cssH - horizonY - 24) / 6);
        const shift = Math.sin(t * 0.8 + i) * 6;
        ctx.beginPath();
        ctx.moveTo(cssW * 0.08 + shift, wy);
        ctx.lineTo(cssW * 0.34 + shift, wy);
        ctx.moveTo(cssW * 0.58 - shift, wy + 5);
        ctx.lineTo(cssW * 0.9 - shift, wy + 5);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // exhibition：展讯海报纸面与排字网格
    ctx.fillStyle = "#EEF6FD";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.strokeStyle = "rgba(53, 118, 196, 0.14)";
    ctx.lineWidth = 1;
    const cols = 8;
    for (let i = 1; i < cols; i++) {
      const gx = (cssW / cols) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 14);
      ctx.lineTo(gx, cssH - 14);
      ctx.stroke();
    }
    // 展讯开口处排字走廊示意
    const openRad = normDeg(state.openDeg) * DEG;
    const tx = clamp(h.cx + Math.cos(openRad) * h.R * 1.68, 72, cssW - 96);
    const ty = clamp(h.cy + Math.sin(openRad) * h.R * 1.15, 58, cssH - 64);
    const squeezed = ev.openMarginPct < 24 || state.blockerOn || ev.wrapDeg > 290;
    ctx.fillStyle = squeezed ? "rgba(185, 28, 28, 0.14)" : "rgba(255, 255, 255, 0.82)";
    ctx.strokeStyle = squeezed ? "#B91C1C" : "#3576C4";
    ctx.lineWidth = 1.2;
    roundRect(tx - 62, ty - 34, 124, 68, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = squeezed ? "#B91C1C" : "#0B1622";
    ctx.font = `700 11px "Space Mono", monospace`;
    ctx.textAlign = "left";
    ctx.fillText("OCT 14 — NOV 30", tx - 52, ty - 14);
    ctx.font = `800 13px "Noto Sans SC", sans-serif`;
    ctx.fillText(squeezed ? "排字区被挤爆" : "弧光当代展", tx - 52, ty + 6);
    ctx.fillStyle = squeezed ? "#B91C1C" : "#3B526B";
    ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
    ctx.fillText(squeezed ? "缺少开口留白" : "开口余白导览区", tx - 52, ty + 23);
    ctx.restore();
  }

  // 绘制 036 核心 C 弧（含外层白色细箭弧、橙色渐变厚弧带、白边橙点、骑脊四圆徽）
  function drawCArc(ev, h, reveal) {
    const effWrap = Math.max(30, ev.wrapDeg * reveal);
    const gapRad = ((360 - effWrap) * DEG) / 2;
    const openRad = ev.openDeg * DEG;
    const startRad = openRad + gapRad;
    const endRad = openRad + Math.PI * 2 - gapRad;

    const arcWidth = Math.max(18, h.R * 0.29);
    const isErrArc = ev.wrapDeg > 290 || ev.wrapDeg < 150;
    const highlightArc = state.highlightKey === "enclose" || state.highlightKey === "flow";

    // 1. 最外层纯白细弧带 + 顺流白色箭头（1:1 复刻原海报外层白弧）
    const whiteR = h.R + arcWidth * 0.92;
    ctx.save();
    ctx.strokeStyle = state.theme === "lighthouse" ? "rgba(255,255,255,0.92)" : "#FFFFFF";
    ctx.lineWidth = Math.max(5.5, h.R * 0.068);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, whiteR, startRad - 0.04, endRad + 0.04, false);
    ctx.stroke();

    // 白色外弧终点箭头（沿弧切线指向开口）
    const tipX = h.cx + Math.cos(endRad + 0.04) * whiteR;
    const tipY = h.cy + Math.sin(endRad + 0.04) * whiteR;
    drawArrowHead(tipX, tipY, endRad + Math.PI / 2, Math.max(12, h.R * 0.13), "#FFFFFF");
    ctx.restore();

    // 2. 主体宽 C 弧带（忠实原海报橙红 → 柔和桃杏渐变）
    ctx.save();
    const midRad = openRad + Math.PI;
    const gStart = { x: h.cx + Math.cos(midRad) * h.R, y: h.cy + Math.sin(midRad) * h.R };
    const gEnd = { x: h.cx + Math.cos(openRad) * h.R, y: h.cy + Math.sin(openRad) * h.R };
    const grad = ctx.createLinearGradient(gStart.x, gStart.y, gEnd.x, gEnd.y);
    if (state.theme === "lighthouse") {
      grad.addColorStop(0, isErrArc ? "#C93B2B" : "#E87A48");
      grad.addColorStop(0.68, isErrArc ? "#D96659" : "#F3A982");
      grad.addColorStop(1, "rgba(245, 174, 148, 0.35)");
    } else if (isErrArc) {
      grad.addColorStop(0, "#C73222");
      grad.addColorStop(0.62, "#E46A4D");
      grad.addColorStop(1, "rgba(240, 148, 128, 0.55)");
    } else {
      grad.addColorStop(0, "#EA6B37");
      grad.addColorStop(0.62, "#FA8252");
      grad.addColorStop(1, "rgba(245, 174, 148, 0.28)");
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = arcWidth;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.R, startRad, endRad, false);
    ctx.stroke();

    if (highlightArc) {
      ctx.strokeStyle = "#1D549B";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(h.cx, h.cy, h.R, startRad, endRad, false);
      ctx.stroke();
    }
    ctx.restore();

    // 3. 弧内同心细蓝虚线轨道（1:1 承袭原海报内层细蓝虚环）
    ctx.save();
    ctx.strokeStyle = ev.wrapDeg > 290 ? "rgba(185, 28, 28, 0.5)" : "rgba(53, 118, 196, 0.52)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.R * 0.72, startRad + 0.08, endRad - 0.08, false);
    ctx.stroke();
    ctx.restore();

    // 4. 弧背白色锚环（可拖动平移弧心）
    ctx.save();
    ctx.fillStyle = "#EA6B37";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(h.sx, h.sy, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 微小提示字放在锚环下方避免与左上脱抱焦点撞车
    ctx.fillStyle = "#1D549B";
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    const lblX = clamp(h.sx - 2, 28, cssW - 28);
    const lblY = clamp(h.sy + 21, 18, cssH - 10);
    ctx.fillText("拖移弧心", lblX, lblY);
    ctx.restore();

    // 5. 骑跨在 C 弧外脊上的四枚原海报白底橙框大圆徽（随包裹角与开口实时分布！）
    const badgeKinds = ["enclose", "hold", "soft", "flow"];
    const checkStates = [ev.checks.enclose.ok, ev.checks.hold.ok, ev.checks.soft.ok, ev.checks.flow.ok];
    const badgeR = clamp(h.R * 0.165, 13, 21);
    const badgeTrackR = h.R + arcWidth * 0.54;
    const totalArcSpan = endRad - startRad;
    if (totalArcSpan > 0.9) {
      for (let i = 0; i < 4; i++) {
        // 沿弧背均匀排布在 20% ~ 80% 弧程上（避开渐隐两端）
        const frac = 0.2 + (i / 3) * 0.6;
        // 逆序让顶部先是包裹主体，向下是视觉停留、柔性框架、节奏引导
        const ang = endRad - frac * totalArcSpan;
        const bx = h.cx + Math.cos(ang) * badgeTrackR;
        const by = h.cy + Math.sin(ang) * badgeTrackR;
        const ok = checkStates[i];

        ctx.save();
        ctx.fillStyle = "rgba(11, 22, 34, 0.08)";
        ctx.beginPath();
        ctx.arc(bx, by + 2, badgeR + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = ok ? "#11694E" : "#EA6B37";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        drawBadgeIcon(badgeKinds[i], bx, by, badgeR, ok ? "#11694E" : "#D64916");
        ctx.restore();
      }
    }
  }

  // 绘制 6 条原海报放射蓝虚线箭头 + 开口导向拖柄 + 挡口块
  function drawApertureAndRays(ev, h, t) {
    // 1. 6 束放射虚线箭
    if (state.showRays) {
      ctx.save();
      const dashOffset = -(t * 22) % 16;
      for (const ray of ev.rays) {
        const p0 = uvToPx(ray.startU, ray.startV);
        const p1 = uvToPx(ray.endU, ray.endV);
        const isBad = ray.status !== "clear";
        const col = isBad ? "#B91C1C" : state.highlightKey === "open" ? "#0B1622" : "#3173C6";
        ctx.strokeStyle = col;
        ctx.lineWidth = state.highlightKey === "open" ? 2.2 : 1.7;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = isBad ? 0 : dashOffset;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        ctx.setLineDash([]);
        if (ray.status === "wall" || ray.status === "blocked") {
          // 撞壁/遇堵：画出反弹小叉标
          ctx.strokeStyle = "#B91C1C";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p1.x - 4, p1.y - 4); ctx.lineTo(p1.x + 4, p1.y + 4);
          ctx.moveTo(p1.x + 4, p1.y - 4); ctx.lineTo(p1.x - 4, p1.y + 4);
          ctx.stroke();
        } else if (ray.status === "choked") {
          ctx.fillStyle = "#B91C1C";
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawArrowHead(p1.x, p1.y, ang, 10, col);
        }
      }
      ctx.restore();
    }

    // 2. 挡口抢戏块（可点击一键清除）
    if (state.blockerOn) {
      const th = THEMES[state.theme];
      ctx.save();
      const x = h.bx - h.bw / 2;
      const y = h.by - h.bh / 2;
      ctx.fillStyle = "rgba(255, 241, 242, 0.94)";
      ctx.strokeStyle = "#B91C1C";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      roundRect(x, y, h.bw, h.bh, 10);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // 内部淡斜纹
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(185, 28, 28, 0.12)";
      ctx.lineWidth = 4;
      for (let sx = x - h.bh; sx < x + h.bw + h.bh; sx += 14) {
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + h.bh, y + h.bh);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = "#991B1B";
      ctx.textAlign = "center";
      ctx.font = `800 ${clamp(h.bw * 0.13, 11, 14)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(th.blockerTitle, h.bx, h.by - 4);
      ctx.font = `600 ${clamp(h.bw * 0.1, 10, 11.5)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(th.blockerSub, h.bx, h.by + 13);
      ctx.restore();
    }

    // 3. 晴空蓝「开口导向」旋转手柄（去掉昂贵 shadowBlur，用清爽轻量双环）
    ctx.save();
    const openBad = !ev.checks.soft.ok;
    const handleCol = openBad ? "#B91C1C" : "#3576C4";
    ctx.fillStyle = "rgba(11, 22, 34, 0.1)";
    ctx.beginPath();
    ctx.arc(h.ox, h.oy + 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = handleCol;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(h.ox, h.oy, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 手柄内方向箭
    const rad = ev.openDeg * DEG;
    ctx.strokeStyle = handleCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(h.ox - Math.cos(rad) * 6, h.oy - Math.sin(rad) * 6);
    ctx.lineTo(h.ox + Math.cos(rad) * 5, h.oy + Math.sin(rad) * 5);
    ctx.stroke();
    drawArrowHead(h.ox + Math.cos(rad) * 7, h.oy + Math.sin(rad) * 7, rad, 8.5, handleCol);

    // 开口标签胶囊
    const lblText = `旋开口 ${ev.openDeg}°`;
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(lblText).width + 14;
    const lx = clamp(h.ox - tw / 2, 8, cssW - tw - 8);
    const ly = h.oy > cssH - 42 ? h.oy - 42 : h.oy + 22;
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.strokeStyle = handleCol;
    ctx.lineWidth = 1.2;
    roundRect(lx, ly, tw, 21, 999);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = openBad ? "#B91C1C" : "#1D549B";
    ctx.textAlign = "center";
    ctx.fillText(lblText, lx + tw / 2, ly + 14.5);
    ctx.restore();
  }

  // 绘制视觉焦点大圆（按三种题材分别绘制原海报星芒圆 / 灯塔 / 雕塑）
  function drawFocusSubject(ev, h) {
    const fR = clamp(h.R * 0.48, 30, 62);
    const escaped = !ev.checks.hold.ok;

    // 焦点归怀目标虚线圈（当焦点偏离弧心时提示应归回弧怀）
    if (escaped) {
      ctx.save();
      ctx.strokeStyle = "rgba(17, 105, 78, 0.55)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(h.cx, h.cy, fR * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#11694E";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("弧怀焦点位", h.cx, h.cy + 4);

      // 焦点到弧心的偏差虚线
      ctx.strokeStyle = "rgba(185, 28, 28, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(h.fx, h.fy);
      ctx.lineTo(h.cx, h.cy);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    // 焦点外光环高亮
    if (state.highlightKey === "hold" || escaped) {
      ctx.strokeStyle = escaped ? "#B91C1C" : "#11694E";
      ctx.lineWidth = 2.6;
      ctx.setLineDash(escaped ? [5, 4] : []);
      ctx.beginPath();
      ctx.arc(h.fx, h.fy, fR + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 主体大圆底（去掉 shadowBlur，用柔和底晕零开销）
    ctx.fillStyle = "rgba(184, 59, 10, 0.13)";
    ctx.beginPath();
    ctx.arc(h.fx, h.fy + 3, fR + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = escaped ? "#C93524" : "#EA6B37";
    ctx.beginPath();
    ctx.arc(h.fx, h.fy, fR, 0, Math.PI * 2);
    ctx.fill();

    if (state.theme === "lighthouse") {
      // 孤岛灯塔剪影（无五官纯建筑几何）
      ctx.fillStyle = "#FFF8F3";
      ctx.beginPath();
      ctx.moveTo(h.fx - fR * 0.24, h.fy + fR * 0.42);
      ctx.lineTo(h.fx - fR * 0.14, h.fy - fR * 0.34);
      ctx.lineTo(h.fx + fR * 0.14, h.fy - fR * 0.34);
      ctx.lineTo(h.fx + fR * 0.24, h.fy + fR * 0.42);
      ctx.closePath();
      ctx.fill();
      // 灯塔橙条纹与塔顶灯罩
      ctx.fillStyle = "#1D549B";
      ctx.fillRect(h.fx - fR * 0.19, h.fy - fR * 0.04, fR * 0.38, fR * 0.15);
      ctx.beginPath();
      ctx.arc(h.fx, h.fy - fR * 0.42, fR * 0.14, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${clamp(fR * 0.22, 10, 12.5)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("孤岛灯塔", h.fx, h.fy + fR * 0.72);
    } else if (state.theme === "exhibition") {
      // 抽象雕塑双弧造型
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(h.fx - fR * 0.34, h.fy + fR * 0.24, fR * 0.68, fR * 0.14);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = Math.max(4, fR * 0.14);
      ctx.beginPath();
      ctx.arc(h.fx, h.fy - fR * 0.08, fR * 0.28, 0.3 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();
      ctx.font = `700 ${clamp(fR * 0.22, 10, 12.5)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("主雕塑", h.fx, h.fy + fR * 0.66);
    } else {
      // 原海报白色四角星芒 + 「视觉焦点 / FOCAL POINT」
      const starY = h.fy - fR * 0.36;
      const sr = fR * 0.22;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(h.fx, starY - sr);
      ctx.quadraticCurveTo(h.fx, starY, h.fx + sr, starY);
      ctx.quadraticCurveTo(h.fx, starY, h.fx, starY + sr);
      ctx.quadraticCurveTo(h.fx, starY, h.fx - sr, starY);
      ctx.quadraticCurveTo(h.fx, starY, h.fx, starY - sr);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${clamp(fR * 0.29, 12, 17)}px "Noto Sans SC", sans-serif`;
      ctx.fillText("视觉焦点", h.fx, h.fy + fR * 0.12);
      ctx.font = `600 ${clamp(fR * 0.16, 9, 10.5)}px "Syne", sans-serif`;
      ctx.fillText(escaped ? "DRAG BACK" : "FOCAL POINT", h.fx, h.fy + fR * 0.38);
    }
    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();
    if (still) {
      introProgress = 1;
      introDone = true;
    } else if (!introDone) {
      introProgress = Math.min(1, introProgress + (dt || 0.016) * 1.45);
      if (introProgress >= 1) introDone = true;
    }
    // 缓出曲线保证开场 0–0.85s 每一帧都饱满顺畅
    const reveal = 1 - Math.pow(1 - introProgress, 3);

    // 拖动时合并 DOM 更新至每 80ms 一次，松手时立即同步，确保 6× 软件渲染下拖拽依然 55–60fps
    if (uiPending) {
      const now = performance.now();
      if (still || !dragMode || now - lastUiSync >= 85) {
        uiPending = false;
        lastUiSync = now;
        onChange(true);
      }
    }

    const aspect = getAspect();
    const ev = evaluate(state, aspect);
    const h = getHandles();

    ctx.save();
    ctx.scale(dpr, dpr);

    drawThemeBackdrop(ev, h, t);
    drawCArc(ev, h, reveal);
    drawApertureAndRays(ev, h, t);
    drawFocusSubject(ev, h);

    // 底部角落浮标：当全过 4/4 时在画布左下亮起柔和达标章
    if (ev.score === 4) {
      ctx.save();
      const txt = `✓ ${ev.orientation.label} · 成立解`;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(txt).width + 20;
      ctx.fillStyle = "rgba(236, 253, 245, 0.95)";
      ctx.strokeStyle = "#11694E";
      ctx.lineWidth = 1.5;
      roundRect(12, cssH - 36, tw, 24, 999);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#11694E";
      ctx.textAlign = "left";
      ctx.fillText(txt, 22, cssH - 20);
      ctx.restore();
    }

    ctx.restore();
  }

  const controller = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    resize();
    onChange(true);
    controller.draw();
  });
  ro.observe(canvas);

  return {
    draw: controller.draw,
    getAspect,
  };
}
