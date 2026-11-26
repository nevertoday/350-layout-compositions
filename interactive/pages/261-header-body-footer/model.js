// 261 页眉—主体—页脚 单真源布局与诊断模型
// 画布绘制、顶带/中带/底带探针、实时读数与交互拖拽全部读取同一份 computeLayout(state) 结果。

export const VIEWPORT_H = 640; // 虚拟标准视口高度（单位：虚拟 px）
export const PAGE_W = 620; // 虚拟微网页内容宽度（贴合原海报饱满大画框比例）

export const SCENES = {
  editorial: {
    id: "editorial",
    label: "原海报 · 编辑门户",
    short: "编辑门户",
    url: "archive.layout / issue-261",
    brandName: "三段志 · ARCHIVE",
    navItems: ["专题", "图谱", "目录"],
    heroTitle: "用三段边界建立轻松的阅读秩序",
    heroSub: "顶部定坐标，中段立主次，底部留出口。",
    cardLabels: ["结构", "对比", "节奏"],
    listLeft: ["页眉界定预期", "主体建立层次"],
    listRight: ["页脚完成收束", "三段协同递进"],
    linksCols: ["栏目索引", "关于刊物", "订阅通讯"],
    legalText: "© 261 编辑版式档案 · 隐私与使用条款",
  },
  saas: {
    id: "saas",
    label: "产品官网 · SaaS",
    short: "产品官网",
    url: "gridcraft.app / overview",
    brandName: "GRIDCRAFT",
    navItems: ["功能", "定价", "文档"],
    heroTitle: "十分钟搭好整站信息骨架",
    heroSub: "导航清晰、卖点聚焦、底部安全兜底。",
    cardLabels: ["快搭", "规范", "协同"],
    listLeft: ["统一顶栏入口", "首屏直给价值"],
    listRight: ["门垫次级导航", "合规信任凭据"],
    linksCols: ["产品能力", "开发文档", "帮助支持"],
    legalText: "© GridCraft · 服务协议 · 安全合规",
  },
  journal: {
    id: "journal",
    label: "深度阅读 · 出版刊",
    short: "深度长文",
    url: "press.design / essays / framing",
    brandName: "版面季刊 · PRESS",
    navItems: ["卷首", "专论", "归档"],
    heroTitle: "从书眉到语义地标：网页如何学会分段",
    heroSub: "长文阅读最怕顶栏霸屏与结尾断崖。",
    cardLabels: ["书眉", "正文", "尾注"],
    listLeft: ["滚屏释放视口", "保持舒适行宽"],
    listRight: ["文末延伸索引", "编委与版权号"],
    linksCols: ["本期目录", "作者索引", "投稿联络"],
    legalText: "© 版面季刊 · ISSN 归档 · 许可说明",
  },
};

export const MODULES = {
  brand: {
    id: "brand",
    title: "品牌与主导航",
    en: "BRAND · NAV",
    ideal: "header",
    baseH: 54,
    roleDesc: "标识站名、回首页入口与一级栏目，应稳居页眉。",
  },
  search: {
    id: "search",
    title: "全局搜索与入口",
    en: "SEARCH · CTA",
    ideal: "header",
    baseH: 38,
    roleDesc: "全站检索与高频操作，常与主导航并排落在页眉。",
  },
  hero: {
    id: "hero",
    title: "主视觉与核心叙事",
    en: "HERO · LEAD",
    ideal: "body",
    baseH: 186,
    roleDesc: "页面最核心的信息焦点，必须作为主体开篇登场。",
  },
  cards: {
    id: "cards",
    title: "三联要点与细节",
    en: "SEQUENCE · GRID",
    ideal: "body",
    baseH: 158,
    roleDesc: "通过卡片与列表展开层次对比，属于主体中段节奏。",
  },
  links: {
    id: "links",
    title: "次级导航与订阅",
    en: "DOORMAT · LINKS",
    ideal: "footer",
    baseH: 64,
    roleDesc: "服务「滑到底还想找点什么」的读者，应归入页脚。",
  },
  legal: {
    id: "legal",
    title: "版权与隐私兜底",
    en: "COPYRIGHT · TRUST",
    ideal: "footer",
    baseH: 46,
    roleDesc: "法律条款、备案与联系底线，负责页脚收束与信任感。",
  },
};

