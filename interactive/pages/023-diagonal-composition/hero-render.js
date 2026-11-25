// 023 对角线构图 · 开场「斜轨导引与配重调度台」高精度 2D Canvas 渲染器
// 所有视觉元素、角度、节点尺寸、配重锚点与质心标靶均严格从 model.js 实算结果渲染，零写死、零 shadowBlur 性能黑洞。

import { EXP_BOUNDS, SCENES } from "./model.js";

const COLORS = {
  porcelain: "#F7F6F1",
  mistSky: "#D9E7DB",
  mistSkyTop: "#EEF4EE",
  emerald: "#04583B",
  emeraldDark: "#063626",
  tunnel: "#07241B",
  railBright: "#127D57",
  yellow: "#F9C80E",
  yellowDeep: "#E5AF00",
  white: "#FFFFFF",
  red: "#D63A2C",
  redSoft: "rgba(214, 58, 44, 0.22)",
  ok: "#16A66E",
  okBright: "#7BF0B8",
  ink: "#0B1F13",
};

// 返回画布像素坐标下的两个可交互句柄（供命中检测和绘制共用，单一坐标真源）
export function getHandles(ev, w, h) {
  const { seg, cwPos } = ev;
  // 斜角箭柄放在主斜轨前段靠出口 78% 处，远离边缘与顶部 HUD
  const tArrow = seg.tMin + (seg.tMax - seg.tMin) * 0.78;
  const ax = (seg.cu + tArrow * seg.du) * w;
  const ay = (seg.cv + tArrow * seg.dv) * h;

  const cwx = cwPos.u * w;
  const cwy = cwPos.v * h;

  return {
    arrow: { x: Math.max(36, Math.min(w - 36, ax)), y: Math.max(46, Math.min(h - 36, ay)), r: 24 },
    cw: { x: cwx, y: cwy, r: 26 },
  };
}

let cachedSkyGrad = null;
let cachedTrackGrad = null;
let cachedGradW = 0;
let cachedGradH = 0;

function getGradients(ctx, w, h) {
  if (cachedGradW !== w || cachedGradH !== h) {
    const sg = ctx.createLinearGradient(0, 0, w, h * 0.7);
    sg.addColorStop(0, COLORS.porcelain);
    sg.addColorStop(0.55, COLORS.mistSkyTop);
    sg.addColorStop(1, COLORS.mistSky);
    cachedSkyGrad = sg;

    const tg = ctx.createLinearGradient(0, h, w, 0);
    tg.addColorStop(0, COLORS.tunnel);
    tg.addColorStop(0.5, COLORS.emerald);
    tg.addColorStop(1, COLORS.railBright);
    cachedTrackGrad = tg;

    cachedGradW = w;
    cachedGradH = h;
  }
  return { skyGrad: cachedSkyGrad, trackGrad: cachedTrackGrad };
}

function drawSpeedLines(ctx, w, h, seg, phase, isValid, alphaMul = 1) {
  const diag = Math.hypot(w, h);
  const cx = seg.cu * w;
  const cy = seg.cv * h;
  const vx = Math.cos(seg.rad);
  const vy = -Math.sin(seg.rad);
  const nx = -vy;
  const ny = vx;

  const offsets = [-0.24, -0.11, 0.10, 0.23];
  const minSide = Math.min(w, h);
  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i] * minSide;
    const ox = cx + nx * off;
    const oy = cy + ny * off;
    const speed = (isValid ? 1.0 : 0.25) * (0.75 + (i % 2) * 0.35);
    const shift = ((phase * 220 * speed + i * 137) % (diag * 1.05)) - diag * 0.52;
    const len = diag * (isValid ? 0.26 : 0.14);

    ctx.beginPath();
    ctx.moveTo(ox + vx * shift, oy + vy * shift);
    ctx.lineTo(ox + vx * (shift + len), oy + vy * (shift + len));
    ctx.strokeStyle = i % 2 === 0
      ? `rgba(255,255,255,${(isValid ? 0.42 : 0.16) * alphaMul})`
      : `rgba(249,200,14,${(isValid ? 0.38 : 0.12) * alphaMul})`;
    ctx.lineWidth = i % 2 === 0 ? 1.6 : 1.2;
    ctx.stroke();
  }
}

