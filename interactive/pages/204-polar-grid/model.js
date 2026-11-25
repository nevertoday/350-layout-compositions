// 204 极坐标网格 · 单真源几何模型与诊断引擎
// 英雄舞台画布、直角展开条、四栏核心逻辑状态与坐标公式全部从本模块同源计算。

export const REF_RADIUS_PX = 176; // 标准化几何基准半径（用于换算内环弦宽与环距）

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报测绘",
    en: "POSTER SURVEY",
    encoding: "sectors",
    unit: "单位",
    maxVal: 100,
    comparePair: [0, 3], // 84 vs 42 -> 严格 2.0×，线性半径画成 4.0× 面积
    defaultProbe: { rNorm: 0.84, thetaDeg: 37 },
    desc: "1:1 承袭 204 原海报的 30° 扇区与 P(r, θ) 定位，对比两处核心扇区的真实数值与视觉面积。",
    sectors: [
      { id: "S1", label: "主扇区 A", angleDeg: 30, value: 84 },
      { id: "S2", label: "扇区 B", angleDeg: 90, value: 58 },
      { id: "S3", label: "扇区 C", angleDeg: 150, value: 32 },
      { id: "S4", label: "对照扇区 D", angleDeg: 210, value: 42 },
      { id: "S5", label: "扇区 E", angleDeg: 270, value: 66 },
      { id: "S6", label: "扇区 F", angleDeg: 330, value: 48 },
    ],
  },
  wind: {
    id: "wind",
    label: "风玫瑰气象",
    en: "WIND ROSE",
    encoding: "sectors",
    unit: "次/季",
    maxVal: 100,
    comparePair: [0, 3], // 90 vs 30 -> 严格 3.0×，线性半径画成 9.0× 面积
    defaultProbe: { rNorm: 0.9, thetaDeg: 135 },
    desc: "气象站按方位角统计季风频次：西北风 90 次、东南风 30 次（3.0×），面积必须忠实于频次比。",
    sectors: [
      { id: "NW", label: "西北风", angleDeg: 135, value: 90 },
      { id: "W", label: "偏西风", angleDeg: 180, value: 64 },
      { id: "N", label: "偏北风", angleDeg: 90, value: 52 },
      { id: "SE", label: "东南风", angleDeg: 315, value: 30 },
      { id: "E", label: "偏东风", angleDeg: 0, value: 40 },
      { id: "SW", label: "西南风", angleDeg: 225, value: 46 },
    ],
  },
  radar: {
    id: "radar",
    label: "雷达航迹",
    en: "RADAR PPI",
    encoding: "points",
    unit: "km",
    maxVal: 250,
    comparePair: [0, 3], // 200km vs 100km -> 2.0× 真实距离，点位测距必须线性 r ∝ v
    defaultProbe: { rNorm: 0.8, thetaDeg: 38 },
    desc: "平面位置显示器（PPI）以点位回波标示目标方位与直线航距：点位不填扇区面积，距离标尺必须线性。",
    sectors: [
      { id: "T1", label: "航迹 01", angleDeg: 38, value: 200 },
      { id: "T2", label: "航迹 02", angleDeg: 112, value: 145 },
      { id: "T3", label: "航迹 03", angleDeg: 168, value: 78 },
      { id: "T4", label: "航迹 04", angleDeg: 224, value: 100 },
      { id: "T5", label: "航迹 05", angleDeg: 295, value: 175 },
      { id: "T6", label: "航迹 06", angleDeg: 342, value: 120 },
    ],
  },
};

export const SCALE_MODES = {
  linear: { id: "linear", label: "线性半径 r ∝ v", formula: "r = R · (v / v_max)" },
  sqrt: { id: "sqrt", label: "面积守恒 r ∝ √v", formula: "r = R · √(v / v_max)" },
  truncated: { id: "truncated", label: "截断底环 r₀=36%", formula: "r = 0.36R + 0.64R · (v / v_max)" },
};

export const DIVISION_OPTIONS = [5, 7, 8, 12, 18, 24];
export const RING_OPTIONS = [2, 4, 5, 6, 10];

export function normDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export function angularDist(a, b) {
  const d = Math.abs(normDeg(a) - normDeg(b));
  return Math.min(d, 360 - d);
}

