// 把 frames() 的矩形画成 SVG：每圈四块斜角梯形，最里面放牡丹。开场的降级画面和各节小图都用它。
import { corners, quads } from "./model.js";
import { PEONY_SIZE, peonyURL } from "./peony.js";

const NS = "http://www.w3.org/2000/svg";
const f2 = (n) => +n.toFixed(2);

// 画框坐标：宽 W、高 H（默认 80 × 100，和 4:5 一致）
export function framesSVG(f, { W = 80, H = 100, highlight = -1, window = "peony", fill = "#f3c2c4", colors, seams = true } = {}) {
  const P = ([u, v]) => `${f2(u * W)},${f2(v * H)}`;
  let s = "";
  for (const q of quads(f.rects, colors)) {
    const dim = highlight < 0 ? "" : highlight !== q.ring ? ' opacity="0.25"' : ' stroke="#3a0a17" stroke-width="0.7" stroke-linejoin="round"';
    s += `<polygon points="${q.pts.map(P).join(" ")}" fill="${q.color}"${dim}/>`;
  }
  const r = f.rects.at(-1);
  const x = f2(r.x * W);
  const y = f2(r.y * H);
  const w = f2(r.w * W);
  const h = f2(r.h * H);
  const dimW = highlight >= 0 && highlight !== f.rects.length - 1 ? ' opacity="0.25"' : "";
  const src = peonyURL();
  if (window === "peony" && src) {
    s += `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${PEONY_SIZE.w} ${PEONY_SIZE.h}" preserveAspectRatio="xMidYMid slice"${dimW}><image href="${src}" width="${PEONY_SIZE.w}" height="${PEONY_SIZE.h}"/></svg>`;
  } else {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${dimW}/>`;
  }
  // 斜角拼缝：外框角连到窗口角，细细一道，读得出「往里折」
  if (highlight < 0 && seams) {
    const o = corners(f.rects[0]);
    const n = corners(r);
    s += `<g stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.25">${o.map((p, i) => `<line x1="${f2(p[0] * W)}" y1="${f2(p[1] * H)}" x2="${f2(n[i][0] * W)}" y2="${f2(n[i][1] * H)}"/>`).join("")}</g>`;
  }
  return s;
}

export function svgEl(W = 80, H = 100, pad = 0) {
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("viewBox", `${-pad * W} ${-pad * H} ${W * (1 + 2 * pad)} ${H * (1 + 2 * pad)}`);
  el.setAttribute("aria-hidden", "true");
  return el;
}
