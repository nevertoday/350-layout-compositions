// 263 导航抽屉 布局 · 单真源数据与架构核算引擎
// 舞台 Canvas、四列优势实时探针、深酒红灯泡诊单、寻路模拟与多解预设全部读取同一份评估结果。

export const CONTEXTS = {
  poster: {
    id: "poster",
    name: "原海报 · 知识探索",
    short: "知识探索",
    brand: "导航系统",
    brandEn: "NAVIGATION SYSTEM",
    accentLabel: "原海报 7 项结构",
    // 原海报 7 项主菜单（含「分类」的二级子项，及扩展池供动态增减演示）
    baseItems: [
      { id: "overview", label: "概览", en: "OVERVIEW", group: "primary", icon: "home", pageTitle: "概览 · 今日视野", pageSub: "集中呈现核心摘要、最近更新与关键指标，抽屉收起后完整归还阅读宽度。", cards: ["精选专题", "阅读进度", "更新动态"] },
      { id: "discover", label: "发现", en: "DISCOVER", group: "primary", icon: "compass", pageTitle: "发现 · 推荐路径", pageSub: "按主题热度与编辑策展延展探索，不把发现流塞进顶栏抢焦点。", cards: ["本周策展", "热门索引", "跨类关联"] },
      {
        id: "categories",
        label: "分类",
        en: "CATEGORIES",
        group: "primary",
        icon: "grid",
        hasChildren: true,
        pageTitle: "分类 · 全部主题",
        pageSub: "一级主干下轻挂二级分类，展开即见子目录，保持抽屉纵深不超过两层。",
        cards: ["页面框架", "视觉网格", "层级系统"],
        children: [
          { id: "cat-framework", label: "页面框架", en: "FRAMEWORKS", pageTitle: "分类 / 页面框架", pageSub: "涵盖单列、分屏、侧栏与抽屉等整体页面骨架模式。", cards: ["侧滑抽屉", "固定侧栏", "顶部导航"] },
          { id: "cat-grid", label: "网格排版", en: "GRIDS", pageTitle: "分类 / 网格排版", pageSub: "栏宽、槽距与模块对齐的秩序基线。", cards: ["十二栏网", "基线对齐", "留白节奏"] },
          { id: "cat-motion", label: "交互反馈", en: "MOTION", pageTitle: "分类 / 交互反馈", pageSub: "抽屉滑出、遮罩压暗与焦点闭环的动态衔接。", cards: ["缓动曲线", "遮罩过渡", "手势回弹"] },
        ],
      },
      { id: "favorites", label: "收藏", en: "FAVORITES", group: "primary", icon: "bookmark", pageTitle: "收藏 · 个人书架", pageSub: "按标签归档常用资料，抽屉内一点即达，不必在首页铺满书签。", cards: ["待读清单", "灵感摘录", "常用模板"] },
      { id: "settings", label: "设置", en: "SETTINGS", group: "primary", icon: "gear", pageTitle: "设置 · 偏好面板", pageSub: "低频系统配置收于主组末尾或辅助区，避免挤占高频内容入口。", cards: ["外观主题", "快捷键位", "离线缓存"] },
      { id: "profile", label: "个人中心", en: "PROFILE", group: "primary", icon: "user", pageTitle: "个人中心 · 账号档案", pageSub: "同步进度与权限管理，放在抽屉中下段顺手可达。", cards: ["学习记录", "设备同步", "隐私偏好"] },
      { id: "help", label: "帮助与反馈", en: "HELP & FEEDBACK", group: "utility", icon: "help", pageTitle: "帮助与反馈", pageSub: "以细横线与主流程隔开，既能随时找到，又不会和核心频道混淆。", cards: ["使用指南", "问题排查", "提交建议"] },
    ],
    extraPool: [
      { id: "ex-history", label: "浏览历史", en: "HISTORY", group: "secondary", icon: "clock", pageTitle: "浏览历史", pageSub: "按时间倒序回溯最近访问条目。", cards: ["今日记录", "本周足迹", "已清缓存"] },
      { id: "ex-notes", label: "批注笔记", en: "NOTES", group: "secondary", icon: "doc", pageTitle: "批注笔记", pageSub: "跨条目摘录与批注索引。", cards: ["高亮摘句", "待整理", "导出清单"] },
      { id: "ex-offline", label: "离线包", en: "OFFLINE", group: "secondary", icon: "box", pageTitle: "离线包管理", pageSub: "预载常用图谱供无网查阅。", cards: ["基础包", "图例包", "更新日志"] },
      { id: "ex-lab", label: "实验功能", en: "LABS", group: "utility", icon: "spark", pageTitle: "实验功能", pageSub: "灰度测试中的交互原型。", cards: ["手势增强", "密度开关", "对比度尺"] },
      { id: "ex-team", label: "共享空间", en: "SPACES", group: "secondary", icon: "layers", pageTitle: "共享空间", pageSub: "团队协作书签与点评。", cards: ["设计组", "前端组", "公开集"] },
      { id: "ex-changelog", label: "更新日志", en: "CHANGELOG", group: "utility", icon: "list", pageTitle: "更新日志", pageSub: "版本演进与修订记录。", cards: ["v3.2 改动", "修复清单", "路线图"] },
      { id: "ex-shortcuts", label: "快捷键表", en: "SHORTCUTS", group: "utility", icon: "key", pageTitle: "快捷键表", pageSub: "键盘无鼠标快速跳转抽屉。", cards: ["全局键", "抽屉内", "搜索跳"] },
      { id: "ex-about", label: "关于项目", en: "ABOUT", group: "utility", icon: "info", pageTitle: "关于项目", pageSub: "版权说明与开放许可声明。", cards: ["许可协议", "致谢名单", "开源仓库"] },
    ],
    deepTrail: ["分类", "页面框架", "导航组件", "侧滑变体"],
  },

  saas: {
    id: "saas",
    name: "多模块 SaaS 后台",
    short: "SaaS 后台",
    brand: "云析工作台",
    brandEn: "CLOUDOPS CONSOLE",
    accentLabel: "B 端高频多模块",
    baseItems: [
      { id: "overview", label: "总览看板", en: "DASHBOARD", group: "primary", icon: "home", pageTitle: "总览看板 · 实时指标", pageSub: "宽屏下抽屉常驻或迷你轨折叠，让数据表格吃满剩余横向空间。", cards: ["日活趋势", "告警队列", "节点负载"] },
      { id: "discover", label: "项目列表", en: "PROJECTS", group: "primary", icon: "compass", pageTitle: "项目列表 · 活跃环境", pageSub: "跨十余个业务项目快速切换，抽屉比顶栏更能纵向容纳长清单。", cards: ["核心交易", "数据中台", "边缘网关"] },
      {
        id: "categories",
        label: "数据分析",
        en: "ANALYTICS",
        group: "primary",
        icon: "grid",
        hasChildren: true,
        pageTitle: "数据分析 · 指标中心",
        pageSub: "将漏斗、留存与自定义报表收纳在二级组下，避免一级导航爆炸。",
        cards: ["转化漏斗", "周留存率", "查询耗时"],
        children: [
          { id: "cat-framework", label: "流量漏斗", en: "FUNNEL", pageTitle: "数据分析 / 流量漏斗", pageSub: "追踪关键路径的每一步流失比例。", cards: ["访问转化", "注册节点", "付费达成"] },
          { id: "cat-grid", label: "留存看板", en: "RETENTION", pageTitle: "数据分析 / 留存看板", pageSub: "按周维度对比新老用户回访曲线。", cards: ["次日留存", "七日留存", "月度队列"] },
          { id: "cat-motion", label: "定时报表", en: "REPORTS", pageTitle: "数据分析 / 定时报表", pageSub: "自动汇总并按周投递的指标简报。", cards: ["周报模板", "订阅人群", "历史快照"] },
        ],
      },
      { id: "favorites", label: "团队成员", en: "MEMBERS", group: "primary", icon: "user", pageTitle: "团队成员 · 权限矩阵", pageSub: "组织与角色配置清晰归类，不和业务报表混排。", cards: ["管理员", "研发角色", "只读访客"] },
      { id: "settings", label: "账单订阅", en: "BILLING", group: "primary", icon: "bookmark", pageTitle: "账单订阅 · 额度用量", pageSub: "按月结算与配额预警，归入次级管理组。", cards: ["当月账单", "调用配额", "发票记录"] },
      { id: "profile", label: "安全审计", en: "AUDIT LOG", group: "primary", icon: "gear", pageTitle: "安全审计 · 操作追踪", pageSub: "合规记录与密钥轮换，低频但需稳定入口。", cards: ["登录日志", "密钥状态", "风控策略"] },
      { id: "help", label: "开发文档", en: "API DOCS", group: "utility", icon: "help", pageTitle: "开发文档 · 接口索引", pageSub: "分隔线下方提供文档与工单入口。", cards: ["快速上手", "错误码表", "提交工单"] },
    ],
    extraPool: [
      { id: "ex-history", label: "部署流水", en: "PIPELINES", group: "secondary", icon: "clock", pageTitle: "部署流水", pageSub: "构建队列与灰度发布状态。", cards: ["生产环境", "预发环境", "回滚快照"] },
      { id: "ex-notes", label: "Webhook", en: "WEBHOOKS", group: "secondary", icon: "doc", pageTitle: "Webhook 管理", pageSub: "事件回调地址与重试策略。", cards: ["事件源", "重试队列", "签名校验"] },
      { id: "ex-offline", label: "存储桶", en: "STORAGE", group: "secondary", icon: "box", pageTitle: "对象存储", pageSub: "静态资源与备份归档管理。", cards: ["媒体库", "日志桶", "生命周期"] },
      { id: "ex-lab", label: "环境变量", en: "ENV VARS", group: "utility", icon: "spark", pageTitle: "环境变量", pageSub: "按环境隔离的加密配置项。", cards: ["生产密文", "测试变量", "变更记录"] },
      { id: "ex-team", label: "插件市场", en: "PLUGINS", group: "secondary", icon: "layers", pageTitle: "插件市场", pageSub: "第三方监控与通知集成。", cards: ["已装扩展", "告警通道", "推荐工具"] },
      { id: "ex-changelog", label: "配额申请", en: "QUOTAS", group: "utility", icon: "list", pageTitle: "配额申请", pageSub: "并发上限与带宽扩容记录。", cards: ["当前上限", "审批进度", "历史记录"] },
      { id: "ex-shortcuts", label: "状态页", en: "STATUS", group: "utility", icon: "key", pageTitle: "服务状态页", pageSub: "各区域节点可用性监测。", cards: ["华东节点", "海外节点", "历史事故"] },
      { id: "ex-about", label: "合规证书", en: "COMPLIANCE", group: "utility", icon: "info", pageTitle: "合规证书", pageSub: "安全认证与数据驻留说明。", cards: ["ISO 报告", "隐私协议", "数据驻留"] },
    ],
    deepTrail: ["数据分析", "自定义报表", "区域下钻", "明细表"],
  },

  commerce: {
    id: "commerce",
    name: "移动商城分类",
    short: "商城分类",
    brand: "器物市集",
    brandEn: "CURATED MARKET",
    accentLabel: "多品类移动导购",
    baseItems: [
      { id: "overview", label: "首页精选", en: "FEATURED", group: "primary", icon: "home", pageTitle: "首页精选 · 季节好物", pageSub: "在 375px 手机屏上收起抽屉后，商品大图与双列瀑布流获得完整呼吸感。", cards: ["秋季上新", "匠人专访", "限时礼盒"] },
      { id: "discover", label: "热销榜单", en: "TRENDING", group: "primary", icon: "compass", pageTitle: "热销榜单 · 口碑甄选", pageSub: "高复购单品与编辑推荐，方便老客一键直达。", cards: ["本周榜首", "百元好物", "复购之选"] },
      {
        id: "categories",
        label: "全部分类",
        en: "SHOP ALL",
        group: "primary",
        icon: "grid",
        hasChildren: true,
        pageTitle: "全部分类 · 品类导览",
        pageSub: "十几条细分类目无法塞进底部 4 个图标，通过侧滑抽屉分组折叠刚好合适。",
        cards: ["桌面器物", "声学数码", "轻量户外"],
        children: [
          { id: "cat-framework", label: "桌面器物", en: "DESKWARE", pageTitle: "分类 / 桌面器物", pageSub: "陶瓷、黄铜与实木文房日常。", cards: ["手冲器具", "台灯照明", "收纳托盘"] },
          { id: "cat-grid", label: "声学数码", en: "AUDIO", pageTitle: "分类 / 声学数码", pageSub: "便携音箱、耳机与桌搭配件。", cards: ["蓝牙音箱", "降噪耳机", "编织线材"] },
          { id: "cat-motion", label: "轻量户外", en: "OUTDOOR", pageTitle: "分类 / 轻量户外", pageSub: "城市通勤背包与露营器具。", cards: ["防水双肩", "钛金属杯", "折叠桌椅"] },
        ],
      },
      { id: "favorites", label: "心愿清单", en: "WISHLIST", group: "primary", icon: "bookmark", pageTitle: "心愿清单 · 降价提醒", pageSub: "收藏过的单品与补货动态。", cards: ["已降价", "库存紧张", "礼单分享"] },
      { id: "settings", label: "我的订单", en: "ORDERS", group: "primary", icon: "gear", pageTitle: "我的订单 · 物流追踪", pageSub: "待收货、售后与电子发票入口。", cards: ["配送中", "待评价", "发票抬头"] },
      { id: "profile", label: "会员权益", en: "MEMBER", group: "primary", icon: "user", pageTitle: "会员权益 · 积分中心", pageSub: "礼券、运费卡与生日礼遇。", cards: ["可用礼券", "积分兑换", "专属客服"] },
      { id: "help", label: "客服与售后", en: "SUPPORT", group: "utility", icon: "help", pageTitle: "客服与售后", pageSub: "尺码指引、退换政策与在线顾问。", cards: ["退换说明", "配送范围", "联系顾问"] },
    ],
    extraPool: [
      { id: "ex-history", label: "浏览足迹", en: "RECENT", group: "secondary", icon: "clock", pageTitle: "浏览足迹", pageSub: "最近看过的单品回溯。", cards: ["今天看过", "本周对比", "相似推荐"] },
      { id: "ex-notes", label: "品牌馆", en: "BRANDS", group: "secondary", icon: "doc", pageTitle: "独立品牌馆", pageSub: "按工作室字母检索合作品牌。", cards: ["本土器物", "北欧灯具", "东京文具"] },
      { id: "ex-offline", label: "线下门店", en: "STORES", group: "secondary", icon: "box", pageTitle: "线下体验店", pageSub: "预约试听与到店自提网点。", cards: ["上海安福", "北京三里", "深圳南山"] },
      { id: "ex-lab", label: "企业定制", en: "GIFTS", group: "utility", icon: "spark", pageTitle: "企业礼赠定制", pageSub: "批量刻字与礼盒包装方案。", cards: ["定制流程", "起订门槛", "样品申请"] },
      { id: "ex-team", label: "晒单社区", en: "REVIEWS", group: "secondary", icon: "layers", pageTitle: "买家晒单社区", pageSub: "真实桌搭与长期使用反馈。", cards: ["精华测评", "桌面实拍", "保养心得"] },
      { id: "ex-changelog", label: "礼品卡", en: "GIFT CARD", group: "utility", icon: "list", pageTitle: "电子礼品卡", pageSub: "即买即赠的心意储值卡。", cards: ["选购面额", "绑定卡片", "余额查询"] },
      { id: "ex-shortcuts", label: "旧物回收", en: "RECYCLE", group: "utility", icon: "key", pageTitle: "旧物焕新计划", pageSub: "闲置器物折抵与翻新流转。", cards: ["回收范围", "估值标准", "环保账单"] },
      { id: "ex-about", label: "隐私与条款", en: "LEGAL", group: "utility", icon: "info", pageTitle: "隐私与服务条款", pageSub: "交易规范与用户信息保护。", cards: ["用户协议", "隐私政策", "资质公示"] },
    ],
    deepTrail: ["全部分类", "桌面器物", "手冲器具", "陶瓷滤杯"],
  },
};

