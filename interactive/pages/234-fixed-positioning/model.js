// 234 固定定位布局 · 单一真源数据与物理核算模型

export const HERO_PRESETS = {
  broken: {
    scrollY: 0,
    topBar: "bloated",     // 'bloated' (108px) | 'slim' (52px) | 'off' (0px)
    sideRail: "wide",      // 'wide' (82px) | 'slim' (42px) | 'off' (0px)
    bottomBar: "bloated",  // 'bloated' (84px) | 'slim' (44px) | 'off' (0px)
    fab: "large",          // 'large' (68px) | 'compact' (44px) | 'off' (0px)
    reserve: "none",       // 'none' | 'matched' | 'excessive'
    fixedZ: 1,             // 1 | 100 | 1000 (内容插卡 z-index 固定为 20)
    ancestorTransform: true,
    viewportMode: "desktop", // 'desktop' | 'mobile'
    overlayOpen: false,
    activeAnchor: null,
  },
  clean: {
    scrollY: 160,
    topBar: "slim",
    sideRail: "slim",
    bottomBar: "off",
    fab: "compact",
    reserve: "matched",
    fixedZ: 1000,
    ancestorTransform: false,
    viewportMode: "desktop",
    overlayOpen: false,
    activeAnchor: null,
  },
  minimal: {
    scrollY: 140,
    topBar: "slim",
    sideRail: "off",
    bottomBar: "slim",
    fab: "off",
    reserve: "matched",
    fixedZ: 100,
    ancestorTransform: false,
    viewportMode: "desktop",
    overlayOpen: false,
    activeAnchor: null,
  },
};

export const VIEWPORT_DIMS = {
  desktop: { w: 540, h: 420, maxScroll: 520, label: "桌面视口 540×420" },
  mobile:  { w: 340, h: 420, maxScroll: 640, label: "手机窄视口 340×420" },
};

export const CONTENT_PROMO_Z = 20;
export const COMFORT_MIN_VISIBLE = 72; // 经验舒适底线：内容可视净区 >= 72%（固定壳层 <= 28%）

export const ELEMENT_SPECS = {
  topBar:    { bloated: 108, slim: 50, off: 0 },
  sideRail:  { wide: 82, slim: 44, off: 0 },
  bottomBar: { bloated: 84, slim: 44, off: 0 },
  fab:       { large: 68, compact: 44, off: 0 },
};

// 锚点在文档内容坐标中的 Y 偏移（不含额外顶部 padding）
export const ANCHOR_OFFSETS = {
  sec1: 0,
  sec2: 204,
  sec3: 416,
};

export function createHeroState(preset = "broken") {
  return { ...(HERO_PRESETS[preset] || HERO_PRESETS.broken) };
}

/**
 * 计算当前英雄舞台的全部真实几何指标、四项验收状态、白话诊单和实时 CSS
 */
