// 050 环形构图 · 单真源几何与感知评定模型
// 画布绘制、四角探针、TIPS 四项勾叉、数字读数与白话诊单全部从此模块算出，绝不写死常量。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 几何星环",
    shortLabel: "原海报·星环",
    coreZh: "焦点",
    coreEn: "FOCUS",
    coreDesc: "中心承载核心信息，是视觉停留的最终目的地。",
    hint: "横拖画布开合黑环 · 拖内环口调核比 · 点右上黄圆消抢戏 · 空格放行视线流",
  },
  product: {
    id: "product",
    label: "产品展示 · 腕表表盘",
    shortLabel: "产品·腕表",
    coreZh: "核心腕表",
    coreEn: "FLAGSHIP DIAL",
    coreDesc: "主产品坐镇圆心，外环承接材质、机芯与防水等次级卖点。",
    hint: "用圆环把卖点图标收纳在表盘外周，保持表身与标注之间留出呼吸圈",
  },
  ui: {
    id: "ui",
    label: "界面设计 · 数据进度环",
    shortLabel: "界面·数据环",
    coreZh: "72%",
    coreEn: "GOAL PROGRESS",
    coreDesc: "关键指标居中直读，环形刻度带承担完成度与阶段节点。",
    hint: "数据环既要留够中心数字的呼吸边距，也要避免外圈刻度元素抢走主数字层级",
  },
  photo: {
    id: "photo",
    label: "摄影构图 · 峰峦环窗",
    shortLabel: "摄影·峰峦",
    coreZh: "主峰日照",
    coreEn: "NATURAL FRAME",
    coreDesc: "借拱门、树洞或暗色前景围出天然环框，把远山收进视觉焦点。",
    hint: "前景环带越闭合、深浅虚实越分明，中心主峰的纵深与聚焦感越强",
  },
};

export const INITIAL_STATE = {
  scenario: "poster",
  closureDeg: 218,     // 撕裂破环，缺口 142°
  ringRotation: 0,     // 拨转相位角
  coreRatio: 0.42,     // 中心黄核半径 / 外环半径
  gapRatio: 0.0,       // 内环呼吸缝宽 / 外环半径（0 贴死）
  rivalWeight: 0.88,   // 环上黄圆占中心核的视觉尺度比（0.88 严重抢戏）
  depthContrast: 0.06, // 0..1：近大远小尺度梯度（0.06 几乎等大均排）
  crowdDensity: 0.64,  // 0.1..0.75：元素膨胀拥挤度
  highlightLayer: null, // 'encirclement' | 'focus' | 'depth' | 'closure' | null
};

// 多组合法解（全部真实通过单真源 4/4 评定）
export const VALID_PRESETS = {
  classic: {
    label: "原海报经典解",
    patch: { closureDeg: 360, coreRatio: 0.42, gapRatio: 0.085, rivalWeight: 0.24, depthContrast: 0.86, crowdDensity: 0.34, ringRotation: 0 },
  },
  deepBand: {
    label: "宽环深空解",
    patch: { closureDeg: 360, coreRatio: 0.31, gapRatio: 0.105, rivalWeight: 0.20, depthContrast: 0.94, crowdDensity: 0.28, ringRotation: 12 },
  },
  breathNotch: {
    label: "留气闭合解",
    patch: { closureDeg: 326, coreRatio: 0.46, gapRatio: 0.095, rivalWeight: 0.22, depthContrast: 0.78, crowdDensity: 0.35, ringRotation: -8 },
  },
};

