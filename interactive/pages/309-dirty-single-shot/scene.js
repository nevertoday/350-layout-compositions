// 309 脏单人镜头 · 2.39:1 宽银幕电影画幅渲染器 + 俯拍走位图渲染器
// 所有人物严格采用侧影/剪影（零五官）；前景模糊采用多阶羽化低开销管线，保证慢手机 60fps。

import { ASPECT, FRAME_REGIONS, ROOM, buildCompanionPolygon } from "./model.js";

// 原海报实采色盘
export const PALETTE = {
  darkBg: "#10120A",
  oliveWall: "#35371B",
  oliveWallDeep: "#1F2110",
  windowGlow: "#A89E5E",
  windowCore: "#C5BC7A",
  windowFrame: "#2B2D16",
  foliage: "#434624",
  silhouette: "#070904",
  fgDark: "#050703",
  coral: "#DB5948",
  coralBright: "#F06D5B",
  cream: "#F2EAC6",
  linen: "#C4BC9B",
  oliveBadge: "#999852",
  okGreen: "#95B85B",
  warnAmber: "#E0A44B",
};

// 缓存一个 2.39:1 的柔焦前景缓冲画布，避免全屏 ctx.filter 拖慢软件渲染
const blurCache = {
  canvas: null,
  ctx: null,
};

function ensureBlurBuffer(w, h) {
  if (!blurCache.canvas) {
    blurCache.canvas = document.createElement("canvas");
    blurCache.ctx = blurCache.canvas.getContext("2d");
  }
  if (blurCache.canvas.width !== w || blurCache.canvas.height !== h) {
    blurCache.canvas.width = w;
    blurCache.canvas.height = h;
  }
  return blurCache;
}

// 绘制路径辅助：平滑闭合剪影（中点二次贝塞尔，呈现自然头肩曲线）
function traceSmoothPolygon(ctx, pts, W, H) {
  if (!pts.length) return;
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) * 0.5 * W, (a[1] + b[1]) * 0.5 * H];
  const [sx, sy] = mid(pts[n - 1], pts[0]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const [mx, my] = mid(cur, next);
    ctx.quadraticCurveTo(cur[0] * W, cur[1] * H, mx, my);
  }
  ctx.closePath();
}

