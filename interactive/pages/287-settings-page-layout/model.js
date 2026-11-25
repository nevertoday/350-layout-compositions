// 287 设置页面布局 · 单一真相数据模型（model.js）
// 所有读数、几何尺寸、错误诊断、希克选择深度（示意）与反馈状态均从同一份 state 计算。

export const DENSITY_SPECS = {
  cramped: {
    id: "cramped",
    label: "窒息粘连",
    tag: "错态",
    innerGap: 4,
    outerGap: 6,
    rowHeight: 28,
    cardPad: 6,
    valid: false,
    audience: "过密易误触",
    screens: 0.72,
  },
  compact: {
    id: "compact",
    label: "紧凑",
    tag: "高级用户",
    innerGap: 8,
    outerGap: 20,
    rowHeight: 36,
    cardPad: 12,
    valid: true,
    audience: "信息密度高，适合高频专业用户",
    screens: 0.85,
  },
  standard: {
    id: "standard",
    label: "标准",
    tag: "原海报解",
    innerGap: 12,
    outerGap: 24,
    rowHeight: 42,
    cardPad: 16,
    valid: true,
    audience: "平衡效率与易用性，通用推荐",
    screens: 1.0,
  },
  loose: {
    id: "loose",
    label: "宽松",
    tag: "新手友好",
    innerGap: 16,
    outerGap: 32,
    rowHeight: 48,
    cardPad: 20,
    valid: true,
    audience: "信息更舒展，降低新手压迫感",
    screens: 1.28,
  },
  "gapped-out": {
    id: "gapped-out",
    label: "组内散架",
    tag: "错态",
    innerGap: 26,
    outerGap: 14,
    rowHeight: 44,
    cardPad: 10,
    valid: false,
    audience: "内距宽于外距，归属感倒挂",
    screens: 1.38,
  },
};

export const SIDEBAR_NAV = [
  { id: "general", label: "常规", icon: "gear", desc: "语言、时区与启动项" },
  { id: "layout", label: "页面布局", icon: "grid", desc: "结构、宽度与模块显隐" },
  { id: "theme", label: "颜色主题", icon: "palette", desc: "浅深色与强调色方案" },
  { id: "type", label: "字体排版", icon: "type", desc: "字号、行距与字族" },
  { id: "interact", label: "交互行为", icon: "pointer", desc: "快捷键与焦点策略" },
  { id: "sync", label: "数据与同步", icon: "sync", desc: "本地备份与云端同步" },
  { id: "about", label: "关于", icon: "info", desc: "版本信息与许可" },
];

