import { PHI, svg, tween } from "./util.js";

// 每个比例：长边（短边 = 1）、整数边（有的话，用来标正方形的边长）、连分数、一句说明
const RATIOS = {
  "1:1": { r: 1, int: [1, 1], cf: "[1]", note: "正方形切掉一个正方形，什么都不剩。" },
  "4:3": { r: 4 / 3, int: [4, 3], cf: "[1; 3]", note: "老电视和很多手机相机的画幅。切一刀剩下 1 : 3 的细条，形状全变了。" },
  "3:2": { r: 3 / 2, int: [3, 2], cf: "[1; 2]", note: "35 毫米胶片的画幅。切一刀剩下 1 : 2，再切两刀就切完了。" },
  "√2": { r: Math.SQRT2, cf: "[1; 2, 2, 2, …]", note: "A4 纸的比例。它的本事是对折后还是 √2（A4 折成 A5），切正方形却不行。" },
  "16:9": { r: 16 / 9, int: [16, 9], cf: "[1; 1, 3, 2]", note: "屏幕和视频的比例。切一刀剩下 9 : 7，接近方形，和原来差得远。" },
  φ: { r: PHI, cf: "[1; 1, 1, 1, …]", note: "唯一的一个：切掉正方形，剩下的还是 1 : 1.618。可以一直切下去，每次都只切一个。" },
};

const VW = 1000, VH = 620, H = 430, TOP = (VH - H) / 2;

// 欧几里得辗转相除：每次从长边那头切一个以短边为边长的正方形
function tiles(r, max = 9) {
  let x = 0, y = 0, w = r, h = 1;
  const out = [];
  while (out.length < max && Math.min(w, h) > 1e-3) {
    const s = Math.min(w, h);
    out.push({ x, y, s });
    if (w >= h) { x += s; w -= s; } else { y += s; h -= s; }
    if (Math.abs(w) < 1e-9 || Math.abs(h) < 1e-9) break;
  }
  return out;
}

export function initLab() {
  const root = document.getElementById("lab-svg");
  const form = document.getElementById("lab-ratios");
  const outR = document.getElementById("lab-r");
  const outRest = document.getElementById("lab-rest");
  const outSim = document.getElementById("lab-sim");
  const outCf = document.getElementById("lab-cf");
  const outNote = document.getElementById("lab-note");

  const frame = svg("rect", { class: "frame", y: TOP, height: H }, root);
  const tileLayer = svg("g", {}, root);
  const ghost = svg("rect", { class: "ghost" }, root);
  let width = PHI * H, stop = () => {};

  const place = (key, w, reveal) => {
    const spec = RATIOS[key];
    const x0 = (VW - w) / 2, u = w / spec.r;
    frame.setAttribute("x", x0);
    frame.setAttribute("width", w);
    tileLayer.replaceChildren();
    const list = tiles(spec.r);
    let last = -1, run = -1;
    list.forEach((t, i) => {
      if (Math.abs(t.s - last) > 1e-9) run++;
      const g = svg("g", { class: `tile t${run % 3}`, style: `opacity:${reveal(i, list.length)}` }, tileLayer);
      svg("rect", { x: x0 + t.x * u, y: TOP + t.y * u, width: t.s * u, height: t.s * u }, g);
      const side = t.s * u;
      if (side > 46) {
        const txt = svg("text", { x: x0 + (t.x + t.s / 2) * u, y: TOP + (t.y + t.s / 2) * u, class: "side", style: `font-size:${Math.min(64, side * 0.3)}px` }, g);
        txt.textContent = spec.int ? +(t.s * spec.int[1]).toFixed(3) : t.s.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
      }
      last = t.s;
    });
    // 把原矩形缩小、转 90°，套在第一刀剩下的部分上
    const rest = spec.r - 1;
    const show = rest > 1e-6 && reveal(list.length, list.length) > 0;
    ghost.style.opacity = show ? reveal(list.length, list.length) : 0;
    if (rest > 1e-6) {
      const gw = rest * u, gh = rest * spec.r * u;
      const gx = x0 + u, gy = TOP + (H - gh) / 2;
      Object.entries({ x: gx, y: gy, width: gw, height: gh }).forEach(([k, v]) => ghost.setAttribute(k, v));
    }
  };

  const choose = (key) => {
    const spec = RATIOS[key];
    const rest = spec.r - 1;
    outR.textContent = `${spec.r.toFixed(3)} : 1`;
    outRest.textContent = rest > 1e-6 ? `${(1 / rest).toFixed(3)} : 1` : "空";
    const sim = rest > 1e-6 && Math.abs(1 / rest - spec.r) < 1e-6;
    outSim.textContent = rest <= 1e-6 ? "无从比较" : sim ? "相似，还是它自己" : `不相似，差 ${Math.abs(1 / rest - spec.r).toFixed(3)}`;
    outSim.classList.toggle("hit", sim);
    root.classList.toggle("hit", sim);
    outCf.textContent = spec.cf;
    outNote.textContent = spec.note;

    stop();
    const from = width, to = spec.r * H;
    const n = tiles(spec.r).length;
    // 先变形，再一块一块切
    stop = tween(560, (k) => {
      width = from + (to - from) * k;
      place(key, width, () => (k === 1 ? 1 : 0));
      if (k === 1) stop = tween(260 * (n + 1), (_, p) => place(key, width, (i, total) => Math.min(1, Math.max(0, p * (total + 1) - i))));
    });
  };

  form.addEventListener("change", (e) => choose(e.target.value));
  choose(form.querySelector("input:checked").value);
}
