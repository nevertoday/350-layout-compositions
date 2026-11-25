// 158 环绕图版式 · 单真源几何绕排与诊断模型
// 所有画面绘制、文字逐行折算、绕距标尺、错态热区与读数全部来自同一套扫描线计算。

export const LOGICAL_W = 1080;
export const LOGICAL_H = 395;
export const PAGE_PAD_X = 34;
export const PAGE_PAD_Y = 20;
export const COL_GUTTER = 28;

// 经验参考阈值（界面中均标注「经验值」）
export const MARGIN_MIN = 10;
export const MARGIN_MAX = 32;
export const SCALE_MIN_PCT = 18;
export const SCALE_MAX_PCT = 44;
export const MIN_SAFE_CHARS = 7;

export const INITIAL_STATE = {
  theme: "poster",
  colMode: "one-col",
  wrapMode: "rect",
  marginPx: 2,
  u: 0.56,
  v: 0.5,
  scale: 0.52,
  showGuides: true,
};

export const PRESETS = {
  broken: { ...INITIAL_STATE },
  saddle: {
    theme: "poster",
    colMode: "two-col",
    wrapMode: "contour",
    marginPx: 18,
    u: 0.5,
    v: 0.5,
    scale: 0.36,
    showGuides: true,
  },
  rightEdge: {
    theme: "poster",
    colMode: "one-col",
    wrapMode: "contour",
    marginPx: 18,
    u: 0.91,
    v: 0.5,
    scale: 0.35,
    showGuides: true,
  },
  poster6: {
    theme: "poster",
    colMode: "poster-6",
    wrapMode: "contour",
    marginPx: 18,
    u: 0.5,
    v: 0.5,
    scale: 0.37,
    showGuides: true,
  },
};

// 158 原海报完整文字（来源：site/src/data/poster-text.json "158"）
export const POSTER_POINTS = [
  {
    id: "focal",
    side: "left",
    slot: 0,
    color: "plum",
    title: "焦点图像",
    en: "FOCAL IMAGE",
    body: "选择最具代表性的图像或形状作为视觉核心，吸引注意力，确立主题。",
    anatomy: "主体占据清晰轮廓与高对比色块，先锚住目光，再把视线交接给周围段落。",
  },
  {
    id: "wrap",
    side: "left",
    slot: 1,
    color: "teal",
    title: "环绕布局",
    en: "WRAP",
    body: "文字沿着图像的轮廓或空白自然分布，避免切割视觉焦点。",
    anatomy: "文字边缘顺着外包轮廓弯曲，既不侵占图像本体，也不留下生硬直角断层。",
  },
  {
    id: "flow",
    side: "left",
    slot: 2,
    color: "plum",
    title: "信息流动",
    en: "FLOW",
    body: "通过环绕引导视线从一处自然流向下一处，提升阅读的顺畅度。",
    anatomy: "同一行不跨图跳读，视线顺着栏序与轮廓弧线平稳滑行，形成有节奏的阅读流。",
  },
  {
    id: "balance",
    side: "right",
    slot: 0,
    color: "teal",
    title: "视觉平衡",
    en: "BALANCE",
    body: "通过图文的重量对比与空间分配，保持画面稳定而富有张力。",
    anatomy: "图像体量占版面约两成到四成半（经验参考），与文字灰面形成稳重的重量呼应。",
  },
  {
    id: "contour",
    side: "right",
    slot: 1,
    color: "plum",
    title: "贴合轮廓",
    en: "CONTOUR",
    body: "尊重图像的外形与节奏，让文字与图像形成和谐的边界关系。",
    anatomy: "用平滑外包多边形代替矩形死框，同时保持 10–30px 经验呼吸距，杜绝贴边咬字。",
  },
  {
    id: "emphasis",
    side: "right",
    slot: 2,
    color: "teal",
    title: "重点强化",
    en: "EMPHASIS",
    body: "环绕布局能够聚焦核心信息，减少干扰，让重点更加突出。",
    anatomy: "主体周围形成向心场，正文像河流绕过礁石一样烘托主角，重点一眼落定。",
  },
];

