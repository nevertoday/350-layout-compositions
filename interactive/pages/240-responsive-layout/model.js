// 240 响应式布局 · 共享计算模型（零 DOM 依赖）
// 所有开场三端设备状态、断点标尺内容分区、吸附与诊断读数、以及正文各节实验的数值均从此单一数据源算出。

export const RULER_MIN = 320;
export const RULER_MAX = 1440;
export const BP_MIN_GAP = 80; // 两把断点切刀之间最小间距，避免叠在一起看不清

// 三端共用同一套页面内边距与栅格间隙，确保公式算出的内容分区与各设备单卡实测宽度严格同源
export const LAYOUT_PAD = 20;
export const LAYOUT_GAP = 16;

// 初始故意处于「断点偏离内容」的事故态：不先给答案
export const INITIAL_STATE = {
  bp1: 340, // 远低于内容 2 列最小宽，让 375px 测试点被迫排 2 列挤碎
  bp2: 1320, // 远高于内容 2 列舒适上限，让 1200px 测试点只排 2 列、单卡过宽且收起导航
  preset: "poster",
  wireframe: false,
  activeDevice: "mobile", // 手机竖屏默认先检视正在出事故的 375px 测试点
};

// 三台真实视口只作为标尺上的「抽样测试点」，绝不参与布局规则分支
export const DEVICES = [
  {
    id: "desktop",
    name: "桌面测试点",
    shortName: "桌面",
    en: "DESKTOP",
    width: 1200,
    accent: "green",
  },
  {
    id: "tablet",
    name: "平板测试点",
    shortName: "平板",
    en: "TABLET",
    width: 768,
    accent: "blue",
  },
  {
    id: "mobile",
    name: "手机测试点",
    shortName: "移动",
    en: "MOBILE",
    width: 375,
    accent: "blue",
  },
];

export const CONTENT_PRESETS = {
  poster: {
    id: "poster",
    label: "原海报 3 卡",
    shortLabel: "原海报",
    brand: "Brand.",
    nav: ["首页", "产品", "服务", "关于", "联系"],
    headline: ["高效协作", "驱动增长"],
    headlineInline: "高效协作 驱动增长",
    lead: "统一的设计系统，灵活的布局机制，让内容在不同设备上都有最佳体验。",
    cta: "了解更多",
    wideCols: 3,
    minCardPx: 250, // 原海报三卡每张至少 250px，标题与短述才不致折碎成竖条
    maxCardPx: 480, // 2 列时单卡超过 480px 会拉得过宽、横向空间空转
    maxSingleInnerPx: 640, // 1 列内容区超过 640px（视口 > 680px）时导语超过约 42 字/行
    minFullNavPx: 820, // 完整 5 项导航 + 主按钮同行不挤的最小视口宽
    recommendedBp1: 600,
    recommendedBp2: 920,
    cards: [
      { shape: "circle", color: "green", title: "数据分析", desc: "可视化洞察，辅助决策" },
      { shape: "square", color: "blue", title: "团队协作", desc: "实时同步，高效沟通" },
      { shape: "triangle", color: "ink", title: "安全可靠", desc: "多重防护，稳定运行" },
    ],
  },
  dense: {
    id: "dense",
    label: "长文案加压",
    shortLabel: "长文案",
    brand: "Brand.",
    nav: ["产品总览", "企业方案", "客户案例", "开发文档", "定价策略"],
    headline: ["跨端实时协作", "驱动研发增长"],
    headlineInline: "跨端实时协作 · 驱动研发增长",
    lead: "当业务标题变长、导航增至四字时，每张卡片所需最小宽上升，标尺上的内容安全带会整体右移。",
    cta: "预约团队演示",
    wideCols: 3,
    minCardPx: 310, // 长标题与完整双行说明需要更宽的单卡空间
    maxCardPx: 540,
    maxSingleInnerPx: 700,
    minFullNavPx: 960,
    recommendedBp1: 700,
    recommendedBp2: 1060,
    cards: [
      { shape: "circle", color: "green", title: "实时指标看板", desc: "跨端同步核心漏斗与异常告警，辅助一线快速决策" },
      { shape: "square", color: "blue", title: "多端文档协同", desc: "多人并行评审稿件与设计规范，变更历史自动留痕" },
      { shape: "triangle", color: "ink", title: "分级权限审计", desc: "细粒度角色管控与端到端加密，保障交付安全可靠" },
    ],
  },
  quad: {
    id: "quad",
    label: "扩展 4 卡",
    shortLabel: "4卡",
    brand: "Brand.",
    nav: ["首页", "产品", "服务", "关于", "联系"],
    headline: ["高效协作", "驱动增长"],
    headlineInline: "高效协作 驱动增长",
    lead: "卡片扩成四项精简功能后，两列天然排成 2×2、宽屏排成 4 列，内容驱动的切列安全带随之改写。",
    cta: "了解更多",
    wideCols: 4,
    minCardPx: 210, // 四张短卡片每张最小容宽略低，但 4 列总宽要求更高
    maxCardPx: 490,
    maxSingleInnerPx: 600,
    minFullNavPx: 820,
    recommendedBp1: 560,
    recommendedBp2: 980,
    cards: [
      { shape: "circle", color: "green", title: "数据分析", desc: "可视化洞察，辅助决策" },
      { shape: "square", color: "blue", title: "团队协作", desc: "实时同步，高效沟通" },
      { shape: "triangle", color: "ink", title: "安全可靠", desc: "多重防护，稳定运行" },
      { shape: "diamond", color: "green", title: "开放接口", desc: "标准组件，按需接入" },
    ],
  },
};

