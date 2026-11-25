// 118 闭合性原则 · 单真源几何模型
// 所有开场画布、实时读数、四柱检核与白话诊单均由此模块从实绘线段/弧段坐标统一计算。

export const THRESHOLDS = {
  gapMin: 0.08,       // 低于 8% 接近全封死，不构成闭合性留白
  gapSafeMax: 0.44,   // 经验参考带上限：超过 44% 端点跨度过大易溃散
  gapSweetMin: 0.12,
  gapSweetMax: 0.34,
  driftMax: 0.06,     // 圆弧径向偏心允许误差（占半径比例）
  tiltMaxDeg: 8,      // 线段延伸偏角允许误差（度）
};

export const PRESETS = {
  broken: {
    label: "复原 0/3 错态",
    circle: { gap: 0.62, drift: 0.24 },
    triangle: { gap: 0.52, tilt: 28 },
    square: { gap: 0.38, cutMode: "corners" },
  },
  poster: {
    label: "原海报经典解",
    circle: { gap: 0.24, drift: 0 },
    triangle: { gap: 0.26, tilt: 0 },
    square: { gap: 0.24, cutMode: "sides" },
  },
  minimal: {
    label: "极简省墨解",
    circle: { gap: 0.38, drift: 0 },
    triangle: { gap: 0.39, tilt: 0 },
    square: { gap: 0.38, cutMode: "sides" },
  },
  sturdy: {
    label: "稳健厚墨解",
    circle: { gap: 0.14, drift: 0 },
    triangle: { gap: 0.15, tilt: 0 },
    square: { gap: 0.14, cutMode: "sides" },
  },
  sealed: {
    label: "试错：死画封死",
    circle: { gap: 0.02, drift: 0 },
    triangle: { gap: 0.02, tilt: 0 },
    square: { gap: 0.02, cutMode: "sides" },
  },
  oneSide: {
    label: "试错：单侧大豁口",
    circle: { gap: 0.24, drift: 0 },
    triangle: { gap: 0.26, tilt: 0 },
    square: { gap: 0.36, cutMode: "oneSide" },
  },
};

