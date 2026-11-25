// 单一真源：W3C CSS Multi-column 伪算法、排版舒适带经验判定、以及全页各节共用数据。
// 所有读数、画布标尺与诊断文案均由此导出，确保画面与数字严格同源。

export const SHEET_LINE_HEIGHT = 1.65;

export const INITIAL_DESK_STATE = {
  // 纸幅占桌面工作台宽度的比例（手机与桌面略有微调以保证拉柄有充裕左右拖幅且初始为碎栏错态）
  sheetFrac: 0.64,
  mode: "count",       // "count" | "width" | "both"
  count: 4,            // 1..5
  colWidth: 210,       // px（用于 column-width / columns 简写）
  gapPx: 6,            // 4..64 px，初始 6px 低于行间空隙触发串行错态
  rule: false,         // column-rule 细竖分隔线
  spanAll: false,      // column-span: all 跨栏标题
  breakAvoid: false,   // break-inside: avoid 防图注卡截断
  showFlow: true,      // 原海报同款朱红流式阅读路径叠加
};

// W3C CSS Multi-column Layout Module Level 1 伪算法（https://www.w3.org/TR/css-multicol-1/#pseudo-algorithm）
export function computeMulticol(availableWidth, { mode = "count", count = 3, colWidth = 210, gapPx = 24 }) {
  const U = Math.max(120, availableWidth);
  const g = Math.max(0, gapPx);
  let N = 1;

  if (mode === "count") {
    N = Math.max(1, Math.round(count));
  } else if (mode === "width") {
    N = Math.max(1, Math.floor((U + g) / (colWidth + g)));
  } else {
    // columns: <colWidth> <count>（两者同设时取较小值，既保底宽又封顶栏数）
    const byWidth = Math.max(1, Math.floor((U + g) / (colWidth + g)));
    N = Math.max(1, Math.min(Math.round(count), byWidth));
  }

  const W = Math.max(24, (U - (N - 1) * g) / N);
  return { U, N, W, gapPx: g };
}

// 生成真实的 CSS 声明片段（与施加在 live DOM 上的规则严格一致）
export function buildCssSnippet(state) {
  const lines = [".article {"];
  if (state.mode === "count") {
    lines.push(`  column-count: ${state.count};`);
  } else if (state.mode === "width") {
    lines.push(`  column-width: ${state.colWidth}px;`);
  } else {
    lines.push(`  columns: ${state.colWidth}px ${state.count};`);
  }
  lines.push(`  column-gap: ${state.gapPx}px;`);
  if (state.rule) lines.push(`  column-rule: 1px solid #bfb8a8;`);
  lines.push(`}`);
  lines.push(`.article h3 { column-span: ${state.spanAll ? "all" : "none"}; }`);
  lines.push(`.article .callout { break-inside: ${state.breakAvoid ? "avoid" : "auto"}; }`);
  return lines.join("\n");
}