export const SCENARIOS = {
  layout: {
    id: "layout",
    label: "原海报 · 页面布局",
    shortLabel: "页面布局",
    navId: "layout",
    paneTitle: "页面布局",
    paneSub: "配置页面结构、内容区域与显示方式",
    previewTitle: "实时预览",
    dragLabel: "侧边栏宽",
    dragHint: "横拖分界线调栏宽",
    defaults: {
      layoutMode: "dual", // single | dual | triple | free
      mainWidth: 72, // % (sidebar = 100 - mainWidth)
      maxWidth: 1280,
      showHeader: true,
      showSidebar: true,
      showFooter: false,
      showBreadcrumb: true,
      showBackTop: true,
      showPageNum: false,
      align: "center", // left | center | right
      marginPx: 24,
      breakpoint: "1200 / 992 / 768 / 576",
      containerStyle: "圆角卡片",
      maxLineChars: 65,
      autoLineLimit: true,
    },
    brokenStart: {
      layoutMode: "dual",
      mainWidth: 86, // sidebar = 14% (< 18% 过窄！)
      maxWidth: 1280,
      showHeader: true,
      showSidebar: true,
      showFooter: false,
      showBreadcrumb: true,
      showBackTop: true,
      showPageNum: false,
      align: "center",
      marginPx: 24,
      breakpoint: "1200 / 992 / 768 / 576",
      containerStyle: "圆角卡片",
      maxLineChars: 65,
      autoLineLimit: true,
    },
  },
  notify: {
    id: "notify",
    label: "工作区 · 通知提醒",
    shortLabel: "通知提醒",
    navId: "interact",
    paneTitle: "通知提醒",
    paneSub: "配置消息渠道、免打扰时段与提示方式",
    previewTitle: "通知预览",
    dragLabel: "免打扰窗",
    dragHint: "横拖调免打扰时长",
    defaults: {
      layoutMode: "dual", // 映射到通知策略: single=静音 dual=平衡 triple=全量 free=自定义
      mainWidth: 72, // 映射到活跃提醒时段 72% (免打扰 28% ≈ 6.7h)
      maxWidth: 1280,
      showHeader: true, // 桌面横幅
      showSidebar: true, // 免打扰生效
      showFooter: false, // 夜间声音
      showBreadcrumb: true, // 邮件摘要
      showBackTop: true, // @提及强制提醒
      showPageNum: false, // 营销推送
      align: "center", // 摘要频次: left=实时 center=每日 right=每周
      marginPx: 24,
      breakpoint: "仅工作时间 09:00–19:00",
      containerStyle: "右上浮层",
      maxLineChars: 65,
      autoLineLimit: true,
    },
    brokenStart: {
      layoutMode: "dual",
      mainWidth: 88, // 免打扰只剩 12% (< 18%)
      maxWidth: 1280,
      showHeader: true,
      showSidebar: true,
      showFooter: true,
      showBreadcrumb: true,
      showBackTop: true,
      showPageNum: true,
      align: "center",
      marginPx: 24,
      breakpoint: "全天 24 小时",
      containerStyle: "右上浮层",
      maxLineChars: 65,
      autoLineLimit: true,
    },
  },
  privacy: {
    id: "privacy",
    label: "账户 · 隐私安全",
    shortLabel: "隐私安全",
    navId: "sync",
    paneTitle: "隐私与安全",
    paneSub: "管理访问权限、会话时长与数据导出",
    previewTitle: "权限预览",
    dragLabel: "公开占比",
    dragHint: "横拖调公开边界",
    defaults: {
      layoutMode: "dual", // single=仅自己 dual=团队可见 triple=组织公开 free=自定义
      mainWidth: 74, // 私有保护占比 74% / 对外公开 26%
      maxWidth: 1280,
      showHeader: true, // 双重验证 2FA
      showSidebar: true, // 公开名片页
      showFooter: false, // 第三方分析
      showBreadcrumb: true, // 异常登录告警
      showBackTop: true, // 会话超时自动登出
      showPageNum: false, // 搜索引擎收录
      align: "center", // 会话期: left=7天 center=30天 right=90天
      marginPx: 24,
      breakpoint: "AES-256 本地加密",
      containerStyle: "强密码策略",
      maxLineChars: 65,
      autoLineLimit: true,
    },
    brokenStart: {
      layoutMode: "dual",
      mainWidth: 87, // 对外可见区缩至 13% 或失衡
      maxWidth: 1280,
      showHeader: true,
      showSidebar: true,
      showFooter: true,
      showBreadcrumb: true,
      showBackTop: false,
      showPageNum: true,
      align: "center",
      marginPx: 24,
      breakpoint: "明文缓存（不建议）",
      containerStyle: "基础策略",
      maxLineChars: 65,
      autoLineLimit: true,
    },
  },
};

export const LAYOUT_MODES_BY_SCENARIO = {
  layout: [
    { id: "single", label: "单栏模式", hint: "沉浸阅读" },
    { id: "dual", label: "双栏模式", hint: "经典导航" },
    { id: "triple", label: "三栏模式", hint: "信息密集" },
    { id: "free", label: "自由布局", hint: "分块拖拽" },
  ],
  notify: [
    { id: "single", label: "仅重要", hint: "极简静默" },
    { id: "dual", label: "平衡模式", hint: "摘要+提及" },
    { id: "triple", label: "全部提醒", hint: "即时全量" },
    { id: "free", label: "按频道", hint: "自定义" },
  ],
  privacy: [
    { id: "single", label: "仅自己", hint: "完全私有" },
    { id: "dual", label: "团队内", hint: "协作默认" },
    { id: "triple", label: "组织公开", hint: "成员可查" },
    { id: "free", label: "按字段", hint: "细粒度" },
  ],
};

export const TOGGLES_BY_SCENARIO = {
  layout: [
    { key: "showHeader", label: "显示页眉区域", kind: "switch" },
    { key: "showSidebar", label: "显示侧边栏", kind: "switch" },
    { key: "showFooter", label: "显示页脚区域", kind: "switch" },
    { key: "showBreadcrumb", label: "显示面包屑导航", kind: "check" },
    { key: "showBackTop", label: "显示返回顶部按钮", kind: "check" },
    { key: "showPageNum", label: "显示页码", kind: "check" },
  ],
  notify: [
    { key: "showHeader", label: "桌面横幅推送", kind: "switch" },
    { key: "showSidebar", label: "启用专注免打扰", kind: "switch" },
    { key: "showFooter", label: "播放提示音效", kind: "switch" },
    { key: "showBreadcrumb", label: "每日邮件汇总", kind: "check" },
    { key: "showBackTop", label: "@提及强提醒", kind: "check" },
    { key: "showPageNum", label: "活动资讯推送", kind: "check" },
  ],
  privacy: [
    { key: "showHeader", label: "开启双重验证", kind: "switch" },
    { key: "showSidebar", label: "公开个人名片", kind: "switch" },
    { key: "showFooter", label: "匿名诊断上报", kind: "switch" },
    { key: "showBreadcrumb", label: "异地登录告警", kind: "check" },
    { key: "showBackTop", label: "闲置自动登出", kind: "check" },
    { key: "showPageNum", label: "允许站外索引", kind: "check" },
  ],
};

