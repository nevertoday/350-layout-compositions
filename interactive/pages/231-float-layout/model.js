// 231 浮动布局（FLOAT LAYOUT）单一真源模型：
// 状态只存真实 CSS 属性参数；全部读数、5 项验收与诊断文案均从真实 DOM 实测坐标算出。

export const INITIAL_HERO_STATE = Object.freeze({
  floatDir: "left",      // "left" | "right" | "none"
  widthPct: 74,          // 16..80 (%)，初始 74% 过宽挤压正文
  marginPx: 0,           // 0 | 16 | 24 | 44，初始 0px 贴死文字
  contain: "none",       // "none" | "clearfix" | "flow-root"
  clearMode: "none",     // "none" | "left" | "right" | "both"
  showGuides: true,      // 叠加 2D Canvas 实测标尺与行盒轮廓
});

export const PRESET_STATES = Object.freeze({
  broken: { ...INITIAL_HERO_STATE },
  leftGood: {
    floatDir: "left",
    widthPct: 36,
    marginPx: 16,
    contain: "flow-root",
    clearMode: "both",
    showGuides: true,
  },
  rightMismatch: {
    floatDir: "right",
    widthPct: 38,
    marginPx: 16,
    contain: "flow-root",
    clearMode: "left",   // 经典错配：右浮却清左
    showGuides: true,
  },
  noFloat: {
    floatDir: "none",
    widthPct: 38,
    marginPx: 16,
    contain: "flow-root",
    clearMode: "both",
    showGuides: true,
  },
});

export const WIDTH_RANGE = { min: 16, max: 80, comfortMin: 24, comfortMax: 48 };
export const MARGIN_COMFORT = { min: 12, max: 28 };

export function clampWidth(v) {
  return Math.round(Math.max(WIDTH_RANGE.min, Math.min(WIDTH_RANGE.max, Number(v) || 36)));
}

/**
 * 结合真实 DOM 测量结果，核算 5 项原海报核心原则状态、主要诊断与实时 CSS。
 */
