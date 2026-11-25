// 250 自适应网格原语 —— 单真源布局内核
// 所有画布模块坐标、三端缩略预览、四维状态角标、白话诊单与实时 CSS 全部由本模块一次算出。

export const VIEWPORT_MIN = 240;
export const VIEWPORT_MAX = 1040;
export const FIXED_ROW_HEIGHT = 86;

export const DEVICES = [
  { id: "desktop", label: "桌面", en: "DESKTOP", width: 980 },
  { id: "tablet", label: "平板", en: "TABLET", width: 640 },
  { id: "mobile", label: "手机", en: "MOBILE", width: 360 },
];

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报几何",
    short: "原海报",
    items: [
      { id: 0, kind: "cobalt-circle", title: "圆核焦点", tag: "01", baseLines: 1, extraText: "蓝底暖米圆，主视觉锚点" },
      { id: 1, kind: "lines-dots", title: "文稿与点阵", tag: "02", baseLines: 2, extraText: "文本行与 14×5 点阵模块，内容伸展时同排等高跟随" },
      { id: 2, kind: "vermilion-arc", title: "朱橘扇弧", tag: "03", baseLines: 1, extraText: "四分之一圆弧，节奏转折" },
      { id: 3, kind: "cross-box", title: "图位占位", tag: "04", baseLines: 1, extraText: "对角交叉线，媒体容器" },
      { id: 4, kind: "cobalt-tri", title: "钴蓝三角", tag: "05", baseLines: 1, extraText: "定向几何标记，稳定重心" },
      { id: 5, kind: "wave-line", title: "折线节拍", tag: "06", baseLines: 1, extraText: "连续折线，衡量横向韵律" },
      { id: 6, kind: "plus-mark", title: "增补模组", tag: "07", baseLines: 1, extraText: "扩展十字，可随时增减模块" },
    ],
  },
  catalog: {
    id: "catalog",
    label: "器物图录",
    short: "图录",
    items: [
      { id: 0, kind: "cobalt-circle", title: "蓝釉手冲壶", tag: "¥280", baseLines: 1, extraText: "高硼硅耐热壶身，单手控流" },
      { id: 1, kind: "lines-dots", title: "瑞士格网活页笔记本与分栏索引纸", tag: "¥96", baseLines: 2, extraText: "100g 无酸暖米道林纸，5mm 浅灰点阵可平摊 180° 书写" },
      { id: 2, kind: "vermilion-arc", title: "陶橘桌面台灯", tag: "¥420", baseLines: 1, extraText: "哑光烤漆灯罩，无频闪暖光" },
      { id: 3, kind: "cross-box", title: "胡桃木尺架", tag: "¥138", baseLines: 1, extraText: "实木开槽，收纳直尺与钢笔" },
      { id: 4, kind: "cobalt-tri", title: "三角金属书挡", tag: "¥115", baseLines: 1, extraText: "3mm 冷轧钢板折弯防滑垫" },
      { id: 5, kind: "wave-line", title: "波纹玻璃水杯", tag: "¥68", baseLines: 1, extraText: "手吹竖棱纹理，冷热皆宜" },
      { id: 6, kind: "plus-mark", title: "模块化笔盘", tag: "¥84", baseLines: 1, extraText: "磁吸拼接槽，按桌面自由扩展" },
    ],
  },
  notes: {
    id: "notes",
    label: "版式卡片",
    short: "卡片",
    items: [
      { id: 0, kind: "cobalt-circle", title: "最小列宽", tag: "MIN", baseLines: 1, extraText: "守住单列最窄可读底线" },
      { id: 1, kind: "lines-dots", title: "无断点折列的核心不是凑像素而是定门槛", tag: "RULE", baseLines: 2, extraText: "浏览器用容器净宽除以门槛加间隙，自动向下取整得出列数" },
      { id: 2, kind: "vermilion-arc", title: "防溢出护栏", tag: "SAFE", baseLines: 1, extraText: "用 min(100%, var(--min)) 托底窄屏" },
      { id: 3, kind: "cross-box", title: "等高拉伸", tag: "STRETCH", baseLines: 1, extraText: "同排默认齐底，不必写死高度" },
      { id: 4, kind: "cobalt-tri", title: "空轨折叠", tag: "FIT", baseLines: 1, extraText: "auto-fit 把多余空列收拢归零" },
      { id: 5, kind: "wave-line", title: "统一间隙", tag: "GAP", baseLines: 1, extraText: "间隙归父容器管，模块零外边距" },
      { id: 6, kind: "plus-mark", title: "内容驱动", tag: "FLOW", baseLines: 1, extraText: "增删卡片不改一行布局代码" },
    ],
  },
};

