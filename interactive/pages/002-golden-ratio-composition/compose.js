import { PHI, clamp, drag, svg } from "./util.js";

const W = 1618, H = 1000, G = 1 / PHI;
const GUIDES = [
  { v: 1 - G, name: "φ 线" }, { v: G, name: "φ 线" },
  { v: 1 / 3, name: "三分线" }, { v: 2 / 3, name: "三分线" },
  { v: 0.5, name: "正中" },
];

export function initCompose() {
  const root = document.getElementById("comp-svg");
  const steps = document.getElementById("comp-steps");
  const inX = document.getElementById("comp-x");
  const inY = document.getElementById("comp-y");
  const snap = document.getElementById("comp-snap");
  const showPhi = document.getElementById("comp-phi");
  const showThird = document.getElementById("comp-third");
  const outX = document.getElementById("comp-x-out");
  const outY = document.getElementById("comp-y-out");
  const outNear = document.getElementById("comp-near");

  const layer = (cls) => svg("g", { class: cls }, root);
  svg("rect", { width: W, height: H, class: "sky" }, root);
  const scenery = layer("scenery");
  const hills = svg("path", { d: `M0 ${H}V760C220 700 360 720 520 690S900 760 1100 720 1460 690 ${W} 740V${H}Z`, class: "hills" }, scenery);
  const peak = svg("path", { class: "peak" }, scenery);
  const extras = layer("extras");
  const sun = svg("circle", { r: 56, class: "sun" }, extras);
  const text = Array.from({ length: 4 }, () => svg("rect", { height: 10, class: "line" }, extras));
  const thirds = layer("guides thirds");
  const phis = layer("guides phis");
  for (const [g, vals] of [[thirds, [1 / 3, 2 / 3]], [phis, [1 - G, G]]])
    for (const v of vals) {
      svg("line", { x1: v * W, x2: v * W, y1: 0, y2: H }, g);
      svg("line", { x1: 0, x2: W, y1: v * H, y2: v * H }, g);
    }
  svg("text", { x: (1 - G) * W + 10, y: 34, class: "guide-label" }, phis).textContent = "0.382";
  svg("text", { x: G * W + 10, y: 34, class: "guide-label" }, phis).textContent = "0.618";
  svg("text", { x: W / 3 + 10, y: H - 18, class: "guide-label" }, thirds).textContent = "1/3";
  svg("text", { x: (2 * W) / 3 + 10, y: H - 18, class: "guide-label" }, thirds).textContent = "2/3";
  const vLine = svg("line", { y1: 0, y2: H, class: "divider v" }, root);
  const hLine = svg("line", { x1: 0, x2: W, class: "divider h" }, root);
  const dimA = svg("text", { y: 74, class: "dim" }, root);
  const dimB = svg("text", { y: 74, class: "dim" }, root);
  const dot = layer("point");
  svg("circle", { r: 44, class: "halo" }, dot);
  svg("circle", { r: 20, class: "core" }, dot);

  const ratio = (v) => (Math.max(v, 1 - v) / Math.min(v, 1 - v)).toFixed(3);
  const nearest = (v) => GUIDES.reduce((a, g) => (Math.abs(g.v - v) < Math.abs(a.v - v) ? g : a));
  const describe = (v, a, b) => `${a} ${(v * 100).toFixed(1)}% · ${b} ${((1 - v) * 100).toFixed(1)}%，${ratio(v)} : 1`;

  const draw = () => {
    const x = +inX.value, y = +inY.value, px = x * W, py = y * H;
    const step = +steps.querySelector("input:checked").value;
    root.dataset.step = step;
    root.classList.toggle("show-phi", showPhi.checked);
    root.classList.toggle("show-third", showThird.checked);
    vLine.setAttribute("x1", px);
    vLine.setAttribute("x2", px);
    hLine.setAttribute("y1", py);
    hLine.setAttribute("y2", py);
    dot.setAttribute("transform", `translate(${px} ${py})`);
    dimA.setAttribute("x", px / 2);
    dimB.setAttribute("x", (px + W) / 2);
    const big = x >= 0.5;
    dimA.textContent = big ? ratio(x) : "1";
    dimB.textContent = big ? "1" : ratio(x);
    // 主体：一座山，山尖顶在交点上；山脚两边不对称，看着自然
    peak.setAttribute("d", `M${px - 640} ${H}L${px - 90} ${py + 70}Q${px} ${py - 8} ${px + 70} ${py + 60}L${px + 380} ${H}Z`);
    // 辅助元素：太阳放在大块区域自己的黄金分割点上，文字行放在另一侧天空的留白里
    const sx = x >= 0.5 ? px * (1 - G) : px + (W - px) * G;
    sun.setAttribute("cx", sx);
    sun.setAttribute("cy", py * (1 - G));
    const tx0 = x >= 0.5 ? px + 64 : 64, tx1 = x >= 0.5 ? W - 64 : px - 64;
    text.forEach((r, i) => {
      r.setAttribute("x", tx0);
      r.setAttribute("y", py * (1 - G) - 40 + i * 30);
      r.setAttribute("width", Math.max(0, (tx1 - tx0) * [0.82, 1, 0.9, 0.5][i]));
    });
    outX.textContent = describe(x, "左", "右");
    outY.textContent = describe(y, "上", "下");
    const nx = nearest(x), ny = nearest(y);
    outNear.textContent = `竖线最近：${nx.name}（差 ${(Math.abs(nx.v - x) * 100).toFixed(1)}%）· 横线最近：${ny.name}（差 ${(Math.abs(ny.v - y) * 100).toFixed(1)}%）`;
  };

  const snapTo = (v) => {
    if (!snap.checked) return v;
    const hit = [1 - G, G].find((g) => Math.abs(g - v) < 0.035);
    return hit ?? v;
  };
  // 拖动画面：离竖线近就拖竖线，离横线近就拖横线；按下的位置离两条都远就两条一起拖
  let grab = null;
  drag(root, ({ x, y }, e) => {
    const fx = clamp(x / W, 0.1, 0.9), fy = clamp(y / H, 0.1, 0.9);
    if (e.type === "pointerdown") {
      const dx = Math.abs(x - inX.value * W), dy = Math.abs(y - inY.value * H);
      grab = dx < 90 && dx < dy ? "x" : dy < 90 ? "y" : "xy";
      if (+steps.querySelector("input:checked").value < 2) grab = "x";
    }
    if (grab.includes("x")) inX.value = snapTo(fx).toFixed(3);
    if (grab.includes("y")) inY.value = snapTo(fy).toFixed(3);
    draw();
  });
  for (const el of [inX, inY, showPhi, showThird]) el.addEventListener("input", draw);
  snap.addEventListener("change", () => {
    inX.value = snapTo(+inX.value).toFixed(3);
    inY.value = snapTo(+inY.value).toFixed(3);
    draw();
  });
  steps.addEventListener("change", draw);
  draw();
}
