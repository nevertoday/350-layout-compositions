// 逐像素实采自 066 原海报（site/public/p/066.webp）的色彩登记表
export const PALETTE = {
  // 纸面与画心底色
  paperCream: "#F8EADC",      // 原海报主米纸底
  paperLight: "#FBF3EA",      // 洁净浅宣展节
  paperMist: "#F2DFD1",       // 柔玫瑰雾纸
  archInner: "#F6EBDC",       // 拱门内框米白底

  // 粉玫瑰与桃色系
  blushArc: "#EEAAA6",        // 右上角粉玫瑰大圆弧
  sunBlush: "#E9A5A1",        // 框内浅粉日轮
  waterPeach: "#F4C2B5",      // 框内桃粉湖面
  waterShimmer: "#FBF0E4",    // 水面浅米波纹
  rightHillRose: "#E59896",   // 远山右坡浅玫瑰
  archCoral: "#D27478",       // 标志前景玫瑰拱门
  archCoralDeep: "#B95D63",   // 拱门侧厚/阴影面
  midHillPlum: "#AF5A62",     // 中景梅红山丘
  dotPlum: "#A3505A",         // 右上 3×3 点阵梅红
  roseTextSafe: "#8C323B",    // 浅纸可读高对比深玫瑰字 (AA+)

  // 深酒红与暗面墨色
  plumCard: "#6E2D33",        // 形式示例卡梅红
  plumCardAlt: "#7E3641",     // 形式示例卡深玫红
  peakMaroon: "#531A26",      // 主体深酒红山峰
  pillarBurgundy: "#4D1A22",  // 右翼尖顶建筑竖柱
  footerBurgundy: "#41121B",  // 底部实心酒红收脚
  inkMaroon: "#3A0B14",       // 主标题深酒红墨
  inkSoft: "#6B434A",         // 次级说明暖梅灰（浅纸对比度 > 6.5）

  // 语义辅助（克制使用）
  okLight: "#1E6054",         // 浅底达标深松青
  okDark: "#7CD6C4",          // 暗底达标清松青
  errLight: "#B52328",        // 浅底错态赤朱红
  errDark: "#FF9E98",         // 暗底错态亮珊瑚
  ghostFrame: "#EBDACF",      // 幽灵低对比反例框色
};

// WCAG 相对亮度，供 model.js 实算前景与画心明度对比度
export function relativeLuminance(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
