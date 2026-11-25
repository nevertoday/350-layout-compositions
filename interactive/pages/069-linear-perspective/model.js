// 069 线性透视 · 单真源 3D 针孔投影与诊断模型
// 主透视广场画布、底右「线性透视示意图 / 视觉金字塔」蓝图、以及所有指标与白话诊断
// 全部由同一组 3D 空间坐标与投影几何实算，绝不写死常量。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报广场",
    en: "CONCRETE PLAZA",
    monolithName: "混凝土体块",
    runnerLabel: "青色中轴道",
  },
  florence: {
    id: "florence",
    label: "佛罗伦萨回廊",
    en: "PORTICO ARCADE",
    monolithName: "拱廊石柱",
    runnerLabel: "大理石中轴",
  },
  metro: {
    id: "metro",
    label: "地铁长通道",
    en: "TRANSIT TUNNEL",
    monolithName: "结构肋拱",
    runnerLabel: "导视光带",
  },
};

export const INITIAL_STATE = {
  scene: "poster",
  vpMainU: 0.50,
  horizonV: 0.53,
  vpWallU: 0.72,      // 刻意偏离主灭点 +22%，让左墙纵线与地面大道分叉
  vpWallV: 0.36,      // 刻意悬空于视平线上方 -17%
  depthLaw: "linear", // "linear" | "inverse" | "true"
  aerialMode: "inverted", // "inverted" | "flat" | "receding"
  fovDeg: 106,        // 超广角 106°，近景拉伸畸变
  showRays: true,
  blueprintTab: "diagram", // "diagram" | "pyramid"
};

