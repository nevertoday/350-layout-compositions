// 折入框的全部状态：圈数、每圈多宽、宽度的节奏、主体窗口的中心（画框里的 0..1 坐标）。
// 三维、SVG、各节的小图都只读 frames() 算出来的矩形，画法换了也不用改这里。

export const ASPECT = 4 / 5; // 主画框宽 : 高，和海报里牡丹那一格差不多

export const PALETTE = {
  paper: "#fbe9e3",
  blush: "#f6d3cf",
  rose: "#e06a85",
  deep: "#c63d5e",
  wine: "#3a0a17",
  cream: "#fdf3ee",
  petal: "#f1aab4",
};

// 由外到内每圈的颜色：玫红、奶白、粉、浅奶、深玫红……和海报一样深浅交替
export const RINGS = ["#e57a90", "#fcebe2", "#f0a6b1", "#fff6f1", "#d9566f", "#fbe0dc"];

export const RHYTHMS = {
  even: { r: 1, label: "等宽" },
  deepen: { r: 0.72, label: "渐窄" },
  open: { r: 1.32, label: "渐宽" },
};

export const PHI = 0.382;
export const SNAP = 0.045;
const MAX_INSET = 0.44; // 每边折进去的总量最多占短边的 44%，窗口至少留 12%

// 每圈的宽度，单位是「画框短边」；r < 1 越往里越窄，r > 1 越往里越宽，平均值都是 gap
export function bands(n, gap, r) {
  const w = Array.from({ length: n }, (_, i) => r ** i);
  const mean = w.reduce((a, b) => a + b, 0) / n;
  return w.map((x) => (x / mean) * gap);
}

// 短边单位换成横、纵两个方向的 0..1 比例
const toU = (b, aspect) => (b * Math.min(aspect, 1)) / aspect;
const toV = (b, aspect) => b * Math.min(aspect, 1);

// 返回 n+1 个矩形 {x, y, w, h}：第 0 个是外框，最后一个是放主体的窗口；以及修正后的状态
export function frames(state, aspect = ASPECT) {
  const n = state.layers;
  const r = state.r ?? RHYTHMS[state.rhythm].r;
  let b = bands(n, state.gap, r);
  let total = b.reduce((a, x) => a + x, 0);
  const squeezed = total > MAX_INSET;
  if (squeezed) {
    b = b.map((x) => (x * MAX_INSET) / total);
    total = MAX_INSET;
  }
  const TU = toU(total, aspect);
  const TV = toV(total, aspect);
  const w = 1 - 2 * TU;
  const h = 1 - 2 * TV;
  // 窗口可以偏，但偏的那一侧至少留下原宽度的 15%，框不会被挤没
  const mu = TU * 0.15;
  const mv = TV * 0.15;
  const cu = clamp(state.focus.u, mu + w / 2, 1 - mu - w / 2);
  const cv = clamp(state.focus.v, mv + h / 2, 1 - mv - h / 2);
  const inner = { x: cu - w / 2, y: cv - h / 2, w, h };
  const rects = [{ x: 0, y: 0, w: 1, h: 1 }];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += b[i];
    const t = acc / total;
    const x0 = t * inner.x;
    const y0 = t * inner.y;
    const x1 = 1 - t * (1 - inner.x - inner.w);
    const y1 = 1 - t * (1 - inner.y - inner.h);
    rects.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  rects[n] = inner;
  return { rects, bands: b, total, squeezed, focus: { u: cu, v: cv } };
}

const clamp = (x, a, b) => (a > b ? (a + b) / 2 : Math.min(b, Math.max(a, x)));

// 一圈拆成上、右、下、左四块梯形（像画框的斜角拼缝），每块按朝向给一点明暗：光从左上来
const SIDE_SHADE = [0.07, -0.05, -0.11, 0.02];
export function quads(rects, colors = RINGS) {
  const out = [];
  for (let i = 0; i < rects.length - 1; i++) {
    const o = corners(rects[i]);
    const n = corners(rects[i + 1]);
    const base = colors[i % colors.length];
    for (let s = 0; s < 4; s++) {
      const a = s;
      const b2 = (s + 1) % 4;
      out.push({ ring: i, side: s, pts: [o[a], o[b2], n[b2], n[a]], color: shade(base, SIDE_SHADE[s]) });
    }
  }
  return out;
}

// 左上、右上、右下、左下
export const corners = (r) => [
  [r.x, r.y],
  [r.x + r.w, r.y],
  [r.x + r.w, r.y + r.h],
  [r.x, r.y + r.h],
];

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// 可以吸附的位置：正中和四个黄金点（0.382 / 0.618），放不下的不算
export function targets(state, aspect = ASPECT) {
  const list = [{ u: 0.5, v: 0.5, kind: "center" }];
  for (const u of [PHI, 1 - PHI]) for (const v of [PHI, 1 - PHI]) list.push({ u, v, kind: "golden" });
  return list.filter((p) => {
    const f = frames({ ...state, focus: p }, aspect).focus;
    return Math.abs(f.u - p.u) < 0.004 && Math.abs(f.v - p.v) < 0.004;
  });
}

export function snap(state, pos, aspect = ASPECT) {
  for (const p of targets(state, aspect)) if (Math.hypot((pos.u - p.u) * aspect, pos.v - p.v) < SNAP) return { u: p.u, v: p.v };
  return pos;
}

export const pct = (x) => `${Math.round(x * 100)}%`;

export function placeKind(f) {
  const { u, v } = f.focus;
  if (Math.abs(u - 0.5) < 0.004 && Math.abs(v - 0.5) < 0.004) return "center";
  const g = (x) => Math.abs(x - PHI) < 0.004 || Math.abs(x - (1 - PHI)) < 0.004;
  if (g(u) && g(v)) return "golden";
  return "free";
}

const PLACE = {
  center: ["正中", "四边对称，每一圈都把眼睛往同一个点推：最安静、最郑重，适合单独一件东西。"],
  golden: ["黄金区域", "一侧的框被挤薄、对面放宽，像从斜角看进一条走廊：还是向内聚，但多了一点方向和动势。"],
  free: ["自由位置", "离正中和黄金点都还差一点，拖近一些会轻轻吸住。"],
};

const RHYTHM_TEXT = {
  even: "每圈一样宽：平、稳，像装裱的卡纸，层次全靠颜色深浅。",
  deepen: "越往里越窄：近大远小，像一条往里退的走廊，视线被吸进去。",
  open: "越往里越宽：内圈像台阶一样往外托，主体被捧出来，纵深感反而弱。",
};

export function describe(state, f) {
  const kind = placeKind(f);
  const area = f.rects.at(-1).w * f.rects.at(-1).h;
  const notes = [PLACE[kind][1], RHYTHM_TEXT[state.rhythm]];
  let warn = "";
  if (f.squeezed) warn = "圈数乘留白已经超过画面装得下的量，每圈被自动压窄了。";
  else if (area < 0.16) warn = `主体只剩画面的 ${pct(area)}：框比主体还占地方，眼睛在框上打转。`;
  else if (state.layers >= 4 && state.rhythm === "even") warn = "四圈以上又一样宽，容易读成一圈圈靶环条纹，抢走注意力。";
  else if (Math.min(...f.bands) < 0.025) warn = "最窄的一圈细得像线，从框变成了描边。";
  return { where: PLACE[kind][0], kind, area, text: notes.join(""), warn };
}
