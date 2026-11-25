// 321 全景式构图 · 单真源数据、色彩与几何评估模型
// 画面渲染（主画布、同步剖析图、03暗室画布）与所有读数、诊单、按钮共用本模块。

export const INITIAL_STATE = {
  scene: "poster",   // "poster" | "scroll" | "desert"
  aspect: 1.08,      // 1.00 ~ 4.00（开场刻意停在逼仄方窗）
  horizon: 0.50,     // 0.30 ~ 0.76（开场刻意死中 50% 一刀均切）
  haze: 0.00,        // 0.00 ~ 1.00（开场刻意零雾阶，四重山塌平）
  foreground: false, // 开场刻意抽空前景墨岸与松林
  scalePct: 36,      // 0 ~ 42（开场刻意 36% 巨影堵心抢景）
  anchorX: 0.50,     // 0.08 ~ 0.92（开场刻意堵在画面正中）
  showGuides: true,
};

export const PRESETS = {
  broken: { ...INITIAL_STATE },
  poster: {
    scene: "poster",
    aspect: 2.65,
    horizon: 0.62,
    haze: 0.88,
    foreground: true,
    scalePct: 8.5,
    anchorX: 0.74,
    showGuides: true,
  },
  skyline: {
    scene: "desert",
    aspect: 2.35,
    horizon: 0.71,
    haze: 0.84,
    foreground: true,
    scalePct: 6.5,
    anchorX: 0.28,
    showGuides: true,
  },
  scroll: {
    scene: "scroll",
    aspect: 3.15,
    horizon: 0.38,
    haze: 0.92,
    foreground: true,
    scalePct: 7.2,
    anchorX: 0.78,
    showGuides: true,
  },
};

// 逐像素采自 321 原海报并扩展三母题：全部基于纸面与大气远雾真实插值，供渲染与亮度差计算共用
export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 青黛湖山",
    short: "原海报湖山",
    en: "POSTER · LAKE & PEAKS",
    skyTop: [250, 241, 228],
    skyLow: [243, 238, 229],
    fogRgb: [228, 233, 226],
    waterTop: [220, 228, 223],
    waterMid: [155, 186, 181],
    waterDeep: [112, 152, 148],
    // 从远到近 4 重山脊（未加雾时基色偏深，加雾后逐层退入淡青雾）
    layers: [
      { id: "far2", name: "极远雾峰", base: [34, 88, 86], fogWeight: 0.92, amp: 0.27, seed: 1.1 },
      { id: "far1", name: "远景连山", base: [26, 94, 91], fogWeight: 0.74, amp: 0.24, seed: 2.3 },
      { id: "mid2", name: "中远青峦", base: [32, 108, 104], fogWeight: 0.44, amp: 0.22, seed: 3.7 },
      { id: "mid1", name: "中近松岭", base: [18, 92, 88], fogWeight: 0.16, amp: 0.19, seed: 5.1 },
    ],
    foreBank: [3, 62, 60],
    forePine: [6, 59, 60],
    accentRgb: [238, 71, 30],
    anchorLabel: "朱红立人",
    birdCount: 5,
    hasPines: true,
    waterMode: "lake",
  },
  scroll: {
    id: "scroll",
    label: "古画 · 千里烟波",
    short: "千里烟波",
    en: "SONG SCROLL · RIVERS",
    skyTop: [247, 236, 217],
    skyLow: [238, 229, 212],
    fogRgb: [226, 228, 214],
    waterTop: [226, 227, 214],
    waterMid: [167, 186, 173],
    waterDeep: [116, 149, 138],
    layers: [
      { id: "far2", name: "远岫云屏", base: [44, 92, 84], fogWeight: 0.90, amp: 0.30, seed: 6.2 },
      { id: "far1", name: "石青重峰", base: [33, 98, 96], fogWeight: 0.70, amp: 0.26, seed: 7.4 },
      { id: "mid2", name: "石绿主嶂", base: [35, 114, 96], fogWeight: 0.40, amp: 0.23, seed: 8.8 },
      { id: "mid1", name: "近岸青坡", base: [20, 88, 74], fogWeight: 0.14, amp: 0.17, seed: 10.2 },
    ],
    foreBank: [11, 58, 50],
    forePine: [14, 64, 52],
    accentRgb: [216, 62, 26],
    anchorLabel: "江岸孤舟",
    birdCount: 4,
    hasPines: true,
    waterMode: "river",
  },
  desert: {
    id: "desert",
    label: "影史 · 苍漠孤骑",
    short: "苍漠孤骑",
    en: "WIDESCREEN · DUNES",
    skyTop: [250, 240, 224],
    skyLow: [242, 228, 206],
    fogRgb: [236, 224, 204],
    waterTop: [222, 205, 178],
    waterMid: [192, 166, 134],
    waterDeep: [142, 114, 86],
    layers: [
      { id: "far2", name: "远漠孤丘", base: [108, 86, 66], fogWeight: 0.90, amp: 0.20, seed: 11.5 },
      { id: "far1", name: "烟霞风脊", base: [120, 88, 60], fogWeight: 0.70, amp: 0.18, seed: 13.1 },
      { id: "mid2", name: "中景沙梁", base: [124, 86, 52], fogWeight: 0.38, amp: 0.16, seed: 14.9 },
      { id: "mid1", name: "近岭岩嵴", base: [82, 60, 44], fogWeight: 0.14, amp: 0.14, seed: 16.4 },
    ],
    foreBank: [36, 38, 34],
    forePine: [26, 36, 34],
    accentRgb: [232, 64, 24],
    anchorLabel: "远行孤骑",
    birdCount: 3,
    hasPines: false,
    waterMode: "plain",
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mixRgb = (a, b, t) => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];
export const rgbCss = (c, alpha = 1) =>
  alpha >= 0.999 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;

