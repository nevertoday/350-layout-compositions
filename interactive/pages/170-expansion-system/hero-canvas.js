// 170 扩张系统 · 开场「同心圈层扩印台」2D Canvas 引擎（高性能版：按需重绘 + 字宽缓存 + 路径批绘 + 1.5 DPR）
// 1:1 承袭 170 原海报深李紫梅黑、酸柠核圆、多层紫晕同心带、桃粉→鎏金节点网与四向酸柠箭。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { evaluateExpansion, clampState } from "./model.js";

const PALETTE = {
  bg: "#280F25",
  bandColors: ["#3A1836", "#4D2345", "#5F2E52", "#472040", "#381833", "#2F132B"],
  coreFill: "#BFBC15",
  coreHi: "#DAD43E",
  coreText: "#23101F",
  lime: "#DCE13E",
  limeBright: "#EEF45D",
  peach: "#F2BAA8",
  peachSoft: "rgba(242, 186, 168, 0.46)",
  gold: "#E4D36A",
  goldSoft: "rgba(228, 211, 106, 0.50)",
  danger: "#FF6B8E",
  ok: "#6CE5B1",
  inkLight: "#FBECE8",
};

const widthCache = new Map();
function measureCharWidth(ctx, font, ch, extra) {
  const key = `${font}|${ch}`;
  let w = widthCache.get(key);
  if (w === undefined) {
    w = ctx.measureText(ch).width;
    widthCache.set(key, w);
  }
  return w + extra;
}

function drawArcText(ctx, text, cx, cy, radius, centerAngle, isBottom, flipped, fontSize, color) {
  if (!text || radius < 14) return;
  const fs = fontSize.toFixed(1);
  const font = `600 ${fs}px "Noto Sans SC", "Unbounded", sans-serif`;
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = [...text];
  const extra = fontSize * 0.14;
  let totalW = 0;
  const widths = new Array(chars.length);
  for (let i = 0; i < chars.length; i++) {
    const w = measureCharWidth(ctx, font, chars[i], extra);
    widths[i] = w;
    totalW += w;
  }
  const totalAngle = totalW / radius;
  const reverse = isBottom && flipped;
  let angle = reverse ? centerAngle + totalAngle / 2 : centerAngle - totalAngle / 2;
  const dir = reverse ? -1 : 1;
  const rotBias = reverse ? -Math.PI / 2 : Math.PI / 2;

  for (let i = 0; i < chars.length; i++) {
    const half = widths[i] / (2 * radius);
    angle += dir * half;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.setTransform(
      ctx._dpr * Math.cos(angle + rotBias),
      ctx._dpr * Math.sin(angle + rotBias),
      -ctx._dpr * Math.sin(angle + rotBias),
      ctx._dpr * Math.cos(angle + rotBias),
      ctx._dpr * x,
      ctx._dpr * y
    );
    ctx.fillText(chars[i], 0, 0);
    angle += dir * half;
  }
  ctx.setTransform(ctx._dpr, 0, 0, ctx._dpr, 0, 0);
  ctx.restore();
}

function drawArrowHead(ctx, x, y, angle, size, color) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + c * size, y + s * size);
  ctx.lineTo(x + c * (-size * 0.72) - s * (-size * 0.68), y + s * (-size * 0.72) + c * (-size * 0.68));
  ctx.lineTo(x + c * (-size * 0.72) - s * (size * 0.68), y + s * (-size * 0.72) + c * (size * 0.68));
  ctx.closePath();
  ctx.fill();
}

