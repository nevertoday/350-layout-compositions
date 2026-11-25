// 236 · 瀑布流布局 单真源布局算法与诊断模型
// 开场舞台、读数、实时 CSS、三彩圆指标与各节小实验全部从这里算出来，不写死展示常数。

export const PALETTE = {
  paper: "#FAF2E7",
  paperLight: "#FDF9F2",
  sand: "#F6ECDF",
  sandDeep: "#EDE0CE",
  ink: "#1B1B1B",
  inkSub: "#43413D",
  red: "#F25A39",
  redDeep: "#B62F12",
  teal: "#098071",
  tealDeep: "#066257",
  yellow: "#F3B52D",
  yellowDeep: "#7E5400",
  cream: "#F7EDE1",
  line: "#D2C7B8",
};

// 1:1 承袭 236 原海报下半部 9 张几何卡片（顺序、色彩、文案、自然纵横高比全部对应原海报）
// hFactor 为相对单列宽度的高度系数（自然态下复刻原海报 3 列高低错落）
export const BASE_CARDS = [
  {
    id: 1,
    title: "列宽一致",
    sub: "所有列的宽度相同\n形成稳定的垂直节奏",
    theme: "red",
    motif: "bars",
    naturalH: 0.78,
    extremeH: 0.56,
  },
  {
    id: 2,
    title: "自动补位",
    sub: "后续卡片自动填补\n上方的空白区域",
    theme: "yellow",
    motif: "flow",
    naturalH: 1.32,
    extremeH: 1.88, // 极端超长卡，既拉出行坑又拖长列尾
  },
  {
    id: 3,
    title: "节奏分布",
    sub: "内容的疏密与节奏\n让页面更生动自然",
    theme: "beige",
    motif: "wave",
    naturalH: 1.12,
    extremeH: 0.54,
  },
  {
    id: 4,
    title: "卡片高度可变",
    sub: "内容多少决定高度\n实现高低错落的效果",
    theme: "beige",
    motif: "sunarch",
    naturalH: 1.36,
    extremeH: 0.60,
  },
  {
    id: 5,
    title: "无限滚动",
    sub: "与滚动加载结合\n提供流畅的浏览体验",
    theme: "teal",
    motif: "spinner",
    naturalH: 0.88,
    extremeH: 0.56,
  },
  {
    id: 6,
    title: "阅读更高效",
    sub: "符合自然浏览轨迹\n减少用户思考成本",
    theme: "black",
    motif: "eye",
    naturalH: 0.84,
    extremeH: 1.46,
  },
  {
    id: 7,
    title: "保持间距",
    sub: "合理的间距（Gutter）\n让页面呼吸更舒适",
    theme: "yellow",
    motif: "ruler",
    naturalH: 0.86,
    extremeH: 0.56,
  },
  {
    id: 8,
    title: "节省空间",
    sub: "在有限区域内\n展示更多内容",
    theme: "teal",
    motif: "corners",
    naturalH: 0.80,
    extremeH: 0.54,
  },
  {
    id: 9,
    title: "适用场景广",
    sub: "图文列表 / 作品集\n商品展示 / 资讯流",
    theme: "red",
    motif: "icons",
    naturalH: 0.74,
    extremeH: 0.54,
  },
];

// 点击「＋追加新卡」时加入的扩展包豪斯卡片，用于亲测无限滚动与多栏跳列
export const EXTRA_CARDS = [
  {
    id: 10,
    title: "图片预占位",
    sub: "提前声明宽高比\n避免加载瞬间抖动",
    theme: "beige",
    motif: "ratio",
    naturalH: 1.06,
    extremeH: 1.06,
  },
  {
    id: 11,
    title: "容差稳序",
    sub: "高差极小时先靠左\n兼顾紧致与可读",
    theme: "red",
    motif: "tolerance",
    naturalH: 0.84,
    extremeH: 0.84,
  },
  {
    id: 12,
    title: "响应式折列",
    sub: "随屏宽增减列数\n始终守住单列可读",
    theme: "teal",
    motif: "columns",
    naturalH: 1.18,
    extremeH: 1.18,
  },
];

export const HEIGHT_TIERS = [
  { key: "short", label: "矮卡", factor: 0.68 },
  { key: "mid", label: "中卡", factor: 0.96 },
  { key: "tall", label: "高卡", factor: 1.38 },
  { key: "giant", label: "超长", factor: 2.35 },
];

