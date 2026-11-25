// 081 强制透视构图 · 主舞台（纯 2D 针孔真三维透视渲染器）+ 顶视真距离建筑蓝图剖面轨
// 1:1 承袭 081 原海报暖米纸面、深孔雀松青六窗巨墙、左侧矮栏杆、透视地砖、朱红无五官剪影人、青灰斜影与右下动态比例图例。

import { PERSON_H, clamp, computeMetrics, corridorSection } from "./model.js";

export const PALETTE = {
  paper: "#FAEED4",
  paperLight: "#FDF7EA",
  paperMid: "#F3E4C6",
  ink: "#0F1B1B",
  inkSoft: "#3B4D4B",
  tealWall: "#125251",
  tealWallMid: "#175555",
  tealBadge: "#1D5F64",
  tealDark: "#0B2E2E",
  windowReveal: "#D0C0A1",
  red: "#E1481E",
  redStrong: "#D93911",
  redDeep: "#A82908",
  shadow: "#5D7166",
  grid: "#C6B89D",
  gridSubtle: "rgba(15, 27, 27, 0.20)",
  ok: "#12614A",
};

// 绘制原海报同款无五官几何剪影人（严禁画五官：纯圆头 + 浑厚圆角肩躯干 + 双腿）
export function drawSilhouettePerson(ctx, cx, botY, heightPx, color, alpha = 1) {
  if (heightPx < 3) return;
  const h = heightPx;
  const headR = h * 0.088;
  const headCy = botY - h + headR;
  const shoulderY = headCy + headR * 1.24;
  const shoulderW = h * 0.275;
  const waistY = botY - h * 0.44;
  const hipW = h * 0.20;
  const legW = h * 0.072;
  const legGap = h * 0.022;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  // 圆头（无五官）
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();

  // 肩躯干 + 垂臂一体剪影
  ctx.beginPath();
  const rShoulder = Math.min(shoulderW * 0.34, h * 0.085);
  ctx.moveTo(cx - shoulderW / 2, shoulderY + rShoulder);
  ctx.quadraticCurveTo(cx - shoulderW / 2, shoulderY, cx - shoulderW / 2 + rShoulder, shoulderY);
  ctx.lineTo(cx + shoulderW / 2 - rShoulder, shoulderY);
  ctx.quadraticCurveTo(cx + shoulderW / 2, shoulderY, cx + shoulderW / 2, shoulderY + rShoulder);
  ctx.lineTo(cx + shoulderW * 0.47, waistY);
  ctx.quadraticCurveTo(cx + shoulderW * 0.45, waistY + h * 0.06, cx + hipW * 0.5, waistY + h * 0.06);
  ctx.lineTo(cx + legGap / 2 + legW, botY);
  ctx.lineTo(cx + legGap / 2 + legW * 0.12, botY);
  ctx.lineTo(cx + legGap / 2, waistY + h * 0.04);
  ctx.lineTo(cx - legGap / 2, waistY + h * 0.04);
  ctx.lineTo(cx - legGap / 2 - legW * 0.12, botY);
  ctx.lineTo(cx - legGap / 2 - legW, botY);
  ctx.lineTo(cx - hipW * 0.5, waistY + h * 0.06);
  ctx.quadraticCurveTo(cx - shoulderW * 0.45, waistY + h * 0.06, cx - shoulderW * 0.47, waistY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 绘制前景剪影手掌（借位题材专用：极简构成主义无指纹手掌托举剪影）
function drawSilhouetteHand(ctx, cx, botY, topY, w, color) {
  const h = Math.max(12, botY - topY);
  ctx.save();
  ctx.fillStyle = color;
  // 托举平掌 + 前臂切出画底
  const palmY = topY + h * 0.12;
  const wristY = botY;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.56, palmY + h * 0.14);
  ctx.quadraticCurveTo(cx - w * 0.54, topY, cx - w * 0.34, topY);
  ctx.lineTo(cx + w * 0.38, topY);
  ctx.quadraticCurveTo(cx + w * 0.56, topY, cx + w * 0.56, palmY + h * 0.12);
  ctx.lineTo(cx + w * 0.46, palmY + h * 0.44);
  ctx.quadraticCurveTo(cx + w * 0.34, palmY + h * 0.58, cx + w * 0.28, wristY + 80);
  ctx.lineTo(cx - w * 0.32, wristY + 80);
  ctx.quadraticCurveTo(cx - w * 0.36, palmY + h * 0.56, cx - w * 0.52, palmY + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // 轻微拇指侧影增加辨识度
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.52, topY + h * 0.24, w * 0.16, h * 0.13, -0.45, 0, Math.PI * 2);
  ctx.fill();

  // 掌心承托微线
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.28, topY + 2);
  ctx.lineTo(cx + w * 0.28, topY + 2);
  ctx.stroke();
  ctx.restore();
}

// 渲染主舞台（支持三题材、intro 进场进度 0..1、四枚圆徽高亮层、拖拽反馈）
export function renderMainStage(ctx, W, H, state, metrics, intro = 1, hoverPart = null) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 暖米纸面底色（与页面无框相融）
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);

  if (state.scene === "align") {
    renderAlignScene(ctx, W, H, state, metrics, intro);
  } else if (state.scene === "spada") {
    renderSpadaScene(ctx, W, H, state, metrics, intro);
  } else {
    renderCorridorScene(ctx, W, H, state, metrics, intro, hoverPart);
  }

  // 右下角或底右活体标尺/状态卡（在原海报透视长廊里 1:1 复刻原海报右下「近处 : 约 1/N 远处」动态比例图例！）
  if (state.scene === "corridor") {
    drawPosterScaleLegend(ctx, W, H, metrics);
  } else if (state.scene === "spada") {
    drawSpadaLegend(ctx, W, H, metrics);
  } else {
    drawAlignLegend(ctx, W, H, state, metrics);
  }

  // 画布顶部轻型诊断浮标（仅在有错态时用原海报朱红提醒，成立时用松青轻签）
  drawTopCanvasPill(ctx, W, H, metrics);

  ctx.restore();
}

