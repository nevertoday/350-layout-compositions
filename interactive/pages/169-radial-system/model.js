// 169 放射系统 · 单真源极坐标排印模型
// 所有实绘射线角度、长度、内圈清距、极向量重心、8 维徽章与 4 条设计提示全部由此唯一算出。

export const PALETTE = {
  bg: "#010A1E",
  surface: "#07152E",
  slot: "#0D1F40",
  line: "#1B5570",
  cyan: "#25CFE8",
  cyanHi: "#5EE5FA",
  cyanDim: "#154C64",
  rose: "#F064A0",
  roseHi: "#FF8CC0",
  roseDim: "#6E2448",
  gold: "#F1DDB4",
  goldHi: "#FAF0DA",
  goldDim: "#6B5F47",
  ink: "#EEF5FA",
  muted: "#9FB4C9",
  ok: "#3BE0A8",
  err: "#FF6B7B",
};

// 原海报 8 条核心原则（顺时针，自正上方 12 点开始，原话取自 poster-text.json）
export const PRINCIPLES = [
  {
    id: "center",
    zh: "中心",
    en: "CENTER",
    colorKey: "cyan",
    side: "left",
    slot: 0,
    idealDeg: -90,
    body: "所有要素围绕核心组织，确立视觉焦点，传递主要信息。",
  },
  {
    id: "focus",
    zh: "聚焦",
    en: "FOCUS",
    colorKey: "cyan",
    side: "right",
    slot: 0,
    idealDeg: -45,
    body: "通过大小、对比与间距变化，强化核心信息的吸引力。",
  },
  {
    id: "rhythm",
    zh: "节奏",
    en: "RHYTHM",
    colorKey: "rose",
    side: "right",
    slot: 1,
    idealDeg: 0,
    body: "重复与变化结合，形成节奏感，增强画面的动态与韵律。",
  },
  {
    id: "balance",
    zh: "均衡",
    en: "BALANCE",
    colorKey: "cyan",
    side: "right",
    slot: 2,
    idealDeg: 45,
    body: "虽向外扩展，仍保持整体平衡，避免失衡带来的视觉混乱。",
  },
  {
    id: "guide",
    zh: "引导",
    en: "GUIDE",
    colorKey: "rose",
    side: "right",
    slot: 3,
    idealDeg: 90,
    body: "利用放射线作为视线路径，引导观者从周边到中心，或由中心探索外延内容。",
  },
  {
    id: "scale",
    zh: "比例",
    en: "SCALE",
    colorKey: "cyan",
    side: "left",
    slot: 3,
    idealDeg: 135,
    body: "放射中的比例变化引导视线层层递进，增强纵深与秩序。",
  },
  {
    id: "hierarchy",
    zh: "层级",
    en: "HIERARCHY",
    colorKey: "gold",
    side: "left",
    slot: 2,
    idealDeg: 180,
    body: "沿放射方向建立清晰的层级关系，主次分明，信息更易理解。",
  },
  {
    id: "radiate",
    zh: "发散",
    en: "RADIATE",
    colorKey: "rose",
    side: "left",
    slot: 1,
    idealDeg: -135,
    body: "从中心向外延伸，引导视线自然扩散，营造空间感与张力。",
  },
];

