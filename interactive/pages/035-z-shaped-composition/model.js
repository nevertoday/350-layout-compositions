// 035 Z形构图 — 单真源几何与眼动跃迁模型
// 所有坐标统一采用画布归一化比例 u∈[0,1], v∈[0,1]。
// 画布渲染、白话诊单、刊头大Z倾角、底沿四栏实况框全部只读 evaluate(state) 的输出。

export const ROLES = {
  entry: {
    id: "entry",
    short: "入口",
    title: "视线流动",
    en: "EYE FLOW",
    idealSlot: 0,
    posterTag: "从左上角切入",
    jazzTitle: "JAZZ NIGHT",
    jazzSub: "城市爵士夜 · 入口大标",
    saasTitle: "LINEN NOTE",
    saasSub: "左上品牌识别标",
  },
  progress: {
    id: "progress",
    short: "递进",
    title: "信息递进",
    en: "PROGRESSIVE INFO",
    idealSlot: 1,
    posterTag: "右上承接 · 斜线深入",
    jazzTitle: "11.28 FRI",
    jazzSub: "音乐厅 20:00 · 场次导航",
    saasTitle: "功能 · 定价",
    saasSub: "右上轻量导览与登录",
  },
  pivot: {
    id: "pivot",
    short: "转折",
    title: "节奏转换",
    en: "RHYTHM SHIFT",
    idealSlot: 2,
    posterTag: "转折停顿 · 强化记忆",
    jazzTitle: "四重奏首演",
    jazzSub: "左下看点停顿与情绪铺垫",
    saasTitle: "离线即写",
    saasSub: "左下核心卖点与信任背书",
  },
  cta: {
    id: "cta",
    short: "终点",
    title: "叙事路径",
    en: "NARRATIVE PATH",
    idealSlot: 3,
    posterTag: "右下聚焦 · 促成行动",
    jazzTitle: "立即购票 ¥120",
    jazzSub: "右下扫码 / 购票终点",
    saasTitle: "免费试用 →",
    saasSub: "右下主行动按钮 CTA",
  },
};

export const SCENES = {
  poster: { id: "poster", label: "原海报四站" },
  jazz: { id: "jazz", label: "爵士夜海报" },
  saas: { id: "saas", label: "产品首屏" },
};

export const SLOT_NAMES = ["左上①", "右上②", "左下③", "右下④"];

// 经验参考带（并非物理常数，界面中均标明「经验带」或「示意」）
export const SPAN_MIN = 0.28;
export const SPAN_MAX = 0.86;
export const SPAN_GOOD_MIN = 0.54;
export const SPAN_GOOD_MAX = 0.82;

export const HSPAN_MIN = 0.32;
export const HSPAN_MAX = 0.70;
export const HSPAN_GOOD_MIN = 0.40;
export const HSPAN_GOOD_MAX = 0.66;

export const ANGLE_GOOD_MIN = 20;
export const ANGLE_GOOD_MAX = 60;
const DESIGN_ASPECT = 1.38;

// 开场默认 0/4 断流错态：绝不先给答案
export const INITIAL_STATE = {
  scene: "poster",
  span: 0.34,
  heightSpan: 0.56,
  roles: ["cta", "progress", "pivot", "entry"],
  bridge: false,
  distractor: true,
  weightMode: "graded",
  textLoad: "sparse",
  showGaze: true,
  selectedSlot: 0,
  offsets: [
    { du: 0, dv: 0 },
    { du: 0, dv: 0 },
    { du: 0, dv: 0 },
    { du: 0, dv: 0 },
  ],
};

