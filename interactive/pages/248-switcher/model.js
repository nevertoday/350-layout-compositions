// 248 切换器 SWITCHER · 单真源状态机与评测模型
// 所有画面几何、高亮对比度、选项行数与触控宽、同步状态、诊断文案全部由本模块统一算出。

export const PALETTE = {
  cobalt: "#0031ED",
  cobaltDeep: "#07164D",
  cobaltMid: "#1B46F2",
  yellow: "#FFCA1C",
  yellowSoft: "#FFF4C2",
  white: "#FEFEFE",
  barIdle: "#EBEBED",
  cardIdle: "#E5E5E7",
  weakActive: "#DFE1E8",
  ink: "#140700",
  inkSoft: "#4B5263",
  dotIdle: "#A8ABB5",
  ok: "#0B6B46",
  okBright: "#7FFFD4",
  okPillBg: "#D9FCEB",
  okPillFg: "#064E3B",
  err: "#B91C1C",
  errPillBg: "#A81224",
  errPillFg: "#FFFFFF",
};

export const HIGHLIGHT_MODES = {
  weak: {
    id: "weak",
    label: "弱灰描边",
    bg: "#DFE1E8",
    fg: "#4A4F5C",
    idleBg: "#EBEBED",
    accent: "#9AA0B0",
  },
  yellow: {
    id: "yellow",
    label: "原海报信号黄",
    bg: "#FFCA1C",
    fg: "#140700",
    idleBg: "#EBEBED",
    accent: "#FFCA1C",
  },
  cobalt: {
    id: "cobalt",
    label: "电光蓝反白",
    bg: "#0031ED",
    fg: "#FFFFFF",
    idleBg: "#EBEBED",
    accent: "#0031ED",
  },
  ink: {
    id: "ink",
    label: "深墨高反差",
    bg: "#0B1226",
    fg: "#FFFFFF",
    idleBg: "#EBEBED",
    accent: "#0B1226",
  },
};

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 四形态",
    items: [
      { key: "switcher", icon: "star", title: "切换器", short: "切换", desc: "通过切换在不同选项间快速切换当前视图。", visual: "toggle", metric: "单选互斥 · 即刻生效" },
      { key: "tabs", icon: "dots", title: "标签页", short: "标签", desc: "以标签形式组织内容，便于分类与导航。", visual: "tabs", metric: "同级分组 · 原地切换" },
      { key: "view", icon: "ring", title: "视图切换", short: "视图", desc: "在不同视图模式之间切换，改变信息呈现。", visual: "view", metric: "同源数据 · 多维形态" },
      { key: "more", icon: "menu", title: "更多选项", short: "更多", desc: "展开更多可选项，保持界面简洁。", visual: "more", metric: "溢出收敛 · 保护单排" },
      { key: "filter", icon: "ring", title: "条件筛选", short: "筛选", desc: "按状态收窄列表范围，减少扫描负担。", visual: "tabs", metric: "低频扩展项 05" },
      { key: "sort", icon: "dots", title: "排序规则", short: "排序", desc: "按时间、热度或权重重排同一组记录。", visual: "view", metric: "低频扩展项 06" },
      { key: "archive", icon: "menu", title: "归档历史", short: "归档", desc: "收纳已完结条目，保持主视图清爽。", visual: "more", metric: "低频扩展项 07" },
      { key: "prefs", icon: "star", title: "视图偏好", short: "偏好", desc: "调整列宽、密度与字段显隐设置。", visual: "toggle", metric: "低频扩展项 08" },
    ],
  },
  docs: {
    id: "docs",
    label: "云文档 · 多视图",
    items: [
      { key: "doc", icon: "star", title: "正文阅读", short: "正文", desc: "专注长文排版与段落批注，保持阅读连贯。", visual: "toggle", metric: "14 段落 · 3 条批注" },
      { key: "board", icon: "dots", title: "任务看板", short: "看板", desc: "把同一份项目清单转成待办、进行、已完成三列。", visual: "tabs", metric: "3 列 · 12 张卡片" },
      { key: "table", icon: "ring", title: "字段表格", short: "表格", desc: "按负责人、截止日与状态并排核对字段。", visual: "view", metric: "6 列 · 12 行记录" },
      { key: "more", icon: "menu", title: "更多视图", short: "更多", desc: "将甘特图、日历与版本记录收纳进溢出入口。", visual: "more", metric: "含 4 种低频视图" },
      { key: "gantt", icon: "ring", title: "甘特排期", short: "排期", desc: "沿周历查看里程碑前后依赖。", visual: "view", metric: "跨度 6 周" },
      { key: "calendar", icon: "dots", title: "日历视图", short: "日历", desc: "按日期格子定位每项交付节点。", visual: "tabs", metric: "本月 18 个节点" },
      { key: "history", icon: "menu", title: "历史快照", short: "历史", desc: "对比任意两次修订的文字增删。", visual: "more", metric: "24 个版本" },
      { key: "export", icon: "star", title: "导出归档", short: "导出", desc: "生成离线 PDF 或 Markdown 交付包。", visual: "toggle", metric: "3 种格式" },
    ],
  },
  metrics: {
    id: "metrics",
    label: "数据看板 · 同级维度",
    items: [
      { key: "overview", icon: "star", title: "核心总览", short: "总览", desc: "一眼核对今日活跃、转化与核心健康指标。", visual: "toggle", metric: "4 项北极星指标" },
      { key: "traffic", icon: "dots", title: "来源渠道", short: "渠道", desc: "拆解自然搜索、直访与分享带来的访问占比。", visual: "tabs", metric: "5 条主要通道" },
      { key: "funnel", icon: "ring", title: "转化漏斗", short: "漏斗", desc: "逐级追踪访问、试用到留存的折损位置。", visual: "view", metric: "4 步关键节点" },
      { key: "more", icon: "menu", title: "更多报表", short: "更多", desc: "收拢留存队列、地域与告警等低频报表。", visual: "more", metric: "含 4 份专题报表" },
      { key: "cohort", icon: "ring", title: "留存队列", short: "留存", desc: "按注册周次观察 7 日与 30 日回访曲线。", visual: "view", metric: "12 周热力矩阵" },
      { key: "revenue", icon: "dots", title: "收入构成", short: "收入", desc: "对比新购、续费与升级的贡献比例。", visual: "tabs", metric: "月度拆解" },
      { key: "region", icon: "menu", title: "地域分布", short: "地域", desc: "按城市群查看响应速度与活跃密度。", visual: "more", metric: "31 个区域" },
      { key: "alerts", icon: "star", title: "异常告警", short: "告警", desc: "定位接口耗时激增与跌落时段。", visual: "toggle", metric: "0 项严重告警" },
    ],
  },
};

