// Z 型扫描模式的核心状态、眼动轨迹与层级改写模型
// 所有节点坐标用画布内归一化比例 (u, v) ∈ [0.11, 0.89] 表示，画布渲染层与 DOM 手柄层共用同一份数据。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报图解",
    en: "POSTER DIAGRAM",
    note: "复刻 128 号原海报的四座几何锚点与同心注意力扩散环。",
    nodes: [
      { id: 1, zh: "顶部吸引", en: "LEAD", tag: "曝光", motif: "circle", sub: "首眼入口" },
      { id: 2, zh: "横向浏览", en: "TRANSIT", tag: "浏览", motif: "bars", sub: "快速承接" },
      { id: 3, zh: "对角落点", en: "FOCUS", tag: "聚焦", motif: "triangle", sub: "核心停留" },
      { id: 4, zh: "终点转化", en: "ACTION", tag: "行动", motif: "check", sub: "驱动决策" },
    ],
  },
  landing: {
    id: "landing",
    label: "落地页首屏",
    en: "LANDING HERO",
    note: "极简产品首屏：品牌锚点 → 精简入口 → 价值主述 → 高对比行动按钮。",
    nodes: [
      { id: 1, zh: "品牌钩子", en: "BRAND", tag: "LOGO", motif: "brand", sub: "KINETA 光学笔记" },
      { id: 2, zh: "轻导览", en: "NAV", tag: "入口", motif: "nav", sub: "功能 · 定价 · 登录" },
      { id: 3, zh: "核心卖点", en: "VALUE", tag: "聚焦", motif: "value", sub: "三分钟看清版面视线" },
      { id: 4, zh: "立即试用", en: "CTA", tag: "转化", motif: "cta", sub: "免费开始体验 →" },
    ],
  },
  event: {
    id: "event",
    label: "活动海报",
    en: "EVENT POSTER",
    note: "单主题展览或发售海报：主题名 → 时间地点 → 核心亮点 → 预约入口。",
    nodes: [
      { id: 1, zh: "主标曝光", en: "TITLE", tag: "主题", motif: "etitle", sub: "2026 平面视线展" },
      { id: 2, zh: "场次标牌", en: "DATE", tag: "信息", motif: "edate", sub: "11.24 · 上海西岸" },
      { id: 3, zh: "特邀议题", en: "TALK", tag: "聚焦", motif: "etalk", sub: "三场眼动公开课" },
      { id: 4, zh: "预约席位", en: "TICKET", tag: "行动", motif: "eticket", sub: "扫码锁定早鸟票 →" },
    ],
  },
};

// 标准 Z 型四角锚位（用于拖动靠近时的磁吸参考与「校准标准 Z」按钮）
export const DEFAULT_POSITIONS = [
  { u: 0.24, v: 0.25 },
  { u: 0.76, v: 0.25 },
  { u: 0.24, v: 0.75 },
  { u: 0.76, v: 0.75 },
];

// 原海报标本初始位：3 号内缩偏中，让对角线走不透
export const INITIAL_DRAFT_POSITIONS = [
  { u: 0.24, v: 0.25 },
  { u: 0.76, v: 0.25 },
  { u: 0.48, v: 0.58 },
  { u: 0.76, v: 0.75 },
];

// 三个标本各自预埋一处典型毛病，切标本即切三道不同诊断题
export const SCENE_PRESETS = {
  poster: {
    positions: INITIAL_DRAFT_POSITIONS,
    diagonalCue: true,
    distractor: false,
    weakCta: false,
  },
  landing: {
    positions: DEFAULT_POSITIONS,
    diagonalCue: true,
    distractor: false,
    weakCta: true,
  },
  event: {
    positions: DEFAULT_POSITIONS,
    diagonalCue: true,
    distractor: true,
    weakCta: false,
  },
};

export const SNAP_RADIUS = 0.058;
export const SNAP_HINT_RADIUS = 0.18;

export function getScenePreset(sceneId) {
  const p = SCENE_PRESETS[sceneId] || SCENE_PRESETS.poster;
  return {
    positions: p.positions.map((pt) => ({ ...pt })),
    diagonalCue: p.diagonalCue,
    distractor: p.distractor,
    weakCta: p.weakCta,
  };
}

