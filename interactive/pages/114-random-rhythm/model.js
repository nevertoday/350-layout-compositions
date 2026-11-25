// 114 随机节奏组织 · 单真源几何模型与评估引擎
// 所有读数、四维检核、白话诊单、重心透视与练习判卷都从实绘元素坐标与半径直接核算，不写死常量。

export const STAGE_ASPECT = 1.24;

export const COLORS = {
  paper: "#E7F3DF",
  paperLight: "#FAFCF7",
  paperSoft: "#F3F5EC",
  teal: "#06887A",
  tealText: "#04685D",
  orange: "#ED521D",
  orangeText: "#B8350B",
  ink: "#09110E",
  inkSoft: "#354238",
  line: "#BAC6B4",
  ok: "#04685D",
  warn: "#B8350B",
};

// 视觉重量示意系数（参照 Arnheim 视觉重量模型：暖高饱和 > 冷深 > 中性墨，界面明确标「示意」）
const COLOR_WEIGHT = { orange: 1.38, teal: 1.12, ink: 0.92 };

// 可复现伪随机生成器（Mulberry32）
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SCENES = {
  poster: { id: "poster", label: "原海报几何", sub: "青朱墨几何散落" },
  jazz: { id: "jazz", label: "爵士节拍谱", sub: "切分拍与长休止" },
  exhibit: { id: "exhibit", label: "星野海报墙", sub: "展讯版面自由排布" },
};

// 原海报 114 标志性构图（精确转录自 114.webp 右侧开放散布场）
const POSTER_TEMPLATE = [
  // 两枚视觉重心锚点
  { kind: "circle", tier: "anchor", u: 0.72, v: 0.25, r: 0.102, color: "teal", angle: 0, tag: "主锚 · 静" },
  { kind: "circle", tier: "anchor", u: 0.39, v: 0.45, r: 0.094, color: "orange", angle: 0, tag: "次锚 · 跃" },
  // 中阶节拍块
  { kind: "circle", tier: "mid", u: 0.20, v: 0.29, r: 0.056, color: "teal", angle: 0, tag: "呼应" },
  { kind: "square", tier: "mid", u: 0.54, v: 0.36, r: 0.036, color: "teal", angle: 0, tag: "转折" },
  { kind: "square", tier: "mid", u: 0.85, v: 0.46, r: 0.038, color: "teal", angle: 0, tag: "托右" },
  { kind: "square", tier: "mid", u: 0.63, v: 0.55, r: 0.032, color: "ink", angle: 0, tag: "压底" },
  // 小节拍圆与方
  { kind: "circle", tier: "accent", u: 0.15, v: 0.49, r: 0.026, color: "ink", angle: 0, tag: "切分" },
  { kind: "circle", tier: "accent", u: 0.91, v: 0.57, r: 0.025, color: "orange", angle: 0, tag: "远点" },
  { kind: "circle", tier: "accent", u: 0.57, v: 0.69, r: 0.024, color: "teal", angle: 0, tag: "回落" },
  { kind: "square", tier: "accent", u: 0.68, v: 0.62, r: 0.022, color: "orange", angle: 0, tag: "火点" },
  { kind: "circle", tier: "accent", u: 0.90, v: 0.75, r: 0.023, color: "teal", angle: 0, tag: "收尾" },
  { kind: "circle", tier: "accent", u: 0.69, v: 0.84, r: 0.020, color: "teal", angle: 0, tag: "余韵" },
  { kind: "circle", tier: "accent", u: 0.77, v: 0.37, r: 0.018, color: "ink", angle: 0, tag: "跳音" },
  { kind: "circle", tier: "accent", u: 0.78, v: 0.11, r: 0.017, color: "orange", angle: 0, tag: "高音" },
  { kind: "circle", tier: "accent", u: 0.31, v: 0.78, r: 0.016, color: "orange", angle: 0, tag: "左托" },
  { kind: "circle", tier: "accent", u: 0.46, v: 0.77, r: 0.014, color: "ink", angle: 0, tag: "细拍" },
  // 微型碎点
  { kind: "circle", tier: "micro", u: 0.33, v: 0.18, r: 0.012, color: "ink", angle: 0 },
  { kind: "circle", tier: "micro", u: 0.10, v: 0.34, r: 0.009, color: "orange", angle: 0 },
  { kind: "circle", tier: "micro", u: 0.49, v: 0.15, r: 0.009, color: "ink", angle: 0 },
  { kind: "circle", tier: "micro", u: 0.56, v: 0.44, r: 0.010, color: "teal", angle: 0 },
  { kind: "circle", tier: "micro", u: 0.49, v: 0.60, r: 0.009, color: "orange", angle: 0 },
  { kind: "circle", tier: "micro", u: 0.82, v: 0.60, r: 0.010, color: "ink", angle: 0 },
  { kind: "square", tier: "micro", u: 0.75, v: 0.54, r: 0.008, color: "teal", angle: 0 },
  { kind: "square", tier: "micro", u: 0.57, v: 0.84, r: 0.009, color: "ink", angle: 0 },
];

