// 027 中轴构图 · 全页 2D Canvas 高精度版画与建筑蓝图绘制器
// 严格保持等比圆形、零 shadowBlur 高帧率、人物无五官剪影

import {
  PALETTE,
  CLUTTER_DEFS,
  SCALE_LEFT_TARGET,
  SCALE_TOKENS,
  SCALE_SLOTS,
  BLIND_SHAPES,
} from "./model.js";

// 通用辅助：画原海报同款层叠松树（含水中倒影）
function drawPineTree(ctx, x, waterY, h, color, reflectColor, withReflection = true) {
  const tiers = 4;
  ctx.fillStyle = color;
  // 树干
  const trunkW = Math.max(2, h * 0.08);
  const trunkH = h * 0.2;
  ctx.fillRect(x - trunkW / 2, waterY - trunkH, trunkW, trunkH);

  // 四层针叶三角
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const tipY = waterY - h + t0 * h * 0.56;
    const baseY = tipY + h * (0.3 + t0 * 0.06);
    const halfW = h * (0.14 + t0 * 0.1);
    ctx.beginPath();
    ctx.moveTo(x, tipY);
    ctx.lineTo(x - halfW, baseY);
    ctx.lineTo(x + halfW, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // 水面切条倒影（仿 027 原海报条纹波影）
  if (withReflection) {
    ctx.fillStyle = reflectColor;
    const refH = h * 0.52;
    const bands = 5;
    for (let b = 0; b < bands; b++) {
      const f = b / bands;
      const y = waterY + 4 + f * refH;
      const bandH = Math.max(1.5, (refH / bands) * 0.56);
      const halfW = h * (0.24 * (1 - f * 0.65));
      ctx.fillRect(x - halfW, y, halfW * 2, bandH);
    }
  }
}

// 通用辅助：画原海报同款简约海鸟（M 形羽翼）
function drawBird(ctx, x, y, span, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, span * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - span, y + span * 0.06);
  ctx.quadraticCurveTo(x - span * 0.45, y - span * 0.28, x, y + span * 0.16);
  ctx.quadraticCurveTo(x + span * 0.45, y - span * 0.28, x + span, y + span * 0.06);
  ctx.stroke();
  ctx.restore();
}

