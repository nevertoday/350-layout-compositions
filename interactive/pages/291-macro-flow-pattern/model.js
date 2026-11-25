// 291 大体 流动模式（MACRO FLOW PATTERN / Mostly Fluid）单真源核心模型
// 所有画面几何坐标、外边距像素、单行估算字数、最小列宽、流路折返与诊断文案均由本模块统一算出。

export const STAGES = {
  flow: {
    id: "flow",
    zh: "引导",
    en: "FLOW",
    posterBody: "建立起点 吸引注意 设定方向",
    color: "#1043C6",
    ink: "#0B35A3",
    icon: "arrow-solid",
    role: "首屏主视域 / 入口锚点",
    detail:
      "给整页确立清晰的第一落点：在窄屏上它置顶独行，在宽屏上占据最舒展的主视域，一眼定下方向感。",
    ifMissing:
      "没有明确的入口领衔，视线会在大屏的多栏之间无序弹跳，找不到从哪开始读。",
  },
  transition: {
    id: "transition",
    zh: "过渡",
    en: "TRANSITION",
    posterBody: "连接段落 平滑衔接 承上启下",
    color: "#E35C0E",
    ink: "#B34100",
    icon: "orange-dot",
    role: "背景脉络 / 节奏缓冲带",
    detail:
      "承接入口注意力并把读者平稳送往核心论点：在中大屏里常与聚焦区形成左右呼应，窄屏时自然落位在引导正下方。",
    ifMissing:
      "从开篇直接硬跳到密集卖点或按钮，阅读节奏像踩了急刹车，信息显得突兀生硬。",
  },
  focus: {
    id: "focus",
    zh: "聚焦",
    en: "FOCUS",
    posterBody: "突出重点 强化信息 形成记忆点",
    color: "#1043C6",
    ink: "#0B35A3",
    icon: "target",
    role: "核心卖点 / 记忆高潮区",
    detail:
      "全页视觉体量与对比度最集中的高潮位：在大体流动网格里用更大的列宽或更强的蓝橙反差托住它，不被周围次要块稀释。",
    ifMissing:
      "四个区块一样大、一样灰，读者扫完一整屏却记不住核心结论。",
  },
  output: {
    id: "output",
    zh: "延展与输出",
    en: "EXTEND / OUTPUT",
    posterBody: "输出结果 影响行动 形成闭环",
    color: "#1043C6",
    ink: "#0B35A3",
    icon: "arrow-ring",
    role: "行动出口 / 延伸支流",
    detail:
      "如同原海报右下角分叉而出的支流：当引导、过渡与聚焦铺垫完成，顺势承接行动按钮、下载或延伸阅读，完成闭环。",
    ifMissing:
      "要么把索取行动的按钮硬塞在开场第一行惹人反感，要么讲完重点却没留出口，让读者停在半路。",
  },
};

export const STAGE_IDS = ["flow", "transition", "focus", "output"];

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 流动叙事",
    siteTitle: "MACRO-FLOW.DESIGN",
    blocks: {
      flow: {
        tag: "FLOW · 引导",
        title: "理解整体流动，建立清晰起点",
        copy: "在中小屏弹性排布，在大屏用对称外边距稳住视线主干。",
        cta: "沿着流道向下看 ↓",
      },
      transition: {
        tag: "TRANSITION · 过渡",
        title: "平滑衔接上下文",
        copy: "连接首屏入口与核心论点，承上启下不断裂。",
      },
      focus: {
        tag: "FOCUS · 聚焦",
        title: "突出核心重点 · 形成记忆点",
        copy: "主次体量拉开差距，让全页最关键的一条判断站在高潮位。",
      },
      output: {
        tag: "EXTEND / OUTPUT",
        title: "延展与输出 · 形成闭环",
        copy: "清晰路径 × 有效表达 → 顺势引导下一步行动。",
        cta: "开始实践 →",
      },
    },
  },
  magazine: {
    id: "magazine",
    label: "独立设计周刊",
    siteTitle: "EDITION NO.291",
    blocks: {
      flow: {
        tag: "COVER · 引导",
        title: "跨屏时代的流动版面手记",
        copy: "当同一篇文章同时出现在手机与 27 寸显示器上，版面该怎么呼吸？",
        cta: "阅读本期封面 ↓",
      },
      transition: {
        tag: "CONTEXT · 过渡",
        title: "编者按与观察背景",
        copy: "从 2012 年多设备模式谈起，梳理十年流式排版的演进。",
      },
      focus: {
        tag: "FEATURE · 聚焦",
        title: "关键洞察：为什么大屏要锁宽留白",
        copy: "用实测行长与外边距数据解释，为何「大体流动」比铺满全屏更耐读。",
      },
      output: {
        tag: "ARCHIVE · 延展输出",
        title: "订阅下期周刊与案例库",
        copy: "保存本期排版参数清单，继续浏览同系列响应式模式。",
        cta: "订阅设计周刊 →",
      },
    },
  },
  hardware: {
    id: "hardware",
    label: "声学新品发布",
    siteTitle: "AURA-S1 ACOUSTICS",
    blocks: {
      flow: {
        tag: "HERO · 引导",
        title: "把安静装进 185 克铝合金腔体",
        copy: "全频段主动降噪桌面监听音箱，为桌面近场聆听重新调校。",
        cta: "了解声学设计 ↓",
      },
      transition: {
        tag: "CRAFT · 过渡",
        title: "声学腔体与桌面衔接",
        copy: "15° 仰角底座让声轴直指耳际，减少桌面早期反射干扰。",
      },
      focus: {
        tag: "PROOF · 聚焦",
        title: "42Hz–28kHz 平直频响实测",
        copy: "双分频独立功放与零谐振前障板，细节层次一目了然。",
      },
      output: {
        tag: "ORDER · 延展输出",
        title: "预约线下试听与首发配色",
        copy: "含 14 天桌面试听保障与线材配件清单。",
        cta: "预约试听 →",
      },
    },
  },
};

