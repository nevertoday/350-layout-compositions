// No. 274 数据表格布局 —— 单一数据与诊断真源（model.js）
// 开场活体账簿、Canvas 光学标尺、3×3 矩阵徽章与底部四柱验收条全部由此算出。

export const POSTER_ITEMS = [
  {
    id: "elec",
    name: "消费电子",
    en: "CONSUMER ELEC.",
    icon: "bag",
    q1: 1280,
    q2: 1560,
    qoq: 21.9,
    posterShare: 28.4,
    realShare: 30.8,
    achieve: 104,
    messyQ1: "1280",
    messyQ2: "1,560.0",
    messyQoq: "21.9%",
    messyAchieve: "104.0%",
    noiseQ1: "1,280.0042",
    noiseQ2: "1,560.0018",
    noiseQoq: "+21.8750%",
    noiseAchieve: "104.00%",
  },
  {
    id: "home",
    name: "家居生活",
    en: "HOME & LIVING",
    icon: "sofa",
    q1: 980,
    q2: 1120,
    qoq: 14.3,
    posterShare: 20.4,
    realShare: 22.1,
    achieve: 96,
    messyQ1: "980.00",
    messyQ2: "1120",
    messyQoq: "+14.29%",
    messyAchieve: "96%",
    noiseQ1: "980.0000",
    noiseQ2: "1,120.0005",
    noiseQoq: "+14.2857%",
    noiseAchieve: "96.00%",
  },
  {
    id: "apparel",
    name: "服饰箱包",
    en: "APPAREL & BAGS",
    icon: "shirt",
    q1: 860,
    q2: 910,
    qoq: 5.8,
    posterShare: 16.6,
    realShare: 18.0,
    achieve: 91,
    messyQ1: "860",
    messyQ2: "910.0",
    messyQoq: "+5.81%",
    messyAchieve: "91.0%",
    noiseQ1: "860.0000",
    noiseQ2: "910.0000",
    noiseQoq: "+5.8140%",
    noiseAchieve: "91.00%",
  },
  {
    id: "sports",
    name: "运动户外",
    en: "SPORTS & OUTDOOR",
    icon: "dumbbell",
    q1: 720,
    q2: 860,
    qoq: 19.4,
    posterShare: 15.7,
    realShare: 17.0,
    achieve: 110,
    messyQ1: "720.0",
    messyQ2: "860",
    messyQoq: "19.44%",
    messyAchieve: "110%",
    noiseQ1: "720.0000",
    noiseQ2: "860.0000",
    noiseQoq: "+19.4444%",
    noiseAchieve: "110.00%",
  },
  {
    id: "beauty",
    name: "美妆个护",
    en: "BEAUTY & CARE",
    icon: "bottle",
    q1: 560,
    q2: 610,
    qoq: 8.9,
    posterShare: 11.1,
    realShare: 12.1,
    achieve: 87,
    messyQ1: "560",
    messyQ2: "610.00",
    messyQoq: "+8.9%",
    messyAchieve: "87.0%",
    noiseQ1: "560.0000",
    noiseQ2: "610.0000",
    noiseQoq: "+8.9286%",
    noiseAchieve: "87.00%",
  },
];

export const TOTAL_ROW = {
  id: "total",
  name: "合计",
  en: "TOTAL",
  q1: 4400,
  q2: 5060,
  qoq: 15.0,
  posterShareSum: 92.2,
  claimedShare: 100.0,
  achieve: 98,
  messyQ1: "4400",
  messyQ2: "5,060.0",
  messyQoq: "15%",
  messyAchieve: "98%",
  noiseQ1: "4,400.0042",
  noiseQ2: "5,060.0023",
  noiseQoq: "+15.0000%",
  noiseAchieve: "98.00%",
};

// 开场错态顺序（乱序，且合计被硬塞在第 3 行）
export const SCRAMBLED_IDS = ["sports", "beauty", "elec", "apparel", "home"];

export const COLUMNS = [
  { key: "item", label: "项目", en: "ITEM", type: "text", sortable: false },
  { key: "q1", label: "Q1 销售额", en: "SALES (Q1)", type: "num", sortable: true },
  { key: "q2", label: "Q2 销售额", en: "SALES (Q2)", type: "num", sortable: true },
  { key: "qoq", label: "环比增长", en: "GROWTH (QoQ)", type: "num", sortable: true },
  { key: "share", label: "占比", en: "SHARE", type: "share", sortable: true },
  { key: "achieve", label: "目标达成", en: "ACHIEVEMENT", type: "num", sortable: true },
];