export function evaluateHero(state) {
  const dims = VIEWPORT_DIMS[state.viewportMode] || VIEWPORT_DIMS.desktop;
  const W = dims.w;
  const H = dims.h;
  const scrollY = Math.max(0, Math.min(dims.maxScroll, Math.round(state.scrollY)));

  const topH = ELEMENT_SPECS.topBar[state.topBar] ?? 0;
  const railW = ELEMENT_SPECS.sideRail[state.sideRail] ?? 0;
  const railH = railW > 0 ? Math.min(148, H - topH - 24) : 0;
  const bottomH = ELEMENT_SPECS.bottomBar[state.bottomBar] ?? 0;
  const fabD = ELEMENT_SPECS.fab[state.fab] ?? 0;

  const fixedCount = (topH > 0 ? 1 : 0) + (railW > 0 ? 1 : 0) + (bottomH > 0 ? 1 : 0) + (fabD > 0 ? 1 : 0);

  // 真实面积核算（避免顶底栏与侧轨、FAB 重叠重复计数）
  const totalArea = W * H;
  const topArea = topH * W;
  const bottomArea = bottomH * W;
  const midH = Math.max(0, H - topH - bottomH);
  const railEffectiveH = railW > 0 ? Math.min(railH, midH) : 0;
  const railArea = railW * railEffectiveH;
  const fabArea = fabD > 0 ? Math.PI * (fabD / 2) ** 2 : 0;
  const chromeArea = Math.min(totalArea, topArea + bottomArea + railArea + fabArea);
  const obstructedPct = Math.round((chromeArea / totalArea) * 100);
  const visiblePct = Math.max(0, 100 - obstructedPct);

  // 顶部让位与锚点余量
  const docPaddingTop =
    state.reserve === "none" ? 0
    : state.reserve === "matched" ? (topH > 0 ? topH + 12 : 12)
    : Math.max(158, topH + 78);
  const scrollPaddingTop =
    state.reserve === "none" ? 0
    : state.reserve === "matched" ? (topH > 0 ? topH + 12 : 12)
    : Math.max(158, topH + 78);

  // 文档流首行被顶栏盖住的像素（在 scrollY = 0 时）
  const firstCardOverlapPx = topH > 0 ? Math.max(0, topH - docPaddingTop) : 0;
  const topVoidPx = state.reserve === "excessive" ? Math.max(0, docPaddingTop - topH) : 0;

  // 若开启了窄视口 + 宽侧轨，检查阅读栏宽度
  const effectiveContentWidth = W - (railW > 0 ? railW + 16 : 0);
  const narrowSqueeze = state.viewportMode === "mobile" && railW >= 44;

  // 4 项验收柱
  const budgetOk = fixedCount >= 1 && visiblePct >= COMFORT_MIN_VISIBLE && !narrowSqueeze;
  const clearanceOk = topH === 0
    ? state.reserve !== "excessive"
    : (firstCardOverlapPx === 0 && state.reserve === "matched");
  const stackingOk = fixedCount === 0 ? false : state.fixedZ > CONTENT_PROMO_Z;
  const containingOk = !state.ancestorTransform;

  const pillars = {
    budget: {
      ok: budgetOk,
      status: fixedCount === 0
        ? "无固定层"
        : narrowSqueeze
          ? "窄屏侧轨挤字"
          : visiblePct < COMFORT_MIN_VISIBLE
            ? `仅剩 ${visiblePct}%`
            : `净区 ${visiblePct}%`,
    },
    clearance: {
      ok: clearanceOk,
      status: topH === 0
        ? (state.reserve === "excessive" ? `顶部空 ${topVoidPx}px` : "无顶栏")
        : firstCardOverlapPx > 0
          ? `截断 ${firstCardOverlapPx}px`
          : state.reserve === "excessive"
            ? `空洞 ${topVoidPx}px`
            : `让位 ${docPaddingTop}px`,
    },
    stacking: {
      ok: stackingOk,
      status: fixedCount === 0
        ? "未启用"
        : stackingOk
          ? `z:${state.fixedZ} > ${CONTENT_PROMO_Z}`
          : `z:${state.fixedZ} 被反压`,
    },
    containingBlock: {
      ok: containingOk,
      status: containingOk ? "视口锚定" : "被 transform 劫持",
    },
  };

  const passed = [budgetOk, clearanceOk, stackingOk, containingOk].filter(Boolean).length;

  // 确定当前最紧迫的白话诊断（单真源优先级排序）
  let diag;
  if (!containingOk) {
    diag = {
      level: "error",
      tag: "错态 · 包含块被劫持",
      title: "外层带了 transform，固定导航跟着正文一起滚跑",
      body: `按照 W3C CSS Transforms 规范，只要任意祖先设置了非 none 的 transform，它就会取代视口成为 position: fixed 的包含块。现在把底部滑轨往右拖，原本该锁在屏幕上的 ${fixedCount} 个青绿部件会直接随页面滚出视野。`,
      action: "把「外层容器」从 transform: translateY(0) 切回 transform: none，把包含块锚点还给浏览器视口。",
    };
  } else if (fixedCount === 0) {
    diag = {
      level: "error",
      tag: "错态 · 退回普通文档流",
      title: "四个固定部件全关了，页面不再有常驻锚点",
      body: "把固定层全部撤掉后，净可视区虽然变成 100%，但用户在长页滚到底部后找不到任何导航或快捷入口，已经退回 222 普通流布局。",
      action: "至少保留 1 枚核心固定件（推荐精简顶栏 50px，再按需配轻巧悬浮球或瘦底栏）。",
    };
  } else if (narrowSqueeze) {
    diag = {
      level: "error",
      tag: "错态 · 窄屏侧轨挤字",
      title: `340px 手机视口硬塞 ${railW}px 侧边轨，正文被挤成细条`,
      body: `桌面端好用的固定侧轨搬到手机竖屏会横占宽度，当前正文净宽只剩 ${effectiveContentWidth}px，文字频繁折行。移动端更适合用精简顶栏或底栏取代侧轨。`,
      action: "把「常驻侧边工具轨」切换为「收起」，或切回桌面视口验证宽度预算。",
    };
  } else if (!budgetOk) {
    diag = {
      level: "error",
      tag: `错态 · 固定壳层霸屏 (${obstructedPct}%)`,
      title: `固定部件吃掉 ${obstructedPct}% 视口，阅读净区只剩 ${visiblePct}%`,
      body: `顶栏（${topH}px）、侧轨（${railW}px）、底栏（${bottomH}px）和悬浮球（${fabD}px）叠加贴在玻璃上，留给正文的窗口低于 72% 经验舒适底线，读者像透过门缝看网页。`,
      action: "把「常驻导航栏高度」瘦身到 50px，并收起或精简底栏与侧轨，让净可视区回到 72% 以上。",
    };
  } else if (!clearanceOk && firstCardOverlapPx > 0) {
    diag = {
      level: "error",
      tag: `错态 · 首行被切 ${firstCardOverlapPx}px`,
      title: `顶栏脱离文档流，直接盖死了卡片首行与锚点标题`,
      body: `position: fixed 不占文档流空间，正文照旧从 y = 0 开始排，导致开头 ${firstCardOverlapPx}px 压在顶栏下面；点顶栏的「用法 / 场景」锚点跳转时，章节标题同样会被顶栏吞掉。`,
      action: "把「文档流让位」切到「匹配顶栏」，同时补上 padding-top 与 scroll-padding-top。",
    };
  } else if (!clearanceOk && state.reserve === "excessive") {
    diag = {
      level: "error",
      tag: `错态 · 顶部空洞 ${topVoidPx}px`,
      title: `顶部留空写到了 ${docPaddingTop}px，首屏白白空出一截`,
      body: `虽然不再遮挡首行，但远超顶栏实际高度（${topH}px）的 padding-top 在首屏留下 ${topVoidPx}px 断层，读者误以为上面少了内容。`,
      action: "把「文档流让位」调回「匹配顶栏」，让让位像素紧贴顶栏高度。",
    };
  } else if (!stackingOk) {
    diag = {
      level: "error",
      tag: `错态 · 层级倒挂 (z:${state.fixedZ} < ${CONTENT_PROMO_Z})`,
      title: "固定层 z-index 只有 1，滚动卡片直接反压导航栏",
      body: `正文区的状态横幅自带 position: relative 与 z-index: ${CONTENT_PROMO_Z}。拖动滚页滑轨滚过中段时，正文卡会盖在青绿导航栏和悬浮球前面，按钮根本点不到。`,
      action: "把「固定层 z-index」调到 100 或海报示例的 1000，让固定层稳压滚动内容。",
    };
  } else {
    const activeNames = [
      topH > 0 && `顶栏 ${topH}px`,
      railW > 0 && `侧轨 ${railW}px`,
      bottomH > 0 && `底栏 ${bottomH}px`,
      fabD > 0 && `悬浮球 ${fabD}px`,
    ].filter(Boolean).join(" + ");
    diag = {
      level: "ok",
      tag: `4 / 4 校准达标 · 净区 ${visiblePct}%`,
      title: "固定层稳钉视口玻璃，正文在下方畅通滚动",
      body: `当前开启「${activeNames}」，固定壳层仅占 ${obstructedPct}% 视口，留出 ${visiblePct}% 清爽阅读窗；文档流与锚点均匹配让位（${docPaddingTop}px），层级（z-index: ${state.fixedZ}）清晰稳压内容。试试拖滑轨或点顶栏「用法 / 场景」验证跳转！`,
      action: "你也可以试试换成另一套合法组合（例如顶栏 + 瘦底栏，或切换到手机窄视口压力测试）。",
    };
  }

  // 生成同步的真实 CSS 代码片段
  const cssLines = [
    `.page-shell {`,
    state.ancestorTransform
      ? `  transform: translateY(0); /* [!] 劫持包含块 */`
      : `  transform: none; /* 包含块归属视口 */`,
    `}`,
    `html { scroll-padding-top: ${scrollPaddingTop}px; }`,
    `main { padding-top: ${docPaddingTop}px; }`,
    `.fixed-nav {`,
    `  position: fixed; top: 0; inset-inline: 0;`,
    topH > 0
      ? `  height: ${topH}px; z-index: ${state.fixedZ};${!stackingOk ? " /* [!] 低于正文 20 */" : ""}`
      : `  display: none; /* 顶栏已关闭 */`,
    `}`,
  ];
  if (fabD > 0) {
    cssLines.push(`.fixed-fab { position: fixed; right: 16px; bottom: ${bottomH > 0 ? bottomH + 14 : 18}px; width: ${fabD}px; z-index: ${state.fixedZ}; }`);
  }

  // 检查促销卡片在当前滚动位置是否与顶栏或悬浮球碰撞（用于画布与 DOM 高亮）
  const promoDocY = docPaddingTop + 178;
  const promoScreenY = promoDocY - scrollY;
  const promoH = 54;
  const promoHitsTop = topH > 0 && !state.ancestorTransform && promoScreenY < topH && promoScreenY + promoH > 0;
  const promoReversesTop = promoHitsTop && !stackingOk;

  return {
    dims,
    scrollY,
    topH,
    railW,
    railH,
    bottomH,
    fabD,
    fixedCount,
    obstructedPct,
    visiblePct,
    docPaddingTop,
    scrollPaddingTop,
    firstCardOverlapPx,
    topVoidPx,
    effectiveContentWidth,
    narrowSqueeze,
    pillars,
    passed,
    diag,
    cssCode: cssLines.join("\n"),
    promoScreenY,
    promoHitsTop,
    promoReversesTop,
  };
}

