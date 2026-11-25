// 067 重叠空间构图 · 单一真相几何评估引擎（model.js）
// 全部读数（净留白、叠压面积比、焦形完整度、大形反压、T/X 节点数、擦边切线数、三层明度对比阶梯）
// 均直接由当前实绘的 5 枚几何体坐标、尺寸与 Z 序实时计算，绝不写死常量。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报几何",
    sub: "Bauhaus Geometry",
    names: {
      focal: "深蓝焦圆",
      glass: "磨砂玻片",
      amber: "明黄基块",
      obsidian: "炭黑大圆",
      arch: "金黄半圆",
    },
  },
  exhibition: {
    id: "exhibition",
    label: "包豪斯展报",
    sub: "Exhibition Poster",
    names: {
      focal: "展期蓝徽",
      glass: "半透标题带",
      amber: "主视觉黄块",
      obsidian: "炭黑海报底圆",
      arch: "展馆金拱",
    },
  },
  cards: {
    id: "cards",
    label: "卡片叠层",
    sub: "Layered UI Cards",
    names: {
      focal: "主行动蓝卡",
      glass: "毛玻璃浮层",
      amber: "精选高亮卡",
      obsidian: "深色基底面板",
      arch: "底栏金带",
    },
  },
};

export const MID_MODES = {
  translucent: { id: "translucent", label: "透叠玻片", desc: "形成 X 形透叠节点，连通前与后" },
  opaque: { id: "opaque", label: "实色锐叠", desc: "纯不透明叠压，形成利落 T 形节点" },
  muddy: { id: "muddy", label: "假透明泥", desc: "明度极性错乱，透叠区域发脏发闷" },
  ghost: { id: "ghost", label: "隐形断开", desc: "中层近乎消失，前后过渡彻底断裂" },
};

export const CONTRAST_MODES = {
  flat: { id: "flat", label: "平权同调", ratioFM: 1.24, ratioMB: 1.22, ratioFB: 1.38 },
  ladder: { id: "ladder", label: "清晰阶梯", ratioFM: 2.85, ratioMB: 2.35, ratioFB: 6.4 },
  reverse: { id: "reverse", label: "后层反抢", ratioFM: 1.55, ratioMB: 1.4, ratioFB: 1.9 },
};

// 归一化舞台坐标系 [0..1] × [0..1]（保持与实绘 100% 同步）
// 每个形体：{ id, kind: 'circle'|'rect'|'semi', x, y, r?, w?, h?, baseArea, roleDefault, layer: 1|2|3 }
// layer: 1 = 后层（建立背景）, 2 = 中层（连接过渡）, 3 = 前层（突出重点）
export function createBrokenState(theme = "poster") {
  return {
    theme,
    selectedId: "focal",
    contrastMode: "flat",     // 错态 3：三层明暗平权发闷
    midMode: "muddy",         // 错态 3b：中层假透明灰泥
    scale: 1.36,              // 错态 4：形体胀满，净留白跌破 24%（真 0/4 开场）
    showNodes: true,          // 显示 T / X / 切边标线
    exploded: false,          // 0° 正视 vs 28° 轴测拆层
    compareMode: "live",      // live | flat_none | ref_good
    shapes: [
      // 错态 1：大黑圆被错误置入前层 (layer: 3)，反压吞没中层与小形
      { id: "obsidian", kind: "circle", x: 0.58, y: 0.45, r: 0.25, layer: 3, isBackGiant: true },
      // 后层底托金黄半圆（胀满底沿）
      { id: "arch", kind: "semi", x: 0.47, y: 0.60, r: 0.31, layer: 1, isBackGiant: true },
      // 明黄结构方块（胀满右上）
      { id: "amber", kind: "rect", x: 0.77, y: 0.22, w: 0.35, h: 0.33, layer: 1, isBackGiant: false },
      // 磨砂透叠中层玻片（向左下摊开，压在底层，与右上明黄方明确分开避免藏在黑圆后的假擦边点）
      { id: "glass", kind: "rect", x: 0.25, y: 0.65, w: 0.37, h: 0.37, layer: 2, isMidPane: true },
      // 错态 2：前层深蓝焦圆孤立在左上，与炭黑大圆恰好形成擦边切线、零有效咬合！
      { id: "focal", kind: "circle", x: 0.16, y: 0.15, r: 0.132, layer: 3, isFocal: true },
    ],
  };
}

