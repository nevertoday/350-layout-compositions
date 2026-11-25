// 016 居中构图 · 关掉 WebGL 时的矢量降级展墙舞台
// 与三维舞台读取完全同一份 (subject, clutterMask, geom) 状态与展品外接框尺寸，贴近海报的平涂朱红圆盘质感。

import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

export function createSceneFlat(host) {
  const svg = el("svg", {
    class: "flat-svg",
    viewBox: "0 0 500 480",
    "aria-hidden": "true",
  });

  const defs = el("defs");
  const grad = el("radialGradient", { id: "flat-bg", cx: "50%", cy: "48%", r: "68%" });
  grad.append(
    el("stop", { offset: "0%", "stop-color": "#fefcfb" }),
    el("stop", { offset: "74%", "stop-color": "#fcfaf7" }),
    el("stop", { offset: "100%", "stop-color": "#f2eee8" })
  );
  // 极克制的哑光平涂渐层，收掉塑料球高光，贴近原海报平涂朱红圆盘
  const orbGrad = el("radialGradient", { id: "flat-orb", cx: "44%", cy: "40%", r: "78%" });
  orbGrad.append(
    el("stop", { offset: "0%", "stop-color": "#ff5626" }),
    el("stop", { offset: "72%", "stop-color": PALETTE.vermilion }),
    el("stop", { offset: "100%", "stop-color": "#f24817" })
  );
  const shGrad = el("radialGradient", { id: "flat-sh", cx: "50%", cy: "50%", r: "50%" });
  shGrad.append(
    el("stop", { offset: "0%", "stop-color": PALETTE.ink, "stop-opacity": "0.10" }),
    el("stop", { offset: "100%", "stop-color": PALETTE.ink, "stop-opacity": "0" })
  );
  defs.append(grad, orbGrad, shGrad);

  const bgRect = el("rect", { width: "500", height: "480", fill: "url(#flat-bg)" });
  const wallG = el("g");
  const clutterG = el("g");
  const shadow = el("circle", { r: "80", fill: "url(#flat-sh)" });
  const subjG = el("g");

  svg.append(defs, bgRect, wallG, clutterG, shadow, subjG);
  host.append(svg);

  let width = 500;
  let height = 480;

  function resize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    bgRect.setAttribute("width", String(width));
    bgRect.setAttribute("height", String(height));

    const wf = new DocumentFragment();
    const step = Math.max(48, Math.round(Math.min(width, height) / 6));
    for (let x = (width * 0.5) % step; x < width; x += step) {
      wf.append(el("line", { x1: x, y1: 0, x2: x, y2: height, stroke: PALETTE.hairline, "stroke-opacity": 0.55, "stroke-width": 1 }));
    }
    for (let y = (height * 0.5) % step; y < height; y += step) {
      wf.append(el("line", { x1: 0, y1: y, x2: width, y2: y, stroke: PALETTE.hairline, "stroke-opacity": 0.55, "stroke-width": 1 }));
    }
    wallG.replaceChildren(wf);
  }

  function render(frame) {
    const { subject, clutterMask, geom } = frame;
    const { cx, cy, pxPerMm } = geom;

    shadow.setAttribute("cx", String(cx + 2.4 * pxPerMm));
    shadow.setAttribute("cy", String(cy + 3.2 * pxPerMm));
    shadow.setAttribute("r", String(37 * pxPerMm));

    const f = new DocumentFragment();
    if (subject === "sphere") {
      // 平涂质感朱红圆盘，半径严格为 33 mm
      f.append(el("circle", { cx, cy, r: 33 * pxPerMm, fill: "url(#flat-orb)" }));
    } else if (subject === "arch") {
      // 严格按 [-26, +26] × [-36, +36] mm 绘制
      const x = (mm) => cx + mm * pxPerMm;
      const y = (mm) => cy - mm * pxPerMm; // 向上为正 mm
      const rOut = 23 * pxPerMm;
      const rIn = 14.4 * pxPerMm;
      f.append(
        el("path", {
          d: `M${x(-23)},${y(-31.2)} V${y(13)} A${rOut},${rOut} 0 0 1 ${x(23)},${y(13)} V${y(-31.2)} H${x(14.4)} V${y(13)} A${rIn},${rIn} 0 0 0 ${x(-14.4)},${y(13)} V${y(-31.2)} Z`,
          fill: PALETTE.ink,
        }),
        el("rect", {
          x: x(-26),
          y: y(-31.2),
          width: 52 * pxPerMm,
          height: 4.8 * pxPerMm,
          fill: PALETTE.ink,
        }),
        el("circle", { cx: x(0), cy: y(2.2), r: 9.2 * pxPerMm, fill: "url(#flat-orb)" })
      );
    } else if (subject === "boat") {
      // 严格按 [-32, +39] × [-23, +33] mm 绘制
      const x = (mm) => cx + mm * pxPerMm;
      const y = (mm) => cy - mm * pxPerMm;
      f.append(
        el("polygon", {
          points: `${x(-32)},${y(-7.5)} ${x(39)},${y(-7.5)} ${x(26)},${y(-23)} ${x(-23)},${y(-23)}`,
          fill: PALETTE.ink,
        }),
        el("polygon", {
          points: `${x(-4.5)},${y(-4.5)} ${x(30.5)},${y(-4.5)} ${x(-2)},${y(33)}`,
          fill: "url(#flat-orb)",
        }),
        el("polygon", {
          points: `${x(-26.5)},${y(-4.5)} ${x(-8.2)},${y(-4.5)} ${x(-8.2)},${y(22.5)}`,
          fill: PALETTE.ink,
        })
      );
    }
    subjG.replaceChildren(f);

    const cf = new DocumentFragment();
    const mask = Array.isArray(clutterMask) ? clutterMask : [false, false, false];
    for (let i = 0; i < geom.clutter.length; i++) {
      if (!mask[i]) continue;
      const item = geom.clutter[i];
      const ir = item.r;
      if (item.kind === "block") {
        cf.append(
          el("rect", {
            x: item.x - ir,
            y: item.y - ir,
            width: ir * 2,
            height: ir * 2,
            fill: "#1b1a1f",
          })
        );
      } else if (item.kind === "circle") {
        cf.append(el("circle", { cx: item.x, cy: item.y, r: ir * 0.92, fill: "#c43308" }));
      } else {
        cf.append(
          el("circle", {
            cx: item.x,
            cy: item.y,
            r: ir * 0.84,
            fill: "none",
            stroke: PALETTE.ink,
            "stroke-width": Math.max(3.5, ir * 0.28),
          })
        );
      }
    }
    clutterG.replaceChildren(cf);
  }

  return { resize, render };
}
