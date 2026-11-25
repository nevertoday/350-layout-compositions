// 246 簇群（CLUSTER GROUPING）—— 单真源知觉聚类与几何分析模型
// 开场 2D 画布、白话诊单、实算比值读数、实时 CSS 代码与原海报四栏要点全部读取同一份 analyzeClusterState() 结果。

export const PALETTE = {
  paper: "#FDF6ED",
  ivory: "#FFFBF5",
  peach: "#FFE9D9",
  peachLine: "#FFC7B6",
  vermilion: "#F24E26",
  vermilionDeep: "#C93612",
  vermilionText: "#B82E0C",
  pink: "#FBB0AE",
  pinkSoft: "#FDE9E6",
  pinkText: "#9E2E32",
  ink: "#080808",
  inkSoft: "#4B423D",
  outlierPill: "#22201F",
  ok: "#156B53",
  okBg: "#E6F4EF",
  err: "#AD1C1C",
  errBg: "#FCEAEA",
  warn: "#A64B00",
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 21 标本",
    short: "原海报标本",
    groupNames: { A: "簇群 A", B: "簇群 B", C: "簇群 C", D: "簇群 D", O: "离群点" },
    summaryNote: "21 件几何标本：A 橘圆 · B 橘矩 · C 粉圆 · D 黑方 · 离群黑菱",
  },
  navbar: {
    id: "navbar",
    label: "导航 + 工具栏",
    short: "导航工具栏",
    groupNames: { A: "主导航簇", B: "文档操作簇", C: "筛选状态簇", D: "视图切换簇", O: "主行动离群" },
    summaryNote: "真实网页顶栏的 4 组功能单元 + 1 枚孤立主按钮",
  },
  tags: {
    id: "tags",
    label: "筛选标签云",
    short: "筛选标签云",
    groupNames: { A: "品类簇", B: "风格簇", C: "色系簇", D: "介质簇", O: "清空离群钮" },
    summaryNote: "不等宽胶囊如何靠组内紧、组间宽免框分区",
  },
};

