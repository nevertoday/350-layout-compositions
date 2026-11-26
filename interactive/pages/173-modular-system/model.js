// 173 模块系统 · 单真源几何与诊断引擎
// 画布绘制、实测读数、三大原则探针、白话诊单全部从此文件同一组实绘矩形算出。

export const FORMATS = {
  "4x4": { cols: 4, rows: 4, label: "4×4 方阵", ratioText: "1:1 方阵" },
  "3x5": { cols: 3, rows: 5, label: "3×5 竖海报", ratioText: "3:5 竖版" },
  "6x3": { cols: 6, rows: 3, label: "6×3 横展板", ratioText: "2:1 横版" },
};

export const SPECIMENS = {
  poster: {
    label: "原海报·方阵",
    tags: {
      "hero-circle": ["视觉中心", "CORE 2×2"],
      gold: ["赭金锚点", "FOCUS"],
      dots: ["点阵韵律", "MATRIX"],
      teal: ["基础模块", "UNIT"],
    },
  },
  bento: {
    label: "便当盒·产品",
    tags: {
      "hero-circle": ["旗舰架构", "PRO CORE"],
      gold: ["核心卖点", "KEY SPEC"],
      dots: ["芯片算力", "NEURAL"],
      teal: ["功能单元", "MODULE"],
    },
  },
  editorial: {
    label: "展讯·画册",
    tags: {
      "hero-circle": ["主展主题", "EXHIBITION"],
      gold: ["展期排期", "09–11月"],
      dots: ["索引目录", "INDEX"],
      teal: ["图文栏块", "ARTICLE"],
    },
  },
};

export const ROLES = ["teal", "gold", "dots", "hero-circle"];
export const ROLE_NAMES = {
  teal: "松绿模块",
  gold: "赭金焦点",
  dots: "金点阵",
  "hero-circle": "金圆主块",
};

const cloneTiles = (list) =>
  list.map((t) => ({
    ...t,
    jitter: t.jitter ? { ...t.jitter } : { l: 0, t: 0, r: 0, b: 0 },
  }));

// 开场默认 0/4 散尺叠压坏态：非整数宽/高、局部重叠撞块、乱缝、体量拉平且三块碎金抢戏、残洞偏高
export function makeBrokenState(format = "4x4", specimen = "poster") {
  const { cols, rows } = FORMATS[format];
  if (format === "3x5") {
    return {
      format,
      specimen,
      cols,
      rows,
      unitLock: false,
      uniformGap: false,
      gapPx: 10,
      showGrid: true,
      selectedId: "t5",
      highlightPillar: null,
      tiles: cloneTiles([
        { id: "t1", gx: 0.04, gy: 0.02, gw: 1.28, gh: 1.04, role: "teal", jitter: { l: 0, t: 0, r: -4, b: 2 } },
        { id: "t2", gx: 1.48, gy: 0.06, gw: 1.38, gh: 0.96, role: "gold", jitter: { l: 5, t: 2, r: -2, b: 0 } },
        { id: "t3", gx: 0.02, gy: 1.24, gw: 1.18, gh: 1.22, role: "dots", jitter: { l: -2, t: 4, r: 4, b: -2 } },
        { id: "t4", gx: 1.62, gy: 1.18, gw: 1.26, gh: 1.14, role: "gold", jitter: { l: 4, t: -3, r: -2, b: 2 } },
        { id: "t5", gx: 0.88, gy: 2.12, gw: 1.24, gh: 1.12, role: "gold", jitter: { l: -4, t: -5, r: 6, b: 4 } },
        { id: "t6", gx: 1.88, gy: 2.48, gw: 1.06, gh: 1.18, role: "hero-circle", jitter: { l: -6, t: 0, r: 2, b: -3 } },
        { id: "t7", gx: 0.06, gy: 3.52, gw: 1.24, gh: 1.16, role: "teal", jitter: { l: 0, t: 6, r: -3, b: 0 } },
        { id: "t8", gx: 1.54, gy: 3.74, gw: 1.28, gh: 1.08, role: "gold", jitter: { l: 6, t: 2, r: -4, b: 0 } },
      ]),
    };
  }
  if (format === "6x3") {
    return {
      format,
      specimen,
      cols,
      rows,
      unitLock: false,
      uniformGap: false,
      gapPx: 10,
      showGrid: true,
      selectedId: "t5",
      highlightPillar: null,
      tiles: cloneTiles([
        { id: "t1", gx: 0.04, gy: 0.02, gw: 1.38, gh: 1.12, role: "teal", jitter: { l: 0, t: 0, r: 4, b: -2 } },
        { id: "t2", gx: 1.66, gy: 0.08, gw: 1.24, gh: 0.96, role: "gold", jitter: { l: 6, t: 2, r: -2, b: 2 } },
        { id: "t3", gx: 3.12, gy: 0.00, gw: 1.32, gh: 1.08, role: "dots", jitter: { l: -4, t: 0, r: 3, b: -3 } },
        { id: "t4", gx: 4.58, gy: 0.06, gw: 1.28, gh: 1.14, role: "gold", jitter: { l: 5, t: -2, r: -3, b: 2 } },
        { id: "t5", gx: 2.38, gy: 1.02, gw: 1.26, gh: 1.04, role: "gold", jitter: { l: -6, t: -6, r: 6, b: 4 } },
        { id: "t6", gx: 0.08, gy: 1.38, gw: 1.42, gh: 1.34, role: "teal", jitter: { l: 2, t: 5, r: -4, b: 0 } },
        { id: "t7", gx: 3.44, gy: 1.28, gw: 1.38, gh: 1.38, role: "hero-circle", jitter: { l: -6, t: 0, r: 3, b: 0 } },
        { id: "t8", gx: 4.86, gy: 1.46, gw: 1.08, gh: 1.26, role: "gold", jitter: { l: 4, t: 6, r: -2, b: 0 } },
      ]),
    };
  }
  // 默认 4×4：中心位置 (1.42, 1.40) 正好放 t5 焦点金块，便于直接拖拽且与 t6 发生真实碰撞
  return {
    format: "4x4",
    specimen,
    cols: 4,
    rows: 4,
    unitLock: false,
    uniformGap: false,
    gapPx: 10,
    showGrid: true,
    selectedId: "t5",
    highlightPillar: null,
    tiles: cloneTiles([
      { id: "t1", gx: 0.00, gy: 0.00, gw: 1.38, gh: 0.92, role: "teal", jitter: { l: 0, t: 0, r: -3, b: 2 } },
      { id: "t2", gx: 1.62, gy: 0.06, gw: 1.06, gh: 0.88, role: "dots", jitter: { l: 6, t: 2, r: -4, b: 0 } },
      { id: "t3", gx: 2.86, gy: 0.00, gw: 1.10, gh: 1.04, role: "gold", jitter: { l: 4, t: 0, r: -2, b: 3 } },
      { id: "t4", gx: 0.04, gy: 1.14, gw: 1.12, gh: 1.24, role: "teal", jitter: { l: 2, t: 5, r: -3, b: 0 } },
      { id: "t5", gx: 1.36, gy: 1.32, gw: 1.26, gh: 1.18, role: "gold", jitter: { l: -5, t: -4, r: 8, b: 4 } },
      { id: "t6", gx: 2.42, gy: 1.26, gw: 1.34, gh: 1.22, role: "hero-circle", jitter: { l: -6, t: 0, r: 3, b: -2 } },
      { id: "t7", gx: 0.00, gy: 2.66, gw: 1.24, gh: 1.16, role: "gold", jitter: { l: 0, t: 6, r: -4, b: 0 } },
      { id: "t8", gx: 1.54, gy: 2.78, gw: 1.16, gh: 1.04, role: "gold", jitter: { l: 6, t: 3, r: -2, b: 0 } },
      { id: "t9", gx: 2.88, gy: 2.72, gw: 1.06, gh: 1.14, role: "teal", jitter: { l: 4, t: 4, r: 0, b: -2 } },
    ]),
  };
}

