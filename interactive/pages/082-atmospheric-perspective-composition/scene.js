// 082 空气透视构图 · 2D 画家级山岚大气画布引擎
// 零 ctx.filter 模糊（确保慢手机 6× CPU 降速和软件渲染都稳跑 55–60 fps），
// 用确定性多谐波山脊曲线、针叶剪影频率衰减与谷雾羽化带真实再现 082 原海报、水墨平远江山与晚霞暖雾峡谷。

import { clamp, evaluateAtmosphere } from "./model.js";

// ---------- 确定性山脊与建筑群数据（模块加载时一次性生成，渲染零分配） ----------
function makeRidge(samples, fn) {
  const pts = new Float32Array(samples + 1);
  for (let i = 0; i <= samples; i++) {
    pts[i] = fn(i / samples);
  }
  return pts;
}

// 082 原海报·山岚远城：五层精准构图拓扑
const POSTER_RIDGES = {
  // L5 极远淡峰（左侧山肩 + 中间远谷 + 右侧缓峰）
  l5: makeRidge(100, (u) =>
    0.34 - 0.11 * Math.exp(-((u - 0.15) ** 2) / 0.025)
    - 0.055 * Math.exp(-((u - 0.34) ** 2) / 0.018)
    - 0.085 * Math.exp(-((u - 0.78) ** 2) / 0.032)
    - 0.035 * Math.exp(-((u - 0.94) ** 2) / 0.015)
    - 0.012 * Math.sin(u * 23) - 0.006 * Math.sin(u * 53 + 1.2)
  ),
  // L4 远山基底（托起远景城市天际线）
  l4Base: makeRidge(100, (u) =>
    0.47 - 0.065 * Math.exp(-((u - 0.10) ** 2) / 0.022)
    - 0.045 * Math.exp(-((u - 0.88) ** 2) / 0.028)
    - 0.018 * Math.sin(u * 17 + 0.6) - 0.007 * Math.sin(u * 41)
  ),
  // L3 中景湖岭（左右山峦合抱中央蜿蜒江面）
  l3Left: makeRidge(80, (u) =>
    0.58 - 0.095 * Math.exp(-((u - 0.16) ** 2) / 0.038)
    - 0.045 * Math.exp(-((u - 0.38) ** 2) / 0.024)
    - 0.012 * Math.sin(u * 29 + 0.4)
  ),
  l3Right: makeRidge(80, (u) =>
    0.61 - 0.115 * Math.exp(-((u - 0.84) ** 2) / 0.036)
    - 0.05 * Math.exp(-((u - 0.64) ** 2) / 0.022)
    - 0.014 * Math.sin(u * 25 + 1.8)
  ),
  // L2 近中山脊（左侧斜降护岸至底中 0.63 + 右缘低矮松岬 0.78..1，把 082 原海报中央蜿蜒银白河谷与松洲完整透出来）
  l2Left: makeRidge(100, (u) => {
    const t = clamp(u / 0.63, 0, 1);
    return 0.54 + 0.50 * Math.pow(t, 1.15) - 0.032 * Math.exp(-((u - 0.09) ** 2) / 0.015)
      - 0.014 * Math.sin(u * 28 + 0.7) - 0.006 * Math.sin(u * 59);
  }),
  l2Right: makeRidge(60, (u) => {
    const t = clamp((u - 0.78) / 0.22, 0, 1);
    return 1.00 - 0.23 * Math.pow(t, 1.15) - 0.010 * Math.sin(u * 35);
  }),
  // L1 近景松崖（左下角陡峭岩崖向中下倾落）
  l1: makeRidge(90, (u) => {
    if (u < 0.50) {
      const t = u / 0.50;
      return 0.67 + 0.35 * Math.pow(t, 1.38) - 0.035 * Math.exp(-((t - 0.22) ** 2) / 0.04)
        - 0.012 * Math.sin(t * 21) - 0.005 * Math.cos(t * 47);
    }
    return 1.08;
  }),
};

// 082 原海报同款现代城市天际线塔楼定义（归一化 x, w, topY, style）
const POSTER_TOWERS = [
  { x: 0.195, w: 0.016, top: 0.412, style: "flat" },
  { x: 0.222, w: 0.022, top: 0.365, style: "flat" },
  { x: 0.254, w: 0.015, top: 0.402, style: "step" },
  { x: 0.278, w: 0.018, top: 0.390, style: "flat" },
  { x: 0.304, w: 0.014, top: 0.415, style: "flat" },
  { x: 0.335, w: 0.032, top: 0.310, style: "slant" },  // 左侧标志斜顶摩天楼
  { x: 0.376, w: 0.016, top: 0.382, style: "flat" },
  { x: 0.402, w: 0.028, top: 0.276, style: "spire", spireTop: 0.215 }, // 中央最高尖塔
  { x: 0.436, w: 0.022, top: 0.345, style: "step" },
  { x: 0.468, w: 0.018, top: 0.368, style: "flat" },
  { x: 0.494, w: 0.024, top: 0.352, style: "slantR" },
  { x: 0.526, w: 0.016, top: 0.388, style: "flat" },
  { x: 0.548, w: 0.020, top: 0.334, style: "spire", spireTop: 0.304 },
  { x: 0.576, w: 0.016, top: 0.398, style: "flat" },
  { x: 0.600, w: 0.022, top: 0.378, style: "step" },
  { x: 0.630, w: 0.015, top: 0.412, style: "flat" },
  { x: 0.654, w: 0.018, top: 0.404, style: "flat" },
  { x: 0.684, w: 0.014, top: 0.422, style: "flat" },
];

// 水墨·平远江山（北宋郭熙《林泉高致》意象）
const SHANSHUI_RIDGES = {
  l5: makeRidge(100, (u) =>
    0.33 - 0.12 * Math.exp(-((u - 0.62) ** 2) / 0.028)
    - 0.08 * Math.exp(-((u - 0.24) ** 2) / 0.025)
    - 0.05 * Math.exp(-((u - 0.86) ** 2) / 0.018)
    - 0.014 * Math.sin(u * 19 + 0.5)
  ),
  l4: makeRidge(100, (u) =>
    0.47 - 0.13 * Math.exp(-((u - 0.34) ** 2) / 0.022)
    - 0.095 * Math.exp(-((u - 0.74) ** 2) / 0.024)
    - 0.04 * Math.exp(-((u - 0.12) ** 2) / 0.014)
    - 0.018 * Math.sin(u * 23 + 1.1)
  ),
  l3: makeRidge(100, (u) =>
    0.61 - 0.10 * Math.exp(-((u - 0.78) ** 2) / 0.032)
    - 0.075 * Math.exp(-((u - 0.16) ** 2) / 0.028)
    - 0.015 * Math.sin(u * 27)
  ),
  l2: makeRidge(100, (u) =>
    0.72 - 0.12 * Math.exp(-((u - 0.22) ** 2) / 0.025)
    - 0.065 * Math.exp(-((u - 0.88) ** 2) / 0.022)
    - 0.012 * Math.sin(u * 31 + 0.3)
  ),
  l1: makeRidge(90, (u) => {
    if (u < 0.48) {
      const t = u / 0.48;
      return 0.70 + 0.32 * Math.pow(t, 1.45) - 0.025 * Math.sin(t * 17);
    }
    return 1.08;
  }),
};

