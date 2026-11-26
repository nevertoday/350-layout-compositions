// 132 单栏版式 — 单真源状态、真实折行核算、多解判定与教学标本

export const SPECIMENS = {
  book: {
    id: "book",
    label: "书刊特稿",
    en: "EDITORIAL ESSAY",
    kicker: "READING CORRIDOR · 出版排印试样",
    title: "为什么一页只排一栏，反而最耐读",
    lead: "当视线被两条安静的垂直边界轻轻拢住，眼睛不再反复权衡左右该先看哪一块，思考就能顺着段落的坡度一路沉下去。",
    subhead: "护城河与回扫角",
    body1: "翻开一本顺手的平装书，文字从来不顶到纸边。左右空出的留白不是浪费，而是挡住外界干扰的护城河；把每行字数收在舒适区间，读完行尾向左折返时，眼肌一眼就能接住下一行开头，不会串行。",
    body2: "如果把同一段话拉满整个宽屏，视线每回扫一次都要横跨半米，稍微分神就会重读同一行；反之把栏挤得过窄，眼睛像打字机一样来回折腾，完整句子被劈得支离破碎。",
    body3: "单栏并不等于把整张纸塞满黑字。留住合理的行距、在观点转折处添上一枚短小标题或圆点分隔，再把右侧晃眼的推荐卡片请出视野，读者就能像翻阅精装书页一样，沿着唯一一条垂直走廊安安静静地读到最后一行。",
    quote: "“单栏真正的力量不在塞满，而在用克制的宽度替读者清空分岔。”",
    sidebarTitle: "猜你喜欢",
    sidebarItems: ["热榜：10 个排版速成套路", "广告：限时字库五折包年", "相关：为什么海报越花越吸睛"],
  },
  mobile: {
    id: "mobile",
    label: "移动专题",
    en: "MOBILE DISPATCH",
    kicker: "THUMB SCROLL · 竖屏长文特辑",
    title: "拇指划过屏幕时，单栏顺着重力走",
    lead: "在口袋大小的屏幕上，人手只做一件事：向上轻推。单栏版式让信息沿着唯一纵轴接力出现，无需缩放或左右拖移。",
    subhead: "每屏一个落脚点",
    body1: "移动端单栏最怕变成密不透风的灰色长条。每隔两三段留出空白呼吸、加一枚简短小标题或圆点分隔，拇指停下时眼里刚好有歇脚处，阅读节奏才不会发闷。",
    body2: "把悬浮弹窗、侧边推荐和花哨多列清出主干，文章才能维持单一视线。哪怕在地铁晃动的光线里，读者也能顺着稳定的左齐边界一口气读到文末。",
    body3: "到了大屏平板或笔记本上，同样这套单栏正文只需要锁住最大栏宽，把多出来的横向像素还给两侧留白，就能延续手机上那种专心致志的纵读体验。",
    quote: "“小屏天然属于单栏，但节奏与边距仍需设计师亲手把关。”",
    sidebarTitle: "悬浮热推",
    sidebarItems: ["点击领取新人 50 元券", "大家都在搜：极速刷屏技巧", "关注博主解锁更多合集"],
  },
  form: {
    id: "form",
    label: "结账表单",
    en: "CHECKOUT FORM",
    kicker: "SINGLE-COLUMN FLOW · 顺序填写走廊",
    title: "确认收货信息",
    lead: "填写表单本质上是一次次顺序问答：视线垂直往下，每填完一格直接落向下一格，不必在左右两列之间来回猜顺序。",
    subhead: "配送与联系",
    fields: [
      { label: "收件人姓名", placeholder: "林青禾", width: 0.62 },
      { label: "手机号码", placeholder: "138 0013 8000", width: 0.68 },
      { label: "省 / 市 / 邮编（同一语义短组）", placeholder: "上海  ·  静安区  ·  200040", width: 0.92, group: true },
      { label: "详细街道门牌", placeholder: "愚园路 308 弄 12 号 402 室", width: 1.0 },
    ],
    cta: "核对无误，继续支付",
    sidebarTitle: "加购凑单",
    sidebarItems: ["再买 ¥29 享包邮特权", "限时换购：帆布手提袋 ¥19", "开通季卡立减 ¥15"],
  },
};

export const LIMITS = {
  minWidth: 0.24,
  maxWidth: 0.92,
  minLeading: 1.15,
  maxLeading: 2.3,
  // 垂直阅读舒适区（中文单栏经验值 + WCAG 1.4.8 ≤40 CJK 字上限）
  charsMin: 16,
  charsMax: 40,
  marginMin: 0.12, // 每侧留白护城河至少 12%
  leadingMin: 1.38,
  leadingMax: 2.1,
};

