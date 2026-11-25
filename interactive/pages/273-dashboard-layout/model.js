// 273 仪表盘布局 · 单一真源数据与信息架构评估模型
// 全部开场数值、24 小时遥测曲线、告警判定、四柱达标状态与各节交互均从这里算出，禁止在渲染层写死读数。

export const IDEAL_ORDER = ["kpi", "trend", "ops"];

export const TIER_META = {
  kpi: {
    id: "kpi",
    code: "L1",
    name: "核心指标带",
    en: "KPI STRIP",
    role: "先给全局结论",
  },
  trend: {
    id: "trend",
    code: "L2",
    name: "趋势与渠道带",
    en: "TREND & CHANNEL",
    role: "再看波动与拆解",
  },
  ops: {
    id: "ops",
    code: "L3",
    name: "实时监控与告警带",
    en: "MONITOR & ALERTS",
    role: "最后落到异常现场",
  },
};

export const KPI_DEFS = [
  {
    id: "visits",
    label: "访问量",
    en: "VISITS",
    core: true,
    accent: "cyan",
    icon: "bars",
    unit: "K",
    base: 28.6,
    baseDelta: 8.2,
    format: (v) => `${v.toFixed(1)}K`,
    formatDelta: (d) => `${d >= 0 ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%`,
  },
  {
    id: "users",
    label: "新增用户",
    en: "NEW USERS",
    core: true,
    accent: "lime",
    icon: "user",
    unit: "K",
    base: 3.42,
    baseDelta: 12.6,
    format: (v) => `${v.toFixed(2)}K`,
    formatDelta: (d) => `${d >= 0 ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%`,
  },
  {
    id: "orders",
    label: "订单数",
    en: "ORDERS",
    core: true,
    accent: "cyan",
    icon: "cart",
    unit: "K",
    base: 1.28,
    baseDelta: 5.4,
    format: (v) => `${v.toFixed(2)}K`,
    formatDelta: (d) => `${d >= 0 ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%`,
  },
  {
    id: "conv",
    label: "转化率",
    en: "CONVERSION",
    core: true,
    accent: "lime",
    icon: "coin",
    unit: "%",
    base: 4.56,
    baseDelta: 3.1,
    format: (v) => `${v.toFixed(2)}%`,
    formatDelta: (d) => `${d >= 0 ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%`,
  },
  {
    id: "wordcount",
    label: "页面字数",
    en: "WORD COUNT",
    core: false,
    accent: "cyan",
    icon: "doc",
    unit: "",
    base: 1420,
    baseDelta: 0.4,
    format: (v) => `${Math.round(v).toLocaleString("en-US")}`,
    formatDelta: (d) => `${d >= 0 ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%`,
  },
  {
    id: "iconcache",
    label: "图标缓存",
    en: "ICON CACHE",
    core: false,
    accent: "lime",
    icon: "chip",
    unit: "%",
    base: 98.4,
    baseDelta: 0.1,
    format: (v) => `${v.toFixed(1)}%`,
    formatDelta: (d) => `${d >= 0 ? "↑" : "↓"} ${Math.abs(d).toFixed(1)}%`,
  },
  {
    id: "fonts",
    label: "字重加载",
    en: "FONT SETS",
    core: false,
    accent: "cyan",
    icon: "type",
    unit: "",
    base: 3,
    baseDelta: 0.0,
    format: (v) => `${Math.round(v)} 组`,
    formatDelta: () => "± 0.0%",
  },
];

// 渠道分布（取自 273 原海报：直接访问 40%、自然搜索 30%、社交媒体 20%、其他渠道 10%）
export const CHANNELS = [
  { id: "direct", label: "直接访问", share: 40, color: "#3BDAED", profile: [0.38, 0.36, 0.40, 0.44, 0.43, 0.39, 0.41, 0.40, 0.42] },
  { id: "organic", label: "自然搜索", share: 30, color: "#ADE62D", profile: [0.28, 0.27, 0.31, 0.32, 0.30, 0.29, 0.31, 0.30, 0.29] },
  { id: "social", label: "社交媒体", share: 20, color: "#6E7478", profile: [0.22, 0.24, 0.19, 0.16, 0.18, 0.22, 0.19, 0.21, 0.20] },
  { id: "other", label: "其他渠道", share: 10, color: "#43474A", profile: [0.12, 0.13, 0.10, 0.08, 0.09, 0.10, 0.09, 0.09, 0.09] },
];