// 开场故意停在 0/4 坏网格：窄侧栏/手机端 420px + 写死 4 列 + 零间隙 + 定高裁切 + 子卡乱写 margin
export const INITIAL_STATE = {
  theme: "poster",
  viewportWidth: 420,
  mode: "fixed4",        // "fixed4" | "bare-minmax" | "auto-fit" | "auto-fill"
  minWidth: 210,         // 110 .. 360 px
  gap: 0,                // 0 .. 44 px
  heightMode: "fixed",   // "fixed" | "auto" | "baseline"
  alignMode: "rogue",    // "rogue" | "unified"
  itemCount: 7,          // 2 .. 7
  expanded: [1],         // 模块 2（index 1）默认内容变长，立刻显出固定高度裁切问题
  showBaseline: true,
};

// 多种合法解与试错预设（支持一题多解 + 正反两头玩错）
export const PRESETS = {
  classic: {
    label: "原海报弹性解",
    kind: "good",
    patch: { mode: "auto-fit", minWidth: 210, gap: 16, heightMode: "auto", alignMode: "unified", itemCount: 7, viewportWidth: 720 },
  },
  autofill: {
    label: "目录等宽解",
    kind: "good",
    patch: { mode: "auto-fill", minWidth: 200, gap: 16, heightMode: "auto", alignMode: "unified", itemCount: 7, viewportWidth: 720 },
  },
  baselineCompact: {
    label: "基线紧凑解",
    kind: "good",
    patch: { mode: "auto-fit", minWidth: 176, gap: 12, heightMode: "baseline", alignMode: "unified", itemCount: 7, viewportWidth: 640 },
  },
  airyDisplay: {
    label: "宽舒展示解",
    kind: "good",
    patch: { mode: "auto-fit", minWidth: 256, gap: 24, heightMode: "auto", alignMode: "unified", itemCount: 7, viewportWidth: 920 },
  },
  errOverflow: {
    label: "试错：缺min(100%)爆框",
    kind: "bad",
    patch: { mode: "bare-minmax", minWidth: 320, gap: 16, heightMode: "auto", alignMode: "unified", itemCount: 7, viewportWidth: 264 },
  },
  errWideGap: {
    label: "试错：巨缝挤爆",
    kind: "bad",
    patch: { mode: "auto-fit", minWidth: 180, gap: 42, heightMode: "auto", alignMode: "unified", itemCount: 7, viewportWidth: 440 },
  },
  errTwoCards: {
    label: "试错：2卡拉扁对比",
    kind: "bad",
    patch: { mode: "auto-fit", minWidth: 200, gap: 16, heightMode: "auto", alignMode: "unified", itemCount: 2, viewportWidth: 960 },
  },
  resetBad: {
    label: "复原 0/4 坏网格",
    kind: "reset",
    patch: { ...INITIAL_STATE, expanded: [1] },
  },
};

const ROGUE_TOP = [0, 14, -5, 18, 8, -4, 12];
const ROGUE_LEFT = [0, 6, -4, 8, -5, 5, -3];