// 按当前内容参数直接反推两道「内容驱动安全带」：
// - 2 列安全带：[2 列最早可切宽, 1 列行宽舒适上限]
// - 宽屏多列安全带：[wideCols 列最早可切宽, 2 列单卡舒适上限]
export function computeContentZones(preset) {
  const minBp1 = 2 * preset.minCardPx + LAYOUT_GAP + LAYOUT_PAD * 2;
  const maxBp1 = preset.maxSingleInnerPx + LAYOUT_PAD * 2;
  const minBp2ByCards = preset.wideCols * preset.minCardPx + (preset.wideCols - 1) * LAYOUT_GAP + LAYOUT_PAD * 2;
  const minBp2 = Math.max(minBp2ByCards, preset.minFullNavPx);
  const maxBp2 = 2 * preset.maxCardPx + LAYOUT_GAP + LAYOUT_PAD * 2;
  return {
    minBp1,
    maxBp1,
    minBp2,
    maxBp2,
    wideCols: preset.wideCols,
  };
}

export function clampBreakpoints(bp1, bp2) {
  let a = Math.round(Math.max(RULER_MIN + 10, Math.min(RULER_MAX - BP_MIN_GAP - 10, bp1)));
  let b = Math.round(Math.max(RULER_MIN + BP_MIN_GAP + 10, Math.min(RULER_MAX - 10, bp2)));
  if (b - a < BP_MIN_GAP) {
    if (a + BP_MIN_GAP <= RULER_MAX - 10) b = a + BP_MIN_GAP;
    else a = b - BP_MIN_GAP;
  }
  return { bp1: a, bp2: b };
}

// 轻吸附只吸向「由当前内容算出的安全带边缘与推荐值」，不再吸附固定机型像素
export function snapBreakpoint(val, kind, other, presetId = "poster") {
  const preset = CONTENT_PRESETS[presetId] || CONTENT_PRESETS.poster;
  const zones = computeContentZones(preset);
  const targets =
    kind === "bp1"
      ? [zones.minBp1, preset.recommendedBp1]
      : [zones.minBp2, preset.recommendedBp2];
  let out = val;
  for (const t of targets) {
    if (Math.abs(val - t) <= 18) {
      out = t;
      break;
    }
  }
  return kind === "bp1"
    ? clampBreakpoints(out, other).bp1
    : clampBreakpoints(other, out).bp2;
}

// 导航形态单一数据源：画面渲染、角标、单设备读数与总诊断文案全部从此表读取，绝不各自硬编码
export const NAV_SPECS = {
  full: {
    mode: "full",
    showInlineLinks: true,
    showCtaDot: true,
    showBurger: false,
    collapsed: false,
    label: "完整导航",
    reasonClause: "完整导航展开",
  },
  compact: {
    mode: "compact",
    showInlineLinks: false,
    showCtaDot: false,
    showBurger: true,
    collapsed: true,
    label: "导航已收起",
    reasonClause: "导航收进菜单",
  },
  burger: {
    mode: "burger",
    showInlineLinks: false,
    showCtaDot: false,
    showBurger: true,
    collapsed: true,
    label: "导航已收起",
    reasonClause: "导航收进折叠菜单",
  },
};