// 绘制背景：暗橄榄内墙 + 双格暖黄窗光 + 窗外柔影树枝（支持微弱视差与焦段压缩缩放）
export function drawBackgroundLayer(ctx, W, H, { parallaxU = 0, bgScale = 1, alpha = 1 } = {}) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  // 暗橄榄咖啡馆墙壁渐变
  const wallGrad = ctx.createLinearGradient(0, 0, W, H);
  wallGrad.addColorStop(0, "#2A2C15");
  wallGrad.addColorStop(0.52, "#393B1D");
  wallGrad.addColorStop(1, "#1D1F0F");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, H);

  // 窗户中心随视差与焦段缩放
  const cx = W * (0.61 + parallaxU);
  const cy = H * 0.44;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(bgScale, bgScale);

  const paneW = W * 0.128;
  const paneH = H * 0.62;
  const gap = W * 0.015;
  const leftX = -paneW - gap * 0.5;
  const rightX = gap * 0.5;
  const topY = -paneH * 0.56;

  // 窗周暖光晕（极低成本径向渐变）
  const halo = ctx.createRadialGradient(0, -paneH * 0.05, paneW * 0.15, 0, 0, paneW * 2.5);
  halo.addColorStop(0, "rgba(182, 173, 106, 0.34)");
  halo.addColorStop(0.55, "rgba(130, 122, 68, 0.12)");
  halo.addColorStop(1, "rgba(35, 37, 18, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(-paneW * 2.6, -paneH * 1.1, paneW * 5.2, paneH * 2.2);

  // 双格亮窗（承袭 309 原海报双格暖黄橄榄窗）
  const winGrad = ctx.createLinearGradient(0, topY, 0, topY + paneH);
  winGrad.addColorStop(0, "#B7AD6A");
  winGrad.addColorStop(0.55, "#9C9256");
  winGrad.addColorStop(1, "#7B7442");
  ctx.fillStyle = winGrad;
  ctx.fillRect(leftX, topY, paneW, paneH);
  ctx.fillRect(rightX, topY, paneW, paneH);

  // 窗台投射到墙面的斜光带
  ctx.fillStyle = "rgba(176, 167, 100, 0.09)";
  ctx.beginPath();
  ctx.moveTo(leftX, topY + paneH);
  ctx.lineTo(rightX + paneW, topY + paneH);
  ctx.lineTo(rightX + paneW + W * 0.06, H * 0.72);
  ctx.lineTo(leftX - W * 0.12, H * 0.72);
  ctx.closePath();
  ctx.fill();

  // 窗外柔影植物枝叶（右窗内飘入，呼应 309 原海报）
  ctx.save();
  ctx.beginPath();
  ctx.rect(leftX, topY, paneW, paneH);
  ctx.rect(rightX, topY, paneW, paneH);
  ctx.clip();

  ctx.strokeStyle = "rgba(62, 65, 33, 0.72)";
  ctx.fillStyle = "rgba(62, 65, 33, 0.72)";
  ctx.lineWidth = Math.max(1.5, H * 0.008);
  // 主枝
  ctx.beginPath();
  ctx.moveTo(rightX + paneW * 1.08, topY + paneH * 0.76);
  ctx.quadraticCurveTo(rightX + paneW * 0.56, topY + paneH * 0.56, rightX + paneW * 0.18, topY + paneH * 0.24);
  ctx.stroke();

  const leaves = [
    [rightX + paneW * 0.76, topY + paneH * 0.62, -0.55, 0.032, 0.012],
    [rightX + paneW * 0.52, topY + paneH * 0.48, -0.95, 0.035, 0.013],
    [rightX + paneW * 0.36, topY + paneH * 0.36, -0.25, 0.030, 0.011],
    [rightX + paneW * 0.62, topY + paneH * 0.36, -1.25, 0.028, 0.011],
    [rightX + paneW * 0.28, topY + paneH * 0.66, -0.45, 0.032, 0.012],
    [rightX + paneW * 0.85, topY + paneH * 0.42, -0.75, 0.034, 0.012],
    [leftX + paneW * 0.16, topY + paneH * 0.76, 0.48, 0.028, 0.011],
  ];
  for (const [lx, ly, rot, rx, ry] of leaves) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, W * rx, W * ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 窗棂细暗框
  ctx.strokeStyle = "#222411";
  ctx.lineWidth = Math.max(1.5, H * 0.01);
  ctx.strokeRect(leftX, topY, paneW, paneH);
  ctx.strokeRect(rightX, topY, paneW, paneH);

  ctx.restore();

  // 左侧远景暗柱与柔和环境阴影（增加层次）
  const floorGrad = ctx.createLinearGradient(0, H * 0.76, 0, H);
  floorGrad.addColorStop(0, "rgba(12, 14, 8, 0)");
  floorGrad.addColorStop(1, "rgba(8, 10, 5, 0.72)");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, H * 0.76, W, H * 0.24);

  ctx.restore();
}