// 按真实 CSS Grid 轨道算法计算单个视口宽度下的列数、实测单列宽、溢出与空轨
export function solveTracks(width, { mode, minWidth, gap, itemCount }) {
  const W = Math.max(200, Math.round(width));
  const n = Math.max(1, Math.min(7, Math.round(itemCount)));
  const g = Math.max(0, Math.round(gap));
  const minW = Math.max(100, Math.round(minWidth));

  if (mode === "fixed4") {
    const cols = 4;
    const rawTrack = (W - (cols - 1) * g) / cols;
    const trackW = Math.max(28, rawTrack);
    const totalW = cols * trackW + (cols - 1) * g;
    const overflowPx = Math.max(0, Math.round(totalW - W));
    return {
      width: W,
      cols,
      rawCols: cols,
      emptyCols: Math.max(0, cols - n),
      trackW,
      overflowPx,
      gap: g,
    };
  }

  if (mode === "bare-minmax") {
    // 没有 min(100%, minWidth) 保护：一旦容器比 minWidth 窄，1 列依然撑到 minWidth → 真实横向溢出！
    if (W < minW) {
      return {
        width: W,
        cols: 1,
        rawCols: 1,
        emptyCols: 0,
        trackW: minW,
        overflowPx: Math.round(minW - W),
        gap: g,
      };
    }
    const rawCols = Math.max(1, Math.floor((W + g) / (minW + g)));
    const cols = Math.min(rawCols, n);
    const trackW = (W - (cols - 1) * g) / cols;
    return {
      width: W,
      cols,
      rawCols,
      emptyCols: 0,
      trackW,
      overflowPx: 0,
      gap: g,
    };
  }

  // 安全护栏：min(100%, minWidth)
  const effMin = Math.min(W, minW);
  const rawCols = Math.max(1, Math.floor((W + g) / (effMin + g)));
  if (mode === "auto-fit") {
    const cols = Math.min(rawCols, n);
    const trackW = (W - (cols - 1) * g) / cols;
    return {
      width: W,
      cols,
      rawCols,
      emptyCols: 0,
      trackW,
      overflowPx: 0,
      gap: g,
    };
  }

  // auto-fill：保留空轨不塌缩，维持每个模块一致的物理宽度
  const cols = rawCols;
  const trackW = (W - (cols - 1) * g) / cols;
  return {
    width: W,
    cols,
    rawCols,
    emptyCols: Math.max(0, rawCols - n),
    trackW,
    overflowPx: 0,
    gap: g,
  };
}