// =========================================================================
// 01 节：四定位同卷对照滑轨数据
// =========================================================================
export const POSITION_MODES = [
  {
    id: "static",
    name: "static",
    zh: "普通文档流",
    tag: "222 号基准",
    leavesFlow: false,
    anchor: "按顺序排在流里",
    note: "忽略 top / left，随页面滚出视口，原位置永远占着。",
  },
  {
    id: "relative",
    name: "relative",
    zh: "相对定位",
    tag: "232 号基准",
    leavesFlow: false,
    anchor: "相对自身原位偏移",
    note: "视觉挪开 26px，但原位虚线槽保留不塌陷，依然随页面滚走。",
  },
  {
    id: "absolute",
    name: "absolute",
    zh: "绝对定位",
    tag: "233 号基准",
    leavesFlow: true,
    anchor: "相对已定位父容器",
    note: "脱离文档流、下方卡片顶上来，但仍钉在文档坐标上，会随页面滚走。",
  },
  {
    id: "fixed",
    name: "fixed",
    zh: "固定定位",
    tag: "234 本页主角",
    leavesFlow: true,
    anchor: "钉在浏览器视口玻璃",
    note: "脱离文档流且锁死视口坐标，滚得再深也纹丝不动。",
  },
];

// =========================================================================
// 02 节：四个最隐蔽的翻车坑数据
// =========================================================================
export const TRAPS_DATA = [
  {
    id: "transform",
    badge: "坑 01 · 包含块劫持",
    title: "祖先写了 transform，fixed 突然跟着滚走",
    spec: "W3C CSS Transforms Level 1",
    brokenSummary: "页面入场动画或 GPU 加速随手给外层加了 transform: translateZ(0)（或 filter / perspective / contain: paint）。结果这个祖先取代视口成了包含块，里面的固定栏退化成随容器滚动的绝对定位。",
    fixedSummary: "把固定导航或弹窗移到带 transform 的容器外层（挂到 <body> 直系子节点），或确保外层容器在静止态恢复 transform: none。",
    brokenCss: `.app-shell {\n  transform: translateZ(0); /* 触发包含块 */\n}\n.app-shell .topbar {\n  position: fixed; top: 0; /* 失效：随容器滚 */\n}`,
    fixedCss: `.app-shell {\n  transform: none; /* 不建立 fixed 包含块 */\n}\n.topbar {\n  position: fixed; top: 0; /* 真正锁在视口 */\n}`,
  },
  {
    id: "focus",
    badge: "坑 02 · 锚点与键盘焦点被吞",
    title: "点目录跳章节、按 Tab 键，焦点钻进顶栏下面",
    spec: "WCAG 2.2 SC 2.4.11 (F110)",
    brokenSummary: "浏览器滚到锚点或键盘焦点时只认视口最顶边，不知道上面压着 60px 的固定顶栏。键盘用户按 Shift+Tab 往回找按钮时，焦点框被顶栏彻底盖住，直接违反 WCAG 2.2 AA 级 2.4.11。",
    fixedSummary: "在 html 上写一行 scroll-padding-top（略大于顶栏高度，例如 72px）。锚点跳转、scrollIntoView 和键盘焦点回滚都会自动停在顶栏下方。",
    brokenCss: `/* 没写 scroll-padding-top */\n.header { position: fixed; height: 60px; }\n/* 锚点 #api 与焦点元素停在 y=0 被盖住 */`,
    fixedCss: `html {\n  scroll-padding-top: 72px;\n  scroll-padding-bottom: 56px; /* 若有底栏 */\n}`,
  },
  {
    id: "safearea",
    badge: "坑 03 · 100vh 与全面屏安全区裁切",
    title: "手机底栏贴着 bottom: 0，被灵动岛或底部横条截断",
    spec: "CSS Values 4 (dvh) · env()",
    brokenSummary: "移动端浏览器的地址栏会随滚动收起或展开，写死 height: 100vh 会把底栏挤出屏幕；而在全面屏手机上贴着 bottom: 0 还会和系统手势横条打架。",
    fixedSummary: "全屏固定抽屉改用 100dvh 动态视口高度；底部固定条配合 viewport-fit=cover 加上 padding-bottom: env(safe-area-inset-bottom)。",
    brokenCss: `.fixed-drawer { position: fixed; height: 100vh; }\n.fixed-dock {\n  position: fixed; bottom: 0; height: 52px;\n}`,
    fixedCss: `.fixed-drawer { position: fixed; height: 100dvh; }\n.fixed-dock {\n  position: fixed; bottom: 0;\n  padding-bottom: env(safe-area-inset-bottom);\n}`,
  },
  {
    id: "keyboard",
    badge: "坑 04 · 软键盘弹起挤爆视口",
    title: "输入表单时顶栏+底栏+键盘三面夹击，输入行只剩半行",
    spec: "Visual Viewport API",
    brokenSummary: "手机端点击输入框弹出虚拟键盘后，可视高度瞬间缩水近一半。如果同时钉着 64px 顶栏和 60px 底栏，用户连自己正在打的字都看不清。",
    fixedSummary: "表单编辑页或输入聚焦时收起非必要固定底栏，或通过 @media (max-height: 480px) / visualViewport 降级固定栏为普通流，把空间还给键盘和输入框。",
    brokenCss: `/* 矮屏与输入态依然硬锁顶底双栏 */\n.nav { position: fixed; top: 0; height: 64px; }\n.dock { position: fixed; bottom: 0; height: 60px; }`,
    fixedCss: `@media (max-height: 500px) {\n  .dock { position: static; } /* 矮屏释放空间 */\n}`,
  },
];

