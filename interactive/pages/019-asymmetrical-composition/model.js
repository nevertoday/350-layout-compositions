// 019 非对称构图 — 统一视觉重量与五维对比模型（全页唯一数据源）
// 开场配重画板、原海报三段诊断带（●●●●● / 五线对比 / 三勾法则）、
// 01 节等面积属性翻转器、02 节五维对比滑块、07 节单变量四选一小练习全部共用本文件。

export const PALETTE = {
  yellow: "#FABD19",
  paper: "#F7F0DC",
  red: "#E63514",
  blue: "#022D90",
  navy: "#071D52",
  ink: "#0B0A08",
  charcoal: "#141310",
  mutedGray: "#9E9785",
};

export const SCALE_MIN = 0.55;
export const SCALE_MAX = 1.75;

// 统一的视觉重量示意因子表（模型示意，非物理测量值）
export const WEIGHT_TABLE = {
  areaExponent: 0.72,
  tone: {
    light: 0.76,   // 浅灰/浅色，与亮底明度反差弱
    deep: 1.16,    // 深饱和色（朱砂红、群青）
    ink: 1.24,     // 印刷墨黑，在亮底上最高明度反差
  },
  temp: {
    cool: 0.96,    // 冷群青，视觉略后退
    neutral: 1.0,  // 无彩色（墨黑/中性灰）
    warm: 1.22,    // 暖朱红，视觉前进、抢眼
  },
  shape: {
    round: 1.0,    // 圆润轮廓
    angular: 1.15, // 锐角/硬直角/粗字外廓
  },
  density: {
    sparse: 0.84,  // 疏散细线
    solid: 1.0,    // 均匀平涂块
    dense: 1.24,   // 密集点阵/紧凑字群
  },
};

// 五档平衡档位阈值（归一化净力矩 ratio = (rightM - leftM) / max(leftM, rightM, 0.85)，绝不输出度数）
export const BALANCE_TIERS = [
  { id: "heavy-right", min: 0.34, label: "重度右沉", short: "右沉", side: "right", tiltSign: 1, tiltLevel: 1 },
  { id: "slight-right", min: 0.13, label: "略微右沉", short: "偏右", side: "right", tiltSign: 1, tiltLevel: 0.45 },
  { id: "balanced", min: -0.13, label: "视觉持平", short: "持平", side: "even", tiltSign: 0, tiltLevel: 0 },
  { id: "slight-left", min: -0.34, label: "略微左沉", short: "偏左", side: "left", tiltSign: -1, tiltLevel: 0.45 },
  { id: "heavy-left", min: -Infinity, label: "重度左沉", short: "左沉", side: "left", tiltSign: -1, tiltLevel: 1 },
];

// 原海报中栏五组对比关系定义
export const CONTRAST_SPECS = [
  { id: "size", name: "大小对比", pair: "大与小", short: "大小" },
  { id: "color", name: "色彩对比", pair: "暖与冷", short: "色彩" },
  { id: "shape", name: "形状对比", pair: "圆与角", short: "形状" },
  { id: "position", name: "位置对比", pair: "偏与中", short: "位置" },
  { id: "density", name: "疏密对比", pair: "密与疏", short: "疏密" },
];

// 原海报右栏三条构图小法则定义
export const RULE_SPECS = [
  { id: "subject", name: "明确视觉主体", desc: "让主要元素更突出" },
  { id: "space", name: "合理运用留白", desc: "留白是空间，也是呼吸感" },
  { id: "flow", name: "建立视觉动线", desc: "引导视线，自然聚焦" },
];

// 单件视觉重量（模型示意）
export function computeElementWeight(spec) {
  const area = Math.max(0.12, spec.area ?? 1);
  const areaFactor = Math.pow(area, WEIGHT_TABLE.areaExponent);
  const t = WEIGHT_TABLE.tone[spec.tone] ?? 1;
  const temp = WEIGHT_TABLE.temp[spec.temp] ?? 1;
  const s = WEIGHT_TABLE.shape[spec.shape] ?? 1;
  const d = WEIGHT_TABLE.density[spec.density] ?? 1;
  return areaFactor * t * temp * s * d;
}

