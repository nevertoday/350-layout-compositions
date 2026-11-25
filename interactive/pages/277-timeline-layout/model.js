// 277 时间线布局（TIMELINE LAYOUT）单一真源数学模型
// 所有位置坐标、逆序检测、撞车净距、游标定位、四柱验收与各节实验数据均由本模块统一计算。

export const PHASES = [
  { id: 0, name: "准备阶段", en: "PREPARATION", color: "#A11B24", ink: "#FFFFFF" },
  { id: 1, name: "实施阶段", en: "EXECUTION", color: "#C64C35", ink: "#FFFFFF" },
  { id: 2, name: "收尾阶段", en: "CLOSURE", color: "#A81B1E", ink: "#FFFFFF" },
];

// 原海报 5 站完整数据集（文案直接取自 277 号原海报）
export const POSTER_STATIONS_5 = [
  {
    id: 1,
    num: "01",
    stage: "启动",
    subtitle: "明确目标",
    body: "确定项目目标与范围，对齐团队方向，奠定整体基础。",
    day: 1,
    dateLabel: "第 1 天",
    phase: 0,
    icon: "bulb",
    medallionBg: "#A11B24",
    cardHeadBg: "#9F1820",
    cardHeadInk: "#FFFFFF",
  },
  {
    id: 2,
    num: "02",
    stage: "规划",
    subtitle: "制定策略",
    body: "梳理关键任务与资源，制定实施计划与时间安排。",
    day: 6,
    dateLabel: "第 6 天",
    phase: 0,
    icon: "pencil",
    medallionBg: "#DF4E42",
    cardHeadBg: "#C83632",
    cardHeadInk: "#FFFFFF",
  },
  {
    id: 3,
    num: "03",
    stage: "执行",
    subtitle: "推进落地",
    body: "按计划执行任务，协同配合，确保进度与质量可控。",
    day: 12,
    dateLabel: "第 12 天",
    phase: 1,
    icon: "gear",
    medallionBg: "#E87C63",
    cardHeadBg: "#EA8469",
    cardHeadInk: "#3A080C",
  },
  {
    id: 4,
    num: "04",
    stage: "优化",
    subtitle: "迭代改进",
    body: "基于反馈进行分析与优化，持续提升方案与效果。",
    day: 19,
    dateLabel: "第 19 天",
    phase: 1,
    icon: "rocket",
    medallionBg: "#EE9E74",
    cardHeadBg: "#F2AE83",
    cardHeadInk: "#3A080C",
  },
  {
    id: 5,
    num: "05",
    stage: "复盘",
    subtitle: "总结沉淀",
    body: "回顾成果与不足，沉淀经验，形成可复用的方法与知识。",
    day: 60,
    dateLabel: "第 60 天",
    phase: 2,
    icon: "trophy",
    medallionBg: "#A81B1E",
    cardHeadBg: "#A4191D",
    cardHeadInk: "#FFFFFF",
  },
];

// 2 站过粗集：抽空全部中间过程
export const STATIONS_2 = [
  POSTER_STATIONS_5[0],
  POSTER_STATIONS_5[4],
];

// 7 站详版集：仍在 5–7 经验舒适带内
export const STATIONS_7 = [
  { ...POSTER_STATIONS_5[0], day: 1, dateLabel: "第 1 天" },
  {
    id: 15,
    num: "02",
    stage: "调研",
    subtitle: "收集需求",
    body: "访谈核心用户，盘点约束条件与风险清单。",
    day: 4,
    dateLabel: "第 4 天",
    phase: 0,
    icon: "search",
    medallionBg: "#C73533",
    cardHeadBg: "#B62B2B",
    cardHeadInk: "#FFFFFF",
  },
  { ...POSTER_STATIONS_5[1], num: "03", day: 8, dateLabel: "第 8 天" },
  {
    id: 25,
    num: "04",
    stage: "原型",
    subtitle: "验证流程",
    body: "搭建低保真原型并完成核心链路走查。",
    day: 12,
    dateLabel: "第 12 天",
    phase: 1,
    icon: "layers",
    medallionBg: "#E66F58",
    cardHeadBg: "#E77A62",
    cardHeadInk: "#3A080C",
  },
  { ...POSTER_STATIONS_5[2], num: "05", day: 17, dateLabel: "第 17 天" },
  { ...POSTER_STATIONS_5[3], num: "06", day: 24, dateLabel: "第 24 天" },
  { ...POSTER_STATIONS_5[4], num: "07", day: 60, dateLabel: "第 60 天" },
];

