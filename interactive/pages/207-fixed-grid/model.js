// 207 固定网格 · 单真源几何与规则引擎
// 画布绘制、标尺、诊单、核心优势四栏、读数全部从本模块同一套坐标实时算出，零写死假读数。

export const ROW_COUNT = 3;
export const BASELINE_STEP = 8; // px 基准基线格步距
export const BODY_FONT_PX = 16; // 参考正文 16px
export const ROW_H = 128;       // 16 * 8px = 128px（严格 8px 基线步距整数倍）
export const ROW_GAP = 24;      // 3 * 8px = 24px
export const PAD_TOP = 24;
export const PAD_BOTTOM = 24;
export const BOARD_H = PAD_TOP + ROW_COUNT * ROW_H + (ROW_COUNT - 1) * ROW_GAP + PAD_BOTTOM; // 480px

export const BLOCK_DEFS = [
  { id: "heroSq",    kind: "square-lg", title: "主图块",   mag: "专题封面图", web: "主视觉横幅",  defaultSpan: 2 },
  { id: "crossMark", kind: "cross",     title: "标识 ×",   mag: "刊号标记",   web: "核心指标卡",  defaultSpan: 1 },
  { id: "circle",    kind: "circle",    title: "朱红焦点", mag: "导读焦圆",   web: "行动焦点圆",  defaultSpan: 1 },
  { id: "sideSq",    kind: "square-sm", title: "副图块",   mag: "作者配图",   web: "次级功能卡",  defaultSpan: 1 },
  { id: "tri",       kind: "triangle",  title: "几何角标", mag: "章首装饰",   web: "导引角标",    defaultSpan: 1 },
  { id: "textBlock", kind: "text",      title: "正文段落", mag: "内文排栏",   web: "说明正文块",  defaultSpan: 2 },
];

// 三页跨页复验模板（按列比例映射到任意列数，证明「内容换页、固定尺不动」）
const PAGE_LAYOUTS = {
  1: [
    { id: "heroSq",    colFrac: 0.167, spanCols: 2, row: 0 },
    { id: "crossMark", colFrac: 0.667, spanCols: 1, row: 0 },
    { id: "circle",    colFrac: 0.333, spanCols: 1, row: 1 },
    { id: "sideSq",    colFrac: 0.833, spanCols: 1, row: 1 },
    { id: "tri",       colFrac: 0.167, spanCols: 1, row: 2 },
    { id: "textBlock", colFrac: 0.667, spanCols: 2, row: 2 },
  ],
  2: [
    { id: "heroSq",    colFrac: 0.0,   spanCols: 2, row: 0 },
    { id: "textBlock", colFrac: 0.5,   spanCols: 2, row: 0 },
    { id: "circle",    colFrac: 0.333, spanCols: 1, row: 1 },
    { id: "crossMark", colFrac: 0.833, spanCols: 1, row: 1 },
    { id: "sideSq",    colFrac: 0.167, spanCols: 1, row: 2 },
    { id: "tri",       colFrac: 0.667, spanCols: 1, row: 2 },
  ],
  3: [
    { id: "crossMark", colFrac: 0.0,   spanCols: 1, row: 0 },
    { id: "heroSq",    colFrac: 0.333, spanCols: 2, row: 0 },
    { id: "sideSq",    colFrac: 0.833, spanCols: 1, row: 0 },
    { id: "circle",    colFrac: 0.5,   spanCols: 1, row: 1 },
    { id: "tri",       colFrac: 0.0,   spanCols: 1, row: 1 },
    { id: "textBlock", colFrac: 0.167, spanCols: 2, row: 2 },
  ],
};

export function rowY(r) {
  return PAD_TOP + r * (ROW_H + ROW_GAP);
}