export const PRESETS = {
  broken: { ...INITIAL_STATE },
  poster: {
    vpMainU: 0.50,
    horizonV: 0.55,
    vpWallU: 0.50,
    vpWallV: 0.55,
    depthLaw: "true",
    aerialMode: "receding",
    fovDeg: 52,
  },
  asymmetric: {
    vpMainU: 0.35,
    horizonV: 0.45,
    vpWallU: 0.35,
    vpWallV: 0.45,
    depthLaw: "true",
    aerialMode: "receding",
    fovDeg: 46,
  },
  monumental: {
    vpMainU: 0.56,
    horizonV: 0.71,
    vpWallU: 0.56,
    vpWallV: 0.71,
    depthLaw: "true",
    aerialMode: "receding",
    fovDeg: 62,
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

// sRGB 相对亮度与对比度，供「近实远虚」实测
function relLum([r, g, b]) {
  const f = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(rgbA, rgbB) {
  const l1 = relLum(rgbA);
  const l2 = relLum(rgbB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const BACKDROP_RGB = [232, 236, 239]; // #E8ECEF 浅混凝土背景基色

function mixRgb(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

const rgbCss = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

// 3D 针孔投影（固定前景主体视高不变的等效变焦：d 随 FOV 变，z0 同步变）
export const REF_FOV = 52;
export const REF_FOCAL = 0.5 / Math.tan((REF_FOV * Math.PI) / 360); // ≈ 1.024

export function focalFromFov(fovDeg) {
  const rad = (clamp(fovDeg, 12, 125) * Math.PI) / 180;
  return 0.5 / Math.tan(rad / 2);
}

export function equivMmFromFov(fovDeg) {
  const rad = (clamp(fovDeg, 12, 125) * Math.PI) / 180;
  // 35mm 全画幅水平宽 36mm
  return Math.round(18 / Math.tan(rad / 2));
}

// 计算某一状态下全画布与蓝图的统一几何
export function computePlaza(state) {
  const vpMainU = clamp(state.vpMainU, 0.20, 0.80);
  const horizonV = clamp(state.horizonV, 0.14, 0.88);
  const vpWallU = clamp(state.vpWallU, 0.14, 0.86);
  const vpWallV = clamp(state.vpWallV, 0.12, 0.86);
  const fovDeg = clamp(state.fovDeg, 14, 118);

  const d = focalFromFov(fovDeg);
  const equivMm = equivMmFromFov(fovDeg);

  // 真实 3D 物理布置：5 座体块沿左走廊等物理间距排列
  // 相机到首块距离 z0 随焦距缩放（维持前景基准高度稳定，忠实呈现真实广角拉伸 / 望远压扁效应）
  const z0 = 1.40 * (d / REF_FOCAL);
  const bayPitch = 0.92;   // 相邻体块起点的真实 3D 间距
  const blockLen = 0.62;   // 每块沿深度方向的真实长度
  const wallInnerX = -0.34; // 体块朝通道的内侧壁 X（世界坐标，单位与画面半宽对应）
  const wallOuterX = -0.96; // 体块外侧壁 X
  const floorY = -0.36;    // 地坪相对相机眼高的基准高度（随 horizonV 联动）
  const wallTopY = 0.30;   // 体块顶面相对基准眼高

  // 相机到地坪的投影基准（把 3D 坐标投到归一化画布 [0..1, 0..1]）
  // 垂直纵横比基准 2.15（宽屏画布里 y 缩放更自然）
  const projectMain = (x, y, z) => {
    const inv = d / Math.max(0.18, z);
    return {
      u: vpMainU + x * inv,
      v: horizonV - y * inv * 1.45,
      scale: inv,
    };
  };

  // 为制造真实的「墙面灭点分叉」物理视觉：
  // 体块从近景锚点出发，其纵深退行方向指向 (vpWallU, vpWallV)，而非 (vpMainU, horizonV)
  const vpDx = vpWallU - vpMainU;
  const vpDy = vpWallV - horizonV;
  const vpGap = Math.hypot(vpDx, vpDy);
  const vpHorizErr = vpDx;
  const vpVertErr = vpWallV - horizonV;

  // 计算 5 座体块的近面与远面（同时保留真 3D 平面坐标供阿尔贝蒂俯视剖面使用）
  const monoliths = [];
  const nearScaleRef = d / z0;
  const zListTrue = [];

  for (let i = 0; i < 5; i++) {
    const zNear = z0 + i * bayPitch;
    const zFar = zNear + blockLen;
    zListTrue.push({ zNear, zFar });

    // 真 1/z 透视下的归一化进深系数 t ∈ [0, 1)（0 = 最近前景，1 = 灭点无穷远）
    const sNearTrue = d / zNear;
    const sFarTrue = d / zFar;
    const tNearTrue = 1 - sNearTrue / nearScaleRef;
    const tFarTrue = 1 - sFarTrue / nearScaleRef;

    // 根据 depthLaw 计算实际采用的缩放因子与进深位置
    let sNear, sFar, tNear, tFar;
    if (state.depthLaw === "true") {
      sNear = sNearTrue;
      sFar = sFarTrue;
      tNear = tNearTrue;
      tFar = tFarTrue;
    } else if (state.depthLaw === "linear") {
      // 伪等距错态：画面横/纵间距均匀排布、高度只微弱衰减
      tNear = i * 0.145;
      tFar = tNear + 0.102;
      sNear = nearScaleRef * (1 - i * 0.058);
      sFar = nearScaleRef * (1 - (i + 0.65) * 0.058);
    } else {
      // inverse：反透视倒大错态，越远反而越大
      tNear = i * 0.145;
      tFar = tNear + 0.098;
      sNear = nearScaleRef * (0.64 + i * 0.095);
      sFar = nearScaleRef * (0.64 + (i + 0.6) * 0.095);
    }

    // 近景第 0 块前立面锚定在主通道基准，随进深 t 偏移向 (vpWallU, vpWallV)
    const anchorU = vpMainU + wallInnerX * nearScaleRef;
    const anchorOuterU = vpMainU + wallOuterX * nearScaleRef;
    const anchorFloorV = horizonV - floorY * nearScaleRef * 1.45;
    const anchorTopV = horizonV - wallTopY * nearScaleRef * 1.45;

    // 真实透视投影下，当 wallVP == mainVP 时完全等价于 projectMain(x, y, z)
    const mapEdge = (anchorVal, vpVal, ratioFromNear) =>
      lerp(anchorVal, vpVal, ratioFromNear);

    // 高度缩放与进深收敛分开表达（这样 linear / inverse 既显出等距又显出异常高比）
    const depthProgressNear = state.depthLaw === "true" ? tNearTrue : tNear;
    const depthProgressFar = state.depthLaw === "true" ? tFarTrue : tFar;

    const innerNearU = mapEdge(anchorU, vpWallU, depthProgressNear);
    const innerFarU = mapEdge(anchorU, vpWallU, depthProgressFar);
    const outerNearU = mapEdge(anchorOuterU, vpWallU, depthProgressNear);

    const floorNearV = mapEdge(anchorFloorV, vpWallV, depthProgressNear);
    const floorFarV = mapEdge(anchorFloorV, vpWallV, depthProgressFar);

    const trueHeightNear = (anchorFloorV - anchorTopV) * (sNear / nearScaleRef);
    const trueHeightFar = (anchorFloorV - anchorTopV) * (sFar / nearScaleRef);

    // 当 depthLaw === "true" 时，顶面自然沿射线直奔 vpWallV；
    // 当 linear/inverse 时，顶面打破收束高度，呈现僵硬等高或倒大
    const topNearV =
      state.depthLaw === "true"
        ? mapEdge(anchorTopV, vpWallV, depthProgressNear)
        : floorNearV - trueHeightNear;
    const topFarV =
      state.depthLaw === "true"
        ? mapEdge(anchorTopV, vpWallV, depthProgressFar)
        : floorFarV - trueHeightFar;

    // 计算当前体块的空气透视明度阶梯（单真源色值）
    const frac = i / 4; // 0 = 最近，1 = 最远
    let frontRgb, sideRgb, gridAlpha;
    if (state.aerialMode === "receding") {
      // 逐像素致敬 069 原海报：近块深炭黑 #181E21 → 中块冷灰 #8E98A0 → 远块浅雾 #C5CFD6
      frontRgb = mixRgb([24, 30, 33], [198, 207, 214], Math.pow(frac, 0.72));
      sideRgb = mixRgb([38, 46, 51], [212, 220, 226], Math.pow(frac, 0.72));
      gridAlpha = lerp(0.82, 0.20, frac);
    } else if (state.aerialMode === "inverted") {
      // 远端抢黑倒挂错态：近块浅灰、远块重黑
      frontRgb = mixRgb([184, 192, 198], [13, 19, 23], Math.pow(frac, 0.85));
      sideRgb = mixRgb([198, 205, 211], [24, 32, 38], Math.pow(frac, 0.85));
      gridAlpha = lerp(0.24, 0.90, frac);
    } else {
      // 全域平灰错态：远近无层次
      frontRgb = mixRgb([104, 113, 120], [116, 125, 132], frac);
      sideRgb = mixRgb([124, 133, 140], [134, 142, 149], frac);
      gridAlpha = 0.45;
    }

    const screenHeight = Math.max(0.01, floorNearV - topNearV);
    const sideWidth = Math.max(0.005, innerFarU - innerNearU);
    const faceWidth = Math.max(0.005, innerNearU - outerNearU);
    const contrast = contrastRatio(frontRgb, BACKDROP_RGB);

    monoliths.push({
      index: i,
      zNear,
      zFar,
      innerNearU,
      innerFarU,
      outerNearU,
      floorNearV,
      floorFarV,
      topNearV,
      topFarV,
      screenHeight,
      sideWidth,
      faceWidth,
      frontRgb,
      sideRgb,
      frontCss: rgbCss(frontRgb),
      sideCss: rgbCss(sideRgb),
      gridAlpha,
      contrast,
    });
  }

  // 计算地坪横缝（8 道横线，用于实测 1/z 透视压缩比）
  const floorCrossVs = [];
  const floorBaseV = Math.min(0.98, Math.max(horizonV + 0.14, 0.96));
  for (let k = 0; k < 8; k++) {
    let v;
    if (state.depthLaw === "true") {
      const zTile = z0 * 0.72 + k * 0.75;
      const frac = (d / zTile) / (d / (z0 * 0.72));
      v = horizonV + (floorBaseV - horizonV) * frac;
    } else if (state.depthLaw === "linear") {
      v = floorBaseV - (k / 8) * (floorBaseV - horizonV) * 0.88;
    } else {
      // inverse：越远缝越宽
      const p = Math.pow(k / 7, 0.65);
      v = floorBaseV - p * (floorBaseV - horizonV) * 0.84;
    }
    floorCrossVs.push(v);
  }

  // 由实绘几何直接算出全部核心读数（单真源）
  const firstM = monoliths[0];
  const lastM = monoliths[monoliths.length - 1];
  const heightRatio = firstM.screenHeight / Math.max(0.004, lastM.screenHeight);

  const nearTileGap = Math.max(0.001, floorCrossVs[0] - floorCrossVs[1]);
  const farTileGap = Math.max(0.001, floorCrossVs[5] - floorCrossVs[6]);
  const tileCompression = nearTileGap / farTileGap;

  // 边缘广角拉伸系数（相对 52° 基准的边缘横纵拉伸比）
  const halfRad = (fovDeg * Math.PI) / 360;
  const refHalfRad = (REF_FOV * Math.PI) / 360;
  const edgeStretch = (1 / Math.cos(halfRad)) / (1 / Math.cos(refHalfRad));

  // 中轴青色跑道在底边的收束半角（度）
  const runnerHalfBase = 0.085 * (d / REF_FOCAL > 1.8 ? 0.85 : 1);
  const runnerHalfWidth = clamp(0.082 * (1 / Math.max(0.45, d / REF_FOCAL)) * 0.82, 0.042, 0.145);
  const convergeAngleDeg =
    (Math.atan2(runnerHalfWidth, Math.max(0.08, 1 - horizonV)) * 180) / Math.PI;

  // 近实远虚对比衰减比（首块相对背景对比度 / 末块相对背景对比度）
  const nearContrast = firstM.contrast;
  const farContrast = lastM.contrast;
  const contrastDropRatio = nearContrast / Math.max(0.5, farContrast);

  // 4 项核心维度的成立判定（允许多组光学正当解）
  const vanishingOk = vpGap <= 0.032 && Math.abs(vpVertErr) <= 0.025;
  const depthOk =
    state.depthLaw === "true" && heightRatio >= 2.15 && tileCompression >= 1.65;
  const aerialOk = state.aerialMode === "receding" && contrastDropRatio >= 2.5;
  const horizonOk = horizonV >= 0.22 && horizonV <= 0.78;
  const fovOk = fovDeg >= 30 && fovDeg <= 72;
  const coneOk = fovOk && horizonOk;

  const score = [vanishingOk, depthOk, aerialOk, coneOk].filter(Boolean).length;

  // 9 类失误实时枚举（按严重度排序，首个即主诊病灶）
  const errors = [];
  if (Math.abs(vpVertErr) > 0.025) {
    errors.push({
      code: "off-horizon",
      dim: "vanishing",
      badge: `悬空 ${Math.round(Math.abs(vpVertErr) * 100)}%`,
      title: `左墙灭点${vpVertErr < 0 ? "飘在视平线上方" : "沉到视平线下方"} ${Math.round(Math.abs(vpVertErr) * 100)}%，整排建筑失重`,
      why: "水平方向的平行线，无论高低，在平视时都必须落回同一条视平线。只要墙面纵线另找了一个高低不同的交点，大脑就会把建筑和地面读成两张硬拼在一起的照片。",
      action: "直接拖动广场上的红蓝「墙面灭点」圆点，把它拉回虚线视平线并与青色主灭点合拢。",
    });
  } else if (vpGap > 0.032) {
    errors.push({
      code: "split-vp",
      dim: "vanishing",
      badge: `${vpHorizErr > 0 ? "右偏" : "左偏"} ${Math.round(Math.abs(vpHorizErr) * 100)}%`,
      title: `墙面纵线与中轴大道各指一个灭点（错开 ${Math.round(vpGap * 100)}%）`,
      why: "画面里明明朝同一方向延伸的平行墙面和道路，却交在视平线上的两个不同位置——空间走廊瞬间拧成麻花，视线被扯向两处。",
      action: `把墙面灭点向${vpHorizErr > 0 ? "左" : "右"}横拖，贴紧青色大道的消失点，让全部平行射线合为一点。`,
    });
  }

  if (state.depthLaw === "inverse") {
    errors.push({
      code: "inverse-scale",
      dim: "depth",
      badge: `倒大 ${heightRatio.toFixed(2)}×`,
      title: `远端体块反比近景高大（首尾高比仅 ${heightRatio.toFixed(2)}×），空间彻底倒反`,
      why: "人类靠「视网膜成像与距离成反比（1/z）」推断远近。远处物体反倒变大时，大脑无法按走廊理解，只能当成怪异的阶梯或平面拼贴。",
      action: "在下方「近大远小」里切回「真实 1/z 透视」，恢复随距离反比缩小的体块与横缝。",
    });
  } else if (state.depthLaw === "linear") {
    errors.push({
      code: "flat-spacing",
      dim: "depth",
      badge: `等距 ${heightRatio.toFixed(1)}×`,
      title: `建筑进深与地砖横缝僵硬等距（横缝压比 ${tileCompression.toFixed(2)}×），纵深当场塌平`,
      why: "真实空间里等宽的地砖在画纸上绝不会等距排列——越靠近视平线挤得越密。用等差硬画，路面会像竖立的梯子贴在脸前，毫无深远感。",
      action: "把「近大远小」切到「真实 1/z 透视」，观察地砖横缝和体块间距如何向远端自动收紧。",
    });
  }

  if (state.aerialMode === "inverted") {
    errors.push({
      code: "reverse-aerial",
      dim: "aerial",
      badge: `远端抢黑`,
      title: `远端小体块反比近景更黑更锐（近 ${nearContrast.toFixed(1)}:1 < 远 ${farContrast.toFixed(1)}:1）`,
      why: "强对比天生往前跳。把最远的建筑涂成重墨黑，而前景灰白无力时，眼睛会直接被远端黑斑拽平，前中后景彻底翻面。",
      action: "在「近实远虚」中开启「近实远虚阶梯」，让前景压实、远端自然退入冷灰雾面。",
    });
  } else if (state.aerialMode === "flat") {
    errors.push({
      code: "flat-tone",
      dim: "aerial",
      badge: `平灰无层`,
      title: `五座体块明度几乎一致（对比衰减仅 ${contrastDropRatio.toFixed(1)}×），前后黏成一片`,
      why: "只靠线框缩小时，画面仍像工业线稿。缺少近重远轻的明度递减，体块之间缺少空气介质，层次会发闷、发平。",
      action: "切换到「近实远虚阶梯」，拉出前景深炭黑到远景浅雾灰的层次。",
    });
  }

  if (fovDeg > 72) {
    errors.push({
      code: "wide-distortion",
      dim: "cone",
      badge: `广角 ${Math.round(fovDeg)}°`,
      title: `观察视锥过宽（${Math.round(fovDeg)}° / 约 ${equivMm}mm），近景边缘拉伸 ${edgeStretch.toFixed(2)}×`,
      why: "视场角超过经验舒适带（约 30°–72°）相当于把眼睛贴到画纸跟前，边缘投射线斜率暴涨，近景体块和通道会像被吸进漏斗一样变形。",
      action: "把下方「观察视锥（视距）」拉回 30°–72° 舒适带（如 52° 原海报标准视角），顺带看右图视觉金字塔的眼位变化。",
    });
  } else if (fovDeg < 30) {
    errors.push({
      code: "tele-flatten",
      dim: "cone",
      badge: `望远 ${Math.round(fovDeg)}°`,
      title: `视锥过窄（${Math.round(fovDeg)}° / 约 ${equivMm}mm），平行线几乎不再汇聚`,
      why: "眼睛退得太远时，所有退行射线趋近平行，近远高比跌至 " + heightRatio.toFixed(1) + "×，线性透视的纵深张力被压平成近似平行投影。",
      action: "把「观察视锥」调回 30°–72° 区间，重新拉出清晰舒展的汇聚角。",
    });
  }

  if (!horizonOk) {
    errors.push({
      code: "edge-horizon",
      dim: "cone",
      badge: horizonV < 0.22 ? "视平过顶" : "视平过底",
      title: `视平线挤在画面${horizonV < 0.22 ? "顶端" : "底端"}（${Math.round(horizonV * 100)}%），空间失衡`,
      why: "视平线贴边会把天幕或地坪其中一侧挤成细条，汇聚线几乎没有舒展余地。",
      action: "拖动主灭点把视平线拉回画面 22%–78% 的舒展区间。",
    });
  }

  // 总结性正向评价（针对多种正当解给出不同白话解读）
  let okSummary = null;
  if (score === 4) {
    let styleName = "均衡经典解";
    let styleDesc = "所有平行纵线精准收束到视平线同一点，1/z 进深压缩、近实远虚与自然视锥严丝合缝，二维混凝土平面立刻长出可步入的纵深。";
    if (Math.abs(vpMainU - 0.5) >= 0.08) {
      styleName = vpMainU < 0.5 ? "左偏叙事解" : "右偏叙事解";
      styleDesc = `主灭点偏置于画面 ${Math.round(vpMainU * 100)}% 处，既守住单一灭点秩序，又在${vpMainU < 0.5 ? "右侧" : "左侧"}留出整块干净的排字与留白面。`;
    } else if (horizonV >= 0.64) {
      styleName = "低视平线仰望解";
      styleDesc = `视平线压低至 ${Math.round(horizonV * 100)}%，观者像蹲低仰望建筑群，体块高耸挺拔、纪念碑气势十足。`;
    } else if (horizonV <= 0.38) {
      styleName = "高视平线俯览解";
      styleDesc = `视平线抬高至 ${Math.round(horizonV * 100)}%，广场地坪铺展面积大增，中轴路径与空间全局一目了然。`;
    }
    okSummary = {
      styleName,
      title: `空间秩序成立（4/4）· ${styleName}`,
      why: styleDesc,
      action: "可以继续拖移青色主灭点试探偏心或高低视平线，或在右侧切到「视觉金字塔」看透视背后的俯视光路。",
    };
  }

  return {
    vpMainU,
    horizonV,
    vpWallU,
    vpWallV,
    fovDeg,
    equivMm,
    d,
    z0,
    bayPitch,
    blockLen,
    monoliths,
    floorCrossVs,
    runnerHalfWidth,
    convergeAngleDeg,
    vpGap,
    vpHorizErr,
    vpVertErr,
    heightRatio,
    tileCompression,
    edgeStretch,
    nearContrast,
    farContrast,
    contrastDropRatio,
    dims: {
      vanishing: {
        ok: vanishingOk,
        status: vanishingOk
          ? `合一 Δ${Math.round(vpGap * 100)}%`
          : Math.abs(vpVertErr) > 0.025
          ? `悬空 ${Math.round(Math.abs(vpVertErr) * 100)}%`
          : `分叉 ${Math.round(vpGap * 100)}%`,
      },
      depth: {
        ok: depthOk,
        status: depthOk
          ? `1/z · ${heightRatio.toFixed(1)}×`
          : state.depthLaw === "inverse"
          ? `倒大 ${heightRatio.toFixed(2)}×`
          : state.depthLaw === "linear"
          ? `等距 ${heightRatio.toFixed(1)}×`
          : `压扁 ${heightRatio.toFixed(1)}×`,
      },
      direction: {
        ok: coneOk,
        status: coneOk
          ? `${Math.round(fovDeg)}° · 视平 ${Math.round(horizonV * 100)}%`
          : !horizonOk
          ? `视平 ${Math.round(horizonV * 100)}%`
          : fovDeg > 72
          ? `广角 ${Math.round(fovDeg)}°`
          : `望远 ${Math.round(fovDeg)}°`,
      },
      space: {
        ok: aerialOk,
        status: aerialOk
          ? `衰减 ${contrastDropRatio.toFixed(1)}×`
          : state.aerialMode === "inverted"
          ? "远端抢黑"
          : "全域平灰",
      },
    },
    score,
    errors,
    primaryError: errors[0] || null,
    okSummary,
  };
}
