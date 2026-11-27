// 265 标签页布局 — 单真源状态、几何排布模型、双向诊断与决策引擎

export const CONTEXTS = {
  poster: {
    id: "poster",
    name: "原海报 · 项目工作台",
    shortName: "原海报工作台",
    desc: "1:1 承袭 265 原海报：概览 / 数据 / 成员 / 设置四组同级视图，叠加安全、权限、其他三项常见臃肿项。",
    tabs: [
      {
        id: "overview",
        short: "概览",
        verbose: "项目核心概览",
        en: "OVERVIEW",
        icon: "pie",
        core: true,
        viewTitle: "当前视图：概览",
        summary: "标签页将复杂信息按主题分组，每个标签代表一个独立内容区块。用户可通过点击标签快速切换视图，保持任务流程的连贯性。",
        filters: ["全部进度", "本周里程碑", "待确认项"],
        placeholder: "记一条概览批注，切去别的标签再切回试试…",
        pie: [0.38, 0.29, 0.33],
        wave: [0.46, 0.22, 0.64, 0.38, 0.78, 0.52, 0.86, 0.68],
        metrics: [
          { label: "进行中任务", value: "18 项", tone: "violet" },
          { label: "完成率", value: "74%", tone: "sage" },
          { label: "阻塞风险", value: "2 项", tone: "neutral" },
        ],
      },
      {
        id: "data",
        short: "数据",
        verbose: "详细数据统计",
        en: "DATA",
        icon: "folder",
        core: true,
        viewTitle: "当前视图：数据",
        summary: "集中呈现按周期汇总的核心指标与转化趋势，让分析动作留在同一工作面板内完成，不必跳出当前项目上下文。",
        filters: ["近 7 天", "近 30 天", "本季度"],
        placeholder: "输入一条数据口径备注，验证切页留存…",
        pie: [0.54, 0.26, 0.20],
        wave: [0.28, 0.44, 0.35, 0.62, 0.58, 0.84, 0.72, 0.91],
        metrics: [
          { label: "周活留存", value: "62.4%", tone: "violet" },
          { label: "切页耗时", value: "0.4 秒", tone: "sage" },
          { label: "跳出率", value: "11.2%", tone: "neutral" },
        ],
      },
      {
        id: "members",
        short: "成员",
        verbose: "团队成员名录",
        en: "MEMBERS",
        icon: "user",
        core: true,
        viewTitle: "当前视图：成员",
        summary: "把协作者名单、角色分工与审批状态收敛在一个平级视图中，与概览和数据并列但不互相遮挡。",
        filters: ["全部成员", "设计组", "研发组"],
        placeholder: "写一条待邀请成员备注，测试切页记忆…",
        pie: [0.42, 0.36, 0.22],
        wave: [0.52, 0.58, 0.49, 0.66, 0.71, 0.64, 0.79, 0.75],
        metrics: [
          { label: "在组协作者", value: "14 人", tone: "violet" },
          { label: "今日在线", value: "11 人", tone: "sage" },
          { label: "待审申请", value: "3 份", tone: "neutral" },
        ],
      },
      {
        id: "settings",
        short: "设置",
        verbose: "系统偏好设置",
        en: "SETTINGS",
        icon: "gear",
        core: true,
        viewTitle: "当前视图：设置",
        summary: "集中管理通知、可见性与归档开关，配置完成后切回概览依然能停留在刚才的筛选状态。",
        filters: ["基础偏好", "通知策略", "归档规则"],
        placeholder: "记一条即将调整的配置项草稿…",
        pie: [0.65, 0.20, 0.15],
        wave: [0.40, 0.45, 0.42, 0.50, 0.48, 0.55, 0.53, 0.60],
        metrics: [
          { label: "已启策略", value: "6 / 8", tone: "violet" },
          { label: "自动保存", value: "已开启", tone: "sage" },
          { label: "上次同步", value: "2 分钟前", tone: "neutral" },
        ],
      },
      {
        id: "security",
        short: "安全",
        verbose: "账户安全审计",
        en: "SECURITY",
        icon: "shield",
        core: false,
        viewTitle: "当前视图：安全（可归入设置）",
        summary: "与「设置」高度重叠的细分项，被单独拉成一级标签后会挤占主标签栏的宝贵横向宽度。",
        filters: ["登录记录", "双重验证", "令牌管理"],
        placeholder: "安全审计草稿…",
        pie: [0.72, 0.18, 0.10],
        wave: [0.35, 0.32, 0.40, 0.38, 0.44, 0.42, 0.46, 0.50],
        metrics: [
          { label: "异常登录", value: "0 次", tone: "sage" },
          { label: "活跃密钥", value: "4 枚", tone: "violet" },
          { label: "审计周期", value: "90 天", tone: "neutral" },
        ],
      },
      {
        id: "perms",
        short: "权限",
        verbose: "角色权限矩阵",
        en: "PERMISSIONS",
        icon: "key",
        core: false,
        viewTitle: "当前视图：权限（可归入成员）",
        summary: "原本属于「成员」下的二级职责配置，拆到顶层后让用户要在「成员」和「权限」之间反复猜。",
        filters: ["管理员", "编辑者", "只读访客"],
        placeholder: "权限调整草稿…",
        pie: [0.30, 0.45, 0.25],
        wave: [0.60, 0.55, 0.62, 0.58, 0.66, 0.63, 0.70, 0.68],
        metrics: [
          { label: "角色组", value: "3 组", tone: "violet" },
          { label: "细粒度项", value: "12 条", tone: "sage" },
          { label: "冲突项", value: "0 条", tone: "neutral" },
        ],
      },
      {
        id: "other",
        short: "其他",
        verbose: "其他杂项归档",
        en: "OTHER",
        icon: "dots",
        core: false,
        viewTitle: "当前视图：其他（含义模糊）",
        summary: "「其他」是最典型的大杂烩标签：用户完全猜不出里面放了什么，被迫逐个点开试错。",
        filters: ["导出包", "实验功能", "回收站"],
        placeholder: "杂项备注…",
        pie: [0.25, 0.25, 0.50],
        wave: [0.30, 0.62, 0.24, 0.70, 0.28, 0.66, 0.34, 0.58],
        metrics: [
          { label: "未分类项", value: "9 项", tone: "neutral" },
          { label: "点击率", value: "低", tone: "violet" },
          { label: "建议动作", value: "拆分或移除", tone: "sage" },
        ],
      },
    ],
  },
  shop: {
    id: "shop",
    name: "电商 · 商品详情",
    shortName: "电商商品详情",
    desc: "商品主图下方用同级标签切分概览、规格、评价与售后，避免长页面无尽下拉。",
    tabs: [
      {
        id: "overview",
        short: "详情",
        verbose: "商品核心卖点详情",
        en: "DETAILS",
        icon: "pie",
        core: true,
        viewTitle: "当前视图：商品详情",
        summary: "集中展示核心卖点、材质与使用场景，让买家在不离开下单按钮的情况下快速建立判断。",
        filters: ["核心亮点", "实拍细节", "装箱清单"],
        placeholder: "记录尺码或颜色意向，测试切换留存…",
        pie: [0.48, 0.32, 0.20],
        wave: [0.42, 0.55, 0.50, 0.70, 0.68, 0.80, 0.76, 0.88],
        metrics: [
          { label: "好评率", value: "98.2%", tone: "sage" },
          { label: "月销件数", value: "2,460", tone: "violet" },
          { label: "发货时效", value: "24 小时", tone: "neutral" },
        ],
      },
      {
        id: "data",
        short: "规格",
        verbose: "完整技术规格参数",
        en: "SPECS",
        icon: "folder",
        core: true,
        viewTitle: "当前视图：规格参数",
        summary: "用结构化参数表承载尺寸、重量、接口与续航，有明确查询意图的用户一键直达。",
        filters: ["机身尺寸", "电池续航", "兼容列表"],
        placeholder: "记一条核对过的接口参数…",
        pie: [0.35, 0.40, 0.25],
        wave: [0.50, 0.52, 0.58, 0.60, 0.65, 0.64, 0.72, 0.74],
        metrics: [
          { label: "整机净重", value: "310 g", tone: "violet" },
          { label: "续航标称", value: "36 小时", tone: "sage" },
          { label: "接口制式", value: "USB-C", tone: "neutral" },
        ],
      },
      {
        id: "members",
        short: "评价",
        verbose: "已购买家真实评价",
        en: "REVIEWS",
        icon: "user",
        core: true,
        viewTitle: "当前视图：买家评价",
        summary: "按晒图、追评与痛点关键词筛选真实反馈，切回规格核对后再回来不应重置筛选。",
        filters: ["有图评价", "追评反馈", "手感实测"],
        placeholder: "记一条待确认的买家反馈…",
        pie: [0.62, 0.24, 0.14],
        wave: [0.60, 0.68, 0.64, 0.75, 0.72, 0.82, 0.85, 0.90],
        metrics: [
          { label: "总评价数", value: "1,184 条", tone: "violet" },
          { label: "带图占比", value: "41%", tone: "sage" },
          { label: "追评数", value: "196 条", tone: "neutral" },
        ],
      },
      {
        id: "settings",
        short: "售后",
        verbose: "退换保修售后保障",
        en: "WARRANTY",
        icon: "gear",
        core: true,
        viewTitle: "当前视图：售后保障",
        summary: "透明列明七天无理由、质保年限与延保方案，打消下单前的最后顾虑。",
        filters: ["质保范围", "退换流程", "价保说明"],
        placeholder: "记一条要问客服的质保问题…",
        pie: [0.55, 0.30, 0.15],
        wave: [0.45, 0.48, 0.46, 0.54, 0.58, 0.60, 0.62, 0.66],
        metrics: [
          { label: "官方质保", value: "2 年", tone: "sage" },
          { label: "价保周期", value: "15 天", tone: "violet" },
          { label: "运费险", value: "已含", tone: "neutral" },
        ],
      },
      {
        id: "security",
        short: "物流",
        verbose: "跨境清关物流政策",
        en: "SHIPPING",
        icon: "shield",
        core: false,
        viewTitle: "当前视图：物流（可并入售后）",
        summary: "信息量只有三行，却单独占据一个一级标签槽位。",
        filters: ["次日达区", "偏远说明", "自提网点"],
        placeholder: "物流备注…",
        pie: [0.50, 0.30, 0.20],
        wave: [0.40, 0.42, 0.44, 0.41, 0.46, 0.48, 0.50, 0.49],
        metrics: [
          { label: "覆盖城市", value: "240+", tone: "violet" },
          { label: "包邮门槛", value: "0 元", tone: "sage" },
          { label: "打包仓", value: "华东仓", tone: "neutral" },
        ],
      },
      {
        id: "perms",
        short: "资质",
        verbose: "品牌授权店铺资质",
        en: "LICENSE",
        icon: "key",
        core: false,
        viewTitle: "当前视图：资质（低频可收纳）",
        summary: "绝大多数买家不会点击的证照页，不应和核心下单决策抢首屏标签位。",
        filters: ["授权证书", "质检报告", "发票说明"],
        placeholder: "资质备注…",
        pie: [0.40, 0.40, 0.20],
        wave: [0.30, 0.34, 0.33, 0.36, 0.35, 0.38, 0.37, 0.40],
        metrics: [
          { label: "证照数", value: "5 份", tone: "sage" },
          { label: "点击占比", value: "极低", tone: "neutral" },
          { label: "建议归宿", value: "页底链接", tone: "violet" },
        ],
      },
      {
        id: "other",
        short: "其他",
        verbose: "其他补充活动说明",
        en: "OTHER",
        icon: "dots",
        core: false,
        viewTitle: "当前视图：其他（含糊标签）",
        summary: "把凑单说明和赠品规则都塞进「其他」，反而降低了重要信息的可见性。",
        filters: ["赠品清单", "发票模板", "旧机回收"],
        placeholder: "补充备注…",
        pie: [0.33, 0.33, 0.34],
        wave: [0.28, 0.52, 0.32, 0.58, 0.30, 0.54, 0.35, 0.48],
        metrics: [
          { label: "内容混杂", value: "3 类", tone: "neutral" },
          { label: "误点率", value: "偏高", tone: "violet" },
          { label: "建议动作", value: "删减归类", tone: "sage" },
        ],
      },
    ],
  },
  docs: {
    id: "docs",
    name: "设计系统 · 组件文档",
    shortName: "设计系统文档",
    desc: "同一组件页下切分指南、代码、无障碍与日志，让设计师和工程师各取所需。",
    tabs: [
      {
        id: "overview",
        short: "指南",
        verbose: "视觉交互设计指南",
        en: "GUIDELINES",
        icon: "pie",
        core: true,
        viewTitle: "当前视图：设计指南",
        summary: "说明组件的解剖结构、间距规范与正反示例，方便设计师直接落地。",
        filters: ["解剖结构", "间距尺寸", "正反示例"],
        placeholder: "记一条待同步给团队的规范问题…",
        pie: [0.44, 0.31, 0.25],
        wave: [0.40, 0.58, 0.46, 0.72, 0.64, 0.80, 0.74, 0.86],
        metrics: [
          { label: "覆盖场景", value: "4 种", tone: "violet" },
          { label: "设计令牌", value: "16 项", tone: "sage" },
          { label: "状态完备", value: "完整", tone: "neutral" },
        ],
      },
      {
        id: "data",
        short: "代码",
        verbose: "组件属性接口代码",
        en: "CODE API",
        icon: "folder",
        core: true,
        viewTitle: "当前视图：代码与属性",
        summary: "集中列出 Props、事件回调与受控模式示例，工程师切进来复制后可无缝回到指南对照。",
        filters: ["HTML 语义", "受控状态", "键盘事件"],
        placeholder: "粘贴一段待核对的属性名…",
        pie: [0.58, 0.22, 0.20],
        wave: [0.35, 0.50, 0.62, 0.58, 0.76, 0.72, 0.88, 0.84],
        metrics: [
          { label: "核心属性", value: "7 个", tone: "violet" },
          { label: "零依赖", value: "原生实现", tone: "sage" },
          { label: "打包增量", value: "2.1 KB", tone: "neutral" },
        ],
      },
      {
        id: "members",
        short: "无障碍",
        verbose: "键盘焦点无障碍规范",
        en: "A11Y",
        icon: "user",
        core: true,
        viewTitle: "当前视图：无障碍规范",
        summary: "对照 W3C WAI-ARIA APG 给出 tablist 角色、箭头键游走焦点与读屏播报验收清单。",
        filters: ["ARIA 角色", "键盘操作", "对比度"],
        placeholder: "记录一条读屏器验收结果…",
        pie: [0.50, 0.30, 0.20],
        wave: [0.54, 0.60, 0.56, 0.68, 0.72, 0.76, 0.82, 0.88],
        metrics: [
          { label: "对比度", value: "≥ 4.5:1", tone: "sage" },
          { label: "键盘可达", value: "100%", tone: "violet" },
          { label: "标准版本", value: "APG", tone: "neutral" },
        ],
      },
      {
        id: "settings",
        short: "日志",
        verbose: "历史版本更新日志",
        en: "CHANGELOG",
        icon: "gear",
        core: true,
        viewTitle: "当前视图：更新日志",
        summary: "记录样式调整、无障碍修复与弃用提醒，保持版本脉络独立清晰。",
        filters: ["v2.4 最新", "破坏变更", "缺陷修复"],
        placeholder: "记一条下个版本的改进提案…",
        pie: [0.60, 0.25, 0.15],
        wave: [0.38, 0.44, 0.48, 0.52, 0.56, 0.62, 0.66, 0.72],
        metrics: [
          { label: "当前版本", value: "v2.4.1", tone: "violet" },
          { label: "近期修复", value: "5 项", tone: "sage" },
          { label: "兼容状态", value: "向后兼容", tone: "neutral" },
        ],
      },
      {
        id: "security",
        short: "旧版",
        verbose: "已弃用旧版归档",
        en: "LEGACY",
        icon: "shield",
        core: false,
        viewTitle: "当前视图：旧版（应并入日志）",
        summary: "把旧版迁移提示单独拉成标签，平白多出一个低频入口。",
        filters: ["v1.x", "迁移脚本", "兼容层"],
        placeholder: "旧版备注…",
        pie: [0.22, 0.38, 0.40],
        wave: [0.60, 0.52, 0.46, 0.42, 0.38, 0.32, 0.28, 0.24],
        metrics: [
          { label: "维护状态", value: "已归档", tone: "neutral" },
          { label: "访问占比", value: "低", tone: "violet" },
          { label: "建议动作", value: "并入日志", tone: "sage" },
        ],
      },
      {
        id: "perms",
        short: "问答",
        verbose: "开发高频常见问题",
        en: "FAQ",
        icon: "key",
        core: false,
        viewTitle: "当前视图：问答（应融入指南）",
        summary: "把设计疑问孤立进 FAQ 标签，读者往往在看指南时错过最关键的避坑提醒。",
        filters: ["选型疑问", "样式覆盖", "服务端渲染"],
        placeholder: "补充一个问题…",
        pie: [0.36, 0.34, 0.30],
        wave: [0.46, 0.50, 0.48, 0.52, 0.51, 0.55, 0.54, 0.58],
        metrics: [
          { label: "收录条数", value: "8 条", tone: "violet" },
          { label: "与指南重复", value: "6 条", tone: "neutral" },
          { label: "建议动作", value: "就地融入", tone: "sage" },
        ],
      },
      {
        id: "other",
        short: "其他",
        verbose: "其他外部资源链接",
        en: "OTHER",
        icon: "dots",
        core: false,
        viewTitle: "当前视图：其他（含糊标签）",
        summary: "笼统的「其他」让文档结构瞬间失焦。",
        filters: ["设计源文件", "图标包", "演讲稿"],
        placeholder: "资源备注…",
        pie: [0.30, 0.35, 0.35],
        wave: [0.30, 0.45, 0.28, 0.50, 0.34, 0.48, 0.32, 0.44],
        metrics: [
          { label: "外链数", value: "4 个", tone: "neutral" },
          { label: "识别度", value: "差", tone: "violet" },
          { label: "建议动作", value: "直接移除", tone: "sage" },
        ],
      },
    ],
  },
};