// 开场 0/4 翻车错态：绝不提前给出答案
export function createBrokenState() {
  return {
    colSplit: 0.14,          // 第一列占比（0.10–0.46）：0.14 过窄易挤，0.21–0.31 为舒适经验区，>0.36 拉出过宽白河
    gridMode: "cage",        // "cage" 全黑牢笼 | "hairline" 清透横线（最佳） | "none" 全无界线
    totalMode: "mixed",      // "mixed" 混入数据行中 | "footer" 独立置底汇总（最佳）
    alignMode: "left",       // "left" 全左对齐 | "center" 全居中 | "semantic" 左文右数（最佳）
    tabular: false,          // false 比例数字 | true 等宽数字 tabular-nums（最佳）
    sortKey: "none",         // "none" 乱序 | "q1" | "q2" | "qoq" | "share" | "achieve"
    sortDir: "desc",         // "desc" | "asc"
    spotlight: "none",       // "none" 无重点 | "qoq" 单列聚焦环比 | "q2" 单列聚焦Q2 | "achieve" 单列聚焦达成 | "all" 全表涂色失焦
    inlineBars: false,       // false 裸数字 | true 占比内嵌进度条
    formatMode: "messy",     // "messy" 位数杂乱且92.2%未平账 | "noise" 4位小数噪音 | "clean" 统一千分位与100.0%平账
  };
}

export function formatCell(row, colKey, formatMode, isTotal = false) {
  const numFmt = (n) => n.toLocaleString("en-US");
  if (colKey === "q1") {
    if (formatMode === "messy") return row.messyQ1;
    if (formatMode === "noise") return row.noiseQ1;
    return numFmt(row.q1);
  }
  if (colKey === "q2") {
    if (formatMode === "messy") return row.messyQ2;
    if (formatMode === "noise") return row.noiseQ2;
    return numFmt(row.q2);
  }
  if (colKey === "qoq") {
    if (formatMode === "messy") return row.messyQoq;
    if (formatMode === "noise") return row.noiseQoq;
    return `+${row.qoq.toFixed(1)}%`;
  }
  if (colKey === "share") {
    if (isTotal) return `${row.claimedShare.toFixed(1)}%`;
    if (formatMode === "clean") return `${row.realShare.toFixed(1)}%`;
    if (formatMode === "noise") return `${row.realShare.toFixed(3)}%`;
    return `${row.posterShare.toFixed(1)}%`;
  }
  if (colKey === "achieve") {
    if (formatMode === "messy") return row.messyAchieve;
    if (formatMode === "noise") return row.noiseAchieve;
    return `${row.achieve}%`;
  }
  return "";
}

export function shareValue(row, formatMode, isTotal = false) {
  if (isTotal) return 100;
  return formatMode === "messy" ? row.posterShare : row.realShare;
}

export function getOrderedRows(state) {
  let items = SCRAMBLED_IDS.map((id) => POSTER_ITEMS.find((r) => r.id === id));
  if (state.sortKey !== "none") {
    const dir = state.sortDir === "asc" ? 1 : -1;
    const keyMap = { q1: "q1", q2: "q2", qoq: "qoq", share: state.formatMode === "messy" ? "posterShare" : "realShare", achieve: "achieve" };
    const field = keyMap[state.sortKey] || "q2";
    items = [...POSTER_ITEMS].sort((a, b) => (a[field] - b[field]) * dir);
  }
  if (state.totalMode === "mixed") {
    const mixed = [...items];
    mixed.splice(2, 0, { ...TOTAL_ROW, isTotal: true });
    return { bodyRows: mixed, footerRow: null };
  }
  return { bodyRows: items, footerRow: { ...TOTAL_ROW, isTotal: true } };
}

// 经验列宽分配（由 colSplit 统一驱动 6 列比例，确保单真源）
export function computeColumnPercents(colSplit) {
  const first = Math.round(colSplit * 1000) / 10; // e.g. 14.0% - 46.0%
  const rem = Math.max(40, 100 - first);
  // 其余 5 列按内容体量分配：Q1 17%, Q2 17%, 环比 20%, 占比 27%, 达成 19%
  const weights = [0.175, 0.175, 0.205, 0.26, 0.185];
  const rest = weights.map((w) => Math.round(rem * w * 10) / 10);
  const sum = first + rest.reduce((a, b) => a + b, 0);
  rest[3] = Math.round((rest[3] + (100 - sum)) * 10) / 10;
  return [first, ...rest];
}