export const MODULE_ORDER = ["brand", "search", "hero", "cards", "links", "legal"];
export const ZONE_KEYS = ["header", "body", "footer"];
export const ZONE_LABELS = {
  header: { zh: "页眉", en: "HEADER" },
  body: { zh: "主体", en: "BODY" },
  footer: { zh: "页脚", en: "FOOTER" },
};

export const STICKY_MODES = {
  scroll: { id: "scroll", label: "随滚收起", short: "随滚", desc: "滚出顶屏后离开视口，把完整高度让给主体。" },
  compact: { id: "compact", label: "紧凑吸顶", short: "紧凑吸顶", desc: "滚屏时自动收缩为 54px 细顶条，兼顾入口与阅读区。" },
  locked: { id: "locked", label: "死锁吸顶", short: "死锁吸顶", desc: "整块页眉全高锁死在顶部，高页眉会直接吞屏。" },
};

export const DOC_LENGTHS = {
  short: { id: "short", label: "短页", extraBody: 0 },
  standard: { id: "standard", label: "标准", extraBody: 176 },
  long: { id: "long", label: "长文", extraBody: 450 },
};

export function cloneState(s) {
  return {
    scene: s.scene,
    zones: {
      header: [...s.zones.header],
      body: [...s.zones.body],
      footer: [...s.zones.footer],
    },
    headerPad: s.headerPad,
    footerPad: s.footerPad,
    stickyMode: s.stickyMode,
    docLength: s.docLength,
    stickyFooter: s.stickyFooter,
    scrollNorm: s.scrollNorm,
    selectedMod: s.selectedMod ?? null,
    highlightBand: s.highlightBand ?? null,
  };
}

// 预置态：开场坏态 + 3 组合法解 + 4 组双向试错坏态
export const PRESETS = {
  broken: {
    label: "复原开场错态",
    state: {
      scene: "editorial",
      zones: {
        header: ["legal", "search"],
        body: ["links", "hero", "cards"],
        footer: ["brand"],
      },
      headerPad: 74, // 推高页眉到约 168px
      footerPad: 12,
      stickyMode: "locked",
      docLength: "standard",
      stickyFooter: false,
      scrollNorm: 0.24,
      selectedMod: "legal",
      highlightBand: null,
    },
  },
  classic: {
    label: "原海报经典解",
    state: {
      scene: "editorial",
      zones: {
        header: ["brand", "search"],
        body: ["hero", "cards"],
        footer: ["links", "legal"],
      },
      headerPad: 10, // ~74px
      footerPad: 10, // ~126px
      stickyMode: "scroll",
      docLength: "standard",
      stickyFooter: true,
      scrollNorm: 0.0,
      selectedMod: null,
      highlightBand: null,
    },
  },
  compactSticky: {
    label: "紧凑吸顶文档解",
    state: {
      scene: "journal",
      zones: {
        header: ["brand", "search"],
        body: ["hero", "cards"],
        footer: ["links", "legal"],
      },
      headerPad: 0, // ~64px，滚屏自动缩至 54px
      footerPad: 4,
      stickyMode: "compact",
      docLength: "long",
      stickyFooter: true,
      scrollNorm: 0.32,
      selectedMod: null,
      highlightBand: null,
    },
  },
  minimalLanding: {
    label: "极简短页粘底解",
    state: {
      scene: "saas",
      zones: {
        header: ["brand"],
        body: ["hero", "cards"],
        footer: ["legal"],
      },
      headerPad: 4, // ~58px
      footerPad: 6, // ~56px
      stickyMode: "scroll",
      docLength: "short",
      stickyFooter: true,
      scrollNorm: 0.0,
      selectedMod: null,
      highlightBand: null,
    },
  },
  // 反向试错（展示不同维度的破坏）
  errTopHeavy: {
    label: "试错：页眉霸屏",
    state: {
      scene: "editorial",
      zones: {
        header: ["brand", "search"],
        body: ["hero", "cards"],
        footer: ["links", "legal"],
      },
      headerPad: 108, // 压顶到 172px 且死锁
      footerPad: 8,
      stickyMode: "locked",
      docLength: "standard",
      stickyFooter: true,
      scrollNorm: 0.35,
      selectedMod: null,
      highlightBand: "header",
    },
  },
  errDumpFooter: {
    label: "试错：页脚垃圾场",
    state: {
      scene: "saas",
      zones: {
        header: ["brand"],
        body: ["hero"],
        footer: ["search", "cards", "links", "legal"],
      },
      headerPad: 4,
      footerPad: 38,
      stickyMode: "scroll",
      docLength: "short",
      stickyFooter: true,
      scrollNorm: 0.85,
      selectedMod: null,
      highlightBand: "footer",
    },
  },
  errFloatFooter: {
    label: "试错：短页悬空",
    state: {
      scene: "saas",
      zones: {
        header: ["brand"],
        body: ["hero"],
        footer: ["legal"],
      },
      headerPad: 4,
      footerPad: 6,
      stickyMode: "scroll",
      docLength: "short",
      stickyFooter: false,
      scrollNorm: 0.0,
      selectedMod: null,
      highlightBand: "footer",
    },
  },
  errHeadless: {
    label: "试错：无头无尾",
    state: {
      scene: "journal",
      zones: {
        header: [],
        body: ["hero", "cards", "brand", "search", "links", "legal"],
        footer: [],
      },
      headerPad: 0,
      footerPad: 0,
      stickyMode: "scroll",
      docLength: "standard",
      stickyFooter: true,
      scrollNorm: 0.1,
      selectedMod: null,
      highlightBand: "header",
    },
  },
};

