// 没有 WebGL 时的同一幅风景，用 SVG 画平面版：接口和 scene-3d.js 一样（el、resize、render）。
import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const make = (tag, attrs, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent?.append(el);
  return el;
};

export function createSceneFlat(host) {
  const svg = make("svg", { "aria-hidden": "true" });
  host.append(svg);
  make("rect", { width: "100%", height: "100%", fill: PALETTE.sky }, svg);
  const sun = make("circle", { fill: PALETTE.red }, svg);
  const sea = make("rect", { x: 0, width: "100%", fill: PALETTE.sea }, svg);
  const far = make("polygon", { fill: PALETTE.haze }, svg);
  const sand = make("polygon", { fill: PALETTE.sand }, svg);
  const ink = make("polygon", { fill: PALETTE.ink }, svg);
  const ripples = make("g", { stroke: PALETTE.red, "stroke-width": 1.2, opacity: 0.75 }, svg);
  const lines = Array.from({ length: 9 }, () => make("line", {}, ripples));
  const birds = make("g", { fill: "none", stroke: PALETTE.ink, "stroke-width": 2.2, "stroke-linecap": "round" }, svg);
  const birdPaths = [[0, 0], [1.05, -0.42], [0.38, -0.95]].map(() => make("path", {}, birds));
  let W = 600, H = 400;

  const tri = (cx, top, base, half) => `${cx - half},${base} ${cx},${top} ${cx + half},${base}`;

  return {
    el: svg,
    resize(w, h) {
      W = w;
      H = h;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    },
    render(s, t) {
      const hy = s.horizon * H;
      sun.setAttribute("cx", s.sun.u * W);
      sun.setAttribute("cy", s.sun.v * H);
      sun.setAttribute("r", H * 0.085);
      sea.setAttribute("y", hy);
      sea.setAttribute("height", H - hy);
      far.setAttribute("points", tri(0.9 * W, hy - 0.1 * H, hy + 2, W * 0.2));
      sand.setAttribute("points", tri(0.6 * W, hy - 0.22 * H, hy + H * 0.02, W * 0.2));
      const peakV = Math.min(s.peak.v, s.horizon - 0.02);
      ink.setAttribute("points", tri(s.peak.u * W, peakV * H, hy + H * 0.04, W * 0.2));
      lines.forEach((l, i) => {
        const y = hy + (H - hy) * (0.18 + (i / 9) * 0.78);
        const x = (0.2 + ((i * 0.37) % 0.6)) * W + Math.sin(t * 0.35) * 6;
        const len = W * (0.04 + (i % 4) * 0.02);
        l.setAttribute("x1", x - len);
        l.setAttribute("x2", x + len);
        l.setAttribute("y1", y);
        l.setAttribute("y2", y);
      });
      const size = H * 0.05;
      birdPaths.forEach((p, i) => {
        const [dx, dy] = [[0, 0], [1.05, -0.42], [0.38, -0.95]][i];
        const x = s.birds.u * W + (dx - 0.5) * size;
        const y = s.birds.v * H - (dy + 0.45) * size;
        const f = Math.sin(t * 7 + i * 1.7) * size * 0.18;
        p.setAttribute("d", `M${x - size * 0.6},${y - size * 0.15 - f} Q${x - size * 0.25},${y - size * 0.3} ${x},${y} Q${x + size * 0.25},${y - size * 0.3} ${x + size * 0.6},${y - size * 0.15 - f}`);
      });
    },
  };
}
