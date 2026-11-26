// 300 组件级响应布局 · 单真源几何排版与诊断模型
// 开场双槽 Canvas、状态灯、白话诊单、实时 CSS 预览全部只读这份状态与核算结果。

export const VIEWPORT_W = 1280; // 模拟固定桌面视口宽度（px）
export const SLOTS_TOTAL_W = 928; // 模拟页面内容区两槽可用净宽之和（1280 - 页边距 - 中缝）
export const SPLIT_MIN = 0.18;
export const SPLIT_MAX = 0.82;
export const BP_MIN = 220;
export const BP_MAX = 720;

export const COMPONENTS = {
  card: {
    id: "card",
    label: "信息卡片",
    en: "CARD COMPONENT",
    caseLabel: "案例一",
    minWideW: 380,
    minCompactW: 195,
    earlyCollapseW: 520,
    recommendedBp: 400,
    wideDesc: "横向并列（左图右文）",
    compactDesc: "纵向堆叠（上图下文）",
    posterPoints: [
      "内容从横向并列变为纵向堆叠",
      "元素优先级不变",
      "信息完整，节奏紧凑",
    ],
    posterInsight: "卡片内部完成重排，对外尺寸收缩，信息不丢失。",
  },
  stats: {
    id: "stats",
    label: "数据统计",
    en: "STATS COMPONENT",
    caseLabel: "案例二",
    minWideW: 450,
    minCompactW: 210,
    earlyCollapseW: 560,
    recommendedBp: 460,
    wideDesc: "单行四列横排",
    compactDesc: "2×2 多行网格",
    posterPoints: [
      "从单行多列 → 多行网格",
      "保持数据关联与对齐",
      "数据信息可扫描性优先",
    ],
    posterInsight: "模块在内部切换布局模式，以适配空间，保持可读性。",
  },
  list: {
    id: "list",
    label: "内容列表",
    en: "LIST COMPONENT",
    caseLabel: "案例三",
    minWideW: 400,
    minCompactW: 200,
    earlyCollapseW: 540,
    recommendedBp: 420,
    wideDesc: "行级单行展开",
    compactDesc: "独立卡片堆叠",
    posterPoints: [
      "从行级布局 → 卡片堆叠",
      "操作区收纳到次要位置",
      "保留关键操作与信息",
    ],
    posterInsight: "列表在组件内部完成压缩，交互不变，使用不中断。",
  },
};

export const INITIAL_STATE = {
  component: "card",
  split: 0.72, // 左槽 668px，右槽 260px
  queryMode: "media", // 开场刻意停在「盯视口」坏态，绝非答案
  breakpoint: 400,
  dropInfo: false,
  flipOrder: false,
};