// 核心诊断函数：结合 state 与实测 DOM 几何（位值偏移 Δpx、表格跨距、折行挤压）
export function evaluateLedger(state, dom = {}) {
  const axisDriftPx = Number.isFinite(dom.axisDriftPx)
    ? dom.axisDriftPx
    : state.alignMode === "semantic"
      ? (state.tabular ? 0 : 4.2)
      : state.alignMode === "center"
        ? 11.4
        : 17.8;

  const spanPx = Number.isFinite(dom.spanPx) ? dom.spanPx : Math.round(620 + (state.colSplit - 0.25) * 400);
  const squeezed = state.colSplit < 0.19;
  const river = state.colSplit > 0.35;

  // 1. 结构 STRUCTURE：合计置底 + 横细线（不能牢笼黑框，不能全无导轨）+ 列宽在舒适带（不压扁也不拉白河）
  const structIssues = [];
  if (state.totalMode === "mixed") structIssues.push("「合计」混在数据行第 3 位，汇总值与单品类同格竞争");
  if (state.gridMode === "cage") structIssues.push("全黑牢笼网格墨水过重，方框线条比数字更抢眼");
  if (state.gridMode === "none") structIssues.push("撤掉了全部水平导轨，长行横向扫视容易串行");
  if (squeezed) structIssues.push(`首列仅占 ${Math.round(state.colSplit * 100)}%（经验舒适带 20%–34%），品类标与右侧列开始挤压`);
  if (river) structIssues.push(`首列拉宽到 ${Math.round(state.colSplit * 100)}%（超出 34%），中间拉出过宽「白河」，扫向右侧容易丢行`);
  const structureOk = structIssues.length === 0;

  // 2. 对齐 ALIGN：左文右数 + 等宽数字 tabular-nums
  const alignIssues = [];
  if (state.alignMode === "left") {
    alignIssues.push("数值左对齐让 980 的「9」对在 1,280 的「1」下方，千位与百位错位，一眼容易把百位误判成千位");
  } else if (state.alignMode === "center") {
    alignIssues.push("全居中模仿了海报装饰对称，但数字个位与小数点呈锯齿晃动，实务扫视难以逐位比大小");
  }
  if (!state.tabular) {
    alignIssues.push("未开启等宽数字（tabular-nums），数字「1」窄于「8」，纵列小数点与逗号仍有像素级微漂");
  }
  const alignOk = alignIssues.length === 0;

  // 3. 比较 COMPARE：行按指标排序 + 克制的单列焦点高亮（不能无重点，也不能全表涂色）+ 开启占比内嵌条
  const compareIssues = [];
  if (state.sortKey === "none") compareIssues.push("行序处于任意乱排状态，看不出谁领跑、谁垫底");
  if (state.spotlight === "none") compareIssues.push("六列表头灰平无重点，读者进表后不知道优先比较哪一列");
  if (state.spotlight === "all") compareIssues.push("六列全都涂色强调，等于没有重点，差异被重新抹平");
  if (!state.inlineBars) compareIssues.push("「占比」只有裸数字，缺少内嵌迷你条把数量关系直接译成长度");
  const compareOk = compareIssues.length === 0;

  // 4. 精准 PRECISE：格式统一且平账 100.0%（不能杂乱、不能 4 位小数噪音）
  const preciseIssues = [];
  const shareSum = state.formatMode === "messy" ? TOTAL_ROW.posterShareSum : 100.0;
  if (state.formatMode === "messy") {
    preciseIssues.push(`数值千分位与小数位混杂，且 5 项占比相加仅 ${shareSum.toFixed(1)}% ≠ 合计 100.0%（差 7.8%）`);
  } else if (state.formatMode === "noise") {
    preciseIssues.push("保留 4 位冗余小数，大量无效尾数占满短时记忆，淹没了有效量级差异");
  }
  const preciseOk = preciseIssues.length === 0;

  const pillars = {
    structure: {
      key: "structure",
      title: "结构",
      en: "STRUCTURE",
      ok: structureOk,
      status: structureOk
        ? "清透横线 · 合计置底"
        : state.totalMode === "mixed"
          ? "合计混入行中"
          : state.gridMode === "cage"
            ? "牢笼黑框过重"
            : state.gridMode === "none"
              ? "缺水平导轨"
              : squeezed
                ? "首列过窄挤断"
                : "白河过宽易串行",
    },
    align: {
      key: "align",
      title: "对齐",
      en: "ALIGN",
      ok: alignOk,
      status: alignOk
        ? (axisDriftPx > 1.5
            ? `已右齐等宽 · 混小数致偏 ${axisDriftPx.toFixed(0)}px`
            : `轴偏 ${axisDriftPx.toFixed(1)}px · 位值锁直`)
        : state.alignMode === "left"
          ? "左齐错位量级"
          : state.alignMode === "center"
            ? "居中锯齿漂移"
            : "缺等宽数字",
    },
    compare: {
      key: "compare",
      title: "比较",
      en: "COMPARE",
      ok: compareOk,
      status: compareOk
        ? "有序 · 单列聚焦"
        : state.spotlight === "all"
          ? "全表高亮失焦"
          : state.sortKey === "none"
            ? "乱序无梯度"
            : state.spotlight === "none"
              ? "缺单列焦点"
              : "缺内嵌占比条",
    },
    precise: {
      key: "precise",
      title: "精准",
      en: "PRECISE",
      ok: preciseOk,
      status: preciseOk
        ? "格式统一 · 100.0% 平账"
        : state.formatMode === "noise"
          ? "4 位小数噪音"
          : `未平账 ${shareSum.toFixed(1)}%`,
    },
  };

  const passCount = [structureOk, alignOk, compareOk, preciseOk].filter(Boolean).length;

  // 优先级最高的诊断结论与可操作提示（讲清「为什么」而不只是报数）
  let badge = `${passCount} / 4`;
  let tone = passCount === 4 ? "pass" : "fail";
  let tag = passCount === 4 ? "4/4 校准达标" : `${passCount}/4 待校准`;
  let headline = "";
  let why = "";
  let hint = "";

  if (passCount === 4) {
    const colObj = COLUMNS.find((c) => c.key === state.sortKey);
    const spotObj = COLUMNS.find((c) => c.key === state.spotlight);
    headline = "四柱全部咬合：眼睛一秒就能从左扫到右、从上比到下";
    why = `当前按「${colObj?.label || "指标"}」排序并以深海军蓝聚焦「${spotObj?.label || "核心列"}」，数字右对齐且位值轴偏移仅 ${axisDriftPx.toFixed(1)}px，千分位与 100.0% 占比全部自洽，复杂表格从「逐字抄读」变成了「一眼直判」。`;
    hint = "试着故意把「对齐」切回「全居中」、把「焦点列」切到「全表涂色」或把列宽滑尺拖到两端，体验反例如何立刻瓦解可读性。";
  } else if (state.totalMode === "mixed") {
    tag = `${passCount}/4 结构失序`;
    headline = "「合计」被夹在第 3 行中间，汇总数正在冒充普通品类";
    why = "人眼习惯把相邻同类行当作并列样本；把 4,400 与 5,060 塞进数据体中段，会瞬间拉垮量级锚点，读者得反复辨认哪一行才是总账。";
    hint = "先把「合计位置」切到「独立置底」，再将「网格线」从全黑牢笼减为「清透横线」。";
  } else if (squeezed || river) {
    tag = `${passCount}/4 列宽失衡`;
    headline = squeezed
      ? `首列仅占 ${Math.round(state.colSplit * 100)}%，列宽过窄正在挤压文字与数值`
      : `首列拉宽到 ${Math.round(state.colSplit * 100)}%，中间「白河」太宽让人扫行失焦`;
    why = squeezed
      ? "品类名称与右侧数字几乎贴在一起，甚至迫使文字折行撑高行距，打断了齐整的水平扫视节拍。"
      : "第一列留出大片无意义空白后，眼睛从「消费电子」横跨到右侧「目标达成」的距离被拉长，极易串到上一行或下一行。";
    hint = "左右拖动表顶的翡翠色「列宽游标」，把首列比例推回 20%–34% 经验舒适带。";
  } else if (state.gridMode !== "hairline") {
    tag = `${passCount}/4 线框干扰`;
    headline = state.gridMode === "cage"
      ? "全黑粗网格框住了每个数字，线比数据更抢眼"
      : "完全撤掉水平横线后，眼睛横跨 6 列时失去了行轨锚点";
    why = state.gridMode === "cage"
      ? "按照 Edward Tufte 的数据墨水比原则，厚重竖框和外框不承载任何新信息，却持续制造视觉噪音。"
      : "极简不等于零线条；当列数达到 5 列以上时，极浅的水平细线能稳稳托住横向扫视。";
    hint = "把「网格线」切到「清透横线」，只保留承托横向扫视的浅细线。";
  } else if (!alignOk) {
    tag = `${passCount}/4 对齐偏移`;
    headline = state.alignMode === "left"
      ? `数值左对齐导致千位与百位错位（实测位值轴偏 ${axisDriftPx.toFixed(1)}px）`
      : state.alignMode === "center"
        ? `数值居中让小数点左右锯齿漂移（实测位值轴偏 ${axisDriftPx.toFixed(1)}px）`
        : `数字虽已右对齐，但比例字形仍造成 ${axisDriftPx.toFixed(1)}px 细微错位`;
    why = state.alignMode === "left"
      ? "人脑比较数字大小是从个位、十位、百位自右向左判断的；左对齐会把 980 的 9 顶在 1,280 的 1 下面，产生「980 更大」的瞬间错觉。"
      : state.alignMode === "center"
        ? "原海报为画面对称把数字居中，但真实产品表格里，不同位数居中后个位不再同轴，纵向扫视速度会明显下降。"
        : "比例数字里「1」比「8」窄得多，即使右边缘齐了，千位逗号与小数点依然上下错开。";
    hint = state.alignMode !== "semantic"
      ? "将「对齐方式」切到「左文右数」，并开启「等宽数字 tabular-nums」锁直垂直位值轴。"
      : "开启「等宽数字 tabular-nums」，观察蓝色/绿色垂直轴线瞬间拉直。";
  } else if (!compareOk) {
    tag = `${passCount}/4 比较失焦`;
    headline = state.spotlight === "all"
      ? "六列全部涂色高亮，等于一列都没有突出"
      : state.sortKey === "none"
        ? "五条品类杂乱堆放，看不出增长梯队"
        : state.spotlight === "none"
          ? "所有表头一律平权，读者找不到第一眼该比的列"
          : "占比列只剩纯数字，各品类的体量悬殊不够直观";
    why = state.spotlight === "all"
      ? "对比的本质是「稀缺强调」；原海报只把「环比增长」一列染成深海军蓝并铺淡薄荷底，才让这一列立刻跳出。"
      : state.sortKey === "none"
        ? "A. S. C. Ehrenberg 指出，只要把无序表格按核心指标降序排列，领跑者、断层与垫底者会不言自明。"
        : state.spotlight === "none"
          ? "当一张表同时呈现 5 个数值维度时，必须用深色表头与微底色点出业务最关心的比较维度。"
          : "人脑对长度的感知远快于对百分数的心算；在数字旁嵌一根同比例迷你条，体量差一目了然。";
    hint = state.sortKey === "none"
      ? "直接点击表格里任意数值列标题（如「环比增长」或「Q2 销售额」）完成排序。"
      : state.spotlight !== "qoq" && state.spotlight !== "q2" && state.spotlight !== "achieve"
        ? "在「焦点列」里选定唯一一列重点比较（如原海报的「环比增长」）。"
        : "打开「占比迷你条」，让百分数与长度编码同步呈现。";
  } else {
    tag = `${passCount}/4 精度失信`;
    headline = state.formatMode === "noise"
      ? "4 位小数制造了假精确，有效数字被尾数淹没"
      : "小数位杂乱，且 5 项占比之和 92.2% 与合计 100.0% 互相打架";
    why = state.formatMode === "noise"
      ? "Ehrenberg 的研究提醒我们：人类短时记忆难以在扫视中同时吞下 7–8 位数字，超出决策需要的尾数只会徒增负担。"
      : "这是 274 原海报里藏着的一个真实细节：五项占比相加只有 92.2%，总计却写着 100.0%。在真实财务/运营表里，哪怕一处不平账都会让读者怀疑整张表的可信度。";
    hint = "把「格式与口径」切到「统一千分位 · 100.0% 平账」，消除尾数噪音并让分项之和精确等于合计。";
  }

  // 数据墨水效率档位（明确标注为示意档位，杜绝假精确百分比）
  const inkTier = state.gridMode === "cage"
    ? "偏低（牢笼线抢戏·示意）"
    : state.gridMode === "none"
      ? "偏疏（缺横导轨·示意）"
      : state.formatMode === "noise"
        ? "偏低（尾数噪音·示意）"
        : state.spotlight === "all"
          ? "偏低（满铺色块·示意）"
          : "高信噪（清爽账簿·示意）";

  // 3×3 原海报矩阵徽章实时状态（9 格：前 8 格随四柱与列宽稳定度点亮，右上格为海军蓝焦点灯，右下格为达标后的原海报斜切三角）
  const sealCells = [
    structureOk,
    alignOk,
    state.spotlight !== "none" && state.spotlight !== "all", // top-right navy tile
    !squeezed && !river,
    state.gridMode === "hairline",
    state.sortKey !== "none",
    state.totalMode === "footer",
    preciseOk,
    passCount === 4, // bottom-right diagonal cut tile
  ];

  return {
    passCount,
    badge,
    tag,
    tone,
    headline,
    why,
    hint,
    pillars,
    axisDriftPx,
    spanPx,
    shareSum,
    inkTier,
    squeezed,
    river,
    sealCells,
  };
}

