// 126 群组构图 · 单真源几何与诊断模型
// 25 枚元素的真实坐标、尺寸、形状、色彩与群组归属全部在此统一求解；
// 画布绘制、卡尺标尺、右侧诊断与底沿四柱读数共用同一份计算结果。

export const PALETTE = {
  paper: "#FBF8F2",
  paperPure: "#FFFDF9",
  ink: "#0E1114",
  inkSoft: "#4A5058",
  rule: "#C8C3B8",
  orange: "#E54E08",
  orangeText: "#B33900",
  green: "#025321",
  navy: "#0A295A",
  pink: "#FA81AE",
  pinkText: "#A32255",
  monoDark: "#1E2329",
  monoMid: "#4A535E",
  bad: "#B91C1C",
  badSoft: "#FCEAEA",
  warn: "#9A4B00",
  ok: "#025321",
  okSoft: "#E6F4EB",
};

export const GROUP_META = {
  A: { id: "A", zh: "群组 A：方块组", en: "GROUP A · SQUARE", colorKey: "orange", shape: "square", count: 6, cols: 3, rows: 2 },
  B: { id: "B", zh: "群组 B：圆点组", en: "GROUP B · CIRCLE", colorKey: "green", shape: "circle", count: 6, cols: 3, rows: 2 },
  C: { id: "C", zh: "群组 C：深色方块组", en: "GROUP C · DARK SQUARE", colorKey: "navy", shape: "square", count: 4, cols: 2, rows: 2 },
  D: { id: "D", zh: "群组 D：粉色圆点组", en: "GROUP D · PINK CIRCLE", colorKey: "pink", shape: "circle", count: 9, cols: 3, rows: 3 },
};

export const CARRIERS = {
  poster: {
    id: "poster",
    label: "原海报 · 四色几何",
    short: "原海报几何",
    note: "25 枚几何元素按 6/6/4/9 组成原海报 A/B/C/D 四群",
    glyphs: {
      A: ["", "", "", "", "", ""],
      B: ["", "", "", "", "", ""],
      C: ["", "", "", ""],
      D: ["", "", "", "", "", "", "", "", ""],
    },
    groupTitles: {
      A: "群组 A：方块组",
      B: "群组 B：圆点组",
      C: "群组 C：深色方块组",
      D: "群组 D：粉色圆点组",
    },
  },
  ui: {
    id: "ui",
    label: "工作台 · 25 项指令",
    short: "界面指令",
    note: "排版(6) / 媒体(6) / 视图(4) / 协作(9) 四类工具按钮",
    glyphs: {
      A: ["粗", "斜", "齐", "行", "距", "表"],
      B: ["图", "片", "音", "绘", "框", "链"],
      C: ["尺", "网", "缩", "屏"],
      D: ["评", "标", "存", "导", "发", "邀", "史", "权", "锁"],
    },
    groupTitles: {
      A: "A 组：文字排版",
      B: "B 组：媒体插入",
      C: "C 组：视图画布",
      D: "D 组：协作与导出",
    },
  },
  exhibit: {
    id: "exhibit",
    label: "展陈墙 · 25 件展品",
    short: "展品卡片",
    note: "印刷(6) / 器物(6) / 建筑(4) / 装置(9) 四展区图录",
    glyphs: {
      A: ["字", "印", "格", "刊", "册", "封"],
      B: ["陶", "漆", "织", "木", "玻", "铜"],
      C: ["梁", "柱", "院", "桥"],
      D: ["光", "声", "影", "风", "镜", "波", "感", "动", "场"],
    },
    groupTitles: {
      A: "A 区：平面印刷",
      B: "B 区：手造器物",
      C: "C 区：空间建筑",
      D: "D 区：互动装置",
    },
  },
};

// 固定 25 枚元素的固有身份（精确对应 126 海报：6 朱橘方 + 6 深松绿圆 + 4 深蓝方 + 9 玫瑰粉圆）
export const BASE_ITEMS = (() => {
  const list = [];
  const order = ["A", "B", "C", "D"];
  for (const gId of order) {
    const meta = GROUP_META[gId];
    for (let i = 0; i < meta.count; i++) {
      list.push({
        id: list.length,
        homeGroup: gId,
        indexInGroup: i,
        baseShape: meta.shape,
        baseColor: meta.colorKey,
      });
    }
  }
  return list;
})();

export const SORTED_ASSIGNMENTS = Array.from({ length: 25 }, (_, i) => i);

// 确定性混排置换：让 4 个象限中每个区域都混入不同颜色与形状（同组纯度约 40%，非纯随机以保证稳定复现）
export const SCRAMBLED_ASSIGNMENTS = [
  0, 16, 7, 13, 21, 1,
  18, 2, 12, 8, 23, 14,
  19, 6, 3, 20,
  4, 9, 17, 15, 10, 5, 22, 11, 24,
];