// ============================================================
// 开场主舞台：通天中轴天平剧场（三题材 + 真实机械天平横梁）
// ============================================================
export function drawHeroStage(ctx, w, h, state, evalData, anim) {
  ctx.clearRect(0, 0, w, h);

  // 1. 暖象牙宣纸底色
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  const unit = Math.min(w, h);
  const waterY = h * 0.59;
  const beamY = h * 0.835;
  const pageMidX = w * 0.5;
  const axisXpx = w * state.axisX;
  const subjXpx = w * state.subjectX;
  const tiltRad = (state.axisTilt * Math.PI) / 180;
  const beamRad = ((anim.beamAngleDeg ?? evalData.beamAngleDeg) * Math.PI) / 180;
  const wavePhase = anim.wavePhase || 0;

  // 2. 页面 50% 基准幽灵中线（对照用：当轴偏时一眼看清与页眉虚线错开了）
  ctx.save();
  ctx.strokeStyle = evalData.pillars.stabilityOk ? "rgba(14, 102, 94, 0.26)" : "rgba(7, 43, 80, 0.22)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(pageMidX, 0);
  ctx.lineTo(pageMidX, beamY - 8);
  ctx.stroke();
  ctx.restore();

  // 如果轴线偏离 50%，在顶部画出明显的错位红标桥，一眼认出「假中轴错开」
  if (evalData.absAxisOffset > 1.5 && state.showGuides) {
    ctx.save();
    ctx.fillStyle = "rgba(182, 38, 20, 0.12)";
    const x0 = Math.min(pageMidX, axisXpx);
    ctx.fillRect(x0, 0, Math.abs(axisXpx - pageMidX), beamY - 12);
    ctx.strokeStyle = PALETTE.errLight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pageMidX, 24);
    ctx.lineTo(axisXpx, 24);
    ctx.stroke();
    ctx.restore();
  }

  // 3. 按题材绘制主视觉与两翼配重
  if (state.scene === "mountain") {
    drawMountainScene(ctx, w, h, unit, waterY, subjXpx, state, evalData, wavePhase);
  } else if (state.scene === "lighthouse") {
    drawLighthouseScene(ctx, w, h, unit, waterY, subjXpx, state, evalData, wavePhase);
  } else {
    drawBottleScene(ctx, w, h, unit, waterY, subjXpx, state, evalData);
  }

  // 4. 抢戏游离杂块（可直接在画布上点击删掉）
  state.clutter.forEach((active, idx) => {
    if (!active) return;
    const def = CLUTTER_DEFS[idx];
    const cx = w * def.x;
    const cy = h * def.y;
    const r = clampNum(unit * 0.068, 15, 24);
    ctx.save();
    // 杂乱深灰蓝浮块
    ctx.fillStyle = "#3E5166";
    ctx.beginPath();
    ctx.rect(cx - r * 1.15, cy - r * 0.52, r * 2.3, r * 1.04);
    ctx.fill();
    // 警示虚线红圈 + 叉号（提示可点除）
    ctx.strokeStyle = PALETTE.errLight;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.errLight;
    ctx.beginPath();
    ctx.arc(cx + r * 0.92, cy - r * 0.88, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.92 - 3.5, cy - r * 0.88 - 3.5);
    ctx.lineTo(cx + r * 0.92 + 3.5, cy - r * 0.88 + 3.5);
    ctx.moveTo(cx + r * 0.92 + 3.5, cy - r * 0.88 - 3.5);
    ctx.lineTo(cx + r * 0.92 - 3.5, cy - r * 0.88 + 3.5);
    ctx.stroke();
    ctx.restore();
  });

  // 5. 若显示辅线：画力臂拉线与主体脱轴桥接标
  if (state.showGuides) {
    ctx.save();
    // 主体脱轴连线
    if (evalData.absSubjDelta > 1.8) {
      const yLine = waterY - unit * 0.24;
      ctx.strokeStyle = PALETTE.errLight;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(axisXpx, yLine);
      ctx.lineTo(subjXpx, yLine);
      ctx.stroke();
      ctx.fillStyle = PALETTE.errLight;
      ctx.beginPath();
      ctx.arc(subjXpx, yLine, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 两翼群心力臂虚线标注
    const drawArmGuide = (items, isLeft) => {
      if (!items.length) return;
      const meanX = (items.reduce((s, it) => s + it.x, 0) / items.length) * w;
      const yArm = waterY + unit * 0.145;
      ctx.strokeStyle = "rgba(7, 43, 80, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(axisXpx, yArm);
      ctx.lineTo(meanX, yArm);
      ctx.stroke();
      // 端点短竖线
      ctx.beginPath();
      ctx.moveTo(meanX, yArm - 5);
      ctx.lineTo(meanX, yArm + 5);
      ctx.stroke();
      // 可拖动圆钮提示（文字置于圆钮上方避免压碰底沿天平梁）
      ctx.fillStyle = PALETTE.paperLight;
      ctx.strokeStyle = PALETTE.navy;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(meanX, yArm, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const lbl = isLeft ? `L ${evalData.leftTorque.toFixed(1)}` : `R ${evalData.rightTorque.toFixed(1)}`;
      ctx.font = "700 10px 'Space Mono', 'Noto Serif SC', monospace";
      const tw = ctx.measureText(lbl).width + 8;
      ctx.fillStyle = "rgba(238, 235, 231, 0.9)";
      ctx.fillRect(meanX - tw / 2, yArm - 22, tw, 13);
      ctx.fillStyle = PALETTE.navy;
      ctx.textAlign = "center";
      ctx.fillText(lbl, meanX, yArm - 12);
    };
    drawArmGuide(evalData.wings.left, true);
    drawArmGuide(evalData.wings.right, false);
    ctx.restore();
  }

  // 6. 实绘构图中轴线（随 axisX 与 axisTilt 真实旋转，顶端挂可拖动的朱橘轴锤）
  ctx.save();
  const pivotY = waterY;
  const topDx = -Math.tan(tiltRad) * pivotY;
  const botDx = Math.tan(tiltRad) * (beamY - pivotY);
  const topX = axisXpx + topDx;
  const botX = axisXpx + botDx;

  ctx.strokeStyle = evalData.pillars.stabilityOk ? PALETTE.okLight : PALETTE.sunOrange;
  ctx.lineWidth = 1.9;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(topX, 14);
  ctx.lineTo(botX, beamY - 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // 顶沿朱橘实心圆点（原海报轴点 + 拖动把手，y=26 避让顶部 HUD）
  ctx.fillStyle = evalData.pillars.stabilityOk ? PALETTE.okLight : PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(topX, 26, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 底端轴点圆珠
  ctx.fillStyle = evalData.pillars.stabilityOk ? PALETTE.okLight : PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(botX, beamY - 4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. 底沿机械杠杆天平横梁（按真实力矩倾角 beamRad 摆动）
  drawMechanicalFulcrum(ctx, w, h, axisXpx, beamY, beamRad, evalData);
}

function drawMountainScene(ctx, w, h, unit, waterY, subjX, state, evalData, wavePhase) {
  const sunR = Math.min(unit * 0.245, w * 0.19);
  const sunY = waterY - unit * 0.18;

  // 朱橘落日（永远正圆，并裁剪在水平岸线以上）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, waterY);
  ctx.clip();
  ctx.fillStyle = PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(subjX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 左右飞鸟（随主体微呼应）
  const birdSpan = clampNum(unit * 0.042, 8, 14);
  const birdY = sunY - sunR * 0.56;
  const birdOffset = Math.min(w * 0.27, sunR * 2.15);
  drawBird(ctx, subjX - birdOffset, birdY, birdSpan, PALETTE.navy);
  drawBird(ctx, subjX + birdOffset, birdY, birdSpan, PALETTE.navy);

  // 远山两翼山脉（贴合 027 原海报折面山影，窄屏自动收敛宽度避免压住松林）
  const peakH = Math.min(unit * 0.33, w * 0.25);
  const peakW = Math.min(unit * 0.42, w * 0.27);
  const subH = peakH * 0.62;
  const subOffset = peakW * 0.5;

  // 左侧辅峰与右侧辅峰
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(subjX - peakW * 1.18, waterY);
  ctx.lineTo(subjX - subOffset, waterY - subH);
  ctx.lineTo(subjX - peakW * 0.18, waterY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = state.shadingMode === "subtle" ? PALETTE.midBlue : PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(subjX + peakW * 0.18, waterY);
  ctx.lineTo(subjX + subOffset, waterY - subH);
  ctx.lineTo(subjX + peakW * 1.18, waterY);
  ctx.closePath();
  ctx.fill();

  // 主峰左侧（深海军蓝背光面）
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(subjX - peakW * 0.72, waterY);
  ctx.lineTo(subjX, waterY - peakH);
  ctx.lineTo(subjX, waterY);
  ctx.closePath();
  ctx.fill();

  // 主峰右侧（原海报冷青蓝受光面，可切纯镜像）
  ctx.fillStyle = state.shadingMode === "subtle" ? PALETTE.slateBlue : PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(subjX, waterY - peakH);
  ctx.lineTo(subjX + peakW * 0.72, waterY);
  ctx.lineTo(subjX, waterY);
  ctx.closePath();
  ctx.fill();

  // 山顶积雪帽（锐利折线）
  ctx.fillStyle = PALETTE.snow;
  const snowY = waterY - peakH * 0.72;
  const snowW = peakW * 0.2;
  ctx.beginPath();
  ctx.moveTo(subjX, waterY - peakH);
  ctx.lineTo(subjX - snowW, snowY);
  ctx.lineTo(subjX - snowW * 0.4, snowY + 6);
  ctx.lineTo(subjX, snowY - 3);
  ctx.lineTo(subjX + snowW * 0.45, snowY + 6);
  ctx.lineTo(subjX + snowW, snowY);
  ctx.closePath();
  ctx.fill();

  // 正中雪白三角帆船（骑在主体中心）
  const sailH = unit * 0.15;
  const sailW = unit * 0.068;
  ctx.fillStyle = PALETTE.white;
  ctx.beginPath();
  ctx.moveTo(subjX, waterY - sailH);
  ctx.lineTo(subjX - sailW, waterY - 4);
  ctx.lineTo(subjX - 2, waterY - 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#DCE5F0";
  ctx.beginPath();
  ctx.moveTo(subjX, waterY - sailH * 0.96);
  ctx.lineTo(subjX + 2, waterY - 4);
  ctx.lineTo(subjX + sailW * 0.92, waterY - 4);
  ctx.closePath();
  ctx.fill();

  // 水平岸线
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(w * 0.04, waterY - 1.5, w * 0.92, 3);

  // 山峰与白帆水面条纹倒影（027 原海报标志切片倒影）
  const refH = unit * 0.175;
  const slices = 8;
  for (let i = 0; i < slices; i++) {
    const f = i / slices;
    const y = waterY + 4 + f * refH;
    const sh = Math.max(1.8, (refH / slices) * 0.6);
    const sway = Math.sin(wavePhase + i * 0.8) * (1.1 + f * 1.8);
    const halfSpan = peakW * 0.82 * (1 - f * 0.72);
    ctx.fillStyle = i % 2 === 0 ? PALETTE.navy : PALETTE.slateBlue;
    ctx.fillRect(subjX - halfSpan + sway, y, halfSpan * 2, sh);
    // 白帆倒影高光
    if (i < 5) {
      const sw = sailW * (1 - f * 0.55);
      ctx.fillStyle = "rgba(244, 248, 252, 0.78)";
      ctx.fillRect(subjX - sw + sway * 0.6, y, sw * 2, sh);
    }
  }

  // 两翼松林（实绘点与 model.js 完全一致）
  const baseTreeH = Math.min(unit * 0.19, w * 0.13);
  for (const it of evalData.wings.left) {
    drawPineTree(ctx, it.x * w, waterY, baseTreeH * it.size, PALETTE.navyDeep, "rgba(7, 43, 80, 0.42)", true);
  }
  for (const it of evalData.wings.right) {
    drawPineTree(ctx, it.x * w, waterY, baseTreeH * it.size, PALETTE.navyDeep, "rgba(7, 43, 80, 0.42)", true);
  }
}

function drawLighthouseScene(ctx, w, h, unit, waterY, subjX, state, evalData, wavePhase) {
  const towerH = unit * 0.45;
  const topY = waterY - towerH;

  // 双翼灯塔光束（左右对称斜锥，微动呼吸）
  const beamSpread = w * 0.36;
  const beamAlpha = 0.13 + Math.sin(wavePhase * 0.7) * 0.025;
  ctx.fillStyle = `rgba(50, 82, 116, ${beamAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(subjX, topY + towerH * 0.14);
  ctx.lineTo(subjX - beamSpread, topY - unit * 0.06);
  ctx.lineTo(subjX - beamSpread, topY + towerH * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(subjX, topY + towerH * 0.14);
  ctx.lineTo(subjX + beamSpread, topY - unit * 0.06);
  ctx.lineTo(subjX + beamSpread, topY + towerH * 0.42);
  ctx.closePath();
  ctx.fill();

  // 灯塔基座与塔身
  const baseW = unit * 0.15;
  const topW = unit * 0.085;
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(subjX - baseW / 2, waterY);
  ctx.lineTo(subjX - topW / 2, topY + towerH * 0.22);
  ctx.lineTo(subjX + topW / 2, topY + towerH * 0.22);
  ctx.lineTo(subjX + baseW / 2, waterY);
  ctx.closePath();
  ctx.fill();

  if (state.shadingMode === "subtle") {
    ctx.fillStyle = PALETTE.slateBlue;
    ctx.beginPath();
    ctx.moveTo(subjX, topY + towerH * 0.22);
    ctx.lineTo(subjX + topW / 2, topY + towerH * 0.22);
    ctx.lineTo(subjX + baseW / 2, waterY);
    ctx.lineTo(subjX, waterY);
    ctx.closePath();
    ctx.fill();
  }

  // 白色灯带与观景廊
  ctx.fillStyle = PALETTE.snow;
  ctx.fillRect(subjX - baseW * 0.34, topY + towerH * 0.48, baseW * 0.68, towerH * 0.13);
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(subjX - topW * 0.72, topY + towerH * 0.21, topW * 1.44, 5);
  // 朱橘灯芯圆顶
  ctx.fillStyle = PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(subjX, topY + towerH * 0.13, topW * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // 海平面与礁石基座
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(w * 0.04, waterY - 1.5, w * 0.92, 3);
  ctx.beginPath();
  ctx.moveTo(subjX - baseW * 1.25, waterY);
  ctx.lineTo(subjX - baseW * 0.7, waterY - 11);
  ctx.lineTo(subjX + baseW * 0.7, waterY - 11);
  ctx.lineTo(subjX + baseW * 1.25, waterY);
  ctx.closePath();
  ctx.fill();

  // 倒影条纹
  for (let i = 0; i < 6; i++) {
    const f = i / 6;
    const sw = baseW * 0.65 * (1 - f * 0.5);
    ctx.fillStyle = i % 2 === 0 ? "rgba(7, 43, 80, 0.62)" : "rgba(50, 82, 116, 0.45)";
    ctx.fillRect(subjX - sw, waterY + 6 + i * 7, sw * 2, 3.5);
  }

  // 两翼配重：航标石柱
  const drawBuoy = (it) => {
    const x = it.x * w;
    const bh = unit * 0.16 * it.size;
    const bw = bh * 0.42;
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.beginPath();
    ctx.moveTo(x - bw / 2, waterY);
    ctx.lineTo(x - bw * 0.3, waterY - bh);
    ctx.lineTo(x + bw * 0.3, waterY - bh);
    ctx.lineTo(x + bw / 2, waterY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.fillRect(x - bw * 0.32, waterY - bh * 0.68, bw * 0.64, bh * 0.16);
    ctx.fillStyle = "rgba(7, 43, 80, 0.35)";
    ctx.fillRect(x - bw * 0.45, waterY + 6, bw * 0.9, 4);
  };
  evalData.wings.left.forEach(drawBuoy);
  evalData.wings.right.forEach(drawBuoy);
}

function drawBottleScene(ctx, w, h, unit, waterY, subjX, state, evalData) {
  const bh = unit * 0.44;
  const bw = unit * 0.24;
  const topY = waterY - bh;

  // 椭圆柔台面投影
  ctx.fillStyle = "rgba(7, 43, 80, 0.12)";
  ctx.beginPath();
  ctx.ellipse(subjX, waterY + 4, bw * 1.45, unit * 0.048, 0, 0, Math.PI * 2);
  ctx.fill();

  // 展台横线
  ctx.strokeStyle = PALETTE.navy;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, waterY);
  ctx.lineTo(w * 0.95, waterY);
  ctx.stroke();

  // 瓶盖与瓶颈
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(subjX - bw * 0.25, topY, bw * 0.5, bh * 0.15);
  // 瓶身（微倒角纪念碑轮廓）
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.roundRect(subjX - bw / 2, topY + bh * 0.16, bw, bh * 0.84, [14, 14, 4, 4]);
  ctx.fill();

  if (state.shadingMode === "subtle") {
    ctx.fillStyle = "rgba(92, 132, 174, 0.32)";
    ctx.beginPath();
    ctx.roundRect(subjX, topY + bh * 0.16, bw / 2, bh * 0.84, [0, 14, 4, 0]);
    ctx.fill();
  }

  // 瓶身正中朱橘圆标（027 原海报产品展示同款）
  ctx.fillStyle = PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(subjX, topY + bh * 0.58, bw * 0.24, 0, Math.PI * 2);
  ctx.fill();

  // 两翼配重：几何衬石方块
  const drawStone = (it) => {
    const x = it.x * w;
    const sh = unit * 0.15 * it.size;
    const sw = sh * 0.72;
    ctx.fillStyle = PALETTE.slateBlue;
    ctx.fillRect(x - sw / 2, waterY - sh, sw, sh);
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.fillRect(x - sw / 2, waterY - sh, sw * 0.45, sh);
    ctx.fillStyle = "rgba(7, 43, 80, 0.2)";
    ctx.fillRect(x - sw * 0.55, waterY + 4, sw * 1.1, 3);
  };
  evalData.wings.left.forEach(drawStone);
  evalData.wings.right.forEach(drawStone);
}

// 底部真实机械杠杆天平梁（支点跟随 axisX，横梁按真实力矩倾角倾斜且永不出界）
function drawMechanicalFulcrum(ctx, w, h, axisXpx, beamY, beamRad, evalData) {
  ctx.save();
  const maxVert = Math.max(18, h - beamY - 12);
  const sinAbs = Math.max(0.08, Math.abs(Math.sin(beamRad)));
  const maxByVert = maxVert / sinAbs;
  const maxByEdge = Math.min(axisXpx - 16, w - axisXpx - 16);
  const halfBeam = Math.max(70, Math.min(w * 0.34, 290, maxByVert, maxByEdge));

  // 水平基准刻线（虚线，用于一眼对照横梁有没有水平）
  ctx.strokeStyle = "rgba(7, 43, 80, 0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(axisXpx - halfBeam, beamY);
  ctx.lineTo(axisXpx + halfBeam, beamY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 旋转天平梁
  ctx.translate(axisXpx, beamY);
  ctx.rotate(beamRad);
  ctx.strokeStyle = evalData.pillars.balanceOk ? PALETTE.okLight : PALETTE.navyDeep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-halfBeam, 0);
  ctx.lineTo(halfBeam, 0);
  ctx.stroke();

  // 两端托盘圆珠
  ctx.fillStyle = evalData.pillars.balanceOk ? PALETTE.okLight : PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(-halfBeam, 0, 5, 0, Math.PI * 2);
  ctx.arc(halfBeam, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 支点实心三角座（死死坐于轴线底部）
  ctx.save();
  ctx.fillStyle = evalData.pillars.stabilityOk ? PALETTE.okLight : PALETTE.navyDeep;
  ctx.beginPath();
  ctx.moveTo(axisXpx, beamY);
  ctx.lineTo(axisXpx - 9, beamY + 13);
  ctx.lineTo(axisXpx + 9, beamY + 13);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ============================================================
// 01 节：视觉砝码杠杆天平画布
// ============================================================
export function drawScaleCanvas(ctx, w, h, slotTokens, activeSlot, evalScale) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const pivotY = h * 0.64;
  const beamHalf = w * 0.39;
  const rad = (evalScale.angleDeg * Math.PI) / 180;

  // 垂直中轴虚线
  ctx.save();
  ctx.strokeStyle = evalScale.ok ? PALETTE.okLight : "rgba(7, 43, 80, 0.32)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, 16);
  ctx.lineTo(cx, h - 18);
  ctx.stroke();
  ctx.restore();

  // 顶中朱橘小轴点
  ctx.fillStyle = evalScale.ok ? PALETTE.okLight : PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(cx, 16, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 水平基准虚线
  ctx.save();
  ctx.strokeStyle = "rgba(7, 43, 80, 0.18)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - beamHalf, pivotY);
  ctx.lineTo(cx + beamHalf, pivotY);
  ctx.stroke();
  ctx.restore();

  // 旋转横梁 + 左右砝码
  ctx.save();
  ctx.translate(cx, pivotY);
  ctx.rotate(rad);

  // 横梁本体
  ctx.strokeStyle = evalScale.ok ? PALETTE.okLight : PALETTE.navyDeep;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-beamHalf, 0);
  ctx.lineTo(beamHalf, 0);
  ctx.stroke();

  // 左侧固定深蓝主碑块（力臂 0.55）
  const lx = -beamHalf * SCALE_LEFT_TARGET.arm;
  const blockW = Math.min(w * 0.13, 62);
  const blockH = Math.min(h * 0.34, 96);
  ctx.fillStyle = PALETTE.navy;
  ctx.fillRect(lx - blockW / 2, -blockH - 2, blockW, blockH);
  ctx.fillStyle = "#F4F8FC";
  ctx.font = "700 11px 'Space Mono', 'Noto Serif SC', monospace";
  ctx.textAlign = "center";
  ctx.fillText("重 6.0", lx, -blockH / 2 - 4);
  ctx.fillText("臂 0.55", lx, -blockH / 2 + 12);

  // 右侧三档槽位与已放筹码
  SCALE_SLOTS.forEach((slot, idx) => {
    const sx = beamHalf * slot.arm;
    const isSel = idx === activeSlot;
    // 槽位底托
    ctx.strokeStyle = isSel ? PALETTE.sunOrange : PALETTE.navy;
    ctx.lineWidth = isSel ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(sx - 18, -2);
    ctx.lineTo(sx + 18, -2);
    ctx.stroke();

    const tid = slotTokens[idx];
    if (tid) {
      const tok = SCALE_TOKENS.find((t) => t.id === tid);
      if (tok) drawScaleTokenShape(ctx, sx, -6, tok, Math.min(w, h));
    } else {
      ctx.fillStyle = isSel ? PALETTE.orangeText : PALETTE.inkMuted;
      ctx.font = "700 11px 'Space Mono', 'Noto Serif SC', monospace";
      ctx.textAlign = "center";
      ctx.fillText(isSel ? "放此槽" : `槽${idx + 1}`, sx, -12);
    }
  });

  ctx.restore();

  // 固定支点三角
  ctx.fillStyle = evalScale.ok ? PALETTE.okLight : PALETTE.navyDeep;
  ctx.beginPath();
  ctx.moveTo(cx, pivotY);
  ctx.lineTo(cx - 14, pivotY + 22);
  ctx.lineTo(cx + 14, pivotY + 22);
  ctx.closePath();
  ctx.fill();

  // 底部力矩读数条
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.font = "700 12px 'Space Mono', 'Noto Serif SC', monospace";
  ctx.textAlign = "left";
  ctx.fillText(`左矩 ${evalScale.leftTorque.toFixed(2)}`, 14, h - 14);
  ctx.textAlign = "center";
  ctx.fillStyle = evalScale.ok ? PALETTE.okLight : PALETTE.orangeText;
  ctx.fillText(`倾角 ${evalScale.angleDeg > 0 ? "+" : ""}${evalScale.angleDeg.toFixed(1)}°`, cx, h - 14);
  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillText(`右矩 ${evalScale.rightTorque.toFixed(2)}`, w - 14, h - 14);
}

function drawScaleTokenShape(ctx, x, baseY, tok, unit) {
  const s = clampNum(unit * 0.11, 22, 36);
  ctx.save();
  ctx.fillStyle = tok.color;
  ctx.strokeStyle = PALETTE.navyDeep;
  ctx.lineWidth = 1.4;
  if (tok.shape === "circle") {
    ctx.beginPath();
    ctx.arc(x, baseY - s * 0.65, s * 0.62, 0, Math.PI * 2);
    ctx.fill();
  } else if (tok.shape === "rect") {
    ctx.fillRect(x - s * 0.56, baseY - s * 1.48, s * 1.12, s * 1.48);
  } else if (tok.shape === "trees") {
    drawPineTree(ctx, x - s * 0.28, baseY, s * 1.25, tok.color, tok.color, false);
    drawPineTree(ctx, x + s * 0.28, baseY, s * 1.05, tok.color, tok.color, false);
  } else if (tok.shape === "bars") {
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x - s * 0.65, baseY - 6 - i * 8, s * 1.3, 4.5);
    }
  } else if (tok.shape === "tri") {
    ctx.beginPath();
    ctx.moveTo(x, baseY - s * 1.35);
    ctx.lineTo(x - s * 0.64, baseY);
    ctx.lineTo(x + s * 0.64, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x - s * 0.45, baseY - s * 0.9, s * 0.9, s * 0.9);
  }
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.font = "700 10.5px 'Space Mono', 'Noto Serif SC', monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(tok.visualWeight), x, baseY - s * 1.62);
  ctx.restore();
}

// ============================================================
// 02 节：肉眼定轴盲测仪（几何外接框 vs 视觉质心）
// ============================================================
export function drawBlindCanvas(ctx, w, h, shapeId, userShift, revealed) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  const shape = BLIND_SHAPES.find((s) => s.id === shapeId) || BLIND_SHAPES[0];
  const unit = Math.min(w, h);
  const cx = w * (0.5 + userShift);
  const cy = h * 0.52;
  const boxW = unit * 0.56;
  const boxH = unit * 0.52;

  // 底部极细基线（始终有地平参考，但不暴露中线）
  ctx.strokeStyle = "rgba(7, 43, 80, 0.25)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, cy + boxH * 0.52);
  ctx.lineTo(w * 0.92, cy + boxH * 0.52);
  ctx.stroke();

  // 画三种不对称外形（其几何外接框精确以 cx 为中心，宽度为 boxW）
  ctx.save();
  if (shapeId === "sail") {
    const leftEdge = cx - boxW / 2;
    const rightEdge = cx + boxW / 2;
    const bot = cy + boxH * 0.5;
    const top = cy - boxH * 0.5;
    // 细拉索伸到左边缘（撑大几何外接框，但视觉重量很轻）
    ctx.strokeStyle = PALETTE.slateBlue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + boxW * 0.04, top + 6);
    ctx.lineTo(leftEdge, bot - 8);
    ctx.stroke();
    // 粗实心帆面鼓在右侧
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(cx + boxW * 0.05, top);
    ctx.quadraticCurveTo(rightEdge + 4, cy, rightEdge, bot - 8);
    ctx.lineTo(cx + boxW * 0.05, bot - 8);
    ctx.closePath();
    ctx.fill();
    // 船底基座
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.fillRect(cx - boxW * 0.14, bot - 6, boxW * 0.58, 7);
  } else if (shapeId === "pagoda") {
    const bot = cy + boxH * 0.5;
    const top = cy - boxH * 0.5;
    const towerCx = cx - boxW * 0.14;
    // 古塔主体（重块偏在几何框左侧）
    ctx.fillStyle = PALETTE.navy;
    for (let i = 0; i < 3; i++) {
      const ew = boxW * (0.48 - i * 0.09);
      const ey = bot - (i + 1) * (boxH * 0.26);
      ctx.beginPath();
      ctx.moveTo(towerCx - ew / 2, ey + 14);
      ctx.lineTo(towerCx, ey);
      ctx.lineTo(towerCx + ew / 2, ey + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(towerCx - ew * 0.34, ey + 14, ew * 0.68, boxH * 0.14);
    }
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.fillRect(towerCx - 2, top, 4, boxH * 0.22);
    // 右侧纤细挑出的横枝（撑宽几何框到 cx + boxW/2）
    ctx.strokeStyle = PALETTE.slateBlue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(towerCx + boxW * 0.14, cy - boxH * 0.06);
    ctx.quadraticCurveTo(cx + boxW * 0.28, cy - boxH * 0.16, cx + boxW / 2, cy - boxH * 0.05);
    ctx.stroke();
    ctx.fillStyle = PALETTE.slateBlue;
    ctx.beginPath();
    ctx.arc(cx + boxW / 2 - 4, cy - boxH * 0.06, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 宽脚不对称字母 A 徽（左粗右细且右侧探出装饰细杠）
    const left = cx - boxW / 2;
    const right = cx + boxW / 2;
    const bot = cy + boxH * 0.48;
    const top = cy - boxH * 0.48;
    const apex = cx - boxW * 0.08;
    ctx.fillStyle = PALETTE.navy;
    // 粗左腿
    ctx.beginPath();
    ctx.moveTo(apex - 4, top);
    ctx.lineTo(apex + 14, top);
    ctx.lineTo(left + 26, bot);
    ctx.lineTo(left, bot);
    ctx.closePath();
    ctx.fill();
    // 细右腿
    ctx.beginPath();
    ctx.moveTo(apex + 6, top);
    ctx.lineTo(apex + 14, top);
    ctx.lineTo(cx + boxW * 0.26, bot);
    ctx.lineTo(cx + boxW * 0.17, bot);
    ctx.closePath();
    ctx.fill();
    // 中横杠 + 右侧细延装饰线
    ctx.fillRect(left + 18, cy + boxH * 0.12, boxW * 0.56, 8);
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.fillRect(cx + boxW * 0.22, cy + boxH * 0.12, right - (cx + boxW * 0.22), 3);
  }
  ctx.restore();

  // 验真后揭晓：页面真中轴 50%、几何外接框中心、视觉质心三线同框
  if (revealed) {
    const midX = w * 0.5;
    const optX = w * (0.5 + userShift + shape.opticalOffset);

    // 几何外接框虚线盒
    ctx.save();
    ctx.strokeStyle = "rgba(50, 82, 116, 0.7)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
    // 几何中心线
    ctx.beginPath();
    ctx.moveTo(cx, cy - boxH / 2 - 14);
    ctx.lineTo(cx, cy + boxH / 2 + 16);
    ctx.stroke();
    ctx.restore();

    // 画幅真实 50% 朱橘铅垂线
    ctx.save();
    ctx.strokeStyle = PALETTE.sunOrange;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(midX, 14);
    ctx.lineTo(midX, h - 14);
    ctx.stroke();
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.arc(midX, 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 视觉质心清海青竖线与圆点
    ctx.save();
    ctx.strokeStyle = PALETTE.okLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(optX, cy - boxH / 2 - 10);
    ctx.lineTo(optX, cy + boxH / 2 + 12);
    ctx.stroke();
    ctx.fillStyle = PALETTE.okLight;
    ctx.beginPath();
    ctx.arc(optX, cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 纯矢量图例标号 + 中文兜底（零缺字依赖）
    ctx.font = "700 11px 'Noto Serif SC', serif";
    ctx.textAlign = "left";
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.fillRect(12, 13, 8, 8);
    ctx.fillStyle = PALETTE.orangeText;
    ctx.fillText("橙线：画幅 50% 中轴", 25, 21);

    ctx.fillStyle = PALETTE.okLight;
    ctx.beginPath();
    ctx.arc(16, 33, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("青线：视觉质心", 25, 37);

    ctx.save();
    ctx.strokeStyle = PALETTE.slateBlue;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(12, 49);
    ctx.lineTo(22, 49);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PALETTE.slateBlue;
    ctx.fillText("蓝框：几何外接框", 25, 53);
  } else {
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = "700 12px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.fillText("中轴已隐藏 · 拖动形体凭眼力居中", w / 2, 24);
  }
}

// ============================================================
// 03 节：四时代中轴建筑与扉页蓝图剖视
// ============================================================
export function drawEraBlueprint(ctx, w, h, eraId, scanPhase) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#06213B";
  ctx.fillRect(0, 0, w, h);

  // 极细建筑坐标网格
  ctx.strokeStyle = "rgba(180, 206, 232, 0.09)";
  ctx.lineWidth = 1;
  const step = 28;
  for (let x = step; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = step; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const cx = w * 0.5;
  const cy = h * 0.52;
  const unit = Math.min(w, h);

  // 贯通朱橘中轴（扫描线呼吸感）
  ctx.save();
  ctx.strokeStyle = PALETTE.orangeGlow;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, 16);
  ctx.lineTo(cx, h - 16);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = PALETTE.orangeGlow;
  ctx.beginPath();
  ctx.arc(cx, 16, 4, 0, Math.PI * 2);
  ctx.arc(cx, h - 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#DCE9F7";
  ctx.fillStyle = "#DCE9F7";
  ctx.lineWidth = 1.8;

  if (eraId === "vitruvius") {
    // 古罗马神庙纵轴平面：台阶 → 六柱门廊 → 内殿神龛
    const rw = unit * 0.54;
    const rh = unit * 0.72;
    const top = cy - rh / 2;
    ctx.strokeRect(cx - rw / 2, top, rw, rh * 0.62);
    // 门廊六柱
    for (let i = 0; i < 6; i++) {
      const px = cx - rw * 0.44 + (i / 5) * (rw * 0.88);
      ctx.beginPath();
      ctx.arc(px, top + rh * 0.72, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 入口台阶横线
    for (let s = 0; s < 4; s++) {
      const sy = top + rh * 0.83 + s * 6;
      ctx.beginPath();
      ctx.moveTo(cx - rw * 0.52, sy);
      ctx.lineTo(cx + rw * 0.52, sy);
      ctx.stroke();
    }
    // 尽头内殿祭坛焦环
    ctx.strokeStyle = PALETTE.orangeGlow;
    ctx.beginPath();
    ctx.arc(cx, top + rh * 0.18, 12, 0, Math.PI * 2);
    ctx.stroke();
    drawEraLabels(ctx, cx, top - 6, "CELLA 内殿神龛", cx, top + rh + 16, "入口台阶 → 纵轴直达");
  } else if (eraId === "beijing") {
    // 北京 7.8km 中轴礼序：北钟鼓楼 → 景山 → 紫禁城 → 左祖右社 → 永定门
    const nodes = [
      { y: 0.16, name: "钟鼓楼（北端）", w: 28, h: 12 },
      { y: 0.3, name: "景山", w: 40, h: 14 },
      { y: 0.5, name: "故宫核心宫殿群", w: 92, h: 48, main: true },
      { y: 0.7, name: "正阳门", w: 36, h: 12 },
      { y: 0.86, name: "永定门（南端 · 7.8km）", w: 46, h: 12 },
    ];
    nodes.forEach((n) => {
      const y = h * n.y;
      ctx.strokeStyle = n.main ? PALETTE.orangeGlow : "#DCE9F7";
      ctx.lineWidth = n.main ? 2.2 : 1.5;
      ctx.strokeRect(cx - n.w / 2, y - n.h / 2, n.w, n.h);
      ctx.fillStyle = n.main ? "#FFAD84" : "#DCE9F7";
      ctx.font = "700 11px 'Noto Serif SC', serif";
      ctx.textAlign = "left";
      ctx.fillText(n.name, cx + n.w / 2 + 12, y + 4);
    });
    // 左祖（太庙）右社（社稷坛）对称配翼
    const wingY = h * 0.61;
    ctx.strokeStyle = PALETTE.okDark;
    ctx.strokeRect(cx - 102, wingY - 12, 34, 24);
    ctx.strokeRect(cx + 68, wingY - 12, 34, 24);
    ctx.fillStyle = PALETTE.okDark;
    ctx.font = "700 11px 'Noto Serif SC', serif";
    ctx.textAlign = "right";
    ctx.fillText("左祖·太庙", cx - 108, wingY + 4);
    ctx.textAlign = "left";
    ctx.fillText("右社·社稷坛", cx + 108, wingY + 4);
  } else if (eraId === "palladio") {
    // 帕拉第奥 1570 圆厅别墅：正方形内嵌圆厅 + 四向门廊双正交轴
    const sq = unit * 0.46;
    // 横轴
    ctx.save();
    ctx.strokeStyle = PALETTE.okDark;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - sq * 0.95, cy);
    ctx.lineTo(cx + sq * 0.95, cy);
    ctx.stroke();
    ctx.restore();
    // 外方框与中心圆厅
    ctx.strokeStyle = "#DCE9F7";
    ctx.strokeRect(cx - sq / 2, cy - sq / 2, sq, sq);
    ctx.strokeStyle = PALETTE.orangeGlow;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, sq * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    // 四向柱廊
    const pW = sq * 0.42;
    const pD = sq * 0.24;
    ctx.strokeStyle = "#DCE9F7";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(cx - pW / 2, cy - sq / 2 - pD, pW, pD);
    ctx.strokeRect(cx - pW / 2, cy + sq / 2, pW, pD);
    ctx.strokeRect(cx - sq / 2 - pD, cy - pW / 2, pD, pW);
    ctx.strokeRect(cx + sq / 2, cy - pW / 2, pD, pW);
    ctx.fillStyle = "#C7D8EB";
    ctx.font = "700 11px 'Space Mono', 'Noto Serif SC', monospace";
    ctx.textAlign = "left";
    ctx.fillText("VILLA ROTONDA · 1570", 14, 24);
  } else {
    // 奇肖尔德 1928 非对称 vs 1947 企鹅古典中轴双书页并置
    const pw = Math.min(w * 0.34, 150);
    const ph = h * 0.68;
    const py = cy - ph / 2;
    const lx = cx - pw - 22;
    const rx = cx + 22;

    // 左页：1928 新字体排印（强左轴非对称 + 粗黑条）
    ctx.strokeStyle = "#9FB8D1";
    ctx.strokeRect(lx, py, pw, ph);
    ctx.fillStyle = PALETTE.orangeGlow;
    ctx.fillRect(lx + 14, py + 24, pw * 0.62, 10);
    ctx.fillStyle = "#DCE9F7";
    ctx.fillRect(lx + 14, py + 44, pw * 0.46, 5);
    ctx.fillRect(lx + 14, py + 56, pw * 0.72, 4);
    ctx.fillRect(lx + 14, py + 66, pw * 0.58, 4);
    ctx.fillStyle = PALETTE.okDark;
    ctx.fillRect(lx + pw * 0.58, py + ph - 38, pw * 0.3, 18);
    ctx.fillStyle = "#C7D8EB";
    ctx.font = "700 11px 'Space Mono', 'Noto Serif SC', monospace";
    ctx.textAlign = "center";
    ctx.fillText("1928 非对称排印", lx + pw / 2, py + ph + 18);

    // 右页：1947 企鹅古典中轴扉页
    ctx.strokeStyle = PALETTE.orangeGlow;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, py, pw, ph);
    const rmid = rx + pw / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 122, 69, 0.55)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(rmid, py + 6);
    ctx.lineTo(rmid, py + ph - 6);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PALETTE.orangeGlow;
    ctx.fillRect(rx, py, pw, 22);
    ctx.fillRect(rx, py + ph - 22, pw, 22);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(rmid - pw * 0.3, py + 42, pw * 0.6, 8);
    ctx.fillRect(rmid - pw * 0.2, py + 58, pw * 0.4, 5);
    ctx.beginPath();
    ctx.arc(rmid, py + ph * 0.56, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#FFAD84";
    ctx.fillText("1947 企鹅古典中轴", rmid, py + ph + 18);
  }

  // 微弱水平扫光动效（静态模式静止）
  if (scanPhase > 0) {
    const sy = 20 + ((scanPhase * 32) % (h - 40));
    ctx.strokeStyle = "rgba(108, 214, 200, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, sy);
    ctx.lineTo(w - 12, sy);
    ctx.stroke();
  }
}

function drawEraLabels(ctx, x1, y1, t1, x2, y2, t2) {
  ctx.fillStyle = "#C7D8EB";
  ctx.font = "700 11px 'Noto Serif SC', serif";
  ctx.textAlign = "center";
  ctx.fillText(t1, x1, Math.max(14, y1));
  ctx.fillText(t2, x2, y2);
}

// ============================================================
// 04 节：原海报四景中轴解剖（含三图层开关；人物无五官剪影）
// ============================================================
export function drawExampleCard(ctx, w, h, kind, layers) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const baseY = h * 0.84;
  const unit = Math.min(w, h);

  // 重量热区图层（画在主体后方）
  if (layers.mass) {
    ctx.fillStyle = "rgba(14, 102, 94, 0.14)";
    ctx.strokeStyle = PALETTE.okLight;
    ctx.lineWidth = 1.2;
    const bw = w * 0.22;
    const bh = h * 0.42;
    ctx.fillRect(cx - w * 0.37, h * 0.34, bw, bh);
    ctx.strokeRect(cx - w * 0.37, h * 0.34, bw, bh);
    ctx.fillRect(cx + w * 0.15, h * 0.34, bw, bh);
    ctx.strokeRect(cx + w * 0.15, h * 0.34, bw, bh);
  }

  if (kind === "arch") {
    // 海岸灯塔 + 双翼光束
    ctx.fillStyle = "rgba(7, 43, 80, 0.1)";
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.28);
    ctx.lineTo(w * 0.12, h * 0.16);
    ctx.lineTo(w * 0.12, h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.28);
    ctx.lineTo(w * 0.88, h * 0.16);
    ctx.lineTo(w * 0.88, h * 0.48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(cx - unit * 0.12, baseY);
    ctx.lineTo(cx - unit * 0.07, h * 0.28);
    ctx.lineTo(cx + unit * 0.07, h * 0.28);
    ctx.lineTo(cx + unit * 0.12, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.snow;
    ctx.fillRect(cx - unit * 0.08, h * 0.52, unit * 0.16, h * 0.1);
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.arc(cx, h * 0.23, unit * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.fillRect(w * 0.1, baseY, w * 0.8, 3);
  } else if (kind === "portrait") {
    // 严格遵守规则：纯净无五官深海军蓝人物正面剪影（同 027 原海报）
    ctx.fillStyle = PALETTE.navy;
    // 头廓椭圆
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.41, unit * 0.18, unit * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // 颈与双肩
    ctx.fillRect(cx - unit * 0.07, h * 0.58, unit * 0.14, h * 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - unit * 0.34, baseY);
    ctx.quadraticCurveTo(cx - unit * 0.28, h * 0.67, cx - unit * 0.07, h * 0.67);
    ctx.lineTo(cx + unit * 0.07, h * 0.67);
    ctx.quadraticCurveTo(cx + unit * 0.28, h * 0.67, cx + unit * 0.34, baseY);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "product") {
    // 居中产品瓶身 + 椭圆影 + 朱橘圆标
    ctx.fillStyle = "rgba(7, 43, 80, 0.15)";
    ctx.beginPath();
    ctx.ellipse(cx, baseY, unit * 0.38, unit * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.fillRect(cx - unit * 0.08, h * 0.2, unit * 0.16, h * 0.1);
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.roundRect(cx - unit * 0.17, h * 0.3, unit * 0.34, baseY - h * 0.3, [12, 12, 4, 4]);
    ctx.fill();
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.arc(cx, h * 0.58, unit * 0.075, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 平面海报缩微框（红日雪山）
    const fw = unit * 0.66;
    const fh = unit * 0.8;
    const fx = cx - fw / 2;
    const fy = h * 0.1;
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = PALETTE.paperLight;
    ctx.lineWidth = 2;
    ctx.strokeRect(fx + 5, fy + 5, fw - 10, fh - 10);
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.arc(cx, fy + fh * 0.36, fw * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.snow;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(fx + 8, fy + fh * 0.72);
    ctx.lineTo(cx - fw * 0.14, fy + fh * 0.54);
    ctx.lineTo(cx, fy + fh * 0.64);
    ctx.lineTo(cx + fw * 0.16, fy + fh * 0.48);
    ctx.lineTo(fx + fw - 8, fy + fh * 0.72);
    ctx.stroke();
  }

  // 中轴脊梁图层
  if (layers.axis) {
    ctx.save();
    ctx.strokeStyle = PALETTE.sunOrange;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, 8);
    ctx.lineTo(cx, h - 8);
    ctx.stroke();
    ctx.restore();
  }

  // 视线落点图层
  if (layers.flow) {
    const focusY = kind === "arch" ? h * 0.23 : kind === "portrait" ? h * 0.41 : kind === "product" ? h * 0.58 : h * 0.39;
    ctx.save();
    ctx.strokeStyle = PALETTE.orangeText;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, focusY, unit * 0.11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, focusY, unit * 0.18, 0, Math.PI * 2);
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
// 05 节：强行中轴翻车对照闸
// ============================================================
export function drawAntiExample(ctx, w, h, scene, mode) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  const forced = mode === "forced";
  const cx = w * 0.5;

  if (scene === "essay") {
    // 长段书评：硬居中锯齿左缘 vs 左齐阅读锚线
    const lines = [
      "中轴排版天生适合书扉、碑铭与三行以内的短标题，",
      "但只要正文拉到六行以上，居中会让每行起点来回跳，",
      "眼睛在行尾折返时找不到固定的左缘落脚点，",
      "读完半页就会感到疲惫与散乱；",
      "把正文退回稳固左对齐，只留顶部题签居中，",
      "阅读流畅度与版面秩序才会同时立住。",
    ];
    ctx.font = "700 15px 'Noto Serif SC', serif";
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.textAlign = forced ? "center" : "left";
    ctx.fillText("关于中轴与长文阅读的札记", forced ? cx : 36, 40);

    ctx.font = "400 12.5px 'Noto Serif SC', serif";
    const startY = 74;
    const lh = 26;
    const leftStarts = [];
    lines.forEach((line, i) => {
      const tw = ctx.measureText(line).width;
      const sx = forced ? cx - tw / 2 : 36;
      leftStarts.push({ x: sx, y: startY + i * lh });
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "left";
      ctx.fillText(line, sx, startY + i * lh);
    });

    // 标出左缘轨迹线（锯齿红线 vs 笔直青线，留足 11px 边距不压文字）
    ctx.save();
    ctx.strokeStyle = forced ? PALETTE.errLight : PALETTE.okLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    leftStarts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x - 11, p.y - 4) : ctx.lineTo(p.x - 11, p.y - 4)));
    ctx.stroke();
    ctx.fillStyle = forced ? PALETTE.errLight : PALETTE.okLight;
    ctx.font = "700 11.5px 'Noto Serif SC', serif";
    ctx.textAlign = "right";
    ctx.fillText(forced ? "左缘参差漂移（换行吃力）" : "左缘锚线笔直（顺滑连读）", w - 16, h - 14);
    ctx.restore();
  } else if (scene === "sprint") {
    // 帆艇冲刺：中轴死锁住 vs 偏轴前向留白 + 对角浪势
    const waterY = h * 0.68;
    ctx.fillStyle = "#DCE5EF";
    ctx.fillRect(0, waterY, w, h - waterY);
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, waterY - 1.5, w, 3);

    const boatX = forced ? cx : w * 0.31;
    const tilt = forced ? 0 : 0.14;
    ctx.save();
    ctx.translate(boatX, waterY);
    ctx.rotate(tilt);
    // 帆艇
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(48, 0);
    ctx.lineTo(32, 10);
    ctx.lineTo(-34, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.moveTo(4, -76);
    ctx.lineTo(36, -6);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(-6, -64);
    ctx.lineTo(-34, -6);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (forced) {
      ctx.strokeStyle = PALETTE.errLight;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, 16);
      ctx.lineTo(cx, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.errLight;
      ctx.font = "700 11.5px 'Space Mono', 'Noto Serif SC', monospace";
      ctx.textAlign = "center";
      ctx.fillText("左右空间封死 · 船像钉在画框里动弹不得", cx, 30);
    } else {
      // 前方航线余白箭头
      ctx.strokeStyle = PALETTE.okLight;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(boatX + 58, waterY - 38);
      ctx.lineTo(w * 0.88, waterY - 38);
      ctx.lineTo(w * 0.88 - 10, waterY - 45);
      ctx.moveTo(w * 0.88, waterY - 38);
      ctx.lineTo(w * 0.88 - 10, waterY - 31);
      ctx.stroke();
      ctx.fillStyle = PALETTE.okLight;
      ctx.font = "700 11.5px 'Space Mono', 'Noto Serif SC', monospace";
      ctx.textAlign = "right";
      ctx.fillText("偏轴留出 65% 前向水域 · 速度感立刻活起来", w - 16, 30);
    }
  } else {
    // 参数卡片：硬居中锯齿散乱 vs 双轴左图右表
    if (forced) {
      ctx.fillStyle = PALETTE.navy;
      ctx.fillRect(cx - 26, 20, 52, 56);
      ctx.fillStyle = PALETTE.sunOrange;
      ctx.beginPath();
      ctx.arc(cx, 48, 11, 0, Math.PI * 2);
      ctx.fill();

      const specs = ["型号：AX-027 陶瓷瓶", "高 245mm · 口径 62mm · 净重 680g", "釉色：普鲁士深蓝 / 朱橘釉点", "手工拉坯，每只存在轻微窑变纹路"];
      ctx.textAlign = "center";
      ctx.font = "700 12px 'Noto Serif SC', serif";
      specs.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? PALETTE.navyDeep : PALETTE.ink;
        ctx.fillText(s, cx, 102 + i * 26);
      });
      ctx.fillStyle = PALETTE.errLight;
      ctx.font = "700 11px 'Space Mono', 'Noto Serif SC', monospace";
      ctx.fillText("图文全居中堆叠 · 规格扫读无对齐锚", cx, h - 14);
    } else {
      // 双轴分栏：左视觉轴 + 右对齐参数轴
      const leftCol = w * 0.28;
      const rightCol = w * 0.52;
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(24, 24, w * 0.38, h - 54);
      ctx.fillStyle = PALETTE.navy;
      ctx.fillRect(leftCol - 24, h * 0.5 - 38, 48, 70);
      ctx.fillStyle = PALETTE.sunOrange;
      ctx.beginPath();
      ctx.arc(leftCol, h * 0.5 - 4, 11, 0, Math.PI * 2);
      ctx.fill();

      const rows = [
        ["型号", "AX-027 陶瓷瓶"],
        ["尺寸", "高 245mm · 口径 62mm"],
        ["重量", "680g（手工拉坯）"],
        ["釉色", "普鲁士深蓝 / 朱橘釉点"],
      ];
      ctx.textAlign = "left";
      rows.forEach(([k, v], i) => {
        const y = 52 + i * 32;
        ctx.font = "700 11.5px 'Space Mono', 'Noto Serif SC', monospace";
        ctx.fillStyle = PALETTE.orangeText;
        ctx.fillText(k, rightCol, y);
        ctx.font = "400 12.5px 'Noto Serif SC', serif";
        ctx.fillStyle = PALETTE.navyDeep;
        ctx.fillText(v, rightCol + 42, y);
        ctx.strokeStyle = PALETTE.rule;
        ctx.beginPath();
        ctx.moveTo(rightCol, y + 10);
        ctx.lineTo(w - 22, y + 10);
        ctx.stroke();
      });
      ctx.fillStyle = PALETTE.okLight;
      ctx.font = "700 11px 'Space Mono', 'Noto Serif SC', monospace";
      ctx.textAlign = "right";
      ctx.fillText("双轴分栏 · 一眼扫完全部参数", w - 18, h - 12);
    }
  }
}

// ============================================================
// 06 节：单变量挑一挑练习缩样画布
// ============================================================
export function drawQuizThumb(ctx, w, h, opt) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const unit = Math.min(w, h);

  // 顶部固定居中标题条
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(cx - w * 0.28, h * 0.08, w * 0.56, 12);
  ctx.fillStyle = PALETTE.sunOrange;
  ctx.fillRect(cx - w * 0.2, h * 0.145, w * 0.4, 3.5);

  if (opt.kind === "product") {
    const bx = w * opt.bottleX;
    const baseY = h * 0.72;
    const s = opt.bottleScale;
    const bw = unit * 0.26 * s;
    const bh = h * 0.36 * s;

    ctx.fillStyle = "rgba(7, 43, 80, 0.14)";
    ctx.beginPath();
    ctx.ellipse(bx, baseY + 3, bw * 1.25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.navyDeep;
    ctx.fillRect(bx - bw * 0.24, baseY - bh - bh * 0.14, bw * 0.48, bh * 0.15);
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.roundRect(bx - bw / 2, baseY - bh, bw, bh, [10, 10, 3, 3]);
    ctx.fill();
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.arc(bx, baseY - bh * 0.48, bw * 0.24, 0, Math.PI * 2);
    ctx.fill();

    if (opt.rightStamp) {
      ctx.fillStyle = PALETTE.navyDeep;
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.44, unit * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.sunOrange;
      ctx.fillRect(w * 0.72, h * 0.43, unit * 0.16, 4);
    }

    if (opt.cornerNoise) {
      const pts = [
        [w * 0.16, h * 0.28],
        [w * 0.84, h * 0.28],
        [w * 0.16, h * 0.78],
        [w * 0.84, h * 0.78],
      ];
      pts.forEach(([px, py]) => {
        ctx.fillStyle = PALETTE.sunOrange;
        ctx.fillRect(px - 14, py - 10, 28, 20);
      });
    }

    // 底部简洁双翼平衡条
    ctx.fillStyle = PALETTE.slateBlue;
    ctx.fillRect(w * 0.14, h * 0.85, w * 0.26, 4);
    ctx.fillRect(w * 0.6, h * 0.85, w * 0.26, 4);
    return;
  }

  // 第 1 题：建筑特展海报草图（红日裁剪在岸线以上，干净利落）
  const sx = w * opt.subjectX;
  const waterY = h * 0.6;
  const sunR = unit * 0.19;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, waterY);
  ctx.clip();
  ctx.fillStyle = PALETTE.sunOrange;
  ctx.beginPath();
  ctx.arc(sx, waterY - sunR * 0.72, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 展馆尖顶主山峰
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.moveTo(sx - unit * 0.24, waterY);
  ctx.lineTo(sx, waterY - h * 0.22);
  ctx.lineTo(sx, waterY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.slateBlue;
  ctx.beginPath();
  ctx.moveTo(sx, waterY - h * 0.22);
  ctx.lineTo(sx + unit * 0.24, waterY);
  ctx.lineTo(sx, waterY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(w * 0.08, waterY, w * 0.84, 2.5);

  // 左右松林
  if (opt.leftHeavyNear) {
    // 方案 C：左 2 近轴高松 + 右 3 远轴小松（异形等重合法解）
    drawPineTree(ctx, w * 0.24, waterY, h * 0.16, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
    drawPineTree(ctx, w * 0.31, waterY, h * 0.15, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
    drawPineTree(ctx, w * 0.72, waterY, h * 0.095, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
    drawPineTree(ctx, w * 0.79, waterY, h * 0.1, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
    drawPineTree(ctx, w * 0.86, waterY, h * 0.105, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
  } else {
    for (let i = 0; i < opt.leftTrees; i++) {
      drawPineTree(ctx, w * (0.14 + i * 0.075), waterY, h * 0.13, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
    }
    for (let i = 0; i < opt.rightTrees; i++) {
      drawPineTree(ctx, w * (0.86 - i * 0.075), waterY, h * 0.13, PALETTE.navyDeep, "rgba(7,43,80,0.3)", true);
    }
  }

  if (opt.leftBadge) {
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.beginPath();
    ctx.arc(w * 0.2, h * 0.32, unit * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.sunOrange;
    ctx.beginPath();
    ctx.arc(w * 0.2, h * 0.32, unit * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  // 底部文字区
  if (opt.longCenteredCopy) {
    const widths = [0.74, 0.52, 0.8, 0.44, 0.72, 0.38];
    ctx.fillStyle = PALETTE.ink;
    widths.forEach((wf, i) => {
      const lw = w * wf;
      ctx.fillRect(cx - lw / 2, h * 0.71 + i * 10, lw, 4);
    });
  } else {
    ctx.fillStyle = PALETTE.navyTip;
    ctx.fillRect(w * 0.08, h * 0.82, w * 0.84, h * 0.1);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(cx - w * 0.22, h * 0.86, w * 0.44, 4);
  }
}

function clampNum(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