export function computeGrid(s) {
  const cols = s.cols;
  const W = s.totalWidth;
  const mL = s.marginLeft;
  const mR = s.marginRight;
  const g = s.gutter;
  const innerW = W - mL - mR;
  const colW = (innerW - (cols - 1) * g) / cols;
  const colStarts = [];
  const colEnds = [];
  for (let i = 0; i < cols; i++) {
    const sx = mL + i * (colW + g);
    colStarts.push(sx);
    colEnds.push(sx + colW);
  }
  const rowStarts = [];
  for (let r = 0; r < ROW_COUNT; r++) rowStarts.push(rowY(r));

  const isIntCol = colW > 12 && Math.abs(colW - Math.round(colW)) < 0.01;
  const isSymMargin = mL === mR;
  const isGutterInt = Math.abs(g - Math.round(g)) < 0.01;

  return {
    W, H: BOARD_H, cols, mL, mR, g, innerW, colW,
    colStarts, colEnds, rowStarts,
    rowH: ROW_H, rowGap: ROW_GAP,
    isIntCol, isSymMargin, isGutterInt,
  };
}

export function spanWidth(grid, span) {
  const sp = Math.max(1, Math.min(span, grid.cols));
  return sp * grid.colW + (sp - 1) * grid.g;
}

// 按指定页码把 6 枚模块干净对齐到当前网格
export function buildPageBlocks(state, pageNo = 1) {
  const grid = computeGrid(state);
  const cols = grid.cols;
  const tpl = PAGE_LAYOUTS[pageNo] || PAGE_LAYOUTS[1];

  // 对不同列数做清晰映射，避免重叠
  const mapCol = (item) => {
    const scale = cols / 6;
    let sp = item.spanCols;
    if (cols === 12) sp = item.spanCols * 2;
    else if (cols === 8 && item.spanCols === 2) sp = 3;
    else if (cols === 4 && item.spanCols === 2) sp = 2;
    sp = Math.min(sp, cols);

    let c = Math.round(item.colFrac * cols);
    if (cols === 6 && pageNo === 1) {
      // 精确对应 207 原海报 6 列位置：
      // heroSq: col 1..2 (0-based: 1, span 2)
      // crossMark: col 4 (0-based: 4, span 1)
      // circle: col 2 (0-based: 2, span 1) -- 居中焦点
      // sideSq: col 5 (0-based: 5, span 1)
      // tri: col 1 (0-based: 1, span 1)
      // textBlock: col 4..5 (0-based: 4, span 2)
      const exact = { heroSq: 1, crossMark: 4, circle: 2, sideSq: 5, tri: 1, textBlock: 4 };
      c = exact[item.id];
    } else if (cols === 12 && pageNo === 1) {
      const exact12 = { heroSq: 1, crossMark: 8, circle: 5, sideSq: 10, tri: 1, textBlock: 7 };
      c = exact12[item.id];
    } else if (cols === 8 && pageNo === 1) {
      const exact8 = { heroSq: 1, crossMark: 5, circle: 3, sideSq: 7, tri: 1, textBlock: 5 };
      c = exact8[item.id];
    } else if (cols === 4 && pageNo === 1) {
      const exact4 = { heroSq: 0, crossMark: 3, circle: 1, sideSq: 3, tri: 0, textBlock: 2 };
      c = exact4[item.id];
    } else if (cols === 4) {
      c = Math.min(c, cols - sp);
    }
    c = Math.max(0, Math.min(cols - sp, c));
    return { col: c, span: sp, row: item.row };
  };

  // 去重避免 4 列等小列数切页撞车
  const occupied = new Set();
  return tpl.map((item) => {
    let { col, span, row } = mapCol(item);
    const fits = (r, c, sp) => {
      if (c < 0 || c + sp > cols) return false;
      for (let k = c; k < c + sp; k++) if (occupied.has(`${r}:${k}`)) return false;
      return true;
    };
    if (!fits(row, col, span)) {
      outer: for (let r = 0; r < ROW_COUNT; r++) {
        for (let c = 0; c <= cols - span; c++) {
          if (fits(r, c, span)) { row = r; col = c; break outer; }
        }
      }
    }
    for (let k = col; k < col + span; k++) occupied.add(`${row}:${k}`);
    return {
      id: item.id,
      x: grid.colStarts[col],
      y: grid.rowStarts[row],
      span,
      row,
    };
  });
}

