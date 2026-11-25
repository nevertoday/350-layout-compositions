// 016 居中构图 · 关掉 WebGL 时的矢量降级舞台
// 读取与三维版完全相同的 (u, v, subject, clutter) 状态，画面依旧锐利、清爽、可拖动。

import { CLUTTER_ITEMS } from "./model.js";
import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function createSceneFlat(host) {
  const svg = el("svg", {
    class: "flat-svg",
    viewBox: "0 0 600 450",
    "aria-hidden": "true",
  });

  const defs = el("defs");
  const grad = el("radialGradient", { id: "flat-bg", cx: "50%", cy: "48%", r: "65%" });
  grad.append(
    el("stop", { offset: "0%", "stop-color": "#ffffff" }),
    el("stop", { offset: "72%", "stop-color": "#fcfaf7" }),
    el("stop", { offset: "100%", "stop-color": "#efece6" })
  );
  const shGrad = el("radialGradient", { id: "flat-sh", cx: "50%", cy: "50%", r: "50%" });
  shGrad.append(
    el("stop", { offset: "0%", "stop-color": PALETTE.ink, "stop-opacity": "0.18" }),
    el("stop", { offset: "100%", "stop-color": PALETTE.ink, "stop-opacity": "0" })
  );
  defs.append(grad, shGrad);

  const bgRect = el("rect", { width: "600", height: "450", fill: "url(#flat-bg)" });
  const roomRect = el("rect", {
    x: "42",
    y: "32",
    width: "516",
    height: "386",
    fill: "none",
    stroke: PALETTE.hairline,
    "stroke-width": "1.2",
  });
  const clutterG = el("g");
  const shadow = el("circle", { r: "90", fill: "url(#flat-sh)" });
  const subjG = el("g");

  svg.append(defs, bgRect, roomRect, clutterG, shadow, subjG);
  host.append(svg);

  let width = 600;
  let height = 450;

  function resize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    bgRect.setAttribute("width", String(width));
    bgRect.setAttribute("height", String(height));
    roomRect.setAttribute("x", String(width * 0.07));
    roomRect.setAttribute("y", String(height * 0.07));
    roomRect.setAttribute("width", String(width * 0.86));
    roomRect.setAttribute("height", String(height * 0.86));
  }

  function render(frame) {
    const { u, v, subject, clutter } = frame;
    const cx = u * width;
    const cy = v * height;
    const r = Math.min(width, height) * 0.21;

    shadow.setAttribute("cx", String(cx + (u - 0.5) * 14 + 5));
    shadow.setAttribute("cy", String(cy + (v - 0.5) * 10 + 8));
    shadow.setAttribute("r", String(r * 1.15));

    const f = new DocumentFragment();
    if (subject === "sphere") {
      f.append(
        el("circle", { cx, cy, r, fill: PALETTE.vermilion }),
        el("ellipse", {
          cx,
          cy,
          rx: r * 1.16,
          ry: r * 0.26,
          fill: "none",
          stroke: PALETTE.ink,
          "stroke-width": 1.1,
          "stroke-opacity": 0.25,
        })
      );
    } else if (subject === "arch") {
      const w = r * 1.5;
      const h = r * 1.8;
      const x0 = cx - w / 2;
      const y0 = cy - h / 2;
      f.append(
        el("path", {
          d: `M${x0},${y0 + h} V${y0 + w / 2} A${w / 2},${w / 2} 0 0 1 ${x0 + w},${y0 + w / 2} V${y0 + h} H${x0 + w * 0.78} V${y0 + w / 2} A${w * 0.28},${w * 0.28} 0 0 0 ${x0 + w * 0.22},${y0 + w / 2} V${y0 + h} Z`,
          fill: PALETTE.ink,
        }),
        el("rect", {
          x: x0 - r * 0.14,
          y: y0 + h - r * 0.14,
          width: w + r * 0.28,
          height: r * 0.16,
          fill: PALETTE.ink,
        }),
        el("circle", { cx, cy: cy + r * 0.08, r: r * 0.32, fill: PALETTE.vermilion })
      );
    } else if (subject === "boat") {
      const s = r * 1.05;
      f.append(
        el("polygon", {
          points: `${cx - s},${cy + s * 0.22} ${cx + s * 1.18},${cy + s * 0.22} ${cx + s * 0.78},${cy + s * 0.64} ${cx - s * 0.74},${cy + s * 0.64}`,
          fill: PALETTE.ink,
        }),
        el("polygon", {
          points: `${cx - s * 0.16},${cy + s * 0.12} ${cx + s * 0.92},${cy + s * 0.12} ${cx - s * 0.08},${cy - s * 0.95}`,
          fill: PALETTE.vermilion,
        }),
        el("polygon", {
          points: `${cx - s * 0.84},${cy + s * 0.12} ${cx - s * 0.26},${cy + s * 0.12} ${cx - s * 0.26},${cy - s * 0.66}`,
          fill: PALETTE.ink,
        })
      );
    }
    subjG.replaceChildren(f);

    const cf = new DocumentFragment();
    if (clutter) {
      for (const item of CLUTTER_ITEMS) {
        const ix = item.u * width;
        const iy = item.v * height;
        const ir = Math.min(width, height) * 0.065;
        if (item.kind === "block") {
          cf.append(
            el("rect", {
              x: ix - ir,
              y: iy - ir,
              width: ir * 2,
              height: ir * 2,
              fill: "#1b1a1f",
            })
          );
        } else if (item.kind === "circle") {
          cf.append(el("circle", { cx: ix, cy: iy, r: ir * 0.9, fill: "#d94b24" }));
        } else {
          cf.append(
            el("circle", {
              cx: ix,
              cy: iy,
              r: ir * 0.82,
              fill: "none",
              stroke: PALETTE.ink,
              "stroke-width": Math.max(4, ir * 0.28),
            })
          );
        }
      }
    }
    clutterG.replaceChildren(cf);
  }

  return { resize, render };
}
