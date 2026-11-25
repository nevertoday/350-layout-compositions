// 268 辅助窗格布局 · 核心状态模型与诊断文案
// 所有位置、比例、场景与诊断都在这里维护，供开场画布与各实验共用。

export const SWEET_RATIO = 0.30;
export const COLLAPSE_THRESHOLD = 0.06;
export const MAX_RATIO = 0.54;

export const SCENARIOS = {
  analysis: {
    id: "analysis",
    label: "数据分析",
    en: "DATA ANALYSIS",
    mainTitle: "季度留存与转化趋势",
    mainSub: "主内容：折线趋势与核心指标卡",
    auxTitle: "分析支撑",
    series: [
      { label: "Q1", all: [0.34, 0.42, 0.39, 0.56, 0.52, 0.68, 0.74], filtered: [0.28, 0.36, 0.44, 0.52, 0.61, 0.66, 0.78] },
      { label: "柱图", barsAll: [0.38, 0.64, 0.88], barsFiltered: [0.56, 0.74, 0.92] },
      { label: "占比", pieAll: 0.72, pieFiltered: 0.84 },
    ],
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅看核心付费群体", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "核心指标 · 同比口径", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "4 月改版后曲线抬升", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "悬停或点击图表联动", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "关联 3 份明细报表", interactive: true, dashed: true },
    ],
    focusNotes: [
      "已聚焦「主趋势线」：右侧同步标出 4 月改版备注与口径标签，无需离开图表。",
      "已聚焦「分渠道柱图」：辅助窗格即时筛出高留存渠道并挂接关联明细。",
      "已聚焦「结构占比」：上下文备注解释分母口径，防止把局部波动误判成全盘异常。",
    ],
  },
  browsing: {
    id: "browsing",
    label: "内容浏览",
    en: "CONTENT BROWSING",
    mainTitle: "长文阅读与资料查证",
    mainSub: "主内容：连续正文与插图",
    auxTitle: "阅读上下文",
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅显示引用与释义", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "UI 架构 · 响应式", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "第 2 段术语边注", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "可收起进入沉浸阅读", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "延伸章节与出处链接", interactive: true, dashed: true },
    ],
    focusNotes: [
      "已聚焦「核心段落」：右侧像纸书边注一样列出术语释义，眼神平移即读、读完即回。",
      "已聚焦「案例插图」：辅助窗格给出数据来源与拍摄参数，正文不必塞进冗长括号。",
      "已聚焦「结论摘要」：右侧亮出关联延伸篇目，顺着兴趣深入，不打断当前行文。",
    ],
  },
  creation: {
    id: "creation",
    label: "编辑创作",
    en: "CONTENT CREATION",
    mainTitle: "海报与界面画布",
    mainSub: "主内容：所见即所得创作画布",
    auxTitle: "属性检查器",
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅显示选中图层参数", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "栅格 12 列 · 间距 16", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "组件已同步设计规范", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "数值修改实时生效", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "关联 4 处复用实例", interactive: true, dashed: true },
    ],
    focusNotes: [
      "已选中「标题组件」：右侧检查器自动切到字重与行距，调完立刻在主画布看效果。",
      "已选中「主视觉图框」：辅助窗格亮出裁切比例与边距标尺，避免模态弹窗遮挡画布。",
      "已选中「底部卡片组」：右侧显示关联的 4 处复用实例，一改联动、心中有数。",
    ],
  },
  settings: {
    id: "settings",
    label: "设置管理",
    en: "SETTINGS & CONFIG",
    mainTitle: "权限与工作流策略",
    mainSub: "主内容：规则条目与开关清单",
    auxTitle: "影响与校验",
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅看已修改的规则", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "生产环境 · 需复核", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "影响 18 名协作成员", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "保存前确认生效范围", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "依赖认证与日志模块", interactive: true, dashed: true },
    ],
    focusNotes: [
      "已选中「发布审批规则」：右侧即时列出受影响成员与前置条件，改前就能预判后果。",
      "已选中「通知频率策略」：辅助窗格给出推荐默认值提示，减少反复查文档的麻烦。",
      "已选中「数据导出权限」：右侧高亮关联的审计模块，确保安全配置不遗漏。",
    ],
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function snapRatio(raw) {
  const v = clamp(raw, 0, MAX_RATIO);
  if (v < COLLAPSE_THRESHOLD) return { ratio: 0, collapsed: true, snapped: true };
  if (Math.abs(v - SWEET_RATIO) <= 0.025) return { ratio: SWEET_RATIO, collapsed: false, snapped: true };
  return { ratio: v, collapsed: false, snapped: false };
}

