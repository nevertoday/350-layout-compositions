// 297 顺序重排 SEQUENTIAL REORDER — 单一真源数据与判定引擎
// 开场蓝图舞台、左侧单真源诊单、底部四原则栏、01-06 节交互与单变量小练习共用本模块。

export const PALETTE = {
  cobalt: "#011A8C",
  cobaltDeep: "#001470",
  cobaltFooter: "#001266",
  cobaltWell: "#052099",
  chartreuse: "#E1DE36",
  chartreuseBar: "#DBDD29",
  ivory: "#FDFFF3",
  ice: "#C6D4FF",
  coralDark: "#FF8A75",
  coralFill: "#D63B27",
  mintDark: "#67F2B0",
  paperLight: "#F5F8FE",
  inkDark: "#0A1647",
};

export const SHAPES = {
  focus: { id: "focus", glyph: "●", label: "核心信息", sub: "目标 / 结论 / 价值", en: "FOCUS", posterRank: 1 },
  support: { id: "support", glyph: "■", label: "关键支撑", sub: "方法 / 证据 / 数据", en: "SUPPORT", posterRank: 2 },
  supplement: { id: "supplement", glyph: "▲", label: "辅助说明", sub: "细节 / 补充 / 背景", en: "SUPPLEMENT", posterRank: 3 },
  extend: { id: "extend", glyph: "≡", label: "补充内容", sub: "参考 / 附录 / 扩展", en: "EXTEND", posterRank: 4 },
};

// 三套真实阅读目标：展示「顺序切换 SWITCH — 按目标调整顺序，灵活重排」
export const SCENARIOS = {
  product: {
    id: "product",
    tab: "产品速览（原海报）",
    shortTab: "产品速览",
    goal: "首次点进产品页，3 秒判断值不值得了解并马上上手",
    goalShort: "3 秒看懂价值并上手",
    // 原海报底部「原始顺序（信息分散）」：▲ 背景 → ● 优势 → ■ 方法 → ≡ 案例
    initialOrder: ["supplement", "focus", "support", "extend"],
    domOrder: ["supplement", "focus", "support", "extend"],
    targetOrder: ["focus", "support", "supplement", "extend"],
    // 也可接受先用案例强化信任的实证变体解
    variantOrders: [
      {
        order: ["focus", "support", "extend", "supplement"],
        tag: "可行解 · 实证前置",
        note: "把核心优势与使用方法放前两位，再直接亮出用户案例强化信任、最后收拢产品背景，同样满足首屏命中与零起承断层。",
      },
    ],
    modules: {
      focus: { name: "产品优势", sub: "核心亮点", leadHint: "一眼答清「对我有什么用」" },
      support: { name: "使用方法", sub: "步骤说明", leadHint: "紧接证明「上手门槛低」" },
      supplement: { name: "产品背景", sub: "背景介绍", leadHint: "留给想深挖来龙去脉的人" },
      extend: { name: "用户案例", sub: "案例参考", leadHint: "扩展口碑与应用场景" },
    },
    presets: {
      broken: ["supplement", "focus", "support", "extend"],
      reversed: ["extend", "supplement", "support", "focus"],
      gap: ["focus", "extend", "supplement", "support"],
      solved: ["focus", "support", "supplement", "extend"],
    },
  },
  rescue: {
    id: "rescue",
    tab: "故障急修卡",
    shortTab: "故障急修",
    goal: "半夜服务报错，先立刻按步骤恢复运行，事后再查根因与日志",
    goalShort: "先恢复运行再查根因",
    // 错态：把厚重的根因原理和历史日志堆在最前面，急修步骤压在后面
    initialOrder: ["supplement", "extend", "focus", "support"],
    domOrder: ["supplement", "extend", "focus", "support"],
    // 急修场景：操作步骤(■)领头，紧接现象核对(●)，再讲根因(▲)，最后附完整工单(≡)
    targetOrder: ["support", "focus", "supplement", "extend"],
    variantOrders: [
      {
        order: ["focus", "support", "supplement", "extend"],
        tag: "可行解 · 先确诊再动刀",
        note: "先用 10 秒现象核对确认命中同一故障，紧接着执行应急恢复步骤，也是高危运维文档里常见且稳妥的顺序。",
      },
    ],
    modules: {
      support: { name: "应急修复步骤", sub: "3 步先恢复", leadHint: "止血操作必须第一时间触达" },
      focus: { name: "报错判定结论", sub: "现象核对", leadHint: "快速确认是不是这个故障" },
      supplement: { name: "故障根因剖析", sub: "底层原理", leadHint: "恢复正常后再回头复盘" },
      extend: { name: "完整排查工单", sub: "历史参考", leadHint: "留作延伸检索与归档" },
    },
    presets: {
      broken: ["supplement", "extend", "focus", "support"],
      reversed: ["extend", "supplement", "focus", "support"],
      gap: ["support", "extend", "supplement", "focus"],
      solved: ["support", "focus", "supplement", "extend"],
    },
  },
  trust: {
    id: "trust",
    tab: "转介绍案例页",
    shortTab: "案例背书",
    goal: "朋友转发来的口碑链接，访客最先想知道「真实效果怎样」再看怎么做到的",
    goalShort: "先看实证再看做法",
    // 错态：先铺立项背景与操作细则，真实客户成果沉到最底
    initialOrder: ["supplement", "support", "focus", "extend"],
    domOrder: ["supplement", "support", "focus", "extend"],
    // 口碑页：客户真实成果(≡)或核心结论(●)领头，紧接核心亮点(●)与落地方法(■)，背景(▲)垫后
    targetOrder: ["extend", "focus", "support", "supplement"],
    variantOrders: [
      {
        order: ["focus", "extend", "support", "supplement"],
        tag: "可行解 · 结论带实证",
        note: "先亮核心成果摘要，紧接真实客户实证，再展开实现步骤、把团队背景放最后，兼顾效率与信任。",
      },
    ],
    modules: {
      extend: { name: "真实客户成果", sub: "实拍与复盘", leadHint: "直接回应转介绍访客的信任疑问" },
      focus: { name: "核心改观结论", sub: "价值提炼", leadHint: "把案例里的关键收益拎出来" },
      support: { name: "落地执行路径", sub: "方法拆解", leadHint: "说明这套成果是如何做到的" },
      supplement: { name: "项目立项背景", sub: "前情补充", leadHint: "兴趣建立后再补背景脉络" },
    },
    presets: {
      broken: ["supplement", "support", "focus", "extend"],
      reversed: ["supplement", "support", "extend", "focus"],
      gap: ["extend", "supplement", "support", "focus"],
      solved: ["extend", "focus", "support", "supplement"],
    },
  },
};

