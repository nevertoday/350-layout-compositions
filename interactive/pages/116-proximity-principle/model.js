// 116 邻近性原则 · 核心单真源几何与知觉模型
// 所有画面元素（原海报 48 圆阵 / 商品信息卡 / 标题段落）的坐标、净空、离合比、聚类数与白话诊断
// 均由同一份状态实时计算，绝不写死常量。

export const PALETTE = {
  paper: "#FCF0E4",
  paperDeep: "#F5E4D2",
  ink: "#060405",
  inkSoft: "#221E1B",
  muted: "#584F47",
  green: "#20896F",
  greenDark: "#10634F",
  sand: "#ECDEC7",
  sandStroke: "#C7B08D",
  sandDark: "#6A4F2B",
  orange: "#F3531C",
  orangeDark: "#B53208",
  pink: "#F8A3B7",
  pinkDark: "#9E2B4B",
  rule: "#2F2A25",
};

// 原海报四组真实配置（合计 9 + 15 + 12 + 12 = 48 枚）
export const GROUP_META = [
  {
    id: 0,
    name: "右上绿阵",
    short: "绿 3×3",
    cols: 3,
    rows: 3,
    color: PALETTE.green,
    darkText: PALETTE.greenDark,
    stroke: null,
    // 原海报相对质心 (u, v)：横平竖直四象限布局，为三组叠排与中央虚线留足大沟槽
    posterCenter: { u: 0.62, v: 0.17 },
    posterHierarchy: 0, // 紧聚
  },
  {
    id: 1,
    name: "中右沙阵",
    short: "沙 5×3",
    cols: 5,
    rows: 3,
    color: PALETTE.sand,
    darkText: PALETTE.sandDark,
    stroke: PALETTE.sandStroke,
    posterCenter: { u: 0.66, v: 0.50 },
    posterHierarchy: 1, // 适中
  },
  {
    id: 2,
    name: "左下橘阵",
    short: "橘 3×4",
    cols: 3,
    rows: 4,
    color: PALETTE.orange,
    darkText: PALETTE.orangeDark,
    stroke: null,
    posterCenter: { u: 0.18, v: 0.63 },
    posterHierarchy: 0, // 紧聚
  },
  {
    id: 3,
    name: "右下粉阵",
    short: "粉 4×3",
    cols: 4,
    rows: 3,
    color: PALETTE.pink,
    darkText: PALETTE.pinkDark,
    stroke: null,
    posterCenter: { u: 0.67, v: 0.83 },
    posterHierarchy: 2, // 疏朗
  },
];

// 疏密等级：0 紧聚（大圆小缝），1 适中，2 疏朗（略小圆大缝）
export const HIERARCHY_LEVELS = [
  { label: "紧聚", radiusScale: 1.08, gapScale: 0.72 },
  { label: "适中", radiusScale: 0.98, gapScale: 1.00 },
  { label: "疏朗", radiusScale: 0.86, gapScale: 1.55 },
];

// 把 48 颗点映射到开场 8×6 均质栅格，保证裂开为 4 组时轨迹短、不交叉打结
const UNIFORM_SLOTS = (() => {
  const slots = [];
  // 组 0 (3×3): 右上 (col 4..6, row 0..2) -> 9
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) slots.push({ g: 0, lr: r, lc: c, uc: 4 + c, ur: r });
  // 组 1 (5×3): 中间及右上补位：优先取 col 3..7, row 2..4 附近，先精确分配不重叠的 48 个槽
  const used = new Set(slots.map((s) => `${s.uc},${s.ur}`));
  const claim = (g, cols, rows, prefU, prefV) => {
    const free = [];
    for (let ur = 0; ur < 6; ur++) {
      for (let uc = 0; uc < 8; uc++) {
        if (!used.has(`${uc},${ur}`)) free.push({ uc, ur });
      }
    }
    const items = [];
    for (let lr = 0; lr < rows; lr++) {
      for (let lc = 0; lc < cols; lc++) {
        const tu = prefU + (lc - (cols - 1) / 2) * 0.9;
        const tv = prefV + (lr - (rows - 1) / 2) * 0.9;
        let bestIdx = 0;
        let bestD = Infinity;
        for (let i = 0; i < free.length; i++) {
          const d = Math.hypot(free[i].uc - tu, free[i].ur - tv);
          if (d < bestD) {
            bestD = d;
            bestIdx = i;
          }
        }
        const pick = free.splice(bestIdx, 1)[0];
        used.add(`${pick.uc},${pick.ur}`);
        items.push({ g, lr, lc, uc: pick.uc, ur: pick.ur });
      }
    }
    slots.push(...items);
  };
  // 组 2 (3×4): 左下区 (col 0..2, row 2..5)
  claim(2, 3, 4, 1.0, 3.5);
  // 组 3 (4×3): 右下区 (col 4..7, row 3..5)
  claim(3, 4, 3, 5.5, 4.2);
  // 组 1 (5×3): 剩余 15 格（左上到中右自然过渡）
  claim(1, 5, 3, 2.5, 1.2);
  return slots;
})();