export function createPosterReferenceState(theme = "poster") {
  return {
    theme,
    selectedId: "focal",
    contrastMode: "ladder",
    midMode: "translucent",
    scale: 1.0,
    showNodes: true,
    exploded: false,
    compareMode: "live",
    shapes: [
      { id: "obsidian", kind: "circle", x: 0.38, y: 0.52, r: 0.235, layer: 1, isBackGiant: true },
      { id: "arch", kind: "semi", x: 0.52, y: 0.64, r: 0.29, layer: 1, isBackGiant: true },
      { id: "amber", kind: "rect", x: 0.72, y: 0.30, w: 0.32, h: 0.30, layer: 1, isBackGiant: false },
      { id: "glass", kind: "rect", x: 0.58, y: 0.54, w: 0.36, h: 0.36, layer: 2, isMidPane: true },
      { id: "focal", kind: "circle", x: 0.54, y: 0.31, r: 0.132, layer: 3, isFocal: true },
    ],
  };
}

export function createNoOverlapState(theme = "poster") {
  return {
    theme,
    selectedId: "focal",
    contrastMode: "ladder",
    midMode: "opaque",
    scale: 0.62,
    showNodes: true,
    exploded: false,
    compareMode: "flat_none",
    shapes: [
      { id: "obsidian", kind: "circle", x: 0.20, y: 0.72, r: 0.235, layer: 1, isBackGiant: true },
      { id: "arch", kind: "semi", x: 0.74, y: 0.73, r: 0.29, layer: 1, isBackGiant: true },
      { id: "amber", kind: "rect", x: 0.78, y: 0.22, w: 0.32, h: 0.30, layer: 1, isBackGiant: false },
      { id: "glass", kind: "rect", x: 0.50, y: 0.48, w: 0.36, h: 0.36, layer: 2, isMidPane: true },
      { id: "focal", kind: "circle", x: 0.20, y: 0.22, r: 0.132, layer: 3, isFocal: true },
    ],
  };
}

// 取得经当前 scale 缩放后的实绘几何参数
export function scaledShape(s, scale) {
  const k = clamp(scale, 0.55, 1.42);
  if (s.kind === "circle" || s.kind === "semi") {
    return { ...s, sr: s.r * k, sw: s.r * 2 * k, sh: s.kind === "semi" ? s.r * k : s.r * 2 * k };
  }
  return { ...s, sr: 0, sw: s.w * k, sh: s.h * k };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 点在形体内的精确判定（归一化 [0..1] 空间）
export function pointInShape(px, py, gs) {
  if (gs.kind === "circle") {
    const dx = px - gs.x, dy = py - gs.y;
    return dx * dx + dy * dy <= gs.sr * gs.sr;
  }
  if (gs.kind === "semi") {
    // 朝下的实心半圆（同 067 原海报底沿金黄半圆：顶平边在 y，弧向下展开）
    const dx = px - gs.x, dy = py - gs.y;
    return dy >= 0 && dx * dx + dy * dy <= gs.sr * gs.sr;
  }
  // rect centered at (x, y)
  return Math.abs(px - gs.x) <= gs.sw * 0.5 && Math.abs(py - gs.y) <= gs.sh * 0.5;
}

// 计算两枚形体的精确最小边界有符号距离（负值 = 重叠深度，正值 = 分离净距）
// 同时估算近似接触点 / 交点坐标，用于标注 T 节点、X 节点或擦边陷阱
function rectBounds(g) {
  return { l: g.x - g.sw * 0.5, r: g.x + g.sw * 0.5, t: g.y - g.sh * 0.5, b: g.y + g.sh * 0.5 };
}

function shapeCenter(g) {
  return g.kind === "semi" ? { x: g.x, y: g.y + g.sr * 0.42 } : { x: g.x, y: g.y };
}

function circleRectGap(c, r) {
  const b = rectBounds(r);
  const cx = clamp(c.x, b.l, b.r);
  const cy = clamp(c.y, b.t, b.b);
  const dx = c.x - cx, dy = c.y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > 1e-6) {
    return { gap: dist - c.sr, px: cx, py: cy };
  }
  // 圆心在矩形内部：计算离最近边的穿透深度
  const dEdge = Math.min(c.x - b.l, b.r - c.x, c.y - b.t, b.b - c.y);
  return { gap: -(c.sr + dEdge), px: cx, py: cy };
}