export function createInitialState() {
  return cloneState(PRESETS.broken.state);
}

export function findModuleZone(state, modId) {
  for (const z of ZONE_KEYS) {
    if (state.zones[z].includes(modId)) return z;
  }
  return null;
}

export function moveModule(state, modId, targetZone, insertIndex = -1) {
  if (!MODULES[modId] || !ZONE_KEYS.includes(targetZone)) return state;
  const next = cloneState(state);
  for (const z of ZONE_KEYS) {
    const idx = next.zones[z].indexOf(modId);
    if (idx !== -1) next.zones[z].splice(idx, 1);
  }
  const arr = next.zones[targetZone];
  if (insertIndex >= 0 && insertIndex <= arr.length) arr.splice(insertIndex, 0, modId);
  else arr.push(modId);
  // 若移走的是原海报开场错态里的 legal 且用户主动整理好了页眉，保留当前高度让用户自己决定是否要拉薄页眉（绝不替用户作弊自动校准）
  next.selectedMod = modId;
  return next;
}

// 计算某模块落在指定段里的实际高度（模拟真实网页排布：brand 与 search 同在页眉时可并排紧凑，不会翻倍叠高）
function layoutZoneModules(zone, modIds, pad, extraBody = 0) {
  if (!modIds.length) {
    return { height: 0, items: [] };
  }
  const items = [];
  let y = 10;

  if (zone === "header") {
    // 特殊同行规则：若 brand 和 search 都在 header，它们能共享第一排导航带（高度 54），更符合真实页眉
    const hasBrand = modIds.includes("brand");
    const hasSearch = modIds.includes("search");
    if (hasBrand && hasSearch) {
      const topPad = Math.max(4, Math.round(10 + Math.max(0, pad) * 0.45));
      const rowH = Math.max(34, Math.min(82, 48 + Math.round(pad * 0.25)));
      items.push({ id: "brand", x: 16, y: topPad, w: 320, h: rowH, wrong: false });
      items.push({ id: "search", x: 344, y: topPad, w: PAGE_W - 360, h: rowH, wrong: false });
      y = topPad + rowH + 8;
      for (const id of modIds) {
        if (id === "brand" || id === "search") continue;
        const m = MODULES[id];
        const h = Math.min(m.baseH, 92);
        items.push({ id, x: 16, y, w: PAGE_W - 32, h, wrong: true });
        y += h + 8;
      }
      const rawH = Math.max(30, y + Math.max(2, Math.round(pad * 0.35)));
      return { height: Math.min(248, Math.max(30, rawH)), items };
    }
    const topPad = Math.max(4, Math.round(8 + Math.max(0, pad) * 0.38));
    y = topPad;
    for (const id of modIds) {
      const m = MODULES[id];
      const h = id === "brand" || id === "search"
        ? Math.max(28, Math.min(76, 46 + Math.round(pad * 0.2)))
        : Math.min(m.baseH, 86);
      const wrong = m.ideal !== "header";
      items.push({ id, x: 16, y, w: PAGE_W - 32, h, wrong });
      y += h + 8;
    }
    const rawH = y + Math.max(2, Math.round(pad * 0.42));
    return { height: Math.min(248, Math.max(30, rawH)), items };
  }

  if (zone === "body") {
    y = 14;
    for (const id of modIds) {
      const m = MODULES[id];
      const h = m.baseH;
      const wrong = m.ideal !== "body";
      items.push({ id, x: 16, y, w: PAGE_W - 32, h, wrong });
      y += h + 14;
    }
    const totalH = y + extraBody + 6;
    return { height: Math.max(120, totalH), items };
  }

  // footer
  const topPad = Math.max(6, Math.round(10 + Math.max(0, pad) * 0.32));
  y = topPad;
  for (const id of modIds) {
    const m = MODULES[id];
    const h = m.ideal === "footer" ? m.baseH : Math.min(m.baseH, 96);
    const wrong = m.ideal !== "footer" && id !== "search"; // search 在页脚可作为兜底检索，不算严重串台，但品牌/主图/三联卡放页脚算错
    items.push({ id, x: 16, y, w: PAGE_W - 32, h, wrong });
    y += h + 8;
  }
  const rawH = y + Math.max(4, Math.round(pad * 0.42));
  return { height: Math.min(340, Math.max(32, rawH)), items };
}