// 初始状态：0/4 失序错态（绝不先给答案！）
// 1) 总宽 740px ÷ 6 列 + 左右不对称边距 18/38px + 栏距 22px -> 列宽 95.67px（亚像素碎尺）
// 2) 主图大方块左偏 +17px 压断栏缝；中央信号朱红圆向右偏移骑跨在第 3–4 列栏缝（+42px，正落在画布中心附近，perf-drag 拖它极顺手！）
// 3) 文本块行高 1.15×（18px，低于 1.4–1.6× 建议带且偏离基线格）
export function createInitialState() {
  const s = {
    theme: "poster",
    pageNo: 1,
    totalWidth: 740,
    cols: 6,
    gutter: 22,
    marginLeft: 18,
    marginRight: 38,
    leadingRatio: 1.15,
    viewportW: 1024,
    snap: true,
    showBaseline: true,
    selectedId: "circle",
    blocks: [],
  };
  const grid = computeGrid(s);
  const base = buildPageBlocks(s, 1);
  // 人为制造 0/4 真实失序（画布与读数由同一套坐标实算）
  s.blocks = base.map((b) => {
    if (b.id === "heroSq") {
      return { ...b, x: +(b.x - 19).toFixed(1) }; // 偏轨压缝 -19px
    }
    if (b.id === "circle") {
      // 刻意放进画面水平中央并骑跨第 3/4 列栏缝（偏离第 2 列起线 +52px，距离最近列起线约 +48px 或 -69px）
      return { ...b, x: +(grid.W * 0.5 - grid.colW * 0.5).toFixed(1), y: +(grid.rowStarts[1] + 10).toFixed(1) };
    }
    if (b.id === "textBlock") {
      return { ...b, x: +(b.x - 14).toFixed(1) }; // 左偏压入第 4 列缝
    }
    return b;
  });
  return s;
}

// 预设构造器
export function applyPreset(state, name) {
  if (name === "broken") {
    const fresh = createInitialState();
    fresh.theme = state.theme;
    return fresh;
  }
  const next = { ...state, pageNo: 1 };
  if (name === "poster-valid") {
    // 原海报 6 列纯整数典范解：2*24 + 6*92 + 5*24 = 720px
    next.totalWidth = 720;
    next.cols = 6;
    next.gutter = 24;
    next.marginLeft = 24;
    next.marginRight = 24;
    next.leadingRatio = 1.50;
    next.viewportW = 1024;
    next.blocks = buildPageBlocks(next, 1);
    return next;
  }
  if (name === "web960-valid") {
    // 2008 经典 960.gs 12 列纯整数解：2*10 + 12*60 + 11*20 = 960px
    next.totalWidth = 960;
    next.cols = 12;
    next.gutter = 20;
    next.marginLeft = 10;
    next.marginRight = 10;
    next.leadingRatio = 1.50;
    next.viewportW = 1280;
    next.blocks = buildPageBlocks(next, 1);
    return next;
  }
  if (name === "book4-valid") {
    // 4 列刊物稳重解：2*36 + 4*144 + 3*24 = 720px
    next.totalWidth = 720;
    next.cols = 4;
    next.gutter = 24;
    next.marginLeft = 36;
    next.marginRight = 36;
    next.leadingRatio = 1.50;
    next.viewportW = 1024;
    next.blocks = buildPageBlocks(next, 1);
    return next;
  }
  if (name === "err-overflow") {
    next.totalWidth = 960;
    next.cols = 12;
    next.gutter = 20;
    next.marginLeft = 10;
    next.marginRight = 10;
    next.leadingRatio = 1.50;
    next.viewportW = 480; // 窄屏撑爆！
    next.blocks = buildPageBlocks(next, 1);
    return next;
  }
  if (name === "err-nogutter") {
    next.totalWidth = 720;
    next.cols = 6;
    next.gutter = 0; // 栏距压死 0px
    next.marginLeft = 24;
    next.marginRight = 24;
    next.leadingRatio = 1.50;
    next.viewportW = 1024;
    next.blocks = buildPageBlocks(next, 1);
    return next;
  }
  return state;
}

