// 117 连续性原则 · 主入口与开场活体交叉轨交分道台（main.js）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  LOGICAL_W,
  LOGICAL_H,
  THRESHOLDS,
  PRESETS,
  createInitialState,
  evaluate,
  clamp,
} from "./model.js";
import {
  initSec01Anatomy,
  initSec02Occlusion,
  initSec03AssociationField,
  initSec04Neighbors,
  initSec05RealUI,
  initSec06WhenNot,
  initSec07Practice,
  initPosterLightbox,
} from "./demos.js";

const COLOR = {
  paper: "#FCF7EF",
  ink: "#111111",
  inkMuted: "#4D4942",
  green: "#006627",
  greenSoft: "rgba(0, 102, 39, 0.14)",
  orange: "#F65A04",
  orangeSoft: "rgba(246, 90, 4, 0.16)",
  pink: "#F47A98",
  navy: "#13115F",
  alert: "#C62822",
  alertSoft: "rgba(198, 40, 34, 0.14)",
  ok: "#006627",
};

const state = createInitialState();
let evalRes = evaluate(state);
let showProbe = true;
let introProgress = 0; // 开场 0..1 渐进绘制（0.75 秒走完，任意帧都完整好看）
let probePhase = 0;    // 视线探针循环相位 0..1
let lastKeyActionAt = 0;

// ---- 坐标映射（严格等比缩放，圆永远是正圆！） ----
function getTransform(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(260, rect.width);
  const h = Math.max(200, rect.height);
  const padX = w < 520 ? 4 : 14;
  const padY = w < 520 ? 10 : 12;
  const scale = Math.min((w - padX * 2) / LOGICAL_W, (h - padY * 2) / LOGICAL_H);
  const ox = (w - LOGICAL_W * scale) * 0.5;
  const oy = (h - LOGICAL_H * scale) * 0.5;
  return { w, h, scale, ox, oy };
}

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const tr = getTransform(canvas);
  const lx = (clientX - rect.left - tr.ox) / tr.scale;
  const ly = (clientY - rect.top - tr.oy) / tr.scale;
  return { x: lx, y: ly, tr };
}

// ---- 绘制三角形箭头（忠实承袭 117 原海报尖锐几何箭首） ----
function drawArrowHead(ctx, tipX, tipY, dirX, dirY, size, fill) {
  const ang = Math.atan2(dirY, dirX);
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(size * 0.95, 0);
  ctx.lineTo(-size * 0.65, -size * 0.72);
  ctx.lineTo(-size * 0.65, size * 0.72);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

// ---- 绘制带白底圆角标签（保证在任意曲线上方绝对清晰可读） ----
function drawTag(ctx, x, y, text, bg, fg, border = null) {
  ctx.save();
  ctx.font = "700 13px 'Noto Sans SC', 'Chivo', sans-serif";
  const tw = ctx.measureText(text).width;
  const px = 10;
  const h = 24;
  const rx = x - tw / 2 - px;
  const ry = y - h / 2;
  const rw = tw + px * 2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, h, 6);
  ctx.fillStyle = bg;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

// ---- 绘制原海报风格的 L 形虚线引注 ----
function drawLeader(ctx, fromX, fromY, elbowX, elbowY, toX, toY, label, sub, alignRight = false) {
  ctx.save();
  ctx.strokeStyle = "#1E1D1B";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 小箭尖指向目标点
  const dx = toX - elbowX;
  const dy = toY - elbowY;
  const len = Math.hypot(dx, dy) || 1;
  drawArrowHead(ctx, toX, toY, dx / len, dy / len, 6.5, "#1E1D1B");

  ctx.textAlign = alignRight ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111111";
  ctx.font = "700 13.5px 'Noto Sans SC', sans-serif";
  const tx = alignRight ? fromX - 8 : fromX + 8;
  ctx.fillText(label, tx, fromY + 4);
  if (sub) {
    ctx.fillStyle = "#4D4942";
    ctx.font = "500 11.5px 'Space Mono', 'Noto Sans SC', monospace";
    ctx.fillText(sub, tx, fromY + 20);
  }
  ctx.restore();
}

// ---- 绘制单个元素（随三大场景变化外观，但点心坐标 100% 源自单真源） ----
function drawStreamNode(ctx, pt, idx, streamIdx, r, fill, scene, pureInk, isHighlight) {
  ctx.save();
  if (scene === "poster") {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (isHighlight) {
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = COLOR.navy;
      ctx.stroke();
    }
  } else if (scene === "transit") {
    // 地铁站环：白芯彩圈，模拟真实换乘线网
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 4.6;
    ctx.strokeStyle = fill;
    ctx.stroke();
    if (idx === 0 || idx === 17) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    }
  } else {
    // 图文阅读节拍卡：沿切线排布的小矩形信息卡片
    const ang = Math.atan2(pt.ty, pt.tx);
    ctx.translate(pt.x, pt.y);
    ctx.rotate(ang);
    const rw = r * 2.25;
    const rh = r * 1.38;
    ctx.beginPath();
    ctx.roundRect(-rw / 2, -rh / 2, rw, rh, 4);
    ctx.fillStyle = streamIdx === 0 ? (pureInk ? "#1B1B1B" : "#006627") : "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = fill;
    ctx.stroke();

    // 卡片内部模拟文字短杠
    ctx.fillStyle = streamIdx === 0 ? "#FCF7EF" : fill;
    ctx.fillRect(-rw * 0.3, -2, rw * 0.6, 2.2);
    ctx.globalAlpha = 0.65;
    ctx.fillRect(-rw * 0.3, 2.5, rw * 0.4, 1.8);
  }
  ctx.restore();
}