export function createInitialState() {
  const init = getScenePreset("poster");
  return {
    scene: "poster",
    positions: init.positions,
    diagonalCue: init.diagonalCue,
    distractor: init.distractor,
    weakCta: init.weakCta,
    // 0..1 的模拟扫视进度；开场自动走一遍，也可由对角眼眸手柄拖动或点击朱红块重播控制
    gazeProgress: 1,
    replaying: false,
    replayClock: 0,
    activeNode: -1, // 0..3 或 -1
    scrubbing: false,
    pullBend: 0,
  };
}

export function clampCoord(val, min = 0.11, max = 0.89) {
  return Math.max(min, Math.min(max, val));
}

export function maybeSnap(index, u, v) {
  const def = DEFAULT_POSITIONS[index];
  const d = Math.hypot(u - def.u, v - def.v);
  if (d < SNAP_RADIUS) return { u: def.u, v: def.v, snapped: true };
  return { u: clampCoord(u), v: clampCoord(v), snapped: false };
}

export function isAtIdealAnchor(index, pos) {
  const def = DEFAULT_POSITIONS[index];
  return Math.hypot(pos.u - def.u, pos.v - def.v) <= SNAP_RADIUS * 1.15;
}

// 依据四点位置 + 三个实验开关，算出视线路径、结构特征、模型示意权重与人话诊断
export function analyzeLayout(state) {
  const [p1, p2, p3, p4] = state.positions;
  const distNode = { u: 0.5, v: 0.49 };

  // 1. 空间结构特征
  const topHorizontal = p2.u - p1.u > 0.26 && Math.abs(p2.v - p1.v) < 0.2;
  const diagSweep = p2.u - p3.u > 0.34 && p3.v - p2.v > 0.32;
  const botHorizontal = p4.u - p3.u > 0.26 && Math.abs(p4.v - p3.v) < 0.2;
  const allLeftCol = Math.max(p1.u, p2.u, p3.u, p4.u) < 0.52;
  const squashedY = Math.max(p3.v, p4.v) - Math.min(p1.v, p2.v) < 0.26;
  const reversedTop = p1.u > p2.u + 0.06;
  const reversedBot = p3.u > p4.u + 0.06;
  const invertedVert = (p1.v + p2.v) / 2 > (p3.v + p4.v) / 2 + 0.04;

  let overlap = false;
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      if (Math.hypot(state.positions[i].u - state.positions[j].u, state.positions[i].v - state.positions[j].v) < 0.16) {
        overlap = true;
      }
    }
  }

  // 2. 实际眼动路径点列
  let waypoints;
  if (state.distractor) {
    waypoints = [
      { ...p1, id: 1, kind: "node", label: "顶部吸引" },
      { ...distNode, id: 99, kind: "distractor", label: "中段干扰" },
      { ...p3, id: 3, kind: "node", label: "对角落点" },
      ...(state.weakCta ? [] : [{ ...p4, id: 4, kind: "node", label: "终点转化" }]),
    ];
  } else if (allLeftCol) {
    waypoints = state.positions
      .map((p, idx) => ({ ...p, id: idx + 1, kind: "node" }))
      .sort((a, b) => a.v - b.v);
  } else if (state.weakCta) {
    waypoints = [
      { ...p1, id: 1, kind: "node", label: "顶部吸引" },
      { ...p2, id: 2, kind: "node", label: "横向浏览" },
      { ...p3, id: 3, kind: "node", label: "对角落点" },
      {
        u: clampCoord(p3.u + (p4.u - p3.u) * 0.55, 0.12, 0.92),
        v: clampCoord(p3.v + 0.12, 0.12, 0.94),
        id: 0,
        kind: "exit",
        label: "滑出画外",
      },
    ];
  } else {
    waypoints = [
      { ...p1, id: 1, kind: "node", label: "顶部吸引" },
      { ...p2, id: 2, kind: "node", label: "横向浏览" },
      { ...p3, id: 3, kind: "node", label: "对角落点" },
      { ...p4, id: 4, kind: "node", label: "终点转化" },
    ];
  }

  // 3. 模型示意权重（基于阅读重力 + 几何展开度 + 终点对比补偿，合计 100%，界面标注为「模型示意」）
  const gravity = (p) => {
    const dTL = Math.hypot(p.u - 0.18, p.v - 0.2);
    return Math.max(0.35, 1.25 - dTL * 0.72);
  };

  const raw = [
    gravity(p1) * 1.18,
    gravity(p2) * (topHorizontal ? 0.92 : 0.65),
    gravity(p3) * (diagSweep ? 0.98 : 0.7) * (state.diagonalCue ? 1.08 : 0.84),
    gravity(p4) * (botHorizontal ? 1.26 : 0.74) * (state.weakCta ? 0.42 : 1.18) * (state.diagonalCue ? 1.04 : 0.86),
  ];

  const flags = {
    topHorizontal,
    diagSweep,
    botHorizontal,
    allLeftCol,
    squashedY,
    reversedTop,
    reversedBot,
    invertedVert,
    overlap,
  };

  if (state.distractor) {
    raw[1] *= 0.48;
    raw[3] *= 0.52;
    const rawSum = raw.reduce((a, b) => a + b, 0);
    const dRaw = rawSum * 0.54;
    const total = rawSum + dRaw;
    const distractorShare = Math.round((dRaw / total) * 100);
    const rem = 100 - distractorShare;
    const shares = raw.map((v) => Math.round((v / rawSum) * rem));
    shares[0] += rem - shares.reduce((a, b) => a + b, 0);
    return buildResult(state, waypoints, shares, distractorShare, flags);
  }

  const total = raw.reduce((a, b) => a + b, 0);
  const shares = raw.map((v) => Math.round((v / total) * 100));
  shares[0] += 100 - shares.reduce((a, b) => a + b, 0);

  return buildResult(state, waypoints, shares, 0, flags);
}

