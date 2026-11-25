// 280 树形浏览布局 · 单一真源数据与诊断模型
// 所有开场树形节点、层级深度、缩进截字实算、展开占比、四维诊单与六节实验数据均由此模块统一算出。

export const POSTER_PALETTE = {
  paper: "#F8F7F1",
  ivory: "#FCFBF7",
  mist: "#EDF3EE",
  card: "#EEF3EF",
  band: "#E4ECE7",
  selected: "#E0F0E6",
  halo: "#DAEDE5",
  line: "#CADBD4",
  dots: "#AFD3C9",
  ink: "#022D3C",
  inkMuted: "#3E5C64",
  chrome: "#01333F",
  footer: "#003E48",
  darkRoom: "#052834",
  darkCard: "#0B3947",
  teal: "#0A968F",
  tealBright: "#00AAA2",
  tealText: "#0A6E6B",
  mintBright: "#5CE0D2",
  err: "#C43E2F",
  errSoft: "#FBECE9",
  errDark: "#FF8E7E",
  warn: "#A66316",
};

// 原海报 280 真实「知识库 Knowledge Base」节点词典（清晰命名 / 模糊编号 / 冗长句子三套同源）
export const NODE_META = {
  root: {
    id: "root",
    kind: "root",
    zh: "知识库",
    en: "Knowledge Base",
    cryptic: "总目录 00",
    crypticEn: "DIR-00",
    verbose: "全公司产品研发运营与项目管理的统一文档知识总库",
    count: 61,
    desc: "整棵树的起点（根节点），界定知识库收录的全部团队协作与规范范围。",
    tags: ["产品设计", "开发文档", "运营资料", "项目管理"],
  },
  design: {
    id: "design",
    kind: "folder",
    zh: "产品设计",
    en: "Product Design",
    cryptic: "分类 A",
    crypticEn: "CAT-A",
    verbose: "包含产品交互视觉设计原则与界面组件规范的合集目录",
    count: 12,
    desc: "沉淀界面设计原则、排版栅格与跨端组件资产，保证体验一致。",
    tags: ["设计原则", "组件库", "栅格系统"],
  },
  principles: {
    id: "principles",
    kind: "doc",
    zh: "设计原则",
    en: "Design Principles",
    cryptic: "条目 A-1",
    crypticEn: "ITEM-A1",
    verbose: "关于界面清晰性一致性与反馈及时性的五项基础设计准则",
    count: 5,
    desc: "清晰、克制、可预期：指导信息架构、留白节奏与微交互判断。",
    tags: ["视觉层级", "留白秩序", "无障碍对比", "状态明确", "一致性"],
  },
  wrap1: {
    id: "wrap1",
    kind: "folder",
    redundant: true,
    zh: "体系规范",
    en: "System Specs (冗余空壳)",
    cryptic: "过渡层 A-2",
    crypticEn: "WRAP-1",
    verbose: "仅用于包裹下级界面资产目录的一层无额外同级项空壳分类",
    count: 18,
    desc: "单子冗余中间层：下面只挂着「界面资产」1 个子目录，凭空多出一次点击。",
    tags: ["单子空壳", "可合并"],
  },
  wrap2: {
    id: "wrap2",
    kind: "folder",
    redundant: true,
    zh: "界面资产",
    en: "UI Assets (冗余空壳)",
    cryptic: "过渡层 A-2-1",
    crypticEn: "WRAP-2",
    verbose: "仅用于再套一层组件库目录导致层级加深到六层的冗余目录",
    count: 18,
    desc: "第二层单子空壳：直接把「组件库」压到第 5 层，子组件滑落第 6 层。",
    tags: ["单子空壳", "可合并"],
  },
  components: {
    id: "components",
    kind: "folder",
    zh: "组件库",
    en: "Component Library",
    cryptic: "子集 A-2",
    crypticEn: "SUB-A2",
    verbose: "收录各类可复用的界面组件统一规范提升设计与开发效率库",
    count: 18,
    desc: "收录各类可复用的界面组件，统一规范，提升设计与开发效率。",
    childrenPreview: [
      { id: "basic", label: "基础组件", count: 8 },
      { id: "form", label: "表单组件", count: 6 },
      { id: "nav", label: "导航组件", count: 4 },
    ],
    tags: ["基础组件", "表单组件", "导航组件"],
  },
  basic: {
    id: "basic",
    kind: "doc",
    zh: "基础组件",
    en: "Basic Components",
    cryptic: "节点 01",
    crypticEn: "NODE-01",
    verbose: "包含按钮图标分割线标签徽章等高频原子级界面基础组件说明",
    count: 8,
    desc: "按钮、图标、标签、徽章与排版原子规范，构成所有页面的最小积木。",
    subItems: [
      { label: "按钮与幽灵态", count: 3 },
      { label: "图标尺寸与描边", count: 3 },
      { label: "徽章与胶囊", count: 2 },
    ],
    leafDetail: {
      title: "主按钮",
      en: "Primary Button",
      desc: "区分主操作、次操作与危险操作，保证焦点框与最小 40px 点击热区。",
      tags: ["主按钮", "次按钮", "禁用态", "加载态"],
      total: 3,
    },
  },
  form: {
    id: "form",
    kind: "doc",
    zh: "表单组件",
    en: "Form Components",
    cryptic: "节点 02",
    crypticEn: "NODE-02",
    verbose: "包含输入选择开关等表单相关组件适配多场景表单填写与校验",
    count: 6,
    desc: "包含输入、选择、开关等表单相关组件，适配多场景表单需求。",
    subItems: [
      { label: "输入框", count: 3 },
      { label: "选择器", count: 2 },
      { label: "开关与复选框", count: 1 },
    ],
    leafDetail: {
      title: "输入框",
      en: "Input Field",
      desc: "支持单行、多行及带校验的输入组件，覆盖常见表单输入场景。",
      tags: ["单行输入", "多行输入", "带清除", "带校验"],
      total: 3,
    },
  },
  nav: {
    id: "nav",
    kind: "doc",
    zh: "导航组件",
    en: "Navigation Components",
    cryptic: "节点 03",
    crypticEn: "NODE-03",
    verbose: "涵盖面包屑标签页树形目录与步骤条等跨页面定位导航组件",
    count: 4,
    desc: "面包屑、标签栏、树形目录与抽屉导航，帮助用户随时看清当前位置。",
    subItems: [
      { label: "面包屑路径", count: 2 },
      { label: "侧栏树目录", count: 1 },
      { label: "分页与步骤条", count: 1 },
    ],
    leafDetail: {
      title: "面包屑路径",
      en: "Breadcrumb Trail",
      desc: "用简短路径交代祖先层级，让窄屏或深层跳转后依然能一键返回上级。",
      tags: ["路径截断", "可点击返回", "当前项锁定"],
      total: 2,
    },
  },
  dev: {
    id: "dev",
    kind: "folder",
    zh: "开发文档",
    en: "Development",
    cryptic: "分类 B",
    crypticEn: "CAT-B",
    verbose: "包含前后端接口协议工程构建脚本与无障碍键盘约定开发手册",
    count: 24,
    desc: "接口协议、构建脚本与组件代码规范，供研发按模块检索。",
    childrenPreview: [
      { id: "api", label: "接口契约", count: 10 },
      { id: "fe", label: "前端工程", count: 14 },
    ],
  },
  api: {
    id: "api",
    kind: "doc",
    zh: "接口契约",
    en: "API Contracts",
    cryptic: "节点 B-1",
    crypticEn: "NODE-B1",
    verbose: "前后端联调用的统一请求字段错误码与分页返回格式标准文档",
    count: 10,
    desc: "统一请求签名、分页结构与错误码约定，减少前后端联调歧义。",
    subItems: [
      { label: "鉴权与令牌", count: 4 },
      { label: "列表分页规范", count: 3 },
      { label: "错误码字典", count: 3 },
    ],
    leafDetail: {
      title: "错误码字典",
      en: "Error Schema",
      desc: "按模块段号归类业务报错，附带可面向用户展示的简明提示文案。",
      tags: ["4xx 校验", "5xx 重试", "字段定位"],
      total: 3,
    },
  },
  fe: {
    id: "fe",
    kind: "doc",
    zh: "前端工程",
    en: "Frontend Guide",
    cryptic: "节点 B-2",
    crypticEn: "NODE-B2",
    verbose: "涵盖代码目录组织无障碍语义角色与前端性能优化清单的手册",
    count: 14,
    desc: "组件无障碍语义、键盘游走焦点与打包体积预算的工程细则。",
    subItems: [
      { label: "WAI-ARIA 约定", count: 6 },
      { label: "构建与性能", count: 8 },
    ],
    leafDetail: {
      title: "WAI-ARIA 树模式",
      en: "ARIA Tree Pattern",
      desc: "使用 role=tree 与方向键游走焦点，避免键盘用户连续按 Tab 越过侧栏。",
      tags: ["aria-expanded", "Roving Tabindex", "Home/End"],
      total: 6,
    },
  },
  ops: {
    id: "ops",
    kind: "folder",
    zh: "运营资料",
    en: "Operations",
    cryptic: "分类 C",
    crypticEn: "CAT-C",
    verbose: "汇总日常用户增长实验活动上线检查表与复盘数据的运营资料",
    count: 16,
    desc: "汇总增长实验记录、内容日历与活动复盘，方便跨团队查阅。",
    childrenPreview: [
      { id: "growth", label: "增长手册", count: 9 },
      { id: "campaign", label: "活动复盘", count: 7 },
    ],
  },
  growth: {
    id: "growth",
    kind: "doc",
    zh: "增长手册",
    en: "Growth Playbook",
    cryptic: "节点 C-1",
    crypticEn: "NODE-C1",
    verbose: "记录新手引导转化漏斗与留存召回策略的运营方法论文档集",
    count: 9,
    desc: "新手引导、核心留存指标与渠道归因模板，支持按季度检索。",
    subItems: [
      { label: "新手首日路径", count: 5 },
      { label: "留存拆解模板", count: 4 },
    ],
    leafDetail: {
      title: "新手首日路径",
      en: "Day-1 Onboarding",
      desc: "把首次访问的关键动作压缩在三步内，降低上手时的理解负担。",
      tags: ["渐进引导", "空态提示", "转化节点"],
      total: 5,
    },
  },
  campaign: {
    id: "campaign",
    kind: "doc",
    zh: "活动复盘",
    en: "Campaign Logs",
    cryptic: "节点 C-2",
    crypticEn: "NODE-C2",
    verbose: "按上线时间整理的专题推广活动数据摘要与改进事项归档",
    count: 7,
    desc: "记录历次版本发布与专题推广的目标、过程偏差和后续动作。",
    subItems: [
      { label: "版本发布复盘", count: 4 },
      { label: "专题页表现", count: 3 },
    ],
    leafDetail: {
      title: "版本发布复盘",
      en: "Launch Retro",
      desc: "将素材筹备、触达转化与客服高频问题统一归档，方便下次复用。",
      tags: ["复盘模板", "渠道对比", "问题归档"],
      total: 4,
    },
  },
  pm: {
    id: "pm",
    kind: "folder",
    zh: "项目管理",
    en: "Project Management",
    cryptic: "分类 D",
    crypticEn: "CAT-D",
    verbose: "收录季度路线图里程碑排期与跨组风险登记表的项目管理目录",
    count: 9,
    desc: "季度里程碑、版本节奏与跨团队风险跟踪，保持同步透明。",
    childrenPreview: [
      { id: "milestone", label: "季度里程碑", count: 5 },
      { id: "risk", label: "风险清单", count: 4 },
    ],
  },
  milestone: {
    id: "milestone",
    kind: "doc",
    zh: "季度里程碑",
    en: "Milestones",
    cryptic: "节点 D-1",
    crypticEn: "NODE-D1",
    verbose: "记录本季度各产品线关键交付时间点与依赖关系的进度文档",
    count: 5,
    desc: "关键交付节点、跨团队依赖与验收标准，按季度归档。",
    subItems: [
      { label: "设计系统升级", count: 3 },
      { label: "移动端适配", count: 2 },
    ],
    leafDetail: {
      title: "设计系统升级",
      en: "Design System v2",
      desc: "对齐暗色主题变量、键盘无障碍与组件文档目录结构。",
      tags: ["Q2 交付", "无障碍审计", "文档同步"],
      total: 3,
    },
  },
  risk: {
    id: "risk",
    kind: "doc",
    zh: "风险清单",
    en: "Risk Register",
    cryptic: "节点 D-2",
    crypticEn: "NODE-D2",
    verbose: "跟踪排期阻塞外部依赖延迟与合规审查隐患的风险台账列表",
    count: 4,
    desc: "记录外部依赖、性能隐患与回滚预案，提前暴露潜在卡点。",
    subItems: [
      { label: "技术债与回滚", count: 2 },
      { label: "合规与权限", count: 2 },
    ],
    leafDetail: {
      title: "权限边界核查",
      en: "Access Boundary",
      desc: "确保不同角色的树形目录仅加载有权限查看的分支与计数。",
      tags: ["按权裁枝", "敏感隐藏", "审计留痕"],
      total: 2,
    },
  },
};