// ---------- Section 01：原海报四柱解剖与两处海报彩蛋 ----------
export const PILLAR_ANATOMY = [
  {
    id: "structure",
    no: "01",
    zh: "结构",
    en: "STRUCTURE",
    posterQuote: "行列清晰分组 · 层级关系明确",
    posterEn: "CLEAR GROUPING AND HIERARCHY",
    zone: "header-footer",
    plain: "一张表先分清三块地盘：顶部表头定义「比什么」，中部数据行放「同一层级的对象」，底部汇总行单独托住「总账」。用极浅的水平细线导引视线，而不是画满黑框把每个字关进牢笼。",
    detail: "反面错态：把合计行混在明细中间、或者给每个单元格套上 1px 深黑全框，眼睛就会在格子边缘反复碰撞。",
  },
  {
    id: "align",
    no: "02",
    zh: "对齐",
    en: "ALIGN",
    posterQuote: "统一对齐方式 · 提升浏览效率",
    posterEn: "UNIFIED ALIGNMENT IMPROVES SCANABILITY",
    zone: "numeric-axis",
    plain: "「统一」不是全表一律居中，而是按数据类型各守其轴：文字左对齐方便顺着左缘起读，数值右对齐配合等宽数字（tabular-nums）让个位与小数点上下咬死，表头跟随所在列一起对齐。",
    detail: "海报细看：274 原海报为了画面静态对称，把销售额与环比数字做成了居中对齐；做展示海报很齐整，但放进真实界面里建议改成右对齐，比大小快得多。",
  },
  {
    id: "compare",
    no: "03",
    zh: "比较",
    en: "COMPARE",
    posterQuote: "突出差异与趋势 · 强化可比信息",
    posterEn: "HIGHLIGHT DIFFERENCES AND TRENDS",
    zone: "spotlight-col",
    plain: "读者打开数据表通常带着明确问题：「谁涨得最快？谁没达标？」先按核心列排好序，再用唯一一列深海军蓝表头与淡薄荷底色聚焦关键指标，并在占比列嵌入同比例迷你条，把心算变成直觉。",
    detail: "克制红线：强调靠稀缺才有效。一页表格里焦点列最好不超过一列；一旦超过三列涂色，重点立刻失效。",
  },
  {
    id: "precise",
    no: "04",
    zh: "精准",
    en: "PRECISE",
    posterQuote: "数值、格式一致 · 传达更可靠",
    posterEn: "CONSISTENT FORMAT BUILDS TRUST",
    zone: "reconcile",
    plain: "同一列必须共享同一单位、千分位规则与小数位数，符号（+/-/%）统一写全，而且分项之和必须经得起验算。",
    detail: "海报细看：274 原海报里的 5 项占比（28.4% + 20.4% + 16.6% + 15.7% + 11.1%）相加其实是 92.2%，总计却印了 100.0%。正式产品里遇到这种缺口，必须补列「其他 7.8%」或按真实口径平账（30.8% / 22.1% / 18.0% / 17.0% / 12.1%）。",
  },
];