// WCAG 相对亮度，供真实对比度与层次明度阶差核算
export function relLuminance([r, g, b]) {
  const f = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// 计算四重山脊在当前 haze 下的真实绘制颜色
export function layerColors(sceneKey, haze) {
  const sc = SCENES[sceneKey] || SCENES.poster;
  const h = clamp(haze, 0, 1);
  // haze=0 时把所有层压向近似同一中深墨青（纸板平墙），haze=1 时按雾权重自然退远
  const flatColor = sc.layers[3].base;
  return sc.layers.map((layer) => {
    const fogged = mixRgb(layer.base, sc.fogRgb, layer.fogWeight);
    return mixRgb(flatColor, fogged, h);
  });
}

// 连续山脊高程函数：返回相对于地平线以上的归一高度 [0, ~0.34]
// t ∈ [0, 1] 覆盖完整全景世界宽度，左右自然起峰微抱合，中段开敞收湖
export function ridgeHeight(sceneKey, layerIndex, t) {
  const u = clamp(t, 0, 1);
  // 两侧抱合碗势：左缘(0..0.24)和右缘(0.76..1.0)微抬，中段(0.32..0.68)开敞纳湖
  const leftShoulder = Math.exp(-Math.pow((u - 0.06) / 0.17, 2));
  const rightShoulder = Math.exp(-Math.pow((u - 0.94) / 0.18, 2));
  const bowl = 0.32 + 0.68 * Math.max(leftShoulder, rightShoulder * 0.92);

  if (sceneKey === "scroll") {
    // 千里江山式三段峰群起伏
    const p1 = Math.exp(-Math.pow((u - 0.14) / 0.12, 2)) * 0.95;
    const p2 = Math.exp(-Math.pow((u - 0.52) / 0.13, 2)) * (layerIndex === 0 ? 0.85 : 0.42);
    const p3 = Math.exp(-Math.pow((u - 0.85) / 0.13, 2)) * 0.92;
    const wave =
      0.5 +
      0.26 * Math.sin(u * 13.5 + layerIndex * 1.9) +
      0.16 * Math.sin(u * 29.0 + layerIndex * 2.7) +
      0.08 * Math.cos(u * 53.0 + layerIndex * 1.3);
    const scale = [0.24, 0.21, 0.19, 0.15][layerIndex] || 0.16;
    return clamp((0.18 + 0.82 * Math.max(p1, p2, p3)) * wave * scale, 0.015, 0.34);
  }

  if (sceneKey === "desert") {
    // 苍漠沙梁：平缓绵延，左远右近
    const d1 = Math.exp(-Math.pow((u - 0.18) / 0.24, 2)) * 0.72;
    const d2 = Math.exp(-Math.pow((u - 0.78) / 0.22, 2)) * 0.80;
    const smooth =
      0.52 +
      0.28 * Math.sin(u * 7.8 + layerIndex * 1.4) +
      0.14 * Math.sin(u * 16.5 + layerIndex * 2.5);
    const scale = [0.16, 0.14, 0.12, 0.095][layerIndex] || 0.12;
    return clamp((0.28 + 0.72 * Math.max(d1, d2)) * smooth * scale, 0.012, 0.24);
  }

  // 默认 poster（1:1 呼应 321 原海报：左高陡青峰、中段低谷重叠远雾山、右缘缓坡与密松林）
  if (layerIndex === 0) {
    // 最远淡雾峰：绵延横贯中段
    const m =
      0.52 +
      0.22 * Math.sin(u * 11.2 + 0.6) +
      0.16 * Math.sin(u * 23.0 + 1.4) +
      0.09 * Math.sin(u * 41.0 + 2.2);
    const leftLift = 0.25 * Math.exp(-Math.pow((u - 0.22) / 0.16, 2));
    const rightLift = 0.34 * Math.exp(-Math.pow((u - 0.88) / 0.16, 2));
    return clamp((0.46 + leftLift + rightLift) * m * 0.24, 0.02, 0.27);
  }
  if (layerIndex === 1) {
    // 远景连山
    const m =
      0.5 +
      0.28 * Math.sin(u * 12.8 + 2.1) +
      0.15 * Math.sin(u * 28.5 + 0.5) +
      0.07 * Math.cos(u * 54.0);
    const env = 0.28 + 0.72 * Math.max(
      Math.exp(-Math.pow((u - 0.15) / 0.16, 2)),
      Math.exp(-Math.pow((u - 0.88) / 0.18, 2)) * 0.92
    );
    return clamp(env * m * 0.25, 0.012, 0.27);
  }
  if (layerIndex === 2) {
    // 中远青峦（左右抱湖，中段低伏让出湖谷）
    const valleyDip = 1 - 0.76 * Math.exp(-Math.pow((u - 0.52) / 0.20, 2));
    const crag =
      0.56 +
      0.26 * Math.sin(u * 17.4 + 0.9) +
      0.14 * Math.sin(u * 38.0 + 2.6) +
      0.06 * Math.sin(u * 71.0);
    return clamp(valleyDip * bowl * crag * 0.28, 0.008, 0.29);
  }
  // layerIndex === 3：中近松岭（左侧陡起、右侧低伏承松林）
  const leftPeak = Math.exp(-Math.pow((u - 0.03) / 0.15, 2)) * 1.05;
  const rightSpur = Math.exp(-Math.pow((u - 0.86) / 0.14, 2)) * 0.44;
  const detail = 0.72 + 0.20 * Math.sin(u * 27.0 + 1.1) + 0.08 * Math.sin(u * 64.0);
  return clamp(Math.max(leftPeak, rightSpur) * detail * 0.26, 0, 0.28);
}

// 前景墨岸顶边高度（相对画布底部的归一抬升 [0.05..0.22]）
export function foreBankHeight(sceneKey, t) {
  const u = clamp(t, 0, 1);
  if (sceneKey === "desert") {
    return 0.055 + 0.075 * Math.pow(Math.abs(u - 0.48) * 1.9, 1.55) + 0.012 * Math.sin(u * 18);
  }
  // 原海报风格：左右略隆、中间平缓微凹露出大片湖面，右岸在 0.68..0.82 平展可供红人立足
  const leftSlope = 0.135 * Math.exp(-Math.pow(u / 0.22, 2));
  const rightSlope = 0.125 * Math.exp(-Math.pow((1 - u) / 0.21, 2));
  const ripple = 0.009 * Math.sin(u * 22 + 0.6) + 0.005 * Math.cos(u * 49);
  return clamp(0.058 + leftSlope + rightSlope + ripple, 0.045, 0.22);
}

// 根据外框尺寸与当前 aspect，计算实际有效取景框矩形（绝不拉伸变形）
export function computeCropWindow(canvasW, canvasH, aspect) {
  const a = clamp(aspect, 0.95, 4.05);
  const canvasA = canvasW / Math.max(1, canvasH);
  let w, h;
  if (a <= canvasA) {
    // 较窄：满高，左右向内拉合宣纸帘幕
    h = canvasH;
    w = Math.round(h * a);
  } else {
    // 极宽门缝：满宽，上下向内压紧
    w = canvasW;
    h = Math.round(w / a);
  }
  const x = Math.round((canvasW - w) / 2);
  const y = Math.round((canvasH - h) / 2);
  return {
    x,
    y,
    w,
    h,
    uMin: x / canvasW,
    uMax: (x + w) / canvasW,
    visibleWidthPct: Math.round((w / canvasW) * 100),
    visibleHeightPct: Math.round((h / canvasH) * 100),
  };
}

// 统一经验区间常量（页面上所有文案、标尺、读数全部从此处读取，绝不手写重复数）
export const RULES = {
  aspectMin: 1.90,
  aspectMax: 3.45,
  depthContrastMin: 0.26,
  scaleMin: 4.0,
  scaleMax: 14.0,
  anchorEdgeMin: 0.12,
  anchorEdgeMax: 0.88,
  anchorCenterDeadZone: 0.08, // 距 0.50 至少偏开 8%
  horizonDeadLow: 0.45,
  horizonDeadHigh: 0.55,
  skyMin: 26,
  skyMax: 68,
};

// 单真源评估：基于实绘几何、真实图层 RGB 相对亮度差与山人高比核算全部指标与诊断
export function evaluate(state, refW = 1280, refH = 420) {
  const sc = SCENES[state.scene] || SCENES.poster;
  const crop = computeCropWindow(refW, refH, state.aspect);
  const cols = layerColors(state.scene, state.haze);

  // 1. 实算最远层与近层的相对亮度差（含前景墨岸开启与否）
  const farLum = relLuminance(cols[0]);
  const nearRef = state.foreground ? sc.foreBank : cols[3];
  const nearLum = relLuminance(nearRef);
  const depthContrast = Math.max(0, farLum - nearLum);

  // 2. 在有效取景窗 [crop.uMin, crop.uMax] 内实采可见山峰最高脊线与平均天空留气
  const horizonY = crop.y + crop.h * state.horizon;
  let maxRidgeFrac = 0;
  let sumRidgeFrac = 0;
  const SAMPLES = 32;
  for (let i = 0; i < SAMPLES; i++) {
    const u = lerp(crop.uMin, crop.uMax, i / (SAMPLES - 1));
    let tallest = 0;
    for (let l = 0; l < 4; l++) {
      tallest = Math.max(tallest, ridgeHeight(state.scene, l, u));
    }
    if (tallest > maxRidgeFrac) maxRidgeFrac = tallest;
    sumRidgeFrac += tallest;
  }
  const avgRidgeFrac = sumRidgeFrac / SAMPLES;
  // 天空有效留气占比（扣除平均山脊后，上方空域占有效取景框高度的百分比）
  const skyClearFrac = clamp(state.horizon - avgRidgeFrac * 0.72, 0.04, 0.86);
  const skyRatio = Math.round(skyClearFrac * 100);

  // 3. 山人真实高度比（可见最高峰相对岸底的高 ÷ 实绘点景人像素高）
  const peakSpanFrac = Math.max(0.12, maxRidgeFrac + (1 - state.horizon) * 0.45);
  const mtnToHuman = state.scalePct > 0.5 ? +(peakSpanFrac / (state.scalePct / 100)).toFixed(1) : null;

  // 4. 四个独立维度的过关与细类故障判定
  let widthFault = null;
  if (state.aspect < RULES.aspectMin) widthFault = "narrow";
  else if (state.aspect > RULES.aspectMax) widthFault = "slit";
  const dimWidth = !widthFault;

  let depthFault = null;
  if (!state.foreground) depthFault = "no_fore";
  else if (depthContrast < RULES.depthContrastMin) depthFault = "flat_haze";
  const dimDepth = !depthFault;

  let scaleFault = null;
  if (state.scalePct < RULES.scaleMin) scaleFault = "no_anchor";
  else if (state.scalePct > RULES.scaleMax) scaleFault = "giant_anchor";
  else if (state.anchorX < RULES.anchorEdgeMin || state.anchorX > RULES.anchorEdgeMax) scaleFault = "edge_anchor";
  else if (Math.abs(state.anchorX - 0.5) < RULES.anchorCenterDeadZone) scaleFault = "center_anchor";
  const dimScale = !scaleFault;

  let frameFault = null;
  if (state.horizon >= RULES.horizonDeadLow && state.horizon <= RULES.horizonDeadHigh) frameFault = "half_split";
  else if (skyRatio < RULES.skyMin) frameFault = "cramped_sky";
  else if (skyRatio > RULES.skyMax) frameFault = "thin_ground";
  const dimFrame = !frameFault;

  const passedCount = [dimWidth, dimDepth, dimScale, dimFrame].filter(Boolean).length;

  // 5. 生成白话单真源主诊单（永远说清「人眼为何这样看」与下一步动作）
  const diag = buildDiagnosis(state, {
    widthFault,
    depthFault,
    scaleFault,
    frameFault,
    depthContrast,
    skyRatio,
    mtnToHuman,
    crop,
    sc,
  });

  // 三枚原海报要点徽标的实时状态
  const pillars = {
    extend: {
      ok: dimWidth,
      tag: dimWidth
        ? `${state.aspect.toFixed(2)}:1 开阔`
        : widthFault === "narrow"
        ? `仅 ${state.aspect.toFixed(2)}:1 偏窄`
        : `${state.aspect.toFixed(2)}:1 门缝`,
    },
    depth: {
      ok: dimDepth && dimFrame,
      tag: !state.foreground
        ? "缺前景锚"
        : depthContrast < RULES.depthContrastMin
        ? `雾阶 ΔL ${depthContrast.toFixed(2)}`
        : frameFault === "half_split"
        ? "地平线均切"
        : frameFault === "cramped_sky"
        ? `天空仅 ${skyRatio}%`
        : frameFault === "thin_ground"
        ? `天空过阔 ${skyRatio}%`
        : `阶差 ΔL ${depthContrast.toFixed(2)}`,
    },
    scale: {
      ok: dimScale,
      tag:
        state.scalePct < RULES.scaleMin
          ? "零尺度锚"
          : state.scalePct > RULES.scaleMax
          ? `人占 ${Math.round(state.scalePct)}% 抢景`
          : scaleFault === "center_anchor"
          ? "堵心切景"
          : scaleFault === "edge_anchor"
          ? "贴边欲出"
          : `1 : ${mtnToHuman} 映衬`,
    },
  };

  return {
    crop,
    cols,
    depthContrast,
    skyRatio,
    mtnToHuman,
    dimWidth,
    dimDepth,
    dimScale,
    dimFrame,
    widthFault,
    depthFault,
    scaleFault,
    frameFault,
    passedCount,
    diag,
    pillars,
  };
}

function buildDiagnosis(state, m) {
  const { widthFault, depthFault, scaleFault, frameFault, depthContrast, skyRatio, mtnToHuman, sc } = m;

  if (widthFault === "narrow") {
    return {
      ok: false,
      code: "逼仄切景",
      badge: "错态 · 逼仄切景",
      headline: `画幅锁死在 ${state.aspect.toFixed(2)} : 1，左右江山被硬生生腰斩`,
      body: `全景的包容感来自横向舒展的周边视野。现在左右两侧被裁切帘幕切掉了一大半，山势还没合拢、湖面还没铺开就被画框拦腰截断，观者只觉得在透过一扇窄窗往外瞄。`,
      action: `在上方主画幕里向右横拖（或按 → 键），把取景幅面拉展到 ${RULES.aspectMin.toFixed(1)} : 1 以上。`,
    };
  }
  if (widthFault === "slit") {
    return {
      ok: false,
      code: "细缝压天",
      badge: "错态 · 细缝压天",
      headline: `硬拉到 ${state.aspect.toFixed(2)} : 1，天地被压成一道憋闷门缝`,
      body: `宽幅并非越扁越好。超过约 ${RULES.aspectMax.toFixed(1)} : 1 后，山峰纵向体量与天空呼吸被严重压扁，观者被迫左右扫视却感受不到天地辽阔的气度。`,
      action: `往左收回一点视野，回到 ${RULES.aspectMin.toFixed(1)}–${RULES.aspectMax.toFixed(1)} : 1 的经验宽幅带。`,
    };
  }
  if (depthFault === "no_fore") {
    return {
      ok: false,
      code: "失锚漂浮",
      badge: "错态 · 失锚漂浮",
      headline: "抽空了前景墨岸，整幅远山悬在半空没了落脚处",
      body: `全景最怕一上来就把远景糊在脸上。少了近景深墨山坡与松林压住下沿，眼睛找不到“站在哪里望出去”的入口，整片湖山立刻发飘、失去纵深起点。`,
      action: `打开下方「前景墨岸与松林」，先给眼睛安一个深色立足点。`,
    };
  }
  if (depthFault === "flat_haze") {
    return {
      ok: false,
      code: "平墙无深",
      badge: "错态 · 平墙无深",
      headline: `远近山层明度阶差只有 ${depthContrast.toFixed(2)}，群山塌成一面贴纸墙`,
      body: `真实空间里，空气中的水汽会把越远的山洗得越淡、越灰青。现在四重山峰几乎一样深重，大脑分不清谁在前、谁在后，空间深度当场塌平。`,
      action: `往右推高「空气雾阶」，让远近相对亮度阶差 ΔL 拉开到 ${RULES.depthContrastMin.toFixed(2)} 以上。`,
    };
  }
  if (scaleFault === "giant_anchor") {
    return {
      ok: false,
      code: "大影压景",
      badge: "错态 · 大影压景",
      headline: `${sc.anchorLabel}放大到占画高 ${Math.round(state.scalePct)}%，湖山瞬间沦为背景布`,
      body: `此时山与人高比只剩 1 : ${mtnToHuman}。主体太大时，观者的视线会被牢牢吸在人物身上，山河不再浩大，只像站在景区立牌前拍的打卡纪念照。`,
      action: `把「点景尺度」缩回经验甜区 ${RULES.scaleMin}%–${RULES.scaleMax}%，让小人退成量山的标尺。`,
    };
  }
  if (scaleFault === "no_anchor") {
    return {
      ok: false,
      code: "无尺空阔",
      badge: "错态 · 无尺空阔",
      headline: "拿掉了全部点景参照，眼前分不清是土坡还是大川",
      body: `人眼判断宏大空间极度依赖已知尺寸的参照物。彻底隐藏${sc.anchorLabel}后，画面虽然干净，却失去了“以小见大”的物理尺子，气势反而发空。`,
      action: `把「点景尺度」调到 ${RULES.scaleMin}%–${RULES.scaleMax}% 之间，放回一寸高对比参照。`,
    };
  }
  if (scaleFault === "center_anchor") {
    return {
      ok: false,
      code: "堵心切景",
      badge: "错态 · 堵心切景",
      headline: `${sc.anchorLabel}死堵在湖面正中，一刀斩断横向延展的气口`,
      body: `全景讲究让视线沿水岸与山脊左右舒展。把醒目的朱红锚点正正立在 50% 中轴上，视线刚进画面就被钉死在中央，左右两边开阔的湖山白白浪费了。`,
      action: `直接在画布里点选右侧或左侧开阔岸线（避开 42%–58% 中轴），把点景挪到呼应位。`,
    };
  }
  if (scaleFault === "edge_anchor") {
    return {
      ok: false,
      code: "贴边欲出",
      badge: "错态 · 贴边欲出",
      headline: `${sc.anchorLabel}挤到了裁切边沿，视线差点滑出画面`,
      body: `尺度锚点靠得太近左右边线（超出 12%–88% 安全内域），既容易被画框挤碎，又会把观者的视线直接带出取景框之外。`,
      action: `在画布里把${sc.anchorLabel}往内移回约 22%–34% 或 68%–80% 的岸线处。`,
    };
  }
  if (frameFault === "half_split") {
    return {
      ok: false,
      code: "死中劈裂",
      badge: "错态 · 死中劈裂",
      headline: `地平线正卡在 ${Math.round(state.horizon * 100)}% 正中，天地被均分成僵硬两半`,
      body: `天地各占一半时，观者拿不准该看辽阔天空还是浩淼湖水，视觉重心悬而未决，整幅全景显得呆板像随手端平的证件照。`,
      action: `微调「地平线高低」：压低（≥ 56%）突显开阔苍穹，或抬高（≤ 44%）铺展浩淼水波。`,
    };
  }
  if (frameFault === "cramped_sky") {
    return {
      ok: false,
      code: "闷顶压迫",
      badge: "错态 · 闷顶压迫",
      headline: `天空留气只剩 ${skyRatio}%，山顶顶着上沿透不过气`,
      body: `地平线抬得过高时，高耸山脊直撞画框上边，天地空间被压得局促发闷，丢掉了全景最可贵的疏朗气度。`,
      action: `把「地平线」往下放一些，让天空留气回到 ${RULES.skyMin}%–${RULES.skyMax}%。`,
    };
  }
  if (frameFault === "thin_ground") {
    return {
      ok: false,
      code: "地基悬薄",
      badge: "错态 · 地基悬薄",
      headline: `天空占去 ${skyRatio}%，底部湖岸被压成极薄一条边`,
      body: `地平线压得太低时，承载山峦、水面与前景锚点的“地基”过薄，下沿托不住大景，整幅画显得头重脚轻。`,
      action: `把「地平线」略微抬高，让湖山与前景岸线拥有稳当的承载厚度。`,
    };
  }

  // 全部四维通过！识别不同正当解类型
  let solveTag = "自调正当解";
  if (state.horizon <= 0.44) solveTag = "长卷浩淼解";
  else if (state.horizon >= 0.68) solveTag = "苍穹旷野解";
  else if (state.scene === "poster" && state.anchorX > 0.65 && state.horizon >= 0.56) solveTag = "原海报湖山解";

  return {
    ok: true,
    code: solveTag,
    badge: `达标 · ${solveTag}`,
    headline: `宽幅 ${state.aspect.toFixed(2)} : 1 配 1 : ${mtnToHuman} 尺度锚，全景包容感成立`,
    body: `横向视野完整揽住左右山势与湖谷，前景墨岸稳稳托底、四重山峦拉出 ΔL ${depthContrast.toFixed(2)} 的空气纵深，${sc.anchorLabel}以仅 ${state.scalePct.toFixed(1)}% 的身量立于岸边，凭一寸朱红撑出千里气度。`,
    action: "你也可以试试切到「千里烟波 / 苍漠孤骑」，或把地平线抬高成高视点长卷解，看看全景的多种合法写法。",
  };
}