// =========================================================================
// 03 节：视口占用预算秤模型
// =========================================================================
export const BUDGET_DEVICES = {
  desktop1440: { label: "桌面 1440×900", w: 1440, h: 900 },
  laptop1280:  { label: "笔记 1280×720", w: 1280, h: 720 },
  phonePort:   { label: "手机竖屏 390×844", w: 390, h: 844 },
  phoneLand:   { label: "手机横屏 844×390", w: 844, h: 390 },
};

export function evaluateBudget(cfg) {
  const dev = BUDGET_DEVICES[cfg.device] || BUDGET_DEVICES.phonePort;
  const total = dev.w * dev.h;
  const topH = cfg.topOn ? cfg.topH : 0;
  const botH = cfg.bottomOn ? cfg.bottomH : 0;
  const bannerH = cfg.bannerOn ? 56 : 0;
  const sideW = cfg.sideOn ? cfg.sideW : 0;
  const fabD = cfg.fabOn ? 56 : 0;

  const usableH = Math.max(0, dev.h - topH - botH - bannerH);
  const usableW = Math.max(0, dev.w - sideW);
  const fabOverlap = fabD > 0 ? Math.min(usableW * usableH, Math.PI * (fabD / 2) ** 2) : 0;
  const freeArea = Math.max(0, usableW * usableH - fabOverlap);
  const freePct = Math.round((freeArea / total) * 100);
  const usedPct = 100 - freePct;

  let verdict = "舒适";
  let tone = "ok";
  let detail = `留出 ${freePct}% 连续阅读窗（净高 ${usableH}px × 净宽 ${usableW}px），操作可达又不压抑。`;
  if (usedPct === 0) {
    verdict = "纯文档流";
    tone = "warn";
    detail = "当前未开启任何固定部件，页面完全归普通文档流。";
  } else if (usableH < 180 || freePct < 60) {
    verdict = "严重压屏";
    tone = "bad";
    detail = `固定壳层吞掉 ${usedPct}% 视口，内容窗高仅剩 ${usableH}px，读者几乎无法连贯阅读，需立刻删减或改滚动显隐。`;
  } else if (freePct < 75) {
    verdict = "偏紧警戒";
    tone = "warn";
    detail = `固定壳层已占 ${usedPct}%（超过约 25% 经验舒适上限），在矮屏或弹窗出现时会立刻显得局促。`;
  }

  return { dev, topH, botH, bannerH, sideW, fabD, usableW, usableH, freePct, usedPct, verdict, tone, detail };
}

