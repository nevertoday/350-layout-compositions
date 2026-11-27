// 182 轮廓绕排 · 单真源几何、扫描线绕排引擎与排版审计模型
// 全部画面绘制、右侧虚线批注、关键词亮灯、诊断文案与测验均只读此模块算出的同一份布局数据。

export const ARTICLE_TEXT =
  "轮廓绕排让文字主动贴合图形边缘，自然避让主体，减少冲突，增强层次与秩序。它不是把字强行塞进方正的灰框里，而是顺着器物的肩线、叶片的弧度或抽象形体的转折，让每一行文字在恰当的呼吸距之外止步或起笔。读者的目光沿着稳定齐整的起行边向下推进，又在另一侧感受轮廓起伏带来的轻盈节拍。只要护住呼吸空隙、避免深凹口夹住碎词，也绝不让图形硬劈正文迫使视线跨图跳读，文字与主体就能彼此成就、共生共息。当页面留出足够的纸面余白，图形的曲线不再是阅读的障碍，反而成为牵引视线流转的隐形乐谱，让整版信息兼具清澈的秩序与有温度的呼吸感。";

export const RING_TEXT =
  "这种排版方式让文字主动贴合图形边缘，自然避让主体，减少冲突，增强层次与秩序。引导视线流动，提升画面聚焦，适用于标题、重点说明或创意。";

export const SHAPES = {
  vase: {
    id: "vase",
    name: "器物轮廓",
    sub: "长颈陶瓶",
    desc: "1:1 承袭 182 原海报的长颈宽腹陶瓶剪影，瓶颈收束与瓶腹丰腴构成经典 S 形弧线。",
  },
  leaf: {
    id: "leaf",
    name: "自然元素",
    sub: "龟背竹叶",
    desc: "原海报「应用示例」的自然叶片轮廓，带多道深裂口——最考验是否做外包络桥接。",
  },
  blob: {
    id: "blob",
    name: "抽象形态",
    sub: "三瓣流形",
    desc: "原海报「应用示例」的三瓣云形色块，柔美宽弧与缓凹湾适合营造杂志轻盈韵律。",
  },
};

export const PRESETS = {
  // 开场默认：多重典型绕排事故（居中偏左硬劈正文 + 0px 啃边碰撞 + 右段起行锯齿）
  broken: {
    id: "broken",
    label: "开场错态",
    shape: "vase",
    cols: 1,
    wrapMode: "contour",
    bridge: false,
    cx: 0.45,
    cy: 0.50,
    scale: 0.78,
    marginPx: 0,
  },
  // 合法解 1：右置左齐典范解（贴右浮动，左缘稳如锚链，右缘随陶瓶曲线呼吸）
  classicRight: {
    id: "classicRight",
    label: "右置左齐解",
    shape: "vase",
    cols: 1,
    wrapMode: "contour",
    bridge: true,
    cx: 0.85,
    cy: 0.50,
    scale: 0.80,
    marginPx: 14,
  },
  // 合法解 2：双栏中缝夹嵌解（经典杂志跨栏，左右栏各守其栏，绝不跨图连读）
  twoColCenter: {
    id: "twoColCenter",
    label: "双栏中缝解",
    shape: "vase",
    cols: 2,
    wrapMode: "contour",
    bridge: true,
    cx: 0.50,
    cy: 0.50,
    scale: 0.72,
    marginPx: 13,
  },
  // 合法解 3：龟背叶桥接疏朗解（自然元素封堵深裂口）
  leafBridged: {
    id: "leafBridged",
    label: "龟背叶桥接解",
    shape: "leaf",
    cols: 1,
    wrapMode: "contour",
    bridge: true,
    cx: 0.84,
    cy: 0.50,
    scale: 0.78,
    marginPx: 15,
  },
  // 双向试错：过大边距脱形退化
  tooFar: {
    id: "tooFar",
    label: "过松脱形",
    shape: "vase",
    cols: 1,
    wrapMode: "contour",
    bridge: true,
    cx: 0.85,
    cy: 0.50,
    scale: 0.76,
    marginPx: 40,
  },
  // 双向试错：龟背叶未桥接导致深裂口吞字 / 尖刺跳动
  leafTrap: {
    id: "leafTrap",
    label: "叶缝吞孤字",
    shape: "leaf",
    cols: 1,
    wrapMode: "contour",
    bridge: false,
    cx: 0.83,
    cy: 0.50,
    scale: 0.82,
    marginPx: 10,
  },
  // 双向试错：主体靠左把左起行锯成锯齿
  leftJagged: {
    id: "leftJagged",
    label: "左缘锯齿",
    shape: "vase",
    cols: 1,
    wrapMode: "contour",
    bridge: false,
    cx: 0.15,
    cy: 0.50,
    scale: 0.80,
    marginPx: 14,
  },
  // 双向试错：退化成 183 矩形绕排
  boxFallback: {
    id: "boxFallback",
    label: "退化矩形 183",
    shape: "vase",
    cols: 1,
    wrapMode: "box",
    bridge: true,
    cx: 0.85,
    cy: 0.50,
    scale: 0.80,
    marginPx: 14,
  },
};