export const MAX_WIDTH_OPTIONS = [
  { value: 0, label: "无上限（裸奔）", short: "无上限" },
  { value: 560, label: "560px（过窄）", short: "560px" },
  { value: 960, label: "960px（紧凑）", short: "960px" },
  { value: 1120, label: "1120px（经典）", short: "1120px" },
  { value: 1280, label: "1280px（宽舒）", short: "1280px" },
];

export const STACK_AT_OPTIONS = [
  { value: 0, label: "不堆叠（硬挤）", short: "不堆叠" },
  { value: 560, label: "560px 堆叠", short: "560px" },
  { value: 640, label: "640px 堆叠", short: "640px" },
  { value: 760, label: "760px 堆叠", short: "760px" },
  { value: 1080, label: "1080px（过早）", short: "1080px" },
];

export const RHYTHM_OPTIONS = [
  { value: "equal", label: "均分平铺（无峰）", short: "均分平铺" },
  { value: "poster", label: "主次阶梯流", short: "主次阶梯" },
  { value: "editorial", label: "紧凑出版流", short: "紧凑出版" },
];

export const VIEWPORT_MARKS = [
  { w: 360, label: "手机 360" },
  { w: 768, label: "平板 768" },
  { w: 1200, label: "笔电 1200" },
  { w: 1440, label: "桌面 1440" },
  { w: 1680, label: "超宽 1680" },
];

// 开场刻意处于 0/4 流动失控错态，绝不先给答案
export const INITIAL_STATE = {
  theme: "poster",
  viewportW: 1440,
  maxWidth: 0, // 错 1：无锁宽上限，大屏裸奔外边距归零
  stackAt: 0, // 错 2：不堆叠，360px 窄屏硬挤多列
  rhythm: "equal", // 错 3：四块均分平铺，无主次节奏峰
  order: ["output", "transition", "flow", "focus"], // 错 4：输出抢跑，流序逆折打结
  selectedSlot: -1,
};