// 晚霞·暖雾峡谷（阶梯状方山与峡谷峭壁）
const SUNSET_RIDGES = {
  l5: makeRidge(100, (u) => {
    const mesa1 = u > 0.16 && u < 0.42 ? -0.10 : 0;
    const mesa2 = u > 0.62 && u < 0.88 ? -0.12 : 0;
    return 0.36 + mesa1 * Math.sin(clamp((u - 0.16) / 0.26, 0, 1) * Math.PI) ** 0.35
      + mesa2 * Math.sin(clamp((u - 0.62) / 0.26, 0, 1) * Math.PI) ** 0.35
      - 0.01 * Math.sin(u * 35);
  }),
  l4: makeRidge(100, (u) =>
    0.47 - 0.11 * Math.exp(-((u - 0.46) ** 2) / 0.016)
    - 0.08 * Math.exp(-((u - 0.80) ** 2) / 0.022)
    - 0.07 * Math.exp(-((u - 0.14) ** 2) / 0.020)
    - 0.015 * Math.sin(u * 31 + 0.4)
  ),
  l3: makeRidge(100, (u) =>
    0.59 - 0.105 * Math.exp(-((u - 0.24) ** 2) / 0.026)
    - 0.11 * Math.exp(-((u - 0.78) ** 2) / 0.028)
    - 0.016 * Math.sin(u * 37)
  ),
  l2: makeRidge(100, (u) =>
    0.66 + 0.17 * Math.exp(-((u - 0.56) ** 2) / 0.06)
    - 0.085 * Math.exp(-((u - 0.12) ** 2) / 0.025)
    - 0.065 * Math.exp(-((u - 0.92) ** 2) / 0.02)
    - 0.014 * Math.sin(u * 41 + 1.2)
  ),
  l1: makeRidge(90, (u) => {
    if (u < 0.52) {
      const t = u / 0.52;
      return 0.67 + 0.35 * Math.pow(t, 1.3) - 0.02 * Math.sin(t * 25);
    }
    return 1.08;
  }),
};

// 前景与近中景松树位置表（归一化坐标）
const FOREGROUND_PINES = [
  { x: 0.038, baseY: 0.70, h: 0.175, tiers: 6 },
  { x: 0.095, baseY: 0.71, h: 0.195, tiers: 7 },
  { x: 0.152, baseY: 0.735, h: 0.135, tiers: 5 },
  { x: 0.215, baseY: 0.768, h: 0.160, tiers: 6 },
  { x: 0.275, baseY: 0.805, h: 0.125, tiers: 5 },
  { x: 0.340, baseY: 0.860, h: 0.155, tiers: 6 },
  { x: 0.415, baseY: 0.915, h: 0.130, tiers: 5 },
  { x: 0.478, baseY: 0.962, h: 0.110, tiers: 5 },
];

const MID_PINES = [
  { x: 0.11, h: 0.052 }, { x: 0.16, h: 0.044 }, { x: 0.23, h: 0.056 },
  { x: 0.29, h: 0.048 }, { x: 0.35, h: 0.052 }, { x: 0.43, h: 0.046 },
  { x: 0.51, h: 0.042 }, { x: 0.87, h: 0.054 }, { x: 0.92, h: 0.066 }, { x: 0.97, h: 0.075 },
];

// 漂浮空气微粒种子（26 颗，极轻开销）
const MOTE_SEEDS = Array.from({ length: 26 }, (_, i) => ({
  x: ((i * 37.3 + 11) % 100) / 100,
  y: 0.14 + ((i * 53.7 + 7) % 68) / 100,
  r: 1.1 + (i % 3) * 0.65,
  sp: 0.006 + (i % 5) * 0.0022,
  ph: i * 1.17,
}));

// ---------- 基础绘形辅助 ----------
function rgba(rgb, a = 1) {
  return `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${a})`;
}

function shadeRgb(rgb, factor) {
  return [
    clamp(rgb[0] * factor, 0, 255),
    clamp(rgb[1] * factor, 0, 255),
    clamp(rgb[2] * factor, 0, 255),
  ];
}