export function evaluateHero(state, m) {
  const narrowViewport = (m.tankW || 600) < 420;
  const minComfortChars = narrowViewport ? 6 : 10;
  const minComfortLinePx = narrowViewport ? 88 : 160;

  const isFloated = state.floatDir === "left" || state.floatDir === "right";

  // 1. 浮动占比与方向（既要开启左/右浮动，体量又不能喧宾夺主 > 48% 或过微 < 24%）
  const widthTooWide = state.widthPct > WIDTH_RANGE.comfortMax;
  const widthTooNarrow = state.widthPct < WIDTH_RANGE.comfortMin;
  const dirOk = isFloated && !widthTooWide && !widthTooNarrow;

  // 2. 文字环绕（开启浮动、形成真正旁侧环绕行、行宽不被挤成窄道）
  const lineTooTight = isFloated && (m.minLineChars < minComfortChars || m.minLineW < minComfortLinePx);
  const hasWrapLines = isFloated && m.wrapLines >= 1;
  const wrapOk = isFloated && hasWrapLines && !widthTooWide && !lineTooTight;

  // 3. 包裹留白（浮块外边距呼吸带 12–28px）
  const marginTooTight = state.marginPx < MARGIN_COMFORT.min;
  const marginTooLoose = state.marginPx > MARGIN_COMFORT.max;
  const marginOk = isFloated && !marginTooTight && !marginTooLoose;

  // 4. 父框防塌陷（真实 DOM 塌陷量 === 0 且父容器已建立清除护栏）
  const collapsed = m.collapsePx > 2;
  const containOk = !isFloated ? true : (!collapsed && state.contain !== "none");

  // 5. 恢复布局（后续章节条真正落到浮块下方，且方向匹配）
  const clearMatches =
    !isFloated
      ? true
      : state.clearMode === "both" ||
        (state.floatDir === "left" && state.clearMode === "left") ||
        (state.floatDir === "right" && state.clearMode === "right");
  const clearMismatch =
    isFloated &&
    ((state.floatDir === "left" && state.clearMode === "right") ||
      (state.floatDir === "right" && state.clearMode === "left"));
  const clearOk = isFloated && clearMatches && !m.nextIntruding;

  const checks = [
    {
      id: "direction",
      iconKey: state.floatDir === "right" ? "right" : state.floatDir === "none" ? "none" : "left",
      title: state.floatDir === "right" ? "右浮动" : "浮动方向",
      posterLabel: `float: ${state.floatDir}`,
      ok: dirOk,
      status: !isFloated
        ? "未浮动 · 断流"
        : widthTooWide
          ? `占 ${state.widthPct}% · 过宽失衡`
          : widthTooNarrow
            ? `占 ${state.widthPct}% · 过微失焦`
            : state.floatDir === "left"
              ? `贴左 ${state.widthPct}%`
              : `贴右 ${state.widthPct}%`,
    },
    {
      id: "wrap",
      iconKey: "wrap",
      title: "文字环绕",
      posterLabel: `${isFloated ? m.minLineChars : 0} 字/行`,
      ok: wrapOk,
      status: !isFloated
        ? "无环绕行"
        : lineTooTight
          ? `仅 ${m.minLineChars} 字 · 碎字烟囱`
          : widthTooWide
            ? `偏侧窄带 · ${m.minLineChars} 字/行`
            : `${m.minLineChars} 字/行 · 舒适`,
    },
    {
      id: "margin",
      iconKey: "box",
      title: "包裹留白",
      posterLabel: `margin ${state.marginPx}px`,
      ok: marginOk,
      status: !isFloated
        ? "未生效"
        : marginTooTight
          ? `${state.marginPx}px · 贴边窒息`
          : marginTooLoose
            ? `${state.marginPx}px · 过宽断离`
            : `${state.marginPx}px · 呼吸适中`,
    },
    {
      id: "contain",
      iconKey: "clear",
      title: "父框清浮",
      posterLabel: state.contain === "none" ? "未清浮" : state.contain === "flow-root" ? "flow-root" : "clearfix",
      ok: containOk,
      status: collapsed
        ? `塌陷 -${m.collapsePx}px`
        : state.contain === "none"
          ? "未设清浮护栏"
          : `包裹 ${Math.round(m.parentH)}px`,
    },
    {
      id: "clear",
      iconKey: "restore",
      title: "恢复布局",
      posterLabel: `clear: ${state.clearMode}`,
      ok: clearOk,
      status: !isFloated
        ? "普通流排列"
        : clearMismatch
          ? "方向错配 · 仍串台"
          : !clearOk
            ? "下节挤入侧边"
            : "已换行恢复",
    },
  ];

  const passCount = checks.filter((c) => c.ok).length;

  // 按严重优先级生成白话诊断与「为什么」+ 下一步建议
  let severity = "ok";
  let badge = `达标 · ${passCount} / 5`;
  let headline = "图文包裹、父框高度与后续避让全部到位";
  let body = `浮块占容器 ${state.widthPct}% 贴靠${state.floatDir === "left" ? "左" : "右"}缘，${state.marginPx}px 外边距替文字留出清晰气口，旁侧环绕行实测 ${m.minLineChars} 字/行（${Math.round(m.minLineW)}px）；父框以 ${state.contain === "flow-root" ? "display: flow-root" : "::after clearfix"} 稳稳撑到 ${Math.round(m.parentH)}px，下方小结块按 clear: ${state.clearMode} 干净换行。`;
  let hint = "你可以把浮块继续拉宽过 50% 体验文字被挤向边角，或点「试看右浮误清左」体验方向错配。";

  if (!isFloated) {
    severity = "error";
    badge = "错态 · 退出浮动";
    headline = "float: none 退回普通块流，文字环绕彻底消失";
    body = "普通块级元素会独占整行空间，朱红块旁出现大片空区，正文被迫整段掉到下方排队——这就退回了普通文档流，而不是浮动布局。";
    hint = "把「浮动方向」切回「左浮」或「右浮」，观察文字如何自动回流包裹。";
  } else if (collapsed || state.contain === "none") {
    severity = "error";
    badge = "错态 · 父框塌陷";
    headline = collapsed
      ? `父容器高度塌陷 ${m.collapsePx}px，深蓝虚线边框没包住浮块`
      : "父容器还没开启清除浮动，短文时随时会高度塌陷";
    body = collapsed
      ? `计算普通父框高度时，浏览器会忽略脱离块流的浮动子元素：实测父框仅高 ${Math.round(m.parentH)}px，朱红浮块底边硬生生捅出父框 ${m.collapsePx}px，正压进下方的外部版块。`
      : "此刻只是凑巧有后续 clear 块垫底撑开了外框；一旦去掉末尾清浮块或正文变短，父框就会立刻塌陷。";
    hint = "先将「父框清除」切到「flow-root」或「clearfix」，看深蓝虚线框当场向下弹开包住浮块。";
  } else if (clearMismatch) {
    severity = "error";
    badge = "错态 · 方向错配";
    headline = `浮块在${state.floatDir === "left" ? "左" : "右"}侧，clear: ${state.clearMode} 清不掉它`;
    body = `clear: left 只避让左浮动，clear: right 只避让右浮动。此刻朱红块是 float: ${state.floatDir}，下方「下一节小标题」只写了 clear: ${state.clearMode}，结果照样挤进浮块旁侧串台。`;
    hint = `把「下节避让 clear」改成「${state.floatDir}」或万能的「both」。`;
  } else if (!clearOk) {
    severity = "error";
    badge = "错态 · 后续串台";
    headline = "下一节小标题没设 clear，直接钻进了浮块旁边";
    body = "浮动的影响会一直向下延续，直到遇到足够长的正文或明确的 clear 声明。下方原本该另起一行的新小节，此刻被迫挤在浮块旁侧。";
    hint = `把「下节避让 clear」切到「${state.floatDir}」或「both」，让它稳稳落到浮块正下方。`;
  } else if (widthTooWide || lineTooTight) {
    severity = "error";
    badge = lineTooTight ? "错态 · 碎字烟囱" : "错态 · 浮块过宽";
    headline = lineTooTight
      ? `浮块占宽 ${state.widthPct}%，环绕文字被挤成 ${m.minLineChars} 字窄烟囱`
      : `浮块吃掉 ${state.widthPct}% 版宽，正文被压进 ${100 - state.widthPct}% 的偏侧窄带`;
    body = `留给文字行盒的实测净宽仅 ${Math.round(m.minLineW)}px（约 ${m.minLineChars} 字/行）。浮块超过容器一半宽度时，图文主次失衡且换行频次剧增（经验舒适带：浮块占宽 24%–48%）。`;
    hint = "直接向左拖动朱红 FLOAT 块本身，把占比收回到 24%–48% 的经验舒适带。";
  } else if (widthTooNarrow) {
    severity = "warn";
    badge = "偏微 · 失焦";
    headline = `浮块缩到仅占 ${state.widthPct}%，图块弱化成小邮票`;
    body = "过小的浮动图块在段落角落缺乏体量感，正文几乎退化成纯文本，失去了图文混排的视觉锚点（经验参考占比 24%–48%）。";
    hint = "向右拖动朱红 FLOAT 块，把宽度拉开到 30%–44% 左右。";
  } else if (marginTooTight) {
    severity = "warn";
    badge = "错态 · 贴边窒息";
    headline = `外边距仅 ${state.marginPx}px，文字行紧贴着朱红浮块边沿`;
    body = "浏览器只把浮块的 margin 外缘当成文字排斥线。margin 为 0 时，汉字笔画会直接贴在图块边沿，视觉上极易黏连（经验留白建议 12px–28px）。";
    hint = "把「包裹留白 margin」调到「16px」或「24px」，替文字与图块撑开舒适气口。";
  } else if (marginTooLoose) {
    severity = "warn";
    badge = "偏疏 · 图文断离";
    headline = `外边距拉到 ${state.marginPx}px，文字和浮块隔出一条鸿沟`;
    body = "过大的 margin 破坏了格式塔邻近关系，旁侧文字看起来像独立分栏而不是包裹图块，还白白挤窄了有效行宽。";
    hint = "把「包裹留白 margin」收回到「16px」或「24px」。";
  }

  const marginSide = state.floatDir === "left" ? `0 ${state.marginPx}px 12px 0` : state.floatDir === "right" ? `0 0 12px ${state.marginPx}px` : `0 0 12px 0`;
  const parentCss =
    state.contain === "flow-root"
      ? `.article-box { display: flow-root; }`
      : state.contain === "clearfix"
        ? `.article-box::after { content: ""; display: block; clear: both; }`
        : `.article-box { /* 未清除浮动 → 高度塌陷 */ }`;

  const cssCode = `${parentCss}
.float-block { float: ${state.floatDir}; width: ${state.widthPct}%; margin: ${marginSide}; }
.next-heading { clear: ${state.clearMode}; }`;

  return {
    checks,
    passCount,
    total: 5,
    severity,
    badge,
    headline,
    body,
    hint,
    cssCode,
    collapsed,
    clearMismatch,
  };
}

