// 292 · 列下落模式 — 单一真源几何与诊断模型
// 所有画布坐标、列宽、断点落列、落差坡度、焦点逆跳数与诊单白话均由 evaluate() 统一算出。

export const VIEWPORT_MIN = 360;
export const VIEWPORT_MAX = 1280;
export const MIN_COL_MIN = 120;
export const MIN_COL_MAX = 420;
export const COMFORT_MIN_W = 215; // 经验最低可读列宽（px）
export const PREMATURE_MAX_W = 335; // 经验阈值上限（过高会导致宽屏过早塌陷）

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 四列阶梯",
    short: "原海报",
    summary: "列下落模式通过不等高的列块排列，形成由高到低的视觉动线，自然引导信息的阅读顺序，突出重点，增强信息组织力。",
    columns: [
      { id: 0, isPrimary: true, glyph: "列", en: "COLUMN", zh: "列序", body: "元素按列排列，形成视觉秩序。", fill: "#C4D226", ink: "#1A1D1C", muted: "#2F3508", cap: "#C4D226" },
      { id: 1, isPrimary: false, glyph: "下", en: "DROP", zh: "落差", body: "通过高度变化，建立层级与焦点。", fill: "#EAE6E0", ink: "#1A1D1C", muted: "#47443E", cap: "#EAE6E0" },
      { id: 2, isPrimary: false, glyph: "落", en: "RHYTHM", zh: "节奏", body: "高低错落，形成节奏感与流动感。", fill: "#C4D226", ink: "#1A1D1C", muted: "#2F3508", cap: "#C4D226" },
      { id: 3, isPrimary: false, glyph: "模式", en: "PATTERN", zh: "模式", body: "可重复、可延展的版式结构方法。", fill: "#F0761F", ink: "#1A1D1C", muted: "#401C04", cap: "#F0761F" },
    ],
  },
  news: {
    id: "news",
    label: "三栏资讯站",
    short: "资讯站",
    summary: "新闻与深度报道页在宽屏并排主稿、目录、短评与推荐；收窄时次要栏逐级下落，主稿始终稳居高位。",
    columns: [
      { id: 0, isPrimary: true, glyph: "主", en: "LEAD", zh: "头条主稿", body: "核心深度报道与图表，窄屏须稳居顶部。", fill: "#C4D226", ink: "#1A1D1C", muted: "#2F3508", cap: "#C4D226" },
      { id: 1, isPrimary: false, glyph: "目", en: "INDEX", zh: "章节目录", body: "导览锚点与导读摘要，中屏随主栏并排。", fill: "#EAE6E0", ink: "#1A1D1C", muted: "#47443E", cap: "#EAE6E0" },
      { id: 2, isPrimary: false, glyph: "评", en: "NOTES", zh: "编者短评", body: "延伸批注与背景卡片，平板收窄后先落。", fill: "#C4D226", ink: "#1A1D1C", muted: "#2F3508", cap: "#C4D226" },
      { id: 3, isPrimary: false, glyph: "荐", en: "MORE", zh: "往期推荐", body: "相关专题列表，最先落至底层收束。", fill: "#F0761F", ink: "#1A1D1C", muted: "#401C04", cap: "#F0761F" },
    ],
  },
  catalog: {
    id: "catalog",
    label: "多维产品目录",
    short: "产品目录",
    summary: "产品参数与服务目录按决策权重分列；先看核心规格再读补充条款，屏宽不足时低权重列依次落到底部。",
    columns: [
      { id: 0, isPrimary: true, glyph: "核", en: "CORE", zh: "核心参数", body: "主力规格与价格定位，锁定视觉起点。", fill: "#C4D226", ink: "#1A1D1C", muted: "#2F3508", cap: "#C4D226" },
      { id: 1, isPrimary: false, glyph: "配", en: "SPECS", zh: "硬件配置", body: "屏幕尺寸、芯片与接口明细，紧贴主栏。", fill: "#EAE6E0", ink: "#1A1D1C", muted: "#47443E", cap: "#EAE6E0" },
      { id: 2, isPrimary: false, glyph: "测", en: "BENCH", zh: "场景实测", body: "真实续航与温控记录，收窄时向下承接。", fill: "#C4D226", ink: "#1A1D1C", muted: "#2F3508", cap: "#C4D226" },
      { id: 3, isPrimary: false, glyph: "附", en: "TERMS", zh: "质保清单", body: "配件清单与售后细则，低位收束不抢焦。", fill: "#F0761F", ink: "#1A1D1C", muted: "#401C04", cap: "#F0761F" },
    ],
  },
};

