// 210 破格网格 — 单真源几何模型
// 逻辑坐标系：5 列 × 6 行虚线网格位于 x ∈ [0, 5], y ∈ [0, 6]
// 印张含四周出血余边：x ∈ [-0.6, 5.6]（宽 6.2），y ∈ [-0.5, 6.5]（高 7.0）
// 所有界面读数、四枚原海报圆徽状态、底部公式亮灯、顶部标题破格联动均由此单一真源计算。

export const COLS = 5;
export const ROWS = 6;
export const PAD_X = 0.6;
export const PAD_Y = 0.5;
export const SHEET_W = COLS + PAD_X * 2; // 6.2
export const SHEET_H = ROWS + PAD_Y * 2; // 7.0

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报构成",
    short: "原海报",
    metaTag: "GRID 5×6 · NO.210",
    metaSub: "ORDER IS THE BASE",
    headlineTop: "规则是用来",
    headlineAccent: "打破的",
    notesLines: ["Rules are", "made to be", "broken."],
    circleCaption: "01",
    blackCaption: "MASS",
    redCaption: "FOCUS",
    railText: "ORDER IS THE BASE. BREAKING IS THE MOVE.",
  },
  exhibition: {
    id: "exhibition",
    label: "当代建筑展",
    short: "建筑展",
    metaTag: "ARCH · 10.12—12.28",
    metaSub: "HALL B / CONCRETE",
    headlineTop: "重力之外",
    headlineAccent: "悬挑展",
    notesLines: ["Cantilever", "Space & Mass", "Basel 2026"],
    circleCaption: "B2",
    blackCaption: "STEEL",
    redCaption: "ENTRY",
    railText: "STRUCTURE HOLDS THE FORM. CANTILEVER BREAKS IT.",
  },
  editorial: {
    id: "editorial",
    label: "独立杂志页",
    short: "杂志页",
    metaTag: "ISSUE 14 · P.042",
    metaSub: "SWISS TYPE REVIEW",
    headlineTop: "逃出栏线",
    headlineAccent: "的字块",
    notesLines: ["Typography", "beyond the", "12-col box."],
    circleCaption: "42",
    blackCaption: "PLATE",
    redCaption: "QUOTE",
    railText: "READ THE COLUMN. FEEL THE BREAK.",
  },
};

export const MODULE_META = {
  metaBar: { name: "网格栏头", short: "栏头", kind: "meta", z: 1, weight: 0.45 },
  gridNotes: { name: "副文注脚", short: "副文", kind: "notes", z: 2, weight: 0.5 },
  headline: { name: "主标字块", short: "主标", kind: "headline", z: 5, weight: 0.9 },
  blackBlock: { name: "纯黑体块", short: "黑块", kind: "rect", z: 3, weight: 1.3 },
  redBar: { name: "朱红横块", short: "红块", kind: "redRect", z: 4, weight: 1.15 },
  circle: { name: "朱红主圆", short: "红圆", kind: "circle", z: 6, weight: 1.2 },
};

export const MODULE_ORDER = ["metaBar", "gridNotes", "blackBlock", "redBar", "headline", "circle"];

// 每个模块在「全员锁格（0 破格常规网格）」时的原格基准槽
export const HOME_SLOTS = {
  metaBar: { gx: 0, gy: 0, gw: 2, gh: 1, rot: 0 },
  circle: { gx: 3, gy: 0, gw: 2, gh: 2, rot: 0 },
  headline: { gx: 0, gy: 1, gw: 2, gh: 2, rot: 0 },
  gridNotes: { gx: 0, gy: 3, gw: 2, gh: 1, rot: 0 },
  blackBlock: { gx: 3, gy: 3, gw: 2, gh: 2, rot: 0 },
  redBar: { gx: 1, gy: 5, gw: 2, gh: 1, rot: 0 },
};

// 当底层秩序被拆散时，辅助模块的散乱偏移量
export const SHATTER_OFFSETS = {
  metaBar: { dx: 0.24, dy: 0.18, dr: -4.5 },
  gridNotes: { dx: -0.26, dy: 0.22, dr: 5.5 },
  headline: { dx: 0.19, dy: -0.17, dr: -3.5 },
  blackBlock: { dx: -0.18, dy: 0.15, dr: 4.0 },
  redBar: { dx: 0.22, dy: -0.19, dr: -5.0 },
  circle: { dx: -0.15, dy: 0.24, dr: 0 },
};

