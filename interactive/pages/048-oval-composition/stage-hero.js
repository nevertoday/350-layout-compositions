// 048 椭圆构图 · 开场「椭窗成形与双焦造景台」2D Canvas 渲染与直接操控
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENES, LIMITS, clamp, evaluate } from "./model.js";

const TAU = Math.PI * 2;

function drawStar4(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.28;
    const ang = (i * Math.PI) / 4;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 绘制三种场景的内部风景/肖像（严格剪影侧影，绝不画五官）/青瓷静物
function drawSceneBackdrop(ctx, g, sceneId, state) {
  const sc = SCENES[sceneId];
  const { matX, matY, matW, matH, cx, cy, S } = g;

  // 1. 天空与水色渐变背景（随椭圆自然呼吸）
  const skyGrad = ctx.createLinearGradient(cx, matY, cx, matY + matH);
  skyGrad.addColorStop(0, sc.skyTop);
  skyGrad.addColorStop(0.52, sc.skyMid);
  skyGrad.addColorStop(0.60, sc.lakeTop);
  skyGrad.addColorStop(1, sc.lakeBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(matX - 40, matY - 40, matW + 80, matH + 80);

  if (sceneId === "river") {
    // 柔和月光晕
    const sunX = cx + S * 0.16;
    const sunY = cy - S * 0.16;
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, S * 0.36);
    glow.addColorStop(0, "rgba(255, 249, 240, 0.72)");
    glow.addColorStop(0.45, "rgba(248, 234, 223, 0.32)");
    glow.addColorStop(1, "rgba(248, 234, 223, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(matX - 40, matY - 40, matW + 80, matH + 80);

    const horizonY = cy + S * 0.08;

    // 远山青雾
    ctx.fillStyle = "rgba(154, 179, 173, 0.48)";
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.7, horizonY);
    ctx.bezierCurveTo(cx - S * 0.42, horizonY - S * 0.24, cx - S * 0.18, horizonY - S * 0.34, cx + S * 0.04, horizonY - S * 0.14);
    ctx.bezierCurveTo(cx + S * 0.24, horizonY - S * 0.28, cx + S * 0.48, horizonY - S * 0.16, cx + S * 0.7, horizonY);
    ctx.closePath();
    ctx.fill();

    // 中景主峰（忠实复刻 048 原海报左侧淡墨山形）
    const mGrad = ctx.createLinearGradient(cx - S * 0.3, horizonY - S * 0.35, cx - S * 0.1, horizonY + S * 0.02);
    mGrad.addColorStop(0, "rgba(96, 126, 120, 0.85)");
    mGrad.addColorStop(1, "rgba(148, 176, 170, 0.42)");
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.7, horizonY + 2);
    ctx.quadraticCurveTo(cx - S * 0.36, horizonY - S * 0.28, cx - S * 0.20, horizonY - S * 0.36);
    ctx.quadraticCurveTo(cx - S * 0.06, horizonY - S * 0.26, cx + S * 0.14, horizonY - S * 0.08);
    ctx.quadraticCurveTo(cx + S * 0.36, horizonY - S * 0.22, cx + S * 0.68, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    // 近岸深青松林丘
    ctx.fillStyle = "#164645";
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.7, horizonY + 2);
    ctx.quadraticCurveTo(cx - S * 0.44, horizonY - S * 0.16, cx - S * 0.24, horizonY - S * 0.05);
    ctx.quadraticCurveTo(cx - S * 0.12, horizonY - S * 0.01, cx - S * 0.04, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    // 右远岸低岭
    ctx.fillStyle = "rgba(44, 96, 93, 0.45)";
    ctx.beginPath();
    ctx.moveTo(cx + S * 0.18, horizonY + 2);
    ctx.quadraticCurveTo(cx + S * 0.42, horizonY - S * 0.09, cx + S * 0.68, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    // 水面薄雾与山影倒映
    ctx.fillStyle = "rgba(25, 68, 67, 0.22)";
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.68, horizonY + 2);
    ctx.quadraticCurveTo(cx - S * 0.32, horizonY + S * 0.14, cx - S * 0.04, horizonY + 2);
    ctx.closePath();
    ctx.fill();

    // 细腻水波纹
    ctx.strokeStyle = "rgba(247, 239, 232, 0.32)";
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 9; i++) {
      const ry = horizonY + 12 + i * (S * 0.036);
      const half = S * (0.28 - i * 0.014);
      ctx.beginPath();
      ctx.moveTo(cx - half + (i % 2) * 16, ry);
      ctx.lineTo(cx + half - (i % 3) * 14, ry);
      ctx.stroke();
    }
  } else if (sceneId === "cameo") {
    // 复古椭圆浮雕柔光环
    const halo = ctx.createRadialGradient(cx, cy - S * 0.04, S * 0.04, cx, cy, S * 0.56);
    halo.addColorStop(0, "rgba(255, 248, 245, 0.72)");
    halo.addColorStop(0.65, "rgba(232, 194, 192, 0.26)");
    halo.addColorStop(1, "rgba(83, 48, 70, 0.18)");
    ctx.fillStyle = halo;
    ctx.fillRect(matX - 40, matY - 40, matW + 80, matH + 80);

    // 优雅内细弧装饰
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(g.alpha);
    ctx.strokeStyle = "rgba(255, 250, 247, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(8, g.a - 12), Math.max(8, g.b - 12), 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  } else {
    // 青瓷静物柔光台面
    const tableY = cy + S * 0.17;
    const warm = ctx.createRadialGradient(cx + S * 0.14, cy - S * 0.18, 6, cx, cy, S * 0.58);
    warm.addColorStop(0, "rgba(255, 252, 247, 0.8)");
    warm.addColorStop(1, "rgba(182, 206, 200, 0.12)");
    ctx.fillStyle = warm;
    ctx.fillRect(matX - 40, matY - 40, matW + 80, matH + 80);

    ctx.fillStyle = "rgba(130, 162, 155, 0.26)";
    ctx.fillRect(matX - 40, tableY, matW + 80, matH);
    ctx.strokeStyle = "rgba(45, 111, 106, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(matX - 40, tableY);
    ctx.lineTo(matX + matW + 40, tableY);
    ctx.stroke();
  }
}