// 根据真实可用纸宽、字号、状态与 DOM 实测截断情况，算出四项达标与 6 类失误诊断
export function evaluateDesk(state, { innerWidthPx, fontSizePx, domSplit = false }) {
  const mc = computeMulticol(innerWidthPx, state);
  const charsPerLine = mc.W / fontSizePx;
  const leadingGapPx = (SHEET_LINE_HEIGHT - 1) * fontSizePx; // 约 0.65em 的行间净空
  const gapEm = state.gapPx / fontSizePx;
  const gapToLeading = state.gapPx / Math.max(1, leadingGapPx);

  // 经验阈值（文中明确标明为排版经验区间）
  // 1. 单栏字宽：汉字经验舒适带约 13–30 字/行；在极窄屏单栏退避时（N===1 且宽度受限于屏宽）不苛责过窄
  const tooNarrow = (mc.N > 1 && charsPerLine < 13) || charsPerLine < 10;
  const tooWide = charsPerLine > 32;
  const colOk = !tooNarrow && !tooWide;

  // 2. 栏距呼吸：当 N === 1 时无栏缝，需先检查是否处于合理分栏；当 N > 1 时，
  //    无分隔线要求栏距明显大于行间空隙（>= 1.1em 且 <= 2.6em）；有竖细线时可安全放宽至 >= 0.85em
  const minGapEm = state.rule ? 0.85 : 1.1;
  const maxGapEm = 2.6;
  const gutterTooTight = mc.N > 1 && gapEm < minGapEm;
  const gutterTooWide = mc.N > 1 && gapEm > maxGapEm;
  const gutterOk = mc.N === 1 ? colOk : (!gutterTooTight && !gutterTooWide);

  // 3. 跨栏标题：多栏时需 column-span: all 建立整版锚点（单栏时如未开仍提示补齐以防拉宽后困在首栏）
  const spanOk = Boolean(state.spanAll);

  // 4. 连续不断块：开启 break-inside: avoid 且 DOM 实测未劈成多片段
  const isActuallySplit = domSplit || (!state.breakAvoid && mc.N > 1);
  const breakOk = Boolean(state.breakAvoid) && !domSplit;

  const passed = [colOk, gutterOk, spanOk, breakOk].filter(Boolean).length;

  // 识别主要错因（6 类失误按阅读破坏优先级排序）
  let kind = "ok";
  let badge = "版面成立 · 4 / 4";
  let headline = `${mc.N} 栏每行约 ${charsPerLine.toFixed(1)} 字，栏距与层级平衡`;
  let reason =
    mc.N === 1
      ? `当前纸幅较窄，退回单栏保持每行约 ${charsPerLine.toFixed(1)} 个汉字，比强拆多栏更稳妥；拖宽纸幅再切多栏或「自动栏宽」看看流式切换。`
      : `单栏宽度落在约 13–30 字经验舒适带，${state.gapPx}px 栏距为行间净空的 ${gapToLeading.toFixed(1)} 倍，读者向下扫读顺畅不串行，跨栏主标与护航插块稳住整版节奏。`;
  let action = "试着继续左右拖右侧朱红拉柄，对比「固定栏数」与「自动栏宽」在窄幅下的差别。";

  if (tooNarrow) {
    kind = "narrow_cols";
    badge = `错版 · 碎条窄栏 (${passed}/4)`;
    headline = `强塞 ${mc.N} 栏后每行只剩约 ${charsPerLine.toFixed(1)} 个字`;
    reason = `当前纸内宽 ${Math.round(mc.U)}px 拆成 ${mc.N} 栏，每栏仅 ${Math.round(mc.W)}px，远低于汉字 13–30 字/行经验舒适带。眼睛刚看清半句话就被迫频繁换行回扫，段落碎成竖条。`;
    action = "把栏数减到 2–3 栏、切到「自动栏宽 210px」，或向右拖开纸幅拉柄。";
  } else if (tooWide) {
    kind = "wide_cols";
    badge = `错版 · 过宽长行 (${passed}/4)`;
    headline = `单栏行长飙到约 ${charsPerLine.toFixed(1)} 个字，回扫容易串行`;
    reason = `栏宽达到 ${Math.round(mc.W)}px（超 32 字经验上限）。行太长时，眼睛从行尾大幅左跳回下一行开头容易失去落点，重复读同一行或跳过一行——这正是宽屏需要分栏的原因。`;
    action = "切到 2–3 栏或启用「自动栏宽 210px」，把长行拆成轻松的竖向阅读通道。";
  } else if (gutterTooTight) {
    kind = "tight_gutter";
    badge = `错版 · 栏距串行 (${passed}/4)`;
    headline = `栏距 ${state.gapPx}px（${gapEm.toFixed(2)}em）过窄，视线横向跳进邻栏`;
    reason = `正文字号 ${fontSizePx}px、行高 ${SHEET_LINE_HEIGHT} 时的行间净空约 ${leadingGapPx.toFixed(1)}px；现在栏距只有它的 ${gapToLeading.toFixed(1)} 倍且${state.rule ? "竖线难兜底" : "没有竖分隔线"}。按格式塔邻近律，横向缝比纵向行空更近时，人眼会直穿栏缝把两栏连着读。`;
    action = "把栏距拉到 20–34px（约 1.3–2.2em），或补上「竖分隔线」清晰区隔左右两栏。";
  } else if (gutterTooWide) {
    kind = "wide_gutter";
    badge = `错版 · 栏距割裂 (${passed}/4)`;
    headline = `栏距 ${state.gapPx}px（${gapEm.toFixed(2)}em）太宽，版面裂成孤岛`;
    reason = `栏缝拉开到行间净空的 ${gapToLeading.toFixed(1)} 倍，白带比内容本身还抢眼。相邻两栏失去视觉归属感，对应原海报说的「过宽：割裂零散」。`;
    action = "把栏距收回到 18–36px（约 1.2–2.4em），让各栏既呼吸又彼此呼应。";
  } else if (!spanOk) {
    kind = "trapped_headline";
    badge = `待调 · 标题困在首栏 (${passed}/4)`;
    headline = "文章大标题被关在第一栏，整版缺少统领锚点";
    reason = "当主标题保持 column-span: none 时，它只能缩在首栏折成多行；第二、三栏像无头正文一样并排挂在旁边，读者难以一眼确认这几栏属于同一篇文章。";
    action = "把「跨栏标题」切为 column-span: all，让标题贯通整版并自动拉平下方各栏起点。";
  } else if (!breakOk) {
    kind = "split_block";
    badge = `待调 · 插块拦腰截断 (${passed}/4)`;
    headline = domSplit ? "引用图注卡正被多栏流从中间劈成两截" : "未开启防断块保护，插块随纸宽变化随时会被拦腰劈开";
    reason = "CSS 多栏默认把内容当成可任意切分的流水，没有 break-inside: avoid 时，引用框与小卡片会被截断在左栏底和右栏顶，破坏阅读连续性。";
    action = "开启「插块护航 break-inside: avoid」，让整张卡片作为完整单元顺流落位。";
  }

  // 汇总四枚原海报圆徽的实时短状态
  const checks = [
    {
      key: "col",
      label: "分栏",
      en: "COLUMN",
      ok: colOk,
      status: tooNarrow ? `${charsPerLine.toFixed(0)}字·过窄` : tooWide ? `${charsPerLine.toFixed(0)}字·过宽` : `${mc.N}栏·${charsPerLine.toFixed(0)}字`,
    },
    {
      key: "gutter",
      label: "栏距",
      en: "GUTTER",
      ok: gutterOk,
      status: mc.N === 1 ? "单栏无缝" : gutterTooTight ? `${state.gapPx}px·串行` : gutterTooWide ? `${state.gapPx}px·割裂` : `${state.gapPx}px·舒适`,
    },
    {
      key: "span",
      label: "跨栏",
      en: "SPANNING",
      ok: spanOk,
      status: spanOk ? "通排定锚" : "困在首栏",
    },
    {
      key: "break",
      label: "连贯",
      en: "CONTINUITY",
      ok: breakOk,
      status: breakOk ? "整块护航" : isActuallySplit ? "拦腰截断" : "易被截断",
    },
  ];

  return {
    ...mc,
    charsPerLine,
    leadingGapPx,
    gapEm,
    gapToLeading,
    tooNarrow,
    tooWide,
    gutterTooTight,
    gutterTooWide,
    colOk,
    gutterOk,
    spanOk,
    breakOk,
    isActuallySplit,
    passed,
    kind,
    badge,
    headline,
    reason,
    action,
    checks,
    css: buildCssSnippet(state),
  };
}