export const SLOT_CIRCLES = ["①", "②", "③", "④"];

/** 计算排列 order 相对 targetOrder 的精确 Kendall 逆序对数（0..6）与具体逆序跳跃索引 */
export function countInversions(order, targetOrder) {
  const rank = new Map(targetOrder.map((id, idx) => [id, idx]));
  let count = 0;
  const adjacentBacktracks = [];
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (rank.get(order[i]) > rank.get(order[j])) count++;
    }
    if (i < order.length - 1 && rank.get(order[i]) > rank.get(order[i + 1])) {
      adjacentBacktracks.push([i, i + 1]);
    }
  }
  return { count, adjacentBacktracks, rank };
}

/** 计算在视觉顺序 visualOrder 下，按 domOrder 依次按 Tab 时产生的视觉往返逆跳次数 */
export function countFocusBacktracks(visualOrder, domOrder) {
  const visualPos = new Map(visualOrder.map((id, idx) => [id, idx]));
  const trail = domOrder.map((id) => visualPos.get(id));
  let jumps = 0;
  let totalSpan = 0;
  for (let i = 0; i < trail.length - 1; i++) {
    const diff = trail[i + 1] - trail[i];
    if (diff < 0 || diff > 1) jumps++;
    totalSpan += Math.abs(diff);
  }
  return { jumps, trail, totalSpan };
}

/**
 * 单一真源核心判定：只读 (scenarioId, order, mode)，输出全页统一的几何/逻辑/白话诊断。
 * @param {"product"|"rescue"|"trust"} scenarioId
 * @param {string[]} order - 长度为 4 的模块 ID 数组（从第 1 读位到第 4 读位）
 * @param {"dom"|"css-order"} mode - 同步改 DOM，或仅靠 CSS order 视觉挪位
 */