// 三套题材：各自拥有独立有机轮廓多边形（归一化 [-1, 1]）与真实出版长文
// 严格遵循：绝不画人脸五官细节；人物题材仅用抽象大衣与礼帽剪影。
export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报·山月卵石",
    kicker: "EDITORIAL SPREAD · NO. 158",
    heading: "围而不堵，让文字顺着山月轮廓呼吸",
    // 1:1 对应 158 原海报卵石轮廓：右上圆润挺拔、左侧温和外探、右下轻收
    contour: [
      [0.1, -0.98],
      [0.44, -0.92],
      [0.68, -0.68],
      [0.77, -0.34],
      [0.8, 0.04],
      [0.82, 0.38],
      [0.72, 0.68],
      [0.48, 0.9],
      [0.14, 0.98],
      [-0.24, 0.88],
      [-0.56, 0.68],
      [-0.82, 0.42],
      [-0.93, 0.14],
      [-0.86, -0.14],
      [-0.62, -0.36],
      [-0.4, -0.62],
      [-0.2, -0.86],
    ],
    // 凹坑陷阱版轮廓：左右刻出狭深凹槽，专门演示「凹坑陷字」失误
    concaveContour: [
      [0.1, -0.98],
      [0.44, -0.92],
      [0.68, -0.68],
      [0.77, -0.34],
      [0.32, -0.14],
      [0.24, 0.04],
      [0.78, 0.2],
      [0.74, 0.66],
      [0.48, 0.9],
      [0.14, 0.98],
      [-0.24, 0.88],
      [-0.56, 0.68],
      [-0.84, 0.42],
      [-0.92, 0.16],
      [-0.36, 0.0],
      [-0.34, -0.22],
      [-0.78, -0.38],
      [-0.42, -0.66],
      [-0.2, -0.86],
    ],
    article:
      "在平面与杂志排版里，图像未必总要被关进四四方方的矩形相框。只要主体拥有清晰可辨的外轮廓，文字就可以像溪水绕过鹅卵石一样，顺着弧线自然退让与收束。这种做法的精妙不在炫技，而在建立一种亲密的图文场域：读者先被高对比的核心图形吸住目光，随后沿着柔和的曲线滑进正文第一行，视线不必跨越生硬的直角鸿沟。真正考究的环绕排印，关键全在克制二字。安全呼吸距如果缩到贴边，字脚便会咬住色块，版面立刻显得逼仄焦躁；如果退让得过宽，图像又像孤岛般与文字断联。同样危险的是贪图造型把图扔进单栏正中，让同一句话被硬生生劈成左右两半，眼睛每读一行都要跨图起跳。成熟的做法要么采用双栏跨脊，让左右两栏各自独立贴廓而行；要么把图像稳稳锚在单栏右侧，守住笔直清爽的左侧行首起点。如此围而不堵，聚而有序，图像和字流才算真正相互成就。",
  },
  vase: {
    id: "vase",
    label: "器物志·青瓷梅瓶",
    kicker: "OBJECT MONOGRAPH · CERAMIC",
    heading: "小口丰肩，让字流托起青瓷的曲线",
    // 丰肩收腰的宋瓷梅瓶剪影
    contour: [
      [-0.24, -0.98],
      [0.24, -0.98],
      [0.2, -0.82],
      [0.58, -0.66],
      [0.82, -0.38],
      [0.84, -0.06],
      [0.72, 0.28],
      [0.54, 0.64],
      [0.46, 0.92],
      [0.4, 0.98],
      [-0.4, 0.98],
      [-0.46, 0.92],
      [-0.54, 0.64],
      [-0.72, 0.28],
      [-0.84, -0.06],
      [-0.82, -0.38],
      [-0.58, -0.66],
      [-0.2, -0.82],
    ],
    concaveContour: [
      [-0.24, -0.98],
      [0.24, -0.98],
      [0.2, -0.82],
      [0.64, -0.64],
      [0.84, -0.34],
      [0.22, -0.08],
      [0.22, 0.14],
      [0.72, 0.34],
      [0.54, 0.68],
      [0.42, 0.98],
      [-0.42, 0.98],
      [-0.54, 0.68],
      [-0.72, 0.34],
      [-0.24, 0.14],
      [-0.24, -0.08],
      [-0.84, -0.34],
      [-0.64, -0.64],
      [-0.2, -0.82],
    ],
    article:
      "拍摄一件丰肩窄胫的宋式梅瓶时，最可惜的处理就是把它原封不动塞进矩形白底图框。肩部上方与胫部两侧那两片大三角空隙，会在正文之间刨出突兀的洞，器物修长的轮廓韵律瞬间消散。改用退底贴廓绕排之后，文字顺着小口与短颈轻轻向内靠拢，在丰满的瓶肩处温和让开，再沿修长收窄的器腹重新舒展。读者尚未读完第二段，视线已经在字行的起伏里把器物的弧度抚摸了一遍。器物图鉴尤其讲究边界的清朗：如果放任轮廓检测追踪釉面边缘的细微噪点，正文行尾就会长出锯齿般的毛刺；把绕排多边形简化到十个左右的顺滑折点，既忠实保留梅瓶的肩腹比例，又能让每一行汉字落点从容均匀，版面立刻生出博物馆画册般的静气与分寸。",
  },
  fashion: {
    id: "fashion",
    label: "跨页志·剪影风衣",
    kicker: "EDITORIAL FEATURE · SILHOUETTE",
    heading: "剪刀破框，在留白里走出跨页节奏",
    // 极简抽象宽檐帽与风衣摆剪影（无任何五官，纯粹几何衣廓）
    contour: [
      [-0.08, -0.98],
      [0.24, -0.94],
      [0.52, -0.78],
      [0.22, -0.64],
      [0.44, -0.44],
      [0.62, -0.1],
      [0.78, 0.34],
      [0.9, 0.84],
      [0.72, 0.98],
      [-0.54, 0.98],
      [-0.76, 0.82],
      [-0.66, 0.36],
      [-0.56, -0.08],
      [-0.46, -0.44],
      [-0.28, -0.64],
      [-0.56, -0.76],
      [-0.32, -0.92],
    ],
    concaveContour: [
      [-0.08, -0.98],
      [0.24, -0.94],
      [0.52, -0.78],
      [0.14, -0.58],
      [0.66, -0.34],
      [0.18, -0.06],
      [0.2, 0.16],
      [0.8, 0.42],
      [0.9, 0.86],
      [0.72, 0.98],
      [-0.54, 0.98],
      [-0.76, 0.82],
      [-0.68, 0.4],
      [-0.22, 0.12],
      [-0.24, -0.14],
      [-0.6, -0.38],
      [-0.28, -0.64],
      [-0.56, -0.76],
      [-0.32, -0.92],
    ],
    article:
      "二十世纪中叶的时尚杂志之所以让人过目难忘，很大程度上归功于艺术总监敢于拿起剪刀，剪掉照片里多余的灰墙与杂景，只留下大衣下摆与帽檐划出的一道利落斜势。当这段斜势进入跨页，正文不再死守垂直栏线，而是像被衣摆卷起的风一样，顺着下摆的倾角斜向展开。斜线与字流之间留出稳定的空白通道，既让画面产生电影镜头般的动感，又不至于把字母挤成杂乱的碎屑。人物与服饰退底绕排有一条铁律：留白必须把主体托出来，而不是把文字赶进角落的窄缝。只要确保绕开衣摆后的每一行仍保有充裕字数，跨页便既有大刀阔斧的戏剧张力，又有长文耐读的沉稳底气。",
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function polygonArea(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) * 0.5;
}

export function polygonBounds(pts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

// 将归一化轮廓变换到画布逻辑坐标，并按顶点外法线平滑外扩 offsetPx（支持负值）
export function buildContourPolygon(normPts, cx, cy, rx, ry, offsetPx = 0) {
  const scaled = normPts.map(([x, y]) => [cx + x * rx, cy + y * ry]);
  if (Math.abs(offsetPx) < 0.01) return scaled;
  // 计算顶点外法线（顺时针多边形在屏幕坐标系下 y 向下，外法线为 (dy, -dx) 归一）
  // 先校验方向确保外扩朝外
  let signed = 0;
  const n = scaled.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = scaled[i];
    const [x2, y2] = scaled[(i + 1) % n];
    signed += (x2 - x1) * (y2 + y1);
  }
  const dir = signed < 0 ? 1 : -1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const pPrev = scaled[(i - 1 + n) % n];
    const pCurr = scaled[i];
    const pNext = scaled[(i + 1) % n];
    const e1x = pCurr[0] - pPrev[0], e1y = pCurr[1] - pPrev[1];
    const e2x = pNext[0] - pCurr[0], e2y = pNext[1] - pCurr[1];
    const l1 = Math.hypot(e1x, e1y) || 1;
    const l2 = Math.hypot(e2x, e2y) || 1;
    const n1x = (e1y / l1) * dir, n1y = (-e1x / l1) * dir;
    const n2x = (e2y / l2) * dir, n2y = (-e2x / l2) * dir;
    let nx = n1x + n2x;
    let ny = n1y + n2y;
    const nl = Math.hypot(nx, ny);
    if (nl < 0.05) {
      nx = n1x;
      ny = n1y;
    } else {
      nx /= nl;
      ny /= nl;
    }
    // 限制尖角斜接长度，避免凹角自交爆炸
    const dot = Math.max(0.45, nx * n1x + ny * n1y);
    const miter = Math.min(1.45, 1 / dot);
    out.push([pCurr[0] + nx * offsetPx * miter, pCurr[1] + ny * offsetPx * miter]);
  }
  return out;
}

