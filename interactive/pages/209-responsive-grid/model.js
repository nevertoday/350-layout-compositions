// 209 响应式网格 — 单真源模型（状态 + 三端几何实算 + 诊断 + 活体 CSS）
// 页面中所有画布、读数、原理状态灯、诊单与 CSS 代码均由本模块统一派生，绝不写死常量。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报样例",
    shortLabel: "原海报",
    heroTitle: "响应式网格",
    heroEn: "RESPONSIVE GRID",
    heroBody: "网格系统根据可用空间调整列数、间距与内容层级，提供一致的阅读体验。",
    cta: "了解更多 LEARN MORE →",
    motif: "mountain",
    cards: [
      { icon: "grid", title: "多列布局", en: "MULTI-COLUMN", desc: "充分利用宽屏空间" },
      { icon: "hierarchy", title: "清晰层级", en: "CLEAR HIERARCHY", desc: "信息主次分明" },
      { icon: "rhythm", title: "节奏与留白", en: "RHYTHM & SPACE", desc: "舒适阅读节奏" },
      { icon: "consistent", title: "一致体验", en: "CONSISTENT", desc: "跨设备保持一致" },
    ],
  },
  bookstore: {
    id: "bookstore",
    label: "线上书店",
    shortLabel: "书店",
    heroTitle: "建筑季刊特集",
    heroEn: "EDITORIAL ARCHIVE",
    heroBody: "同一册电子特刊在桌面展开四栏目录，到平板收为双栏对照，手机化作顺手列表。",
    cta: "翻阅本期 READ ISSUE →",
    motif: "arch",
    cards: [
      { icon: "grid", title: "空间测绘", en: "SURVEY", desc: "十二帧剖面手稿" },
      { icon: "hierarchy", title: "编者导读", en: "ESSAY", desc: "三千字长文精排" },
      { icon: "rhythm", title: "印前注记", en: "COLOPHON", desc: "字体与纸张规格" },
      { icon: "consistent", title: "藏书索引", en: "INDEX", desc: "跨年卷期检索" },
    ],
  },
  product: {
    id: "product",
    label: "声学新品",
    shortLabel: "产品",
    heroTitle: "桌面监听音箱",
    heroEn: "STUDIO MONITOR M4",
    heroBody: "关键声学指标与购买入口在每种屏幕尺寸下都保持首屏可见，不因折列而丢失。",
    cta: "查看声学规格 SPECS →",
    motif: "speaker",
    cards: [
      { icon: "grid", title: "双分频单元", en: "BI-AMP", desc: "独立功放低失真" },
      { icon: "hierarchy", title: "平直频响", en: "FLAT CURVE", desc: "近场监听精准还原" },
      { icon: "rhythm", title: "声学导向孔", en: "FRONT PORT", desc: "贴墙摆放不闷浑" },
      { icon: "consistent", title: "多端校准", en: "ROOM EQ", desc: "桌面与支架双模" },
    ],
  },
};

export const DEVICES = [
  { id: "desktop", name: "桌面端", en: "DESKTOP", width: 1280, rangeLabel: "≥ 1280px" },
  { id: "tablet", name: "平板端", en: "TABLET", width: 820, rangeLabel: "768px – 1279px" },
  { id: "mobile", name: "移动端", en: "MOBILE", width: 375, rangeLabel: "≤ 767px" },
];

export const INITIAL_STATE = {
  viewportWidth: 375,
  bp1: 420,
  bp2: 580,
  adaptMode: "fixed", // "fixed" | "shrink" | "fluid"
  colsDesktop: 4,
  colsTablet: 4,
  colsMobile: 4,
  heroMobileLayout: "side", // "side" | "stack"
  hierarchyOrder: "hero-first", // "hero-first" | "cards-first"
  theme: "poster",
};

