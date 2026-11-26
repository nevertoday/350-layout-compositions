// 047 圆形构图 · 开场圆轨星盘 Canvas
// 1:1 承袭 047 原海报深普鲁士蓝同心细纹夜空、朱橙星芒核心、钴蓝/暖米四卫星、虚线箭头弧与点阵内环。
// 支持直拖卫星绕轨、轻点卫星换尺度、拖核心校准、横滑空轨转环、空格/按钮释放视线脉冲（缺口处切线甩出）。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SKINS,
  TIER_RADIUS,
  degToRad,
  evaluate,
  nextTier,
  normDeg,
  radToDeg,
  satXY,
} from "./model.js";

const COLORS = {
  skyCenter: "#0B243E",
  skyEdge: "#03152A",
  hairline: "rgba(182, 206, 232, 0.095)",
  orbitLine: "rgba(231, 226, 215, 0.34)",
  orange: "#E36126",
  orangeGlow: "rgba(233, 96, 38, 0.26)",
  orangeHi: "#F27942",
  blue: "#2B74D0",
  blueDot: "#2E78D6",
  ivory: "#E7E2D7",
  ivoryInk: "#0C1E33",
  danger: "#FF6B6B",
  dangerFill: "rgba(255, 107, 107, 0.14)",
  ok: "#44D4A0",
  okSoft: "rgba(68, 212, 160, 0.22)",
};

// 在离屏画布缓存深海夜空 + 同心装饰细环，拖动时 0 额外开销
function buildSkyCache(w, h, dpr) {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(w * dpr));
  off.height = Math.max(1, Math.round(h * dpr));
  const c = off.getContext("2d");
  c.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(w, h) * 0.56;

  const grad = c.createRadialGradient(cx, cy, maxR * 0.08, cx, cy, maxR);
  grad.addColorStop(0, COLORS.skyCenter);
  grad.addColorStop(0.68, "#061B32");
  grad.addColorStop(1, COLORS.skyEdge);
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  // 原海报标志性极细同心圆弧底纹
  c.strokeStyle = COLORS.hairline;
  c.lineWidth = 1;
  const baseR = Math.min(w, h) * 0.44;
  for (let i = 0; i < 11; i++) {
    c.beginPath();
    c.arc(cx, cy, baseR * (0.42 + i * 0.115), 0, Math.PI * 2);
    c.stroke();
  }
  return off;
}

function drawStarburst(ctx, x, y, r, color) {
  const spikes = 12;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (i * Math.PI) / spikes - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.46;
    if (i === 0) ctx.moveTo(Math.cos(rad) * rr, Math.sin(rad) * rr);
    else ctx.lineTo(Math.cos(rad) * rr, Math.sin(rad) * rr);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.lineJoin = "miter";
  ctx.stroke();
  ctx.restore();
}

