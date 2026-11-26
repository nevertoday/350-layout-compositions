// 逐像素实采自 304「群像构图」原海报的包豪斯剪纸展板色系
export const PALETTE = {
  // 暖展纸与浅读纸系
  paper: "#F0ECE6",
  paperLight: "#FAF8F4",
  paperCool: "#EDF2FA",
  paperWarm: "#F6EFEA",
  paperDeep: "#E5E0D8",
  cutoutRim: "#FFFFFF",

  // 招牌四色剪影（信号朱红 / 国际钴蓝 / 曜墨黑 / 退景暖石灰）
  red: "#EB3314",
  redBright: "#ED3516",
  redBar: "#E52713",
  redTextLight: "#B42108", // 浅纸小字高对比安全红 (>=5.5:1)
  redDarkBg: "#FF6B50",    // 深暗房高对比亮朱

  blue: "#0D41CC",
  blueDeep: "#0B40CB",
  blueTextLight: "#0935A8", // 浅纸小字高对比安全蓝 (>=7.5:1)
  blueDarkBg: "#73A4FF",    // 深暗房高对比亮钴

  ink: "#0E100F",
  inkPure: "#030505",
  inkMuted: "#47494A",
  inkLine: "#6B6B6B",

  grey: "#B8B6B1",
  greyLight: "#C8C6C0",
  greyDark: "#8B8A86",

  // 暗房与考场
  darkRoom: "#111315",
  darkRoomCard: "#1B1E22",
  examBg: "#0E1424",
  examCard: "#161F36",
  footerBg: "#0E100F",

  // 状态克制色
  okLight: "#0E6B42",
  okBgLight: "#E3F3EC",
  okDark: "#68DB9E",
  errLight: "#B42108",
  errBgLight: "#FCE8E4",
  errDark: "#FF7861",
};

export const ROLE_META = {
  red: { label: "信号朱红·主角", short: "红主", fill: PALETTE.red, textOn: "#FFFFFF", chroma: 1.88 },
  blue: { label: "国际钴蓝·阵营", short: "蓝阵", fill: PALETTE.blue, textOn: "#FFFFFF", chroma: 1.16 },
  black: { label: "曜墨炭黑·支点", short: "黑支", fill: PALETTE.ink, textOn: "#FFFFFF", chroma: 1.12 },
  grey: { label: "暖石浅灰·退景", short: "灰退", fill: PALETTE.grey, textOn: "#0E100F", chroma: 0.60 },
};

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报·剪纸群像",
    subtitle: "304 展板平面剪影",
    caption: "白边叠层区分前后景，靠色层与体量立住中心人物",
  },
  banquet: {
    id: "banquet",
    label: "晚宴群戏",
    subtitle: "长桌与屏风纵深",
    caption: "借长桌中景线与屏风隔断，把席间宾客自然分成两到三组",
  },
  street: {
    id: "street",
    label: "街头纪实",
    subtitle: "街道透视与行人留白",
    caption: "在流动人潮里退灰路人、拉开间距，让关键人物一眼跳出",
  },
};
