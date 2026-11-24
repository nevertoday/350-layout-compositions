// 这一页的几何和读数都在这里，画法（canvas / SVG）只读它。

const deg = (r) => (r * 180) / Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------- 开场：倾角 0–90° ----------
export const ANGLE_SNAPS = [0, 45, 90];

export function snapAngle(a) {
  for (const s of ANGLE_SNAPS) if (Math.abs(a - s) <= 2.5) return s;
  return Math.round(a);
}

export function angleZone(a) {
  if (a === 0) return { key: "flat", label: "水平 · 静", text: "像地平线、像躺下的人。最稳，也最静：视线左右扫一遍就停了，画面不往任何地方去。" };
  if (a < 20) return { key: "crooked", label: "像拍歪了", text: "斜得太少，不像有意为之，倒像没放平。看的人第一反应是想把它扶正，而不是跟着它走。" };
  if (a < 30) return { key: "gentle", label: "缓坡", text: "开始有方向了，但还偏平，像一段缓坡：有点往前的意思，力气不大。" };
  if (a === 45) return { key: "diag", label: "45° · 最斜", text: "横和竖各让一半，离两个「稳」的方向一样远，是最典型的斜线。视线顺着它从左下滑到右上，下一节的对角线法用的就是这个角度。" };
  if (a <= 60) return { key: "comfort", label: "斜得刚好", text: "一眼就看出是故意斜的，又不至于要倒。视线顺着它从左下滑向右上，画面有了方向和速度。" };
  if (a <= 80) return { key: "steep", label: "陡", text: "像在爬坡、在起飞：往上的劲很足，但开始显得吃力、不太稳。" };
  if (a < 90) return { key: "falling", label: "像要倒", text: "差一点就竖直了，看着像一根歪掉的柱子：紧张多过动感，又是想去扶正它。" };
  return { key: "upright", label: "竖直 · 立", text: "像站着的人、柱子、树：稳、庄重、往上，但同样不「动」。横和竖是眼睛的参照，斜线就是对它们的偏离。" };
}

// ---------- 对角线法：从四个角各引一条 45° 线 ----------
// 画框高 1、宽 r；坐标 x 0..r 从左到右，y 0..1 从上到下。状态存比例 u、v（0..1）。
export const CORNERS = [
  { key: "bl", name: "左下角", at: (r) => [0, 1], dir: [1, -1] },
  { key: "tl", name: "左上角", at: (r) => [0, 0], dir: [1, 1] },
  { key: "br", name: "右下角", at: (r) => [r, 1], dir: [-1, -1] },
  { key: "tr", name: "右上角", at: (r) => [r, 0], dir: [-1, 1] },
];

export function lines45(r) {
  const t = Math.min(r, 1);
  return CORNERS.map((c) => {
    const [x, y] = c.at(r);
    return { key: c.key, name: c.name, a: [x, y], b: [x + c.dir[0] * t, y + c.dir[1] * t] };
  });
}

export const frameDiagonals = (r) => [
  { key: "d1", a: [0, 1], b: [r, 0] },
  { key: "d2", a: [0, 0], b: [r, 1] },
];

function toSegment(p, { a, b }) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
  const q = [a[0] + t * dx, a[1] + t * dy];
  return { d: Math.hypot(p[0] - q[0], p[1] - q[1]), q };
}

export const SNAP45 = 0.035;
const ON = 0.004;

const nearestOf = (p, segs) => segs.map((s) => ({ ...s, ...toSegment(p, s) })).sort((m, n) => m.d - n.d)[0];

// 拖到离某条 45° 线足够近，就吸到线上
export function snapDetail(pos, r) {
  const p = [pos.u * r, pos.v];
  const n = nearestOf(p, lines45(r));
  if (n.d < SNAP45) return { u: n.q[0] / r, v: n.q[1] };
  return pos;
}

export const ratioDiff = (r) => Math.abs(45 - deg(Math.atan(1 / r)));