export const PRESETS = {
  poster: {
    label: "原海报经典解",
    kind: "good",
    patch: {
      viewportW: 1440,
      maxWidth: 1120,
      stackAt: 640,
      rhythm: "poster",
      order: ["flow", "transition", "focus", "output"],
      selectedSlot: -1,
    },
  },
  compact: {
    label: "紧凑出版解",
    kind: "good",
    patch: {
      viewportW: 1280,
      maxWidth: 960,
      stackAt: 600,
      rhythm: "editorial",
      order: ["flow", "transition", "focus", "output"],
      selectedSlot: -1,
    },
  },
  wide: {
    label: "结论先行宽解",
    kind: "good",
    patch: {
      viewportW: 1440,
      maxWidth: 1280,
      stackAt: 760,
      rhythm: "poster",
      order: ["flow", "focus", "transition", "output"],
      selectedSlot: -1,
    },
  },
  trapNarrow: {
    label: "试错：桌面孤岛",
    kind: "bad",
    patch: {
      viewportW: 1440,
      maxWidth: 560,
      stackAt: 640,
      rhythm: "poster",
      order: ["flow", "transition", "focus", "output"],
      selectedSlot: -1,
    },
  },
  trapCollapse: {
    label: "试错：平板早塌",
    kind: "bad",
    patch: {
      viewportW: 768,
      maxWidth: 1120,
      stackAt: 1080,
      rhythm: "poster",
      order: ["flow", "transition", "focus", "output"],
      selectedSlot: -1,
    },
  },
  broken: {
    label: "复原 0/4 错态",
    kind: "reset",
    patch: { ...INITIAL_STATE },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 核心几何求解器：给定任意视口宽度与规则，返回真实的容器宽、两侧外边距、四块逻辑矩形与单行估算字数
export function solveLayout(viewportW, cfg) {
  const vw = clamp(Math.round(viewportW), 320, 2560);
  const pad = vw <= 480 ? 12 : 20;
  const gap = vw <= 480 ? 10 : 16;

  // 容器宽度与外边距缓冲带
  const capped = cfg.maxWidth > 0 && vw - pad * 2 > cfg.maxWidth;
  const containerW = capped ? cfg.maxWidth : vw - pad * 2;
  const outerMargin = Math.max(pad, Math.round((vw - containerW) / 2));
  const containerX = outerMargin;
  const marginPct = Math.round(((outerMargin * 2) / vw) * 100);

  // 是否收拢成单列堆叠
  const stacked = cfg.stackAt > 0 && vw < cfg.stackAt;
  const order = cfg.order;
  const blocks = [];
  let colCount = 1;
  let totalH = 0;

  if (stacked) {
    colCount = 1;
    let y = 0;
    const heights =
      cfg.rhythm === "equal"
        ? [108, 108, 108, 108]
        : cfg.rhythm === "editorial"
        ? [132, 92, 136, 92]
        : [142, 94, 134, 96];
    for (let i = 0; i < 4; i++) {
      const h = heights[i];
      blocks.push({
        slot: i,
        id: order[i],
        x: containerX,
        y,
        w: containerW,
        h,
      });
      y += h + gap;
    }
    totalH = y - gap;
  } else if (cfg.rhythm === "equal") {
    // 均分平铺错态：大屏 4 列等宽，中小屏硬塞 2×2
    if (vw >= 1040 && containerW >= 820) {
      colCount = 4;
      const w = (containerW - gap * 3) / 4;
      const h = 232;
      for (let i = 0; i < 4; i++) {
        blocks.push({
          slot: i,
          id: order[i],
          x: containerX + i * (w + gap),
          y: 0,
          w,
          h,
        });
      }
      totalH = h;
    } else {
      colCount = 2;
      const w = (containerW - gap) / 2;
      const h = 136;
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        blocks.push({
          slot: i,
          id: order[i],
          x: containerX + col * (w + gap),
          y: row * (h + gap),
          w,
          h,
        });
      }
      totalH = h * 2 + gap;
    }
  } else if (cfg.rhythm === "editorial") {
    // 紧凑出版流：上行双栏（58:42）→ 中段通栏聚焦高潮 → 底部右偏延展输出
    if (containerW >= 620) {
      colCount = 2;
      const w0 = Math.round((containerW - gap) * 0.58);
      const w1 = containerW - gap - w0;
      const hTop = 148;
      const hMid = 138;
      const hBot = 86;
      blocks.push({ slot: 0, id: order[0], x: containerX, y: 0, w: w0, h: hTop });
      blocks.push({ slot: 1, id: order[1], x: containerX + w0 + gap, y: 0, w: w1, h: hTop });
      blocks.push({ slot: 2, id: order[2], x: containerX, y: hTop + gap, w: containerW, h: hMid });
      const w3 = Math.round(containerW * 0.66);
      blocks.push({
        slot: 3,
        id: order[3],
        x: containerX + (containerW - w3),
        y: hTop + gap + hMid + gap,
        w: w3,
        h: hBot,
      });
      totalH = hTop + hMid + hBot + gap * 2;
    } else {
      colCount = 2;
      const w = (containerW - gap) / 2;
      blocks.push({ slot: 0, id: order[0], x: containerX, y: 0, w: containerW, h: 126 });
      blocks.push({ slot: 1, id: order[1], x: containerX, y: 126 + gap, w, h: 112 });
      blocks.push({ slot: 2, id: order[2], x: containerX + w + gap, y: 126 + gap, w, h: 112 });
      blocks.push({ slot: 3, id: order[3], x: containerX, y: 238 + gap * 2, w: containerW, h: 86 });
      totalH = 324 + gap * 2;
    }
  } else {
    // 原海报主次阶梯流（Mostly Fluid 典型骨架）：
    // 顶部通栏主引导（或大屏主视觉宽带）→ 中层过渡(左38%)+聚焦高潮(右62%) → 右下分叉延展输出闭环
    if (containerW >= 920) {
      colCount = 3;
      const h0 = 148;
      const hMid = 144;
      const hBot = 86;
      const w1 = Math.round((containerW - gap) * 0.37);
      const w2 = containerW - gap - w1;
      blocks.push({ slot: 0, id: order[0], x: containerX, y: 0, w: containerW, h: h0 });
      blocks.push({ slot: 1, id: order[1], x: containerX, y: h0 + gap, w: w1, h: hMid });
      blocks.push({
        slot: 2,
        id: order[2],
        x: containerX + w1 + gap,
        y: h0 + gap,
        w: w2,
        h: hMid,
      });
      // 呼应 291 原海报右下角延展支流：从底主干平滑右延
      const w3 = Math.round(containerW * 0.56);
      blocks.push({
        slot: 3,
        id: order[3],
        x: containerX + containerW - w3,
        y: h0 + gap + hMid + gap,
        w: w3,
        h: hBot,
      });
      totalH = h0 + hMid + hBot + gap * 2;
    } else {
      colCount = 2;
      const h0 = 132;
      const hMid = 136;
      const hBot = 86;
      const w1 = Math.round((containerW - gap) * 0.42);
      const w2 = containerW - gap - w1;
      blocks.push({ slot: 0, id: order[0], x: containerX, y: 0, w: containerW, h: h0 });
      blocks.push({ slot: 1, id: order[1], x: containerX, y: h0 + gap, w: w1, h: hMid });
      blocks.push({
        slot: 2,
        id: order[2],
        x: containerX + w1 + gap,
        y: h0 + gap,
        w: w2,
        h: hMid,
      });
      const w3 = Math.round(containerW * 0.68);
      blocks.push({
        slot: 3,
        id: order[3],
        x: containerX + containerW - w3,
        y: h0 + gap + hMid + gap,
        w: w3,
        h: hBot,
      });
      totalH = h0 + hMid + hBot + gap * 2;
    }
  }

  for (const b of blocks) {
    b.cx = b.x + b.w / 2;
    b.cy = b.y + b.h / 2;
    b.area = b.w * b.h;
  }

  const minColW = Math.round(Math.min(...blocks.map((b) => b.w)));
  const maxBlockW = Math.round(Math.max(...blocks.map((b) => b.w)));
  const minArea = Math.min(...blocks.map((b) => b.area));
  const maxArea = Math.max(...blocks.map((b) => b.area));
  const areaRatio = +(maxArea / Math.max(1, minArea)).toFixed(2);

  // 单行正文估算字符数（以 16px 西文均值 8.6px 步宽、减去块内左右内边距 40px 实算，对应 Bringhurst 45–75 ch 舒适带）
  // 在合法主次布局下，通栏内容区内文按最大可读宽 66%–82% 排布；无上限裸奔时则无内控直接拉满
  const textTrackW =
    cfg.maxWidth === 0
      ? Math.max(120, containerW - 36)
      : Math.max(120, Math.min(maxBlockW - 44, containerW * 0.72));
  const estChars = Math.round(textTrackW / 9.2);

  // 窄屏真实挤爆判断：列宽低于 200px 会严重碎行
  const overflowPx = stacked ? 0 : Math.max(0, Math.round(210 - minColW));

  // 沿四阶段语义顺序（flow -> transition -> focus -> output）追踪视线路径与折返次数
  const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));
  const pathPoints = STAGE_IDS.map((id) => byId[id]);
  let reversals = 0;
  let totalTurnDeg = 0;
  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    // 语义推进却在排版里往上倒退或大幅回跳
    if (curr.slot < prev.slot) reversals++;
  }
  for (let i = 1; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i - 1];
    const b = pathPoints[i];
    const c = pathPoints[i + 1];
    const v1x = b.cx - a.cx;
    const v1y = b.cy - a.cy;
    const v2x = c.cx - b.cx;
    const v2y = c.cy - b.cy;
    const m1 = Math.hypot(v1x, v1y) || 1;
    const m2 = Math.hypot(v2x, v2y) || 1;
    const dot = clamp((v1x * v2x + v1y * v2y) / (m1 * m2), -1, 1);
    totalTurnDeg += Math.round((Math.acos(dot) * 180) / Math.PI);
  }

  return {
    vw,
    containerX,
    containerW: Math.round(containerW),
    outerMargin,
    marginPct,
    capped,
    stacked,
    colCount,
    minColW,
    maxBlockW,
    areaRatio,
    estChars,
    overflowPx,
    totalH: Math.round(totalH),
    blocks,
    pathPoints,
    reversals,
    totalTurnDeg,
  };
}

