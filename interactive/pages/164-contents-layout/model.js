// 164 目录 版式（CONTENTS LAYOUT）单真源排版模型
// 所有开场画布几何布局、视线串行估算、三柱诊断与多解识别均由此文件统一计算。

export const PALETTE = {
  paper: "#E3DFF7",
  paperBright: "#F5F4FD",
  paperWhite: "#FAF9FF",
  paperSoft: "#EAE7FA",
  cobalt: "#0F1BE6",
  cobaltDeep: "#0A13B3",
  cobaltInk: "#0C17CC",
  cobaltDarkBg: "#0A1047",
  cobaltDarkCard: "#121A63",
  cobaltGlow: "#8C9BFF",
  ink: "#000000",
  inkBody: "#141626",
  inkMuted: "#3E415C",
  rule: "#8C89A6",
  ruleLight: "#B6B3CC",
  err: "#C2232A",
  errSoft: "#FBE5E6",
  errDark: "#FF8A8E",
  ok: "#0B6B4F",
  okSoft: "#E0F4EC",
  okDark: "#66E3B8",
  warn: "#9A5200",
};

export const EDITIONS = {
  poster: {
    id: "poster",
    label: "原海报·课程目录",
    shortLabel: "原海报目录",
    docTitle: "目录版式设计指南",
    docMeta: "VOL.01 · 108 PAGES",
    chapters: [
      {
        num: "01",
        zh: "导言",
        en: "INTRODUCTION",
        page: "006",
        icon: "circle",
        brief: "引入主题，建立阅读方向，概述学习目标与结构。",
        subs: [
          { title: "主题导入", page: "008" },
          { title: "学习目标", page: "012" },
          { title: "内容总览", page: "016" },
        ],
      },
      {
        num: "02",
        zh: "案例",
        en: "EXAMPLES",
        page: "022",
        icon: "grid4",
        brief: "通过典型案例，解析目录版式的应用与效果。",
        subs: [
          { title: "优秀示例", page: "024" },
          { title: "结构拆解", page: "030" },
          { title: "要点提炼", page: "036" },
        ],
      },
      {
        num: "03",
        zh: "方法",
        en: "METHOD",
        page: "044",
        icon: "triangle",
        brief: "掌握目录版式的设计原理与关键方法。",
        subs: [
          { title: "分组策略", page: "046" },
          { title: "层级构建", page: "054" },
          { title: "视觉引导", page: "060" },
        ],
      },
      {
        num: "04",
        zh: "练习",
        en: "PRACTICE",
        page: "068",
        icon: "bars",
        brief: "动手实践，应用方法，巩固所学知识。",
        subs: [
          { title: "任务说明", page: "070" },
          { title: "操作提示", page: "076" },
          { title: "自我检查", page: "082" },
        ],
      },
      {
        num: "05",
        zh: "拓展",
        en: "EXTENSION",
        page: "090",
        icon: "dots9",
        brief: "延伸思考与进阶方向，提升设计视野。",
        subs: [
          { title: "更多版式", page: "092" },
          { title: "延伸阅读", page: "098" },
          { title: "灵感来源", page: "104" },
        ],
      },
    ],
  },
  journal: {
    id: "journal",
    label: "建筑年刊·画册",
    shortLabel: "建筑年刊",
    docTitle: "当代街区尺度年刊",
    docMeta: "ISSUE 14 · 128 PAGES",
    chapters: [
      {
        num: "01",
        zh: "序论",
        en: "PROLOGUE",
        page: "004",
        icon: "circle",
        brief: "回望十年城市更新脉络，界定本期田野议题。",
        subs: [
          { title: "卷首短札", page: "006" },
          { title: "街区年表", page: "010" },
          { title: "测绘图例", page: "014" },
        ],
      },
      {
        num: "02",
        zh: "空间",
        en: "SPATIAL FORM",
        page: "020",
        icon: "grid4",
        brief: "以光影与院落剖面记录公共灰空间的呼吸节奏。",
        subs: [
          { title: "檐下廊道", page: "024" },
          { title: "中庭采光", page: "032" },
          { title: "微坡广场", page: "040" },
        ],
      },
      {
        num: "03",
        zh: "构造",
        en: "TECTONICS",
        page: "050",
        icon: "triangle",
        brief: "拆解木构榫卯、清水墙体与轻钢雨棚的节点逻辑。",
        subs: [
          { title: "梁柱交接", page: "054" },
          { title: "砖石砌法", page: "062" },
          { title: "屋面排水", page: "070" },
        ],
      },
      {
        num: "04",
        zh: "人居",
        en: "INHABITATION",
        page: "080",
        icon: "bars",
        brief: "跟踪三座社区图书室投入使用后的日常微调。",
        subs: [
          { title: "晨间流线", page: "084" },
          { title: "儿童角落", page: "092" },
          { title: "夜间灯光", page: "098" },
        ],
      },
      {
        num: "05",
        zh: "对谈",
        en: "DIALOGUE",
        page: "106",
        icon: "dots9",
        brief: "结构师、出版人与在地居民围绕尺度展开圆桌讨论。",
        subs: [
          { title: "维护成本", page: "110" },
          { title: "旧材复用", page: "116" },
          { title: "编后索引", page: "124" },
        ],
      },
    ],
  },
  manual: {
    id: "manual",
    label: "技术手册·文档",
    shortLabel: "技术手册",
    docTitle: "排版引擎工程手册",
    docMeta: "REV 4.2 · 96 PAGES",
    chapters: [
      {
        num: "01",
        zh: "起步",
        en: "GETTING STARTED",
        page: "002",
        icon: "circle",
        brief: "环境检查、最小工程初始化与离线单文件构建流程。",
        subs: [
          { title: "安装依赖", page: "004" },
          { title: "目录约定", page: "008" },
          { title: "首次编译", page: "012" },
        ],
      },
      {
        num: "02",
        zh: "网格",
        en: "GRID ENGINE",
        page: "018",
        icon: "grid4",
        brief: "基线格网、列宽求整与跨断点的版心自适配规则。",
        subs: [
          { title: "基线步进", page: "020" },
          { title: "栏距约束", page: "026" },
          { title: "多屏回流", page: "032" },
        ],
      },
      {
        num: "03",
        zh: "字体",
        en: "TYPOGRAPHY",
        page: "040",
        icon: "triangle",
        brief: "子集裁剪、可变字重轴收敛与等宽数字表对齐。",
        subs: [
          { title: "字集扫描", page: "042" },
          { title: "字重映射", page: "048" },
          { title: "标点挤压", page: "054" },
        ],
      },
      {
        num: "04",
        zh: "校验",
        en: "VERIFICATION",
        page: "062",
        icon: "bars",
        brief: "对比度阈值、截断检测与无障碍键盘焦点走查。",
        subs: [
          { title: "溢出巡检", page: "064" },
          { title: "色差校核", page: "070" },
          { title: "帧率压测", page: "076" },
        ],
      },
      {
        num: "05",
        zh: "附录",
        en: "REFERENCE",
        page: "084",
        icon: "dots9",
        brief: "命令行参数速查、错误码对照表与许可声明。",
        subs: [
          { title: "配置字段", page: "086" },
          { title: "常见报错", page: "090" },
          { title: "版本日志", page: "094" },
        ],
      },
    ],
  },
};