// 原海报 4 大应用场景（对应底部 APPLICATIONS 四栏）
export const THEMES = {
  infographic: {
    id: "infographic",
    zh: "信息图表",
    en: "INFOGRAPHICS",
    coreZh: "放射系统",
    coreEn: "RADIAL SYSTEM",
    arcTop: "以中心为起点，向外有序展开，形成强有力的视觉结构。",
    arcBot: "FROM CENTER, TO OUTSIDE.",
    spokes: [
      { zh: "中心", en: "CENTER", colorKey: "cyan" },
      { zh: "聚焦", en: "FOCUS", colorKey: "cyan" },
      { zh: "节奏", en: "RHYTHM", colorKey: "rose" },
      { zh: "均衡", en: "BALANCE", colorKey: "cyan" },
      { zh: "引导", en: "GUIDE", colorKey: "rose" },
      { zh: "比例", en: "SCALE", colorKey: "cyan" },
      { zh: "层级", en: "HIERARCHY", colorKey: "gold" },
      { zh: "发散", en: "RADIATE", colorKey: "rose" },
    ],
  },
  dataviz: {
    id: "dataviz",
    zh: "数据可视化",
    en: "DATA VISUAL",
    coreZh: "节气星盘",
    coreEn: "POLAR CLIMATE",
    arcTop: "八个节气由圆心等角放射，射线长度直观映射降水强度。",
    arcBot: "POLAR AREA · SEASONAL DATA",
    spokes: [
      { zh: "立春 42mm", en: "SPRING", colorKey: "cyan" },
      { zh: "春分 68mm", en: "EQUINOX", colorKey: "cyan" },
      { zh: "立夏 115mm", en: "EARLY SUM", colorKey: "rose" },
      { zh: "夏至 164mm", en: "SOLSTICE", colorKey: "gold" },
      { zh: "立秋 128mm", en: "AUTUMN", colorKey: "rose" },
      { zh: "秋分 76mm", en: "HARVEST", colorKey: "cyan" },
      { zh: "立冬 49mm", en: "EARLY WIN", colorKey: "cyan" },
      { zh: "冬至 34mm", en: "WINTER", colorKey: "gold" },
    ],
  },
  branding: {
    id: "branding",
    zh: "品牌设计",
    en: "BRANDING",
    coreZh: "声浪电台",
    coreEn: "SONIC PULSE",
    arcTop: "所有声波脉冲向品牌核心回指，构成远距可辨的徽标张力。",
    arcBot: "IDENTITY · RADIANT MARK",
    spokes: [
      { zh: "清晨爵士", en: "MORNING", colorKey: "gold" },
      { zh: "午后合成", en: "SYNTH", colorKey: "cyan" },
      { zh: "独立民谣", en: "FOLK", colorKey: "rose" },
      { zh: "城市夜航", en: "NIGHT", colorKey: "cyan" },
      { zh: "环境白噪", en: "AMBIENT", colorKey: "gold" },
      { zh: "黑胶切片", en: "VINYL", colorKey: "rose" },
      { zh: "现场实录", en: "LIVE SET", colorKey: "cyan" },
      { zh: "午夜电音", en: "ELECTRO", colorKey: "rose" },
    ],
  },
  uinav: {
    id: "uinav",
    zh: "界面导航",
    en: "UI / NAVIGATION",
    coreZh: "快捷轮盘",
    coreEn: "PIE MENU",
    arcTop: "光标落于圆心，八项高频指令等距辐射，减少往返位移。",
    arcBot: "FITTS LAW · RADIAL COMMAND",
    spokes: [
      { zh: "复制", en: "COPY", colorKey: "cyan" },
      { zh: "旋转", en: "ROTATE", colorKey: "gold" },
      { zh: "缩放", en: "SCALE", colorKey: "rose" },
      { zh: "对齐", en: "ALIGN", colorKey: "cyan" },
      { zh: "裁剪", en: "CROP", colorKey: "rose" },
      { zh: "锁定", en: "LOCK", colorKey: "gold" },
      { zh: "导出", en: "EXPORT", colorKey: "cyan" },
      { zh: "撤销", en: "UNDO", colorKey: "rose" },
    ],
  },
};

export const POSTER_TIPS = [
  { id: "core", colorKey: "rose", lead: "确定核心", desc: "明确中心信息" },
  { id: "axes", colorKey: "cyan", lead: "建立轴线", desc: "规划放射方向" },
  { id: "contrast", colorKey: "gold", lead: "控制对比", desc: "强化主次关系" },
  { id: "rhythm", colorKey: "cyan", lead: "保持节奏", desc: "统一而不单调" },
];

export const normDeg = (d) => ((d % 360) + 360) % 360;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 根据 spread (0..1) 与 rotationDeg 计算 8 条射线的默认分布角度
// spread = 0.25..0.55 时向右下/左偏堆；spread = 1.0 时在 360° 上均匀分布（45° 一格）
export function anglesFromSpread(spread, rotationDeg, pattern = "full") {
  const s = clamp(spread, 0.2, 1);
  if (pattern === "twinfan") {
    // 对称双扇对衡解（上下留呼吸通道，左右两束严格向量对消）
    const base = [-155, -130, -105, -25, 0, 25, 130, 180];
    return base.map((a) => normDeg(a + rotationDeg));
  }
  // 线性插值：从半圆偏堆 [-45°, +145°]（张角 190°）平滑展开到整圆 360°（每 45° 一条，-90° 起）
  const out = [];
  for (let i = 0; i < 8; i++) {
    const clumped = -32 + (i / 7) * 188; // 仅占 188°，全部挤在右下半圆，左上方大空！
    const even = -90 + i * 45;
    // 最短路径插值
    const deg = clumped + (even - clumped) * ((s - 0.36) / (1 - 0.36));
    out.push(normDeg(deg + rotationDeg * (1 - Math.max(0, (s - 0.92) / 0.08)) + (s > 0.92 ? rotationDeg : 0)));
  }
  return out;
}

