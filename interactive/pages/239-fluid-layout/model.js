// 239 流体布局：纯数据与计算模型（Hero、各实验台、小练习共享同一套单一数据源）

export const MIN_VW = 320;
export const MAX_VW = 1920;
export const DEFAULT_VW = 1520; // 刻意落在「裸流体超宽面条行」未解状态（50% 中栏 760px ≈ 49 字/行），邀请用户拖墙或开护栏

// 原海报默认三栏占比（和为 100）
export const DEFAULT_SPLITS = [25, 50, 25];

// 全页统一的正文可读行宽口径（15px 正文、左右内边距共 24px，WCAG 1.4.8 AAA 级中文建议 ≤ 40 字）
export const CHAR_PX = 15;
export const PAD_PX = 24;
export const PROSE_MAX_EM = 38;
export const PROSE_MAX_PX = PROSE_MAX_EM * CHAR_PX; // 570px
export const WCAG_CJK_MAX = 40;
export const SHELL_MIN_PCT = 36;
export const FIXED_MEDIA_H = 150;

// 常用设备锚点（用于轻微吸附与底部设备连续带）
export const DEVICE_STOPS = [
  { vw: 360, id: "phone", label: "手机", en: "360PX" },
  { vw: 768, id: "tablet", label: "平板", en: "768PX" },
  { vw: 1024, id: "laptop", label: "笔记本", en: "1024PX" },
  { vw: 1280, id: "desktop", label: "桌面", en: "1280PX" },
  { vw: 1520, id: "ultrawide", label: "超宽屏", en: "1520PX" },
];

export const SNAP_RADIUS = 18; // px 吸附半径

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一估算单行汉字数（仅作无 DOM 兜底；开场轨 3 直接采用 DOM 实测值）
export function estimateCjkChars(colPx, padPx = PAD_PX) {
  return Math.max(0, Math.round((colPx - padPx) / CHAR_PX));
}

// 将真实模拟视口宽度（320..1920）映射到 0..1 轨位置
export function vwToRatio(vw) {
  return clamp((vw - MIN_VW) / (MAX_VW - MIN_VW), 0, 1);
}

export function ratioToVw(r) {
  return Math.round(MIN_VW + clamp(r, 0, 1) * (MAX_VW - MIN_VW));
}

// 将模拟视口宽度映射到舞台壳体宽度百分比（36%..100%），标尺刻度与壳体右缘严格共用此函数
export function vwToShellPct(vw) {
  return SHELL_MIN_PCT + vwToRatio(vw) * (100 - SHELL_MIN_PCT);
}

// 靠近设备锚点时轻吸附（仅拖动松手时调用）
export function snapVw(vw) {
  const v = clamp(Math.round(vw), MIN_VW, MAX_VW);
  for (const s of DEVICE_STOPS) {
    if (Math.abs(v - s.vw) <= SNAP_RADIUS) return { vw: s.vw, snapped: s };
  }
  return { vw: v, snapped: null };
}