export const PRESETS = {
  // 开场默认：全员锁格（0 破格 · 常规平庸错态）
  rigid: {
    id: "rigid",
    label: "复原全员锁格",
    kind: "error",
    gridIntegrity: "intact",
    selected: "circle",
    modules: structuredClone(HOME_SLOTS),
  },
  // 合法解 1：忠实复刻 210 原海报经典构图（右上红圆出血 + 右中黑块斜切越界 + 底部红块跨栏偏移）
  posterClassic: {
    id: "posterClassic",
    label: "原海报经典解",
    kind: "valid",
    gridIntegrity: "intact",
    selected: "blackBlock",
    modules: {
      metaBar: { gx: 0, gy: 0, gw: 2, gh: 1, rot: 0 },
      circle: { gx: 2.9, gy: -0.46, gw: 2.45, gh: 2.45, rot: 0 },
      headline: { gx: 0, gy: 1, gw: 2, gh: 2, rot: 0 },
      gridNotes: { gx: 0, gy: 3, gw: 2, gh: 1, rot: 0 },
      blackBlock: { gx: 3.18, gy: 2.24, gw: 2.2, gh: 2.55, rot: 17 },
      redBar: { gx: 0.62, gy: 4.58, gw: 2.72, gh: 1.42, rot: 0 },
    },
  },
  // 合法解 2：克制单点出血（仅朱红圆冲破右上角，其余 5 块严格贴格，极度冷静克制）
  singleBleed: {
    id: "singleBleed",
    label: "单点出血解",
    kind: "valid",
    gridIntegrity: "intact",
    selected: "circle",
    modules: {
      metaBar: { gx: 0, gy: 0, gw: 2, gh: 1, rot: 0 },
      circle: { gx: 2.75, gy: -0.42, gw: 2.65, gh: 2.65, rot: 0 },
      headline: { gx: 0, gy: 1, gw: 2, gh: 2, rot: 0 },
      gridNotes: { gx: 0, gy: 3, gw: 2, gh: 1, rot: 0 },
      blackBlock: { gx: 3, gy: 3, gw: 2, gh: 2, rot: 0 },
      redBar: { gx: 1, gy: 5, gw: 2, gh: 1, rot: 0 },
    },
  },
  // 合法解 3：跨栏巨标压阵（主标横跨 3.6 栏 + 底部红块向左偏移，无斜切，靠尺度与跨越破格）
  spanHeadline: {
    id: "spanHeadline",
    label: "跨栏巨标解",
    kind: "valid",
    gridIntegrity: "intact",
    selected: "headline",
    modules: {
      metaBar: { gx: 0, gy: 0, gw: 2, gh: 1, rot: 0 },
      circle: { gx: 3, gy: 0, gw: 2, gh: 2, rot: 0 },
      headline: { gx: -0.35, gy: 1.45, gw: 3.55, gh: 1.75, rot: 0 },
      gridNotes: { gx: 0, gy: 3, gw: 2, gh: 1, rot: 0 },
      blackBlock: { gx: 3, gy: 3, gw: 2, gh: 2, rot: 0 },
      redBar: { gx: 1, gy: 5, gw: 3.4, gh: 1, rot: 0 },
    },
  },
  // 合法解 4：对角双核张力（左上红圆跨界 + 右下黑块斜切，中部大面积留白呼吸）
  diagonalPair: {
    id: "diagonalPair",
    label: "对角张力解",
    kind: "valid",
    gridIntegrity: "intact",
    selected: "blackBlock",
    modules: {
      metaBar: { gx: 3, gy: 0, gw: 2, gh: 1, rot: 0 },
      circle: { gx: -0.4, gy: -0.35, gw: 2.4, gh: 2.4, rot: 0 },
      headline: { gx: 0, gy: 2, gw: 2, gh: 2, rot: 0 },
      gridNotes: { gx: 0, gy: 4, gw: 2, gh: 1, rot: 0 },
      blackBlock: { gx: 2.9, gy: 3.35, gw: 2.3, gh: 2.25, rot: -15 },
      redBar: { gx: 0, gy: 5, gw: 2, gh: 1, rot: 0 },
    },
  },
  // 试错 1：处处破格（5/6 块乱飞斜切，秩序崩盘）
  overBroken: {
    id: "overBroken",
    label: "试错：处处破格",
    kind: "error",
    gridIntegrity: "intact",
    selected: "redBar",
    modules: {
      metaBar: { gx: 0.45, gy: 0.28, gw: 2.3, gh: 1, rot: -11 },
      circle: { gx: 3.1, gy: -0.35, gw: 2.3, gh: 2.3, rot: 0 },
      headline: { gx: 0.35, gy: 1.38, gw: 2.6, gh: 1.9, rot: 9 },
      gridNotes: { gx: 0.48, gy: 3.42, gw: 2.1, gh: 1, rot: -12 },
      blackBlock: { gx: 3.25, gy: 2.35, gw: 2.15, gh: 2.3, rot: 22 },
      redBar: { gx: 0.55, gy: 4.55, gw: 2.6, gh: 1.3, rot: 14 },
    },
  },
  // 试错 2：压字失读（黑块/红块直接遮住主标文字）
  textBlocked: {
    id: "textBlocked",
    label: "试错：压字失读",
    kind: "error",
    gridIntegrity: "intact",
    selected: "blackBlock",
    modules: {
      metaBar: { gx: 0, gy: 0, gw: 2, gh: 1, rot: 0 },
      circle: { gx: 2.95, gy: -0.4, gw: 2.45, gh: 2.45, rot: 0 },
      headline: { gx: 0, gy: 1, gw: 2, gh: 2, rot: 0 },
      gridNotes: { gx: 0, gy: 3, gw: 2, gh: 1, rot: 0 },
      blackBlock: { gx: 0.45, gy: 1.15, gw: 2.35, gh: 2.3, rot: -12 },
      redBar: { gx: 1, gy: 5, gw: 2, gh: 1, rot: 0 },
    },
  },
  // 试错 3：微偏失误（差了零点一格，看着像没对齐）
  microSlip: {
    id: "microSlip",
    label: "试错：像没对齐",
    kind: "error",
    gridIntegrity: "intact",
    selected: "blackBlock",
    modules: {
      metaBar: { gx: 0, gy: 0, gw: 2, gh: 1, rot: 0 },
      circle: { gx: 3.09, gy: 0.08, gw: 2, gh: 2, rot: 0 },
      headline: { gx: 0, gy: 1, gw: 2, gh: 2, rot: 0 },
      gridNotes: { gx: 0, gy: 3, gw: 2, gh: 1, rot: 0 },
      blackBlock: { gx: 3.1, gy: 3.09, gw: 2, gh: 2, rot: 3 },
      redBar: { gx: 1, gy: 5, gw: 2, gh: 1, rot: 0 },
    },
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    gridIntegrity: PRESETS.rigid.gridIntegrity,
    selected: PRESETS.rigid.selected,
    showGuides: true,
    modules: structuredClone(PRESETS.rigid.modules),
  };
}

