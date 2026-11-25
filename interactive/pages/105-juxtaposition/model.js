// 105 并置（JUXTAPOSITION）单一真源状态与力学模型
// 开场「双联中缝并置天平台」、全部读数、六柱原海报灯与各节数据共用本模块，杜绝画图与文字各算各的。

export const PALETTE = {
  paper: "#F5E8D8",
  paperLight: "#FAF4EB",
  paperSoft: "#FAF4EB",
  blushPaper: "#F6E2DF",
  rose: "#F1A3A6",
  roseSoft: "#EFA9AA",
  roseDot: "#E57F86",
  roseTri: "#DA7076",
  roseInk: "#9C303A",
  pine: "#2F483B",
  pineDeep: "#253A2F",
  pineDark: "#1B2822",
  ink: "#161817",
  fulcrum: "#181A1C",
  muted: "#535852",
  // 错态「各自同系」色（留在自己一侧，跨不过中缝）
  sameLeft: "#D98087",
  sameRight: "#4E6E5D",
  // 错态「各用异色」色（无关强撞，缺少共性桥梁）
  clashLeft: "#DFAD24",
  clashRight: "#4B86B8",
};

// 经验参考常量（全部在界面与读数中标明「经验参考值」）
export const THRESHOLDS = {
  gapMinPct: -1,      // 小于 -1% 判越缝混叠
  gapMaxPct: 11,      // 大于 11% 判中缝失联（滑入隔离）
  tiltMaxDeg: 2.2,    // 横梁倾角 ±2.2° 内判动态平衡成立
  tiltSnapDeg: 1.0,   // ±1.0° 内磁吸锁平
  maxVisualTilt: 7.5,
  minOffset: -0.05,   // 负值允许越过中缝，用来真实演示「越缝混叠」错态
  maxOffset: 0.20,
  minScale: 0.65,
  maxScale: 1.35,
};

export const SHAPES = {
  rect: { id: "rect", label: "直方", en: "RECT", density: 1.12, note: "硬朗直角，分量沉稳" },
  circle: { id: "circle", label: "柔圆", en: "CIRCLE", density: 0.95, note: "饱满曲线，轻盈向心" },
  tri: { id: "tri", label: "锐角", en: "TRI", density: 0.92, note: "斜边尖指，方向犀利" },
};

export const COLOR_MODES = {
  same: {
    id: "same",
    label: "各自同系",
    short: "同系",
    leftFill: PALETTE.sameLeft,
    rightFill: PALETTE.sameRight,
    leftWeight: 1.04,
    rightWeight: 0.88,
  },
  clash: {
    id: "clash",
    label: "各用异色",
    short: "异色",
    leftFill: PALETTE.clashLeft,
    rightFill: PALETTE.clashRight,
    leftWeight: 1.10,
    rightWeight: 1.02,
  },
  swap: {
    id: "swap",
    label: "互为底图",
    short: "互借",
    leftFill: PALETTE.pine,
    rightFill: PALETTE.roseSoft,
    leftWeight: 1.18,
    rightWeight: 0.94,
  },
};

// 初始状态刻意落在多料错版：同形直方 × 各自同系 × 宽沟隔断 × 左沉失衡（0/6）
export const INITIAL_HERO = Object.freeze({
  leftShape: "rect",
  rightShape: "rect",
  colorMode: "same",
  leftOffset: 0.125,   // 左形内边离中缝距离（占双联总宽比例）
  rightOffset: 0.115,  // 右形内边离中缝距离（两者相加 = 24% 宽沟）
  rightScale: 0.72,    // 右形偏小，与左侧力臂/密度形成明显左倾
});