// 计算轨 1（百分比宽度）、轨 2（连续拉伸）、轨 3（弹性分栏）在当前视口宽度下的真实像素与字数诊断
// measuredChars 若由 DOM 实测传入，所有读数与诊断均直接采信该实测值
export function evaluateHero(state, measuredChars = null) {
  const vw = clamp(Math.round(state.vw), MIN_VW, MAX_VW);
  const [p1, p2, p3] = state.splits;
  const guarded = !!state.guarded;

  // 轨 1：严格按百分比分配（海报「百分比宽度」）
  const pctPx = [
    Math.round((vw * p1) / 100),
    Math.round((vw * p2) / 100),
    vw - Math.round((vw * p1) / 100) - Math.round((vw * p2) / 100),
  ];

  // 轨 2：左右定宽翼（默认 156px）+ 中间连续拉伸（海报「连续拉伸 FLEX」）
  // 带护栏时，窄屏侧翼按 clamp(76px, 18%, 160px) 退让，避免把中栏吃成 0
  const wingRaw = 156;
  const wingPx = guarded
    ? Math.round(clamp(vw * 0.18, 76, 160))
    : Math.min(wingRaw, Math.floor(vw * 0.44));
  const flexCenterPx = Math.max(0, vw - wingPx * 2);
  const flexCenterPct = Math.round((flexCenterPx / vw) * 100);

  // 轨 3：弹性分栏（真像素排版；带护栏时正文容器封顶 570px = 38em）
  let col3Px;
  let col3Mode = "3col"; // "3col" | "2col" | "1col"
  if (!guarded) {
    col3Px = [...pctPx];
  } else if (vw < 560) {
    col3Mode = "1col";
    col3Px = [vw, vw, vw];
  } else if (vw < 860) {
    col3Mode = "2col";
    const side = Math.round(clamp(vw * 0.3, 180, 240));
    col3Px = [side, vw - side, vw];
  } else {
    const left = Math.round(clamp((vw * p1) / 100, 176, 280));
    const right = Math.round(clamp((vw * p3) / 100, 176, 280));
    const mid = Math.max(260, vw - left - right);
    col3Px = [left, mid, right];
  }

  const activeMidPx = guarded ? Math.min(col3Px[1], PROSE_MAX_PX) : col3Px[1];
  const hasMeasured = Number.isFinite(measuredChars) && measuredChars > 0;
  const charsPerLine = hasMeasured
    ? Math.round(measuredChars)
    : Math.max(4, estimateCjkChars(activeMidPx));
  const minSidePx = Math.min(col3Px[0], col3Px[2]);

  // 状态定级（讲「人眼怎么看」，不只是报数）
  let tone = "ok"; // "ok" | "tight" | "wide" | "guarded"
  let badge = "舒适流体区";
  let verdict = "";
  let why = "";

  if (!guarded && minSidePx < 135) {
    tone = "tight";
    badge = "窄屏压扁预警";
    verdict = `纯百分比把侧栏压到 ${minSidePx}px，中栏实测每行仅 ${charsPerLine} 字`;
    why = "窗口一窄，按死比例切出来的侧栏只剩窄条，目录项和正文双双被迫折碎。点上方「裸流体 % · 点此加护栏」看看现代流体怎么解围。";
  } else if (!guarded && charsPerLine > WCAG_CJK_MAX) {
    tone = "wide";
    badge = "超宽面条行预警";
    verdict = `${p2}% 中栏飙到 ${col3Px[1]}px，单行实测 ${charsPerLine} 个汉字（超出 WCAG 1.4.8（AAA 级）建议的 ${WCAG_CJK_MAX} 字）`;
    why = "刚打开就撞上裸流体在大屏上的通病：15px 正文被拉成横贯全栏的长行，读到行尾再回扫下一行极易串行。向左拖酸柠绿右墙到 1024px 附近，或直接点上方「点此加护栏」锁住正文行宽。";
  } else if (guarded && (vw < 560 || vw > 1200)) {
    tone = "guarded";
    badge = vw < 560 ? "护栏生效 · 窄屏退让" : "护栏生效 · 封顶稳行宽";
    verdict =
      vw < 560
        ? `窄屏低于 560px，弹性分栏收成单栏通排，正文实测稳在 ${charsPerLine} 字/行`
        : `窗宽 ${vw}px 下侧栏封顶 ${col3Px[0]}px，正文封顶 ${PROSE_MAX_PX}px（实测 ${charsPerLine} 字/行）`;
    why =
      vw < 560
        ? "既保留连续顺滑的宽度过渡，又用下限护栏挡住窄屏压扁——侧翼不再硬占百分比，文字呼吸立刻回来。"
        : "窗口继续变宽时，多余空间交给外缘留白，正文行宽锁在舒适读段，视觉重心不散架。";
  } else {
    tone = "ok";
    badge = "舒适流体区";
    verdict = `侧栏 ${col3Px[0]}px 放得下导航，中栏 ${activeMidPx}px 实测每行 ${charsPerLine} 个汉字`;
    why = `窗口在 ${vw}px 时，比例伸缩和内容密度恰好咬合：三轨随窗连续滑动、无任何突兀跳变，眼睛扫读每一栏都很省力。`;
  }

  return {
    vw,
    p1,
    p2,
    p3,
    pctPx,
    wingPx,
    flexCenterPx,
    flexCenterPct,
    col3Px,
    col3Mode,
    activeMidPx,
    charsPerLine,
    minSidePx,
    tone,
    badge,
    verdict,
    why,
  };
}

