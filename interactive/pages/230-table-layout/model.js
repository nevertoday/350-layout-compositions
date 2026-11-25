// 230 表格布局 · 单一数据与诊断真源（模型、实测判据、各节实验数据）

export const EMPIRICAL = {
  col1Min: 25, // 首列经验下限（%），低于此值四字中文标签易挤折或截断
  col1Max: 44, // 首列经验上限（%），高于此值数值列被压缩
  col1SliderMin: 14,
  col1SliderMax: 60,
  jitterLimitPx: 1.5, // 数字右缘对齐最大允许像素抖动（超过说明未右对齐或非等宽数字）
};

export const INITIAL_HERO_STATE = {
  layoutMode: "auto", // "auto" | "fixed"
  col1Pct: 18, // 14..60 (%)
  alignMode: "center", // "center" | "left" | "semantic"
  tabularNums: false,
  gridMode: "cage", // "cage" | "none" | "minimal"
  structureMode: "bad-merge", // "bad-merge" | "flat" | "semantic"
  sortKey: null, // null | "visits" | "rate"
  sortDir: "desc", // "desc" | "asc"
  selectedCell: { row: 1, col: 1 }, // row: 0..4 (0..3 data, 4 summary), col: 0..3
  sortBlockedNotice: "",
};

export const HERO_ROWS = [
  {
    id: "home",
    name: "首页导览",
    visits: 12480,
    rate: 4.82,
    note: "主入口",
    noteLong: "主入口",
  },
  {
    id: "docs",
    name: "文档中心",
    visits: 840,
    rate: 11.4,
    note: "高转化",
    noteLong: "高转化",
  },
  {
    id: "pricing",
    name: "定价方案",
    visits: 98120,
    rate: 0.95,
    note: "核心流量",
    noteLong: "含年度企业套餐阶梯报价与定制私有化部署说明长文本",
  },
  {
    id: "repo",
    name: "开源仓库",
    visits: 3215,
    rate: 6.18,
    note: "自然增长",
    noteLong: "自然增长",
  },
];

export const HERO_COLUMNS = [
  { key: "name", label: "项目", kind: "text", sortable: false },
  { key: "visits", label: "月访问", kind: "number", sortable: true },
  { key: "rate", label: "转化率", kind: "number", sortable: true },
  { key: "note", label: "说明", kind: "text", sortable: false },
];

export function formatVisits(n) {
  return n.toLocaleString("en-US");
}

export function formatRate(n) {
  return `${n.toFixed(2)}%`;
}

export function computeSummary(rows) {
  const totalVisits = rows.reduce((s, r) => s + r.visits, 0);
  const avgRate = rows.reduce((s, r) => s + r.rate, 0) / rows.length;
  return {
    name: "合计 / 均值",
    visits: totalVisits,
    rate: avgRate,
    note: `${rows.length} 项记录`,
  };
}

export function getOrderedRows(state) {
  const rows = [...HERO_ROWS];
  if (!state.sortKey || state.structureMode === "bad-merge") return rows;
  const dir = state.sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => (a[state.sortKey] - b[state.sortKey]) * dir);
  return rows;
}

// 计算四列目标百分比（固定列宽模式下精确分配，总和恒为 100%）
export function computeColPercentages(col1Pct) {
  const c1 = Math.max(EMPIRICAL.col1SliderMin, Math.min(EMPIRICAL.col1SliderMax, col1Pct));
  const rem = 100 - c1;
  const c2 = +(rem * 0.34).toFixed(1);
  const c3 = +(rem * 0.28).toFixed(1);
  const c4 = +(100 - c1 - c2 - c3).toFixed(1);
  return [c1, c2, c3, c4];
}