// 反向试错标本（对照看不同方向如何变坏）
export const ERROR_PRESETS = {
  breach: {
    label: "试错：断环漏气",
    patch: { closureDeg: 210, coreRatio: 0.42, gapRatio: 0.085, rivalWeight: 0.24, depthContrast: 0.82, crowdDensity: 0.34 },
  },
  rival: {
    label: "试错：双焦抢戏",
    patch: { closureDeg: 360, coreRatio: 0.40, gapRatio: 0.085, rivalWeight: 0.90, depthContrast: 0.82, crowdDensity: 0.34 },
  },
  bloated: {
    label: "试错：中心撑爆",
    patch: { closureDeg: 360, coreRatio: 0.64, gapRatio: 0.06, rivalWeight: 0.22, depthContrast: 0.78, crowdDensity: 0.32 },
  },
  collapsed: {
    label: "试错：中心塌陷",
    patch: { closureDeg: 360, coreRatio: 0.18, gapRatio: 0.09, rivalWeight: 0.24, depthContrast: 0.82, crowdDensity: 0.32 },
  },
  crushed: {
    label: "试错：缝死过挤",
    patch: { closureDeg: 360, coreRatio: 0.42, gapRatio: 0.0, rivalWeight: 0.24, depthContrast: 0.80, crowdDensity: 0.66 },
  },
  flat: {
    label: "试错：均排无层",
    patch: { closureDeg: 360, coreRatio: 0.42, gapRatio: 0.085, rivalWeight: 0.24, depthContrast: 0.04, crowdDensity: 0.34 },
  },
};

// 15 枚忠实对应 050 原海报黑环带内部的几何星体与点阵
const BASE_NODES = [
  { id: "n1",  angle: -148, rFrac: 0.60, tier: "fg",   shape: "circle",   color: "white",  baseK: 0.27 },
  { id: "n2",  angle: -116, rFrac: 0.56, tier: "grid", shape: "dotgrid",  color: "white",  baseK: 0.23 },
  { id: "n3",  angle: -96,  rFrac: 0.72, tier: "mid",  shape: "circle",   color: "mint2",  baseK: 0.15 },
  { id: "n4",  angle: -66,  rFrac: 0.68, tier: "fg",   shape: "mintorb",  color: "mint",   baseK: 0.29 },
  { id: "n5",  angle: -52,  rFrac: 0.44, tier: "mid",  shape: "square",   color: "white",  baseK: 0.14 },
  { id: "rival", angle: -30, rFrac: 0.52, tier: "rival", shape: "circle", color: "yellow", baseK: 0.20 },
  { id: "n7",  angle: 4,    rFrac: 0.74, tier: "bg",   shape: "square",   color: "yellow", baseK: 0.095 },
  { id: "n8",  angle: 50,   rFrac: 0.54, tier: "fg",   shape: "circle",   color: "white",  baseK: 0.26 },
  { id: "n9",  angle: 78,   rFrac: 0.66, tier: "mid",  shape: "circle",   color: "yellow", baseK: 0.13 },
  { id: "n10", angle: 96,   rFrac: 0.50, tier: "grid", shape: "vgrid",    color: "yellow", baseK: 0.21 },
  { id: "n11", angle: 122,  rFrac: 0.56, tier: "fg",   shape: "triangle", color: "white",  baseK: 0.27 },
  { id: "n12", angle: 150,  rFrac: 0.66, tier: "mid",  shape: "square",   color: "mint",   baseK: 0.15 },
  { id: "n13", angle: 174,  rFrac: 0.58, tier: "fg",   shape: "circle",   color: "mint",   baseK: 0.22 },
  { id: "n14", angle: -172, rFrac: 0.76, tier: "bg",   shape: "square",   color: "white",  baseK: 0.095 },
  { id: "n15", angle: -130, rFrac: 0.30, tier: "bg",   shape: "circle",   color: "mint2",  baseK: 0.075 },
  { id: "n16", angle: -74,  rFrac: 0.80, tier: "bg",   shape: "circle",   color: "white",  baseK: 0.068 },
  { id: "n17", angle: 108,  rFrac: 0.76, tier: "bg",   shape: "circle",   color: "mint",   baseK: 0.085 },
  { id: "n18", angle: 162,  rFrac: 0.34, tier: "bg",   shape: "circle",   color: "yellow", baseK: 0.068 },
];

export const BREACH_CENTER_DEG = 68; // 右下 5 点钟方向撕开缺口，确保右上 -30° 抢戏黄圆稳落实体黑环上

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function normDeg(d) {
  return ((d % 360) + 360) % 360;
}

function angularDistDeg(a, b) {
  const d = Math.abs(normDeg(a) - normDeg(b));
  return Math.min(d, 360 - d);
}

export function createState(patch = {}) {
  return { ...INITIAL_STATE, ...patch };
}

