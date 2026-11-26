// 258 侧边栏页面 — 单真源几何计算与结构诊断模型
// 所有画面坐标、点击热区、字数折行、截断判断与诊单读数均源自同一组计算结果。

export const SCENES = {
  course: {
    id: "course",
    label: "课程学习",
    en: "COURSE PATH",
    siteTitle: "版式研习课",
    preferSide: "left",
    nav: [
      { id: "overview", icon: "grid", zh: "课程概览", en: "NAVIGATION", heading: "侧边栏如何稳住长程学习路径", lead: "把目录常驻在一侧，读到第几节、还剩多少章，抬眼就能确认坐标，不必反复折返封面。", chart: "peaks", cards: [
        { dot: "coral", title: "01 空间锚定", line1: "固定入口常驻视野", line2: "跨章跳转一步直达" },
        { dot: "coral", title: "02 比例克制", line1: "侧栏收在两成左右", line2: "宽幅留给图表正文" },
        { dot: "dark",  title: "03 视觉降噪", line1: "收起低频次级链接", line2: "让主内容自然居中" },
      ]},
      { id: "focus", icon: "heart", zh: "重点内容", en: "FOCUS", heading: "为什么读者的第一眼总落在主区", lead: "侧栏只承担索引职责，用深浅色块隔出清晰边界，避免与主图、正文争夺第一视觉焦点。", chart: "bars", cards: [
        { dot: "coral", title: "主区占宽比", line1: "正文稳占七成以上", line2: "行宽舒展不易串行" },
        { dot: "coral", title: "边界清晰度", line1: "色差或细线隔开", line2: "目光切换干脆利落" },
        { dot: "dark",  title: "单点高亮态", line1: "仅点亮当前所在项", line2: "其余条目保持克制" },
      ]},
      { id: "modules", icon: "doc", zh: "知识模块", en: "MODULES", heading: "把深层目录折进可展开的章节树", lead: "当课程超过十节时，平铺会拖长列表；用两级分组配合当前展开，扫读一次就能锁准目标。", chart: "steps", cards: [
        { dot: "coral", title: "基础框架篇", line1: "单列、双列与侧栏", line2: "四节核心结构对照" },
        { dot: "coral", title: "响应式变形", line1: "图标轨与抽屉切换", line2: "覆盖平板与窄手机" },
        { dot: "dark",  title: "语义无障碍", line1: "nav 与 aside 分工", line2: "键盘焦点顺序清晰" },
      ]},
      { id: "support", icon: "users", zh: "参考支持", en: "SUPPORT", heading: "辅助资料该放侧边栏底端还是正文内", lead: "术语表、下载包与答疑入口属于低频支援，退居分隔点阵下方，需要时伸手即得、平时不打扰。", chart: "ring", cards: [
        { dot: "coral", title: "讲义与源码", line1: "按章节打包可下载", line2: "随当前页同步更新" },
        { dot: "coral", title: "同伴讨论区", line1: "提问不打断阅读流", line2: "收在页侧辅助入口" },
        { dot: "dark",  title: "学习检查单", line1: "四项核心原则核对", line2: "每完成一节自动勾" },
      ]},
    ],
  },
  admin: {
    id: "admin",
    label: "平台后台",
    en: "WORKSPACE",
    siteTitle: "运营中枢台",
    preferSide: "left",
    nav: [
      { id: "dash", icon: "grid", zh: "运行总览", en: "OVERVIEW", heading: "高频切模块的后台最依赖左侧图标轨", lead: "客服与运营人员每天在十几个工单面板间穿梭，熟悉之后甚至只需窄图标轨就能盲点切换。", chart: "bars", cards: [
        { dot: "coral", title: "待处理工单", line1: "当前队列 18 条", line2: "平均响应 3.4 分钟" },
        { dot: "coral", title: "在线节点数", line1: "华东与华南正常", line2: "延迟保持 26 ms" },
        { dot: "dark",  title: "今日发布单", line1: "已通过灰度校验", line2: "待晚间窗口切流" },
      ]},
      { id: "queue", icon: "heart", zh: "任务队列", en: "PRIORITY", heading: "大表格视图需要一键折叠侧栏让出横宽", lead: "当右侧铺开多列财务或日志宽表时，给侧栏留一个收起开关，主工作区能立刻多出两百像素。", chart: "steps", cards: [
        { dot: "coral", title: "异常告警单", line1: "两项接口超时重试", line2: "已自动回滚至稳态" },
        { dot: "coral", title: "审批待复核", line1: "新增字段权限申请", line2: "预计今日下午完成" },
        { dot: "dark",  title: "批处理任务", line1: "夜间账单对账完成", line2: "耗时较昨日减半" },
      ]},
      { id: "roles", icon: "doc", zh: "权限模块", en: "MODULES", heading: "导航分组决定后台找功能要花几秒", lead: "把常用业务模块顶置、把系统设置沉底并以点阵分隔，新手也能按心理预期顺手摸到入口。", chart: "peaks", cards: [
        { dot: "coral", title: "成员角色组", line1: "编辑、审核与只读", line2: "按项目空间隔离" },
        { dot: "coral", title: "操作审计流", line1: "关键变更留痕可溯", line2: "支持按日导出备份" },
        { dot: "dark",  title: "访问令牌", line1: "到期前七日提醒", line2: "支持单点随时吊销" },
      ]},
      { id: "docs", icon: "users", zh: "接口支持", en: "SUPPORT", heading: "稳定坐标让跨页操作零迷路", lead: "即便左侧承载八组功能，只要保持固定锚定与当前高亮，右侧滚动千行表格也不会迷失位置。", chart: "ring", cards: [
        { dot: "coral", title: "状态码速查", line1: "覆盖常见鉴权错误", line2: "附带最小复现示例" },
        { dot: "coral", title: "变更日志", line1: "版本升级兼容说明", line2: "标注废弃字段期限" },
        { dot: "dark",  title: "值班联络", line1: "紧急故障直连通道", line2: "七天全天候响应" },
      ]},
    ],
  },
  report: {
    id: "report",
    label: "数据报告",
    en: "ANALYTICS",
    siteTitle: "季度洞察报",
    preferSide: "either",
    nav: [
      { id: "summary", icon: "grid", zh: "核心结论", en: "SUMMARY", heading: "长报告的辅助大纲既可置左也可置右", lead: "在深度分析报告里，正文放在左半高注视区、窄大纲收在右侧做跳转参考，同样干净从容。", chart: "peaks", cards: [
        { dot: "coral", title: "复购率走势", line1: "连续三季稳步抬升", line2: "核心品类贡献六成" },
        { dot: "coral", title: "新客留存率", line1: "首周引导改版见效", line2: "次月回访明显改善" },
        { dot: "dark",  title: "渠道结构", line1: "自然搜索占比扩大", line2: "获客成本趋于平稳" },
      ]},
      { id: "cohort", icon: "heart", zh: "用户分层", en: "COHORTS", heading: "边读图表边跳章，减少上下狂翻页", lead: "高管审阅三十页报告时很少从头读到尾，固定侧边大纲让读者在结论与附录间自由穿梭。", chart: "ring", cards: [
        { dot: "coral", title: "高频重度群", line1: "每周打开四次以上", line2: "最看重快捷目录" },
        { dot: "coral", title: "周期回访群", line1: "随月报推送进入", line2: "习惯先扫核心结论" },
        { dot: "dark",  title: "尝鲜新访客", line1: "多由移动端进入", line2: "窄屏需折叠成抽屉" },
      ]},
      { id: "funnel", icon: "doc", zh: "渠道归因", en: "FUNNEL", heading: "正文行宽守住舒适区，数据对比才耐看", lead: "如果侧栏抢掉四成宽度，报告里的对比卡片会被挤成窄条，数字折行错位，判断效率骤降。", chart: "bars", cards: [
        { dot: "coral", title: "内容引流", line1: "深度教程转化最高", line2: "停留时长超出均值" },
        { dot: "coral", title: "社区口碑", line1: "模板分享带动传播", line2: "老带新路径清晰" },
        { dot: "dark",  title: "搜索直达", line1: "长尾术语精准匹配", line2: "跳出率显著下降" },
      ]},
      { id: "method", icon: "users", zh: "附录口径", en: "APPENDIX", heading: "把口径注释放进侧栏辅助区不打断主线", lead: "统计口径、样本范围与原始表下载不必塞进正文中间，归入侧边参考支持区，阅读体验更连贯。", chart: "steps", cards: [
        { dot: "coral", title: "统计时间窗", line1: "自然季度整月对齐", line2: "剔除内部测试账号" },
        { dot: "coral", title: "指标定义表", line1: "统一口径避免歧义", line2: "附历年修订记录" },
        { dot: "dark",  title: "原始数据表", line1: "支持 CSV 与 PDF", line2: "按权限脱敏导出" },
      ]},
    ],
  },
};