export function computeLayout(state) {
  const docMeta = DOC_LENGTHS[state.docLength] || DOC_LENGTHS.standard;
  const hCalc = layoutZoneModules("header", state.zones.header, state.headerPad);
  const bCalc = layoutZoneModules("body", state.zones.body, 0, docMeta.extraBody);
  const fCalc = layoutZoneModules("footer", state.zones.footer, state.footerPad);

  const headerH = hCalc.height;
  const bodyRawH = bCalc.height;
  const footerH = fCalc.height;

  // 若页面总内容短于 640px 视口，检查粘底锁是否生效
  const naturalTotalH = headerH + bodyRawH + footerH;
  let bodyH = bodyRawH;
  let footerFloatGap = 0;
  if (naturalTotalH < VIEWPORT_H && footerH > 0) {
    if (state.stickyFooter) {
      bodyH = VIEWPORT_H - headerH - footerH;
      footerFloatGap = 0;
    } else {
      footerFloatGap = VIEWPORT_H - naturalTotalH;
    }
  } else if (naturalTotalH < VIEWPORT_H && footerH === 0) {
    bodyH = Math.max(bodyRawH, VIEWPORT_H - headerH);
  }

  const headerY = 0;
  const bodyY = headerH;
  const footerY = headerH + bodyH;
  const contentBottomY = footerY + footerH;
  const docH = Math.max(VIEWPORT_H, contentBottomY);
  const maxScroll = Math.max(0, docH - VIEWPORT_H);
  const scrollNorm = Math.min(1, Math.max(0, state.scrollNorm || 0));
  const scrollY = Math.round(scrollNorm * maxScroll);

  // 吸顶高度计算
  let stickyHeight = 0;
  if (headerH > 0) {
    if (state.stickyMode === "compact") stickyHeight = Math.min(headerH, 54);
    else if (state.stickyMode === "locked") stickyHeight = headerH;
  }
  // 当前视口状态下，屏幕顶部被页眉占用的实测像素
  const headerVisibleNow =
    headerH === 0
      ? 0
      : state.stickyMode === "scroll"
        ? Math.max(0, headerH - scrollY)
        : scrollY <= Math.max(0, headerH - stickyHeight)
          ? headerH - scrollY
          : stickyHeight;

  // 首屏（scrollY = 0）主体真实可见高度与占比
  const firstFoldBodyH = Math.max(0, Math.min(VIEWPORT_H, bodyY + bodyH) - bodyY);
  const firstFoldBodyPct = Math.round((firstFoldBodyH / VIEWPORT_H) * 100);
  // 滚屏中段主体净阅读视口占比（扣除吸顶）
  const scrollClearH = Math.max(0, VIEWPORT_H - stickyHeight);
  const scrollClearPct = Math.round((scrollClearH / VIEWPORT_H) * 100);
  const headerVpPct = Math.round((headerH / VIEWPORT_H) * 100);
  const stickyVpPct = Math.round((stickyHeight / VIEWPORT_H) * 100);
  const bodyDocPct = Math.round((bodyH / docH) * 100);
  const footerDocPct = Math.round((footerH / docH) * 100);

  // 10 类双向真错态检测（全部来自实绘几何与落位）
  const hMods = state.zones.header;
  const bMods = state.zones.body;
  const fMods = state.zones.footer;

  const headerMisplaced = hMods.filter((id) => MODULES[id].ideal !== "header");
  const bodyMisplaced = bMods.filter((id) => MODULES[id].ideal !== "body");
  const footerMisplaced = fMods.filter((id) => MODULES[id].ideal !== "footer" && id !== "search");
  const misplacedTotal = headerMisplaced.length + bodyMisplaced.length + footerMisplaced.length;

  const heroIdx = bMods.indexOf("hero");
  const linksBeforeHero = heroIdx > 0 && bMods.indexOf("links") !== -1 && bMods.indexOf("links") < heroIdx;

  // 1) FRAMING 定位与引导
  const framingIssues = [];
  if (hMods.length === 0) framingIssues.push({ code: "headless", short: "缺少页眉", msg: "页面没有页眉，读者进来不知道身在何处、也没有回首页与全局导航入口。" });
  else {
    if (headerMisplaced.length) framingIssues.push({ code: "headerPolluted", short: "页眉串台", msg: `页眉里混进了「${headerMisplaced.map((id) => MODULES[id].title).join("、")}」，把非定位杂项抬到了最贵的首屏入口。` });
    if (!hMods.includes("brand")) framingIssues.push({ code: "noBrandInHeader", short: "导航落外", msg: "「品牌与主导航」不在页眉里，顶部失去身份锚点与主路由。" });
    if (headerH < 46) framingIssues.push({ code: "headerCrushed", short: `挤扁 ${headerH}px`, msg: `页眉压扁到仅 ${headerH}px，标题与导航触控高度不足，手指极易误点。` });
    if (headerH > 116) framingIssues.push({ code: "headerBloated", short: `压顶 ${headerH}px`, msg: `页眉高达 ${headerH}px（占视口 ${headerVpPct}%），把核心主体一路往下推，首屏定位喧宾夺主。` });
    if (state.stickyMode === "locked" && stickyHeight > 86) framingIssues.push({ code: "stickyEatScreen", short: `吸顶吞屏 ${stickyVpPct}%`, msg: `高 ${stickyHeight}px 的页眉死锁吸顶，滚动阅读时持续遮掉 ${stickyVpPct}% 视口高度，视线被迫缩在窄缝里读正文。` });
  }
  const framingOk = framingIssues.length === 0;

  // 2) SEQUENCE 内容与层次
  const sequenceIssues = [];
  if (!bMods.includes("hero")) sequenceIssues.push({ code: "noHeroInBody", short: "主叙事缺位", msg: "「主视觉与核心叙事」不在主体里，整页失去了最核心的视觉起点。" });
  if (!bMods.includes("cards")) sequenceIssues.push({ code: "noCardsInBody", short: "缺层次展开", msg: "「三联要点与细节」被移出主体，正文只有单层骨架、缺少节奏递进。" });
  if (linksBeforeHero) sequenceIssues.push({ code: "linksBeforeHero", short: "次级挡路", msg: "「次级导航与订阅」横插在主视觉上方，读者还没看懂主题就被打断。" });
  else if (bodyMisplaced.length) sequenceIssues.push({ code: "bodyPolluted", short: "主体串台", msg: `主体里掺进了「${bodyMisplaced.map((id) => MODULES[id].title).join("、")}」，干扰正文单向推进的阅读节奏。` });
  if (firstFoldBodyPct < 60 && bMods.length > 0) sequenceIssues.push({ code: "bodySqueezed", short: `首屏仅 ${firstFoldBodyPct}%`, msg: `首屏里主体有效可见区只剩 ${firstFoldBodyPct}%（经验建议 ≥62%），核心信息被上下挤压。` });
  if (scrollClearPct < 84) sequenceIssues.push({ code: "scrollChoked", short: `净窗 ${scrollClearPct}%`, msg: `吸顶页眉在滚屏时切掉 ${stickyVpPct}% 高度，留给正文滚动阅读的净视口仅剩 ${scrollClearPct}%。` });
  const sequenceOk = sequenceIssues.length === 0;

  // 3) CLOSURE 总结与闭合
  const closureIssues = [];
  if (fMods.length === 0) closureIssues.push({ code: "tailless", short: "无尾断崖", msg: "缺少页脚，读者滚到页底突然撞墙，找不到隐私条款、联系方式或二次导航安全网。" });
  else {
    if (!fMods.includes("legal")) closureIssues.push({ code: "noLegalInFooter", short: "缺信任兜底", msg: "「版权与隐私兜底」不在页脚里，页面收尾失去机构身份与合规安全感。" });
    if (footerMisplaced.length) closureIssues.push({ code: "footerPolluted", short: "页脚串台", msg: `页脚里错放了「${footerMisplaced.map((id) => MODULES[id].title).join("、")}」，把本该在顶部或主体的核心内容埋到了最底。` });
    if (fMods.length >= 4 || footerH > 186) closureIssues.push({ code: "dumpingGround", short: `过重 ${footerH}px`, msg: `页脚堆进了 ${fMods.length} 个块（高 ${footerH}px），退化成杂乱「垃圾场」，收尾反客为主。` });
    if (footerH < 42) closureIssues.push({ code: "footerTooThin", short: `过薄 ${footerH}px`, msg: `页脚只剩 ${footerH}px 细条，文字与收束留白挤成一团，缺少应有的收尾重量。` });
    if (footerFloatGap > 16) closureIssues.push({ code: "footerFloating", short: `悬空 ${footerFloatGap}px`, msg: `短页下没开粘底锁，页脚悬在半屏上方，脚下露出 ${footerFloatGap}px 空白断层。` });
  }
  const closureOk = closureIssues.length === 0;

  // 4) HIERARCHY 三者协同
  const hierarchyIssues = [];
  if (misplacedTotal > 0) hierarchyIssues.push({ code: "roleConfusion", short: `串台 ${misplacedTotal} 处`, msg: `共有 ${misplacedTotal} 个信息部件放错区段，页眉、主体、页脚的职责边界还没对齐。` });
  if (bodyH <= headerH + footerH && bMods.length > 0) hierarchyIssues.push({ code: "chromeTooHeavy", short: `主体仅 ${bodyDocPct}%`, msg: `页眉加页脚（${headerH + footerH}px）已经重过主体（${bodyH}px），外框压过了真正要看的内容。` });
  if (stickyHeight > 86) hierarchyIssues.push({ code: "scrollConflict", short: "滚屏冲突", msg: "顶栏在滚动中持续抢占正文空间，三段从「接力协作」变成了「上下打架」。" });
  if (footerFloatGap > 16) hierarchyIssues.push({ code: "bottomBreak", short: "底沿断层", msg: "短页面下主体没有自动撑满剩余高度，页脚悬在空中破坏了页面边界闭合。" });
  if (!framingOk && !hierarchyIssues.length) hierarchyIssues.push({ code: "needFraming", short: "顶段待修", msg: "页眉边界尚未立稳，影响整体三段节奏。" });
  if (!closureOk && !hierarchyIssues.length) hierarchyIssues.push({ code: "needClosure", short: "底段待修", msg: "页脚收束尚未闭合，整体缺少完整落点。" });
  const hierarchyOk = hierarchyIssues.length === 0 && framingOk && sequenceOk && closureOk;

  const checks = [
    { key: "framing", label: "定位与引导", en: "FRAMING", ok: framingOk, badge: framingOk ? `稳 · ${headerH}px` : framingIssues[0].short, issues: framingIssues },
    { key: "sequence", label: "内容与层次", en: "SEQUENCE", ok: sequenceOk, badge: sequenceOk ? `净窗 ${scrollClearPct}%` : sequenceIssues[0].short, issues: sequenceIssues },
    { key: "closure", label: "总结与闭合", en: "CLOSURE", ok: closureOk, badge: closureOk ? `稳 · ${footerH}px` : closureIssues[0].short, issues: closureIssues },
    { key: "hierarchy", label: "三者协同", en: "HIERARCHY", ok: hierarchyOk, badge: hierarchyOk ? `主占 ${bodyDocPct}%` : hierarchyIssues[0].short, issues: hierarchyIssues },
  ];

  const passCount = checks.filter((c) => c.ok).length;
  // 若存在显著结构性特征错态（短页悬空或页脚垃圾场）且页眉本身无错，则优先将其浮到主诊断首位，避免被次级提示遮盖
  const priorityClosure = framingOk
    ? closureIssues.filter((i) => i.code === "footerFloating" || i.code === "dumpingGround")
    : [];
  const allIssues = [...priorityClosure, ...framingIssues, ...sequenceIssues, ...closureIssues, ...hierarchyIssues];

  // 生成最核心白话诊断（标题 + 原因 + 下一步操作提示）
  let headline = "";
  let explanation = "";
  let nextHint = "";
  let statusTag = "";

  if (passCount === 4) {
    const styleName =
      state.stickyMode === "compact"
        ? "紧凑吸顶长文解"
        : state.docLength === "short" && fMods.length === 1
          ? "极简粘底落地解"
          : "经典三段式结构";
    statusTag = `4/4 · ${styleName}`;
    headline = `三段各司其职，${styleName}已成立`;
    explanation = `页眉以 ${headerH}px 交代身份与入口（占视口 ${headerVpPct}%），主体占整页 ${bodyDocPct}% 顺畅推进层次（滚动净视口 ${scrollClearPct}%），页脚以 ${footerH}px 稳稳贴底收束。`;
    nextHint = "试试切换到「短页」关掉粘底锁、或拖高页眉切「死锁吸顶」，亲手看看好结构是怎么被破坏的。";
  } else {
    const primary = allIssues[0];
    statusTag = `${passCount}/4 · ${primary.short}`;
    const titleMap = {
      headless: "页眉被清空，读者一进来失去坐标",
      noBrandInHeader: "品牌与主导航掉出页眉，入口找不到了",
      headerPolluted: "页眉混进错位部件，第一眼预期被打乱",
      headerCrushed: `页眉压扁到 ${headerH}px，导航字与点击区挤作一团`,
      headerBloated: `页眉膨胀到 ${headerH}px，首屏主体被压下去一大截`,
      stickyEatScreen: `168px 级别的高页眉死锁吸顶，滚屏时活活吃掉 ${stickyVpPct}% 视口`,
      noHeroInBody: "核心主视觉不在主体区，整页没有落脚焦点",
      noCardsInBody: "主体缺少三联层次模块，内容单薄失去节奏",
      linksBeforeHero: "次级订阅栏横插在主图前，正文开篇被拦腰截断",
      bodyPolluted: "主体里掺进页眉或页脚杂项，干扰主叙事",
      bodySqueezed: `首屏主体可见区只剩 ${firstFoldBodyPct}%，头重脚轻`,
      scrollChoked: `吸顶栏挡住 ${stickyVpPct}% 屏幕，滚屏阅读净窗口只剩 ${scrollClearPct}%`,
      tailless: "页脚消失，滚到底部直接撞墙失去兜底",
      noLegalInFooter: "版权与隐私条款不在页脚，收尾缺少信任锚点",
      footerPolluted: "核心导航或正文模块错埋进页脚",
      dumpingGround: `页脚塞进 ${fMods.length} 个模块（${footerH}px），沦为失控垃圾场`,
      footerTooThin: `页脚仅 ${footerH}px 过薄，压不住页面收尾`,
      footerFloating: `短页未开粘底锁，页脚悬在半空露出 ${footerFloatGap}px 断层`,
      roleConfusion: `还有 ${misplacedTotal} 处部件放错区段，三段职责串台`,
      chromeTooHeavy: `页眉加页脚重过主体，外壳抢走了内容的主角位置`,
      scrollConflict: "吸顶页眉与滚动正文打架，阅读视线持续受阻",
      bottomBreak: "短页底沿出现空白断层，页面没有完成闭合",
    };
    headline = titleMap[primary.code] || primary.short;
    if (primary.code === "stickyEatScreen") {
      headline = `高达 ${stickyHeight}px 的页眉死锁吸顶，滚屏持续吞掉 ${stickyVpPct}% 视口`;
    }
    explanation = primary.msg;

    // 针对当前首要问题给出最直接的动手提示
    if (hMods.includes("legal")) nextHint = "直接拖动页眉里的「版权与隐私兜底」卡片一路向下放进页脚（或点选卡片再按 ↓ 键）。";
    else if (!hMods.includes("brand")) nextHint = "把掉在下面的「品牌与主导航」卡片拖回顶部金色页眉区，重新立住页面坐标。";
    else if (linksBeforeHero) nextHint = "把挡在主图前面的「次级导航与订阅」拖进底部暖沙页脚，让主视觉直接打头阵。";
    else if (state.stickyMode === "locked" && stickyHeight > 86) nextHint = "把顶部的吸顶策略切换成「随滚收起」或「紧凑吸顶」，或向上拉薄页眉底线 ▼。";
    else if (headerH > 116) nextHint = "按住页眉下沿中央的 ▼ 推拉柄向上收薄页眉到 56–92px 区间。";
    else if (headerH < 46 && hMods.length) nextHint = "向下拖拉页眉下沿的 ▼ 推拉柄，留出 ≥48px 的舒适导航高度。";
    else if (footerFloatGap > 16) nextHint = "开启「粘底锁」开关，让主体自动撑开剩余高度，把页脚稳稳压回视口底沿。";
    else if (fMods.length >= 4 || footerH > 186) nextHint = "把多余模块从页脚移回对应区段，或向下压低页脚顶沿 ▲ 句柄。";
    else nextHint = "在画布里拖动带红虚线框的部件到所属区段，或拉动 ▼ / ▲ 分界句柄微调三段高度。";
  }

  return {
    viewportH: VIEWPORT_H,
    pageW: PAGE_W,
    docH,
    maxScroll,
    scrollY,
    scrollNorm,
    header: { y: headerY, h: headerH, items: hCalc.items, pctVp: headerVpPct, pctDoc: Math.round((headerH / docH) * 100) },
    body: { y: bodyY, h: bodyH, rawH: bodyRawH, items: bCalc.items, pctFirstFold: firstFoldBodyPct, pctDoc: bodyDocPct },
    footer: { y: footerY, h: footerH, items: fCalc.items, pctDoc: footerDocPct, floatGap: footerFloatGap },
    sticky: { mode: state.stickyMode, height: stickyHeight, activeNow: headerVisibleNow, pctVp: stickyVpPct, clearPct: scrollClearPct },
    checks,
    passCount,
    misplacedTotal,
    statusTag,
    headline,
    explanation,
    nextHint,
  };
}
