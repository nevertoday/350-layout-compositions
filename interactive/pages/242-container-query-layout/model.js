// 242 容器查询布局 · 单一真源几何与规则模型
// 画布渲染、读数面板、支柱灯、诊断文案与实时 CSS 代码全部只读这里的计算结果。

export const MIN_SLOT_W = 180;
export const MAX_SLOT_W = 760;

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报组件卡",
    title: "组件卡片",
    copyShort: "根据容器宽度自动调整，内容重新排列以更好地利用空间。",
    copyLong: "根据容器宽度自动调整，内容结构与排版随之变化，在有限的组件内实现更好的信息层级与可读性。",
    cta: "查看详情 >",
    art: "mountain",
    metrics: [
      { icon: "bars", label: "数据", val: "1,280" },
      { icon: "pie", label: "进度", val: "68%" },
      { icon: "user", label: "用户", val: "328" },
    ],
    // 真实内部几何需求（像素）
    geom: {
      thumb: { S: 62, M: 108, L: 168 },
      metricsNeed: { M: 186, L: 238 },
      ctaW: 78,
      padX: { S: 12, M: 16, L: 20 },
      minTextCol: { S: 112, M: 152, L: 210 },
      // 经验舒适门槛区间（与卡片实际内容结构绑定）
      safeM: [360, 490],
      safeL: [520, 670],
      minGap: 110,
    },
  },
  shop: {
    id: "shop",
    label: "电商商品卡",
    title: "陶瓷手冲滤壶",
    copyShort: "细口鹅颈稳流控水，适合日常单人滤杯。",
    copyLong: "600ml 细口鹅颈控流与防烫木柄，单人与分享冲煮皆宜，宽容器展开销量与好评。",
    cta: "加入清单 >",
    art: "kettle",
    metrics: [
      { icon: "bars", label: "月销", val: "2,410" },
      { icon: "pie", label: "好评", val: "98%" },
      { icon: "user", label: "收藏", val: "640" },
    ],
    geom: {
      thumb: { S: 68, M: 118, L: 180 },
      metricsNeed: { M: 196, L: 252 },
      ctaW: 84,
      padX: { S: 12, M: 16, L: 20 },
      minTextCol: { S: 116, M: 158, L: 222 },
      safeM: [380, 505],
      safeL: [545, 690],
      minGap: 110,
    },
  },
  kpi: {
    id: "kpi",
    label: "数据摘要卡",
    title: "周活跃转化总览",
    copyShort: "近 7 日核心漏斗环比与渠道来源占比。",
    copyLong: "近 7 日核心漏斗环比与渠道来源分布，宽槽位同步展开细分指标与报表导出。",
    cta: "导出报表 >",
    art: "chart",
    metrics: [
      { icon: "bars", label: "访问", val: "48.2k" },
      { icon: "pie", label: "转化", val: "4.6%" },
      { icon: "user", label: "新增", val: "1,940" },
    ],
    geom: {
      thumb: { S: 56, M: 98, L: 154 },
      metricsNeed: { M: 204, L: 256 },
      ctaW: 84,
      padX: { S: 12, M: 16, L: 20 },
      minTextCol: { S: 112, M: 148, L: 206 },
      safeM: [350, 480],
      safeL: [510, 660],
      minGap: 110,
    },
  },
};

export const SLOT_META = [
  { id: "sm", name: "小容器", sub: "窄空间下的紧凑布局", role: "侧栏槽", defaultW: 270, patchTier: "S" },
  { id: "md", name: "中容器", sub: "中等空间下的平衡布局", role: "分栏槽", defaultW: 470, patchTier: "M" },
  { id: "lg", name: "大容器", sub: "充足空间下的展开布局", role: "主区槽", defaultW: 680, patchTier: "L" },
];

export const TIER_NAMES = {
  S: "紧凑态 S",
  M: "平衡态 M",
  L: "展开态 L",
  FALLBACK: "未命中回退",
  COLLAPSE: "高度塌陷 0px",
};