// 多组合法解（全部按实绘几何自然拿满 4/4）
export function makeSolutionState(kind = "poster", format = "4x4", specimen = "poster") {
  const { cols, rows } = FORMATS[format];
  const base = {
    format,
    specimen,
    cols,
    rows,
    unitLock: true,
    uniformGap: true,
    gapPx: 10,
    showGrid: true,
    highlightPillar: null,
  };

  if (format === "3x5") {
    return {
      ...base,
      selectedId: "s4",
      tiles: cloneTiles([
        { id: "s1", gx: 0, gy: 0, gw: 2, gh: 1, role: "teal" },
        { id: "s2", gx: 2, gy: 0, gw: 1, gh: 1, role: "gold" },
        { id: "s3", gx: 0, gy: 1, gw: 1, gh: 2, role: "dots" },
        { id: "s4", gx: 1, gy: 1, gw: 2, gh: 2, role: "hero-circle" },
        { id: "s5", gx: 0, gy: 3, gw: 2, gh: 1, role: "teal" },
        { id: "s6", gx: 2, gy: 3, gw: 1, gh: 2, role: "teal" },
        { id: "s7", gx: 0, gy: 4, gw: 1, gh: 1, role: "gold" },
        { id: "s8", gx: 1, gy: 4, gw: 1, gh: 1, role: "teal" },
      ]),
    };
  }

  if (format === "6x3") {
    return {
      ...base,
      selectedId: "w4",
      tiles: cloneTiles([
        { id: "w1", gx: 0, gy: 0, gw: 2, gh: 1, role: "teal" },
        { id: "w2", gx: 2, gy: 0, gw: 1, gh: 1, role: "dots" },
        { id: "w3", gx: 3, gy: 0, gw: 1, gh: 1, role: "gold" },
        { id: "w4", gx: 4, gy: 0, gw: 2, gh: 2, role: "hero-circle" },
        { id: "w5", gx: 0, gy: 1, gw: 1, gh: 2, role: "teal" },
        { id: "w6", gx: 1, gy: 1, gw: 2, gh: 1, role: "gold" },
        { id: "w7", gx: 3, gy: 1, gw: 1, gh: 2, role: "teal" },
        { id: "w8", gx: 1, gy: 2, gw: 2, gh: 1, role: "teal" },
        { id: "w9", gx: 4, gy: 2, gw: 1, gh: 1, role: "gold" },
        { id: "w10", gx: 5, gy: 2, gw: 1, gh: 1, role: "teal" },
      ]),
    };
  }

  if (kind === "bento") {
    return {
      ...base,
      selectedId: "b1",
      tiles: cloneTiles([
        { id: "b1", gx: 0, gy: 0, gw: 2, gh: 2, role: "hero-circle" },
        { id: "b2", gx: 2, gy: 0, gw: 2, gh: 1, role: "gold" },
        { id: "b3", gx: 2, gy: 1, gw: 1, gh: 1, role: "dots" },
        { id: "b4", gx: 3, gy: 1, gw: 1, gh: 2, role: "teal" },
        { id: "b5", gx: 0, gy: 2, gw: 1, gh: 1, role: "gold" },
        { id: "b6", gx: 1, gy: 2, gw: 2, gh: 1, role: "teal" },
        { id: "b7", gx: 0, gy: 3, gw: 2, gh: 1, role: "teal" },
        { id: "b8", gx: 2, gy: 3, gw: 1, gh: 1, role: "teal" },
        { id: "b9", gx: 3, gy: 3, gw: 1, gh: 1, role: "dots" },
      ]),
    };
  }

  if (kind === "diagonal") {
    return {
      ...base,
      selectedId: "d4",
      tiles: cloneTiles([
        { id: "d1", gx: 0, gy: 0, gw: 1, gh: 1, role: "gold" },
        { id: "d2", gx: 1, gy: 0, gw: 2, gh: 1, role: "teal" },
        { id: "d3", gx: 3, gy: 0, gw: 1, gh: 2, role: "dots" },
        { id: "d4", gx: 0, gy: 1, gw: 2, gh: 2, role: "hero-circle" },
        { id: "d5", gx: 2, gy: 1, gw: 1, gh: 2, role: "teal" },
        { id: "d6", gx: 3, gy: 2, gw: 1, gh: 1, role: "gold" },
        { id: "d7", gx: 0, gy: 3, gw: 1, gh: 1, role: "teal" },
        { id: "d8", gx: 1, gy: 3, gw: 1, gh: 1, role: "gold" },
        { id: "d9", gx: 2, gy: 3, gw: 2, gh: 1, role: "teal" },
      ]),
    };
  }

  // 默认：1:1 复刻 173 原海报右上 4×4 方阵经典解
  return {
    ...base,
    selectedId: "p7",
    tiles: cloneTiles([
      { id: "p1", gx: 0, gy: 0, gw: 2, gh: 1, role: "teal" },
      { id: "p2", gx: 2, gy: 0, gw: 1, gh: 1, role: "dots" },
      { id: "p3", gx: 3, gy: 0, gw: 1, gh: 1, role: "gold" },
      { id: "p4", gx: 0, gy: 1, gw: 1, gh: 2, role: "teal" },
      { id: "p5", gx: 1, gy: 1, gw: 1, gh: 1, role: "gold" },
      { id: "p6", gx: 1, gy: 2, gw: 1, gh: 1, role: "teal" },
      { id: "p7", gx: 2, gy: 1, gw: 2, gh: 2, role: "hero-circle" },
      { id: "p8", gx: 0, gy: 3, gw: 2, gh: 1, role: "teal" },
      { id: "p9", gx: 2, gy: 3, gw: 1, gh: 1, role: "gold" },
      { id: "p10", gx: 3, gy: 3, gw: 1, gh: 1, role: "teal" },
    ]),
  };
}

