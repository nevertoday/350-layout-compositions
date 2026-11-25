// 071 两点透视 · 单真源三维针孔投影与光学诊断模型
// 所有画布（开场制图台、俯视泰勒斯站位条、01–07 节交互图）共用同一套几何方程与判定标尺。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报方屋",
    sub: "单层展亭 · 陶土左墙 × 暖米门面",
    L: 4.8,
    D: 5.5,
    H: 3.3,
    door: { face: "right", s0: 0.27, s1: 0.56, h: 0.62 },
  },
  bookstore: {
    id: "bookstore",
    label: "街角书店",
    sub: "双层转角 · 橱窗雨篷 × 檐口立面",
    L: 5.2,
    D: 6.2,
    H: 4.1,
    door: { face: "right", s0: 0.18, s1: 0.42, h: 0.44 },
  },
  twin: {
    id: "twin",
    label: "双体展馆",
    sub: "主副双盒 · 同一地平线共享双灭点",
    L: 4.2,
    D: 4.8,
    H: 3.4,
    door: { face: "right", s0: 0.30, s1: 0.58, h: 0.58 },
  },
};

export const PRESETS = {
  broken: {
    label: "复原错态",
    vpL: 0.24,
    vpR: 0.73,
    horizon: 0.42,
    vpSplit: -0.11,
  },
  poster: {
    label: "原海报平视解",
    vpL: 0.04,
    vpR: 1.06,
    horizon: 0.42,
    vpSplit: 0,
  },
  bird: {
    label: "俯视展开屋顶",
    vpL: -0.06,
    vpR: 1.18,
    horizon: 0.20,
    vpSplit: 0,
  },
  worm: {
    label: "仰视纪念碑解",
    vpL: 0.08,
    vpR: 1.24,
    horizon: 0.73,
    vpSplit: 0,
  },
  offcanvas: {
    label: "画外远焦舒展",
    vpL: -0.34,
    vpR: 1.48,
    horizon: 0.44,
    vpSplit: 0,
  },
  collapse: {
    label: "试错：单面坍缩",
    vpL: 0.34,
    vpR: 1.72,
    horizon: 0.43,
    vpSplit: 0,
  },
};

export const INITIAL_STATE = {
  scene: "poster",
  vpL: PRESETS.broken.vpL,
  vpR: PRESETS.broken.vpR,
  horizon: PRESETS.broken.horizon,
  vpSplit: PRESETS.broken.vpSplit,
  showRays: true,
  showGrid: true,
  lockHorizon: false,
};

export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const rad2deg = (r) => (r * 180) / Math.PI;
const deg2rad = (d) => (d * Math.PI) / 180;

// 按给定视点中心 u0=0.5 与 (vpL, vpR) 解出精确 90° 泰勒斯半圆焦距 f 与偏角 θ
export function solveOptics(vpL, vpR, u0 = 0.5) {
  const pL = u0 - vpL;
  const pR = vpR - u0;
  const inverted = pL <= 0.05 || pR <= 0.05;
  const safePL = Math.max(0.06, pL);
  const safePR = Math.max(0.06, pR);
  // 泰勒斯半圆直角关系：pL * pR = f^2
  const f = Math.sqrt(safePL * safePR);
  // tan(theta) = pR / f = sqrt(pR / pL)，theta 为左墙与画面夹角（45° = 对称斜角）
  const thetaRad = Math.atan2(Math.sqrt(safePR), Math.sqrt(safePL));
  const thetaDeg = rad2deg(thetaRad);
  const fovFrameDeg = rad2deg(2 * Math.atan(0.5 / f));
  const focalMm = f * 36;
  return { pL, pR, safePL, safePR, f, thetaRad, thetaDeg, fovFrameDeg, focalMm, inverted };
}

// 保持当前焦距 f 不变，按给定转角 thetaDeg 重新算出精确满足 90° 泰勒斯定律的 (vpL, vpR)
export function vpsFromFocalYaw(f, thetaDeg, u0 = 0.5) {
  const rad = deg2rad(clamp(thetaDeg, 12, 78));
  const pL = f / Math.tan(rad);
  const pR = f * Math.tan(rad);
  return {
    vpL: clamp(u0 - pL, -0.9, 0.45),
    vpR: clamp(u0 + pR, 0.55, 1.9),
  };
}