// 槽位到原海报四组的映射（0..5 -> A, 6..11 -> B, 12..15 -> C, 16..24 -> D）
export function slotToGroupId(slotIdx) {
  if (slotIdx < 6) return "A";
  if (slotIdx < 12) return "B";
  if (slotIdx < 16) return "C";
  return "D";
}

// 9 碎组模式下，将 25 个槽位切碎成 9 个 2–3 枚的小条
const NINE_GROUP_BUCKETS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 13],
  [14, 15],
  [16, 17, 18],
  [19, 20, 21],
  [22, 23, 24],
];

// 2 阵营模式下，方(10) 与 圆(15) 分列左右
const TWO_GROUP_BUCKETS = [
  [0, 1, 2, 3, 4, 5, 12, 13, 14, 15], // 10 个方块位
  [6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23, 24], // 15 个圆点位
];

export const PRESETS = {
  broken: {
    label: "混群开场",
    layoutMode: "four",
    shapeRule: "mixed",
    colorRule: "mixed",
    interGap: 0.11,
    intraGap: 0.36,
    assignments: [...SCRAMBLED_ASSIGNMENTS],
  },
  poster: {
    label: "原海报四组解",
    layoutMode: "four",
    shapeRule: "sorted",
    colorRule: "sorted",
    interGap: 0.44,
    intraGap: 0.26,
    assignments: [...SORTED_ASSIGNMENTS],
  },
  mono: {
    label: "去色纯形解",
    layoutMode: "four",
    shapeRule: "sorted",
    colorRule: "mono",
    interGap: 0.48,
    intraGap: 0.24,
    assignments: [...SORTED_ASSIGNMENTS],
  },
  twoCamp: {
    label: "二大阵营解",
    layoutMode: "two",
    shapeRule: "sorted",
    colorRule: "sorted",
    interGap: 0.46,
    intraGap: 0.26,
    assignments: [...SORTED_ASSIGNMENTS],
  },
  conflict: {
    label: "试错：色形打架",
    layoutMode: "four",
    shapeRule: "sorted",
    colorRule: "conflict",
    interGap: 0.44,
    intraGap: 0.26,
    assignments: [...SORTED_ASSIGNMENTS],
  },
  fragmented: {
    label: "试错：9 组碎裂",
    layoutMode: "nine",
    shapeRule: "sorted",
    colorRule: "sorted",
    interGap: 0.48,
    intraGap: 0.22,
    assignments: [...SORTED_ASSIGNMENTS],
  },
  monolith: {
    label: "试错：一锅炖",
    layoutMode: "one",
    shapeRule: "sorted",
    colorRule: "sorted",
    interGap: 0.11,
    intraGap: 0.28,
    assignments: [...SORTED_ASSIGNMENTS],
  },
};

export function createInitialState() {
  return {
    carrier: "poster",
    layoutMode: PRESETS.broken.layoutMode,
    shapeRule: PRESETS.broken.shapeRule,
    colorRule: PRESETS.broken.colorRule,
    interGap: PRESETS.broken.interGap,
    intraGap: PRESETS.broken.intraGap,
    assignments: [...PRESETS.broken.assignments],
    showGuides: true,
    activePreset: "broken",
  };
}