// 开场刻意停在 0/4 错配翻车态，绝不先给答案
export function createBrokenState(themeId = "poster") {
  return {
    themeId,
    viewportW: 1280,
    queryMode: "viewport",      // "viewport" (@media) | "container" (@container)
    containerType: "none",      // "none" | "size" | "inline-size"
    autonomyMode: "slot-patch", // "slot-patch" (.sidebar补丁) | "autonomous" (纯组件自治)
    unitMode: "vw",             // "vw" (视口单位) | "cqi" (容器单位) | "rem" (固定字号)
    bpM: 220,                   // 刻意过早：挤碎
    bpL: 310,                   // 刻意过早：挤碎
    activeSlot: 1,              // 默认聚焦中容器，居中方便直接横拖
    slots: SLOT_META.map((m) => ({ id: m.id, w: m.defaultW })),
  };
}

export const PRESETS = {
  broken: () => createBrokenState(),
  posterSol: (themeId = "poster") => ({
    themeId,
    viewportW: 1280,
    queryMode: "container",
    containerType: "inline-size",
    autonomyMode: "autonomous",
    unitMode: "cqi",
    bpM: themeId === "shop" ? 400 : 380,
    bpL: themeId === "shop" ? 570 : 550,
    activeSlot: 1,
    slots: SLOT_META.map((m) => ({ id: m.id, w: m.defaultW })),
  }),
  airySol: (themeId = "poster") => ({
    themeId,
    viewportW: 1280,
    queryMode: "container",
    containerType: "inline-size",
    autonomyMode: "autonomous",
    unitMode: "cqi",
    bpM: themeId === "kpi" ? 430 : 440,
    bpL: themeId === "kpi" ? 610 : 620,
    activeSlot: 1,
    slots: SLOT_META.map((m) => ({ id: m.id, w: m.defaultW })),
  }),
  sizeTrap: (themeId = "poster") => ({
    themeId,
    viewportW: 1280,
    queryMode: "container",
    containerType: "size",
    autonomyMode: "autonomous",
    unitMode: "cqi",
    bpM: 380,
    bpL: 550,
    activeSlot: 1,
    slots: SLOT_META.map((m) => ({ id: m.id, w: m.defaultW })),
  }),
};

export function clampSlotW(w) {
  return Math.round(Math.max(MIN_SLOT_W, Math.min(MAX_SLOT_W, w)));
}

// 按单一真源计算某个容器的真实期望形态与实渲几何
function idealTierForWidth(w, theme) {
  if (w >= theme.geom.safeL[0]) return "L";
  if (w >= theme.geom.safeM[0]) return "M";
  return "S";
}

function requiredWidthForTier(tier, theme) {
  const g = theme.geom;
  if (tier === "S" || tier === "FALLBACK") {
    return g.padX.S * 2 + g.thumb.S + 10 + g.minTextCol.S;
  }
  if (tier === "M") {
    return g.padX.M * 2 + g.thumb.M + 14 + Math.max(g.minTextCol.M, g.metricsNeed.M + g.ctaW * 0.55);
  }
  // L
  return g.padX.L * 2 + g.thumb.L + 18 + Math.max(g.minTextCol.L, g.metricsNeed.L + g.ctaW + 10);
}