export const MODES = {
  modal: { id: "modal", label: "覆盖 Modal", short: "覆盖", desc: "浮于内容之上配暗层遮罩，不挤正文，选完即收" },
  push: { id: "push", label: "推挤 Push", short: "推挤", desc: "拉开时把主区整块向右顶出，窄屏会压断内容" },
  rail: { id: "rail", label: "迷你轨 Rail", short: "迷你轨", desc: "平时收成 68px 图标窄轨，需要时再滑出完整标签" },
  permanent: { id: "permanent", label: "常驻 Standard", short: "常驻", desc: "宽屏下长期固定在左侧并排，零额外点击步数" },
};

export const VIEWPORT_PRESETS = [
  { id: "mobile", label: "手机 375px", short: "手机", width: 375 },
  { id: "tablet", label: "平板 768px", short: "平板", width: 768 },
  { id: "desktop", label: "桌面 1120px", short: "桌面", width: 1120 },
];

// 开场默认：0/4 四重复合错态（绝不先给答案！）
export const BAD_START = {
  context: "poster",
  viewport: 375,
  mode: "push",
  drawerWidth: 342,
  openProgress: 1,
  scrim: false,
  grouped: false,
  depth: 3,
  itemCount: 13,
  showActive: false,
  activeId: "overview",
  expandedGroup: true,
};

