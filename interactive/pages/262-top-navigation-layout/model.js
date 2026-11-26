// 262 顶部导航布局 · 单真源数据与实测模型
// 画布绘制、四项原则探针、单真源诊单与控台全部读取同一份 evaluateNav(state) 结果。

export const SITES = {
  learning: {
    id: "learning",
    name: "在线学习平台",
    short: "原海报 · 学习平台",
    brandName: "北极星",
    brandSub: "LEARNING HUB",
    items: {
      home: { id: "home", label: "首页", icon: "home", role: "home", order: 0, pageTitle: "清晰的导航，指引高效的学习旅程", pageSub: "系统化课程地图与沉浸式实战空间，一步直达每一阶段目标。", hero: "mountains", cards: ["入门导学", "每周专题", "进度总览"] },
      courses: { id: "courses", label: "课程体系", icon: "book", role: "core", order: 1, pageTitle: "课程体系 · 信息架构与版式路径", pageSub: "按基础、进阶、项目三层组织的完整路线，清晰标明前置课与实战。", hero: "courses", cards: ["基础网格", "导航系统", "组件规范"] },
      resources: { id: "resources", label: "学习资源", icon: "grid", role: "core", order: 2, pageTitle: "学习资源 · 检查单与案例库", pageSub: "可按主题检索的设计原则手册、可访问性清单与结构示意源文件。", hero: "resources", cards: ["检查清单", "模式图鉴", "交互模板"] },
      projects: { id: "projects", label: "实践项目", icon: "folder", role: "core", order: 3, pageTitle: "实践项目 · 真实站点导航改版", pageSub: "针对多端场景重新规划一级入口与状态反馈，提交评审记录。", hero: "projects", cards: ["官网改版", "文档重构", "移动适配"] },
      profile: { id: "profile", label: "个人中心", icon: "user", role: "utility", order: 4, pageTitle: "个人中心 · 学习进度与收藏", pageSub: "已完成 14 节核心课，上次停留在「顶部导航布局与层级建议」。", hero: "profile", cards: ["学习记录", "我的收藏", "消息提醒"] },
      privacy: { id: "privacy", label: "隐私条款", icon: "doc", role: "junk", order: 10, reason: "法律合规条款属于页脚兜底区，不应抢占一级顶栏" },
      about: { id: "about", label: "关于我们", icon: "info", role: "junk", order: 11, reason: "低频背景介绍更适合放进页脚或二级入口" },
      changelog: { id: "changelog", label: "更新日志", icon: "clock", role: "junk", order: 12, reason: "迭代记录属辅助资讯，塞进顶栏会稀释核心路径" },
      careers: { id: "careers", label: "招聘启事", icon: "brief", role: "junk", order: 13, reason: "仅服务极少数求职访客，应归入页脚" },
      partner: { id: "partner", label: "商务合作", icon: "link", role: "junk", order: 14, reason: "合作联系属低频入口，放入页脚即可" },
    },
    brokenTop: ["home", "courses", "privacy", "about", "projects", "changelog", "resources", "careers", "profile", "partner"],
    classicTop: ["home", "courses", "resources", "projects", "profile"],
    minimalTop: ["courses", "resources", "projects", "profile"],
  },
  saas: {
    id: "saas",
    name: "设计工具官网",
    short: "设计工具官网",
    brandName: "棱镜画板",
    brandSub: "PRISM STUDIO",
    items: {
      home: { id: "home", label: "首页", icon: "home", role: "home", order: 0, pageTitle: "矢量界面与原型在同一画布协同", pageSub: "面向设计团队的轻量协作画板，打开浏览器即可评审与交付。", hero: "mountains", cards: ["实时协作", "组件变量", "切图标注"] },
      courses: { id: "courses", label: "核心功能", icon: "book", role: "core", order: 1, pageTitle: "核心功能 · 自动布局与变量体系", pageSub: "约束规则、响应式断点与设计令牌一站同步到研发端。", hero: "courses", cards: ["自动布局", "设计令牌", "原型连线"] },
      resources: { id: "resources", label: "模板市场", icon: "grid", role: "core", order: 2, pageTitle: "模板市场 · 社区组件与界面套件", pageSub: "覆盖桌面端网页、移动端应用与信息图表的可直接复用套件。", hero: "resources", cards: ["网页套件", "图标系统", "演示模板"] },
      projects: { id: "projects", label: "价格方案", icon: "folder", role: "core", order: 3, pageTitle: "价格方案 · 个人免费与团队订阅", pageSub: "透明阶梯定价，按活跃编辑席位计费，审阅成员不限量。", hero: "projects", cards: ["个人免费", "团队专业", "企业私有"] },
      profile: { id: "profile", label: "控制台", icon: "user", role: "utility", order: 4, pageTitle: "控制台 · 团队空间与成员权限", pageSub: "管理当前 3 个进行中项目、共享组件库与外部审阅链接。", hero: "profile", cards: ["最近文件", "共享库", "团队设置"] },
      privacy: { id: "privacy", label: "服务协议", icon: "doc", role: "junk", order: 10, reason: "法务条款应放在页脚而非首屏导航" },
      about: { id: "about", label: "媒体资料", icon: "info", role: "junk", order: 11, reason: "品牌下载包属低频入口，适合归入页脚" },
      changelog: { id: "changelog", label: "版本历史", icon: "clock", role: "junk", order: 12, reason: "更新流水适合作为文档子页或页脚链接" },
      careers: { id: "careers", label: "加入我们", icon: "brief", role: "junk", order: 13, reason: "招聘入口不应占用访客高频浏览的顶栏" },
      partner: { id: "partner", label: "安全合规", icon: "link", role: "junk", order: 14, reason: "合规认证属信任兜底，常规放在页脚" },
    },
    brokenTop: ["home", "courses", "privacy", "about", "projects", "changelog", "resources", "careers", "profile", "partner"],
    classicTop: ["home", "courses", "resources", "projects", "profile"],
    minimalTop: ["courses", "resources", "projects", "profile"],
  },
  magazine: {
    id: "magazine",
    name: "独立数字杂志",
    short: "独立数字杂志",
    brandName: "观止画刊",
    brandSub: "EDITORIAL PRESS",
    items: {
      home: { id: "home", label: "封面", icon: "home", role: "home", order: 0, pageTitle: "城市里的信息路牌与数字界面", pageSub: "从地铁导视系统到现代网页顶栏，追踪清晰指引背后的秩序。", hero: "mountains", cards: ["本期头条", "编辑手记", "摄影特辑"] },
      courses: { id: "courses", label: "深度专题", icon: "book", role: "core", order: 1, pageTitle: "深度专题 · 排版与信息建筑", pageSub: "长篇田野观察与设计师访谈，拆解复杂内容的阅读动线。", hero: "courses", cards: ["版式长文", "设计对话", "视觉考据"] },
      resources: { id: "resources", label: "视觉评论", icon: "grid", role: "core", order: 2, pageTitle: "视觉评论 · 书籍、海报与网页", pageSub: "每周挑选值得反复细读的出版物与界面改版案例进行评述。", hero: "resources", cards: ["海报评析", "书装笔记", "界面观察"] },
      projects: { id: "projects", label: "往期归档", icon: "folder", role: "core", order: 3, pageTitle: "往期归档 · 按年份与主题索引", pageSub: "完整收录创刊以来全部 48 期电子刊，支持关键词定位。", hero: "projects", cards: ["2026 合集", "2025 合集", "主题目录"] },
      profile: { id: "profile", label: "订阅管理", icon: "user", role: "utility", order: 4, pageTitle: "订阅管理 · 会员通讯与书签", pageSub: "已开启每周四早间通讯，共收藏 19 篇专题文章。", hero: "profile", cards: ["通讯频率", "我的书签", "会员凭据"] },
      privacy: { id: "privacy", label: "版权声明", icon: "doc", role: "junk", order: 10, reason: "版权信息固定放在页脚即可" },
      about: { id: "about", label: "投稿须知", icon: "info", role: "junk", order: 11, reason: "作者投稿说明不宜与读者频道并列" },
      changelog: { id: "changelog", label: "广告刊例", icon: "clock", role: "junk", order: 12, reason: "商务刊例属低频信息，归入页脚更清晰" },
      careers: { id: "careers", label: "编辑团队", icon: "brief", role: "junk", order: 13, reason: "刊物署名页放在页脚「关于」区即可" },
      partner: { id: "partner", label: "邮件退订", icon: "link", role: "junk", order: 14, reason: "账户低频操作不该直接摆在全局顶栏" },
    },
    brokenTop: ["home", "courses", "privacy", "about", "projects", "changelog", "resources", "careers", "profile", "partner"],
    classicTop: ["home", "courses", "resources", "projects", "profile"],
    minimalTop: ["courses", "resources", "projects", "profile"],
  },
};