export const ALIGN_LABELS_BY_SCENARIO = {
  layout: { title: "内容区对齐方式", items: [["left", "左对齐"], ["center", "居中对齐"], ["right", "右对齐"]] },
  notify: { title: "汇总发送频次", items: [["left", "实时"], ["center", "每日"], ["right", "每周"]] },
  privacy: { title: "登录会话周期", items: [["left", "7 天"], ["center", "30 天"], ["right", "90 天"]] },
};

export function createInitialState(scenarioId = "layout") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.layout;
  return {
    scenario: sc.id,
    activeNav: sc.navId,
    navQuery: "",
    // 四维架构状态：开场刻意停在 0/4 错态
    grouping: "flat", // flat | grouped | overfragmented
    hierarchy: "mismatched", // mismatched | progressive | all-dropdown
    feedback: "silent", // silent | instant-live | blocking-modal
    density: "cramped", // cramped | compact | standard | loose | gapped-out
    advancedOpen: false,
    // 真实设置值与已保存快照（用于精准算脏变更数）
    values: { ...sc.brokenStart },
    saved: { ...sc.defaults },
    lastEvent: "none", // none | edited | saved | reset | canceled | blocked
    lastEventNote: "当前处于未梳理错态：改了数值无提示，侧栏仅 14% 却静默无警告。",
    pendingBlockMsg: "",
  };
}

export function countDirty(values, saved) {
  let n = 0;
  for (const k of Object.keys(saved)) {
    if (values[k] !== saved[k]) n++;
  }
  return n;
}

// 宽度几何约束（单真源）：侧栏 = 100 - 主区，经验舒适带 18%–44%
export function getWidthStatus(state) {
  const mainPct = Math.round(state.values.mainWidth);
  const sidePct = 100 - mainPct;
  const sideActive = state.values.showSidebar && state.values.layoutMode !== "single";
  if (!sideActive) {
    return { mainPct: 100, sidePct: 0, sideActive: false, status: "hidden", msg: "单栏或已关闭侧边栏，主内容占满 100%" };
  }
  if (sidePct < 18) {
    const label = state.scenario === "layout" ? `侧边栏宽度过小（仅 ${sidePct}%）` : state.scenario === "notify" ? `免打扰窗口过短（仅 ${sidePct}%）` : `公开可见区过窄（仅 ${sidePct}%）`;
    return { mainPct, sidePct, sideActive: true, status: "narrow", msg: label };
  }
  if (sidePct > 44) {
    const label = state.scenario === "layout" ? `侧边栏过宽（${sidePct}%），挤压主内容区` : state.scenario === "notify" ? `免打扰窗口过长（${sidePct}%），可能漏接提醒` : `公开占比过高（${sidePct}%），压缩私有边界`;
    return { mainPct, sidePct, sideActive: true, status: "wide", msg: label };
  }
  return { mainPct, sidePct, sideActive: true, status: "ok", msg: `主区 ${mainPct}% × 侧栏 ${sidePct}%（舒适带内）` };
}

