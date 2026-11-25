// 279 日历布局 · 单一真源数据与计算引擎（Hero 主日历 + 各节实验台共用）

export const CATEGORIES = {
  meeting:  { id: "meeting",  zh: "会议", en: "MEETING",  dot: "#513EC4", bg: "#E8E0F9", fg: "#281C7A", darkBg: "#332880", shape: "circle" },
  review:   { id: "review",   zh: "评审", en: "REVIEW",   dot: "#E0447B", bg: "#FCE5E3", fg: "#961A46", darkBg: "#5E1E3B", shape: "square" },
  research: { id: "research", zh: "调研", en: "RESEARCH", dot: "#D69600", bg: "#FDF0D3", fg: "#754E00", darkBg: "#5B4110", shape: "diamond" },
  training: { id: "training", zh: "培训", en: "TRAINING", dot: "#7B63DC", bg: "#EAE1F9", fg: "#3F2B93", darkBg: "#3F318C", shape: "triangle" },
  personal: { id: "personal", zh: "个人", en: "PERSONAL", dot: "#5E5B73", bg: "#ECEBF0", fg: "#323044", darkBg: "#383552", shape: "ring" },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const WEEKDAYS_MON = [
  { zh: "周一", short: "一", en: "MON", dow: 1, weekend: false },
  { zh: "周二", short: "二", en: "TUE", dow: 2, weekend: false },
  { zh: "周三", short: "三", en: "WED", dow: 3, weekend: false },
  { zh: "周四", short: "四", en: "THU", dow: 4, weekend: false },
  { zh: "周五", short: "五", en: "FRI", dow: 5, weekend: false },
  { zh: "周六", short: "六", en: "SAT", dow: 6, weekend: true },
  { zh: "周日", short: "日", en: "SUN", dow: 0, weekend: true },
];

export const WEEKDAYS_SUN = [
  WEEKDAYS_MON[6],
  ...WEEKDAYS_MON.slice(0, 6),
];

export function dowLabel(dow) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][dow];
}

// 2024 年 6 月真实历法：6 月 1 日是周六 (dow=6)，共 30 天
export function dayInfo(monthOffset, day) {
  // monthOffset: -1 (2024-05), 0 (2024-06), +1 (2024-07)
  const d = new Date(Date.UTC(2024, 5 + monthOffset, day));
  const dow = d.getUTCDay();
  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return {
    key,
    month: d.getUTCMonth() + 1,
    day,
    inMonth: monthOffset === 0,
    dow,
    weekend: dow === 0 || dow === 6,
  };
}

export function timeToMin(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + (m || 0);
}

// 原海报 279 的真实 2024 年 6 月事件（10 场，含当日概览 6/20 的 3 场）
export const POSTER_EVENTS = [
  { id: "ev-meet",     title: "项目例会",     cat: "meeting",  day: 4,  start: "10:00", end: "11:00", room: "会议室 B",   desc: "对齐 6 月版本里程碑、风险项与各职能交付节点", recurring: "每周二" },
  { id: "ev-design",   title: "设计评审",     cat: "review",   day: 7,  start: "14:00", end: "15:30", room: "设计评审间", desc: "终审新版日历网格规范、色码层级与触屏手势",   featured: true },
  { id: "ev-user",     title: "用户访谈",     cat: "research", day: 11, start: "15:00", end: "16:30", room: "访谈室 2",   desc: "一对一深访 4 位高频排期用户，验证空档扫读效率" },
  { id: "ev-train",    title: "培训 · 交互",  cat: "training", day: 15, start: "09:30", end: "11:30", room: "阶梯教室",   desc: "日历组件键盘焦点导航与色觉障碍无障碍实践" },
  { id: "ev-release",  title: "版本发布",     cat: "meeting",  day: 18, start: "11:00", end: "12:00", room: "发布作战室", desc: "灰度上线 v2.4 日程同步模块并观察延迟指标" },
  { id: "ev-qreview",  title: "季度复盘会议", cat: "meeting",  day: 20, start: "14:00", end: "16:00", room: "会议室 A",   desc: "复盘 Q2 核心指标、交付节奏与 Q3 资源排期" },
  { id: "ev-data",     title: "数据分析同步", cat: "review",   day: 20, start: "16:30", end: "17:30", room: "线上会议",   desc: "核对转化漏斗与留存队列变化，确认埋点口径" },
  { id: "ev-dinner",   title: "团队晚餐",     cat: "research", day: 20, start: "19:00", end: "21:00", room: "南城小馆",   desc: "项目组阶段庆功聚餐，轻松交流下半月节奏" },
  { id: "ev-req",      title: "需求评审",     cat: "review",   day: 25, start: "10:30", end: "12:00", room: "会议室 C",   desc: "评审跨时区重复规则与移动端议程流切换方案" },
  { id: "ev-weekly",   title: "周报提交",     cat: "research", day: 28, start: "18:00", end: "18:30", room: "协作文档",   desc: "汇总本周进展、阻塞问题与下周优先日程",       recurring: "每周五" },
];

