// 01 之后各节的小图：都是 SVG，状态是几个数，改了就整张重画。
import { reducedMotion } from "../../lib/stage.js";
import { balance, classifyDetail, clamp, frameDiagonals, lines45, rhythm, rhythmText, snapDetail } from "./geo.js";

const $ = (id) => document.getElementById(id);
const f1 = (x) => +x.toFixed(1);
const press = (group, attr, value) => group.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr] === value)));

function shapePath(kind, s) {
  if (kind === 0) return `<circle r="${f1(s * 0.5)}"/>`;
  if (kind === 1) return `<rect x="${f1(-s * 0.42)}" y="${f1(-s * 0.42)}" width="${f1(s * 0.84)}" height="${f1(s * 0.84)}"/>`;
  return `<path d="M0 ${f1(-s * 0.55)}L${f1(s * 0.5)} ${f1(s * 0.4)}L${f1(-s * 0.5)} ${f1(s * 0.4)}Z"/>`;
}

// 一个区块第一次滚进来时调 fn
const onFirstView = (el, fn) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.35 });
  io.observe(el);
};

// ---------- 02 视线沿线走 ----------
function pathFigure() {
  const svg = $("path-svg"), out = $("path-text"), btns = [...document.querySelectorAll("[data-path]")];
  const W = 400, H = 300;
  const MODES = {
    row: { a: [28, 150], b: [372, 150], text: "一排站齐：读起来像一张清单，有先后，没有方向。画面安稳，眼睛走完一遍就出去了。" },
    up: { a: [22, 280], b: [378, 20], text: "从左下角起、往右上角收：对习惯从左往右读的人，这条线常被读成上升、前进、变好。增长、出发、起飞都爱用它。" },
    down: { a: [22, 20], b: [378, 280], text: "从左上角起、往右下角落：常被读成下坡、滑行、落地。也能用，只是情绪往下走：放松，或者坠落。" },
  };
  const TS = [0.16, 0.39, 0.62, 0.85];
  const SIZES = [64, 50, 40, 32];
  let mode = "up", anim = 0;
  svg.innerHTML = `
    <rect width="${W}" height="${H}" class="fr-bg"/>
    <path id="path-line" class="p-line"/>
    <path id="path-trail" class="p-trail"/>
    ${TS.map((_, i) => `<g class="p-item" id="pi-${i}"><g class="p-shape">${shapePath(i % 3, SIZES[i])}</g><text class="p-num" y="5">${i + 1}</text></g>`).join("")}
    <circle id="path-eye" class="p-eye" r="9"/>
    <text id="p-start" class="p-end">起</text><text id="p-stop" class="p-end">止</text>`;
  const line = $("path-line"), trail = $("path-trail"), eye = $("path-eye");
  const lerp = (m, t) => [m.a[0] + (m.b[0] - m.a[0]) * t, m.a[1] + (m.b[1] - m.a[1]) * t];

  function layout() {
    const m = MODES[mode];
    line.setAttribute("d", `M${m.a}L${m.b}`);
    TS.forEach((t, i) => {
      const [x, y] = lerp(m, t);
      $(`pi-${i}`).style.transform = `translate(${f1(x)}px, ${f1(y)}px)`;
    });
    $("p-start").setAttribute("x", m.a[0] - 6); $("p-start").setAttribute("y", m.a[1] + (m.a[1] > 150 ? 14 : m.a[1] < 150 ? 8 : 30));
    $("p-stop").setAttribute("x", m.b[0] - 10); $("p-stop").setAttribute("y", m.b[1] + (m.b[1] > 150 ? 14 : m.b[1] < 150 ? 8 : 30));
    out.textContent = m.text;
    press(btns, "path", mode);
  }

  function play() {
    cancelAnimationFrame(anim);
    const m = MODES[mode];
    const lit = (t) => TS.forEach((ti, i) => $(`pi-${i}`).classList.toggle("lit", t >= ti - 0.02));
    if (reducedMotion.matches) {
      eye.setAttribute("cx", m.b[0]); eye.setAttribute("cy", m.b[1]);
      trail.setAttribute("d", `M${m.a}L${m.b}`);
      lit(1);
      return;
    }
    const t0 = performance.now(), dur = 2600;
    const step = (now) => {
      const t = clamp((now - t0 - 500) / dur, 0, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const [x, y] = lerp(m, e);
      eye.setAttribute("cx", f1(x)); eye.setAttribute("cy", f1(y));
      trail.setAttribute("d", `M${m.a}L${f1(x)} ${f1(y)}`);
      lit(e);
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  btns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.path; layout(); play(); }));
  $("path-play").addEventListener("click", play);
  layout();
  const m = MODES[mode];
  eye.setAttribute("cx", m.a[0]); eye.setAttribute("cy", m.a[1]);
  onFirstView(svg, play);
}

