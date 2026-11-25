// 159 浮动块版式 · 单真源几何与力学模型
// 所有读数、重叠率、净留白、Z 轴高程、视线交叉与五要点状态均从实绘旋转多边形坐标统一算出。

export const PALETTE = {
  paper: "#F8FAFE",
  white: "#FFFFFF",
  mist: "#F0EFFC",
  lilacCard: "#EEEDFD",
  lavender: "#D2CBFB",
  lavenderSoft: "#D9D5FA",
  lavenderMid: "#BFB5F2",
  indigoDeep: "#2B338D",
  indigoTitle: "#353B90",
  indigoBleed: "#4844B3",
  violetBadge: "#5A4CC7",
  violetMid: "#685DCD",
  indigoDarkroom: "#1A1F59",
  indigoInk: "#1D2148",
  mutedInk: "#484D78",
  lime: "#DCEC80",
  limeBright: "#DEEF73",
  limeInk: "#3B4D00",
  danger: "#B81D33",
  dangerSoft: "#FDECEF",
  ok: "#0F6A5F",
  okSoft: "#E6F7F4",
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 浮动四卡",
    shortLabel: "原海报四卡",
    cards: [
      {
        id: "hero",
        order: 1,
        role: "主焦",
        badge: "主焦卡",
        style: "indigo",
        title: "灵活的浮动结构，",
        title2: "让版面更具生命力。",
        body: "以高对比深靛色面确立第一落点",
        baseW: 0.305,
        baseH: 0.405,
        textBox: { x0: -0.44, y0: -0.42, x1: 0.36, y1: 0.04 },
      },
      {
        id: "quote",
        order: 2,
        role: "引言",
        badge: "引言白卡",
        style: "quote",
        title: "设计的价值在于",
        title2: "让信息自由呼吸。",
        body: "留白不是空白，而是内容的延伸空间。",
        baseW: 0.325,
        baseH: 0.315,
        textBox: { x0: -0.44, y0: -0.34, x1: 0.24, y1: 0.34 },
      },
      {
        id: "power",
        order: 3,
        role: "要点",
        badge: "淡紫要点卡",
        style: "lilac",
        title: "浮动的力量",
        title2: "",
        items: [
          { t: "自由布局", d: "不受固定框架限制" },
          { t: "引导视线", d: "用位置与留白成路径" },
          { t: "提升体验", d: "增强层次更易记住" },
        ],
        baseW: 0.265,
        baseH: 0.42,
        textBox: { x0: -0.42, y0: -0.42, x1: 0.42, y1: 0.42 },
      },
      {
        id: "less",
        order: 4,
        role: "结语",
        badge: "几何结语卡",
        style: "geo",
        title: "少即是多，",
        title2: "浮动创造可能。",
        body: "当内容不再被框定，设计便有了呼吸。",
        baseW: 0.41,
        baseH: 0.265,
        textBox: { x0: -0.45, y0: -0.38, x1: 0.14, y1: 0.38 },
      },
    ],
  },
  journal: {
    id: "journal",
    label: "建筑季刊 · 跨页画册",
    shortLabel: "建筑季刊",
    cards: [
      {
        id: "hero",
        order: 1,
        role: "主焦",
        badge: "策展主卡",
        style: "indigo",
        title: "光影悬停于白墙，",
        title2: "空间因此产生停顿。",
        body: "2026 春季建筑与纸面空间特展",
        baseW: 0.305,
        baseH: 0.405,
        textBox: { x0: -0.44, y0: -0.42, x1: 0.36, y1: 0.04 },
      },
      {
        id: "quote",
        order: 2,
        role: "引言",
        badge: "策展人语",
        style: "quote",
        title: "真正让建筑轻盈的，",
        title2: "是构件之间的缝隙。",
        body: "把墙体拆成浮片，风与目光才有通道。",
        baseW: 0.325,
        baseH: 0.315,
        textBox: { x0: -0.44, y0: -0.34, x1: 0.24, y1: 0.34 },
      },
      {
        id: "power",
        order: 3,
        role: "要点",
        badge: "展区导览",
        style: "lilac",
        title: "三幕漫游",
        title2: "",
        items: [
          { t: "01 悬廊", d: "入口大尺度留白场" },
          { t: "02 叠层", d: "轻隔断与斜向视线" },
          { t: "03 天光", d: "柔和漫射与地面影" },
        ],
        baseW: 0.265,
        baseH: 0.42,
        textBox: { x0: -0.42, y0: -0.42, x1: 0.42, y1: 0.42 },
      },
      {
        id: "less",
        order: 4,
        role: "结语",
        badge: "展期注脚",
        style: "geo",
        title: "慢下来看，",
        title2: "留白自会开口。",
        body: "东馆二层中庭 · 04.12 — 07.28",
        baseW: 0.41,
        baseH: 0.265,
        textBox: { x0: -0.45, y0: -0.38, x1: 0.14, y1: 0.38 },
      },
    ],
  },
  launch: {
    id: "launch",
    label: "新品发布 · 官网首屏",
    shortLabel: "新品首屏",
    cards: [
      {
        id: "hero",
        order: 1,
        role: "主焦",
        badge: "核心卖点",
        style: "indigo",
        title: "轻至 118 克，",
        title2: "一整周无需补电。",
        body: "AirNote S4 墨水屏随身记事本",
        baseW: 0.305,
        baseH: 0.405,
        textBox: { x0: -0.44, y0: -0.42, x1: 0.36, y1: 0.04 },
      },
      {
        id: "quote",
        order: 2,
        role: "引言",
        badge: "媒体摘评",
        style: "quote",
        title: "翻开它的一刻，",
        title2: "干扰被留在屏幕外。",
        body: "零弹窗界面，回到纸张本身的安静。",
        baseW: 0.325,
        baseH: 0.315,
        textBox: { x0: -0.44, y0: -0.34, x1: 0.24, y1: 0.34 },
      },
      {
        id: "power",
        order: 3,
        role: "要点",
        badge: "核心规格",
        style: "lilac",
        title: "三大升级",
        title2: "",
        items: [
          { t: "300 PPI", d: "微蚀刻防眩类纸屏" },
          { t: "4096 压感", d: "零延迟磁吸手写笔" },
          { t: "离线同步", d: "本地加密一键导出" },
        ],
        baseW: 0.265,
        baseH: 0.42,
        textBox: { x0: -0.42, y0: -0.42, x1: 0.42, y1: 0.42 },
      },
      {
        id: "less",
        order: 4,
        role: "结语",
        badge: "首发权益",
        style: "geo",
        title: "少一点推送，",
        title2: "多一点专注。",
        body: "今晚 20:00 开放预售 · 三款纸感配色",
        baseW: 0.41,
        baseH: 0.265,
        textBox: { x0: -0.45, y0: -0.38, x1: 0.14, y1: 0.38 },
      },
    ],
  },
};