// 绘制中景：咖啡桌 + 咖啡杯 + 朝左坐姿主角清晰侧影（严格无五官细节！）
export function drawSubjectLayer(ctx, W, H, { alpha = 1, subjectShiftU = 0 } = {}) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W * subjectShiftU, 0);

  const px = (u) => u * W;
  const py = (v) => v * H;

  // 咖啡桌（桌面 + 桌柱）
  ctx.fillStyle = "#16180C";
  ctx.fillRect(px(0.325), py(0.72), px(0.285), py(0.026));
  ctx.fillRect(px(0.458), py(0.746), px(0.018), py(0.26));

  // 咖啡杯与杯柄（落在主角左前方视线走廊里）
  ctx.fillStyle = "#0A0C06";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(px(0.436), py(0.648), px(0.032), py(0.072), 2) : ctx.rect(px(0.436), py(0.648), px(0.032), py(0.072));
  ctx.fill();
  ctx.strokeStyle = "#0A0C06";
  ctx.lineWidth = Math.max(1.5, H * 0.009);
  ctx.beginPath();
  ctx.arc(px(0.469), py(0.684), Math.max(2.5, H * 0.018), -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  // 一缕微弱咖啡热气（静态细腻曲线）
  ctx.strokeStyle = "rgba(210, 200, 140, 0.24)";
  ctx.lineWidth = Math.max(1, H * 0.0045);
  ctx.beginPath();
  ctx.moveTo(px(0.449), py(0.635));
  ctx.bezierCurveTo(px(0.445), py(0.595), px(0.456), py(0.575), px(0.450), py(0.54));
  ctx.stroke();

  // 椅背与椅座（右侧背后）
  ctx.fillStyle = "#191B0E";
  ctx.beginPath();
  ctx.moveTo(px(0.674), py(0.50));
  ctx.lineTo(px(0.706), py(0.50));
  ctx.lineTo(px(0.692), py(0.84));
  ctx.lineTo(px(0.665), py(0.84));
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(px(0.585), py(0.822), px(0.108), py(0.03));
  ctx.fillRect(px(0.602), py(0.852), px(0.013), py(0.15));
  ctx.fillRect(px(0.672), py(0.852), px(0.013), py(0.15));

  // 主角人物纯侧影（朝左，忠实原海报轮廓：短发额头、鼻梁与下巴外廓、颈部、挺直肩背、手臂搭桌/腿；绝无五官！）
  ctx.fillStyle = PALETTE.silhouette;
  ctx.beginPath();
  // 头顶起笔，顺逆时针描出清晰朝左侧脸剪影
  ctx.moveTo(px(0.618), py(0.205));
  // 额发与额头
  ctx.bezierCurveTo(px(0.592), py(0.205), px(0.580), py(0.225), px(0.581), py(0.262));
  // 鼻梁外廓（纯剪影）
  ctx.lineTo(px(0.571), py(0.304));
  ctx.lineTo(px(0.580), py(0.312));
  // 唇下巴剪影
  ctx.lineTo(px(0.579), py(0.340));
  ctx.quadraticCurveTo(px(0.580), py(0.362), px(0.594), py(0.367));
  // 下颌到颈前
  ctx.lineTo(px(0.602), py(0.372));
  ctx.lineTo(px(0.599), py(0.415));
  // 胸前与前臂伸向桌面方向
  ctx.bezierCurveTo(px(0.584), py(0.445), px(0.574), py(0.515), px(0.572), py(0.615));
  ctx.lineTo(px(0.562), py(0.715));
  ctx.lineTo(px(0.532), py(0.720));
  ctx.quadraticCurveTo(px(0.520), py(0.755), px(0.526), py(0.840));
  ctx.lineTo(px(0.526), py(1.01));
  // 腿部与衣摆
  ctx.lineTo(px(0.558), py(1.01));
  ctx.lineTo(px(0.566), py(0.835));
  ctx.lineTo(px(0.664), py(0.822));
  // 背部向上回颈后
  ctx.bezierCurveTo(px(0.676), py(0.705), px(0.680), py(0.565), px(0.671), py(0.470));
  ctx.quadraticCurveTo(px(0.664), py(0.422), px(0.642), py(0.402));
  // 后脑勺与发际
  ctx.lineTo(px(0.642), py(0.365));
  ctx.bezierCurveTo(px(0.654), py(0.325), px(0.655), py(0.245), px(0.638), py(0.215));
  ctx.quadraticCurveTo(px(0.630), py(0.205), px(0.618), py(0.205));
  ctx.closePath();
  ctx.fill();

  // 极其克制的背光窗缘微轮廓高光（仅在背光后缘 1px，增强剪影层次与真实感）
  ctx.strokeStyle = "rgba(188, 178, 114, 0.28)";
  ctx.lineWidth = Math.max(1, H * 0.004);
  ctx.beginPath();
  ctx.moveTo(px(0.625), py(0.208));
  ctx.bezierCurveTo(px(0.652), py(0.228), px(0.654), py(0.320), px(0.642), py(0.366));
  ctx.stroke();

  ctx.restore();
}

// 绘制不同类型前景物体（用于第 04 节剧情道具抽换台 & 主舞台同伴肩影）
function tracePropShape(ctx, propType, W, H, polygon) {
  if (propType === "companion") {
    traceSmoothPolygon(ctx, polygon, W, H);
    return;
  }
  ctx.beginPath();
  if (propType === "doorframe") {
    // 左侧半掩门框 + 门把手暗影（隔门窥视感）
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.21, 0);
    ctx.lineTo(W * 0.195, H * 0.42);
    ctx.lineTo(W * 0.228, H * 0.435);
    ctx.lineTo(W * 0.228, H * 0.468);
    ctx.lineTo(W * 0.195, H * 0.478);
    ctx.lineTo(W * 0.185, H);
    ctx.lineTo(0, H);
    ctx.closePath();
  } else if (propType === "foliage") {
    // 左上与左下垂落室内绿植大叶暗影
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.24, 0);
    ctx.quadraticCurveTo(W * 0.20, H * 0.18, W * 0.11, H * 0.27);
    ctx.quadraticCurveTo(W * 0.25, H * 0.34, W * 0.22, H * 0.48);
    ctx.quadraticCurveTo(W * 0.14, H * 0.56, W * 0.08, H * 0.50);
    ctx.quadraticCurveTo(W * 0.23, H * 0.68, W * 0.20, H * 0.88);
    ctx.quadraticCurveTo(W * 0.15, H * 0.98, W * 0.08, H);
    ctx.lineTo(0, H);
    ctx.closePath();
  } else if (propType === "glass-rail") {
    // 前景桌角高脚杯与窗栏杆暗影（公共场合疏离旁观）
    // 左侧栏杆
    ctx.rect(0, 0, W * 0.065, H);
    ctx.rect(W * 0.135, 0, W * 0.032, H);
    // 前景近焦大酒杯轮廓（左下方）
    ctx.moveTo(W * 0.17, H * 0.54);
    ctx.lineTo(W * 0.275, H * 0.54);
    ctx.quadraticCurveTo(W * 0.272, H * 0.74, W * 0.232, H * 0.78);
    ctx.lineTo(W * 0.232, H * 0.96);
    ctx.lineTo(W * 0.268, H);
    ctx.lineTo(W * 0.178, H);
    ctx.lineTo(W * 0.214, H * 0.96);
    ctx.lineTo(W * 0.214, H * 0.78);
    ctx.quadraticCurveTo(W * 0.174, H * 0.74, W * 0.17, H * 0.54);
    ctx.closePath();
  }
}