// 依据真实视口宽度与两道断点，按完全统一的 CSS 规则计算版式与可读性诊断
// 关键原则：绝不读取 device.id 做特殊分支，落在同一断点区间的设备永远套用同一套 CSS 规则
export function evaluateDevice(device, bp1, bp2, preset) {
  const w = device.width;
  // 真实 Mobile-First 媒体查询：
  // 默认 1 列；@media (min-width: bp1) 切 2 列；@media (min-width: bp2) 切 wideCols 列并展开完整导航
  const tier = w >= bp2 ? "wide" : w >= bp1 ? "mid" : "narrow";
  const cols = tier === "wide" ? preset.wideCols : tier === "mid" ? 2 : 1;
  const navMode = tier === "wide" ? "full" : tier === "mid" ? "compact" : "burger";
  const nav = NAV_SPECS[navMode];
  const heroDir = tier === "narrow" ? "stack" : "row";

  // 同一规则作用于所有落入 mid（2 列）区间的视口：3 张卡时统一首卡跨两列（grid-column: 1 / -1），4 张卡时自然 2×2
  const cardCount = preset.cards.length;
  const leadSpansFull = tier === "mid" && cardCount === 3;

  const innerW = w - LAYOUT_PAD * 2;
  const cardWidthPx = Math.round((innerW - LAYOUT_GAP * (cols - 1)) / cols);
  // 模拟 14px 中文正文（扣除卡片左右内边距 28px）的单行汉字容纳数
  const cardTextW = Math.max(40, cardWidthPx - 28);
  const charsPerLine = Math.max(3, Math.floor(cardTextW / 14));
  // 首屏导语单行字数估算
  const bodyLineChars = Math.round((heroDir === "stack" ? innerW : innerW * 0.48) / 15);

  const cardsCramped = cols > 1 && cardWidthPx < preset.minCardPx;
  const navCramped = !nav.collapsed && w < preset.minFullNavPx;
  const singleTooWide = cols === 1 && innerW > preset.maxSingleInnerPx;
  const multiTooWide = cols === 2 && cardWidthPx > preset.maxCardPx;

  let status = "ok";
  let badge = `${cols} 列 · 舒展`;
  let statText = `单卡 ${cardWidthPx}px · 约 ${charsPerLine} 字/行 · ${nav.label}`;
  let reason = "";

  if (cardsCramped || navCramped) {
    status = "error";
    badge = cardsCramped ? `${cols} 列 · 单卡挤碎` : "顶栏挤爆";
    if (cardsCramped && navCramped) {
      statText = `单卡 ${cardWidthPx}px（低于 ${preset.minCardPx}px）· ${nav.label}过挤`;
      reason = `在 ${w}px 排 ${cols} 列时，单卡仅剩 ${cardWidthPx}px（每行约 ${charsPerLine} 字），低于 ${preset.minCardPx}px 下限，且${nav.label}在顶栏空间不足。`;
    } else if (cardsCramped) {
      statText = `单卡 ${cardWidthPx}px（低于 ${preset.minCardPx}px）· 约 ${charsPerLine} 字/行 · ${nav.label}`;
      reason = `在 ${w}px 排 ${cols} 列时，单卡仅剩 ${cardWidthPx}px（每行约 ${charsPerLine} 字），低于这套内容所需的 ${preset.minCardPx}px 下限，卡片被压成竖条（${nav.label}）。`;
    } else {
      statText = `${nav.label}需 ≥ ${preset.minFullNavPx}px · 顶栏空间不足`;
      reason = `在 ${w}px 里同时展开${nav.label}与主按钮（至少需 ${preset.minFullNavPx}px），顶栏空间透支。`;
    }
  } else if (singleTooWide) {
    status = "warn";
    badge = "1 列 · 行宽过长";
    statText = `单列 ${cardWidthPx}px（约 ${bodyLineChars} 字/行过长）· ${nav.label}`;
    reason = `${w}px 仍停在单列，单卡与导语被拉宽到 ${cardWidthPx}px（约 ${bodyLineChars} 字/行），超出舒适阅读行宽上限，且${nav.label}。`;
  } else if (multiTooWide) {
    status = "warn";
    badge = "2 列 · 单卡过宽";
    statText = `单卡 ${cardWidthPx}px（超 ${preset.maxCardPx}px）· ${nav.label}`;
    reason = `${w}px 只排 2 列，单卡拉宽到 ${cardWidthPx}px（超过 ${preset.maxCardPx}px 上限，约 ${charsPerLine} 字/行），且${nav.collapsed ? "导航被迫收起" : nav.label}。`;
  } else {
    status = "ok";
    statText = `单卡 ${cardWidthPx}px · 约 ${charsPerLine} 字/行 · ${nav.label}`;
    if (tier === "wide") {
      badge = `${cols} 列 · 完整展示`;
      reason = `单卡 ${cardWidthPx}px（≥ ${preset.minCardPx}px，约 ${charsPerLine} 字/行），${nav.label}与左文右图舒展呈现。`;
    } else if (tier === "mid") {
      badge = leadSpansFull ? "2 列 · 首卡置顶" : "2 列 · 齐平舒展";
      reason = leadSpansFull
        ? `单卡 ${cardWidthPx}px（落在 ${preset.minCardPx}–${preset.maxCardPx}px 舒适区），首卡跨两列置顶，${nav.reasonClause}。`
        : `四张卡片天然排成 2×2（单卡 ${cardWidthPx}px），节奏规整，${nav.reasonClause}。`;
    } else {
      badge = "1 列 · 垂直聚焦";
      reason = `${nav.reasonClause}，单卡占满 ${cardWidthPx}px（行宽适中），上下流畅阅读无横向滚动。`;
    }
  }

  return {
    ...device,
    tier,
    cols,
    navMode,
    nav,
    heroDir,
    cardWidthPx,
    charsPerLine,
    bodyLineChars,
    leadSpansFull,
    cardsCramped,
    navCramped,
    multiTooWide,
    singleTooWide,
    status,
    badge,
    statText,
    reason,
  };
}