// ---------- Section 02：对齐与等宽数字微测 ----------
export const HUNT_ROUNDS = [
  {
    prompt: "请迅速点击数值最大的一行：",
    rows: [
      { label: "华东仓储中心", value: 988, text: "988.4" },
      { label: "华南分拨中心", value: 1118, text: "1,118.1" },
      { label: "西南直发仓", value: 896, text: "896.9" },
      { label: "华北枢纽仓", value: 1112, text: "1,112.8" },
      { label: "华中中转仓", value: 942, text: "942.5" },
      { label: "西北保税仓", value: 1094, text: "1,094.2" },
    ],
    answerIdx: 1,
  },
  {
    prompt: "再来一轮，点击数值最大的一行：",
    rows: [
      { label: "消费电子部", value: 994, text: "994.8" },
      { label: "家居生活部", value: 1105, text: "1,105.1" },
      { label: "服饰箱包部", value: 879, text: "879.6" },
      { label: "运动户外部", value: 1121, text: "1,121.4" },
      { label: "美妆个护部", value: 968, text: "968.2" },
      { label: "母婴玩具部", value: 1088, text: "1,088.9" },
    ],
    answerIdx: 3,
  },
];

// ---------- Section 03：五段去墨剥离器（Tufte & Ehrenberg） ----------
export const INK_STAGES = [
  {
    level: 1,
    name: "牢笼重表",
    en: "CAGE GRID · LOW SIGNAL",
    inkShare: "数据墨水偏低 · 线框占主角（示意）",
    ratioBar: 26,
    note: "全黑 1.5px 粗框把每个单元格封死，深灰斑马纹来回跳闪，每一格重复印着「万元」，数字保留 4 位小数——读者先看到一堵铁丝网，最后才看到数据。",
  },
  {
    level: 2,
    name: "拆掉竖框",
    en: "DROP VERTICAL BARS",
    inkShare: "数据墨水回升 · 空间分列（示意）",
    ratioBar: 48,
    note: "撤掉多余的竖向黑线与外围粗框。只要同一列对齐整齐，留白本身就能切出笔直的列边界，无需竖线加固。",
  },
  {
    level: 3,
    name: "单位上提表头",
    en: "LIFT REPEATED UNITS",
    inkShare: "重复墨水清零 · 行内减噪（示意）",
    ratioBar: 68,
    note: "去掉深色斑马纹，把每格重复出现的「万元」收进列标题「销售额（万元）」，并把网格减为低对比浅横线。",
  },
  {
    level: 4,
    name: "有效数字舍入",
    en: "EHRENBERG ROUNDING",
    inkShare: "短时记忆减负 · 主次清晰（示意）",
    ratioBar: 84,
    note: "遵照 A. S. C. Ehrenberg（1977）的建议，舍去不影响决策的尾部小数（如 1,560.0018 → 1,560），眼睛一次就能比较量级。",
  },
  {
    level: 5,
    name: "清透账簿",
    en: "HIGH DATA-INK LEDGER",
    inkShare: "高信噪比 · 焦点一列破出（示意）",
    ratioBar: 94,
    note: "仅用一条深表头压阵、一条浅底突出「环比增长」与合计行，90% 以上的视觉墨水都在直接表达数据本身。",
  },
];

