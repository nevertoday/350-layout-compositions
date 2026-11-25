// 199 复合网格 · 单真源几何计算与诊断模型
// 所有界面读数、画布坐标、共轨检测、碎缝告警与五要点实时灯均由本模块唯一计算

export const PALETTE = {
  lilacBg: "#D5D2EA",
  lilacMist: "#E7E5F4",
  lilacLine: "#ACA7CA",
  creamPaper: "#EAE5DC",
  creamLight: "#F6F3EE",
  sandPaper: "#EFEAE1",
  tealMist: "#E7F0EF",
  darkChamber: "#17132A",
  darkPanel: "#221C3D",
  ink: "#0E0E14",
  inkBody: "#1F1E2B",
  inkMuted: "#4E4C63",
  tealDark: "#124D4F",
  tealMain: "#0A6665",
  tealBright: "#1B8A84",
  tealSoft: "#77A9A7",
  tealDarkBg: "#5CE0CE",
  violetDark: "#4B3893",
  violetMain: "#614EAD",
  violetMid: "#7459B2",
  violetSoft: "#B5A5F5",
  goldMain: "#D2B37E",
  goldInk: "#7A5B20",
  goldDarkBg: "#E5C992",
  errLight: "#B62738",
  errSoftBg: "#FBE9EB",
  errDarkBg: "#FF8290",
  okLight: "#0A6A5E",
  okSoftBg: "#E3F4F1",
};

export const SCENES = {
  nature: {
    id: "nature",
    name: "自然画册",
    fullTitle: "自然的秩序与生命力",
    enTitle: "THE ORDER AND VITALITY OF NATURE",
    leadText: "自然系统在看似混沌中遵循内在秩序。从微观结构到宏观生态，形态、比例与循环共同构成和谐的整体。",
    caption: "原海报核心解剖：左栏排长文，右区以模块承载叶片、数据环、图式、湖山与鹦鹉螺。",
  },
  city: {
    id: "city",
    name: "城市与水",
    fullTitle: "城市与水",
    enTitle: "WATER & CITY",
    leadText: "水塑造了城市的形态，也承载了我们的生活。左栏栅稳定叙事主线，右侧模块统筹城水大片与水文数据。",
    caption: "原海报应用示例 1：杂志专题页，左侧栏栅承载长文，右侧模块展示图像与三项水文指标。",
  },
  report: {
    id: "report",
    name: "数据年报",
    fullTitle: "年度增长概览",
    enTitle: "ANNUAL GROWTH 2021–2024",
    leadText: "栏栅组织时间轴与主图表层级，右侧模块容纳关键指标卡与占比环图，确保比较清晰、重点突出。",
    caption: "原海报应用示例 2：数据报告页，主栏呈现四年柱状趋势，模块列排布 +34%、58% 与 4.2x。",
  },
};

export const COL_OPTIONS = [4, 5, 6, 12];
export const MOD_OPTIONS = [
  { cols: 0, rows: 0, label: "无次轨", short: "无" },
  { cols: 3, rows: 4, label: "3×4 模块", short: "3×4" },
  { cols: 4, rows: 3, label: "4×3 模块", short: "4×3" },
  { cols: 5, rows: 3, label: "5×3 模块", short: "5×3" },
];
export const BASELINE_OPTIONS = [
  { id: "off", pt: 0, label: "脱钩", short: "脱钩" },
  { id: "24", pt: 24, label: "24pt 统一", short: "24pt" },
  { id: "20", pt: 20, label: "20pt 紧凑", short: "20pt" },
];

