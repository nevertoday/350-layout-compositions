// 299 自适应网格 · 单真源网格装箱与诊断引擎
// 画布、读数、核心规则体检单、四屏预览、五步逻辑流程条、实时 CSS 全部由本模块算出的同一份结果驱动。

export const BREAKPOINTS = [
  { id: "mobile-p", label: "手机竖屏", width: 360, short: "360px" },
  { id: "mobile-l", label: "手机横屏", width: 640, short: "640px" },
  { id: "tablet", label: "平板", width: 768, short: "768px" },
  { id: "desktop", label: "桌面", width: 1200, short: "1200px+" },
];

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报 8 卡",
    desc: "1:1 复刻 299 原海报的 8 个经典模块组合（8 列下三行严丝合缝）",
    initialBroken: {
      containerWidth: 860,
      minColWidth: 86,
      gutter: 4,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: false,
      spans: [2, 6, 2, 4, 2, 4, 5, 4],
    },
    idealSpans: [2, 4, 2, 3, 2, 3, 4, 4],
    cards: [
      { id: "c1", code: "M1", title: "导览徽章", motif: "circle-lines" },
      { id: "c2", code: "M2", title: "主视觉焦点", motif: "lines-mountains" },
      { id: "c3", code: "M3", title: "快讯摘要", motif: "lines-square" },
      { id: "c4", code: "M4", title: "人物专题", motif: "big-circle-lines" },
      { id: "c5", code: "M5", title: "数据指标", motif: "square-lines" },
      { id: "c6", code: "M6", title: "图解侧卡", motif: "lines-small-mountain" },
      { id: "c7", code: "M7", title: "深度图集", motif: "lines-big-mountains" },
      { id: "c8", code: "M8", title: "底部通栏", motif: "circle-wide-lines" },
    ],
  },
  gallery: {
    id: "gallery",
    name: "组件画廊",
    desc: "6 张设计系统卡片，体验少量卡片时的 auto-fill 与 auto-fit 分野",
    initialBroken: {
      containerWidth: 600,
      minColWidth: 88,
      gutter: 4,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: false,
      spans: [2, 5, 1, 2, 1, 2],
    },
    idealSpans: [2, 2, 1, 1, 2, 2],
    cards: [
      { id: "g1", code: "UI-01", title: "主按钮组", motif: "circle-lines" },
      { id: "g2", code: "UI-02", title: "折线看板", motif: "lines-mountains" },
      { id: "g3", code: "UI-03", title: "标签胶囊", motif: "square-lines" },
      { id: "g4", code: "UI-04", title: "筛选抽屉", motif: "lines-square" },
      { id: "g5", code: "UI-05", title: "用户头像", motif: "big-circle-lines" },
      { id: "g6", code: "UI-06", title: "画册轮播", motif: "lines-big-mountains" },
    ],
  },
  editorial: {
    id: "editorial",
    name: "新闻编辑台",
    desc: "8 篇不同权重的报道模块，检验跨列头条在桌面与手机间的重排平衡",
    initialBroken: {
      containerWidth: 640,
      minColWidth: 86,
      gutter: 4,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: false,
      spans: [5, 2, 2, 3, 2, 2, 4, 2],
    },
    idealSpans: [4, 2, 2, 3, 3, 2, 4, 4],
    cards: [
      { id: "e1", code: "HEAD", title: "今日头条", motif: "lines-big-mountains" },
      { id: "e2", code: "BRF1", title: "城市简讯", motif: "circle-lines" },
      { id: "e3", code: "BRF2", title: "视觉评论", motif: "lines-square" },
      { id: "e4", code: "FEAT", title: "建筑专访", motif: "big-circle-lines" },
      { id: "e5", code: "DATA", title: "气候图谱", motif: "lines-mountains" },
      { id: "e6", code: "NOTE", title: "编者短评", motif: "square-lines" },
      { id: "e7", code: "FOTO", title: "影像纪实", motif: "lines-small-mountain" },
      { id: "e8", code: "FOOT", title: "周末指南", motif: "circle-wide-lines" },
    ],
  },
};

export function createInitialState(themeId = "poster") {
  const theme = THEMES[themeId] || THEMES.poster;
  const b = theme.initialBroken;
  return {
    themeId: theme.id,
    containerWidth: b.containerWidth,
    minColWidth: b.minColWidth,
    gutter: b.gutter,
    fillMode: b.fillMode,
    flowMode: b.flowMode,
    clampSpan: b.clampSpan,
    spans: [...b.spans],
    selectedIdx: 1,
  };
}