// 开场 0/4 错态排期：把「设计评审 14:00」和「周报提交 18:00」也硬塞进 6/20，制造 14:00 撞期 + 单格 5 项爆仓
export function createBrokenEvents() {
  return POSTER_EVENTS.map((ev) => {
    if (ev.id === "ev-design") return { ...ev, day: 20 }; // 与季度复盘 14:00 直接撞期！
    if (ev.id === "ev-weekly") return { ...ev, day: 20 }; // 堆到第 5 项，彻底压死留白
    return { ...ev };
  });
}

export function createPosterEvents() {
  return POSTER_EVENTS.map((ev) => ({ ...ev }));
}

export function createInitialState() {
  return {
    colMode: "five",          // "five" (错) | "uneven" (错) | "seven" (对)
    weekStart: "mon",         // "mon" (ISO 8601) | "sun" (美式，两者皆正当)
    orderMode: "column",      // "column" (错: 竖排跳行) | "reverse" (错: 倒序) | "natural" (对)
    hierarchyMode: "flat",    // "flat" (错: 全铺无色) | "rainbow" (错: 炫彩过载) | "layered" (对)
    capMode: "all",           // "all" (不折叠全塞) | "cap2" (最多 2 条 +N 折叠)
    viewMode: "month",        // "month" | "week" | "agenda"
    selectedDay: 20,          // 1..30 (June 2024)
    activeCat: "all",         // "all" | meeting | review | research | training | personal
    highlightPrinciple: null, // null | "grid" | "hierarchy" | "recurrence" | "overview"
    events: createBrokenEvents(),
  };
}

// 生成当前月历单元格矩阵（单真源，DOM 与 2D Canvas 共同读取）
export function buildGridCells(state) {
  const isFive = state.colMode === "five";
  const cols = isFive ? 5 : 7;
  const rows = 6;
  const total = cols * rows;

  // 1. 生成自然时间顺序的原始日期列表
  let linear = [];
  if (isFive) {
    // 5列×6行 = 6月 1..30 整月 30 天，直接暴露出周一/周末斜向漂移
    for (let d = 1; d <= 30; d++) linear.push(dayInfo(0, d));
  } else {
    // 7列×6行 = 42 天，按 ISO 周一或美式周日起算（2024-06-01 是周六）
    const lead = state.weekStart === "mon" ? 5 : 6; // Mon: May 27..31 (5d); Sun: May 26..31 (6d)
    for (let i = lead; i >= 1; i--) linear.push(dayInfo(-1, 32 - i));
    for (let d = 1; d <= 30; d++) linear.push(dayInfo(0, d));
    let next = 1;
    while (linear.length < total) linear.push(dayInfo(1, next++));
  }

  // 2. 按 orderMode 排列到 (row, col) 槽位
  const placed = new Array(total);
  if (state.orderMode === "natural") {
    for (let i = 0; i < total; i++) {
      placed[i] = { ...linear[i], row: Math.floor(i / cols), col: i % cols, slot: i };
    }
  } else if (state.orderMode === "column") {
    // 竖排跳行：日期按列从上到下灌入
    for (let i = 0; i < total; i++) {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const slot = row * cols + col;
      placed[slot] = { ...linear[i], row, col, slot };
    }
  } else {
    // 倒序排列：最新一周压在最顶行
    for (let r = 0; r < rows; r++) {
      const srcRow = rows - 1 - r;
      for (let c = 0; c < cols; c++) {
        const slot = r * cols + c;
        placed[slot] = { ...linear[srcRow * cols + c], row: r, col: c, slot };
      }
    }
  }

  // 3. 挂载事件与每格统计
  const byDay = new Map();
  for (const ev of state.events) {
    if (!byDay.has(ev.day)) byDay.set(ev.day, []);
    byDay.get(ev.day).push(ev);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  }

  for (const cell of placed) {
    const dayEvs = cell.inMonth ? (byDay.get(cell.day) || []) : [];
    const conflicts = findConflicts(dayEvs);
    const maxVis = state.capMode === "cap2" ? 2 : 99;
    const visible = dayEvs.slice(0, maxVis);
    const hiddenCount = Math.max(0, dayEvs.length - visible.length);
    const whitespacePct = calcCellWhitespace(visible.length, hiddenCount, state.hierarchyMode);
    cell.events = dayEvs;
    cell.visible = visible;
    cell.hiddenCount = hiddenCount;
    cell.conflicts = conflicts;
    cell.whitespacePct = whitespacePct;
  }

  // 4. 计算列宽权重（不等宽模式故意按列内事件密度拉伸，暴露节奏失衡）
  let colWeights = new Array(cols).fill(1);
  if (state.colMode === "uneven") {
    const colLoads = new Array(cols).fill(0);
    for (const c of placed) colLoads[c.col] += c.events.length;
    colWeights = colLoads.map((n) => +(0.62 + Math.min(n, 5) * 0.24).toFixed(2));
  }
  const sumW = colWeights.reduce((a, b) => a + b, 0);
  const colFractions = colWeights.map((w) => w / sumW);
  const minW = Math.min(...colWeights);
  const maxW = Math.max(...colWeights);

  // 5. 表头标签
  const headers = isFive
    ? [
        { zh: "第 1 列", short: "列1", en: "COL 1", weekend: false },
        { zh: "第 2 列", short: "列2", en: "COL 2", weekend: false },
        { zh: "第 3 列", short: "列3", en: "COL 3", weekend: false },
        { zh: "第 4 列", short: "列4", en: "COL 4", weekend: false },
        { zh: "第 5 列", short: "列5", en: "COL 5", weekend: false },
      ]
    : (state.weekStart === "mon" ? WEEKDAYS_MON : WEEKDAYS_SUN);

  return {
    cols,
    rows,
    cells: placed,
    headers,
    colWeights,
    colFractions,
    widthRatio: +(maxW / minW).toFixed(2),
  };
}

