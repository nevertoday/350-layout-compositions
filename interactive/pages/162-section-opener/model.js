// 162 栏目开启页 · 单真源几何与排印模型
// 画布绘制、命中热区、三把原海报尺、诊单白话与实测读数全部来自同一份 computeLayout() 输出。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 建筑季刊",
    shortLabel: "建筑季刊",
    issue: "建筑评论 · 第 14 辑",
    prevLabel: "上栏 00 · 城市速写末页",
    paperBg: "#EFE4D1",
    paperAlt: "#F6EFE2",
    ink: "#121311",
    inkSub: "#4B4740",
    accent: "#D63D1E",
    accentDeep: "#B52E13",
    prevBg: "#DDD8CE",
    prevInk: "#767B78",
    sections: [
      {
        num: "01",
        tag: "SECTION 01 · SPACE",
        titleA: "空间与",
        titleB: "尺度",
        lead: "从光井、回廊到街区界面，拆解空间如何决定人的停留节奏。",
        items: [
          { p: "014", t: "光井与中庭的垂直呼吸" },
          { p: "028", t: "六米檐口：街道的亲切尺" },
          { p: "042", t: "旧仓改造里的留白通道" },
        ],
        overload: [
          "014 光井与中庭的垂直呼吸——全案测绘与日照模型分析",
          "028 六米檐口：街道亲切尺度的十二处实地访谈摘录",
          "042 旧仓改造里的留白通道与钢结构加固节点详图",
          "054 南向长窗与百叶格栅在夏季西晒时的照度对比表",
          "066 社区图书馆底层架空后的动线变化观察手记",
          "074 清水混凝土模板拼缝对室内声学混响的实测",
          "082 屋顶花园荷载预算与雨水回收池剖面草图",
          "090 编后索引：本期全部摄影师与建筑事务所联络表",
        ],
      },
      {
        num: "02",
        tag: "SECTION 02 · TECTONICS",
        titleA: "建造与",
        titleB: "构造",
        lead: "看清梁柱、榫卯与饰面的真实受力，材料本身就是语言。",
        items: [
          { p: "056", t: "无钉木构的剪力传递" },
          { p: "070", t: "砖墙砌法与立面阴影" },
          { p: "084", t: "轻钢桁架的预制节拍" },
        ],
        overload: [
          "056 无钉木构的剪力传递与含水率变形长期记录",
          "070 砖墙砌法与立面阴影在不同日照角下的投影",
          "084 轻钢桁架预制节拍及现场吊装顺序时间表",
          "092 现浇水磨石分格铜条防裂工艺全流程笔记",
          "100 幕墙铝板折边收口与耐候密封胶选型对比",
          "108 夯土墙体骨料配比与抗风化表层处理方案",
          "114 室内楼梯踏步防滑槽铣削尺寸与触感评估",
          "122 供应商名录与建材样品间预约参观时段清单",
        ],
      },
      {
        num: "03",
        tag: "SECTION 03 · ARCHIVE",
        titleA: "纸上",
        titleB: "档案",
        lead: "翻出泛黄蓝图与手绘工作草图，追认现代主义的空间源头。",
        items: [
          { p: "098", t: "1923 构成主义书口索引" },
          { p: "112", t: "瑞士网格手稿的栏距尺" },
          { p: "126", t: "九份绝版期刊开页复盘" },
        ],
        overload: [
          "098 1923 构成主义书口索引原版开本与活版套色考",
          "112 瑞士网格手稿的栏距尺与正文基线对齐法则",
          "126 九份绝版期刊开页复盘与装帧工艺拆解报告",
          "134 铅字时代的字模铸造与标题字距视觉校准表",
          "142 胶印网点角度与专色朱红油墨干湿色差对照",
          "150 线装与锁线胶装对跨页中缝吃字宽度的影响",
          "158 纸张丝缕方向与翻页回弹阻力的手工测试",
          "164 馆藏检索目录与高分辨率扫描件申请流程",
        ],
      },
    ],
  },
  annual: {
    id: "annual",
    label: "年报 · 气候报告",
    shortLabel: "气候年报",
    issue: "城市零碳年报 · 2026",
    prevLabel: "上栏 01 · 董事致辞末页",
    paperBg: "#F2EAE0",
    paperAlt: "#FAF5EE",
    ink: "#121311",
    inkSub: "#454846",
    accent: "#D63D1E",
    accentDeep: "#B52E13",
    prevBg: "#D8DCDF",
    prevInk: "#667075",
    sections: [
      {
        num: "02",
        tag: "PART 02 · INFRASTRUCTURE",
        titleA: "零碳",
        titleB: "基建",
        lead: "电网调度、区域供冷与旧楼热泵改造的年度关键进展。",
        items: [
          { p: "024", t: "分布式微电网消纳率" },
          { p: "038", t: "商业楼宇外墙热工更新" },
          { p: "052", t: "港口岸电与电动货运网" },
        ],
        overload: [
          "024 分布式微电网消纳率季度台账与峰谷电价核算",
          "038 商业楼宇外墙热工更新试点项目逐栋能耗明细",
          "052 港口岸电改造投资回报周期与碳配额测算表",
          "060 区域供冷管网泵站变频改造前后压力曲线",
          "068 市政路灯直流化替换批次与维护工单统计",
          "076 公共巴士车队电池梯次利用与储能站并网记录",
          "084 绿色债券募集资金流向审计与独立鉴证说明",
          "090 附录三：全口径温室气体核算边界与排放因子",
        ],
      },
      {
        num: "03",
        tag: "PART 03 · MOBILITY",
        titleA: "慢行与",
        titleB: "街网",
        lead: "把路权还给步行、骑行与准点地面公交的三年评估。",
        items: [
          { p: "064", t: "十五分钟步行通学圈" },
          { p: "078", t: "林荫骑行廊道连通度" },
          { p: "092", t: "公交信号优先准点实测" },
        ],
        overload: [
          "064 十五分钟步行通学圈安全过街口改造汇总",
          "078 林荫骑行廊道连通度与早晚高峰流量抽样",
          "092 公交信号优先路口准点率月度变化一览表",
          "100 轨道站点五百米接驳微循环线路班次表",
          "108 夜间慢行道照明照度达标率与盲道修复台账",
          "116 商圈路内停车泊位减量与地下车库共享数据",
          "124 社区微更新居民议事会意见采纳清单",
          "130 第三方交通仿真模型参数与误差检验报告",
        ],
      },
      {
        num: "04",
        tag: "PART 04 · GOVERNANCE",
        titleA: "账本与",
        titleB: "核查",
        lead: "碳排数据口径、第三方审计边界与下一年减排目标。",
        items: [
          { p: "106", t: "范围一至三排放核对" },
          { p: "118", t: "预算执行与气候资金" },
          { p: "130", t: "2027 里程碑与风险项" },
        ],
        overload: [
          "106 范围一至三排放核对底稿与历史基线重述说明",
          "118 预算执行与气候专项资金拨付进度明细表",
          "130 2027 年度减排里程碑与关键供应链风险项",
          "138 供应商碳披露问卷回收率及分级辅导计划",
          "146 极端高温天气城市电力韧性应急预案演练",
          "152 内部碳定价在资本开支评审中的权重示例",
          "160 独立鉴证机构合理保证声明与签章页",
          "168 术语缩写对照表及往期年报勘误记录",
        ],
      },
    ],
  },
  monograph: {
    id: "monograph",
    label: "画册 · 器物工艺志",
    shortLabel: "器物画册",
    issue: "手作年鉴 · 卷三",
    prevLabel: "上栏 00 · 序言与风土",
    paperBg: "#F1E6D4",
    paperAlt: "#F9F3E8",
    ink: "#121311",
    inkSub: "#4E483F",
    accent: "#D63D1E",
    accentDeep: "#B52E13",
    prevBg: "#DFD7CA",
    prevInk: "#766F65",
    sections: [
      {
        num: "01",
        tag: "CHAPTER GROUP 01 · CLAY",
        titleA: "土与火",
        titleB: "器形",
        lead: "窑温、胎土与拉坯留下的指痕，共同写就一只杯碗的分量。",
        items: [
          { p: "018", t: "粗陶胎土里的铁点肌理" },
          { p: "034", t: "柴窑落灰的自然釉面" },
          { p: "050", t: "圈足高度与握持重心" },
        ],
        overload: [
          "018 粗陶胎土里的铁点肌理与各地原矿成分化验",
          "034 柴窑落灰自然釉面在不同窑位温差下的变化",
          "050 圈足高度、口沿薄度与盛满热茶时的握持重心",
          "062 素烧与釉烧两次升温曲线及保温时长记录",
          "074 传统草木灰釉过滤目数与浸釉厚度对比",
          "086 手拉坯与泥条盘筑在器壁应力上的微观差异",
          "098 十二位窑主工作台工具尺寸与保养口述",
          "110 全部收录器物尺寸、克重与藏家索引附录",
        ],
      },
      {
        num: "02",
        tag: "CHAPTER GROUP 02 · WOOD",
        titleA: "木理与",
        titleB: "刨花",
        lead: "顺着年轮开料、干燥三年，家具才懂得与季节一起呼吸。",
        items: [
          { p: "066", t: "径切与弦切的伸缩差" },
          { p: "082", t: "燕尾榫的咬合斜度" },
          { p: "096", t: "生漆推光的七遍工夫" },
        ],
        overload: [
          "066 径切与弦切板材在南北湿度下的伸缩实测",
          "082 燕尾榫咬合斜度在硬木与软木中的角度取值",
          "096 生漆推光七遍荫房温湿度曲线与打磨砂纸号",
          "106 刨刀磨刃夹角与推刨出屑厚度的手感记录",
          "114 百年旧料拆解起钉与虫眼修补嵌木技法",
          "122 桌腿穿带防翘结构在长餐桌上的截面比例",
          "130 木蜡油与蜂蜡涂装的耐水耐茶渍对比试验",
          "138 工房地图、树种标本目录与术语解释",
        ],
      },
      {
        num: "03",
        tag: "CHAPTER GROUP 03 · PAPER",
        titleA: "纤维与",
        titleB: "抄纸",
        lead: "构树皮、竹帘与清泉交织，决定墨色落纸时如何晕开。",
        items: [
          { p: "112", t: "手工抄纸的帘纹节奏" },
          { p: "126", t: "熟宣与生宣的吸墨差" },
          { p: "140", t: "丝缕方向与书脊平摊" },
        ],
        overload: [
          "112 手工抄纸帘纹节奏与抄槽荡浆次数的克重控制",
          "126 熟宣与生宣在松烟墨与油烟墨下的晕染半径",
          "140 纸张丝缕方向对厚书书脊平摊角度的影响",
          "150 植物粘剂滑液提取温度与纤维悬浮均匀度",
          "158 日晒焙干与贴墙阴干纸面平整度的对比",
          "166 染色纸用苏木、栀子、靛蓝的耐光退色测试",
          "174 纸坊水系图与季节性采皮备料时间表",
          "182 全部纸样克重、厚度与原产地编号总览",
        ],
      },
    ],
  },
};