export function describeSplit(ratio, collapsed) {
  const auxPct = collapsed ? 0 : Math.round(ratio * 100);
  const mainPct = 100 - auxPct;

  if (collapsed || auxPct === 0) {
    return {
      status: "collapsed",
      badge: "已折叠 · 专注态",
      mainPct: 100,
      auxPct: 0,
      title: "辅助退场，主内容占满 100%",
      text: "正如海报底部 TIP 所说：辅助窗格按需出现，折叠后退为虚线占位，让主内容区始终保持宽敞。",
      note: "适合深度阅读、演示汇报或精修细节；需要筛选、备注或核对关联时一键唤出即可。",
    };
  }
  if (auxPct < 20) {
    return {
      status: "narrow",
      badge: "偏窄 · 易折行",
      mainPct,
      auxPct,
      title: `辅助窗格仅 ${auxPct}%：放不下完整上下文`,
      text: "虽然主内容很宽敞，但右侧空间太挤——标签、备注和筛选控件被迫折成竖条，反而增加扫视成本。",
      note: "经验上，桌面端如果窗格窄于约 220–240 px，不如直接收成图标轨或彻底折叠。",
    };
  }
  if (auxPct <= 34) {
    return {
      status: "sweet",
      badge: "主次成立",
      mainPct,
      auxPct,
      title: `${mainPct}% 主内容 + ${auxPct}% 辅助窗格：稳妥区间`,
      text: "视线一眼先落进左侧深蓝主内容区；向右轻扫就能拿到筛选、备注与关联，不打断主任务，也不抢重心。",
      note: "经验区间约占桌面宽度的 22%–34%（或定宽 260–380 px）；与海报自身约 7 : 3 的切分恰好呼应。",
    };
  }
  if (auxPct <= 42) {
    return {
      status: "heavy",
      badge: "略显偏重",
      mainPct,
      auxPct,
      title: `辅助窗格占到 ${auxPct}%：重心开始右移`,
      text: "主内容区已开始收缩，图表与卡片留白变紧；如果右栏文字偏密，读者会先在两栏之间犹豫看哪边。",
      note: "只有在用户临时精调复杂参数时才值得暂时拉宽，平时应退回 30% 左右或做成可拖拽边界。",
    };
  }
  return {
    status: "hijack",
    badge: "喧宾夺主",
    mainPct,
    auxPct,
    title: `${mainPct}% vs ${auxPct}%：已退化成对等分屏`,
    text: "两侧面积势均力敌，主次层级彻底消失——你做的不再是辅助窗格，而是两个互相抢注意力的平级窗口。",
    note: "若两块内容本来就平级对照，请改用 259 分屏布局；否则应把辅助窗格压回 1/3 以内。",
  };
}

// 第 03 节：视口宽度 × 策略（定宽 vs 死绑比例）× 视觉噪声
export function describeStress(viewportW, mode, noisy) {
  const auxPx = mode === "fixed"
    ? Math.min(340, Math.max(260, Math.round(viewportW * 0.28 > 340 ? 340 : 320)))
    : Math.round(viewportW * 0.32);
  const actualAux = mode === "fixed" ? Math.min(340, Math.round(viewportW * 0.48)) : auxPx;
  const mainPx = viewportW - actualAux;
  const auxPct = Math.round((actualAux / viewportW) * 100);
  const mainPct = 100 - auxPct;

  let status = "good";
  let badge = "主次清晰";
  let verdict = "";

  if (viewportW < 840) {
    status = "warn";
    badge = "屏宽不足 840px";
    verdict = `在 ${viewportW} px 宽的屏幕上硬并排，主内容只剩 ${mainPx} px（${mainPct}%），辅助窗格占了 ${auxPct}%——两栏互相挤压。按 Material Design 3 的经验门槛，低于 840 dp 应停止常驻并列，改放到底部或折叠为抽屉。`;
  } else if (mode === "ratio" && viewportW >= 1800) {
    status = "warn";
    badge = "超宽屏虚胖";
    verdict = `死绑 32% 比例在 ${viewportW} px 超宽屏上会把辅助窗格撑到 ${actualAux} px！短短几行筛选与备注被拉出大片空洞，眼睛从主区到右栏来回扫视距离过长。改为定宽（如 320–360 px）能把多余宽屏全还给主内容。`;
  } else if (noisy) {
    status = "warn";
    badge = "视觉抢戏";
    verdict = `虽然宽度比例只有 ${auxPct}%（${actualAux} px），但右栏塞满高饱和角标、红点和推广卡片，视觉重量立刻压过主区——既打断专注，也容易触发 NN/g 警告的「右栏盲视（Right-Rail Blindness）」。`;
  } else if (mode === "fixed") {
    status = "good";
    badge = "定宽弹性 · 推荐";
    verdict = `辅助窗格锁定在约 ${actualAux} px（占 ${auxPct}%，接近 M3 推荐的 360 dp 基准），${mainPx} px 全部留给主内容弹性伸展；加上同色系低噪处理，越宽的屏幕主任务越舒展。`;
  } else {
    status = "ok";
    badge = "常规屏尚可";
    verdict = `在 ${viewportW} px 常规桌面宽下，32% 约合 ${actualAux} px，暂时落在舒适区；但把滑块拖到 2000 px 以上或 840 px 以下，就能看出纯百分比策略在两端失衡的问题。`;
  }

  return { auxPx: actualAux, mainPx, auxPct, mainPct, status, badge, verdict };
}

