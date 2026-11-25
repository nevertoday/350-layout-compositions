// 117 连续性原则 · 单真源几何感知模型（model.js）
// 所有坐标、偏转角、交点夹角、跨距倍率、离轨偏距、视线探针串轨判别与诊断白话均由此处同一组实绘点算出。

export const LOGICAL_W = 1000;
export const LOGICAL_H = 400;

export const THRESHOLDS = {
  maxKinkDeg: 22,       // 单步偏转角上限（经验带 ≤ 22° 为顺滑，> 22° 开始出现视觉折断）
  minCrossDeg: 32,      // 交点最小清晰夹角（经验带 32°–86°；< 32° 极易浅角粘连串轨）
  maxGapRatio: 1.85,    // 最大相邻步距 / 正常步距（> 1.85× 超出局部关联场桥接，触发断链）
  maxJitterPx: 7.0,     // 最大离轨法向偏距（逻辑画布 1000×440 基准；≤ 7px 视觉顺齐）
  probeMaxStep: 2.15,   // 视线探针最大可桥接步距倍率（Field, Hayes & Hess 1993 关联场意象）
  probeMaxTurn: 56,     // 视线探针单步可追随最大转角（近似关联场约 ±60° 上限）
  minClearPx: 3.0,      // 圆点之间最小净空（低于此值则圆点粘连成实心带）
};

export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    kink: 0.76,
    crossAngle: 0.14,
    gap: 0.80,
    jitter: 0.78,
    curl: 0,
    splitY: 0,
    crowd: 0,
  },
  poster: {
    id: "poster",
    label: "原海报舒展解",
    kink: 0.0,
    crossAngle: 0.58,
    gap: 0.0,
    jitter: 0.0,
    curl: 0,
    splitY: 0,
    crowd: 0,
  },
  straight: {
    id: "straight",
    label: "双直斜交解",
    kink: 0.0,
    crossAngle: 0.78,
    gap: 0.0,
    jitter: 0.0,
    curl: -0.35, // 负值拉平 S 弧成近直线斜交
    splitY: 0,
    crowd: 0,
  },
  arch: {
    id: "arch",
    label: "大弧对交解",
    kink: 0.0,
    crossAngle: 0.68,
    gap: 0.0,
    jitter: 0.0,
    curl: 0.22,
    splitY: 0,
    crowd: 0,
  },
  stressCurl: {
    id: "stressCurl",
    label: "试错：急弯过卷",
    kink: 0.0,
    crossAngle: 0.56,
    gap: 0.0,
    jitter: 0.0,
    curl: 0.92,
    splitY: 0,
    crowd: 0,
  },
  stressParallel: {
    id: "stressParallel",
    label: "试错：平行失交",
    kink: 0.0,
    crossAngle: 0.12,
    gap: 0.0,
    jitter: 0.0,
    curl: 0,
    splitY: 0.88,
    crowd: 0,
  },
  stressCrowd: {
    id: "stressCrowd",
    label: "试错：粘连糊带",
    kink: 0.0,
    crossAngle: 0.56,
    gap: 0.0,
    jitter: 0.0,
    curl: 0,
    splitY: 0,
    crowd: 0.95,
  },
};

