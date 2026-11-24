import { PHI, setRange, svg, tween } from "./util.js";
import { BOX, PHI_D } from "./glyphs.js";

// 相邻斐波那契数之比 F(n+1)/F(n)，在 φ 上下来回跳着靠近
export function initFib() {
  const root = document.getElementById("fib-svg");
  const input = document.getElementById("fib-n");
  const outN = document.getElementById("fib-n-out");
  const outFrac = document.getElementById("fib-frac");
  const outErr = document.getElementById("fib-err");
  const play = document.getElementById("fib-play");

  const N = 20, F = [1, 1];
  while (F.length < N + 2) F.push(F.at(-1) + F.at(-2));
  const VW = 800, VH = 420, L = 64, R = 776, T = 28, B = 372, LO = 0.9, HI = 2.1;
  const X = (n) => L + ((n - 1) / (N - 1)) * (R - L);
  const Y = (v) => B - ((v - LO) / (HI - LO)) * (B - T);

  for (const v of [1, 1.5, 2]) {
    svg("line", { x1: L, x2: R, y1: Y(v), y2: Y(v), class: "grid" }, root);
    svg("text", { x: L - 12, y: Y(v), class: "tick-y" }, root).textContent = v.toFixed(1);
  }
  for (const n of [1, 5, 10, 15, 20]) svg("text", { x: X(n), y: B + 30, class: `tick-x${n === 20 ? " last" : ""}` }, root).textContent = `n=${n}`;
  svg("line", { x1: L, x2: R, y1: Y(PHI), y2: Y(PHI), class: "phi" }, root);
  // 「φ = 1.6180…」：φ 用画出来的字形（Fraunces 没有 φ），斜体跟着字一起斜；字号随屏宽变，量完字再摆
  const label = svg("text", { x: R, y: Y(PHI) - 12, class: "phi-label" }, root);
  label.textContent = "= 1.6180…";
  const glyph = svg("path", { d: PHI_D, class: "phi-glyph", "aria-hidden": "true" }, root);
  const placeGlyph = () => {
    const size = parseFloat(getComputedStyle(label).fontSize), k = size / 1000;
    const x = R - label.getComputedTextLength() - 0.25 * size - BOX.w * k;
    glyph.setAttribute("transform", `translate(${x} ${Y(PHI) - 12}) skewX(-10) scale(${k}) translate(0 ${-BOX.base})`);
  };
  placeGlyph();
  document.fonts.ready.then(placeGlyph);
  matchMedia("(max-width: 600px)").addEventListener("change", placeGlyph);
  const path = svg("polyline", { class: "zig" }, root);
  const dots = Array.from({ length: N }, (_, i) => svg("circle", { cx: X(i + 1), cy: Y(F[i + 1] / F[i]), r: 6, class: "dot" }, root));
  const ring = svg("circle", { r: 14, class: "ring" }, root);

  const draw = () => {
    const n = +input.value;
    path.setAttribute("points", dots.slice(0, n).map((d) => `${d.getAttribute("cx")},${d.getAttribute("cy")}`).join(" "));
    dots.forEach((d, i) => d.classList.toggle("off", i >= n));
    ring.setAttribute("cx", dots[n - 1].getAttribute("cx"));
    ring.setAttribute("cy", dots[n - 1].getAttribute("cy"));
    const a = F[n], b = F[n - 1], v = a / b, err = v - PHI;
    outN.textContent = n;
    outFrac.textContent = `${a} ÷ ${b} = ${v.toFixed(10)}`;
    outErr.textContent = `${err >= 0 ? "高出" : "低了"} ${Math.abs(err).toFixed(10)}`;
  };
  input.addEventListener("input", draw);

  let stop = () => {};
  play.addEventListener("click", () => {
    stop();
    stop = tween(300 * (N - 1), (_, p) => setRange(input, 1 + Math.round(p * (N - 1))));
  });
  draw();
}