export function evaluateSlot(slot, idx, state, theme) {
  const meta = SLOT_META[idx];
  const w = slot.w;
  const g = theme.geom;
  const idealTier = idealTierForWidth(w, theme);

  // 1) 决定实际渲染出来的形态
  let renderedTier = "S";
  let sourceReason = "";
  const isSizeCollapse = state.containerType === "size";

  if (isSizeCollapse) {
    renderedTier = "COLLAPSE";
    sourceReason = "size 双轴隔离未定高";
  } else if (state.queryMode === "viewport") {
    // @media 只看全局视口宽，完全无视容器本身
    if (state.bpM >= state.bpL) {
      renderedTier = state.viewportW >= state.bpL ? "L" : "S";
    } else if (state.viewportW >= state.bpL) {
      renderedTier = "L";
    } else if (state.viewportW >= state.bpM) {
      renderedTier = "M";
    } else {
      renderedTier = "S";
    }
    sourceReason = `@media 看视口 ${state.viewportW}px`;
  } else if (state.autonomyMode === "slot-patch") {
    // 靠 .sidebar / .split / .main 槽位类名写死，拖宽或拖窄都不会改
    renderedTier = meta.patchTier;
    sourceReason = `硬编码 .${meta.id}-slot`;
  } else if (state.containerType === "none") {
    // 没声明 container-type，@container 永远不命中
    renderedTier = "FALLBACK";
    sourceReason = "漏写 container-type";
  } else {
    // 真正的 @container + inline-size
    if (state.bpM >= state.bpL) {
      renderedTier = w >= state.bpL ? "L" : "S";
    } else if (w >= state.bpL) {
      renderedTier = "L";
    } else if (w >= state.bpM) {
      renderedTier = "M";
    } else {
      renderedTier = "S";
    }
    sourceReason = `@container 看槽宽 ${w}px`;
  }

  // 2) 计算实绘字号（cqi vs vw vs rem）
  let titlePx = 16;
  let bodyPx = 12;
  if (state.unitMode === "vw") {
    titlePx = Math.round(Math.max(14, Math.min(27, state.viewportW * 0.0195)));
    bodyPx = Math.round(Math.max(11, Math.min(16, state.viewportW * 0.011)));
  } else if (state.unitMode === "cqi") {
    titlePx = Math.round(Math.max(13, Math.min(22, w * 0.036)));
    bodyPx = Math.round(Math.max(11, Math.min(14, w * 0.022)));
  } else {
    titlePx = renderedTier === "L" ? 19 : renderedTier === "M" ? 16 : 14;
    bodyPx = 12;
  }

  // 3) 计算实绘图文几何余量与溢出
  const tierKey = renderedTier === "COLLAPSE" ? "M" : renderedTier === "FALLBACK" ? "S" : renderedTier;
  const reqW = requiredWidthForTier(tierKey, theme);
  const overflowPx = isSizeCollapse ? 0 : Math.max(0, Math.round(reqW - w));
  const thumbW = g.thumb[tierKey] || g.thumb.S;
  const padX = g.padX[tierKey] || g.padX.S;
  const textColW = Math.max(0, Math.round(w - padX * 2 - thumbW - 14));
  const cqiUnit = +(w / 100).toFixed(2); // 1cqi = w/100 px

  // 4) 判定该槽的健康状态
  let status = "ok";
  let badge = `${TIER_NAMES[renderedTier]} · 贴合`;
  let issue = null;

  if (isSizeCollapse) {
    status = "error";
    badge = "高度塌陷 0px";
    issue = "size-collapse";
  } else if (overflowPx > 0) {
    status = "error";
    badge = `实渲 ${renderedTier} · 挤爆 +${overflowPx}px`;
    issue = state.queryMode === "viewport" ? "media-overflow" : "early-overflow";
  } else if (renderedTier === "FALLBACK") {
    status = "error";
    badge = "查询失效 · 卡死窄版";
    issue = "no-container";
  } else if (state.queryMode === "viewport") {
    status = "warn";
    badge = `@media 侥幸撞中 ${renderedTier}`;
    issue = "media-lucky";
  } else if (state.autonomyMode === "slot-patch" && renderedTier !== idealTier) {
    status = "error";
    badge = `补丁锁死 ${renderedTier} · 违背槽宽`;
    issue = "slot-patch-drift";
  } else if (state.unitMode === "vw" && w < 360 && titlePx >= 22) {
    status = "warn";
    badge = `vw 字号爆大 ${titlePx}px`;
    issue = "vw-bloat";
  } else if (renderedTier === "S" && w >= g.safeM[1] + 20) {
    status = "warn";
    badge = `宽槽卡死 S · 右侧空置`;
    issue = "late-starve";
  } else if (renderedTier === "M" && w >= g.safeL[1] + 20) {
    status = "warn";
    badge = `大槽卡死 M · 未能展开`;
    issue = "late-starve";
  } else if (state.autonomyMode === "slot-patch") {
    status = "warn";
    badge = `槽位写死 ${renderedTier}（拖宽即破）`;
    issue = "slot-patch";
  }

  return {
    id: meta.id,
    name: meta.name,
    sub: meta.sub,
    role: meta.role,
    w,
    cqiUnit,
    idealTier,
    renderedTier,
    sourceReason,
    titlePx,
    bodyPx,
    thumbW,
    textColW,
    reqW: Math.round(reqW),
    overflowPx,
    status,
    badge,
    issue,
  };
}