// =========================================================================
// 04 节：1998–2023 演进历程数据（均已核实出处）
// =========================================================================
export const HISTORY_ERAS = [
  {
    id: "1998",
    year: "1998.05",
    label: "CSS2 规范诞生",
    title: "W3C CSS2 第 9.6.1 节首次定义 position: fixed",
    source: "W3C REC-CSS2-19980512 · 编辑 Bert Bos, Håkon Wium Lie, Chris Lilley, Ian Jacobs",
    desc: "规范把 fixed 定义为绝对定位的子类：脱离正常文档流，但包含块固定由视口建立；在连续屏幕上不随滚动移动，在打印分页介质上则于每一页重复出现（可用于页眉页脚）。",
    behavior: "spec",
    simCaption: "纸面标准已明确「视口为包含块」，但当年主流浏览器尚未落地。",
  },
  {
    id: "2006",
    year: "2006.10",
    label: "IE 7 补齐桌面",
    title: "告别 IE 6 缺位：桌面浏览器终于集体原生支持",
    source: "Internet Explorer 7 发布于 2006 年 10 月 18 日（标准模式）",
    desc: "在此之前，IE 6（2001）完全不支持 position: fixed，开发者只能用 <frameset> 分帧或卡顿的 CSS expression() 硬算 scrollTop 假装固定。IE 7 上线后，桌面固定顶栏才真正普及。",
    behavior: "ie6",
    simCaption: "模拟 IE 6 时代用脚本补丁追赶 scrollTop 时的抖动与滞后。",
  },
  {
    id: "2011",
    year: "2011.10",
    label: "iOS 5 移动端破冰",
    title: "Mobile Safari 首次原生支持移动端固定定位",
    source: "iOS 5 发布于 2011 年 10 月 12 日",
    desc: "早期触屏手机支持双指缩放与惯性回弹，让 fixed 坐标计算与重绘极易撕裂，因此 iOS 4 及更早版本干脆把它当成普通流渲染。iOS 5 才让手机顶部导航栏和底部 Tab 栏真正站稳。",
    behavior: "ios4",
    simCaption: "对比 iOS 4（滚停后再瞬移跳回）与现代合成层锁死视口。",
  },
  {
    id: "2023",
    year: "2023.10",
    label: "WCAG 2.2 焦点红线",
    title: "固定顶栏盖住键盘焦点正式列入可访问性失败项",
    source: "W3C WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum) & Failure F110",
    desc: "技术不再只是「能不能钉住」，更关乎「钉住后别遮住别人」。WCAG 2.2 明确要求：键盘焦点落到控件上时不可被作者创建的固定顶栏/底栏完全遮挡，scroll-padding 成为标配解药。",
    behavior: "wcag",
    simCaption: "scroll-padding-top 让焦点框稳停在顶栏下方，零遮挡通过 AA 级。",
  },
];