export const INITIAL_STATE = {
  theme: "poster",
  sectionIndex: 0,
  arrowFlow: -0.42, // 负值=反指上一栏；0..0.44=僵滞；0.45..1.0=强劲向右导流
  titleScale: 1.18, // 1.1..6.0；<2.2=平灰无阶；2.2..5.2=清晰；>5.2=撑爆版心
  tabStyle: "none", // "none" | "muted" | "bleed"
  subMode: "overload", // "overload" (8篇伪目录) | "curated" (3条精炼路标) | "empty" (0条空壳)
  clutter: true, // true = 存在高对比抢焦角标，制造双焦冲突
  presetStyle: "arrow", // "arrow" | "swiss" | "slab"（合法视觉表达方式）
};

export const PRESETS = {
  posterArrow: {
    label: "构成箭解",
    patch: {
      arrowFlow: 0.88,
      titleScale: 3.4,
      tabStyle: "bleed",
      subMode: "curated",
      clutter: false,
      presetStyle: "arrow",
    },
  },
  swissType: {
    label: "瑞士大字解",
    patch: {
      arrowFlow: 0.68,
      titleScale: 4.3,
      tabStyle: "bleed",
      subMode: "curated",
      clutter: false,
      presetStyle: "swiss",
    },
  },
  edgeSlab: {
    label: "色块切口解",
    patch: {
      arrowFlow: 0.78,
      titleScale: 2.9,
      tabStyle: "bleed",
      subMode: "curated",
      clutter: false,
      presetStyle: "slab",
    },
  },
  failToc: {
    label: "试错：伪目录",
    patch: {
      arrowFlow: 0.24,
      titleScale: 1.45,
      tabStyle: "muted",
      subMode: "overload",
      clutter: false,
      presetStyle: "arrow",
    },
  },
  failBurst: {
    label: "试错：撑爆",
    patch: {
      arrowFlow: 0.64,
      titleScale: 5.85,
      tabStyle: "bleed",
      subMode: "curated",
      clutter: false,
      presetStyle: "swiss",
    },
  },
  failEmpty: {
    label: "试错：空壳",
    patch: {
      arrowFlow: 0.12,
      titleScale: 3.2,
      tabStyle: "none",
      subMode: "empty",
      clutter: false,
      presetStyle: "arrow",
    },
  },
  reset: {
    label: "复原 0/3 错态",
    patch: { ...INITIAL_STATE },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function rectsOverlapArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}

/**
 * 单真源几何与诊断核算：
 * 传入当前状态与画布逻辑尺寸 (W, H)，返回所有可绘矩形、矢量、热区、
 * 三把原海报尺的状态以及精确白话诊断。
 */
export function computeLayout(state, W = 900, H = 560) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const secIdx = clamp(Math.round(state.sectionIndex || 0), 0, theme.sections.length - 1);
  const section = theme.sections[secIdx];
  const arrowFlow = clamp(state.arrowFlow, -0.65, 1.0);
  const titleScale = clamp(state.titleScale, 1.1, 6.0);
  const tabStyle = state.tabStyle;
  const subMode = state.subMode;
  const clutter = !!state.clutter;
  const presetStyle = state.presetStyle || "arrow";

  const padX = Math.max(14, W * 0.022);
  const padY = Math.max(12, H * 0.032);
  const sheetH = H - padY * 2;
  const sheetY = padY;

  // 左缘露出上一栏尾页（视觉隔离参照）
  const prevW = Math.round(W * 0.115);
  const prevRect = { x: padX, y: sheetY + 8, w: prevW, h: sheetH - 16 };

  // 中央与右侧：本栏目开启页（含右侧立体书口出血切口与半圆豁口透窗）
  const spineGap = Math.max(6, Math.round(W * 0.008));
  const pageX = prevRect.x + prevRect.w + spineGap;
  const edgeStackW = Math.round(W * 0.052); // 最右侧立体书口阶梯厚页边
  const pageW = Math.max(240, W - pageX - padX - edgeStackW);
  const pageRect = { x: pageX, y: sheetY, w: pageW, h: sheetH };

  // 书口出血色带（位于开启页右侧，呼应 162 原海报右侧通高朱红带）
  const tabWidthRatio = tabStyle === "bleed" ? 0.21 : tabStyle === "muted" ? 0.055 : 0;
  const tabW = Math.round(pageRect.w * tabWidthRatio);
  const tabRect = {
    x: pageRect.x + pageRect.w - tabW,
    y: pageRect.y,
    w: tabW,
    h: pageRect.h,
  };

  // 半圆弧豁口（当书口出血激活时切开右带中下部，呼应原海报最核心母题）
  const notchR = Math.round(Math.min(pageRect.h * 0.235, Math.max(54, tabW * 0.92)));
  const notchY = Math.round(pageRect.y + pageRect.h * 0.56);
  const notchX = tabStyle === "bleed" ? tabRect.x : pageRect.x + pageRect.w;
  const notchCircle = { cx: notchX, cy: notchY, r: tabStyle === "bleed" ? notchR : 0 };

  // 透过右书口露出的下页正文栏格（位于立体书口切面与豁口边缘）
  const foreEdgeRect = {
    x: pageRect.x + pageRect.w,
    y: pageRect.y + 4,
    w: edgeStackW,
    h: pageRect.h - 8,
  };

  // 书口三个阶梯索引签（复刻 1923 利西茨基阶梯拇指索引）
  const tabCount = theme.sections.length;
  const stepH = Math.round((foreEdgeRect.h - 24) / tabCount);
  const foreTabs = theme.sections.map((s, i) => ({
    index: i,
    num: s.num,
    label: s.titleA + s.titleB,
    active: i === secIdx,
    rect: {
      x: foreEdgeRect.x,
      y: foreEdgeRect.y + 12 + i * stepH,
      w: foreEdgeRect.w,
      h: stepH - 6,
    },
  }));

  // 内部版心安全区
  const mL = Math.round(pageRect.w * 0.068);
  const mT = Math.round(pageRect.h * 0.072);
  const contentX = pageRect.x + mL;
  const contentRight = pageRect.x + pageRect.w - (tabStyle === "bleed" ? tabW + 14 : 24);
  const contentW = Math.max(140, contentRight - contentX);

  // 1) 顶部栏目编号眉标
  const baseBodyPx = Math.max(10.5, Math.min(14.5, pageRect.h * 0.025));
  const eyebrowRect = {
    x: contentX,
    y: pageRect.y + mT,
    w: Math.min(contentW, 240),
    h: Math.max(32, Math.round(baseBodyPx * 2.35)),
  };

  // 2) 主标题包围盒（严格按 titleScale 真实几何缩放！）
  const titleFontPx = Math.round(baseBodyPx * titleScale);
  const titleLineH = Math.round(titleFontPx * 1.04);
  const titleLines = 2;
  const titleH = titleLineH * titleLines;
  const titleW = Math.min(pageRect.w - mL - 12, Math.round(titleFontPx * 3.35));
  const titleY = eyebrowRect.y + eyebrowRect.h + Math.round(pageRect.h * 0.022);
  const titleRect = {
    x: contentX,
    y: titleY,
    w: titleW,
    h: titleH,
  };

  // 英文副标区
  const subEnY = titleRect.y + titleRect.h + Math.round(pageRect.h * 0.015);
  const subEnH = Math.round(baseBodyPx * 1.45);
  const subEnRect = {
    x: contentX,
    y: subEnY,
    w: Math.min(contentW, 280),
    h: subEnH,
  };

  // 3) 视觉导流箭（1:1 承袭 162 原海报平直朱红大箭，直接受 arrowFlow 驱动）
  const arrowBandY = Math.round(pageRect.y + pageRect.h * 0.56); // 精准对准半圆豁口中心线！
  const shaftThickness = presetStyle === "swiss"
    ? Math.max(10, Math.round(pageRect.h * 0.026))
    : presetStyle === "slab"
      ? Math.max(20, Math.round(pageRect.h * 0.054))
      : Math.max(15, Math.round(pageRect.h * 0.044));

  // 箭头起点、终点与朝向
  const leftBleedX = pageRect.x;
  const rightGoalX = tabStyle === "bleed"
    ? notchCircle.cx + Math.round(notchCircle.r * 0.72)
    : pageRect.x + pageRect.w - 22;

  let arrowStartX, arrowTipX, arrowDir;
  if (arrowFlow < 0) {
    // 反指左页：箭头从右侧中段反刺向左缘（推回上一栏！）
    arrowDir = -1;
    const span = Math.abs(arrowFlow) * (pageRect.w * 0.46) + pageRect.w * 0.14;
    arrowStartX = Math.round(pageRect.x + pageRect.w * 0.58);
    arrowTipX = Math.round(Math.max(prevRect.x + prevRect.w * 0.42, arrowStartX - span));
  } else {
    // 正向右指：长度随 arrowFlow 从停滞短截伸展到刺入右缘半圆豁口
    arrowDir = 1;
    arrowStartX = leftBleedX;
    const minTip = leftBleedX + Math.round(pageRect.w * 0.24);
    arrowTipX = Math.round(minTip + arrowFlow * (rightGoalX - minTip));
  }

  const arrowHeadLen = Math.round(shaftThickness * 1.45);
  const arrowHeadHalf = Math.round(shaftThickness * 1.48);
  const arrowRect = {
    x: Math.min(arrowStartX, arrowTipX),
    y: arrowBandY - arrowHeadHalf,
    w: Math.abs(arrowTipX - arrowStartX),
    h: arrowHeadHalf * 2,
  };

  // 计算大标题是否因 titleScale 过大而真实压撞下方导流箭/内容区
  const overlapWithArrow = rectsOverlapArea(
    { x: titleRect.x, y: titleRect.y, w: titleRect.w, h: titleRect.h + subEnH + 6 },
    { x: pageRect.x, y: arrowBandY - shaftThickness * 0.9, w: pageRect.w, h: shaftThickness * 1.8 }
  );
  const titleOverflowPx = Math.max(0, Math.round((subEnRect.y + subEnRect.h) - (arrowBandY - arrowHeadHalf * 0.78)));
  const titleOverflowRight = Math.max(0, Math.round((titleRect.x + titleRect.w) - (pageRect.x + pageRect.w - (tabStyle === "bleed" ? tabW * 0.45 : 8))));

  // 4) 下半区：导语 + 子目路标区
  const lowerTopY = arrowBandY + Math.round(pageRect.h * 0.088);
  const lowerMaxH = Math.max(60, pageRect.y + pageRect.h - lowerTopY - Math.round(pageRect.h * 0.05));
  const lowerW = Math.max(150, pageRect.w - mL - (tabStyle === "bleed" ? tabW + 18 : 26));

  let leadRect = null;
  let subItems = [];
  let subCount = 0;

  if (subMode === "curated") {
    subCount = section.items.length; // 3 条精炼路标
    const leadW = Math.round(lowerW * 0.44);
    const listX = contentX + leadW + 18;
    const listW = Math.max(110, lowerW - leadW - 18);
    leadRect = { x: contentX, y: lowerTopY, w: leadW, h: Math.min(lowerMaxH, Math.round(baseBodyPx * 5.2)) };
    const rowH = Math.min(28, Math.floor((lowerMaxH - 6) / subCount));
    subItems = section.items.map((it, idx) => ({
      page: it.p,
      text: it.t,
      rect: { x: listX, y: lowerTopY + idx * rowH, w: listW, h: rowH - 3 },
    }));
  } else if (subMode === "overload") {
    subCount = section.overload.length; // 8 篇全文密排伪目录
    const cols = lowerW > 300 ? 2 : 1;
    const rows = Math.ceil(subCount / cols);
    const colW = Math.floor((lowerW - (cols - 1) * 10) / cols);
    // 伪目录塞满时往上侵占，并确保最后一行不贴纸边
    const overloadY = Math.max(arrowBandY + Math.round(pageRect.h * 0.06), lowerTopY - 10);
    const availH = Math.max(56, pageRect.y + pageRect.h - overloadY - 14);
    const rowH = Math.max(12.5, Math.floor(availH / rows));
    subItems = section.overload.map((txt, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      return {
        page: txt.slice(0, 3),
        text: txt.slice(4),
        rect: {
          x: contentX + c * (colW + 10),
          y: overloadY + r * rowH,
          w: colW,
          h: Math.max(11, rowH - 2),
        },
      };
    });
    leadRect = { x: contentX, y: overloadY - 12, w: lowerW, h: 12 };
  } else {
    // empty 空壳：0 子目、无导语
    subCount = 0;
    leadRect = null;
    subItems = [];
  }

  // 5) 干扰促销角标（制造双焦冲突）
  const clutterW = Math.round(Math.min(162, Math.max(104, pageRect.w * 0.29)));
  const clutterH = Math.round(Math.min(72, Math.max(48, pageRect.h * 0.145)));
  const clutterRect = clutter
    ? {
        x: Math.round(pageRect.x + pageRect.w - (tabStyle === "bleed" ? tabW + 14 : 16) - clutterW),
        y: Math.round(pageRect.y + pageRect.h * 0.085),
        w: clutterW,
        h: clutterH,
      }
    : null;

  // 6) 视觉锚点坐标（同心圆靶）
  const anchorPoint = {
    x: arrowFlow < 0 ? arrowTipX : Math.round(arrowStartX + (arrowTipX - arrowStartX) * 0.82),
    y: arrowBandY,
  };

  // 7) 实算版面墨块面积与净留白率（按开启页内部面积 single source）
  const pageArea = pageRect.w * pageRect.h;
  let inkArea = 0;
  inkArea += eyebrowRect.w * eyebrowRect.h * 0.65;
  inkArea += titleRect.w * titleRect.h * 0.82;
  inkArea += subEnRect.w * subEnRect.h * 0.6;
  inkArea += Math.abs(arrowTipX - arrowStartX) * shaftThickness * 1.15 + arrowHeadLen * arrowHeadHalf * 0.8;
  if (tabStyle === "bleed") {
    const notchCutArea = 0.5 * Math.PI * notchCircle.r * notchCircle.r * 0.55;
    inkArea += Math.max(0, tabRect.w * tabRect.h - notchCutArea);
  } else if (tabStyle === "muted") {
    inkArea += tabRect.w * tabRect.h * 0.78;
  }
  if (subMode === "overload") {
    // 8 篇伪目录整块密排区块（包含底纹与密集行阵）实质占据了下半版面
    const first = subItems[0]?.rect;
    const last = subItems[subItems.length - 1]?.rect;
    if (first && last) {
      const blockW = lowerW + 16;
      const blockH = Math.max(80, last.y + last.h - first.y + 22);
      inkArea += blockW * blockH * 1.05;
      inkArea += pageArea * 0.18; // 密排双栏视觉压迫占空
    }
  } else if (subMode === "curated") {
    if (leadRect) inkArea += leadRect.w * leadRect.h * 0.65;
    for (const it of subItems) {
      inkArea += it.rect.w * it.rect.h * 0.56;
    }
  }
  if (clutterRect) inkArea += clutterRect.w * clutterRect.h * 1.15;
  // 扣去真实重叠免双计
  inkArea = Math.max(0, inkArea - overlapWithArrow * 0.35);

  const inkPct = clamp(Math.round((inkArea / pageArea) * 100), 12, 88);
  const whitespacePct = 100 - inkPct;

  // 8) 实算核心指标
  const titleRatio = +(titleFontPx / baseBodyPx).toFixed(2);
  const tabCoveragePct = Math.round(tabWidthRatio * 100);
  const forwardPct = Math.round(arrowFlow * 100);
  const focalCount = clutter ? 2 : 1;

  // 9) 三把原海报尺（单真源判定）
  const ratioOk = titleRatio >= 2.2 && titleRatio <= 5.2 && titleOverflowPx <= 0 && titleOverflowRight <= 0;
  const tabOk = tabStyle === "bleed";
  const subOk = subMode === "curated";
  const flowOk = arrowFlow >= 0.45;
  const focusOk = !clutter;
  const spaceOk = whitespacePct >= 34;

  const entryPass = tabOk && ratioOk && subMode !== "empty";
  const hierarchyPass = ratioOk && subOk && spaceOk;
  const orientationPass = flowOk && focusOk;
  const passedCount = (entryPass ? 1 : 0) + (hierarchyPass ? 1 : 0) + (orientationPass ? 1 : 0);

  // 每把尺子的状态标签（给右侧朱红带上的 ● / ☰ / ◎ 三灯用）
  const pillars = {
    entry: {
      pass: entryPass,
      badge: !tabOk
        ? (tabStyle === "none" ? "无切口" : "切口太弱")
        : subMode === "empty"
          ? "缺导语"
          : titleRatio < 2.2
            ? `字号仅 ${titleRatio.toFixed(1)}×`
            : titleOverflowPx > 0 || titleRatio > 5.2
              ? "大字撑爆"
              : "切口明确",
      note: entryPass
        ? `书口出血 ${tabCoveragePct}% + 主标 ${titleRatio.toFixed(1)}×，一翻即识换频道。`
        : !tabOk
          ? "缺少右侧书口出血色带，翻阅时看不出新栏目入口。"
          : subMode === "empty"
            ? "只留空壳大字，没有导语接住读者对本栏的预期。"
            : titleRatio < 2.2
              ? "栏目标题太小，读者以为仍在上一栏正文中。"
              : "标题撑爆版心，反倒挤乱了栏目入口。",
    },
    hierarchy: {
      pass: hierarchyPass,
      badge: subMode === "overload"
        ? "8篇伪目录"
        : subMode === "empty"
          ? "0条空壳"
          : titleOverflowPx > 0 || titleRatio > 5.2
            ? `越界 ${Math.max(titleOverflowPx, titleOverflowRight)}px`
            : titleRatio < 2.2
              ? `仅 ${titleRatio.toFixed(1)}×`
              : !spaceOk
                ? `留白 ${whitespacePct}%`
                : `${titleRatio.toFixed(1)}× 分明`,
      note: hierarchyPass
        ? `主标 ${titleRatio.toFixed(1)}× + 3 条子目路标，净留白 ${whitespacePct}%，主次一眼分开。`
        : subMode === "overload"
          ? "塞满 8 篇全文提要，把栏目开启页做成了拥挤的目录页。"
          : subMode === "empty"
            ? "删空导语和子目后，本页只剩空壳，缺少导览价值。"
            : titleOverflowPx > 0 || titleRatio > 5.2
              ? "标题字号过大压撞下方导流带，层级失控。"
              : "主标与正文拉不开阶梯，整页发平发灰。",
    },
    orientation: {
      pass: orientationPass,
      badge: arrowFlow < 0
        ? `反指 ${forwardPct}%`
        : clutter
          ? "双焦抢眼"
          : arrowFlow < 0.45
            ? `停滞 ${forwardPct}%`
            : `右导 +${forwardPct}%`,
      note: orientationPass
        ? `单焦点向右推进 +${forwardPct}%，视线顺势滑向右缘豁口翻进正文。`
        : arrowFlow < 0
          ? "视觉动势向左反推回上一栏，读者被拽回旧内容。"
          : clutter
            ? "高饱和角标与栏目大标打架，第一眼找不到唯一锚点。"
            : "导流箭停在中段僵死，没有把读者推向下一页的动势。",
    },
  };

  // 10) 诊断文案（8 类错态 + 多组合法解识别）
  let diag = null;
  if (arrowFlow < 0) {
    diag = {
      code: "reverse_flow",
      severity: "error",
      tag: `${passedCount}/3 · 方向反推`,
      headline: `视觉箭向左反指（${forwardPct}%），把视线拽回上一栏`,
      body: "栏目开启页的动势必须指向翻页方向（右侧书口与下一页正文）。眼下这支主箭朝左刺回灰色旧栏，读者刚翻开就会产生「是不是翻错了、要退回去看」的顿挫感。",
      hint: "在画布上按住红色主箭向右拖过中线，让箭尖直指右侧书口豁口（或按方向键 →）。",
      fixAction: "fixFlow",
      fixLabel: "一键拉回右向导流",
    };
  } else if (clutter) {
    diag = {
      code: "dual_focus",
      severity: "error",
      tag: `${passedCount}/3 · 双焦冲突`,
      headline: "促销角标与栏目大标抢夺第一眼，锚点分裂",
      body: "开启页一次只容得下一个视觉锚点。眼下右上角硬贴了一块高饱和「特惠订阅」红框，跟左侧栏目标题同等抢眼，读者落眼后在两个红块间来回跳动，反而丢了栏目入口。",
      hint: "直接在画布上点击右上角红色干扰角标把它清掉。",
      fixAction: "fixClutter",
      fixLabel: "清掉抢焦角标",
    };
  } else if (titleOverflowPx > 0 || titleOverflowRight > 0 || titleRatio > 5.2) {
    diag = {
      code: "title_overflow",
      severity: "error",
      tag: `${passedCount}/3 · 大字撑爆`,
      headline: `标题放大到 ${titleRatio.toFixed(1)}× 越界压撞导流带`,
      body: `字号对比不是越大越好。标题推到 ${titleRatio.toFixed(1)}× 后，底部压进导流箭与版心安全区，净留白跌至 ${whitespacePct}%，呼吸感与导向箭一起被挤碎。`,
      hint: "把「标题字号反差」滑回调回 2.4×–4.5× 的稳态区间（或按 ↓ 键微调）。",
      fixAction: "fixTitle",
      fixLabel: "回调标题至 3.4×",
    };
  } else if (subMode === "overload") {
    diag = {
      code: "toc_overload",
      severity: "error",
      tag: `${passedCount}/3 · 塞成目录`,
      headline: `硬塞 8 篇全文摘要，把开启页做成了目录页`,
      body: `栏目开启页只需交代「这一栏讲什么 + 2 到 4 条核心路标」。眼下塞进 ${subCount} 条密排长摘要，净留白被压到 ${whitespacePct}%，既抢了「目录版式」的活，又把换频道的喘息感彻底堵死。`,
      hint: "点击画布下方的红色「伪目录过载」提示块，或在控栏把子目切到「3 条精炼路标」。",
      fixAction: "fixSub",
      fixLabel: "精简为 3 条子目路标",
    };
  } else if (titleRatio < 2.2) {
    diag = {
      code: "flat_hierarchy",
      severity: "error",
      tag: `${passedCount}/3 · 层级平灰`,
      headline: `栏目标题仅 ${titleRatio.toFixed(1)}×，混成平灰一片`,
      body: `标题只比导语大 ${titleRatio.toFixed(1)} 倍，一眼扫过分不出「栏目名、导语、子目」的先后次序。经验上栏目开启页的主标与正文/导语需要拉到 2.4×–4.5× 以上，才能一眼宣告换栏。`,
      hint: "向右推「标题字号反差」滑轨到 2.4× 以上（或按 ↑ 键）。",
      fixAction: "fixTitle",
      fixLabel: "拉开标题反差至 3.4×",
    };
  } else if (subMode === "empty") {
    diag = {
      code: "empty_shell",
      severity: "error",
      tag: `${passedCount}/3 · 空壳失导`,
      headline: "只剩一句孤零零的大字，读者不知这栏有什么",
      body: "留白不是空洞。删光导语与子目路标后，版面留白高达 " + whitespacePct + "%，却没有告诉读者接下来四五十页要读哪些内容，缺少 Jan V. White 所说的「路标导览功能」。",
      hint: "把「子目负载」切到「3 条精炼路标」，补回一句导语与三条页码预告。",
      fixAction: "fixSub",
      fixLabel: "补回导语与 3 条路标",
    };
  } else if (tabStyle !== "bleed") {
    diag = {
      code: "missing_tab",
      severity: "error",
      tag: `${passedCount}/3 · 书口隐身`,
      headline: tabStyle === "none" ? "右缘无书口出血色带，速翻根本找不到入口" : "书口仅留极细灰边，翻页切换信号太弱",
      body: "厚杂志与年报的读者常靠拇指速翻书口找板块。缺少直通裁切边的朱红出血色带与豁口，开启页合在书堆里和普通内页毫无二致，丢失了物理层面的换挡信号。",
      hint: "把「书口出血带」切到「朱红出血切口」，或直接点击画布最右侧的提示标。",
      fixAction: "fixTab",
      fixLabel: "开启朱红书口出血带",
    };
  } else if (arrowFlow < 0.45) {
    diag = {
      code: "stalled_flow",
      severity: "error",
      tag: `${passedCount}/3 · 动势停滞`,
      headline: `导流箭只伸出 +${forwardPct}%，视线停在半路`,
      body: "视觉箭头过短地蜷缩在左半页，还没把眼睛带向右缘豁口就断掉了。栏目开启页不是停靠站，而是把读者送进下一页正文的跳板。",
      hint: "在画布上继续向右拖拉红色导流箭，让箭尖顺势指向右侧半圆豁口。",
      fixAction: "fixFlow",
      fixLabel: "延伸导流箭指向右豁口",
    };
  } else {
    const styleName =
      presetStyle === "swiss"
        ? "瑞士大字网格解"
        : presetStyle === "slab"
          ? "出血色块切口解"
          : "原海报构成箭解";
    diag = {
      code: "pass",
      severity: "pass",
      tag: `3/3 · ${styleName}成立`,
      headline: `换挡明确、层级分明、视线直滑向第 ${section.items[0].p} 页`,
      body: `主标反差 ${titleRatio.toFixed(1)}× 配 3 条精炼路标，净留白 ${whitespacePct}%；右侧 ${tabCoveragePct}% 朱红出血书口切出半圆豁口，导流箭推进 +${forwardPct}% 顺势接住翻页动作——这是标准且耐看的栏目开启页。你还可以点击最右侧书口阶梯 01/02/03 试翻整刊切口变化，或切换不同解法。`,
      hint: "试着切到「瑞士大字解」「色块切口解」，或故意点「试错」观察反向失误如何破坏换挡感。",
      fixAction: null,
      fixLabel: "",
    };
  }

  // 画布内可直接点击的红色就地纠错热区（不堆太多，最多显当前最痛的 2–3 处）
  const callouts = [];
  if (clutter && clutterRect) {
    callouts.push({
      id: "clutter",
      action: "fixClutter",
      label: "× 抢焦角标 · 点删",
      x: clutterRect.x + clutterRect.w / 2,
      y: clutterRect.y + clutterRect.h + 12,
    });
  }
  if (arrowFlow < 0) {
    callouts.push({
      id: "arrow",
      action: "fixFlow",
      label: "× 反指上栏 · 向右拖",
      x: Math.max(pageRect.x + 112, Math.min(pageRect.x + pageRect.w - 110, (arrowStartX + arrowTipX) / 2 + 16)),
      y: Math.max(subEnRect.y + subEnRect.h + 18, arrowBandY - arrowHeadHalf - 12),
    });
  }
  if (subMode === "overload") {
    callouts.push({
      id: "overload",
      action: "fixSub",
      label: "× 8 篇伪目录 · 点减负",
      x: contentX + Math.min(lowerW * 0.5, 170),
      y: lowerTopY + Math.min(lowerMaxH * 0.45, 58),
    });
  } else if (subMode === "empty") {
    callouts.push({
      id: "empty",
      action: "fixSub",
      label: "× 空壳缺导览 · 点补路标",
      x: contentX + Math.min(lowerW * 0.48, 160),
      y: lowerTopY + 34,
    });
  }
  if (tabStyle !== "bleed" && callouts.length < 3) {
    callouts.push({
      id: "tab",
      action: "fixTab",
      label: tabStyle === "none" ? "× 无书口 · 点开" : "× 切口太弱 · 点强化",
      x: pageRect.x + pageRect.w - 68,
      y: pageRect.y + pageRect.h * 0.34,
    });
  }

  return {
    W,
    H,
    theme,
    section,
    secIdx,
    prevRect,
    pageRect,
    tabRect,
    notchCircle,
    foreEdgeRect,
    foreTabs,
    eyebrowRect,
    titleRect,
    titleFontPx,
    titleLineH,
    subEnRect,
    baseBodyPx,
    arrow: {
      startX: arrowStartX,
      tipX: arrowTipX,
      y: arrowBandY,
      thickness: shaftThickness,
      headLen: arrowHeadLen,
      headHalf: arrowHeadHalf,
      dir: arrowDir,
      rect: arrowRect,
    },
    leadRect,
    subItems,
    clutterRect,
    anchorPoint,
    callouts,
    metrics: {
      titleRatio,
      tabCoveragePct,
      whitespacePct,
      inkPct,
      forwardPct,
      subCount,
      focalCount,
      titleOverflowPx,
      passedCount,
    },
    pillars,
    diag,
  };
}