export const PRESETS = {
  initial: {
    label: "复原开场错态",
    patch: {
      viewportWidth: 375,
      bp1: 420,
      bp2: 580,
      adaptMode: "fixed",
      colsDesktop: 4,
      colsTablet: 4,
      colsMobile: 4,
      heroMobileLayout: "side",
      hierarchyOrder: "hero-first",
    },
  },
  posterClassic: {
    label: "原海报 4→2→1 解",
    patch: {
      bp1: 768,
      bp2: 1280,
      adaptMode: "fluid",
      colsDesktop: 4,
      colsTablet: 2,
      colsMobile: 1,
      heroMobileLayout: "stack",
      hierarchyOrder: "hero-first",
    },
  },
  compactThree: {
    label: "平板三列 4→3→1 解",
    patch: {
      bp1: 640,
      bp2: 1080,
      adaptMode: "fluid",
      colsDesktop: 4,
      colsTablet: 3,
      colsMobile: 1,
      heroMobileLayout: "stack",
      hierarchyOrder: "hero-first",
    },
  },
  editorialWide: {
    label: "宽舒出版 3→2→1 解",
    patch: {
      bp1: 720,
      bp2: 1140,
      adaptMode: "fluid",
      colsDesktop: 3,
      colsTablet: 2,
      colsMobile: 1,
      heroMobileLayout: "stack",
      hierarchyOrder: "hero-first",
    },
  },
  errShrink: {
    label: "试错：整页微缩",
    patch: {
      viewportWidth: 375,
      bp1: 768,
      bp2: 1280,
      adaptMode: "shrink",
      colsDesktop: 4,
      colsTablet: 2,
      colsMobile: 1,
      heroMobileLayout: "stack",
      hierarchyOrder: "hero-first",
    },
  },
  errSingleCol: {
    label: "试错：全端单列",
    patch: {
      viewportWidth: 1280,
      bp1: 768,
      bp2: 1280,
      adaptMode: "fluid",
      colsDesktop: 1,
      colsTablet: 1,
      colsMobile: 1,
      heroMobileLayout: "stack",
      hierarchyOrder: "hero-first",
    },
  },
  errInverted: {
    label: "试错：小屏倒置",
    patch: {
      viewportWidth: 375,
      bp1: 768,
      bp2: 1280,
      adaptMode: "fluid",
      colsDesktop: 4,
      colsTablet: 2,
      colsMobile: 1,
      heroMobileLayout: "stack",
      hierarchyOrder: "cards-first",
    },
  },
};

export function clampState(s) {
  const next = { ...s };
  next.viewportWidth = Math.round(Math.max(320, Math.min(1440, Number(next.viewportWidth) || 375)));
  next.bp1 = Math.round(Math.max(320, Math.min(960, Number(next.bp1) || 340)));
  next.bp2 = Math.round(Math.max(next.bp1 + 100, Math.min(1400, Number(next.bp2) || 480)));
  next.colsDesktop = Math.max(1, Math.min(4, Math.round(Number(next.colsDesktop) || 4)));
  next.colsTablet = Math.max(1, Math.min(4, Math.round(Number(next.colsTablet) || 2)));
  next.colsMobile = Math.max(1, Math.min(4, Math.round(Number(next.colsMobile) || 1)));
  if (!["fixed", "shrink", "fluid"].includes(next.adaptMode)) next.adaptMode = "fluid";
  if (!["side", "stack"].includes(next.heroMobileLayout)) next.heroMobileLayout = "stack";
  if (!["hero-first", "cards-first"].includes(next.hierarchyOrder)) next.hierarchyOrder = "hero-first";
  if (!THEMES[next.theme]) next.theme = "poster";
  return next;
}

export function getTierForWidth(state, width) {
  if (width >= state.bp2) return "desktop";
  if (width >= state.bp1) return "tablet";
  return "mobile";
}