export function createInitialState() {
  return { ...PRESETS.broken };
}

// ---------- 归一化轮廓生成（[-1, 1] 局部坐标，缓存以零分配高频重绘） ----------

function catmullRomClosed(ctrl, segsPerSpan = 7) {
  const n = ctrl.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n];
    const p1 = ctrl[i];
    const p2 = ctrl[(i + 1) % n];
    const p3 = ctrl[(i + 2) % n];
    for (let s = 0; s < segsPerSpan; s++) {
      const t = s / segsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, y]);
    }
  }
  return out;
}

function buildVasePoly(bridged) {
  // 1:1 复刻 182 原海报丰满柔美、带轻盈微倾曲线的长颈宽腹柿红陶瓶
  const neckEase = bridged ? 0.05 : 0;
  const ctrl = [
    [-0.12, -0.96],
    [0.24, -0.94],
    [0.44, -0.82],
    [0.38, -0.64],
    [0.24 + neckEase, -0.44],
    [0.34 + neckEase * 0.5, -0.22],
    [0.64, 0.02],
    [0.72, 0.28],
    [0.62, 0.56],
    [0.48, 0.80],
    [0.24, 0.95],
    [-0.14, 0.96],
    [-0.48, 0.85],
    [-0.66, 0.58],
    [-0.72, 0.24],
    [-0.74, -0.06],
    [-0.54, -0.28],
    [-0.36 - neckEase, -0.46],
    [-0.38 - neckEase * 0.5, -0.66],
    [-0.50, -0.82],
    [-0.36, -0.93],
  ];
  return catmullRomClosed(ctrl, 6);
}

function buildLeafPoly(bridged) {
  // 还原 182 原海报「自然元素」经典斜裂龟背竹叶（带短柄与羽状深裂）
  if (bridged) {
    // 严格包络原始叶片的全部外凸尖端，只平滑桥接深裂凹口，绝不内缩切入叶瓣
    const ctrl = [
      [-0.06, -0.93],
      [0.36, -0.84],
      [0.72, -0.56],
      [0.84, -0.22],
      [0.87, 0.08],
      [0.78, 0.40],
      [0.58, 0.68],
      [0.24, 0.85],
      [0.02, 0.96],
      [-0.14, 0.96],
      [-0.46, 0.78],
      [-0.75, 0.50],
      [-0.87, 0.18],
      [-0.87, -0.10],
      [-0.80, -0.36],
      [-0.68, -0.64],
      [-0.38, -0.86],
    ];
    return catmullRomClosed(ctrl, 6);
  }
  // 真实深裂龟背竹叶：宽裂叶瓣 + 深斜裂口（未桥接时扫描线钻进叶裂口会吞进孤字！）
  const ctrl = [
    [-0.06, -0.92],
    [0.32, -0.84],
    [0.66, -0.58],
    [0.76, -0.36],
    [0.14, -0.24], // 右上斜深裂
    [0.82, -0.14],
    [0.84, 0.12],
    [0.12, 0.16], // 右中斜深裂
    [0.76, 0.34],
    [0.58, 0.64],
    [0.24, 0.82],
    [0.04, 0.76],
    [0.00, 0.96], // 叶柄
    [-0.12, 0.96],
    [-0.14, 0.76],
    [-0.44, 0.74],
    [-0.72, 0.48],
    [-0.18, 0.28], // 左下深裂（朝向正文区，最易吞字！）
    [-0.82, 0.18],
    [-0.84, -0.06],
    [-0.16, -0.14], // 左中深裂（朝向正文区！）
    [-0.78, -0.32],
    [-0.66, -0.62],
    [-0.36, -0.84],
  ];
  return catmullRomClosed(ctrl, 4);
}

