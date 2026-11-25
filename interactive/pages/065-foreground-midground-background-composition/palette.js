// 逐像素取自 site/public/p/065.webp 原海报的色值表与相对亮度对比工具。
// 所有 3D 景片、2D 降级画布与各节插图共用此真源。

export const PALETTE = {
  // 纸面与底色
  creamTop: "#F4E7D3",
  linenLight: "#FAF5EC",
  sageBottom: "#ECEEE6",
  pineDarkRoom: "#0C2E23",

  // 三道标志性层带主色
  fgBand: "#113F30",
  midBand: "#335C87",
  bgBand: "#99B1C7",

  // 主墨与可读字色
  pineInk: "#083626",
  pineInkSoft: "#2B4A41",
  steelInk: "#224870",
  mistInk: "#46647E",
  ochreInk: "#7A5618",

  // 插画主体色
  sunDisc: "#EBD7B7",
  cloudWarm: "#E3D4B5",
  pathSand: "#E0CBA5",
  houseWall: "#CDBDA3",
  houseRoof: "#3E688E",
  circleCream: "#EBDDC4",

  bgPeakFar: "#BDCCD2",
  bgPeakNear: "#92B1C6",
  midHillLight: "#4D7BA3",
  midHillDeep: "#204A6C",
  midTree: "#4C759E",
  fgLeafDark: "#08352A",
  fgLeafMid: "#0D4738",
  fgBushDeep: "#073B30",

  // 克制语义色（仅用于错态与达标校验）
  errLight: "#A93224",
  errDark: "#FF9482",
  okLight: "#14664B",
  okDark: "#7CE2BE",
};

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex([
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ]);
}

export function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const l1 = relLuminance(hexA);
  const l2 = relLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