// 多组合法解（均达 4/4，证明导航抽屉没有唯一死板配置）
export const VALID_SOLUTIONS = {
  mobileModal: {
    id: "mobileModal",
    label: "移动覆层解",
    note: "375px 手机 + 覆层暗遮罩 + 276px 留 99px 退场缝 + 7 项清晰分组",
    patch: {
      viewport: 375,
      mode: "modal",
      drawerWidth: 276,
      openProgress: 1,
      scrim: true,
      grouped: true,
      depth: 2,
      itemCount: 7,
      showActive: true,
      expandedGroup: true,
    },
  },
  tabletRail: {
    id: "tabletRail",
    label: "平板迷你轨解",
    note: "768px 平板 + 68px↔256px 迷你轨 + 8 项分组 + 随时呼出",
    patch: {
      viewport: 768,
      mode: "rail",
      drawerWidth: 256,
      openProgress: 1,
      scrim: true,
      grouped: true,
      depth: 2,
      itemCount: 8,
      showActive: true,
      expandedGroup: false,
    },
  },
  desktopStandard: {
    id: "desktopStandard",
    label: "桌面常驻解",
    note: "1120px 宽屏 + 260px 常驻侧抽屉 + 主区占 77% + 零隐藏点击",
    patch: {
      viewport: 1120,
      mode: "permanent",
      drawerWidth: 260,
      openProgress: 1,
      scrim: false,
      grouped: true,
      depth: 2,
      itemCount: 9,
      showActive: true,
      expandedGroup: true,
    },
  },
};