export function createInitialState() {
  const ctx = CONTEXTS.poster;
  // 开场刻意停在 0/4 坏态：7 个冗长命名标签在 680px 下折成 2 排 + 弱态断连 + 切页清空上下文
  return {
    contextId: "poster",
    tabIds: ctx.tabs.map((t) => t.id),
    activeId: "overview",
    containerWidth: 680,
    labelMode: "verbose",     // "verbose" | "concise"
    activeStyle: "broken",    // "broken" | "folder" | "underline"
    keepContext: false,       // false | true
    overflowMode: "wrap",     // "wrap" | "single" | "scroll"
    switchCount: 0,
    lostEdits: 0,
    traceActive: false,
    traceProgress: 0,
    perTabState: createFreshTabMemory(ctx),
  };
}

export function createFreshTabMemory(ctx) {
  const mem = {};
  for (const t of ctx.tabs) {
    mem[t.id] = {
      filterIdx: 0,
      draft: t.id === "overview" ? "待确认：本周首页切签方案" : "",
      touched: t.id === "overview",
    };
  }
  return mem;
}

// 估算单个标签在给定命名模式下需要的最小舒展宽度（px）
export function estimateTabNeedPx(tab, labelMode, compact) {
  const text = labelMode === "verbose" ? tab.verbose : tab.short;
  const charW = compact ? 13 : 14.5;
  const iconAndPad = compact ? 42 : 58;
  return Math.round(text.length * charW + iconAndPad);
}