// 从当前状态严格计算画布内每一个实绘几何体（单真源）
export function computeRingGeometry(state, R = 200) {
  const closureDeg = clamp(state.closureDeg, 175, 360);
  const coreRatio = clamp(state.coreRatio, 0.16, 0.68);
  const gapRatio = clamp(state.gapRatio, 0.0, 0.26);
  const rivalWeight = clamp(state.rivalWeight, 0.16, 0.96);
  const depthContrast = clamp(state.depthContrast, 0.0, 1.0);
  const crowdDensity = clamp(state.crowdDensity, 0.08, 0.75);

  const rOut = R;
  const rCore = R * coreRatio;
  const gapPx = R * gapRatio;
  const rBandIn = Math.min(rOut - 12, rCore + gapPx);
  const bandThick = Math.max(12, rOut - rBandIn);
  const rBandMid = (rBandIn + rOut) * 0.5;

  const breachDeg = 360 - closureDeg;
  const halfGap = breachDeg * 0.5;
  const startDeg = normDeg(BREACH_CENTER_DEG + halfGap);
  const endDeg = startDeg + closureDeg;

  // 元素密度缩放因子：以 0.34 为原海报舒适中值（约 30% 占空），0.64 达到拥挤（>52% 占空）
  const densityScale = 0.40 + (crowdDensity / 0.34) * 0.68;
  const avgK = 0.162;

  const nonRivalList = BASE_NODES.filter((n) => n.id !== "rival");
  const elements = BASE_NODES.map((node) => {
    // 均排 vs 有节奏：depthContrast 趋近 0 时全部非抢戏元素严格均分圆周与中线，零叠撞、呈机械齿轮感
    const nrIdx = nonRivalList.indexOf(node);
    const uniformAngle = nrIdx >= 0 ? -180 + (nrIdx / nonRivalList.length) * 360 : node.angle;
    const rawAngle = node.id === "rival"
      ? node.angle + state.ringRotation * 0.35
      : uniformAngle + (node.angle - uniformAngle) * depthContrast + state.ringRotation;
    const angleDeg = normDeg(rawAngle);
    const rFrac = node.id === "rival"
      ? 0.50
      : 0.50 + (node.rFrac - 0.50) * depthContrast;

    let radius;
    if (node.id === "rival") {
      // 抢戏黄圆直接以中心核为参照尺度，确保「抢戏比」肉眼与读数严格一致
      radius = clamp(rCore * rivalWeight * 0.56, 8, Math.min(rCore * 0.96, bandThick * 0.48 + (rivalWeight > 0.5 ? 14 : 0)));
    } else {
      const blendedK = avgK + (node.baseK - avgK) * depthContrast;
      radius = clamp(bandThick * blendedK * densityScale, 3.2, bandThick * 0.49);
    }

    const radialPos = rBandIn + bandThick * rFrac;
    const rad = (angleDeg * Math.PI) / 180;
    const x = Math.cos(rad) * radialPos;
    const y = Math.sin(rad) * radialPos;

    // 落在撕裂缺口范围内的元素记为 inBreach（断环时不可形成有效围合）
    const inBreach = breachDeg > 2 && angularDistDeg(angleDeg, BREACH_CENTER_DEG) < halfGap + 3;

    // 单个元素视觉占空面积（点阵按 55% 实体感计）
    const shapeAreaFactor = node.shape === "dotgrid" || node.shape === "vgrid" ? 0.55
      : node.shape === "triangle" ? 0.82
      : node.shape === "square" ? 1.05 : 1.0;
    const area = Math.PI * radius * radius * shapeAreaFactor;

    return {
      ...node,
      angleDeg,
      rad,
      rFrac,
      radialPos,
      x,
      y,
      r: radius,
      inBreach,
      area,
      isRival: node.id === "rival",
    };
  });

  const activeEls = elements.filter((e) => !e.inBreach);
  const nonRivalEls = activeEls.filter((e) => !e.isRival);
  const radii = nonRivalEls.map((e) => e.r).sort((a, b) => a - b);
  const rLow = radii.length ? radii[Math.floor(radii.length * 0.15)] : 1;
  const rHigh = radii.length ? radii[Math.floor(radii.length * 0.88)] : 1;
  const depthRatio = +(rHigh / Math.max(1, rLow)).toFixed(2);

  const annulusArea = Math.max(1, Math.PI * (rOut * rOut - rBandIn * rBandIn) * (closureDeg / 360));
  const usedArea = activeEls.reduce((sum, e) => sum + e.area, 0);
  const fillPct = Math.round((usedArea / annulusArea) * 100);

  const rivalEl = elements.find((e) => e.isRival);
  const rivalActive = rivalEl && !rivalEl.inBreach;
  const rivalScaleRatio = rivalActive ? +(rivalEl.r / Math.max(1, rCore)).toFixed(2) : 0;
  // 还原到面向读者的「抢戏比」（rivalEl 直径感/视觉权重相对核心）
  const rivalVisualRatio = rivalActive ? +clamp(rivalWeight, 0.16, 0.96).toFixed(2) : 0;

  // 计算活跃元素的视觉重心偏移（0..1，相对 rBandMid）
  let wx = 0, wy = 0, wSum = 0;
  for (const e of activeEls) {
    const w = e.area * (e.isRival ? 1.5 : 1);
    wx += e.x * w;
    wy += e.y * w;
    wSum += w;
  }
  const centroidShiftPct = wSum > 0 ? Math.round((Math.hypot(wx / wSum, wy / wSum) / Math.max(1, rBandMid)) * 100) : 0;

  return {
    R,
    rOut,
    rCore,
    gapPx,
    rBandIn,
    bandThick,
    rBandMid,
    closureDeg: Math.round(closureDeg),
    breachDeg: Math.round(breachDeg),
    startDeg,
    endDeg,
    breachCenterDeg: BREACH_CENTER_DEG,
    corePct: Math.round((rCore / rOut) * 100),
    gapPct: +(gapRatio * 100).toFixed(1),
    bandPct: Math.round((bandThick / rOut) * 100),
    depthRatio,
    fillPct,
    rivalScaleRatio,
    rivalVisualRatio,
    centroidShiftPct,
    elements,
    activeEls,
    rivalEl,
  };
}

