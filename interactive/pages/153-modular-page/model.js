// 153 模块化页面 · 单真源几何与规则核算模型
// 所有布局尺寸、对齐偏差、列宽边界、样式变体、复用一致率与诊断白话均由此处唯一算出。

export const MIN_FRAME_W = 320;
export const MAX_FRAME_W = 840;
export const FRAME_PAD = 16;
export const MIN_COL_W = 155; // 经验单列可读下限（px）
export const MAX_SINGLE_W = 680; // 经验单列阅读上限（px）

export const MODULE_CATALOG = {
  kpiA: {
    id: "kpiA",
    kind: "kpi",
    role: "lead",
    label: "数据卡片 · 活跃用户",
    badge: "数据卡片",
    desc: "用于展示关键数据与指标。",
    value: "7,860",
    trend: "↑ 12.3%",
    note: "较上月增长",
  },
  profile: {
    id: "profile",
    kind: "profile",
    role: "support",
    label: "人物介绍模块",
    badge: "人物介绍模块",
    desc: "用于展示人物信息与简介。",
    name: "张云策",
    title: "产品设计师",
    bio: "专注产品体验与设计系统构建。",
  },
  summary: {
    id: "summary",
    kind: "summary",
    role: "summary",
    label: "内容摘要模块",
    badge: "内容摘要模块",
    desc: "用于展示要点或摘要信息。",
    body: "通过模块组织内容，提升页面的可读性与信息传达效率。",
  },
  kpiB: {
    id: "kpiB",
    kind: "kpi",
    role: "lead",
    label: "数据卡片 · 模块复用率",
    badge: "数据卡片",
    desc: "同类模块复用同一内部槽位。",
    value: "84.2%",
    trend: "↑ 6.4%",
    note: "跨页组件覆盖",
  },
  summaryB: {
    id: "summaryB",
    kind: "summary",
    role: "summary",
    label: "内容摘要 · 扩展记录",
    badge: "内容摘要模块",
    desc: "新增内容可直接挂入既有网格。",
    body: "保持统一间距、字体与色阶，新板块无需另起视觉规范。",
  },
  kpiC: {
    id: "kpiC",
    kind: "kpi",
    role: "lead",
    label: "数据卡片 · 交付周期",
    badge: "数据卡片",
    desc: "沉淀模块库缩短页面搭建耗时。",
    value: "2.4 天",
    trend: "↓ 38%",
    note: "新页搭建耗时",
  },
};

export const BROKEN_ORDER = ["summary", "kpiB", "profile", "kpiA", "summaryB", "kpiC"];
export const LEAD_ORDER = ["kpiA", "kpiB", "profile", "summary", "kpiC", "summaryB"];

export function createBrokenState() {
  return {
    widthNorm: (580 - MIN_FRAME_W) / (MAX_FRAME_W - MIN_FRAME_W), // 580px
    gridMode: "free", // free | single | two | grid3 | responsive
    styleMode: "mixed", // mixed | unified | flat
    reuseMode: "divergent", // divergent | consistent
    orderMode: "buried", // buried | lead
    gapPx: 14, // 0 | 14 | 28
    count: 4, // 3..6
    orderIds: [...BROKEN_ORDER],
    xray: true,
  };
}

