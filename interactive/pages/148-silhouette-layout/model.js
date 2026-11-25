// 148 剪影 版式 · 单一几何与排版真源模型
// 画布上绘制的剪影贝塞尔轮廓、逐行绕排文字坐标、图底对比度、占地面积占比与诊断文案，全部从这里同源算出。

export const STAGE_W = 720;
export const STAGE_H = 540;

export const PALETTE = {
  paper: [250, 241, 228],       // #FAF1E4 原海报暖米纸
  paperFog: [224, 217, 204],    // 低显影时的灰雾底纸
  charcoal: [36, 36, 36],       // #242424 原海报炭黑剪影
  charcoalFog: [148, 143, 134], // 低显影时的灰软未提纯影体
  olive: [109, 106, 65],        // #6D6A41 原海报干橄榄苔绿
  oliveFog: [176, 172, 155],    // 灰雾态橄榄角块
};

// 经验参考带（统一唯一来源，供诊断、标尺与正文共用）
export const BANDS = {
  exposureMin: 78,     // 逆光压黑达标线（对应对比度 ≥ 7.0:1）
  contrastMin: 7.0,    // 经验强图底对比门槛
  gapMin: 12,          // 轮廓呼吸缝下限（px，逻辑画布 720 宽下约 1.7% 画宽）
  gapMax: 44,          // 轮廓呼吸缝上限（px，超过则文字与形体脱节）
  gapSweet: [16, 34],  // 经验舒适呼吸带
  areaMin: 26,         // 剪影面积占比下限（%）
  areaMax: 56,         // 剪影面积占比上限（%）
  whitespaceMin: 34,   // 暖白净留白经验下限（%）
};

