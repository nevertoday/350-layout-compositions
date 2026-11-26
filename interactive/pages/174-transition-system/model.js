// 174 过渡系统 · 单真源状态、实绘几何与双向错态诊断引擎
// 所有页面读数、右上三阶探针、左下圆环徽标、画布标尺与诊单文案均由此单一真源算出。
import { PAL, clamp, lerp } from "./palette.js";

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 几何光带",
    short: "原海报",
    stages: [
      { code: "01", name: "起点", en: "START", caption: "单点轻落" },
      { code: "02", name: "连接", en: "CONNECT", caption: "双形交叠" },
      { code: "03", name: "递进", en: "PROGRESS", caption: "四连放大" },
      { code: "04", name: "焦点", en: "FOCUS", caption: "光带收束" },
    ],
  },
  type: {
    id: "type",
    label: "字阶 · 错层排印",
    short: "错层字阶",
    stages: [
      { code: "01", name: "引子", en: "LEAD-IN", caption: "14px 轻注", sample: "AUTUMN ISSUE · 2026" },
      { code: "02", name: "承接", en: "BRIDGE", caption: "双带错移", sample: "空间与字流的边界" },
      { code: "03", name: "展开", en: "BUILD", caption: "三阶加粗", sample: "从字重到尺度的梯级" },
      { code: "04", name: "焦标", en: "HEADLINE", caption: "巨标锚定", sample: "过渡即秩序" },
    ],
  },
  product: {
    id: "product",
    label: "产品 · 叙事长廊",
    short: "叙事长廊",
    stages: [
      { code: "01", name: "入口", en: "ENTRY", caption: "轻触线索", tag: "STEP 01", title: "采集素材" },
      { code: "02", name: "关联", en: "LINK", caption: "双卡交汇", tag: "STEP 02", title: "建立关联" },
      { code: "03", name: "演进", en: "SCALE", caption: "三阶汇总", tag: "STEP 03", title: "提炼层级" },
      { code: "04", name: "决策", en: "ACTION", caption: "核心聚焦", tag: "FOCUS", title: "直达行动" },
    ],
  },
};

export const MORPH_NAMES = {
  0: { sym: "□", label: "硬方" },
  0.5: { sym: "▢", label: "圆方" },
  1: { sym: "○", label: "正圆" },
};

// 开场刻意停在 0/4 四重复合错态：比例倒挂 + 跨屏断连 52px + 圆方打架 + 色阶逆乱
export const INITIAL_STATE = {
  specimen: "poster",
  cohesion: 0.22,
  scales: [1.46, 0.74, 0.78, 0.88],
  morphs: [1, 0, 1, 0],
  colorMode: "clash", // "gradient" | "clash" | "flat"
  selectedStage: 0,
  showGuides: true,
};

// 多组合法解（全部真实通过 4/4）与双向反例试错预设
export const PRESETS = {
  classic: {
    id: "classic",
    label: "原海报经典解",
    kind: "good",
    note: "纯圆逐阶放大，珊瑚红经暖橘熔流入琥珀金焦点巨带",
    patch: { cohesion: 0.80, scales: [0.62, 0.96, 1.42, 2.08], morphs: [1, 1, 1, 1], colorMode: "gradient" },
  },
  morphArc: {
    id: "morphArc",
    label: "方圆演化解",
    kind: "good",
    note: "致敬原海报左下徽章 □·○◯→：由硬方经圆方顺滑蜕变为焦点正圆",
    patch: { cohesion: 0.76, scales: [0.58, 0.92, 1.38, 2.02], morphs: [0, 0.5, 1, 1], colorMode: "gradient" },
  },
  sprint: {
    id: "sprint",
    label: "快节奏递进解",
    kind: "good",
    note: "更紧凑的起始铺垫与明显阶梯加速，适合海报强聚焦",
    patch: { cohesion: 0.85, scales: [0.52, 0.86, 1.44, 2.30], morphs: [0.5, 0.5, 1, 1], colorMode: "gradient" },
  },
  badFlat: {
    id: "badFlat",
    label: "试错：平庸拉平",
    kind: "bad",
    note: "四阶几乎等大且全灰单色，看不出起点与焦点",
    patch: { cohesion: 0.76, scales: [1.14, 1.18, 1.22, 1.26], morphs: [1, 1, 1, 1], colorMode: "flat" },
  },
  badCliff: {
    id: "badCliff",
    label: "试错：跨阶断崖",
    kind: "bad",
    note: "前三阶几乎原地踏步，最后一阶突增 3 倍以上，视觉直接摔崖",
    patch: { cohesion: 0.78, scales: [0.58, 0.62, 0.68, 2.42], morphs: [0, 0, 0, 1], colorMode: "gradient" },
  },
  badMush: {
    id: "badMush",
    label: "试错：粘连糊团",
    kind: "bad",
    note: "连贯度拉满到 100% 且尺度偏肥，四阶段挤糊在一起失去呼吸",
    patch: { cohesion: 1.0, scales: [1.32, 1.56, 1.84, 2.15], morphs: [1, 1, 1, 1], colorMode: "gradient" },
  },
  badInitial: {
    id: "badInitial",
    label: "复原开场错态",
    kind: "reset",
    note: "回到开场 0/4 比例倒挂、光带断裂、圆方打架与色阶混撞状态",
    patch: { ...INITIAL_STATE },
  },
};