// 依据真实宽度与策略，算出单台设备的精确几何指标与故障列表
export function evaluateDevice(state, width, slotId = "live") {
  const tier = getTierForWidth(state, width);
  const fixedBase = 1280;
  let renderedWidth = width;
  let scale = 1;
  let activeCols = state.colsDesktop;
  let heroMode = "side";
  let listRowMode = false;

  if (state.adaptMode === "fixed") {
    renderedWidth = fixedBase;
    activeCols = state.colsDesktop;
    heroMode = "side";
  } else if (state.adaptMode === "shrink") {
    renderedWidth = width;
    scale = Math.min(1, width / fixedBase);
    activeCols = state.colsDesktop;
    heroMode = "side";
  } else {
    renderedWidth = Math.min(width, 1360);
    activeCols = tier === "desktop" ? state.colsDesktop : tier === "tablet" ? state.colsTablet : state.colsMobile;
    if (tier === "desktop") {
      heroMode = activeCols === 1 ? "stack" : "side";
    } else if (tier === "tablet") {
      heroMode = "stack";
    } else {
      heroMode = state.heroMobileLayout;
    }
    listRowMode = width < 560 && activeCols === 1;
  }

  const overflowPx = Math.max(0, Math.round(renderedWidth - width));
  const logicalCanvasW = state.adaptMode === "shrink" ? fixedBase : renderedWidth;
  const padX = state.adaptMode === "fluid"
    ? (tier === "desktop" ? 52 : tier === "tablet" ? 32 : 20)
    : 52;
  const gutter = state.adaptMode === "fluid"
    ? (tier === "desktop" ? 24 : tier === "tablet" ? 18 : 12)
    : 24;

  const innerW = Math.max(120, logicalCanvasW - padX * 2);
  const rawCardW = (innerW - (activeCols - 1) * gutter) / activeCols;
  const cardWidth = Math.round(rawCardW * scale);
  const effectiveFontPx = +( (tier === "mobile" && state.adaptMode === "fluid" ? 15 : 16) * scale ).toFixed(1);

  // Hero 文本区宽度与估算中文单行字数（明确标注为经验估算）
  const rawHeroTextW = heroMode === "side" ? innerW * 0.46 : innerW;
  const heroTextWidth = Math.round(rawHeroTextW * scale);
  const charUnit = state.adaptMode === "fluid" ? (tier === "mobile" ? 15 : 16) : 16;
  const estHeroChars = Math.max(3, Math.round(rawHeroTextW / charUnit));
  const estCardChars = Math.max(3, Math.round((rawCardW - 20) / 14));

  const inverted = state.hierarchyOrder === "cards-first" && width < 960;

  // 判定本设备的各类真错态
  const issues = [];
  if (overflowPx > 0) {
    issues.push({
      code: "overflow",
      severity: 100 + overflowPx / 100,
      short: `溢出 +${overflowPx}px`,
      headline: `${width}px 屏幕向右溢出 +${overflowPx}px`,
      why: "容器写死 1280px 宽度，浏览器无法按屏宽折行，读者必须左右拖动滚动条，违背 WCAG 2.1 1.4.10 单向滚动要求。",
      fixLabel: "改用相对单位 fr 与断点重排",
      fixAction: "fix-fluid",
    });
  }
  if (state.adaptMode === "shrink" && effectiveFontPx < 11) {
    issues.push({
      code: "shrink-tiny",
      severity: 95,
      short: `蚂蚁字 ${effectiveFontPx}px`,
      headline: `整页等比微缩，等效正文仅 ${effectiveFontPx}px`,
      why: "虽然没有横向滚动条，但把 1280px 桌面硬缩进窄屏后文字细如针尖，手机端必须反复双指放大才能阅读。",
      fixLabel: "切回弹性重排与正常字号",
      fixAction: "fix-fluid",
    });
  }
  if (state.adaptMode === "fluid" && cardWidth < 138 && !listRowMode) {
    issues.push({
      code: "cramped-cards",
      severity: 85,
      short: `挤扁 ${cardWidth}px`,
      headline: `${width}px 强塞 ${activeCols} 列，单卡仅宽 ${cardWidth}px`,
      why: `经验上单张图文卡低于 140px 时，标题与说明折成碎条，留白和图标会互相顶撞。`,
      fixLabel: width < 600 ? "移动端改为 1 列并调高断点" : "平板端减为 2 列",
      fixAction: width < 600 ? "fix-mobile-cols" : "fix-tablet-cols",
    });
  }
  if (state.adaptMode === "fluid" && width < 560 && heroMode === "side" && heroTextWidth < 175) {
    issues.push({
      code: "cramped-hero",
      severity: 78,
      short: `文区 ${heroTextWidth}px`,
      headline: `小屏硬拼左文右图，正文区塌缩至 ${heroTextWidth}px`,
      why: `文字被山月主图挤成每行约 ${estHeroChars} 个汉字的窄竖条，视线频繁折返，首屏导读极度吃力。`,
      fixLabel: "小屏头图改为上下堆叠",
      fixAction: "fix-hero-stack",
    });
  }
  if (state.adaptMode === "fluid" && width >= 1100 && activeCols === 1) {
    issues.push({
      code: "desktop-underused",
      severity: 72,
      short: `单行约 ${estHeroChars} 字`,
      headline: `${width}px 宽屏仍锁 1 列，估算行长达 ${estHeroChars} 汉字`,
      why: "把手机单列直接铺到桌面宽屏，眼睛从行尾扫回下一行极易串行，且大块横屏空间未被网格组织。",
      fixLabel: "桌面端展开为 4 列布局",
      fixAction: "fix-desktop-cols",
    });
  }
  if (inverted) {
    issues.push({
      code: "inverted-hierarchy",
      severity: 82,
      short: "主角跌出首屏",
      headline: "次要卡片压在主标题之上，视觉层级倒挂",
      why: "小屏重排把四项辅助特性顶到最上方，核心标题、主图与行动按钮被挤出第一屏，读者打开不知所云。",
      fixLabel: "恢复主角居首层级",
      fixAction: "fix-hierarchy",
    });
  }

  return {
    slotId,
    width,
    tier,
    tierLabel: tier === "desktop" ? "桌面区间" : tier === "tablet" ? "平板区间" : "移动区间",
    activeCols,
    renderedWidth,
    overflowPx,
    scale,
    effectiveFontPx,
    cardWidth,
    heroMode,
    heroTextWidth,
    estHeroChars,
    estCardChars,
    listRowMode,
    inverted,
    issues,
    ok: issues.length === 0,
  };
}