// ---------- 02 节：四个历史时代的版样对照数据 ----------
export const ERAS = {
  b42: {
    year: "约 1455",
    label: "1455 双栏圣经",
    title: "古腾堡《四十二行圣经》· 固定纸页双栏",
    summary: "约 1455 年美因茨印制的 B42 采用对称双栏、每栏精确 42 行。大开本如果通栏排满，单行会宽到难以扫回，拆成双栏既控制行长，又让左右页摊开形成四道齐整的垂直墨阵。",
    note: "介质特点：定宽定高羊皮纸/手工纸，栏高天然被整页高度锁死，读者只需由左栏扫到右栏再翻页。",
    cols: 2,
    linesPerCol: 9,
    spanBar: false,
    fluid: false,
    accent: "红蓝手绘首字 + 齐行双柱",
  },
  broadsheet: {
    year: "19–20 世纪",
    label: "广幅报刊多栏",
    title: "广幅大报（Broadsheet）· 多栏并行容纳长短稿",
    summary: "工业轮转印报机把纸幅推向半米以上，报刊用 5–8 道窄栏配通栏大标题（Banner Headline）组织版面：头条横跨多栏定焦，下方短讯与长报道按栏目各自向下流淌。",
    note: "介质特点：整版摊在桌面上一眼望穿，竖分隔细线帮读者在极窄的栏距里仍不串栏。",
    cols: 5,
    linesPerCol: 8,
    spanBar: true,
    fluid: false,
    accent: "通栏头条 + 极细竖栏线",
  },
  swiss: {
    year: "1981",
    label: "1981 瑞士网格",
    title: "米勒-布罗克曼《平面设计中的网格系统》",
    summary: "1981 年瑞士设计师 Josef Müller-Brockmann 在 Niggli 出版社系统阐述多栏与模块网格：栏宽、栏距（Gutter）与行距按数学比例咬合，文字和图片可以灵活跨 1 栏、2 栏或 3 栏组合。",
    note: "介质特点：从「单纯文字分栏」升级为「全版面通用坐标骨架」，直接启发后来的杂志与网页栅格。",
    cols: 3,
    linesPerCol: 7,
    spanBar: true,
    fluid: false,
    accent: "3 栏模块网格 + 比例栏距",
  },
  css: {
    year: "1999–今",
    label: "1999+ CSS 液态多栏",
    title: "W3C CSS Multi-column Layout · 随窗宽自动倾泻",
    summary: "1999 年 6 月 CSS 共同创始人 Håkon Wium Lie 提出最早的 CSS3 多栏草案，2001 年 1 月正式纳入 CSS3 模块，后经 Rachel Andrew 等编辑迭代。浏览器用 column-width 随容器宽度自动算栏数，无需手写断点。",
    note: "关键转折：屏幕没有「翻页」只有垂直滚动，所以 CSS 多栏必须克制高度，否则就会把读者困在上下往返滚屏里。",
    cols: 3,
    linesPerCol: 6,
    spanBar: true,
    fluid: true,
    accent: "columns: 200px 3 自动换栏",
  },
};

