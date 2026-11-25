// WebGL 不可用时的纯 SVG 降级舞台：读取与 3D 版完全一致的 model.js 状态，
// 根据容器实际宽高动态更新 viewBox，确保任意屏幕比例下把手与主体 0px 偏差、零裁切。

import { CROSSHAIR } from "./model.js";
import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

export function createSceneFlat(host) {
  let W = 540;
  let H = 400;

  const svg = el("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "flat-svg",
    "aria-hidden": "true",
  });

  const defs = el("defs");
  const orbGrad = el("radialGradient", { id: "flat-orb-grad", cx: "36%", cy: "32%", r: "68%" });
  orbGrad.append(
    el("stop", { offset: "0%", "stop-color": "#ff838c" }),
    el("stop", { offset: "58%", "stop-color": PALETTE.coral }),
    el("stop", { offset: "100%", "stop-color": "#c53749" })
  );
  const shGrad = el("radialGradient", { id: "flat-sh-grad", cx: "50%", cy: "50%", r: "50%" });
  shGrad.append(
    el("stop", { offset: "0%", "stop-color": "rgba(12,2,34,0.68)" }),
    el("stop", { offset: "100%", "stop-color": "rgba(12,2,34,0)" })
  );
  defs.append(orbGrad, shGrad);
  svg.append(defs);

  const bgRect = el("rect", { width: W, height: H, fill: PALETTE.bg });
  svg.append(bgRect);

  const boardG = el("g");
  svg.append(boardG);

  const cwArc = el("g");
  const cwArcPath = el("path", { fill: PALETTE.arc, stroke: PALETTE.arcEdge, "stroke-width": 1.2 });
  cwArc.append(cwArcPath);
  boardG.append(cwArc);

  const dotsG = el("g", { opacity: "0.78" });
  const hatchesG = el("g", { stroke: PALETTE.coralHot, "stroke-width": 1.4, opacity: "0.55" });
  const axesG = el("g");
  boardG.append(dotsG, hatchesG, axesG);

  const cwStamp = el("g", { visibility: "hidden" });
  cwStamp.append(
    el("circle", { cx: 0, cy: 0, r: 16, fill: "none", stroke: PALETTE.coralHot, "stroke-width": 2.4 }),
    el("circle", { cx: 0, cy: 0, r: 6, fill: PALETTE.ink })
  );
  boardG.append(cwStamp);

  // 拉力线、软影与主体直接挂在 svg 根部，确保与 DOM 指针坐标 1:1 对齐
  const pullLine = el("line", {
    stroke: PALETTE.coralHot,
    "stroke-width": 1.6,
    "stroke-opacity": 0.72,
  });
  const shadow = el("circle", { r: 64, fill: "url(#flat-sh-grad)" });
  const subG = el("g");
  const orb = el("circle", { cx: 0, cy: 0, r: 52, fill: "url(#flat-orb-grad)" });
  const pointer = el("g", { visibility: "hidden" });
  pointer.append(
    el("polygon", { points: "-56,0 44,-38 44,38", fill: "url(#flat-orb-grad)" }),
    el("line", { x1: 46, y1: -30, x2: 46, y2: 30, stroke: PALETTE.ink, "stroke-width": 4 })
  );
  const monolith = el("g", { visibility: "hidden" });
  monolith.append(
    el("rect", { x: -30, y: -52, width: 60, height: 104, fill: "url(#flat-orb-grad)" }),
    el("rect", { x: -30, y: -24, width: 60, height: 6.5, fill: PALETTE.ink })
  );
  subG.append(orb, pointer, monolith);
  svg.append(pullLine, shadow, subG);

  host.append(svg);

  function layoutStatic() {
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    bgRect.setAttribute("width", W);
    bgRect.setAttribute("height", H);

    const minSide = Math.min(W, H);
    const rOut = minSide * 0.48;
    const rIn = minSide * 0.25;
    cwArcPath.setAttribute(
      "d",
      `M 0 ${H - rOut} A ${rOut} ${rOut} 0 0 1 ${rOut} ${H} L ${rIn} ${H} A ${rIn} ${rIn} 0 0 0 0 ${H - rIn} Z`
    );

    // 5×5 点阵排在右上 HUD 下方
    dotsG.replaceChildren();
    const step = Math.min(15, minSide * 0.036);
    const x0 = W - 18 - 4 * step;
    const y0 = Math.max(54, H * 0.16);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        dotsG.append(el("circle", { cx: x0 + c * step, cy: y0 + r * step, r: 2.4, fill: PALETTE.ink }));
      }
    }

    // 右下 45° 珊瑚斜线群
    hatchesG.replaceChildren();
    const hs = minSide * 0.24;
    const hx = W - 16 - hs;
    const hy = H - 16;
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      hatchesG.append(el("line", { x1: hx + t * hs, y1: hy, x2: hx + hs, y2: hy - (1 - t) * hs }));
    }

    // 偏置十字轴 + 几何中心小十字
    axesG.replaceChildren();
    const cx = CROSSHAIR.u * W;
    const cy = CROSSHAIR.v * H;
    axesG.append(
      el("line", { x1: cx, y1: 12, x2: cx, y2: H - 12, stroke: PALETTE.ink, "stroke-opacity": 0.48, "stroke-width": 1.2, "stroke-dasharray": "8 7" }),
      el("line", { x1: 12, y1: cy, x2: W - 12, y2: cy, stroke: PALETTE.ink, "stroke-opacity": 0.48, "stroke-width": 1.2, "stroke-dasharray": "8 7" }),
      el("path", { d: `M${W / 2 - 9} ${H / 2}H${W / 2 + 9}M${W / 2} ${H / 2 - 9}V${H / 2 + 9}`, stroke: PALETTE.inkMute, "stroke-opacity": 0.35, "stroke-width": 1.2 }),
      el("circle", { cx, cy, r: 7, fill: PALETTE.coralHot }),
      el("circle", { cx, cy, r: 2.6, fill: PALETTE.bg })
    );

    pullLine.setAttribute("x1", (W / 2).toFixed(1));
    pullLine.setAttribute("y1", (H / 2).toFixed(1));
  }

  function resize(w, h) {
    W = Math.max(100, w || 540);
    H = Math.max(100, h || 400);
    layoutStatic();
  }

  function render(frameState) {
    const { u, v, subject, counterweight, info } = frameState;
    const x = u * W;
    const y = v * H;
    const scale = Math.max(0.75, Math.min(1.12, Math.min(W, H) / 410));

    orb.setAttribute("visibility", subject === "orb" ? "visible" : "hidden");
    pointer.setAttribute("visibility", subject === "pointer" ? "visible" : "hidden");
    monolith.setAttribute("visibility", subject === "monolith" ? "visible" : "hidden");

    subG.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`);
    shadow.setAttribute("cx", (x + 12).toFixed(1));
    shadow.setAttribute("cy", (y + 14).toFixed(1));
    shadow.setAttribute("r", (64 * scale).toFixed(1));

    pullLine.setAttribute("x2", x.toFixed(1));
    pullLine.setAttribute("y2", y.toFixed(1));
    pullLine.setAttribute("visibility", info.ecc > 0.04 ? "visible" : "hidden");

    cwArc.setAttribute("visibility", counterweight === "arc" ? "visible" : "hidden");
    cwStamp.setAttribute("visibility", counterweight === "dot" ? "visible" : "hidden");
    if (info.cwPos) {
      if (counterweight === "arc") {
        const tx = info.cwPos.u > 0.5 ? W : 0;
        const ty = info.cwPos.v < 0.5 ? H : 0;
        const sx = info.cwPos.u > 0.5 ? -1 : 1;
        const sy = info.cwPos.v < 0.5 ? -1 : 1;
        cwArc.setAttribute("transform", `translate(${tx} ${ty}) scale(${sx} ${sy})`);
      } else if (counterweight === "dot") {
        cwStamp.setAttribute("transform", `translate(${(info.cwPos.u * W).toFixed(1)} ${(info.cwPos.v * H).toFixed(1)})`);
      }
    }

    const tiltDeg = (info.tiltX * 1.8).toFixed(2);
    boardG.setAttribute("transform", `rotate(${tiltDeg} ${(W / 2).toFixed(1)} ${(H / 2).toFixed(1)})`);
  }

  layoutStatic();
  return { resize, render };
}