export function createHeroStage(canvas, { getState, setState, onEvaluate }) {
  const ctx = canvas.getContext("2d");
  let viewW = 600;
  let viewH = 560;
  let curDpr = 1;
  let lastEval = null;
  let lastStateKey = "";
  let cachedBgGrad = null;

  let intro = reducedMotion.matches ? 1 : 0;
  let pulse = { active: false, progress: 0 };
  let hoverRing = -1;
  let drag = null;
  let dirty = true;

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(280, Math.round(rect.height));
    // 手机与窄屏限制 DPR ≤ 1.5（GUIDE.md 性能红线），桌面保持高清 2×
    const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph || viewW !== w || viewH !== h || curDpr !== dpr) {
      canvas.width = pw;
      canvas.height = ph;
      viewW = w;
      viewH = h;
      curDpr = dpr;
      ctx._dpr = dpr;
      cachedBgGrad = null;
      dirty = true;
    }
  }

  function triggerPulse() {
    pulse = { active: true, progress: 0 };
    dirty = true;
  }

  function markDirty() {
    dirty = true;
  }

  function drawFrame(t, dt, { still }) {
    if (!ctx._dpr) syncSize();

    const state = getState();
    const stateKey = `${state.scene}|${state.law}|${state.ratio}|${state.rings}|${state.corePct}|${state.bridges}|${state.bottomFlip}|${state.arcOffsetDeg}|${state.focusRing}|${state.showGuides}|${viewW}x${viewH}`;
    const stateChanged = stateKey !== lastStateKey;
    if (stateChanged) dirty = true;

    const animatingIntro = !still && intro < 1;
    const animatingPulse = !still && pulse.active;
    if (!dirty && !animatingIntro && !animatingPulse) return;

    if (still) {
      intro = 1;
      pulse.active = false;
    } else if (animatingIntro) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.55);
    }

    const ease = 1 - Math.pow(1 - intro, 3);
    if (stateChanged || !lastEval) {
      lastEval = evaluateExpansion(state, viewW, viewH);
      lastStateKey = stateKey;
      if (onEvaluate) onEvaluate(lastEval);
    }
    const ev = lastEval;

    if (animatingPulse) {
      const speed = state.bridges === "none" ? 1.25 : 0.82;
      pulse.progress += Math.max(dt, 0.016) * speed;
      if (pulse.progress >= 1.15) {
        pulse.active = false;
        pulse.progress = 0;
      }
    }

    dirty = false;

    ctx.setTransform(curDpr, 0, 0, curDpr, 0, 0);
    const { cx, cy, rSafe, coreR, rings } = ev;

    // 1. 满幅深李紫梅黑底（缓存径向渐变）
    if (!cachedBgGrad) {
      cachedBgGrad = ctx.createRadialGradient(cx, cy, Math.max(10, rSafe * 0.1), cx, cy, rSafe * 1.25);
      cachedBgGrad.addColorStop(0, "#3D1839");
      cachedBgGrad.addColorStop(0.62, "#280F25");
      cachedBgGrad.addColorStop(1, "#220C20");
    }
    ctx.fillStyle = cachedBgGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // 2. 安全外框参考细点环
    ctx.beginPath();
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = ev.outerNorm > 1.02 ? "rgba(255, 107, 142, 0.55)" : "rgba(220, 225, 62, 0.34)";
    ctx.lineWidth = 1.2;
    ctx.arc(cx, cy, rSafe * 1.01, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. 多层紫晕同心环带
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      const animR = coreR + (ring.rPx - coreR) * ease;
      const isFocus = state.focusRing === ring.index || hoverRing === ring.index;

      ctx.beginPath();
      ctx.arc(cx, cy, animR, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.bandColors[i % PALETTE.bandColors.length];
      ctx.globalAlpha = i % 2 === 0 ? 0.55 : 0.34;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isFocus) {
        ctx.beginPath();
        ctx.arc(cx, cy, animR, 0, Math.PI * 2);
        const innerR = coreR + (ring.prevPx - coreR) * ease;
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
        ctx.fillStyle = ring.crushed || ring.overflowed ? "rgba(255, 107, 142, 0.16)" : "rgba(220, 225, 62, 0.14)";
        ctx.fill("evenodd");
      }
    }

    // 4. 跨环连线网（批绘路径降 draw calls）
    const outerAnimR = rings.length ? coreR + (rings[rings.length - 1].rPx - coreR) * ease : coreR;
    if (state.bridges !== "none") {
      const rays = state.bridges === "quad" ? 4 : state.bridges === "octa" ? 8 : 6;
      const angleStep = (Math.PI * 2) / rays;
      if (state.bridges === "dendrite") {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = PALETTE.peachSoft;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let k = 0; k < rays; k++) {
          const baseA = -Math.PI / 2 + k * angleStep;
          ctx.moveTo(cx + Math.cos(baseA) * coreR, cy + Math.sin(baseA) * coreR);
          for (let i = 0; i < rings.length; i++) {
            const r = coreR + (rings[i].rPx - coreR) * ease;
            const twist = baseA + (i % 2 === 0 ? 0.14 : -0.14) * (i * 0.45);
            ctx.lineTo(cx + Math.cos(twist) * r, cy + Math.sin(twist) * r);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const endR = Math.min(rSafe * 1.07, outerAnimR + 18);
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = "rgba(220, 225, 62, 0.52)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let k = 0; k < rays; k++) {
          const baseA = -Math.PI / 2 + k * angleStep;
          ctx.moveTo(cx + Math.cos(baseA) * (coreR + 3), cy + Math.sin(baseA) * (coreR + 3));
          ctx.lineTo(cx + Math.cos(baseA) * endR, cy + Math.sin(baseA) * endR);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        for (let k = 0; k < rays; k++) {
          if (k % 2 === 0 || state.bridges === "octa") {
            const baseA = -Math.PI / 2 + k * angleStep;
            const arrowR = Math.min(rSafe * 1.08, outerAnimR + 14);
            drawArrowHead(
              ctx,
              cx + Math.cos(baseA) * arrowR,
              cy + Math.sin(baseA) * arrowR,
              baseA,
              k % 2 === 0 ? 6.5 : 4.8,
              k % 2 === 0 ? PALETTE.lime : PALETTE.gold
            );
          }
        }
      }
    } else {
      ctx.beginPath();
      ctx.setLineDash([3, 9]);
      ctx.strokeStyle = "rgba(255, 107, 142, 0.52)";
      ctx.lineWidth = 1.4;
      ctx.arc(cx, cy, coreR + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. 各圈环线、批绘圆点节点与弧形文字
    const rotRad = (state.arcOffsetDeg * Math.PI) / 180;
    const pulseR = pulse.active
      ? state.bridges === "none"
        ? coreR + Math.sin(Math.min(1, pulse.progress * 1.4) * Math.PI) * Math.max(14, (rings[0]?.gapPx || 24) * 0.72)
        : coreR + (outerAnimR - coreR + 16) * Math.min(1, pulse.progress)
      : -1;

    // 批绘节点桶（按颜色归类，把 60+ 次 fill 压成 4 次！）
    const dotBuckets = {
      [PALETTE.danger]: [],
      [PALETTE.lime]: [],
      [PALETTE.gold]: [],
      [PALETTE.peach]: [],
    };

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const animR = coreR + (ring.rPx - coreR) * ease;
      const prevAnimR = coreR + (ring.prevPx - coreR) * ease;
      const textR = prevAnimR + (animR - prevAnimR) * 0.54;
      const isOuter = i === rings.length - 1;
      const isBadRing = ring.crushed || ring.overflowed;
      const isFocus = state.focusRing === ring.index || hoverRing === ring.index;
      const pulseHit = pulse.active && Math.abs(pulseR - animR) < 18 && state.bridges !== "none";

      ctx.beginPath();
      if (isOuter) {
        ctx.setLineDash([2.5, 5.5]);
        ctx.lineWidth = isFocus || pulseHit ? 2.4 : 1.7;
        ctx.strokeStyle = isBadRing ? PALETTE.danger : pulseHit ? PALETTE.limeBright : PALETTE.gold;
      } else {
        ctx.setLineDash(i === rings.length - 2 ? [5, 4] : []);
        ctx.lineWidth = isFocus || pulseHit ? 2.1 : 1.15;
        ctx.strokeStyle = isBadRing
          ? PALETTE.danger
          : pulseHit
            ? PALETTE.limeBright
            : i < 2
              ? "rgba(242, 186, 168, 0.58)"
              : "rgba(228, 211, 106, 0.55)";
      }
      ctx.arc(cx, cy, animR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const nodeCount = ring.nodeCount;
      const nodeSize = isOuter ? 3.8 : Math.max(3.2, 5.4 - i * 0.45);
      const cardMod = Math.max(1, Math.round(nodeCount / 4));
      for (let n = 0; n < nodeCount; n++) {
        const a = -Math.PI / 2 + (n * Math.PI * 2) / nodeCount;
        const nx = cx + Math.cos(a) * animR;
        const ny = cy + Math.sin(a) * animR;
        const isCardinal = n % cardMod === 0;
        const rDot = (isCardinal ? nodeSize * 1.25 : nodeSize * 0.82) * (pulseHit ? 1.3 : 1);
        const col = isBadRing
          ? PALETTE.danger
          : isOuter
            ? n % 2 === 0
              ? PALETTE.lime
              : PALETTE.gold
            : i >= 2 && isCardinal
              ? PALETTE.gold
              : PALETTE.peach;
        dotBuckets[col].push([nx, ny, rDot]);
      }

      // 弧形文字（拖动中仍完整绘制，已通过字宽缓存与无 save/restore 旋转加速）
      if (rings.length <= 5 || i < 5) {
        const topColor = isBadRing ? "#FFD2DE" : isFocus ? PALETTE.limeBright : PALETTE.inkLight;
        const botColor = !state.bottomFlip
          ? "#FF8FA8"
          : isBadRing
            ? "#FFC3D2"
            : "rgba(246, 224, 218, 0.86)";
        drawArcText(ctx, ring.topText, cx, cy, textR, -Math.PI / 2 + rotRad, false, true, ring.fontSize, topColor);
        drawArcText(
          ctx,
          ring.bottomText,
          cx,
          cy,
          textR,
          Math.PI / 2 + rotRad,
          true,
          state.bottomFlip,
          ring.fontSize * 0.86,
          botColor
        );
      }
    }

    // 一次性批量填充圆点
    for (const [col, pts] of Object.entries(dotBuckets)) {
      if (!pts.length) continue;
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let k = 0; k < pts.length; k++) {
        const [nx, ny, rDot] = pts[k];
        ctx.moveTo(nx + rDot, ny);
        ctx.arc(nx, ny, rDot, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 标尺引线气泡（放在圆环之外的右上安全区，默认指向最挤环与诊单读数一一对应）
    if (state.showGuides) {
      const tightestRing = rings[Math.max(0, (ev.tightestRingIndex || 1) - 1)] || rings[0];
      const targetRing =
        state.focusRing >= 1
          ? rings[state.focusRing - 1]
          : hoverRing >= 1
            ? rings[hoverRing - 1]
            : tightestRing?.crushed
              ? tightestRing
              : null;
      if (targetRing) {
        const animR = coreR + (targetRing.rPx - coreR) * ease;
        const anchorA = -Math.PI * 0.24;
        const ax = cx + Math.cos(anchorA) * animR;
        const ay = cy + Math.sin(anchorA) * animR;
        const tagText = `R${targetRing.index} · 净空 ${Math.round(targetRing.gapPx)}px · ${targetRing.topArc.degPerChar.toFixed(1)}°/字`;
        ctx.font = `500 10.5px "IBM Plex Mono", "Noto Sans SC", monospace`;
        const tw = ctx.measureText(tagText).width + 14;
        const bx = Math.min(viewW - tw - 10, Math.max(cx + coreR + 12, viewW - tw - 14));
        const by = Math.max(34, Math.min(viewH - 32, cy - rSafe * 0.78));
        const bad = targetRing.crushed || targetRing.overflowed;

        ctx.beginPath();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = bad ? PALETTE.danger : PALETTE.lime;
        ctx.lineWidth = 1.1;
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by + 11);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(ax, ay, 3, 0, Math.PI * 2);
        ctx.fillStyle = bad ? PALETTE.danger : PALETTE.lime;
        ctx.fill();

        ctx.fillStyle = bad ? "#4B1228" : "#1D091C";
        ctx.strokeStyle = bad ? PALETTE.danger : PALETTE.lime;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, 22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = PALETTE.inkLight;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, bx + 7, by + 11.5);
      }
    }

    // 6. 能量脉冲波纹
    if (pulse.active && pulseR > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = state.bridges === "none" ? PALETTE.danger : PALETTE.limeBright;
      ctx.lineWidth = state.bridges === "none" ? 2.4 : 2.8;
      ctx.globalAlpha = Math.max(0.15, 1 - pulse.progress * 0.82);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 7. 中心酸柠「核心 CORE」圆盘
    const drawCoreR = coreR * ease;
    const coreGrad = ctx.createRadialGradient(
      cx - drawCoreR * 0.22,
      cy - drawCoreR * 0.22,
      drawCoreR * 0.1,
      cx,
      cy,
      drawCoreR
    );
    coreGrad.addColorStop(0, PALETTE.coreHi);
    coreGrad.addColorStop(1, PALETTE.coreFill);
    ctx.beginPath();
    ctx.arc(cx, cy, drawCoreR, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    ctx.lineWidth = state.focusRing === 0 || hoverRing === 0 ? 2.6 : 1.5;
    ctx.strokeStyle = state.corePct < 0.14 || state.corePct > 0.33 ? PALETTE.danger : "rgba(255, 248, 190, 0.72)";
    ctx.stroke();

    const zhSize = Math.max(11, Math.min(28, drawCoreR * 0.48));
    const enSize = Math.max(9.5, Math.min(13, drawCoreR * 0.21));
    ctx.fillStyle = PALETTE.coreText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${zhSize.toFixed(1)}px "Noto Sans SC", sans-serif`;
    ctx.fillText(ev.scene.coreZh, cx, cy - (drawCoreR > 26 ? enSize * 0.55 : 0));
    if (drawCoreR > 26) {
      ctx.font = `700 ${enSize.toFixed(1)}px "Unbounded", sans-serif`;
      ctx.fillText(ev.scene.coreEn, cx, cy + zhSize * 0.48);
    }

    // 8. 外圈右缘推拉手柄
    if (rings.length) {
      const handleR = Math.min(rSafe * 1.02, outerAnimR);
      const hx = cx + handleR;
      const hy = cy;
      ctx.beginPath();
      ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      ctx.fillStyle = ev.isSolved ? PALETTE.ok : PALETTE.lime;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#220C20";
      ctx.stroke();
      ctx.fillStyle = "#220C20";
      ctx.font = `700 11px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", hx, hy + 0.5);
    }

    // 9. 左上与右上极简实时几何读数水印（窄画布自动精简防撞字）
    const compactHud = viewW < 450;
    ctx.font = `500 ${compactHud ? 10.5 : 11}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(251, 236, 232, 0.80)";
    const leftHud = compactHud
      ? `${state.ratio.toFixed(2)}× · ${state.rings}圈 · GAP ${ev.minGapPx}px`
      : `RATIO ${state.ratio.toFixed(2)}× · RINGS ${state.rings} · GAP ${ev.minGapPx}px · OUTER ${Math.round(ev.outerNorm * 100)}%`;
    ctx.fillText(leftHud, 12, 10);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.isSolved ? PALETTE.ok : PALETTE.danger;
    ctx.fillText(ev.verdict.badge, viewW - 12, 10);

    if (ev.outerNorm > 1.02) {
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(4, 4, viewW - 8, viewH - 8);
      ctx.setLineDash([]);
    }
  }

  syncSize();
  const runner = loop(canvas, drawFrame);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      syncSize();
      runner.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    syncSize();
    runner.draw();
  });

  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTestRing(x, y) {
    if (!lastEval) return -1;
    const d = Math.hypot(x - lastEval.cx, y - lastEval.cy);
    if (d <= lastEval.coreR + 6) return 0;
    for (const ring of lastEval.rings) {
      if (d >= ring.prevPx && d <= ring.rPx + 8) return ring.index;
    }
    return -1;
  }

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return;
    const p = localPos(e.clientX, e.clientY);
    const st = getState();
    drag = {
      id: e.pointerId,
      startX: p.x,
      startY: p.y,
      startRatio: st.ratio,
      moved: false,
      lockedAxis: e.pointerType === "touch" ? null : "x",
      hitRing: hitTestRing(p.x, p.y),
    };
    if (e.pointerType !== "touch") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onPointerMove(e) {
    const p = localPos(e.clientX, e.clientY);
    if (!drag) {
      const h = hitTestRing(p.x, p.y);
      if (h !== hoverRing) {
        hoverRing = h;
        canvas.style.cursor = h === 0 ? "pointer" : "ew-resize";
        markDirty();
      }
      return;
    }
    if (e.pointerId !== drag.id) return;
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    if (!drag.lockedAxis) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        drag = null;
        return;
      }
      drag.lockedAxis = "x";
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) {
      if (e.cancelable) e.preventDefault();
      const delta = (dx / Math.max(220, viewW * 0.52)) * 0.56;
      const rawNext = drag.startRatio + delta;
      const snapped = Math.abs(rawNext - 1.42) < 0.012 ? 1.42 : rawNext;
      const nextRatio = Math.max(1.08, Math.min(1.62, +snapped.toFixed(2)));
      setState(clampState({ ...getState(), ratio: nextRatio }));
      markDirty();
      if (reducedMotion.matches) runner.draw();
    }
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const wasClick = !drag.moved;
    const hit = drag.hitRing;
    drag = null;
    if (wasClick) {
      const cur = getState();
      if (hit === 0) {
        triggerPulse();
        setState({ ...cur, focusRing: 0 });
      } else if (hit >= 1) {
        setState({ ...cur, focusRing: cur.focusRing === hit ? -1 : hit });
      }
      markDirty();
      if (reducedMotion.matches) runner.draw();
    }
  }

  // 兼容 perf.mjs 派发的原生 TouchEvent：只标记 dirty，由 rAF 合并渲染避免双绘！
  let touchDrag = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const p = localPos(t.clientX, t.clientY);
      touchDrag = { startX: p.x, startY: p.y, startRatio: getState().ratio, locked: null };
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDrag || !e.touches.length) return;
      const t = e.touches[0];
      const p = localPos(t.clientX, t.clientY);
      const dx = p.x - touchDrag.startX;
      const dy = p.y - touchDrag.startY;
      if (!touchDrag.locked) {
        if (Math.hypot(dx, dy) < 5) return;
        touchDrag.locked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchDrag.locked === "x") {
        if (e.cancelable) e.preventDefault();
        const nextRatio = Math.max(1.08, Math.min(1.62, +(touchDrag.startRatio + (dx / Math.max(200, viewW * 0.5)) * 0.54).toFixed(2)));
        setState(clampState({ ...getState(), ratio: nextRatio }));
        markDirty();
        if (reducedMotion.matches) runner.draw();
      }
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => { drag = null; });
  canvas.addEventListener("pointerleave", () => {
    if (!drag && hoverRing !== -1) {
      hoverRing = -1;
      markDirty();
    }
  });

  canvas.addEventListener("keydown", (e) => {
    const cur = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setState(clampState({ ...cur, ratio: +(cur.ratio + 0.03).toFixed(2) }));
      markDirty();
      runner.draw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setState(clampState({ ...cur, ratio: +(cur.ratio - 0.03).toFixed(2) }));
      markDirty();
      runner.draw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setState(clampState({ ...cur, rings: cur.rings + 1 }));
      markDirty();
      runner.draw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setState(clampState({ ...cur, rings: cur.rings - 1 }));
      markDirty();
      runner.draw();
    } else if (e.key === " ") {
      e.preventDefault();
      triggerPulse();
      runner.draw();
    }
  });

  return {
    draw: () => {
      markDirty();
      runner.draw();
    },
    triggerPulse: () => {
      triggerPulse();
      runner.draw();
    },
    getEval: () => lastEval,
  };
}