// 单一真源评估：结合状态与真实 DOM 实测结果，计算 5 柱状态与白话诊断
export function evaluateHero(state, measured = {}) {
  const {
    colWidthsPx = [0, 0, 0, 0],
    tableWidthPx = 0,
    digitJitterPx = 0,
    overflowCount = 0,
    wrappedNumCount = 0,
    col1ActualPct = state.col1Pct,
  } = measured;

  const isFixed = state.layoutMode === "fixed";
  const col1InBand = state.col1Pct >= EMPIRICAL.col1Min && state.col1Pct <= EMPIRICAL.col1Max;
  const noBadMerge = state.structureMode !== "bad-merge";
  const hasHierarchy = state.structureMode === "semantic";
  const alignSemantic = state.alignMode === "semantic";
  const alignClean = alignSemantic && state.tabularNums && digitJitterPx <= EMPIRICAL.jitterLimitPx;
  const gridClean = state.gridMode === "minimal";

  // 原海报底沿五柱逐项验收（行 / 列 / 单元格 / 对齐 / 结构）
  const pillars = {
    row: {
      key: "row",
      zh: "行",
      en: "ROW",
      ok: hasHierarchy && state.gridMode !== "none",
      status: !hasHierarchy
        ? state.structureMode === "bad-merge"
          ? "跨行打断"
          : "行级混同"
        : state.gridMode === "none"
          ? "易跨行串读"
          : "层次清晰",
    },
    col: {
      key: "col",
      zh: "列",
      en: "COLUMN",
      ok: isFixed && col1InBand && noBadMerge && wrappedNumCount === 0,
      status: !noBadMerge
        ? "跨列断裂"
        : !isFixed
          ? "长文劫持"
          : state.col1Pct < EMPIRICAL.col1Min
            ? "首列过窄"
            : state.col1Pct > EMPIRICAL.col1Max || wrappedNumCount > 0
              ? "数据列受挤"
              : "列轨稳固",
    },
    cell: {
      key: "cell",
      zh: "单元格",
      en: "CELL",
      ok: noBadMerge && overflowCount === 0 && wrappedNumCount === 0 && col1InBand,
      status: !noBadMerge
        ? "非原子合并"
        : overflowCount > 0
          ? `${overflowCount} 格截断`
          : wrappedNumCount > 0
            ? "数字折行"
            : !col1InBand
              ? "格宽失衡"
              : "原子清晰",
    },
    align: {
      key: "align",
      zh: "对齐",
      en: "ALIGN",
      ok: alignClean,
      status:
        state.alignMode === "center"
          ? `居中偏 ${digitJitterPx.toFixed(0)}px`
          : state.alignMode === "left"
            ? "数字错位"
            : !state.tabularNums
              ? "比例字微抖"
              : "铅垂齐整",
    },
    structure: {
      key: "structure",
      zh: "结构",
      en: "STRUCTURE",
      ok: gridClean && hasHierarchy,
      status:
        state.gridMode === "cage"
          ? "铁笼过载"
          : state.gridMode === "none"
            ? "缺少行引"
            : !hasHierarchy
              ? "缺少层次"
              : "清晰有序",
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 按严重程度给出最直接的「为什么看不清 + 怎么改」诊断
  let severity = "bad";
  let badge = `错态 · ${passCount} / 5`;
  let headline = "";
  let reason = "";
  let hint = "";

  if (state.sortBlockedNotice) {
    severity = "warn";
    badge = `排序受阻 · ${passCount} / 5`;
    headline = "正文区跨格合并，表头无法安全排序";
    reason = state.sortBlockedNotice;
    hint = "先把「层次结构」切到「语义分层+汇总」解开数据区合并，再点「月访问」或「转化率」表头试排。";
  } else if (passCount === 5) {
    severity = "good";
    badge = "结构成立 · 5 / 5";
    headline = "行列坐标稳固，眼睛可以顺列直扫比较";
    reason = `table-layout: fixed 按首列 ${state.col1Pct}% 锁住四条列轨，数值右对齐配等宽数字将右缘偏差压到 ${digitJitterPx.toFixed(1)}px，轻横线配合语义表头与汇总行让重点自然浮出。`;
    hint = state.sortKey
      ? `当前已按「${state.sortKey === "visits" ? "月访问" : "转化率"}」${state.sortDir === "desc" ? "降序" : "升序"}排列；点任意单元格还可检视坐标。`
      : "试着点一下「月访问」或「转化率」表头，体验 Ehrenberg 提倡的按大小排序。";
  } else if (!noBadMerge) {
    headline = "正文区跨行跨列合并，打断了列顺序与数据对比";
    reason = "第 3、4 行「月访问」与「转化率」被一块 2×2 合并块盖住，读者无法顺列核对真实数值，表头排序也因此失效。合并更适合表头分组，不该压在原始数据格上。";
    hint = "把「层次结构」切到「语义分层+汇总」，让每条记录恢复为独立可比的原子单元格。";
  } else if (!isFixed) {
    headline = "table-layout: auto 下，第 3 行长备注劫持了整表列宽";
    reason = `浏览器扫描全部内容后，把大量宽度让给最长的备注格，你拖定的首列 ${state.col1Pct}% 实际被压成约 ${Math.round(col1ActualPct)}%，数值列也跟着漂移。`;
    hint = "把「列宽算法」切到「固定 fixed」，再微调顶部列宽拖尺，让列轨按设计比例锁死。";
  } else if (state.col1Pct < EMPIRICAL.col1Min) {
    headline = `首列仅占 ${state.col1Pct}%，项目名称被挤得难以一次扫清`;
    reason = `低于经验舒适下限 ${EMPIRICAL.col1Min}% 时，左侧行标题折行甚至截断，眼睛得停下来拼字，拖慢按行查找。`;
    hint = `向右拖动上方列宽标尺，把首列拉进 ${EMPIRICAL.col1Min}%–${EMPIRICAL.col1Max}% 经验平衡带。`;
  } else if (state.col1Pct > EMPIRICAL.col1Max || wrappedNumCount > 0 || overflowCount > 0) {
    headline = `首列占到 ${state.col1Pct}%，反过来把右侧数值列挤窄了`;
    reason = `高于经验上限 ${EMPIRICAL.col1Max}% 会吃掉数值与说明列的空间${overflowCount > 0 ? `（实测 ${overflowCount} 处内容超格）` : ""}，长数字容易折行或贴边。`;
    hint = `向左回调列宽拖尺到 ${EMPIRICAL.col1Min}%–${EMPIRICAL.col1Max}%，让文字与数值各得其所。`;
  } else if (state.alignMode === "center") {
    headline = `数字全部居中，右缘锯齿偏移达 ${digitJitterPx.toFixed(0)}px`;
    reason = "「98,120」与「840」位数不同，居中会让个位、千位和小数点左右乱晃，大脑被迫逐个默念位数才能分辨谁大谁小。";
    hint = "把「对齐」切到「左文右数」，并开启「等宽数字」，看画布上的锯齿红线瞬间拉直。";
  } else if (state.alignMode === "left") {
    headline = "数字左对齐会制造「高位错觉」";
    reason = "左对齐让「840」的 8 直接压在「12,480」的 1 上方，第一眼容易误以为 840 更大——只有右对齐才能让个位、十位、千位纵向齐平。";
    hint = "把「对齐」切到「左文右数」，让数量级从宽度轮廓上一眼可辨。";
  } else if (!state.tabularNums) {
    headline = "已右对齐，但比例数字让个位和小数点仍有微抖";
    reason = "比例字形里「1」比「8」窄一截，多行数字纵排时千分位逗号和十位会错开半格。开启 OpenType 等宽数字（tabular-nums）就能锁死每位同宽。";
    hint = "点亮「等宽数字 tabular-nums」，把纵向对齐校准到像素级笔直。";
  } else if (state.gridMode === "cage") {
    headline = "重铁笼全框线抢走了数字的主角位置";
    reason = "四面加粗的亮框把每格围成独立小方盒，非数据墨水过重；其实列本身已经靠留白和右对齐立起隐形垂线，竖框大多是冗余噪声。";
    hint = "把「表线」切到「轻横线留白」，去掉竖框，只留轻横线引导视线按行滑行。";
  } else if (state.gridMode === "none") {
    headline = "完全去掉隔线后，宽行容易看串行";
    reason = "没有水平分隔参照，视线从左侧「文档中心」横扫到右侧「11.40%」时，容易滑落到上一行或下一行。";
    hint = "切到「轻横线留白」，用极轻的水平分隔线为长距离扫视铺出轨道。";
  } else {
    headline = "表头、数据与汇总行视觉平权，找不到阅读入口";
    reason = "三类不同角色的行长得一模一样，读者分不清哪一行是字段定义、哪一行是合计结论，容易把总计误当普通记录来比较。";
    hint = "把「层次结构」切到「语义分层+汇总」，用表头色带与底部汇总行拉开角色层级。";
  }

  const selRow = state.selectedCell?.row ?? 0;
  const selCol = state.selectedCell?.col ?? 0;
  const colMeta = HERO_COLUMNS[selCol] || HERO_COLUMNS[0];
  const rowLabel = selRow === 4 ? "第 5 行（汇总）" : `第 ${selRow + 1} 行`;

  return {
    pillars,
    passCount,
    severity,
    badge,
    headline,
    reason,
    hint,
    metrics: {
      tableWidthPx: Math.round(tableWidthPx),
      colWidthsPx: colWidthsPx.map((w) => Math.round(w)),
      digitJitterPx: +digitJitterPx.toFixed(1),
      overflowCount,
      coordText: `${rowLabel} × 第 ${selCol + 1} 列（${colMeta.label}）`,
    },
    cssSnippet: buildCssSnippet(state),
  };
}

export function buildCssSnippet(state) {
  const layout = state.layoutMode === "fixed" ? "fixed" : "auto";
  const numAlign = state.alignMode === "semantic" ? "right" : state.alignMode === "left" ? "left" : "center";
  const numVar = state.tabularNums ? "tabular-nums" : "proportional-nums";
  const borderRule =
    state.gridMode === "cage"
      ? "border: 2px solid #f3defa;"
      : state.gridMode === "none"
        ? "border: none;"
        : "border-bottom: 1px solid rgba(243,222,250,.22);";
  return [
    `table { table-layout: ${layout}; border-collapse: collapse; width: 100%; }`,
    `col:first-child { width: ${state.col1Pct}%; }`,
    `td.num, th.num { text-align: ${numAlign}; font-variant-numeric: ${numVar}; }`,
    `td { ${borderRule} }`,
  ].join("\n");
}

// ---------- 第 01 节：五要素与原海报 5×5 矩阵语义解剖 ----------
export const ANATOMY_LAYERS = {
  row: {
    tag: "<tr> · 行（ROW）",
    posterQuote: "水平排列的数据集合，表达记录或项目",
    explain: "每一行代表一条完整对象（例如一门课程、一笔订单、一个月份）。横向扫完一行，读到的是同一个实体的全部侧面。",
    sr: "读屏器播报：「第 2 行，共 5 行 — 第二行，字段一：空缺，字段二：圆形……」",
    cells: [
      [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
    ],
  },
  col: {
    tag: "<col> / <th scope=\"col\"> · 列（COLUMN）",
    posterQuote: "垂直排列的字段集合，表达属性或类别",
    explain: "每一列锁定同一个维度（例如单价、转化率、状态）。纵向往下扫一列，是在同一把尺子上比较不同记录的高低。",
    sr: "读屏器播报：「第二列，表头：属性 B — 第 1 行至第 5 行同类数据」",
    cells: [
      [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
    ],
  },
  cell: {
    tag: "<td> · 单元格（CELL）",
    posterQuote: "行与列的交集，存放最小数据单元",
    explain: "单个格子的含义由它的行标题与列标题共同定义。保持一格一值（原子性），筛选、排序和复制到电子表格才不会出错。",
    sr: "读屏器播报：「第五行，第一列：圆形标记（行 5，列 2）」",
    cells: [
      [4, 1],
    ],
  },
  align: {
    tag: "text-align + tabular-nums · 对齐",
    posterQuote: "统一对齐方式，提升可读性与美观",
    explain: "文本类沿左缘起读，数值类沿右缘或小数点纵齐；表头紧随其下的数据对齐，眼睛不用在列内左右找落点。",
    sr: "视觉规则：文字左缘形成阅读锚线，数字右缘形成量级铅垂线。",
    cells: [
      [0, 1], [0, 2], [0, 3], [0, 4], [1, 1], [2, 1], [3, 1], [4, 1],
    ],
  },
  structure: {
    tag: "<thead> / <tbody> / <tfoot> · 结构",
    posterQuote: "清晰的表格结构，让信息一目了然",
    explain: "用语义标签区分表头、正文与汇总，再辅以轻重有别的色带和克制表线；需要强调结论时，用汇总行或适度聚焦，不破坏底层坐标。",
    sr: "读屏器播报：「表格含表头 1 行、正文 4 行、表尾汇总 1 行，可按列快速跳转」",
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      [4, 0], [4, 1], [4, 2], [4, 3], [4, 4],
    ],
  },
};

// ---------- 第 02 节：左文右数与 Ehrenberg 精度取整 ----------
export const ALIGN_LAB_DATA = [
  { region: "华东区", raw: 48231.642, unit: "¥" },
  { region: "华南区", raw: 6190.4, unit: "¥" },
  { region: "西南区", raw: 912.875, unit: "¥" },
  { region: "华北区", raw: 125480.15, unit: "¥" },
  { region: "西北区", raw: 3405.08, unit: "¥" },
];

export function formatLabNumber(val, precisionMode) {
  if (precisionMode === "raw") {
    return `¥${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`;
  }
  if (precisionMode === "fixed2") {
    return `¥${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // Ehrenberg 2 位有效数字（单位：千元）
  const k = val / 1000;
  if (k >= 100) return `¥${Math.round(k)}k`;
  if (k >= 10) return `¥${Math.round(k)}k`;
  return `¥${k.toFixed(1)}k`;
}

// ---------- 第 03 节：auto vs fixed 脏数据压力测试 ----------
export const STRESS_PAYLOADS = {
  normal: {
    label: "正常短词",
    orderId: "ORD-2041",
    note: "标准版续费",
    amount: "¥1,280",
    explain: "内容都很短时，auto 与 fixed 看起来差别不大——这正是许多开发者忘记设 table-layout: fixed 的原因。",
  },
  longId: {
    label: "超长无空格单号",
    orderId: "ORD2026ENTERPRISE998172635401",
    note: "标准版续费",
    amount: "¥1,280",
    explain: "一串无断点长单号涌入：auto 被迫把第 1 列拉到极宽，挤爆其余列甚至撑破容器；fixed 守住既定列轨，按你的溢出策略折行或省略。",
  },
  longNote: {
    label: "32 字长备注",
    orderId: "ORD-2041",
    note: "客户申请合并开具增值税专用发票并于下周五前寄出纸质合同归档",
    amount: "¥1,280",
    explain: "auto 把大段剩余空间挪给「备注」列，导致金额与单号列突然跳动重排；fixed 保持三列宽度纹丝不动，长备注老实折行。",
  },
  url: {
    label: "外部回调 URL",
    orderId: "ORD-2041",
    note: "https://hooks.example.com/v2/billing/invoice/callback?token=9f8a7b6c",
    amount: "¥1,280",
    explain: "真实后台报表里最常见的排版杀手：URL 没有自然断点，只有 fixed 配合 overflow-wrap: anywhere 或 text-overflow: ellipsis 才能保住整表秩序。",
  },
};

// ---------- 第 04 节：数据墨水 4 步剥离阶梯 ----------
export const INK_STEPS = [
  {
    id: 0,
    label: "01 默认全框铁笼",
    inkRatio: "约 46% 非数据墨水（示意）",
    summary: "每个单元格四周都有粗框，还叠加高对比斑马纹，格线比数字本身更抢眼。",
    detail: "Tufte 在 1983 年指出：凡是擦掉也不损失信息的线条都是多余墨水。满屏竖线把同一行的数据硬生生切碎。",
  },
  {
    id: 1,
    label: "02 去掉所有竖框线",
    inkRatio: "约 28% 非数据墨水（示意）",
    summary: "删掉竖向分隔线后，每条记录瞬间连成完整的一行，视觉噪点少了一大半。",
    detail: "只要文字左对齐、数字右对齐并留出列间距，大脑会用格式塔闭合律自动画出隐形的列边界。",
  },
  {
    id: 2,
    label: "03 柔化横线与呼吸留白",
    inkRatio: "约 14% 非数据墨水（示意）",
    summary: "用极淡的 1px 细横线替代厚框，加大上下内边距，让行与行靠空间自然分开。",
    detail: "Stephen Few 建议把隔线压退到背景层：能帮眼睛稳住水平轨迹即可，绝不与数字争对比度。",
  },
  {
    id: 3,
    label: "04 表头与汇总收束",
    inkRatio: "约 9% 非数据墨水（示意）",
    summary: "仅在表头下缘与汇总行上缘加清晰分隔，配合等宽数字右对齐，重点一眼即达。",
    detail: "这就是出版级财报与现代数据表的经典做法：所有视觉重量都用在数据本身与关键边界上。",
  },
];

// ---------- 第 05 节：窄屏响应式策略 ----------
export const MOBILE_STRATEGIES = {
  squeeze: {
    label: "默认硬挤",
    verdict: "反例：每个词竖着折成一串单字，既读不通也比不了。",
    tradeoff: "6 列硬塞进窄屏后，每列只剩 50px 左右，数字与单位被迫拆断，完全丧失表格的可扫描性。",
  },
  sticky: {
    label: "横滚 + 首列冻结",
    verdict: "多维对比首选：保住完整列结构，同时始终看清左侧项目名。",
    tradeoff: "容器设 overflow-x: auto，首列用 position: sticky; left: 0 固定在左缘（辅以微弱阴影提示右侧可滚），可跨行比较所有数值。",
  },
  priority: {
    label: "按优先级隐列",
    verdict: "适合主次分明的列表：窄屏只留核心 3 列，次要字段进详情页。",
    tradeoff: "免去横向滚动，但隐藏的字段在当前视图下无法直接对比，务必标明完整字段入口。",
  },
  cards: {
    label: "逐行堆叠卡片",
    verdict: "适合逐条查看单笔记录，但不利于纵向比较同一字段。",
    tradeoff: "每行变成一张「字段名：值」卡片，完全不横滚；但想对比 4 个方案的价格高低时，眼睛得上下翻好几屏。",
  },
};

// ---------- 第 06 节：历史演进节点 ----------
export const HISTORY_NODES = [
  {
    year: "1977",
    who: "A. S. C. Ehrenberg",
    work: "《Rudiments of Numeracy》",
    venue: "英国皇家统计学会会刊（JRSS Series A, Vol. 140）",
    body: "Ehrenberg 指出大众「看不懂数字」往往不是读者算术差，而是表格排得糟。他提出至今仍被奉为圭臬的实操原则：数字尽量取舍到两位有效数字、按大小排序而非按字母乱排、把要比较的数排在同一竖列、并用一行话点出结论。",
    codeTitle: "1977 · 统计表格排版四要点",
    code: "1. 取约两位有效数字（42k 胜过 42,389.17）\n2. 按数值大小排序，让规律和异常自己浮出\n3. 同类指标纵向排成列，顺列比较远快于横比\n4. 附带均值或总计作为参照锚点",
  },
  {
    year: "1983",
    who: "Edward R. Tufte",
    work: "《The Visual Display of Quantitative Information》",
    venue: "Graphics Press",
    body: "Tufte 提出「数据墨水比（Data-Ink Ratio）」：画面里用于呈现真实数据的墨水占总墨水的比例越高越好。放进表格里，这意味着大胆擦掉厚重的四周格框与花哨装饰，让数据与留白成为主角。",
    codeTitle: "1983 · 数据墨水比原则",
    code: "Data-Ink Ratio = Data-Ink / Total Ink\n→ 擦掉不携带数据的粗竖线与重阴影\n→ 只保留引导扫视的轻横线与表头底线",
  },
  {
    year: "1996",
    who: "Dave Raggett & David Siegel",
    work: "RFC 1942《HTML Tables》与《Creating Killer Web Sites》",
    venue: "IETF（1996.05）/ W3C HTML 3.2（1997.01）",
    body: "同一年的两条命运交汇：一方面 Dave Raggett 通过 RFC 1942 确立了 <table>、<thead>、<tbody>、<tfoot> 与跨行列模型并在 1997 年正式并入 HTML 3.2；另一方面，因为当时还没有成熟的 CSS 排版，David Siegel 普及了「嵌套表格 + 1×1 透明 GIF 撑开像素」来强行拼出杂志网页的做法。",
    codeTitle: "1996 · 曾风靡一时的表格拼版黑魔法（现已淘汰）",
    code: '<table border="0" cellpadding="0" cellspacing="0">\n  <tr>\n    <td width="180"><img src="spacer.gif" width="180" height="1"></td>\n    <td><!-- 把整页导航与正文塞进表格格子 --></td>\n  </tr>\n</table>',
  },
  {
    year: "1998–2011",
    who: "W3C CSS 工作组",
    work: "CSS2（1998.05）→ CSS 2.1 第 17 章《Tables》（2011）",
    venue: "W3C Recommendation",
    body: "CSS 规范把表格视觉格式化独立成标准模型，正式定义 table-layout: fixed（只看首行与 <col> 即可确定列宽，避免扫描全表导致抖动）以及 border-collapse: collapse 合并边框模型。",
    codeTitle: "CSS 2.1 Ch.17 · 固定表格布局算法",
    code: "table {\n  table-layout: fixed;\n  border-collapse: collapse;\n  width: 100%;\n}",
  },
  {
    year: "2003–2004",
    who: "Jeffrey Zeldman & Stephen Few",
    work: "《Designing with Web Standards》与《Show Me the Numbers》",
    venue: "New Riders（2003）/ Analytics Press（2004）",
    body: "Zeldman 带动网页标准运动终结了用 <table> 拼页面的年代，让页面布局回归 CSS，表格回归数据本身；翌年 Stephen Few 在《Show Me the Numbers》里系统整理了商业数据表细则：文本左对齐、数字右对齐、表头随数据对齐、慎用重框与盲目斑马纹。",
    codeTitle: "2003–2004 · 语义回归后的现代数据表",
    code: '<table>\n  <caption>季度指标对比</caption>\n  <thead><tr><th scope="col">项目</th><th scope="col" class="num">营收</th></tr></thead>\n  <tbody><tr><th scope="row">专业版</th><td class="num">¥98,120</td></tr></tbody>\n</table>',
  },
];

// ---------- 第 07 节：6 场景分诊卡 ----------
export const TRIAGE_SCENARIOS = [
  {
    id: "pricing",
    title: "SaaS 套餐参数对比",
    sample: "4 档方案 × 12 项功能配额与月费",
    verdict: "use",
    verdictLabel: "适合用表格",
    reason: "同一组维度反复出现在每一档方案里，用户核心动作是「顺列比高低、按行查配置」，标准 <table> 效率最高。",
    link: null,
  },
  {
    id: "page-shell",
    title: "官网整页栅格框架",
    sample: "顶栏 + 左侧菜单 + 主内容 + 页脚",
    verdict: "avoid",
    verdictLabel: "别用表格",
    reason: "这是页面区域划分而非二维数据。用表格写框架会破坏源码阅读顺序和响应式重排，应交给二维网格系统。",
    link: { id: "227", name: "227 网格布局", url: "https://layout.xiaoxiaodong.ai/227/play/" },
  },
  {
    id: "nav-bar",
    title: "顶部导航与按钮条",
    sample: "Logo 居左、菜单居中、登录按钮居右",
    verdict: "avoid",
    verdictLabel: "别用表格",
    reason: "沿单一主轴对齐和分配间距，用 display: table 假装垂直居中已是旧时代权宜之计，弹性盒一行即可搞定。",
    link: { id: "226", name: "226 弹性盒布局", url: "https://layout.xiaoxiaodong.ai/226/play/" },
  },
  {
    id: "ledger",
    title: "财务对账与订单流水",
    sample: "单号、时间、币种、金额、状态",
    verdict: "use",
    verdictLabel: "适合用表格",
    reason: "需要精确查单值、核对千分位与总额汇总，配 table-layout: fixed、右对齐等宽数字和汇总行 tfoot 刚刚好。",
    link: null,
  },
  {
    id: "trend",
    title: "365 天气温变化趋势",
    sample: "需要一眼看出季节波峰与异常陡降",
    verdict: "avoid",
    verdictLabel: "换统计图表",
    reason: "Stephen Few 指出：表格擅长查精确单值，图表擅长呈现整体趋势与形状。几百行数字表格只会淹没走势。",
    link: null,
  },
  {
    id: "photo-wall",
    title: "不等高摄影作品集",
    sample: "横图竖图混排、按视觉流往下延展",
    verdict: "avoid",
    verdictLabel: "别用表格",
    reason: "表格强制同行等高，横竖混排会产生大片空白空洞；错落不等高的流式展示更适合瀑布流或网格。",
    link: { id: "236", name: "236 瀑布流布局", url: "https://layout.xiaoxiaodong.ai/236/play/" },
  },
];

// ---------- 第 08 节：4 选项小测验（仅差一个变量，中性标签） ----------
export const QUIZ_DATA = [
  { plan: "入门版", price: "¥98", quota: "50 GB" },
  { plan: "团队版", price: "¥1,280", quota: "1,000 GB" },
  { plan: "专业版", price: "¥460", quota: "250 GB" },
  { plan: "企业版", price: "¥12,800", quota: "10,000 GB" },
];

export const QUIZ_OPTIONS = [
  {
    id: "A",
    variant: "left-nums",
    correct: false,
    feedback: "方案 A 的问题只出在一个变量：数值列「月费」和「流量」采用了左对齐。结果 ¥98 的 9 与 ¥1,280 的 1 齐平，眼睛第一下很难凭数字宽度轮廓直接读出十倍量级差。",
  },
  {
    id: "B",
    variant: "heavy-cage",
    correct: false,
    feedback: "方案 B 的对齐是对的（左文右数 + 等宽数字），但保留了高对比的全框粗竖线。冗余的格线把每一行切成孤立的盒子，降低了数据墨水比，扫读速度变慢。",
  },
  {
    id: "C",
    variant: "ideal",
    correct: true,
    feedback: "选对了！方案 C 同时满足文字左对齐、数字右对齐配等宽数字（千位、十位、个位纵向对齐）、表头与所属列方向一致，并用轻横线与留白替代粗竖框，顺列直扫就能瞬间比出价差。",
  },
  {
    id: "D",
    variant: "center-nums",
    correct: false,
    feedback: "方案 D 去掉了粗竖线，但把「月费」与「流量」设为居中对齐。不同位数的数字左右飘移，视线每往下看一行都要重新寻找个位落点，纵向比较更费眼。",
  },
];