export function evaluateOrder(scenarioId, order, mode = "dom") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.product;
  const target = sc.targetOrder;
  const { count: inversions, adjacentBacktracks, rank } = countInversions(order, target);

  const primaryId = target[0];
  const secondaryId = target[1];
  const primaryPos = order.indexOf(primaryId); // 0..3
  const secondaryPos = order.indexOf(secondaryId); // 0..3
  const leadId = order[0];
  const leadRank = rank.get(leadId); // 0 是最佳领头，3 是最末扩展
  const coreGap = Math.abs(secondaryPos - primaryPos) - 1; // 0 表示紧邻，>=1 表示中间插了墙

  const variantMatch = sc.variantOrders.find((v) => v.order.every((id, i) => id === order[i])) || null;
  const isExactTarget = inversions === 0;
  const isSequenceValid = isExactTarget || !!variantMatch;

  const focusCheck = mode === "css-order"
    ? countFocusBacktracks(order, sc.domOrder)
    : { jumps: 0, trail: [0, 1, 2, 3], totalSpan: 3 };
  const hasCssTrap = mode === "css-order" && focusCheck.jumps > 0;

  // 每个槽位是否契合当前顺次（给画布区分实线稳态框 vs 虚线错位框）
  const activeGoalOrder = variantMatch ? variantMatch.order : target;
  const slotMatches = order.map((id, i) => id === activeGoalOrder[i]);

  // 判定状态、标题、白话原因与上下文一键修法
  let status = "broken";
  let badge = "";
  let headline = "";
  let body = "";
  let actionHint = "";
  let quickFixLabel = "";
  let quickFixOrder = target;
  let quickFixMode = mode;

  const leadMod = sc.modules[leadId];
  const primMod = sc.modules[primaryId];
  const secMod = sc.modules[secondaryId];

  if (isSequenceValid && !hasCssTrap) {
    status = isExactTarget ? "optimal" : "variant";
    badge = isExactTarget ? "阶梯顺畅 · 0 处逆序" : variantMatch.tag;
    headline = isExactTarget
      ? `「${primMod.name}」稳坐第 1 读位，四阶顺次零折返`
      : `${variantMatch.tag}：首屏命中核心，逻辑无断层`;
    body = isExactTarget
      ? `视线从「${primMod.name}」直落「${secMod.name}」，再顺势承接补充与扩展——4 个模块严格按当前目标的阅读优先级递进，且 DOM 与视觉顺序一致。`
      : variantMatch.note;
    actionHint = "可以切换右上角另一个阅读目标，或开启「仅 CSS order」测试键盘焦点会怎样折返。";
    quickFixLabel = "体验「仅 CSS order」错焦";
    quickFixOrder = order;
    quickFixMode = "css-order";
  } else if (isSequenceValid && hasCssTrap) {
    status = "css-trap";
    badge = `视觉已排好 · 但焦点错跳 ${focusCheck.jumps} 次`;
    headline = `画面顺了，但键盘 Tab 仍在卡片间往返折跳`;
    body = `当前虽然把「${primMod.name}」移到了第 1 视觉位，但因为只靠 CSS order 挪位、底层 HTML 源码仍停在原始顺序，键盘和读屏器会按红色虚线来回跳跃（违背 WCAG 2.2 SC 1.3.2 / 2.4.3）。`;
    actionHint = "把重排方式切回「同步 DOM」，或参考 04 节使用 CSS reading-flow 对齐阅读流。";
    quickFixLabel = "切换「同步 DOM」对齐焦点";
    quickFixOrder = order;
    quickFixMode = "dom";
  } else if (inversions >= 4) {
    status = "broken";
    badge = `全盘逆序 · ${inversions} 处逆序跳变`;
    headline = `主次彻底倒置，「${leadMod.name}」挡在最前头`;
    body = `当前排列与「${sc.goalShort}」目标存在 ${inversions} 处逆序，读者刚打开页面就被最次要的内容拦住，真正要找的「${primMod.name}」被压在第 ${primaryPos + 1} 位，视线在阶梯上锯齿状往返。`;
    actionHint = `直接把「${primMod.name}」拖到最左第 1 读位，再把「${secMod.name}」紧接在第 2 位。`;
    quickFixLabel = `把「${primMod.name}」提回第 1 位`;
    quickFixOrder = target;
    quickFixMode = "dom";
  } else if (leadRank >= 2) {
    status = "broken";
    const isAppendix = leadRank === 3;
    badge = isAppendix ? `附录占顶 · ${inversions} 处逆序` : `背景抢跑 · ${inversions} 处逆序`;
    headline = isAppendix
      ? `「${leadMod.name}」占了首屏，核心「${primMod.name}」被压到第 ${primaryPos + 1} 位`
      : `「${leadMod.name}」抢占第 1 读位，「${primMod.name}」滞后`;
    body = `面对「${sc.goal}」的读者，第一眼最想确认的是「${primMod.name}」。现在开头先讲次要信息，读者还没看到价值就可能关掉页面（画布阶梯出现 ${inversions} 处逆序折返）。`;
    actionHint = `在画布上把「${SHAPES[primaryId].glyph} ${primMod.name}」往左拖到第 1 读位，或点下方按钮一键重排。`;
    quickFixLabel = `按目标重排为最优阶梯`;
    quickFixOrder = target;
    quickFixMode = "dom";
  } else if (primaryPos === 0 && coreGap >= 1) {
    status = "broken";
    const wallNames = order
      .slice(1, secondaryPos)
      .map((id) => `「${sc.modules[id].name}」`)
      .join("、");
    badge = `起承断层 · ${inversions} 处逆序`;
    headline = `「${primMod.name}」虽在首位，却和「${secMod.name}」被隔开了`;
    body = `读者刚被「${primMod.name}」吸引，正需要「${secMod.name}」承接验证，中间却突然插进了 ${wallNames}，阅读节奏被硬生生打断，产生 ${inversions} 处逆序。`;
    actionHint = `把「${SHAPES[secondaryId].glyph} ${secMod.name}」往前移到第 2 读位，接住第 1 位的势头。`;
    quickFixLabel = `把「${secMod.name}」接回第 2 位`;
    quickFixOrder = target;
    quickFixMode = "dom";
  } else {
    status = "broken";
    badge = `节奏错位 · ${inversions} 处逆序`;
    headline = `顺序还没理顺，「${primMod.name}」落在了第 ${primaryPos + 1} 位`;
    body = `当前排列仍有 ${inversions} 处逆序。按「${sc.goalShort}」的阅读优先级，应先给出「${primMod.name}」，再紧接「${secMod.name}」，把背景与补充往后收。`;
    actionHint = `拖动或点选两张卡片互换，使四阶梯呈现连续单向顺流。`;
    quickFixLabel = "理顺为目标顺序";
    quickFixOrder = target;
    quickFixMode = "dom";
  }

  // 原海报四条原则的实时单真源状态
  const principles = [
    {
      id: "focus",
      title: "优先级前置",
      en: "PRIORITIZE",
      posterBody: "核心信息提前，快速抓住重点",
      ok: primaryPos === 0 || (!!variantMatch && leadId === variantMatch.order[0]),
      meter: primaryPos === 0 ? "核心已领头 ①" : `核心滞后第 ${primaryPos + 1} 位`,
    },
    {
      id: "support",
      title: "顺序切换",
      en: "SWITCH",
      posterBody: "按目标调整顺序，灵活重排",
      ok: true,
      meter: `目标：${sc.shortTab}`,
    },
    {
      id: "supplement",
      title: "信息连贯",
      en: "CONTINUITY",
      posterBody: "逻辑顺畅，阅读不跳跃",
      ok: isSequenceValid,
      meter: isSequenceValid ? (isExactTarget ? "0 处逆序 · 单向顺流" : "可行变体 · 无断层") : `逆序 ${inversions} 处 · 折返`,
    },
    {
      id: "extend",
      title: "流程清晰",
      en: "CLARITY",
      posterBody: "节奏明确，主次分明",
      ok: isSequenceValid && !hasCssTrap,
      meter: hasCssTrap ? `CSS order 错跳 ${focusCheck.jumps} 次` : (mode === "dom" ? "DOM 与视觉同步" : "CSS order 与源码巧合一致"),
    },
  ];

  // 自示范大标「顺序重排」四字的实时阶梯高低（0 最高，3 最低）
  const titleRanks = order.map((id) => rank.get(id));

  return {
    scenario: sc,
    order,
    mode,
    inversions,
    adjacentBacktracks,
    primaryPos,
    secondaryPos,
    coreGap,
    focusCheck,
    hasCssTrap,
    isExactTarget,
    variantMatch,
    isSequenceValid,
    slotMatches,
    status,
    badge,
    headline,
    body,
    actionHint,
    quickFixLabel,
    quickFixOrder,
    quickFixMode,
    principles,
    titleRanks,
  };
}

