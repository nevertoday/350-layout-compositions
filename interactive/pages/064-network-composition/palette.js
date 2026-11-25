// 064 网络构图 — 逐点像素实采自原海报 (site/public/p/064.webp)
export const PALETTE = {
  paper: "#F6EFE6",
  paperLight: "#FAF6F0",
  paperSand: "#EFEBE4",
  paperSemi: "#E2DED6",
  navy: "#06213E",
  navyDark: "#071D36",
  navyDeep: "#041529",
  navySoft: "#1A3554",
  coral: "#FA6C48",
  coralBright: "#F9653E",
  coralText: "#B83B1C",
  coralOnDark: "#FF8566",
  stone: "#C5C4C0",
  stoneInk: "#4F5660",
  line: "rgba(6, 33, 62, 0.72)",
  lineMuted: "rgba(6, 33, 62, 0.24)",
  lineLight: "rgba(246, 239, 230, 0.26)",
  teal: "#0F6B5E",
  tealOnDark: "#6CE0CE",
  danger: "#C9331B",
  dangerBg: "rgba(201, 51, 27, 0.10)",
  passBg: "rgba(15, 107, 94, 0.10)",
};

export const ROLE_META = {
  core: {
    zh: "核心节点",
    en: "CORE NODE",
    fill: PALETTE.navy,
    ink: PALETTE.paper,
    subInk: "#D9E1EA",
  },
  key: {
    zh: "关键节点",
    en: "KEY NODE",
    fill: PALETTE.coral,
    ink: PALETTE.navy,
    subInk: "#2E150E",
  },
  support: {
    zh: "支持节点",
    en: "SUPPORT NODE",
    fill: PALETTE.stone,
    ink: PALETTE.navy,
    subInk: "#2B323C",
  },
};