function mixRgb(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// 向当前 ctx 路径追加单棵松树剪影（供批量合批为单次 fill，大幅减少 draw calls）
function tracePine(ctx, x, baseY, h, tiers, softness, sharpMode) {
  const detail = sharpMode ? 1 : clamp(1 - softness * 0.88, 0.12, 1);
  const effectiveTiers = Math.max(2, Math.round(tiers * (0.45 + 0.55 * detail)));
  const wMax = h * 0.34;

  // 树干（并入同一路径）
  const tw = Math.max(1.6, h * 0.05);
  ctx.rect(x - tw * 0.5, baseY - h * 0.25, tw, h * 0.29);

  ctx.moveTo(x, baseY - h);
  for (let t = 0; t < effectiveTiers; t++) {
    const f1 = (t + 1) / effectiveTiers;
    const yBottom = baseY - h * (1 - f1 * 0.86);
    const yTuck = yBottom - h * (0.045 * detail);
    const spread = wMax * (0.32 + 0.68 * f1);
    ctx.lineTo(x + spread, yBottom);
    if (t < effectiveTiers - 1) ctx.lineTo(x + spread * (0.42 + 0.16 * (1 - detail)), yTuck);
  }
  ctx.lineTo(x - wMax * 0.96, baseY - h * 0.14);
  for (let t = effectiveTiers - 1; t >= 0; t--) {
    const f1 = (t + 1) / effectiveTiers;
    const yBottom = baseY - h * (1 - f1 * 0.86);
    const yTuck = yBottom - h * (0.045 * detail);
    const spread = wMax * (0.32 + 0.68 * f1);
    if (t < effectiveTiers - 1) ctx.lineTo(x - spread * (0.42 + 0.16 * (1 - detail)), yTuck);
    ctx.lineTo(x - spread, yBottom);
  }
  ctx.closePath();
}

// 绘制单棵东方/高山松树剪影（供独立图元复用）
function drawPine(ctx, x, baseY, h, tiers, color, softness, sharpMode) {
  ctx.fillStyle = color;
  ctx.beginPath();
  tracePine(ctx, x, baseY, h, tiers, softness, sharpMode);
  ctx.fill();
}

// 绘制山脊填充 + 雾化柔和边缘（高速纯路径，按 bottomYRatio 裁去被前层完全遮住的过绘区）
function drawRidgeLayer(ctx, w, h, ridgePts, layer, airHorizonRgb, opts = {}) {
  const {
    yScale = 1,
    yOffset = 0,
    mistFootHeight = 0.16,
    mistStrength = 0.65,
    highlight = false,
    overSharp = false,
    rockFacets = false,
    uStart = 0,
    uEnd = 1,
    bottomYRatio = 1.02,
  } = opts;
  const n = ridgePts.length - 1;
  const iStart = Math.max(0, Math.floor(uStart * n));
  const iEnd = Math.min(n, Math.ceil(uEnd * n));
  const botY = bottomYRatio * h;

  // 根据 softness 决定微锯齿幅值（远山越柔越平滑，过锐模式强加生硬折角）
  const jagAmp = overSharp ? 0.011 : clamp((1 - layer.softness) * 0.0055, 0, 0.006);

  const traceTop = () => {
    for (let i = iStart; i <= iEnd; i++) {
      const u = i / n;
      const jag = jagAmp > 0.0005 ? Math.sin(i * 2.7 + layer.id * 4.1) * jagAmp : 0;
      const px = u * w;
      const py = (ridgePts[i] * yScale + yOffset + jag) * h;
      if (i === iStart) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  };

  // 若需要柔和空气边，先在轮廓外画一道轻柔半透明羽化边（代替昂贵模糊滤镜）
  if (layer.softness > 0.25 && !overSharp) {
    const featherW = 2 + layer.softness * 6.5;
    ctx.beginPath();
    traceTop();
    ctx.strokeStyle = rgba(layer.rgb, 0.22 * layer.softness);
    ctx.lineWidth = featherW;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  // 主体山坡渐变：山顶本色 → 山脚自然融入谷雾空气光
  let minY = h;
  for (let i = iStart; i <= iEnd; i++) {
    const py = (ridgePts[i] * yScale + yOffset) * h;
    if (py < minY) minY = py;
  }

  const grad = ctx.createLinearGradient(0, minY, 0, Math.min(botY, minY + h * (0.28 + mistFootHeight)));
  const crestRgb = shadeRgb(layer.rgb, 0.96);
  const footMix = clamp(mistStrength * (0.22 + layer.airlightRatio * 0.72), 0.04, 0.88);
  const footRgb = mixRgb(layer.rgb, airHorizonRgb, footMix);
  grad.addColorStop(0, rgba(crestRgb, 1));
  grad.addColorStop(0.58, rgba(layer.rgb, 1));
  grad.addColorStop(1, rgba(footRgb, 1));

  ctx.beginPath();
  traceTop();
  ctx.lineTo((iEnd / n) * w, botY);
  ctx.lineTo((iStart / n) * w, botY);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 近景岩壁立体暗面刻画（仅在低柔化/锐利前景展现，模拟真实肌理与「近景清晰锐利」）
  if (rockFacets && layer.softness < 0.55) {
    const facetAlpha = clamp((1 - layer.softness * 1.4) * 0.36, 0, 0.38);
    ctx.fillStyle = rgba(shadeRgb(layer.rgb, 0.62), facetAlpha);
    ctx.beginPath();
    ctx.moveTo(0, ridgePts[0] * h);
    ctx.lineTo(w * 0.12, ridgePts[Math.floor(n * 0.12)] * h + h * 0.03);
    ctx.lineTo(w * 0.21, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 岩脊高光斜线
    ctx.strokeStyle = rgba(mixRgb(layer.rgb, airHorizonRgb, 0.35), facetAlpha * 0.9);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.07, h * 0.72);
    ctx.lineTo(w * 0.16, h * 0.88);
    ctx.moveTo(w * 0.14, h * 0.75);
    ctx.lineTo(w * 0.26, h * 0.94);
    ctx.stroke();
  }

  // 过锐错态：在远山边缘强行画出生硬黑线，直观呈现"违背远山无皴"的贴纸割裂感
  if (overSharp && layer.id >= 2) {
    ctx.beginPath();
    traceTop();
    ctx.strokeStyle = rgba(shadeRgb(layer.rgb, 0.45), 0.78);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // 被选中的图层：给山脊加一道细腻的雾紫/微亮高亮呼吸线
  if (highlight) {
    ctx.save();
    ctx.beginPath();
    traceTop();
    ctx.strokeStyle = layer.luma > 68 ? "rgba(83, 73, 120, 0.88)" : "rgba(248, 244, 236, 0.92)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }
}

// 绘制 082 原海报远景城市剪影（L4，全部 18 栋塔楼合批为单次 fill / stroke，极速软渲染）
function drawCitySkyline(ctx, w, h, layer, airHorizonRgb, highlight, overSharp) {
  const baseLineY = h * 0.485;
  const grad = ctx.createLinearGradient(0, h * 0.22, 0, baseLineY);
  const mistFade = clamp(0.18 + layer.airlightRatio * 0.76, 0.1, 0.92);
  grad.addColorStop(0, rgba(layer.rgb, 0.98));
  grad.addColorStop(0.68, rgba(mixRgb(layer.rgb, airHorizonRgb, mistFade * 0.45), 0.95));
  grad.addColorStop(1, rgba(mixRgb(layer.rgb, airHorizonRgb, mistFade), 0.92));

  // 1) 合并全部 18 座大楼轮廓与塔冠为 1 次 fill
  ctx.beginPath();
  for (const t of POSTER_TOWERS) {
    const bx = t.x * w;
    const bw = t.w * w;
    const topY = t.top * h;
    const bh = baseLineY - topY;
    if (t.style === "slant") {
      ctx.moveTo(bx, topY + bw * 0.55);
      ctx.lineTo(bx + bw, topY);
      ctx.lineTo(bx + bw, baseLineY);
      ctx.lineTo(bx, baseLineY);
      ctx.closePath();
    } else if (t.style === "slantR") {
      ctx.moveTo(bx, topY);
      ctx.lineTo(bx + bw, topY + bw * 0.45);
      ctx.lineTo(bx + bw, baseLineY);
      ctx.lineTo(bx, baseLineY);
      ctx.closePath();
    } else if (t.style === "step") {
      ctx.moveTo(bx + bw * 0.22, topY);
      ctx.lineTo(bx + bw * 0.78, topY);
      ctx.lineTo(bx + bw * 0.78, topY + bh * 0.18);
      ctx.lineTo(bx + bw, topY + bh * 0.18);
      ctx.lineTo(bx + bw, baseLineY);
      ctx.lineTo(bx, baseLineY);
      ctx.lineTo(bx, topY + bh * 0.18);
      ctx.lineTo(bx + bw * 0.22, topY + bh * 0.18);
      ctx.closePath();
    } else {
      ctx.rect(bx, topY, bw, bh);
    }
    if (t.style === "spire") {
      ctx.rect(bx + bw * 0.34, topY - (topY - t.spireTop * h) * 0.45, bw * 0.32, (topY - t.spireTop * h) * 0.48);
    }
  }
  ctx.fillStyle = grad;
  ctx.fill();
  if (overSharp) {
    ctx.strokeStyle = rgba(shadeRgb(layer.rgb, 0.4), 0.78);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // 2) 合并全部尖塔天线为 1 次 stroke
  ctx.beginPath();
  for (const t of POSTER_TOWERS) {
    if (t.style !== "spire") continue;
    const bx = t.x * w + t.w * w * 0.5;
    ctx.moveTo(bx, t.spireTop * h);
    ctx.lineTo(bx, t.top * h);
  }
  ctx.strokeStyle = rgba(layer.rgb, 0.9);
  ctx.lineWidth = Math.max(1.2, w * 0.0022);
  ctx.stroke();

  // 3) 受光侧面微弱立面分割合批为 1 次 fill
  if (layer.softness < 0.72) {
    const sideAlpha = (1 - layer.softness) * 0.22;
    ctx.fillStyle = rgba(mixRgb(layer.rgb, airHorizonRgb, 0.45), sideAlpha);
    ctx.beginPath();
    for (const t of POSTER_TOWERS) {
      const bx = t.x * w;
      const bw = t.w * w;
      const topY = t.top * h;
      const bh = baseLineY - topY;
      ctx.rect(bx + bw * 0.56, topY + (t.style === "slant" ? bw * 0.2 : 0), bw * 0.44, bh * 0.8);
    }
    ctx.fill();
  }

  // 选中提示：轻细顶角取景括号
  if (highlight) {
    ctx.strokeStyle = layer.luma > 68 ? "rgba(83, 73, 120, 0.78)" : "rgba(248, 244, 236, 0.85)";
    ctx.lineWidth = 1.6;
    const x0 = w * 0.185, y0 = h * 0.205, x1 = w * 0.71, y1 = h * 0.455, tick = 14;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + tick); ctx.lineTo(x0, y0); ctx.lineTo(x0 + tick, y0);
    ctx.moveTo(x1 - tick, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + tick);
    ctx.moveTo(x0, y1 - tick); ctx.lineTo(x0, y1); ctx.lineTo(x0 + tick, y1);
    ctx.moveTo(x1 - tick, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - tick);
    ctx.stroke();
  }
}

// 绘制 082 原海报中景蜿蜒河面与河中松洲（在 L3 中景湖岭前下方自然流出，由 L2 近岸夹抱）
function drawValleyRiver(ctx, w, h, l3, l2, air, effBeta) {
  const hazeBoost = clamp(0.14 + effBeta * 2.8, 0.10, 0.88);
  const riverGrad = ctx.createLinearGradient(0, h * 0.60, 0, h);
  const topWater = mixRgb(l3.rgb, air.horizonRgb, clamp(0.45 + hazeBoost * 0.45, 0.35, 0.94));
  const midWater = mixRgb(l3.rgb, air.skyRgb, clamp(0.32 + hazeBoost * 0.42, 0.22, 0.86));
  const botWater = mixRgb(l2.rgb, air.skyRgb, clamp(0.28 + hazeBoost * 0.38, 0.18, 0.78));
  riverGrad.addColorStop(0, rgba(topWater, 0.94));
  riverGrad.addColorStop(0.52, rgba(midWater, 0.97));
  riverGrad.addColorStop(1, rgba(botWater, 1));

  // S 形蜿蜒宽河湾（从两翼山坳流出，先向右绕过左岸山嘴，再弯向右下展开）
  ctx.save();
  ctx.fillStyle = riverGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.33, h * 0.605);
  ctx.bezierCurveTo(w * 0.48, h * 0.602, w * 0.66, h * 0.625, w * 0.88, h * 0.665);
  ctx.bezierCurveTo(w * 0.96, h * 0.680, w * 0.99, h * 0.735, w * 1.0, h * 0.78);
  ctx.lineTo(w, h);
  ctx.lineTo(w * 0.42, h);
  ctx.bezierCurveTo(w * 0.48, h * 0.90, w * 0.56, h * 0.82, w * 0.46, h * 0.755);
  ctx.bezierCurveTo(w * 0.36, h * 0.705, w * 0.40, h * 0.655, w * 0.28, h * 0.628);
  ctx.closePath();
  ctx.fill();

  // 中央高光银白水道（1:1 呼应原海报镜面天光倒影）
  const glintCol = mixRgb(air.horizonRgb, [252, 250, 244], 0.55);
  ctx.fillStyle = rgba(glintCol, clamp(0.36 + hazeBoost * 0.52, 0.28, 0.86));
  ctx.beginPath();
  ctx.moveTo(w * 0.37, h * 0.618);
  ctx.bezierCurveTo(w * 0.52, h * 0.626, w * 0.67, h * 0.652, w * 0.78, h * 0.686);
  ctx.bezierCurveTo(w * 0.66, h * 0.725, w * 0.79, h * 0.772, w * 0.92, h * 0.822);
  ctx.bezierCurveTo(w * 0.79, h * 0.878, w * 0.76, h * 0.942, w * 0.86, h * 1.0);
  ctx.lineTo(w * 0.50, h * 1.0);
  ctx.bezierCurveTo(w * 0.56, h * 0.915, w * 0.65, h * 0.845, w * 0.54, h * 0.778);
  ctx.bezierCurveTo(w * 0.45, h * 0.730, w * 0.50, h * 0.676, w * 0.34, h * 0.640);
  ctx.closePath();
  ctx.fill();

  // 水平细波光条（合批为 1 次 fill）
  ctx.fillStyle = rgba(glintCol, clamp(0.38 + hazeBoost * 0.4, 0.3, 0.78));
  const shimmers = [
    [0.54, 0.652, 0.16, 0.008],
    [0.60, 0.695, 0.19, 0.010],
    [0.58, 0.742, 0.21, 0.011],
    [0.66, 0.794, 0.24, 0.013],
    [0.70, 0.858, 0.22, 0.014],
    [0.64, 0.926, 0.26, 0.015],
  ];
  ctx.beginPath();
  for (const [sx, sy, sw, sh] of shimmers) {
    ctx.moveTo((sx + sw * 0.5) * w, sy * h);
    ctx.ellipse(sx * w, sy * h, sw * w * 0.5, sh * h * 0.5, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // 右岸延伸入湖的细小沙嘴（与松影合批为 1 次 fill）
  const spitCol = rgba(mixRgb(l3.rgb, l2.rgb, 0.35), 0.90);
  ctx.fillStyle = spitCol;
  ctx.beginPath();
  ctx.ellipse(w * 0.78, h * 0.732, w * 0.095, h * 0.013, -0.05, 0, Math.PI * 2);
  tracePine(ctx, w * 0.74, h * 0.730, h * 0.036, 3, l3.softness, false);
  tracePine(ctx, w * 0.775, h * 0.732, h * 0.044, 4, l3.softness, false);
  ctx.fill();

  // 湖中小洲与松影（合批为 1 次 fill，呼应 082 原海报右下河湾松洲）
  const islandCol = rgba(mixRgb(l2.rgb, l3.rgb, 0.26), 0.95);
  ctx.fillStyle = islandCol;
  ctx.beginPath();
  ctx.ellipse(w * 0.685, h * 0.875, w * 0.072, h * 0.016, -0.03, 0, Math.PI * 2);
  tracePine(ctx, w * 0.658, h * 0.873, h * 0.056, 4, l2.softness, false);
  tracePine(ctx, w * 0.692, h * 0.875, h * 0.042, 3, l2.softness, false);
  tracePine(ctx, w * 0.718, h * 0.876, h * 0.034, 3, l2.softness, false);
  ctx.fill();
  ctx.restore();
}

// 绘制低谷漂浮烟岚丝带
function drawMistRibbon(ctx, w, h, yNorm, bandH, rgb, alpha) {
  if (alpha < 0.02) return;
  const y0 = (yNorm - bandH * 0.5) * h;
  const y1 = (yNorm + bandH * 0.5) * h;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(rgb, 0));
  g.addColorStop(0.5, rgba(rgb, alpha));
  g.addColorStop(1, rgba(rgb, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, w, y1 - y0);
}

// 绘制水墨江渚小亭（纯剪影，无人脸细节）
function drawPavilion(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.15, y - size * 0.65);
  ctx.quadraticCurveTo(x, y - size * 1.15, x + size * 1.15, y - size * 0.65);
  ctx.lineTo(x + size * 0.78, y - size * 0.52);
  ctx.lineTo(x - size * 0.78, y - size * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - size * 0.52, y - size * 0.55, size * 0.12, size * 0.58);
  ctx.fillRect(x + size * 0.40, y - size * 0.55, size * 0.12, size * 0.58);
}

// 绘制天空飞鸟（极简弧翼，合批为 1 次 stroke）
function drawBirds(ctx, w, h, color, alpha, t, still) {
  if (alpha < 0.06) return;
  const birds = [
    [0.57, 0.255, 1.0],
    [0.62, 0.268, 0.85],
    [0.655, 0.245, 0.75],
    [0.695, 0.262, 0.65],
    [0.19, 0.305, 0.7],
  ];
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = Math.max(1.1, w * 0.0018);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < birds.length; i++) {
    const [bx, by, sc] = birds[i];
    const flap = still ? 0 : Math.sin(t * 2.2 + i * 1.3) * 1.6;
    const x = bx * w;
    const y = by * h;
    const s = Math.min(w, h) * 0.014 * sc;
    ctx.moveTo(x - s, y + flap);
    ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.48, x, y);
    ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.48, x + s, y + flap);
  }
  ctx.stroke();
}

// ---------- 静态山景与 Koschmieder 双精灵层缓存（静置与横拖浊度全走 drawImage 合批，软渲染 6× 也能稳跑 55–60 fps） ----------
const _heroCache = { canvas: null, key: "" };
const _dragSprites = { key: "", cw: 0, ch: 0, sky: null, layers: [] };

function makeCacheKey(w, h, dpr, evalData, state) {
  const tb = (state.layerToneBias || []).map((v) => Math.round(v * 100)).join(",");
  const sb = (state.layerSatBias || []).map((v) => Math.round(v * 100)).join(",");
  return `${Math.round(w)}x${Math.round(h)}@${dpr.toFixed(2)}|${state.scene}|${state.airlight}|${state.edgeMode}|${evalData.effBeta.toFixed(4)}|${state.selectedLayer}|${tb}|${sb}`;
}

function makeSpriteKey(cw, ch, state) {
  const tb = (state.layerToneBias || []).map((v) => Math.round(v * 100)).join(",");
  const sb = (state.layerSatBias || []).map((v) => Math.round(v * 100)).join(",");
  return `${cw}x${ch}|${state.scene}|${state.airlight}|${state.edgeMode}|${state.selectedLayer}|${tb}|${sb}`;
}

function drawSkyBackdrop(ctx, w, h, evalData, state) {
  const { scene, air, effBeta } = evalData;
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  skyGrad.addColorStop(0, rgba(scene.paperTop, 1));
  skyGrad.addColorStop(0.55, rgba(mixRgb(scene.paperTop, air.horizonRgb, 0.55), 1));
  skyGrad.addColorStop(1, rgba(air.horizonRgb, 1));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const sunX = state.scene === "sunset" ? w * 0.52 : w * 0.47;
  const sunY = state.scene === "sunset" ? h * 0.30 : h * 0.25;
  const sunR = Math.min(w, h) * 0.34;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.06, sunX, sunY, sunR);
  sunGrad.addColorStop(0, rgba(scene.skyGlow, 0.92));
  sunGrad.addColorStop(0.55, rgba(air.horizonRgb, 0.42));
  sunGrad.addColorStop(1, rgba(air.horizonRgb, 0));
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h * 0.68);

  ctx.fillStyle = rgba(mixRgb(air.skyRgb, [185, 192, 206], 0.25), clamp(0.14 + effBeta * 0.45, 0.08, 0.32));
  ctx.beginPath();
  ctx.ellipse(w * 0.80, h * 0.16, w * 0.20, h * 0.045, -0.06, 0, Math.PI * 2);
  ctx.ellipse(w * 0.68, h * 0.19, w * 0.14, h * 0.032, 0.04, 0, Math.PI * 2);
  ctx.fill();
}