export function classifyDetail(pos, r) {
  const p = [pos.u * r, pos.v];
  const n = nearestOf(p, lines45(r));
  if (n.d < ON) {
    const both = lines45(r).filter((l) => toSegment(p, l).d < ON);
    if (both.length > 1) return { kind: "on", line: n.key, text: `正好在两条 45° 线的交叉处（${both.map((l) => l.name).join("和")}）。这里不比线上别的点更重要：对角线法不看交点，只看在不在线上。` };
    return { kind: "on", line: n.key, text: `压在${n.name}引出的 45° 线上。对角线法只要求细节落在这四条线的任意一点：线上哪儿都行，不看交点。` };
  }
  const fd = nearestOf(p, frameDiagonals(r));
  if (Math.abs(r - 1) > 0.01 && fd.d < 0.02) {
    return { kind: "frame", line: null, text: `这是画框的对角线（角连角），不是 45° 线。这个比例下两者差了 ${ratioDiff(r).toFixed(1)}°，只有正方形里它们才重合。` };
  }
  return { kind: "off", line: n.key, text: `离${n.name}的 45° 线还差 ${Math.round(n.d * 100)}% 画高。拖近一点会吸上去。` };
}

// ---------- 留白：方形画框里一条平行于对角线的斜线，两侧面积 ----------
// 斜线 x + y = s（y 向上，0..1 的方框），s = 1 + shift，shift −0.5..0.5。返回左下那一侧占的比例。
export function lowerShare(shift) {
  const s = 1 + shift;
  return s <= 1 ? (s * s) / 2 : 1 - ((2 - s) * (2 - s)) / 2;
}

export function balance(shift, title) {
  const low = lowerShare(shift);
  const a = Math.round(low * 100), b = 100 - a;
  const big = low > 0.5 ? "左下" : "右上", small = low > 0.5 ? "右上" : "左下";
  const m = Math.abs(shift);
  if (m < 0.06) return { a, b, ok: !title, text: title ? `两侧本来就差不多（${a} : ${b}），再往一边加一块标题，那一边就沉了。斜线居中时，配重要轻。` : `两侧几乎一样大（${a} : ${b}）：稳，但有点像把画面对折了一下。` };
  if (m > 0.34) return { a, b, ok: false, text: `${big}占了 ${Math.max(a, b)}%，${small}只剩一条缝。斜线贴着角走，就算在空的那边放了标题，挤的那边也还是挤。` };
  if (title) return { a, b, ok: true, text: `${big}那一大片（${Math.max(a, b)}%）放上标题，有了配重：斜线负责「动」，标题负责「压」，两边都有东西又都透气。` };
  return { a, b, ok: false, text: `一边 ${Math.max(a, b)}%、一边 ${Math.min(a, b)}%：大的那片空着，小的那片挤着，重心往${small}翻。试试在空的一侧放标题。` };
}

// ---------- 节奏：沿线排 n 个元素 ----------
// contrast 0..1：最远的那个缩到 1 − 0.7·contrast。follow：间距跟着大小走（越远越密）。bigFar：大的在右上端。
export function rhythm(n, contrast, follow, bigFar) {
  const sizes = Array.from({ length: n }, (_, i) => 1 - 0.7 * contrast * (i / (n - 1)));
  const gaps = sizes.slice(0, -1).map((s, i) => (follow ? (s + sizes[i + 1]) / 2 : 1));
  const total = gaps.reduce((x, y) => x + y, 0);
  let acc = 0;
  const ts = [0, ...gaps.map((g) => (acc += g) / total)];
  const items = ts.map((t, i) => ({ t, s: sizes[i] }));
  return bigFar ? items.map(({ t, s }) => ({ t: 1 - t, s })).reverse() : items;
}

export function rhythmText(contrast, follow, bigFar) {
  if (contrast < 0.08) return "一样大、一样远：节拍均匀，像一排脚印。方向有了，深度没有，画面还是平的。";
  if (bigFar) return "大的到了右上：读起来不再是「往远处去」，而是一路长大，或者朝你冲过来。海报说的「由小到大」就是这种走法。";
  if (!follow) return "大小在变，间距却一样：深度感打了折扣，因为远处的东西本该挨得更近。把「间距跟着大小走」打开看看。";
  if (contrast < 0.45) return "近的稍大、远的稍小，越远越密：开始像一排东西往远处排开了。";
  return "近大远小、越远越密：眼睛把它读成一条伸进远处的路。平面里出现了纵深，也就是海报说的「由近及远」。";
}