// 24 小时遥测锚点（每 2 小时一点 + 三个精准告警锚点，0..1440 分钟）
// current: 本期活跃指数 (0..100), prev: 上期基线 (0..100), load: 系统负载 (%), diskFree: 磁盘剩余 (%), conv: 转化率 (%)
const TELEMETRY_ANCHORS = [
  { m: 0,    cur: 18, prev: 15, load: 34, disk: 32, conv: 4.32 },
  { m: 120,  cur: 14, prev: 13, load: 29, disk: 30, conv: 4.28 },
  { m: 240,  cur: 16, prev: 14, load: 31, disk: 27, conv: 4.35 },
  { m: 360,  cur: 29, prev: 24, load: 45, disk: 21, conv: 4.44 },
  { m: 487,  cur: 52, prev: 38, load: 69, disk: 11, conv: 4.52 }, // 08:07 磁盘空间不足 (<15%)
  { m: 555,  cur: 61, prev: 44, load: 74, disk: 19, conv: 4.58 }, // 09:15 备份完成并释放日志
  { m: 624,  cur: 83, prev: 49, load: 91, disk: 18, conv: 4.56 }, // 10:24 服务器负载较高 (91%) — 开场时刻
  { m: 720,  cur: 74, prev: 53, load: 72, disk: 22, conv: 4.68 }, // 12:00 扩容后回落至原海报 72%
  { m: 840,  cur: 64, prev: 51, load: 64, disk: 24, conv: 4.62 },
  { m: 960,  cur: 56, prev: 42, load: 58, disk: 25, conv: 4.49 },
  { m: 1050, cur: 49, prev: 39, load: 55, disk: 26, conv: 3.95 },
  { m: 1120, cur: 44, prev: 47, load: 61, disk: 25, conv: 2.18 }, // 18:40 转化率跌破预警
  { m: 1200, cur: 68, prev: 50, load: 67, disk: 26, conv: 4.36 },
  { m: 1320, cur: 79, prev: 54, load: 73, disk: 27, conv: 4.71 },
  { m: 1439, cur: 58, prev: 43, load: 52, disk: 28, conv: 4.55 },
];

export const INCIDENTS = [
  {
    id: "load",
    minute: 624,
    time: "10:24",
    title: "服务器负载较高",
    detail: "峰值冲至 91%，建议扩容应对",
    severity: "critical",
    window: [590, 675],
  },
  {
    id: "backup",
    minute: 555,
    time: "09:15",
    title: "数据库备份完成",
    detail: "增量归档校验通过",
    severity: "info",
    window: [525, 585],
  },
  {
    id: "disk",
    minute: 487,
    time: "08:07",
    title: "磁盘空间不足",
    detail: "剩余空间 11%，低于 15% 红线",
    severity: "critical",
    window: [450, 520],
  },
  {
    id: "conv",
    minute: 1120,
    time: "18:40",
    title: "转化率跌破阈值",
    detail: "回落至 2.18%，结账接口超时",
    severity: "critical",
    window: [1085, 1165],
  },
];

