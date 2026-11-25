// 228 子网格布局 · 统一状态与实测诊断引擎
// 原则：开场玩具、四枚原海报徽标、深松绿诊断卡与 2D Canvas 标尺层全部共读同一份状态与 DOM 实测结果。

export const INITIAL_HERO_STATE = Object.freeze({
  wideFr: 2.2,        // 父网格宽列权重（1fr : wideFr : 1fr : wideFr），范围 1.0–3.0
  colMode: "indep",   // "indep" (独立 1fr 1fr) | "subgrid"
  rowMode: "indep",   // "indep" (独立 auto 1fr auto) | "subgrid"
  rowSpan: 1,         // 1 | 2 | 3（仅在 rowMode === "subgrid" 时触发真实跨度决定是否折叠）
  subGap: "inherit",  // "inherit" | "zero"
  copyPreset: "dLong" // "balanced" | "dLong" | "eLong"
});

export const COPY_PRESETS = {
  balanced: {
    label: "短题对照",
    dTitle: "数据概览",
    dBody: "季度营收与活跃度折线同轨对齐，方便横向扫读。",
    eTitle: "核心观点",
    eBody: "系统状态稳定，各项指标维持正常波动区间。"
  },
  dLong: {
    label: "D 塞入长题",
    dTitle: "跨季度多维营收概览\n同比折线拆解\n与区域渠道对比",
    dBody: "D 标题折成三行，未用行子网格时会把下方正文起点独自顶低。",
    eTitle: "核心观点",
    eBody: "E 标题仅占一行，兄弟卡片的横线立刻高低参差。"
  },
  eLong: {
    label: "E 塞入长文",
    dTitle: "数据概览",
    dBody: "较短摘要：观察左侧模块底栏是否同步下移。",
    eTitle: "多层级嵌套协同报告\n双向撑大父行轨验证",
    eBody: "向 E 区域写入更长的说明正文后，开启行子网格时这段文字会反向撑大父网格第 3 条行轨，同步把 D 模块底栏一起推齐，而不是只顾自己撑开。"
  }
};

export const FR_MIN = 1.0;
export const FR_MAX = 3.0;

export function clampFr(v) {
  const n = Math.round(Math.min(FR_MAX, Math.max(FR_MIN, Number(v) || 2.0)) * 20) / 20;
  return Number(n.toFixed(2));
}

export function formatFr(v) {
  return `${Number(v).toFixed(2).replace(/\.00$/, ".0")}fr`;
}