export const PRESETS = {
  initial: {
    label: "复原开场错态",
    kind: "reset",
    patch: { split: 0.72, queryMode: "media", breakpoint: 400, dropInfo: false, flipOrder: false },
  },
  classic: {
    label: "经典宽窄解",
    kind: "good",
    patchFor: (comp) => ({
      split: 0.70,
      queryMode: "container",
      breakpoint: COMPONENTS[comp].recommendedBp,
      dropInfo: false,
      flipOrder: false,
    }),
  },
  swapped: {
    label: "侧栏反超解",
    kind: "good",
    patchFor: (comp) => ({
      split: 0.30,
      queryMode: "container",
      breakpoint: COMPONENTS[comp].recommendedBp,
      dropInfo: false,
      flipOrder: false,
    }),
  },
  balanced: {
    label: "双槽舒展解",
    kind: "good",
    patchFor: (comp) => ({
      split: 0.50,
      queryMode: "container",
      breakpoint: Math.min(COMPONENTS[comp].recommendedBp, 455),
      dropInfo: false,
      flipOrder: false,
    }),
  },
  earlyFail: {
    label: "试错：早塌浪费",
    kind: "bad",
    patch: { split: 0.70, queryMode: "container", breakpoint: 690, dropInfo: false, flipOrder: false },
  },
  lowFail: {
    label: "试错：断点过低",
    kind: "bad",
    patch: { split: 0.72, queryMode: "container", breakpoint: 230, dropInfo: false, flipOrder: false },
  },
  dropFail: {
    label: "试错：砍信息",
    kind: "bad",
    patchFor: (comp) => ({
      split: 0.70,
      queryMode: "container",
      breakpoint: COMPONENTS[comp].recommendedBp,
      dropInfo: true,
      flipOrder: false,
    }),
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function normalizeState(raw) {
  const component = COMPONENTS[raw.component] ? raw.component : "card";
  return {
    component,
    split: clamp(Number(raw.split ?? INITIAL_STATE.split), SPLIT_MIN, SPLIT_MAX),
    queryMode: raw.queryMode === "container" ? "container" : "media",
    breakpoint: Math.round(clamp(Number(raw.breakpoint ?? INITIAL_STATE.breakpoint), BP_MIN, BP_MAX)),
    dropInfo: Boolean(raw.dropInfo),
    flipOrder: Boolean(raw.flipOrder),
  };
}

// 计算单个槽位内该组件的真实排版度量（供 Canvas 实绘与诊断读数共享）
export function computeSlot(id, role, slotW, state) {
  const spec = COMPONENTS[state.component];
  const measuredW = state.queryMode === "media" ? VIEWPORT_W : slotW;
  const mode = measuredW >= state.breakpoint ? "wide" : "compact";
  const pad = mode === "wide" ? 16 : 12;
  const innerW = Math.max(60, slotW - pad * 2);

  let overflowPx = 0;
  let detailMetric = "";
  let detailShort = "";
  let unitWidth = 0;

  if (state.component === "card") {
    if (mode === "wide") {
      const imgW = Math.round(innerW * 0.40);
      const textW = innerW - imgW - 14;
      const neededTextW = 188;
      overflowPx = Math.max(0, Math.round(neededTextW - textW), Math.round(spec.minWideW - slotW));
      const chars = Math.max(2, Math.floor((textW - 4) / 13));
      unitWidth = Math.max(0, Math.round(textW));
      detailMetric = `文区实宽 ${unitWidth}px（约 ${chars} 字/行）`;
      detailShort = `文区 ${unitWidth}px`;
    } else {
      const neededW = spec.minCompactW - pad * 2;
      overflowPx = Math.max(0, Math.round(neededW - innerW));
      unitWidth = Math.round(innerW);
      detailMetric = `竖叠全宽 ${unitWidth}px · 100% 净宽利用`;
      detailShort = `全宽 ${unitWidth}px`;
    }
  } else if (state.component === "stats") {
    if (mode === "wide") {
      const colW = Math.floor((innerW - 18) / 4);
      const minCol = 104;
      overflowPx = Math.max(0, (minCol - colW) * 4, Math.round(spec.minWideW - slotW));
      unitWidth = colW;
      detailMetric = `单行 4 列 · 每列实宽 ${colW}px`;
      detailShort = `4列 · ${colW}px/列`;
    } else {
      const colW = Math.floor((innerW - 10) / 2);
      const minCol = 90;
      overflowPx = Math.max(0, (minCol - colW) * 2, Math.round(spec.minCompactW - slotW));
      unitWidth = colW;
      detailMetric = `2×2 网格 · 每格实宽 ${colW}px`;
      detailShort = `2×2 · ${colW}px/格`;
    }
  } else {
    // list
    if (mode === "wide") {
      const thumbW = 42;
      const actionW = 122;
      const textW = innerW - thumbW - actionW - 22;
      const minTextW = 180;
      overflowPx = Math.max(0, Math.round(minTextW - textW), Math.round(spec.minWideW - slotW));
      unitWidth = Math.max(0, Math.round(textW));
      detailMetric = `行级排布 · 文本通道实宽 ${unitWidth}px`;
      detailShort = `文道 ${unitWidth}px`;
    } else {
      const neededW = spec.minCompactW - pad * 2;
      overflowPx = Math.max(0, Math.round(neededW - innerW));
      unitWidth = Math.round(innerW);
      detailMetric = `卡片堆叠 · 底部承接操作区（净宽 ${unitWidth}px）`;
      detailShort = `堆叠 ${unitWidth}px`;
    }
  }

  const crushed = slotW < spec.minCompactW;
  const earlyCollapsed = mode === "compact" && slotW >= spec.earlyCollapseW;

  let status = "ok";
  let statusTag = mode === "wide" ? "宽态舒展" : "窄态重排";
  if (crushed) {
    status = "crushed";
    statusTag = `过窄 ${slotW}px`;
  } else if (overflowPx > 0) {
    status = "overflow";
    statusTag = `溢出 +${overflowPx}px`;
  } else if (earlyCollapsed) {
    status = "early";
    statusTag = "宽槽早塌";
  } else if (mode === "compact" && state.dropInfo) {
    status = "degraded";
    statusTag = "信息被砍";
  } else if (mode === "compact" && state.flipOrder) {
    status = "degraded";
    statusTag = "顺序倒置";
  }

  return {
    id,
    role,
    width: slotW,
    measuredW,
    mode,
    pad,
    innerW,
    unitWidth,
    overflowPx,
    crushed,
    earlyCollapsed,
    status,
    statusTag,
    detailMetric,
    detailShort,
  };
}

// 完整评估双槽组件自治状态
export function evaluate(rawState) {
  const state = normalizeState(rawState);
  const spec = COMPONENTS[state.component];
  const leftW = Math.round(SLOTS_TOTAL_W * state.split);
  const rightW = SLOTS_TOTAL_W - leftW;

  const left = computeSlot("left", "主内容槽", leftW, state);
  const right = computeSlot("right", "侧边栏槽", rightW, state);
  const slots = [left, right];

  const overflowSlots = slots.filter((s) => s.overflowPx > 0 && !s.crushed);
  const crushedSlots = slots.filter((s) => s.crushed);
  const earlySlots = slots.filter((s) => s.earlyCollapsed);
  const hasCompactSlot = slots.some((s) => s.mode === "compact");

  const issues = [];

  if (state.queryMode === "media" && (overflowSlots.length > 0 || crushedSlots.length > 0)) {
    const worst = overflowSlots[0] || crushedSlots[0];
    issues.push({
      code: "media_blind",
      severity: "error",
      shortTag: `视口盲区 · ${worst.role}爆框`,
      headline: `视口 ${VIEWPORT_W}px 骗过了${worst.role}——它实际只有 ${worst.width}px 宽`,
      why: `组件挂在 @media 上，只看见整张桌面屏有 ${VIEWPORT_W}px（≥ 断点 ${state.breakpoint}px），于是强行维持「${spec.wideDesc}」。${worst.role}实宽仅 ${worst.width}px，比${spec.label}横排底线 ${spec.minWideW}px 少了 ${Math.max(1, spec.minWideW - worst.width)}px，内容被硬生生挤出边界。`,
      fixHint: `把响应依据切到「@container 盯容器」，让每个槽位各自测量自己的可用宽度。`,
      fixLabel: "切换为 @container 盯容器",
      fixAction: { queryMode: "container" },
    });
  }

  if (crushedSlots.length > 0) {
    const worst = crushedSlots.reduce((a, b) => (a.width < b.width ? a : b));
    issues.push({
      code: "slot_crushed",
      severity: "error",
      shortTag: `槽宽失守 · ${worst.width}px`,
      headline: `${worst.role}被挤到 ${worst.width}px，跌破组件最小可读底线 ${spec.minCompactW}px`,
      why: `组件级响应能重排结构，却不能把字号压到看不见。现在${worst.role}连「${spec.compactDesc}」也装不下，按钮与关键数值彼此撞车。父级页面网格仍须给窄槽保留最低宽度。`,
      fixHint: `把中央紫色分栏脊柱往宽处拨回，让两槽都保持在 ${spec.minCompactW}px 以上。`,
      fixLabel: "拉宽过窄槽位",
      fixAction: { split: worst.id === "left" ? 0.28 : 0.72 },
    });
  }

  if (state.queryMode === "container" && overflowSlots.length > 0) {
    const worst = overflowSlots.reduce((a, b) => (a.overflowPx > b.overflowPx ? a : b));
    issues.push({
      code: "threshold_low",
      severity: "error",
      shortTag: `断点过低 · ${state.breakpoint}px`,
      headline: `切换断点设得太低（${state.breakpoint}px），${worst.role}在 ${worst.width}px 时该折不折`,
      why: `虽然已经改用 @container，但「${spec.label}」横排至少需要 ${spec.minWideW}px 才不会拥挤。当前断点 ${state.breakpoint}px 低于实宽 ${worst.width}px，组件误以为空间还够，死撑「${spec.wideDesc}」造成 +${worst.overflowPx}px 溢出。`,
      fixHint: `把组件切换断点向右调到 ${spec.minWideW}px–${spec.earlyCollapseW - 20}px 区间（推荐 ${spec.recommendedBp}px）。`,
      fixLabel: `将断点校至 ${spec.recommendedBp}px`,
      fixAction: { breakpoint: spec.recommendedBp },
    });
  }

  if (earlySlots.length > 0) {
    const worst = earlySlots.reduce((a, b) => (a.width > b.width ? a : b));
    issues.push({
      code: "threshold_high",
      severity: "warn",
      shortTag: `宽槽早塌 · ${worst.width}px`,
      headline: `断点设得太高（${state.breakpoint}px），宽敞的${worst.role}（${worst.width}px）也跟着塌成了窄卡`,
      why: `${worst.role}明明已有 ${worst.width}px 的宽敞空间（远超横排底线 ${spec.minWideW}px），却因为切换断点拉到 ${state.breakpoint}px，被迫缩成「${spec.compactDesc}」，纵向拉长、横向空间白白闲置，扫描效率不升反降。`,
      fixHint: `把切换断点向左降回 ${spec.minWideW}px–${spec.earlyCollapseW - 20}px 区间，让宽槽舒展、窄槽收拢。`,
      fixLabel: `将断点降回 ${spec.recommendedBp}px`,
      fixAction: { breakpoint: spec.recommendedBp },
    });
  }

  if (state.dropInfo) {
    const activeImpact = hasCompactSlot
      ? "当前窄槽已把关键评分、操作或营收指标整块删掉"
      : "一旦该组件被放进窄槽，关键评分、操作或营收指标就会被整块删掉";
    issues.push({
      code: "info_dropped",
      severity: "warn",
      shortTag: "野蛮删减 · 信息丢失",
      headline: "靠「藏掉次要信息」躲避拥挤，破坏了组件复用的一致性",
      why: `${activeImpact}。原海报强调「信息完整，保留关键操作与信息」——组件级响应靠重排空间关系消化窄宽，而不是把用户在宽屏上能点的功能直接砍没。`,
      fixHint: "关闭「窄态删减信息」，用纵向重排留住全部信息与交互。",
      fixLabel: "恢复完整信息",
      fixAction: { dropInfo: false },
    });
  }

  if (state.flipOrder) {
    const activeImpact = hasCompactSlot
      ? "当前窄槽里次要操作按钮被顶到最上方，压住了主图和核心标题"
      : "一旦进入窄态，次要操作按钮会顶到最上方，打乱从识别到行动的阅读顺序";
    issues.push({
      code: "priority_flipped",
      severity: "warn",
      shortTag: "顺序倒置 · 层级失序",
      headline: "重排时打乱了元素主次，读者先撞见按钮却还没看清内容",
      why: `${activeImpact}。原海报强调「元素优先级不变」：无论容器怎么收缩，视觉入口都必须先交付识别线索（主图/核心数值/标题），再把交互动作安放于次要顺位。`,
      fixHint: "关闭「打乱元素顺序」，保持窄态与宽态一致的阅读优先级。",
      fixLabel: "恢复正确优先级",
      fixAction: { flipOrder: false },
    });
  }

  if (state.queryMode === "media" && issues.length === 0) {
    // 即使在均分 464/464 恰好都没爆，但依然盯视口——这是潜伏隐患！
    issues.push({
      code: "media_latent",
      severity: "warn",
      shortTag: "潜伏隐患 · 仍盯视口",
      headline: "眼前恰好没溢出，但组件仍死盯整屏 1280px——换个窄槽立刻露馅",
      why: `现在两个槽位都在 ${Math.min(leftW, rightW)}px 以上，所以按 @media 1280px 强撑横排暂时蒙混过关。只要向左或向右拉窄任一槽位，组件不会有任何反应，马上挤爆。`,
      fixHint: "切到「@container 盯容器」，让组件真正具备脱离页面上下文的自治能力。",
      fixLabel: "切换为 @container 自治",
      fixAction: { queryMode: "container" },
    });
  }

  const ok = issues.length === 0;
  let solutionTitle = "";
  let solutionWhy = "";

  if (ok) {
    if (left.mode === "wide" && right.mode === "compact") {
      solutionTitle = "自治成立 · 经典宽窄双态解";
      solutionWhy = `整屏视口始终停在 ${VIEWPORT_W}px，同一份「${spec.label}」代码在 ${left.width}px 主槽自动展开为${spec.wideDesc}，在 ${right.width}px 侧槽自动折为${spec.compactDesc}。信息 0 丢失、层级不变，搬去任何容器都无需改 CSS。`;
    } else if (left.mode === "compact" && right.mode === "wide") {
      solutionTitle = "自治成立 · 宽窄反超互换解";
      solutionWhy = `精彩的翻转！视口还是 ${VIEWPORT_W}px 没变 1 像素，你把侧栏拉宽到 ${right.width}px 后它自己展开了，而缩窄到 ${left.width}px 的主栏自己叠紧了——这就是组件只听父容器指挥的真正威力。`;
    } else if (left.mode === "wide" && right.mode === "wide") {
      solutionTitle = "自治成立 · 双槽舒展横排解";
      solutionWhy = `左右两槽（${left.width}px 与 ${right.width}px）都跨过了 ${state.breakpoint}px 断点，同一组件在两处同时展开为${spec.wideDesc}，零溢出且空间舒展。继续拖动中缝压窄任意一侧，它会在穿过 ${state.breakpoint}px 的瞬间优雅变形。`;
    } else {
      solutionTitle = "自治成立 · 双槽紧凑匀称解";
      solutionWhy = `两槽（${left.width}px 与 ${right.width}px）均处于紧凑区间，组件同步切换为${spec.compactDesc}，既未挤压溢出也未浪费宽槽，整体节奏干净统一。`;
    }
  }

  const primary = issues[0] || null;

  // 原海报 4 枚核心原则实时状态灯（严格从上面同一套计算结果派生）
  const principles = [
    {
      id: "autonomy",
      zh: "单元自适应",
      en: "AUTONOMY",
      status: state.queryMode === "container" && !issues.some((i) => i.code === "threshold_low") ? "ok" : "bad",
      badge:
        state.queryMode === "media"
          ? "盲盯视口"
          : issues.some((i) => i.code === "threshold_low")
          ? `断点偏低`
          : `容器自治`,
    },
    {
      id: "hierarchy",
      zh: "内部重排",
      en: "INTERNAL HIERARCHY",
      status: !state.flipOrder && overflowSlots.length === 0 && crushedSlots.length === 0 ? "ok" : "bad",
      badge: state.flipOrder
        ? "层级倒置"
        : overflowSlots.length > 0 || crushedSlots.length > 0
        ? "挤压失序"
        : left.mode !== right.mode
        ? "双态清晰"
        : "秩序完好",
    },
    {
      id: "flexibility",
      zh: "局部弹性",
      en: "LOCAL FLEXIBILITY",
      status: crushedSlots.length === 0 && earlySlots.length === 0 ? "ok" : "bad",
      badge: crushedSlots.length > 0 ? "槽宽失守" : earlySlots.length > 0 ? "宽槽早塌" : `${left.width}|${right.width}`,
    },
    {
      id: "consistency",
      zh: "系统一致",
      en: "SYSTEM CONSISTENCY",
      status: !state.dropInfo && state.queryMode === "container" ? "ok" : state.dropInfo ? "bad" : "warn",
      badge: state.dropInfo ? "丢失信息" : state.queryMode === "media" ? "跨槽失效" : "一码多槽",
    },
  ];

  // 生成与当前滑块完全同步的真实 CSS 代码片段
  const cssRule =
    state.queryMode === "container"
      ? `.slot { container-type: inline-size; }\n@container (min-width: ${state.breakpoint}px) {\n  .${state.component} { /* ${spec.wideDesc} */ }\n}`
      : `/* 危险：只认整屏 ${VIEWPORT_W}px */\n@media (min-width: ${state.breakpoint}px) {\n  .${state.component} { /* 无论槽宽强行横排 */ }\n}`;

  return {
    state,
    spec,
    left,
    right,
    slots,
    ok,
    issueCount: issues.length,
    issues,
    primary,
    statusPill: ok ? "自治成立 · 0 处溢出" : `${issues.length} 处失衡 · ${primary.shortTag}`,
    headline: ok ? solutionTitle : primary.headline,
    why: ok ? solutionWhy : primary.why,
    fixHint: ok ? "试着继续左拖中缝让右侧反超左侧，或切换数据统计/内容列表验证同一原则。" : primary.fixHint,
    fixLabel: ok ? null : primary.fixLabel,
    fixAction: ok ? null : primary.fixAction,
    principles,
    cssRule,
  };
}
