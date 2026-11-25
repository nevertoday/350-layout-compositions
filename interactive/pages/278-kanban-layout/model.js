// 278 看板布局 · 单一真源数据与诊断模型
// 所有看板状态、四柱验收、错态诊断、利特尔法则（示意）及各节数据皆由此模块派生。

export const IDEAL_ORDER = ["backlog", "doing", "review", "testing", "done"];

export const COLUMNS = {
  backlog: {
    id: "backlog",
    zh: "待办",
    en: "BACKLOG",
    wipLimit: null,
    idealIndex: 0,
    desc: "已确认待排期的需求池，不设在制品上限。",
  },
  doing: {
    id: "doing",
    zh: "进行中",
    en: "IN PROGRESS",
    wipLimit: 3,
    idealIndex: 1,
    desc: "团队正在动手执行的任务，最容易同时开太多导致堵车。",
  },
  review: {
    id: "review",
    zh: "评审中",
    en: "IN REVIEW",
    wipLimit: 3,
    idealIndex: 2,
    desc: "等待代码审查、设计走查或方案确认的中间环节。",
  },
  testing: {
    id: "testing",
    zh: "测试中",
    en: "TESTING",
    wipLimit: 3,
    idealIndex: 3,
    desc: "提测验证与回归检查，未通过会暴露上游返工。",
  },
  done: {
    id: "done",
    zh: "已完成",
    en: "DONE",
    wipLimit: null,
    idealIndex: 4,
    desc: "真正可交付或已上线的终点列，用于复盘吞吐。",
  },
};

export const LANES = [
  { id: "product", zh: "产品", en: "PRODUCT", color: "#5B8A47", text: "#2A521E", bg: "#E7F0E0" },
  { id: "design", zh: "设计", en: "DESIGN", color: "#D9A826", text: "#745000", bg: "#FAF0CE" },
  { id: "develop", zh: "开发", en: "DEVELOP", color: "#D86B20", text: "#963B08", bg: "#FBE8D6" },
  { id: "ops", zh: "运维", en: "OPS", color: "#5C6B57", text: "#364432", bg: "#E4E8DF" },
];

export const LANE_MAP = Object.fromEntries(LANES.map((l) => [l.id, l]));

export const PRIORITIES = {
  high: { id: "high", label: "高优先级", short: "高优", fg: "#963B08", bg: "#FBE5D2", border: "#E3A77C" },
  mid: { id: "mid", label: "中优先级", short: "中优", fg: "#7D4E10", bg: "#F7E7C8", border: "#DFBE86" },
  low: { id: "low", label: "低优先级", short: "低优", fg: "#2E5B24", bg: "#E6EFE0", border: "#B7CCA9" },
};