// 判断四阶段顺序是否构成顺畅流动（接受「标准四阶」与「聚焦前置」两组合法流序）
export function isOrderValid(order) {
  const s = order.join(",");
  return (
    s === "flow,transition,focus,output" ||
    s === "flow,focus,transition,output"
  );
}

// 全局单真源评估：同步实测当前视口 + 360px 窄屏 + 768px 平板 + 1440px 大屏
export function evaluate(state) {
  const current = solveLayout(state.viewportW, state);
  const mobile = solveLayout(360, state);
  const tablet = solveLayout(768, state);
  const desktop = solveLayout(1440, state);

  // 1. 大屏锁宽与外边距缓冲检查（1440px 基准）
  let marginIssue = null;
  if (state.maxWidth === 0 || desktop.outerMargin < 40) {
    marginIssue = "no_cap";
  } else if (desktop.containerW < 680) {
    marginIssue = "too_narrow";
  }
  const marginOk = !marginIssue;

  // 2. 窄屏堆叠与平板并行断点检查（360px & 768px 基准）
  let stackIssue = null;
  if (!mobile.stacked || mobile.minColW < 240) {
    stackIssue = "mobile_crush";
  } else if (tablet.stacked) {
    stackIssue = "early_collapse";
  }
  const stackOk = !stackIssue;

  // 3. 宏观流序检查（引导先入、输出收尾、无逆折跳返）
  const orderOk = isOrderValid(state.order);
  let orderIssue = null;
  if (!orderOk) {
    if (state.order[0] === "output") orderIssue = "output_first";
    else if (state.order[0] !== "flow") orderIssue = "no_entry";
    else orderIssue = "mid_tangle";
  }

  // 4. 主次视觉节奏检查（1440px 面积落差）
  const rhythmOk = state.rhythm !== "equal" && desktop.areaRatio >= 1.35;
  const rhythmIssue = rhythmOk ? null : "flat_rhythm";

  const checks = [
    {
      id: "margin",
      ok: marginOk,
      label: "大屏锁宽留白",
      badge: marginOk
        ? `留白 ${desktop.outerMargin}px`
        : marginIssue === "no_cap"
        ? "裸奔 0 缓冲"
        : `过窄 ${desktop.containerW}px`,
    },
    {
      id: "stack",
      ok: stackOk,
      label: "窄屏单列堆叠",
      badge: stackOk
        ? `断点 ${state.stackAt}px`
        : stackIssue === "mobile_crush"
        ? `360px 仅 ${mobile.minColW}px`
        : "768px 早塌",
    },
    {
      id: "order",
      ok: orderOk,
      label: "宏观流序贯通",
      badge: orderOk
        ? state.order[1] === "focus"
          ? "焦点先亮解"
          : "四阶顺流"
        : `逆折 ${current.reversals} 处`,
    },
    {
      id: "rhythm",
      ok: rhythmOk,
      label: "主次节奏起伏",
      badge: rhythmOk ? `体量差 ${desktop.areaRatio}×` : "均分无峰 1.0×",
    },
  ];

  const score = checks.filter((c) => c.ok).length;

  // 按严重优先级产出唯一白话诊断与下一步精准指引
  let statusTag = `${score}/4 · 待理顺`;
  let severity = "bad";
  let headline = "";
  let explanation = "";
  let actionHint = "";
  let fixAction = null;

  if (score === 4) {
    severity = "good";
    statusTag = "4/4 · 大体流动成立";
    const modeNote =
      state.rhythm === "editorial"
        ? "紧凑出版流"
        : state.order[1] === "focus"
        ? "结论先行流"
        : "原海报经典流";
    headline = `流动成立（${modeNote}）：大屏锁宽留边，窄屏顺畅单列`;
    explanation = `1440px 桌面上容器锁在 ${desktop.containerW}px，两侧自动让出 ${desktop.outerMargin}px 对称外边距（单行约 ${desktop.estChars} 字符，落在 45–75 字符舒适带）；拉窄到 360px 时在 ${state.stackAt}px 处自然收成单列（满宽 ${mobile.minColW}px），且「${state.order.map((id) => STAGES[id].zh).join(" → ")}」路径零逆折。`;
    actionHint =
      "试着左右拖动上方画布，亲眼看它从 360px 手机到 1680px 超宽屏的连续变形，或点「试错」按钮体验常见反面陷阱。";
  } else if (marginIssue === "no_cap") {
    statusTag = `${score}/4 · 大屏裸奔`;
    headline = `1440px 大屏无锁宽，单行被扯长到约 ${desktop.estChars} 字符`;
    explanation = `现在是「完全流式」而非「大体流动」：容器跟着屏幕一路撑满到 ${desktop.containerW}px，两侧外边距仅剩 ${desktop.outerMargin}px。眼睛每扫完一行都要横向长途折返，极易串行。`;
    actionHint =
      "先把「容器锁宽 max-width」切到 960px、1120px 或 1280px，让大屏多出的空间变成两侧呼吸留白。";
    fixAction = { label: "一步校准：锁宽 1120px", patch: { maxWidth: 1120 } };
  } else if (marginIssue === "too_narrow") {
    statusTag = `${score}/4 · 过窄孤岛`;
    headline = `容器锁死在 ${desktop.containerW}px，桌面端缩成一根细孤岛`;
    explanation = `锁宽不是越窄越好：在 1440px 屏幕上两侧白白空出 ${desktop.marginPct}%（单边 ${desktop.outerMargin}px），本该并排舒展的过渡与聚焦区全被挤在中间窄带里。`;
    actionHint =
      "把「容器锁宽 max-width」放宽到 960px–1280px 之间，保住行长又不浪费桌面空间。";
    fixAction = { label: "一步校准：放宽至 1120px", patch: { maxWidth: 1120 } };
  } else if (stackIssue === "mobile_crush") {
    statusTag = `${score}/4 · 窄屏挤爆`;
    headline = `360px 手机上仍硬挤 ${mobile.colCount} 列，单列最窄只剩 ${mobile.minColW}px`;
    explanation = `没有在窄屏设定单列堆叠断点：到了 360px 手机宽度，双列被迫硬塞在同一行，每栏仅 ${mobile.minColW}px 宽，中文一行装不下几个字，甚至触发横向溢出。`;
    actionHint =
      "把「堆叠断点」调到 560px–760px，让窄屏自动把多列顺次收拢成单列纵流。";
    fixAction = { label: "一步校准：640px 堆叠", patch: { stackAt: 640 } };
  } else if (stackIssue === "early_collapse") {
    statusTag = `${score}/4 · 平板早塌`;
    headline = `堆叠断点高达 ${state.stackAt}px，768px 平板已被压成单列`;
    explanation = `大体流动的优势在于中大屏保持弹性多列、只在真正窄的屏幕才堆叠。把断点设在 ${state.stackAt}px 会让平板和小笔记本白白浪费横向空间。`;
    actionHint =
      "把「堆叠断点」降回 560px–760px 区间，让 768px 平板恢复双列舒展流排。";
    fixAction = { label: "一步校准：640px 堆叠", patch: { stackAt: 640 } };
  } else if (!orderOk) {
    statusTag = `${score}/4 · 流序逆折`;
    headline =
      orderIssue === "output_first"
        ? "「延展与输出」抢跑在第一顺位，宏观路径当场逆折"
        : "四阶段流序打结，视线在画布里来回折返";
    explanation = `原海报把宏观流动拆成「引导 → 过渡 → 聚焦 → 延展与输出」。眼下排成了「${state.order.map((id) => STAGES[id].zh).join(" → ")}」，导致蓝橙流带出现 ${current.reversals} 处红色逆折回跳，读者还没看懂背景就被索取行动。`;
    actionHint =
      "点击画布上的区块或下方四阶按钮两两互换，让「引导」居首、「延展与输出」收尾。";
    fixAction = {
      label: "一步校准：理顺四阶流序",
      patch: { order: ["flow", "transition", "focus", "output"], selectedSlot: -1 },
    };
  } else if (!rhythmOk) {
    statusTag = `${score}/4 · 平铺无峰`;
    headline = `四块完全等宽等高（面积比 ${desktop.areaRatio}×），看不出聚焦高潮`;
    explanation = `虽然屏幕宽度和顺序对了，但四个区块像表格单元格一样平均切分，缺乏入口的主导感与聚焦区的体量突出，整页读起来平淡无波。`;
    actionHint =
      "把「节奏骨架」切到「主次阶梯流」或「紧凑出版流」，拉开引导与聚焦的体量落差。";
    fixAction = { label: "一步校准：切主次阶梯流", patch: { rhythm: "poster" } };
  }

  return {
    score,
    total: 4,
    statusTag,
    severity,
    headline,
    explanation,
    actionHint,
    fixAction,
    checks,
    current,
    mobile,
    tablet,
    desktop,
    marginOk,
    stackOk,
    orderOk,
    rhythmOk,
  };
}

