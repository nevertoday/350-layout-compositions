// 079 顶视构图 · 色板（逐像素实采自 079 原海报）
// 暖白测绘纸 × 深松植物绿 × 姜黄赭金 × 浓墨炭黑

export const PALETTE = {
  // 纸面与画布底色
  paper: "#EFECE6",        // 原海报主底纸
  paperBright: "#FAF8F4",  // 内圆素白台面 / 亮读宣纸
  paperSage: "#E8EDE7",    // 鼠尾草雾纸
  paperWarm: "#EDE7DC",    // 暖麦砂纸
  paperLinen: "#E9E6DE",   // 暖灰麻纸
  bevelRing: "#DFDED9",    // 原海报中央石膏灰圆环
  bevelOuter: "#D1CFC8",   // 圆环外细描边

  // 深松植物绿（原海报主色）
  pine: "#184733",         // 原海报深绿实点与圆弧
  pineMid: "#204C39",      // 原海报笔记本主色
  pineDark: "#112D21",     // 深松绿暗室背景
  pineCell: "#193D2D",     // 暗室卡片舱底
  leafLight: "#436D31",    // 多肉植物亮叶
  leafMid: "#2B5B37",      // 多肉植物中叶
  sageTint: "#C5D1C4",     // 原海报分区淡鼠尾草块
  sageLine: "#8EA494",     // 暗底鼠尾草细线与次色
  sageOnDark: "#B7CEBC",   // 暗底高对比浅鼠尾草字

  // 姜黄赭金（原海报点缀色）
  gold: "#E6AB1B",         // 原海报姜黄圆点、圆弧与机身
  goldSoft: "#F2CE7B",     // 原海报分区浅麦金块
  goldInk: "#845900",      // 浅纸安全深赭金字（对比度 ≥ 5.8）
  goldDarkBg: "#F2BE3B",   // 暗底安全亮赭金（对比度 ≥ 9.5）

  // 墨色与测绘线
  ink: "#141916",          // 主墨炭黑
  inkLens: "#222523",      // 相机镜头深炭
  inkMuted: "#47504B",     // 正文次墨
  dash: "#7B827C",         // 测绘虚线与标尺
  hairline: "#D0CCC3",     // 细分割线

  // 语义诊断色（克制）
  err: "#B43428",          // 浅纸错态砖红
  errTint: "#F9ECEA",      // 浅纸错态柔底
  errDark: "#FF8A7A",      // 暗底错态亮珊瑚
  ok: "#18593B",           // 浅纸达标深松绿
  okTint: "#E5F0EA",       // 浅纸达标浅绿底
  okDark: "#7FE0AC",       // 暗底达标浅翠
};