export function createInitialState() {
  return {
    scene: "poster", // "poster" | "transit" | "reading"
    pureInk: false,
    ...PRESETS.broken,
    highlightPillar: null, // null | "path" | "continuation" | "direction" | "flow"
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rad2deg = (r) => (r * 180) / Math.PI;

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function unitVec(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len, len };
}

function angleBetween(u, v) {
  const d = clamp(u.x * v.x + u.y * v.y, -1, 1);
  return rad2deg(Math.acos(d));
}

// 确定性离轨抖动序列（避免随机闪烁，单真源可复现）
const JITTER_PATTERN = [
  0, 0.72, -0.94, 0.86, -0.68, 0.98, -0.82, 0.56, -0.35,
  0.42, -0.95, 0.88, -0.76, 1.0, -0.84, 0.66, -0.52, 0
];

// 轨迹 1（原海报松林绿 S 曲线，从左上滑向右下）
function sampleGreenCurve(t, st) {
  const x0 = 40;
  const x1 = 910;
  const x = x0 + (x1 - x0) * t;
  const sep = (st.splitY || 0) * 86;

  // 基础平滑曲线：curl < 0 时渐趋直线，curl = 0 为原海报柔美 S 弧，curl > 0 叠加强急弯
  const flatMix = st.curl < 0 ? clamp(-st.curl / 0.35, 0, 1) : 0;
  const sCurve = 0.5 - 0.5 * Math.cos(Math.PI * t);
  const baseFrac = sCurve * (1 - flatMix) + t * flatMix;
  let y = 76 + 266 * baseFrac - sep;

  // 急弯过卷试错（高频 S 折叠）
  if (st.curl > 0) {
    const waveAmp = st.curl > 0.35 ? (st.curl - 0.15) * 92 : st.curl * 34;
    y += Math.sin(t * Math.PI * 4) * waveAmp * Math.sin(t * Math.PI);
  }

  // 局部尖折（放在 t = 0.28，位于交点左侧清晰独立象限，不扰乱交点处真实切线夹角）
  const kCenter = 0.28;
  const kWidth = 0.105;
  const kDist = Math.abs(t - kCenter);
  if (kDist < kWidth && Math.abs(st.kink) > 0.001) {
    const tri = 1 - kDist / kWidth;
    y -= st.kink * 96 * tri;
  }

  return { x, y: clamp(y, 38, 368) };
}

// 轨迹 2（原海报朱橘弧，从左下扬向右上，与绿轨在中心交汇）
function sampleOrangeBaseCurve(t, st) {
  const sep = (st.splitY || 0) * 86;
  const cx = 475;
  const cy = 209 + sep;

  // 绿轨在中心处的自然斜率约 +0.48（约 +25.6° 向下）
  // crossAngle = 0.14 时让橘轨斜率约 +0.20（向下），真实实测交角约 14° 浅角贴行！
  // crossAngle = 0.58（原海报态）时斜率约 -0.29（向上），真实实测交角约 42°–46°！
  const slope = 0.36 - st.crossAngle * 1.12;
  // 斜率较陡时等比收窄水平跨度，使陡斜交线完整落在安全高内、绝不被上下边硬截出假折角
  const maxHalfY = Math.max(70, 154 - sep);
  const maxHalfX = Math.min(438, maxHalfY / Math.max(0.32, Math.abs(slope)));
  const x0 = cx - maxHalfX;
  const x1 = cx + maxHalfX;
  const x = x0 + (x1 - x0) * t;
  const dx = x - cx;

  // 原海报中橘轨右侧略带向上柔弧，左侧平滑低伏
  const flatMix = st.curl < 0 ? clamp(-st.curl / 0.35, 0, 1) : 0;
  const gentleArch = -18 * Math.sin(Math.PI * t) * (1 - flatMix) * (st.crossAngle > 0.28 ? 1 : 0.25);

  let y = cy + slope * dx + gentleArch;

  if (st.curl > 0.35) {
    const waveAmp = (st.curl - 0.25) * 66;
    y -= Math.sin(t * Math.PI * 3.5) * waveAmp * Math.sin(t * Math.PI);
  }

  return { x, y: clamp(y, 38, 370) };
}

// 按弧长近似均匀采样，生成真实可见圆点坐标
function resampleCurve(sampleFn, count, st, skipRange = null, jitterAmt = 0) {
  const denseN = 180;
  const poly = [];
  const cum = [0];
  for (let i = 0; i <= denseN; i++) {
    const t = i / denseN;
    const p = sampleFn(t, st);
    poly.push({ ...p, t });
    if (i > 0) cum.push(cum[i - 1] + dist(poly[i - 1], p));
  }
  const totalLen = cum[denseN] || 1;
  const stepLen = totalLen / (count - 1);

  const pts = [];
  for (let k = 0; k < count; k++) {
    const targetS = k * stepLen;
    let idx = 0;
    while (idx < denseN - 1 && cum[idx + 1] < targetS) idx++;
    const seg = cum[idx + 1] - cum[idx] || 1;
    const f = clamp((targetS - cum[idx]) / seg, 0, 1);
    const p0 = poly[idx];
    const p1 = poly[idx + 1];
    const t = p0.t + (p1.t - p0.t) * f;
    let x = p0.x + (p1.x - p0.x) * f;
    let y = p0.y + (p1.y - p0.y) * f;

    // 切线与法线
    const tPrev = poly[Math.max(0, idx - 1)];
    const tNext = poly[Math.min(denseN, idx + 2)];
    const tan = unitVec(tPrev, tNext);
    const norm = { x: -tan.y, y: tan.x };

    if (skipRange && t > skipRange[0] && t < skipRange[1]) {
      continue;
    }

    let offsetPx = 0;
    if (jitterAmt > 0.001) {
      const pat = JITTER_PATTERN[k % JITTER_PATTERN.length];
      offsetPx = pat * jitterAmt * 30;
      x += norm.x * offsetPx;
      y += norm.y * offsetPx;
    }

    pts.push({
      x,
      y,
      t,
      k,
      tx: tan.x,
      ty: tan.y,
      offsetPx: Math.abs(offsetPx),
    });
  }

  return { pts, stepLen, poly, totalLen };
}

// 计算两段折线的真实几何交点与交点夹角
function findCrossing(polyA, polyB) {
  let best = null;
  for (let i = 0; i < polyA.length - 1; i++) {
    const a1 = polyA[i];
    const a2 = polyA[i + 1];
    for (let j = 0; j < polyB.length - 1; j++) {
      const b1 = polyB[j];
      const b2 = polyB[j + 1];
      const denom = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);
      if (Math.abs(denom) < 1e-6) continue;
      const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / denom;
      const u = -((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / denom;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const ix = a1.x + t * (a2.x - a1.x);
        const iy = a1.y + t * (a2.y - a1.y);
        // 用交点附近稍宽窗口算真实切向，避免离散微抖
        const aPrev = polyA[Math.max(0, i - 3)];
        const aNext = polyA[Math.min(polyA.length - 1, i + 4)];
        const bPrev = polyB[Math.max(0, j - 3)];
        const bNext = polyB[Math.min(polyB.length - 1, j + 4)];
        const va = unitVec(aPrev, aNext);
        const vb = unitVec(bPrev, bNext);
        const rawAng = angleBetween(va, vb);
        const acuteAng = Math.min(rawAng, 180 - rawAng);
        const centerDist = Math.hypot(ix - LOGICAL_W * 0.48, iy - LOGICAL_H * 0.5);
        if (!best || centerDist < best.centerDist) {
          best = { x: ix, y: iy, angleDeg: acuteAng, va, vb, centerDist };
        }
      }
    }
  }
  return best;
}

// 真实局部关联场视线探针：按「最小偏转角 + 步距窗」在全部点中一步步向前追随
function runVisualProbe(startStream, greenPts, orangePts, normalStep) {
  const all = [
    ...greenPts.map((p, idx) => ({ ...p, stream: 0, idx, id: `g-${idx}` })),
    ...orangePts.map((p, idx) => ({ ...p, stream: 1, idx, id: `o-${idx}` })),
  ];
  const own = startStream === 0 ? all.filter((p) => p.stream === 0) : all.filter((p) => p.stream === 1);
  if (own.length < 3) {
    return { path: own, status: "stalled", jumpedAt: null, stalledAt: own[0] || null, reachedOwnEnd: false };
  }

  const visited = new Set([own[0].id, own[1].id]);
  const path = [own[0], own[1]];
  let jumpedAt = null;
  let stalledAt = null;
  let maxStepTurn = 0;

  for (let step = 0; step < 30; step++) {
    const prev = path[path.length - 2];
    const curr = path[path.length - 1];
    const dir = unitVec(prev, curr);

    // 若已到达任意一条轨迹末端，结束追随
    const ownEnd = own[own.length - 1];
    const otherArr = startStream === 0 ? all.filter((p) => p.stream === 1) : all.filter((p) => p.stream === 0);
    const otherEnd = otherArr[otherArr.length - 1];
    if (curr.id === ownEnd.id) {
      return {
        path,
        status: jumpedAt ? "jumped" : "clean",
        jumpedAt,
        stalledAt: null,
        reachedOwnEnd: !jumpedAt,
        maxStepTurn,
      };
    }
    if (otherEnd && curr.id === otherEnd.id) {
      return {
        path,
        status: "jumped",
        jumpedAt: jumpedAt || curr,
        stalledAt: null,
        reachedOwnEnd: false,
        maxStepTurn,
      };
    }

    const maxReach = normalStep * THRESHOLDS.probeMaxStep;
    let bestCand = null;
    let bestScore = Infinity;

    for (const cand of all) {
      if (visited.has(cand.id)) continue;
      const d = dist(curr, cand);
      if (d < 8 || d > maxReach) continue;
      const v = unitVec(curr, cand);
      if (v.x < -0.15) continue; // 不回退
      const turn = angleBetween(dir, v);
      if (turn > THRESHOLDS.probeMaxTurn) continue;

      // 关联场代价：以局部切线偏角为主，辅以距离偏离正常步距的惩罚
      // 注意：刻意不给「同轨 ID」作弊加权，完全以纯几何平滑度判别是否会串轨！
      const stepDiff = Math.abs(d - normalStep) / normalStep;
      const score = turn + stepDiff * 24;
      if (score < bestScore) {
        bestScore = score;
        bestCand = { cand, turn, d };
      }
    }

    if (!bestCand) {
      stalledAt = curr;
      return {
        path,
        status: jumpedAt ? "jumped" : "stalled",
        jumpedAt,
        stalledAt,
        reachedOwnEnd: false,
        maxStepTurn,
      };
    }

    if (bestCand.turn > maxStepTurn) maxStepTurn = bestCand.turn;
    if (!jumpedAt && bestCand.cand.stream !== startStream) {
      jumpedAt = bestCand.cand;
    }
    visited.add(bestCand.cand.id);
    path.push(bestCand.cand);
  }

  return {
    path,
    status: jumpedAt ? "jumped" : "stalled",
    jumpedAt,
    stalledAt: path[path.length - 1],
    reachedOwnEnd: false,
    maxStepTurn,
  };
}

export function evaluate(state) {
  const count = state.crowd > 0.5 ? 28 : 18;
  const dotRadius = state.crowd > 0.5 ? 18.0 : 13.8;

  // 绿轨缺口窗口（在交点之后 t ≈ 0.70 附近）
  const gapSpan = state.gap > 0.08 ? 0.042 + state.gap * 0.068 : 0;
  const gapRange = gapSpan > 0 ? [0.70 - gapSpan, 0.70 + gapSpan] : null;

  const green = resampleCurve(sampleGreenCurve, count, state, gapRange, 0);
  const orange = resampleCurve(sampleOrangeBaseCurve, count, state, null, state.jitter);

  // 实测两条路径相邻步折角（从真实画出来的圆点坐标算！）
  let maxKinkDeg = 0;
  let kinkPoint = null;
  let kinkStream = 0;
  let totalTurnGreen = 0;
  const scanTurns = (pts, streamIdx) => {
    for (let i = 1; i < pts.length - 1; i++) {
      const v1 = unitVec(pts[i - 1], pts[i]);
      const v2 = unitVec(pts[i], pts[i + 1]);
      const ang = angleBetween(v1, v2);
      if (streamIdx === 0) totalTurnGreen += ang;
      if (ang > maxKinkDeg) {
        maxKinkDeg = ang;
        kinkPoint = pts[i];
        kinkStream = streamIdx;
      }
    }
  };
  scanTurns(green.pts, 0);
  // 橘轨无抖动时的基线转角另算，避免把抖动和折角混为一谈；同时实绘点偏角记入总平滑度
  const orangeClean = resampleCurve(sampleOrangeBaseCurve, count, state, null, 0);
  scanTurns(orangeClean.pts, 1);

  // 实测最大跨距倍率（从绿轨实绘圆点间距算！）
  const greenSteps = [];
  let maxGapPx = 0;
  let gapMid = null;
  let gapEnds = null;
  for (let i = 0; i < green.pts.length - 1; i++) {
    const d = dist(green.pts[i], green.pts[i + 1]);
    greenSteps.push(d);
    if (d > maxGapPx) {
      maxGapPx = d;
      gapMid = {
        x: (green.pts[i].x + green.pts[i + 1].x) * 0.5,
        y: (green.pts[i].y + green.pts[i + 1].y) * 0.5,
      };
      gapEnds = [green.pts[i], green.pts[i + 1]];
    }
  }
  const sortedSteps = [...greenSteps].sort((a, b) => a - b);
  const medianStep = sortedSteps[Math.floor(sortedSteps.length * 0.45)] || green.stepLen;
  const gapRatio = maxGapPx / (medianStep || 1);

  // 实测圆点间净空（检测粘连糊带）
  const minCenterDist = Math.min(
    sortedSteps[0] || green.stepLen,
    orange.stepLen
  );
  const clearGapPx = minCenterDist - dotRadius * 2;

  // 实测橘轨最大离轨法向偏距
  const maxJitterPx = orange.pts.reduce((m, p) => Math.max(m, p.offsetPx), 0);

  // 实测交点与真实交角
  const crossing = findCrossing(green.poly, orange.poly);
  const hasCrossing = !!crossing;
  const crossingDeg = crossing ? crossing.angleDeg : 0;

  // 跑真实局部关联场视线探针
  const probeGreen = runVisualProbe(0, green.pts, orange.pts, medianStep);
  const probeOrange = runVisualProbe(1, green.pts, orange.pts, orange.stepLen);

  // 四个原海报核心支柱检核（路径 / 延续 / 方向 / 流动）
  const overCurled = state.curl > 0.52 || totalTurnGreen > 175;
  const overcrowded = clearGapPx < THRESHOLDS.minClearPx;

  const pathOk = maxKinkDeg <= THRESHOLDS.maxKinkDeg && !overCurled && !overcrowded;
  const contOk = gapRatio <= THRESHOLDS.maxGapRatio && probeGreen.status !== "stalled";
  const dirOk = hasCrossing && crossingDeg >= THRESHOLDS.minCrossDeg && probeGreen.status !== "jumped" && probeOrange.status !== "jumped";
  const flowOk = maxJitterPx <= THRESHOLDS.maxJitterPx && probeGreen.reachedOwnEnd && probeOrange.reachedOwnEnd;

  const passedCount = [pathOk, contOk, dirOk, flowOk].filter(Boolean).length;

  // 把手位置（分落左上与远右象限，绝不与中心交点标牌重叠）
  const greenHandlePt = sampleGreenCurve(0.28, state);
  const orangeHandlePt = sampleOrangeBaseCurve(0.82, state);

  // 判定当前最关键的 8 类错态或正当解（完全白话，讲清「为什么眼睛这样看」）
  let faultKey = "ok";
  let badge = "4 / 4 连续成立";
  let headline = "";
  let body = "";
  let nextStep = "";
  let flowGrade = "顺畅穿交";

  if (overcrowded) {
    faultKey = "crowd";
    badge = `错态 · 粘连糊带 (${passedCount}/4)`;
    headline = `圆点挤成实心长条（净空 ${clearGapPx.toFixed(0)}px）`;
    body = "相邻圆点已经互相贴死甚至重叠，离散元素退化成了一条粗实线。连续性原则最奇妙的地方，是点与点之间留着清晰空气，眼睛仍能自己把它们串成流线。";
    nextStep = "点一下「原海报舒展解」或减少点密，留出清晰呼吸间距。";
    flowGrade = "失离粘连";
  } else if (!hasCrossing) {
    faultKey = "parallel";
    badge = `错态 · 平行失交 (${passedCount}/4)`;
    headline = "两条轨彻底分开，没测到交叉延续";
    body = "现在绿轨和橘轨上下平行各走各的，没有交点。这只验证了单线顺滑，还没检验连续性最硬核的本事——两条路径相交时，眼睛照样能各自顺着穿过去。";
    nextStep = "切回「原海报舒展解」或「双直斜交解」，让两条路径在画面中段交汇。";
    flowGrade = "未构交汇";
  } else if (overCurled) {
    faultKey = "curl";
    badge = `错态 · 急弯过卷 (${passedCount}/4)`;
    headline = `路径来回猛折（累计转角 ${Math.round(totalTurnGreen)}°）`;
    body = "连续性依赖的是「平缓曲率变化」。反复急弯让视线像坐过山车一样来回甩头，读者记住的是折腾的波浪，而不是从起点流向终点的阅读方向。";
    nextStep = "点选「原海报舒展解」或「大弧对交解」，把多余的急弯拉平。";
    flowGrade = "视线甩动";
  } else if (maxKinkDeg > THRESHOLDS.maxKinkDeg) {
    faultKey = "kink";
    badge = `错态 · 尖折断流 (${passedCount}/4)`;
    headline = `绿轨中段急折 ${Math.round(maxKinkDeg)}°，视线在这里猛撞停`;
    body = probeGreen.status === "jumped"
      ? `绿轨在交点前折出了 ${Math.round(maxKinkDeg)}° 的硬拐角；对视觉系统来说，拐弯比直走费力得多，于是探针一到交点就顺势跳到了更直的橘轨上。`
      : `绿轨在交点前折出了 ${Math.round(maxKinkDeg)}° 尖角（经验顺滑上限约 ${THRESHOLDS.maxKinkDeg}°）。大脑把尖角读成「拐点与终止」，一条整线当场被劈成两截。`;
    nextStep = "直接在画布上拖动绿轨的红色折点手柄（或按 ← → 键），把尖角掰顺到 22° 以内。";
    flowGrade = probeGreen.status === "jumped" ? "交点串轨" : "尖折受阻";
  } else if (crossingDeg < THRESHOLDS.minCrossDeg) {
    faultKey = "grazing";
    badge = `错态 · 浅角串轨 (${passedCount}/4)`;
    headline = `交点夹角只有 ${Math.round(crossingDeg)}°，两轨贴行糊成一股`;
    body = "两条路径以过小的角度斜擦而过，交点附近相邻圆点几乎共线。人眼顺着切线往前摸索时分不清哪一颗属于原轨，极易在交点悄悄串轨——切到「去色纯墨」看得最清楚。";
    nextStep = "拖动橘轨右侧手柄（或拉下方「交点夹角」滑条），把夹角拉开到 32° 以上。";
    flowGrade = "浅角串轨";
  } else if (gapRatio > THRESHOLDS.maxGapRatio) {
    faultKey = "gap";
    badge = `错态 · 跨距断链 (${passedCount}/4)`;
    headline = `绿轨后段裂开 ${gapRatio.toFixed(1)}× 大缺口，尾段飘成孤岛`;
    body = `连续性不是无限远程的。一旦相邻两点的跨距超过正常步距的 ${THRESHOLDS.maxGapRatio} 倍，局部关联场接不住下一颗点，邻近性原则会接管画面，把后半截拆成毫不相干的散点。`;
    nextStep = "直接点击画布上闪烁的红色虚线缺口（或拉回「缺口跨距」滑条），把断链补齐。";
    flowGrade = "跨距刹停";
  } else if (maxJitterPx > THRESHOLDS.maxJitterPx) {
    faultKey = "jitter";
    badge = `错态 · 离轨毛刺 (${passedCount}/4)`;
    headline = `橘轨圆点偏离切线 ${Math.round(maxJitterPx)}px，流线散成噪点`;
    body = "即使整体趋势还是从左下到右上，局部圆点左右乱跳破坏了相邻两点的切线对齐。眼睛每走一步都要重新找方向，流畅感瞬间消失。";
    nextStep = "点击画布上的抖动提示标（或把「轨迹抖动」归到 7px 以内），让圆点齐顺归轨。";
    flowGrade = "毛刺卡顿";
  } else if (!probeGreen.reachedOwnEnd || !probeOrange.reachedOwnEnd) {
    faultKey = "probeJump";
    badge = `错态 · 交点串轨 (${passedCount}/4)`;
    headline = "视线探针在交点仍发生串轨";
    body = "两轨在交点处有一段局部切线过于接近，让按最小偏角前行的视线探针误判了续接方向。";
    nextStep = "稍微再拉开一点交点夹角或把局部弧线再理顺一些。";
    flowGrade = "局部串轨";
  } else {
    faultKey = "ok";
    badge = state.pureInk ? "4 / 4 纯墨验真通过" : "4 / 4 连续性成立";
    const styleName =
      state.curl < -0.18 ? "双直斜交构图" :
      state.curl > 0.12 ? "大弧对交构图" :
      "平滑双弧穿交";
    headline = state.pureInk
      ? `去色纯墨下依然零串轨：${Math.round(crossingDeg)}° 清晰穿交`
      : `${styleName}成立：双轨以 ${Math.round(crossingDeg)}° 顺畅穿过彼此`;
    body = state.pureInk
      ? `全部圆点都是同一种墨黑，没有任何颜色提示。只靠 ≤ ${Math.round(maxKinkDeg)}° 的平滑偏角与均匀步距，两条视线探针照样各走各路、毫不拐弯——这才是纯正的连续性原则。`
      : `绿轨最大折角仅 ${Math.round(maxKinkDeg)}°，跨距齐整（${gapRatio.toFixed(2)}×），双轨在交点呈 ${Math.round(crossingDeg)}° 清晰穿行。试试点开「去色纯墨验真」，看看去掉颜色后眼睛是不是照样不会看串。`;
    nextStep = state.pureInk
      ? "你也可以试着故意掰出一个尖折、点开「试错」按钮，或切到「地铁换乘 / 图文阅读」场景验证。"
      : "点上方「去色纯墨验真」剥离颜色干扰，或切到「地铁换乘 / 图文阅读」看它在真实设计里的威力。";
    flowGrade = "极顺零串轨";
  }

  // 四栏原海报支柱实况（路径 / 延续 / 方向 / 流动）
  const pillars = {
    path: {
      ok: pathOk,
      metric: overcrowded ? "圆点粘连" : overCurled ? `急弯 ${Math.round(totalTurnGreen)}°` : `折角 ${Math.round(maxKinkDeg)}°`,
      note: pathOk ? "平滑低折角" : overcrowded ? "净空不足" : overCurled ? "反复急折" : "超过 22° 拐断",
    },
    continuation: {
      ok: contOk,
      metric: `跨距 ${gapRatio.toFixed(2)}×`,
      note: contOk ? "步距连贯" : "超出 1.85× 断链",
    },
    direction: {
      ok: dirOk,
      metric: hasCrossing ? `交角 ${Math.round(crossingDeg)}°` : "未相交",
      note: dirOk ? "清晰穿交" : !hasCrossing ? "平行无交" : crossingDeg < THRESHOLDS.minCrossDeg ? "低于 32° 易串轨" : "探针在交点串轨",
    },
    flow: {
      ok: flowOk,
      metric: `偏轨 ${Math.round(maxJitterPx)}px`,
      note: flowOk ? "双探针达标" : maxJitterPx > THRESHOLDS.maxJitterPx ? "毛刺离轨" : "探针未贯通",
    },
  };

  return {
    greenPts: green.pts,
    orangePts: orange.pts,
    greenPoly: green.poly,
    orangePoly: orange.poly,
    dotRadius,
    medianStep,
    maxKinkDeg,
    kinkPoint,
    kinkStream,
    totalTurnGreen,
    gapRatio,
    gapMid,
    gapEnds,
    clearGapPx,
    maxJitterPx,
    hasCrossing,
    crossing,
    crossingDeg,
    probeGreen,
    probeOrange,
    handles: {
      green: greenHandlePt,
      orange: orangeHandlePt,
    },
    passedCount,
    faultKey,
    badge,
    headline,
    body,
    nextStep,
    flowGrade,
    pillars,
  };
}
