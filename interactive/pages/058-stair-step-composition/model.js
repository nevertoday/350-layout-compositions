// 058 阶梯构图 · 单一数据源与统一判定模型
// 开场筑阶台、04 节级数压测、07 节题材练习揭晓全部共用本模块的常量表与函数。

export const STEP_RULES = Object.freeze({
  // 横向踏宽边界（占单块宽度的百分比，经验值）
  runMin: 62,
  runMax: 124,
  runSliderMin: 42,
  runSliderMax: 148,
  // 垂直落差与步高节奏边界（海拔 0–100 标尺格，经验值）
  flatSpan: 10,
  minRise: 9,
  maxRatio: 1.65,
  // 建筑立面归一化换算比例（100 格海拔 = 265 归一化高度单位，单块宽 = 100 单位）
  riseUnitScale: 2.65,
  // 舒适上行坡角范围（度，经验值）
  slopeMin: 16,
  slopeMax: 52,
  // 舒适总级数范围（04 节共用，经验值）
  idealCountMin: 3,
  idealCountMax: 5,
  // 四级海拔限幅：为左上「阶梯构图」标题三角留出硬禁区，避免 01 / 02 级被拖进标题
  heightCaps: Object.freeze([
    Object.freeze({ min: 0, max: 42 }),
    Object.freeze({ min: 0, max: 60 }),
    Object.freeze({ min: 0, max: 82 }),
    Object.freeze({ min: 0, max: 96 }),
  ]),
});

// 原海报 058 四级要点原文（来源：site/src/data/poster-text.json）
export const POSTER_STEPS = Object.freeze([
  Object.freeze({
    no: "01",
    title: "确定起点",
    shortLines: ["确定", "起点"],
    body: "建立视觉起点，吸引注意力，作为信息的开端。",
    en: "STARTING POINT",
    shape: "circle",
  }),
  Object.freeze({
    no: "02",
    title: "逐级推进",
    shortLines: ["逐级", "推进"],
    body: "信息按顺序递进，每一步强化前一层的内容与方向。",
    en: "STEP-BY-STEP PROGRESSION",
    shape: "triangle",
  }),
  Object.freeze({
    no: "03",
    title: "强化层级",
    shortLines: ["强化", "层级"],
    body: "通过大小、位置、色彩区分层级，突出重点，建立视觉秩序。",
    en: "STRENGTHEN HIERARCHY",
    shape: "square",
  }),
  Object.freeze({
    no: "04",
    title: "引导终点",
    shortLines: ["引导", "终点"],
    body: "在最高处形成视觉落点，完成信息传达，留下清晰印象。",
    en: "LEAD TO THE DESTINATION",
    shape: "star",
  }),
]);

// 开场初始状态：同时预埋 01→02 微差(+4)、02→03 中段折返(-9)、03→04 跳崖(+53)
// 判定引擎按严格优先级一次只报最致命的一条主错。
export const INITIAL_STATE = Object.freeze({
  heights: Object.freeze([18, 22, 13, 66]),
  runRatio: 94,
});

export const FLAT_STATE = Object.freeze({
  heights: Object.freeze([28, 28, 28, 28]),
  runRatio: 94,
});

// 07 节小练习四选项共用的锁定等差阶梯几何
export const QUIZ_LOCKED_STATE = Object.freeze({
  heights: Object.freeze([10, 32, 54, 76]),
  runRatio: 96,
});

export function clampHeight(index, value) {
  const cap = STEP_RULES.heightCaps[index] || { min: 0, max: 96 };
  return Math.round(Math.max(cap.min, Math.min(cap.max, value)));
}

export function clampRunRatio(value) {
  return Math.round(Math.max(STEP_RULES.runSliderMin, Math.min(STEP_RULES.runSliderMax, value)));
}

export function fmtDelta(d) {
  return d > 0 ? `+${d}` : `${d}`;
}

/**
 * 阶梯构图核心判定引擎（严格优先级，一次只报一条主错）
 * 仅认可「由低到高」匀步上行（因为 04 卡片明确规定在最高处形成视觉落点）。
 */