export function reachesForRhythm(mode) {
  if (mode === "uniform") return [0.79, 0.79, 0.79, 0.79, 0.79, 0.79, 0.79, 0.79];
  // 双臂递进螺旋：每半圈由短到长逐级递进，对向双臂互抵重心（单真源向量归零）
  if (mode === "spiral") return [0.62, 0.73, 0.84, 0.93, 0.62, 0.73, 0.84, 0.93];
  // alternating: 原海报主次长短交替
  return [0.92, 0.72, 0.90, 0.73, 0.91, 0.71, 0.89, 0.74];
}

export function tiersForRhythm(mode) {
  if (mode === "uniform") return [2, 2, 2, 2, 2, 2, 2, 2];
  if (mode === "spiral") return [0, 1, 1, 2, 0, 1, 1, 2];
  return [2, 1, 2, 1, 2, 1, 2, 1];
}

// 初始开场态：刻意停在 0/4 复合错态（半圆 188° 偏堆 + 内圈 18% 挤芯 + 左半圆倒立 + 等长齐刺 + 2 条脱心）
export function createInitialState(theme = "infographic") {
  const spread = 0.36;
  const rotationDeg = 16;
  return {
    theme,
    spread,
    rotationDeg,
    pattern: "full",
    spokeAngles: anglesFromSpread(spread, rotationDeg, "full"),
    spokeReaches: reachesForRhythm("uniform"),
    spokeTiers: tiersForRhythm("uniform"),
    hubRatio: 0.18, // 健康带 0.25..0.38；<0.24 挤芯，>0.42 空心脱节
    baselineMode: "continuous", // continuous(倒立错态) | autoFlip | horizontal
    rhythmMode: "uniform", // uniform(等长错态) | alternating | spiral
    aimMode: "offCenter", // offCenter(2条脱心) | converge
    selectedSpoke: -1,
  };
}

export const PRESETS = {
  poster: {
    label: "原海报八维解",
    kind: "good",
    apply(state) {
      return {
        ...state,
        spread: 1,
        rotationDeg: 0,
        pattern: "full",
        spokeAngles: [-90, -45, 0, 45, 90, 135, 180, -135].map(normDeg),
        spokeReaches: reachesForRhythm("alternating"),
        spokeTiers: tiersForRhythm("alternating"),
        hubRatio: 0.30,
        baselineMode: "autoFlip",
        rhythmMode: "alternating",
        aimMode: "converge",
      };
    },
  },
  twinfan: {
    label: "黄金双扇对衡解",
    kind: "good",
    apply(state) {
      return {
        ...state,
        spread: 0.94,
        rotationDeg: 0,
        pattern: "twinfan",
        spokeAngles: [-156, -124, -56, -24, 24, 56, 124, 156].map(normDeg),
        spokeReaches: [0.88, 0.72, 0.72, 0.88, 0.88, 0.72, 0.72, 0.88],
        spokeTiers: [2, 1, 1, 2, 2, 1, 1, 2],
        hubRatio: 0.31,
        baselineMode: "autoFlip",
        rhythmMode: "alternating",
        aimMode: "converge",
      };
    },
  },
  spiral: {
    label: "递进螺旋节奏解",
    kind: "good",
    apply(state) {
      return {
        ...state,
        spread: 1,
        rotationDeg: -15,
        pattern: "full",
        spokeAngles: [-105, -60, -15, 30, 75, 120, 165, 210].map(normDeg),
        spokeReaches: reachesForRhythm("spiral"),
        spokeTiers: tiersForRhythm("spiral"),
        hubRatio: 0.29,
        baselineMode: "horizontal",
        rhythmMode: "spiral",
        aimMode: "converge",
      };
    },
  },
  errClump: {
    label: "试错：半圆偏堆",
    kind: "bad",
    apply(state) {
      return {
        ...state,
        spread: 0.34,
        rotationDeg: 18,
        pattern: "full",
        spokeAngles: anglesFromSpread(0.34, 18, "full"),
        spokeReaches: reachesForRhythm("alternating"),
        spokeTiers: tiersForRhythm("alternating"),
        hubRatio: 0.30,
        baselineMode: "autoFlip",
        rhythmMode: "alternating",
        aimMode: "converge",
      };
    },
  },
  errSpiky: {
    label: "试错：等长刺球",
    kind: "bad",
    apply(state) {
      return {
        ...state,
        spread: 1,
        rotationDeg: 0,
        pattern: "full",
        spokeAngles: [-90, -45, 0, 45, 90, 135, 180, -135].map(normDeg),
        spokeReaches: reachesForRhythm("uniform"),
        spokeTiers: tiersForRhythm("uniform"),
        hubRatio: 0.29,
        baselineMode: "continuous",
        rhythmMode: "uniform",
        aimMode: "converge",
      };
    },
  },
  errHollow: {
    label: "试错：空心脱节",
    kind: "bad",
    apply(state) {
      return {
        ...state,
        spread: 1,
        rotationDeg: 0,
        pattern: "full",
        spokeAngles: [-90, -45, 0, 45, 90, 135, 180, -135].map(normDeg),
        spokeReaches: reachesForRhythm("alternating"),
        spokeTiers: tiersForRhythm("alternating"),
        hubRatio: 0.46,
        baselineMode: "autoFlip",
        rhythmMode: "alternating",
        aimMode: "converge",
      };
    },
  },
  reset: {
    label: "复原错态",
    kind: "reset",
    apply(state) {
      return createInitialState(state.theme);
    },
  },
};