export function evaluateAll(bp1, bp2, presetId = "poster") {
  const preset = CONTENT_PRESETS[presetId] || CONTENT_PRESETS.poster;
  const zones = computeContentZones(preset);
  const results = DEVICES.map((d) => evaluateDevice(d, bp1, bp2, preset));
  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  const okCount = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error");
  const warns = results.filter((r) => r.status === "warn");

  const bp1InZone = bp1 >= zones.minBp1 && bp1 <= zones.maxBp1;
  const bp2InZone = bp2 >= zones.minBp2 && bp2 <= zones.maxBp2;

  let tone = "ok";
  let headline = "";
  let explanation = "";

  if (errors.length > 0) {
    tone = "error";
    const firstErr = errors[0];
    if (errors.length === 1 && warns.length > 0) {
      const wDev = warns[0];
      const wNavClause = wDev.nav.collapsed ? " 且导航被迫收起" : "";
      headline = `${firstErr.width}px 单卡挤碎，${wDev.width}px ${wDev.multiTooWide ? "单卡过宽" : "行宽过长"}（${okCount}/3 测试点过关）`;
      explanation = `${firstErr.width}px 处硬排 ${firstErr.cols} 列，单卡缩至 ${firstErr.cardWidthPx}px（每行仅约 ${firstErr.charsPerLine} 字），低于当前内容所需的 ${preset.minCardPx}px 下限，文字被压成竖条；同时 ${wDev.width}px 只排 ${wDev.cols} 列，单卡拉宽到 ${wDev.cardWidthPx}px${wNavClause}。把蓝刀拖入 2 列内容安全带（${zones.minBp1}–${zones.maxBp1}px）、绿刀拖入 ${zones.wideCols} 列安全带（${zones.minBp2}–${zones.maxBp2}px）。`;
    } else if (errors.length >= 2) {
      headline = `${errors.map((e) => `${e.width}px`).join(" 与 ")} 单卡低于内容下限（${okCount}/3 测试点过关）`;
      explanation = `${firstErr.reason} 当前内容至少需要 ${zones.minBp1}px 才够排 2 列、${zones.minBp2}px 才够排 ${zones.wideCols} 列；把两把切刀移回标尺上的浅色内容安全带。`;
    } else {
      headline = `${firstErr.width}px 处卡片被撑破（${okCount}/3 测试点过关）`;
      explanation = `${firstErr.reason} 这套内容最早要到 ${firstErr.cols === 2 ? zones.minBp1 : zones.minBp2}px 才能撑住 ${firstErr.cols} 列不挤碎，请把对应切刀向右移进浅色安全带。`;
    }
  } else if (warns.length > 0) {
    tone = "warn";
    const wDev = warns[0];
    if (wDev.multiTooWide) {
      headline = `${wDev.width}px 只排 2 列，单卡过宽${wDev.nav.collapsed ? `且${wDev.nav.label}` : ""}（${okCount}/3 测试点过关）`;
      explanation = `${wDev.reason} 绿刀 BP2 (${bp2}px) 设得高于 2 列舒适上限 ${zones.maxBp2}px；把它向左拖进 ${zones.wideCols} 列内容安全带（${zones.minBp2}–${zones.maxBp2}px），宽屏即可展开${NAV_SPECS.full.label}与 ${zones.wideCols} 列。`;
    } else {
      headline = `${wDev.width}px 停在单列，阅读行宽过长（${okCount}/3 测试点过关）`;
      explanation = `${wDev.reason} 蓝刀 BP1 (${bp1}px) 晚于单列行宽上限 ${zones.maxBp1}px；把它向左拖进 2 列内容安全带（${zones.minBp1}–${zones.maxBp1}px），让内容在拉长前及时切入两列。`;
    }
  } else {
    tone = "ok";
    if (bp1InZone && bp2InZone) {
      headline = `三处测试点全部过关，切刀稳落内容安全带（3/3）`;
      explanation = `所有测试点单卡宽均 ≥ ${preset.minCardPx}px 且行宽不过长：375px 单列聚焦（${byId.mobile.cardWidthPx}px，${byId.mobile.nav.label}）、768px 两列舒展（${byId.tablet.cardWidthPx}px，${byId.tablet.nav.label}）、1200px 展开 ${byId.desktop.cols} 列（${byId.desktop.cardWidthPx}px，${byId.desktop.nav.label}）。试着切换「长文案加压」或「扩展 4 卡」，看内容安全带如何跟着移动。`;
    } else {
      headline = `三处测试点过关（3/3），但切刀略偏内容安全带`;
      const tips = [];
      if (bp1 < zones.minBp1) tips.push(`BP1 (${bp1}px) 低于 2 列下限 ${zones.minBp1}px，遇到 ${bp1}–${zones.minBp1 - 1}px 窗口仍会挤碎`);
      if (bp2 < zones.minBp2) tips.push(`BP2 (${bp2}px) 低于 ${zones.wideCols} 列下限 ${zones.minBp2}px，遇到 ${bp2}–${zones.minBp2 - 1}px 窗口仍会挤碎`);
      if (bp1 > zones.maxBp1) tips.push(`BP1 (${bp1}px) 略晚于 1 列行宽上限 ${zones.maxBp1}px`);
      if (bp2 > zones.maxBp2) tips.push(`BP2 (${bp2}px) 略晚于 2 列单卡上限 ${zones.maxBp2}px`);
      explanation = `375 / 768 / 1200 这三个抽样点此刻都满足单卡 ≥ ${preset.minCardPx}px 且不过宽，但 ${tips.join("；")}——这正是不能只靠三台固定机型验断点的原因，拖进浅色内容安全带才覆盖所有中间宽度。`;
    }
  }

  return {
    bp1,
    bp2,
    preset,
    zones,
    bp1InZone,
    bp2InZone,
    devices: results,
    byId,
    okCount,
    tone,
    headline,
    explanation,
    cssSnippet: `@media (min-width: ${bp1}px) { /* 2 列 */ }  @media (min-width: ${bp2}px) { /* ${zones.wideCols} 列 */ }`,
  };
}