export function evaluateStair(state) {
  const h = state.heights.map((v, i) => clampHeight(i, v));
  const runRatio = clampRunRatio(state.runRatio);
  const deltas = [h[1] - h[0], h[2] - h[1], h[3] - h[2]];
  const absDeltas = deltas.map((d) => Math.abs(d));
  const minH = Math.min(...h);
  const maxH = Math.max(...h);
  const span = maxH - minH;
  const totalRise = h[3] - h[0];
  const totalRunNorm = 3 * runRatio;
  const slopeRad = Math.atan2(totalRise * STEP_RULES.riseUnitScale, totalRunNorm);
  const slopeDeg = Math.round((slopeRad * 180) / Math.PI);

  const positiveDeltas = deltas.filter((d) => d > 0);
  const allAscending = deltas.every((d) => d > 0);
  const allDescending = deltas.every((d) => d <= 0) && h[3] < h[0];
  const minPos = positiveDeltas.length ? Math.min(...positiveDeltas) : 0;
  const maxPos = positiveDeltas.length ? Math.max(...positiveDeltas) : 0;
  const ratio = allAscending && minPos > 0 ? +(maxPos / minPos).toFixed(2) : null;

  // 各维度定性档位（经验值，用于读数条展示）
  const runTier =
    runRatio < STEP_RULES.runMin
      ? "过挤"
      : runRatio > STEP_RULES.runMax
        ? "过散"
        : "合度";
  const slopeTier =
    slopeDeg < 0
      ? "下行"
      : slopeDeg < STEP_RULES.slopeMin
        ? "过缓"
        : slopeDeg > STEP_RULES.slopeMax
          ? "过陡"
          : "舒适";

  // 严格按优先级判定（一次只输出一条主错）
  let code = "ok";
  let severity = "ok"; // "err" | "warn" | "ok"
  let tier = "成梯 · 匀步上行";
  let headline = "四级匀步爬升，视线稳稳落向最高点 04";
  let why = `三段步高（${deltas.map(fmtDelta).join(" / ")} 格）均匀递升、步宽 ${runRatio}% 合度、坡角 ${slopeDeg}° 舒适（均在经验值内）；每级踏面给眼睛清晰落脚点，最后在 04 最高处完成高潮收口。`;
  let focusStep = 3; // 建议关注的阶梯索引（0–3）
  let problemSegment = -1; // 高亮出错的相邻段（0: 01→02, 1: 02→03, 2: 03→04）

  // 优先级 1：横向步宽失界
  if (runRatio < STEP_RULES.runMin) {
    code = "crowded";
    severity = "err";
    tier = "过挤 · 滑向层叠";
    headline = `步宽压到 ${runRatio}%，踏面被后一块压盖`;
    why = `横向步宽低于经验下限 ${STEP_RULES.runMin}%，前级卡片被后级挡住，构图已经滑进前后遮挡的层叠关系，眼睛在每一级站不住脚；向右拉宽底沿步宽游标。`;
    focusStep = 1;
  } else if (runRatio > STEP_RULES.runMax) {
    code = "scattered";
    severity = "err";
    tier = "过散 · 断桥孤岛";
    headline = `步宽拉到 ${runRatio}%，块间空沟扯断斜势`;
    why = `横向步宽超过经验上限 ${STEP_RULES.runMax}%，相邻踏面裂开大片空沟，格式塔良好连续律失效，四块散成孤岛；向左收紧底沿步宽游标。`;
    focusStep = 2;
  }
  // 优先级 2：平排 / 下行冲突 / 折返断阶
  else if (span < STEP_RULES.flatSpan) {
    code = "flat";
    severity = "err";
    tier = "平排 · 零落差";
    headline = "四级几乎齐平，阶梯进程感全部抹掉";
    why = `四级总落差只有 ${span} 格（经验下限 ${STEP_RULES.flatSpan} 格），眼睛把四块读成平权并列，分不清起点与终点；把 01 留在低位，逐级拉高 02、03、04。`;
    focusStep = 3;
  } else if (allDescending) {
    code = "descending";
    severity = "err";
    tier = "逆向 · 下行冲突";
    headline = "终点落在最低处，与 04 职责冲突";
    why = "04 卡片写明「在最高处形成视觉落点」，此刻整架阶梯却由高到低沉向右下，视觉重量和文案职责正相反；把 01 降到左下、04 抬到右上最高处（下行拆解用法见第 02 节）。";
    focusStep = 3;
  } else if (!allAscending) {
    // 找出首个 <= 0 的折返段（优先找真正负值下塌段）
    let seg = deltas.findIndex((d) => d < 0);
    if (seg < 0) seg = deltas.findIndex((d) => d <= 0);
    problemSegment = seg;
    focusStep = seg + 1;
    const fromNo = POSTER_STEPS[seg].no;
    const toNo = POSTER_STEPS[seg + 1].no;
    const drop = deltas[seg];
    code = "reversal";
    severity = "err";
    tier = "折返 · 中段下塌";
    headline =
      drop < 0
        ? `${fromNo} 到 ${toNo} 反向下塌 ${Math.abs(drop)} 格，攀升被打断`
        : `${fromNo} 与 ${toNo} 完全齐平，进程卡顿`;
    why =
      drop < 0
        ? `高低顺序和 01–04 逻辑次序打架，视线爬到 ${fromNo} 被绊回头，没法顺着单一斜势直上 ${POSTER_STEPS[3].no}；先把 ${toNo} 往上拖过 ${fromNo}，再调匀三段步高。`
        : `${fromNo} 和 ${toNo} 海拔一样高，视线在这里停成平排；把 ${toNo} 往上拉出明显步高差。`;
  }
  // 优先级 3：步差过浅（像没对齐）
  else if (minPos < STEP_RULES.minRise) {
    const seg = deltas.indexOf(minPos);
    problemSegment = seg;
    focusStep = seg + 1;
    const fromNo = POSTER_STEPS[seg].no;
    const toNo = POSTER_STEPS[seg + 1].no;
    code = "shallow";
    severity = "warn";
    tier = "过浅 · 像没对齐";
    headline = `${fromNo} 到 ${toNo} 只差 ${minPos} 格，像手抖没排齐`;
    why = `单步落差低于经验下限 ${STEP_RULES.minRise} 格时，人眼不会把它当成有意抬升的台阶，只会当成对齐失误；把 ${fromNo} 与 ${toNo} 的高度差再拉开。`;
  }
  // 优先级 4：跳崖失律
  else if (ratio > STEP_RULES.maxRatio) {
    const maxSeg = deltas.indexOf(maxPos);
    problemSegment = maxSeg;
    focusStep = maxSeg + 1;
    const fromNo = POSTER_STEPS[maxSeg].no;
    const toNo = POSTER_STEPS[maxSeg + 1].no;
    code = "cliff";
    severity = "warn";
    tier = "失律 · 跳崖断层";
    headline = `${fromNo} 到 ${toNo} 步差达 ${ratio}×，后段像跳崖`;
    why = `最大/最小步差比超过经验上限 ${STEP_RULES.maxRatio}×（三段为 ${deltas.map(fmtDelta).join(" / ")} 格）：小步段挤成碎步、悬崖段猛然拔高，节拍断裂；把高步压稳或把中间阶抬匀。`;
  }
  // 优先级 5：坡角过缓或过陡
  else if (slopeDeg < STEP_RULES.slopeMin) {
    code = "too_gentle";
    severity = "warn";
    tier = "坡缓 · 势能不足";
    headline = `整体坡角仅 ${slopeDeg}°，上升势能偏弱`;
    why = `虽然三步均匀，但总斜率低于经验舒适下限 ${STEP_RULES.slopeMin}°（经验 ${STEP_RULES.slopeMin}°–${STEP_RULES.slopeMax}°），远看接近斜拉平排；拉大高低跨度或微收步宽。`;
    focusStep = 3;
  } else if (slopeDeg > STEP_RULES.slopeMax) {
    code = "too_steep";
    severity = "warn";
    tier = "过陡 · 像爬竖梯";
    headline = `整体坡角达 ${slopeDeg}°，横向踏面显窄`;
    why = `斜率超出经验舒适上限 ${STEP_RULES.slopeMax}°（经验 ${STEP_RULES.slopeMin}°–${STEP_RULES.slopeMax}°），台阶竖得太急，视线像爬直梯、踏面留不住停顿节拍；把步宽放舒展或略降高差。`;
    focusStep = 3;
  }

  // 四枚原海报底部关键词徽记的实时点亮逻辑（与判定同源）
  const runOk = runRatio >= STEP_RULES.runMin && runRatio <= STEP_RULES.runMax;
  const badges = {
    direction: runOk && allAscending, // 方向感：连续且单调上行
    hierarchy: runOk && allAscending && minPos >= STEP_RULES.minRise && span >= STEP_RULES.flatSpan, // 层级性：每级落差清晰可辨
    rhythm: runOk && allAscending && minPos >= STEP_RULES.minRise && ratio !== null && ratio <= STEP_RULES.maxRatio, // 节奏性：步差均匀不跳崖
    progression: code === "ok", // 进程感：全项达标，首尾贯通
  };

  return {
    heights: h,
    runRatio,
    deltas,
    absDeltas,
    span,
    slopeDeg,
    ratio,
    runTier,
    slopeTier,
    code,
    severity,
    tier,
    headline,
    why,
    focusStep,
    problemSegment,
    badges,
    isOk: code === "ok",
  };
}