function buildResult(state, waypoints, shares, distractorShare, flags) {
  let status = "ok"; // ok | warn | broken
  let badge = "Z 轨贯通";
  let headline = "四站节拍完整，终点接住转化";
  let reason =
    "视线从左上 1 号起扫，横掠右上 2 号建立上下文，借中段留白与对角桥落回左下 3 号聚焦，最终被右下高对比 4 号稳稳接住。";

  if (state.distractor) {
    status = "broken";
    badge = "中段劫持";
    headline = "中心强干扰截断了横扫与对角节拍";
    reason = `正中的高饱和弹窗在模型示意里截走了 ${distractorShare}% 注意力：眼睛刚落进 1 号就被拉向画面中央，右上 2 号被大幅跳过，右下 4 号到达率明显跌落。`;
  } else if (flags.overlap) {
    status = "broken";
    badge = "节点挤撞";
    headline = "锚点间距过近，视线分不出先后";
    reason = "Z 型成立的前提是页面足够稀疏，让四个转折点各自拥有呼吸留白；节点撞在一起，眼睛会当作同一团信息处理，对角牵引随之消失。";
  } else if (flags.allLeftCol) {
    status = "warn";
    badge = "退化为 F 竖扫";
    headline = "元素全挤左侧，不再走 Z 字对角";
    reason = "四个锚点都贴在画幅左半边，视线失去了向右横扫的理由，顺着左缘一路垂直往下读——这正是文字密集页常见的 F 型扫读，而非 Z 型。";
  } else if (state.weakCta) {
    status = "warn";
    badge = "终点失焦";
    headline = "前三站走顺了，但第 4 站留不住人";
    reason = `右下 4 号缺少高对比色，示意权重跌到 ${shares[3]}%（退回 1 → 2 → 3 → 4 逐站衰减）。阅读重力本身在末端变弱，没有反差接住，视线看完 3 号便滑出画外。`;
  } else if (flags.invertedVert) {
    status = "broken";
    badge = "上下颠倒";
    headline = "终点跑到起点上方，逆着阅读重力走";
    reason = "横向阅读文化里视线习惯自上而下推进，下层锚点高于上层会让眼睛反复折返，打乱「先认知、后行动」的自然叙事顺序。";
  } else if (flags.reversedTop || flags.reversedBot) {
    status = "warn";
    badge = "横向逆流";
    headline = "横扫方向反拧，眼球多了一次折返";
    reason = "左向右语境里，顶边与底边横扫都默认从左进、往右出；左右锚点反拧会迫使眼球逆流回扫。";
  } else if (flags.squashedY) {
    status = "warn";
    badge = "纵深偏扁";
    headline = "上下两层贴太近，对角牵引拉不开";
    reason = "上下排间距压缩后，对角线接近水平，四点被压成一排横条，中段留不出让视线加速滑落的留白斜道。";
  } else if (!state.diagonalCue) {
    status = "warn";
    badge = "对角偏弱";
    headline = "缺少中段桥接，视线容易停在上半屏";
    reason = "顶部横扫结束后，2 号与 3 号之间缺少方向性视觉牵引，中段出现断层，视线容易停在上半屏不再下探。";
  } else if (!flags.topHorizontal || !flags.diagSweep || !flags.botHorizontal) {
    status = "warn";
    badge = "待诊断 · 路径偏斜";
    headline = "对角线太浅，3 号接不住视线";
    reason = "3 号缩在画面中段，2 → 3 的对角牵引走不透，3 → 4 的底边横扫也被截短，视线还没铺开就匆匆折向终点。";
  }

  return {
    status,
    badge,
    headline,
    reason,
    shares,
    distractorShare,
    waypoints,
  };
}