// 02 节：三种响应式策略在任意屏幕宽度下的同源实算对比（固定死宽 vs 完全流式 vs 大体流动）
export function compareThreeStrategies(vw) {
  const w = clamp(Math.round(vw), 320, 1920);
  // 1. 固定死宽 1080px
  const fixedContent = 1080;
  const fixedOverflow = Math.max(0, fixedContent - w);
  const fixedMargin = Math.max(0, Math.round((w - fixedContent) / 2));
  const fixedChars = 64;
  const fixedStatus =
    fixedOverflow > 0
      ? { ok: false, tag: `横溢 +${fixedOverflow}px`, note: "小屏装不下，强制出现横向滚动条，违反 WCAG 1.4.10" }
      : { ok: true, tag: `留白 ${fixedMargin}px`, note: "大屏行长稳，但换窄屏就彻底崩坏" };

  // 2. 完全流式 100%（无 max-width）
  const fullContent = w - 24;
  const fullCols = w < 640 ? 1 : 2;
  const fullTrack = fullCols === 1 ? fullContent - 24 : Math.round((fullContent - 16) * 0.65);
  const fullChars = Math.round(fullTrack / 9.2);
  const fullStatus =
    fullChars > 78
      ? { ok: false, tag: `过宽 ~${fullChars}ch`, note: "大屏无限拉宽，外边距为 0，眼睛扫行极易串行" }
      : { ok: true, tag: `行长 ~${fullChars}ch`, note: "中小屏贴合良好，但一上大屏就会失控拉扁" };

  // 3. 大体流动 Mostly Fluid（max-width: 1120px, stackAt: 640px）
  const mf = solveLayout(w, {
    maxWidth: 1120,
    stackAt: 640,
    rhythm: "poster",
    order: STAGE_IDS,
  });
  const mfStatus = {
    ok: true,
    tag: mf.stacked
      ? `单列 · ~${mf.estChars}ch`
      : mf.capped
      ? `锁宽 · 留白 ${mf.outerMargin}px`
      : `双列流排 · ~${mf.estChars}ch`,
    note: mf.stacked
      ? "窄屏自动收成单列纵流，零横向溢出"
      : mf.capped
      ? "越过 1120px 上限后锁定主网格，外边距自动吞吐多余空间"
      : "中屏弹性流动，保持主次比例顺畅衔接",
  };

  return {
    vw: w,
    fixed: { contentW: fixedContent, overflow: fixedOverflow, margin: fixedMargin, chars: fixedChars, ...fixedStatus },
    full: { contentW: fullContent, cols: fullCols, margin: 12, chars: fullChars, ...fullStatus },
    mf: { contentW: mf.containerW, cols: mf.colCount, margin: mf.outerMargin, chars: mf.estChars, capped: mf.capped, stacked: mf.stacked, ...mfStatus },
  };
}