// =====================================================================
// 01 节：5 秒首屏扫读耐心模拟器（原海报「原始顺序」vs「重排后」）
// =====================================================================
export const SCAN_BLOCKS = {
  supplement: { id: "supplement", name: "产品背景", desc: "创立缘起与行业演变概述", costSec: 3.5, isCore: false },
  focus: { id: "focus", name: "产品优势", desc: "3 倍提效与核心差异价值", costSec: 2.5, isCore: true },
  support: { id: "support", name: "使用方法", desc: "3 步上手流程与示例截图", costSec: 3.0, isCore: true },
  extend: { id: "extend", name: "用户案例", desc: "不同行业团队的使用参考", costSec: 3.0, isCore: false },
};

export function simulateScan(order, budgetSec) {
  let elapsed = 0;
  const items = order.map((id) => {
    const b = SCAN_BLOCKS[id];
    const start = elapsed;
    const end = elapsed + b.costSec;
    elapsed = end;
    const progress = Math.max(0, Math.min(1, (budgetSec - start) / b.costSec));
    const state = progress >= 0.99 ? "read" : progress > 0.05 ? "partial" : "missed";
    return { ...b, start, end, progress, state };
  });
  const gotFocus = items.find((x) => x.id === "focus")?.progress ?? 0;
  const gotSupport = items.find((x) => x.id === "support")?.progress ?? 0;
  return { items, gotFocus, gotSupport };
}