// 沿着折线路径按进度 t ∈ [0, 1] 插值出当前模拟眼动坐标、段名与示意时间
export function sampleGaze(waypoints, progress, pullBend = 0) {
  const t = Math.max(0, Math.min(1, progress));
  const simSec = (t * 1.8).toFixed(2);
  const ms = Math.round(t * 1800);
  if (waypoints.length < 2) {
    const p = waypoints[0] || { u: 0.2, v: 0.2 };
    return { u: p.u, v: p.v, ms, simSec, segIndex: 0, phase: "1 · 顶部吸引 · LEAD" };
  }

  const segs = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const len = Math.hypot(b.u - a.u, b.v - a.v) || 0.001;
    segs.push({ a, b, len });
    totalLen += len;
  }

  let target = t * totalLen;
  let segIndex = 0;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i].len || i === segs.length - 1) {
      segIndex = i;
      break;
    }
    target -= segs[i].len;
  }

  const s = segs[segIndex];
  const rawLocal = Math.max(0, Math.min(1, target / s.len));
  const eased = rawLocal < 0.5 ? 2 * rawLocal * rawLocal : 1 - Math.pow(-2 * rawLocal + 2, 2) / 2;

  let u = s.a.u + (s.b.u - s.a.u) * eased;
  let v = s.a.v + (s.b.v - s.a.v) * eased;

  if (segIndex === 1 && s.a.kind === "node" && s.b.kind === "node" && Math.abs(pullBend) > 0.001) {
    const midU = (s.a.u + s.b.u) / 2 + pullBend * 0.14;
    const midV = (s.a.v + s.b.v) / 2 + pullBend * 0.08;
    const inv = 1 - eased;
    u = inv * inv * s.a.u + 2 * inv * eased * midU + eased * eased * s.b.u;
    v = inv * inv * s.a.v + 2 * inv * eased * midV + eased * eased * s.b.v;
  }

  let phase = "1 · 顶部吸引 · LEAD";
  if (s.b.kind === "distractor" || s.a.kind === "distractor") {
    phase = "中段干扰 · 视线被劫持";
  } else if (s.b.kind === "exit" && rawLocal > 0.45) {
    phase = "终点失焦 · 滑出画外";
  } else if (t < 0.08) {
    phase = "1 · 顶部吸引 · LEAD";
  } else if (segIndex === 0) {
    phase = rawLocal > 0.8 ? "2 · 横向浏览 · TRANSIT" : "1 → 2 横向扫视";
  } else if (segIndex === 1) {
    phase = rawLocal > 0.82 ? "3 · 对角落点 · FOCUS" : "2 → 3 对角牵引 · PULL";
  } else {
    phase = rawLocal > 0.78 ? "4 · 终点转化 · ACTION" : "3 → 4 推向行动点";
  }

  return { u, v, ms, simSec, segIndex, phase, local: rawLocal };
}

// Section 02：层级改写实验统一档位模型（三档干扰 × 三档终点对比 + LTR/RTL 翻转，不造假精确百分比）
export const DISTRACT_TIERS = ["克制", "抢眼", "霸屏"];
export const CTA_TIERS = ["淡对比", "中对比", "高对比"];