// 高速光学柔焦前景渲染：用多层羽化描边 + 实心核模拟真弥散圆虚化（零 ctx.filter，慢手机 60fps）
export function drawForegroundLayer(ctx, W, H, { polygon, blurNorm = 0.025, propType = "companion", alpha = 1 } = {}) {
  if (alpha <= 0.01) return;
  if (propType === "companion" && (!polygon || !polygon.length)) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const blurPx = Math.max(0.5, blurNorm * H);
  // 用 5 阶羽化外晕 + 实心核，兼顾 f/11 硬边与 f/1.8 奶油柔焦
  if (blurPx > 2.2) {
    const steps = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (let i = steps; i >= 1; i--) {
      const frac = i / steps;
      const spread = blurPx * frac * 1.9;
      ctx.strokeStyle = `rgba(6, 8, 4, ${(0.06 + (1 - frac) * 0.16).toFixed(3)})`;
      ctx.lineWidth = spread;
      tracePropShape(ctx, propType, W, H, polygon);
      ctx.stroke();
    }
    // 内核也随极浅景深略微柔透边缘，呈现真实失焦透明边缘感
    ctx.fillStyle = blurPx > H * 0.032 ? "rgba(6, 8, 4, 0.90)" : "rgba(6, 8, 4, 0.95)";
    tracePropShape(ctx, propType, W, H, polygon);
    ctx.fill();
  } else {
    // f/11 深焦：极其锐利坚硬的黑块轮廓 + 极细反光边，直观展示「硬边抢戏」
    ctx.fillStyle = "#040602";
    tracePropShape(ctx, propType, W, H, polygon);
    ctx.fill();
    ctx.strokeStyle = "rgba(182, 174, 114, 0.34)";
    ctx.lineWidth = Math.max(1.2, H * 0.005);
    tracePropShape(ctx, propType, W, H, polygon);
    ctx.stroke();
  }

  ctx.restore();
}

