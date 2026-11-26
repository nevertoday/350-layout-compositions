// 172 网格系统 — 单真源几何与网格秩序核算模型
// 所有画布绘制、像素偏移测量、重叠检测、读数胶囊与白话诊单均从此文件计算，零硬编码常量。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·瑞士构成",
    heroTitle: "主视觉块",
    heroSub: "HERO FIELD · 2 COL",
    headline: ["清晰的秩序", "高效的沟通"],
    bodyLines: [
      "网格以看不见的纵横坐标为骨架",
      "让标题、正文与图形共用同一锚线",
      "读者扫视时不必逐块重新找起点",
      "版面因而清晰、统一且富有节奏",
    ],
    circleTag: "焦圈",
    dotsTag: "6×4 节点",
    redSqTag: "红锚",
    r2LeftTitle: "模块 A",
    r2LeftLines: ["按列轨定宽", "跨页可复用", "齐顶不参差"],
    r2RightTitle: "模块 C",
    r2RightLines: ["留第四列空白", "形成呼吸节奏", "主次一目了然"],
  },
  museum: {
    id: "museum",
    label: "美术馆展讯",
    heroTitle: "苏黎世展",
    heroSub: "KUNSTHALLE · 1958–1981",
    headline: ["瑞士网格展", "理性与秩序"],
    bodyLines: [
      "展期 05.12 — 08.30 · 主馆二层东厅",
      "汇集米勒-布罗克曼与新平面设计文献",
      "以六列基础栏轨统一海报、导览与图录",
      "每日十时开馆 · 周一闭馆维护",
    ],
    circleTag: "票务",
    dotsTag: "展期表",
    redSqTag: "B2厅",
    r2LeftTitle: "策展导语",
    r2LeftLines: ["网格建立骨架", "图形与文字共生", "客观传达展讯"],
    r2RightTitle: "交通导览",
    r2RightLines: ["电车四号线直达", "凭票领取折页", "提供双语语音"],
  },
  magazine: {
    id: "magazine",
    label: "期刊跨页",
    heroTitle: "建筑摄影",
    heroSub: "ISSUE 14 · ARCHIVE",
    headline: ["看不见的线", "决定阅读感"],
    bodyLines: [
      "多页期刊最怕每翻一页就换一套起点",
      "确定列数、栏距与中腰水平挂线之后",
      "长文、插图与图注就能在统一骨架里",
      "自由伸缩跨列，既省工又耐细读",
    ],
    circleTag: "引语",
    dotsTag: "数据阵",
    redSqTag: "注脚",
    r2LeftTitle: "专栏索引",
    r2LeftLines: ["01 栏距临界值", "02 整除与非对称", "03 何时有度破格"],
    r2RightTitle: "编后记",
    r2RightLines: ["留出空列缓冲", "避免表格感僵化", "秩序服务于内容"],
  },
};

export const COL_OPTIONS = [4, 6, 8, 12];