// ---------- 01 节：三支柱拆柱实验 ----------
export const PILLAR_FAULTS = {
  all: {
    label: "三支柱齐全",
    fluid: true,
    media: true,
    mq: true,
    tag: "完整响应式",
    status: "ok",
    summary: "流体网格按比例分配空隙，弹性图片不出框，媒体查询在内容快挤破时把多列重排成单列——既没有横向滚动条，也不会把文字压成细条。",
  },
  noFluid: {
    label: "抽走「流体网格」",
    fluid: false,
    media: true,
    mq: true,
    tag: "退回固定台阶（近似自适应）",
    status: "warn",
    summary: "只剩离散的固定宽度（例如 960px / 640px / 320px）。在 820px 这类中间屏宽里，右侧留出一大条死白，宽度不能顺滑吃满屏幕。",
  },
  noMedia: {
    label: "抽走「弹性媒体」",
    fluid: true,
    media: false,
    mq: true,
    tag: "图片捅穿容器",
    status: "error",
    summary: "缺少 img { max-width: 100%; height: auto; } 后，一张 720px 原图在 375px 手机屏里直接顶穿右边框，撑出横向滚动条，文字也跟着被推歪。",
  },
  noMq: {
    label: "抽走「媒体查询」",
    fluid: true,
    media: true,
    mq: false,
    tag: "退回纯流体布局",
    status: "error",
    summary: "三列百分比一直硬扛到 375px 手机屏，每列被压缩到约 105px（每行只剩 5–6 个汉字），标题折成竖排烟囱，彻底失去可读性。",
  },
};

// ---------- 02 节：历史演进里程碑（均已查证核实） ----------
export const HISTORY_STEPS = [
  {
    year: "2000",
    who: "John Allsopp",
    work: "《A Dao of Web Design》（A List Apart，4 月 7 日）",
    tag: "思想破冰",
    phoneMode: "fixed980",
    note: "网页不是印在纸上的固定矩形。Allsopp 呼吁设计师放弃对像素级绝对控制的执念，顺应不同屏幕与字号的「涨落」（ebb and flow）。",
    viewportDesc: "千禧年前后大量网站锁死 800px 表格宽度，窗一窄就出现横向滚动条。",
  },
  {
    year: "2002",
    who: "W3C CSS 工作组",
    work: "Media Queries 首个候选推荐（7 月 8 日）",
    tag: "技术埋种",
    phoneMode: "mediaDraft",
    note: "CSS 第一次提出按视口宽度、高度与色彩能力而不是粗略的 screen / print 来下发样式，为后来「按宽换挡」埋下规范种子。",
    viewportDesc: "规范已定义 min-width / max-width，但智能手机尚未普及，浏览器支持零散。",
  },
  {
    year: "2007",
    who: "Apple iPhone",
    work: "Mobile Safari 引入 viewport meta 标签",
    tag: "移动冲击",
    phoneMode: "shrink980",
    note: "初代 iPhone 为了能打开桌面网站，默认把手机视口假装成约 980px 再整页缩小显示——字小得像蚂蚁，逼得用户双指反复捏合缩放。",
    viewportDesc: "未声明 width=device-width 时，375px 屏幕强行塞进 980px 桌面版，字号缩到 38%。",
  },
  {
    year: "2009–2011",
    who: "Luke Wroblewski & Ethan Marcotte",
    work: "《Mobile First》（2009 博文 / 2011 书）·《Responsive Web Design》（2010-05-25 文章 / 2011 书）",
    tag: "体系定型",
    phoneMode: "rwd2010",
    note: "Wroblewski 提出先为受限的手机端定核心内容；Marcotte 在 2010 年 5 月 25 日把流体网格、弹性图片与媒体查询合称「响应式网页设计」。",
    viewportDesc: "一套 HTML 在 375px 手机上以 1:1 像素排成清晰单列，大屏自动展开多列。",
  },
  {
    year: "2012–2018",
    who: "W3C",
    work: "Media Queries L3 正式推荐（2012-06-19）· WCAG 2.1 1.4.10 Reflow（2018-06-05）",
    tag: "标准与无障碍",
    phoneMode: "wcag320",
    note: "媒体查询成为正式标准后，WCAG 2.1 又将「320 CSS 像素宽无双向滚动（等同 1280px 放大 400%）」写进 AA 级无障碍准则——响应式不再只是为了手机，也是为了低视力缩放人群。",
    viewportDesc: "即使在 1280px 电脑上把网页放大到 400%（等效 320px 宽），内容照样单列无障碍重排。",
  },
];