// 场景 1：023 原海报同源高速铁道与流线动车
function drawTrainScene(ctx, w, h, ev, t, still) {
  const { seg, isAscending, nodes, cwPos, mainPos, passCount } = ev;
  const minSide = Math.min(w, h);
  const vx = Math.cos(seg.rad);
  const vy = -Math.sin(seg.rad);
  const nx = -vy;
  const ny = vx;
  const cx = seg.cu * w;
  const cy = seg.cv * h;
  const far = Math.hypot(w, h) * 0.72;
  const { skyGrad, trackGrad } = getGradients(ctx, w, h);

  // 1. 净瓷白到雾青绿天幕底
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. 远景城市天际线剪影（合并路径减少绘制调用）
  const skylineY = h * 0.44;
  ctx.fillStyle = "rgba(18, 92, 66, 0.16)";
  ctx.beginPath();
  const towers = [
    [0.08, 0.05, 0.10], [0.14, 0.04, 0.16], [0.20, 0.06, 0.08],
    [0.54, 0.045, 0.14], [0.60, 0.035, 0.24], [0.65, 0.05, 0.18],
    [0.72, 0.04, 0.12], [0.78, 0.06, 0.20], [0.86, 0.05, 0.11],
  ];
  for (const [tx, tw, th] of towers) {
    ctx.rect(tx * w, skylineY - th * h, tw * w, th * h + h * 0.25);
  }
  ctx.fill();

  // 3. 斜切翡翠疾行绿轨床带
  const bandTop = -minSide * 0.15;
  const bandBot = minSide * 0.17;
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * bandTop, cy - vy * far + ny * bandTop);
  ctx.lineTo(cx + vx * far + nx * bandTop, cy + vy * far + ny * bandTop);
  ctx.lineTo(cx + vx * far + nx * bandBot, cy + vy * far + ny * bandBot);
  ctx.lineTo(cx - vx * far + nx * bandBot, cy - vy * far + ny * bandBot);
  ctx.closePath();
  ctx.fillStyle = trackGrad;
  ctx.fill();

  // 下半部深翡翠绿楔形背景
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * bandBot, cy - vy * far + ny * bandBot);
  ctx.lineTo(cx + vx * far + nx * bandBot, cy + vy * far + ny * bandBot);
  ctx.lineTo(cx + vx * far + nx * far, cy + vy * far + ny * far);
  ctx.lineTo(cx - vx * far + nx * far, cy - vy * far + ny * far);
  ctx.closePath();
  ctx.fillStyle = COLORS.emeraldDark;
  ctx.fill();

  // 轨床内部精细速度铁轨白线（合并次要轨道线）
  ctx.beginPath();
  for (const o of [-0.11, 0.02, 0.085]) {
    const oo = o * minSide;
    ctx.moveTo(cx - vx * far + nx * oo, cy - vy * far + ny * oo);
    ctx.lineTo(cx + vx * far + nx * oo, cy + vy * far + ny * oo);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const mainRailOff = -0.05 * minSide;
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * mainRailOff, cy - vy * far + ny * mainRailOff);
  ctx.lineTo(cx + vx * far + nx * mainRailOff, cy + vy * far + ny * mainRailOff);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 4. 标志性「高铁信号亮黄」主斜导引宽带
  const yStart = minSide * 0.11;
  const yEnd = minSide * 0.165;
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * yStart, cy - vy * far + ny * yStart);
  ctx.lineTo(cx + vx * far + nx * yStart, cy + vy * far + ny * yStart);
  ctx.lineTo(cx + vx * far + nx * yEnd, cy + vy * far + ny * yEnd);
  ctx.lineTo(cx - vx * far + nx * yEnd, cy - vy * far + ny * yEnd);
  ctx.closePath();
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();

  // 5. 高速流线动态光丝
  drawSpeedLines(ctx, w, h, seg, still ? 0.35 : t, ev.principles[0].ok, 1);

  // 6. 沿斜轨排布的 4 枚疏密节奏标桩（实测 ev.nodes 渲染：让等大均分 vs 近大远小一目了然！）
  for (const n of nodes) {
    const px = n.u * w;
    const py = n.v * h;
    const pr = Math.max(7, n.r * minSide * 0.62);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-seg.rad);
    // 铁道信号灯柱/标环
    ctx.beginPath();
    ctx.arc(0, -minSide * 0.095, pr, 0, Math.PI * 2);
    ctx.fillStyle = ev.principles[2].ok ? COLORS.yellow : "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = COLORS.tunnel;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -minSide * 0.095, pr * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.emerald;
    ctx.fill();
    ctx.restore();
  }

  // 7. 精绘高速流线型翡翠白动车（沿主斜轨疾驰）
  const mx = mainPos.u * w;
  const my = mainPos.v * h;
  const trainScale = minSide / 460;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(-seg.rad);
  // 俯冲或上冲时车头始终顺着沿轨前进方向
  const dir = isAscending ? 1 : 1;
  ctx.scale(dir * trainScale, trainScale);

  // 车底投影
  ctx.fillStyle = "rgba(4, 24, 17, 0.52)";
  ctx.fillRect(-142, 13, 246, 20);

  // 车厢主体（纯白流线型外壳）
  ctx.beginPath();
  ctx.moveTo(-140, -34);
  ctx.lineTo(38, -34);
  ctx.quadraticCurveTo(96, -32, 122, 4);
  ctx.quadraticCurveTo(126, 16, 108, 18);
  ctx.lineTo(-140, 18);
  ctx.closePath();
  ctx.fillStyle = "#FBFBF8";
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = COLORS.tunnel;
  ctx.stroke();

  // 车顶翡翠色带
  ctx.beginPath();
  ctx.moveTo(-140, -34);
  ctx.lineTo(34, -34);
  ctx.quadraticCurveTo(60, -33, 76, -22);
  ctx.lineTo(-140, -22);
  ctx.closePath();
  ctx.fillStyle = COLORS.emerald;
  ctx.fill();

  // 驾驶舱流线深黑前窗
  ctx.beginPath();
  ctx.moveTo(42, -23);
  ctx.quadraticCurveTo(82, -21, 100, -4);
  ctx.lineTo(54, -2);
  ctx.closePath();
  ctx.fillStyle = COLORS.tunnel;
  ctx.fill();

  // 车侧窗带与信号黄腰线
  ctx.fillStyle = COLORS.tunnel;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-124 + i * 38, -14, 28, 13);
  }
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(-140, 4, 232, 6);

  // 车头高光前灯
  ctx.beginPath();
  ctx.ellipse(106, 9, 8, 3.5, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = passCount === 4 ? "#FFF2A6" : "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // 8. 可拖动对侧配重锚点：「远景信号城塔与标志牌」
  drawCounterweightAnchor(ctx, cwPos.u * w, cwPos.v * h, minSide, ev, "train");
}