/**
 * 计算四座等轴建筑阶梯块在画布中的精确像素几何
 * Canvas 渲染与原生 <button> 把手定位共用同一套坐标，杜绝偏移。
 */
export function computeStageLayout(state, width, height, mode = "desktop") {
  const h = state.heights.map((v, i) => clampHeight(i, v));
  const runRatio = clampRunRatio(state.runRatio);
  const compact = mode === "mobile" || mode === "landscape";
  const isTablet = mode === "tablet";

  // 横向尺寸：以 100% 块宽为基准，保证即使 runRatio=148% 也不越界
  const padX = compact ? 14 : isTablet ? 24 : Math.max(28, width * 0.032);
  const availW = Math.max(220, width - padX * 2);

  // 最大跨度按当前 runRatio 缩放防越界，2560 超宽屏与平板同步放大填满舞台
  const spanFactor = 1 + 3 * (runRatio / 100);
  const maxCardW = compact
    ? Math.min(106, availW / 3.85)
    : isTablet
      ? Math.min(210, availW / 3.95)
      : Math.min(340, availW / 4.2);
  const minCardW = compact ? 54 : isTablet ? 118 : 136;
  const blockW = Math.max(minCardW, Math.min(maxCardW, availW / Math.max(spanFactor, 3.45)));

  const stepDx = blockW * (runRatio / 100);
  const totalW = blockW + 3 * stepDx;

  // 桌面端整体微偏右以给左上大标题让路；平板与窄屏完全居中
  let startX;
  if (mode === "desktop") {
    const rightAnchor = width - padX;
    const idealStart = rightAnchor - totalW;
    const minStart = padX;
    startX = Math.max(minStart, Math.min(idealStart, (width - totalW) * 0.64));
  } else {
    startX = (width - totalW) / 2;
  }

  // 纵向尺寸：等轴三面比例
  const riserW = Math.round(blockW * (compact ? 0.27 : 0.215));
  const faceW = blockW - riserW;
  const isoDx = Math.round(blockW * (compact ? 0.10 : 0.085));
  const treadH = Math.round(blockW * (compact ? 0.135 : 0.10));
  const cardH = compact
    ? Math.max(78, Math.min(112, height * (mode === "landscape" ? 0.31 : 0.285)))
    : isTablet
      ? Math.max(134, Math.min(168, height * 0.365))
      : Math.max(154, Math.min(228, height * 0.345));
  const shapeSize = compact
    ? Math.max(18, Math.min(23, blockW * 0.25))
    : isTablet
      ? Math.max(24, Math.min(30, blockW * 0.165))
      : Math.max(26, Math.min(38, blockW * 0.15));

  // 底沿留足空间给挂在块底缘的 01–04 升降柄（绝不遮挡顶部 ●▲■★ 几何体）
  const bottomMargin = compact ? 32 : 34;
  const topMargin = compact ? 32 : 44;
  const baseBottomY = height - bottomMargin;
  const maxLift = Math.max(
    compact ? 105 : 170,
    baseBottomY - cardH - treadH - shapeSize * 1.35 - topMargin
  );

  // 左上标题禁区（仅桌面端内嵌标题时生效）
  const titleSafeZone =
    mode === "desktop"
      ? {
          x: padX,
          y: 12,
          w: Math.min(440, width * 0.36),
          h: Math.min(210, height * 0.40),
        }
      : null;

  const blocks = h.map((hv, i) => {
    const x = startX + i * stepDx;
    const lift = (hv / 100) * maxLift;
    const cardBottomY = baseBottomY - lift;
    const cardTopY = cardBottomY - cardH;
    const treadBackY = cardTopY - treadH;
    const shapeCenterX = x + riserW + faceW * 0.46 + isoDx * 0.45;
    const shapeBaseY = cardTopY - treadH * 0.44;

    // 升降柄定位：稳挂在每级阶梯块底缘中点，完全避开顶面渐进几何体与卡面正文
    const handleX = x + blockW * 0.52;
    const handleY = cardBottomY + 4;

    return {
      index: i,
      heightVal: hv,
      x,
      riserW,
      faceW,
      blockW,
      cardTopY,
      cardBottomY,
      cardH,
      treadH,
      treadBackY,
      isoDx,
      shapeSize,
      shapeCenterX,
      shapeBaseY,
      handleX,
      handleY,
      baseBottomY,
      maxLift,
    };
  });

  return {
    width,
    height,
    mode,
    compact,
    isTablet,
    blockW,
    stepDx,
    baseBottomY,
    maxLift,
    titleSafeZone,
    blocks,
  };
}

