// 181 非对称字体排版 · 单真源排印几何与光学平衡模型
// 所有画面元素坐标、包围盒、对齐轴、视觉力矩、活跃留白、8 类双向错态和视线动势路径
// 均由本模块从同一份 state 与实时画布长宽比算出，Canvas、诊单、三探针和读数共读同一输出。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·字重对话",
    titleLines: ["非对称", "字体排版"],
    subtitle: "ASYMMETRIC TYPOGRAPHY",
    bodyLines: ["通过打破对称平衡，建立清晰层级与动势，", "引导视线，传达重点与情感。"],
    bodyEn: "BREAK SYMMETRY TO ESTABLISH HIERARCHY AND MOTION.",
    quoteLines: ["让文字的重量与留白的轻盈", "形成对话，创造节奏与张力。"],
    giantChar: "丢",
    badges: [
      { shape: "circle", color: "cobalt", zh: "不对称", en: "ASYMMETRY" },
      { shape: "square", color: "vermilion", zh: "层级", en: "HIERARCHY" },
      { shape: "triangle", color: "cobalt", zh: "视觉动势", en: "MOTION" },
    ],
  },
  bauhaus: {
    id: "bauhaus",
    label: "包豪斯·1923展贴",
    titleLines: ["新排印", "动态秩序"],
    subtitle: "DIE NEUE TYPOGRAPHIE · 1923",
    bodyLines: ["魏玛包豪斯秋季排印回顾展 · 10.14–11.28", "告别居中装饰，让层级与留白直接说话。"],
    bodyEn: "CLARITY OF COMMUNICATION OVER A PRIORI SYMMETRY.",
    quoteLines: ["字体排版是强烈的沟通工具，", "而非迎合对称的陈旧画框。"],
    giantChar: "破",
    badges: [
      { shape: "circle", color: "cobalt", zh: "偏轴", en: "OFF-AXIS" },
      { shape: "square", color: "vermilion", zh: "对比", en: "CONTRAST" },
      { shape: "triangle", color: "cobalt", zh: "节奏", en: "RHYTHM" },
    ],
  },
  book: {
    id: "book",
    label: "瑞士·建筑书封",
    titleLines: ["留白与", "网格秩序"],
    subtitle: "SPACE · MASS · SWISS GRID",
    bodyLines: ["当代平面与建筑排印论集 · 巴塞尔版", "以偏心隐性挂轴统领文字重量与静势空间。"],
    bodyEn: "BLACK TYPE AND WHITE SPACE IN RECIPROCAL TENSION.",
    quoteLines: ["唯有留出整块呼吸的空白，", "文字的重量才真正显形。"],
    giantChar: "构",
    badges: [
      { shape: "circle", color: "cobalt", zh: "挂轴", en: "HANGLINE" },
      { shape: "square", color: "vermilion", zh: "留白", en: "VOID" },
      { shape: "triangle", color: "cobalt", zh: "平衡", en: "EQUILIBRIUM" },
    ],
  },
};

// 开场错态（绝不是答案）：居中对称死锁 + 层级压平 + 导语躺平 + 配重萎缩居中（零重叠，一眼看出静态对称僵局）
export const INITIAL_STATE = {
  scene: "poster",
  axisShift: 0,       // -1..+1：0=中轴对称；>0=字组偏左、配重呼应右翼；<0=字组偏右、配重呼应左翼
  titleOffset: 0,     // -0.35..+0.35：主标相对挂轴的额外偏移（可故意拆散隐性轴！）
  hierarchy: 1.22,    // 1.1..3.2：主标/正文视觉级差
  tiltDeg: 0,         // -30..+22：斜置导语角度（原海报约 -22°）
  weightScale: 0.28,  // 0.12..1.45：对角配重（钴蓝巨圆+破框巨字）尺度
  blueX: 0.50,        // 0.06..0.98：蓝圆中心 u（居中时安分停在中轴顶缘，不与标题重叠）
  blueY: 0.09,
  giantX: 0.50,       // 0.06..0.96：破框巨字中心 u（居中时缩在中轴底沿）
  giantY: 0.875,
  quoteX: 0.50,       // 0.16..0.84：斜势导语中心 u
  quoteY: 0.60,
  showGrid: false,
  showMass: false,
  manualPositions: false, // 用户直接拖动过蓝圆/巨字/导语后为 true，不再被 axisShift 自动吸附回默认位
};