// 01 节：Ethan Marcotte (2009) Target ÷ Context = Result 公式模型
export function calcFluidGrid(contextPx, sidePx, gutterPx) {
  const safeCtx = clamp(contextPx, 600, 1600);
  const safeSide = clamp(sidePx, 100, Math.floor(safeCtx * 0.36));
  const safeGutter = clamp(gutterPx, 0, 48);
  const centerPx = Math.max(120, safeCtx - safeSide * 2 - safeGutter * 2);
  const sidePct = (safeSide / safeCtx) * 100;
  const centerPct = (centerPx / safeCtx) * 100;
  const gutterPct = (safeGutter / safeCtx) * 100;
  return {
    contextPx: safeCtx,
    sidePx: safeSide,
    centerPx,
    gutterPx: safeGutter,
    sidePct: +sidePct.toFixed(2),
    centerPct: +centerPct.toFixed(2),
    gutterPct: +gutterPct.toFixed(2),
  };
}

// 02 节：四种宽度策略在同一视口宽下的表现对比
export function evaluateFourStrategies(vw) {
  const w = clamp(Math.round(vw), 320, 1440);

  // 1. 固定宽度（960px）
  const fixedW = 960;
  const fixedOverflow = Math.max(0, fixedW - w);
  const fixedSlack = Math.max(0, w - fixedW);
  const fixedNote =
    fixedOverflow > 0
      ? `超出视口 ${fixedOverflow}px，出现横向滚动条，必须左右拖着看。`
      : fixedSlack > 240
        ? `两侧空出 ${Math.round(fixedSlack / 2)}px 空白走廊，宽屏空间白白闲置。`
        : "刚好贴近设计稿 960px，看起来最顺眼——但只在这个窄窗口里成立。";

  // 2. 纯流体（25% / 50% / 25%）
  const fluidSide = Math.round(w * 0.25);
  const fluidMid = w - fluidSide * 2;
  const fluidNote =
    fluidSide < 130
      ? `零滚动条，但 25% 侧栏只剩 ${fluidSide}px，内容开始被挤成细条。`
      : fluidMid > 640
        ? `零留白浪费，但 50% 中栏拉到 ${fluidMid}px，文字行变长、眼睛易串行。`
        : `每一像素都顺滑贴合（${fluidSide} / ${fluidMid} / ${fluidSide}px），没有跳变感。`;

  // 3. 自适应（离散 4 档：320 / 720 / 960 / 1200）
  const adaptiveTier = w >= 1240 ? 1200 : w >= 1000 ? 960 : w >= 740 ? 720 : 320;
  const adaptiveGap = Math.max(0, w - adaptiveTier);
  const adaptiveNote =
    adaptiveGap > 140
      ? `停在 ${adaptiveTier}px 固定档，还没跨到下一档，外围空着 ${adaptiveGap}px 死边。`
      : `吸附到 ${adaptiveTier}px 预设档，每档都是定稿精修，跨档时整页会咔嗒一跳。`;

  // 4. 响应式（流体 + 断点重排：3 栏 / 2 栏 / 1 栏）
  const respCols = w >= 900 ? 3 : w >= 580 ? 2 : 1;
  const respNote =
    respCols === 3
      ? "大屏三栏按比例流体舒展，并由 max-width 守住舒服的阅读行宽。"
      : respCols === 2
        ? "跨过 900px 断点收成两栏流体，保留目录与正文、藏起次要副栏。"
        : "跨过 580px 断点退回单栏满宽流体，每一寸屏幕都给主阅读区。";

  return {
    vw: w,
    fixed: { width: fixedW, overflow: fixedOverflow, slack: fixedSlack, note: fixedNote },
    fluid: { side: fluidSide, mid: fluidMid, note: fluidNote },
    adaptive: { tier: adaptiveTier, gap: adaptiveGap, note: adaptiveNote },
    responsive: { cols: respCols, note: respNote },
  };
}