// ---------- Section 04：Jacques Bertin 可重排矩阵（6 品类 × 5 季/维） ----------
export const BERTIN_BASE = {
  rows: [
    { id: "r0", name: "服饰箱包", vals: [52, 64, 58, 49, 61] },
    { id: "r1", name: "消费电子", vals: [88, 94, 91, 96, 85] },
    { id: "r2", name: "美妆个护", vals: [34, 41, 38, 44, 36] },
    { id: "r3", name: "运动户外", vals: [74, 82, 79, 86, 71] },
    { id: "r4", name: "家居生活", vals: [66, 72, 69, 75, 63] },
    { id: "r5", name: "生鲜日配", vals: [28, 35, 31, 39, 25] },
  ],
  cols: [
    { id: "c0", label: "留存" },
    { id: "c1", label: "复购" },
    { id: "c2", label: "毛利" },
    { id: "c3", label: "增速" },
    { id: "c4", label: "客单" },
  ],
};

// ---------- Section 05：历史谱系五代标本 ----------
export const HISTORY_ERAS = [
  {
    id: "1494",
    year: "1494",
    place: "威尼斯 · Venice",
    person: "Luca Pacioli（卢卡·帕乔利）",
    work: "《算术、几何、比及比例概要》（Summa de arithmetica）",
    summary: "书中《计算与记录详论》首次以印刷体系统记录了威尼斯商人的复式记账法：借贷分栏、同列纵排对齐、期末试算平衡——奠定了现代表格「行列结构 + 汇总校验」的基因。",
    styleClass: "era-1494",
    caption: "借贷对照手抄式账簿：严格纵列位值 + 底部试算平账",
  },
  {
    id: "1967",
    year: "1967",
    place: "巴黎 · Paris",
    person: "Jacques Bertin（雅克·贝尔坦）",
    work: "《图形符号学》（Sémiologie graphique）",
    summary: "贝尔坦打破了「表格印在纸上就一成不变」的观念，提出「可重排矩阵」：把数据译成面积或明度标记，通过物理滑杆重排行与列，让隐藏的聚类规律直接浮现。",
    styleClass: "era-1967",
    caption: "贝尔坦可重排矩阵：明度分级 + 重排行序显露对角梯队",
  },
  {
    id: "1977",
    year: "1977",
    place: "伦敦 · London",
    person: "A. S. C. Ehrenberg（安德鲁·埃伦伯格）",
    work: "《皇家统计学会期刊》论文 Rudiments of Numeracy",
    summary: "他直指人们看不懂表格不是读者「数盲」，而是制表者失职；并归纳出四条铁律：有效数字舍入、按数值大小排序、把要比较的数排成纵列而非横行、给出均值或合计锚点。",
    styleClass: "era-1977",
    caption: "埃伦伯格精简统计表：降序排列、适度舍入、纵列紧凑可比",
  },
  {
    id: "1979",
    year: "1979",
    place: "剑桥 · Massachusetts",
    person: "Dan Bricklin & Bob Frankston",
    work: "VisiCalc（Apple II 首个电子表格软件）",
    summary: "用 A1、B2 坐标网格把纸面账簿搬进屏幕，改动一格即可全表实时重算；行列布局从此成为亿万人日常处理复杂数字的通用工作台。",
    styleClass: "era-1979",
    caption: "VisiCalc 坐标栅格：A/B/C 列标 + 实时公式汇总 =SUM(B2:B6)",
  },
  {
    id: "modern",
    year: "1983–2012",
    place: "现代信息设计与 UI",
    person: "Edward Tufte · Stephen Few · NN/g",
    work: "《定量信息的视觉呈现》· Show Me the Numbers · NN/g 数据表研究",
    summary: "Tufte 提出「数据墨水比」删去多余网格，Few 定下「左文右数、表头随列、等宽数字」实务标准，Nielsen Norman Group 总结出查找、比较、编辑与批量操作四大界面任务。",
    styleClass: "era-modern",
    caption: "当代 Web 数据表：轻横线、单列聚焦、等宽右齐与内嵌迷你条",
  },
];

