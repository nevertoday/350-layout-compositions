// 062 分散构图 · 单一几何与视觉权重真源（model.js）
// 所有坐标均采用归一化画布坐标 x, y ∈ [0, 1]，半径 r 以画布短边 min(W, H) 为基准。
// 画布绘制、四色关键词验收灯、实时诊断与分析透视全部读取同一份计算结果。

export const PALETTE = {
  obsidian: "#090909",
  charcoal: "#131416",
  cream: "#F3ECDE",
  paperLight: "#FAF7F0",
  yellow: "#F5C220",
  lavender: "#9471CD",
  lavenderBright: "#B496EA",
  orange: "#EE5520",
  jade: "#12967B",
  jadeBright: "#2CC4A4",
  pink: "#F582B2",
  warn: "#FF6B4A",
};

// 062 原海报 9 枚核心几何实体（3 枚焦点圆 + 6 枚节奏伴形；留白加号根据实时空隙自动浮现）
export const ITEM_DEFS = [
  { id: "f1", name: "焦点 01 · 明黄圆", short: "焦点 01", kind: "circle", focal: 1, color: PALETTE.yellow, lum: 1.38, minR: 0.045, maxR: 0.145, posterR: 0.116, posterX: 0.65, posterY: 0.18 },
  { id: "f2", name: "焦点 02 · 紫圆", short: "焦点 02", kind: "circle", focal: 2, color: PALETTE.lavender, lum: 0.96, minR: 0.042, maxR: 0.125, posterR: 0.086, posterX: 0.69, posterY: 0.45 },
  { id: "f3", name: "焦点 03 · 橘红圆", short: "焦点 03", kind: "circle", focal: 3, color: PALETTE.orange, lum: 1.28, minR: 0.032, maxR: 0.105, posterR: 0.056, posterX: 0.37, posterY: 0.56 },
  { id: "ring", name: "暖白厚空环", short: "暖白空环", kind: "ring", focal: 0, color: PALETTE.cream, lum: 0.84, minR: 0.07, maxR: 0.12, posterR: 0.102, posterX: 0.74, posterY: 0.78 },
  { id: "jade", name: "翡翠绿方块", short: "绿方块", kind: "square", focal: 0, color: PALETTE.jade, lum: 0.88, minR: 0.045, maxR: 0.085, posterR: 0.062, posterX: 0.14, posterY: 0.72 },
  { id: "pink", name: "玫粉小方块", short: "粉小方", kind: "square", focal: 0, color: PALETTE.pink, lum: 1.06, minR: 0.025, maxR: 0.05, posterR: 0.031, posterX: 0.83, posterY: 0.61 },
  { id: "dotP", name: "薰衣草小圆", short: "紫小圆", kind: "circle", focal: 0, color: PALETTE.lavender, lum: 0.86, minR: 0.024, maxR: 0.046, posterR: 0.031, posterX: 0.27, posterY: 0.85 },
  { id: "gridP", name: "紫 3×3 点阵", short: "紫点阵", kind: "grid", focal: 0, color: PALETTE.lavender, lum: 0.62, minR: 0.038, maxR: 0.056, posterR: 0.045, posterX: 0.89, posterY: 0.26 },
  { id: "gridW", name: "白 3×3 点阵", short: "白点阵", kind: "grid", focal: 0, color: PALETTE.cream, lum: 0.68, minR: 0.038, maxR: 0.056, posterR: 0.045, posterX: 0.37, posterY: 0.77 },
];

// 经验参考阈值（统一定义，正文与读数同源）
export const RULES = {
  focalAreaRatioMin: 2.4,   // 01 / 03 面积比经验下限
  focalStepMin: 1.18,       // 相邻焦点半径梯度经验下限
  minGapOk: 0.028,          // 两件之间最小呼吸净隙（相对画布短边）
  alignLimit: 9,            // 横/竖严格共线对数上限（3×3 棋盘为 18 对）
  nnCvMin: 0.10,            // 最近邻间距变异系数下限（避免等距格栅）
  spanXMin: 0.54,           // 横向散开跨度下限
  spanYMin: 0.52,           // 纵向散开跨度下限
  balanceMax: 0.135,        // 视觉重心偏离画心上限
  voidMin: 60,              // 留白占比经验下限（%）
  voidMax: 97,              // 留白占比经验上限（%）
};

