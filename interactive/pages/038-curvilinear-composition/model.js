// 038 曲线构图 · 单真源几何模型
// 所有曲线坐标均在归一化画布 [0..1] × [0..1] 中生成，主丝带（73 点）与两条伴随弧（各 57 点）
// 既直接交给 hero.js 绘制，又由 evaluate() 实算折角、交叉打结、粗细比、间距呼吸度与终点落焦偏距。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·陶瓶花艺",
    shortLabel: "陶瓶花艺",
    caption: "实裁自原海报的陶瓶红花圆窗，多股柔弧把 5 处信息串联并汇入花朵焦点。",
    focusName: "陶瓶花艺",
  },
  skincare: {
    id: "skincare",
    label: "护肤瓶·流丝主视觉",
    shortLabel: "护肤流丝",
    caption: "磨砂琥珀精华瓶置身轻盈丝带流中，角落配克制直线规格铭牌稳住重心。",
    focusName: "精华瓶身",
  },
  museum: {
    id: "museum",
    label: "流线展馆·画展海报",
    shortLabel: "流线展馆",
    caption: "拱券穹顶般的流动曲线引领视线走向展品圆景，底角直线展期信息构成刚柔平衡。",
    focusName: "中庭展景",
  },
};

export const FLOW_MODES = {
  tangled: { id: "tangled", label: "逆流打结", note: "副弧横穿主带形成毛线团" },
  organic: { id: "organic", label: "顺势编织", note: "呼应原海报的舒展环流" },
  embrace: { id: "embrace", label: "环抱汇聚", note: "上下两翼合抱焦点圆窗" },
  diagonal: { id: "diagonal", label: "对角穿流", note: "左上斜贯右上再回勾入焦" },
};

// 开场默认停在 0/4 复合错态（尖折生硬 + 逆流打结 + 同粗挤死 + 终点脱焦滑出）
export const INITIAL_BROKEN = {
  scene: "poster",
  smooth: 0.18,
  flowMode: "tangled",
  thicknessRatio: 1.12,
  spacingGrad: 12,
  focus: { u: 0.50, v: 0.50 },
  terminal: { u: 0.65, v: 0.87 },
};