// 生成开场故意失序的状态（非答案态：吸附关、栏距 4px 粘连、2 处清晰撞块、多块脱轨与挂线参差）
export function createBrokenState(specimen = "poster") {
  return {
    specimen,
    cols: 6,
    gutter: 4,         // 严重过窄（粘连）
    hangline: 0.41,    // 中腰挂线相对位置 (0.28..0.54)
    snap: false,       // 开场关吸附，体验手摆误差
    xray: true,        // 显示蓝虚线与淡蓝列带
    selectedId: "heroBlue",
    blocks: [
      { id: "heroBlue",  name: "主视觉蓝块", kind: "heroBlue",  u: 0.045, v: 0.015, colSpan: 2, rowSlot: "fullTop", locked: false },
      { id: "headline",  name: "主标题块",   kind: "headline",  u: 0.312, v: 0.078, colSpan: 2, rowSlot: "upper",   locked: false },
      { id: "bodyCopy",  name: "正文行块",   kind: "bodyCopy",  u: 0.388, v: 0.470, colSpan: 2, rowSlot: "lower",   locked: false },
      { id: "redCircle", name: "朱红焦圈",   kind: "redCircle", u: 0.772, v: 0.118, colSpan: 1, rowSlot: "upper",   locked: false },
      { id: "dotMatrix", name: "钴蓝点阵",   kind: "dotMatrix", u: 0.678, v: 0.388, colSpan: 2, rowSlot: "lower",   locked: false },
      { id: "row2Left",  name: "下左模块",   kind: "row2Card",  u: 0.000, v: 0.720, colSpan: 2, rowSlot: "row2",    locked: false },
      { id: "redSquare", name: "底部朱红块", kind: "redSquare", u: 0.362, v: 0.768, colSpan: 1, rowSlot: "row2",    locked: false },
      { id: "row2Right", name: "下右模块",   kind: "row2Card",  u: 0.684, v: 0.720, colSpan: 2, rowSlot: "row2",    locked: false },
    ],
  };
}

// 计算某一列起点和宽度的归一化坐标（与 computeGeometry 共享同一缩放公式，绝对单真源）
export function colMetricsNorm(cols, gutterPx, innerW) {
  const safeW = Math.max(220, innerW || 960);
  const scaleFactor = clamp(safeW / 960, 0.38, 1.25);
  const drawGutter = Math.round(gutterPx * scaleFactor * 10) / 10;
  const gNorm = clamp(drawGutter / safeW, 0, 0.14);
  const colW = (1 - gNorm * (cols - 1)) / cols;
  const starts = [];
  for (let i = 0; i < cols; i++) starts.push(i * (colW + gNorm));
  return { gNorm, colW, starts };
}

// 按列索引精确放置一个块
function placeAt(id, name, kind, colIdx, colSpan, rowSlot, cols, gutter, hangline, innerW = 960) {
  const { starts } = colMetricsNorm(cols, gutter, innerW);
  const c = Math.max(0, Math.min(cols - colSpan, colIdx));
  const yMap = {
    fullTop: 0.05,
    upper: 0.05,
    lower: hangline + 0.025,
    row2: 0.72,
  };
  return { id, name, kind, u: starts[c], v: yMap[rowSlot], colSpan, rowSlot, locked: false };
}