// 9 站碎片过载集：把琐碎动作摊满主轴
export const STATIONS_9 = [
  { id: 1, num: "01", stage: "建群", subtitle: "拉齐名单", body: "新建项目沟通群并同步日程。", day: 1, dateLabel: "D1", phase: 0, icon: "bulb", medallionBg: "#A11B24", cardHeadBg: "#9F1820", cardHeadInk: "#FFFFFF" },
  { id: 2, num: "02", stage: "启动", subtitle: "明确目标", body: "确定项目目标与范围边界。", day: 3, dateLabel: "D3", phase: 0, icon: "flag", medallionBg: "#B6282B", cardHeadBg: "#B6282B", cardHeadInk: "#FFFFFF" },
  { id: 3, num: "03", stage: "规划", subtitle: "拆解任务", body: "列出排期表与负责人清单。", day: 6, dateLabel: "D6", phase: 0, icon: "pencil", medallionBg: "#CE3A34", cardHeadBg: "#C83632", cardHeadInk: "#FFFFFF" },
  { id: 4, num: "04", stage: "选字", subtitle: "定色板", body: "确认主色与标题字重规范。", day: 9, dateLabel: "D9", phase: 1, icon: "layers", medallionBg: "#DF5747", cardHeadBg: "#DF5747", cardHeadInk: "#FFFFFF" },
  { id: 5, num: "05", stage: "开发", subtitle: "编码联调", body: "实现主干模块并接通数据。", day: 12, dateLabel: "D12", phase: 1, icon: "gear", medallionBg: "#E87C63", cardHeadBg: "#EA8469", cardHeadInk: "#3A080C" },
  { id: 6, num: "06", stage: "修角", subtitle: "调间距", body: "微调按钮圆角与卡片阴影。", day: 15, dateLabel: "D15", phase: 1, icon: "wrench", medallionBg: "#EB8D6C", cardHeadBg: "#EE9576", cardHeadInk: "#3A080C" },
  { id: 7, num: "07", stage: "优化", subtitle: "迭代改进", body: "依据内测反馈压缩首屏耗时。", day: 19, dateLabel: "D19", phase: 1, icon: "rocket", medallionBg: "#EE9E74", cardHeadBg: "#F2AE83", cardHeadInk: "#3A080C" },
  { id: 8, num: "08", stage: "发版", subtitle: "推送上线", body: "全量发布并发送更新通知。", day: 44, dateLabel: "D44", phase: 2, icon: "check", medallionBg: "#C53A30", cardHeadBg: "#C2362E", cardHeadInk: "#FFFFFF" },
  { id: 9, num: "09", stage: "复盘", subtitle: "总结沉淀", body: "整理复盘纪要并归档模板。", day: 60, dateLabel: "D60", phase: 2, icon: "trophy", medallionBg: "#A81B1E", cardHeadBg: "#A4191D", cardHeadInk: "#FFFFFF" },
];

export function stationsForGranularity(g) {
  if (g === 2) return STATIONS_2;
  if (g === 7) return STATIONS_7;
  if (g === 9) return STATIONS_9;
  return POSTER_STATIONS_5;
}

// 初始翻车错态（0/4 待理顺，绝不预先给答案）
export function createBrokenHeroState() {
  return {
    granularity: 5,
    order: [0, 3, 2, 1, 4], // 04 优化与 02 规划颠倒！
    spineMode: "broken",    // 断链散卡
    scaleMode: "clustered", // 真实日期挤堆（D1, D6, D12, D19 挤在左 31%，D60 甩在最右）
    focusMode: "off",       // 五站同色平权，看不出当前推进到哪一站
    phaseBar: false,        // 隐藏底部三段宏阶段归组带
    playhead: 0.42,         // 0..1 连续可拖游标
    selectedSlot: -1,       // 点击卡片互换顺序时的选中槽位
  };
}

export function orderedIndices(n) {
  return Array.from({ length: n }, (_, i) => i);
}

