// 146 蒙德里安版式 · 单一几何与色彩力矩真源
// 所有画布坐标均在归一化 [0, 1] x [0, 1] 空间；画布渲染、二维力矩仪、四关键词灯和白话诊单全部从此模块实算。

export const PALETTE = {
  white: { id: "white", label: "暖白", role: "留白承托", hex: "#F5EEE3", ink: "#080808", weight: 0.06 },
  red: { id: "red", label: "原红", role: "最重锚点", hex: "#E51C15", ink: "#FFFFFF", weight: 1.0 },
  blue: { id: "blue", label: "钴蓝", role: "深沉配重", hex: "#0F47B1", ink: "#FFFFFF", weight: 0.85 },
  yellow: { id: "yellow", label: "明黄", role: "轻亮提神", hex: "#F7BE12", ink: "#080808", weight: 0.52 },
};

export const COLOR_ORDER = ["white", "red", "yellow", "blue"];

export const MIN_GAP = 0.13;
export const MIN_EDGE = 0.12;
export const MAX_EDGE = 0.88;

// 经验参考阈值（界面中均明示为经验/示意值）
export const RULES = {
  whiteMin: 0.5,
  whiteMax: 0.8,
  areaRatioMin: 2.2,
  minDimFloor: 0.11,
  balanceRadius: 0.095,
  asymmetryMin: 0.12,
  spreadMin: 0.3,
};

// 开场初始翻车态（0/4）：3x3 全贯通等距死棋盘 + 红蓝黄 5 格全挤在左半侧
export function createBrokenState() {
  return {
    v1: 1 / 3,
    v2: 2 / 3,
    h1: 1 / 3,
    h2: 2 / 3,
    cutTopV1: true,
    cutRightH2: true,
    colors: {
      c00: "red",
      c01: "red",
      c02: "white",
      c10: "blue",
      c11: "blue",
      c12: "white",
      c20: "yellow",
      c21: "white",
      c22: "white",
    },
    brush: "red",
    viewMode: "pure", // pure | exhibition | magazine
  };
}

// 静态镜像对称陷阱：重心恰好居中，但左右完全对称，用于演示「为什么对称不是蒙德里安」
export function createSymmetryTrapState() {
  return {
    v1: 0.25,
    v2: 0.75,
    h1: 0.32,
    h2: 0.68,
    cutTopV1: true,
    cutRightH2: true,
    colors: {
      c00: "red",
      c01: "white",
      c02: "red",
      c10: "white",
      c11: "white",
      c12: "white",
      c20: "blue",
      c21: "white",
      c22: "blue",
    },
    brush: "yellow",
    viewMode: "pure",
  };
}

export function clampLines(state) {
  let v1 = Math.max(MIN_EDGE, Math.min(MAX_EDGE - MIN_GAP, state.v1));
  let v2 = Math.max(v1 + MIN_GAP, Math.min(MAX_EDGE, state.v2));
  if (v2 - v1 < MIN_GAP) v1 = Math.max(MIN_EDGE, v2 - MIN_GAP);

  let h1 = Math.max(MIN_EDGE, Math.min(MAX_EDGE - MIN_GAP, state.h1));
  let h2 = Math.max(h1 + MIN_GAP, Math.min(MAX_EDGE, state.h2));
  if (h2 - h1 < MIN_GAP) h1 = Math.max(MIN_EDGE, h2 - MIN_GAP);

  return { ...state, v1, v2, h1, h2 };
}

export function moveLine(state, key, value) {
  const next = { ...state };
  if (key === "v1") {
    next.v1 = Math.max(MIN_EDGE, Math.min(state.v2 - MIN_GAP, value));
  } else if (key === "v2") {
    next.v2 = Math.min(MAX_EDGE, Math.max(state.v1 + MIN_GAP, value));
  } else if (key === "h1") {
    next.h1 = Math.max(MIN_EDGE, Math.min(state.h2 - MIN_GAP, value));
  } else if (key === "h2") {
    next.h2 = Math.min(MAX_EDGE, Math.max(state.h1 + MIN_GAP, value));
  }
  return clampLines(next);
}

