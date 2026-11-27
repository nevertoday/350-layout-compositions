// 096 主次关系 · 单真源几何、视觉重量与诊断引擎
// 画布渲染、右侧深焙咖啡四原则竖轴、下段窑红六对比工具箱、暖沙对比示例全部只读这份计算结果。

export const PALETTE = {
  paper: "#F0DEBF",
  paperLight: "#F7ECD8",
  sandWave: "#E7CBA5",
  sandBoard: "#DFBF96",
  terracotta: "#C45528",
  terracottaBright: "#CE5B2C",
  terracottaDeep: "#963814",
  terracottaBoard: "#B2522B",
  espresso: "#322117",
  espressoDeep: "#251811",
  ochre: "#B58454",
  ochreSoft: "#C39A6F",
  ochrePale: "#D4B38B",
  ochreGhost: "#E3CDA9",
  clashCyan: "#2A7298",
  clashViolet: "#6D3B9E",
  alert: "#B8251C",
  alertLight: "#FF857A",
  ok: "#1E5C3F",
  okLight: "#7FE0B2",
};

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 圆与线",
    short: "原海报",
    items: [
      { id: 0, name: "主圆核心", sub: "视觉主导 · 首眼落点", lines: [0.92, 0.72, 0.56], roleRank: 0, isFootnote: false },
      { id: 1, name: "一级辅圆", sub: "核心说明 · 紧随承托", lines: [0.86, 0.66, 0.52], roleRank: 1, isFootnote: false },
      { id: 2, name: "二级辅圆", sub: "细节展开 · 节奏递减", lines: [0.76, 0.54], roleRank: 2, isFootnote: false },
      { id: 3, name: "末级辅圆", sub: "落款补充 · 轻声收尾", lines: [0.68, 0.44], roleRank: 3, isFootnote: false },
    ],
  },
  exhibition: {
    id: "exhibition",
    label: "陶艺展 · 招贴",
    short: "陶艺展",
    items: [
      { id: 0, name: "秋窑土器展", sub: "AUTUMN KILN · 主展览名", lines: [0.95, 0.74, 0.58], roleRank: 0, isFootnote: false },
      { id: 1, name: "展期与场馆", sub: "10.18–11.30 · 景德镇三厅", lines: [0.84, 0.62, 0.46], roleRank: 1, isFootnote: false },
      { id: 2, name: "策展导语", sub: "二十八位手作人的火土对话", lines: [0.78, 0.56], roleRank: 2, isFootnote: false },
      { id: 3, name: "票务注脚", sub: "免费预约 · 馆内禁闪光灯", lines: [0.66, 0.42], roleRank: 3, isFootnote: true },
    ],
  },
  magazine: {
    id: "magazine",
    label: "器物志 · 封面",
    short: "器物志",
    items: [
      { id: 0, name: "泥火之间", sub: "封面大专题 · 第 14 辑", lines: [0.94, 0.72, 0.54], roleRank: 0, isFootnote: false },
      { id: 1, name: "核心提要", sub: "粗陶、柴烧与日常餐桌", lines: [0.82, 0.64, 0.48], roleRank: 1, isFootnote: false },
      { id: 2, name: "目录索引", sub: "访谈 / 工坊巡礼 / 釉色笔记", lines: [0.76, 0.52], roleRank: 2, isFootnote: false },
      { id: 3, name: "刊号条码", sub: "ISSN 2096 · 定价 48 元", lines: [0.64, 0.40], roleRank: 3, isFootnote: true },
    ],
  },
};

export const LEVER_META = [
  { key: "size", title: "大小对比", posterBody: "主元素更大，次元素更小。", icon: "size" },
  { key: "color", title: "色彩对比", posterBody: "主元素更醒目，次元素更柔和。", icon: "color" },
  { key: "value", title: "明度对比", posterBody: "主元素更亮或更暗，形成焦点。", icon: "value" },
  { key: "density", title: "疏密对比", posterBody: "主元素周围留白更多，次元素更密集。", icon: "density" },
  { key: "position", title: "位置对比", posterBody: "主元素居核心位置，次元素环绕分布。", icon: "position" },
  { key: "form", title: "形态对比", posterBody: "主元素更独特，次元素更统一。", icon: "form" },
];