export const THEME_STYLES = {
  red: { bg: "#F25A39", fg: "#1B1B1B", sub: "#2B1610", sq: "#1B1B1B", tagBg: "rgba(27,27,27,0.14)" },
  yellow: { bg: "#F3B52D", fg: "#1B1B1B", sub: "#362605", sq: "#1B1B1B", tagBg: "rgba(27,27,27,0.13)" },
  beige: { bg: "#F6ECDF", fg: "#1B1B1B", sub: "#43413D", sq: "#1B1B1B", tagBg: "rgba(27,27,27,0.08)" },
  teal: { bg: "#098071", fg: "#FAF2E7", sub: "#E6F4F1", sq: "#1B1B1B", tagBg: "rgba(250,242,231,0.18)" },
  black: { bg: "#1B1B1B", fg: "#FAF2E7", sub: "#DFD7CC", sq: "#FAF2E7", tagBg: "rgba(250,242,231,0.16)" },
};

// 开场默认：0 / 4 经典翻车错态（行锁死空洞 + 不等宽乱列 + 0px 粘连 + 极端超长卡失衡）
export function createInitialState() {
  return {
    algorithm: "row-grid",       // "row-grid" | "columns" | "shortest" | "grid-lanes"
    colWidthMode: "uneven",      // "uneven" | "equal"
    gutter: 0,                   // 0 .. 44 px
    rhythmMode: "extreme",       // "extreme" | "uniform" | "natural"
    colLock: "auto",             // "auto" | 2 | 3 | 4 | 5
    wallRatio: 0.92,             // 0.36 .. 1.00，横拖画布实时改变有效容器宽
    extraCount: 0,               // 0 .. 3 追加卡片数
    showOrder: false,            // 是否叠加 1→2→3 阅读顺序连线
    heightOverrides: {},         // { [cardId]: factor } 用户直接点卡微调
    selectedCardId: null,
    lastRelocated: 0,            // 上一次追加新卡导致的既有卡跨列数
    lastAddedIds: [],
  };
}

export function createPosterSolution(baseState = {}) {
  return {
    ...createInitialState(),
    ...baseState,
    algorithm: "shortest",
    colWidthMode: "equal",
    gutter: 14,
    rhythmMode: "natural",
    colLock: "auto",
    wallRatio: 0.96,
    heightOverrides: {},
    lastRelocated: 0,
  };
}

export function createGridLanesSolution(baseState = {}) {
  return {
    ...createInitialState(),
    ...baseState,
    algorithm: "grid-lanes",
    colWidthMode: "equal",
    gutter: 18,
    rhythmMode: "natural",
    colLock: "auto",
    wallRatio: 0.96,
    heightOverrides: {},
    lastRelocated: 0,
  };
}

// 按有效像素宽度决定响应式列数：手机默认 2 列、平板/桌面默认原海报 3 列、超宽屏 4 列
export function resolveColumnCount(wallPx, colLock) {
  if (colLock !== "auto") return Math.max(1, Math.min(5, Number(colLock) || 3));
  if (wallPx < 250) return 1;
  if (wallPx < 600) return 2;
  if (wallPx < 1320) return 3;
  if (wallPx < 1660) return 4;
  return 5;
}

// 计算每列宽度与 X 起点（支持等宽与不等宽乱列）
export function computeColumnTracks(wallPx, cols, gutter, colWidthMode) {
  const usable = Math.max(120, wallPx - gutter * Math.max(0, cols - 1));
  let weights;
  if (colWidthMode === "equal" || cols === 1) {
    weights = Array.from({ length: cols }, () => 1 / cols);
  } else {
    const raw =
      cols === 2 ? [0.66, 0.34] :
      cols === 3 ? [0.50, 0.22, 0.28] :
      cols === 4 ? [0.38, 0.17, 0.28, 0.17] :
      [0.32, 0.15, 0.23, 0.15, 0.15];
    const sum = raw.reduce((a, b) => a + b, 0);
    weights = raw.map((v) => v / sum);
  }
  const tracks = [];
  let cx = 0;
  for (let i = 0; i < cols; i++) {
    const w = usable * weights[i];
    tracks.push({ col: i, x: cx, w, weight: weights[i] });
    cx += w + gutter;
  }
  return tracks;
}

// 获取当前卡片列表及其目标高度（独立收束垂直基准，避免宽屏下墙体虚高导致被压窄）
export function resolveCardList(state, baseColW, cols) {
  const all = [...BASE_CARDS, ...EXTRA_CARDS.slice(0, state.extraCount)];
  const refH = cols <= 2 ? Math.max(82, Math.min(106, baseColW * 0.68)) : Math.max(96, Math.min(120, baseColW * 0.42));
  return all.map((c, idx) => {
    let factor;
    if (state.heightOverrides[c.id] != null) {
      factor = state.heightOverrides[c.id];
    } else if (state.rhythmMode === "uniform") {
      factor = 0.88;
    } else if (state.rhythmMode === "extreme") {
      factor = c.extremeH;
    } else {
      factor = c.naturalH;
    }
    const h = Math.round(refH * factor);
    return { ...c, domIndex: idx, factor, h };
  });
}