// ---------- 03 节：栏距 × 行距 4×4 矩阵判定 ----------
export const MATRIX_LEADINGS = [1.3, 1.5, 1.75, 2.0];
export const MATRIX_GAPS_EM = [0.5, 1.0, 1.75, 3.2];

export function evaluateMatrixCell(leading, gapEm, hasRule) {
  const fontPx = 15;
  const lineGapPx = (leading - 1) * fontPx;
  const gapPx = gapEm * fontPx;
  const ratio = gapPx / Math.max(1, lineGapPx);

  if (gapEm >= 3.0) {
    return {
      grade: "split",
      tag: "过宽割裂",
      ratio,
      gapPx,
      lineGapPx,
      verdict: `栏距 ${gapEm}em（${gapPx.toFixed(0)}px）达到行间净空的 ${ratio.toFixed(1)} 倍，中间白带把两栏劈成了两张互不相干的孤立小纸条。`,
    };
  }
  if (!hasRule && (ratio < 1.35 || gapEm < 1.0)) {
    return {
      grade: "slip",
      tag: "易横向串行",
      ratio,
      gapPx,
      lineGapPx,
      verdict: `行高 ${leading} 的行间净空有 ${lineGapPx.toFixed(1)}px，而无竖线时的 ${gapEm}em 栏距仅 ${gapPx.toFixed(1)}px（${ratio.toFixed(2)}×）。横向间隔没有明显拉大于纵向行空，视线容易直穿栏缝串到右栏。`,
    };
  }
  if (hasRule && gapEm < 0.8) {
    return {
      grade: "slip",
      tag: "文字贴线拥挤",
      ratio,
      gapPx,
      lineGapPx,
      verdict: `虽然加了竖分隔线挡住串行，但 ${gapEm}em（${gapPx.toFixed(1)}px）让左右两栏文字离中线仅剩约 ${(gapPx / 2).toFixed(1)}px，字角紧咬细线显得憋闷。`,
    };
  }
  return {
    grade: "good",
    tag: hasRule && gapEm === 1.0 ? "靠细线救回" : "清晰平衡",
    ratio,
    gapPx,
    lineGapPx,
    verdict:
      hasRule && gapEm === 1.0
        ? `1.0em 恰好是 W3C 规范的 column-gap: normal 基准值；搭配 1px 竖分隔线后，明确截断了横向误读，紧凑而不串行。`
        : `栏距 ${gapPx.toFixed(0)}px 为行间净空的 ${ratio.toFixed(1)} 倍：纵向行与行紧扣成列，横向两栏留出清晰呼吸道，顺着读绝不串行。`,
  };
}

// ---------- 04 节：三种 CSS 规则在不同宽度下的实算对比 ----------
export const DEVICE_WIDTHS = [
  { id: "phone", label: "320px 手机", width: 320 },
  { id: "half", label: "540px 半屏", width: 540 },
  { id: "tablet", label: "780px 平板", width: 780 },
  { id: "desktop", label: "1080px 桌面", width: 1080 },
];