export const RIGHT_SPINE_LABELS = [
  { top: "高位启动", sub: "吸引注意" },
  { top: "信息逐级", sub: "向下流动" },
  { top: "节奏递进", sub: "层级清晰" },
  { top: "低位收束", sub: "形成记忆点" },
];

export const PRESETS = {
  fault: {
    label: "复原 0/4 错态",
    kind: "reset",
    patch: {
      viewportW: 740,
      minColW: 140,
      order: [1, 2, 3, 0],
      heights: [0.66, 0.66, 0.66, 0.92],
      cssOrderFlip: true,
    },
  },
  posterClassic: {
    label: "原海报阶梯解",
    kind: "solve",
    patch: {
      viewportW: 740,
      minColW: 245,
      order: [0, 1, 2, 3],
      heights: [0.94, 0.78, 0.63, 0.48],
      cssOrderFlip: false,
    },
  },
  wroblewski3: {
    label: "三阶落列解",
    kind: "solve",
    patch: {
      viewportW: 960,
      minColW: 260,
      order: [0, 1, 2, 3],
      heights: [0.92, 0.79, 0.65, 0.50],
      cssOrderFlip: false,
    },
  },
  editorialGentle: {
    label: "出版宽松解",
    kind: "solve",
    patch: {
      viewportW: 1180,
      minColW: 270,
      order: [0, 1, 2, 3],
      heights: [0.88, 0.78, 0.68, 0.58],
      cssOrderFlip: false,
    },
  },
  errPremature: {
    label: "试错：过早塌陷",
    kind: "error",
    patch: {
      viewportW: 1080,
      minColW: 370,
      order: [0, 1, 2, 3],
      heights: [0.92, 0.78, 0.64, 0.48],
      cssOrderFlip: false,
    },
  },
  errFlat: {
    label: "试错：平顶无峰",
    kind: "error",
    patch: {
      viewportW: 740,
      minColW: 245,
      order: [0, 1, 2, 3],
      heights: [0.74, 0.74, 0.74, 0.74],
      cssOrderFlip: false,
    },
  },
};