export function createState() {
  return {
    ...INITIAL_STATE,
    scales: [...INITIAL_STATE.scales],
    morphs: [...INITIAL_STATE.morphs],
  };
}

export function stagePalette(colorMode) {
  if (colorMode === "gradient") {
    return [PAL.coral, "#F08456", PAL.orange, PAL.gold];
  }
  if (colorMode === "clash") {
    return [PAL.clashA, PAL.clashB, PAL.clashC, PAL.clashD];
  }
  return [PAL.flatGray, "#8E879C", "#918AA0", "#958EA4"];
}

// 根据真实画布宽高计算四块透视展板几何、图形实际半径与跨屏熔流缝隙
export function computeGeometry(state, w, h) {
  const padX = Math.max(14, Math.round(w * 0.034));
  const topY = Math.max(48, Math.round(h * 0.165));
  const botY = Math.round(h * 0.885);
  const usableW = Math.max(240, w - padX * 2);
  const usableH = Math.max(150, botY - topY);

  // 4 块透视面板宽度占比：左三块节奏匀称，第 4 块焦点巨屏最宽最高（呼应 174 原海报）
  const gapRatio = lerp(0.056, 0.012, clamp(state.cohesion, 0, 1));
  const totalGap = usableW * gapRatio * 3;
  const bodyW = usableW - totalGap;
  const wShares = [0.195, 0.215, 0.245, 0.345];
  const gapPx = usableW * gapRatio;

  const panels = [];
  let cursorX = padX;
  const midY = topY + usableH * 0.48;
  for (let i = 0; i < 4; i++) {
    const pw = bodyW * wShares[i];
    // 1–3 屏呈现 174 原海报的轻向右透视收斜；第 4 屏反向舒展成高大焦点巨屏
    let yTL, yTR, yBL, yBR;
    if (i < 3) {
      const hL = usableH * (0.60 - i * 0.014);
      const hR = usableH * (0.55 - i * 0.012);
      const shift = i * usableH * 0.026;
      yTL = midY - hL * 0.54 + shift;
      yTR = midY - hR * 0.49 + shift;
      yBL = yTL + hL;
      yBR = yTR + hR;
    } else {
      // 第 4 屏：左高略收、右高张开但严格守在 topY + 12 安全线下方，永不撞右上状态章
      const hL = usableH * 0.74;
      const hR = usableH * 0.90;
      yTL = Math.max(topY + 16, midY - hL * 0.48);
      yTR = Math.max(topY + 8, midY - hR * 0.50);
      yBL = yTL + hL;
      yBR = yTR + hR;
    }
    const cx = cursorX + pw * 0.5;
    const cy = (yTL + yTR + yBL + yBR) * 0.25;
    panels.push({
      index: i,
      x: cursorX,
      w: pw,
      yTL,
      yTR,
      yBL,
      yBR,
      cx,
      cy,
      hAvg: ((yBL - yTL) + (yBR - yTR)) * 0.5,
    });
    cursorX += pw + gapPx;
  }

  // 每屏实绘主图形半径（严格按短边基准计算，保证任何屏幕下圆绝不变椭圆）
  const baseUnit = Math.min(usableW * 0.044, usableH * 0.132);
  const radii = state.scales.map((s, i) => {
    const maxR = Math.min(panels[i].w * 0.44, panels[i].hAvg * 0.42);
    return clamp(baseUnit * s, 9, maxR);
  });

  // 实际绘制出的相邻比例比（由真实半径算出，确保读数与画面绝对同一真源）
  const stepRatios = [
    radii[1] / Math.max(1, radii[0]),
    radii[2] / Math.max(1, radii[1]),
    radii[3] / Math.max(1, radii[2]),
  ];
  const totalRatio = radii[3] / Math.max(1, radii[0]);

  // 第 3→4 屏渐融焦点光带实绘缝隙（px）：连贯度 >= 0.62 才无缝汇合，低于此值显出真实像素裂口
  const rawBridgeGap = state.cohesion >= 0.62 ? 0 : Math.round(((0.62 - state.cohesion) / 0.40) * Math.max(36, usableW * 0.056));
  const bridgeGapPx = Math.max(0, rawBridgeGap);

  // 粘连度检测：连贯度 > 0.94 且整体体量偏肥，导致阶与阶边界糊成一团
  const avgScale = (state.scales[0] + state.scales[1] + state.scales[2] + state.scales[3]) / 4;
  const overlapCrowded = state.cohesion > 0.94 && (avgScale > 1.26 || gapPx < 10);

  // 第 2 屏双圆重叠率 & 第 3 屏四连圆列重叠率（示意物理衔接紧密度）
  const overlapRatio = clamp((state.cohesion - 0.18) / 0.72, 0, 1.15);

  // 焦点视觉面积占比（第 4 屏主图形面积 / 四屏主图形总面积）
  const areas = radii.map((r) => Math.PI * r * r);
  const totalArea = areas.reduce((a, b) => a + b, 0);
  const focusAreaShare = areas[3] / Math.max(1, totalArea);

  // 视线路径控制点（供光球动画和路径渲染共用）
  const nodes = panels.map((p, i) => ({
    x: p.cx,
    y: i === 3 ? p.cy + p.hAvg * 0.02 : p.cy,
    r: radii[i],
    morph: state.morphs[i],
    scale: state.scales[i],
  }));

  return {
    w,
    h,
    padX,
    topY,
    botY,
    usableW,
    usableH,
    gapPx,
    panels,
    radii,
    stepRatios,
    totalRatio,
    bridgeGapPx,
    overlapRatio,
    overlapCrowded,
    focusAreaShare,
    nodes,
  };
}