// 投影一个 3D 矩形体块，并在 vpSplit ≠ 0 时将右墙射线真实拧向错位右灭点
export function projectScene(state, aspect = 1.75) {
  const scene = SCENES[state.scene] || SCENES.poster;
  const u0 = 0.5;
  const optics = solveOptics(state.vpL, state.vpR, u0);
  const { f, thetaRad } = optics;
  const effAspect = clamp(aspect, 1.18, 2.05);

  const L = scene.L;
  const D = scene.D;
  const H = scene.H;

  // 定前棱视觉高约占画布 44%，模拟真实建筑摄影推拉变焦（保持主体清晰同时暴露广角/长焦透视压缩差）
  const frontScreenH = 0.43;
  const zc = Math.max(2.6, (f * effAspect * H) / frontScreenH);

  // 本地水平正交基：左墙向 (-cosθ, sinθ)，右墙向 (+sinθ, cosθ)
  const uLx = -Math.cos(thetaRad);
  const uLz = Math.sin(thetaRad);
  const uRx = Math.sin(thetaRad);
  const uRz = Math.cos(thetaRad);

  // 让主体外包轮廓视觉落居中轴附近
  const rawLeftU = (L * uLx) / (zc + L * uLz);
  const rawRightU = (D * uRx) / (zc + D * uRz);
  const xc = -0.5 * (rawLeftU + rawRightU) * zc * 0.84;

  const vH = clamp(state.horizon, 0.14, 0.86);
  const vSplit = clamp(state.vpSplit, -0.24, 0.24);
  const vpLy = vH;
  const vpRy = clamp(vH + vSplit, 0.05, 0.95);

  // 建筑移轴升降（保证竖线严格垂直、地平线升降真实切换俯视/平视/仰视）
  const vBotTarget = 0.77 + (vH - 0.42) * 0.16;
  const yEye = ((vBotTarget - vH) * zc) / (f * effAspect);

  // 基础三维针孔投影
  const baseProj = (x, y, z) => ({
    u: u0 + (f * x) / z,
    v: vH - (f * effAspect * (y - yEye)) / z,
  });

  // 前棱点在画布中的基准 u
  const p0b = baseProj(xc, 0, zc);
  const p0t = baseProj(xc, H, zc);

  // 带右灭点竖向错位剪切的投影函数：对沿右墙深度 dR 的点按射线比例偏移到错位 vpRy
  // 当 vSplit === 0 时，严格等于精确三维针孔投影！
  const projBoxPoint = (dL, y, dR) => {
    const x = xc + dL * uLx + dR * uRx;
    const z = zc + dL * uLz + dR * uRz;
    const pt = baseProj(x, y, z);
    if (Math.abs(vSplit) > 1e-4 && dR > 0) {
      // 同一左墙截面（仅沿右向延伸 dR）对应的起始点
      const refX = xc + dL * uLx;
      const refZ = zc + dL * uLz;
      const refPt = baseProj(refX, y, refZ);
      const denom = state.vpR - refPt.u;
      if (Math.abs(denom) > 0.02) {
        const frac = clamp((pt.u - refPt.u) / denom, -0.4, 0.96);
        pt.v += vSplit * frac;
      }
    }
    return pt;
  };

  // 主体八顶点
  const c0b = projBoxPoint(0, 0, 0);
  const c0t = projBoxPoint(0, H, 0);
  const cLb = projBoxPoint(L, 0, 0);
  const cLt = projBoxPoint(L, H, 0);
  const cRb = projBoxPoint(0, 0, D);
  const cRt = projBoxPoint(0, H, D);
  const cBb = projBoxPoint(L, 0, D);
  const cBt = projBoxPoint(L, H, D);

  // 门洞四角（右墙）
  const dr = scene.door;
  const door = {
    b0: projBoxPoint(0, 0, D * dr.s0),
    b1: projBoxPoint(0, 0, D * dr.s1),
    t1: projBoxPoint(0, H * dr.h, D * dr.s1),
    t0: projBoxPoint(0, H * dr.h, D * dr.s0),
    // 门内进深（朝左墙方向退 0.65m）
    inB0: projBoxPoint(0.65, 0, D * dr.s0),
    inT0: projBoxPoint(0.65, H * dr.h, D * dr.s0),
  };

  // 副体块（双体展馆场景）或二层檐口/橱窗（街角书店场景）
  let extra = null;
  if (state.scene === "twin") {
    // 左侧后方退进一座稍矮的附属展盒，共享同一对消失点
    const sL0 = L + 1.05;
    const sL1 = L + 3.65;
    const sD0 = 0.65;
    const sD1 = 3.55;
    const sH = H * 0.64;
    extra = {
      type: "twin",
      f0b: projBoxPoint(sL0, 0, sD0),
      f0t: projBoxPoint(sL0, sH, sD0),
      fLb: projBoxPoint(sL1, 0, sD0),
      fLt: projBoxPoint(sL1, sH, sD0),
      fRb: projBoxPoint(sL0, 0, sD1),
      fRt: projBoxPoint(sL0, sH, sD1),
      fBb: projBoxPoint(sL1, 0, sD1),
      fBt: projBoxPoint(sL1, sH, sD1),
    };
  } else if (state.scene === "bookstore") {
    // 一层橱窗、挑檐雨篷与二层开窗（全部从同一 projBoxPoint 实算）
    const winL = [
      [0.18, 0.44, 0.56, 0.80],
      [0.54, 0.80, 0.56, 0.80],
    ].map(([a, b, y0, y1]) => [
      projBoxPoint(L * a, H * y0, 0),
      projBoxPoint(L * b, H * y0, 0),
      projBoxPoint(L * b, H * y1, 0),
      projBoxPoint(L * a, H * y1, 0),
    ]);
    const winR = [
      [0.50, 0.84, 0.14, 0.42],
      [0.16, 0.44, 0.56, 0.80],
      [0.54, 0.84, 0.56, 0.80],
    ].map(([a, b, y0, y1]) => [
      projBoxPoint(0, H * y0, D * a),
      projBoxPoint(0, H * y0, D * b),
      projBoxPoint(0, H * y1, D * b),
      projBoxPoint(0, H * y1, D * a),
    ]);
    // 转角雨篷
    const awningH = H * 0.48;
    const awning = {
      l: [
        projBoxPoint(0, awningH, 0),
        projBoxPoint(L * 0.88, awningH, 0),
        projBoxPoint(L * 0.88, awningH - 0.16, -0.55),
        projBoxPoint(0, awningH - 0.16, -0.55),
      ],
      r: [
        projBoxPoint(0, awningH, 0),
        projBoxPoint(0, awningH, D * 0.88),
        projBoxPoint(-0.55, awningH - 0.16, D * 0.88),
        projBoxPoint(-0.55, awningH - 0.16, 0),
      ],
    };
    extra = { type: "bookstore", winL, winR, awning };
  }

  // 地面双色投影（承袭 071 原海报左暖石影 + 右松青长影；所有顶点严控在相机前方防翻转）
  const shadowRight = [
    c0b,
    cRb,
    projBoxPoint(-0.65, 0, D + 2.4),
    projBoxPoint(-0.65, 0, 1.8),
  ];
  const shadowLeft = [
    c0b,
    cLb,
    projBoxPoint(L + 1.8, 0, -0.35),
    projBoxPoint(0.25, 0, -0.35),
  ];

  // 地面双向透视网格（严格向左右灭点延伸，两端保持在相机前方安全深度内，绝不穿到天空）
  const gridLinesL = [];
  const gridLinesR = [];
  const safeNeg = -0.75;
  for (let i = 0; i <= 5; i++) {
    gridLinesL.push([projBoxPoint(safeNeg, 0, i * 1.45), projBoxPoint(L + 4.8, 0, i * 1.45)]);
  }
  for (let j = 0; j <= 5; j++) {
    gridLinesR.push([projBoxPoint(j * 1.45, 0, safeNeg), projBoxPoint(j * 1.45, 0, D + 4.8)]);
  }

  // 真实光学指标计算（全部来自实绘顶点，零写死常量）
  const wL = Math.max(0.001, c0b.u - cLb.u);
  const wR = Math.max(0.001, cRb.u - c0b.u);
  const totalW = wL + wR;
  const leftPct = (wL / totalW) * 100;
  const rightPct = (wR / totalW) * 100;

  // 主体实际跨越的水平视场角（60° 经验自然视锥核验）
  const uMin = Math.min(cLb.u, c0b.u, cRb.u);
  const uMax = Math.max(cLb.u, c0b.u, cRb.u);
  const fovSubjectDeg = rad2deg(
    Math.atan((uMax - u0) / f) - Math.atan((uMin - u0) / f)
  );

  // 画面上实绘的前底转角夹角（按真实宽高比修正）
  const vx1 = (cLb.u - c0b.u) * effAspect;
  const vy1 = cLb.v - c0b.v;
  const vx2 = (cRb.u - c0b.u) * effAspect;
  const vy2 = cRb.v - c0b.v;
  const len1 = Math.hypot(vx1, vy1) || 1;
  const len2 = Math.hypot(vx2, vy2) || 1;
  const baseCornerAngleDeg = rad2deg(
    Math.acos(clamp((vx1 * vx2 + vy1 * vy2) / (len1 * len2), -1, 1))
  );

  // 前顶转角夹角（同样反映广角尖角畸变）
  const tx1 = (cLt.u - c0t.u) * effAspect;
  const ty1 = cLt.v - c0t.v;
  const tx2 = (cRt.u - c0t.u) * effAspect;
  const ty2 = cRt.v - c0t.v;
  const tlen1 = Math.hypot(tx1, ty1) || 1;
  const tlen2 = Math.hypot(tx2, ty2) || 1;
  const topCornerAngleDeg = rad2deg(
    Math.acos(clamp((tx1 * tx2 + ty1 * ty2) / (tlen1 * tlen2), -1, 1))
  );

  // 是否看得见屋顶 / 视线高度挡位
  const roofVisible = vH < Math.min(c0t.v, cLt.v, cRt.v) - 0.01;
  const lowView = vH > c0b.v - 0.14;
  const eyeLevelMode = roofVisible ? "俯视屋顶" : lowView ? "低仰视" : "人眼平视";

  // 地平线压棱贴齐检测（地平线几乎压在屋顶角或底角水平线上）
  const tangentRoof = Math.abs(vH - c0t.v) < 0.022 && Math.abs(vSplit) < 0.015;
  const tangentBase = Math.abs(vH - c0b.v) < 0.022 && Math.abs(vSplit) < 0.015;

  // 左/右灭点是否落在画幅内或画外
  const vpLInFrame = state.vpL >= 0 && state.vpL <= 1;
  const vpRInFrame = state.vpR >= 0 && state.vpR <= 1;
  const vpSpan = state.vpR - state.vpL;

  // 左右水平汇聚斜率角（实绘顶棱角度，用于标题双色斜线联动与方向读数）
  const slopeLeftDeg = rad2deg(Math.atan2(c0t.v - cLt.v, (c0t.u - cLt.u) * effAspect));
  const slopeRightDeg = rad2deg(Math.atan2(c0t.v - cRt.v, (cRt.u - c0t.u) * effAspect));

  const metrics = {
    ...optics,
    vpL: state.vpL,
    vpR: state.vpR,
    vpLy,
    vpRy,
    vpSpan,
    vpSplitPct: Math.round(vSplit * 100),
    absSplitPct: Math.abs(Math.round(vSplit * 100)),
    horizonPct: Math.round(vH * 100),
    yEyeMeters: Number(yEye.toFixed(1)),
    leftPct: Math.round(leftPct),
    rightPct: Math.round(rightPct),
    fovSubjectDeg: Math.round(fovSubjectDeg),
    fovFrameDeg: Math.round(optics.fovFrameDeg),
    baseCornerAngleDeg: Math.round(baseCornerAngleDeg),
    topCornerAngleDeg: Math.round(topCornerAngleDeg),
    minCornerAngleDeg: Math.round(Math.min(baseCornerAngleDeg, topCornerAngleDeg)),
    roofVisible,
    lowView,
    eyeLevelMode,
    tangentRoof,
    tangentBase,
    vpLInFrame,
    vpRInFrame,
    slopeLeftDeg,
    slopeRightDeg,
    uMin,
    uMax,
  };

  const diagnosis = diagnose(metrics);

  return {
    scene,
    effAspect,
    vpL: { u: state.vpL, v: vpLy },
    vpR: { u: state.vpR, v: vpRy },
    horizon: vH,
    box: { c0b, c0t, cLb, cLt, cRb, cRt, cBb, cBt },
    door,
    extra,
    shadowLeft,
    shadowRight,
    gridLinesL,
    gridLinesR,
    metrics,
    diagnosis,
  };
}