export function clampModule(id, m) {
  const minW = id === "circle" ? 1.3 : id === "metaBar" || id === "gridNotes" ? 1.5 : 1.2;
  const minH = id === "circle" ? 1.3 : id === "metaBar" || id === "gridNotes" ? 0.85 : 0.9;
  const maxW = id === "circle" ? 3.2 : 4.4;
  const maxH = id === "circle" ? 3.2 : 3.8;
  const gw = Math.max(minW, Math.min(maxW, m.gw));
  const gh = id === "circle" ? gw : Math.max(minH, Math.min(maxH, m.gh));
  const gx = Math.max(-PAD_X + 0.05, Math.min(COLS + PAD_X - gw - 0.05, m.gx));
  const gy = Math.max(-PAD_Y + 0.05, Math.min(ROWS + PAD_Y - gh - 0.05, m.gy));
  const rot = id === "circle" ? 0 : Math.max(-32, Math.min(32, m.rot));
  return { gx, gy, gw, gh, rot };
}

// 如果底层网格处于「拆散」状态，计算模块的实绘偏移位置
export function getRenderedBox(id, state) {
  const base = state.modules[id];
  if (state.gridIntegrity !== "shattered") return base;
  const off = SHATTER_OFFSETS[id];
  return {
    gx: base.gx + off.dx,
    gy: base.gy + off.dy,
    gw: base.gw,
    gh: base.gh,
    rot: base.kind === "circle" || id === "circle" ? 0 : base.rot + off.dr,
  };
}

