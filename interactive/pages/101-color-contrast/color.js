// 101 色彩对比 · 纯前端色彩数学与感知模型
// 所有色彩计算（HSL/RGB/HEX、WCAG 2.1 相对亮度、色觉模拟矩阵、歌德–伊顿面积比）均不依赖外部库。

export const POSTER = {
  paper: "#f7f0e5",
  paper2: "#efe6d6",
  paperHi: "#fbf7f0",
  ink: "#10100e",
  inkSoft: "#4f4b44",
  blue: "#0f42d5",
  orange: "#f5590e",
  orangeInk: "#b83b00",
  lens: "#1c1917",
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// HSL (h: 0..360, s: 0..100, l: 0..100) -> [r, g, b] (0..255)
export function hslToRgb(h, s, l) {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (hn < 60) [r, g, b] = [c, x, 0];
  else if (hn < 120) [r, g, b] = [x, c, 0];
  else if (hn < 180) [r, g, b] = [0, c, x];
  else if (hn < 240) [r, g, b] = [0, x, c];
  else if (hn < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function rgbCss([r, g, b], a = 1) {
  return a >= 1 ? `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})` : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

// sRGB -> linear (WCAG 2.1 定义)
function toLinear(c8) {
  const s = clamp(c8, 0, 255) / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function fromLinear(lin) {
  const c = clamp(lin, 0, 1);
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(clamp(s, 0, 1) * 255);
}

export function relativeLuminance(rgb) {
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);
}

export function contrastRatio(rgbA, rgbB) {
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// 自动为色块选出对比度更高的字色（米白纸色或深墨黑）
export function bestInkOn(rgb) {
  const paper = hexToRgb(POSTER.paper);
  const ink = hexToRgb(POSTER.ink);
  return contrastRatio(rgb, paper) >= contrastRatio(rgb, ink) ? POSTER.paper : POSTER.ink;
}

// 线性 RGB 空间的色觉缺陷与灰度模拟（Viénot 1999 简化变换矩阵）
const CVD_MATRICES = {
  // 绿色盲（Deuteranopia）
  deutan: [
    [0.29275, 0.70725, 0.0],
    [0.29275, 0.70725, 0.0],
    [-0.02234, 0.02234, 1.0],
  ],
  // 红色盲（Protanopia）
  protan: [
    [0.11238, 0.88762, 0.0],
    [0.11238, 0.88762, 0.0],
    [0.00401, -0.00401, 1.0],
  ],
};

export function simulateVision(rgb, mode) {
  if (mode === "normal") return rgb;
  const lr = toLinear(rgb[0]);
  const lg = toLinear(rgb[1]);
  const lb = toLinear(rgb[2]);
  if (mode === "gray") {
    const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    const g = fromLinear(y);
    return [g, g, g];
  }
  const m = CVD_MATRICES[mode];
  if (!m) return rgb;
  const nr = m[0][0] * lr + m[0][1] * lg + m[0][2] * lb;
  const ng = m[1][0] * lr + m[1][1] * lg + m[1][2] * lb;
  const nb = m[2][0] * lr + m[2][1] * lg + m[2][2] * lb;
  return [fromLinear(nr), fromLinear(ng), fromLinear(nb)];
}

// 减色混合近似（模仿原海报底部的「蓝圆 + 橙圆 = 交叠深暗」光学/颜料中和感）
export function subtractiveMix(rgbA, rgbB) {
  return [
    Math.round((rgbA[0] * rgbB[0]) / 255 * 0.82 + 12),
    Math.round((rgbA[1] * rgbB[1]) / 255 * 0.82 + 10),
    Math.round((rgbA[2] * rgbB[2]) / 255 * 0.82 + 10),
  ];
}

// ---------- 开场光学仪器模型（状态与读数完全独立于画布实现） ----------
// 原海报基准：冷色钴蓝 (224°, 87%, 45%)，暖色朱橙 (19°, 92%, 51%)。
// 沿色轮向前推进 delta (0°..180°)：当 delta = 155° 时，右色恰好落在海报原汁原味的 #f5590e 附近；
// 为直观易懂，我们映射 delta ∈ [0, 180]：0° = 同色相，30° = 邻近，90° = 中度对比，155°..180° = 强互补（180° 默认锁至海报蓝/橙经典对）。
export const HERO_PRESETS = {
  poster: {
    id: "poster",
    label: "互补 · 海报原色",
    delta: 180,
    sat: 90,
    ratio: 50,
    mono: false,
  },
  analogous: {
    id: "analogous",
    label: "邻近 · 柔和过渡",
    delta: 32,
    sat: 76,
    ratio: 62,
    mono: false,
  },
  warmcool: {
    id: "warmcool",
    label: "冷暖 · 主次拉满",
    delta: 162,
    sat: 86,
    ratio: 70,
    mono: false,
  },
  monochrome: {
    id: "monochrome",
    label: "同色 · 纯靠明度",
    delta: 0,
    sat: 72,
    ratio: 66,
    mono: true,
  },
};

export const SNAP_ANGLES = [0, 30, 90, 150, 180, 210, 270, 330, 360];

export function snapDelta(raw) {
  const d = clamp(Math.round(raw), 0, 360);
  for (const mark of SNAP_ANGLES) {
    if (Math.abs(d - mark) <= 6) return { delta: mark, snapped: true };
  }
  return { delta: d, snapped: false };
}

// 有效色相夹角 sep ∈ [0..180]：180°（轨道正中）为正互补，0° 与 360°（两端）均回到同色
export const hueSep = (delta) => Math.round(180 - Math.abs(clamp(delta, 0, 360) - 180));

// 由仪器状态算出左右两色的 RGB、HEX 及感知指标
export function computeHeroColors(state) {
  const baseH = 224; // 海报钴蓝起点
  const s = clamp(state.sat, 12, 100);
  const d = clamp(state.delta, 0, 360);
  const sep = 180 - Math.abs(d - 180);

  // 全色轮映射：
  //   0°..180° 经青、绿、黄到海报朱橙 (224° -> 19°)
  //   180°..360° 经正红、洋红、紫罗兰回到钴蓝 (19° -> 224°)
  let hB;
  if (d <= 180) {
    hB = ((baseH - (d / 180) * 205) % 360 + 360) % 360;
  } else {
    hB = ((19 - ((d - 180) / 180) * 155) % 360 + 360) % 360;
  }

  // 左色保持稳重的钴蓝明度；同色模式下右色大幅提亮，展示纯明度对比
  const lA = state.mono ? 34 : lerp(46, 44.5, s / 100);
  let lB;
  if (state.mono) {
    lB = 78;
  } else {
    const warmLift = Math.sin((sep / 180) * Math.PI) * 5;
    lB = lerp(45, 51, sep / 180) + warmLift * 0.4;
  }

  // 恰好落在海报默认正互补点 (180°, sat>=88, !mono) 时，精准返回海报采样色
  const exactPoster = !state.mono && Math.abs(d - 180) < 0.6 && state.sat >= 88;
  const rgbA = exactPoster ? hexToRgb(POSTER.blue) : hslToRgb(baseH, s, lA);
  const rgbB = exactPoster ? hexToRgb(POSTER.orange) : hslToRgb(hB, state.mono ? Math.max(24, s * 0.55) : s, lB);

  const hexA = rgbToHex(rgbA);
  const hexB = rgbToHex(rgbB);
  const lens = subtractiveMix(rgbA, rgbB);
  const lumRatio = contrastRatio(rgbA, rgbB);

  const isWarm = (h) => h <= 68 || h >= 315;
  const tempGap = isWarm(hB) && !state.mono;
  const lumDiff = Math.abs(relativeLuminance(rgbA) - relativeLuminance(rgbB));
  const vibrating = !state.mono && sep >= 120 && s >= 78 && lumDiff < 0.14;

  return {
    hA: baseH,
    hB: Math.round(hB),
    sep: Math.round(sep),
    rgbA,
    rgbB,
    hexA,
    hexB,
    lens,
    lensHex: rgbToHex(lens),
    lumRatio,
    tempGap,
    vibrating,
  };
}

export function describeHero(state, colors) {
  const { delta, sat, ratio, mono } = state;
  const { sep, lumRatio, vibrating } = colors;
  const ratioDiff = Math.abs(ratio - 50);
  const redSide = delta > 188;

  let badge = "强互补 · 高张力";
  let status = "strong";
  let headline = "";
  let body = "";
  let note = "";

  if (mono) {
    badge = "同色相 · 纯明度";
    status = "calm";
    headline = "色相为零差，层级全靠深浅拉开";
    body = "左右同属蓝色家族，视线不会跳来跳去，画面安静统一。这更偏向 100 号明暗对比的主场——只要亮度差足够大，不换色相也能分出主次。";
  } else if (sep <= 15) {
    badge = "几乎同色 · 零冲突";
    status = "weak";
    headline = "色相太近，左右快融成一块";
    body = "眼睛找不到落脚点：内圆几乎藏进外圆里。除非刻意做极简底纹，否则这样的配色很难在第一时间抓住注意力。";
  } else if (sep <= 55) {
    badge = "邻近色 · 柔和协调";
    status = "calm";
    headline = redSide ? "蓝紫邻近过渡，深邃而含蓄" : "冷色内部细微过渡，耐看但不够炸";
    body = redSide
      ? "钴蓝滑向靛紫，温差极小、氛围克制，适合沉静的品牌或深色视觉页；想制造强烈行动焦点，还得把色差再推远。"
      : "蓝色滑向青蓝，温差小、冲突低，适合背景氛围、编辑长文或舒缓的品牌页。想让某个按钮一眼跳出来，还得把色差再推远。";
  } else if (sep <= 115) {
    badge = "中度对比 · 活而不噪";
    status = "mid";
    headline = redSide ? "蓝配洋红：潮流张力渐起" : "蓝配青绿：清新节奏拉开";
    body = redSide
      ? "色轮滑向洋红与紫红区间，冷暖开始拉扯，画面显得鲜活摩登，常用于音乐、时尚与潮流视觉。"
      : "蓝与青绿之间已经能一眼分清区域，但又不像互补色那样紧绷。适合多分类信息图、插画主色与辅助色搭配。";
  } else if (sep < 165) {
    badge = "大跨度 · 暖色前推";
    status = "strong";
    headline = redSide ? "钴蓝遇绯红：热烈逼近极值" : "冷暖阵营成形，金黄暖块前推";
    body = redSide
      ? "右侧进入高能量红橙段，冷暖两极剧烈对抗。中央反色内圆格外抢眼，但红蓝亮度接近时要注意避开边缘震颤。"
      : "右侧滑进金黄与暖橙区间，冷色开始往后退、暖色往前跳。中央反色内圆像一颗靶心，把视线牢牢钉在交界线上。";
  } else {
    badge = "互补极值 · 视觉爆点";
    status = "strong";
    headline = "钴蓝撞朱橙：海报原型的最大色相张力";
    body = "色轮相对的两端正面相遇，彼此把对方的鲜艳度推到极值——蓝显得更冷峻，橙显得更炽热。并置时炸裂醒目，重叠时却会中和成深暗色。";
  }

  // 面积与饱和度实时补充解读
  if (sat <= 32) {
    note = `当前饱和度仅 ${sat}%：情绪立刻降温，强互补也被磨成了沉静的灰调；高识别度让位给耐看与平衡。`;
  } else if (ratioDiff <= 8 && sep >= 120) {
    note = `当前面积接近五五分（${ratio}:${100 - ratio}）：两种高能量颜色势均力敌，容易在版面上互相抢戏。试着把面积滑到 70:30，立刻分出主次。`;
  } else if (ratioDiff >= 20) {
    const bigSide = ratio > 50 ? "冷色（左）" : "暖色（右）";
    const smallSide = ratio > 50 ? "暖色（右）" : "冷色（左）";
    note = `当前面积 ${ratio}:${100 - ratio}：${bigSide}退成大背景，${smallSide}缩成小面积爆点——这正是「面积主次让对比更有效」的实战用法。`;
  } else if (vibrating) {
    note = `提示：高饱和（${sat}%）加上两色亮度接近（对比度 ${lumRatio.toFixed(2)}:1），交界处容易产生轻微震颤感。用来做图形冲击很爽，但别直接把这两色叠成小号正文。`;
  } else {
    note = `两色直接相邻的亮度对比度为 ${lumRatio.toFixed(2)}:1（饱和度 ${sat}%，面积 ${ratio}:${100 - ratio}）。`;
  }

  return { badge, status, headline, body, note };
}

// 歌德（1810）光值与伊顿（1961）面积平衡比
export const GOETHE_PAIRS = {
  bo: {
    id: "bo",
    nameA: "钴蓝",
    nameB: "朱橙",
    en: "BLUE × ORANGE",
    hexA: "#0f42d5",
    hexB: "#f5590e",
    lightA: 4,
    lightB: 8,
    idealA: 67, // 蓝 2/3 : 橙 1/3
    ratioLabel: "蓝 2 : 橙 1",
    goetheNote: "歌德给纯橙打光值 8、纯蓝打光值 4（2:1），伊顿反推面积应给蓝约 2/3、橙约 1/3，视觉才不一边倒。",
  },
  vy: {
    id: "vy",
    nameA: "深紫",
    nameB: "明黄",
    en: "VIOLET × YELLOW",
    hexA: "#5824b8",
    hexB: "#f5c400",
    lightA: 3,
    lightB: 9,
    idealA: 75, // 紫 3/4 : 黄 1/4
    ratioLabel: "紫 3 : 黄 1",
    goetheNote: "明黄光值高达 9，深紫只有 3（3:1）。同样面积下黄色会完全淹没紫色；给紫色 3/4、黄色 1/4，画面才会稳下来。",
  },
  gr: {
    id: "gr",
    nameA: "深绿",
    nameB: "正红",
    en: "GREEN × RED",
    hexA: "#168a4d",
    hexB: "#d92b2b",
    lightA: 6,
    lightB: 6,
    idealA: 50, // 绿 1/2 : 红 1/2
    ratioLabel: "绿 1 : 红 1",
    goetheNote: "红与绿在歌德标尺里同为光值 6，等面积时视觉重量相近；但实际排版中 50:50 的纯红绿容易刺眼且对色盲不友好，通常仍要拉开主次。",
  },
};