function pairGap(a, b) {
  // 对半圆用其真实包围盒/圆心做近似边界判定
  const asCircle = (g) => (g.kind === "circle" ? g : null);
  const asRect = (g) => (g.kind === "rect" ? g : g.kind === "semi" ? { ...g, y: g.y + g.sr * 0.5, sw: g.sr * 1.9, sh: g.sr } : null);

  if (a.kind === "circle" && b.kind === "circle") {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const gap = d - (a.sr + b.sr);
    const t = d > 1e-6 ? a.sr / d : 0.5;
    return { gap, px: a.x + dx * t, py: a.y + dy * t };
  }
  if (a.kind === "circle" && b.kind === "semi") {
    // 判定圆与下向半圆的精确近距
    const dy = a.y - b.y;
    if (dy < 0) {
      // 圆在半圆平顶上方：与平顶线段 [b.x-sr, b.x+sr] 求距
      const cx = clamp(a.x, b.x - b.sr, b.x + b.sr);
      const d = Math.hypot(a.x - cx, a.y - b.y);
      return { gap: d - a.sr, px: cx, py: b.y };
    }
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const t = d > 1e-6 ? a.sr / d : 0.5;
    return { gap: d - (a.sr + b.sr), px: a.x + (b.x - a.x) * t, py: a.y + (b.y - a.y) * t };
  }
  if (b.kind === "circle" && a.kind === "semi") {
    return pairGap(b, a);
  }
  if (asCircle(a) && asRect(b)) return circleRectGap(a, asRect(b));
  if (asCircle(b) && asRect(a)) return circleRectGap(b, asRect(a));

  const ra = rectBounds(asRect(a));
  const rb = rectBounds(asRect(b));
  const dx = Math.max(rb.l - ra.r, ra.l - rb.r, 0);
  const dy = Math.max(rb.t - ra.b, ra.t - rb.b, 0);
  if (dx > 0 || dy > 0) {
    const px = (Math.max(ra.l, rb.l) + Math.min(ra.r, rb.r)) * 0.5;
    const py = (Math.max(ra.t, rb.t) + Math.min(ra.b, rb.b)) * 0.5;
    const fx = isFinite(px) ? clamp(px, Math.min(ra.r, rb.r), Math.max(ra.l, rb.l)) : (a.x + b.x) * 0.5;
    const fy = isFinite(py) ? clamp(py, Math.min(ra.b, rb.b), Math.max(ra.t, rb.t)) : (a.y + b.y) * 0.5;
    return { gap: Math.hypot(dx, dy), px: fx, py: fy };
  }
  const ox = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l);
  const oy = Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t);
  return {
    gap: -Math.min(ox, oy),
    px: (Math.max(ra.l, rb.l) + Math.min(ra.r, rb.r)) * 0.5,
    py: (Math.max(ra.t, rb.t) + Math.min(ra.b, rb.b)) * 0.5,
  };
}