// 按 depthMode 生成不同层级深度的真实树结构
export function buildTree(depthMode) {
  const leaf = (id) => ({ id, children: [] });
  const branch = (id, children) => ({ id, children });

  if (depthMode === "flat1") {
    // 1 层全摊平：所有条目直铺在根节点下，失去分类层级
    return branch("root", [
      leaf("principles"),
      leaf("basic"),
      leaf("form"),
      leaf("nav"),
      leaf("api"),
      leaf("fe"),
      leaf("growth"),
      leaf("campaign"),
      leaf("milestone"),
      leaf("risk"),
    ]);
  }

  const compBranch = branch("components", [leaf("basic"), leaf("form"), leaf("nav")]);
  const devBranch = branch("dev", [leaf("api"), leaf("fe")]);
  const opsBranch = branch("ops", [leaf("growth"), leaf("campaign")]);
  const pmBranch = branch("pm", [leaf("milestone"), leaf("risk")]);

  if (depthMode === "wide3") {
    // 3 层扁宽正当解：把组件库提升到二级，整棵树最多 3 层
    return branch("root", [
      branch("design", [leaf("principles")]),
      compBranch,
      devBranch,
      opsBranch,
      pmBranch,
    ]);
  }

  if (depthMode === "poster4") {
    // 4 层原海报标准解：知识库(1) → 产品设计(2) → 组件库(3) → 表单组件(4)
    return branch("root", [
      branch("design", [leaf("principles"), compBranch]),
      devBranch,
      opsBranch,
      pmBranch,
    ]);
  }

  if (depthMode === "nested5") {
    // 5 层（去掉了一层空壳，还剩一层冗余空壳）
    return branch("root", [
      branch("design", [
        leaf("principles"),
        branch("wrap2", [compBranch]),
      ]),
      devBranch,
      opsBranch,
      pmBranch,
    ]);
  }

  // 默认 nested6：6 层套娃（开场错态，夹杂 体系规范 → 界面资产 两层单子冗余空壳）
  return branch("root", [
    branch("design", [
      leaf("principles"),
      branch("wrap1", [branch("wrap2", [compBranch])]),
    ]),
    devBranch,
    opsBranch,
    pmBranch,
  ]);
}

