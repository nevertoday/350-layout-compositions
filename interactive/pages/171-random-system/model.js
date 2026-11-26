// 171 随机系统 RANDOM SYSTEM — 单真源几何、概率分布与 OBB 碰撞核验引擎
// 所有画布绘制、4 项原海报特征状态、边际分布曲线与单真源诊断均直接读取 computeLayout() 与 evaluateLayout() 的输出。

export const PALETTE = {
  paper: "#F4F1E9",
  card: "#FDFBF9",
  ink: "#0B0C0E",
  inkMuted: "#42464D",
  line: "#C9C3B4",
  lime: "#B5D717",
  limeSticky: "#BFDC1C",
  limeSafeText: "#4A5E00",
  cobalt: "#163BEE",
  cobaltText: "#1234CC",
  cobaltTape: "rgba(111, 129, 230, 0.72)",
  red: "#ED3B21",
  redText: "#C42A14",
  redTape: "rgba(230, 103, 84, 0.74)",
  darkBg: "#111318",
  darkCard: "#1A1D24",
  ok: "#157347",
};

export const BRIEFS = {
  poster: {
    id: "poster",
    label: "原海报实验",
    en: "POSTER 171",
    slips: [
      { id: "d1", role: "hero", kind: "glyph", text: "随", sub: "CHANCE", w: 0.145, h: 0.215, accent: "ink", bg: "none" },
      { id: "d2", role: "hero", kind: "glyph", text: "机", sub: "SYSTEM", w: 0.145, h: 0.215, accent: "cobalt", bg: "none" },
      { id: "s1", role: "card", kind: "card", text: "偶发 · CHANCE", sub: "单次落点不可测", w: 0.215, h: 0.125, accent: "lime", bg: "card", tape: "cobalt" },
      { id: "s2", role: "card", kind: "sticky", text: "变化 · VARIATION", sub: "条件改则形态变", w: 0.22, h: 0.13, accent: "ink", bg: "lime", tape: "none" },
      { id: "s3", role: "card", kind: "card", text: "动势 · MOTION", sub: "扰动中形成演化", w: 0.21, h: 0.125, accent: "red", bg: "card", tape: "red" },
      { id: "c1", role: "chip", kind: "pill", text: "不规则 IRREGULAR", sub: "", w: 0.18, h: 0.068, accent: "ink", bg: "ink" },
      { id: "c2", role: "chip", kind: "tag", text: "关注分布而非单点", sub: "", w: 0.185, h: 0.066, accent: "cobalt", bg: "outline" },
      { id: "c3", role: "chip", kind: "tag", text: "适度随机 ≠ 混乱", sub: "", w: 0.175, h: 0.066, accent: "red", bg: "outline" },
      { id: "c4", role: "chip", kind: "tag", text: "统计规律包络", sub: "", w: 0.15, h: 0.064, accent: "lime", bg: "tintLime" },
      { id: "c5", role: "chip", kind: "tag", text: "LAB NO.171", sub: "", w: 0.13, h: 0.062, accent: "ink", bg: "card" },
    ],
  },
  festival: {
    id: "festival",
    label: "声音节海报",
    en: "SOUND FEST",
    slips: [
      { id: "d1", role: "hero", kind: "glyph", text: "声", sub: "WAVE", w: 0.145, h: 0.215, accent: "ink", bg: "none" },
      { id: "d2", role: "hero", kind: "glyph", text: "浪", sub: "LIVE", w: 0.145, h: 0.215, accent: "red", bg: "none" },
      { id: "s1", role: "card", kind: "card", text: "秋日实验声音节", sub: "10.18 — 10.20", w: 0.215, h: 0.125, accent: "cobalt", bg: "card", tape: "cobalt" },
      { id: "s2", role: "card", kind: "sticky", text: "黑胶工坊 · 3F", sub: "12 组即兴现场", w: 0.22, h: 0.13, accent: "ink", bg: "lime", tape: "none" },
      { id: "s3", role: "card", kind: "card", text: "MODULAR NOISE", sub: "电子合成与偶发声景", w: 0.21, h: 0.125, accent: "red", bg: "card", tape: "red" },
      { id: "c1", role: "chip", kind: "pill", text: "VOL. 04 · SHANGHAI", sub: "", w: 0.185, h: 0.068, accent: "ink", bg: "ink" },
      { id: "c2", role: "chip", kind: "tag", text: "19:30 开演", sub: "", w: 0.145, h: 0.066, accent: "cobalt", bg: "outline" },
      { id: "c3", role: "chip", kind: "tag", text: "免费预约入场", sub: "", w: 0.165, h: 0.066, accent: "red", bg: "outline" },
      { id: "c4", role: "chip", kind: "tag", text: "现场采样装置", sub: "", w: 0.16, h: 0.064, accent: "lime", bg: "tintLime" },
      { id: "c5", role: "chip", kind: "tag", text: "OPEN LAB", sub: "", w: 0.125, h: 0.062, accent: "ink", bg: "card" },
    ],
  },
  zine: {
    id: "zine",
    label: "独立刊物",
    en: "RISO ZINE",
    slips: [
      { id: "d1", role: "hero", kind: "glyph", text: "偶", sub: "ZINE", w: 0.145, h: 0.215, accent: "cobalt", bg: "none" },
      { id: "d2", role: "hero", kind: "glyph", text: "然", sub: "171", w: 0.145, h: 0.215, accent: "ink", bg: "none" },
      { id: "s1", role: "card", kind: "card", text: "概率与版面实验志", sub: "非网格排印特集", w: 0.22, h: 0.125, accent: "cobalt", bg: "card", tape: "cobalt" },
      { id: "s2", role: "card", kind: "sticky", text: "1% DISORDER", sub: "微扰如何激活版面", w: 0.215, h: 0.13, accent: "ink", bg: "lime", tape: "none" },
      { id: "s3", role: "card", kind: "card", text: "ISSUE NO. 171", sub: "限量孔版双色印刷", w: 0.21, h: 0.125, accent: "red", bg: "card", tape: "red" },
      { id: "c1", role: "chip", kind: "pill", text: "RISOGRAPH EDITION", sub: "", w: 0.19, h: 0.068, accent: "ink", bg: "ink" },
      { id: "c2", role: "chip", kind: "tag", text: "编号 001—300", sub: "", w: 0.16, h: 0.066, accent: "cobalt", bg: "outline" },
      { id: "c3", role: "chip", kind: "tag", text: "2026 秋季刊", sub: "", w: 0.15, h: 0.066, accent: "red", bg: "outline" },
      { id: "c4", role: "chip", kind: "tag", text: "每册封面唯一", sub: "", w: 0.155, h: 0.064, accent: "lime", bg: "tintLime" },
      { id: "c5", role: "chip", kind: "tag", text: "PRINT LAB", sub: "", w: 0.13, h: 0.062, accent: "ink", bg: "card" },
    ],
  },
};