export function evaluateAll(rawState) {
  const state = clampState(rawState);
  const desktop = evaluateDevice(state, 1280, "desktop");
  const tablet = evaluateDevice(state, 820, "tablet");
  const mobile = evaluateDevice(state, 375, "mobile");
  const live = evaluateDevice(state, state.viewportWidth, "live");

  const deviceList = [desktop, tablet, mobile];
  const allIssues = [];

  // 检查断点区间自身是否合理（即使在 fluid 下，断点反常也会导致阶梯失效）
  const bpRangeValid =
    state.adaptMode === "fluid" &&
    state.bp1 >= 520 &&
    state.bp1 <= 820 &&
    state.bp2 >= 980 &&
    state.bp2 <= 1340 &&
    state.bp2 - state.bp1 >= 220;

  if (state.adaptMode === "fluid" && !bpRangeValid) {
    allIssues.push({
      deviceId: "breakpoints",
      code: "bad-breakpoints",
      severity: 76,
      short: `断点 ${state.bp1}/${state.bp2}`,
      headline:
        state.bp1 < 520
          ? `移动→平板断点设在 ${state.bp1}px 过早，手机就被迫升档`
          : state.bp2 < 980
            ? `平板→桌面断点设在 ${state.bp2}px 过低，平板提前挤进桌面列数`
            : `两道断点（${state.bp1}px / ${state.bp2}px）过近或过高，中屏过渡失衡`,
      why: "断点应当落在内容真正需要改变列数的宽度带（经验上中屏约 540–800px，宽屏约 1000–1320px），避免某类屏幕夹在错档里。",
      fixLabel: "校准断点至 768px / 1280px",
      fixAction: "fix-breakpoints",
    });
  }

  for (const dev of deviceList) {
    for (const iss of dev.issues) {
      allIssues.push({ ...iss, deviceId: dev.slotId, deviceWidth: dev.width });
    }
  }

  // 列数逐级收敛检查（桌面 ≥ 平板 ≥ 移动，且至少有两档变化）
  const colsMonotonic =
    state.adaptMode === "fluid" &&
    desktop.activeCols >= tablet.activeCols &&
    tablet.activeCols >= mobile.activeCols &&
    desktop.activeCols >= 3 &&
    mobile.activeCols === 1 &&
    tablet.activeCols >= 2 &&
    tablet.activeCols <= 3;

  // 四项原海报核心原理单真源评估
  const pBreakpoints = bpRangeValid;
  const pReflow =
    state.adaptMode === "fluid" &&
    colsMonotonic &&
    mobile.issues.every((i) => i.code !== "cramped-cards") &&
    tablet.issues.every((i) => i.code !== "cramped-cards") &&
    desktop.issues.every((i) => i.code !== "desktop-underused");
  const pAdapt =
    state.adaptMode === "fluid" &&
    desktop.overflowPx === 0 &&
    tablet.overflowPx === 0 &&
    mobile.overflowPx === 0 &&
    mobile.effectiveFontPx >= 14;
  const pHierarchy =
    state.hierarchyOrder === "hero-first" &&
    (state.adaptMode === "fluid" ? mobile.heroMode === "stack" : false) &&
    desktop.heroMode === "side";

  const principles = {
    breakpoints: {
      ok: pBreakpoints,
      tag: state.adaptMode !== "fluid" ? "未启用断点" : pBreakpoints ? `${state.bp1} / ${state.bp2}px` : `偏位 ${state.bp1}/${state.bp2}`,
    },
    reflow: {
      ok: pReflow,
      tag: state.adaptMode !== "fluid"
        ? `锁死 ${desktop.activeCols} 列`
        : `${desktop.activeCols}→${tablet.activeCols}→${mobile.activeCols} 列`,
    },
    adapt: {
      ok: pAdapt,
      tag: mobile.overflowPx > 0
        ? `手机溢 +${mobile.overflowPx}px`
        : state.adaptMode === "shrink"
          ? `微缩 ${mobile.effectiveFontPx}px`
          : "fr 零溢出",
    },
    hierarchy: {
      ok: pHierarchy,
      tag: state.hierarchyOrder === "cards-first"
        ? "主角跌出首屏"
        : mobile.heroMode === "side"
          ? "小屏左右硬拼"
          : "三端主次清晰",
    },
  };

  const passCount = [pBreakpoints, pReflow, pAdapt, pHierarchy].filter(Boolean).length;
  const failCount = 4 - passCount;

  // 排序取出首要诊因
  allIssues.sort((a, b) => b.severity - a.severity);
  const primaryIssue = allIssues[0] || null;

  let summaryBadge = "三端稳态成立";
  let summaryTitle = `三端通过：${desktop.activeCols}→${tablet.activeCols}→${mobile.activeCols} 列清晰重排`;
  let summaryWhy = `在 ${state.bp1}px 与 ${state.bp2}px 两道断点驱动下，桌面（卡宽 ${desktop.cardWidth}px）、平板（卡宽 ${tablet.cardWidth}px）与手机（单列 ${mobile.cardWidth}px，零溢出）都守住了舒适行宽与首屏视觉焦点。继续拖动断点切刀或尝试不同列数，体验多组合法解。`;
  let fixLabel = "";
  let fixAction = "";

  if (primaryIssue) {
    summaryBadge = `三端体检 · ${failCount} 项失稳`;
    summaryTitle = primaryIssue.headline;
    summaryWhy = primaryIssue.why;
    fixLabel = primaryIssue.fixLabel;
    fixAction = primaryIssue.fixAction;
  } else if (failCount > 0) {
    summaryBadge = `三端体检 · ${failCount} 项待校`;
    if (!pReflow) {
      summaryTitle = `列数阶梯（${desktop.activeCols}→${tablet.activeCols}→${mobile.activeCols}）未形成合理收敛`;
      summaryWhy = "响应式网格应随屏宽变窄逐级减少列数（如 4→2→1 或 3→2→1），避免平板和手机保留过多窄列或桌面过于稀松。";
      fixLabel = "校准为 4→2→1 阶梯列数";
      fixAction = "fix-cols-ladder";
    } else if (!pHierarchy) {
      summaryTitle = "小屏头图布局或模块顺序削弱了视觉焦点";
      summaryWhy = "让核心标题、主图与按钮在小屏自然垂直堆叠并居首，才能保证跨设备层级一致。";
      fixLabel = "恢复小屏垂直堆叠层级";
      fixAction = "fix-hero-stack";
    }
  }

  // 生成实时活体 CSS（与当前规则严格一致）
  const liveCss = buildLiveCss(state, { desktop, tablet, mobile });

  return {
    state,
    theme: THEMES[state.theme],
    devices: { desktop, tablet, mobile },
    live,
    principles,
    passCount,
    failCount,
    allValid: failCount === 0 && !primaryIssue,
    summaryBadge,
    summaryTitle,
    summaryWhy,
    fixLabel,
    fixAction,
    primaryIssue,
    liveCss,
  };
}