// 水平扫描线与多边形求交，返回排序后的实心区间数组 [[x0, x1], ...]
export function scanlineIntervals(poly, y) {
  const xs = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % n];
    if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
      const t = (y - y1) / (y2 - y1);
      xs.push(x1 + t * (x2 - x1));
    }
  }
  xs.sort((a, b) => a - b);
  const segs = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    segs.push([xs[i], xs[i + 1]]);
  }
  return segs;
}

// 合并区间数组
function unionIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const res = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = res[res.length - 1];
    if (cur[0] <= last[1] + 0.5) last[1] = Math.max(last[1], cur[1]);
    else res.push([cur[0], cur[1]]);
  }
  return res;
}

// 在给定行高带 [yTop, yBot] 上计算绕排障碍区间
function bandExclusions(wrapPoly, wrapMode, rectBounds, yTop, yBot) {
  if (wrapMode === "rect") {
    if (yBot < rectBounds.minY || yTop > rectBounds.maxY) return [];
    return [[rectBounds.minX, rectBounds.maxX]];
  }
  const ys = [yTop + 2, (yTop + yBot) * 0.5, yBot - 2];
  const all = [];
  for (const y of ys) {
    const segs = scanlineIntervals(wrapPoly, y);
    for (const s of segs) all.push(s);
  }
  return unionIntervals(all);
}

// 从栏区间 [colL, colR] 中减去若干障碍区间，得到可用排字区间
function subtractIntervals(colL, colR, blocks) {
  let avail = [[colL, colR]];
  for (const [bL, bR] of blocks) {
    const next = [];
    for (const [aL, aR] of avail) {
      if (bR <= aL || bL >= aR) {
        next.push([aL, aR]);
      } else {
        if (bL > aL) next.push([aL, bL]);
        if (bR < aR) next.push([bR, aR]);
      }
    }
    avail = next;
  }
  return avail;
}