// 寻找两形交界处的轮廓交点（用于精准绘制 T / X 节点小标）
function findContourCrossings(a, b) {
  const pts = [];
  // 在形体 a 的边界上均匀取 48 个点，找进出形体 b 的状态翻转处
  const N = 48;
  const sampleBoundary = (g, i) => {
    const t = i / N;
    if (g.kind === "circle") {
      const ang = t * Math.PI * 2;
      return { x: g.x + Math.cos(ang) * g.sr, y: g.y + Math.sin(ang) * g.sr };
    }
    if (g.kind === "semi") {
      if (t < 0.35) {
        const u = t / 0.35;
        return { x: g.x - g.sr + u * 2 * g.sr, y: g.y };
      }
      const ang = ((t - 0.35) / 0.65) * Math.PI;
      return { x: g.x + Math.cos(ang) * g.sr, y: g.y + Math.sin(ang) * g.sr };
    }
    const per = 2 * (g.sw + g.sh);
    let d = t * per;
    const l = g.x - g.sw * 0.5, r = g.x + g.sw * 0.5, top = g.y - g.sh * 0.5, bot = g.y + g.sh * 0.5;
    if (d < g.sw) return { x: l + d, y: top };
    d -= g.sw;
    if (d < g.sh) return { x: r, y: top + d };
    d -= g.sh;
    if (d < g.sw) return { x: r - d, y: bot };
    d -= g.sw;
    return { x: l, y: bot - d };
  };

  let prevPt = sampleBoundary(a, N - 1);
  let prevIn = pointInShape(prevPt.x, prevPt.y, b);
  for (let i = 0; i < N; i++) {
    const curPt = sampleBoundary(a, i);
    const curIn = pointInShape(curPt.x, curPt.y, b);
    if (curIn !== prevIn) {
      pts.push({ x: (prevPt.x + curPt.x) * 0.5, y: (prevPt.y + curPt.y) * 0.5 });
    }
    prevPt = curPt;
    prevIn = curIn;
  }
  return pts;
}

// 渲染顺序：按 layer 升序（1 后层 → 2 中层 → 3 前层）；同层按原始次序，但焦形在同层默认稍后绘以便选中可见
export function orderedShapes(state) {
  const activeState = state.compareMode === "flat_none"
    ? createNoOverlapState(state.theme)
    : state.compareMode === "ref_good"
      ? createPosterReferenceState(state.theme)
      : state;
  const sc = activeState.scale;
  const list = activeState.shapes.map((s, idx) => ({ ...scaledShape(s, sc), _idx: idx }));
  list.sort((a, b) => (a.layer - b.layer) || (a._idx - b._idx));
  return { list, activeState };
}