// ---- 绘制真实视线探针轨迹（清晰展示顺畅穿交、交点串轨或跨距刹停） ----
function drawProbe(ctx, probe, phase, streamIdx, isPureInk) {
  const pts = probe.path;
  if (!pts || pts.length < 2) return;

  const isWarn = probe.status !== "clean";
  const trailColor = isWarn
    ? COLOR.alert
    : streamIdx === 0
      ? (isPureInk ? COLOR.navy : "#006627")
      : (isPureInk ? "#8F1D48" : "#D94900");

  // 1. 淡淡的探针已探测路径细丝
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = isWarn ? "rgba(198, 40, 34, 0.46)" : "rgba(19, 17, 95, 0.24)";
  ctx.lineWidth = isWarn ? 3 : 2.2;
  ctx.setLineDash(isWarn ? [6, 5] : [4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. 沿实际探针路径匀速行进的视线光斑
  const segCount = pts.length - 1;
  const posF = clamp(phase, 0, 0.999) * segCount;
  const i0 = Math.floor(posF);
  const f = posF - i0;
  const a = pts[i0];
  const b = pts[Math.min(segCount, i0 + 1)];
  const px = a.x + (b.x - a.x) * f;
  const py = a.y + (b.y - a.y) * f;

  // 外圈呼吸环
  ctx.beginPath();
  ctx.arc(px, py, 20, 0, Math.PI * 2);
  ctx.fillStyle = isWarn ? "rgba(198, 40, 34, 0.16)" : "rgba(19, 17, 95, 0.12)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, 14.5, 0, Math.PI * 2);
  ctx.strokeStyle = trailColor;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 核心视点
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = trailColor;
  ctx.fill();

  // 3. 若发生串轨或刹停，在真实事故点标出精准警报圈（置上方清晰象限，绝不与下方交角牌重叠）
  if (probe.status === "jumped" && probe.jumpedAt && streamIdx === 0) {
    const j = probe.jumpedAt;
    ctx.beginPath();
    ctx.arc(j.x, j.y, 21, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR.alert;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    drawTag(ctx, clamp(j.x + 14, 96, LOGICAL_W - 108), clamp(j.y - 44, 24, LOGICAL_H - 34), "视线在此串轨!", COLOR.alert, "#FFFFFF");
  } else if (probe.status === "stalled" && probe.stalledAt && streamIdx === 0) {
    const s = probe.stalledAt;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR.alert;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    const nearGreenHandle = Math.hypot(s.x - evalRes.handles.green.x, s.y - evalRes.handles.green.y) < 75;
    const tagX = nearGreenHandle ? clamp(s.x + 62, 90, LOGICAL_W - 90) : clamp(s.x, 86, LOGICAL_W - 86);
    const tagY = nearGreenHandle ? clamp(s.y + 18, 28, LOGICAL_H - 28) : clamp(s.y - 38, 24, LOGICAL_H - 34);
    drawTag(ctx, tagX, tagY, "探针刹停", COLOR.alert, "#FFFFFF");
  }
  ctx.restore();
}

// ---- 绘制可交互拖拽手柄（紧贴曲线折点与交角几何） ----
function drawSplineHandle(ctx, x, y, label, active, isBroken, accent) {
  ctx.save();
  const ringR = active ? 22 : 19;

  // 柔和脉动底环
  ctx.beginPath();
  ctx.arc(x, y, ringR + 5, 0, Math.PI * 2);
  ctx.fillStyle = isBroken ? "rgba(198, 40, 34, 0.14)" : "rgba(19, 17, 95, 0.10)";
  ctx.fill();

  // 实体圆环手柄
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = isBroken ? COLOR.alert : accent;
  ctx.stroke();

  // 上下拖动双箭头小符
  ctx.fillStyle = isBroken ? COLOR.alert : accent;
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x - 4.5, y - 3);
  ctx.lineTo(x + 4.5, y - 3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + 9);
  ctx.lineTo(x - 4.5, y + 3);
  ctx.lineTo(x + 4.5, y + 3);
  ctx.closePath();
  ctx.fill();

  if (label) {
    drawTag(
      ctx,
      x,
      y - 33,
      label,
      isBroken ? COLOR.alert : "#111111",
      "#FFFFFF"
    );
  }
  ctx.restore();
}

// ---- 主画布整帧渲染 ----
function renderHeroCanvas(canvas, ctx, t, dt, { still }) {
  const tr = getTransform(canvas);
  const dpr = pixelRatio(2);
  const pw = Math.round(tr.w * dpr);
  const ph = Math.round(tr.h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }

  // 开场 0.72 秒顺滑入场（任意帧都完整清晰，reducedMotion 下直接满格）
  if (still) {
    introProgress = 1;
    probePhase = 0.56;
  } else {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) / 0.72);
    if (showProbe) {
      probePhase = (probePhase + dt * 0.24) % 1;
    }
  }
  const easeIntro = 1 - Math.pow(1 - introProgress, 3);
  const showDesktopCallouts = tr.w >= 620;

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. 原海报暖象牙画纸底（无暗黑仪表盘底框）
  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(0, 0, tr.w, tr.h);

  // 场景专属极克制底纹（地铁轻格网 / 图文隐形参考线）
  if (state.scene === "transit") {
    ctx.strokeStyle = "rgba(19, 17, 95, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 28; x < tr.w; x += 36) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, tr.h); ctx.stroke();
    }
    for (let y = 28; y < tr.h; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(tr.w, y); ctx.stroke();
    }
  } else if (state.scene === "reading") {
    ctx.strokeStyle = "rgba(0, 102, 39, 0.07)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    for (let i = 1; i <= 5; i++) {
      const x = (tr.w / 6) * i;
      ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, tr.h - 12); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  ctx.translate(tr.ox, tr.oy);
  ctx.scale(tr.scale, tr.scale);

  const gColor = state.pureInk ? COLOR.ink : COLOR.green;
  const oColor = state.pureInk ? COLOR.ink : COLOR.orange;

  // 2. 地铁模式淡轨底线
  if (state.scene === "transit") {
    const drawRail = (poly, col) => {
      ctx.save();
      ctx.beginPath();
      poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    };
    drawRail(evalRes.greenPoly, gColor);
    drawRail(evalRes.orangePoly, oColor);
  }

  // 3. 支柱高亮区（点按底部四栏任一柱时在画布上精准点亮）
  if (state.highlightPillar === "direction" && evalRes.crossing) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(evalRes.crossing.x, evalRes.crossing.y, 72, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(19, 17, 95, 0.08)";
    ctx.fill();
    ctx.strokeStyle = COLOR.navy;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.restore();
  } else if (state.highlightPillar === "path" && evalRes.kinkPoint) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(evalRes.kinkPoint.x, evalRes.kinkPoint.y, 58, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 102, 39, 0.10)";
    ctx.fill();
    ctx.strokeStyle = COLOR.green;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // 4. 交点角度量角弧（真实单真源几何角度）
  if (evalRes.crossing) {
    const c = evalRes.crossing;
    const isGrazing = evalRes.crossingDeg < THRESHOLDS.minCrossDeg;
    const a1 = Math.atan2(c.va.y, c.va.x);
    const a2 = Math.atan2(c.vb.y, c.vb.x);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    ctx.save();
    // 交点切线延长淡虚线
    ctx.strokeStyle = isGrazing ? "rgba(198, 40, 34, 0.42)" : "rgba(19, 17, 95, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(c.x - c.va.x * 74, c.y - c.va.y * 74);
    ctx.lineTo(c.x + c.va.x * 74, c.y + c.va.y * 74);
    ctx.moveTo(c.x - c.vb.x * 74, c.y - c.vb.y * 74);
    ctx.lineTo(c.x + c.vb.x * 74, c.y + c.vb.y * 74);
    ctx.stroke();
    ctx.setLineDash([]);

    // 扇形量角弧
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, 46, a1, a1 + diff, diff < 0);
    ctx.closePath();
    ctx.fillStyle = isGrazing ? "rgba(198, 40, 34, 0.16)" : "rgba(19, 17, 95, 0.10)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(c.x, c.y, 46, a1, a1 + diff, diff < 0);
    ctx.strokeStyle = isGrazing ? COLOR.alert : COLOR.navy;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 交角标牌（稳放交点下方偏左独立位，带细引线，绝不与上方串轨警报或右方手柄相撞）
    const lx = clamp(c.x - 62, 110, LOGICAL_W - 140);
    const ly = clamp(c.y + 52, 40, LOGICAL_H - 22);
    ctx.beginPath();
    ctx.moveTo(c.x - 6, c.y + 18);
    ctx.lineTo(lx + 18, ly - 12);
    ctx.strokeStyle = isGrazing ? "rgba(198, 40, 34, 0.55)" : "rgba(19, 17, 95, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    drawTag(
      ctx,
      lx,
      ly,
      `交角 ${Math.round(evalRes.crossingDeg)}°`,
      isGrazing ? "#FDF0EF" : "#FFFFFF",
      isGrazing ? COLOR.alert : COLOR.navy,
      isGrazing ? COLOR.alert : "#C7C4D8"
    );
    ctx.restore();
  }

  // 5. 若有缺口断链，在绿轨断裂处画出可点按修补的红色虚线桥
  if (evalRes.gapRatio > THRESHOLDS.maxGapRatio && evalRes.gapEnds) {
    const [pA, pB] = evalRes.gapEnds;
    const mid = evalRes.gapMid;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.strokeStyle = COLOR.alert;
    ctx.lineWidth = 2.6;
    ctx.setLineDash([7, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    const pulse = still ? 0 : Math.sin(t * 4.5) * 2.5;
    ctx.beginPath();
    ctx.arc(mid.x, mid.y, 17 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(198, 40, 34, 0.12)";
    ctx.fill();
    ctx.strokeStyle = COLOR.alert;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    drawTag(ctx, mid.x, mid.y + 34, `缺口 ${evalRes.gapRatio.toFixed(1)}× · 点此补齐`, COLOR.alert, "#FFFFFF");
    ctx.restore();
  }

  // 6. 若橘轨有离轨抖动，画出原应平滑的基准淡线 + 偏离短垂线
  if (evalRes.maxJitterPx > THRESHOLDS.maxJitterPx) {
    ctx.save();
    ctx.beginPath();
    evalRes.orangePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = "rgba(246, 90, 4, 0.28)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 偏轨提示按钮（可点按一键归顺）
    const jPt = evalRes.orangePts[3];
    if (jPt) {
      drawTag(ctx, jPt.x + 28, jPt.y + 44, `离轨 ±${Math.round(evalRes.maxJitterPx)}px · 点此顺齐`, "#FFF3EE", "#B33B00", "#E56517");
    }
    ctx.restore();
  }

  // 7. 绘制双轨真实圆点与终端三角箭头（开场按从左到右逐颗现身）
  const visibleGreen = Math.max(2, Math.round(evalRes.greenPts.length * easeIntro));
  const visibleOrange = Math.max(2, Math.round(evalRes.orangePts.length * easeIntro));

  for (let i = 0; i < visibleGreen; i++) {
    const pt = evalRes.greenPts[i];
    drawStreamNode(ctx, pt, i, 0, evalRes.dotRadius, gColor, state.scene, state.pureInk, false);
  }
  if (easeIntro > 0.85 && evalRes.greenPts.length > 2) {
    const last = evalRes.greenPts[evalRes.greenPts.length - 1];
    const prev = evalRes.greenPts[evalRes.greenPts.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    drawArrowHead(ctx, last.x + (dx / len) * 34, last.y + (dy / len) * 34, dx / len, dy / len, 22, gColor);
  }

  for (let i = 0; i < visibleOrange; i++) {
    const pt = evalRes.orangePts[i];
    drawStreamNode(ctx, pt, i, 1, evalRes.dotRadius, oColor, state.scene, state.pureInk, false);
  }
  if (easeIntro > 0.85 && evalRes.orangePts.length > 2) {
    const last = evalRes.orangePts[evalRes.orangePts.length - 1];
    const prev = evalRes.orangePts[evalRes.orangePts.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    drawArrowHead(ctx, last.x + (dx / len) * 34, last.y + (dy / len) * 34, dx / len, dy / len, 22, oColor);
  }

  // 地铁模式起终点站牌
  if (state.scene === "transit") {
    const g0 = evalRes.greenPts[0];
    const o0 = evalRes.orangePts[0];
    if (g0) drawTag(ctx, g0.x + 26, g0.y - 30, "1 号线 · 绿轨", gColor, "#FFFFFF");
    if (o0) drawTag(ctx, o0.x + 26, o0.y + 32, "4 号线 · 橘轨", oColor, "#FFFFFF");
  } else if (state.scene === "reading") {
    const g0 = evalRes.greenPts[0];
    const o0 = evalRes.orangePts[0];
    if (g0) drawTag(ctx, g0.x + 30, g0.y - 30, "主文阅读流", gColor, "#FFFFFF");
    if (o0) drawTag(ctx, o0.x + 30, o0.y + 32, "旁注对照流", "#FFFFFF", oColor, oColor);
  }

  // 8. 活体视线探针（真实最小偏角计算）
  if (showProbe && easeIntro > 0.7) {
    drawProbe(ctx, evalRes.probeGreen, probePhase, 0, state.pureInk);
    drawProbe(ctx, evalRes.probeOrange, (probePhase + 0.35) % 1, 1, state.pureInk);
  }

  // 9. 原海报风格 L 形黑色虚线引注（宽屏在全达标时呈现三处完整引注；窄屏在上下留白区呈两处原海报标引）
  if (showDesktopCallouts && evalRes.passedCount === 4) {
    if (evalRes.crossing) {
      drawLeader(
        ctx,
        626,
        52,
        550,
        52,
        evalRes.crossing.x + 8,
        evalRes.crossing.y - 18,
        "双轨交点不拐弯",
        `CROSSING ${Math.round(evalRes.crossingDeg)}° · ZERO JUMP`,
        false
      );
    }
    const oSample = evalRes.orangePts[3];
    if (oSample) {
      drawLeader(
        ctx,
        74,
        356,
        oSample.x,
        356,
        oSample.x,
        oSample.y + 18,
        "平滑路径自动串成整体",
        `MAX KINK ${Math.round(evalRes.maxKinkDeg)}° ≤ 22°`,
        false
      );
    }
    const gTail = evalRes.greenPts[evalRes.greenPts.length - 5];
    if (gTail) {
      drawLeader(
        ctx,
        662,
        368,
        gTail.x - 40,
        368,
        gTail.x - 6,
        gTail.y + 18,
        "各自沿原有方向延续",
        `STEP RATIO ${evalRes.gapRatio.toFixed(2)}×`,
        false
      );
    }
  }

  // 10. 两个实体曲线雕塑手柄（绿轨弯折点 + 橘轨交角杆）
  const gh = evalRes.handles.green;
  const oh = evalRes.handles.orange;
  const kinkBroken = evalRes.maxKinkDeg > THRESHOLDS.maxKinkDeg;
  const crossBroken = !evalRes.hasCrossing || evalRes.crossingDeg < THRESHOLDS.minCrossDeg;

  drawSplineHandle(
    ctx,
    gh.x,
    gh.y,
    kinkBroken ? `拖此掰顺 ${Math.round(evalRes.maxKinkDeg)}° 尖折` : "拖此弯曲绿轨",
    activeDrag === "green" || activeDrag === "sweep",
    kinkBroken,
    gColor
  );

  drawSplineHandle(
    ctx,
    oh.x,
    oh.y,
    crossBroken ? `拖此拉开 ${Math.round(evalRes.crossingDeg)}° 交角` : "拖此改交角",
    activeDrag === "orange",
    crossBroken,
    oColor
  );

  ctx.restore();

  // 11. 手机竖屏（< 520px 宽且上下有充裕空气时）：用屏幕像素绘制原海报同款上下虚线引注，填满画幅节奏且绝不缩成小字
  if (tr.w < 520 && tr.h >= 330) {
    ctx.save();
    ctx.scale(dpr, dpr);
    const sx = (lx) => tr.ox + lx * tr.scale;
    const sy = (ly) => tr.oy + ly * tr.scale;

    // 顶部右区引注：指向交点
    if (evalRes.crossing) {
      const tx = sx(evalRes.crossing.x);
      const ty = sy(evalRes.crossing.y) - 18;
      ctx.strokeStyle = "#1E1D1B";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(tr.w - 178, 34);
      ctx.lineTo(tx, 34);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrowHead(ctx, tx, ty, 0, 1, 5.5, "#1E1D1B");

      ctx.fillStyle = "#111111";
      ctx.font = "700 12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(evalRes.passedCount === 4 ? "双轨交点不拐弯" : "横拖画布 / 拖红环掰顺", tr.w - 170, 29);
      ctx.fillStyle = "#555049";
      ctx.font = "700 10.5px 'Space Mono', monospace";
      ctx.fillText(`KINK ${Math.round(evalRes.maxKinkDeg)}° · CROSS ${Math.round(evalRes.crossingDeg)}°`, tr.w - 170, 45);
    }

    // 底部左区引注：呼应原海报底左引注
    const sampleDot = evalRes.orangePts[2];
    if (sampleDot) {
      const bx = sx(sampleDot.x);
      const by = sy(sampleDot.y) + 18;
      ctx.strokeStyle = "#1E1D1B";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(14, tr.h - 32);
      ctx.lineTo(bx, tr.h - 32);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrowHead(ctx, bx, by, 0, -1, 5.5, "#1E1D1B");

      ctx.fillStyle = "#111111";
      ctx.font = "700 12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("点按红缺口补链 · 滑动下方滑杆精调", 14, tr.h - 14);
    }
    ctx.restore();
  }
}

// ---- 更新标题自示范 SVG 流线（标题随画布折/顺实时呼吸联动） ----
function syncTitleFlow() {
  const gLine = document.getElementById("title-flow-green");
  const oLine = document.getElementById("title-flow-orange");
  if (!gLine || !oLine) return;

  const isKink = evalRes.maxKinkDeg > THRESHOLDS.maxKinkDeg;
  const isGrazing = !evalRes.hasCrossing || evalRes.crossingDeg < THRESHOLDS.minCrossDeg;

  if (isKink) {
    gLine.setAttribute("d", "M 2 7 C 70 7 110 7 156 14 L 182 3 L 222 21 C 275 21 315 21 378 21");
  } else {
    gLine.setAttribute("d", "M 2 6 C 110 6 155 14 190 14 C 235 14 275 22 378 22");
  }
  if (isGrazing) {
    oLine.setAttribute("d", "M 2 14 C 100 13 155 15 190 15 C 245 16 300 18 378 19");
  } else {
    oLine.setAttribute("d", "M 2 22 C 110 20 155 14 190 14 C 235 14 275 6 378 6");
  }
  gLine.setAttribute("stroke", state.pureInk ? "#111111" : "#006627");
  oLine.setAttribute("stroke", state.pureInk ? "#111111" : "#F65A04");
}

// ---- 更新 DOM 单真源读数、原海报底沿四柱与圆角诊单盒 ----
function syncUI() {
  evalRes = evaluate(state);
  syncTitleFlow();

  // 顶眉状态丸
  const topPill = document.getElementById("top-status-pill");
  if (topPill) {
    topPill.textContent = evalRes.passedCount === 4 ? "4 / 4 连续成立" : `${evalRes.passedCount} / 4 待理顺`;
    topPill.classList.toggle("is-ok", evalRes.passedCount === 4);
  }

  // 场景切签 & 纯墨钮 & 探针钮
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    const on = btn.dataset.scene === state.scene;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  const inkBtn = document.getElementById("btn-pure-ink");
  if (inkBtn) {
    inkBtn.classList.toggle("is-active", state.pureInk);
    inkBtn.setAttribute("aria-pressed", String(state.pureInk));
    inkBtn.textContent = state.pureInk ? "去色纯墨：开" : "去色纯墨验真";
  }

  const probeBtn = document.getElementById("btn-probe");
  if (probeBtn) {
    probeBtn.classList.toggle("is-active", showProbe);
    probeBtn.setAttribute("aria-pressed", String(showProbe));
    probeBtn.textContent = showProbe ? "视线探针：运行中" : "视线探针：已暂停";
  }

  // 同步滑杆与实时单真源读数
  const syncSlider = (id, valId, value, label) => {
    const el = document.getElementById(id);
    const vel = document.getElementById(valId);
    if (el && Number(el.value) !== Math.round(value * 100)) el.value = String(Math.round(value * 100));
    if (vel) vel.textContent = label;
  };
  syncSlider("sl-kink", "val-kink", state.kink, `${Math.round(evalRes.maxKinkDeg)}°`);
  syncSlider("sl-cross", "val-cross", state.crossAngle, evalRes.hasCrossing ? `${Math.round(evalRes.crossingDeg)}°` : "未交");
  syncSlider("sl-gap", "val-gap", state.gap, `${evalRes.gapRatio.toFixed(2)}×`);
  syncSlider("sl-jitter", "val-jitter", state.jitter, `${Math.round(evalRes.maxJitterPx)}px`);

  // 原海报底沿四柱（路径 / 延续 / 方向 / 流动）
  ["path", "continuation", "direction", "flow"].forEach((key) => {
    const el = document.querySelector(`[data-pillar="${key}"]`);
    if (!el) return;
    const p = evalRes.pillars[key];
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-bad", !p.ok);
    el.classList.toggle("is-focus", state.highlightPillar === key);
    el.setAttribute("aria-pressed", String(state.highlightPillar === key));
    const m = el.querySelector(".p-metric");
    const n = el.querySelector(".p-note");
    if (m) m.textContent = p.metric;
    if (n) n.textContent = p.note;
  });

  // 右侧黑框圆角单真源诊单盒
  const diagBox = document.getElementById("diag-box");
  if (diagBox) {
    diagBox.classList.toggle("is-ok", evalRes.passedCount === 4);
  }
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  setText("diag-badge", evalRes.badge);
  setText("diag-headline", evalRes.headline);
  setText("diag-body", evalRes.body);
  setText("diag-next", evalRes.nextStep);
  setText("m-kink", `${Math.round(evalRes.maxKinkDeg)}°`);
  setText("m-cross", evalRes.hasCrossing ? `${Math.round(evalRes.crossingDeg)}°` : "无交");
  setText("m-gap", `${evalRes.gapRatio.toFixed(2)}×`);
  setText("m-flow", evalRes.flowGrade);

  // 高亮匹配预设按钮
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    const match =
      Math.abs(state.kink - p.kink) < 0.04 &&
      Math.abs(state.crossAngle - p.crossAngle) < 0.04 &&
      Math.abs(state.gap - p.gap) < 0.04 &&
      Math.abs(state.jitter - p.jitter) < 0.04 &&
      Math.abs(state.curl - p.curl) < 0.04 &&
      Math.abs(state.splitY - p.splitY) < 0.04 &&
      Math.abs(state.crowd - p.crowd) < 0.04;
    btn.classList.toggle("is-active", match);
    btn.setAttribute("aria-pressed", String(match));
  });
}

// ---- 主舞台指针/触控/键盘交互 ----
let activeDrag = null; // "green" | "orange" | "sweep" | null
let dragStart = null;
let heroCtl = null;

function initHeroStage() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  heroCtl = loop(canvas, (t, dt, opts) => {
    renderHeroCanvas(canvas, ctx, t, dt, opts);
  });

  // 指针按下：就近命中绿手柄 / 橘手柄 / 红缺口 / 抖动标 / 开放画布横向掰折
  canvas.addEventListener("pointerdown", (e) => {
    const pt = toLogical(canvas, e.clientX, e.clientY);
    const dGreen = Math.hypot(pt.x - evalRes.handles.green.x, pt.y - evalRes.handles.green.y);
    const dOrange = Math.hypot(pt.x - evalRes.handles.orange.x, pt.y - evalRes.handles.orange.y);
    const dGap =
      evalRes.gapRatio > THRESHOLDS.maxGapRatio && evalRes.gapMid
        ? Math.hypot(pt.x - evalRes.gapMid.x, pt.y - evalRes.gapMid.y)
        : Infinity;
    const jPt = evalRes.orangePts[3];
    const dJitter =
      evalRes.maxJitterPx > THRESHOLDS.maxJitterPx && jPt
        ? Math.hypot(pt.x - (jPt.x + 28), pt.y - (jPt.y + 44))
        : Infinity;

    // 1. 直接点按红色缺口修补断链
    if (dGap < 56) {
      state.gap = 0;
      syncUI();
      heroCtl.draw();
      return;
    }
    // 2. 直接点按橘轨离轨提示一键归顺
    if (dJitter < 64) {
      state.jitter = 0;
      syncUI();
      heroCtl.draw();
      return;
    }

    canvas.setPointerCapture(e.pointerId);
    dragStart = {
      clientX: e.clientX,
      clientY: e.clientY,
      kink: state.kink,
      crossAngle: state.crossAngle,
      scale: pt.tr.scale,
    };

    if (dGreen < 54 && dGreen <= dOrange) {
      activeDrag = "green";
    } else if (dOrange < 54) {
      activeDrag = "orange";
    } else {
      // 开放画布横拖（同时满足人类直觉与 perf 横拖实测）
      activeDrag = "sweep";
    }
    state.curl = 0;
    state.splitY = 0;
    state.crowd = 0;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!activeDrag || !dragStart) return;
    const dx = (e.clientX - dragStart.clientX) / dragStart.scale;
    const dy = (e.clientY - dragStart.clientY) / dragStart.scale;

    if (activeDrag === "green") {
      // 上下或左右拖动绿轨弯折节点：向中线拉顺（靠近 0 时轻轻吸附）
      const delta = -dy / 100 - dx / 220;
      let next = clamp(dragStart.kink + delta, -0.95, 0.95);
      if (Math.abs(next) < 0.06) next = 0;
      state.kink = next;
    } else if (activeDrag === "orange") {
      // 上下拖动橘轨右侧杆：打开/收窄交点夹角
      const delta = -dy / 160 + dx / 360;
      let next = clamp(dragStart.crossAngle + delta, 0.06, 0.95);
      if (Math.abs(next - 0.58) < 0.03) next = 0.58;
      state.crossAngle = next;
    } else if (activeDrag === "sweep") {
      // 画布自由横拖：平滑连续弯折绿轨并联动微调交角（保证每帧都有真实几何重绘）
      let nextKink = clamp(dragStart.kink - dx / 180, -0.92, 0.92);
      if (Math.abs(nextKink) < 0.045) nextKink = 0;
      state.kink = nextKink;
      if (Math.abs(dy) > 10) {
        state.crossAngle = clamp(dragStart.crossAngle - dy / 190, 0.08, 0.95);
      }
    }

    syncUI();
    heroCtl.draw();
  });

  const endDrag = () => {
    activeDrag = null;
    dragStart = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘无障碍操作（焦点在画布时：← → 掰顺绿轨尖折，↑ ↓ 调交点夹角，Space 启停探针）
  canvas.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
      e.preventDefault();
    }
    const now = performance.now();
    if (now - lastKeyActionAt < 25) return;
    lastKeyActionAt = now;

    if (e.key === "ArrowRight") {
      state.kink = clamp(state.kink - 0.08, -0.95, 0.95);
      if (Math.abs(state.kink) < 0.05) state.kink = 0;
    } else if (e.key === "ArrowLeft") {
      state.kink = clamp(state.kink + 0.08, -0.95, 0.95);
    } else if (e.key === "ArrowUp") {
      state.crossAngle = clamp(state.crossAngle + 0.06, 0.06, 0.95);
    } else if (e.key === "ArrowDown") {
      state.crossAngle = clamp(state.crossAngle - 0.06, 0.06, 0.95);
    } else if (e.key === " ") {
      showProbe = !showProbe;
    } else {
      return;
    }
    state.curl = 0;
    state.splitY = 0;
    state.crowd = 0;
    syncUI();
    heroCtl.draw();
  });

  // 场景切签
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.scene;
      syncUI();
      heroCtl.draw();
    });
  });

  // 去色纯墨验真
  const inkBtn = document.getElementById("btn-pure-ink");
  if (inkBtn) {
    inkBtn.addEventListener("click", () => {
      state.pureInk = !state.pureInk;
      syncUI();
      heroCtl.draw();
    });
  }

  // 探针启停
  const probeBtn = document.getElementById("btn-probe");
  if (probeBtn) {
    probeBtn.addEventListener("click", () => {
      showProbe = !showProbe;
      if (showProbe) probePhase = 0.02;
      syncUI();
      heroCtl.draw();
    });
  }

  // 预设解与试错按钮
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      Object.assign(state, {
        kink: p.kink,
        crossAngle: p.crossAngle,
        gap: p.gap,
        jitter: p.jitter,
        curl: p.curl,
        splitY: p.splitY,
        crowd: p.crowd,
      });
      probePhase = 0.04;
      syncUI();
      heroCtl.draw();
    });
  });

  // 四枚微调滑杆
  const bindSlider = (id, prop, clearSpecial = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      state[prop] = Number(el.value) / 100;
      if (clearSpecial) {
        state.curl = 0;
        state.splitY = 0;
        state.crowd = 0;
      }
      syncUI();
      heroCtl.draw();
    });
  };
  bindSlider("sl-kink", "kink");
  bindSlider("sl-cross", "crossAngle");
  bindSlider("sl-gap", "gap");
  bindSlider("sl-jitter", "jitter");

  // 底部四栏点击点亮画布对应区域
  document.querySelectorAll("[data-pillar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.pillar;
      state.highlightPillar = state.highlightPillar === k ? null : k;
      syncUI();
      heroCtl.draw();
    });
  });

  window.addEventListener("resize", () => heroCtl.draw(), { passive: true });
  syncUI();
  heroCtl.draw();
}

// ---- 初始化全页 ----
initHeroStage();
initSec01Anatomy();
initSec02Occlusion();
initSec03AssociationField();
initSec04Neighbors();
initSec05RealUI();
initSec06WhenNot();
initSec07Practice();
initPosterLightbox();
void reducedMotion;