// 根据真实 DOM 测得的像素坐标，产出唯一真源的诊断结论与四枚徽标状态
export function diagnoseHero(state, metrics) {
  const colDrift = Math.round(metrics.colDriftPx || 0);
  const rowDrift = Math.round(metrics.rowDriftPx || 0);
  const overlaps = metrics.overlapCount || 0;
  const colAligned = state.colMode === "subgrid" && colDrift <= 2;
  const rowNoCollapse = state.rowMode === "subgrid" && state.rowSpan === 3 && overlaps === 0;
  const rowAligned = rowNoCollapse && rowDrift <= 2;
  const gapClean = state.subGap === "inherit";
  const nearOneToOne = Math.abs(state.wideFr - 1.0) < 0.08;

  // 原海报四枚关键词圆徽的实时状态
  const badges = {
    inherit: state.colMode === "subgrid" && state.rowMode === "subgrid",
    align: colAligned && rowAligned,
    nested: rowNoCollapse && state.colMode === "subgrid",
    coord: colAligned && rowAligned && gapClean
  };
  const score = Object.values(badges).filter(Boolean).length;

  let level = "error"; // "error" | "warn" | "ok"
  let tag = "错态 · 独立嵌套";
  let headline = "";
  let body = "";
  let nextTip = "";

  if (state.rowMode === "subgrid" && state.rowSpan < 3) {
    level = "error";
    tag = `错态 · 跨度不足（span ${state.rowSpan}）`;
    headline = `子网格无隐式轨：3 层内容被压叠进 ${state.rowSpan} 条父行轨`;
    body = `CSS Grid Level 2 规定，子网格只能使用自己实际跨过的父轨道，不会像普通网格那样自动补行。现在模块只跨了 ${state.rowSpan} 行，多出来的内部区块直接被压进同一条轨道互相重叠（实测重叠 ${Math.max(1, overlaps)} 处）。`;
    nextTip = "把「父行跨度」切到 span 3，为标题、正文、底栏留足 3 条父行轨。";
  } else if (state.colMode !== "subgrid" && state.rowMode !== "subgrid") {
    level = "error";
    if (nearOneToOne && colDrift <= 2) {
      tag = "错态 · 1:1 巧合假象";
      headline = `列线只是 1:1 巧合撞上，行线已错开 ${rowDrift}px`;
      body = "你把父轨道拖到了 1fr : 1fr，恰好和子模块内部写死的 1fr 1fr 相同，所以纵线暂时碰巧对齐；只要拖动父轨比例尺，立刻脱钩。同时 D/E 各自算行高，横线仍未对齐。";
      nextTip = "拖开父轨比例验证脱钩，再同时打开「列 subgrid」与「行 subgrid + span 3」。";
    } else {
      tag = "错态 · 嵌套断层";
      headline = `列轨脱钩 Δ${colDrift}px，兄弟行线高低错开 Δ${rowDrift}px`;
      body = "父网格定义了不对称列轨，但轨道止步于 D、E 两层包裹壳之外。内部各按 1fr 1fr 与独立行高排布，导致纵线对不上顶栏 A/B，D 的多行标题也把正文起点独自往下顶偏。";
      nextTip = "先切「列轨道 → subgrid」打通纵线，再配「行轨道 → subgrid」与「span 3」锁齐横线。";
    }
  } else if (state.colMode === "subgrid" && state.rowMode !== "subgrid") {
    level = "warn";
    tag = "半通 · 仅锁列轨";
    headline = `纵线已穿轨（Δ${colDrift}px），但 D/E 横线仍错开 Δ${rowDrift}px`;
    body = "拖动上方父轨比例尺时，D1/D2 与 E1/E2 已紧紧咬住 A/B 垂线；但行方向仍是独立网格，D 与 E 谁的文案多折一行，谁的正文起点和底栏就跟着漂移。";
    nextTip = "打开「行轨道 → subgrid」，并确保「父行跨度」给足 span 3。";
  } else if (state.colMode !== "subgrid" && state.rowMode === "subgrid") {
    level = "warn";
    tag = "半通 · 仅锁行轨";
    headline = nearOneToOne
      ? "横线已同步，列线仅因 1:1 巧合暂齐"
      : `横线已同步（Δ${rowDrift}px），列分界仍偏离父轨 Δ${colDrift}px`;
    body = "D 与 E 已经共享父网格的 3 条行轨，文案再长也能横向拉齐；但列方向还是子模块自己写的 1fr 1fr，父轨比例一变，上下两层的竖缝立刻断层。";
    nextTip = "把「列轨道」也切为 subgrid，让竖向比例随父网格联动。";
  } else if (!gapClean) {
    level = "warn";
    tag = "注意 · 沟槽被覆写";
    headline = "双轴轨道已继承，但 gap: 0 抹掉了子网格呼吸沟槽";
    body = "Subgrid 默认继承父网格的沟槽宽度；手动覆写 gap: 0px 后，外边界仍贴紧父轨，但内部卡片彼此粘连、内缝与父网格 A/B 之间的缝隙宽度脱节。";
    nextTip = "把「子网格沟槽」切回「继承父 gap」，恢复全页统一的缝隙节律。";
  } else {
    level = "ok";
    tag = "4/4 穿轨锁定";
    headline = `双轴严丝合缝：列差 ${colDrift}px · 行差 ${rowDrift}px`;
    body = "嵌套包裹层不再挡路：列方向跟随父网格 1fr : " + formatFr(state.wideFr) + " 实时联动，行方向由子内容反向撑大父轨，D 与 E 的标题、正文、底栏始终踩在同一套交点上。";
    nextTip = "试着继续拖动上方比例尺，或切换「D 塞入长题 / E 塞入长文」检验双向同步。";
  }

  const cssPreview = [
    `.parent { grid-template-columns: 1fr ${formatFr(state.wideFr)} 1fr ${formatFr(state.wideFr)}; gap: 12px; }`,
    `.module { grid-column: span 2; grid-row: span ${state.rowMode === "subgrid" ? state.rowSpan : 3}; display: grid;`,
    `  grid-template-columns: ${state.colMode === "subgrid" ? "subgrid" : "1fr 1fr"};`,
    `  grid-template-rows: ${state.rowMode === "subgrid" ? "subgrid" : "auto 1fr auto"};${state.subGap === "zero" ? " gap: 0;" : ""} }`
  ].join("\n");

  return { level, tag, headline, body, nextTip, badges, score, colDrift, rowDrift, overlaps, cssPreview };
}