// 原海报装饰性辅助笔触（跟随分布模式显隐，不污染单源点阵计数）
export const POSTER_STROKE_DECOR = [
  { kind: "line", u: 0.86, v: 0.16, len: 0.11, angle: -0.78, color: "ink", w: 2.2 },
  { kind: "line", u: 0.69, v: 0.42, len: 0.075, angle: 0.78, color: "ink", w: 2 },
  { kind: "line", u: 0.21, v: 0.39, len: 0.055, angle: 0, color: "teal", w: 2 },
  { kind: "line", u: 0.18, v: 0.60, len: 0.068, angle: -0.78, color: "orange", w: 2.2 },
  { kind: "line", u: 0.28, v: 0.59, len: 0.068, angle: 0.78, color: "teal", w: 2.2 },
  { kind: "line", u: 0.42, v: 0.63, len: 0.052, angle: 0, color: "ink", w: 3.2 },
  { kind: "line", u: 0.41, v: 0.88, len: 0.085, angle: 0.52, color: "ink", w: 2 },
  { kind: "line", u: 0.88, v: 0.87, len: 0.085, angle: -0.42, color: "orange", w: 2.2 },
  { kind: "line", u: 0.86, v: 0.66, len: 0.052, angle: 0, color: "ink", w: 2.2 },
  { kind: "line", u: 0.88, v: 0.10, len: 0.048, angle: 0, color: "ink", w: 1.8 },
  { kind: "line", u: 0.47, v: 0.23, len: 0.042, angle: -1.18, color: "orange", w: 1.8 },
  { kind: "plus", u: 0.34, v: 0.34, size: 0.022, color: "ink" },
  { kind: "plus", u: 0.71, v: 0.15, size: 0.020, color: "ink" },
  { kind: "plus", u: 0.92, v: 0.21, size: 0.020, color: "teal" },
  { kind: "dotgrid", u: 0.88, v: 0.31, cols: 5, rows: 5, step: 0.017, color: "ink" },
  { kind: "dotcloud", u: 0.76, v: 0.76, angle: 0.62, color: "ink" },
];

export function tierRadius(tier) {
  if (tier === "anchor") return 0.095;
  if (tier === "mid") return 0.044;
  if (tier === "accent") return 0.022;
  return 0.011;
}

export function cycleTier(tier) {
  const order = ["micro", "accent", "mid", "anchor"];
  return order[(order.indexOf(tier) + 1) % order.length];
}

// 统一距离：按舞台标准纵横比换算，确保圆与间距度量不受屏幕比例扭曲
export function distNorm(a, b, aspect = STAGE_ASPECT) {
  return Math.hypot((a.u - b.u) * aspect, a.v - b.v);
}

// 生成开场 0/4 经典翻车错态：16 枚等大墨黑圆锁死在左偏 4×4 机械网格里
export function buildMistakeItems() {
  const items = [];
  let id = 1;
  const xs = [0.13, 0.27, 0.41, 0.55];
  const ys = [0.20, 0.39, 0.58, 0.77];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      items.push({
        id: id++,
        kind: "circle",
        tier: "mid",
        u: xs[c],
        v: ys[r],
        r: 0.042,
        color: "ink",
        angle: 0,
        vx: 0,
        vy: 0,
        tag: "",
      });
    }
  }
  return items;
}

// 原海报 114 解
export function buildPosterItems() {
  return POSTER_TEMPLATE.map((p, idx) => ({
    id: idx + 1,
    ...p,
    vx: 0,
    vy: 0,
  }));
}