// 反向试错预设（用来证明「按满」或「过头」也会真实翻车）
export function makeAntiPreset(kind, format = "4x4", specimen = "poster") {
  const sol = makeSolutionState("poster", format, specimen);
  if (kind === "monotony") {
    const tiles = [];
    let k = 1;
    for (let y = 0; y < sol.rows; y++) {
      for (let x = 0; x < sol.cols; x++) {
        const role = (x === 1 && y === 1) || (x === sol.cols - 1 && y === 0) ? "gold" : x === 2 && y === 0 ? "dots" : "teal";
        tiles.push({ id: `m${k++}`, gx: x, gy: y, gw: 1, gh: 1, role, jitter: { l: 0, t: 0, r: 0, b: 0 } });
      }
    }
    return { ...sol, selectedId: "m6", tiles };
  }
  if (kind === "welded") {
    return { ...sol, gapPx: 0 };
  }
  if (kind === "canyon") {
    return { ...sol, gapPx: 24 };
  }
  if (kind === "gold-flood") {
    return {
      ...sol,
      tiles: sol.tiles.map((t, i) => ({
        ...t,
        role: i % 4 === 1 ? "teal" : "gold",
      })),
    };
  }
  return sol;
}

// 统一计算画布上的基准板面与每个模块的真实绘制像素矩形
export function computeGeometry(state, canvasW, canvasH) {
  const padX = Math.max(18, Math.round(canvasW * 0.05));
  const padTop = Math.max(24, Math.round(canvasH * 0.068));
  const padBot = Math.max(28, Math.round(canvasH * 0.088));
  const availW = Math.max(120, canvasW - padX * 2);
  const availH = Math.max(120, canvasH - padTop - padBot);

  const { cols, rows } = state;
  // 保持每个 1×1 模块严格为正方形，按容器居中落位
  const gap = state.gapPx;
  const maxUnitW = (availW - (cols - 1) * gap) / cols;
  const maxUnitH = (availH - (rows - 1) * gap) / rows;
  const unit = Math.max(16, Math.min(maxUnitW, maxUnitH));

  const boardW = cols * unit + (cols - 1) * gap;
  const boardH = rows * unit + (rows - 1) * gap;
  const bx = (canvasW - boardW) / 2;
  const by = padTop + (availH - boardH) / 2;
  const step = unit + gap;

  const rects = state.tiles.map((t) => {
    const j = state.uniformGap ? { l: 0, t: 0, r: 0, b: 0 } : (t.jitter || { l: 0, t: 0, r: 0, b: 0 });
    const x = bx + t.gx * step + j.l;
    const y = by + t.gy * step + j.t;
    const w = Math.max(16, t.gw * unit + Math.max(0, t.gw - 1) * gap + j.r);
    const h = Math.max(16, t.gh * unit + Math.max(0, t.gh - 1) * gap + j.b);
    return { ...t, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  });

  return { bx, by, boardW, boardH, unit, gap, step, rects };
}

// 从同一组实绘矩形做完整双向几何审核（单真源）
export function evaluate(state, canvasW = 620, canvasH = 490) {
  const geo = computeGeometry(state, canvasW, canvasH);
  const { rects, bx, by, boardW, boardH, unit } = geo;

  // 1. 模数误差与碰撞检测
  let maxSnapErr = 0;
  let offModulusCount = 0;
  let outOfBoundsCount = 0;
  const offModulusIds = [];

  for (const r of rects) {
    const err = Math.max(
      Math.abs(r.gx - Math.round(r.gx)),
      Math.abs(r.gy - Math.round(r.gy)),
      Math.abs(r.gw - Math.round(r.gw)),
      Math.abs(r.gh - Math.round(r.gh))
    );
    if (err > maxSnapErr) maxSnapErr = err;
    if (err > 0.045) {
      offModulusCount++;
      offModulusIds.push(r.id);
    }
    if (r.x < bx - 3 || r.y < by - 3 || r.x + r.w > bx + boardW + 3 || r.y + r.h > by + boardH + 3) {
      outOfBoundsCount++;
    }
  }

  const overlaps = [];
  let maxOverlapPx = 0;
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const ox1 = Math.max(a.x, b.x);
      const oy1 = Math.max(a.y, b.y);
      const ox2 = Math.min(a.x + a.w, b.x + b.w);
      const oy2 = Math.min(a.y + a.h, b.y + b.h);
      if (ox2 - ox1 > 1.5 && oy2 - oy1 > 1.5) {
        const depth = Math.min(ox2 - ox1, oy2 - oy1);
        maxOverlapPx = Math.max(maxOverlapPx, depth);
        overlaps.push({
          a: a.id,
          b: b.id,
          x: ox1,
          y: oy1,
          w: ox2 - ox1,
          h: oy2 - oy1,
          depth,
        });
      }
    }
  }

  // 2. 邻块实际缝隙测量
  const seams = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      // 水平相邻（纵坐标重叠超过 20% 单元）
      const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (yOverlap > unit * 0.22) {
        const left = a.x < b.x ? a : b;
        const right = a.x < b.x ? b : a;
        const g = right.x - (left.x + left.w);
        if (g >= -1.5 && g < unit * 0.72) {
          seams.push({
            dir: "v",
            gap: Math.max(0, g),
            x1: left.x + left.w,
            x2: right.x,
            ym: (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2,
          });
        }
      }
      // 垂直相邻（横坐标重叠超过 20% 单元）
      const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      if (xOverlap > unit * 0.22) {
        const top = a.y < b.y ? a : b;
        const bot = a.y < b.y ? b : a;
        const g = bot.y - (top.y + top.h);
        if (g >= -1.5 && g < unit * 0.72) {
          seams.push({
            dir: "h",
            gap: Math.max(0, g),
            y1: top.y + top.h,
            y2: bot.y,
            xm: (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2,
          });
        }
      }
    }
  }

  const gapValues = seams.map((s) => s.gap);
  const minGapPx = gapValues.length ? Math.min(...gapValues) : state.gapPx;
  const maxGapPx = gapValues.length ? Math.max(...gapValues) : state.gapPx;
  const avgGapPx = gapValues.length ? gapValues.reduce((s, v) => s + v, 0) / gapValues.length : state.gapPx;
  const gapSpreadPx = maxGapPx - minGapPx;
  const gapRatio = avgGapPx / Math.max(1, unit);

  const gapInconsistent = gapSpreadPx > 2.6 || (!state.uniformGap && gapSpreadPx > 1.8);
  const gapWelded = state.gapPx < 4 || (gapValues.length > 0 && avgGapPx < 4);
  const gapShattered = state.gapPx > 20 || gapRatio > 0.24;

  // 3. 比例变化与焦点占比（全部从实际绘制面积核算）
  const areas = rects.map((r) => r.w * r.h);
  const totalTileArea = areas.reduce((s, a) => s + a, 0);
  const maxArea = areas.length ? Math.max(...areas) : 1;
  const minArea = areas.length ? Math.min(...areas) : 1;
  const areaRatio = maxArea / Math.max(1, minArea);

  const boardArea = boardW * boardH;
  const maxTileShare = maxArea / Math.max(1, boardArea);

  let goldWeightedArea = 0;
  for (const r of rects) {
    const a = r.w * r.h;
    if (r.role === "gold") goldWeightedArea += a;
    else if (r.role === "hero-circle") goldWeightedArea += a * 0.34;
    else if (r.role === "dots") goldWeightedArea += a * 0.08;
  }
  const goldShare = goldWeightedArea / Math.max(1, totalTileArea);

  const monotonyFlat = areaRatio < 1.75;
  const dominantSwallow = maxTileShare > 0.56;
  const noAccent = goldShare < 0.08;
  const goldFlood = goldShare > 0.44;

  // 4. 覆盖完整度与非模数残洞（以每格 4×4 细分采样核算真实可复用度，快且无重叠重复计数）
  const sub = 4;
  const gxN = state.cols * sub;
  const gyN = state.rows * sub;
  let coveredSamples = 0;
  const cellHits = Array.from({ length: state.rows }, () => Array(state.cols).fill(0));
  for (let sy = 0; sy < gyN; sy++) {
    const py = by + ((sy + 0.5) / gyN) * boardH;
    for (let sx = 0; sx < gxN; sx++) {
      const px = bx + ((sx + 0.5) / gxN) * boardW;
      let hit = false;
      for (const r of rects) {
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          hit = true;
          break;
        }
      }
      if (hit) {
        coveredSamples++;
        cellHits[Math.floor(sy / sub)][Math.floor(sx / sub)]++;
      }
    }
  }
  const totalSamples = gxN * gyN;
  const rawCoverage = coveredSamples / totalSamples;
  // 正常满铺时缝隙本身会占一点面积；换算成相对完整网格理论满铺的覆盖率
  const maxTheoreticalCoverage =
    (state.cols * unit * (state.rows * unit)) / Math.max(1, boardArea);
  const coverage = Math.min(1, rawCoverage / Math.max(0.5, maxTheoreticalCoverage));

  // 半覆盖的碎格（既没铺满也不是干净可插槽的空 1×1）计为不可复用的残洞
  let sliverCells = 0;
  let fullEmptyCells = 0;
  for (let cy = 0; cy < state.rows; cy++) {
    for (let cx = 0; cx < state.cols; cx++) {
      const h = cellHits[cy][cx];
      if (h === 0) fullEmptyCells++;
      else if (h > 0 && h < 11 && offModulusCount > 0) sliverCells++;
    }
  }
  const orphanVoidPct =
    offModulusCount > 0
      ? Math.max(sliverCells / (state.cols * state.rows), Math.max(0, 1 - coverage))
      : 0;

  // 四大条件独立判定
  const modulusOk = offModulusCount === 0 && overlaps.length === 0 && outOfBoundsCount === 0;
  const spacingOk = !gapInconsistent && !gapWelded && !gapShattered && overlaps.length === 0;
  const variationOk = !monotonyFlat && !dominantSwallow && !noAccent && !goldFlood;
  const scalabilityOk = modulusOk && coverage >= 0.72 && orphanVoidPct <= 0.06;

  const score = [modulusOk, spacingOk, variationOk, scalabilityOk].filter(Boolean).length;

  // 决定最核心的优先问题与白话诊单（为什么这样摆会出问题 + 具体动作）
  let code = "pass";
  let badge = "4/4 · 秩序成立";
  let headline = "标准单元、统一缝隙与跨格变化同时到位";
  let body = `当前 ${rects.length} 块模块严格落在整数倍基准格上，缝隙恒定 ${Math.round(avgGapPx)}px，最大与最小模块面积比 ${areaRatio.toFixed(2)}×，高光赭金占 ${Math.round(goldShare * 100)}%。现在点「+1 模块」或切换 3×5 / 6×3 画幅，结构依然严丝合缝。`;
  let hint = "试试点击「+1 模块」或切到 3×5 竖海报，验证可扩展性；也可试错全员 1×1 看反向翻车。";
  let actionLabel = "切到 3×5 竖海报验证扩展";
  let actionType = "reflow-3x5";

  if (overlaps.length > 0) {
    code = "overlap";
    badge = `${score}/4 · 撞块 ${overlaps.length} 处`;
    headline = `有 ${overlaps.length} 处模块直接重叠撞块（压入 ${Math.round(maxOverlapPx)}px）`;
    body = "模块系统的前提是每块单元各占清晰领地。一旦两块越界叠压，原本分隔信息的缝隙就消失了，文字和图形会在交界处互相抢话。";
    hint = "先开启「模数锁定」，再拖开重叠的模块，或直接点击下方按钮对齐基准网格。";
    actionLabel = "锁定模数并归整错块";
    actionType = "fix-modulus";
  } else if (offModulusCount > 0 || outOfBoundsCount > 0) {
    code = "off-modulus";
    badge = `${score}/4 · 散尺偏 ${maxSnapErr.toFixed(2)}u`;
    headline = `${offModulusCount} 块模块脱离了基准倍比（最大偏出 ${maxSnapErr.toFixed(2)}u）`;
    body = "每块宽高各凭感觉取了小数尺寸，上下左右的缝隙就永远对不成一条直线。版面瞬间退化成临时拼凑的贴纸墙，新增内容也插不进标准空位。";
    hint = "开启「模数锁定」并把散尺块吸附到整数倍单元（1×1、2×1、2×2）。";
    actionLabel = "开启模数锁定并吸附齐整";
    actionType = "fix-modulus";
  } else if (gapInconsistent) {
    code = "gap-uneven";
    badge = `${score}/4 · 乱缝差 ${Math.round(gapSpreadPx)}px`;
    headline = `模块缝隙宽窄不一（最窄 ${Math.round(minGapPx)}px，最宽 ${Math.round(maxGapPx)}px）`;
    body = "原海报要点直指「保持模块尺寸与间距的一致性」。缝隙忽窄忽宽会让眼睛误以为窄缝两侧是一组、宽缝外侧已断章，整页秩序立刻散架。";
    hint = "打开「统一缝隙」并把基准缝隙 g 调到 8–14px 的呼吸区间。";
    actionLabel = "统一基准缝隙至 10px";
    actionType = "fix-gap";
  } else if (gapWelded) {
    code = "gap-welded";
    badge = `${score}/4 · 缝隙糊死 ${Math.round(avgGapPx)}px`;
    headline = `模块缝隙压到 ${Math.round(avgGapPx)}px，相邻块糊成一片`;
    body = "缝隙不是浪费掉的空地，而是模块边界的呼吸通道。当缝隙小于 4px，相邻同色块会直接融成大色块，读者分不清哪块信息归哪块管。";
    hint = "向右拖动「基准缝隙 g」滑杆，拉开到 8–14px 建立清晰分隔。";
    actionLabel = "拉开基准缝隙到 10px";
    actionType = "fix-gap";
  } else if (gapShattered) {
    code = "gap-shattered";
    badge = `${score}/4 · 缝隙裂谷 ${Math.round(avgGapPx)}px`;
    headline = `模块缝隙撑到 ${Math.round(avgGapPx)}px，整版裂成漂浮孤岛`;
    body = "缝隙一旦超过模块自身宽度的五分之一（经验临界值），空隙面积就会反客为主，原本彼此咬合的模块群会散成互不相关的零碎小片。";
    hint = "把「基准缝隙 g」往回收回 8–14px，让模块重新咬合。";
    actionLabel = "收紧基准缝隙到 10px";
    actionType = "fix-gap";
  } else if (monotonyFlat) {
    code = "monotony";
    badge = `${score}/4 · 体量拉平 ${areaRatio.toFixed(2)}×`;
    headline = `所有模块体量几乎一样大（面积比仅 ${areaRatio.toFixed(2)}×）`;
    body = "秩序有了，变化死了！如果全页铺满同尺寸 1×1 方格，视线进来找不到第一落点，再整齐的版面也会像空白表格一样枯燥。";
    hint = "点选一块模块，点击「横向扩格」或「纵向扩格」拼出 2×1 或 2×2 主角块。";
    actionLabel = "合并一块 2×2 主角模块";
    actionType = "fix-variation";
  } else if (dominantSwallow) {
    code = "swallow";
    badge = `${score}/4 · 单块吞版 ${Math.round(maxTileShare * 100)}%`;
    headline = `单一模块吞掉了 ${Math.round(maxTileShare * 100)}% 版面，组合弹性消失`;
    body = "当一块巨型容器盖住大半画幅，其余单元只能贴边排成细条，版面退化成「一大图配页脚」，失去了模块系统可拆可换的灵活性。";
    hint = "选中那块最大模块并点击「拆回 1×1」，再重新组合出 2×2 主块与 2×1 副块。";
    actionLabel = "拆分巨块重建层次";
    actionType = "fix-variation";
  } else if (goldFlood) {
    code = "gold-flood";
    badge = `${score}/4 · 赭金过载 ${Math.round(goldShare * 100)}%`;
    headline = `高光赭金占到了 ${Math.round(goldShare * 100)}%，处处抢戏等于没有重点`;
    body = "赭金在深松青底上视觉重量极高。超过四成面积都刷成高光色时，眼球无处歇脚，原本用来指路的焦点信号被噪音淹没。";
    hint = "点选多余的赭金模块，点击「换角色」改回松绿或金点阵，把高光压回 15%–35%。";
    actionLabel = "收敛赭金比例至主次清晰";
    actionType = "fix-accent";
  } else if (noAccent) {
    code = "no-accent";
    badge = `${score}/4 · 缺少高光焦点`;
    headline = `高光占比仅 ${Math.round(goldShare * 100)}%，整版沉在同色底里`;
    body = "只有冷松绿块而没有高亮锚点时，视觉层级缺少发力点，读者需要逐格扫描才能定位核心信息。";
    hint = "点选关键模块，点击「换角色」设为「赭金焦点」或「金圆主块」。";
    actionLabel = "点亮核心赭金焦点";
    actionType = "fix-accent";
  } else if (!scalabilityOk) {
    code = "sparse";
    badge = `${score}/4 · 空洞过多`;
    headline = `当前有效覆盖仅 ${Math.round(coverage * 100)}%，版面空洞过多`;
    body = "克制的局部留白能呼吸，但超过四分之一格位空置且零散分布时，模块边界的整体外轮廓会塌陷，看起来像漏装了零件。";
    hint = "点击「+1 模块」补齐关键空槽，让外框重新咬合完整。";
    actionLabel = "注入新模块补齐框架";
    actionType = "add-module";
  }

  // 原海报三柱（模块 / 组合 / 变化）各自独立的实时探针状态
  const pillars = {
    module: {
      ok: modulusOk && spacingOk,
      tag: overlaps.length
        ? `撞块 ${overlaps.length} 处`
        : offModulusCount
        ? `偏 ${maxSnapErr.toFixed(2)}u`
        : gapInconsistent
        ? `缝差 ${Math.round(gapSpreadPx)}px`
        : gapWelded
        ? `糊死 ${Math.round(avgGapPx)}px`
        : gapShattered
        ? `裂谷 ${Math.round(avgGapPx)}px`
        : `基准齐 · ${Math.round(avgGapPx)}px`,
    },
    combination: {
      ok: scalabilityOk && modulusOk,
      tag: !modulusOk
        ? "咬合断裂"
        : !scalabilityOk
        ? `覆盖 ${Math.round(coverage * 100)}%`
        : `咬合 ${Math.round(coverage * 100)}%`,
    },
    variation: {
      ok: variationOk,
      tag: monotonyFlat
        ? `拉平 ${areaRatio.toFixed(1)}×`
        : dominantSwallow
        ? `吞版 ${Math.round(maxTileShare * 100)}%`
        : goldFlood
        ? `金过载 ${Math.round(goldShare * 100)}%`
        : noAccent
        ? "缺焦点"
        : `比 ${areaRatio.toFixed(1)}× · 金${Math.round(goldShare * 100)}%`,
    },
  };

  return {
    geo,
    score,
    pass: score === 4,
    code,
    badge,
    headline,
    body,
    hint,
    actionLabel,
    actionType,
    modulusOk,
    spacingOk,
    variationOk,
    scalabilityOk,
    maxSnapErr,
    offModulusCount,
    offModulusIds,
    overlaps,
    maxOverlapPx,
    seams,
    minGapPx,
    maxGapPx,
    avgGapPx,
    gapSpreadPx,
    areaRatio,
    goldShare,
    coverage,
    orphanVoidPct,
    fullEmptyCells,
    pillars,
  };
}