// ---------- 03 四条 45° 线 ----------
function diagonalMethod() {
  const frame = $("dm-frame"), svg = $("dm-svg"), detail = $("dm-detail"), out = $("dm-text");
  const btns = [...document.querySelectorAll("[data-ratio]")], showDiag = $("dm-frame-diag");
  const state = { r: 4 / 3, u: 0.66, v: 0.3 };

  function render() {
    const { r } = state, S = 100, w = r * S;
    const info = classifyDetail(state, r);
    svg.setAttribute("viewBox", `0 0 ${f1(w)} ${S}`);
    const seg = ({ a, b }) => `M${f1(a[0] * S)} ${f1(a[1] * S)}L${f1(b[0] * S)} ${f1(b[1] * S)}`;
    const arcs = lines45(r).map(({ a, b }) => {
      const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), k = 9;
      const p = [a[0] * S, a[1] * S];
      return `M${f1(p[0] + dx * k)} ${f1(p[1])}A${k} ${k} 0 0 ${dx * dy > 0 ? 1 : 0} ${f1(p[0] + dx * k * 0.7071)} ${f1(p[1] + dy * k * 0.7071)}`;
    }).join("");
    svg.innerHTML = `
      <rect width="${f1(w)}" height="${S}" class="fr-bg"/>
      ${showDiag.checked ? `<path class="dm-fd" d="${frameDiagonals(r).map(seg).join("")}"/>` : ""}
      ${lines45(r).map((l) => `<path class="dm-l${onLine(l) ? " hot" : ""}" d="${seg(l)}"/>`).join("")}
      <path class="dm-arc" d="${arcs}"/>`;
    detail.style.left = `${state.u * 100}%`;
    detail.style.top = `${state.v * 100}%`;
    detail.classList.toggle("on", info.kind === "on");
    out.textContent = info.text;
    out.dataset.kind = info.kind;
  }
  // 细节压着的那几条线都亮
  const onLine = (l) => {
    const p = [state.u * state.r, state.v];
    const dx = l.b[0] - l.a[0], dy = l.b[1] - l.a[1];
    const t = clamp(((p[0] - l.a[0]) * dx + (p[1] - l.a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    return Math.hypot(p[0] - l.a[0] - t * dx, p[1] - l.a[1] - t * dy) < 0.004;
  };

  function setRatio(r) {
    state.r = r;
    frame.style.setProperty("--r", r);
    press(btns, "ratio", btns.find((b) => Math.abs(+b.dataset.ratio - r) < 0.001)?.dataset.ratio);
    render();
  }

  const move = (e) => {
    const rect = frame.getBoundingClientRect();
    const pos = { u: clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98), v: clamp((e.clientY - rect.top) / rect.height, 0.02, 0.98) };
    Object.assign(state, snapDetail(pos, state.r));
    render();
  };
  let drag = null;
  detail.addEventListener("pointerdown", (e) => { drag = e.pointerId; detail.setPointerCapture(e.pointerId); detail.classList.add("dragging"); e.preventDefault(); });
  detail.addEventListener("pointermove", (e) => { if (drag === e.pointerId) move(e); });
  const up = (e) => { if (drag === e.pointerId) { drag = null; detail.classList.remove("dragging"); } };
  detail.addEventListener("pointerup", up);
  detail.addEventListener("pointercancel", up);
  frame.addEventListener("click", (e) => { if (e.target !== detail && !detail.contains(e.target)) move(e); });
  detail.addEventListener("keydown", (e) => {
    const s = e.shiftKey ? 0.06 : 0.025;
    const k = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (!k) return;
    e.preventDefault();
    const pos = { u: clamp(state.u + k[0] / state.r, 0.02, 0.98), v: clamp(state.v + k[1], 0.02, 0.98) };
    const snapped = snapDetail(pos, state.r);
    const p = [pos.u * state.r, pos.v], q = [snapped.u * state.r, snapped.v];
    Object.assign(state, Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.015 ? snapped : pos);
    render();
  });
  btns.forEach((b) => b.addEventListener("click", () => setRatio(+b.dataset.ratio)));
  showDiag.addEventListener("change", render);
  setRatio(state.r);
}

// ---------- 04 节奏与大小 ----------
function rhythmFigure() {
  const svg = $("rh-svg"), out = $("rh-text"), nIn = $("rh-n"), cIn = $("rh-c"), follow = $("rh-follow");
  const btns = [...document.querySelectorAll("[data-big]")];
  const A = [52, 250], B = [348, 50], BASE = 70;
  let bigFar = false, count = 0;
  svg.innerHTML = `<rect width="400" height="300" class="fr-bg"/><path class="rh-line" d="M18 273L382 27"/><g id="rh-items"></g>`;
  const group = $("rh-items");

  function render() {
    const n = +nIn.value, c = +cIn.value / 100;
    if (n !== count) {
      count = n;
      group.innerHTML = Array.from({ length: n }, (_, i) => `<g class="rh-item k${i % 2}"><g class="rh-s">${shapePath(i % 3, BASE)}</g></g>`).join("");
    }
    const items = rhythm(n, c, follow.checked, bigFar);
    [...group.children].forEach((g, i) => {
      const { t, s } = items[i];
      const x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t;
      const scale = s * (n > 6 ? 0.78 : 1);
      g.style.transform = `translate(${f1(x)}px, ${f1(y)}px) scale(${scale.toFixed(3)})`;
    });
    // 小的画在下面，大的压上来
    const order = items.map((it, i) => [it.s, group.children[i]]).sort((p, q) => p[0] - q[0]);
    for (const [, el] of order) group.append(el);
    $("rh-n-val").textContent = n;
    $("rh-c-val").textContent = `${Math.round(c * 100)}%`;
    out.textContent = rhythmText(c, follow.checked, bigFar);
    press(btns, "big", bigFar ? "far" : "near");
  }
  nIn.addEventListener("input", render);
  cIn.addEventListener("input", render);
  follow.addEventListener("change", render);
  btns.forEach((b) => b.addEventListener("click", () => { bigFar = b.dataset.big === "far"; render(); }));
  render();
}

// ---------- 05 两侧留白 ----------
function balanceFigure() {
  const svg = $("bal-svg"), out = $("bal-text"), range = $("bal-range"), title = $("bal-title"), val = $("bal-val");
  const S = 300, BW = 0.13;
  function render() {
    const shift = +range.value / 100, s = 1 + shift;
    const b = balance(shift, title.checked);
    // y 向上的 x + y = s 换到 SVG（y 向下）：Y = S·(1 − s + x)
    const P = (x, yUp) => `${f1(x * S)} ${f1((1 - yUp) * S)}`;
    const band = (o) => `M${P(-0.2, s + o + 0.2)}L${P(1.2, s + o - 1.2)}`;
    const lowPoly = `M${P(-0.2, s + 0.2)}L${P(1.2, s - 1.2)}L${P(1.2, -1)}L${P(-0.2, -1)}Z`;
    const mid = [clamp(s / 2, 0.1, 0.9), 0]; mid[1] = s - mid[0];
    const along = [-0.3, 0, 0.3].map((k) => [mid[0] + k * 0.7071 * 0.9, mid[1] - k * 0.7071 * 0.9]);
    const bigLow = b.a > 50;
    const tt = title.checked
      ? bigLow
        ? `<g class="bal-title"><text x="18" y="${S - 54}" class="bt-big">冲刺</text><text x="20" y="${S - 26}" class="bt-small">SPRINT · 5KM</text></g>`
        : `<g class="bal-title" text-anchor="end"><text x="${S - 18}" y="62" class="bt-big">冲刺</text><text x="${S - 20}" y="90" class="bt-small">SPRINT · 5KM</text></g>`
      : "";
    const lbl = (x, y, v) => (v >= 9 ? `<text class="bal-pct" x="${f1(x * S)}" y="${f1((1 - y) * S)}">${v}%</text>` : "");
    svg.innerHTML = `
      <defs><clipPath id="bal-clip"><rect width="${S}" height="${S}"/></clipPath></defs>
      <g clip-path="url(#bal-clip)">
        <rect width="${S}" height="${S}" class="bal-bg"/>
        <path d="${lowPoly}" class="bal-low"/>
        <path d="${band(BW / 2)}L${P(1.2, s - BW / 2 - 1.2)}L${P(-0.2, s - BW / 2 + 0.2)}Z" class="bal-band"/>
        ${along.map(([x, y], i) => `<g transform="translate(${f1(x * S)} ${f1((1 - y) * S)})" class="bal-shape">${shapePath(i, 30 - i * 5)}</g>`).join("")}
        ${lbl(0.12, 0.1, b.a)}${lbl(0.8, 0.88, b.b)}
        ${tt}
      </g>`;
    val.textContent = `左下 ${b.a} : 右上 ${b.b}`;
    out.textContent = b.text;
    out.dataset.kind = b.ok ? "on" : "off";
  }
  range.addEventListener("input", render);
  title.addEventListener("change", render);
  render();
}

// ---------- 07 小练习 ----------
function quiz() {
  const POSTERS = {
    a: { angle: 8, at: [60, 92], len: 118, title: [10, 26], text: "A 斜了 8°：不像故意的，像没放平。看的人想把它扶正，而不是跟着它走。" },
    b: { angle: 52, at: [14, 156], len: 150, sizes: [1, 0.78, 0.6, 0.45], title: [10, 26], small: true, best: true, text: "B 最好。光带从左下角起、往右上角收，斜得明确；圆、方、三角近大远小，拉出了纵深；标题坐在左上那片空着的三角里，给另一侧配了重。" },
    c: { angle: 45, at: [8, 154], len: 160, sizes: [0.7, 0.7, 0.7, 0.7, 0.7, 0.7], crowd: true, title: [34, 86], text: "C 角度没问题，可两侧都塞满了，标题还压在光带上。斜线两边要留白，眼睛才有路可走。" },
    d: { angle: 86, at: [64, 160], len: 150, title: [10, 26], text: "D 将近竖直，像一根要倒的柱子。斜线该有的「往前」没了，只剩不稳。" },
  };
  for (const [k, p] of Object.entries(POSTERS)) {
    const a = (p.angle * Math.PI) / 180, d = [Math.cos(a), -Math.sin(a)], n = [Math.sin(a), Math.cos(a)];
    const centred = k === "a";
    const p0 = centred ? [p.at[0] - d[0] * p.len / 2, p.at[1] - d[1] * p.len / 2] : p.at;
    const p1 = [p0[0] + d[0] * p.len, p0[1] + d[1] * p.len];
    const w0 = 30, w1 = 8;
    const band = `M${f1(p0[0] + n[0] * w0 / 2)} ${f1(p0[1] + n[1] * w0 / 2)}L${f1(p1[0] + n[0] * w1 / 2)} ${f1(p1[1] + n[1] * w1 / 2)}L${f1(p1[0] + d[0] * 10)} ${f1(p1[1] + d[1] * 10)}L${f1(p1[0] - n[0] * w1 / 2)} ${f1(p1[1] - n[1] * w1 / 2)}L${f1(p0[0] - n[0] * w0 / 2)} ${f1(p0[1] - n[1] * w0 / 2)}Z`;
    const sizes = p.sizes || [0.62, 0.62, 0.62, 0.62];
    const shapes = sizes.map((s, i) => {
      const t = 0.16 + (i / sizes.length) * 0.78;
      const x = p0[0] + (p1[0] - p0[0]) * t, y = p0[1] + (p1[1] - p0[1]) * t;
      return `<g transform="translate(${f1(x)} ${f1(y)})" class="${i % 2 ? "q-c" : "q-d"}">${shapePath(i % 3, 18 * s)}</g>`;
    }).join("");
    const crowd = p.crowd ? `<g class="q-txt"><rect x="70" y="112" width="42" height="4"/><rect x="70" y="120" width="36" height="4"/><rect x="70" y="128" width="40" height="4"/><rect x="70" y="136" width="30" height="4"/><rect x="8" y="12" width="40" height="4"/><rect x="8" y="20" width="34" height="4"/><rect x="8" y="28" width="38" height="4"/><rect x="74" y="14" width="34" height="14"/><circle cx="96" cy="58" r="9"/></g>` : "";
    const small = p.small ? `<g class="q-txt"><rect x="78" y="136" width="32" height="3"/><rect x="84" y="143" width="26" height="3"/></g>` : "";
    $(`q-${k}`).innerHTML = `<rect width="120" height="160" class="q-bg"/><path d="${band}" class="q-band"/>${shapes}${crowd}<text x="${p.title[0]}" y="${p.title[1]}" class="q-title">冲刺</text><text x="${p.title[0] + 1}" y="${p.title[1] + 12}" class="q-sub">SPRINT</text>${small}`;
  }
  const picks = [...document.querySelectorAll("[data-pick]")], out = $("quiz-text");
  picks.forEach((b) => b.addEventListener("click", () => {
    const p = POSTERS[b.dataset.pick];
    picks.forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("right", x === b && !!p.best); x.classList.toggle("wrong", x === b && !p.best); });
    out.textContent = p.text;
    out.dataset.kind = p.best ? "on" : "off";
  }));
}