export function applyFixAction(state, action) {
  const s = { ...state };
  switch (action) {
    case "fix-fluid":
      s.adaptMode = "fluid";
      if (s.bp1 < 520) s.bp1 = 768;
      if (s.bp2 < 980) s.bp2 = 1280;
      if (s.colsMobile > 1) s.colsMobile = 1;
      if (s.colsTablet > 2) s.colsTablet = 2;
      break;
    case "fix-breakpoints":
      s.adaptMode = "fluid";
      s.bp1 = 768;
      s.bp2 = 1280;
      break;
    case "fix-mobile-cols":
      s.adaptMode = "fluid";
      s.colsMobile = 1;
      if (s.bp1 < 540) s.bp1 = 768;
      break;
    case "fix-tablet-cols":
      s.adaptMode = "fluid";
      s.colsTablet = 2;
      if (s.bp2 < 1000) s.bp2 = 1280;
      break;
    case "fix-desktop-cols":
      s.adaptMode = "fluid";
      s.colsDesktop = 4;
      break;
    case "fix-hero-stack":
      s.heroMobileLayout = "stack";
      s.hierarchyOrder = "hero-first";
      break;
    case "fix-hierarchy":
      s.hierarchyOrder = "hero-first";
      break;
    case "fix-cols-ladder":
      s.adaptMode = "fluid";
      s.colsDesktop = 4;
      s.colsTablet = 2;
      s.colsMobile = 1;
      break;
    default:
      Object.assign(s, PRESETS.posterClassic.patch);
  }
  return clampState(s);
}

