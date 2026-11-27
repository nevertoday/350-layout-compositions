// 054 离心式构图 · 单真源几何与诊断模型
// 所有画布图形、主诊单、5 条要点探针、4 枚圆徽读数均从此模块实绘结果同步派生。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 几何爆发",
    shortLabel: "原海报",
    coreTag: "核心锚点",
    coreEn: "CORE",
    redTag: "向外延展",
    blueTag: "释放张力",
    caption: "1:1 转译 054 原海报：暖奶油宣纸上，朱砂红核心稳住视线起点，红蓝对角巨箭与红/蓝/黑/暖灰几何体层层向外释放。"
  },
  brand: {
    id: "brand",
    label: "品牌发布 · 声浪出圈",
    shortLabel: "品牌发布",
    coreTag: "新标首发",
    coreEn: "LAUNCH",
    redTag: "全城扩散",
    blueTag: "声浪破界",
    caption: "品牌焕新主视觉：核心标识锁死中央第一眼，主打标语沿对角冲出画幅边缘，外圈权益碎片由实转虚透气展开。"
  },
  summit: {
    id: "summit",
    label: "科技峰会 · 能量扩散",
    shortLabel: "科技峰会",
    coreTag: "算力中枢",
    coreEn: "NEXUS",
    redTag: "前沿爆发",
    blueTag: "生态外延",
    caption: "科技大会海报：中心技术引擎作为高对比发射源，双轴主题箭头打破版面静气，次级议题节点按由强到弱退居外环。"
  }
};

// 开场默认 0/4 复合错态（绝非答案）
export const BROKEN_STATE = {
  scenario: "poster",
  impulse: 24,       // 推力过弱：闷核缩团
  decay: -38,        // 负衰减：外重内轻
  anchorSize: 6,     // 锚核萎缩：失锚
  rhythm: 8,         // 均纹死环：无大小疏密差
  redReach: 42,      // 红箭缩框
  blueReach: 40,     // 蓝箭缩框
  axisSplit: 168,    // 对角夹角
  heavyOuter: [0, 5, 11], // 3 枚喧宾纯黑外圈重块
  guides: true
};

// 多组合法解与双向试错预设
export const PRESETS = {
  classic: {
    name: "原海报经典解",
    impulse: 68,
    decay: 64,
    anchorSize: 17,
    rhythm: 78,
    redReach: 96,
    blueReach: 95,
    axisSplit: 172,
    heavyOuter: [],
    guides: true
  },
  burst: {
    name: "爆裂破框解",
    impulse: 76,
    decay: 74,
    anchorSize: 15,
    rhythm: 88,
    redReach: 103,
    blueReach: 102,
    axisSplit: 164,
    heavyOuter: [],
    guides: true
  },
  airy: {
    name: "轻盈呼吸解",
    impulse: 58,
    decay: 52,
    anchorSize: 20,
    rhythm: 66,
    redReach: 88,
    blueReach: 86,
    axisSplit: 176,
    heavyOuter: [],
    guides: true
  },
  // 5 组双向试错
  err_collapse: {
    name: "闷核塌缩",
    impulse: 18,
    decay: 50,
    anchorSize: 16,
    rhythm: 60,
    redReach: 38,
    blueReach: 36,
    axisSplit: 172,
    heavyOuter: [],
    guides: true
  },
  err_blowout: {
    name: "甩边散沙",
    impulse: 98,
    decay: 48,
    anchorSize: 15,
    rhythm: 72,
    redReach: 96,
    blueReach: 94,
    axisSplit: 172,
    heavyOuter: [],
    guides: true
  },
  err_inverted: {
    name: "外重内轻",
    impulse: 66,
    decay: -46,
    anchorSize: 7,
    rhythm: 74,
    redReach: 92,
    blueReach: 90,
    axisSplit: 172,
    heavyOuter: [0, 5, 11],
    guides: true
  },
  err_flat: {
    name: "均纹死环",
    impulse: 64,
    decay: 58,
    anchorSize: 17,
    rhythm: 4,
    redReach: 88,
    blueReach: 88,
    axisSplit: 180,
    heavyOuter: [],
    guides: true
  },
  err_caged: {
    name: "缩框憋闷",
    impulse: 56,
    decay: 62,
    anchorSize: 18,
    rhythm: 74,
    redReach: 44,
    blueReach: 42,
    axisSplit: 170,
    heavyOuter: [],
    guides: true
  }
};