export function gcd(a, b) {
  let x = Math.abs(a | 0);
  let y = Math.abs(b | 0);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function lcm(a, b) {
  if (!a || !b) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

// 开场默认：0/4 网格打架翻车态（互质 5栏 + 4×3模块、描纸右偏 +0.056、职能错配、基线脱钩）
export function createInitialState() {
  return {
    scene: "nature",
    cols: 5,
    modCols: 4,
    modRows: 3,
    offsetRatio: 0.056, // 相对内容区宽度的相位偏移（范围 -0.14 ~ +0.14）
    baseline: "off",
    marginOn: true,
    leadRole: "bad_module", // "column" | "bad_module"
    dataRole: "bad_float",  // "module" | "bad_float"
    heroRole: "anchor",     // "anchor" | "bad_drift"
    selectedBlock: "lead",  // "lead" | "data" | "hero"
    showColumns: true,
    showModules: true,
    showBaselines: true,
  };
}

export function presetPosterSolution(scene = "nature") {
  return {
    scene,
    cols: 6,
    modCols: 3,
    modRows: 4,
    offsetRatio: 0,
    baseline: "24",
    marginOn: true,
    leadRole: "column",
    dataRole: "module",
    heroRole: "anchor",
    selectedBlock: "lead",
    showColumns: true,
    showModules: true,
    showBaselines: true,
  };
}

export function presetTwelveColSolution(scene = "nature") {
  return {
    scene,
    cols: 12,
    modCols: 4,
    modRows: 3,
    offsetRatio: 0,
    baseline: "20",
    marginOn: true,
    leadRole: "column",
    dataRole: "module",
    heroRole: "anchor",
    selectedBlock: "lead",
    showColumns: true,
    showModules: true,
    showBaselines: true,
  };
}

export function presetOverdenseClash(scene = "nature") {
  return {
    scene,
    cols: 12,
    modCols: 5,
    modRows: 3,
    offsetRatio: -0.048,
    baseline: "off",
    marginOn: false,
    leadRole: "bad_module",
    dataRole: "bad_float",
    heroRole: "bad_drift",
    selectedBlock: "data",
    showColumns: true,
    showModules: true,
    showBaselines: true,
  };
}

export function clampOffset(v) {
  return Math.max(-0.14, Math.min(0.14, v));
}

// 计算给定几何尺寸下的完整轨道阵列、碎缝与所有指标（画布渲染与 DOM 读数完全共用此输出）
export function evaluateLayout(state, fieldPixelWidth = 480) {
  const cols = state.cols;
  const modCols = state.modCols;
  const modRows = state.modRows;
  const offset = state.offsetRatio;
  const offsetPx = Math.round(offset * fieldPixelWidth);
  const absOffset = Math.abs(offset);

  // 1. 归一化内部边界坐标（0..1，代表主栏和次模块的纵线位置，沟槽中心对齐）
  const colLines = [];
  for (let i = 1; i < cols; i++) colLines.push(i / cols);

  const modLines = [];
  if (modCols > 0) {
    for (let j = 1; j < modCols; j++) {
      modLines.push(j / modCols + offset);
    }
  }

  // 2. 计算理论公约与实测共轨数
  const isSingleGrid = modCols === 0;
  const exactNest = !isSingleGrid && (cols % modCols === 0 || modCols % cols === 0);
  const commonDiv = isSingleGrid ? 0 : gcd(cols, modCols);
  const commonMult = isSingleGrid ? cols : lcm(cols, modCols);

  const alignTol = 0.011; // 约 ±5px 内算物理重合
  let sharedAxes = 0;
  const sharedPositions = [];
  for (const m of modLines) {
    const hit = colLines.find((c) => Math.abs(c - m) <= alignTol);
    if (hit !== undefined) {
      sharedAxes++;
      sharedPositions.push((hit + m) * 0.5);
    }
  }

  // 3. 计算碎缝（两条非重合的纵线间距过近，小于 0.068 内容区宽，形成视觉打架窄条）
  const allInternal = [
    ...colLines.map((x) => ({ x, kind: "col" })),
    ...modLines.filter((x) => x > 0.015 && x < 0.985).map((x) => ({ x, kind: "mod" })),
  ].sort((a, b) => a.x - b.x);

  const slivers = [];
  let minGap = 1;
  for (let i = 0; i < allInternal.length - 1; i++) {
    const a = allInternal[i];
    const b = allInternal[i + 1];
    const gap = b.x - a.x;
    if (a.kind !== b.kind && gap > alignTol) {
      if (gap < minGap) minGap = gap;
      if (gap < 0.068) {
        slivers.push({ x0: a.x, x1: b.x, gap, gapPx: Math.max(2, Math.round(gap * fieldPixelWidth)) });
      }
    }
  }
  // 边缘脱槽碎缝（次模块外框相对主内容区边缘错开）
  if (!isSingleGrid && absOffset > alignTol) {
    if (offset > 0) {
      slivers.push({ x0: 0, x1: offset, gap: offset, gapPx: Math.round(offset * fieldPixelWidth), edge: true });
    } else {
      slivers.push({ x0: 1 + offset, x1: 1, gap: absOffset, gapPx: Math.round(absOffset * fieldPixelWidth), edge: true });
    }
  }

  // 4. 独立竖轨总数（合并共轨后）
  const uniqueInternalAxes = colLines.length + modLines.length - sharedAxes;
  const overDense = !isSingleGrid && !exactNest && uniqueInternalAxes >= 13;

  // 5. 四大核心支柱（0/4 ~ 4/4）
  const divisorOk = !isSingleGrid && exactNest && !overDense;
  const phaseOk = !isSingleGrid && absOffset <= alignTol && state.marginOn;
  const rolesOk = state.leadRole === "column" && state.dataRole === "module" && state.heroRole === "anchor";
  const baselineOk = state.baseline !== "off";

  const misassignedCount =
    (state.leadRole !== "column" ? 1 : 0) +
    (state.dataRole !== "module" ? 1 : 0) +
    (state.heroRole !== "anchor" ? 1 : 0);

  const score =
    (divisorOk ? 1 : 0) +
    (phaseOk ? 1 : 0) +
    (rolesOk ? 1 : 0) +
    (baselineOk ? 1 : 0);

  // 6. 8 类实算失误诊断（单真源白话诊断）
  let fault = null;
  if (!state.marginOn) {
    fault = {
      code: "err_margin",
      badge: "错态 · 贴边窒息",
      headline: "外边距归零，复合结构贴死纸边无处呼吸",
      why: "原海报用独立「外边距 MARGIN」把两套网格收进同一块内容区。去掉外框留白后，栏栅线与模块卡直接顶撞纸边，再准的轨道也会显得逼仄压迫。",
      action: "点控台里的「恢复外边距」，先把共有外框立稳。",
    };
  } else if (isSingleGrid) {
    fault = {
      code: "err_single",
      badge: "错态 · 退化单网",
      headline: `只剩 ${cols} 栏单轨，已退回单一分栏网格`,
      why: "拿掉次层模块轨后，长文、72% 数据环与五组视觉图只能硬挤同一套栏宽。复合网格的要点是「主从协作」，单一网格撑不起多形态信息并置。",
      action: "在顶部公式栏为「模块 MODULES」选一套能整除主栏的次轨（如 6 栏配 3×4，或 12 栏配 4×3）。",
    };
  } else if (overDense) {
    fault = {
      code: "err_dense",
      badge: "错态 · 轨道过密",
      headline: `版面切出 ${uniqueInternalAxes} 条互不对齐的纵线，视觉碎成渔网`,
      why: `${cols} 栏叠加 ${modCols} 列互质模块，又偏离外框，满屏纵横交错产生 ${slivers.length} 处窄碎缝。人眼扫读时找不到哪根才是主轴，秩序反而变成噪点。`,
      action: "把主栏和模块换成整除组合（如 6 栏 + 3×4 或 12 栏 + 4×3），再把描纸拖回 0px。",
    };
  } else if (!exactNest) {
    const gText = commonDiv > 1
      ? `虽在中轴重合 ${commonDiv - 1} 线，但两侧栏缝仅差 ${Math.round(minGap * 100)}% 宽`
      : `gcd(${cols}, ${modCols}) = 1，两套网在内部零重合`;
    fault = {
      code: "err_coprime",
      badge: "错态 · 互质打架",
      headline: `${cols} 栏硬叠 ${modCols} 列模块，切出 ${slivers.length} 处窄碎缝`,
      why: `${gText}。青线和紫线在版心彼此插空，卡片边缘刚离主栏缝几毫米又撞上下一根模块线——人眼会把这种近距双线当成「没对齐的失误」。`,
      action: `在顶部公式把主栏改为 ${modCols === 3 ? "6 栏或 12 栏" : modCols === 4 ? "12 栏或 4 栏" : "能整除次轨的栏数（如 6 栏配 3×4）"}，让两条轨道共用栏缝。`,
    };
  } else if (absOffset > alignTol) {
    const dir = offsetPx > 0 ? `右偏 +${offsetPx}px` : `左偏 ${offsetPx}px`;
    fault = {
      code: "err_phase",
      badge: "错态 · 描纸脱槽",
      headline: `次模块描纸${dir}，模块边界悬在栏沟外面`,
      why: `虽然 ${cols} 栏与 ${modCols}×${modRows} 模块在数学上能整除共轨，但次网没有落回主网的外框起点。卡片竖边与主栏沟平行错开 ${Math.abs(offsetPx)}px，像重影未套准的印刷品。`,
      action: "直接横向拖动暖米纸画布（或按 ← / → 键），把描纸推回 0px 听凭共轨自动吸住。",
    };
  } else if (state.heroRole === "bad_drift") {
    fault = {
      code: "err_drift",
      badge: "错态 · 大图脱锚",
      headline: "核心视觉块脱离所有主次轨道，浮在版心发飘",
      why: "复合网格允许大视觉跨越多栏以建立层级，但跨轨不等于脱轨——它的左右边缘必须稳稳钉在某两根共轨线上，才能锚定整页重心。",
      action: "点击画布里带红框的大图块（或点「全块归轨」），让它重新跨 4 栏锚定共轨。",
    };
  } else if (misassignedCount > 0) {
    const detail = state.leadRole !== "column" && state.dataRole !== "module"
      ? "导语长文被塞进窄模块格、数据环又浮跨半栏"
      : state.leadRole !== "column"
        ? "导语长文错挤进狭窄模块小格，行长过短频频折行"
        : "数据与图卡没有落进模块单元，浮在青紫夹缝里";
    fault = {
      code: "err_roles",
      badge: "错态 · 职能错配",
      headline: `${detail}（错配 ${misassignedCount} 处）`,
      why: "原海报强调「大区域遵循栏栅，细节区域启用模数」：连贯长文需要稳定的栏宽读起来才顺畅，零散指标与小图进模块格才能整齐对比。",
      action: "直接点击画布里标红虚线框的错配块（或点「内容归轨」），把文字还给栏栅、指标还给模块。",
    };
  } else if (!baselineOk) {
    fault = {
      code: "err_baseline",
      badge: "错态 · 基线脱钩",
      headline: "主次两区各用各的行距，跨区文字底座错齿",
      why: "栏栅管大骨架、模块管格子，但左栏长文与右区图注如果不共享同一把横向基线尺，视线水平扫过去时，文字底沿会像踩空楼梯一样一高一低。",
      action: "在顶部公式栏把「基线 BASELINES」切到 24pt 统一或 20pt 紧凑，合拢最后一道节奏。",
    };
  }

  const okSummary = {
    code: "ok",
    badge: `协同达标 · ${score}/4`,
    headline: `${cols} 栏主轨 × ${modCols}×${modRows} 次模块 × ${state.baseline}pt 基线已合槽`,
    why: `每 1 个次模块精准横跨 ${cols / modCols} 栏主轨，内部共享 ${sharedAxes} 条零偏差共轨线；长文稳走栏栅、数据图卡齐落模块、跨区文字同踩 ${state.baseline}pt 基线，复杂信息彼此协作而不抢戏。`,
    action: "试着切到「城市与水 / 数据年报」或换一套 12 栏 + 4×3 方案，验证多组正当复合解。",
  };

  // 7. 原海报 5 枚「核心要点」实时状态灯
  const keyPoints = [
    {
      id: "kp1",
      title: "混合结构",
      body: "组合栏栅、模数、手稿或轴线，形成主从关系。",
      ok: divisorOk,
      tag: isSingleGrid ? "仅剩单网" : divisorOk ? `${cols}:${modCols} 共约` : `互质 ${slivers.length} 缝`,
    },
    {
      id: "kp2",
      title: "灵活分配",
      body: "大区域遵循栏栅，细节区域启用模数，按需响应。",
      ok: phaseOk,
      tag: !state.marginOn ? "无外边距" : phaseOk ? "0px 合槽" : `偏 ${offsetPx > 0 ? "+" : ""}${offsetPx}px`,
    },
    {
      id: "kp3",
      title: "内容匹配",
      body: "文本、图像、数据、注释各得其所，清晰易读。",
      ok: rolesOk,
      tag: rolesOk ? "各归其轨" : `错配 ${misassignedCount} 处`,
    },
    {
      id: "kp4",
      title: "层级清晰",
      body: "通过尺寸、位置与留白，明确节奏与视觉重点。",
      ok: state.heroRole === "anchor" && state.marginOn,
      tag: !state.marginOn ? "贴边无白" : state.heroRole === "anchor" ? "跨轨锚定" : "大图脱锚",
    },
    {
      id: "kp5",
      title: "可控变化",
      body: "在统一结构中引入变化，保持秩序与丰富并存。",
      ok: score === 4,
      tag: score === 4 ? `${state.baseline}pt 齐拍` : baselineOk ? "待理主次" : "基线脱钩",
    },
  ];

  // 8. 轨道与 CSS 映射（实时展示现代网页对应实现）
  const cssTrackStr = isSingleGrid
    ? `repeat(${cols}, 1fr)`
    : exactNest
      ? `repeat(${cols}, 1fr) /* 每 ${cols / modCols} 栏合 1 模块 */`
      : `repeat(${commonMult}, 1fr) /* 需 ${commonMult} 拍才能容纳 ${cols}+${modCols} */`;

  return {
    cols,
    modCols,
    modRows,
    offset,
    offsetPx,
    colLines,
    modLines,
    sharedAxes,
    sharedPositions,
    slivers,
    minGapPct: minGap < 1 ? Math.round(minGap * 100) : 0,
    uniqueInternalAxes,
    commonDiv,
    commonMult,
    isSingleGrid,
    exactNest,
    divisorOk,
    phaseOk,
    rolesOk,
    baselineOk,
    misassignedCount,
    score,
    diag: fault || okSummary,
    keyPoints,
    cssTrackStr,
  };
}
