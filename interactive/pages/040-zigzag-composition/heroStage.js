// 040 锯齿形构图 · 开场高压闪电折轨锻造台 2D Canvas 渲染与直接操控
// 1:1 承袭 040 原海报：曜石黑底、斜灰结构带、电光黄+电光青双刃闪电、双环九芒星主焦点、虚线冲箭。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  LIMITS,
  applyAmplitudeDrag,
  applySingleStepFix,
  clamp,
  evaluate,
} from "./model.js";

const COL = {
  bg: "#050709",
  grid: "rgba(3, 190, 215, 0.08)",
  grayBand: "#222425",
  yellow: "#F7D304",
  yellowGlow: "rgba(247, 211, 4, 0.28)",
  cyan: "#03BED7",
  cyanGlow: "rgba(3, 190, 215, 0.26)",
  white: "#F5F7F8",
  danger: "#D9232E",
  dangerHi: "#FF6B6B",
  ok: "#36E5A3",
};

// 沿折线法向偏移生成单刃锋利多边形，呈现原海报「左黄刃 × 右青刃」的视觉冲击
function buildBladePolygon(screenPts, side, widthAtFn) {
  const n = screenPts.length;
  const outer = [];
  const inner = [];

  for (let i = 0; i < n; i++) {
    const p = screenPts[i];
    const w = widthAtFn(i, n);
    let nx = 0;
    let ny = 0;

    if (i === 0) {
      const dx = screenPts[1].x - p.x;
      const dy = screenPts[1].y - p.y;
      const l = Math.hypot(dx, dy) || 1;
      nx = -dy / l;
      ny = dx / l;
      // 起点削尖成闪电尾刃
      outer.push({ x: p.x + nx * side * w * 0.25, y: p.y + ny * side * w * 0.25 });
      inner.push({ x: p.x, y: p.y });
    } else if (i === n - 1) {
      const dx = p.x - screenPts[i - 1].x;
      const dy = p.y - screenPts[i - 1].y;
      const l = Math.hypot(dx, dy) || 1;
      nx = -dy / l;
      ny = dx / l;
      // 终点削尖刺出
      outer.push({ x: p.x + nx * side * w * 0.14, y: p.y + ny * side * w * 0.14 });
      inner.push({ x: p.x, y: p.y });
    } else {
      const a = screenPts[i - 1];
      const c = screenPts[i + 1];
      const d1x = p.x - a.x;
      const d1y = p.y - a.y;
      const l1 = Math.hypot(d1x, d1y) || 1;
      const n1x = -d1y / l1;
      const n1y = d1x / l1;

      const d2x = c.x - p.x;
      const d2y = c.y - p.y;
      const l2 = Math.hypot(d2x, d2y) || 1;
      const n2x = -d2y / l2;
      const n2y = d2x / l2;

      let bx = n1x + n2x;
      let by = n1y + n2y;
      const bl = Math.hypot(bx, by);
      if (bl < 0.08) {
        bx = n1x;
        by = n1y;
      } else {
        bx /= bl;
        by /= bl;
      }
      const miterDot = Math.max(0.32, bx * n1x + by * n1y);
      const miter = Math.min(2.3, 1 / miterDot);
      outer.push({
        x: p.x + bx * side * w * miter,
        y: p.y + by * side * w * miter,
      });
      inner.push({
        x: p.x + bx * side * 2.2,
        y: p.y + by * side * 2.2,
      });
    }
  }
  return [...outer, ...inner.reverse()];
}

