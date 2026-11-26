// 134 多栏版式 · 单真源几何、折行与诊断模型
// 所有画布实绘矩形、真实中文折行字数、占位密度、四柱状态与白话诊单均由此模块统一算出。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "瑞士展板",
    en: "SWISS SPECIMEN",
    pageTitle: "多栏建筑秩序",
    pageSub: "GRID · MODULE · DENSITY · ORDER",
    headline: "用可整除的栏轨搭出多源版面",
    heroCaption: "主视觉黄块 · 跨栏建立第一入口",
    lead: "多栏版式不是把纸面切成密不透风的豆腐块，而是先立下可整除的纵向栏轨，再让标题、大图、正文与数据点阵按权重跨栏落位。",
    body: "当栏数定在六栏时，同一张页面既能排左右三加三对照，也能排三栏并列，还能排四加二非对称图文。所有模块踩紧白线栏轨，再刻意空出一块透气留白，整页便既有报刊容量又有清晰呼吸节奏。",
    briefs: ["栅格对齐", "模块复用", "疏密节奏"],
    matrixLabel: "3×5 秩序点阵",
    note: "透气留白槽：信息越密集，越要给眼睛留出停顿与喘息的空白栏。",
  },
  magazine: {
    id: "magazine",
    label: "周刊头版",
    en: "MAGAZINE SPREAD",
    headline: "滨海旧仓改建市民阅读大厅",
    pageTitle: "建筑周刊 · 第 42 期",
    pageSub: "ARCHITECTURE WEEKLY · FEATURE",
    heroCaption: "南向采光桁架主图 · 摄影跨栏",
    lead: "三座建于上世纪的临港红砖货仓被贯通成开放阅读长廊，设计团队保留原始钢梁柱网，只在新添书架间切出三道天窗采光井。",
    body: "柱网本身就是建筑里的多栏栅格：主阅览厅跨占四跨大空间，期刊阅览席占两跨，走廊与咖啡区退守边缘一跨。人们走进去不用看指示牌，光影与跨度大小自然替脚步排出先后顺序。",
    briefs: ["主馆跨度", "天窗采光", "开放时段"],
    matrixLabel: "空间分区索引",
    note: "留白透气栏：让读者从主图视线平滑滑向正文，不与右侧快讯打架。",
  },
  catalog: {
    id: "catalog",
    label: "商品图录",
    en: "DESIGN CATALOG",
    headline: "秋季木作器物与照明年鉴",
    pageTitle: "器物图录 · AUTUMN",
    pageSub: "OBJECT INDEX · MODULAR EDITION",
    heroCaption: "主打台灯实景图 · 占据主跨度",
    lead: "一份器物图录要在单页里同时放进新品主图、工艺说明、尺寸参数矩阵与三款配色索引，靠统一模块与跨栏主次才能扫一眼不迷路。",
    body: "常规单品说明按标准窄栏排列以保证横向可比性，本季重点器物则横跨多栏放大展示，并把参数表收进规律的点阵格。留出干净的栏间留白与呼吸区，图录才不会像密密麻麻的批发货单。",
    briefs: ["白橡木", "黄铜件", "磨砂玻璃"],
    matrixLabel: "规格对照矩阵",
    note: "图录缓冲留白：把主打新品与常规参数群清楚隔开，一眼锁定主角。",
  },
};

// 开场刻意停在 0/4 复合错态：
// 6 栏底座 + 脱栏漂移 10px + 栏距塌缩 4px + 全员等宽 1 栏（跨度比 1.0×，正文约 6 字/行）+
// 满塞补白开启（占位 >90% 无透气留白）+ 标题仅占 1 栏且排在快讯后方（层级倒挂）
export function createInitialState(specimenId = "poster") {
  return {
    specimen: specimenId,
    cols: 6,
    gutter: 4,
    drift: 10,
    voidEnabled: false,
    selectedId: "hero",
    showGuides: true,
    scanPhase: -1,
    modules: [
      { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 0, span: 1, rows: 2 },
      { id: "headline", name: "头条大标",   role: "headline", colStart: 1, span: 1, rows: 1 },
      { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 2, span: 1, rows: 2 },
      { id: "body",     name: "核心正文栏", role: "body",     colStart: 3, span: 1, rows: 2 },
      { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 4, span: 1, rows: 2 },
      { id: "side",     name: "补白附注栏", role: "side",     colStart: 5, span: 1, rows: 2 },
    ],
  };
}