// 04 节：clamp(min, val, max)「平—斜—平」曲线图模型
export const CLAMP_MIN_VW = 320;
export const CLAMP_MAX_VW = 1920;

export const CLAMP_PRESETS = {
  prose: {
    key: "prose",
    label: "正文主栏",
    slopePct: 50,
    defaultMin: 300,
    defaultMax: 570,
    yMax: 840,
    minRange: [180, 520],
    maxRange: [320, 780],
    yTicks: [0, 200, 400, 600, 800],
  },
  card: {
    key: "card",
    label: "详情卡片",
    slopePct: 35,
    defaultMin: 240,
    defaultMax: 490,
    yMax: 700,
    minRange: [140, 420],
    maxRange: [260, 630],
    yTicks: [0, 150, 300, 450, 600],
  },
  sidebar: {
    key: "sidebar",
    label: "侧栏导航",
    slopePct: 20,
    defaultMin: 160,
    defaultMax: 280,
    yMax: 420,
    minRange: [80, 260],
    maxRange: [160, 360],
    yTicks: [0, 100, 200, 300, 400],
  },
};

export function evaluateClampCurve({ presetKey = "prose", minPx, maxPx, probeVw = null }) {
  const preset = CLAMP_PRESETS[presetKey] || CLAMP_PRESETS.prose;
  const slope = preset.slopePct / 100;
  let lo = clamp(Math.round(minPx / 5) * 5, preset.minRange[0], preset.minRange[1]);
  let hi = clamp(Math.round(maxPx / 5) * 5, preset.maxRange[0], preset.maxRange[1]);
  if (lo > hi - 20) lo = Math.max(preset.minRange[0], hi - 20);
  if (hi < lo + 20) hi = Math.min(preset.maxRange[1], lo + 20);

  // 两个拐点对应的视口宽度：min / slope 与 max / slope
  const x1 = Math.round(lo / slope);
  const x2 = Math.round(hi / slope);
  const fluidSpan = Math.max(0, x2 - x1);
  const css = `width: clamp(${lo}px, ${preset.slopePct}vw, ${hi}px);`;

  const evalWidth = (vw) => Math.round(clamp(vw * slope, lo, hi));
  const rawWidth = (vw) => Math.round(vw * slope);

  // 诊断说明：讲清栏宽在何处停止跟随窗口、对读者有什么影响
  const proseCharsAtMax = estimateCjkChars(hi);
  let status = "三段平衡护栏";
  let warn = false;
  let detail = "";

  if (fluidSpan < 140) {
    status = "斜坡过短 · 接近定宽";
    warn = true;
    detail = `下限拐点（${x1}px）与上限拐点（${x2}px）只隔了 ${fluidSpan}px，中间斜坡几乎被夹没——大部分屏幕都落在平段里，退化成了近似固定宽度。`;
  } else if (preset.key === "prose" && proseCharsAtMax > WCAG_CJK_MAX) {
    status = "上限偏宽 · 超出建议行宽";
    warn = true;
    detail = `上限拖到 ${hi}px（约 ${proseCharsAtMax} 字/行，超出 WCAG 1.4.8 AAA 级建议的 ${WCAG_CJK_MAX} 字），要拉到 ${x2}px 窗宽才会封顶，大屏长行仍易串行。`;
  } else if (preset.key === "sidebar" && lo < 130) {
    status = "下限偏窄 · 侧栏易挤碎";
    warn = true;
    detail = `下限降到 ${lo}px 后，窗宽跌到 ${x1}px 以下才会接住栏宽，常规中文菜单项在 ${lo}px 里容易频繁换行。`;
  } else {
    status = "三段护栏生效";
    const extra =
      preset.key === "prose"
        ? `（约 ${proseCharsAtMax} 字/行，稳在 WCAG 1.4.8 AAA 级 40 字建议以内）`
        : "";
    detail = `窗宽低于 ${x1}px 时左平段钉死 ${lo}px 停止缩小；${x1}–${x2}px 之间沿 ${preset.slopePct}vw 斜坡平滑跟随；超过 ${x2}px 时右平段封顶 ${hi}px 停止拉长${extra}。`;
  }

  let probe = null;
  if (Number.isFinite(probeVw)) {
    const pvw = clamp(Math.round(probeVw), CLAMP_MIN_VW, CLAMP_MAX_VW);
    const val = evalWidth(pvw);
    const raw = rawWidth(pvw);
    const zone = pvw < x1 ? "下限锁平段" : pvw > x2 ? "上限封顶段" : "流体斜坡段";
    probe = { vw: pvw, val, raw, zone };
  }

  return {
    preset,
    minPx: lo,
    maxPx: hi,
    slopePct: preset.slopePct,
    slope,
    x1,
    x2,
    fluidSpan,
    css,
    status,
    warn,
    detail,
    probe,
    evalWidth,
    rawWidth,
  };
}

