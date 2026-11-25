// 125 疏密对比原则 · 逐像素取自原海报 (site/public/p/125.webp) 的五段疏密色谱

export const PALETTE = {
  paper: "#FCFBF4",
  paperPure: "#FFFFFF",
  paperSand: "#F4EFE5",
  paperBlueMist: "#EEF2F8",
  paperGreenMist: "#ECF4EE",
  ink: "#0A0B0A",
  inkMuted: "#3C4047",
  rule: "#181B20",
  ruleSoft: "#D8D2C6",

  // 原海报五色：最密 → 次密 → 过渡 → 渐疏 → 极疏
  navy: "#152D5B",
  navyDark: "#0E1F42",
  green: "#15582B",
  greenDark: "#0F3520",
  orange: "#EA5604",
  orangeText: "#B53E00",
  pink: "#F891A6",
  pinkText: "#A32648",
  sand: "#D6C9B6",
  sandText: "#5E5446",

  // 均匀平铺时的中性滞重色
  flatMid: "#6D7B72",
  warn: "#B42318",
  ok: "#15582B",
};

const STOPS = [
  { t: 0.0, rgb: [214, 201, 182] }, // 极疏：暖沙米 #D6C9B6
  { t: 0.28, rgb: [248, 145, 166] }, // 渐疏：樱桃粉 #F891A6
  { t: 0.54, rgb: [234, 86, 4] },    // 过渡：朱橘橙 #EA5604
  { t: 0.78, rgb: [21, 88, 43] },    // 次密：深松绿 #15582B
  { t: 1.0, rgb: [21, 45, 91] },     // 最密：深靛蓝 #152D5B
];

const lerp = (a, b, t) => a + (b - a) * t;

// 根据单颗粒子的实测局部密度与全局分化度，映射原海报五色
// differentiation ∈ [0, 1]：均质平铺时偏向沉闷灰绿，一旦拉开疏密就绽放原海报五色
export function colorForDensity(normDensity, differentiation = 1) {
  const x = Math.max(0, Math.min(1, normDensity));
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (x >= STOPS[i].t && x <= STOPS[i + 1].t) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = Math.max(1e-4, hi.t - lo.t);
  const f = (x - lo.t) / span;
  const r0 = lerp(lo.rgb[0], hi.rgb[0], f);
  const g0 = lerp(lo.rgb[1], hi.rgb[1], f);
  const b0 = lerp(lo.rgb[2], hi.rgb[2], f);

  // 分化极弱（如均质平铺）时，向沉闷均质绿灰靠拢，让「没有对比」一眼可见
  const d = Math.max(0, Math.min(1, differentiation));
  const flat = [109, 123, 114];
  const r = Math.round(lerp(flat[0], r0, d));
  const g = Math.round(lerp(flat[1], g0, d));
  const b = Math.round(lerp(flat[2], b0, d));
  return `rgb(${r},${g},${b})`;
}

// 5 个离散色阶名称（供剖面与标注使用）
export function tierForDensity(normDensity) {
  if (normDensity >= 0.78) return { key: "navy", color: PALETTE.navy, label: "最密核" };
  if (normDensity >= 0.56) return { key: "green", color: PALETTE.green, label: "次密层" };
  if (normDensity >= 0.36) return { key: "orange", color: PALETTE.orange, label: "渐变带" };
  if (normDensity >= 0.16) return { key: "pink", color: PALETTE.pink, label: "渐疏区" };
  return { key: "sand", color: PALETTE.sand, label: "呼吸余白" };
}