// =========================================================================
// 05 节：6 场景决策矩阵
// =========================================================================
export const SCENARIOS = [
  {
    id: "nav",
    title: "SaaS 控制台全局顶栏 / 侧栏",
    posterTag: "海报应用场景 · 固定头部导航 / 侧边工具栏",
    verdict: "推荐用 fixed",
    verdictTone: "ok",
    summary: "用户高频在模块间切换、搜索与查看通知，全局工具随时触达的收益远大于 48–56px 顶栏占用的垂直空间。",
    tip: "桌面用窄顶栏或可折叠侧轨；记得同步设置 scroll-padding-top。",
  },
  {
    id: "fab",
    title: "右下角客服 / 返回顶部悬浮球",
    posterTag: "海报应用场景 · 悬浮客服按钮",
    verdict: "克制用 fixed",
    verdictTone: "ok",
    summary: "单枚 44–52px 圆形按钮只占极小角区，几乎不阻断正文阅读，适合作为全局兜底入口。",
    tip: "别堆叠成一串 4 个悬浮球；留出 bottom 安全区，别挡住右下角提交按钮。",
  },
  {
    id: "article",
    title: "长篇专栏 / 电子书沉浸阅读",
    posterTag: "反例 · 什么时候别用",
    verdict: "别硬锁，改滚动显隐",
    verdictTone: "bad",
    summary: "长文阅读最看重连贯纵深。80px+ 的厚重顶栏配分享底栏会不断在余光里抢戏，尤其在笔记本 720px 矮屏上压抑感极强。",
    tip: "向下读时收起顶栏，轻微上滑再浮现；或按章节改用 235 粘性定位。",
  },
  {
    id: "sectionhead",
    title: "表格表头 / 通讯录字母分组头",
    posterTag: "边界辨析 · 易与 sticky 混淆",
    verdict: "别用 fixed，改用 sticky",
    verdictTone: "warn",
    summary: "这类标题只需在「所属表格或分组还在屏幕内」时吸顶，滚出该区块就该自然退场，而不是永远占着全站视口。",
    tip: "交由 235 粘性定位布局处理，省去手算滚动区间的脆弱脚本。",
  },
  {
    id: "mobileform",
    title: "手机长表单底部的固定提交条",
    posterTag: "反例 · 软键盘陷阱",
    verdict: "慎用，键盘态需退让",
    verdictTone: "bad",
    summary: "输入时软键盘会吃掉半个屏幕，固定底栏与顶栏夹击会让输入视窗缩成一条缝，还可能遮住表单校验提示。",
    tip: "矮屏（max-height: 500px）或输入聚焦时退回普通流，避免夹屏。",
  },
  {
    id: "badge",
    title: "卡片右上角角标 / 弹窗内关闭钮",
    posterTag: "边界辨析 · 易与 absolute 混淆",
    verdict: "别用 fixed，改用 absolute",
    verdictTone: "warn",
    summary: "角标依附于某张具体卡片而不是整个浏览器窗口，用 fixed 会导致卡片滚走后角标诡异地悬在半空。",
    tip: "归属 233 绝对定位布局；全屏模态遮罩则参考 237 覆盖布局与 <dialog>。",
  },
];