// 四种典型错态预设 + 仅在 4/4 后解锁对照的原海报几何参考（非一键作弊钮）
export const PRESETS = {
  // 开场默认错态：0/4 — 3×3 死板网格 + 焦点 01/02/03 等大平权 + 缩在偏左一块 + 紧挤缺呼吸
  grid: {
    label: "僵直棋盘",
    items: {
      f1:    { x: 0.23, y: 0.27, r: 0.072 },
      f2:    { x: 0.40, y: 0.27, r: 0.072 },
      f3:    { x: 0.57, y: 0.27, r: 0.072 },
      jade:  { x: 0.23, y: 0.455, r: 0.062 },
      ring:  { x: 0.40, y: 0.455, r: 0.098 },
      pink:  { x: 0.57, y: 0.455, r: 0.031 },
      dotP:  { x: 0.23, y: 0.64, r: 0.031 },
      gridW: { x: 0.40, y: 0.64, r: 0.045 },
      gridP: { x: 0.57, y: 0.64, r: 0.045 },
    },
  },
  // 错态 2：纯随机白噪声结块撞车（体量已有分化，但空间碰撞粘连、右下荒芜）
  clump: {
    label: "白噪结块",
    items: {
      f1:    { x: 0.41, y: 0.34, r: 0.116 },
      f2:    { x: 0.51, y: 0.41, r: 0.086 },
      f3:    { x: 0.44, y: 0.49, r: 0.056 },
      ring:  { x: 0.23, y: 0.27, r: 0.102 },
      jade:  { x: 0.29, y: 0.45, r: 0.062 },
      pink:  { x: 0.59, y: 0.27, r: 0.031 },
      dotP:  { x: 0.36, y: 0.19, r: 0.031 },
      gridP: { x: 0.66, y: 0.38, r: 0.045 },
      gridW: { x: 0.18, y: 0.56, r: 0.045 },
    },
  },
  // 错态 3：偏沉倾覆（散而不撞、无棋盘感，但大部分视觉重量压在左侧）
  tilt: {
    label: "偏向倾覆",
    items: {
      f1:    { x: 0.20, y: 0.21, r: 0.116 },
      f2:    { x: 0.35, y: 0.47, r: 0.086 },
      f3:    { x: 0.13, y: 0.53, r: 0.056 },
      ring:  { x: 0.25, y: 0.80, r: 0.102 },
      jade:  { x: 0.49, y: 0.23, r: 0.062 },
      pink:  { x: 0.78, y: 0.34, r: 0.031 },
      dotP:  { x: 0.09, y: 0.86, r: 0.031 },
      gridP: { x: 0.52, y: 0.69, r: 0.045 },
      gridW: { x: 0.83, y: 0.81, r: 0.045 },
    },
  },
  // 错态 4：空心贴边（全挤在四周画框外沿，中央塌出巨大死洞）
  hollow: {
    label: "空心贴边",
    items: {
      f1:    { x: 0.82, y: 0.16, r: 0.116 },
      f2:    { x: 0.15, y: 0.14, r: 0.086 },
      f3:    { x: 0.49, y: 0.09, r: 0.056 },
      ring:  { x: 0.85, y: 0.83, r: 0.102 },
      jade:  { x: 0.12, y: 0.84, r: 0.062 },
      pink:  { x: 0.91, y: 0.51, r: 0.031 },
      dotP:  { x: 0.08, y: 0.46, r: 0.031 },
      gridP: { x: 0.55, y: 0.90, r: 0.045 },
      gridW: { x: 0.31, y: 0.89, r: 0.045 },
    },
  },
};