// ---------- Section 07：单变量小练习（只差对齐与数字字形） ----------
export const QUIZ_DATA = [
  { region: "华东大区", rev: "12,480", qoq: "+18.4%" },
  { region: "华南大区", rev: "8,920", qoq: "+12.1%" },
  { region: "西南大区", rev: "1,110", qoq: "+24.8%" },
  { region: "华北大区", rev: "940", qoq: "+6.5%" },
];

export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "版本 A",
    cls: "quiz-a",
    ok: false,
    title: "版本 A：数值左对齐会制造「量级错觉」",
    reason: "这里四行数值都贴着左边缘排：940 的「9」刚好对齐在 12,480 的「1」下面，千位逗号和百位完全错开。眼睛快速扫过时，很容易把 940 错看成与 8,920 同量级。",
  },
  {
    id: "B",
    label: "版本 B",
    cls: "quiz-b",
    ok: false,
    title: "版本 B 很接近，但漏了两处关键细节",
    reason: "数值虽然右对齐了，却同时犯了两个隐蔽错误：① 列标题仍居中，与右缘的数字脱节；② 用了比例数字（proportional-nums），导致「1,110」里的三个 1 变窄，逗号和十位垂直偏移，细看透视线就能发现它轻微扭曲。",
  },
  {
    id: "C",
    label: "版本 C",
    cls: "quiz-c",
    ok: true,
    title: "选对了！版本 C 的纵列位值轴笔直贯穿",
    reason: "文字左对齐方便起读，数值与数值列标题同步右对齐，并开启了等宽数字（tabular-nums）。看揭晓后的绿色参考线：四行的个位、逗号、小数点全部锁在同一条铅垂线上，万、千、百量级一眼分明。",
  },
  {
    id: "D",
    label: "版本 D",
    cls: "quiz-d",
    ok: false,
    title: "版本 D：全居中把对齐轴彻底打散了",
    reason: "居中对齐偶尔出现在装饰性海报里，但在比较数据时，长短不同的数字会让个位和小数点左右来回晃动，左侧大区名称也失去了齐整的起始线，浏览效率最低。",
  },
];