function buildBlobPoly(bridged) {
  // 原海报右下第 3 枚：圆润饱满的三瓣有机流形
  const pinch = bridged ? 0.12 : 0;
  const ctrl = [
    [0.08, -0.90],
    [0.44, -0.78],
    [0.50, -0.44],
    [0.40 + pinch, -0.14],
    [0.76, 0.06],
    [0.86, 0.40],
    [0.66, 0.76],
    [0.26, 0.80],
    [-0.02, 0.56 + pinch * 0.7],
    [-0.38, 0.78],
    [-0.78, 0.66],
    [-0.86, 0.26],
    [-0.60, -0.08],
    [-0.36 - pinch, -0.26],
    [-0.32, -0.66],
  ];
  return catmullRomClosed(ctrl, 7);
}

const POLY_CACHE = {
  vase_raw: buildVasePoly(false),
  vase_bridged: buildVasePoly(true),
  leaf_raw: buildLeafPoly(false),
  leaf_bridged: buildLeafPoly(true),
  blob_raw: buildBlobPoly(false),
  blob_bridged: buildBlobPoly(true),
};

export function getShapePolygon(shapeId, bridged = false) {
  const key = `${shapeId}_${bridged ? "bridged" : "raw"}`;
  return POLY_CACHE[key] || POLY_CACHE.vase_raw;
}

export function transformPolygon(poly, cxPx, cyPx, rx, ry) {
  const n = poly.length;
  const out = new Array(n);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = cxPx + poly[i][0] * rx;
    const y = cyPx + poly[i][1] * ry;
    out[i] = [x, y];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { pts: out, bbox: { minX, maxX, minY, maxY } };
}

function mergeIntervals(ivs) {
  if (ivs.length <= 1) return ivs;
  ivs.sort((a, b) => a[0] - b[0]);
  const res = [ivs[0]];
  for (let i = 1; i < ivs.length; i++) {
    const prev = res[res.length - 1];
    const cur = ivs[i];
    if (cur[0] <= prev[1] + 0.5) {
      if (cur[1] > prev[1]) prev[1] = cur[1];
    } else {
      res.push(cur);
    }
  }
  return res;
}

function scanlineIntervalsForPoly(pts, bbox, y, margin) {
  if (y < bbox.minY - margin || y > bbox.maxY + margin) return [];
  const n = pts.length;
  const ivs = [];

  if (y >= bbox.minY && y <= bbox.maxY) {
    const xs = [];
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const yi = pts[i][1], yj = pts[j][1];
      if ((yi > y) !== (yj > y)) {
        const xi = pts[i][0], xj = pts[j][0];
        xs.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      ivs.push([xs[k] - margin, xs[k + 1] + margin]);
    }
  }

  if (margin > 0.5) {
    const m2 = margin * margin;
    for (let i = 0; i < n; i++) {
      const dy = y - pts[i][1];
      const dy2 = dy * dy;
      if (dy2 < m2) {
        const dx = Math.sqrt(m2 - dy2);
        ivs.push([pts[i][0] - dx, pts[i][0] + dx]);
      }
    }
  }
  return mergeIntervals(ivs);
}

export function bandExclusions(shapeGeom, yTop, yBot, margin, wrapMode) {
  const { pts, bbox } = shapeGeom;
  if (yBot < bbox.minY - margin || yTop > bbox.maxY + margin) return [];
  if (wrapMode === "box") {
    return [[bbox.minX - margin, bbox.maxX + margin]];
  }
  const all = [];
  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const y = yTop + ((yBot - yTop) * s) / steps;
    const ivs = scanlineIntervalsForPoly(pts, bbox, y, margin);
    for (let k = 0; k < ivs.length; k++) all.push(ivs[k]);
  }
  return mergeIntervals(all);
}

function subtractIntervals(colL, colR, excls) {
  let slots = [[colL, colR]];
  for (let e = 0; e < excls.length; e++) {
    const [el, er] = excls[e];
    const next = [];
    for (let s = 0; s < slots.length; s++) {
      const [sl, sr] = slots[s];
      if (er <= sl || el >= sr) {
        next.push([sl, sr]);
      } else {
        if (el > sl) next.push([sl, el]);
        if (er < sr) next.push([er, sr]);
      }
    }
    slots = next;
    if (!slots.length) break;
  }
  return slots;
}

const NARROW_PUNCT = new Set(["，", "。", "、", "；", "：", "！", "？", "「", "」", "（", "）"]);
const FORBID_START = new Set(["，", "。", "、", "；", "：", "！", "？", "」", "）", "》"]);

export function charAdvance(ch, fontSize) {
  if (ch === " ") return fontSize * 0.35;
  if (NARROW_PUNCT.has(ch)) return fontSize * 0.82;
  if (ch.charCodeAt(0) < 128) return fontSize * 0.56;
  return fontSize * 1.02;
}