// 将单侧力矩或重量映射为 1–5 颗原海报黑圆点 ●●●●●
export function toDots(value, fullScale) {
  if (value <= 0.02) return 0;
  const raw = Math.round((value / fullScale) * 5);
  return Math.max(1, Math.min(5, raw));
}

export function dotsText(count, max = 5) {
  return "●".repeat(Math.max(0, Math.min(max, count)));
}

export function getBalanceTier(ratio) {
  for (const tier of BALANCE_TIERS) {
    if (ratio >= tier.min) return tier;
  }
  return BALANCE_TIERS[BALANCE_TIERS.length - 1];
}

// 料盒 6 枚包豪斯异形零件（严禁写「镜像」「陷阱」，红大圆只叫「红大圆」）
// 所有默认投放点都落在中轴附近（x≈0.43–0.46），必须亲手往左缘拖远拉长力臂或缩放大小才能配平
export const TRAY_PIECES = [
  {
    id: "headline-group",
    label: "粗黑字群",
    sub: "墨黑 · 密排",
    kind: "textblock",
    area: 1.5,
    footprint: 0.055,
    tone: "ink",
    temp: "neutral",
    shape: "angular",
    density: "dense",
    colorHex: PALETTE.ink,
    defaultPos: { x: 0.44, y: 0.42 },
    radius: 0.145,
  },
  {
    id: "blue-wedge",
    label: "群青斜角",
    sub: "冷色 · 锐角",
    kind: "wedge",
    area: 1.9,
    footprint: 0.068,
    tone: "deep",
    temp: "cool",
    shape: "angular",
    density: "solid",
    colorHex: PALETTE.blue,
    defaultPos: { x: 0.45, y: 0.74 },
    radius: 0.135,
  },
  {
    id: "dot-matrix",
    label: "密集点阵",
    sub: "墨黑 · 高密",
    kind: "matrix",
    area: 1.25,
    footprint: 0.048,
    tone: "ink",
    temp: "neutral",
    shape: "angular",
    density: "dense",
    colorHex: PALETTE.ink,
    defaultPos: { x: 0.43, y: 0.68 },
    radius: 0.115,
  },
  {
    id: "three-points",
    label: "要点三圆",
    sub: "墨黑 · 列群",
    kind: "points",
    area: 1.6,
    footprint: 0.062,
    tone: "ink",
    temp: "neutral",
    shape: "round",
    density: "dense",
    colorHex: PALETTE.ink,
    defaultPos: { x: 0.46, y: 0.56 },
    radius: 0.142,
  },
  {
    id: "blue-dot",
    label: "冷蓝小圆",
    sub: "冷色 · 小体量",
    kind: "smallcircle",
    area: 0.5,
    footprint: 0.018,
    tone: "deep",
    temp: "cool",
    shape: "round",
    density: "solid",
    colorHex: PALETTE.blue,
    defaultPos: { x: 0.46, y: 0.64 },
    radius: 0.044,
  },
  {
    id: "red-giant",
    label: "红大圆",
    sub: "暖红 · 大体量",
    kind: "giantcircle",
    area: 4.6,
    footprint: 0.135,
    tone: "deep",
    temp: "warm",
    shape: "round",
    density: "solid",
    colorHex: PALETTE.red,
    defaultPos: { x: 0.44, y: 0.58 },
    radius: 0.132,
    isSameAsPrimary: true,
  },
];

export const TRAY_MAP = Object.fromEntries(TRAY_PIECES.map((p) => [p.id, p]));