// 单真源核心排版与诊断函数（支持桌面宽幅 / 手机竖屏 / 横屏自适应逻辑尺寸，绝不拉伸变形）
export function evaluateLayout(rawState, dims = null) {
  const state = {
    theme: THEMES[rawState.theme] ? rawState.theme : "poster",
    colMode: ["one-col", "two-col", "poster-6"].includes(rawState.colMode) ? rawState.colMode : "one-col",
    wrapMode: ["rect", "contour", "concave"].includes(rawState.wrapMode) ? rawState.wrapMode : "contour",
    marginPx: clamp(Math.round(rawState.marginPx ?? 18), 0, 42),
    u: clamp(rawState.u ?? 0.5, 0.08, 0.92),
    v: clamp(rawState.v ?? 0.5, 0.34, 0.66),
    scale: clamp(rawState.scale ?? 0.36, 0.16, 0.58),
    showGuides: rawState.showGuides !== false,
  };

  const viewW = dims?.w || LOGICAL_W;
  const viewH = dims?.h || LOGICAL_H;
  const isCompact = viewW < 680;
  const padX = isCompact ? 18 : PAGE_PAD_X;
  const padY = isCompact ? 18 : PAGE_PAD_Y;
  const gutter = isCompact ? 16 : COL_GUTTER;

  const themeObj = THEMES[state.theme];
  const normPts = state.wrapMode === "concave" ? themeObj.concaveContour : themeObj.contour;

  const spreadX = padX;
  const spreadY = padY;
  const spreadW = viewW - padX * 2;
  const spreadH = viewH - padY * 2;

  // 正文区纵轴边界（确保图形与绕排外框绝不遮压顶部文章标题）
  const textAreaTop = spreadY + (state.colMode === "poster-6" ? 12 : isCompact ? 48 : 48);
  const textAreaBot = spreadY + spreadH - 10;
  const textH = textAreaBot - textAreaTop;

  // 图形几何半径：严格等比（rx = 0.85 * ry），并与版面有效方页高度平滑线性映射
  const maxRy = Math.min(textH * 0.47, spreadW * (isCompact ? 0.285 : 0.215));
  const normScale = clamp((state.scale - 0.16) / (0.58 - 0.16), 0, 1);
  const ry = maxRy * (0.44 + normScale * 0.56);
  const rx = ry * 0.85;
  const cx = clamp(
    spreadX + state.u * spreadW,
    spreadX + rx * 0.88 + 2,
    spreadX + spreadW - rx * 0.88 - 2
  );
  const cy = clamp(
    textAreaTop + state.v * textH,
    textAreaTop + ry + 4,
    textAreaBot - ry - 4
  );

  // 逻辑绕距在窄幅时按版面宽略微等比折算（读数保持标称 px 单真源）
  const marginScale = isCompact ? 0.68 : 1;
  const drawMargin = state.marginPx * marginScale;

  const shapePoly = buildContourPolygon(normPts, cx, cy, rx, ry, 0);
  const wrapPoly = buildContourPolygon(normPts, cx, cy, rx, ry, drawMargin);
  const shapeBounds = polygonBounds(shapePoly);
  const wrapBounds = polygonBounds(wrapPoly);
  const rectBounds = {
    minX: shapeBounds.minX - drawMargin,
    maxX: shapeBounds.maxX + drawMargin,
    minY: shapeBounds.minY - drawMargin,
    maxY: shapeBounds.maxY + drawMargin,
    w: shapeBounds.w + drawMargin * 2,
    h: shapeBounds.h + drawMargin * 2,
  };

  const realPolyArea = polygonArea(shapePoly);
  const bboxArea = shapeBounds.w * shapeBounds.h;
  // 以有效单页阅读方区为分母，保持跨宽屏/竖屏一致的实绘面积占比
  const refSinglePageArea = (maxRy * 2) * (maxRy * 2 * 0.88);
  const imageAreaPct = Math.round((realPolyArea / refSinglePageArea) * 100);
  const voidWastePct = state.wrapMode === "rect" ? Math.round(((bboxArea - realPolyArea) / bboxArea) * 100) : 0;

  // 逐行排版引擎
  const lineH = isCompact ? 22 : 21.8;
  const charW = isCompact ? 13.4 : 14.0;
  const text = themeObj.article;

  const lines = [];
  const sliverBoxes = [];
  const splitBridges = [];
  const pocketTraps = [];
  let minLineChars = Infinity;
  let wrappedLineCount = 0;
  let leftStartXs = [];
  let leftMass = 0;
  let rightMass = 0;
  let posterCards = [];

  if (state.colMode === "poster-6") {
    const slotYs = [0.21, 0.52, 0.83];
    const cardH = isCompact ? 92 : 84;
    const minCardW = isCompact ? 82 : 112;
    const maxCardW = isCompact ? 168 : 264;
    for (const pt of POSTER_POINTS) {
      const yCenter = spreadY + 22 + slotYs[pt.slot] * (spreadH - 44);
      const yTop = yCenter - cardH * 0.5;
      const yBot = yCenter + cardH * 0.5;
      const blocks = bandExclusions(wrapPoly, state.wrapMode, rectBounds, yTop + 8, yBot - 8);
      let blockL = cx - rx - drawMargin;
      let blockR = cx + rx + drawMargin;
      if (blocks.length) {
        blockL = Math.min(...blocks.map((b) => b[0]));
        blockR = Math.max(...blocks.map((b) => b[1]));
      }
      let x, w, availW, crushed = false;
      if (pt.side === "left") {
        availW = blockL - spreadX;
        w = clamp(availW - 6, 56, maxCardW);
        x = Math.max(spreadX, blockL - w);
        if (availW < minCardW) crushed = true;
      } else {
        availW = spreadX + spreadW - blockR;
        w = clamp(availW - 6, 56, maxCardW);
        x = Math.min(spreadX + spreadW - w, blockR);
        if (availW < minCardW) crushed = true;
      }
      const cStep = isCompact ? 11.4 : 12.6;
      const charsPerLine = Math.max(3, Math.floor((w - 14) / cStep));
      if (charsPerLine < minLineChars) minLineChars = charsPerLine;
      wrappedLineCount++;
      if (pt.side === "left") leftMass += w * cardH;
      else rightMass += w * cardH;

      const bodyLines = [];
      let idx = 0;
      while (idx < pt.body.length && bodyLines.length < 3) {
        bodyLines.push(pt.body.slice(idx, idx + charsPerLine));
        idx += charsPerLine;
      }
      const truncated = idx < pt.body.length;
      if (crushed || charsPerLine < MIN_SAFE_CHARS) {
        sliverBoxes.push({ x, y: yTop, w, h: cardH, chars: charsPerLine });
      }
      posterCards.push({
        ...pt,
        x,
        y: yTop,
        w,
        h: cardH,
        charsPerLine,
        bodyLines,
        crushed: crushed || charsPerLine < MIN_SAFE_CHARS,
        truncated,
      });
    }
    if (state.wrapMode === "concave") {
      pocketTraps.push({ x: cx - rx * 0.45, y: cy - 12, w: 36, h: 24, chars: 2 });
    }
  } else {
    const cols =
      state.colMode === "one-col"
        ? [{ id: 0, l: spreadX, r: spreadX + spreadW }]
        : [
            { id: 0, l: spreadX, r: spreadX + (spreadW - gutter) * 0.5 },
            { id: 1, l: spreadX + (spreadW + gutter) * 0.5, r: spreadX + spreadW },
          ];

    let cursor = 0;
    const totalRows = Math.floor((textAreaBot - textAreaTop) / lineH);

    for (const col of cols) {
      const anchoredRight =
        state.colMode === "one-col" && shapeBounds.maxX + drawMargin >= col.r - 26;
      const anchoredLeft =
        state.colMode === "one-col" && shapeBounds.minX - drawMargin <= col.l + 26;

      for (let r = 0; r < totalRows; r++) {
        const yTop = textAreaTop + r * lineH;
        const yBot = yTop + lineH - 4;
        let blocks = bandExclusions(wrapPoly, state.wrapMode, rectBounds, yTop, yBot);
        if (blocks.length) {
          if (anchoredRight) blocks = blocks.map(([bL, bR]) => [bL, Math.max(bR, col.r + 1)]);
          else if (anchoredLeft) blocks = blocks.map(([bL, bR]) => [Math.min(bL, col.l - 1), bR]);
        }
        const avail = subtractIntervals(col.l, col.r, blocks);
        const usable = avail.filter(([aL, aR]) => aR - aL >= charW * 1.4);

        const isWrapped = blocks.some(([bL, bR]) => bR > col.l && bL < col.r);
        if (state.wrapMode === "concave" && isWrapped && usable.length >= 2) {
          for (const [aL, aR] of usable) {
            const w = aR - aL;
            if (w < 68 && aL > shapeBounds.minX - 6 && aR < shapeBounds.maxX + 6) {
              const ch = Math.max(1, Math.floor(w / charW));
              pocketTraps.push({ x: aL, y: yTop, w, h: lineH - 4, chars: ch });
            }
          }
        }
        if (state.colMode === "one-col" && usable.length >= 2) {
          splitBridges.push({
            y: yTop + (lineH - 4) * 0.5,
            x1: usable[0][1],
            x2: usable[1][0],
          });
        }

        for (const [segL, segR] of usable) {
          const segW = segR - segL;
          const cap = Math.max(1, Math.floor(segW / charW));
          if (cursor >= text.length) cursor = 0;
          let slice = text.slice(cursor, cursor + cap);
          if (slice.length < cap) {
            slice += text.slice(0, cap - slice.length);
            cursor = cap - (text.length - cursor);
          } else {
            cursor += cap;
          }
          const isSliver = isWrapped && cap < MIN_SAFE_CHARS;
          const isPocket =
            state.wrapMode === "concave" &&
            isWrapped &&
            segW < 72 &&
            segL > shapeBounds.minX - 10 &&
            segR < shapeBounds.maxX + 10;

          if (isWrapped) {
            wrappedLineCount++;
            if (cap < minLineChars) minLineChars = cap;
            if (state.colMode === "one-col" && usable.length === 1 && segL > col.l + 4) {
              leftStartXs.push(segL);
            }
          }
          if (isSliver) {
            sliverBoxes.push({ x: segL, y: yTop, w: segW, h: lineH - 4, chars: cap });
          }
          const midX = (segL + segR) * 0.5;
          if (midX < viewW * 0.5) leftMass += segW * lineH;
          else rightMass += segW * lineH;

          lines.push({
            col: col.id,
            x: segL,
            y: yTop,
            w: segW,
            h: lineH - 4,
            text: slice,
            chars: cap,
            isWrapped,
            isSliver,
            isPocket,
          });
        }
      }
    }

    if (state.wrapMode === "concave" && pocketTraps.length === 0) {
      for (const ln of lines) {
        if (ln.isWrapped && Math.abs(ln.y - cy) < ry * 0.25 && ln.w < 190) {
          pocketTraps.push({
            x: ln.x > cx ? ln.x : ln.x + ln.w - 42,
            y: ln.y,
            w: 42,
            h: ln.h,
            chars: 3,
          });
          break;
        }
      }
    }
  }

  if (!isFinite(minLineChars)) minLineChars = 24;

  const leftRagPx =
    leftStartXs.length >= 3 ? Math.round(Math.max(...leftStartXs) - Math.min(...leftStartXs)) : 0;

  const figLeftShare = clamp((viewW * 0.5 - shapeBounds.minX) / Math.max(1, shapeBounds.w), 0, 1);
  const totalLeft = leftMass + realPolyArea * figLeftShare * 2.2;
  const totalRight = rightMass + realPolyArea * (1 - figLeftShare) * 2.2;
  const imbalance = Math.abs(totalLeft - totalRight) / Math.max(1, totalLeft + totalRight);

  const trappedPocketCount = pocketTraps.length;

  const contourOk = state.wrapMode === "contour";
  const marginOk = state.marginPx >= MARGIN_MIN && state.marginPx <= MARGIN_MAX;
  const noSplit = splitBridges.length === 0;
  const noSliver = minLineChars >= MIN_SAFE_CHARS && sliverBoxes.length === 0;
  const noPocket = trappedPocketCount === 0 && state.wrapMode !== "concave";
  const flowOk = noSplit && noSliver && noPocket;
  const sizeOk = imageAreaPct >= SCALE_MIN_PCT && imageAreaPct <= SCALE_MAX_PCT;
  const balanceOk =
    sizeOk && (state.colMode === "one-col" ? true : imbalance < 0.34);

  const checks = { contourOk, marginOk, flowOk, balanceOk };
  const passedCount = [contourOk, marginOk, flowOk, balanceOk].filter(Boolean).length;

  // 按严重优先级输出白话单真源诊断（说清「为什么会这样看」与下一步动作）
  let statusKind = "ok";
  let statusShort = "围而不堵";
  let headline = "";
  let body = "";
  let action = "";

  if (!noSplit) {
    statusKind = "bad";
    statusShort = "隔图劈句";
    headline = `单栏正文被图形劈成两半（${splitBridges.length} 行跨图跳读）`;
    body = `图形停在单栏中间（水平 ${Math.round(state.u * 100)}%），同一行文字同时在左右两侧排布，最窄处只剩 ${minLineChars} 字。眼睛每读半行就得跨过整张图接下半句，阅读流当场断裂。`;
    action = `直接把图形拖到右缘紧贴页边锚定，或切到「双栏跨脊」让左右两栏各自顺廓分流。`;
  } else if (!contourOk && state.wrapMode === "rect") {
    statusKind = "bad";
    statusShort = "矩形死框";
    headline = `套了矩形死框，四角刨出 ${voidWastePct}% 楔形死空洞`;
    body = `主体明明是柔和的有机轮廓，绕排却按外接矩形一刀切直。弧线往里收的地方留出大片空白三角，文字被挡在隐形墙外，图文立刻变成拼贴感。`;
    action = `点击画布红签或控槽里的「贴合轮廓」，让文字沿有机外包多边形自然贴近。`;
  } else if (!contourOk && state.wrapMode === "concave") {
    statusKind = "bad";
    statusShort = "凹坑陷字";
    headline = `轮廓留着深凹槽，孤字掉进「文字陷阱」`;
    body = `直接沿复杂内凹边缘绕排时，两三个孤零零的汉字会被吸进狭长凹湾里，行尾忽长忽短，眼睛不得不频繁停顿找字。`;
    action = `把边界切回「贴合轮廓（简化平滑多边形）」，跨过尖锐内凹口再排字。`;
  } else if (!marginOk && state.marginPx < MARGIN_MIN) {
    statusKind = "bad";
    statusShort = "贴边咬字";
    headline = `绕距只剩 ${state.marginPx}px，汉字边缘直接咬进图廓`;
    body = `文字和图像之间缺少呼吸缓冲区（经验参考带 ${MARGIN_MIN}–${MARGIN_MAX}px）。字脚紧贴深色轮廓时，形与字糊成一团，整页显得紧绷压抑。`;
    action = `往外拖拽青绿虚线绕排环，或把「轮廓绕距」推到 14–24px。`;
  } else if (!marginOk && state.marginPx > MARGIN_MAX) {
    statusKind = "bad";
    statusShort = "护城河过宽";
    headline = `绕距拉到 ${state.marginPx}px，图像像孤岛与文字脱节`;
    body = `超过约 ${MARGIN_MAX}px（经验参考）后，空白带喧宾夺主，读者不再感觉文字是「围绕」图像流动，反而像被排斥到版面边缘。`;
    action = `向内收紧青绿虚线绕排环，把绕距带回 ${MARGIN_MIN}–${MARGIN_MAX}px 舒适区。`;
  } else if (!noSliver) {
    statusKind = "bad";
    statusShort = "残行碎缝";
    headline = `边缘挤出 ${minLineChars} 字窄缝，形成锯齿残行`;
    body = `图形靠边太近或体量过胖，把旁边的文本槽压成只容 ${minLineChars} 个汉字的细缝（经验安全底线 ≥ ${MIN_SAFE_CHARS} 字）。每行三五个字迫使视线高频折返。`;
    action = `拖动图形让出宽裕文本槽，或把「图形体量」微收进 28%–42% 区间。`;
  } else if (!sizeOk && imageAreaPct > SCALE_MAX_PCT) {
    statusKind = "bad";
    statusShort = "围而堵死";
    headline = `图形膨胀到 ${imageAreaPct}% 面积，文字被挤上页边`;
    body = `环绕图的核心是图文互衬而非一图吞页。主体超过版面约 ${SCALE_MAX_PCT}%（经验参考）时，四周字流失去舒展空间，变成「围而堵死」。`;
    action = `把「图形体量」调小到 26%–42%，把呼吸空间还给正文。`;
  } else if (!sizeOk && imageAreaPct < SCALE_MIN_PCT) {
    statusKind = "bad";
    statusShort = "主体过微";
    headline = `图形缩到 ${imageAreaPct}%，绕排失去视觉核心`;
    body = `核心图像低于版面约 ${SCALE_MIN_PCT}%（经验参考）时，撑不起向心引力，文字绕开它显得小题大做。`;
    action = `把「图形体量」放大到 26%–42%，让图形真正担起视觉核的角色。`;
  } else if (!balanceOk) {
    statusKind = "bad";
    statusShort = "左右偏沉";
    headline = `图形偏离双栏中脊，一侧压满一侧空荡`;
    body = `双栏跨脊或六点环绕依赖左右呼应来稳定重心。图形偏到一侧时，两栏字宽与视觉重量严重失衡。`;
    action = `把图形拖回双栏中轴附近（44%–56%），让左右两侧形成匀称的环抱节奏。`;
  } else {
    statusKind = "ok";
    statusShort = "围而不堵";
    if (state.colMode === "poster-6") {
      headline = `4/4 原海报六点环绕就位：顺廓聚目，左右呼应`;
      body = `六个梅紫与青绿要点沿平滑轮廓留出 ${state.marginPx}px 均匀呼吸距，最窄处仍有 ${minLineChars} 字从容排布，视线顺着虚线箭头环游整幅版面。`;
      action = `你也可以切到「双栏跨脊」或「单栏贴右」试试长文场景，或拖歪图形亲手踩坑验证。`;
    } else if (state.colMode === "two-col") {
      headline = `4/4 双栏跨脊解成立：左栏顺右弧、右栏顺左弧`;
      body = `图形稳跨双栏中缝（占幅 ${imageAreaPct}%），轮廓绕距 ${state.marginPx}px，两栏各自独立读完零穿桥，最窄行仍有 ${minLineChars} 字，真正做到「围而不堵，聚而有序」。`;
      action = `试试切到「单栏绕排」并拖到右缘，对比单栏贴右与双栏跨脊的不同节奏。`;
    } else if (state.u < 0.42 && leftRagPx > 14) {
      headline = `4/4 单栏贴左解成立（附提示：行首微伏 ${leftRagPx}px）`;
      body = `当前贴廓、绕距（${state.marginPx}px）与行宽（最窄 ${minLineChars} 字）均达标。提示：图形靠左时行首随弧线起伏 ${leftRagPx}px，长文阅读不如靠右锚定稳当。`;
      action = `把图形向右拖到右缘紧贴页边，对比「左直右绕」带来的行首稳定感。`;
    } else {
      headline = `4/4 单栏贴右解成立：行首笔直齐整，右缘顺廓舒展`;
      body = `图形稳锚右侧（占幅 ${imageAreaPct}%），正文左缘保持一条笔直基线供视线回扫，右侧顺着有机轮廓退让 ${state.marginPx}px，最窄行 ${minLineChars} 字，读感畅快。`;
      action = `继续尝试切换「青瓷梅瓶」或「剪影风衣」题材，观察不同轮廓的绕排韵律。`;
    }
  }

  const hotspots = [];
  if (state.wrapMode === "rect") {
    hotspots.push({
      id: "fix-contour",
      kind: "contour",
      x: clamp(rectBounds.minX + 10, spreadX + 6, spreadX + spreadW - 156),
      y: clamp(rectBounds.minY + 10, spreadY + 8, spreadY + spreadH - 36),
      w: 148,
      h: 28,
      label: `矩形死角 ${voidWastePct}% · 点改贴廓`,
    });
  } else if (state.wrapMode === "concave") {
    hotspots.push({
      id: "fix-contour",
      kind: "contour",
      x: clamp(cx - 74, spreadX + 6, spreadX + spreadW - 156),
      y: clamp(cy - 14, spreadY + 8, spreadY + spreadH - 36),
      w: 148,
      h: 28,
      label: `凹坑陷字 · 点平滑轮廓`,
    });
  }
  if (!noSplit && splitBridges.length) {
    const mid = splitBridges[Math.floor(splitBridges.length / 2)];
    hotspots.push({
      id: "fix-split",
      kind: "split",
      x: clamp((mid.x1 + mid.x2) * 0.5 - 78, spreadX + 6, spreadX + spreadW - 164),
      y: clamp(mid.y + 18, spreadY + 46, spreadY + spreadH - 38),
      w: 158,
      h: 28,
      label: `单栏劈句 · 点切双栏跨脊`,
    });
  } else if (!noSliver && sliverBoxes.length) {
    const sb = sliverBoxes[Math.floor(sliverBoxes.length / 2)];
    hotspots.push({
      id: "fix-sliver",
      kind: "sliver",
      x: clamp(sb.x - 40, spreadX + 6, spreadX + spreadW - 156),
      y: clamp(sb.y - 4, spreadY + 46, spreadY + spreadH - 38),
      w: 148,
      h: 28,
      label: `碎缝 ${minLineChars} 字 · 点挪稳位`,
    });
  }

  const pillarStates = [
    {
      id: "focal",
      ok: sizeOk,
      text: sizeOk ? `占幅 ${imageAreaPct}%` : imageAreaPct > SCALE_MAX_PCT ? `臃肿 ${imageAreaPct}%` : `过微 ${imageAreaPct}%`,
    },
    {
      id: "wrap",
      ok: contourOk && marginOk,
      text: !contourOk ? (state.wrapMode === "rect" ? "矩形死框" : "凹坑陷字") : !marginOk ? `绕距 ${state.marginPx}px` : `顺廓 ${state.marginPx}px`,
    },
    {
      id: "flow",
      ok: flowOk,
      text: !noSplit ? `劈句 ${splitBridges.length} 行` : !noSliver ? `碎缝 ${minLineChars} 字` : !noPocket ? "凹槽断流" : `最窄 ${minLineChars} 字`,
    },
    {
      id: "balance",
      ok: balanceOk,
      text: balanceOk ? "权重呼应" : !sizeOk ? "图文失衡" : "左右偏沉",
    },
    {
      id: "contour",
      ok: contourOk && marginOk,
      text: contourOk ? (marginOk ? "柔弧贴合" : state.marginPx < MARGIN_MIN ? "贴边咬字" : "空带过宽") : `死角 ${voidWastePct || 18}%`,
    },
    {
      id: "emphasis",
      ok: passedCount === 4,
      text: passedCount === 4 ? "聚而有序" : `待修 ${4 - passedCount} 项`,
    },
  ];

  let handlePt = [cx + rx + drawMargin, cy];
  let bestX = -Infinity;
  const ringRef = state.wrapMode === "rect" ? [[rectBounds.maxX, cy]] : wrapPoly;
  for (const [px, py] of ringRef) {
    if (px > bestX) {
      bestX = px;
      handlePt = [px, py];
    }
  }
  handlePt = [
    clamp(handlePt[0], spreadX + 18, spreadX + spreadW - 18),
    clamp(handlePt[1], spreadY + 30, spreadY + spreadH - 30),
  ];

  return {
    viewW,
    viewH,
    isCompact,
    state,
    theme: themeObj,
    spread: { x: spreadX, y: spreadY, w: spreadW, h: spreadH, gutter },
    figure: { cx, cy, rx, ry, shapePoly, wrapPoly, shapeBounds, wrapBounds, rectBounds, handlePt, drawMargin },
    lines,
    posterCards,
    sliverBoxes,
    splitBridges,
    pocketTraps,
    hotspots,
    checks,
    passedCount,
    statusKind,
    statusShort,
    headline,
    body,
    action,
    pillarStates,
    metrics: {
      boundaryLabel: state.wrapMode === "contour" ? "贴合轮廓" : state.wrapMode === "rect" ? `矩形死框 (空${voidWastePct}%)` : "凹坑陷阱",
      marginLabel: `${state.marginPx}px${marginOk ? "" : state.marginPx < MARGIN_MIN ? " · 咬字" : " · 脱节"}`,
      minLineLabel: !noSplit ? `劈句 · ${minLineChars}字` : `${minLineChars} 字/行`,
      areaLabel: `${imageAreaPct}%`,
      minLineChars,
      imageAreaPct,
      voidWastePct,
      splitCount: splitBridges.length,
      leftRagPx,
    },
  };
}