// 预设方案：包含开场 0/4 错态、三组合法解、以及两类典型试错态
export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    elevationGain: 0.06,
    cards: {
      hero: { u: 0.36, v: 0.44, deg: -15, z: 0 },
      quote: { u: 0.60, v: 0.58, deg: 18, z: 2 },
      power: { u: 0.49, v: 0.39, deg: -14, z: 3 },
      less: { u: 0.47, v: 0.67, deg: 14, z: 1 },
    },
  },
  classic: {
    id: "classic",
    label: "原海报经典解",
    elevationGain: 0.56,
    cards: {
      hero: { u: 0.25, v: 0.41, deg: -4, z: 3 },
      quote: { u: 0.63, v: 0.23, deg: 3, z: 2 },
      power: { u: 0.80, v: 0.65, deg: 4.5, z: 1 },
      less: { u: 0.41, v: 0.79, deg: 3, z: 2 },
    },
  },
  overlap: {
    id: "overlap",
    label: "轻叠画册解",
    elevationGain: 0.64,
    cards: {
      hero: { u: 0.29, v: 0.41, deg: -3, z: 3 },
      quote: { u: 0.63, v: 0.24, deg: 2.5, z: 2 },
      power: { u: 0.72, v: 0.64, deg: 3, z: 1 },
      less: { u: 0.42, v: 0.77, deg: -2, z: 2 },
    },
  },
  flatzero: {
    id: "flatzero",
    label: "0° 水平错落解",
    elevationGain: 0.58,
    cards: {
      hero: { u: 0.24, v: 0.39, deg: 0, z: 3 },
      quote: { u: 0.66, v: 0.23, deg: 0, z: 2 },
      power: { u: 0.80, v: 0.66, deg: 0, z: 1 },
      less: { u: 0.41, v: 0.79, deg: 0, z: 2 },
    },
  },
  tryGrid: {
    id: "tryGrid",
    label: "试错：锁回死格",
    elevationGain: 0.04,
    cards: {
      hero: { u: 0.26, v: 0.27, deg: 0, z: 1 },
      quote: { u: 0.74, v: 0.27, deg: 0, z: 1 },
      power: { u: 0.26, v: 0.73, deg: 0, z: 1 },
      less: { u: 0.74, v: 0.73, deg: 0, z: 1 },
    },
  },
  tryMuddy: {
    id: "tryMuddy",
    label: "试错：黑脏重影",
    elevationGain: 0.96,
    cards: {
      hero: { u: 0.25, v: 0.41, deg: -4, z: 3 },
      quote: { u: 0.63, v: 0.23, deg: 3, z: 2 },
      power: { u: 0.80, v: 0.65, deg: 4.5, z: 1 },
      less: { u: 0.41, v: 0.79, deg: 3, z: 2 },
    },
  },
};