// 12 张取自 278 原海报的真实任务卡；开场 doing 堆 6 张形成明显爆仓（超出 WIP 上限 4）
export const INITIAL_CARDS = [
  {
    id: "t1",
    title: "用户反馈收集",
    lane: "product",
    col: "backlog",
    priority: "low",
    shape: "circle",
    owner: "琳",
    due: "周五",
    tag: "调研",
    extra: { idCode: "KB-101", created: "11-18", est: "4h", note: "整理 42 条客服工单并按模块归档至周报" },
  },
  {
    id: "t5",
    title: "页面视觉改版",
    lane: "design",
    col: "backlog",
    priority: "mid",
    shape: "circle",
    owner: "岚",
    due: "周五",
    tag: "视觉",
    extra: { idCode: "KB-105", created: "11-19", est: "8h", note: "统一首页头图边距与深浅卡片字号层级" },
  },
  {
    id: "t10",
    title: "用户权限系统",
    lane: "develop",
    col: "doing",
    priority: "high",
    shape: "circle",
    owner: "铭",
    due: "明天",
    tag: "核心",
    isHeroDrag: true,
    extra: { idCode: "KB-110", created: "11-14", est: "16h", note: "角色颗粒度鉴权中间件重构与接口联调" },
  },
  {
    id: "t11",
    title: "接口性能优化",
    lane: "develop",
    col: "doing",
    priority: "high",
    shape: "triangle",
    owner: "舟",
    due: "周三",
    tag: "性能",
    extra: { idCode: "KB-111", created: "11-15", est: "12h", note: "合并列表查询慢 SQL 并补齐缓存击穿保护" },
  },
  {
    id: "t9",
    title: "接入埋点数据",
    lane: "develop",
    col: "doing",
    priority: "high",
    shape: "square",
    owner: "铭",
    due: "周四",
    tag: "数据",
    extra: { idCode: "KB-109", created: "11-16", est: "6h", note: "补全转化漏斗关键节点上报与校验脚本" },
  },
  {
    id: "t2",
    title: "需求文档撰写",
    lane: "product",
    col: "doing",
    priority: "mid",
    shape: "square",
    owner: "辰",
    due: "周三",
    tag: "PRD",
    extra: { idCode: "KB-102", created: "11-16", est: "5h", note: "补充异常态交互说明与边界字段验收口径" },
  },
  {
    id: "t6",
    title: "组件库整理",
    lane: "design",
    col: "doing",
    priority: "mid",
    shape: "square",
    owner: "岚",
    due: "周三",
    tag: "规范",
    extra: { idCode: "KB-106", created: "11-17", est: "8h", note: "清理旧版弹窗变体并核对色板对比度" },
  },
  {
    id: "t15",
    title: "监控告警优化",
    lane: "ops",
    col: "testing",
    priority: "mid",
    shape: "square",
    owner: "岳",
    due: "周四",
    tag: "稳定",
    extra: { idCode: "KB-115", created: "11-17", est: "6h", note: "合并重复阈值告警以降低夜间误报率" },
  },
  {
    id: "t3",
    title: "新手引导流程",
    lane: "product",
    col: "review",
    priority: "mid",
    shape: "triangle",
    owner: "宁",
    due: "周四",
    tag: "增长",
    extra: { idCode: "KB-103", created: "11-13", est: "6h", note: "三步气泡提示文案走查与跳过逻辑复核" },
  },
  {
    id: "t14",
    title: "Bug 修复 #0321",
    lane: "develop",
    col: "done",
    priority: "high",
    shape: "circle",
    owner: "舟",
    due: "已交付",
    tag: "修复",
    extra: { idCode: "KB-114", created: "11-10", est: "3h", note: "修复导出报表时区偏移一小时的问题" },
  },
  {
    id: "t16",
    title: "容器资源扩容",
    lane: "ops",
    col: "done",
    priority: "low",
    shape: "triangle",
    owner: "岳",
    due: "已交付",
    tag: "基建",
    extra: { idCode: "KB-116", created: "11-11", est: "4h", note: "高峰时段自动弹性伸缩策略已上线验证" },
  },
];

// 创建开场 0/4 错态状态
export function createBrokenState() {
  return {
    // 故意把「评审中」排在「进行中」之前，产生明显流程逆行，且让 doing 居中便于拖拽
    colOrder: ["backlog", "review", "doing", "testing", "done"],
    wipEnabled: false,
    swimlanes: false,
    cardDensity: "bloated", // "bloated" | "minimal" | "stripped"
    selectedCardId: "t10",
    cards: INITIAL_CARDS.map((c) => ({ ...c })),
    lastNotice: "",
  };
}

// 创建一个合法参考解（不是唯一解，用户自己拖卡片到合理范围同样 4/4）
export function createHealthyState() {
  const s = createBrokenState();
  s.colOrder = [...IDEAL_ORDER];
  s.wipEnabled = true;
  s.swimlanes = true;
  s.cardDensity = "minimal";
  // 把进行中 5 张里的 2 张向右疏通：t2 推至评审中、t6 推至测试中（进行中降至 3/3）
  s.cards = s.cards.map((c) => {
    if (c.id === "t2") return { ...c, col: "review" };
    if (c.id === "t6") return { ...c, col: "testing" };
    return c;
  });
  return s;
}

// 计算列序逆序对数（相对理想工作流顺序）
export function countInversions(colOrder) {
  const ranks = colOrder.map((id) => COLUMNS[id].idealIndex);
  let inv = 0;
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      if (ranks[i] > ranks[j]) inv++;
    }
  }
  return inv;
}

