// 110 渐变组织 · 色彩科学单源引擎（sRGB ↔ Linear ↔ Oklab / Oklch + WCAG 对比度）
// 矩阵系数源自 Björn Ottosson (2020) "A perceptual color space for image processing"

export const POSTER_PALETTE = {
  railPaper: "#F6EFE3",
  ivoryPaper: "#FAF6EE",
  mistPaper: "#F3EEF9",
  sandPaper: "#F6EBDC",
  ink: "#141218",
  inkSoft: "#4A4352",
  darkPlum: "#1B1326",
  darkPlumCard: "#261B35",
  lilacBg: "#D0B1EE",
  roseBg: "#EBCBE4",
  peachBg: "#FBD4C0",
  apricotBg: "#FDCE87",
  violet: "#8D62C8",
  rose: "#E8708E",
  orange: "#F55B1E",
  gold: "#EEAC4A",
  ok: "#116A58",
  okBright: "#6EE0C5",
  warn: "#B5261A",
  warnBright: "#FF8A75",
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function hexToRgb(hex) {
  const s = hex.replace("#", "").trim();
  const n = parseInt(s.length === 3 ? s.replace(/(.)/g, "$1$1") : s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  const f = (v) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`.toUpperCase();
}

export function rgbToCss({ r, g, b }, a = 1) {
  const rr = Math.round(clamp01(r / 255) * 255);
  const gg = Math.round(clamp01(g / 255) * 255);
  const bb = Math.round(clamp01(b / 255) * 255);
  return a >= 0.999 ? `rgb(${rr},${gg},${bb})` : `rgba(${rr},${gg},${bb},${clamp01(a).toFixed(3)})`;
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v) {
  const c = clamp01(v);
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return clamp01(s) * 255;
}

export function rgbToOklab({ r, g, b }) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(Math.max(0, l));
  const m_ = Math.cbrt(Math.max(0, m));
  const s_ = Math.cbrt(Math.max(0, s));
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklabToRgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

export function oklabToOklch({ L, a, b }) {
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

export function oklchToOklab({ L, C, H }) {
  const rad = (H * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

export function hexToOklch(hex) {
  return oklabToOklch(rgbToOklab(hexToRgb(hex)));
}

// 统一插值函数：支持 srgb（直接通道混合，跨色相易发灰）、oklab（感知直线）、oklch（保彩度弧线）
export function interpolateColor(hexA, hexB, t, space = "oklch") {
  const u = clamp01(t);
  const A = hexToRgb(hexA);
  const B = hexToRgb(hexB);
  if (space === "srgb") {
    return {
      r: A.r + (B.r - A.r) * u,
      g: A.g + (B.g - A.g) * u,
      b: A.b + (B.b - A.b) * u,
    };
  }
  const labA = rgbToOklab(A);
  const labB = rgbToOklab(B);
  if (space === "oklab") {
    return oklabToRgb({
      L: labA.L + (labB.L - labA.L) * u,
      a: labA.a + (labB.a - labA.a) * u,
      b: labA.b + (labB.b - labA.b) * u,
    });
  }
  const lchA = oklabToOklch(labA);
  const lchB = oklabToOklch(labB);
  let dH = lchB.H - lchA.H;
  if (dH > 180) dH -= 360;
  if (dH < -180) dH += 360;
  return oklabToRgb(
    oklchToOklab({
      L: lchA.L + (lchB.L - lchA.L) * u,
      C: lchA.C + (lchB.C - lchA.C) * u,
      H: (lchA.H + dH * u + 360) % 360,
    })
  );
}

// 实测中段彩度留存率：中点 t=0.5 处的 Oklab 彩度 / 端点平均彩度
export function midChromaRetention(hexA, hexB, space = "oklch") {
  const cA = hexToOklch(hexA).C;
  const cB = hexToOklch(hexB).C;
  const midRgb = interpolateColor(hexA, hexB, 0.5, space);
  const cMid = oklabToOklch(rgbToOklab(midRgb)).C;
  const avg = (cA + cB) / 2;
  return avg > 1e-4 ? cMid / avg : 1;
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexToRgb(hexA));
  const l2 = relativeLuminance(hexToRgb(hexB));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 混合前景半透明色到背景上（用于真实计算渐变浅底上的可读对比度）
export function blendOver(fgHex, bgHex, alpha = 1) {
  const f = hexToRgb(fgHex);
  const b = hexToRgb(bgHex);
  return {
    r: f.r * alpha + b.r * (1 - alpha),
    g: f.g * alpha + b.g * (1 - alpha),
    b: f.b * alpha + b.b * (1 - alpha),
  };
}