// 绘制单层地景（idx: 4=L5极远 .. 0=L1近景），同时服务直接绘制与双精灵缓存
function drawSingleLandscapeLayer(ctx, w, h, idx, evalData, state) {
  const { air, edge, layers, effBeta } = evalData;
  const overSharp = edge.id === "oversharp";
  const sel = state.selectedLayer;

  if (state.scene === "poster") {
    if (idx === 4) {
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l5, layers[4], air.horizonRgb, {
        mistFootHeight: 0.20, mistStrength: 0.9, highlight: sel === 4, overSharp, bottomYRatio: 0.56,
      });
    } else if (idx === 3) {
      drawCitySkyline(ctx, w, h, layers[3], air.horizonRgb, sel === 3, overSharp);
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l4Base, layers[3], air.horizonRgb, {
        mistFootHeight: 0.18, mistStrength: 0.85, highlight: false, overSharp, bottomYRatio: 0.66,
      });
    } else if (idx === 2) {
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l3Left, layers[2], air.horizonRgb, {
        mistFootHeight: 0.14, mistStrength: 0.72, highlight: sel === 2, overSharp, uStart: 0, uEnd: 0.56, bottomYRatio: 0.88,
      });
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l3Right, layers[2], air.horizonRgb, {
        mistFootHeight: 0.14, mistStrength: 0.72, highlight: sel === 2, overSharp, uStart: 0.50, uEnd: 1, bottomYRatio: 0.88,
      });
      drawValleyRiver(ctx, w, h, layers[2], layers[1], air, effBeta);
    } else if (idx === 1) {
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l2Left, layers[1], air.horizonRgb, {
        mistFootHeight: 0.10, mistStrength: 0.45, highlight: sel === 1, overSharp, uStart: 0, uEnd: 0.63,
      });
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l2Right, layers[1], air.horizonRgb, {
        mistFootHeight: 0.08, mistStrength: 0.36, highlight: sel === 1, overSharp, uStart: 0.78, uEnd: 1,
      });
      ctx.fillStyle = rgba(layers[1].rgb, 0.96);
      ctx.beginPath();
      for (const p of MID_PINES) {
        if (p.x <= 0.60) {
          const id = Math.min(100, Math.round(p.x * 100));
          tracePine(ctx, p.x * w, POSTER_RIDGES.l2Left[id] * h + h * 0.012, p.h * h, 5, layers[1].softness, overSharp);
        } else {
          const id = Math.min(60, Math.round(p.x * 60));
          tracePine(ctx, p.x * w, POSTER_RIDGES.l2Right[id] * h + h * 0.012, p.h * h, 5, layers[1].softness, overSharp);
        }
      }
      ctx.fill();
    } else if (idx === 0) {
      drawRidgeLayer(ctx, w, h, POSTER_RIDGES.l1, layers[0], air.horizonRgb, {
        mistFootHeight: 0.05, mistStrength: 0.18, highlight: sel === 0, overSharp, rockFacets: true, uStart: 0, uEnd: 0.50,
      });
      ctx.fillStyle = rgba(shadeRgb(layers[0].rgb, 0.88), 1);
      ctx.beginPath();
      for (const p of FOREGROUND_PINES) {
        tracePine(ctx, p.x * w, p.baseY * h, p.h * h, p.tiers, layers[0].softness, overSharp);
      }
      tracePine(ctx, w * 0.935, h * 1.02, h * 0.145, 5, layers[0].softness, overSharp);
      tracePine(ctx, w * 0.980, h * 1.01, h * 0.185, 6, layers[0].softness, overSharp);
      ctx.fill();
    }
  } else if (state.scene === "shanshui") {
    if (idx === 4) {
      drawRidgeLayer(ctx, w, h, SHANSHUI_RIDGES.l5, layers[4], air.horizonRgb, {
        mistFootHeight: 0.24, mistStrength: 0.94, highlight: sel === 4, overSharp, bottomYRatio: 0.58,
      });
    } else if (idx === 3) {
      drawRidgeLayer(ctx, w, h, SHANSHUI_RIDGES.l4, layers[3], air.horizonRgb, {
        mistFootHeight: 0.20, mistStrength: 0.86, highlight: sel === 3, overSharp, bottomYRatio: 0.62,
      });
    } else if (idx === 2) {
      const waterG = ctx.createLinearGradient(0, h * 0.54, 0, h);
      waterG.addColorStop(0, rgba(air.horizonRgb, 0.95));
      waterG.addColorStop(1, rgba(mixRgb(air.horizonRgb, layers[2].rgb, 0.22), 0.98));
      ctx.fillStyle = waterG;
      ctx.fillRect(0, h * 0.56, w, h * 0.44);
      drawRidgeLayer(ctx, w, h, SHANSHUI_RIDGES.l3, layers[2], air.horizonRgb, {
        mistFootHeight: 0.15, mistStrength: 0.72, highlight: sel === 2, overSharp, bottomYRatio: 0.86,
      });
    } else if (idx === 1) {
      drawRidgeLayer(ctx, w, h, SHANSHUI_RIDGES.l2, layers[1], air.horizonRgb, {
        mistFootHeight: 0.10, mistStrength: 0.45, highlight: sel === 1, overSharp,
      });
      drawPavilion(ctx, w * 0.22, SHANSHUI_RIDGES.l2[22] * h + h * 0.004, Math.min(w, h) * 0.032, rgba(layers[1].rgb, 0.95));
      ctx.fillStyle = rgba(layers[2].rgb, 0.85);
      ctx.beginPath();
      ctx.moveTo(w * 0.56, h * 0.76);
      ctx.quadraticCurveTo(w * 0.59, h * 0.774, w * 0.625, h * 0.758);
      ctx.closePath();
      ctx.fill();
    } else if (idx === 0) {
      drawRidgeLayer(ctx, w, h, SHANSHUI_RIDGES.l1, layers[0], air.horizonRgb, {
        mistFootHeight: 0.05, mistStrength: 0.16, highlight: sel === 0, overSharp, rockFacets: true, uStart: 0, uEnd: 0.48,
      });
      ctx.fillStyle = rgba(shadeRgb(layers[0].rgb, 0.85), 1);
      ctx.beginPath();
      for (const p of FOREGROUND_PINES.slice(0, 6)) {
        tracePine(ctx, p.x * w, (p.baseY + 0.02) * h, p.h * h * 0.92, p.tiers, layers[0].softness, overSharp);
      }
      ctx.fill();
    }
  } else {
    if (idx === 4) {
      drawRidgeLayer(ctx, w, h, SUNSET_RIDGES.l5, layers[4], air.horizonRgb, {
        mistFootHeight: 0.22, mistStrength: 0.9, highlight: sel === 4, overSharp, bottomYRatio: 0.58,
      });
    } else if (idx === 3) {
      drawRidgeLayer(ctx, w, h, SUNSET_RIDGES.l4, layers[3], air.horizonRgb, {
        mistFootHeight: 0.18, mistStrength: 0.84, highlight: sel === 3, overSharp, bottomYRatio: 0.68,
      });
    } else if (idx === 2) {
      drawRidgeLayer(ctx, w, h, SUNSET_RIDGES.l3, layers[2], air.horizonRgb, {
        mistFootHeight: 0.14, mistStrength: 0.68, highlight: sel === 2, overSharp, bottomYRatio: 0.82,
      });
    } else if (idx === 1) {
      drawRidgeLayer(ctx, w, h, SUNSET_RIDGES.l2, layers[1], air.horizonRgb, {
        mistFootHeight: 0.08, mistStrength: 0.42, highlight: sel === 1, overSharp,
      });
    } else if (idx === 0) {
      drawRidgeLayer(ctx, w, h, SUNSET_RIDGES.l1, layers[0], air.horizonRgb, {
        mistFootHeight: 0.04, mistStrength: 0.14, highlight: sel === 0, overSharp, rockFacets: true, uStart: 0, uEnd: 0.52,
      });
      ctx.fillStyle = rgba(shadeRgb(layers[0].rgb, 0.85), 1);
      ctx.beginPath();
      for (const p of FOREGROUND_PINES.slice(0, 5)) {
        tracePine(ctx, p.x * w, p.baseY * h, p.h * h * 0.78, p.tiers, layers[0].softness, overSharp);
      }
      ctx.fill();
    }
  }
}

