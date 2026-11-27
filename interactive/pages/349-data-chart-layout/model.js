// 349 数据图表页 · 单真源数据与诊断模型
// 所有画面几何、谎言因子、重点数据 KPI、五项教学笔记与三项原则探针全部由此模块同一份数据算出。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 季度销售",
    short: "季度销售",
    unit: "万元",
    yAxisTitle: "销售额（万元）",
    yMaxDefault: 600,
    maxBase: 200,
    quarters: ["Q1", "Q2", "Q3", "Q4"],
    actual: [210, 320, 420, 580],
    target: [220, 300, 380, 480],
    topicTitle: "2024 年度各季度销售额统计图表",
    topicSub: "展示四个季度实际销售额与目标额的汇总记录。",
    posterTitle: "Q2–Q4 连续增长，Q4 达到全年峰值",
    posterSub: "下半年增长势头强劲，为下一阶段目标奠定基础。",
    posterAnno: "Q4 实际值超出目标 100 万元，创全年新高。",
    verboseAnno:
      "根据财务部第四季度结算台账，华东与华南渠道在十一与双十一促销节点叠加发力，推动第四季度实际营收达到 580 万元，较原定预算目标高出 100 万元，刷新全年单季销售纪录并拉动全年总达成超预期。",
    seriesNames: ["实际值", "目标值"],
  },
  saas: {
    id: "saas",
    label: "SaaS · 季度留存",
    short: "季度留存",
    unit: "万户",
    yAxisTitle: "付费留存用户（万户）",
    yMaxDefault: 300,
    maxBase: 90,
    quarters: ["Q1", "Q2", "Q3", "Q4"],
    actual: [108, 146, 198, 264],
    target: [115, 140, 180, 220],
    topicTitle: "2024 年度付费留存用户季度数据汇总",
    topicSub: "按季度罗列订阅留存用户与年度规划基准线。",
    posterTitle: "Q2–Q4 留存连续攀升，Q4 达 264 万户峰值",
    posterSub: "引导体验改版后下半年留存拉升，超目标 20%。",
    posterAnno: "Q4 留存超出目标 44 万户，创全年新高。",
    verboseAnno:
      "新用户首周引导与团队协作模板上线后，核心订阅客户续费意愿显著提升，第四季度期末留存付费用户数攀升至 264 万户，超出季度目标 44 万户，同时带动高客单价企业版续约率同步走强。",
    seriesNames: ["实际留存", "目标留存"],
  },
  retail: {
    id: "retail",
    label: "门店 · 复购营收",
    short: "门店复购",
    unit: "万元",
    yAxisTitle: "会员复购营收（万元）",
    yMaxDefault: 450,
    maxBase: 140,
    quarters: ["Q1", "Q2", "Q3", "Q4"],
    actual: [155, 225, 305, 410],
    target: [165, 215, 280, 350],
    topicTitle: "年度线下门店会员复购营收统计表",
    topicSub: "记录各季度会员复购实际流水与预算指标。",
    posterTitle: "下半年复购加速，Q4 突破 410 万元峰值",
    posterSub: "会员季卡带动 Q2–Q4 连续超标，Q4 达成率 117%。",
    posterAnno: "Q4 复购超出目标 60 万元，刷新单季纪录。",
    verboseAnno:
      "随着秋季上新联名与积分换购规则落地，全国核心商圈门店老客月均到店频次提高，第四季度会员复购营收达到 410 万元，高于原定 350 万元考核线 60 万元，成为全年利润增长主引擎。",
    seriesNames: ["实际复购", "目标复购"],
  },
};

export const CHART_TYPES = [
  { id: "bar", label: "分组柱状", desc: "同基线比高度" },
  { id: "line", label: "双线趋势", desc: "斜率看增速" },
  { id: "pie", label: "饼图(误用)", desc: "角度难比双序列" },
  { id: "bar3d", label: "3D柱(误用)", desc: "透视错位读数" },
];

export const PALETTE_MODES = [
  { id: "poster", label: "原海报蓝红" },
  { id: "focus", label: "灰蓝聚焦" },
  { id: "rainbow", label: "8色彩虹" },
];

export function cloneValues(sc) {
  return {
    actual: [...sc.actual],
    target: [...sc.target],
  };
}

