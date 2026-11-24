// 黄金螺旋的几何，全页共用。
// 坐标：螺旋之眼在原点，y 朝上。最外层黄金矩形 R0 = [X0, X0+φ] × [Y0, Y0+1]。
// M 是把 R0 变成下一层矩形的那一步：顺时针转 90°、缩小 φ 倍。所有方块、四分之一圆都是 M 反复作用出来的。

export const PHI = (1 + Math.sqrt(5)) / 2;
export const QUARTER = Math.PI / 2;
export const B = Math.log(PHI) / QUARTER; // r = a·e^(bθ)，每转 90° 半径乘 φ
export const X0 = -(PHI * PHI + PHI) / (1 + PHI * PHI);
export const Y0 = PHI * (X0 + 1);
export const TH0 = Math.atan2(Y0, X0); // 最外层方块左下角的极角：螺旋从这里起笔
export const A = Math.hypot(X0, Y0) * Math.exp(-B * TH0);
export const EYE = -X0 / PHI; // 眼在画面里的位置（横 72.4%，竖 72.4%）

export const logR = (t) => A * Math.exp(B * t);

// M^k：转 -k·90°，缩 φ^-k
export function mk([x, y], k) {
  const s = PHI ** -k, a = -k * QUARTER, c = Math.cos(a), n = Math.sin(a);
  return [(x * c - y * n) * s, (x * n + y * c) * s];
}

export const square = (k) => [[X0, Y0], [X0 + 1, Y0], [X0 + 1, Y0 + 1], [X0, Y0 + 1]].map((p) => mk(p, k));

// 极角 t 处，四分之一圆拼出来的螺旋离眼多远：第 k 块方块里那段圆弧和射线的交点
export function arcR(t) {
  const k = Math.floor((TH0 - t) / QUARTER + 1e-9);
  const [cx, cy] = mk([X0 + 1, Y0], k);
  const r = PHI ** -k;
  const d = Math.cos(t) * cx + Math.sin(t) * cy;
  return d + Math.sqrt(d * d - cx * cx - cy * cy + r * r);
}

// 从 t0 往里走到 t1（t1 < t0），mix = 0 是对数螺线，1 是四分之一圆；大于 1 就是把差别放大
export function spiral(t0, t1, n, mix = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const lr = logR(t);
    const r = mix ? lr + mix * (arcR(t) - lr) : lr;
    pts.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
}

// 圆弧和对数螺线最大差多少（相对当地半径）。只要量一段：它们每 90° 自相似。
export const maxGap = (() => {
  let m = 0;
  for (let i = 1; i < 400; i++) {
    const t = TH0 - (QUARTER * i) / 400;
    m = Math.max(m, Math.abs(arcR(t) / logR(t) - 1));
  }
  return m;
})();

// ---- 画框 ----
// 横幅黄金矩形里的归一化坐标 (u, v)，v 朝下，都在 0..1：起笔在左下角，眼在 (0.724, 0.724)
export const toFrame = ([x, y]) => [(x - X0) / PHI, Y0 + 1 - y];

// 8 种摆法：fx 左右翻、fy 上下翻、tr 转成竖幅（对角线翻转）
export const ORIENTS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ fx: !!(i & 1), fy: !!(i & 2), tr: !!(i & 4) }));
export function orient([u, v], o) {
  if (o.fx) u = 1 - u;
  if (o.fy) v = 1 - v;
  return o.tr ? [v, u] : [u, v];
}

export const svgPath = (pts, f = (p) => p) =>
  pts.map((p, i) => { const [x, y] = f(p); return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`; }).join("");