// ---------- 02 节：多浮块卡钩（Float Snag）模拟数据 ----------
export const SNAG_CARDS_DEFAULT = [
  { id: 1, tag: "01", title: "城市慢步指南", lines: 1, baseText: "沿旧城河岸步行三公里，串联四座百年石桥。", extraText: "附手绘街区地图与沿途独立书店开放时段备注，适合周末半日轻装探访。" },
  { id: 2, tag: "02", title: "活字印刷手记", lines: 2, baseText: "金属铅字排入字盘时，插图用木垫托起留空。", extraText: "当这张卡片多出一行摘要，高度立刻比左邻高出一截——下面第 4 张浮动卡片贴左滑动时就会被它底边死死钩住！" },
  { id: 3, tag: "03", title: "蓝图配色样本", lines: 1, baseText: "天蓝底配高反差朱红主块与深海军蓝重墨。", extraText: "参考 1960 年代瑞士建筑展手册的明快色阶配比。" },
  { id: 4, tag: "04", title: "行盒折行观察", lines: 1, baseText: "第 4 张卡本来应该回到最左侧另起新行。", extraText: "在 float 排布下它被上方伸出的高卡下沿卡住，左侧留下整块丑陋空洞。" },
  { id: 5, tag: "05", title: "清除浮动笔记", lines: 1, baseText: "只有每行高度完全一致，浮动多列才勉强对齐。", extraText: "实际业务中文案字数不可控，稍一折行就会触发阶梯错位。" },
  { id: 6, tag: "06", title: "现代替代建议", lines: 1, baseText: "多列卡片网格请直接交给 CSS Grid 或 Flexbox。", extraText: "无需清浮，自动按行拉齐底部基线。" },
];