// 开场默认：刻意停在 0/5 灾难初稿（绝不预给答案）
export function createBrokenState(scenarioId = "poster") {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  return {
    scenario: sc.id,
    actual: [...sc.actual],
    target: [...sc.target],
    chartType: "bar",
    yBase: Math.round(sc.maxBase * 0.8), // 160 for poster -> 谎言因子 ~3.5x
    clutter: "heavy", // 重网格 + 底图例 + 阴影 + 无直标
    paletteMode: "rainbow", // 8 色彩虹失焦
    titleMode: "topic", // 空壳名词标题
    annoMode: "none", // 缺少峰值标注
    showTarget: false, // 隐藏目标对照基准
    kpiMode: "overload", // 6 张两位小数杂卡
    scanActive: false,
    scanT: 0,
    selectedBar: null,
  };
}

export function applyPreset(state, presetId) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const resetVals = cloneValues(sc);
  switch (presetId) {
    case "broken":
      return createBrokenState(sc.id);
    case "poster": // 合法解 1：原海报蓝红对比典范解
      return {
        ...state,
        ...resetVals,
        chartType: "bar",
        yBase: 0,
        clutter: "clean",
        paletteMode: "poster",
        titleMode: "action",
        annoMode: "live",
        showTarget: true,
        kpiMode: "clean",
      };
    case "focus": // 合法解 2：Knaflic 灰蓝单峰聚焦解
      return {
        ...state,
        ...resetVals,
        chartType: "bar",
        yBase: 0,
        clutter: "clean",
        paletteMode: "focus",
        titleMode: "action",
        annoMode: "live",
        showTarget: true,
        kpiMode: "clean",
      };
    case "line": // 合法解 3：双折线趋势增速解
      return {
        ...state,
        ...resetVals,
        chartType: "line",
        yBase: 0,
        clutter: "clean",
        paletteMode: "poster",
        titleMode: "action",
        annoMode: "live",
        showTarget: true,
        kpiMode: "clean",
      };
    case "minimal": // 合法解 4：极简无副卡高层解
      return {
        ...state,
        ...resetVals,
        chartType: "bar",
        yBase: 0,
        clutter: "clean",
        paletteMode: "focus",
        titleMode: "action",
        annoMode: "live",
        showTarget: true,
        kpiMode: "minimal",
      };
    // 反向试错快钮：专测各类玩错状态
    case "yTrunc":
      return {
        ...applyPreset(state, "poster"),
        yBase: Math.round(sc.maxBase * 0.85),
      };
    case "pieTrap":
      return {
        ...applyPreset(state, "poster"),
        chartType: "pie",
      };
    case "yoyTrap":
      return {
        ...applyPreset(state, "poster"),
        kpiMode: "posterBug",
      };
    case "contradict": {
      const s = applyPreset(state, "poster");
      const a = [...s.actual];
      a[3] = Math.round(s.actual[1] * 0.95); // 把 Q4 压低，令原结论「Q4 达到全年峰值」穿帮
      return {
        ...s,
        actual: a,
        titleMode: "action", // 保持静态旧结论
        annoMode: "poster", // 保持静态旧标注
      };
    }
    default:
      return state;
  }
}

export function computeYMax(actual, target, sc) {
  const peak = Math.max(...actual, ...target, sc.yMaxDefault * 0.75);
  const step = sc.yMaxDefault <= 300 ? 50 : 100;
  return Math.max(sc.yMaxDefault, Math.ceil((peak * 1.02) / step) * step);
}