// =====================================================================
// 02 节：五段经核实源流年表
// =====================================================================
export const HISTORY_NODES = [
  {
    year: "1880s",
    title: "报刊倒金字塔定型",
    person: "Horst Pöttker（2003 实证考据）",
    work: "《Journalism Studies》4(4): 501–511",
    summary: "民间常把「倒金字塔」归功于 1861 年美国内战电报怕断线。但传播学者 Horst Pöttker 逐年分析《纽约先驱报》与《纽约时报》后证明：把最核心事实提到首段并非电报一夜催生，而是在 1880—1890 年代才真正普及——根本动因是让普通读者一眼读懂新闻要点。",
    diagram: "pyramid",
    takeaway: "核心事实前置，让读者在任意位置停下都不会错过结论。",
  },
  {
    year: "1962",
    title: "系列位置记忆曲线",
    person: "Bennet B. Murdock Jr.",
    work: "《Journal of Experimental Psychology》64(5): 482–488",
    summary: "心理学家 Murdock 测出了经典的 U 形自由回忆曲线：人在连续接收一串信息时，对最开头（首因效应）和最末尾（近因效应）记得最牢，夹在中间的条目最容易被遗忘。模块怎么排顺序，直接决定什么会留在读者脑子里。",
    diagram: "u-curve",
    takeaway: "开头与结尾是记忆高地，别拿背景寒暄浪费第一位。",
  },
  {
    year: "1996",
    title: "网页里的倒金字塔",
    person: "Jakob Nielsen（1996-05-31）",
    work: "《Inverted Pyramids in Cyberspace》· NN/g",
    summary: "可用性研究先驱 Jakob Nielsen 指出，网页读者不是从头逐字精读，而是快速扫读且不爱盲目往下翻屏。学院派习惯「铺背景→讲方法→最后揭结论」，但在网页上必须反过来：先抛结论，再用层级与链接承接细节。",
    diagram: "web-fold",
    takeaway: "网页不是论文：首屏先交底，细节按需往下展开。",
  },
  {
    year: "2011",
    title: "响应式「内容编排」",
    person: "Trent Walton（2011-07-14）",
    work: "《Content Choreography》",
    summary: "响应式网页刚兴起时，很多多栏页面到手机上只是机械把侧栏一股脑甩到页尾。设计师 Trent Walton 提出「Content Choreography（内容编排）」：随视口收窄或展开，模块顺序必须有意识地重新穿插与提级，而不能听天由命。",
    diagram: "choreography",
    takeaway: "换屏幕不只是改栏宽，更是重算模块的出场顺次。",
  },
  {
    year: "2018–2025",
    title: "从 order 警示到 reading-flow",
    person: "W3C CSS WG / Rachel Andrew",
    work: "CSS Flexbox 1 §5.4.1（2018）→ CSS Display 4（Chrome 137，2025-05-01）",
    summary: "W3C 在 Flexbox 1 规范里明确警告：CSS order 只能做视觉微调，不能做逻辑重排，否则会撕裂屏幕阅读器与键盘 Tab 焦点（WCAG 1.3.2 / 2.4.3）。2025 年 5 月 Chrome 137 率先实装 CSS Display 4 的 reading-flow，开始在标准层面打通视觉顺序与键盘阅读流。",
    diagram: "reading-flow",
    takeaway: "好重排不仅眼里顺，键盘 Tab 和读屏器也要顺。",
  },
];