export const LEVEL_LABELS = ["关", "适度", "强"];

export const PRESETS = {
  // 开场刻意停在原海报「主次混乱」复合坏态：0/4
  chaos: {
    label: "均权混乱",
    kind: "bad",
    dominance: 14,
    primaryIndex: 0,
    rivalIndex: 1,
    levers: { size: 0, color: 1, value: 0, density: 0, position: 0, form: 2 },
    harmony: false,
    edgeShift: 0,
    secondaryFade: 14,
  },
  // 合法多解 1：1:1 原海报典范
  poster: {
    label: "原海报典范",
    kind: "good",
    dominance: 84,
    primaryIndex: 0,
    rivalIndex: -1,
    levers: { size: 2, color: 2, value: 1, density: 2, position: 2, form: 0 },
    harmony: true,
    edgeShift: 0,
    secondaryFade: 26,
  },
  // 合法多解 2：低彩度极简大小+疏密解
  minimal: {
    label: "极简大小解",
    kind: "good",
    dominance: 88,
    primaryIndex: 0,
    rivalIndex: -1,
    levers: { size: 2, color: 0, value: 2, density: 2, position: 2, form: 0 },
    harmony: true,
    edgeShift: 0,
    secondaryFade: 24,
  },
  // 合法多解 3：明度+形态突围解
  formValue: {
    label: "明度形态解",
    kind: "good",
    dominance: 76,
    primaryIndex: 0,
    rivalIndex: -1,
    levers: { size: 1, color: 1, value: 2, density: 1, position: 1, form: 2 },
    harmony: true,
    edgeShift: 0,
    secondaryFade: 22,
  },
  // 试错：双王互掐
  dual: {
    label: "双王互掐",
    kind: "bad",
    dominance: 76,
    primaryIndex: 0,
    rivalIndex: 1,
    levers: { size: 2, color: 2, value: 1, density: 1, position: 1, form: 0 },
    harmony: true,
    edgeShift: 0,
    secondaryFade: 18,
  },
  // 试错：对比过火、协调崩裂
  clash: {
    label: "过火失协",
    kind: "bad",
    dominance: 84,
    primaryIndex: 0,
    rivalIndex: -1,
    levers: { size: 2, color: 2, value: 2, density: 2, position: 2, form: 2 },
    harmony: false,
    edgeShift: 0,
    secondaryFade: 22,
  },
  // 试错：次要过弱失能
  ghost: {
    label: "配角失能",
    kind: "bad",
    dominance: 92,
    primaryIndex: 0,
    rivalIndex: -1,
    levers: { size: 2, color: 2, value: 1, density: 2, position: 2, form: 0 },
    harmony: true,
    edgeShift: 0,
    secondaryFade: 94,
  },
};

export function createInitialState() {
  const p = PRESETS.chaos;
  return {
    scene: "poster",
    dominance: p.dominance,
    primaryIndex: p.primaryIndex,
    rivalIndex: p.rivalIndex,
    levers: { ...p.levers },
    harmony: p.harmony,
    edgeShift: p.edgeShift,
    secondaryFade: p.secondaryFade,
    showWeights: true,
  };
}

export function applyPreset(state, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  state.dominance = p.dominance;
  state.primaryIndex = p.primaryIndex;
  state.rivalIndex = p.rivalIndex;
  state.levers = { ...p.levers };
  state.harmony = p.harmony;
  state.edgeShift = p.edgeShift;
  state.secondaryFade = p.secondaryFade;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  const to = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
}