export function findConflicts(dayEvs) {
  const out = [];
  for (let i = 0; i < dayEvs.length; i++) {
    for (let j = i + 1; j < dayEvs.length; j++) {
      const a = dayEvs[i], b = dayEvs[j];
      if (timeToMin(a.start) < timeToMin(b.end) && timeToMin(b.start) < timeToMin(a.end)) {
        out.push([a, b]);
      }
    }
  }
  return out;
}

// 根据单元格内实际显示事件数、折叠徽章和层级冗长度，计算单格可视留白比例（示意几何核算）
export function calcCellWhitespace(visibleCount, hiddenCount, hierarchyMode) {
  const dateShare = 0.20;
  const perEvent = hierarchyMode === "flat" ? 0.28 : hierarchyMode === "rainbow" ? 0.24 : 0.16;
  const badgeShare = hiddenCount > 0 ? 0.09 : 0;
  const used = dateShare + visibleCount * perEvent + badgeShare;
  return Math.max(6, Math.round((1 - Math.min(0.94, used)) * 100));
}

// 核心单真源诊断函数：全面评估 4 项原海报「布局逻辑」并产出白话诊断
export function evaluateCalendar(state) {
  const grid = buildGridCells(state);
  const juneCells = grid.cells.filter((c) => c.inMonth).sort((a, b) => a.day - b.day);

  // A. 固定网格检验（7 列 + 等宽 + 周一列漂移数）
  const monCols = new Set(juneCells.filter((c) => c.dow === 1).map((c) => c.col));
  const satCols = new Set(juneCells.filter((c) => c.dow === 6).map((c) => c.col));
  const gridPass = state.colMode === "seven";

  // B. 时间顺序检验（从 6/1 到 6/30 的归一化扫描距离与逆跳次数）
  let scanDist = 0;
  let verticalSteps = 0;
  let reverseRows = 0;
  for (let i = 1; i < juneCells.length; i++) {
    const prev = juneCells[i - 1], curr = juneCells[i];
    const dx = (curr.col - prev.col) / grid.cols;
    const dy = (curr.row - prev.row) / grid.rows;
    scanDist += Math.hypot(dx, dy);
    if (curr.col === prev.col && curr.row > prev.row) verticalSteps++;
    if (curr.row < prev.row && curr.col === prev.col) reverseRows++;
    if (curr.row < prev.row && curr.col < prev.col) reverseRows++;
  }
  const idealDist = 5.45; // 7列自然顺读 29 步的基准归一化步程
  const scanMultiplier = +(scanDist / idealDist).toFixed(2);
  const orderPass = state.orderMode === "natural";

  // C. 层级清晰检验（日期 > 事件 > 详情）
  const hierarchyPass = state.hierarchyMode === "layered";

  // D. 留白平衡与冲突检验
  const allConflicts = [];
  let maxDayCount = 0;
  let busiestDay = 20;
  let minWhitespace = 100;
  let tightDay = 20;
  let maxVisible = 0;
  let weekendWorkDays = [];

  for (const c of juneCells) {
    if (c.events.length > maxDayCount) {
      maxDayCount = c.events.length;
      busiestDay = c.day;
    }
    if (c.visible.length > maxVisible) maxVisible = c.visible.length;
    if (c.events.length > 0 && c.whitespacePct < minWhitespace) {
      minWhitespace = c.whitespacePct;
      tightDay = c.day;
    }
    for (const pair of c.conflicts) {
      allConflicts.push({ day: c.day, a: pair[0], b: pair[1] });
    }
    if (c.weekend && c.events.some((e) => e.cat === "meeting" || e.cat === "review")) {
      weekendWorkDays.push(c.day);
    }
  }
  const activeDays = juneCells.filter((c) => c.events.length > 0).length;
  const balancePass = allConflicts.length === 0 && minWhitespace >= 32 && maxVisible <= 2;

  const checks = {
    grid: {
      pass: gridPass,
      label: gridPass
        ? `7 列等宽 · ${state.weekStart === "mon" ? "周一 ISO" : "周日美式"}`
        : state.colMode === "five"
          ? `5 列错拍 · 周一散落 ${monCols.size} 列`
          : `不等宽 · 列宽极差 ${grid.widthRatio}×`,
    },
    order: {
      pass: orderPass,
      label: orderPass
        ? "左→右、上→下顺读"
        : state.orderMode === "column"
          ? `按列竖排 · 跳程 ${scanMultiplier}×`
          : "最新周置顶 · 倒序反直觉",
    },
    hierarchy: {
      pass: hierarchyPass,
      label: hierarchyPass
        ? "日期 > 色码事件 > 按需详情"
        : state.hierarchyMode === "flat"
          ? "全灰平铺 · 详情压垮日期"
          : "高饱和撞色 · 日期被淹没",
    },
    balance: {
      pass: balancePass,
      label: balancePass
        ? `0 撞期 · 最紧格留白 ${minWhitespace}%`
        : allConflicts.length > 0
          ? `6/${allConflicts[0].day} 撞期 ${allConflicts.length} 处 · 留白 ${minWhitespace}%`
          : `6/${tightDay} 塞满 ${maxVisible} 条 · 留白 ${minWhitespace}%`,
    },
  };

  const score = [gridPass, orderPass, hierarchyPass, balancePass].filter(Boolean).length;

  // 主诊断文案：永远挑最致命的错态先讲清「为什么这样摆会让人看懵」+「亲手怎么改」
  let verdict = {
    tone: "pass",
    tag: `已校准 · ${score} / 4`,
    headline: "四项秩序齐整：扫读全局与单日排期两不误",
    body: `当前 7 列等宽让每个星期几垂直成列（${state.weekStart === "mon" ? "ISO 周一首日" : "美式周日首日"}），日期自然顺读、色码分层、无同点撞期，最繁忙的 6/${busiestDay} 仍保留 ${minWhitespace}% 留白，详情在旁侧「当日概览」按需展开。`,
    action: weekendWorkDays.length
      ? `提示：6/${weekendWorkDays.join("、6/")}（周末）排入了会议或评审，如需避开休息日可继续拖回工作日；也可切「周视图 / 议程流」或故意切回错态验真。`
      : "你也可以故意拖两场同点会议撞期、或切回「5 列错拍 / 不等宽列」，亲眼观察秩序如何瞬间崩塌。",
  };

  if (!gridPass) {
    if (state.colMode === "five") {
      verdict = {
        tone: "fail",
        tag: `错态 · 网格错拍 (${score} / 4)`,
        headline: `5 列排布把周一打散到 ${monCols.size} 个不同列`,
        body: `人眼读月历靠的是「往下直看就能找齐全部周一或周末」。现在只有 5 列，周期 7 天无法整除列数，周一和周六日斜着漂移，每查一天都得做加减心算。`,
        action: "把下方「网格列制」切回「7 列等宽」（周一或周日首日都合法），让同星期几重新排成笔直竖列。",
      };
    } else {
      verdict = {
        tone: "fail",
        tag: `错态 · 列宽失衡 (${score} / 4)`,
        headline: `最宽列是最窄列的 ${grid.widthRatio} 倍，节奏断层`,
        body: "虽然凑齐了 7 列，但按事件多少动态撑宽单元格后，清闲的列被挤成窄条、繁忙的列横向膨胀，读者失去了「一格就是等长一天」的视觉标尺。",
        action: "把「网格列制」切回「7 列等宽」，恢复相同尺寸的单元格秩序。",
      };
    }
  } else if (!orderPass) {
    verdict = {
      tone: "fail",
      tag: `错态 · 顺序打架 (${score} / 4)`,
      headline: state.orderMode === "column"
        ? `日期按列竖排，视线扫描步程暴涨到 ${scanMultiplier}×`
        : "最新一周被倒放到了顶部，顺读规划被打断",
      body: state.orderMode === "column"
        ? `日期竖着灌进每一列后，周一竟被拆散到 ${monCols.size} 列、连读相邻两天要跨行折返，画布上的赤红轨迹就是眼睛被迫做的无效往返。`
        : "倒序适合信息流刷最新动态，却违背日历「从今天往未来推进」的规划直觉，跨周连读时日期先降后升，极易看错先后。",
      action: "把「日期流向」切回「自然顺读（左→右、上→下）」，让星期列与时间流向彻底重合。",
    };
  } else if (!hierarchyPass) {
    verdict = {
      tone: "fail",
      tag: `错态 · 层级塌陷 (${score} / 4)`,
      headline: state.hierarchyMode === "flat"
        ? "详情全倒进月格、全员灰底，日期被彻底埋没"
        : "高饱和撞色抢走焦点，格子成了霓虹广告牌",
      body: state.hierarchyMode === "flat"
        ? "月视图的职责是 3 秒扫出哪天忙、哪天有空。把会议室和备注整段塞进小格且取消类别色标后，日期数字退居二线，会议与调研混成一团灰。"
        : "把每种事件都涂满高饱和强色块并放大边框后，色块互相打架，反而盖住了置顶日期与今日选中态。",
      action: "把「层级表达」切回「分层设色」，让日期置顶、事件靠柔和色标区分、详情交由「当日概览」按需展开。",
    };
  } else if (!balancePass) {
    if (allConflicts.length > 0) {
      const c0 = allConflicts[0];
      verdict = {
        tone: "fail",
        tag: `错态 · 同点撞期 (${score} / 4)`,
        headline: `6/${c0.day}「${c0.a.title}」与「${c0.b.title}」在 ${c0.a.start} 直接撞期`,
        body: `6/${busiestDay} 一天内堆积了 ${maxDayCount} 场日程，且出现 ${allConflicts.length} 处时段重叠；同时单格留白被压到 ${minWhitespace}%，邻日却大面积空着。`,
        action: `直接在日历里按住「设计评审 14:00」拖到其他空白工作日（如 6/7 或 6/21，也可用键盘 ←/→ 改期）解开撞期${state.capMode === "all" ? "，并把「同格上限」切为「+N 折叠」" : ""}。`,
      };
    } else {
      verdict = {
        tone: "fail",
        tag: `错态 · 单格过载 (${score} / 4)`,
        headline: `6/${tightDay} 单格硬塞 ${maxVisible} 条，留白跌到 ${minWhitespace}%`,
        body: "撞期已经解开，但把同一天的 3 条以上事件全摊在月历格里会吃光呼吸空间，月视图很快退化成密密麻麻的文字墙。",
        action: "打开下方「同格上限：+N 折叠」（每格最多显示 2 条，余项收进「当日概览」），或把多余日程拖往邻日分流。",
      };
    }
  }

  return {
    grid,
    checks,
    score,
    verdict,
    metrics: {
      monColCount: monCols.size,
      satColCount: satCols.size,
      widthRatio: grid.widthRatio,
      scanMultiplier,
      conflictCount: allConflicts.length,
      conflicts: allConflicts,
      busiestDay,
      maxDayCount,
      minWhitespace,
      activeDays,
      weekendWorkDays,
      juneCells,
    },
  };
}