// 多组合法解（不只原海报一种答案）
export const SOLUTIONS = {
  posterClassic: {
    id: "posterClassic",
    label: "原海报典范",
    desc: "左挂粗黑主标 + 右上破框蓝圆 + 右中 -22° 斜导语 + 右下破框巨字对角平衡。",
    patch: {
      axisShift: 0.78,
      titleOffset: 0,
      hierarchy: 2.75,
      tiltDeg: -22,
      weightScale: 1.0,
      blueX: 0.90,
      blueY: 0.29,
      giantX: 0.84,
      giantY: 0.86,
      quoteX: 0.70,
      quoteY: 0.60,
      manualPositions: false,
    },
  },
  swissQuiet: {
    id: "swissQuiet",
    label: "瑞士静势",
    desc: "不斜排文字（0°），靠严格偏右隐性垂轴、高字号级差与左侧整块蜜桃留白加左下蓝圆轻锚达成安静平衡。",
    patch: {
      axisShift: -0.74,
      titleOffset: 0,
      hierarchy: 2.65,
      tiltDeg: 0,
      weightScale: 0.86,
      blueX: 0.12,
      blueY: 0.29,
      giantX: 0.18,
      giantY: 0.86,
      quoteX: 0.28,
      quoteY: 0.58,
      manualPositions: false,
    },
  },
  avantDiagonal: {
    id: "avantDiagonal",
    label: "先锋反角",
    desc: "主标推至右翼挂轴、左下巨字破框压阵、左上钴蓝巨圆呼应，反向对角同样成立。",
    patch: {
      axisShift: -0.80,
      titleOffset: 0,
      hierarchy: 2.95,
      tiltDeg: -17,
      weightScale: 1.05,
      blueX: 0.11,
      blueY: 0.27,
      giantX: 0.17,
      giantY: 0.86,
      quoteX: 0.30,
      quoteY: 0.59,
      manualPositions: false,
    },
  },
};