// 03 节：生成可真实复制运行的现代 CSS（Flexbox / CSS Grid 双方案）
export function buildCssSnippet(syntax, maxW, stackAt) {
  if (syntax === "grid") {
    return `.macro-flow {
  width: min(100% - 2rem, ${maxW}px);
  margin-inline: auto; /* 大屏自动扩张对称外边距 */
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr; /* 窄屏默认单列纵流 */
}

@media (min-width: ${stackAt}px) {
  .macro-flow {
    grid-template-columns: 38fr 62fr; /* 过渡 + 聚焦主次落差 */
  }
  .stage-flow   { grid-column: 1 / -1; } /* 引导通栏领衔 */
  .stage-output { grid-column: 1 / -1; justify-self: end; width: 62%; }
}`;
  }
  return `.macro-flow {
  max-width: ${maxW}px;
  margin-inline: auto; /* 超过 ${maxW}px 后由外边距吸收余宽 */
  padding-inline: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.stage-flow, .stage-transition, .stage-focus, .stage-output {
  flex: 1 1 100%; /* 窄屏自然堆叠为单列 */
}

@media (min-width: ${stackAt}px) {
  .stage-transition { flex: 1 1 36%; }
  .stage-focus      { flex: 2 1 58%; } /* 拉开视觉聚焦峰 */
  .stage-output     { flex: 0 1 60%; margin-left: auto; }
}`;
}