// 单一真相诊断引擎：返回 4 项支柱状态、主错态、下一步引导、量化指标与实时 Toast 队列
export function diagnose(state) {
  const dens = DENSITY_SPECS[state.density] || DENSITY_SPECS.standard;
  const ratio = +(dens.outerGap / Math.max(1, dens.innerGap)).toFixed(2);
  const widthInfo = getWidthStatus(state);
  const dirtyCount = countDirty(state.values, state.saved);

  // 1. 分组支柱
  let groupOk = false;
  let groupCount = 1;
  let groupStatus = "零分组";
  let hickBits = +Math.log2(12).toFixed(1); // 示意：平铺 12 项需扫 12 个同级项
  if (state.grouping === "grouped") {
    groupOk = true;
    groupCount = 5;
    groupStatus = "5 组清晰";
    // 示意：5 组里先定组再看组内约 2–3 项：log2(5) + log2(2.4) ≈ 3.6 → 对比平铺与碎卡的视觉扫描层级
    hickBits = +(Math.log2(5) * 0.55 + Math.log2(2.4) * 0.45).toFixed(1);
  } else if (state.grouping === "overfragmented") {
    groupCount = 12;
    groupStatus = "12 盒过碎";
    hickBits = +(Math.log2(12) + 0.8).toFixed(1);
  }

  // 2. 控件层级支柱
  let hierOk = false;
  let mismatchCount = 0;
  let hierStatus = "主次分明";
  if (state.hierarchy === "mismatched") {
    mismatchCount = 4; // 复选框代单选 + 重置钮漆主色 + 高级项抢占顶部 + 缺层级说明
    hierStatus = "4 处错配";
  } else if (state.hierarchy === "all-dropdown") {
    mismatchCount = 3; // 布局模式/对齐/间距全塞下拉菜单不可直扫
    hierStatus = "3 项盲盒";
  } else {
    hierOk = true;
    mismatchCount = 0;
    hierStatus = "语义对齐";
  }

  // 3. 反馈支柱
  let fbOk = false;
  let fbStatus = "即时可见";
  if (state.feedback === "silent") {
    fbStatus = "静默失联";
  } else if (state.feedback === "blocking-modal") {
    fbStatus = "弹窗打断";
  } else {
    fbOk = true;
    fbStatus = dirtyCount > 0 ? `${dirtyCount} 项待存` : "状态闭环";
  }

  // 4. 留白与密度支柱
  const spaceOk = dens.valid;
  let spaceStatus = `${dens.label} ${ratio}×`;
  if (state.density === "cramped") spaceStatus = `粘连 ${dens.rowHeight}px`;
  if (state.density === "gapped-out") spaceStatus = `倒挂 ${ratio}×`;

  const score = [groupOk, hierOk, fbOk, spaceOk].filter(Boolean).length;
  const widthOk = widthInfo.status === "ok" || widthInfo.status === "hidden";

  // 决定首要问题（按用户认知优先级排序，确保每一种错态都被清晰点破）
  let headline = "";
  let explain = "";
  let nextStep = "";
  let tone = "error"; // error | warn | ok
  let badge = `${score}/4 待梳理`;

  if (state.grouping === "flat") {
    headline = "12 项设置平铺成一堵长墙，视线找不到归类锚点";
    explain = "基础布局、显示开关、对齐和底层断点全挤在同一块区域里，用户每次改一项都要从头扫到尾，视觉边界和心智分组全部消失。";
    nextStep = "先在工作台顶部「① 分组」切到「主题分组」，把 12 项收拢进 5 个语义模块。";
  } else if (state.grouping === "overfragmented") {
    headline = "每条设置单独套一层框，容器线比控件本身还吵";
    explain = "把 12 个选项拆成 12 张独立小卡片后，外框和标题占掉近半屏面积，原本相关联的宽度与侧栏控件被迫割裂，来回扫视反而更累。";
    nextStep = "把「① 分组」切回「主题分组」，让 2–4 个同主题控件共享一张卡片。";
  } else if (state.hierarchy === "mismatched") {
    headline = "控件类型错配，危险的「重置所有设置」反而抢了主色";
    explain = "互斥的「布局模式」用了复选框（暗示能多选），低频的「高级选项」摊在最顶抢走注意力，底部危险重置钮还漆成高饱和翠青色，极易诱导误点。";
    nextStep = "把「② 控件层级」切到「语义分级」，让单选归图标卡、高级项折叠沉底、危险钮降噪。";
  } else if (state.hierarchy === "all-dropdown") {
    headline = "把 3–4 个常用选项全藏进下拉菜单，一眼看不出有哪些模式";
    explain = "当候选项只有 3–4 个且需要横向对比（如布局模式、对齐方式、模块间距），塞进下拉菜单会多出一次点击并隐藏其余选项，降低可发现性。";
    nextStep = "把「② 控件层级」切回「语义分级」，仅对长列表/低频项保留下拉框。";
  } else if (state.feedback === "silent") {
    headline = `系统完全静默：${widthInfo.status === "narrow" ? `侧边栏已被挤到 ${widthInfo.sidePct}% 却零警告` : "改了参数也不知是否生效"}`;
    explain = "开关、滑块和保存钮混在一页却没有任何状态反馈：没有未保存计数、没有临界警告条、点保存也没有回执，用户只能反复怀疑刚才有没有点上。";
    nextStep = "把「③ 反馈」切到「即时预览 + 反馈带」，再看右侧状态提示如何立刻接管。";
  } else if (state.feedback === "blocking-modal") {
    headline = "每次微调都弹出确认拦截，把轻度配置变成审讯流程";
    explain = "反馈讲究轻重有别：只有不可逆的高危操作才需要模态确认；切个对齐或拉动滑块就打断操作，会让用户迅速产生确认疲劳，反而胡乱点确认。";
    nextStep = "把「③ 反馈」切回「即时预览 + 反馈带」，用非阻塞的状态条与实时预览替代弹窗。";
  } else if (state.density === "cramped") {
    headline = `组内 ${dens.innerGap}px 与组间 ${dens.outerGap}px 几乎无差，28px 控件极易误触`;
    explain = "外距与内距比只有 1.5× 且缺少卡片留白，格式塔接近律失效——邻组控件黏成一团，触屏手指（经验靶区 ≥ 40px）也容易一按点歪。";
    nextStep = "在「④ 留白密度」或下方「控件密度示例」中选「标准」「紧凑」或「宽松」体验三套正当解。";
  } else if (state.density === "gapped-out") {
    headline = `组内间距（${dens.innerGap}px）反超组间留白（${dens.outerGap}px），归属感彻底倒挂`;
    explain = "间距比跌到 0.54×：同一组内的控件离得比隔壁组还远，大脑会误把上一组的尾项和下一组的标题看成一对，产生严重的视觉错认。";
    nextStep = "把「④ 留白密度」切回「标准」「紧凑」或「宽松」，让组间留白保持组内的 1.8×–2.5×。";
  } else if (!widthOk) {
    tone = "warn";
    badge = `4/4 · ${widthInfo.status === "narrow" ? "侧栏过窄" : "侧栏过宽"}`;
    headline = widthInfo.status === "narrow"
      ? `四维骨架已理顺，但当前侧边栏仅 ${widthInfo.sidePct}%，触发临界预警`
      : `四维骨架已理顺，但当前侧边栏宽达 ${widthInfo.sidePct}%，主内容被过度挤压`;
    explain = widthInfo.status === "narrow"
      ? "原海报右侧专门画了一条黄色预警「侧边栏宽度过小」——这正是反馈系统的价值：把危险边界直接呈现在用户眼前，而不是等保存后页面崩坏。"
      : "侧边栏超过 44% 后，主阅读列所剩不足六成，长标题与正文都会频繁折行。及时预警能帮用户在保存前收回到平衡区。";
    nextStep = "直接在右侧预览画布上左右拖移翠青分界线（或拉动滑块），把侧边栏调回 18%–44% 舒适带内。";
  } else {
    tone = "ok";
    badge = `4/4 · ${dens.label}解`;
    const solExplain = {
      standard: "原海报标准解：5 组边界分明、控件各司其职、右侧实时反馈闭环、组间 24px / 组内 12px（2.0×），在信息效率与阅读舒展之间取得平衡。",
      compact: "专业紧凑解：保留 2.5× 组间/组内比（20px / 8px），一屏比标准版多容纳约 15% 控件，适合高频专业工具与宽屏工作台；但新手初次扫视压力略高。",
      loose: "新手宽松解：组间 32px / 组内 16px（2.0×）配 48px 舒展控件，触控误点率最低、心理压迫感最轻；代价是同量设置需要多滚约 28% 行程。",
    };
    headline = `设置页结构清晰有序（当前采用「${dens.label}」正当解）`;
    explain = solExplain[state.density] || solExplain.standard;
    nextStep = dirtyCount > 0
      ? `你当前有 ${dirtyCount} 项改动尚未确认——可以点右侧「保存设置」体验完整反馈闭环，或切到另外两档密度/故意试错对比效果。`
      : "试试直接横拖右侧预览分界线压窄到 18% 以下看实时预警，或切换顶部的「通知提醒 / 隐私安全」场景检验同一套骨架的迁移力。";
  }

  // 生成右侧操作反馈条（1:1 呼应原海报 3 条反馈语义）
  const toasts = [];
  if (state.feedback === "instant-live") {
    if (state.lastEvent === "saved") {
      toasts.push({ kind: "ok", text: "设置已保存" });
    } else if (state.lastEvent === "reset") {
      toasts.push({ kind: "info", text: "已恢复默认布局" });
    } else if (state.lastEvent === "canceled") {
      toasts.push({ kind: "info", text: "已撤销未保存改动" });
    } else if (dirtyCount > 0) {
      toasts.push({ kind: "info", text: `有 ${dirtyCount} 项未保存更改` });
    } else {
      toasts.push({ kind: "ok", text: "当前与已保存配置一致" });
    }

    if (widthInfo.status === "narrow") {
      toasts.push({ kind: "warn", text: widthInfo.msg });
    } else if (widthInfo.status === "wide") {
      toasts.push({ kind: "warn", text: widthInfo.msg });
    } else if (state.values.maxLineChars > 80) {
      toasts.push({ kind: "warn", text: `单行 ${state.values.maxLineChars} 字偏长，阅读易串行` });
    }

    if (state.lastEvent !== "reset" && toasts.length < 3) {
      toasts.push({ kind: "info", text: state.values.layoutMode === "single" ? "单栏模式已隐藏侧边栏" : "已同步实时预览" });
    }
  } else if (state.feedback === "blocking-modal") {
    toasts.push({ kind: "warn", text: state.pendingBlockMsg || "拦截模式：每次改动都将弹出确认打断" });
  }

  return {
    score,
    allPass: score === 4 && widthOk,
    tone,
    badge,
    headline,
    explain,
    nextStep,
    pillars: {
      group: { ok: groupOk, status: groupStatus, count: groupCount },
      hierarchy: { ok: hierOk, status: hierStatus, mismatchCount },
      feedback: { ok: fbOk, status: fbStatus, dirtyCount },
      spacing: { ok: spaceOk, status: spaceStatus, ratio, innerGap: dens.innerGap, outerGap: dens.outerGap, rowHeight: dens.rowHeight },
    },
    widthInfo,
    dirtyCount,
    hickBits,
    densitySpec: dens,
    toasts,
  };
}