export const POSTER_REF = Object.fromEntries(
  ITEM_DEFS.map((d) => [d.id, { x: d.posterX, y: d.posterY, r: d.posterR }])
);

export function createItems(presetKey = "grid") {
  const src = PRESETS[presetKey]?.items || PRESETS.grid.items;
  return ITEM_DEFS.map((d) => ({
    ...d,
    x: src[d.id].x,
    y: src[d.id].y,
    r: src[d.id].r,
  }));
}

export function effRadius(item) {
  if (item.kind === "square") return item.r * 1.12;
  if (item.kind === "grid") return item.r * 1.08;
  return item.r;
}

export function visualArea(item) {
  if (item.kind === "square") return (item.r * 1.85) ** 2;
  if (item.kind === "ring") return Math.PI * (item.r ** 2 - (item.r * 0.52) ** 2);
  if (item.kind === "grid") return Math.PI * (item.r * 0.62) ** 2;
  return Math.PI * item.r * item.r;
}

export function clampItem(item, aspect = 1.28) {
  const sx = aspect >= 1 ? aspect : 1;
  const sy = aspect >= 1 ? 1 : 1 / aspect;
  const padX = (effRadius(item) + 0.015) / sx;
  const padY = (effRadius(item) + 0.015) / sy;
  item.x = Math.max(padX, Math.min(1 - padX, item.x));
  item.y = Math.max(padY, Math.min(1 - padY, item.y));
}

// 空白场「呼吸推波」：在 (wx, wy) 处对周边元素施加柔和排斥 + 轻微破格扰动
export function applyBreathWave(items, wx, wy, aspect = 1.28, strength = 0.026) {
  const sx = aspect >= 1 ? aspect : 1;
  const sy = aspect >= 1 ? 1 : 1 / aspect;
  const waveRadius = 0.44;
  let moved = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const dx = (it.x - wx) * sx;
    const dy = (it.y - wy) * sy;
    const dist = Math.hypot(dx, dy);
    if (dist < waveRadius) {
      const falloff = (1 - dist / waveRadius) ** 1.4;
      const angle = dist > 0.002 ? Math.atan2(dy, dx) : (i * 2.39996); // 黄金角破重
      // 加一点非对称旋转切向，专门打散横竖死对齐
      const swirl = (i % 2 === 0 ? 1 : -1) * 0.28;
      const push = strength * falloff;
      it.x += (Math.cos(angle + swirl) * push) / sx;
      it.y += (Math.sin(angle + swirl) * push) / sy;
      moved++;
    }
  }

  // 同时做一步轻柔的泊松最小净隙互推，防止波浪把两个元素推撞在一起
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const dx = (b.x - a.x) * sx;
      const dy = (b.y - a.y) * sy;
      const d = Math.hypot(dx, dy) || 0.0001;
      const target = effRadius(a) + effRadius(b) + 0.044;
      if (d < target) {
        const push = (target - d) * 0.24;
        const ux = dx / d, uy = dy / d;
        a.x -= (ux * push) / sx;
        a.y -= (uy * push) / sy;
        b.x += (ux * push) / sx;
        b.y += (uy * push) / sy;
        moved++;
      }
    }
  }

  for (const it of items) clampItem(it, aspect);
  return moved > 0;
}

// 为留白十字星标自动找 5 个最开阔的呼吸空隙（跟随元素动态让位）
export function computeBreathMarks(items, aspect = 1.28) {
  const sx = aspect >= 1 ? aspect : 1;
  const sy = aspect >= 1 ? 1 : 1 / aspect;
  const anchors = [
    { x: 0.88, y: 0.12, color: PALETTE.cream },
    { x: 0.49, y: 0.35, color: PALETTE.cream },
    { x: 0.54, y: 0.66, color: PALETTE.cream },
    { x: 0.91, y: 0.67, color: PALETTE.cream },
    { x: 0.11, y: 0.86, color: PALETTE.cream },
    { x: 0.47, y: 0.87, color: PALETTE.yellow },
  ];
  return anchors.filter((m) =>
    items.every((it) => {
      const d = Math.hypot((m.x - it.x) * sx, (m.y - it.y) * sy);
      return d > effRadius(it) + 0.055;
    })
  );
}

