// 342 内容与标题说明 幻灯片版式 — 单真源几何与诊断模型
// 所有画面坐标、字号层级比、强调色占比、视线扫视路径与白话诊单均由此文件统一计算。

export const SCRIPTS = {
  poster: {
    id: "poster",
    label: "原海报 · 沟通结构",
    shortLabel: "原海报",
    deckPrev: { num: "01", title: "信息如何被听懂", sub: "节标题转场 · 见 337", tag: "上一页 · 换气定章" },
    deckNext: { num: "03", title: "真实演讲现场对照", sub: "大图配简短图注 · 见 343", tag: "下一页 · 视觉佐证" },
    titles: {
      topic: {
        head: "幻灯片版式说明",
        sub: "关于页面分区与常见排布方式的介绍",
      },
      assertion: {
        head: "标题先定调，三步结构让观众 5 秒读懂",
        sub: "用一句话概括核心信息，吸引注意力",
      },
      wall: {
        head: "内容与标题说明幻灯片版式是把顶部核心结论、中段三步递进解释、下层辅助支持模块和底部核心提示整合到同一页里的常用汇报框架，适合需要把观点与理由一次说清的场景",
        sub: "标题写了三行，还没读到正文就先泄气",
      },
    },
    contentLabel: "内容区",
    contentSub: "用结构化的内容支撑标题，解释与展开",
    steps: [
      {
        id: 0,
        num: "01",
        title: "提出观点",
        body: "明确核心主题，让观众快速抓住关键信息",
        icon: "target",
      },
      {
        id: 1,
        num: "02",
        title: "解释说明",
        body: "用事实、数据或逻辑进行详细阐述，增强可信度",
        icon: "doc",
      },
      {
        id: 2,
        num: "03",
        title: "总结升华",
        body: "提炼要点，强化记忆，引导行动",
        icon: "bulb",
      },
    ],
    supportLabel: "支持模块",
    supportSub: "用要点、图标或短句补充关键细节",
    supports: [
      {
        id: "data",
        icon: "pie",
        title: "数据支撑",
        short: "用数据增强说服力",
        dense: "引用经核实的关键指标变化与基线对比，说明改动前后差距而非罗列整张统计报表",
      },
      {
        id: "case",
        icon: "people",
        title: "案例举例",
        short: "用实例帮助理解",
        dense: "挑一个听众熟悉的真实业务片段具象还原，避免一口气塞进三个背景完全不同的故事",
      },
      {
        id: "method",
        icon: "list",
        title: "方法步骤",
        short: "用步骤指导实践",
        dense: "给出可落地的先后次序与关键检查节点，把执行动作浓缩成短动词而不是长篇操作手册",
      },
      {
        id: "action",
        icon: "flag",
        title: "行动指引",
        short: "用号召推动执行",
        dense: "写清下一步由谁负责以及明确截止时间，让听众散场后知道第一件事该从哪里动手",
      },
    ],
    tipTitle: "核心提示",
    tipBody: "标题引导注意，内容建立信任，结构清晰，信息更有力量。",
  },

  product: {
    id: "product",
    label: "产品复盘 · 留存分析",
    shortLabel: "产品复盘",
    deckPrev: { num: "02", title: "新客留存为什么卡壳", sub: "节标题转场 · 见 337", tag: "上一页 · 切换章节" },
    deckNext: { num: "04", title: "新版首屏实机对比", sub: "产品截图配短注 · 见 343", tag: "下一页 · 界面展示" },
    titles: {
      topic: {
        head: "Q3 新手引导项目复盘",
        sub: "关于注册路径与留存指标的阶段汇报",
      },
      assertion: {
        head: "砍掉前置 5 项表单，首日留存由 31% 升至 48%",
        sub: "把价值体验提前到注册前，新客第 2 步流失拐点消失",
      },
      wall: {
        head: "本季度增长团队针对新客首日留存偏低的问题开展了多轮访谈、漏斗埋点排查和三轮灰度对照，最终定位到旧版引导在第 2 步强制填写 5 项资料导致大批用户离开，因此改版为先体验后补全",
        sub: "整段复盘堆进标题区，失去一眼定调的力道",
      },
    },
    contentLabel: "归因与路径",
    contentSub: "按问题定位、实验验证、全量策略三步展开",
    steps: [
      {
        id: 0,
        num: "01",
        title: "定位瓶颈",
        body: "前置 5 项必填挡住体验，42% 新客在第 2 步离开",
        icon: "target",
      },
      {
        id: 1,
        num: "02",
        title: "灰度验证",
        body: "4.2 万样本对照：先试用再补全，首日留存 +17pp",
        icon: "doc",
      },
      {
        id: 2,
        num: "03",
        title: "全量推广",
        body: "拆分字段按场景触发，本月 15 日覆盖全部渠道",
        icon: "bulb",
      },
    ],
    supportLabel: "佐证与落地",
    supportSub: "用核心指标与排期托住上方判断",
    supports: [
      {
        id: "data",
        icon: "pie",
        title: "留存数据",
        short: "次日留存同步升 11pp",
        dense: "连续观察 14 天灰度实验组与对照组发现，不仅是首日留存上升 17 个百分点，7 日回访率也同步稳定在 29% 以上",
      },
      {
        id: "case",
        icon: "people",
        title: "访谈样本",
        short: "18 位新客 15 秒上手",
        dense: "在可用性观察中，18 位未接触过产品的受访者全部在 15 秒内完成首个作品创建，零人卡在账号资料弹窗",
      },
      {
        id: "method",
        icon: "list",
        title: "渐进授权",
        short: "用时再问，不提前拦",
        dense: "将原本堆在启动页的昵称、行业、团队规模与通知权限拆散，分别延迟到保存、分享与协作时再按需触发",
      },
      {
        id: "action",
        icon: "flag",
        title: "切换节点",
        short: "10 月 15 日全量上线",
        dense: "客户端 4.8 版本已通过回归验收，需数据组在周五前冻结旧漏斗看板并同步切入新版事件口径",
      },
    ],
    tipTitle: "核心结论",
    tipBody: "先让用户尝到产品价值，再开口索要注册信息。",
  },

  tech: {
    id: "tech",
    label: "工程方案 · 架构演进",
    shortLabel: "工程方案",
    deckPrev: { num: "03", title: "高峰期慢查询攻坚", sub: "节标题转场 · 见 337", tag: "上一页 · 章节引入" },
    deckNext: { num: "05", title: "新旧监控延迟曲线图", sub: "实测截图配简注 · 见 343", tag: "下一页 · 压测实图" },
    titles: {
      topic: {
        head: "检索集群架构改造方案",
        sub: "关于索引存储与查询性能的工程说明",
      },
      assertion: {
        head: "拆分冷热索引后，高峰 P99 延迟从 640ms 降至 110ms",
        sub: "3 周完成平滑灰度，硬件月成本同步下降 28%",
      },
      wall: {
        head: "由于近半年历史业务日志持续暴涨至 12 TB，原有冷热混部检索集群在晚高峰频繁出现磁盘 IO 抢占和长尾超时，基础架构组经多轮压测后决定物理拆分近 7 天热索引与历史归档层",
        sub: "把背景报告硬塞进标题，决策者无法一眼看清收益",
      },
    },
    contentLabel: "改造逻辑",
    contentSub: "从根因隔离、压测结果到切流排期依次展开",
    steps: [
      {
        id: 0,
        num: "01",
        title: "隔离热路径",
        body: "独立部署近 7 天热索引，彻底甩开冷数据磁盘抖动",
        icon: "target",
      },
      {
        id: 1,
        num: "02",
        title: "压测验真",
        body: "峰值吞吐升至 2.4 倍，P99 连续七天稳在 110ms 内",
        icon: "doc",
      },
      {
        id: 2,
        num: "03",
        title: "平滑切流",
        body: "下周切走 100% 读流量，冷索引转低频对象存储",
        icon: "bulb",
      },
    ],
    supportLabel: "工程背书",
    supportSub: "用成本、先例与窗口期确认可控性",
    supports: [
      {
        id: "data",
        icon: "pie",
        title: "成本收益",
        short: "节点减半，月省 28%",
        dense: "冷数据迁移至低频存储节点后，高频 SSD 机器数量直接减半，在不牺牲查询精度的前提下实现显著降本",
      },
      {
        id: "case",
        icon: "people",
        title: "先行验证",
        short: "订单检索零故障跑满",
        dense: "订单检索服务已于上月采用同一套冷热分离模板完成切换，历经两次大促峰值均保持零回滚稳定运行",
      },
      {
        id: "method",
        icon: "list",
        title: "三步切流",
        short: "双写 → 校验 → 放量",
        dense: "先开双写观察索引一致性，再通过影子流量比对召回差异，确认 99.99% 吻合后按 10%→50%→100% 切流",
      },
      {
        id: "action",
        icon: "flag",
        title: "发布窗口",
        short: "周五 22:00 放量收口",
        dense: "本周五晚低峰窗口执行最终切流并保留 72 小时一键回切开关，值班排表与告警阈值已同步更新",
      },
    ],
    tipTitle: "核心提示",
    tipBody: "把热路径从历史包袱里剥离出来，性能与成本会同时受益。",
  },
};