// 三组构图命题（均以刻意失衡态开局，不先给答案）
export const SCENARIOS = [
  {
    id: "poster",
    name: "原海报 · 红圆压顶",
    shortName: "原海报",
    rightDesc: "右上朱红主圆与右下群青大三角",
    anchor: {
      id: "anchor-red",
      label: "朱红主圆",
      kind: "primary-circle",
      x: 0.79,
      y: 0.27,
      area: 4.6,
      footprint: 0.135,
      tone: "deep",
      temp: "warm",
      shape: "round",
      density: "solid",
      colorHex: PALETTE.red,
      radius: 0.132,
    },
    // 原海报右下占近半版面的群青直角大三角作为固定元素参与视觉重量与形状/冷暖对比
    fixedExtras: [
      {
        id: "poster-triangle",
        label: "右下群青大三角",
        kind: "corner-triangle",
        x: 0.85,
        y: 0.75,
        area: 1.65,
        footprint: 0.08,
        tone: "deep",
        temp: "cool",
        shape: "angular",
        density: "solid",
        colorHex: PALETTE.blue,
      },
    ],
    titleWeight: {
      id: "title-block",
      x: 0.2,
      y: 0.2,
      area: 1.55,
      footprint: 0.07,
      tone: "ink",
      temp: "neutral",
      shape: "angular",
      density: "solid",
    },
    // 开局仅在偏中线处放一颗冷蓝小圆，形成刻意「重度右沉」（左 ●● < 右 ●●●●●）
    initialPlaced: [{ id: "blue-dot", x: 0.46, y: 0.62, scale: 1 }],
    // 参考解：忠实复刻原海报左列大号要点三圆 + 45° 动线底端冷蓝小圆，配固定右下群青大三角
    solutionPlaced: [
      { id: "three-points", x: 0.18, y: 0.66, scale: 1.4 },
      { id: "blue-dot", x: 0.41, y: 0.66, scale: 1 },
    ],
    bgAccent: "poster-wedge",
  },
  {
    id: "magazine",
    name: "杂志跨页 · 巨图压右",
    shortName: "杂志跨页",
    rightDesc: "右侧暖色大图版",
    anchor: {
      id: "anchor-photo",
      label: "暖色大图版",
      kind: "primary-plate",
      x: 0.78,
      y: 0.46,
      area: 5.4,
      footprint: 0.165,
      tone: "deep",
      temp: "warm",
      shape: "angular",
      density: "solid",
      colorHex: PALETTE.red,
      radius: 0.132,
    },
    fixedExtras: [],
    titleWeight: {
      id: "title-block",
      x: 0.2,
      y: 0.2,
      area: 1.25,
      footprint: 0.065,
      tone: "ink",
      temp: "neutral",
      shape: "angular",
      density: "solid",
    },
    initialPlaced: [{ id: "blue-dot", x: 0.46, y: 0.68, scale: 1 }],
    solutionPlaced: [
      { id: "headline-group", x: 0.21, y: 0.54, scale: 1 },
      { id: "dot-matrix", x: 0.26, y: 0.8, scale: 0.85 },
      { id: "blue-dot", x: 0.42, y: 0.72, scale: 1 },
    ],
    bgAccent: "magazine-fold",
  },
  {
    id: "exhibition",
    name: "展讯海报 · 重块压角",
    shortName: "展讯海报",
    rightDesc: "右下暖红主色盘",
    anchor: {
      id: "anchor-corner",
      label: "右下主色盘",
      kind: "primary-circle",
      x: 0.79,
      y: 0.66,
      area: 5.6,
      footprint: 0.145,
      tone: "deep",
      temp: "warm",
      shape: "round",
      density: "solid",
      colorHex: PALETTE.red,
      radius: 0.132,
    },
    fixedExtras: [],
    titleWeight: {
      id: "title-block",
      x: 0.2,
      y: 0.2,
      area: 1.25,
      footprint: 0.065,
      tone: "ink",
      temp: "neutral",
      shape: "angular",
      density: "solid",
    },
    initialPlaced: [{ id: "blue-dot", x: 0.46, y: 0.34, scale: 1 }],
    solutionPlaced: [
      { id: "blue-wedge", x: 0.2, y: 0.74, scale: 1 },
      { id: "dot-matrix", x: 0.32, y: 0.44, scale: 0.85 },
      { id: "blue-dot", x: 0.42, y: 0.32, scale: 1 },
    ],
    bgAccent: "exhibition-grid",
  },
];