// 核心装箱引擎：单真源产出每张卡精确坐标、空洞矩形、列底高度、跳序数
export function computeLayout(state, stageWidthPx) {
  const maxWallW = Math.max(240, stageWidthPx);
  const minWallW = Math.min(220, maxWallW * 0.62);
  const wallW = Math.round(minWallW + (maxWallW - minWallW) * ((state.wallRatio - 0.36) / (1.0 - 0.36)));
  const clampedWallW = Math.max(minWallW, Math.min(maxWallW, wallW));

  const cols = resolveColumnCount(clampedWallW, state.colLock);
  const gutter = Math.max(0, Math.min(44, Math.round(state.gutter)));
  const tracks = computeColumnTracks(clampedWallW, cols, gutter, state.colWidthMode);
  const avgColW = (clampedWallW - gutter * Math.max(0, cols - 1)) / cols;
  const minColW = Math.min(...tracks.map((t) => t.w));
  const maxColW = Math.max(...tracks.map((t) => t.w));

  const cards = resolveCardList(state, avgColW, cols);
  const placed = [];
  const voids = [];
  const colHeights = Array.from({ length: cols }, () => 0);

  if (state.algorithm === "row-grid") {
    // 普通二维等行网格：按行依次放，每行以最高卡为行高，矮卡下方留出真实行坑
    const rows = Math.ceil(cards.length / cols);
    let y = 0;
    for (let r = 0; r < rows; r++) {
      const slice = cards.slice(r * cols, (r + 1) * cols);
      const rowH = Math.max(...slice.map((c) => c.h));
      slice.forEach((c, ci) => {
        const t = tracks[ci];
        placed.push({ ...c, x: t.x, y, w: t.w, h: c.h, col: ci, row: r });
        if (rowH - c.h > 8) {
          voids.push({
            x: t.x,
            y: y + c.h + Math.min(4, gutter * 0.25),
            w: t.w,
            h: rowH - c.h - Math.min(4, gutter * 0.25),
            cardId: c.id,
            col: ci,
          });
        }
        colHeights[ci] = y + rowH;
      });
      y += rowH + gutter;
    }
  } else if (state.algorithm === "columns") {
    // CSS multi-column（column-count）：从上到下先填满第 1 列，再换第 2 列……
    // 按总高度尽量均衡断栏（贴近浏览器 CSS multi-column 平衡行为）
    const totalH = cards.reduce((s, c) => s + c.h + gutter, 0);
    const targetPerCol = totalH / cols;
    let ci = 0;
    let curY = 0;
    cards.forEach((c, idx) => {
      const remainingCols = cols - 1 - ci;
      const remainingCards = cards.length - idx;
      if (
        ci < cols - 1 &&
        curY > 0 &&
        (curY + c.h * 0.55 > targetPerCol || remainingCards <= remainingCols)
      ) {
        ci++;
        curY = 0;
      }
      const t = tracks[ci];
      placed.push({ ...c, x: t.x, y: curY, w: t.w, h: c.h, col: ci });
      curY += c.h + gutter;
      colHeights[ci] = curY - gutter;
    });
  } else {
    // "shortest"（标准最短列）或 "grid-lanes"（CSS Grid Level 3 容差补位）
    const tolerance = state.algorithm === "grid-lanes" ? 28 : 0;
    cards.forEach((c) => {
      const minY = Math.min(...colHeights);
      let chosen = 0;
      for (let i = 0; i < cols; i++) {
        if (colHeights[i] <= minY + tolerance + 0.5) {
          chosen = i;
          break;
        }
      }
      const t = tracks[chosen];
      const y = colHeights[chosen] > 0 ? colHeights[chosen] + gutter : 0;
      placed.push({ ...c, x: t.x, y, w: t.w, h: c.h, col: chosen });
      colHeights[chosen] = y + c.h;
    });
  }

  const maxColH = Math.max(1, ...colHeights);
  const nonEmptyCols = colHeights.filter((h) => h > 0);
  const minColH = nonEmptyCols.length ? Math.min(...nonEmptyCols) : 0;
  const tailDiffPx = Math.max(0, Math.round(maxColH - minColH));
  const tailSpreadPct = Math.round((tailDiffPx / maxColH) * 100);

  // 面积核算：真实卡片面积 vs 行内空洞面积
  const cardsArea = placed.reduce((s, p) => s + p.w * p.h, 0);
  const voidsArea = voids.reduce((s, v) => s + v.w * v.h, 0);
  const voidPct = Math.round((voidsArea / Math.max(1, cardsArea + voidsArea)) * 100);

  // 卡片高度错落度（最大/最小高度比 & 标准差）
  const hs = placed.map((p) => p.h);
  const minCardH = Math.min(...hs);
  const maxCardH = Math.max(...hs);
  const heightSpanRatio = +(maxCardH / Math.max(1, minCardH)).toFixed(2);
  const meanH = hs.reduce((a, b) => a + b, 0) / hs.length;
  const stdH = Math.sqrt(hs.reduce((s, h) => s + (h - meanH) ** 2, 0) / hs.length);
  const heightCvPct = Math.round((stdH / Math.max(1, meanH)) * 100);

  // 横向阅读顺读跳序检测：比较相邻 DOM 卡片 (i, i+1) 在视觉上的位置跳跃
  // 1) 若后续卡反而比前一张卡高出 38px 以上（常见于多栏竖排跳回顶行），记为一次强烈跳读
  // 2) 若在同一水平带（Y 差 < 26px）内，后续卡却落在前一张卡左边（纯最短列常因 4px 差导致右→左回跳），记为一次回跳
  let verticalJumps = 0;
  let horizontalBacktracks = 0;
  for (let i = 0; i < placed.length - 1; i++) {
    const a = placed[i];
    const b = placed[i + 1];
    if (b.y < a.y - 38) verticalJumps++;
    else if (Math.abs(b.y - a.y) < 28 && b.col < a.col) horizontalBacktracks++;
  }

  return {
    wallW: clampedWallW,
    wallH: Math.ceil(maxColH),
    cols,
    gutter,
    tracks,
    placed,
    voids,
    colHeights,
    minColW: Math.round(minColW),
    maxColW: Math.round(maxColW),
    colWidthRatio: +(maxColW / Math.max(1, minColW)).toFixed(2),
    tailDiffPx,
    tailSpreadPct,
    voidPct,
    heightSpanRatio,
    heightCvPct,
    verticalJumps,
    horizontalBacktracks,
    orderBreakCount: verticalJumps * 2 + horizontalBacktracks,
  };
}