// 计算在 containerWidth 下标签排布的真实行数、槽宽、裁切与隐藏数量（单真源）
export function computeBarGeometry(state) {
  const ctx = CONTEXTS[state.contextId];
  const tabs = state.tabIds.map((id) => ctx.tabs.find((t) => t.id === id)).filter(Boolean);
  const count = tabs.length;
  const width = Math.max(300, Math.min(920, Math.round(state.containerWidth)));
  const compact = width < 460;
  const gap = compact ? 4 : 6;
  const needs = tabs.map((t) => estimateTabNeedPx(t, state.labelMode, compact));
  const totalNeed = needs.reduce((s, n) => s + n, 0) + Math.max(0, count - 1) * gap;
  const avgChars = count
    ? +(tabs.reduce((s, t) => s + (state.labelMode === "verbose" ? t.verbose.length : t.short.length), 0) / count).toFixed(1)
    : 0;

  let rows = 1;
  let minSlotPx = width;
  let clippedCount = 0;
  let hiddenCount = 0;
  const rowBreakIndices = [];

  if (state.overflowMode === "wrap") {
    let curW = 0;
    let rowItems = 0;
    let rowMin = width;
    for (let i = 0; i < count; i++) {
      const need = needs[i];
      if (rowItems > 0 && curW + gap + need > width) {
        rows++;
        rowBreakIndices.push(i);
        curW = need;
        rowItems = 1;
      } else {
        curW = rowItems === 0 ? need : curW + gap + need;
        rowItems++;
      }
      rowMin = Math.min(rowMin, need);
    }
    if (rows === 1 && count > 0) {
      minSlotPx = Math.floor((width - gap * (count - 1)) / count);
      for (let i = 0; i < count; i++) {
        if (minSlotPx < needs[i] - 12) clippedCount++;
      }
    } else {
      minSlotPx = Math.round(rowMin);
    }
  } else if (state.overflowMode === "single") {
    rows = 1;
    minSlotPx = count > 0 ? Math.floor((width - gap * (count - 1)) / count) : width;
    for (let i = 0; i < count; i++) {
      if (minSlotPx < needs[i] - 10) clippedCount++;
    }
  } else {
    // scroll 横向滚动轨
    rows = 1;
    let acc = 0;
    minSlotPx = count > 0 ? Math.min(...needs) : width;
    for (let i = 0; i < count; i++) {
      acc += (i > 0 ? gap : 0) + needs[i];
      if (acc > width + 8) hiddenCount++;
    }
  }

  return {
    tabs,
    count,
    width,
    compact,
    needs,
    totalNeed,
    avgChars,
    rows,
    minSlotPx,
    clippedCount,
    hiddenCount,
    rowBreakIndices,
    hasVagueOther: tabs.some((t) => t.id === "other"),
  };
}