export function evaluate(state) {
  const theme = THEMES[state.themeId] || THEMES.poster;
  const slots = state.slots.map((s, i) => evaluateSlot(s, i, state, theme));
  const g = theme.geom;

  const queryOk = state.queryMode === "container";
  const containOk = state.containerType === "inline-size";
  const autonomyOk = state.autonomyMode === "autonomous" && state.unitMode !== "vw";

  const bpInverted = state.bpM >= state.bpL;
  const bpTooClose = !bpInverted && state.bpL - state.bpM < g.minGap;
  const bpTooEarly = state.bpM < g.safeM[0] || state.bpL < g.safeL[0];
  const bpTooLate = state.bpM > g.safeM[1] || state.bpL > g.safeL[1];
  const anyOverflow = slots.some((s) => s.overflowPx > 0);
  const anyCollapse = slots.some((s) => s.renderedTier === "COLLAPSE");
  const thresholdOk = !bpInverted && !bpTooClose && !bpTooEarly && !bpTooLate && !anyOverflow && !anyCollapse;

  const checks = { queryOk, containOk, autonomyOk, thresholdOk };
  const passed = [queryOk, containOk, autonomyOk, thresholdOk].filter(Boolean).length;

  const worstOverflow = Math.max(0, ...slots.map((s) => s.overflowPx));
  const brokenSlots = slots.filter((s) => s.status === "error").length;

  // 优先级明确的 8 类单真源白话诊断
  let diag;
  if (anyCollapse) {
    diag = {
      code: "size-collapse",
      level: "error",
      tag: "错态 · 双轴高度塌陷",
      title: "container-type: size 未定高，三座容器集体塌成 0px",
      body: "size 会把宽、高两根轴都和内部内容彻底切断。如果不给容器写死高度，浏览器就不再用卡片文字撑开容器，三座插槽会瞬间压成扁缝，内容直接裁切溢出——日常卡片布局几乎总是用单轴 inline-size。",
      action: "把「② 容器声明」改成 inline-size，只隔离宽度、放行高度自然撑开。",
    };
  } else if (!queryOk) {
    const sm = slots[0];
    diag = {
      code: "media-trap",
      level: "error",
      tag: "错态 · 视口误判",
      title: `视口 ${state.viewportW}px 骗了组件，${sm.w}px 小槽被硬塞进 ${sm.renderedTier} 版${sm.overflowPx > 0 ? `（挤爆 +${sm.overflowPx}px）` : ""}`,
      body: `现在规则写的是 @media，它只问整块浏览器有多宽。视口停在 ${state.viewportW}px 时，连最窄的 ${sm.w}px 侧栏槽也被当成宽屏对待；图文、指标和按钮被硬压进同一行，组件根本看不到自己真正的住处。`,
      action: "先把「① 查询依据」切成 @container，再给外框补上 container-type: inline-size。",
    };
  } else if (!containOk) {
    diag = {
      code: "no-container",
      level: "error",
      tag: "错态 · 漏写容器声明",
      title: "写了 @container，但父框未声明 container-type，查询全部落空",
      body: "CSS 规定组件不能随便查任意父元素的宽度，否则会陷入布局死循环。父框维持默认 normal 时，所有 @container 规则都不会命中，三个容器哪怕拉到 680px 也全部卡死在未适配的原始状态。",
      action: "把「② 容器声明」设为 inline-size，为组件挂上合法的宽度查询上下文。",
    };
  } else if (state.autonomyMode === "slot-patch") {
    const drifted = slots.find((s) => s.issue === "slot-patch-drift");
    diag = {
      code: "slot-patch",
      level: "error",
      tag: "错态 · 槽位硬编码",
      title: drifted
        ? `${drifted.name}已拖到 ${drifted.w}px，硬编码补丁仍死锁 ${drifted.renderedTier} 态`
        : "靠 .sidebar / .main 槽位补丁假装适配，拖宽容器立刻露馅",
      body: "用页面位置类名给组件打补丁，只是把布局耦合进某一张页面的死结构里。试着在上方画布里把「小容器」往右拖过 400px，或把「大容器」往左压窄——硬编码样式完全无动于衷，换个页面就失效。",
      action: "把「③ 自治策略」切到「组件自治 + cqi」，删掉位置特例，让宽度说了算。",
    };
  } else if (bpInverted) {
    diag = {
      code: "bp-inverted",
      level: "error",
      tag: "错态 · 门槛倒挂",
      title: `中态门槛 ${state.bpM}px ≥ 大态门槛 ${state.bpL}px，平衡态 M 被直接吞并`,
      body: "第二道断点不高于第一道时，容器宽度跨过门槛就会从紧凑态 S 直接跳去展开态 L，中间平衡态永远没有机会出现，中等栏宽里的指标与留白会突然断层。",
      action: `把中态门槛 M 调到 ${g.safeM[0]}–${g.safeM[1]}px，大态门槛 L 调到 ${g.safeL[0]}–${g.safeL[1]}px。`,
    };
  } else if (bpTooEarly || anyOverflow) {
    diag = {
      code: "bp-early",
      level: "error",
      tag: "错态 · 门槛早切挤碎",
      title: `当前门槛（M ${state.bpM} / L ${state.bpL}px）早于内容底线${worstOverflow > 0 ? `，最差溢出 +${worstOverflow}px` : ""}`,
      body: `「${theme.label}」的平衡态至少需要 ${g.safeM[0]}px 才能同时摆下缩略图、三枚指标和按钮，展开态至少需要 ${g.safeL[0]}px。门槛设得太小，窄容器过早切到多栏展开，文字栏被挤成细条。`,
      action: `向右拉高门槛，让 M 落在 ${g.safeM[0]}–${g.safeM[1]}px、L 落在 ${g.safeL[0]}–${g.safeL[1]}px（当前题材几何安全带）。`,
    };
  } else if (bpTooLate || bpTooClose) {
    diag = {
      code: "bp-late",
      level: "warn",
      tag: "错态 · 门槛晚切空置",
      title: bpTooClose
        ? `M（${state.bpM}px）与 L（${state.bpL}px）间距仅 ${state.bpL - state.bpM}px，中态过渡过窄`
        : `门槛过晚（M ${state.bpM} / L ${state.bpL}px），宽容器被迫停在窄版浪费空间`,
      body: bpTooClose
        ? `两道门槛至少拉开 ${g.minGap}px 的喘息区间，中等分栏里的卡片才不会轻微拖几像素就反复跳变。`
        : `「${theme.label}」在 ${g.safeM[1]}px 以上就足够展开指标、${g.safeL[1]}px 以上足够舒展排布。门槛设得过晚，宽敞槽位右侧会留下大片空白。`,
      action: `把 M 收回 ${g.safeM[0]}–${g.safeM[1]}px、L 收回 ${g.safeL[0]}–${g.safeL[1]}px，并保留 ≥ ${g.minGap}px 间距。`,
    };
  } else if (state.unitMode === "vw") {
    diag = {
      code: "vw-bloat",
      level: "warn",
      tag: "错态 · 视口字号失调",
      title: `结构已按容器切档，但标题仍用 vw 跟着 ${state.viewportW}px 视口放大到 ${slots[0].titlePx}px`,
      body: "在 1280px 桌面的 270px 窄侧栏里，2vw 依然算成大屏字号，标题撑得比配图还抢戏。把字号和内边距换成容器单位 cqi（1cqi = 当前容器宽的 1%），排版比例才能真正跟着容器呼吸。",
      action: "把字号单位切到「cqi 容器单位」或「rem 稳定字号」。",
    };
  } else {
    const active = slots[state.activeSlot] || slots[1];
    diag = {
      code: "pass",
      level: "ok",
      tag: "自治成立 · 4 / 4",
      title: `视口锁死 ${state.viewportW}px 不动，三座容器按各自宽度独立重排`,
      body: `同一套「${theme.label}」代码同时活在 ${slots[0].w}px（${slots[0].renderedTier}）、${slots[1].w}px（${slots[1].renderedTier}）与 ${slots[2].w}px（${slots[2].renderedTier}）三座容器里。当前聚焦「${active.name}」1cqi = ${active.cqiUnit}px，拖动任意右侧翠绿墙都不会波及邻槽。`,
      action: "试着把「小容器」拖过 M/L 虚线，或切到「电商商品卡」观察内容几何底线如何移动。",
    };
  }

  // 原海报三支柱实时状态
  const pillars = [
    {
      id: "container",
      ok: queryOk && containOk,
      status: !queryOk ? "锁死 @media" : !containOk ? (anyCollapse ? "size 塌陷" : "漏写 inline-size") : "已挂 inline-size",
    },
    {
      id: "component",
      ok: autonomyOk,
      status: state.autonomyMode === "slot-patch" ? "槽位硬编码" : state.unitMode === "vw" ? "vw 字号失调" : "零特例自治",
    },
    {
      id: "query",
      ok: thresholdOk && brokenSlots === 0 && queryOk && containOk,
      status: anyCollapse
        ? "三槽归零"
        : !queryOk || !containOk
          ? `${brokenSlots || 3} 槽失配`
          : thresholdOk
            ? `${slots[0].renderedTier} / ${slots[1].renderedTier} / ${slots[2].renderedTier}`
            : bpInverted
              ? "门槛倒挂"
              : bpTooEarly || anyOverflow
                ? "早切挤爆"
                : "晚切空置",
    },
  ];

  return {
    theme,
    slots,
    checks,
    passed,
    worstOverflow,
    brokenSlots,
    diag,
    pillars,
    css: buildLiveCss(state),
  };
}