// 场景 2：急弯骑行剪影（严格零五官！）
function drawCyclistScene(ctx, w, h, ev, t, still) {
  const { seg, nodes, cwPos, mainPos } = ev;
  const minSide = Math.min(w, h);
  const vx = Math.cos(seg.rad);
  const vy = -Math.sin(seg.rad);
  const nx = -vy;
  const ny = vx;
  const cx = seg.cu * w;
  const cy = seg.cv * h;
  const far = Math.hypot(w, h) * 1.3;

  // 浅雾天底
  ctx.fillStyle = COLORS.porcelain;
  ctx.fillRect(0, 0, w, h);

  // 远山剪影
  ctx.fillStyle = "#DCE7DE";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.42);
  ctx.lineTo(w * 0.25, h * 0.24);
  ctx.lineTo(w * 0.52, h * 0.39);
  ctx.lineTo(w * 0.78, h * 0.20);
  ctx.lineTo(w, h * 0.34);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // 斜坡柏油翡翠暗道
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * (-minSide * 0.04), cy - vy * far + ny * (-minSide * 0.04));
  ctx.lineTo(cx + vx * far + nx * (-minSide * 0.04), cy + vy * far + ny * (-minSide * 0.04));
  ctx.lineTo(cx + vx * far + nx * far, cy + vy * far + ny * far);
  ctx.lineTo(cx - vx * far + nx * far, cy - vy * far + ny * far);
  ctx.closePath();
  ctx.fillStyle = COLORS.tunnel;
  ctx.fill();

  // 亮黄赛道冲刺线
  const y0 = minSide * 0.04;
  const y1 = minSide * 0.085;
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * y0, cy - vy * far + ny * y0);
  ctx.lineTo(cx + vx * far + nx * y0, cy + vy * far + ny * y0);
  ctx.lineTo(cx + vx * far + nx * y1, cy + vy * far + ny * y1);
  ctx.lineTo(cx - vx * far + nx * y1, cy - vy * far + ny * y1);
  ctx.closePath();
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.restore();

  drawSpeedLines(ctx, w, h, seg, still ? 0.2 : t, ev.principles[0].ok, 0.85);

  // 沿坡疏密路桩（ev.nodes）
  for (const n of nodes) {
    const px = n.u * w;
    const py = n.v * h;
    const hPost = Math.max(14, n.r * minSide * 1.15);
    const wPost = Math.max(6, n.r * minSide * 0.32);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-seg.rad);
    ctx.fillStyle = ev.principles[2].ok ? COLORS.yellow : COLORS.white;
    ctx.strokeStyle = COLORS.tunnel;
    ctx.lineWidth = 1.8;
    ctx.fillRect(-wPost / 2, -hPost - minSide * 0.05, wPost, hPost);
    ctx.strokeRect(-wPost / 2, -hPost - minSide * 0.05, wPost, hPost);
    ctx.restore();
  }

  // 精绘无五官公路车手剪影（纯侧影剪影，绝不画五官）
  const mx = mainPos.u * w;
  const my = mainPos.v * h;
  const sc = minSide / 430;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(-seg.rad);
  ctx.scale(sc, sc);

  // 后轮 & 前轮
  const wheelY = -12;
  for (const wx of [-46, 46]) {
    ctx.beginPath();
    ctx.arc(wx, wheelY, 28, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx, wheelY, 22, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2;
    ctx.stroke();
    // 旋转车辐
    const rot = still ? 0.5 : t * 7;
    for (let k = 0; k < 4; k++) {
      const a = rot + (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(wx - Math.cos(a) * 20, wheelY - Math.sin(a) * 20);
      ctx.lineTo(wx + Math.cos(a) * 20, wheelY + Math.sin(a) * 20);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }
  // 车架
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-46, wheelY);
  ctx.lineTo(-4, -38);
  ctx.lineTo(36, -42);
  ctx.lineTo(46, wheelY);
  ctx.moveTo(-4, -38);
  ctx.lineTo(0, wheelY);
  ctx.lineTo(36, -42);
  ctx.stroke();

  // 骑行者破风纯剪影（流线头盔+伏背躯干+蹬踏腿，零五官）
  ctx.fillStyle = COLORS.emerald;
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-26, -48);
  ctx.quadraticCurveTo(4, -78, 36, -64); // 拱背
  ctx.lineTo(42, -52); // 手臂向车把
  ctx.lineTo(36, -42);
  ctx.lineTo(14, -48);
  ctx.lineTo(6, -20); // 前腿
  ctx.lineTo(-10, -24);
  ctx.lineTo(-18, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 流线气动头盔纯剪影（无脸无五官）
  ctx.beginPath();
  ctx.ellipse(42, -68, 15, 10, 0.25, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.strokeStyle = COLORS.tunnel;
  ctx.stroke();
  ctx.restore();

  drawCounterweightAnchor(ctx, cwPos.u * w, cwPos.v * h, minSide, ev, "cyclist");
}

// 场景 3：瑞士斜切几何海报（直接复刻原海报底沿实践要点第 2、3 格几何语言！）
function drawPosterScene(ctx, w, h, ev, t, still) {
  const { seg, nodes, cwPos, mainPos } = ev;
  const minSide = Math.min(w, h);
  const vx = Math.cos(seg.rad);
  const vy = -Math.sin(seg.rad);
  const nx = -vy;
  const ny = vx;
  const cx = seg.cu * w;
  const cy = seg.cv * h;
  const far = Math.hypot(w, h) * 1.3;

  // 瓷白纸面 + 瑞士微格线
  ctx.fillStyle = COLORS.porcelain;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(4, 88, 59, 0.08)";
  ctx.lineWidth = 1;
  const step = Math.max(24, Math.round(minSide / 12));
  for (let x = step; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = step; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // 下侧深翡翠斜切大面
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * (minSide * 0.08), cy - vy * far + ny * (minSide * 0.08));
  ctx.lineTo(cx + vx * far + nx * (minSide * 0.08), cy + vy * far + ny * (minSide * 0.08));
  ctx.lineTo(cx + vx * far + nx * far, cy + vy * far + ny * far);
  ctx.lineTo(cx - vx * far + nx * far, cy - vy * far + ny * far);
  ctx.closePath();
  ctx.fillStyle = COLORS.emerald;
  ctx.fill();

  // 亮黄主斜带
  ctx.beginPath();
  ctx.moveTo(cx - vx * far + nx * (minSide * 0.045), cy - vy * far + ny * (minSide * 0.045));
  ctx.lineTo(cx + vx * far + nx * (minSide * 0.045), cy + vy * far + ny * (minSide * 0.045));
  ctx.lineTo(cx + vx * far + nx * (minSide * 0.085), cy + vy * far + ny * (minSide * 0.085));
  ctx.lineTo(cx - vx * far + nx * (minSide * 0.085), cy - vy * far + ny * (minSide * 0.085));
  ctx.closePath();
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.restore();

  // 主斜虚线
  ctx.save();
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(seg.p0.u * w, seg.p0.v * h);
  ctx.lineTo(seg.p1.u * w, seg.p1.v * h);
  ctx.strokeStyle = COLORS.tunnel;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();

  // 沿斜线的大小疏密圆块列（直接还原原海报实践要点 02/03 图示）
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const r = Math.max(10, n.r * minSide * 0.92);
    ctx.beginPath();
    ctx.arc(n.u * w, n.v * h, r, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? COLORS.tunnel : COLORS.yellow;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = COLORS.porcelain;
    ctx.stroke();
  }

  // 主视觉斜切大字块装饰
  const mx = mainPos.u * w;
  const my = mainPos.v * h;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(-seg.rad);
  ctx.fillStyle = COLORS.porcelain;
  ctx.font = `700 ${Math.round(minSide * 0.068)}px "Sora", sans-serif`;
  ctx.fillText("DIAGONAL", -minSide * 0.16, minSide * 0.17);
  ctx.restore();

  if (!still) {
    drawSpeedLines(ctx, w, h, seg, t * 0.7, ev.principles[0].ok, 0.55);
  }

  drawCounterweightAnchor(ctx, cwPos.u * w, cwPos.v * h, minSide, ev, "poster");
}

// 绘制可拖动的「对侧配重锚点」实体图形
function drawCounterweightAnchor(ctx, x, y, minSide, ev, scene) {
  const isBlocking = ev.cwBlocking;
  const isOk = ev.balanceOk;
  const r = Math.max(20, minSide * 0.062);

  ctx.save();
  ctx.translate(x, y);

  // 实体图标主体
  if (scene === "train") {
    // 远景信号城塔剪影徽章
    ctx.fillStyle = isBlocking ? COLORS.red : COLORS.emerald;
    ctx.fillRect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
    ctx.strokeStyle = isOk ? COLORS.yellow : COLORS.white;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8);

    // 塔形剪影
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(-r * 0.55, -r * 0.1, r * 0.34, r * 0.7);
    ctx.fillRect(-r * 0.12, -r * 0.55, r * 0.34, r * 1.15);
    ctx.fillRect(r * 0.3, -r * 0.28, r * 0.28, r * 0.88);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(-r * 0.02, -r * 0.75, r * 0.14, r * 0.22);
  } else if (scene === "cyclist") {
    // 菱形弯道警示标牌
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = isBlocking ? COLORS.red : COLORS.yellow;
    ctx.fillRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
    ctx.strokeStyle = COLORS.tunnel;
    ctx.lineWidth = 2.6;
    ctx.strokeRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = COLORS.tunnel;
    ctx.font = `700 ${Math.round(r * 0.72)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KM", 0, 1);
  } else {
    // 瑞士辅文印块
    ctx.fillStyle = isBlocking ? COLORS.red : COLORS.tunnel;
    ctx.fillRect(-r * 1.15, -r * 0.78, r * 2.3, r * 1.56);
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-r * 1.15, -r * 0.78, r * 2.3, r * 1.56);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(-r * 0.88, -r * 0.44, r * 1.1, r * 0.22);
    ctx.fillStyle = COLORS.porcelain;
    ctx.fillRect(-r * 0.88, -r * 0.05, r * 1.72, r * 0.14);
    ctx.fillRect(-r * 0.88, r * 0.24, r * 1.4, r * 0.14);
  }

  // 外侧拖拽标签小胶囊（固定估算宽度避免每帧 measureText 开销）
  ctx.fillStyle = isBlocking ? COLORS.red : (isOk ? COLORS.tunnel : COLORS.ink);
  const tagText = `配重 · ${SCENES[scene].cwLabel}`;
  const tw = 96;
  ctx.fillRect(-tw / 2, r + 6, tw, 20);
  ctx.strokeStyle = isBlocking ? "#FF9484" : COLORS.yellow;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-tw / 2, r + 6, tw, 20);
  ctx.fillStyle = COLORS.white;
  ctx.font = `600 11px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, 0, r + 16);

  ctx.restore();
}

// 绘制隐藏斜轨力线、视觉质心标靶与「信号黄斜角箭柄」
function drawOverlaysAndArrowHandle(ctx, w, h, ev, handles, showVectors, activeDrag) {
  const { seg, com, balanceOk, passCount, idealZone } = ev;
  const minSide = Math.min(w, h);

  if (showVectors) {
    // 1. 中心平衡甜区绿圈与质心标靶
    const tx = EXP_BOUNDS.targetCenter.u * w;
    const ty = EXP_BOUNDS.targetCenter.v * h;
    const tolR = EXP_BOUNDS.balanceTol * Math.min(w, h) * 1.12;

    ctx.save();
    // 甜区边界圆
    ctx.beginPath();
    ctx.arc(tx, ty, tolR, 0, Math.PI * 2);
    ctx.fillStyle = balanceOk ? "rgba(22, 166, 110, 0.14)" : "rgba(214, 58, 44, 0.11)";
    ctx.fill();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = balanceOk ? COLORS.okBright : "#FF9484";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);

    // 推荐对侧配重空域呼吸虚框（只在当前未平衡时淡提示方向，绝不自动替用户跳过去）
    if (!balanceOk && ev.principles[0].ok) {
      const izx = idealZone.u * w;
      const izy = idealZone.v * h;
      ctx.beginPath();
      ctx.arc(izx, izy, Math.max(22, minSide * 0.075), 0, Math.PI * 2);
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "rgba(4, 88, 59, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(4, 88, 59, 0.88)";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("可挪配重至此侧", izx, izy - Math.max(26, minSide * 0.085));
    }

    // 实测加权质心点与偏移矢量线
    const comX = com.u * w;
    const comY = com.v * h;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(comX, comY);
    ctx.strokeStyle = balanceOk ? COLORS.okBright : COLORS.red;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(comX, comY, 7, 0, Math.PI * 2);
    ctx.fillStyle = balanceOk ? COLORS.okBright : COLORS.red;
    ctx.fill();
    ctx.strokeStyle = COLORS.tunnel;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 质心标签
    ctx.fillStyle = COLORS.tunnel;
    ctx.fillRect(comX + 10, comY - 10, 62, 20);
    ctx.fillStyle = balanceOk ? COLORS.okBright : "#FF9484";
    ctx.font = `600 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`质心 ${ev.comOffsetPct}%`, comX + 15, comY);
    ctx.restore();
  }

  // 2. 标志性「信号黄破框大箭头」斜角拖动把手（呼应原海报右上大箭！）
  const ah = handles.arrow;
  ctx.save();
  ctx.translate(ah.x, ah.y);
  ctx.rotate(-seg.rad);

  // 外圈脉冲弧（提示可旋转拖动）
  ctx.beginPath();
  ctx.arc(0, 0, activeDrag === "arrow" ? 29 : 25, -0.75, 0.75);
  ctx.strokeStyle = passCount === 4 ? COLORS.okBright : COLORS.yellow;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, activeDrag === "arrow" ? 29 : 25, Math.PI - 0.75, Math.PI + 0.75);
  ctx.stroke();

  // 箭头圆底与锐角大箭
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fillStyle = activeDrag === "arrow" ? COLORS.white : COLORS.yellow;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COLORS.tunnel;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(8, 0);
  ctx.moveTo(2, -7);
  ctx.lineTo(9, 0);
  ctx.lineTo(2, 7);
  ctx.strokeStyle = COLORS.tunnel;
  ctx.lineWidth = 3;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.stroke();
  ctx.restore();

  // 3. 四角极细取景折角线（高精摄影取景质感）
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.6;
  const m = 10, L = 14;
  const corners = [
    [m, m, 1, 1],
    [w - m, m, -1, 1],
    [m, h - m, 1, -1],
    [w - m, h - m, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * L, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * L);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderHeroCanvas(ctx, w, h, state, ev, t, still, activeDrag) {
  ctx.clearRect(0, 0, w, h);

  if (state.scene === "cyclist") {
    drawCyclistScene(ctx, w, h, ev, t, still);
  } else if (state.scene === "poster") {
    drawPosterScene(ctx, w, h, ev, t, still);
  } else {
    drawTrainScene(ctx, w, h, ev, t, still);
  }

  const handles = getHandles(ev, w, h);
  drawOverlaysAndArrowHandle(ctx, w, h, ev, handles, state.showVectors, activeDrag);
  return handles;
}