// 多组合法解与主动试错态
export const PRESETS = {
  broken: { ...INITIAL_STATE, offsets: zeroOffsets() },
  classic: {
    scene: null,
    span: 0.68,
    heightSpan: 0.54,
    roles: ["entry", "progress", "pivot", "cta"],
    bridge: true,
    distractor: false,
    weightMode: "graded",
    textLoad: "sparse",
    showGaze: true,
    offsets: zeroOffsets(),
  },
  wide: {
    scene: null,
    span: 0.80,
    heightSpan: 0.44,
    roles: ["entry", "progress", "pivot", "cta"],
    bridge: true,
    distractor: false,
    weightMode: "graded",
    textLoad: "sparse",
    showGaze: true,
    offsets: zeroOffsets(),
  },
  compact: {
    scene: null,
    span: 0.58,
    heightSpan: 0.62,
    roles: ["entry", "progress", "pivot", "cta"],
    bridge: true,
    distractor: false,
    weightMode: "graded",
    textLoad: "sparse",
    showGaze: true,
    offsets: zeroOffsets(),
  },
  err7: {
    scene: null,
    span: 0.68,
    heightSpan: 0.54,
    roles: ["entry", "progress", "pivot", "cta"],
    bridge: false,
    distractor: false,
    weightMode: "graded",
    textLoad: "sparse",
    showGaze: true,
    offsets: zeroOffsets(),
  },
  errEqual: {
    scene: null,
    span: 0.68,
    heightSpan: 0.54,
    roles: ["entry", "progress", "pivot", "cta"],
    bridge: true,
    distractor: false,
    weightMode: "equal",
    textLoad: "sparse",
    showGaze: true,
    offsets: zeroOffsets(),
  },
  errDense: {
    scene: null,
    span: 0.68,
    heightSpan: 0.54,
    roles: ["entry", "progress", "pivot", "cta"],
    bridge: true,
    distractor: false,
    weightMode: "graded",
    textLoad: "dense",
    showGaze: true,
    offsets: zeroOffsets(),
  },
};

export function zeroOffsets() {
  return [
    { du: 0, dv: 0 },
    { du: 0, dv: 0 },
    { du: 0, dv: 0 },
    { du: 0, dv: 0 },
  ];
}