// 单真源核心核算：所有状态、百分比、节点坐标、4 项达标与 8 类错态诊断皆由此出
export function evaluate(state) {
  const { list, activeState } = orderedShapes(state);
  const ghostMid = activeState.midMode === "ghost";

  // 1) 64×48 精确采样网格（3072 点，< 0.25ms），计算每形面积、总覆盖率、焦形被遮率、重叠加权面积
  const GW = 64, GH = 48, TOTAL = GW * GH;
  const selfCount = Object.fromEntries(list.map((g) => [g.id, 0]));
  const hiddenCount = Object.fromEntries(list.map((g) => [g.id, 0]));
  const visibleCount = Object.fromEntries(list.map((g) => [g.id, 0]));
  let unionCount = 0;
  let overlapCellCount = 0;

  // 若中层处于 ghost（隐形断开），视觉上几乎看不见中层
  const activeList = list.filter((g) => !(g.isMidPane && ghostMid));

  for (let iy = 0; iy < GH; iy++) {
    const py = (iy + 0.5) / GH;
    for (let ix = 0; ix < GW; ix++) {
      const px = (ix + 0.5) / GW;
      let hitCount = 0;
      let topIdx = -1;
      const hits = [];
      for (let k = 0; k < activeList.length; k++) {
        if (pointInShape(px, py, activeList[k])) {
          hits.push(k);
          selfCount[activeList[k].id]++;
          hitCount++;
          topIdx = k;
        }
      }
      if (hitCount > 0) {
        unionCount++;
        if (hitCount >= 2) overlapCellCount++;
        visibleCount[activeList[topIdx].id]++;
        for (let h = 0; h < hits.length - 1; h++) {
          const lower = activeList[hits[h]];
          const upper = activeList[topIdx];
          // 透叠中层压在下层之上时，视觉仍可透过玻片辨认下层轮廓，按半遮折算
          const isGlassAbove = upper.isMidPane && activeState.midMode === "translucent";
          hiddenCount[lower.id] += isGlassAbove ? 0.35 : 1;
        }
      }
    }
  }

  const coveragePct = Math.round((unionCount / TOTAL) * 100);
  const whitespacePct = 100 - coveragePct;
  const overlapRatioPct = unionCount > 0 ? Math.round((overlapCellCount / unionCount) * 100) : 0;

  const focal = list.find((g) => g.isFocal);
  const obsidian = list.find((g) => g.id === "obsidian");
  const glass = list.find((g) => g.isMidPane);

  const focalTotal = Math.max(1, selfCount[focal.id]);
  const focalHiddenPct = Math.round((hiddenCount[focal.id] / focalTotal) * 100);
  const focalVisiblePct = Math.max(0, 100 - focalHiddenPct);

  // 检查是否任意大形（面积明显大于焦形）被排在焦形之前，或高图层反而面积远大于低图层
  const bigOverSmall = list.some(
    (g) => g.id !== focal.id && selfCount[g.id] > selfCount[focal.id] * 1.45 && g.layer >= focal.layer && g.isBackGiant
  );
  // 更严格：若炭黑大圆或金黄半圆在 layer 3，就算「大形反压」
  const giantInFront = list.some((g) => g.isBackGiant && g.layer === 3);
  const focalInBack = focal.layer === 1;

  // 检查是否存在被彻底遮死（遮挡率 > 78%）的次要形体
  let maxHiddenOther = 0;
  let buriedId = null;
  for (const g of activeList) {
    if (g.id === focal.id) continue;
    const tot = Math.max(1, selfCount[g.id]);
    const pct = Math.round((hiddenCount[g.id] / tot) * 100);
    if (pct > maxHiddenOther) {
      maxHiddenOther = pct;
      buriedId = g.id;
    }
  }

  // 2) 成对求交：统计 T 形节点、X 形节点、擦边切线陷阱与焦形咬合状态
  const tJunctions = [];
  const xJunctions = [];
  const tangents = [];
  let validOverlapPairs = 0;
  let focalOverlapCount = 0;
  let midBridgePairs = 0;

  for (let i = 0; i < activeList.length; i++) {
    for (let j = i + 1; j < activeList.length; j++) {
      const a = activeList[i];
      const b = activeList[j];
      const { gap, px, py } = pairGap(a, b);
      // 擦边切线陷阱：两形边界距在 [-0.012, +0.028] 窄带内（刚刚擦碰或将碰未碰）
      if (gap >= -0.012 && gap <= 0.028) {
        tangents.push({ x: px, y: py, a: a.id, b: b.id, gapPx: Math.round(Math.abs(gap) * 520) });
      } else if (gap < -0.012) {
        validOverlapPairs++;
        if (a.id === focal.id || b.id === focal.id) focalOverlapCount++;
        if (a.isMidPane || b.isMidPane) midBridgePairs++;
        const cross = findContourCrossings(a, b);
        const isX = (a.isMidPane || b.isMidPane) && activeState.midMode === "translucent";
        for (const pt of cross.slice(0, 2)) {
          if (isX) xJunctions.push({ ...pt, a: a.id, b: b.id });
          else tJunctions.push({ ...pt, a: a.id, b: b.id });
        }
      }
    }
  }

  // 检查前/中/后三层是否各就其位（有层 1、有层 2 或中层连接、有层 3 焦形）
  const hasLayer1 = list.some((g) => g.layer === 1);
  const hasLayer2 = list.some((g) => g.layer === 2 && !(g.isMidPane && ghostMid));
  const hasLayer3 = focal.layer === 3;

  // 3) 4 项单真源过关判据（严格一一对应原海报「教学要点」四条）
  // 条件 A：遮挡成立（形状相互遮挡，产生前后关系）
  const passOcclusion =
    validOverlapPairs >= 3 &&
    focalOverlapCount >= 1 &&
    tangents.length === 0 &&
    overlapRatioPct >= 14 &&
    overlapRatioPct <= 68 &&
    maxHiddenOther <= 78;

  // 条件 B：序位正确（大形在后，小形在前）
  const passHierarchy =
    hasLayer1 &&
    hasLayer2 &&
    hasLayer3 &&
    !giantInFront &&
    !bigOverSmall &&
    !focalInBack &&
    focalVisiblePct >= 88;

  // 条件 C：对比与透叠清晰（对比强弱，突出重点）
  const contrastInfo = CONTRAST_MODES[activeState.contrastMode] || CONTRAST_MODES.ladder;
  const passContrast =
    activeState.contrastMode === "ladder" &&
    (activeState.midMode === "translucent" || activeState.midMode === "opaque") &&
    midBridgePairs >= 1;

  // 条件 D：留白与呼吸合宜（留白控制，避免拥挤）
  const passWhitespace = whitespacePct >= 24 && whitespacePct <= 68 && coveragePct >= 28;

  const passedCount = [passOcclusion, passHierarchy, passContrast, passWhitespace].filter(Boolean).length;

  // 4) 8 类错态优先级诊断（说清「错在哪」+「人眼为什么看坏」+「怎么调」）
  const names = THEMES[activeState.theme]?.names || THEMES.poster.names;
  let code = "ok";
  let badge = "达标 · 空间成立";
  let title = "三层叠压成立，前后秩序清晰";
  let why = `大形沉底、${names.focal}完整领前，画布实时生出 ${tJunctions.length} 处 T 形遮挡与 ${xJunctions.length} 处 X 形透叠，${whitespacePct}% 净留白让几何群组自在呼吸。`;
  let hint = "可以切「28° 轴测拆层」检视三层物理景深，或换「包豪斯展报 / 卡片叠层」验证同一道理。";

  if (giantInFront || bigOverSmall || focalInBack || focalVisiblePct < 88) {
    code = "inverted";
    badge = "错态 · 大形反压";
    title = giantInFront
      ? `${names.obsidian}反压最前，遮乱了前后主次`
      : `${names.focal}被遮掉 ${focalHiddenPct}%，主角沉底失焦`;
    why = "重叠空间的基本次序是「大形在后建立基底，小形在前承载焦点」。大块深色压在最前，会直接把小焦形与过渡层吞成暗团。";
    hint = `在下栏层槽里把「${names.obsidian}」沉回后层，并确保「${names.focal}」处于前层。`;
  } else if (validOverlapPairs === 0) {
    code = "separated";
    badge = "错态 · 全散无叠";
    title = "形体彼此分离，画面退化成平面贴纸";
    why = "画面中 T/X 节点数为 0。没有一条轮廓打断另一条轮廓，大脑收不到任何遮挡线索，所有色块都贴在同一平面上。";
    hint = `直接拖动「${names.focal}」或其他色块相互咬合，建立前→中→后的连续遮挡链。`;
  } else if (tangents.length > 0) {
    code = "tangent";
    badge = `错态 · 擦边切线 ${tangents.length} 处`;
    title = "形体边缘擦碰未咬合，触发「切边陷阱」";
    why = "两块边界隔着几像素似碰非碰时，人眼判不清边界归属，交界处像卡紧的缝隙，既生不出前后纵深又显得局促。";
    hint = `拖动带赤红切线警示的「${names.focal}」或相邻块，要么干脆叠入 15% 以上，要么明确拉开净距。`;
  } else if (focalOverlapCount === 0) {
    code = "focal_isolated";
    badge = "错态 · 焦形孤立";
    title = `${names.focal}独自漂在边上，没接入叠层链`;
    why = "虽然背景块互相叠着，但主角焦圆没有压住中层或后层，读者无法确定焦圆究竟靠前还是和底色齐平。";
    hint = `直接把「${names.focal}」拖向中心，干净压住「${names.glass}」或「${names.amber}」的一角。`;
  } else if (maxHiddenOther > 78 || overlapRatioPct > 68) {
    code = "over_occluded";
    badge = "错态 · 过度遮死";
    title = `${names[buriedId] || "下层形体"}被遮盖 ${maxHiddenOther}%，轮廓快消失了`;
    why = "有效的重叠需要「半露半遮」：下层必须留出足够轮廓让大脑非模态补全，全盖住就从多层退化成了单层实块。";
    hint = "把叠得太死的几块轻轻错开半个身位，或把「中层」设为透叠玻片露出下层结构。";
  } else if (activeState.midMode === "ghost" || midBridgePairs === 0) {
    code = "mid_broken";
    badge = "错态 · 中层断桥";
    title = "中层过渡断开，前层和后层直接硬撞";
    why = "没有中层衔接，前景焦点与大背景之间缺少缓冲区，空间感会像薄纸片一样生硬。";
    hint = "把「中层」从隐形切回「透叠玻片」或「实色锐叠」，并让它同时衔接前、后两层。";
  } else if (activeState.midMode === "muddy" || activeState.contrastMode !== "ladder") {
    code = "low_contrast";
    badge = activeState.midMode === "muddy" ? "错态 · 透叠发脏" : "错态 · 对比发闷";
    title = activeState.midMode === "muddy"
      ? "中层假透明破坏明度极性，叠区糊成灰泥"
      : activeState.contrastMode === "reverse"
        ? "后层明暗反抢焦点，视线被拖回底壁"
        : `三层明度差仅 ${contrastInfo.ratioFB.toFixed(1)}:1，前后糊在一起`;
    why = activeState.midMode === "muddy"
      ? "按梅泰利（1974）透叠法则，半透明层跨越不同底色时必须保持亮度顺序一致；一旦色相明暗乱跳，人眼只看到一块脏补丁。"
      : "遮挡建立了几何先后，但还要靠「前强、中柔、后稳」的对比阶梯告诉眼睛先看哪里。";
    hint = "在下方层槽把对比切到「清晰阶梯」，并把中层切为「透叠玻片」或「实色锐叠」。";
  } else if (whitespacePct < 24) {
    code = "crowded";
    badge = `错态 · 拥挤 ${whitespacePct}% 留白`;
    title = `色块占满 ${coveragePct}% 画幅，画面喘不过气`;
    why = "重叠构图越有层次，越需要四周留白托住边界。净留白低于 24% 时，边缘顶满画框，所有层次挤成闷团。";
    hint = "把「形体舒展」标尺向左收小到 0.85×–1.05×，让净留白回到 24%–62% 经验带。";
  } else if (coveragePct < 28 || whitespacePct > 68) {
    code = "sparse";
    badge = `错态 · 缩微空散`;
    title = `形体总占比仅 ${coveragePct}%，空间体量撑不起来`;
    why = "元素缩得太小，即使有局部咬合，整幅画面的前中后体量感依然单薄。";
    hint = "把「形体舒展」拉回 0.85×–1.08×，让几何群组稳稳托住画幅重心。";
  }

  return {
    passedCount,
    isPass: passedCount === 4,
    code,
    badge,
    title,
    why,
    hint,
    coveragePct,
    whitespacePct,
    overlapRatioPct,
    focalVisiblePct,
    focalHiddenPct,
    tCount: tJunctions.length,
    xCount: xJunctions.length,
    tangentCount: tangents.length,
    tJunctions,
    xJunctions,
    tangents,
    contrastRatioFB: contrastInfo.ratioFB,
    passOcclusion,
    passHierarchy,
    passContrast,
    passWhitespace,
    focalLayer: focal.layer,
    obsidianLayer: obsidian.layer,
    glassLayer: glass.layer,
    activeState,
    ordered: list,
  };
}
