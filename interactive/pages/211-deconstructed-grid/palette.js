// 逐像素实采自 211 原海报（site/public/p/211.webp）的建筑描图纸色系
// 所有 Canvas 与 SVG 绘图均从此处读取，保证与 style.css 的自定义属性完全一致。

export const PALETTE = {
  // 纸面与结构板
  paper: "#EFF4F2",          // 原海报淡青建筑描图纸底
  paperBright: "#F8FBFA",    // 亮白制图纸
  paperCool: "#E6ECEA",      // 冷灰蓝图纸
  panelSilver: "#DEE2E3",    // 原海报中央银灰语义板
  panelSilverDeep: "#CFD7D6",// 深一级描图银灰
  rule: "#C4CECB",           // 1px 建筑格线
  ruleStrong: "#95A4A1",     // 次级结构线
  gridHair: "#B9C5C2",       // 5×5 细格线
  gridGhost: "#C9D3D0",      // 原网格断口残影

  // 三原建筑功能色
  teal: "#23BFBF",           // 原海报标志青碧大方块
  tealBright: "#2DC8C5",     // 原海报 01/04 图标亮青
  tealText: "#0C7474",       // 浅纸 AA 高对比深青文字 (>5.3:1)
  tealDarkBg: "#4CE0DC",     // 暗室提亮青碧

  coral: "#F44B32",          // 原海报标志珊瑚橘红横条/小块
  coralIcon: "#F64F34",      // 原海报 02 图标珊瑚红
  coralText: "#BC2A14",      // 浅纸 AA 高对比深赤文字 (>5.4:1)
  coralDarkBg: "#FF7A63",    // 暗室提亮珊瑚

  ink: "#080B0B",            // 原海报绝对纯黑块与主标题墨
  inkPure: "#010101",        // 原海报实心黑块
  inkMuted: "#384544",       // 次级深石墨说明文字 (>9:1)
  inkSoft: "#546361",        // 辅助刻度与坐标注记 (>5.8:1)

  // 暗室与反馈语义色
  darkTealRoom: "#0D191B",   // 03 节深青墨暗室
  darkTealCabin: "#152629",  // 03 节暗舱
  darkCharcoal: "#101415",   // 06 节炭黑暗室
  darkCabin: "#1B2123",      // 06 节暗舱
  okText: "#0E6B53",         // 浅纸稳态深松青 (>6.2:1)
  okSoft: "#DDF2EC",         // 稳态底色
  warnText: "#B82914",       // 浅纸错态赤红 (>5.6:1)
  warnSoft: "#FCE5E1",       // 错态底色
};