export const Z_TIER_DP = [1, 5, 11, 20]; // L0..L3 基准高程 dp（参考 Material Design 0–24dp 尺度）

export function clonePreset(presetId = "broken") {
  const p = PRESETS[presetId] || PRESETS.broken;
  const cards = {};
  for (const [k, v] of Object.entries(p.cards)) cards[k] = { ...v };
  return {
    theme: "poster",
    selectedId: "power",
    elevationGain: p.elevationGain,
    showGrid: false,
    showSightline: true,
    cards,
  };
}

// 统一计算每个卡片在指定画布尺寸 (W, H) 下的真实像素几何
export function computeCardRects(state, W, H) {
  const theme = THEMES[state.theme] || THEMES.poster;
  // 统一标尺，保证在不同画幅下卡片保持正比例、绝不被压扁拉长
  const unit = Math.min(W * 0.84, H * 1.22);
  const padX = Math.max(18, W * 0.045);
  const padY = Math.max(16, H * 0.045);
  const usableW = Math.max(120, W - padX * 2);
  const usableH = Math.max(120, H - padY * 2);

  return theme.cards.map((meta) => {
    const c = state.cards[meta.id];
    const w = meta.baseW * unit;
    const h = meta.baseH * unit;
    const cx = padX + c.u * usableW;
    const cy = padY + c.v * usableH;
    const rad = (c.deg * Math.PI) / 180;
    const poly = rotatedRectPoly(cx, cy, w, h, rad);
    const tb = meta.textBox;
    const textPoly = rotatedRectPoly(
      cx + ((tb.x0 + tb.x1) * 0.5) * w * Math.cos(rad) - ((tb.y0 + tb.y1) * 0.5) * h * Math.sin(rad),
      cy + ((tb.x0 + tb.x1) * 0.5) * w * Math.sin(rad) + ((tb.y0 + tb.y1) * 0.5) * h * Math.cos(rad),
      (tb.x1 - tb.x0) * w,
      (tb.y1 - tb.y0) * h,
      rad
    );
    const dp = computeEffectiveDp(c.z, state.elevationGain);
    return {
      ...meta,
      u: c.u,
      v: c.v,
      deg: c.deg,
      z: c.z,
      dp,
      cx,
      cy,
      w,
      h,
      rad,
      area: w * h,
      poly,
      textPoly,
    };
  });
}

export function computeEffectiveDp(zTier, elevationGain) {
  const base = Z_TIER_DP[Math.max(0, Math.min(3, Math.round(zTier)))];
  // 当 elevationGain 趋近 0 时所有卡被压回 0~1dp 平面；0.56 为清晰 3 级分层；>0.85 为过度夸大重影
  const scale = 0.08 + elevationGain * 1.55;
  return +(base * scale).toFixed(1);
}

export function rotatedRectPoly(cx, cy, w, h, rad) {
  const hw = w / 2;
  const hh = h / 2;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pts = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];
  return pts.map(([lx, ly]) => ({
    x: cx + lx * cos - ly * sin,
    y: cy + lx * sin + ly * cos,
  }));
}