function fillSlot(text, cursor, maxWidth, fontSize) {
  let w = 0;
  let i = cursor;
  const len = text.length;
  while (i < len && text[i] === " ") i++;
  const start = i;
  while (i < len) {
    const ch = text[i];
    const adv = charAdvance(ch, fontSize);
    if (w + adv > maxWidth) break;
    w += adv;
    i++;
  }
  if (i < len && FORBID_START.has(text[i]) && i - start >= 2) {
    if (w + fontSize * 0.55 <= maxWidth + fontSize * 0.15) {
      w += charAdvance(text[i], fontSize);
      i++;
    } else {
      i--;
      w -= charAdvance(text[i], fontSize);
    }
  }
  const str = text.slice(start, i);
  return { str, width: w, nextCursor: i };
}

export function buildOffsetEnvelope(pts, margin) {
  if (margin <= 0.5) return pts;
  const n = pts.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const dx1 = curr[0] - prev[0], dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
    const l1 = Math.hypot(dx1, dy1) || 1;
    const l2 = Math.hypot(dx2, dy2) || 1;
    const nx1 = dy1 / l1, ny1 = -dx1 / l1;
    const nx2 = dy2 / l2, ny2 = -dx2 / l2;
    let nx = nx1 + nx2, ny = ny1 + ny2;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    out[i] = [curr[0] + nx * margin, curr[1] + ny * margin];
  }
  return out;
}

// ---------- 核心求解：单真源排印 + 全量体检 ----------

