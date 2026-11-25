// 241 自适应布局 — 单一真源数据与几何核算模型
// 所有开场读数、错态诊断、覆盖率、单列实宽、阶梯曲线与各节互动共用本模块。

export const VIEWPORT_MIN = 320;
export const VIEWPORT_MAX = 1440;

// 6 台典型目标抽样屏（严格覆盖手机、主流手机、平板竖、平板横、常规笔电、宽桌面）
export const SAMPLE_DEVICES = [
  { id: "se", name: "小手机", width: 320 },
  { id: "phone", name: "主流手机", width: 390 },
  { id: "tabv", name: "平板竖屏", width: 768 },
  { id: "tabh", name: "平板横屏", width: 1024 },
  { id: "laptop", name: "常规笔电", width: 1280 },
  { id: "desktop", name: "宽桌面", width: 1440 },
];

// 三档预设可选定宽（像素）
export const WIDTH_CHOICES = {
  S: [320, 360],
  M: [680, 720, 768],
  L: [1080, 1120, 1200],
};

// 三套真实业务题材（不改变核心几何，只改变模板槽内展示的信息架构与真实文案）
export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报蓝图",
    heroTitle: "ADAPTIVE",
    heroSub: "按屏切换预设模板",
    navItems: ["预设", "切档", "模板", "规范"],
    cards: [
      { shape: "square-blue", title: "模块 A", sub: "固定比例" },
      { shape: "circle-black", title: "模块 B", sub: "层级清晰" },
      { shape: "tri-blue", title: "模块 C", sub: "结构定制" },
      { shape: "square-black", title: "模块 D", sub: "体验一致" },
    ],
  },
  news: {
    id: "news",
    label: "资讯门户",
    heroTitle: "今日头版",
    heroSub: "城市轨道新线贯通运营",
    navItems: ["要闻", "财经", "科技", "深读"],
    cards: [
      { shape: "square-blue", title: "早间速览", sub: "3 分钟读完" },
      { shape: "circle-black", title: "深度专访", sub: "规划师实录" },
      { shape: "tri-blue", title: "数据图解", sub: "客流变化" },
      { shape: "square-black", title: "周末展讯", sub: "5 场新展" },
    ],
  },
  shop: {
    id: "shop",
    label: "电商货架",
    heroTitle: "秋季器物",
    heroSub: "手作陶器与桌面灯具",
    navItems: ["新品", "分类", "清单", "结算"],
    cards: [
      { shape: "square-blue", title: "台灯 01", sub: "¥380" },
      { shape: "circle-black", title: "陶杯 02", sub: "¥128" },
      { shape: "tri-blue", title: "托盘 03", sub: "¥196" },
      { shape: "square-black", title: "书立 04", sub: "¥165" },
    ],
  },
};

// 开场预设（含 0/4 翻车错态与多组合法解）
export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    mode: "stretch",
    viewport: 700,
    tM: 540,
    tL: 1420,
    templates: {
      S: { width: 320, cols: 4, nav: "bar" },
      M: { width: 768, cols: 3, nav: "burger" },
      L: { width: 1200, cols: 2, nav: "burger" },
    },
  },
  poster: {
    label: "原海报经典解",
    mode: "stepped",
    viewport: 768,
    tM: 768,
    tL: 1200,
    templates: {
      S: { width: 320, cols: 2, nav: "burger" },
      M: { width: 768, cols: 3, nav: "burger" },
      L: { width: 1200, cols: 4, nav: "bar" },
    },
  },
  compact: {
    label: "宽容现代解",
    mode: "stepped",
    viewport: 1024,
    tM: 720,
    tL: 1120,
    templates: {
      S: { width: 320, cols: 2, nav: "burger" },
      M: { width: 720, cols: 3, nav: "bar" },
      L: { width: 1120, cols: 4, nav: "bar" },
    },
  },
};

export function createInitialState() {
  return clonePreset("broken", "poster");
}

export function clonePreset(presetKey, theme = "poster") {
  const p = PRESETS[presetKey] || PRESETS.broken;
  return {
    theme,
    mode: p.mode,
    viewport: p.viewport,
    tM: p.tM,
    tL: p.tL,
    templates: {
      S: { ...p.templates.S },
      M: { ...p.templates.M },
      L: { ...p.templates.L },
    },
  };
}