// 计算每个槽位在主轴上的归一化水平位置 x (0..1)
// 所有画布绘制与诊断读数共享同一套坐标计算，确保 100% 单一真源
export function computeSpinePositions(items, scaleMode) {
  const n = items.length;
  if (n <= 1) return { xs: [0.5], hasBreak: false, breakGap: null };
  const days = items.map((it) => it.day);
  const minD = Math.min(...days);
  const maxD = Math.max(...days);
  const span = Math.max(1, maxD - minD);

  if (scaleMode === "even") {
    const xs = items.map((_, i) => i / (n - 1));
    return { xs, hasBreak: false, breakGap: null };
  }

  if (scaleMode === "clustered") {
    // 严格按真实日期比例映射：若时序被打乱，先按原时间点计算槽位或按该卡真实日期定位
    // 为保证槽位在主轴上仍自左向右排开并暴露前紧后空，取排序后日期分布赋予每个槽位
    const sortedDays = [...days].sort((a, b) => a - b);
    const xs = sortedDays.map((d) => (d - minD) / span);
    return { xs, hasBreak: false, breakGap: null };
  }

  // "broken-axis"（断轴压缩：检测超过 40% 总跨度的长空白，将其压缩为 26% 带断轴符号的桥段）
  const sortedDays = [...days].sort((a, b) => a - b);
  let maxGapIdx = -1;
  let maxGapVal = 0;
  for (let i = 0; i < n - 1; i++) {
    const g = sortedDays[i + 1] - sortedDays[i];
    if (g > maxGapVal) {
      maxGapVal = g;
      maxGapIdx = i;
    }
  }
  if (maxGapIdx >= 0 && maxGapVal / span >= 0.35 && n >= 3) {
    const breakWidth = 0.28;
    const remainW = 1 - breakWidth;
    const activeSpan = Math.max(1, span - maxGapVal);
    const xs = [0];
    for (let i = 1; i < n; i++) {
      const g = sortedDays[i] - sortedDays[i - 1];
      if (i - 1 === maxGapIdx) {
        xs.push(xs[i - 1] + breakWidth);
      } else {
        // 给小跨度加轻度保底最小步进，保证可读同时保持前后真实比例感
        const prop = (g / activeSpan) * remainW;
        xs.push(xs[i - 1] + prop);
      }
    }
    const end = xs[n - 1] || 1;
    const norm = xs.map((v) => v / end);
    return {
      xs: norm,
      hasBreak: true,
      breakGap: {
        leftIdx: maxGapIdx,
        rightIdx: maxGapIdx + 1,
        x0: norm[maxGapIdx],
        x1: norm[maxGapIdx + 1],
        daysSkipped: maxGapVal,
      },
    };
  }

  const xs = items.map((_, i) => i / (n - 1));
  return { xs, hasBreak: false, breakGap: null };
}