// 为给定 (W, cols, g) 自动寻找最接近当前边距的纯整数对称边距解，帮助用户校准尺子
export function solveIntegerMargins(W, cols, g) {
  // 需要 (W - 2m - (cols-1)*g) % cols === 0，且 m >= 8
  const remBase = W - (cols - 1) * g;
  for (let m = 24; m >= 8; m--) {
    const inner = remBase - 2 * m;
    if (inner > cols * 24 && inner % cols === 0) return m;
  }
  for (let m = 25; m <= 60; m++) {
    const inner = remBase - 2 * m;
    if (inner > cols * 24 && inner % cols === 0) return m;
  }
  return null;
}

// 从当前实绘矩形与固定网格尺子单真源核算全部状态
export function evaluate(state) {
  const grid = computeGrid(state);
  const { W, cols, mL, mR, g, colW, colStarts, colEnds, rowStarts, rowH } = grid;

  // 1. 算每块真实矩形、列线误差、行线误差、是否骑跨栏缝
  const rects = state.blocks.map((b) => {
    const sp = Math.max(1, Math.min(b.span, cols));
    const w = spanWidth(grid, sp);
    const h = rowH;
    // 找最近的合法列起线（确保 c + sp <= cols）
    let bestCol = 0;
    let bestDx = Infinity;
    for (let c = 0; c <= cols - sp; c++) {
      const dx = b.x - colStarts[c];
      if (Math.abs(dx) < Math.abs(bestDx)) {
        bestDx = dx;
        bestCol = c;
      }
    }
    // 找最近的合法行起线
    let bestRow = 0;
    let bestDy = Infinity;
    for (let r = 0; r < ROW_COUNT; r++) {
      const dy = b.y - rowStarts[r];
      if (Math.abs(dy) < Math.abs(bestDy)) {
        bestDy = dy;
        bestRow = r;
      }
    }

    const errX = Math.abs(bestDx);
    const errY = Math.abs(bestDy);
    const errPx = Math.hypot(errX, errY);
    const outOfMargin = b.x < mL - 1.5 || b.x + w > W - mR + 1.5;

    // 检查左边缘或右边缘是否落在空白栏缝内
    let hitsGutter = false;
    for (let c = 0; c < cols - 1; c++) {
      const gStart = colEnds[c] + 1.5;
      const gEnd = colStarts[c + 1] - 1.5;
      if (gEnd > gStart) {
        if ((b.x > gStart && b.x < gEnd) || (b.x + w > gStart && b.x + w < gEnd)) {
          hitsGutter = true;
          break;
        }
      }
    }

    const snapped = errX <= 1.5 && errY <= 1.5 && !outOfMargin;
    const def = BLOCK_DEFS.find((d) => d.id === b.id);
    return {
      id: b.id,
      kind: def.kind,
      title: def.title,
      x: b.x,
      y: b.y,
      w,
      h,
      span: sp,
      bestCol,
      bestRow,
      dx: bestDx,
      dy: bestDy,
      errX,
      errY,
      errPx,
      outOfMargin,
      hitsGutter,
      snapped,
      spec: `col ${bestCol + 1}${sp > 1 ? `–${bestCol + sp}` : ""} · row ${bestRow + 1}`,
    };
  });

  // 2. 检测模块真实重叠
  const overlaps = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 4 && oy > 4) overlaps.push([a.id, b.id]);
    }
  }

  // 3. 视觉重心计算（按面积加权，衡量版面左右稳定性）
  let areaSum = 0, weightedX = 0;
  for (const r of rects) {
    const a = r.w * r.h;
    areaSum += a;
    weightedX += a * (r.x + r.w / 2);
  }
  const centroidX = areaSum ? weightedX / areaSum : W / 2;
  const balanceShiftPct = +(((centroidX - W / 2) / W) * 100).toFixed(1); // 负为左倾，正为右倾
  const absBalanceShift = Math.abs(balanceShiftPct);
  const balanceOk = absBalanceShift <= 18;

  // 4. 基线秩序与行高实算
  const lineHeightPx = Math.round(BODY_FONT_PX * state.leadingRatio); // px
  const leadingInRange = state.leadingRatio >= 1.38 && state.leadingRatio <= 1.62;
  const baselineLocked = lineHeightPx % 4 === 0; // 4px / 8px 网格步距整除
  const linesInBlock = 4;
  const blockTextHeight = linesInBlock * lineHeightPx;
  const targetHeight = Math.round(blockTextHeight / BASELINE_STEP) * BASELINE_STEP;
  const baselineDriftPx = Math.abs(blockTextHeight - targetHeight) + (leadingInRange ? 0 : Math.round(Math.abs(state.leadingRatio - 1.5) * 20));
  const baselineOk = leadingInRange && baselineLocked;

  // 5. 尺规整除、栏距与视口溢出实算
  const gutterZero = g < 6;
  const gutterHuge = g >= colW * 0.75 || colW < 24;
  const overflowPx = Math.max(0, Math.round(W - state.viewportW));
  const excessMarginPct = state.viewportW > W ? Math.round(((state.viewportW - W) / state.viewportW) * 100) : 0;

  const alignedCount = rects.filter((r) => r.snapped).length;
  const maxErrPx = Math.round(Math.max(...rects.map((r) => Math.max(r.errX, r.errY))));
  const rulerOk = grid.isIntCol && grid.isSymMargin && !gutterZero && !gutterHuge;
  const alignOk = alignedCount === rects.length && overlaps.length === 0;
  const collabOk = rulerOk && overflowPx === 0 && overlaps.length === 0 && alignOk;

  // 四大支柱达标计数（直接驱动原海报四栏核心优势！）
  const pillars = {
    stability: {
      ok: rulerOk && balanceOk && overlaps.length === 0,
      badge: !grid.isSymMargin
        ? `边距差 ${Math.abs(mL - mR)}px`
        : !grid.isIntCol
          ? `小数列 ${colW.toFixed(1)}px`
          : gutterZero
            ? `栏距 0px 挤死`
            : gutterHuge
              ? `栏距过大 ${g}px`
              : overlaps.length > 0
                ? `叠撞 ${overlaps.length} 处`
                : !balanceOk
                  ? `重心偏 ${balanceShiftPct > 0 ? "右" : "左"} ${absBalanceShift}%`
                  : `列宽 ${Math.round(colW)}px · 稳`,
    },
    repeatability: {
      ok: alignOk && rulerOk,
      badge: alignedCount < rects.length
        ? `${alignedCount}/${rects.length} 落格 · 偏 ${maxErrPx}px`
        : overlaps.length > 0
          ? `边界叠撞`
          : !rulerOk
            ? `待定整尺`
            : `6/6 落格 · 第 ${state.pageNo} 页`,
    },
    baseline: {
      ok: baselineOk,
      badge: !leadingInRange
        ? state.leadingRatio < 1.38
          ? `过挤 ${state.leadingRatio.toFixed(2)}×`
          : `过散 ${state.leadingRatio.toFixed(2)}×`
        : !baselineLocked
          ? `行高 ${lineHeightPx}px 失锁`
          : `${state.leadingRatio.toFixed(2)}× (${lineHeightPx}px) 锁基线`,
    },
    collaboration: {
      ok: overflowPx === 0 && rulerOk && alignOk,
      badge: overflowPx > 0
        ? `窄屏溢出 +${overflowPx}px`
        : !rulerOk
          ? `尺规非整数`
          : !alignOk
            ? `跨度未对齐`
            : `整数规范 · 0 歧义`,
    },
  };

  const score = [pillars.stability.ok, pillars.repeatability.ok, pillars.baseline.ok, pillars.collaboration.ok].filter(Boolean).length;

  // 优先级最高的主错态诊断（每次明确说「错在哪」「人眼会怎么看」「怎么改」）
  let code = "pass";
  let tag = `${score}/4 · 秩序成立`;
  let headline = "";
  let body = "";
  let tip = "";
  let fixAction = null;

  if (overflowPx > 0) {
    code = "overflow";
    tag = `${score}/4 · 窄屏溢出`;
    headline = `固定总宽 ${W}px 撑爆 ${state.viewportW}px 视口，右侧被切掉 ${overflowPx}px`;
    body = `固定网格把每一列都写成了绝对像素：当窗口缩到 ${state.viewportW}px 时，格子绝不会主动变瘦，右边栏直接掉出屏幕、逼出横向滚动条。这正是固定网格与流体网格的分水岭。`;
    tip = `把「模拟视口」拖宽回 ${W}px 以上，或把容器总宽切回更窄规格，观察红线消失。`;
    fixAction = { label: `放宽视口至 ${Math.max(W + 64, 1024)}px`, type: "fix-viewport" };
  } else if (gutterZero) {
    code = "gutter_zero";
    tag = `${score}/4 · 栏距挤死`;
    headline = `栏距压到了 ${g}px，相邻列块直接贴死成一整坨`;
    body = `固定网格靠「列宽 + 栏距」同时建立呼吸节奏。把栏距收成 ${g}px 后，图片边缘与相邻文字撞在一起，读者分不清哪两块属于同一栏、哪两块应该分开读。`;
    tip = `把栏距调回 16px–24px（确保列宽仍能整除），让每列之间恢复清晰的白色气口。`;
    fixAction = { label: "恢复 24px 整数栏距", type: "fix-gutter" };
  } else if (gutterHuge) {
    code = "gutter_huge";
    tag = `${score}/4 · 栏距散架`;
    headline = `栏距 ${g}px 几乎赶上列宽 ${colW.toFixed(1)}px，版面碎成孤岛`;
    body = `栏目之间的空白过宽时，眼睛很难把同一行的信息连成一个整体，画面从「统一秩序」散成几条互不相干的窄带。`;
    tip = `把栏距收窄到 16px–24px，让列宽明显大于栏距。`;
    fixAction = { label: "收紧栏距至 20px", type: "fix-gutter" };
  } else if (!grid.isSymMargin || !grid.isIntCol) {
    code = "subpixel";
    tag = `${score}/4 · 尺规碎裂`;
    headline = !grid.isSymMargin
      ? `左右边距不等（左 ${mL}px / 右 ${mR}px），且列宽算出小数 ${colW.toFixed(2)}px`
      : `总宽 ${W}px 除以 ${cols} 列算出小数列宽 ${colW.toFixed(2)}px`;
    body = `固定网格的第一要务是先立一把干脆的整数尺：公式 W = 2m + n·c + (n−1)·g 算不出整数列宽时，屏幕渲染容易发虚，设计师与工程师报尺寸也总差 1 像素。`;
    tip = `点击「校准对称整数尺」或切换 720px / 960px 整除规格，先让列宽与边距回归对称整数。`;
    fixAction = { label: "校准对称整数尺", type: "fix-ruler" };
  } else if (overlaps.length > 0) {
    code = "overlap";
    tag = `${score}/4 · 模块叠撞`;
    headline = `画布上有 ${overlaps.length} 处模块互相叠压，格子边界失效`;
    body = `固定网格里的每个模块应各自占据独立网格单元。两块互相压住会让主次失焦，复用模板替换内容时更会互相遮字。`;
    tip = `直接拖开画布上带红框的重叠模块，让它们各占不同列行单元。`;
    fixAction = { label: "自动分格归位", type: "fix-align" };
  } else if (!alignOk) {
    code = "offgrid";
    const bad = rects.filter((r) => !r.snapped);
    const worst = bad.slice().sort((a, b) => b.errPx - a.errPx)[0];
    tag = `${score}/4 · 骑缝脱轨`;
    headline = `${bad.length} 枚模块偏离格线（${worst.title}偏轨 ${Math.round(Math.max(worst.errX, worst.errY))}px）`;
    body = worst.hitsGutter
      ? `「${worst.title}」的边缘直接踩进白色栏距里。人眼对竖向对齐极其敏感——哪怕只偏十几像素，整个页面的严谨秩序都会立刻松垮，像随手贴上去的草稿。`
      : `「${worst.title}」没有严丝合缝贴紧第 ${worst.bestCol + 1} 列的起始线。固定网格要求每一块内容的起止点都向同一套垂直列线报到。`;
    tip = `在画布上直接拖移带红标的「${worst.title}」（含居中朱红圆）吸进最近樱粉列线，或点「对齐全部模块」。`;
    fixAction = { label: "吸附对齐全部模块", type: "fix-align" };
  } else if (!baselineOk) {
    code = "baseline";
    tag = `${score}/4 · 基线失锁`;
    headline = state.leadingRatio < 1.38
      ? `正文行高仅 ${state.leadingRatio.toFixed(2)}×（${lineHeightPx}px），行距闷死且脱开基线`
      : state.leadingRatio > 1.62
        ? `正文行高拉到 ${state.leadingRatio.toFixed(2)}×（${lineHeightPx}px），散成断行脱开基线`
        : `行高 ${lineHeightPx}px 不是 4px/8px 基线步距的整数倍`;
    body = `原海报给出实用经验值：正文行高宜取 1.4–1.6 倍字号，并对齐统一基线步距。当前 ${lineHeightPx}px 既打破舒适阅读节奏，又让段落底边对不齐同行模块的横格线。`;
    tip = `把「文本行高」滑块调到 1.50×（24px，恰好 3 倍 8px 基线步距），看右下段落瞬间锁进横虚线。`;
    fixAction = { label: "锁至 1.50× (24px) 基线", type: "fix-baseline" };
  } else if (!balanceOk) {
    code = "imbalance";
    tag = `${score}/4 · 重心偏倾`;
    headline = `6 枚模块挤向${balanceShiftPct < 0 ? "左" : "右"}侧，视觉重心偏移 ${absBalanceShift}%`;
    body = `虽然每块都落在了格子上，但质量过度偏向一侧会让整个版面显得像要倾倒。在固定网格里合理分布跨列模块，才能建立海报所说的「视觉重心平衡」。`;
    tip = `把一两枚模块拖往相反一侧的空列，把重心偏移收回到 ±18% 之内。`;
    fixAction = { label: "均衡分布模块", type: "fix-align" };
  } else {
    // 4/4 通关！
    let flavor = `${cols} 列固定网格合法解`;
    if (W === 720 && cols === 6 && g === 24) flavor = "原海报 6 列典范解";
    else if (W === 960 && cols === 12 && g === 20) flavor = "经典 960.gs 12 列解";
    else if (W === 720 && cols === 4) flavor = "4 列书刊稳重解";
    tag = `4/4 · ${flavor}`;
    headline = `整数尺 ${W}px × ${cols} 列秩序成立，6 枚模块严丝合缝`;
    body = excessMarginPct >= 42
      ? `每列精确 ${Math.round(colW)}px、栏距 ${g}px、对称边距 ${mL}px、行高 ${state.leadingRatio.toFixed(2)}×（${lineHeightPx}px）稳锁基线。同时注意：在 ${state.viewportW}px 宽屏下两侧留白已占 ${excessMarginPct}%，固定宽的边界开始显现。`
      : `每列精确 ${Math.round(colW)}px、栏距 ${g}px、对称边距 ${mL}px、行高 ${state.leadingRatio.toFixed(2)}×（${lineHeightPx}px）稳锁基线。现在点击下方「跨页复验」换到第 2/3 页，看骨架如何纹丝不动地承载全新版面！`;
    tip = `还可以试着把「模拟视口」拖窄到 ${W - 120}px 以下，亲眼看看固定网格撞上窄屏的真实代价。`;
  }

  const formulaText = `${W} = 2×${mL}${mL !== mR ? `(右${mR})` : ""} + ${cols}×${grid.isIntCol ? Math.round(colW) : colW.toFixed(2)} + ${cols - 1}×${g}`;

  return {
    grid,
    rects,
    overlaps,
    alignedCount,
    maxErrPx,
    centroidX,
    balanceShiftPct,
    lineHeightPx,
    baselineDriftPx,
    overflowPx,
    excessMarginPct,
    pillars,
    score,
    code,
    tag,
    headline,
    body,
    tip,
    fixAction,
    formulaText,
  };
}