export const VARIANTS = {
  center: { id: "center", label: "居中对齐", posterNote: "适合内容较少、强调均衡美感。" },
  right: { id: "right", label: "右侧对齐", posterNote: "适合强调品牌，功能入口集中。" },
  split: { id: "split", label: "左品牌·中频道·右操作", posterNote: "品牌在侧，关键功能居中，操作入口右侧。" },
};

export const FEEDBACKS = {
  none: { id: "none", label: "无高亮" },
  underline: { id: "underline", label: "亮青底线" },
  pill: { id: "pill", label: "青绿胶囊" },
  topbar: { id: "topbar", label: "顶边色条" },
};

export const RESPONSIVES = {
  overflow: { id: "overflow", label: "硬挤不折" },
  drawer: { id: "drawer", label: "抽屉折叠" },
  priority: { id: "priority", label: "优先级+更多" },
};

// 开场默认停在 0/4 复合错态（绝非答案）
export function createInitialState(siteId = "learning") {
  const site = SITES[siteId] || SITES.learning;
  return {
    siteId: site.id,
    topIds: [...site.brokenTop],
    dockIds: [],
    activeId: "courses",
    variant: "center",
    feedback: "none",
    consistency: "shuffle",
    responsive: "overflow",
    barHeight: 62,
    simWidth: 1020,
    brandHome: true,
    drawerOpen: false,
    highlightPrinciple: null,
    pageSwitches: 0,
  };
}