// 对比追加前后旧卡片发生了多少次跨列迁移（用于亲测多栏竖排 vs 最短列补位）
export function countRelocations(prevLayout, nextLayout) {
  const prevMap = new Map(prevLayout.placed.map((p) => [p.id, p.col]));
  let moved = 0;
  for (const p of nextLayout.placed) {
    if (prevMap.has(p.id) && prevMap.get(p.id) !== p.col) moved++;
  }
  return moved;
}

// 四维校准判定 + 8 类真实错态诊断（单真源，读数与画面 100% 同步）
export function evaluate(state, stageWidthPx) {
  const layout = computeLayout(state, stageWidthPx);
  const {
    cols,
    gutter,
    voidPct,
    tailSpreadPct,
    heightSpanRatio,
    minColW,
    colWidthRatio,
    verticalJumps,
    horizontalBacktracks,
  } = layout;

  // 四维独立判定（每维都可以因为参数过低或过高而玩错）
  const flowOk =
    (state.algorithm === "shortest" || state.algorithm === "grid-lanes") &&
    voidPct === 0 &&
    verticalJumps === 0;

  const minReadableCol = stageWidthPx < 430 ? 96 : 112;
  const colsOk =
    state.colWidthMode === "equal" &&
    cols >= 2 &&
    minColW >= minReadableCol;

  const gutterOk = gutter >= 10 && gutter <= 26;

  // 高度节奏：既不能全等高（跨比 < 1.25），也不能极端超长拖尾（单卡超长比 > 2.75 或列底落差 > 44%）
  const rhythmTooFlat = heightSpanRatio < 1.25;
  const rhythmTooWild = heightSpanRatio > 2.75 || (cols >= 2 && tailSpreadPct > 44);
  const rhythmOk = !rhythmTooFlat && !rhythmTooWild;

  const checks = { flow: flowOk, cols: colsOk, gutter: gutterOk, rhythm: rhythmOk };
  const score = Object.values(checks).filter(Boolean).length;

  // 实时生成与当前状态精确对应的 CSS 片段
  const liveCss = buildLiveCss(state, layout);

  // 按视觉伤害优先级输出白话诊断（讲清「错在哪」「为什么」「怎么试」）
  let diag;
  if (state.algorithm === "row-grid") {
    diag = {
      severity: "error",
      code: "ROW_VOID",
      tag: `错态 · 行内空洞 (${score}/4)`,
      title: voidPct > 0
        ? `普通网格按行锁死，矮卡下方白白浪费了 ${voidPct}% 空间`
        : "普通网格按行锁死，目前靠全等高掩盖了行坑",
      why: voidPct > 0
        ? "二维网格要求同一行所有格子共享行高，只要有一张高卡把行撑开，同排矮卡下面就会出现朱红斜纹标出的大块空白行坑。"
        : "你把卡片强行拉成一样高，所以行坑暂时藏起来了；一旦内容高矮不一，普通网格立刻会拉出断层空洞。",
      action: "把「① 排布算法」切到「最短列补位」或「容差补位 grid-lanes」，看下方卡片立刻向上填平空隙。",
    };
  } else if (state.algorithm === "columns") {
    diag = {
      severity: "error",
      code: "COLUMN_JUMP",
      tag: `错态 · 竖填断序 (${score}/4)`,
      title: state.lastRelocated > 0
        ? `CSS 多栏竖排追加新卡后，${state.lastRelocated} 张旧卡当场跨列乱跳`
        : `CSS 多栏先把第 1 列填满到底，引发 ${verticalJumps} 次视线跳顶`,
      why: "用 column-count 伪装瀑布流虽然省事，但它本是报纸分栏：编号 1→2→3 沿第一列一路往下，读完列底才折返第二列顶，用户横扫时顺序全乱，触底加载新卡还会把已读卡片整页挤移。",
      action: "切到「最短列补位」或「容差补位 grid-lanes」，再点「＋追加新卡」对比旧卡是否纹丝不动。",
    };
  } else if (state.colWidthMode === "uneven") {
    diag = {
      severity: "error",
      code: "UNEVEN_COLS",
      tag: `错态 · 列宽失衡 (${score}/4)`,
      title: `最宽列是最窄列的 ${colWidthRatio} 倍，垂直节奏散架`,
      why: "瀑布流既然放开了竖向高度的自由，就必须用「所有列宽一致」守住纵向锚线。现在最窄列只有 " + minColW + "px，卡片内容被挤扁，宽列又松垮抢戏。",
      action: "把「② 列宽纪律」切回「等宽列轨」，建立稳定的垂直骨架。",
    };
  } else if (cols < 2) {
    diag = {
      severity: "warn",
      code: "SINGLE_COL",
      tag: `退化 · 单列流 (${score}/4)`,
      title: `当前容器宽 ${layout.wallW}px 只排下 1 列，已退化为普通垂直流`,
      why: "只有一列时不存在「选最短列补位」，瀑布流会自动退化为普通文档流。极窄手机屏这样处理很合理，但要体验多列错落至少需要 2 列。",
      action: "向右拖动画布边界拉宽容器（或把列数切到 2–3 列），重新展开多列瀑布流。",
    };
  } else if (minColW < minReadableCol) {
    diag = {
      severity: "error",
      code: "CRAMPED_COLS",
      tag: `错态 · 窄列挤扁 (${score}/4)`,
      title: `${layout.wallW}px 里硬塞 ${cols} 列，单列只剩 ${minColW}px`,
      why: "列数不是越多越好。单列窄于体验可读下限（约 " + minReadableCol + "px）时，图文折行破碎、缩略图缩成邮票，信息密度反而变成视觉噪音。",
      action: "向右拉宽画布，或把列数切回「自动响应」/ 减少列数，让每列重新喘口气。",
    };
  } else if (gutter < 10) {
    diag = {
      severity: "error",
      code: "ZERO_GUTTER",
      tag: `错态 · ${gutter === 0 ? "零缝粘连" : "间距过紧"} (${score}/4)`,
      title: gutter === 0
        ? "卡片间距 0px，彩色块硬贴成一整团色砖"
        : `卡片间距仅 ${gutter}px，相邻边界视觉串色`,
      why: "高低错落的边缘本来就不对齐横线，若没有统一的列缝与行缝（经验带 12–24px）充当缓冲带，人眼分不清哪块属于哪张卡。",
      action: "把「③ 卡片间距」调到 12–24px 经验舒适带，让暖米纸底作为呼吸缝露出来。",
    };
  } else if (gutter > 26) {
    diag = {
      severity: "error",
      code: "WIDE_GUTTER",
      tag: `错态 · 缝宽撕裂 (${score}/4)`,
      title: `卡片间距拉到 ${gutter}px，列与列被大沟割裂`,
      why: "过宽的间距不仅白白吃掉宝贵的展示面积，还会把整面瀑布墙切碎成几根彼此孤立的细柱，破坏「节省空间」的初衷。",
      action: "把「③ 卡片间距」收回到 12–24px 经验舒适带。",
    };
  } else if (rhythmTooFlat) {
    diag = {
      severity: "error",
      code: "FLAT_UNIFORM",
      tag: `错态 · 平齐豆腐块 (${score}/4)`,
      title: `高度跨比仅 ${heightSpanRatio}×，整墙齐平根本用不上瀑布流`,
      why: "瀑布流的价值来自内容高度的自然落差。如果所有卡片高度几乎一样，每行底边齐刷刷对齐，直接用规整的二维 CSS Grid 反而更清晰，不必承担瀑布流跳序的代价。",
      action: "把「④ 高度节奏」切回「自然错落」，或直接点击画布里的几张卡片拉出高低变化。",
    };
  } else if (rhythmTooWild) {
    diag = {
      severity: "error",
      code: "WILD_TAIL",
      tag: `错态 · 长卡拖尾 (${score}/4)`,
      title: `极端长卡把高度跨比扯到 ${heightSpanRatio}×，列底落差达 ${tailSpreadPct}%`,
      why: "单张卡片过长（经验上不宜超过 2.5× 矮卡或 2:5 极细长条）会把某一列拖出一条孤零零的长尾巴，底部形成巨大悬空缺口，节奏从「错落」跌成「失衡」。",
      action: "把「④ 高度节奏」切回「自然错落」，或直接点画布里那张超长黄卡把它调回适中高度。",
    };
  } else {
    const isLanes = state.algorithm === "grid-lanes";
    diag = {
      severity: "ok",
      code: isLanes ? "OK_LANES" : "OK_SHORTEST",
      tag: isLanes ? "达标 · grid-lanes 容差解 (4/4)" : "达标 · 最短列经典解 (4/4)",
      title: isLanes
        ? `${cols} 列等宽容差补位：零行坑，顺读回跳压至 ${horizontalBacktracks} 次`
        : `${cols} 列等宽最短列补位：零行坑，列底落差仅 ${tailSpreadPct}%`,
      why: isLanes
        ? `单列宽 ${minColW}px、统一间距 ${gutter}px、高度跨比 ${heightSpanRatio}×；28px 容差让近乎等高的列优先从左往右落位，兼顾紧致排版与可预期的阅读顺序。`
        : `单列宽 ${minColW}px、统一间距 ${gutter}px、高度跨比 ${heightSpanRatio}×；每张新卡自动落入当前最浅列，把原本浪费的行内空洞全部转化为有效内容。`,
      action: "现在可以左右横拖画布测响应式折列、点任意卡片改高看自动补位，或点「＋追加新卡」体验无限滚动。",
    };
  }

  // 原海报三彩圆的实时状态标签
  const triad = {
    stagger: {
      ok: rhythmOk,
      badge: rhythmTooFlat
        ? `齐平 ${heightSpanRatio}×`
        : heightSpanRatio > 2.75
          ? `长卡 ${heightSpanRatio}×`
          : rhythmTooWild
            ? `拖尾 ${tailSpreadPct}%`
            : `错落 ${heightSpanRatio}×`,
    },
    flow: {
      ok: flowOk,
      badge: state.algorithm === "row-grid"
        ? `行坑 ${voidPct}%`
        : state.algorithm === "columns"
          ? `竖填跳 ${verticalJumps} 次`
          : state.algorithm === "grid-lanes"
            ? "容差 0 空洞"
            : "最短列 0 空洞",
    },
    gap: {
      ok: gutterOk && colsOk,
      badge: !colsOk
        ? (state.colWidthMode === "uneven" ? "列宽不等" : `窄列 ${minColW}px`)
        : gutter < 10
          ? `${gutter}px 粘连`
          : gutter > 26
            ? `${gutter}px 撕裂`
            : `${gutter}px · ${cols}列`,
    },
  };

  return { layout, checks, score, diag, triad, liveCss };
}