export const DISTRIBUTIONS = [
  { id: "normal", label: "正态聚焦", en: "Normal", desc: "中间密、四周缓降，天然聚出视觉核" },
  { id: "uniform", label: "均匀铺散", en: "Uniform", desc: "全幅机会均等，适合均质节奏与微扰" },
  { id: "exponential", label: "指数偏尾", en: "Exponential", desc: "起端密集、长尾缓稀，不配重极易坠边" },
  { id: "diagonal", label: "对角流势", en: "Diagonal", desc: "沿斜向带状散布，自带阅读动势" },
];

export const DEFAULT_STATE = {
  briefId: "poster",
  seed: 17104,
  disorder: 0.94, // 0..1：开场刻意停在 0/4 混乱失控态
  dist: "uniform",
  hierarchy: "flat", // "flat" | "layered"
  guard: false, // 避碰护栏默认关，制造真实撞字
  pins: {}, // { [slipId]: { x, y, angle } }
};

export const PRESETS = {
  normal_focus: {
    label: "正态聚焦解",
    kind: "valid",
    patch: { disorder: 0.44, dist: "normal", hierarchy: "layered", guard: true, seed: 17104, pins: {} },
  },
  molnar_subtle: {
    label: "莫尔纳微扰解",
    kind: "valid",
    patch: { disorder: 0.27, dist: "uniform", hierarchy: "layered", guard: true, seed: 17119, pins: {} },
  },
  arp_assisted: {
    label: "对角辅助偶发解",
    kind: "valid",
    patch: {
      disorder: 0.50,
      dist: "diagonal",
      hierarchy: "layered",
      guard: true,
      seed: 17145,
      pins: {
        d1: { x: 0.23, y: 0.30, angle: -9 },
        s2: { x: 0.78, y: 0.72, angle: 7 },
      },
    },
  },
  err_rigid: {
    label: "试错：死板 0%",
    kind: "mistake",
    patch: { disorder: 0.02, dist: "uniform", hierarchy: "layered", guard: true, seed: 17104, pins: {} },
  },
  err_flat: {
    label: "试错：同号拉平",
    kind: "mistake",
    patch: { disorder: 0.42, dist: "normal", hierarchy: "flat", guard: true, seed: 17104, pins: {} },
  },
  err_tail: {
    label: "试错：指数偏坠",
    kind: "mistake",
    patch: { disorder: 0.60, dist: "exponential", hierarchy: "layered", guard: false, seed: 17109, pins: {} },
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...DEFAULT_STATE, pins: {} },
  },
};