// ---------- 01 节：限时找设置秒表挑战 ----------
export const FIND_LAB_ITEMS = [
  { id: "f1", label: "语言与地区", group: "常规与外观", path: "常规 › 语言", sub: "界面显示语言与日期格式" },
  { id: "f2", label: "深浅色主题", group: "常规与外观", path: "外观 › 主题", sub: "跟随系统或手动固定" },
  { id: "f3", label: "默认字体大小", group: "常规与外观", path: "外观 › 排版", sub: "正文基准字号 14–18px" },
  { id: "f4", label: "界面紧凑密度", group: "常规与外观", path: "外观 › 密度", sub: "紧凑 / 标准 / 宽松" },
  { id: "f5", label: "侧边栏默认宽度", group: "布局与视图", path: "布局 › 栏宽", sub: "导航栏所占窗口比例" },
  { id: "f6", label: "内容区最大行宽", group: "布局与视图", path: "布局 › 行宽", sub: "限制长文每行字符数" },
  { id: "f7", label: "显示面包屑路径", group: "布局与视图", path: "布局 › 导航", sub: "顶部层级定位条" },
  { id: "f8", label: "折叠底部状态栏", group: "布局与视图", path: "布局 › 边栏", sub: "释放纵向画布高度" },
  { id: "f9", label: "自动保存间隔", group: "同步与数据", path: "数据 › 保存", sub: "每 30 秒写入草稿" },
  { id: "f10", label: "离线缓存上限", group: "同步与数据", path: "数据 › 存储", sub: "本地保留历史版本容量" },
  { id: "f11", label: "导出 Markdown 规范", group: "同步与数据", path: "数据 › 导出", sub: "遵循 CommonMark 标准" },
  { id: "f12", label: "双重验证（2FA）", group: "安全与提醒", path: "安全 › 登录", sub: "新设备登录动态口令" },
  { id: "f13", label: "桌面免打扰时段", group: "安全与提醒", path: "提醒 › 静音", sub: "夜间自动静音推送" },
  { id: "f14", label: "异常登录邮件告警", group: "安全与提醒", path: "安全 › 告警", sub: "非常用地点立即通知" },
  { id: "f15", label: "重置所有快捷键", group: "安全与提醒", path: "系统 › 快捷键", sub: "恢复出厂按键映射" },
  { id: "f16", label: "清除本地索引缓存", group: "同步与数据", path: "数据 › 维护", sub: "重建搜索倒排索引" },
];

