// 取景器的状态都用画框里的相对坐标：u 从左到右、v 从上到下，都是 0..1。
// 三维和 SVG 两种画法只读这份状态，交互、读数、键盘都不用管是哪种画法。

export const SUBJECTS = {
  sun: { label: "太阳", start: { u: 1 / 3, v: 1 / 3 } },
  birds: { label: "飞鸟", start: { u: 0.72, v: 0.22 } },
  peak: { label: "山峰", start: { u: 0.24, v: 0.46 } },
};

export const HORIZONS = {
  upper: {
    v: 1 / 3,
    label: "上三分",
    text: "地平线在上三分线：水面占三分之二。重心下沉，前景的波纹成了主角，画面厚重、有纵深。",
  },
  middle: {
    v: 1 / 2,
    label: "居中",
    text: "地平线居中：天地各半，安静、对称，适合倒影；用得不好，会像把画面一刀切成两半，看不出想强调哪边。",
  },
  lower: {
    v: 2 / 3,
    label: "下三分",
    text: "地平线在下三分线：天空占三分之二。开阔、轻盈——前提是天空里有东西可看，这里是太阳和飞鸟。",
  },
};

export const GUIDES = {
  thirds: { lines: [1 / 3, 2 / 3], label: "三分", hud: "1/3 · 2/3" },
  phi: { lines: [0.382, 0.618], label: "黄金 φ", hud: "0.382 · 0.618" },
  center: { lines: [0.5, 0.5], label: "居中", hud: "1/2" },
};

export const SNAP = 0.06; // 吸附半径，按画框高度算
const EDGE = 0.08;

export const powerPoints = (guide) => {
  const [a, b] = GUIDES[guide].lines;
  return [
    { u: a, v: a },
    { u: b, v: a },
    { u: a, v: b },
    { u: b, v: b },
  ];
};

const dist = (p, q, aspect) => Math.hypot((p.u - q.u) * aspect, p.v - q.v);

export function nearest(pos, guide, aspect) {
  let best = null;
  for (const p of powerPoints(guide)) {
    const d = dist(pos, p, aspect);
    if (!best || d < best.d) best = { ...p, d };
  }
  return best;
}

const pointName = (p) => {
  if (Math.abs(p.u - 0.5) < 0.01 && Math.abs(p.v - 0.5) < 0.01) return "中心点";
  return `${p.u < 0.5 ? "左" : "右"}${p.v < 0.5 ? "上" : "下"}交点`;
};

const pct = (x) => `${Math.round(x * 100)}%`;

// 主体在哪一类位置：交点、三分线上、正中、贴边、随便哪里
export function classify(pos, guide, aspect) {
  const n = nearest(pos, guide, aspect);
  const [a, b] = GUIDES[guide].lines;
  const onLine = [a, b].some((l) => Math.abs(pos.u - l) < 0.025 || Math.abs(pos.v - l) < 0.025);
  if (n.d < SNAP * 0.5) return { kind: "point", point: n, name: pointName(n) };
  if (dist(pos, { u: 0.5, v: 0.5 }, aspect) < 0.06) return { kind: "center", point: n, name: "画面正中" };
  if (pos.u < EDGE || pos.u > 1 - EDGE || pos.v < EDGE || pos.v > 1 - EDGE) return { kind: "edge", point: n, name: "贴着边" };
  if (onLine) return { kind: "line", point: n, name: guide === "center" ? "中轴线上" : "分割线上" };
  return { kind: "free", point: n, name: `离${pointName(n)} ${pct(n.d)}` };
}

const ZONE_TEXT = {
  point: "偏离中心、又有着落：眼睛先落在主体上，再到对角那片空处走一圈。",
  center: "正中最稳，也最静——眼睛一进画面就停住了，没有路可走。对称的题材才需要它。",
  edge: "太靠边：主体被画框挤着，视线容易顺势滑出画面。",
  line: "落在分割线上：比交点弱一点，仍是自然的停留处。",
  free: "离交点还差一点。拖近一些，对焦框会变红、吸住。",
};

export function describe(state, aspect) {
  const pos = state.subjects[state.active];
  const zone = classify(pos, state.guide, aspect);
  const notes = [ZONE_TEXT[zone.kind]];
  if (state.guide === "phi" && zone.kind === "point") notes.push("黄金分割线在 38.2%，三分线在 33.3%，两者只差不到画面宽度的 5%。");
  if (state.active === "birds") {
    const ahead = 1 - pos.u;
    if (ahead < 0.4) notes.push(`鸟群朝右飞，前方只剩 ${pct(ahead)} 的画面，方向感被画框截断了。`);
    else if (ahead > 0.6) notes.push(`鸟群朝右飞，前方留出 ${pct(ahead)}，飞行有去处。`);
  }
  if (state.active === "sun" && pos.v > state.horizon + 0.02) notes.push("太阳沉到地平线下面了。");
  if (state.active === "peak" && Math.abs(pos.u - GUIDES[state.guide].lines[0]) < 0.025) notes.push("山峰立在竖向分割线上，山脊和地平线一起把画面分成大小不等的块。");
  return { zone, text: notes.join("") };
}