// 02 节：单轴与双轴 2×2 组合解说
export const AXIS_MODES = {
  none: {
    title: "双轴独立（普通嵌套 Grid）",
    code: "grid-template-columns: 1fr 1fr;\ngrid-template-rows: auto 1fr auto;",
    note: "嵌套卡片完全看不到父网格。父列比例变动时内部列不动；兄弟卡片标题变长时，水平分隔线也各自高低不一。",
    colLocked: false,
    rowLocked: false
  },
  col: {
    title: "仅列子网格（宏观版面最常用）",
    code: "grid-column: span 2;\ngrid-template-columns: subgrid;\ngrid-template-rows: auto auto;",
    note: "纵向紧紧钉死在全页列轨上（比如杂志页眉、正文与侧栏共用 12 列主骨架），同时允许模块内部的行按各自内容自由增减，不怕条目数变化。",
    colLocked: true,
    rowLocked: false
  },
  row: {
    title: "仅行子网格（卡片组最常用）",
    code: "grid-row: span 3;\ngrid-template-rows: subgrid;\ngrid-template-columns: 1fr;",
    note: "电商、文档或作品集卡片组的头号利器：各卡左右宽度各自独立，但跨卡的「标题 / 摘要 / 价格与按钮」三条横线被同一套父行轨锁死齐平。",
    colLocked: false,
    rowLocked: true
  },
  both: {
    title: "双轴子网格（二维精密模块）",
    code: "grid-column: span 2; grid-row: span 3;\ngrid-template-columns: subgrid;\ngrid-template-rows: subgrid;",
    note: "对应原海报里的 D 模块与 C 区域：行列全部继承自父网格。适合结构固定的仪表盘与印刷级版式，但前提是父网格明确定义两轴轨道且子项数量固定。",
    colLocked: true,
    rowLocked: true
  }
};

// 04 节：核实后的规范演进里程碑
export const TIMELINE_ITEMS = [
  {
    year: "2017",
    date: "2017 年 3 月",
    badge: "Level 1 暂缓",
    title: "Grid Level 1 落地，Subgrid 暂留二级",
    body: "CSS Grid Layout Level 1 同步在 Firefox、Chrome、Safari 上线，网页第一次拥有原生二维网格。早期草案原本包含 subgrid，但嵌套轨道尺寸双向回传的算法极其复杂；W3C CSS 工作组决定先砍出 Level 1 尽快交付，把 subgrid 移入二级规范单独打磨。",
    hack: "当时前端的妥协：要么把卡片拆散压平丢掉语义标签，要么写死 min-height 硬赌标题不会折成三行。"
  },
  {
    year: "2018",
    date: "2018 年 2 月 6 日",
    badge: "W3C 首稿",
    title: "CSS Grid Level 2 首个公开工作草案发布",
    body: "W3C 发布 CSS Grid Layout Module Level 2 首个公开工作草案（编辑：Tab Atkins Jr.、Elika J. Etemad / fantasai、Rossen Atanassov，后续加入 Oriol Brufau），专门定义 subgrid 的单轴/双轴继承、沟槽继承与命名线穿透规则。同期 Rachel Andrew（Grid by Example）与 Jen Simmons（Layout Land）持续以真实组件案例推动社区讨论。",
    hack: "规范关键转向：不再强制嵌套网格同时锁定两轴，允许只写 columns: subgrid 或只写 rows: subgrid，大幅提升了实战可用性。"
  },
  {
    year: "2019",
    date: "2019 年 12 月 3 日",
    badge: "Firefox 71",
    title: "Gecko 引擎率先上线原生 Subgrid",
    body: "Firefox 71 正式发布 CSS Subgrid，成为首个实现二级规范的浏览器，并同步升级开发者工具 Grid Inspector 以双色虚线标示父网格与子网格交点。2020 年 8 月 18 日，规范进入 W3C 候选推荐标准快照（CR Snapshot）。",
    hack: "此后近三年间，开发者主要通过 @supports (grid-template-rows: subgrid) 做渐进增强。"
  },
  {
    year: "2022",
    date: "2022 年 9 月 12 日",
    badge: "Safari 16",
    title: "WebKit 在 Safari 16.0 补齐支持",
    body: "随着 iOS 16 与 macOS 平台更新，Safari 16.0 正式原生支持 CSS Subgrid，三大浏览器引擎已有两家打通，社区聚焦 Chromium 的实现进度。",
    hack: "微软 Edge 团队与 Google 工程师随后在 Blink 的 LayoutNG 网格架构上协作攻坚子网格算法。"
  },
  {
    year: "2023",
    date: "2023 年 9 月 12 日",
    badge: "Baseline 2023",
    title: "Chrome 117 / Edge 117 齐步，全员可用",
    body: "Chrome 117 与 Edge 117 稳定版上线 CSS Subgrid，至此 Gecko、WebKit、Blink 三大引擎全线贯通，正式纳入 Web 平台 Baseline 2023 广泛可用基线，无需 hack 即可用于生产环境。",
    hack: "今天的标准写法：语义卡片壳保留边框与背景，加一行 grid-row: span N + grid-template-rows: subgrid 即可跨卡齐平。"
  }
];