function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const l1 = relLuminance(hexA);
  const l2 = relLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function colorSaturation(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

// 统一的布局与视觉重量计算（画布与诊断共享同一份数据）
export function computeLayout(state, width, height) {
  const W = Math.max(300, width || 720);
  const H = Math.max(240, height || 460);
  const scene = SCENES[state.scene] || SCENES.poster;
  const dom = clamp(state.dominance, 0, 100) / 100; // 0..1
  const lv = state.levers;
  const minDim = Math.min(W, H);

  // 各对比杠杆在当前势差下的真实生效值（0..1）
  const sizeGain = (lv.size / 2) * (0.28 + 0.72 * dom);
  const colorGain = (lv.color / 2) * (0.35 + 0.65 * dom);
  const valueGain = (lv.value / 2) * (0.35 + 0.65 * dom);
  const densityGain = (lv.density / 2) * (0.25 + 0.75 * dom);
  const posGain = (lv.position / 2) * (0.25 + 0.75 * dom);
  const formGain = lv.form / 2;

  const activeLevers = Object.values(lv).filter((v) => v > 0).length;
  const strongLevers = Object.values(lv).filter((v) => v === 2).length;
  const fade = clamp(state.secondaryFade, 0, 100) / 100;

  // 把 4 个模块排成 [主角, 辅1, 辅2, 辅3] 的角色序列，同时保留原始 index
  const pIdx = clamp(state.primaryIndex, 0, 3);
  const others = [0, 1, 2, 3].filter((i) => i !== pIdx);
  // 抢戏次角（不能是主角自己）
  const rivalIdx = state.rivalIndex >= 0 && state.rivalIndex !== pIdx ? state.rivalIndex : -1;

  // 2x2 混乱矩阵坐标（对应原海报「主次混乱」四等分网格，兼顾窄屏与矮屏留出文杠与角标空间）
  const narrow = W < 440;
  const shortH = H < 260;
  const gridSlots = [
    { x: W * (narrow ? 0.175 : 0.195), y: H * (shortH ? 0.28 : 0.30) },
    { x: W * (narrow ? 0.635 : 0.625), y: H * (shortH ? 0.28 : 0.30) },
    { x: W * (narrow ? 0.175 : 0.195), y: H * (shortH ? 0.72 : 0.69) },
    { x: W * (narrow ? 0.635 : 0.625), y: H * (shortH ? 0.72 : 0.69) },
  ];

  // 清晰主次坐标（1:1 承袭 096 原海报：左中巨圆 + 右侧纵排递减三辅圆）
  const pTargetX = clamp(W * (0.305 - state.edgeShift * 0.19), W * 0.12, W * 0.44);
  const pTargetY = H * 0.52;
  const secX = lerp(W * 0.64, W * 0.635, densityGain);
  const secSpread = lerp(H * 0.21, H * 0.195, densityGain);
  const secTargets = [
    { x: secX, y: H * 0.295 },
    { x: secX + W * 0.014, y: H * 0.515 },
    { x: secX - W * 0.008, y: H * 0.515 + secSpread },
  ];

  // 计算每枚模块的实绘几何与色彩
  const baseChaosR = Math.min(minDim * 0.112, W * 0.095, H * (shortH ? 0.135 : 0.14));
  const nodes = [];

  for (let i = 0; i < 4; i++) {
    const isPrimary = i === pIdx;
    const isRival = i === rivalIdx;
    const secRank = isPrimary ? -1 : others.indexOf(i); // 0, 1, 2
    const item = scene.items[i];

    // 1. 位置（在 2x2 均权网与「一主右三辅」之间随 posGain + dominance 平滑过渡）
    const layoutMix = clamp(posGain * 0.82 + dom * 0.28, 0, 1);
    const gPos = gridSlots[i];
    const tPos = isPrimary ? { x: pTargetX, y: pTargetY } : secTargets[secRank];
    let cx = lerp(gPos.x, tPos.x, layoutMix);
    let cy = lerp(gPos.y, tPos.y, layoutMix);

    // 如果未开启位置对比但推高了大小，适度避让防止重叠
    if (isPrimary && state.edgeShift !== 0) {
      cx = clamp(cx - state.edgeShift * W * 0.17, W * 0.09, W * 0.86);
    }

    // 2. 半径（严格受 sizeGain、fade 与 rival 控制）
    let r;
    if (isPrimary) {
      const targetR = minDim * lerp(0.145, 0.315, sizeGain);
      r = lerp(baseChaosR * 1.04, targetR, clamp(sizeGain * 0.85 + dom * 0.25, 0, 1));
    } else if (isRival) {
      // 抢戏配角拒绝缩小，维持与主角争锋的体量
      const rivalBase = minDim * lerp(0.125, 0.225, clamp(dom * 0.7 + sizeGain * 0.45, 0, 1));
      r = lerp(baseChaosR * 1.01, rivalBase, 0.85);
    } else {
      const stepScales = [0.098, 0.072, 0.048];
      const quietTarget = minDim * stepScales[secRank];
      const shrunk = lerp(baseChaosR * (0.98 - secRank * 0.03), quietTarget, clamp(sizeGain * 0.9 + dom * 0.25, 0, 1));
      // 次要退隐过强时进一步缩微
      r = shrunk * lerp(1, 0.42, clamp((fade - 0.55) / 0.45, 0, 1));
    }

    // 边界钳制，保留图形完整
    const padX = Math.max(r + 12, 24);
    const padY = Math.max(r + 14, 24);
    cx = clamp(cx, padX, W - padX);
    cy = clamp(cy, padY, H - padY);

    // 3. 色彩与明度
    let fill;
    let barColor;
    let isClashColor = false;
    if (isPrimary) {
      if (colorGain >= 0.45) {
        fill = mixHex(PALETTE.ochre, PALETTE.terracotta, clamp(0.45 + colorGain * 0.55, 0, 1));
        if (valueGain > 0.65) fill = mixHex(fill, "#A93D17", 0.35);
      } else if (valueGain >= 0.45) {
        // 低彩度明度对比解：沉稳深焙咖作为绝对主角
        fill = mixHex("#6E5037", PALETTE.espresso, clamp(0.35 + valueGain * 0.65, 0, 1));
      } else {
        // 既没开色彩也没开明度：停在暖赭石
        fill = mixHex(PALETTE.ochre, "#A86D3D", dom * 0.4);
      }
      barColor = mixHex(fill, PALETTE.espresso, 0.35);
    } else if (isRival) {
      // 抢戏次角直接盗用主角的窑红高饱和色，造成两强并立
      fill = colorGain >= 0.2 ? PALETTE.terracottaBright : PALETTE.terracotta;
      barColor = PALETTE.terracottaDeep;
    } else {
      if (!state.harmony && secRank === 1) {
        // 失协状态：硬塞入格格不入的冷青蓝
        fill = PALETTE.clashCyan;
        barColor = PALETTE.clashCyan;
        isClashColor = true;
      } else if (!state.harmony && secRank === 2 && formGain > 0.5) {
        fill = PALETTE.clashViolet;
        barColor = PALETTE.clashViolet;
        isClashColor = true;
      } else {
        // 正常协调辅色：温润沙金赭石，按次序轻微退让；若 fade 过高则快融进纸底
        const baseSec = secRank === 0 ? PALETTE.ochre : secRank === 1 ? "#BA8C5D" : "#C3996E";
        const mildFade = clamp(fade, 0, 0.55) / 0.55;
        const extremeFade = clamp((fade - 0.55) / 0.45, 0, 1);
        let c = mixHex(baseSec, PALETTE.ochrePale, mildFade * 0.25);
        if (extremeFade > 0) c = mixHex(c, PALETTE.paper, extremeFade * 0.84);
        fill = c;
        barColor = mixHex(c, "#7A5533", 0.35 * (1 - extremeFade));
      }
    }

    // 4. 形态（协调时主元素可做圆角方/八角印章，次元素保持统一圆；失协时形态四分五裂）
    let shape = "circle";
    if (!state.harmony) {
      const chaosShapes = ["circle", "diamond", "star", "hex"];
      shape = isPrimary ? (formGain > 0.4 ? "hex" : "circle") : chaosShapes[(secRank + 1) % chaosShapes.length];
    } else if (formGain >= 0.5) {
      shape = isPrimary ? (formGain >= 0.9 ? "squircle" : "oct") : "circle";
    } else {
      shape = "circle";
    }

    // 5. 配套排版文本杠几何位置（严格避免左列文杠穿入右列模块）
    const showSideBars = !isPrimary || layoutMix < 0.48;
    const barGap = Math.max(10, r * 0.28);
    const barX = cx + r + barGap;
    const isLeftGridCol = layoutMix < 0.48 && cx < W * 0.45;
    const rightColLeftEdge = W * (narrow ? 0.635 : 0.625) - baseChaosR * 1.24 - 14;
    const rightLimit = isLeftGridCol ? Math.min(W - 14, rightColLeftEdge) : W - 14;
    const maxBarW = Math.max(24, Math.min(W * 0.20, rightLimit - barX));

    nodes.push({
      index: i,
      item,
      isPrimary,
      isRival,
      secRank,
      cx,
      cy,
      r,
      fill,
      barColor,
      shape,
      isClashColor,
      showSideBars,
      barX,
      maxBarW,
      layoutMix,
      crPaper: contrastRatio(fill, PALETTE.paper),
      chroma: colorSaturation(fill),
    });
  }

  // 在清晰主次布局下做一次真实的防碰撞检查与疏密微调，同时保留物理间距度量
  const primaryNode = nodes[pIdx];
  // 计算每枚模块与最近邻居之间的净留白（isolationPx）
  for (const n of nodes) {
    let minGap = Infinity;
    for (const m of nodes) {
      if (m.index === n.index) continue;
      const d = Math.hypot(n.cx - m.cx, n.cy - m.cy) - n.r - m.r;
      if (d < minGap) minGap = d;
    }
    n.nearestGap = minGap;
    // 距离画布边缘最小净空
    n.edgeGap = Math.min(n.cx - n.r, W - (n.cx + n.r), n.cy - n.r, H - (n.cy + n.r));
  }

  // 视觉重量计算（严格源自实绘几何、色度、明度对比、疏密留白、位置核心度与形态独异度）
  // 全部显式标注「示意模型」，但在全页只此一份真源！
  const shapeCounts = nodes.reduce((acc, n) => ((acc[n.shape] = (acc[n.shape] || 0) + 1), acc), {});
  const totalArea = nodes.reduce((s, n) => s + Math.PI * n.r * n.r, 0) || 1;
  const maxContrast = Math.max(...nodes.map((n) => n.crPaper), 1.01);

  for (const n of nodes) {
    const areaFactor = (Math.PI * n.r * n.r) / totalArea; // 面积占比 0..1
    const chromaFactor = clamp(n.chroma * 1.15, 0, 1); // 色彩彩度
    const contrastFactor = clamp((n.crPaper - 1) / Math.max(3.2, maxContrast - 1), 0, 1); // 明度对比
    const isoFactor = clamp((n.nearestGap + 10) / (minDim * 0.28), 0, 1); // 疏密留白
    // 核心视觉区靠近左侧黄金轴（0.34W, 0.50H）
    const distCore = Math.hypot((n.cx - W * 0.35) / W, (n.cy - H * 0.50) / H);
    const posFactor = clamp(1 - distCore * 1.55, 0.15, 1);
    const uniqueForm = shapeCounts[n.shape] === 1 ? 1 : 0;

    // 综合视觉重量（面积与明度/色彩为主，疏密/位置/形态叠加放大）
    const rawWeight =
      (0.46 * areaFactor + 0.18 * chromaFactor + 0.20 * contrastFactor + 0.08 * isoFactor + 0.08 * posFactor) *
      (1 + 0.22 * uniqueForm) *
      (n.crPaper < 1.28 ? 0.35 : 1);

    n.rawWeight = Math.max(0.01, rawWeight);
  }

  const weightSum = nodes.reduce((s, n) => s + n.rawWeight, 0) || 1;
  for (const n of nodes) {
    n.share = (n.rawWeight / weightSum) * 100;
  }

  // 按真实视觉重量降序排列，得到真实初看顺序 ①→②→③→④
  const ranked = [...nodes].sort((a, b) => b.share - a.share);
  ranked.forEach((n, idx) => {
    n.eyeOrder = idx + 1;
  });

  const top1 = ranked[0];
  const top2 = ranked[1];
  const primaryShare = primaryNode.share;
  const topRatio = top1.share / Math.max(1, top2.share);
  const nonPrimaryNodes = nodes.filter((n) => !n.isPrimary);
  const minSecondaryCr = Math.min(...nonPrimaryNodes.map((n) => n.crPaper));
  const minSecondaryR = Math.min(...nonPrimaryNodes.map((n) => n.r));
  const areaRatio = (primaryNode.r * primaryNode.r) / Math.max(1, Math.max(...nonPrimaryNodes.map((n) => n.r * n.r)));
  const minPairGap = Math.min(...nodes.map((n) => n.nearestGap));

  // ---------- 7 类错态双向判定（单真源） ----------
  const isFlatChaos = topRatio < 1.65 || top1.share < 38;
  const isRivalClash = !isFlatChaos && (rivalIdx !== -1 || top2.share / Math.max(1, top1.share) > 0.58);
  const isInvertedRole =
    state.scene !== "poster" && primaryNode.item.isFootnote && top1.index === primaryNode.index;
  const isDisharmony = !state.harmony || strongLevers >= 6;
  const isSecondaryWeak = minSecondaryCr < 1.38 || minSecondaryR < minDim * 0.026 || fade > 0.72;
  const isEdgePinched = primaryNode.edgeGap < 18 || Math.abs(state.edgeShift) > 0.62;
  const isOverlapped = minPairGap < -4;
  const isUnderContrasted = activeLevers < 1 || (activeLevers === 1 && topRatio < 2.15);

  const errors = [];
  if (isFlatChaos) errors.push("flat");
  if (isRivalClash) errors.push("rival");
  if (isDisharmony) errors.push("disharmony");
  if (isSecondaryWeak) errors.push("weak_sec");
  if (isInvertedRole) errors.push("inverted");
  if (isEdgePinched) errors.push("edge");
  if (isOverlapped) errors.push("overlap");
  if (isUnderContrasted) errors.push("single_dim");

  // 对应 096 原海报右侧深焙咖啡柱的 4 条核心原则判定
  const p1Pass = top1.index === pIdx && primaryShare >= 42 && !isEdgePinched && !isInvertedRole;
  const p2Pass = !isRivalClash && !isSecondaryWeak && !isOverlapped && !isFlatChaos;
  const p3Pass = topRatio >= 1.85 && !isUnderContrasted;
  const p4Pass = !isDisharmony;

  const score = [p1Pass, p2Pass, p3Pass, p4Pass].filter(Boolean).length;

  const rules = [
    {
      key: "lead",
      title: "突出主导",
      posterBody: "通过更大的尺寸、更高的对比、更强的色彩或更核心的位置，确立视觉焦点。",
      pass: p1Pass,
      chip: isInvertedRole
        ? "注脚倒挂"
        : isEdgePinched
          ? "主角贴边"
          : `主导 ${Math.round(primaryShare)}%`,
    },
    {
      key: "support",
      title: "支撑辅助",
      posterBody: "次要元素以较小、较弱的对比、较低的视觉重量，围绕主导元素进行支持与补充。",
      pass: p2Pass,
      chip: isRivalClash
        ? `抢戏 ${Math.round(top2.share)}%`
        : isSecondaryWeak
          ? "次级过淡"
          : isOverlapped
            ? "模块叠撞"
            : `辅群 ${Math.round(100 - primaryShare)}%`,
    },
    {
      key: "contrast",
      title: "对比强化",
      posterBody: "运用大小、颜色、明度、疏密、位置等对比手法，增强主次区分度。",
      pass: p3Pass,
      chip: `${topRatio.toFixed(2)}× · ${activeLevers} 维`,
    },
    {
      key: "harmony",
      title: "协调统一",
      posterBody: "在对比中保持元素之间的风格、色彩或节奏一致，确保整体和谐有序。",
      pass: p4Pass,
      chip: !state.harmony ? "异色割裂" : strongLevers >= 6 ? "六维过载" : "同族统一",
    },
  ];

  // 生成唯一一份白话诊断（讲清「这样摆会让人眼怎么看」和「下一步调哪里」）
  let badge = `${score}/4 · 主次清晰`;
  let tier = "主次清晰";
  let headline = `主角「${primaryNode.item.name}」稳占 ${Math.round(primaryShare)}% 视觉重量，与次要元素拉开 ${topRatio.toFixed(2)}× 势差`;
  let why = `眼睛一进来立刻落在「${primaryNode.item.name}」上，随后顺着递减节奏读完三枚同色系辅元素——既分得出主次，又像同一张版面的有机整体。`;
  let action = "可以换点任意模块「立为主角」，或在下方窑红工具箱试试「极简大小解」「明度形态解」等不同配方。";

  if (isFlatChaos) {
    badge = `${score}/4 · 主次混乱`;
    tier = "均权混乱";
    headline = `四块重量卡在 ${ranked.map((n) => `${Math.round(n.share)}%`).join(" / ")}，彼此拉平看不出主角`;
    why = `最大与次大只差 ${topRatio.toFixed(2)}×。四个圆都在伸手抢第一眼，大脑被迫逐个扫描，阅读路径原地打结——这正是原海报右下角「主次混乱」的典型症状。`;
    action = "向右横拖画布拉大「主次势差」，再打开下方「大小对比」与「协调统一」，让主角先立起来。";
  } else if (isRivalClash) {
    const rival = nodes[rivalIdx] || top2;
    badge = `${score}/4 · 双王互掐`;
    tier = "双焦拉扯";
    headline = `「${rival.item.name}」抢走 ${Math.round(rival.share)}% 重量，与主角形成双焦撕扯`;
    why = `次要元素不肯退让，分量逼近主角的 ${Math.round((rival.share / Math.max(1, top1.share)) * 100)}%。视线在两处高点之间来回弹跳，观众一秒内答不出「这张图到底在讲什么」。`;
    action = `直接点击画布里标红的「${rival.item.name}」让它退回辅位（或点「卸除抢戏」），把舞台还给唯一主角。`;
  } else if (isInvertedRole) {
    badge = `${score}/4 · 主次倒挂`;
    tier = "信息倒挂";
    headline = `把最次要的「${primaryNode.item.name}」放上了最大主位，形式盖过了内容`;
    why = `几何上确实分出了 ${topRatio.toFixed(2)}× 的强对比，但观众第一眼只记住了免责注脚或刊号，反而漏掉了真正的主题。主次关系必须先服从信息重要性。`;
    action = `点击画布里的「${scene.items[0].name}」重新把它立为主角，让视觉重心回到核心信息。`;
  } else if (isDisharmony) {
    badge = `${score}/4 · 对比失协`;
    tier = "对比过火";
    headline = !state.harmony
      ? "主角虽然够响，但辅元素混入异色与杂形，整张版面裂成了拼贴画"
      : "六种对比全拧到顶格，元素各自嘶吼，整体协调感瓦解";
    why = "主次关系不是把对比拉爆就完事：一旦配角脱离了同一套色族与几何语汇，对比就从「区分主次」滑向「视觉噪音」，违背了海报第 4 条「协调统一」。";
    action = !state.harmony
      ? "点开「风格协调：收束同色族」开关，把冷青与杂形收回暖陶沙金家族。"
      : "在下方工具箱关掉 1–2 把多余杠杆，把力量集中在 2–4 把主对比上。";
  } else if (isSecondaryWeak) {
    badge = `${score}/4 · 支撑过弱`;
    tier = "配角失能";
    headline = `次要元素与纸底对比度跌到 ${minSecondaryCr.toFixed(2)} : 1，快融进背景看不清了`;
    why = "配角退让不等于消失。次要信息太小或太淡时，主角虽然显眼，读者却抓不住时间、地点或说明，版面变成空有外壳的孤岛。";
    action = "把「配角清晰度」往回拉，或点「一键校准原海报解」，让次要元素既退居二线又清晰可读。";
  } else if (isEdgePinched) {
    badge = `${score}/4 · 主角贴边`;
    tier = "边缘受挤";
    headline = "主元素紧贴画布边界，四周呼吸留白被切掉一半";
    why = "即使尺寸够大，紧贴画框边缘也会让主角显得局促受压，无法向四周展开气场去统领配角。";
    action = "把主角拉回核心左中区，给主元素四周留出更宽裕的呼吸空隙。";
  } else if (isUnderContrasted) {
    badge = `${score}/4 · 对比单薄`;
    tier = "对比不足";
    headline = `当前仅开 ${activeLevers} 维对比，主次区分度（${topRatio.toFixed(2)}×）偏弱`;
    why = "只靠单一微弱变化很难在嘈杂环境中一秒锁住视线，补上一把辅助对比（例如大小配疏密，或明度配形态）会立刻扎实很多。";
    action = "在下方窑红工具箱多点亮 1–2 把对比杠杆，看重量比跃过 1.9×。";
  }

  return {
    width: W,
    height: H,
    nodes,
    ranked,
    primaryNode,
    primaryShare,
    topRatio,
    areaRatio,
    activeLevers,
    strongLevers,
    score,
    rules,
    errors,
    badge,
    tier,
    headline,
    why,
    action,
    isClear: score === 4,
  };
}