export function getPresetStates(themeId = "poster") {
  const theme = THEMES[themeId] || THEMES.poster;
  const ideal = [...theme.idealSpans];
  return {
    broken: createInitialState(themeId),
    poster8: {
      themeId: theme.id,
      containerWidth: 1120,
      minColWidth: 120,
      gutter: 16,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: true,
      spans: ideal,
      selectedIdx: 1,
    },
    tablet4: {
      themeId: theme.id,
      containerWidth: 768,
      minColWidth: 160,
      gutter: 16,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: true,
      spans: theme.cards.map((_, i) => (i === 0 || i === 1 || i === theme.cards.length - 1 ? 2 : 1)),
      selectedIdx: 1,
    },
    wide6: {
      themeId: theme.id,
      containerWidth: 960,
      minColWidth: 136,
      gutter: 16,
      fillMode: "auto-fit",
      flowMode: "row",
      clampSpan: true,
      spans: theme.cards.map((_, i) => (i === 1 ? 3 : i % 3 === 0 ? 2 : 1)),
      selectedIdx: 1,
    },
    errWideGutter: {
      themeId: theme.id,
      containerWidth: 880,
      minColWidth: 130,
      gutter: 44,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: true,
      spans: ideal,
      selectedIdx: 1,
    },
    errFlat: {
      themeId: theme.id,
      containerWidth: 1040,
      minColWidth: 140,
      gutter: 16,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: true,
      spans: theme.cards.map(() => 1),
      selectedIdx: 0,
    },
    errOverflow: {
      themeId: theme.id,
      containerWidth: 460,
      minColWidth: 136,
      gutter: 16,
      fillMode: "auto-fill",
      flowMode: "row",
      clampSpan: false,
      spans: ideal.map((s, i) => (i === 1 ? 5 : s)),
      selectedIdx: 1,
    },
  };
}

/**
 * 严格模拟 CSS Grid auto-fill / auto-fit + minmax(minColWidth, 1fr) + auto-placement (row / dense)
 * 单真源布局求解器：画布、诊断、四屏缩略图、测验选项共用同一套几何数学。
 */