export function createInitialState() {
  return {
    ...BROKEN_STATE,
    heavyOuter: [...BROKEN_STATE.heavyOuter]
  };
}

// 18 枚原海报同款离心抛射体蓝图（按原海报方位角、材质与层次精心标定）
// baseAngle: 角度制（0 为正右，-90 为正上）
// baseRing: 0(内) / 1(中) / 2(外)
// shape: dot | ring | rect | bar | tri | grayOrb
const PARTICLE_BLUEPRINTS = [
  // 0: 右上偏东大黑圆（可点击降重为暖灰/轻盈态；开场被设为喧宾重块）
  { id: 0, baseAngle: -16, ring: 2, radialBias: 0.94, baseSize: 23, color: "ink", shape: "dot", calmShape: "grayOrb", calmSize: 17, clickable: true },
  // 1: 左上暖灰呼吸大圆
  { id: 1, baseAngle: -118, ring: 2, radialBias: 0.88, baseSize: 22, color: "mist", shape: "grayOrb", clickable: false },
  // 2: 左上纯黑中圆
  { id: 2, baseAngle: -136, ring: 1, radialBias: 0.68, baseSize: 14, color: "ink", shape: "dot", clickable: false },
  // 3: 左上钴蓝空心细大环
  { id: 3, baseAngle: -146, ring: 1, radialBias: 0.50, baseSize: 17, color: "blue", shape: "ring", clickable: false },
  // 4: 偏正上钴蓝小方块
  { id: 4, baseAngle: -78, ring: 1, radialBias: 0.56, baseSize: 11, color: "blue", shape: "rect", clickable: false },
  // 5: 左中钴蓝大圆（开场喧宾重块，点击卸重）
  { id: 5, baseAngle: 172, ring: 2, radialBias: 0.82, baseSize: 16, color: "blue", shape: "dot", calmShape: "ring", calmSize: 14, clickable: true },
  // 6: 正上偏右朱红小圆（近核）
  { id: 6, baseAngle: -72, ring: 0, radialBias: 0.34, baseSize: 9, color: "red", shape: "dot", clickable: false },
  // 7: 右上朱红中圆（沿红箭侧）
  { id: 7, baseAngle: -32, ring: 1, radialBias: 0.64, baseSize: 11, color: "red", shape: "dot", clickable: false },
  // 8: 右中朱红倾斜方块
  { id: 8, baseAngle: -18, ring: 1, radialBias: 0.56, baseSize: 14, color: "red", shape: "rect", clickable: false },
  // 9: 右下钴蓝空心环
  { id: 9, baseAngle: 22, ring: 1, radialBias: 0.56, baseSize: 13, color: "blue", shape: "ring", clickable: false },
  // 10: 右下墨黑实心圆
  { id: 10, baseAngle: 40, ring: 1, radialBias: 0.66, baseSize: 12, color: "ink", shape: "dot", clickable: false },
  // 11: 右下暖灰呼吸大圆（开场喧宾重块，点击卸回原海报透气暖灰圆）
  { id: 11, baseAngle: 56, ring: 2, radialBias: 0.90, baseSize: 21, color: "mist", shape: "grayOrb", calmShape: "grayOrb", calmSize: 19, clickable: true },
  // 12: 正下偏左钴蓝中圆
  { id: 12, baseAngle: 108, ring: 1, radialBias: 0.60, baseSize: 11, color: "blue", shape: "dot", clickable: false },
  // 13: 左下朱红斜短棒
  { id: 13, baseAngle: 118, ring: 0, radialBias: 0.42, baseSize: 13, color: "red", shape: "bar", clickable: false },
  // 14: 左偏上朱红短矩形
  { id: 14, baseAngle: -162, ring: 1, radialBias: 0.58, baseSize: 12, color: "red", shape: "rect", clickable: false },
  // 15: 正上远端朱红小圆
  { id: 15, baseAngle: -71, ring: 2, radialBias: 0.93, baseSize: 7.5, color: "red", shape: "dot", clickable: false },
  // 16: 左偏下黑小三角指针
  { id: 16, baseAngle: 156, ring: 0, radialBias: 0.41, baseSize: 8.5, color: "ink", shape: "tri", clickable: false },
  // 17: 右偏下朱红小圆点
  { id: 17, baseAngle: 24, ring: 2, radialBias: 0.84, baseSize: 8, color: "red", shape: "dot", clickable: false }
];