// 多组合法解与主动试错预设
export function applyPreset(state, presetKey, innerW = 960) {
  const sp = state.specimen;
  if (presetKey === "broken") {
    return createBrokenState(sp);
  }
  if (presetKey === "classic6") {
    const cols = 6, gutter = 20, hangline = 0.41;
    return {
      specimen: sp, cols, gutter, hangline, snap: true, xray: true, selectedId: "heroBlue",
      blocks: [
        placeAt("heroBlue",  "主视觉蓝块", "heroBlue",  0, 2, "fullTop", cols, gutter, hangline, innerW),
        placeAt("headline",  "主标题块",   "headline",  2, 2, "upper",   cols, gutter, hangline, innerW),
        placeAt("bodyCopy",  "正文行块",   "bodyCopy",  2, 2, "lower",   cols, gutter, hangline, innerW),
        placeAt("redCircle", "朱红焦圈",   "redCircle", 5, 1, "upper",   cols, gutter, hangline, innerW),
        placeAt("dotMatrix", "钴蓝点阵",   "dotMatrix", 4, 2, "lower",   cols, gutter, hangline, innerW),
        placeAt("row2Left",  "下左模块",   "row2Card",  0, 2, "row2",    cols, gutter, hangline, innerW),
        placeAt("redSquare", "底部朱红块", "redSquare", 2, 1, "row2",    cols, gutter, hangline, innerW),
        placeAt("row2Right", "下右模块",   "row2Card",  4, 2, "row2",    cols, gutter, hangline, innerW),
      ],
    };
  }
  if (presetKey === "mirror6") {
    // 另一组合法解：右重反转非对称（左排文字+红圈、右压 2 列钴蓝主图）
    const cols = 6, gutter = 22, hangline = 0.40;
    return {
      specimen: sp, cols, gutter, hangline, snap: true, xray: true, selectedId: "headline",
      blocks: [
        placeAt("headline",  "主标题块",   "headline",  0, 2, "upper",   cols, gutter, hangline, innerW),
        placeAt("bodyCopy",  "正文行块",   "bodyCopy",  0, 2, "lower",   cols, gutter, hangline, innerW),
        placeAt("redCircle", "朱红焦圈",   "redCircle", 2, 1, "upper",   cols, gutter, hangline, innerW),
        placeAt("dotMatrix", "钴蓝点阵",   "dotMatrix", 2, 1, "lower",   cols, gutter, hangline, innerW),
        placeAt("heroBlue",  "主视觉蓝块", "heroBlue",  4, 2, "fullTop", cols, gutter, hangline, innerW),
        placeAt("row2Left",  "下左模块",   "row2Card",  0, 2, "row2",    cols, gutter, hangline, innerW),
        placeAt("redSquare", "底部朱红块", "redSquare", 3, 1, "row2",    cols, gutter, hangline, innerW),
        placeAt("row2Right", "下右模块",   "row2Card",  4, 2, "row2",    cols, gutter, hangline, innerW),
      ],
    };
  }
  if (presetKey === "swiss8") {
    // 第三组合法解：8 列精密报刊网格（3 列视觉 + 3 列文字 + 2 列焦圈/点阵）
    const cols = 8, gutter = 16, hangline = 0.42;
    return {
      specimen: sp, cols, gutter, hangline, snap: true, xray: true, selectedId: "heroBlue",
      blocks: [
        placeAt("heroBlue",  "主视觉蓝块", "heroBlue",  0, 3, "fullTop", cols, gutter, hangline, innerW),
        placeAt("headline",  "主标题块",   "headline",  3, 3, "upper",   cols, gutter, hangline, innerW),
        placeAt("bodyCopy",  "正文行块",   "bodyCopy",  3, 3, "lower",   cols, gutter, hangline, innerW),
        placeAt("redCircle", "朱红焦圈",   "redCircle", 6, 2, "upper",   cols, gutter, hangline, innerW),
        placeAt("dotMatrix", "钴蓝点阵",   "dotMatrix", 6, 2, "lower",   cols, gutter, hangline, innerW),
        placeAt("row2Left",  "下左模块",   "row2Card",  0, 3, "row2",    cols, gutter, hangline, innerW),
        placeAt("redSquare", "底部朱红块", "redSquare", 4, 1, "row2",    cols, gutter, hangline, innerW),
        placeAt("row2Right", "下右模块",   "row2Card",  6, 2, "row2",    cols, gutter, hangline, innerW),
      ],
    };
  }
  if (presetKey === "errDrift") {
    // 试错：全员脱轨漂移（栏距虽好，但所有块各自微偏，秩序瞬间瓦解）
    const base = applyPreset(state, "classic6", innerW);
    base.snap = false;
    const shifts = [
      [0.026, -0.028],
      [-0.022, 0.035],
      [0.032, 0.038],
      [-0.044, -0.024],
      [0.024, -0.032],
      [0.018, 0.022],
      [-0.030, 0.036],
      [-0.026, -0.022],
    ];
    base.blocks = base.blocks.map((b, i) => ({
      ...b,
      u: clamp(b.u + shifts[i][0], 0, 0.88),
      v: clamp(b.v + shifts[i][1], 0.01, 0.82),
    }));
    return base;
  }
  if (presetKey === "errTight") {
    // 试错：0px 零缝粘连（齐线却无呼吸缝，文字与色块黏在一起）
    const base = applyPreset(state, "classic6", innerW);
    base.gutter = 2;
    const { starts } = colMetricsNorm(base.cols, base.gutter, innerW);
    const colIndices = [0, 2, 2, 5, 4, 0, 2, 4];
    base.blocks = base.blocks.map((b, i) => ({ ...b, u: starts[colIndices[i]] }));
    return base;
  }
  if (presetKey === "errCanyon") {
    // 试错：裂谷宽缝 52px（反向错态：缝比列还刺眼，版面碎成孤岛）
    const base = applyPreset(state, "classic6", innerW);
    base.gutter = 52;
    const { starts } = colMetricsNorm(base.cols, base.gutter, innerW);
    const colIndices = [0, 2, 2, 5, 4, 0, 2, 4];
    base.blocks = base.blocks.map((b, i) => ({ ...b, u: starts[colIndices[i]] }));
    return base;
  }
  if (presetKey === "errFlat") {
    // 试错：僵硬均分表格（反向错态：全员强行压缩成等宽等高 1 列小方块，丧失大小节奏）
    const cols = 6, gutter = 18, hangline = 0.36;
    const flatBlocks = [
      placeAt("heroBlue",  "主视觉蓝块", "heroBlue",  0, 1, "upper", cols, gutter, hangline, innerW),
      placeAt("headline",  "主标题块",   "headline",  1, 1, "upper", cols, gutter, hangline, innerW),
      placeAt("bodyCopy",  "正文行块",   "bodyCopy",  2, 1, "upper", cols, gutter, hangline, innerW),
      placeAt("redCircle", "朱红焦圈",   "redCircle", 3, 1, "upper", cols, gutter, hangline, innerW),
      placeAt("dotMatrix", "钴蓝点阵",   "dotMatrix", 4, 1, "upper", cols, gutter, hangline, innerW),
      placeAt("row2Left",  "下左模块",   "row2Card",  0, 1, "lower", cols, gutter, hangline, innerW),
      placeAt("redSquare", "底部朱红块", "redSquare", 1, 1, "lower", cols, gutter, hangline, innerW),
      placeAt("row2Right", "下右模块",   "row2Card",  2, 1, "lower", cols, gutter, hangline, innerW),
    ];
    return { specimen: sp, cols, gutter, hangline, snap: true, xray: true, selectedId: "heroBlue", blocks: flatBlocks };
  }
  return state;
}