// 多组合法解与试错预设
export const PRESETS = {
  classic: {
    label: "原海报经典解",
    state: {
      smooth: 0.92,
      flowMode: "organic",
      thicknessRatio: 3.4,
      spacingGrad: 62,
      focus: { u: 0.50, v: 0.50 },
      terminal: { u: 0.50, v: 0.50 },
    },
  },
  embrace: {
    label: "双翼环抱解",
    state: {
      smooth: 0.90,
      flowMode: "embrace",
      thicknessRatio: 3.0,
      spacingGrad: 56,
      focus: { u: 0.52, v: 0.50 },
      terminal: { u: 0.52, v: 0.50 },
    },
  },
  diagonal: {
    label: "轻盈对角解",
    state: {
      smooth: 0.95,
      flowMode: "diagonal",
      thicknessRatio: 3.8,
      spacingGrad: 68,
      focus: { u: 0.54, v: 0.52 },
      terminal: { u: 0.54, v: 0.52 },
    },
  },
  errRails: {
    label: "试错：平行死轨",
    state: {
      smooth: 0.88,
      flowMode: "organic",
      thicknessRatio: 1.08,
      spacingGrad: 25,
      focus: { u: 0.50, v: 0.50 },
      terminal: { u: 0.50, v: 0.50 },
    },
  },
  errMiss: {
    label: "试错：终点甩飞",
    state: {
      smooth: 0.92,
      flowMode: "organic",
      thicknessRatio: 3.3,
      spacingGrad: 62,
      focus: { u: 0.50, v: 0.50 },
      terminal: { u: 0.66, v: 0.88 },
    },
  },
  broken: {
    label: "复原 0/4 错态",
    state: { ...INITIAL_BROKEN },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function cubicPt(p0, p1, p2, p3, t) {
  const m = 1 - t;
  const m2 = m * m;
  const t2 = t * t;
  return {
    u: m2 * m * p0.u + 3 * m2 * t * p1.u + 3 * m * t2 * p2.u + t2 * t * p3.u,
    v: m2 * m * p0.v + 3 * m2 * t * p1.v + 3 * m * t2 * p2.v + t2 * t * p3.v,
  };
}

// 用分段硬折多边形与连续三次曲线做混合：
// smooth <= 0.82 时保留可测的尖角折线过渡；smooth >= 0.84 时退去全部硬折、进入纯 C1 光滑有机曲线。
function samplePath(anchors, smooth, stepsPerSeg) {
  const nSeg = anchors.length - 1;
  const pts = [];
  const blend = clamp(smooth / 0.84, 0, 1);
  const tension = 0.50;
  for (let s = 0; s < nSeg; s++) {
    const p0 = anchors[Math.max(0, s - 1)];
    const p1 = anchors[s];
    const p2 = anchors[s + 1];
    const p3 = anchors[Math.min(nSeg, s + 2)];

    const c1 = {
      u: p1.u + ((p2.u - p0.u) * tension) / 3,
      v: p1.v + ((p2.v - p0.v) * tension) / 3,
    };
    const c2 = {
      u: p2.u - ((p3.u - p1.u) * tension) / 3,
      v: p2.v - ((p3.v - p1.v) * tension) / 3,
    };

    for (let i = 0; i < stepsPerSeg; i++) {
      const t = i / stepsPerSeg;
      const lin = { u: lerp(p1.u, p2.u, t), v: lerp(p1.v, p2.v, t) };
      const cur = cubicPt(p1, c1, c2, p2, t);
      pts.push({
        u: lerp(lin.u, cur.u, blend),
        v: lerp(lin.v, cur.v, blend),
      });
    }
  }
  const last = anchors[nSeg];
  pts.push({ u: last.u, v: last.v });
  return pts;
}

// 沿着平滑法向量生成永不自交的伴随丝带：
// 使用宽窗口切线估计防止局部凹弯折叠，且间距精确受 spacingGrad 控制（挤撞 / 平行死轨 / 渐收呼吸 / 离散）。
function buildCompanionFromMain(mainPts, side, spacingGrad, mode, terminal) {
  const n = mainPts.length;
  const pts = [];
  let baseSep;
  let breathAmp;
  if (spacingGrad < 18) {
    const k = spacingGrad / 18;
    baseSep = lerp(0.011, 0.020, k);
    breathAmp = 0.06;
  } else if (spacingGrad <= 34) {
    const k = (spacingGrad - 18) / 16;
    baseSep = lerp(0.050, 0.068, k);
    breathAmp = lerp(0.04, 0.12, k);
  } else if (spacingGrad <= 86) {
    const k = (spacingGrad - 34) / 52;
    baseSep = lerp(0.068, 0.122, k);
    breathAmp = lerp(0.52, 0.88, k);
  } else {
    const k = (spacingGrad - 86) / 14;
    baseSep = lerp(0.185, 0.250, k);
    breathAmp = 0.26;
  }

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // 用宽窗口平滑切向，避免在弧腹内侧出现法向自折
    const prev = mainPts[Math.max(0, i - 5)];
    const next = mainPts[Math.min(n - 1, i + 5)];
    let dx = next.u - prev.u;
    let dy = next.v - prev.v;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = -dy * side;
    const ny = dx * side;

    // 呼吸包络：宽入（t=0.05..0.35 舒展开阔）→ 缓收（t=0.65..0.85 优雅靠拢）→ 温柔汇入终点
    const breathWave = 1.38 - 0.86 * Math.pow(t, 0.85) + 0.18 * Math.sin(t * Math.PI * 1.6 + (side > 0 ? 0.3 : 1.5));
    const organicFactor = lerp(1.0, clamp(breathWave, 0.32, 1.48), breathAmp);
    let offset = baseSep * organicFactor;

    if (mode === "embrace") {
      offset *= 0.90 + 0.22 * Math.sin(t * Math.PI);
    }

    let u = mainPts[i].u + nx * offset;
    let v = mainPts[i].v + ny * offset;

    // 仅在最后 18% 柔和汇向终点
    if (t > 0.82) {
      const pull = ((t - 0.82) / 0.18) ** 1.7;
      const endTargetU = terminal.u + nx * Math.min(offset, 0.018);
      const endTargetV = terminal.v + ny * Math.min(offset, 0.018);
      u = lerp(u, endTargetU, pull * 0.82);
      v = lerp(v, endTargetV, pull * 0.82);
    }
    pts.push({ u: clamp(u, 0.03, 0.97), v: clamp(v, 0.04, 0.96) });
  }
  return pts;
}

function resample(pts, targetCount) {
  const out = [];
  const last = pts.length - 1;
  for (let i = 0; i < targetCount; i++) {
    const f = (i / (targetCount - 1)) * last;
    const i0 = Math.floor(f);
    const i1 = Math.min(last, i0 + 1);
    const t = f - i0;
    out.push({ u: lerp(pts[i0].u, pts[i1].u, t), v: lerp(pts[i0].v, pts[i1].v, t) });
  }
  return out;
}

export function buildRibbons(state) {
  const { smooth, flowMode, thicknessRatio, spacingGrad, focus, terminal } = state;

  // 三组流畅无发卡死弯的主丝带骨架（既显曲线曼妙流动又在顺滑态保持低曲率峰值、伴随弧绝不自交）
  let mainAnchors;
  if (flowMode === "embrace") {
    mainAnchors = [
      { u: 0.11, v: 0.80 },
      { u: 0.18, v: 0.46 },
      { u: 0.34, v: 0.24 },
      { u: terminal.u, v: terminal.v },
    ];
  } else if (flowMode === "diagonal") {
    mainAnchors = [
      { u: 0.10, v: 0.26 },
      { u: 0.42, v: 0.15 },
      { u: 0.72, v: 0.34 },
      { u: terminal.u, v: terminal.v },
    ];
  } else {
    // organic & tangled：贴合 038 原海报左上舒展起势、经中左柔弧环绕再温柔汇入陶瓶圆窗
    mainAnchors = [
      { u: 0.13, v: 0.16 },
      { u: 0.36, v: 0.20 },
      { u: 0.26, v: 0.46 },
      { u: terminal.u, v: terminal.v },
    ];
  }

  // 主丝带采样 73 点（3 × 24 + 1），两条伴随弧各 57 点
  const mainPts = samplePath(mainAnchors, smooth, 24);

  // 线宽（归一化比例）
  const compBaseW = thicknessRatio < 1.85 ? 0.0155 : 0.0068;
  const mainPeakW = clamp(compBaseW * thicknessRatio, 0.014, 0.052);
  const taperStrength = clamp((thicknessRatio - 1.25) / 1.35, 0, 1);

  const widthAt = (t, peak, isMain) => {
    const profile = isMain
      ? 0.28 + 0.72 * Math.sin(Math.pow(t, 0.88) * Math.PI)
      : 0.36 + 0.64 * Math.sin(t * Math.PI);
    return peak * lerp(0.95, profile, taperStrength);
  };

  let comp1Pts;
  let comp2Pts;
  if (flowMode === "tangled") {
    // 逆流打结：副弧 1 从右上斜劈左下再折回，与主带形成多处明显交叉打结
    const cross1 = [
      { u: 0.86, v: 0.17 },
      { u: 0.22, v: 0.36 },
      { u: 0.72, v: 0.60 },
      { u: terminal.u, v: terminal.v },
    ];
    comp1Pts = resample(samplePath(cross1, smooth, 18), 57);
    comp2Pts = resample(buildCompanionFromMain(mainPts, 1, spacingGrad, flowMode, terminal), 57);
  } else {
    comp1Pts = resample(buildCompanionFromMain(mainPts, -1, spacingGrad, flowMode, terminal), 57);
    comp2Pts = resample(buildCompanionFromMain(mainPts, 1, spacingGrad, flowMode, terminal), 57);
  }

  const mainWidths = mainPts.map((_, i) => widthAt(i / (mainPts.length - 1), mainPeakW, true));
  const comp1Widths = comp1Pts.map((_, i) => widthAt(i / (comp1Pts.length - 1), compBaseW * 1.12, false));
  const comp2Widths = comp2Pts.map((_, i) => widthAt(i / (comp2Pts.length - 1), compBaseW * 0.88, false));

  return {
    main: { pts: mainPts, widths: mainWidths, peakW: mainPeakW },
    comp1: { pts: comp1Pts, widths: comp1Widths, peakW: compBaseW * 1.12 },
    comp2: { pts: comp2Pts, widths: comp2Widths, peakW: compBaseW * 0.88 },
    mainAnchors,
    focus,
    terminal,
  };
}

function segIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.u - p.u) * (r.v - p.v) - (q.v - p.v) * (r.u - p.u);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function countCrossings(pA, pB) {
  const nA = Math.floor(pA.length * 0.82);
  const nB = Math.floor(pB.length * 0.82);
  let hits = 0;
  let firstHit = null;
  for (let i = 0; i < nA - 2; i += 2) {
    const a1 = pA[i];
    const a2 = pA[Math.min(nA - 1, i + 2)];
    for (let j = 0; j < nB - 2; j += 2) {
      const b1 = pB[j];
      const b2 = pB[Math.min(nB - 1, j + 2)];
      if (segIntersect(a1, a2, b1, b2)) {
        hits++;
        if (!firstHit) firstHit = { u: (a1.u + b1.u) * 0.5, v: (a1.v + b1.v) * 0.5 };
      }
    }
  }
  return { hits, point: firstHit };
}