function drawHeroStaticLayers(ctx, w, h, evalData, state) {
  const { air, effBeta } = evalData;
  drawSkyBackdrop(ctx, w, h, evalData, state);
  const mistRgb = state.scene === "sunset" ? air.skyRgb : air.horizonRgb;
  drawSingleLandscapeLayer(ctx, w, h, 4, evalData, state);
  drawMistRibbon(ctx, w, h, 0.41, 0.16, mistRgb, clamp(0.14 + effBeta * 2.1, 0.04, 0.72));
  drawSingleLandscapeLayer(ctx, w, h, 3, evalData, state);
  drawMistRibbon(ctx, w, h, 0.51, 0.15, mistRgb, clamp(0.10 + effBeta * 1.85, 0.03, 0.66));
  drawSingleLandscapeLayer(ctx, w, h, 2, evalData, state);
  drawMistRibbon(ctx, w, h, 0.61, 0.11, mistRgb, clamp(0.05 + effBeta * 1.35, 0.02, 0.48));
  drawSingleLandscapeLayer(ctx, w, h, 1, evalData, state);
  drawSingleLandscapeLayer(ctx, w, h, 0, evalData, state);
}

// 预烘焙 β=0（无气清晰）与 β=0.45（浓雾上限）双端精灵，供横拖浊度时按科施米德透射率实时 11 次 drawImage 合成
function ensureDragSprites(w, h, dpr, state) {
  if (typeof document === "undefined") return false;
  const cw = Math.max(1, Math.round(w * dpr));
  const ch = Math.max(1, Math.round(h * dpr));
  const key = makeSpriteKey(cw, ch, state);
  if (_dragSprites.key === key && _dragSprites.cw === cw && _dragSprites.ch === ch) return true;

  const alloc = (old) => {
    const c = old || document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const x = c.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    return { c, x };
  };

  const st0 = { ...state, turbidity: 0 };
  const st1 = { ...state, turbidity: 0.45 };
  const ev0 = evaluateAtmosphere(st0);
  const ev1 = evaluateAtmosphere(st1);

  const skyObj = alloc(_dragSprites.sky);
  drawSkyBackdrop(skyObj.x, w, h, ev0, st0);
  _dragSprites.sky = skyObj.c;

  if (_dragSprites.layers.length !== 5) _dragSprites.layers = Array.from({ length: 5 }, () => ({ clear: null, fog: null }));
  for (let i = 0; i < 5; i++) {
    const cObj = alloc(_dragSprites.layers[i].clear);
    drawSingleLandscapeLayer(cObj.x, w, h, i, ev0, st0);
    _dragSprites.layers[i].clear = cObj.c;

    const fObj = alloc(_dragSprites.layers[i].fog);
    drawSingleLandscapeLayer(fObj.x, w, h, i, ev1, st1);
    _dragSprites.layers[i].fog = fObj.c;
  }

  _dragSprites.key = key;
  _dragSprites.cw = cw;
  _dragSprites.ch = ch;
  return true;
}