// =========================================================================
// 06 节：四选一单变量诊断练习
// =========================================================================
export const DRILL_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    shellCss: "transform: translateZ(0);",
    navCss: "position: fixed; top: 0; height: 56px; z-index: 100;",
    mainCss: "padding-top: 56px;",
    htmlCss: "scroll-padding-top: 64px;",
    simBug: "hijack",
    reason: "错在 .page 外层写了 transform: translateZ(0)。根据 CSS Transforms 规范，非 none 的 transform 会取代视口成为 fixed 后代的包含块，滚动文档时导航栏会跟着正文一起滚出屏幕。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    shellCss: "transform: none;",
    navCss: "position: fixed; top: 0; height: 56px; z-index: 100;",
    mainCss: "padding-top: 56px;",
    htmlCss: "/* 未设置 scroll-padding-top */",
    simBug: "anchorCut",
    reason: "错在漏了 html { scroll-padding-top }。虽然首屏 padding-top: 56px 保住了开头，但点击目录跳到 #install 或按 Shift+Tab 回退焦点时，目标会被 56px 顶栏直接切掉，违反 WCAG 2.2 2.4.11。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: true,
    shellCss: "transform: none;",
    navCss: "position: fixed; top: 0; height: 56px; z-index: 100;",
    mainCss: "padding-top: 56px;",
    htmlCss: "scroll-padding-top: 64px;",
    simBug: "ok",
    reason: "完全正确！四项条件一次到位：外层无 transform 劫持，视口稳当包含块；顶栏 z-index: 100 稳压正文卡的 z-index: 5；首屏 56px 让位防首行裁切；64px scroll-padding-top 为锚点与键盘焦点再留 8px 呼吸余量。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    shellCss: "transform: none;",
    navCss: "position: fixed; top: 0; height: 56px; z-index: 1;",
    mainCss: "padding-top: 56px;",
    htmlCss: "scroll-padding-top: 64px;",
    simBug: "zInvert",
    reason: "错在导航栏只给了 z-index: 1。题干中的正文状态提醒卡带有 position: relative; z-index: 5，滚到那张卡片时正文会直接反压在导航栏上面，挡住点击并破坏层级秩序。",
  },
];