// 单真源诊断：双向检出 8 类正反错态 + 多组合法解
export function auditState(state) {
  const g = computeBarGeometry(state);
  const count = g.count;

  const groupingOk = count >= 2 && count <= 5 && state.labelMode === "concise" && !g.hasVagueOther;
  const discoverableOk =
    state.activeStyle !== "broken" &&
    g.rows === 1 &&
    g.minSlotPx >= 68 &&
    g.clippedCount === 0 &&
    g.hiddenCount === 0;
  const contextOk = state.keepContext === true;
  const efficiencyOk =
    count >= 2 &&
    count <= 5 &&
    g.rows === 1 &&
    g.minSlotPx >= 68 &&
    g.hiddenCount === 0;

  const pillars = {
    grouping: groupingOk,
    discoverable: discoverableOk,
    context: contextOk,
    efficiency: efficiencyOk,
  };
  const score = Object.values(pillars).filter(Boolean).length;

  // 双向 8 类错态判定（按认知危害优先级）
  let code = "pass-folder";
  let badge = `${score}/4 · 清晰有序`;
  let grade = "秩序清晰（示意）";
  let headline = "";
  let why = "";
  let nextAction = "";
  let tone = "ok"; // "bad" | "warn" | "ok"

  if (count < 2) {
    code = "single-tab";
    tone = "bad";
    badge = `${score}/4 · 单签多余`;
    grade = "无分组必要（示意）";
    headline = "只剩 1 个标签，没必要再套一层标签页";
    why = "标签页的价值在于把 2 组以上同级视图折进同一空间切换。只有一个孤立页签时，它既不能切换，还白白吃掉一行标题高度，直接用普通标题区块更干脆。";
    nextAction = "点下方「+ 补回标签」，把同级视图恢复到 3–5 个（或至少 2 个）。";
  } else if (g.rows >= 2) {
    code = "multi-row";
    tone = "bad";
    badge = `${score}/4 · ${g.rows === 2 ? "双排" : `${g.rows} 排`}跳层`;
    grade = "结构拥挤（示意）";
    headline = `${count} 个标签在 ${g.width}px 里折成了 ${g.rows} 排`;
    why = "多排标签是界面里最恼人的设计陷阱之一：点到后排页签时，要么整排上下换位打乱空间记忆，要么当前标签悬在半空，无法和下方内容框直接连通。";
    nextAction = `先点标签右上角「×」删掉冗余项，或把标签命名切到「简洁明确」，再把溢出策略改为「单排约束」。`;
  } else if (state.overflowMode === "scroll" && g.hiddenCount > 0) {
    code = "scroll-overkill";
    tone = "bad";
    badge = `${score}/4 · 藏起 ${g.hiddenCount} 签`;
    grade = "盲盒隐藏（示意）";
    headline = `横向滚动把后 ${g.hiddenCount} 个标签藏出了视野`;
    why = "把 6 个以上冗长标签塞进横向滚动条，看似排成了一行，但藏在边缘外的入口发现率大跌——用户根本不知道后面还有什么，以为只剩眼前这几项。";
    nextAction = "先把冗余标签裁到 3–5 个简洁标签，再切回「单排约束」让全部入口一眼看全。";
  } else if (count > 5) {
    code = "too-many";
    tone = "bad";
    badge = `${score}/4 · ${count} 签超载`;
    grade = "扫描吃力（示意）";
    headline = `顶栏塞进 ${count} 个标签，一眼扫不过来`;
    why = "标签页靠「一排扫全」换取低心智负担。经验值建议落在 3–5 个；一旦堆到 6 个以上，工作记忆和扫描时间都会明显爬升，通常说明部分二级项被硬拆成了顶层标签。";
    nextAction = "点击「安全 / 权限 / 其他」等低频标签上的「×」，把冗余项归并回核心 3–5 组。";
  } else if (g.hasVagueOther) {
    code = "vague-label";
    tone = "bad";
    badge = `${score}/4 · 命名含糊`;
    grade = "分组模糊（示意）";
    headline = "「其他」这类大杂烩标签让人不敢点";
    why = "标签名本身就是内容预告。出现「其他」意味着分组边界还没想清，用户看不出里面装着什么，只能在各个标签间盲猜。";
    nextAction = "点掉「其他」标签上的「×」，保留主题边界清晰的 3–5 个标签。";
  } else if (state.labelMode === "verbose") {
    code = "verbose-label";
    tone = "bad";
    badge = `${score}/4 · 命名过长`;
    grade = "文字挤占（示意）";
    headline = `标签平均长达 ${g.avgChars} 字，横向空间被文字吃空`;
    why = "给每个标签套上「项目核心…」「详细数据…」这类废话前缀，既拖慢扫读速度，又让窄屏瞬间触发文字裁切或换行。";
    nextAction = "在下方把「标签命名」切到「简洁明确（2–3 字）」。";
  } else if (g.minSlotPx < 68 || g.clippedCount > 0) {
    code = "cramped-tap";
    tone = "bad";
    badge = `${score}/4 · 槽宽 ${g.minSlotPx}px`;
    grade = "触控局促（示意）";
    headline = `${g.width}px 宽下每个标签只剩 ${g.minSlotPx}px，挤到裁字`;
    why = `在较窄的 ${g.width}px 容器里同时排 ${count} 个标签，单槽宽已逼近误触红线（经验下限约 68–72px），文字和图标互相打架。`;
    nextAction = "向右拖宽容器标尺，或把标签数精简到 3 个以适应窄屏卡片。";
  } else if (state.activeStyle === "broken") {
    code = "weak-active";
    tone = "bad";
    badge = `${score}/4 · 态弱断连`;
    grade = "位置迷失（示意）";
    headline = "当前标签灰暗且被底线截断，看不出归属";
    why = "原海报强调「保留当前标签的视觉状态，明确所在位置」。如果选中项和未选中项反差太弱，又被一条实线与内容框隔开，人眼会立刻失去「我现在在哪一页」的坐标感。";
    nextAction = "把「当前态连通」切到「紫标档案夹」或「紫线底标」，让标签与内容区重新接通。";
  } else if (!state.keepContext) {
    code = "lost-context";
    tone = "warn";
    badge = `${score}/4 · 切页丢状态`;
    grade = "上下文断裂（示意）";
    headline = "切走再回来，刚才的筛选和输入全被清空了";
    why = "标签页与整页跳转的最大区别在于「上下文延续」。如果用户每次切去对照数据、回来发现草稿和筛选归零，就会立刻产生挫败感并拒绝再次切换。";
    nextAction = "开启下方「上下文记忆：保留」，再试着改筛选或写批注、切页返回验证。";
  } else {
    // 4/4 多组合法解
    tone = "ok";
    if (state.activeStyle === "underline") {
      code = "pass-underline";
      badge = `4/4 · 极简底线解`;
      grade = "清晰克制（示意）";
      headline = `${count} 签极简底线结构成立（单槽 ${g.minSlotPx}px）`;
      why = "不用大块底色也能建立稳固的选中感：高对比紫线锚定当前标签底部，单排全览无折行，且切换时完整保留了你的筛选与输入状态。";
      nextAction = "按 Space 放飞切页注意力路径验真，或向左拖窄容器试试窄屏极限。";
    } else if (g.width <= 420) {
      code = "pass-mobile";
      badge = `4/4 · 窄屏精简解`;
      grade = "移动友好（示意）";
      headline = `${g.width}px 窄屏用 ${count} 个短标签照样游刃有余`;
      why = `即使容器收窄到 ${g.width}px，精简后的 ${count} 个短标签每个仍有 ${g.minSlotPx}px 舒适点击宽，单排清晰、不折行、不丢状态。`;
      nextAction = "试试再点「+ 补回标签」加到 6 个，看看窄屏下临界点何时崩塌。";
    } else {
      code = "pass-folder";
      badge = `4/4 · 档案夹解成立`;
      grade = "秩序清晰（示意）";
      headline = `${count} 个简洁标签单排齐整，档案夹连通与状态全过`;
      why = `紫色当前标签去掉底边直接融进内容区，豆绿未选标签退后一层，单槽 ${g.minSlotPx}px 舒展易点；切去其他视图再回来，筛选和批注都稳稳留在原地。`;
      nextAction = "试着在视图里写几字备注切页验证，或按 Space 跑一遍切页视线验真。";
    }
  }

  // 三枚顶部圆徽实时状态
  const medallions = {
    grouping: {
      ok: groupingOk,
      text: count < 2 ? "仅 1 签" : count > 5 ? `${count} 签过载` : g.hasVagueOther ? "含糊归类" : state.labelMode === "verbose" ? "命名冗长" : `${count} 组清晰`,
    },
    switching: {
      ok: discoverableOk,
      text: g.rows >= 2 ? `折 ${g.rows} 排` : state.activeStyle === "broken" ? "当前断连" : g.hiddenCount > 0 ? `藏 ${g.hiddenCount} 签` : g.minSlotPx < 68 ? `挤 ${g.minSlotPx}px` : "一排直达",
    },
    context: {
      ok: contextOk,
      text: contextOk ? "输入留存" : state.lostEdits > 0 ? `已丢 ${state.lostEdits} 次` : "切页清空",
    },
  };

  return {
    geom: g,
    pillars,
    score,
    code,
    tone,
    badge,
    grade,
    headline,
    why,
    nextAction,
    medallions,
  };
}