export function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

// 单真源几何构建：根据画布实际逻辑宽高 (W, H) 计算所有列轨、水平挂线和实绘块包围盒
export function computeGeometry(state, W, H) {
  const padX = Math.round(clamp(W * 0.048, 18, 48));
  const padTop = Math.round(clamp(H * 0.085, 24, 38));
  const padBot = Math.round(clamp(H * 0.082, 22, 34));
  const innerX = padX;
  const innerY = padTop;
  const innerW = Math.max(220, W - padX * 2);
  const innerH = Math.max(160, H - padTop - padBot);

  // 窄屏按参考宽度 960px 缩放视觉栏距，同时保留真实逻辑 px 供读数展示
  const scaleFactor = clamp(innerW / 960, 0.38, 1.25);
  const drawGutter = Math.round(state.gutter * scaleFactor * 10) / 10;
  const totalGutter = drawGutter * (state.cols - 1);
  const colW = (innerW - totalGutter) / state.cols;

  const cols = [];
  for (let i = 0; i < state.cols; i++) {
    const x0 = innerX + i * (colW + drawGutter);
    cols.push({
      index: i,
      x0,
      x1: x0 + colW,
      w: colW,
      u0: (x0 - innerX) / innerW,
      u1: (x0 + colW - innerX) / innerW,
    });
  }

  const row2V = 0.72;
  const hangV = clamp(state.hangline, 0.28, 0.54);
  const flowlines = {
    top:  { key: "top",  label: "顶沿线",   v: 0.05,  y: innerY + innerH * 0.05 },
    mid:  { key: "mid",  label: "中腰挂线", v: hangV, y: innerY + innerH * hangV },
    row2: { key: "row2", label: "二行挂线", v: row2V, y: innerY + innerH * row2V },
    bot:  { key: "bot",  label: "底沿线",   v: 0.96,  y: innerY + innerH * 0.96 },
  };
  const flowArray = [flowlines.top, flowlines.mid, flowlines.row2];

  // 计算每块真实像素矩形
  const rowGapV = 0.045;
  const subGapV = 0.028;
  const blocks = state.blocks.map((b) => {
    const span = clamp(b.colSpan, 1, state.cols);
    const w = span * colW + (span - 1) * drawGutter;
    let hV = 0.22;
    if (b.rowSlot === "fullTop") hV = Math.max(0.28, row2V - 0.05 - rowGapV);
    else if (b.rowSlot === "upper") hV = Math.max(0.18, hangV - 0.05 - subGapV);
    else if (b.rowSlot === "lower") hV = Math.max(0.16, row2V - (hangV + 0.025) - rowGapV);
    else if (b.rowSlot === "row2") hV = Math.max(0.18, 0.96 - row2V);

    const h = hV * innerH;
    const x = innerX + b.u * innerW;
    const y = innerY + b.v * innerH;

    // 找最近列轨左缘与最近水平挂线
    let nearestCol = cols[0];
    let minColDx = Infinity;
    for (const c of cols) {
      const dx = Math.abs(x - c.x0);
      if (dx < minColDx) {
        minColDx = dx;
        nearestCol = c;
      }
    }
    // 换算成 960px 标准版面参考像素，保证不同屏宽下的判据一致
    const colDriftRefPx = Math.round(minColDx / scaleFactor);

    // 找最近水平挂线（upper/fullTop 对应 top，lower 对应 mid + 0.025，row2 对应 row2；也允许用户拖到任一有效挂线）
    const validAnchorsY = [
      { key: "top",  y: flowlines.top.y,  v: flowlines.top.v },
      { key: "mid",  y: flowlines.mid.y + innerH * 0.025, v: flowlines.mid.v + 0.025 },
      { key: "row2", y: flowlines.row2.y, v: flowlines.row2.v },
    ];
    let nearestHang = validAnchorsY[0];
    let minHangDy = Infinity;
    for (const a of validAnchorsY) {
      const dy = Math.abs(y - a.y);
      if (dy < minHangDy) {
        minHangDy = dy;
        nearestHang = a;
      }
    }
    const hangDriftRefPx = Math.round(minHangDy / scaleFactor);

    // 出界检测
    const outOfBounds = x < innerX - 2 || x + w > innerX + innerW + 2 || y < innerY - 2 || y + h > innerY + innerH + 2;

    return {
      ...b,
      span,
      x,
      y,
      w,
      h,
      cx: x + w / 2,
      cy: y + h / 2,
      area: w * h,
      nearestCol,
      colDriftPx: minColDx,
      colDriftRefPx,
      nearestHang,
      hangDriftPx: minHangDy,
      hangDriftRefPx,
      outOfBounds,
    };
  });

  return {
    W,
    H,
    innerX,
    innerY,
    innerW,
    innerH,
    scaleFactor,
    drawGutter,
    colW,
    cols,
    flowlines,
    flowArray,
    blocks,
  };
}