// ---------- 03 节：内容驱动断点 vs 死背机型断点 ----------
export const BREAKPOINT_SUBJECTS = {
  news: {
    id: "news",
    label: "新闻卡片（长标题）",
    minCardPx: 280,
    gap: 18,
    pad: 24,
    sampleTitle: "城市更新里的无障碍坡道为何总修在偏门",
    sampleMeta: "深度报道 · 12 分钟阅读",
    contentBp1: 626, // 280*2 + 18 + 48 = 626
    contentBp2: 924, // 280*3 + 36 + 48 = 924
  },
  shop: {
    id: "shop",
    label: "商品陈列（短标+价格）",
    minCardPx: 185,
    gap: 14,
    pad: 20,
    sampleTitle: "手冲滤杯 V60",
    sampleMeta: "¥ 168 · 现货",
    contentBp1: 424, // 185*2 + 14 + 40 = 424
    contentBp2: 623, // 185*3 + 28 + 40 = 623
  },
  german: {
    id: "german",
    label: "多语言复合长词",
    minCardPx: 310,
    gap: 20,
    pad: 24,
    sampleTitle: "Benutzerfreundlichkeit",
    sampleMeta: "德语界面术语 · 不可随意断词",
    contentBp1: 688, // 310*2 + 20 + 48 = 688
    contentBp2: 1018, // 310*3 + 40 + 48 = 1018
  },
};

export function compareBreakpointStrategies(testWidth, subjectId) {
  const s = BREAKPOINT_SUBJECTS[subjectId] || BREAKPOINT_SUBJECTS.news;
  // 策略 A：死背旧机型断点（固定 768 / 1024）
  const deviceCols = testWidth >= 1024 ? 3 : testWidth >= 768 ? 2 : 1;
  const deviceCardW = Math.round((testWidth - s.pad * 2 - s.gap * (deviceCols - 1)) / deviceCols);
  const deviceCramped = deviceCols > 1 && deviceCardW < s.minCardPx;
  const deviceWasted = deviceCols < 3 && (testWidth - s.pad * 2 - s.gap * deviceCols) / (deviceCols + 1) >= s.minCardPx + 35;

  // 策略 B：按内容最小可读宽反推断点（相当于 CSS Grid repeat(auto-fit, minmax(minCardPx, 1fr))）
  const contentCols = testWidth >= s.contentBp2 ? 3 : testWidth >= s.contentBp1 ? 2 : 1;
  const contentCardW = Math.round((testWidth - s.pad * 2 - s.gap * (contentCols - 1)) / contentCols);

  let deviceStatus = "ok";
  let deviceNote = `单卡 ${deviceCardW}px，当前宽度刚好凑合。`;
  if (deviceCramped) {
    deviceStatus = "error";
    deviceNote = `在 ${testWidth}px 硬切 ${deviceCols} 列，单卡缩至 ${deviceCardW}px（低于该题材所需 ${s.minCardPx}px），长词/标题直接挤爆。`;
  } else if (deviceWasted) {
    deviceStatus = "warn";
    deviceNote = `空间明明足够排 ${deviceCols + 1} 列，却因死等 ${deviceCols === 1 ? 768 : 1024}px 机型线，单卡被拉宽到 ${deviceCardW}px 空转。`;
  }

  return {
    subject: s,
    testWidth,
    device: { cols: deviceCols, cardW: deviceCardW, status: deviceStatus, note: deviceNote },
    content: {
      cols: contentCols,
      cardW: contentCardW,
      status: "ok",
      note: `由内容反推断点（${s.contentBp1}px / ${s.contentBp2}px），此刻稳排 ${contentCols} 列、单卡 ${contentCardW}px ≥ ${s.minCardPx}px。`,
    },
  };
}