export const MICRO_STATES = [
  { id: "active", zh: "选中", en: "ACTIVE", tip: "当前正在查看的项，用高反差底色或锚点锁定视线。" },
  { id: "inactive", zh: "未选中", en: "INACTIVE", tip: "退回中性冷灰，退居背景但不消失，保持同级选项一眼可见。" },
  { id: "hover", zh: "悬停", en: "HOVER", tip: "指针移入时轻声预告「这里可点」，消除点击前犹豫。" },
  { id: "focus", zh: "聚焦", en: "FOCUS", tip: "键盘 Tab / 方向键到达时的清晰双环轮廓，绝不静默吞掉。" },
  { id: "loading", zh: "加载中", en: "LOADING", tip: "慢数据跨越 200ms 时立刻转起虚线环，告诉用户系统没死机。" },
  { id: "done", zh: "完成", en: "DONE", tip: "新面板落位后的短促确认信号，闭合一次交互动作。" },
];

// 精确色度与 WCAG 相对亮度计算（单真源，无硬编码假数值）
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagContrast(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// CIELAB ΔE76（用于准确衡量信号黄 #FFCA1C 与中性冷灰 #EBEBED 之间的强感知分离度）
function rgbToLab(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function colorDeltaE(hexA, hexB) {
  const [l1, a1, b1] = rgbToLab(hexA);
  const [l2, a2, b2] = rgbToLab(hexB);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

// 初始状态：刻意停在 0/4 四重故障错态（绝不预先给出答案）
export function createInitialState() {
  return {
    scene: "poster",
    activeIdx: 0,
    renderedIdx: 0,      // 当前面板真正在展示哪一项（脱节或加载中时可能落后于 activeIdx）
    cursorPos: 0,        // 顶部高亮滑块连续坐标（拖拽与弹簧动效用）
    hoverIdx: -1,
    focusIdx: 0,
    itemCount: 8,        // 故障：超载 8 项
    overflowMode: "wrap", // 故障：双排折行（可选 wrap / squeeze / overflow）
    highlightStyle: "weak", // 故障：弱灰描边，肉眼分不清
    pointerCaret: false, // 故障：关闭向下指示尖角
    responseMode: "frozen", // 故障：内容冻结脱节（可选 frozen / mismatch / synced）
    latencyMs: 1400,     // 故障：1.4 秒卡死迟滞
    microStates: "none", // 故障：关闭悬停/聚焦/加载/完成微状态
    activation: "auto",  // WAI-ARIA 激活模式：auto / manual
    overflowMenuOpen: false,
    selectedOverflowIdx: 3, // 若通过「更多选项」选了第 5–8 项，记下真实源索引
    loading: false,
    loadingProgress: 0,
    loadingTarget: 0,
    doneFlash: 0,
    signalPulse: 0,      // 0..1 信号脉冲传导进度
    signalBrokenFlash: 0,
    probeState: null,    // 底栏 6 态探针强制演示
    dragging: false,
    toggleMaster: false, // 右上原海报大开关（关联联动通断）
  };
}

export const PRESETS = {
  poster: {
    label: "原海报经典解",
    patch: {
      itemCount: 4,
      overflowMode: "overflow",
      highlightStyle: "yellow",
      pointerCaret: true,
      responseMode: "synced",
      latencyMs: 120,
      microStates: "full",
      activation: "auto",
      overflowMenuOpen: false,
      toggleMaster: true,
      probeState: null,
    },
  },
  cobalt: {
    label: "极简三项反白解",
    patch: {
      itemCount: 3,
      overflowMode: "overflow",
      highlightStyle: "cobalt",
      pointerCaret: true,
      responseMode: "synced",
      latencyMs: 90,
      microStates: "full",
      activation: "auto",
      overflowMenuOpen: false,
      toggleMaster: true,
      probeState: null,
    },
  },
  asyncOverflow: {
    label: "七项溢出+慢载解",
    patch: {
      itemCount: 7,
      overflowMode: "overflow",
      highlightStyle: "ink",
      pointerCaret: true,
      responseMode: "synced",
      latencyMs: 520,
      microStates: "full",
      activation: "manual",
      overflowMenuOpen: false,
      toggleMaster: true,
      probeState: null,
    },
  },
  badWrap: {
    label: "试错：双排折行",
    patch: {
      itemCount: 8,
      overflowMode: "wrap",
      highlightStyle: "yellow",
      pointerCaret: true,
      responseMode: "synced",
      latencyMs: 120,
      microStates: "full",
      toggleMaster: true,
      probeState: null,
    },
  },
  badWeak: {
    label: "试错：弱灰失焦",
    patch: {
      itemCount: 4,
      overflowMode: "overflow",
      highlightStyle: "weak",
      pointerCaret: false,
      responseMode: "synced",
      latencyMs: 120,
      microStates: "full",
      toggleMaster: true,
      probeState: null,
    },
  },
  badLag: {
    label: "试错：静默卡死",
    patch: {
      itemCount: 4,
      overflowMode: "overflow",
      highlightStyle: "yellow",
      pointerCaret: true,
      responseMode: "synced",
      latencyMs: 1400,
      microStates: "none",
      activation: "auto",
      toggleMaster: true,
      probeState: null,
    },
  },
  reset: {
    label: "复原 0/4 错态",
    patch: {
      itemCount: 8,
      overflowMode: "wrap",
      highlightStyle: "weak",
      pointerCaret: false,
      responseMode: "frozen",
      latencyMs: 1400,
      microStates: "none",
      activation: "auto",
      overflowMenuOpen: false,
      activeIdx: 0,
      renderedIdx: 0,
      cursorPos: 0,
      toggleMaster: false,
      probeState: null,
    },
  },
};

// 从状态与实绘舞台宽度计算出完整渲染结构与单真源评测结果
export function evaluate(state, barWidthPx = 920) {
  const scene = SCENES[state.scene] || SCENES.poster;
  const allItems = scene.items.slice(0, state.itemCount);
  const hl = HIGHLIGHT_MODES[state.highlightStyle] || HIGHLIGHT_MODES.weak;

  // 计算实际排布：visibleSlots 是顶部切换条直接渲染的格子，overflowItems 是收纳进「更多选项」的项
  let visibleSlots = [];
  let overflowItems = [];
  let rows = 1;

  if (state.itemCount > 4 && state.overflowMode === "overflow") {
    visibleSlots = allItems.slice(0, 3).map((it, idx) => ({ ...it, srcIdx: idx, isOverflowTrigger: false }));
    overflowItems = allItems.slice(3).map((it, idx) => ({ ...it, srcIdx: idx + 3 }));
    const pickedOverflow = overflowItems.find((it) => it.srcIdx === state.selectedOverflowIdx);
    const fourthTitle = state.activeIdx === 3 && pickedOverflow
      ? `更多·${pickedOverflow.short}`
      : `${allItems[3].title} (${overflowItems.length})`;
    visibleSlots.push({
      ...allItems[3],
      title: fourthTitle,
      short: state.activeIdx === 3 && pickedOverflow ? pickedOverflow.short : "更多",
      srcIdx: 3,
      isOverflowTrigger: true,
      pickedOverflow,
    });
    rows = 1;
  } else {
    visibleSlots = allItems.map((it, idx) => ({ ...it, srcIdx: idx, isOverflowTrigger: false }));
    if (state.overflowMode === "wrap" && state.itemCount > 4) {
      rows = 2;
    } else {
      rows = 1;
    }
  }

  const colsPerRow = rows === 2 ? Math.ceil(visibleSlots.length / 2) : Math.max(1, visibleSlots.length);
  const slotWidthPx = Math.round(barWidthPx / colsPerRow);
  const activeClamped = Math.min(Math.max(0, state.activeIdx), visibleSlots.length - 1);

  // 实测对比度与色差
  const deltaE = Math.round(colorDeltaE(hl.bg, hl.idleBg));
  const textContrast = +wcagContrast(hl.fg, hl.bg).toFixed(2);
  const lumRatio = +wcagContrast(hl.bg, hl.idleBg).toFixed(2);

  // 卡片对应关系
  let panelIdx = state.renderedIdx;
  if (state.responseMode === "frozen") {
    panelIdx = 0;
  } else if (state.responseMode === "mismatch") {
    panelIdx = (activeClamped + 1) % Math.max(1, visibleSlots.length);
  } else if (!state.loading) {
    panelIdx = activeClamped;
  }

  // 四项核心规则单真源校验
  const issues = [];

  // 规则 1：当前高亮（ACTIVE）
  const highlightStrong = deltaE >= 32 && textContrast >= 4.5;
  const highlightAnchor = state.pointerCaret || hl.id === "cobalt" || hl.id === "ink";
  const passHighlight = highlightStrong && highlightAnchor;
  if (!highlightStrong) {
    issues.push({
      code: "weak-contrast",
      pillar: "active",
      badge: `色差 ΔE ${deltaE} · 失焦`,
      title: `当前高亮几乎隐身（色差仅 ΔE ${deltaE}）`,
      why: `原海报第二条写着「当前选项以高亮色突出，提供清晰的焦点反馈」。现在选中项和未选中项都是浅灰，扫视半秒根本分不清你正停在哪一格。`,
      action: "点亮高反差高亮色（原海报信号黄、电光蓝反白或深墨）并开启底部指向尖角。",
      fixPatch: { highlightStyle: "yellow", pointerCaret: true },
    });
  } else if (!highlightAnchor) {
    issues.push({
      code: "no-anchor",
      pillar: "active",
      badge: "缺指向尖角",
      title: "高亮块浮在半空，少了指向内容区的锚角",
      why: "信号黄底块虽然够亮，但少了原海报顶部栏底沿那枚向下小三角尖角，视线从顶栏跳到下方四张卡片时少了一条明确的视觉桥梁。",
      action: "把「指示尖角」拨回开启，或切到更高亮度反差的深色滑块。",
      fixPatch: { pointerCaret: true },
    });
  }

  // 规则 2：内容联动（RESPONSE）
  const passResponse = state.responseMode === "synced";
  if (state.responseMode === "frozen") {
    issues.push({
      code: "frozen",
      pillar: "response",
      badge: "联动断开 · 冻结",
      title: "顶部切了选项，下方内容区纹丝不动",
      why: "原海报第三条讲「选项变化时，内容区域同步更新，保持上下文连贯」。当前内容区被锁死在第一张卡，用户以为按钮坏了或反复狂点。",
      action: "点击右上角白色大拨动开关，或在下方把「内容联动」切回「同步联动」。",
      fixPatch: { responseMode: "synced", toggleMaster: true },
    });
  } else if (state.responseMode === "mismatch") {
    issues.push({
      code: "mismatch",
      pillar: "response",
      badge: "映射错位",
      title: `点了第 ${activeClamped + 1} 项，亮的却是第 ${panelIdx + 1} 张卡`,
      why: "顶部标签和下方内容的索引错开了一格，高亮承诺和呈现结果互相打架，用户立刻失去对整个界面的信任。",
      action: "把「内容联动」纠正为「同步联动」，让顶部游标与亮白卡片严丝合缝。",
      fixPatch: { responseMode: "synced", toggleMaster: true },
    });
  }

  // 规则 3：选项容量与单排秩序（STATE / CAPACITY）
  const minSafeSlot = barWidthPx < 420 ? 64 : 112;
  const passCapacity = state.itemCount >= 2 && rows === 1 && visibleSlots.length <= 5 && slotWidthPx >= minSafeSlot;
  if (state.itemCount < 2) {
    issues.push({
      code: "single-item",
      pillar: "state",
      badge: "仅 1 项无意义",
      title: "只有 1 个选项，放切换器纯属多余占位",
      why: "切换器的前提是至少存在 2 个互斥状态（A ⇄ B）。只有一个选项时直接给纯标题即可。",
      action: "把选项数量增加到 2–5 项。",
      fixPatch: { itemCount: 4 },
    });
  } else if (rows > 1) {
    issues.push({
      code: "multi-row",
      pillar: "state",
      badge: `${state.itemCount} 项双排折行`,
      title: `${state.itemCount} 个选项折成了两排，破坏空间归属`,
      why: "Jakob Nielsen 在《Tabs, Used Right》中明确反对双排标签：点击上排选项时，它和下方内容面板中间隔着另一排标签，空间连接瞬间断裂。",
      action: "精简到 2–5 项，或把超出的低频项收纳进原海报第 4 格「更多选项」溢出入口。",
      fixPatch: { overflowMode: "overflow" },
    });
  } else if (visibleSlots.length > 5 || slotWidthPx < minSafeSlot) {
    issues.push({
      code: "overcrowded",
      pillar: "state",
      badge: `单片仅 ${slotWidthPx}px`,
      title: `单排硬塞 ${visibleSlots.length} 项，每格只剩 ${slotWidthPx}px 宽`,
      why: "Apple HIG 与 Material Design 3 都建议分段切换器单排不超过 5 项。再多就会把字挤断、触控区变窄，手指轻轻一偏就点错隔壁。",
      action: "开启「更多选项溢出收纳」或把选项减至 3–5 项。",
      fixPatch: { overflowMode: "overflow" },
    });
  }

  // 规则 4：响应节奏与微状态（FEEDBACK）
  const isSlow = state.latencyMs > 220;
  const isVerySlow = state.latencyMs > 900;
  const hasMicro = state.microStates === "full";
  const passFeedback = hasMicro && (!isVerySlow || (isVerySlow && state.activation === "manual" && state.latencyMs <= 1000));
  if (!hasMicro) {
    issues.push({
      code: "silent-states",
      pillar: "feedback",
      badge: isSlow ? `${state.latencyMs}ms 静默假死` : "缺微状态反馈",
      title: isSlow
        ? `切换卡顿 ${state.latencyMs}ms，又没有任何加载反馈`
        : "关闭了悬停、聚焦与完成微状态，键盘用户彻底失明",
      why: isSlow
        ? "原海报底栏专门列出「悬停 / 聚焦 / 加载中 / 完成」六枚微型状态标记。等待超过 200ms 却不给加载信号，人脑会瞬间以为页面假死。"
        : "没有悬停预告与聚焦轮廓，键盘 Tab 和方向键操作者根本不知道焦点落在哪一格。",
      action: "开启完整六枚微状态；若需要快切，同时把响应耗时压到 200ms 以内（或保留 500ms 慢载配合手动激活）。",
      fixPatch: { microStates: "full", latencyMs: state.latencyMs > 900 ? 120 : state.latencyMs },
    });
  } else if (isVerySlow) {
    issues.push({
      code: "too-slow",
      pillar: "feedback",
      badge: `过慢 ${state.latencyMs}ms`,
      title: `等待 ${state.latencyMs}ms 已经打破「切换器即点即看」的节奏`,
      why: "即使有加载环，超过 1 秒的重刷新也让轻量的视图切换显得沉重。此类高成本加载要么压缩到 600ms 内并切为手动确认，要么改用独立子页面。",
      action: "把响应延迟拉回 60–600ms 区间（慢数据建议开启手动激活）。",
      fixPatch: { latencyMs: 120 },
    });
  }

  const passedCount = [passHighlight, passResponse, passCapacity, passFeedback].filter(Boolean).length;
  const allPass = passedCount === 4;

  // 当前首要诊断消息（单真源，直接喂给首屏诊单与顶部状态章）
  let headline, body, nextStep, badgeText, severity;
  if (allPass) {
    severity = "ok";
    badgeText = "4/4 · 切换器成立";
    if (isSlow) {
      headline = "异步溢出方案成立：收得住多选项，等得也踏实";
      body = `当前 ${state.itemCount} 项通过第 4 格「更多选项」收敛为干净单排（每格 ${slotWidthPx}px），高亮色差 ΔE ${deltaE}，配合 ${state.latencyMs}ms 异步加载环与完整六态，复杂后台也能稳稳驾驭。`;
      nextStep = "试试在顶部滑轨左右拖移游标，或点底栏 6 枚微状态探针检验每种交互回音。";
    } else if (visibleSlots.length <= 3) {
      headline = "极简分段解成立：一眼看尽，指尖秒切";
      body = `仅 ${visibleSlots.length} 个互斥选项平分单排（每格 ${slotWidthPx}px），高亮色差 ΔE ${deltaE}、字底对比度 ${textContrast}:1，${state.latencyMs}ms 同步联动零迟疑。`;
      nextStep = "点一下「试错」按钮看看改坏一个变量后界面如何立刻失效，或切换上方产品题材。";
    } else {
      headline = "原海报三步闭环全通：切得准、亮得明、动得齐";
      body = `${visibleSlots.length} 项单排排布（每格 ${slotWidthPx}px），高亮色差 ΔE ${deltaE} 配尖角锚定，${state.latencyMs}ms 同步点亮下方纯白卡片，六枚微状态全程有回音。`;
      nextStep = "直接横拖画布顶轨感受物理滑块手感，或切到「云文档 / 数据看板」验真业务场景。";
    }
  } else {
    severity = "err";
    const top = issues[0];
    badgeText = `${passedCount}/4 · ${top.badge}`;
    headline = top.title;
    body = top.why;
    nextStep = top.action;
  }

  // 原海报 ① ② ③ 三要点实时分项状态
  const pillars = {
    state: {
      ok: passCapacity,
      tag: passCapacity ? `单排 ${visibleSlots.length} 格 · ${slotWidthPx}px` : (rows > 1 ? "双排折行" : state.itemCount < 2 ? "不足 2 项" : `挤窄 ${slotWidthPx}px`),
    },
    active: {
      ok: passHighlight,
      tag: passHighlight ? `ΔE ${deltaE} · 对比 ${textContrast}:1` : (!highlightStrong ? `弱灰 ΔE ${deltaE}` : "缺指示尖角"),
    },
    response: {
      ok: passResponse && passFeedback,
      tag: !passResponse
        ? (state.responseMode === "frozen" ? "冻结脱节" : "错位映射")
        : (!passFeedback ? (hasMicro ? `迟滞 ${state.latencyMs}ms` : "静默缺态") : `${state.latencyMs}ms 同步`),
    },
  };

  return {
    scene,
    hl,
    visibleSlots,
    overflowItems,
    rows,
    colsPerRow,
    slotWidthPx,
    activeIdx: activeClamped,
    panelIdx,
    deltaE,
    textContrast,
    lumRatio,
    issues,
    passedCount,
    allPass,
    severity,
    badgeText,
    headline,
    body,
    nextStep,
    pillars,
    passFlags: {
      highlight: passHighlight,
      response: passResponse,
      capacity: passCapacity,
      feedback: passFeedback,
    },
  };
}