// ---------- 08 原海报 ----------
function posterViewer() {
  const dlg = $("viewer"), img = $("viewer-img"), scroll = $("viewer-scroll"), poster = $("poster");
  const levels = [1, 1.5, 2, 3];
  let z = 0;
  const apply = () => {
    const base = Math.min(scroll.clientWidth, (scroll.clientHeight * 1086) / 1448);
    img.style.width = `${Math.round(base * levels[z])}px`;
    $("zoom-val").textContent = `${levels[z] * 100}%`;
    $("zoom-out").disabled = z === 0;
    $("zoom-in").disabled = z === levels.length - 1;
  };
  $("poster-open").addEventListener("click", () => {
    if (!img.src) img.src = poster.currentSrc || poster.src;
    z = 0;
    dlg.showModal();
    apply();
    scroll.focus();
  });
  $("zoom-in").addEventListener("click", () => { z = Math.min(levels.length - 1, z + 1); apply(); });
  $("zoom-out").addEventListener("click", () => { z = Math.max(0, z - 1); apply(); });
  $("viewer-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  let pan = null;
  scroll.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { pan = { x: e.clientX, y: e.clientY, l: scroll.scrollLeft, t: scroll.scrollTop }; scroll.setPointerCapture(e.pointerId); scroll.classList.add("panning"); } });
  scroll.addEventListener("pointermove", (e) => { if (pan) { scroll.scrollLeft = pan.l - (e.clientX - pan.x); scroll.scrollTop = pan.t - (e.clientY - pan.y); } });
  const stop = () => { pan = null; scroll.classList.remove("panning"); };
  scroll.addEventListener("pointerup", stop);
  scroll.addEventListener("pointercancel", stop);
  addEventListener("resize", () => { if (dlg.open) apply(); });
}

function reveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px 10% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

export function initFigures() {
  pathFigure();
  diagonalMethod();
  rhythmFigure();
  balanceFigure();
  quiz();
  posterViewer();
  reveals();
}