// 105 原海报六大要点（原文照引）
export const POSTER_PILLARS = [
  { id: "adjacency", side: "left", title: "邻接", en: "ADJACENCY", body: "空间上的靠近 引发视觉关注" },
  { id: "contrast", side: "left", title: "对照", en: "CONTRAST", body: "色彩·形状·质感 形成明确差异" },
  { id: "tension", side: "left", title: "冲突", en: "TENSION", body: "差异带来张力 激发视觉能量" },
  { id: "dialogue", side: "right", title: "对话", en: "DIALOGUE", body: "元素相互回应 形成视觉交流" },
  { id: "connection", side: "right", title: "关联", en: "CONNECTION", body: "并置中寻找共性 建立意义桥梁" },
  { id: "balance", side: "right", title: "平衡", en: "BALANCE", body: "在对立中达成 动态的视觉平衡" },
];

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一几何计算：坐标系以双联高度 H=1、总宽 W=1.24 为基准，中缝在 x=0，左联 [-0.62, 0]，右联 [0, 0.62]
export const DIPTYCH_W = 1.24;
export const DIPTYCH_H = 1.0;

function shapeBox(shapeId, scale) {
  if (shapeId === "rect") {
    const w = 0.33 * scale;
    const h = 0.48 * scale;
    return { w, h, area: w * h, centroidFromInner: w * 0.5 };
  }
  if (shapeId === "circle") {
    const r = 0.238 * scale;
    return { w: r * 2, h: r * 2, r, area: Math.PI * r * r, centroidFromInner: r };
  }
  // tri：面向中缝倾斜的尖角三角，视觉重心偏底边
  const w = 0.35 * scale;
  const h = 0.48 * scale;
  return { w, h, area: 0.5 * w * h, centroidFromInner: w * 0.52 };
}