// 3 套剪影题材：均采用无五官、高特征拐点的纯外轮廓，面向左侧文字区展开
// profilePts 为基准体量下（scale=1.0）剪影左外沿从顶部 y=0 到 y=1 的归一化折线控制点，经平滑插值形成精确边缘函数 xEdge(y)
export const THEMES = {
  portrait: {
    id: "portrait",
    label: "人像侧影",
    title1: "剪影",
    title2: "版式",
    en: "SILHOUETTE LAYOUT",
    subhead: "以轮廓建立强识别主体",
    body: "用单一剪影集中视觉注意，文字围绕形体展开，形成清晰的主体与留白关系。",
    points: [
      ["单一形体", "强化记忆点"],
      ["围绕轮廓", "组织层级"],
      ["留白呼吸", "提升可读性"],
    ],
    // 复刻 148 原海报无五官向左人像侧影：发顶斜弧 → 额头 → 眉弓 → 鼻梁 → 鼻尖 → 人中 → 唇瓣 → 下颌 → 颈窝 → 肩背
    // [nx, ny]（基准锚定在右侧，向左侧延展）
    edgeCtrl: [
      [0.44, 0.00],
      [0.49, 0.07],
      [0.52, 0.14],
      [0.535, 0.22],
      [0.56, 0.29], // 眉弓内凹
      [0.545, 0.34],
      [0.478, 0.435], // 鼻尖左探
      [0.538, 0.468], // 鼻底人中
      [0.524, 0.505], // 上唇
      [0.548, 0.538], // 唇缝
      [0.538, 0.562], // 下唇
      [0.570, 0.600], // 下巴底
      [0.585, 0.655], // 颈部
      [0.648, 0.688], // 锁骨转折
      [0.562, 0.775], // 胸肩前弧
      [0.488, 0.880],
      [0.455, 1.00],
    ],
    // 剪影后脑与橄榄绿角块的交界轮廓（右上角露出一片原海报同款干橄榄绿）
    backCtrl: [
      [0.44, 0.00],
      [0.55, 0.06],
      [0.67, 0.13],
      [0.74, 0.22],
      [0.78, 0.32],
      [0.83, 0.41],
      [0.93, 0.465],
      [1.00, 0.50],
    ],
    // 关键识别拐点（用于碰撞诊断提示具体切坏了哪里）
    landmarks: [
      { name: "鼻尖", ny: 0.435 },
      { name: "唇线", ny: 0.525 },
      { name: "下颌", ny: 0.600 },
    ],
    // 干扰杂影（开场默认开启，落在左侧暖白净区不与主侧影重叠，点击画布即可咔嚓剪除）
    clutters: [
      { id: "c1", kind: "bird", label: "左上飞鸟杂影", x: 0.27, y: 0.08, r: 24 },
      { id: "c2", kind: "spire", label: "左下尖塔杂影", x: 0.25, y: 0.84, r: 28 },
    ],
  },
  bird: {
    id: "bird",
    label: "飞羽侧鸟",
    title1: "孤影",
    title2: "长空",
    en: "WING SILHOUETTE",
    subhead: "单翼轮廓定住视线",
    body: "去掉羽毛纹理与杂乱枝叶，仅凭喙尖与展开翼弧，在留白里立起一眼可辨的飞翔姿态。",
    points: [
      ["喙翼锐角", "一眼辨种"],
      ["凹谷排文", "顺势借空"],
      ["高反差底", "远离杂讯"],
    ],
    // 优雅栖枝/展翼侧鸟轮廓（面向左，尖喙与颈窝形成深凹，翼弓向右上展开）
    edgeCtrl: [
      [0.62, 0.00],
      [0.58, 0.08],
      [0.56, 0.16],
      [0.53, 0.23], // 冠羽
      [0.44, 0.285], // 尖喙左探
      [0.54, 0.325], // 喉下深凹
      [0.57, 0.395],
      [0.535, 0.485], // 饱满胸弧
      [0.505, 0.575],
      [0.545, 0.665], // 腹收
      [0.615, 0.745], // 尾羽内切
      [0.525, 0.845], // 尾梢斜探
      [0.475, 0.945],
      [0.460, 1.00],
    ],
    backCtrl: [
      [0.62, 0.00],
      [0.69, 0.11],
      [0.77, 0.21],
      [0.84, 0.32],
      [0.92, 0.42],
      [1.00, 0.49],
    ],
    landmarks: [
      { name: "尖喙", ny: 0.285 },
      { name: "胸弧", ny: 0.540 },
      { name: "尾梢", ny: 0.860 },
    ],
    clutters: [
      { id: "c1", kind: "cloud", label: "飘散云团杂影", x: 0.27, y: 0.09, r: 24 },
      { id: "c2", kind: "twig", label: "散乱枯枝杂影", x: 0.25, y: 0.84, r: 28 },
    ],
  },
  violin: {
    id: "violin",
    label: "复古提琴",
    title1: "弦影",
    title2: "独奏",
    en: "CELLO SILHOUETTE",
    subhead: "借腰线凹弧安放层级",
    body: "大提琴的琴头卷涡与束腰凹弧天生自带文字槽位，保持单一黑影即可托出整场音乐会气质。",
    points: [
      ["束腰凹弧", "天然字槽"],
      ["单器统领", "克制配角"],
      ["黑白大底", "静音留白"],
    ],
    // 大提琴左侧半身轮廓：琴头卷涡 → 细琴颈 → 上圆肩 → 深 C 束腰 → 丰满下琴箱
    edgeCtrl: [
      [0.59, 0.00],
      [0.55, 0.05], // 卷涡外沿
      [0.615, 0.11], // 琴颈收细
      [0.620, 0.23],
      [0.545, 0.305], // 上肩外凸
      [0.505, 0.395],
      [0.578, 0.485], // C 束腰深凹（经典文字呼吸口袋！）
      [0.588, 0.555],
      [0.520, 0.640], // 下角尖
      [0.468, 0.745], // 下琴箱外凸
      [0.478, 0.875],
      [0.540, 0.960],
      [0.590, 1.00],
    ],
    backCtrl: [
      [0.59, 0.00],
      [0.68, 0.08],
      [0.73, 0.21],
      [0.79, 0.32],
      [0.88, 0.42],
      [1.00, 0.47],
    ],
    landmarks: [
      { name: "琴头", ny: 0.06 },
      { name: "束腰", ny: 0.52 },
      { name: "下琴箱", ny: 0.75 },
    ],
    clutters: [
      { id: "c1", kind: "note", label: "漂浮音符杂影", x: 0.27, y: 0.09, r: 24 },
      { id: "c2", kind: "spire", label: "角落谱架杂影", x: 0.25, y: 0.84, r: 28 },
    ],
  },
};