export function createHeroState() {
  return {
    motif: "poster", // "poster" | "emblem" | "ui"
    focus: "all",    // "all" | "circle" | "triangle" | "square"
    circle: { ...PRESETS.broken.circle },
    triangle: { ...PRESETS.broken.triangle },
    square: { ...PRESETS.broken.square },
    showMindRays: true,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 生成橘色断圆的 4 段弧几何，并单真源计算缺口跨度与偏心度
export function buildCircleGeometry(cfg, cx, cy, r) {
  const gap = clamp(cfg.gap, 0, 0.82);
  const drift = clamp(cfg.drift, 0, 0.34);
  const quadSpan = Math.PI / 2;
  const arcAngle = quadSpan * (1 - gap);
  const gapAngle = quadSpan * gap;
  // 缺口开在 12、3、6、9 点（与 118 原海报橘圆一致）
  const centers = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  const arcs = centers.map((mid, idx) => {
    const isDrifted = idx === 0 && drift > 0.005;
    const ox = isDrifted ? Math.cos(mid) * r * drift : 0;
    const oy = isDrifted ? Math.sin(mid) * r * drift : 0;
    return {
      idx,
      mid,
      start: mid - arcAngle / 2,
      end: mid + arcAngle / 2,
      cx: cx + ox,
      cy: cy + oy,
      ox,
      oy,
      r,
      drifted: isDrifted,
    };
  });
  const chordGapRatio = 2 * Math.sin(gapAngle / 2); // 单处缺口弦长 / 半径
  let code = "closed";
  if (gap < THRESHOLDS.gapMin) code = "sealed";
  else if (drift > THRESHOLDS.driftMax) code = "drifted";
  else if (gap > THRESHOLDS.gapSafeMax) code = "shattered";

  return {
    kind: "circle",
    name: "橘色断圆",
    arcs,
    cx,
    cy,
    r,
    gapRatio: gap,
    inkRatio: 1 - gap,
    driftRatio: drift,
    chordGapRatio,
    cornerRetention: 1, // 圆周曲率均匀，只要偏心在限内曲率连贯
    alignErrorDeg: Math.round(drift * 90),
    ok: code === "closed",
    code,
    tier:
      code !== "closed"
        ? "未闭合"
        : gap <= 0.18
        ? "稳健闭合"
        : gap >= 0.34
        ? "极简省墨"
        : "经典闭合",
  };
}

// 生成松绿断三角的 3 条直边，并计算右侧斜边偏转后的虚拟顶点脱靶误差
export function buildTriangleGeometry(cfg, cx, cy, r) {
  const gap = clamp(cfg.gap, 0, 0.82);
  const tilt = clamp(cfg.tilt, -42, 42);
  // 正三角三顶点（上顶、右下、左下）
  const vTop = { x: cx, y: cy - r * 1.04 };
  const vBR = { x: cx + r * 0.96, y: cy + r * 0.82 };
  const vBL = { x: cx - r * 0.96, y: cy + r * 0.82 };
  const rawEdges = [
    { a: vTop, b: vBR, name: "右斜边", canTilt: true },
    { a: vBR, b: vBL, name: "底横边", canTilt: false },
    { a: vBL, b: vTop, name: "左斜边", canTilt: false },
  ];
  const sideLen = Math.hypot(vBR.x - vTop.x, vBR.y - vTop.y);
  const trim = (gap / 2); // 两端各缩 gap/2，使顶点留出均匀缺口（复刻 118 原海报三角）
  const edges = rawEdges.map((e, idx) => {
    const mx = (e.a.x + e.b.x) / 2;
    const my = (e.a.y + e.b.y) / 2;
    const dx = e.b.x - e.a.x;
    const dy = e.b.y - e.a.y;
    const keepHalf = (1 - gap) / 2;
    let x1 = mx - dx * keepHalf;
    let y1 = my - dy * keepHalf;
    let x2 = mx + dx * keepHalf;
    let y2 = my + dy * keepHalf;
    let rad = 0;
    if (e.canTilt && Math.abs(tilt) > 0.1) {
      rad = (tilt * Math.PI) / 180;
      const rot = (px, py) => {
        const rx = px - mx;
        const ry = py - my;
        return {
          x: mx + rx * Math.cos(rad) - ry * Math.sin(rad),
          y: my + rx * Math.sin(rad) + ry * Math.cos(rad),
        };
      };
      const p1 = rot(x1, y1);
      const p2 = rot(x2, y2);
      x1 = p1.x;
      y1 = p1.y;
      x2 = p2.x;
      y2 = p2.y;
    }
    // 延长线到原顶点的垂直脱靶距离（归一化为边长比例）
    const ux = (x2 - x1) / (Math.hypot(x2 - x1, y2 - y1) || 1);
    const uy = (y2 - y1) / (Math.hypot(x2 - x1, y2 - y1) || 1);
    const missPx = Math.abs((vTop.x - x1) * uy - (vTop.y - y1) * ux);
    return {
      idx,
      name: e.name,
      x1,
      y1,
      x2,
      y2,
      mx,
      my,
      ux,
      uy,
      tilted: e.canTilt && Math.abs(tilt) > 0.5,
      missRatio: e.canTilt ? missPx / sideLen : 0,
    };
  });

  const maxMissRatio = edges[0].missRatio;
  let code = "closed";
  if (gap < THRESHOLDS.gapMin) code = "sealed";
  else if (Math.abs(tilt) > THRESHOLDS.tiltMaxDeg) code = "misaligned";
  else if (gap > THRESHOLDS.gapSafeMax) code = "shattered";

  return {
    kind: "triangle",
    name: "松绿断三角",
    vertices: [vTop, vBR, vBL],
    edges,
    cx,
    cy,
    r,
    gapRatio: gap,
    inkRatio: 1 - gap,
    tiltDeg: tilt,
    vertexMissRatio: maxMissRatio,
    cornerRetention: gap < 0.04 ? 1 : Math.abs(tilt) <= THRESHOLDS.tiltMaxDeg ? 0.92 : 0.35,
    alignErrorDeg: Math.round(Math.abs(tilt)),
    ok: code === "closed",
    code,
    tier:
      code !== "closed"
        ? "未闭合"
        : gap <= 0.18
        ? "稳健闭合"
        : gap >= 0.34
        ? "极简省墨"
        : "经典闭合",
  };
}

// 生成蔷薇粉断方的 4 组折角/直边，直接检验 Attneave 拐角保留与单侧豁口
export function buildSquareGeometry(cfg, cx, cy, half) {
  const gap = clamp(cfg.gap, 0, 0.82);
  const cutMode = cfg.cutMode || "sides"; // "sides" | "corners" | "oneSide"
  const x0 = cx - half;
  const x1 = cx + half;
  const y0 = cy - half;
  const y1 = cy + half;
  const side = half * 2;
  const paths = [];
  let cornerRetention = 1;
  let maxSingleGapRatio = gap;

  if (cutMode === "sides") {
    // 复刻 118 原海报粉红方：保留 4 处完整 90° L 拐角，缺口开在 4 条直边中段
    const arm = side * (1 - gap) * 0.5;
    paths.push([
      { x: x0, y: y0 + arm },
      { x: x0, y: y0 },
      { x: x0 + arm, y: y0 },
    ]);
    paths.push([
      { x: x1 - arm, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y0 + arm },
    ]);
    paths.push([
      { x: x1, y: y1 - arm },
      { x: x1, y: y1 },
      { x: x1 - arm, y: y1 },
    ]);
    paths.push([
      { x: x0 + arm, y: y1 },
      { x: x0, y: y1 },
      { x: x0, y: y1 - arm },
    ]);
    cornerRetention = 1;
    maxSingleGapRatio = gap;
  } else if (cutMode === "corners") {
    // 错态：切掉 4 处 90° 拐角，只留 4 段悬空直边中段
    const seg = side * (1 - gap);
    const pad = (side - seg) / 2;
    paths.push([
      { x: x0 + pad, y: y0 },
      { x: x1 - pad, y: y0 },
    ]);
    paths.push([
      { x: x1, y: y0 + pad },
      { x: x1, y: y1 - pad },
    ]);
    paths.push([
      { x: x1 - pad, y: y1 },
      { x: x0 + pad, y: y1 },
    ]);
    paths.push([
      { x: x0, y: y1 - pad },
      { x: x0, y: y0 + pad },
    ]);
    cornerRetention = gap < 0.04 ? 1 : 0;
    maxSingleGapRatio = gap;
  } else {
    // 错态 oneSide：把全部缺口集中挖在右侧整边与右下角，左侧死封成 C / 匚 敞口
    const totalPerim = side * 4;
    const totalCut = totalPerim * gap;
    const rightRemain = Math.max(0, side - totalCut);
    const extraCut = Math.max(0, totalCut - side);
    const topEnd = Math.max(x0 + side * 0.25, x1 - extraCut * 0.5);
    const botEnd = Math.max(x0 + side * 0.25, x1 - extraCut * 0.5);
    const pts = [];
    if (rightRemain > 4) {
      pts.push({ x: x1, y: y0 + rightRemain * 0.5 });
      pts.push({ x: x1, y: y0 });
    } else {
      pts.push({ x: topEnd, y: y0 });
    }
    pts.push({ x: x0, y: y0 });
    pts.push({ x: x0, y: y1 });
    if (rightRemain > 4) {
      pts.push({ x: x1, y: y1 });
      pts.push({ x: x1, y: y1 - rightRemain * 0.5 });
    } else {
      pts.push({ x: botEnd, y: y1 });
    }
    paths.push(pts);
    cornerRetention = extraCut > 4 ? 0.5 : 0.75;
    maxSingleGapRatio = Math.min(1.6, totalCut / side);
  }

  let code = "closed";
  if (gap < THRESHOLDS.gapMin) code = "sealed";
  else if (cutMode === "corners") code = "cornersCut";
  else if (cutMode === "oneSide" && gap >= 0.14) code = "oneSideBreach";
  else if (gap > THRESHOLDS.gapSafeMax) code = "shattered";

  return {
    kind: "square",
    name: "蔷薇粉断方",
    bounds: { x0, y0, x1, y1, side, half },
    paths,
    cx,
    cy,
    half,
    gapRatio: gap,
    inkRatio: 1 - gap,
    cutMode,
    cornerRetention,
    maxSingleGapRatio,
    alignErrorDeg: 0,
    ok: code === "closed",
    code,
    tier:
      code !== "closed"
        ? "未闭合"
        : gap <= 0.18
        ? "稳健闭合"
        : gap >= 0.34
        ? "极简省墨"
        : "经典闭合",
  };
}

// 统一评估三形总体闭合状态（供画布、诊单、右注栏、四柱章共享）
export function evaluateHero(state) {
  const c = buildCircleGeometry(state.circle, 0, 0, 100);
  const t = buildTriangleGeometry(state.triangle, 0, 0, 100);
  const s = buildSquareGeometry(state.square, 0, 0, 100);
  const list = [c, t, s];
  const passed = list.filter((x) => x.ok).length;
  const avgGap = (c.gapRatio + t.gapRatio + s.gapRatio) / 3;
  const avgInk = 1 - avgGap;
  const avgCorner = Math.round(((c.cornerRetention + t.cornerRetention + s.cornerRetention) / 3) * 100);
  const maxAlignErr = Math.max(c.alignErrorDeg, t.alignErrorDeg, s.alignErrorDeg);

  // 优先级判定当前最核心的错误与白话原因
  let statusTag = "闭合成立";
  let tone = "ok"; // "ok" | "err" | "warn"
  let headline = "三形缺口得当，大脑瞬间补出完整轮廓";
  let reason =
    `当前平均省去 ${Math.round(avgGap * 100)}% 实墨（保留 ${Math.round(avgInk * 100)}%），四处直角与顶点延长线全部咬合。人眼无需多余线条就能把分散弧段、斜边与折角锁成一个稳定整体。`;
  let hint = "你可以继续向右拉到 36%–42% 试探「极简省墨极限」，或故意拉到 0% / 60% 看看两种翻车边界。";

  if (passed < 3) {
    tone = "err";
    if (list.some((x) => x.code === "sealed")) {
      statusTag = `错态 · 死画封死 (${passed}/3)`;
      headline = `缺口压到 ${Math.round(Math.min(c.gapRatio, t.gapRatio, s.gapRatio) * 100)}%，这不是闭合而是画满`;
      reason =
        "线条几乎首尾封死时，图形全靠物理实墨围住，根本没有留给大脑参与补全的空间——既失去省墨透气感，也退回普通实线描框。";
      hint = "在画布上向右横拖（或按 → 键），把缺口打开到 10%–42% 经验参考带。";
    } else if (s.code === "cornersCut") {
      statusTag = `错态 · 拐角被切 (${passed}/3)`;
      headline = "粉红方切掉了四个直角，脑中只剩四根松散短杠";
      reason =
        "轮廓信息集中在曲率突变的拐角（Attneave, 1954）。把四个 90° 顶点削掉、只留直边中段时，哪怕总墨量足够，大脑也很难架桥确认这是方形。";
      hint = "直接点击画布上的粉红方形（或点下方「切直边留四角」），把缺口挪回四条直边中段。";
    } else if (s.code === "oneSideBreach") {
      statusTag = `错态 · 单侧大豁口 (${passed}/3)`;
      headline = "粉红方把缺口全挖在右侧，整面墙塌成了开口「匚」";
      reason =
        `同样删去 ${Math.round(s.gapRatio * 100)}% 周长，全堆在同一侧会让单处断口跨度超限，右侧彻底敞开，视觉上变成开放支架而非闭合方形。`;
      hint = "把粉红方切回「均匀切直边」，让缺口分散在四边中段而非单边坍塌。";
    } else if (t.code === "misaligned") {
      statusTag = `错态 · 延长错轨 (${passed}/3)`;
      headline = `松绿三角右斜边歪了 ${Math.abs(t.tiltDeg)}°，延长线在顶上错开了`;
      reason =
        "闭合性必须借力连续性：缺口两侧的笔端若不再指向同一个虚拟交点，大脑就会把斜边读成一根独立摆歪的木条，拒绝为你合拢顶点。";
      hint = "直接点击画布上带红标的松绿斜边（或按 R 键），把偏角转回 ±8° 以内对准顶点。";
    } else if (c.code === "drifted") {
      statusTag = `错态 · 偏心散弧 (${passed}/3)`;
      headline = `橘色圆弧偏离圆心 ${Math.round(c.driftRatio * 100)}%，曲率对不上圆周`;
      reason =
        "四段弧线之所以能闭合为圆，靠的是共享同一圆心与半径。一旦有一段弧向外滑脱，相邻弧端切线错层，整圆立刻裂成几瓣橘皮。";
      hint = "直接点击画布上带红框的漂移橘弧（或按 R 键），把它吸回共同圆周。";
    } else if (list.some((x) => x.code === "shattered")) {
      const worst = [...list].sort((a, b) => b.gapRatio - a.gapRatio)[0];
      statusTag = `错态 · 缺口溃散 (${passed}/3)`;
      headline = `${worst.name}缺口高达 ${Math.round(worst.gapRatio * 100)}%，跨距太宽补不上了`;
      reason =
        `物理实墨只剩 ${Math.round(worst.inkRatio * 100)}%，相邻笔端之间的空隙拉得太长（超过约 44% 经验闭合带），视觉系统放弃架桥，只看到互不相连的零碎短线。`;
      hint = "在画布上向左横拖（或按 ← 键），把缺口收回到 10%–42% 经验参考带内。";
    }
  } else {
    // 全部 3/3 闭合成立：区分不同合法解档位
    if (avgGap >= 0.34) {
      statusTag = "成立 · 极简省墨解 (3/3)";
      headline = `省去 ${Math.round(avgGap * 100)}% 实墨仍稳稳闭合，呼吸感拉满`;
      reason =
        "你正踩在经验闭合带的极简高区：笔墨极省，但四个直角、三角交汇向与同心圆弧都丝毫不差，靠最少的墨点亮最完整的整体。";
    } else if (avgGap <= 0.18) {
      statusTag = "成立 · 稳健厚墨解 (3/3)";
      headline = `保留 ${Math.round(avgInk * 100)}% 实墨轻开呼吸口，小字号也耐看`;
      reason =
        "窄缺口在远距观看或小尺寸图标里容错率最高，既有闭合透气感，又不会因屏幕缩小糊掉结构。";
    } else {
      statusTag = "成立 · 原海报经典解 (3/3)";
      headline = "三形缺口与对准全部落位，大脑自动补全圆、三角与方";
    }
  }

  // 原海报底沿四关键词实时检核状态（缺口 / 补全 / 整体 / 轮廓）
  const minGap = Math.min(c.gapRatio, t.gapRatio, s.gapRatio);
  const maxGap = Math.max(c.gapRatio, t.gapRatio, s.gapRatio);
  const gapOk = minGap >= THRESHOLDS.gapMin && maxGap <= THRESHOLDS.gapSafeMax;
  const pillars = {
    gap: {
      ok: gapOk,
      badge:
        minGap < THRESHOLDS.gapMin
          ? `过窄 ${Math.round(minGap * 100)}%`
          : maxGap > THRESHOLDS.gapSafeMax
          ? `过宽 ${Math.round(maxGap * 100)}%`
          : `适中 ${Math.round(avgGap * 100)}%`,
    },
    complete: {
      ok: passed === 3,
      badge: passed === 3 ? "三形全补" : `仅成 ${passed}/3`,
    },
    whole: {
      ok: s.code !== "cornersCut" && s.code !== "oneSideBreach" && c.code !== "drifted",
      badge:
        s.code === "cornersCut"
          ? "拐角缺失"
          : s.code === "oneSideBreach"
          ? "单侧敞口"
          : c.code === "drifted"
          ? "圆弧偏心"
          : "整体稳固",
    },
    outline: {
      ok: t.code !== "misaligned" && c.code !== "drifted",
      badge: t.code === "misaligned" ? `错轨 ${Math.abs(t.tiltDeg)}°` : c.code === "drifted" ? "弧线脱轨" : "轮廓对齐",
    },
  };

  // 原海报右侧两段标注的实时白话联动
  const physicalNote =
    passed === 3
      ? `实绘平均保留 ${Math.round(avgInk * 100)}% 墨迹，缺口均匀分布在非关键段，三形各有呼吸。`
      : `当前存在 ${3 - passed} 处硬伤：${list
          .filter((x) => !x.ok)
          .map((x) => `${x.name}（${codeLabel(x.code)}）`)
          .join("、")}。`;

  const mentalNote =
    passed === 3
      ? "大脑沿三组笔端无缝架桥，在下舱投射出稳定的虚线圆、三角与方。"
      : `下舱显影中断：仅有 ${passed}/3 图形能自动补全，红标处视觉桥梁已坍塌。`;

  return {
    shapes: { circle: c, triangle: t, square: s },
    list,
    passed,
    avgGap,
    avgInk,
    avgCorner,
    maxAlignErr,
    statusTag,
    tone,
    headline,
    reason,
    hint,
    pillars,
    physicalNote,
    mentalNote,
  };
}

export function codeLabel(code) {
  switch (code) {
    case "sealed": return "死画封死";
    case "shattered": return "缺口溃散";
    case "drifted": return "偏心散弧";
    case "misaligned": return "延长错轨";
    case "cornersCut": return "拐角被切";
    case "oneSideBreach": return "单侧豁口";
    default: return "闭合成立";
  }
}

// 01 节：拐角 vs 直边 8 段交互评估模型（4 拐角段 + 4 直边段，每段 12.5% 周长）
export function evaluateCornerPuzzle(segments) {
  // segments: boolean[8]，偶数索引 0,2,4,6 为 4 处 90° 拐角，奇数索引 1,3,5,7 为 4 段直边中段
  const cornersOn = [0, 2, 4, 6].filter((i) => segments[i]).length;
  const sidesOn = [1, 3, 5, 7].filter((i) => segments[i]).length;
  const activeCount = cornersOn + sidesOn;
  const inkPct = Math.round((activeCount / 8) * 100);

  let grade = "崩散待补";
  let tone = "err";
  let explain = "";

  if (activeCount === 8) {
    grade = "全封实框（未省墨）";
    tone = "warn";
    explain = "8 段全开等于普通实线框：固然封闭，但没有省去任何笔墨，也没有激发闭合性留白。试着点掉四段直边中段看看。";
  } else if (activeCount === 0) {
    grade = "空白画布";
    tone = "err";
    explain = "没有任何线段留下，大脑无从补全。至少点亮 4 处拐角来触发闭合。";
  } else if (cornersOn === 4 && sidesOn === 0) {
    grade = "极稳闭合（经典省墨 50%）";
    tone = "ok";
    explain = "只用了 50% 的笔墨，却保留了 4/4 高曲率拐角！每个 90° 折角同时锁住了两条相邻直边的方向，大脑瞬间拼回完整方形。";
  } else if (cornersOn === 0 && sidesOn === 4) {
    grade = "闭合崩塌（同为 50% 墨）";
    tone = "err";
    explain = "同样用了 50% 的笔墨，但 4 处拐角全部缺失（0/4）。四段悬浮直边缺乏交汇锚点，人眼更容易看成松散的括号或十字空隙。";
  } else if (cornersOn >= 3 && activeCount >= 4) {
    grade = "稳定闭合";
    tone = "ok";
    explain = `保留了 ${cornersOn}/4 处拐角与 ${inkPct}% 实墨，关键转折锚点足够支撑视觉系统把缺口连成方形。`;
  } else if (cornersOn === 2 && ((segments[0] && segments[4]) || (segments[2] && segments[6]))) {
    grade = "勉强可辨（对角定位）";
    tone = "warn";
    explain = "对角两处 90° 折角像取景框一样框出了外接边界，但其余两角全空，脑补速度明显慢于四角齐备的版本。";
  } else {
    grade = "结构残缺（难闭合）";
    tone = "err";
    explain = `目前仅保留 ${cornersOn}/4 处拐角（实墨 ${inkPct}%），缺少足够转折约束，轮廓容易被读成开放折线或零散短杠。`;
  }

  return { cornersOn, sidesOn, activeCount, inkPct, grade, tone, explain };
}

// 06 节：眼力小测四方案数据（严格等墨量 62%，等线宽，仅单变量差异）
export const DRILL_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: true,
    cutMode: "sides",
    tiltDeg: 0,
    gap: 0.38,
    verdict: "正确：四处 90° 拐角完整保留，缺口开在直边正中，相邻笔端精准共线，大脑补全最快最稳。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    cutMode: "corners",
    tiltDeg: 0,
    gap: 0.38,
    verdict: "偏弱：总墨量与方案 A 一模一样（62%），但切掉了信息密度最高的四个 90° 拐角，图形退化成四根悬浮短杠。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    cutMode: "skewed",
    tiltDeg: 16,
    gap: 0.38,
    verdict: "偏弱：虽然保留了四个折角，但每段角臂向外歪了 16°，延长线不再迎头相接，破坏了连续性支撑，很难脑补成规整方形。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    cutMode: "oneSide",
    tiltDeg: 0,
    gap: 0.38,
    verdict: "偏弱：把 38% 的缺口全堆到右侧一整条边与右下角，左侧则完全死封，视觉上读成一个开口的「匚」而非闭合方形。",
  },
];