// 多组合法解与主动试错态（接受多解，绝不绑死唯一模板）
export const PRESETS = {
  editorial6: {
    label: "6 栏报刊解",
    kind: "good",
    apply: (specimen) => ({
      specimen,
      cols: 6,
      gutter: 16,
      drift: 0,
      voidEnabled: true,
      selectedId: "hero",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 6, rows: 1 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 0, span: 4, rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 4, span: 2, rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 0, span: 3, rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 3, span: 2, rows: 2 },
        { id: "side",     name: "留白透气槽", role: "side",     colStart: 5, span: 1, rows: 2 },
      ],
    }),
  },
  poster4: {
    label: "4 栏展板解",
    kind: "good",
    apply: (specimen) => ({
      specimen,
      cols: 4,
      gutter: 18,
      drift: 0,
      voidEnabled: true,
      selectedId: "hero",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 4, rows: 1 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 0, span: 2, rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 2, span: 2, rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 0, span: 1, rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 1, span: 2, rows: 2 },
        { id: "side",     name: "留白透气槽", role: "side",     colStart: 3, span: 1, rows: 2 },
      ],
    }),
  },
  swiss3: {
    label: "3 栏杂志解",
    kind: "good",
    apply: (specimen) => ({
      specimen,
      cols: 3,
      gutter: 20,
      drift: 0,
      voidEnabled: true,
      selectedId: "hero",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 3, rows: 1 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 0, span: 2, rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 2, span: 1, rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 0, span: 1, rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 1, span: 1, rows: 2 },
        { id: "side",     name: "留白透气槽", role: "side",     colStart: 2, span: 1, rows: 2 },
      ],
    }),
  },
  catalog12: {
    label: "12 栏精密解",
    kind: "good",
    apply: (specimen) => ({
      specimen,
      cols: 12,
      gutter: 12,
      drift: 0,
      voidEnabled: true,
      selectedId: "hero",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 12, rows: 1 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 0, span: 7,  rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 7, span: 5,  rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 0, span: 6,  rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 6, span: 4,  rows: 2 },
        { id: "side",     name: "留白透气槽", role: "side",     colStart: 10, span: 2, rows: 2 },
      ],
    }),
  },
  errToothpick: {
    label: "试错：8 栏碎切",
    kind: "bad",
    apply: (specimen) => ({
      specimen,
      cols: 8,
      gutter: 12,
      drift: 0,
      voidEnabled: true,
      selectedId: "body",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 8, rows: 1 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 0, span: 4, rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 4, span: 1, rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 5, span: 3, rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 0, span: 3, rows: 2 },
        { id: "side",     name: "留白透气槽", role: "side",     colStart: 5, span: 3, rows: 2 },
      ],
    }),
  },
  errYellowPages: {
    label: "试错：满塞黄页",
    kind: "bad",
    apply: (specimen) => ({
      specimen,
      cols: 6,
      gutter: 6,
      drift: 0,
      voidEnabled: false,
      selectedId: "side",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 2, rows: 2 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 2, span: 2, rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 4, span: 2, rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 0, span: 2, rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 2, span: 2, rows: 2 },
        { id: "side",     name: "补白附注栏", role: "side",     colStart: 4, span: 2, rows: 2 },
      ],
    }),
  },
  errChasm: {
    label: "试错：裂谷宽缝",
    kind: "bad",
    apply: (specimen) => ({
      specimen,
      cols: 4,
      gutter: 44,
      drift: 0,
      voidEnabled: true,
      selectedId: "hero",
      showGuides: true,
      scanPhase: -1,
      modules: [
        { id: "headline", name: "头条大标",   role: "headline", colStart: 0, span: 4, rows: 1 },
        { id: "hero",     name: "主视觉黄块", role: "hero",     colStart: 0, span: 2, rows: 2 },
        { id: "body",     name: "核心正文栏", role: "body",     colStart: 2, span: 2, rows: 2 },
        { id: "matrix",   name: "数据点阵卡", role: "matrix",   colStart: 0, span: 1, rows: 2 },
        { id: "brief",    name: "次要快讯条", role: "brief",    colStart: 1, span: 2, rows: 2 },
        { id: "side",     name: "留白透气槽", role: "side",     colStart: 3, span: 1, rows: 2 },
      ],
    }),
  },
  resetBad: {
    label: "复原错态",
    kind: "reset",
    apply: (specimen) => createInitialState(specimen),
  },
};