// 绘制同源几何诊断叠层（开场监视器「构图线」与第 07 节小练习揭晓共用！）
export function drawDiagnosticOverlay(ctx, W, H, evalRes, { compact = false, showCallouts = false } = {}) {
  const px = (u) => u * W;
  const py = (v) => v * H;
  const { conditions, details, landmarks, hasForeground, allPassed, side } = evalRes;

  ctx.save();

  // 1. 主角视线空间走廊（Looking Room）
  const sr = FRAME_REGIONS.sightline;
  const sightColor = conditions.clearSpace ? "rgba(149, 184, 91, 0.85)" : "rgba(240, 109, 91, 0.95)";
  const sightFill = conditions.clearSpace ? "rgba(149, 184, 91, 0.10)" : "rgba(240, 109, 91, 0.18)";
  ctx.fillStyle = sightFill;
  ctx.fillRect(px(sr.u0), py(sr.v0), px(sr.u1 - sr.u0), py(sr.v1 - sr.v0));
  ctx.strokeStyle = sightColor;
  ctx.lineWidth = Math.max(1.2, H * 0.0045);
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(px(sr.u0), py(sr.v0), px(sr.u1 - sr.u0), py(sr.v1 - sr.v0));
  ctx.setLineDash([]);

  // 视线方向箭头（从主角眼神朝左延伸）
  const ey = py(FRAME_REGIONS.eyeOrigin.v);
  const ex0 = px(FRAME_REGIONS.eyeOrigin.u);
  const ex1 = px(sr.u0 + 0.025);
  ctx.strokeStyle = sightColor;
  ctx.lineWidth = Math.max(1.6, H * 0.006);
  ctx.beginPath();
  ctx.moveTo(ex0, ey);
  ctx.lineTo(ex1, ey);
  ctx.moveTo(ex1 + H * 0.032, ey - H * 0.024);
  ctx.lineTo(ex1, ey);
  ctx.lineTo(ex1 + H * 0.032, ey + H * 0.024);
  ctx.stroke();

  // 若面部被遮挡，加绘面部警示框
  if (details.faceBlocked) {
    const fr = FRAME_REGIONS.face;
    ctx.strokeStyle = PALETTE.coralBright;
    ctx.fillStyle = "rgba(240, 109, 91, 0.24)";
    ctx.lineWidth = Math.max(1.8, H * 0.006);
    ctx.fillRect(px(fr.u0), py(fr.v0), px(fr.u1 - fr.u0), py(fr.v1 - fr.v0));
    ctx.strokeRect(px(fr.u0), py(fr.v0), px(fr.u1 - fr.u0), py(fr.v1 - fr.v0));
  }

  // 2. 前景人物轮廓辨认线（头顶-后脑拐点-肩线斜坡）
  if (hasForeground) {
    const { headCrownPt, neckInflectPt, shoulderSlopePt, shoulderOuterPt } = landmarks;
    const recColor = conditions.recognizable ? "#F2EAC6" : PALETTE.coralBright;
    ctx.strokeStyle = recColor;
    ctx.lineWidth = Math.max(1.6, H * 0.0055);
    ctx.setLineDash(conditions.recognizable ? [4, 3] : [3, 3]);
    ctx.beginPath();
    ctx.moveTo(px(headCrownPt[0]), py(headCrownPt[1]));
    ctx.lineTo(px(neckInflectPt[0]), py(neckInflectPt[1]));
    ctx.lineTo(px(shoulderSlopePt[0]), py(shoulderSlopePt[1]));
    ctx.lineTo(px(shoulderOuterPt[0]), py(shoulderOuterPt[1]));
    ctx.stroke();
    ctx.setLineDash([]);

    // 标出「后脑/颈肩拐点」关键点（若出框则贴边打 ✗）
    const nx = Math.max(8, Math.min(W - 8, px(neckInflectPt[0])));
    const ny = Math.max(8, Math.min(H - 8, py(neckInflectPt[1])));
    const r = Math.max(3.5, H * 0.016);
    ctx.fillStyle = conditions.recognizable ? PALETTE.okGreen : PALETTE.coral;
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#10120A";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // 3. 背对警告标记（当同伴落在右侧背后）
  if (details.companionBehindBack) {
    const bx = px(0.75);
    const by = py(0.28);
    ctx.strokeStyle = PALETTE.coralBright;
    ctx.lineWidth = Math.max(1.5, H * 0.0055);
    ctx.beginPath();
    ctx.moveTo(bx - H * 0.03, by);
    ctx.lineTo(bx + H * 0.05, by);
    ctx.moveTo(bx + H * 0.025, by - H * 0.022);
    ctx.lineTo(bx + H * 0.05, by);
    ctx.lineTo(bx + H * 0.025, by + H * 0.022);
    ctx.stroke();
  }

  // 4. 文字短签（非 compact 模式或在练习卡片内保持清晰 ≥ 10px）
  const fs = Math.max(10, Math.round(H * (compact ? 0.074 : 0.034)));
  ctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "middle";

  const drawPill = (text, cx, cy, bg, fg) => {
    const padX = Math.max(5, fs * 0.45);
    const tw = ctx.measureText(text).width;
    const bw = tw + padX * 2;
    const bh = fs + 6;
    const x = Math.max(4, Math.min(W - bw - 4, cx - bw * 0.5));
    const y = Math.max(4, Math.min(H - bh - 4, cy - bh * 0.5));
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = fg;
    ctx.fillText(text, x + padX, y + bh * 0.5 + 0.5);
  };

  drawPill(
    conditions.clearSpace ? "视线空间畅通" : (details.faceBlocked ? "遮挡面部" : "切进视线/杯前"),
    px((sr.u0 + sr.u1) * 0.5),
    py(compact ? 0.14 : 0.13),
    conditions.clearSpace ? "rgba(16, 18, 10, 0.86)" : "rgba(166, 42, 28, 0.92)",
    conditions.clearSpace ? "#C7E095" : "#FFF5EB"
  );

  if (hasForeground) {
    const labelU = side === "left" ? 0.16 : 0.84;
    const recText = !conditions.recognizable
      ? "拐点出框 · 难辨人"
      : !conditions.gazeSide
        ? "落在背后侧"
        : "肩线+后脑可辨";
    drawPill(
      recText,
      px(labelU),
      py(compact ? 0.86 : 0.88),
      conditions.recognizable && conditions.gazeSide ? "rgba(16, 18, 10, 0.86)" : "rgba(166, 42, 28, 0.92)",
      conditions.recognizable && conditions.gazeSide ? "#F2EAC6" : "#FFF5EB"
    );
  }

  // 5. 三条件全通时，浮现原海报同款三道珊瑚红折角虚线引注（仅大监视器开启 showCallouts 时）
  if (showCallouts && allPassed && !compact) {
    ctx.strokeStyle = PALETTE.coralBright;
    ctx.fillStyle = PALETTE.coralBright;
    ctx.lineWidth = 1.4;
    const callouts = [
      { label: "前景遮挡", from: [0.18, 0.72], elbow: [0.27, 0.72], to: [0.30, 0.78] },
      { label: "主体清晰", from: [0.61, 0.21], elbow: [0.55, 0.11], to: [0.47, 0.11] },
      { label: "空间延伸", from: [0.71, 0.44], elbow: [0.80, 0.44], to: [0.84, 0.51] },
    ];
    for (const c of callouts) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(px(c.from[0]), py(c.from[1]));
      ctx.lineTo(px(c.elbow[0]), py(c.elbow[1]));
      ctx.lineTo(px(c.to[0]), py(c.to[1]));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(px(c.from[0]), py(c.from[1]), 3, 0, Math.PI * 2);
      ctx.fill();
      drawPill(c.label, px(c.to[0]), py(c.to[1]) - (c.label === "主体清晰" ? 0 : 12), "rgba(16, 18, 10, 0.86)", "#F06D5B");
    }
  }

  ctx.restore();
}