export function solveGridLayout(opts) {
  const containerWidth = Math.max(260, Math.round(opts.containerWidth));
  const minColWidth = Math.max(56, Math.round(opts.minColWidth));
  const gutter = Math.max(0, Math.round(opts.gutter));
  const fillMode = opts.fillMode === "auto-fit" ? "auto-fit" : "auto-fill";
  const flowMode = opts.flowMode === "dense" ? "dense" : "row";
  const clampSpan = !!opts.clampSpan;
  const items = opts.items || [];

  // 1. 显式 auto-fill 可容纳的轨道数
  const autoCols = Math.max(1, Math.floor((containerWidth + gutter) / (minColWidth + gutter)));

  // 2. 检查跨列是否触发隐式扩列溢出
  const maxRequestedSpan = items.reduce((m, it) => Math.max(m, it.span || 1), 1);
  const effectiveSpans = items.map((it) => {
    const req = Math.max(1, Math.round(it.span || 1));
    return clampSpan ? Math.min(req, autoCols) : req;
  });

  // 未钳制且存在 span > autoCols 时，CSS Grid 会创建隐式轨道导致内容超出容器宽度
  const implicitCols = clampSpan ? autoCols : Math.max(autoCols, maxRequestedSpan);
  const hasSpanOverflow = !clampSpan && maxRequestedSpan > autoCols;

  // 若开启 auto-fit，当全部卡片总跨列 < autoCols 且都能塞入首行时，折叠尾部空轨
  const totalSpanSum = effectiveSpans.reduce((a, b) => a + b, 0);
  const usedFirstRowCols = Math.min(implicitCols, totalSpanSum);
  let collapsedEmptyTracks = 0;
  let renderedCols = implicitCols;
  if (fillMode === "auto-fit" && !hasSpanOverflow && totalSpanSum < autoCols && items.length > 0) {
    collapsedEmptyTracks = autoCols - usedFirstRowCols;
    renderedCols = Math.max(1, usedFirstRowCols);
  }

  // 3. 精确计算每列实测宽度（像素）与是否发生横向溢出
  let colWidth;
  let contentWidth;
  let overflowPx = 0;

  if (hasSpanOverflow) {
    // 浏览器给显式轨道保留 minColWidth，并扩出隐式列，整行撑破容器
    const baseTrack = Math.max(minColWidth, (containerWidth - (autoCols - 1) * gutter) / autoCols);
    colWidth = Math.min(baseTrack, minColWidth * 1.04);
    contentWidth = renderedCols * colWidth + (renderedCols - 1) * gutter;
    overflowPx = Math.max(0, Math.round(contentWidth - containerWidth));
    if (overflowPx === 0) {
      // 即使隐式轨道挤进容器也按最小可读下限标明撑爆
      colWidth = minColWidth;
      contentWidth = renderedCols * colWidth + (renderedCols - 1) * gutter;
      overflowPx = Math.max(12, Math.round(contentWidth - containerWidth));
    }
  } else if (minColWidth > containerWidth && !clampSpan) {
    // 单列 minColWidth 本身大于容器宽（未用 min(M, 100%) 保护）
    colWidth = minColWidth;
    contentWidth = minColWidth;
    overflowPx = Math.round(minColWidth - containerWidth);
  } else {
    colWidth = (containerWidth - (renderedCols - 1) * gutter) / renderedCols;
    contentWidth = containerWidth;
    overflowPx = 0;
  }

  // 4. 严格执行 CSS Grid Auto-Placement 装箱
  const occupied = [];
  const ensureRow = (r) => {
    while (occupied.length <= r) occupied.push(new Array(renderedCols).fill(false));
  };
  const canPlace = (r, c, span) => {
    if (c + span > renderedCols) return false;
    ensureRow(r);
    for (let k = 0; k < span; k++) {
      if (occupied[r][c + k]) return false;
    }
    return true;
  };
  const markPlace = (r, c, span) => {
    ensureRow(r);
    for (let k = 0; k < span; k++) occupied[r][c + k] = true;
  };

  let cursorRow = 0;
  let cursorCol = 0;
  const placements = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const reqSpan = Math.max(1, Math.round(it.span || 1));
    const span = effectiveSpans[i];
    let placedRow = 0;
    let placedCol = 0;

    if (flowMode === "dense") {
      let found = false;
      for (let r = 0; !found; r++) {
        ensureRow(r);
        for (let c = 0; c <= renderedCols - span; c++) {
          if (canPlace(r, c, span)) {
            placedRow = r;
            placedCol = c;
            found = true;
            break;
          }
        }
      }
      markPlace(placedRow, placedCol, span);
    } else {
      let r = cursorRow;
      let c = cursorCol;
      while (true) {
        if (c + span > renderedCols) {
          r += 1;
          c = 0;
        }
        if (canPlace(r, c, span)) {
          placedRow = r;
          placedCol = c;
          break;
        }
        c += 1;
      }
      markPlace(placedRow, placedCol, span);
      cursorRow = placedRow;
      cursorCol = placedCol + span;
      if (cursorCol >= renderedCols) {
        cursorRow += 1;
        cursorCol = 0;
      }
    }

    const x = placedCol * (colWidth + gutter);
    const w = span * colWidth + (span - 1) * gutter;
    placements.push({
      domIndex: i,
      id: it.id || `item-${i}`,
      code: it.code || `M${i + 1}`,
      title: it.title || `模块 ${i + 1}`,
      motif: it.motif || "circle-lines",
      requestedSpan: reqSpan,
      usedSpan: span,
      clamped: span < reqSpan,
      overflowed: !clampSpan && reqSpan > autoCols,
      row: placedRow,
      col: placedCol,
      x,
      w,
    });
  }

  const rowCount = Math.max(1, occupied.length);

  // 5. 计算视觉阅读顺序与 DOM 顺序的逆序跳变（检测 dense 乱序代价）
  const visualSorted = [...placements].sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
  let reorderedCount = 0;
  visualSorted.forEach((p, vi) => {
    p.visualIndex = vi;
    if (vi !== p.domIndex) reorderedCount += 1;
  });

  // 6. 精确统计内部空洞与尾行空洞（用于画布赤线标洞与平衡判定）
  const holes = [];
  let interiorHoleCells = 0;
  let trailingHoleCells = 0;
  let emptyTrailingTracks = 0;

  // 若 auto-fill 在只有 1 行时右缘空轨道计数
  if (fillMode === "auto-fill" && rowCount === 1) {
    for (let c = 0; c < renderedCols; c++) {
      if (!occupied[0][c]) emptyTrailingTracks += 1;
    }
  }

  for (let r = 0; r < occupied.length; r++) {
    let c = 0;
    while (c < renderedCols) {
      if (!occupied[r][c]) {
        let len = 0;
        while (c + len < renderedCols && !occupied[r][c + len]) len += 1;
        const isLastRow = r === occupied.length - 1;
        const kind = isLastRow ? "trailing" : "interior";
        if (kind === "interior") interiorHoleCells += len;
        else trailingHoleCells += len;
        holes.push({
          row: r,
          col: c,
          span: len,
          kind,
          x: c * (colWidth + gutter),
          w: len * colWidth + (len - 1) * gutter,
        });
        c += len;
      } else {
        c += 1;
      }
    }
  }

  const totalCells = rowCount * renderedCols;
  const filledCells = totalCells - interiorHoleCells - trailingHoleCells;
  const holeRatio = totalCells > 0 ? (interiorHoleCells + trailingHoleCells) / totalCells : 0;

  // 跨列多样性统计
  const uniqueSpans = new Set(placements.map((p) => p.usedSpan));
  const spanDiversity = uniqueSpans.size;

  // 行重心均衡度（计算每行填充度方差，作为示意指标，不冒充精确测量）
  const rowFillRates = occupied.map((row) => row.filter(Boolean).length / renderedCols);
  const minRowFill = rowFillRates.length ? Math.min(...rowFillRates) : 1;

  return {
    containerWidth,
    minColWidth,
    gutter,
    fillMode,
    flowMode,
    clampSpan,
    autoCols,
    renderedCols,
    collapsedEmptyTracks,
    emptyTrailingTracks,
    colWidth: +colWidth.toFixed(1),
    contentWidth: +contentWidth.toFixed(1),
    overflowPx,
    hasSpanOverflow,
    rowCount,
    placements,
    holes,
    interiorHoleCells,
    trailingHoleCells,
    totalCells,
    filledCells,
    holeRatio: +holeRatio.toFixed(3),
    spanDiversity,
    reorderedCount,
    minRowFill: +minRowFill.toFixed(2),
  };
}