function buildLiveCss(state, layout) {
  const { cols, gutter } = layout;
  const colExpr =
    state.colWidthMode === "equal"
      ? `repeat(${cols}, 1fr)`
      : cols === 3
        ? "52fr 21fr 27fr /* [!] 列宽不等 */"
        : cols === 2
          ? "68fr 32fr /* [!] 列宽不等 */"
          : "40fr 16fr 28fr 16fr /* [!] 不等宽 */";

  const gapComment = gutter < 10 ? " /* [!] 粘连过紧 */" : gutter > 26 ? " /* [!] 间隙过宽撕裂 */" : "";

  if (state.algorithm === "row-grid") {
    return `.wall {\n  display: grid; /* [!] 等行锁死，矮卡留坑 */\n  grid-template-columns: ${colExpr};\n  gap: ${gutter}px;${gapComment}\n}`;
  }
  if (state.algorithm === "columns") {
    return `.wall {\n  column-count: ${cols}; /* [!] 竖向填满，序乱且追加跳列 */\n  column-gap: ${gutter}px;${gapComment}\n}\n.card { break-inside: avoid; }`;
  }
  if (state.algorithm === "grid-lanes") {
    return `.wall {\n  display: grid-lanes; /* CSS Grid Level 3 原生 */\n  grid-template-columns: ${colExpr};\n  gap: ${gutter}px;${gapComment}\n  flow-tolerance: 28px; /* 兼顾紧致与顺读 */\n}`;
  }
  return `.wall {\n  display: grid-lanes; /* 或 JS 最短列计算 */\n  grid-template-columns: ${colExpr};\n  gap: ${gutter}px;${gapComment}\n  flow-tolerance: 0; /* 严格落入最浅列 */\n}`;
}