// 综合评测当前开场时间轴的所有指标与四柱状态
export function evaluateHero(state, stageWidth = 960) {
  const base = stationsForGranularity(state.granularity);
  const order = state.order.length === base.length ? state.order : orderedIndices(base.length);
  const items = order.map((idx, slot) => ({ ...base[idx], slot, origIdx: idx }));
  const n = items.length;

  // 1. 时序逆序检测
  let inversions = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (items[i].day > items[j].day) inversions++;
    }
  }
  const reversals = [];
  let totalBackDays = 0;
  for (let i = 0; i < n - 1; i++) {
    if (items[i + 1].day < items[i].day) {
      const delta = items[i].day - items[i + 1].day;
      totalBackDays += delta;
      reversals.push({
        fromSlot: i,
        toSlot: i + 1,
        fromNum: items[i].num,
        toNum: items[i + 1].num,
        fromDay: items[i].day,
        toDay: items[i + 1].day,
        deltaDays: delta,
      });
    }
  }

  // 2. 坐标与净隙碰撞检测
  const { xs, hasBreak, breakGap } = computeSpinePositions(items, state.scaleMode);
  const trackPx = Math.max(260, stageWidth - 112);
  const medallionDiamPx = stageWidth < 520 ? 36 : 50;
  const safeGapPx = medallionDiamPx + 14;

  let minGapPct = 100;
  let maxGapPct = 0;
  let collisions = 0;
  const collidedPairs = [];
  for (let i = 0; i < n - 1; i++) {
    const gap = xs[i + 1] - xs[i];
    const gapPct = gap * 100;
    if (gapPct < minGapPct) minGapPct = gapPct;
    if (gapPct > maxGapPct) maxGapPct = gapPct;
    const gapPx = gap * trackPx;
    if (gapPx < safeGapPx || (state.scaleMode === "clustered" && gapPct < 13 && n >= 5)) {
      collisions++;
      collidedPairs.push([i, i + 1]);
    }
  }

  // 3. 游标对应的当前活跃节点与时间值
  const p = Math.max(0, Math.min(1, state.playhead));
  let activeSlot = 0;
  let bestDist = Infinity;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(xs[i] - p);
    if (d < bestDist) {
      bestDist = d;
      activeSlot = i;
    }
  }
  // 在相邻节点间插值算出游标所在真实天数
  let scrubDay = items[0].day;
  for (let i = 0; i < n - 1; i++) {
    if (p >= xs[i] && p <= xs[i + 1]) {
      const seg = Math.max(0.0001, xs[i + 1] - xs[i]);
      const ratio = (p - xs[i]) / seg;
      scrubDay = Math.round(items[i].day + (items[i + 1].day - items[i].day) * ratio);
      break;
    }
    if (p > xs[n - 1]) scrubDay = items[n - 1].day;
  }

  // 4. 阶段归组是否连续（检测是否因乱序导致准备/实施/收尾交错撕裂）
  let phaseBreaks = 0;
  for (let i = 0; i < n - 1; i++) {
    if (items[i + 1].phase < items[i].phase) phaseBreaks++;
  }

  // 5. 四柱验收（严格对应原海报 4 条布局要点）
  const granularityOk = n >= 5 && n <= 7;
  const sequenceOk = inversions === 0 && state.spineMode === "directed";
  const milestoneOk = granularityOk && state.focusMode === "on";
  const continuityOk = state.spineMode !== "broken" && state.scaleMode !== "clustered" && collisions === 0;
  const rhythmOk = state.phaseBar && granularityOk && phaseBreaks === 0 && state.scaleMode !== "clustered";

  const pillars = {
    sequence: {
      ok: sequenceOk,
      tag: inversions > 0 ? `逆序 ${inversions} 处` : state.spineMode !== "directed" ? "缺方向箭" : "顺向清晰",
    },
    milestone: {
      ok: milestoneOk,
      tag: !granularityOk
        ? (n < 5 ? `${n} 站过粗` : `${n} 站过载`)
        : state.focusMode !== "on"
          ? "五站平权"
          : `${n} 站·焦标开`,
    },
    continuity: {
      ok: continuityOk,
      tag: state.spineMode === "broken"
        ? "主轴断链"
        : state.scaleMode === "clustered" || collisions > 0
          ? `挤堆 ${collisions} 处`
          : hasBreak ? "断轴贯通" : "均距贯通",
    },
    rhythm: {
      ok: rhythmOk,
      tag: !granularityOk
        ? (n < 5 ? "过程塌缩" : "卡片拥挤")
        : !state.phaseBar
          ? "未归阶段"
          : phaseBreaks > 0
            ? "阶段交错"
            : state.scaleMode === "clustered"
              ? "留白失衡"
              : "三段有致",
    },
  };

  // 原海报 5 枚椭圆关键词胶囊的实时状态
  const keywords = {
    SEQUENCE: inversions === 0,
    PROGRESSION: state.focusMode === "on" && state.spineMode === "directed",
    MILESTONE: granularityOk && state.focusMode === "on",
    RHYTHM: rhythmOk,
    CONTINUITY: continuityOk && state.spineMode === "directed",
  };

  const score = [sequenceOk, milestoneOk, continuityOk, rhythmOk].filter(Boolean).length;

  // 6. 单一真源白话诊单（按最严重错态优先指明「为什么」与「下一步怎么做」）
  let diagnosis = {
    badge: "已校准 · 4 / 4",
    level: "pass",
    headline: "主轴贯通、时序顺流，一眼看清走到哪一站",
    detail: `当前 ${n} 个节点严格按第 ${items[0].day} 天到第 ${items[n - 1].day} 天顺向推进，最小节点净距 ${minGapPct.toFixed(0)}%${hasBreak ? `（长空白处以断轴省略 ${breakGap.daysSkipped} 天）` : ""}，进度焦标锁定「${items[activeSlot].num} ${items[activeSlot].stage}」，底部三段阶段带把节点收束成 3 组记忆块。`,
    action: "拖动主轴红色游标体验顺向推演，或试着点「2 站过粗 / 9 站碎片 / 失真挤堆」反推错态。",
  };

  if (inversions > 0) {
    const rev = reversals[0];
    diagnosis = {
      badge: `错态 · 时序倒流 (${score} / 4)`,
      level: "error",
      headline: `第 ${rev.fromSlot + 1} 站到第 ${rev.toSlot + 1} 站发生时间倒流（-${rev.deltaDays} 天）`,
      detail: `当前「${rev.fromNum}（第 ${rev.fromDay} 天）」排在了「${rev.toNum}（第 ${rev.toDay} 天）」前面，整条轴存在 ${inversions} 处逆序。大脑默认沿主轴向右即向未来推进，空间方向与日期打架会瞬间摧毁叙事可信度。`,
      action: "点击舞台里任意两张错位卡片互换顺序（或点卡片上的 ← → 按钮），把 01 → 02 → 03 → 04 → 05 理顺。",
    };
  } else if (state.spineMode === "broken") {
    diagnosis = {
      badge: `错态 · 主轴断连 (${score} / 4)`,
      level: "error",
      headline: "抽掉了主轴连线，时间线退化成一排散卡",
      detail: "顺序虽然排对了，但五张卡悬在半空互不相连，读者第一眼会把它当成并列的普通卡片网格（270），而不是前后因果相继的过程。",
      action: "在操控区把「主轴连接」切到「有向主轴」，重新串起起点帽、推进箭头与终点指向。",
    };
  } else if (state.spineMode === "undirected") {
    diagnosis = {
      badge: `错态 · 缺少方向 (${score} / 4)`,
      level: "warn",
      headline: "连线有了，但没有起点与箭头方向",
      detail: "一条光秃秃的横线只表示「有关联」，并不明确告知「从左往右演进」。加上起点标识、>>> 推进符与终点箭头，读者的视线才会沿单一方向流动。",
      action: "把「主轴连接」从「无向实线」切到「有向主轴」。",
    };
  } else if (!granularityOk) {
    if (n < 5) {
      diagnosis = {
        badge: `错态 · 节点过粗 (${score} / 4)`,
        level: "error",
        headline: `只剩 ${n} 个节点，中间推进过程被一刀抹平`,
        detail: "从第 1 天直接跳到第 60 天，看不出规划、执行与迭代的分水岭，时间线退化成了简单的「前后对比」，失去了呈现阶段性进展的价值。",
        action: "将「节点粒度」调回 5 站（原海报标准）或 7 站（详版），落在 5–7 站经验舒适带。",
      };
    } else {
      diagnosis = {
        badge: `错态 · 碎片过载 (${score} / 4)`,
        level: "error",
        headline: `${n} 站细碎动作塞满主轴，卡片被压成窄条`,
        detail: `最小节点间距被挤到仅 ${minGapPct.toFixed(0)}%，把「建群」「选字」「修圆角」等琐碎动作和核心里程碑平铺在一起，超过单屏 5–7 站聚焦上限，读者抓不住重点。`,
        action: "把「节点粒度」收拢到 5 站或 7 站，把细碎步骤藏进阶段展开层里。",
      };
    }
  } else if (state.scaleMode === "clustered") {
    diagnosis = {
      badge: `错态 · 刻度挤堆 (${score} / 4)`,
      level: "error",
      headline: `前 ${n - 1} 站挤在左 31% 撞肩，右侧空出 ${maxGapPct.toFixed(0)}% 荒原`,
      detail: `第 1 到第 19 天连着 4 个关键节点，最小间距仅剩 ${minGapPct.toFixed(0)}%（撞车 ${collisions} 处），而第 19 天到第 60 天空白拉长到整轴近七成。硬套真实日期等比会把信息压死。`,
      action: "将「时间刻度」切到「节奏均分」（重阅读流畅）或「断轴压缩」（保真实比例又防撞车）。",
    };
  } else if (state.focusMode === "off") {
    diagnosis = {
      badge: `错态 · 五站平权 (${score} / 4)`,
      level: "warn",
      headline: "五张卡片权重相同，看不出此刻停在哪一站",
      detail: "时间线不仅是历史回顾，更是进度坐标。缺少「已完成 / 进行中 / 待启动」的视觉分层，用户扫完五张卡仍然回答不了「现在做到哪了」。",
      action: "开启「当前进度焦标」，再拖动主轴红色游标感受活跃节点的实时聚焦。",
    };
  } else if (!state.phaseBar) {
    diagnosis = {
      badge: `差一步 · 未归组 (${score} / 4)`,
      level: "warn",
      headline: "单层节点平铺，缺少宏观阶段收束",
      detail: "开启底部「准备阶段 → 实施阶段 → 收尾阶段」三段宏阶段带后，大脑先把 5–7 个节点打包成 3 个组块，再逐站阅读，扫描速度明显更快。",
      action: "点亮「三段阶段带」，补齐原海报的完整两级节奏骨架。",
    };
  }

  return {
    items,
    xs,
    hasBreak,
    breakGap,
    inversions,
    reversals,
    totalBackDays,
    minGapPct,
    maxGapPct,
    collisions,
    collidedPairs,
    activeSlot,
    scrubDay,
    phaseBreaks,
    pillars,
    keywords,
    score,
    diagnosis,
  };
}