export function createInitialState() {
  return {
    scene: "poster",          // 'poster' | 'cards' | 'article'
    colorMode: "mono",        // 'mono' | 'poster' | 'conflict'
    outerGap: 0.0,            // 0..1：开场 0 = 均质无缝糊墙（非答案！）
    innerGap: 0.46,           // 0..1：开场与 outerGap=0 组成完美 1.00x 等距黑墙
    hierarchy: [1, 1, 1, 1],  // 开场四组平权（均适中）
    stray: { active: false, u: 0.44, v: 0.52 },
    inspectKey: null,         // null | 'cluster' | 'distance' | 'grouping' | 'hierarchy'
  };
}

export const PRESETS = {
  broken: {
    outerGap: 0.0,
    innerGap: 0.46,
    hierarchy: [1, 1, 1, 1],
    colorMode: "mono",
    stray: { active: false, u: 0.44, v: 0.52 },
  },
  poster: {
    outerGap: 0.92,
    innerGap: 0.48,
    hierarchy: [0, 1, 0, 2],
    colorMode: "poster",
    stray: { active: false, u: 0.44, v: 0.52 },
  },
  monoPass: {
    outerGap: 0.90,
    innerGap: 0.48,
    hierarchy: [0, 1, 0, 2],
    colorMode: "mono",
    stray: { active: false, u: 0.44, v: 0.52 },
  },
  inverted: {
    outerGap: 0.14,
    innerGap: 0.88,
    hierarchy: [1, 1, 1, 1],
    colorMode: "mono",
    stray: { active: false, u: 0.44, v: 0.52 },
  },
  conflict: {
    outerGap: 0.92,
    innerGap: 0.48,
    hierarchy: [0, 1, 0, 2],
    colorMode: "conflict",
    stray: { active: false, u: 0.44, v: 0.52 },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// 颜色映射：mono 纯墨验真 / poster 原海报四色 / conflict 跨组错色打架
function resolveDotVisual(slot, colorMode) {
  if (colorMode === "mono") {
    return { fill: "#181513", stroke: null, colorGroup: 0 };
  }
  if (colorMode === "poster") {
    const gm = GROUP_META[slot.g];
    return { fill: gm.color, stroke: gm.stroke, colorGroup: slot.g };
  }
  // conflict：故意把颜色按列/奇偶错涂，让同色跨组打架，证明强距离照样赢
  const cg = (slot.lc + slot.lr) % 4;
  const gm = GROUP_META[cg];
  return { fill: gm.color, stroke: gm.stroke, colorGroup: cg };
}

// ---------- 核心单真源布局计算：原海报 48 点阵 ----------
export function computePosterLayout(state, W, H) {
  const minSide = Math.min(W, H);
  const padX = Math.max(22, W * 0.048);
  const padY = Math.max(24, H * 0.055);
  const usableW = Math.max(120, W - padX * 2);
  const usableH = Math.max(120, H - padY * 2);

  // 基准圆半径：均质态饱满，裂开成 4 组后略微收紧以给组间通道留出饱满大留白
  const s = clamp(state.outerGap, 0, 1);
  const sEase = smooth(s);
  const shapeBlend = smooth(clamp(s / 0.42, 0, 1));
  const uniformR = clamp(minSide * 0.034, 8.5, 22);
  const spreadR = clamp(minSide * 0.027, 7.0, 18.0);
  const baseR = lerp(uniformR, spreadR, shapeBlend);

  // 均质 8×6 网格步长（随 innerGap 伸缩：0→贴紧挤撞，0.46→舒适等距，1→极松）
  const maxUniformStep = Math.min(usableW / 7.8, usableH / 5.8);
  const minUniformStep = uniformR * 1.72;
  const uniformStep = lerp(minUniformStep, maxUniformStep * 0.96, clamp(state.innerGap, 0, 1));
  const uOriginX = W * 0.5 - 3.5 * uniformStep;
  const uOriginY = H * 0.5 - 2.5 * uniformStep;

  // 展开态显式边缘净空：innerGap < 0.18 时净空为负（真实挤撞）；0.48 为原海报健康呼吸缝；> 0.82 极松散
  // 局部矩阵规整度 shapeBlend 在 outerGap >= 0.42 时即达 100%，保证四组内部横平竖直绝不歪斜互撞
  const baseClearance = lerp(-spreadR * 0.28, spreadR * 1.02, clamp(state.innerGap, 0, 1));
  const spreadFactor = lerp(0.32, 1.0, sEase);

  const groupCenters = GROUP_META.map((gm) => {
    const px = padX + usableW * gm.posterCenter.u;
    const py = padY + usableH * gm.posterCenter.v;
    return {
      x: lerp(W * 0.5, px, spreadFactor),
      y: lerp(H * 0.5, py, spreadFactor),
    };
  });

  // 防止四组质心在高 outerGap 下越界出画框
  const dots = [];
  const groupBounds = GROUP_META.map(() => ({ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, cx: 0, cy: 0, count: 0, r: baseR }));

  for (let i = 0; i < UNIFORM_SLOTS.length; i++) {
    const slot = UNIFORM_SLOTS[i];
    const gm = GROUP_META[slot.g];
    const hLvl = HIERARCHY_LEVELS[state.hierarchy[slot.g] ?? 1];

    // 均质栅格位置
    const ux = uOriginX + slot.uc * uniformStep;
    const uy = uOriginY + slot.ur * uniformStep;

    const r = baseR * lerp(1, hLvl.radiusScale, shapeBlend * 0.9 + (state.hierarchy[slot.g] !== 1 ? 0.1 : 0));
    const localClear = baseClearance < 0 ? baseClearance : baseClearance * lerp(1, hLvl.gapScale, shapeBlend);
    const gPitch = 2 * r + localClear;
    const gc = groupCenters[slot.g];
    const gx = gc.x + (slot.lc - (gm.cols - 1) / 2) * gPitch;
    const gy = gc.y + (slot.lr - (gm.rows - 1) / 2) * gPitch;
    let x = lerp(ux, gx, shapeBlend);
    let y = lerp(uy, gy, shapeBlend);

    // 柔和夹在安全边距内
    x = clamp(x, r + 10, W - r - 10);
    y = clamp(y, r + 10, H - r - 10);

    const vis = resolveDotVisual(slot, state.colorMode);
    dots.push({
      id: i,
      g: slot.g,
      lr: slot.lr,
      lc: slot.lc,
      x,
      y,
      r,
      fill: vis.fill,
      stroke: vis.stroke,
      colorGroup: vis.colorGroup,
    });
  }

  for (const d of dots) {
    const b = groupBounds[d.g];
    b.minX = Math.min(b.minX, d.x - d.r);
    b.maxX = Math.max(b.maxX, d.x + d.r);
    b.minY = Math.min(b.minY, d.y - d.r);
    b.maxY = Math.max(b.maxY, d.y + d.r);
    b.cx += d.x;
    b.cy += d.y;
    b.count++;
    b.r = d.r;
  }
  for (const b of groupBounds) {
    if (b.count) {
      b.cx /= b.count;
      b.cy /= b.count;
    }
  }

  // 游离点（绝对坐标）
  let strayDot = null;
  if (state.stray.active) {
    const sx = clamp(padX + usableW * state.stray.u, baseR + 12, W - baseR - 12);
    const sy = clamp(padY + usableH * state.stray.v, baseR + 12, H - baseR - 12);
    strayDot = { x: sx, y: sy, r: baseR * 0.96 };
  }

  return { dots, groupBounds, baseR, strayDot, W, H };
}

// ---------- 真实几何测距 + 单链连通分量聚类（单真源！） ----------
export function measurePosterGeometry(layout, state) {
  const { dots, groupBounds, strayDot } = layout;

  // 1. 组内最近邻中心距与净空（针对同组每对相邻格点）
  let sumCenterIn = 0;
  let countIn = 0;
  let minEdgeIn = Infinity;
  let maxCenterIn = 0;
  const perGroupCenterIn = [0, 0, 0, 0];
  const perGroupCountIn = [0, 0, 0, 0];
  const perGroupDensity = [0, 0, 0, 0];
  let sampleInPair = null;

  for (let i = 0; i < dots.length; i++) {
    const a = dots[i];
    let nearestIn = Infinity;
    let nearestPartner = null;
    for (let j = 0; j < dots.length; j++) {
      if (i === j || dots[j].g !== a.g) continue;
      const d = Math.hypot(a.x - dots[j].x, a.y - dots[j].y);
      if (d < nearestIn) {
        nearestIn = d;
        nearestPartner = dots[j];
      }
    }
    if (nearestPartner) {
      sumCenterIn += nearestIn;
      countIn++;
      perGroupCenterIn[a.g] += nearestIn;
      perGroupCountIn[a.g]++;
      maxCenterIn = Math.max(maxCenterIn, nearestIn);
      const edge = nearestIn - a.r - nearestPartner.r;
      if (edge < minEdgeIn) minEdgeIn = edge;
      if (!sampleInPair && a.g === 0 && a.lr === 0 && a.lc === 0) {
        sampleInPair = [a, nearestPartner, nearestIn, edge];
      }
    }
  }
  const avgCenterIn = countIn ? sumCenterIn / countIn : 30;
  const avgEdgeIn = avgCenterIn - 2 * layout.baseR;

  // 各组真实物理局部密度（圆面积 / 该组平均最近邻步长的平方）
  // 开场 8×6 均质点阵时每组圆径与步长完全相同，实算极差严格等于 1.00×（平权），
  // 只有当拉开分组且切出紧聚/疏朗差异后才真正拉开层级跨比！
  for (let g = 0; g < 4; g++) {
    const b = groupBounds[g];
    const gStep = perGroupCountIn[g] ? perGroupCenterIn[g] / perGroupCountIn[g] : avgCenterIn;
    perGroupDensity[g] = (Math.PI * b.r * b.r) / Math.max(1, gStep * gStep);
  }
  const maxDens = Math.max(...perGroupDensity);
  const minDens = Math.min(...perGroupDensity);
  const hierarchySpread = minDens > 0 ? maxDens / minDens : 1;

  // 2. 组间最短中心距与净空（跨组任意两点最近距离）
  let minCenterOut = Infinity;
  let minEdgeOut = Infinity;
  let sampleOutPair = null;
  // 按组对算最近距离，再取全局最短跨组通道
  const pairMinOut = [];
  for (let g1 = 0; g1 < 4; g1++) {
    for (let g2 = g1 + 1; g2 < 4; g2++) {
      let bestC = Infinity;
      let bestE = Infinity;
      let pair = null;
      for (const a of dots) {
        if (a.g !== g1) continue;
        for (const b of dots) {
          if (b.g !== g2) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const edge = dist - a.r - b.r;
          if (dist < bestC) {
            bestC = dist;
            bestE = edge;
            pair = [a, b, dist, edge];
          }
        }
      }
      if (pair) {
        pairMinOut.push({ g1, g2, dist: bestC, edge: bestE, pair });
        if (bestC < minCenterOut) {
          minCenterOut = bestC;
          minEdgeOut = bestE;
          sampleOutPair = pair;
        }
      }
    }
  }

  // 真实离合比（组间最短中心距 / 组内平均中心距）
  const ratio = avgCenterIn > 0.1 ? minCenterOut / avgCenterIn : 1;

  // 3. 单链连通分量聚类：以「局部组内典型步长 × 1.18」作为感知连通半径
  // 若点之间极其疏散（edgeIn > 2.2 * baseR）且无明显聚团，把连通半径封顶，避免假聚团
  const linkThreshold = Math.min(avgCenterIn * 1.18, layout.baseR * 4.5);
  const parent = dots.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const unite = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
      if (d <= linkThreshold) unite(i, j);
    }
  }
  const compMap = new Map();
  for (let i = 0; i < dots.length; i++) {
    const r = find(i);
    compMap.set(r, (compMap.get(r) || 0) + 1);
  }
  const clusters = compMap.size;

  // 4. 游离点归属判定
  let strayInfo = null;
  if (strayDot) {
    const dists = groupBounds.map((_, g) => {
      let best = Infinity;
      let nearestDot = null;
      for (const d of dots) {
        if (d.g !== g) continue;
        const dist = Math.hypot(d.x - strayDot.x, d.y - strayDot.y);
        if (dist < best) {
          best = dist;
          nearestDot = d;
        }
      }
      return { g, dist: best, nearestDot };
    });
    dists.sort((a, b) => a.dist - b.dist);
    const d1 = dists[0];
    const d2 = dists[1];
    const ambiguity = d1.dist / Math.max(1, d2.dist); // 越接近 1 越摇摆不定
    const farFromAll = d1.dist > avgCenterIn * 1.65;
    strayInfo = {
      nearest: d1,
      second: d2,
      ambiguity,
      isLost: ambiguity > 0.72 || farFromAll,
      farFromAll,
    };
  }

  // 5. 基于 Kubovy et al. (1998) 纯距离法则形式化的分组确信度（示意）
  // P = 1 / (1 + exp(-alpha * (ratio - 1)))，alpha 取典型经验斜率 3.4
  const confidenceRaw = 1 / (1 + Math.exp(-3.4 * (ratio - 1.0)));
  const confidence = Math.round(clamp(confidenceRaw * 100, 12, 99));

  return {
    avgCenterIn,
    avgEdgeIn,
    minEdgeIn,
    minCenterOut,
    minEdgeOut,
    ratio,
    clusters,
    hierarchySpread,
    confidence,
    sampleInPair,
    sampleOutPair,
    strayInfo,
    perGroupDensity,
  };
}