// 从当前状态构建精确无缝矩形列表
export function buildCells(state) {
  const { v1, v2, h1, h2, cutTopV1, cutRightH2, colors } = state;
  const cells = [];

  if (cutTopV1) {
    cells.push({ id: "c00", x: 0, y: 0, w: v1, h: h1, color: colors.c00 || "white", roleHint: "左上格" });
    cells.push({ id: "c01", x: v1, y: 0, w: v2 - v1, h: h1, color: colors.c01 || "white", roleHint: "中上格" });
  } else {
    cells.push({ id: "c00", x: 0, y: 0, w: v2, h: h1, color: colors.c00 || "white", roleHint: "合并主大格", merged: true });
  }

  cells.push({ id: "c02", x: v2, y: 0, w: 1 - v2, h: h1, color: colors.c02 || "white", roleHint: "右上格" });
  cells.push({ id: "c10", x: 0, y: h1, w: v1, h: h2 - h1, color: colors.c10 || "white", roleHint: "左中格" });
  cells.push({ id: "c11", x: v1, y: h1, w: v2 - v1, h: h2 - h1, color: colors.c11 || "white", roleHint: "中心格" });

  if (cutRightH2) {
    cells.push({ id: "c12", x: v2, y: h1, w: 1 - v2, h: h2 - h1, color: colors.c12 || "white", roleHint: "右中格" });
    cells.push({ id: "c22", x: v2, y: h2, w: 1 - v2, h: 1 - h2, color: colors.c22 || "white", roleHint: "右下格" });
  } else {
    cells.push({ id: "c12", x: v2, y: h1, w: 1 - v2, h: 1 - h1, color: colors.c12 || "white", roleHint: "合并右竖柱", merged: true });
  }

  cells.push({ id: "c20", x: 0, y: h2, w: v1, h: 1 - h2, color: colors.c20 || "white", roleHint: "左下格" });
  cells.push({ id: "c21", x: v1, y: h2, w: v2 - v1, h: 1 - h2, color: colors.c21 || "white", roleHint: "中下格" });

  return cells.map((cell) => ({
    ...cell,
    area: cell.w * cell.h,
    cx: cell.x + cell.w / 2,
    cy: cell.y + cell.h / 2,
  }));
}

// 4 条可拖主黑带与 2 段局部 T 字黑线几何描述
export function buildSegments(state) {
  const { v1, v2, h1, h2, cutTopV1, cutRightH2 } = state;
  return {
    lines: [
      { key: "v1", axis: "v", pos: v1, x1: v1, y1: cutTopV1 ? 0 : h1, x2: v1, y2: 1, label: "左竖黑带" },
      { key: "v2", axis: "v", pos: v2, x1: v2, y1: 0, x2: v2, y2: 1, label: "右竖黑带" },
      { key: "h1", axis: "h", pos: h1, x1: 0, y1: h1, x2: 1, y2: h1, label: "上横黑带" },
      { key: "h2", axis: "h", pos: h2, x1: 0, y1: h2, x2: cutRightH2 ? 1 : v2, y2: h2, label: "下横黑带" },
    ],
    toggles: [
      {
        key: "cutTopV1",
        active: cutTopV1,
        axis: "v",
        x1: v1,
        y1: 0,
        x2: v1,
        y2: h1,
        mx: v1,
        my: h1 * 0.5,
        label: cutTopV1 ? "断开上竖线（合出主大格）" : "接回上竖线",
      },
      {
        key: "cutRightH2",
        active: cutRightH2,
        axis: "h",
        x1: v2,
        y1: h2,
        x2: 1,
        y2: h2,
        mx: v2 + (1 - v2) * 0.5,
        my: h2,
        label: cutRightH2 ? "断开右横线（合出长竖柱）" : "接回右横线",
      },
    ],
  };
}

// 检测两个矩形是否共享超过最小长度的公共边
function sharesEdge(a, b) {
  const eps = 1e-4;
  const xTouch = Math.abs(a.x + a.w - b.x) < eps || Math.abs(b.x + b.w - a.x) < eps;
  const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (xTouch && yOverlap > 0.02) return true;

  const yTouch = Math.abs(a.y + a.h - b.y) < eps || Math.abs(b.y + b.h - a.y) < eps;
  const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  if (yTouch && xOverlap > 0.02) return true;
  return false;
}