// =========================================================================
// 02 节：刻度变形实验室单一真源模型（180 天真实发版数据）
// =========================================================================
export const SCALE_LAB_EVENTS = [
  { id: "e1", day: 1, label: "D1 立项", phase: 0 },
  { id: "e2", day: 5, label: "D5 原型", phase: 0 },
  { id: "e3", day: 11, label: "D11 评审", phase: 1 },
  { id: "e4", day: 18, label: "D18 联调", phase: 1 },
  { id: "e5", day: 24, label: "D24 内测", phase: 1 },
  { id: "e6", day: 180, label: "D180 正式发布", phase: 2 },
];

export function evaluateScaleLab(blend, axisBreak) {
  const events = SCALE_LAB_EVENTS;
  const n = events.length;
  const minD = events[0].day;
  const maxD = events[n - 1].day;
  const span = maxD - minD; // 179 天

  // 真实线性位置 vs 视觉等距位置
  const linearXs = events.map((e) => (e.day - minD) / span);
  const evenXs = events.map((_, i) => i / (n - 1));

  // 若启用断轴：把 D24 → D180（156 天等待）压缩成 24% 断轴区，前 5 站按真实日比例铺满左 76%
  const breakXs = (() => {
    const preSpan = events[n - 2].day - minD; // 23 天
    const leftRatio = 0.74;
    return events.map((e, i) => (i === n - 1 ? 1 : ((e.day - minD) / preSpan) * leftRatio));
  })();

  const baseXs = axisBreak ? breakXs : linearXs;
  const xs = baseXs.map((bx, i) => bx * (1 - blend) + evenXs[i] * blend);

  let collisions = 0;
  let minGapPct = 100;
  let maxGapPct = 0;
  for (let i = 0; i < n - 1; i++) {
    const gapPct = (xs[i + 1] - xs[i]) * 100;
    if (gapPct < minGapPct) minGapPct = gapPct;
    if (gapPct > maxGapPct) maxGapPct = gapPct;
    if (gapPct < 10.5) collisions++;
  }

  // 示意时间错觉等级（不做伪精确百分比，用明确档位！）
  const lastGapVisual = (xs[n - 1] - xs[n - 2]) * 100;
  const lastGapReal = ((events[n - 1].day - events[n - 2].day) / span) * 100; // 87.2%
  let scaleTier = "真实比例（严重挤堆）";
  let verdict = `前 5 站被压进左侧 ${(xs[4] * 100).toFixed(0)}% 宽度，出现 ${collisions} 处标签撞车；右侧 156 天等待拖出 ${lastGapVisual.toFixed(0)}% 荒原。`;

  if (axisBreak && blend < 0.35) {
    scaleTier = "断轴兼顾（推荐）";
    verdict = `在 D24 与 D180 之间插入「// 省略 156 天」断轴后，前 5 站保留真实日距（最小净距 ${minGapPct.toFixed(0)}%，0 撞车），同时诚实提醒读者右段跨越了 5 个月。`;
  } else if (axisBreak && blend >= 0.35) {
    scaleTier = "断轴 + 节奏微调";
    verdict = `既借断轴交代了 156 天长间隔，又温和拉开紧凑节点（最小净距 ${minGapPct.toFixed(0)}%，0 撞车），兼顾阅读与诚实。`;
  } else if (collisions > 0) {
    scaleTier = blend < 0.15 ? "严格等比（撞车）" : "半混合（仍偏挤）";
    verdict = `最小节点间距仅 ${minGapPct.toFixed(0)}%（仍有 ${collisions} 处撞车），右侧空白占去 ${lastGapVisual.toFixed(0)}%。继续向右调匀，或打开「插入断轴 //」。`;
  } else if (blend > 0.8) {
    scaleTier = "纯视觉等距（隐藏跨度差）";
    verdict = `6 个节点按 ${minGapPct.toFixed(0)}% 均匀呼吸、零撞车；但 D24→D180 的 156 天与 D1→D5 的 4 天看起来一样宽（真实占比 ${lastGapReal.toFixed(0)}% 被压成 ${lastGapVisual.toFixed(0)}%），必须用清晰日期标尺或断轴提示，避免误导。`;
  } else {
    scaleTier = "温和拉伸（折中）";
    verdict = `节点撞车已解除（最小净距 ${minGapPct.toFixed(0)}%），但未标断轴时读者仍易低估末段长达 156 天的跨度。`;
  }

  return { events, xs, collisions, minGapPct, maxGapPct, scaleTier, verdict, axisBreak };
}