// 多组合法解（全部可独立达 4/4）
export function applySolution(state, kind) {
  const site = SITES[state.siteId];
  const allIds = Object.keys(site.items);
  if (kind === "classic") {
    const topIds = [...site.classicTop];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "courses",
      variant: "center",
      feedback: "underline",
      consistency: "consistent",
      responsive: "drawer",
      barHeight: 62,
      simWidth: 1040,
      brandHome: true,
      drawerOpen: false,
    };
  }
  if (kind === "split") {
    const topIds = [...site.classicTop];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "resources",
      variant: "split",
      feedback: "pill",
      consistency: "consistent",
      responsive: "priority",
      barHeight: 64,
      simWidth: 1080,
      brandHome: true,
      drawerOpen: false,
    };
  }
  if (kind === "brandRight") {
    // 品牌块本身承担回首页，一级栏聚焦 4 项核心入口右对齐
    const topIds = [...site.minimalTop];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "courses",
      variant: "right",
      feedback: "topbar",
      consistency: "consistent",
      responsive: "drawer",
      barHeight: 56,
      simWidth: 1000,
      brandHome: true,
      drawerOpen: false,
    };
  }
  return state;
}

// 双向试错预设
export function applyFailCase(state, kind) {
  const site = SITES[state.siteId];
  const allIds = Object.keys(site.items);
  if (kind === "reset" || kind === "overload") {
    return createInitialState(state.siteId);
  }
  if (kind === "overprune") {
    const topIds = ["home", "profile"];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "home",
      variant: "center",
      feedback: "underline",
      consistency: "consistent",
      responsive: "drawer",
      barHeight: 60,
      simWidth: 1020,
      brandHome: true,
      drawerOpen: false,
    };
  }
  if (kind === "noHighlight") {
    const topIds = [...site.classicTop];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "projects",
      variant: "center",
      feedback: "none",
      consistency: "shuffle",
      responsive: "drawer",
      barHeight: 62,
      simWidth: 1020,
      brandHome: true,
      drawerOpen: false,
    };
  }
  if (kind === "mobileCrash") {
    const topIds = [...site.classicTop];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "courses",
      variant: "center",
      feedback: "underline",
      consistency: "consistent",
      responsive: "overflow",
      barHeight: 62,
      simWidth: 390,
      brandHome: true,
      drawerOpen: false,
    };
  }
  if (kind === "thinBar") {
    const topIds = [...site.classicTop];
    return {
      ...state,
      topIds,
      dockIds: allIds.filter((id) => !topIds.includes(id)),
      activeId: "courses",
      variant: "right",
      feedback: "underline",
      consistency: "consistent",
      responsive: "drawer",
      barHeight: 38,
      simWidth: 1020,
      brandHome: false,
      drawerOpen: false,
    };
  }
  return state;
}