// 单真源几何评估：从实绘 8 条射线极坐标计算所有指标、错误与建议
export function evaluate(state) {
  const theme = THEMES[state.theme] || THEMES.infographic;
  const hubR = clamp(state.hubRatio, 0.15, 0.50);

  // 1) 构建每条射线的精确极坐标几何
  const spokes = state.spokeAngles.map((rawDeg, i) => {
    const angleDeg = normDeg(rawDeg);
    const rad = (angleDeg * Math.PI) / 180;
    const reach = clamp(state.spokeReaches[i], Math.max(0.50, hubR + 0.14), 0.96);
    const tier = state.spokeTiers[i]; // 0 退隐, 1 次级, 2 强主
    const weight = tier === 2 ? 1.35 : tier === 1 ? 0.92 : 0.58;
    const aimOffsetDeg = state.aimMode === "offCenter" && (i === 2 || i === 5) ? (i === 2 ? 24 : -26) : 0;
    const inLeftHemisphere = Math.cos(rad) < -0.06;
    const inverted = state.baselineMode === "continuous" && inLeftHemisphere;
    const meta = theme.spokes[i] || THEMES.infographic.spokes[i];
    return {
      index: i,
      zh: meta.zh,
      en: meta.en,
      colorKey: meta.colorKey,
      color: PALETTE[meta.colorKey],
      angleDeg,
      rad,
      innerR: hubR,
      outerR: reach,
      armLen: Math.max(0.06, reach - hubR),
      tier,
      weight,
      aimOffsetDeg,
      offCenter: Math.abs(aimOffsetDeg) > 2,
      inLeftHemisphere,
      inverted,
      // 单位圆归一化坐标
      ux: Math.cos(rad),
      uy: Math.sin(rad),
    };
  });

  // 2) 相邻极角间隔（排序后查 8 个扇区空角）
  const sorted = spokes.map((s) => ({ i: s.index, a: s.angleDeg })).sort((a, b) => a.a - b.a);
  let minGapDeg = 360;
  let maxGapDeg = 0;
  let crowdedPairs = [];
  for (let k = 0; k < sorted.length; k++) {
    const cur = sorted[k];
    const nxt = sorted[(k + 1) % sorted.length];
    const gap = k === sorted.length - 1 ? 360 - cur.a + nxt.a : nxt.a - cur.a;
    if (gap < minGapDeg) minGapDeg = gap;
    if (gap > maxGapDeg) maxGapDeg = gap;
    if (gap < 23) crowdedPairs.push([cur.i, nxt.i, gap]);
  }
  const spanDeg = Math.round(360 - maxGapDeg);

  // 3) 极坐标加权视觉重心偏移（0% = 居中稳态，>14% = 失衡偏向）
  let sumX = 0;
  let sumY = 0;
  let sumW = 0;
  for (const s of spokes) {
    const moment = s.weight * (s.outerR - 0.15);
    sumX += s.ux * moment;
    sumY += s.uy * moment;
    sumW += moment;
  }
  const comX = sumW > 0 ? sumX / sumW : 0;
  const comY = sumW > 0 ? sumY / sumW : 0;
  const comDrift = Math.hypot(comX, comY); // 0..1
  const comDriftPct = Math.round(comDrift * 100);
  const comAngleDeg = normDeg((Math.atan2(comY, comX) * 180) / Math.PI);

  // 4) 节奏、对比与边界检测
  const reaches = spokes.map((s) => s.outerR);
  const reachRange = Math.max(...reaches) - Math.min(...reaches);
  const distinctTiers = new Set(spokes.map((s) => s.tier)).size;
  const primaryCount = spokes.filter((s) => s.tier === 2).length;
  const invertedCount = spokes.filter((s) => s.inverted).length;
  const offCenterCount = spokes.filter((s) => s.offCenter).length;

  // 8 类双向结构判定
  const flags = {
    choked: hubR < 0.24,
    hollow: hubR > 0.42,
    clumped: comDriftPct > 14 || maxGapDeg > 118,
    crowded: minGapDeg < 23,
    upsideDown: invertedCount > 0,
    offCenter: offCenterCount > 0,
    monotonous: reachRange < 0.09 && distinctTiers < 2,
    weakCore: primaryCount >= 7 && distinctTiers < 2,
  };

  // 收集具体问题清单（按视觉破坏力排序）
  const issues = [];
  if (flags.choked) {
    issues.push({
      id: "choked",
      tag: `挤芯 ${Math.round(hubR * 100)}%`,
      title: `内圈清距仅 ${Math.round(hubR * 100)}%，射线尾端撞进中心标题`,
      body: `放射系统的第一铁律是「先锁中心、再放射线」。当前内环半径被压到 ${Math.round(hubR * 100)}%，8 条射线紧勒着中央文字，视觉核心喘不过气，眼睛根本分不清哪块才是起点。`,
      action: "把「内圈清距」拉到 26%–36% 区间，给中央标题留出一圈清晰的暗场呼吸带。",
      fixLabel: "拉开内圈清距至 30%",
      fixKey: "hub",
    });
  }
  if (flags.hollow) {
    issues.push({
      id: "hollow",
      tag: `空心 ${Math.round(hubR * 100)}%`,
      title: `内圈撑到 ${Math.round(hubR * 100)}% 过大，圆心孤悬、射线被挤出边`,
      body: `内圈不是越大越好：半径超过 42% 后，中央标题与外围射线之间隔出大片真空，向心引力断裂，外侧文字也被挤贴画框边缘，原本的放射感退化成了空洞圆环。`,
      action: "把「内圈清距」收回至 28%–35%，让射线起点重新咬合中心核心。",
      fixLabel: "收回内圈清距至 30%",
      fixKey: "hub",
    });
  }
  if (flags.clumped) {
    issues.push({
      id: "clumped",
      tag: `偏心 ${comDriftPct}%`,
      title: `射线扎堆在 ${spanDeg}° 扇区，视觉重心偏离圆心 ${comDriftPct}%`,
      body: `目前最大空角高达 ${Math.round(maxGapDeg)}°，大半重量压在同一侧，整张轮盘像少了几根辐条的车轮一样往单侧倾覆。即便有圆心，观者视线也会直接滑出空缺侧。`,
      action: "直接在画布上向右横拖展开 360° 扇面，或拖拽单条射线填补空缺象限。",
      fixLabel: "一键展开 360° 均衡扇面",
      fixKey: "spread",
    });
  }
  if (flags.crowded) {
    issues.push({
      id: "crowded",
      tag: `撞车 ${Math.round(minGapDeg)}°`,
      title: `相邻射线最小夹角仅 ${Math.round(minGapDeg)}°，文字臂彼此打架`,
      body: `圆心附近弧长最窄，当相邻两条射线夹角低于 23° 时，排字基线在根部直接叠撞，读者既读不清字形，也失去清晰的视线引导通道。`,
      action: "拖动挤在一起的射线圆点拉开角度，或向右横拖画布均分极角。",
      fixLabel: "均分射线夹角至 45°",
      fixKey: "spread",
    });
  }
  if (flags.upsideDown) {
    issues.push({
      id: "upsideDown",
      tag: `倒立 ${invertedCount} 条`,
      title: `左半圆有 ${invertedCount} 条文字射线倒立，逼着读者歪头 180°`,
      body: `这是放射排印最容易踩的独门暗礁：顺着极角连续旋转文字，一旦跨过 90°–270° 左半圆，字头就会朝下倒扣。好看的几何角度绝不能拿阅读成本去换。`,
      action: "将基线朝向切为「自动翻正」或「水平横排」，让左半圆文字永远保持顺读。",
      fixLabel: "开启左半圆自动翻正",
      fixKey: "baseline",
    });
  }
  if (flags.offCenter) {
    issues.push({
      id: "offCenter",
      tag: `脱心 ${offCenterCount} 条`,
      title: `有 ${offCenterCount} 条射线延长线偏离圆心，焦点引力被拆散`,
      body: `放射系统的力量来自「万箭归心」。当部分射线按切线歪斜、延长线不再交汇于圆心时，观者潜意识会立刻察觉结构松脱，页面退化成杂乱的斜线拼贴。`,
      action: "把焦点指向切回「向心汇点」，让所有射线延长线严丝合缝穿过圆心。",
      fixLabel: "校准全部射线归心",
      fixKey: "aim",
    });
  }
  if (flags.monotonous || flags.weakCore) {
    issues.push({
      id: "monotonous",
      tag: "等长齐刺",
      title: "8 条射线等长同重，变成一团抢戏的刺球",
      body: "如果每条射线都拉满同样长度与最高权重，所有信息在圆周上同时呐喊，不但没有韵律和层次，反而把中央标题淹没在密密麻麻的尖刺里。",
      action: "切到「主次交替」或「递进螺旋」节奏，或直接点击画布上的单条射线降级为次级。",
      fixLabel: "建立 4+4 主次节奏",
      fixKey: "rhythm",
    });
  }

  // 4 条原海报 TIPS 实况灯（严格对应 poster-text.json 原话）
  const tipsStatus = [
    {
      ...POSTER_TIPS[0],
      ok: !flags.choked && !flags.hollow && !flags.weakCore,
      note: flags.choked ? `挤芯 ${Math.round(hubR * 100)}%` : flags.hollow ? `空心 ${Math.round(hubR * 100)}%` : flags.weakCore ? "外围抢主" : `核径 ${Math.round(hubR * 100)}%`,
    },
    {
      ...POSTER_TIPS[1],
      ok: !flags.clumped && !flags.crowded && !flags.offCenter,
      note: flags.offCenter ? `脱心 ${offCenterCount} 条` : flags.clumped ? `偏心 ${comDriftPct}%` : flags.crowded ? `撞角 ${Math.round(minGapDeg)}°` : `极偏 ${comDriftPct}%`,
    },
    {
      ...POSTER_TIPS[2],
      ok: distinctTiers >= 2 && !flags.weakCore,
      note: distinctTiers < 2 ? "全同权重" : `${primaryCount} 主 / ${8 - primaryCount} 次`,
    },
    {
      ...POSTER_TIPS[3],
      ok: !flags.monotonous && !flags.upsideDown,
      note: flags.upsideDown ? `倒立 ${invertedCount} 条` : flags.monotonous ? "等长齐刺" : "节奏顺读",
    },
  ];

  const passCount = tipsStatus.filter((t) => t.ok).length;

  // 8 枚原海报圆形徽章实时探针状态（每枚都从同一份 flags 导出！）
  const principleStates = {
    center: { ok: !flags.choked && !flags.hollow, badge: flags.choked ? "挤芯" : flags.hollow ? "空心" : `核径 ${Math.round(hubR * 100)}%` },
    focus: { ok: !flags.weakCore && !flags.choked, badge: flags.weakCore ? "喧宾夺主" : flags.choked ? "焦点受压" : "焦点锁定" },
    rhythm: { ok: !flags.monotonous && !flags.crowded, badge: flags.monotonous ? "等长单调" : flags.crowded ? "撞角乱拍" : "疏密有拍" },
    balance: { ok: !flags.clumped, badge: flags.clumped ? `重心偏 ${comDriftPct}%` : `均衡 ${comDriftPct}%` },
    guide: { ok: !flags.offCenter && !flags.upsideDown, badge: flags.offCenter ? "射线脱心" : flags.upsideDown ? "左半倒立" : "路径顺畅" },
    scale: { ok: reachRange >= 0.09 && !flags.hollow, badge: flags.hollow ? "比例断层" : reachRange < 0.09 ? "长短齐平" : `幅差 ${Math.round(reachRange * 100)}%` },
    hierarchy: { ok: distinctTiers >= 2 && !flags.weakCore, badge: distinctTiers < 2 ? "无主次级" : `${primaryCount} 主 ${8 - primaryCount} 次` },
    radiate: { ok: !flags.clumped && !flags.offCenter && !flags.hollow, badge: flags.clumped ? `仅 ${spanDeg}°` : flags.offCenter ? "发散失准" : `满环 ${spanDeg}°` },
  };

  // 成功时的多解识别
  let solutionName = "";
  if (issues.length === 0) {
    if (maxGapDeg >= 62 && maxGapDeg <= 118) solutionName = "双扇对衡解";
    else if (state.rhythmMode === "spiral") solutionName = "递进螺旋解";
    else solutionName = "八维均布解";
  }

  const primaryIssue = issues[0] || null;
  const verdict = primaryIssue
    ? {
        ok: false,
        badge: `${passCount}/4 · ${primaryIssue.tag}`,
        title: primaryIssue.title,
        body: primaryIssue.body,
        action: primaryIssue.action,
        fixLabel: primaryIssue.fixLabel,
        fixKey: primaryIssue.fixKey,
      }
    : {
        ok: true,
        badge: `4/4 · ${solutionName}`,
        title: `成立：${solutionName}——核心稳锁、重心归零、可读与节奏兼得`,
        body: `当前 8 条射线全部精准归心，极坐标重心偏移仅 ${comDriftPct}%，内圈清距 ${Math.round(hubR * 100)}% 为标题留出清晰呼吸环，且左半圆文字保持顺读。你也可以继续拖拽单条射线，试试把重心故意拽偏，观察系统如何预警。`,
        action: "试试切换另外两种合法解，或点「试错：空心脱节」感受过犹不及的另一端。",
        fixLabel: "",
        fixKey: "",
      };

  // 节拍态势档位（拒绝假精确百分比，给出清晰示意档位）
  let energyTier = "失衡散乱（示意）";
  if (issues.length === 0) {
    energyTier = maxGapDeg >= 62 ? "对衡聚光（示意）" : state.rhythmMode === "spiral" ? "螺旋递进（示意）" : "均布向心（示意）";
  } else if (flags.monotonous) {
    energyTier = "均质刺噪（示意）";
  } else if (flags.hollow) {
    energyTier = "空心失联（示意）";
  }

  return {
    theme,
    spokes,
    hubR,
    minGapDeg: Math.round(minGapDeg),
    maxGapDeg: Math.round(maxGapDeg),
    spanDeg,
    comX,
    comY,
    comDrift,
    comDriftPct,
    comAngleDeg: Math.round(comAngleDeg),
    reachRange,
    primaryCount,
    distinctTiers,
    invertedCount,
    offCenterCount,
    crowdedPairs,
    flags,
    issues,
    tipsStatus,
    passCount,
    principleStates,
    verdict,
    energyTier,
  };
}

// 响应诊单卡上的「一键修正当前首要问题」（每次只修当前排第一的问题，引导理解而非一键剧透）
export function applySingleFix(state, fixKey) {
  const next = { ...state };
  if (fixKey === "hub") {
    next.hubRatio = 0.30;
  } else if (fixKey === "spread") {
    next.spread = 1;
    next.rotationDeg = 0;
    next.pattern = "full";
    next.spokeAngles = [-90, -45, 0, 45, 90, 135, 180, -135].map(normDeg);
  } else if (fixKey === "baseline") {
    next.baselineMode = "autoFlip";
  } else if (fixKey === "aim") {
    next.aimMode = "converge";
  } else if (fixKey === "rhythm") {
    next.rhythmMode = "alternating";
    next.spokeReaches = reachesForRhythm("alternating");
    next.spokeTiers = tiersForRhythm("alternating");
  }
  return next;
}