// 6 类光学诊断：完全依据实绘几何指标，支持多组正当解，任何时候拖坏都立即指明错因与视觉后果
export function diagnose(m) {
  const issues = [];

  // 1. 灭点越过前棱导致空间反转
  if (m.inverted || m.vpL >= m.uMin + 0.02 || m.vpR <= m.uMax - 0.02) {
    issues.push({
      id: "inverted",
      severity: 5,
      badge: "错态 · 灭点越界穿墙",
      headline: "消失点被拖进建筑轮廓内部，墙面发生反向穿插",
      body: "消失点代表水平平行线在无穷远处的交点，必须落在物体投影轮廓之外。现在灭点越过了转角，墙面射线被迫掉头，立体结构立刻翻面穿帮。",
      hint: "把画布上的青色左灭点往左拉、或把橘色右灭点往右拉，直到两个灭点都退到建筑外侧。",
      pillar: "vp",
    });
  }

  // 2. 地平线错位（左右灭点不同高）
  if (m.absSplitPct >= 2) {
    const dir = m.vpSplitPct < 0 ? "高出" : "压低";
    issues.push({
      id: "split",
      severity: 4,
      badge: `错态 · 视平错位 ${m.absSplitPct}%`,
      headline: `右消失点比左消失点${dir}了 ${m.absSplitPct}%，地平线被撕成两段`,
      body: "只要建筑立在同一块水平地面上，无论朝哪个方向转，它的两组水平消失点都必须落死在同一条水平视平线上。现在右灭点飘离视平线，奶油右墙和门洞立刻向上拧歪，像地震扭曲的盒体。",
      hint: "直接上下拖动橘色「右消失点」，把它压回深青地平虚线上（靠近会自动轻吸对齐）。",
      pillar: "horizon",
    });
  }

  // 3. 双灭点过近 · 超出 60° 自然视锥（尖角爆角畸变）
  // 判断依据：有效焦距 f < 0.39（相当于约 14mm 以下极端超广角，或主体跨越视场 ≥ 48°、画布视场 > 103°）
  if (m.f < 0.40 || m.fovSubjectDeg >= 48) {
    issues.push({
      id: "pinched",
      severity: 3,
      badge: `错态 · 双点过近 ${m.fovFrameDeg}°`,
      headline: `双消失点挤在画内太近（间距 ${Math.round(m.vpSpan * 100)}%），前转角被捏成尖嘴`,
      body: `按 90° 泰勒斯半圆关系，双灭点间距越窄，观者就必须把鼻子贴得越近（当前等效 ${Math.round(m.focalMm)}mm 超广角，前转角夹角已被压锐至 ${m.minCornerAngleDeg}°）。建筑物失去方正建筑感，像一艘急冲过来的尖头船。`,
      hint: "把左、右消失点沿地平线往两侧拉开（甚至拉出画框边缘），看下方俯视站位条里 60° 视锥由红转青。",
      pillar: "vp",
    });
  }

  // 4. 单面坍缩 · 退化回一点透视
  const minFace = Math.min(m.leftPct, m.rightPct);
  if (minFace < 17) {
    const thinSide = m.leftPct < m.rightPct ? "左侧陶土墙" : "右侧奶油墙";
    issues.push({
      id: "collapse",
      severity: 2,
      badge: `偏弱 · 单面仅占 ${minFace}%`,
      headline: `${thinSide}被压窄到 ${minFace}%，画面几乎退回一点透视`,
      body: "当一面墙几乎正对画框、另一面缩成窄条时，远处那个灭点甩向无穷远，两点透视最珍贵的双面转折与体积对话也就跟着熄火了——那其实是一点透视的主场。",
      hint: "横向拖动建筑前棱（或把偏远一侧的灭点略微收回），让较窄那面墙舒展到 22% 以上。",
      pillar: "direction",
    });
  }

  // 5. 双面 50:50 死均分（仅当已不再爆角或作为次要提示）
  if (Math.abs(m.leftPct - 50) <= 3 && m.f >= 0.40) {
    issues.push({
      id: "equal",
      severity: 1.5,
      badge: `欠节奏 · 左右 ${m.leftPct}:${m.rightPct}`,
      headline: `左右两面墙几乎 ${m.leftPct}:${m.rightPct} 对半劈开，画面呆板平权`,
      body: "两点透视在光学上允许 45° 对称，但在构图上最容易显死板：前棱像一把竖刀把画面均切两半，左右两面等宽抢戏，观众不知道先读门面还是先读侧墙。",
      hint: "横向轻拖中央前棱，把两面宽窄错开到类似 38:62 或 30:70 的主次比例。",
      pillar: "volume",
    });
  }

  // 6. 地平线贴棱切齐
  if (m.tangentRoof || m.tangentBase) {
    const where = m.tangentRoof ? "屋脊顶棱" : "地基底棱";
    issues.push({
      id: "tangent",
      severity: 1.2,
      badge: "欠层次 · 地平线压棱",
      headline: `地平线刚好压在${where}上，两侧转折被拉成一条死直横线`,
      body: `任何与地平线重合的水平边都会失去倾斜角、变成笔直横线。此时${where}的转角戏剧感被彻底抹平，上下起伏一下子消失。`,
      hint: "上下拖动深青地平线，错开屋顶或地基边缘，重新露出清晰的斜线汇聚。",
      pillar: "horizon",
    });
  }

  // 汇总四枚原海报核心要点的实时状态
  const pillarStatus = {
    horizon:
      m.absSplitPct >= 2
        ? { ok: false, state: "err", tag: `错位 ${m.absSplitPct}%` }
        : m.tangentRoof || m.tangentBase
          ? { ok: false, state: "warn", tag: "贴棱切齐" }
          : { ok: true, state: "ok", tag: `${m.eyeLevelMode} ${m.horizonPct}%` },
    vp:
      m.inverted || m.vpL >= m.uMin + 0.02 || m.vpR <= m.uMax - 0.02
        ? { ok: false, state: "err", tag: "越界翻转" }
        : m.f < 0.40 || m.fovSubjectDeg >= 48
          ? { ok: false, state: "err", tag: `过近 ${Math.round(m.focalMm)}mm` }
          : {
              ok: true,
              state: "ok",
              tag: !m.vpLInFrame || !m.vpRInFrame ? `画外舒展 ${Math.round(m.focalMm)}mm` : `自然 ${Math.round(m.focalMm)}mm`,
            },
    volume:
      minFace < 17
        ? { ok: false, state: "err", tag: `坍缩 ${m.leftPct}:${m.rightPct}` }
        : Math.abs(m.leftPct - 50) <= 3
          ? { ok: false, state: "warn", tag: `均分 ${m.leftPct}:${m.rightPct}` }
          : { ok: true, state: "ok", tag: `主次 ${m.leftPct}:${m.rightPct}` },
    direction:
      m.absSplitPct >= 2 || m.inverted
        ? { ok: false, state: "err", tag: "射线失序" }
        : minFace < 17
          ? { ok: false, state: "warn", tag: "近单点" }
          : { ok: true, state: "ok", tag: `转角 ${Math.round(m.thetaDeg)}°` },
  };

  if (issues.length === 0) {
    let solutionName = "经典人眼平视解";
    let solutionBody = `左右灭点严密落于同一地平线（高度 ${m.horizonPct}%），等效 ${Math.round(m.focalMm)}mm 镜头把前转角稳稳收在自然视锥内，陶土与暖米双面呈 ${m.leftPct}:${m.rightPct} 主次节奏，立体感清晰而克制。`;
    if (m.roofVisible) {
      solutionName = "高视平俯视解";
      solutionBody = `地平线抬高至 ${m.horizonPct}% 越过屋顶，整个屋面完整摊开，观众像站在对面高楼俯瞰街角；双灭点同线且跨度舒展（${Math.round(m.focalMm)}mm），四面体量一眼尽收。`;
    } else if (m.lowView) {
      solutionName = "低视平仰视解";
      solutionBody = `地平线压低至 ${m.horizonPct}% 贴近地面，屋檐凌空昂起带来纪念碑气势，但所有竖线依然垂直不歪斜（区别于三点透视），左右 ${m.leftPct}:${m.rightPct} 层次分明。`;
    } else if (!m.vpLInFrame && !m.vpRInFrame) {
      solutionName = "画外远焦舒展解";
      solutionBody = `双消失点双双退到画框之外（等效 ${Math.round(m.focalMm)}mm 建筑中焦），透视坡度沉着克制、毫无广角尖角畸变——这正是建筑渲染与商品插画最常用的实战格局。`;
    }

    return {
      ok: true,
      code: "ok",
      badge: `光学成立 · ${solutionName}`,
      headline: `${solutionName}：双灭点同线、视锥自然、主次分明`,
      body: solutionBody,
      hint: "你可以继续上下拖地平线切换俯视/仰视，或故意把右灭点拖离地平线、把双灭点捏近，亲手验证画崩的边界。",
      pillarStatus,
      issues: [],
    };
  }

  issues.sort((a, b) => b.severity - a.severity);
  const top = issues[0];
  return {
    ok: false,
    code: top.id,
    badge: top.badge,
    headline: top.headline,
    body: top.body,
    hint: top.hint,
    pillarStatus,
    issues,
  };
}