/**
 * 04 节级数压测判定（与 STEP_RULES 共用经验上限 3–5 级；直接接收 DOM 实测宽与每行字数，单一数据源）
 */
export function evaluateStepCount(count, measuredFaceW, measuredChars) {
  const faceWidthPx = Math.round(measuredFaceW);
  const charsPerLine = Math.max(1, Math.round(measuredChars));

  let tier = "舒适区 · 经验推荐";
  let status = "ok";
  let summary = "";
  if (count < STEP_RULES.idealCountMin) {
    tier = "偏少 · 阶势未起";
    status = "warn";
  } else if (count === 3) {
    tier = "舒展 · 轻快三阶";
    status = "ok";
    summary = `在经验舒适区（${STEP_RULES.idealCountMin}–${STEP_RULES.idealCountMax} 级）下限：每级正面实测宽 ${faceWidthPx}px，每行容得下约 ${charsPerLine} 个汉字，呼吸宽裕、适合精炼三步。`;
  } else if (count === 4) {
    tier = "黄金四阶 · 原海报基准";
    status = "ok";
    summary = `落在经验舒适区（${STEP_RULES.idealCountMin}–${STEP_RULES.idealCountMax} 级）正中：每级正面实测宽 ${faceWidthPx}px，每行约 ${charsPerLine} 字，标题与说明从容展开，高低节奏最稳。`;
  } else if (count === 5) {
    tier = "紧致 · 经验上限";
    status = "warn";
    summary = `已贴近经验上限（${STEP_RULES.idealCountMax} 级）：每级正面收窄到 ${faceWidthPx}px（每行约 ${charsPerLine} 字），说明文字必须压短才能保住踏面清爽。`;
  } else {
    tier = "超载 · 踏面挤碎";
    status = "err";
    summary = `超出经验上限（${STEP_RULES.idealCountMin}–${STEP_RULES.idealCountMax} 级）：${count} 级平分画幅后每级正面只剩 ${faceWidthPx}px（每行仅约 ${charsPerLine} 字），中文被迫拆成竖排碎条、斜梯退化成密齿锯条。`;
  }

  return {
    count,
    faceWidthPx,
    charsPerLine,
    tier,
    status,
    summary,
    idealLabel: `经验值 ${STEP_RULES.idealCountMin}–${STEP_RULES.idealCountMax} 级`,
  };
}