// 依据真实单列宽、题材文本和是否点击扩展，算出每张卡的自然内容高度与首行标题基线
export function layoutItems(state, width = state.viewportWidth) {
  const tracks = solveTracks(width, state);
  const themeDef = THEMES[state.theme] || THEMES.poster;
  const expandedSet = new Set(state.expanded || []);
  const count = Math.max(2, Math.min(7, state.itemCount));
  const items = themeDef.items.slice(0, count);

  const cols = tracks.cols;
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }

  const placed = [];
  let cursorY = 0;
  let maxClipPx = 0;
  let clippedCount = 0;
  let maxBaselineDrift = 0;

  rows.forEach((rowItems, rowIndex) => {
    // 1. 计算该行每张卡的内容所需自然高度与视觉帽高（graphicH）
    const metrics = rowItems.map((item, colIndex) => {
      const isExp = expandedSet.has(item.id);
      const isNarrow = tracks.trackW < 150;
      const charsPerLine = Math.max(4, Math.floor((tracks.trackW - 22) / 13));
      const titleLines = Math.max(1, Math.ceil(item.title.length / charsPerLine));
      const extraLines = isExp ? Math.max(2, Math.ceil(item.extraText.length / Math.max(6, charsPerLine + 2))) : 0;
      const bodyLines = item.baseLines + extraLines + (isNarrow ? 1 : 0);

      // 图示高度：宽格有大几何标本，窄格自动压紧但保留清晰形状；点击扩展或长标题卡顶部视觉区略有不同（便于验证基线对齐）
      const graphicH = item.id === 0 ? 50 : item.id === 1 ? 42 : item.id === 2 ? 46 : 38;
      const headerPad = state.heightMode === "baseline" && item.id % 2 === 1 ? 8 : 0;
      const titleOffsetFromTop = 14 + graphicH + 14 + headerPad;
      const neededH = Math.round(titleOffsetFromTop + titleLines * 17 + bodyLines * 14 + 14);

      return { item, colIndex, isExp, titleLines, bodyLines, graphicH, headerPad, titleOffsetFromTop, neededH };
    });

    // 若开启 baseline 对齐模式，同排所有模块把标题基线对齐到该排最大 titleOffsetFromTop
    const rowBaselineTarget = Math.max(...metrics.map((m) => m.titleOffsetFromTop));
    const rowNaturalH = Math.max(
      ...metrics.map((m) => {
        const alignShift = state.heightMode === "baseline" ? rowBaselineTarget - m.titleOffsetFromTop : 0;
        return m.neededH + alignShift;
      }),
    );

    const rowBoxH = state.heightMode === "fixed" ? FIXED_ROW_HEIGHT : rowNaturalH;

    // 算出该行实际落地的坐标与基线落差
    const rowBaselines = [];
    metrics.forEach((m) => {
      const rogueY = state.alignMode === "rogue" ? ROGUE_TOP[m.item.id % ROGUE_TOP.length] : 0;
      const rogueX = state.alignMode === "rogue" ? ROGUE_LEFT[m.item.id % ROGUE_LEFT.length] : 0;
      const alignShift = state.heightMode === "baseline" ? rowBaselineTarget - m.titleOffsetFromTop : 0;

      const x = m.colIndex * (tracks.trackW + tracks.gap) + rogueX;
      const y = cursorY + rogueY;
      const contentH = m.neededH + alignShift;
      const h = state.heightMode === "fixed" ? FIXED_ROW_HEIGHT : rowBoxH;
      const clipPx = state.heightMode === "fixed" ? Math.max(0, Math.round(contentH - FIXED_ROW_HEIGHT)) : 0;
      if (clipPx > 0) {
        clippedCount++;
        if (clipPx > maxClipPx) maxClipPx = clipPx;
      }

      const baselineY = y + m.titleOffsetFromTop + alignShift;
      rowBaselines.push(baselineY);

      placed.push({
        ...m.item,
        row: rowIndex,
        col: m.colIndex,
        x,
        y,
        w: tracks.trackW,
        h,
        contentH,
        graphicH: m.graphicH,
        alignShift,
        baselineY,
        clipPx,
        isExp: m.isExp,
        titleLines: m.titleLines,
        bodyLines: m.bodyLines,
        rogueX,
        rogueY,
      });
    });

    if (rowBaselines.length > 1) {
      const drift = Math.round(Math.max(...rowBaselines) - Math.min(...rowBaselines));
      if (drift > maxBaselineDrift) maxBaselineDrift = drift;
    }

    cursorY += rowBoxH + tracks.gap;
  });

  const totalH = Math.max(100, cursorY - (rows.length ? tracks.gap : 0));
  const rowCount = rows.length;

  // 若 auto-fill 且只有 1 行产生空轨，记录空轨矩形供画布绘虚线空槽
  const emptySlots = [];
  if (tracks.emptyCols > 0 && rows.length === 1) {
    const firstRowH = placed.length ? placed[0].h : 110;
    for (let c = items.length; c < tracks.cols; c++) {
      emptySlots.push({
        col: c,
        x: c * (tracks.trackW + tracks.gap),
        y: 0,
        w: tracks.trackW,
        h: firstRowH,
      });
    }
  }

  return {
    tracks,
    items: placed,
    emptySlots,
    rowCount,
    totalH,
    maxClipPx,
    clippedCount,
    maxBaselineDrift,
  };
}

// 算出该规则下，列数发生跃迁的临界宽度（给画布顶部标尺刻度用）
export function breakpointsFor(state) {
  if (state.mode === "fixed4") return [];
  const pts = [];
  for (let c = 2; c <= 5; c++) {
    const w = c * state.minWidth + (c - 1) * state.gap;
    if (w >= VIEWPORT_MIN && w <= VIEWPORT_MAX) pts.push({ cols: c, width: w });
  }
  return pts;
}