// =====================================================================
// 03 节：双设备目标驱动编排矩阵
// =====================================================================
export const INTENT_MATRICES = {
  browse: {
    id: "browse",
    label: "初次种草访客",
    brief: "刚从推荐点进来，还没建立信任，先看核心卖点与主图，再看实拍与规格。",
    mobileOrder: ["focus", "support", "supplement", "extend"],
    desktopAreas: [
      ["focus", "focus", "support"],
      ["supplement", "extend", "support"],
    ],
    names: {
      focus: { title: "核心卖点与头图", sub: "3 秒说清这款声学降噪耳机的独特之处" },
      support: { title: "实测降噪与价格卡", sub: "试听对比与立即入手入口" },
      supplement: { title: "声学研发背景", sub: "腔体结构与设计故事" },
      extend: { title: "配件与售后说明", sub: "包装清单与质保条款" },
    },
    cssSnippet: `.page {\n  display: grid;\n  grid-template-areas:\n    "focus focus support"\n    "supplement extend support";\n}\n@media (max-width: 720px) {\n  .page { grid-template-areas: "focus" "support" "supplement" "extend"; }\n}`,
  },
  compare: {
    id: "compare",
    label: "比价下单老客",
    brief: "已经认识品牌，直接奔着版本差异、现货与到手价来，购买决策区必须提到最前。",
    mobileOrder: ["support", "focus", "extend", "supplement"],
    desktopAreas: [
      ["support", "focus", "focus"],
      ["support", "extend", "supplement"],
    ],
    names: {
      support: { title: "版本对比与立即下单", sub: "标准版 / Pro 差价、库存与配送时效" },
      focus: { title: "核心参数速览", sub: "续航 42 小时 · 降噪深度 · 重量" },
      extend: { title: "老客换新与售后保障", sub: "30 天无理由与以旧换新补贴" },
      supplement: { title: "品牌设计故事", sub: "已经了解，退居页面末尾" },
    },
    cssSnippet: `/* 老客落地页：服务端或路由按场景输出匹配 DOM 顺次 */\n.page-buy {\n  grid-template-areas:\n    "support focus focus"\n    "support extend supplement";\n}\n@media (max-width: 720px) {\n  .page-buy { grid-template-areas: "support" "focus" "extend" "supplement"; }\n}`,
  },
  service: {
    id: "service",
    label: "售后查修用户",
    brief: "手里的设备刚出异常，扫说明书二维码进来：保修与自检入口必须排第 1，别拿广告图挡路。",
    mobileOrder: ["extend", "support", "focus", "supplement"],
    desktopAreas: [
      ["extend", "extend", "support"],
      ["focus", "supplement", "support"],
    ],
    names: {
      extend: { title: "一键报修与保修查询", sub: "输入序列号直接查保修与寄修" },
      support: { title: "3 分钟故障自检步骤", sub: "重置配对 / 固件升级指南" },
      focus: { title: "常见报错说明", sub: "指示灯颜色含义速查" },
      supplement: { title: "产品故事与新品推荐", sub: "非当前任务，压到最底部" },
    },
    cssSnippet: `/* 售后入口页：把报修与自检直接写进 DOM 首屏 */\n.page-support {\n  grid-template-areas:\n    "extend extend support"\n    "focus supplement support";\n}\n@media (max-width: 720px) {\n  .page-support { grid-template-areas: "extend" "support" "focus" "supplement"; }\n}`,
  },
};

// =====================================================================
// 04 节：活体 Tab 焦点步进模拟器
// =====================================================================
export const TAB_MODES = {
  dom: {
    id: "dom",
    label: "正道 ①：同步调整 DOM 顺序",
    badge: "WCAG 1.3.2 / 2.4.3 通过",
    ok: true,
    // 视觉位置从左到右：[● 优势, ■ 方法, ▲ 背景, ≡ 案例]
    visualItems: ["focus", "support", "supplement", "extend"],
    // 键盘 Tab 依次落到的 visualIndex
    tabTrail: [0, 1, 2, 3],
    explain: "HTML 源码顺次本身就是 ● → ■ → ▲ → ≡。眼睛从左到右扫、键盘按 Tab 逐格跳、读屏器按顺序朗读，三条路线 100% 重合。",
    code: `<section class="cards">\n  <article>● 产品优势</article>\n  <article>■ 使用方法</article>\n  <article>▲ 产品背景</article>\n  <article>≡ 用户案例</article>\n</section>`,
  },
  cssOrder: {
    id: "cssOrder",
    label: "暗坑：只用 CSS order 硬挪",
    badge: "焦点往返折跳 · 违背 WCAG 2.4.3",
    ok: false,
    visualItems: ["focus", "support", "supplement", "extend"],
    // 源码依然是 [▲, ●, ■, ≡]，而 ▲ 视觉在第 3 格(idx 2)，● 在第 1 格(idx 0)，■ 在第 2 格(idx 1)，≡ 在第 4 格(idx 3)
    tabTrail: [2, 0, 1, 3],
    explain: "源码还是旧顺序 [▲, ●, ■, ≡]，只是用 CSS order 把 ▲ 推到了第 3 格。用户第一次按 Tab，焦点竟突然亮在第 3 格「▲ 产品背景」，再倒跳回第 1 格「● 产品优势」——明眼键盘用户和视障读屏用户都会迷路。",
    code: `/* [!] 反面教材：源码未改，仅靠 order 视觉挪位 */\n.card-supplement { order: 3; } /* DOM 第 1，视觉第 3 */\n.card-focus      { order: 1; } /* DOM 第 2，视觉第 1 */\n.card-support    { order: 2; }`,
  },
  readingFlow: {
    id: "readingFlow",
    label: "新标准：CSS reading-flow（渐进增强）",
    badge: "CSS Display 4 · Chrome 137+ 支持",
    ok: true,
    visualItems: ["focus", "support", "supplement", "extend"],
    tabTrail: [0, 1, 2, 3],
    explain: "当双端必须共享同一份 HTML 而局部确实需要随断点重排时，CSS Display Level 4 的 reading-flow: flex-visual 让支持它的浏览器按视觉流推进焦点。注意：截至 2025 年它仍是渐进特性，主结构仍应优先把 DOM 写顺。",
    code: `.cards {\n  display: flex;\n  reading-flow: flex-visual;\n}\n/* Chrome 137+ 焦点与无障碍树跟随视觉顺序；旧浏览器仍退回 DOM 顺次 */`,
  },
};