// ---------- 03 节历史演变核实数据 ----------
export const HISTORY_ERAS = [
  {
    id: "1499",
    year: "1499",
    place: "威尼斯 · 活字与木刻",
    person: "Aldus Manutius / Francesco Griffo",
    work: "《寻爱绮梦》（Hypnerotomachia Poliphili）",
    summary:
      "威尼斯出版商阿尔杜斯·马努提乌斯印行该书，内含 172 幅细线木刻插图，配弗朗切斯科·格里福刻制的人文主义罗马体。木刻线条疏朗如笔触，与活字灰面融为一体，书页间多次出现随造型收束的活字排布与图文互嵌，奠定现代书籍图文共呼吸的典范。",
    takeaway: "核心启发：图像轮廓的疏密、线条粗细必须与正文灰面相称，绕排才有「一体化」而非「生硬挖洞」的观感。",
    specimenKind: "aldus",
  },
  {
    id: "1934",
    year: "1934–1958",
    place: "纽约 · 时尚杂志跨页",
    person: "Alexey Brodovitch",
    work: "《Harper's Bazaar》跨页革新",
    summary:
      "阿列克谢·布罗多维奇执掌《Harper's Bazaar》艺术指导长达 24 年，以大胆的退底剪裁（cutout）和跨页节奏著称。他剪除冗杂背景，让服饰与身姿剪影直接浮于大片留白中，文字块顺随图像斜势与动势分布，使整本杂志宛如流动的乐章。",
    takeaway: "核心启发：绕图不只是「省地方」，更是用主体轮廓的斜势与方向把静默的栏文变成动态视线通道。",
    specimenKind: "brodovitch",
  },
  {
    id: "1988",
    year: "1988",
    place: "桌面出版 · 可调多边形绕排",
    person: "Aldus PageMaker 3.0 → Adobe InDesign",
    work: "Custom Text Wrap / Polygon Standoff",
    summary:
      "1988 年发布的 Aldus PageMaker 3.0 引入自动绕排（Automatic Text Wrap）与不规则多边形自定义边界：设计师可直接在图像外框线上加点拖拽，贴合异形轮廓，图形一挪动，周围文字立刻重排。后来的 Adobe InDesign 进一步加入「检测边缘（Detect Edges）」与「Alpha 通道」绕排。",
    takeaway: "核心启发：把绕排边界从矩形松绑成可编辑多边形，也让「精简节点、避开毛刺凹槽」成为排版师的必修工艺。",
    specimenKind: "pagemaker",
  },
  {
    id: "2014",
    year: "2014",
    place: "W3C · 网页走出矩形盒",
    person: "W3C CSS Working Group",
    work: "《CSS Shapes Module Level 1》（2014-03-20 CR）",
    summary:
      "W3C 于 2014 年 3 月 20 日发布 CSS Shapes Level 1 候选推荐标准（编辑：Vincent Hardy、Rossen Atanassov、Alan Stearns），正式确立 shape-outside、shape-margin 与 shape-image-threshold。网页浮动元素首次能用 circle()、polygon() 或透明图通道让行内文本沿曲线流动。",
    takeaway: "核心启发：网页端绕排只作用于浮动容器，且在窄屏手机上容易挤出残行，必须搭配媒体查询及时降级回上下流排。",
    specimenKind: "cssshapes",
  },
];

