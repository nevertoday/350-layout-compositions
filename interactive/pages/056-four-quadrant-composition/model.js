// 056 四象限构图 — 单真源几何与光学重心模型
// 所有画布坐标、象限面积、视觉重心、越界检测、对比极差、呼应链路与四项诊断都从本模块一次算出。

export const PALETTE = {
  paper: "#F5EEE3",
  ivory: "#FAF5EC",
  sandSoft: "#EFE6D8",
  pine: "#1B5136",
  pineDeep: "#14402A",
  pineBright: "#2D7040",
  pineDarkroom: "#10291D",
  terra: "#D25A2E",
  terraDeep: "#9F3A14",
  sand: "#E3C498",
  sandDeep: "#755422",
  mist: "#8EA497",
  ink: "#0A0A0A",
  inkMuted: "#48564E",
  danger: "#B83227",
  dangerSoft: "rgba(184, 50, 39, 0.14)",
  ok: "#1F6E48",
};

export const TONE_META = {
  pine:  { label: "深松绿", weight: 1.44, fill: "#1B5136", stroke: "#14402A", inkOn: "#FAF5EC" },
  terra: { label: "陶土赤", weight: 1.32, fill: "#D25A2E", stroke: "#9F3A14", inkOn: "#FAF5EC" },
  sand:  { label: "暖燕麦", weight: 0.78, fill: "#E3C498", stroke: "#9E7842", inkOn: "#1C231F" },
  mist:  { label: "雾灰绿", weight: 0.56, fill: "#9FB3A7", stroke: "#5C7266", inkOn: "#1C231F" },
};

export const SHAPE_META = {
  square:  { label: "实方", fillFactor: 1.00, aspect: 1.0 },
  arc:     { label: "陶弧", fillFactor: 0.79, aspect: 1.0 },
  circle:  { label: "实圆", fillFactor: 0.79, aspect: 1.0 },
  stripes: { label: "竖纹", fillFactor: 0.66, aspect: 1.0 },
  dots:    { label: "点阵", fillFactor: 0.50, aspect: 1.0 },
};

export const SHAPE_CYCLE = [
  { shape: "square",  tone: "pine",  size: 0.142 },
  { shape: "arc",     tone: "terra", size: 0.128 },
  { shape: "circle",  tone: "pine",  size: 0.136 },
  { shape: "sand_sq", shapeReal: "square", tone: "sand", size: 0.104 },
  { shape: "stripes", tone: "pine",  size: 0.114 },
  { shape: "dots",    tone: "mist",  size: 0.096 },
];

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报·几何构成",
    short: "原海报几何",
    sub: "1:1 承袭 056 原海报松绿方、陶土弧、实圆、燕麦块、点阵与竖纹",
    quadNames: ["Q1 · 平衡", "Q2 · 分区", "Q3 · 对比", "Q4 · 关联"],
    itemTitles: ["主松绿体块", "陶土视觉弧", "深绿对比圆", "呼应肌理块"],
    itemTags: ["MASS", "ARC", "FOCUS", "ECHO"],
  },
  editorial: {
    id: "editorial",
    name: "编辑部·四格专刊",
    short: "编辑部专刊",
    sub: "主视觉图、头题大字、引语摘录与索引图表的四象限版面调度",
    quadNames: ["Q1 · 主图", "Q2 · 头题", "Q3 · 引语", "Q4 · 索引"],
    itemTitles: ["封面主视觉", "特稿主标题", "编辑部导语", "数据索引卡"],
    itemTags: ["HERO", "HEAD", "QUOTE", "INDEX"],
  },
  matrix: {
    id: "matrix",
    name: "策略盘·2×2 矩阵",
    short: "策略 2×2",
    sub: "横轴相对份额 × 纵轴增速的四象限优先级与资源配置盘",
    quadNames: ["Q1 · 明星", "Q2 · 试探", "Q3 · 现金牛", "Q4 · 瘦狗"],
    itemTitles: ["核心增长项", "高潜试探项", "稳健基石项", "待收敛项目"],
    itemTags: ["STAR", "PROBE", "CORE", "TRIM"],
  },
};