// 20x20 网格中心采样视觉权重图（采样点 0.025..0.975 避开 0.25/0.5/0.75 整点边界），严格量出左右/上下镜像对称度
function computeAsymmetry(cells) {
  const N = 20;
  const grid = new Array(N * N).fill(0);
  for (let iy = 0; iy < N; iy++) {
    const py = (iy + 0.5) / N;
    for (let ix = 0; ix < N; ix++) {
      const px = (ix + 0.5) / N;
      const cell =
        cells.find((c) => px >= c.x && px < c.x + c.w && py >= c.y && py < c.y + c.h) ||
        cells.find((c) => px >= c.x - 1e-4 && px <= c.x + c.w + 1e-4 && py >= c.y - 1e-4 && py <= c.y + c.h + 1e-4);
      grid[iy * N + ix] = cell ? PALETTE[cell.color].weight : 0.06;
    }
  }
  let diffX = 0;
  let diffY = 0;
  let total = 0;
  for (let iy = 0; iy < N; iy++) {
    for (let ix = 0; ix < N; ix++) {
      const w = grid[iy * N + ix];
      const wx = grid[iy * N + (N - 1 - ix)];
      const wy = grid[(N - 1 - iy) * N + ix];
      diffX += Math.abs(w - wx);
      diffY += Math.abs(w - wy);
      total += w;
    }
  }
  const denom = Math.max(0.5, total);
  return {
    asymX: diffX / denom,
    asymY: diffY / denom,
    asymmetry: Math.min(diffX / denom, diffY / denom) * 0.55 + Math.max(diffX / denom, diffY / denom) * 0.45,
    mirrorX: diffX / denom < 0.09,
    mirrorY: diffY / denom < 0.09,
  };
}

function directionLabel(dx, dy) {
  const parts = [];
  if (dx < -0.05) parts.push("左");
  else if (dx > 0.05) parts.push("右");
  if (dy < -0.05) parts.push("上");
  else if (dy > 0.05) parts.push("下");
  return parts.length ? parts.join("") : "中央";
}