function buildLiveCss(state, { desktop, tablet, mobile }) {
  if (state.adaptMode === "fixed") {
    return `.grid-shell { width: 1280px; /* 锁死像素：手机端溢出 +${mobile.overflowPx}px */ }
.cards { display: grid; grid-template-columns: repeat(${state.colsDesktop}, 1fr); gap: 24px; }`;
  }
  if (state.adaptMode === "shrink") {
    return `/* 缺失响应式 viewport：按 ${(mobile.scale * 100).toFixed(0)}% 整页硬缩 */
.grid-shell { width: 1280px; transform: scale(${mobile.scale.toFixed(2)}); /* 等效字号 ${mobile.effectiveFontPx}px */ }`;
  }
  const heroRule = state.heroMobileLayout === "stack" ? "1fr" : "1fr 1fr /* 小屏硬挤 */";
  const orderWarn = state.hierarchyOrder === "cards-first" ? "\n.cards { order: -1; /* ⚠ 卡片压过主角 */ }" : "";
  return `.hero  { display: grid; grid-template-columns: ${heroRule}; gap: 16px; }
.cards { display: grid; grid-template-columns: repeat(${state.colsMobile}, minmax(0, 1fr)); gap: 12px; }
@media (min-width: ${state.bp1}px) { .cards { grid-template-columns: repeat(${state.colsTablet}, 1fr); gap: 18px; } }
@media (min-width: ${state.bp2}px) { .hero { grid-template-columns: 1fr 1fr; } .cards { grid-template-columns: repeat(${state.colsDesktop}, 1fr); gap: 24px; } }${orderWarn}`;
}