// Sutherland-Hodgman 凸多边形裁剪：精确求两个旋转矩形的交集多边形与面积
export function clipConvexPolygon(subject, clip) {
  let output = subject;
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    if (!input.length) break;
    const isInside = (p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0;
    const intersect = (p1, p2) => {
      const dx1 = p2.x - p1.x;
      const dy1 = p2.y - p1.y;
      const dx2 = b.x - a.x;
      const dy2 = b.y - a.y;
      const denom = dx1 * dy2 - dy1 * dx2;
      if (Math.abs(denom) < 1e-8) return p2;
      const t = ((a.x - p1.x) * dy2 - (a.y - p1.y) * dx2) / denom;
      return { x: p1.x + t * dx1, y: p1.y + t * dy1 };
    };
    let s = input[input.length - 1];
    for (const e of input) {
      if (isInside(e)) {
        if (!isInside(s)) output.push(intersect(s, e));
        output.push(e);
      } else if (isInside(s)) {
        output.push(intersect(s, e));
      }
      s = e;
    }
  }
  return output;
}

export function polygonArea(poly) {
  if (!poly || poly.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return Math.abs(sum) * 0.5;
}

export function pointInConvexPoly(px, py, poly) {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x) < 0) return false;
  }
  return true;
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// 计算四张卡并集覆盖率（采样 24x16 规则点阵，快且稳定）
function estimateUnionCoverage(rects, W, H) {
  const cols = 24;
  const rows = 16;
  let inside = 0;
  for (let r = 0; r < rows; r++) {
    const py = ((r + 0.5) / rows) * H;
    for (let c = 0; c < cols; c++) {
      const px = ((c + 0.5) / cols) * W;
      for (const rect of rects) {
        if (pointInConvexPoly(px, py, rect.poly)) {
          inside++;
          break;
        }
      }
    }
  }
  return inside / (cols * rows);
}