// 主评估函数：所有指标与四关键词状态、诊断结论的唯一真源
export function evaluate(items, aspect = 1.28) {
  const sx = aspect >= 1 ? aspect : 1;
  const sy = aspect >= 1 ? 1 : 1 / aspect;
  const byId = Object.fromEntries(items.map((it) => [it.id, it]));
  const f1 = byId.f1, f2 = byId.f2, f3 = byId.f3;

  // 1. 变化（主次级差）：01 > 02 > 03
  const step12 = f1.r / Math.max(0.001, f2.r);
  const step23 = f2.r / Math.max(0.001, f3.r);
  const focalRatio = (f1.r * f1.r) / Math.max(0.0001, f3.r * f3.r);
  const hierarchyInverted = f1.r < f2.r - 0.003 || f2.r < f3.r - 0.003;
  const variationOk = !hierarchyInverted && step12 >= RULES.focalStepMin && step23 >= RULES.focalStepMin && focalRatio >= RULES.focalAreaRatioMin;

  // 2. 两两距离、碰撞与最近邻分布
  let minGap = Infinity;
  let closestPair = null;
  const collisions = [];
  const nnDists = new Array(items.length).fill(Infinity);
  const nnLinks = [];
  let alignedPairs = 0;
  const alignLines = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const d = Math.hypot((a.x - b.x) * sx, (a.y - b.y) * sy);
      const gap = d - (effRadius(a) + effRadius(b));
      if (gap < minGap) {
        minGap = gap;
        closestPair = [a, b, gap];
      }
      if (gap < RULES.minGapOk) {
        collisions.push({ a, b, gap, overlap: gap < 0 });
      }
      if (d < nnDists[i]) nnDists[i] = d;
      if (d < nnDists[j]) nnDists[j] = d;

      const sameCol = Math.abs(a.x - b.x) < 0.042;
      const sameRow = Math.abs(a.y - b.y) < 0.042;
      if (sameCol || sameRow) {
        alignedPairs++;
        if (alignLines.length < 18) alignLines.push({ a, b, dir: sameCol ? "v" : "h" });
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    let bestJ = -1, bestD = Infinity;
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const d = Math.hypot((items[i].x - items[j].x) * sx, (items[i].y - items[j].y) * sy);
      if (d < bestD) { bestD = d; bestJ = j; }
    }
    if (bestJ >= 0) nnLinks.push({ a: items[i], b: items[bestJ], d: bestD });
  }

  const nnMean = nnDists.reduce((s, v) => s + v, 0) / nnDists.length;
  const nnStd = Math.sqrt(nnDists.reduce((s, v) => s + (v - nnMean) ** 2, 0) / nnDists.length);
  const nnCV = nnMean > 0.001 ? nnStd / nnMean : 0;

  // 3. 呼吸（留白占比 + 最小净隙无粘连）
  const totalFilled = items.reduce((s, it) => s + visualArea(it), 0);
  const voidPct = Math.max(0, Math.min(99, Math.round((1 - totalFilled / (sx * sy)) * 100)));
  const breathOk = collisions.length === 0 && minGap >= RULES.minGapOk && voidPct >= RULES.voidMin && voidPct <= RULES.voidMax;

  // 4. 节奏（非死板网格 + 非结块）
  const isGridLike = alignedPairs > RULES.alignLimit || nnCV < RULES.nnCvMin;
  const rhythmOk = !isGridLike && collisions.length === 0;

  // 5. 开放（全域扩散 + 不贴边空心 + 阿恩海姆视觉重心平衡）
  const xs = items.map((it) => it.x);
  const ys = items.map((it) => it.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const quads = new Set(items.map((it) => `${it.x >= 0.5 ? 1 : 0}${it.y >= 0.5 ? 1 : 0}`)).size;

  // 贴边空心检测：边缘环元素多且画心大空洞
  const edgeHugCount = items.filter((it) => Math.min(it.x, 1 - it.x, it.y, 1 - it.y) < 0.175).length;
  const centerNearest = Math.min(...items.map((it) => Math.hypot((it.x - 0.5) * sx, (it.y - 0.5) * sy) - effRadius(it)));
  const isHollow = edgeHugCount >= 6 && centerNearest > 0.24;
  const isTooCramped = spanX < RULES.spanXMin || spanY < RULES.spanYMin || quads < 3;

  // 阿恩海姆视觉重心：面积 × 明度反差 × 离心力臂加成
  let sumW = 0, sumWX = 0, sumWY = 0;
  for (const it of items) {
    const ecc = Math.hypot((it.x - 0.5) * sx, (it.y - 0.48) * sy);
    const w = visualArea(it) * it.lum * (1 + 0.42 * ecc);
    sumW += w;
    sumWX += w * it.x;
    sumWY += w * it.y;
  }
  const comX = sumW > 0 ? sumWX / sumW : 0.5;
  const comY = sumW > 0 ? sumWY / sumW : 0.48;
  const balanceOffset = Math.hypot(comX - 0.5, comY - 0.48);
  const balanceOk = balanceOffset <= RULES.balanceMax;
  const opennessOk = !isTooCramped && !isHollow && balanceOk;

  const passedCount = [variationOk, rhythmOk, breathOk, opennessOk].filter(Boolean).length;
  const hasOverlap = collisions.some((c) => c.overlap);

  // 明确优先级的六类诊断（一次讲清最核心的一处问题与视觉机制）
  let code = "pass";
  let tag = "星图成立 · 4/4";
  let headline = "分散中有主次，留白里有平衡";
  let reason = `三大焦点拉开了 ${focalRatio.toFixed(1)}× 面积级差，9 件元素跨过画布自然舒展且无横竖死对齐，视觉重心稳稳落在画心 ${Math.round(balanceOffset * 100)}% 以内。眼睛先落黄圆，再自由漫游到紫圆与橘红锚点。`;
  let action = "可以点下方「叠看原海报轮廓」比对自己的星图，或试着把任意一件拖近边缘感受重心如何倾斜。";

  if (isGridLike && !hasOverlap && !isHollow) {
    code = "grid";
    tag = "错态 · 死板棋盘";
    headline = !variationOk ? "元素排成了整齐格栅，且焦点等大平权" : `出现 ${alignedPairs} 对横竖共线，退化成了机械格栅`;
    reason = `画面中出现 ${alignedPairs} 对横竖严格对齐（最近邻变异仅 ${(nnCV * 100).toFixed(0)}%，经验参考 ≥ 10%）。大脑会瞬间把画面读成刻板的行列格子（057 棋盘语言），而不是开放轻盈的分散空间。`;
    action = !variationOk
      ? "先在黑场空白处左右扫拖发出「呼吸推波」打散队列，再调大焦点 01、缩小焦点 03 拉开体量级差。"
      : "拖开画布中闪出虚线对齐提示的几何体，让每两件之间的夹角与距离都带点错落节奏。";
  } else if (collisions.length > 0) {
    code = "clump";
    tag = "错态 · 结块撞车";
    const [a, b] = [collisions[0].a, collisions[0].b];
    headline = `${a.short}与${b.short}挤到一起，呼吸缝塌了`;
    reason = `共有 ${collisions.length} 组元素边界净隙不足（最小 ${(minGap * 100).toFixed(1)}%，经验参考 ≥ 2.6%）。纯随机乱扔最常撞出这种局部疙瘩，视线会被粘死在碰撞点，失去轻盈感。`;
    action = `直接拖开画布上标红圈的${a.short}或${b.short}，或在拥挤处轻扫空白黑场用「呼吸推波」推开净隙。`;
  } else if (isHollow) {
    code = "hollow";
    tag = "错态 · 空心贴边";
    headline = `${edgeHugCount} 件元素全挤在画框边，中央塌出空洞`;
    reason = `中心附近半径 ${Math.round(centerNearest * 100)}% 范围内空无一物，大部分图形贴着四壁排成一圈。画框边界会把贴边元素往外吸，视线沿外框打转却进不到画面内部。`;
    action = "把焦点 02 或焦点 03 往画布中腹温和拉回一些，让内外都有落脚点，消解空洞感。";
  } else if (!variationOk) {
    code = "flat";
    tag = hierarchyInverted ? "错态 · 主次倒挂" : "错态 · 主次平权";
    headline = hierarchyInverted ? "焦点 01/02/03 大小顺序倒挂了" : `三大焦点面积比仅 ${focalRatio.toFixed(1)}×，都在抢第一眼`;
    reason = hierarchyInverted
      ? "原海报里明黄 01 负责大面积定锚、紫圆 02 负责中等停留、橘红 03 负责小面积高对比点睛；现在顺序颠倒，视线入口变得混乱。"
      : `黄圆 01、紫圆 02、橘红 03 体量太接近（经验参考 01/03 面积比 ≥ 2.4×），缺少明确的大中小阶梯，读者进场后不知道先看谁。`;
    action = "点选 01 放大做主锚、或点选 03 缩小成高对比尖点，也可直接切换下方的「焦点级差」拉开阶梯。";
  } else if (isTooCramped) {
    code = "cramped";
    tag = "错态 · 缩团未散";
    headline = `展开范围仅 ${Math.round(spanX * 100)}% × ${Math.round(spanY * 100)}%，还没真正敞开`;
    reason = `元素仍然窝在局部区域（有效象限 ${quads}/4），大片黑底成了单侧闲置的死白，看起来更像半成品的 061 聚类构图而非多向开放的分散星图。`;
    action = "把外围伴形或焦点拖向空着的象限，让四个方向都有几何呼应与呼吸空间。";
  } else if (!balanceOk) {
    code = "tilt";
    tag = "错态 · 偏沉倾覆";
    const dirX = comX < 0.45 ? "左" : comX > 0.55 ? "右" : "";
    const dirY = comY < 0.42 ? "上" : comY > 0.54 ? "下" : "";
    const side = (dirX + dirY) || "一侧";
    headline = `视觉重心向${side}偏了 ${Math.round(balanceOffset * 100)}%，画面正在发沉`;
    reason = `阿恩海姆视觉重量把面积、明度反差与离心力臂算在一起：当前重心偏离画心超过经验平衡带（≤ 13.5%），虽然分开了，整张图却像失衡的天平。`;
    action = `打开「重心支点」透视，把较轻的件往反方向拉远（借长力臂配平），或把过重的大块稍向中线回收。`;
  } else if (!breathOk) {
    code = "breath";
    tag = "错态 · 呼吸失衡";
    headline = voidPct < RULES.voidMin ? `留白只剩 ${voidPct}%，画面开始发闷` : `留白高达 ${voidPct}%，画面显得稀薄发虚`;
    reason = `分散构图依赖充沛而有弹性的底色空隙（经验留白带 64%–94%）托起轻盈感。`;
    action = "适度调节三大焦点的体量，让图形与黑底留白回到轻盈呼吸带。";
  }

  return {
    code,
    tag,
    headline,
    reason,
    action,
    passedCount,
    allPass: passedCount === 4,
    checks: {
      variation: {
        ok: variationOk,
        label: variationOk ? `${focalRatio.toFixed(1)}× 分级` : hierarchyInverted ? "顺序倒挂" : `仅 ${focalRatio.toFixed(1)}×`,
      },
      rhythm: {
        ok: rhythmOk,
        label: rhythmOk ? "错落无格" : isGridLike ? `共线 ${alignedPairs} 对` : "局部结块",
      },
      breath: {
        ok: breathOk,
        label: breathOk ? `净隙 ${(minGap * 100).toFixed(1)}%` : collisions.length ? `撞车 ${collisions.length} 处` : `留白 ${voidPct}%`,
      },
      openness: {
        ok: opennessOk,
        label: opennessOk
          ? `重心偏 ${Math.round(balanceOffset * 100)}%`
          : isHollow
            ? "中央空洞"
            : quads < 3
              ? `仅占 ${quads} 象限`
              : isTooCramped
                ? `展开 ${Math.round(Math.min(spanX, spanY) * 100)}%`
                : `偏沉 ${Math.round(balanceOffset * 100)}%`,
      },
    },
    metrics: {
      focalRatio,
      step12,
      step23,
      minGap,
      voidPct,
      alignedPairs,
      nnCV,
      spanX,
      spanY,
      quads,
      comX,
      comY,
      balanceOffset,
      edgeHugCount,
      centerNearest,
    },
    collisions,
    alignLines,
    nnLinks,
    breathMarks: computeBreathMarks(items, aspect),
  };
}