export function createSolutionState(kind = "two") {
  if (kind === "single") {
    return {
      widthNorm: (420 - MIN_FRAME_W) / (MAX_FRAME_W - MIN_FRAME_W),
      gridMode: "single",
      styleMode: "unified",
      reuseMode: "consistent",
      orderMode: "lead",
      gapPx: 14,
      count: 4,
      orderIds: [...LEAD_ORDER],
      xray: true,
    };
  }
  if (kind === "grid3") {
    return {
      widthNorm: (760 - MIN_FRAME_W) / (MAX_FRAME_W - MIN_FRAME_W),
      gridMode: "grid3",
      styleMode: "unified",
      reuseMode: "consistent",
      orderMode: "lead",
      gapPx: 14,
      count: 6,
      orderIds: [...LEAD_ORDER],
      xray: true,
    };
  }
  if (kind === "responsive") {
    return {
      widthNorm: (640 - MIN_FRAME_W) / (MAX_FRAME_W - MIN_FRAME_W),
      gridMode: "responsive",
      styleMode: "unified",
      reuseMode: "consistent",
      orderMode: "lead",
      gapPx: 14,
      count: 4,
      orderIds: [...LEAD_ORDER],
      xray: true,
    };
  }
  // default: two-column editorial spread
  return {
    widthNorm: (620 - MIN_FRAME_W) / (MAX_FRAME_W - MIN_FRAME_W),
    gridMode: "two",
    styleMode: "unified",
    reuseMode: "consistent",
    orderMode: "lead",
    gapPx: 14,
    count: 4,
    orderIds: [...LEAD_ORDER],
    xray: true,
  };
}

export function normToFrameW(norm) {
  const clamped = Math.max(0, Math.min(1, Number(norm) || 0));
  return Math.round(MIN_FRAME_W + clamped * (MAX_FRAME_W - MIN_FRAME_W));
}

export function frameWToNorm(w) {
  return Math.max(0, Math.min(1, (w - MIN_FRAME_W) / (MAX_FRAME_W - MIN_FRAME_W)));
}

// 自由错位模式下的确定性偏移（与画布 X-Ray 与 DOM 共享同一份几何数据）
const FREE_OFFSETS = [
  { xShift: 0, wScale: 0.54, yNudge: 0 },
  { xShift: 22, wScale: 0.40, yNudge: 6 },
  { xShift: -14, wScale: 0.56, yNudge: 4 },
  { xShift: 18, wScale: 0.39, yNudge: -2 },
  { xShift: 10, wScale: 0.51, yNudge: 5 },
  { xShift: -12, wScale: 0.43, yNudge: 2 },
];