export function createBrokenState(themeId = "poster") {
  const t = THEMES[themeId] || THEMES.poster;
  return {
    theme: t.id,
    zeroAngle: 17, // 错态 1：极轴歪斜 +17°
    divisions: 7, // 错态 2：7 路非正交（51.4°）
    rings: 10, // 错态 3：10 环过密
    scaleMode: t.encoding === "sectors" ? "linear" : "truncated", // 错态 4：编码与半径律错配
    probe: { ...t.defaultProbe },
    selectedIndex: 0,
    layers: { radius: true, angle: true, circles: true, sector: true },
  };
}

export function createPresetState(presetId, currentTheme = "poster") {
  const base = createBrokenState(currentTheme);
  if (presetId === "poster") {
    return {
      ...base,
      theme: "poster",
      zeroAngle: 0,
      divisions: 12,
      rings: 5,
      scaleMode: "sqrt",
      probe: { rNorm: 0.84, thetaDeg: 37 },
      layers: { radius: true, angle: true, circles: true, sector: true },
    };
  }
  if (presetId === "compass") {
    return {
      ...base,
      theme: "wind",
      zeroAngle: 90,
      divisions: 8,
      rings: 4,
      scaleMode: "sqrt",
      probe: { rNorm: 0.9, thetaDeg: 135 },
      layers: { radius: true, angle: true, circles: true, sector: true },
    };
  }
  if (presetId === "radar") {
    return {
      ...base,
      theme: "radar",
      zeroAngle: 90,
      divisions: 12,
      rings: 5,
      scaleMode: "linear",
      probe: { rNorm: 0.8, thetaDeg: 38 },
      layers: { radius: true, angle: true, circles: true, sector: true },
    };
  }
  if (presetId === "crowded") {
    return {
      ...base,
      zeroAngle: 0,
      divisions: 24,
      rings: 10,
      scaleMode: "linear",
      layers: { radius: true, angle: true, circles: true, sector: true },
    };
  }
  return createBrokenState(currentTheme);
}

// 计算某一数据值在当前映射律下的归一化半径 [0..1]
export function mapRadiusNorm(value, maxVal, scaleMode) {
  const ratio = Math.max(0, Math.min(1, value / maxVal));
  if (scaleMode === "sqrt") return Math.sqrt(ratio);
  if (scaleMode === "truncated") return 0.36 + 0.64 * ratio;
  return ratio; // linear
}