// 开场刻意停在 0/4 错态（四项全破：组间粘连 + 形态混杂 + 游离孤点 + 离群被吞）
export function createInitialState() {
  return {
    theme: "poster",
    intraGap: 26, // 组内过松（px）
    interGap: 14, // 组间过挤（px），比值仅 ~0.5×
    similarityMode: "mixed", // "mixed" | "unified" | "colorOnly"
    frameMode: "dashed", // "dashed" | "none" | "heavy"
    fixedIntruders: [false, false, false, false], // 4 处跨簇混色/混形干扰项
    strayDrift: { u: 0.92, v: 0.44 }, // A 组游离孤点漂移（0,0 为归位）
    outlierPull: { u: -0.92, v: 0.12 }, // 离群黑菱被拖进 D 组边缘（0,0 为孤立就位）
    selectedItemId: null,
  };
}

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    apply: () => createInitialState(),
  },
  posterClassic: {
    label: "原海报经典解",
    apply: (cur) => ({
      ...cur,
      intraGap: 14,
      interGap: 48,
      similarityMode: "unified",
      frameMode: "dashed",
      fixedIntruders: [true, true, true, true],
      strayDrift: { u: 0, v: 0 },
      outlierPull: { u: 0, v: 0 },
    }),
  },
  compactClean: {
    label: "无框紧凑解",
    apply: (cur) => ({
      ...cur,
      intraGap: 9,
      interGap: 40,
      similarityMode: "unified",
      frameMode: "none",
      fixedIntruders: [true, true, true, true],
      strayDrift: { u: 0, v: 0 },
      outlierPull: { u: 0, v: 0 },
    }),
  },
  airyEditorial: {
    label: "宽松杂志解",
    apply: (cur) => ({
      ...cur,
      intraGap: 17,
      interGap: 66,
      similarityMode: "unified",
      frameMode: "dashed",
      fixedIntruders: [true, true, true, true],
      strayDrift: { u: 0, v: 0 },
      outlierPull: { u: 0, v: 0 },
    }),
  },
  faultInverted: {
    label: "试错：内松外紧",
    apply: (cur) => ({
      ...cur,
      intraGap: 28,
      interGap: 12,
      similarityMode: "unified",
      frameMode: "dashed",
      fixedIntruders: [true, true, true, true],
      strayDrift: { u: 0, v: 0 },
      outlierPull: { u: 0, v: 0 },
    }),
  },
  faultHeavyBox: {
    label: "试错：满屏套硬框",
    apply: (cur) => ({
      ...cur,
      intraGap: 14,
      interGap: 46,
      similarityMode: "unified",
      frameMode: "heavy",
      fixedIntruders: [true, true, true, true],
      strayDrift: { u: 0, v: 0 },
      outlierPull: { u: 0, v: 0 },
    }),
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 不同题材里 21 件（或对应数量）元素的标签与几何规格
const ITEM_DEFS = {
  poster: {
    A: [
      { id: "A0", shape: "circle", rx: 22, ry: 22, color: PALETTE.vermilion, label: "" },
      { id: "A1", shape: "circle", rx: 22, ry: 22, color: PALETTE.vermilion, label: "" },
      { id: "A2", shape: "circle", rx: 22, ry: 22, color: PALETTE.vermilion, label: "" },
      { id: "A3", shape: "circle", rx: 22, ry: 22, color: PALETTE.vermilion, label: "" },
      { id: "A4", shape: "circle", rx: 22, ry: 22, color: PALETTE.vermilion, label: "", isStray: true },
    ],
    B: [
      { id: "B0", shape: "rect", rx: 35, ry: 17, color: PALETTE.vermilion, label: "" },
      { id: "B1", shape: "rect", rx: 35, ry: 17, color: PALETTE.vermilion, label: "" },
      { id: "B2", shape: "rect", rx: 35, ry: 17, color: PALETTE.vermilion, label: "" },
      { id: "B3", shape: "rect", rx: 35, ry: 17, color: PALETTE.vermilion, label: "" },
      { id: "B4", shape: "rect", rx: 35, ry: 17, color: PALETTE.vermilion, label: "" },
    ],
    C: [
      { id: "C0", shape: "circle", rx: 21, ry: 21, color: PALETTE.pink, label: "" },
      { id: "C1", shape: "circle", rx: 21, ry: 21, color: PALETTE.pink, label: "" },
      { id: "C2", shape: "circle", rx: 21, ry: 21, color: PALETTE.pink, label: "" },
      { id: "C3", shape: "circle", rx: 21, ry: 21, color: PALETTE.pink, label: "" },
      { id: "C4", shape: "circle", rx: 21, ry: 21, color: PALETTE.pink, label: "" },
      { id: "C5", shape: "circle", rx: 21, ry: 21, color: PALETTE.pink, label: "" },
    ],
    D: [
      { id: "D0", shape: "square", rx: 21, ry: 21, color: PALETTE.ink, label: "" },
      { id: "D1", shape: "square", rx: 21, ry: 21, color: PALETTE.ink, label: "" },
      { id: "D2", shape: "square", rx: 21, ry: 21, color: PALETTE.ink, label: "" },
      { id: "D3", shape: "square", rx: 21, ry: 21, color: PALETTE.ink, label: "" },
    ],
    O: [
      { id: "O0", shape: "diamond", rx: 24, ry: 24, color: PALETTE.ink, label: "", isOutlier: true },
    ],
  },
  navbar: {
    A: [
      { id: "A0", shape: "pill", rx: 30, ry: 17, color: PALETTE.vermilion, label: "概览" },
      { id: "A1", shape: "pill", rx: 30, ry: 17, color: PALETTE.vermilion, label: "规范" },
      { id: "A2", shape: "pill", rx: 30, ry: 17, color: PALETTE.vermilion, label: "组件" },
      { id: "A3", shape: "pill", rx: 30, ry: 17, color: PALETTE.vermilion, label: "案例" },
      { id: "A4", shape: "pill", rx: 30, ry: 17, color: PALETTE.vermilion, label: "文档", isStray: true },
    ],
    B: [
      { id: "B0", shape: "rect", rx: 36, ry: 17, color: PALETTE.vermilionDeep, label: "新建" },
      { id: "B1", shape: "rect", rx: 36, ry: 17, color: PALETTE.vermilionDeep, label: "导入" },
      { id: "B2", shape: "rect", rx: 36, ry: 17, color: PALETTE.vermilionDeep, label: "复制" },
      { id: "B3", shape: "rect", rx: 36, ry: 17, color: PALETTE.vermilionDeep, label: "分享" },
      { id: "B4", shape: "rect", rx: 36, ry: 17, color: PALETTE.vermilionDeep, label: "导出" },
    ],
    C: [
      { id: "C0", shape: "pill", rx: 30, ry: 17, color: PALETTE.pink, label: "草稿" },
      { id: "C1", shape: "pill", rx: 30, ry: 17, color: PALETTE.pink, label: "评审" },
      { id: "C2", shape: "pill", rx: 30, ry: 17, color: PALETTE.pink, label: "定稿" },
      { id: "C3", shape: "pill", rx: 30, ry: 17, color: PALETTE.pink, label: "归档" },
      { id: "C4", shape: "pill", rx: 30, ry: 17, color: PALETTE.pink, label: "待办" },
      { id: "C5", shape: "pill", rx: 30, ry: 17, color: PALETTE.pink, label: "已发" },
    ],
    D: [
      { id: "D0", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "列表" },
      { id: "D1", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "网格" },
      { id: "D2", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "对照" },
      { id: "D3", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "检查" },
    ],
    O: [
      { id: "O0", shape: "diamond", rx: 28, ry: 28, color: PALETTE.ink, label: "发布", isOutlier: true },
    ],
  },
  tags: {
    A: [
      { id: "A0", shape: "pill", rx: 32, ry: 16, color: PALETTE.vermilion, label: "网页" },
      { id: "A1", shape: "pill", rx: 32, ry: 16, color: PALETTE.vermilion, label: "移动" },
      { id: "A2", shape: "pill", rx: 32, ry: 16, color: PALETTE.vermilion, label: "海报" },
      { id: "A3", shape: "pill", rx: 32, ry: 16, color: PALETTE.vermilion, label: "书籍" },
      { id: "A4", shape: "pill", rx: 32, ry: 16, color: PALETTE.vermilion, label: "杂志", isStray: true },
    ],
    B: [
      { id: "B0", shape: "rect", rx: 36, ry: 16, color: PALETTE.vermilionDeep, label: "极简" },
      { id: "B1", shape: "rect", rx: 36, ry: 16, color: PALETTE.vermilionDeep, label: "瑞士" },
      { id: "B2", shape: "rect", rx: 36, ry: 16, color: PALETTE.vermilionDeep, label: "包豪斯" },
      { id: "B3", shape: "rect", rx: 36, ry: 16, color: PALETTE.vermilionDeep, label: "有机" },
      { id: "B4", shape: "rect", rx: 36, ry: 16, color: PALETTE.vermilionDeep, label: "社论" },
    ],
    C: [
      { id: "C0", shape: "pill", rx: 30, ry: 16, color: PALETTE.pink, label: "暖杏" },
      { id: "C1", shape: "pill", rx: 30, ry: 16, color: PALETTE.pink, label: "朱橘" },
      { id: "C2", shape: "pill", rx: 30, ry: 16, color: PALETTE.pink, label: "珊瑚" },
      { id: "C3", shape: "pill", rx: 30, ry: 16, color: PALETTE.pink, label: "松烟" },
      { id: "C4", shape: "pill", rx: 30, ry: 16, color: PALETTE.pink, label: "象牙" },
      { id: "C5", shape: "pill", rx: 30, ry: 16, color: PALETTE.pink, label: "暖桃" },
    ],
    D: [
      { id: "D0", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "网格" },
      { id: "D1", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "留白" },
      { id: "D2", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "对比" },
      { id: "D3", shape: "square", rx: 28, ry: 18, color: PALETTE.ink, label: "节奏" },
    ],
    O: [
      { id: "O0", shape: "diamond", rx: 28, ry: 28, color: PALETTE.ink, label: "重置", isOutlier: true },
    ],
  },
};

// 4 处跨簇混杂配置（相似与接近打架时生效；点击该点或统一编码即可归正）
const INTRUDER_SPECS = [
  { index: 0, itemId: "A1", fakeColor: PALETTE.pink, fakeShape: "square", targetGroup: "C" },
  { index: 1, itemId: "B3", fakeColor: PALETTE.ink, fakeShape: "circle", targetGroup: "D" },
  { index: 2, itemId: "C2", fakeColor: PALETTE.vermilion, fakeShape: "rect", targetGroup: "B" },
  { index: 3, itemId: "D1", fakeColor: PALETTE.vermilion, fakeShape: "circle", targetGroup: "A" },
];

// 根据每个簇的规范局部相对排布（1:1 复刻原海报 A 倾斜椭圆五圆、B 2-1-2 五圆角矩、C 3×2 六粉圆、D 2×2 四黑方）
function localGroupLayout(groupKey, defs, intraGap, theme) {
  const g = intraGap;
  const isPoster = theme === "poster";
  const items = [];

  if (groupKey === "A") {
    // 1:1 复刻 246 原海报 簇群 A 的 5 枚有机斜列朱橘圆，同时保持相邻净距与 intraGap 一致
    const rx = defs[0].rx;
    const ry = defs[0].ry;
    const stepX = rx * 2 + g;
    const stepY = ry * 2 + g;
    const coords = isPoster
      ? [
          { x: -stepX * 0.96, y: stepY * 0.30 }, // 左下
          { x: -stepX * 0.34, y: -stepY * 0.44 }, // 中上偏左
          { x: stepX * 0.64, y: -stepY * 0.66 }, // 右上高点
          { x: stepX * 0.04, y: stepY * 0.62 }, // 中下
          { x: stepX * 0.98, y: stepY * 0.16 }, // 右下（A4 游离点归位点）
        ]
      : [
          { x: -stepX * 0.88, y: -stepY * 0.50 },
          { x: 0, y: -stepY * 0.50 },
          { x: stepX * 0.88, y: -stepY * 0.50 },
          { x: -stepX * 0.48, y: stepY * 0.52 },
          { x: stepX * 0.48, y: stepY * 0.52 },
        ];
    defs.forEach((d, i) => items.push({ ...d, group: "A", lx: coords[i].x, ly: coords[i].y }));
  } else if (groupKey === "B") {
    // 1:1 复刻 246 原海报 簇群 B 的 2-1-2 五枚圆角矩形
    const rx = defs[0].rx;
    const ry = defs[0].ry;
    const sx = rx * 2 + g;
    const sy = ry * 2 + g * 0.86;
    const coords = [
      { x: -sx * 0.5, y: -sy },
      { x: sx * 0.5, y: -sy },
      { x: 0, y: 0 },
      { x: -sx * 0.5, y: sy },
      { x: sx * 0.5, y: sy },
    ];
    defs.forEach((d, i) => items.push({ ...d, group: "B", lx: coords[i].x, ly: coords[i].y }));
  } else if (groupKey === "C") {
    // 1:1 复刻 246 原海报 簇群 C 的 3×2 六枚柔粉圆
    const rx = defs[0].rx;
    const ry = defs[0].ry;
    const sx = rx * 2 + g;
    const sy = ry * 2 + g * 0.94;
    const coords = [
      { x: -sx, y: -sy * 0.5 },
      { x: 0, y: -sy * 0.5 },
      { x: sx, y: -sy * 0.5 },
      { x: -sx, y: sy * 0.5 },
      { x: 0, y: sy * 0.5 },
      { x: sx, y: sy * 0.5 },
    ];
    defs.forEach((d, i) => items.push({ ...d, group: "C", lx: coords[i].x, ly: coords[i].y }));
  } else if (groupKey === "D") {
    // 1:1 复刻 246 原海报 簇群 D 的 2×2 四枚纯黑圆角方
    const rx = defs[0].rx;
    const ry = defs[0].ry;
    const sx = rx * 2 + g;
    const sy = ry * 2 + g * 0.96;
    const coords = [
      { x: -sx * 0.5, y: -sy * 0.5 },
      { x: sx * 0.5, y: -sy * 0.5 },
      { x: -sx * 0.5, y: sy * 0.5 },
      { x: sx * 0.5, y: sy * 0.5 },
    ];
    defs.forEach((d, i) => items.push({ ...d, group: "D", lx: coords[i].x, ly: coords[i].y }));
  } else {
    defs.forEach((d) => items.push({ ...d, group: "O", lx: 0, ly: 0 }));
  }

  // 计算该簇局部边界盒
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const it of items) {
    minX = Math.min(minX, it.lx - it.rx);
    maxX = Math.max(maxX, it.lx + it.rx);
    minY = Math.min(minY, it.ly - it.ry);
    maxY = Math.max(maxY, it.ly + it.ry);
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  for (const it of items) {
    it.lx -= cx;
    it.ly -= cy;
  }
  return {
    items,
    w: maxX - minX,
    h: maxY - minY,
  };
}

// 精确计算两个图元之间的边到边净距（像素）
export function edgeDistance(a, b) {
  if (a.shape === "circle" && b.shape === "circle") {
    return Math.max(0, Math.hypot(a.x - b.x, a.y - b.y) - a.rx - b.rx);
  }
  const dx = Math.max(0, Math.abs(a.x - b.x) - a.rx - b.rx);
  const dy = Math.max(0, Math.abs(a.y - b.y) - a.ry - b.ry);
  if (dx === 0 && dy === 0) return 0;
  // 圆角/菱形柔和修正
  if (a.shape === "diamond" || b.shape === "diamond") {
    const raw = Math.hypot(dx, dy);
    return Math.max(0, raw + 4);
  }
  return Math.hypot(dx, dy);
}

// 统一计算世界坐标、所有 21 元素位置、单链近邻知觉包络与单真源诊断
export function analyzeClusterState(state, worldMode = "wide") {
  const theme = ITEM_DEFS[state.theme] ? state.theme : "poster";
  const defs = ITEM_DEFS[theme];
  const intra = clamp(state.intraGap, 2, 34);
  const inter = clamp(state.interGap, 6, 86);

  // 紧凑屏（手机竖屏/横屏/平板）使用紧致 580×450 忠实复刻原海报 2×2+右离群；宽屏（1440/2560）使用 1080×325 全景五簇舒展带
  const world = worldMode === "compact"
    ? { w: 580, h: 450, mode: "compact" }
    : { w: 1080, h: 325, mode: "wide" };

  // 先按规范局部排布算出五组真实尺寸
  const gA = localGroupLayout("A", defs.A, intra, theme);
  const gB = localGroupLayout("B", defs.B, intra, theme);
  const gC = localGroupLayout("C", defs.C, intra, theme);
  const gD = localGroupLayout("D", defs.D, intra, theme);
  const gO = localGroupLayout("O", defs.O, intra, theme);

  let centers;
  let corridorX;
  if (worldMode === "compact") {
    const leftColW = Math.max(gA.w, gC.w);
    const midColW = Math.max(gB.w, gD.w);
    const topRowH = Math.max(gA.h, gB.h);
    const botRowH = Math.max(gC.h, gD.h);
    const rowGap = inter * 0.96;
    const colGap = inter * 0.96;
    const matrixW = leftColW + colGap + midColW;
    const matrixH = topRowH + rowGap + botRowH;
    const outlierExtra = Math.max(54, inter * 1.15) + gO.w;
    const matOriginX = Math.max(24, (world.w - (matrixW + outlierExtra * 0.68)) * 0.44);
    const matOriginY = Math.max(46, (world.h - matrixH) * 0.52);

    centers = {
      A: { x: matOriginX + leftColW * 0.5, y: matOriginY + topRowH * 0.5 },
      B: { x: matOriginX + leftColW + colGap + midColW * 0.5, y: matOriginY + topRowH * 0.5 },
      C: { x: matOriginX + leftColW * 0.5, y: matOriginY + topRowH + rowGap + botRowH * 0.5 },
      D: { x: matOriginX + leftColW + colGap + midColW * 0.5, y: matOriginY + topRowH + rowGap + botRowH * 0.5 },
    };
    corridorX = matOriginX + leftColW + colGap * 0.5;

    const outlierHomeX = Math.min(world.w - 42, centers.D.x + gD.w * 0.5 + Math.max(66, inter * 1.25) + gO.w * 0.5);
    const outlierHomeY = centers.D.y;
    const pullSpanX = Math.max(46, outlierHomeX - (centers.D.x + gD.w * 0.5 + gO.w * 0.5 + 6));
    centers.O = {
      x: clamp(outlierHomeX + state.outlierPull.u * pullSpanX, centers.D.x + gD.w * 0.25, world.w - 36),
      y: clamp(outlierHomeY + state.outlierPull.v * 52, 56, world.h - 46),
    };
  } else {
    // 宽屏全景展带：A → B → C → D → 离群点 自左至右错落铺满画幅，零左右大空边
    const hGap = inter;
    const outGap = Math.max(72, inter * 1.38);
    const totalW = gA.w + gB.w + gC.w + gD.w + gO.w + hGap * 3 + outGap;
    const startX = Math.max(30, (world.w - totalW) * 0.5);
    const midY = world.h * 0.54;

    const xA = startX + gA.w * 0.5;
    const xB = startX + gA.w + hGap + gB.w * 0.5;
    const xC = startX + gA.w + gB.w + hGap * 2 + gC.w * 0.5;
    const xD = startX + gA.w + gB.w + gC.w + hGap * 3 + gD.w * 0.5;
    const outlierHomeX = Math.min(world.w - 44, startX + gA.w + gB.w + gC.w + gD.w + hGap * 3 + outGap + gO.w * 0.5);

    centers = {
      A: { x: xA, y: midY - 12 },
      B: { x: xB, y: midY + 10 },
      C: { x: xC, y: midY - 8 },
      D: { x: xD, y: midY + 12 },
    };
    corridorX = (xB + gB.w * 0.5 + xC - gC.w * 0.5) * 0.5;

    const pullSpanX = Math.max(54, outlierHomeX - (xD + gD.w * 0.5 + gO.w * 0.5 + 8));
    centers.O = {
      x: clamp(outlierHomeX + state.outlierPull.u * pullSpanX, xD + gD.w * 0.25, world.w - 36),
      y: clamp(midY + 6 + state.outlierPull.v * 52, 54, world.h - 44),
    };
  }

  // 组装全部元素世界坐标 + 混杂干扰外观
  const items = [];
  const activeIntruders = [];
  const pushGroup = (gObj, gKey) => {
    for (const it of gObj.items) {
      let x = centers[gKey].x + it.lx;
      let y = centers[gKey].y + it.ly;

      // 游离点 A4 的实绘偏移：向右下方廊道飘出
      const homeX = x;
      const homeY = y;
      if (it.isStray) {
        const driftSpanX = worldMode === "compact" ? Math.max(66, inter * 0.55 + 54) : Math.max(58, inter * 0.65 + 48);
        const driftSpanY = worldMode === "compact" ? Math.max(52, inter * 0.5 + 44) : 72;
        x = clamp(homeX + state.strayDrift.u * driftSpanX, 34, world.w - 34);
        y = clamp(homeY + state.strayDrift.v * driftSpanY, 48, world.h - 36);
      }

      // 外观相似性处理（混杂模式 vs 仅颜色统一 vs 同簇完全一致）
      let renderColor = it.color;
      let renderShape = it.shape;
      let intruderIndex = -1;
      let intruderTarget = null;

      const spec = INTRUDER_SPECS.find((s) => s.itemId === it.id);
      if (spec) {
        if (state.similarityMode === "mixed" && !state.fixedIntruders[spec.index]) {
          renderColor = spec.fakeColor;
          renderShape = theme === "poster" ? spec.fakeShape : it.shape;
          intruderIndex = spec.index;
          intruderTarget = spec.targetGroup;
          activeIntruders.push({ itemId: it.id, index: spec.index, from: gKey, to: spec.targetGroup });
        } else if (state.similarityMode === "colorOnly" && theme === "poster") {
          // 仅颜色统一：颜色归正，但形状故意互借演示“少一道冗余线索”
          renderColor = it.color;
          renderShape = spec.fakeShape;
        }
      }

      items.push({
        ...it,
        x,
        y,
        homeX,
        homeY,
        renderColor,
        renderShape,
        intruderIndex,
        intruderTarget,
        isIntruder: intruderIndex >= 0,
      });
    }
  };

  pushGroup(gA, "A");
  pushGroup(gB, "B");
  pushGroup(gC, "C");
  pushGroup(gD, "D");
  pushGroup(gO, "O");

  // ---------- 精确几何度量（单真源） ----------
  const byGroup = { A: [], B: [], C: [], D: [], O: [] };
  items.forEach((it, idx) => byGroup[it.group].push({ it, idx }));

  // 1. 组内最近邻均值（排除游离点 A4，以真实反映核心簇内距）与组内最小净距
  let intraSum = 0;
  let intraCount = 0;
  let minIntraEdge = Infinity;
  for (const gk of ["A", "B", "C", "D"]) {
    const members = byGroup[gk].filter((m) => !m.it.isStray);
    for (let i = 0; i < members.length; i++) {
      let nearest = Infinity;
      for (let j = 0; j < members.length; j++) {
        if (i === j) continue;
        const d = edgeDistance(members[i].it, members[j].it);
        if (d < nearest) nearest = d;
        if (d < minIntraEdge) minIntraEdge = d;
      }
      if (isFinite(nearest)) {
        intraSum += nearest;
        intraCount++;
      }
    }
  }
  const meanIntraEdge = intraCount ? intraSum / intraCount : intra;
  if (!isFinite(minIntraEdge)) minIntraEdge = intra;

  // 2. 跨簇最小边界净距（A/B/C/D 四主簇之间，排除游离点 A4 与离群点 O0）
  let minInterEdge = Infinity;
  let closestInterPair = null;
  const mainKeys = ["A", "B", "C", "D"];
  for (let gi = 0; gi < mainKeys.length; gi++) {
    for (let gj = gi + 1; gj < mainKeys.length; gj++) {
      for (const a of byGroup[mainKeys[gi]]) {
        if (a.it.isStray) continue;
        for (const b of byGroup[mainKeys[gj]]) {
          if (b.it.isStray) continue;
          const d = edgeDistance(a.it, b.it);
          if (d < minInterEdge) {
            minInterEdge = d;
            closestInterPair = { a: a.it, b: b.it, d };
          }
        }
      }
    }
  }
  if (!isFinite(minInterEdge)) minInterEdge = inter;

  // 3. 游离点 A4 距 A 组最近同伴的真实净距
  const strayItem = items.find((it) => it.isStray);
  let strayDist = 0;
  let strayAnchor = null;
  if (strayItem) {
    let best = Infinity;
    for (const m of byGroup.A) {
      if (m.it.isStray) continue;
      const d = edgeDistance(strayItem, m.it);
      if (d < best) {
        best = d;
        strayAnchor = m.it;
      }
    }
    strayDist = isFinite(best) ? best : 0;
  }

  // 4. 离群点 O0 距四个主簇中任意元素的最小净距
  const outlierItem = items.find((it) => it.isOutlier);
  let outlierDist = Infinity;
  let outlierNearest = null;
  if (outlierItem) {
    for (const it of items) {
      if (it.isOutlier) continue;
      const d = edgeDistance(outlierItem, it);
      if (d < outlierDist) {
        outlierDist = d;
        outlierNearest = it;
      }
    }
  }
  if (!isFinite(outlierDist)) outlierDist = 0;

  // ---------- 单链近邻知觉聚类（动态涌现虚线包络） ----------
  // 人眼会把边界净距 <= mergeThreshold 的相邻图元归入同一知觉包络
  const mergeThreshold = Math.max(22, meanIntraEdge * 1.48 + 4);
  const parent = items.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const d = edgeDistance(items[i], items[j]);
      if (d <= mergeThreshold) union(i, j);
    }
  }

  const compMap = new Map();
  items.forEach((it, idx) => {
    const r = find(idx);
    if (!compMap.has(r)) compMap.set(r, []);
    compMap.get(r).push(it);
  });

  const perceptualClusters = [];
  for (const members of compMap.values()) {
    const groups = [...new Set(members.map((m) => m.group))];
    const hasOutlier = groups.includes("O");
    const mainSet = groups.filter((g) => g !== "O");
    const isTangled = groups.length > 1;
    const isAccidentalOrphan = members.length === 1 && !hasOutlier;
    const isPureOutlier = members.length === 1 && hasOutlier;
    const isPureMain = groups.length === 1 && !hasOutlier && members.length >= 2;
    perceptualClusters.push({
      members,
      groups,
      primaryGroup: groups.length === 1 ? groups[0] : groups.join("+"),
      isTangled,
      isAccidentalOrphan,
      isPureOutlier,
      isPureMain,
    });
  }

  const separationRatio = minInterEdge / Math.max(1, meanIntraEdge);
  const mainMerged = perceptualClusters.some((c) => c.groups.filter((g) => g !== "O").length > 1);
  const strayMergedIntoWrong = perceptualClusters.some((c) => c.members.some((m) => m.isStray) && c.groups.length > 1);
  const strayDetached = perceptualClusters.some((c) => c.isAccidentalOrphan && c.members[0].isStray);
  const outlierSwallowed = perceptualClusters.some((c) => c.members.some((m) => m.isOutlier) && c.members.length > 1);

  // ---------- 四项独立合规判据 ----------
  const isCrushed = minIntraEdge < 4;
  const isInverted = separationRatio < 1.05;
  const gapOk = !isCrushed && !mainMerged && separationRatio >= 1.55 && minInterEdge >= 28;
  const simOk = activeIntruders.length === 0;
  const cohesionOk = !strayDetached && !strayMergedIntoWrong && strayDist <= Math.max(meanIntraEdge * 1.68 + 8, 32);
  const outlierOk = !outlierSwallowed && outlierDist >= Math.max(meanIntraEdge * 2.0, 44);
  const heavyFrameWarn = state.frameMode === "heavy";
  const colorOnlyNote = state.similarityMode === "colorOnly" && theme === "poster";

  const score = [gapOk, simOk, cohesionOk, outlierOk].filter(Boolean).length;
  const allClear = score === 4 && !heavyFrameWarn;

  // ---------- 白话诊断（永远按当前最致命问题说明「为什么」与「下一步」） ----------
  let statusKind = "ok";
  let statusBadge = "4 / 4 归群清晰";
  let headline = "四簇分明、离群独立，一眼就能看清信息结构";
  let detail = `当前实测组内均距 ${Math.round(meanIntraEdge)}px、跨簇最小净距 ${Math.round(minInterEdge)}px（分离比 ${separationRatio.toFixed(1)}×）。人眼不用数格子，也不靠厚边框，就能自动切出 A/B/C/D 四个单元和右侧孤立焦点。`;
  let nextHint = "试试切换到「导航 + 工具栏」或「无框纯留白」，观察去掉虚线壳后间距是否照样站得住。";

  if (isCrushed) {
    statusKind = "err";
    statusBadge = `${score} / 4 · 簇内挤撞`;
    headline = `簇内净距只剩 ${Math.round(minIntraEdge)}px，同组元素互相咬边`;
    detail = "追求紧凑不能压到 0–3px。元素一旦贴边相撞，轮廓融成一坨色块，手机端也会频发误点，组内反而失焦。";
    nextHint = "把「组内间距」向右拉到 8–18px 之间，让同组元素留出呼吸缝。";
  } else if (!gapOk && isInverted) {
    statusKind = "err";
    statusBadge = `${score} / 4 · 内松外紧`;
    headline = `组内 ${Math.round(meanIntraEdge)}px 反而比组间 ${Math.round(minInterEdge)}px 更松，四簇粘成一团`;
    detail = `分离比仅 ${separationRatio.toFixed(2)}×（经验上需要 ≥ 1.5×）。当跨簇通道比组内缝还窄，人眼会横向错连相邻两簇，动态虚线壳因此直接融成警示红大包。`;
    nextHint = "在画布空白廊道向右横拖（或拉大「组间间距」并收紧「组内间距」），把分离比推过 1.6×。";
  } else if (!gapOk) {
    statusKind = "err";
    statusBadge = `${score} / 4 · 跨簇粘连`;
    headline = `跨簇净距 ${Math.round(minInterEdge)}px 不足（分离比 ${separationRatio.toFixed(2)}×），边界仍在打架`;
    detail = "组间与组内拉得还不够开，视觉归属摇摆不定。经验上组间距达到组内距的 1.5×–2.5× 以上，大脑才会干脆地把它们切开。";
    nextHint = "继续在画布向右横拖拉宽廊道，或把「组间间距」调到 38px 以上。";
  } else if (!simOk) {
    statusKind = "err";
    statusBadge = `${score} / 4 · 相似冲突`;
    headline = `有 ${activeIntruders.length} 枚元素串了颜色与形状，相似线索正在和接近打架`;
    detail = "位置上它们归属各自簇群，但外观却像隔壁组派来的卧底——眼睛会被同色同形斜向拉走，读结构时不断犹豫。";
    nextHint = "直接点击画布上带红圈标记的混杂图形把它们归正，或切换「相似编码 → 同簇一致」。";
  } else if (!cohesionOk) {
    statusKind = "err";
    statusBadge = `${score} / 4 · 误生孤儿`;
    headline = `簇群 A 飘出 1 枚游离点（距本组 ${Math.round(strayDist)}px），单元被扯断`;
    detail = "本应属于簇群 A 的第五枚成员落进了公共廊道，脱离了接近场，观者会误以为它是独立按钮或漏排错位。";
    nextHint = "直接把画布里标红的游离成员拖回左上簇群 A 内，或点「收拢游离点」。";
  } else if (!outlierOk) {
    statusKind = "err";
    statusBadge = `${score} / 4 · 离群被吞`;
    headline = `黑菱形离群点贴近簇群 D（仅 ${Math.round(outlierDist)}px），孤立焦点消失`;
    detail = "离群点之所以醒目，全靠四周宽阔的留白护城河。现在它掉进了簇群 D 的接近半径，被黑色方块群当场吞并。";
    nextHint = "把画布上的黑菱形向右拖开，或点「独立离群点」，给它留出 ≥ 44px 的净距。";
  } else if (heavyFrameWarn) {
    statusKind = "warn";
    statusBadge = "4 / 4 · 边框冗余";
    headline = "间距已经分得够清，满屏加厚黑实线框反而制造视觉噪音";
    detail = "接近性与相似性共同生效时，留白本身就是边界。给每组都套一层沉重边框会平白增加线条密度，干扰主体内容。";
    nextHint = "把「边界表达」切回「无框纯留白」或「原海报虚线壳」，对比界面瞬间清爽多少。";
  } else if (colorOnlyNote) {
    statusKind = "ok";
    statusBadge = "4 / 4 · 单线索达标";
    headline = "间距与色彩已清晰归群（提示：加上形状一致对色弱读者更稳）";
    detail = `分离比 ${separationRatio.toFixed(1)}× 足以稳定分组，但当前仅靠颜色统一、形状仍交错；若叠加形状一致，双重冗余编码最抗干扰。`;
    nextHint = "可点「同簇一致」查看形色双重编码，或切换另外两种真实 UI 题材检验。";
  }

  // ---------- 原海报四项实况状态 ----------
  const pillars = {
    proximity: gapOk
      ? { ok: true, tag: `比值 ${separationRatio.toFixed(1)}×`, tone: "ok" }
      : { ok: false, tag: isCrushed ? "簇内挤撞" : isInverted ? "内松外紧" : "边界粘连", tone: "err" },
    similarity: simOk
      ? { ok: true, tag: colorOnlyNote ? "仅色统一" : "形色一致", tone: "ok" }
      : { ok: false, tag: `${activeIntruders.length} 处串扰`, tone: "err" },
    cohesion: cohesionOk && outlierOk
      ? { ok: true, tag: `4 簇 + 1 孤`, tone: "ok" }
      : { ok: false, tag: !cohesionOk ? "游离孤点" : "离群被吞", tone: "err" },
  };

  // ---------- 实时 CSS Cluster 代码（同源参数） ----------
  const cssCode = buildClusterCSS(intra, inter, separationRatio, isCrushed, gapOk);

  return {
    world,
    corridorX,
    theme,
    items,
    centers,
    perceptualClusters,
    activeIntruders,
    strayItem,
    outlierItem,
    strayAnchor,
    outlierNearest,
    closestInterPair,
    metrics: {
      meanIntraEdge: Math.round(meanIntraEdge),
      minIntraEdge: Math.round(minIntraEdge),
      minInterEdge: Math.round(minInterEdge),
      separationRatio,
      strayDist: Math.round(strayDist),
      outlierDist: Math.round(outlierDist),
      detectedCount: perceptualClusters.length,
      pureMainCount: perceptualClusters.filter((c) => c.isPureMain).length,
      tangledCount: perceptualClusters.filter((c) => c.isTangled).length,
      intruderCount: activeIntruders.length,
      mergeThreshold: Math.round(mergeThreshold),
    },
    checks: { gapOk, simOk, cohesionOk, outlierOk, isCrushed, isInverted, heavyFrameWarn },
    score,
    allClear,
    diagnosis: { statusKind, statusBadge, headline, detail, nextHint },
    pillars,
    cssCode,
  };
}

function buildClusterCSS(intra, inter, ratio, isCrushed, gapOk) {
  const innerNote = isCrushed
    ? " /* 警告：小于 4px 贴边相撞 */"
    : intra > 22
      ? " /* 偏松：组内凝聚力减弱 */"
      : "";
  const outerNote = !gapOk && !isCrushed
    ? ` /* 警告：仅 ${ratio.toFixed(1)}×，未拉开 */`
    : ` /* ${ratio.toFixed(1)}× 组内距，清晰分区 */`;
  return [
    "/* 单个簇群内部 */",
    ".cluster {",
    "  display: flex;",
    "  flex-wrap: wrap;",
    `  gap: ${Math.round(intra)}px;${innerNote}`,
    "  align-items: center;",
    "}",
    "/* 多组簇群之间 */",
    ".cluster-bar {",
    "  display: flex;",
    "  flex-wrap: wrap;",
    `  gap: ${Math.round(inter)}px;${outerNote}`,
    "}",
  ].join("\n");
}