// 第 07 节：四张单变量盲测小练习（全部使用同一 projectScene 实绘，标签中性无剧透）
export const QUIZ_ITEMS = [
  {
    key: "A",
    label: "方案 A",
    caption: "草图 01",
    state: { scene: "poster", vpL: 0.25, vpR: 0.78, horizon: 0.42, vpSplit: 0 },
    correct: false,
    reason: "双消失点虽然落在同一条地平线上，但间距被硬塞在画框内部过近（等效约 10mm 极端广角），前底转角被捏成锐利尖嘴，建筑体块产生明显的广角爆角畸变。",
  },
  {
    key: "B",
    label: "方案 B",
    caption: "草图 02",
    state: { scene: "poster", vpL: 0.04, vpR: 1.08, horizon: 0.43, vpSplit: -0.095 },
    correct: false,
    reason: "双灭点间距看似舒展，但右消失点暗中比左消失点高出了约 10%，破坏了“同一水平面的所有消失点共地平线”规则——细看打开的射线就会发现右墙屋檐和门框都在向上拧翘。",
  },
  {
    key: "C",
    label: "方案 C",
    caption: "草图 03",
    state: { scene: "poster", vpL: 0.03, vpR: 1.14, horizon: 0.42, vpSplit: 0 },
    correct: true,
    reason: "正确答案。左右消失点严密压在同一条地平线上，右灭点自然延出画外使视场保持在舒适视锥内，陶土与奶油两面呈约 38:62 的主次节奏，所有竖线笔直垂直，空间沉着真实。",
  },
  {
    key: "D",
    label: "方案 D",
    caption: "草图 04",
    state: { scene: "poster", vpL: 0.02, vpR: 0.98, horizon: 0.305, vpSplit: 0 },
    correct: false,
    reason: "灭点虽同线且无严重广角爆角，但两处结构同时拖累了画面：一是左右灭点近乎对称使两面墙 48:52 平权僵硬，二是地平线正好紧切屋顶前棱，把屋檐的透视折角压成了一条死直横线。",
  },
];