// 渲染完整 2.39:1 宽银幕电影画面（供开场监视器、第 04 节、第 05 节、第 07 节复用）
export function renderCinemaFrame(canvas, evalRes, opts = {}) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const wCss = Math.max(160, Math.round(rect.width));
  const hCss = Math.max(67, Math.round(rect.width / ASPECT));
  const W = Math.round(wCss * dpr);
  const H = Math.round(hCss * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const {
    showBg = true,
    showSubject = true,
    showFg = true,
    propType = "companion",
    bgScale = 1,
    showDiag = false,
    showCallouts = false,
    compactDiag = false,
    showHud = false,
    showCornerBrackets = true,
    accentBrackets = false,
  } = opts;

  // 清屏
  ctx.fillStyle = PALETTE.darkBg;
  ctx.fillRect(0, 0, wCss, hCss);

  // 1. 背景层（暖黄双格窗 + 树影）
  if (showBg) {
    drawBackgroundLayer(ctx, wCss, hCss, { parallaxU: evalRes.bgParallaxU || 0, bgScale });
  }

  // 2. 中景层（咖啡桌 + 咖啡杯 + 朝左主角侧影）
  if (showSubject) {
    drawSubjectLayer(ctx, wCss, hCss);
  }

  // 3. 前景层（同伴肩影或道具）
  if (showFg) {
    drawForegroundLayer(ctx, wCss, hCss, {
      polygon: evalRes.polygon,
      blurNorm: evalRes.optics.blurNorm,
      propType,
    });
  }

  // 4. 电影暗角（轻微，不挡字）
  const vig = ctx.createRadialGradient(wCss * 0.5, hCss * 0.5, wCss * 0.28, wCss * 0.5, hCss * 0.5, wCss * 0.68);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(4, 6, 3, 0.36)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, wCss, hCss);

  // 5. 同源诊断叠层
  if (showDiag || (showCallouts && evalRes.allPassed)) {
    drawDiagnosticOverlay(ctx, wCss, hCss, evalRes, { compact: compactDiag, showCallouts });
  }

  // 6. 监视器四角取景折角 ┌ ┐ └ ┘（练习盲测保持中性色不泄题）
  if (showCornerBrackets) {
    const m = Math.max(8, Math.round(hCss * 0.04));
    const len = Math.max(10, Math.round(hCss * 0.08));
    ctx.strokeStyle = (accentBrackets && evalRes.allPassed) ? "rgba(149, 184, 91, 0.85)" : "rgba(242, 234, 198, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m);
    ctx.moveTo(wCss - m - len, m); ctx.lineTo(wCss - m, m); ctx.lineTo(wCss - m, m + len);
    ctx.moveTo(m, hCss - m - len); ctx.lineTo(m, hCss - m); ctx.lineTo(m + len, hCss - m);
    ctx.moveTo(wCss - m - len, hCss - m); ctx.lineTo(wCss - m, hCss - m); ctx.lineTo(wCss - m, hCss - m - len);
    ctx.stroke();
  }

  // 7. 监视器顶角精炼参数条（2.39:1 · 50mm · f/X.X）
  if (showHud) {
    const fs = Math.max(10, Math.min(12, Math.round(wCss * 0.011)));
    ctx.font = `600 ${fs}px "Archivo", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    const m = Math.max(12, Math.round(hCss * 0.065));
    const leftText = `2.39:1  ·  ${evalRes.focalMm}MM  ·  f/${evalRes.aperture}`;
    const lw = ctx.measureText(leftText).width;
    ctx.fillStyle = "rgba(12, 14, 8, 0.72)";
    ctx.fillRect(m, m, lw + 14, fs + 10);
    ctx.fillStyle = "#F2EAC6";
    ctx.fillText(leftText, m + 7, m + 5);

    const rightText = evalRes.allPassed ? "3/3 GEOMETRY OK" : `${evalRes.passedCount}/3 CHECK`;
    const rw = ctx.measureText(rightText).width;
    ctx.fillStyle = evalRes.allPassed ? "rgba(44, 64, 24, 0.88)" : "rgba(148, 42, 28, 0.88)";
    ctx.fillRect(wCss - m - rw - 14, m, rw + 14, fs + 10);
    ctx.fillStyle = "#FFF7EA";
    ctx.fillText(rightText, wCss - m - rw - 7, m + 5);
  }
}

// 渲染片场俯拍走位平面图（Overhead Blocking Plan）：展示后墙双窗、朝左主角、咖啡杯、前景同伴、视线轴与底部摄影机滑轨
export function renderFloorplan(canvas, evalRes) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(220, Math.round(rect.width));
  const H = Math.max(100, Math.round(rect.height));
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 世界坐标 (x ∈ [-1.65, +1.65], z ∈ [-1.8, +2.75]) 映射到画布
  const padX = Math.max(24, W * 0.075);
  const padTop = H < 115 ? 12 : Math.max(16, H * 0.12);
  const padBot = H < 115 ? 24 : Math.max(26, H * 0.19);
  const toX = (x) => padX + ((x + 1.55) / 3.1) * (W - padX * 2);
  const toY = (z) => padTop + ((z + 1.65) / 4.25) * (H - padTop - padBot);

  // 底色与细暗格线
  ctx.fillStyle = "#13150C";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(196, 188, 155, 0.07)";
  ctx.lineWidth = 1;
  for (let gx = -1.5; gx <= 1.51; gx += 0.5) {
    const x = Math.round(toX(gx)) + 0.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let gz = -1.5; gz <= 2.51; gz += 0.5) {
    const y = Math.round(toY(gz)) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // 后墙双格窗
  const wy = toY(ROOM.windowZ);
  ctx.strokeStyle = "#484B27";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padX * 0.5, wy);
  ctx.lineTo(W - padX * 0.5, wy);
  ctx.stroke();
  ctx.fillStyle = "#B7AD6A";
  ctx.fillRect(toX(-0.34), wy - 3, toX(0.08) - toX(-0.34), 6);
  ctx.fillRect(toX(0.14), wy - 3, toX(0.56) - toX(0.14), 6);

  // 摄影机位置与视锥扇面
  const camX = toX(evalRes.dollyX);
  const camY = toY(evalRes.dollyZ);
  const aimX = toX(ROOM.aimTarget.x);
  const aimY = toY(ROOM.aimTarget.z);
  const ang = Math.atan2(aimY - camY, aimX - camX);
  const halfFov = Math.atan(18 / evalRes.focalMm);
  const coneLen = H * 1.15;

  const coneGrad = ctx.createRadialGradient(camX, camY, 6, camX, camY, coneLen);
  if (evalRes.allPassed) {
    coneGrad.addColorStop(0, "rgba(149, 184, 91, 0.24)");
    coneGrad.addColorStop(1, "rgba(149, 184, 91, 0.02)");
  } else {
    coneGrad.addColorStop(0, "rgba(219, 89, 72, 0.22)");
    coneGrad.addColorStop(1, "rgba(219, 89, 72, 0.02)");
  }
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(ang - halfFov) * coneLen, camY + Math.sin(ang - halfFov) * coneLen);
  ctx.lineTo(camX + Math.cos(ang + halfFov) * coneLen, camY + Math.sin(ang + halfFov) * coneLen);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = evalRes.allPassed ? "rgba(149, 184, 91, 0.55)" : "rgba(240, 109, 91, 0.52)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(ang - halfFov) * coneLen, camY + Math.sin(ang - halfFov) * coneLen);
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(ang + halfFov) * coneLen, camY + Math.sin(ang + halfFov) * coneLen);
  ctx.stroke();
  ctx.setLineDash([]);

  // 穿过主角与同伴的「轴线」（跨越它即可让同伴在左右两侧切换入画）
  const pX = toX(ROOM.protagonist.x);
  const pY = toY(ROOM.protagonist.z);
  const cX = toX(ROOM.companion.x);
  const cY = toY(ROOM.companion.z);
  const axisCrossX = ROOM.protagonist.x + (ROOM.companion.x - ROOM.protagonist.x) * (ROOM.defaultTrackZ / ROOM.companion.z);
  ctx.strokeStyle = "rgba(196, 188, 155, 0.32)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(pX, pY);
  ctx.lineTo(toX(axisCrossX), toY(ROOM.defaultTrackZ));
  ctx.stroke();
  ctx.setLineDash([]);

  // 咖啡桌与咖啡杯（俯视）
  ctx.fillStyle = "#2A2C16";
  ctx.strokeStyle = "rgba(196, 188, 155, 0.35)";
  ctx.lineWidth = 1;
  ctx.fillRect(toX(-0.74), toY(-0.22), toX(-0.20) - toX(-0.74), toY(0.22) - toY(-0.22));
  ctx.strokeRect(toX(-0.74), toY(-0.22), toX(-0.20) - toX(-0.74), toY(0.22) - toY(-0.22));
  ctx.fillStyle = "#C5BC7A";
  ctx.beginPath();
  ctx.arc(toX(ROOM.cup.x), toY(ROOM.cup.z), 3.2, 0, Math.PI * 2);
  ctx.fill();

  // 主角（俯视肩头与朝左视线箭头）
  ctx.save();
  ctx.translate(pX, pY);
  // 视线朝左虚线箭头
  ctx.strokeStyle = "#C5BC7A";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-Math.max(36, W * 0.14), 0);
  ctx.moveTo(-Math.max(30, W * 0.12), -4);
  ctx.lineTo(-Math.max(36, W * 0.14), 0);
  ctx.lineTo(-Math.max(30, W * 0.12), 4);
  ctx.stroke();
  // 肩背椭圆 + 头部圆
  ctx.fillStyle = "#F2EAC6";
  ctx.beginPath();
  ctx.ellipse(3, 0, 5, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#10120A";
  ctx.strokeStyle = "#F2EAC6";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 前景同伴（俯视肩背）
  ctx.save();
  ctx.translate(cX, cY);
  ctx.fillStyle = "#DB5948";
  ctx.beginPath();
  ctx.ellipse(0, 3, 15, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#10120A";
  ctx.strokeStyle = "#F06D5B";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 底部滑轨（不预先画绿区泄题，只标轨道金属双线与中心轴刻点）
  const trackY = toY(ROOM.defaultTrackZ);
  const tx0 = toX(ROOM.trackMinX);
  const tx1 = toX(ROOM.trackMaxX);
  ctx.strokeStyle = "rgba(196, 188, 155, 0.34)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx0, trackY - 3); ctx.lineTo(tx1, trackY - 3);
  ctx.moveTo(tx0, trackY + 3); ctx.lineTo(tx1, trackY + 3);
  ctx.stroke();

  // 轨道枕木刻度
  for (let gx = -1.2; gx <= 1.21; gx += 0.2) {
    const x = toX(gx);
    ctx.beginPath();
    ctx.moveTo(x, trackY - 5);
    ctx.lineTo(x, trackY + 5);
    ctx.stroke();
  }

  // 轴线与滑轨交点小刻标
  const axScreen = toX(axisCrossX);
  ctx.fillStyle = "#C4BC9B";
  ctx.beginPath();
  ctx.arc(axScreen, trackY, 3, 0, Math.PI * 2);
  ctx.fill();

  // 清晰可读标注（≥ 10px），左右方向签置于上角留白，绝不被底部摄影机滑柄遮挡
  const fs = H < 120 ? 10 : 11;
  ctx.font = `600 ${fs}px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#C5BC7A";
  ctx.fillText("窗光", toX(0.62), wy + 1);
  ctx.fillStyle = "#F2EAC6";
  ctx.fillText("主角(朝左)", pX + 12, pY - 1);
  ctx.fillStyle = "#F06D5B";
  ctx.fillText("前景同伴", cX + 19, cY);
  if (H >= 120) {
    ctx.fillStyle = "#C4BC9B";
    ctx.fillText("轴线", axScreen + 6, trackY - 13);
    ctx.fillStyle = "rgba(196, 188, 155, 0.85)";
    ctx.fillText("← 同伴落右(背后)", 10, padTop + 14);
    const rText = "同伴落左(视线侧) →";
    ctx.fillText(rText, W - ctx.measureText(rText).width - 10, padTop + 14);
  }

  return { tx0, tx1, trackY, camX, camY };
}