export function formatMinute(m) {
  const clamped = Math.max(0, Math.min(1439, Math.round(m)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
  const mm = String(clamped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function sampleTelemetry(minute, channelId = "all") {
  const m = Math.max(0, Math.min(1439, minute));
  let i = 0;
  while (i < TELEMETRY_ANCHORS.length - 2 && TELEMETRY_ANCHORS[i + 1].m < m) i++;
  const a = TELEMETRY_ANCHORS[i];
  const b = TELEMETRY_ANCHORS[i + 1];
  const t = b.m === a.m ? 0 : (m - a.m) / (b.m - a.m);
  // Smoothstep for gentle organic telemetry interpolation
  const s = t * t * (3 - 2 * t);
  const lerp = (x, y) => x + (y - x) * s;

  const chScale =
    channelId === "direct" ? 0.88 :
    channelId === "organic" ? 0.74 :
    channelId === "social" ? 0.56 :
    channelId === "other" ? 0.36 : 1.0;

  const curRaw = lerp(a.cur, b.cur);
  const prevRaw = lerp(a.prev, b.prev);
  const cur = curRaw * chScale;
  const prev = prevRaw * chScale;
  const load = Math.round(lerp(a.load, b.load));
  const disk = Math.round(lerp(a.disk, b.disk));
  const conv = lerp(a.conv, b.conv);

  // Derived KPI live numbers anchored around Poster 273 at mid-morning
  const ratio = curRaw / 83;
  const visits = Math.max(4.2, 28.6 * (0.45 + 0.55 * ratio) * chScale);
  const users = Math.max(0.48, 3.42 * (0.42 + 0.58 * ratio) * chScale);
  const orders = Math.max(0.18, 1.28 * (0.44 + 0.56 * ratio) * (conv / 4.56) * chScale);

  const deltaScale = curRaw - prevRaw;
  const visitsDelta = +(deltaScale * 0.24).toFixed(1);
  const usersDelta = +(deltaScale * 0.37).toFixed(1);
  const ordersDelta = +((deltaScale * 0.16) + (conv - 4.56) * 2.2).toFixed(1);
  const convDelta = +((conv - 4.42) / 4.42 * 100).toFixed(1);

  // Active anomaly right at this minute
  let activeIncident = null;
  for (const inc of INCIDENTS) {
    if (inc.severity === "critical" && m >= inc.window[0] && m <= inc.window[1]) {
      activeIncident = inc;
      break;
    }
  }
  const hasCritical = !!activeIncident || load >= 80 || disk < 15 || conv < 3.0;

  // Task progress (from Poster 273: 85 / 62 / 40 / 90, modulated slightly by time of day)
  const dayFrac = m / 1439;
  const tasks = [
    { name: "数据同步", pct: Math.min(99, Math.round(62 + dayFrac * 36)), accent: "cyan" },
    { name: "报表生成", pct: Math.min(98, Math.round(36 + dayFrac * 52)), accent: "lime" },
    { name: "内容更新", pct: Math.min(96, Math.round(22 + dayFrac * 44)), accent: "cyan" },
    { name: "系统备份", pct: m >= 555 ? 100 : Math.max(18, Math.round((m / 555) * 95)), accent: "lime" },
  ];

  // Sparkline 7-point trail leading up to current minute for each KPI
  const trail = [];
  for (let k = 6; k >= 0; k--) {
    const tm = Math.max(0, m - k * 75);
    let j = 0;
    while (j < TELEMETRY_ANCHORS.length - 2 && TELEMETRY_ANCHORS[j + 1].m < tm) j++;
    const p1 = TELEMETRY_ANCHORS[j];
    const p2 = TELEMETRY_ANCHORS[j + 1];
    const f = p2.m === p1.m ? 0 : (tm - p1.m) / (p2.m - p1.m);
    trail.push({
      cur: (p1.cur + (p2.cur - p1.cur) * f) * chScale,
      conv: p1.conv + (p2.conv - p1.conv) * f,
      load: p1.load + (p2.load - p1.load) * f,
    });
  }

  return {
    minute: m,
    timeStr: formatMinute(m),
    cur,
    prev,
    load,
    disk,
    conv,
    hasCritical,
    activeIncident,
    tasks,
    kpis: {
      visits: { value: visits, delta: visitsDelta, spark: trail.map((x) => x.cur), alert: false },
      users: { value: users, delta: usersDelta, spark: trail.map((x, idx) => x.cur * (0.9 + idx * 0.025)), alert: false },
      orders: { value: orders, delta: ordersDelta, spark: trail.map((x) => x.cur * (x.conv / 4.6)), alert: ordersDelta < -12 },
      conv: { value: conv, delta: convDelta, spark: trail.map((x) => x.conv * 16), alert: conv < 3.0 },
      wordcount: { value: 1420 + Math.round(Math.sin(m / 180) * 6), delta: 0.4, spark: [50, 50, 51, 50, 51, 51, 51], alert: false },
      iconcache: { value: 98.4 + Math.cos(m / 240) * 0.1, delta: 0.1, spark: [70, 71, 70, 70, 71, 70, 71], alert: false },
      fonts: { value: 3, delta: 0, spark: [40, 40, 40, 40, 40, 40, 40], alert: false },
    },
  };
}

export function getTrendSeries(channelId = "all") {
  const pts = [];
  for (let m = 0; m <= 1440; m += 30) {
    const s = sampleTelemetry(Math.min(1439, m), channelId);
    pts.push({ m, cur: s.cur, prev: s.prev, load: s.load, conv: s.conv, disk: s.disk });
  }
  return pts;
}

// 默认开场：刻意停在 0/4 翻车态（10:24 负载 91% 告警，但层级倒置、7 卡过载无基准、均色淹没）
export function createBrokenState() {
  return {
    tierOrder: ["ops", "trend", "kpi"],
    activeKpis: ["visits", "users", "orders", "conv", "wordcount", "iconcache", "fonts"],
    showBaseline: false,
    signalMode: "flood", // 'flood' | 'muted' | 'anomaly'
    selectedChannel: "all",
    minute: 624, // 10:24 — 与原海报告警中心第一条时间完全一致
  };
}

export function createIdealState(minute = 624) {
  return {
    tierOrder: ["kpi", "trend", "ops"],
    activeKpis: ["visits", "users", "orders", "conv"],
    showBaseline: true,
    signalMode: "anomaly",
    selectedChannel: "all",
    minute,
  };
}

// 单一诊断真源：所有四柱达标状态、数字指标与中文因果说明皆由此函数唯一计算
export function evaluateDashboard(state) {
  const activeDefs = state.activeKpis
    .map((id) => KPI_DEFS.find((k) => k.id === id))
    .filter(Boolean);
  const coreCount = activeDefs.filter((k) => k.core).length;
  const noiseCount = activeDefs.filter((k) => !k.core).length;
  const totalKpis = activeDefs.length;

  // 计算三层顺序逆序数（0 表示完全符合 KPI → 趋势 → 监控告警）
  let inversions = 0;
  for (let i = 0; i < state.tierOrder.length; i++) {
    for (let j = i + 1; j < state.tierOrder.length; j++) {
      if (IDEAL_ORDER.indexOf(state.tierOrder[i]) > IDEAL_ORDER.indexOf(state.tierOrder[j])) {
        inversions++;
      }
    }
  }
  const kpiTop = state.tierOrder[0] === "kpi";
  const opsBottom = state.tierOrder[2] === "ops";

  // 四大柱标（对应原海报底沿：总览 / 指标 / 监控 / 效率）
  const overviewOk = inversions === 0;
  const kpiOk = noiseCount === 0 && coreCount >= 3 && coreCount <= 5 && state.showBaseline;
  const monitorOk = state.signalMode === "anomaly";
  const singleScreenFit = totalKpis <= 5 && totalKpis >= 3;
  const efficiencyOk = overviewOk && kpiOk && monitorOk && singleScreenFit;

  const score = [overviewOk, kpiOk, monitorOk, efficiencyOk].filter(Boolean).length;

  // 示意扫视停顿数（明确在界面标注「示意」，由层级逆序 + 噪音卡 + 信号干扰线性算出）
  const scanStops =
    3 +
    inversions * 2 +
    noiseCount * 1 +
    (state.signalMode === "flood" ? 2 : state.signalMode === "muted" ? 3 : 0) +
    (state.showBaseline ? 0 : 1) +
    (coreCount < 3 ? 2 : 0);

  // 单屏负荷档位
  let densityTag = "单屏收束";
  if (totalKpis > 5) densityTag = "首屏超载";
  else if (totalKpis < 3) densityTag = "视角残缺";

  // 四柱细状态标签
  const pillarStatus = {
    overview: overviewOk
      ? { ok: true, tag: "倒金字塔成立" }
      : { ok: false, tag: state.tierOrder[0] === "ops" ? "告警压顶倒置" : "层级顺序错位" },
    kpi: kpiOk
      ? { ok: true, tag: `${coreCount} 项核心·有基准` }
      : noiseCount > 0
      ? { ok: false, tag: `混入 ${noiseCount} 个噪音指标` }
      : coreCount < 3
      ? { ok: false, tag: `仅剩 ${coreCount} 项·盲区失察` }
      : { ok: false, tag: "裸数缺同比基准" },
    monitor: monitorOk
      ? { ok: true, tag: "异常独占高亮" }
      : state.signalMode === "flood"
      ? { ok: false, tag: "均色过载·淹没告警" }
      : { ok: false, tag: "全灰静默·漏看故障" },
    efficiency: efficiencyOk
      ? { ok: true, tag: `${scanStops} 步直达（示意）` }
      : { ok: false, tag: `${scanStops} 步绕读（示意）` },
  };

  // 主诊断：按最致命问题优先播报，说清「眼睛怎么读、为什么错、改哪一步」
  const snap = sampleTelemetry(state.minute, state.selectedChannel);
  let badge = "4/4 巡检成立";
  let level = "ok";
  let headline = `五秒单屏成立：${snap.timeStr} 的全局指标与异常一目了然`;
  let reason = snap.hasCritical
    ? `顶行 ${coreCount} 项核心 KPI 带基准折线先定全局，中行曲线锁住变化，底行「${snap.activeIncident ? snap.activeIncident.title : "实时告警"}」在克制底色上独自破出——眼睛约 ${scanStops} 步（示意）即完成发现到定位。`
    : `顶行 ${coreCount} 项核心 KPI 给出平稳结论，中行趋势与渠道可随时交叉筛选，底行系统处于安静基线；拖动上方 24h 拨尺到 08:07、10:24 或 18:40，观察异常如何瞬间跳出。`;
  let hint = "拖动 24h 时间轴拨尺，或点击渠道圆环联动筛选趋势，检验全天异常捕捉速度。";

  if (!overviewOk) {
    level = "err";
    badge = `${score}/4 层级倒置`;
    if (state.tierOrder[0] === "ops") {
      headline = "监控告警压在第一行，眼睛被迫先钻细枝末节";
      reason = `此刻 ${snap.timeStr} 负载冲到 ${snap.load}%，但操作员先撞上三条告警和任务条，却看不到核心访问量与转化率有没有受损。仪表盘必须「先结论、再归因、后现场」。`;
      hint = "点各层标题条上的「↑ / ↓」，把「核心指标带」推回第 1 层、「监控与告警带」放到第 3 层。";
    } else {
      headline = "曲线或告警排在 KPI 之前，扫视路径来回折返";
      reason = `当前存在 ${inversions} 处层级逆序，眼睛读完中间图表还要回头找顶层总数，增加不必要的扫视停顿（当前约 ${scanStops} 步·示意）。`;
      hint = "将三层理顺为「核心指标带 → 趋势与渠道带 → 监控与告警带」。";
    }
  } else if (noiseCount > 0) {
    level = "err";
    badge = `${score}/4 指标过载`;
    headline = `顶行混入 ${noiseCount} 个虚荣指标，单屏五秒预算被稀释`;
    reason = `「页面字数 / 图标缓存 / 字重加载」不会触发任何运维决策，却把 KPI 挤成 ${totalKpis} 张窄卡、挤走下方趋势区的首屏空间。`;
    hint = "点指标筛选栏或卡片上的「×」，剔除那 3 个无关决策的噪音指标。";
  } else if (coreCount < 3) {
    level = "err";
    badge = `${score}/4 监控盲区`;
    headline = `核心指标删得只剩 ${coreCount} 项，业务链路出现盲区`;
    reason = "精简不是删光：访问量、新增用户、订单数、转化率构成漏斗闭环，少于 3 项会让你在 18:40 转化率暴跌时浑然不觉。";
    hint = "在指标筛选栏把核心 KPI 补回 3–4 项（建议保留全部 4 项主指标）。";
  } else if (!state.showBaseline) {
    level = "err";
    badge = `${score}/4 裸数失语`;
    headline = `单看 ${snap.kpis.visits.value.toFixed(1)}K 不知好坏——缺少对比基准与迷你走势`;
    reason = "没有上期同比和迷你折线（Sparkline），孤立数字无法回答「这是涨了、跌了、还是反常」。人脑需要参照系才能做一瞥判断。";
    hint = "打开「对比基准（同比+迷你折线）」，给每个大数字配上参照上下文。";
  } else if (state.signalMode === "flood") {
    level = "err";
    badge = `${score}/4 均色淹没`;
    headline = "正常指标与严重告警同色抢焦，真正的故障被淹没";
    reason = `所有卡片和进度条都在发亮，${snap.timeStr} 的「${snap.activeIncident ? snap.activeIncident.title : "高负载告警"}」混在一片电青和酸橙绿里，前注意视觉通道彻底失效。`;
    hint = "把信号纪律切到「异常聚焦」，让正常状态退回安静，只让越线告警高亮破出。";
  } else if (state.signalMode === "muted") {
    level = "err";
    badge = `${score}/4 静默漏报`;
    headline = "全屏灰阶无信号层级，越线告警毫无视觉破出";
    reason = `克制不等于放弃预警：全灰画面里 ${snap.timeStr} 的严重告警和普通备份通知长得一模一样，值班员必须逐行读字才能发现异常。`;
    hint = "把信号纪律切到「异常聚焦」，为真正越过阈值的异常保留唯一醒目通道。";
  }

  return {
    score,
    level,
    badge,
    headline,
    reason,
    hint,
    coreCount,
    noiseCount,
    totalKpis,
    inversions,
    scanStops,
    densityTag,
    overviewOk,
    kpiOk,
    monitorOk,
    efficiencyOk,
    kpiTop,
    opsBottom,
    pillarStatus,
    snap,
  };
}

// ---------- 第 01 节：三种阅读流扫视路径数据 ----------
export const SCAN_FLOWS = {
  pyramid: {
    id: "pyramid",
    label: "倒金字塔（推荐）",
    stops: 3,
    verdict: "3 步直达现场（示意）",
    desc: "第一眼扫顶行 KPI 发现转化异动，第二眼看中行趋势曲线确认拐点时间，第三眼落底行告警直接派单——视线单向向下，零折返。",
    order: ["KPI 总览（4 项含基准）", "趋势与渠道归因", "负载与异常告警"],
    points: [
      { x: 110, y: 54, label: "1. 看全局 KPI" },
      { x: 250, y: 158, label: "2. 锁趋势拐点" },
      { x: 492, y: 268, label: "3. 直达紧急告警" },
    ],
  },
  flat: {
    id: "flat",
    label: "平权九宫格",
    stops: 8,
    verdict: "8 步往返跳读（示意）",
    desc: "所有指标、饼图、日志装在大小相同的方块里，没有主次锚点。视线在 9 个等权方块之间反复来回折返，五秒内难以归纳结论。",
    order: ["等权卡片网格（无主次分层）"],
    points: [
      { x: 96, y: 66, label: "1" },
      { x: 270, y: 158, label: "2" },
      { x: 444, y: 66, label: "3" },
      { x: 96, y: 248, label: "4" },
      { x: 444, y: 158, label: "5" },
      { x: 270, y: 66, label: "6" },
      { x: 270, y: 248, label: "7" },
      { x: 444, y: 248, label: "8 才撞见告警" },
    ],
  },
  bottomup: {
    id: "bottomup",
    label: "日志压顶（倒置）",
    stops: 6,
    verdict: "6 步逆向折返（示意）",
    desc: "一打开先被一长串毫秒级告警和进度条糊脸，操作员不得不先滑到底部确认核心订单跌没跌，再回头翻告警，视线上下往复。",
    order: ["原始告警与日志流", "趋势图", "被压到底部的核心 KPI"],
    points: [
      { x: 130, y: 56, label: "1. 陷入零散日志" },
      { x: 390, y: 56, label: "2. 疑心是否全局故障" },
      { x: 270, y: 258, label: "3. 滑到底部找总数" },
      { x: 160, y: 158, label: "4. 再回头看曲线" },
      { x: 410, y: 68, label: "5. 折返核对告警" },
      { x: 440, y: 168, label: "6. 才确认影响面" },
    ],
  },
};

// ---------- 第 02 节：单屏 KPI 容积预算模型 ----------
export const BUDGET_CARDS = [
  { name: "访问量", val: "28.6K", delta: "+8.2%", core: true },
  { name: "新增用户", val: "3.42K", delta: "+12.6%", core: true },
  { name: "订单数", val: "1.28K", delta: "+5.4%", core: true },
  { name: "转化率", val: "4.56%", delta: "+3.1%", core: true },
  { name: "客单价", val: "¥246", delta: "+1.9%", core: true },
  { name: "复购率", val: "31.2%", delta: "+0.8%", core: false },
  { name: "跳出率", val: "24.8%", delta: "-1.1%", core: false },
  { name: "停留时长", val: "4m12s", delta: "+0.5%", core: false },
  { name: "客服响应", val: "19s", delta: "-2.0%", core: false },
  { name: "缓存命中", val: "98.4%", delta: "+0.1%", core: false },
  { name: "页面字数", val: "1,420", delta: "+0.4%", core: false },
  { name: "静态资源", val: "42 项", delta: "0.0%", core: false },
];

export function evaluateBudget(count) {
  const n = Math.max(2, Math.min(12, Math.round(count)));
  const cols = n <= 2 ? 2 : n <= 5 ? n : n <= 8 ? 4 : 4;
  const kpiRows = Math.ceil(n / cols);
  // 模拟 16:9 单屏高度 320px：每行 KPI 占 78px，趋势区占 132px，监控区占 92px
  const kpiHeight = kpiRows * 74 + (kpiRows - 1) * 8;
  const totalHeight = kpiHeight + 12 + 124 + 12 + 86;
  const foldLine = 320;
  const overflowPx = Math.max(0, totalHeight - foldLine);
  const clippedOps = overflowPx > 12;
  const clippedTrend = overflowPx > 105;

  let zone = "sweet";
  let status = "单屏甜区（经验 3–5 张）";
  let note = "四五张核心指标排成一横带，每张卡都能容下标题、大号数字、同比与迷你折线，中层的趋势图与底层的监控告警全部留在首屏折线之内，无需滚屏即可完成五秒巡检。";
  if (n < 3) {
    zone = "sparse";
    status = "指标不足（盲区风险）";
    note = "首屏只放 2 张指标虽然很空，但关键业务闭环残缺（例如有流量却看不到订单与转化），一旦漏斗中段断裂，值班员在第一屏毫无察觉。";
  } else if (n > 5) {
    zone = "overload";
    status = clippedTrend ? "严重超载（中下两层全挤出首屏）" : "首屏超载（监控告警被挤出折线）";
    note = `KPI 膨胀到 ${n} 张并折成 ${kpiRows} 行后，顶行吃掉了 ${Math.round((kpiHeight / foldLine) * 100)}% 的首屏高度，底部的实时监控与告警区被推到滚屏折叠线以下——违背了 Stephen Few「单屏一瞥即懂」的底线。`;
  }
  return { n, cols, kpiRows, kpiHeight, totalHeight, foldLine, overflowPx, clippedOps, clippedTrend, zone, status, note };
}

// ---------- 第 03 节：Cleveland & McGill 视觉编码对比数据 ----------
export const ENCODING_DATA = [
  { name: "订单集群 A", value: 85, target: 75, warn: 80 },
  { name: "网关节点 B", value: 72, target: 75, warn: 80 },
  { name: "搜索索引 C", value: 62, target: 75, warn: 80 },
  { name: "消息队列 D", value: 40, target: 75, warn: 80 },
];

export const ENCODING_MODES = {
  bullet: {
    id: "bullet",
    name: "子弹图 / 共基线横条",
    rank: "Cleveland–McGill 第 1 梯队（共基线位置）",
    spacePct: "100% 基准面积",
    verdict: "最准、最省空间。四条共左基线并排，不看数字也能一眼比出 A 比 C 高出约三分之一，且 A 已越过 80% 警戒刻度线、达到 75% 目标线以上。",
  },
  gauge: {
    id: "gauge",
    name: "半圆表盘（原海报同款形态）",
    rank: "第 3 梯队（角度与弧长）",
    spacePct: "约 2.4× 占位面积",
    verdict: "单看 1 个主负载时很有驾驶舱氛围（如原海报左下 72%），但 4 个并排后大片空心圆弧吞掉首屏空间，且遮住数字后人眼很难精确比较 72° 与 62° 弧长差。",
  },
  donut: {
    id: "donut",
    name: "分段圆环图",
    rank: "第 3–4 梯队（角度 + 弧长）",
    spacePct: "约 1.8× 占位面积",
    verdict: "只适合粗略看「占整体的几成」（如原海报 4 项渠道占比），不适合比较各节点绝对负载，且不标数字时 72 与 62 两段扇角极易看混。",
  },
  bubble: {
    id: "bubble",
    name: "气泡面积图",
    rank: "第 4 梯队（二维面积）",
    spacePct: "约 2.1× 占位面积",
    verdict: "人类视觉系统会系统性低估面积比——85 与 40 数值差超两倍，但圆半径只差 √2.12 ≈ 1.46 倍，遮掉数字后极容易误判为「差不多大」。",
  },
};

// ---------- 第 04 节：6 节点故障注入与语义色纪律 ----------
export const CLUSTER_SCENARIOS = {
  calm: {
    id: "calm",
    label: "全线平稳",
    nodes: [
      { id: "API-01", metric: "42%", sub: "延迟 28ms", state: "ok" },
      { id: "DB-主库", metric: "54%", sub: "连接正常", state: "ok" },
      { id: "订单服务", metric: "38%", sub: "吞吐稳定", state: "ok" },
      { id: "磁盘存储", metric: "66%", sub: "余量 34%", state: "ok" },
      { id: "缓存集群", metric: "49%", sub: "命中 99%", state: "ok" },
      { id: "定时备份", metric: "完成", sub: "09:15 归档", state: "ok" },
    ],
  },
  disk: {
    id: "disk",
    label: "单点磁盘告急",
    nodes: [
      { id: "API-01", metric: "44%", sub: "延迟 31ms", state: "ok" },
      { id: "DB-主库", metric: "58%", sub: "连接正常", state: "ok" },
      { id: "订单服务", metric: "41%", sub: "吞吐稳定", state: "ok" },
      { id: "磁盘存储", metric: "89%", sub: "余量仅 11%", state: "crit" },
      { id: "缓存集群", metric: "51%", sub: "命中 98%", state: "ok" },
      { id: "定时备份", metric: "完成", sub: "09:15 归档", state: "ok" },
    ],
  },
  cascade: {
    id: "cascade",
    label: "双点高载告警",
    nodes: [
      { id: "API-01", metric: "91%", sub: "负载超 80%", state: "crit" },
      { id: "DB-主库", metric: "78%", sub: "接近阈值", state: "warn" },
      { id: "订单服务", metric: "46%", sub: "吞吐稳定", state: "ok" },
      { id: "磁盘存储", metric: "89%", sub: "余量仅 11%", state: "crit" },
      { id: "缓存集群", metric: "52%", sub: "命中 98%", state: "ok" },
      { id: "定时备份", metric: "排队", sub: "等待 I/O", state: "ok" },
    ],
  },
};

export const COLOR_DISCIPLINES = {
  poster_mix: {
    id: "poster_mix",
    label: "青绿混用（同原海报告警区）",
    desc: "正常卡片与「磁盘告急 / 负载过高」都用同款亮酸橙绿和电青色。画面好看，但视觉通道被复用，值班员必须逐行读字才能确认哪张真出事。",
  },
  rainbow: {
    id: "rainbow",
    label: "每卡一色（彩虹霓虹）",
    desc: "六张节点分别涂上青、绿、紫、黄、蓝、粉六种高饱和底色，前注意通道彻底饱和，异常节点完全融进背景噪音里。",
  },
  exception: {
    id: "exception",
    label: "静音基线·仅异常破出（推荐）",
    desc: "正常节点全部退回冷静低饱和灰与细线，高饱和珊瑚琥珀色只授予真正越过阈值的故障节点——哪怕不读文字，0.3 秒就能锁定异常坐标。",
  },
};

// ---------- 第 05 节：历史演进四时期标本 ----------
export const HISTORY_ERAS = [
  {
    id: "1842",
    year: "1842",
    title: "马车挡泥板 → 驾驶舱立板",
    source: "Merriam-Webster 最早用例 1842；20 世纪初汽车沿用",
    summary: "dashboard 原意是马车前挡住马蹄溅泥的木板；进入汽车与航空时代后，设计师顺势把车速、油压、高度等最关键的读数集中到正对视线的一块立板上——「单屏一瞥即懂」的物理原型由此诞生。",
  },
  {
    id: "1979",
    year: "1979",
    title: "关键成功因素与高管信息系统",
    source: "John F. Rockart，《哈佛商业评论》1979 年 3–4 月号",
    summary: "MIT 斯隆管理学院教授 John F. Rockart 指出：高管每天收到成摞财务报表却看不清公司命脉。他提出「关键成功因素（CSF）」，只盯 3–6 个决定成败的核心维度，催生了早期电子高管信息系统（EIS）。",
  },
  {
    id: "1996",
    year: "1996",
    title: "先总览，再筛选，后看细节",
    source: "Ben Shneiderman，IEEE 视觉语言研讨会 1996",
    summary: "马里兰大学教授 Ben Shneiderman 提出信息可视化检索咒语：「Overview first, zoom and filter, then details-on-demand」。它直接定义了现代交互式仪表盘从顶层 KPI 到点击下钻的三步骨架。",
  },
  {
    id: "2006",
    year: "2006",
    title: "现代单屏仪表盘与迷你折线",
    source: "Stephen Few (2004/2006/2013) & Edward Tufte (1983/2006)",
    summary: "Stephen Few 正式给仪表盘划出硬边界：「收束在单屏内、为一瞥监控而设」，批驳堆砌拟物汽车表盘的风气；同年 Edward Tufte 在《Beautiful Evidence》提出迷你折线（Sparklines），让趋势直接长在 KPI 数字身旁。",
  },
];

// ---------- 第 06 节：三类仪表盘配置对照 ----------
export const DASHBOARD_TYPES = {
  operational: {
    id: "operational",
    name: "运营监控型",
    en: "OPERATIONAL",
    cadence: "秒级 — 分钟级刷新",
    audience: "运维值班员、客服主管、物流调度",
    ratio: [25, 30, 45], // KPI / 趋势 / 实时告警
    focus: "此刻哪里出了异常、需不需要立刻介入",
    pitfall: "把月度战略大饼图和复杂筛选器塞进值班大屏，拖慢故障响应。",
  },
  analytical: {
    id: "analytical",
    name: "分析洞察型",
    en: "ANALYTICAL",
    cadence: "小时级 — 日级更新",
    audience: "产品经理、增长分析师、运营专家",
    ratio: [25, 55, 20],
    focus: "为什么涨跌、哪个渠道或人群拉动了变化",
    pitfall: "只给孤立大数字却不给同比基线、分渠道拆解和下钻入口。",
  },
  strategic: {
    id: "strategic",
    name: "战略总览型",
    en: "STRATEGIC",
    cadence: "周级 — 季度复盘",
    audience: "管理层、业务负责人",
    ratio: [45, 40, 15],
    focus: "核心指标距离季度/年度目标还差多少",
    pitfall: "塞满毫秒级服务器 CPU 抖动日志，让管理层被短期噪音带偏。",
  },
};

// ---------- 第 07 节：四选一实战练习（严格单一变量控制） ----------
export const PRACTICE_OPTIONS = {
  A: {
    id: "A",
    correct: false,
    shortVar: "变量偏差：层级倒置",
    title: "方案 A：层级倒置——告警日志压顶，核心 KPI 沉在底行",
    body: "方案 A 的指标数（4 项）、同比基线和异常破出配色都没问题，但它把告警和进度压到了第一行，把全局 KPI 藏到最底下。大促值班时眼睛先撞上一堆局部日志，无法在第一秒判断整体交易盘是否健康。",
  },
  B: {
    id: "B",
    correct: true,
    shortVar: "单屏倒金字塔 · 全部成立",
    title: "选对了！方案 B 在一屏内完整满足「倒金字塔 + 基准 + 异常破出」",
    body: "顶行 4 张核心 KPI 自带迷你折线和同比，两秒定全局；中行双折线曲线锁住拐点；底行负载与告警平时克制，仅 1 条紧急磁盘告警以珊瑚高亮破出——从总览到行动全程单屏无折返。",
  },
  C: {
    id: "C",
    correct: false,
    shortVar: "变量偏差：信号色滥用",
    title: "方案 C：信号色失控——正常卡片与紧急告警同亮抢焦",
    body: "方案 C 的倒金字塔顺序和 4 张 KPI 数量都对，但四张健康指标卡、趋势图与底部告警全部使用高饱和强高亮色。前注意视觉通道被占满，真正危急的「磁盘不足」告警淹没在一片炫光里。",
  },
  D: {
    id: "D",
    correct: false,
    shortVar: "变量偏差：指标过载与裸数",
    title: "方案 D：顶行硬塞 8 张裸数窄卡，把告警区挤出首屏折叠线",
    body: "方案 D 的方向和异常色本身正确，但顶行堆入 8 张没有迷你趋势的窄数字卡，既无法一眼判断好坏，又吃掉大半首屏高度，把最关键的底部告警区直接挤到需要滚动才能看见的折叠线之下。",
  },
};