// 单真源几何求解：把当前状态直接算成每个扇区/点位的实绘半径、像素面积、弦宽、环距与四维判定
export function evaluatePolar(state) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const zero = normDeg(state.zeroAngle);
  const N = state.divisions;
  const K = state.rings;
  const stepDeg = 360 / N;
  const stepRad = (Math.PI * 2) / N;
  const rInnerBase = state.scaleMode === "truncated" ? 0.36 : 0;

  // 1. 计算每个扇区 / 目标的真实绘制几何
  const items = theme.sectors.map((s, idx) => {
    const rNorm = mapRadiusNorm(s.value, theme.maxVal, state.scaleMode);
    const rPx = rNorm * REF_RADIUS_PX;
    const r0Px = rInnerBase * REF_RADIUS_PX;
    // 扇区真实绘制面积（像素平方）：A = 0.5 * (r^2 - r0^2) * Δθ
    const drawnAreaPx2 = 0.5 * Math.max(0, rPx * rPx - r0Px * r0Px) * stepRad;
    // 世界绘制角度（加上极轴偏移 zero）
    const worldAngleDeg = normDeg(s.angleDeg + zero);
    const rad = (worldAngleDeg * Math.PI) / 180;
    const rUnits = rNorm * K;
    return {
      ...s,
      index: idx,
      rNorm,
      rPx,
      r0Px,
      rUnits,
      drawnAreaPx2,
      worldAngleDeg,
      xUnit: rUnits * Math.cos(rad),
      yUnit: rUnits * Math.sin(rad),
    };
  });

  // 2. 对比主对照对 [iA, iB] 的真实数据比 vs 实际渲染面积比 / 半径比
  const [iA, iB] = theme.comparePair;
  const itemA = items[iA];
  const itemB = items[iB];
  const trueRatio = itemA.value / itemB.value;
  const drawnRadiusRatio = itemA.rNorm / Math.max(0.001, itemB.rNorm);
  const drawnAreaRatio = itemA.drawnAreaPx2 / Math.max(0.001, itemB.drawnAreaPx2);

  // 失真度（单真源实算）
  let scaleDistortionPct = 0;
  if (theme.encoding === "sectors") {
    scaleDistortionPct = ((drawnAreaRatio - trueRatio) / trueRatio) * 100;
  } else {
    // 点位模式衡量的是外推/平方根导致的距离比偏差
    scaleDistortionPct = ((drawnRadiusRatio - trueRatio) / trueRatio) * 100;
  }

  // 3. 探针点 P(r, θ) 的实时极坐标 ↔ 直角坐标换算
  const pRNorm = Math.max(0.08, Math.min(1, state.probe.rNorm));
  const pLocalDeg = normDeg(state.probe.thetaDeg); // 相对极轴 0° 的角度 θ
  const pWorldDeg = normDeg(pLocalDeg + zero);
  const pLocalRad = (pLocalDeg * Math.PI) / 180;
  const pWorldRad = (pWorldDeg * Math.PI) / 180;
  const pRUnits = pRNorm * K; // 以环数为标尺的 r
  const pX = pRUnits * Math.cos(pLocalRad);
  const pY = pRUnits * Math.sin(pLocalRad);
  const pCheckR = Math.hypot(pX, pY);
  const pCheckDeg = normDeg((Math.atan2(pY, pX) * 180) / Math.PI);

  // 4. 关键几何度量：首环弧宽（奇点拥挤度）与同心环距
  const ringGapPx = REF_RADIUS_PX / K;
  const firstRingRadiusPx = Math.max(ringGapPx, rInnerBase * REF_RADIUS_PX);
  const innerChordPx = 2 * firstRingRadiusPx * Math.sin(Math.PI / N);
  const outerRingAreaRatio = (K * K - (K - 1) * (K - 1)) / 1; // 最外环面积 / 最内环面积 = 2K - 1

  // 5. 四维硬判定（全部由实绘几何导出，彼此独立）
  const distEast = angularDist(zero, 0);
  const distNorth = angularDist(zero, 90);
  const distWest = angularDist(zero, 180);
  const distSouth = angularDist(zero, 270);
  const axisEastOk = distEast <= 2;
  const axisNorthOk = distNorth <= 2;
  const axisOk = axisEastOk || axisNorthOk;
  const axisInverted = !axisOk && (distWest <= 4 || distSouth <= 4);
  const axisConvention = axisEastOk
    ? "数学东向 0°"
    : axisNorthOk
      ? "导航北向 90°"
      : axisInverted
        ? `倒置 ${Math.round(zero)}°`
        : `歪斜 ${Math.round(zero)}°`;

  const hasOrthogonal = N % 4 === 0;
  const innerCrowded = innerChordPx < 15.5 || N >= 18;
  const angleOk = hasOrthogonal && !innerCrowded && N >= 8 && N <= 12;

  const ringsDense = K >= 8;
  const ringsSparse = K <= 2;
  const ringsOk = K >= 4 && K <= 6;

  let scaleOk = false;
  if (state.scaleMode === "truncated") {
    scaleOk = false;
  } else if (theme.encoding === "sectors") {
    scaleOk = Math.abs(scaleDistortionPct) <= 3; // 仅 sqrt 面积守恒满足 0%
  } else {
    scaleOk = Math.abs(scaleDistortionPct) <= 3; // 仅 linear 测距满足 0%
  }

  const passedCount = [axisOk, angleOk, ringsOk, scaleOk].filter(Boolean).length;
  const missingLayers = Object.entries(state.layers)
    .filter(([, on]) => !on)
    .map(([k]) => ({ radius: "半径", angle: "角度", circles: "同心圆", sector: "扇区" }[k]));

  // 6. 单真源诊断（10 类错态 + 多组合法解）
  let statusCode = "ok";
  let badgeText = "4/4 已校准";
  let headline = "";
  let body = "";
  let nextHint = "";

  if (!scaleOk && state.scaleMode === "truncated") {
    statusCode = "truncated_origin";
    badgeText = `${passedCount}/4 · 基准悬空`;
    headline = `圆心起算被切掉 36%，违反「以圆心为基准」`;
    body = `原海报第一条逻辑是「所有测量从中心出发」。现在内空基线悬在 0.36R 处，${itemA.label}（${itemA.value}${theme.unit}）与 ${itemB.label}（${itemB.value}${theme.unit}）真实差 ${trueRatio.toFixed(1)}×，但画出的${theme.encoding === "sectors" ? `扇区面积比被扭成 ${drawnAreaRatio.toFixed(2)}×` : `半径比被压扁成 ${drawnRadiusRatio.toFixed(2)}×`}。`;
    nextHint = theme.encoding === "sectors"
      ? `把「半径映射」切回「面积守恒 r ∝ √v」，让测量重新锚回圆心原点。`
      : `雷达回波以圆心为本机位置，把「半径映射」切回「线性半径 r ∝ v」。`;
  } else if (!scaleOk && theme.encoding === "sectors" && state.scaleMode === "linear") {
    statusCode = "area_squared";
    badgeText = `${passedCount}/4 · 面积夸大`;
    headline = `线性半径把 ${trueRatio.toFixed(1)}× 数值画成了 ${drawnAreaRatio.toFixed(1)}× 面积（+${Math.round(scaleDistortionPct)}%）`;
    body = `填色扇区面积公式是 A = ½r²Δθ。${itemA.label}（${itemA.value}${theme.unit}）数值是 ${itemB.label}（${itemB.value}${theme.unit}）的 ${trueRatio.toFixed(1)} 倍，若直接按线性半径绘制，视觉色块面积会按平方暴涨到 ${drawnAreaRatio.toFixed(1)} 倍，严重误导读数。`;
    nextHint = `点击下方「面积守恒 r ∝ √v」（南丁格尔法），让色块面积与真实数据严格成正比。`;
  } else if (!scaleOk && theme.encoding === "points" && state.scaleMode === "sqrt") {
    statusCode = "point_sqrt_warp";
    badgeText = `${passedCount}/4 · 测距压扁`;
    headline = `点位测距误用平方根，外圈航距被压缩 ${Math.abs(Math.round(scaleDistortionPct))}%`;
    body = `雷达航迹用圆点表达离圆心的直线距离，不铺填扇区面积。${itemA.label}（${itemA.value} km）本是 ${itemB.label}（${itemB.value} km）的 ${trueRatio.toFixed(1)} 倍远，套用 √v 后画布距离只剩 ${drawnRadiusRatio.toFixed(2)} 倍，外圈目标挤在一起。`;
    nextHint = `点位测距不存在面积平方放大，把「半径映射」切回「线性半径 r ∝ v」。`;
  } else if (!axisOk && axisInverted) {
    statusCode = "axis_inverted";
    badgeText = `${passedCount}/4 · 基准倒置`;
    headline = `零度极轴倒置在 ${Math.round(zero)}°，读图习惯反了`;
    body = `虽然主轴落在了水平/竖直线上，但 0° 指向了西侧或正南，与数学东向 0°（原海报标准）和导航正北 0° 两种通行约定都相反，读者每次查方位都要在心里翻一次方向。`;
    nextHint = `在画布中央左右横拖（或微调极轴角滑杆），把 0° 基准对准 0° 东向或 90° 正北。`;
  } else if (!axisOk) {
    statusCode = "axis_tilted";
    badgeText = `${passedCount}/4 · 极轴歪斜`;
    headline = `极轴偏转了 ${Math.round(zero)}°，正交十字失去水平参照`;
    body = `极坐标靠 0°/90°/180°/270° 四条主轴帮人眼建立方向锚点。现在整张圆盘斜了 ${Math.round(zero)}°，原本该笔直朝上或朝右的方位线全部歪斜，估算角度明显吃力。`;
    nextHint = `在圆盘空白区左右横拖，把极轴 0° 对准正东（0°）或正北（90°）±2° 以内。`;
  } else if (!angleOk && innerCrowded) {
    statusCode = "angle_crowded";
    badgeText = `${passedCount}/4 · 奇点挤死`;
    headline = `${N} 路射线在圆心挤成蛛网（首环弦宽仅 ${innerChordPx.toFixed(0)}px）`;
    body = `所有角度线都会汇聚到圆心这一处几何奇点。切到 ${N} 路（每份 ${stepDeg.toFixed(1)}°）后，第一圈内环弧宽缩到 ${innerChordPx.toFixed(0)}px，小值扇区与刻度几乎糊成一团。`;
    nextHint = `把「角度分割」减到 8 路（45°）或 12 路（30° 原海报标准），兼顾方位精度与中心留白。`;
  } else if (!angleOk && !hasOrthogonal) {
    statusCode = "angle_non_ortho";
    badgeText = `${passedCount}/4 · 非正交分`;
    headline = `${N} 路分割（每份 ${stepDeg.toFixed(1)}°）落不齐正交十字主轴`;
    body = `360° 除以 ${N} 不是 90° 的约数，射线全部错开了 90°、180°、270° 三条基本方位线。读者在象限交界处找不到对齐基准，扇区也难以按四象限归类。`;
    nextHint = `把「角度分割」改到能整除 90° 的 8 路（45°）或 12 路（30°）。`;
  } else if (!ringsOk && ringsDense) {
    statusCode = "rings_dense";
    badgeText = `${passedCount}/4 · 环阶过密`;
    headline = `${K} 道同心环把环距压到 ${ringGapPx.toFixed(0)}px，层级糊成一片`;
    body = `同心圆用来表达由内向外的递进层级。${K} 道环线之间只剩 ${ringGapPx.toFixed(0)}px，眼睛得逐圈硬数才知道目标落在第几层，反而削弱了远近对比。`;
    nextHint = `把「同心环数」收回到 4、5（原海报）或 6 环，让近/中/外层级一眼可读。`;
  } else if (!ringsOk && ringsSparse) {
    statusCode = "rings_sparse";
    badgeText = `${passedCount}/4 · 层级过粗`;
    headline = `只剩 ${K} 道同心环，近、中、外层级全塌在了一起`;
    body = `环数太少时，大部分目标点或扇区末端都悬在空档里找不到半径参照，半径刻度退化成了大致的「里面/外面」。`;
    nextHint = `把「同心环数」加到 4–6 环，重建清晰的同心递进标尺。`;
  } else {
    statusCode = missingLayers.length ? "layers_blind" : "ok";
    badgeText = missingLayers.length ? "4/4 · 缺参考层" : "4/4 校准完成";
    const solName =
      axisEastOk && N === 12 && K === 5 && theme.encoding === "sectors"
        ? "原海报标准解（东向 0° · 12 路 30° · 5 环 · 面积守恒）"
        : axisNorthOk && N === 8 && theme.encoding === "sectors"
          ? "八方位气象解（北向 90° · 8 路 45° · 面积守恒）"
          : theme.encoding === "points"
            ? `雷达等距解（${axisConvention} · ${N} 路 · ${K} 环 · 线性测距）`
            : `多组合法解之一（${axisConvention} · ${N} 路 · ${K} 环）`;
    headline = missingLayers.length
      ? `${solName}（已隐藏：${missingLayers.join("、")}）`
      : `结构成立：${solName}`;
    body =
      theme.encoding === "sectors"
        ? `四条准则全部吻合：极轴对齐 ${axisConvention}、${N} 路射线守住正交十字且首环弦宽 ${innerChordPx.toFixed(0)}px 舒朗、${K} 道环距 ${ringGapPx.toFixed(0)}px 易读，填色扇区面积比 ${drawnAreaRatio.toFixed(2)}× 与真实数值比 ${trueRatio.toFixed(2)}× 零误差。`
        : `雷达点位标定全部吻合：极轴对齐 ${axisConvention}、${N} 路方位角正交、${K} 道等距测距环每圈 ${(theme.maxVal / K).toFixed(0)} km，线性半径保持 ${drawnRadiusRatio.toFixed(2)}× 真实航距比。`;
    nextHint = missingLayers.length
      ? `上方图例隐藏了「${missingLayers.join("、")}」层，可随时点回开启对照。也可切到「雷达航迹」试试同一套映射律为何会反转。`
      : `拖动圆盘上的品红点 P(r, θ) 观察底栏坐标换算公式，或切到「雷达航迹」看点位测距为何反而需要线性半径。`;
  }

  return {
    theme,
    zero,
    N,
    K,
    stepDeg,
    items,
    selectedItem: items[state.selectedIndex] || items[0],
    compare: { itemA, itemB, trueRatio, drawnRadiusRatio, drawnAreaRatio, scaleDistortionPct },
    probe: {
      rNorm: pRNorm,
      localDeg: pLocalDeg,
      worldDeg: pWorldDeg,
      rUnits: pRUnits,
      x: pX,
      y: pY,
      checkR: pCheckR,
      checkDeg: pCheckDeg,
    },
    metrics: {
      ringGapPx,
      innerChordPx,
      outerRingAreaRatio,
    },
    checks: {
      axisOk,
      angleOk,
      ringsOk,
      scaleOk,
      passedCount,
      axisConvention,
      missingLayers,
    },
    diagnosis: {
      statusCode,
      badgeText,
      headline,
      body,
      nextHint,
    },
  };
}

