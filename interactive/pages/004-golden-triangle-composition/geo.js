// 黄金三角的几何：画框 w×h 里一条对角线，另外两个角各向它作一条垂线。
// 坐标是画框里的像素（或任意单位），x 向右、y 向下。dir："rise" 左下→右上，"fall" 左上→右下。
// 所有页面上的图都从这一个函数取点，三角形、垂足、延长线、读数都不另算。

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// 从 p 出发沿 d 方向，撞到画框边的那一点（不算出发点本身）
function toEdge(p, d, w, h) {
  let best = Infinity;
  for (const [i, lim] of [[0, 0], [0, w], [1, 0], [1, h]]) {
    if (Math.abs(d[i]) < 1e-9) continue;
    const t = (lim - p[i]) / d[i];
    if (t > 1e-6 && t < best) best = t;
  }
  return [p[0] + d[0] * best, p[1] + d[1] * best];
}

export function armature(w, h, dir = "rise") {
  const TL = [0, 0], TR = [w, 0], BL = [0, h], BR = [w, h];
  const [A, C] = dir === "rise" ? [BL, TR] : [TL, BR]; // 主对角线从 A 到 C
  const offs = dir === "rise" ? [TL, BR] : [TR, BL]; // 另外两个角
  const AC = sub(C, A), D2 = dot(AC, AC);
  const perps = offs.map((corner) => {
    const t = dot(sub(corner, A), AC) / D2; // 垂足在对角线上走了多远（0..1）
    const foot = lerp(A, C, t);
    return { corner, foot, t, end: toEdge(corner, sub(foot, corner), w, h) };
  });
  // 四个直角三角形，直角都在垂足上；[直角顶点, 对角线端点, 画框角]
  const tris = perps.flatMap(({ corner, foot }) => [A, C].map((end) => ({ r: foot, a: end, b: corner })));
  const theta = Math.atan2(Math.min(w, h), Math.max(w, h)); // 对角线和长边的夹角
  return { w, h, dir, A, C, perps, tris, theta };
}

// 垂足按在画框里的位置起名：左上、右下……
export const placeName = ([x, y], w, h) => `${x < w / 2 ? "左" : "右"}${y < h / 2 ? "上" : "下"}`;

// 点到对角线的距离，和它在对角线上的位置（0..1）
export function onDiagonal(p, g) {
  const AC = sub(g.C, g.A), L = Math.hypot(...AC);
  const t = dot(sub(p, g.A), AC) / (L * L);
  const q = lerp(g.A, g.C, t);
  return { t, d: dist(p, q) };
}

export const pathOf = (pts, close = true) => `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}${close ? "Z" : ""}`;

// 直角记号：在顶点 r，沿 r→a、r→b 两个方向各走 s
export function rightMark(r, a, b, s) {
  const u = (p) => { const d = sub(p, r), l = Math.hypot(...d); return [d[0] / l, d[1] / l]; };
  const ua = u(a), ub = u(b);
  const p1 = [r[0] + ua[0] * s, r[1] + ua[1] * s];
  const p2 = [p1[0] + ub[0] * s, p1[1] + ub[1] * s];
  const p3 = [r[0] + ub[0] * s, r[1] + ub[1] * s];
  return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}L${p3[0].toFixed(1)} ${p3[1].toFixed(1)}`;
}

// 长宽比 r（长边 ÷ 短边）下的几个读数，都按长边方向的比例
export const footAt = (r) => 1 / (1 + r * r); // 垂足离近端的距离 ÷ 长边
export const edgeAt = (r) => 1 / (r * r); // 垂线延长到对边时，离出发角的距离 ÷ 长边