let _cachedDevicesKey = "";
let _cachedDevices = null;

/**
 * 单真源全面诊断：同时验算当前容器与 360/640/768/1200 四屏表现，
 * 输出全部真实错误/警示、五项原海报关键词标尺状态、五条核心规则体检、五步逻辑流程值、以及实时 CSS 代码。
 */
export function evaluateState(state) {
  const theme = THEMES[state.themeId] || THEMES.poster;
  const items = theme.cards.map((card, i) => ({
    ...card,
    span: state.spans[i] ?? theme.idealSpans[i] ?? 1,
  }));

  const current = solveGridLayout({
    containerWidth: state.containerWidth,
    minColWidth: state.minColWidth,
    gutter: state.gutter,
    fillMode: state.fillMode,
    flowMode: state.flowMode,
    clampSpan: state.clampSpan,
    items,
  });

  // 四屏实时同步演算（完全同源；仅规则变更时重算，拖宽容器时零重复求解）
  const devKey = `${state.themeId}|${state.minColWidth}|${state.gutter}|${state.fillMode}|${state.flowMode}|${state.clampSpan}|${state.spans.join(",")}`;
  let devices;
  if (devKey === _cachedDevicesKey && _cachedDevices) {
    devices = _cachedDevices;
  } else {
    devices = BREAKPOINTS.map((bp) => ({
      ...bp,
      layout: solveGridLayout({
        containerWidth: bp.width,
        minColWidth: state.minColWidth,
        gutter: state.gutter,
        fillMode: state.fillMode,
        flowMode: state.flowMode,
        clampSpan: state.clampSpan,
        items,
      }),
    }));
    _cachedDevicesKey = devKey;
    _cachedDevices = devices;
  }

  const mobileDevice = devices[0]; // 360px 手机竖屏验算
  const issues = [];

  // 1. 当前屏跨列或单列溢出
  if (current.overflowPx > 0) {
    const culprit = current.placements.find((p) => p.overflowed);
    issues.push({
      id: "overflow-now",
      severity: "error",
      tag: `撑爆 +${current.overflowPx}px`,
      title: culprit
        ? `「${culprit.title}」SPAN ${culprit.requestedSpan} 撑破 ${current.autoCols} 列容器，向右溢出 ${current.overflowPx}px`
        : `最小列宽 ${current.minColWidth}px 大于容器宽，网格向右溢出 ${current.overflowPx}px`,
      why: `当前容器 ${current.containerWidth}px 最多容下 ${current.autoCols} 条轨道，却硬塞进跨 ${culprit ? culprit.requestedSpan : 1} 列的模块，浏览器被迫扩出隐式列，页面立刻冒出横向滚动条。`,
      action: "把超宽卡片点按降回更小 SPAN，或打开「窄屏安全钳制」让跨列自动不超过当前列数。",
      fixType: "clamp",
    });
  }

  // 2. 列宽过挤（违背原海报最小列宽 >= 120px）
  if (current.colWidth < 120) {
    issues.push({
      id: "col-narrow",
      severity: "error",
      tag: `单列 ${Math.round(current.colWidth)}px 过挤`,
      title: `单列实宽仅 ${Math.round(current.colWidth)}px，跌破原海报 120px 易读底线`,
      why: `最小列宽门槛（${current.minColWidth}px）放得太低，${current.containerWidth}px 容器里硬塞进了 ${current.renderedCols} 列。每个单列格子窄得像牙签，文字被迫频繁折行，图符和标题挤作一团。`,
      action: "把「最小列宽」推升到 ≥ 120px（推荐 120–160px），宁可减少列数也别压扁内容。",
      fixType: "mincol",
    });
  }

  // 3. 间隙过窄粘连 或 间隙过宽割裂（双向错态）
  if (current.gutter < 10) {
    issues.push({
      id: "gutter-tight",
      severity: "error",
      tag: `间隙 ${current.gutter}px 粘连`,
      title: `统一间隙仅 ${current.gutter}px，相邻白卡贴死失去呼吸感`,
      why: "按照格式塔接近性原则，当卡片之间的外间隙比卡片内部留白还窄时，眼睛会把隔壁卡片的标题和图标误认成同一组，模块边界糊成一堵墙。",
      action: "把「统一间隙 gutter」拉到 12px–24px，立刻让每张卡片恢复清晰边界。",
      fixType: "gutter",
    });
  } else if (current.gutter > 32 || current.gutter / Math.max(1, current.colWidth) > 0.34) {
    issues.push({
      id: "gutter-wide",
      severity: "error",
      tag: `间隙 ${current.gutter}px 割裂`,
      title: `间隙宽达 ${current.gutter}px，模块被拉散成孤立碎片`,
      why: `过宽的间隙一方面把本该成组的模块拆得支离破碎，另一方面还白白吃掉了 ${Math.max(0, current.renderedCols - 1) * current.gutter}px 的宝贵容器宽度，迫使列数过早掉档。`,
      action: "把「统一间隙 gutter」收回 12px–24px 黄金节奏带。",
      fixType: "gutter",
    });
  }

  // 4. 内部空洞或严重失衡缺口
  if (current.interiorHoleCells > 0) {
    issues.push({
      id: "interior-holes",
      severity: "error",
      tag: `行内空洞 ${current.interiorHoleCells} 格`,
      title: `大跨列折行留下 ${current.interiorHoleCells} 格行内缺口，画面重心偏斜`,
      why: `放不进当前行剩余空位的宽卡被迫跳到下一行，在行尾撕开一块明显空白。眼睛顺着阅读流扫过去会突然踩空，破坏网格的稳定节奏。`,
      action: "轻点画布里留洞行或大跨列卡片微调 SPAN，或拖动容器宽度找到恰好整除咬合的列数。",
      fixType: "balance",
    });
  } else if (current.renderedCols >= 3 && current.trailingHoleCells >= Math.ceil(current.renderedCols * 0.55) && current.rowCount > 1) {
    issues.push({
      id: "trailing-orphan",
      severity: "warn",
      tag: `尾行空 ${current.trailingHoleCells} 格`,
      title: `末行空出 ${current.trailingHoleCells}/${current.renderedCols} 列，底部收束偏轻`,
      why: "前几行塞得满满当当，最后一行却孤零零挂着小块内容，整张画面的上下重量略显头重脚轻。",
      action: "点按末行卡片加宽 SPAN，或微调容器宽与最小列宽，让末行收得更饱满。",
      fixType: "balance",
    });
  }

  // 5. 窄屏 360px 隐藏爆框风险（当前桌面看不出，但 360px 手机端会爆！）
  if (current.overflowPx === 0 && mobileDevice.layout.overflowPx > 0) {
    const mCulprit = mobileDevice.layout.placements.find((p) => p.overflowed);
    issues.push({
      id: "mobile-overflow",
      severity: "error",
      tag: `360px 手机溢出 +${mobileDevice.layout.overflowPx}px`,
      title: `桌面看着正常，但 360px 手机竖屏会被 SPAN ${mCulprit ? mCulprit.requestedSpan : ""} 撑爆`,
      why: `固定写死大跨列却未开启钳制时，在宽屏上相安无事，一落到 360px 手机（仅 ${mobileDevice.layout.autoCols} 列）就会冲破屏幕右边界。看下方「响应式示例 · 360px」里的红框就能亲眼看到。`,
      action: "开启「窄屏安全钳制」自动按容器列数降阶跨列，真正做到同一内容跨屏不爆框。",
      fixType: "clamp",
    });
  }

  // 6. 宽屏平权单调（列数 >= 4 且全员同样 span）
  if (current.renderedCols >= 4 && current.spanDiversity <= 1 && items.length >= 4) {
    issues.push({
      id: "flat-span",
      severity: "warn",
      tag: "平权缺主次",
      title: `${current.renderedCols} 列宽屏里所有模块清一色 SPAN ${current.placements[0]?.usedSpan || 1}，缺少视觉起点`,
      why: "原海报强调「按需跨列，使用 span 构建层级」。宽屏下每张卡一模一样宽，眼睛进画面后找不到谁是主角、谁是配角，退化成均质货架。",
      action: "在画布上点选 1–2 张核心卡片加宽到 SPAN 2–4，立刻拉出主次节奏。",
      fixType: "span-hierarchy",
    });
  }

  // 7. auto-fill 空轨道留白警示（当卡片很少且宽屏留出 2 条以上完全空轨）
  if (current.fillMode === "auto-fill" && current.emptyTrailingTracks >= 2) {
    issues.push({
      id: "autofill-empty",
      severity: "warn",
      tag: `右留 ${current.emptyTrailingTracks} 空轨`,
      title: `auto-fill 在右侧保留了 ${current.emptyTrailingTracks} 条空轨道，内容偏缩左侧`,
      why: "auto-fill 的规则是「宁可空着也把轨道建出来」；当卡片数量不够填满首行时，右侧会出现大片空白。此时切换 auto-fit 会把空轨折叠为 0，让现有卡片弹性撑满。",
      action: "在「自动填充」控件中切到 auto-fit 对比差异，或适当拉大卡片跨列。",
      fixType: "autofit",
    });
  }

  // 8. 密排 dense 乱序隐患
  if (current.flowMode === "dense" && current.reorderedCount > 0) {
    issues.push({
      id: "dense-reorder",
      severity: "warn",
      tag: `乱序 ${current.reorderedCount} 卡`,
      title: `密排 dense 填平了空洞，但有 ${current.reorderedCount} 张卡的视觉顺序与代码顺序脱节`,
      why: "dense 算法把排在后面的小卡片提前塞进了前面的洞里。纯看图很齐整，但键盘按 Tab 键或用读屏器浏览时，焦点会莫名其妙来回折返。",
      action: "如果是强顺序内容，请改回「稀疏 row」并通过调整 SPAN 配比来自然对齐。",
      fixType: "row-flow",
    });
  }

  const errorCount = issues.filter((x) => x.severity === "error").length;
  const warnCount = issues.filter((x) => x.severity === "warn").length;
  const isBalanced = errorCount === 0 && warnCount === 0;
  const isAcceptable = errorCount === 0;

  let verdict;
  if (issues.length === 0) {
    let solveName = `${current.renderedCols} 列均衡平衡解`;
    if (current.renderedCols === 8 && current.interiorHoleCells === 0 && current.trailingHoleCells === 0) {
      solveName = "原海报级 8 列满格平衡解";
    } else if (current.containerWidth <= 420) {
      solveName = `窄屏 ${current.renderedCols} 列清晰通读解`;
    } else if (current.renderedCols >= 4 && current.renderedCols <= 6) {
      solveName = `中宽屏 ${current.renderedCols} 列弹性层级解`;
    }
    verdict = {
      status: "ok",
      badge: `平衡成立 · ${current.renderedCols} 列`,
      title: `${solveName}（单列 ${Math.round(current.colWidth)}px · 间隙 ${current.gutter}px）`,
      why: `容器 ${current.containerWidth}px 下由公式自动算得 ${current.renderedCols} 列，每列实宽 ${Math.round(current.colWidth)}px 稳稳守住 ≥120px 易读底线；${current.gutter}px 统一间隙让白卡归属分明，${current.spanDiversity} 档跨列拉开主次且四屏全零溢出。`,
      action: "试着继续把虚线容器往左拖到 360px 手机宽，或点某张白卡换 SPAN，感受同一套规则如何自己重排。",
    };
  } else {
    const primary = issues[0];
    verdict = {
      status: primary.severity === "error" ? "err" : "warn",
      badge: errorCount > 0 ? `${errorCount} 处失衡 · ${primary.tag}` : `基本可用 · ${primary.tag}`,
      title: primary.title,
      why: primary.why,
      action: primary.action,
      fixType: primary.fixType,
    };
  }

  // 五项原海报右上关键词实时状态
  const keywordsLive = [
    {
      key: "columns",
      zh: "列宽变化",
      en: "COLUMNS",
      value: `${current.renderedCols} 列 · ${Math.round(current.colWidth)}px`,
      status: current.colWidth < 120 ? "err" : "ok",
    },
    {
      key: "span",
      zh: "模块跨列",
      en: "SPAN",
      value:
        current.overflowPx > 0
          ? `撑爆 +${current.overflowPx}px`
          : mobileDevice.layout.overflowPx > 0
            ? "360px 爆框"
            : current.spanDiversity <= 1 && current.renderedCols >= 4
              ? "全员同宽"
              : `${current.spanDiversity} 档层级`,
      status:
        current.overflowPx > 0 || mobileDevice.layout.overflowPx > 0
          ? "err"
          : current.spanDiversity <= 1 && current.renderedCols >= 4
            ? "warn"
            : "ok",
    },
    {
      key: "gutter",
      zh: "间隙节奏",
      en: "GUTTER",
      value:
        current.gutter < 10
          ? `${current.gutter}px 粘连`
          : current.gutter > 32
            ? `${current.gutter}px 割裂`
            : `${current.gutter}px 统一`,
      status: current.gutter < 10 || current.gutter > 32 ? "err" : "ok",
    },
    {
      key: "autofill",
      zh: "自动填充",
      en: "AUTO-FILL",
      value: `${current.fillMode} · ${current.flowMode === "dense" ? "密排" : "顺序"}`,
      status:
        current.emptyTrailingTracks >= 2 || (current.flowMode === "dense" && current.reorderedCount > 0)
          ? "warn"
          : "ok",
    },
    {
      key: "balance",
      zh: "平衡布局",
      en: "BALANCE",
      value:
        current.interiorHoleCells > 0
          ? `内洞 ${current.interiorHoleCells} 格`
          : current.trailingHoleCells > 0
            ? `尾空 ${current.trailingHoleCells} 格`
            : "全行齐平",
      status:
        current.interiorHoleCells > 0
          ? "err"
          : current.trailingHoleCells >= Math.ceil(current.renderedCols * 0.55) && current.rowCount > 1
            ? "warn"
            : "ok",
    },
  ];

  // 原海报左下「核心规则」5 条实时体检
  const rulesLive = [
    {
      id: "min-col",
      name: "最小列宽",
      posterText: "≥ 120px，保证易读性",
      reading: `当前 ${Math.round(current.colWidth)}px`,
      status: current.colWidth < 120 ? "err" : "ok",
    },
    {
      id: "gutter",
      name: "间隙一致",
      posterText: "统一 gutter，节奏稳定",
      reading: `当前 ${current.gutter}px`,
      status: current.gutter < 10 || current.gutter > 32 ? "err" : "ok",
    },
    {
      id: "fluid",
      name: "弹性伸缩",
      posterText: "列宽 fluid，随容器变化",
      reading:
        current.overflowPx > 0 || mobileDevice.layout.overflowPx > 0
          ? "窄屏溢出"
          : `1fr 弹性 · 四屏安全`,
      status: current.overflowPx > 0 || mobileDevice.layout.overflowPx > 0 ? "err" : "ok",
    },
    {
      id: "span",
      name: "按需跨列",
      posterText: "使用 span 构建层级",
      reading: `${current.spanDiversity} 种跨度`,
      status:
        current.overflowPx > 0
          ? "err"
          : current.renderedCols >= 4 && current.spanDiversity <= 1
            ? "warn"
            : "ok",
    },
    {
      id: "balance",
      name: "视觉平衡",
      posterText: "内容分布均衡，重点突出",
      reading:
        current.interiorHoleCells > 0
          ? `缺口 ${current.interiorHoleCells} 格`
          : current.trailingHoleCells === 0
            ? "零空洞满格"
            : `填充 ${Math.round((1 - current.holeRatio) * 100)}%`,
      status:
        current.interiorHoleCells > 0
          ? "err"
          : current.trailingHoleCells >= Math.ceil(current.renderedCols * 0.55) && current.rowCount > 1
            ? "warn"
            : "ok",
    },
  ];

  // 原海报最底沿「自适应逻辑流程」5 步实况算值
  const pipeline = [
    {
      step: 1,
      title: "测量容器宽度",
      sub: `W = ${current.containerWidth}px`,
      status: "ok",
    },
    {
      step: 2,
      title: "计算列数",
      sub: `${current.fillMode} → ${current.renderedCols} 列`,
      status: current.colWidth < 120 ? "err" : "ok",
    },
    {
      step: 3,
      title: "放置模块",
      sub: current.clampSpan ? "span 已按列钳制" : current.overflowPx > 0 ? "span 撑破容器" : "按 span 顺序落格",
      status: current.overflowPx > 0 || mobileDevice.layout.overflowPx > 0 ? "err" : "ok",
    },
    {
      step: 4,
      title: "重新平衡",
      sub: `间隙 ${current.gutter}px · ${current.interiorHoleCells > 0 ? `缺 ${current.interiorHoleCells} 格` : "对齐齐整"}`,
      status: current.gutter < 10 || current.gutter > 32 || current.interiorHoleCells > 0 ? "err" : "ok",
    },
    {
      step: 5,
      title: "输出布局",
      sub: isBalanced ? "清晰 · 流畅 · 平衡" : isAcceptable ? "可用 · 仍有优化空间" : `拦截 ${errorCount} 处结构失衡`,
      status: isBalanced ? "ok" : isAcceptable ? "warn" : "err",
    },
  ];

  // 实时真实 CSS Grid 代码
  const minExpr = state.clampSpan ? `min(${state.minColWidth}px, 100%)` : `${state.minColWidth}px`;
  const selCard = current.placements[state.selectedIdx] || current.placements[0];
  const cssLines = [
    `.adaptive-grid {`,
    `  display: grid;`,
    `  grid-template-columns: repeat(${state.fillMode}, minmax(${minExpr}, 1fr));`,
    `  gap: ${state.gutter}px;${state.flowMode === "dense" ? "\n  grid-auto-flow: dense;" : ""}`,
    `}`,
    selCard
      ? state.clampSpan && selCard.requestedSpan > 1
        ? `.card-${selCard.code.toLowerCase()} { grid-column: span ${selCard.usedSpan}; } /* 当前 ${current.autoCols} 列下已钳制，窄屏用容器/媒体查询降至 1 / -1 */`
        : `.card-${selCard.code.toLowerCase()} { grid-column: span ${selCard.requestedSpan}; }`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    theme,
    current,
    devices,
    issues,
    errorCount,
    warnCount,
    isBalanced,
    isAcceptable,
    verdict,
    keywordsLive,
    rulesLive,
    pipeline,
    cssLines,
    selectedCard: selCard,
  };
}