export function computeHierarchyOverride({ distractTier, ctaTier, rtl }) {
  const dirLabel = rtl ? "右向左（RTL 镜像）" : "左向右（LTR 标准）";
  const startCorner = rtl ? "右上品牌" : "左上品牌";
  const endCorner = rtl ? "左下角" : "右下角";
  const dLabel = DISTRACT_TIERS[distractTier] || "克制";
  const cLabel = CTA_TIERS[ctaTier] || "高对比";

  if (distractTier === 2) {
    return {
      mode: "hijack",
      kicker: rtl ? "OVERRIDE · RTL SALIENCE HIJACK" : "OVERRIDE · SALIENCE HIJACK",
      title: "「霸屏」干扰直接劫持第一眼",
      desc: `中段推到「${dLabel}」档后，高饱和大色块的视觉显著性压过阅读重力：眼睛第一站直接扎向画心红色横幅，顶部品牌与导览被跳过，原本的 Z 轨被当场改写。`,
      first: "画心高饱和横幅（第 1 站劫持）",
      cta: ctaTier === 0 ? "双失守：既被劫持又末端失焦" : `${endCorner}绕远抵达，转化明显分流`,
      why: "大面积高饱和色块产生的显著性引力，远强于默认阅读惯性。",
      dirLabel,
      dLabel,
      cLabel,
    };
  }

  if (ctaTier === 0) {
    return {
      mode: "fade",
      kicker: rtl ? "OVERRIDE · RTL WEAK TERMINAL" : "OVERRIDE · WEAK TERMINAL",
      title: `终点落到「淡对比」，视线在 3 号撤离`,
      desc: `终点切到「${cLabel}」档后，${endCorner}按钮退化成浅灰虚框；前三站虽然顺畅，但读完第 3 站后找不到收口锚点，视线直接滑离页面。`,
      first: `${startCorner}（第 1 站）`,
      cta: `末端失焦（${endCorner}被当成脚注）`,
      why: "自然阅读重力到第 4 站已衰减，必须靠色彩或明度反差把终点重新抬起来。",
      dirLabel,
      dLabel,
      cLabel,
    };
  }

  if (distractTier === 1) {
    return {
      mode: "compete",
      kicker: rtl ? "FRICTION · RTL MID-CORRIDOR CLUTTER" : "FRICTION · MID-CORRIDOR CLUTTER",
      title: "「抢眼」横条挤占对角，扫视中途停顿",
      desc: `中段升到「${dLabel}」档后，促销条插进对角通道，眼球在 2 → 3 途中被强行拉偏停顿一次；虽然终点保持「${cLabel}」仍能收口，但一气呵成的节奏已经变慢。`,
      first: `${startCorner}（第 1 站，中段被分心）`,
      cta: ctaTier === 2 ? `${endCorner}延迟抵达（中段分流）` : `${endCorner}抵达偏弱（中段分心 + 终点偏平）`,
      why: "对角通道一旦塞进高对比装饰条，眼睛就得多做一次判断与回扫。",
      dirLabel,
      dLabel,
      cLabel,
    };
  }

  if (rtl) {
    return {
      mode: "rtl",
      kicker: "MIRRORED · RTL READING HABIT",
      title: "换作右向左阅读，Z 水平翻成反 Z",
      desc: `中段保持「${dLabel}」档、终点保持「${cLabel}」档。阿拉伯语、希伯来语等 RTL 读者从小形成自右向左的阅读惯性，NN/g 国际眼动研究显示其页面扫描同样水平镜像：起扫在右上，行动按钮应落在左下角。`,
      first: "右上品牌（镜像第 1 站）",
      cta: ctaTier === 2 ? "左下角稳稳命中（高对比收口）" : "左下角可达，但同色系反差偏平",
      why: "Z 型来自书写阅读习惯而非眼球结构，换了书写方向就必须整套镜像。",
      dirLabel,
      dLabel,
      cLabel,
    };
  }

  if (ctaTier === 1) {
    return {
      mode: "midcta",
      kicker: "FLAT TERMINAL · MEDIUM CONTRAST",
      title: "路线贯通，但「中对比」终点偏平",
      desc: `中段保持「${dLabel}」档让对角通道通畅，但终点落到「${cLabel}」档后与主色同系，缺少全页唯一的色相跳出，右下按钮更像普通信息卡而非明确行动指令。`,
      first: "左上品牌（第 1 站）",
      cta: "右下角可达，但收口号召力偏平",
      why: "第 4 站处在阅读重力末端，用全页唯一高对比色才能把决定门槛压到最低。",
      dirLabel,
      dLabel,
      cLabel,
    };
  }

  return {
    mode: "clean",
    kicker: "BALANCED · CONTROLLED HIERARCHY",
    title: "中段「克制」、终点「高对比」，Z 轨贯通",
    desc: `中段保持「${dLabel}」档、终点处于「${cLabel}」档，主标让出对角通道且没有异物抢戏，眼睛顺着 1 → 2 → 3 → 4 的节拍稳稳落进右下按钮。`,
    first: "左上品牌（第 1 站）",
    cta: "右下角稳稳命中（第 4 站）",
    why: "克制的中段留出对角通道，高对比终点把末端注意力重新收束。",
    dirLabel,
    dLabel,
    cLabel,
  };
}