export function applyPreset(state, key) {
  const p = PRESETS[key];
  if (!p) return state;
  state.layoutMode = p.layoutMode;
  state.shapeRule = p.shapeRule;
  state.colorRule = p.colorRule;
  state.interGap = p.interGap;
  state.intraGap = p.intraGap;
  state.assignments = [...p.assignments];
  state.activePreset = key;
  return state;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算某件元素当前的真实呈现颜色和形状
function resolveVisualAttrs(item, slotGroup, state) {
  let shape = item.baseShape;
  let colorKey = item.baseColor;

  if (state.shapeRule === "sorted") {
    // 若用户按形状归位但未按颜色归位，方块组(A/C)强制方、圆点组(B/D)强制圆
    if (slotGroup === "A" || slotGroup === "C" || slotGroup === "S1") shape = "square";
    else if (slotGroup === "B" || slotGroup === "D" || slotGroup === "S2") shape = "circle";
  }

  if (state.colorRule === "sorted") {
    if (slotGroup === "A" || slotGroup === "S1") colorKey = "orange";
    else if (slotGroup === "B" || slotGroup === "S2") colorKey = "green";
    else if (slotGroup === "C") colorKey = "navy";
    else if (slotGroup === "D") colorKey = "pink";
  } else if (state.colorRule === "conflict") {
    // 故意让颜色按行/列与空间群组交叉打架
    const conflictMap = ["orange", "green", "pink", "navy"];
    colorKey = conflictMap[(item.indexInGroup + (slotGroup === "A" || slotGroup === "C" ? 0 : 1)) % 4];
  } else if (state.colorRule === "mono") {
    colorKey = shape === "square" ? "monoDark" : "monoMid";
  }

  const fill = PALETTE[colorKey] || PALETTE.ink;
  return { shape, colorKey, fill };
}

// 求解 25 枚元素的真实屏幕几何坐标（等比不拉伸，圆永远是正圆、方永远是正方）
export function computeLayout(state, width, height) {
  const W = Math.max(280, width);
  const H = Math.max(210, height);
  const compact = W < 500 || H < 320;
  const padX = compact ? 18 : 30;
  const padTop = compact ? 50 : 64;
  const padBot = compact ? 40 : 50;
  const availW = W - padX * 2;
  const availH = H - padTop - padBot;

  const carrier = CARRIERS[state.carrier] || CARRIERS.poster;

  // 将 0..1 的控制量映射为相对元素边长的几何倍数
  // intraFactor: 0.07 (紧密) ~ 0.40 (偏松)
  const intraFactor = 0.07 + clamp(state.intraGap, 0, 1) * 0.33;
  // interFactor: 0.09 (与组内几乎齐平) ~ 0.99 (大幅拉开至失联)
  const interFactor = 0.09 + clamp(state.interGap, 0, 1) * 0.90;

  const items = [];
  const groups = [];
  let unit = 32;
  let intraPx = 8;
  let interPx = 8;
  let caliper = null;

  if (state.layoutMode === "one") {
    // 5x5 一整块无分隔
    const cols = 5;
    const rows = 5;
    const maxUnitW = availW / (cols + (cols - 1) * intraFactor);
    const maxUnitH = availH / (rows + (rows - 1) * intraFactor);
    unit = Math.min(maxUnitW, maxUnitH, compact ? 44 : 62);
    intraPx = unit * intraFactor;
    interPx = 0;

    const totalW = cols * unit + (cols - 1) * intraPx;
    const totalH = rows * unit + (rows - 1) * intraPx;
    const ox = (W - totalW) / 2;
    const oy = padTop + (availH - totalH) / 2;

    for (let slot = 0; slot < 25; slot++) {
      const itemId = state.assignments[slot];
      const base = BASE_ITEMS[itemId];
      const c = slot % 5;
      const r = Math.floor(slot / 5);
      const x = ox + c * (unit + intraPx);
      const y = oy + r * (unit + intraPx);
      const vis = resolveVisualAttrs(base, slotToGroupId(slot), state);
      const glyph = carrier.glyphs[base.homeGroup][base.indexInGroup] || "";
      items.push({
        slot,
        itemId,
        homeGroup: base.homeGroup,
        spatialGroup: "M1",
        x,
        y,
        size: unit,
        cx: x + unit / 2,
        cy: y + unit / 2,
        ...vis,
        glyph,
        isRebel: false,
      });
    }
    groups.push({
      id: "M1",
      zh: "单一整团（无组间分隔）",
      en: "SINGLE UNDIVIDED MASS",
      x: ox,
      y: oy,
      w: totalW,
      h: totalH,
      items: items.slice(),
    });
    caliper = {
      x1: ox + totalW * 0.35,
      x2: ox + totalW * 0.35 + intraPx,
      y: oy + totalH + (compact ? 16 : 22),
      px: 0,
      label: "无组间通道",
    };
  } else if (state.layoutMode === "two") {
    // 2 大阵营：左 10 枚(2x5 或 2x3+2x2 → 排成 2列5行 或 3x4? 2列5行太高，排成左 2x5 / 3+3+2+2 → 更匀称：左 2行5列太宽，用左 3x4(空2) 不如左 2列×5行? 不，左 4列×3行=12(排10) 或 左 3×3+1 也不整，排成 2×5 vs 3×5！正好等高 5 行，左边 2×5=10、右边 3×5=15，严丝合缝！)
    // 等一下：5行的话，横向 2+3=5 列 + 中央通道，高宽比 5:5.5 非常大方！
    const colsL = 2;
    const colsR = 3;
    const rows = 5;
    const maxUnitW = availW / (colsL + colsR + (colsL - 1 + colsR - 1) * intraFactor + interFactor * 1.15);
    const maxUnitH = availH / (rows + (rows - 1) * intraFactor);
    unit = Math.min(maxUnitW, maxUnitH, compact ? 42 : 58);
    intraPx = unit * intraFactor;
    interPx = unit * interFactor * 1.15;

    const wL = colsL * unit + (colsL - 1) * intraPx;
    const wR = colsR * unit + (colsR - 1) * intraPx;
    const totalW = wL + interPx + wR;
    const totalH = rows * unit + (rows - 1) * intraPx;
    const ox = (W - totalW) / 2;
    const oy = padTop + (availH - totalH) / 2;

    const specs = [
      { id: "S1", zh: "阵营 I：方块集合（10）", en: "CAMP I · SQUARES", slots: TWO_GROUP_BUCKETS[0], cols: colsL, gx: ox, gy: oy, gw: wL, gh: totalH },
      { id: "S2", zh: "阵营 II：圆点集合（15）", en: "CAMP II · CIRCLES", slots: TWO_GROUP_BUCKETS[1], cols: colsR, gx: ox + wL + interPx, gy: oy, gw: wR, gh: totalH },
    ];

    for (const sp of specs) {
      const gItems = [];
      sp.slots.forEach((slot, idx) => {
        const itemId = state.assignments[slot];
        const base = BASE_ITEMS[itemId];
        const c = idx % sp.cols;
        const r = Math.floor(idx / sp.cols);
        const x = sp.gx + c * (unit + intraPx);
        const y = sp.gy + r * (unit + intraPx);
        const vis = resolveVisualAttrs(base, sp.id, state);
        const glyph = carrier.glyphs[base.homeGroup][base.indexInGroup] || "";
        const entry = {
          slot,
          itemId,
          homeGroup: base.homeGroup,
          spatialGroup: sp.id,
          x,
          y,
          size: unit,
          cx: x + unit / 2,
          cy: y + unit / 2,
          ...vis,
          glyph,
          isRebel: false,
        };
        items.push(entry);
        gItems.push(entry);
      });
      groups.push({ id: sp.id, zh: sp.zh, en: sp.en, x: sp.gx, y: sp.gy, w: sp.gw, h: sp.gh, items: gItems });
    }
    caliper = {
      x1: ox + wL,
      x2: ox + wL + interPx,
      y: oy + totalH + (compact ? 16 : 22),
      px: interPx,
      label: `组距 ${Math.round(interPx)}px`,
    };
  } else if (state.layoutMode === "nine") {
    // 9 个零碎小组排成 3×3 小条阵，直观暴露碎片过载
    const gCols = 3;
    const gRows = 3;
    const maxItemsPerRow = 3;
    // 宽度上：3 个小组 * 3 枚 = 9 枚宽 + 6 个组内距 + 2 个组间距
    const interEff = Math.max(interFactor * 0.72, intraFactor * 1.6);
    const maxUnitW = availW / (gCols * maxItemsPerRow + gCols * (maxItemsPerRow - 1) * intraFactor + (gCols - 1) * interEff);
    const maxUnitH = availH / (gRows + (gRows - 1) * Math.max(interEff, 0.85));
    unit = Math.min(maxUnitW, maxUnitH, compact ? 28 : 42);
    intraPx = unit * intraFactor;
    interPx = unit * interEff;

    const cellW = maxItemsPerRow * unit + (maxItemsPerRow - 1) * intraPx;
    const totalW = gCols * cellW + (gCols - 1) * interPx;
    const rowGap = Math.max(interPx, unit * 0.9);
    const totalH = gRows * unit + (gRows - 1) * rowGap;
    const ox = (W - totalW) / 2;
    const oy = padTop + (availH - totalH) / 2;

    NINE_GROUP_BUCKETS.forEach((slots, gi) => {
      const gc = gi % 3;
      const gr = Math.floor(gi / 3);
      const gx = ox + gc * (cellW + interPx);
      const gy = oy + gr * (unit + rowGap);
      const gw = slots.length * unit + (slots.length - 1) * intraPx;
      const gItems = [];
      slots.forEach((slot, idx) => {
        const itemId = state.assignments[slot];
        const base = BASE_ITEMS[itemId];
        const x = gx + idx * (unit + intraPx);
        const y = gy;
        const vis = resolveVisualAttrs(base, slotToGroupId(slot), state);
        const glyph = carrier.glyphs[base.homeGroup][base.indexInGroup] || "";
        const entry = {
          slot,
          itemId,
          homeGroup: base.homeGroup,
          spatialGroup: `G${gi + 1}`,
          x,
          y,
          size: unit,
          cx: x + unit / 2,
          cy: y + unit / 2,
          ...vis,
          glyph,
          isRebel: false,
        };
        items.push(entry);
        gItems.push(entry);
      });
      groups.push({
        id: `G${gi + 1}`,
        zh: `碎组 ${gi + 1}`,
        en: `MICRO ${gi + 1}`,
        x: gx,
        y: gy,
        w: gw,
        h: unit,
        items: gItems,
      });
    });

    caliper = {
      x1: ox + cellW,
      x2: ox + cellW + interPx,
      y: oy + totalH + (compact ? 16 : 22),
      px: interPx,
      label: `9 碎组 · 通道 ${Math.round(interPx)}px`,
    };
  } else {
    // 默认核心模式："four" —— 1:1 复刻 126 原海报 A(3x2) B(3x2) / C(2x2) D(3x3)
    // 当 interGap 极低（~0.08）且 intraGap 约 0.36 时，A/B/C/D 通道与组内距几乎齐平（ratio ≈ 1.00×）
    const topUnitsX = 6; // A(3) + B(3)
    const totalIntraX = 4; // A 内 2 + B 内 2
    const rowsRight = 5; // B(2) + D(3)
    const totalIntraY = 3; // B 内 1 + D 内 2
    // 让上下两排留出原海报的组标高（interFactor 足够小时退缩到接近 intraFactor）
    const hGapFactor = interFactor;
    const vGapFactor = interFactor * 0.92;

    const maxUnitW = availW / (topUnitsX + totalIntraX * intraFactor + hGapFactor);
    const maxUnitH = availH / (rowsRight + totalIntraY * intraFactor + vGapFactor);
    unit = Math.min(maxUnitW, maxUnitH, compact ? 44 : 64);
    intraPx = unit * intraFactor;
    interPx = unit * hGapFactor;
    const interPy = unit * vGapFactor;

    const wA = 3 * unit + 2 * intraPx;
    const hA = 2 * unit + 1 * intraPx;
    const wB = 3 * unit + 2 * intraPx;
    const hB = 2 * unit + 1 * intraPx;
    const wC = 2 * unit + 1 * intraPx;
    const hC = 2 * unit + 1 * intraPx;
    const wD = 3 * unit + 2 * intraPx;
    const hD = 3 * unit + 2 * intraPx;

    const totalW = wA + interPx + wB;
    const totalH = hB + interPy + hD;
    const ox = (W - totalW) / 2;
    const oy = padTop + (availH - totalH) / 2;

    // 精确复刻原海报的 2×2 落位：
    // A 左上(3x2), B 右上(3x2), C 左下(2x2，略右移以贴近中轴或居中左栏，如同原海报 C 居中对齐于 A 宽度!), D 右下(3x3)
    const xA = ox;
    const yA = oy;
    const xB = ox + wA + interPx;
    const yB = oy;
    const xC = ox + (wA - wC) * 0.55; // 与 126 原海报一致：C 比 A 窄一列，略靠左栏中部偏右
    const yC = oy + hA + interPy + (hD - hC) * 0.25;
    const xD = xB;
    const yD = oy + hB + interPy;

    const defs = [
      { id: "A", cols: 3, rows: 2, gx: xA, gy: yA, gw: wA, gh: hA, startSlot: 0, count: 6 },
      { id: "B", cols: 3, rows: 2, gx: xB, gy: yB, gw: wB, gh: hB, startSlot: 6, count: 6 },
      { id: "C", cols: 2, rows: 2, gx: xC, gy: yC, gw: wC, gh: hC, startSlot: 12, count: 4 },
      { id: "D", cols: 3, rows: 3, gx: xD, gy: yD, gw: wD, gh: hD, startSlot: 16, count: 9 },
    ];

    for (const d of defs) {
      const gItems = [];
      for (let i = 0; i < d.count; i++) {
        const slot = d.startSlot + i;
        const itemId = state.assignments[slot];
        const base = BASE_ITEMS[itemId];
        const c = i % d.cols;
        const r = Math.floor(i / d.cols);
        const x = d.gx + c * (unit + intraPx);
        const y = d.gy + r * (unit + intraPx);
        const vis = resolveVisualAttrs(base, d.id, state);
        const glyph = carrier.glyphs[base.homeGroup][base.indexInGroup] || "";
        const entry = {
          slot,
          itemId,
          homeGroup: base.homeGroup,
          spatialGroup: d.id,
          x,
          y,
          size: unit,
          cx: x + unit / 2,
          cy: y + unit / 2,
          ...vis,
          glyph,
          isRebel: false,
        };
        items.push(entry);
        gItems.push(entry);
      }
      groups.push({
        id: d.id,
        zh: carrier.groupTitles[d.id],
        en: GROUP_META[d.id].en,
        x: d.gx,
        y: d.gy,
        w: d.gw,
        h: d.gh,
        items: gItems,
      });
    }

    // 原海报底沿虚线距尺：量取 C 右边到 D 左边的真实净间距！
    const cRight = xC + wC;
    const dLeft = xD;
    caliper = {
      x1: cRight,
      x2: dLeft,
      y: yD + hD + (compact ? 16 : 22),
      px: Math.max(0, dLeft - cRight),
      alleyX: xA + wA,
      alleyW: interPx,
      alleyY: yA + hA,
      alleyH: interPy,
      label: `组间距 ${Math.round(interPx)}px`,
    };
  }

  // 在每个空间群组里统计主导形状、主导颜色与叛徒件（不依赖任何硬编码常量）
  let shapeMatchTotal = 0;
  let colorMatchTotal = 0;
  let rebelCount = 0;

  // 若是 four / two 模式，还要检查跨组是否撞衫（两个不同组用了完全一样的主导颜色+形状）
  const groupSignatures = [];

  for (const g of groups) {
    const shapeCounts = {};
    const colorCounts = {};
    for (const it of g.items) {
      shapeCounts[it.shape] = (shapeCounts[it.shape] || 0) + 1;
      colorCounts[it.colorKey] = (colorCounts[it.colorKey] || 0) + 1;
    }
    const domShape = Object.entries(shapeCounts).sort((a, b) => b[1] - a[1])[0][0];
    const domColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];
    g.dominantShape = domShape;
    g.dominantColor = domColor;
    g.shapePurity = g.items.length ? shapeCounts[domShape] / g.items.length : 1;
    g.colorPurity = g.items.length ? colorCounts[domColor] / g.items.length : 1;
    groupSignatures.push(`${domShape}:${domColor}`);

    for (const it of g.items) {
      const sOk = it.shape === domShape;
      const cOk = state.colorRule === "mono" ? true : it.colorKey === domColor;
      if (sOk) shapeMatchTotal++;
      if (cOk) colorMatchTotal++;
      // 只有当空间群组多于 1 个时，才标记偏离当前组主导特征的串组件
      if (state.layoutMode !== "one" && (!sOk || !cOk)) {
        it.isRebel = true;
        rebelCount++;
      }
    }
  }

  // 真实量测边界间距与碰撞
  const minEdge = items.reduce(
    (m, it) => Math.min(m, it.x, it.y, W - (it.x + it.size), H - (it.y + it.size)),
    999
  );
  const edgeCollision = intraPx < 2.8 || minEdge < 6;

  // 实测间/内距比
  const spacingRatio = state.layoutMode === "one"
    ? 1.0
    : intraPx > 0.5
      ? interPx / intraPx
      : 5.0;

  // 真实视觉感知组数：如果组间距不到组内距的 1.38 倍，肉眼会将其融合成 1 个大网格
  const plannedGroups = groups.length;
  const perceivedGroups = state.layoutMode === "one"
    ? 1
    : spacingRatio < 1.38
      ? 1
      : plannedGroups;

  const shapePurity = Math.round((shapeMatchTotal / items.length) * 100);
  const colorPurity = state.colorRule === "mono"
    ? 100
    : Math.round((colorMatchTotal / items.length) * 100);

  // 线索冲突：主动开了色形打架，或者形状已整齐 (>=88%) 但色彩在组内裂成多色 (<72%)
  const cueConflict = state.colorRule === "conflict" ||
    (state.colorRule !== "mono" && state.layoutMode !== "one" && shapePurity >= 88 && colorPurity < 72);

  // 组内失散或组间飘散
  const intraTooLoose = intraPx > unit * 0.38;
  const interTooWide = state.layoutMode !== "one" && spacingRatio > 4.65;
  const scattered = intraTooLoose || interTooWide;

  return {
    width: W,
    height: H,
    unit,
    intraPx,
    interPx,
    spacingRatio,
    plannedGroups,
    perceivedGroups,
    shapePurity,
    colorPurity,
    rebelCount,
    cueConflict,
    edgeCollision,
    scattered,
    intraTooLoose,
    interTooWide,
    colorCueActive: state.colorRule !== "mono",
    items,
    groups,
    caliper,
  };
}