// 根据实时数值自动生成诚实、与数据自洽的结论与标注
export function buildLiveCopy(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const a = state.actual;
  const t = state.target;
  const qs = sc.quarters;

  let peakIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] > a[peakIdx]) peakIdx = i;
    if (a[i] < a[minIdx]) minIdx = i;
  }
  const peakQ = qs[peakIdx];
  const peakVal = a[peakIdx];
  const peakTgt = t[peakIdx];
  const peakDiff = peakVal - peakTgt;
  const q4Prev = a[2] || 1;
  const qoqPct = Math.round(((a[3] - q4Prev) / q4Prev) * 100);
  const vsQ1Pct = Math.round(((a[3] - (a[0] || 1)) / (a[0] || 1)) * 100);
  const attainPct = Math.round((peakVal / (peakTgt || 1)) * 100);
  const isMonoQ2Q4 = a[1] > a[0] && a[2] > a[1] && a[3] > a[2];
  const matchesPosterStory = peakIdx === 3 && isMonoQ2Q4 && a[3] > t[3];

  let syncedTitle = "";
  let syncedSub = "";
  if (matchesPosterStory) {
    syncedTitle = sc.posterTitle;
    syncedSub = sc.posterSub;
  } else if (peakIdx === 3 && a[3] <= t[3]) {
    syncedTitle = `Q4 达全年最高 ${peakVal} ${sc.unit}，但仍低于目标 ${Math.abs(peakDiff)} ${sc.unit}`;
    syncedSub = `期末冲高未过目标线（达成率 ${attainPct}%），需复盘目标设定或 Q4 转化缺口。`;
  } else if (peakIdx !== 3 && a[3] < a[peakIdx]) {
    syncedTitle = `${peakQ} 见顶 ${peakVal} ${sc.unit}后，Q4 回落至 ${a[3]} ${sc.unit}`;
    syncedSub = `年末走势转弱，${a[3] >= t[3] ? `虽仍高于目标 ${a[3] - t[3]} ${sc.unit}` : `低于 Q4 目标 ${t[3] - a[3]} ${sc.unit}`}，需查明拐点原因。`;
  } else {
    syncedTitle = `${peakQ} 触及 ${peakVal} ${sc.unit}高点，各季波动明显`;
    syncedSub = `最高与最低季度相差 ${peakVal - a[minIdx]} ${sc.unit}，当前 ${peakQ} 目标达成率 ${attainPct}%。`;
  }

  let liveAnno = "";
  if (peakDiff > 0) {
    liveAnno = `${peakQ} 实际值超出目标 ${peakDiff} ${sc.unit}，创全年新高。`;
  } else if (peakDiff === 0) {
    liveAnno = `${peakQ} 实际值刚好踩中目标 ${peakTgt} ${sc.unit}，为全年高点。`;
  } else {
    liveAnno = `${peakQ} 虽为全年最高，但仍低于目标 ${Math.abs(peakDiff)} ${sc.unit}。`;
  }

  // 检查静态原海报标注是否与当前实数冲突
  const origDiff = sc.actual[3] - sc.target[3];
  const posterAnnoMatches = peakIdx === 3 && Math.abs(peakDiff - origDiff) <= 12 && peakDiff > 0;

  return {
    peakIdx,
    minIdx,
    peakQ,
    peakVal,
    peakTgt,
    peakDiff,
    qoqPct,
    vsQ1Pct,
    attainPct,
    isMonoQ2Q4,
    matchesPosterStory,
    posterAnnoMatches,
    syncedTitle,
    syncedSub,
    liveAnno,
  };
}

// 计算当前显示的标题文本与标注文本
export function getDisplayedText(state, live) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  let headline = sc.topicTitle;
  let subline = sc.topicSub;
  if (state.titleMode === "action") {
    headline = sc.posterTitle;
    subline = sc.posterSub;
  } else if (state.titleMode === "synced") {
    headline = live.syncedTitle;
    subline = live.syncedSub;
  }

  let annoText = "";
  if (state.annoMode === "poster") annoText = sc.posterAnno;
  else if (state.annoMode === "live") annoText = live.liveAnno;
  else if (state.annoMode === "verbose") annoText = sc.verboseAnno;

  return { headline, subline, annoText };
}