// 刻意打乱平铺顺序（模拟真实烂设置页的杂乱堆叠）
export const FIND_FLAT_ORDER = ["f13", "f6", "f1", "f15", "f9", "f4", "f12", "f8", "f16", "f2", "f11", "f5", "f14", "f3", "f10", "f7"];
export const FIND_TARGETS = ["f6", "f9", "f13", "f5", "f12", "f10"];

// ---------- 02 节：控件配对诊台 ----------
export const CONTROL_TASKS = [
  {
    id: "t1",
    prompt: "切换「自动深色模式」（拨动后界面立刻变色，无须点保存）",
    best: "switch",
    verdicts: {
      switch: { ok: true, title: "恰如其分：即时开关（Switch）", body: "符合 W3C APG Switch 规范与 NN/g 指南——物理拨杆隐喻天然代表「当下立刻通电/断电」，且固定标签不随状态变字。" },
      checkbox: { ok: false, title: "语义偏弱：复选框常暗示等待提交", body: "用户习惯把复选框当表单勾选，勾完往往会下意识往下找「保存」按钮，造成「改没改生效」的犹豫。" },
      segmented: { ok: false, title: "略显厚重：纯二元开关用拨杆更轻", body: "如果只有开/关两个对立状态且立刻生效，分段按钮占宽偏大；只有当选项是「浅色 / 深色 / 跟随系统」三态时分段钮才胜出。" },
      select: { ok: false, title: "过度隐藏：只有两态不该塞进下拉菜单", body: "把开/关藏进下拉框需要点两次（展开+选择），把最简单的动作变慢了一倍。" },
      slider: { ok: false, title: "维度错配：滑块用来调连续量", body: "把开关硬做成滑块会误导用户以为中间还有 50% 的半深色状态。" },
    },
  },
  {
    id: "t2",
    prompt: "在「紧凑 / 标准 / 宽松」3 档界面密度中单选其一",
    best: "segmented",
    verdicts: {
      segmented: { ok: true, title: "恰如其分：分段控制（Segmented）", body: "2–5 个互斥高频项平铺展开，所有候选一目了然，单次点击即可横向对比切换，原海报的「模块间距」正是如此。" },
      select: { ok: false, title: "遮挡对比：3 个短词藏进下拉盲盒", body: "下拉框挡住了另外两档的名称，用户得先点开才能知道除了「标准」还有哪些档位。" },
      switch: { ok: false, title: "无法表达三态互斥", body: "开关只有开与关两态，强行放 3 个开关会产生「同时打开紧凑和宽松」的逻辑冲突。" },
      checkbox: { ok: false, title: "误导为可多选", body: "复选框的视觉约定是「可同时勾多项」，用在互斥的密度档位上违背用户心智。" },
      slider: { ok: false, title: "档位含义不够直白", body: "滑块虽能做离散刻度，但不如分段按钮直接把三个档位名称亮出来、一点即达。" },
    },
  },
  {
    id: "t3",
    prompt: "从 24 个常用时区里指定工作区默认时区",
    best: "select",
    verdicts: {
      select: { ok: true, title: "恰如其分：下拉选择（或带搜索 Combobox）", body: "候选项超过 6–7 个且属低频配置时，折叠进下拉列表能守住页面清爽，避免 24 个按钮把整屏铺满。" },
      segmented: { ok: false, title: "直接撑爆宽度", body: "把 24 个时区排成分段按钮会折成四五行，横向对照彻底失效。" },
      switch: { ok: false, title: "完全错配", body: "24 个独立开关不仅占满全屏，还无法保证单一时区互斥。" },
      checkbox: { ok: false, title: "冗长且暗示多选", body: "24 个复选框既挤占版面，又与「仅选一个默认时区」的规则相悖。" },
      slider: { ok: false, title: "难以精准定位离散地名", body: "在 24 个城市之间拖滑块既慢又容易滑过头，体验极差。" },
    },
  },
  {
    id: "t4",
    prompt: "精细调节「主内容区宽度」（50%–88%，且需要精准输数字）",
    best: "slider",
    verdicts: {
      slider: { ok: true, title: "恰如其分：滑块 + 同步数值框", body: "滑块让人快速探索大致区间并实时看预览变化，右侧数值框补足精确键入能力——正是原海报「内容区域设置」的做法。" },
      segmented: { ok: false, title: "颗粒度太粗", body: "只能给三四个死档位，无法微调到 72% 这样贴合具体屏幕的比例。" },
      select: { ok: false, title: "缺少连续空间感", body: "在 39 项百分比下拉列表里翻找既慢，也失去了拖动看布局缩放的直观反馈。" },
      switch: { ok: false, title: "无法表达连续数值", body: "宽度是连续区间，二元开关无能为力。" },
      checkbox: { ok: false, title: "无法表达连续数值", body: "复选框只能表示有或无，不能表达 50%–88% 的连续量。" },
    },
  },
  {
    id: "t5",
    prompt: "在一份底部带「保存更改」按钮的表单里，批量勾选 4 类邮件订阅",
    best: "checkbox",
    verdicts: {
      checkbox: { ok: true, title: "恰如其分：复选框组（Checkbox）", body: "复选框明确传达「可多选、改完随底部保存一起提交」，不会让用户误以为勾一下就立刻发请求。" },
      switch: { ok: false, title: "生效预期冲突", body: "NN/g 指出：开关代表即时生效；若把 4 个开关放进必须点「保存」的表单里，用户拨完直接关页就会丢失改动。" },
      segmented: { ok: false, title: "默认互斥单选", body: "分段按钮的常规心智是单选，不适合独立的多选订阅列表。" },
      select: { ok: false, title: "多选下拉成本高", body: "只有 4 项时直接平铺复选框最直观，藏进多选下拉框反而难以看清已勾选了哪几项。" },
      slider: { ok: false, title: "维度错配", body: "4 个独立订阅项是布尔集合，不是数值滑轨。" },
    },
  },
];