// 单真源双向核算 4 个主维度与 9 类真错态
export function evaluate(state, geom) {
  const { stepRatios, totalRatio, bridgeGapPx, overlapCrowded, focusAreaShare, radii } = geom;

  // 1. 形态单调性检查：允许全圆、全方、方→圆递进、圆→方递进；反对圆→方→圆来回打架
  let morphDir = 0;
  let morphZigzag = false;
  let morphJumpIdx = -1;
  for (let i = 0; i < 3; i++) {
    const d = state.morphs[i + 1] - state.morphs[i];
    if (Math.abs(d) > 0.01) {
      if (morphDir !== 0 && Math.sign(d) !== morphDir) {
        morphZigzag = true;
        morphJumpIdx = i + 1;
      }
      morphDir = Math.sign(d);
    }
  }
  const morphSpan = Math.abs(state.morphs[3] - state.morphs[0]);

  // 2. 比例递进检查（双向：倒挂 / 平庸拉平 / 跨阶断崖）
  const reverseIdx = stepRatios.findIndex((r) => r < 1.03);
  const flatRatio = totalRatio < 1.80;
  const cliffIdx = stepRatios.findIndex((r) => r > 2.55);
  const maxStep = Math.max(...stepRatios);
  const minStep = Math.min(...stepRatios);

  // 3. 衔接连贯度检查（双向：断裂 vs 粘连糊团）
  const disconnected = bridgeGapPx > 0 || state.cohesion < 0.58;

  // 4. 色阶与层级焦点检查
  const colorClash = state.colorMode === "clash";
  const colorFlat = state.colorMode === "flat";
  const focusWeak = radii[3] <= Math.max(radii[0], radii[1], radii[2]) * 1.10 || focusAreaShare < 0.40;
  const startTooHeavy = radii[0] >= radii[1] * 0.96 || radii[0] >= radii[3] * 0.65;

  // 四项过关维度
  const passConnection = !disconnected && !overlapCrowded;
  const passProgression = reverseIdx === -1 && !flatRatio && cliffIdx === -1;
  const passMorphHue = !morphZigzag && !colorClash && !colorFlat;
  const passFocus = !focusWeak && !startTooHeavy && passProgression;

  const passedCount = [passConnection, passProgression, passMorphHue, passFocus].filter(Boolean).length;

  // 列出所有真实存在的错态（按严重度排序）
  const defects = [];
  if (reverseIdx !== -1) {
    const a = reverseIdx + 1;
    const b = reverseIdx + 2;
    defects.push({
      id: "reverse",
      stage: b - 1,
      short: `第${a}→${b}屏倒挂 ×${stepRatios[reverseIdx].toFixed(2)}`,
      headline: `第 ${a} 屏到第 ${b} 屏比例倒挂（×${stepRatios[reverseIdx].toFixed(2)}），视线在半路掉头`,
      body: `过渡系统必须有明确流向。现在第 ${a} 屏实绘尺度反而压过了后续步骤，读者第一眼就被锁在前面，往右看时视觉能量不升反降，顺滑流程直接卡死。`,
      hint: `向下拖小第 ${a} 屏图形，或把第 ${b}–4 屏依次向上拖大，让相邻两屏保持约 1.3×–1.8× 温和递增。`,
    });
  }
  if (disconnected) {
    defects.push({
      id: "disconnect",
      stage: 2,
      short: `光带裂口 ${bridgeGapPx}px`,
      headline: `跨屏连贯度仅 ${Math.round(state.cohesion * 100)}%，第 3–4 屏光带撕开 ${bridgeGapPx}px 裂口`,
      body: `原海报靠「交叠双圆 → 四连叠加 → 熔流巨带」把四块独立版面焊成一条动线。一旦衔接度低于 58%，元素退化成互不相干的散块，格式塔连续性当场断裂。`,
      hint: `在画布上向右横向拖动，把连贯度拉到 68%–90%，让圆列彼此轻叠并闭合右侧焦点光带。`,
    });
  }
  if (overlapCrowded) {
    defects.push({
      id: "crowded",
      stage: 2,
      short: `粘连糊团 ${Math.round(state.cohesion * 100)}%`,
      headline: `连贯度拉爆到 ${Math.round(state.cohesion * 100)}%，四阶挤成一团分不清步子`,
      body: `过渡不是把所有元素糊死在一起。连贯过度且单元偏肥时，展板间的呼吸缝几乎消失，读者分辨不出从起点到焦点的逐级步幅。`,
      hint: `稍微向左回拖连贯度到 72%–88%，或收小前两阶尺度，留出清透的冷紫雾呼吸缝。`,
    });
  }
  if (cliffIdx !== -1) {
    const a = cliffIdx + 1;
    const b = cliffIdx + 2;
    defects.push({
      id: "cliff",
      stage: b - 1,
      short: `第${a}→${b}屏断崖 ×${stepRatios[cliffIdx].toFixed(2)}`,
      headline: `第 ${a} 屏到第 ${b} 屏突增 ×${stepRatios[cliffIdx].toFixed(2)}，少了中间过渡台阶`,
      body: `前三屏几乎原地踏步、突然一步跳到巨型焦点，视觉像从平地一脚踏空摔下断崖。健康的阶梯每步递增约 1.3×–2.1×（经验区间），眼睛才跟得顺滑。`,
      hint: `把第 ${a} 屏往上拖大一点，或适度收敛第 ${b} 屏，让增幅均匀摊到四个台阶上。`,
    });
  }
  if (flatRatio) {
    defects.push({
      id: "flatScale",
      stage: 3,
      short: `首尾仅 ${totalRatio.toFixed(2)}×`,
      headline: `四阶首尾比例仅差 ${totalRatio.toFixed(2)}×，整条通道平淡没焦点`,
      body: `四块展板里的图形几乎一样大，虽然排得整齐，却没有「从起点到焦点」的势能爬升。读者扫完四屏仍不知道视线最终该停在哪里。`,
      hint: `收小第 1 屏起点并放大第 3–4 屏，把首尾实绘尺度比拉开到 2.2× 以上。`,
    });
  }
  if (morphZigzag) {
    defects.push({
      id: "morphZigzag",
      stage: morphJumpIdx,
      short: "圆方反复打架",
      headline: `四阶形态在圆与方之间来回跳变，打断了视觉接力`,
      body: `形态过渡既可以是全程统一圆形，也可以像原海报左下徽章那样「□ → ▢ → ○」单向蜕变；但圆→方→圆反复横跳会让大脑把每块屏当成互相排斥的异类。`,
      hint: `点按各屏底部的形态按钮，理顺成全圆（○ ○ ○ ○）或单向演变（□ ▢ ○ ○）。`,
    });
  }
  if (colorClash) {
    defects.push({
      id: "colorClash",
      stage: 1,
      short: "色阶冲突乱跳",
      headline: `四阶色相各打各的，色彩没有把内容串成一条流`,
      body: `蓝、玫红、绿、紫在四屏间硬切冲撞，色彩发出的信号与空间路径互相扯皮。原海报用珊瑚红 → 暖橘 → 琥珀金的邻近暖色阶，正是为了让色温替视线推波助澜。`,
      hint: `把下方「色阶走向」切回「顺阶熔流（珊瑚→暖橘→琥珀金）」。`,
    });
  }
  if (colorFlat) {
    defects.push({
      id: "colorFlat",
      stage: 3,
      short: "全灰无色温层级",
      headline: `四阶锁在同一块冷灰里，缺少由轻入暖的层级推力`,
      body: `纯灰度在字体粗细拉差极大时可行，但在此处四屏既无明度递进也无色温升温，终屏很难在一瞬间聚拢视线。`,
      hint: `切回「顺阶熔流」，或用明显拉开的比例梯级建立聚焦。`,
    });
  }
  if (focusWeak && !flatRatio && reverseIdx === -1) {
    defects.push({
      id: "focusWeak",
      stage: 3,
      short: `焦点占比 ${Math.round(focusAreaShare * 100)}%`,
      headline: `第 4 屏焦点视觉面积占比仅 ${Math.round(focusAreaShare * 100)}%，压不住全场`,
      body: `前面铺垫了三阶，但终点主屏不够饱满，视觉收束发虚。焦点屏的面积权重宜稳居首位（经验上 ≥ 42%），才能让整段旅程落袋为安。`,
      hint: `向上拖大第 4 屏焦点节点，或微收前两屏体量。`,
    });
  }

  // 生成单真源诊单文案
  let badge = "";
  let headline = "";
  let body = "";
  let hint = "";
  let fixLabel = "一键理顺全部断层";
  let solveTag = "";

  if (passedCount === 4) {
    const isMorphSolution = morphSpan >= 0.5;
    solveTag = isMorphSolution ? "方圆演化解" : totalRatio >= 3.4 ? "强加速聚焦解" : "原海报顺流解";
    badge = `4/4 · ${solveTag}`;
    headline = isMorphSolution
      ? `过渡成立（${solveTag}）：形态由方入圆、尺度逐阶爬升至 ${totalRatio.toFixed(2)}×`
      : `过渡成立（${solveTag}）：四屏无缝接力，首尾实绘跨度 ${totalRatio.toFixed(2)}×`;
    body = `从起点轻落、中段交叠递进到终屏 ${Math.round(focusAreaShare * 100)}% 视觉聚焦，相邻步幅落在 ${minStep.toFixed(2)}×–${maxStep.toFixed(2)}× 顺滑区间，视线光流无需停顿即可直达焦点巨带。`;
    hint = `按空格键发射视线光球验收全线通流，或试点右侧反向试错，亲眼看断崖/拉平/糊团如何毁掉节奏。`;
    fixLabel = "再放一次视线光球";
  } else {
    const primary = defects[0];
    badge = `${passedCount}/4 · ${primary ? primary.short : "过渡未闭环"}`;
    headline = primary ? primary.headline : "过渡链条尚未闭合";
    body = primary ? primary.body : "请检查四屏比例、连贯度与形态色阶是否保持同一方向递进。";
    hint = primary ? primary.hint : "横拖画布闭合光带，并纵拖各屏建立由小到大的阶梯。";
    fixLabel = defects.length > 1 ? `一键校准全部（剩 ${defects.length} 处）` : "一键校准这一处";
  }

  // 右上三阶原海报色线探针单真源数据（连接 / 递进 / 引导）
  const connScore = passConnection ? 1 : overlapCrowded ? 0.88 : clamp(state.cohesion / 0.72, 0.16, 0.72);
  const progScore = passProgression ? 1 : reverseIdx !== -1 ? 0.24 : flatRatio ? 0.36 : 0.54;
  const flowScore = passedCount === 4 ? 1 : passFocus && passMorphHue ? 0.85 : clamp(passedCount / 4, 0.2, 0.75);

  const probes = {
    connection: {
      ok: passConnection,
      fill: connScore,
      tag: passConnection ? `连贯 ${Math.round(state.cohesion * 100)}%` : overlapCrowded ? "过挤糊团" : `裂口 ${bridgeGapPx}px`,
    },
    progression: {
      ok: passProgression,
      fill: progScore,
      tag: passProgression
        ? `阶比 ${minStep.toFixed(1)}–${maxStep.toFixed(1)}×`
        : reverseIdx !== -1
        ? `第${reverseIdx + 1}→${reverseIdx + 2}倒挂`
        : cliffIdx !== -1
        ? `断崖 ${maxStep.toFixed(1)}×`
        : `拉平 ${totalRatio.toFixed(1)}×`,
    },
    flow: {
      ok: passFocus && passMorphHue && passConnection,
      fill: flowScore,
      tag: passedCount === 4 ? `聚焦 ${Math.round(focusAreaShare * 100)}%` : colorClash ? "色阶冲突" : morphZigzag ? "形态打架" : "焦流中断",
    },
  };

  // 视线粒子撞停点（-1 = 全线贯通）
  let pulseStopStage = -1;
  let pulseStopMsg = "全线顺流 · 直达焦点巨带";
  if (defects.length > 0) {
    // 找最靠左的真实障碍
    const firstByStage = [...defects].sort((a, b) => a.stage - b.stage)[0];
    pulseStopStage = firstByStage.stage;
    pulseStopMsg = `视线卡顿：${firstByStage.short}`;
  }

  return {
    passedCount,
    isSolved: passedCount === 4,
    solveTag,
    badge,
    headline,
    body,
    hint,
    fixLabel,
    defects,
    passConnection,
    passProgression,
    passMorphHue,
    passFocus,
    probes,
    pulseStopStage,
    pulseStopMsg,
    metrics: {
      totalRatioText: `${totalRatio.toFixed(2)}×`,
      stepRangeText: `${minStep.toFixed(2)}–${maxStep.toFixed(2)}×`,
      bridgeText: bridgeGapPx > 0 ? `裂口 ${bridgeGapPx}px` : overlapCrowded ? "过密粘连" : "0px 无缝",
      focusShareText: `${Math.round(focusAreaShare * 100)}%`,
      cohesionPct: `${Math.round(state.cohesion * 100)}%`,
      morphSeq: state.morphs.map((m) => (MORPH_NAMES[m] || MORPH_NAMES[1]).sym).join("→"),
    },
  };
}