// ---------- 04 节：Luke Wroblewski 三大经典模式 + Tab 序校验 ----------
export const REORDER_PATTERNS = {
  mostlyFluid: {
    id: "mostlyFluid",
    name: "Mostly Fluid",
    zh: "基本流体",
    desc: "宽屏保持多列并给外层加最大宽护栏；中屏微调列宽；窄屏按原始顺序顺次垂直堆叠。改动最少，DOM 顺序与视觉顺序天然一致。",
    layouts: {
      wide: [
        { id: "A", title: "主题导读", tag: "重点", grid: "1 / span 12", row: 1, tone: "green" },
        { id: "B", title: "核心数据", tag: "次要", grid: "1 / span 4", row: 2, tone: "blue" },
        { id: "C", title: "案例图卡", tag: "次要", grid: "5 / span 4", row: 2, tone: "sage" },
        { id: "D", title: "快捷入口", tag: "辅助", grid: "9 / span 4", row: 2, tone: "ink" },
      ],
      mid: [
        { id: "A", title: "主题导读", tag: "重点", grid: "1 / span 12", row: 1, tone: "green" },
        { id: "B", title: "核心数据", tag: "次要", grid: "1 / span 6", row: 2, tone: "blue" },
        { id: "C", title: "案例图卡", tag: "次要", grid: "7 / span 6", row: 2, tone: "sage" },
        { id: "D", title: "快捷入口", tag: "辅助", grid: "1 / span 12", row: 3, tone: "ink" },
      ],
      narrow: [
        { id: "A", title: "主题导读", tag: "重点", grid: "1 / span 12", row: 1, tone: "green" },
        { id: "B", title: "核心数据", tag: "次要", grid: "1 / span 12", row: 2, tone: "blue" },
        { id: "C", title: "案例图卡", tag: "次要", grid: "1 / span 12", row: 3, tone: "sage" },
        { id: "D", title: "快捷入口", tag: "辅助", grid: "1 / span 12", row: 4, tone: "ink" },
      ],
    },
  },
  columnDrop: {
    id: "columnDrop",
    name: "Column Drop",
    zh: "逐列下落",
    desc: "宽屏左中右三栏并列；随着视口收窄，最右侧辅助栏先「掉」到下方，再窄时左侧目录也掉下来，只留主内容一路占满顶部。",
    layouts: {
      wide: [
        { id: "A", title: "核心正文", tag: "主栏", grid: "4 / span 6", row: 1, tone: "green" },
        { id: "B", title: "章节目录", tag: "左栏", grid: "1 / span 3", row: 1, tone: "blue" },
        { id: "C", title: "关联资料", tag: "右栏", grid: "10 / span 3", row: 1, tone: "sage" },
        { id: "D", title: "延伸阅读", tag: "底栏", grid: "1 / span 12", row: 2, tone: "ink" },
      ],
      mid: [
        { id: "A", title: "核心正文", tag: "主栏", grid: "5 / span 8", row: 1, tone: "green" },
        { id: "B", title: "章节目录", tag: "左栏", grid: "1 / span 4", row: 1, tone: "blue" },
        { id: "C", title: "关联资料", tag: "先下落", grid: "1 / span 6", row: 2, tone: "sage" },
        { id: "D", title: "延伸阅读", tag: "底栏", grid: "7 / span 6", row: 2, tone: "ink" },
      ],
      narrow: [
        { id: "A", title: "核心正文", tag: "置顶", grid: "1 / span 12", row: 1, tone: "green" },
        { id: "B", title: "章节目录", tag: "已下落", grid: "1 / span 12", row: 2, tone: "blue" },
        { id: "C", title: "关联资料", tag: "已下落", grid: "1 / span 12", row: 3, tone: "sage" },
        { id: "D", title: "延伸阅读", tag: "底栏", grid: "1 / span 12", row: 4, tone: "ink" },
      ],
    },
  },
  layoutShifter: {
    id: "layoutShifter",
    name: "Layout Shifter",
    zh: "布局位移",
    desc: "不同断点下不只是落列，而是重构整个区块嵌套关系（例如左侧固定索引配右侧上下叠块，到窄屏时改为横向顶条+主区）。表现力最强，维护成本也最高。",
    layouts: {
      wide: [
        { id: "A", title: "主控行动区", tag: "右上主焦点", grid: "5 / span 8", row: 1, tone: "green" },
        { id: "B", title: "全局导航栈", tag: "左通高", grid: "1 / span 4", row: "1 / span 2", tone: "blue" },
        { id: "C", title: "实时快讯流", tag: "右下", grid: "5 / span 4", row: 2, tone: "sage" },
        { id: "D", title: "状态速览卡", tag: "右下", grid: "9 / span 4", row: 2, tone: "ink" },
      ],
      mid: [
        { id: "B", title: "全局导航栈", tag: "升为顶通栏", grid: "1 / span 12", row: 1, tone: "blue" },
        { id: "A", title: "主控行动区", tag: "主焦点", grid: "1 / span 8", row: 2, tone: "green" },
        { id: "C", title: "实时快讯流", tag: "侧栏", grid: "9 / span 4", row: 2, tone: "sage" },
        { id: "D", title: "状态速览卡", tag: "底栏", grid: "1 / span 12", row: 3, tone: "ink" },
      ],
      narrow: [
        { id: "B", title: "全局导航栈", tag: "收进顶栏", grid: "1 / span 12", row: 1, tone: "blue" },
        { id: "A", title: "主控行动区", tag: "首屏聚焦", grid: "1 / span 12", row: 2, tone: "green" },
        { id: "C", title: "实时快讯流", tag: "流式", grid: "1 / span 12", row: 3, tone: "sage" },
        { id: "D", title: "状态速览卡", tag: "末尾", grid: "1 / span 12", row: 4, tone: "ink" },
      ],
    },
  },
};