function drawSatIcon(ctx, icon, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (icon === "eye") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.9, 0);
    ctx.quadraticCurveTo(0, -size * 0.72, size * 0.9, 0);
    ctx.quadraticCurveTo(0, size * 0.72, -size * 0.9, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  } else if (icon === "wave") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.85, 0);
    ctx.bezierCurveTo(-size * 0.4, -size * 0.52, -size * 0.1, size * 0.52, size * 0.35, 0);
    ctx.bezierCurveTo(size * 0.58, -size * 0.28, size * 0.72, -size * 0.15, size * 0.88, -size * 0.08);
    ctx.stroke();
  } else if (icon === "shield") {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.78);
    ctx.lineTo(size * 0.65, -size * 0.48);
    ctx.lineTo(size * 0.58, size * 0.18);
    ctx.quadraticCurveTo(0, size * 0.85, 0, size * 0.85);
    ctx.quadraticCurveTo(0, size * 0.85, -size * 0.58, size * 0.18);
    ctx.lineTo(-size * 0.65, -size * 0.48);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.24, 0.04 * size);
    ctx.lineTo(-size * 0.03, size * 0.26);
    ctx.lineTo(size * 0.32, -size * 0.18);
    ctx.stroke();
  } else if (icon === "grid") {
    const g = size * 0.34;
    const gap = size * 0.12;
    ctx.strokeRect(-g - gap, -g - gap, g, g);
    ctx.strokeRect(gap, -g - gap, g, g);
    ctx.strokeRect(-g - gap, gap, g, g);
    ctx.strokeRect(gap, gap, g, g);
  } else if (icon === "moon") {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.55, 0.35 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  } else if (icon === "branch") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, size * 0.45);
    ctx.quadraticCurveTo(0, -size * 0.35, size * 0.75, -size * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.25, -size * 0.22, size * 0.14, 0, Math.PI * 2);
    ctx.arc(-size * 0.15, -size * 0.04, size * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === "rock") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, size * 0.45);
    ctx.lineTo(-size * 0.25, -size * 0.45);
    ctx.lineTo(size * 0.22, -size * 0.15);
    ctx.lineTo(size * 0.7, size * 0.45);
    ctx.closePath();
    ctx.stroke();
  } else if (icon === "mist") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, -size * 0.22);
    ctx.quadraticCurveTo(0, -size * 0.5, size * 0.7, -size * 0.22);
    ctx.moveTo(-size * 0.55, size * 0.22);
    ctx.quadraticCurveTo(0, size * 0.0, size * 0.55, size * 0.22);
    ctx.stroke();
  } else if (icon === "star") {
    drawStarburst(ctx, 0, 0, size * 0.62, color);
  }
  ctx.restore();
}