// 如果切页一致性关闭且不在首页，模拟「跨页乱序」破坏肌肉记忆
export function getDisplayedTopIds(state) {
  const ids = [...state.topIds];
  if (state.consistency === "shuffle" && state.activeId !== "home" && ids.length >= 3) {
    // 确定性旋转位移，让用户切页时真切看到导航项位置跳动
    const shift = state.activeId === "courses" ? 1 : state.activeId === "resources" ? 2 : 3;
    const n = ids.length;
    const s = shift % n;
    return [...ids.slice(s), ...ids.slice(0, s)];
  }
  return ids;
}

// 单项实测宽（图标 16 + 间距 6 + 汉字 13.8px/字 + 左右内边距 20）
export function estimateItemWidth(item, compact = false) {
  const charW = compact ? 12.2 : 14.2;
  const pad = compact ? 22 : 30;
  const iconW = compact ? 14 : 18;
  return Math.round(iconW + item.label.length * charW + pad);
}

// 计算任意指定宽度下的顶栏排版实测几何
export function measureBarAtWidth(state, widthPx) {
  const site = SITES[state.siteId];
  const ids = getDisplayedTopIds(state);
  const isMobile = widthPx < 640;
  const compact = widthPx < 820;
  const brandW = isMobile ? 74 : state.variant === "right" ? 156 : 124;
  const utilIconsW = state.variant === "split" && !isMobile ? 86 : 0;
  const padX = isMobile ? 12 : 20;
  const gap = compact ? 6 : 10;

  // 在三段式下，utility 项（个人中心/控制台）归入右侧操作槽
  const splitMode = state.variant === "split" && !isMobile;
  const centerIds = splitMode ? ids.filter((id) => site.items[id]?.role !== "utility") : ids;
  const rightIds = splitMode ? ids.filter((id) => site.items[id]?.role === "utility") : [];

  const rightSlotW = rightIds.reduce((acc, id) => acc + estimateItemWidth(site.items[id], compact) + gap, 0) + utilIconsW;
  const trackStart = brandW + padX;
  const trackEnd = widthPx - padX - rightSlotW;
  const trackW = Math.max(120, trackEnd - trackStart);

  // 窄屏处理
  if (isMobile) {
    if (state.responsive === "drawer") {
      return {
        widthPx,
        isMobile: true,
        collapsedMode: "drawer",
        brandW,
        trackW: widthPx - brandW - padX * 2,
        visibleIds: [],
        hiddenIds: ids,
        rows: 1,
        singleRowNeedW: 98,
        fillRatio: 0.42,
        overflowPx: 0,
        effectiveBarHeight: Math.max(40, state.barHeight),
      };
    }
    if (state.responsive === "priority") {
      // 保留前 2 个优先项 + 「更多」按钮，保证不溢出
      const moreW = 74;
      const avail = widthPx - brandW - padX * 2 - moreW - gap;
      const visible = [];
      let used = 0;
      for (const id of ids) {
        const w = estimateItemWidth(site.items[id], true);
        if (visible.length < 2 && used + w + (visible.length ? gap : 0) <= avail) {
          visible.push(id);
          used += w + (visible.length > 1 ? gap : 0);
        }
      }
      const hidden = ids.filter((id) => !visible.includes(id));
      return {
        widthPx,
        isMobile: true,
        collapsedMode: "priority",
        brandW,
        trackW: avail + moreW,
        visibleIds: visible,
        hiddenIds: hidden,
        rows: 1,
        singleRowNeedW: used + moreW,
        fillRatio: Math.min(0.95, (used + moreW) / Math.max(1, widthPx - brandW - padX * 2)),
        overflowPx: 0,
        effectiveBarHeight: Math.max(40, state.barHeight),
      };
    }
    // responsive === "overflow"：硬挤不折叠，实测右侧溢出裁切
    const widths = ids.map((id) => estimateItemWidth(site.items[id], true));
    const need = widths.reduce((a, b) => a + b, 0) + Math.max(0, widths.length - 1) * 6;
    const avail = widthPx - brandW - padX * 2;
    const overflowPx = Math.max(0, Math.round(need - avail));
    return {
      widthPx,
      isMobile: true,
      collapsedMode: "overflow",
      brandW,
      trackW: avail,
      visibleIds: ids,
      hiddenIds: [],
      rows: 1,
      singleRowNeedW: need,
      fillRatio: need / Math.max(1, avail),
      overflowPx,
      effectiveBarHeight: Math.max(40, state.barHeight),
    };
  }

  // 桌面/平板单行与折行实测
  const centerWidths = centerIds.map((id) => ({ id, w: estimateItemWidth(site.items[id], compact) }));
  const singleRowNeedW =
    centerWidths.reduce((a, b) => a + b.w, 0) + Math.max(0, centerWidths.length - 1) * gap;

  const rowList = [[]];
  let curW = 0;
  for (const item of centerWidths) {
    const add = (rowList[rowList.length - 1].length ? gap : 0) + item.w;
    if (rowList[rowList.length - 1].length > 0 && curW + add > trackW) {
      rowList.push([item]);
      curW = item.w;
    } else {
      rowList[rowList.length - 1].push(item);
      curW += add;
    }
  }
  const rows = rowList.length;
  const fillRatio = singleRowNeedW / Math.max(1, trackW);
  const effectiveBarHeight = rows > 1 ? Math.max(state.barHeight, rows * 44 + 16) : state.barHeight;
  const overflowPx = rows === 1 && singleRowNeedW > trackW ? Math.round(singleRowNeedW - trackW) : 0;

  return {
    widthPx,
    isMobile: false,
    collapsedMode: "full",
    brandW,
    trackStart,
    trackEnd,
    trackW,
    rightSlotW,
    centerIds,
    rightIds,
    rowList,
    rows,
    singleRowNeedW,
    fillRatio,
    overflowPx,
    effectiveBarHeight,
  };
}