// 计算从中心 (cx, cy) 沿 angleRad 射线到矩形 [0..w, 0..h] 边缘的距离
export function rayToRectDist(cx, cy, angleRad, w, h) {
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  let tMin = Infinity;
  if (dx > 1e-6) tMin = Math.min(tMin, (w - cx) / dx);
  else if (dx < -1e-6) tMin = Math.min(tMin, -cx / dx);
  if (dy > 1e-6) tMin = Math.min(tMin, (h - cy) / dy);
  else if (dy < -1e-6) tMin = Math.min(tMin, -cy / dy);
  return Math.max(10, tMin);
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const deg2rad = (d) => (d * Math.PI) / 180;

// 单真源几何构造：直接供 hero.js 绘制，并供 evaluate() 实时测量
export function buildScene(state, w = 880, h = 560) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const minDim = Math.min(w, h);
  const baseScale = minDim / 540; // 归一化绘制尺度，确保大小屏等比正圆

  // 1. 中心锚核
  const coreR = clamp((state.anchorSize / 100) * minDim * 0.62, 10 * baseScale, minDim * 0.34);
  const innerRingR = coreR + 13 * baseScale;
  const outerRingR = coreR + 27 * baseScale;

  // 2. 红蓝双主冲量箭头（右上朱红 + 左下钴蓝）
  const redAngleDeg = -50;
  const blueAngleDeg = redAngleDeg + state.axisSplit;
  const redRad = deg2rad(redAngleDeg);
  const blueRad = deg2rad(blueAngleDeg);
  const redEdge = rayToRectDist(cx, cy, redRad, w, h);
  const blueEdge = rayToRectDist(cx, cy, blueRad, w, h);

  const arrowStart = outerRingR + 6 * baseScale;
  const redTipDist = clamp(arrowStart + (redEdge - arrowStart) * (state.redReach / 100), arrowStart + 18 * baseScale, redEdge * 1.04);
  const blueTipDist = clamp(arrowStart + (blueEdge - arrowStart) * (state.blueReach / 100), arrowStart + 18 * baseScale, blueEdge * 1.04);

  const axes = [
    {
      id: "red",
      color: "red",
      angleDeg: redAngleDeg,
      angleRad: redRad,
      startDist: arrowStart,
      tipDist: redTipDist,
      edgeDist: redEdge,
      reachRatio: redTipDist / redEdge,
      sx: cx + Math.cos(redRad) * arrowStart,
      sy: cy + Math.sin(redRad) * arrowStart,
      tx: cx + Math.cos(redRad) * redTipDist,
      ty: cy + Math.sin(redRad) * redTipDist,
      // 箭锋拖拽柄留在画内可抓到的位置
      hx: cx + Math.cos(redRad) * Math.min(redTipDist, redEdge - 22 * baseScale),
      hy: cy + Math.sin(redRad) * Math.min(redTipDist, redEdge - 22 * baseScale)
    },
    {
      id: "blue",
      color: "blue",
      angleDeg: blueAngleDeg,
      angleRad: blueRad,
      startDist: arrowStart,
      tipDist: blueTipDist,
      edgeDist: blueEdge,
      reachRatio: blueTipDist / blueEdge,
      sx: cx + Math.cos(blueRad) * arrowStart,
      sy: cy + Math.sin(blueRad) * arrowStart,
      tx: cx + Math.cos(blueRad) * blueTipDist,
      ty: cy + Math.sin(blueRad) * blueTipDist,
      hx: cx + Math.cos(blueRad) * Math.min(blueTipDist, blueEdge - 22 * baseScale),
      hy: cy + Math.sin(blueRad) * Math.min(blueTipDist, blueEdge - 22 * baseScale)
    }
  ];

  // 3. 18 枚离心抛射体
  const rhythmT = clamp(state.rhythm / 100, 0, 1);
  const impulseT = clamp(state.impulse / 100, 0, 1);
  const decayT = clamp(state.decay / 100, -0.6, 1); // 负值=外重内轻，正值=内强外弱
  const heavySet = new Set(state.heavyOuter || []);

  // 按目标方位角排序，保证 rhythm=0 时为严格 18 等分机械齿轮，插值时不发生跨周打结
  const angleOrder = PARTICLE_BLUEPRINTS
    .map((bp, idx) => ({ idx, ang: ((bp.baseAngle % 360) + 360) % 360 }))
    .sort((a, b) => a.ang - b.ang);
  const rankByIdx = new Array(PARTICLE_BLUEPRINTS.length);
  angleOrder.forEach((item, rank) => { rankByIdx[item.idx] = rank; });

  const particles = PARTICLE_BLUEPRINTS.map((bp, idx) => {
    const targetAng = ((bp.baseAngle % 360) + 360) % 360;
    const uniformAngle = rankByIdx[idx] * (360 / PARTICLE_BLUEPRINTS.length);
    let diff = targetAng - uniformAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const angleDeg = uniformAngle + diff * rhythmT;
    const angleRad = deg2rad(angleDeg);
    const edgeDist = rayToRectDist(cx, cy, angleRad, w, h);

    // 径向轨道归一化位置：均纹态全挤在接近的中间圈，高节奏时分层错开
    const ringFactor = lerp(0.62, bp.radialBias, 0.12 + 0.88 * rhythmT);
    // 离心推力控制实际外推比例：24% 时全缩回核旁；超 84% 过载时模拟离心机超速全员甩贴桶壁
    const minNormR = (outerRingR + 12 * baseScale) / edgeDist;
    const spreadSpan = lerp(0.16, 0.95, impulseT);
    const baseNormR = clamp(minNormR + (0.94 - minNormR) * spreadSpan * ringFactor, minNormR, 0.965);
    const overload = clamp((impulseT - 0.84) / 0.16, 0, 1);
    const normR = lerp(baseNormR, 0.965, overload * 0.88);
    const dist = normR * edgeDist;

    const isHeavyRebel = bp.clickable && heavySet.has(bp.id);

    // 尺寸与视觉重量：受 rhythm（大小极差）、decay（内强外弱梯度）与 heavyRebel 共同驱动
    const uniformSize = 12.5;
    let rawSize = lerp(uniformSize, bp.baseSize, rhythmT);

    // 衰减斜率作用：ring 0（内）vs ring 2（外）
    let decayScale = 1;
    if (bp.ring === 0) decayScale = 1 + decayT * 0.26;
    else if (bp.ring === 1) decayScale = 1 + decayT * 0.04;
    else decayScale = 1 - decayT * 0.22;

    rawSize = clamp(rawSize * decayScale, 5.5, 29);

    let shape = bp.shape;
    let color = bp.color;
    if (isHeavyRebel) {
      // 喧宾外圈巨黑块：醒目、沉重、抢夺第一眼
      rawSize = Math.max(rawSize, 26 + (decayT < 0 ? 5 : 0));
      shape = "dot";
      color = "ink";
    } else if (bp.clickable && bp.calmShape) {
      // 用户已卸重：转化为透气暖灰圆或钴蓝空心环
      shape = bp.calmShape;
      rawSize = lerp(uniformSize, bp.calmSize || bp.baseSize * 0.84, 0.2 + 0.8 * rhythmT) * clamp(1 - decayT * 0.12, 0.76, 1.08);
      color = bp.calmShape === "grayOrb" ? "mist" : "blue";
    }

    const rPx = rawSize * baseScale;
    const x = cx + Math.cos(angleRad) * dist;
    const y = cy + Math.sin(angleRad) * dist;

    // 贴墙检测（被甩扁在画框边缘 5% 区域内）
    const marginPx = Math.min(x - rPx, w - (x + rPx), y - rPx, h - (y + rPx));
    const pinnedWall = marginPx < minDim * 0.028;

    // 真实视觉重量（面积 × 色阶反差因子）
    const contrastFactor =
      color === "ink" ? 1.0 :
      color === "red" ? 0.94 :
      color === "blue" ? 0.88 :
      0.34; // mist 暖灰圆和空心环视觉更轻盈
    const fillFactor = shape === "ring" ? 0.42 : shape === "bar" ? 0.55 : 1.0;
    const visualWeight = (rawSize * rawSize) * contrastFactor * fillFactor;

    return {
      id: bp.id,
      ring: bp.ring,
      angleDeg,
      angleRad,
      normR,
      dist,
      edgeDist,
      x,
      y,
      rPx,
      rawSize,
      shape,
      color,
      clickable: bp.clickable,
      isHeavyRebel,
      pinnedWall,
      visualWeight
    };
  });

  // 4. 放射细虚线轨道（20 条）
  const tracks = [];
  for (let i = 0; i < 20; i++) {
    const aDeg = -90 + i * 18 + (i % 2 === 0 ? 3 : -2) * rhythmT;
    const aRad = deg2rad(aDeg);
    const eDist = rayToRectDist(cx, cy, aRad, w, h);
    const lenRatio = lerp(0.38, 0.93, impulseT) * (0.76 + 0.24 * ((i * 7) % 5) / 4);
    tracks.push({
      angleRad: aRad,
      r0: outerRingR + 3 * baseScale,
      r1: Math.min(eDist * 0.96, outerRingR + (eDist - outerRingR) * lenRatio)
    });
  }

  return {
    w,
    h,
    cx,
    cy,
    minDim,
    baseScale,
    coreR,
    innerRingR,
    outerRingR,
    axes,
    particles,
    tracks
  };
}