export const INITIAL_STATE = {
  scriptId: "poster",
  deckSlide: 1, // 0=前页337, 1=本页342, 2=后页343
  headlineMode: "topic", // "topic" | "assertion" | "wall"
  stepOrder: [2, 0, 1], // 开场刻意倒挂：03总结 → 01观点 → 02解释
  stepFormat: "flow", // "flow" | "flat"
  supportMode: "dense", // "dense" | "poster4" | "focus2" | "none"
  accentMode: "flood", // "flood" | "single" | "flat"
  alignJitter: 0.64, // 0..1，开场参差错牙
  marginRatio: 0.036, // 0.03..0.15，开场贴边窒息
  focusPillar: null, // null | "hierarchy" | "alignment" | "rhythm" | "emphasis"
  scanActive: false,
  scanTime: 0,
};

export const SOLUTIONS = {
  poster: {
    id: "poster",
    label: "原海报典范",
    desc: "一句定调 + 01→02→03 左齐顺流 + 4 槽短句互补 + 底部单一赤陶提示",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "poster4",
      accentMode: "single",
      alignJitter: 0,
      marginRatio: 0.068,
    },
  },
  minimal: {
    id: "minimal",
    label: "极简两证解",
    desc: "保留最硬的 2 枚支持槽并放大呼吸留白，适合高管快节奏汇报",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "focus2",
      accentMode: "single",
      alignJitter: 0,
      marginRatio: 0.088,
    },
  },
  compact: {
    id: "compact",
    label: "紧凑授课解",
    desc: "四槽完整展开且边距略收紧（5.8%），信息饱满仍守住呼吸与齐边",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "poster4",
      accentMode: "single",
      alignJitter: 0.03,
      marginRatio: 0.058,
    },
  },
};