// 开场默认停在真实初学者排目录的复合错态（非答案）
export const INITIAL_STATE = {
  edition: "poster",
  grouping: 1, // 1=未分组15条流水账, 3=3粗组, 5=原海报5组, 15=15独立碎块(过拆试错)
  scaleRatio: 1.0, // 主标与子目字号比 1.00..2.65
  colSplit: 0.78, // 电光蓝竖分栏尺位置 0.24..0.82（初始拉偏制造跨栏空白与右区压挤）
  folioMode: "right-orphan", // "right-orphan" | "leader" | "tight" | "left-folio"
  signposts: "off", // "off" | "clean" | "noisy"
  focusIndex: 2, // 当前扫读焦点条目索引
};

export const PRESETS = {
  poster5: {
    id: "poster5",
    label: "原海报五栏解",
    patch: { grouping: 5, scaleRatio: 1.75, colSplit: 0.63, folioMode: "tight", signposts: "clean" },
  },
  classicTight: {
    id: "classicTight",
    label: "书刊紧贴页码解",
    patch: { grouping: 3, scaleRatio: 1.55, colSplit: 0.60, folioMode: "tight", signposts: "clean" },
  },
  swissLeft: {
    id: "swissLeft",
    label: "瑞士左置页码解",
    patch: { grouping: 5, scaleRatio: 1.60, colSplit: 0.62, folioMode: "left-folio", signposts: "clean" },
  },
  leaderWide: {
    id: "leaderWide",
    label: "疏点线跨栏解",
    patch: { grouping: 5, scaleRatio: 1.50, colSplit: 0.66, folioMode: "leader", signposts: "clean" },
  },
  errOverSplit: {
    id: "errOverSplit",
    label: "试错：过度拆分",
    patch: { grouping: 15, scaleRatio: 1.35, colSplit: 0.58, folioMode: "right-orphan", signposts: "noisy" },
  },
  errOversized: {
    id: "errOversized",
    label: "试错：巨字挤折",
    patch: { grouping: 5, scaleRatio: 2.55, colSplit: 0.31, folioMode: "tight", signposts: "clean" },
  },
  resetBroken: {
    id: "resetBroken",
    label: "复原初始错态",
    patch: { grouping: 1, scaleRatio: 1.0, colSplit: 0.78, folioMode: "right-orphan", signposts: "off" },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 根据分组模式生成当前待排版的逻辑条目组
export function buildGroups(state) {
  const ed = EDITIONS[state.edition] || EDITIONS.poster;
  const chapters = ed.chapters;

  if (state.grouping === 1) {
    // 未分组：将全部 15 条子目连同章名混合平铺成 1 整段流水账
    const flat = [];
    chapters.forEach((ch) => {
      ch.subs.forEach((s) => {
        flat.push({
          num: ch.num,
          zh: `${ch.zh} · ${s.title}`,
          en: ch.en,
          page: s.page,
          icon: ch.icon,
          brief: "",
          subs: [],
        });
      });
    });
    return { mode: "flat", groups: flat, groupCount: 1, itemsPerGroup: flat.length };
  }

  if (state.grouping === 15) {
    // 过度拆分：15 条全部强行拆为独立带框碎块
    const micro = [];
    let idx = 1;
    chapters.forEach((ch) => {
      ch.subs.forEach((s) => {
        micro.push({
          num: String(idx++).padStart(2, "0"),
          zh: s.title,
          en: `${ch.en} / PART`,
          page: s.page,
          icon: ch.icon,
          brief: ch.zh,
          subs: [],
        });
      });
    });
    return { mode: "micro", groups: micro, groupCount: micro.length, itemsPerGroup: 1 };
  }

  if (state.grouping === 3) {
    // 3 粗组：把 5 章合并为「起手 / 核心 / 实战与延展」3 个大块
    const merged = [
      {
        num: "01",
        zh: `${chapters[0].zh}与${chapters[1].zh}`,
        en: `${chapters[0].en} & ${chapters[1].en}`,
        page: chapters[0].page,
        icon: chapters[0].icon,
        brief: chapters[0].brief,
        subs: [...chapters[0].subs.slice(0, 2), ...chapters[1].subs.slice(0, 2)],
      },
      {
        num: "02",
        zh: `${chapters[2].zh}核心`,
        en: chapters[2].en,
        page: chapters[2].page,
        icon: chapters[2].icon,
        brief: chapters[2].brief,
        subs: chapters[2].subs,
      },
      {
        num: "03",
        zh: `${chapters[3].zh}与${chapters[4].zh}`,
        en: `${chapters[3].en} & ${chapters[4].en}`,
        page: chapters[3].page,
        icon: chapters[3].icon,
        brief: chapters[3].brief,
        subs: [...chapters[3].subs.slice(0, 2), ...chapters[4].subs.slice(0, 2)],
      },
    ];
    return { mode: "banded", groups: merged, groupCount: 3, itemsPerGroup: 3.7 };
  }

  // 默认 5 组（原海报标准 01–05）
  return { mode: "banded", groups: chapters, groupCount: 5, itemsPerGroup: 3 };
}

// 单真源几何核算：根据真实画布宽高 (w, h) 计算每条行块的实绘像素边界
export function computeLayoutGeometry(state, w, h) {
  const padX = Math.max(14, Math.round(w * 0.035));
  const padTop = Math.max(36, Math.round(h * 0.095));
  const padBottom = Math.max(20, Math.round(h * 0.055));
  const innerW = Math.max(160, w - padX * 2);
  const innerH = Math.max(160, h - padTop - padBottom);

  const split = clamp(state.colSplit, 0.24, 0.82);
  const dividerX = Math.round(padX + innerW * split);
  const leftZoneW = dividerX - padX;
  const rightZoneW = padX + innerW - dividerX;

  const subFontPx = clamp(Math.round(w * 0.0175), 11, 14);
  const titleFontPx = Math.round(subFontPx * clamp(state.scaleRatio, 1.0, 2.65));

  const built = buildGroups(state);
  const rows = [];
  const rowCount = built.groups.length;
  const rowH = innerH / rowCount;

  // 估算中文标题宽度，用于计算真实空白跨距（单真源！）
  const estimateTitleW = (text, px) => {
    let units = 0;
    for (const ch of text) units += ch.charCodeAt(0) > 127 ? 1.02 : 0.58;
    return Math.round(units * px);
  };

  let maxGapPx = 0;
  let minLeftClearance = Infinity;
  let titleOverflowRows = 0;

  built.groups.forEach((g, idx) => {
    const y = padTop + idx * rowH;
    const hasRibbon = state.signposts !== "off" && built.mode === "banded";
    const ribbonW = hasRibbon ? clamp(Math.round(w * 0.044), 22, 34) : 0;
    const iconSize = hasRibbon ? clamp(Math.round(Math.min(rowH * 0.44, w * 0.056)), 20, 38) : 0;

    let leftCursor = padX + (hasRibbon ? ribbonW + 10 : 8);
    if (state.folioMode === "left-folio") leftCursor += Math.round(subFontPx * 3.8);
    if (hasRibbon && built.mode === "banded") leftCursor += iconSize + 12;

    const titleX = leftCursor;
    const titleW = estimateTitleW(g.zh, titleFontPx);
    const availableLeftW = dividerX - titleX - 10;
    const titleClipped = titleW > availableLeftW;
    if (titleClipped) titleOverflowRows++;
    minLeftClearance = Math.min(minLeftClearance, availableLeftW - titleW);

    // 页码落点计算
    const folioW = Math.round(subFontPx * 2.8);
    let folioX;
    let gapPx;
    if (state.folioMode === "left-folio") {
      folioX = padX + (hasRibbon ? ribbonW + 8 : 6);
      gapPx = Math.max(0, titleX - (folioX + folioW));
    } else if (state.folioMode === "tight") {
      folioX = Math.min(dividerX - folioW - 8, titleX + Math.min(titleW, Math.max(36, availableLeftW - folioW - 10)) + 14);
      gapPx = Math.max(0, folioX - (titleX + Math.min(titleW, availableLeftW)));
    } else if (built.mode === "banded") {
      // right-orphan 或 leader：页码落在右栏最右端
      folioX = padX + innerW - folioW - 6;
      const anchorEnd = Math.min(dividerX - 8, titleX + titleW);
      gapPx = Math.max(0, folioX - anchorEnd);
    } else {
      // flat / micro 流水账：页码落在分栏尺右侧或画幅右缘
      folioX = state.folioMode === "right-orphan" ? padX + innerW - folioW - 6 : dividerX + 10;
      const anchorEnd = titleX + Math.min(titleW, Math.max(40, innerW * 0.55));
      gapPx = Math.max(0, folioX - anchorEnd);
    }

    maxGapPx = Math.max(maxGapPx, gapPx);

    rows.push({
      index: idx,
      data: g,
      x: padX,
      y,
      w: innerW,
      h: rowH,
      ribbonW,
      iconSize,
      titleX,
      titleW,
      titleFontPx,
      subFontPx,
      folioX,
      folioW,
      gapPx,
      titleClipped,
      subX: dividerX + 14,
      subMaxW: Math.max(24, rightZoneW - 20),
    });
  });

  const gapRatio = maxGapPx / innerW;
  const effectiveRowH = Math.max(16, rowH);
  // 未桥接跨栏空白越宽、行高越挤，水平扫读时的垂直串行偏差越大（线性几何模型）
  let rowDriftLines = 0;
  if (state.folioMode === "right-orphan" && gapRatio > 0.20) {
    rowDriftLines = +clamp(((maxGapPx / effectiveRowH) * 0.24) * (gapRatio / 0.28), 0.2, 2.2).toFixed(1);
  } else if (state.grouping === 1 && state.folioMode !== "left-folio" && state.folioMode !== "tight") {
    rowDriftLines = +clamp((maxGapPx / effectiveRowH) * 0.12, 0.2, 1.5).toFixed(1);
  }

  return {
    w,
    h,
    padX,
    padTop,
    padBottom,
    innerW,
    innerH,
    dividerX,
    leftZoneW,
    rightZoneW,
    subFontPx,
    titleFontPx,
    mode: built.mode,
    groupCount: built.groupCount,
    itemsPerGroup: built.itemsPerGroup,
    rows,
    maxGapPx: Math.round(maxGapPx),
    gapRatio,
    titleOverflowRows,
    minLeftClearance: Math.round(minLeftClearance),
    rowDriftLines,
  };
}

// 单真源诊断：严格基于当帧实绘几何与排版原理，绝不写死常量
export function evaluateContentsLayout(state, w = 860, h = 480) {
  const geo = computeLayoutGeometry(state, w, h);
  const issues = [];

  // 1. 信息分组（双向检验：流水账 vs 过度拆分）
  let groupOk = true;
  let groupShort = `${geo.groupCount} 组聚类`;
  if (state.grouping === 1) {
    groupOk = false;
    groupShort = "未分组 15 条";
    issues.push({
      pillar: "group",
      code: "flat_wall",
      severity: 100,
      headline: "15 条条目平铺成流水账，眼睛找不到骨架",
      why: "所有子目挤在同一层级里，远远超过短时记忆约 4 组块的即时把握上限。读者必须从第 1 行逐字读到第 15 行，目录退化成了密麻清单。",
      hint: "把「信息分组」切到 5 组（原海报结构）或 3 粗组，先把零散子目按主题收拢。",
      fixLabel: "聚类为 5 大章节",
      fixPatch: { grouping: 5 },
    });
  } else if (state.grouping === 15) {
    groupOk = false;
    groupShort = "过拆 15 碎块";
    issues.push({
      pillar: "group",
      code: "over_split",
      severity: 96,
      headline: "过度拆成 15 个独立碎块，把目录切得支离破碎",
      why: "分组并不是越多越好。给每条子目都单独加框和编号后，宏观章节结构完全消失，视线被迫在 15 个等重碎片之间频繁起停。",
      hint: "把组数收回到 3–5 组，让每组承载 3–4 条紧密相关的子目。",
      fixLabel: "收回为 5 组骨架",
      fixPatch: { grouping: 5 },
    });
  }

  // 2. 层级清晰（双向检验：主次拍平 vs 巨字挤折 vs 装饰过载 vs 左栏压扁）
  let hierarchyOk = true;
  let hierarchyShort = `字比 ${state.scaleRatio.toFixed(2)}×`;
  if (state.scaleRatio < 1.25) {
    hierarchyOk = false;
    hierarchyShort = `拍平 ${state.scaleRatio.toFixed(2)}×`;
    issues.push({
      pillar: "hierarchy",
      code: "flat_scale",
      severity: 92,
      headline: `主标与子目字比仅 ${state.scaleRatio.toFixed(2)}×，章节层级被拍平`,
      why: "章节标题和下属细目几乎一样大、一样轻，扫读时分不清哪里是新篇章起点、哪里是从属条目，无法建立一眼落定的视觉焦点。",
      hint: "把「主次字级比」推到 1.40×–2.10× 之间，拉开章名与说明的体量差。",
      fixLabel: "拉开字比至 1.75×",
      fixPatch: { scaleRatio: 1.75 },
    });
  } else if (state.scaleRatio > 2.30) {
    hierarchyOk = false;
    hierarchyShort = `巨化 ${state.scaleRatio.toFixed(2)}×`;
    issues.push({
      pillar: "hierarchy",
      code: "oversized",
      severity: 90,
      headline: `章名放大到 ${state.scaleRatio.toFixed(2)}×，撑爆行高并挤压子目`,
      why: "字级对比并非越大越好。主标超出 2.30× 后会侵占行间呼吸空间，甚至把短说明和下级条目撞出分栏线，版面变得粗笨压抑。",
      hint: "将字级比回调到 1.40×–2.15× 区间，既保住焦点又给子目留出余地。",
      fixLabel: "回调字比至 1.75×",
      fixPatch: { scaleRatio: 1.75 },
    });
  }

  if (state.signposts === "noisy") {
    hierarchyOk = false;
    hierarchyShort = "装饰过载";
    issues.push({
      pillar: "hierarchy",
      code: "visual_noise",
      severity: 86,
      headline: "多余彩色徽章与粗边框抢戏，制造视觉噪点",
      why: "目录里的编号与符号应当退居「导视助手」。当每行都叠满高饱和标签、星标与双层框线时，装饰反过来压过了章节名称本身。",
      hint: "将「导视锚点」切回原海报克制的「蓝签+几何徽」，只保留一种主色强调。",
      fixLabel: "恢复克制导视",
      fixPatch: { signposts: "clean" },
    });
  }

  if (geo.mode === "banded" && (state.colSplit < 0.40 || geo.titleOverflowRows > 0)) {
    hierarchyOk = false;
    hierarchyShort = `主栏过窄 ${Math.round(state.colSplit * 100)}%`;
    issues.push({
      pillar: "hierarchy",
      code: "left_crush",
      severity: 89,
      headline: `左侧主栏被压到 ${Math.round(state.colSplit * 100)}%，章名撞上分栏线`,
      why: `当前左栏实宽仅 ${geo.leftZoneW}px，有 ${Math.max(1, geo.titleOverflowRows)} 处主标空间不足被迫挤压。栏尺推得太靠左会让主标题喘不过气，打破主次比例。`,
      hint: "在画布上把电光蓝竖分栏尺向右拖回 52%–68% 之间。",
      fixLabel: "拉阔左栏至 63%",
      fixPatch: { colSplit: 0.63 },
    });
  }

  // 3. 导航明确（双向检验：右栏压扁 / 跨栏断眼 / 缺左脊锚点）
  let guideOk = true;
  let guideShort =
    state.folioMode === "tight"
      ? "紧贴页码"
      : state.folioMode === "left-folio"
      ? "左置等宽页码"
      : state.folioMode === "leader"
      ? "疏点线引路"
      : "右齐页码";

  if (geo.mode === "banded" && state.colSplit > 0.74) {
    guideOk = false;
    guideShort = `右栏压窄 ${geo.rightZoneW}px`;
    issues.push({
      pillar: "guide",
      code: "right_crush",
      severity: 88,
      headline: `分栏尺拉到 ${Math.round(state.colSplit * 100)}%，右侧子目与页码区仅剩 ${geo.rightZoneW}px`,
      why: "把分栏推得过靠右端，右侧承载三级细目与页码的窄条被严重压缩，读者扫到右侧时文字拥挤贴边，寻页反倒变慢。",
      hint: "向左拖回电光蓝分栏尺至 52%–68% 区间，给右侧子目区留出阅读宽裕度。",
      fixLabel: "归中分栏至 63%",
      fixPatch: { colSplit: 0.63 },
    });
  }

  if (state.folioMode === "right-orphan" && geo.gapRatio > 0.24) {
    guideOk = false;
    guideShort = `串行 ±${geo.rowDriftLines.toFixed(1)} 行`;
    issues.push({
      pillar: "guide",
      code: "orphan_folio",
      severity: 94,
      headline: `标题与页码隔空 ${geo.maxGapPx}px 且无引线，扫读易串行 ±${geo.rowDriftLines.toFixed(1)} 行`,
      why: "把页码远远推到右边缘又不放任何水平桥梁，眼睛横跨大片空白时缺乏参照，极易落到上一行或下一行的页码上——这是出版物目录最高发的排印失误。",
      hint: "把「页码连结」切到紧贴标题旁、左置等宽页码或疏朗点线，立刻消除空白鸿沟。",
      fixLabel: "改用紧贴标题页码",
      fixPatch: { folioMode: "tight" },
    });
  }

  if (state.signposts === "off" && state.folioMode !== "left-folio") {
    guideOk = false;
    guideShort = "缺入口锚点";
    issues.push({
      pillar: "guide",
      code: "no_anchor",
      severity: 80,
      headline: "左脊缺少章号与横隔线，扫读缺少入口锚点",
      why: "读者扫描目录时视线默认沿左侧垂直下拉。拿掉 01–05 蓝签与章节分隔线后，五段文字首尾粘连，必须读出字义才能分辨章界。",
      hint: "开启原海报「蓝签+几何徽」，或切换「左置等宽页码」建立左侧垂直锚轴。",
      fixLabel: "开启 01–05 蓝签锚点",
      fixPatch: { signposts: "clean" },
    });
  }

  issues.sort((a, b) => b.severity - a.severity);
  const passCount = (groupOk ? 1 : 0) + (hierarchyOk ? 1 : 0) + (guideOk ? 1 : 0);
  const allPass = issues.length === 0;

  let solutionName = "";
  if (allPass) {
    if (state.grouping === 5 && state.folioMode === "tight" && state.signposts === "clean") {
      solutionName = "原海报五栏燕尾解";
    } else if (state.folioMode === "left-folio") {
      solutionName = "瑞士左置等宽页码解";
    } else if (state.folioMode === "leader") {
      solutionName = "疏朗点线跨栏解";
    } else if (state.folioMode === "tight") {
      solutionName = "经典书刊紧贴页码解";
    } else {
      solutionName = "合规目录版式解";
    }
  }

  let scanTier = "迷路串行（示意）";
  if (allPass) scanTier = "清朗直达（示意）";
  else if (passCount === 2) scanTier = "可辨但有摩擦（示意）";
  else if (passCount === 1) scanTier = "费力搜寻（示意）";

  const statusTag = allPass
    ? `导航成立 · ${solutionName}`
    : `${issues[0].code === "flat_wall" ? "流水账" : issues[0].code === "over_split" ? "过度拆分" : issues[0].code === "orphan_folio" ? "跨栏断眼" : issues[0].code === "flat_scale" ? "层级拍平" : issues[0].code === "oversized" ? "巨字挤折" : issues[0].code === "left_crush" ? "主栏压窄" : issues[0].code === "right_crush" ? "右栏压扁" : issues[0].code === "visual_noise" ? "装饰过载" : "缺锚点"} · 待校准`;

  return {
    geo,
    allPass,
    passCount,
    statusTag,
    solutionName,
    scanTier,
    pillars: {
      group: { ok: groupOk, short: groupShort },
      hierarchy: { ok: hierarchyOk, short: hierarchyShort },
      guide: { ok: guideOk, short: guideShort },
    },
    issues,
    primary: allPass
      ? {
          headline: `${solutionName}已成立：分组、层级与页码路径协同工作`,
          why: `当前采用 ${geo.groupCount} 组聚类、${state.scaleRatio.toFixed(2)}× 主次字比与 ${Math.round(state.colSplit * 100)}% 分栏比例，扫读串行风险降至 ${geo.rowDriftLines.toFixed(1)} 行。不妨切换其他页码方案或点「试错」观察目录如何失效。`,
          hint: "直接点击画布任意条目发射寻页射线，或切换「建筑年刊」「技术手册」验证版式复用力。",
          fixLabel: null,
          fixPatch: null,
        }
      : issues[0],
  };
}

// =========================================================
// 第 01 节：真实 3 秒「找章节」计时扫读测试数据
// =========================================================
export const SCAN_GAME_ITEMS = [
  { group: "01 导言", title: "主题导入", page: "008" },
  { group: "01 导言", title: "学习目标", page: "012" },
  { group: "01 导言", title: "内容总览", page: "016" },
  { group: "02 案例", title: "优秀示例", page: "024" },
  { group: "02 案例", title: "结构拆解", page: "030" },
  { group: "02 案例", title: "要点提炼", page: "036" },
  { group: "03 方法", title: "分组策略", page: "046" },
  { group: "03 方法", title: "层级构建", page: "054" },
  { group: "03 方法", title: "视觉引导", page: "060" },
  { group: "04 练习", title: "任务说明", page: "070" },
  { group: "04 练习", title: "操作提示", page: "076" },
  { group: "04 练习", title: "自我检查", page: "082" },
  { group: "05 拓展", title: "更多版式", page: "092" },
  { group: "05 拓展", title: "延伸阅读", page: "098" },
  { group: "05 拓展", title: "灵感来源", page: "104" },
];

// =========================================================
// 第 02 节：四类真实出版物目录标本数据
// =========================================================
export const SPECIMENS_S02 = [
  {
    id: "book",
    label: "古典书刊·紧贴页码",
    en: "CLASSICAL BOOK",
    principle: "页码紧跟章名右侧，省去横穿整页的引导点线，适合长篇人文专著与沉静阅读。",
    ruleNote: "罗伯特·布林赫斯特在《字体排印风格要素》（1992）中提醒：除非栏宽逼不得已，把页码贴近标题往往比拉满点线更安静、更不易串行。",
    rows: [
      { level: 1, num: "I", title: "论书页的比例与版心", page: "011" },
      { level: 2, num: "", title: "单页开本与对开视野", page: "019" },
      { level: 2, num: "", title: "天头、地脚与切口留白", page: "034" },
      { level: 1, num: "II", title: "字体的节奏与标点呼吸", page: "052" },
      { level: 2, num: "", title: "等宽数字与目录页码", page: "068" },
    ],
  },
  {
    id: "magazine",
    label: "现代杂志·多栏图目",
    en: "EDITORIAL MAGAZINE",
    principle: "左栏设大号蓝签锚定专题，右栏按固定栏目分块并带简短导语，让翻阅者 2 秒挑中感兴趣的一篇。",
    ruleNote: "杂志读者极少按页码从头读到尾，目录必须兼任「内容预告窗」，用大页码数字充当视觉锚点。",
    rows: [
      { level: 1, num: "018", title: "特写：高密度街区的微型公共空间", page: "专题" },
      { level: 2, num: "042", title: "器物：手工抄纸作坊的九道工序", page: "工艺" },
      { level: 2, num: "064", title: "访谈：当书店重新设计自己的目录墙", page: "人物" },
      { level: 1, num: "082", title: "专栏：城市标牌上的箭头简史", page: "观察" },
      { level: 2, num: "096", title: "书评：本期编辑部桌面五册", page: "书单" },
    ],
  },
  {
    id: "academic",
    label: "学术报告·三级缩进",
    en: "TECHNICAL REPORT",
    principle: "采用严格十进制编号（1 / 1.1 / 1.2）与固定步进缩进，配合疏朗等距点线连接右齐等宽页码。",
    ruleNote: "多级逻辑文档最怕「缩进不统一」和「层级超过三级」；一旦深到 1.1.1.2，目录本身就会吞噬结构感。",
    rows: [
      { level: 1, num: "1", title: "研究背景与实验设计", page: "003" },
      { level: 2, num: "1.1", title: "样本抽样与分组依据", page: "007" },
      { level: 2, num: "1.2", title: "眼动轨迹采集口径", page: "014" },
      { level: 1, num: "2", title: "扫读效率对照结果", page: "028" },
      { level: 2, num: "2.1", title: "组块数量与检索时间", page: "031" },
    ],
  },
  {
    id: "webapp",
    label: "网页文档·锚点侧栏",
    en: "WEB ON-PAGE TOC",
    principle: "去掉纸质页码，改以实时高亮的当前阅读进度条与可点击锚点替代，严格镜像正文 H2/H3 措辞。",
    ruleNote: "Nielsen Norman Group 指出：网页目录文字必须与正文小标题一一对应；一旦文案改写「卖关子」，用户跳转后会怀疑点错了地方。",
    rows: [
      { level: 1, num: "●", title: "快速上手与安装校验", page: "当前" },
      { level: 2, num: "", title: "单文件离线打包机制", page: "锚点" },
      { level: 2, num: "", title: "字体子集与缺字检查", page: "锚点" },
      { level: 1, num: "○", title: "响应式视口与触屏规范", page: "锚点" },
      { level: 2, num: "", title: "键盘焦点与无障碍", page: "锚点" },
    ],
  },
];

// =========================================================
// 第 03 节：暗室跨栏眼动偏差实验 4 种错态
// =========================================================
export const DARKROOM_CASES = [
  {
    id: "chasm",
    label: "① 宽栏孤悬页码",
    tag: "串行高危",
    spanMm: 148,
    driftDeg: 2.6,
    summary: "标题缩在最左、页码扔在 148mm 外的最右，中间既无引线又无色带托底。眼睛横飞过去时，极易向上或向下滑偏 1–2 行。",
    posterCorrection: "原海报在底部写着「导航明确：路径清晰，快速定位内容」，但静态清单没有明说：只要标题与页码之间拉出过宽空白，再工整的对齐也会在真实阅读里让人看串行。",
    fixAdvice: "把页码挪到标题旁或左置成列，或者用 3–4mm 疏朗点线铺桥，避免眼跳跨过裸白。",
  },
  {
    id: "denseDots",
    label: "② 过密粗黑点线",
    tag: "噪点抢戏",
    spanMm: 132,
    driftDeg: 0.4,
    summary: "为了防止串行，有人把默认句点连成密不透风的粗黑虚线（…………）。虽然不再串行，但整张目录瞬间布满横斑马纹，噪声盖过标题本身。",
    posterCorrection: "引导线只是轻声指路的细虚线，不是和主标题平起平坐的黑栅栏。",
    fixAdvice: "把点线调疏（字距拉宽至 0.4em–0.6em）、字号降小、颜色压浅至辅助灰，或干脆改用近距页码。",
  },
  {
    id: "deepNest",
    label: "③ 四级以上深嵌套",
    tag: "结构反噬",
    spanMm: 94,
    driftDeg: 1.4,
    summary: "把 1.1.1.1 到 1.1.2.3 全部塞进总目录，页数拉长到五六页。目录本来是用来压缩认知负担的地图，结果把每一条小巷都画成 1:1 实景。",
    posterCorrection: "好目录讲求克制取舍：总目录通常只展露 2 级（至多 3 级），更细的分支留给各章扉页或卷末索引去承接。",
    fixAdvice: "总目守住 2 级主干；细分条目交给章前小目或卷末索引版式分流。",
  },
  {
    id: "mismatch",
    label: "④ 标题口径不一",
    tag: "跳转失信",
    spanMm: 86,
    driftDeg: 1.9,
    summary: "目录里写着「分组与信息整理」，翻到第 44 页正文大标却印着「第三回 · 化繁为简的秘密」。读者瞬间停顿，以为翻错了页码。",
    posterCorrection: "目录是读者与正文之间的契约。措辞不匹配会直接打断阅读路径，比少放一个装饰图标更伤体验。",
    fixAdvice: "目录条目与正文标题保持完全一致或清晰包含关系，并在印刷/上线前统一校对页码。",
  },
];

// =========================================================
// 第 04 节：目录版式的历史演变（全部经核实）
// =========================================================
export const HISTORY_STEPS = [
  {
    id: "han",
    year: "前 26 年",
    place: "西汉 · 天禄阁",
    title: "刘向《别录》与刘歆《七略》",
    subtitle: "CHINESE BIBLIOGRAPHIC CLASSIFICATION",
    body: "公元前 26 年（汉成帝河平三年），刘向奉诏校理国家藏书，每校毕一书便撰写篇目与内容提要，汇成《别录》；其子刘歆在此基础上删繁分类，约于公元前 5 年编成《七略》，以「辑略」统领六大门类（今存架构见班固《汉书·艺文志》）。这奠定了中国「按类聚类 + 附解题」的目录传统——与 164 原海报「章名 + 简述 + 三子目」一脉相承。",
    specimenKind: "bamboo",
    sourceLabel: "核实来源：班固《汉书·艺文志》/ ChinaKnowledge",
  },
  {
    id: "pliny",
    year: "约公元 77 年",
    place: "古罗马",
    title: "老普林尼《自然史》卷一总目",
    subtitle: "PLINY THE ELDER · NATURALIS HISTORIA",
    body: "老普林尼在献给提图斯的 37 卷百科巨著《自然史》中，将整整第一卷专门做成全书总目（summarium）与文献出处清单。他在序言里直言：为了替忙碌的读者省时间，不必从第一卷苦读到最后一卷，只需先翻卷一，就能直接定位想要的主题与卷次——这是西方现存最早、也最自觉的「非顺序检索」目录宣言。",
    specimenKind: "roman",
    sourceLabel: "核实来源：Encyclopædia Britannica / LacusCurtius (UChicago)",
  },
  {
    id: "cologne",
    year: "1470 年",
    place: "科隆 · 活字印刷",
    title: "印本首次印出阿拉伯数字叶码",
    subtitle: "ARNOLD THER HOERNEN · FOLIATION",
    body: "手抄本时代每本抄本页数各异，目录很难标注通用页码。活字印刷让成百上千册书的每一页完全一致后，1470 年科隆印书商阿诺德·特尔·霍尔嫩在印刷韦尔纳·罗勒文克《Sermo ad populum》时，首次于书叶正面印出阿拉伯数字叶码（foliation），1474 年《世界简史》（Fasciculus Temporum）进一步完善索引对照。至此，目录才真正长出精确到页的坐标。",
    specimenKind: "incunabula",
    sourceLabel: "核实来源：History of Information / Incunabula Studies",
  },
  {
    id: "cognition",
    year: "1956 / 2001",
    place: "认知心理学",
    title: "从 7±2 到 4 组块的记忆边界",
    subtitle: "GEORGE A. MILLER & NELSON COWAN",
    body: "乔治·米勒在 1956 年《心理评论》论文中提出「组块（chunking）」概念，指出即时记忆容量大致围绕 7±2；2001 年纳尔逊·考恩在《行为与脑科学》进一步证伪了盲目塞满 7–9 项的做法，指出在排除复述辅助时，人脑工作记忆的纯粹聚焦上限更接近 4 个组块（约 3–5 组）。把 15 条内容聚合成 01–05 五大章节，正是顺应人脑工作记忆的尺度。",
    specimenKind: "chunks",
    sourceLabel: "核实来源：PubMed PMID 13310704 / PMID 11515286",
  },
  {
    id: "modern",
    year: "1992 — 当代",
    place: "现代书籍与网页",
    title: "克制点线与扫读型数字目录",
    subtitle: "BRINGHURST & NIELSEN NORMAN GROUP",
    body: "罗伯特·布林赫斯特在 1992 年首版《字体排印风格要素》里梳理了现代目录的克制原则：用字级与留白说话，慎用沉重密点线；进入网页时代后，Nielsen Norman Group 的眼动研究揭示大多数读者并非逐字通读而是先扫描标题与层级，网页目录（On-Page TOC）由此演变为锚点直达、镜像标题、随滚高亮的交互导览地图。",
    specimenKind: "modern",
    sourceLabel: "核实来源：WorldCat OCLC 26017400 / NN/g Research",
  },
];

// =========================================================
// 第 05 节：何时用 / 何时别用 分诊卡片
// =========================================================
export const TRIAGE_CASES = [
  {
    id: "leaflet",
    title: "2 页单张展讯折页",
    meta: "总字数约 400 字 · 一眼全览",
    verdict: "别用目录",
    verdictType: "no",
    reason: "整张纸摊开一眼就能看全，硬塞一栏目录既占去宝贵主视觉面积，又让读者产生「先看地图再看眼前两步路」的多余动作。",
  },
  {
    id: "mystery",
    title: "强悬念线性长篇小说",
    meta: "300 页 · 靠反转推进",
    verdict: "谨慎 / 留白章名",
    verdictType: "caution",
    reason: "线性叙事本来就希望读者按顺序沉浸。如果非放目录且把「第七章：真凶自首」印在开头，会直接剧透；此类书常省略目录，或只标「第一章 / 第二章」。",
  },
  {
    id: "artbook",
    title: "纯摄影视觉画册",
    meta: "160 页 · 全出血影像为主",
    verdict: "改用图录缩略目",
    verdictType: "caution",
    reason: "文字章名很难替代影像记忆。画册往往省略文字目录，或放在卷末做成带缩略图的图录索引，避免打断翻开书页的沉浸情绪。",
  },
  {
    id: "course",
    title: "模块化课程与工作坊手册",
    meta: "108 页 · 导言/案例/方法/练习/拓展",
    verdict: "强烈推荐",
    verdictType: "yes",
    reason: "正是 164 原海报的典型主场：学习者既可顺学，也常在实战时直接跳去「方法」或「练习」，分组清晰的五栏目录能显著缩短二次翻找时间。",
  },
  {
    id: "docs",
    title: "长篇技术文档与年报",
    meta: "5000+ 字 · 非顺序检索",
    verdict: "必须配备",
    verdictType: "yes",
    reason: "读者带着具体问题来查答案，不会逐段从头读。固定侧栏或文首清晰分级的锚点目录，能让读者 3 秒确认「这里有没有我要的答案」。",
  },
  {
    id: "magazine",
    title: "多栏目综合期刊",
    meta: "96 页 · 8 个独立板块",
    verdict: "跨页多栏目录",
    verdictType: "yes",
    reason: "不同主题彼此独立，目录就是期刊的「陈列橱窗」：主专题配导语与大页码，常规短栏紧缩排列，拉开节奏反差。",
  },
];

// 同小类其他编号（160–167，各有一页，一句话带链接）
export const SIBLING_PAGES = [
  { id: "160", name: "封面版式", role: "先在书外拦截视线、建立第一印象与题材气质。", url: "https://layout.xiaoxiaodong.ai/160/play/" },
  { id: "161", name: "章节扉页", role: "在正文内部制造呼吸停顿，宣告新篇章开启。", url: "https://layout.xiaoxiaodong.ai/161/play/" },
  { id: "162", name: "栏目开启页", role: "用方向动势与书口切口，把读者送进杂志下一板块。", url: "https://layout.xiaoxiaodong.ai/162/play/" },
  { id: "163", name: "特写跨页", role: "把核心视觉放大冲破中缝与边线，制造情绪高潮。", url: "https://layout.xiaoxiaodong.ai/163/play/" },
  { id: "165", name: "索引版式", role: "打破章节顺序，按关键词字母或笔画实现精准反查。", url: "https://layout.xiaoxiaodong.ai/165/play/" },
  { id: "166", name: "图录版式", role: "以高密度网格与标号系统编目大量视觉作品或藏品。", url: "https://layout.xiaoxiaodong.ai/166/play/" },
  { id: "167", name: "引语主导版式", role: "抽出一句高密度观点放大成焦点，替长文定调。", url: "https://layout.xiaoxiaodong.ai/167/play/" },
];

// =========================================================
// 第 06 节：严格单变量四选一练习（仅差「页码排布与跨栏连结」）
// =========================================================
export const QUIZ_DATA = {
  prompt: "同一本 120 页建筑年刊的 5 章目录，文案、字号、字体、分组和页宽完全一致，只改变「页码排布与跨栏连结方式」这一个变量。哪一版最不容易看串行、且版面最克制？",
  options: [
    {
      key: "A",
      mode: "orphan",
      correct: false,
      feedbackTitle: "方案 A · 跨栏裸白过宽，容易看串行",
      feedbackBody: "虽然左右两端看起来工整，但章名「序论」「空间」和最右端的页码隔着超过半张页宽的空白，又没有任何水平引线。眼睛横跳过去时很容易落到相邻一行，是默认办公模板最常见的陷阱。",
    },
    {
      key: "B",
      mode: "heavy-dots",
      correct: false,
      feedbackTitle: "方案 B · 粗密点线制造强烈的横条纹噪点",
      feedbackBody: "用密集粗点把整行填死确实防住了串行，但五道又黑又密的点线在视觉重量上盖过了章节名称本身，整张目录像隔着百叶窗看字，显得急躁而沉重。",
    },
    {
      key: "C",
      mode: "left-tabular",
      correct: true,
      feedbackTitle: "方案 C 正确 · 左置等宽页码消除跨距，扫读零串行",
      feedbackBody: "把等宽数字页码（004 / 020 / 050 / 080 / 106）直接锚定在章名左侧紧邻位置，形成笔直的垂直扫读轴：眼睛不必长途横穿版面，无需任何点线噪点，看清章名的同一瞬就已经读到页码。",
    },
    {
      key: "D",
      mode: "centered",
      correct: false,
      feedbackTitle: "方案 D · 居中换行打散了左侧垂直扫读轴",
      feedbackBody: "居中对称常被误当作「高级」，但在目录里每一行起点长短不一，眼睛每换一行都要左右重新找起点，且页码压在章名下方拉高了行块、打断了章节间的整体节奏。",
    },
  ],
};