// 06 节：交互式代码行高亮解说
export const CHEAT_LINES = [
  {
    id: "parent-cols",
    zone: "parent",
    code: "grid-template-columns: [edge-l] 1fr [mid] 2fr [edge-r];",
    title: "父网格定义轨道与命名线",
    desc: "全局只需在父容器里算一次列宽比例（1fr 2fr）并给关键线起名；子模块永远不必复制这份数字。"
  },
  {
    id: "parent-gap",
    zone: "gap",
    code: "gap: 16px;",
    title: "父沟槽默认向下传递",
    desc: "子网格会自动继承父网格的 16px 沟槽，保证页面外缝与卡片内缝属于同一套模数；确实需要时才在子容器覆写。"
  },
  {
    id: "child-span",
    zone: "span",
    code: "grid-column: edge-l / edge-r; grid-row: span 3;",
    title: "关键前置：先向父网格申领跨度",
    desc: "原海报速查里为了精简省略了这一行，但实战绝不能省！Subgrid 不会生成隐式轨，内部有 3 行就必须先 span 3。"
  },
  {
    id: "child-subgrid",
    zone: "subgrid",
    code: "display: grid; grid-template-columns: subgrid; grid-template-rows: subgrid;",
    title: "开启子网格继承",
    desc: "把这两轴设为 subgrid 后，孙级元素直接落进父网格的轨道槽里；如果只需卡片横向齐平，也可只写 rows: subgrid。"
  },
  {
    id: "local-name",
    zone: "named",
    code: "grid-template-columns: subgrid [card-l] [split] [card-r];",
    title: "穿透父线名，并叠加本地别名",
    desc: "子网格不仅能直接用父网格的 [mid] 线名定位，还能在 subgrid 后追加方括号别名；同时子网格里的 1 / -1 永远指代子网格自身起止边。"
  }
];

// 07 节：小练习四套方案（纯中性标签 A/B/C/D，仅差一个变量）
export const QUIZ_OPTIONS = {
  A: {
    correct: false,
    title: "方案 A · 漏写了父行跨度（span 1 坍塌）",
    detail: "只写了 grid-template-rows: subgrid 却没给卡片声明 grid-row: span 3。因为子网格不会自动创建隐式行轨，标题、简介、按钮三层全部被压叠在第 1 条父行轨里互相遮挡。"
  },
  B: {
    correct: false,
    title: "方案 B · 独立网格 auto 1fr auto 的错觉",
    detail: "极具迷惑性的常见写法！靠中间 1fr 弹性区确实把三张卡的底栏推到了同一底边，但抬头看绿虚线：中间卡片两行标题把简介起点向下顶低了 18px，三张卡的标题底线与简介起线并不对齐。"
  },
  C: {
    correct: true,
    title: "方案 C · 正确！grid-row: span 3 + rows: subgrid",
    detail: "每张卡向父网格申领 3 条行轨并开启行子网格：卡片外框、圆角、底色与内边距完整保留，同时中间卡的两行标题反向撑大第 1 条父行轨，带着左右两张卡的标题底线、简介起线与底栏全部零偏差对齐。"
  },
  D: {
    correct: false,
    title: "方案 D · display: contents 抹掉了卡片外壳",
    detail: "display: contents 虽然让孙级元素直接跳出来参与父网格排布，但同时把卡片自身的盒子拆掉了——背景色、边框、内边距与整卡阴影全部消失，变成散落的独立网格单元。"
  }
};