export function cloneState(s) {
  return {
    ...s,
    roles: [...s.roles],
    offsets: s.offsets.map((o) => ({ ...o })),
  };
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// 由 state 计算四站在画布中的实绘归一化坐标 (u, v)
export function computePoints(state) {
  const halfW = clamp(state.span, SPAN_MIN, SPAN_MAX) / 2;
  const halfH = clamp(state.heightSpan, HSPAN_MIN, HSPAN_MAX) / 2;
  const cx = 0.5;
  const cy = 0.51;
  const base = [
    { u: cx - halfW, v: cy - halfH }, // 0: TL
    { u: cx + halfW, v: cy - halfH }, // 1: TR
    { u: cx - halfW, v: cy + halfH }, // 2: BL
    { u: cx + halfW, v: cy + halfH }, // 3: BR
  ];
  return base.map((p, i) => {
    const o = state.offsets?.[i] || { du: 0, dv: 0 };
    return {
      u: clamp(p.u + o.du, 0.09, 0.91),
      v: clamp(p.v + o.dv, 0.14, 0.88),
      slot: i,
      role: state.roles[i],
    };
  });
}

// 计算四站视觉重量（示意半径倍数 0.72..1.28）
export function roleWeights(state) {
  return state.roles.map((r) => {
    if (state.weightMode === "equal") return 1.0;
    if (state.weightMode === "weak_end") {
      if (r === "cta") return 0.64;
      if (r === "entry") return 1.24;
      if (r === "progress") return 0.96;
      return 0.84;
    }
    // graded: 入口明快、中段轻快、终点扎实收口
    if (r === "entry") return 1.14;
    if (r === "progress") return 0.94;
    if (r === "pivot") return 0.98;
    return 1.22; // cta
  });
}

// 单真源核心求值：从实绘四点、权重、对角桥、干扰块与密度推出预测眼动路线与诊断
export function evaluate(state) {
  const pts = computePoints(state);
  const weights = roleWeights(state);
  const [p0, p1, p2, p3] = pts;

  // 实测水平跨度（上下两段均值）与垂直跨度
  const topSpan = p1.u - p0.u;
  const botSpan = p3.u - p2.u;
  const effectiveSpan = (topSpan + botSpan) / 2;
  const leftDrop = p2.v - p0.v;
  const rightDrop = p3.v - p1.v;
  const effectiveHeight = (leftDrop + rightDrop) / 2;

  // 对角斜桥（P1 -> P2）在标准版面参考比例下的倾角（跨设备一致，避免宽屏压扁误报）
  const diagDx = (p1.u - p2.u) * DESIGN_ASPECT;
  const diagDy = Math.max(0.001, p2.v - p1.v);
  const diagAngle = Math.round((Math.atan2(diagDy, Math.max(0.001, diagDx)) * 180) / Math.PI);
  const diagReversed = p1.u - p2.u < 0.08;

  // 站位顺序核对
  const entryAtStart = state.roles[0] === "entry";
  const ctaAtEnd = state.roles[3] === "cta";
  const midOrderExact = state.roles[1] === "progress" && state.roles[2] === "pivot";
  const orderSwappedEnds = !entryAtStart || !ctaAtEnd;
  const orderOk = entryAtStart && ctaAtEnd && midOrderExact;
  const orderLooseOk = entryAtStart && ctaAtEnd;

  // 几何与跨度核对
  const tooNarrow = effectiveSpan < SPAN_GOOD_MIN || diagAngle > ANGLE_GOOD_MAX || diagReversed;
  const tooFlat = effectiveHeight < HSPAN_GOOD_MIN || diagAngle < ANGLE_GOOD_MIN;
  const spanOk = !tooNarrow && !tooFlat && topSpan >= 0.46 && botSpan >= 0.46;

  // 四项原理实况（对应原海报底沿四栏：视线流动 / 信息递进 / 节奏转换 / 叙事路径）
  const cFlow = spanOk && entryAtStart && state.textLoad === "sparse";
  const cProgress = state.bridge && !state.distractor && !tooNarrow && !tooFlat && state.textLoad === "sparse";
  const cRhythm = state.weightMode === "graded" && state.bridge && !tooNarrow && !tooFlat && !state.distractor;
  const cNarrative = orderLooseOk && state.weightMode === "graded" && !state.distractor && state.bridge && state.textLoad === "sparse";

  const checks = [
    {
      key: "flow",
      title: "视线流动",
      en: "EYE FLOW",
      ok: cFlow,
      badge: state.textLoad === "dense"
        ? "退化 F 扫"
        : !entryAtStart
          ? "入口错角"
          : tooNarrow
            ? `窄柱 ${Math.round(effectiveSpan * 100)}%`
            : tooFlat
              ? `倾角过平 ${diagAngle}°`
              : `横跨 ${Math.round(effectiveSpan * 100)}%`,
    },
    {
      key: "progress",
      title: "信息递进",
      en: "PROGRESSIVE INFO",
      ok: cProgress,
      badge: state.distractor
        ? "中路截胡"
        : !state.bridge
          ? "斜桥断裂"
          : state.textLoad === "dense"
            ? "文字拥堵"
            : `斜桥 ${diagAngle}°`,
    },
    {
      key: "rhythm",
      title: "节奏转换",
      en: "RHYTHM SHIFT",
      ok: cRhythm,
      badge: state.weightMode === "equal"
        ? "四站平权"
        : !state.bridge
          ? "跳角成 7"
          : state.weightMode === "weak_end"
            ? "后劲不足"
            : tooFlat
              ? "折角过浅"
              : "顿挫清晰",
    },
    {
      key: "narrative",
      title: "叙事路径",
      en: "NARRATIVE PATH",
      ok: cNarrative,
      badge: !ctaAtEnd
        ? "终点失位"
        : state.weightMode === "weak_end"
          ? "终点滑框"
          : state.distractor
            ? "未达终点"
            : !state.bridge
              ? "漏掉左下"
              : state.textLoad === "dense"
                ? "右下半盲"
                : orderOk
                  ? "闭环落靶"
                  : "终点已锁",
    },
  ];

  const passCount = checks.filter((c) => c.ok).length;

  // 预测眼动跃迁路径（Saccade Simulation）
  let gazeShape = "Z";
  let gazePoints = [];
  let gazeLabel = "①→②→③→④ 顺畅 Z 轨";
  let reachEnd = true;

  if (state.textLoad === "dense") {
    gazeShape = "F-collapse";
    reachEnd = false;
    gazeLabel = "退化为左缘 F 扫视";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p0.u + (p1.u - p0.u) * 0.85, v: p0.v, tag: "②" },
      { u: p0.u, v: p0.v + (p2.v - p0.v) * 0.36, tag: "③" },
      { u: p0.u + (p1.u - p0.u) * 0.52, v: p0.v + (p2.v - p0.v) * 0.36, tag: "④" },
      { u: p0.u, v: p2.v, tag: "×" },
    ];
  } else if (state.distractor) {
    gazeShape = "blocked";
    reachEnd = false;
    gazeLabel = "中路截胡 · 停死中央";
    const mid = { u: (p1.u + p2.u) / 2, v: (p1.v + p2.v) / 2 };
    if (entryAtStart) {
      gazePoints = [
        { u: p0.u, v: p0.v, tag: "①" },
        { u: p1.u, v: p1.v, tag: "②" },
        { u: mid.u, v: mid.v, tag: "停" },
      ];
    } else {
      gazePoints = [
        { u: p0.u, v: p0.v, tag: "①" },
        { u: mid.u, v: mid.v, tag: "停" },
        { u: p1.u, v: p1.v, tag: "?" },
      ];
    }
  } else if (orderSwappedEnds) {
    gazeShape = "reverse";
    reachEnd = false;
    const ctaIdx = state.roles.indexOf("cta");
    const entryIdx = state.roles.indexOf("entry");
    gazeLabel = `${SLOT_NAMES[ctaIdx]}抢跑 · 叙事倒流`;
    gazePoints = [
      { u: pts[ctaIdx].u, v: pts[ctaIdx].v, tag: "①抢" },
      { u: pts[entryIdx].u, v: pts[entryIdx].v, tag: "②回" },
      { u: p1.u, v: p1.v, tag: "③乱" },
    ];
  } else if (!state.bridge) {
    gazeShape = "7-skip";
    reachEnd = true;
    gazeLabel = "断桥跳角 · 走成「7」字";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p1.u, v: p1.v, tag: "②" },
      { u: p3.u, v: p3.v, tag: "跳④" },
    ];
  } else if (tooNarrow) {
    gazeShape = "column";
    reachEnd = true;
    gazeLabel = "横跨过窄 · 塌成竖柱";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p1.u, v: p1.v, tag: "②" },
      { u: p2.u, v: p2.v, tag: "③" },
      { u: p3.u, v: p3.v, tag: "④" },
    ];
  } else if (tooFlat) {
    gazeShape = "flat";
    reachEnd = true;
    gazeLabel = "折角过浅 · 上下贴扁";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p1.u, v: p1.v, tag: "②" },
      { u: p2.u, v: p2.v, tag: "③" },
      { u: p3.u, v: p3.v, tag: "④" },
    ];
  } else if (state.weightMode === "equal") {
    gazeShape = "pingpong";
    reachEnd = false;
    gazeLabel = "四角拉锯 · 无主次折返";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p3.u, v: p3.v, tag: "②" },
      { u: p1.u, v: p1.v, tag: "③" },
      { u: p2.u, v: p2.v, tag: "④" },
      { u: p0.u, v: p0.v, tag: "回" },
    ];
  } else if (state.weightMode === "weak_end") {
    gazeShape = "slip-out";
    reachEnd = false;
    gazeLabel = "终点失重 · 视线滑出画框";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p1.u, v: p1.v, tag: "②" },
      { u: p2.u, v: p2.v, tag: "③" },
      { u: Math.min(0.97, p3.u + 0.09), v: Math.min(0.95, p3.v + 0.06), tag: "滑出" },
    ];
  } else {
    gazeShape = "Z";
    reachEnd = true;
    gazeLabel = orderOk ? "①→②→③→④ 完整 Z 轨" : "①→②→③→④ 可用 Z 轨";
    gazePoints = [
      { u: p0.u, v: p0.v, tag: "①" },
      { u: p1.u, v: p1.v, tag: "②" },
      { u: p2.u, v: p2.v, tag: "③" },
      { u: p3.u, v: p3.v, tag: "④" },
    ];
  }

  // 主错态诊断（优先级由最致命的视觉阻断到几何微调）
  let kind = "pass";
  let tag = "贯通达标";
  let headline = "";
  let body = "";
  let nextStep = "";
  let fluencyTier = "顺畅贯通（示意）";

  if (state.textLoad === "dense") {
    kind = "dense-f";
    tag = `错态 · 退化 F 扫视 (${passCount}/4)`;
    headline = "版面塞满大段文字，Z 形路径当场塌缩成左缘 F 扫视";
    body = "眼动研究证明，人眼只有在文字稀疏、区块分明的画面里才走 Z 形。现在密排长文把读者拉回逐行检索模式，视线死贴左缘往下扫，右下角的行动终点根本落不到眼里。";
    nextStep = "把下方「文本密度」切回「稀疏海报 / 首屏」，给四站留出干净呼吸区。";
    fluencyTier = "左缘塌缩（示意）";
  } else if (state.distractor) {
    kind = "distractor";
    tag = `错态 · 中路截胡 (${passCount}/4)`;
    headline = "中路红块硬生生拦腰截断斜桥，视线卡死在正中央";
    body = `当前横跨 ${Math.round(effectiveSpan * 100)}%，本来要靠斜对角把眼睛从右上领去左下；但画面正中塞着高饱和抢戏块，视线刚进画面就被吸住打转，后半段「节奏转换」与右下终点双双失联。`;
    nextStep = "直接在画布上点击中央虚线红块把它清场，先把对角视觉通道让出来。";
    fluencyTier = "中路阻断（示意）";
  } else if (orderSwappedEnds) {
    kind = "order";
    tag = `错态 · 首尾倒置 (${passCount}/4)`;
    const ctaPos = SLOT_NAMES[state.roles.indexOf("cta")];
    const entryPos = SLOT_NAMES[state.roles.indexOf("entry")];
    headline = `「行动靶心」错放在${ctaPos}，还没讲理由就催人行动`;
    body = `Z 形的核心是叙事递进：左上抓眼、中段铺垫、右下收口。现在入口掉去${entryPos}，终点靶心却抢占了${ctaPos}，观者第一眼被结果撞脸，不得不倒流回头找「这是什么」。`;
    nextStep = "在画布上把「眼睛入口」拖到左上①（或连点首尾两站互换 / 点下方「归正首尾」）。";
    fluencyTier = "逆流反折（示意）";
  } else if (!state.bridge) {
    kind = "no-bridge";
    tag = `错态 · 断桥变「7」字 (${passCount}/4)`;
    headline = "右上到左下没有视觉桥，眼睛直接跳角坠向右下";
    body = "从右上斜回左下，是逆着左至右阅读习惯的「回拉」动作。现在对角斜带断开，人眼懒得回头，直接从右上②垂直掉到右下④，整段左下「节奏转换」被一脚跨过，Z 形走成了「7」字。";
    nextStep = "直接点击画布中段的虚线断口（或点「接通对角桥」），用实心斜带把眼睛稳稳拽回左下③。";
    fluencyTier = "跳角漏站（示意）";
  } else if (tooNarrow) {
    kind = "narrow";
    tag = `错态 · 压成竖柱 (${passCount}/4)`;
    headline = `横跨只剩 ${Math.round(effectiveSpan * 100)}%，Z 轨被挤扁成一根竖条`;
    body = `现在斜桥陡到 ${diagAngle}°（经验顺流带约 ${ANGLE_GOOD_MIN}°–${ANGLE_GOOD_MAX}°），左右两站挨得太近，横扫距离几乎消失。眼睛感受不到「横扫→斜切→再横扫」的三拍节奏，只像在看一根竖排清单。`;
    nextStep = "在画布上向右横拖（或按 → 键），把 Z 形横跨拉展进 54%–82% 经验带。";
    fluencyTier = "竖向塌陷（示意）";
  } else if (tooFlat) {
    kind = "flat";
    tag = `错态 · 上下贴扁 (${passCount}/4)`;
    headline = `斜桥压平到 ${diagAngle}°，上下两横杠快挤成一条线`;
    body = `当前纵向落差只有 ${Math.round(effectiveHeight * 100)}%，第一横扫和终点横扫贴得太近，中段对角线没有伸展空间，「信息递进」和「节奏转换」的停顿层次被拍扁了。`;
    nextStep = "按 ↓ 键或拖动下方「纵深落差」滑杆，拉开上下两横臂的距离。";
    fluencyTier = "纵向拍扁（示意）";
  } else if (state.weightMode === "equal") {
    kind = "equal";
    tag = `错态 · 四站平权 (${passCount}/4)`;
    headline = "四个角落一样大、一样重，视线在四角来回打乒乓";
    body = "Z 形靠的是「入口明快 → 中段轻托 → 终点重收」的权重梯度。现在四站完全等重，谁都在喊「先看我」，眼睛会在对角与边缘反复横跳，根本形不成单向叙事流。";
    nextStep = "把下方「权重梯次」切回「起承转合梯度」，让入口与右下靶心拉开轻重差。";
    fluencyTier = "拉锯迟疑（示意）";
  } else if (state.weightMode === "weak_end") {
    kind = "weak-end";
    tag = `错态 · 终点失重 (${passCount}/4)`;
    headline = "前面铺得挺顺，右下终点太轻兜不住视线";
    body = "视线辛辛苦苦顺着 Z 轨走到最后一段，如果右下角行动点比左上弱一大截，眼球的惯性会直接冲出右下画框边缘，变成「看了个热闹，忘了该点哪」。";
    nextStep = "把「权重梯次」切回「起承转合梯度」，加重右下靶心的收口分量。";
    fluencyTier = "末端滑框（示意）";
  } else {
    // 4/4 多组合法解识别
    kind = "pass";
    let solName = "标准经典 Z 解";
    if (effectiveSpan >= 0.75 && diagAngle <= 38) solName = "宽银幕横展 Z 解";
    else if (effectiveSpan <= 0.62 && diagAngle >= 49) solName = "紧凑重收口 Z 解";
    tag = `达标 · ${solName} (4/4)`;
    headline = `横跨 ${Math.round(effectiveSpan * 100)}% · 斜桥 ${diagAngle}°，四站顺流直达右下终点`;
    body = orderOk
      ? "左上入口第一时间接住阅读重力，右上顺势承接，实心对角斜桥稳稳把视线拉回左下完成节奏顿挫，最后收束在分量最足的右下靶心。试着换其他合法比例或点「压测」看看哪种破绽最致命。"
      : "起终点与对角斜桥已经走通完整 Z 轨；中段②与③互换了位置，只要信息仍保持由浅入深的递进，同样能稳妥把视线送达右下终点。";
    nextStep = "试试切「爵士夜海报 / 产品首屏」，或故意点开「中路干扰 / 断桥 / 密集文字」验真。";
    fluencyTier = "顺畅闭环（示意）";
  }

  return {
    pts,
    weights,
    effectiveSpan,
    effectiveHeight,
    diagAngle,
    checks,
    passCount,
    kind,
    tag,
    headline,
    body,
    nextStep,
    fluencyTier,
    gazeShape,
    gazePoints,
    gazeLabel,
    reachEnd,
    entryAtStart,
    ctaAtEnd,
    orderOk,
  };
}