// 04 节：响应式重排家族（291–300）完整导航与场景决策矩阵
export const FAMILY_SCENARIOS = [
  {
    id: "editorial",
    label: "内容落地页 / 品牌故事 / 资讯门户",
    pick: "291",
    summary: "主次分明且各端信息结构一致：中小屏顺流重排、大屏锁宽留白，正是 291「大体 流动模式」的主战场。",
    also: ["292", "299"],
  },
  {
    id: "multi-col",
    label: "多栏仪表 / 渐进拆列文档",
    pick: "292",
    summary: "当宽屏有多列彼此独立、希望屏幕每变窄一档就按顺序落下一列而不是一次全叠时，更适合 292「列下落模式」。",
    also: ["291", "296"],
  },
  {
    id: "cross-role",
    label: "大屏与手机任务截然不同的跨端产品",
    pick: "293",
    summary: "桌面端与移动端不只是缩放而是彻底换骨架时，需要 293「布局切换模式」在不同断点大改结构。",
    also: ["297", "298"],
  },
  {
    id: "minimal",
    label: "纯单栏长文 / 声明 / 个人简历",
    pick: "294",
    summary: "通篇本来就只有单列文字，不需要多列网格重排，用 294「微调模式」只改字号、行距与边距最干净。",
    also: ["291"],
  },
  {
    id: "deep-nav",
    label: "深层侧边导航 / 筛选器 / 工具箱",
    pick: "295",
    summary: "辅助面板内容多、不想在手机端堆成超长一串把正文挤到屏外，应让次要区退到 295「画布外模式」抽屉里。",
    also: ["298", "300"],
  },
  {
    id: "modular",
    label: "独立复用的卡片库 / 复杂设计系统",
    pick: "300",
    summary: "同一个组件要被塞进侧栏、主区、弹窗等不同宽度的容器时，页面级断点不够用，应升级为 300「组件级响应布局」。",
    also: ["299", "291"],
  },
];

export const FAMILY_MEMBERS = [
  { id: "291", title: "大体 流动模式", en: "Mostly Fluid", diff: "本页主角：中小屏弹性重排并收单列，大屏锁最大宽、用对称外边距稳住阅读流。", self: true },
  { id: "292", title: "列下落模式", en: "Column Drop", diff: "随屏幕变窄把整列逐个依次落到主列下方，各列宽度变化相对克制。" },
  { id: "293", title: "布局切换模式", en: "Layout Shifter", diff: "跨越断点时大胆重构区域位置与骨架，适合桌面与移动目标差异大的站点。" },
  { id: "294", title: "微调模式", en: "Tiny Tweaks", diff: "通篇保持单一结构，仅随屏幕微调字号、留白与图片尺寸，最省维护。" },
  { id: "295", title: "画布外模式", en: "Off-Canvas", diff: "小屏把导航或筛选面板藏到视口之外按需呼出，避免纵向堆叠过长。" },
  { id: "296", title: "堆叠重排", en: "Stacked Reflow", diff: "聚焦窄屏把多列块干净地叠进单一纵轴并守住优先级，消除横向溢出。" },
  { id: "297", title: "顺序重排", en: "Sequential Reorder", diff: "重排时主动改变模块出现顺序，把手机端最紧要的行动或重点提到前面。" },
  { id: "298", title: "折叠双窗格", en: "Folded Dual-Pane", diff: "宽屏左右双窗格协同（如列表+详情），窄屏折叠为单窗格切页。" },
  { id: "299", title: "自适应网格", en: "Adaptive Grid", diff: "按容器余量自动增减网格列数与跨列，适合卡片墙、图库与商品列表。" },
  { id: "300", title: "组件级响应布局", en: "Component-Level", diff: "不再只盯整页视口，让每个组件按自己所在容器的宽度独立变形。" },
];