// 双向试错反例（帮助读者故意破坏体验，验证单真源读数敏感度）
export const FAIL_PRESETS = {
  blockedPeek: {
    id: "blockedPeek",
    label: "吞掉退场缝",
    patch: { viewport: 375, mode: "modal", drawerWidth: 350, openProgress: 1, scrim: false, grouped: true, depth: 2, itemCount: 7, showActive: true },
  },
  desktopHidden: {
    id: "desktopHidden",
    label: "宽屏藏汉堡",
    patch: { viewport: 1120, mode: "modal", drawerWidth: 260, openProgress: 1, scrim: true, grouped: true, depth: 1, itemCount: 4, showActive: true },
  },
  deepMaze: {
    id: "deepMaze",
    label: "四层深迷宫",
    patch: { viewport: 375, mode: "modal", drawerWidth: 268, openProgress: 1, scrim: true, grouped: false, depth: 4, itemCount: 10, showActive: false, expandedGroup: true },
  },
  junkCloset: {
    id: "junkCloset",
    label: "15 项杂物间",
    patch: { viewport: 768, mode: "modal", drawerWidth: 260, openProgress: 1, scrim: true, grouped: false, depth: 2, itemCount: 15, showActive: true },
  },
};

export function createInitialState() {
  return { ...BAD_START };
}