// ---------- 04 节 轮廓简化工艺（4 档顶点数真实对比） ----------
export const SIMPLIFY_LEVELS = [
  {
    id: "raw",
    vertices: 42,
    label: "42 点 · 原始锯齿",
    verdict: "毛刺撕碎字缘",
    verdictTone: "bad",
    ragScore: "行尾跳动剧烈",
    fitScore: "过度追随枝叶毛刺",
    desc: "直接套用「自动边缘检测」却不化简：花叶和器物边缘的每根细须都顶出一条参差折角，相邻两行文字忽缩忽吐，甚至有孤字掉进叶隙。",
  },
  {
    id: "fine",
    vertices: 18,
    label: "18 点 · 细廓跟随",
    verdict: "略碎 · 适合宽栏",
    verdictTone: "warn",
    ragScore: "微幅起伏",
    fitScore: "高度贴合主轮廓",
    desc: "抹平细小毛刺但保留次级凹凸。在 18 字以上的宽松杂志栏里观感细腻；一旦栏宽偏窄，局部微凹仍会造成轻微行宽波动。",
  },
  {
    id: "smooth",
    vertices: 8,
    label: "8 点 · 平滑外包（推荐）",
    verdict: "顺廓稳节奏",
    verdictTone: "ok",
    ragScore: "弧线平顺连贯",
    fitScore: "保形且隔绝凹坑",
    desc: "排版老手最常用的甜区：用 6–10 个外凸平滑折点包住主体大势，既清晰传达器物或卵石的柔和弧线，又让文字行宽按均匀阶梯渐变。",
  },
  {
    id: "box",
    vertices: 4,
    label: "4 点 · 矩形外框",
    verdict: "死角割裂图文",
    verdictTone: "bad",
    ragScore: "笔直但生硬",
    fitScore: "四角空洞约 29%",
    desc: "退回普通矩形图框：省事却彻底丧失环绕图版式的魅力，曲线向内退让的肩部和底部留下大片突兀三角空白，图文疏离。",
  },
];