// 尝试移动卡片：当开启严格 WIP 且目标列已满（且不是拖回同一列）时拦截
export function tryMoveCard(state, cardId, targetColId) {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card || !COLUMNS[targetColId]) return { moved: false, reason: "invalid" };
  if (card.col === targetColId) return { moved: false, reason: "same" };

  const colMeta = COLUMNS[targetColId];
  const currentCount = state.cards.filter((c) => c.col === targetColId).length;
  if (state.wipEnabled && colMeta.wipLimit !== null && currentCount >= colMeta.wipLimit) {
    return {
      moved: false,
      blocked: true,
      colId: targetColId,
      count: currentCount,
      limit: colMeta.wipLimit,
      message: `已拦截：「${colMeta.zh}」当前 ${currentCount}/${colMeta.wipLimit} 已达在制品上限，请先推进下游卡片再拉入。`,
    };
  }

  const fromCol = card.col;
  card.col = targetColId;
  state.selectedCardId = cardId;
  state.lastNotice = "";
  return {
    moved: true,
    blocked: false,
    fromCol,
    toCol: targetColId,
    message: `已将「${card.title}」从「${COLUMNS[fromCol].zh}」移至「${colMeta.zh}」。`,
  };
}

// 交换两列顺序
export function swapColumns(state, idxA, idxB) {
  if (idxA < 0 || idxB < 0 || idxA >= state.colOrder.length || idxB >= state.colOrder.length || idxA === idxB) return false;
  const next = [...state.colOrder];
  [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
  state.colOrder = next;
  return true;
}

// 核心单真源评估函数：所有 UI 读数、Canvas 视觉、诊单和 5 原则灯只读取这里的结果
export function evaluateBoard(state) {
  const counts = {};
  for (const id of IDEAL_ORDER) counts[id] = 0;
  for (const c of state.cards) counts[c.col]++;

  // 各职能泳道在执行区（doing + review + testing）的分布
  const laneActive = {};
  for (const l of LANES) laneActive[l.id] = 0;
  for (const c of state.cards) {
    if (c.col === "doing" || c.col === "review" || c.col === "testing") {
      laneActive[c.lane]++;
    }
  }
  const hottestLane = LANES.reduce((best, l) => (laneActive[l.id] > laneActive[best.id] ? l : best), LANES[0]);

  const inversions = countInversions(state.colOrder);
  const orderOk = inversions === 0;

  // 超载列判定：即便 WIP 开关关闭，也会核算「相对经验上限的隐性超载」
  const overloadedCols = [];
  const hiddenOverloadedCols = [];
  for (const id of state.colOrder) {
    const limit = COLUMNS[id].wipLimit;
    if (limit !== null && counts[id] > limit) {
      hiddenOverloadedCols.push({ id, zh: COLUMNS[id].zh, count: counts[id], limit, excess: counts[id] - limit });
      if (state.wipEnabled) {
        overloadedCols.push({ id, zh: COLUMNS[id].zh, count: counts[id], limit, excess: counts[id] - limit });
      }
    }
  }

  const activeWip = counts.doing + counts.review + counts.testing;
  const doingIdle = counts.doing === 0;
  const bottleneckId = ["doing", "review", "testing"].reduce(
    (best, id) => {
      const ratioBest = counts[best] / COLUMNS[best].wipLimit;
      const ratioCur = counts[id] / COLUMNS[id].wipLimit;
      return ratioCur > ratioBest ? id : best;
    },
    "doing"
  );
  const bottleneckRatio = counts[bottleneckId] / COLUMNS[bottleneckId].wipLimit;

  // 利特尔法则（示意）：基准吞吐 λ0 = 1.2 张/天，在制品超过健康阈值 6 时因上下文切换损耗下降
  const baseThroughput = 1.2;
  const switchPenalty = 1 + 0.16 * Math.max(0, activeWip - 6) + 0.22 * hiddenOverloadedCols.reduce((s, o) => s + o.excess, 0);
  const effThroughput = activeWip === 0 ? 0 : +(baseThroughput / switchPenalty).toFixed(2);
  const estCycleDays = activeWip === 0 ? 0 : +(activeWip / effThroughput).toFixed(1);

  const flowOk = state.wipEnabled && overloadedCols.length === 0 && !doingIdle && activeWip >= 2;
  const swimlaneOk = state.swimlanes;
  const cardOk = state.cardDensity === "minimal";

  const pillars = {
    order: { ok: orderOk, label: orderOk ? "流程顺行" : `逆序 ${inversions} 处` },
    flow: {
      ok: flowOk,
      label: !state.wipEnabled
        ? `未限流 · ${COLUMNS[bottleneckId].zh} ${counts[bottleneckId]} 张`
        : overloadedCols.length
          ? `${overloadedCols[0].zh} ${overloadedCols[0].count}/${overloadedCols[0].limit} 爆仓`
          : doingIdle
            ? "进行中空转 0 张"
            : `畅通 · 在制 ${activeWip} 张`,
    },
    swimlane: { ok: swimlaneOk, label: swimlaneOk ? "4 条职能泳道" : "混堆无泳道" },
    card: {
      ok: cardOk,
      label:
        state.cardDensity === "minimal"
          ? "5 要素精简"
          : state.cardDensity === "bloated"
            ? "8 字段过载无色标"
            : "缺优先级与负责人",
    },
  };

  const score = [orderOk, flowOk, swimlaneOk, cardOk].filter(Boolean).length;

  // 原海报五原则实时状态（状态 / 分组 / 流动 / 优先级 / 对比）
  const fivePrinciples = {
    status: {
      ok: orderOk,
      badge: orderOk ? "5 列顺行" : `列序逆行`,
    },
    grouping: {
      ok: swimlaneOk,
      badge: swimlaneOk ? "4 泳道清晰" : "混成一锅",
    },
    flow: {
      ok: flowOk,
      badge: !state.wipEnabled ? "WIP 关闭" : overloadedCols.length ? `超限 +${overloadedCols[0].excess}` : doingIdle ? "下游断流" : "限流稳态",
    },
    priority: {
      ok: cardOk,
      badge: state.cardDensity === "minimal" ? "色形双标" : state.cardDensity === "bloated" ? "被文字淹没" : "缺色缺人",
    },
    compare: {
      ok: hiddenOverloadedCols.length === 0 && !doingIdle,
      badge: hiddenOverloadedCols.length
        ? `${hiddenOverloadedCols[0].zh}堆积 ${Math.round((counts[hiddenOverloadedCols[0].id] / Math.max(1, activeWip)) * 100)}%`
        : doingIdle
          ? "进行中 0 张"
          : "各列均衡",
    },
  };

  // 逐级诊单（7 类错态全覆盖，始终先报最要紧的那一项）
  let diagnosis;
  if (!orderOk) {
    // 找出第一个逆序对
    let pairText = "";
    for (let i = 0; i < state.colOrder.length - 1; i++) {
      const a = COLUMNS[state.colOrder[i]];
      const b = COLUMNS[state.colOrder[i + 1]];
      if (a.idealIndex > b.idealIndex) {
        pairText = `「${a.zh}」排在了「${b.zh}」前面`;
        break;
      }
    }
    diagnosis = {
      kind: "error",
      tag: `错态 · 列序倒置 (${score} / 4)`,
      headline: `${pairText}，看板流向与真实工作流打架`,
      why: `人眼读看板默认“从左向右推进”。当前共有 ${inversions} 处逆序，任务在列表间来回折返，团队一眼扫过去根本分不清哪些是半成品、哪些已接近交付。`,
      action: `点击列表头上的 ⇄ 换位按钮（或点「一键理顺列序」），把 5 列调回「待办 → 进行中 → 评审中 → 测试中 → 已完成」。`,
    };
  } else if (!state.wipEnabled) {
    diagnosis = {
      kind: "error",
      tag: `错态 · 未设 WIP 上限 (${score} / 4)`,
      headline: `${COLUMNS[bottleneckId].zh}已堆进 ${counts[bottleneckId]} 张卡，没有上限就没有刹车`,
      why: `关闭在制品上限后，上游源源不断往中间列塞活。现在全部 ${activeWip} 张在制任务里，${COLUMNS[bottleneckId].zh}占了 ${Math.round((counts[bottleneckId] / Math.max(1, activeWip)) * 100)}%，按利特尔法则（示意）平均周期被拉长到 ${estCycleDays} 天。`,
      action: `先把「WIP 上限」切到「严格限流」，再把超载列里的卡片亲手拖向右方空位列（或退回待办）疏通。`,
    };
  } else if (overloadedCols.length > 0) {
    const o = overloadedCols[0];
    diagnosis = {
      kind: "error",
      tag: `错态 · 列内超载爆仓 (${score} / 4)`,
      headline: `「${o.zh}」塞了 ${o.count} 张，超出上限 ${o.limit} 张（+${o.excess}）`,
      why: `WIP 红灯已经亮起：同时并行 ${o.count} 件事会让团队频繁切换上下文，单张卡的示意平均周期抬升到 ${estCycleDays} 天；其中「${hottestLane.zh}」泳道在制品最多（${laneActive[hottestLane.id]} 张）。`,
      action: `直接拖住「${o.zh}」列里的卡片向右推进到有空位的列（或用卡片上的 ← / → 按钮），把该列降到 ≤ ${o.limit} 张。`,
    };
  } else if (doingIdle) {
    diagnosis = {
      kind: "error",
      tag: `错态 · 执行列空转 (${score} / 4)`,
      headline: `「进行中」变成了 0 张，整条流水线断档停摆`,
      why: `限制在制品不是要把活全清空。现在「进行中」完全空置，下游很快会无卡可测，团队产能白白闲置。`,
      action: `从「待办」拖 2–4 张高优任务卡进「进行中」，维持平稳流动。`,
    };
  } else if (!swimlaneOk) {
    diagnosis = {
      kind: "warn",
      tag: `待优化 · 职能混堆 (${score} / 4)`,
      headline: `四个职能的任务混在一锅，看不出哪条线最吃紧`,
      why: `当产品、设计、开发、运维共挤同一垂直列表时，哪怕列总数没超限，也难以一眼看出「${hottestLane.zh}」线其实背着 ${laneActive[hottestLane.id]} 张在制任务。`,
      action: `在下方把「泳道分组」切到「4 条职能泳道」，横向切开权责，瓶颈立刻落到具体团队。`,
    };
  } else if (state.cardDensity === "bloated") {
    diagnosis = {
      kind: "warn",
      tag: `待优化 · 卡片过载 (${score} / 4)`,
      headline: `单卡塞满 8 项文字且撤掉色标，一眼扫不动重点`,
      why: `看板不是详细文档库。把编号、创建日、工时预估和大段描述全摊在卡面上，卡片高度暴涨，一屏扫不到几张，高优先级任务也埋进了灰字里。`,
      action: `把「卡片密度」切回「最小必要（5 要素）」，保留标题、色形、优先级、截止时间与负责人。`,
    };
  } else if (state.cardDensity === "stripped") {
    diagnosis = {
      kind: "warn",
      tag: `错态 · 信息残缺 (${score} / 4)`,
      headline: `卡片只剩干巴巴的标题，谁负责、谁最急全看不见`,
      why: `精简不等于删光。撤掉优先级与负责人后，站会扫一眼看板无法判断哪张明天到期、该找谁协同，只能一张张点开问。`,
      action: `把「卡片密度」切到「最小必要（5 要素）」，让扫一眼就能拍板。`,
    };
  } else {
    diagnosis = {
      kind: "ok",
      tag: `稳态 · 看板畅通 (4 / 4)`,
      headline: `列序顺行、在制受控（${activeWip} 张），瓶颈随时可查`,
      why: `现在 5 列按真实流程推进，活动列均未超过 WIP 上限，4 条职能泳道把权责摊平，卡片只留 5 项扫读要素，示意平均周期回落至 ${estCycleDays} 天。你可以继续往已满的列拖卡，体验 WIP 硬上限如何当场拦车。`,
      action: `试着把「待办」里的卡硬拖进已接近满额的列，或者点「切到错态」反手再验一次。`,
    };
  }

  return {
    counts,
    laneActive,
    hottestLane,
    inversions,
    orderOk,
    overloadedCols,
    hiddenOverloadedCols,
    activeWip,
    doingIdle,
    bottleneckId,
    bottleneckRatio,
    effThroughput,
    estCycleDays,
    pillars,
    fivePrinciples,
    score,
    diagnosis,
  };
}

// ---------- 第 01 节：五柱骨架（原海报 5 条要点原话 + 透视解析） ----------
export const PILLAR_DOCS = [
  {
    id: "status",
    zh: "状态",
    en: "STATUS",
    quote: "用列表示状态流转，清晰呈现任务当前所处阶段。",
    plain: "把抽象的“进度 60%”翻译成具体位置：待办、进行中、评审中、测试中、已完成。人眼扫一遍列头，不用问任何人就知道事情走到了哪一关。",
    tip: "列的顺序必须严格对应实际流程；一旦某列只能口头解释“其实它算做了一半”，就该拆分或改名。",
  },
  {
    id: "grouping",
    zh: "分组",
    en: "GROUPING",
    quote: "按团队角色或职能分泳道，职责清晰，协作顺畅。",
    plain: "垂直列切开的是“时间阶段”，横向泳道切开的是“谁来接棒”或“业务线”。跨职能团队共用一块看板时，泳道让产品、设计、开发、运维各守一行，卡在哪个部门一眼见底。",
    tip: "泳道一般控制在 2–5 条（经验值）；泳道太细会把页面切碎成大量空单元格。",
  },
  {
    id: "flow",
    zh: "流动",
    en: "FLOW",
    quote: "任务从左向右流动，限制在制品数量，保证节奏稳定。",
    plain: "看板不是待办清单，它是一条单向拉动的河。下游列腾出空位，才能从上游拉进下一张卡；给中间列挂上 WIP 上限，本质是强迫团队先“收尾”再“开新坑”。",
    tip: "一旦某列撞线，团队的正确动作不是临时把上限调大，而是停下来合力帮下游疏通。",
  },
  {
    id: "priority",
    zh: "优先级",
    en: "PRIORITY",
    quote: "用标签与色彩标识优先级，聚焦重要任务，减少干扰。",
    plain: "十二张白底卡片排在一起时，最急的那张和可缓的那张长得一模一样。原海报用了「暖色优先级胶囊 + 几何形状色点」双编码：即便打印成黑白或遇到色弱读者，圆、方、三角依然清晰可辨。",
    tip: "高优先级标签必须稀缺；如果满屏都是红底“高优先级”，等于全都不是高优先级。",
  },
  {
    id: "compare",
    zh: "对比",
    en: "COMPARE",
    quote: "对比各列任务数量与堆积情况，发现瓶颈，及时优化。",
    plain: "看板最值钱的瞬间，是某一列突然拉得老长——比如「评审中」堆成高塔而「测试中」空空荡荡。高度差本身就是最诚实的警报，比周报里的文字总结早一周暴露堵点。",
    tip: "每周复盘时把历史各列积压数量画成累积流图（CFD），就能分清堵车是偶发还是长期结构问题。",
  },
];

// ---------- 第 02 节：利特尔法则 WIP 排队模拟器参数（示意模型） ----------
export const WIP_SIM_MODES = [
  {
    id: "wip1",
    label: "WIP = 1",
    limit: 1,
    capacity: 1.0,
    switchLoss: 0.0,
    note: "极致单件流：单卡等待极短，但一旦唯一任务被外部卡住，整条线就容易空转饿死。",
  },
  {
    id: "wip3",
    label: "WIP = 3",
    limit: 3,
    capacity: 1.55,
    switchLoss: 0.08,
    note: "经验甜区：并行适度、切换损耗低，下游不断粮，平均交付周期稳而短。",
  },
  {
    id: "wip6",
    label: "WIP = 6",
    limit: 6,
    capacity: 1.62,
    switchLoss: 0.28,
    note: "开始拥挤：虽然看起来“人人手头都有活”，但频繁切上下文让单卡排队变慢。",
  },
  {
    id: "wipInf",
    label: "不限流 ∞",
    limit: 12,
    capacity: 1.62,
    switchLoss: 0.52,
    note: "推式爆仓：任务来一个接一个，队列越堆越高，吞吐不升反降，平均周期暴涨。",
  },
];

// ---------- 第 03 节：卡片信息字段解剖台 ----------
export const CARD_FIELDS = [
  { id: "title", label: "标题（任务名称）", core: true, defaultOn: true, px: 26, why: "扫读第一锚点，8–12 字说清动作与对象。" },
  { id: "priority", label: "优先级（高 / 中 / 低）", core: true, defaultOn: true, px: 22, why: "决定同一列里先拉哪一张。" },
  { id: "due", label: "截止时间", core: true, defaultOn: true, px: 18, why: "标明时间预期，临期任务能提前预警。" },
  { id: "owner", label: "负责人", core: true, defaultOn: true, px: 22, why: "明确到人，站会过板不用逐个追问归属。" },
  { id: "tag", label: "标签 / 类型（含形状）", core: true, defaultOn: true, px: 20, why: "便于跨列筛选统计，形状加色彩兼顾色弱识别。" },
  { id: "desc", label: "需求长段背景描述", core: false, defaultOn: true, px: 46, why: "冗余：应放进点开后的详情抽屉，摊在卡面上会把列拉碎。" },
  { id: "meta", label: "工单编号 + 创建日期", core: false, defaultOn: true, px: 22, why: "冗余：日常流转很少按创建日排优，徒增噪点。" },
  { id: "subtasks", label: "5 条子任务清单明细", core: false, defaultOn: false, px: 58, why: "冗余：看板表面只留「3/5」进度即可，展开明细会毁掉全局视野。" },
];

// ---------- 第 04 节：看板历史四代形态（均经权威资料核实） ----------
export const HISTORY_ERAS = [
  {
    id: "toyota1953",
    year: "1953–1954",
    title: "丰田车间与超市拉动卡",
    who: "大野耐一（Taiichi Ohno）· 丰田汽车",
    body: "二战后丰田面临资金紧张与库存积压。工业工程师大野耐一从美国超市“顾客拿走几件，货架才补几件”得到启发：1953 年起在主厂机械加工车间试点以纸质「看板（かんばん）」卡片传递取货与生产指令，丰田官方 75 年史记载 1954 年正式推行“超市法”。核心革新只有一个——把上游硬推（Push）改造成下游按需拉动（Pull）。他在 1978 年日文版、1988 年英文版《丰田生产方式》中完整记录了这套体系。",
    takeaway: "源头不是“画表格”，而是用有限张数的物理卡片，锁死车间的在制品上限。",
  },
  {
    id: "little1961",
    year: "1961",
    title: "排队论为限流写下定理",
    who: "John D. C. Little · Operations Research",
    body: "1961 年，运筹学者 John D. C. Little 在《Operations Research》（第 9 卷第 3 期，383–387 页）发表论文《A Proof for the Queuing Formula: L = λW》，首次严格证明了平稳排队系统中「平均在制品数量 L = 平均到达/吞吐率 λ × 平均停留时间 W」。换成看板语言：只要吞吐率短期不变，往列里多塞一倍在制品，每张卡的平均等待时间就会成倍拉长。",
    takeaway: "给“限制 WIP 反而更快交付”提供了不依赖直觉的数学底座。",
  },
  {
    id: "anderson2010",
    year: "2010",
    title: "从工厂零件走进知识工作",
    who: "David J. Anderson · Blue Hole Press",
    body: "软件与设计任务不像钢板零件那样堆在车间地面上——写到一半的代码、改到一半的稿子藏在电脑里，堵车看不见。2010 年，David J. Anderson 出版《Kanban: Successful Evolutionary Change for Your Technology Business》（俗称“蓝皮书”），把丰田看板系统化迁移到软件研发与知识协作：先可视化现有流程、再限制每列 WIP、接着管理流动与持续改进，不必推倒重来就能渐进演化。",
    takeaway: "看板由此定型为“垂直状态列 + 卡片 + WIP 上限”的现代团队协作方法。",
  },
  {
    id: "trello2011",
    year: "2011",
    title: "多列拖拽成为通用 UI 模式",
    who: "Fog Creek Software · Trello",
    body: "2011 年 9 月，Joel Spolsky 与团队在 TechCrunch Disrupt 推出 Trello，把墙上的物理白板与便签搬进浏览器：横向多列、纵向卡片、直接拖拽流转、多端实时同步。看板布局不再只是制造业或敏捷研发的专有名词，迅速扩散到内容排期、招聘漏斗、销售线索与个人任务管理，成为现代 Web 应用的基础布局范式之一。",
    takeaway: "屏幕上的每一张拖拽卡片，背后都连着七十年前那张限制库存的纸卡片。",
  },
];

// ---------- 第 05 节：什么时候别用看板（4 场景对比 + 兄弟编号直链） ----------
export const ANTI_CASES = [
  {
    id: "calendar",
    scene: "会议室按小时预约 / 演出排期",
    whyBad: "看板的横轴是“阶段”，没有精确的时间刻度。把周二 14:00 和周五 09:30 塞进「待办」列里，根本看不出哪两个时段撞车、哪天全天已满。",
    betterName: "279 日历布局",
    betterUrl: "https://layout.xiaoxiaodong.ai/279/play/",
    betterWhy: "用固定的年/月/周/日时间网格锁死槽位，冲突与空档一眼暴露。",
  },
  {
    id: "table",
    scene: "300 条财务报销单对账与汇总",
    whyBad: "当对象数量上百且需要逐列核对金额、税率、抬头与批量筛选排序时，卡片会变成无止境的纵向长廊，横向对比极其吃力。",
    betterName: "274 数据表格布局",
    betterUrl: "https://layout.xiaoxiaodong.ai/274/play/",
    betterWhy: "对齐的行列网格让数值精度对比、批量勾选、排序与筛选一步到位。",
  },
  {
    id: "timeline",
    scene: "单条主线的年度产品演进大事记",
    whyBad: "讲故事或展示单一对象的历史节点时，事件不会从「待办」拖到「已完成」。强行摆成状态列会打散时间的先后跨度与里程碑节奏。",
    betterName: "277 时间线布局",
    betterUrl: "https://layout.xiaoxiaodong.ai/277/play/",
    betterWhy: "沿着一根连续时间主轴排布里程碑，跨度与因果演进一目了然。",
  },
  {
    id: "dashboard",
    scene: "管理层早会 30 秒看清全局营收与告警",
    whyBad: "看板面向的是“动手推进每一张具体任务”。如果读者只需要看总吞吐趋势、达成率与异常 KPI，翻几十张任务卡只会迷失在细节里。",
    betterName: "273 仪表盘布局",
    betterUrl: "https://layout.xiaoxiaodong.ai/273/play/",
    betterWhy: "用聚合指标卡与趋势图表把全局健康度压进一屏，先看全局再下钻。",
  },
];

// ---------- 第 06 节：盲测练习（四块工整缩微看板，只差队列机制一个变量） ----------
export const PRACTICE_OPTIONS = [
  {
    id: "A",
    correct: false,
    cols: [
      { name: "待办", count: 4, limit: null },
      { name: "评审中", count: 3, limit: 3 },
      { name: "进行中", count: 3, limit: 4 },
      { name: "测试中", count: 2, limit: 3 },
      { name: "已完成", count: 2, limit: null },
    ],
    verdictTitle: "选 A：限流很工整，但列序放反了",
    verdictBody: "A 块的每列上限都没超标、外观也很整齐，但仔细看列头：第 2 列「评审中」排在了第 3 列「进行中」前面。流向违背真实工作顺序，卡片必须来回倒流，看板失去了从左到右推进的直觉。",
  },
  {
    id: "B",
    correct: true,
    cols: [
      { name: "待办", count: 4, limit: null },
      { name: "进行中", count: 4, limit: 4 },
      { name: "评审中", count: 2, limit: 3 },
      { name: "测试中", count: 2, limit: 3 },
      { name: "已完成", count: 2, limit: null },
    ],
    verdictTitle: "选对了：B 块兼顾了顺行流程、明确粒度与 WIP 刹车",
    verdictBody: "B 块 5 列严格按「待办 → 进行中 → 评审中 → 测试中 → 已完成」单向排列；三个活动列全部标出了在制品上限且当前都在限额内（进行中 4/4 已满，提醒团队先帮下游腾位再开新任务），瓶颈一露头就能看见。",
  },
  {
    id: "C",
    correct: false,
    cols: [
      { name: "待办", count: 2, limit: null },
      { name: "进行中", count: 8, limit: null },
      { name: "评审中", count: 1, limit: null },
      { name: "测试中", count: 1, limit: null },
      { name: "已完成", count: 2, limit: null },
    ],
    verdictTitle: "选 C：列序对了，但缺少 WIP 上限已隐性爆仓",
    verdictBody: "C 块的 5 列顺序完全正确，却没有设定任何在制品上限：5 人团队的「进行中」已经悄悄堆进 8 张卡，下游评审和测试却各只有 1 张。没有红线刹车，看板就退化成了堆任务的停车场。",
  },
  {
    id: "D",
    correct: false,
    cols: [
      { name: "待办", count: 3, limit: null },
      { name: "处理中", count: 9, limit: 10 },
      { name: "已完成", count: 2, limit: null },
    ],
    verdictTitle: "选 D：中间状态揉成一团，掩盖了真实瓶颈",
    verdictBody: "D 块虽然写了 9/10 上限，但把开发、评审、测试全塞进了单一的「处理中」大列里。9 张半成品究竟是写代码慢、评审没人看还是测试返工？从这块板上根本读不出来。",
  },
];