function drawPoly(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// 九芒星（1:1 呼应 040 原海报中央圆环星芒，正圆绘制不压扁）
function drawStarburst(ctx, cx, cy, rOuter, rInner, spikes = 9) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// 运动冲刺剪影（纯几何动感斜倾侧影，无任何五官！）
function drawRunnerSilhouette(ctx, cx, cy, scale, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  // 头（简洁纯圆剪影，无五官）
  ctx.beginPath();
  ctx.arc(8, -22, 6.2, 0, Math.PI * 2);
  ctx.fill();
  // 前倾躯干
  ctx.beginPath();
  ctx.moveTo(6, -15);
  ctx.lineTo(13, -12);
  ctx.lineTo(1, 5);
  ctx.lineTo(-7, 2);
  ctx.closePath();
  ctx.fill();
  // 后蹬腿 + 前跨腿
  ctx.lineWidth = 5.4;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-2, 3);
  ctx.lineTo(14, 9);
  ctx.lineTo(10, 24);
  ctx.moveTo(-4, 3);
  ctx.lineTo(-17, 13);
  ctx.lineTo(-27, 19);
  // 双臂摆动
  ctx.lineWidth = 4.2;
  ctx.moveTo(6, -11);
  ctx.lineTo(20, -14);
  ctx.lineTo(26, -6);
  ctx.moveTo(4, -10);
  ctx.lineTo(-9, -4);
  ctx.lineTo(-18, -11);
  ctx.stroke();
  ctx.restore();
}