// 确定性 PRNG (mulberry32)
export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function gaussian(rng) {
  const u1 = Math.max(1e-6, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// 严格对齐 0% 有序基准位（10 枚字片整齐排成刚性网格列表）
const RIGID_SLOTS = [
  { x: 0.25, y: 0.24 },
  { x: 0.43, y: 0.24 },
  { x: 0.72, y: 0.24 },
  { x: 0.27, y: 0.49 },
  { x: 0.56, y: 0.49 },
  { x: 0.82, y: 0.49 },
  { x: 0.23, y: 0.72 },
  { x: 0.48, y: 0.72 },
  { x: 0.74, y: 0.72 },
  { x: 0.50, y: 0.86 },
];

// 旋转矩形 4 顶点（使用物理宽高比 aspect = W / H 计算真实旋转坐标）
export function obbCorners(s, aspect = 1.45) {
  const rad = (s.angle * Math.PI) / 180;
  const c = Math.cos(rad);
  const sn = Math.sin(rad);
  const hx = (s.w * 0.5) * aspect;
  const hy = s.h * 0.5;
  const cx = s.x * aspect;
  const cy = s.y;
  return [
    { x: cx - hx * c + hy * sn, y: cy - hx * sn - hy * c },
    { x: cx + hx * c + hy * sn, y: cy + hx * sn - hy * c },
    { x: cx + hx * c - hy * sn, y: cy + hx * sn + hy * c },
    { x: cx - hx * c - hy * sn, y: cy - hx * sn + hy * c },
  ];
}

// Sutherland-Hodgman 凸多边形精确裁交
function clipPolygon(subject, clip) {
  let out = subject.slice();
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = out;
    out = [];
    if (!input.length) break;
    const inside = (p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= -1e-9;
    const intersect = (p1, p2) => {
      const dx1 = b.x - a.x, dy1 = b.y - a.y;
      const dx2 = p2.x - p1.x, dy2 = p2.y - p1.y;
      const denom = dx1 * dy2 - dy1 * dx2;
      if (Math.abs(denom) < 1e-9) return p2;
      const t = clamp(((p1.x - a.x) * dy1 - (p1.y - a.y) * dx1) / denom, 0, 1);
      return { x: p1.x + t * dx2, y: p1.y + t * dy2 };
    };
    let prev = input[input.length - 1];
    let prevIn = inside(prev);
    for (const curr of input) {
      const currIn = inside(curr);
      if (currIn) {
        if (!prevIn) out.push(intersect(prev, curr));
        out.push(curr);
      } else if (prevIn) {
        out.push(intersect(prev, curr));
      }
      prev = curr;
      prevIn = currIn;
    }
  }
  return out;
}

function polyArea(pts) {
  if (pts.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) * 0.5;
}

// 按分布律采样目标位置
function sampleTarget(dist, idx, role, rng) {
  if (dist === "normal") {
    // 中心聚核，主字更靠近内环，小标落在外环
    const spreadX = role === "hero" ? 0.14 : role === "card" ? 0.20 : 0.23;
    const spreadY = role === "hero" ? 0.13 : role === "card" ? 0.19 : 0.22;
    const x = clamp(0.50 + gaussian(rng) * spreadX, 0.12, 0.88);
    const y = clamp(0.50 + gaussian(rng) * spreadY, 0.13, 0.87);
    return { x, y };
  }
  if (dist === "exponential") {
    // 指数偏尾：左侧高密度、右侧稀疏长尾
    const u = clamp(rng(), 0.002, 0.996);
    const ex = -Math.log(1 - u) / 3.4; // 均值约 0.294
    const x = clamp(0.11 + ex * 0.78, 0.08, 0.90);
    const y = clamp(0.16 + rng() * 0.68, 0.12, 0.88);
    return { x, y };
  }
  if (dist === "diagonal") {
    // 从左上向右下对角动势带
    const t = clamp((idx + 0.3 + (rng() - 0.5) * 1.4) / 10, 0.08, 0.92);
    const perp = gaussian(rng) * 0.14;
    const x = clamp(0.14 + t * 0.72 + perp * 0.7, 0.12, 0.88);
    const y = clamp(0.16 + t * 0.68 - perp * 0.7, 0.13, 0.87);
    return { x, y };
  }
  // uniform 均匀铺散（当 disorder 极高且未护栏时允许漂向危险边缘）
  return {
    x: 0.08 + rng() * 0.84,
    y: 0.10 + rng() * 0.80,
  };
}

// 计算布局（单真源）
export function computeLayout(state, aspect = 1.45) {
  const brief = BRIEFS[state.briefId] || BRIEFS.poster;
  const rng = mulberry32(state.seed * 7919 + brief.id.charCodeAt(0) * 131);
  const d = clamp(state.disorder, 0, 1);
  const layered = state.hierarchy === "layered";
  const pins = state.pins || {};

  // 1. 生成每个字片的原始（扰动插值）位姿
  const slips = brief.slips.map((tpl, i) => {
    // 层级尺度缩放：layered 时主字放大、辅标收小，形成清晰视觉入口；flat 时压缩反差（~1.4×）
    let scale = 1;
    let fontMetric = 16;
    if (layered) {
      scale = tpl.role === "hero" ? 1.18 : tpl.role === "card" ? 0.98 : 0.84;
      fontMetric = tpl.role === "hero" ? 48 : tpl.role === "card" ? 16 : 12;
    } else {
      scale = tpl.role === "hero" ? 0.62 : tpl.role === "card" ? 0.92 : 1.06;
      fontMetric = tpl.role === "hero" ? 20 : tpl.role === "card" ? 15 : 14;
    }

    const wideTrim = aspect > 1.6 ? Math.sqrt(1.6 / aspect) : 1;
    const w = tpl.w * scale * wideTrim;
    const h = tpl.h * scale;
    const slot = RIGID_SLOTS[i];
    const target = sampleTarget(state.dist, i, tpl.role, rng);

    // 高扰动且无护栏时，放任向中心挤撞与边缘溢出，真实呈现「混乱」
    const wildBoost = !state.guard && d > 0.72 ? (d - 0.72) / 0.28 : 0;
    let rawX = slot.x + (target.x - slot.x) * d;
    let rawY = slot.y + (target.y - slot.y) * d;

    if (wildBoost > 0 && state.dist === "uniform") {
      // 在高混乱无护栏下，部分元素产生典型「扎堆撞字」与「冲边裁切」
      if (i === 0 || i === 2 || i === 4) {
        rawX = rawX * (1 - 0.44 * wildBoost) + 0.44 * 0.44 * wildBoost;
        rawY = rawY * (1 - 0.44 * wildBoost) + 0.46 * 0.44 * wildBoost;
      } else if (i === 1 || i === 3) {
        rawX = rawX * (1 - 0.38 * wildBoost) + 0.52 * 0.38 * wildBoost;
        rawY = rawY * (1 - 0.38 * wildBoost) + 0.44 * 0.38 * wildBoost;
      } else if (i === 7) {
        rawX = clamp(rawX + 0.22 * wildBoost, 0.05, 0.955);
      } else if (i === 9) {
        // 冲进右边界安全区，触发擦边告警，使开场呈现完整的 0/4 复合错态
        rawX = clamp(0.935 + 0.02 * wildBoost, 0.88, 0.96);
        rawY = clamp(0.16, 0.10, 0.90);
      }
    }

    // 倾角：与扰动度连续联动；开启护栏时给主字与辅字套合理角度上限
    const signed = (rng() * 2 - 1);
    const maxDeg = state.guard
      ? (tpl.role === "hero" ? 18 : tpl.role === "card" ? 16 : 20)
      : (tpl.role === "hero" ? 54 : 62);
    // 扰动曲线在 0.25–0.55 区间形成适度斜度，高扰动时激增
    const angCurve = d < 0.08 ? 0 : Math.pow(d, state.guard ? 1.05 : 1.35);
    let angle = signed * maxDeg * angCurve;
    if (Math.abs(angle) > 0.5 && Math.abs(angle) < 2.2 && d > 0.16) {
      angle = Math.sign(angle) * 4.5 * d;
    }

    const pin = pins[tpl.id];
    return {
      ...tpl,
      index: i,
      scale,
      fontMetric,
      w,
      h,
      x: pin ? pin.x : rawX,
      y: pin ? pin.y : rawY,
      angle: pin ? pin.angle : angle,
      pinned: !!pin,
      weight: tpl.role === "hero" ? 3.2 * scale : tpl.role === "card" ? 1.8 * scale : 0.9 * scale,
    };
  });

  // 2. 开启避碰护栏时：用确定性迭代排斥 + 安全边距约束收束叠压（尊重用户手钉的 pinned 字片）
  if (state.guard) {
    const safeM = 0.046;
    const gap = 0.019;
    for (let iter = 0; iter < 68; iter++) {
      // 两两包围盒排斥
      for (let i = 0; i < slips.length; i++) {
        for (let j = i + 1; j < slips.length; j++) {
          const a = slips[i];
          const b = slips[j];
          const radA = (Math.abs(a.angle) * Math.PI) / 180;
          const radB = (Math.abs(b.angle) * Math.PI) / 180;
          const ax = (a.w * Math.cos(radA) + (a.h / aspect) * Math.sin(radA)) * 0.5 + gap;
          const ay = (a.h * Math.cos(radA) + a.w * aspect * Math.sin(radA)) * 0.5 + gap;
          const bx = (b.w * Math.cos(radB) + (b.h / aspect) * Math.sin(radB)) * 0.5 + gap;
          const by = (b.h * Math.cos(radB) + b.w * aspect * Math.sin(radB)) * 0.5 + gap;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const ox = ax + bx - Math.abs(dx);
          const oy = ay + by - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            const shareA = a.pinned ? 0 : b.pinned ? 1.15 : 0.5;
            const shareB = b.pinned ? 0 : a.pinned ? 1.15 : 0.5;
            if (ox * aspect < oy) {
              const sgn = dx === 0 ? (i % 2 ? 1 : -1) : dx > 0 ? 1 : -1;
              a.x -= sgn * ox * shareA * 0.65;
              b.x += sgn * ox * shareB * 0.65;
            } else {
              const sgn = dy === 0 ? (j % 2 ? 1 : -1) : dy > 0 ? 1 : -1;
              a.y -= sgn * oy * shareA * 0.65;
              b.y += sgn * oy * shareB * 0.65;
            }
          }
        }
      }
      // 非指数分布时温和校正全局重心，防止单次偶发把全部大字推偏
      if (state.dist !== "exponential" && iter % 6 === 0 && iter < 42) {
        let sw = 0, mx = 0, my = 0;
        for (const s of slips) { sw += s.weight; mx += s.x * s.weight; my += s.y * s.weight; }
        mx /= sw; my /= sw;
        const shiftX = (0.5 - mx) * 0.25;
        const shiftY = (0.5 - my) * 0.25;
        for (const s of slips) {
          if (s.pinned) continue;
          s.x += shiftX;
          s.y += shiftY;
        }
      }
      // 约束 4 个真实旋转顶点全在安全边距之内
      for (const s of slips) {
        if (s.pinned) continue;
        const rad = (Math.abs(s.angle) * Math.PI) / 180;
        const hx = (s.w * Math.cos(rad) + (s.h / aspect) * Math.sin(rad)) * 0.5;
        const hy = (s.h * Math.cos(rad) + s.w * aspect * Math.sin(rad)) * 0.5;
        s.x = clamp(s.x, safeM + hx, 1 - safeM - hx);
        s.y = clamp(s.y, safeM + hy, 1 - safeM - hy);
      }
    }
  }

  // 3. 生成与当前分布一致的背景微粒云与 3 条输入→输出随机过程曲线（视觉呼应 171 原海报）
  const pRng = mulberry32(state.seed * 3571 + 17);
  const particles = [];
  const pCount = 26;
  for (let i = 0; i < pCount; i++) {
    const pt = sampleTarget(state.dist, i % 10, "chip", pRng);
    const lineY = 0.2 + (i % 5) * 0.15;
    const lineX = 0.14 + Math.floor(i / 5) * 0.17;
    const x = lineX + (pt.x - lineX) * Math.max(0.08, d);
    const y = lineY + (pt.y - lineY) * Math.max(0.08, d);
    const kinds = ["dot", "dot", "dot", "plus", "cross", "star"];
    const colors = [PALETTE.ink, PALETTE.cobalt, PALETTE.lime, PALETTE.red];
    particles.push({
      x: clamp(x, 0.06, 0.94),
      y: clamp(y, 0.08, 0.92),
      r: 2.2 + pRng() * 4.2,
      kind: kinds[i % kinds.length],
      color: colors[i % colors.length],
    });
  }

  // 4. 输入→输出 4 条虚线随机轨迹（复刻原海报「随机过程示意」）
  const paths = [0, 1, 2, 3].map((k) => {
    const startY = 0.23 + k * 0.18;
    const endTarget = clamp(startY + (pRng() - 0.5) * 0.52 * d, 0.16, 0.84);
    const c1y = clamp(startY + (pRng() - 0.5) * 0.46 * d, 0.12, 0.88);
    const c2y = clamp(endTarget + (pRng() - 0.5) * 0.46 * d, 0.12, 0.88);
    const outColors = [PALETTE.cobalt, PALETTE.lime, PALETTE.red, PALETTE.ink];
    return {
      startY,
      endY: endTarget,
      c1x: 0.34,
      c1y,
      c2x: 0.66,
      c2y,
      color: outColors[k],
    };
  });

  // 5. 计算实时边际密度曲线（X 与 Y 各 24 个采样点，高斯核平滑）
  const bins = 24;
  const densityX = new Array(bins).fill(0);
  const densityY = new Array(bins).fill(0);
  const bw = 0.11;
  for (let b = 0; b < bins; b++) {
    const pos = (b + 0.5) / bins;
    let sx = 0, sy = 0;
    for (const s of slips) {
      const dx = (pos - s.x) / bw;
      const dy = (pos - s.y) / bw;
      sx += s.weight * Math.exp(-0.5 * dx * dx);
      sy += s.weight * Math.exp(-0.5 * dy * dy);
    }
    densityX[b] = sx;
    densityY[b] = sy;
  }
  const maxDX = Math.max(...densityX, 1e-4);
  const maxDY = Math.max(...densityY, 1e-4);
  for (let b = 0; b < bins; b++) {
    densityX[b] /= maxDX;
    densityY[b] /= maxDY;
  }

  return { slips, particles, paths, densityX, densityY, aspect, state };
}

// 单真源几何评估：直接从实绘 slips 旋转矩形与顶点算全部指标与 7 类双向错态
export function evaluateLayout(layout) {
  const { slips, aspect, state } = layout;
  const corners = slips.map((s) => obbCorners(s, aspect));
  const areas = slips.map((s) => s.w * aspect * s.h);
  const totalArea = areas.reduce((a, b) => a + b, 0);

  // 1. 真实 OBB 两两碰撞面积与碰撞对
  let overlapArea = 0;
  const collisions = [];
  for (let i = 0; i < slips.length; i++) {
    for (let j = i + 1; j < slips.length; j++) {
      const inter = clipPolygon(corners[i], corners[j]);
      const area = polyArea(inter);
      if (area > 0.0018) {
        overlapArea += area;
        collisions.push({ i, j, a: slips[i], b: slips[j], poly: inter, area });
      }
    }
  }
  const overlapPct = Math.min(100, (overlapArea / Math.max(totalArea, 1e-5)) * 100);

  // 2. 安全边距越界检查（外 4.2% 安全留白带）
  const edgeMargin = 0.042;
  const edgeClips = [];
  for (let i = 0; i < slips.length; i++) {
    const pts = corners[i];
    let out = false;
    for (const p of pts) {
      const nx = p.x / aspect;
      const ny = p.y;
      if (nx < edgeMargin || nx > 1 - edgeMargin || ny < edgeMargin || ny > 1 - edgeMargin) {
        out = true;
        break;
      }
    }
    if (out) edgeClips.push(slips[i]);
  }

  // 3. 视觉重心偏移
  let sumW = 0, cx = 0, cy = 0;
  for (const s of slips) {
    sumW += s.weight;
    cx += s.x * s.weight;
    cy += s.y * s.weight;
  }
  cx /= Math.max(sumW, 1e-5);
  cy /= Math.max(sumW, 1e-5);
  const offsetDist = Math.hypot(cx - 0.5, cy - 0.5);
  const offsetPct = offsetDist * 100;

  // 4. 倾角与离散度（区分「僵化死板」与「狂转失控」）
  const maxHeroAngle = Math.max(...slips.filter((s) => s.role === "hero").map((s) => Math.abs(s.angle)));
  const maxAnyAngle = Math.max(...slips.map((s) => Math.abs(s.angle)));
  const avgAngle = slips.reduce((acc, s) => acc + Math.abs(s.angle), 0) / slips.length;

  // 位置相对 0% 刚性网格的真实偏移量
  const meanDrift = slips.reduce((acc, s, i) => {
    const slot = RIGID_SLOTS[i];
    return acc + Math.hypot(s.x - slot.x, s.y - slot.y);
  }, 0) / slips.length;

  // 5. 层级尺度反差（最大字号 / 最小字号）
  const maxFont = Math.max(...slips.map((s) => s.fontMetric));
  const minFont = Math.min(...slips.map((s) => s.fontMetric));
  const scaleRatio = maxFont / Math.max(minFont, 1);

  // 6. 包围盒占幅（防过度挤团或四散丢心）
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const pts of corners) {
    for (const p of pts) {
      const nx = clamp(p.x / aspect, 0, 1);
      const ny = clamp(p.y, 0, 1);
      if (nx < minX) minX = nx;
      if (nx > maxX) maxX = nx;
      if (ny < minY) minY = ny;
      if (ny > maxY) maxY = ny;
    }
  }
  const spanArea = (maxX - minX) * (maxY - minY);

  // 7. 四项核心检查（直接映射原海报 4 项特征 + 便签核验清单）
  const checkNoOverlap = overlapPct <= 3.2 && collisions.length === 0;
  const checkHierarchy = scaleRatio >= 2.2;
  const isTooRigid = avgAngle < 1.6 || state.disorder < 0.14;
  const checkModerateRandom = !isTooRigid && maxHeroAngle <= 26 && maxAnyAngle <= 32;
  const checkBalanceEdge = offsetPct <= 13.5 && edgeClips.length === 0 && spanArea >= 0.24;

  const passedCount = [checkNoOverlap, checkHierarchy, checkModerateRandom, checkBalanceEdge].filter(Boolean).length;

  // 8. 按严重度列出 7 类双向真错态
  const issues = [];
  if (!checkNoOverlap) {
    issues.push({
      code: "overlap",
      title: `有 ${collisions.length} 处字片撞压叠字（叠压率 ${overlapPct.toFixed(1)}%）`,
      why: "随机系统放开网格不等于放任元素互盖。字块相互遮挡后，读者连第一行信息都辨认不出，看到的只是「混乱」而不是「随机」。",
      action: "开启「避碰护栏」并将扰动度向左拉回 25%–55%，或直接拖开画布上标红的叠压字片。",
      fixLabel: "开启避碰并收束至适度随机",
      fixAction: "fix_overlap",
    });
  }
  if (maxHeroAngle > 26 || maxAnyAngle > 32) {
    issues.push({
      code: "over_tilt",
      title: `最大倾角飙到 ${Math.round(maxAnyAngle)}°，文字歪到难以辨读`,
      why: "汉字和拉丁标题在 ±20° 内仍保持可读动势；一旦倾角超过 30° 甚至近乎倒立，眼球需要反复歪头解码，动势就变成了阅读阻力。",
      action: "向左横拖画布降低随机扰动度，或开启避碰护栏把倾角收在安全包络内。",
      fixLabel: "把倾角收进可读包络",
      fixAction: "fix_tilt",
    });
  }
  if (isTooRigid) {
    issues.push({
      code: "too_rigid",
      title: `扰动度仅 ${Math.round(state.disorder * 100)}%，已退化成死板对齐列表`,
      why: "这是反向错态——所有字片被锁死在横平竖直的齐行上（平均偏角 " + avgAngle.toFixed(1) + "°），虽然零撞字，却完全失去了随机系统的偶发变化与呼吸动势。",
      action: "向右横拖画布，把随机扰动度推到 25%–55% 区间，让版面「活」起来。",
      fixLabel: "推入 44% 适度随机区间",
      fixAction: "fix_rigid",
    });
  }
  if (!checkHierarchy) {
    issues.push({
      code: "flat_hierarchy",
      title: `主副尺度比仅 ${scaleRatio.toFixed(1)}×，没有清晰视觉入口`,
      why: "网格系统靠纵横对齐带路；随机系统拆掉了对齐线，如果大字和小标一样大，眼睛落进画面后不知道先看哪一块，只能盲目扫屏。",
      action: "将层级反差切换为「阶梯主次」，拉开主字与辅标的尺度对比（≥ 2.2×）。",
      fixLabel: "切为「阶梯主次」拉开入口",
      fixAction: "fix_hierarchy",
    });
  }
  if (offsetPct > 13.5) {
    const dir = cx < 0.45 ? "左侧" : cx > 0.55 ? "右侧" : cy < 0.45 ? "上方" : "下方";
    issues.push({
      code: "off_balance",
      title: `视觉重心偏向${dir} ${offsetPct.toFixed(0)}%，整张版面单边坠沉`,
      why: "单次随机撒点（尤其是指数偏尾分布）很容易把大片字重堆到同一侧。随机系统要「关注整体分布」，而不是听任重心滑出平衡区。",
      action: "切为「正态聚焦」或「对角流势」，也可以直接拖一两枚大字片到空侧配重（胶带锁定）。",
      fixLabel: "切换正态聚焦稳住重心",
      fixAction: "fix_balance",
    });
  }
  if (edgeClips.length > 0) {
    issues.push({
      code: "edge_clip",
      title: `有 ${edgeClips.length} 枚字片撞进边缘安全区，险些裁切`,
      why: "非刻意出血的擦边截断看起来像排错版而非设计选择，必须为随机落点保留四边呼吸安全带。",
      action: "开启「避碰护栏」自动守住安全留白，或手动将擦边字片向内拖回。",
      fixLabel: "开启边界护栏拉回安全区",
      fixAction: "fix_edge",
    });
  }
  if (spanArea < 0.24) {
    issues.push({
      code: "cluster_tight",
      title: `所有元素挤缩在 ${(spanArea * 100).toFixed(0)}% 的局部面积里`,
      why: "字片缩成一团时，四周留下空洞死白，无法形成随机系统应有的空间舒展节奏。",
      action: "适当拉高扰动度并切换分布律，让字片在版面内舒展开。",
      fixLabel: "舒展空间分布",
      fixAction: "fix_rigid",
    });
  }

  // 9. 判定整体形态（严格标「示意」，不装假精确）
  let regime = "适度随机（示意）";
  let badgeShort = `${passedCount}/4 · 适度随机`;
  let statusKind = "ok";
  if (passedCount === 4) {
    const pinCount = Object.keys(state.pins || {}).length;
    if (pinCount > 0) {
      regime = "辅助偶发（示意）";
      badgeShort = "4/4 · 辅助偶发成立";
    } else if (state.disorder < 0.34) {
      regime = "微扰韵律（示意）";
      badgeShort = "4/4 · 微扰韵律成立";
    } else {
      regime = "适度随机（示意）";
      badgeShort = "4/4 · 适度随机成立";
    }
    statusKind = "ok";
  } else if (issues[0]?.code === "too_rigid") {
    regime = "完全有序（示意）";
    badgeShort = `${passedCount}/4 · 过于僵化`;
    statusKind = "warn";
  } else if (issues[0]?.code === "overlap" || issues[0]?.code === "over_tilt") {
    regime = "混乱失控（示意）";
    badgeShort = `${passedCount}/4 · 撞字混乱`;
    statusKind = "bad";
  } else {
    regime = "分布失衡（示意）";
    badgeShort = `${passedCount}/4 · 规则待修`;
    statusKind = "warn";
  }

  const primary = issues[0] || {
    code: "ok",
    title: "随机规则成立：不靠网格对齐，也能一眼读顺",
    why: `当前叠压 ${overlapPct.toFixed(1)}%、最大倾角 ${Math.round(maxAnyAngle)}°、主副反差 ${scaleRatio.toFixed(1)}×、重心偏移仅 ${offsetPct.toFixed(0)}%。现在按「再撒一版」换任意新种子，你会发现单次落点变了，整体秩序依然稳固。`,
    action: "试试点击「再撒一版」或按空格键验证同规则的稳定性，也可以拖移任意字片贴胶带微调。",
    fixLabel: "同规则再撒一版验证",
    fixAction: "reroll",
  };

  // 10. 四项原海报特征活体状态（偶发 / 变化 / 不规则 / 动势）
  const traits = {
    chance: {
      ok: checkModerateRandom && checkNoOverlap,
      tag: meanDrift < 0.036 ? "被锁死" : collisions.length > 0 ? `撞字 ${collisions.length} 处` : `种子 #${state.seed % 1000}`,
    },
    variation: {
      ok: checkHierarchy && checkModerateRandom,
      tag: !checkHierarchy ? `同号 ${scaleRatio.toFixed(1)}×` : `反差 ${scaleRatio.toFixed(1)}×`,
    },
    irregular: {
      ok: checkBalanceEdge && checkModerateRandom,
      tag: offsetPct > 13.5 ? `重心偏 ${offsetPct.toFixed(0)}%` : edgeClips.length ? `擦边 ${edgeClips.length} 枚` : `重心稳 ${offsetPct.toFixed(0)}%`,
    },
    motion: {
      ok: checkModerateRandom && checkNoOverlap,
      tag: maxAnyAngle > 32 ? `狂转 ${Math.round(maxAnyAngle)}°` : avgAngle < 3.2 ? `0° 静止` : `斜韵 ${Math.round(maxAnyAngle)}°`,
    },
  };

  // 光谱尺位置（0 = 完全有序，50 = 适度随机，100 = 完全随机混乱）
  let spectrumPos = clamp(state.disorder * 100, 2, 98);
  if (!state.guard && overlapPct > 8) spectrumPos = Math.max(spectrumPos, 78);

  return {
    overlapPct,
    collisions,
    edgeClips,
    cx,
    cy,
    offsetPct,
    maxAnyAngle,
    maxHeroAngle,
    avgAngle,
    scaleRatio,
    spanArea,
    passedCount,
    checks: { checkNoOverlap, checkHierarchy, checkModerateRandom, checkBalanceEdge },
    issues,
    primary,
    regime,
    badgeShort,
    statusKind,
    traits,
    spectrumPos,
  };
}