// 开场默认状态：刻意设为 0/4 翻车态（低对比灰雾、3 个剪影抢戏、硬框文字撞断鼻唇、剪影过满约 60%）
export function createInitialState() {
  return {
    theme: "portrait",
    exposure: 22,          // 0..100，22% 为灰雾低对比未显影态
    wrapMode: "rigid",     // "rigid"（矩形硬切）| "contour"（沿轮廓绕排）
    gapPx: 22,             // 绕排呼吸缝（-20..+56），仅在 contour 模式下生效（rigid 下直接按硬框撞入）
    scale: 1.44,           // 0.50..1.52，1.44 使剪影面积达约 60%，挤压留白
    offsetX: 0,            // -0.06..+0.06 画布内横向微调
    clutterMask: [true, true], // 开场 2 个抢戏杂影都在场上（共 3 影）
    cutout: true,          // 原海报黑影内反白植物叶枝/镂空
    stampMode: false,      // 邮票缩影盲测视图
    showCalipers: true,    // 轮廓净距测绘标线
  };
}

// ---------- 颜色与 WCAG 对比度真源 ----------
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
const mixRgb = (a, b, t) => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];
export const rgbCss = ([r, g, b], a = 1) =>
  a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a.toFixed(3)})`;

function relLuminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function wcagContrast(rgbA, rgbB) {
  const l1 = relLuminance(rgbA);
  const l2 = relLuminance(rgbB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 根据显影值 0..100 计算真实纸色、影色、橄榄色与杂讯强度
export function computeTone(exposure) {
  const t = clamp(exposure / 100, 0, 1);
  // 暗房显影非线性曲线：前 50% 灰雾渐退，75% 后压入纯黑硬边
  const curve = Math.pow(t, 1.25);
  const paperRgb = mixRgb(PALETTE.paperFog, PALETTE.paper, clamp(t * 1.15, 0, 1));
  const inkRgb = mixRgb(PALETTE.charcoalFog, PALETTE.charcoal, curve);
  const oliveRgb = mixRgb(PALETTE.oliveFog, PALETTE.olive, clamp(t * 1.1, 0, 1));
  const noiseAlpha = clamp(1 - t * 1.28, 0, 1);
  const edgeBlur = Math.max(0, (1 - t * 1.18) * 9);
  const contrast = wcagContrast(paperRgb, inkRgb);
  return { t, paperRgb, inkRgb, oliveRgb, noiseAlpha, edgeBlur, contrast };
}

// ---------- 贝塞尔 / Catmull-Rom 轮廓几何真源 ----------
function sampleSmooth(pts, stepsPerSeg = 10) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    for (let s = 0; s < stepsPerSeg; s++) {
      const u = s / stepsPerSeg;
      const u2 = u * u;
      const u3 = u2 * u;
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * u +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * u +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);
      out.push([x, clamp(y, 0, 1)]);
    }
  }
  out.push([pts[n - 1][0], pts[n - 1][1]]);
  return out;
}

const SMOOTH_CACHE = Object.fromEntries(
  Object.entries(THEMES).map(([k, th]) => [
    k,
    {
      edge: sampleSmooth(th.edgeCtrl, 10),
      back: sampleSmooth(th.backCtrl, 8),
    },
  ]),
);

// 将基准归一化点按体量 scale 与 offsetX 映射到逻辑画布像素 (0..STAGE_W, 0..STAGE_H)
// 锚定在右缘 x = 1.0，scale 越大剪影越向左扩展占地
function mapPoint([nx, ny], scale, offsetX) {
  const sx = 1.0 - (1.0 - nx) * scale + offsetX;
  const sy = ny;
  return [sx * STAGE_W, sy * STAGE_H];
}

export function buildContourGeometry(state) {
  const cached = SMOOTH_CACHE[state.theme] || SMOOTH_CACHE.portrait;
  const edgePx = cached.edge.map((p) => mapPoint(p, state.scale, state.offsetX));
  // 后脑轮廓随体量收放：大剪影时后缘更贴近右框，右上橄榄角保持清爽比例
  const backScale = clamp(1.18 - state.scale * 0.24, 0.55, 1.05);
  const backPx = cached.back.map((p) => mapPoint(p, backScale, state.offsetX * 0.4));

  // 按 y 查表获取左边界 x（像素），保证绘制与文字碰撞用完全同一条曲线
  function edgeXAtY(y) {
    const cy = clamp(y, 0, STAGE_H);
    for (let i = 0; i < edgePx.length - 1; i++) {
      const [x1, y1] = edgePx[i];
      const [x2, y2] = edgePx[i + 1];
      if (cy >= y1 && cy <= y2) {
        const f = y2 === y1 ? 0 : (cy - y1) / (y2 - y1);
        return lerp(x1, x2, f);
      }
    }
    return edgePx[edgePx.length - 1][0];
  }

  function backXAtY(y) {
    const cy = clamp(y, 0, STAGE_H);
    if (cy >= backPx[backPx.length - 1][1]) return STAGE_W;
    for (let i = 0; i < backPx.length - 1; i++) {
      const [x1, y1] = backPx[i];
      const [x2, y2] = backPx[i + 1];
      if (cy >= y1 && cy <= y2) {
        const f = y2 === y1 ? 0 : (cy - y1) / (y2 - y1);
        return lerp(x1, x2, f);
      }
    }
    return STAGE_W;
  }

  // 真实数值积分剪影占画幅面积百分比（左沿到后沿/右框之间，扣除约 4.5% 反白叶枝若开启）
  const SAMPLES = 120;
  let silArea = 0;
  let oliveArea = 0;
  const dy = STAGE_H / SAMPLES;
  for (let i = 0; i < SAMPLES; i++) {
    const y = (i + 0.5) * dy;
    const lx = clamp(edgeXAtY(y), 0, STAGE_W);
    const rx = clamp(backXAtY(y), lx, STAGE_W);
    silArea += (rx - lx) * dy;
    oliveArea += (STAGE_W - rx) * dy;
  }

  // 杂影列表及真实面积
  const themeDef = THEMES[state.theme] || THEMES.portrait;
  const activeClutters = themeDef.clutters
    .map((c, idx) => ({
      ...c,
      index: idx,
      active: !!state.clutterMask[idx],
      px: c.x * STAGE_W,
      py: c.y * STAGE_H,
    }))
    .filter((c) => c.active);

  const clutterArea = activeClutters.reduce((sum, c) => sum + Math.PI * c.r * c.r * 0.72, 0);
  const cutoutArea = state.cutout && state.exposure >= 35 ? STAGE_W * STAGE_H * 0.032 : 0;
  const totalCanvas = STAGE_W * STAGE_H;

  const mainSilPct = ((silArea - cutoutArea * 0.5) / totalCanvas) * 100;
  const silhouetteAreaPct = clamp(Math.round(((silArea + clutterArea) / totalCanvas) * 100), 10, 88);
  const olivePct = (oliveArea / totalCanvas) * 100;

  return {
    edgePx,
    backPx,
    edgeXAtY,
    backXAtY,
    activeClutters,
    mainSilPct,
    silhouetteAreaPct,
    olivePct,
  };
}

// 精确估算中文与西文行宽（与画布字体匹配，Syne 宽大写额外计宽，保证单源排版与实绘一致）
function measureChars(str, fontSize, isWideEn = false) {
  let w = 0;
  for (const ch of str) {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) w += fontSize * 1.02;
    else if (ch === " ") w += fontSize * (isWideEn ? 0.5 : 0.34);
    else if (/[A-Z]/.test(ch)) w += fontSize * (isWideEn ? 0.96 : 0.68);
    else w += fontSize * 0.56;
  }
  return w;
}

// 按每行实时可用宽度把导语拆成自然绕排行
function wrapCopyToWidths(text, fontSize, widths) {
  const lines = [];
  let cursor = 0;
  for (let li = 0; li < widths.length && cursor < text.length; li++) {
    const maxW = Math.max(fontSize * 3.2, widths[li]);
    let buf = "";
    while (cursor < text.length) {
      const next = buf + text[cursor];
      if (measureChars(next, fontSize) > maxW && buf.length >= 3) break;
      buf = next;
      cursor++;
    }
    // 避头标点处理
    if (cursor < text.length && /^[，。、；：！？）》」]/.test(text[cursor])) {
      buf += text[cursor];
      cursor++;
    }
    lines.push(buf);
  }
  if (cursor < text.length && lines.length) {
    lines[lines.length - 1] += text.slice(cursor);
  }
  return lines;
}

// ---------- 逐行文字绕排与轮廓碰撞真源 ----------
export function computeTextLayout(state, geom) {
  const th = THEMES[state.theme] || THEMES.portrait;
  const leftMargin = 40;
  const isContour = state.wrapMode === "contour";

  // 辅助函数：求纵向区间 [y0, y1] 内剪影最靠左的边缘位置（即最容易被撞到的凸点）
  const minEdgeInBand = (y0, y1) => {
    let m = STAGE_W;
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const y = lerp(y0, y1, s / steps);
      const ex = geom.edgeXAtY(y);
      if (ex < m) m = ex;
    }
    return m;
  };

  const rows = [];
  const gapSetting = isContour ? state.gapPx : 0;

  // 1. 主标题第一行 & 第二行（如「剪影」「版式」）
  const title1Y = 128;
  const title2Y = 198;
  const baseTitleSize = 58;
  const edgeT1 = minEdgeInBand(title1Y - 48, title1Y + 8);
  const edgeT2 = minEdgeInBand(title2Y - 48, title2Y + 8);

  // 在 contour 模式下，若空间收窄则适度缩放字号/贴齐左界并顺轮廓避让；rigid 模式则死守大块左齐宽排，故意造成越界撞影
  const t1Text = isContour ? th.title1 : `${th.title1}・视觉张力`;
  const t2Text = isContour ? th.title2 : `${th.title2}主视觉`;
  const t1Size = isContour
    ? clamp(Math.floor((edgeT1 - gapSetting - leftMargin) / 2.3), 36, baseTitleSize)
    : 52;
  const t2Size = isContour
    ? clamp(Math.floor((edgeT2 - gapSetting - leftMargin) / 2.3), 36, baseTitleSize)
    : 52;

  const t1W = measureChars(t1Text, t1Size);
  const t2W = measureChars(t2Text, t2Size);

  // contour 模式让文字右肩优雅靠近轮廓凹槽（保持精确呼吸缝 gapPx），同时不越过左边距
  const placeX = (edgeX, textW, preferRightHug = false) => {
    if (!isContour) return leftMargin;
    const idealRight = edgeX - gapSetting;
    if (preferRightHug) {
      return clamp(idealRight - textW, leftMargin, Math.max(leftMargin, STAGE_W - 60 - textW));
    }
    return leftMargin;
  };

  const t1X = placeX(edgeT1, t1W, false);
  const t2X = isContour
    ? clamp(Math.min(leftMargin + Math.max(0, (edgeT2 - edgeT1) * 0.45), edgeT2 - gapSetting - t2W), leftMargin, Math.max(leftMargin, edgeT2 - gapSetting - t2W))
    : leftMargin;

  rows.push({
    id: "title1",
    kind: "title",
    text: t1Text,
    x: t1X,
    y: title1Y,
    fontSize: t1Size,
    width: t1W,
    edgeX: edgeT1,
    gap: edgeT1 - (t1X + t1W),
  });
  rows.push({
    id: "title2",
    kind: "title",
    text: t2Text,
    x: Math.max(leftMargin, t2X),
    y: title2Y,
    fontSize: t2Size,
    width: t2W,
    edgeX: edgeT2,
    gap: edgeT2 - (Math.max(leftMargin, t2X) + t2W),
  });

  // 2. 英文副标 SILHOUETTE LAYOUT（Syne 宽体，按真实宽度防撞影）
  const enY = 232;
  const enEdge = minEdgeInBand(enY - 14, enY + 6);
  const enSize = isContour
    ? clamp(Math.floor((enEdge - gapSetting - leftMargin) / (th.en.length * 0.94)), 9.5, 13)
    : 13.5;
  const enW = measureChars(th.en, enSize, true);
  rows.push({
    id: "en",
    kind: "en",
    text: th.en,
    x: leftMargin,
    y: enY,
    fontSize: enSize,
    width: enW,
    edgeX: enEdge,
    gap: enEdge - (leftMargin + enW),
  });

  // 3. 橄榄绿核心副标「以轮廓建立强识别主体」
  const subY = 282;
  const subEdge = minEdgeInBand(subY - 18, subY + 6);
  const subSize = isContour
    ? clamp(Math.floor((subEdge - gapSetting - leftMargin) / (th.subhead.length * 1.04)), 11.5, 16.5)
    : 17;
  const subW = measureChars(th.subhead, subSize);
  rows.push({
    id: "subhead",
    kind: "subhead",
    text: th.subhead,
    x: leftMargin,
    y: subY,
    fontSize: subSize,
    width: subW,
    edgeX: subEdge,
    gap: subEdge - (leftMargin + subW),
  });

  // 4. 导语正文 3–4 行（按每行实际轮廓凹谷宽度自动绕排）
  const bodySize = 13.5;
  const bodyStartY = 324;
  const lineStep = 24;
  const candidateYs = [0, 1, 2, 3].map((i) => bodyStartY + i * lineStep);
  const availWidths = candidateYs.map((cy) => {
    const ex = minEdgeInBand(cy - 13, cy + 5);
    return isContour ? Math.max(64, ex - gapSetting - leftMargin) : 326;
  });

  const bodyLines = isContour
    ? wrapCopyToWidths(th.body, bodySize, availWidths)
    : [
        th.body.slice(0, 21),
        th.body.slice(21),
      ].filter(Boolean);

  bodyLines.forEach((line, idx) => {
    const cy = bodyStartY + idx * lineStep;
    const ex = minEdgeInBand(cy - 13, cy + 5);
    const lw = measureChars(line, bodySize);
    rows.push({
      id: `body-${idx}`,
      kind: "body",
      text: line,
      x: leftMargin,
      y: cy,
      fontSize: bodySize,
      width: lw,
      edgeX: ex,
      gap: ex - (leftMargin + lw),
    });
  });

  // 汇总碰撞与呼吸缝实测指标
  let minGapPx = Infinity;
  let collidingRows = [];
  let tightRows = [];
  let textArea = 0;

  for (const r of rows) {
    if (r.gap < minGapPx) minGapPx = r.gap;
    if (r.gap < 0) collidingRows.push(r);
    else if (r.gap < BANDS.gapMin) tightRows.push(r);
    textArea += r.width * r.fontSize * 1.15;
  }

  // 计算正文行与轮廓的贴合呼应度（用于识别「离影脱节」与「硬框呆排」）
  const bodyOnly = rows.filter((r) => r.kind === "body" || r.kind === "subhead");
  const avgBodyGap = bodyOnly.reduce((s, r) => s + r.gap, 0) / Math.max(1, bodyOnly.length);
  const effectiveGap = isContour ? Math.min(minGapPx, state.gapPx) : minGapPx;

  // 找出被碰撞的第一个特征拐点名称（例如鼻尖/唇线）
  let hitLandmark = "";
  if (collidingRows.length) {
    const hitY = collidingRows[0].y / STAGE_H;
    let bestD = Infinity;
    for (const lm of th.landmarks) {
      const d = Math.abs(lm.ny - hitY);
      if (d < bestD) {
        bestD = d;
        hitLandmark = lm.name;
      }
    }
  }

  return {
    rows,
    minGapPx: Math.round(minGapPx),
    effectiveGap: Math.round(effectiveGap),
    avgBodyGap: Math.round(avgBodyGap),
    collidingCount: collidingRows.length,
    tightCount: tightRows.length,
    hitLandmark,
    textAreaPct: (textArea / (STAGE_W * STAGE_H)) * 100,
  };
}

let _cachedGeoKey = "";
let _cachedGeom = null;
let _cachedText = null;

// ---------- 整台综合诊断真源 ----------
export function evaluate(state) {
  const tone = computeTone(state.exposure);
  const geoKey = `${state.theme}|${state.wrapMode}|${Math.round(state.gapPx * 2)}|${Math.round(state.scale * 200)}|${Math.round(state.offsetX * 500)}|${state.clutterMask[0] ? 1 : 0}${state.clutterMask[1] ? 1 : 0}|${state.cutout ? 1 : 0}`;
  let geom;
  let text;
  if (geoKey === _cachedGeoKey && _cachedGeom && _cachedText) {
    geom = _cachedGeom;
    text = _cachedText;
  } else {
    geom = buildContourGeometry(state);
    text = computeTextLayout(state, geom);
    _cachedGeoKey = geoKey;
    _cachedGeom = geom;
    _cachedText = text;
  }

  const paperWhitespacePct = clamp(
    Math.round(100 - geom.silhouetteAreaPct - geom.olivePct * 0.55 - text.textAreaPct),
    8,
    82,
  );

  const clutterCount = geom.activeClutters.length;
  const totalShapes = 1 + clutterCount;

  // 四柱单项判定（完全绑定 148 原海报 4 个关键词）
  const passContrast = state.exposure >= BANDS.exposureMin && tone.contrast >= BANDS.contrastMin;
  const passIdentity = clutterCount === 0;
  const passShape =
    state.wrapMode === "contour" &&
    text.collidingCount === 0 &&
    text.minGapPx >= BANDS.gapMin &&
    state.gapPx >= BANDS.gapMin &&
    state.gapPx <= BANDS.gapMax;
  const passSpace =
    geom.silhouetteAreaPct >= BANDS.areaMin &&
    geom.silhouetteAreaPct <= BANDS.areaMax &&
    paperWhitespacePct >= BANDS.whitespaceMin;

  const passedCount = [passContrast, passIdentity, passShape, passSpace].filter(Boolean).length;

  // 8 类失误按视觉损害优先级排序诊断
  let verdict;
  if (!passContrast) {
    verdict = {
      code: "low-contrast",
      tag: "低对比灰影",
      tone: "bad",
      title: `图底对比度只有 ${tone.contrast.toFixed(1)}:1，影体糊在杂景里`,
      body: "内部灰调噪点与底纹还在抢走注意力，大脑无法把右侧形体识别为一块封闭剪影，第一落点立不起来。",
      hint: "向右拖动舞台底沿「逆光显影推光尺」到 78% 以上，抽干杂纹、压出纯黑轮廓。",
    };
  } else if (
    state.wrapMode === "contour" &&
    state.gapPx >= BANDS.gapMin &&
    (geom.silhouetteAreaPct > BANDS.areaMax || paperWhitespacePct < BANDS.whitespaceMin)
  ) {
    verdict = {
      code: "over-heavy",
      tag: "黑压过满",
      tone: "bad",
      title: `剪影占地 ${geom.silhouetteAreaPct}% 过满，暖白留白只剩 ${paperWhitespacePct}%`,
      body: "大片炭黑向前压迫，把文字呼吸区彻底挤扁，整张版面沉重发闷，失去了「留白呼吸、提升可读性」的从容节奏。",
      hint: "向左收回「剪影体量」滑尺，把剪影占地收进 32%–54% 经验带。",
    };
  } else if (text.collidingCount > 0) {
    verdict = {
      code: "collision",
      tag: "撞影压字",
      tone: "bad",
      title: `${text.collidingCount} 行文字撞进轮廓（净距 ${text.minGapPx}px），劈碎了${text.hitLandmark || "关键外沿"}`,
      body: "剪影靠外轮廓的凹凸拐点说话。文字一旦冲进黑影，既破坏了轮廓识别度，字迹骑在黑白交界上也彻底看不清。",
      hint: state.wrapMode === "rigid"
        ? "把绕排方式切到「沿轮廓绕排」，让每行文字顺着形体凹谷避让。"
        : "向右加大「轮廓呼吸缝」滑尺到 16–34px，把压黑的文字退回暖白纸面。",
    };
  } else if (!passIdentity) {
    verdict = {
      code: "multi-clutter",
      tag: "多影抢戏",
      tone: "bad",
      title: `场上挤着 ${totalShapes} 个剪影，视线被拆散了`,
      body: "剪影版式的第一条铁律是「单一形体、强化记忆点」。旁边的飞鸟与角落杂影不断拉扯目光，主角失去了统御力。",
      hint: "直接在画布上点按左侧多余杂影把它们剪掉，或点击「剪至单一形体」。",
    };
  } else if (state.wrapMode === "rigid") {
    verdict = {
      code: "rigid-box",
      tag: "硬框呆排",
      tone: "warn",
      title: "文字虽未撞黑，但死守矩形直边，与剪影各走各的",
      body: "有机弧形轮廓旁边立着一块生硬方盒，中间空出不规则锯齿死角，看不出文字是围绕形体长出来的。",
      hint: "切到「沿轮廓绕排」，让导语行尾随剪影曲线自然错落展开。",
    };
  } else if (
    (geom.silhouetteAreaPct > BANDS.areaMax || paperWhitespacePct < BANDS.whitespaceMin) &&
    state.gapPx >= BANDS.gapMin
  ) {
    verdict = {
      code: "over-heavy",
      tag: "黑压过满",
      tone: "bad",
      title: `剪影占地 ${geom.silhouetteAreaPct}% 过满，暖白留白只剩 ${paperWhitespacePct}%`,
      body: "大片炭黑向前压迫，文字区被挤窄，整张版面沉重发闷，失去了「留白呼吸、提升可读性」的从容节奏。",
      hint: "向左收回「剪影体量」滑尺，把剪影占地收进 32%–54% 经验带。",
    };
  } else if (state.gapPx < BANDS.gapMin || text.minGapPx < BANDS.gapMin) {
    verdict = {
      code: "tight-gap",
      tag: "紧贴窒息",
      tone: "bad",
      title: `文字与剪影只隔 ${Math.min(state.gapPx, text.minGapPx)}px，边缘发粘喘不过气`,
      body: "字尾贴死在炭黑边界上，眼睛在读字和认轮廓之间不停打架，丢掉了剪影版式最金贵的空气感。",
      hint: "把「轮廓呼吸缝」拉宽到 16–34px 经验舒适带，留出一道清晰透气的纸缝。",
    };
  } else if (state.gapPx > BANDS.gapMax) {
    verdict = {
      code: "detached-gap",
      tag: "离影脱节",
      tone: "warn",
      title: `呼吸缝拉到 ${state.gapPx}px 过宽，文字被挤成孤立窄条`,
      body: "过度躲避剪影会把左侧文案推到画框角落、逼出碎短行，图文之间断掉呼应，版面裂成互不相关的两半。",
      hint: "把「轮廓呼吸缝」收回到 16–34px，让文字重新贴着剪影曲线对话。",
    };
  } else if (geom.silhouetteAreaPct < BANDS.areaMin) {
    verdict = {
      code: "too-small",
      tag: "孤影过小",
      tone: "warn",
      title: `剪影只占 ${geom.silhouetteAreaPct}% 画幅，撑不起主角气场`,
      body: "剪影缩成角落里的一枚小剪纸，留白变成空洞而非呼应，观众第一眼落不到形体本身。",
      hint: "向右适度放大「剪影体量」滑尺，让剪影稳占 32%–54% 画幅。",
    };
  } else {
    verdict = {
      code: "pass",
      tag: "剪影成立",
      tone: "ok",
      title: "单一强轮廓立住了，文字顺着形体呼吸展开",
      body: `图底对比达 ${tone.contrast.toFixed(1)}:1，单剪影占 ${geom.silhouetteAreaPct}% 画幅，文字沿轮廓留出 ${text.minGapPx}px 均匀气口，暖白净留白 ${paperWhitespacePct}%——不妨开启「邮票盲测」验一眼缩到极小是否依然好认。`,
      hint: "试试切「飞羽侧鸟」「复古提琴」或故意拉歪呼吸缝，观察不同外轮廓如何重塑排版节奏。",
    };
  }

  // 四枚原海报关键词状态文案
  const pillars = {
    shape: {
      ok: passShape,
      state:
        text.collidingCount > 0
          ? `撞字 ${text.collidingCount} 行`
          : state.wrapMode === "rigid"
            ? "硬框呆排"
            : state.gapPx < BANDS.gapMin
              ? `${Math.min(state.gapPx, text.minGapPx)}px 过紧`
              : state.gapPx > BANDS.gapMax
                ? `${state.gapPx}px 脱节`
                : `绕排 ${text.minGapPx}px`,
    },
    space: {
      ok: passSpace,
      state:
        geom.silhouetteAreaPct > BANDS.areaMax
          ? `过满 ${geom.silhouetteAreaPct}%`
          : geom.silhouetteAreaPct < BANDS.areaMin
            ? `过小 ${geom.silhouetteAreaPct}%`
            : `留白 ${paperWhitespacePct}%`,
    },
    contrast: {
      ok: passContrast,
      state: passContrast ? `${tone.contrast.toFixed(1)}:1 锐利` : `${tone.contrast.toFixed(1)}:1 灰雾`,
    },
    identity: {
      ok: passIdentity,
      state: passIdentity ? "单一形体" : `${totalShapes} 影抢戏`,
    },
  };

  return {
    tone,
    geom,
    text,
    paperWhitespacePct,
    clutterCount,
    totalShapes,
    passedCount,
    passContrast,
    passIdentity,
    passShape,
    passSpace,
    pillars,
    verdict,
  };
}
