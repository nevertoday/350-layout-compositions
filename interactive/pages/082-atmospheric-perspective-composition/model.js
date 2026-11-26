// 082 空气透视构图 · 光学单真源模型（Koschmieder 空气光方程 + Rayleigh / Mie 散射）
// 页面里所有的画布图层着色、四要素圆徽状态、近远景对比值、白话诊断都从 evaluateAtmosphere() 同一份计算得出。

export const LAYERS_META = [
  { id: 0, code: "L1", name: "近景松崖", en: "FOREGROUND", distKm: 0.2 },
  { id: 1, code: "L2", name: "近中山脊", en: "NEAR RIDGE", distKm: 1.4 },
  { id: 2, code: "L3", name: "中景湖岭", en: "MID VALLEY", distKm: 4.2 },
  { id: 3, code: "L4", name: "远景城廓", en: "FAR HORIZON", distKm: 9.5 },
  { id: 4, code: "L5", name: "极远山影", en: "DISTANT PEAKS", distKm: 18.0 },
];

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·山岚远城",
    short: "山岚远城",
    layerNames: ["近景松崖", "近中山脊", "中景湖岭", "远景城廓", "极远山影"],
    baseRgb: [
      [24, 44, 58],
      [34, 56, 74],
      [48, 72, 92],
      [58, 78, 98],
      [70, 86, 102],
    ],
    paperTop: [245, 238, 227],
    skyGlow: [249, 246, 237],
    defaultAirlight: "rayleigh",
  },
  shanshui: {
    id: "shanshui",
    label: "水墨·平远江山",
    short: "平远江山",
    layerNames: ["近岸古松", "江渚亭崖", "中景烟峦", "远浦平岗", "缥缈远峰"],
    baseRgb: [
      [26, 36, 40],
      [38, 51, 56],
      [54, 68, 74],
      [68, 82, 88],
      [82, 94, 98],
    ],
    paperTop: [244, 238, 225],
    skyGlow: [249, 244, 232],
    defaultAirlight: "mie",
  },
  sunset: {
    id: "sunset",
    label: "晚霞·暖雾峡谷",
    short: "暖雾峡谷",
    layerNames: ["逆光近崖", "深谷暗脊", "暮色中岭", "霞光远壁", "余晖残峰"],
    baseRgb: [
      [36, 30, 48],
      [54, 44, 66],
      [76, 62, 82],
      [96, 76, 88],
      [112, 88, 94],
    ],
    paperTop: [247, 232, 214],
    skyGlow: [252, 226, 196],
    defaultAirlight: "sunset",
  },
};

export const AIRLIGHTS = {
  rayleigh: {
    id: "rayleigh",
    label: "瑞利清岚",
    en: "RAYLEIGH",
    desc: "空气分子按波长四次方反比优先散射短波蓝紫光，远景向清冷蓝灰天光靠拢。",
    skyRgb: [232, 235, 242],
    horizonRgb: [244, 241, 236],
    k: [0.85, 1.0, 1.24],
    tintName: "清冷蓝紫",
  },
  mie: {
    id: "mie",
    label: "米氏乳雾",
    en: "MIE MIST",
    desc: "水汽微滴与较大气溶胶对各色光近似均等散射，远山化作温润乳白烟岚。",
    skyRgb: [241, 239, 234],
    horizonRgb: [246, 243, 237],
    k: [0.98, 1.0, 1.02],
    tintName: "乳白烟雾",
  },
  sunset: {
    id: "sunset",
    label: "晚霞暖光",
    en: "GOLDEN HAZE",
    desc: "低仰角夕阳穿过厚大气层照亮尘雾，空气光偏暖金杏色，远山随之暖亮。",
    skyRgb: [244, 214, 186],
    horizonRgb: [249, 229, 206],
    k: [0.92, 1.02, 1.15],
    tintName: "暖金余霞",
  },
  vacuum: {
    id: "vacuum",
    label: "真空无气",
    en: "NO AIR",
    desc: "模拟月球般无大气环境：光线沿途既不衰减也无空气光叠加，远近对比度完全一样。",
    skyRgb: [232, 235, 242],
    horizonRgb: [245, 238, 227],
    k: [0, 0, 0],
    tintName: "无散射",
  },
};

