// 268 辅助窗格布局 · 核心状态模型与诊断文案
// 所有位置、定宽 px、场景联动数据、展开方式与小练习诊断都在这里维护。

export const REF_VIEWPORT_PX = 1440;
export const SWEET_AUX_PX = 360; // M3 默认支撑窗格基准 360 dp（1440 px 桌面约占 25%）
export const MIN_COMFORT_PX = 260;
export const MAX_COMFORT_PX = 380;
export const COLLAPSE_PX = 76;
export const MAX_AUX_PX = 760; // ~53%（退化为对等分屏）
export const SWEET_RATIO = SWEET_AUX_PX / REF_VIEWPORT_PX;
export const MAX_RATIO = MAX_AUX_PX / REF_VIEWPORT_PX;

export const SCENARIOS = {
  analysis: {
    id: "analysis",
    label: "数据分析",
    en: "DATA ANALYSIS",
    auxTitle: "分析支撑窗格",
    series: [
      { label: "Q1", all: [0.32, 0.41, 0.37, 0.54, 0.58, 0.69, 0.76], filtered: [0.28, 0.38, 0.46, 0.56, 0.68, 0.74, 0.84] },
      { label: "柱图", barsAll: [0.38, 0.64, 0.88], barsFiltered: [0.56, 0.74, 0.94] },
      { label: "占比", pieAll: 0.72, pieFiltered: 0.85 },
    ],
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "核心付费口径", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "留存 · 同比", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "4 月改版抬升", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "点图表实时联动", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "3 份明细报表", interactive: true, dashed: true },
    ],
    focusItems: [
      {
        label: "主趋势线",
        auxKey: "notes",
        filterLabel: "仅看核心付费群体",
        filterOnNote: "已过滤：剔除 7 天试用样本，主曲线整体抬升并收敛波动。",
        filterOffNote: "当前展示全量样本；点此按钮，左侧折线与柱图会原地重算。",
        tags: ["自然月口径", "核心留存"],
        context: "次月留存连续 4 个周期爬升；所有周期均已剔除异常刷量设备，适合判断长期趋势。",
        relationTitle: "查看关联：4 月拐点归因（+11.4%）",
        relationTarget: 1,
      },
      {
        label: "4 月拐点数据点",
        auxKey: "notes",
        filterLabel: "仅看核心付费群体",
        filterOnNote: "付费群体在 4 月跃升更明显（+13.8%），验证改版命中高价值用户。",
        filterOffNote: "全量口径下 4 月跃升 +11.4%；可开启筛选复核付费群体表现。",
        tags: ["版本 #REL-403", "拐点归因"],
        context: "4 月 3 日上线精简版新手引导，首日完成率提升 19%，直接拉动当月次月留存跳涨。",
        relationTitle: "查看关联：分渠道柱图增量拆解",
        relationTarget: 2,
      },
      {
        label: "分渠道柱图",
        auxKey: "filter",
        filterLabel: "仅看核心付费群体",
        filterOnNote: "已筛出高留存付费渠道：移动端自然流量柱条升至 94%。",
        filterOffNote: "全量渠道柱图对比；开启筛选可立即隔离高付费渠道。",
        tags: ["iOS / Web", "渠道增量"],
        context: "移动端原生引导承接最稳，桌面端因注册表单步骤偏长，留存增速慢约 6 个百分点。",
        relationTitle: "查看关联：结构占比饼图（分母口径）",
        relationTarget: 3,
      },
      {
        label: "渠道结构饼图",
        auxKey: "relation",
        filterLabel: "仅看核心付费群体",
        filterOnNote: "付费口径下，主力渠道占比由 72% 扩大至 85%，头部集中度更高。",
        filterOffNote: "全量活跃结构中主力渠道占 72%；切换筛选可看付费集中度变化。",
        tags: ["分母说明", "结构占比"],
        context: "分母仅计入当月有至少 2 次有效会话的活跃账号，防止一次性访客稀释结构比例。",
        relationTitle: "回到关联：主趋势线整体走势",
        relationTarget: 0,
      },
    ],
  },
  browsing: {
    id: "browsing",
    label: "内容浏览",
    en: "CONTENT BROWSING",
    auxTitle: "阅读上下文窗格",
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅看引用批注", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "架构 · 响应式", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "术语边注释义", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "可折叠纯阅读", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "延伸章节出处", interactive: true, dashed: true },
    ],
    focusItems: [
      {
        label: "核心正文段",
        auxKey: "notes",
        filterLabel: "仅高亮含边注段落",
        filterOnNote: "已高亮正文中带文献出处的句子，其余段落降低对比度便于扫读。",
        filterOffNote: "当前为常规连续排版；点此可只突出带术语释义的段落。",
        tags: ["正文导读", "边注模式"],
        context: "读者顺着主列纵向阅读，只在遇到陌生术语时向右借一眼——像纸书页边注，读完视线立刻回位。",
        relationTitle: "查看关联：高亮术语句原出处",
        relationTarget: 1,
      },
      {
        label: "高亮术语句",
        auxKey: "tags",
        filterLabel: "仅高亮含边注段落",
        filterOnNote: "当前已锁定该句的原始论文索引与中英对照词条。",
        filterOffNote: "点击左侧任意高亮句，右侧边注自动切到对应释义。",
        tags: ["Excise 附加工", "1995 出处"],
        context: "Alan Cooper 在《About Face》中把与用户目标无关的弹窗开关动作称为「附加工（Excise）」。",
        relationTitle: "查看关联：下方案例插图注释",
        relationTarget: 2,
      },
      {
        label: "案例插图",
        auxKey: "filter",
        filterLabel: "仅高亮含边注段落",
        filterOnNote: "插图已切换为带标尺对照版本，方便核对主辅比例。",
        filterOffNote: "把图片出处与参数放进辅助窗格，正文就不必塞进冗长括号。",
        tags: ["图注参数", "原始来源"],
        context: "图示对比了 1981 年 Xerox Star 属性表与现代右侧检查器的非模态演进。",
        relationTitle: "查看关联：文末延伸章节",
        relationTarget: 3,
      },
      {
        label: "延伸结论卡",
        auxKey: "relation",
        filterLabel: "仅高亮含边注段落",
        filterOnNote: "仅保留本节核心结论与延伸链接，过滤掉背景铺垫。",
        filterOffNote: "正文收尾处由右侧承接延伸阅读，不打断当前文章节奏。",
        tags: ["延伸目录", "相关版式"],
        context: "相关延伸：若两列需要平级对照阅读，请参考 259 分屏布局而非辅助窗格。",
        relationTitle: "回到关联：核心正文段",
        relationTarget: 0,
      },
    ],
  },
  creation: {
    id: "creation",
    label: "编辑创作",
    en: "CONTENT CREATION",
    auxTitle: "属性检查器",
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅看选中层", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "12 列 · 间距 16", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "已对齐规范", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "改完实时生效", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "4 处复用实例", interactive: true, dashed: true },
    ],
    focusItems: [
      {
        label: "主视觉画板",
        auxKey: "notes",
        filterLabel: "仅显示改动过的属性",
        filterOnNote: "检查器已收起未修改参数，并将画板扩展到宽画幅预览态。",
        filterOffNote: "选中画布图层后右侧实时生效，无需开关遮挡画面的模态设置框。",
        tags: ["12 列栅格", "安全边距 24px"],
        context: "当前画板开启中心吸附参考线，缩放画布时右侧检查器保持 360 px 定宽不随画布变形。",
        relationTitle: "查看关联：画板锚点坐标参数",
        relationTarget: 1,
      },
      {
        label: "对象角点锚点",
        auxKey: "tags",
        filterLabel: "仅显示改动过的属性",
        filterOnNote: "已开启像素级对齐约束，锚点贴合 8 px 网格。",
        filterOffNote: "点选对象锚点可微调圆角、描边与居中约束。",
        tags: ["X: 160 · Y: 92", "8px 网格"],
        context: "锚点缩放采用比例锁定，确保在宽屏与平板预览下边距节奏保持一致。",
        relationTitle: "查看关联：样式色板组件",
        relationTarget: 2,
      },
      {
        label: "柱形样式组件",
        auxKey: "filter",
        filterLabel: "仅显示改动过的属性",
        filterOnNote: "已预览高对比样式变体，左侧组件同步刷新。",
        filterOffNote: "只列出当前选中组件支持的属性，隐藏无关选项避免面板过长。",
        tags: ["Token: sage", "圆角 6px"],
        context: "该柱形组件绑定主题变量，修改描边或填充会同步到同页全部子实例。",
        relationTitle: "查看关联：4 处复用实例清单",
        relationTarget: 3,
      },
      {
        label: "复用实例组",
        auxKey: "relation",
        filterLabel: "仅显示改动过的属性",
        filterOnNote: "仅高亮已覆盖局部参数的实例，便于批量核查。",
        filterOffNote: "右侧虚线关联区提示影响范围，改动前就能心里有数。",
        tags: ["主组件同步", "4 处引用"],
        context: "当前母版被移动端卡片、宽屏摘要与导出海报 4 处复用，修改后一键同步。",
        relationTitle: "回到关联：主视觉画板",
        relationTarget: 0,
      },
    ],
  },
  settings: {
    id: "settings",
    label: "设置管理",
    en: "SETTINGS & CONFIG",
    auxTitle: "影响与校验窗格",
    auxItems: [
      { key: "filter", zh: "筛选", en: "FILTER", desc: "仅看已改动项", interactive: true },
      { key: "tags", zh: "标签", en: "TAGS", desc: "生产 · 需复核", interactive: true },
      { key: "notes", zh: "备注", en: "NOTES", desc: "影响 18 名成员", interactive: true },
      { key: "tips", zh: "提示", en: "TIPS", desc: "保存前核对范围", interactive: false },
      { key: "relation", zh: "关联", en: "RELATION", desc: "认证与日志模块", interactive: true, dashed: true },
    ],
    focusItems: [
      {
        label: "策略开关列表",
        auxKey: "notes",
        filterLabel: "仅看本次已修改规则",
        filterOnNote: "已激活第 3 条待审核开关，右侧同步汇总全部待保存变更。",
        filterOffNote: "后台配置最怕误改线上策略；右侧常驻生效范围预览，改前即可防错。",
        tags: ["生产环境", "需双人复核"],
        context: "本次改动涉及发布审批与数据导出两条核心规则，提交后将于下个整点生效。",
        relationTitle: "查看关联：当前选中开关影响面",
        relationTarget: 1,
      },
      {
        label: "高风险审批开关",
        auxKey: "tags",
        filterLabel: "仅看本次已修改规则",
        filterOnNote: "已模拟开启严格校验：18 名协作成员需绑定二次验证。",
        filterOffNote: "将高风险提示紧贴右侧同屏显示，比保存后再弹报错框友好得多。",
        tags: ["影响 18 人", "不可逆告警"],
        context: "关闭双人复核后，项目成员可直接推送至公开站点；建议仅在内部测试分支放开。",
        relationTitle: "查看关联：配额柱形监控",
        relationTarget: 2,
      },
      {
        label: "调用配额概览",
        auxKey: "filter",
        filterLabel: "仅看本次已修改规则",
        filterOnNote: "已按新配额上限重算，峰值利用率降至安全区间。",
        filterOffNote: "在左侧调限额、右侧看依赖服务余量，免去多标签页来回切。",
        tags: ["配额校验", "依赖检查"],
        context: "当前 API 限流阈值尚余 34% 缓冲，调高并发时需同步检查审计队列容量。",
        relationTitle: "查看关联：依赖的审计与日志模块",
        relationTarget: 3,
      },
      {
        label: "审计模块占比",
        auxKey: "relation",
        filterLabel: "仅看本次已修改规则",
        filterOnNote: "已把待变更项映射到审计日志字段，确保变更留痕。",
        filterOffNote: "虚线关联框列出上下游依赖模块，防止改一处漏一处。",
        tags: ["上游认证", "审计留痕"],
        context: "依赖模块：单点登录（SSO）与变更审计日志；两者均已开启 90 天留存。",
        relationTitle: "回到关联：策略开关列表",
        relationTarget: 0,
      },
    ],
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function snapAuxPx(rawPx) {
  const v = clamp(rawPx, 0, MAX_AUX_PX);
  if (v < COLLAPSE_PX) return { auxPx: 0, collapsed: true, snapped: true };
  if (Math.abs(v - SWEET_AUX_PX) <= 28) return { auxPx: SWEET_AUX_PX, collapsed: false, snapped: true };
  return { auxPx: Math.round(v), collapsed: false, snapped: false };
}

export function describeWidth(auxPx, collapsed) {
  const px = collapsed || auxPx <= 0 ? 0 : Math.round(auxPx);
  const mainPx = REF_VIEWPORT_PX - px;
  const auxPct = px === 0 ? 0 : Math.round((px / REF_VIEWPORT_PX) * 100);
  const mainPct = 100 - auxPct;

  if (px === 0) {
    return {
      status: "collapsed",
      badge: "已折叠 · 专注态",
      auxPx: 0,
      mainPx: REF_VIEWPORT_PX,
      auxPct: 0,
      mainPct: 100,
      title: "纯专注态：窗格退为虚线占位",
      text: "正如海报底部 TIP 所说：辅助窗格按需出现，折叠后退为虚线占位，把全部 1440 px 宽度还给主内容。",
      whyFixed: "需要筛选、核对口径或查关联时再一键唤出到 360 px 定宽，进退都不打乱主任务节奏。",
    };
  }
  if (px < MIN_COMFORT_PX) {
    return {
      status: "narrow",
      badge: "偏窄 · 易折行",
      auxPx: px,
      mainPx,
      auxPct,
      mainPct,
      title: "低于 260 px 下限：控件开始拥挤",
      text: `虽然主区很宽敞（${mainPx} px），但辅助窗格窄于 260 px 下限——筛选标签与备注被迫折成细条，扫视反而费劲。`,
      whyFixed: "定宽策略的意义之一就是守住 260 px 可读底线：比这还窄时，不如直接折叠成虚线入口。",
    };
  }
  if (px <= MAX_COMFORT_PX) {
    return {
      status: "sweet",
      badge: "主次成立",
      auxPx: px,
      mainPx,
      auxPct,
      mainPct,
      title: "定宽舒适区：主次层级稳固",
      text: `主内容弹性获得 ${mainPx} px（${mainPct}%），辅助窗格落在 260–380 px 经验区间（360 px 为 M3 推荐基准），一眼先落主区，右扫即拿支撑。`,
      whyFixed: "为什么定宽比死绑百分比更稳？控件字号和输入行宽需要稳定像素（约 260–380 px）；死绑比例在窄屏会挤碎控件、在超宽屏又会撑出空洞。",
    };
  }
  if (px <= 560) {
    return {
      status: "heavy",
      badge: "略显偏重",
      auxPx: px,
      mainPx,
      auxPct,
      mainPct,
      title: "超过 380 px：右栏出现冗余留白",
      text: `超过 380 px 后，筛选和备注并不会变得更好读，反而多出大片空白并把主区挤回 ${mainPx} px，眼睛横扫距离变长。`,
      whyFixed: "若按百分比写死 30%–35%，在 1920/2560 px 大屏上就会自动膨胀到这里；锁在 360 px 左右才能把多余屏宽全留给主区。",
    };
  }
  return {
    status: "hijack",
    badge: "喧宾夺主",
    auxPx: px,
    mainPx,
    auxPct,
    mainPct,
    title: "接近对等分屏：主次边界瓦解",
    text: `主区 ${mainPx} px 与辅助 ${px} px 几乎势均力敌，主次层级彻底瓦解——你做出的已经是对等分屏，而不是辅助窗格。`,
    whyFixed: "若两侧内容本来就平级对照，改用 259 分屏布局；否则把辅助窗格拉回 260–380 px 定宽区（约 360 px 处会轻吸附）。",
  };
}

// 第 03 节：视口宽度 × 策略（定宽 360px vs 死绑比例 32%）× 视觉噪声
export function describeStress(viewportW, mode, noisy) {
  const actualAux = mode === "fixed"
    ? Math.min(360, Math.round(viewportW * 0.48))
    : Math.round(viewportW * 0.32);
  const mainPx = viewportW - actualAux;
  const auxPct = Math.round((actualAux / viewportW) * 100);
  const mainPct = 100 - auxPct;

  let status = "good";
  let badge = "定宽弹性 · 推荐";
  let verdict = "";

  if (viewportW < 840) {
    status = "warn";
    badge = "屏宽不足 840px";
    verdict = `在 ${viewportW} px 宽的屏幕上硬并排，主内容只剩 ${mainPx} px（${mainPct}%），辅助窗格占了 ${auxPct}%——两栏互相挤压。按 Material Design 3 的经验门槛，低于 840 dp 应停止常驻并列，改为折叠浮层或底部抽屉。`;
  } else if (mode === "ratio" && viewportW >= 1800) {
    status = "warn";
    badge = "超宽屏虚胖";
    verdict = `死绑 32% 比例在 ${viewportW} px 超宽屏上会把辅助窗格撑到 ${actualAux} px！短短几行筛选与备注被拉出大片空洞，眼睛从主区到右栏来回扫视距离过长。改为定宽（约 360 px）能把多余宽屏全还给主内容。`;
  } else if (noisy) {
    status = "warn";
    badge = "视觉抢戏";
    verdict = `虽然宽度只有 ${actualAux} px（占 ${auxPct}%），但右栏塞满高饱和角标、红点和推广卡片，视觉重量立刻压过主区——既打断专注，也容易触发 NN/g 警告的「右栏盲视（Right-Rail Blindness）」。`;
  } else if (mode === "fixed") {
    status = "good";
    badge = "定宽弹性 · 推荐";
    verdict = `辅助窗格稳稳守在 ${actualAux} px（当前占 ${auxPct}%，吻合 M3 推荐的 360 dp 基准），其余 ${mainPx} px 全部留给主内容弹性伸展；加上同色系低噪处理，越宽的屏幕主任务越舒展。`;
  } else {
    status = "ok";
    badge = "常规屏尚可";
    verdict = `在 ${viewportW} px 常规桌面宽下，32% 约合 ${actualAux} px，暂时看起来还能用；但把滑块拖向 2000 px 以上或 840 px 以下，就能立刻看出死绑比例在两端失衡的问题。`;
  }

  return { auxPx: actualAux, mainPx, auxPct, mainPct, status, badge, verdict };
}

// 第 04 节：固定宽度下对比三种展开方式（Push / Overlay / Bottom Sheet）
export function describePresentation(mode, open) {
  if (!open) {
    return {
      mode,
      open: false,
      badge: "已收起 · 满宽主区",
      reflow: { value: "静止待命", tone: "neutral" },
      occlusion: { value: "0% 遮挡", tone: "good" },
      thumb: { value: "仅留开关入口", tone: "neutral" },
      title: "当前处于收起态：点「展开辅助窗格」对比三种入场代价",
      text: "收起时三种方式都把 100% 宽度留给主内容。真正的分水岭发生在点击展开的那一瞬间——是挤窄主区、盖住一角，还是从底缘托起？",
    };
  }
  if (mode === "push") {
    return {
      mode: "push",
      open: true,
      badge: "推挤 Push · 会重排",
      reflow: { value: "会重排（3列→2列）", tone: "warn" },
      occlusion: { value: "0% 遮挡", tone: "good" },
      thumb: { value: "鼠标顺手 · 拇指偏远", tone: "mid" },
      title: "推挤（Push）：牺牲主区宽度换取零遮挡，但会触发排版重排",
      text: "窗格贴右侧推入并挤窄主区，三列卡片立刻重排成两列、表格列宽收缩、视线坐标跳动。适合桌面宽屏上需要长时间边改边对照的工作台，不适合频繁秒开秒关。",
    };
  }
  if (mode === "overlay") {
    return {
      mode: "overlay",
      open: true,
      badge: "浮层 Overlay · 零重排",
      reflow: { value: "零重排（主区纹丝不动）", tone: "good" },
      occlusion: { value: "约 34% 右侧遮挡", tone: "warn" },
      thumb: { value: "横屏平板尚可 · 手机偏远", tone: "mid" },
      title: "浮层（Overlay）：主区零抖动，用临时遮挡换回稳态排版",
      text: "辅助窗格带投影盖在主区右缘约 34% 上方，左侧图表和表格列数纹丝不动、读到哪一行不会跳丢。适合宽表格、画布和临界窄桌面里「查完即收」的短时支撑。",
    };
  }
  return {
    mode: "sheet",
    open: true,
    badge: "底部抽屉 · 拇指直达",
    reflow: { value: "横向零重排", tone: "good" },
    occlusion: { value: "约 44% 底部遮挡", tone: "mid" },
    thumb: { value: "单手拇指直达 ✓", tone: "good" },
    title: "底部抽屉（Bottom Sheet）：保住顶部主视区，控件全落进拇指热区",
    text: "抽屉从底缘上滑，横向完全不挤压主内容，顶部核心图表与标题依然清晰可见，筛选和备注全部落在单手大拇指轻松够得着的下半区——这是触屏与手机端最稳妥的展开方式。",
  };
}

// 第 07 节：小练习（文档评审页四套方案，四张均带收起入口、无自曝文字，D 为唯一成立项）
export const QUIZ_OPTIONS = {
  A: {
    correct: false,
    tag: "弹模态框遮挡",
    title: "A 违反了非模态原则与「按需折叠（TIP）」",
    text: "宽度、位置与批注内容都合拍，但点「收起」时会弹出居中模态确认框把主文档压暗盖住——把一次轻量的折叠做成了打断主任务的「附加工」。辅助窗格的收起与展开应当原地即时完成，绝不遮挡正文。",
  },
  B: {
    correct: false,
    tag: "徽标噪声抢戏",
    title: "B 违反了第一条原则「主次分明（HIERARCHY）」",
    text: "底色、宽度与批注内容本身都没问题，但右栏在浅豆绿底上叠加了三枚高饱和红、琥珀色计数与状态徽标（「12」「高优」「待办 3」）。即使窗格占比不大，这些高对比徽标依然会把视线从平静的正文拽向右侧，干扰主任务阅读。",
  },
  C: {
    correct: false,
    tag: "放左侧抢导航",
    title: "C 违反了「主次分明」与「保持关联（CONNECTED）」",
    text: "窗格宽度克制、视觉安静也有收起入口，却被塞在了左侧全局目录和主文档之间。读者从左到右扫描时必须先跨过次要批注才能落到正文，既和前置导航抢占左边缘，也打乱了「导航 → 主内容 → 尾侧支撑」的阅读路径。",
  },
  D: {
    correct: true,
    tag: "最成立",
    title: "选对了！D 守齐了主次、低噪、位置与非模态原则",
    text: "正文居左占据视觉重心，尾侧辅助窗格定宽克制、没有多余高饱和徽标（主次分明）；只承接当前条款 §2.3 的批注、术语口径与虚线关联需求（信息互补）；留在尾侧不抢左侧导航位，且顶栏收起可原地即时完成、不弹模态框遮挡正文（保持关联与按需折叠）。",
  },
};
