// 海报里那种风景（蓝天、白山、太阳、飞鸟），按 armature() 的点来摆，返回 SVG 字符串。
// 开场、练习、应用缩略图都用它，所以山永远和骨架对得上。
import { lerp, pathOf, rightMark } from "./geo.js";

const f1 = (n) => n.toFixed(1);

// 主山：底边一个角、它的垂足（山顶，直角）、主对角线在底边的那一端
export function mountain(g) {
  const p = g.perps.find((q) => q.corner[1] === g.h);
  const base = g.A[1] === g.h ? g.A : g.C;
  return { summit: p.foot, corner: p.corner, base, other: g.perps.find((q) => q !== p).foot };
}

export function landscape(g, { sun = null, sunR = 0.085, hiker = null, birds = true, ridge = true, horizon = null, idp = "s" } = {}) {
  const { w, h } = g;
  const m = Math.min(w, h);
  let s = "";
  if (birds) {
    // 鸟群放在上方垂足朝画面中间的一侧，不和开场叠在左上的标题打架
    const k = m / 420;
    const up = g.perps[0].foot[1] <= g.perps[1].foot[1] ? g.perps[0].foot : g.perps[1].foot;
    const bx = up[0] < w / 2 ? up[0] + w * 0.13 : up[0] - w * 0.13 - 46 * k, by = Math.max(h * 0.1, up[1] + h * 0.04);
    const bird = (x, y, k) => `<path d="M${f1(x - 9 * k)} ${f1(y - 4 * k)}q${f1(5 * k)} ${f1(-1 * k)} ${f1(9 * k)} ${f1(4 * k)}q${f1(4 * k)} ${f1(-5 * k)} ${f1(9 * k)} ${f1(-4 * k)}"/>`;
    s += `<g class="birds">${bird(bx, by, k)}${bird(bx + 26 * k, by + 12 * k, k * 0.8)}${bird(bx + 46 * k, by - 2 * k, k * 0.65)}</g>`;
  }
  if (sun) s += sunMarkup(sun, sunR * m, idp);
  if (ridge) {
    const { summit, corner, base } = mountain(g);
    const foot = [summit[0], h];
    s += `<path class="m-lit" d="${pathOf([base, summit, foot])}"/>`;
    s += `<path class="m-shade" d="${pathOf([foot, summit, corner])}"/>`;
    // 前面一座小山：和主山同形（以底角为中心缩小），呼应「四块同形」
    const k = 0.46;
    const s2 = lerp(corner, summit, k), b2 = lerp(corner, base, k);
    s += `<path class="m-front" d="${pathOf([b2, s2, corner])}"/>`;
  }
  if (horizon != null) {
    s += `<rect class="sea" x="0" y="${f1(horizon)}" width="${w}" height="${f1(h - horizon)}"/>`;
    for (let i = 1; i < 4; i++) {
      const y = horizon + (h - horizon) * (i / 4.2);
      s += `<path class="wave" d="M${f1(w * (0.12 + 0.1 * i))} ${f1(y)}h${f1(w * 0.22)}M${f1(w * (0.55 + 0.05 * i))} ${f1(y + 4)}h${f1(w * 0.16)}"/>`;
    }
  }
  if (hiker) s += hikerMarkup(hiker.at, m * 0.07, hiker.face);
  return s;
}

export function sunMarkup([x, y], r, idp = "s") {
  return `<g class="sun" data-sun transform="translate(${f1(x)} ${f1(y)})"><circle class="sun-ring" r="${f1(r * 1.75)}"/><circle class="sun-ring" r="${f1(r * 1.35)}"/><circle class="sun-disc" r="${f1(r)}"/></g>`;
}

// 登山的人：脚踩在 at，身高 H，face=1 朝右
export function hikerMarkup([x, y], H, face = 1) {
  const k = H / 20;
  const t = (dx, dy) => `${f1(x + dx * k * face)} ${f1(y + dy * k)}`;
  return `<g class="hiker"><circle cx="${f1(x + k * face)}" cy="${f1(y - 17.5 * k)}" r="${f1(2.6 * k)}"/><path d="M${t(-1.5, 0)}L${t(0.5, -8)}L${t(3, 0)}M${t(0.5, -8)}L${t(1, -14.5)}M${t(1, -12.5)}L${t(5, -8)}L${t(7, 0)}M${t(0.6, -13.5)}L${t(-3.5, -10)}"/><path class="pack" d="M${t(-0.6, -14)}L${t(-4, -13)}L${t(-3.4, -8.2)}L${t(0.2, -9)}Z"/></g>`;
}

// 骨架：主斜线、两条垂线、直角记号、垂足；tri=true 时给四个三角形上色并编号
export function armatureMarkup(g, { tri = false, marks = true, arrow = true, nums = false, idp = "a" } = {}) {
  const m = Math.min(g.w, g.h);
  let s = "";
  if (tri) s += g.tris.map((t, i) => `<path class="tri tri-${i}" d="${pathOf([t.r, t.a, t.b])}"/>`).join("");
  if (nums) s += g.tris.map((t, i) => {
    const c = [(t.r[0] + t.a[0] + t.b[0]) / 3, (t.r[1] + t.a[1] + t.b[1]) / 3];
    return `<g class="tri-num" transform="translate(${f1(c[0])} ${f1(c[1])})"><circle r="${f1(m * 0.035)}"/><text dy="0.36em" font-size="${f1(m * 0.04)}">${i + 1}</text></g>`;
  }).join("");
  s += `<line class="diag" data-diag x1="${f1(g.A[0])}" y1="${f1(g.A[1])}" x2="${f1(g.C[0])}" y2="${f1(g.C[1])}"/>`;
  g.perps.forEach((p, i) => (s += `<line class="perp" data-perp="${i}" x1="${f1(p.corner[0])}" y1="${f1(p.corner[1])}" x2="${f1(p.foot[0])}" y2="${f1(p.foot[1])}"/>`));
  if (arrow) {
    const d = [g.C[0] - g.A[0], g.C[1] - g.A[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    const a = m * 0.045, tip = lerp(g.A, g.C, 1 - (m * 0.012) / L);
    const p1 = [tip[0] - u[0] * a * 1.6 + n[0] * a * 0.7, tip[1] - u[1] * a * 1.6 + n[1] * a * 0.7];
    const p2 = [tip[0] - u[0] * a * 1.6 - n[0] * a * 0.7, tip[1] - u[1] * a * 1.6 - n[1] * a * 0.7];
    s += `<path class="arrow" data-arrow d="${pathOf([tip, p1, p2])}"/>`;
  }
  if (marks) g.perps.forEach((p) => (s += `<path class="rmark" data-mark d="${rightMark(p.foot, g.C, p.corner, m * 0.04)}"/>`));
  g.perps.forEach((p, i) => (s += `<g class="foot" data-foot="${i}" transform="translate(${f1(p.foot[0])} ${f1(p.foot[1])})"><circle class="foot-ring" r="${f1(m * 0.032)}"/><circle class="foot-dot" r="${f1(Math.max(3, m * 0.01))}"/></g>`));
  return s;
}
