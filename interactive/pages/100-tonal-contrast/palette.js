// 色彩全部直接取自原海报 100.webp：暖纸白、深炭墨、单点朱红。
export const PALETTE = {
  paper: [239, 231, 220], // #efe7dc
  paperHex: "#efe7dc",
  paperDeep: [227, 217, 203],
  ink: [16, 17, 14], // #10110e
  inkHex: "#10110e",
  red: [180, 61, 29], // #b43d1d
  redHex: "#b43d1d",
  redHi: [216, 84, 49], // #d85431
};

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, t) => a + (b - a) * t;

// 在纸色与炭墨之间按明度 t ∈ [0, 1]（0 = 最暗炭墨，1 = 最亮暖纸）取色，保持海报暖纸色温
export function toneRgb(t) {
  const k = clamp(t, 0, 1);
  return [
    Math.round(lerp(PALETTE.ink[0], PALETTE.paper[0], k)),
    Math.round(lerp(PALETTE.ink[1], PALETTE.paper[1], k)),
    Math.round(lerp(PALETTE.ink[2], PALETTE.paper[2], k)),
  ];
}

// 全范围暗房色阶映射 t ∈ [0, 1]：
//   0.00 = 纯黑 #000000，0.06 = 原海报炭墨 #10110e，0.93 = 原海报暖纸 #efe7dc，1.00 = 纯白 #ffffff
export function levelRgb(t) {
  const v = clamp(t, 0, 1);
  if (v <= 0) return [0, 0, 0];
  if (v >= 1) return [255, 255, 255];
  if (v <= 0.06) {
    const k = v / 0.06;
    return PALETTE.ink.map((c) => Math.round(c * k));
  }
  if (v >= 0.93) {
    const k = (v - 0.93) / 0.07;
    return PALETTE.paper.map((c) => Math.round(lerp(c, 255, k)));
  }
  return toneRgb((v - 0.06) / 0.87);
}

export function rgbCss([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

export function rgbHex([r, g, b]) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function toneHex(t) {
  return rgbHex(toneRgb(t));
}

// 纯中性 sRGB 灰（用于精确 WCAG 标尺与同时对比实验）
export function neutralRgb(t) {
  const v = Math.round(clamp(t, 0, 1) * 255);
  return [v, v, v];
}

// W3C WCAG 2.1 相对亮度与对比度公式
export function relativeLuminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(rgbA, rgbB) {
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