// 双向试错（刻意制造典型翻车态）
export const FAILURE_PRESETS = {
  symmetryLock: {
    id: "symmetryLock",
    label: "对称死锁",
    patch: { ...INITIAL_STATE },
  },
  oneSideCollapse: {
    id: "oneSideCollapse",
    label: "单边塌方",
    patch: {
      axisShift: 0.86,
      titleOffset: 0,
      hierarchy: 2.85,
      tiltDeg: -16,
      weightScale: 0.16,
      blueX: 0.60,
      blueY: 0.10,
      giantX: 0.44,
      giantY: 0.86,
      quoteX: 0.66,
      quoteY: 0.60,
      manualPositions: true,
    },
  },
  axisScatter: {
    id: "axisScatter",
    label: "乱摆脱轴",
    patch: {
      axisShift: 0.72,
      titleOffset: 0.24,
      hierarchy: 1.45,
      tiltDeg: 16,
      weightScale: 0.72,
      blueX: 0.88,
      blueY: 0.24,
      giantX: 0.78,
      giantY: 0.86,
      quoteX: 0.70,
      quoteY: 0.58,
      manualPositions: true,
    },
  },
  collisionCrash: {
    id: "collisionCrash",
    label: "巨字撞车",
    patch: {
      axisShift: 0.76,
      titleOffset: 0,
      hierarchy: 2.35,
      tiltDeg: -18,
      weightScale: 1.38,
      blueX: 0.42,
      blueY: 0.30,
      giantX: 0.36,
      giantY: 0.56,
      quoteX: 0.48,
      quoteY: 0.52,
      manualPositions: true,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

// 根据 axisShift 推导默认的对角配重坐标（当用户尚未手动拖偏它们时）
export function deriveCounterPositions(axisShift) {
  const s = clamp(axisShift, -1, 1);
  const abs = Math.abs(s);
  const dir = s >= 0 ? 1 : -1; // +1 表示字组在左、配重去右；-1 相反
  const blueX = clamp(0.50 + dir * abs * 0.50, 0.08, 0.92);
  const blueY = lerp(0.09, 0.29, clamp(abs / 0.65, 0, 1));
  const giantX = clamp(0.50 + dir * abs * 0.44, 0.14, 0.86);
  const giantY = lerp(0.875, 0.86, abs);
  const quoteX = clamp(0.50 + dir * abs * 0.26, 0.26, 0.74);
  const quoteY = lerp(0.60, 0.60, abs);
  return { blueX, blueY, giantX, giantY, quoteX, quoteY };
}

// 计算矩形交集面积占较小矩形面积的比例
function overlapRatio(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  const inter = (x1 - x0) * (y1 - y0);
  const minArea = Math.max(0.0001, Math.min(a.w * a.h, b.w * b.h));
  return inter / minArea;
}

// 把矩形裁剪到画框 [0,1]×[0,1] 后求可见面积
function clippedArea(r) {
  const x0 = clamp(r.x, 0, 1);
  const y0 = clamp(r.y, 0, 1);
  const x1 = clamp(r.x + r.w, 0, 1);
  const y1 = clamp(r.y + r.h, 0, 1);
  return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
}

// 统一计算所有实绘要素的几何与光学评价（单真源！）
export function evaluateLayout(state, aspect = 1.05) {
  const s = clamp(state.axisShift, -1, 1);
  const absS = Math.abs(s);
  const isCentered = absS < 0.14;
  const side = s >= 0 ? "left" : "right"; // 文字主群靠哪侧
  const align = isCentered ? "center" : side;

  // 隐性挂轴位置（文字基轴 u）
  // 居中时挂轴在 0.50；偏左时挂轴落在 0.08；偏右时挂轴落在 0.92
  const hangX = isCentered
    ? 0.50
    : side === "left"
      ? lerp(0.28, 0.075, clamp((absS - 0.14) / 0.86, 0, 1))
      : lerp(0.72, 0.925, clamp((absS - 0.14) / 0.86, 0, 1));

  // 主标题受 hierarchy 与 titleOffset 影响
  const hRatio = clamp(state.hierarchy, 1.1, 3.3);
  const titleFontNorm = lerp(0.048, 0.118, (hRatio - 1.1) / 2.2); // 相对画布高度
  const bodyFontNorm = titleFontNorm / hRatio;

  const titleW = clamp(titleFontNorm * 4.25 / Math.max(0.78, aspect), 0.24, 0.62);
  const titleH = clamp(titleFontNorm * 2.55, 0.13, 0.32);
  const titleY = isCentered ? 0.175 : 0.125;

  // 计算主标实绘左边缘 x
  let titleAnchorX = clamp(hangX + state.titleOffset, 0.04, 0.96);
  let titleX;
  if (align === "center") {
    titleX = clamp(titleAnchorX - titleW / 2, 0.04, 0.96 - titleW);
  } else if (align === "left") {
    titleX = clamp(titleAnchorX, 0.04, 0.96 - titleW);
  } else {
    titleX = clamp(titleAnchorX - titleW, 0.04, 0.96 - titleW);
  }

  // 正文说明块（挂在 hangX 上，不随 titleOffset 漂移，所以故意拉动 titleOffset 会显现隐性轴断裂！）
  const bodyW = clamp(0.42 / Math.max(0.82, Math.min(1.18, aspect)), 0.30, 0.48);
  const bodyH = clamp(bodyFontNorm * 3.8, 0.10, 0.145);
  const bodyY = titleY + titleH + (isCentered ? 0.045 : 0.075);
  let bodyX;
  if (align === "center") bodyX = 0.50 - bodyW / 2;
  else if (align === "left") bodyX = hangX;
  else bodyX = hangX - bodyW;
  bodyX = clamp(bodyX, 0.04, 0.96 - bodyW);

  // 三枚几何关键词徽章（居中对称时横向并排一字排开不挡巨字；偏轴时恢复原海报纵向三行！）
  const badgesHorizontal = isCentered;
  const badgesW = badgesHorizontal ? 0.68 : 0.25;
  const badgesH = badgesHorizontal ? 0.072 : 0.22;
  const badgesY = badgesHorizontal ? 0.705 : 0.70;
  let badgesX;
  if (align === "center") badgesX = 0.50 - badgesW / 2;
  else if (align === "left") badgesX = hangX;
  else badgesX = hangX - badgesW;
  badgesX = clamp(badgesX, 0.04, 0.96 - badgesW);

  // 配重与导语坐标
  const autoPos = deriveCounterPositions(s);
  const blueCx = state.manualPositions ? clamp(state.blueX, 0.05, 0.95) : autoPos.blueX;
  const blueCy = state.manualPositions ? clamp(state.blueY, 0.12, 0.85) : autoPos.blueY;
  const giantCx = state.manualPositions ? clamp(state.giantX, 0.08, 0.92) : autoPos.giantX;
  const giantCy = state.manualPositions ? clamp(state.giantY, 0.22, 0.94) : autoPos.giantY;
  const quoteCx = state.manualPositions ? clamp(state.quoteX, 0.18, 0.82) : autoPos.quoteX;
  const quoteCy = state.manualPositions ? clamp(state.quoteY, 0.38, 0.82) : autoPos.quoteY;

  const wScale = clamp(state.weightScale, 0.12, 1.45);
  // 钴蓝巨圆：在画布上必须画成正圆，半径以画布短边归一化，记录归一化宽/高半轴
  const blueR = lerp(0.055, 0.235, clamp((wScale - 0.12) / 1.33, 0, 1));
  const blueRx = blueR / Math.max(0.75, aspect);
  const blueRy = blueR;

  // 破框巨字
  const giantSize = lerp(0.09, 0.37, clamp((wScale - 0.12) / 1.33, 0, 1));
  const giantW = giantSize * 0.94 / Math.max(0.75, aspect);
  const giantH = giantSize * 0.96;

  // 斜置导语块
  const quoteW = clamp(0.32 / Math.max(0.82, Math.min(1.15, aspect)), 0.25, 0.38);
  const quoteH = 0.105;
  const tiltRad = (state.tiltDeg * Math.PI) / 180;
  // 旋转后的外接框略大
  const qRotW = Math.abs(quoteW * Math.cos(tiltRad)) + Math.abs(quoteH * Math.sin(tiltRad));
  const qRotH = Math.abs(quoteW * Math.sin(tiltRad)) + Math.abs(quoteH * Math.cos(tiltRad));

  // 各元素实绘矩形
  const titleRect = { x: titleX, y: titleY, w: titleW, h: titleH };
  const bodyRect = { x: bodyX, y: bodyY, w: bodyW, h: bodyH };
  const badgesRect = { x: badgesX, y: badgesY, w: badgesW, h: badgesH };
  const quoteRect = { x: quoteCx - qRotW / 2, y: quoteCy - qRotH / 2, w: qRotW, h: qRotH };
  const blueRect = { x: blueCx - blueRx, y: blueCy - blueRy, w: blueRx * 2, h: blueRy * 2 };
  const giantRect = { x: giantCx - giantW / 2, y: giantCy - giantH / 2, w: giantW, h: giantH };

  // 视觉重量模型（示意：可见面积 × 墨量/饱和度系数）
  const titleVis = clippedArea(titleRect);
  const bodyVis = clippedArea(bodyRect);
  const badgesVis = clippedArea(badgesRect);
  const quoteVis = clippedArea(quoteRect);
  const blueVis = clippedArea(blueRect) * 0.785; // 圆占外接框 π/4
  const giantVis = clippedArea(giantRect);

  const masses = [
    { id: "title", label: "主标题", cx: titleRect.x + titleRect.w / 2, cy: titleRect.y + titleRect.h / 2, weight: titleVis * (1.55 + hRatio * 0.35) },
    { id: "body", label: "正文说明", cx: bodyRect.x + bodyRect.w / 2, cy: bodyRect.y + bodyRect.h / 2, weight: bodyVis * 0.72 },
    { id: "badges", label: "三徽标", cx: badgesRect.x + badgesRect.w / 2, cy: badgesRect.y + badgesRect.h / 2, weight: badgesVis * 0.68 },
    { id: "quote", label: "斜势导语", cx: quoteCx, cy: quoteCy, weight: quoteVis * 0.86 },
    { id: "blue", label: "电光钴蓝圆", cx: clamp(blueCx, 0.02, 0.98), cy: clamp(blueCy, 0.02, 0.98), weight: blueVis * 1.48 },
    { id: "giant", label: "破框巨字", cx: clamp(giantCx, 0.02, 0.98), cy: clamp(giantCy, 0.02, 0.98), weight: giantVis * 1.68 },
  ];

  const totalMass = masses.reduce((acc, m) => acc + m.weight, 0) || 1;
  const cogX = masses.reduce((acc, m) => acc + m.cx * m.weight, 0) / totalMass;
  const cogY = masses.reduce((acc, m) => acc + m.cy * m.weight, 0) / totalMass;

  // 左右半场视觉重量比
  let leftMass = 0;
  let rightMass = 0;
  for (const m of masses) {
    if (m.cx < 0.48) leftMass += m.weight;
    else if (m.cx > 0.52) rightMass += m.weight;
    else { leftMass += m.weight * 0.5; rightMass += m.weight * 0.5; }
  }
  const balanceBias = cogX - 0.50; // <0 偏左，>0 偏右

  // 隐性对齐轴一致性（主标与正文挂靠边缘之差）
  const titleEdge = align === "right" ? titleRect.x + titleRect.w : align === "left" ? titleRect.x : titleRect.x + titleRect.w / 2;
  const bodyEdge = align === "right" ? bodyRect.x + bodyRect.w : align === "left" ? bodyRect.x : bodyRect.x + bodyRect.w / 2;
  const axisDiff = Math.abs(titleEdge - bodyEdge);

  // 碰撞检测（字组与几何块/巨字之间，允许蓝圆轻微擦近主标右上或点阵叠蓝圆，但不允许压盖正文/主标/导语）
  const collisions = [];
  const checkPair = (idA, nameA, rectA, idB, nameB, rectB, limit) => {
    const r = overlapRatio(rectA, rectB);
    if (r > limit) collisions.push({ a: idA, b: idB, label: `${nameA}与${nameB}重叠`, ratio: r });
  };
  checkPair("title", "主标题", titleRect, "blue", "蓝圆", blueRect, 0.14);
  checkPair("title", "主标题", titleRect, "giant", "破框巨字", giantRect, 0.08);
  checkPair("body", "正文", bodyRect, "blue", "蓝圆", blueRect, 0.08);
  checkPair("body", "正文", bodyRect, "giant", "破框巨字", giantRect, 0.06);
  checkPair("body", "正文", bodyRect, "quote", "斜势导语", quoteRect, 0.08);
  checkPair("badges", "三徽标", badgesRect, "giant", "破框巨字", giantRect, 0.08);
  checkPair("badges", "三徽标", badgesRect, "quote", "斜势导语", quoteRect, 0.08);
  checkPair("quote", "斜势导语", quoteRect, "blue", "蓝圆", blueRect, 0.12);
  checkPair("quote", "斜势导语", quoteRect, "giant", "破框巨字", giantRect, 0.10);

  // 活跃负空间（用 16×16 采样格做真实覆盖率统计，避免简单面积叠加重复扣减！）
  let covered = 0;
  const G = 16;
  const inRect = (u, v, r) => u >= r.x && u <= r.x + r.w && v >= r.y && v <= r.y + r.h;
  const inEllipse = (u, v, cx, cy, rx, ry) => {
    const dx = (u - cx) / Math.max(0.001, rx);
    const dy = (v - cy) / Math.max(0.001, ry);
    return dx * dx + dy * dy <= 1;
  };
  for (let iy = 0; iy < G; iy++) {
    const v = (iy + 0.5) / G;
    for (let ix = 0; ix < G; ix++) {
      const u = (ix + 0.5) / G;
      const hit =
        inRect(u, v, titleRect) ||
        inRect(u, v, bodyRect) ||
        inRect(u, v, badgesRect) ||
        inRect(u, v, quoteRect) ||
        inRect(u, v, giantRect) ||
        inEllipse(u, v, blueCx, blueCy, blueRx, blueRy);
      if (hit) covered++;
    }
  }
  const coveragePct = Math.round((covered / (G * G)) * 100);
  const whitespacePct = 100 - coveragePct;

  // 喧宾夺主检测：破框巨字或蓝圆个体重量显著压过主标
  const titleWeight = masses[0].weight;
  const giantWeight = masses[5].weight;
  const blueWeight = masses[4].weight;
  const anchorOvershadow = giantWeight > titleWeight * 1.62 || blueWeight > titleWeight * 1.55;

  // 对角配重是否真落在主标对侧
  const titleSideSign = (titleRect.x + titleRect.w / 2) < 0.50 ? -1 : 1;
  const blueOnOpposite = (blueCx - 0.50) * titleSideSign < -0.08;
  const giantOnOpposite = (giantCx - 0.50) * titleSideSign < -0.06;
  const hasCounterAnchor = (blueOnOpposite || giantOnOpposite) && wScale >= 0.58;

  // 动势方向判定：
  // 1) 斜置动势：-28°..-9° 顺势斜升，或者顺应对角方向
  // 2) 瑞士静势：|tiltDeg| <= 4 且 隐性挂轴清晰 + 级差 ≥ 2.25 + 对角有配重
  const tiltOk = state.tiltDeg <= -8 && state.tiltDeg >= -28;
  const reverseTilt = state.tiltDeg > 8;
  const swissQuietOk = Math.abs(state.tiltDeg) <= 4 && absS >= 0.52 && hRatio >= 2.25 && axisDiff <= 0.055 && hasCounterAnchor;

  // 4 项硬指标
  const symmetryLock = absS < 0.34;
  const axisScatter = !symmetryLock && axisDiff > 0.075;
  const flatHierarchy = hRatio < 2.0;
  const oneSideCollapse = !symmetryLock && (Math.abs(balanceBias) > 0.145 || !hasCounterAnchor);
  const chokedSpace = whitespacePct < 33;
  const hasCollision = collisions.length > 0;
  const motionBroken = reverseTilt || (!tiltOk && !swissQuietOk);

  const checkAsymmetry = !symmetryLock && !axisScatter;
  const checkHierarchy = !flatHierarchy && !anchorOvershadow && !hasCollision;
  const checkBalance = !oneSideCollapse && !chokedSpace && !hasCollision && !symmetryLock;
  const checkMotion = !motionBroken && !symmetryLock && !hasCollision;

  const passedCount = [checkAsymmetry, checkHierarchy, checkBalance, checkMotion].filter(Boolean).length;

  // 8 类双向错态诊单（按最紧迫的视觉事故排序）
  let faultId = "ok";
  let badgeText = `${passedCount}/4 · 非对称成立`;
  let headline = "重量与留白互相拉住，视线沿对角自然推进";
  let reason = "";
  let actionHint = "按 Space 播放视线扫视动势箭流，或切换「瑞士静势」「先锋反角」体验另一种合法解法。";
  let tensionTier = "动态平衡（示意）";

  if (hasCollision) {
    faultId = "collision";
    badgeText = `${passedCount}/4 · 元素撞车`;
    headline = `${collisions[0].label}，信息互相吞噬`;
    reason = "非对称不是把大字和色块胡乱叠在一起。文字块一旦被蓝圆或破框巨字压盖，字形轮廓与留白通道会立刻失效，人眼被迫停下来辨认哪一层才是要读的字。";
    actionHint = "把撞在一起的蓝圆或破框巨字往对角空白处拖开，或调小「对角配重体量」给文字腾出呼吸边。";
    tensionTier = "重叠失序（示意）";
  } else if (symmetryLock) {
    faultId = "symmetryLock";
    badgeText = `${passedCount}/4 · 对称死锁`;
    headline = "文字全钉在正中轴上，画面静止没有动势";
    reason = `当前偏轴度只有 ${Math.round(absS * 100)}%，主标、正文与配重仍贴在中线附近，本质上停留在居中对称的静态格局——人眼进画面后原地停住，缺少从左到右、从重到轻的推进路径。`;
    actionHint = "直接在画布上向右横拖（或拖动「非对称偏轴」滑轨），先把字组拉离 50% 中轴并打开整块留白。";
    tensionTier = "静态居中（示意）";
  } else if (axisScatter) {
    faultId = "axisScatter";
    badgeText = `${passedCount}/4 · 隐性轴散裂`;
    headline = `主标与正文挂轴脱节（错开 ${Math.round(axisDiff * 100)}%），显得随手乱摆`;
    reason = "非对称排版绝不是取消对齐。主标题和正文失去了同一条隐性纵轴后，眼睛每换一块字都要重新找起点，画面立刻从「有张力的非对称」滑向「失控的杂乱」。";
    actionHint = "在画布上左右拖动主标题块，向正文的虚线隐性挂轴靠拢（靠近会自动轻吸对齐）。";
    tensionTier = "散乱失锚（示意）";
  } else if (oneSideCollapse) {
    faultId = "oneSideCollapse";
    badgeText = `${passedCount}/4 · 单边塌方`;
    headline = `重心${balanceBias < 0 ? "向左" : "向右"}倾覆 ${Math.round(Math.abs(balanceBias) * 100)}%，打破对称却忘了配重`;
    reason = !hasCounterAnchor
      ? "字组已经偏离中轴，但对侧没有足够分量的钴蓝巨圆或破框巨字回拉，另一半只剩死空，整张版面像跷跷板一样往有字的一边栽倒。"
      : `实绘重心落在水平 ${Math.round(cogX * 100)}%（理想配平带在 36%–64%），左右视觉力矩失衡，画面一侧沉坠、另一侧虚空。`;
    actionHint = "把钴蓝圆与破框巨字拖到主标的对角翼，并将「对角配重体量」拉到 70%–105%，让重量跨过留白互相拉住。";
    tensionTier = "单边倾覆（示意）";
  } else if (flatHierarchy) {
    faultId = "flatHierarchy";
    badgeText = `${passedCount}/4 · 层级压平`;
    headline = `主标与正文级差仅 ${hRatio.toFixed(2)}×，分不清第一眼看哪`;
    reason = "打破了中轴位置，但大标题和说明文字的体量差不多大，墨量拉不开阶梯。非对称一旦缺少强层级，读者在错落的块之间反而更难判断主次。";
    actionHint = "把「主次字号级差」拉到 2.2× 以上，让主标题真正成为视觉起点。";
    tensionTier = "均权平庸（示意）";
  } else if (anchorOvershadow) {
    faultId = "anchorOvershadow";
    badgeText = `${passedCount}/4 · 喧宾夺主`;
    headline = "配重块比主标题更重，抢走了第一眼焦点";
    reason = "破框巨字和电光蓝圆的职责是「对角平衡与收束视线」，现在它们的视觉重量压过了主标题，观众先被装饰几何吸走，反而忽略了核心信息。";
    actionHint = "把「对角配重体量」回调到 85%–110%，或提高主标题级差，夺回第一眼主导权。";
    tensionTier = "配重过载（示意）";
  } else if (chokedSpace) {
    faultId = "chokedSpace";
    badgeText = `${passedCount}/4 · 留白窒息`;
    headline = `活跃留白跌到 ${whitespacePct}%，文字重块喘不过气`;
    reason = "原海报的核心提醒是「让文字的重量与留白的轻盈形成对话」。现在字块和几何块把纸面填得太满，留白被挤成窄缝，对话感荡然无存。";
    actionHint = "适当收小对角配重体量，或把蓝圆和破框巨字向外推至破框位置，为中段腾出整片蜜桃粉留白。";
    tensionTier = "过满闷塞（示意）";
  } else if (motionBroken) {
    faultId = "motionStall";
    badgeText = `${passedCount}/4 · ${reverseTilt ? "动势逆折" : "动势滞平"}`;
    headline = reverseTilt
      ? `斜势导语反倾 +${Math.round(state.tiltDeg)}°，把视线往画外推`
      : "中段导语躺平在 0°，缺少串连主标与对角锚重的斜势张力";
    reason = reverseTilt
      ? "顺向斜升的导语像斜桥一样把视线从主标渡向对角巨字；现在角度反折向下，视线走到中段被硬生生折断。"
      : "当前偏轴与级差还不足以纯靠瑞士静势撑起动线，导语平躺让上下两段之间少了过渡节奏。";
    actionHint = "点击或拖动斜势导语把倾角拨到 -24° ~ -12°（或进一步拉强主次级差与偏轴，走 0° 瑞士静势解）。";
    tensionTier = reverseTilt ? "动线逆折（示意）" : "节奏偏平（示意）";
  } else {
    // 4/4 全通过，区分解法气质
    const styleName = swissQuietOk && Math.abs(state.tiltDeg) <= 4
      ? "瑞士静势非对称"
      : s < 0
        ? "反角对角非对称"
        : "经典对角非对称";
    badgeText = `4/4 · ${styleName}`;
    headline = swissQuietOk && Math.abs(state.tiltDeg) <= 4
      ? "不倾斜一字，照样靠偏轴挂线与大留白稳住非对称"
      : "主标压阵、留白呼吸、斜势过桥、巨字对角回拉";
    reason = `隐性挂轴偏差仅 ${Math.round(axisDiff * 100)}%，主次级差 ${hRatio.toFixed(2)}×，实绘光学重心稳落水平 ${Math.round(cogX * 100)}%，整块活跃留白占 ${whitespacePct}%。视线天然从主标出发，经正文与导语流向对角锚块。`;
    tensionTier = swissQuietOk && Math.abs(state.tiltDeg) <= 4 ? "瑞士静衡（示意）" : "动态张力（示意）";
  }

  // 视线扫描路径点（由实绘几何中心单真源生成）
  const scanPath = [
    { step: 1, label: "主标题起点", x: titleRect.x + titleRect.w * 0.45, y: titleRect.y + titleRect.h * 0.55 },
    { step: 2, label: "正文展开", x: bodyRect.x + bodyRect.w * 0.48, y: bodyRect.y + bodyRect.h * 0.5 },
    { step: 3, label: "斜势导语渡桥", x: quoteCx, y: quoteCy },
    { step: 4, label: "对角巨字/蓝圆收束", x: clamp(giantCx, 0.14, 0.86), y: clamp(giantCy, 0.20, 0.86) },
    { step: 5, label: "几何蓝圆回望", x: clamp(blueCx, 0.14, 0.86), y: clamp(blueCy, 0.18, 0.82) },
  ];

  return {
    align,
    side,
    hangX,
    badgesHorizontal,
    absShiftPct: Math.round(absS * 100),
    titleFontNorm,
    bodyFontNorm,
    hRatio,
    axisDiffPct: Math.round(axisDiff * 100),
    whitespacePct,
    coveragePct,
    cogX,
    cogY,
    balanceBiasPct: Math.round(balanceBias * 100),
    leftSharePct: Math.round((leftMass / (leftMass + rightMass || 1)) * 100),
    rightSharePct: Math.round((rightMass / (leftMass + rightMass || 1)) * 100),
    rects: { title: titleRect, body: bodyRect, badges: badgesRect, quote: quoteRect, blue: blueRect, giant: giantRect },
    blue: { cx: blueCx, cy: blueCy, rx: blueRx, ry: blueRy, r: blueR },
    giant: { cx: giantCx, cy: giantCy, size: giantSize, w: giantW, h: giantH },
    quote: { cx: quoteCx, cy: quoteCy, w: quoteW, h: quoteH, tiltDeg: state.tiltDeg },
    masses,
    collisions,
    scanPath,
    checks: {
      asymmetry: checkAsymmetry,
      hierarchy: checkHierarchy,
      balance: checkBalance,
      motion: checkMotion,
    },
    passedCount,
    faultId,
    badgeText,
    headline,
    reason,
    actionHint,
    tensionTier,
    probes: {
      asymmetry: checkAsymmetry
        ? `偏轴 ${Math.round(absS * 100)}%`
        : symmetryLock
          ? `中轴锁死 ${Math.round(absS * 100)}%`
          : `脱轴 ${Math.round(axisDiff * 100)}%`,
      hierarchy: checkHierarchy
        ? `级差 ${hRatio.toFixed(1)}×`
        : hasCollision
          ? "元素撞车"
          : anchorOvershadow
            ? "配重抢戏"
            : `压平 ${hRatio.toFixed(1)}×`,
      motion: checkMotion && checkBalance
        ? (Math.abs(state.tiltDeg) <= 4 ? "静势成链" : `斜势 ${Math.round(state.tiltDeg)}°`)
        : oneSideCollapse
          ? `塌方 ${balanceBias < 0 ? "左" : "右"}${Math.round(Math.abs(balanceBias) * 100)}%`
          : chokedSpace
            ? `留白仅 ${whitespacePct}%`
            : reverseTilt
              ? `逆倾 +${Math.round(state.tiltDeg)}°`
              : "动势滞平",
    },
  };
}