function maxTurningAngleDeg(pts) {
  let maxDeg = 0;
  let worstIdx = 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const ax = pts[i].u - pts[i - 1].u;
    const ay = pts[i].v - pts[i - 1].v;
    const bx = pts[i + 1].u - pts[i].u;
    const by = pts[i + 1].v - pts[i].v;
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    if (la < 1e-5 || lb < 1e-5) continue;
    const dot = clamp((ax * bx + ay * by) / (la * lb), -1, 1);
    const deg = (Math.acos(dot) * 180) / Math.PI;
    if (deg > maxDeg) {
      maxDeg = deg;
      worstIdx = i;
    }
  }
  return { maxDeg, point: pts[worstIdx] };
}

function ribbonClearanceStats(main, comp) {
  // 统计主行进段（t ∈ [8%..72%]）副弧与对应主丝带处的净间距与疏密起伏
  const gaps = [];
  const start = Math.floor(comp.pts.length * 0.08);
  const end = Math.floor(comp.pts.length * 0.72);
  for (let i = start; i <= end; i += 2) {
    const p = comp.pts[i];
    const mIdx = Math.min(main.pts.length - 1, Math.round((i / (comp.pts.length - 1)) * (main.pts.length - 1)));
    const q = main.pts[mIdx];
    const centerDist = Math.hypot(p.u - q.u, p.v - q.v);
    const netGap = centerDist - (main.widths[mIdx] + comp.widths[i]) * 0.5;
    gaps.push(netGap);
  }
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const meanGap = gaps.reduce((s, x) => s + x, 0) / gaps.length;
  const variation = maxGap > 0.008 ? (maxGap - Math.max(0, minGap)) / maxGap : 0;
  return { minGap, maxGap, meanGap, variation };
}