// ---------- 商品信息卡 & 文章段落：同一套距离参数的真实映射 ----------
export function computeSecondaryMetrics(state, W, H) {
  const s = clamp(state.outerGap, 0, 1);
  const inner = clamp(state.innerGap, 0, 1);
  if (state.scene === "cards") {
    // 3 组垂直/横向商品卡：组内为图片↔标题↔价格净距，组间为相邻商品卡净距
    const inPx = Math.round(lerp(1, 28, inner));
    const outPx = Math.round(lerp(inPx, Math.min(72, Math.max(36, W * 0.085)), smooth(s)));
    // 允许在 innerGap 很大且 outerGap 很小时出现真实倒挂（outPx < inPx）
    const trueOut = s < 0.25 && inner > 0.65 ? Math.round(lerp(6, 16, s / 0.25)) : outPx;
    const ratio = (trueOut + 14) / Math.max(8, inPx + 14);
    const clusters = ratio < 1.25 ? 1 : 3;
    const spread = 1 + (Math.max(...state.hierarchy) - Math.min(...state.hierarchy)) * 0.24;
    const confidence = Math.round(clamp((1 / (1 + Math.exp(-3.4 * (ratio - 1)))) * 100, 12, 99));
    return {
      inPx,
      outPx: trueOut,
      minEdgeIn: inPx,
      minEdgeOut: trueOut,
      ratio,
      clusters,
      expectedClusters: 3,
      hierarchySpread: spread,
      confidence,
      strayInfo: null,
    };
  }
  // article：标题到下方正文（段后 inPx） vs 上一段到标题（段前 outPx）
  const inPx = Math.round(lerp(1, 30, inner));
  const rawOut = Math.round(lerp(inPx, 52, smooth(s)));
  const trueOut = s < 0.24 && inner > 0.65 ? Math.round(lerp(6, 14, s / 0.24)) : rawOut;
  const ratio = (trueOut + 10) / Math.max(6, inPx + 10);
  const clusters = ratio < 1.25 ? 1 : 3;
  const spread = 1 + (Math.max(...state.hierarchy) - Math.min(...state.hierarchy)) * 0.24;
  const confidence = Math.round(clamp((1 / (1 + Math.exp(-3.4 * (ratio - 1)))) * 100, 12, 99));
  return {
    inPx,
    outPx: trueOut,
    minEdgeIn: inPx,
    minEdgeOut: trueOut,
    ratio,
    clusters,
    expectedClusters: 3,
    hierarchySpread: spread,
    confidence,
    strayInfo: null,
  };
}