// =====================================================================
// 05 节：什么时候别硬做顺序重排（四类反例）
// =====================================================================
export const ANTIPATTERNS = {
  timeline: {
    id: "timeline",
    label: "时间线 / 变更日志",
    tag: "因果时序不可颠倒",
    badTitle: "硬把「最吸睛版本」提到最顶，其余乱序",
    badItems: [
      { k: "2026-03", t: "v4.0 大改版上线（按热度置顶）", warn: true },
      { k: "2024-11", t: "v2.1 紧急修复登录漏洞", warn: false },
      { k: "2025-08", t: "v3.0 迁移新数据库引擎", warn: true },
      { k: "2024-02", t: "v1.0 公开测试发布", warn: false },
    ],
    badWhy: "时间轴靠「严格单调递减或递增」建立因果关系。一旦为了突出亮点把某条记录抽到中间或乱插，用户根本看不清哪个改动在前、哪个依赖在后。",
    goodTitle: "守住严格时间序 + 顶部一行「里程碑锚点」",
    goodItems: [
      { k: "2026-03", t: "v4.0 大改版上线（标注：重大版本）" },
      { k: "2025-08", t: "v3.0 迁移新数据库引擎" },
      { k: "2024-11", t: "v2.1 紧急修复登录漏洞" },
      { k: "2024-02", t: "v1.0 公开测试发布" },
    ],
    goodWhy: "保留纯粹的倒序时间轴，用视觉徽章或顶部快捷锚点标出关键版本——既能直达重点，又不破坏时间因果。",
  },
  safety: {
    id: "safety",
    label: "强前置依赖教程",
    tag: "跳过前置会出事故",
    badTitle: "为了「结果前置」把核心拆装提到第 1 步",
    badItems: [
      { k: "步骤 1", t: "直接拧开主板螺丝拆下电池排线", warn: true },
      { k: "步骤 2", t: "替换新电池并扣回接口", warn: false },
      { k: "补充", t: "动手前请先关机并拔掉外接电源！", warn: true },
      { k: "附录", t: "所需梅花螺丝刀规格清单", warn: false },
    ],
    badWhy: "操作流程有不可逆的物理与安全依赖。把「断电提示」当成辅助说明压到后面，读者顺着第 1 步上手就会带电短路。",
    goodTitle: "先给 1 行成品预告，再严格按依赖顺次执行",
    goodItems: [
      { k: "前置", t: "必做安全检查：彻底关机、拔电源、备齐螺丝刀" },
      { k: "步骤 1", t: "卸下底壳并断开旧电池排线" },
      { k: "步骤 2", t: "装入新电池并复位卡扣" },
      { k: "验证", t: "开机检查电量识别与充电状态" },
    ],
    goodWhy: "强步骤型内容不能打乱执行顺序；想提升效率，只在流程最顶部放一句「总耗时与目标」，正文仍严格按先后依赖推进。",
  },
  narrative: {
    id: "narrative",
    label: "悬疑叙事 / 发布会",
    tag: "铺垫本身就是价值",
    badTitle: "一开场就把底牌和最低价全甩在第一行",
    badItems: [
      { k: "结论", t: "售价 2999 元，比上代轻 40 克", warn: true },
      { k: "支撑", t: "内部堆叠方案对比图表", warn: false },
      { k: "背景", t: "过去三年用户手腕酸痛的痛点采访", warn: true },
      { k: "扩展", t: "预告片与设计师致谢", warn: false },
    ],
    badWhy: "当读者还没认同「为什么 40 克那么难减」时，直接甩价格和参数只会显得平淡甚至嫌贵；悬疑、深度特稿与新品故事需要情绪铺垫。",
    goodTitle: "顺着情绪曲线推进：痛点 → 突破 → 揭晓",
    goodItems: [
      { k: "引子", t: "为什么长时间佩戴总觉得坠手？" },
      { k: "突破", t: "重构内部声学腔体，省下每一克冗余" },
      { k: "揭晓", t: "整机轻 40 克，定价 2999 元" },
      { k: "行动", t: "立即预约试戴（顶部导航常驻「参数直达」）" },
    ],
    goodWhy: "需要共情与说服的叙事页，保留起承转合的戏剧顺序；同时在导航栏留一个「参数与价格直达」按钮，照顾急性子老客。",
  },
  muscle: {
    id: "muscle",
    label: "高频工作台工具栏",
    tag: "别破坏肌肉记忆",
    badTitle: "每次刷新按「最近点击频率」自动重排按钮",
    badItems: [
      { k: "位 1", t: "导出 PDF（昨天多点了一次，突然跳到最左）", warn: true },
      { k: "位 2", t: "撤销（原来在位 1，今天跑去位 2）", warn: true },
      { k: "位 3", t: "保存", warn: false },
      { k: "位 4", t: "删除（紧挨保存，极易误点）", warn: true },
    ],
    badWhy: "高频工具栏靠的是「空间固定」形成的肌肉记忆。如果系统频繁按算法给按钮动态重排，用户每次抬手都要重新辨认，反而效率大跌、误删频发。",
    goodTitle: "固定主工具位次，只把动态推荐放进独立区",
    goodItems: [
      { k: "固定 1", t: "保存（永远在最左）" },
      { k: "固定 2", t: "撤销 / 重做（永远在保存旁）" },
      { k: "固定 3", t: "导出（固定中段）" },
      { k: "隔离区", t: "危险操作「删除」远离主操作并二次确认" },
    ],
    goodWhy: "顺序重排适用于「阅读与决策页面」；到了每天点上百次的专业工具栏，稳定空间位置比动态优先级更值钱。",
  },
};