// =========================================================================
// 03 节：15 节点两级折叠器（修正原海报「5–7 节点」TIPS）
// =========================================================================
export const CHUNK_GROUPS = [
  {
    id: "prep",
    phase: 0,
    title: "准备阶段",
    range: "第 1–2 周",
    summary: "目标对齐与架构立项",
    events: [
      { id: "c1", code: "01", title: "业务目标访谈", date: "W1·周一" },
      { id: "c2", code: "02", title: "竞品与约束梳理", date: "W1·周四" },
      { id: "c3", code: "03", title: "需求范围签字冻结", date: "W2·周二" },
      { id: "c4", code: "04", title: "排期与资源锁定", date: "W2·周五" },
    ],
  },
  {
    id: "exec",
    phase: 1,
    title: "实施阶段",
    range: "第 3–7 周",
    summary: "设计开发与两轮内测迭代",
    events: [
      { id: "c5", code: "05", title: "核心流程原型走查", date: "W3·周二" },
      { id: "c6", code: "06", title: "视觉与组件规范定稿", date: "W3·周五" },
      { id: "c7", code: "07", title: "前端与接口联调", date: "W4·周四" },
      { id: "c8", code: "08", title: "首轮内部可用性测试", date: "W5·周三" },
      { id: "c9", code: "09", title: "高优缺陷与性能压测", date: "W6·周二" },
      { id: "c10", code: "10", title: "灰度 10% 用户放量", date: "W6·周五" },
      { id: "c11", code: "11", title: "埋点回流与体验精修", date: "W7·周三" },
    ],
  },
  {
    id: "close",
    phase: 2,
    title: "收尾阶段",
    range: "第 8–9 周",
    summary: "正式上线、复盘与资产沉淀",
    events: [
      { id: "c12", code: "12", title: "全量发布与监控值守", date: "W8·周一" },
      { id: "c13", code: "13", title: "首周留存数据核验", date: "W8·周五" },
      { id: "c14", code: "14", title: "跨团队复盘会议", date: "W9·周二" },
      { id: "c15", code: "15", title: "模板与手册归档沉淀", date: "W9·周五" },
    ],
  },
];