// ---------- 05 节：历史演进时间轴数据（已逐条核实） ----------
export const TIMELINE_NODES = [
  {
    year: "1995–1997",
    era: "HTML 表现属性试验",
    title: "Netscape 扩展与 HTML 3.2 的 ALIGN",
    who: "Netscape Navigator / W3C HTML 3.2（Dave Raggett，1997 年 1 月）",
    desc: "早在 CSS 普及之前，浏览器为了模仿报刊杂志的「绕图排字（Runaround）」，引入了专有属性 <img align=\"left\">。1997 年 1 月 W3C 发布 HTML 3.2 推荐标准，正式收录 IMG ALIGN=\"LEFT|RIGHT\" 与用于打断环绕的 <br clear=\"all\">。",
    pain: "排版指令写死在 HTML 标签里，改一次图位要翻遍全站页面，结构与样式彻底混在一起。",
    code: `<img src="diagram.gif" align="left" hspace="14">\n<p>文字会自动沿图片右侧折行排列……</p>\n<br clear="all">`,
  },
  {
    year: "1996.12",
    era: "CSS1 正式定义 float",
    title: "W3C CSS1 第 5.5.25 节诞生",
    who: "Håkon Wium Lie & Bert Bos（1996 年 12 月 17 日 W3C Recommendation）",
    desc: "两位 CSS 奠基人在 CSS1 正式规范中写下 float: left | right | none 与 clear 属性，明确规定任何浮动元素都会自动按块级盒计算，并把文字环绕从 HTML 剥离到样式表里。",
    pain: "规范最初只为「插图配文字环绕」而生，并未预料后来整个互联网会拿它来搭多栏页面骨架。",
    code: `/* W3C CSS1 (1996-12-17) Section 5.5.25 */\nimg.figure {\n  float: left;\n  margin: 0 1em 0.5em 0;\n}`,
  },
  {
    year: "2004–2011",
    era: "浮动多栏与 Clearfix 时代",
    title: "从 Tony Aslett 到 Micro Clearfix 与媒体对象",
    who: "Tony Aslett · Nicole Sullivan (2010) · Nicolas Gallagher (2011) · CSS 2.1 (2011.6)",
    desc: "告别表格布局后、Grid 与 Flexbox 尚未成熟前，前端用 float 撑起了全网两栏、三栏与响应式栅格。Tony Aslett 首创无额外空标签的 :after 清浮法；2010 年 Nicole Sullivan 在 OOCSS 中总结出经典「Media Object」；2011 年 4 月 Nicolas Gallagher 精简出广为流传的 Micro Clearfix；同年 6 月 W3C 正式发布 CSS 2.1，以第 9.4.1 / 9.5 节定格了 BFC 与浮动规范。",
    pain: "父容器塌陷、不等高卡片卡钩（Float Snag）、无法垂直居中，全靠各种清浮黑魔法维持。",
    code: `/* Nicolas Gallagher · Micro Clearfix (2011) */\n.cf::before, .cf::after {\n  content: " ";\n  display: table;\n}\n.cf::after { clear: both; }`,
  },
  {
    year: "2014–NOW",
    era: "卸下重担，回归包裹初心",
    title: "display: flow-root 与 shape-outside",
    who: "W3C CSS Display Level 3 & CSS Shapes Module Level 1",
    desc: "随着 Flexbox 与 CSS Grid 接管一维队列和二维栅格，浮动终于卸下整页排版的苦役。CSS Display Level 3 给出了一行无副作用的 display: flow-root 取代老式 clearfix；CSS Shapes Level 1 的 shape-outside 让文字可以沿着正圆、多边形或图像透明轮廓自然环绕——这是 Flex 和 Grid 至今做不到的独门本领。",
    pain: "不再拿浮动拼页面骨架，只把它留给真正需要「文字随图形轮廓自由流淌」的编排。",
    code: `.editorial-card {\n  display: flow-root; /* 现代清浮，零副作用 */\n}\n.portrait {\n  float: left;\n  shape-outside: circle(50%);\n  shape-margin: 16px;\n}`,
  },
];