export function evaluate(state) {
  const frameW = normToFrameW(state.widthNorm);
  const innerW = frameW - FRAME_PAD * 2;
  const count = Math.max(3, Math.min(6, state.count));
  const activeIds = state.orderIds.slice(0, count);
  const gapPx = state.gapPx;

  // 决定列数与跨列规则
  let cols = 2;
  let spanFirst = false;
  if (state.gridMode === "single") {
    cols = 1;
  } else if (state.gridMode === "two") {
    cols = 2;
    if (count === 3) spanFirst = true; // 复刻 153 原海报「双列布局」上 1 跨栏 + 下 2 列
  } else if (state.gridMode === "grid3") {
    cols = 3;
  } else if (state.gridMode === "responsive") {
    if (frameW < 460) {
      cols = 1;
    } else if (frameW < 680 || count === 4) {
      cols = 2;
      if (count === 3 || count === 5) spanFirst = true;
    } else {
      cols = 3;
      if (count === 5) spanFirst = true; // 首卡跨 2 列，5 张卡刚好占满 6 格（2 行×3 列）
    }
  } else {
    // free 模式：名义 2 栏但各自脱轴
    cols = 2;
  }

  // 计算每张卡的实际像素几何
  const baseColW = Math.round((innerW - gapPx * Math.max(0, cols - 1)) / cols);
  const cards = [];
  let maxDriftPx = 0;
  let minColW = Infinity;
  let maxColW = 0;

  if (state.gridMode === "free") {
    // 散乱错位：左右行宽不等、缝隙忽宽忽窄
    for (let i = 0; i < count; i++) {
      const id = activeIds[i];
      const spec = FREE_OFFSETS[i % FREE_OFFSETS.length];
      const isRight = i % 2 === 1;
      const w = Math.max(118, Math.round(innerW * spec.wScale));
      const baseLeft = isRight ? FRAME_PAD + Math.round(innerW * 0.52) : FRAME_PAD;
      const rawLeft = baseLeft + spec.xShift;
      const x = Math.max(8, Math.min(frameW - w - 8, rawLeft));
      const drift = Math.abs(x - (isRight ? FRAME_PAD + baseColW + gapPx : FRAME_PAD));
      maxDriftPx = Math.max(maxDriftPx, drift);
      minColW = Math.min(minColW, w);
      maxColW = Math.max(maxColW, w);
      cards.push({
        id,
        meta: MODULE_CATALOG[id],
        index: i,
        row: Math.floor(i / 2),
        col: isRight ? 1 : 0,
        span: 1,
        x,
        w,
        driftPx: drift,
        yNudge: spec.yNudge,
      });
    }
  } else {
    let cursor = 0;
    for (let i = 0; i < count; i++) {
      const id = activeIds[i];
      const span = i === 0 && spanFirst ? (cols === 3 && count === 5 ? 2 : cols) : 1;
      const row = Math.floor(cursor / cols);
      const col = cursor % cols;
      const w = span * baseColW + (span - 1) * gapPx;
      const x = FRAME_PAD + col * (baseColW + gapPx);
      cursor += span;
      if (span === 1 || cols === 1) {
        minColW = Math.min(minColW, w);
        maxColW = Math.max(maxColW, w);
      }
      cards.push({
        id,
        meta: MODULE_CATALOG[id],
        index: i,
        row,
        col,
        span,
        x,
        w,
        driftPx: 0,
        yNudge: 0,
      });
    }
    if (!Number.isFinite(minColW)) minColW = baseColW;
    if (maxColW === 0) maxColW = baseColW;
  }

  // 统计尾行是否断尾（空出悬空槽位）
  const totalSlotsUsed = cards.reduce((acc, c) => acc + c.span, 0);
  const rowsCount = Math.ceil(totalSlotsUsed / cols);
  const orphanSlots = state.gridMode === "free" ? 0 : rowsCount * cols - totalSlotsUsed;

  // 统计独立纵轴线数量（理想值 = cols）
  const leftAxes = new Set(cards.map((c) => Math.round(c.x / 4) * 4));
  const axisCount = leftAxes.size;

  // 同类模块复用一致率（以数据卡片及同类卡片内部槽位一致度核算）
  const sameKindCount = cards.filter((c) => c.meta.kind === "kpi").length;
  const reusePct = state.reuseMode === "consistent" ? 100 : (sameKindCount >= 2 ? 33 : 50);

  // 样式变量套数
  const styleVariants = state.styleMode === "mixed" ? 3 : 1;

  // 四大核心原则判定
  const isDrift = state.gridMode === "free";
  const isZeroGap = gapPx === 0;
  const isCramped = !isDrift && cols > 1 && minColW < MIN_COL_W;
  const isStretched = !isDrift && cols === 1 && maxColW > MAX_SINGLE_W;
  const isOrphan = !isDrift && orphanSlots > 0;

  const gridOk = !isDrift && !isZeroGap && !isCramped && !isStretched && !isOrphan;
  const systemOk = state.styleMode === "unified";
  const reuseOk = state.reuseMode === "consistent";
  const firstMeta = MODULE_CATALOG[activeIds[0]];
  const orderOk = state.orderMode === "lead" && firstMeta && firstMeta.role === "lead";

  // 原海报 6 项原则实时状态（全部由同一模型推导）
  const principles = {
    grid: {
      ok: !isDrift && !isZeroGap,
      tag: isDrift ? `脱轴 ${maxDriftPx}px` : isZeroGap ? "0px 粘连" : `${cols}列齐轴`,
    },
    units: {
      ok: !isCramped && !isStretched,
      tag: isCramped ? `偏挤 ${minColW}px` : isStretched ? `拉长 ${maxColW}px` : `单列 ${minColW}px`,
    },
    system: {
      ok: systemOk,
      tag: state.styleMode === "mixed" ? "3 套混用" : state.styleMode === "flat" ? "抹平无差" : "1 套契约",
    },
    repeatability: {
      ok: reuseOk,
      tag: reuseOk ? "同构 100%" : `异构 ${reusePct}%`,
    },
    scalability: {
      ok: !isCramped && !isStretched && !isOrphan,
      tag: isOrphan ? `尾行缺 ${orphanSlots} 格` : isCramped ? "窄宽爆列" : isStretched ? "宽屏失配" : `${count} 卡自洽`,
    },
    order: {
      ok: orderOk && state.styleMode !== "flat",
      tag: state.styleMode === "flat" ? "层次失焦" : orderOk ? "核心领衔" : "主次倒挂",
    },
  };

  const score = [gridOk, systemOk, reuseOk, orderOk].filter(Boolean).length;

  // 诊断主结论（覆盖全部 8 类失误 + 4 类正当解）
  let code = "pass";
  let badge = "已成体系 · 4/4";
  let headline = "";
  let why = "";
  let action = "";

  if (isDrift) {
    code = "grid_drift";
    badge = `错态 · 网格脱轴（${score}/4）`;
    headline = `模块横竖不齐，最大纵轴偏差 ${maxDriftPx}px`;
    why = `人眼读模块化页面靠的是沿着固定纵轴直落扫描。现在 ${count} 张卡散落在 ${axisCount} 条错开的左边线上，每扫一行都得重新找起点，画面沦为贴歪的便利贴。`;
    action = `先在「① 网格架」把散乱错位切到双列、卡片网格或响应自适（也可拖顶沿视口卡尺观察列宽变化）。`;
  } else if (isZeroGap) {
    code = "zero_gap";
    badge = `错态 · 零缝粘连（${score}/4）`;
    headline = "模块间缝隙 0px，独立单元粘成了砖墙";
    why = "模块化依靠「一致的内距与外缝」划清单元边界。缝隙归零后，相邻卡片的边框和文字直接相撞，大脑分不清哪行字属于哪张卡。";
    action = "把「④ 主次与留白」里的模块缝隙调回 14px 或 28px，让单元边界重新透气。";
  } else if (isCramped) {
    code = "narrow_cramp";
    badge = `错态 · 窄屏硬塞多列（${score}/4）`;
    headline = `${frameW}px 宽硬塞 ${cols} 列，单列被压到 ${minColW}px`;
    why = `数据指标和人物简介需要至少 ${MIN_COL_W}px 经验宽度才能不挤成窄条。现在单列只有 ${minColW}px，数字和摘要被迫碎裂折行，可读性骤降。`;
    action = `向右拉宽顶沿「视口卡尺」至 ${cols === 3 ? "530px" : "380px"} 以上，或把网格架切到「单列」或「响应自适」。`;
  } else if (isStretched) {
    code = "wide_stretch";
    badge = `错态 · 宽屏单列过长（${score}/4）`;
    headline = `单列被拉宽到 ${maxColW}px，横扫吃力且尾部死空`;
    why = `超过 ${MAX_SINGLE_W}px 经验阅读带宽后，单列卡片拖出长尾巴，眼睛从左扫到右再折返容易串行，大屏横向空间也被白白浪费。`;
    action = "把网格架切到「双列」「卡片网格」或「响应自适」，或把视口卡尺拉窄回 560px 以内。";
  } else if (isOrphan) {
    code = "orphan_tail";
    badge = `错态 · 扩展断尾（${score}/4）`;
    headline = `${cols} 列网格放 ${count} 张卡，末行空出 ${orphanSlots} 个缺口`;
    why = `可扩展意味着内容增减时页尾依然稳当。现在末行悬空 ${orphanSlots} 格，视觉重心偏向左上角，像页面没加载完。`;
    action = `点舞台下方「+ 增模块 / - 减模块」配平到 ${cols === 3 ? "3 或 6" : "4"} 张，或切「响应自适」让首卡自动跨栏收口。`;
  } else if (state.styleMode === "mixed") {
    code = "style_chaos";
    badge = `错态 · 样式各自为政（${score}/4）`;
    headline = "同时混用 3 套圆角、内距与竞色，像拼贴截屏";
    why = "网格对齐只是骨架，没有统一视觉规则时，0px 直角卡、大圆角卡和三套抢戏色块会割裂系统感，读者会以为它们来自不同产品。";
    action = "把「② 样式契约」切到「统一规范」，收拢圆角、内距与单一珊瑚焦点色。";
  } else if (state.styleMode === "flat") {
    code = "flat_monotone";
    badge = `错态 · 过度抹平失层次（${score}/4）`;
    headline = "为了统一抹平全部反差，整页失去视觉主角";
    why = "模块化的一致性不是把所有字压成一样灰、一样大。拿掉字号梯度与珊瑚信号色后，7,860 增长指标混进普通说明里，一眼抓不住重点。";
    action = "把「② 样式契约」切回「统一规范」：规则统一，但层级和焦点分明。";
  } else if (!reuseOk) {
    code = "fake_reuse";
    badge = `错态 · 同类异构伪复用（${score}/4）`;
    headline = "两张数据卡片结构冲突，眼睛每次都要重新解码";
    why = `同类信息反复出现时，模块化的威力来自「学一次读全页」。现在第二张数据卡把数字埋在底角、省掉图标槽，同构率仅 ${reusePct}%，打断了扫描惯性。`;
    action = "把「③ 复用模板」切到「同构复用」，让所有数据卡片共享同一套内部槽位顺序。";
  } else if (!orderOk) {
    code = "order_inverted";
    badge = `错态 · 主次倒挂（${score}/4）`;
    headline = "摘要说明压住首槽，核心数据指标沉在末位";
    why = "模块化页面不是把零件随便倒进格子。第一视觉落点被长段摘要占满、核心指标 7,860 排到最后，读者打开页面三秒内看不到关键结论。";
    action = "直接点击画布里的「数据卡片 7,860」将其提至首槽，或点「④ 主次与留白 → 核心领衔」。";
  } else {
    // 全部 4/4 通过，按当前组合给出对应正当解命名
    const solNames = {
      single: ["达标 · 窄屏单列正当解（4/4）", `单列 ${minColW}px 宽带利落，适合长文与窄屏精读`],
      two: ["达标 · 双列对比正当解（4/4）", `${cols} 列等轴对齐，单列 ${minColW}px 兼顾指标与人物对照`],
      grid3: ["达标 · 卡片网格正当解（4/4）", `3 列齐整矩阵，${count} 张同构卡并列扫读零缺口`],
      responsive: ["达标 · 响应自适正当解（4/4）", `${frameW}px 自动落入 ${cols} 列（单列 ${minColW}px），横拉卡尺全程不破格`],
    };
    const [b, h] = solNames[state.gridMode] || solNames.two;
    badge = b;
    headline = h;
    why = `网格纵轴偏差 0px、缝隙 ${gapPx}px、样式契约统一为 1 套、同类模块 100% 同构且核心指标领衔首槽。你可以继续左右拉动顶沿卡尺或增减模块，测试它在不同内容量下的韧性。`;
    action = state.gridMode === "responsive"
      ? "试试把顶沿卡尺从 320px 一路拖到 840px，或点击下方「+ 增模块」检验扩展性。"
      : "试试把顶沿卡尺拉窄或拉宽，看看固定列数在什么像素宽度会撞破可读边界。";
  }

  return {
    frameW,
    innerW,
    cols,
    spanFirst,
    baseColW,
    minColW,
    maxColW,
    gapPx,
    count,
    activeIds,
    cards,
    axisCount,
    maxDriftPx,
    orphanSlots,
    reusePct,
    styleVariants,
    score,
    gridOk,
    systemOk,
    reuseOk,
    orderOk,
    principles,
    diag: { code, badge, headline, why, action, pass: score === 4 },
  };
}
