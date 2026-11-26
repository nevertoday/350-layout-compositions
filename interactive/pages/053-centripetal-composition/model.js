// 053 向心式构图 · 单真源几何与诊断引擎（model.js）
// 所有读数、报错、四项探针与画布实绘均来自同一组 8 支楔形、中心静谧环与外围干扰物坐标。

export const PALETTE = {
  paper: "#EDE9E4",
  paperBright: "#F6F3EE",
  sage: "#E6ECEB",
  sand: "#E5DFD6",
  ink: "#102026",
  body: "#1C2A30",
  muted: "#49585F",
  teal: "#138385",
  tealBright: "#038D8E",
  tealDeep: "#095C5E",
  tealDarkBg: "#48D6D4",
  orange: "#E85D26",
  orangeBright: "#FC5E1F",
  orangeDeep: "#B03B0E",
  orangeDarkBg: "#FF8A5C",
  charcoal: "#2F3538",
  charcoalMid: "#5B6469",
  slateDark: "#101E24",
  slatePanel: "#182C34",
  footer: "#0A1418",
  danger: "#B8291E",
  dangerDark: "#FF7B70",
  ok: "#0B6B56",
  okDark: "#47DFB6",
};

export const SCENARIOS = [
  {
    id: "poster",
    label: "原海报 · 向心宣言",
    shortLabel: "原海报",
    title: "向心式构图",
    en: "CENTRIPETAL COMPOSITION",
    sub: "所有视觉元素向中心静谧核聚集",
    tag: "海报设计",
    centerKind: "poster",
  },
  {
    id: "product",
    label: "产品展示 · 镜头光环",
    shortLabel: "产品展示",
    title: "F/1.2 光学定焦",
    en: "OPTICAL CENTERPIECE",
    sub: "光束与暗影沿径向收束至镜组中心",
    tag: "产品展示",
    centerKind: "lens",
  },
  {
    id: "keynote",
    label: "演讲封面 · 核心主张",
    shortLabel: "演讲封面",
    title: "只留一个主角",
    en: "SINGLE FOCAL CLAIM",
    sub: "三秒内锁住全场唯一信息锚点",
    tag: "演讲封面",
    centerKind: "keynote",
  },
];

// 8 支外围方向元素（完全对应 053 原海报的孔雀青粗楔、朱橙箭头、石墨渐变楔与建筑细引线）
// angleDeg: 从画心指向该元素外端锚点的方位角（0°=右, 90°=下, -90°=上, ±180°=左）
export const BASE_WEDGES = [
  { id: 0, name: "左上孔雀青主楔", angleDeg: -124, kind: "wedge", color: "teal", widthRatio: 0.145, skewSign: 1, weight: 1.35 },
  { id: 1, name: "顶中孔雀青箭针", angleDeg: -90,  kind: "needle", color: "teal", widthRatio: 0.036, skewSign: -1, weight: 0.72 },
  { id: 2, name: "右上石墨透视楔", angleDeg: -60,  kind: "wedge", color: "charcoal", widthRatio: 0.118, skewSign: 1, weight: 1.2 },
  { id: 3, name: "右侧朱橙尖楔",   angleDeg: -16,  kind: "arrow", color: "orange", widthRatio: 0.095, skewSign: -1, weight: 1.15 },
  { id: 4, name: "右下孔雀青主楔", angleDeg: 28,   kind: "wedge", color: "teal", widthRatio: 0.142, skewSign: 1, weight: 1.35 },
  { id: 5, name: "下右石墨长楔",   angleDeg: 64,   kind: "wedge", color: "charcoal", widthRatio: 0.102, skewSign: -1, weight: 1.05 },
  { id: 6, name: "左下石墨斜楔",   angleDeg: 118,  kind: "wedge", color: "charcoal", widthRatio: 0.105, skewSign: 1, weight: 1.05 },
  { id: 7, name: "左侧朱橙主箭",   angleDeg: 158,  kind: "arrow", color: "orange", widthRatio: 0.112, skewSign: -1, weight: 1.28 },
];