export const ECHO_MODES = {
  none:     { id: "none",     label: "孤岛断联", desc: "四象限彼此隔绝，零呼应链路" },
  diagonal: { id: "diagonal", label: "对角回声", desc: "Q1↔Q4 与 Q2↔Q3 跨中心对角呼应" },
  cycle:    { id: "cycle",    label: "顺时针导引", desc: "Q1→Q2→Q4→Q3 沿轴心形成闭环阅读" },
  chaos:    { id: "chaos",    label: "全向杂乱", desc: "高饱和双向交叉线割裂画面" },
};

export const PRESETS = {
  // 开场刻意停在 0/4 复合坏态：轴心偏塌 + 左重失衡 + 越界串区 + 四同方平坦 + 孤岛断联
  broken: {
    id: "broken",
    label: "开场坏态",
    ax: 0.65,
    ay: 0.62,
    echoMode: "none",
    items: [
      { id: 0, u: 0.25, v: 0.28, size: 0.124, shape: "square", tone: "pine" },
      { id: 1, u: 0.668, v: 0.29, size: 0.120, shape: "square", tone: "pine" }, // 物理横跨竖轴 ax=0.65!
      { id: 2, u: 0.24, v: 0.78, size: 0.124, shape: "square", tone: "pine" },
      { id: 3, u: 0.84, v: 0.82, size: 0.114, shape: "square", tone: "sand" },
    ],
  },
  // 合法解 1：原海报经典均衡解
  poster: {
    id: "poster",
    label: "原海报经典解",
    ax: 0.50,
    ay: 0.50,
    echoMode: "diagonal",
    items: [
      { id: 0, u: 0.25, v: 0.25, size: 0.140, shape: "square",  tone: "pine" },
      { id: 1, u: 0.74, v: 0.26, size: 0.126, shape: "arc",     tone: "terra" },
      { id: 2, u: 0.26, v: 0.74, size: 0.110, shape: "square",  tone: "sand" },
      { id: 3, u: 0.74, v: 0.74, size: 0.136, shape: "stripes", tone: "pine" },
    ],
  },
  // 合法解 2：阿恩海姆对角动态张力解
  diagonal: {
    id: "diagonal",
    label: "对角张力解",
    ax: 0.47,
    ay: 0.52,
    echoMode: "diagonal",
    items: [
      { id: 0, u: 0.23, v: 0.26, size: 0.140, shape: "circle",  tone: "pine" },
      { id: 1, u: 0.73, v: 0.26, size: 0.128, shape: "dots",    tone: "mist" },
      { id: 2, u: 0.23, v: 0.76, size: 0.118, shape: "square",  tone: "sand" },
      { id: 3, u: 0.74, v: 0.76, size: 0.140, shape: "arc",     tone: "terra" },
    ],
  },
  // 合法解 3：现代编辑部主次专刊解
  editorial: {
    id: "editorial",
    label: "主次专刊解",
    ax: 0.54,
    ay: 0.47,
    echoMode: "cycle",
    items: [
      { id: 0, u: 0.27, v: 0.23, size: 0.140, shape: "square",  tone: "pine" },
      { id: 1, u: 0.77, v: 0.24, size: 0.130, shape: "circle",  tone: "terra" },
      { id: 2, u: 0.28, v: 0.74, size: 0.130, shape: "stripes", tone: "pine" },
      { id: 3, u: 0.77, v: 0.74, size: 0.122, shape: "square",  tone: "sand" },
    ],
  },
  // 双向试错 1：单侧倾覆
  errTilt: {
    id: "errTilt",
    label: "单侧倾覆",
    ax: 0.50,
    ay: 0.50,
    echoMode: "diagonal",
    items: [
      { id: 0, u: 0.21, v: 0.24, size: 0.156, shape: "square", tone: "pine" },
      { id: 1, u: 0.76, v: 0.26, size: 0.084, shape: "dots",   tone: "mist" },
      { id: 2, u: 0.21, v: 0.75, size: 0.150, shape: "circle", tone: "terra" },
      { id: 3, u: 0.76, v: 0.76, size: 0.082, shape: "dots",   tone: "mist" },
    ],
  },
  // 双向试错 2：均质死水
  errFlat: {
    id: "errFlat",
    label: "均质死水",
    ax: 0.50,
    ay: 0.50,
    echoMode: "diagonal",
    items: [
      { id: 0, u: 0.25, v: 0.25, size: 0.116, shape: "square", tone: "sand" },
      { id: 1, u: 0.75, v: 0.25, size: 0.116, shape: "square", tone: "sand" },
      { id: 2, u: 0.25, v: 0.75, size: 0.116, shape: "square", tone: "sand" },
      { id: 3, u: 0.75, v: 0.75, size: 0.116, shape: "square", tone: "sand" },
    ],
  },
  // 双向试错 3：巨块吞场（对比过激的反向错态）
  errGiant: {
    id: "errGiant",
    label: "巨块吞场",
    ax: 0.52,
    ay: 0.52,
    echoMode: "diagonal",
    items: [
      { id: 0, u: 0.31, v: 0.31, size: 0.176, shape: "square", tone: "pine" },
      { id: 1, u: 0.84, v: 0.22, size: 0.056, shape: "dots",   tone: "mist" },
      { id: 2, u: 0.22, v: 0.84, size: 0.058, shape: "dots",   tone: "mist" },
      { id: 3, u: 0.88, v: 0.88, size: 0.098, shape: "circle", tone: "terra" },
    ],
  },
  // 双向试错 4：轴心压死 + 杂乱连线
  errCrush: {
    id: "errCrush",
    label: "轴心压死",
    ax: 0.50,
    ay: 0.50,
    echoMode: "chaos",
    items: [
      { id: 0, u: 0.445, v: 0.43, size: 0.058, shape: "circle", tone: "pine" },
      { id: 1, u: 0.74, v: 0.25, size: 0.122, shape: "arc",    tone: "terra" },
      { id: 2, u: 0.26, v: 0.75, size: 0.112, shape: "square", tone: "sand" },
      { id: 3, u: 0.74, v: 0.75, size: 0.126, shape: "stripes", tone: "pine" },
    ],
  },
};