export const FAILURE_PRESETS = {
  disaster: {
    id: "disaster",
    label: "开场灾难稿",
    patch: {
      deckSlide: 1,
      headlineMode: "topic",
      stepOrder: [2, 0, 1],
      stepFormat: "flow",
      supportMode: "dense",
      accentMode: "flood",
      alignJitter: 0.64,
      marginRatio: 0.036,
    },
  },
  wallTitle: {
    id: "wallTitle",
    label: "标题变长段",
    patch: {
      deckSlide: 1,
      headlineMode: "wall",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "poster4",
      accentMode: "single",
      alignJitter: 0,
      marginRatio: 0.068,
    },
  },
  flatBullets: {
    id: "flatBullets",
    label: "退化平铺列",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flat",
      supportMode: "poster4",
      accentMode: "single",
      alignJitter: 0,
      marginRatio: 0.068,
    },
  },
  noProof: {
    id: "noProof",
    label: "空洞无证据",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "none",
      accentMode: "single",
      alignJitter: 0,
      marginRatio: 0.068,
    },
  },
  colorFlood: {
    id: "colorFlood",
    label: "满页涂重点",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "poster4",
      accentMode: "flood",
      alignJitter: 0,
      marginRatio: 0.068,
    },
  },
  overMargin: {
    id: "overMargin",
    label: "缩框挤碎卡",
    patch: {
      deckSlide: 1,
      headlineMode: "assertion",
      stepOrder: [0, 1, 2],
      stepFormat: "flow",
      supportMode: "poster4",
      accentMode: "single",
      alignJitter: 0,
      marginRatio: 0.138,
    },
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function isOrderAscending(order) {
  return order[0] === 0 && order[1] === 1 && order[2] === 2;
}

/**
 * 统一从逻辑宽高和当前状态算出实绘幻灯片全部矩形、字号、留白率、强调面积与 5 秒扫视路径。
 * 画布渲染和右侧/左侧诊断读数全部消费此返回值，绝无第二套估算常量。
 */
export function computeSlideLayout(state, width, height) {
  const script = SCRIPTS[state.scriptId] || SCRIPTS.poster;
  const compact = width < 440;
  const shortStage = height < 340;
  const padX = Math.round(width * clamp(state.marginRatio, 0.03, 0.15));
  const padY = Math.max(shortStage ? 12 : 16, Math.round(height * clamp(state.marginRatio * 0.78, 0.032, 0.12)));

  const innerX = padX;
  const innerW = Math.max(180, width - padX * 2);
  const innerY = padY;
  const innerH = Math.max(200, height - padY * 2);

  // 对齐错牙偏移（px）
  const j = clamp(state.alignJitter, 0, 1);
  const maxShift = Math.round(innerW * 0.055);
  const shiftTitle = Math.round(j * maxShift * 0.9);
  const shiftContent = Math.round(-j * maxShift * 0.35);
  const shiftSupport = Math.round(j * maxShift * 1.15);
  const shiftTip = Math.round(-j * maxShift * 0.25);

  // 基准字号（随画布宽高联合等比自适应）
  const baseScale = compact
    ? Math.min(width / 370, height / 390)
    : Math.min(width / 760, height / 465);
  const bodyFontPx = Math.max(10, Math.round((compact ? 11.2 : 12.6) * baseScale));

  // 1) 标题区几何与字号
  let titleFontPx;
  let titleLinesEst;
  if (state.headlineMode === "assertion") {
    titleFontPx = Math.round(bodyFontPx * (compact ? 1.82 : 2.08));
    titleLinesEst = 1;
  } else if (state.headlineMode === "topic") {
    titleFontPx = Math.round(bodyFontPx * (compact ? 1.38 : 1.48));
    titleLinesEst = 1;
  } else {
    // wall：长段膨胀压塌字号层级
    titleFontPx = Math.round(bodyFontPx * (compact ? 1.12 : 1.18));
    titleLinesEst = 3;
  }
  const typeRatio = +(titleFontPx / bodyFontPx).toFixed(2);

  const titleH = Math.round(innerH * (state.headlineMode === "wall" ? 0.22 : shortStage ? 0.165 : 0.165));
  const titleBox = {
    x: innerX + Math.max(0, shiftTitle),
    y: innerY,
    w: innerW - Math.abs(shiftTitle),
    h: titleH,
  };

  // 2) 内容区（三步流 01→02→03 或 退化平铺列表）
  const gap1 = Math.max(shortStage ? 4 : 6, Math.round(innerH * 0.022));
  const contentY = titleBox.y + titleBox.h + gap1;
  const contentH = Math.round(innerH * (state.supportMode === "none" ? 0.54 : shortStage ? 0.37 : 0.425));
  const contentBox = {
    x: innerX + Math.max(0, shiftContent),
    y: contentY,
    w: innerW - Math.abs(shiftContent),
    h: contentH,
  };

  const contentHeadH = shortStage
    ? Math.max(18, Math.round(bodyFontPx * 1.6))
    : Math.max(32, Math.round(contentH * (compact ? 0.23 : 0.22)));
  const cardsY = contentBox.y + contentHeadH;
  const cardsH = Math.max(54, contentBox.h - contentHeadH - 3);
  const arrowGap = state.stepFormat === "flow" ? Math.round(innerW * (compact ? 0.034 : 0.036)) : Math.round(innerW * 0.015);
  const cardW = (contentBox.w - arrowGap * 2) / 3;

  const stepBoxes = state.stepOrder.map((stepIdx, slotIdx) => {
    const step = script.steps[stepIdx];
    const slotShiftY = j > 0.14 ? Math.round((slotIdx === 1 ? -1 : slotIdx === 2 ? 1 : 0) * j * (shortStage ? 3 : 7)) : 0;
    return {
      slotIdx,
      stepIdx,
      step,
      x: contentBox.x + slotIdx * (cardW + arrowGap),
      y: cardsY + slotShiftY,
      w: cardW,
      h: cardsH - Math.abs(slotShiftY),
    };
  });

  // 3) 支持模块
  const gap2 = Math.max(shortStage ? 5 : 8, Math.round(innerH * 0.024));
  const supportY = contentBox.y + contentBox.h + gap2;
  const tipH = Math.max(shortStage ? 30 : 36, Math.round(innerH * (compact ? 0.13 : shortStage ? 0.13 : 0.125)));
  const gap3 = Math.max(shortStage ? 5 : 8, Math.round(innerH * 0.022));
  const tipY = innerY + innerH - tipH;

  const supportAvailH = Math.max(0, tipY - gap3 - supportY);
  const supportBox = {
    x: innerX + Math.max(0, shiftSupport),
    y: supportY,
    w: innerW - Math.abs(shiftSupport),
    h: supportAvailH,
  };

  const visibleSupports =
    state.supportMode === "none"
      ? []
      : state.supportMode === "focus2"
        ? [script.supports[0], script.supports[3]]
        : script.supports;

  const supHeadH = Math.max(shortStage ? 16 : 20, Math.round(bodyFontPx * (shortStage ? 1.55 : 1.85)));
  const supCardsY = supportBox.y + supHeadH;
  const supCardsH = Math.max(22, supportBox.h - supHeadH);
  const supGap = Math.round(innerW * 0.018);
  const supCols = visibleSupports.length || 1;
  const supCardW = (supportBox.w - supGap * (supCols - 1)) / supCols;

  const supportBoxes = visibleSupports.map((sup, i) => ({
    ...sup,
    index: i,
    x: supportBox.x + i * (supCardW + supGap),
    y: supCardsY,
    w: supCardW,
    h: supCardsH,
  }));

  // 4) 底部核心提示横幅
  const tipBox = {
    x: innerX + Math.max(0, shiftTip),
    y: tipY,
    w: innerW - Math.abs(shiftTip),
    h: tipH,
  };

  // 5) 实测指标（直接由实绘几何算出）
  const slideArea = width * height;
  const outerMarginArea = slideArea - innerW * innerH;
  const cardGapArea =
    gap1 * innerW +
    gap2 * innerW +
    gap3 * innerW +
    arrowGap * 2 * cardsH +
    (visibleSupports.length > 1 ? supGap * (visibleSupports.length - 1) * supCardsH : 0) +
    (state.supportMode === "none" ? supportAvailH * innerW * 0.85 : 0);
  const densityPenalty =
    (state.supportMode === "dense" ? 0.11 : 0) +
    (state.headlineMode === "wall" ? 0.055 : 0) +
    (state.stepFormat === "flat" ? 0.025 : 0);
  const whitespaceRatio = clamp((outerMarginArea + cardGapArea) / slideArea + 0.14 - densityPenalty, 0.08, 0.62);
  const whitespacePct = Math.round(whitespaceRatio * 100);

  // 强调色（赤陶）覆盖面积占比
  const tipArea = tipBox.w * tipBox.h;
  const triArea = titleFontPx * titleFontPx * 0.45;
  let accentArea = 0;
  if (state.accentMode === "single") {
    accentArea = tipArea + triArea;
  } else if (state.accentMode === "flood") {
    const stepsArea = stepBoxes.reduce((s, b) => s + b.w * b.h * 0.42, 0);
    const supsArea = supportBoxes.reduce((s, b) => s + b.w * b.h * 0.52, 0);
    accentArea = tipArea + titleBox.w * titleBox.h * 0.55 + stepsArea + supsArea;
  } else {
    accentArea = 0;
  }
  const accentPct = Math.round((accentArea / slideArea) * 100);

  // 6) 5 秒观众扫视路径（由实绘视觉引力真实决定，而不是写死固定路线）
  const scanWaypoints = buildScanWaypoints(state, { titleBox, stepBoxes, supportBoxes, tipBox });

  return {
    script,
    width,
    height,
    compact,
    padX,
    padY,
    innerX,
    innerY,
    innerW,
    innerH,
    bodyFontPx,
    titleFontPx,
    titleLinesEst,
    typeRatio,
    titleBox,
    contentBox,
    stepBoxes,
    supportBox,
    supportBoxes,
    tipBox,
    whitespacePct,
    accentPct,
    marginPct: +(state.marginRatio * 100).toFixed(1),
    alignDeltaPx: Math.max(Math.abs(shiftTitle - shiftContent), Math.abs(shiftSupport - shiftContent), Math.abs(shiftTitle - shiftSupport)),
    scanWaypoints,
  };
}

function centerOf(b) {
  return { x: b.x + b.w * 0.5, y: b.y + b.h * 0.5 };
}

function buildScanWaypoints(state, { titleBox, stepBoxes, supportBoxes, tipBox }) {
  const pts = [];
  const tPt = { x: titleBox.x + titleBox.w * 0.28, y: titleBox.y + titleBox.h * 0.44 };
  const s0 = centerOf(stepBoxes[0]);
  const s1 = centerOf(stepBoxes[1]);
  const s2 = centerOf(stepBoxes[2]);
  const supMid = supportBoxes.length ? centerOf(supportBoxes[Math.floor(supportBoxes.length / 2)]) : { x: tipBox.x + tipBox.w * 0.5, y: tipBox.y - 34 };
  const tipPt = centerOf(tipBox);

  // 如果到处涂赤陶，第一眼会被满屏强色扯偏去撞支持槽与横幅
  if (state.accentMode === "flood") {
    pts.push({ ...tipPt, t: 0.45, label: "强色抢眼", bad: true });
    pts.push({ ...tPt, t: 1.35, label: "回找标题", bad: state.headlineMode !== "assertion" });
    pts.push({ ...s2, t: 2.35, label: "视线跳票", bad: true });
    pts.push({ ...s0, t: 3.35, label: "折返寻因", bad: !isOrderAscending(state.stepOrder) });
    pts.push({ ...supMid, t: 4.35, label: "陷入密字", bad: state.supportMode === "dense" });
    return pts;
  }

  // 正常起眼看标题
  pts.push({
    ...tPt,
    t: state.headlineMode === "wall" ? 1.55 : 0.75,
    label: state.headlineMode === "assertion" ? "0.8s 抓结论" : state.headlineMode === "topic" ? "标题无结论" : "长段读不完",
    bad: state.headlineMode !== "assertion",
  });

  // 若步骤顺序倒挂，观众在三步卡里来回折返寻找 01 观点
  if (!isOrderAscending(state.stepOrder) || state.stepFormat === "flat") {
    const idx01 = stepBoxes.findIndex((b) => b.stepIdx === 0);
    const box01 = stepBoxes[idx01 >= 0 ? idx01 : 0];
    pts.push({ ...s0, t: 1.75, label: state.stepFormat === "flat" ? "平铺无序" : "先撞错序卡", bad: true });
    pts.push({ ...centerOf(box01), t: 2.75, label: "折返找观点", bad: true });
    pts.push({ ...s2, t: 3.65, label: "漏看因果", bad: true });
  } else {
    pts.push({ ...s0, t: 1.65, label: "01 提出观点", bad: false });
    pts.push({ ...s1, t: 2.55, label: "02 解释说明", bad: false });
    pts.push({ ...s2, t: 3.35, label: "03 总结升华", bad: false });
  }

  if (supportBoxes.length) {
    pts.push({
      ...supMid,
      t: state.supportMode === "dense" ? 4.45 : 4.05,
      label: state.supportMode === "dense" ? "密字卡死" : "速扫佐证",
      bad: state.supportMode === "dense",
    });
  } else {
    pts.push({ ...supMid, t: 4.1, label: "缺少证据", bad: true });
  }

  pts.push({
    ...tipPt,
    t: 4.8,
    label: state.accentMode === "flat" ? "收口平淡" : "锁定核心提示",
    bad: state.accentMode !== "single",
  });
  return pts;
}

/**
 * 单真源四柱诊断：严格消费 computeSlideLayout 返回的实绘几何，绝不写死答案。
 */
export function evaluateSlide(state, layout) {
  const issues = [];

  // 1. 层级（Hierarchy）
  let hierarchyOk = true;
  let hierarchyBadge = `主次 ${layout.typeRatio.toFixed(1)}×`;
  if (state.headlineMode === "topic") {
    hierarchyOk = false;
    hierarchyBadge = "空壳名词标";
    issues.push({
      pillar: "hierarchy",
      severity: 10,
      short: "空壳标题",
      title: `标题只写了名词标签「${layout.script.titles.topic.head}」，观众 3 秒抓不到结论`,
      why: `当前主次字号比仅 ${layout.typeRatio.toFixed(2)}×，且标题只交代了「讲什么话题」而没说出「结论是什么」。后排听众必须硬读完下方所有文字才能猜出你的立场。`,
      fix: "直接点击画布上的「标题区」（或切换下方「一句论断」），把结论先交到观众手里。",
      targetArea: "title",
    });
  } else if (state.headlineMode === "wall") {
    hierarchyOk = false;
    hierarchyBadge = `3行塌平 ${layout.typeRatio.toFixed(1)}×`;
    issues.push({
      pillar: "hierarchy",
      severity: 9,
      short: "层级塌平",
      title: `标题硬塞成 3 行长段，主次字号比跌到 ${layout.typeRatio.toFixed(2)}×`,
      why: "把整段背景复述塞进标题区，迫使字号缩水到几乎和正文一样大；标题不再是入口，而是整页第一堵字墙。",
      fix: "点击画布「标题区」切回「一句论断」，把展开理由交给下方 01→02→03 内容区。",
      targetArea: "title",
    });
  }

  // 2. 对齐与留白（Alignment）
  let alignmentOk = true;
  let alignmentBadge = `齐边 · 距 ${layout.marginPct}%`;
  const marginTight = state.marginRatio < 0.052;
  const marginOver = state.marginRatio > 0.112;
  const jitterBad = state.alignJitter > 0.14;

  if (jitterBad) {
    alignmentOk = false;
    alignmentBadge = `错牙 ${layout.alignDeltaPx}px`;
    issues.push({
      pillar: "alignment",
      severity: 8,
      short: "左缘错牙",
      title: `标题、内容与支持模块左缘错开 ${layout.alignDeltaPx}px，视觉秩序松散`,
      why: "人眼向下扫视依赖稳定的左侧垂直锚线。起笔忽左忽右，观众每换一层都要重新校准目光，显得像临时拼凑的草稿。",
      fix: "在画布空白处向右横拖，或把下方「左对齐错牙」拖回 0%，让四层模块钉死在同一条左基准线上。",
      targetArea: "align",
    });
  }
  if (marginTight) {
    alignmentOk = false;
    alignmentBadge = jitterBad ? `错牙+贴边` : `窒息 ${layout.marginPct}%`;
    issues.push({
      pillar: "alignment",
      severity: 7,
      short: "边距窒息",
      title: `四周留白边距仅占 ${layout.marginPct}%（画面留白 ${layout.whitespacePct}%），文字快顶破卡边`,
      why: "投影仪四边常有轻微裁切，且过窄边距会把四层模块挤成一团高密度纸砖，显著推高观众的外在认知负荷。",
      fix: "向右拖动「呼吸留白」滑尺到 5.5%–10.5% 之间，给幻灯片留出呼吸边框。",
      targetArea: "margin",
    });
  } else if (marginOver) {
    alignmentOk = false;
    alignmentBadge = `过缩 ${layout.marginPct}%`;
    issues.push({
      pillar: "alignment",
      severity: 7,
      short: "缩框挤碎",
      title: `边距拉大到 ${layout.marginPct}%，三步逻辑卡片被挤成窄竖条`,
      why: "留白不是越多越好——超过 11% 的厚重空边会强行压缩三列卡片宽度，导致正文字行频繁折断、结构反而支离破碎。",
      fix: "把「呼吸留白」回调到 6%–10% 的舒展区间，让卡片比例重新舒展开。",
      targetArea: "margin",
    });
  }

  // 3. 阅读节奏（Rhythm）
  let rhythmOk = true;
  const orderText = state.stepOrder.map((i) => `0${i + 1}`).join("→");
  let rhythmBadge = state.supportMode === "focus2" ? `${orderText} · 2证` : `${orderText} · 4短证`;

  if (state.stepFormat === "flat") {
    rhythmOk = false;
    rhythmBadge = "无序平铺";
    issues.push({
      pillar: "rhythm",
      severity: 9,
      short: "退化清单",
      title: "内容区退化为无编号、无箭头的平铺项目符号",
      why: "缺少 01→02→03 的递进信号，三条内容看起来互不关联，页面滑回了最普通的列表幻灯片（336），失去了「解释与展开」的因果牵引力。",
      fix: "点击画布中间的「内容区」（或切回「三步推进」），恢复 01→02→03 递进骨架。",
      targetArea: "steps",
    });
  } else if (!isOrderAscending(state.stepOrder)) {
    rhythmOk = false;
    rhythmBadge = `倒挂 ${orderText}`;
    issues.push({
      pillar: "rhythm",
      severity: 10,
      short: "逻辑倒挂",
      title: `三步解释顺序倒挂成 ${orderText}，观众视线被迫来回折返`,
      why: `第 1 格先抛出了「${layout.stepBoxes[0].step.title}」，而核心起点「01 ${layout.script.steps[0].title}」藏在后面——违背「由总到分、由简到繁」的自然推进顺序。`,
      fix: "直接在画布上按住并左右拖动 01 / 02 / 03 卡片，把它们排回 01 → 02 → 03 的顺流顺序。",
      targetArea: "steps",
    });
  }

  if (state.supportMode === "dense") {
    rhythmOk = false;
    if (rhythmBadge.indexOf("倒挂") === -1 && rhythmBadge !== "无序平铺") rhythmBadge = "4槽密字超载";
    issues.push({
      pillar: "rhythm",
      severity: 8,
      short: "证据超载",
      title: "底部支持模块 4 槽全塞满长句，读字负担反超主叙事线",
      why: "支持模块的任务是「用要点、图标或短句补充关键细节」。一旦四格各塞二三十字，观众会低头读小字而听不进演讲者说话。",
      fix: "点击画布「支持模块」，精简为原海报 4 槽短句或精选 2 槽硬证据。",
      targetArea: "support",
    });
  } else if (state.supportMode === "none") {
    rhythmOk = false;
    if (rhythmBadge.indexOf("倒挂") === -1 && rhythmBadge !== "无序平铺") rhythmBadge = "缺证据支撑";
    issues.push({
      pillar: "rhythm",
      severity: 6,
      short: "空洞无据",
      title: "支持模块被完全清空，只剩观点框架缺少事实验证",
      why: "对于解释型幻灯片，光有三步口号难以建立信任——至少需要 2–4 枚简短的数据、案例或行动锚点托住结论。",
      fix: "点击画布下方「支持模块」槽位，补回精选 2 槽或原海报 4 槽短句支撑。",
      targetArea: "support",
    });
  }

  // 4. 强调重点（Emphasis）
  let emphasisOk = true;
  let emphasisBadge = `单色收口 ${layout.accentPct}%`;
  if (state.accentMode === "flood") {
    emphasisOk = false;
    emphasisBadge = `泛滥 ${layout.accentPct}%`;
    issues.push({
      pillar: "emphasis",
      severity: 9,
      short: "满页涂重点",
      title: `赤陶强调色占满 ${layout.accentPct}% 版面，到处划重点等于没有重点`,
      why: "标题、三步卡片、支持模块和底部横幅同时抢眼，观众进入页面时目光无处落脚，真正该带走的「核心提示」反被淹没。",
      fix: "点击底部「核心提示」横幅（或切回「单一收口」），把高饱和赤陶只留给唯一核心落点。",
      targetArea: "tip",
    });
  } else if (state.accentMode === "flat") {
    emphasisOk = false;
    emphasisBadge = "无暖色落点";
    issues.push({
      pillar: "emphasis",
      severity: 7,
      short: "全灰失焦",
      title: "全页撤掉暖色强调，底部核心提示隐没在灰米底色里",
      why: "整页视觉重量过于平均，演讲结束切到下一页前，观众很难一眼记住最核心的那一句总结。",
      fix: "点击底部「核心提示」横幅，点亮全页唯一的赤陶色强调带。",
      targetArea: "tip",
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  const pillars = {
    hierarchy: { ok: hierarchyOk, badge: hierarchyBadge, label: "层级" },
    alignment: { ok: alignmentOk, badge: alignmentBadge, label: "对齐" },
    rhythm: { ok: rhythmOk, badge: rhythmBadge, label: "阅读节奏" },
    emphasis: { ok: emphasisOk, badge: emphasisBadge, label: "强调重点" },
  };

  const passCount = [hierarchyOk, alignmentOk, rhythmOk, emphasisOk].filter(Boolean).length;

  let loadLevel = "低负荷 · 5秒可读（示意）";
  if (passCount <= 1) loadLevel = "严重拥堵 · 5秒迷路（示意）";
  else if (passCount === 2) loadLevel = "中重阻塞 · 反复折返（示意）";
  else if (passCount === 3) loadLevel = "轻度卡顿 · 差临门一脚（示意）";

  // 汇总主诊单（优先展示 focusPillar 对应问题，否则最高优先级问题）
  let primary = issues[0] || null;
  if (state.focusPillar) {
    const match = issues.find((x) => x.pillar === state.focusPillar);
    if (match) primary = match;
  }

  let verdictTitle;
  let verdictWhy;
  let verdictFix;
  let pillShort;

  if (passCount === 4) {
    const styleName =
      state.supportMode === "focus2"
        ? "极简两证解成立：留白通透，核心证据直指结论"
        : state.marginRatio < 0.062
          ? "紧凑演讲解成立：四维信息饱满，秩序依然稳固"
          : "4/4 清晰成立：标题定调、三步顺流、证据克制、单色收口";
    verdictTitle = styleName;
    verdictWhy = `主次字号比 ${layout.typeRatio.toFixed(2)}×、左缘齐平且边距 ${layout.marginPct}%（留白 ${layout.whitespacePct}%）、三步沿 01→02→03 自然推进，赤陶强调色克制在 ${layout.accentPct}%。按 Space 播放 5 秒扫视，看视线如何一路顺流。`;
    verdictFix = "你还可以换「极简两证解」或故意拖乱步骤顺序、切「标题变长段」，亲手验证反向边界。";
    pillShort = "4/4 · 5秒清晰传达";
  } else {
    verdictTitle = primary.title;
    verdictWhy = primary.why;
    verdictFix = primary.fix;
    pillShort = `${passCount}/4 · ${primary.short}`;
  }

  return {
    passCount,
    total: 4,
    pillars,
    issues,
    primary,
    loadLevel,
    pillShort,
    verdictTitle,
    verdictWhy,
    verdictFix,
  };
}