// 绘制可拖动的主体元素（孤舟渔人剪影 / 无五官浮雕侧影 / 青瓷长颈瓶）
function drawSubject(ctx, g, sceneId, isAlert, isActive) {
  const { x, y } = g.subjPos;
  const k = clamp(g.S / 440, 0.68, 1.18);

  ctx.save();
  ctx.translate(x, y);

  // 焦位微晕底托
  const haloR = 38 * k;
  const hg = ctx.createRadialGradient(0, 0, 4, 0, 0, haloR);
  hg.addColorStop(0, isAlert ? "rgba(176, 42, 62, 0.22)" : "rgba(255, 250, 245, 0.55)");
  hg.addColorStop(1, "rgba(255, 250, 245, 0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, TAU);
  ctx.fill();

  if (sceneId === "river") {
    // 复刻 048 原海报烟波孤舟与持篙渔人剪影（无五官）
    ctx.fillStyle = "#162A2A";
    // 水影倒映
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 12 * k, 32 * k, 5.5 * k, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 乌篷小舟船身
    ctx.beginPath();
    ctx.moveTo(-36 * k, 1 * k);
    ctx.quadraticCurveTo(-18 * k, 10 * k, 4 * k, 10 * k);
    ctx.quadraticCurveTo(22 * k, 10 * k, 35 * k, 0);
    ctx.quadraticCurveTo(18 * k, 4 * k, -10 * k, 4 * k);
    ctx.closePath();
    ctx.fill();

    // 撑篙人物剪影 + 斗笠（纯轮廓无五官）
    ctx.beginPath();
    ctx.moveTo(2 * k, 4 * k);
    ctx.quadraticCurveTo(4 * k, -7 * k, 9 * k, -11 * k);
    ctx.quadraticCurveTo(13 * k, -8 * k, 13 * k, 4 * k);
    ctx.closePath();
    ctx.fill();
    // 斗笠
    ctx.beginPath();
    ctx.moveTo(0, -11 * k);
    ctx.quadraticCurveTo(9 * k, -18 * k, 18 * k, -11 * k);
    ctx.quadraticCurveTo(9 * k, -10 * k, 0, -11 * k);
    ctx.fill();
    // 竹篙斜入水面
    ctx.strokeStyle = "#162A2A";
    ctx.lineWidth = 1.6 * k;
    ctx.beginPath();
    ctx.moveTo(-14 * k, -18 * k);
    ctx.lineTo(24 * k, 9 * k);
    ctx.stroke();
  } else if (sceneId === "cameo") {
    // 严格无五官古典侧影剪影（发髻 + 颈肩侧轮廓，绝不画眼睛嘴唇）
    ctx.fillStyle = "#3E2136";
    ctx.beginPath();
    // 优雅肩颈基底
    ctx.moveTo(-26 * k, 28 * k);
    ctx.quadraticCurveTo(-24 * k, 12 * k, -9 * k, 8 * k);
    ctx.lineTo(-8 * k, -2 * k);
    // 后脑与高发髻
    ctx.bezierCurveTo(-19 * k, -5 * k, -22 * k, -18 * k, -13 * k, -26 * k);
    ctx.arc(-16 * k, -22 * k, 6 * k, Math.PI * 0.6, Math.PI * 1.9);
    // 额头顺滑微弧侧影（抽象无五官细节）
    ctx.bezierCurveTo(-2 * k, -33 * k, 11 * k, -27 * k, 12 * k, -14 * k);
    ctx.bezierCurveTo(13 * k, -4 * k, 10 * k, 3 * k, 5 * k, 7 * k);
    ctx.quadraticCurveTo(22 * k, 12 * k, 26 * k, 28 * k);
    ctx.closePath();
    ctx.fill();
    // 细金枝点缀领口
    ctx.strokeStyle = "#D8727B";
    ctx.lineWidth = 1.5 * k;
    ctx.beginPath();
    ctx.arc(0, 26 * k, 26 * k, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  } else {
    // 青瓷长颈梅瓶与一枝紫梅
    // 阴影
    ctx.fillStyle = "rgba(30, 75, 73, 0.22)";
    ctx.beginPath();
    ctx.ellipse(2 * k, 30 * k, 20 * k, 5 * k, 0, 0, TAU);
    ctx.fill();
    // 紫梅枝
    ctx.strokeStyle = "#48263E";
    ctx.lineWidth = 1.7 * k;
    ctx.beginPath();
    ctx.moveTo(0, -14 * k);
    ctx.quadraticCurveTo(12 * k, -30 * k, 24 * k, -34 * k);
    ctx.moveTo(8 * k, -24 * k);
    ctx.quadraticCurveTo(4 * k, -34 * k, -6 * k, -38 * k);
    ctx.stroke();
    ctx.fillStyle = "#D8727B";
    for (const [bx, by, br] of [[24, -34, 4.2], [15, -28, 3.2], [-6, -38, 3.8], [3, -33, 2.8]]) {
      ctx.beginPath();
      ctx.arc(bx * k, by * k, br * k, 0, TAU);
      ctx.fill();
    }
    // 瓷瓶身
    const vg = ctx.createLinearGradient(-16 * k, 0, 16 * k, 0);
    vg.addColorStop(0, "#1D5753");
    vg.addColorStop(0.42, "#5D9892");
    vg.addColorStop(1, "#2A6661");
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.moveTo(-6 * k, -18 * k);
    ctx.lineTo(6 * k, -18 * k);
    ctx.bezierCurveTo(6 * k, -6 * k, 18 * k, -2 * k, 17 * k, 12 * k);
    ctx.bezierCurveTo(16 * k, 24 * k, 11 * k, 29 * k, 8 * k, 30 * k);
    ctx.lineTo(-8 * k, 30 * k);
    ctx.bezierCurveTo(-11 * k, 29 * k, -16 * k, 24 * k, -17 * k, 12 * k);
    ctx.bezierCurveTo(-18 * k, -2 * k, -6 * k, -6 * k, -6 * k, -18 * k);
    ctx.closePath();
    ctx.fill();
  }

  // 可拖动微环提示（仅在告警或选中态明显）
  ctx.strokeStyle = isAlert ? "#B02A3E" : isActive ? "#2D6F6A" : "rgba(59, 33, 54, 0.32)";
  ctx.lineWidth = isAlert || isActive ? 1.8 : 1;
  ctx.setLineDash(isAlert ? [4, 3] : [3, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 34 * k, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

// 绘制可拖动的配重标题块（「主体焦点」及三行说明，复刻原海报）
function drawCopyBlock(ctx, g, sceneId, isAlert, isActive) {
  const sc = SCENES[sceneId];
  const { x, y } = g.copyPos;
  const k = clamp(g.S / 440, 0.72, 1.12);
  const titleSize = Math.round(18 * k);
  const lineSize = Math.round(11 * k);
  const boxW = Math.round(138 * k);
  const boxH = Math.round(74 * k);

  ctx.save();
  ctx.translate(x, y);

  // 轻薄宣纸护底，确保任何背景下文字都极其清晰
  ctx.fillStyle = isAlert ? "rgba(255, 240, 242, 0.88)" : "rgba(253, 246, 241, 0.78)";
  ctx.strokeStyle = isAlert ? "#B02A3E" : isActive ? "#D8727B" : "rgba(216, 114, 123, 0.35)";
  ctx.lineWidth = isAlert || isActive ? 1.6 : 1;
  ctx.beginPath();
  ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const tx = -boxW / 2 + 11 * k;
  const ty = -boxH / 2 + 9 * k;

  ctx.fillStyle = isAlert ? "#8F1E31" : "#3B2136";
  ctx.font = `700 ${titleSize}px "Noto Serif SC", serif`;
  ctx.fillText(sc.copyTitle, tx, ty);

  ctx.fillStyle = "#5A4254";
  ctx.font = `400 ${lineSize}px "LXGW WenKai", "Noto Serif SC", serif`;
  sc.copyLines.forEach((line, idx) => {
    ctx.fillText(line, tx, ty + (titleSize + 6) + idx * (lineSize + 3.5));
  });

  ctx.restore();
}

// 复刻 048 原海报左下紫梅枝叶与青灰雾石
function drawBotanicalFlourish(ctx, g) {
  const { cx, cy, a, b, alpha, S } = g;
  const k = clamp(S / 460, 0.65, 1.12);

  // 左下点位（随椭圆外接盒自然贴附）
  const lx = cx - g.halfW * 0.78;
  const ly = cy + g.halfH * 0.74;

  // 柔和青灰鹅卵石雾块（左下 + 右下，完全复刻 048 原海报）
  ctx.save();
  ctx.fillStyle = "rgba(168, 194, 190, 0.56)";
  ctx.beginPath();
  ctx.ellipse(cx - g.halfW * 0.42, cy + g.halfH * 0.96, 62 * k, 18 * k, 0.08, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "rgba(184, 206, 201, 0.50)";
  ctx.beginPath();
  ctx.ellipse(cx + g.halfW * 0.52, cy + g.halfH * 0.90, 56 * k, 16 * k, -0.22, 0, TAU);
  ctx.fill();

  // 两枚小青圆点
  ctx.fillStyle = "#588C87";
  ctx.beginPath();
  ctx.arc(lx - 18 * k, ly + 18 * k, 7.5 * k, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(176, 196, 193, 0.72)";
  ctx.beginPath();
  ctx.arc(cx + g.halfW * 1.06, cy - g.halfH * 0.04, 7 * k, 0, TAU);
  ctx.fill();

  // 紫梅枝叶（精准复刻 048 原海报左下角枝叶母题）
  ctx.translate(lx + 24 * k, ly + 16 * k);
  ctx.rotate(-0.18);
  ctx.strokeStyle = "#3E2136";
  ctx.lineWidth = 1.6 * k;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18 * k, -26 * k, -30 * k, -66 * k);
  ctx.stroke();

  const leaves = [
    [-12, -14, -1.9, 13, 5.2],
    [-18, -32, -2.2, 15, 5.6],
    [-26, -52, -2.0, 14, 5.2],
    [-10, -28, -0.5, 13, 5.0],
    [-20, -48, -0.6, 14, 5.0],
  ];
  ctx.fillStyle = "#3E2136";
  for (const [px, py, rot, rx, ry] of leaves) {
    ctx.save();
    ctx.translate(px * k, py * k);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(rx * k * 0.65, 0, rx * k, ry * k, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// 绘制硬角干扰块（marginMode === "cut" 时的错态视觉证据）
function drawHardCornerNoise(ctx, g) {
  const { matX, matY, matW, matH } = g;
  const bw = Math.round(g.S * 0.17);
  const bh = Math.round(g.S * 0.11);
  ctx.save();
  ctx.fillStyle = "rgba(176, 42, 62, 0.14)";
  ctx.strokeStyle = "#B02A3E";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 3]);
  const rects = [
    [matX + 8, matY + 8, bw, bh],
    [matX + matW - bw - 8, matY + 8, bw, bh],
    [matX + 8, matY + matH - bh - 8, bw, bh],
    [matX + matW - bw - 8, matY + matH - bh - 8, bw, bh],
  ];
  for (const [rx, ry, rw, rh] of rects) {
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);
  }
  ctx.setLineDash([]);
  ctx.fillStyle = "#9D2134";
  ctx.font = `700 11px "Chivo", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("× 硬角切框", matX + 8 + bw / 2, matY + matH - bh / 2 - 8);
  ctx.fillText("× 破形干扰", matX + matW - bw / 2 - 8, matY + matH - bh / 2 - 8);
  ctx.restore();
}

// 绘制两段原海报招牌珊瑚导流虚弧（含起点圆点与终点箭头）
function drawOuterFlowArcs(ctx, g, highlightFlow) {
  const { cx, cy, a, b, alpha } = g;
  const oa = a + 20;
  const ob = b + 20;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(alpha);

  const drawArcWithArrow = (startAng, endAng) => {
    ctx.strokeStyle = highlightFlow ? "#A83B48" : "#D8727B";
    ctx.lineWidth = highlightFlow ? 2.2 : 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 0, oa, ob, 0, startAng, endAng);
    ctx.stroke();
    ctx.setLineDash([]);

    // 起点小圆点
    const sx = Math.cos(startAng) * oa;
    const sy = Math.sin(startAng) * ob;
    ctx.fillStyle = highlightFlow ? "#A83B48" : "#D8727B";
    ctx.beginPath();
    ctx.arc(sx, sy, 3.8, 0, TAU);
    ctx.fill();

    // 终点小箭头（沿椭圆精确切线方向）
    const ex = Math.cos(endAng) * oa;
    const ey = Math.sin(endAng) * ob;
    const tx = -Math.sin(endAng) * oa;
    const ty = Math.cos(endAng) * ob;
    const tang = Math.atan2(ty, tx);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(tang);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawArcWithArrow(-Math.PI * 0.88, -Math.PI * 0.34);
  drawArcWithArrow(Math.PI * 0.14, Math.PI * 0.66);
  ctx.restore();
}

export function mountHeroStage(canvas, { getState, setState, onChange }) {
  const ctx = canvas.getContext("2d");
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgKey = "";
  let cssW = 640;
  let cssH = 500;
  let dpr = 1;
  let hoverTarget = null;
  let activeLayer = null; // 点左栏五圆徽时短暂高亮对应几何层
  let flowTime = -1;      // >= 0 表示正在演播视线流
  let dirty = true;       // 脏标记：静置时不空耗重绘，交互/视线流/尺寸变化时满帧重画

  // 拖动状态
  let drag = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(260, Math.round(rect.width));
    const nextH = Math.max(240, Math.round(rect.height));
    const nextDpr = pixelRatio(window.innerWidth <= 900 ? 1.5 : 2);
    const changed = nextW !== cssW || nextH !== cssH || nextDpr !== dpr;
    cssW = nextW;
    cssH = nextH;
    dpr = nextDpr;
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
    return changed;
  }
  resize();

  function ensureBackdrop(g, sceneId, state) {
    const key = `${sceneId}:${cssW}x${cssH}@${dpr}`;
    if (key === bgKey) return;
    bgKey = key;
    bgCanvas.width = Math.round(cssW * dpr);
    bgCanvas.height = Math.round(cssH * dpr);
    bgCtx.save();
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, cssW, cssH);
    drawSceneBackdrop(bgCtx, g, sceneId, state);
    bgCtx.restore();
  }

  function pointerPos(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function hitTest(x, y, state) {
    const ev = evaluate(state, cssW, cssH);
    const g = ev.g;
    if (Math.hypot(x - g.subjPos.x, y - g.subjPos.y) <= 40) return "subj";
    if (Math.hypot(x - g.copyPos.x, y - g.copyPos.y) <= 58) return "copy";
    if (Math.hypot(x - g.crownPos.x, y - g.crownPos.y) <= 26) return "crown";
    return "canvas";
  }

  function drawFrame(t, dt, { still }) {
    if (resize()) {
      dirty = true;
      onChange();
    }
    if (flowTime >= 0) {
      flowTime += dt || 0.016;
      if (flowTime > 4.2) flowTime = -1;
      dirty = true;
    }
    if (!dirty && !still) return;
    dirty = false;

    const state = getState();
    const res = evaluate(state, cssW, cssH);
    const g = res.g;
    ensureBackdrop(g, state.scene, state);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // 瓷宣纸底
    ctx.fillStyle = "#FCEFE8";
    ctx.fillRect(0, 0, cssW, cssH);

    // 淡雅外框画纸裁切界（体现画幅边界，供真实检验切边）
    ctx.fillStyle = "#FFF8F4";
    ctx.fillRect(g.matX, g.matY, g.matW, g.matH);
    ctx.strokeStyle = res.isClipped ? "rgba(176, 42, 62, 0.55)" : "rgba(216, 114, 123, 0.34)";
    ctx.lineWidth = res.isClipped ? 1.5 : 1;
    ctx.strokeRect(g.matX + 0.5, g.matY + 0.5, g.matW - 1, g.matH - 1);

    // 裁切至画幅 mat 内，这样超出的椭圆真的被直框削平！
    ctx.save();
    ctx.beginPath();
    ctx.rect(g.matX, g.matY, g.matW, g.matH);
    ctx.clip();

    // 1. 顺形柔桃偏移背影与紫梅枝叶（仅顺形模式出现）
    if (state.marginMode === "curved") {
      ctx.save();
      ctx.translate(g.cx + g.S * 0.055, g.cy - g.S * 0.025);
      ctx.rotate(g.alpha + 0.14);
      ctx.fillStyle = "rgba(245, 201, 198, 0.72)";
      ctx.beginPath();
      ctx.ellipse(0, 0, g.a * 0.96, g.b * 0.96, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      drawBotanicalFlourish(ctx, g);
    } else {
      drawHardCornerNoise(ctx, g);
    }

    // 2. 深紫梅新月厚沿（忠实复刻 048 原海报右侧厚边弧）
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.alpha);
    ctx.fillStyle = "#512D46";
    ctx.beginPath();
    ctx.ellipse(4.5, 2.5, g.a + 5.5, g.b + 5.5, 0, 0, TAU);
    ctx.fill();
    // 柔白内垫圈
    ctx.fillStyle = "#FCEFE8";
    ctx.beginPath();
    ctx.ellipse(0, 0, g.a + 2.5, g.b + 2.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 3. 椭圆裁剪窗内部世界（使用离屏缓存背景，确保慢速软渲染拖移仍稳居 50–60 帧）
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy, g.a, g.b, g.alpha, 0, TAU);
    ctx.clip();

    ctx.drawImage(bgCanvas, 0, 0, cssW, cssH);

    // 可选：椭圆内部双焦几何辅助线（长短轴 + 真实数学焦点 F1/F2）
    if (state.showGuides || activeLayer === "foci" || activeLayer === "axes") {
      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.rotate(g.alpha);

      // 长短轴极细虚线
      ctx.strokeStyle = activeLayer === "axes" ? "rgba(64, 40, 63, 0.65)" : "rgba(64, 40, 63, 0.28)";
      ctx.lineWidth = activeLayer === "axes" ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(-g.a * 0.94, 0);
      ctx.lineTo(g.a * 0.94, 0);
      ctx.moveTo(0, -g.b * 0.92);
      ctx.lineTo(0, g.b * 0.92);
      ctx.stroke();
      ctx.setLineDash([]);

      // 推荐双焦柔圈（视觉舒适区）
      const fx = g.visualFocalU * g.a;
      for (const sign of [-1, 1]) {
        ctx.strokeStyle = res.focusOk ? "rgba(45, 111, 106, 0.42)" : "rgba(216, 114, 123, 0.58)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sign * fx, 0, Math.min(26, g.b * 0.24), 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // 真实数学焦点 F1 / F2 星标
      for (const [pt, lbl] of [[g.f1, "F1"], [g.f2, "F2"]]) {
        drawStar4(ctx, pt.x, pt.y, 6, "#B64855");
        ctx.fillStyle = "#6E2331";
        ctx.font = `700 10px "Chivo", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(lbl, pt.x, pt.y - 8);
      }
    }

    // 绘制主体与配重标题块
    const subjAlert = res.subjDeadCenter || res.subjRimHit || res.pairCollide || res.sameSide;
    const copyAlert = res.copyRimHit || res.pairCollide || res.sameSide;
    drawSubject(ctx, g, state.scene, subjAlert, hoverTarget === "subj" || drag?.kind === "subj");
    drawCopyBlock(ctx, g, state.scene, copyAlert, hoverTarget === "copy" || drag?.kind === "copy");

    // 如果主体与标题发生碰撞，画一条清晰的警示连线
    if (res.pairCollide) {
      ctx.strokeStyle = "#B02A3E";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(g.subjPos.x, g.subjPos.y);
      ctx.lineTo(g.copyPos.x, g.copyPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore(); // 结束椭圆内部裁剪

    // 4. 外圈珊瑚描边环
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.alpha);
    ctx.strokeStyle = res.isClipped || res.tooRound || res.tooNeedle ? "#B02A3E" : "#D8727B";
    ctx.lineWidth = activeLayer === "contour" || activeLayer === "margin" ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.a + 10, g.b + 10, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // 5. 原海报招牌珊瑚双导流虚弧（顺形模式下绘制）
    if (state.marginMode === "curved") {
      drawOuterFlowArcs(ctx, g, activeLayer === "flow" || flowTime >= 0);
    }

    // 6. 长轴端塑形调柄（直观提示可直接拖拽改变长短轴比例与倾角）
    const cp = g.crownPos;
    const crownInMat = cp.x > g.matX + 8 && cp.x < g.matX + g.matW - 8 && cp.y > g.matY + 8 && cp.y < g.matY + g.matH - 8;
    const hx = crownInMat ? cp.x : clamp(cp.x, g.matX + 18, g.matX + g.matW - 18);
    const hy = crownInMat ? cp.y : clamp(cp.y, g.matY + 18, g.matY + g.matH - 18);
    ctx.save();
    ctx.fillStyle = hoverTarget === "crown" || drag?.kind === "crown" ? "#3B2136" : "#FFF8F4";
    ctx.strokeStyle = "#B64855";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 8, 0, TAU);
    ctx.fill();
    ctx.stroke();
    drawStar4(ctx, hx, hy, 4.2, hoverTarget === "crown" || drag?.kind === "crown" ? "#FCEFE8" : "#B64855");
    ctx.restore();

    // 7. 演播视线流丝带光点（若切边破环则在切口处直接断流滑出！）
    if (flowTime >= 0) {
      const p = (flowTime % 3.2) / 3.2;
      ctx.save();
      const trailN = 18;
      for (let i = 0; i < trailN; i++) {
        const u = p - i * 0.012;
        if (u < 0) continue;
        const ang = -Math.PI * 0.85 + u * TAU * 1.15;
        let px = g.cx + Math.cos(ang) * (g.a + 14) * g.cosA - Math.sin(ang) * (g.b + 14) * g.sinA;
        let py = g.cy + Math.cos(ang) * (g.a + 14) * g.sinA + Math.sin(ang) * (g.b + 14) * g.cosA;
        // 切边破环时：冲出边界后沿切线漂移并泛红示警
        const outOfMat = px < g.matX + 4 || px > g.matX + g.matW - 4 || py < g.matY + 4 || py > g.matY + g.matH - 4;
        const alphaDot = (1 - i / trailN) * (outOfMat ? 0.55 : 0.92);
        ctx.fillStyle = outOfMat || res.isClipped ? `rgba(176, 42, 62, ${alphaDot})` : `rgba(45, 111, 106, ${alphaDot})`;
        ctx.beginPath();
        ctx.arc(clamp(px, g.matX + 3, g.matX + g.matW - 3), clamp(py, g.matY + 3, g.matY + g.matH - 3), (1 - i / trailN) * 6 + 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore(); // 结束画幅 mat 裁剪

    // 8. 切边破环警示标注（直接标在真实发生裁切的边上）
    if (res.isClipped) {
      ctx.save();
      ctx.strokeStyle = "#B02A3E";
      ctx.lineWidth = 3;
      if (g.clippedSides.top) {
        ctx.beginPath();
        ctx.moveTo(g.cx - 72, g.matY + 1);
        ctx.lineTo(g.cx + 72, g.matY + 1);
        ctx.stroke();
      }
      if (g.clippedSides.bottom) {
        ctx.beginPath();
        ctx.moveTo(g.cx - 72, g.matY + g.matH - 1);
        ctx.lineTo(g.cx + 72, g.matY + g.matH - 1);
        ctx.stroke();
      }
      if (g.clippedSides.left) {
        ctx.beginPath();
        ctx.moveTo(g.matX + 1, g.cy - 60);
        ctx.lineTo(g.matX + 1, g.cy + 60);
        ctx.stroke();
      }
      if (g.clippedSides.right) {
        ctx.beginPath();
        ctx.moveTo(g.matX + g.matW - 1, g.cy - 60);
        ctx.lineTo(g.matX + g.matW - 1, g.cy + 60);
        ctx.stroke();
      }
      // 醒目切口浮签（固定放在底部居中，避免和左上角实时轴比印记互相碰触）
      const badgeW = 148;
      const badgeH = 24;
      const bx = g.cx - badgeW / 2;
      const by = g.matY + g.matH - badgeH - 8;
      ctx.fillStyle = "#B02A3E";
      ctx.beginPath();
      ctx.roundRect(bx, by, badgeW, badgeH, 12);
      ctx.fill();
      ctx.fillStyle = "#FFF9F6";
      ctx.font = `700 11px "Chivo", "Noto Serif SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`× 弧顶被裁 −${Math.max(1, Math.round(g.clipPx))}px`, g.cx, by + badgeH / 2);
      ctx.restore();
    }

    // 9. 左上角极轻画布实测印记（与诊单完全同源）
    ctx.save();
    ctx.fillStyle = "rgba(252, 239, 232, 0.86)";
    ctx.beginPath();
    ctx.roundRect(g.matX + 10, g.matY + 10, 148, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#3B2136";
    ctx.font = `600 11px "Chivo", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${g.ratio.toFixed(2)}:1 · ${Math.round(g.tiltDeg)}° · e=${g.e.toFixed(2)}`, g.matX + 20, g.matY + 22);
    ctx.restore();

    ctx.restore();
  }

  const ctl = loop(canvas, drawFrame);

  // ---------- 指针与触屏交互（保证手机竖滑不卡页面、横拖及拖主体 60fps 跟手） ----------
  let touchStart = null;
  let touchLocked = false;

  function applyDrag(px, py) {
    if (!drag) return;
    const state = getState();
    const g = evaluate(state, cssW, cssH).g;

    if (drag.kind === "subj") {
      let loc = g.toLocal(px, py);
      // 接近视觉焦点 F1 / F2 时轻柔吸附
      for (const sgn of [-1, 1]) {
        if (Math.hypot(loc.u - sgn * g.visualFocalU, loc.v) < 0.08) {
          loc = { u: sgn * g.visualFocalU, v: 0.04 * (sgn < 0 ? 1 : -1) };
        }
      }
      const r = Math.hypot(loc.u, loc.v);
      if (r > 0.92) {
        loc.u = (loc.u / r) * 0.92;
        loc.v = (loc.v / r) * 0.92;
      }
      setState({ subj: { u: +loc.u.toFixed(3), v: +loc.v.toFixed(3) } });
    } else if (drag.kind === "copy") {
      let loc = g.toLocal(px, py);
      for (const sgn of [-1, 1]) {
        if (Math.hypot(loc.u - sgn * g.visualFocalU, loc.v) < 0.08) {
          loc = { u: sgn * g.visualFocalU, v: -0.05 };
        }
      }
      const r = Math.hypot(loc.u, loc.v);
      if (r > 0.90) {
        loc.u = (loc.u / r) * 0.90;
        loc.v = (loc.v / r) * 0.90;
      }
      setState({ copy: { u: +loc.u.toFixed(3), v: +loc.v.toFixed(3) } });
    } else if (drag.kind === "crown") {
      const dx = px - g.cx;
      const dy = py - g.cy;
      const dist = Math.hypot(dx, dy);
      const angDeg = clamp((-Math.atan2(dy, dx) * 180) / Math.PI, LIMITS.tiltMin, LIMITS.tiltMax);
      const ratioEst = clamp(Math.pow(dist / Math.max(40, g.S * 0.425 * state.scale), 2), LIMITS.ratioMin, LIMITS.ratioMax);
      setState({
        ratio: +ratioEst.toFixed(2),
        tilt: Math.round(angDeg),
      });
    } else if (drag.kind === "canvas") {
      // 开放区横拖：同时顺滑调整椭圆长短轴比例与倾角（让桌面与触屏 perf 横拖都有清晰实时反馈）
      const deltaX = px - drag.startX;
      const deltaY = py - drag.startY;
      const nextRatio = clamp(drag.startRatio + (deltaX / Math.max(160, cssW * 0.55)) * 0.95, LIMITS.ratioMin, LIMITS.ratioMax);
      const nextTilt = clamp(drag.startTilt + (deltaX / Math.max(160, cssW * 0.6)) * 42 - (deltaY / Math.max(160, cssH * 0.6)) * 28, LIMITS.tiltMin, LIMITS.tiltMax);
      setState({
        ratio: +nextRatio.toFixed(2),
        tilt: Math.round(nextTilt),
      });
    }
    onChange();
    dirty = true;
    if (reducedMotion.matches) ctl.draw();
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "touch") return; // 触屏交由下方 touch 处理器区分竖滑与横拖
    const { x, y } = pointerPos(ev);
    const st = getState();
    const kind = hitTest(x, y, st);
    drag = { kind, startX: x, startY: y, startRatio: st.ratio, startTilt: st.tilt };
    canvas.setPointerCapture(ev.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (ev.pointerType === "touch") return;
    const { x, y } = pointerPos(ev);
    if (drag) {
      applyDrag(x, y);
    } else {
      const hit = hitTest(x, y, getState());
      if (hit !== hoverTarget) {
        hoverTarget = hit;
        canvas.style.cursor = hit === "canvas" ? "ew-resize" : "grab";
        dirty = true;
        ctl.draw();
      }
    }
  });

  const endPointer = () => {
    drag = null;
    canvas.style.cursor = hoverTarget && hoverTarget !== "canvas" ? "grab" : "ew-resize";
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // 触屏：点到明确把手/主体立即接管；点空白区则只接管横向拖，竖向留给页面原生滚动
  canvas.addEventListener("touchstart", (ev) => {
    if (ev.touches.length !== 1) return;
    const t0 = ev.touches[0];
    const r = canvas.getBoundingClientRect();
    const x = t0.clientX - r.left;
    const y = t0.clientY - r.top;
    const st = getState();
    const kind = hitTest(x, y, st);
    touchStart = { x, y, kind, startRatio: st.ratio, startTilt: st.tilt };
    touchLocked = kind !== "canvas";
    if (touchLocked) {
      drag = { kind, startX: x, startY: y, startRatio: st.ratio, startTilt: st.tilt };
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (ev) => {
    if (!touchStart || ev.touches.length !== 1) return;
    const t0 = ev.touches[0];
    const r = canvas.getBoundingClientRect();
    const x = t0.clientX - r.left;
    const y = t0.clientY - r.top;
    const dx = Math.abs(x - touchStart.x);
    const dy = Math.abs(y - touchStart.y);

    if (!touchLocked) {
      if (dx > 6 && dx > dy * 1.15) {
        touchLocked = true;
        drag = {
          kind: "canvas",
          startX: touchStart.x,
          startY: touchStart.y,
          startRatio: touchStart.startRatio,
          startTilt: touchStart.startTilt,
        };
      } else if (dy > 8 && dy > dx) {
        touchStart = null; // 放行竖向滚动
        return;
      } else {
        return;
      }
    }
    if (ev.cancelable) ev.preventDefault();
    applyDrag(x, y);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchStart = null;
    touchLocked = false;
    drag = null;
  }, { passive: true });

  window.addEventListener("resize", () => {
    dirty = true;
    ctl.draw();
  });

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    triggerFlow: () => {
      flowTime = 0;
      dirty = true;
      ctl.draw();
    },
    setActiveLayer: (layer) => {
      activeLayer = activeLayer === layer ? null : layer;
      dirty = true;
      ctl.draw();
    },
    getSize: () => ({ width: cssW, height: cssH }),
  };
}