// 单真源全面诊断：所有错态、谎言因子、五项教学笔记与三原则状态全在此计算
export function evaluate(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const live = buildLiveCopy(state);
  const text = getDisplayedText(state, live);
  const yMax = computeYMax(state.actual, state.target, sc);

  const minActual = Math.min(...state.actual);
  const maxActual = Math.max(...state.actual);
  const trueRatio = maxActual / Math.max(1, minActual);
  const clampedBase = Math.min(state.yBase, Math.max(0, minActual - 18));
  const visMin = Math.max(8, minActual - clampedBase);
  const visMax = Math.max(visMin + 1, maxActual - clampedBase);
  const visualRatio = visMax / visMin;
  const lieFactor = state.chartType === "pie" ? 1 : visualRatio / Math.max(1, trueRatio);

  // 逐一检测 11 类错态
  const faults = [];

  // 1. 纵轴截断
  const yTruncBar = (state.chartType === "bar" || state.chartType === "bar3d") && state.yBase > 0;
  const yTruncLine = state.chartType === "line" && state.yBase > minActual * 0.55;
  if (yTruncBar || yTruncLine) {
    faults.push({
      id: "yTruncated",
      tag: `截断纵轴 ${lieFactor.toFixed(1)}×`,
      short: `纵轴从 ${state.yBase} 起`,
      title: `纵轴从 ${state.yBase} 起截断，柱高把 ${trueRatio.toFixed(2)}× 真差距夸大成 ${visualRatio.toFixed(1)}×`,
      why: `柱状图靠「从零起算的长度」编码数值。截掉下方 ${state.yBase} ${sc.unit}后，Tufte 谎言因子飙到 ${lieFactor.toFixed(1)}×，最短柱被压扁成细条，观众会误判全年暴涨。`,
      fix: "在画布向左横拖把纵轴起点推回 0，或点画布上的红标「归零基线」。",
      axis: "chart",
    });
  }

  // 2. 饼图误用
  if (state.chartType === "pie") {
    faults.push({
      id: "chartWrongPie",
      tag: "饼图误用",
      short: "角度难比双序列",
      title: "用饼图装季度实际与目标对比，角度编码丢失趋势和差额",
      why: "Cleveland & McGill（1984）证明人眼判断扇区角度的误差远高于同基线柱高；而且饼图只能切一份 100% 占比，根本摆不下「实际 vs 目标」双序列。",
      fix: "切回「分组柱状」或「双线趋势」，让同刻度位置替观众做精准比较。",
      axis: "chart",
    });
  }

  // 3. 3D 透视柱误用
  if (state.chartType === "bar3d") {
    faults.push({
      id: "chart3dFake",
      tag: "3D 透视失真",
      short: "斜顶偏离刻度线",
      title: "3D 立体斜柱让柱顶偏离背后刻度线，视觉读数出现视差",
      why: "斜向拉伸出的顶面和侧面全是 Tufte 所说的「图表垃圾」：观者分不清该看前棱还是后棱，580 看起来像不到 550。",
      fix: "切回二维平面的「分组柱状」或「双线趋势」，把墨水还给数据本身。",
      axis: "chart",
    });
  }

  // 4. 视觉噪杂 / 彩虹失焦
  if (state.clutter === "heavy" || state.paletteMode === "rainbow") {
    const both = state.clutter === "heavy" && state.paletteMode === "rainbow";
    faults.push({
      id: "clutterHeavy",
      tag: both ? "重网+彩虹失焦" : state.paletteMode === "rainbow" ? "彩虹配色失焦" : "重网图例往返",
      short: both ? "图表垃圾超载" : state.paletteMode === "rainbow" ? "8色打架" : "缺直接数值",
      title: both
        ? "粗黑网格、8 色彩虹柱与远置底图例同时抢眼，数据反被淹没"
        : state.paletteMode === "rainbow"
        ? "每根柱子涂成不同饱和色，眼睛找不到哪一季才是重点"
        : "重网格笼罩且数字藏在轴线里，观众要反复抬头对图例",
      why: "演示页只有 3–5 秒扫读窗口。过多边框、粗网格与彩虹色都在消耗前注意资源，逼观众做「看色块→找图例→回柱子」的眼球往返。",
      fix: "点画布上的红标或下方「视觉去噪」切回极简直标，再选「原海报蓝红」或「灰蓝聚焦」。",
      axis: "clean",
    });
  }

  // 5. 空壳名词标题
  if (state.titleMode === "topic") {
    faults.push({
      id: "titleTopic",
      tag: "空壳标题",
      short: "只写题材没给观点",
      title: `标题只写了「${sc.topicTitle}」，观众得自己花十秒找结论`,
      why: "名词性标题只交代了「画的是什么」，把提炼结论的脑力甩给了听众。后排听众还没看完四根柱子，你已经讲到下一页了。",
      fix: "直接点击顶部「结论」栏，把空壳标题改成「结论先行」的完整判断句。",
      axis: "title",
    });
  }

  // 6. 结论与当前柱高数据自相矛盾
  if (state.titleMode === "action" && !live.matchesPosterStory) {
    faults.push({
      id: "titleMismatch",
      tag: "结论与数据打架",
      short: "文字和柱高矛盾",
      title: `顶栏仍写着「${sc.posterTitle}」，但当前最高季已是 ${live.peakQ}（${live.peakVal} ${sc.unit}）`,
      why: "你刚才拖改了底层数据，旧结论瞬间失实！幻灯片最危险的事故不是图表丑，而是「标题讲 A、柱子画 B」，现场立刻失去可信度。",
      fix: "点顶栏「按实数同步结论」诚实改写标题，或把 Q4 蓝柱拖回高于 Q3 与目标线。",
      axis: "title",
    });
  }

  // 7. 标注缺席 / 密字 / 与实数脱节
  if (state.annoMode === "none") {
    faults.push({
      id: "annoMissing",
      tag: "缺少峰值标注",
      short: "峰值无解释引注",
      title: `最高点 ${live.peakQ}（${live.peakVal} ${sc.unit}）孤零零立着，没有标注点破原因或差额`,
      why: "光把柱子画高，听众还要自己心算「比目标多多少」。一则紧贴峰值的珊瑚虚线短标注，能把最关键的数字差额直接送到视线落点。",
      fix: "直接点击画布右侧的珊瑚虚线空框「+ 补上峰值标注」。",
      axis: "anno",
    });
  } else if (state.annoMode === "verbose") {
    faults.push({
      id: "annoVerbose",
      tag: "标注写成小作文",
      short: `${text.annoText.length} 字过载`,
      title: `标注塞进 ${text.annoText.length} 字长段落，把图边撑成密字墙`,
      why: "标注的职责是「一句点破关键变化或原因」（经验值 12–25 字），细节留给讲者口述；写满五六十字会让观众低头读字、不再看图。",
      fix: "点右侧珊瑚标注框，将长段精简为单句核心差额标注。",
      axis: "anno",
    });
  } else if (state.annoMode === "poster" && !live.posterAnnoMatches) {
    faults.push({
      id: "annoMismatch",
      tag: "标注数值穿帮",
      short: "差额与柱子不符",
      title: `标注还写着旧差额，但实算 ${live.peakQ} 与目标相差 ${live.peakDiff >= 0 ? "+" : ""}${live.peakDiff} ${sc.unit}`,
      why: "改数不改注是季度汇报最高频的穿帮现场：观众心算一秒就能拆穿。",
      fix: "点击画布右侧珊瑚标注框，立刻切换为「随实数同步」标注。",
      axis: "anno",
    });
  }

  // 8. 缺少对比基准
  if (!state.showTarget && state.chartType !== "pie") {
    faults.push({
      id: "noCompare",
      tag: "缺目标对比",
      short: "没有参照锚点",
      title: "只画了实际值，隐藏了目标对比基准，看不出算好还是算差",
      why: "孤立的 580 万元没有好坏之分——超出目标 100 万叫突破，若目标是 700 万则是失守。保留「实际 vs 目标」才能立住判断依据。",
      fix: "打开左侧图例里的「目标值对比」，让蓝红双柱形成参照。",
      axis: "compare",
    });
  }

  // 9. KPI 堆砌超载 或 原海报口径错标
  if (state.kpiMode === "overload") {
    faults.push({
      id: "kpiOverload",
      tag: "重点卡堆砌 6 项",
      short: "小数过多失焦",
      title: "底部硬塞 6 张两位小数指标卡，重点数据反而没人记得住",
      why: "「重点数据」区只提炼 2–3 个最硬的记忆点，并做合理取整；同时亮出 6 组小数会把幻灯片拖回 Excel 报表。",
      fix: "把底部重点数据切到「3 项聚焦」或高层专用的「精简无副卡」。",
      axis: "kpi",
    });
  } else if (state.kpiMode === "posterBug") {
    faults.push({
      id: "labelYoYTrap",
      tag: "口径错标(环比当同比)",
      short: "+38% 实为 Q4 vs Q3",
      title: `口径穿帮：+38% 是 Q4 比 Q3 的环比，却标成了「同比增长 Q4 vs Q1」`,
      why: `原海报此处有个真实的小笔误：(580−420)÷420 = +38.1%（环比 Q4 vs Q3），而 Q4 比 Q1 是 (580−210)÷210 = +176%，且「同比」必须和去年同期 Q4 相比。汇报前务必核对口径！`,
      fix: "点下方「修正口径为 3 项聚焦」，改回准确的「环比增长 +38%（Q4 vs Q3）」。",
      axis: "kpi",
    });
  }

  // 5 项教学笔记状态（完全由上述单真源故障反推，零硬编码）
  const has = (id) => faults.some((f) => f.id === id);
  const okChart = !has("yTruncated") && !has("chartWrongPie") && !has("chart3dFake");
  const okClean = !has("clutterHeavy");
  const okAnno = !has("annoMissing") && !has("annoVerbose") && !has("annoMismatch");
  const okTitle = !has("titleTopic") && !has("titleMismatch");
  const okCompareKpi = !has("noCompare") && !has("kpiOverload") && !has("labelYoYTrap");

  const score = [okChart, okClean, okAnno, okTitle, okCompareKpi].filter(Boolean).length;

  // 识别当前命中的合法解类型
  let solutionName = "";
  if (score === 5) {
    if (state.chartType === "line") solutionName = "双折线趋势增速解";
    else if (state.kpiMode === "minimal") solutionName = "极简高层无副卡解";
    else if (state.paletteMode === "focus") solutionName = "灰蓝单峰聚焦解";
    else solutionName = "原海报蓝红对比解";
  }

  // 估算数据墨水与扫读档位（严格按档位标注「示意」，不写假精确百分比）
  let inkTier = "低（噪声占主导 · 示意）";
  if (state.clutter === "clean" && state.paletteMode === "focus" && state.chartType !== "bar3d") {
    inkTier = "极高（聚焦克制 · 示意）";
  } else if (state.clutter === "clean" && state.paletteMode !== "rainbow" && state.chartType !== "bar3d") {
    inkTier = "高（清爽直读 · 示意）";
  } else if (state.clutter === "clean" || state.paletteMode !== "rainbow") {
    inkTier = "中（仍有视觉干扰 · 示意）";
  }

  let readTier = "视线迷路（示意）";
  if (score === 5) readTier = "3 秒直读（示意）";
  else if (has("yTruncated") || has("titleMismatch") || has("labelYoYTrap")) readTier = "存在误导风险（示意）";
  else if (score >= 3) readTier = "仍需二次解码（示意）";

  // 3 项原海报顶栏原则探针
  const principles = [
    {
      id: "chart",
      title: "图表为主体",
      desc: "让数据一眼被看见",
      ok: okChart && okClean,
      badge: !okChart
        ? has("yTruncated")
          ? `截断 ${lieFactor.toFixed(1)}×`
          : has("chartWrongPie")
          ? "饼图误用"
          : "3D失真"
        : !okClean
        ? "噪杂失焦"
        : state.chartType === "line"
        ? "双线清晰"
        : "0基线清晰",
    },
    {
      id: "anno",
      title: "标注作解释",
      desc: "用简短文字补充信息",
      ok: okAnno,
      badge: has("annoMissing")
        ? "缺峰值注"
        : has("annoVerbose")
        ? `${text.annoText.length}字过长`
        : has("annoMismatch")
        ? "差额穿帮"
        : "紧贴峰值",
    },
    {
      id: "title",
      title: "结论先行",
      desc: "让观点引导理解",
      ok: okTitle,
      badge: has("titleTopic") ? "空壳标题" : has("titleMismatch") ? "与数打架" : "观点自洽",
    },
  ];

  // 5 项原海报底部「教学笔记」实时探针
  const notes = [
    {
      id: "n-chart",
      title: "图表",
      body: "选择最能表达趋势的图表类型",
      ok: okChart && okClean,
      status: okChart && okClean ? "适型干净" : !okChart ? "失真/误型" : "噪杂失焦",
    },
    {
      id: "n-anno",
      title: "标注",
      body: "用简短文字解释关键变化或原因",
      ok: okAnno,
      status: okAnno ? "直指峰值" : has("annoMissing") ? "尚未标注" : has("annoVerbose") ? "过长密字" : "数值穿帮",
    },
    {
      id: "n-title",
      title: "结论",
      body: "先给出核心观点再展示数据",
      ok: okTitle,
      status: okTitle ? "结论先行" : has("titleTopic") ? "空壳名词" : "与数矛盾",
    },
    {
      id: "n-compare",
      title: "对比",
      body: "实际值 vs 目标值增强信息对比",
      ok: !has("noCompare") && !has("chartWrongPie"),
      status: !has("noCompare") && !has("chartWrongPie") ? "双序对照" : "缺对照锚",
    },
    {
      id: "n-kpi",
      title: "重点数据",
      body: "提炼关键指标强化记忆点",
      ok: !has("kpiOverload") && !has("labelYoYTrap"),
      status: !has("kpiOverload") && !has("labelYoYTrap")
        ? state.kpiMode === "minimal"
          ? "极简留白"
          : "3项聚焦"
        : has("labelYoYTrap")
        ? "口径错标"
        : "6卡超载",
    },
  ];

  // 重点数据 KPI（完全从当前 actual / target 实时算）
  const q4Actual = state.actual[3];
  const q4Target = state.target[3];
  const q4Attain = Math.round((q4Actual / Math.max(1, q4Target)) * 100);
  const sumActual = state.actual.reduce((a, b) => a + b, 0);
  const sumTarget = state.target.reduce((a, b) => a + b, 0);
  const fullAttain = ((sumActual / Math.max(1, sumTarget)) * 100).toFixed(2);
  const avgActual = (sumActual / 4).toFixed(2);

  let kpis = [];
  if (state.kpiMode === "clean") {
    kpis = [
      {
        tone: "blue",
        icon: "trend",
        label: "环比增长",
        value: `${live.qoqPct >= 0 ? "+" : ""}${live.qoqPct}%`,
        sub: "Q4 vs Q3",
      },
      {
        tone: "coral",
        icon: "peak",
        label: "最高季度",
        value: live.peakQ,
        sub: `${live.peakVal} ${sc.unit}`,
      },
      {
        tone: "blue",
        icon: "target",
        label: "目标达成率",
        value: `${q4Attain}%`,
        sub: "Q4 实际 / 目标",
      },
    ];
  } else if (state.kpiMode === "posterBug") {
    kpis = [
      {
        tone: "alert",
        icon: "trend",
        label: "同比增长 ⚠",
        value: `${live.qoqPct >= 0 ? "+" : ""}${live.qoqPct}%`,
        sub: "Q4 vs Q1（口径错）",
      },
      {
        tone: "coral",
        icon: "peak",
        label: "最高季度",
        value: live.peakQ,
        sub: `${live.peakVal} ${sc.unit}`,
      },
      {
        tone: "blue",
        icon: "target",
        label: "目标达成率",
        value: `${q4Attain}%`,
        sub: "Q4 实际 / 目标",
      },
    ];
  } else if (state.kpiMode === "overload") {
    kpis = [
      { tone: "muted", label: "Q4环比", value: `${((state.actual[3] - state.actual[2]) / Math.max(1, state.actual[2]) * 100).toFixed(2)}%`, sub: "vs Q3" },
      { tone: "muted", label: "Q4较Q1", value: `${((state.actual[3] - state.actual[0]) / Math.max(1, state.actual[0]) * 100).toFixed(2)}%`, sub: "跨三季" },
      { tone: "muted", label: "全年合计", value: `${sumActual.toFixed(2)}`, sub: sc.unit },
      { tone: "muted", label: "季均实绩", value: `${avgActual}`, sub: sc.unit },
      { tone: "muted", label: "全年达成", value: `${fullAttain}%`, sub: "累计/目标" },
      { tone: "muted", label: "Q4超额", value: `${(q4Actual - q4Target).toFixed(2)}`, sub: sc.unit },
    ];
  }

  return {
    sc,
    live,
    text,
    yMax,
    trueRatio,
    visualRatio,
    lieFactor,
    faults,
    primaryFault: faults[0] || null,
    score,
    solutionName,
    inkTier,
    readTier,
    principles,
    notes,
    kpis,
    okChart,
    okClean,
    okAnno,
    okTitle,
    okCompareKpi,
  };
}