export function clonePreset(key, specimen = "poster") {
  const p = PRESETS[key] || PRESETS.broken;
  return {
    specimen,
    ax: p.ax,
    ay: p.ay,
    echoMode: p.echoMode,
    showGuides: true,
    selectedId: 0,
    items: p.items.map((it) => ({ ...it })),
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function getItemHalfExtents(item, aspect = 1.2) {
  const hh = item.size;
  const hw = item.size / Math.max(0.75, Math.min(2.6, aspect));
  return { hw, hh };
}

export function cycleItemStyle(item) {
  const curIdx = SHAPE_CYCLE.findIndex(
    (s) => (s.shapeReal || s.shape) === item.shape && s.tone === item.tone
  );
  const next = SHAPE_CYCLE[(curIdx + 1) % SHAPE_CYCLE.length];
  item.shape = next.shapeReal || next.shape;
  item.tone = next.tone;
  item.size = next.size;
}

export function quadrantOf(u, v, ax, ay) {
  const right = u >= ax ? 1 : 0;
  const bottom = v >= ay ? 2 : 0;
  return bottom + right; // 0:Q1(TL), 1:Q2(TR), 2:Q3(BL), 3:Q4(BR)
}

function directionText(dx, dy) {
  const h = Math.abs(dx) > 0.03 ? (dx < 0 ? "左" : "右") : "";
  const v = Math.abs(dy) > 0.03 ? (dy < 0 ? "上" : "下") : "";
  return (h + v) || "中心";
}

// 单真源评估函数：从实绘几何一次算出全部力学指标、9 类双向错态与四项通过状态
export function evaluate(state, aspect = 1.22) {
  const { ax, ay, echoMode, items } = state;

  // 1. 四个象限实测面积占比
  const quadAreas = [
    ax * ay,
    (1 - ax) * ay,
    ax * (1 - ay),
    (1 - ax) * (1 - ay),
  ];
  const maxQuadArea = Math.max(...quadAreas);
  const minQuadArea = Math.min(...quadAreas);

  // 2. 逐模块实测几何包围盒、象限归属、越界检测与视觉重量（示意）
  const quadCounts = [0, 0, 0, 0];
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;

  const measured = items.map((it) => {
    const { hw, hh } = getItemHalfExtents(it, aspect);
    const x0 = it.u - hw;
    const x1 = it.u + hw;
    const y0 = it.v - hh;
    const y1 = it.v + hh;

    const crossX = x0 < ax - 0.009 && x1 > ax + 0.009;
    const crossY = y0 < ay - 0.009 && y1 > ay + 0.009;
    const straddling = crossX || crossY;

    const distOrigin = Math.hypot((it.u - ax) * aspect, it.v - ay);
    const minOriginClear = 0.088 + Math.min(hw * aspect, hh) * 0.88;
    const originClash = distOrigin < minOriginClear;

    const q = quadrantOf(it.u, it.v, ax, ay);
    quadCounts[q]++;

    const shapeMeta = SHAPE_META[it.shape] || SHAPE_META.square;
    const toneMeta = TONE_META[it.tone] || TONE_META.pine;
    const paintedArea = (2 * hw) * (2 * hh) * shapeMeta.fillFactor;
    // 感知面积幂律修正 + 阿恩海姆上重感知微修正（示意）
    const topFactor = 1 + (0.5 - it.v) * 0.12;
    const visualWeight = Math.pow(paintedArea, 0.72) * toneMeta.weight * topFactor;

    sumW += visualWeight;
    sumWX += visualWeight * it.u;
    sumWY += visualWeight * it.v;

    return {
      ...it,
      hw,
      hh,
      x0,
      x1,
      y0,
      y1,
      q,
      crossX,
      crossY,
      straddling,
      originClash,
      distOrigin,
      paintedArea,
      visualWeight,
    };
  });

  const gx = sumW > 0 ? sumWX / sumW : 0.5;
  const gy = sumW > 0 ? sumWY / sumW : 0.5;

  const axisOffX = ax - 0.5;
  const axisOffY = ay - 0.5;
  const axisSkew = Math.hypot(axisOffX, axisOffY);

  const cogFromCenter = Math.hypot(gx - 0.5, gy - 0.5);
  const cogFromAxis = Math.hypot(gx - ax, gy - ay);
  const leanDir = directionText(gx - ax, gy - ay);
  const leanPct = Math.round(cogFromAxis * 100);
  const centerPct = Math.round(cogFromCenter * 100);

  const straddleItems = measured.filter((m) => m.straddling);
  const clashItems = measured.filter((m) => m.originClash);
  const emptyQuads = quadCounts.map((c, idx) => (c === 0 ? idx : -1)).filter((x) => x >= 0);
  const crowdedQuads = quadCounts.map((c, idx) => (c >= 2 ? idx : -1)).filter((x) => x >= 0);

  const weights = measured.map((m) => m.visualWeight);
  const maxW = Math.max(...weights);
  const minW = Math.max(0.0001, Math.min(...weights));
  const weightRatio = maxW / minW;
  const maxShare = sumW > 0 ? maxW / sumW : 0.25;

  const distinctShapes = new Set(measured.map((m) => m.shape)).size;
  const distinctTones = new Set(measured.map((m) => m.tone)).size;

  // 视线按视觉重量从高到低的实际巡航顺序
  const scanOrder = [...measured]
    .sort((a, b) => b.visualWeight - a.visualWeight)
    .map((m) => m.id);

  // 跨象限色彩/肌理回声统计
  const toneCounts = {};
  for (const m of measured) toneCounts[m.tone] = (toneCounts[m.tone] || 0) + 1;
  const hasColorEcho = Object.values(toneCounts).some((c) => c >= 2) && distinctTones >= 2;
  const avgRadius = measured.reduce((acc, m) => acc + Math.hypot(m.u - ax, m.v - ay), 0) / measured.length;
  const tooScattered = avgRadius > 0.44 && echoMode === "none";

  // 9 类双向错态检出
  const faults = [];
  if (straddleItems.length > 0) faults.push("straddle");
  if (clashItems.length > 0) faults.push("center_clash");
  if (emptyQuads.length > 0) faults.push("crowded");
  if (Math.abs(axisOffX) > 0.115 || Math.abs(axisOffY) > 0.115 || minQuadArea < 0.145) faults.push("axis_skew");
  if (cogFromCenter > 0.088 || cogFromAxis > 0.095) faults.push("imbalance");
  if (weightRatio < 1.55 || distinctShapes < 2 || distinctTones < 2) faults.push("flat_contrast");
  if (weightRatio > 5.1 || maxShare > 0.50) faults.push("over_contrast");
  if (echoMode === "none" || tooScattered) faults.push("no_echo");
  if (echoMode === "chaos") faults.push("over_echo");

  // 四大原海报准则单真源判定
  const passBalance =
    !faults.includes("axis_skew") &&
    !faults.includes("imbalance");

  const passDivision =
    !faults.includes("straddle") &&
    !faults.includes("crowded") &&
    !faults.includes("center_clash") &&
    minQuadArea >= 0.145;

  const passContrast =
    !faults.includes("flat_contrast") &&
    !faults.includes("over_contrast");

  const passRelation =
    (echoMode === "diagonal" || echoMode === "cycle") &&
    !faults.includes("no_echo") &&
    !faults.includes("over_echo") &&
    (hasColorEcho || distinctTones >= 2);

  const score =
    (passBalance ? 1 : 0) +
    (passDivision ? 1 : 0) +
    (passContrast ? 1 : 0) +
    (passRelation ? 1 : 0);

  // 识别当前最优先的主诊断（白话讲清「为什么」与「下一步怎么做」）
  let primaryCode = "pass";
  let headline = "四象限成立：重心稳咬交点，分区、对比与呼应全部就位";
  let reason = `横竖分割落在 (${Math.round(ax * 100)}%, ${Math.round(ay * 100)}%)，视觉重心紧贴中心（仅偏 ${centerPct}%，示意）；四格各司其职且无越界，体量对比 ${weightRatio.toFixed(2)}×（示意）拉开清晰阅读次序，${echoMode === "diagonal" ? "对角回声" : "顺时针导引"}把四个象限缝成一张整体。`;
  let action = "可以继续拖动模块或轻推十字轴，试探不对称动态平衡的边界；或按 Space 启动视线巡航验真。";
  let shortTag = "四象限成立";

  if (faults.includes("straddle")) {
    primaryCode = "straddle";
    shortTag = `越界 ${straddleItems.length} 处`;
    headline = `有 ${straddleItems.length} 块元素横跨分割轴，象限边界糊成一片`;
    reason = `四象限构图的第一条纪律是「分区清楚」。此刻模块直接压穿${straddleItems[0].crossX ? "竖向" : "横向"}十字线，观者分不清它属于哪一区，十字轴从秩序骨架退化成了拦腰切断图形的杂线。`;
    action = "直接拖动带赤红虚线警告的越界模块回到所属象限内（或横拖画布移开中轴），先让四格干干净净。";
  } else if (faults.includes("center_clash")) {
    primaryCode = "center_clash";
    shortTag = "轴心压死";
    headline = "模块紧贴并压住中心交点圆核，十字呼吸口窒息";
    reason = "横竖交点是四象限的视觉枢纽，也是四股力量的缓冲圆心。元素直接挤在交点上会把四块空间粘成一团硬疙瘩，整幅构图失去「以中心为交点向四面展开」的清朗气场。";
    action = "把压住圆心的模块往各自象限腹地轻轻推开，给中心双环圆核留出呼吸净空。";
  } else if (faults.includes("crowded")) {
    primaryCode = "crowded";
    shortTag = `空区 ${emptyQuads.length} 格`;
    headline = `Q${emptyQuads[0] + 1} 象限完全空置，四象限退化成了缺角版面`;
    reason = `当前有 ${crowdedQuads.length} 个象限挤进多个模块，而 Q${emptyQuads.map((q) => q + 1).join("、Q")} 彻底落空。画面不再具备四个功能区的对位关系，整幅构图会像漏掉一只脚的桌子一样朝有内容那侧塌陷。`;
    action = "从拥挤象限里拖出一个模块放进空置象限，让四个象限各占其位。";
  } else if (faults.includes("axis_skew")) {
    primaryCode = "axis_skew";
    shortTag = `轴偏 ${Math.round(ax * 100)}/${Math.round(ay * 100)}`;
    headline = `十字交点偏离中心至 (${Math.round(ax * 100)}%, ${Math.round(ay * 100)}%)，最小象限被压剩 ${Math.round(minQuadArea * 100)}%`;
    reason = `最大象限膨胀到 ${Math.round(maxQuadArea * 100)}%，而对角象限被挤成仅 ${Math.round(minQuadArea * 100)}% 的窄缝。虽然四象限允许温和的非对称（经验值 40%–60% 区间），但轴心过度偏塌会让小象限丧失承载力。`;
    action = "在画布空白处左右横拖，或抓住中心双环圆核往画面中央 (42%–58%) 拉回。";
  } else if (faults.includes("imbalance")) {
    primaryCode = "imbalance";
    shortTag = `重心偏${leanDir}`;
    headline = `视觉重心向${leanDir}偏出 ${leanPct}%（示意），整幅画面在倾斜`;
    reason = `大面积深松绿或高饱和陶土赤集中在${leanDir}侧，杠杆力矩把视线死死拽向一边。鲁道夫·阿恩海姆指出，非对称四象限要想稳住，必须在对角象限放上高饱和点缀或足够面积的配重块。`;
    action = `单击偏轻一侧的模块增大体量或换成深松绿/陶土赤，或微调重块位置，把重心牵回轴心圆核附近。`;
  } else if (faults.includes("flat_contrast")) {
    primaryCode = "flat_contrast";
    const weightFlat = weightRatio < 1.55;
    shortTag = weightFlat
      ? `对比过平 ${weightRatio.toFixed(1)}×`
      : distinctShapes < 2
        ? "造型雷同"
        : "色阶单一";
    headline = weightFlat
      ? `四格体量与形色过于雷同（极差仅 ${weightRatio.toFixed(2)}×），僵成了表格`
      : `四格只有 ${distinctShapes} 种造型、${distinctTones} 种色阶，缺少形色节奏`;
    reason = `当前只有 ${distinctShapes} 种造型、${distinctTones} 种色阶（体量极差 ${weightRatio.toFixed(2)}×，示意）。四格缺少大小、形状与材质差异时，眼睛进画面后缺少阅读层次——这就是四象限最容易犯的「稳有余、僵如表格」毛病。`;
    action = "直接点击画布中的任意模块切换造型（实方 / 陶弧 / 实圆 / 竖纹 / 点阵），拉开形色与体量梯次。";
  } else if (faults.includes("over_contrast")) {
    primaryCode = "over_contrast";
    shortTag = `单块占 ${Math.round(maxShare * 100)}%`;
    headline = `单一重块吃掉 ${Math.round(maxShare * 100)}% 视觉权重（极差 ${weightRatio.toFixed(1)}×），其余三格沦为噪点`;
    reason = "对比需要梯次，但不能失控。当某一象限的体量超过全盘一半时，观者眼里只剩那一块孤立巨块，四象限的「并列对照与呼应」结构随之瓦解。";
    action = "点击巨块调小尺码或改用点阵/燕麦轻色，或适当加强对角象限的体量来接住它。";
  } else if (faults.includes("over_echo")) {
    primaryCode = "over_echo";
    shortTag = "连线杂乱";
    headline = "全向交叉线把四象限缠成蛛网，秩序反被噪音吞没";
    reason = "呼应不是把每个象限都用粗线互相绑死。过多对角与边线交叉会抢走主体和十字中轴的风头，眼睛在密密麻麻的箭头里来回打结。";
    action = "把关联呼应切回简洁的「对角回声」或「顺时针导引」，只留一条清晰的视线逻辑。";
  } else if (faults.includes("no_echo")) {
    primaryCode = "no_echo";
    shortTag = "孤岛断联";
    headline = "四个象限互不呼应，像四张无关卡片硬贴在同一页";
    reason = "十字线天生会把页面切开；如果不靠对角色彩回声或跨轴导引把四个区缝合起来，观者看完一格就停住，感受不到「整体关联」。";
    action = "点击底部或轴旁的「对角回声」或「顺时针导引」，用色彩回声与虚线导引把四格连成整体。";
  }

  // 四枚原海报探针实时状态
  const probes = [
    {
      id: "balance",
      zh: "平衡稳定",
      en: "BALANCE",
      pass: passBalance,
      badge: passBalance
        ? `重心稳 · 偏 ${centerPct}%`
        : faults.includes("axis_skew")
          ? `轴偏 ${Math.round(ax * 100)}/${Math.round(ay * 100)}`
          : `偏${leanDir} ${leanPct}%`,
      body: "四象限分布使视觉重心落在中心，形成稳定感。",
    },
    {
      id: "division",
      zh: "分区组织",
      en: "DIVISION",
      pass: passDivision,
      badge: passDivision
        ? `四格清 · ${quadAreas.map((a) => Math.round(a * 100)).join("/")}`
        : faults.includes("straddle")
          ? `越界 ${straddleItems.length} 处`
          : faults.includes("center_clash")
            ? "压住圆核"
            : faults.includes("crowded")
              ? `空置 Q${emptyQuads[0] + 1}`
              : `窄角 ${Math.round(minQuadArea * 100)}%`,
      body: "内容按象限分类放置，层级清晰，信息有序。",
    },
    {
      id: "contrast",
      zh: "对比变化",
      en: "CONTRAST",
      pass: passContrast,
      badge: passContrast
        ? `${weightRatio.toFixed(1)}× · ${distinctShapes}形${distinctTones}色`
        : faults.includes("over_contrast")
          ? `单块占 ${Math.round(maxShare * 100)}%`
          : weightRatio < 1.55
            ? `过平 ${weightRatio.toFixed(1)}×`
            : distinctShapes < 2
              ? "造型雷同"
              : "色阶单一",
      body: "通过大小、色彩、形状对比，增强视觉节奏与层次感。",
    },
    {
      id: "relation",
      zh: "关联呼应",
      en: "RELATION",
      pass: passRelation,
      badge: passRelation
        ? (echoMode === "diagonal" ? "对角回声成立" : "顺时针闭环")
        : echoMode === "chaos"
          ? "交叉过载"
          : "孤岛断联",
      body: "象限之间相互呼应，引导视线流动，形成整体关联。",
    },
  ];

  // 定性张力档位（与主诊断优先级一致，不造假精确百分比）
  let tensionTier = "松散断联";
  if (score === 4) {
    tensionTier = axisSkew > 0.03 ? "动态平衡" : "经典沉稳";
  } else if (faults.includes("straddle") || faults.includes("center_clash") || faults.includes("crowded") || faults.includes("over_echo")) {
    tensionTier = "秩序失控";
  } else if (faults.includes("imbalance") || faults.includes("axis_skew")) {
    tensionTier = "单侧倾覆";
  } else if (faults.includes("flat_contrast")) {
    tensionTier = "僵硬均质";
  } else if (faults.includes("over_contrast")) {
    tensionTier = "主次失衡";
  }

  return {
    ax,
    ay,
    gx,
    gy,
    quadAreas,
    maxQuadArea,
    minQuadArea,
    quadCounts,
    measured,
    straddleItems,
    clashItems,
    emptyQuads,
    crowdedQuads,
    weightRatio,
    maxShare,
    distinctShapes,
    distinctTones,
    scanOrder,
    cogFromCenter,
    cogFromAxis,
    axisSkew,
    leanDir,
    leanPct,
    centerPct,
    faults,
    passBalance,
    passDivision,
    passContrast,
    passRelation,
    score,
    primaryCode,
    shortTag,
    headline,
    reason,
    action,
    probes,
    tensionTier,
  };
}