// ---------- 05 节：四代设置架构演化数据 ----------
export const ERAS = [
  {
    id: "1981",
    year: "1981",
    name: "Xerox 8010 Star · 属性表",
    en: "PROPERTY SHEETS",
    people: "David Canfield Smith 等 · Xerox PARC（BYTE 1982）",
    summary: "用弹窗「属性表」取代命令行开关，首次确立「所见即所指（Seeing & Pointing）」与渐进披露：只在选中对象并按 Properties 键时展开相关参数。",
    pros: "把抽象参数绑定到具体对象上，不再背命令。",
    limit: "系统级全局偏好尚少，选项一旦超过几十项，单张属性表便装不下。",
    layoutKind: "sheet",
  },
  {
    id: "1984",
    year: "1984",
    name: "Macintosh · 图形控制面板",
    en: "CONTROL PANEL",
    people: "Susan Kare 视觉设计 · Andy Hertzfeld 实现（1983.11）",
    summary: "受限于 128KB 内存与面向普通人的愿景，整块控制面板几乎零文字：用乌龟与兔子代表按键/鼠标速率，用像素格直接画桌面底纹。",
    pros: "图形隐喻亲切直观、零门槛，即时拖动立刻生效。",
    limit: "随着系统功能翻倍，纯无字图标塞不下复杂网络、隐私与权限层级。",
    layoutKind: "mac84",
  },
  {
    id: "2001",
    year: "2001",
    name: "Mac OS X 10.0 · 图标宫格偏好",
    en: "SYSTEM PREFERENCES",
    people: "Apple · 延续二十余年的桌面范式",
    summary: "按「个人 / 硬件 / 互联网 / 系统」横排分组，每个主题是一枚独立图标；点击进入子面板，改完再点「显示全部」退回宫格。",
    pros: "空间记忆极强——老用户凭图标在宫格里的位置一眼找到入口。",
    limit: "跨类切换需要反复进退；当图标增至 30+ 枚、与移动端心智割裂时，定位效率下降。",
    layoutKind: "grid2001",
  },
  {
    id: "2022",
    year: "2022",
    name: "macOS Ventura 与现代 SaaS · 侧栏分组",
    en: "SIDEBAR + GROUPED CARDS",
    people: "Apple HIG（2022）与现代 Web 应用设置页",
    summary: "左侧常驻可搜索纵向导航栏，右侧按主题卡片分区呈现控件与即时状态（如 287 原海报三栏工作窗再叠加右侧实时预览）。",
    pros: "切换分组零往返、层级一眼可见、天然兼容移动端单栏折返与全文搜索。",
    limit: "若选项少于 5 项还硬套左侧导航栏，只会平添无意义的侧栏噪音。",
    layoutKind: "modern2022",
  },
];