// 07 节：单变量 CSS 规则小练习（四套均为真实三栏流体写法，用同一套公式算出三把尺子）
function measureQuizRule(key, vw) {
  let l, m, r, proseCap;
  if (key === "A") {
    l = Math.round(vw * 0.22);
    r = Math.round(vw * 0.22);
    m = vw - l - r;
    proseCap = null;
  } else if (key === "B") {
    l = 220;
    r = 220;
    m = Math.max(0, vw - l - r);
    proseCap = PROSE_MAX_PX;
  } else if (key === "C") {
    l = Math.round(clamp(vw * 0.2, 160, 220));
    r = Math.round(clamp(vw * 0.18, 150, 200));
    m = Math.max(0, vw - l - r);
    proseCap = PROSE_MAX_PX;
  } else {
    l = Math.round(clamp(vw * 0.2, 160, 220));
    r = Math.round(clamp(vw * 0.18, 150, 200));
    m = Math.max(0, vw - l - r);
    proseCap = null;
  }
  const activeMid = proseCap ? Math.min(m, proseCap) : m;
  const chars = estimateCjkChars(activeMid);
  const tag =
    m < 260
      ? "中栏偏窄"
      : chars > WCAG_CJK_MAX
        ? `超 ${WCAG_CJK_MAX} 字建议`
        : proseCap && m > proseCap
          ? `封顶 ${proseCap}px`
          : "舒适";
  return `${l} / ${m} / ${r}px（约 ${chars} 字/行 · ${tag}）`;
}

export function evaluateQuizOption(key) {
  const s680 = measureQuizRule(key, 680);
  const s1024 = measureQuizRule(key, 1024);
  const s1520 = measureQuizRule(key, 1520);
  const meta = {
    A: {
      correct: false,
      title: "A · 纯比例 22% / 56% / 22%：1520px 宽屏全线拉宽",
      body: "在 680px 和 1024px 下这套比例看起来都很体面，但只要拉到 1520px 超宽屏，中栏飙到 852px（约 55 字/行，远超 WCAG 1.4.8（AAA 级）建议的 40 字），连左右目录也被撑到 334px 虚胖。",
    },
    B: {
      correct: false,
      title: "B · 固定两翼 220px + 正文封顶：1520px 很稳，680px 分屏翻车",
      body: "它记住了给正文封顶，大屏体验很舒服；但在 680px 窄桌面分屏里，两翼硬吃掉 440px，只留给中间正文 240px（每行仅约 14 字），主阅读区反被辅助栏挤窒息。",
    },
    C: {
      correct: true,
      title: "C · 正确：clamp() 弹性两翼 + 1fr 主栏 + 38em 正文封顶",
      body: "这是唯一同时守住两端底线的规则：680px 分屏时两翼柔顺退到 160 / 150px，中栏保有 370px（约 23 字/行）；1520px 超宽屏时两翼封在 220 / 200px，正文再由 38em（约 570px）稳锁在 36 字/行。",
    },
    D: {
      correct: false,
      title: "D · clamp() 弹性两翼，但忘了给正文封顶",
      body: "它和 C 仅差一句 max-width: 38em。680px 和 1024px 几乎挑不出毛病，可一旦窗口拉到 1520px，两翼虽然封住了，省下来的全部像素却一股脑灌进 1fr 中栏，正文拉到 1100px（约 71 字/行）成了超长面条行。",
    },
  };
  return { ...meta[key], widths: { s680, s1024, s1520 } };
}