// 第 04 节：响应式断点形态
export function describeBreakpoint(vw, behavior, open) {
  if (vw >= 1024) {
    return {
      tier: "expanded-wide",
      tierLabel: "桌面宽屏（≥ 1024 px）",
      layoutMode: open ? (behavior === "push" ? "docked-push" : "docked-overlay") : "collapsed",
      badge: open ? (behavior === "push" ? "常驻并列 · 推挤" : "按需浮层 · 覆盖") : "已折叠 · 全宽主区",
      title: open
        ? (behavior === "push" ? "双窗格常驻并列，主内容顺畅呼吸" : "主内容保持满宽，辅助窗格从右侧浮出")
        : "辅助窗格收起为虚线占位，主内容独占 100%",
      text: open
        ? (behavior === "push"
            ? "超过 1024 px 时并排空间充裕：主内容弹性伸展，辅助窗格定宽约 320–360 px 贴右侧停靠。适合需要持续对照上下文的工作台。"
            : "即便是桌面端，如果主内容是宽表格或超宽画布，也可用「浮层（Overlay）」模式：展开时主区不发生重排抖动，用完即关。")
        : "把折叠开关留在顶部工具栏固定位置，用户就能随时在「沉浸专注」与「双窗格对照」之间一键切换。",
    };
  }
  if (vw >= 840) {
    return {
      tier: "expanded-tight",
      tierLabel: "临界展开区（840–1023 px）",
      layoutMode: open ? (behavior === "push" ? "tight-push" : "overlay-sheet") : "collapsed",
      badge: open ? (behavior === "push" ? "紧并列 · 空间吃紧" : "右侧浮层 · 更稳妥") : "默认收起 · 留白优先",
      title: open
        ? (behavior === "push" ? "刚跨过 840 dp 门槛：并排可行但余量紧张" : "切为右侧浮层，保住主区不被压窄")
        : "临界屏宽下默认收起，点一下再展开",
      text: "840 dp 是 Material Design 3 支撑窗格允许左右并列的下限。在这个区间里，如果主内容本身信息密度高，用「覆盖浮层」或「默认折叠」通常比硬推挤更舒服。",
    };
  }
  if (vw >= 600) {
    return {
      tier: "medium",
      tierLabel: "中等屏 / 竖平板（600–839 px）",
      layoutMode: open ? (behavior === "push" ? "bottom-stack" : "overlay-sheet") : "collapsed",
      badge: open ? (behavior === "push" ? "折到下方 · 支撑区" : "右侧临时抽屉") : "收起 · 单栏主内容",
      title: open
        ? (behavior === "push" ? "空间不够并排：辅助窗格自动沉到主内容下方" : "右侧滑出临时抽屉，看完即收")
        : "竖屏平板下主内容先占满整行",
      text: "600–839 px 继续硬做左右两栏会让两边都变瘦长。M3 建议把支撑窗格移至主内容下方，或改为点击呼出的临时侧边面板（Overlay Sheet）。",
    };
  }
  return {
    tier: "compact",
    tierLabel: "紧凑屏 / 手机（< 600 px）",
    layoutMode: open ? "bottom-sheet" : "collapsed",
    badge: open ? "底部抽屉 · Bottom Sheet" : "单列聚焦 · 底部入口",
    title: open ? "手机竖屏：辅助窗格化为底部抽屉上滑" : "手机上主内容独占全屏，辅助入口轻挂在底/顶栏",
    text: "手机横宽连主内容都刚够读，绝不要硬拆左右双窗格。把筛选、备注、关联收进可上滑的底部抽屉（Bottom Sheet），既不遮挡顶部核心信息，又顺手好单手拇指操作。",
  };
}

// 第 07 节：小练习四套方案
export const QUIZ_OPTIONS = {
  A: {
    correct: false,
    tag: "主次失衡",
    title: "A 是对等分屏，不是辅助窗格",
    text: "左右 50% : 50% 平分，而且右侧用了极重的大块色卡，主折线图被压得又窄又扁。视线进页面时左右打架，违背了海报第一条原则「主次分明」。",
  },
  B: {
    correct: false,
    tag: "右栏盲视陷阱",
    title: "B 比例对了，却装进了无关的杂物",
    text: "72% : 28% 的切分本身没问题，但右侧塞满「热榜推荐」「活动公告」等与当前图表毫无关系的模块，也没给折叠开关——这正是 NN/g 警示的「杂物右栏」，违背了「信息互补」与「保持关联」。",
  },
  C: {
    correct: true,
    tag: "最成立",
    title: "选对了！C 同时满足主次、互补、关联与可折叠",
    text: "主数据区占约 72% 宽敞居中，右侧约 28% 低噪辅助窗格只放当前图表的筛选、口径备注与关联钻取；选中数据点与右栏高亮呼应，右上角保留收起开关，完美落齐海报的三条原则与底部 TIP。",
  },
  D: {
    correct: false,
    tag: "双侧夹击窒息",
    title: "D 同时锁死左右两栏，主内容被夹得只剩 42%",
    text: "左侧宽导航与右侧宽检查器同时常驻且不可折叠，留给核心图表的只剩中间一条窄缝。三列并存时必须允许至少一侧收起，否则主任务反而成了配角。",
  },
};