// 泊松盘蓝噪声受控随机生成器（灵感来自 Bridson 2007，先立锚点再做最小间距蓝噪撒落与光学配平）
export function buildControlledScatter({
  scaleMode = "dual",     // uniform | dual | single | giant
  spreadMode = "bluenoise", // grid | whitenoise | bluenoise | clusters
  colorMode = "triad",    // mono | triad | rightheavy
  seed = 114,
} = {}) {
  const rng = makeRng(seed * 9973 + 17);
  const count = spreadMode === "grid" ? 16 : 22;

  // 1. 决定尺寸档位序列
  const tiers = [];
  if (scaleMode === "uniform") {
    for (let i = 0; i < count; i++) tiers.push({ tier: "mid", r: 0.042 });
  } else if (scaleMode === "giant") {
    for (let i = 0; i < count; i++) {
      if (i < 6) tiers.push({ tier: "anchor", r: 0.104 + (i % 2) * 0.012 });
      else if (i < 12) tiers.push({ tier: "mid", r: 0.058 });
      else tiers.push({ tier: "accent", r: 0.028 });
    }
  } else if (scaleMode === "single") {
    tiers.push({ tier: "anchor", r: 0.112 });
    for (let i = 1; i < count; i++) {
      if (i <= 4) tiers.push({ tier: "mid", r: 0.036 + rng() * 0.016 });
      else if (i <= 12) tiers.push({ tier: "accent", r: 0.018 + rng() * 0.010 });
      else tiers.push({ tier: "micro", r: 0.009 + rng() * 0.005 });
    }
  } else {
    // dual: 2 大锚点 + 4 中块 + 8 小拍 + 8 微点
    tiers.push({ tier: "anchor", r: 0.102 });
    tiers.push({ tier: "anchor", r: 0.091 });
    for (let i = 2; i < count; i++) {
      if (i <= 5) tiers.push({ tier: "mid", r: 0.034 + rng() * 0.020 });
      else if (i <= 13) tiers.push({ tier: "accent", r: 0.017 + rng() * 0.011 });
      else tiers.push({ tier: "micro", r: 0.009 + rng() * 0.004 });
    }
  }

  // 2. 决定色彩与几何形态
  const palette = colorMode === "mono"
    ? ["ink"]
    : ["teal", "orange", "teal", "ink", "orange", "teal", "ink"];
  const items = [];

  if (spreadMode === "grid") {
    const xs = colorMode === "rightheavy"
      ? [0.46, 0.60, 0.74, 0.88]
      : colorMode === "mono" && scaleMode === "uniform"
        ? [0.13, 0.27, 0.41, 0.55]
        : [0.18, 0.39, 0.61, 0.82];
    const ys = [0.20, 0.39, 0.58, 0.77];
    for (let i = 0; i < count; i++) {
      const c = i % 4;
      const r = Math.floor(i / 4);
      const col = colorMode === "mono" ? "ink" : palette[i % palette.length];
      items.push({
        id: i + 1,
        kind: colorMode === "mono" ? "circle" : (i % 5 === 3 ? "square" : "circle"),
        tier: tiers[i].tier,
        u: xs[c],
        v: ys[r],
        r: tiers[i].r,
        color: col,
        angle: 0,
        vx: 0,
        vy: 0,
      });
    }
    return items;
  }

  if (spreadMode === "whitenoise") {
    // 真实无约束白噪声：刻意允许撞车与随机成团，真实再现直接 Math.random() 的失控感
    const clumpX = 0.56 + (rng() - 0.5) * 0.16;
    const clumpY = 0.44 + (rng() - 0.5) * 0.14;
    for (let i = 0; i < count; i++) {
      const col = colorMode === "mono" ? "ink" : palette[i % palette.length];
      const inClump = i < 9;
      let u = inClump ? clumpX + (rng() - 0.5) * 0.16 : 0.10 + rng() * 0.80;
      let v = inClump ? clumpY + (rng() - 0.5) * 0.16 : 0.11 + rng() * 0.78;
      if (colorMode === "rightheavy") u = 0.58 + rng() * 0.32;
      u = Math.max(0.08, Math.min(0.92, u));
      v = Math.max(0.10, Math.min(0.90, v));
      items.push({
        id: i + 1,
        kind: i < 2 ? "circle" : (rng() > 0.72 ? "square" : "circle"),
        tier: tiers[i].tier,
        u,
        v,
        r: tiers[i].r,
        color: col,
        angle: 0,
        vx: 0,
        vy: 0,
      });
    }
    return items;
  }

  // bluenoise 或 clusters：先摆重心锚点，再以泊松最小间距环采样
  const flipDiag = seed % 2 === 1;
  const anchors = [];
  if (colorMode === "rightheavy") {
    anchors.push({ u: 0.78, v: 0.32 });
    anchors.push({ u: 0.80, v: 0.66 });
  } else if (scaleMode === "single") {
    anchors.push({ u: flipDiag ? 0.64 : 0.36, v: flipDiag ? 0.36 : 0.42 });
  } else {
    anchors.push({ u: flipDiag ? 0.28 + rng() * 0.07 : 0.66 + rng() * 0.08, v: 0.24 + rng() * 0.08 });
    anchors.push({ u: flipDiag ? 0.64 + rng() * 0.08 : 0.34 + rng() * 0.07, v: 0.48 + rng() * 0.10 });
  }

  const placed = [];
  const fits = (u, v, r, minGapExtra = 0.042) => {
    if (u < 0.08 + r * 0.7 || u > 0.92 - r * 0.7 || v < 0.10 + r * 0.7 || v > 0.90 - r * 0.7) return false;
    for (const q of placed) {
      const d = distNorm({ u, v }, q);
      if (d < r + q.r + minGapExtra) return false;
    }
    return true;
  };

  for (let i = 0; i < count; i++) {
    const t = tiers[i];
    const col = colorMode === "mono" ? "ink" : palette[i % palette.length];
    const kind = t.tier === "anchor" ? "circle" : (i % 4 === 2 ? "square" : "circle");
    let u = 0.5;
    let v = 0.5;
    if (i < anchors.length && t.tier === "anchor") {
      u = anchors[i].u;
      v = anchors[i].v;
    } else {
      let found = false;
      for (let attempt = 0; attempt < 90; attempt++) {
        let cu, cv;
        if (colorMode === "rightheavy") {
          cu = 0.55 + rng() * 0.36;
          cv = 0.12 + rng() * 0.76;
        } else if (spreadMode === "clusters") {
          // 疏密双聚落：70% 落在两个主星团附近，30% 散入安静呼吸区
          const denseSide = rng() < 0.72;
          const hub = denseSide
            ? (rng() < 0.55 ? anchors[0] : anchors[anchors.length - 1])
            : { u: flipDiag ? 0.78 : 0.22, v: flipDiag ? 0.78 : 0.78 };
          const rad = denseSide ? 0.14 + rng() * 0.16 : 0.12 + rng() * 0.24;
          const ang = rng() * Math.PI * 2;
          cu = hub.u + Math.cos(ang) * rad / STAGE_ASPECT;
          cv = hub.v + Math.sin(ang) * rad;
        } else {
          // 蓝噪泊松环：绕已有节点在 [r_min, 2.2*r_min] 环带生成候选，形成天然疏密起伏
          const base = placed.length && rng() < 0.78
            ? placed[Math.floor(rng() * placed.length)]
            : { u: 0.15 + rng() * 0.70, v: 0.15 + rng() * 0.70, r: 0.03 };
          const ringMin = base.r + t.r + (t.tier === "micro" ? 0.045 : 0.062);
          const ringMax = ringMin + (i % 3 === 0 ? 0.28 : 0.14);
          const rad = ringMin + rng() * (ringMax - ringMin);
          const ang = rng() * Math.PI * 2;
          cu = base.u + (Math.cos(ang) * rad) / STAGE_ASPECT;
          cv = base.v + Math.sin(ang) * rad;
        }
        const gap = spreadMode === "clusters" ? 0.024 : (t.tier === "micro" ? 0.028 : 0.044);
        if (fits(cu, cv, t.r, gap)) {
          u = cu;
          v = cv;
          found = true;
          break;
        }
      }
      if (!found) {
        for (let attempt = 0; attempt < 60; attempt++) {
          const cu = colorMode === "rightheavy" ? 0.56 + rng() * 0.34 : 0.10 + rng() * 0.80;
          const cv = 0.12 + rng() * 0.76;
          if (fits(cu, cv, t.r, 0.012)) { u = cu; v = cv; break; }
        }
      }
    }
    const item = { id: i + 1, kind, tier: t.tier, u, v, r: t.r, color: col, angle: 0, vx: 0, vy: 0 };
    placed.push(item);
    items.push(item);
  }

  // 对合法模式做轻量光学重心微配平（保留自由感，确保非 rightheavy 时重心稳在中心容差带内）
  if (colorMode !== "rightheavy" && scaleMode !== "giant") {
    const cg = computeOpticalCG(items);
    const dx = (0.50 - cg.x) * 0.65;
    const dy = (0.50 - cg.y) * 0.55;
    for (const it of items) {
      it.u = Math.max(0.08 + it.r * 0.65, Math.min(0.92 - it.r * 0.65, it.u + dx));
      it.v = Math.max(0.10 + it.r * 0.65, Math.min(0.90 - it.r * 0.65, it.v + dy));
    }
  }
  return items;
}

