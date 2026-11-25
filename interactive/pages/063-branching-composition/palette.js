// 逐点像素实采自 site/public/p/063.webp（1086×1448）
export const PALETTE = {
  paper: "#FEF9F3",        // 原海报宣纸暖白底
  paperSoft: "#F4EDE4",    // 浅沙纸交替底
  paperMint: "#EFF4F1",    // 微绿雾纸交替底
  paperSlate: "#EEF2F8",   // 浅靛蓝雾纸交替底
  ink: "#0B0D0C",          // 主墨黑
  inkSub: "#3E4340",       // 次墨灰（在暖宣底对比度 > 9.5）
  inkLine: "#232825",      // 细边框与标注虚线
  ruleLight: "#D7CFC4",    // 辅助参考网格线

  // 原海报四级节点与枝干标志色
  rootOrange: "#EA6E1F",   // L1 主干节点橘红圆
  barOrange: "#FF6B03",    // 导语左侧亮橘粗竖杠与关键词下划线
  orangeText: "#B54509",   // 浅底文字加深暖朱橘（对比度 > 5.3）
  orangeGlow: "#FF9248",   // 深墨绿暗底亮橘（对比度 > 7.2）

  trunkGreen: "#007348",   // 45° 枝干深森林绿
  l2Green: "#086142",      // L2 二级节点深森林绿方（浅底对比度 > 7.2）
  darkForest: "#072B1E",   // 03 节深森林墨绿暗版底
  darkForestCard: "#0E3C2B",
  darkText: "#FAF6F0",
  darkSub: "#CBE2D7",

  l3Pink: "#FFA2BC",       // L3 三级节点珊瑚蔷薇粉圆（暗底对比度 > 8.0）
  pinkText: "#A32952",     // 浅底文字加深莓红（对比度 > 6.4）

  l4Navy: "#164085",       // L4 末端节点深钴藏青方（浅底对比度 > 9.5）
  navySoft: "#DCE6F5",

  // 错态警报色（朱赤，与主干橘红明显拉偏，只在交叉/孤岛/成环处启用）
  err: "#C62828",
  errBg: "#FDECEC",
  errDark: "#FF7B7B",
  ok: "#086142",
  okBg: "#E6F3ED",
};

export const LEVEL_META = [
  { level: 0, key: "root", name: "主干节点（根部）", short: "主干", en: "ROOT NODE", shape: "circle", fill: PALETTE.rootOrange, textOnLight: PALETTE.orangeText },
  { level: 1, key: "l2", name: "二级节点", short: "二级", en: "LEVEL-2", shape: "square", fill: PALETTE.l2Green, textOnLight: PALETTE.l2Green },
  { level: 2, key: "l3", name: "三级节点", short: "三级", en: "LEVEL-3", shape: "circle", fill: PALETTE.l3Pink, textOnLight: PALETTE.pinkText },
  { level: 3, key: "l4", name: "末端节点", short: "末端", en: "END NODE", shape: "square", fill: PALETTE.l4Navy, textOnLight: PALETTE.l4Navy },
];