// ---------- 白话单真源诊断引擎（6 类错态 + 成立态） ----------
export function diagnose(state, W = 720, H = 480) {
  const layout = computePosterLayout(state, W, H);
  const geom = state.scene === "poster" ? measurePosterGeometry(layout, state) : computeSecondaryMetrics(state, W, H);
  const targetGroups = state.scene === "poster" ? 4 : 3;
  const rTxt = geom.ratio.toFixed(2) + "×";

  // 四大关键词（原海报底沿 4 徽标）逐项单真源状态
  const checks = {
    cluster: geom.minEdgeIn >= 2 && !(state.innerGap > 0.8 && geom.ratio < 1.55),
    distance: geom.ratio >= 1.45,
    grouping: geom.clusters === targetGroups && (!geom.strayInfo || !geom.strayInfo.isLost),
    hierarchy: geom.hierarchySpread >= 1.22,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;

  let code = "valid";
  let badge = "秩序成立";
  let tone = "ok"; // 'error' | 'warn' | 'ok'
  let headline = "";
  let body = "";
  let hint = "";

  if (geom.minEdgeIn < 2) {
    code = "overlap";
    badge = "错态 · 组内挤撞";
    tone = "error";
    headline = "元素贴边撞在一起，聚成了死墨团";
    body =
      state.scene === "poster"
        ? `当前组内净空仅 ${Math.round(geom.minEdgeIn)}px，圆与圆已经相碰。邻近需要「靠近」而不是「挤压」——失去内部呼吸缝后，单个元素辨识度当场崩塌。`
        : `内部净空压到 ${Math.round(geom.minEdgeIn)}px，标题和内容黏成一坨。靠近不等于零间距，组内仍需留出基本透气缝。`;
    hint = "把竖向虚线卡尺往下拉（或调大「组内距」），给组内元素留出清晰缝隙。";
  } else if (geom.strayInfo && geom.strayInfo.isLost) {
    code = "stray_lost";
    badge = "错态 · 离群叛逃";
    tone = "error";
    const gA = GROUP_META[geom.strayInfo.nearest.g].short;
    const gB = GROUP_META[geom.strayInfo.second.g].short;
    headline = geom.strayInfo.farFromAll
      ? "这颗游离圆掉进真空，成了无家可归的孤点"
      : `游离圆卡在「${gA}」与「${gB}」正中，眼睛当场犹豫`;
    body =
      "只要一个元素停在两组之间的三不管地带，人眼就会在两个邻居间来回跳看，归属悬而未决——现实页面里的「孤立小图标」和「漂浮说明文字」就是这么诞生的。";
    hint = "在画布上把这颗虚线红环圆直接拖近任意一组，看看眼睛怎样瞬间把它「收编入籍」。";
  } else if (geom.ratio < 0.92) {
    code = "inverted";
    badge = "错态 · 倒挂错认";
    tone = "error";
    headline = `离合比跌到 ${rTxt}：组内比组间还散，眼睛当场张冠李戴`;
    body =
      state.scene === "cards"
        ? `相邻两张卡之间只隔 ${geom.outPx}px，但同一张卡里的图与价格却拉开 ${geom.inPx}px。人眼会自动把「上面的价格」错判给「下面的商品」。`
        : state.scene === "article"
        ? `小标题离上一段只剩 ${geom.outPx}px，离自己管的正文却隔着 ${geom.inPx}px——标题被眼睛硬生生划给了上一段。`
        : `组间最短距离反而小于组内步长（${rTxt}）。大脑不管你代码里怎么分组，它只认物理距离，立刻把原本分属两组的边界点硬配成一对。`;
    hint = "向右拖画布拉开「组间距」，同时收紧「组内距」，把离合比推过 1.50×（经验值）。";
  } else if (geom.ratio < 1.38 || geom.clusters < targetGroups) {
    code = "uniform";
    badge = "错态 · 均质糊墙";
    tone = "error";
    headline =
      state.scene === "cards"
        ? `图文等距平摊（${rTxt}），看不出哪行字归哪件商品`
        : state.scene === "article"
        ? `小标题悬在上下段正中（${rTxt}），两头不靠岸`
        : `48 枚黑圆等距锁成 ${geom.clusters} 块均质墙，分不出组界`;
    body =
      state.scene === "poster"
        ? `此刻组间与组内距离比只有 ${rTxt}，单链聚类把全部圆合并成 ${geom.clusters} 大坨。哪怕你心里想好了 4 组内容，只要距离没拉开，眼睛看到的只是一整面洞洞板。`
        : `组内距 ${geom.inPx}px 与组间距 ${geom.outPx}px 过于接近（${rTxt}），没有给视线留出停顿沟槽，扫读时只能逐字硬核对归属。`;
    hint = "在画布上按住向右横拖（或按 → 键），亲手把均质点阵撕开成清晰群落。";
  } else if (state.innerGap > 0.8 && geom.ratio < 1.58) {
    code = "scattered";
    badge = "错态 · 全盘散沙";
    tone = "warn";
    headline = "组内拉得太散，团块轮廓正在瓦解";
    body = `虽然离合比勉强到了 ${rTxt}，但每个组内部松得像散落的纽扣，失去了「抱团成块」的视觉重力，画面变得零碎飘浮。`;
    hint = "收紧「组内距」，让每组元素重新聚出紧实轮廓。";
  } else if (geom.hierarchySpread < 1.22) {
    code = "flat_hierarchy";
    badge = "半成 · 平权无层";
    tone = "warn";
    headline = `${targetGroups} 组已经分清（${rTxt}），但疏密雷同、还没立出层级`;
    body =
      state.scene === "poster"
        ? "你已经跨过了「分组」这关，但四组圆的紧实度一模一样，同时举手抢第一眼。回头看原海报：右上绿阵和左下橘阵紧实抢眼，右下粉阵明显疏朗退后。"
        : "模块已经清楚拆开，但每一组内部节奏完全一致，主次轻重尚未拉开。";
    hint = "直接点击画布里任意一组圆切换「紧聚 / 适中 / 疏朗」，拉出主次疏密层级。";
  } else {
    code = "valid";
    badge = state.colorMode === "conflict" ? "成立 · 距离赢过颜色" : state.colorMode === "mono" ? "成立 · 纯墨验真" : "成立 · 秩序清晰";
    tone = "ok";
    headline =
      state.colorMode === "conflict"
        ? `哪怕颜色全在打架，${rTxt} 离合比依然稳稳划出 ${targetGroups} 组`
        : state.colorMode === "mono"
        ? `零色彩零边框，单靠 ${rTxt} 距离比已清晰分出 ${targetGroups} 组与主次`
        : state.scene === "cards"
        ? `无边框无阴影，仅凭 ${geom.inPx}px / ${geom.outPx}px 间距就锁死商品归属`
        : state.scene === "article"
        ? `段前 ${geom.outPx}px、段后 ${geom.inPx}px（${rTxt}），标题稳稳吸附到正文`
        : `4 组轮廓清晰（${rTxt}），紧聚与疏朗自然分出阅读先后`;
    body =
      state.colorMode === "mono"
        ? "你刚刚用全黑同形圆亲手验证了原海报那句核心定义：无需颜色、边框或底盒，只要组间距显著大于组内距，大脑会自动完成分组与层级排序。"
        : state.colorMode === "conflict"
        ? "四组被故意涂上了交错冲突的颜色，但因为强空间缝隙足够果断，视觉系统依然优先按空间邻近归队。"
        : "组内紧聚形成单元，组间留白切出边界，再加上组间的紧疏反差，这就是 116 原海报底下那四个词「聚合 · 距离 · 分组 · 层级」的完整闭环。";
    hint = "试着点「放游离点」拖进缝隙，或切到「商品卡片 / 文章段落」看同一组距离比如何在界面里生效。";
  }

  return {
    layout,
    geom,
    checks,
    passedCount,
    code,
    badge,
    tone,
    headline,
    body,
    hint,
    targetGroups,
  };
}