// 第 02 节：数量与视口预算计算器（单真源）
export function computeBudgetModel(count, viewportW, verbose) {
  const sampleShorts = ["概览", "数据", "成员", "设置", "消息", "账单", "安全", "权限", "日志"];
  const sampleLongs = ["项目核心概览", "详细数据统计", "团队成员名录", "系统偏好设置", "实时通知消息", "月度账单明细", "账户安全审计", "角色权限矩阵", "操作运行日志"];
  const labels = (verbose ? sampleLongs : sampleShorts).slice(0, count);
  const padX = viewportW <= 400 ? 12 : 18;
  const usableW = viewportW - padX * 2;
  const gap = viewportW <= 400 ? 4 : 6;
  const charW = viewportW <= 400 ? 12.5 : 14;
  const needs = labels.map((l) => Math.round(l.length * charW + (viewportW <= 400 ? 22 : 34)));
  const slotW = Math.floor((usableW - gap * (count - 1)) / count);
  const minNeed = Math.max(...needs);
  const totalNeed = needs.reduce((a, b) => a + b, 0) + gap * (count - 1);

  // 估算自然换行需要的行数
  let wrapRows = 1;
  let acc = 0;
  for (let i = 0; i < count; i++) {
    if (acc > 0 && acc + gap + needs[i] > usableW) {
      wrapRows++;
      acc = needs[i];
    } else {
      acc += (acc > 0 ? gap : 0) + needs[i];
    }
  }

  let status = "ok";
  let verdict = "";
  let explain = "";
  if (count === 2) {
    status = "ok";
    verdict = "二元切换 · 轻快稳妥";
    explain = `2 个标签在 ${viewportW}px 下单槽宽达 ${slotW}px，完全合规；海报写「建议 3–5 个」是常见多视图经验区间，并非禁止 2 签。`;
  } else if (wrapRows > 1 || slotW < 58) {
    status = "bad";
    verdict = wrapRows > 1 ? `空间告急 · 折成 ${wrapRows} 排` : `严重挤压 · 单槽仅 ${slotW}px`;
    explain = `在 ${viewportW}px 宽下塞入 ${count} 个${verbose ? "长名" : "短名"}标签，单槽仅剩 ${slotW}px（低于约 68px 舒适区），强行单排会截断文字，换行则会酿成双排跳层。`;
  } else if (count > 5) {
    status = "warn";
    verdict = `超过 5 签 · 扫描负担升高`;
    explain = `虽然 ${viewportW}px 宽屏勉强能排成一行（单槽 ${slotW}px），但 ${count} 个同级入口已超出经验甜区（3–5 个），建议检查能否合并次级分类或改用侧边栏。`;
  } else if (slotW < 72) {
    status = "warn";
    verdict = `贴近下限 · 单槽 ${slotW}px`;
    explain = `勉强单排放下但手指热区偏紧；若换成更短的 2 字标签，或收减 1 项，触控余量会立刻舒展。`;
  } else {
    status = "ok";
    verdict = `落在经验甜区 · 单槽 ${slotW}px`;
    explain = `${count} 个简洁标签在 ${viewportW}px 里一眼看全，单槽 ${slotW}px 兼顾扫读节奏与点击准确度，正对应原海报底部的「良好示例」。`;
  }

  return { labels, usableW, slotW, minNeed, totalNeed, wrapRows, status, verdict, explain };
}

