import { PHI, clamp, drag, setRange, svg, tween } from "./util.js";

// 一条线段切一刀：全长÷长段 和 长段÷短段，只有切在 0.618 时相等
export function initCut() {
  const root = document.getElementById("cut-svg");
  const input = document.getElementById("cut");
  const out = document.getElementById("cut-out");
  const whole = document.getElementById("cut-whole");
  const part = document.getElementById("cut-part");
  const verdict = document.getElementById("cut-verdict");
  const bars = [document.getElementById("bar-whole"), document.getElementById("bar-part")];
  const L = 60, R = 940, Y = 120;

  const segA = svg("line", { y1: Y, y2: Y, x1: L, class: "seg-a" }, root);
  const segB = svg("line", { y1: Y, y2: Y, x2: R, class: "seg-b" }, root);
  for (const x of [L, R]) svg("line", { x1: x, x2: x, y1: Y - 22, y2: Y + 22, class: "tick" }, root);
  const ghost = svg("line", { x1: L + (R - L) / PHI, x2: L + (R - L) / PHI, y1: Y - 46, y2: Y + 46, class: "ghost" }, root);
  const knob = svg("g", { class: "knob" }, root);
  svg("line", { x1: 0, x2: 0, y1: -34, y2: 34 }, knob);
  svg("circle", { r: 11, cx: 0, cy: 0 }, knob);
  const la = svg("text", { y: Y - 40, class: "lab" }, root);
  const lb = svg("text", { y: Y - 40, class: "lab" }, root);
  const ba = svg("path", { class: "brace" }, root);
  const bb = svg("path", { class: "brace" }, root);
  const ta = svg("text", { y: Y + 82, class: "val" }, root);
  const tb = svg("text", { y: Y + 82, class: "val" }, root);
  svg("path", { d: `M${L} ${Y + 132}v12H${R}v-12`, class: "brace whole" }, root);
  svg("text", { x: (L + R) / 2, y: Y + 176, class: "val" }, root).textContent = "a + b = 1";
  ghost.append(Object.assign(svg("title"), { textContent: "0.618 的位置" }));

  const brace = (x1, x2) => `M${x1 + 4} ${Y + 32}v10H${x2 - 4}v-10`;
  const draw = () => {
    const t = +input.value;
    const x = L + (R - L) * t;
    segA.setAttribute("x2", x);
    segB.setAttribute("x1", x);
    knob.setAttribute("transform", `translate(${x} ${Y})`);
    la.setAttribute("x", (L + x) / 2);
    lb.setAttribute("x", (x + R) / 2);
    la.textContent = "a";
    lb.textContent = "b";
    ba.setAttribute("d", brace(L, x));
    bb.setAttribute("d", brace(x, R));
    ta.setAttribute("x", (L + x) / 2);
    tb.setAttribute("x", (x + R) / 2);
    ta.textContent = t.toFixed(3);
    tb.textContent = (1 - t).toFixed(3);
    const w = 1 / t, p = t / (1 - t);
    whole.textContent = w.toFixed(3);
    part.textContent = p.toFixed(3);
    bars[0].style.setProperty("--v", clamp((w - 1) / 1.5, 0, 1));
    bars[1].style.setProperty("--v", clamp((p - 1) / 1.5, 0, 1));
    out.textContent = `${(t * 100).toFixed(1)}%`;
    const d = p - w;
    const hit = Math.abs(d) < 0.006;
    root.classList.toggle("hit", hit);
    verdict.classList.toggle("hit", hit);
    verdict.textContent = hit
      ? "两边相等：这就是 φ ≈ 1.618"
      : `还差 ${Math.abs(d).toFixed(3)}，${d > 0 ? "切点往左挪" : "切点往右挪"}`;
  };

  input.addEventListener("input", draw);
  drag(root, ({ x }) => setRange(input, clamp((x - L) / (R - L), +input.min, +input.max).toFixed(3)));
  let stop = () => {};
  document.getElementById("cut-phi").addEventListener("click", () => {
    stop();
    const from = +input.value, to = 1 / PHI;
    stop = tween(700, (k) => setRange(input, (from + (to - from) * k).toFixed(4)));
  });
  draw();
}