export function buildCSS(state) {
  const g = `${state.gap}px`;
  let colsRule = "";
  if (state.mode === "fixed4") {
    colsRule = `repeat(4, 1fr); /* 写死 4 列，窄屏硬挤 */`;
  } else if (state.mode === "bare-minmax") {
    colsRule = `repeat(auto-fit, minmax(${state.minWidth}px, 1fr)); /* 缺 min(100%, …) */`;
  } else {
    colsRule = `repeat(${state.mode}, minmax(min(100%, ${state.minWidth}px), 1fr));`;
  }

  const lines = [
    `.adaptive-grid {`,
    `  display: grid;`,
    `  grid-template-columns: ${colsRule}`,
    `  gap: ${g};`,
  ];
  if (state.heightMode === "baseline") {
    lines.push(`  align-items: baseline;`);
  }
  lines.push(`}`);

  if (state.heightMode === "fixed") {
    lines.push(`.adaptive-grid > * { height: ${FIXED_ROW_HEIGHT}px; overflow: hidden; /* 裁切 */ }`);
  }
  if (state.alignMode === "rogue") {
    lines.push(`.adaptive-grid > :nth-child(even) { margin-top: 14px; /* 破坏齐轨 */ }`);
  }
  return lines.join("\n");
}

// 完整单真源诊断：核验当前视口 + 桌面/平板/手机三端表现，覆盖 10 类双向错态与多组合法解
export function evaluateState(state) {
  const current = layoutItems(state, state.viewportWidth);
  const devices = DEVICES.map((d) => {
    const lay = layoutItems(state, d.width);
    const narrowCrushed = lay.tracks.trackW < 148;
    const badOverflow = lay.tracks.overflowPx > 0;
    const clipped = lay.maxClipPx > 0;
    const rogue = state.alignMode === "rogue";
    const status = badOverflow
      ? "overflow"
      : narrowCrushed
        ? "crushed"
        : clipped
          ? "clipped"
          : rogue
            ? "drift"
            : "ok";
    return { ...d, layout: lay, status };
  });

  // 同时测一个极端窄容器 260px，检验裸 minmax 是否会在超窄屏/侧栏溢出
  const probeNarrow = solveTracks(260, state);
  const worstTrackW = Math.min(current.tracks.trackW, ...devices.map((d) => d.layout.tracks.trackW));
  const worstOverflow = Math.max(current.tracks.overflowPx, probeNarrow.overflowPx, ...devices.map((d) => d.layout.tracks.overflowPx));

  // 四大原语支柱逐一实测
  const hasFixed4 = state.mode === "fixed4";
  const hasBareOverflow = state.mode === "bare-minmax" && (worstOverflow > 0 || state.minWidth > 260);
  const minTooNarrow = state.mode !== "fixed4" && state.minWidth < 155;
  const minTooWide = state.mode !== "fixed4" && state.minWidth > 320;
  const currentOverflow = current.tracks.overflowPx > 0;
  const currentCrushed = current.tracks.trackW < 148;
  const tabletStuckOneCol = devices[1].layout.tracks.cols < 2 && state.itemCount >= 2;
  const stretchTooWide = state.mode === "auto-fit" && state.itemCount <= 3 && current.tracks.trackW > 430;

  // 1. 灵活伸缩（无断点折列、无溢出、无压碎）
  const flexOk = !hasFixed4 && !hasBareOverflow && !currentOverflow && !currentCrushed && !minTooNarrow && !minTooWide && !tabletStuckOneCol;

  // 2. 统一对齐（父容器统一轨道 + 同排齐平/齐基线）
  const alignOk = state.alignMode === "unified";

  // 3. 节奏与间距（8px–32px 清晰呼吸带，不粘连也不反客为主）
  const gapZero = state.gap < 8;
  const gapTooWide = state.gap > 32;
  const rhythmOk = !gapZero && !gapTooWide;

  // 4. 内容驱动（绝不写死高度裁切文字，且少卡不至于畸形拉扁）
  const clipped = current.maxClipPx > 0 || devices.some((d) => d.layout.maxClipPx > 0);
  const contentOk = !clipped && !stretchTooWide;

  const passed = [flexOk, alignOk, rhythmOk, contentOk].filter(Boolean).length;

  // 生成高优先级单真源白话诊断（讲清「现象 + 观者为何难受 + 怎么改」）
  let code = "pass";
  let badge = `${passed}/4 · 秩序成立`;
  let headline = "";
  let body = "";
  let actionText = "";
  let fixAction = null;

  if (currentOverflow || hasBareOverflow) {
    const ov = currentOverflow ? current.tracks.overflowPx : probeNarrow.overflowPx;
    code = "overflow";
    badge = `${passed}/4 · 横向爆框`;
    headline = currentOverflow
      ? `缺少 min(100%, …) 护栏，容器右侧爆出 +${ov}px`
      : `裸 minmax(${state.minWidth}px, 1fr) 埋下窄屏隐患（260px 端溢出 +${ov}px）`;
    body = `直接写 minmax(${state.minWidth}px, 1fr) 时，一旦容器缩到比 ${state.minWidth}px 还窄，单列仍硬撑着不肯退让，页面被迫冒出横向滚动条。把下限套上 min(100%, ${state.minWidth}px)，容器够宽守门槛、比门槛更窄就顺势回落到 100%。`;
    actionText = "把列轨切到「auto-fit + min(100%)」或「auto-fill + min(100%)」，立刻加上防溢出护栏。";
    fixAction = { label: "补上 min(100%) 护栏", patch: { mode: "auto-fit" } };
  } else if (hasFixed4) {
    const mobW = Math.round(devices[2].layout.tracks.trackW);
    code = "fixed4";
    badge = `${passed}/4 · 写死挤碎`;
    headline = `写死 4 列轨道，360px 手机端每列被压成 ${mobW}px 纸条`;
    body = `用 repeat(4, 1fr) 硬锁列数时，电脑宽屏看着勉强齐整，一旦缩进平板侧栏或手机屏幕，四个模块就被挤得连一句完整标题都折成四五截。自适应网格不锁列数，只给每列定一条最窄可读门槛（通常 170–260px），让浏览器自己决定排几列。`;
    actionText = "把列轨引擎改用「auto-fit」或「auto-fill」，再左右横拖画布看列数自动折算。";
    fixAction = { label: "改用 auto-fit 自适应", patch: { mode: "auto-fit", minWidth: 210 } };
  } else if (minTooNarrow) {
    code = "min-narrow";
    badge = `${passed}/4 · 门槛过窄`;
    headline = `最小列宽压到 ${state.minWidth}px，手机端硬塞进 ${devices[2].layout.tracks.cols} 列窄条`;
    body = `虽然开启了自动折列，但 ${state.minWidth}px 门槛太低，导致 360px 窄屏里硬挤出 ${devices[2].layout.tracks.cols} 列（每列仅 ${Math.round(devices[2].layout.tracks.trackW)}px），观者扫视时视线频繁折行、图文拥挤。把下限抬到 170–260px 经验带，窄屏才会干脆退成清晰的一到两列。`;
    actionText = "把「最小列宽 --min」拖到 170px–260px 区间，守住单张卡片的可读底线。";
    fixAction = { label: "门槛调回 210px", patch: { minWidth: 210 } };
  } else if (minTooWide || tabletStuckOneCol) {
    code = "min-wide";
    badge = `${passed}/4 · 门槛过宽`;
    headline = `最小列宽设到 ${state.minWidth}px，640px 平板被迫退成单列`;
    body = `门槛超过 320px 后，连 640px 宽的平板都放不下两列（需要 ${2 * state.minWidth + state.gap}px），整个中屏区间失去多列排布的效率，上下滚动变长一倍。把最小列宽收回 170–280px，桌面/平板/手机才会自然拉开三档列数层次。`;
    actionText = "把「最小列宽 --min」调回 180px–260px，让平板自然展开双列或三列。";
    fixAction = { label: "门槛收回 220px", patch: { minWidth: 220 } };
  } else if (clipped) {
    const worstClip = Math.max(current.maxClipPx, ...devices.map((d) => d.layout.maxClipPx));
    code = "clipped";
    badge = `${passed}/4 · 定高裁切`;
    headline = `写死 height: ${FIXED_ROW_HEIGHT}px，长内容模块底部被截断 -${worstClip}px`;
    body = `海报第一条写着「模块可按内容自动扩展」。一旦给卡片写死像素高度，只要标题多出一行、换了长词或缩窄屏幕导致折行，底沿文案立刻被裁掉。拿掉固定高度、交给网格行轨自然伸展，同行所有模块会一起齐平长高，谁也不裁字。`;
    actionText = "把「模块高度」切到「内容驱动等高」或「基线对齐」，再点画布里任意模块试试加长文案。";
    fixAction = { label: "改为内容驱动等高", patch: { heightMode: "auto" } };
  } else if (gapZero) {
    code = "gap-zero";
    badge = `${passed}/4 · 零缝粘连`;
    headline = `间隙仅 ${state.gap}px，模块边缘贴死失去视觉节奏`;
    body = `没有一致的 gap 留白，相邻的几何色块和文字卡就会糊成一整张墙，观者分不清哪行字属于哪张卡。用父容器统一的 gap（经验值 12–24px）切开模块，无论怎么折列，节奏永远匀称。`;
    actionText = "把「统一间隙 gap」拉到 12px–24px 之间，让翠绿格缝自然透出来。";
    fixAction = { label: "间隙调至 16px", patch: { gap: 16 } };
  } else if (gapTooWide) {
    code = "gap-wide";
    badge = `${passed}/4 · 巨缝挤爆`;
    headline = `间隙拉宽到 ${state.gap}px，缝隙反客为主把卡片切散`;
    body = `过大的间距让列间像裂开的鸿沟，一方面在 360–640px 屏幕里白白吃掉可用列宽、提前触发折列，另一方面卡片之间失去「同属一组」的格式塔接近感。把 gap 收回 12–24px，卡片既独立又成群。`;
    actionText = "把「统一间隙 gap」收回 12px–24px 区间，恢复紧致均匀的网格节奏。";
    fixAction = { label: "间隙收回 18px", patch: { gap: 18 } };
  } else if (!alignOk) {
    code = "rogue-align";
    badge = `${passed}/4 · 边距错齿`;
    headline = `模块各自乱写 margin-top，同行基线错开 ${current.maxBaselineDrift}px`;
    body = `原海报强调「所有元素遵循共同对齐规则」。如果允许某张卡片偷偷加外边距微调位置，整排顶线与标题基线立刻出现锯齿，折列后错位还会随机跳到下一行。删掉子项个别 margin，把排布权全部交回容器网格线。`;
    actionText = "把「对齐基准」切回「容器统一齐轨」，让同行顶边与基线误差归零。";
    fixAction = { label: "收回统一齐轨", patch: { alignMode: "unified" } };
  } else if (stretchTooWide) {
    code = "stretch-wide";
    badge = `${passed}/4 · 少卡拉扁`;
    headline = `仅 ${state.itemCount} 张卡用 auto-fit，在 ${Math.round(state.viewportWidth)}px 宽屏被拉成 ${Math.round(current.tracks.trackW)}px 超长横条`;
    body = `auto-fit 会把空白列轨折叠为 0px，让剩下的 ${state.itemCount} 张卡撑满整行——当单卡拉超过 430px 时，原本紧凑的卡片比例会变形拉扁。遇到卡片数量少、需要守住一致卡片宽度的目录页，切换 auto-fill 保留空轨会更克制。`;
    actionText = "把列轨切到「auto-fill」看右侧虚线空轨如何锁住单卡原宽，或把卡片数量加回 4–7 张。";
    fixAction = { label: "换用 auto-fill 锁宽", patch: { mode: "auto-fill" } };
  } else {
    // 全部 4/4 通过：根据不同合法解给出差异化评语
    const styleName =
      state.mode === "auto-fill"
        ? "目录等宽解（auto-fill）"
        : state.heightMode === "baseline"
          ? "基线精排解（baseline）"
          : state.minWidth >= 245
            ? "宽舒展示解"
            : state.minWidth <= 185
              ? "紧凑高密解"
              : "标准弹性解（auto-fit）";
    code = "pass";
    badge = `4/4 · ${styleName}`;
    headline = `秩序成立：${devices[0].layout.tracks.cols}→${devices[1].layout.tracks.cols}→${devices[2].layout.tracks.cols} 列自然折算，三端零溢出零裁切`;
    body = `这一套规则不写一条 @media 断点：桌面 ${devices[0].width}px 排 ${devices[0].layout.tracks.cols} 列（${Math.round(devices[0].layout.tracks.trackW)}px）、平板 ${devices[1].width}px 排 ${devices[1].layout.tracks.cols} 列（${Math.round(devices[1].layout.tracks.trackW)}px）、手机 ${devices[2].width}px 排 ${devices[2].layout.tracks.cols} 列（${Math.round(devices[2].layout.tracks.trackW)}px）；点任意模块加长文案，同行依然齐平。`;
    actionText = "你还可以左右横拖画布、点击任意模块扩充文案，或点下方「试错」按钮看看打破哪条规则会先崩。";
  }

  // 原海报第四行四支柱实时状态
  const pillars = [
    {
      id: "flexible",
      zh: "灵活伸缩",
      en: "FLEXIBLE",
      quote: "模块按需扩展或收缩 不破坏整体秩序",
      ok: flexOk,
      tag: hasFixed4
        ? "写死 4 列"
        : currentOverflow || hasBareOverflow
          ? `溢出 +${worstOverflow}px`
          : minTooNarrow
            ? `下限偏窄 ${state.minWidth}px`
            : minTooWide || tabletStuckOneCol
              ? `下限偏宽 ${state.minWidth}px`
              : `${devices[0].layout.tracks.cols}/${devices[1].layout.tracks.cols}/${devices[2].layout.tracks.cols} 列自动`,
      focusControl: "mode",
    },
    {
      id: "consistent",
      zh: "统一对齐",
      en: "CONSISTENT",
      quote: "所有元素遵循共同 对齐规则",
      ok: alignOk,
      tag: alignOk
        ? state.heightMode === "baseline"
          ? "基线齐平 0px"
          : "齐轨 0px"
        : `错齿 ${current.maxBaselineDrift}px`,
      focusControl: "alignMode",
    },
    {
      id: "rhythm",
      zh: "节奏与间距",
      en: "RHYTHM",
      quote: "通过一致的间距与留白 建立视觉节奏",
      ok: rhythmOk,
      tag: gapZero ? `${state.gap}px 粘连` : gapTooWide ? `${state.gap}px 过宽` : `均缝 ${state.gap}px`,
      focusControl: "gap",
    },
    {
      id: "content",
      zh: "内容驱动",
      en: "CONTENT-DRIVEN",
      quote: "结构服务内容 内容决定形态",
      ok: contentOk,
      tag: clipped
        ? `裁切 -${Math.max(current.maxClipPx, ...devices.map((d) => d.layout.maxClipPx))}px`
        : stretchTooWide
          ? `拉扁 ${Math.round(current.tracks.trackW)}px`
          : "自然伸展 0 裁",
      focusControl: "heightMode",
    },
  ];

  return {
    current,
    devices,
    breakpoints: breakpointsFor(state),
    css: buildCSS(state),
    worstTrackW: Math.round(worstTrackW),
    worstOverflow,
    passed,
    flexOk,
    alignOk,
    rhythmOk,
    contentOk,
    code,
    badge,
    headline,
    body,
    actionText,
    fixAction,
    pillars,
  };
}