// ---------- 05 节 什么时候用 / 什么时候别用 ----------
export const SCENARIO_CARDS = [
  {
    id: "magazine",
    title: "人物专访与器物杂志跨页",
    en: "EDITORIAL SPREAD",
    tag: "强烈推荐",
    tone: "ok",
    summary: "宽版面（单栏 ≥ 24 字或双栏跨脊）+ 清晰退底主体 + 稳定定稿文案。",
    detail: "主体外轮廓本身就能讲故事（器物、服饰剪影、插画符号），顺廓绕排能把图文融成一个整体呼吸场，打破多页长文的枯燥栏线。",
  },
  {
    id: "poster",
    title: "概念解构海报与视觉图谱",
    en: "CONCEPT POSTER",
    tag: "强烈推荐",
    tone: "ok",
    summary: "像 158 原海报那样，核心图形居中，4–6 条短要点环绕主图向外辐射。",
    detail: "短要点无需跨行长读，天然契合轮廓起伏；配合顺时针引导线与交替色徽，读者一眼先定主角，再环视读完全部卖点。",
  },
  {
    id: "product",
    title: "工业产品拆解与专题页（桌面端）",
    en: "PRODUCT STORY",
    tag: "条件使用",
    tone: "warn",
    summary: "宽屏展示突出造型，但在窄于 680px 的手机视口必须自动取消浮动绕排。",
    detail: "Web 端用 CSS shape-outside 配合 @media (min-width: 720px) 启用；手机端平滑降级为「图在上、文在下」堆叠，杜绝 5 字残缝。",
  },
  {
    id: "mobile",
    title: "375px 手机竖屏长文章",
    en: "NARROW MOBILE",
    tag: "坚决别用",
    tone: "bad",
    summary: "手机单行总共只有 18–22 个汉字，塞进一张绕排图就会切出 4–6 字碎条。",
    detail: "Robert Bringhurst 提出的舒适行宽规律在中文移动端同样成立：绕排一旦把有效行宽压破 8 字，眼睛每半秒换一次行，极度疲劳。",
  },
  {
    id: "legal",
    title: "财务年报、法律合同与技术手册",
    en: "DATA & LEGAL",
    tag: "坚决别用",
    tone: "bad",
    summary: "需要逐条核对数字、条款、代码块的严谨文档，严禁让行宽随曲线飘忽。",
    detail: "读者在这类页面里追求快速定位、纵向对齐与零干扰扫描，改用清晰的模块化格网或分栏侧注效率高得多。",
  },
  {
    id: "i18n",
    title: "多语种动态翻译 / 用户生成内容",
    en: "DYNAMIC I18N",
    tag: "坚决别用",
    tone: "bad",
    summary: "中文译成德语或英语往往涨字 30%–50%，原本贴合轮廓的段落会溢出或露底。",
    detail: "复杂背景的实景照片（没有干净主体轮廓）同样不适合硬抠绕排——硬抠出的杂乱锯齿只会让版面显得廉价凌乱。",
  },
];