export const SCENARIO_MAP = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

// 核心计算：评估当前开场画板的五档平衡、左右五点刻度、五条对比点亮与三条法则勾
export function evaluateStage(scenarioId, placedList) {
  const sc = SCENARIO_MAP[scenarioId] || SCENARIOS[0];
  const anchor = sc.anchor;
  const fixedExtras = sc.fixedExtras || [];
  const anchorW = computeElementWeight(anchor);
  const titleW = computeElementWeight(sc.titleWeight);

  let leftM = 0;
  let rightM = 0;
  let totalFootprint = anchor.footprint + sc.titleWeight.footprint;

  const addItemMoment = (x, w) => {
    const lever = x - 0.5;
    if (lever >= 0) rightM += w * lever;
    else leftM += w * -lever;
  };
  addItemMoment(anchor.x, anchorW);
  addItemMoment(sc.titleWeight.x, titleW);

  for (const fx of fixedExtras) {
    const fw = computeElementWeight(fx);
    totalFootprint += fx.footprint;
    addItemMoment(fx.x, fw);
  }

  const items = placedList
    .map((p) => {
      const def = TRAY_MAP[p.id];
      if (!def) return null;
      const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, p.scale ?? 1));
      const areaMul = scale * scale;
      const effArea = def.area * areaMul;
      const effFootprint = def.footprint * areaMul;
      const w = computeElementWeight({ ...def, area: effArea });
      totalFootprint += effFootprint;
      addItemMoment(p.x, w);
      return {
        ...def,
        x: p.x,
        y: p.y,
        scale,
        effArea,
        effFootprint,
        weight: w,
      };
    })
    .filter(Boolean);

  // 归一化净力矩，判定五档平衡（不出度数）
  const scaleNorm = Math.max(rightM, leftM, 0.85);
  const net = rightM - leftM;
  const ratio = net / scaleNorm;
  const tier = getBalanceTier(ratio);

  // 左右视觉重量五点刻点（以更重一侧满 5 颗点，另一侧按比例换算）
  const dotFull = Math.max(leftM, rightM, anchorW * Math.abs(anchor.x - 0.5), 1.15);
  const leftDots = toDots(leftM, dotFull);
  const rightDots = toDots(rightM, dotFull);

  // 评估对侧零件（位于左半区或与主块错位的已放件）
  const counterItems = items.filter((it) => it.x < 0.52);
  // 若左侧放进了与主块等大、同暖红、同圆的「红大圆」（未缩小）且占去左侧摆件绝大部分分量，
  // 对抗关系被同质镜像接管，五项对比归零
  const giantOnLeft = counterItems.find(
    (it) => it.isSameAsPrimary && it.effArea >= anchor.area * 0.62
  );
  const counterTotalW = counterItems.reduce((acc, it) => acc + it.weight, 0);
  const mirrorDominated = Boolean(giantOnLeft && giantOnLeft.weight >= counterTotalW * 0.62);

  // 任何被放得和主块差不多大的零件都会削弱主次大小差与主体明确度
  const oversizedRival = items.some((it) => it.effArea >= anchor.area * 0.72);
  const contrastPool = [...counterItems, ...fixedExtras];

  const contrasts = {
    size: false,
    color: false,
    shape: false,
    position: false,
    density: false,
  };

  if (!mirrorDominated && counterItems.length > 0) {
    // 1. 大小对比（大与小）：存在明显小于主块的对抗件，且没有放大到与主块等大的抢戏件
    contrasts.size =
      counterItems.some((it) => it.effArea <= anchor.area * 0.48) && !oversizedRival;
    // 2. 色彩对比（暖与冷）：存在冷群青或高对比墨黑对抗暖色主块
    contrasts.color = contrastPool.some((it) => it.temp === "cool" || it.tone === "ink");
    // 3. 形状对比（圆与角）：对侧摆件或固定结构件与主块形态相反（圆对角 / 角对圆）
    contrasts.shape = contrastPool.some((it) => it.shape !== anchor.shape);
    // 4. 位置对比（偏与中）：与主块存在纵横错位且拉出足够偏轴力臂（必须远离中轴）
    contrasts.position = counterItems.some((it) => {
      const yDiff = Math.abs(it.y - anchor.y);
      const farEnough = Math.abs(it.x - 0.5) >= 0.16;
      return farEnough && yDiff >= 0.14;
    });
    // 5. 疏密对比（密与疏）：存在高密点阵/紧凑字群/要点三圆列
    contrasts.density = counterItems.some((it) => it.density === "dense");
  }

  const activeContrasts = CONTRAST_SPECS.filter((c) => contrasts[c.id]);
  const contrastCount = activeContrasts.length;

  // 判定三类核心态
  const isBalanced = tier.id === "balanced";
  const isMirrorTrap = isBalanced && (mirrorDominated || contrastCount === 0);
  const isPass = isBalanced && contrastCount >= 3 && !mirrorDominated && !oversizedRival;

  // 三条构图小法则实时检验
  const rules = {
    subject: !oversizedRival,
    space: totalFootprint <= 0.48,
    flow: isPass && counterItems.some((it) => Math.hypot(it.x - anchor.x, it.y - anchor.y) >= 0.34),
  };

  // 生成“为什么”的实时中文诊断（明确说出哪几种对比在抵消主块）
  const activeNames = activeContrasts.map((c) => c.short).join("、");
  let verdictTag = tier.label;
  let verdictTone = "warn"; // warn | mirror | pass
  let verdictTitle = "";
  let verdictWhy = "";

  if (isMirrorTrap) {
    verdictTag = "持平 · 0 项对比";
    verdictTone = "mirror";
    verdictTitle = "左右确实平了，但五项对比全灭";
    verdictWhy =
      "放进等大的红大圆并拖到左侧虽然压平了左右分量，但大小、冷暖、轮廓与疏密全都雷同——左右成了同质对峙，已退回对称均衡的思路，稳却没了方向与张力。撤掉红大圆，或把右下角缩放柄往内收小再换入异形冷色零件。";
  } else if (isPass) {
    verdictTag = `过关 · ${contrastCount}/5 对比`;
    verdictTone = "pass";
    verdictTitle = `视觉持平：靠${activeNames}托住${sc.rightDesc}`;
    verdictWhy =
      `左右形态完全不同，却在力臂与体量上互相托住——当前由「${activeNames}」共 ${contrastCount} 项对比抵消了${sc.rightDesc}的分量，45° 点线把视线顺滑带向对侧，稳态与张力同时成立。`;
  } else if (isBalanced && oversizedRival) {
    verdictTag = `持平 · 主次抢戏（${contrastCount}/5）`;
    verdictTone = "warn";
    verdictTitle = "重量虽已持平，但左侧零件放得太大抢了主角";
    verdictWhy =
      `当前有零件尺寸接近甚至追平了${anchor.label}，大小对比失效且「明确视觉主体」未通过。拖住选中件右下角的缩放柄往内收小，并把它往左缘拖远借力臂托平。`;
  } else if (isBalanced) {
    verdictTag = `持平 · 对比不足（${contrastCount}/5）`;
    verdictTone = "warn";
    verdictTitle = `重量平了，还差至少 ${3 - contrastCount} 项对比`;
    verdictWhy =
      contrastCount > 0
        ? `目前只有「${activeNames}」起作用，视觉反差还不够利落。再换入带棱角、冷暖对冲或高密度的异形件，让至少 3 项对比同时成立。`
        : "左右分量虽已接近，但缺少形态与材质反差；换用不同大小、冷暖或密度的零件去对冲主块。";
  } else if (mirrorDominated) {
    verdictTag = `${tier.label} · 0 项对比`;
    verdictTone = "warn";
    verdictTitle = "等大红圆吞掉了对比，而且还没拖到平衡力臂";
    verdictWhy =
      "红大圆与主块同色同形且体量相当，即使继续往左拖到持平也会退回镜像对称。试试撤回它，改放冷色、锐角或密排零件往左缘拉长力臂；或拖右下角缩放柄把红圆缩成小配角。";
  } else if (tier.side === "right") {
    verdictTag = tier.label;
    verdictTone = "warn";
    verdictTitle =
      tier.id === "heavy-right"
        ? "右侧明显压沉，画面向右方歪倒"
        : "还略微右沉，往左缘再拖远或微调大小就能托住";
    verdictWhy =
      contrastCount > 0
        ? `目前点亮了「${activeNames}」（${contrastCount}/5 项），但零件还停在中轴附近或体量偏轻，压不住${sc.rightDesc}。把零件往左缘拖远拉长力臂，或拖选中件右下角缩放柄微调体量。`
        : `${sc.rightDesc}独占右侧分量，左侧几乎空白。从料盒点选粗黑字群、要点三圆或群青斜角，并往左缘拖远来托住它。`;
  } else {
    verdictTag = tier.label;
    verdictTone = "warn";
    verdictTitle =
      tier.id === "heavy-left"
        ? "左侧配重堆过头，主次反被压翻"
        : "略微左沉，把左侧零件收轻或往中轴移近一点";
    verdictWhy =
      `虽然已点亮「${activeNames || "多项"}」对比，但左侧零件总分量（或距轴力臂）超过了${sc.rightDesc}。拖右下角缩放柄收小体量、往中轴移近，或双击撤回一件让天平回到视觉持平。`;
  }

  return {
    scenario: sc,
    anchor,
    fixedExtras,
    items,
    leftM,
    rightM,
    ratio,
    tier,
    leftDots,
    rightDots,
    contrasts,
    activeContrasts,
    contrastCount,
    rules,
    isBalanced,
    isMirrorTrap,
    isPass,
    totalFootprint,
    verdictTag,
    verdictTone,
    verdictTitle,
    verdictWhy,
  };
}