// 光学重心计算（面积 × 色彩视觉重量，纯几何单真源）
export function computeOpticalCG(items) {
  let sumW = 0;
  let wx = 0;
  let wy = 0;
  for (const it of items) {
    const area = it.kind === "square" ? (it.r * 1.75) ** 2 : Math.PI * it.r * it.r;
    const w = Math.max(0.0005, area) * (COLOR_WEIGHT[it.color] || 1);
    sumW += w;
    wx += it.u * w;
    wy += it.v * w;
  }
  if (!sumW) return { x: 0.5, y: 0.5, offset: 0, dirZh: "居中" };
  const x = wx / sumW;
  const y = wy / sumW;
  const offset = Math.hypot(x - 0.5, y - 0.5);
  let dirZh = "居中";
  if (offset >= 0.05) {
    const h = x < 0.46 ? "偏左" : x > 0.54 ? "偏右" : "";
    const v = y < 0.46 ? "偏上" : y > 0.54 ? "偏下" : "";
    dirZh = (h + v) || "微偏";
  }
  return { x, y, offset, dirZh };
}

// 核心单真源评估函数：从实绘几何数组直接计算 4 维检核 + 8 类错态诊断
export function evaluateComposition(items) {
  const n = items.length || 1;
  const radii = items.map((it) => it.r);
  const maxR = Math.max(...radii);
  const minR = Math.max(0.005, Math.min(...radii));
  const sizeRatio = +(maxR / minR).toFixed(1);
  const anchorCount = items.filter((it) => it.r >= 0.072).length;
  const totalArea = items.reduce((s, it) => s + (it.kind === "square" ? (it.r * 1.75) ** 2 : Math.PI * it.r * it.r), 0);
  const coveragePct = Math.round((totalArea / STAGE_ASPECT) * 100);

  // 1. 最近邻间距（NND）与碰撞计数
  const nnds = [];
  let overlapCount = 0;
  for (let i = 0; i < n; i++) {
    let minD = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = distNorm(items[i], items[j]);
      const edgeGap = d - (items[i].r + items[j].r);
      if (j > i && edgeGap < -0.004) overlapCount++;
      if (d < minD) minD = d;
    }
    nnds.push(minD === Infinity ? 0 : minD);
  }
  const meanNND = nnds.reduce((a, b) => a + b, 0) / n;
  const stdNND = Math.sqrt(nnds.reduce((s, x) => s + (x - meanNND) ** 2, 0) / n);
  const nndCV = meanNND > 0 ? stdNND / meanNND : 0;

  // 2. 4×3 疏密热区统计
  const densityGrid = new Array(12).fill(0);
  for (const it of items) {
    const cx = Math.min(3, Math.max(0, Math.floor(it.u * 4)));
    const cy = Math.min(2, Math.max(0, Math.floor(it.v * 3)));
    densityGrid[cy * 4 + cx] += 1 + (it.r >= 0.07 ? 1.4 : it.r >= 0.032 ? 0.6 : 0.2);
  }
  const maxCell = Math.max(...densityGrid);
  const totalGridW = densityGrid.reduce((a, b) => a + b, 0) || 1;
  const maxCellShare = Math.round((maxCell / totalGridW) * 100);
  const sparseCells = densityGrid.filter((v) => v <= 1.2).length;
  const denseCells = densityGrid.filter((v) => v >= 2.4).length;

  // 3. 行列锁死率（只统计 3 枚及以上图形共处同一条横轨或竖轨的真对齐，避开随机两点的偶然同高）
  let alignedLinks = 0;
  for (let i = 0; i < n; i++) {
    let rowPeers = 0;
    let colPeers = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (Math.abs(items[i].v - items[j].v) < 0.016) rowPeers++;
      if (Math.abs(items[i].u - items[j].u) < 0.016) colPeers++;
    }
    if (rowPeers >= 2 && colPeers >= 2) alignedLinks += 1;
    else if (rowPeers >= 2 || colPeers >= 2) alignedLinks += 0.45;
  }
  const gridLockPct = Math.round((alignedLinks / n) * 100);
  const freePct = Math.max(0, 100 - gridLockPct);

  // 中心掏空检测（贴边环绕）
  const centerHits = items.filter((it) => it.u > 0.28 && it.u < 0.72 && it.v > 0.26 && it.v < 0.74).length;
  const hollowCenter = centerHits <= 1 && n >= 8;

  // 4. 光学重心与色彩对比
  const cg = computeOpticalCG(items);
  const cgOffsetPct = Math.round(cg.offset * 100);
  const uniqueColors = new Set(items.map((it) => it.color)).size;

  // --- 四维独立判定 ---
  // ① 大小变化
  let sizeCheck;
  if (sizeRatio < 2.2) {
    sizeCheck = {
      ok: false, code: "uniform_size", badge: `等大 ${sizeRatio.toFixed(1)}×`,
      valueText: `${sizeRatio.toFixed(1)}×`,
      headline: `全员等大（跨比仅 ${sizeRatio.toFixed(1)}×），画面没有落脚的视觉重心`,
      why: "所有图形面积相近，大脑分不清主次，视线一扫而过就像在看均质底纹。",
      hint: "点击画布上 1–2 枚图形放大成大重心，或把「尺度层次」切到「双锚错落 / 单锚群星」。",
    };
  } else if (coveragePct > 36 || anchorCount >= 4) {
    sizeCheck = {
      ok: false, code: "giant_crowd", badge: `霸屏 ${coveragePct}%`,
      valueText: `${coveragePct}% 占幅`,
      headline: `${anchorCount} 枚巨块霸占 ${coveragePct}% 画幅，轻重对比被压死`,
      why: "大图形太多会把留白挤没，节奏失去轻快喘息，整张画显得沉重发堵。",
      hint: "点小多余的大块，或将「尺度层次」切回「双锚错落」留出 1–2 个明确主角。",
    };
  } else {
    sizeCheck = {
      ok: true, code: "ok", badge: `跨比 ${sizeRatio.toFixed(1)}×`,
      valueText: `${sizeRatio.toFixed(1)}×`,
    };
  }

  // ② 间距变化
  let intervalCheck;
  if (overlapCount >= 3 || maxCellShare >= 42) {
    intervalCheck = {
      ok: false, code: "clump_collision", badge: `撞车 ${overlapCount} 处`,
      valueText: `撞车 ${overlapCount} 处`,
      headline: `纯随机撞车 ${overlapCount} 处，局部挤团而他处留出大秃斑`,
      why: "无约束的纯随机（白噪声）在概率上必然扎堆。元素互相踩踏后，快拍变成死团，呼吸感断裂。",
      hint: "在扎堆处横拖「拨散推笔」推开碰撞，或将「散布方式」切到「蓝噪泊松散布」。",
    };
  } else if (nndCV < 0.18) {
    intervalCheck = {
      ok: false, code: "equal_interval", badge: `等距 ${nndCV.toFixed(2)}`,
      valueText: `距差 ${nndCV.toFixed(2)}`,
      headline: `间距几乎一模一样（距差 ${nndCV.toFixed(2)}），退化成机械网格`,
      why: "间距的松紧决定节奏的快慢。当每一拍的间隔都相等，大脑听到的只是节拍器滴答声，没有随机跃动。",
      hint: "直接在画布上横拖拨散几排元素，或将「散布方式」切到「蓝噪泊松散布 / 疏密双聚落」。",
    };
  } else {
    intervalCheck = {
      ok: true, code: "ok", badge: `距差 ${nndCV.toFixed(2)}`,
      valueText: `距差 ${nndCV.toFixed(2)}`,
    };
  }

  // ③ 位置变化
  let positionCheck;
  if (gridLockPct > 62) {
    positionCheck = {
      ok: false, code: "grid_locked", badge: `锁格 ${gridLockPct}%`,
      valueText: `破序 ${freePct}%`,
      headline: `${gridLockPct}% 图形锁死在横竖行列上，固定秩序还没打破`,
      why: "人眼极擅长捕获隐藏的对齐线。只要圆心仍排队站在横竖轨道上，画面就被规整网格牢牢捆住。",
      hint: "直接在画布上左右扫动拨散行列，把破序度推到 40% 以上。",
    };
  } else if (hollowCenter || coveragePct < 4) {
    positionCheck = {
      ok: false, code: "hollow_edge", badge: "贴边空心",
      valueText: "中心空洞",
      headline: "元素全挤向边角，中央掏出大片空洞，彼此接不上话",
      why: "随机节奏需要疏密呼应；如果元素贴墙游离、中心只剩零星散点，画面会散成一圈碎边框。",
      hint: "把一枚重心锚点拖回中腹偏离区，让周遭小元素与它形成近密远疏的对话。",
    };
  } else {
    positionCheck = {
      ok: true, code: "ok", badge: `破序 ${freePct}%`,
      valueText: `破序 ${freePct}%`,
    };
  }

  // ④ 对比与平衡
  let balanceCheck;
  if (cgOffsetPct > 14) {
    balanceCheck = {
      ok: false, code: "tilted_balance", badge: `${cg.dirZh} ${cgOffsetPct}%`,
      valueText: `偏移 ${cgOffsetPct}%`,
      headline: `视觉重心${cg.dirZh}偏移 ${cgOffsetPct}%（示意），画面像斜掉的托盘`,
      why: "重块全堆在同一侧时，另一侧留白撑不住视觉杠杆，画面会失去整体安定感。",
      hint: "把一枚大锚点拖向对角一侧做视觉配重（可开启「重心透视」看实时力臂），或切回「青朱黑三调」。",
    };
  } else if (uniqueColors < 2) {
    balanceCheck = {
      ok: false, code: "mono_flat", badge: "单墨无对比",
      valueText: "1 色闷平",
      headline: "全幅单色闷平，缺少高饱和重心与次要碎点的冷暖对比",
      why: "114 号原海报用深青、朱红与墨黑三色分工：小朱红能抗衡大深青，单墨则失去了这种以轻搏重的趣味。",
      hint: "把「色彩平衡」切到「青朱黑三调」，唤醒冷暖视觉配重。",
    };
  } else {
    balanceCheck = {
      ok: true, code: "ok", badge: `稳态 ${cgOffsetPct}%`,
      valueText: `偏移 ${cgOffsetPct}%`,
    };
  }

  const checks = { size: sizeCheck, interval: intervalCheck, position: positionCheck, balance: balanceCheck };
  const ordered = [
    { key: "position", tag: "错态 · 行列锁死", ...positionCheck },
    { key: "size", tag: sizeCheck.code === "giant_crowd" ? "错态 · 巨块霸屏" : "错态 · 全员等大", ...sizeCheck },
    { key: "interval", tag: intervalCheck.code === "clump_collision" ? "错态 · 白噪撞车" : "错态 · 机械等距", ...intervalCheck },
    { key: "balance", tag: balanceCheck.code === "mono_flat" ? "错态 · 单墨闷平" : "错态 · 单边倾覆", ...balanceCheck },
  ];
  const passedCount = [sizeCheck, intervalCheck, positionCheck, balanceCheck].filter((c) => c.ok).length;
  const primaryFailure = ordered.find((c) => !c.ok) || null;
  const summaryMood = passedCount === 4 ? "节奏成律" : passedCount === 0 ? "待立律" : passedCount <= 2 ? "已破序" : "差一步";

  return {
    passedCount,
    summaryMood,
    checks,
    primaryFailure,
    densityGrid,
    cg,
    metrics: {
      sizeRatio: +sizeRatio.toFixed(2),
      nndCV: +nndCV.toFixed(2),
      freePct,
      gridLockPct,
      cgOffsetPct,
      coveragePct,
      overlapCount,
      sparseCells,
      denseCells,
      maxCellShare,
    },
  };
}