// 计算某一套模板在其自身定宽下的单列实宽（扣除左右内边距与列间沟槽）
export function calcColWidth(tplWidth, cols) {
  const pad = tplWidth <= 400 ? 24 : tplWidth <= 840 ? 36 : 48;
  const gap = tplWidth <= 400 ? 8 : tplWidth <= 840 ? 12 : 16;
  return Math.round((tplWidth - pad - gap * (cols - 1)) / cols);
}

// 按给定视口宽度，算出当前命中哪套模板与实际几何表现
export function resolveAtViewport(state, vp) {
  const { mode, tM, tL, templates } = state;
  if (mode === "stretch") {
    // 伪自适应：强行把 L 模板或单一壳体等比硬拉/硬压进当前视口
    const base = templates.L.width;
    const scale = vp / base;
    return {
      tier: "L",
      templateWidth: vp,
      nominalWidth: base,
      scale,
      overflow: 0,
      marginTotal: 0,
      coverage: 1,
      cols: templates.L.cols,
      colWidth: Math.round(calcColWidth(base, templates.L.cols) * scale),
      stretched: true,
    };
  }

  let tier = "S";
  if (tM >= tL) {
    // 门槛倒挂时：M 档被完全架空，直接从 S 跳到 L
    tier = vp >= tL ? "L" : "S";
  } else if (vp >= tL) {
    tier = "L";
  } else if (vp >= tM) {
    tier = "M";
  }

  const tpl = templates[tier];
  const overflow = Math.max(0, tpl.width - vp);
  const marginTotal = Math.max(0, vp - tpl.width);
  const coverage = Math.min(1, tpl.width / vp);
  return {
    tier,
    templateWidth: tpl.width,
    nominalWidth: tpl.width,
    scale: 1,
    overflow,
    marginTotal,
    coverage,
    cols: tpl.cols,
    colWidth: calcColWidth(tpl.width, tpl.cols),
    stretched: false,
  };
}