// 第 05 节：场景选型决策矩阵
export function evaluateDecision(flags) {
  // flags: { compare, sequential, many, thumbNav }
  if (flags.compare) {
    return {
      useTabs: false,
      target: "259",
      title: "别用标签页 → 改用「259 分屏布局」",
      url: "https://layout.xiaoxiaodong.ai/259/play/",
      reason: "标签页同一时刻只露出一块内容。一旦任务要求同时对照两份参数、价格或文档，用户只能在标签间来回猛点，短期记忆立刻过载；并排打开的分屏或对比表效率高得多。",
    };
  }
  if (flags.sequential) {
    return {
      useTabs: false,
      target: "261",
      title: "别用标签页 → 改用线性步骤条或「261 页眉—主体—页脚」单流表单",
      url: "https://layout.xiaoxiaodong.ai/261/play/",
      reason: "标签页天生暗示「平级、任意顺序都可点」。有严格先后依赖的结账、报名、审批流程放进标签页，会诱导用户跳步填错；应改用带明确进度的步骤条。",
    };
  }
  if (flags.many) {
    return {
      useTabs: false,
      target: "258",
      title: "别用水平标签 → 改用「258 侧边栏页面」或「267 列表—详情布局」",
      url: "https://layout.xiaoxiaodong.ai/258/play/",
      reason: "水平标签栏一旦超过 6–7 个就容易折行或靠滚动隐藏；分类较多、层级较深时用左侧目录树（258），动态条目清单则交给列表—详情（267）。",
    };
  }
  if (flags.thumbNav) {
    return {
      useTabs: false,
      target: "264",
      title: "移动端顶层频道 → 改用「264 底部导航布局」",
      url: "https://layout.xiaoxiaodong.ai/264/play/",
      reason: "手机上全应用的一级频道应该放在拇指最易够到的底栏（264），把页内标签留给进入某个频道之后的局部视图细分。",
    };
  }
  return {
    useTabs: true,
    target: "265",
    title: "正中靶心 → 就用「265 标签页布局」",
    url: "https://layout.xiaoxiaodong.ai/265/play/",
    reason: "3–5 组平级主题、无需同时并排对照、无先后步骤约束，又希望在有限空间内不离开当前上下文就能秒切视图——这正是标签页最能发挥威力的主场。",
  };
}