// ---------- 06 节 单变量控制视觉练习 ----------
// 严格遵守：选项标签只写中性编号，四个方案仅改变一个受控变量，无剧透词。
export const QUIZ_ITEMS = [
  {
    id: "q1",
    num: "练习 01",
    prompt: "四张单栏长文采用完全相同的有机图形、体量（34%）与绕距（16px），唯一区别是图形的停靠位置。哪一版读起来最顺畅？",
    variableNote: "受控变量：单栏内的停靠位置与阅读流向",
    answer: "C",
    options: [
      {
        key: "A",
        caption: "方案 A",
        kind: "left-rag",
        feedback: "方案 A 把大弧度有机图形贴在左缘：虽然没有跨图劈句，但正文每一行的左起点都跟着弧线大幅进退，视线每换一行都要重新寻找行首锚点，长文读起来容易串行。",
      },
      {
        key: "B",
        caption: "方案 B",
        kind: "center-split",
        feedback: "方案 B 把图形摆进单栏正中：正文被迫在图形左右两侧同排一行，每一句话都被图像拦腰劈断，视线频繁跨图跳读，是绕排最常见的翻车位。",
      },
      {
        key: "C",
        caption: "方案 C",
        kind: "right-anchor",
        feedback: "答对了。方案 C 让图形紧贴右缘停靠：左侧保持一条笔直稳定的行首基线，眼睛回扫毫不费力；右侧顺着有机弧线优雅退让，且没有任何碎缝或跨图跳读。",
      },
      {
        key: "D",
        caption: "方案 D",
        kind: "right-sliver",
        feedback: "方案 D 看似靠右，却在图形与右页边之间留下一条 3–4 字的尴尬窄缝：既触发左右双侧排字，又挤出难以卒读的残行碎片。",
      },
    ],
  },
  {
    id: "q2",
    num: "练习 02",
    prompt: "四张双栏跨脊跨页的图形位置与大小完全一致，唯一区别是绕排边界与安全呼吸距。哪一版最符合「围而不堵，聚而有序」？",
    variableNote: "受控变量：绕排轮廓形式与安全呼吸距",
    answer: "B",
    options: [
      {
        key: "A",
        caption: "方案 A",
        kind: "rect-box",
        feedback: "方案 A 套了矩形外框（16px）：虽然不会咬字，但卵石上下收窄处被白白切出大片直角空洞，文字与曲线各走各路，失去了环绕图版式的亲密张力。",
      },
      {
        key: "B",
        caption: "方案 B",
        kind: "smooth-16",
        feedback: "答对了。方案 B 用简化平滑多边形贴合主体大势，并保持 16px 均匀呼吸距（经验参考 10–30px）：既尊重曲线韵律，又让两栏正文保有均匀、清爽的边界节奏。",
      },
      {
        key: "C",
        caption: "方案 C",
        kind: "tight-jagged",
        feedback: "方案 C 直接沿未简化的高噪锯齿边缘排字且只留 2px 间隙：字脚咬住色块，行尾又随凹凸锯齿剧烈跳动，版面既堵又乱。",
      },
      {
        key: "D",
        caption: "方案 D",
        kind: "moat-44",
        feedback: "方案 D 把呼吸距推到 44px：过宽的空白带像一道护城河把图像与文字隔成两张皮，还顺带把左右两栏正文挤成仅剩 6 字的窄条。",
      },
    ],
  },
];