export function buildLiveCss(state) {
  const cType =
    state.containerType === "none"
      ? "/* [!] 漏写 container-type */"
      : state.containerType === "size"
        ? "container-type: size; /* [!] 未定高会塌陷 0px */"
        : "container: card / inline-size;";

  const fontRule =
    state.unitMode === "vw"
      ? "font-size: 2vw; /* [!] 跟着视口暴涨 */"
      : state.unitMode === "cqi"
        ? "font-size: clamp(13px, 3.6cqi, 22px);"
        : "font-size: 1rem;";

  if (state.queryMode === "viewport") {
    return `.slot { ${cType} }\n.card h3 { ${fontRule} }\n@media (min-width: ${state.bpL}px) { /* [!] 只看视口 ${state.viewportW}px */\n  .card { grid-template-columns: 168px 1fr; }\n}`;
  }
  if (state.autonomyMode === "slot-patch") {
    return `.slot { ${cType} }\n/* [!] 绑死页面槽位，拖宽也不会改 */\n.sm-slot .card { flex-direction: column; }\n.lg-slot .card { grid-template-columns: 168px 1fr; }`;
  }
  return `.slot { ${cType} }\n.card h3 { ${fontRule} }\n@container card (width >= ${state.bpM}px) { /* 平衡态 M */ }\n@container card (width >= ${state.bpL}px) { /* 展开态 L */ }`;
}