export function evaluateChunkLab(openIds) {
  const totalEvents = CHUNK_GROUPS.reduce((s, g) => s + g.events.length, 0);
  const openSet = new Set(openIds);
  const expandedEvents = CHUNK_GROUPS.reduce((s, g) => s + (openSet.has(g.id) ? g.events.length : 0), 0);
  const openGroups = openSet.size;
  // 当前视口顶层组块 = 3 个宏阶段；同时摊开的细项数 = expandedEvents
  let loadTier = "舒适聚焦";
  let verdict = "";
  if (openGroups === 0) {
    loadTier = "宏观总览（3 组块）";
    verdict = "全部折叠后顶层仅 3 个宏阶段，稳落在 Cowan（2001）约 3–5 组块的注意焦点内，一眼看清全局而不丢 15 项明细入口。";
  } else if (openGroups === 1) {
    const active = CHUNK_GROUPS.find((g) => openSet.has(g.id));
    loadTier = `分层聚焦（3 组 + ${expandedEvents} 细项）`;
    verdict = `只展开「${active.title}」的 ${expandedEvents} 个里程碑，其余 ${totalEvents - expandedEvents} 项收起在相邻阶段胶囊里——既没删掉真实进度，又把单屏认知负荷控在舒适区。`;
  } else if (openGroups === 2) {
    loadTier = `偏满（同时展开 ${expandedEvents} 项）`;
    verdict = `同时打开 2 个阶段露出 ${expandedEvents} 条记录，跨阶段对照尚可，但已开始出现上下滚屏查找。`;
  } else {
    loadTier = `全量平铺（${totalEvents} 项过载）`;
    verdict = `把全部 ${totalEvents} 项一股脑摊开在同一层级，远超单屏 5–7 站与短时记忆组块上限；读者既记不住全貌，也找不到此刻重点。`;
  }
  return { totalEvents, expandedEvents, openGroups, loadTier, verdict };
}

// =========================================================================
// 04 节：横轴 vs 纵轴（4 大原海报场景 × 容器宽度实算）
// =========================================================================
export const SCENARIOS = [
  {
    id: "pm",
    name: "项目管理",
    posterNote: "展示项目阶段与关键节点",
    items: [
      { tag: "W1", title: "需求冻结", desc: "对齐核心 KPI 与交付边界，签字立项。", state: "done" },
      { tag: "W3", title: "设计评审", desc: "完成全链路交互稿与异常态走查。", state: "done" },
      { tag: "W6", title: "开发联调", desc: "前后端联调接口，完成自动化冒烟。", state: "active" },
      { tag: "W8", title: "验收发版", desc: "灰度观测指标无误后全量上线。", state: "todo" },
      { tag: "W9", title: "项目复盘", desc: "沉淀可复用模板与风险台账。", state: "todo" },
    ],
  },
  {
    id: "roadmap",
    name: "产品路线图",
    posterNote: "呈现版本迭代与功能规划",
    items: [
      { tag: "Q1", title: "v1.0 核心闭环", desc: "打通账号、基础工作区与导出链路。", state: "done" },
      { tag: "Q2", title: "v1.5 团队协作", desc: "支持多人评论、权限分级与审批。", state: "active" },
      { tag: "Q3", title: "v2.0 插件生态", desc: "开放 API 与第三方 Webhook 接入。", state: "todo" },
      { tag: "Q4", title: "v2.5 移动离线", desc: "补齐弱网离线编辑与增量同步。", state: "todo" },
      { tag: "次年", title: "v3.0 企业版", desc: "私有化部署与审计日志体系。", state: "todo" },
    ],
  },
  {
    id: "retro",
    name: "事件回顾",
    posterNote: "梳理事件发展与重要时刻",
    items: [
      { tag: "09:10", title: "告警触发", desc: "核心接口 P99 延迟突增至 4.2 秒。", state: "done" },
      { tag: "09:22", title: "定位根因", desc: "排查锁定缓存击穿导致连接池耗尽。", state: "done" },
      { tag: "09:38", title: "降级止血", desc: "切至静态兜底页并限流保护主库。", state: "done" },
      { tag: "10:15", title: "服务恢复", desc: "热补丁发布，核心链路恢复常态。", state: "done" },
      { tag: "次日", title: "根因改进", desc: "补齐熔断阈值与压测演练机制。", state: "active" },
    ],
  },
  {
    id: "learning",
    name: "学习路径",
    posterNote: "规划学习进度与能力成长",
    items: [
      { tag: "阶段 1", title: "排版基础", desc: "建立对齐、留白与字号层级直觉。", state: "done" },
      { tag: "阶段 2", title: "栅格系统", desc: "掌握 12 栏网格与响应式断点规律。", state: "done" },
      { tag: "阶段 3", title: "界面模式", desc: "辨别时间线、看板与日历的适用界限。", state: "active" },
      { tag: "阶段 4", title: "无障碍规范", desc: "落实语义标签、对比度与键盘导航。", state: "todo" },
      { tag: "阶段 5", title: "项目实战", desc: "独立交付完整设计系统与组件文档。", state: "todo" },
    ],
  },
];