// 01 节：等面积视觉属性翻转器（与开场共用同一 computeElementWeight 与 WEIGHT_TABLE）
export function evaluateEqualAreaFlip(flags) {
  const FIXED_AREA = 1.8;
  const refSpec = {
    area: FIXED_AREA,
    tone: "light",
    temp: "cool",
    shape: "round",
    density: "solid",
  };
  const testSpec = {
    area: FIXED_AREA,
    tone: flags.deep ? "deep" : "light",
    temp: flags.warm ? "warm" : "cool",
    shape: flags.angular ? "angular" : "round",
    density: flags.dense ? "dense" : "solid",
  };
  const refW = computeElementWeight(refSpec);
  const testW = computeElementWeight(testSpec);
  const fullScale = computeElementWeight({
    area: FIXED_AREA,
    tone: "deep",
    temp: "warm",
    shape: "angular",
    density: "dense",
  });
  const leftDots = toDots(refW, fullScale);
  const rightDots = toDots(testW, fullScale);
  const ratio = (testW - refW) / Math.max(testW, refW, 0.5);
  const tier = getBalanceTier(ratio);

  const activeLabels = [];
  if (flags.deep) activeLabels.push("高反差深色");
  if (flags.warm) activeLabels.push("前进暖色");
  if (flags.angular) activeLabels.push("锐角轮廓");
  if (flags.dense) activeLabels.push("密集肌理");

  const summary =
    activeLabels.length === 0
      ? "左右面积、色温、明度、形状、疏密全部相同，视觉重量完全持平。逐项点开上面四枚属性开关，看面积不变时重量怎样攀升。"
      : `两块图形面积一分未增，但右侧叠加了「${activeLabels.join(" + ")}」，在统一权重模型下分量升至 ${dotsText(rightDots)}（相对左侧 ${dotsText(leftDots)}，状态：${tier.label}）。`;

  return { refSpec, testSpec, refW, testW, leftDots, rightDots, ratio, tier, activeLabels, summary };
}