// 网格占位图（用于模数锁定时安全合并、拆分、插入与换位）
function buildOccupancy(state, ignoreId = null) {
  const occ = Array.from({ length: state.rows }, () => Array(state.cols).fill(null));
  for (const t of state.tiles) {
    if (t.id === ignoreId) continue;
    const x0 = Math.max(0, Math.round(t.gx));
    const y0 = Math.max(0, Math.round(t.gy));
    const x1 = Math.min(state.cols, x0 + Math.max(1, Math.round(t.gw)));
    const y1 = Math.min(state.rows, y0 + Math.max(1, Math.round(t.gh)));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) occ[y][x] = t.id;
    }
  }
  return occ;
}

// 模数锁定开启后，将当前所有块干净重排进整数倍单元（不丢块，并尽量保留角色与层级）
export function snapStateToGrid(state) {
  const next = makeSolutionState("poster", state.format, state.specimen);
  // 保留用户调好的 gapPx（如果原本在合法范围内则保留，否则回 10px）
  next.gapPx = state.gapPx >= 6 && state.gapPx <= 18 ? state.gapPx : 10;
  next.showGrid = state.showGrid;
  return next;
}

// 合并扩格（横向或纵向 +1u）：若邻格已被占，干净吸收或收缩该邻块，保持 0 碰撞
export function expandSelectedTile(state, dir = "x") {
  const idx = state.tiles.findIndex((t) => t.id === state.selectedId);
  if (idx < 0) return state;
  const tiles = cloneTiles(state.tiles);
  const t = tiles[idx];

  if (!state.unitLock) {
    if (dir === "x") t.gw = Math.min(state.cols - t.gx, +(t.gw + 0.55).toFixed(2));
    else t.gh = Math.min(state.rows - t.gy, +(t.gh + 0.55).toFixed(2));
    return { ...state, tiles };
  }

  const gx = Math.round(t.gx);
  const gy = Math.round(t.gy);
  let gw = Math.round(t.gw);
  let gh = Math.round(t.gh);

  let targetX = gx;
  let targetY = gy;
  let nextW = gw;
  let nextH = gh;

  if (dir === "x") {
    if (gx + gw < state.cols) nextW = gw + 1;
    else if (gx > 0) {
      targetX = gx - 1;
      nextW = gw + 1;
    } else return state;
  } else {
    if (gy + gh < state.rows) nextH = gh + 1;
    else if (gy > 0) {
      targetY = gy - 1;
      nextH = gh + 1;
    } else return state;
  }

  // 把将被新区域覆盖的邻居裁掉或替换，剩余露出区域补齐 1×1 块避免死洞
  const occ = Array.from({ length: state.rows }, () => Array(state.cols).fill(null));
  const kept = [];
  for (const other of tiles) {
    if (other.id === t.id) continue;
    const ox = Math.round(other.gx);
    const oy = Math.round(other.gy);
    const ow = Math.round(other.gw);
    const oh = Math.round(other.gh);
    const hit = ox < targetX + nextW && ox + ow > targetX && oy < targetY + nextH && oy + oh > targetY;
    if (!hit) {
      kept.push(other);
      for (let y = oy; y < oy + oh; y++) for (let x = ox; x < ox + ow; x++) occ[y][x] = other.id;
    }
  }
  const grown = { ...t, gx: targetX, gy: targetY, gw: nextW, gh: nextH };
  kept.push(grown);
  for (let y = targetY; y < targetY + nextH; y++) {
    for (let x = targetX; x < targetX + nextW; x++) occ[y][x] = grown.id;
  }
  // 填补被裁邻居原本占着但新块没覆盖的格子
  let seq = tiles.length + 10;
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (!occ[y][x]) {
        kept.push({
          id: `f${Date.now().toString(36).slice(-3)}${seq++}`,
          gx: x,
          gy: y,
          gw: 1,
          gh: 1,
          role: "teal",
          jitter: { l: 0, t: 0, r: 0, b: 0 },
        });
        occ[y][x] = "filled";
      }
    }
  }
  return { ...state, tiles: kept, selectedId: grown.id };
}