function drawArcArrow(ctx, cx, cy, r, angleDeg, dir, color, size = 9) {
  const rad = degToRad(angleDeg);
  const px = cx + Math.cos(rad) * r;
  const py = cy + Math.sin(rad) * r;
  // 顺时针切线角 = rad + PI/2
  const tan = rad + (dir >= 0 ? Math.PI / 2 : -Math.PI / 2);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(tan);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size * 0.9, 0);
  ctx.lineTo(-size * 0.55, -size * 0.58);
  ctx.lineTo(-size * 0.3, 0);
  ctx.lineTo(-size * 0.55, size * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function mountHeroCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 540;
  let cssH = 540;
  let dpr = 1;
  let skyCache = null;

  // 脉冲演播状态
  const pulse = {
    active: false,
    progress: 0, // 0..1
    duration: 2.35,
    escaped: false,
  };

  // 拖拽状态
  const drag = {
    mode: null, // "sat" | "focus" | "ring"
    satIdx: -1,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
    startAngles: [],
    startFocusX: 0,
    startFocusY: 0,
  };

  let hoverHit = null;
  let introDone = false;
  let cachedRect = null;

  function metrics() {
    const cx = cssW / 2;
    const compact = cssW < 430 || cssH < 340;
    const cy = compact ? cssH * 0.53 : cssH * 0.51;
    const unit = Math.min(cssW, cssH) * (compact ? 0.395 : 0.425);
    return { cx, cy, unit, compact };
  }

  function measureCanvas() {
    const rect = canvas.getBoundingClientRect();
    cachedRect = rect;
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const nextDpr = pixelRatio(window.innerWidth <= 680 ? 1.5 : 2);
    if (w !== cssW || h !== cssH || nextDpr !== dpr || !skyCache) {
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      skyCache = buildSkyCache(w, h, dpr);
    }
  }

  function resize() {
    if (!skyCache || !cachedRect) measureCanvas();
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      measureCanvas();
      if (reducedMotion.matches && ctrl) ctrl.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    cachedRect = null;
    measureCanvas();
  });

  function toNorm(clientX, clientY, refreshRect = false) {
    if (refreshRect || !cachedRect) cachedRect = canvas.getBoundingClientRect();
    const px = clientX - cachedRect.left;
    const py = clientY - cachedRect.top;
    const { cx, cy, unit } = metrics();
    return { px, py, nx: (px - cx) / unit, ny: (py - cy) / unit };
  }

  function hitTest(nx, ny, state) {
    const { unit } = metrics();
    const pad = Math.max(0.04, 14 / unit);
    // 先检测 4 枚卫星
    for (let i = state.sats.length - 1; i >= 0; i--) {
      const s = state.sats[i];
      const r = TIER_RADIUS[s.tier] || TIER_RADIUS.md;
      const p = satXY(s.angle, state.orbitR);
      if (Math.hypot(nx - p.x, ny - p.y) <= r + pad) {
        return { kind: "sat", idx: i };
      }
    }
    // 再检测中央橙圆
    if (Math.hypot(nx - state.focusX, ny - state.focusY) <= state.focusR + pad * 0.5) {
      return { kind: "focus" };
    }
    // 轨道空区：整环旋转
    return { kind: "ring" };
  }

  function startPulse() {
    pulse.active = true;
    pulse.progress = 0;
    ctrl.draw();
  }

  function render(t, dt, { still }) {
    resize();
    const state = getState();
    const evalRes = evaluate(state);
    const skin = SKINS[state.skin] || SKINS.poster;
    const { cx, cy, unit } = metrics();

    // 开场柔和展开动画（0..0.75s），任何时刻画面都完整清晰
    const intro = still ? 1 : Math.min(1, 0.25 + (t / 0.65) * 0.75);
    const ease = 1 - Math.pow(1 - intro, 3);
    if (intro >= 1) introDone = true;

    if (pulse.active) {
      if (still) {
        pulse.progress = 0.58;
        pulse.active = false;
      } else {
        pulse.progress += dt / pulse.duration;
        if (pulse.progress >= 1) {
          pulse.progress = 0;
          pulse.active = false;
        }
      }
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 缓存夜空与同心底纹
    ctx.drawImage(skyCache, 0, 0, cssW, cssH);

    const orbitPx = state.orbitR * unit * (0.94 + 0.06 * ease);
    const outerArcPx = orbitPx * 1.12;
    const innerDotPx = Math.max(unit * 0.2, (state.focusR + (state.orbitR - state.focusR) * 0.42) * unit);
    const fx = cx + state.focusX * unit;
    const fy = cy + state.focusY * unit;
    const focusPx = state.focusR * unit * (0.92 + 0.08 * ease);

    // 2. 圆心基准标（当主体偏心或高亮向心原则时清晰指示真正圆心）
    const showOrigin = evalRes.metrics.focusOffsetPct > 4 || state.highlight === "center";
    if (showOrigin) {
      ctx.save();
      ctx.strokeStyle = evalRes.pillars.center.ok
        ? "rgba(68, 212, 160, 0.55)"
        : "rgba(255, 107, 107, 0.75)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(12, unit * 0.09), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy);
      ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx, cy + 8);
      ctx.stroke();

      if (evalRes.metrics.focusOffsetPct > 12) {
        // 偏心牵引虚线
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // 3. 大缺口红弧警示（单真源，直接标出 maxGapDeg 的真实扇区）
    if (evalRes.metrics.maxGapDeg > 138) {
      const aStart = degToRad(evalRes.metrics.gapStartDeg + 6);
      const aEnd = degToRad(evalRes.metrics.gapEndDeg - 6);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerArcPx, aStart, aEnd);
      ctx.closePath();
      ctx.fillStyle = COLORS.dangerFill;
      ctx.fill();

      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, outerArcPx, aStart, aEnd);
      ctx.stroke();
      ctx.setLineDash([]);

      // 在缺口中段画切线逃逸箭头与度数签
      const midDeg = normDeg((evalRes.metrics.gapStartDeg + evalRes.metrics.gapEndDeg) / 2);
      const midRad = degToRad(midDeg);
      const bx = cx + Math.cos(midRad) * outerArcPx;
      const by = cy + Math.sin(midRad) * outerArcPx;
      const tanRad = midRad + (state.flowDir >= 0 ? Math.PI / 2 : -Math.PI / 2);
      const ex = bx + Math.cos(tanRad) * 28 + Math.cos(midRad) * 16;
      const ey = by + Math.sin(tanRad) * 28 + Math.sin(midRad) * 16;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 缺口度数胶囊
      const lx = cx + Math.cos(midRad) * (orbitPx * 0.86);
      const ly = cy + Math.sin(midRad) * (orbitPx * 0.86);
      const gapText = `缺口 ${evalRes.metrics.maxGapDeg}°`;
      ctx.font = `700 ${Math.max(11, Math.round(unit * 0.056))}px "Space Mono", "Noto Sans SC", monospace`;
      const tw = ctx.measureText(gapText).width + 14;
      ctx.fillStyle = "rgba(8, 25, 46, 0.92)";
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(lx - tw / 2, ly - 11, tw, 22, 11);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FF9393";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gapText, lx, ly + 0.5);
      ctx.restore();
    }

    // 4. 外圈朱橙引导虚弧 / 实弧（1:1 复刻原海报虚线轨道 + 方向三角箭）
    if (state.arcMode !== "none") {
      ctx.save();
      const arcHi = state.highlight === "flow" || state.highlight === "unity";
      ctx.strokeStyle =
        state.flowDir === 0
          ? COLORS.danger
          : arcHi
            ? "#FF915C"
            : COLORS.orange;
      ctx.lineWidth = arcHi ? 2.8 : 2.1;
      if (state.arcMode === "dashed") {
        ctx.setLineDash([8, 6]);
        if (!still && state.flowDir !== 0) {
          ctx.lineDashOffset = -t * 18 * state.flowDir;
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, outerArcPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 原海报两枚（或四枚）方向箭头；对冲模式画相撞箭头
      if (state.flowDir === 0) {
        drawArcArrow(ctx, cx, cy, outerArcPx, 315, 1, COLORS.danger, 9);
        drawArcArrow(ctx, cx, cy, outerArcPx, 45, -1, COLORS.danger, 9);
        drawArcArrow(ctx, cx, cy, outerArcPx, 135, 1, COLORS.danger, 9);
        drawArcArrow(ctx, cx, cy, outerArcPx, 225, -1, COLORS.danger, 9);
      } else {
        drawArcArrow(ctx, cx, cy, outerArcPx, 318, state.flowDir, COLORS.orangeHi, 9.5);
        drawArcArrow(ctx, cx, cy, outerArcPx, 138, state.flowDir, COLORS.orangeHi, 9.5);
      }
      ctx.restore();
    }

    // 5. 卫星主轨道细环（原海报暖米细线）
    ctx.save();
    ctx.strokeStyle =
      state.highlight === "enclosure" ? "rgba(120, 183, 255, 0.72)" : COLORS.orbitLine;
    ctx.lineWidth = state.highlight === "enclosure" ? 2 : 1.15;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitPx, 0, Math.PI * 2);
    ctx.stroke();

    // 原海报点缀于斜角的 4 枚微珠（两暖米、两钴蓝，随轨道节奏分布）
    const pearls = [
      { deg: 325, color: COLORS.ivory, r: Math.max(5.5, unit * 0.036) },
      { deg: 44, color: COLORS.ivory, r: Math.max(6.5, unit * 0.044) },
      { deg: 142, color: COLORS.blue, r: Math.max(5.5, unit * 0.034) },
      { deg: 222, color: COLORS.blue, r: Math.max(6.5, unit * 0.042) },
    ];
    for (const p of pearls) {
      const pr = degToRad(p.deg);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(pr) * orbitPx, cy + Math.sin(pr) * orbitPx, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();

    // 6. 内圈钴蓝点阵环（1:1 复刻原海报深蓝内点圈）
    if (state.dotRing) {
      ctx.save();
      const dotCount = 44;
      const dotR = Math.max(2.1, unit * 0.0115);
      const choked = evalRes.metrics.minClearance < 0.045;
      ctx.fillStyle = choked ? COLORS.danger : COLORS.blueDot;
      for (let i = 0; i < dotCount; i++) {
        const a = (i / dotCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * innerDotPx, cy + Math.sin(a) * innerDotPx, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. 环绕重心矢量提示（当重心偏矩 > 18% 或高亮「包围」时呈现真实力学向量）
    if (evalRes.metrics.torquePct > 18 || state.highlight === "enclosure") {
      const tx = cx + evalRes.metrics.comX * unit;
      const ty = cy + evalRes.metrics.comY * unit;
      const tiltBad = evalRes.metrics.torquePct > 28;
      ctx.save();
      ctx.strokeStyle = tiltBad ? COLORS.danger : COLORS.ok;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tx, ty, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = tiltBad ? COLORS.danger : COLORS.ok;
      ctx.fill();
      ctx.strokeStyle = "#04182F";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 8. 中央朱橙日轮「焦点 FOCUS」（轻双环暖晕，避免软件渲染下高开销径向渐变与阴影模糊）
    ctx.save();
    ctx.fillStyle = "rgba(233, 96, 38, 0.14)";
    ctx.beginPath();
    ctx.arc(fx, fy, focusPx * 1.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#E36126";
    ctx.beginPath();
    ctx.arc(fx, fy, focusPx, 0, Math.PI * 2);
    ctx.fill();

    // 内缘柔亮高光环
    ctx.strokeStyle = "rgba(255, 226, 198, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx, fy, Math.max(4, focusPx - 2), 0, Math.PI * 2);
    ctx.stroke();

    // 状态描边（错态提示 / 成立高光 / 悬停提示）
    if (evalRes.metrics.minClearance < 0.045 || evalRes.metrics.focusOffsetPct > 12) {
      ctx.strokeStyle = "#FFB49E";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (hoverHit?.kind === "focus" || drag.mode === "focus") {
      ctx.strokeStyle = "#FFF4E8";
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    // 日轮内星芒与文字（随半径等比严格留空，任何窄屏绝不重叠）
    const starR = Math.max(7.5, Math.min(16, focusPx * 0.165));
    drawStarburst(ctx, fx, fy - focusPx * 0.5, starR, "#FFF8EE");

    ctx.fillStyle = "#FFF8EE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const zhSize = Math.max(12, Math.round(focusPx * 0.3));
    ctx.font = `900 ${zhSize}px "Noto Sans SC", sans-serif`;
    ctx.fillText(skin.centerZh, fx, fy + focusPx * 0.04);

    if (focusPx >= 34) {
      const enSize = Math.max(9.5, Math.round(focusPx * 0.155));
      ctx.font = `700 ${enSize}px "Outfit", sans-serif`;
      ctx.fillStyle = "rgba(255, 245, 234, 0.94)";
      ctx.fillText(skin.centerEn, fx, fy + focusPx * 0.42);
    }

    if (focusPx >= 68) {
      const subSize = Math.max(10, Math.round(focusPx * 0.11));
      ctx.font = `400 ${subSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(255, 240, 224, 0.88)";
      ctx.fillText(skin.centerSub, fx, fy + focusPx * 0.66);
    }
    ctx.restore();

    // 9. 四枚可拖可点的环绕卫星圆
    for (let i = 0; i < state.sats.length; i++) {
      const s = state.sats[i];
      const meta = skin.sats[i];
      const satR = (TIER_RADIUS[s.tier] || TIER_RADIUS.md) * unit;
      const p = satXY(s.angle, state.orbitR * (0.94 + 0.06 * ease));
      const sx = cx + p.x * unit;
      const sy = cy + p.y * unit;
      const isIvory = meta.color === "ivory";
      const isHijack = s.tier === "lg" && evalRes.metrics.hierarchyRatio < 1.38;
      const isActive =
        (drag.mode === "sat" && drag.satIdx === i) ||
        (hoverHit?.kind === "sat" && hoverHit.idx === i);

      ctx.save();
      // 轻轮廓托底（不用高成本 shadowBlur，保证慢手机软件渲染满帧）
      ctx.beginPath();
      ctx.arc(sx, sy + 2, satR + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(2, 12, 26, 0.42)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sx, sy, satR, 0, Math.PI * 2);
      ctx.fillStyle = isIvory ? COLORS.ivory : COLORS.blue;
      ctx.fill();

      // 抢戏警示红圈 / 交互高亮白圈
      if (isHijack) {
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isActive) {
        ctx.strokeStyle = "#FFF8EE";
        ctx.lineWidth = 2.6;
        ctx.stroke();
      } else if (evalRes.passCount === 4) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      const ink = isIvory ? COLORS.ivoryInk : "#F5F9FF";
      const iconColor = isIvory ? COLORS.blue : "#E8F2FF";

      if (satR >= 28) {
        drawSatIcon(ctx, meta.icon, sx, sy - satR * 0.34, satR * 0.32, iconColor);
        const titleSz = Math.max(10, Math.min(14, Math.round(satR * 0.31)));
        ctx.font = `700 ${titleSz}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(meta.title, sx, sy + satR * 0.16);

        if (satR >= 36) {
          const subSz = Math.max(9.5, Math.min(11.5, Math.round(satR * 0.22)));
          ctx.font = `400 ${subSz}px "Noto Sans SC", sans-serif`;
          ctx.fillStyle = isIvory ? "#384E68" : "rgba(236, 245, 255, 0.88)";
          ctx.fillText(meta.sub, sx, sy + satR * 0.48);
        }
      } else {
        // 微星尺度：居中只画小图标 + 序号，保持清爽不挤
        drawSatIcon(ctx, meta.icon, sx, sy, satR * 0.56, iconColor);
      }

      // 若正在抢戏，在卫星缘给出精悍提示签（靠顶时避让顶部状态栏）
      if (isHijack) {
        const tag = "抢戏·点此缩回";
        ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tag).width + 12;
        const nearTop = sy - satR < 44;
        const tagY = nearTop ? sy + satR + 12 : sy - satR - 13;
        ctx.fillStyle = "#B82222";
        ctx.beginPath();
        ctx.roundRect(sx - tw / 2, tagY - 9.5, tw, 19, 9.5);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, sx, tagY + 0.5);
      }
      ctx.restore();
    }

    // 10. 视线脉冲演播（顺圆弧绕轨→若成立则收束向圆心；若大缺口/断弧则沿切线甩出画外！）
    if (pulse.active || (still && pulse.progress > 0)) {
      const p = pulse.progress;
      const canClose = evalRes.metrics.maxGapDeg <= 138 && state.flowDir !== 0;
      const dir = state.flowDir === 0 ? 1 : state.flowDir;

      ctx.save();
      if (canClose) {
        // 0..0.72 绕轨道顺滑流转一圈；0.72..1.0 向圆心螺旋收束
        const startDeg = normDeg(state.sats[0].angle);
        let px, py;
        const trail = [];
        for (let k = 0; k <= 14; k++) {
          const pk = Math.max(0, p - k * 0.018);
          let rr, dd;
          if (pk <= 0.72) {
            rr = outerArcPx;
            dd = startDeg + dir * (pk / 0.72) * 360;
          } else {
            const sp = (pk - 0.72) / 0.28;
            const e = 1 - Math.pow(1 - sp, 2);
            rr = outerArcPx * (1 - e);
            dd = startDeg + dir * (360 + sp * 110);
          }
          const rad = degToRad(dd);
          const tx = (pk > 0.72 ? cx + (fx - cx) * ((pk - 0.72) / 0.28) : cx) + Math.cos(rad) * rr;
          const ty = (pk > 0.72 ? cy + (fy - cy) * ((pk - 0.72) / 0.28) : cy) + Math.sin(rad) * rr;
          trail.push({ x: tx, y: ty, a: 1 - k / 15 });
        }
        px = trail[0].x;
        py = trail[0].y;

        for (let k = 1; k < trail.length; k++) {
          ctx.strokeStyle = `rgba(255, 224, 152, ${trail[k].a * 0.85})`;
          ctx.lineWidth = Math.max(1.5, 6.5 * trail[k].a);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(trail[k - 1].x, trail[k - 1].y);
          ctx.lineTo(trail[k].x, trail[k].y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#FFF7DF";
        ctx.fill();
        ctx.strokeStyle = COLORS.ok;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        // 轮廓有大缺口：运行到缺口起点后沿切线直接甩飞！
        const launchDeg = evalRes.metrics.gapStartDeg;
        const startDeg = normDeg(launchDeg - dir * 110);
        const trail = [];
        for (let k = 0; k <= 12; k++) {
          const pk = Math.max(0, p - k * 0.018);
          let tx, ty;
          if (pk <= 0.45) {
            const dd = startDeg + dir * (pk / 0.45) * 110;
            const rad = degToRad(dd);
            tx = cx + Math.cos(rad) * outerArcPx;
            ty = cy + Math.sin(rad) * outerArcPx;
          } else {
            const ep = (pk - 0.45) / 0.55;
            const rad = degToRad(launchDeg);
            const bx = cx + Math.cos(rad) * outerArcPx;
            const by = cy + Math.sin(rad) * outerArcPx;
            const tan = rad + (dir >= 0 ? Math.PI / 2 : -Math.PI / 2);
            const dist = ep * unit * 0.95;
            tx = bx + Math.cos(tan) * dist + Math.cos(rad) * dist * 0.22;
            ty = by + Math.sin(tan) * dist + Math.sin(rad) * dist * 0.22;
          }
          trail.push({ x: tx, y: ty, a: 1 - k / 13 });
        }
        for (let k = 1; k < trail.length; k++) {
          ctx.strokeStyle = `rgba(255, 107, 107, ${trail[k].a * 0.9})`;
          ctx.lineWidth = Math.max(1.5, 6 * trail[k].a);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(trail[k - 1].x, trail[k - 1].y);
          ctx.lineTo(trail[k].x, trail[k].y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(trail[0].x, trail[0].y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD2D2";
        ctx.fill();
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 11. 顶部极简状态微标（窄屏自动精简左段，绝不与右侧或卫星撞车）
    ctx.save();
    const chipY = 16;
    const compactHud = cssW < 440;
    ctx.font = `700 ${compactHud ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(231, 226, 215, 0.78)";
    ctx.fillText(
      compactHud
        ? `GAP ${evalRes.metrics.maxGapDeg}° · ${evalRes.metrics.hierarchyRatio.toFixed(2)}×`
        : `GAP ${evalRes.metrics.maxGapDeg}° · RATIO ${evalRes.metrics.hierarchyRatio.toFixed(2)}× · OFFSET ${evalRes.metrics.focusOffsetPct}%`,
      12,
      chipY
    );

    ctx.textAlign = "right";
    ctx.fillStyle = evalRes.passCount === 4 ? COLORS.ok : "#FF9080";
    ctx.fillText(evalRes.statusChip, cssW - 12, chipY);
    ctx.restore();

    ctx.restore();
  }

  // 指针交互（同时兼容鼠标与触屏；touch-action: pan-y 保证手机竖划能滚页、横划与拖卫星顺畅）
  canvas.addEventListener("pointerdown", (e) => {
    const state = getState();
    const { px, py, nx, ny } = toNorm(e.clientX, e.clientY, true);
    const hit = hitTest(nx, ny, state);
    drag.mode = hit.kind;
    drag.satIdx = hit.idx ?? -1;
    drag.pointerId = e.pointerId;
    drag.startX = px;
    drag.startY = py;
    drag.lastX = px;
    drag.lastY = py;
    drag.moved = false;
    drag.startAngles = state.sats.map((s) => s.angle);
    drag.startFocusX = state.focusX;
    drag.startFocusY = state.focusY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    const state = getState();
    const { px, py, nx, ny } = toNorm(e.clientX, e.clientY);

    if (drag.mode === null) {
      hoverHit = hitTest(nx, ny, state);
      canvas.style.cursor =
        hoverHit.kind === "sat" || hoverHit.kind === "focus" ? "grab" : "ew-resize";
      return;
    }

    const dx = px - drag.startX;
    const dy = py - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    const { unit } = metrics();

    if (drag.mode === "sat" && drag.satIdx >= 0) {
      let deg = radToDeg(Math.atan2(ny, nx));
      // 轻柔吸附到正四极（仅 ±3.5° 范围，不影响自由错位探索）
      for (const snap of [0, 90, 180, 270]) {
        const diff = ((deg - snap + 540) % 360) - 180;
        if (Math.abs(diff) < 3.5) {
          deg = snap;
          break;
        }
      }
      onMutate((st) => {
        st.sats[drag.satIdx].angle = Math.round(normDeg(deg));
      });
    } else if (drag.mode === "focus") {
      // 允许在轨道圆井内自由拖动核心主体；靠近真正圆心时极轻吸附
      let fx = drag.startFocusX + dx / unit;
      let fy = drag.startFocusY + dy / unit;
      const maxOff = Math.max(0.18, state.orbitR * 0.52);
      const dist = Math.hypot(fx, fy);
      if (dist > maxOff) {
        fx = (fx / dist) * maxOff;
        fy = (fy / dist) * maxOff;
      }
      if (Math.hypot(fx, fy) < 0.032) {
        fx = 0;
        fy = 0;
      }
      onMutate((st) => {
        st.focusX = +fx.toFixed(3);
        st.focusY = +fy.toFixed(3);
      });
    } else if (drag.mode === "ring") {
      // 在开放星盘区横向拖动：联动顺滑旋转轨道并同步微调核心横移，保证 perf.mjs 横扫真在驱动轨道运动
      const deltaDeg = (dx / Math.max(120, unit * 1.4)) * 135;
      onMutate((st) => {
        st.sats.forEach((s, i) => {
          s.angle = Math.round(normDeg(drag.startAngles[i] + deltaDeg));
        });
      });
    }

    drag.lastX = px;
    drag.lastY = py;
    // 仅在 reduced-motion 静止模式才手动补绘；正常动画循环每帧自然消费最新状态，避免双绘卡顿
    if (reducedMotion.matches) ctrl.draw();
  });

  function endPointer(e) {
    if (drag.mode === null) return;
    // 若轻点某枚卫星（未拖拽），循环切换其视觉尺度（微星/配角/巨星）
    if (drag.mode === "sat" && !drag.moved && drag.satIdx >= 0) {
      const idx = drag.satIdx;
      onMutate((st) => {
        st.sats[idx].tier = nextTier(st.sats[idx].tier);
      });
    }
    if (drag.pointerId !== null) {
      try {
        canvas.releasePointerCapture(drag.pointerId);
      } catch {}
    }
    drag.mode = null;
    drag.satIdx = -1;
    drag.pointerId = null;
    canvas.style.cursor = "grab";
    onMutate(() => {}, true);
    if (reducedMotion.matches) ctrl.draw();
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", () => {
    if (drag.mode === null) hoverHit = null;
  });

  // 键盘支持（在画布获得焦点时）
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 12 : -12;
      onMutate((st) => {
        st.sats.forEach((s) => {
          s.angle = Math.round(normDeg(s.angle + delta));
        });
      }, true);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? 0.015 : -0.015;
      onMutate((st) => {
        st.focusR = +Math.min(0.44, Math.max(0.16, st.focusR + delta)).toFixed(3);
      }, true);
    } else if (e.key === " ") {
      e.preventDefault();
      startPulse();
    }
  });

  const ctrl = loop(canvas, (t, dt, info) => {
    render(t, dt, info);
  });

  // 初始静态安全帧（确保极早期截图或 reduced-motion 立即可见）
  render(0, 0, { still: reducedMotion.matches });

  return {
    draw: () => ctrl.draw(),
    startPulse,
    isIntroDone: () => introDone,
  };
}