const distToInt = (v) => Math.abs(v - Math.round(v));

// 获取模块在网格坐标系下的旋转后包围盒（用于越界检测）
export function getModuleAABB(id, box) {
  const cx = box.gx + box.gw / 2;
  const cy = box.gy + box.gh / 2;
  if (id === "circle" || Math.abs(box.rot) < 0.01) {
    return { x0: box.gx, y0: box.gy, x1: box.gx + box.gw, y1: box.gy + box.gh, cx, cy };
  }
  const rad = (box.rot * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const hw = (box.gw * cos + box.gh * sin) / 2;
  const hh = (box.gw * sin + box.gh * cos) / 2;
  return { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh, cx, cy };
}

// 精确判断网格坐标点 (px, py) 是否落在旋转后的模块内
export function pointInModule(id, box, px, py) {
  const cx = box.gx + box.gw / 2;
  const cy = box.gy + box.gh / 2;
  if (id === "circle") {
    const r = Math.min(box.gw, box.gh) / 2;
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  }
  const dx = px - cx;
  const dy = py - cy;
  const rad = (-box.rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return Math.abs(lx) <= box.gw / 2 && Math.abs(ly) <= box.gh / 2;
}

// 单模块破格分类（全部从当前实绘几何算，无写死常量）
export function classifyModule(id, state) {
  const box = getRenderedBox(id, state);
  const home = HOME_SLOTS[id];
  const aabb = getModuleAABB(id, box);
  const bleedLeft = Math.max(0, -aabb.x0);
  const bleedRight = Math.max(0, aabb.x1 - COLS);
  const bleedTop = Math.max(0, -aabb.y0);
  const bleedBottom = Math.max(0, aabb.y1 - ROWS);
  const bleedMax = Math.max(bleedLeft, bleedRight, bleedTop, bleedBottom);
  const bleed = bleedMax >= 0.16;

  const offX = distToInt(box.gx);
  const offY = distToInt(box.gy);
  const offMax = Math.max(offX, offY);
  const offset = offMax >= 0.22;

  const absRot = Math.abs(box.rot);
  const tilt = absRot >= 6;

  const homeArea = id === "circle" ? Math.PI * (home.gw / 2) ** 2 : home.gw * home.gh;
  const currArea = id === "circle" ? Math.PI * (box.gw / 2) ** 2 : box.gw * box.gh;
  const areaRatio = currArea / homeArea;
  const span = (box.gw - home.gw >= 0.75 || box.gh - home.gh >= 0.75) && areaRatio >= 1.38;

  const isBroken = bleed || offset || tilt || span;
  const microSlip =
    !isBroken &&
    ((offMax >= 0.045 && offMax < 0.22) ||
      (absRot >= 1.2 && absRot < 6) ||
      (bleedMax >= 0.04 && bleedMax < 0.16));

  const aligned = !isBroken && !microSlip && state.gridIntegrity !== "shattered";

  const moves = [];
  if (bleed) moves.push("越界出血");
  if (tilt) moves.push(`斜切 ${box.rot > 0 ? "+" : ""}${Math.round(box.rot)}°`);
  if (span) moves.push(`跨栏 ${areaRatio.toFixed(1)}×`);
  if (offset && !bleed) moves.push(`偏移 ${offMax.toFixed(2)}格`);

  return {
    id,
    name: MODULE_META[id].name,
    short: MODULE_META[id].short,
    box,
    aabb,
    bleed,
    bleedMax,
    offset,
    offMax,
    tilt,
    absRot,
    span,
    areaRatio,
    currArea,
    isBroken,
    microSlip,
    aligned,
    moves,
  };
}

// 单真源全面评估：通过 48×40 覆盖栅格计算留白、压字遮挡、视觉重心与 7 类双向失误
export function evaluate(state) {
  const details = {};
  for (const id of MODULE_ORDER) {
    details[id] = classifyModule(id, state);
  }
  const list = MODULE_ORDER.map((id) => details[id]);
  const brokenList = list.filter((d) => d.isBroken);
  const alignedList = list.filter((d) => d.aligned);
  const slipList = list.filter((d) => d.microSlip);

  // 48×40 覆盖栅格核算（覆盖整个 5×6 有效印张区 [0,5]×[0,6] 及主文字遮挡）
  const NX = 48;
  const NY = 40;
  let coveredCells = 0;
  let textCells = 0;
  let textBlockedCells = 0;
  let weightedX = 0;
  let weightedY = 0;
  let weightSum = 0;

  const blockers = ["circle", "blackBlock", "redBar"];
  const textIds = ["headline", "gridNotes"];

  for (let iy = 0; iy < NY; iy++) {
    const py = ((iy + 0.5) / NY) * ROWS;
    for (let ix = 0; ix < NX; ix++) {
      const px = ((ix + 0.5) / NX) * COLS;
      let anyHit = false;
      let hitText = false;
      let hitBlocker = false;
      let cellWeight = 0;

      for (let k = 0; k < MODULE_ORDER.length; k++) {
        const id = MODULE_ORDER[k];
        if (pointInModule(id, details[id].box, px, py)) {
          anyHit = true;
          const w = MODULE_META[id].weight;
          if (w > cellWeight) cellWeight = w;
          if (textIds.includes(id)) hitText = true;
          if (blockers.includes(id)) hitBlocker = true;
        }
      }
      if (anyHit) {
        coveredCells++;
        weightedX += px * cellWeight;
        weightedY += py * cellWeight;
        weightSum += cellWeight;
      }
      if (hitText) {
        textCells++;
        if (hitBlocker) textBlockedCells++;
      }
    }
  }

  const totalCells = NX * NY;
  const coveragePct = Math.round((coveredCells / totalCells) * 100);
  const whitespacePct = 100 - coveragePct;
  const textCoverPct = textCells > 0 ? Math.round((textBlockedCells / textCells) * 100) : 0;

  const comX = weightSum > 0 ? weightedX / weightSum : COLS / 2;
  const comY = weightSum > 0 ? weightedY / weightSum : ROWS / 2;
  const balanceDrift = Math.hypot((comX - COLS / 2) / (COLS / 2), (comY - ROWS / 2) / (ROWS / 2));

  // 共享网格对齐轴检验（至少有 2 个守序块共享左/右/上/下整数格线）
  let sharedAxes = 0;
  const xBuckets = new Map();
  const yBuckets = new Map();
  for (const d of alignedList) {
    const xKey = Math.round(d.box.gx);
    const yKey = Math.round(d.box.gy);
    xBuckets.set(xKey, (xBuckets.get(xKey) || 0) + 1);
    yBuckets.set(yKey, (yBuckets.get(yKey) || 0) + 1);
  }
  for (const v of xBuckets.values()) if (v >= 2) sharedAxes++;
  for (const v of yBuckets.values()) if (v >= 2) sharedAxes++;

  // 最大视觉对比比（焦点块最大面积 / 最小常规块面积）
  const areas = list.map((d) => d.currArea).sort((a, b) => a - b);
  const scaleContrast = areas[areas.length - 1] / Math.max(0.8, areas[0]);

  const brokenCount = brokenList.length;
  const alignedCount = alignedList.length;
  const orderPct =
    state.gridIntegrity === "shattered" ? 0 : Math.round((alignedCount / MODULE_ORDER.length) * 100);

  // 判定 7 类双向失误（全部可独立触发）
  const issues = [];
  if (state.gridIntegrity === "shattered") {
    issues.push({
      code: "shattered",
      badge: "底格塌陷",
      title: "底层网格基准已拆散，破格失去对比参照",
      body: "现在连原本该守序的栏头与副文也跟着晃动偏移。没有清晰可见的底层网格托底，观众看不出哪里在「破」，只觉得整张版面松散凌乱。",
      fixLabel: "重建 5×6 底层网格秩序",
      fixAction: "restoreGrid",
    });
  }
  if (textCoverPct >= 14) {
    issues.push({
      code: "textBlocked",
      badge: `压字 ${textCoverPct}%`,
      title: `破格色块盖住了 ${textCoverPct}% 核心文字区`,
      body: "标题和副文被大面积几何块直接压盖。破格是为了给重点信息开路，一旦破坏了文字可读性，形式就反客为主了。",
      fixLabel: "移开压字色块",
      fixAction: "clearText",
    });
  }
  if (brokenCount >= 4) {
    issues.push({
      code: "overBroken",
      badge: `${brokenCount}/6 过破`,
      title: `${brokenCount} 个模块同时破格，秩序被彻底淹没`,
      body: "当超过半数的元素都在越界、偏移或斜切，「例外」就变成了常态。眼睛到处都是冲突，反而找不到谁才是主角——把破格收敛到 1–3 个重点。",
      fixLabel: "保留 2–3 处破格并归位其余模块",
      fixAction: "preset:posterClassic",
    });
  }
  if (slipList.length > 0 && brokenCount === 0) {
    const s = slipList[0];
    const hint = s.absRot >= 1.2 ? `微斜 ${Math.round(s.absRot)}°` : `偏出 ${s.offMax.toFixed(2)} 格`;
    issues.push({
      code: "microSlip",
      badge: "像没对齐",
      title: `${s.name}只${hint}，像粗心歪了而不是有意破格`,
      body: "破格必须干脆利落。只差几个像素或两三度的偏移，大脑会直接把它判成「排版失误」——要么干脆推出 ≥0.25 格或冲出边线，要么老实吸回格线。",
      fixLabel: `让${s.name}干脆冲出格线`,
      fixAction: `boldBreak:${s.id}`,
    });
  }
  if (whitespacePct < 26) {
    issues.push({
      code: "crowded",
      badge: `留白 ${whitespacePct}%`,
      title: `画面净留白跌至 ${whitespacePct}%，破格张力被挤闷`,
      body: "破格不等于把页面塞满。元素铺得太满时，越界和斜切没有空白地带可以呼吸，整张纸显得拥挤局促（经验上留白守在 28% 以上更通透）。",
      fixLabel: "收缩次要块、释放余白",
      fixAction: "preset:posterClassic",
    });
  }
  if (balanceDrift > 0.56) {
    const side = comX > COLS / 2 ? "右侧" : "左侧";
    issues.push({
      code: "unbalanced",
      badge: "重心偏坠",
      title: `视觉重量过度堆向${side}，画面失去总体平衡`,
      body: "破格允许不对称，但不能让整张纸向一边倾倒。试着在对侧留出呼应的色块或让守序栏稳住另一半画幅。",
      fixLabel: "调整对侧平衡布局",
      fixAction: "preset:diagonalPair",
    });
  }
  if (brokenCount === 0 && slipList.length === 0) {
    issues.push({
      code: "rigid",
      badge: "0/6 全锁格",
      title: "全部 6 块锁死在常规网格内，缺乏视觉焦点",
      body: "现在每个模块都规规矩矩贴着 5×6 虚线格，工整得像一张表格，却没有制造任何意外与节奏变化。直接拖动右上朱红圆冲出格线，或把纯黑块斜切破格试试。",
      fixLabel: "一键试看原海报破格解",
      fixAction: "preset:posterClassic",
    });
  }

  const ok = issues.length === 0 && brokenCount >= 1 && brokenCount <= 3 && alignedCount >= 3;

  // 如果存在次级微偏（即使同时已有合法破格块），温馨提示但不一定算崩盘，或者严格判定微偏失误
  let primary = issues[0] || null;
  if (!primary && slipList.length > 0) {
    const s = slipList[0];
    primary = {
      code: "microSlip",
      badge: "次要块微偏",
      title: `${s.name}略微偏出格线，建议干脆归格或放大破格`,
      body: "主焦点已经破格成立，但次要块只偏出一点点会削弱底层网格的利落感。点中它按「归格」吸回整数线，画面立刻更干脆。",
      fixLabel: `把${s.name}吸回整数格`,
      fixAction: `snap:${s.id}`,
    };
  }

  const passed = !primary && ok;

  // 合法解的细分风格判定
  let winStyle = "有效破格";
  let winTitle = `秩序与破格达成平衡（${brokenCount} 破 / ${alignedCount} 守）`;
  let winBody = `底层 ${alignedCount} 块守住 5×6 网格秩序，${brokenList.map((b) => b.name).join("、")}干脆破格形成明确焦点，净留白 ${whitespacePct}% 让视觉张力舒展透彻。`;
  if (passed) {
    if (brokenCount === 1 && brokenList[0].bleed) {
      winStyle = "单点出血破格";
      winTitle = `${brokenList[0].name}单点越界，极简秩序中一击破局`;
    } else if (brokenList.some((b) => b.tilt) && brokenList.some((b) => b.bleed)) {
      winStyle = "斜切越界高张力";
      winTitle = `越界与斜切并举，${alignedCount} 块底格稳稳托住节奏`;
    } else if (brokenList.some((b) => b.span)) {
      winStyle = "跨栏尺度破格";
      winTitle = `横跨栏线拉大层级反差，重点一眼锁定`;
    }
  }

  // 四枚原海报核心逻辑圆徽（打破 / 强调 / 对比 / 张力）单真源达标状态
  const pillars = {
    disruption: {
      ok: brokenCount >= 1 && brokenCount <= 3 && slipList.length === 0,
      warn: brokenCount >= 4 || slipList.length > 0,
      tag:
        brokenCount === 0
          ? "0 处破格"
          : brokenCount >= 4
            ? `${brokenCount} 处过破`
            : slipList.length > 0
              ? "存在微偏"
              : `${brokenCount} 处干脆破格`,
    },
    emphasis: {
      ok: brokenCount >= 1 && brokenCount <= 3 && textCoverPct < 14,
      warn: textCoverPct >= 14 || brokenCount >= 4,
      tag:
        textCoverPct >= 14
          ? `压字 ${textCoverPct}%`
          : brokenCount === 0
            ? "无突出主角"
            : brokenCount >= 4
              ? "焦点互搏"
              : `焦点明确`,
    },
    contrast: {
      ok: scaleContrast >= 1.8 && brokenCount >= 1 && state.gridIntegrity !== "shattered",
      warn: state.gridIntegrity === "shattered",
      tag:
        state.gridIntegrity === "shattered"
          ? "参照缺失"
          : `体量差 ${scaleContrast.toFixed(1)}×`,
    },
    tension: {
      ok:
        state.gridIntegrity !== "shattered" &&
        alignedCount >= 3 &&
        whitespacePct >= 26 &&
        balanceDrift <= 0.56 &&
        brokenCount >= 1 &&
        brokenCount <= 3,
      warn: whitespacePct < 26 || balanceDrift > 0.56 || state.gridIntegrity === "shattered",
      tag:
        whitespacePct < 26
          ? `留白仅 ${whitespacePct}%`
          : balanceDrift > 0.56
            ? "重心偏坠"
            : alignedCount < 3 || state.gridIntegrity === "shattered"
              ? "秩序不足"
              : `留白 ${whitespacePct}% · 稳`,
    },
  };

  // 原海报底部公式三项实时状态：可见的秩序 + 有意的破坏 + 清晰的目的
  const formula = {
    order: state.gridIntegrity !== "shattered" && alignedCount >= 3 && sharedAxes >= 1,
    breakMove: brokenCount >= 1 && brokenCount <= 3 && slipList.length === 0,
    purpose: textCoverPct < 14 && whitespacePct >= 26 && balanceDrift <= 0.56 && brokenCount >= 1,
  };

  const tensionGrade = !passed
    ? primary?.code === "rigid"
      ? "平庸锁死（示意）"
      : primary?.code === "overBroken" || primary?.code === "shattered"
        ? "失序散乱（示意）"
        : primary?.code === "textBlocked"
          ? "可读受损（示意）"
          : "张力受阻（示意）"
    : brokenCount === 1
      ? "克制聚焦（示意）"
      : "高张力平衡（示意）";

  return {
    passed,
    winStyle,
    badge: passed ? `${brokenCount}/6 · ${winStyle}` : primary.badge,
    title: passed ? winTitle : primary.title,
    body: passed ? winBody : primary.body,
    fixLabel: passed ? "" : primary.fixLabel,
    fixAction: passed ? "" : primary.fixAction,
    primaryCode: passed ? "valid" : primary.code,
    brokenCount,
    alignedCount,
    orderPct,
    whitespacePct,
    coveragePct,
    textCoverPct,
    scaleContrast,
    balanceDrift,
    comX,
    comY,
    tensionGrade,
    details,
    pillars,
    formula,
  };
}