export function getItemsForState(state) {
  const ctx = CONTEXTS[state.context] || CONTEXTS.poster;
  const count = Math.max(3, Math.min(15, Math.round(state.itemCount)));
  const pool = [...ctx.baseItems, ...ctx.extraPool];
  // 保证「分类」与「帮助与反馈」在 >=5 项时尽量保留真实原海报质感
  if (count <= ctx.baseItems.length) {
    if (count <= 4) {
      return ctx.baseItems.slice(0, count);
    }
    const core = ctx.baseItems.slice(0, count - 1);
    const help = ctx.baseItems[ctx.baseItems.length - 1];
    return [...core, help];
  }
  const primaries = ctx.baseItems.slice(0, -1);
  const help = ctx.baseItems[ctx.baseItems.length - 1];
  const extras = ctx.extraPool.slice(0, count - ctx.baseItems.length);
  return [...primaries, ...extras, help];
}

export function findActivePage(state) {
  const ctx = CONTEXTS[state.context] || CONTEXTS.poster;
  const items = getItemsForState(state);
  for (const it of items) {
    if (it.id === state.activeId) return { item: it, parent: null };
    if (it.children) {
      for (const ch of it.children) {
        if (ch.id === state.activeId) return { item: ch, parent: it };
      }
    }
  }
  return { item: items[0], parent: null };
}

export function deviceClass(viewport) {
  if (viewport < 600) return { id: "mobile", label: "手机窄屏", short: "手机" };
  if (viewport < 960) return { id: "tablet", label: "平板中屏", short: "平板" };
  return { id: "desktop", label: "桌面宽屏", short: "桌面" };
}