// 对整个配置做单真源全面诊断（4 项核验 + 8 类精准错态）
export function evaluateState(state) {
  const { mode, viewport, tM, tL, templates } = state;
  const current = resolveAtViewport(state, viewport);

  // 逐一检视 6 台真实抽样设备
  const samples = SAMPLE_DEVICES.map((d) => ({
    ...d,
    res: resolveAtViewport(state, d.width),
  }));

  // 理论区间最大潜在溢出：若某档切入门槛小于该档模板定宽，或小屏定宽大于 320px 最小视口
  const inverted = tM >= tL;
  const sOverflow = Math.max(0, templates.S.width - VIEWPORT_MIN);
  const mOverflow = inverted ? 0 : Math.max(0, templates.M.width - tM);
  const lOverflow = Math.max(0, templates.L.width - tL);
  const maxZoneOverflow = Math.max(sOverflow, mOverflow, lOverflow);
  const sampleOverflows = samples.filter((s) => s.res.overflow > 0);

  // 覆盖率统计（基于 6 台目标设备）
  const usedTiers = new Set(samples.map((s) => s.res.tier));
  const minSample = samples.reduce((a, b) => (b.res.coverage < a.res.coverage ? b : a), samples[0]);
  const minCoveragePct = Math.round(minSample.res.coverage * 100);

  // 各档单列实宽（基于自身定宽，非拉伸态）
  const colS = calcColWidth(templates.S.width, templates.S.cols);
  const colM = calcColWidth(templates.M.width, templates.M.cols);
  const colL = calcColWidth(templates.L.width, templates.L.cols);

  // 单档内构合规带（经验参考带）：
  // S 档 (320-360px)：1-2 列 (单列 135-336px)，且导航收进汉堡菜单 (burger)
  // M 档 (680-768px)：2-3 列 (单列 210-360px)
  // L 档 (1080-1200px)：3-4 列 (单列 240-375px)，且导航展开顶栏 (bar)
  const sColBad = colS < 118;
  const mColBad = colM < 190 || colM > 400;
  const lColBad = colL > 420 || colL < 210;
  const sNavBad = templates.S.nav === "bar";
  const lNavBad = templates.L.nav === "burger";

  // 四大核验项（与顶眉 0/4 徽章、原海报三圆徽完全同源）
  const checks = {
    discrete: mode === "stepped",
    noOverflow: !inverted && maxZoneOverflow === 0 && sampleOverflows.length === 0,
    coverage: !inverted && usedTiers.size === 3 && minCoveragePct >= 68,
    tailored: !sColBad && !mColBad && !lColBad && !sNavBad && !lNavBad,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;

  // 识别全部激活的错态（按严重度排序，8 类全覆盖）
  const faults = [];
  if (!checks.discrete) {
    faults.push({
      code: "stretch-distort",
      badge: "错态 · 硬拉伸变形",
      title: `正在硬拉伸单一 ${templates.L.width}px 模板（当前缩放 ${Math.round(current.scale * 100)}%）`,
      body: `没有按屏幕切模板，而是把整套大屏硬塞进 ${viewport}px 视口等比缩放。字号与按钮被同步压小到原来的 ${Math.round(current.scale * 100)}%，小屏可读性直接崩塌——这正是海报强调「选择预设模板，而不是拉伸内容」的原因。`,
      action: "把「① 分拣策略」切到「阶梯换模板」，先停掉硬拉伸。",
    });
  }
  if (inverted) {
    faults.push({
      code: "threshold-invert",
      badge: "错态 · 门槛倒挂",
      title: `中屏门槛 ${tM}px ≥ 大屏门槛 ${tL}px，中屏模板被彻底架空`,
      body: `来访视口永远不可能落进「${tM} 到 ${tL}」区间，整套中屏模板成了死代码。平板端只能停在小屏或直接撞进大屏。`,
      action: `把中屏门槛拖回大屏门槛左侧，并保证中屏门槛 ≥ ${templates.M.width}px。`,
    });
  }
  if (maxZoneOverflow > 0) {
    const culprit =
      mOverflow >= lOverflow && mOverflow >= sOverflow
        ? { tier: "中屏 M", thr: tM, w: templates.M.width, ov: mOverflow }
        : lOverflow >= sOverflow
        ? { tier: "大屏 L", thr: tL, w: templates.L.width, ov: lOverflow }
        : { tier: "小屏 S", thr: VIEWPORT_MIN, w: templates.S.width, ov: sOverflow };
    const extraNow =
      current.overflow > 0 ? `当前 ${viewport}px 视口已被直接撑出 +${current.overflow}px 横向滚动条。` : `落在 ${culprit.thr}–${culprit.w - 1}px 之间的设备都会出现横向滚动条。`;
    faults.push({
      code: "threshold-overflow",
      badge: "错态 · 门槛早于定宽",
      title: `${culprit.tier} 门槛 ${culprit.thr}px 小于模板宽 ${culprit.w}px，最大溢出 +${culprit.ov}px`,
      body: `自适应定宽模板有一条硬算术：切入某套模板的门槛绝不能小于模板自身宽度。${extraNow}`,
      action: `把 ${culprit.tier} 的切换门槛向右拉到 ≥ ${culprit.w}px（或收窄该档模板定宽）。`,
    });
  }
  if (!inverted && (usedTiers.size < 3 || minCoveragePct < 68)) {
    const missNote = usedTiers.size < 3 ? `有档位在 6 台主流设备上一次都没命中。` : `「${minSample.name} ${minSample.width}px」被迫停在 ${minSample.res.templateWidth}px 模板，只占屏幕 ${minCoveragePct}%，左右空出 ${minSample.res.marginTotal}px 留白黑洞。`;
    faults.push({
      code: "dead-zone",
      badge: "错态 · 留白黑洞",
      title: `门槛拖得太晚，${minSample.name} ${minSample.width}px 只占宽 ${minCoveragePct}%`,
      body: `预设档位之间的切换门槛设得过于保守，大一号的设备只能穿着小一号的衣服，版心两侧留下大片空荡边距。${missNote}`,
      action: `把中屏门槛压近 ${templates.M.width}px、大屏门槛压近 ${templates.L.width}px，让 6 台设备最低占宽回到 68% 以上。`,
    });
  }
  if (sColBad) {
    faults.push({
      code: "small-crushed",
      badge: "错态 · 小屏挤碎",
      title: `小屏 ${templates.S.width}px 模板硬塞 ${templates.S.cols} 列，单列只剩 ${colS}px`,
      body: `在 320px 窄卡里强排 ${templates.S.cols} 列，每张卡片宽度跌破 118px 经验可读下限，标题和按钮瞬间折成细竖条。`,
      action: "直接点「小屏 S」奶油卡里的列数按钮，改成 1 列或 2 列。",
    });
  }
  if (lColBad) {
    faults.push({
      code: "large-bloated",
      badge: "错态 · 大屏失衡",
      title: `大屏 ${templates.L.width}px 模板只排 ${templates.L.cols} 列，单列拉宽到 ${colL}px`,
      body: `大屏定宽模板的强项是舒展多列信息。只放 ${templates.L.cols} 列时单列宽达 ${colL}px（超出 420px 经验带），桌面看起来像强行放大的手机页。`,
      action: "点「大屏 L」奶油卡里的列数按钮，切到 3 列或 4 列。",
    });
  }
  if (mColBad) {
    faults.push({
      code: "mid-imbalance",
      badge: "错态 · 中屏列宽失衡",
      title: `中屏 ${templates.M.width}px 模板排 ${templates.M.cols} 列，单列 ${colM}px 偏离舒适带`,
      body: `平板宽度介于手机与桌面之间，${templates.M.cols === 1 ? "单列拉成 700px 长条浪费横向视野" : "四列卡片被压窄失去呼吸感"}，更适合 2 列或 3 列。`,
      action: "把「中屏 M」奶油卡改成 2 列或 3 列。",
    });
  }
  if (sNavBad || lNavBad) {
    const navMsg = sNavBad && lNavBad
      ? "小屏把 4 项顶栏硬挤在 320px 一行，大屏却把导航藏进汉堡图标"
      : sNavBad
      ? "小屏 320px 顶栏硬塞 4 项文字导航，拇指极易误触"
      : "大屏已有 1200px 宽，却仍把一级导航藏进折叠汉堡菜单";
    faults.push({
      code: "nav-mismatch",
      badge: "错态 · 导航未因屏定制",
      title: `导航形态和屏幕空间反着来`,
      body: `${navMsg}。自适应模板不只换列数，更要让导航和交互控件匹配当前屏幕的操作空间。`,
      action: "在模板顶栏点击切换导航形态：小屏收进折叠导航，大屏展开顶栏。",
    });
  }

  // 主诊单（全部达标时给出白话肯定与当前方案定性）
  let primary;
  if (passedCount === 4) {
    const isPosterExact =
      templates.S.width === 320 &&
      templates.M.width === 768 &&
      templates.L.width === 1200 &&
      tM === 768 &&
      tL === 1200 &&
      templates.S.cols === 2 &&
      templates.M.cols === 3 &&
      templates.L.cols === 4;
    primary = {
      ok: true,
      code: "pass",
      badge: isPosterExact ? "达标 · 原海报经典解 (4/4)" : "达标 · 自调合法解 (4/4)",
      title: `三档稳态换装成立：全 6 屏零溢出，最低占宽 ${minCoveragePct}%`,
      body: `在当前 ${viewport}px 视口下命中「${current.tier === "S" ? "小屏 S" : current.tier === "M" ? "中屏 M" : "大屏 L"}」${current.templateWidth}px 模板（${current.cols} 列、单列 ${current.colWidth}px）。拖一拖示波轨看看：档位内画面稳如印刷，跨过 ${tM}px 与 ${tL}px 时整套结构利落切换。`,
      action: "你还可以切换「资讯门户 / 电商货架」题材，或拖动阶梯示波轨检验每一像素的跳档手感。",
    };
  } else {
    primary = { ok: false, ...faults[0] };
  }

  return {
    current,
    samples,
    checks,
    passedCount,
    faults,
    primary,
    maxZoneOverflow,
    minCoveragePct,
    minSample,
    colS,
    colM,
    colL,
    inverted,
  };
}

// ---------- 02 节：同步对比模型（响应式连续拉伸 vs 自适应阶梯切档） ----------
export function evalCompare(vp) {
  // 响应式侧：fluid grid 100% 宽度，断点 600 / 960 切 1 / 2 / 3 列（同套卡片随每一像素拉伸）
  const rCols = vp < 600 ? 1 : vp < 960 ? 2 : 3;
  const rOuter = vp;
  const rCardW = Math.round((vp - 32 - (rCols - 1) * 14) / rCols);
  const rChars = Math.max(12, Math.round((rCardW - 24) / 14));

  // 自适应侧：3 套固定模板 320(2列) / 768(3列) / 1200(4列)，门槛 768 / 1200
  const aTier = vp >= 1200 ? "L" : vp >= 768 ? "M" : "S";
  const aOuter = aTier === "L" ? 1200 : aTier === "M" ? 768 : 320;
  const aCols = aTier === "L" ? 4 : aTier === "M" ? 3 : 2;
  const aCardW = calcColWidth(aOuter, aCols);
  const aMargin = Math.max(0, vp - aOuter);
  const aChars = Math.max(8, Math.round((aCardW - 18) / 14));

  return {
    vp,
    resp: { cols: rCols, outer: rOuter, cardW: rCardW, chars: rChars, margin: 0 },
    adap: { tier: aTier, cols: aCols, outer: aOuter, cardW: aCardW, chars: aChars, margin: aMargin },
  };
}

// ---------- 03 节：模板剪裁矩阵（每项模块在 S / M / L 三档的独立策略） ----------
export const MATRIX_MODULES = [
  { id: "topnav", name: "多级顶栏导航", weightKB: 42, opts: ["完整展开", "汉堡抽屉", "服务端剔除"] },
  { id: "sidebar", name: "左侧筛选栏", weightKB: 68, opts: ["常驻侧栏", "弹出浮层", "服务端剔除"] },
  { id: "hero", name: "宽幅轮播横幅", weightKB: 240, opts: ["原尺寸横幅", "精简静图", "服务端剔除"] },
  { id: "cards", name: "图文信息流", weightKB: 95, opts: ["四列多图", "双列摘要", "单列精简"] },
  { id: "promo", name: "右侧推荐副卡", weightKB: 84, opts: ["常驻显示", "沉底折叠", "服务端剔除"] },
  { id: "tabbar", name: "底部拇指操作栏", weightKB: 28, opts: ["常驻底栏", "合并顶栏", "服务端剔除"] },
];

export const MATRIX_DEFAULT = {
  S: { topnav: 1, sidebar: 1, hero: 1, cards: 2, promo: 2, tabbar: 0 },
  M: { topnav: 0, sidebar: 1, hero: 1, cards: 1, promo: 1, tabbar: 1 },
  L: { topnav: 0, sidebar: 0, hero: 0, cards: 0, promo: 0, tabbar: 2 },
};

// 估算某一档的模拟载荷与操作便利度（明确标「示意」）
export function evalMatrixTier(tierKey, picks) {
  const factors = [1, 0.45, 0];
  let kb = 60; // 基础 HTML/CSS 框架底重（示意）
  let stripped = 0;
  let adapted = 0;
  for (const mod of MATRIX_MODULES) {
    const idx = picks[mod.id] ?? 0;
    kb += Math.round(mod.weightKB * factors[idx]);
    if (idx === 2) stripped++;
    if (idx === 1) adapted++;
  }
  const fullKB = 60 + MATRIX_MODULES.reduce((s, m) => s + m.weightKB, 0);
  const savedPct = Math.round(((fullKB - kb) / fullKB) * 100);
  let verdict = "配置均衡";
  if (tierKey === "S" && picks.hero === 0 && picks.sidebar === 0) {
    verdict = "小屏背着桌面整套重资产，首屏被横幅和侧栏压爆";
  } else if (tierKey === "S" && picks.tabbar === 2) {
    verdict = "缺少底部拇指操作区，单手切换频道变费力";
  } else if (tierKey === "L" && stripped >= 3) {
    verdict = "宽桌面删掉了过多常驻工具，浪费屏幕信息吞吐量";
  } else if (tierKey === "S" && savedPct >= 35) {
    verdict = "轻装上阵：剔除桌面冗余块并把核心操作落进拇指热区";
  } else if (tierKey === "M") {
    verdict = "平板承上启下：保留双列浏览，把筛选收进抽屉";
  } else if (tierKey === "L") {
    verdict = "桌面全开：侧栏、主栏与辅助推荐并列呈现，免去反复跳转";
  }
  return { kb, fullKB, savedPct, stripped, adapted, verdict };
}

// ---------- 04 节：客户端 / 服务端动态分发 / RESS 链路模拟 ----------
export function evalDelivery({ arch, device, varyOn }) {
  const isMobile = device === "mobile";
  if (arch === "client") {
    return {
      title: "纯客户端切档（同一份 HTML + CSS/JS 选模板）",
      htmlBytes: "同一份完整 HTML",
      headers: "HTTP/2 200 OK\nContent-Type: text/html; charset=utf-8\nCache-Control: public, max-age=3600",
      cacheRisk: false,
      resultTitle: isMobile ? "手机拿到完整模板包，浏览器本地选 S 档" : "桌面拿到完整模板包，浏览器本地选 L 档",
      resultNote: "URL 与缓存最干净，CDN 无需区分设备，搜索引擎零串版风险；代价是手机端会先收到桌面冗余结构或样式，要靠懒加载与按需拆分补救。",
      steps: [
        { who: "设备", tag: isMobile ? "手机 390px" : "桌面 1440px" },
        { who: "CDN 边缘缓存", tag: "单份缓存命中 ✓" },
        { who: "源站", tag: "返回统一 HTML" },
        { who: "浏览器", tag: isMobile ? "按宽启用 S 模板" : "按宽启用 L 模板" },
      ],
    };
  }
  if (arch === "dynamic") {
    const poisoned = !varyOn && isMobile;
    return {
      title: "服务端动态服务（Dynamic Serving · 同一 URL 按 UA 发不同 HTML）",
      htmlBytes: isMobile ? (poisoned ? "错误拿到桌面大 HTML!" : "仅发手机精简 HTML") : "仅发桌面完整 HTML",
      headers: varyOn
        ? "HTTP/2 200 OK\nVary: User-Agent\nCache-Control: public, max-age=3600"
        : "HTTP/2 200 OK\n/* 缺失 Vary: User-Agent ! */\nCache-Control: public, max-age=3600",
      cacheRisk: poisoned,
      resultTitle: poisoned
        ? "缓存串版事故：手机直接收到了上一位桌面用户的 HTML！"
        : isMobile
        ? "精准瘦身：服务端识别 UA，只吐出手机模板 HTML"
        : "桌面命中：服务端返回完整四列桌面模板 HTML",
      resultNote: poisoned
        ? "缺少 Vary: User-Agent 响应头时，CDN 以为同一个 URL 对所有人都一样，把刚缓存的桌面页直接塞给手机用户和 Googlebot-Smartphone，导致版面错乱与索引偏差。"
        : "同一 URL 下省去手机端多余 DOM，但必须返回 Vary: User-Agent 通知缓存层按设备分桶，且要持续维护 UA 识别库。",
      steps: [
        { who: "设备", tag: isMobile ? "手机 UA" : "桌面 UA" },
        { who: "CDN 缓存", tag: varyOn ? "按 UA 分桶缓存 ✓" : (isMobile ? "误吐桌面缓存 ×" : "写入桌面缓存") },
        { who: "源站路由", tag: varyOn ? (isMobile ? "拼装 S 模板" : "拼装 L 模板") : (isMobile ? "未回源（已串版）" : "拼装 L 模板") },
        { who: "浏览器", tag: poisoned ? "390px 渲染 1200px ×" : (isMobile ? "原生 S 模板" : "原生 L 模板") },
      ],
    };
  }
  // RESS
  const poisoned = !varyOn && isMobile;
  return {
    title: "RESS 混合方案（响应式外壳 + 服务端替换重组件）",
    htmlBytes: isMobile ? (poisoned ? "CDN 错发桌面重组件!" : "通用外壳 + 轻量移动组件") : "通用外壳 + 完整桌面组件",
    headers: varyOn
      ? "HTTP/2 200 OK\nVary: User-Agent, Sec-CH-UA-Mobile\nCache-Control: public, max-age=1800"
      : "HTTP/2 200 OK\n/* 缺失 Vary 头：边缘缓存混淆组件 ! */\nCache-Control: public, max-age=1800",
    cacheRisk: poisoned,
    resultTitle: poisoned
      ? "组件缓存串版：移动外壳里塞进了桌面级重图表组件"
      : isMobile
      ? "外壳弹性贴合 390px，服务端把桌面大地图换成轻卡片"
      : "外壳弹性舒展 1440px，服务端直出高密度交互组件",
    resultNote: poisoned
      ? "凡是服务端参与按设备改动输出，边缘缓存就必须声明 Vary 头，否则 RESS 同样会把桌面组件错派给手机。"
      : "Luke Wroblewski 于 2011 年提出的折中路线：平时用单套响应式流控撑住任意夹缝宽度，只对导航、大图或图表等重组件做服务端分档替换。",
    steps: [
      { who: "设备", tag: isMobile ? "手机 390px" : "桌面 1440px" },
      { who: "CDN 缓存", tag: varyOn ? "按设备键分桶 ✓" : (isMobile ? "误命中桌面组件 ×" : "缓存桌面切片") },
      { who: "服务端组件", tag: isMobile ? "仅下发轻组件" : "下发重组件" },
      { who: "浏览器", tag: poisoned ? "组件过载卡顿 ×" : "弹性外壳 + 精准组件" },
    ],
  };
}

// ---------- 05 节：核实史实编年轴 ----------
export const TIMELINE = [
  {
    year: "2010 RWD",
    date: "2010 年 5 月",
    title: "响应式概念提出，多屏之争拉开序幕",
    who: "Ethan Marcotte · A List Apart",
    body: "Ethan Marcotte 在 A List Apart 发表《Responsive Web Design》，将流体网格、弹性图片与 CSS 媒体查询合为一体。设计界随之开始对照讨论：究竟是用一套流动页面去包打天下，还是为关键屏幕尺寸分别打造预设版本。",
    snippet: "/* 2010：流体网格 + 弹性图片 + 媒体查询 */\n.column { width: 65.625%; float: left; }\n@media screen and (max-width: 600px) { .column { width: 100%; } }",
  },
  {
    year: "2011 著作",
    date: "2011 年 5 月",
    title: "《Adaptive Web Design》出版，确立分层交付思想",
    who: "Aaron Gustafson · Easy Readers",
    body: "Aaron Gustafson 出版《Adaptive Web Design: Crafting Rich Experiences with Progressive Enhancement》（2015 年 New Riders 推出第 2 版），从渐进增强出发强调：界面不必对所有设备强求同一副模样，而应根据设备与浏览器能力层层适配。",
    snippet: "/* 渐进增强分层：先保证基础结构可读，再按能力叠加层 */\nBase HTML (内容与语义) → CSS 档位版式 → 增强交互脚本",
  },
  {
    year: "2011 Adapt",
    date: "2011 年",
    title: "Adapt.js 登场：按屏幕区间加载独立定宽样式表",
    who: "Nathan Smith · 960 Grid System 作者",
    body: "当时 IE8 等旧浏览器尚不支持 CSS 媒体查询。Nathan Smith 发布轻巧的 Adapt.js，读取窗口宽度并对照像素区间配置表，按档切换独立的定宽 CSS 文件——让「多套定宽预设模板按屏切换」在真实工程中迅速流行。",
    snippet: "var ADAPT_CONFIG = {\n  path: 'assets/css/', dynamic: true,\n  range: ['0px to 760px = mobile.css', '760px to 980px = 720.css', '980px to 1280px = 960.css']\n};",
  },
  {
    year: "2011 RESS",
    date: "2011 年 9 月",
    title: "RESS 提出：响应式外壳与服务端组件替换合流",
    who: "Luke Wroblewski",
    body: "Luke Wroblewski 发表《RESS: Responsive Design + Server Side Components》，指出纯客户端响应式会让手机下载桌面冗余代码，而纯多套站难以维护；把响应式网格和服务端按设备替换关键组件结合，取两边所长。",
    snippet: "// RESS：同一 URL 下，外壳弹性适配 + 重组件服务端按设备替换\nif (device.isTouchPhone) render(<CompactTabNav />);\nelse render(<MegaDesktopNav />);",
  },
  {
    year: "2012 W3C",
    date: "2012 年 6 月",
    title: "W3C Media Queries Level 3 成为正式推荐标准",
    who: "W3C CSS Working Group",
    body: "媒体查询结束草案期成为 W3C 正式推荐标准。浏览器端原生支持按视口宽度分档加载规则，既支撑了连续响应式，也让「固定步进容器 + 多档预设模板」的纯 CSS 写法不再依赖脚本轮询。",
    snippet: "/* 标准媒体查询驱动定宽阶梯容器 */\n.shell { width: 320px; margin: 0 auto; }\n@media (min-width: 768px)  { .shell { width: 768px; } }\n@media (min-width: 1200px) { .shell { width: 1200px; } }",
  },
  {
    year: "2014+ 规范",
    date: "2014 年起（iOS 8 → Material 3）",
    title: "Size Classes 与窗口断点：自适应演进为系统设计语言",
    who: "Apple HIG (WWDC 2014) · Google Material Design 3",
    body: "Apple 在 WWDC 2014 随 iOS 8 引入水平/垂直两维 Size Classes（Compact / Regular），告别按具体机型硬编码；Google Material Design 3 则以 Compact（<600dp）、Medium（600–839dp）、Expanded（840–1199dp）、Large（1200–1599dp）与 Extra-large（≥1600dp）五档窗口规格指导跨端模板切换。",
    snippet: "/* Material 3 窗口断点分层参考 */\nCompact <600dp | Medium 600–839dp | Expanded 840–1199dp\nLarge 1200–1599dp | Extra-large ≥1600dp",
  },
];

// ---------- 06 节：适用与避坑场景决策卡 ----------
export const SCENARIOS = [
  {
    id: "legacy",
    tag: "场景 01",
    title: "运行十年的大型 PC 交易站，需限期补齐手机端体验",
    verdict: "适合采用自适应布局",
    tone: "good",
    reason: "老旧桌面代码耦合深、表格与旧广告位像素写死，强行推倒改成流式响应式风险极高。按设备独立新增一套 320/390px 手机模板（配合 Vary: User-Agent 动态服务），能最快稳住移动端转化而不碰坏老系统。",
  },
  {
    id: "task",
    tag: "场景 02",
    title: "航空订票 / 证券行情：手机赶路盯盘，桌面多窗比价",
    verdict: "适合自适应或 RESS 混合",
    tone: "good",
    reason: "两端的用户意图截然不同：手机端只需要「登机牌 + 航班动态」单列直达，桌面端需要「多航司筛选表 + 价格日历」。单靠 CSS 折叠列数不够，直接为两端定制独立模板与组件体验最好。",
  },
  {
    id: "blog",
    tag: "场景 03",
    title: "2 人团队维护的技术文档、博客或品牌官网",
    verdict: "别用纯多套自适应模板",
    tone: "warn",
    reason: "信息结构在手机和电脑上高度一致，只是栏宽和字号需要呼吸。维护三套独立模板会让改一个标题都要改三遍；直接用单套响应式布局配合适度流体护栏，人力成本最低。",
  },
  {
    id: "fold",
    tag: "场景 04",
    title: "协作看板 / SaaS 仪表盘，用户频繁分屏与拖拽窗口",
    verdict: "别锁死纯定宽自适应",
    tone: "warn",
    reason: "折叠屏展开、iPad 分屏与桌面自由拖窗会产生大量落在 320/768/1200 夹缝中的中间宽度。纯定宽模板会出现大片尴尬留白，更适合用「响应式骨架 + 容器查询布局」让每个卡片随自身容器实时重排。",
  },
];

// ---------- 07 节：小练习（单变量：仅改变 M / L 切换门槛） ----------
export const QUIZ_DEVICES = [375, 640, 820, 1280];
export const QUIZ_TEMPLATES = { S: 320, M: 768, L: 1200 };

export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "A",
    params: "M ≥ 600px · L ≥ 1100px",
    tM: 600,
    tL: 1100,
    correct: false,
    why: "两组门槛都小于各自模板的定宽（600 < 768，1100 < 1200）。640px 折叠屏一跨过 600px 就被塞进 768px 定宽模板，右侧立刻溢出 +128px 出现横向滚动条。",
  },
  {
    id: "B",
    label: "B",
    params: "M ≥ 768px · L ≥ 1200px",
    tM: 768,
    tL: 1200,
    correct: true,
    why: "每档切入门槛都不小于该档模板自身宽度（768 ≥ 768，1200 ≥ 1200），四台设备全部零溢出；同时 820px 平板稳落 768px（占宽 94%）、1280px 桌面稳落 1200px（占宽 94%），空间利用最均衡。",
  },
  {
    id: "C",
    label: "C",
    params: "M ≥ 768px · L ≥ 1440px",
    tM: 768,
    tL: 1440,
    correct: false,
    why: "虽然四台设备都不溢出，但大屏门槛被推迟到了 1440px。1280px 主流笔电无法升档，只能继续套用 768px 中屏模板，左右两侧空出 512px（40%）白白浪费。",
  },
  {
    id: "D",
    label: "D",
    params: "M ≥ 960px · L ≥ 1200px",
    tM: 960,
    tL: 1200,
    correct: false,
    why: "中屏门槛设在 960px 过于保守，导致 820px 平板切不进 768px 模板，被迫停留在 320px 小屏手机模板里，整屏超过 60% 沦为空白黑洞。",
  },
];

export function evalQuizOption(opt) {
  return QUIZ_DEVICES.map((vp) => {
    const tier = vp >= opt.tL ? "L" : vp >= opt.tM ? "M" : "S";
    const w = QUIZ_TEMPLATES[tier];
    const overflow = Math.max(0, w - vp);
    const coverage = Math.min(100, Math.round((w / vp) * 100));
    const status = overflow > 0 ? "overflow" : (vp >= 768 && coverage < 65) ? "gap" : "ok";
    return { vp, tier, w, overflow, coverage, status };
  });
}