// 5 枚原海报原理圆徽的归一化坐标（环绕焦点圆窗，避让脱焦红标）
export const PRINCIPLE_NODES = [
  { id: "connection", title: "自然联系", en: "NATURAL CONNECTION", u: 0.73, v: 0.19, icon: "leaf" },
  { id: "guidance", title: "柔性引导", en: "SOFT GUIDANCE", u: 0.13, v: 0.46, icon: "wave" },
  { id: "rhythm", title: "节奏延展", en: "RHYTHMIC FLOW", u: 0.86, v: 0.48, icon: "pulse" },
  { id: "space", title: "空间流动", en: "SPATIAL FLOW", u: 0.19, v: 0.79, icon: "spiral" },
  { id: "focus", title: "视觉焦点", en: "FOCAL POINT", u: 0.85, v: 0.78, icon: "target" },
];

export function evaluate(state) {
  const ribbons = buildRibbons(state);
  const { main, comp1, comp2, focus } = ribbons;

  // 1. 曲线方向 & 顺滑度
  const turn = maxTurningAngleDeg(main.pts);
  const cross1 = countCrossings(main.pts, comp1.pts);
  const cross2 = countCrossings(main.pts, comp2.pts);
  const totalCrossings = cross1.hits + cross2.hits;
  const smoothPct = Math.round(state.smooth * 100);
  const isKinked = turn.maxDeg > 16;
  const isTangled = state.flowMode === "tangled" || totalCrossings > 0;
  const directionOk = !isKinked && !isTangled;

  // 2. 曲线粗细
  const avgCompPeak = (comp1.peakW + comp2.peakW) * 0.5;
  const measuredRatio = main.peakW / Math.max(0.001, avgCompPeak);
  const tipWidth = (main.widths[0] + main.widths[main.widths.length - 1]) * 0.5;
  const taperPct = Math.round((1 - tipWidth / Math.max(0.001, main.peakW)) * 100);
  const isFlatWeight = measuredRatio < 2.05 || taperPct < 36;
  const isBloated = main.peakW > 0.044;
  const thicknessOk = !isFlatWeight && !isBloated;

  // 3. 曲线间距（逆流打结时不通过间距检查，其他模式下严格实算净距与起伏度）
  const s1 = ribbonClearanceStats(main, comp1);
  const s2 = ribbonClearanceStats(main, comp2);
  const minClear = Math.min(s1.minGap, s2.minGap);
  const meanGap = (s1.meanGap + s2.meanGap) * 0.5;
  const gapVar = Math.min(s1.variation, s2.variation);
  const isCramped = minClear < 0.015;
  const isRigidRails = !isCramped && gapVar < 0.25;
  const isDrifted = meanGap > 0.165;
  const spacingOk = !isTangled && !isCramped && !isRigidRails && !isDrifted;

  // 4. 曲线终点
  const endM = main.pts[main.pts.length - 1];
  const missDist = Math.hypot(endM.u - focus.u, endM.v - focus.v);
  const missPct = Math.round(missDist * 100);
  const edgeMargin = Math.min(focus.u, 1 - focus.u, focus.v, 1 - focus.v);
  const isFocusEdge = edgeMargin < 0.16;
  const isMissedFocus = missDist > 0.095;
  const endpointOk = !isMissedFocus && !isFocusEdge;

  const passedCount = [directionOk, thicknessOk, spacingOk, endpointOk].filter(Boolean).length;

  const principleStatus = {
    connection: !isTangled && !isDrifted,
    guidance: directionOk,
    rhythm: thicknessOk,
    space: spacingOk,
    focus: endpointOk,
  };

  let code = "pass";
  let badge = `${passedCount}/4 柔和贯通`;
  let headline = "主辅丝带流向顺畅，视线自然落进视觉焦点";
  let body = `当前最大转折仅 ${turn.maxDeg.toFixed(0)}°、主副粗细比 ${measuredRatio.toFixed(1)}×（收尖 ${taperPct}%）、间距疏密差 ${Math.round(gapVar * 100)}%，三股曲线终点距焦点仅 ${missPct}%。视线从柔和起势一路滑进中央主图，节奏有松有紧、留白能呼吸。`;
  let action = "可以继续拖动焦点圆窗或换一组「曲线方向 / 题材」，体会不同合法解的呼吸节奏。";

  if (isTangled) {
    code = "tangled";
    badge = `错态 · 逆流打结 (${passedCount}/4)`;
    headline = `伴随弧与主丝带逆向交叉 ${Math.max(1, totalCrossings)} 处，视线在半路缠成毛线团`;
    body = `原海报第一条要点讲「变化的方向决定视线流动的路径」。眼下副弧逆着主丝带横穿打结，且主线仍有 ${turn.maxDeg.toFixed(0)}° 硬折角，眼睛刚顺着主带走半步就被横切线绊住，完全失去柔和连贯的流动感。`;
    action = "直接点击画布上的红色「解结」标（或在构图要点里把「曲线方向」切到顺势编织），再向右横拖画布熨平折角。";
  } else if (isKinked) {
    code = "kinked";
    badge = `错态 · 尖角硬折 (${passedCount}/4)`;
    headline = `主曲线出现 ${turn.maxDeg.toFixed(0)}° 硬折角，柔和感被生硬折断`;
    body = `当前柔滑度只有 ${smoothPct}%，曲线在拐点处折成尖角。神经美学实验表明，尖锐转折会打断眼球连续追踪并引起紧绷感——看顶部「曲线构图」大标也跟着变僵直了。`;
    action = "直接在画布上向右横向拖动（或按 → 键），把尖角连续熨平到 16° 以内的流畅曲率。";
  } else if (isFocusEdge) {
    code = "focus_edge";
    badge = `错态 · 焦点撞边 (${passedCount}/4)`;
    headline = `视觉焦点被推到距画框边缘仅 ${Math.round(edgeMargin * 100)}%，曲线没处收尾`;
    body = "圆窗主体紧贴画框边沿时，周围没有留出让曲线缓冲和环抱的余地，画面一边发沉、另一边空荡，优雅的呼吸感立刻消失。";
    action = "直接把焦点圆窗拖回画布腹地（距四边至少留出 18% 余白）。";
  } else if (isMissedFocus) {
    code = "missed_focus";
    badge = `错态 · 终点脱焦 (${passedCount}/4)`;
    headline = `曲线终点偏离焦点 ${missPct}%，把视线一路带出画面`;
    body = `原海报第四条要点写着「终点落在视觉焦点，增强吸引力与停留感」。现在三股丝带虽然弯曲顺滑，但尾端齐刷刷从主视觉旁边滑走，观众看完丝带就溜出画框了。`;
    action = "直接拖动画布上的红色「终点磁针」套回焦点圆窗，或点画布红标一键归焦。";
  } else if (isFlatWeight) {
    code = "flat_weight";
    badge = `错态 · 同粗抢戏 (${passedCount}/4)`;
    headline = `主副丝带粗细比仅 ${measuredRatio.toFixed(1)}×（收尖 ${taperPct}%），谁也领不了跑`;
    body = `原海报第二条要点讲「粗细对比影响视觉重量与节奏」。三条一样粗、首尾又不收尖的丝带挤在一起，画面像贴满塑料胶带，看不出哪一条是主视线轨道。`;
    action = "拉动构图要点里的「曲线粗细」滑轨，把主副宽比调到 2.1×–4.5× 区间，让主带沉稳、副弧轻盈。";
  } else if (isBloated) {
    code = "bloated";
    badge = `错态 · 主带过粗 (${passedCount}/4)`;
    headline = `主丝带拉得过于臃肿（宽比 ${measuredRatio.toFixed(1)}×），压扁了纸面呼吸`;
    body = "粗细对比过了头，主曲线变成沉重色块，抢走陶瓶主体的风光，也让柔桃宣纸失去轻盈灵动。";
    action = "把「曲线粗细」稍往回收到 2.4×–4.2× 区间。";
  } else if (isCramped) {
    code = "cramped";
    badge = `错态 · 间距挤死 (${passedCount}/4)`;
    headline = `主副丝带净距缩到 ${(Math.max(0, minClear) * 100).toFixed(1)}%，曲线挤撞在一起透不过气`;
    body = `原海报第三条要点讲「间距控制疏密关系，影响画面呼吸感」。三条线紧紧贴死，负空间被吃光，柔弧反而让人觉得拥堵局促。`;
    action = "把构图要点里的「曲线间距」调到 40%–80% 呼吸区间，拉开宽入渐收的疏密层次。";
  } else if (isRigidRails) {
    code = "rigid_rails";
    badge = `错态 · 平行死轨 (${passedCount}/4)`;
    headline = `丝带间距起伏只有 ${Math.round(gapVar * 100)}%，像机械平行铁轨一样死板`;
    body = "虽然没有挤撞，但从头到尾保持几乎一模一样的等宽间距，缺少「宽入—收束—舒展」的疏密韵律，看起来像圆规量出来的工业纹样。";
    action = "继续向右拉动「曲线间距」到 42%–78%，拉开宽窄呼吸梯度。";
  } else if (isDrifted) {
    code = "drifted";
    badge = `错态 · 疏离散架 (${passedCount}/4)`;
    headline = `副弧偏离主带平均达 ${Math.round(meanGap * 100)}%，各走各路失掉联系`;
    body = "间距拉得太散时，伴随曲线不再帮主丝带护航，反而像几条互不相干的孤线漂在角落。";
    action = "把「曲线间距」往回收到 45%–76% 区间，让副弧重新呼应主线。";
  }

  let flowGrade = "顺畅入焦";
  if (isTangled) flowGrade = "缠结受阻";
  else if (isKinked) flowGrade = "尖折卡顿";
  else if (isMissedFocus || isFocusEdge) flowGrade = "滑出脱焦";
  else if (isFlatWeight || isBloated) flowGrade = "主次失衡";
  else if (isCramped || isRigidRails || isDrifted) flowGrade = "呼吸受憋";

  return {
    ribbons,
    passedCount,
    allOk: passedCount === 4,
    checks: {
      direction: { ok: directionOk, tag: isTangled ? "逆流打结" : isKinked ? `尖折 ${turn.maxDeg.toFixed(0)}°` : `顺滑 ${smoothPct}%` },
      thickness: { ok: thicknessOk, tag: isFlatWeight ? `同粗 ${measuredRatio.toFixed(1)}×` : isBloated ? `过粗 ${measuredRatio.toFixed(1)}×` : `主副 ${measuredRatio.toFixed(1)}×` },
      spacing: { ok: spacingOk, tag: isTangled ? "逆流缠结" : isCramped ? "挤撞贴死" : isRigidRails ? "等距死轨" : isDrifted ? "疏离脱节" : `呼吸 ${Math.round(gapVar * 100)}%` },
      endpoint: { ok: endpointOk, tag: isFocusEdge ? "焦点贴边" : isMissedFocus ? `偏焦 ${missPct}%` : `落焦 ${missPct}%` },
    },
    metrics: {
      maxTurnDeg: turn.maxDeg,
      turnPoint: turn.point,
      crossings: totalCrossings,
      crossPoint: cross1.point || cross2.point,
      smoothPct,
      measuredRatio,
      taperPct,
      minClearPct: Math.max(0, minClear * 100),
      gapVarPct: isTangled ? 0 : Math.round(gapVar * 100),
      missPct,
      flowGrade,
    },
    principleStatus,
    diagnosis: { code, badge, headline, body, action },
  };
}