// ---------- 第 01 节：单步放砖模拟器数据与算法 ----------
export const STEP_BRICKS = [
  { id: 1, title: "图集封面", h: 112, theme: "red" },
  { id: 2, title: "建筑长图", h: 162, theme: "yellow" },
  { id: 3, title: "配色笔记", h: 78, theme: "teal" },
  { id: 4, title: "手绘草图", h: 96, theme: "beige" },
  { id: 5, title: "胶片竖拍", h: 138, theme: "black" },
  { id: 6, title: "展览海报", h: 86, theme: "red" },
  { id: 7, title: "书页摘录", h: 120, theme: "teal" },
  { id: 8, title: "陶艺静物", h: 74, theme: "yellow" },
  { id: 9, title: "字型标本", h: 108, theme: "beige" },
  { id: 10, title: "空间细部", h: 92, theme: "red" },
];

export function simulateStepPacking(count, tolerancePx = 0) {
  const cols = 3;
  const gap = 12;
  const colH = [0, 0, 0];
  const steps = [];
  const placed = [];
  const n = Math.max(0, Math.min(STEP_BRICKS.length, count));

  for (let i = 0; i < n; i++) {
    const brick = STEP_BRICKS[i];
    const before = [...colH];
    const minY = Math.min(...colH);
    const strictCol = colH.indexOf(minY);
    let chosen = strictCol;
    for (let c = 0; c < cols; c++) {
      if (colH[c] <= minY + tolerancePx) {
        chosen = c;
        break;
      }
    }
    const y = colH[chosen] > 0 ? colH[chosen] + gap : 0;
    const item = { ...brick, col: chosen, y, strictCol, toleranceSaved: chosen !== strictCol, before };
    placed.push(item);
    colH[chosen] = y + brick.h;
    steps.push({ ...item, after: [...colH], minY });
  }
  return { placed, colH, last: steps[steps.length - 1] || null, nextBrick: STEP_BRICKS[n] || null };
}