// ---------- 第 01 节：为什么一定是 7 列（3~10 列模运算对齐分析） ----------
export function analyzeColumnModulo(cols, weekStart = "mon") {
  // 2024 年 6 月 1 日是周六 (dow=6)；列出 35 格（或 6 月 1..30 共 30 天）分析同星期漂移
  const days = [];
  const lead = cols === 7 ? (weekStart === "mon" ? 5 : 6) : 0;
  const total = Math.ceil((lead + 30) / cols) * cols;
  for (let i = 0; i < total; i++) {
    const offset = i - lead;
    let info;
    if (offset < 0) info = dayInfo(-1, 32 + offset);
    else if (offset < 30) info = dayInfo(0, offset + 1);
    else info = dayInfo(1, offset - 29);
    days.push({ ...info, row: Math.floor(i / cols), col: i % cols });
  }
  const juneMondays = days.filter((d) => d.inMonth && d.dow === 1);
  const monCols = new Set(juneMondays.map((d) => d.col));
  // 计算相邻两个周一之间的横向偏移（7 mod cols）
  const rawShift = 7 % cols;
  const signedShift = rawShift > cols / 2 ? rawShift - cols : rawShift;
  const driftDeg = cols === 7 ? 0 : Math.round(Math.atan2(Math.abs(signedShift), 1) * (180 / Math.PI));
  return {
    cols,
    rows: total / cols,
    days,
    juneMondays,
    monColSpread: monCols.size,
    signedShift,
    driftDeg,
    aligned: cols === 7,
  };
}