export function warmHeroDragSprites(w, h, dpr, state) {
  ensureDragSprites(w, h, dpr, state);
}

// ---------- 主舞台绘制入口 ----------
// 返回 5 个图层的可点击屏幕热区，便于精确点击选层
export function drawHeroScene(ctx, w, h, evalData, state, t = 0, still = false, opts = {}) {
  const { air, layers, effBeta } = evalData;
  const sel = state.selectedLayer;
  const dpr = opts.dpr || 1;
  const liveDrag = !!opts.liveDrag;
  const useSprites = liveDrag && opts.turbidityOnly && ensureDragSprites(w, h, dpr, state);

  if (useSprites) {
    // 科施米德双端精灵实时混合：每层仅 2 次 drawImage（先以浓雾底遮挡后层，再按精准指数权重叠加清晰层）
    ctx.drawImage(_dragSprites.sky, 0, 0, w, h);
    for (let i = 4; i >= 0; i--) {
      const d = layers[i].distKm;
      const tMin = Math.exp(-0.45 * d);
      const tCur = Math.exp(-effBeta * d);
      const clearWeight = clamp((tCur - tMin) / Math.max(1e-4, 1 - tMin), 0, 1);
      ctx.globalAlpha = 1;
      ctx.drawImage(_dragSprites.layers[i].fog, 0, 0, w, h);
      if (clearWeight > 0.01) {
        ctx.globalAlpha = clearWeight;
        ctx.drawImage(_dragSprites.layers[i].clear, 0, 0, w, h);
      }
    }
    ctx.globalAlpha = 1;
  } else if (liveDrag || typeof document === "undefined") {
    drawHeroStaticLayers(ctx, w, h, evalData, state);
  } else {
    const key = makeCacheKey(w, h, dpr, evalData, state);
    if (!_heroCache.canvas) _heroCache.canvas = document.createElement("canvas");
    const cw = Math.max(1, Math.round(w * dpr));
    const ch = Math.max(1, Math.round(h * dpr));
    if (_heroCache.key !== key || _heroCache.canvas.width !== cw || _heroCache.canvas.height !== ch) {
      _heroCache.canvas.width = cw;
      _heroCache.canvas.height = ch;
      const cctx = _heroCache.canvas.getContext("2d");
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawHeroStaticLayers(cctx, w, h, evalData, state);
      _heroCache.key = key;
    }
    ctx.drawImage(_heroCache.canvas, 0, 0, w, h);
  }

  // 飞鸟（动态轻量层）
  drawBirds(ctx, w, h, layers[3].rgb, clamp(0.68 - effBeta * 1.1, 0.16, 0.68), t, still);

  // 3. 悬浮空气微粒（26 颗合批为 1 次 fill，呼应 082 原海报「空气感」微粒圆徽）
  if (effBeta > 0.025) {
    const moteAlpha = clamp((effBeta - 0.02) * 1.5, 0, 0.45);
    ctx.fillStyle = rgba(air.horizonRgb, moteAlpha);
    ctx.beginPath();
    for (const m of MOTE_SEEDS) {
      const mx = ((m.x + (still ? 0 : t * m.sp)) % 1) * w;
      const my = (m.y + (still ? 0 : Math.sin(t * 0.7 + m.ph) * 0.008)) * h;
      ctx.moveTo(mx + m.r, my);
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // 4. 若开启光学深度扫描标尺（点击底沿取景框眼睛），或有明显倒挂/错态，叠绘清晰克制的画内标牌
  const anchors = [
    { id: 0, x: 0.16, y: 0.84 },
    { id: 1, x: 0.30, y: 0.70 },
    { id: 2, x: 0.68, y: 0.62 },
    { id: 3, x: 0.42, y: 0.36 },
    { id: 4, x: 0.78, y: 0.26 },
  ];

  // 光学测距标注（切换视图眼睛开启，或者对选中层显示极简点标）
  const invSet = new Set(evalData.inversions.map((v) => v.farIdx));
  for (const a of anchors) {
    const L = layers[a.id];
    const px = a.x * w;
    const py = a.y * h;
    const isSel = a.id === sel;
    const isInv = invSet.has(a.id);

    if (!state.showDepthGuides && !isSel && !isInv) continue;

    const pillText = isInv
      ? `× ${L.code} ${L.name} · 明度 ${Math.round(L.luma)}% 倒挂`
      : state.showDepthGuides
        ? `${L.code} ${L.distKm}km · L${Math.round(L.luma)}% · 透射 ${Math.round(L.transmittance * 100)}%`
        : `${L.code} ${L.name} · ${L.distKm}km · 明度 ${Math.round(L.luma)}%`;

    const fontPx = clamp(Math.round(w * 0.0145), 11, 13);
    ctx.font = `600 ${fontPx}px "Chivo", "Noto Serif SC", sans-serif`;
    const tw = ctx.measureText(pillText).width;
    const padX = 9;
    const ph = fontPx + 10;
    const pw = tw + padX * 2;
    const bx = clamp(px - pw / 2, 10, w - pw - 10);
    const by = clamp(py - ph / 2, 10, h - ph - 10);

    // 锚点圆
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isInv ? "#B3422E" : "#534978";
    ctx.fill();

    // 轻盈药丸标签
    ctx.fillStyle = isInv ? "rgba(179, 66, 46, 0.94)" : "rgba(26, 46, 60, 0.86)";
    ctx.fillRect(bx, by, pw, ph);
    ctx.strokeStyle = isInv ? "rgba(255, 224, 214, 0.85)" : "rgba(200, 190, 232, 0.75)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, pw - 1, ph - 1);

    ctx.fillStyle = "#FAF7F0";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, bx + padX, by + ph / 2 + 0.5);
  }

  return anchors;
}

// ---------- 命中检测：根据点击坐标判断落在哪一层山景 ----------
export function hitTestLayer(u, v, sceneId) {
  const ridges = sceneId === "shanshui" ? SHANSHUI_RIDGES : sceneId === "sunset" ? SUNSET_RIDGES : POSTER_RIDGES;
  const idx = (arr) => clamp(Math.round(u * (arr.length - 1)), 0, arr.length - 1);

  if (v >= ridges.l1[idx(ridges.l1)] - 0.05) return 0; // L1 近景松崖
  if (sceneId === "poster") {
    if (u <= 0.63 && v >= ridges.l2Left[idx(ridges.l2Left)] - 0.03) return 1; // L2 左岸近中山脊
    if (u >= 0.78 && v >= ridges.l2Right[idx(ridges.l2Right)] - 0.03) return 1; // L2 右岬
    const r3 = u < 0.52 ? ridges.l3Left[idx(ridges.l3Left)] : ridges.l3Right[idx(ridges.l3Right)];
    if (v >= r3 - 0.02 || v >= 0.58) return 2; // L3 中景湖岭与河谷
    if (v >= 0.25 && u >= 0.18 && u <= 0.72) return 3; // L4 远景城廓
    if (v >= ridges.l4Base[idx(ridges.l4Base)] - 0.02) return 3;
    return 4; // L5 极远山影
  }
  if (v >= ridges.l2[idx(ridges.l2)] - 0.03) return 1;
  if (v >= ridges.l3[idx(ridges.l3)] - 0.02) return 2;
  if (v >= ridges.l4[idx(ridges.l4)] - 0.02) return 3;
  return 4;
}

// ---------- 辅助微型山峦绘制（用于第 02 节四因子剥离、第 03 节灰度幕帘、第 06 节小练习） ----------
export function drawCompactLandscape(ctx, w, h, opts) {
  const {
    layerColors,         // 5 或 4 个 RGB 数组（近→远）
    skyTop = [245, 238, 227],
    skyBot = [235, 237, 242],
    hasOverlap = true,   // 层次遮挡开关
    softFar = true,      // 边缘柔化开关
    greyscale = false,   // 是否灰度化
    mode = "landscape",  // landscape | illustration | ui
    showTower = true,
  } = opts;

  const toCol = (rgb, a = 1) => {
    if (!greyscale) return rgba(rgb, a);
    const y = Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);
    return `rgba(${y},${y},${y},${a})`;
  };

  if (mode === "ui") {
    // UI 地图 / 空间层级示意：用空气透视表达背景底图、次级层与前景操作卡片
    ctx.fillStyle = toCol(skyBot);
    ctx.fillRect(0, 0, w, h);
    // 远层地图网格与浅灰轮廓
    ctx.strokeStyle = toCol(layerColors[layerColors.length - 1], 0.8);
    ctx.lineWidth = 1;
    for (let gx = w * 0.1; gx < w; gx += w * 0.12) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = h * 0.15; gy < h; gy += h * 0.18) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    // 4 叠阶梯层卡（由远及近，明度由浅入深、反差由弱变强）
    const cards = [
      { x: 0.44, y: 0.10, cw: 0.48, ch: 0.50, c: layerColors[3] || layerColors[layerColors.length - 1] },
      { x: 0.28, y: 0.22, cw: 0.50, ch: 0.52, c: layerColors[2] },
      { x: 0.16, y: 0.36, cw: 0.52, ch: 0.48, c: layerColors[1] },
      { x: 0.07, y: 0.50, cw: 0.54, ch: 0.42, c: layerColors[0] },
    ];
    for (let i = 0; i < cards.length; i++) {
      const k = cards[i];
      ctx.fillStyle = toCol(k.c, 0.96);
      ctx.fillRect(k.x * w, k.y * h, k.cw * w, k.ch * h);
      ctx.strokeStyle = toCol(skyTop, 0.45);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(k.x * w, k.y * h, k.cw * w, k.ch * h);
      // 模拟文字占位条（远层浅淡，近层高反差清晰）
      ctx.fillStyle = toCol(skyTop, 0.35 + i * 0.18);
      ctx.fillRect((k.x + 0.04) * w, (k.y + 0.08) * h, k.cw * w * 0.45, Math.max(4, h * 0.03));
      ctx.fillRect((k.x + 0.04) * w, (k.y + 0.16) * h, k.cw * w * 0.72, Math.max(3, h * 0.018));
    }
    return;
  }

  // 天空背景
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  g.addColorStop(0, toCol(skyTop));
  g.addColorStop(1, toCol(skyBot));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 日轮柔光
  ctx.fillStyle = toCol([252, 248, 240], 0.55);
  ctx.beginPath();
  ctx.arc(w * 0.64, h * 0.26, Math.min(w, h) * 0.16, 0, Math.PI * 2);
  ctx.fill();

  const count = layerColors.length; // 4 层：0近 → count-1远
  // 从远到近绘制
  for (let i = count - 1; i >= 0; i--) {
    const col = layerColors[i];
    const baseRatio = 0.32 + (count - 1 - i) * (hasOverlap ? 0.155 : 0.175);
    const amp = mode === "illustration" ? 0.15 : 0.12;

    if (!hasOverlap) {
      // 关闭层次遮挡时：四座孤山并排平摊，不发生前后叠压
      const segW = w / count;
      const sx = i * segW;
      ctx.fillStyle = toCol(col, 1);
      ctx.beginPath();
      ctx.moveTo(sx + segW * 0.06, h * 0.86);
      ctx.lineTo(sx + segW * 0.50, h * (0.34 + i * 0.04));
      ctx.lineTo(sx + segW * 0.94, h * 0.86);
      ctx.closePath();
      ctx.fill();
      continue;
    }

    // 远景高塔（在倒数第二层 i === count - 2 绘制）
    if (showTower && i === count - 2) {
      const tx = w * 0.49;
      const tw = w * 0.055;
      const topY = h * 0.18;
      const botY = h * (baseRatio + 0.14);
      ctx.fillStyle = toCol(col, 1);
      ctx.fillRect(tx - tw * 0.5, topY + (botY - topY) * 0.25, tw, (botY - topY) * 0.75);
      ctx.fillRect(tx - tw * 0.24, topY + (botY - topY) * 0.1, tw * 0.48, (botY - topY) * 0.18);
      ctx.fillRect(tx - 1, topY, 2, (botY - topY) * 0.14);
      // 侧翼两座低楼
      ctx.fillRect(tx - tw * 1.45, topY + (botY - topY) * 0.48, tw * 0.72, (botY - topY) * 0.52);
      ctx.fillRect(tx + tw * 0.78, topY + (botY - topY) * 0.42, tw * 0.82, (botY - topY) * 0.58);
    }

    // 山脊路径
    const steps = 48;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const peakA = Math.exp(-((u - (0.22 + i * 0.17) % 0.85) ** 2) / 0.045);
      const peakB = Math.exp(-((u - (0.76 - i * 0.14)) ** 2) / 0.05);
      const jag = !softFar || i === 0 ? Math.sin(s * 2.4 + i) * 0.008 : 0;
      const py = h * (baseRatio - amp * (peakA * 0.85 + peakB * 0.65) + jag);
      if (s === 0) ctx.moveTo(0, py);
      else ctx.lineTo(u * w, py);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    // 柔和雾脚（如果开启 softFar）
    if (softFar && i >= 1) {
      const lg = ctx.createLinearGradient(0, h * (baseRatio - amp), 0, h * Math.min(1, baseRatio + 0.22));
      lg.addColorStop(0, toCol(col, 1));
      lg.addColorStop(1, toCol(mixRgb(col, skyBot, 0.34 * (i / (count - 1))), 1));
      ctx.fillStyle = lg;
    } else {
      ctx.fillStyle = toCol(col, 1);
    }
    ctx.fill();

    // 关闭柔和时：给远山加生硬黑轮廓
    if (!softFar && i >= 1) {
      ctx.strokeStyle = toCol(shadeRgb(col, 0.45), 0.75);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // 前景松树剪影
    if (i === 0) {
      const treeCol = toCol(shadeRgb(col, 0.85), 1);
      drawPine(ctx, w * 0.12, h * 0.86, h * 0.24, 5, treeCol, 0.05, !softFar);
      drawPine(ctx, w * 0.22, h * 0.90, h * 0.19, 5, treeCol, 0.05, !softFar);
      drawPine(ctx, w * 0.88, h * 0.92, h * 0.20, 5, treeCol, 0.05, !softFar);
    }
  }
}
