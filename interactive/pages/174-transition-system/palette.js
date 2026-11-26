// 174 过渡系统 · 逐像素实采自原海报的冷丁香雾白 × 曜石深墨 × 珊瑚→暖橘→琥珀金三阶暖色熔流
export const PAL = {
  // 原海报底色与浅读纸系
  mistBg: "#E2DEE9",
  mistLight: "#F3F0F7",
  mistMid: "#EAE6F2",
  mistWarm: "#F7F4FA",
  mistSoft: "#EBE6F3",
  // 四块透视展板紫灰面（左浅右深微递进）
  panel1: "#D3CDE0",
  panel2: "#CEC7DC",
  panel3: "#CAC3D8",
  panel4Top: "#C5BFD6",
  panel4Bot: "#BCB5CF",
  panelStroke: "#ACA4C0",
  // 炭曜石深墨与深室
  ink: "#111015",
  inkMuted: "#4A4557",
  darkRoom: "#1C1826",
  darkCard: "#262133",
  darkFooter: "#13101B",
  darkInk: "#F4F1F9",
  darkMuted: "#C2BBD1",
  // 三阶暖色熔流（图形原色 + 浅纸/暗底高对比文字色）
  coral: "#EF7A74",
  coralSoft: "#F4A4A0",
  coralText: "#A82725",
  coralBright: "#FF958E",
  orange: "#F29338",
  orangeSoft: "#F7B56F",
  orangeText: "#944300",
  orangeBright: "#FFB86B",
  gold: "#F7BB42",
  goldSoft: "#FBD57D",
  goldText: "#734B00",
  goldBright: "#FFD46E",
  // 语义辅助色（克制）
  okLight: "#146850",
  okDark: "#6ED9B6",
  errLight: "#AE1F32",
  errDark: "#FF8090",
  // 冲突与平庸试错色
  clashA: "#2E6BE6",
  clashB: "#D93A83",
  clashC: "#2EA866",
  clashD: "#9B4DCA",
  flatGray: "#8B8499",
};

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const bl = Math.round(lerp(b1, b2, t));
  return `rgb(${r},${g},${bl})`;
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