// 综合评测：从真实几何导出 8 类错态、4 项核心通关条件与 5 个原海报要点实况
export function evaluateLayout(state, W = 820, H = 480) {
  const rects = computeCardRects(state, W, H);
  const byId = Object.fromEntries(rects.map((r) => [r.id, r]));

  // 1. 两两精确旋转多边形重叠与遮字检测
  const overlaps = [];
  let maxOverlapRatio = 0;
  let maxTextOcclude = 0;
  let worstOverlap = null;

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const inter = clipConvexPolygon(a.poly, b.poly);
      const area = polygonArea(inter);
      if (area > 4) {
        const ratio = area / Math.min(a.area, b.area);
        // 判定谁在下方（z 更小者，z 相同则先渲染者在下）
        const lower = a.z < b.z ? a : b.z < a.z ? b : a.order > b.order ? a : b;
        const upper = lower === a ? b : a;
        const textInter = clipConvexPolygon(lower.textPoly, upper.poly);
        const textRatio = polygonArea(textInter) / Math.max(1, polygonArea(lower.textPoly));
        const item = {
          a: upper,
          b: lower,
          poly: inter,
          area,
          ratio,
          textRatio,
          cx: inter.reduce((s, p) => s + p.x, 0) / inter.length,
          cy: inter.reduce((s, p) => s + p.y, 0) / inter.length,
          heavy: ratio > 0.16 || textRatio > 0.12,
        };
        overlaps.push(item);
        if (ratio > maxOverlapRatio) maxOverlapRatio = ratio;
        if (textRatio > maxTextOcclude) maxTextOcclude = textRatio;
        if (!worstOverlap || item.textRatio * 1.4 + item.ratio > worstOverlap.textRatio * 1.4 + worstOverlap.ratio) {
          worstOverlap = item;
        }
      }
    }
  }

  // 2. 倾角幅度检查
  let maxAbsDeg = 0;
  let wildestCard = rects[0];
  let sumAbsDeg = 0;
  for (const r of rects) {
    const ad = Math.abs(r.deg);
    sumAbsDeg += ad;
    if (ad > maxAbsDeg) {
      maxAbsDeg = ad;
      wildestCard = r;
    }
  }

  // 3. Z 轴高程分层与主焦主导权
  const dps = rects.map((r) => r.dp);
  const maxDp = Math.max(...dps);
  const minDp = Math.min(...dps);
  const dpSpan = +(maxDp - minDp).toFixed(1);
  const hero = byId.hero;
  const maxOtherZ = Math.max(...rects.filter((r) => r.id !== "hero").map((r) => r.z));
  const heroOnTop = hero.z > maxOtherZ;
  const muddyShadow = state.elevationGain > 0.86;
  const flatShadow = dpSpan < 5.5 || state.elevationGain < 0.22;

  // 4. 留白呼吸率、出界与孤岛检测
  const coverage = estimateUnionCoverage(rects, W, H);
  const whitespacePct = Math.round((1 - coverage) * 100);
  let outOfBounds = false;
  for (const r of rects) {
    for (const p of r.poly) {
      if (p.x < 4 || p.x > W - 4 || p.y < 4 || p.y > H - 4) outOfBounds = true;
    }
  }

  // 最近邻间距，判断是否散成孤岛
  const diag = Math.hypot(W, H);
  let maxMinGap = 0;
  for (let i = 0; i < rects.length; i++) {
    let minD = Infinity;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      const dx = Math.abs(rects[i].cx - rects[j].cx) - (rects[i].w + rects[j].w) * 0.42;
      const dy = Math.abs(rects[i].cy - rects[j].cy) - (rects[i].h + rects[j].h) * 0.42;
      const gap = Math.hypot(Math.max(0, dx), Math.max(0, dy));
      if (gap < minD) minD = gap;
    }
    if (minD > maxMinGap) maxMinGap = minD;
  }
  const isolatedDrift = maxMinGap > diag * 0.165;

  // 5. 死板 2x2 网格刚性检测
  const us = rects.map((r) => r.u).sort((a, b) => a - b);
  const vs = rects.map((r) => r.v).sort((a, b) => a - b);
  const colAligned = Math.abs(us[1] - us[0]) < 0.06 && Math.abs(us[3] - us[2]) < 0.06;
  const rowAligned = Math.abs(vs[1] - vs[0]) < 0.06 && Math.abs(vs[3] - vs[2]) < 0.06;
  const deadGrid = colAligned && rowAligned && maxAbsDeg < 1.5 && dpSpan < 5.5;

  // 6. 视线顺序路径（按 1 主焦 → 2 引言 → 3 要点 → 4 结语）交叉检测
  const pathPts = [byId.hero, byId.quote, byId.power, byId.less].map((r) => ({ x: r.cx, y: r.cy, id: r.id }));
  const sightlineCross = segmentsIntersect(pathPts[0], pathPts[1], pathPts[2], pathPts[3]);

  // 7. 四项核心通关维度
  const checks = {
    noCollision: !overlaps.some((o) => o.heavy),
    cleanAngle: maxAbsDeg <= 9 && !deadGrid,
    clearDepth: heroOnTop && !flatShadow && !muddyShadow,
    breathingFlow: whitespacePct >= 34 && whitespacePct <= 76 && !isolatedDrift && !sightlineCross && !outOfBounds,
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 8. 诊断优先级（主病灶最先报，说明「为什么」+「怎么调」）
  const issues = [];
  if (deadGrid) {
    issues.push({
      code: "dead-grid",
      tag: "错态 · 锁回死格",
      headline: "四张卡排回齐平 2×2 死格，浮动感完全消失",
      body: `现在行对齐、列对齐、倾角 0° 且高程差仅 ${dpSpan}dp。这已经退回到严谨的区块网格，眼睛只看到机械对齐，感受不到「浮在版面中」的松弛与节奏。`,
      next: "拖开任意两张卡错开行列对齐，再把下方 Z 轴浮升强度右拖到 45%–70%，并把深靛主焦卡提至 L3。",
    });
  }
  if (!checks.noCollision && worstOverlap) {
    const pct = Math.round(Math.max(worstOverlap.ratio, worstOverlap.textRatio) * 100);
    issues.push({
      code: "heavy-overlap",
      tag: `错态 · 盖字撞车 ${pct}%`,
      headline: `「${worstOverlap.a.badge}」重压在「${worstOverlap.b.badge}」上，遮住正文`,
      body: `实测两卡交叠达 ${Math.round(worstOverlap.ratio * 100)}%（正文区被盖 ${Math.round(worstOverlap.textRatio * 100)}%）。浮动版式允许边角 2%–12% 轻触制造前后纵深，但一旦压住下层字行，读者立刻卡壳。`,
      next: `直接在画布上把「${worstOverlap.a.badge}」向空白处拖开（或点画布红签一键避让）。`,
    });
  }
  if (maxAbsDeg > 9) {
    issues.push({
      code: "wild-tilt",
      tag: `错态 · 倾角过斜 ${Math.abs(Math.round(wildestCard.deg))}°`,
      headline: `「${wildestCard.badge}」倾角甩到 ${wildestCard.deg > 0 ? "+" : ""}${Math.round(wildestCard.deg)}°，版面像桌面散纸`,
      body: `经验安全带在 ±8° 以内（甚至 0° 纯靠错位也能浮起）。超过 9° 后眼睛必须歪头追踪文字基线，节奏感滑落成随意乱扔的便利贴。`,
      next: `选中「${wildestCard.badge}」，拖动角部旋转柄或点选下方倾角把倾斜收回 -6° 到 +6° 之间（或 0°）。`,
    });
  }
  if (muddyShadow) {
    issues.push({
      code: "muddy-shadow",
      tag: "错态 · 黑脏重影",
      headline: `浮升投影开到 ${Math.round(state.elevationGain * 100)}%，底影糊成一团脏雾`,
      body: `当前最高投影已拉到 ${maxDp}dp 且浓度过高，柔和的「悬停空气感」变成了发脏的黑框。优秀的浮动阴影应当轻薄、带底色冷暖倾向，远看几乎不察觉，去掉才觉得扁。`,
      next: "向左拖动下方「Z 轴浮升剖面槽」，把浮升强度回收到 45%–75% 的清透区间。",
    });
  }
  if (!heroOnTop || flatShadow) {
    issues.push({
      code: "hero-buried",
      tag: !heroOnTop ? "错态 · 主焦被压" : "错态 · 层次平权",
      headline: !heroOnTop
        ? `深靛「${hero.badge}」落在了次级卡下方，第一视觉落点丢了`
        : `四卡高程差仅 ${dpSpan}dp，像平贴在桌面上的贴纸`,
      body: !heroOnTop
        ? `深靛主焦卡目前位于 L${hero.z}，反而低于次要卡的 L${maxOtherZ}。视觉重心和空间高度打架，读者一眼分不清先读哪块。`
        : `四张卡片几乎贴在同一高度，没有近大远小与影深差，也就谈不上「通过叠加与阴影构建深度」。`,
      next: !heroOnTop
        ? "点选深靛主焦卡并点「提至 L3 最高层」，同时拉开各卡的 Z 层级。"
        : "向右拖动下方「Z 轴浮升剖面槽」，把高程跨度拉开到 8dp 以上。",
    });
  }
  if (sightlineCross) {
    issues.push({
      code: "sightline-knot",
      tag: "错态 · 视线打结",
      headline: "视线路径 1 → 2 → 3 → 4 在画布中部交叉回折",
      body: "主焦卡、引言卡、要点卡与结语卡的先后顺位在空间上互相打叉，目光读完前两块后必须折返跨越刚才扫过的区域，破坏了流动感。",
      next: "把「淡紫要点卡」与「几何结语卡」顺着对角流向摆开，解开柠檬黄路径线的交叉。",
    });
  }
  if (isolatedDrift) {
    issues.push({
      code: "isolated-drift",
      tag: "错态 · 孤岛失联",
      headline: "卡片被甩向边缘角落，中间空出一口断联死坑",
      body: "留白应该像连接群岛的溪流，而不是把每块内容推成各自孤立的荒岛。块间跨距太大时，格式塔接近性失效，读者以为它们互不相关。",
      next: "把偏离最远的卡片向画布内侧收回一点，让四张卡之间形成连贯的呼吸走廊。",
    });
  }
  if (whitespacePct < 34 || outOfBounds) {
    issues.push({
      code: "cramped-space",
      tag: outOfBounds ? "错态 · 裁边出界" : `错态 · 留白仅 ${whitespacePct}%`,
      headline: outOfBounds ? "有卡片滑出安全边沿，版面显得局促截断" : `净留白被压到 ${whitespacePct}%，版面喘不过气`,
      body: "浮动块成立的前提是充足的负空间（经验带 36%–62%）。一旦塞得过满或撞到边沿，视觉弹性立刻消失。",
      next: "把贴边卡片向内轻移，让四边留出均匀呼吸感。",
    });
  }

  let primaryDiag;
  if (issues.length === 0) {
    const hasZeroTilt = maxAbsDeg < 0.8;
    const hasLightKiss = overlaps.some((o) => o.ratio >= 0.02 && o.ratio <= 0.16);
    const modeName = hasZeroTilt
      ? "0° 水平错落浮升解"
      : hasLightKiss
        ? "轻叠错落画册解"
        : "舒展对角呼吸解";
    primaryDiag = {
      ok: true,
      code: "pass",
      tag: `通畅 · ${modeName} (4/4)`,
      headline: `四块错落浮起、主次分明，净留白 ${whitespacePct}% 呼吸舒展`,
      body: hasZeroTilt
        ? `哪怕 0° 零倾角，单靠打破网格对齐 + ${dpSpan}dp 高程分层 + ${whitespacePct}% 留白通道，依然能稳稳做出清透高级的浮动版式。`
        : hasLightKiss
          ? `深靛主焦以 ${hero.dp}dp 居首，边角 ${Math.round(maxOverlapRatio * 100)}% 轻触不盖正文，视线沿 1→2→3→4 无折返滑过。`
          : `最大倾角克制在 ${Math.round(maxAbsDeg)}°，高程跨度 ${dpSpan}dp 拉开前后层次，柠檬黄视线路径顺畅流过四块内容。`,
      next: "试试切换上方「建筑季刊 / 新品首屏」题材，或故意把卡片拖进撞车、死格，对比呼吸感怎样瞬间塌掉。",
    };
  } else {
    primaryDiag = { ok: false, ...issues[0] };
  }

  // 9. 原海报 5 项要点实时状态
  const pillars = [
    {
      id: "floating",
      ok: !deadGrid && !outOfBounds,
      status: deadGrid ? "锁回死格" : outOfBounds ? "贴边裁切" : maxAbsDeg < 0.8 ? "0° 错落" : "自由分布",
    },
    {
      id: "spacing",
      ok: whitespacePct >= 34 && whitespacePct <= 76 && !isolatedDrift,
      status: isolatedDrift
        ? "孤岛失联"
        : whitespacePct < 34
          ? `窒息 ${whitespacePct}%`
          : whitespacePct > 76
            ? "堆挤失衡"
            : `净白 ${whitespacePct}%`,
    },
    {
      id: "depth",
      ok: !flatShadow && !muddyShadow && checks.noCollision,
      status: muddyShadow ? "重影发脏" : !checks.noCollision ? `遮挡 ${Math.round(maxOverlapRatio * 100)}%` : flatShadow ? `平贴 ${dpSpan}dp` : `跨度 ${dpSpan}dp`,
    },
    {
      id: "movement",
      ok: !sightlineCross && maxAbsDeg <= 9 && !deadGrid,
      status: sightlineCross ? "路径打结" : maxAbsDeg > 9 ? `过斜 ${Math.round(maxAbsDeg)}°` : deadGrid ? "静态僵直" : "流动顺畅",
    },
    {
      id: "emphasis",
      ok: heroOnTop && !flatShadow,
      status: !heroOnTop ? "主焦被压" : flatShadow ? "全员平权" : `主焦 ${hero.dp}dp`,
    },
  ];

  // 自示范大标「浮·动·块·版·式」实时浮动参数（供 DOM 读取）
  const titleFloatMode = deadGrid
    ? "grid"
    : maxAbsDeg > 9 || !checks.noCollision
      ? "chaos"
      : "balanced";

  return {
    rects,
    overlaps,
    worstOverlap,
    maxOverlapPct: Math.round(maxOverlapRatio * 100),
    maxTextOccludePct: Math.round(maxTextOcclude * 100),
    maxAbsDeg: +maxAbsDeg.toFixed(1),
    wildestCard,
    dpSpan,
    maxDp,
    minDp,
    whitespacePct,
    heroOnTop,
    flatShadow,
    muddyShadow,
    deadGrid,
    isolatedDrift,
    sightlineCross,
    pathPts,
    checks,
    passCount,
    issues,
    primaryDiag,
    pillars,
    titleFloatMode,
  };
}