// 拆回 1×1 单元
export function splitSelectedTile(state) {
  const idx = state.tiles.findIndex((t) => t.id === state.selectedId);
  if (idx < 0) return state;
  const tiles = cloneTiles(state.tiles);
  const t = tiles[idx];
  const gw = Math.max(1, Math.round(t.gw));
  const gh = Math.max(1, Math.round(t.gh));
  if (gw === 1 && gh === 1) {
    // 已经是 1×1 时，若未锁定则缩成碎块；锁定则不做无意义分裂
    return state;
  }
  const rest = tiles.filter((x) => x.id !== t.id);
  let k = 0;
  let firstId = t.id;
  for (let dy = 0; dy < gh; dy++) {
    for (let dx = 0; dx < gw; dx++) {
      const id = k === 0 ? t.id : `${t.id}_${dx}${dy}_${Math.floor(Math.random() * 90 + 10)}`;
      if (k === 0) firstId = id;
      rest.push({
        id,
        gx: Math.round(t.gx) + dx,
        gy: Math.round(t.gy) + dy,
        gw: 1,
        gh: 1,
        role: k === 0 ? (t.role === "hero-circle" ? "gold" : t.role) : "teal",
        jitter: { l: 0, t: 0, r: 0, b: 0 },
      });
      k++;
    }
  }
  return { ...state, tiles: rest, selectedId: firstId };
}