export function createInitialState() {
  return {
    scenario: "poster",
    viewportW: PRESETS.fault.patch.viewportW,
    minColW: PRESETS.fault.patch.minColW,
    order: [...PRESETS.fault.patch.order],
    heights: [...PRESETS.fault.patch.heights],
    cssOrderFlip: PRESETS.fault.patch.cssOrderFlip,
    selectedSlot: 0,
    swapSource: null,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 根据给定视口宽与最低列宽阈值，精确算出每个列位所在行、实绘列宽与是否已下落
export function computeRows(viewportW, minColW, count = 4) {
  const pad = viewportW < 520 ? 14 : 20;
  const gap = viewportW < 520 ? 10 : 14;
  const innerW = Math.max(160, viewportW - pad * 2);
  const rawFit = Math.floor((innerW + gap) / (minColW + gap));
  const topCols = clamp(rawFit, 1, count);

  const rows = [];
  if (topCols === 4) {
    rows.push([0, 1, 2, 3]);
  } else if (topCols === 3) {
    rows.push([0, 1, 2], [3]);
  } else if (topCols === 2) {
    rows.push([0, 1], [2, 3]);
  } else {
    rows.push([0], [1], [2], [3]);
  }

  const cells = [];
  rows.forEach((slotList, rowIdx) => {
    const n = slotList.length;
    const colW = (innerW - gap * (n - 1)) / n;
    slotList.forEach((slotIdx, colInRow) => {
      cells[slotIdx] = {
        slotIdx,
        row: rowIdx,
        colInRow,
        colsInRow: n,
        dropped: rowIdx > 0,
        xPx: pad + colInRow * (colW + gap),
        wPx: colW,
      };
    });
  });

  return {
    pad,
    gap,
    innerW,
    topCols,
    rowCount: rows.length,
    rows,
    cells,
    droppedCount: count - topCols,
    minColActualW: Math.round(Math.min(...cells.map((c) => c.wPx))),
    topColActualW: Math.round(cells[0].wPx),
  };
}

export function evaluate(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const layout = computeRows(state.viewportW, state.minColW, 4);
  const desktopCheck = computeRows(1200, state.minColW, 4);
  const tabletCheck = computeRows(740, state.minColW, 4);
  const mobileCheck = computeRows(375, state.minColW, 4);

  const h = state.heights;
  const stepDrops = [h[0] - h[1], h[1] - h[2], h[2] - h[3]];
  const totalDrop = h[0] - h[3];
  const minH = Math.min(...h);
  const maxUphill = Math.min(...stepDrops);

  // 1. 列序（主栏锚定高位）：主键列 c0 必须在槽位 0
  const primarySlot = state.order.indexOf(0);
  const primaryCell = layout.cells[primarySlot];
  const priorityOk = primarySlot === 0;

  // 2. 落差（由高到低阶梯坡度，双向检验：逆坡 / 平顶 / 断崖）
  let slopeKind = "ok";
  if (totalDrop < -0.02 || maxUphill < -0.03) slopeKind = "uphill";
  else if (totalDrop < 0.18 || Math.min(...stepDrops) < 0.04) slopeKind = "flat";
  else if (minH < 0.34 || totalDrop > 0.62) slopeKind = "cliff";
  const slopeOk = slopeKind === "ok";

  // 3. 节奏（当前列宽舒适 + 阈值不在两端走极端）
  let measureKind = "ok";
  if (layout.minColActualW < COMFORT_MIN_W || state.minColW < 210) measureKind = "squished";
  else if (state.minColW > PREMATURE_MAX_W || desktopCheck.topCols < 3) measureKind = "premature";
  const measureOk = measureKind === "ok";

  // 4. 模式（DOM 源序与视觉下落一致，不制造 Tab 逆跳）
  const a11yOk = !state.cssOrderFlip;
  // 若开启 CSS order 错序，视觉展示顺位按 [2, 0, 3, 1] 与 DOM 脱钩，计算焦点回跳次数
  const tabSequence = state.cssOrderFlip ? [2, 0, 3, 1] : [0, 1, 2, 3];
  let tabJumps = 0;
  for (let i = 0; i < tabSequence.length - 1; i++) {
    if (tabSequence[i + 1] < tabSequence[i]) tabJumps++;
  }
  if (state.cssOrderFlip) tabJumps = Math.max(tabJumps, 2);

  const checks = { priorityOk, slopeOk, measureOk, a11yOk };
  const passed = [priorityOk, slopeOk, measureOk, a11yOk].filter(Boolean).length;

  // 按严重程度挑出当前最关键的一条白话诊单
  let badge = "";
  let headline = "";
  let detail = "";
  let action = "";
  let fixKind = "";
  let fixLabel = "";
  let tierLabel = "";

  if (!measureOk && measureKind === "squished") {
    badge = `${passed}/4 · 挤压窒息`;
    headline = `当前最窄列被挤到 ${layout.minColActualW}px，拒绝下落导致折行破碎`;
    detail =
      state.minColW < 210
        ? `下落阈值设得太低（${state.minColW}px），视口缩到 ${state.viewportW}px 仍硬挤 ${layout.topCols} 列并排。经验上中文常规正文列宽低于 ${COMFORT_MIN_W}px 时，每行只剩七八个字，视线来回折返极累。`
        : `当前视口 ${state.viewportW}px 下最窄列仅 ${layout.minColActualW}px，已跌破舒适读宽线（${COMFORT_MIN_W}px）。`;
    action = "把「最低列宽阈值」调到 225–280px 区间（或点击一键校准阈值），让次要列在太窄前主动下落。";
    fixKind = "fixMeasure";
    fixLabel = "校准下落阈值 245px";
    tierLabel = "挤扁失序（示意）";
  } else if (!measureOk && measureKind === "premature") {
    badge = `${passed}/4 · 过早塌陷`;
    headline = `下落阈值拉高到 ${state.minColW}px，连宽屏都被提前拆碎`;
    detail = `阈值超过 ${PREMATURE_MAX_W}px 后，即便是 1200px 桌面端也只能勉强放 ${desktopCheck.topCols} 列，而在 ${state.viewportW}px 下更是提早塌成 ${layout.topCols} 列长串，白白浪费横向视野，把低顺位信息推到几屏之外。`;
    action = "把「最低列宽阈值」收回到 225–300px 之间，只在真读不下时才逐级落列。";
    fixKind = "fixMeasure";
    fixLabel = "收回调优至 255px";
    tierLabel = "过早塌陷（示意）";
  } else if (!priorityOk) {
    badge = `${passed}/4 · 主栏先坠`;
    headline = `核心「${sc.columns[0].zh}」被放在第 ${primarySlot + 1} 顺位${primaryCell.dropped ? "，已经掉到底层" : "，一缩屏就会先坠落"}`;
    detail = `列下落把最靠后的列最先放落到下方。现在「${sc.columns[0].zh}」排在「${sc.columns[state.order[0]].zh}」后面，平板或手机读者划开首屏先看到次要配角，核心信息反而被压在下面。`;
    action = `直接点击画布中「${sc.columns[0].zh}」顶部的 #${primarySlot + 1} 勋章，再点第 1 列勋章把它换回 #1 高位。`;
    fixKind = "fixPriority";
    fixLabel = "主栏归位 #1";
    tierLabel = "主次倒挂（示意）";
  } else if (!slopeOk && slopeKind === "uphill") {
    badge = `${passed}/4 · 逆坡倒灌`;
    headline = `列高走势倒挂（首末差 ${Math.round(totalDrop * 100)}%），视线被拽向最右末列`;
    detail = `原海报写明「通过不等高的列块排列，形成由高到低的视觉动线」。现在后列反比前列更高，读者视线刚落进左起首列就被右侧高柱拽走，层级起落正好反了过来。`;
    action = "向下拖拽过高的末列顶帽，或拉高首列顶帽，让四列形成清晰的自左向右由高到低阶梯。";
    fixKind = "fixSlope";
    fixLabel = "理顺高→低阶梯";
    tierLabel = "逆坡倒流（示意）";
  } else if (!slopeOk && slopeKind === "flat") {
    badge = `${passed}/4 · 平顶无峰`;
    headline = `四列高度几乎齐平（首末仅差 ${Math.round(totalDrop * 100)}%），看不出谁先谁后`;
    detail = `四根列块像一面等高砖墙排在一起，少了原海报强调的「落差」与「节奏」。读者扫视第一眼找不到最高入口，阅读顺序变得含糊。`;
    action = "上下拖动各列顶帽，拉开自左向右至少 20% 以上的阶梯高差，让主次层级一眼分明。";
    fixKind = "fixSlope";
    fixLabel = "拉开阶梯落差";
    tierLabel = "平顶无峰（示意）";
  } else if (!slopeOk && slopeKind === "cliff") {
    badge = `${passed}/4 · 断崖压扁`;
    headline = `高差过于悬殊（末列仅剩 ${Math.round(minH * 100)}% 高度），低位列被削成薄条`;
    detail = `落差是为了引导阅读而不是牺牲承载力。最矮列被压到 34% 以下后，文字区局促变形，四列之间的视觉连贯节奏也像断崖一样折断。`;
    action = "把最矮列的顶帽往上提一些（保持在 42%–60% 区间），让四步落差匀称自然。";
    fixKind = "fixSlope";
    fixLabel = "柔化过陡落差";
    tierLabel = "断崖失衡（示意）";
  } else if (!a11yOk) {
    badge = `${passed}/4 · 焦点逆跳`;
    headline = `CSS order 硬翻视觉顺序，键盘 Tab 焦点在列间逆跳 ${tabJumps} 次`;
    detail = "画面上看着像排好了，但 HTML 文档源序和视觉顺位脱钩。按键盘 Tab 或使用屏幕阅读器的读者会从第三列突然跳回第一列（违反 WCAG 1.3.2 有意义的顺序）。";
    action = "关闭「CSS order 错序」开关，让 HTML 源序直接承担主栏在前、次栏依次下落的顺序。";
    fixKind = "fixA11y";
    fixLabel = "同步 HTML 源序";
    tierLabel = "焦点错序（示意）";
  } else {
    badge = "4/4 · 列序通畅";
    const dropDesc =
      layout.droppedCount === 0
        ? `${state.viewportW}px 宽幅下四列舒展并排（单列 ${layout.topColActualW}px）`
        : `${state.viewportW}px 下顺滑放落 ${layout.droppedCount} 列，顶行每列稳守 ${layout.topColActualW}px`;
    headline = `${dropDesc}，由高到低动线成立`;
    detail = `主栏「${sc.columns[0].zh}」牢牢锚定 #1 首位，四列呈 ${Math.round(totalDrop * 100)}% 阶梯落差，且 HTML 源序与视觉落列完全同步。继续左右横拖画布，能看到它在 1200px（${desktopCheck.topCols}列）→ 740px（${tabletCheck.topCols}列）→ 375px（${mobileCheck.topCols}列）间自然过渡。`;
    action = "试试向左拖到 400px 手机宽，或点「试错：过早塌陷」「试错：平顶无峰」反向验证边界。";
    fixKind = "";
    fixLabel = "";
    tierLabel = layout.droppedCount === 0 ? "宽幅全展（示意）" : layout.droppedCount === 3 ? "单列收束（示意）" : "阶梯下落（示意）";
  }

  // 每列详细渲染数据（供 Canvas 唯一读取）
  const renderedColumns = state.order.map((colId, slotIdx) => {
    const spec = sc.columns[colId];
    const cell = layout.cells[slotIdx];
    const domRank = state.cssOrderFlip ? tabSequence.indexOf(slotIdx) + 1 : slotIdx + 1;
    return {
      ...spec,
      slotIdx,
      heightRatio: h[slotIdx],
      cell,
      domRank,
      isFaultCol:
        (!priorityOk && colId === 0) ||
        (!measureOk && measureKind === "squished" && !cell.dropped) ||
        (!slopeOk && ((slopeKind === "uphill" && slotIdx === 3) || (slopeKind === "cliff" && h[slotIdx] === minH))),
    };
  });

  // 底部原海报 4 枚模式要点实时状态
  const keyPoints = [
    {
      id: "column",
      zh: "列序",
      en: "COLUMN",
      tag: "有序排列",
      ok: priorityOk,
      status: priorityOk ? "主栏 #1 稳顶" : `主栏落第 ${primarySlot + 1} 位`,
    },
    {
      id: "drop",
      zh: "落差",
      en: "DROP",
      tag: "高度变化",
      ok: slopeOk,
      status: slopeOk
        ? `高差 ${Math.round(totalDrop * 100)}%`
        : slopeKind === "uphill"
          ? `逆坡 ${Math.round(totalDrop * 100)}%`
          : slopeKind === "flat"
            ? `平齐 ${Math.round(totalDrop * 100)}%`
            : `断崖 ${Math.round(minH * 100)}%`,
    },
    {
      id: "rhythm",
      zh: "节奏",
      en: "RHYTHM",
      tag: "错落有致",
      ok: measureOk,
      status: measureOk
        ? `最窄 ${layout.minColActualW}px`
        : measureKind === "squished"
          ? `挤扁 ${layout.minColActualW}px`
          : `早塌 ${state.minColW}px`,
    },
    {
      id: "pattern",
      zh: "模式",
      en: "PATTERN",
      tag: "可复用结构",
      ok: a11yOk,
      status: a11yOk ? "源序 0 逆跳" : `Tab 逆跳 ${tabJumps} 处`,
    },
  ];

  // 计算每列在什么视口宽度触发下落（供标尺与说明）
  const bp4to3 = Math.round(4 * state.minColW + 3 * 14 + 40);
  const bp3to2 = Math.round(3 * state.minColW + 2 * 14 + 40);
  const bp2to1 = Math.round(2 * state.minColW + 1 * 14 + 40);

  return {
    scenario: sc,
    layout,
    desktopCheck,
    tabletCheck,
    mobileCheck,
    renderedColumns,
    checks,
    passed,
    badge,
    headline,
    detail,
    action,
    fixKind,
    fixLabel,
    tierLabel,
    keyPoints,
    totalDropPct: Math.round(totalDrop * 100),
    tabJumps,
    primarySlot,
    breakpoints: { bp4to3, bp3to2, bp2to1 },
    slopeKind,
    measureKind,
  };
}

export function applyFix(state, fixKind) {
  if (fixKind === "fixMeasure") {
    state.minColW = state.minColW > PREMATURE_MAX_W ? 255 : 245;
  } else if (fixKind === "fixPriority") {
    const idx = state.order.indexOf(0);
    if (idx > 0) {
      const tmp = state.order[0];
      state.order[0] = 0;
      state.order[idx] = tmp;
    }
  } else if (fixKind === "fixSlope") {
    state.heights = [0.94, 0.78, 0.63, 0.48];
  } else if (fixKind === "fixA11y") {
    state.cssOrderFlip = false;
  }
}