// 统一单真源评定（覆盖 9 类双向错态、4 项原则探针、4 条原海报 TIPS 勾叉与白话诊断）
export function auditRing(state) {
  const g = computeRingGeometry(state, 200);
  const errors = [];

  if (g.closureDeg < 305) {
    errors.push({
      code: "breach",
      key: "closure",
      severity: 100,
      short: `缺口 ${g.breachDeg}°`,
      headline: `黑环右下撕开了 ${g.breachDeg}° 缺口，闭合场域漏气了`,
      why: `环形构图靠闭合边界把画内与画外隔成「共同区域」。现在环带只包住 ${g.closureDeg}°，眼睛绕到缺口处会顺势滑出画外，退化成半开的弧形，向心围合感立刻散架。`,
      fix: "在画布上向右横拖（或拉高「环带闭合」滑轨），把环带收拢到 310°–360° 形成闭合围合。",
    });
  }
  if (g.rivalVisualRatio > 0.42) {
    errors.push({
      code: "rival",
      key: "focus",
      severity: 95,
      short: `抢戏 ${Math.round(g.rivalVisualRatio * 100)}%`,
      headline: `环上亮黄圆抢戏（达中心 ${Math.round(g.rivalVisualRatio * 100)}%），出现双焦点打架`,
      why: "原海报第一条 TIPS 写明「中心要明确，避免多焦点分散注意力」。环带里一旦出现和中心同样刺眼的亮黄大块，眼睛会在圆心和右上黄圆之间反复横跳，中心焦点被直接夺权。",
      fix: "直接点击画布右上方的亮黄大圆，把它收小为克制的节奏点缀（≤ 36%）。",
    });
  }
  if (g.corePct < 24) {
    errors.push({
      code: "core_small",
      key: "focus",
      severity: 90,
      short: `核塌 ${g.corePct}%`,
      headline: `中心焦点缩到只剩 ${g.corePct}%，被宽黑环吞没了`,
      why: "环形不是黑洞：环带是服务于中心的视觉支架。中心核直径缩到外环 24% 以下时，主体文字与图形挤作一团，观者只看见沉重的黑圈却读不清核心内容。",
      fix: "向外拖动内环光圈柄，把中心焦点占比拉回到 28%–52% 的清晰区间。",
    });
  } else if (g.corePct > 56) {
    errors.push({
      code: "core_huge",
      key: "focus",
      severity: 88,
      short: `核爆 ${g.corePct}%`,
      headline: `中心核撑大到 ${g.corePct}%，黑环被挤成细边退化了`,
      why: "当中心占满 56% 以上直径，外围环带宽度不足 30%，再也放不下近大远小的环绕层次。画面退化成一张普通的实心圆底图，失去了环形构图的围合场域。",
      fix: "向内收窄中心核占比到 30%–52%，给黑环带留出足够的环绕空间。",
    });
  }
  if (g.gapPct < 4.5) {
    errors.push({
      code: "gap_crushed",
      key: "encirclement",
      severity: 82,
      short: `缝死 ${g.gapPct}%`,
      headline: `中心与黑环之间呼吸缝压死（仅 ${g.gapPct}%），画面发闷`,
      why: "原海报在亮黄中心与宽黑环之间特意留出一圈浅色呼吸缝。一旦缝隙塌成 0%，环上元素直接贴撞中心边缘，核与环黏连在一起，焦点的独立感大打折扣。",
      fix: "拉开「内环呼吸缝」到 5%–16%，让中心焦点与外围黑环利落分开。",
    });
  } else if (g.gapPct > 19.5) {
    errors.push({
      code: "gap_detached",
      key: "encirclement",
      severity: 76,
      short: `脱节 ${g.gapPct}%`,
      headline: `内环留白过宽（${g.gapPct}%），外环和中心脱节了`,
      why: "呼吸缝不是越宽越好：当缝隙超过外径 19%，外围环带被推到画幅边缘变薄，和中心焦点拉出鸿沟，格式塔向心围合的拉力会明显减弱。",
      fix: "把「内环呼吸缝」收回到 6%–15%，让环带既透亮又紧贴托住中心。",
    });
  }
  if (g.fillPct > 50) {
    errors.push({
      code: "overcrowded",
      key: "encirclement",
      severity: 78,
      short: `过挤 ${g.fillPct}%`,
      headline: `环带占空高达 ${g.fillPct}%，几何元素挤撞在一起`,
      why: "原海报第四条 TIPS 提醒「留出适当呼吸空间，避免过于拥挤」。环内元素超过环带面积一半时，哑黑底场的承托感消失，杂乱的轮廓反而会干扰中心阅读。",
      fix: "调低「环带密度」到 20%–45% 区间，让每个图形周围都透出干净的黑底呼吸感。",
    });
  } else if (g.fillPct < 14) {
    errors.push({
      code: "sparse",
      key: "depth",
      severity: 72,
      short: `空洞 ${g.fillPct}%`,
      headline: `环内占空只有 ${g.fillPct}%，环绕节奏撑不起来`,
      why: "如果黑环上只有寥寥几个小点，环带看起来像一条死板的黑边框，缺少「元素沿环分布、形成包围与流动感」的视觉节奏。",
      fix: "适度提高「环带密度」到 22%–42%，让大圆、方块与点阵沿环带撑起节奏。",
    });
  }
  if (g.depthRatio < 1.85) {
    errors.push({
      code: "flat_depth",
      key: "depth",
      severity: 74,
      short: `均排 ${g.depthRatio.toFixed(1)}×`,
      headline: `环上元素几乎等大均排（极差仅 ${g.depthRatio.toFixed(1)}×），像死板齿轮`,
      why: "原海报强调「近大远小、虚实对比，增强空间与节奏感」。所有环上元素同尺寸、等间距时，环带变成机械轴承，既无前后景深，也带不动视线的缓急韵律。",
      fix: "推高「近大远小层次」使尺度极差 ≥ 2.0×，让大圆近景、中块与远景微点拉开纵深。",
    });
  }

  errors.sort((a, b) => b.severity - a.severity);

  // 4 项原海报核心原则探针状态（单真源判定）
  const okClosure = g.closureDeg >= 305;
  const okFocus = g.rivalVisualRatio <= 0.42 && g.corePct >= 24 && g.corePct <= 56;
  const okEncirclement = g.gapPct >= 4.5 && g.gapPct <= 19.5 && g.fillPct >= 14 && g.fillPct <= 50;
  const okDepth = g.depthRatio >= 1.85 && g.fillPct >= 14;

  const passCount = [okEncirclement, okFocus, okDepth, okClosure].filter(Boolean).length;

  // 4 个四角原则徽标的精简实测标签
  const probes = {
    encirclement: {
      ok: okEncirclement,
      badge: g.gapPct < 4.5 ? `缝死 ${g.gapPct}%`
        : g.gapPct > 19.5 ? `脱节 ${g.gapPct}%`
        : g.fillPct > 50 ? `过挤 ${g.fillPct}%`
        : g.fillPct < 14 ? `空洞 ${g.fillPct}%`
        : `占空 ${g.fillPct}% · 缝 ${g.gapPct}%`,
    },
    focus: {
      ok: okFocus,
      badge: g.rivalVisualRatio > 0.42 ? `双焦抢戏`
        : g.corePct < 24 ? `核塌 ${g.corePct}%`
        : g.corePct > 56 ? `核爆 ${g.corePct}%`
        : `单核 ${g.corePct}%`,
    },
    depth: {
      ok: okDepth,
      badge: g.depthRatio < 1.85 ? `均排 ${g.depthRatio.toFixed(1)}×`
        : g.fillPct < 14 ? `过疏 ${g.fillPct}%`
        : `极差 ${g.depthRatio.toFixed(1)}×`,
    },
    closure: {
      ok: okClosure,
      badge: okClosure ? (g.closureDeg >= 355 ? "闭环 360°" : `留气 ${g.closureDeg}°`) : `断裂 ${g.closureDeg}°`,
    },
  };

  // 原海报 4 条 TIPS 实时勾叉映射
  const tips = [
    { ok: okFocus, text: "中心要明确，避免多焦点分散注意力。" },
    { ok: okDepth, text: "环上元素大小、间距可形成节奏变化。" },
    { ok: okClosure && g.corePct >= 24 && g.corePct <= 56, text: "先确定中心，再围绕中心搭建环形结构。" },
    { ok: okEncirclement, text: "留出适当呼吸空间，避免过于拥挤。" },
  ];

  // 原海报右下三步微缩图实时达成阶段（1..3）
  const buildStage = !okFocus ? 0 : !okClosure ? 1 : !(okDepth && okEncirclement) ? 2 : 3;

  let verdictTitle, verdictWhy, verdictFix, postureLabel;
  if (errors.length === 0) {
    const modeDesc = g.closureDeg < 355
      ? `带 ${g.breachDeg}° 留气入口仍保持格式塔闭合`
      : g.corePct <= 35
        ? "宽环深空围合型"
        : "经典均衡核环型";
    verdictTitle = `环形场域成立（${modeDesc}）`;
    verdictWhy = `中心焦核占外径 ${g.corePct}% 且无抢戏副焦，外隔 ${g.gapPct}% 呼吸缝，${g.closureDeg}° 环带内以 ${g.depthRatio.toFixed(1)}× 近大远小层次占空 ${g.fillPct}%，视线绕环一周后稳稳落回中心。`;
    verdictFix = "按空格放行薄荷视线流验证归心轨迹，或切换「腕表 / 数据环 / 峰峦」及反例试错按钮继续检验边界。";
    postureLabel = "四维成立（示意）";
  } else {
    const top = errors[0];
    verdictTitle = top.headline;
    verdictWhy = top.why;
    verdictFix = top.fix;
    postureLabel = errors.length >= 3 ? "多重失序（示意）" : errors.length === 2 ? "两处失衡（示意）" : "单处待调（示意）";
  }

  return {
    g,
    errors,
    passCount,
    isPass: errors.length === 0,
    probes,
    tips,
    buildStage,
    verdictTitle,
    verdictWhy,
    verdictFix,
    postureLabel,
    statusChip: errors.length === 0 ? `4/4 · 闭环聚焦` : `${passCount}/4 · ${errors[0].short}`,
  };
}