// ---------- 06 节：单变量四选一小练习 ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    title: "6 项按使用频率等距单列排布",
    desc: "从「文件格式」到「自定义 CSS 模板」全部默认展开，相邻行间距统一为 14px，无分组卡片线，底部一枚「保存设置」。",
    correct: false,
    feedback: "看似简洁，但 6 项等距无分区会让极低频、高出错风险的「实验性 PDF 引擎」「自定义 CSS 模板」与日常「文件格式」拥有完全相同的视觉权重；新手每次导出都要跨过两项晦涩技术项，认知负荷偏高。",
  },
  {
    id: "B",
    label: "方案 B",
    title: "基础 4 项 + 高级 2 项折叠，2× 留白比",
    desc: "将常用 4 项归入「基础导出」区，把 2 项低频技术项收进默认折叠的「高级选项」抽屉，组间留白为组内的 2 倍，底部统一保存。",
    correct: true,
    feedback: "答对了！四套方案只差「分组与披露结构」这一个变量：方案 B 用语义分组把日常高频选项稳在首屏，用渐进披露把 2 项冷门高危技术项收进折叠区（需要时一点即开），靠 2× 外内距比自然界定边界，且保持单一提交闭环。",
  },
  {
    id: "C",
    label: "方案 C",
    title: "左侧 6 项独立侧栏，每次展示单项",
    desc: "左侧放 6 个导航入口分别对应这 6 个设置，右侧主区只渲染当前选中的那 1 个控件，底部一枚「保存设置」。",
    correct: false,
    feedback: "这是「为了用侧栏而用侧栏」的典型过度设计：总共只有 6 个设置项，切一次导航只看一个控件，用户无法同屏核对导出格式与压缩质量的关系，白白增加了 5 倍点击与记忆成本。",
  },
  {
    id: "D",
    label: "方案 D",
    title: "拆成 3 张并列卡片，各配独立保存钮",
    desc: "将 6 项平分为「常规」「排版」「路径」3 张等宽横排卡片，全部默认展开，且每张卡片右下角各自带一个「保存」按钮。",
    correct: false,
    feedback: "问题不在 3 组本身，而在于拆出了 3 个独立「保存」按钮：用户改完第一张卡的格式又改第三张卡的路径后，很难判断按第三个保存是否会连带保存前两张，直接破坏设置页最宝贵的「可控感」。",
  },
];