export function createInitialState() {
  return {
    scene: "course",
    viewport: 1200,      // 1200 桌面 / 820 平板 / 390 手机
    railRatio: 0.42,     // 开场故意 42%（504px）过肥抢地盘！
    mode: "full",        // 'full' | 'rail' | 'drawer'
    drawerOpen: false,
    side: "left",        // 'left' | 'right'
    sticky: false,       // 开场故意随滚流失
    scroll: 0.52,        // 开场故意停在文档中段，亲眼看见导航被滚飞！
    highlight: false,    // 开场故意无当前态高亮，造成迷航
    clutter: true,       // 开场故意在侧栏塞满冗余杂物
    activeNav: 0,
  };
}

export const PRESETS = {
  // 多组合法解（全部通过 4/4）
  classic: {
    label: "经典左导解",
    note: "桌面 22% 固定左栏",
    patch: { viewport: 1200, mode: "full", railRatio: 0.22, side: "left", sticky: true, scroll: 0.35, highlight: true, clutter: false, drawerOpen: false },
  },
  rail: {
    label: "高效图标轨解",
    note: "64px 窄轨释放 93% 主区",
    patch: { viewport: 1200, mode: "rail", railRatio: 0.22, side: "left", sticky: true, scroll: 0.35, highlight: true, clutter: false, drawerOpen: false },
  },
  rightOutline: {
    label: "右置大纲解",
    note: "报告正文居左 + 右侧窄目录",
    patch: { scene: "report", viewport: 1200, mode: "full", railRatio: 0.21, side: "right", sticky: true, scroll: 0.35, highlight: true, clutter: false, drawerOpen: false },
  },
  mobileDrawer: {
    label: "手机抽屉解",
    note: "390px 窄屏按需拉出",
    patch: { viewport: 390, mode: "drawer", railRatio: 0.22, side: "left", sticky: true, scroll: 0.25, highlight: true, clutter: false, drawerOpen: false },
  },
  // 主动试错（看反向怎么错）
  failTruncate: {
    label: "试错：挤断文字",
    patch: { viewport: 1200, mode: "full", railRatio: 0.10, side: "left", sticky: true, scroll: 0.2, highlight: true, clutter: false, drawerOpen: false },
  },
  failMobile: {
    label: "试错：手机硬撑",
    patch: { viewport: 390, mode: "full", railRatio: 0.34, side: "left", sticky: true, scroll: 0.2, highlight: true, clutter: false, drawerOpen: false },
  },
  failScroll: {
    label: "试错：滚丢导航",
    patch: { viewport: 1200, mode: "full", railRatio: 0.22, side: "left", sticky: false, scroll: 0.72, highlight: true, clutter: false, drawerOpen: false },
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * 单真源几何核算：
 * 传入当前状态和画布外框 { w, h }（CSS 逻辑像素），吐出所有实绘像素矩形、
 * 等效模拟像素、折行估算与可见条目数量。
 */
export function computeLayout(state, box) {
  const padOuter = Math.max(10, Math.round(Math.min(box.w, box.h) * 0.032));
  const availW = Math.max(200, box.w - padOuter * 2);
  const availH = Math.max(180, box.h - padOuter * 2);

  // 根据模拟视口（1200 / 820 / 390）真实缩放工作面外框宽度，让窄屏压迫感一目了然
  let frameW = availW;
  if (state.viewport === 820) {
    frameW = Math.min(availW, Math.max(availW * 0.72, 260));
  } else if (state.viewport === 390) {
    frameW = Math.min(availW, Math.max(Math.min(availW * 0.48, availH * 0.64), Math.min(availW, 240)));
  }
  const frameH = availH;
  const frameX = Math.round((box.w - frameW) / 2);
  const frameY = Math.round((box.h - frameH) / 2);

  const scaleToCanvas = frameW / state.viewport;
  const headerH = state.mode === "drawer" ? Math.max(34, Math.round(frameH * 0.115)) : 0;

  // 等效模拟像素（SimPx）
  let railSimPx = 0;
  if (state.mode === "full") {
    railSimPx = Math.round(state.viewport * state.railRatio);
  } else if (state.mode === "rail") {
    railSimPx = state.viewport <= 480 ? 52 : 68;
  } else {
    railSimPx = 0;
  }
  const mainSimPx = Math.max(40, state.viewport - railSimPx);
  const railShare = railSimPx / state.viewport;
  const mainShare = mainSimPx / state.viewport;

  // 画布实绘宽（CanvasPx）
  const railCanvasW = state.mode === "drawer" ? 0 : Math.max(state.mode === "rail" ? 36 : 40, Math.round(frameW * railShare));
  const mainCanvasW = Math.max(40, frameW - railCanvasW);

  const isRight = state.side === "right";
  const railRect = state.mode === "drawer"
    ? {
        x: isRight ? frameX + frameW - Math.round(frameW * 0.68) : frameX,
        y: frameY + headerH,
        w: Math.round(frameW * 0.68),
        h: frameH - headerH,
        overlay: true,
        open: !!state.drawerOpen,
      }
    : {
        x: isRight ? frameX + mainCanvasW : frameX,
        y: frameY,
        w: railCanvasW,
        h: frameH,
        overlay: false,
        open: true,
      };

  const mainRect = {
    x: state.mode === "drawer" ? frameX : (isRight ? frameX : frameX + railCanvasW),
    y: frameY + headerH,
    w: state.mode === "drawer" ? frameW : mainCanvasW,
    h: frameH - headerH,
  };

  // 分隔轨 X 坐标（用于拖拽调节宽度）
  const dividerX = state.mode === "drawer"
    ? (isRight ? frameX + frameW : frameX)
    : (isRight ? frameX + mainCanvasW : frameX + railCanvasW);

  // 计算侧边栏导航项实绘位置（可见数由模拟视口单真源算出，确保各屏幕尺寸读数与画布实绘项数 100% 丝毫不差）
  const simScrollShift = (!state.sticky && state.mode !== "drawer") ? state.scroll * 320 : 0;
  const visibleNavCount = state.mode === "drawer"
    ? 4
    : [0, 1, 2, 3].filter((idx) => {
        const simItemBottom = 92 + idx * 54 + 42 - simScrollShift;
        return simItemBottom >= 28;
      }).length;

  const railTopPad = Math.max(12, Math.round(frameH * 0.042));
  const avatarR = Math.max(11, Math.min(20, Math.round(railRect.w * 0.15), Math.round(frameH * 0.052)));
  const navStepH = Math.max(30, Math.min(42, Math.round(frameH * 0.105)));
  const lostCount = 4 - visibleNavCount;
  // 按模拟滚移量同步驱动画布滚动位移：确保第 lostCount 项正好清晰落在顶沿 26px 红条下方，肉眼数到的项数 === visibleNavCount
  const baseStartFromTop = railTopPad + avatarR * 2 + Math.max(12, Math.round(frameH * 0.04));
  const scrollShiftCanvas = (!state.sticky && state.mode !== "drawer" && lostCount > 0)
    ? (baseStartFromTop + lostCount * navStepH - 32)
    : 0;
  const avatarY = railRect.y + railTopPad + avatarR - scrollShiftCanvas;
  const navStartY = avatarY + avatarR + Math.max(12, Math.round(frameH * 0.04));

  const navItemRects = [0, 1, 2, 3].map((idx) => {
    const iy = navStartY + idx * navStepH;
    const h = navStepH - 5;
    const visible = idx >= lostCount;
    return {
      idx,
      x: railRect.x + 6,
      y: iy,
      w: Math.max(24, railRect.w - 12),
      h,
      visible,
    };
  });

  // 折叠切换按钮位置
  const toggleBtnRect = state.mode === "drawer"
    ? {
        x: isRight ? frameX + frameW - 86 : frameX + 10,
        y: frameY + Math.round((headerH - 24) / 2),
        w: 76,
        h: 24,
      }
    : {
        x: railRect.x + railRect.w - 26,
        y: railRect.y + 8,
        w: 20,
        h: 20,
      };

  // 杂物卡片位置（底部塞入的高噪音促销卡）
  const clutterH = Math.max(54, Math.round(frameH * 0.18));
  const clutterRect = {
    x: railRect.x + 8,
    y: railRect.y + railRect.h - clutterH - 10,
    w: Math.max(28, railRect.w - 16),
    h: clutterH,
  };
  const clutterCloseRect = {
    x: clutterRect.x + clutterRect.w - 22,
    y: clutterRect.y + 4,
    w: 18,
    h: 18,
  };

  // 主内容区文字行宽与卡片列数（从等效模拟像素单真源算出）
  const mainInnerPad = state.viewport <= 480 ? 18 : 34;
  const textAreaSimPx = Math.max(80, mainSimPx - mainInnerPad * 2);
  // 若桌面较宽，图文左右并排；变窄时双峰插画退为上方全宽
  const heroSplit = mainSimPx >= 640;
  const bodySimPx = heroSplit ? textAreaSimPx * 0.54 : textAreaSimPx;
  const mainCpl = Math.max(6, Math.round(bodySimPx / 15.5));
  const cardCols = mainSimPx >= 620 ? 3 : (mainSimPx >= 370 ? 2 : 1);

  // 导航文字是否截断（仅 full 模式下需要完整显示 4 汉字标签）
  // 图标区 + 边距约占 62px，4 个 14px 汉字 + 余量需约 114px → 完整模式 < 176px 即开始截断
  const navLabelSlotSimPx = Math.max(0, railSimPx - 62);
  const labelNeedSimPx = 114;
  const isTruncated = state.mode === "full" && navLabelSlotSimPx < labelNeedSimPx;
  const maxFitChars = state.mode === "full" ? Math.max(1, Math.floor(navLabelSlotSimPx / 26)) : 4;

  // 主区滚动条热区
  const scrollTrackRect = {
    x: mainRect.x + mainRect.w - 11,
    y: mainRect.y + 12,
    w: 6,
    h: Math.max(60, mainRect.h - 24),
  };

  return {
    frame: { x: frameX, y: frameY, w: frameW, h: frameH },
    headerH,
    scaleToCanvas,
    railSimPx,
    mainSimPx,
    railShare,
    mainShare,
    railRect,
    mainRect,
    dividerX,
    avatar: { x: railRect.x + railRect.w / 2, y: avatarY, r: avatarR },
    navItemRects,
    visibleNavCount,
    toggleBtnRect,
    clutterRect,
    clutterCloseRect,
    scrollTrackRect,
    scrollShiftCanvas,
    heroSplit,
    mainCpl,
    cardCols,
    navLabelSlotSimPx,
    isTruncated,
    maxFitChars,
  };
}

/**
 * 双向错态与四支柱实况诊断（单真源，直接吃 computeLayout 的实测几何）
 */
export function auditLayout(state, layout) {
  const issues = [];
  const pctRail = Math.round(layout.railShare * 100);
  const pctMain = Math.round(layout.mainShare * 100);

  // 1. 窄屏硬撑常驻侧栏（手机灾难）
  const mobileCrush = state.viewport <= 480 && state.mode === "full";
  if (mobileCrush) {
    issues.push({
      id: "mobile-crush",
      badge: `窄屏挤爆 · 主区 ${layout.mainSimPx}px`,
      title: `390px 手机里硬留常驻侧栏，正文被挤到只剩 ${layout.mainSimPx}px`,
      why: `手机竖屏总共只有 390px 宽，常驻侧栏拿走 ${layout.railSimPx}px 后，右侧每行只能挤下约 ${layout.mainCpl} 个字，标题与卡片全都碎成竖条。`,
      how: "把左侧形态切成「抽屉 Drawer」（或 52px 图标轨），让主内容拿回完整屏宽。",
      fixLabel: "一键收成移动抽屉",
      fixPatch: { mode: "drawer", drawerOpen: false },
      pillar: "emphasis",
    });
  }

  // 2. 侧栏过肥侵占主区
  const railTooWide = !mobileCrush && state.mode === "full" && layout.railShare > 0.30;
  if (railTooWide) {
    issues.push({
      id: "sidebar-fat",
      badge: `侧栏过肥 ${pctRail}%`,
      title: `侧边栏占了 ${pctRail}%（${layout.railSimPx}px），把主内容挤成了配角`,
      why: `侧边栏的职责是「在侧定位」而非和正文分庭抗礼。当它超过三成宽度，右侧主区只剩 ${pctMain}%（每行约 ${layout.mainCpl} 字），两块区域会互相抢夺第一眼注意力。`,
      how: "向左拖动中间朱红分隔轨，把完整侧栏收回到 18%–26%（约 210–280px 经验区间），或点顶角折叠钮切成图标轨。",
      fixLabel: "把侧栏收窄到 22%（264px）",
      fixPatch: { railRatio: 0.22 },
      pillar: "emphasis",
    });
  }

  // 3. 侧栏过窄把完整文字挤断
  const railTooNarrow = !mobileCrush && layout.isTruncated;
  if (railTooNarrow) {
    issues.push({
      id: "label-truncated",
      badge: `字被截断 · ${layout.railSimPx}px`,
      title: `完整侧栏缩到 ${layout.railSimPx}px，导航标签全被挤断成省略号`,
      why: `文字槽只剩 ${layout.navLabelSlotSimPx}px，连 4 字导航名都摆不下（最多露 ${layout.maxFitChars} 字），读者认不出入口只能靠猜。要窄空间就别硬塞文字。`,
      how: "向右把分隔轨拉宽至 ≥180px，或者直接点顶角按钮切到「图标轨 Rail」，只留高识别图标与悬停提示。",
      fixLabel: "拉回舒适宽 22%（或切图标轨）",
      fixPatch: { railRatio: 0.22 },
      pillar: "navClear",
    });
  }

  // 4. 滚读时导航随页流失（未 Sticky 锚定）
  const navScrolledAway = !state.sticky && state.mode !== "drawer" && layout.visibleNavCount < 4;
  if (navScrolledAway) {
    const lost = 4 - layout.visibleNavCount;
    issues.push({
      id: "nav-scrolled-away",
      badge: `滚丢 ${lost} 项导航`,
      title: `页面滚到 ${Math.round(state.scroll * 100)}%，侧栏 ${lost} 个核心入口已经滚出视野`,
      why: "侧边栏采用普通文档流（static）跟着正文一起往上滚时，读者读到中段就会失去目录坐标，想跳下一章得先把页面拖回最顶部。",
      how: "打开「固定锚定 Sticky」，让侧边栏稳稳贴在视口边缘伴随滚读。",
      fixLabel: "开启 Sticky 固定锚定",
      fixPatch: { sticky: true },
      pillar: "navClear",
    });
  }

  // 5. 未开启当前位高亮（定位迷航）
  const noHighlight = !state.highlight;
  if (noHighlight) {
    issues.push({
      id: "no-highlight",
      badge: "定位丢失 · 无高亮",
      title: "四条导航长得一模一样，读者根本看不出正停在哪一章",
      why: "侧边栏之所以叫「坐标锚」，关键在于一眼标明「你在这里」（aria-current）。缺少单点高亮时，用户切换两回就会心里发虚、反复核对标题。",
      how: "打开「当前位高亮」，只为选中章节加上反色胶囊与左缘锚条，其余条目保持安静。",
      fixLabel: "点亮当前所在章节",
      fixPatch: { highlight: true },
      pillar: "hierarchy",
    });
  }

  // 6. 侧栏塞满冗余杂物（破坏辅助支持）
  const hasClutter = !!state.clutter;
  if (hasClutter) {
    issues.push({
      id: "sidebar-clutter",
      badge: "杂物抢焦",
      title: "侧边栏底端塞进刺眼推广卡，直接与主内容抢夺视线",
      why: "把广告、弹窗或低相关挂件堆进侧边栏，会让边缘变成视觉噪音源，既淹没了真正的「参考支持」入口，又持续拉扯读者的余光。",
      how: "直接点击画布侧栏底部的红叉清掉冗余卡，把侧边栏还给导航与参考支持。",
      fixLabel: "清掉侧栏冗余杂物",
      fixPatch: { clutter: false },
      pillar: "support",
    });
  }

  // 7. 宽主导航反常识右置（课程/后台主导航场景下宽栏放右边）
  const rightPrimary = state.side === "right" && state.scene !== "report" && state.mode === "full" && layout.railShare > 0.24;
  if (rightPrimary) {
    issues.push({
      id: "right-primary-nav",
      badge: "主导航右置偏重",
      title: `主导航占 ${pctRail}% 却放在右侧，违背左缘起扫习惯`,
      why: "NN/g 眼动研究显示从左到右阅读时约八成注视集中在左半区。高频课程/后台主导航放在左侧更顺眼；右侧更适合窄幅的「辅助大纲或注释栏」。",
      how: "把置位切回「左侧主导航」，或切到「数据报告」并将右侧辅助栏收窄至 ≤24%。",
      fixLabel: "将主导航移回左侧",
      fixPatch: { side: "left" },
      pillar: "hierarchy",
    });
  }

  // 额外双向检验：即便滚在顶部（scroll 很小）如果未开 sticky 且用户没看懂，也在支持柱温和提示；
  // 但为了允许合法解在开启 sticky 时轻松过关，四个支柱精确对应：
  const pillars = {
    navClear: !railTooNarrow && !navScrolledAway && !mobileCrush,
    hierarchy: !noHighlight && !rightPrimary,
    emphasis: !railTooWide && !mobileCrush,
    support: !hasClutter && (state.sticky || state.mode === "drawer" || state.scroll < 0.24),
  };

  // 如果 scroll >= 0.24 且 !sticky 但恰好还没滚出第 4 项（临界态），也补发一个提示保证支柱与诊单 100% 一致
  if (!pillars.support && !hasClutter && !navScrolledAway) {
    issues.push({
      id: "sticky-missing",
      badge: "随滚易丢失",
      title: "当前未开启固定锚定，继续向下滚读侧栏就会消失",
      why: "长页面阅读一旦越过首屏，未锚定的侧栏便不再陪伴左右，读者不得不频繁滚回顶端重新定位。",
      how: "开启「固定锚定 Sticky」让侧栏随滚常驻。",
      fixLabel: "开启 Sticky 固定锚定",
      fixPatch: { sticky: true },
      pillar: "support",
    });
  }

  const passedCount = Object.values(pillars).filter(Boolean).length;
  const ok = passedCount === 4 && issues.length === 0;

  let passPattern = "";
  let passSummary = "";
  if (ok) {
    if (state.mode === "drawer") {
      passPattern = "移动抽屉解 · 4/4";
      passSummary = `在 ${state.viewport}px 视口下将侧栏收进按需抽屉，主内容稳占 100% 宽度，入口清晰且零挤压。`;
    } else if (state.mode === "rail") {
      passPattern = "高效图标轨解 · 4/4";
      passSummary = `侧栏折叠为 ${layout.railSimPx}px 图标轨，把 ${pctMain}% 超宽画布完整让给主体内容，高频操作极顺手。`;
    } else if (state.side === "right") {
      passPattern = "右置辅助大纲解 · 4/4";
      passSummary = `主内容稳居左半高注视区（${pctMain}%），右侧 ${pctRail}% 窄辅助栏固定伴随，长文与报告阅读极从容。`;
    } else {
      passPattern = "经典左导解 · 4/4";
      passSummary = `左侧 ${pctRail}%（${layout.railSimPx}px）固定导航清晰高亮，右侧 ${pctMain}% 主内容每行约 ${layout.mainCpl} 字，主次分明。`;
    }
  }

  // 整体态势档位（诚实标注「示意」，绝不假精确）
  let posture = "四重失序（示意）";
  if (ok) posture = "从容有序（示意）";
  else if (passedCount === 3) posture = "还差临门一脚（示意）";
  else if (passedCount === 2) posture = "主次拉扯（示意）";
  else if (passedCount === 1) posture = "多处掣肘（示意）";

  return {
    ok,
    passedCount,
    pillars,
    issues,
    primary: issues[0] || null,
    passPattern,
    passSummary,
    posture,
    pctRail,
    pctMain,
  };
}