// 递归遍历树，输出带 depth、parentId、ancestorIds、isLast、guides[] 的扁平表
export function flattenTree(root, expandedSet, searchQuery = "") {
  const allNodes = [];
  const byId = new Map();
  const q = searchQuery.trim().toLowerCase();

  function walkAll(node, depth, parentId, ancestors, siblingsCount, indexInParent) {
    const meta = NODE_META[node.id];
    const hasChildren = node.children.length > 0;
    const item = {
      id: node.id,
      meta,
      depth, // 1-based: root = 1
      parentId,
      ancestors,
      hasChildren,
      childCount: node.children.length,
      isLast: indexInParent === siblingsCount - 1,
      posInSet: indexInParent + 1,
      setSize: siblingsCount,
      childrenIds: node.children.map((c) => c.id),
      raw: node,
    };
    allNodes.push(item);
    byId.set(node.id, item);
    node.children.forEach((child, idx) => {
      walkAll(child, depth + 1, node.id, [...ancestors, node.id], node.children.length, idx);
    });
  }
  walkAll(root, 1, null, [], 1, 0);

  // 搜索匹配（保留命中节点的全部祖先路径）
  let matchedIds = null;
  let visibleFilter = null;
  if (q) {
    matchedIds = new Set();
    visibleFilter = new Set();
    for (const item of allNodes) {
      const hay = `${item.meta.zh} ${item.meta.en} ${item.meta.desc || ""} ${(item.meta.tags || []).join(" ")}`.toLowerCase();
      if (hay.includes(q)) {
        matchedIds.add(item.id);
        visibleFilter.add(item.id);
        item.ancestors.forEach((aid) => visibleFilter.add(aid));
      }
    }
  }

  // 计算当前可见行及每列纵线 guides
  const visible = [];
  function walkVisible(node, depth, ancestorContinues) {
    if (visibleFilter && !visibleFilter.has(node.id)) return;
    const item = byId.get(node.id);
    const isExpanded = item.hasChildren && (q ? true : expandedSet.has(node.id));
    visible.push({
      ...item,
      isExpanded,
      matched: matchedIds ? matchedIds.has(node.id) : false,
      guides: ancestorContinues, // boolean[] for ancestor columns
    });
    if (isExpanded) {
      const kids = visibleFilter ? node.children.filter((c) => visibleFilter.has(c.id)) : node.children;
      kids.forEach((child, idx) => {
        const lastKid = idx === kids.length - 1;
        const nextGuides = depth === 1 ? [] : [...ancestorContinues, !lastKid];
        // For children of depth d, mark whether parent's vertical column continues
        walkVisible(child, depth + 1, depth === 1 ? [!lastKid] : [...ancestorContinues, !lastKid]);
      });
    }
  }
  walkVisible(root, 1, []);

  return { allNodes, byId, visible, matchedIds };
}

export function getDisplayLabel(meta, namingMode) {
  if (namingMode === "cryptic") return { zh: meta.cryptic, en: meta.crypticEn };
  if (namingMode === "verbose") return { zh: meta.verbose, en: meta.en };
  return { zh: meta.zh, en: meta.en };
}