// 统一评估：供画布、四关键词灯、力矩仪、诊单与自动化测试共同读取
export function evaluate(rawState) {
  const state = clampLines(rawState);
  const cells = buildCells(state);
  const segments = buildSegments(state);

  let whiteArea = 0;
  let redArea = 0;
  let blueArea = 0;
  let yellowArea = 0;
  let maxArea = 0;
  let minArea = 1;
  let minDim = 1;
  let largestWhiteCell = null;

  const coloredCells = [];
  for (const c of cells) {
    if (c.area > maxArea) maxArea = c.area;
    if (c.area < minArea) minArea = c.area;
    minDim = Math.min(minDim, c.w, c.h);
    if (c.color === "white") {
      whiteArea += c.area;
      if (!largestWhiteCell || c.area > largestWhiteCell.area) largestWhiteCell = c;
    } else {
      coloredCells.push(c);
      if (c.color === "red") redArea += c.area;
      else if (c.color === "blue") blueArea += c.area;
      else if (c.color === "yellow") yellowArea += c.area;
    }
  }

  const colorArea = 1 - whiteArea;
  const areaRatio = maxArea / Math.max(0.001, minArea);
  const tJunctionCount = (state.cutTopV1 ? 0 : 1) + (state.cutRightH2 ? 0 : 1);

  // 同色粘连统计与跨度计算
  let sameColorTouches = 0;
  const touchingIds = new Set();
  for (let i = 0; i < coloredCells.length; i++) {
    for (let j = i + 1; j < coloredCells.length; j++) {
      if (coloredCells[i].color === coloredCells[j].color && sharesEdge(coloredCells[i], coloredCells[j])) {
        sameColorTouches++;
        touchingIds.add(coloredCells[i].id);
        touchingIds.add(coloredCells[j].id);
      }
    }
  }

  const distinctColors = new Set(coloredCells.map((c) => c.color));
  let maxSpread = 0;
  for (let i = 0; i < coloredCells.length; i++) {
    for (let j = i + 1; j < coloredCells.length; j++) {
      const d = Math.hypot(coloredCells[i].cx - coloredCells[j].cx, coloredCells[i].cy - coloredCells[j].cy);
      if (d > maxSpread) maxSpread = d;
    }
  }

  // 二维视觉权重重心（色块面积 × 示意视觉重量 + 粗黑分割线质量）
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  for (const c of cells) {
    const mass = c.area * PALETTE[c.color].weight;
    sumW += mass;
    sumWX += mass * c.cx;
    sumWY += mass * c.cy;
  }
  const lineThickness = 0.018;
  const lineWeight = 0.42;
  for (const seg of segments.lines) {
    const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
    const mass = len * lineThickness * lineWeight;
    const mx = (seg.x1 + seg.x2) / 2;
    const my = (seg.y1 + seg.y2) / 2;
    sumW += mass;
    sumWX += mass * mx;
    sumWY += mass * my;
  }
  const comX = sumW > 0 ? sumWX / sumW : 0.5;
  const comY = sumW > 0 ? sumWY / sumW : 0.5;
  const dx = comX - 0.5;
  const dy = comY - 0.5;
  const offset = Math.hypot(dx, dy);

  const asym = computeAsymmetry(cells);
  const linesSymmetric = Math.abs(state.v1 + state.v2 - 1) < 0.045 && Math.abs(state.h1 + state.h2 - 1) < 0.045;
  const isMirrorTrap = coloredCells.length >= 2 && (asym.mirrorX || (asym.asymmetry < RULES.asymmetryMin && linesSymmetric));

  const nearThirds =
    Math.abs(state.v1 - 1 / 3) < 0.03 &&
    Math.abs(state.v2 - 2 / 3) < 0.03 &&
    Math.abs(state.h1 - 1 / 3) < 0.03 &&
    Math.abs(state.h2 - 2 / 3) < 0.03;

  // 四项原海报关键词独立检验
  const gridOk = whiteArea >= RULES.whiteMin && whiteArea <= RULES.whiteMax && tJunctionCount >= 1;
  const proportionOk = areaRatio >= RULES.areaRatioMin && minDim >= RULES.minDimFloor && !(nearThirds && tJunctionCount === 0);
  const alignmentOk =
    distinctColors.size >= 2 &&
    sameColorTouches === 0 &&
    coloredCells.length >= 2 &&
    maxSpread >= RULES.spreadMin;
  const balanceOk =
    coloredCells.length >= 1 &&
    colorArea >= 0.14 &&
    offset <= RULES.balanceRadius &&
    !isMirrorTrap &&
    asym.asymmetry >= RULES.asymmetryMin;

  const passedCount = [gridOk, proportionOk, alignmentOk, balanceOk].filter(Boolean).length;

  // 各关键词短状态词
  let gridNote = "留白与 T 字齐备";
  if (tJunctionCount === 0) gridNote = "缺 T 字断线";
  else if (whiteArea < RULES.whiteMin) gridNote = `白底仅 ${Math.round(whiteArea * 100)}%`;
  else if (whiteArea > RULES.whiteMax) gridNote = "原色偏少";

  let propNote = `极差 ${areaRatio.toFixed(1)}×`;
  if (minDim < RULES.minDimFloor) propNote = "有窄条压扁";
  else if (areaRatio < RULES.areaRatioMin) propNote = `均分 ${areaRatio.toFixed(1)}×`;

  let alignNote = `${distinctColors.size} 色跨区呼应`;
  if (distinctColors.size < 2) alignNote = "少于 2 种原色";
  else if (sameColorTouches > 0) alignNote = `同色粘连 ${sameColorTouches} 处`;
  else if (maxSpread < RULES.spreadMin) alignNote = "原色挤作一团";

  let balNote = "非对称稳态";
  if (coloredCells.length === 0 || colorArea < 0.14) balNote = "缺色块锚点";
  else if (isMirrorTrap || asym.asymmetry < RULES.asymmetryMin) balNote = "静态镜像对称";
  else if (offset > RULES.balanceRadius) balNote = `偏坠${directionLabel(dx, dy)}`;

  // 优先级明确的主诊断（永远先指出最致命的一条，并说清为什么 + 下一步）
  let badge = "待校准";
  let headline = "";
  let body = "";
  let nextHint = "";
  let tone = "warn"; // warn | ok

  if (passedCount === 4) {
    tone = "ok";
    badge = "动态平衡 · 4/4";
    headline = "非对称秩序立住了：留白透气，三原色彼此拉住重心";
    body = `当前暖白占 ${Math.round(whiteArea * 100)}%，最大与最小格拉开 ${areaRatio.toFixed(1)}× 主次，${distinctColors.size} 种原色隔白对位，二维示意重心落在稳态圈内（偏 ${Math.round(offset * 100)}%）。切到「展览海报」或「杂志封面」，看看文字落进暖白大格时的呼吸感。`;
    nextHint = "试着把一块红换到对称位置，或点「试试静态对称」，体会蒙德里安为什么拒绝镜像。";
  } else if (colorArea < 0.14) {
    badge = "素表无锚";
    headline = `原色面积只剩 ${Math.round(colorArea * 100)}%，版面退化成普通黑白表格`;
    body = "拿掉原色块后，粗黑线只剩机械分栏功能（更像 144 框架版式），视线扫过整页没有高饱和锚点可停。";
    nextHint = "在明黄蘸色盘选「原红」或「钴蓝」，在斜对角的两个非主角格各点染一块。";
  } else if (whiteArea < RULES.whiteMin) {
    badge = "色块过载";
    headline = `暖白留白跌到 ${Math.round(whiteArea * 100)}%，画面像填满的彩色瓷砖`;
    body = "高饱和原色铺过半幅后，红、蓝、黄互相抢风头，整张版面失去空气感，标题和正文也没了干净落脚处（经验留白建议 50%–80%）。";
    nextHint = "在蘸色盘切到「暖白」，把偏大或连成一片的彩格洗白 1–2 块。";
  } else if (isMirrorTrap || (offset <= RULES.balanceRadius && asym.asymmetry < RULES.asymmetryMin)) {
    badge = "静态对称";
    headline = "重心虽在正中，但这靠左右镜像堆平，锁死了动态张力";
    body = "蒙德里安追求的是「非对称动态平衡」——用大块轻盈留白对位远处小块重色，而不是左右照镜子摆两块一样大的红蓝。";
    nextHint = "挪动一条黑带打破对称比例，并把一侧色块换成不同色或挪到对角格，再断一条 T 字线。";
  } else if (minDim < RULES.minDimFloor) {
    badge = "窄缝挤压";
    headline = `最窄一格仅剩 ${Math.round(minDim * 100)}%，粗黑线快粘成黑疙瘩`;
    body = "把黑带推得太贴边或两条线挤在一起，会裁出既装不下字又破坏节奏的死缝。";
    nextHint = "把最靠边的黑带往画布内侧稍稍拉回，保持每格宽高至少 12%。";
  } else if (tJunctionCount === 0 && areaRatio < RULES.areaRatioMin) {
    badge = "均分棋盘";
    headline = `九格面积极差仅 ${areaRatio.toFixed(1)}×，四线全贯通像空白表格`;
    body = "等距全贯通网格让每个格子权力相同，读者进页不知道先看哪块；同时左半侧原色扎堆，示意重心已往" + directionLabel(dx, dy) + "偏坠。";
    nextHint = "先点画布上半段「拆开 T 字」图标合出左上大主格，再左右拖动粗黑主竖带拉开大小反差。";
  } else if (tJunctionCount === 0) {
    badge = "缺 T 字破格";
    headline = "四条黑线全部贯通，还没合出一块镇场的 T 字主格";
    body = "蒙德里安常用「一条线撞到另一条线就停下」的 T 字交接，把相邻小格融成宽阔主舞台，避免版面滑回十字网格。";
    nextHint = "点击画布上带「×」标记的局部黑线开关（上竖或右横），拆掉其中一段。";
  } else if (areaRatio < RULES.areaRatioMin) {
    badge = "主次平权";
    headline = `最大与最小格仅差 ${areaRatio.toFixed(1)}×（经验建议 ≥ 2.2×）`;
    body = "格子大小太接近，缺少大主格领衔与窄边带点缀的疏密对比，比例节奏显得温吞。";
    nextHint = "拖动任意粗黑带，让一块暖白主格放大到 ≥ 28%，同时保留一两块灵巧窄格装原色。";
  } else if (sameColorTouches > 0) {
    badge = "同色粘连";
    headline = `有 ${sameColorTouches} 处同色原色格紧挨在一起，糊成单调大色块`;
    body = "相邻两格涂同一种原色，黑线中间的色彩对位节奏会被削弱，也容易把视觉重量死压在局部。";
    nextHint = "把紧挨的同色格其中一块洗回「暖白」，把颜色移到隔着白格的斜对角去。";
  } else if (distinctColors.size < 2 || maxSpread < RULES.spreadMin) {
    badge = "缺少对位";
    headline = distinctColors.size < 2 ? "当前只有一种原色，还没形成原色间的冷暖对位" : "彩色块都挤在同一隅，对角区域空落落";
    body = "至少用两种性格不同的原色（如重暖红对深冷蓝，或红对轻亮黄）隔着暖白跨区呼应，视线才会在画布里流动起来。";
    nextHint = "选另一种原色，点染在远离现有色块的斜对角小格里。";
  } else {
    badge = `偏坠${directionLabel(dx, dy)}`;
    headline = `视觉重心明显往${directionLabel(dx, dy)}偏了（示意偏离 ${Math.round(offset * 100)}%）`;
    body = "同面积下，红最重（1.0）、蓝次之（0.85）、黄轻快（0.52）、暖白最轻（0.06）。现在重色偏在" + directionLabel(dx, dy) + "侧，整版有倾倒感。";
    nextHint = `把重色块往反方向收小一点，或在${directionLabel(-dx, -dy)}远端小格补一块蓝或红，把力矩拉回稳态圈。`;
  }

  return {
    state,
    cells,
    segments,
    largestWhiteCell,
    touchingIds,
    metrics: {
      whiteRatio: whiteArea,
      colorRatio: colorArea,
      redRatio: redArea,
      blueRatio: blueArea,
      yellowRatio: yellowArea,
      areaRatio,
      minDim,
      tJunctionCount,
      sameColorTouches,
      distinctColors: distinctColors.size,
      maxSpread,
      comX,
      comY,
      dx,
      dy,
      offset,
      asymmetry: asym.asymmetry,
      isMirrorTrap,
      passedCount,
    },
    checks: {
      grid: { ok: gridOk, label: "网格", en: "GRID", note: gridNote },
      proportion: { ok: proportionOk, label: "比例", en: "PROPORTION", note: propNote },
      alignment: { ok: alignmentOk, label: "对位", en: "ALIGNMENT", note: alignNote },
      balance: { ok: balanceOk, label: "平衡", en: "BALANCE", note: balNote },
    },
    diagnosis: { tone, badge, headline, body, nextHint },
  };
}