// ---------- 第 02 节：可复现的三分布生成器（棋盘网格 / 纯随机白噪声 / 泊松盘蓝噪声） ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDistribution(mode, count, minDistNorm, seed) {
  const rand = mulberry32(seed);
  const pad = 0.08;
  const span = 1 - pad * 2;
  const pts = [];

  if (mode === "grid") {
    const cols = Math.max(3, Math.round(Math.sqrt(count * 1.25)));
    const rows = Math.max(2, Math.ceil(count / cols));
    const dx = cols > 1 ? span / (cols - 1) : 0;
    const dy = rows > 1 ? span / (rows - 1) : 0;
    for (let r = 0; r < rows && pts.length < count; r++) {
      for (let c = 0; c < cols && pts.length < count; c++) {
        pts.push({ x: pad + c * dx, y: pad + r * dy });
      }
    }
  } else if (mode === "white") {
    for (let i = 0; i < count; i++) {
      pts.push({ x: pad + rand() * span, y: pad + rand() * span });
    }
  } else {
    // 泊松盘（Dart-Throwing + 轻度松弛，Cook 1986 经典思路）
    let r = minDistNorm;
    let attempts = 0;
    while (pts.length < count && attempts < 2200) {
      attempts++;
      const x = pad + rand() * span;
      const y = pad + rand() * span;
      let ok = true;
      for (let i = 0; i < pts.length; i++) {
        if (Math.hypot(x - pts[i].x, y - pts[i].y) < r) { ok = false; break; }
      }
      if (ok) pts.push({ x, y });
      // 若需求点数过密，略降阈值防止死循环并如实反映在指标中
      if (attempts % 420 === 0 && pts.length < count) r *= 0.88;
    }
  }

  // 实算最近邻间距统计与碰撞计数
  const nns = [];
  let tooClose = 0;
  const collideThresh = Math.max(0.055, minDistNorm * 0.65);
  for (let i = 0; i < pts.length; i++) {
    let best = Infinity;
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < best) best = d;
      if (j > i && d < collideThresh) tooClose++;
    }
    nns.push(best);
  }
  const mean = nns.reduce((s, v) => s + v, 0) / Math.max(1, nns.length);
  const std = Math.sqrt(nns.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, nns.length));
  const minNN = nns.length ? Math.min(...nns) : 0;
  const maxNN = nns.length ? Math.max(...nns) : 0;
  const cv = mean > 0.0001 ? std / mean : 0;

  return { pts, nns, minNN, maxNN, mean, cv, tooClose, collideThresh };
}