// 估算单行树标签在当前容器宽度下是否发生右侧截字（单真源像素算法）
export function measureTruncation(visible, indentPx, namingMode, paneWidth = 440) {
  const effectiveWidth = Math.max(260, paneWidth);
  const clipped = [];
  let worstOverflowPx = 0;

  for (const row of visible) {
    const label = getDisplayLabel(row.meta, namingMode);
    const indentOffset = (row.depth - 1) * indentPx;
    // 左侧边距 + 展开钮(24) + 图标(24) + 间隙(16) + 右侧数量徽与边距(52)
    const chromeW = namingMode === "cryptic" ? 96 : 118;
    const zhPx = label.zh.length * 14.5;
    const needed = indentOffset + chromeW + zhPx;
    const overflow = Math.round(needed - effectiveWidth);
    if (overflow > 0) {
      clipped.push({ id: row.id, zh: label.zh, depth: row.depth, overflow });
      if (overflow > worstOverflowPx) worstOverflowPx = overflow;
    }
  }
  return { clipped, clippedCount: clipped.length, worstOverflowPx };
}

// 初始 0/4 翻车态
export function createBrokenState() {
  const tree = buildTree("nested6");
  const allBranches = new Set();
  const collect = (n) => {
    if (n.children.length) {
      allBranches.add(n.id);
      n.children.forEach(collect);
    }
  };
  collect(tree);
  return {
    depthMode: "nested6",
    indentPx: 4,
    expandedIds: allBranches, // 全树 100% 强制展开
    selectedId: "components",
    namingMode: "cryptic",
    feedbackMode: "blind",
    searchQuery: "",
    spotlightPart: null, // 'root' | 'branch' | 'node' | 'expand' | 'category' | null
    paneWidth: 440,
  };
}

// 原海报理想解（4 层 + 22px 缩进 + 仅展当前路径 + 清晰命名图标 + 克制状态反馈）
export function createPosterIdealState(paneWidth = 440) {
  return {
    depthMode: "poster4",
    indentPx: 22,
    expandedIds: new Set(["root", "design", "components"]),
    selectedId: "components",
    namingMode: "clear",
    feedbackMode: "clear",
    searchQuery: "",
    spotlightPart: null,
    paneWidth,
  };
}

// 3 层扁宽正当解（验证多合法解）
export function createWideIdealState(paneWidth = 440) {
  return {
    depthMode: "wide3",
    indentPx: 20,
    expandedIds: new Set(["root", "components"]),
    selectedId: "components",
    namingMode: "clear",
    feedbackMode: "clear",
    searchQuery: "",
    spotlightPart: null,
    paneWidth,
  };
}