export function wrapTextLines(text, maxWidth, fontSize, measureFn) {
  const widthOf = measureFn || ((s) => {
    let w = 0;
    for (const ch of s) {
      w += ch.charCodeAt(0) > 0x2e80 ? fontSize : fontSize * 0.54;
    }
    return w;
  });
  const usable = Math.max(fontSize * 1.4, maxWidth);
  const lines = [];
  let cur = "";
  for (const ch of text) {
    if (ch === "\n") {
      lines.push(cur);
      cur = "";
      continue;
    }
    const test = cur + ch;
    if (cur.length > 0 && widthOf(test) > usable) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function remapStateCols(state, newCols) {
  const oldCols = state.cols;
  if (oldCols === newCols) return state;
  const ratio = newCols / oldCols;
  const nextModules = state.modules.map((m) => {
    const scaledSpan = Math.max(1, Math.min(newCols, Math.round(m.span * ratio)));
    const scaledStart = Math.max(0, Math.min(newCols - scaledSpan, Math.round(m.colStart * ratio)));
    return { ...m, span: scaledSpan, colStart: scaledStart };
  });
  return { ...state, cols: newCols, modules: nextModules };
}

// 统一使用 720px 基准出版页宽（手机与桌面读数 100% 一致，绝不因屏幕宽度变化而出现读数跳变）
export function computeLayout(state, sheetW = 720, sheetH = 460, dragPreview = null, measureFn = null) {
  const padX = 20;
  const padTop = 28;    // 顶部栏号标尺
  const padBottom = 26; // 底部参数标尺带（绝不与顶部栏号撞车）
  const cols = state.cols;
  const innerW = sheetW - padX * 2;
  const innerH = sheetH - padTop - padBottom;

  const maxSafeGutter = Math.max(4, Math.floor((innerW - cols * 22) / Math.max(1, cols - 1)));
  const gutter = Math.min(state.gutter, maxSafeGutter);
  const colW = (innerW - gutter * (cols - 1)) / cols;
  const trackStep = colW + gutter;

  const rowGap = Math.max(7, Math.min(12, Math.round(gutter * 0.65)));
  const totalGridRows = 5;
  const rowH = (innerH - rowGap * (totalGridRows - 1)) / totalGridRows;

  const occ = Array.from({ length: totalGridRows }, () => Array(cols).fill(false));
  const placed = [];
  const driftSigns = { headline: 1, hero: -1, body: 1, matrix: -0.75, brief: 0.85, side: -0.6 };

  for (const mod of state.modules) {
    let span = Math.max(1, Math.min(cols, mod.span));
    let start = Math.max(0, Math.min(cols - span, mod.colStart));
    let visualSpan = span;
    let visualStart = start;

    if (dragPreview && dragPreview.id === mod.id) {
      if (dragPreview.mode === "resize") {
        visualSpan = Math.max(0.75, Math.min(cols - start, dragPreview.liveSpanFloat));
        span = Math.max(1, Math.min(cols - start, Math.round(visualSpan)));
      } else if (dragPreview.mode === "move") {
        visualStart = Math.max(0, Math.min(cols - span, dragPreview.liveStartFloat));
        start = Math.max(0, Math.min(cols - span, Math.round(visualStart)));
      }
    }

    const needRows = mod.rows;
    let placedRow = -1;
    let placedCol = start;

    const fitsAt = (r, c, sp, rh) => {
      if (r + rh > totalGridRows || c < 0 || c + sp > cols) return false;
      for (let rr = r; rr < r + rh; rr++) {
        for (let cc = c; cc < c + sp; cc++) {
          if (occ[rr][cc]) return false;
        }
      }
      return true;
    };

    for (let r = 0; r <= totalGridRows - needRows; r++) {
      if (fitsAt(r, start, span, needRows)) {
        placedRow = r;
        placedCol = start;
        break;
      }
    }
    if (placedRow < 0) {
      outer: for (let r = 0; r <= totalGridRows - needRows; r++) {
        for (let c = 0; c <= cols - span; c++) {
          if (fitsAt(r, c, span, needRows)) {
            placedRow = r;
            placedCol = c;
            break outer;
          }
        }
      }
    }
    let actualRows = needRows;
    if (placedRow < 0) {
      actualRows = 1;
      outer2: for (let r = 0; r < totalGridRows; r++) {
        for (let c = 0; c <= cols - span; c++) {
          if (fitsAt(r, c, span, 1)) {
            placedRow = r;
            placedCol = c;
            break outer2;
          }
        }
      }
      if (placedRow < 0) {
        placedRow = totalGridRows - 1;
        placedCol = Math.min(start, cols - span);
      }
    }

    for (let rr = placedRow; rr < Math.min(totalGridRows, placedRow + actualRows); rr++) {
      for (let cc = placedCol; cc < Math.min(cols, placedCol + span); cc++) {
        occ[rr][cc] = true;
      }
    }

    const driftPx = state.drift ? Math.round(state.drift * (driftSigns[mod.id] || 1)) : 0;
    const useStart = dragPreview && dragPreview.id === mod.id && dragPreview.mode === "move" ? visualStart : placedCol;
    const useSpan = dragPreview && dragPreview.id === mod.id && dragPreview.mode === "resize" ? visualSpan : span;

    let x = padX + useStart * trackStep + driftPx;
    let w = useSpan * colW + Math.max(0, useSpan - 1) * gutter;
    x = Math.max(8, Math.min(sheetW - 24, x));
    if (x + w > sheetW - 8) w = Math.max(24, sheetW - 8 - x);

    const y = padTop + placedRow * (rowH + rowGap);
    const h = actualRows * rowH + (actualRows - 1) * rowGap;
    const isVoid = mod.id === "side" && state.voidEnabled;

    placed.push({
      ...mod,
      placedCol,
      placedRow,
      actualRows,
      span,
      visualSpan: useSpan,
      x,
      y,
      w,
      h,
      isVoid,
      driftPx,
    });
  }

  // 当「留白透气槽」关闭时，剩余空格会被「满塞补白文字/豆腐块」填满，真实呈现黄页窒息感！
  const fillers = [];
  if (!state.voidEnabled) {
    const fOcc = occ.map((r) => [...r]);
    for (let r = 0; r < totalGridRows; r++) {
      for (let c = 0; c < cols; c++) {
        if (fOcc[r][c]) continue;
        // 纵向最多合并 2 行形成密集单栏补白条
        let rh = 1;
        if (r + 1 < totalGridRows && !fOcc[r + 1][c]) rh = 2;
        for (let rr = r; rr < r + rh; rr++) fOcc[rr][c] = true;
        const driftPx = state.drift ? Math.round(state.drift * (c % 2 === 0 ? 0.65 : -0.65)) : 0;
        let fx = padX + c * trackStep + driftPx;
        fx = Math.max(8, Math.min(sheetW - 24, fx));
        let fw = colW;
        if (fx + fw > sheetW - 8) fw = Math.max(20, sheetW - 8 - fx);
        fillers.push({
          row: r,
          col: c,
          rows: rh,
          x: fx,
          y: padTop + r * (rowH + rowGap),
          w: fw,
          h: rh * rowH + (rh - 1) * rowGap,
        });
      }
    }
  }

  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const bodyBox = placed.find((m) => m.id === "body");
  const headBox = placed.find((m) => m.id === "headline");
  const heroBox = placed.find((m) => m.id === "hero");
  const briefBox = placed.find((m) => m.id === "brief");

  // 固定按 720px 标准页幅的 12.5px 字体实测折行
  const bodyFontPx = 12.5;
  const bodyLineHeight = Math.round(bodyFontPx * 1.56); // ~20px
  const bodyInnerW = bodyBox ? Math.max(20, bodyBox.w - 18) : 120;
  const bodyLines = wrapTextLines(spec.body, bodyInnerW, bodyFontPx, measureFn);
  const fullLines = bodyLines.length > 1 ? bodyLines.slice(0, -1) : bodyLines;
  const avgCharsPerLine = fullLines.length
    ? Math.round(fullLines.reduce((s, l) => s + [...l].length, 0) / fullLines.length)
    : 0;

  // 有效墨面占位率（含未开留白时的补白塞满块）
  const totalCells = totalGridRows * cols;
  let filledCells = 0;
  for (const m of placed) {
    if (!m.isVoid) filledCells += m.span * m.actualRows;
  }
  for (const f of fillers) {
    filledCells += f.rows;
  }
  const densityPct = Math.min(98, Math.round((filledCells / Math.max(1, totalCells)) * 100));

  const activeSpans = placed.filter((m) => !m.isVoid).map((m) => m.span);
  const maxSpan = Math.max(...activeSpans, 1);
  const minSpan = Math.min(...activeSpans, 1);
  const spanRatio = +(maxSpan / Math.max(1, minSpan)).toFixed(2);
  const gutterLeadingRatio = +(gutter / bodyLineHeight).toFixed(2);

  const tracks = [];
  for (let c = 0; c < cols; c++) {
    tracks.push({ index: c, x: padX + c * trackStep, w: colW });
  }

  return {
    sheetW,
    sheetH,
    padX,
    padTop,
    padBottom,
    innerW,
    innerH,
    cols,
    gutter,
    colW,
    trackStep,
    rowH,
    rowGap,
    totalGridRows,
    tracks,
    placed,
    fillers,
    bodyFontPx,
    bodyLineHeight,
    bodyLines,
    avgCharsPerLine,
    densityPct,
    spanRatio,
    maxSpan,
    minSpan,
    gutterLeadingRatio,
    headSpan: headBox ? headBox.span : 1,
    heroSpan: heroBox ? heroBox.span : 1,
    bodySpan: bodyBox ? bodyBox.span : 1,
    briefSpan: briefBox ? briefBox.span : 1,
    headRow: headBox ? headBox.placedRow : 0,
    briefRow: briefBox ? briefBox.placedRow : 0,
  };
}

export function evaluateLayout(state, layout) {
  const issues = [];
  const { cols, gutter, colW, avgCharsPerLine, densityPct, spanRatio, gutterLeadingRatio, headSpan, heroSpan, bodySpan, briefSpan } = layout;

  if (Math.abs(state.drift) >= 2) {
    issues.push({
      code: "off_grid",
      pillar: "grid",
      severity: 100,
      short: `脱栏 +${Math.abs(state.drift)}px`,
      title: `模块边线偏离白线栏轨 ${Math.abs(state.drift)}px，栅格骨架已经散架`,
      why: "多栏能稳住复杂页面，靠的正是每条左右边线都严丝合缝踩在隐形栏轨上。一旦模块各自左右漂移，视觉纵轴断成锯齿，页面瞬间失去秩序感。",
      actionHint: "把「脱栏漂移」归零，让所有模块的左右边重新贴紧白线栏轨。",
      fixLabel: "一键对齐白线栏轨",
      fix: (s) => ({ ...s, drift: 0 }),
    });
  }

  if (gutter < 10 || gutterLeadingRatio < 0.52) {
    issues.push({
      code: "gutter_crushed",
      pillar: "grid",
      severity: 95,
      short: `栏距 ${gutter}px 粘连`,
      title: `栏距仅 ${gutter}px（行距的 ${gutterLeadingRatio.toFixed(2)} 倍），相邻两栏已经粘连串读`,
      why: `当前正文行距约 ${layout.bodyLineHeight}px，而两栏缝隙比行距还窄。人眼按邻近性分组时会直接横穿栏缝跳进隔壁栏，读起来乱成一片。`,
      actionHint: "把栏距推到 12–24px（约行距的 0.6–1.3 倍），给每栏筑出清晰隔离沟。",
      fixLabel: "把栏距拉开到 16px",
      fix: (s) => ({ ...s, gutter: 16 }),
    });
  }

  if (gutter > 34 || gutter > colW * 0.52) {
    issues.push({
      code: "gutter_chasm",
      pillar: "grid",
      severity: 86,
      short: `裂谷 ${gutter}px`,
      title: `栏距拉到了 ${gutter}px，页面被劈成互不相干的孤岛`,
      why: `每栏实宽仅 ${Math.round(colW)}px，栏缝却宽达 ${gutter}px。缝隙反客为主抢走了内容本身的注意力，原本一体的页面裂成几根散落的孤条。`,
      actionHint: "把栏距收回到 12–24px 经验区，让模块之间既独立又保持整体关联。",
      fixLabel: "把栏距收回到 18px",
      fix: (s) => ({ ...s, gutter: 18 }),
    });
  }

  const hierarchyBad = headSpan < briefSpan || headSpan < bodySpan || (headSpan === 1 && cols >= 3) || (heroSpan < briefSpan && cols >= 4);
  if (hierarchyBad) {
    const hShort = headSpan <= 1
      ? "大标缩至 1 栏"
      : headSpan < briefSpan
        ? `大标 ${headSpan}<快讯 ${briefSpan}`
        : headSpan < bodySpan
          ? `大标 ${headSpan}<正文 ${bodySpan}`
          : `主图 ${heroSpan}<快讯 ${briefSpan}`;
    issues.push({
      code: "hierarchy_inverted",
      pillar: "org",
      severity: 90,
      short: hShort,
      title: headSpan <= 1 || headSpan < briefSpan
        ? `头条大标只占 ${headSpan} 栏，没能压住次要快讯成为第一入口`
        : `主视觉或头条跨度偏小（${hShort}），视觉主次被次要模块反超`,
      why: "多栏版面里，跨栏宽度直接代表信息权重。现在大标或主视觉缩在窄轨里，读者进页先被零碎模块钩走，找不到真正的起点。",
      actionHint: `选中「头条大标」向右拉宽至 ${cols} 栏（或至少占一半以上），并让主视觉宽于快讯。`,
      fixLabel: `让大标跨 ${cols} 栏领衔`,
      fix: (s) => ({
        ...s,
        modules: [
          ...s.modules.filter((m) => m.id === "headline").map((m) => ({ ...m, colStart: 0, span: s.cols, rows: 1 })),
          ...s.modules.filter((m) => m.id !== "headline").map((m) => {
            if (m.id === "hero") return { ...m, colStart: 0, span: Math.max(2, Math.round(s.cols * 0.6)) };
            if (m.id === "brief") return { ...m, span: Math.max(1, Math.min(2, Math.floor(s.cols / 3))) };
            return m;
          }),
        ],
      }),
    });
  }

  if (avgCharsPerLine < 11) {
    issues.push({
      code: "toothpick_text",
      pillar: "density",
      severity: 88,
      short: `碎栏 ${avgCharsPerLine}字/行`,
      title: `正文栏每行仅装下约 ${avgCharsPerLine} 个汉字，碎成难读的牙签条`,
      why: "多栏切得过细时，一句完整的话被硬生生劈成四五段，眼睛刚起跑就撞墙折返。出版排印经验里，多栏中文正文建议守在约 12–28 字/行（拉丁文约 40–50 字符）。",
      actionHint: "选中「核心正文栏」向右横拖多跨 1–2 栏，或者把底座栏数收回到 3 / 4 / 6 栏。",
      fixLabel: "拉宽正文栏跨度",
      fix: (s) => {
        const targetSpan = Math.min(s.cols, Math.max(2, Math.round(s.cols * 0.45)));
        return {
          ...s,
          selectedId: "body",
          modules: s.modules.map((m) => (m.id === "body" ? { ...m, span: targetSpan, colStart: 0 } : m)),
        };
      },
    });
  }

  if (avgCharsPerLine > 36) {
    issues.push({
      code: "overwide_text",
      pillar: "density",
      severity: 80,
      short: `通栏 ${avgCharsPerLine}字/行`,
      title: `正文跨太满（约 ${avgCharsPerLine} 字/行），失去了多栏分流与易扫读优势`,
      why: "多栏版面里只有大标与宽图适合通栏，正文若也拉满整幅，既增加了眼睛长距回扫的串行风险，又让相邻功能模块被挤出同一视线带。",
      actionHint: "把「核心正文栏」收窄回页幅的 1/3 到 1/2 左右（约 14–28 字/行）。",
      fixLabel: "把正文收回到舒适跨度",
      fix: (s) => {
        const targetSpan = Math.max(1, Math.min(s.cols - 1, Math.round(s.cols * 0.5)));
        return {
          ...s,
          selectedId: "body",
          modules: s.modules.map((m) => (m.id === "body" ? { ...m, span: targetSpan } : m)),
        };
      },
    });
  }

  if (spanRatio < 1.5) {
    issues.push({
      code: "flat_uniform",
      pillar: "module",
      severity: 84,
      short: `等宽 ${spanRatio}× 无反差`,
      title: `所有模块跨度几乎一样（最大/最小仅 ${spanRatio} 倍），版面平得像旧黄页`,
      why: "只切多栏而不做跨栏拼接，是新手最常踩的坑。标题、主图、正文和短讯全按同样宽度排排坐，轻重缓急全部拉平，眼睛根本不知道先落哪一块。",
      actionHint: "在画布上横拖「头条大标」或「主视觉黄块」跨占多栏，让最大与最小模块跨度至少拉开 1.5 倍以上。",
      fixLabel: "拉开跨栏大小反差",
      fix: (s) => ({
        ...s,
        modules: s.modules.map((m) => {
          if (m.id === "headline") return { ...m, colStart: 0, span: s.cols };
          if (m.id === "hero") return { ...m, colStart: 0, span: Math.max(2, Math.round(s.cols * 0.62)) };
          if (m.id === "matrix") return { ...m, span: Math.max(1, Math.round(s.cols * 0.33)) };
          return m;
        }),
      }),
    });
  }

  if (!state.voidEnabled && densityPct >= 82) {
    issues.push({
      code: "overpacked_density",
      pillar: "density",
      severity: 82,
      short: `满塞 ${densityPct}%`,
      title: `版面占位高达 ${densityPct}% 且没有透气留白槽，信息挤到喘不过气`,
      why: "134 原海报特意点明「疏密对比：突出重点，提升节奏」。多栏容量越大，越要主动空出一格或半栏当留白缓冲；全页塞满只会让读者产生阅读疲倦。",
      actionHint: "点开「留白透气槽」撤掉满塞补白块，释放呼吸空间。",
      fixLabel: "打开透气留白槽",
      fix: (s) => ({ ...s, voidEnabled: true }),
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  const pillarError = (p) => issues.find((it) => it.pillar === p);
  const gridErr = pillarError("grid");
  const modErr = pillarError("module");
  const densErr = pillarError("density");
  const orgErr = pillarError("org");

  const pillars = {
    grid: {
      ok: !gridErr,
      badge: gridErr ? gridErr.short : `踩轨 ${cols}栏 ${gutter}px`,
    },
    module: {
      ok: !modErr,
      badge: modErr ? modErr.short : `跨度 ${layout.maxSpan}:${layout.minSpan} (${spanRatio}×)`,
    },
    density: {
      ok: !densErr,
      badge: densErr ? densErr.short : `占位 ${densityPct}% · ${avgCharsPerLine}字/行`,
    },
    org: {
      ok: !orgErr,
      badge: orgErr ? orgErr.short : `头${headSpan} › 图${heroSpan} › 讯${briefSpan}`,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;
  const primary = issues[0] || null;

  let rhythmGrade = "散乱拥挤（示意）";
  if (passCount === 4) rhythmGrade = "疏密有致 · 秩序成立（示意）";
  else if (passCount === 3) rhythmGrade = "接近平衡 · 尚余 1 处（示意）";
  else if (passCount === 2) rhythmGrade = "结构未稳 · 仍需理顺（示意）";

  const headlineVerdict = primary
    ? primary.title
    : `${cols} 栏秩序成立：跨度 ${layout.maxSpan}:${layout.minSpan}，正文约 ${avgCharsPerLine} 字/行，疏密透气`;

  const whyVerdict = primary
    ? primary.why
    : `所有模块左右边线严密踩在 ${cols} 栏白线骨架上，栏距 ${gutter}px 清晰分隔邻栏；头条与主视觉靠大跨度领衔，正文落在舒适字数带，边缘透气留白让高密度版面依然从容好读。`;

  const actionVerdict = primary
    ? primary.actionHint
    : "试试切换 3 / 4 / 6 / 12 栏底座，或故意拉窄栏距、关掉留白槽，验证哪一步会打破这份平衡。";

  const scanOrder = ["headline", "hero", "body", "matrix", "brief"]
    .map((id) => layout.placed.find((m) => m.id === id))
    .filter(Boolean);

  return {
    passCount,
    totalPillars: 4,
    allOk: passCount === 4,
    issues,
    primary,
    pillars,
    rhythmGrade,
    headlineVerdict,
    whyVerdict,
    actionVerdict,
    summaryChip: passCount === 4
      ? `4/4 · ${cols}栏成立`
      : `${passCount}/4 · ${primary ? primary.short : "待调"}`,
    scanOrder,
  };
}

// ============================================================
// Section 01：整除拆分矩阵单真源数据
// ============================================================
export const DIVISIBILITY_DATA = {
  2: {
    cols: 2,
    tag: "仅对称或主副两块",
    verdict: "能整除：1、2。适合左右对照，放不下三并列或复杂图文混排。",
    patterns: [
      { label: "1 + 1 等宽双栏", spans: [1, 1], note: "经典对照（参见 133 双栏版式）" },
      { label: "2 通栏", spans: [2], note: "整页标题或大图" },
    ],
  },
  3: {
    cols: 3,
    tag: "轻盈不对称的起点",
    verdict: "能整除：1、3。最轻便的多栏骨架，轻松排「2 栏主内容 + 1 栏侧栏」或三栏并列。",
    patterns: [
      { label: "3 通栏头条", spans: [3], note: "跨全页建立统摄感" },
      { label: "2 + 1 黄金主副", spans: [2, 1], note: "主图/主文占 2 栏，注记或留白占 1 栏" },
      { label: "1 + 1 + 1 三栏并列", spans: [1, 1, 1], note: "并列专题、观点或三张卡片" },
    ],
  },
  4: {
    cols: 4,
    tag: "原海报同款 · 规整有力",
    verdict: "能整除：1、2、4。134 原海报正是 4 栏架构，能切 2+2 双栏或 3+1 非对称，但无法均分三列。",
    patterns: [
      { label: "4 通栏大标", spans: [4], note: "像 134 原海报顶部「多栏版式」" },
      { label: "2 + 2 对称双栏", spans: [2, 2], note: "大块图文左右呼应" },
      { label: "3 + 1 主次不对称", spans: [3, 1], note: "宽主体配窄索引或透气留白" },
      { label: "1 + 1 + 1 + 1 四栏展列", spans: [1, 1, 1, 1], note: "栅格 / 模块 / 密度 / 信息组织四柱并举" },
    ],
  },
  5: {
    cols: 5,
    tag: "质数陷阱 · 难以均分",
    verdict: "能整除：1、5（质数）。无法切成等宽双栏，也无法切成等宽三栏，只能靠 3+2 或 2+2+1 硬凑，做跨页连贯排版时极易卡壳。",
    patterns: [
      { label: "3 + 2 偏心分栏", spans: [3, 2], note: "无法对称均分双栏" },
      { label: "2 + 2 + 1 留余一栏", spans: [2, 2, 1], note: "两块放完总多出一条零头栏" },
      { label: "1 × 5 五碎栏", spans: [1, 1, 1, 1, 1], note: "普通页幅下每栏易过窄" },
    ],
  },
  6: {
    cols: 6,
    tag: "出版界黄金万能底座",
    verdict: "同时被 2 和 3 整除！一张 6 栏页里，上半排 3+3 双栏、中段排 4+2 图文、下半排 2+2+2 三栏，所有边线严丝合缝全落在同一套骨架上。",
    patterns: [
      { label: "6 通栏大标", spans: [6], note: "大报头条或专题导语" },
      { label: "3 + 3 等宽双栏", spans: [3, 3], note: "整除 2：访谈对照或双主图" },
      { label: "2 + 2 + 2 等宽三栏", spans: [2, 2, 2], note: "整除 3：短评、卡片或三段正文" },
      { label: "4 + 2 非对称主副", spans: [4, 2], note: "大图配侧文，大小反差鲜明" },
      { label: "1 + 4 + 1 留白护边", spans: [1, 4, 1], note: "两侧各留 1 栏透气呼吸" },
    ],
  },
  8: {
    cols: 8,
    tag: "高密度展板 / 旧式大报",
    verdict: "能整除：1、2、4、8。灵活度高，但无法均分三列；若不跨栏而直接按单栏排正文，普通纸幅立刻碎成牙签条（1976 年《纽约时报》便从 8 栏改为 6 栏）。",
    patterns: [
      { label: "4 + 4 双栏", spans: [4, 4], note: "整除 2" },
      { label: "2 + 2 + 2 + 2 四栏", spans: [2, 2, 2, 2], note: "整除 4" },
      { label: "5 + 3 强反差主副", spans: [5, 3], note: "非对称专题" },
      { label: "3 + 3 + 2 近似三列", spans: [3, 3, 2], note: "无法三等分，末栏被迫缩窄" },
    ],
  },
  12: {
    cols: 12,
    tag: "终极公倍数 · 网页与年鉴标准",
    verdict: "同时被 2、3、4、6 整除（最小公倍数）！兼得双栏（6+6）、三栏（4+4+4）、四栏（3+3+3+3）与 5+7 / 8+4 非对称，但单栏极窄，正文绝不可只占 1 栏。",
    patterns: [
      { label: "6 + 6 双栏", spans: [6, 6], note: "整除 2" },
      { label: "4 + 4 + 4 三栏", spans: [4, 4, 4], note: "整除 3" },
      { label: "3 + 3 + 3 + 3 四栏", spans: [3, 3, 3, 3], note: "整除 4：商品图录阵列" },
      { label: "7 + 5 / 8 + 4 黄金图文", spans: [7, 5], note: "精细微调主副比重" },
      { label: "2 + 6 + 4 留白主文侧栏", spans: [2, 6, 4], note: "左留 2 栏大呼吸区" },
    ],
  },
};

// ============================================================
// Section 03：报刊栏宽与齐行豁口实验室 单真源计算（与画布 100% 同宽同边距）
// ============================================================
export function computeMeasureLab(cfg) {
  const pageW = 960;
  const padX = 28;
  const usableW = pageW - padX * 2; // 904px 版心（画布与读数绝对同源！）
  const cols = cfg.cols;
  const fontSize = cfg.fontSize;
  const gutter = cfg.gutter;
  const align = cfg.align;
  const leading = Math.round(fontSize * 1.56);

  const colWExact = (usableW - gutter * (cols - 1)) / cols;
  const colW = Math.round(colWExact);
  const cjkPerLine = Math.max(3, Math.floor((colWExact - 14) / fontSize));
  const latinPerLine = Math.round(cjkPerLine * 2.05);
  const gutterRatio = +(gutter / leading).toFixed(2);

  let measureState = "ok";
  let measureText = "多栏舒适带（经验约 12–26 汉字 / 40–50 西文字符）";
  if (cjkPerLine < 11) {
    measureState = "narrow";
    measureText = `每行仅约 ${cjkPerLine} 字——严重碎栏！折行频繁，且两端对齐会产生刺眼「白河」豁口。`;
  } else if (cjkPerLine > 28) {
    measureState = "wide";
    measureText = `每行达 ${cjkPerLine} 字——偏宽近单栏，多栏分流与同屏信息并置效率变弱。`;
  }

  const riverRisk = align === "justify" && cjkPerLine < 15
    ? "高风险：窄栏强行两端对齐会拉出大片词距空洞（俗称「白河」），瑞士排版师埃米尔·鲁德建议改用齐左不齐右。"
    : align === "justify"
      ? "中低风险：栏宽尚可，仍需留意英文单词与标点挤压。"
      : "极低：齐左不齐右（Flush-left, ragged-right）保持字距均匀，阅读节奏最稳。";

  let gutterState = "ok";
  let gutterText = `栏距 ${gutter}px（行距的 ${gutterRatio} 倍），两栏分界干脆不串读。`;
  if (gutter < Math.max(10, leading * 0.52)) {
    gutterState = "tight";
    gutterText = `栏距 ${gutter}px（仅行距 ${gutterRatio} 倍），眼睛读到行尾极易横向跨栏串读。`;
  } else if (gutter > 32 || gutter > colWExact * 0.45) {
    gutterState = "wide";
    gutterText = `栏距 ${gutter}px 过宽，相邻各栏失去版面整体感。`;
  }

  return {
    pageW,
    padX,
    usableW,
    cols,
    fontSize,
    leading,
    gutter,
    align,
    colW,
    colWExact,
    cjkPerLine,
    latinPerLine,
    gutterRatio,
    measureState,
    measureText,
    riverRisk,
    gutterState,
    gutterText,
  };
}