// 单真源四原则全面评估
export function evaluateNav(state) {
  const site = SITES[state.siteId];
  const topItems = state.topIds.map((id) => site.items[id]).filter(Boolean);
  const dockItems = state.dockIds.map((id) => site.items[id]).filter(Boolean);

  const curBar = measureBarAtWidth(state, state.simWidth);
  const desktopBar = measureBarAtWidth(state, Math.max(1000, state.simWidth));
  const mobileBar = measureBarAtWidth(state, 390);

  const count = topItems.length;
  const junkInTop = topItems.filter((it) => it.role === "junk");
  const coreCatalog = Object.values(site.items).filter((it) => it.role === "core");
  const coreInTop = topItems.filter((it) => it.role === "core");
  const missingCore = coreCatalog.filter((it) => !state.topIds.includes(it.id));
  const hasHome = state.topIds.includes("home");

  // 顺序逻辑：如果「首页」在顶栏中，宜放首位；「个人中心/控制台」不应抢在核心内容频道之前
  const homeIndex = state.topIds.indexOf("home");
  const utilityIndex = topItems.findIndex((it) => it.role === "utility");
  const lastCoreIndex = topItems.reduce((acc, it, idx) => (it.role === "core" ? idx : acc), -1);
  const homeMisplaced = hasHome && homeIndex > 0;
  const utilityMisplaced = utilityIndex !== -1 && lastCoreIndex !== -1 && utilityIndex < lastCoreIndex;
  const coreOrderIds = coreInTop.map((it) => it.order);
  const coreReversed = coreOrderIds.some((o, idx) => idx > 0 && o < coreOrderIds[idx - 1]);

  // 1. 概览性 · 精简选项
  let overview;
  if (count > 7) {
    overview = {
      ok: false,
      code: "overload",
      short: `超载 ${count} 项`,
      headline: `顶栏塞进 ${count} 个入口，被迫折成 ${curBar.rows} 行`,
      why: `一级顶栏推荐控制在 4–7 项（经验值），贴近工作记忆单次扫视上限（Cowan, 2001）。现在挤入 ${count} 项，桌面宽占用率高达 ${Math.round(desktopBar.fillRatio * 100)}%，主次入口混成一片，扫视成本剧增。`,
      fix: `把顶栏里的页脚杂项（${junkInTop.slice(0, 3).map((x) => `「${x.label}」`).join("、") || "低频入口"}）向下拖进「次级收纳托盘」，将顶栏精简到 4–7 项。`,
    };
  } else if (curBar.rows > 1) {
    overview = {
      ok: false,
      code: "wrapped",
      short: `折成 ${curBar.rows} 行`,
      headline: `当前 ${state.simWidth}px 宽度下顶栏折成了 ${curBar.rows} 行`,
      why: `一级水平导航一旦折行，栏高立刻飙到 ${curBar.effectiveBarHeight}px，不仅侵占首屏内容，还会破坏单行并列的层级感。`,
      fix: `减少 1–2 个次要入口，或向右拉开视口宽度、切换到三段式紧凑排布。`,
    };
  } else if (count < 3) {
    overview = {
      ok: false,
      code: "overprune",
      short: `仅剩 ${count} 项`,
      headline: `过度精简只留 ${count} 项，站点全貌看不见`,
      why: `顶部导航的价值在于「摊开地图」。把核心栏目全藏进收纳区后，访客一眼看不出站点到底能做什么（NN/g 研究表明隐藏主导航会显著削弱内容可发现性）。`,
      fix: `从「次级收纳托盘」里把核心栏目拖回顶栏，恢复到 4–7 个一级入口。`,
    };
  } else {
    overview = {
      ok: true,
      code: "ok",
      short: `${count} 项 · 单行`,
      headline: "",
      why: "",
      fix: "",
    };
  }

  // 2. 引导性 · 逻辑分组
  let guidance;
  if (junkInTop.length > 0) {
    guidance = {
      ok: false,
      code: "junk",
      short: `混入 ${junkInTop.length} 杂项`,
      headline: `顶栏混入 ${junkInTop.length} 项低频杂项，打断核心任务流`,
      why: `「${junkInTop.map((x) => x.label).join("」「")}」属于页脚或辅助信息。把它们与核心业务并排，就像在商场总导视牌里夹杂消防栓编号，拖慢用户寻找主路径的速度。`,
      fix: `在画布顶栏里把带虚线警示标的杂项向下拖入「次级收纳托盘」（或点选中后按 ↓ 键移出）。`,
    };
  } else if (missingCore.length > 0) {
    guidance = {
      ok: false,
      code: "missing_core",
      short: `漏掉「${missingCore[0].label}」`,
      headline: `核心入口「${missingCore[0].label}」被移出了顶栏`,
      why: `精简导航不是把主干频道也删掉。缺少「${missingCore.map((x) => x.label).join("」「")}」后，学习与探索路径在首屏断档。`,
      fix: `在「次级收纳托盘」中点击或向上拖回「${missingCore[0].label}」。`,
    };
  } else if (homeMisplaced) {
    guidance = {
      ok: false,
      code: "home_order",
      short: "首页位置错乱",
      headline: `「${site.items.home.label}」落在了第 ${homeIndex + 1} 位，违背从左到右起点习惯`,
      why: `访客扫视横栏习惯以左上品牌和首位入口作起点，把「${site.items.home.label}」埋在中间会削弱导航顺序预期。`,
      fix: `在顶栏中把「${site.items.home.label}」向左拖到最前，或移出托盘由左侧品牌块承担回首页。`,
    };
  } else if (utilityMisplaced) {
    const uItem = topItems[utilityIndex];
    guidance = {
      ok: false,
      code: "utility_order",
      short: "工具项插队",
      headline: `辅助入口「${uItem.label}」插进了内容频道前面`,
      why: `按用户心智模型分组时，个人/账户/工具入口应统一收敛在导航末端或右侧操作区，不要打断核心内容频道。`,
      fix: `把「${uItem.label}」向右拖到顶栏最末端，或切到「左品牌·中频道·右操作」三段变体。`,
    };
  } else if (coreReversed) {
    guidance = {
      ok: false,
      code: "core_order",
      short: "任务序颠倒",
      headline: `核心频道的先后逻辑与用户任务顺序相反`,
      why: `从探索到实践的递增路径（如 ${coreCatalog.map((x) => x.label).join(" → ")}）能减少来回对照的认知成本。`,
      fix: `在顶栏里左右拖动核心频道，按学习/使用先后自然排开。`,
    };
  } else {
    guidance = {
      ok: true,
      code: "ok",
      short: `${coreInTop.length} 核心 · 序清晰`,
      headline: "",
      why: "",
      fix: "",
    };
  }

  // 3. 定位感 · 一致反馈
  const activeItem = site.items[state.activeId] || site.items.home;
  let orientation;
  if (state.feedback === "none") {
    orientation = {
      ok: false,
      code: "no_highlight",
      short: "缺少高亮",
      headline: `当前身处「${activeItem.label}」，顶栏却毫无高亮反馈`,
      why: `点开子页后，顶栏所有文字样式一模一样。用户无法一秒确认「我现在在哪」，也缺乏对应的 aria-current="page" 定位锚点。`,
      fix: `在下方控台把「当前状态反馈」切为亮青底线、青绿胶囊或顶边色条，并点击顶栏不同入口体验切页高亮。`,
    };
  } else if (state.consistency === "shuffle") {
    orientation = {
      ok: false,
      code: "shuffle",
      short: "切页移位",
      headline: `切换页面后导航顺序会跳变，破坏全局一致性`,
      why: `Steve Krug 将全局导航比作「沉稳的定心丸」：用户只学一次，每页入口都在同一个坐标。现在切去子页时入口整体移位，肌肉记忆立刻失效。`,
      fix: `把「跨页一致性」切为「全局固定」，再点几个顶栏入口确认每个槽位纹丝不动。`,
    };
  } else {
    orientation = {
      ok: true,
      code: "ok",
      short: `${FEEDBACKS[state.feedback].label} · 一致`,
      headline: "",
      why: "",
      fix: "",
    };
  }

  // 4. 可达性 · 响应适配
  let access;
  if (state.responsive === "overflow" || mobileBar.overflowPx > 0) {
    access = {
      ok: false,
      code: "mobile_overflow",
      short: `窄屏溢 ${mobileBar.overflowPx}px`,
      headline: `390px 手机屏下导航硬挤，右侧直接溢界 ${mobileBar.overflowPx}px`,
      why: `水平顶栏在宽屏省空间，但在 390px 竖屏里没有足够横宽平铺全部文字。不设响应式折收，手机访客根本点不到最右侧的入口。`,
      fix: `把「窄屏响应」切为「抽屉折叠」或「优先级+更多」，再把画布宽度滑到 390px 亲自验看手机形态。`,
    };
  } else if (!state.brandHome) {
    access = {
      ok: false,
      code: "brand_dead",
      short: "品牌未回首页",
      headline: `左上品牌区未链接回首页，丢掉了最通用的逃生口`,
      why: `几乎所有网页访客都会在迷路时本能点击左上角标志回首页。关闭品牌回首页会打破跨站通用约定，尤其当顶栏未单列「首页」时更危险。`,
      fix: `打开「品牌回首页」开关，并在画布里点击左上青色品牌块测试一键归位。`,
    };
  } else if (curBar.effectiveBarHeight < 48) {
    access = {
      ok: false,
      code: "bar_thin",
      short: `栏高 ${curBar.effectiveBarHeight}px 过扁`,
      headline: `顶栏仅 ${curBar.effectiveBarHeight}px 高，点击热区过扁容易点歪`,
      why: `常用单行顶栏经验高度在 52–72px；低于 48px 会压缩可点击纵深，降低触屏与快速指针的命中率。`,
      fix: `把「栏高」调回 52–72px 的舒适单行区间。`,
    };
  } else if (curBar.effectiveBarHeight > 80) {
    access = {
      ok: false,
      code: "bar_thick",
      short: `栏高 ${curBar.effectiveBarHeight}px 臃肿`,
      headline: `顶栏膨胀到 ${curBar.effectiveBarHeight}px，吃掉了宝贵首屏`,
      why: `顶部导航要轻薄克制（经验值 52–72px），若过度加厚或因折行撑高，会把下方主体标题与核心画面推到折线之外。`,
      fix: `收紧单行入口并把「栏高」调回 52–72px。`,
    };
  } else {
    access = {
      ok: true,
      code: "ok",
      short: `${curBar.effectiveBarHeight}px · ${RESPONSIVES[state.responsive].label}`,
      headline: "",
      why: "",
      fix: "",
    };
  }

  const checks = { guidance, orientation, overview, access };
  const passCount = [overview, guidance, orientation, access].filter((c) => c.ok).length;

  // 选择最紧迫的首条诊断（按教学优先级：超载/过少 → 杂项/缺失 → 定位/一致 → 响应/栏高）
  const ordered = [overview, guidance, orientation, access];
  const primaryFail = ordered.find((c) => !c.ok) || null;
  const failCount = 4 - passCount;

  // 寻路效率等级（明确标「示意」，杜绝假精确）
  let paceLabel = "顺畅直达";
  let paceTone = "ok";
  if (passCount <= 1) {
    paceLabel = "寻路受阻";
    paceTone = "bad";
  } else if (passCount <= 3) {
    paceLabel = "轻度迟疑";
    paceTone = "warn";
  }

  let summaryBadge;
  if (passCount === 4) {
    summaryBadge = `4/4 · 清晰可达`;
  } else {
    summaryBadge = `${passCount}/4 · ${primaryFail.short}`;
  }

  const diag = primaryFail
    ? {
        ok: false,
        tag: failCount >= 3 ? `${failCount} 重失守（示意）` : `尚余 ${failCount} 处待修（示意）`,
        headline: primaryFail.headline,
        why: primaryFail.why,
        fix: primaryFail.fix,
      }
    : {
        ok: true,
        tag: "4/4 全部达标（示意）",
        headline: `清晰克制的顶部导航：${count} 项单行、定位明确、多端可达`,
        why: `当前顶栏保持 ${count} 个逻辑分明的一级入口（桌面横宽占用 ${Math.round(desktopBar.fillRatio * 100)}%，栏高 ${curBar.effectiveBarHeight}px），「${activeItem.label}」以${FEEDBACKS[state.feedback].label}明确标出位置且跨页固定，390px 窄屏平滑转入「${RESPONSIVES[state.responsive].label}」。`,
        fix: `试试继续点击顶栏切页、拖到 390px 查手机形态，或按 Space 实测模拟指针寻路，也可切换不同合法解对照对比。`,
      };

  return {
    site,
    topItems,
    dockItems,
    activeItem,
    curBar,
    desktopBar,
    mobileBar,
    count,
    junkCount: junkInTop.length,
    checks,
    passCount,
    failCount,
    summaryBadge,
    paceLabel,
    paceTone,
    diag,
  };
}