// 核心单真源评测引擎：严格按真实树几何与状态输出 4 维结果 + 主诊单 + 级联三卡
export function evaluateState(state) {
  const tree = buildTree(state.depthMode);
  const { allNodes, byId, visible, matchedIds } = flattenTree(tree, state.expandedIds, state.searchQuery);

  // 确保 selectedId 仍存在于当前拓扑
  const selected = byId.get(state.selectedId) || byId.get("components") || byId.get("form") || allNodes[0];

  const maxDepth = Math.max(...allNodes.map((n) => n.depth));
  const maxVisibleDepth = visible.length ? Math.max(...visible.map((n) => n.depth)) : 1;
  const redundantNodes = allNodes.filter((n) => n.meta.redundant);
  const nonRootBranches = allNodes.filter((n) => n.depth > 1 && n.hasChildren);
  const openNonRootBranches = nonRootBranches.filter((n) => state.expandedIds.has(n.id));
  const rootOpen = state.expandedIds.has("root");
  const visibleCount = visible.length;
  const totalCount = allNodes.length;
  const openRatio = nonRootBranches.length ? openNonRootBranches.length / nonRootBranches.length : 0;

  const { clipped, clippedCount, worstOverflowPx } = measureTruncation(
    visible,
    state.indentPx,
    state.namingMode,
    state.paneWidth
  );

  // 1) 维度一：层级与缩进（深度 2–4 层 且 缩进 14–28px 且 0 截字）
  let hierarchyOk = false;
  let hierarchyTag = "";
  let hierarchyIssue = null;
  if (state.depthMode === "flat1") {
    hierarchyTag = "1 层摊平";
    hierarchyIssue = {
      code: "flat",
      badge: "错态 · 扁平失序",
      title: "全部文档摊成 1 层平表，分类归属消失",
      body: `现在根节点下直接铺了 ${totalCount - 1} 个无分组条目，读者失去「产品设计 / 开发 / 运营」的归类锚点，每次查找都得从头逐行扫读。`,
      action: "把「目录深度」切到「4 层海报」或「3 层扁宽」，让内容恢复合理的父子分组。",
    };
  } else if (maxDepth > 4) {
    hierarchyTag = `${maxDepth} 层套娃`;
    hierarchyIssue = {
      code: "deep",
      badge: "错态 · 套娃过深",
      title: `树深达到 ${maxDepth} 层，越过了 4 层经验上限`,
      body: `中间夹着 ${redundantNodes.length} 层只含单个子目录的冗余空壳（${redundantNodes.map((n) => n.meta.zh).join(" → ")}），找一个表单组件要多点 ${redundantNodes.length} 次，缩进不断右移也挤压了阅读空间。`,
      action: "点击树中标红空壳旁的「↑ 提级合并」，或将「目录深度」切到「4 层海报 / 3 层扁宽」。",
    };
  } else if (state.indentPx < 14) {
    hierarchyTag = `缩进 ${state.indentPx}px 过扁`;
    hierarchyIssue = {
      code: "indent-flat",
      badge: "错态 · 缩进糊成平表",
      title: `每级缩进只有 ${state.indentPx}px，父子行几乎齐平`,
      body: "树形布局靠水平阶梯表达从属关系。缩进小于 14px 时，二级目录和四级文档在左边沿几乎贴成一条直线，视线扫过去分不清谁属于谁。",
      action: "向右拖动顶部的「缩进与层级标尺」（或按 → 键），把每级缩进调入 14–26px 清晰带。",
    };
  } else if (state.indentPx > 28 || clippedCount > 0) {
    hierarchyTag = clippedCount > 0 ? `截字 ${clippedCount} 处` : `缩进 ${state.indentPx}px 过宽`;
    hierarchyIssue = {
      code: "indent-clip",
      badge: "错态 · 右侧梯田截断",
      title:
        clippedCount > 0
          ? `缩进 ${state.indentPx}px 把 ${clippedCount} 个节点挤出右壁（溢出 ${worstOverflowPx}px）`
          : `每级缩进拉到 ${state.indentPx}px，深层节点被推向右侧边缘`,
      body: "缩进不是越大越好。每多一层就累加一次右移，过宽的阶梯会把深层标题挤压截断，强迫用户横向滚动，破坏树形目录的纵向扫读优势。",
      action:
        state.namingMode === "verbose"
          ? "先将节点命名改回「清晰短名」，再把缩进标尺拉回 14–26px 甜区。"
          : "向左拖动顶部「缩进与层级标尺」，将缩进收回 14–26px 且消除右侧截字。",
    };
  } else {
    hierarchyOk = true;
    hierarchyTag = `${maxDepth} 层 · ${state.indentPx}px`;
  }

  // 2) 维度二：按需展开（不可全收失踪，也不可全树倾泻过载）
  let disclosureOk = false;
  let disclosureTag = "";
  let disclosureIssue = null;
  if (!rootOpen || visibleCount <= 1) {
    disclosureTag = "全收仅剩根";
    disclosureIssue = {
      code: "collapsed-all",
      badge: "错态 · 全收失踪",
      title: "连根节点都收起了，用户看不见目录骨架",
      body: "画面里只剩孤零零一个根标题，访客不知道知识库里究竟有哪些一级分类，进入后的第一步就被迫盲点试探。",
      action: "点开根节点前的「+」展开主干，再按需点开 1 条当前查阅的分支。",
    };
  } else if (state.depthMode !== "flat1" && (visibleCount >= 12 || (nonRootBranches.length >= 4 && openNonRootBranches.length >= 4))) {
    disclosureTag = `过载 ${visibleCount} 项`;
    disclosureIssue = {
      code: "expanded-all",
      badge: "错态 · 全树摊开过载",
      title: `同屏强行展开了 ${visibleCount} 个节点，次级内容淹没主干`,
      body: `当前有 ${openNonRootBranches.length}/${nonRootBranches.length} 条分支同时摊开。不相关的开发、运营、项目子项全挤在眼前，用户反而找不到正在看的「产品设计」主线。`,
      action: "点击树中无关分支旁的「−」收起次级目录（或点「按需展开」），让同屏保持在 5–11 项。",
    };
  } else {
    disclosureOk = true;
    disclosureTag = `可见 ${visibleCount}/${totalCount} 项`;
  }

  // 3) 维度三：语义明确（命名清晰 + 图标区分类型）
  let semanticOk = false;
  let semanticTag = "";
  let semanticIssue = null;
  if (state.namingMode === "cryptic") {
    semanticTag = "模糊编号";
    semanticIssue = {
      code: "cryptic",
      badge: "错态 · 信息气味断裂",
      title: "节点全用「分类 A / 节点 02」编号，看不出里面装什么",
      body: "用户逛目录树靠的是标签透出的「信息气味」来预判路径。抽象代号配上统一灰点，让每一次点击都变成盲猜开盒。",
      action: "把「命名与图标」切到「清晰短名+图标」，恢复可一眼识别的业务分类名与容器/文档图标。",
    };
  } else if (state.namingMode === "verbose") {
    semanticTag = "长句拥挤";
    semanticIssue = {
      code: "verbose",
      badge: "错态 · 节点名过长",
      title: "把整段简介塞进目录树，标题反复截断拖垮扫读",
      body: "树节点负责「快速定位」，详细解释应该交给中栏详情卡。把 20 多字长句硬塞进左侧窄树，扫读速度立刻崩塌。",
      action: "把「命名与图标」切到「清晰短名+图标」，节点留 2–6 字短名，把说明留给详情卡。",
    };
  } else if (state.namingMode === "noicon") {
    semanticTag = "缺少图标区分";
    semanticIssue = {
      code: "noicon",
      badge: "错态 · 容器叶子混同",
      title: "去掉了文件夹与文档图标，一眼分不清能不能再展开",
      body: "清一色的文字前缀无法快速区分「分支容器」和「末端文档」，用户只能逐行停下来试探点击。",
      action: "把「命名与图标」切到「清晰短名+图标」，用视觉符号区分根、分支与末端文档。",
    };
  } else {
    semanticOk = true;
    semanticTag = "语义清晰";
  }

  // 4) 维度四：状态反馈（展开符 + 引导线 + 选中高亮 + 级联连线与面包屑）
  let feedbackOk = false;
  let feedbackTag = "";
  let feedbackIssue = null;
  if (state.feedbackMode === "blind") {
    feedbackTag = "盲态无提示";
    feedbackIssue = {
      code: "blind",
      badge: "错态 · 方位与状态盲区",
      title: "藏起了展开符、引导线与选中高亮，点完不知道自己在哪",
      body: "既看不清哪一行能继续展开，也看不出当前选中的是哪个节点，中栏级联详情与树目录彻底断联。",
      action: "把「状态反馈」切到「克制清晰反馈」，恢复 ± 展开徽、层级引导线、柔绿选中态与面包屑。",
    };
  } else if (state.feedbackMode === "noisy") {
    feedbackTag = "彩虹噪点过载";
    feedbackIssue = {
      code: "noisy",
      badge: "错态 · 处处高亮等于无焦点",
      title: "每一层都刷满高饱和彩色底框，真正选中的节点被淹没",
      body: "状态反馈讲究「静默背景 + 单点突出」。把全部层级涂成彩色条纹后，视觉重心四散，选中反馈反而失效。",
      action: "把「状态反馈」切到「克制清晰反馈」，只用柔和薄荷底凸显当前选中项。",
    };
  } else {
    feedbackOk = true;
    feedbackTag = "路径清晰";
  }

  const passedCount = [hierarchyOk, disclosureOk, semanticOk, feedbackOk].filter(Boolean).length;
  const allOk = passedCount === 4;

  // 优先级主诊单：永远精准指出当前最需要修的第一处错态；4/4 时肯定具体解法（区分 4 层原海报解 vs 3 层扁宽解）
  let diagnosis;
  if (allOk) {
    const styleNote =
      maxDepth === 3
        ? "你调出的是「3 层扁宽解」——点击步数更少，检索路径比 4 层更短，同样完全成立。"
        : "你调出的是「4 层均衡解」——与 280 原海报一致，分支容量与深度节奏恰好平衡。";
    diagnosis = {
      ok: true,
      badge: `已校准 (${passedCount} / 4)`,
      title: `树形秩序就位：${maxDepth} 层深度 · ${state.indentPx}px 阶梯 · 可见 ${visibleCount} 项`,
      body: `${styleNote}你还可以继续点开其他分支、按方向键 ↑↓←→ 游走焦点，或在顶部输入关键词体验保留祖先路径的树形筛选。`,
      action: "试试点击右侧「结构要素」的任意一项，或直接点击树中「开发文档 / 运营资料」看中栏级联卡片如何随路径切换。",
    };
  } else {
    const first = hierarchyIssue || disclosureIssue || semanticIssue || feedbackIssue;
    diagnosis = {
      ok: false,
      badge: `${first.badge} (${passedCount} / 4)`,
      title: first.title,
      body: first.body,
      action: first.action,
    };
  }

  // 计算扫读负担档位（诚实标明为示意档位，不做假精确百分比）
  let scanTier = "轻快";
  if (visibleCount >= 14 || state.namingMode === "cryptic" || state.namingMode === "verbose" || maxDepth >= 6) {
    scanTier = "沉重（示意）";
  } else if (!allOk) {
    scanTier = "偏吃力（示意）";
  } else {
    scanTier = "顺畅（示意）";
  }

  // 面包屑路径（从根到当前选中节点）
  const breadcrumb = [...selected.ancestors, selected.id].map((id) => {
    const m = NODE_META[id];
    return { id, label: getDisplayLabel(m, state.namingMode).zh };
  });

  // 构建中栏三级联详情卡（1:1 承袭 280 原海报：当前分支卡 → 子节点卡 → 末端组件详情卡）
  const cascade = buildCascadeCards(selected, byId, state.namingMode);

  // 第 5 原则「自适应」实时读数
  const adaptiveOk = clippedCount === 0;
  const adaptiveTag = state.searchQuery
    ? `筛中 ${matchedIds ? matchedIds.size : 0} 项`
    : clippedCount > 0
      ? `窄框裁字 ${clippedCount} 处`
      : "面包屑 + 搜索就绪";

  return {
    tree,
    allNodes,
    byId,
    visible,
    selected,
    breadcrumb,
    cascade,
    metrics: {
      maxDepth,
      maxVisibleDepth,
      indentPx: state.indentPx,
      visibleCount,
      totalCount,
      openBranchCount: openNonRootBranches.length,
      totalBranchCount: nonRootBranches.length,
      openRatio,
      redundantCount: redundantNodes.length,
      clippedCount,
      worstOverflowPx,
      scanTier,
    },
    checks: {
      hierarchy: { ok: hierarchyOk, tag: hierarchyTag },
      disclosure: { ok: disclosureOk, tag: disclosureTag },
      semantic: { ok: semanticOk, tag: semanticTag },
      feedback: { ok: feedbackOk, tag: feedbackTag },
      adaptive: { ok: adaptiveOk, tag: adaptiveTag },
    },
    passedCount,
    allOk,
    diagnosis,
    clippedIds: new Set(clipped.map((c) => c.id)),
  };
}