// 第 01 节：白噪声 vs 泊松盘蓝噪声同源生成（供分屏帘实时对照）
export function buildNoiseComparison(seed = 11) {
  const rngW = makeRng(seed * 313 + 7);
  const rngB = makeRng(seed * 313 + 7);
  const white = [];
  const blue = [];
  const total = 26;
  const colors = ["teal", "orange", "ink", "teal", "ink"];

  // 白噪声：独立均匀随机数（必然局部撞车 + 留秃斑）
  for (let i = 0; i < total; i++) {
    const r = i < 2 ? 0.068 : i < 7 ? 0.036 : 0.017;
    white.push({
      u: 0.09 + rngW() * 0.82,
      v: 0.11 + rngW() * 0.78,
      r,
      color: colors[i % colors.length],
    });
  }
  // 计算白噪声里的真实碰撞对
  const whiteCollisions = [];
  for (let i = 0; i < white.length; i++) {
    for (let j = i + 1; j < white.length; j++) {
      const d = distNorm(white[i], white[j], 1.6);
      if (d < white[i].r + white[j].r + 0.012) whiteCollisions.push([i, j]);
    }
  }

  // 泊松盘蓝噪声：最小呼吸距离约束
  for (let i = 0; i < total; i++) {
    const r = i < 2 ? 0.068 : i < 7 ? 0.036 : 0.017;
    let best = null;
    for (let k = 0; k < 45; k++) {
      const u = 0.09 + rngB() * 0.82;
      const v = 0.11 + rngB() * 0.78;
      let minClear = Infinity;
      for (const q of blue) {
        const c = distNorm({ u, v }, q, 1.6) - (r + q.r);
        if (c < minClear) minClear = c;
      }
      if (minClear > 0.042) { best = { u, v, r, color: colors[i % colors.length] }; break; }
      if (!best || minClear > best.score) best = { u, v, r, color: colors[i % colors.length], score: minClear };
    }
    blue.push(best);
  }
  return { white, blue, whiteCollisions };
}