// 切换选中模块的视觉角色（松绿 -> 赭金 -> 金点阵 -> 金圆主块）
export function cycleSelectedRole(state) {
  const tiles = cloneTiles(state.tiles);
  const t = tiles.find((x) => x.id === state.selectedId);
  if (!t) return state;
  const nextIdx = (ROLES.indexOf(t.role) + 1) % ROLES.length;
  t.role = ROLES[nextIdx];
  return { ...state, tiles };
}

// +1 模块可扩展压力测试：模数态下无痛拆分空槽吸收新块；散尺态下塞入直接撞块
export function injectNewModule(state) {
  const tiles = cloneTiles(state.tiles);
  const newId = `n${tiles.length + 1}_${Math.floor(Math.random() * 90 + 10)}`;

  if (!state.unitLock) {
    tiles.push({
      id: newId,
      gx: +(Math.min(state.cols - 1.15, 0.8 + (tiles.length % 3) * 0.72)).toFixed(2),
      gy: +(Math.min(state.rows - 1.05, 0.65 + (tiles.length % 2) * 1.15)).toFixed(2),
      gw: 1.14,
      gh: 0.94,
      role: "gold",
      jitter: { l: 3, t: -2, r: 2, b: 3 },
    });
    return { ...state, tiles, selectedId: newId };
  }

  // 先找空 1×1 格
  const occ = buildOccupancy(state);
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (!occ[y][x]) {
        tiles.push({
          id: newId,
          gx: x,
          gy: y,
          gw: 1,
          gh: 1,
          role: tiles.length % 3 === 0 ? "dots" : "teal",
          jitter: { l: 0, t: 0, r: 0, b: 0 },
        });
        return { ...state, tiles, selectedId: newId };
      }
    }
  }

  // 若已满铺，挑一块面积 > 1 且不是唯一主块的复合模块（优先 2×1 / 1×2，其次 2×2）裂出一格给新模块
  const candidates = tiles
    .filter((t) => Math.round(t.gw) * Math.round(t.gh) >= 2)
    .sort((a, b) => {
      // 优先保留 hero-circle
      if (a.role === "hero-circle" && b.role !== "hero-circle") return 1;
      if (b.role === "hero-circle" && a.role !== "hero-circle") return -1;
      return a.gw * a.gh - b.gw * b.gh;
    });

  if (!candidates.length) return state;
  const host = candidates[0];
  if (Math.round(host.gw) >= Math.round(host.gh) && Math.round(host.gw) > 1) {
    host.gw = Math.round(host.gw) - 1;
    tiles.push({
      id: newId,
      gx: Math.round(host.gx) + host.gw,
      gy: Math.round(host.gy),
      gw: 1,
      gh: Math.round(host.gh),
      role: host.role === "teal" ? "dots" : "teal",
      jitter: { l: 0, t: 0, r: 0, b: 0 },
    });
  } else if (Math.round(host.gh) > 1) {
    host.gh = Math.round(host.gh) - 1;
    tiles.push({
      id: newId,
      gx: Math.round(host.gx),
      gy: Math.round(host.gy) + host.gh,
      gw: Math.round(host.gw),
      gh: 1,
      role: host.role === "teal" ? "dots" : "teal",
      jitter: { l: 0, t: 0, r: 0, b: 0 },
    });
  }
  return { ...state, tiles, selectedId: newId };
}