export function evaluateOrientation(widthPx, mode) {
  const n = 5;
  const horizontalSlotPx = Math.round((widthPx - 32 - (n - 1) * 10) / n);
  const charsPerLineH = Math.max(2, Math.floor((horizontalSlotPx - 16) / 13));
  let status = "ok";
  let headline = "";
  let detail = "";

  if (mode === "horizontal") {
    if (widthPx < 560) {
      status = "error";
      headline = `屏宽 ${widthPx}px 强行横排：每站仅分得 ${horizontalSlotPx}px，正文被迫每行只装约 ${charsPerLineH} 个字`;
      detail = "手机竖屏硬塞 5 列横向时间线，卡片被压成竖直细条，文字断行碎裂、极易横向溢出；此时必须转为左轴右文的纵向时间线。";
    } else if (widthPx < 780) {
      status = "warn";
      headline = `平板窄幅（${widthPx}px）横排偏紧：单卡宽 ${horizontalSlotPx}px`;
      detail = "短标题尚能一屏看全，但 15 字以上的说明文字会折成 4–5 行；长文案场景建议提前切纵轴。";
    } else {
      status = "ok";
      headline = `宽屏（${widthPx}px）横排舒展：单卡宽 ${horizontalSlotPx}px，一屏尽览 5 站全貌`;
      detail = "水平推进天然契合从左到右的阅读习惯，适合展示 5–7 个节点简明文案的宏阶段路线图。";
    }
  } else if (mode === "vertical-left") {
    status = "ok";
    headline = `左轴右文纵排（${widthPx}px）：主轴贴左锚定，眼球只需单向垂直下扫`;
    detail = "无论在 360px 手机还是 960px 桌面，左侧时间脊线永远保持同一垂直基线，说明文本拥有完整宽幅，也能无缝向下无限追加新事件。";
  } else {
    // vertical-zigzag
    if (widthPx < 600) {
      status = "error";
      headline = `窄屏（${widthPx}px）用左右交替纵轴：左右每侧被劈成不到 ${Math.round((widthPx - 56) / 2)}px`;
      detail = "中轴两侧空间腰斩，视线还要反复左右「之字形」跳读，在手机与长文本日志里最耗眼力。";
    } else {
      status = "warn";
      headline = `宽屏（${widthPx}px）左右交替纵轴：画报感强，但视线须呈「之」字反复横跳`;
      detail = "更适合品牌大事记等展陈页面；若是高频核对进度的工作台、物流追踪或事件复盘，左轴右文的直线扫描效率明显更高。";
    }
  }

  return { widthPx, mode, horizontalSlotPx, charsPerLineH, status, headline, detail };
}

// =========================================================================
// 06 节：单变量诊断小练习（四项中性标签，绝不剧透答案）
// =========================================================================
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    caption: "向右主轴串联 5 站，节点按均距排布，五枚节点与卡片采用统一深红色。",
    correct: false,
    reason: "方向与连续线都齐全，但五个节点全部用同一深红平权展示，读者扫完后无法一眼分辨「1 月立项、2 月原型」已完成、「4 月内测」正在进行，还是「9 月量产」尚未开始。时间线缺少进度焦标就会丢失「当前坐标」。",
  },
  {
    id: "B",
    label: "方案 B",
    caption: "向右主轴串联 5 站，均距排布并标明月份，以实心、外环高亮与浅描边区分三类进度状态。",
    correct: true,
    reason: "选对了。这版同时守住了时间线的四条底线：自左向右的明确方向主轴、视觉舒适的均距节奏（且以清晰月份标出真实时间，避免比例挤堆撞车），以及一眼可辨的「已完成 / 进行中（4 月内测）/ 未开始」三态层级。",
  },
  {
    id: "C",
    label: "方案 C",
    caption: "向右主轴串联 5 站并区分三态进度，节点位置按 1 月到 9 月严格线性像素比例排布。",
    correct: false,
    reason: "在没有插入断轴的情况下，硬把 1、2、4、5、9 月按严格线性像素映射，会让前四站挤在左半宽度里互相撞肩，而 5 月到 9 月之间拉出近半屏空白。真要表达跨度差，应该像第 02 节那样插入「//」断轴，或采用均距配清晰日期标签。",
  },
  {
    id: "D",
    label: "方案 D",
    caption: "5 站按均距水平排开并区分已完成、进行中与未开始色阶，去掉节点间水平连线与箭头。",
    correct: false,
    reason: "抽掉了贯穿节点的主轴连线与方向箭头，五张卡片在视觉上立刻散成互不隶属的并列卡片网格（270），必须靠读者逐字去读「1 月、2 月……」才能重新拼出先后关系，失去了时间线「一眼见连续演进」的优势。",
  },
];