// ---------- 第 02 节：三条实现路线压测数据 ----------
export const IMPL_ITEMS = [
  { id: 1, label: "#1", h: 68, theme: "red" },
  { id: 2, label: "#2", h: 104, theme: "yellow" },
  { id: 3, label: "#3", h: 56, theme: "teal" },
  { id: 4, label: "#4", h: 86, theme: "beige" },
  { id: 5, label: "#5", h: 62, theme: "black" },
  { id: 6, label: "#6", h: 94, theme: "red" },
  { id: 7, label: "#7", h: 72, theme: "teal" },
  { id: 8, label: "#8", h: 58, theme: "yellow" },
  { id: 9, label: "#9", h: 88, theme: "beige" },
  { id: 10, label: "#10", h: 64, theme: "black" },
  { id: 11, label: "#11", h: 96, theme: "red" },
  { id: 12, label: "#12", h: 70, theme: "teal" },
];

export function computeImplTrack(kind, totalCount) {
  const items = IMPL_ITEMS.slice(0, totalCount);
  const cols = 3;
  const gap = 8;
  const colH = [0, 0, 0];
  const out = [];

  if (kind === "columns") {
    const totalH = items.reduce((s, it) => s + it.h + gap, 0);
    const target = totalH / cols;
    let ci = 0;
    let y = 0;
    items.forEach((it, idx) => {
      if (ci < cols - 1 && y > 0 && (y + it.h * 0.5 > target || items.length - idx <= cols - 1 - ci)) {
        ci++;
        y = 0;
      }
      out.push({ ...it, col: ci, y });
      y += it.h + gap;
      colH[ci] = y - gap;
    });
  } else {
    const tol = kind === "grid-lanes" ? 20 : 0;
    items.forEach((it) => {
      const minY = Math.min(...colH);
      let ci = 0;
      for (let c = 0; c < cols; c++) {
        if (colH[c] <= minY + tol) {
          ci = c;
          break;
        }
      }
      const y = colH[ci] > 0 ? colH[ci] + gap : 0;
      out.push({ ...it, col: ci, y });
      colH[ci] = y + it.h;
    });
  }
  return { items: out, colH, maxH: Math.max(...colH, 1) };
}