// 单真源诊断核算：所有数值和布尔结论 100% 算自 buildScene() 实际坐标与重量
export function evaluateState(state, w = 880, h = 560) {
  const scene = buildScene(state, w, h);
  const { particles, axes, coreR, minDim } = scene;

  // 实测平均径向扩散（百分比）
  const avgNormR = particles.reduce((s, p) => s + p.normR, 0) / particles.length;
  const avgSpreadPct = Math.round(avgNormR * 100);

  // 贴墙挤扁计数
  const wallPinCount = particles.filter((p) => p.pinnedWall).length;

  // 锚核相对画幅最短边占比（直径 / 最短边）
  const coreDiamPct = Math.round(((coreR * 2) / minDim) * 100);

  // 喧宾外圈黑块数量
  const heavyRebels = particles.filter((p) => p.isHeavyRebel);
  const heavyRebelCount = heavyRebels.length;

  // 内环+锚核势能 vs 外环实测视觉重量比（内强外弱递进）
  const innerList = particles.filter((p) => p.ring <= 1);
  const outerList = particles.filter((p) => p.ring === 2);
  const innerMean = innerList.reduce((s, p) => s + p.visualWeight, 0) / Math.max(1, innerList.length);
  const outerMean = outerList.reduce((s, p) => s + p.visualWeight, 0) / Math.max(1, outerList.length);
  // 锚核权重也计入中心场力
  const coreNormWeight = Math.pow(state.anchorSize * 1.35, 2) * 0.95;
  const decayRatio = +((innerMean * 0.55 + coreNormWeight * 0.45) / Math.max(18, outerMean)).toFixed(2);

  // 节奏极差（基于常规非喧宾元素的实绘尺寸 max/min × 角度间距变异增益，防止喧宾黑块误报高节奏）
  const normalParticles = particles.filter((p) => !p.isHeavyRebel);
  const sizes = (normalParticles.length >= 4 ? normalParticles : particles).map((p) => p.rawSize);
  const sizeRatio = Math.max(...sizes) / Math.max(1, Math.min(...sizes));
  const sortedAngles = particles.map((p) => ((p.angleDeg % 360) + 360) % 360).sort((a, b) => a - b);
  const gaps = sortedAngles.map((a, i) => {
    const next = i + 1 < sortedAngles.length ? sortedAngles[i + 1] : sortedAngles[0] + 360;
    return next - a;
  });
  const meanGap = 360 / gaps.length;
  const gapStd = Math.sqrt(gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / gaps.length);
  const gapCv = gapStd / meanGap;
  const rhythmRatio = +(1 + (sizeRatio - 1) * 0.42 + gapCv * 1.9).toFixed(2);

  // 双主冲量轴实测伸展与破边比
  const redReachPct = Math.round(axes[0].reachRatio * 100);
  const blueReachPct = Math.round(axes[1].reachRatio * 100);
  const maxAxisReachPct = Math.max(redReachPct, blueReachPct);
  const minAxisReachPct = Math.min(redReachPct, blueReachPct);
  const axisSplitDeg = Math.round(state.axisSplit);

  // 4 项单真源硬判据
  const anchorLost = state.anchorSize < 11 || heavyRebelCount > 0 && state.anchorSize < 13;
  const anchorBloat = state.anchorSize > 26;
  const anchorOk = !anchorLost && !anchorBloat;

  const collapsed = avgSpreadPct < 43;
  const blownOut = avgSpreadPct > 78 || wallPinCount >= 4;
  const spreadOk = !collapsed && !blownOut;

  const invertedWeight = decayRatio < 1.18 || heavyRebelCount > 0 || state.decay < 18;
  const flatRhythm = rhythmRatio < 1.85;
  const hierarchyOk = !invertedWeight && !flatRhythm;

  const cagedAxes = maxAxisReachPct < 80 || minAxisReachPct < 70;
  const axisImbalance = axisSplitDeg < 132;
  const releaseOk = !cagedAxes && !axisImbalance;

  const passedCount = [anchorOk, spreadOk, hierarchyOk, releaseOk].filter(Boolean).length;

  // 8 类错态优先级诊断（说清「为什么这样看」）
  let fault = "pass";
  let shortTag = "4/4 · 离心成立";
  let tierLabel = "离心势能：畅快外扩（示意）";
  let headline = "锚核稳固、层次由强转轻，双主轴顺势破边释放";
  let why = `中心朱红锚核占比 ${coreDiamPct}% 稳住第一眼，18 枚抛射体沿轨道均散至 ${avgSpreadPct}% 且内强外弱比达 ${decayRatio}×，红蓝双主轴以 ${axisSplitDeg}° 对角冲抵 ${maxAxisReachPct}% 边界——视线先定核、再畅快流向画外。`;
  let next = "按 Space 发射一轮离心冲击波，看视线粒子如何从红心畅快冲出画框；也可以切不同合法解或故意拉坏参数对比体验。";

  if (heavyRebelCount > 0 && (anchorLost || state.decay < 0)) {
    fault = "inverted_weight";
    shortTag = `${passedCount}/4 · 外重内轻`;
    tierLabel = "离心势能：外沉扯裂（示意）";
    headline = `外圈 ${heavyRebelCount} 枚黑块喧宾夺主，中心红核萎缩失锚`;
    why = `离心构图必须「内强外弱」——眼下中心红核只剩 ${coreDiamPct}%，外圈却挂着 ${heavyRebelCount} 枚超重纯黑块（内外重量比跌到 ${decayRatio}×），观众第一眼直接被边缘重块扯走，根本找不到出发的原点。`;
    next = "直接点击画布上标红的「× 点此降重」黑块把它们卸轻，再把「中心锚核」拉到 15% 左右或往上纵拖画布拉正衰减梯度。";
  } else if (collapsed) {
    fault = "collapsed";
    shortTag = `${passedCount}/4 · 闷核塌缩`;
    tierLabel = "离心势能：缩团停滞（示意）";
    headline = `平均扩散仅 ${avgSpreadPct}%，元素全憋在画面中央`;
    why = "离心推力不足时，所有几何块挤成一团，画幅外围留下大片死白。没有「从中心奔向四方」的位移差，静态构图就生不出向外的扩张感与呼吸感。";
    next = "在画布上向右横拖（或推高「离心推力」到 58%–76%），把全部几何抛射体往四周均匀甩开。";
  } else if (blownOut) {
    fault = "blown_out";
    shortTag = `${passedCount}/4 · 甩边空心`;
    tierLabel = "离心势能：散沙解体（示意）";
    headline = `扩散过猛（${avgSpreadPct}%），${wallPinCount} 枚元素被甩扁在四壁`;
    why = "离心不等于「炸碎贴墙」。把元素全甩死在画框四边，中环彻底空洞脱节，中心与外缘断了联系，版面立刻变成四分五裂的碎片框。";
    next = "向左横拖画布收一点离心推力（回落到 62%–75%），让中环和外环重新搭起连贯的阶梯。";
  } else if (anchorLost) {
    fault = "anchor_lost";
    shortTag = `${passedCount}/4 · 中心失锚`;
    tierLabel = "离心势能：无源散沙（示意）";
    headline = `中心锚核仅占 ${coreDiamPct}%，画面失去视觉出发点`;
    why = "没有稳固的中心锚点，向外飞的元素就成了无头苍蝇般的爆炸碎片。观众需要一个清晰的「起点」，才能读懂其余元素正在从这里向外扩散。";
    next = "调大「中心锚核」滑轨到 14%–21%，给整个离心场立住一块一眼能锁死的发射核心。";
  } else if (anchorBloat) {
    fault = "anchor_bloat";
    shortTag = `${passedCount}/4 · 巨核吞场`;
    tierLabel = "离心势能：滑向圆形静物（示意）";
    headline = `中心红核膨胀至 ${coreDiamPct}%，吞掉了外扩轨道`;
    why = "锚核太大时，它不再是「发射源」，反而像一块巨大的静物把周边轨道压死，整体滑向 047 圆形构图，外延的奔跑空间被彻底挤没了。";
    next = "把「中心锚核」回调到 14%–22%，把舞台还给向外奔跑的箭头与几何节奏。";
  } else if (invertedWeight) {
    fault = "inverted_weight";
    shortTag = `${passedCount}/4 · 层次倒挂`;
    tierLabel = "离心势能：内弱外重（示意）";
    headline = heavyRebelCount > 0
      ? `外圈仍留 ${heavyRebelCount} 枚喧宾重黑块，边缘比中心更抢戏`
      : `内外重量比仅 ${decayRatio}×，边缘体量没有自然变轻`;
    why = "原海报的精妙在于「由中心到边缘、由强到弱」：内圈靠高饱和红蓝黑发力，外圈穿插淡暖灰圆与空心细环透气。如果外圈一样沉重，视线就会卡死在边角回不来。";
    next = heavyRebelCount > 0
      ? "点击画布上带红框的喧宾黑块卸成透气暖灰/空心环，再把「内强外弱衰减」推到 45% 以上。"
      : "在画布向上纵拖（或推高「内强外弱衰减」到 45%–80%），让外圈元素自然变轻透气。";
  } else if (flatRhythm) {
    fault = "flat_rhythm";
    shortTag = `${passedCount}/4 · 均纹齿轮`;
    tierLabel = "离心势能：呆板轮盘（示意）";
    headline = `节奏极差仅 ${rhythmRatio}×，元素排成了静止的均等齿轮`;
    why = "当 18 枚元素大小差不多、角度等分排布时，大脑会把它识别成静止的机械表盘或 055 同心圆环——对称均匀只会抵消动势，必须靠大小、疏密、方向差异推着视线流动。";
    next = "把「动感节奏」拉高到 55% 以上，拉开大小圆、空心环、斜方块与角间距的疏密反差。";
  } else if (axisImbalance) {
    fault = "axis_imbalance";
    shortTag = `${passedCount}/4 · 单侧偏倾`;
    tierLabel = "离心势能：重心侧倾（示意）";
    headline = `红蓝主轴夹角仅 ${axisSplitDeg}°，能量全歪向同一侧`;
    why = "离心式构图强调「向四周扩散」的平衡张力。两条主冲量轴扭到同侧后，画面变成单向斜冲，另一半空间彻底失重塌空。";
    next = "直接拖动蓝色大箭的箭锋往左下方拉开，让红蓝双主轴形成约 150°–180° 的对角张力。";
  } else if (cagedAxes) {
    fault = "caged_axes";
    shortTag = `${passedCount}/4 · 缩框憋闷`;
    tierLabel = "离心势能：边界锁死（示意）";
    headline = `双主箭仅伸至 ${maxAxisReachPct}%，能量憋在画框里出不去`;
    why = "红蓝主冲量箭头都老实缩在安全框以内时，矩形边界就像一道墙把动势挡了回来。敢于让主轴逼近甚至冲破边缘，才能唤起画框之外的开放空间感。";
    next = "直接往外拖动红/蓝大箭的箭锋（或拉高推力），让至少主轴逼近 85% 以上甚至冲破画布边缘。";
  }

  // 原海报 5 条要点实时探针（与单真源完全咬合）
  const probes = [
    {
      id: "extend",
      title: "向外延展",
      body: "元素向四周扩散，增强画面的开放感与呼吸感。",
      dotColor: "red",
      ok: spreadOk,
      badge: collapsed ? `缩团 ${avgSpreadPct}%` : blownOut ? `甩边 ${wallPinCount} 枚` : `扩散 ${avgSpreadPct}%`
    },
    {
      id: "anchor",
      title: "中心锚点",
      body: "明确视觉核心，集中注意力。",
      dotColor: "blue",
      ok: anchorOk,
      badge: anchorLost ? `核小 ${coreDiamPct}%` : anchorBloat ? `巨核 ${coreDiamPct}%` : `稳锚 ${coreDiamPct}%`
    },
    {
      id: "rhythm",
      title: "动感节奏",
      body: "大小、疏密、方向的变化推动视线自然流动。",
      dotColor: "ink",
      ok: !flatRhythm,
      badge: flatRhythm ? `均纹 ${rhythmRatio}×` : `极差 ${rhythmRatio}×`
    },
    {
      id: "layers",
      title: "层次递进",
      body: "由中心到边缘，由强到弱，层次自然过渡。",
      dotColor: "blue",
      ok: !invertedWeight,
      badge: heavyRebelCount > 0 ? `黑块 ${heavyRebelCount} 枚` : invertedWeight ? `倒挂 ${decayRatio}×` : `递减 ${decayRatio}×`
    },
    {
      id: "release",
      title: "释放与扩散",
      body: "打破边界，形成张力与能量的释放感。",
      dotColor: "blue",
      ok: releaseOk,
      badge: axisImbalance ? `偏角 ${axisSplitDeg}°` : cagedAxes ? `缩框 ${maxAxisReachPct}%` : `破边 ${maxAxisReachPct}%`
    }
  ];

  // 原海报底栏 4 枚实心圆徽实时读数
  const badges = [
    {
      id: "outward",
      zh: "向外",
      en: "OUTWARD",
      color: "blue",
      ok: spreadOk,
      metric: collapsed ? `仅 ${avgSpreadPct}%` : blownOut ? `贴壁 ${wallPinCount}` : `${avgSpreadPct}% 外扩`
    },
    {
      id: "release",
      zh: "释放",
      en: "RELEASE",
      color: "red",
      ok: releaseOk,
      metric: cagedAxes ? `框内 ${maxAxisReachPct}%` : axisImbalance ? `偏斜 ${axisSplitDeg}°` : `${maxAxisReachPct}% 破边`
    },
    {
      id: "spread",
      zh: "扩散",
      en: "SPREAD",
      color: "ink",
      ok: !invertedWeight && anchorOk,
      metric: heavyRebelCount > 0 ? `外沉 ${heavyRebelCount} 处` : anchorLost ? `核仅 ${coreDiamPct}%` : `内强 ${decayRatio}×`
    },
    {
      id: "motion",
      zh: "动势",
      en: "MOTION",
      color: "blue",
      ok: !flatRhythm && !axisImbalance,
      metric: flatRhythm ? `均等 ${rhythmRatio}×` : `${rhythmRatio}× 节奏`
    }
  ];

  return {
    scene,
    passedCount,
    isPass: passedCount === 4,
    fault,
    shortTag,
    tierLabel,
    headline,
    why,
    next,
    metrics: {
      avgSpreadPct,
      wallPinCount,
      coreDiamPct,
      heavyRebelCount,
      decayRatio,
      rhythmRatio,
      redReachPct,
      blueReachPct,
      maxAxisReachPct,
      axisSplitDeg
    },
    checks: { anchorOk, spreadOk, hierarchyOk, releaseOk },
    probes,
    badges
  };
}