// 核心单真源评估：所有数值由几何参数实算，绝无写死常量
export function evaluate(state) {
  const vw = Math.max(320, Math.min(1280, Math.round(state.viewport)));
  const rawW = Math.max(140, Math.min(360, Math.round(state.drawerWidth)));
  const effDrawerW = Math.min(rawW, Math.round(vw * 0.94));
  const open = state.mode === "permanent" ? 1 : Math.max(0, Math.min(1, state.openProgress));
  const railW = 68;
  const shownW =
    state.mode === "rail"
      ? Math.round(railW + (effDrawerW - railW) * open)
      : Math.round(effDrawerW * open);

  // 主区物理净宽（展开态 & 收起态）
  const isInline = state.mode === "permanent" || state.mode === "push";
  const openMainW = isInline ? Math.max(0, vw - effDrawerW) : vw;
  const liveMainW = isInline ? Math.max(0, vw - shownW) : state.mode === "rail" ? vw - railW : vw;
  const closedMainW = state.mode === "permanent" ? Math.max(0, vw - effDrawerW) : state.mode === "rail" ? vw - railW : vw;
  const peekW = Math.max(0, vw - effDrawerW); // 展开时右侧暴露出的可点击退场区宽度
  const widthPct = Math.round((effDrawerW / vw) * 100);
  const mainSharePct = Math.round((openMainW / vw) * 100);
  const releasedPct = Math.round((closedMainW / vw) * 100);
  const dev = deviceClass(vw);
  const items = getItemsForState(state);
  const itemCount = items.length;
  const depth = Math.max(1, Math.min(4, Math.round(state.depth)));

  const issues = [];
  const addIssue = (code, dim, severity, shortTag, headline, why, fix) => {
    issues.push({ code, dim, severity, shortTag, headline, why, fix });
  };

  // --- 维度 1：拓展空间 EXPAND（物理宽度、主区净空与退场安全缝） ---
  if (isInline && openMainW < 340) {
    addIssue(
      "mode-squeeze",
      "expand",
      100,
      `主区仅剩 ${openMainW}px`,
      `在 ${vw}px ${dev.short}上用「${MODES[state.mode].short}」模式，把主内容压扁到只剩 ${openMainW}px`,
      `推挤或常驻模式会直接吃掉主区横向空间。现在 ${effDrawerW}px 抽屉一拉开，正文只剩 ${openMainW}px（占 ${mainSharePct}%），卡片和段落被迫折断成竖条，完全失去「隐藏释放主区」的意义。`,
      vw < 720
        ? "先把模式切到「覆盖 Modal」（或把视口切到桌面 1120px），再把抽屉宽收到 250–290px。"
        : "把抽屉宽度向左拉回到 240–280px，或者切到「迷你轨 / 覆盖」模式留足主区。"
    );
  }
  if ((state.mode === "modal" || state.mode === "rail") && vw < 700 && peekW < 56) {
    addIssue(
      "drawer-too-wide",
      "expand",
      92,
      `退场缝 ${peekW}px`,
      `抽屉拉到 ${effDrawerW}px（占屏 ${widthPct}%），右侧只剩 ${peekW}px 退场缝`,
      `Material Design 3 建议窄屏模态抽屉右侧至少留出 56dp 的露边与暗层，让人一眼认出「下面还是刚才的页面」并能顺手点空白处收回。现在只剩 ${peekW}px，手指很容易点偏或误以为跳到了新页面。`,
      `在画布里向左拖玫瑰粉抽屉边条，把宽度收到 ${Math.min(290, vw - 68)}px 以下，给右侧腾出 ≥ 56px 的安全退场缝。`
    );
  }
  if (isInline && effDrawerW > vw * 0.42 && openMainW >= 340) {
    addIssue(
      "drawer-overweight",
      "expand",
      76,
      `抽屉占 ${widthPct}%`,
      `抽屉占去整屏的 ${widthPct}%（${effDrawerW}px），反客为主压过内容`,
      `侧边抽屉是服务内容的交通线，宽屏常驻通常控制在 220–300px（经验值，不超过视口 32%）。现在抽屉太胖，留白虚胖却抢走了主内容视野。`,
      "向左拖抽屉边条，把宽度压回 236–288px 区间。"
    );
  }
  if (effDrawerW < 192) {
    addIssue(
      "drawer-too-narrow",
      "expand",
      82,
      `过窄 ${effDrawerW}px`,
      `抽屉被压到 ${effDrawerW}px，中英导航标签开始截断挤压`,
      `完整导航抽屉需同时承载图标、中文标签与二级箭头；宽度跌破 192px 后文字挤撞截断，若真想收窄，应切到「迷你轨 Rail」只露 68px 图标。`,
      "向右拉宽玫瑰粉边条到 232–296px，或切换为「迷你轨 Rail」模式。"
    );
  }

  // --- 维度 2：高效访问 ACCESS（模式与屏宽匹配、遮罩闭环、入口门槛） ---
  if (itemCount <= 4) {
    addIssue(
      "too-few-entries",
      "access",
      84,
      `仅 ${itemCount} 项入口`,
      `全站只有 ${itemCount} 个入口，却藏进导航抽屉平白多花一步点击`,
      `NN/g（2016，179 人实测）证实：把少量高频主入口藏在抽屉里会大幅拉低可发现性并拖慢任务。3–4 个平级入口在手机更适合底部导航（264），在桌面更适合顶部导航（262）。`,
      "把入口数量增至 6–10 项体验抽屉真正擅长的中大型信息架构；若项目天生只有 4 项，请别用抽屉。"
    );
  }
  if (vw >= 1024 && state.mode === "modal" && itemCount <= 6) {
    addIssue(
      "desktop-hidden-few",
      "access",
      86,
      "宽屏藏汉堡",
      `${vw}px 宽屏空间充裕，却把 ${itemCount} 个主入口硬藏进覆层汉堡`,
      `桌面宽屏横向有的是地方，把寥寥几个核心频道折进抽屉只会逼用户每次先找按钮再点开，既隐蔽又低效（Luke Wroblewski 称此为「看不见即不存在」）。`,
      "在宽屏下切到「常驻 Standard」或「迷你轨 Rail」，让导航与内容并排工作。"
    );
  }
  if (state.mode === "permanent" && vw < 840 && openMainW >= 340) {
    addIssue(
      "narrow-permanent",
      "access",
      78,
      "中屏锁死常驻",
      `${vw}px 中等屏幕锁死常驻抽屉，无法临时收起释放阅读宽`,
      `768px 左右的平板竖屏常驻 240px+ 抽屉会固定吃掉近三分之一宽度。改用「迷你轨 Rail」或「覆盖 Modal」，平时只占 0–68px，需要切频道再展开。`,
      "切到「迷你轨 Rail」或「覆盖 Modal」，把主动权还给内容。"
    );
  }
  if ((state.mode === "modal" || (state.mode === "push" && vw < 900)) && !state.scrim) {
    addIssue(
      "no-scrim",
      "access",
      88,
      "缺暗层遮罩",
      `侧滑抽屉未压暗背景（Scrim 关），层次糊连且点击退场暗示缺失`,
      `在中小屏临时呼出抽屉却没有半透明暗层托底，抽屉文字和主区卡片在同一亮度层打架，用户既容易误触背后按钮，也看不出「点右侧暗处就能关抽屉」。`,
      "打开「暗层遮罩 Scrim」开关，立马拉开前抽屉与后内容的景深层次。"
    );
  }

  // --- 维度 3：层级清晰 LAYERING（分组分隔、深度上限、当前位置高亮） ---
  if (depth >= 3) {
    addIssue(
      "too-deep",
      "layering",
      90,
      `${depth} 层深嵌套`,
      `抽屉里塞进 ${depth} 层嵌套子菜单，窄栏缩进撞墙、方向感瓦解`,
      `Apple HIG 建议侧栏/抽屉层级不超过 2 层。超过 2 层后，每层缩进都在吞噬宝贵字宽，用户点到第 ${depth} 层时已经忘了自己属于哪个主频道。`,
      "把「层级深度」压回到 2 层以内（一级主干 + 可展开二级子项），更深内容交给页面内面包屑或标签页。"
    );
  }
  if (!state.grouped && itemCount >= 7) {
    addIssue(
      "no-grouping",
      "layering",
      85,
      `${itemCount} 项无分组`,
      `${itemCount} 条入口一字排开无分组分隔，核心频道与帮助设置混成字墙`,
      `原海报把 6 项核心功能与「帮助与反馈」用一道细横线隔开。当入口达到 7 项以上却不分组，眼睛每次打开都要从头逐行扫描，认知负荷成倍上升。`,
      "开启「逻辑分组与细线」，用组标题和细横线切开主流程与系统辅助项。"
    );
  }
  if (!state.showActive) {
    addIssue(
      "no-active",
      "layering",
      80,
      "缺当前高亮",
      `抽屉里没有高亮「当前所在页」，切页后用户丢失空间坐标`,
      `就像原海报给「概览」铺满一整条玫瑰粉选中带，明确的高亮状态能回答「我现在在哪」。关掉高亮后，重新拉开抽屉会一瞬间茫然。`,
      "打开「当前项高亮」，让选中的目的地在酒红底上立刻跳出来。"
    );
  }

  // --- 维度 4：灵活扩展 FLEXIBILITY（容量区间与结构弹性） ---
  if (itemCount >= 13) {
    addIssue(
      "overload-items",
      "flexibility",
      83,
      `塞满 ${itemCount} 项`,
      `顶层硬塞 ${itemCount} 个入口，抽屉沦为「没地放就往里扔」的杂物间`,
      `导航抽屉虽比顶栏更能装，但也并非无底洞。超过 12 个顶层条目会让抽屉首屏溢出滚动，次级入口彻底淹没在折线以下。`,
      "把低频条目收归二级折叠组或页面设置，将一级入口控制在 6–11 项（经验值）。"
    );
  } else if (itemCount <= 4) {
    addIssue(
      "underused-capacity",
      "flexibility",
      60,
      `容量闲置`,
      `仅 ${itemCount} 项条目占不满抽屉三分之一，纵向扩展能力完全闲置`,
      `抽屉的价值在于平滑承载 6–12 项多组路径并预留扩展位；只有三四项时整条侧栏大片空洞。`,
      "增加到 6–10 项观察抽屉的分组承载力，或在实际项目里换用底栏/顶栏。"
    );
  }

  // 按严重度排序，锁定第一主病因
  issues.sort((a, b) => b.severity - a.severity);

  const dims = {
    expand: { ok: true, badge: `主区 ${state.mode === "modal" ? `退场缝 ${peekW}px` : `${mainSharePct}%`}`, detail: "" },
    access: { ok: true, badge: `${MODES[state.mode].short} · ${dev.short}`, detail: "" },
    layering: { ok: true, badge: `${depth} 层 · ${state.grouped ? "已分组" : "单组"}`, detail: "" },
    flexibility: { ok: true, badge: `${itemCount} 项容量`, detail: "" },
  };

  for (const key of Object.keys(dims)) {
    const hit = issues.find((i) => i.dim === key);
    if (hit) {
      dims[key].ok = false;
      dims[key].badge = hit.shortTag;
      dims[key].detail = hit.headline;
    }
  }

  const score = Object.values(dims).filter((d) => d.ok).length;

  // 估算一次跨频道任务步数与认知负荷档位（明确为模型示意，不伪装成实测精准毫秒）
  const openStep = state.mode === "permanent" ? 0 : 1;
  const subStep = depth >= 2 ? 1 : 0;
  const extraTrap = (state.mode === "modal" && peekW < 56 ? 1 : 0) + (depth >= 3 ? depth - 2 : 0);
  const taps = openStep + 1 + subStep + extraTrap;

  let loadTier = "轻快";
  if (score <= 1) loadTier = "阻塞";
  else if (score === 2) loadTier = "偏重";
  else if (score === 3) loadTier = "轻阻";

  // 识别当前命中的合法解名称
  let solutionName = "";
  if (score === 4) {
    if (vw < 600 && state.mode === "modal") solutionName = "移动覆层经典解";
    else if (state.mode === "rail") solutionName = "平板迷你轨弹性解";
    else if (state.mode === "permanent" && vw >= 840) solutionName = "桌面常驻高效解";
    else solutionName = "平衡自适应解";
  }

  let headline, why, fix;
  if (score === 4) {
    headline = `四项全部成立 · 已达成「${solutionName}」`;
    why =
      state.mode === "permanent"
        ? `${vw}px 宽屏下常驻 ${effDrawerW}px 酒红抽屉，主内容稳占 ${mainSharePct}%（${openMainW}px），零额外点击即可扫清 ${itemCount} 项分组路径与当前坐标。`
        : state.mode === "rail"
        ? `${vw}px 屏幕平时只留 68px 图标窄轨（归还 ${releasedPct}% 主区宽），需要跨频道时滑展至 ${effDrawerW}px 显示完整 ${depth} 层分组，兼顾效率与视野。`
        : `${vw}px 屏宽收起抽屉时主内容独享 100% 宽度；拉开 ${effDrawerW}px 覆层配暗层遮罩，右侧稳留 ${peekW}px 安全退场缝，${itemCount} 项分组清晰且当前页高亮明确。`;
    fix = "试试把视口切到其它设备尺寸、故意拉宽到 350px 吞掉退场缝，或按 Space 演播一次跨频道寻路。";
  } else {
    const top = issues[0];
    headline = top.headline;
    why = top.why;
    fix = top.fix;
  }

  return {
    vw,
    effDrawerW,
    shownW,
    open,
    openMainW,
    liveMainW,
    closedMainW,
    peekW,
    widthPct,
    mainSharePct,
    releasedPct,
    dev,
    items,
    itemCount,
    depth,
    score,
    dims,
    issues,
    taps,
    loadTier,
    solutionName,
    headline,
    why,
    fix,
  };
}