// ---------- 06 节：场景需求分诊器数据 ----------
export const TRIAGE_CASES = [
  {
    id: "editorial-wrap",
    label: "长文专访：正文环绕人物肖像或插图",
    verdict: "use",
    verdictText: "适合用浮动",
    reason: "正文必须先在图片旁侧排几行、过了图片底部再自然撑满全宽。这是 CSS 中唯有 float（配 shape-outside）能原生实现的排版行为。",
    css: `figure { float: left; width: 34%; margin: 0 20px 12px 0; }\narticle { display: flow-root; }`,
    linkText: "",
    linkUrl: "",
  },
  {
    id: "drop-cap",
    label: "杂志开篇：超大首字跨三行下沉",
    verdict: "use",
    verdictText: "适合用浮动",
    reason: "给 ::first-letter 或首字 span 施加 float: left 与微调行高，后续正文行盒自然绕着大号首字排列，过了首字底沿即恢复通栏。",
    css: `p::first-letter { float: left; font-size: 3.4em; line-height: 0.85; padding-right: 10px; }`,
    linkText: "",
    linkUrl: "",
  },
  {
    id: "card-grid",
    label: "电商商品卡：3 列不等高卡片网格",
    verdict: "avoid",
    verdictText: "别用浮动 · 改用 Grid",
    reason: "商品标题有的 1 行、有的 2 行，用 float 横排立刻触发 Float Snag 阶梯卡钩，还难以统一列距和等高底边。",
    css: `.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }`,
    linkText: "转看 227 网格布局",
    linkUrl: "https://layout.xiaoxiaodong.ai/227/play/",
  },
  {
    id: "media-object",
    label: "评论列表：左头像右正文且垂直居中对齐",
    verdict: "avoid",
    verdictText: "别用浮动 · 改用 Flexbox",
    reason: "当年 Nicole Sullivan 用 float + overflow: hidden 写媒体对象是无奈之举；今天用 Flexbox 一行就能让文字独立成列不折到头像下方，还能轻松垂直居中。",
    css: `.media { display: flex; align-items: center; gap: 14px; }`,
    linkText: "转看 226 弹性盒布局",
    linkUrl: "https://layout.xiaoxiaodong.ai/226/play/",
  },
  {
    id: "page-shell",
    label: "网站大骨架：侧边栏 + 主区 + 响应式重排",
    verdict: "avoid",
    verdictText: "别用浮动 · 改用 Grid / 响应式",
    reason: "浮动骨架必须精确扣减百分比和边框宽度，且很难在不改 HTML 顺序的情况下于移动端重排模块次序。",
    css: `.shell { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }`,
    linkText: "转看 240 响应式布局",
    linkUrl: "https://layout.xiaoxiaodong.ai/240/play/",
  },
  {
    id: "mobile-narrow",
    label: "390px 窄屏：左图右文留不下 10 个字",
    verdict: "avoid",
    verdictText: "窄屏撤销浮动",
    reason: "窄屏上强行保留浮动只会挤出每行三四个字的窄烟囱。应当在窄容器断点处用 float: none 让图片通栏落顶，正文舒适通读。",
    css: `@container (max-width: 420px) { figure { float: none; width: 100%; margin: 0 0 12px; } }`,
    linkText: "转看 242 容器查询布局",
    linkUrl: "https://layout.xiaoxiaodong.ai/242/play/",
  },
];