// 为中栏生成 1:1 承袭原海报的三张级联详情卡
function buildCascadeCards(selected, byId, namingMode) {
  const lbl = (id) => getDisplayLabel(NODE_META[id], namingMode);

  // 情况 1：选中的是「组件库」或「表单组件」等带子项链的分支（原海报默认呈现 组件库 → 表单组件 → 输入框）
  let topId = selected.id;
  let midId = null;

  if (selected.id === "root" || selected.id === "design" || selected.id === "wrap1" || selected.id === "wrap2") {
    topId = byId.has("components") ? "components" : selected.id;
    midId = byId.has("form") ? "form" : null;
  } else if (selected.hasChildren) {
    topId = selected.id;
    midId = selected.childrenIds.includes("form") ? "form" : selected.childrenIds[0];
  } else {
    // 选中的是叶子文档（如 表单组件 / 基础组件 / 导航组件 / 接口契约）
    const parent = selected.parentId && byId.get(selected.parentId);
    topId = parent && parent.id !== "root" ? parent.id : selected.id;
    midId = selected.id;
  }

  const topMeta = NODE_META[topId];
  const topLabel = lbl(topId);
  const topChildren = topMeta.childrenPreview || (byId.get(topId)?.childrenIds || []).map((cid) => ({
    id: cid,
    label: lbl(cid).zh,
    count: NODE_META[cid].count,
  }));

  const card1 = {
    sourceId: topId,
    title: topLabel.zh,
    en: topLabel.en,
    desc: namingMode === "cryptic" ? "当前处于模糊编号态，无法从标题判断本分组覆盖的组件与规范范围。" : topMeta.desc,
    items: topChildren.map((ch) => ({
      id: ch.id,
      label: namingMode === "cryptic" ? NODE_META[ch.id]?.cryptic || ch.label : ch.label,
      count: ch.count,
      active: ch.id === midId,
    })),
    footer: `共 ${topMeta.count} 项内容`,
  };

  const midMeta = midId ? NODE_META[midId] : null;
  const card2 = midMeta
    ? {
        sourceId: midId,
        title: lbl(midId).zh,
        en: lbl(midId).en,
        desc: namingMode === "cryptic" ? "节点名称缺失语义气味，必须逐层点开才能确认子项类型。" : midMeta.desc,
        items: (midMeta.subItems || (midMeta.tags || []).map((t) => ({ label: t, count: 1 }))).map((s, idx) => ({
          label: namingMode === "cryptic" ? `子条目 0${idx + 1}` : s.label,
          count: s.count,
          active: idx === 0,
        })),
        footer: `共 ${midMeta.count} 项内容`,
      }
    : null;

  const leafInfo = midMeta?.leafDetail || {
    title: topLabel.zh,
    en: topLabel.en,
    desc: topMeta.desc,
    tags: topMeta.tags || ["分类归档", "按需查阅"],
    total: (topMeta.tags || []).length || 3,
  };

  const card3 = {
    sourceId: midId || topId,
    title: namingMode === "cryptic" ? "末端条目 01" : leafInfo.title,
    en: namingMode === "cryptic" ? "LEAF-01" : leafInfo.en,
    desc: namingMode === "cryptic" ? "底层内容被多层编号包裹，查找路径失去上下文参考。" : leafInfo.desc,
    tags: namingMode === "cryptic" ? ["标签 01", "标签 02", "标签 03", "标签 04"] : leafInfo.tags,
    footer: `共 ${leafInfo.total} 项内容`,
  };

  return { card1, card2, card3 };
}

