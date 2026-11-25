// 025 汇聚线构图 · 开场活体单点透视舞台（2D Canvas 高精度建筑制图渲染）
// 所有实绘坐标严格由 model.js 计算，支持建筑廊道 / 远景公路 / 光影射线三题材与直接拖拽朱红消失点钉针。

import { clamp, evaluate, PALETTE } from "./model.js";
import { loop, pixelRatio } from "../../lib/stage.js";

// 将归一化坐标 (u, v) 映射到画布像素
const pt = (p, w, h) => ({ x: p.u * w, y: p.v * h });

// 在线段 A->B 上取进度 t
const lerpPt = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

// 从中心 o 经 p 延长到距离画布外围足够远
function extendRay(o, p, len = 2600) {
  const dx = p.x - o.x;
  const dy = p.y - o.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: o.x + (dx / d) * len, y: o.y + (dy / d) * len };
}

// 绘制极简无五官远行剪影（遵守规范：绝不画眼耳口鼻）
function drawSilhouette(ctx, x, y, h, color) {
  if (h < 4) return;
  ctx.save();
  ctx.fillStyle = color;
  const headR = h * 0.14;
  // 头
  ctx.beginPath();
  ctx.arc(x, y - h + headR, headR, 0, Math.PI * 2);
  ctx.fill();
  // 躯干与肩线（简洁几何剪影）
  ctx.beginPath();
  ctx.moveTo(x - headR * 1.55, y - h + headR * 2.25);
  ctx.lineTo(x + headR * 1.55, y - h + headR * 2.25);
  ctx.lineTo(x + headR * 1.05, y);
  ctx.lineTo(x - headR * 1.05, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 1. 建筑廊道场景（严格化用 025 原海报构图：普鲁士深蓝左壁 + 暖宣天花/地面 + 右翼玻璃柱列长廊 + 中央朱红通途）
function drawCorridorScene(ctx, w, h, state, m, reveal) {
  // 暖宣建筑制图纸底
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  const vpMain = pt(m.vp, w, h);
  const vpL = pt(m.vps.left, w, h);
  const vpC = pt(m.vps.center, w, h);
  const vpR = pt(m.vps.right, w, h);

  // 透视比例控制廊道开合幅度
  const spread = clamp(m.opt.wallHalfW, 0.15, 0.95);
  const ceilingRise = clamp(0.42 + spread * 0.68, 0.50, 1.08);
  const floorDrop = clamp(0.32 + spread * 0.62, 0.44, 0.98);

  // --- A. 左翼普鲁士深蓝斜壁（呼应原海报左上深海蓝三角墙） ---
  const leftTopEnd = { x: Math.max(0, vpL.x - w * (0.16 + spread * 0.30)), y: 0 };
  const leftBotEnd = { x: 0, y: clamp(vpL.y + h * (0.20 + spread * 0.40), h * 0.28, h * 0.96) };
  const leftWallPoly = [
    { x: 0, y: 0 },
    leftTopEnd,
    lerpPt(leftTopEnd, vpL, reveal),
    vpL,
    lerpPt(leftBotEnd, vpL, reveal),
    leftBotEnd,
  ];
  ctx.save();
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(leftTopEnd.x, 0);
  ctx.lineTo(vpL.x, vpL.y);
  ctx.lineTo(0, leftBotEnd.y);
  ctx.closePath();
  ctx.fill();

  // 左壁隐约结构投影线（原海报深蓝墙面上的细透视线）
  ctx.strokeStyle = "rgba(239, 226, 210, 0.22)";
  ctx.lineWidth = 1;
  for (const frac of [0.22, 0.48, 0.76]) {
    const sy = leftBotEnd.y * frac;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(vpL.x, vpL.y);
    ctx.stroke();
  }
  ctx.restore();

  // --- B. 右翼建筑窗框柱列长廊（复刻 025 原海报右侧玻璃窗柱列） ---
  const rightTopOut = { x: w, y: Math.max(-h * 0.18, vpR.y - h * ceilingRise) };
  const rightTopBeam = { x: w, y: Math.max(0, vpR.y - h * (ceilingRise * 0.84)) };
  const rightMidRail = { x: w, y: vpR.y + h * 0.04 };
  const rightBotOut = { x: w, y: Math.min(h * 1.05, vpR.y + h * floorDrop * 0.62) };

  // 廊道右墙淡浅灰底
  ctx.save();
  ctx.fillStyle = "rgba(4, 31, 64, 0.045)";
  ctx.beginPath();
  ctx.moveTo(vpR.x, vpR.y);
  ctx.lineTo(rightTopOut.x, rightTopOut.y);
  ctx.lineTo(w, rightBotOut.y);
  ctx.closePath();
  ctx.fill();

  // 窗格纵深立柱（1/z 递进 vs 等距假透视）
  const bayCount = m.slices.length;
  for (let i = 0; i < bayCount; i++) {
    const t = m.slices[i]; // 0 = 近端，1 = 远端
    if (t > reveal) continue;
    const pTop = lerpPt(rightTopBeam, vpR, t);
    const pBot = lerpPt(rightBotOut, vpR, t);
    const colW = Math.max(1.2, (1 - t) * (w * 0.022) + 1.1);
    const alpha = clamp(1 - t * 0.35, 0.42, 1);

    // 柱子阴影衬底
    ctx.fillStyle = `rgba(4, 31, 64, ${alpha.toFixed(2)})`;
    ctx.fillRect(pTop.x - colW * 0.5, pTop.y, colW, Math.max(2, pBot.y - pTop.y));

    // 地面延伸横缝（辅助看清近疏远密还是假等距）
    ctx.strokeStyle = state.spacing === "uniform"
      ? "rgba(181, 52, 17, 0.28)"
      : "rgba(4, 31, 64, 0.16)";
    ctx.lineWidth = Math.max(0.8, (1 - t) * 1.4);
    ctx.beginPath();
    ctx.moveTo(pBot.x, pBot.y);
    ctx.lineTo(pBot.x - (1 - t) * w * 0.12, pBot.y + (1 - t) * h * 0.04);
    ctx.stroke();
  }

  // 右廊顶部普鲁士深蓝重横梁（原海报右上标志性粗斜梁）
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(vpR.x, vpR.y);
  ctx.lineTo(rightTopOut.x, rightTopOut.y);
  ctx.lineTo(rightTopBeam.x, rightTopBeam.y);
  ctx.closePath();
  ctx.fill();

  // 右廊底缘横梁与中横档线
  ctx.strokeStyle = PALETTE.navy;
  ctx.lineWidth = Math.max(2.5, w * 0.005);
  ctx.beginPath();
  ctx.moveTo(vpR.x, vpR.y);
  ctx.lineTo(rightBotOut.x, rightBotOut.y);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(4, 31, 64, 0.55)";
  ctx.beginPath();
  ctx.moveTo(vpR.x, vpR.y);
  ctx.lineTo(rightMidRail.x, rightMidRail.y);
  ctx.stroke();
  ctx.restore();

  // --- C. 暖宣纸面上的建筑辅助延伸线（还原原海报细斜射线） ---
  ctx.save();
  ctx.strokeStyle = "rgba(4, 31, 64, 0.45)";
  ctx.lineWidth = 1;
  const groundRays = [
    { o: vpL, to: { x: 0, y: h * 0.78 } },
    { o: vpL, to: { x: w * 0.08, y: h } },
    { o: vpR, to: { x: w, y: h * 0.78 } },
    { o: vpR, to: { x: w * 0.90, y: h } },
  ];
  for (const r of groundRays) {
    const end = lerpPt(r.to, r.o, 1 - reveal);
    ctx.beginPath();
    ctx.moveTo(r.o.x, r.o.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  // 原海报标志性顶部虚线透视延长线
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "rgba(4, 31, 64, 0.48)";
  ctx.beginPath();
  ctx.moveTo(vpL.x, vpL.y);
  ctx.lineTo(vpL.x - w * 0.10, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vpR.x, vpR.y);
  ctx.lineTo(w, vpR.y + h * 0.46);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // --- D. 中央标志性朱红汇聚通途（严格还原 025 原海报核心朱红梯形） ---
  const roadL = pt(m.roadL, w, h);
  const roadR = pt(m.roadR, w, h);
  ctx.save();
  const grad = ctx.createLinearGradient(vpC.x, vpC.y, (roadL.x + roadR.x) * 0.5, h);
  grad.addColorStop(0, "#F06435");
  grad.addColorStop(0.55, PALETTE.vermilion);
  grad.addColorStop(1, "#DC4B23");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(vpC.x, vpC.y);
  ctx.lineTo(roadL.x, roadL.y);
  ctx.lineTo(roadR.x, roadR.y);
  ctx.closePath();
  ctx.fill();

  // 路面内部横标条纹（直观展示 1/z 递进 vs 平面等距）
  for (let i = 0; i < bayCount; i++) {
    const t = m.slices[i];
    if (t < 0.04 || t > 0.94) continue;
    const pL = lerpPt(roadL, vpC, t);
    const pR = lerpPt(roadR, vpC, t);
    ctx.strokeStyle = state.spacing === "uniform"
      ? "rgba(255, 245, 232, 0.58)"
      : "rgba(255, 240, 224, 0.34)";
    ctx.lineWidth = Math.max(1, (1 - t) * 2.2);
    ctx.beginPath();
    ctx.moveTo(pL.x, pL.y);
    ctx.lineTo(pR.x, pR.y);
    ctx.stroke();
  }
  ctx.restore();

  // --- E. 焦点主体（光门 + 极简剪影） ---
  if (m.targetPos) {
    const tp = pt(m.targetPos, w, h);
    const doorH = clamp(h * 0.145, 36, 76);
    const doorW = doorH * 0.62;
    ctx.save();
    // 深蓝外框 + 暖亮朱红门洞
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(tp.x - doorW * 0.64, tp.y - doorH * 0.72, doorW * 1.28, doorH * 0.94);
    ctx.fillStyle = state.target === "locked" && m.passCount === 4 ? "#FF8A5C" : PALETTE.paper;
    ctx.fillRect(tp.x - doorW * 0.44, tp.y - doorH * 0.58, doorW * 0.88, doorH * 0.80);
    // 门内微缩剪影（无五官）
    drawSilhouette(ctx, tp.x, tp.y + doorH * 0.22, doorH * 0.52, PALETTE.navy);
    // 偏位警示圈
    if (state.target === "offset") {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = PALETTE.vermilionInk;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(tp.x - doorW * 0.85, tp.y - doorH * 0.88, doorW * 1.7, doorH * 1.25);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

// 2. 远景公路场景（复刻 025 原海报应用示例①：道路 / 远景引导）
function drawRoadScene(ctx, w, h, state, m, reveal) {
  const vpMain = pt(m.vp, w, h);
  const vpL = pt(m.vps.left, w, h);
  const vpC = pt(m.vps.center, w, h);
  const vpR = pt(m.vps.right, w, h);
  const horizonY = vpMain.y;

  // 天空暖宣纸带
  ctx.fillStyle = "#EAE0D3";
  ctx.fillRect(0, 0, w, horizonY);

  // 远山剪影（呼应原海报道路示例的冷灰蓝山脊）
  ctx.save();
  ctx.fillStyle = "#8A95A3";
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  const peaks = [0.0, 0.14, 0.27, 0.42, 0.58, 0.74, 0.88, 1.0];
  const heights = [0.05, 0.11, 0.06, 0.13, 0.04, 0.12, 0.09, 0.06];
  for (let i = 0; i < peaks.length; i++) {
    ctx.lineTo(peaks[i] * w, horizonY - heights[i] * h * 0.85);
  }
  ctx.lineTo(w, horizonY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 地平线以下深海蓝大地
  ctx.fillStyle = PALETTE.navy;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  // 两侧路肩辅线（受左/右束汇点控制，离散时会撕裂歪斜）
  const spread = clamp(m.opt.wallHalfW, 0.16, 0.96);
  const shL = { x: vpL.x - w * spread * 0.92, y: h };
  const shR = { x: vpR.x + w * spread * 0.92, y: h };
  ctx.save();
  ctx.strokeStyle = "rgba(239, 226, 210, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(vpL.x, vpL.y);
  ctx.lineTo(shL.x, shL.y);
  ctx.moveTo(vpR.x, vpR.y);
  ctx.lineTo(shR.x, shR.y);
  ctx.stroke();

  // 两侧里程灯柱（按 1/z 递进或等距）
  for (let i = 0; i < m.slices.length; i++) {
    const t = m.slices[i];
    if (t > reveal || t > 0.95) continue;
    const pL = lerpPt(shL, vpL, t);
    const pR = lerpPt(shR, vpR, t);
    const postH = Math.max(4, (1 - t) * h * 0.18);
    const pw = Math.max(1.2, (1 - t) * 4.2);
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(pL.x - pw * 0.5, pL.y - postH, pw, postH);
    ctx.fillRect(pR.x - pw * 0.5, pR.y - postH, pw, postH);
  }
  ctx.restore();

  // 中央公路双车道（复刻原海报白道+朱红车道带）
  const roadL = pt(m.roadL, w, h);
  const roadR = pt(m.roadR, w, h);
  ctx.save();
  ctx.fillStyle = "#0E2D55";
  ctx.beginPath();
  ctx.moveTo(vpC.x, vpC.y);
  ctx.lineTo(roadL.x, roadL.y);
  ctx.lineTo(roadR.x, roadR.y);
  ctx.closePath();
  ctx.fill();

  // 两条醒目白色边道线
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = Math.max(2.5, w * 0.0055);
  ctx.beginPath();
  ctx.moveTo(vpC.x, vpC.y);
  ctx.lineTo(roadL.x, roadL.y);
  ctx.moveTo(vpC.x, vpC.y);
  ctx.lineTo(roadR.x, roadR.y);
  ctx.stroke();

  // 中央朱红虚线标段（清晰反映 1/z 透视压缩 vs 等距假透视）
  const roadMid = { x: (roadL.x + roadR.x) * 0.5, y: h };
  for (let i = 0; i < m.slices.length - 1; i++) {
    const t0 = m.slices[i];
    const t1 = m.slices[i + 1];
    if (t0 > reveal) continue;
    const segStart = lerpPt(roadMid, vpC, t0);
    const segEnd = lerpPt(roadMid, vpC, t0 + (t1 - t0) * 0.58);
    ctx.strokeStyle = PALETTE.vermilion;
    ctx.lineWidth = Math.max(1.8, (1 - t0) * 10);
    ctx.beginPath();
    ctx.moveTo(segStart.x, segStart.y);
    ctx.lineTo(segEnd.x, segEnd.y);
    ctx.stroke();
  }
  ctx.restore();

  // 焦点主体：原海报同款朱红落日
  if (m.targetPos) {
    const tp = pt(m.targetPos, w, h);
    const sunR = clamp(Math.min(w, h) * 0.072, 18, 36);
    ctx.save();
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y - sunR * 0.65, sunR, 0, Math.PI * 2);
    ctx.fill();
    if (state.target === "offset") {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y - sunR * 0.65, sunR + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

// 3. 光影射线场景（复刻 025 原海报应用示例③：光影 / 视觉聚焦）
function drawLightScene(ctx, w, h, state, m, reveal) {
  // 深海蓝暗夜场域
  ctx.fillStyle = PALETTE.navy;
  ctx.fillRect(0, 0, w, h);

  const vpL = pt(m.vps.left, w, h);
  const vpC = pt(m.vps.center, w, h);
  const vpR = pt(m.vps.right, w, h);

  const roadL = pt(m.roadL, w, h);
  const roadR = pt(m.roadR, w, h);
  const spanW = Math.abs(roadR.x - roadL.x);

  // 六道倾斜暖白光柱从上/中汇聚射出，按左/中/右三束归属不同汇点
  const beamDefs = [
    { o: vpL, bx: roadL.x - spanW * 0.55, wFrac: 0.11, alpha: 0.78 },
    { o: vpL, bx: roadL.x - spanW * 0.18, wFrac: 0.14, alpha: 0.90 },
    { o: vpC, bx: roadL.x + spanW * 0.18, wFrac: 0.18, alpha: 0.96 },
    { o: vpC, bx: roadL.x + spanW * 0.52, wFrac: 0.16, alpha: 0.94 },
    { o: vpR, bx: roadR.x - spanW * 0.14, wFrac: 0.13, alpha: 0.88 },
    { o: vpR, bx: roadR.x + spanW * 0.34, wFrac: 0.10, alpha: 0.72 },
  ];

  ctx.save();
  for (const b of beamDefs) {
    const bw = Math.max(14, spanW * b.wFrac);
    const leftEnd = extendRay(b.o, { x: b.bx - bw * 0.5, y: h }, Math.max(w, h) * 1.3);
    const rightEnd = extendRay(b.o, { x: b.bx + bw * 0.5, y: h }, Math.max(w, h) * 1.3);
    ctx.fillStyle = `rgba(239, 226, 210, ${(b.alpha * reveal).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(b.o.x, b.o.y);
    ctx.lineTo(leftEnd.x, leftEnd.y);
    ctx.lineTo(rightEnd.x, rightEnd.y);
    ctx.closePath();
    ctx.fill();
  }

  // 光束上的空间纵深等深弧环（清晰呈现 1/z 递进 vs 等距）
  for (let i = 0; i < m.slices.length; i++) {
    const t = m.slices[i];
    if (t < 0.05 || t > 0.92) continue;
    const rad = (1 - t) * Math.min(w, h) * 0.82;
    ctx.strokeStyle = state.spacing === "uniform"
      ? "rgba(255, 126, 87, 0.38)"
      : "rgba(4, 31, 64, 0.22)";
    ctx.lineWidth = Math.max(1, (1 - t) * 2.2);
    ctx.beginPath();
    ctx.arc(vpC.x, vpC.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 焦点主体：聚光朱红圆核
  if (m.targetPos) {
    const tp = pt(m.targetPos, w, h);
    const orbR = clamp(Math.min(w, h) * 0.068, 16, 32);
    ctx.save();
    ctx.fillStyle = "rgba(234, 88, 47, 0.24)";
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, orbR * 1.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, orbR, 0, Math.PI * 2);
    ctx.fill();
    if (state.target === "offset") {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, orbR + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

// 顶层透视校验叠加层（散开三束虚线交点 + 可拖拽朱红消失点圆钉 + 实时角标）
function drawOverlay(ctx, w, h, state, m, pulse) {
  const vpMain = pt(m.vp, w, h);
  const vpL = pt(m.vps.left, w, h);
  const vpC = pt(m.vps.center, w, h);
  const vpR = pt(m.vps.right, w, h);
  const darkBg = state.scene === "light";

  // 1. 若三束汇点尚未收拢，画出三个离散假汇点与冲突红虚线三角，让错态一目了然
  if (!m.converged) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = darkBg ? PALETTE.vermilionBright : PALETTE.vermilionInk;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(vpL.x, vpL.y);
    ctx.lineTo(vpC.x, vpC.y);
    ctx.lineTo(vpR.x, vpR.y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    const tags = [
      { p: vpL, txt: "左束" },
      { p: vpC, txt: "主束" },
      { p: vpR, txt: "右束" },
    ];
    for (const item of tags) {
      ctx.fillStyle = PALETTE.navy;
      ctx.beginPath();
      ctx.arc(item.p.x, item.p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.vermilion;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. 视平线细虚线（标示眼睛高度）
  if (state.showGuides) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = darkBg ? "rgba(242, 230, 216, 0.35)" : "rgba(4, 31, 64, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, vpMain.y);
    ctx.lineTo(w, vpMain.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 标尺底端夹角弧线示意
    const arcR = clamp(Math.min(w, h) * 0.13, 30, 56);
    const roadL = pt(m.roadL, w, h);
    const roadR = pt(m.roadR, w, h);
    const aL = Math.atan2(roadL.y - vpC.y, roadL.x - vpC.x);
    const aR = Math.atan2(roadR.y - vpC.y, roadR.x - vpC.x);
    ctx.strokeStyle = m.angleOk
      ? darkBg
        ? "rgba(92, 224, 200, 0.85)"
        : "rgba(15, 107, 92, 0.78)"
      : darkBg
      ? PALETTE.vermilionBright
      : PALETTE.vermilionInk;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(vpC.x, vpC.y, arcR, Math.min(aL, aR), Math.max(aL, aR));
    ctx.stroke();
    ctx.restore();
  }

  // 3. 朱红消失点圆钉（原海报标志性焦点红圆 + 呼吸脉冲环）
  const lockedAll = m.passCount === 4;
  const pinR = clamp(Math.min(w, h) * 0.025, 8.5, 12.5);
  ctx.save();
  // 外围手势热区环
  ctx.strokeStyle = lockedAll
    ? darkBg
      ? "rgba(92, 224, 200, 0.85)"
      : "rgba(15, 107, 92, 0.82)"
    : darkBg
    ? "rgba(255, 126, 87, 0.85)"
    : "rgba(181, 52, 17, 0.75)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(vpMain.x, vpMain.y, pinR + 6 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();

  // 白色描边让红钉在深蓝和朱红底上都清晰锐利
  ctx.fillStyle = PALETTE.vellum;
  ctx.beginPath();
  ctx.arc(vpMain.x, vpMain.y, pinR + 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = lockedAll ? PALETTE.okLight : PALETTE.vermilion;
  ctx.beginPath();
  ctx.arc(vpMain.x, vpMain.y, pinR, 0, Math.PI * 2);
  ctx.fill();

  // 中心定位小孔（致敬达·芬奇《最后的晚餐》壁面钉孔）
  ctx.fillStyle = PALETTE.vellum;
  ctx.beginPath();
  ctx.arc(vpMain.x, vpMain.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. 画布四枚建筑标尺角标 + 原海报引出标注标签（宽屏空间充裕时显示，避免窄屏挡画面）
  ctx.save();
  ctx.strokeStyle = darkBg ? "rgba(242, 230, 216, 0.45)" : "rgba(4, 31, 64, 0.45)";
  ctx.lineWidth = 1.2;
  const cLen = 12;
  const pad = 10;
  const corners = [
    [pad, pad, 1, 1],
    [w - pad, pad, -1, 1],
    [pad, h - pad, 1, -1],
    [w - pad, h - pad, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * cLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * cLen);
    ctx.stroke();
  }

  // 右上消失点坐标徽标（清晰可读高对比）
  const tagText = `VP ${Math.round(m.vp.u * 100)}% · ${Math.round(m.vp.v * 100)}%   ${m.apexAngleDeg}°`;
  ctx.font = `500 ${w < 460 ? 11 : 12}px "DM Mono", monospace`;
  const tw = ctx.measureText(tagText).width + 18;
  const th = 24;
  const tx = w - tw - 14;
  const ty = 14;
  ctx.fillStyle = "rgba(4, 31, 64, 0.88)";
  ctx.fillRect(tx, ty, tw, th);
  ctx.strokeStyle = lockedAll ? PALETTE.okDark : PALETTE.vermilion;
  ctx.lineWidth = 1;
  ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
  ctx.fillStyle = PALETTE.cream;
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, tx + 9, ty + th / 2 + 0.5);

  // 左下简洁操作提示牌
  const hintText = w < 460 ? "拖红钉移消失点" : "拖动朱红钉针改消失点 · 方向键可微调";
  ctx.font = `500 ${w < 460 ? 11 : 12}px "Noto Sans SC", sans-serif`;
  const hw = ctx.measureText(hintText).width + 16;
  const hx = 14;
  const hy = h - 36;
  ctx.fillStyle = "rgba(4, 31, 64, 0.84)";
  ctx.fillRect(hx, hy, hw, 24);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(hintText, hx + 8, hy + 12.5);
  ctx.restore();
}

export function mountHeroStage(canvas, getState, onStateChange, onResize) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let dirty = true;
  let revealT = 0; // 开场 0.9s 顺畅线条生长动画（每一刻都饱满好看）
  let draggingVp = false;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(rect.width));
    const nh = Math.max(220, Math.round(rect.height));
    const ndpr = pixelRatio(2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
      onResize?.();
    }
  };

  const render = (t, dt, { still }) => {
    resize();
    const state = getState();
    if (still) {
      revealT = 1;
    } else if (revealT < 1) {
      revealT = Math.min(1, revealT + Math.max(dt, 0.016) * 1.45);
      dirty = true;
    }

    // 静置且开场动画已完时，避免无谓重画以省电并提升慢机帧率
    if (!dirty && revealT >= 1 && !draggingVp) return;
    dirty = false;

    const aspect = w / Math.max(1, h);
    const m = evaluate(state, aspect);
    const easeReveal = 1 - Math.pow(1 - revealT, 3);
    const pulse = still ? 0 : (Math.sin(t * 2.6) + 1) * 0.5;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state.scene === "corridor") {
      drawCorridorScene(ctx, w, h, state, m, easeReveal);
    } else if (state.scene === "road") {
      drawRoadScene(ctx, w, h, state, m, easeReveal);
    } else {
      drawLightScene(ctx, w, h, state, m, easeReveal);
    }
    drawOverlay(ctx, w, h, state, m, pulse);
    ctx.restore();
  };

  const ctrl = loop(canvas, render);

  // 画布内直拖/点击定位朱红消失点钉针（仅拖钉针或横向移动时阻止默认滚动，保护手机竖向顺滑滚屏）
  const setVpFromClient = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    let u = clamp((clientX - rect.left) / Math.max(1, rect.width), 0.06, 0.94);
    let v = clamp((clientY - rect.top) / Math.max(1, rect.height), 0.08, 0.90);
    // 靠近正中对称点（0.50, 0.45）或原海报经典偏心点（0.58, 0.36）轻轻吸附
    if (Math.hypot(u - 0.5, v - 0.45) < 0.025) {
      u = 0.5;
      v = 0.45;
    } else if (Math.hypot(u - 0.58, v - 0.36) < 0.022) {
      u = 0.58;
      v = 0.36;
    }
    dirty = true;
    onStateChange({ vp: { u: +u.toFixed(3), v: +v.toFixed(3) } });
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const cur = getState().vp;
    const px = cur.u * rect.width;
    const py = cur.v * rect.height;
    const dx = e.clientX - rect.left - px;
    const dy = e.clientY - rect.top - py;
    // 触屏下仅点按红钉附近（56px）或轻点即定位，避免拦住用户竖向滚屏
    if (e.pointerType === "touch" && Math.hypot(dx, dy) > 56) {
      setVpFromClient(e.clientX, e.clientY);
      return;
    }
    draggingVp = true;
    canvas.setPointerCapture?.(e.pointerId);
    setVpFromClient(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!draggingVp) return;
    setVpFromClient(e.clientX, e.clientY);
  });

  const endDrag = (e) => {
    if (!draggingVp) return;
    draggingVp = false;
    if (e?.pointerId != null) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    dirty = true;
    ctrl.draw();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘操作：选中画布后方向键微调消失点
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.06 : 0.025;
    const { vp } = getState();
    let nu = vp.u;
    let nv = vp.v;
    if (e.key === "ArrowLeft") nu -= step;
    else if (e.key === "ArrowRight") nu += step;
    else if (e.key === "ArrowUp") nv -= step;
    else if (e.key === "ArrowDown") nv += step;
    else return;
    e.preventDefault();
    dirty = true;
    onStateChange({ vp: { u: +clamp(nu, 0.06, 0.94).toFixed(3), v: +clamp(nv, 0.08, 0.90).toFixed(3) } });
  });

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
    getAspect() {
      if (w && h) return w / h;
      const r = canvas.getBoundingClientRect();
      return r.width > 10 && r.height > 10 ? r.width / r.height : 1.8;
    },
  };
}