export const EDGE_MODES = {
  natural: { id: "natural", label: "自然递减", desc: "近景针叶岩棱锐利，远景逐层柔化隐去琐碎（远山无皴）。" },
  oversharp: { id: "oversharp", label: "全景过锐", desc: "连 18 公里外的远山都勾出硬黑锯齿，割裂空气感。" },
  nearblur: { id: "nearblur", label: "近景失焦", desc: "近景与远景一同糊散，失去清晰的前景落脚点。" },
};

// 开场刻意处于复合错态：零散射粘连 + 远景城廓明度倒挂压深抢饱和 + 全景过锐
export function createInitialState() {
  return {
    scene: "poster",
    turbidity: 0.01,
    airlight: "rayleigh",
    edgeMode: "oversharp",
    selectedLayer: 3,
    layerToneBias: [0, 0.05, 0.09, -0.26, -0.05],
    layerSatBias: [0, 0, 0, 0.38, 0.14],
    showDepthGuides: false,
  };
}

export const PRESETS = {
  poster: {
    label: "原海报·清岚解",
    kind: "good",
    patch: {
      scene: "poster",
      turbidity: 0.115,
      airlight: "rayleigh",
      edgeMode: "natural",
      layerToneBias: [0, 0, 0, 0, 0],
      layerSatBias: [0, 0, 0, 0, 0],
    },
  },
  crisp: {
    label: "晴日·薄雾解",
    kind: "good",
    patch: {
      turbidity: 0.068,
      airlight: "rayleigh",
      edgeMode: "natural",
      layerToneBias: [-0.03, 0, 0.02, 0.04, 0.06],
      layerSatBias: [0.05, 0, 0, -0.04, -0.06],
    },
  },
  misty: {
    label: "烟雨·浓岚解",
    kind: "good",
    patch: {
      scene: "shanshui",
      turbidity: 0.205,
      airlight: "mie",
      edgeMode: "natural",
      layerToneBias: [-0.02, 0, 0, 0, 0],
      layerSatBias: [0, 0, 0, 0, 0],
    },
  },
  golden: {
    label: "晚霞·暖雾解",
    kind: "good",
    patch: {
      scene: "sunset",
      turbidity: 0.125,
      airlight: "sunset",
      edgeMode: "natural",
      layerToneBias: [-0.04, 0, 0, 0.02, 0.03],
      layerSatBias: [0.04, 0, 0, 0, 0],
    },
  },
  errVacuum: {
    label: "试错：真空贴纸",
    kind: "bad",
    patch: {
      turbidity: 0.0,
      airlight: "vacuum",
      edgeMode: "oversharp",
      layerToneBias: [0, 0, 0, 0, 0],
      layerSatBias: [0, 0, 0, 0, 0],
    },
  },
  errWhiteout: {
    label: "试错：白雾吞没",
    kind: "bad",
    patch: {
      turbidity: 0.39,
      airlight: "mie",
      edgeMode: "natural",
      layerToneBias: [0, 0, 0, 0, 0],
      layerSatBias: [0, 0, 0, 0, 0],
    },
  },
  errInvert: {
    label: "试错：远城倒挂",
    kind: "bad",
    patch: {
      turbidity: 0.10,
      airlight: "rayleigh",
      edgeMode: "natural",
      layerToneBias: [0.24, 0.10, 0.08, -0.38, -0.05],
      layerSatBias: [-0.15, 0, 0, 0.44, 0],
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function rgbToHex([r, g, b]) {
  const h = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// sRGB 感知明度（0..100%）与饱和度（0..100%）
export function rgbToLuma(rgb) {
  const [r, g, b] = rgb.map((v) => clamp(v, 0, 255) / 255);
  // 简化感知明度（Rec.709 伽马空间亮度近似，更符合画家读明度阶）
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) * 100;
}

export function rgbToSat(rgb) {
  const r = clamp(rgb[0], 0, 255) / 255;
  const g = clamp(rgb[1], 0, 255) / 255;
  const b = clamp(rgb[2], 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 1e-4) return 0;
  // Chroma-weighted saturation: dark & near-white grays read as low visual colorfulness
  const l = (max + min) / 2;
  const d = max - min;
  const hslSat = d / (1 - Math.abs(2 * l - 1) + 1e-6);
  // Multiply slightly by chroma so pale fog reads truly desaturated
  return clamp((d * 0.65 + hslSat * 0.35) * 100, 0, 100);
}

export function rgbToHsl(rgb) {
  const r = clamp(rgb[0], 0, 255) / 255;
  const g = clamp(rgb[1], 0, 255) / 255;
  const b = clamp(rgb[2], 0, 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

export function hslToRgb([h, s, l]) {
  const hue2rgb = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [clamp(r * 255, 0, 255), clamp(g * 255, 0, 255), clamp(b * 255, 0, 255)];
}

// 对单层施加固有色明度/饱和度偏置后再走科施米德空气光方程
export function computeLayerColor(baseRgb, distKm, turbidity, air, toneBias = 0, satBias = 0) {
  // 1. 先按用户对单层的固有明度/彩度偏置调节原始表面色
  let [h, s, l] = rgbToHsl(baseRgb);
  l = clamp(l + toneBias * 0.72, 0.04, 0.94);
  s = clamp(s + satBias * 0.85, 0.0, 0.95);
  const localRgb = hslToRgb([h, s, l]);

  // 2. Koschmieder 空气光方程（分 R/G/B 通道散射系数）
  //    I(d) = I_local * exp(-beta * k * d) + I_air * (1 - exp(-beta * k * d))
  const effBeta = air.id === "vacuum" ? 0 : Math.max(0, turbidity);
  const T = [
    Math.exp(-effBeta * air.k[0] * distKm),
    Math.exp(-effBeta * air.k[1] * distKm),
    Math.exp(-effBeta * air.k[2] * distKm),
  ];
  const out = [
    localRgb[0] * T[0] + air.skyRgb[0] * (1 - T[0]),
    localRgb[1] * T[1] + air.skyRgb[1] * (1 - T[1]),
    localRgb[2] * T[2] + air.skyRgb[2] * (1 - T[2]),
  ];

  // 如果用户对单层进行了强烈的压深/高饱和人为手绘涂改（例如画师硬把远城涂黑涂蓝），
  // 在空气层之后叠加一部分"画师违背光学的直接重涂权重"，确保即使在高浊度下倒挂依然可见可复现
  const paintOverride = toneBias < -0.15 || satBias > 0.15 ? 0.58 : 0.22;
  let [oh, os, ol] = rgbToHsl(out);
  ol = clamp(ol + toneBias * paintOverride * 0.55, 0.05, 0.96);
  os = clamp(os + satBias * (satBias > 0 ? 0.65 : 0.35), 0.0, 0.95);
  const finalRgb = hslToRgb([oh, os, ol]);

  const meanT = (T[0] + T[1] + T[2]) / 3;
  return {
    localRgb,
    rgb: finalRgb,
    hex: rgbToHex(finalRgb),
    transmittance: meanT,
    airlightRatio: 1 - meanT,
    luma: rgbToLuma(finalRgb),
    sat: rgbToSat(finalRgb),
    opticalDepth: effBeta * distKm,
  };
}

// 供第 01 节光程实验复用：给定距离 d、浊度 beta、散射类型，返回透射率、空气光占比与采样色
export function sampleOpticalPath(distKm, turbidity, airId = "rayleigh") {
  const air = AIRLIGHTS[airId] || AIRLIGHTS.rayleigh;
  const darkPine = [24, 44, 58];
  const res = computeLayerColor(darkPine, distKm, turbidity, air, 0, 0);
  // WMO 气象光学视程 MOR（5% 对比度阈值：-ln(0.05)/β ≈ 2.996/β）
  const visKm = air.id === "vacuum" || turbidity <= 0.002 ? Infinity : 2.996 / turbidity;
  return {
    distKm,
    turbidity,
    air,
    meanTransmittance: res.transmittance,
    transmittancePct: Math.round(res.transmittance * 100),
    airlightPct: 100 - Math.round(res.transmittance * 100),
    lumaPct: Math.round(res.luma),
    satPct: Math.round(res.sat),
    hex: res.hex,
    rgb: res.rgb,
    visibilityKm: visKm,
  };
}

// 单真源全面评估：所有画布视觉、右侧四圆徽、底沿近远景对比、诊单白话都来自这里
export function evaluateAtmosphere(state) {
  const scene = SCENES[state.scene] || SCENES.poster;
  const air = AIRLIGHTS[state.airlight] || AIRLIGHTS.rayleigh;
  const edge = EDGE_MODES[state.edgeMode] || EDGE_MODES.natural;
  const effBeta = air.id === "vacuum" ? 0 : clamp(state.turbidity, 0, 0.45);

  const layers = LAYERS_META.map((m, i) => {
    const toneBias = state.layerToneBias?.[i] || 0;
    const satBias = state.layerSatBias?.[i] || 0;
    const calc = computeLayerColor(scene.baseRgb[i], m.distKm, effBeta, air, toneBias, satBias);

    // 边缘柔化度（0 = 极锐利，1 = 柔和雾化）
    let softness;
    if (edge.id === "oversharp") {
      softness = 0.05; // 全部硬锯齿
    } else if (edge.id === "nearblur") {
      softness = clamp(0.68 + i * 0.06, 0.65, 0.95); // 近景也糊
    } else {
      // 自然递减：随空气光占比和距离自然柔和
      softness = clamp(i * 0.14 + calc.airlightRatio * 0.48, 0.02, 0.94);
    }

    // 与天光的局部对比度（0..100%）
    const skyLuma = rgbToLuma(air.horizonRgb);
    const skyContrast = Math.abs(skyLuma - calc.luma);

    return {
      ...m,
      name: scene.layerNames[i],
      toneBias,
      satBias,
      ...calc,
      softness,
      skyContrast,
    };
  });

  const near = layers[0];
  const mid = layers[2];
  const farCity = layers[3];
  const farPeak = layers[4];

  const lumaSpan = farPeak.luma - near.luma;
  const nearFarContrastRatio = farCity.skyContrast > 1 ? near.skyContrast / farCity.skyContrast : 99;
  const visibilityKm = effBeta <= 0.002 ? Infinity : 2.996 / effBeta;

  // 检查相邻两层是否有明度倒挂（远层反而比近层暗超过 2.5%）
  const inversions = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const diff = layers[i + 1].luma - layers[i].luma;
    if (diff < -2.5) {
      inversions.push({
        nearIdx: i,
        farIdx: i + 1,
        nearLayer: layers[i],
        farLayer: layers[i + 1],
        drop: Math.abs(diff),
      });
    }
  }
  // 同时检查任意远层（L4/L5）是否比 L2/L3 暗
  if (!inversions.length) {
    for (let farIdx = 2; farIdx < layers.length; farIdx++) {
      for (let nearIdx = 0; nearIdx < farIdx; nearIdx++) {
        const diff = layers[farIdx].luma - layers[nearIdx].luma;
        if (diff < -3.0) {
          inversions.push({
            nearIdx,
            farIdx,
            nearLayer: layers[nearIdx],
            farLayer: layers[farIdx],
            drop: Math.abs(diff),
          });
          break;
        }
      }
      if (inversions.length) break;
    }
  }

  // 检查中间相邻层是否过度粘连（ΔL < 4% 且非白雾）
  let crampedPairs = 0;
  for (let i = 0; i < layers.length - 1; i++) {
    if (Math.abs(layers[i + 1].luma - layers[i].luma) < 4.5) crampedPairs++;
  }

  // 检查是否白雾吞没（中远三层被洗进高明度窄带）
  const whiteout = effBeta > 0.275 || (mid.luma > 81 && farCity.luma > 88 && (farPeak.luma - mid.luma) < 9);
  const vacuumFlat = effBeta < 0.032 && lumaSpan < 26;
  const nearTooPale = near.luma > 38;
  const airSat = rgbToSat(air.skyRgb);
  const satCeiling = Math.max(near.sat, airSat) + 8;
  const farSatExcess = Math.max(farCity.sat, farPeak.sat) > satCeiling || (state.layerSatBias?.[3] || 0) > 0.16 || (state.layerSatBias?.[4] || 0) > 0.18;
  const overSharpFar = edge.id === "oversharp";
  const nearBlurErr = edge.id === "nearblur";

  // 汇总 7 类真实双向光学错态（按严重度排序）
  const issues = [];
  if (inversions.length > 0) {
    const inv = inversions[0];
    issues.push({
      code: "inversion",
      severity: 10,
      element: "value",
      badge: `明度倒挂 · ${inv.farLayer.code} 压深`,
      title: `${inv.farLayer.distKm} km 的「${inv.farLayer.name}」比更近的「${inv.nearLayer.name}」还深 ${Math.round(inv.drop)}%`,
      why: `空气透视里，远处物体多隔了一段散射空气，白天的明度应当逐层向天光抬升。现在 ${inv.farLayer.code}（明度 ${Math.round(inv.farLayer.luma)}%）反而暗过 ${inv.nearLayer.code}（${Math.round(inv.nearLayer.luma)}%），眼睛会本能把远景读成贴在眼前的剪影，前后关系直接翻车。`,
      action: `点选画布里的「${inv.farLayer.name}」向上提亮，或直接复位各层固有明度偏置。`,
      fixLabel: `提亮 ${inv.farLayer.code} 消除倒挂`,
      fixType: "fixInversion",
    });
  }
  if (vacuumFlat) {
    issues.push({
      code: "vacuum",
      severity: 9,
      element: "atmosphere",
      badge: `散射过低 · β=${effBeta.toFixed(2)}`,
      title: `空气散射近乎归零，五层山景粘成了一张扁平贴纸`,
      why: `当前浊度仅 ${effBeta.toFixed(2)} /km，从 0.2 km 近崖到 18 km 远峰明度跨度只有 ${Math.round(lumaSpan)}%。没有空气光在中间托开反差，哪怕画了五道山脊，画面依然像叠在一起的深色纸板。`,
      action: `在画布上向右横拖注入空气散射（推到 β = 0.06–0.22 /km 区间），亲眼看远城与远山逐层退后。`,
      fixLabel: "注入清岚至 β=0.115",
      fixType: "fixVacuum",
    });
  }
  if (whiteout) {
    issues.push({
      code: "whiteout",
      severity: 8,
      element: "layers",
      badge: `白雾过浓 · β=${effBeta.toFixed(2)}`,
      title: `浓雾把中景与远景一起洗白，中间层次全部消失`,
      why: `浊度拉到 ${effBeta.toFixed(2)} /km 时，能见度跌破 ${visibilityKm.toFixed(1)} km，4.2 km 中岭（明度 ${Math.round(mid.luma)}%）和 9.5 km 远城（${Math.round(farCity.luma)}%）挤在极窄的高亮带里融成一片奶白，只剩近崖孤零零飘在雾前。`,
      action: `在画布上向左横拖削薄雾气，把中景与远城重新释放出清晰的灰阶步距。`,
      fixLabel: "散开浓雾回到清岚",
      fixType: "fixWhiteout",
    });
  }
  if (nearTooPale) {
    issues.push({
      code: "nearPale",
      severity: 7,
      element: "value",
      badge: `近景发灰 · L1 ${Math.round(near.luma)}%`,
      title: `近景松崖被提得太浅（明度 ${Math.round(near.luma)}%），整幅画失去压阵锚点`,
      why: `近景只隔了 0.2 km 空气，理应保有最深的暗部与最强反差。把近景也洗灰后，整个五阶明度梯被压扁在浅灰区，远景再怎么退也拉不开距离感。`,
      action: `选中 L1 近景松崖把明度压回 32% 以下，重新建立「近深远浅」的参照原点。`,
      fixLabel: "压实近景暗部锚点",
      fixType: "fixNearPale",
    });
  }
  if (farSatExcess) {
    issues.push({
      code: "farSat",
      severity: 6,
      element: "saturation",
      badge: `远景抢彩 · ${Math.round(farCity.sat)}%`,
      title: `远景彩度（${Math.round(farCity.sat)}%）反超近景，高饱和色把背景往前拉`,
      why: `空气散射会把远处的纯色不断冲灰。如果远景城廓或远山比近景还鲜艳，视觉注意力会被强彩吸到背景上，削弱空间退远感。`,
      action: `降低远景层的彩度偏置，或增加自然大气散射让远色柔和退灰。`,
      fixLabel: "退灰远景彩度",
      fixType: "fixFarSat",
    });
  }
  if (overSharpFar) {
    issues.push({
      code: "oversharp",
      severity: 5,
      element: "atmosphere",
      badge: "远景过锐",
      title: "远山与远城仍保留硬锯齿轮廓，违背「远山无皴」",
      why: "空气微粒不仅提亮远景，还会散射抹平细小边缘。连 18 km 外的远峰都画满生硬锐边时，轮廓的锐利信号会和浅灰明度打架，让远山显得像贴上去的矢量剪贴画。",
      action: "将细节锐度切回「自然递减」，把清晰松针留给近景，把柔和轮廓还给远方。",
      fixLabel: "切回自然锐度递减",
      fixType: "fixEdge",
    });
  }
  if (nearBlurErr) {
    issues.push({
      code: "nearblur",
      severity: 5,
      element: "atmosphere",
      badge: "近景失焦",
      title: "近景松崖一同糊散，整幅画缺少清晰落脚点",
      why: "空气透视靠的是「近清晰、远柔和」的梯度对比；如果前景也模糊一片，观者会觉得像镜头起雾或没对上焦，反而读不出远近层次。",
      action: "切回「自然递减」，恢复近景松针与岩壁的锐利质感。",
      fixLabel: "恢复近景锐利",
      fixType: "fixEdge",
    });
  }
  if (!issues.length && (lumaSpan < 34 || crampedPairs >= 2)) {
    issues.push({
      code: "weakSpan",
      severity: 4,
      element: "layers",
      badge: `阶差偏窄 · Δ${Math.round(lumaSpan)}%`,
      title: `近远明度跨度偏小（仅 ${Math.round(lumaSpan)}%），层次还不够舒展`,
      why: `虽然没有明显倒挂，但五层之间的明度阶梯挤得偏近，空间纵深感仍显得拘谨。`,
      action: `向右微调画布浊度，或略微压深 L1 近景松崖以拉宽整条明度梯。`,
      fixLabel: "拉开五层明度阶差",
      fixType: "fixVacuum",
    });
  }

  // 右侧原海报四要素（层次 / 明度 / 饱和度 / 空气感）各自独立实况状态
  const layersOk = !whiteout && !vacuumFlat && inversions.length === 0 && crampedPairs < 2;
  const valueOk = inversions.length === 0 && !nearTooPale && lumaSpan >= 34;
  const satOk = !farSatExcess && farPeak.sat <= Math.max(near.sat, airSat) + 6;
  const atmoOk = !vacuumFlat && !whiteout && !overSharpFar && !nearBlurErr;

  const passedCount = [layersOk, valueOk, satOk, atmoOk].filter(Boolean).length;
  const isSolved = issues.length === 0 && passedCount === 4;

  // 解法风格辨识（支持多组合法解，不止唯一答案）
  let solutionStyle = "";
  if (isSolved) {
    if (air.id === "sunset") solutionStyle = "晚霞暖雾解";
    else if (effBeta < 0.088) solutionStyle = "晴日薄雾解";
    else if (effBeta > 0.175) solutionStyle = "烟雨浓岚解";
    else solutionStyle = "清岚标准解";
  }

  const primary = issues[0] || null;
  const verdict = isSolved
    ? {
        ok: true,
        badge: `4/4 成立 · ${solutionStyle}`,
        title: `五层山岚步距匀称（${Math.round(near.luma)}% → ${Math.round(farPeak.luma)}%），纵深自然透出`,
        why: `前景松崖以 ${Math.round(near.luma)}% 深调压阵、边缘锐利；随距离推至 18 km，${air.label}让反差按指数衰减至远峰 ${Math.round(farPeak.luma)}%，彩度由 ${Math.round(near.sat)}% 渐退至 ${Math.round(farPeak.sat)}%，符合「拉开距离、软化远景」的空气透视规律。`,
        action: `可以继续横拖测试薄雾（β≈0.07）与浓岚（β≈0.20）的不同氛围，或点选任意层故意压暗制造倒挂。`,
        fixLabel: "",
        fixType: "",
      }
    : {
        ok: false,
        badge: `${issues.length} 处待调 · ${primary.badge}`,
        title: primary.title,
        why: primary.why,
        action: primary.action,
        fixLabel: primary.fixLabel,
        fixType: primary.fixType,
      };

  // 四要素圆徽实时读数
  const elements = [
    {
      key: "layers",
      zh: "层次",
      en: "LAYERS",
      posterBody: "远处物体被空气遮挡，逐层退后。",
      ok: layersOk,
      status: whiteout ? "浓雾吞层" : vacuumFlat ? "五层粘连" : inversions.length ? "顺序错乱" : `${passedCount === 4 ? "五阶清晰" : "层阶拉开"}`,
      metric: `跨度 Δ${Math.round(lumaSpan)}%`,
    },
    {
      key: "value",
      zh: "明度",
      en: "VALUE",
      posterBody: "距离越远，明度越高，反差变小。",
      ok: valueOk,
      status: inversions.length ? `${inversions[0].farLayer.code} 倒挂` : nearTooPale ? "近景发灰" : lumaSpan < 34 ? "梯度偏窄" : "逐层抬升",
      metric: `${Math.round(near.luma)}% → ${Math.round(farPeak.luma)}%`,
    },
    {
      key: "saturation",
      zh: "饱和度",
      en: "SATURATION",
      posterBody: "距离越远，颜色越灰，饱和度降低。",
      ok: satOk,
      status: farSatExcess ? "远景抢彩" : "渐退柔和",
      metric: `${Math.round(near.sat)}% → ${Math.round(farPeak.sat)}%`,
    },
    {
      key: "atmosphere",
      zh: "空气感",
      en: "ATMOSPHERE",
      posterBody: "空气中的微粒让远景更柔和、轻盈。",
      ok: atmoOk,
      status: overSharpFar ? "远景过锐" : nearBlurErr ? "近景失焦" : vacuumFlat ? "真空生硬" : whiteout ? "过浓白茫" : `${air.label}`,
      metric: `β ${effBeta.toFixed(2)}`,
    },
  ];

  // 深度感知档位（遵循 BRIEF：示意性综合评估只报档位，不报假精确百分比）
  const depthGrade = isSolved
    ? effBeta > 0.17
      ? "深远 · 烟岚意境（示意）"
      : effBeta < 0.088
        ? "清朗 · 远目通透（示意）"
        : "匀称 · 五层立体（示意）"
    : inversions.length
      ? "错乱 · 前后倒挂（示意）"
      : whiteout
        ? "断层 · 白雾吞没（示意）"
        : "扁平 · 缺乏纵深（示意）";

  return {
    scene,
    air,
    edge,
    effBeta,
    visibilityKm,
    layers,
    near,
    mid,
    farCity,
    farPeak,
    lumaSpan,
    nearFarContrastRatio,
    inversions,
    issues,
    elements,
    passedCount,
    isSolved,
    solutionStyle,
    depthGrade,
    verdict,
  };
}

// 响应诊单里的"单步纠偏"按钮，每次只修当前最紧迫的一项错态，让用户看清每一步的物理变化
export function applySingleStepFix(state, fixType) {
  const next = {
    ...state,
    layerToneBias: [...state.layerToneBias],
    layerSatBias: [...state.layerSatBias],
  };
  if (fixType === "fixInversion") {
    next.layerToneBias = [0, 0, 0, 0, 0];
    next.layerSatBias = next.layerSatBias.map((v, i) => (i >= 3 ? Math.min(0, v) : v));
  } else if (fixType === "fixVacuum") {
    if (next.airlight === "vacuum") next.airlight = SCENES[next.scene]?.defaultAirlight || "rayleigh";
    next.turbidity = 0.115;
    if (next.layerToneBias[0] > 0.08) next.layerToneBias[0] = 0;
  } else if (fixType === "fixWhiteout") {
    next.turbidity = 0.125;
  } else if (fixType === "fixNearPale") {
    next.layerToneBias[0] = 0;
  } else if (fixType === "fixFarSat") {
    next.layerSatBias[3] = 0;
    next.layerSatBias[4] = 0;
  } else if (fixType === "fixEdge") {
    next.edgeMode = "natural";
  }
  return next;
}