export function createInitialState() {
  return {
    specimen: "book",
    widthRatio: 0.88,    // 满屏超宽（~52 字/行，两侧留白仅 6%）
    leading: 1.2,        // 过紧糊墙
    layoutMode: "sidebar", // clean | sidebar | dual
    rhythm: "wall",      // wall | dots | breakout
    gazeActive: false,
  };
}

export const PRESETS = {
  classic: {
    label: "书刊经典解",
    kind: "good",
    patch: { widthRatio: 0.48, leading: 1.68, layoutMode: "clean", rhythm: "dots" },
  },
  editorial: {
    label: "长文破墙解",
    kind: "good",
    patch: { widthRatio: 0.56, leading: 1.72, layoutMode: "clean", rhythm: "breakout" },
  },
  compact: {
    label: "窄栏精读解",
    kind: "good",
    patch: { widthRatio: 0.40, leading: 1.56, layoutMode: "clean", rhythm: "dots" },
  },
  errWide: {
    label: "试错：满屏面条",
    kind: "bad",
    patch: { widthRatio: 0.90, leading: 1.24, layoutMode: "clean", rhythm: "wall" },
  },
  errNarrow: {
    label: "试错：过窄拉锯",
    kind: "bad",
    patch: { widthRatio: 0.25, leading: 1.60, layoutMode: "clean", rhythm: "dots" },
  },
  errSplit: {
    label: "试错：硬拆双栏",
    kind: "bad",
    patch: { widthRatio: 0.72, leading: 1.62, layoutMode: "dual", rhythm: "dots" },
  },
};

export function clampState(s) {
  return {
    ...s,
    widthRatio: Math.max(LIMITS.minWidth, Math.min(LIMITS.maxWidth, +Number(s.widthRatio).toFixed(3))),
    leading: Math.max(LIMITS.minLeading, Math.min(LIMITS.maxLeading, +Number(s.leading).toFixed(2))),
  };
}