// ============================================================
// 第 01 节数据：64 叶子文档在 4 种「广度 × 深度」拓扑下的实算对比
// 基于 Kiger (1984) 64 终点菜单经典实验架构 + Larson & Czerwinski (1998) 发现
// ============================================================
export const BREADTH_SHAPES = [
  {
    id: "d6",
    label: "2^6 深窄 · 6 层",
    short: "6 层 × 每层 2 项",
    depth: 6,
    branching: 2,
    leaves: 64,
    clicks: 6,
    scanPerLevel: 2,
    totalScanned: 12,
    indentNeedPx: 5 * 20, // 5 级缩进
    riskTier: "高（示意）",
    verdict: "最易迷路",
    verdictTone: "err",
    note: "每次只看 2 个选项看似轻松，但必须连续做 6 次正确判断。一旦在第 2 层猜错分类，就要反复回退重爬，Kiger (1984) 实验中 6 层 2 分支结构耗时最长、出错率最高。",
  },
  {
    id: "d3",
    label: "4^3 均衡 · 3 层",
    short: "3 层 × 每层 4 项",
    depth: 3,
    branching: 4,
    leaves: 64,
    clicks: 3,
    scanPerLevel: 4,
    totalScanned: 12,
    indentNeedPx: 2 * 20,
    riskTier: "低（示意）",
    verdict: "均衡推荐",
    verdictTone: "ok",
    note: "3 步直达目标，每层只有 4 个清晰分组。既守住海报「不超过 4 层」的简洁节奏，又让左侧树目录缩进从容、不挤占标题宽度。",
  },
  {
    id: "d2",
    label: "8^2 宽浅 · 2 层",
    short: "2 层 × 每层 8 项",
    depth: 2,
    branching: 8,
    leaves: 64,
    clicks: 2,
    scanPerLevel: 8,
    totalScanned: 16,
    indentNeedPx: 1 * 20,
    riskTier: "很低（示意）",
    verdict: "检索最快",
    verdictTone: "ok",
    note: "Kiger (1984) 实证里 8×8 两层结构是 64 项菜单中速度最快、用户偏好最高的形态：点击步数压到 2 步，只要分类命名清晰，人眼扫读 8 项几乎不费力。",
  },
  {
    id: "d1",
    label: "64^1 全平 · 1 层",
    short: "1 层 × 直接铺 64 项",
    depth: 1,
    branching: 64,
    leaves: 64,
    clicks: 1,
    scanPerLevel: 64,
    totalScanned: 64,
    indentNeedPx: 0,
    riskTier: "扫读过载（示意）",
    verdict: "失去层级",
    verdictTone: "warn",
    note: "彻底放弃分组后，虽然点 1 下就能打开，但必须在一长串 64 个平级条目中肉眼大海捞针，失去树形结构「按类收拢」的价值。",
  },
];

// ============================================================
// 第 06 节数据：什么时候别用树形 · 4 类产品场景分诊
// ============================================================
export const TRIAGE_SCENARIOS = [
  {
    id: "docs",
    title: "企业设计系统与 API 知识库",
    tag: "单父归属 · 3–4 层",
    fit: "use",
    verdict: "非常适合树形浏览布局",
    why: "文档天然存在严格的模块包含关系（组件库 → 表单 → 输入框），用户既需要按层级浏览全貌，也常在相邻文档间反复切换。",
    axes: { singleParent: 95, depthNeed: 85, multiFilter: 25, compareFields: 20 },
    altText: "保持 3–4 层目录树，配合顶部面包屑与关键词过滤即可兼顾探索和直达。",
    altLinks: [],
  },
  {
    id: "ecommerce",
    title: "5000 款户外装备选品库",
    tag: "多维交叉 · 颜色/尺码/场景",
    fit: "avoid",
    verdict: "别硬套严格树形",
    why: "一件「黑色防水徒步冲锋衣」同时属于「男装」「防水」「冬季」「黑色」。硬塞进单父树，要么让商品在 4 个分支里重复出现，要么逼用户猜运营人员把它归进了哪一枝。",
    axes: { singleParent: 20, depthNeed: 35, multiFilter: 96, compareFields: 80 },
    altText: "改用多维分面筛选搭配卡片网格或搜索结果页，让用户自由勾选属性交集。",
    altLinks: [
      { id: "270", name: "卡片网格布局", url: "https://layout.xiaoxiaodong.ai/270/play/" },
      { id: "286", name: "搜索结果布局", url: "https://layout.xiaoxiaodong.ai/286/play/" },
    ],
    clashDemo: [
      "户外装备 / 按场景 / 徒步 / 黑色防水冲锋衣（重复 #1）",
      "户外装备 / 按功能 / 防水 / 黑色防水冲锋衣（重复 #2）",
      "户外装备 / 按季节 / 冬季 / 黑色防水冲锋衣（重复 #3）",
    ],
  },
  {
    id: "sprint",
    title: "研发迭代任务与排期表",
    tag: "阶段流转 · 按日推进",
    fit: "avoid",
    verdict: "别用树形折叠藏起进度",
    why: "团队盯进度关心的是「哪些卡在评审」「哪天撞期」，树形折叠会把瓶颈任务藏在收起的文件夹里，让人看不见全局流转状态。",
    axes: { singleParent: 45, depthNeed: 25, multiFilter: 55, compareFields: 90 },
    altText: "按状态推进交给看板，按日期排期交给日历，按字段对比排序交给数据表格。",
    altLinks: [
      { id: "278", name: "看板布局", url: "https://layout.xiaoxiaodong.ai/278/play/" },
      { id: "279", name: "日历布局", url: "https://layout.xiaoxiaodong.ai/279/play/" },
      { id: "274", name: "数据表格布局", url: "https://layout.xiaoxiaodong.ai/274/play/" },
    ],
  },
  {
    id: "tiny-settings",
    title: "只有 6 项开关的个人偏好页",
    tag: "浅结构 · 项数极少",
    fit: "avoid",
    verdict: "别杀鸡用牛刀",
    why: "一共只有 6 个选项却硬加可折叠树形侧栏，用户一屏本来全能看完，反倒要多点两下才能掀开子项，纯属多余的交互摩擦。",
    axes: { singleParent: 80, depthNeed: 12, multiFilter: 10, compareFields: 30 },
    altText: "直接用分组清晰的设置页面或轻量分层导航，一屏直达全部开关。",
    altLinks: [
      { id: "287", name: "设置页面布局", url: "https://layout.xiaoxiaodong.ai/287/play/" },
      { id: "290", name: "分层导航布局", url: "https://layout.xiaoxiaodong.ai/290/play/" },
    ],
  },
];