// 第 03 节：暗室光学杠杆配重预设（左盘固定 1 枚大深青圆，右盘选不同视觉反制块）
export const BALANCE_PRESETS = {
  redSmall: {
    id: "redSmall",
    label: "小朱红远臂",
    note: "面积只有左侧的 28%，但凭借高饱和暖朱红与远端力臂，刚好拉平大深青静块。",
    rightShapes: [{ kind: "circle", rx: 0.78, r: 22, color: "#ED521D" }],
    rightMoment: 1.0, // 与左侧 1.00 持平
    verdict: "以轻搏重 · 光学平齐（示意）",
  },
  dotCluster: {
    id: "dotCluster",
    label: "碎点密集群",
    note: "单一微点太轻，但 7 枚错落碎点在远端聚成密区，合起来同样能接住左侧大块的重量。",
    rightShapes: [
      { kind: "circle", rx: 0.56, r: 9, color: "#58DFCE" },
      { kind: "circle", rx: 0.65, r: 6, color: "#EDF5E8" },
      { kind: "square", rx: 0.72, r: 10, color: "#FF8559" },
      { kind: "circle", rx: 0.79, r: 7, color: "#58DFCE" },
      { kind: "circle", rx: 0.84, r: 5, color: "#EDF5E8" },
      { kind: "circle", rx: 0.69, r: 5, color: "#EDF5E8" },
      { kind: "circle", rx: 0.88, r: 8, color: "#FF8559" },
    ],
    rightMoment: 0.96,
    verdict: "以密抗大 · 近似平齐（示意）",
  },
  tooLight: {
    id: "tooLight",
    label: "仅留两小点",
    note: "右半幅只放两枚冷淡小点，视觉力矩撑不住左侧大青圆，整张画面明显向左倾覆。",
    rightShapes: [
      { kind: "circle", rx: 0.42, r: 7, color: "#89A39A" },
      { kind: "circle", rx: 0.55, r: 5, color: "#89A39A" },
    ],
    rightMoment: 0.28,
    verdict: "左重右轻 · 明显倾覆（示意）",
  },
  tooHeavy: {
    id: "tooHeavy",
    label: "右放双巨红",
    note: "两枚高饱和朱红大圆同时压在右端长力臂上，视觉引力反杀左侧，画面向右一头栽倒。",
    rightShapes: [
      { kind: "circle", rx: 0.60, r: 30, color: "#ED521D" },
      { kind: "circle", rx: 0.86, r: 28, color: "#ED521D" },
    ],
    rightMoment: 1.78,
    verdict: "右端过重 · 喧宾夺主（示意）",
  },
};