// 单真源评估：接收画布真实测量出来的折行几何（平均满行字数、总行数、实绘栏宽 px、行高 px、是否表单）
export function evaluate(state, metrics) {
  const isForm = state.specimen === "form";
  const marginEach = Math.max(0, (1 - state.widthRatio) / 2);
  const marginPct = Math.round(marginEach * 100);
  const widthPct = Math.round(state.widthRatio * 100);

  const charsPerLine = metrics?.charsPerLine ?? Math.round(state.widthRatio * 58);
  const lineCount = metrics?.lineCount ?? 6;
  const colPx = metrics?.colPx ?? 560;
  const lineHPx = metrics?.lineHPx ?? 26;
  const compact = !!metrics?.compact;

  // 回扫仰角：行高与单行有效像素宽的反正切（示意眼动回扫倾角，越小越扁平、越易串行）
  const sweepDeg = Math.atan2(lineHPx, Math.max(40, colPx)) * (180 / Math.PI);

  // 逐项检出 6 类双向失误
  const issues = [];

  if (state.layoutMode === "sidebar") {
    issues.push({
      id: "sidebar",
      pillar: "viewline",
      severity: 100,
      short: "侧栏抢焦",
      title: "右侧浮卡扯断了单一视线",
      body: "单栏的核心本是清空旁路，把注意力拢在一条走廊里。现在右边多出一块推荐浮卡，眼睛每读两行就会被侧方噪点勾走，单一视线名存实亡。",
      hint: "直接点击画布里的红色「抢焦侧栏」卡片把它清出去，或切换到「纯净单栏」。",
      fixLabel: "清出抢焦侧栏",
      fixPatch: { layoutMode: "clean" },
    });
  } else if (state.layoutMode === "dual") {
    issues.push({
      id: "dual",
      pillar: "viewline",
      severity: 98,
      short: "双栏分叉",
      title: isForm ? "左右双栏让填写顺序来回打结" : "硬拆成双栏后，视线在两列间来回打架",
      body: isForm
        ? "Baymard 研究所的可用性测试发现，多栏交错表单会让用户猜不透该先填右边还是下面，容易漏填字段。把输入项收回单列，眼睛一路向下最稳。"
        : "你把走廊中线劈成了两栏：单栏原本省掉的「先看左还是先看右」成本重新冒了出来，长文连贯感被一刀切开（需要对照阅读请看 133 双栏版式）。",
      hint: "把结构切回「纯净单栏」，恢复自上而下的单一通道。",
      fixLabel: "恢复纯净单栏",
      fixPatch: { layoutMode: "clean" },
    });
  }

  // 栏宽与护城河校验（表单与长文分别按真实几何判断）
  const tooWideText = !isForm && charsPerLine > LIMITS.charsMax;
  const tooWideForm = isForm && state.widthRatio > 0.68 && !compact;
  const tooNarrowText = !isForm && charsPerLine < (compact ? 10 : LIMITS.charsMin);
  const tooNarrowForm = isForm && state.widthRatio < 0.30;
  const crampedMargin = marginEach < LIMITS.marginMin;

  if (tooWideText) {
    issues.push({
      id: "too-wide",
      pillar: "vertical",
      severity: 92,
      short: `超宽 ${charsPerLine} 字`,
      title: `每行拉到 ${charsPerLine} 字，回扫仰角扁到 ${sweepDeg.toFixed(1)}° 容易串行`,
      body: `WCAG 1.4.8 建议中文每行不超过 40 字。眼下这栏铺得太开，眼睛读完行尾往左折返要跨过整片屏幕，稍一晃神就会重读同一行或跳过下一行，两侧留白也被挤得只剩 ${marginPct}%。`,
      hint: "把画布里左右两条灰色虚线轨往中间拖，把单行字数收进 24–38 字区间。",
      fixLabel: "收束虚线栏宽至 52%",
      fixPatch: { widthRatio: 0.52 },
    });
  } else if (tooWideForm) {
    issues.push({
      id: "too-wide-form",
      pillar: "vertical",
      severity: 90,
      short: `表单过宽 ${widthPct}%`,
      title: `输入框横拉到 ${widthPct}% 纸宽，标签与填区脱节`,
      body: "姓名、手机号这类短信息被强行拉成横贯全屏的长条，眼睛要左右大跨度巡视才能确认填对了哪一格，两侧也没有稳住视线的留白护城河。",
      hint: "向内拖动双虚线栏轨，把表单走廊收束在 42%–60% 之间。",
      fixLabel: "收束表单栏宽至 50%",
      fixPatch: { widthRatio: 0.50 },
    });
  } else if (tooNarrowText || tooNarrowForm) {
    issues.push({
      id: "too-narrow",
      pillar: "vertical",
      severity: 88,
      short: isForm ? `过窄 ${widthPct}%` : `过窄 ${charsPerLine} 字`,
      title: isForm ? `栏宽挤到 ${widthPct}%，字段标签被迫折行截断` : `每行只剩 ${charsPerLine} 字，眼睛像打字机一样频繁折返`,
      body: isForm
        ? "单栏不是越细越好。栏宽缩得太窄，地址与省市区组合框施展不开，输入时左右局促，反而拖慢填写效率。"
        : "行宽压得太窄，完整意群还没读完就被迫换行，眼睛不停左右拉锯，大脑一直在拼碎片，连续阅读的流畅感彻底断掉。",
      hint: "把左右两条灰色虚线轨往外拉开一些，留出 20–36 字的舒适宽度。",
      fixLabel: "放宽栏轨至 50%",
      fixPatch: { widthRatio: 0.50 },
    });
  } else if (crampedMargin) {
    issues.push({
      id: "cramped-margin",
      pillar: "vertical",
      severity: 86,
      short: `护城河仅 ${marginPct}%`,
      title: `两侧留白只剩 ${marginPct}%，文字死顶边界发堵`,
      body: "单栏靠的不是把纸面铺满，而是用左右宽裕的留白护城河托住正文。边界贴到 12% 以内，整栏失去呼吸感，视线会被画框边缘刮擦。",
      hint: "把虚线轨往里收一点，让左右留白各超过 12%（宽屏建议 18%–30%）。",
      fixLabel: "腾出左右留白护城河",
      fixPatch: { widthRatio: compact ? 0.70 : 0.54 },
    });
  }

  if (state.leading < LIMITS.leadingMin) {
    issues.push({
      id: "tight-leading",
      pillar: "narrative",
      severity: 76,
      short: `行距过紧 ${state.leading.toFixed(2)}×`,
      title: `行距压到 ${state.leading.toFixed(2)}×，字行黏连成暗灰砖墙`,
      body: "单栏是连续纵读，上下行如果几乎挨在一起，眼球在行尾回扫时极易被上一行或下一行的笔画吸偏。WCAG 1.4.8 建议正文行距至少 1.5×。",
      hint: "把「行距」拉到 1.50×–1.85× 之间，给每条视线通道留出空气。",
      fixLabel: "拉开行距至 1.68×",
      fixPatch: { leading: 1.68 },
    });
  } else if (state.leading > LIMITS.leadingMax) {
    issues.push({
      id: "loose-leading",
      pillar: "narrative",
      severity: 72,
      short: `行距过散 ${state.leading.toFixed(2)}×`,
      title: `行距扯到 ${state.leading.toFixed(2)}×，相邻两行散成孤立标语`,
      body: "行间缝隙宽过头，段落不再作为一个整体被感知；读者每读完一行都要往下找半拍，连续叙事的绵密感被稀释掉了。",
      hint: "把「行距」收回到 1.50×–1.85× 的连续阅读区。",
      fixLabel: "收回行距至 1.68×",
      fixPatch: { leading: 1.68 },
    });
  }

  if (state.rhythm === "wall") {
    issues.push({
      id: "text-wall",
      pillar: "narrative",
      severity: 66,
      short: "无歇脚文字墙",
      title: "一路密排没有歇脚点，长栏读着发闷",
      body: "「连续叙事」不是把字砌成一整堵密墙。缺少小标题、原海报式的圆点分隔或引语呼吸，读者一眼望不到节奏锚点，中途最容易放弃。",
      hint: "把叙事节拍切到「圆点分节」或「配图破墙」，给纵读添上呼吸点。",
      fixLabel: "加上圆点分节节奏",
      fixPatch: { rhythm: "dots" },
    });
  }

  // 三枚原海报核心圆徽状态（垂直阅读 / 单一视线 / 连续叙事）
  const pVertical = !issues.some((i) => i.pillar === "vertical");
  const pViewline = !issues.some((i) => i.pillar === "viewline");
  const pNarrative = !issues.some((i) => i.pillar === "narrative");
  const score = (pVertical ? 1 : 0) + (pViewline ? 1 : 0) + (pNarrative ? 1 : 0);

  issues.sort((a, b) => b.severity - a.severity);
  const top = issues[0] || null;

  // 多组合法解名称识别
  let solutionName = "";
  if (score === 3) {
    if (isForm) solutionName = "顺序单栏表单解";
    else if (state.widthRatio <= 0.44) solutionName = "古典窄栏精读解";
    else if (state.rhythm === "breakout") solutionName = "杂志破栏长文解";
    else solutionName = "经典出版单栏解";
  }

  // 回扫负荷档位（明确标注示意，不装假精确）
  let sweepBand = "舒适（示意）";
  if (tooWideText || tooWideForm) sweepBand = "过扁易串行（示意）";
  else if (tooNarrowText || tooNarrowForm) sweepBand = "折返过密（示意）";
  else if (state.layoutMode !== "clean") sweepBand = "视线分叉（示意）";
  else if (state.leading < LIMITS.leadingMin || state.leading > LIMITS.leadingMax) sweepBand = "行间失衡（示意）";

  const pillars = {
    vertical: {
      ok: pVertical,
      badge: pVertical
        ? (isForm ? `单列 ${widthPct}%` : `${charsPerLine} 字/行`)
        : (issues.find((i) => i.pillar === "vertical")?.short || "待调"),
    },
    viewline: {
      ok: pViewline,
      badge: pViewline ? "纯粹无分叉" : (issues.find((i) => i.pillar === "viewline")?.short || "分叉"),
    },
    narrative: {
      ok: pNarrative,
      badge: pNarrative
        ? `${state.leading.toFixed(2)}× · ${state.rhythm === "breakout" ? "破栏节奏" : "圆点分节"}`
        : (issues.find((i) => i.pillar === "narrative")?.short || "无节奏"),
    },
  };

  return {
    score,
    ok: score === 3,
    solutionName,
    top,
    issues,
    pillars,
    widthPct,
    marginPct,
    charsPerLine,
    lineCount,
    sweepDeg: +sweepDeg.toFixed(1),
    sweepBand,
    statusTag: score === 3
      ? `3/3 · ${solutionName}`
      : `${score}/3 · ${top.short}`,
    summaryTitle: score === 3
      ? `${solutionName}已成立：视线顺着单一走廊稳稳往下`
      : top.title,
    summaryBody: score === 3
      ? (isForm
        ? `当前表单单列收在 ${widthPct}% 宽、两侧各留 ${marginPct}% 留白护城河，行距 ${state.leading.toFixed(2)}× 且零侧栏干扰。眼睛一路垂直填到底，省市区短组同排紧凑不打结。`
        : `实测每行约 ${charsPerLine} 字、两侧各留 ${marginPct}% 护城河、行距 ${state.leading.toFixed(2)}× 且无旁路干扰。读完行尾回扫倾角自然，段落间有清晰歇脚点——你也可以继续微调，试试别的合法宽度。`)
      : top.body,
    summaryHint: score === 3
      ? "可点「演播视线」看眼动光珠顺畅下行，或拖到极端宽度体验过宽串行与过窄拉锯。"
      : top.hint,
    fixLabel: score === 3 ? "演播一遍视线" : top.fixLabel,
    fixPatch: score === 3 ? null : top.fixPatch,
  };
}