// 单真源诊断器：同一份 layout 同时产出状态码、白话解释、下一步动作与底沿四柱读数
export function evaluate(state, width = 760, height = 490) {
  const layout = computeLayout(state, width, height);
  const {
    spacingRatio,
    perceivedGroups,
    plannedGroups,
    shapePurity,
    colorPurity,
    rebelCount,
    cueConflict,
    edgeCollision,
    scattered,
    intraTooLoose,
    interTooWide,
    colorCueActive,
  } = layout;

  const isMonolith = state.layoutMode === "one";
  const isFragmented = plannedGroups > 5 && perceivedGroups > 5;
  const isCollapsed = !isMonolith && spacingRatio < 1.65;
  const isScrambled = !isMonolith && (shapePurity < 90 || (colorCueActive && colorPurity < 90));

  const clusterOk = !isMonolith && shapePurity >= 90 && (!colorCueActive || colorPurity >= 90) && !cueConflict && !intraTooLoose;
  const spacingOk = !isMonolith && spacingRatio >= 1.65 && spacingRatio <= 4.65 && !edgeCollision;
  const moduleOk = perceivedGroups >= 2 && perceivedGroups <= 5 && !edgeCollision && !interTooWide;
  const organizeOk = clusterOk && spacingOk && moduleOk && !cueConflict;

  const score = [clusterOk, spacingOk, moduleOk, organizeOk].filter(Boolean).length;

  const ratioStr = isMonolith ? "1.00×" : `${spacingRatio.toFixed(2)}×`;
  const purityMin = colorCueActive ? Math.min(shapePurity, colorPurity) : shapePurity;

  let statusCode = "pass";
  let badgeShort = "群组清晰";
  let headline = "";
  let reason = "";
  let nextStep = "";
  let quickFix = null;
  let tier = "一目了然（示意）";

  if (cueConflict) {
    statusCode = "conflict";
    badgeShort = "色形打架";
    tier = "线索撕裂（示意）";
    headline = `同组色纯度仅 ${colorPurity}%，颜色跨组拉扯空间结构`;
    reason = "位置和形状把元素拉进了四个块，但交叉配色又把不同块的同色元素隔空勾连。两种分组信号互相抵消，视线在「按块看」和「按色看」之间反复跳闸。";
    nextStep = "把颜色切换到「四色成群」，或切到「去色纯墨」关闭干扰色，让所有视觉线索朝同一方向使力。";
    quickFix = { id: "fix-color", label: "统一颜色线索" };
  } else if (isMonolith) {
    statusCode = "monolith";
    badgeShort = "一锅炖";
    tier = "无层入口（示意）";
    headline = "25 枚元素挤成单一整团，没有视觉停靠站";
    reason = "缺少组间通道把元素切分成模块，眼睛只能从左上角一格一格线性扫完 25 项。信息量并未减少，读者的心智负担却成倍上升。";
    nextStep = "把群组架构切回「四组标准」或「二大阵营」，再拉开组间通道到组内距的 1.7 倍以上。";
    quickFix = { id: "fix-four", label: "拆回 4 个清晰群组" };
  } else if (isFragmented) {
    statusCode = "fragmented";
    badgeShort = "碎片过载";
    tier = "碎散过载（示意）";
    headline = `当前拆出 ${perceivedGroups} 个碎组，超出约 4 组的工作记忆舒适区`;
    reason = "组数太多反而失去了「打包省力」的意义。Nelson Cowan (2001) 指出人的瞬时注意焦点大致容纳约 4 个组块；切到 9 碎块后，页面重新变成一盘零星散点。";
    nextStep = "把相近主题合并回 2–5 个主群组（例如原海报的 A/B/C/D 四组），让层次重新站稳。";
    quickFix = { id: "fix-four", label: "合并为 4 组结构" };
  } else if (edgeCollision) {
    statusCode = "crowded";
    badgeShort = "贴边挤压";
    tier = "呼吸窒息（示意）";
    headline = "组内元素几乎相撞，模块内部失去基本呼吸";
    reason = "组内距压得过死时，轮廓边界互相吞并，单个元素（尤其是文字按钮或图标）的可辨认度迅速下滑。";
    nextStep = "把「组内距」稍微放宽到 15%–30%，保持紧而不贴的模块感。";
    quickFix = { id: "fix-intra", label: "恢复组内呼吸距" };
  } else if (isCollapsed && isScrambled) {
    statusCode = "scrambled";
    badgeShort = "混群粘连";
    tier = "满纸散沙（示意）";
    headline = `距比仅 ${ratioStr} 且同组纯度 ${purityMin}%，25 枚元素糊成一面花墙`;
    reason = "现在既没有组间通道，颜色与形状又在四个区域里跨位串门。眼睛同时收到杂乱的邻近与相似信号，只能当成 25 个零散个体硬看。";
    nextStep = "先在画布中轴向右横拖拉开组间通道（距比 ≥ 1.65×），再把散落元素按形状与颜色归队。";
    quickFix = { id: "fix-gap", label: "先拉开组间通道" };
  } else if (isCollapsed) {
    statusCode = "collapsed";
    badgeShort = "间距糊墙";
    tier = "边界模糊（示意）";
    headline = `组间/组内距比只有 ${ratioStr}，四组边界互相粘连`;
    reason = "虽然同类元素已经排在同一区域，但组与组之间的空隙和组内缝隙差不多宽（低于经验门槛 1.65×）。一退远看，四组还是连成了一块大网格。";
    nextStep = "在画布中央向右横拖，把底沿虚线距尺拉到 1.7×–3.4×，让组与组之间真正透出呼吸通道。";
    quickFix = { id: "fix-gap", label: "拉开通道至 2.4×" };
  } else if (isScrambled) {
    statusCode = "scrambled";
    badgeShort = "混群失序";
    tier = "串组干扰（示意）";
    headline = `通道已拉开（${ratioStr}），但还有 ${rebelCount} 枚元素串错了组`;
    reason = "空间上已经分出 4 块区域，可每个块里仍混着异形异色的串组元素（画布红圈标出）。读者刚按位置认出一组，又被颜色拽去另一角。";
    nextStep = "直接点击画布上带红圈的串组元素逐枚归队，或在旁边把形状与颜色切为「归位」。";
    quickFix = { id: "fix-sort", label: "把串组元素全部归队" };
  } else if (scattered) {
    statusCode = "scattered";
    badgeShort = "失联飘散";
    tier = "散架失联（示意）";
    headline = intraTooLoose
      ? "组内距放得太松，单个模块自己先散了架"
      : `距比拉到 ${ratioStr}，四组退到死角彼此失联`;
    reason = intraTooLoose
      ? "每个组里的元素离得太远，反而看起来像各自独立的散点，失去了「一眼看成一块」的凝聚力。"
      : "组间通道过宽时，中央被掏出大块死白，四个群组不再像同一张版面的有机整体，而像四张毫不相干的碎贴纸。";
    nextStep = intraTooLoose
      ? "把「组内距」收紧回 20%–28%，让同组元素重新抱团。"
      : "在画布中轴向左微收，把距比回调到 1.8×–3.5× 的舒展区间。";
    quickFix = { id: "fix-balance", label: "回调到均衡距比" };
  } else {
    statusCode = "pass";
    if (!colorCueActive) {
      badgeShort = "去色纯形达标";
      headline = `零色彩辅助下依然四组清透（距比 ${ratioStr}，形状纯度 ${shapePurity}%）`;
      reason = "关掉全部色相后，仅靠形状归类与明确的组间通道，四个模块依然一秒可读——这说明你的版面结构本身站得住，不靠涂色硬撑，也对色觉障碍友好。";
      nextStep = "试试故意拖一枚元素串组，或切到「试错：色形打架」，亲眼看结构如何瞬间瓦解。";
    } else if (state.layoutMode === "two") {
      badgeShort = "二营精简达标";
      headline = `方块与圆点分为两大阵营（距比 ${ratioStr}，纯度 100%）`;
      reason = "当页面只需要一级粗分组（例如「主操作 vs 辅助操作」）时，2 组结构比 4 组扫描更快，层次直截了当。";
      nextStep = "也可切回原海报 4 组结构，对比 2 组与 4 组在信息细分上的节奏差异。";
    } else {
      badgeShort = "群组清晰";
      headline = `4 个清晰群组一目了然（距比 ${ratioStr}，纯度 ${purityMin}%）`;
      reason = "形状、颜色与组间通道三股力量同向发力：组内抱紧成块，组间留出呼吸走廊，25 枚元素被压缩成 4 个正好落在工作记忆舒适区里的视觉模块。";
      nextStep = "试着切到「工作台指令」或「展陈墙」看真实排版效果，或拖乱任意两枚元素感受破功瞬间。";
    }
  }

  // 底沿 1:1 复刻原海报四柱实况读数（聚类｜间距｜模块｜组织）
  const pillars = [
    {
      id: "cluster",
      zh: "聚类",
      en: "CLUSTER",
      state: clusterOk ? "ok" : "bad",
      value: clusterOk
        ? `纯度 ${purityMin}%`
        : cueConflict
          ? "色形撕裂"
          : intraTooLoose
            ? "组内散架"
            : `混杂 ${rebelCount} 枚`,
      detail: clusterOk ? "同组抱团紧密" : "组内特征未统一",
    },
    {
      id: "spacing",
      zh: "间距",
      en: "SPACING",
      state: spacingOk ? "ok" : "bad",
      value: `距比 ${ratioStr}`,
      detail: isCollapsed || isMonolith
        ? "低于 1.65× 粘连"
        : interTooWide
          ? "超过 4.65× 失联"
          : edgeCollision
            ? "元素相撞挤压"
            : "通道清晰分明",
    },
    {
      id: "module",
      zh: "模块",
      en: "MODULE",
      state: moduleOk ? "ok" : "bad",
      value: `${perceivedGroups} 个视觉块`,
      detail: perceivedGroups === 1
        ? "糊成单一整块"
        : perceivedGroups > 5
          ? "超过 5 组过碎"
          : "落在 2–5 块区间",
    },
    {
      id: "organize",
      zh: "组织",
      en: "ORGANIZE",
      state: organizeOk ? "ok" : "bad",
      value: organizeOk ? "三线索协同" : badgeShort,
      detail: organizeOk ? "结构清晰易读" : "主次层次未立",
    },
  ];

  return {
    layout,
    score,
    statusCode,
    badgeShort,
    badgeFull: `${score}/4 · ${badgeShort}`,
    headline,
    reason,
    nextStep,
    quickFix,
    tier,
    ratioStr,
    purityMin,
    pillars,
  };
}
