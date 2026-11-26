// 305 过肩构图 · 高速 2D 光学电影画布引擎
// 1:1 承袭 305 原海报百叶窗光影、无五官剪影、荧光青柠肩沿发光轮廓与 L 形取景角。
// 前景柔焦采用多层羽化轮廓法，零 ctx.filter 显卡阻塞，在软件渲染与 6x 降速下仍保持 60fps。

import { SCENES, clamp, evaluateShot, lerp } from "./model.js";

function drawPoly(ctx, pts, w, h) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
  ctx.closePath();
}

function drawPolyline(ctx, pts, w, h) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
}

// 绘制场景背景：原海报同款斜照百叶窗光束 / 审讯室顶灯光锥 / 暮色天台落日剪影
function drawBackdrop(ctx, w, h, geom, scene, isReverse) {
  const { rightSide, horizonY, tableY, lampPt, focalMm } = geom;

  // 基底墙面渐变
  const wallGrad = ctx.createLinearGradient(0, 0, w, h);
  if (isReverse) {
    wallGrad.addColorStop(0, scene.backWallDeep);
    wallGrad.addColorStop(0.55, scene.wallBase);
    wallGrad.addColorStop(1, scene.wallDeep);
  } else {
    wallGrad.addColorStop(0, scene.wallDeep);
    wallGrad.addColorStop(0.52, scene.wallBase);
    wallGrad.addColorStop(1, scene.backWallDeep);
  }
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  if (scene.prop === "cafe") {
    // 原海报招牌：大面积斜射百叶窗光斑投射在主体一侧墙面
    const litStartX = rightSide ? 0 : w * 0.40;
    const litW = w * 0.62;
    const skew = (rightSide ? 1 : -1) * h * 0.14;
    const topY = h * clamp(horizonY - 0.36, 0.04, 0.24);
    const botY = h * clamp(tableY + 0.14, 0.72, 0.96);

    ctx.save();
    ctx.beginPath();
    if (rightSide) {
      ctx.moveTo(0, topY);
      ctx.lineTo(litW, topY + skew);
      ctx.lineTo(litW, botY + skew * 0.5);
      ctx.lineTo(0, botY);
    } else {
      ctx.moveTo(litStartX, topY - skew);
      ctx.lineTo(w, topY);
      ctx.lineTo(w, botY);
      ctx.lineTo(litStartX, botY - skew * 0.5);
    }
    ctx.closePath();
    ctx.clip();

    // 亮墙底
    const sunGrad = ctx.createLinearGradient(litStartX, topY, litStartX + litW, botY);
    sunGrad.addColorStop(0, isReverse ? scene.backWallLit : scene.blindLit);
    sunGrad.addColorStop(1, scene.blindShade);
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // 百叶窗暗条合并为单一路径一次性 fill，大幅降低软件渲染绘制开销
    const slats = Math.round(lerp(13, 9, (focalMm - 28) / 72));
    const step = (botY - topY) / slats;
    ctx.fillStyle = "rgba(116, 94, 68, 0.42)";
    ctx.beginPath();
    for (let i = 0; i < slats; i++) {
      const y0 = topY + i * step;
      if (rightSide) {
        ctx.moveTo(0, y0);
        ctx.lineTo(litW, y0 + skew);
        ctx.lineTo(litW, y0 + skew + step * 0.38);
        ctx.lineTo(0, y0 + step * 0.38);
      } else {
        ctx.moveTo(litStartX, y0 - skew);
        ctx.lineTo(w, y0);
        ctx.lineTo(w, y0 + step * 0.38);
        ctx.lineTo(litStartX, y0 - skew + step * 0.38);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // 墙角与窗框极淡竖线
    ctx.strokeStyle = "rgba(18, 16, 12, 0.14)";
    ctx.lineWidth = Math.max(1, w * 0.002);
    const seamX = rightSide ? w * 0.59 : w * 0.41;
    ctx.beginPath();
    ctx.moveTo(seamX, 0);
    ctx.lineTo(seamX, h * tableY);
    ctx.stroke();

    // 角落剪影绿植（呼应原海报右侧盆栽叶片）
    const leafX = rightSide ? w * 0.06 : w * 0.94;
    const leafSign = rightSide ? 1 : -1;
    const leafBaseY = h * clamp(tableY + 0.05, 0.65, 0.92);
    ctx.save();
    ctx.fillStyle = "rgba(22, 20, 16, 0.85)";
    const blades = [
      [-0.10, -0.22, -0.02, -0.10],
      [-0.08, -0.14, 0.01, -0.05],
      [-0.12, -0.06, -0.01, -0.01],
    ];
    for (const [dx1, dy1, dx2, dy2] of blades) {
      ctx.beginPath();
      ctx.moveTo(leafX, leafBaseY);
      ctx.quadraticCurveTo(
        leafX + leafSign * w * dx2,
        leafBaseY + h * dy1,
        leafX + leafSign * w * dx1,
        leafBaseY + h * (dy1 + 0.03)
      );
      ctx.quadraticCurveTo(
        leafX + leafSign * w * (dx1 * 0.45),
        leafBaseY + h * (dy2 - 0.02),
        leafX,
        leafBaseY + h * 0.02
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (scene.prop === "interrogation") {
    // 审讯室冷顶灯光锥 + 瓷砖暗线
    const lx = lampPt.u * w;
    const ly = lampPt.v * h;
    const cone = ctx.createRadialGradient(lx, ly + h * 0.05, w * 0.02, lx, h * 0.56, w * 0.64);
    cone.addColorStop(0, scene.blindLit);
    cone.addColorStop(0.55, scene.blindShade);
    cone.addColorStop(1, scene.wallDeep);
    ctx.fillStyle = cone;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(18, 22, 18, 0.16)";
    ctx.lineWidth = 1;
    const wallLine = h * clamp(horizonY + 0.06, 0.35, 0.68);
    ctx.beginPath();
    ctx.moveTo(0, wallLine);
    ctx.lineTo(w, wallLine);
    ctx.stroke();
    // 单向玻璃暗框
    const glassX = rightSide ? w * 0.08 : w * 0.50;
    ctx.fillStyle = "rgba(16, 20, 17, 0.26)";
    ctx.fillRect(glassX, h * 0.14, w * 0.42, h * 0.30);
    ctx.strokeStyle = "rgba(184, 194, 176, 0.20)";
    ctx.strokeRect(glassX, h * 0.14, w * 0.42, h * 0.30);
  } else {
    // 暮色天台：落日渐层 + 远景低矮城市天际线 + 栏杆横杠
    const sky = ctx.createLinearGradient(0, 0, 0, h * clamp(horizonY + 0.22, 0.48, 0.84));
    sky.addColorStop(0, scene.wallDeep);
    sky.addColorStop(0.52, scene.blindShade);
    sky.addColorStop(1, scene.blindLit);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 远景建筑低轮廓
    const baseLine = h * clamp(horizonY + 0.14, 0.44, 0.78);
    ctx.fillStyle = "rgba(32, 24, 21, 0.58)";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseLine - h * 0.05);
    const blocks = [0.12, 0.24, 0.36, 0.52, 0.66, 0.80, 0.92, 1.0];
    const heights = [0.06, 0.13, 0.05, 0.10, 0.15, 0.08, 0.12, 0.06];
    for (let i = 0; i < blocks.length; i++) {
      const bx = blocks[i] * w;
      const bh = heights[i] * h;
      ctx.lineTo(bx - w * 0.12, baseLine - bh);
      ctx.lineTo(bx, baseLine - bh);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 天台栏杆横线
    ctx.strokeStyle = "rgba(22, 17, 15, 0.65)";
    ctx.lineWidth = Math.max(1.5, h * 0.006);
    for (const r of [0, 0.07]) {
      ctx.beginPath();
      ctx.moveTo(0, baseLine + h * r);
      ctx.lineTo(w, baseLine + h * r);
      ctx.stroke();
    }
  }

  // 吊灯（咖啡馆 & 审讯室，原海报经典黑色吊灯剪影）
  if (scene.prop !== "rooftop") {
    const lx = lampPt.u * w;
    const ly = lampPt.v * h;
    const lr = Math.min(w, h) * 0.072 * lampPt.scale;

    // 柔光晕
    const glow = ctx.createRadialGradient(lx, ly + lr * 0.8, lr * 0.2, lx, ly + lr * 1.4, lr * 3.8);
    glow.addColorStop(0, scene.lampGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly + lr * 1.2, lr * 3.8, 0, Math.PI * 2);
    ctx.fill();

    // 吊线与灯罩
    ctx.strokeStyle = "#11120F";
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    ctx.fillStyle = "#121310";
    ctx.beginPath();
    ctx.moveTo(lx - lr * 0.22, ly);
    ctx.lineTo(lx + lr * 0.22, ly);
    ctx.quadraticCurveTo(lx + lr * 0.92, ly + lr * 0.35, lx + lr * 1.02, ly + lr * 0.82);
    ctx.lineTo(lx - lr * 1.02, ly + lr * 0.82);
    ctx.quadraticCurveTo(lx - lr * 0.92, ly + lr * 0.35, lx - lr * 0.22, ly);
    ctx.closePath();
    ctx.fill();
  }
}

// 绘制远端清晰主体（纯无五官剪影 + 微弱暖边光）与桌面道具
function drawSubjectAndTable(ctx, w, h, geom, scene) {
  const { subHead, subBody, isFemaleSub, tableY, rightSide } = geom;
  const cx = subHead.u * w;
  const cy = subHead.v * h;
  const rx = subHead.rx * w;
  const ry = subHead.ry * h;

  // 桌面（在主体后半程或前面交界）
  const ty = tableY * h;

  // 主体背后微弱椅背剪影（咖啡馆/审讯室）
  if (scene.prop !== "rooftop") {
    ctx.fillStyle = "rgba(22, 20, 17, 0.72)";
    const chairW = subBody.shoulderW * w * 1.18;
    const chairX = cx - chairW * 0.48;
    const chairTop = ty - ry * 0.75;
    ctx.fillRect(chairX, chairTop, chairW, h - chairTop);
  }

  // 主体躯干与双肩（无五官剪影，清晰锐利）
  ctx.save();
  ctx.fillStyle = scene.subFill;
  const shW = subBody.shoulderW * w;
  const neckY = subBody.neckV * h;
  const shY = subBody.shoulderV * h;
  const botY = Math.max(ty + h * 0.04, subBody.bottomV * h);

  // 颈部
  ctx.fillRect(cx - rx * 0.34, cy + ry * 0.55, rx * 0.68, ry * 0.72);

  // 外套肩身与微倾交谈姿势
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.42, neckY);
  ctx.quadraticCurveTo(cx - shW * 0.78, shY - ry * 0.1, cx - shW * 0.96, shY + ry * 0.55);
  ctx.lineTo(cx - shW * 1.06, botY);
  ctx.lineTo(cx + shW * 1.06, botY);
  ctx.lineTo(cx + shW * 0.96, shY + ry * 0.55);
  ctx.quadraticCurveTo(cx + shW * 0.78, shY - ry * 0.1, cx + rx * 0.42, neckY);
  ctx.closePath();
  ctx.fill();

  // 衣领微微高光分界（让无五官剪影更有立体电影衣褶感）
  ctx.strokeStyle = "rgba(220, 198, 162, 0.14)";
  ctx.lineWidth = Math.max(1, w * 0.0022);
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.44, neckY + ry * 0.12);
  ctx.lineTo(cx, neckY + ry * 1.25);
  ctx.lineTo(cx + rx * 0.44, neckY + ry * 0.12);
  ctx.stroke();

  // 头部与发型剪影（绝对不画五官！）
  ctx.beginPath();
  if (isFemaleSub) {
    // 齐肩中分/柔顺微卷发廓，忠实还原 305 原海报中的远端女性剪影
    ctx.moveTo(cx, cy - ry * 1.06);
    ctx.bezierCurveTo(cx + rx * 1.06, cy - ry * 1.04, cx + rx * 1.24, cy - ry * 0.15, cx + rx * 1.16, cy + ry * 0.98);
    ctx.quadraticCurveTo(cx + rx * 0.84, cy + ry * 1.24, cx + rx * 0.52, cy + ry * 0.92);
    ctx.lineTo(cx - rx * 0.52, cy + ry * 0.92);
    ctx.quadraticCurveTo(cx - rx * 0.84, cy + ry * 1.24, cx - rx * 1.16, cy + ry * 0.98);
    ctx.bezierCurveTo(cx - rx * 1.24, cy - ry * 0.15, cx - rx * 1.06, cy - ry * 1.04, cx, cy - ry * 1.06);
  } else {
    // 利落男士短发侧影廓形（无五官）
    ctx.ellipse(cx, cy, rx * 0.94, ry * 1.03, 0, 0, Math.PI * 2);
  }
  ctx.closePath();
  ctx.fill();

  // 窗光一侧极淡轮廓逆光
  ctx.strokeStyle = scene.subRim;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.beginPath();
  const rimStart = rightSide ? Math.PI * 0.72 : -Math.PI * 0.45;
  const rimEnd = rightSide ? Math.PI * 1.45 : Math.PI * 0.28;
  ctx.ellipse(cx, cy, rx * 0.95, ry * 1.02, 0, rimStart, rimEnd);
  ctx.stroke();
  ctx.restore();

  // 桌面与桌边杯子/卷宗道具（非天台场景）
  if (scene.prop !== "rooftop") {
    const tableCx = rightSide ? w * 0.34 : w * 0.66;
    const tableRx = w * 0.42;
    const tableRy = h * 0.068;

    ctx.save();
    ctx.fillStyle = scene.tableTop;
    ctx.beginPath();
    ctx.ellipse(tableCx, ty + tableRy * 0.5, tableRx, tableRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 桌沿与深暗阴影下方
    ctx.fillStyle = scene.tableEdge;
    ctx.fillRect(tableCx - tableRx, ty + tableRy * 0.5, tableRx * 2, h - ty);

    // 桌上桌面微亮高光线
    ctx.strokeStyle = "rgba(222, 194, 152, 0.22)";
    ctx.lineWidth = Math.max(1, h * 0.003);
    ctx.beginPath();
    ctx.ellipse(tableCx, ty + tableRy * 0.45, tableRx * 0.98, tableRy * 0.92, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // 咖啡杯或卷宗剪影
    const cupX = cx + (rightSide ? rx * 0.72 : -rx * 0.72);
    const cupY = ty + tableRy * 0.28;
    const cupW = Math.max(8, rx * 0.72);
    const cupH = Math.max(8, ry * 0.65);
    ctx.fillStyle = "#0F100E";
    if (scene.prop === "cafe") {
      ctx.fillRect(cupX - cupW * 0.5, cupY - cupH, cupW, cupH);
      ctx.strokeStyle = "#0F100E";
      ctx.lineWidth = Math.max(1.5, cupW * 0.14);
      ctx.beginPath();
      ctx.arc(cupX + cupW * 0.52, cupY - cupH * 0.5, cupH * 0.26, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
    } else {
      // 审讯卷宗夹
      ctx.fillStyle = "rgba(184, 194, 176, 0.24)";
      ctx.beginPath();
      ctx.moveTo(cupX - cupW * 1.4, cupY);
      ctx.lineTo(cupX + cupW * 1.1, cupY - cupH * 0.25);
      ctx.lineTo(cupX + cupW * 1.5, cupY + cupH * 0.15);
      ctx.lineTo(cupX - cupW * 0.9, cupY + cupH * 0.35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

// 绘制前景虚化肩部（无 ctx.filter 阻塞，采用与物理 CoC 等宽的多层羽化廓形 + 原海报荧光青柠发光肩沿！）
function drawForegroundShoulder(ctx, w, h, geom, scene, evalData, opts) {
  const { fgPoly, fgShoulderRim, optics, rightSide } = geom;
  const blurPx = clamp(optics.blurNorm * w * 1.35, 0.5, Math.max(18, w * 0.038));

  ctx.save();
  // 当光圈大（blurPx > 2.0）时，叠加递增扩散的柔焦羽化轮廓，物理宽度精确对应 blurPx
  // 窄屏精简为 4 层以保证软件渲染 60fps，宽屏 6 层更细腻
  if (blurPx > 2.0) {
    const layers = w < 480
      ? [
          { spread: blurPx * 0.96, alpha: 0.08 },
          { spread: blurPx * 0.64, alpha: 0.15 },
          { spread: blurPx * 0.38, alpha: 0.24 },
          { spread: blurPx * 0.16, alpha: 0.38 },
        ]
      : [
          { spread: blurPx * 1.05, alpha: 0.05 },
          { spread: blurPx * 0.80, alpha: 0.09 },
          { spread: blurPx * 0.56, alpha: 0.14 },
          { spread: blurPx * 0.36, alpha: 0.21 },
          { spread: blurPx * 0.20, alpha: 0.30 },
          { spread: blurPx * 0.10, alpha: 0.42 },
        ];
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    drawPoly(ctx, fgPoly, w, h);
    ctx.strokeStyle = scene.fgFill;
    for (const ly of layers) {
      ctx.globalAlpha = ly.alpha;
      ctx.lineWidth = ly.spread * 2;
      ctx.stroke();
    }
  }

  // 前景主剪影填充
  ctx.globalAlpha = blurPx > 5 ? 0.95 : 1.0;
  drawPoly(ctx, fgPoly, w, h);
  const bodyGrad = ctx.createLinearGradient(
    rightSide ? w : 0,
    0,
    rightSide ? w * 0.5 : w * 0.5,
    h
  );
  bodyGrad.addColorStop(0, scene.fgFill);
  bodyGrad.addColorStop(0.7, "#151613");
  bodyGrad.addColorStop(1, scene.fgBackLit);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 光圈过小（锐利抢戏）时，故意描出刺眼的硬锐灰边，让肉眼立刻感到「前景在抢戏」
  if (!evalData.checks.depthOk && !opts.clean) {
    drawPoly(ctx, fgPoly, w, h);
    ctx.strokeStyle = "rgba(232, 218, 190, 0.42)";
    ctx.lineWidth = Math.max(1.2, w * 0.0022);
    ctx.stroke();
  }

  // 305 原海报最标志性的视觉符号：沿前景肩脊弯曲延伸的荧光青柠发光轮廓线
  const rimOk = evalData.checks.frameOk && !evalData.faceOverlapPct;
  const rimColor = !opts.clean && evalData.faceOverlapPct > 1 ? "#F06A4B" : scene.accentBright;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // 外发光柔晕
  drawPolyline(ctx, fgShoulderRim, w, h);
  ctx.strokeStyle = rimColor;
  ctx.globalAlpha = opts.compact ? 0.34 : 0.28;
  ctx.lineWidth = Math.max(4, w * (opts.compact ? 0.018 : 0.012));
  ctx.stroke();
  // 核心亮青柠肩线
  drawPolyline(ctx, fgShoulderRim, w, h);
  ctx.strokeStyle = rimColor;
  ctx.globalAlpha = rimOk || opts.clean ? 0.96 : 0.86;
  ctx.lineWidth = Math.max(1.8, w * (opts.compact ? 0.0085 : 0.0046));
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// 绘制原海报同款光学标注层（L 形取景角、虚线视线引导、主体对焦亮圆点、错态实时警告框）
function drawOverlays(ctx, w, h, geom, scene, evalData, opts) {
  const { focusPt, gazeFrom, subFaceBox, rightSide } = geom;
  const layers = opts.layers || { frame: true, depth: true, gaze: true, corners: true, axis: false };
  const pulse = opts.pulse ?? 0;

  // 1. 原海报同款四角荧光青柠 L 形取景角 ┌ ┐ └ ┘
  if (layers.corners !== false) {
    const pad = Math.max(7, Math.min(w, h) * (opts.compact ? 0.045 : 0.032));
    const arm = Math.max(10, Math.min(w, h) * (opts.compact ? 0.085 : 0.056));
    ctx.save();
    ctx.strokeStyle = scene.accent;
    ctx.lineWidth = Math.max(1.5, Math.min(w, h) * (opts.compact ? 0.009 : 0.0044));
    ctx.beginPath();
    // 左上
    ctx.moveTo(pad, pad + arm); ctx.lineTo(pad, pad); ctx.lineTo(pad + arm, pad);
    // 右上
    ctx.moveTo(w - pad - arm, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + arm);
    // 左下
    ctx.moveTo(pad, h - pad - arm); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + arm, h - pad);
    // 右下
    ctx.moveTo(w - pad - arm, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - arm);
    ctx.stroke();
    ctx.restore();
  }

  if (opts.compact) return; // 缩略胶片帧只保留原海报标志性的肩沿亮线和简约外框

  // 2. 虚线视线引导 + 主体对焦亮绿圆点（1:1 复刻原海报）
  if (layers.gaze !== false) {
    const x1 = gazeFrom.u * w;
    const y1 = gazeFrom.v * h;
    const x2 = focusPt.u * w;
    const y2 = focusPt.v * h;
    const blocked = evalData.faceOverlapPct > 1;

    ctx.save();
    ctx.strokeStyle = blocked ? "#F06A4B" : scene.accentBright;
    ctx.lineWidth = Math.max(1.4, w * 0.0024);
    ctx.setLineDash([Math.max(5, w * 0.011), Math.max(4, w * 0.0085)]);
    if (!opts.still && pulse > 0) ctx.lineDashOffset = -pulse * 26;
    ctx.globalAlpha = blocked ? 0.88 : 0.92;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 主体侧脸上的荧光青柠焦核圆点（复刻 305 原海报焦点圆点，非五官）
    const dotR = Math.max(3.6, Math.min(w, h) * 0.0095);
    ctx.fillStyle = blocked ? "#F06A4B" : scene.accentBright;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(x2, y2, dotR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x2, y2, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 景深分层环（当用户点亮「景深关系」探针或景深出错时显示）
  if (layers.depth && opts.showGuideLabels) {
    const x2 = focusPt.u * w;
    const y2 = focusPt.v * h;
    const r = Math.min(w, h) * 0.11;
    ctx.save();
    ctx.strokeStyle = evalData.checks.depthOk ? "rgba(186, 226, 51, 0.45)" : "rgba(240, 106, 75, 0.70)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(x2, y2, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 4. 实时错态视觉标尺（只标出真实发生的几何问题，直接指明哪里错）
  if (!opts.clean) {
    // 4a. 前景遮脸警报框
    if (evalData.faceOverlapPct > 1) {
      const bx = subFaceBox.u0 * w;
      const by = subFaceBox.v0 * h;
      const bw = (subFaceBox.u1 - subFaceBox.u0) * w;
      const bh = (subFaceBox.v1 - subFaceBox.v0) * h;
      ctx.save();
      ctx.fillStyle = "rgba(240, 106, 75, 0.18)";
      ctx.strokeStyle = "#F06A4B";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      // 精简告警条
      const label = `遮挡主体面部 ${evalData.faceOverlapPct}%`;
      drawPillTag(ctx, bx + bw * 0.5, Math.max(36, by - 14), label, "#B52B12", "#FFF4EC", w);
      ctx.restore();
    }

    // 4b. 肩部脱框提示虚影
    if (evalData.shoulderPct < 10) {
      const gx = rightSide ? w * 0.84 : w * 0.16;
      ctx.save();
      ctx.strokeStyle = "rgba(240, 106, 75, 0.78)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.96);
      ctx.quadraticCurveTo(gx + (rightSide ? -w * 0.08 : w * 0.08), h * 0.58, rightSide ? w * 0.98 : w * 0.02, h * 0.45);
      ctx.stroke();
      ctx.setLineDash([]);
      drawPillTag(ctx, gx, h * 0.72, "肩部脱框 · 退成净单人", "#B52B12", "#FFF4EC", w);
      ctx.restore();
    }

    // 4c. 前景过锐提示（只在没有遮脸时单独标出，避免标签打架）
    if (!evalData.checks.depthOk && evalData.faceOverlapPct <= 1 && evalData.shoulderPct >= 10) {
      const tx = rightSide ? w * 0.80 : w * 0.20;
      drawPillTag(ctx, tx, h * 0.68, `前景 f/${geom.fStop.toFixed(1)} 过锐抢戏`, "#B52B12", "#FFF4EC", w);
    }
  }

  // 5. 切镜瞬间的 180° 轴线迷你标记（窄屏自动分行避开碰撞）
  if (opts.showHud) {
    const camLabel = geom.rightSide ? "CAM B · 右肩" : (opts.stateCam === "B" ? "CAM B · 越轴左肩" : "CAM A · 左肩");
    const compactHud = w < 440;
    const hudText = compactHud
      ? `${camLabel}  ${Math.round(geom.focalMm)}MM  f/${geom.fStop.toFixed(1)}`
      : `${camLabel}  ${Math.round(geom.focalMm)}MM  f/${geom.fStop.toFixed(1)}  肩占 ${evalData.shoulderPct}%`;
    ctx.save();
    ctx.font = `600 ${clamp(w * 0.017, 10, 12)}px "Space Mono", monospace`;
    const tw = ctx.measureText(hudText).width + 16;
    const tx = Math.max(18, Math.min(w, h) * 0.064);
    const ty = Math.max(16, Math.min(w, h) * 0.052);
    ctx.fillStyle = "rgba(14, 15, 12, 0.84)";
    ctx.fillRect(tx, ty, tw, 22);
    ctx.strokeStyle = evalData.passCount === 4 ? "rgba(186, 226, 51, 0.5)" : "rgba(240, 106, 75, 0.65)";
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, tw, 22);
    ctx.fillStyle = "#EFE2C5";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, tx + 8, ty + 11.5);
    ctx.restore();

    // 越轴警示浮标：窄屏下错行置于左上角 HUD 正下方，绝不和左侧胶囊撞车
    if (!evalData.checks.axisOk) {
      if (compactHud) {
        drawPillTag(ctx, tx + 54, ty + 38, "180° 反打越轴", "#B52B12", "#FFF4EC", w);
      } else {
        drawPillTag(ctx, w - 76, ty + 11, "180° 反打越轴", "#B52B12", "#FFF4EC", w);
      }
    }
  }
}

function drawPillTag(ctx, cx, cy, text, bg, fg, canvasW) {
  ctx.save();
  const fs = clamp(canvasW * 0.018, 11, 13);
  ctx.font = `700 ${fs}px "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(text).width + 16;
  const th = fs + 10;
  const x = clamp(cx - tw * 0.5, 12, canvasW - tw - 12);
  const y = cy - th * 0.5;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, tw, th);
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 8, y + th * 0.5 + 0.5);
  ctx.restore();
}

// 主渲染入口：给定状态与选项，绘制完整 305 电影帧，并返回当帧单真源评估对象
export function renderOTSFrame(ctx, w, h, state, opts = {}) {
  const aspect = w / Math.max(1, h);
  const evalData = evaluateShot(state, aspect);
  const { geom } = evalData;
  const scene = SCENES[state.scene || "cafe"] || SCENES.cafe;
  const isReverse = state.cam === "B";

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 1. 场景背景与光线
  drawBackdrop(ctx, w, h, geom, scene, isReverse);

  // 2. 远端主体与桌面道具
  drawSubjectAndTable(ctx, w, h, geom, scene);

  // 3. 前景虚化肩部与发光青柠肩脊轮廓
  drawForegroundShoulder(ctx, w, h, geom, scene, evalData, opts);

  // 4. 宽屏绘制柔和径向暗角（手机窄屏由外框轻影承接，避免每帧全画幅软件渐变填充）
  if (w >= 480) {
    const vig = ctx.createRadialGradient(w * 0.52, h * 0.48, Math.min(w, h) * 0.34, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(10, 11, 8, 0.38)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // 5. 切镜瞬间 1-frame 场记暗闪（受 reducedMotion 抑制）
  if (opts.cutFlash > 0.01 && !opts.still) {
    ctx.fillStyle = `rgba(17, 18, 15, ${clamp(opts.cutFlash * 0.85, 0, 0.85)})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 6. 取景角、视线引导、焦核圆点与实时错态标注
  drawOverlays(ctx, w, h, geom, scene, evalData, { ...opts, stateCam: state.cam });

  ctx.restore();
  return evalData;
}

// ---------- Section 01 专用：横向对比刮板 ----------
export function renderWipeCompare(ctx, w, h, wipeT, leftState, rightState, leftTag, rightTag) {
  const splitX = clamp(wipeT, 0.08, 0.92) * w;

  // 右侧整图先绘
  renderOTSFrame(ctx, w, h, rightState, { clean: true, layers: { corners: true, gaze: true, depth: false } });

  // 左侧裁切覆绘（无肩对照时关闭视线虚线，视觉更纯粹）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, h);
  ctx.clip();
  const leftIsSingle = leftState.offset >= 0.85;
  renderOTSFrame(ctx, w, h, leftState, { clean: true, layers: { corners: true, gaze: !leftIsSingle, depth: false } });
  ctx.restore();

  // 中缝荧光青柠刮刀线与把手
  ctx.save();
  ctx.strokeStyle = "#BAE233";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, h);
  ctx.stroke();

  // 圆形拉手
  const cy = h * 0.5;
  ctx.fillStyle = "#11120F";
  ctx.strokeStyle = "#BAE233";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(splitX, cy, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 左右双箭头
  ctx.strokeStyle = "#BAE233";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX - 4, cy - 5); ctx.lineTo(splitX - 9, cy); ctx.lineTo(splitX - 4, cy + 5);
  ctx.moveTo(splitX + 4, cy - 5); ctx.lineTo(splitX + 9, cy); ctx.lineTo(splitX + 4, cy + 5);
  ctx.stroke();

  // 左右角签
  drawPillTag(ctx, 76, 26, leftTag, "rgba(17,18,15,0.88)", "#EFE2C5", w);
  drawPillTag(ctx, w - 76, 26, rightTag, "rgba(17,18,15,0.88)", "#BAE233", w);
  ctx.restore();
}

// ---------- Section 03 专用：俯拍片场 180° 轴线机位图 ----------
export function renderFloorplan(ctx, w, h, { camBMode, focalMm }) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 暗室网格底板
  ctx.fillStyle = "#11120F";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(239, 226, 197, 0.06)";
  ctx.lineWidth = 1;
  const step = Math.max(24, Math.round(w / 18));
  for (let x = step; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = step; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const cx = w * 0.5;
  const axisY = h * 0.48;
  const ax = w * 0.30;
  const bx = w * 0.70;
  const crossed = camBMode === "crossed";

  // 下半区：合法 180° 拍摄半区
  ctx.fillStyle = "rgba(176, 210, 41, 0.08)";
  ctx.fillRect(0, axisY, w, h - axisY);

  // 上半区：越轴禁区
  ctx.fillStyle = crossed ? "rgba(240, 106, 75, 0.12)" : "rgba(240, 106, 75, 0.03)";
  ctx.fillRect(0, 0, w, axisY);

  // 180° 视线轴线
  ctx.strokeStyle = "#BAE233";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(w * 0.06, axisY);
  ctx.lineTo(w * 0.94, axisY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 轴线与半区标签（避开角色 A/B 头像，宽窄屏零重叠）
  ctx.font = `600 11px "Space Mono", monospace`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#BAE233";
  ctx.fillText("180° 视线轴线", 12, 20);
  ctx.textAlign = "right";
  ctx.fillStyle = crossed ? "#F06A4B" : "#BDB39B";
  ctx.fillText(crossed ? "越轴禁区（跳戏）" : "禁越轴区", w - 12, 20);
  ctx.fillStyle = "#BAE233";
  ctx.fillText("180° 守轴合法半区", w - 12, h - 12);
  ctx.textAlign = "left";

  // 咖啡圆桌
  ctx.fillStyle = "#26231C";
  ctx.strokeStyle = "rgba(239, 226, 197, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, axisY, Math.min(w, h) * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 演员 A（左，朝右看）与演员 B（右，朝左看）
  const drawActorTop = (x, y, dir, label) => {
    ctx.save();
    ctx.translate(x, y);
    // 肩部椭圆
    ctx.fillStyle = "#EFE2C5";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // 头部与朝向小鼻尖示意（几何三角形方向标，非五官）
    ctx.fillStyle = "#181A15";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#EFE2C5";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // 朝向箭头
    ctx.fillStyle = "#BAE233";
    ctx.beginPath();
    ctx.moveTo(dir * 18, 0);
    ctx.lineTo(dir * 11, -5);
    ctx.lineTo(dir * 11, 5);
    ctx.closePath();
    ctx.fill();

    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#EFE2C5";
    ctx.textAlign = "center";
    ctx.fillText(label, 0, -28);
    ctx.restore();
  };

  drawActorTop(ax, axisY, 1, "角色 A");
  drawActorTop(bx, axisY, -1, "角色 B");

  // 机位距轴线的远近随焦段伸缩（长焦退远，广角贴近）
  const distScale = lerp(0.76, 1.18, (focalMm - 28) / 57);
  const fovHalf = lerp(0.42, 0.19, (focalMm - 28) / 57); // 弧度半角

  // 机位 A（始终位于下方合法半区，过 A 左肩看 B）
  const camA = { x: ax - w * 0.13 * distScale, y: axisY + h * 0.25 * distScale };

  // 机位 B 按所选模式落位
  let camB;
  if (camBMode === "matched") {
    camB = { x: bx + w * 0.13 * distScale, y: axisY + h * 0.25 * distScale };
  } else if (camBMode === "tight") {
    camB = { x: bx + w * 0.08 * distScale, y: axisY + h * 0.18 * distScale };
  } else if (camBMode === "wide") {
    camB = { x: bx + w * 0.17 * distScale, y: axisY + h * 0.34 * distScale };
  } else {
    // 越轴：翻到轴线上方！
    camB = { x: bx + w * 0.13 * distScale, y: axisY - h * 0.26 * distScale };
  }

  const drawCameraCone = (cam, targetX, targetY, color, tag) => {
    const ang = Math.atan2(targetY - cam.y, targetX - cam.x);
    const len = Math.hypot(targetX - cam.x, targetY - cam.y) * 1.25;
    ctx.save();
    ctx.fillStyle = color === "#BAE233" ? "rgba(186, 226, 51, 0.16)" : "rgba(240, 106, 75, 0.20)";
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.arc(cam.x, cam.y, len, ang - fovHalf, ang + fovHalf);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(ang - fovHalf) * len, cam.y + Math.sin(ang - fovHalf) * len);
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(ang + fovHalf) * len, cam.y + Math.sin(ang + fovHalf) * len);
    ctx.stroke();

    // 摄影机图标方块
    ctx.translate(cam.x, cam.y);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.fillRect(-10, -7, 16, 14);
    ctx.beginPath();
    ctx.moveTo(6, -5); ctx.lineTo(13, -8); ctx.lineTo(13, 8); ctx.lineTo(6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = `700 11px "Space Mono", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(tag, cam.x, cam.y + (cam.y < axisY ? -14 : 22));
    ctx.restore();
  };

  drawCameraCone(camA, bx, axisY, "#BAE233", "CAM A (正打)");
  drawCameraCone(camB, ax, axisY, crossed ? "#F06A4B" : "#BAE233", crossed ? "CAM B (越轴!)" : "CAM B (反打)");

  ctx.restore();
}