// 02 节：面积陷阱实验室纯计算
export function evaluateAreaLab(valueRatio, mode) {
  const vA = valueRatio;
  const vB = 1;
  const rA = mode === "sqrt" ? Math.sqrt(vA / 4) : vA / 4;
  const rB = mode === "sqrt" ? Math.sqrt(vB / 4) : vB / 4;
  const radiusRatio = rA / rB;
  const areaRatio = (rA * rA) / (rB * rB);
  const errorPct = ((areaRatio - vA) / vA) * 100;
  return {
    vA,
    vB,
    rA,
    rB,
    radiusRatio,
    areaRatio,
    errorPct,
  };
}

// 03 节：直角 ↔ 极坐标精确圆弧卷绕计算 (u ∈ [0,1] 沿角, v ∈ [0,1] 沿半径, morph ∈ [0,1])
export function morphPoint(u, v, morph, cx, cy, R, rectW, rectH) {
  const m = Math.max(0, Math.min(1, morph));
  if (m <= 0.002) {
    return {
      x: cx + (u - 0.5) * rectW,
      y: cy + (0.5 - v) * rectH,
      r: v * 5,
      deg: u * 360,
    };
  }
  // 精确等曲率对称圆弧卷绕：morph=0 退化为精确水平矩形，morph=1 严密闭合成以 (cx,cy) 为圆心的正圆极坐标
  const phi = m * Math.PI * 2;
  const targetCircum = 2 * Math.PI * (0.57 * R);
  const arcLen = rectW * (1 - m) + targetCircum * m;
  const radSpan = rectH * (1 - m) + (0.86 * R) * m;
  const rMid = arcLen / phi;
  const r = rMid + (v - 0.5) * radSpan;
  const aTop = Math.PI * 0.5 + (0.5 - u) * phi;
  const px = cx + r * Math.cos(aTop);
  const py = cy + rMid * (1 - m) - r * Math.sin(aTop);
  return { x: px, y: py, r: v * 5, deg: u * 360 };
}