// ---------- 07 节：四选一实战练习（只差父容器一条 CSS 属性，纯中性标签） ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    cssLine: "display: block; overflow: visible;",
    cardClass: "quiz-card--a",
    correct: false,
    verdict: "父框高度塌陷",
    explain: "这是浏览器的默认行为。普通块容器计算自动高度时忽略内部的浮动缩略图，两行简介比缩略图矮，深蓝虚线底边直接切在半空，缩略图底截捅到了卡片外面。",
  },
  {
    id: "B",
    cssLine: "overflow: hidden;",
    cardClass: "quiz-card--b",
    correct: false,
    verdict: "探出角标被误裁",
    explain: "overflow: hidden 确实触发了 BFC、撑开了父卡片高度，但它的副作用是强行裁掉一切超出边框的内容——右上角探出边框 10px 的「精选」角标被硬生生切掉了一半。",
  },
  {
    id: "C",
    cssLine: "display: flow-root;",
    cardClass: "quiz-card--c",
    correct: true,
    verdict: "正解：完整包裹且零裁剪副作用",
    explain: "display: flow-root 是 CSS Display Level 3 专为此设计的现代标准：它让父卡片建立独立的块格式化上下文（BFC），把浮动缩略图稳稳算进父框高度里，同时保持溢出可见，右上角探出的「精选」角标毫发无损。",
  },
  {
    id: "D",
    cssLine: "clear: both;",
    cardClass: "quiz-card--d",
    correct: false,
    verdict: "用错了对象，父框依然塌陷",
    explain: "这是前端极常见的误区：clear 只管「当前元素之前」的兄弟浮动元素，对它自己肚子里的浮动子元素完全不起作用。给父卡片加 clear: both 后，父框照样塌陷。",
  },
];