export function computeLayout(state, box = { W: 640, H: 468 }, customText = ARTICLE_TEXT) {
  const { W, H } = box;
  const isThumb = W < 240;
  const padX = Math.max(10, Math.round(W * 0.068));
  const padTop = isThumb ? Math.max(12, Math.round(H * 0.08)) : Math.max(38, Math.round(H * 0.105));
  const padBot = isThumb ? Math.max(12, Math.round(H * 0.08)) : Math.max(28, Math.round(H * 0.085));
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;

  const baseFs = isThumb
    ? Math.max(9.2, Math.min(11.2, W * 0.056))
    : state.cols === 2
    ? Math.max(11.5, Math.min(13.6, W * 0.021))
    : Math.max(12.8, Math.min(15.6, W * 0.0245));
  const fontSize = Math.round(baseFs * 10) / 10;
  const lineH = Math.round(fontSize * 1.62 * 10) / 10;
  const rows = Math.max(4, Math.floor((innerH - 2) / lineH));

  const cxPx = padX + state.cx * innerW;
  const cyPx = padTop + state.cy * innerH;
  const shapeH = innerH * state.scale;
  // 陶瓶略加宽丰腴以贴合 182 原海报体态
  const aspectMap = { vase: 0.64, leaf: 0.78, blob: 0.80 };
  const ry = shapeH * 0.5;
  const rx = ry * (aspectMap[state.shape] || 0.66);

  const visualPolyNorm = getShapePolygon(state.shape, false);
  const wrapPolyNorm = getShapePolygon(state.shape, state.bridge);
  const bridgedPolyNorm = getShapePolygon(state.shape, true);
  const visualGeom = transformPolygon(visualPolyNorm, cxPx, cyPx, rx, ry);
  const wrapGeom = transformPolygon(wrapPolyNorm, cxPx, cyPx, rx, ry);
  const bridgedGeom = transformPolygon(bridgedPolyNorm, cxPx, cyPx, rx, ry);

  const envelopePts =
    state.wrapMode === "box"
      ? [
          [wrapGeom.bbox.minX - state.marginPx, wrapGeom.bbox.minY - state.marginPx],
          [wrapGeom.bbox.maxX + state.marginPx, wrapGeom.bbox.minY - state.marginPx],
          [wrapGeom.bbox.maxX + state.marginPx, wrapGeom.bbox.maxY + state.marginPx],
          [wrapGeom.bbox.minX - state.marginPx, wrapGeom.bbox.maxY + state.marginPx],
        ]
      : buildOffsetEnvelope(wrapGeom.pts, state.marginPx);

  const gutter = Math.round(W * 0.048);
  const columns =
    state.cols === 2
      ? [
          { col: 0, l: padX, r: padX + (innerW - gutter) / 2 },
          { col: 1, l: padX + (innerW + gutter) / 2, r: W - padX },
        ]
      : [{ col: 0, l: padX, r: W - padX }];

  // 真实浮动语义（同 CSS float: right/left 或 InDesign Wrap To: Left/Right Side）：
  // 单栏下当主体贴靠右页边或左页边时，封堵主体外缘与纸边之间的死窄缝，绝不在外侧乱掉单字！
  const dockThreshold = fontSize * 4.4;
  const singleDockRight = state.cols === 1 && wrapGeom.bbox.maxX >= columns[0].r - dockThreshold;
  const singleDockLeft = state.cols === 1 && wrapGeom.bbox.minX <= columns[0].l + dockThreshold;

  const textPool = customText + " " + customText;
  let cursor = 0;

  const lines = [];
  let splitRowCount = 0;
  let collisionLineCount = 0;
  let orphanSlotCount = 0;
  let minWrappedChars = Infinity;
  let wrappedLineCount = 0;

  const leftStartsByCol = [[], []];
  const rightEndsByCol = [[], []];
  const wrappedRightXs = [];
  const wrappedLeftXs = [];
  const concaveTrapSlots = [];

  for (let c = 0; c < columns.length; c++) {
    const colDef = columns[c];
    for (let r = 0; r < rows; r++) {
      const yTop = padTop + r * lineH;
      const yBot = yTop + fontSize * 1.05;
      const yMid = yTop + fontSize * 0.55;

      let excls =
        state.wrapMode === "ring"
          ? []
          : bandExclusions(wrapGeom, yTop - 1, yBot + 1, state.marginPx, state.wrapMode);

      // 单栏贴边浮动封堵外侧与纸边之间的死缝（不影响主体朝向正文一侧的轮廓起伏！）
      if (state.cols === 1 && excls.length) {
        if (singleDockRight && !singleDockLeft) {
          excls = [[excls[0][0], colDef.r + 2]];
        } else if (singleDockLeft && !singleDockRight) {
          excls = [[colDef.l - 2, excls[excls.length - 1][1]]];
        }
      }

      const rawSlots = subtractIntervals(colDef.l, colDef.r, excls);
      const usableSlots = rawSlots.filter(([a, b]) => b - a >= fontSize * 1.15);
      const wasAffected = excls.some(([el, er]) => er > colDef.l && el < colDef.r);

      const rawBodyExcls = bandExclusions(visualGeom, yTop - 1, yBot + 1, 0, "contour");
      const bridgedExcls = bandExclusions(bridgedGeom, yTop - 1, yBot + 1, state.marginPx, "contour");

      if (usableSlots.length >= 2 && wasAffected) {
        splitRowCount++;
      }

      for (let s = 0; s < usableSlots.length; s++) {
        const [sx0, sx1] = usableSlots[s];
        const slotW = sx1 - sx0;
        const filled = fillSlot(textPool, cursor, slotW, fontSize);
        if (!filled.str.length) continue;
        cursor = filled.nextCursor;
        if (cursor >= customText.length) cursor = cursor % customText.length;

        const charCount = [...filled.str].length;
        const textEnd = sx0 + filled.width;

        // 真实最小文字—实体边缘水平净距
        let minGap = Infinity;
        for (let b = 0; b < rawBodyExcls.length; b++) {
          const [bl, br] = rawBodyExcls[b];
          if (textEnd <= bl) minGap = Math.min(minGap, bl - textEnd);
          else if (sx0 >= br) minGap = Math.min(minGap, sx0 - br);
          else minGap = Math.min(minGap, 0);
        }

        const isCollision = wasAffected && minGap < 5.5;
        if (isCollision) collisionLineCount++;

        const isOrphan = wasAffected && charCount < 5;
        if (isOrphan) orphanSlotCount++;

        // 凹口捕字检测：
        // 1) 被夹在两块实体轮廓之间；或 2) 钻进了深裂口内部（末端深入平滑桥接外包络超过 1.3 倍字宽！）
        let trappedInNotch = false;
        if (!state.bridge && state.wrapMode === "contour" && wasAffected) {
          if (
            rawBodyExcls.length >= 2 &&
            sx0 >= rawBodyExcls[0][0] &&
            sx1 <= rawBodyExcls[rawBodyExcls.length - 1][1]
          ) {
            trappedInNotch = true;
          } else if (bridgedExcls.length) {
            const [bl, br] = bridgedExcls[0];
            if (textEnd > bl + fontSize * 1.35 && sx0 < bl) trappedInNotch = true;
            if (sx0 < br - fontSize * 1.35 && textEnd > br) trappedInNotch = true;
          }
        }
        if (trappedInNotch) {
          concaveTrapSlots.push({ x0: sx0, x1: sx1, textEnd, yTop, yBot, str: filled.str });
        }

        if (wasAffected) {
          wrappedLineCount++;
          if (charCount < minWrappedChars) minWrappedChars = charCount;
          if (sx0 > colDef.l + 2) wrappedLeftXs.push(sx0);
          if (sx1 < colDef.r - 2) wrappedRightXs.push(sx1);
        }

        const isSplit = usableSlots.length >= 2 && wasAffected;
        const splitBridge =
          isSplit && s === 0 ? { x0: textEnd, x1: usableSlots[1][0], y: yMid } : null;

        lines.push({
          col: c,
          row: r,
          yTop,
          yMid,
          yBot,
          x0: sx0,
          x1: sx1,
          textEnd,
          text: filled.str,
          charCount,
          wasAffected,
          isSplit,
          splitBridge,
          isCollision,
          isOrphan,
          trappedInNotch,
          minGap: Number.isFinite(minGap) ? Math.round(minGap * 10) / 10 : null,
        });

        if (s === 0) {
          leftStartsByCol[c].push({ row: r, x0: sx0, affected: wasAffected });
          rightEndsByCol[c].push({ row: r, x1: sx1, affected: wasAffected });
        }
      }
    }
  }

  // ---------- 计算单真源量化指标 ----------
  let leftSpanMax = 0;
  let leftMaxStep = 0;
  let leftAffectedStep = 0;
  for (let c = 0; c < columns.length; c++) {
    const arr = leftStartsByCol[c];
    if (arr.length < 2) continue;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i].x0;
      if (x < mn) mn = x;
      if (x > mx) mx = x;
      if (i > 0 && arr[i].row === arr[i - 1].row + 1) {
        const step = Math.abs(x - arr[i - 1].x0);
        if (step > leftMaxStep) leftMaxStep = step;
        // 排除圆顶/圆底首尾切线行，仅测侧壁内部相邻行的真实折角跳变
        const interior =
          i >= 2 &&
          i + 1 < arr.length &&
          arr[i - 2].affected &&
          arr[i - 1].affected &&
          arr[i].affected &&
          arr[i + 1].affected;
        if (interior && step > leftAffectedStep) {
          leftAffectedStep = step;
        }
      }
    }
    const span = mx - mn;
    if (span > leftSpanMax) leftSpanMax = span;
  }

  // 如果单栏发生跨图劈栏，右半段起点同样是跳动锯齿
  let splitRightSpan = 0;
  if (splitRowCount > 0) {
    const secondSlots = lines.filter((l) => l.isSplit && !l.splitBridge);
    if (secondSlots.length >= 2) {
      const xs = secondSlots.map((l) => l.x0);
      splitRightSpan = Math.max(...xs) - Math.min(...xs);
    }
  }

  const activeEdgeXs = wrappedRightXs.length >= wrappedLeftXs.length ? wrappedRightXs : wrappedLeftXs;
  let edgeStd = 0;
  let edgeRange = 0;
  if (activeEdgeXs.length >= 3) {
    const mean = activeEdgeXs.reduce((a, b) => a + b, 0) / activeEdgeXs.length;
    const variance = activeEdgeXs.reduce((a, b) => a + (b - mean) ** 2, 0) / activeEdgeXs.length;
    edgeStd = Math.sqrt(variance);
    edgeRange = Math.max(...activeEdgeXs) - Math.min(...activeEdgeXs);
  }

  const boxArea =
    (visualGeom.bbox.maxX - visualGeom.bbox.minX) * (visualGeom.bbox.maxY - visualGeom.bbox.minY);
  let polyArea = 0;
  const vpts = visualGeom.pts;
  for (let i = 0, j = vpts.length - 1; i < vpts.length; j = i++) {
    polyArea += (vpts[j][0] + vpts[i][0]) * (vpts[j][1] - vpts[i][1]);
  }
  polyArea = Math.abs(polyArea) * 0.5;
  const deadCornerPct = boxArea > 1 ? Math.round(((boxArea - polyArea) / boxArea) * 100) : 0;

  // ---------- 4 项单真源过关审核 + 7 类双向错态分级 ----------
  const isRing = state.wrapMode === "ring";
  const isBox = state.wrapMode === "box";

  const marginTooTight = state.marginPx < 6 || collisionLineCount > 0;
  const marginTooWide = state.marginPx > 28;
  const hasSplit = splitRowCount > 0;
  const hasNotchTrap = concaveTrapSlots.length > 0;
  const hasOrphan = orphanSlotCount > 0;
  const tooFewWrapped = wrappedLineCount < 4;
  const flatCurve = isBox || edgeRange < fontSize * 0.72 || edgeStd < fontSize * 0.20;

  // 左起行稳定性判据：
  // - 单栏时，左起行必须平齐稳固；若主体压在左缘造成左起点大起大落，或中间劈栏造成右半行起点剧烈跳动，即判失锚。
  // - 双栏中缝时，左栏左缘必须平齐，右栏左缘允许柔和跟随桥接平滑后的瓶身弧线（禁止未桥接陡跳或把左栏压歪）。
  const col0Span = (() => {
    const a = leftStartsByCol[0];
    if (a.length < 2) return 0;
    const xs = a.map((p) => p.x0);
    return Math.max(...xs) - Math.min(...xs);
  })();

  const leftJagged =
    state.cols === 1
      ? (leftSpanMax > fontSize * 1.6 && leftMaxStep > fontSize * 0.32) || splitRightSpan > fontSize * 1.4
      : col0Span > fontSize * 1.2 || leftAffectedStep > fontSize * 2.35 || (!state.bridge && leftAffectedStep > fontSize * 1.25);

  const checks = {
    hug: !isRing && !isBox && !tooFewWrapped && !flatCurve && !marginTooWide && !hasSplit,
    avoid: !isRing && !marginTooTight && !marginTooWide,
    rhythm: !isRing && !hasSplit && !hasNotchTrap && !hasOrphan,
    anchor: !isRing && !leftJagged,
  };

  const passCount = Object.values(checks).filter(Boolean).length;

  let faultId = "ok";
  let badge = "4/4 · 绕排成立";
  let headline = "文字沿轮廓呼吸，起行稳固、节奏顺畅";
  let why = "";
  let fix = "试着换另外两枚剪影、拉远边距看脱形，或切双栏试试中缝夹嵌解。";
  let grade = "舒朗呼吸（示意）";

  if (isRing) {
    faultId = "ring";
    badge = "对照 · 原海报环边";
    headline = "单行沿边转圈，本质更接近「191 路径文字」";
    why =
      "这是 182 原海报为了在一张图里直观强调『贴边』而借用的单行环绕修辞：吸睛但底部倒挂，适合极短标语，多行正文绝不能这样转着读。";
    fix = "在排印参数栏切回「轮廓绕排 182」，看真正可顺畅阅读的多行水平贴边排法。";
    grade = "装饰环边（示意）";
  } else if (hasSplit) {
    faultId = "split";
    badge = `${passCount}/4 · 跨图劈栏`;
    headline = `主体硬劈正文中间，${splitRowCount} 行被迫跨图跳读`;
    why = `同一行文字被图形生生截成左右两段${marginTooTight ? `，且 0px 边距让 ${collisionLineCount} 行直接啃进瓶身` : ""}。读者视线必须越过整块橘红图形再去接后半句，语义立刻断裂。`;
    fix = "把主体直接往右拖靠栏缘（保住左侧齐整起行），或切到「双栏中缝」让它稳坐两栏之间。";
    grade = "跨图断句（示意）";
  } else if (marginTooTight) {
    faultId = "tight";
    badge = `${passCount}/4 · 啃边撞字`;
    headline = `绕排边距仅 ${Math.round(state.marginPx)}px，${Math.max(1, collisionLineCount)} 行文字啃进主体边缘`;
    why =
      "文字笔画与高饱和柿红轮廓贴死在一起，眼底图底边界打架，既破坏器物剪影的利落感，又让贴边那几个字难以辨认。";
    fix = "向外拖动主体边缘的橘红圆珠（或右推呼吸距滑柄）到 12–20px（约 0.8–1.2 字宽）。";
    grade = "图文粘连（示意）";
  } else if (hasNotchTrap) {
    faultId = "notch";
    badge = `${passCount}/4 · 凹口吞字`;
    headline = `${concaveTrapSlots.length} 行碎词钻进深裂口，形成阅读死角`;
    why =
      "自然叶片的深裂口把文字吸进了狭窄凹袋里，相邻行长突兀伸缩，读到这里视线会突然顿住——真实排版绝不让正文钻进图形窄缝。";
    fix = "打开「凹口桥接」，用柔和外包络封住深裂口，只让正文顺着大外缘流动。";
    grade = "凹口捕字（示意）";
  } else if (leftJagged) {
    faultId = "jagged";
    badge = `${passCount}/4 · 左缘锯齿`;
    headline = `左起行横向跳动达 ${Math.round(Math.max(leftSpanMax, splitRightSpan))}px，换行回扫频频丢行`;
    why =
      "中文横排从左向右读，读者每读完一行都要回扫寻找下一行开头。把异形轮廓压在左起行侧，等于每换一行就挪一次起跑线。";
    fix = "把主体拖靠右缘（做左齐右绕），让曲线起伏落在行尾而不是行首。";
    grade = "起行失锚（示意）";
  } else if (hasOrphan) {
    faultId = "orphan";
    badge = `${passCount}/4 · 窄缝孤字`;
    headline = `被挤出 ${orphanSlotCount} 处短残行（最窄仅 ${minWrappedChars} 字）`;
    why =
      "主体侵入栏宽过深，剩给文字的通道太窄，连续出现二三字碎行会打断语块，整段节奏变得急促磕绊。";
    fix = "把主体稍微往栏外挪开一点，或收紧过大边距，确保每条绕排通道至少容纳 5 字以上。";
    grade = "碎行卡顿（示意）";
  } else if (isBox) {
    faultId = "box";
    badge = `${passCount}/4 · 退化矩形`;
    headline = `方形围盒吃掉 ${deadCornerPct}% 边角空间，曲线消失`;
    why =
      "文字只沿着看不见的方形外框垂直切齐，主体细腰与弧肩外侧留出大片死白三角——这已经滑向了 183 矩形绕排。";
    fix = "切回「轮廓绕排 182」，把矩形死白还给正文，让文字真贴着主体曲线流。";
    grade = "方框死白（示意）";
  } else if (marginTooWide) {
    faultId = "wide";
    badge = `${passCount}/4 · 过松脱形`;
    headline = `绕排边距撑到 ${Math.round(state.marginPx)}px，轮廓起伏已被抹平`;
    why =
      "缓冲区远远大过字号本身，原本灵动的瓶颈与凹弧全被外扩成一道模糊的钝墙，图文之间失去了彼此呼应的张力。";
    fix = "向内收紧橘红圆珠（或左拉滑柄）回到 10–24px，重新找回贴边呼应感。";
    grade = "过度疏离（示意）";
  } else if (tooFewWrapped || flatCurve) {
    faultId = "detached";
    badge = `${passCount}/4 · 未形成绕排`;
    headline = "主体离开正文太远，尚未对文字形成轮廓牵引";
    why = `当前只有 ${wrappedLineCount} 行文字碰触到绕排包络，主体与字块各占一隅，没有产生图文避让与节奏起伏。`;
    fix = "把主体轻轻拖近文字栏右缘（或双栏中缝），让 6 行以上正文顺着轮廓起伏。";
    grade = "图文脱节（示意）";
  } else {
    if (state.cols === 2) {
      headline = "双栏中缝夹嵌成立：各守其栏、绝不跨图跳读";
      why = `左栏收尾与右栏微弧贴合${SHAPES[state.shape].sub}轮廓，留出 ${Math.round(state.marginPx)}px 呼吸距，行长起伏 ${Math.round(edgeRange)}px，释放了矩形框下 ${deadCornerPct}% 的边角死白。`;
      grade = "跨栏共生（示意）";
    } else if (state.shape === "leaf") {
      headline = "龟背叶外包络桥接成立：既留叶韵、又防吞字";
      why = `外包络封住了叶片深裂口，${wrappedLineCount} 行正文以 ${Math.round(state.marginPx)}px 呼吸距顺势绕流，左起行稳如锚链，最窄行仍有 ${minWrappedChars} 字。`;
      grade = "自然韵律（示意）";
    } else {
      headline = "左齐右绕典范成立：起行稳固、行尾随瓶身起伏";
      why = `左起行零抖动承接换行回扫，右缘 ${wrappedLineCount} 行随${SHAPES[state.shape].sub}曲线柔和起伏 ${Math.round(edgeRange)}px，${Math.round(state.marginPx)}px 缓冲距让图字各自透气。`;
      grade = "呼吸贴边（示意）";
    }
  }

  return {
    box: { W, H, padX, padTop, padBot, innerW, innerH, gutter, fontSize, lineH, rows },
    columns,
    cxPx,
    cyPx,
    rx,
    ry,
    visualGeom,
    wrapGeom,
    envelopePts,
    lines,
    concaveTrapSlots,
    metrics: {
      passCount,
      wrappedLineCount,
      splitRowCount,
      collisionLineCount,
      orphanSlotCount,
      minWrappedChars: Number.isFinite(minWrappedChars) ? minWrappedChars : 0,
      leftSpanMax: Math.round(Math.max(leftSpanMax, splitRightSpan)),
      edgeRange: Math.round(edgeRange),
      edgeStd: Math.round(edgeStd * 10) / 10,
      deadCornerPct,
      marginPx: Math.round(state.marginPx),
      marginEm: Math.round((state.marginPx / fontSize) * 100) / 100,
    },
    checks,
    diagnosis: { faultId, badge, headline, why, fix, grade },
  };
}