// 第 06 节：眼力小练习（四个选项严格只差一个结构变量，标签完全中性）
export const QUIZ_ITEMS = [
  {
    key: "A",
    correct: true,
    title: "方案 A",
    summary: "四枚简短单排标签，紫色当前标签底边与内容面板无缝连通，其余三枚退为柔和豆绿。",
    explain: "正确答案。4 个 2 字标签在 420px 内单排舒展（每槽约 95px），紫色当前标签直接融进内容区边框，图底关系明确，一秒就能认出当前位置与可切选项。",
  },
  {
    key: "B",
    correct: false,
    title: "方案 B",
    summary: "同样四枚简短单排标签与紫色高亮，但当前标签与内容框之间隔着一条实线和空隙。",
    explain: "差在「视觉连通」。把当前标签和内容面板硬切开后，顶排更像一串独立的筛选按钮或外链，减弱了「标签掌控下方整块面板」的档案夹归属感。",
  },
  {
    key: "C",
    correct: false,
    title: "方案 C",
    summary: "同样紫标连通与高对比配色，但每枚标签带上了完整业务前缀，在 420px 内折成了两排。",
    explain: "差在「命名与单排约束」。冗长标签撑破单行后折成两排，一旦用户点到上排，界面要么跳层重排打乱记忆，要么让上排页签隔着下排去遥控面板，体验崩坏。",
  },
  {
    key: "D",
    correct: false,
    title: "方案 D",
    summary: "同样四枚简短单排标签与无缝连通，但三枚未选中标签涂满深紫、当前标签反而留白灰。",
    explain: "差在「主次反差方向」。把多数未选中标签涂得最抢眼、把唯一当前标签降为淡灰，会导致视觉主次倒置，读者第一眼反而以为那三枚深紫标签才是选中态。",
  },
];