// ============================================================
// 第 07 节数据：实战小练习（中性选项，仅差单一变量）
// ============================================================
export const QUIZ_ITEMS = [
  {
    id: "q1",
    prompt: "你正在整理一套包含 32 篇文档的「产品设计规范」。下面 4 套方案字体、配色和内容完全一致，只在层级结构与默认展开方式上不同——哪一套最符合树形浏览布局的原则？",
    options: [
      {
        key: "A",
        title: "方案 A",
        meta: "5 层细分 · 默认全收到根",
        preview: [
          { depth: 1, text: "设计规范", mark: "+", count: 32 },
          { depth: 2, text: "（一级分类全部隐藏）", muted: true },
          { depth: 3, text: "需连续点开 5 层见正文", muted: true },
        ],
        correct: false,
        reason: "拆到 5 层过深，且把一级主干全收进根节点里，用户一打开看不到有哪些大类，既盲目又多点几次。",
      },
      {
        key: "B",
        title: "方案 B",
        meta: "3 层分组 · 仅展当前路径",
        preview: [
          { depth: 1, text: "设计规范", mark: "−", count: 32 },
          { depth: 2, text: "组件库", mark: "−", count: 18, active: true },
          { depth: 3, text: "表单组件", mark: "·", count: 6 },
          { depth: 2, text: "设计原则", mark: "+", count: 5 },
          { depth: 2, text: "品牌视觉", mark: "+", count: 9 },
        ],
        correct: true,
        reason: "正解！3 层控制在 4 层经验上限内，默认展开根节点与当前查阅的 1 条路径，其余主干收起并用数字徽标交代容量，兼顾全局视野与专注度。",
      },
      {
        key: "C",
        title: "方案 C",
        meta: "3 层分组 · 默认 32 项全展",
        preview: [
          { depth: 1, text: "设计规范", mark: "−", count: 32 },
          { depth: 2, text: "组件库", mark: "−", count: 18 },
          { depth: 3, text: "基础 / 表单 / 导航 / 弹窗…", muted: false },
          { depth: 2, text: "设计原则", mark: "−", count: 5 },
          { depth: 3, text: "留白 / 对齐 / 对比 / 反馈…", muted: false },
        ],
        correct: false,
        reason: "虽然层级合理，但默认把全部 32 个节点一次性摊开，违背了「按需展开」，满屏长列表会迅速吞没当前关注点。",
      },
      {
        key: "D",
        title: "方案 D",
        meta: "1 层平铺 · 按更新时间排序",
        preview: [
          { depth: 1, text: "输入框校验规则（昨天）", mark: "·" },
          { depth: 1, text: "主色对比度要求（3天前）", mark: "·" },
          { depth: 1, text: "导航栏断点规则（上周）", mark: "·" },
          { depth: 1, text: "…其余 29 篇平铺直列", muted: true },
        ],
        correct: false,
        reason: "放弃了分类层级，32 篇规范混成一锅按时间排列，读完标题也拼不出设计系统的结构全貌。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "这套 4 层知识库需要适配 375px 手机竖屏。下面 4 套方案内容完全一致，只在窄屏交互策略上不同——哪一套最能保持可用性？",
    options: [
      {
        key: "A",
        title: "方案 A",
        meta: "保留 28px 缩进 · 横向滚动",
        preview: [
          { depth: 1, text: "知识库", mark: "−" },
          { depth: 2, text: "产品设计", mark: "−" },
          { depth: 3, text: "组件库", mark: "−" },
          { depth: 4, text: "表单组件与校验规… →", warn: true },
        ],
        correct: false,
        reason: "桌面 28px 缩进在 375px 窄屏上第 4 层就吃掉近百像素，标题反复截断且强迫左右滑屏，阅读体验破碎。",
      },
      {
        key: "B",
        title: "方案 B",
        meta: "缩进压到 2px · 去图标省宽",
        preview: [
          { depth: 1, text: "知识库" },
          { depth: 1, text: "产品设计" },
          { depth: 1, text: "组件库" },
          { depth: 1, text: "表单组件" },
        ],
        correct: false,
        reason: "虽然文字不折行了，但 2px 缩进加上去掉文件夹图标后，整棵树糊成扁平清单，彻底丧失父子归属感。",
      },
      {
        key: "C",
        title: "方案 C",
        meta: "面包屑 + 单层钻取 + 留路径搜索",
        preview: [
          { depth: 1, text: "知识库 / 产品设计 / 组件库", crumb: true },
          { depth: 1, text: "基础组件", mark: "›", count: 8 },
          { depth: 1, text: "表单组件", mark: "›", count: 6, active: true },
          { depth: 1, text: "导航组件", mark: "›", count: 4 },
        ],
        correct: true,
        reason: "正解！用顶部面包屑守住全局方位，正文只平铺当前层级的子项释放 100% 宽度，再配带祖先路径的即时搜索，完美贴合海报「自适应」要点。",
      },
      {
        key: "D",
        title: "方案 D",
        meta: "隐藏子目录 · 合并成一篇长文",
        preview: [
          { depth: 1, text: "产品设计（含全部 12 篇长文）", mark: "·" },
          { depth: 1, text: "开发文档（含全部 24 篇长文）", mark: "·" },
          { depth: 1, text: "运营资料（含全部 16 篇长文）", mark: "·" },
        ],
        correct: false,
        reason: "把几十篇独立文档硬拼成超长单页，手机上滑到一半就迷失位置，失去了目录精准直达的能力。",
      },
    ],
  },
];