// ---------- 06 节：什么时候别硬套响应式 ----------
export const ANTI_CASES = [
  {
    id: "datatable",
    title: "多列财务与规格对比表",
    tag: "二维对照",
    badTitle: "硬拆成单列卡片后，纵向比价彻底失效",
    badDesc: "把 6 列参数表强行折成竖排卡片，眼睛要上下翻三屏才能比较同一项指标的数值，原本一秒扫完的表格变成翻找噩梦。",
    goodTitle: "保留二维表格结构 + 首列冻结横向滚动",
    goodDesc: "遵循表格布局与粘性定位的组合：表头与第一列品名吸住不动，数据列在窄屏容器内横向平滑滑动，保持列与列的视觉对齐。",
  },
  {
    id: "canvas",
    title: "地图、画布与时间轴工具",
    tag: "WCAG 豁免",
    badTitle: "把工具栏与画布硬挤进单列，操作区只剩一条缝",
    badDesc: "视频轨、矢量画布和交互地图天生依赖二维空间坐标。WCAG 2.1 1.4.10 Reflow 明确把地图、图表、复杂工具界面列为二维布局豁免项。",
    goodTitle: "全屏二维画布 + 按需折叠浮层 / 专用简版",
    goodDesc: "保住核心画布的完整视域，把次级检查器折成底部抽屉，或明确提示在宽屏完成精细编辑、手机只承接预览与批注。",
  },
  {
    id: "forked",
    title: "桌面与手机任务完全分叉",
    tag: "意图不同",
    badTitle: "桌面是批量后台录入，手机只想扫码核销",
    badDesc: "两端的首要任务根本不同，强行用同一套 HTML 与媒体查询把 40 个表单字段塞进手机，再写一堆 display: none 遮掩，既拖慢下载又两头不讨好。",
    goodTitle: "拆分任务视图或结合自适应与容器查询",
    goodDesc: "核心数据接口保持统一，但针对高频移动任务提供轻量化专用工作流，把重型批量操作留在宽屏。",
  },
  {
    id: "embed",
    title: "跨容器复用的独立小组件",
    tag: "容器决定",
    badTitle: "同一张天气卡放进 1440px 桌面的 260px 侧栏里，却套了桌面大字号",
    badDesc: "媒体查询只看整个浏览器窗口宽（1440px），根本不知道组件被塞进了窄侧栏，于是它在窄盒子里硬摆横向大图直接爆框。",
    goodTitle: "把组件级判断交给 CSS 容器查询（@container）",
    goodDesc: "页面大骨架继续由响应式媒体查询负责，独立卡片和挂件改用容器查询，只听自己父容器的宽度变身。",
  },
];

// ---------- 07 节：小练习（4 选项只差「断点宽度」一个变量） ----------
export const QUIZ_CONFIG = {
  pad: 24,
  gap: 20,
  minCard: 260,
  options: [
    {
      id: "A",
      label: "方案 A",
      spec: "360px 切 2 列 · 768px 切 3 列",
      bp1: 360,
      bp2: 768,
      correct: false,
      verdict: "提前挤碎",
      calc: "360px 放 2 列时单卡仅 (360 − 48 − 20) ÷ 2 = 146px；768px 放 3 列时单卡仅 (768 − 48 − 40) ÷ 3 = 227px，两处都低于 260px 下限。",
    },
    {
      id: "B",
      label: "方案 B",
      spec: "600px 切 2 列 · 900px 切 3 列",
      bp1: 600,
      bp2: 900,
      correct: true,
      verdict: "紧贴内容容宽",
      calc: "600px 放 2 列时单卡 (600 − 48 − 20) ÷ 2 = 266px ≥ 260px；900px 放 3 列时单卡 (900 − 48 − 40) ÷ 3 = 271px ≥ 260px。刚好在空间够用时换挡，既不挤碎也不浪费。",
    },
    {
      id: "C",
      label: "方案 C",
      spec: "960px 切 2 列 · 1440px 切 3 列",
      bp1: 960,
      bp2: 1440,
      correct: false,
      verdict: "换挡过晚",
      calc: "在 800px 平板仍被迫排单列，单卡被拉到 752px（超过 45 字/行）；在 1280px 常见笔记本也只能排 2 列，浪费了本可舒服排 3 列的空间。",
    },
    {
      id: "D",
      label: "方案 D",
      spec: "768px 直接由 1 列跳 3 列",
      bp1: 768,
      bp2: 768,
      correct: false,
      verdict: "跳过两列台阶",
      calc: "没有 2 列缓冲过渡：在 768px 处突然排进 3 列，单卡宽只有 (768 − 48 − 40) ÷ 3 = 227px < 260px，既挤窄了内容，又缺失平板两列节奏。",
    },
  ],
};

export function quizPreviewAt(opt, width) {
  const cols = width >= opt.bp2 ? 3 : width >= opt.bp1 ? 2 : 1;
  const cardW = Math.round((width - QUIZ_CONFIG.pad * 2 - QUIZ_CONFIG.gap * (cols - 1)) / cols);
  return { cols, cardW, ok: cols === 1 ? cardW <= 680 : cardW >= QUIZ_CONFIG.minCard };
}