// 把指定块吸附到最近的列轨和水平挂线（供一键纠偏或用户按格对齐使用）
export function snapBlockToGrid(block, geom) {
  const maxColIdx = Math.max(0, geom.cols.length - block.span);
  let bestCol = geom.cols[0];
  let bestD = Infinity;
  for (let i = 0; i <= maxColIdx; i++) {
    const d = Math.abs(block.x - geom.cols[i].x0);
    if (d < bestD) {
      bestD = d;
      bestCol = geom.cols[i];
    }
  }
  const targetV = block.nearestHang ? block.nearestHang.v : block.v;
  return {
    u: bestCol.u0,
    v: targetV,
  };
}

// 双向全量单真源诊单核算
export function auditLayout(state, geom) {
  const tolRefPx = 5; // 5px 容差（960px 标准版面下）
  const blocks = geom.blocks;

  // 1. 精确 AABB 重叠检测
  const overlaps = [];
  let totalOverlapArea = 0;
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (ix > 2 && iy > 2) {
        const area = ix * iy;
        totalOverlapArea += area;
        overlaps.push({
          a,
          b,
          area,
          rect: {
            x: Math.max(a.x, b.x),
            y: Math.max(a.y, b.y),
            w: ix,
            h: iy,
          },
        });
      }
    }
  }

  // 2. 列轨脱线统计
  const offColBlocks = blocks.filter((b) => b.colDriftRefPx > tolRefPx || b.outOfBounds);
  const maxColBlock = blocks.reduce((m, b) => (b.colDriftRefPx > m.colDriftRefPx ? b : m), blocks[0]);
  const maxColDriftPx = maxColBlock ? maxColBlock.colDriftRefPx : 0;

  // 3. 水平挂线错位统计
  const offHangBlocks = blocks.filter((b) => b.hangDriftRefPx > tolRefPx);
  const maxHangBlock = blocks.reduce((m, b) => (b.hangDriftRefPx > m.hangDriftRefPx ? b : m), blocks[0]);
  const maxHangDriftPx = maxHangBlock ? maxHangBlock.hangDriftRefPx : 0;

  // 4. 栏距双向判定（标准正文行高按 18px 参照，经验值栏距宜为 0.7×–2.0× 行高）
  const refLineH = 18;
  const gutterRatio = state.gutter / refLineH;
  const gutterTooTight = state.gutter < 10;
  const gutterTooWide = state.gutter > 38;

  // 5. 大小反差与留白占比（防止网格沦为呆板均分表或塞满零呼吸）
  const areas = blocks.map((b) => b.area);
  const maxArea = Math.max(...areas);
  const minArea = Math.max(1, Math.min(...areas));
  const hierarchyRatio = maxArea / minArea;
  const flatGrid = hierarchyRatio < 1.45;

  const frameArea = geom.innerW * geom.innerH;
  const sumArea = areas.reduce((s, a) => s + a, 0);
  const fillRatio = clamp((sumArea - totalOverlapArea) / frameArea, 0, 1);
  const fillPct = Math.round(fillRatio * 100);
  const overpacked = fillRatio > 0.79;
  const tooSparse = fillRatio < 0.24;

  // 四项支柱评定（存在模块重叠时空间节奏同样未成立）
  const pCols = offColBlocks.length === 0 && overlaps.length === 0;
  const pHang = offHangBlocks.length === 0;
  const pGutter = !gutterTooTight && !gutterTooWide;
  const pRhythm = !flatGrid && !overpacked && !tooSparse && overlaps.length === 0;
  const score = [pCols, pHang, pGutter, pRhythm].filter(Boolean).length;

  // 构造优先级最高的单真源白话诊单
  let issue;
  if (overlaps.length > 0) {
    const pair = overlaps[0];
    issue = {
      code: "overlap",
      severity: "err",
      shortTag: `撞块 ${overlaps.length}处`,
      headline: `「${pair.a.name}」与「${pair.b.name}」发生叠压撞块`,
      why: `网格系统的底线是给每个信息块划定互不侵占的坐标领地。当前共有 ${overlaps.length} 处模块直接压盖，读者第一眼就被边界冲突打断，标题和图形在互相抢话。`,
      how: `开启「网格吸附」并把红框标出的「${pair.a.name}」拖回第 1 列，或点下方按钮一键贴合列轨。`,
      fixLabel: "一键贴合列轨并解开撞块",
      fixAction: "fixAlign",
    };
  } else if (offColBlocks.length > 0) {
    issue = {
      code: "offCol",
      severity: "err",
      shortTag: `脱轨 ${maxColDriftPx}px`,
      headline: `${offColBlocks.length} 处模块脱离列轨，最大错牙 ${maxColDriftPx}px`,
      why: `「${maxColBlock.name}」左缘偏离最近列轨 ${maxColDriftPx}px。人眼扫读时本能寻找垂直对齐轴，只要相差几个像素，大脑就会持续察觉「摆歪了」，整体统一感立刻瓦解。`,
      how: `打开「网格吸附」，拖移「${maxColBlock.name}」直到蓝色贯通虚线亮起，或点击按钮对齐全部列轨。`,
      fixLabel: "一键对齐全部列轨与挂线",
      fixAction: "fixAlign",
    };
  } else if (offHangBlocks.length > 0) {
    issue = {
      code: "offHang",
      severity: "err",
      shortTag: `错挂 ${maxHangDriftPx}px`,
      headline: `${offHangBlocks.length} 处模块脱离水平挂线，上下错落 ${maxHangDriftPx}px`,
      why: `「${maxHangBlock.name}」没有挂在同一条蓝色水平虚线上。纵列对齐只管住左右，水平挂线才管住视线横向穿行时的稳重节奏；少了它，整排模块像没对齐的积木。`,
      how: `上下拖移「${maxHangBlock.name}」贴紧蓝色中腰或二行水平挂线，或一键归位。`,
      fixLabel: "把脱线模块挂回水平虚线",
      fixAction: "fixHang",
    };
  } else if (gutterTooTight) {
    issue = {
      code: "gutterTight",
      severity: "err",
      shortTag: `粘连 ${state.gutter}px`,
      headline: `栏距只有 ${state.gutter}px，相邻图文列彼此粘连串行`,
      why: `按排版经验值，栏距至少应接近正文行高（约 14–24px，当前仅 ${gutterRatio.toFixed(2)}× 行高）。缝隙太窄会让左右两列视觉粘连，眼睛扫完左栏行尾极易直接跨缝跳进右栏。`,
      how: `向右拉动「栏距」滑杆到 16–26px，让每一列重新获得呼吸通道。`,
      fixLabel: "拉开安全栏距至 20px",
      fixAction: "fixGutter",
    };
  } else if (gutterTooWide) {
    issue = {
      code: "gutterWide",
      severity: "err",
      shortTag: `裂谷 ${state.gutter}px`,
      headline: `栏距宽达 ${state.gutter}px，版面被劈成互不相连的孤岛`,
      why: `栏距并非越宽越好。当前栏距已达正文行高的 ${gutterRatio.toFixed(1)}×，白色裂谷比单列内容本身更显眼，信息块之间失去整体归属感，画面变得松垮散架。`,
      how: `把「栏距」往回收至 16–28px，重新缝合各列之间的群组关系。`,
      fixLabel: "收拢裂谷栏距至 20px",
      fixAction: "fixGutter",
    };
  } else if (flatGrid) {
    issue = {
      code: "flatGrid",
      severity: "err",
      shortTag: `均分 ${hierarchyRatio.toFixed(1)}×`,
      headline: `主次面积比仅 ${hierarchyRatio.toFixed(1)}×，网格沦为呆板的等分表格`,
      why: `所有模块都缩成几乎一样大小的格子时，虽然齐整，但读者完全分不出先看哪块、后看哪块——这就是人们批评「网格太死板」的真正原因：错不在网格，而在没有跨列制造大小反差。`,
      how: `选中「主视觉蓝块」点击「+1 列」扩大跨度，或切回原海报经典 2+2+1 非对称跨列。`,
      fixLabel: "拉开主次跨列反差",
      fixAction: "fixHierarchy",
    };
  } else if (overpacked || tooSparse) {
    issue = {
      code: overpacked ? "overpacked" : "tooSparse",
      severity: "err",
      shortTag: overpacked ? `过满 ${fillPct}%` : `过散 ${fillPct}%`,
      headline: overpacked
        ? `实绘占面高达 ${fillPct}%，留白被彻底挤光`
        : `实绘占面仅 ${fillPct}%，版面过于空散缺重心`,
      why: overpacked
        ? `把每一列每一格全部填满，版面就没有停顿和呼吸；像原海报在二行特意空出第 4 列，空着的那一格正是节奏的休止符。`
        : `内容面积过小且分散，网格骨架虽在，但视觉锚点撑不起整页分量。`,
      how: overpacked ? `减小部分辅块的跨列数，留出至少 1–2 个空白呼吸模块。` : `增加主视觉块或标题块的跨列跨度，稳住视觉重心。`,
      fixLabel: "恢复均衡疏密布局",
      fixAction: "fixClassic",
    };
  } else {
    issue = {
      code: "ok",
      severity: "ok",
      shortTag: "秩序成立",
      headline: `${state.cols} 列坐标、水平挂线与 ${state.gutter}px 栏距全部咬合`,
      why: `全部 8 处模块严丝合缝锁在 ${state.cols} 列轨与 3 条水平挂线上，无撞块、主次面积反差达 ${hierarchyRatio.toFixed(1)}×、占面 ${fillPct}% 留出清晰呼吸空白。现在试试关掉「透视网格」——线消失了，但秩序依然稳稳立住！`,
      how: `你也可以点右侧「右重反转解」「8 栏精密解」，或任意拖移块、改跨列数，验证同一网格能长出无数合法变体。`,
      fixLabel: state.xray ? "关闭透视网格，检验隐形骨架" : "重新显示网格蓝图",
      fixAction: "toggleXray",
    };
  }

  // 右侧竖排原海报三枚关键词探针状态
  const spine = {
    alignment: {
      ok: pCols && pHang,
      badge: overlaps.length > 0
        ? `撞块 ${overlaps.length}处`
        : offColBlocks.length > 0
          ? `偏轨 ${maxColDriftPx}px`
          : offHangBlocks.length > 0
            ? `错挂 ${maxHangDriftPx}px`
            : "齐线 0px",
    },
    order: {
      ok: pCols && pHang && pGutter,
      badge: overlaps.length > 0
        ? "领地冲突"
        : gutterTooTight
          ? `粘连 ${state.gutter}px`
          : gutterTooWide
            ? `裂谷 ${state.gutter}px`
            : !pCols || !pHang
              ? "骨架松脱"
              : `${state.cols}列稳固`,
    },
    rhythm: {
      ok: pRhythm && pGutter,
      badge: flatGrid
        ? `平权 ${hierarchyRatio.toFixed(1)}×`
        : gutterTooTight || gutterTooWide
          ? `缝失衡`
          : overpacked
            ? `过满 ${fillPct}%`
            : `反差 ${hierarchyRatio.toFixed(1)}×`,
    },
  };

  // 定性态势（标明示意，杜绝假精确）
  const posture = score === 4
    ? "清晰有序（示意）"
    : score >= 2
      ? "局部松脱（示意）"
      : "多维失序（示意）";

  // 统计所有共享垂直对齐轴数（供科普对比）
  const uniqueX = [];
  for (const b of blocks) {
    if (!uniqueX.some((ux) => Math.abs(ux - b.x) < 5 * geom.scaleFactor)) uniqueX.push(b.x);
  }

  return {
    score,
    maxScore: 4,
    pCols,
    pHang,
    pGutter,
    pRhythm,
    overlaps,
    offColBlocks,
    offHangBlocks,
    maxColDriftPx,
    maxHangDriftPx,
    gutterPx: state.gutter,
    gutterRatio,
    hierarchyRatio,
    fillPct,
    uniqueAxes: uniqueX.length,
    posture,
    issue,
    spine,
  };
}