// 第 07 节小练习：四张同元素组、仅差「空间散布与平衡」单变量的选项（正确答案 C）
export const QUIZ_ITEMS = {
  A: {
    label: "A",
    correct: false,
    verdictTitle: "选了 A：看似有大小，其实被隐形网格锁死了",
    verdictText: "这组把 14 枚元素放进了 4×4 等距网格交点，只靠换大圆小圆假装活泼。人眼会立刻扫出隐形横竖轨道，节奏变回呆板的「重复」。",
    items: [
      { u: 0.16, v: 0.22, r: 0.088, color: "teal", kind: "circle" },
      { u: 0.39, v: 0.22, r: 0.022, color: "ink", kind: "circle" },
      { u: 0.62, v: 0.22, r: 0.032, color: "teal", kind: "square" },
      { u: 0.84, v: 0.22, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.16, v: 0.50, r: 0.026, color: "ink", kind: "circle" },
      { u: 0.39, v: 0.50, r: 0.082, color: "orange", kind: "circle" },
      { u: 0.62, v: 0.50, r: 0.020, color: "teal", kind: "circle" },
      { u: 0.84, v: 0.50, r: 0.030, color: "teal", kind: "square" },
      { u: 0.16, v: 0.78, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.39, v: 0.78, r: 0.028, color: "ink", kind: "square" },
      { u: 0.62, v: 0.78, r: 0.024, color: "orange", kind: "circle" },
      { u: 0.84, v: 0.78, r: 0.018, color: "ink", kind: "circle" },
      { u: 0.39, v: 0.36, r: 0.014, color: "teal", kind: "circle" },
      { u: 0.62, v: 0.64, r: 0.014, color: "ink", kind: "circle" },
    ],
  },
  B: {
    label: "B",
    correct: false,
    verdictTitle: "选了 B：这是无约束白噪声，扎堆撞车又偏右倾覆",
    verdictText: "两枚大重心圆与多枚小块挤在右侧撞成一团，左上大片秃空无物。缺乏最小间距和视觉配重，画面只剩凌乱而非节奏。",
    items: [
      { u: 0.66, v: 0.36, r: 0.088, color: "teal", kind: "circle" },
      { u: 0.74, v: 0.50, r: 0.082, color: "orange", kind: "circle" },
      { u: 0.62, v: 0.48, r: 0.032, color: "teal", kind: "square" },
      { u: 0.79, v: 0.42, r: 0.030, color: "teal", kind: "square" },
      { u: 0.69, v: 0.57, r: 0.028, color: "ink", kind: "square" },
      { u: 0.84, v: 0.56, r: 0.026, color: "ink", kind: "circle" },
      { u: 0.58, v: 0.39, r: 0.024, color: "orange", kind: "circle" },
      { u: 0.72, v: 0.27, r: 0.022, color: "ink", kind: "circle" },
      { u: 0.86, v: 0.34, r: 0.020, color: "teal", kind: "circle" },
      { u: 0.63, v: 0.68, r: 0.018, color: "ink", kind: "circle" },
      { u: 0.52, v: 0.52, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.88, v: 0.68, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.77, v: 0.63, r: 0.014, color: "teal", kind: "circle" },
      { u: 0.19, v: 0.82, r: 0.014, color: "ink", kind: "circle" },
    ],
  },
  C: {
    label: "C",
    correct: true,
    verdictTitle: "选对了！C 在破序中守住了呼吸距、疏密与对角配平",
    verdictText: "大深青圆与大朱红圆分立右上与左中形成视觉杠杆，其余 12 枚中小形打破行列却保留清晰最小间距，左上有安静呼吸留白、右下有轻快聚落，活而不乱。",
    items: [
      { u: 0.72, v: 0.28, r: 0.088, color: "teal", kind: "circle" },
      { u: 0.35, v: 0.50, r: 0.082, color: "orange", kind: "circle" },
      { u: 0.54, v: 0.38, r: 0.032, color: "teal", kind: "square" },
      { u: 0.84, v: 0.52, r: 0.030, color: "teal", kind: "square" },
      { u: 0.62, v: 0.64, r: 0.028, color: "ink", kind: "square" },
      { u: 0.18, v: 0.34, r: 0.026, color: "ink", kind: "circle" },
      { u: 0.78, v: 0.76, r: 0.024, color: "orange", kind: "circle" },
      { u: 0.24, v: 0.76, r: 0.022, color: "ink", kind: "circle" },
      { u: 0.48, v: 0.78, r: 0.020, color: "teal", kind: "circle" },
      { u: 0.87, v: 0.22, r: 0.018, color: "ink", kind: "circle" },
      { u: 0.44, v: 0.20, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.14, v: 0.59, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.71, v: 0.50, r: 0.014, color: "teal", kind: "circle" },
      { u: 0.56, v: 0.16, r: 0.014, color: "ink", kind: "circle" },
    ],
  },
  D: {
    label: "D",
    correct: false,
    verdictTitle: "选了 D：元素全贴墙跑，中央掏成空洞",
    verdictText: "所有形状都沿着四条画框边缘排成一圈，画幅中心空无一物，两枚大圆也被挤到对角角落里，视线在四边打转却进不去画面核心。",
    items: [
      { u: 0.14, v: 0.16, r: 0.088, color: "teal", kind: "circle" },
      { u: 0.86, v: 0.84, r: 0.082, color: "orange", kind: "circle" },
      { u: 0.42, v: 0.11, r: 0.032, color: "teal", kind: "square" },
      { u: 0.88, v: 0.42, r: 0.030, color: "teal", kind: "square" },
      { u: 0.12, v: 0.62, r: 0.028, color: "ink", kind: "square" },
      { u: 0.68, v: 0.12, r: 0.026, color: "ink", kind: "circle" },
      { u: 0.88, v: 0.18, r: 0.024, color: "orange", kind: "circle" },
      { u: 0.11, v: 0.40, r: 0.022, color: "ink", kind: "circle" },
      { u: 0.14, v: 0.85, r: 0.020, color: "teal", kind: "circle" },
      { u: 0.36, v: 0.88, r: 0.018, color: "ink", kind: "circle" },
      { u: 0.58, v: 0.88, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.90, v: 0.62, r: 0.016, color: "orange", kind: "circle" },
      { u: 0.54, v: 0.10, r: 0.014, color: "teal", kind: "circle" },
      { u: 0.25, v: 0.89, r: 0.014, color: "ink", kind: "circle" },
    ],
  },
};