// 4 枚外围杂散噪点（对应原海报「减少分散元素」——点按即可吸除或恢复）
export const BASE_DISTRACTORS = [
  { id: 0, label: "限时折上折", nx: 0.15, ny: 0.23, color: "orange", shape: "pill", weight: 1.0 },
  { id: 1, label: "扫码领券",   nx: 0.85, ny: 0.22, color: "teal",   shape: "box",  weight: 1.0 },
  { id: 2, label: "角标 04",    nx: 0.16, ny: 0.80, color: "charcoal", shape: "badge", weight: 0.9 },
  { id: 3, label: "装饰印章",   nx: 0.84, ny: 0.79, color: "orange", shape: "ring", weight: 1.0 },
];

export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原开场坏态",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 24,       // 24° 散焦偏斜（全部楔形留在画框内但明显错焦）
    sanctuaryRatio: 0.11, // 11% 箭尖刺核
    directions: [1, 1, -1, -1, -1, 1, 1, 1], // 右半侧 3 支叛逃向外，同时破坏汇聚与四向均衡 → 真正 0/4
    activeWedges: [1, 1, 1, 1, 1, 1, 1, 1],
    distractors: [1, 1, 1, 1], // 4 处外围杂散抢戏
  },
  classic: {
    id: "classic",
    label: "原海报 · 八向全聚",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 0,
    sanctuaryRatio: 0.27,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 1, 1, 1, 1, 1, 1, 1],
    distractors: [0, 0, 0, 0],
  },
  corridor: {
    id: "corridor",
    label: "一点透视 · 微偏核",
    focusX: 0.50,
    focusY: 0.44, // 建筑一点透视微上提焦核（阿恩海姆视觉光学中心）
    aimSkewDeg: 2,
    sanctuaryRatio: 0.25,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 0, 1, 1, 1, 1, 1, 1],
    distractors: [0, 0, 0, 0],
  },
  minimal4: {
    id: "minimal4",
    label: "极简 · 四角精聚",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 0,
    sanctuaryRatio: 0.29,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 0, 1, 0, 1, 0, 1, 0], // 只留 4 支主楔在四角均衡聚拢
    distractors: [0, 0, 0, 0],
  },
  failRebel: {
    id: "failRebel",
    label: "离心叛逃",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 4,
    sanctuaryRatio: 0.27,
    directions: [1, -1, -1, -1, 1, -1, 1, -1],
    activeWedges: [1, 1, 1, 1, 1, 1, 1, 1],
    distractors: [0, 0, 0, 0],
  },
  failStab: {
    id: "failStab",
    label: "箭尖刺核",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 1,
    sanctuaryRatio: 0.09,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 1, 1, 1, 1, 1, 1, 1],
    distractors: [0, 0, 0, 0],
  },
  failHollow: {
    id: "failHollow",
    label: "空心断链",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 1,
    sanctuaryRatio: 0.48,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 1, 1, 1, 1, 1, 1, 1],
    distractors: [0, 0, 0, 0],
  },
  failOneSide: {
    id: "failOneSide",
    label: "单边倾覆",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 2,
    sanctuaryRatio: 0.27,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 1, 0, 0, 0, 0, 1, 1], // 全部堆在左半边
    distractors: [0, 0, 0, 0],
  },
  failNoise: {
    id: "failNoise",
    label: "角落杂噪",
    focusX: 0.50,
    focusY: 0.50,
    aimSkewDeg: 0,
    sanctuaryRatio: 0.27,
    directions: [1, 1, 1, 1, 1, 1, 1, 1],
    activeWedges: [1, 1, 1, 1, 1, 1, 1, 1],
    distractors: [1, 1, 1, 1],
  },
};

export function createInitialState() {
  const b = PRESETS.broken;
  return {
    scenarioId: "poster",
    focusX: b.focusX,
    focusY: b.focusY,
    aimSkewDeg: b.aimSkewDeg,
    sanctuaryRatio: b.sanctuaryRatio,
    directions: [...b.directions],
    activeWedges: [...b.activeWedges],
    distractors: [...b.distractors],
    showGuides: true,
    activePreset: "broken",
  };
}