/**
 * 一步修复当前最严重的问题（供「按当前诊断修一步」按钮使用，严格基于单真源）
 */
export function applySmartFix(state, evalResult) {
  const next = { ...state, spans: [...state.spans] };
  const fixType = evalResult?.verdict?.fixType;
  const theme = THEMES[state.themeId] || THEMES.poster;

  if (fixType === "clamp") {
    next.clampSpan = true;
    const maxSafe = Math.min(4, Math.max(2, evalResult.current.autoCols));
    next.spans = next.spans.map((s) => Math.min(s, maxSafe));
    return next;
  }
  if (fixType === "mincol") {
    next.minColWidth = 128;
    return next;
  }
  if (fixType === "gutter") {
    next.gutter = 16;
    return next;
  }
  if (fixType === "autofit") {
    next.fillMode = "auto-fit";
    return next;
  }
  if (fixType === "row-flow") {
    next.flowMode = "row";
    return next;
  }
  if (fixType === "span-hierarchy") {
    next.spans = [...theme.idealSpans];
    next.clampSpan = true;
    return next;
  }
  if (fixType === "balance") {
    // 推至最接近当前宽度的完美咬合平衡解
    if (next.containerWidth >= 920) {
      next.containerWidth = 1120;
      next.minColWidth = 120;
      next.gutter = 16;
      next.clampSpan = true;
      next.spans = [...theme.idealSpans];
    } else {
      next.containerWidth = 768;
      next.minColWidth = 160;
      next.gutter = 16;
      next.clampSpan = true;
      next.spans = theme.cards.map((_, i) => (i === 0 || i === 1 || i === theme.cards.length - 1 ? 2 : 1));
    }
    return next;
  }
  return getPresetStates(state.themeId).poster8;
}