// ---------- 第 03 节：RFC 5545 RRULE 12 周点阵投影计算 ----------
export const RRULE_PRESETS = {
  weekly_tu: {
    id: "weekly_tu",
    label: "每周二例会",
    rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=TU",
    note: "1 条规则覆盖 12 周共 12 场例会；改时间只需改规则源头，无需手动改 12 次。",
    match: (weekIdx, dow) => dow === 2,
  },
  mwf: {
    id: "mwf",
    label: "周一/三/五站会",
    rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR",
    note: "多星期并行频率；固定列位让你一眼看出周二、周四保留了整段深度工作窗口。",
    match: (weekIdx, dow) => dow === 1 || dow === 3 || dow === 5,
  },
  biweekly_th: {
    id: "biweekly_th",
    label: "隔周四评审",
    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TH",
    note: "双周迭代节奏（INTERVAL=2）；奇数周亮灯、偶数周留白，月视图里自动形成韵律。",
    match: (weekIdx, dow) => dow === 4 && weekIdx % 2 === 0,
  },
  monthly_last_fri: {
    id: "monthly_last_fri",
    label: "每月最后一个周五",
    rrule: "FREQ=MONTHLY;BYDAY=-1FR",
    note: "相对序数规则（-1FR）会自动适配 28/30/31 天不同月长，不会在二月失效。",
    match: (weekIdx, dow) => dow === 5 && (weekIdx === 3 || weekIdx === 7 || weekIdx === 11),
  },
};