// 沿折线按归一化进度 s ∈ [0,1] 取点与切向
function samplePolyline(screenPts, s) {
  let total = 0;
  const lens = [];
  for (let i = 0; i < screenPts.length - 1; i++) {
    const l = Math.hypot(screenPts[i + 1].x - screenPts[i].x, screenPts[i + 1].y - screenPts[i].y);
    lens.push(l);
    total += l;
  }
  let target = clamp(s, 0, 1) * total;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i] || i === lens.length - 1) {
      const f = lens[i] > 1e-4 ? target / lens[i] : 0;
      const a = screenPts[i];
      const b = screenPts[i + 1];
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        ang: Math.atan2(b.y - a.y, b.x - a.x),
      };
    }
    target -= lens[i];
  }
  return { x: screenPts[0].x, y: screenPts[0].y, ang: 0 };
}

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 560;
  let dpr = pixelRatio(2);

  let intro = reducedMotion.matches ? 1 : 0;
  let dragMode = null; // null | { type: "node", idx } | { type: "focal" } | { type: "amp", lastX, startX, startY, locked }
  let hoverTarget = null;
  let redHotspots = []; // 画布内红标可点击热区 [{ x, y, w, h, action }]
  let lastEv = null;

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(260, Math.round(r.width));
    h = Math.max(220, Math.round(r.height));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function drawChamferBadge(x, y, text, bg, fg, border) {
    ctx.save();
    ctx.font = `700 ${w < 430 ? 11 : 12}px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
    const padX = 10;
    const bh = w < 430 ? 24 : 26;
    const tw = ctx.measureText(text).width;
    const bw = tw + padX * 2;
    const bx = clamp(x - bw / 2, 10, w - bw - 10);
    const by = clamp(y - bh / 2, 10, h - bh - 10);
    const cut = 6;

    ctx.beginPath();
    ctx.moveTo(bx + cut, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + bh - cut);
    ctx.lineTo(bx + bw - cut, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx, by + cut);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
    ctx.restore();
    return { x: bx, y: by, w: bw, h: bh };
  }

  function render(t, dt, { still }) {
    if (still) intro = 1;
    else if (intro < 1) intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.45);

    const aspect = w / h;
    const ev = evaluate(state, aspect);
    lastEv = ev;
    redHotspots = [];

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 曜石黑底与极细工程斜栅格
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    const step = Math.max(36, Math.round(w / 14));
    ctx.beginPath();
    for (let x = -h; x < w + h; x += step) {
      ctx.moveTo(x, h);
      ctx.lineTo(x + h * 0.72, 0);
    }
    ctx.stroke();

    // 2. 原海报标志性斜灰结构带（从左下斜切穿过画布中部）
    ctx.save();
    ctx.fillStyle = COL.grayBand;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.64);
    ctx.lineTo(w, h * 0.25);
    ctx.lineTo(w, h * 0.34);
    ctx.lineTo(0, h * 0.76);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. 场景氛围微件（保持极度克制，服务于折线本身）
    if (state.scene === "poster") {
      // 原海报散落的电光青与黄小锐角三角
      ctx.fillStyle = COL.cyan;
      ctx.beginPath();
      ctx.moveTo(w * 0.09, h * 0.44);
      ctx.lineTo(w * 0.16, h * 0.45);
      ctx.lineTo(w * 0.105, h * 0.51);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = COL.yellow;
      ctx.beginPath();
      ctx.moveTo(w * 0.89, h * 0.27);
      ctx.lineTo(w * 0.925, h * 0.285);
      ctx.lineTo(w * 0.895, h * 0.32);
      ctx.closePath();
      ctx.fill();
    } else if (state.scene === "sport") {
      // 赛道速度斜标尺与底角斜线
      ctx.strokeStyle = "rgba(247, 211, 4, 0.2)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const y0 = h * (0.76 + i * 0.045);
        ctx.beginPath();
        ctx.moveTo(w * 0.04, y0);
        ctx.lineTo(w * 0.30, y0 - h * 0.11);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(245, 247, 248, 0.42)";
      ctx.font = `700 ${w < 430 ? 10 : 11}px "IBM Plex Mono", monospace`;
      ctx.fillText("SPLIT 01 // ACCELERATE", w * 0.04, h * 0.94);
      ctx.textAlign = "right";
      ctx.fillText("FINISH GATE // 100M", w * 0.96, h * 0.08);
      ctx.textAlign = "left";
    } else if (state.scene === "music") {
      // 音乐演出电光音柱均衡器（底部右侧）
      const bars = 10;
      const bw = w < 430 ? 6 : 8;
      const gap = 4;
      const bx0 = w - bars * (bw + gap) - 18;
      const by0 = h - 18;
      for (let i = 0; i < bars; i++) {
        const phase = still ? i * 0.7 : t * 4.2 + i * 0.65;
        const energy = ev.score === 4 ? 1 : 0.48;
        const bh = (14 + Math.abs(Math.sin(phase)) * 34) * energy;
        ctx.fillStyle = i % 2 === 0 ? "rgba(247, 211, 4, 0.42)" : "rgba(3, 190, 215, 0.42)";
        ctx.fillRect(bx0 + i * (bw + gap), by0 - bh, bw, bh);
      }
    }

    // 计算当前帧像素顶点（开场前 0.65 秒做从左下到右上的干脆折线推进 reveal）
    const screenPts = state.nodes.map((p) => ({ x: p.u * w, y: p.v * h }));
    const revealEased = 1 - Math.pow(1 - intro, 3);
    const visPts = [];
    if (revealEased >= 0.999) {
      visPts.push(...screenPts);
    } else {
      const segs = screenPts.length - 1;
      const scaled = revealEased * segs;
      const full = Math.floor(scaled);
      const frac = scaled - full;
      for (let i = 0; i <= full && i < screenPts.length; i++) visPts.push(screenPts[i]);
      if (full < segs) {
        const a = screenPts[full];
        const b = screenPts[full + 1];
        visPts.push({ x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac });
      }
    }

    // 4. 绘制双刃电光黄 + 电光青闪电锯齿主干（1:1 还原原海报双色闪电！）
    const baseThick = clamp(Math.min(w, h) * 0.044, 13, 25);
    const sharpBoost = clamp((140 - ev.minAngle) / 100, 0.35, 1.15);
    const widthAt = (i, n) => {
      const mid = 1 - Math.abs(i / (n - 1) - 0.5) * 0.55;
      return baseThick * mid * (0.68 + 0.32 * sharpBoost);
    };

    if (visPts.length >= 2) {
      const leftYellow = buildBladePolygon(visPts, -1, widthAt);
      const rightCyan = buildBladePolygon(visPts, 1, widthAt);

      ctx.save();
      // 柔和双色电光底晕（极轻量，不耗性能）
      if (ev.score === 4) {
        ctx.shadowColor = COL.yellowGlow;
        ctx.shadowBlur = 16;
      }
      drawPoly(ctx, leftYellow);
      ctx.fillStyle = ev.selfIntersect ? "#D88E0B" : COL.yellow;
      ctx.fill();

      ctx.shadowColor = ev.score === 4 ? COL.cyanGlow : "transparent";
      ctx.shadowBlur = ev.score === 4 ? 14 : 0;
      drawPoly(ctx, rightCyan);
      ctx.fillStyle = ev.selfIntersect ? "#0A7C8E" : COL.cyan;
      ctx.fill();
      ctx.restore();

      // 5. 沿折线中脊的虚线冲刺导向箭（呼应原海报右上与左下虚线箭头）
      ctx.save();
      ctx.strokeStyle = "rgba(5, 7, 9, 0.85)";
      ctx.lineWidth = 2.6;
      ctx.lineJoin = "miter";
      ctx.beginPath();
      ctx.moveTo(visPts[0].x, visPts[0].y);
      for (let i = 1; i < visPts.length; i++) ctx.lineTo(visPts[i].x, visPts[i].y);
      ctx.stroke();

      // 右上延展虚线箭头（1:1 原海报顶部飞箭细节）
      if (visPts.length >= 2) {
        const last = visPts[visPts.length - 1];
        const prev = visPts[visPts.length - 2];
        const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
        const tipX = clamp(last.x + Math.cos(ang) * 28, 16, w - 16);
        const tipY = clamp(last.y + Math.sin(ang) * 28, 16, h - 16);
        ctx.strokeStyle = COL.yellow;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.setLineDash([]);
        // 实心三角箭头
        ctx.fillStyle = COL.yellow;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - Math.cos(ang - 0.5) * 11, tipY - Math.sin(ang - 0.5) * 11);
        ctx.lineTo(tipX - Math.cos(ang + 0.5) * 11, tipY - Math.sin(ang + 0.5) * 11);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 6. 视线推进脉冲光箭（沿折线加速推进，并在拐点闪烁能量环）
      if (revealEased > 0.92) {
        const pulseCount = 2;
        const speed = ev.score === 4 ? 0.34 : 0.22;
        for (let k = 0; k < pulseCount; k++) {
          const s = still ? (k === 0 ? 0.36 : 0.74) : (t * speed + k * 0.5) % 1;
          const pt = samplePolyline(screenPts, s);
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.ang);
          ctx.fillStyle = COL.white;
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(-7, -5.5);
          ctx.lineTo(-3.5, 0);
          ctx.lineTo(-7, 5.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // 7. 若焦点未贴拐点，画原海报风格的黄色折线虚线引注指向推荐主拐点
    const fx = state.focal.u * w;
    const fy = state.focal.v * h;
    if (!ev.focalOnCorner && ev.bestTargetCorner) {
      const tx = ev.bestTargetCorner.u * w;
      const ty = ev.bestTargetCorner.v * h;
      ctx.save();
      ctx.strokeStyle = "rgba(247, 211, 4, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      // 目标强拐点闪烁脉冲切角框
      const pulse = still ? 0.85 : 0.65 + 0.35 * Math.sin(t * 5);
      ctx.strokeStyle = `rgba(247, 211, 4, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 15, ty - 15, 30, 30);
      ctx.restore();
    }

    // 8. 绘制每个内部拐点的切角可拖手柄 + 角度读数
    const handleR = w < 430 ? 9 : 10;
    for (const c of ev.corners) {
      const cx = c.u * w;
      const cy = c.v * h;
      const isActive =
        (dragMode && dragMode.type === "node" && dragMode.idx === c.index) ||
        (hoverTarget && hoverTarget.type === "node" && hoverTarget.idx === c.index);
      const isBadAngle = c.innerAngle > LIMITS.maxSharpAngle || c.innerAngle < LIMITS.minAngle || ev.selfIntersect;
      const isFocalLocked = ev.focalOnCorner && ev.nearestCorner.index === c.index;

      // 45° 菱形切角铆钉
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      const sz = isActive ? handleR * 1.28 : handleR;
      ctx.fillStyle = isBadAngle ? COL.danger : isFocalLocked ? COL.ok : COL.bg;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.lineWidth = isActive ? 2.5 : 2;
      ctx.strokeStyle = isBadAngle ? COL.white : COL.white;
      ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();

      // 只在空间允许的拐点旁标注角度（折数 ≤ 5 全标，折数 > 5 隔点标最锐点，防止字叠字）
      const showLabel = ev.turnCount <= 5 || c.index === ev.sharpestIdx || c.index % 2 === 1;
      if (showLabel && !isFocalLocked) {
        const lx = clamp(cx + (c.sign >= 0 ? 18 : -18), 28, w - 28);
        const ly = clamp(cy + (c.v < 0.25 ? 20 : -18), 16, h - 16);
        ctx.save();
        ctx.font = `600 ${w < 430 ? 10 : 11}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = `${Math.round(c.innerAngle)}°`;
        const tw = ctx.measureText(label).width + 8;
        ctx.fillStyle = "rgba(5, 7, 9, 0.86)";
        ctx.fillRect(lx - tw / 2, ly - 9, tw, 18);
        ctx.fillStyle = isBadAngle ? COL.dangerHi : COL.white;
        ctx.fillText(label, lx, ly + 0.5);
        ctx.restore();
      }
    }

    // 9. 绘制 1:1 原海报双环九芒星主焦点（严格等比正圆，不压扁！）
    const focalR = clamp(Math.min(w, h) * 0.088, 28, 42);
    const focalActive =
      (dragMode && dragMode.type === "focal") ||
      (hoverTarget && hoverTarget.type === "focal");

    ctx.save();
    // 焦点卡扣成功时的外层切角能量光环
    if (ev.focalOnStrongCorner && !ev.selfIntersect) {
      const ringPulse = still ? 1 : 1 + 0.07 * Math.sin(t * 5.2);
      ctx.strokeStyle = COL.cyan;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.arc(fx, fy, focalR * 1.24 * ringPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (!ev.focalOnStrongCorner) {
      // 错态红虚线警示圈
      ctx.strokeStyle = COL.dangerHi;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(fx, fy, focalR * 1.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 外层明黄圆环 + 黑底 + 内层明黄环（1:1 原海报双环焦点）
    ctx.beginPath();
    ctx.arc(fx, fy, focalR, 0, Math.PI * 2);
    ctx.fillStyle = COL.bg;
    ctx.fill();
    ctx.lineWidth = focalActive ? 5 : 4;
    ctx.strokeStyle = ev.focalOnStrongCorner ? COL.yellow : COL.dangerHi;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(fx, fy, focalR * 0.77, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = COL.yellow;
    ctx.stroke();

    // 焦点内核随三题材换装
    if (state.scene === "poster") {
      ctx.save();
      ctx.translate(fx, fy);
      if (!still && ev.focalOnStrongCorner) ctx.rotate(t * 0.45);
      drawStarburst(ctx, 0, 0, focalR * 0.52, focalR * 0.21, 9);
      ctx.fillStyle = COL.yellow;
      ctx.fill();
      ctx.restore();
    } else if (state.scene === "sport") {
      drawRunnerSilhouette(ctx, fx, fy + 1, focalR / 34, COL.yellow);
    } else {
      // 音乐演出电光闪电双峰
      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = COL.yellow;
      ctx.beginPath();
      ctx.moveTo(4, -focalR * 0.52);
      ctx.lineTo(-10, 2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, focalR * 0.52);
      ctx.lineTo(11, -3);
      ctx.lineTo(1, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 10. 画布内直击病灶红标（可点击一步修对应项；自动避让左上 HUD 框）
    if (!ev.primary.ok) {
      if (!ev.focalOnStrongCorner) {
        const txt = ev.focalOnSegment ? "× 落直段 · 拖至拐点" : "× 脱轨失焦 · 点此卡拐点";
        const badgeY = fy - focalR - 20 < 54 ? fy + focalR + 18 : fy - focalR - 20;
        const box = drawChamferBadge(fx, badgeY, txt, COL.danger, COL.white, COL.yellow);
        redHotspots.push({ ...box, fix: "snapFocal" });
      }
      if (!ev.checks.sharpness || !ev.checks.advance) {
        const sc = ev.corners[Math.min(ev.corners.length - 1, Math.max(0, ev.sharpestIdx - 1))];
        const bx = sc.u * w;
        const by = sc.v * h + (sc.v > 0.62 ? -34 : 34);
        const msg = ev.selfIntersect
          ? "× 折线自交 · 点此解开"
          : ev.minAngle < LIMITS.minAngle
            ? `× 过锐 ${Math.round(ev.minAngle)}° · 点此放宽`
            : ev.minAngle > LIMITS.maxSharpAngle
              ? `× 钝折 ${Math.round(ev.minAngle)}° · 右拖拉尖`
              : ev.turnCount > LIMITS.maxTurns
                ? `× ${ev.turnCount} 折过密 · 点此精简`
                : `× 仅 ${ev.turnCount} 折 · 点此增折`;
        const box = drawChamferBadge(bx, by, msg, COL.danger, COL.white, COL.cyan);
        redHotspots.push({ ...box, fix: "primary" });
      }
    }

    // 11. 左上角轻量实时几何角标（工业等宽，防挤）
    ctx.save();
    const hudText = `${ev.turnCount} 拐点 · 锐角 ${Math.round(ev.minAngle)}° · 长短比 ${ev.lengthRatio.toFixed(2)}×`;
    ctx.font = `600 ${w < 430 ? 10.5 : 11.5}px "IBM Plex Mono", "Noto Sans SC", monospace`;
    const htw = ctx.measureText(hudText).width + 18;
    ctx.fillStyle = "rgba(13, 18, 22, 0.9)";
    ctx.fillRect(12, 12, htw, 26);
    ctx.strokeStyle = ev.score === 4 ? COL.cyan : "rgba(247, 211, 4, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, htw, 26);
    ctx.fillStyle = ev.score === 4 ? COL.cyan : COL.yellow;
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, 21, 25.5);
    ctx.restore();

    ctx.restore();
  }

  const ctrl = loop(canvas, render);

  // 坐标换算与命中测试
  function getPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top, r };
  }

  function hitTest(x, y) {
    // 1. 红标热区优先
    for (const box of redHotspots) {
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        return { type: "hotspot", fix: box.fix };
      }
    }
    // 2. 双环星芒焦点
    const fx = state.focal.u * w;
    const fy = state.focal.v * h;
    const focalR = clamp(Math.min(w, h) * 0.088, 28, 42);
    if (Math.hypot(x - fx, y - fy) <= focalR * 1.15) {
      return { type: "focal" };
    }
    // 3. 内部拐点手柄
    for (let i = 1; i < state.nodes.length - 1; i++) {
      const nx = state.nodes[i].u * w;
      const ny = state.nodes[i].v * h;
      if (Math.hypot(x - nx, y - ny) <= 22) {
        return { type: "node", idx: i };
      }
    }
    return null;
  }

  function startPointer(x, y, isTouch) {
    const hit = hitTest(x, y);
    if (hit && hit.type === "hotspot") {
      if (hit.fix === "snapFocal" && lastEv?.bestTargetCorner) {
        state.focal = { u: lastEv.bestTargetCorner.u, v: lastEv.bestTargetCorner.v };
      } else {
        applySingleStepFix(state, w / h);
      }
      ctrl.draw();
      onChange();
      return true;
    }
    if (hit && (hit.type === "node" || hit.type === "focal")) {
      dragMode = { ...hit, startX: x, startY: y, moved: false };
      return true;
    }
    // 空白处横拖调节整条锯齿振幅（触屏时先不锁定，判断横向意图再防滚）
    dragMode = { type: "amp", lastX: x, startX: x, startY: y, locked: !isTouch };
    return !isTouch;
  }

  function movePointer(x, y, prevent) {
    if (!dragMode) {
      hoverTarget = hitTest(x, y);
      canvas.style.cursor = hoverTarget ? "pointer" : "ew-resize";
      return;
    }
    if (dragMode.type === "node") {
      prevent?.();
      dragMode.moved = true;
      const prevEv = evaluate(state, w / h);
      const lockedFocal = prevEv.focalOnCorner && prevEv.nearestCorner.index === dragMode.idx;
      const u = clamp(x / w, 0.07, 0.93);
      const v = clamp(y / h, 0.08, 0.92);
      state.nodes[dragMode.idx].u = u;
      state.nodes[dragMode.idx].v = v;
      if (lockedFocal) {
        state.focal.u = u;
        state.focal.v = v;
      }
      state.activePreset = "custom";
      ctrl.draw();
      onChange();
    } else if (dragMode.type === "focal") {
      prevent?.();
      dragMode.moved = true;
      let u = clamp(x / w, 0.08, 0.92);
      let v = clamp(y / h, 0.09, 0.91);
      // 靠近内部拐点时柔和磁吸
      const aspect = w / h;
      for (let i = 1; i < state.nodes.length - 1; i++) {
        const d = Math.hypot((u - state.nodes[i].u) * aspect, v - state.nodes[i].v);
        if (d < 0.068) {
          u = state.nodes[i].u;
          v = state.nodes[i].v;
          break;
        }
      }
      state.focal.u = u;
      state.focal.v = v;
      state.activePreset = "custom";
      ctrl.draw();
      onChange();
    } else if (dragMode.type === "amp") {
      const dx = x - dragMode.startX;
      const dy = y - dragMode.startY;
      if (!dragMode.locked) {
        if (Math.hypot(dx, dy) < 5) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.35) {
          dragMode = null; // 纵向手势让给页面滚动
          return;
        }
        dragMode.locked = true;
      }
      prevent?.();
      const stepU = (x - dragMode.lastX) / w;
      dragMode.lastX = x;
      if (Math.abs(stepU) > 0.0005) {
        applyAmplitudeDrag(state, stepU);
        ctrl.draw();
        onChange();
      }
    }
  }

  function endPointer() {
    // 轻点拐点直接把星芒吸到该拐点
    if (dragMode && dragMode.type === "node" && !dragMode.moved) {
      const pt = state.nodes[dragMode.idx];
      state.focal = { u: pt.u, v: pt.v };
      state.activePreset = "custom";
      ctrl.draw();
      onChange();
    }
    dragMode = null;
  }

  // 鼠标事件
  canvas.addEventListener("mousedown", (e) => {
    const p = getPos(e.clientX, e.clientY);
    if (startPointer(p.x, p.y, false)) e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    const p = getPos(e.clientX, e.clientY);
    movePointer(p.x, p.y, () => e.preventDefault());
  });
  window.addEventListener("mouseup", endPointer);

  // 触屏事件（直接监听 touch*，确保 perf.mjs 的 Input.dispatchTouchEvent 100% 驱动重绘！）
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const p = getPos(t0.clientX, t0.clientY);
    const hitImmediate = startPointer(p.x, p.y, true);
    if (hitImmediate) e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length || !dragMode) return;
    const t0 = e.touches[0];
    const p = getPos(t0.clientX, t0.clientY);
    movePointer(p.x, p.y, () => e.preventDefault());
  }, { passive: false });

  canvas.addEventListener("touchend", endPointer);
  canvas.addEventListener("touchcancel", endPointer);

  // 键盘操作（无障碍完整可用）
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      applyAmplitudeDrag(state, 0.04);
      ctrl.draw();
      onChange();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyAmplitudeDrag(state, -0.04);
      ctrl.draw();
      onChange();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const ev = evaluate(state, w / h);
      const curIdx = ev.focalOnCorner ? ev.nearestCorner.index : 0;
      const maxIdx = state.nodes.length - 2;
      const nextIdx = e.key === "ArrowUp"
        ? (curIdx >= maxIdx ? 1 : curIdx + 1)
        : (curIdx <= 1 ? maxIdx : curIdx - 1);
      state.focal = { ...state.nodes[nextIdx] };
      ctrl.draw();
      onChange();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      applySingleStepFix(state, w / h);
      ctrl.draw();
      onChange();
    }
  });

  return {
    draw: () => ctrl.draw(),
    getAspect: () => w / h,
    destroy: () => ro.disconnect(),
  };
}