// 07 节：严格单一变量四选一小练习（完全复用同一套 WEIGHT_TABLE 与 evaluate）
// 四版海报锁死：左上标题、右上朱红主圆、左下冷群青辅块的色彩/形状/密度/中心位置
// 唯一改变的变量：左下冷群青辅块的面积 area
export const QUIZ_FIXED = {
  title: { x: 0.27, y: 0.19, area: 0.7, tone: "ink", temp: "neutral", shape: "angular", density: "solid" },
  primary: { x: 0.76, y: 0.29, area: 4.6, tone: "deep", temp: "warm", shape: "round", density: "solid" },
  auxPos: { x: 0.23, y: 0.77 },
  auxProps: { tone: "deep", temp: "cool", shape: "angular", density: "dense" },
};

export const QUIZ_OPTIONS = [
  { key: "A", auxArea: 0.32 },
  { key: "B", auxArea: 1.32 },
  { key: "C", auxArea: 2.45 },
  { key: "D", auxArea: 5.8 },
];

export function evaluateQuizOption(option) {
  const titleW = computeElementWeight(QUIZ_FIXED.title);
  const primaryW = computeElementWeight(QUIZ_FIXED.primary);
  const auxSpec = { area: option.auxArea, ...QUIZ_FIXED.auxProps };
  const auxW = computeElementWeight(auxSpec);

  const leftM = titleW * (0.5 - QUIZ_FIXED.title.x) + auxW * (0.5 - QUIZ_FIXED.auxPos.x);
  const rightM = primaryW * (QUIZ_FIXED.primary.x - 0.5);
  const scale = Math.max(leftM, rightM, 0.85);
  const ratio = (rightM - leftM) / scale;
  const tier = getBalanceTier(ratio);
  const dotFull = Math.max(leftM, rightM, 1.05);
  const leftDots = toDots(leftM, dotFull);
  const rightDots = toDots(rightM, dotFull);
  const isCorrect = tier.id === "balanced";

  // 渲染用的相对尺寸因子（严格按面积开方缩放，确保视觉与权重表一一对应）
  const sizeScale = Math.sqrt(option.auxArea / 2.45);

  let explain = "";
  if (tier.id === "heavy-right") {
    explain = `左下群青辅块面积太小，左区力矩仅 ${dotsText(leftDots)}，远托不住右上朱红大圆的 ${dotsText(rightDots)}，整体仍呈「${tier.label}」。`;
  } else if (tier.id === "slight-right") {
    explain = `左下群青辅块加大了一些，但仍偏轻（左 ${dotsText(leftDots)} 对右 ${dotsText(rightDots)}），画面重心依旧「${tier.label}」。`;
  } else if (tier.id === "balanced") {
    explain = `左下群青辅块面积恰到好处：虽然比右上朱红主圆小，但借冷暖、方圆、高密与远位力臂叠加，左区 ${dotsText(leftDots)} 刚好托住右区 ${dotsText(rightDots)}，达成「${tier.label}」且留出大片呼吸空白。`;
  } else {
    explain = `左下群青辅块面积铺得过大，左区分量反超右区（状态：${tier.label}），不但把画面拽向左下，还抢走了右上朱红圆的主角位置并吃掉了底部留白。`;
  }

  return {
    key: option.key,
    auxArea: option.auxArea,
    sizeScale,
    leftM,
    rightM,
    ratio,
    tier,
    leftDots,
    rightDots,
    isCorrect,
    explain,
  };
}

export function getAllQuizEvaluations() {
  return QUIZ_OPTIONS.map(evaluateQuizOption);
}