// 02 节：杠杆配重天平数学模型（严格复用同一套示意色彩重量 PALETTE[color].weight）
export function evaluateLever({ leftColor = "yellow", leftArea = 1.6, leftArm = 0.45, rightColor = "red", rightArea = 0.75, rightArm = 0.72 }) {
  const leftMass = leftArea * PALETTE[leftColor].weight;
  const rightMass = rightArea * PALETTE[rightColor].weight;
  const leftTorque = leftMass * leftArm;
  const rightTorque = rightMass * rightArm;
  const diff = rightTorque - leftTorque; // >0 右沉，<0 左沉
  const norm = diff / Math.max(0.25, leftTorque + rightTorque);
  const angleDeg = Math.max(-16, Math.min(16, norm * 28));
  const balanced = Math.abs(angleDeg) <= 2.2;
  let verdict = "";
  if (balanced) {
    verdict = `横梁已稳（倾角 ${angleDeg.toFixed(1)}°）：右侧小面积「${PALETTE[rightColor].label}」靠更高的色彩重量与力臂，稳稳托住了左侧大块「${PALETTE[leftColor].label}」。`;
  } else if (diff > 0) {
    verdict = `右侧下沉 ${angleDeg.toFixed(1)}°：右侧「${PALETTE[rightColor].label}」力矩过重——把右块缩窄、换更轻的明黄，或把右块往支点收近一点。`;
  } else {
    verdict = `左侧下沉 ${Math.abs(angleDeg).toFixed(1)}°：右侧托不住左边——把右块换成更重的原红/钴蓝、略增面积，或往右端推远拉长力臂。`;
  }
  return { leftMass, rightMass, leftTorque, rightTorque, angleDeg, balanced, verdict };
}