export function applyPreset(state, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return state;
  state.focusX = p.focusX;
  state.focusY = p.focusY;
  state.aimSkewDeg = p.aimSkewDeg;
  state.sanctuaryRatio = p.sanctuaryRatio;
  state.directions = [...p.directions];
  state.activeWedges = [...p.activeWedges];
  state.distractors = [...p.distractors];
  state.activePreset = presetKey;
  return state;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 从状态和画布尺寸，生成唯一真源几何：8 支楔形的真实像素坐标、方向向量、射线偏距与静谧环参数
export function buildGeometry(state, width, height) {
  const W = Math.max(100, width);
  const H = Math.max(100, height);
  const minDim = Math.min(W, H);
  const cx = state.focusX * W;
  const cy = state.focusY * H;
  // 静谧环半径：以短边为基准，保证任何屏幕比例下都是正圆，绝不压扁
  const sanctuaryR = state.sanctuaryRatio * minDim;
  // 主标文字安全核半径（固定视觉安全半径，约短边的 17.5%）
  const coreContentR = 0.175 * minDim;
  const diag = Math.hypot(W, H) * 0.62;

  const wedges = BASE_WEDGES.map((base, idx) => {
    const active = Boolean(state.activeWedges[idx]);
    const dir = state.directions[idx] >= 0 ? 1 : -1; // 1 = 向内汇聚, -1 = 向外离心叛逃
    const rad = (base.angleDeg * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);

    // 外端锚点精确落在画框真实四条边沿外侧一点（Math.min 取首次撞边距离！）
    const tx = Math.abs(ux) > 1e-4 ? (ux > 0 ? (W - cx) / ux : -cx / ux) : 1e9;
    const ty = Math.abs(uy) > 1e-4 ? (uy > 0 ? (H - cy) / uy : -cy / uy) : 1e9;
    const borderDist = Math.min(tx, ty);
    const outerDist = borderDist + 18;
    const outerX = cx + ux * outerDist;
    const outerY = cy + uy * outerDist;

    // 偏角：围绕边沿外端锚点偏转方向向量，产生真实几何错焦，同时保持楔形全部清晰落于可见画幅内
    const skewRad = ((state.aimSkewDeg * base.skewSign) * Math.PI) / 180;
    const idealInX = -ux;
    const idealInY = -uy;
    const cosS = Math.cos(skewRad);
    const sinS = Math.sin(skewRad);
    const aimX = idealInX * cosS - idealInY * sinS;
    const aimY = idealInX * sinS + idealInY * cosS;

    // 楔形长度 = 外端到静谧环边缘的距离
    const len = Math.max(minDim * 0.16, outerDist - sanctuaryR);
    // 尖端坐标（沿偏转后的实际方向伸出）
    const innerX = outerX + aimX * len;
    const innerY = outerY + aimY * len;

    // 实际视觉方向向量（向内为 +aim，向外叛逃则反指 -aim）
    const flowX = dir > 0 ? aimX : -aimX;
    const flowY = dir > 0 ? aimY : -aimY;

    // 计算延长线到焦核 (cx, cy) 的真实垂直脱靶距（点到直线距离）
    const dxToCenter = cx - outerX;
    const dyToCenter = cy - outerY;
    const missPx = Math.abs(dxToCenter * aimY - dyToCenter * aimX);
    const missRatio = missPx / minDim;

    // 计算尖端是否刺入主标安全核（在净空过紧 <18% 时无论偏角如何都刺近核心）
    const tipDistToCenter = Math.hypot(innerX - cx, innerY - cy);
    const stabsCore = active && dir > 0 && (tipDistToCenter < coreContentR * 1.04 || sanctuaryR < coreContentR * 0.96);

    // 供点击命中的可见中点
    const midX = outerX + aimX * (len * 0.54);
    const midY = outerY + aimY * (len * 0.54);

    const halfBase = base.widthRatio * minDim * 0.5;
    const nx = -aimY;
    const ny = aimX;

    return {
      ...base,
      idx,
      active,
      dir,
      rad,
      borderDist,
      outerX,
      outerY,
      innerX,
      innerY,
      midX,
      midY,
      aimX,
      aimY,
      flowX,
      flowY,
      nx,
      ny,
      len,
      halfBase,
      missPx,
      missRatio,
      tipDistToCenter,
      stabsCore,
    };
  });

  const distractors = BASE_DISTRACTORS.map((d, idx) => ({
    ...d,
    idx,
    active: Boolean(state.distractors[idx]),
    x: d.nx * W,
    y: d.ny * H,
    r: Math.max(18, minDim * 0.048),
  }));

  return { W, H, minDim, cx, cy, sanctuaryR, coreContentR, wedges, distractors };
}

// 从实绘几何单真源核算全部 4 项判据、错态与白话诊断
export function evaluate(state, width = 1000, height = 560) {
  const geom = buildGeometry(state, width, height);
  const activeWedges = geom.wedges.filter((w) => w.active);
  const inwardWedges = activeWedges.filter((w) => w.dir > 0);
  const rebelWedges = activeWedges.filter((w) => w.dir < 0);
  const activeDistractors = geom.distractors.filter((d) => d.active);

  // 1. 指向汇聚精度（由实绘楔形真实脱靶距 + 反指数量算出）
  const meanMissRatio = activeWedges.length
    ? activeWedges.reduce((s, w) => s + w.missRatio, 0) / activeWedges.length
    : 1;
  const absSkew = Math.abs(Math.round(state.aimSkewDeg));
  const rebelCount = rebelWedges.length;
  const aimOk = absSkew <= 8 && rebelCount === 0 && activeWedges.length >= 4;

  // 2. 静谧核留白与主体保护（由实绘静谧环占短边比例与尖端刺核数算出）
  const sanctuaryPct = Math.round(state.sanctuaryRatio * 100);
  const stabCount = inwardWedges.filter((w) => w.stabsCore).length;
  const sanctuaryTooTight = sanctuaryPct < 18 || stabCount > 0;
  const sanctuaryTooLoose = sanctuaryPct > 41;
  const sanctuaryOk = !sanctuaryTooTight && !sanctuaryTooLoose;

  // 3. 外围凝聚度（由实绘高饱和角落干扰物数量算出）
  const distractorCount = activeDistractors.length;
  const cohesionOk = distractorCount === 0;

  // 4. 四向结构稳定与平衡（由实绘向内楔形的角跨度与加权向量合力算出）
  let maxGapDeg = 360;
  let imbalanceRatio = 1;
  if (inwardWedges.length >= 2) {
    const angles = inwardWedges
      .map((w) => ((w.angleDeg % 360) + 360) % 360)
      .sort((a, b) => a - b);
    maxGapDeg = 0;
    for (let i = 0; i < angles.length; i++) {
      const next = i + 1 < angles.length ? angles[i + 1] : angles[0] + 360;
      maxGapDeg = Math.max(maxGapDeg, next - angles[i]);
    }
    let sx = 0;
    let sy = 0;
    let totalW = 0;
    for (const w of inwardWedges) {
      sx += Math.cos(w.rad) * w.weight;
      sy += Math.sin(w.rad) * w.weight;
      totalW += w.weight;
    }
    imbalanceRatio = totalW > 0 ? Math.hypot(sx, sy) / totalW : 1;
  }
  const angularSpanDeg = Math.round(360 - maxGapDeg);
  const imbalancePct = Math.round(imbalanceRatio * 100);
  const focusShiftPct = Math.round(Math.hypot(state.focusX - 0.5, state.focusY - 0.5) * 100);
  const stabilityOk =
    inwardWedges.length >= 4 &&
    maxGapDeg <= 145 &&
    imbalancePct <= 28 &&
    focusShiftPct <= 16;

  // 四项规则逐条状态（对应原海报 4 条核心要点 & 底部 4 个关键词）
  const checks = {
    convergence: {
      ok: aimOk,
      key: "convergence",
      title: "引导汇聚",
      en: "CONVERGENCE",
      badge:
        rebelCount > 0
          ? `反指 ${rebelCount} 支`
          : absSkew > 8
          ? `散焦 ${absSkew}°`
          : activeWedges.length < 4
          ? `仅剩 ${activeWedges.length} 支`
          : `收准 ${absSkew}°`,
    },
    focus: {
      ok: sanctuaryOk,
      key: "focus",
      title: "聚焦主体",
      en: "FOCUS",
      badge: sanctuaryTooTight
        ? `刺核 ${sanctuaryPct}%`
        : sanctuaryTooLoose
        ? `空心 ${sanctuaryPct}%`
        : `净空 ${sanctuaryPct}%`,
    },
    gathering: {
      ok: cohesionOk,
      key: "gathering",
      title: "增强凝聚",
      en: "GATHERING",
      badge: distractorCount > 0 ? `杂散 ${distractorCount} 处` : "外围纯净",
    },
    stability: {
      ok: stabilityOk,
      key: "stability",
      title: "稳定有力",
      en: "INWARD",
      badge:
        inwardWedges.length < 4
          ? `向内 ${inwardWedges.length} 支`
          : imbalancePct > 28 || maxGapDeg > 145
          ? `偏推 ${imbalancePct}%`
          : focusShiftPct > 16
          ? `核偏 ${focusShiftPct}%`
          : `均衡 ${100 - imbalancePct}%`,
    },
  };

  const passCount = Object.values(checks).filter((c) => c.ok).length;

  // 示意性综合向心聚力档位（不搞假精确小数，直接给清晰档位）
  const rawIndex = clamp(
    Math.round(
      100 -
        absSkew * 1.45 -
        rebelCount * 14 -
        (sanctuaryTooTight ? (18 - sanctuaryPct) * 2.2 : sanctuaryTooLoose ? (sanctuaryPct - 41) * 2.0 : 0) -
        distractorCount * 7 -
        Math.max(0, imbalancePct - 20) * 0.9 -
        Math.max(0, 4 - inwardWedges.length) * 14
    ),
    6,
    99
  );
  const tier =
    passCount === 4
      ? "强聚锁焦"
      : passCount === 3
      ? "接近锁焦"
      : passCount >= 1
      ? "引力散弱"
      : "向心瓦解";

  // 判定当前最首要的诊断（永远讲「眼睛怎么看、为什么坏/好」+ 下一步直接动作）
  let headline = "";
  let why = "";
  let nextStep = "";
  let statusChip = "";
  let faultKind = "ok";

  if (passCount === 4) {
    faultKind = "ok";
    const isMinimal = inwardWedges.length === 4;
    const isOffCenter = focusShiftPct >= 4;
    headline = isMinimal
      ? "4 支四角主楔干净锁焦，极简向心成立"
      : isOffCenter
      ? "微偏焦核仍受四向托举，一点透视向心成立"
      : "四面势能齐聚静谧核，第一眼稳稳锁住主角";
    why =
      `实绘 ${inwardWedges.length} 支向内楔形偏角仅 ${absSkew}°，全部整齐刹在 ${sanctuaryPct}% 静谧环外，角落零杂散。视线从画框四周滑入后无处分神，自然停驻在中央主标上。`;
    nextStep = "按 Space 放流 24 枚视线珠验真，或点击任意楔形试着把它扳反，看看一根叛逃箭头怎样撕开向心场。";
    statusChip = `4/4 · ${tier}`;
  } else if (rebelCount > 0 && absSkew > 8) {
    faultKind = "multi";
    headline = `${rebelCount} 支楔形向外叛逃且指向偏散 ${absSkew}°，视线被扯碎`;
    why =
      `向心构图要求所有方向势能指向同一中心；现在既有 ${rebelCount} 支箭头把眼睛往画外拽（滑向 054 离心），其余楔形也偏离核心 ${absSkew}°，目光进场找不到统一落点。`;
    nextStep = "先横拖画布把指向偏角拧回 0° 附近，再直接点击画布上标红的「外逃箭头」把它们扳回向内。";
    statusChip = `${passCount}/4 · 叛逃+散焦`;
  } else if (rebelCount > 0) {
    faultKind = "rebel";
    headline = `有 ${rebelCount} 支箭头朝画外反指，正在把视线拽出画框`;
    why =
      "只要版面里混入向外逃逸的强箭头，观众的注意力就会顺着出口滑离主角，画面瞬间在「向心」与「离心」之间撕裂。";
    nextStep = "直接点击画布上带红虚线出口的叛逃楔形，把它翻转回「向内汇聚」。";
    statusChip = `${passCount}/4 · 反指 ${rebelCount} 支`;
  } else if (absSkew > 8) {
    faultKind = "skew";
    headline = `外围楔形整体偏斜 ${absSkew}°，延长线在中心擦肩而过`;
    why =
      `8 条引导线的延长轨迹平均脱靶约 ${Math.round(meanMissRatio * 100)}% 画幅，互相交叉打结却没落在主标上，眼睛跟着线条绕了一圈却看不清主角。`;
    nextStep = "在画布空白处左右横拖（或拖「汇聚偏角」滑轨到 0°±8°），让所有锐尖对齐同一焦核。";
    statusChip = `${passCount}/4 · 散焦 ${absSkew}°`;
  } else if (sanctuaryTooTight) {
    faultKind = "stab";
    headline = `静谧环仅剩 ${sanctuaryPct}%，锐利箭尖直接刺进主标笔画`;
    why =
      "汇聚线条是来「护送」视线而非「攻击」主角的。尖端逼近甚至扎入文字区，会制造强烈视觉压迫感，让中央核心字团糊在一起。";
    nextStep = "向外拖动中央孔雀青虚线环（或调「静谧环净空」到 22%–36%），为主标腾出安静的落脚圈。";
    statusChip = `${passCount}/4 · 刺核 ${sanctuaryPct}%`;
  } else if (sanctuaryTooLoose) {
    faultKind = "hollow";
    headline = `静谧环过大（${sanctuaryPct}%），外围箭头缩在边角接不上力`;
    why =
      "引导楔形离中心太远，中间大片空白像一口空井，眼睛从边缘走不到主角跟前就断了气，向心力大打折扣。";
    nextStep = "向内收紧中央虚线环（或调「静谧环净空」回 22%–36%），让楔形真正把目光护送到主角门前。";
    statusChip = `${passCount}/4 · 空心 ${sanctuaryPct}%`;
  } else if (distractorCount > 0) {
    faultKind = "noise";
    headline = `角落挂着 ${distractorCount} 处高饱和杂散块，中途截走了目光`;
    why =
      "原海报第三条提醒「减少分散元素，让画面紧凑统一」。外围角落出现亮色标签或角标时，眼睛会被抢先拽去角落，削弱中央的唯一统治力。";
    nextStep = "直接点击画布四角的杂散标签把它们逐一清掉（或点下方「清空角落杂散」）。";
    statusChip = `${passCount}/4 · 杂散 ${distractorCount} 处`;
  } else {
    faultKind = "imbalance";
    headline =
      inwardWedges.length < 4
        ? `向内引导仅剩 ${inwardWedges.length} 支，围合势能单薄`
        : `向内楔形偏向一侧（力矩偏 ${imbalancePct}%），画面像单边推挤`;
    why =
      "向心式构图靠多方向合力互相抵消来建立「稳定有力」的锚定感。箭头全堆在单侧或数量不足时，视线只被推向一头，稳重感随之塌陷。";
    nextStep = "点选预设「原海报 · 八向全聚」或「极简 · 四角精聚」，让四面方向势能形成均衡围合。";
    statusChip = `${passCount}/4 · 偏推 ${imbalancePct}%`;
  }

  return {
    geom,
    checks,
    passCount,
    absSkew,
    rebelCount,
    sanctuaryPct,
    stabCount,
    distractorCount,
    inwardCount: inwardWedges.length,
    imbalancePct,
    angularSpanDeg,
    meanMissPct: Math.round(meanMissRatio * 100),
    rawIndex,
    tier,
    faultKind,
    statusChip,
    headline,
    why,
    nextStep,
  };
}