export function buildRruleProjection(presetId, skipHoliday = false) {
  const preset = RRULE_PRESETS[presetId] || RRULE_PRESETS.weekly_tu;
  // 12 周 × 7 列（周一=1..周日=0），从 2024-06-03 周一开始
  const dows = [1, 2, 3, 4, 5, 6, 0];
  const holidayCell = { w: 1, c: 0 }; // 示意第 2 周周一（端午调休/节假日）为例外跳日
  const cells = [];
  let hitCount = 0;
  let skippedCount = 0;

  for (let w = 0; w < 12; w++) {
    for (let c = 0; c < 7; c++) {
      const dow = dows[c];
      const baseHit = preset.match(w, dow);
      // 模拟一个与该规则冲突的节假日例外日（落在第 6 周首个命中格）
      const isExdateTarget = baseHit && w === 5;
      const skipped = skipHoliday && isExdateTarget;
      const active = baseHit && !skipped;
      if (active) hitCount++;
      if (skipped) skippedCount++;
      cells.push({ w, c, dow, weekend: dow === 6 || dow === 0, active, skipped, baseHit });
    }
  }
  const fullRule = skipHoliday
    ? `${preset.rrule}\nEXDATE;VALUE=DATE:20240709`
    : preset.rrule;

  return { preset, cells, hitCount, skippedCount, fullRule, manualSaved: Math.max(0, hitCount - 1) };
}