// 06 节：什么时候别用极坐标诊断逻辑
export function evaluateDecision(flags) {
  const { cyclic, precision, longText, manyCats } = flags;
  if (longText) {
    return {
      verdict: "别用极坐标",
      tone: "avoid",
      title: "大段正文严禁塞进扇区：回归直线阅读轨道",
      reason: "汉字和拉丁正文都沿水平或垂直直线逐行扫视。扇区越靠近圆心越窄、越往外越宽，强行排版会制造楔形残行和反复转头。",
      alt: "推荐改用 194 手稿网格、195 分栏网格 或 198 基线网格。",
      links: [
        { id: "194", name: "194 手稿网格" },
        { id: "195", name: "195 分栏网格" },
        { id: "198", name: "198 基线网格" },
      ],
    };
  }
  if (precision && !cyclic) {
    return {
      verdict: "别用极坐标",
      tone: "avoid",
      title: "非周期高精度对比：直角对齐基线快得多、准得多",
      reason: "Cleveland & McGill（1984）与 Diehl 等人（2010）实证都指向同一结论：比较相差 5%–10% 的数值或追踪非周期趋势时，共有水平基线的柱状/折线排布显著胜过角度与扇区面积。",
      alt: "推荐改用 201 方格网格 或 196 模块化网格。",
      links: [
        { id: "201", name: "201 方格网格" },
        { id: "196", name: "196 模块化网格" },
      ],
    };
  }
  if (manyCats) {
    return {
      verdict: "慎用 / 拆层",
      tone: "warn",
      title: "超过 16 个离散分类会在圆心奇点挤死",
      reason: "圆周只有 360°，分到 20+ 路时首环弦宽跌破可读底线，文字标签也必然互相遮挡。除非能先合并大类或拆成多个小倍图。",
      alt: "若只需平铺多卡片，改用 202 等距网格 或 196 模块化网格；若坚持按方向分组，请控制在 8–12 路以内。",
      links: [
        { id: "202", name: "202 等距网格" },
        { id: "196", name: "196 模块化网格" },
      ],
    };
  }
  if (cyclic && precision) {
    return {
      verdict: "可用，但加对照",
      tone: "caution",
      title: "既有周期又求精确：极坐标看趋势 + 数值表/直角条做精读",
      reason: "用极坐标把 0° 与 360°（如 12 月与 1 月、23 点与 0 点）无缝首尾相接，同时给填色扇区配 √v 面积缩放，并在关键扇区旁附直接数字或展开条。",
      alt: "也可视屏幕空间搭配 209 响应式网格 做双视图切换。",
      links: [{ id: "209", name: "209 响应式网格" }],
    };
  }
  if (cyclic) {
    return {
      verdict: "正对口极坐标",
      tone: "fit",
      title: "天然周期 / 方位数据：极坐标网格的最佳主场",
      reason: "风向、雷达航位、24 小时节律、12 个月季节波动、声场指向性天生首尾相连且围绕同一中心发散，极坐标让方向 θ 与强弱 r 一次对齐。",
      alt: "若只需要中心发散的视觉气氛而不需要精确刻度，可看 203 放射网格。",
      links: [{ id: "203", name: "203 放射网格" }],
    };
  }
  return {
    verdict: "优先直角网格",
    tone: "warn",
    title: "缺乏天然周期或方位属性，不必为了「好看」强掰成圆",
    reason: "极坐标的代价是圆心空间收缩与弧线阅读成本。当内容既不循环也没有物理方向角时，把矩形强行卷成圆只会增加解码负担。",
    alt: "优先考虑 201 方格网格、196 模块化网格 或 203 放射网格。",
    links: [
      { id: "201", name: "201 方格网格" },
      { id: "203", name: "203 放射网格" },
    ],
  };
}