export function evaluateHero(state) {
  const leftOffset = clamp(state.leftOffset, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  const rightOffset = clamp(state.rightOffset, THRESHOLDS.minOffset, THRESHOLDS.maxOffset);
  const rightScale = clamp(state.rightScale, THRESHOLDS.minScale, THRESHOLDS.maxScale);
  const leftScale = 1.0;

  const lMeta = SHAPES[state.leftShape] || SHAPES.rect;
  const rMeta = SHAPES[state.rightShape] || SHAPES.rect;
  const cMeta = COLOR_MODES[state.colorMode] || COLOR_MODES.same;

  const lBox = shapeBox(lMeta.id, leftScale);
  const rBox = shapeBox(rMeta.id, rightScale);

  // 内边缘坐标（相对中缝 x=0）
  const leftInnerX = -leftOffset * DIPTYCH_W;
  const rightInnerX = rightOffset * DIPTYCH_W;

  // 防止外缘戳出双联画框外：在绘制与力矩里同步约束
  const halfW = DIPTYCH_W * 0.5;
  const maxLeftCx = -0.02;
  const minLeftCx = -halfW + lBox.w * 0.5 + 0.035;
  const rawLeftCx = leftInnerX - lBox.centroidFromInner;
  const leftCx = clamp(rawLeftCx, minLeftCx, maxLeftCx);

  const minRightCx = 0.02;
  const maxRightCx = halfW - rBox.w * 0.5 - 0.035;
  const rawRightCx = rightInnerX + rBox.centroidFromInner;
  const rightCx = clamp(rawRightCx, minRightCx, maxRightCx);

  // 反算实际贴合后的内边位置与中缝间距（占双联总宽百分比）
  const actualLeftInner = leftCx + lBox.centroidFromInner;
  const actualRightInner = rightCx - rBox.centroidFromInner;
  // 若圆形恰好贴近中缝（像 105 原海报的微切圆），给一点优雅贴缝余量
  const seamGapUnits = actualRightInner - actualLeftInner;
  const gapPct = Math.round((seamGapUnits / DIPTYCH_W) * 100);

  // 经验视觉重量与支点力矩计算
  const leftWeight = lBox.area * lMeta.density * cMeta.leftWeight;
  const rightWeight = rBox.area * rMeta.density * cMeta.rightWeight;
  const leverL = Math.max(0.08, Math.abs(leftCx));
  const leverR = Math.max(0.08, Math.abs(rightCx));
  const momentL = leftWeight * (0.34 + leverL);
  const momentR = rightWeight * (0.34 + leverR);

  const rawTilt = ((momentR - momentL) / (momentR + momentL)) * 30;
  const clampedTilt = clamp(rawTilt, -THRESHOLDS.maxVisualTilt, THRESHOLDS.maxVisualTilt);
  const snapped = Math.abs(clampedTilt) <= THRESHOLDS.tiltSnapDeg;
  const tiltDeg = snapped ? 0 : +clampedTilt.toFixed(1);

  const overlapped = gapPct < THRESHOLDS.gapMinPct;
  const isolated = gapPct > THRESHOLDS.gapMaxPct;
  const adjacencyOk = !overlapped && !isolated;
  const diffShape = lMeta.id !== rMeta.id;
  const contrastOk = diffShape && cMeta.id !== "same";
  const tensionOk = adjacencyOk && contrastOk;
  const connectionOk = cMeta.id === "swap";
  const dialogueOk = adjacencyOk && diffShape && connectionOk;
  const balanceOk = Math.abs(clampedTilt) <= THRESHOLDS.tiltMaxDeg;

  const pillars = {
    adjacency: {
      ok: adjacencyOk,
      state: overlapped ? "warn" : isolated ? "warn" : "ok",
      value: overlapped ? `重叠 ${Math.abs(gapPct)}%` : `缝距 ${gapPct}%`,
    },
    contrast: {
      ok: contrastOk,
      state: contrastOk ? "ok" : "warn",
      value: !diffShape ? `${lMeta.label}×${rMeta.label}` : cMeta.id === "same" ? "同系发平" : `${lMeta.label}×${rMeta.label}`,
    },
    tension: {
      ok: tensionOk,
      state: tensionOk ? "ok" : "idle",
      value: tensionOk ? "跨缝带电" : "张力不足",
    },
    dialogue: {
      ok: dialogueOk,
      state: dialogueOk ? "ok" : "idle",
      value: dialogueOk ? "双向回应" : "各说各话",
    },
    connection: {
      ok: connectionOk,
      state: cMeta.id === "clash" ? "warn" : connectionOk ? "ok" : "idle",
      value: cMeta.id === "swap" ? "互借成桥" : cMeta.id === "clash" ? "四色割裂" : "缺少回声",
    },
    balance: {
      ok: balanceOk,
      state: balanceOk ? "ok" : "warn",
      value: snapped ? "0.0° 锁平" : `${tiltDeg > 0 ? "右沉 +" : "左沉 "}${tiltDeg.toFixed(1)}°`,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 严格优先级诊断：一次只讲清最关键的一条问题（和为什么）
  let diag;
  if (overlapped) {
    diag = {
      code: "overlap",
      kind: "err",
      badge: `越缝混叠 · ${passCount}/6`,
      title: `左右越过中缝互压 ${Math.abs(gapPct)}%，边界模糊了`,
      body: "并置依赖一条清晰的「中缝」让双方站稳各自立场。现在两形跨缝叠在一起，视觉效果滑向了层叠融合；把中缝拉距轨向右轻推，让它们在 0%–11% 经验带里贴近而不相压。",
    };
  } else if (isolated) {
    diag = {
      code: "isolated",
      kind: "err",
      badge: `中缝失联 · ${passCount}/6`,
      title: `跨缝空距 ${gapPct}%（经验贴缝带 0%–11%），两半断了联系`,
      body: "左右主体退得太靠边，中缝变成了宽阔的隔离沟。大脑按格式塔邻近律会把它们当成两张独立画面来看，火花熄火了。先把下方拉距轨往左推，把两形拉近到中缝两侧。",
    };
  } else if (!diffShape) {
    diag = {
      code: "same-shape",
      kind: "err",
      badge: `同形复读 · ${passCount}/6`,
      title: `两边都是「${lMeta.label}」，只有平行摆放，没有对照与冲突`,
      body: "海报提醒「并列不只是摆放」。两个形状完全一致的块挨在一起，眼睛读到的只是复制重复，拉不出碰撞能量。把左形或右形换成不同几何（如直方配柔圆），差异立刻显现。",
    };
  } else if (cMeta.id === "same") {
    diag = {
      code: "same-tone",
      kind: "err",
      badge: `各自同系 · ${passCount}/6`,
      title: "粉待在粉里、绿留在绿里，明暗与色相跨不过中缝",
      body: "左形和右形都躲在各自底色的同系浅差里，第一眼抓不住焦点的对抗，彼此也没有色彩上的呼应。试着把跨缝配色切到「互为底图」，看看互借对方底色会发生什么。",
    };
  } else if (cMeta.id === "clash") {
    diag = {
      code: "clash-no-bridge",
      kind: "err",
      badge: `硬拼无桥 · ${passCount}/6`,
      title: "跳出原底的杂色确实刺眼，却拆掉了两边的共性桥梁",
      body: "明黄与冷蓝虽然制造了强烈冲突，但和粉绿双底毫无血缘关系——四块颜色各自抢戏，观众读不出它们为何被放在一起。把配色改回「互为底图」，让差异背后长出一条共色纽带。",
    };
  } else if (!balanceOk) {
    const heavySide = clampedTilt < 0 ? "左" : "右";
    const lightSide = clampedTilt < 0 ? "右" : "左";
    const hint = clampedTilt < 0
      ? "把「右形配重」调大一点（或把右形略往外移增加力臂），用面积补偿浅色柔形的视觉分量。"
      : "把「右形配重」略调小一点（或把右形收近中缝减短力臂），别让右侧反压过头。";
    diag = {
      code: "unbalanced",
      kind: "err",
      badge: `天平倾倒 · ${passCount}/6`,
      title: `横梁向${heavySide}压沉 ${Math.abs(tiltDeg).toFixed(1)}°（经验平衡带 ±2.2°）`,
      body: `深色直角块天生比浅色曲面显得更重，现在${heavySide}侧力矩压过了${lightSide}侧，画面看起来像一头沉的断案，而非平等对话。${hint}`,
    };
  } else {
    diag = {
      code: "ok",
      kind: "ok",
      badge: "六柱全亮 · 6/6 成立",
      title: `紧缝 ${gapPct}% · ${lMeta.label}对${rMeta.label} · 互借成桥 · 横梁稳平`,
      body: "四个条件在中缝同时扣紧：空间足够近让眼睛跨缝来回扫视，形与明暗足够异拉开冲突，互借底色锁死关联桥梁，视觉配平则让对立的两端像天平一样在动态里稳住——这就是「1+1 生出第三层意义」的瞬间。",
    };
  }

  return {
    left: { shape: lMeta.id, cx: leftCx, cy: 0, box: lBox, fill: cMeta.leftFill, weight: leftWeight },
    right: { shape: rMeta.id, cx: rightCx, cy: 0, box: rBox, fill: cMeta.rightFill, weight: rightWeight },
    leftOffset,
    rightOffset,
    rightScale,
    colorMode: cMeta.id,
    gapPct,
    seamGapUnits,
    tiltDeg,
    rawTiltDeg: +clampedTilt.toFixed(1),
    snapped,
    weightRatio: +(rightWeight / Math.max(0.001, leftWeight)).toFixed(2),
    pillars,
    passCount,
    diag,
  };
}

// ---------- 01 节：库里肖夫式「换右图，左图变义」 ----------
export const MEANING_PAIRS = [
  {
    id: "soup",
    tag: "配对 01",
    rightTitle: "一碗热汤",
    rightEn: "A BOWL OF SOUP",
    emerged: "渴望与饥饿",
    emergedEn: "HUNGER & LONGING",
    explain: "左侧无表情侧影一个像素都没动，但热气与碗沿一贴上中缝，观众的大脑立刻把这份沉默读成「盯住食物的饥饿与期盼」。",
    note: "呼应库里肖夫 1918–1920 年的经典剪辑实验：同一段演员面孔接上热汤镜头，观众盛赞其演活了饥肠辘辘。",
  },
  {
    id: "chair",
    tag: "配对 02",
    rightTitle: "空椅与枯枝",
    rightEn: "EMPTY CHAIR & BRANCH",
    emerged: "追思与失落",
    emergedEn: "GRIEF & ABSENCE",
    explain: "把右侧换成空荡的椅背与落叶枯枝，左侧同一条低垂的肩颈轮廓立刻染上哀伤——眼睛把「留白」和「凝视」连成了怀念。",
    note: "情绪并非画在脸或形体内部，而是在两个画面相遇的接缝处被观者主动补全。",
  },
  {
    id: "bloom",
    tag: "配对 03",
    rightTitle: "盛放花枝",
    rightEn: "BLOOMING STEM",
    emerged: "温柔与停驻",
    emergedEn: "TENDERNESS & PAUSE",
    explain: "当轻盈舒展的粉红花瓣靠拢中缝，左侧深色剪影不再显得沉重孤单，反倒化作安静欣赏生机的片刻松弛。",
    note: "暖粉与深松绿的互照让右侧的生命感反向照亮了左侧的静默。",
  },
  {
    id: "clock",
    tag: "配对 04",
    rightTitle: "倾颓时钟",
    rightEn: "TILTED CLOCK",
    emerged: "焦灼与倒计时",
    emergedEn: "URGENCY & PRESSURE",
    explain: "斜切的刻度盘与急促射线一并列，左侧原本平静的侧影瞬间变得紧绷——观众感觉人物正在被时间逼到墙角。",
    note: "斜线动势跨过中缝注入静态侧影，这正是平面海报常用的叙事张力手法。",
  },
];

// ---------- 02 节：可核实的历史脉络 ----------
export const HISTORY_NODES = [
  {
    id: "kuleshov",
    year: "1918–1920",
    name: "列夫·库里肖夫",
    en: "LEV KULESHOV · MOSCOW",
    title: "同一张脸，三种情绪",
    body: "苏联导演兼理论家列夫·库里肖夫在莫斯科电影学院做过一次著名剪辑实验：把演员伊万·莫兹尤辛（Ivan Mozzhukhin）同一段无表情近景，分别与热汤、棺木、沙发上的女子剪接并置。观众毫无察觉面孔未变，竟分别读出饥饿、悲恸与渴望——这就是电影史上的「库里肖夫效应」。",
    takeaway: "核心启示：意义不单躲在单个画面里，而是从两个画面的并列关系里凭空生出来。",
  },
  {
    id: "wertheimer",
    year: "1923",
    name: "马克斯·韦特海默",
    en: "MAX WERTHEIMER · PSYCHOLOGISCHE FORSCHUNG",
    title: "邻近律：靠近即关系",
    body: "格式塔心理学奠基人马克斯·韦特海默在《心理学研究》（Psychologische Forschung，第 4 卷，301–350 页）发表《格式塔理论研究（二）》，正式总结知觉组织规律。其中「邻近律」指出：空间里距离相近的元素，会被大脑自动编为同一组、默认存在内在关联。",
    takeaway: "核心启示：105 号海报第一条「邻接——空间上的靠近引发视觉关注」，底座正是邻近律。",
  },
  {
    id: "warburg",
    year: "1924–1929",
    name: "阿比·瓦尔堡",
    en: "ABY WARBURG · BILDERATLAS MNEMOSYNE",
    title: "黑布展板上的无字图像学",
    body: "德国艺术史家阿比·瓦尔堡在生命最后五年编纂《记忆女神图集》：在 63 块绷着黑麻布的大木框上，把近千张跨越两千年的雕像照片、壁画、邮票与报纸剪影直接并置钉排，几乎不加文字说明。他把图像之间的缝隙称为「思考的间隔空间」，让跨时代的视觉呼应自己开口。",
    takeaway: "核心启示：高明的并置不只是平面配色技巧，还是一种脱离线性文字的视觉论证方法。",
  },
  {
    id: "eisenstein",
    year: "1929",
    name: "谢尔盖·爱森斯坦",
    en: "SERGEI EISENSTEIN · FILM FORM",
    title: "碰撞相乘，而非简单相加",
    body: "库里肖夫的学生谢尔盖·爱森斯坦在 1929 年文章《电影原理与表意文字》（后收入《电影形式》）中提出「冲突蒙太奇」。他借汉字会意字「水＋目＝泪」「门＋耳＝闻」说明：两个具体图像并置不是 1+1=2 的拼砖，而是剧烈碰撞后炸出原本不存在的抽象新概念。",
    takeaway: "核心启示：这就是 105 号海报把「冲突（TENSION）」列为核心动力的由来——没有差异碰撞，就炸不出新意。",
  },
  {
    id: "berger-dondis",
    year: "1972–1973",
    name: "约翰·伯格 / 唐妮丝·唐迪斯",
    en: "WAYS OF SEEING · VISUAL LITERACY",
    title: "进入大众阅读与设计教材",
    body: "1972 年，约翰·伯格在 BBC 电视片与企鹅平装书《观看之道》（Ways of Seeing）中辟出整章纯图片视觉论文，把古典欧洲油画与当代杂志广告跨页并置，一字不写就揭穿了消费影像对传统油画构图的继承；次年 1973 年，唐妮丝·唐迪斯在 MIT 出版社的《视觉素养入门》里将并置写入视觉句法基础教材。",
    takeaway: "核心启示：并置从此走出先锋电影与艺术史，成为海报、杂志跨页与现代界面的日常修辞。",
  },
];

// ---------- 03 节：中缝尺度阈值模型（经验参考值） ----------
export function evaluateSeamZone(gapPct) {
  const g = clamp(Math.round(gapPct), 0, 28);
  if (g <= 1) {
    return {
      gapPct: g,
      zone: "kiss",
      badge: "零缝紧咬 · 强冲突",
      eyeHop: "高频往返（示意）",
      groupStrength: "极强合一",
      desc: "像 105 号原海报的零缝硬切：左粉右绿直接贴面相撞，差异能量最高，视觉张力一步拉满。适合观点鲜明的海报封面或戏剧化对照，但用于多字信息页时边缘容易显得紧张。",
    };
  }
  if (g <= 6) {
    return {
      gapPct: g,
      zone: "sweet",
      badge: "呼吸细缝 · 经验甜区",
      eyeHop: "顺畅跨缝对照（示意）",
      groupStrength: "清晰成对",
      desc: "经验参考 2%–6% 的细中缝：给左右主体留出一点完整边缘，又牢牢锁在格式塔邻近分组范围内。杂志双页对比、产品前后改造、双方案并排大多落在这个区间。",
    };
  }
  if (g <= 14) {
    return {
      gapPct: g,
      zone: "loose",
      badge: "松弛过渡 · 对话减弱",
      eyeHop: "视线开始滞留单侧（示意）",
      groupStrength: "弱关联",
      desc: "缝宽拉到 7%–14% 后，单纯靠距离已经拉不住两边了。除非像 105 原海报那样保留强色彩互借或贯穿底线做桥梁，否则读者很容易看完左边就忘了和右边对照。",
    };
  }
  return {
    gapPct: g,
    zone: "isolated",
    badge: "隔断成岛 · 滑入隔离",
    eyeHop: "各自独立扫视（示意）",
    groupStrength: "分组解体",
    desc: "缝宽超过经验阈值 15%，空白本身变成了厚墙。大脑不再强行把两块合读成一句对照，每块各自成为孤立主角——这已经走出「并置」，进入了 106 号「隔离原则」的领地。",
  };
}

// ---------- 04 节：四种实战并置骨架 ----------
export const PATTERNS = [
  {
    id: "before-after",
    label: "今昔前后对照",
    en: "BEFORE × AFTER",
    scene: "空间改造 / 交互改版 / 修复对比",
    bridge: "完全锁死的同机位画框与地平线",
    tension: "同一位置的荒芜暗调 vs 焕新暖亮",
    desc: "前后对比最怕两边换了视角。把取景框、比例和基准线完全锁成「共性桥梁」，读者才会把全部注意力投向发生变化的那个局部。",
  },
  {
    id: "editorial-split",
    label: "双栏立场对话",
    en: "EDITORIAL DIPTYCH",
    scene: "杂志跨页 / 双方案对比 / 观点辩论",
    bridge: "统一基线、等高顶眉与互借主色",
    tension: "左浅底深字 vs 右深底浅字的视觉反转",
    desc: "当页面只有两个平等选项或两种立场，用粉绿/明暗反转直接切开左右领地，读者扫一眼就懂「这是二选一的对话」，不必靠大段导语解释。",
  },
  {
    id: "visual-metaphor",
    label: "跨界隐喻海报",
    en: "VISUAL METAPHOR",
    scene: "公益海报 / 电影主视觉 / 品牌主张",
    bridge: "沿中缝无缝接续的轮廓线（如树干接条码）",
    tension: "有机自然质感 × 工业标尺几何的剧烈跨界",
    desc: "把两个本不沾边的物象拼在同一条中轴线上：轮廓共性骗过眼睛把它们接成一体，材质与概念的反差再在脑中引爆隐喻。",
  },
  {
    id: "image-copy",
    label: "图文反向互注",
    en: "IMAGE × COPY FRICTION",
    scene: "社论配图 / 展览主标 / 反讽传播",
    bridge: "严整对称的中缝排布与克制留白",
    tension: "柔和圆润的图形情绪 × 锋利冷静的文字断言",
    desc: "并置不限于图配图。当左侧图像温柔静谧、右侧标题却犀利发问，图文之间的落差本身就构成了强有力的第三层语义。",
  },
];

// ---------- 05 节：什么时候别用并置 ----------
export const ANTI_CASES = [
  {
    id: "crowd",
    title: "三方以上同时硬撞",
    en: "OVERLOADED CLASH",
    wrongLabel: "错版：四块齐吼",
    rightLabel: "改法：排主次层级",
    wrongText: "并置最锋利的是「一对一」双极对话。把 4 个同等面积、同等强对比的色块并排塞满，冲突彼此抵消，页面瞬间变成抢戏大杂烩。",
    rightText: "超过两个平等重点时，停用均分并置——挑出一个主角放大，其余退成次要陪衬，交给「视觉层级」与「主次关系」来排座次。",
  },
  {
    id: "random",
    title: "毫无共性的生硬拼贴",
    en: "FORCED ADJACENCY",
    wrongLabel: "错版：硬塞两样",
    rightLabel: "改法：搭桥或拆开",
    wrongText: "左边放咖啡豆特写、右边放财务折线图，既没有色彩呼应也没有轮廓衔接——观者只会怀疑排错了版，不会觉得这是高明隐喻。",
    rightText: "先问自己：两边靠什么扣在一起？找不出共享的形状、色系或问题线索，就别硬并置；要么搭出共性桥梁，要么坦荡分行分开。",
  },
  {
    id: "single-fact",
    title: "单一静赏或操作确认",
    en: "FALSE EQUIVALENCE",
    wrongLabel: "错版：强造对立",
    rightLabel: "改法：单主隔离留白",
    wrongText: "一件只需安静欣赏的作品、或一条严肃的操作确认弹窗，硬在旁边配个强烈反差块，只会平白制造焦虑或「虚假等价」。",
    rightText: "不需要比较、不需要戏剧冲突的场景，直接让主角独自站在干净留白里呼吸——交给「隔离原则」或「平衡原则」更妥帖。",
  },
];

// ---------- 06 节：单变量练习题 ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    ok: false,
    variable: "仅中缝拉宽（缺邻接）",
    tag: "方案 A · 中缝断裂",
    explain: "形制对照、互借底色与天平重量都对了，唯独把左右主体推到了外侧边缘（中缝空沟 26%）。视线跨不过中间的断层，并置退化成了各看各的两张孤图。",
  },
  {
    id: "B",
    ok: false,
    variable: "仅左重右轻（缺平衡）",
    tag: "方案 B · 天平左倾",
    explain: "中缝够近、方圆与色反互借也齐全，但左侧深绿直方面积过大、右侧浅粉圆环缩得太小。视觉重心整块压向左半边，对立对话变成了「主图附带小注脚」的失衡版面。",
  },
  {
    id: "C",
    ok: true,
    variable: "四条件齐备（成立）",
    tag: "方案 C · 并置成立",
    explain: "正确！木刻直方与电路圆环在中缝紧密相对（邻接），硬朗方直与有机圆弧拉开清晰差异（对照与冲突），双方互借对方粉绿底色扣成一体（关联桥梁），且浅粉圆略扩体量补偿深绿直方重量，在支点上稳住动态平衡。",
  },
  {
    id: "D",
    ok: false,
    variable: "仅放弃互借色（缺关联）",
    tag: "方案 D · 缺共性桥",
    explain: "中缝、方圆与重量都没毛病，但左右主体丢掉了「互为底图」的共色纽带，改用与粉绿双底毫无关系的明黄与冷蓝——冲突变成了四色互打的噪点，少了把两半锁成一句完整表达的桥梁。",
  },
];