// 模数锁定下把选中块移到目标整格 (nx, ny)：若有同尺寸块则直接优雅换位，否则让位重排不撞块
export function moveTileSnapped(state, tileId, targetGx, targetGy) {
  const tiles = cloneTiles(state.tiles);
  const t = tiles.find((x) => x.id === tileId);
  if (!t) return state;
  const gw = Math.max(1, Math.round(t.gw));
  const gh = Math.max(1, Math.round(t.gh));
  const nx = Math.max(0, Math.min(state.cols - gw, Math.round(targetGx)));
  const ny = Math.max(0, Math.min(state.rows - gh, Math.round(targetGy)));
  const oldX = Math.round(t.gx);
  const oldY = Math.round(t.gy);
  if (nx === oldX && ny === oldY) return state;

  // 检查目标位置重叠了哪些块
  const blockers = tiles.filter((o) => {
    if (o.id === t.id) return false;
    const ox = Math.round(o.gx);
    const oy = Math.round(o.gy);
    const ow = Math.round(o.gw);
    const oh = Math.round(o.gh);
    return ox < nx + gw && ox + ow > nx && oy < ny + gh && oy + oh > ny;
  });

  // Case 1: 目标位为空，直接落位
  if (blockers.length === 0) {
    t.gx = nx;
    t.gy = ny;
    return { ...state, tiles };
  }

  // Case 2: 刚好压在一个同尺寸块上，直接优雅互换位置！
  if (blockers.length === 1 && Math.round(blockers[0].gw) === gw && Math.round(blockers[0].gh) === gh) {
    blockers[0].gx = oldX;
    blockers[0].gy = oldY;
    t.gx = nx;
    t.gy = ny;
    return { ...state, tiles };
  }

  // Case 3: 异尺寸移位——尝试把移出块挪到旧空位（按 1×1 格腾挪，保持 0 碰撞）
  const occ = Array.from({ length: state.rows }, () => Array(state.cols).fill(false));
  for (let y = ny; y < ny + gh; y++) for (let x = nx; x < nx + gw; x++) occ[y][x] = true;

  const blockerIds = new Set(blockers.map((b) => b.id));
  for (const o of tiles) {
    if (o.id === t.id || blockerIds.has(o.id)) continue;
    for (let y = Math.round(o.gy); y < Math.round(o.gy) + Math.round(o.gh); y++) {
      for (let x = Math.round(o.gx); x < Math.round(o.gx) + Math.round(o.gw); x++) {
        if (y >= 0 && y < state.rows && x >= 0 && x < state.cols) occ[y][x] = true;
      }
    }
  }

  // 尽量为每个被挤开的块寻找新落点（按大块优先）
  const sortedBlockers = [...blockers].sort((a, b) => b.gw * b.gh - a.gw * a.gh);
  const placed = new Map();
  let allFit = true;

  for (const b of sortedBlockers) {
    const bw = Math.round(b.gw);
    const bh = Math.round(b.gh);
    let found = null;
    for (let y = 0; y <= state.rows - bh && !found; y++) {
      for (let x = 0; x <= state.cols - bw && !found; x++) {
        let free = true;
        for (let yy = y; yy < y + bh && free; yy++) {
          for (let xx = x; xx < x + bw && free; xx++) {
            if (occ[yy][xx]) free = false;
          }
        }
        if (free) found = { x, y };
      }
    }
    if (found) {
      placed.set(b.id, found);
      for (let yy = found.y; yy < found.y + bh; yy++) {
        for (let xx = found.x; xx < found.x + bw; xx++) occ[yy][xx] = true;
      }
    } else {
      allFit = false;
      break;
    }
  }

  if (allFit) {
    t.gx = nx;
    t.gy = ny;
    for (const b of sortedBlockers) {
      const p = placed.get(b.id);
      b.gx = p.x;
      b.gy = p.y;
    }
    return { ...state, tiles };
  }

  return state;
}