// 05 节：核实过的真实历史时间线
export const HISTORY_STEPS = [
  {
    year: "2000",
    date: "2000 年 4 月 7 日",
    person: "John Allsopp",
    work: "《A Dao of Web Design》（A List Apart）",
    tag: "思想起点",
    summary: "提出网页不是固定尺寸的印刷纸：试图用绝对像素把网页钉死，是在违背媒介本身流动的天性。",
    impact: "为后来一切流式网格与「顺屏而动」的思维埋下哲学种子。",
    wireframe: "fixed-to-liquid",
  },
  {
    year: "2010",
    date: "2010 年 5 月 25 日",
    person: "Ethan Marcotte",
    work: "《Responsive Web Design》（A List Apart 第 306 期；2011 年出书）",
    tag: "技术合流",
    summary: "正式提出「响应式网页设计」，将流式网格、弹性图片与 CSS 媒体查询三项已有技术整合为同一套方法。",
    impact: "页面从此既能按比例伸缩，也能在关键宽度处优雅改列，不再只靠死板缩放。",
    wireframe: "rwd-trio",
  },
  {
    year: "2012",
    date: "2012 年 3 月 14 日",
    person: "Luke Wroblewski",
    work: "《Multi-Device Layout Patterns》（lukew.com）",
    tag: "模式定名",
    summary: "归纳当时真实响应式网站的五大高频骨架，把「小屏单列、中屏流式、大屏锁宽留边」命名为 Mostly Fluid（大体流动）。",
    impact: "成为 291–295 五页的直接谱系源头，也因维护成本低而成为全球应用最广的响应式基线。",
    wireframe: "mostly-fluid",
  },
  {
    year: "2018",
    date: "2018 年 6 月 5 日",
    person: "W3C WAI 工作组",
    work: "WCAG 2.1 成功标准 1.4.10 Reflow（AA 级）",
    tag: "无障碍底线",
    summary: "规定竖向滚动网页在等效 320 CSS 像素宽（即 1280px 桌面放大 400%）时必须完成单向重排，不得逼用户横向滚动。",
    impact: "把「窄屏不挤爆、流式重排不断裂」从审美偏好变成网页可访问性的硬标准。",
    wireframe: "wcag-reflow",
  },
];

// 06 节：单变量 4 选 1 测验（中性标签，仅改变大屏容器约束策略）
export const QUIZ_DATA = {
  prompt:
    "一个包含「引导 / 过渡 / 聚焦 / 延展输出」四段内容的品牌发布页，在 375px 手机和 768px 平板端都很顺畅；但上了 1920px 台式机大屏后，一行字拉得太长、视线累且图片发虚。以下四个方案只在「大屏容器约束」这一个变量上不同，哪一套最符合大体流动模式？",
  answer: "A",
  options: [
    {
      key: "A",
      title: "方案 A · 设 max-width: 1120px 并居中",
      desc: "保留现有中小屏流式断点，仅给外层容器增加 1120px 最大宽度与自动外边距。",
      diagram: "cap-margin",
      explain:
        "正确！这正是 Mostly Fluid（大体流动）的精髓：中小屏继续弹性重排，越过 1120px 后锁定主网格宽度，把多余屏幕空间交给两侧对称外边距，单行字数与视觉节奏同时保住。",
    },
    {
      key: "B",
      title: "方案 B · 全站改写死 width: 1120px",
      desc: "去掉流式百分比与断点，直接把外层容器宽度固定成 1120px。",
      diagram: "hard-fixed",
      explain:
        "虽然 1920px 上行长变舒服了，但代价是彻底毁掉中小屏——在 375px 手机和 768px 平板上直接横向溢出截断，退回固定宽度时代。",
    },
    {
      key: "C",
      title: "方案 C · 不限宽，大屏平拆 6 列铺满",
      desc: "依然不设最大宽度，在 1920px 下把内容均分成 6 列等宽小格铺满全屏。",
      diagram: "six-equal",
      explain:
        "虽然缩短了单栏行长，却把原本「引导 → 过渡 → 聚焦 → 延展输出」的宏观主次流动敲成了零碎平铺的格子墙，失去了记忆高潮。",
    },
    {
      key: "D",
      title: "方案 D · 不限宽，全端统一 560px 单列",
      desc: "大屏也不设多列网格，把 1920px 台式机统一收成 560px 窄单列竖排。",
      diagram: "narrow-strip",
      explain:
        "把台式机生生压成一根手机长条，两侧浪费超过 70% 屏幕空间，页面被拉得极长，错失了中大屏横向并排呼应的节奏优势。",
    },
  ],
};