// 07 节：小练习数据（四个选项完全中性描述，仅差单一结构变量）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    spec: "12 路 30° 角分 · 0°/90° 正交 · r ∝ √v（半径比 2:1）",
    correct: true,
    divisions: 12,
    scaleMode: "sqrt",
    rRatio: 2.0,
    areaRatio: 4.0,
    explain: "答对了。填色风玫瑰图靠扇区面积传递频次，由 A = ½r²Δθ 可知，当西北风（40 次）与东南风（10 次）按平方根取 2 : 1 半径时，画出的色块面积正好是诚实的 4 : 1，同时 12 路 30° 完整对齐正交十字方位。",
  },
  {
    id: "B",
    label: "方案 B",
    spec: "12 路 30° 角分 · 0°/90° 正交 · r ∝ v（半径比 4:1）",
    correct: false,
    divisions: 12,
    scaleMode: "linear",
    rRatio: 4.0,
    areaRatio: 16.0,
    explain: "这是最常见的直觉陷阱。把 4 : 1 的频次直接画成 4 : 1 的线性半径，由于扇区越往外弧宽也同步扩大 4 倍，最终填色面积会膨胀到 4² = 16 : 1，视觉上把西北风夸大了整整 4 倍。",
  },
  {
    id: "C",
    label: "方案 C",
    spec: "12 路 30° 角分 · 0°/90° 正交 · 从 0.4R 外环起算基线",
    correct: false,
    divisions: 12,
    scaleMode: "truncated",
    rRatio: 1.56,
    areaRatio: 4.9,
    explain: "角分虽然正交，但把 0 频次基线强行外推到 0.4R 处后，原本从圆心起算的公共基准被切掉，既扭曲了半径比例，也让环形面积增量偏离真实 4 : 1。",
  },
  {
    id: "D",
    label: "方案 D",
    spec: "7 路 51.4° 角分 · r ∝ √v（半径比 2:1）",
    correct: false,
    divisions: 7,
    scaleMode: "sqrt",
    rRatio: 2.0,
    areaRatio: 4.0,
    explain: "虽然平方根映射守住了 4 : 1 的面积诚实度，但 7 路分割（每份 51.4°）既装不下 12 个方位，又全部错开了 90°/180°/270° 正交主轴，读方位角十分吃力。",
  },
];