function renderCorridorScene(ctx, W, H, state, metrics, intro, hoverPart) {
  const { project, vpX, vpY } = metrics.proj;
  const layer = state.activeLayer || "all";
  const ease = 1 - Math.pow(1 - clamp(intro, 0, 1), 3);

  // 1. 地平线细虚线（横贯消失点，1:1 承袭 081 原海报）
  ctx.save();
  ctx.strokeStyle = layer === "vp" ? PALETTE.redStrong : "rgba(15, 27, 27, 0.26)";
  ctx.lineWidth = layer === "vp" ? 1.5 : 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(0, vpY);
  ctx.lineTo(W * ease, vpY);
  ctx.stroke();
  ctx.restore();

  // 2. 地面透视方格地砖（真 3D 投影，从 Z=1.1m 延伸到 Z=64m）
  const zMin = 1.05;
  const zMax = 64.0;
  const secNear = corridorSection(state, zMin);
  const secFar = corridorSection(state, zMax);

  // 地面微暖纸底区分天空
  const flNL = project(secNear.leftX, secNear.floorY, zMin);
  const flNR = project(secNear.rightX + 3.2, secNear.floorY, zMin);
  const flFL = project(secFar.leftX, secFar.floorY, zMax);
  const flFR = project(secFar.rightX + 0.6, secFar.floorY, zMax);
  ctx.save();
  ctx.fillStyle = "rgba(235, 218, 184, 0.36)";
  ctx.beginPath();
  ctx.moveTo(flNL.x, flNL.y);
  ctx.lineTo(flFL.x, flFL.y);
  ctx.lineTo(flFR.x, flFR.y);
  ctx.lineTo(flNR.x, flNR.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 透视纵向汇聚线（地板 6 格）
  ctx.save();
  ctx.strokeStyle = layer === "depth" ? PALETTE.tealBadge : "rgba(15, 27, 27, 0.28)";
  ctx.lineWidth = layer === "depth" ? 1.45 : 0.95;
  const cols = 6;
  for (let i = 0; i <= cols; i++) {
    const frac = i / cols;
    const xN = secNear.leftX + (secNear.rightX - secNear.leftX) * frac;
    const xF = secFar.leftX + (secFar.rightX - secFar.leftX) * frac;
    const p1 = project(xN, secNear.floorY, zMin);
    const p2 = project(xF, secFar.floorY, zMax);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x + (p2.x - p1.x) * ease, p1.y + (p2.y - p1.y) * ease);
    ctx.stroke();
  }
  // 透视横向地砖线（等距间隔 1.8m，近宽远密自然呈几何级数加密！）
  for (let z = 1.4; z <= 58; z += 1.8) {
    const s = corridorSection(state, z);
    const pL = project(s.leftX, s.floorY, z);
    const pR = project(s.rightX, s.floorY, z);
    if (pL.y > H + 120 || pL.y < vpY + 1.2) continue;
    ctx.beginPath();
    ctx.moveTo(pL.x, pL.y);
    ctx.lineTo(pR.x, pR.y);
    ctx.stroke();
  }
  ctx.restore();

  // 3. 左侧深孔雀松青矮栏杆（1:1 承袭 081 原海报：带厚度顶部扶手 + 立柱）
  const railNearZ = 1.6;
  const railFarZ = 48.0;
  const railH = 1.05;
  const rTopN = project(corridorSection(state, railNearZ).leftX, corridorSection(state, railNearZ).floorY + railH, railNearZ);
  const rTopF = project(corridorSection(state, railFarZ).leftX, corridorSection(state, railFarZ).floorY + railH, railFarZ);
  const rBotN = project(corridorSection(state, railNearZ).leftX, corridorSection(state, railNearZ).floorY + railH - 0.14, railNearZ);
  const rBotF = project(corridorSection(state, railFarZ).leftX, corridorSection(state, railFarZ).floorY + railH - 0.14, railFarZ);
  const rBaseN = project(corridorSection(state, railNearZ).leftX, corridorSection(state, railNearZ).floorY, railNearZ);
  const rBaseF = project(corridorSection(state, railFarZ).leftX, corridorSection(state, railFarZ).floorY, railFarZ);

  ctx.save();
  // 栏杆阴影斜投到左侧地面
  ctx.fillStyle = "rgba(93, 113, 102, 0.25)";
  ctx.beginPath();
  ctx.moveTo(rBaseN.x, rBaseN.y);
  ctx.lineTo(rBaseF.x, rBaseF.y);
  ctx.lineTo(rBaseF.x - 10, rBaseF.y + 4);
  ctx.lineTo(rBaseN.x - 44, rBaseN.y + 22);
  ctx.closePath();
  ctx.fill();

  // 栏杆底踢脚细梁
  ctx.strokeStyle = "#485E58";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(rBaseN.x, rBaseN.y);
  ctx.lineTo(rBaseF.x, rBaseF.y);
  ctx.stroke();

  // 栏杆立柱（从远到近画）
  const postZs = [38, 30, 23, 17, 12.5, 9.0, 6.4, 4.4, 2.9, 1.9];
  for (const pz of postZs) {
    const s = corridorSection(state, pz);
    const pt = project(s.leftX, s.floorY + railH - 0.08, pz);
    const pb = project(s.leftX, s.floorY, pz);
    if (pb.x < -80 || pt.y < vpY - 20) continue;
    const lw = clamp(12 / pz, 1.0, 6.5);
    ctx.strokeStyle = PALETTE.tealWall;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  // 栏杆主扶手（厚实深青斜梁）
  ctx.fillStyle = PALETTE.tealWall;
  ctx.beginPath();
  ctx.moveTo(rTopN.x, rTopN.y);
  ctx.lineTo(rTopF.x, rTopF.y);
  ctx.lineTo(rBotF.x, rBotF.y);
  ctx.lineTo(rBotN.x, rBotN.y);
  ctx.closePath();
  ctx.fill();

  // 扶手顶面暖砂亮边
  ctx.strokeStyle = PALETTE.windowReveal;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rTopN.x, rTopN.y);
  ctx.lineTo(rTopF.x, rTopF.y);
  ctx.stroke();
  ctx.restore();

  // 4. 右侧深孔雀松青巨墙 + 6 扇暖沙米厚壁高窗（081 原海报灵魂视觉！）
  const wNearZ = 1.05;
  const wFarZ = 54.0;
  const sWN = corridorSection(state, wNearZ);
  const sWF = corridorSection(state, wFarZ);
  const wtN = project(sWN.rightX, sWN.ceilY, wNearZ);
  const wtF = project(sWF.rightX, sWF.ceilY, wFarZ);
  const wbN = project(sWN.rightX, sWN.floorY, wNearZ);
  const wbF = project(sWF.rightX, sWF.floorY, wFarZ);

  ctx.save();
  // 主墙实色（向右侧延伸填满画框右边缘，构成极具建筑压迫力的单侧深青墙体）
  ctx.fillStyle = PALETTE.tealWall;
  ctx.beginPath();
  ctx.moveTo(wtF.x, wtF.y);
  ctx.lineTo(Math.max(W + 40, wtN.x), wtN.y - (wtN.x < W + 40 ? ((W + 40 - wtN.x) * (wtF.y - wtN.y)) / Math.max(1, wtF.x - wtN.x) : 0));
  ctx.lineTo(Math.max(W + 40, wbN.x), Math.max(H + 40, wbN.y));
  ctx.lineTo(wbN.x, wbN.y);
  ctx.lineTo(wbF.x, wbF.y);
  ctx.closePath();
  ctx.fill();

  // 墙体上沿透视延长虚线（1:1 复刻原海报右上拉向消失点的黑色虚线！）
  ctx.strokeStyle = layer === "vp" || layer === "tension" ? PALETTE.redStrong : PALETTE.ink;
  ctx.lineWidth = layer === "vp" || layer === "tension" ? 1.8 : 1.15;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(vpX, vpY);
  const dxTop = wtN.x - vpX;
  const dyTop = wtN.y - vpY;
  ctx.lineTo(vpX + dxTop * 3.2 * ease, vpY + dyTop * 3.2 * ease);
  ctx.stroke();

  // 左上方对称微弱透视辅助线（1:1 复刻原海报标题下方斜向消失点的细虚线）
  ctx.strokeStyle = layer === "vp" ? PALETTE.redStrong : "rgba(15, 27, 27, 0.28)";
  ctx.lineWidth = layer === "vp" ? 1.5 : 0.9;
  ctx.beginPath();
  ctx.moveTo(vpX, vpY);
  ctx.lineTo(vpX - W * 0.44 * ease, vpY - H * 0.42 * ease);
  ctx.stroke();
  ctx.setLineDash([]);

  // 6 扇由远及近透视放大的厚壁暖米窗洞
  const windows = [
    [2.1, 3.8],
    [4.7, 6.7],
    [7.8, 10.2],
    [11.6, 14.5],
    [16.2, 19.6],
    [21.8, 26.2],
    [29.0, 34.5],
  ];
  for (const [z1, z2] of windows) {
    const s1 = corridorSection(state, z1);
    const s2 = corridorSection(state, z2);
    const winBot1 = s1.floorY + 0.82;
    const winTop1 = s1.ceilY - 0.62;
    const winBot2 = s2.floorY + 0.82;
    const winTop2 = s2.ceilY - 0.62;
    const p1t = project(s1.rightX, winTop1, z1);
    const p1b = project(s1.rightX, winBot1, z1);
    const p2t = project(s2.rightX, winTop2, z2);
    const p2b = project(s2.rightX, winBot2, z2);
    if (p2t.x > W + 120 || p1t.x < vpX - 20) continue;

    // 窗洞主体（暖米透光面）
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.moveTo(p1t.x, p1t.y);
    ctx.lineTo(p2t.x, p2t.y);
    ctx.lineTo(p2b.x, p2b.y);
    ctx.lineTo(p1b.x, p1b.y);
    ctx.closePath();
    ctx.fill();

    // 厚墙内壁（窗台与远侧内壁，采用实采自原海报的暖沙色 #D0C0A1，瞬间立起建筑厚度！）
    const wallThick = 0.42;
    const p2tIn = project(s2.rightX + wallThick, winTop2, z2);
    const p2bIn = project(s2.rightX + wallThick, winBot2, z2);
    const p1bIn = project(s1.rightX + wallThick, winBot1, z1);

    ctx.fillStyle = PALETTE.windowReveal;
    // 远侧窗框立面
    ctx.beginPath();
    ctx.moveTo(p2t.x, p2t.y);
    ctx.lineTo(p2tIn.x, p2tIn.y);
    ctx.lineTo(p2bIn.x, p2bIn.y);
    ctx.lineTo(p2b.x, p2b.y);
    ctx.closePath();
    ctx.fill();
    // 窗台底面
    ctx.fillStyle = "#DFD1B4";
    ctx.beginPath();
    ctx.moveTo(p1b.x, p1b.y);
    ctx.lineTo(p2b.x, p2b.y);
    ctx.lineTo(p2bIn.x, p2bIn.y);
    ctx.lineTo(p1bIn.x, p1bIn.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 5. 若开启「通道杂物」（开场错态之一），在中段通道画 3 座带细支架的建筑告示立牌，清晰截断汇聚线又不显臃肿
  if (state.clutter) {
    const obstacles = [
      { z: 18.2, x: 0.72, w: 0.78, h: 1.25 },
      { z: 12.6, x: -1.38, w: 0.68, h: 1.15 },
      { z: 9.2, x: 1.26, w: 0.72, h: 1.18 },
    ];
    for (const ob of obstacles) {
      const s = corridorSection(state, ob.z);
      const legH = 0.24;
      const pL = project(ob.x - ob.w / 2, s.floorY, ob.z);
      const pR = project(ob.x + ob.w / 2, s.floorY, ob.z);
      const pLB = project(ob.x - ob.w / 2, s.floorY + legH, ob.z);
      const pRB = project(ob.x + ob.w / 2, s.floorY + legH, ob.z);
      const pLT = project(ob.x - ob.w / 2, s.floorY + ob.h, ob.z);
      const pRT = project(ob.x + ob.w / 2, s.floorY + ob.h, ob.z);
      ctx.save();
      // 支架细腿
      ctx.strokeStyle = PALETTE.inkSoft;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pL.x + (pR.x - pL.x) * 0.2, pL.y);
      ctx.lineTo(pLB.x + (pRB.x - pLB.x) * 0.2, pLB.y);
      ctx.moveTo(pL.x + (pR.x - pL.x) * 0.8, pL.y);
      ctx.lineTo(pLB.x + (pRB.x - pLB.x) * 0.8, pLB.y);
      ctx.stroke();

      // 展板牌面
      ctx.fillStyle = "rgba(93, 113, 102, 0.86)";
      ctx.strokeStyle = PALETTE.redStrong;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pLT.x, pLT.y);
      ctx.lineTo(pRT.x, pRT.y);
      ctx.lineTo(pRB.x, pRB.y);
      ctx.lineTo(pLB.x, pLB.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 细微交叉提示线
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(253, 247, 234, 0.72)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pLT.x + 5, pLT.y + 5);
      ctx.lineTo(pRB.x - 5, pRB.y - 5);
      ctx.moveTo(pRT.x - 5, pRT.y + 5);
      ctx.lineTo(pLB.x + 5, pLB.y - 5);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 6. 消失点红圈虚线 + 顶部红色垂线标签（1:1 承袭 081 原海报「消失点 VANISHING POINT」）
  ctx.save();
  const vpRingR = layer === "vp" ? 20 : 15;
  ctx.strokeStyle = PALETTE.redStrong;
  ctx.lineWidth = layer === "vp" ? 1.8 : 1.1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(vpX, vpY, vpRingR, 0, Math.PI * 2);
  ctx.stroke();
  // 向上引出虚线垂标
  const labelY = Math.max(46, vpY - Math.min(82, H * 0.17));
  ctx.beginPath();
  ctx.moveTo(vpX, vpY - vpRingR);
  ctx.lineTo(vpX, labelY + 14);
  ctx.stroke();
  ctx.setLineDash([]);
  // 小红圆点
  ctx.fillStyle = PALETTE.redStrong;
  ctx.beginPath();
  ctx.arc(vpX, labelY + 12, hoverPart === "vp" ? 4.2 : 2.8, 0, Math.PI * 2);
  ctx.fill();
  // 原海报中英标签
  ctx.textAlign = "center";
  ctx.fillStyle = PALETTE.redDeep;
  ctx.font = `700 ${W < 500 ? 12 : 14}px "Noto Sans SC", sans-serif`;
  ctx.fillText("消失点", vpX, labelY - 8);
  ctx.font = `600 ${W < 500 ? 10 : 11}px "Big Shoulders", sans-serif`;
  ctx.fillText("VANISHING POINT", vpX, labelY + 5);
  ctx.restore();

  // 7. 远景朱红无五官剪影人（带微弱长影）
  const fb = metrics.farBox;
  ctx.save();
  ctx.fillStyle = "rgba(93, 113, 102, 0.45)";
  ctx.beginPath();
  ctx.moveTo(fb.cx - fb.w * 0.3, fb.botY);
  ctx.lineTo(fb.cx + fb.w * 0.3, fb.botY);
  ctx.lineTo(fb.cx - fb.h * 0.25, fb.botY + fb.h * 0.28);
  ctx.lineTo(fb.cx - fb.h * 0.52, fb.botY + fb.h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawSilhouettePerson(ctx, fb.cx, fb.botY, fb.h, PALETTE.red, 1);

  // 8. 前景巨型朱红无五官剪影人 + 标志青灰斜影（1:1 承袭 081 原海报！）
  const nb = metrics.nearBox;
  ctx.save();
  const shGrad = ctx.createLinearGradient(nb.cx, nb.botY, nb.cx - nb.h * 0.48, nb.botY + nb.h * 0.58);
  shGrad.addColorStop(0, "rgba(93, 113, 102, 0.85)");
  shGrad.addColorStop(0.75, "rgba(93, 113, 102, 0.38)");
  shGrad.addColorStop(1, "rgba(93, 113, 102, 0.0)");
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.moveTo(nb.cx - nb.w * 0.34, nb.botY);
  ctx.lineTo(nb.cx + nb.w * 0.34, nb.botY);
  ctx.lineTo(nb.cx - nb.h * 0.16, nb.botY + nb.h * 0.62);
  ctx.lineTo(nb.cx - nb.h * 0.58, nb.botY + nb.h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawSilhouettePerson(ctx, nb.cx, nb.botY, nb.h, PALETTE.red, 1);

  // 高亮层辅助标注（点击左侧圆徽时激活，绝不杂乱）
  if (layer === "scale" || metrics.clippedTop) {
    ctx.save();
    ctx.strokeStyle = metrics.clippedTop ? PALETTE.redStrong : PALETTE.ink;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    const xLine = nb.cx + nb.w * 0.72;
    ctx.beginPath();
    ctx.moveTo(xLine, Math.max(4, nb.topY));
    ctx.lineTo(xLine, Math.min(H - 4, nb.botY));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = metrics.clippedTop ? PALETTE.redDeep : PALETTE.ink;
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`近 ${state.nearZ.toFixed(1)}m (${Math.round(nb.h)}px)`, xLine + 6, Math.max(22, (nb.topY + nb.botY) / 2));
    ctx.restore();
  }
  if (layer === "tension") {
    ctx.save();
    ctx.strokeStyle = PALETTE.tealBadge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nb.cx, nb.topY + nb.h * 0.16);
    ctx.lineTo(fb.cx, fb.topY + fb.h * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  // 近人可拖微环提示（克制建筑标点）
  if (hoverPart === "near") {
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(nb.cx - nb.w * 0.62, Math.max(2, nb.topY - 4), nb.w * 1.24, Math.min(H - 4, nb.h + 8));
    ctx.restore();
  }
}

function renderAlignScene(ctx, W, H, state, metrics, intro) {
  const { project, vpX, vpY } = metrics.proj;
  const ease = 1 - Math.pow(1 - clamp(intro, 0, 1), 3);

  // 地平线与广场铺地透视格
  ctx.save();
  ctx.fillStyle = "rgba(232, 217, 188, 0.45)";
  ctx.fillRect(0, vpY, W, H - vpY);
  ctx.strokeStyle = "rgba(15, 27, 27, 0.24)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, vpY);
  ctx.lineTo(W, vpY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 远景地面收敛线
  for (let gx = -12; gx <= 12; gx += 3) {
    const p1 = project(gx, 0, 2.0);
    const p2 = project(gx, 0, 55.0);
    ctx.strokeStyle = "rgba(15, 27, 27, 0.16)";
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.restore();

  // 远处 42m 的深松青钟楼尖塔（若浅景深 f/1.8 则刻意做多层半透明弥散模拟散景虚化！）
  const tb = metrics.towerBox;
  const tw = Math.max(18, tb.h * 0.23);
  ctx.save();
  const isShallow = state.aperture === "shallow";
  const drawTowerShape = (ox, oy, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.tealWall;
    // 塔身阶梯与尖顶
    const baseY = tb.botY + oy;
    const topY = tb.topY + oy;
    const cx = tb.cx + ox;
    const bodyTop = baseY - tb.h * 0.68;
    ctx.fillRect(cx - tw * 0.5, bodyTop, tw, tb.h * 0.68);
    // 尖顶三角
    ctx.beginPath();
    ctx.moveTo(cx - tw * 0.56, bodyTop);
    ctx.lineTo(cx, topY);
    ctx.lineTo(cx + tw * 0.56, bodyTop);
    ctx.closePath();
    ctx.fill();
    // 塔身暖米窗洞
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(cx - tw * 0.18, bodyTop + tb.h * 0.14, tw * 0.36, tb.h * 0.16);
    ctx.fillRect(cx - tw * 0.18, bodyTop + tb.h * 0.38, tw * 0.36, tb.h * 0.16);
    ctx.restore();
  };

  if (isShallow) {
    // 软件安全的散景弥散（不用昂贵 ctx.filter blur，60fps 极速！）
    const offsets = [[-6, 0], [6, 0], [0, -5], [0, 5], [-4, -4], [4, 4], [-4, 4], [4, -4]];
    for (const [ox, oy] of offsets) drawTowerShape(ox, oy, 0.14);
    drawTowerShape(0, 0, 0.28);
  } else {
    drawTowerShape(0, 0, 1);
  }
  ctx.restore();

  // 前景极近处的朱红剪影手掌
  const hb = metrics.handBox;
  drawSilhouetteHand(ctx, hb.cx, hb.botY, hb.topY, hb.w, PALETTE.red);

  // 视线对齐引导虚线（显示手掌中心与尖塔中心的真实像素偏差！）
  ctx.save();
  ctx.strokeStyle = metrics.alignErrPx <= 14 ? PALETTE.ok : PALETTE.redStrong;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(tb.cx, tb.topY - 12);
  ctx.lineTo(tb.cx, hb.topY + 20 * ease);
  ctx.stroke();
  if (metrics.alignErrPx > 14) {
    ctx.beginPath();
    ctx.moveTo(hb.cx, hb.topY - 10);
    ctx.lineTo(hb.cx, hb.topY + 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = PALETTE.redStrong;
    ctx.beginPath();
    ctx.moveTo(Math.min(hb.cx, tb.cx), hb.topY - 6);
    ctx.lineTo(Math.max(hb.cx, tb.cx), hb.topY - 6);
    ctx.stroke();
    ctx.fillStyle = PALETTE.redDeep;
    ctx.font = `600 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`视差错开 ${Math.round(metrics.alignErrPx)}px`, (hb.cx + tb.cx) / 2, hb.topY - 14);
  }
  ctx.restore();
}

function renderSpadaScene(ctx, W, H, state, metrics, intro) {
  const { project, vpX, vpY } = metrics.proj;
  const ease = 1 - Math.pow(1 - clamp(intro, 0, 1), 3);

  // 绘制斯帕达宫 8.6m 真实短廊的左右双排深青立柱与斜地板/斜拱顶
  const zSteps = [0.9, 1.9, 2.9, 3.9, 4.9, 5.9, 6.9, 7.8, 8.6];
  const s0 = corridorSection(state, 0.9);
  const sEnd = corridorSection(state, 8.6);

  // 远端小花园暖光背墙
  const eTL = project(sEnd.leftX, sEnd.ceilY, 8.6);
  const eTR = project(sEnd.rightX, sEnd.ceilY, 8.6);
  const eBL = project(sEnd.leftX, sEnd.floorY, 8.6);
  const eBR = project(sEnd.rightX, sEnd.floorY, 8.6);

  // 地板（若开启 xray，用斜网格凸显它实际是陡峭斜坡！）
  const nBL = project(s0.leftX, s0.floorY, 0.9);
  const nBR = project(s0.rightX, s0.floorY, 0.9);
  const nTL = project(s0.leftX, s0.ceilY, 0.9);
  const nTR = project(s0.rightX, s0.ceilY, 0.9);

  ctx.save();
  // 左右侧墙实面（深孔雀松青）
  ctx.fillStyle = PALETTE.tealWall;
  ctx.beginPath();
  ctx.moveTo(nTL.x, nTL.y);
  ctx.lineTo(eTL.x, eTL.y);
  ctx.lineTo(eBL.x, eBL.y);
  ctx.lineTo(nBL.x, nBL.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#165A59";
  ctx.beginPath();
  ctx.moveTo(nTR.x, nTR.y);
  ctx.lineTo(eTR.x, eTR.y);
  ctx.lineTo(eBR.x, eBR.y);
  ctx.lineTo(nBR.x, nBR.y);
  ctx.closePath();
  ctx.fill();

  // 顶棚暗青拱面
  ctx.fillStyle = PALETTE.tealDark;
  ctx.beginPath();
  ctx.moveTo(nTL.x, nTL.y);
  ctx.lineTo(nTR.x, nTR.y);
  ctx.lineTo(eTR.x, eTR.y);
  ctx.lineTo(eTL.x, eTL.y);
  ctx.closePath();
  ctx.fill();

  // 地板暖沙铺石
  ctx.fillStyle = PALETTE.paperMid;
  ctx.beginPath();
  ctx.moveTo(nBL.x, nBL.y);
  ctx.lineTo(nBR.x, nBR.y);
  ctx.lineTo(eBR.x, eBR.y);
  ctx.lineTo(eBL.x, eBL.y);
  ctx.closePath();
  ctx.fill();

  // 两侧廊柱与拱洞（由远及近绘制，营造强烈巴洛克透视柱廊）
  for (let i = zSteps.length - 1; i >= 1; i--) {
    const z1 = zSteps[i - 1];
    const z2 = zSteps[i];
    const sec1 = corridorSection(state, z1);
    const sec2 = corridorSection(state, z2);
    const p1bL = project(sec1.leftX, sec1.floorY, z1);
    const p1bR = project(sec1.rightX, sec1.floorY, z1);
    const p2tL = project(sec2.leftX, sec2.ceilY, z2);
    const p2tR = project(sec2.rightX, sec2.ceilY, z2);
    const p2bL = project(sec2.leftX, sec2.floorY, z2);
    const p2bR = project(sec2.rightX, sec2.floorY, z2);

    // 地砖横线
    ctx.strokeStyle = "rgba(15, 27, 27, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1bL.x, p1bL.y);
    ctx.lineTo(p1bR.x, p1bR.y);
    ctx.stroke();

    // 侧墙暖米拱窗透光
    const zMid1 = z1 + (z2 - z1) * 0.18;
    const zMid2 = z1 + (z2 - z1) * 0.78;
    const sm1 = corridorSection(state, zMid1);
    const sm2 = corridorSection(state, zMid2);
    for (const side of [-1, 1]) {
      const wx1 = side < 0 ? sm1.leftX : sm1.rightX;
      const wx2 = side < 0 ? sm2.leftX : sm2.rightX;
      const wt1 = project(wx1, sm1.ceilY - (sm1.ceilY - sm1.floorY) * 0.16, zMid1);
      const wb1 = project(wx1, sm1.floorY + (sm1.ceilY - sm1.floorY) * 0.12, zMid1);
      const wt2 = project(wx2, sm2.ceilY - (sm2.ceilY - sm2.floorY) * 0.16, zMid2);
      const wb2 = project(wx2, sm2.floorY + (sm2.ceilY - sm2.floorY) * 0.12, zMid2);
      ctx.fillStyle = PALETTE.windowReveal;
      ctx.beginPath();
      ctx.moveTo(wt1.x, wt1.y);
      ctx.lineTo(wt2.x, wt2.y);
      ctx.lineTo(wb2.x, wb2.y);
      ctx.lineTo(wb1.x, wb1.y);
      ctx.closePath();
      ctx.fill();
    }

    // 立柱棱线
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = clamp(4 / z2, 0.7, 2.2);
    ctx.beginPath();
    ctx.moveTo(p2tL.x, p2tL.y);
    ctx.lineTo(p2bL.x, p2bL.y);
    ctx.moveTo(p2tR.x, p2tR.y);
    ctx.lineTo(p2bR.x, p2bR.y);
    ctx.stroke();
  }

  // 尽头 8.6m 处仅 60cm 高的朱红战神立像剪影
  const sb = metrics.statueBox;
  // 小底座
  const pedH = Math.max(6, sb.h * 0.24);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillRect(sb.cx - sb.h * 0.22, sb.botY - pedH, sb.h * 0.44, pedH);
  drawSilhouettePerson(ctx, sb.cx, sb.botY - pedH, sb.h, PALETTE.red, 1);

  // 透视收拢参考虚线（X 光模式打开时直接标出 8.6m 与 60cm 真相！）
  if (state.xray || !metrics.ok) {
    ctx.strokeStyle = PALETTE.redStrong;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(nBL.x, nBL.y);
    ctx.lineTo(eBL.x, eBL.y);
    ctx.moveTo(nBR.x, nBR.y);
    ctx.lineTo(eBR.x, eBR.y);
    ctx.moveTo(nTL.x, nTL.y);
    ctx.lineTo(eTL.x, eTL.y);
    ctx.moveTo(nTR.x, nTR.y);
    ctx.lineTo(eTR.x, eTR.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = PALETTE.redDeep;
    ctx.font = `600 11px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`真实仅 8.6m · 雕像高 0.60m`, vpX, Math.max(46, eTL.y - 12 * ease));
  }
  ctx.restore();
}

// 1:1 复刻 081 原海报右下角的「近处 [大红人] ：约 1/N [小红人] 远处」动态比例对照图例！
function drawPosterScaleLegend(ctx, W, H, metrics) {
  const compact = W < 460;
  const boxW = compact ? 156 : 196;
  const boxH = compact ? 92 : 108;
  const x = W - boxW - (compact ? 10 : 16);
  const y = H - boxH - (compact ? 10 : 14);

  ctx.save();
  ctx.fillStyle = "rgba(250, 238, 212, 0.94)";
  ctx.strokeStyle = "rgba(15, 27, 27, 0.22)";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x, y, boxW, boxH);

  // 左侧大红人（固定最大参考高）
  const nearIconH = compact ? 44 : 52;
  const baseLineY = y + boxH - (compact ? 22 : 24);
  const nearX = x + (compact ? 24 : 30);
  drawSilhouettePerson(ctx, nearX, baseLineY, nearIconH, PALETTE.red, 1);

  // 右侧小红人（严格按当前单真源实测 ratio 缩放！最低保留 5px 可见）
  const farIconH = clamp(nearIconH / Math.max(1, metrics.ratio), 5, nearIconH);
  const farX = x + boxW - (compact ? 22 : 26);
  drawSilhouettePerson(ctx, farX, baseLineY, farIconH, PALETTE.red, 1);

  // 文字说明（原海报原味排布）
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = "left";
  ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
  ctx.fillText("近大远小", x + (compact ? 46 : 56), y + (compact ? 22 : 26));
  ctx.font = `500 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText("强烈比例对比", x + (compact ? 46 : 56), y + (compact ? 37 : 42));

  // 中央实测分式「约 1/N」
  const denom = metrics.ratio >= 10 ? Math.round(metrics.ratio) : metrics.ratio.toFixed(1);
  ctx.textAlign = "center";
  ctx.fillStyle = metrics.ratio >= 5.5 ? PALETTE.redDeep : PALETTE.inkSoft;
  ctx.font = `700 ${compact ? 15 : 18}px "DM Mono", monospace`;
  ctx.fillText(`: 1/${denom}`, (nearX + farX) / 2 + 4, baseLineY + 2);

  // 底标注「近处」「远处」
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `600 10px "Noto Sans SC", sans-serif`;
  ctx.fillText("近处", nearX, y + boxH - 7);
  ctx.fillText("远处", farX, y + boxH - 7);
  ctx.restore();
}

function drawSpadaLegend(ctx, W, H, metrics) {
  const boxW = W < 460 ? 164 : 196;
  const boxH = 62;
  const x = W - boxW - 12;
  const y = H - boxH - 12;
  ctx.save();
  ctx.fillStyle = "rgba(250, 238, 212, 0.94)";
  ctx.strokeStyle = "rgba(15, 27, 27, 0.24)";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x, y, boxW, boxH);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = `500 10px "DM Mono", monospace`;
  ctx.fillText("REAL 8.6m  /  STATUE 0.60m", x + 10, y + 20);
  ctx.fillStyle = metrics.ok ? PALETTE.tealWall : PALETTE.redDeep;
  ctx.font = `700 14px "Noto Sans SC", sans-serif`;
  ctx.fillText(`视觉纵深 ≈ ${metrics.apparentLen.toFixed(0)} 米`, x + 10, y + 44);
  ctx.restore();
}

function drawAlignLegend(ctx, W, H, state, metrics) {
  const boxW = W < 460 ? 168 : 204;
  const boxH = 62;
  const x = W - boxW - 12;
  const y = H - boxH - 12;
  ctx.save();
  ctx.fillStyle = "rgba(250, 238, 212, 0.94)";
  ctx.strokeStyle = "rgba(15, 27, 27, 0.24)";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x, y, boxW, boxH);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = `500 10px "DM Mono", monospace`;
  ctx.fillText(`HAND ${state.nearZ.toFixed(2)}m · TOWER ${state.farZ.toFixed(0)}m`, x + 10, y + 20);
  ctx.fillStyle = metrics.ok ? PALETTE.ok : PALETTE.redDeep;
  ctx.font = `700 13px "Noto Sans SC", sans-serif`;
  ctx.fillText(metrics.ok ? "单视点咬合 · 景深双清" : `错开 ${Math.round(metrics.alignErrPx)}px · ${state.aperture === "shallow" ? "远景虚化" : "继续归中"}`, x + 10, y + 44);
  ctx.restore();
}

function drawTopCanvasPill(ctx, W, H, metrics) {
  const padX = 10;
  const text = metrics.badge;
  ctx.save();
  ctx.font = `700 12px "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + padX * 2 + 12;
  const ph = 26;
  const x = 12;
  const y = 12;
  ctx.fillStyle = metrics.ok ? PALETTE.tealWall : PALETTE.redStrong;
  ctx.fillRect(x, y, pw, ph);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.beginPath();
  ctx.arc(x + 11, y + ph / 2, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 20, y + ph / 2 + 0.5);
  ctx.restore();
}

// 渲染「顶视真距离建筑蓝图剖面轨」（主舞台下方紧贴的高 60px 独立平面俯视 Canvas，支持直接拖拽前后红点！）
export function renderTruthPlan(ctx, W, H, state, metrics) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.paperMid;
  ctx.fillRect(0, 0, W, H);

  const padL = 56;
  const padR = 24;
  const usableW = Math.max(120, W - padL - padR);
  const midY = H * 0.54;
  const maxZ = state.scene === "spada" ? 10.0 : state.scene === "align" ? 50.0 : 62.0;
  const zToX = (z) => padL + (clamp(z, 0, maxZ) / maxZ) * usableW;

  // 细标尺背景刻度
  ctx.strokeStyle = "rgba(15, 27, 27, 0.14)";
  ctx.lineWidth = 1;
  const stepZ = state.scene === "spada" ? 2 : 10;
  for (let z = 0; z <= maxZ; z += stepZ) {
    const gx = zToX(z);
    ctx.beginPath();
    ctx.moveTo(gx, 10);
    ctx.lineTo(gx, H - 6);
    ctx.stroke();
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 10px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`${z}m`, gx, 11);
  }

  // 相机视锥扇面（严格按当前水平视角 hFovDeg 画，直观展示广角大张角 vs 长焦窄射线！）
  const camX = padL;
  const halfAngle = Math.min(0.72, (metrics.hFovDeg * Math.PI) / 360);
  const coneLen = usableW * 0.96;
  const dyCone = Math.min(H * 0.40, Math.tan(halfAngle) * coneLen * 0.24);
  ctx.fillStyle = "rgba(18, 82, 81, 0.13)";
  ctx.beginPath();
  ctx.moveTo(camX, midY);
  ctx.lineTo(camX + coneLen, midY - dyCone);
  ctx.lineTo(camX + coneLen, midY + dyCone);
  ctx.closePath();
  ctx.fill();

  // 廊道真实双墙线（在斯帕达宫或开启物理收窄时，肉眼直接看出墙体向内收成梯形！）
  const endZ = state.scene === "spada" ? 8.6 : maxZ * 0.94;
  const sNear = corridorSection(state, 1.0);
  const sFar = corridorSection(state, endZ);
  const wallScaleY = state.scene === "spada" ? 7.5 : 5.2;
  ctx.strokeStyle = PALETTE.tealWall;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(zToX(0.8), midY - Math.abs(sNear.leftX) * wallScaleY);
  ctx.lineTo(zToX(endZ), midY - Math.abs(sFar.leftX) * wallScaleY);
  ctx.moveTo(zToX(0.8), midY + Math.abs(sNear.rightX) * wallScaleY);
  ctx.lineTo(zToX(endZ), midY + Math.abs(sFar.rightX) * wallScaleY);
  ctx.stroke();

  // 镜头三角标志
  const camOffY = clamp((state.camOffsetX || 0) * 14, -14, 14);
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.moveTo(camX, midY + camOffY);
  ctx.lineTo(camX - 11, midY + camOffY - 7);
  ctx.lineTo(camX - 11, midY + camOffY + 7);
  ctx.closePath();
  ctx.fill();
  ctx.font = `600 10px "DM Mono", monospace`;
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(state.focal)}mm`, camX - 14, midY + 3);

  // 前景/远景在平面图里的真实位置红点（可拖拽）
  const nx = zToX(state.nearZ);
  const fx = zToX(state.farZ);

  // 两点物距连线
  ctx.strokeStyle = PALETTE.redStrong;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(nx, midY);
  ctx.lineTo(fx, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 近点滑块
  ctx.fillStyle = PALETTE.redStrong;
  ctx.beginPath();
  ctx.arc(nx, midY, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.paperLight;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 远点滑块
  ctx.fillStyle = state.scene === "align" ? PALETTE.tealWall : PALETTE.red;
  ctx.beginPath();
  ctx.arc(fx, midY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.paperLight;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 标注文字（近远点间距小于 68px 时自动分居左右外侧对齐，彻底杜绝窄屏文字碰撞）
  ctx.font = `600 10px "Noto Sans SC", sans-serif`;
  const nearLabel = state.scene === "align" ? `手 ${state.nearZ.toFixed(2)}m` : state.scene === "spada" ? `入口` : `近 ${state.nearZ.toFixed(1)}m`;
  const farLabel = state.scene === "align" ? `塔 ${state.farZ.toFixed(0)}m` : state.scene === "spada" ? `像 8.6m` : `远 ${state.farZ.toFixed(0)}m`;
  const closePair = Math.abs(fx - nx) < 68;

  ctx.fillStyle = PALETTE.redDeep;
  if (closePair) {
    ctx.textAlign = nx < padL + 46 ? "left" : "right";
    ctx.fillText(nearLabel, nx < padL + 46 ? padL : nx - 6, H - 4);
  } else {
    ctx.textAlign = nx < padL + 36 ? "left" : "center";
    ctx.fillText(nearLabel, nx, H - 4);
  }

  ctx.fillStyle = PALETTE.ink;
  if (closePair) {
    ctx.textAlign = fx > W - 56 ? "right" : "left";
    ctx.fillText(farLabel, fx > W - 56 ? W - 8 : fx + 6, H - 4);
  } else {
    ctx.textAlign = fx > W - 52 ? "right" : "center";
    ctx.fillText(farLabel, fx, H - 4);
  }

  ctx.restore();
  return { padL, padR, usableW, maxZ, nx, fx, midY };
}