// ---------- 第 05 节：场景分诊台数据 ----------
export const SCENARIOS = [
  {
    id: "inspiration",
    label: "灵感图库 / 情绪板",
    verdict: "use",
    badge: "天然主场",
    headline: "原图高矮天生不同，用户来「偶遇」而不是「查表」",
    detail: "摄影、插画、UI 灵感收集时，竖构图海报与横构图剧照混排，瀑布流能完整保留每张图的原始画幅，同时比等行网格多塞下约 25%–35%（经验参考）的可视卡片。",
    alt: "建议补一条底线：每张图片在 HTML 中提前写好 width/height 或 aspect-ratio，防加载时整墙跳动。",
  },
  {
    id: "portfolio",
    label: "摄影与设计作品集",
    verdict: "use",
    badge: "适合使用",
    headline: "不强行裁切构图，作品高低节奏本身就是展墙语言",
    detail: "设计师和摄影师最怕作品被硬裁成 1:1 正方形。瀑布流允许竖版海报、长卷截帧与方图自然共处，用统一的列宽与留白缝收拢成稳重展陈。",
    alt: "若作品有严格时间轴或项目编号顺序，改用齐行 227 网格布局更清晰。",
    link: { id: "227", name: "227 网格布局" },
  },
  {
    id: "social-feed",
    label: "图文社区发现流",
    verdict: "use",
    badge: "适合使用",
    headline: "双列移动端高密探索，配无限滚动连续消费",
    detail: "手机双列卡片流里，封面比例和标题行数（1–2 行）各不相同，最短列补位让首屏同时露出 3–4 条完整或半露出内容，降低空白断层感。",
    alt: "别忘给列表上方筛选栏配 235 粘性定位布局，并控制极端长图最大高宽比（经验上限约 4:5 或 3:4）。",
    link: { id: "235", name: "235 粘性定位布局" },
  },
  {
    id: "price-compare",
    label: "参数比价 / 机票商品对比",
    verdict: "avoid",
    badge: "不要用",
    headline: "价格和规格不在同一条水平线上，人眼无法横向扫读",
    detail: "用户买电脑或订酒店时，需要水平视线扫过「A 多少钱、B 多少钱、C 多少钱」。瀑布流让每个价格标签高低乱跳，逼着用户每看一项都重新找坐标。",
    alt: "换用齐行 227 网格布局 或 230 表格布局，把价格与关键参数死死对齐在同一水平基线。",
    link: { id: "230", name: "230 表格布局" },
  },
  {
    id: "timeline-news",
    label: "强时间序新闻 / 公告日志",
    verdict: "avoid",
    badge: "不要用",
    headline: "第 4 条卡片可能跑得比第 3 条还靠上，打破先后承诺",
    detail: "最短列算法眼里只有高度，没有时间。如果左列塞了张高图，右侧发得更晚的消息反而会顶到上方，读者分不清哪条才是最新突发。",
    alt: "强时序内容应回到 222 普通流布局（单列时间线）或严格按行推进的 227 网格布局。",
    link: { id: "222", name: "222 普通流布局" },
  },
  {
    id: "dashboard-form",
    label: "表单 / 后台配置面板",
    verdict: "avoid",
    badge: "不要用",
    headline: "输入框跳列补位会让 Tab 键焦点和填写路径彻底迷路",
    detail: "表单与后台任务讲求「确定性」和「键盘可达性」。一展开折叠项或报错提示，下方区块高度一变就会触发瀑布流跨列重排，直接打断操作记忆。",
    alt: "改用 227 网格布局 或 226 弹性盒布局，配合 242 容器查询布局 做稳健模块化排布。",
    link: { id: "226", name: "226 弹性盒布局" },
  },
];

// ---------- 第 06 节：四选一单一变量练习 ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    mode: "row-grid",
    correct: false,
    verdict: "不对：同行按最高图锁死行高，浪费了大量垂直空间。",
    explain: "四套方案列宽、缝宽、图片原比例都一样。方案 A 按普通二维网格齐行排布，一旦某列出现一张 3:4 竖图，同排横图下方就会拉出一大片惨白行坑，移动端一屏能露出的有效作品锐减。",
  },
  {
    id: "B",
    label: "方案 B",
    mode: "columns",
    correct: false,
    verdict: "不对：多栏竖排会让编号纵向跑到底，且触底加载时整墙跳列。",
    explain: "方案 B 用 CSS 多栏（column-count）先从上到下填满第 1 列再换第 2 列：读者横扫顶行看到的竟然是 #1、#4、#7；更致命的是触底追加新图时，浏览器重新平衡各列总高，眼前正在看的作品会突然跳去邻列。",
  },
  {
    id: "C",
    label: "方案 C",
    mode: "grid-lanes",
    correct: true,
    verdict: "选对了：最短列补位 + 合理容差，零行坑且触底加载稳接墙脚。",
    explain: "方案 C 保持列宽与间距统一，每张作品完整保留原始画幅并落入当前最浅列（高差极小时优先靠左），既消除了普通网格的行内空洞，又让 #1→#2→#3 横向推进；触底加载新一批图片时只往底部追加，绝不打扰上方已读区。",
  },
  {
    id: "D",
    label: "方案 D",
    mode: "cropped",
    correct: false,
    verdict: "不对：强行裁成等高虽然齐平，却腰斩了摄影与插画的原始构图。",
    explain: "题目核心条件是「摄影与插画社区、原图从竖图到横图不等」。方案 D 把所有卡片硬切成长宽比一致的格子，看似整齐，代价是竖版海报头尾被剪、长图细节丢失，违背了展示视觉作品的初衷。",
  },
];