// =====================================================================
// 06 节：严格单变量小练习（只差顺序，同一套 countInversions 单真源计算）
// =====================================================================
export const QUIZ_MODULES = {
  focus: { id: "focus", glyph: "●", title: "课程核心收获", desc: "6 周独立做出 3 套完整作品 · 适合零基础转行" },
  support: { id: "support", glyph: "■", title: "课程大纲与试看", desc: "18 节实战章节目录 + 2 分钟免费试看视频" },
  supplement: { id: "supplement", glyph: "▲", title: "讲师履历与背景", desc: "十年一线团队履历与开设本课程的初衷故事" },
  extend: { id: "extend", glyph: "≡", title: "常见问题与售后", desc: "回放有效期、发票开具与社群答疑规则" },
};

export const QUIZ_TARGET = ["focus", "support", "supplement", "extend"];

export const QUIZ_OPTIONS = [
  {
    key: "A",
    order: ["supplement", "focus", "support", "extend"],
    correct: false,
    reason: "把「讲师履历（▲）」排在了首位——这正是原海报里「先背景、后优势」的分散顺序。通勤用户点进来头 15 秒最想确认「我能学到什么」，核心收获却被压到了第 2 屏。",
  },
  {
    key: "B",
    order: ["focus", "supplement", "extend", "support"],
    correct: false,
    reason: "虽然把「核心收获（●）」提到了最前，但把最直接验证教学质量的「课程大纲与试看（■）」甩到了最底部，中间隔着讲师背景和售后条款，形成明显的起承断层。",
  },
  {
    key: "C",
    order: ["focus", "support", "supplement", "extend"],
    correct: true,
    reason: "严格沿着「重点收获（●）→ 关键大纲与试看（■）→ 讲师背景补充（▲）→ 售后扩展（≡）」单向推进，逆序 0 处：首屏直答价值、紧接用大纲建立信任，最后兜底常见疑问。",
  },
  {
    key: "D",
    order: ["support", "focus", "extend", "supplement"],
    correct: false,
    reason: "还没告诉读者「学完能获得什么结果（●）」，一上来先扔 18 节章节大纲（■），同时又把「售后问题（≡）」夹在「讲师背景（▲）」前面，节奏先重后散。",
  },
].map((opt) => {
  const inv = countInversions(opt.order, QUIZ_TARGET);
  return { ...opt, inversions: inv.count, adjacentBacktracks: inv.adjacentBacktracks };
});