export const CSS_STRATEGIES = [
  {
    id: "count",
    name: "固定栏数",
    code: "column-count: 3;",
    mode: "count",
    count: 3,
    colWidth: 200,
    gapPx: 24,
    formulaText: (w, r) => `强行固定 N = 3 → 单栏宽 = (${w} − 2×24) ÷ 3 = ${Math.round(r.W)}px`,
  },
  {
    id: "width",
    name: "最低栏宽",
    code: "column-width: 200px;",
    mode: "width",
    count: 99,
    colWidth: 200,
    gapPx: 24,
    formulaText: (w, r) => `N = max(1, floor((${w} + 24) ÷ (200 + 24))) = ${r.N} → 均分单栏 ${Math.round(r.W)}px`,
  },
  {
    id: "both",
    name: "保底又封顶（推荐）",
    code: "columns: 200px 3;",
    mode: "both",
    count: 3,
    colWidth: 200,
    gapPx: 24,
    formulaText: (w, r) => `N = min(3, floor((${w} + 24) ÷ 224)) = ${r.N} → 均分单栏 ${Math.round(r.W)}px`,
  },
];

// ---------- 06 节：溜溜球往返滚屏里程计算 ----------
export const YOYO_SCENARIOS = {
  short: {
    id: "short",
    label: "0.75 屏高（推荐）",
    colHeightScreens: 0.75,
    cols: 3,
    title: "整块多栏一眼收进单屏内",
    explain: "所有 3 栏全部落在视口可见范围内。读完第一栏底部，视线轻轻右上抬眼就能接住第二栏顶部，零往返滚屏。",
    verdict: "适合导读、目录、摘要与印刷感卡片区",
    ok: true,
  },
  medium: {
    id: "medium",
    label: "1.8 屏高（费劲）",
    colHeightScreens: 1.8,
    cols: 3,
    title: "读完一栏得滚回顶，再滚下来",
    explain: "每栏比视口高出 0.8 屏。读完第 1 栏底后，手指必须反向往上滚 0.8 屏才能看到第 2 栏第一行，三栏共经历 2 次折返爬楼。",
    verdict: "阅读心流被打断，容易找不到接续点",
    ok: false,
  },
  tall: {
    id: "tall",
    label: "3.2 屏高（灾难）",
    colHeightScreens: 3.2,
    cols: 3,
    title: "典型的「溜溜球滚屏」反模式",
    explain: "3 栏各 3.2 屏高时，为读完一篇内容，读者要在同一页上「下滚 2.2 屏 → 上滚 2.2 屏 → 下滚 2.2 屏 → 上滚 2.2 屏 → 再下滚 2.2 屏」，总滚屏路程暴涨。",
    verdict: "长篇网页正文请改用单栏配舒适行长",
    ok: false,
  },
};

export function computeYoyoTravel(scenario) {
  const excess = Math.max(0, scenario.colHeightScreens - 1);
  // 下滚读每栏 + 栏间折返上滚
  const downSteps = scenario.cols * excess;
  const upSteps = Math.max(0, scenario.cols - 1) * excess;
  const totalScreens = +(downSteps + upSteps).toFixed(1);
  const returns = excess > 0 ? scenario.cols - 1 : 0;
  return { excess, totalScreens, returns };
}

// ---------- 07 节：单变量小练习（只变 column-gap） ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    gapPx: 6,
    gapEm: "0.40em",
    correct: false,
    title: "方案 A",
    meta: "column-gap: 6px",
    feedback: "6px（0.40em）比 15px / 1.65 行高产生的 9.8px 行间净空还要窄。没有竖分隔线时，左右两栏文字贴得比上下两行还近，读者极易横穿栏缝串读到隔壁栏。",
  },
  {
    id: "B",
    gapPx: 10,
    gapEm: "0.67em",
    correct: false,
    title: "方案 B",
    meta: "column-gap: 10px",
    feedback: "10px（0.67em）看似落在原海报小贴士说的「1/2 ~ 1 倍字号」里，但它几乎等于本版 9.8px 的行间净空！在没有竖分隔线的情况下，横向栏距和纵向行空一样宽，视觉分组信号打架，仍然容易串行。",
  },
  {
    id: "C",
    gapPx: 26,
    gapEm: "1.73em",
    correct: true,
    title: "方案 C",
    meta: "column-gap: 26px",
    feedback: "选对了！26px（1.73em）约为行间净空的 2.6 倍：既让每栏内部的上下行牢固抱团、杜绝横向串行，又让 3 栏各自保留约 222px（约 15 字/行）的舒展宽度，整版呼吸匀称。",
  },
  {
    id: "D",
    gapPx: 64,
    gapEm: "4.27em",
    correct: false,
    title: "方案 D",
    meta: "column-gap: 64px",
    feedback: "64px（4.27em）超过行间净空的 6.5 倍，两道宽白沟把版面硬生生劈成三条疏离的窄条，整体感散架，也白白挤窄了每栏的可读宽度。",
  },
];
