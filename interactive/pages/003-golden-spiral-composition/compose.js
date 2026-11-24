// 第 02 节：夜海湾 + 带黄金螺旋的取景框。拖眼、换 8 种摆法、看视线沿螺旋走。
import { reducedMotion } from "../../lib/stage.js";
import { EYE, ORIENTS, PHI, QUARTER, TH0, orient, spiral, square, svgPath, toFrame } from "./spiral.js";

const NS = "http://www.w3.org/2000/svg";
const FW = 760, FH = FW / PHI; // 横幅取景框
const HORIZON = 432;
const TOP = 120, BOTTOM = 880; // 画面只用这一条：竖幅取景框正好 760 高
const TRUE = { oi: 2, x: 210, y: 230 }; // 画这幅景时用的那一种摆法：海湾的弧就是螺旋的大弧
const SUBJECTS = [
  { id: "lamp", name: "灯塔", x: 760, y: TRUE.y + (1 - EYE) * FH },
  { id: "moon", name: "月亮", x: 330, y: 282 },
  { id: "boat", name: "小船", x: 478, y: 520 },
];
const TURNS = 7; // 取景框里螺旋画到第几层
const PATH = spiral(TH0, TH0 - TURNS * QUARTER, 360).map(toFrame); // 归一化坐标
const SQUARES = Array.from({ length: 8 }, (_, k) => square(k).map(toFrame));
const MARK = [PATH[8], PATH[44], [EYE, EYE], [0.5 / PHI, 0.5]]; // 1 起点 2 流动 3 聚焦 4 平衡（最大那块方块的中心）
const STEP_P = [0.08, 0.42, 1, 1];

const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
};

export function compose() {
  const svg = document.getElementById("cmp-svg");
  const eyeBtn = document.getElementById("eye");
  const status = document.getElementById("cmp-status");
  const stepsEl = document.getElementById("steps");
  const gazeBtn = document.getElementById("gaze");

  scene(svg);

  // ---- 取景框和螺旋 ----
  const dim = el("path", { class: "c-dim", "fill-rule": "evenodd" }, svg);
  const ov = el("g", { class: "c-ov" }, svg);
  const balance = el("path", { class: "c-balance" }, ov);
  const sqs = el("path", { class: "c-sq" }, ov);
  const curve = el("path", { class: "c-curve" }, ov);
  const trail = el("path", { class: "c-trail", pathLength: 1 }, ov);
  const frameRect = el("rect", { class: "c-frame" }, ov);
  const marks = MARK.map((_, i) => {
    const g = el("g", { class: "c-mark" }, ov);
    el("circle", { r: 17 }, g);
    el("text", { "text-anchor": "middle", dy: "0.36em" }, g).textContent = String(i + 1);
    return g;
  });
  const dot = el("circle", { class: "c-dot", r: 9 }, ov);

  const st = { oi: 0, x: (1000 - FW) / 2, y: (TOP + BOTTOM - FH) / 2, p: -1, step: -1, morph: null };
  const dims = (o) => (o.tr ? [FH, FW] : [FW, FH]);
  const toWorld = (o, x, y) => { const [w, h] = dims(o); return ([u, v]) => { const [a, b] = orient([u, v], o); return [x + a * w, y + b * h]; }; };
  const eyeAt = (o, x, y) => toWorld(o, x, y)([EYE, EYE]);
  const clampPos = (o, x, y) => { const [w, h] = dims(o); return [Math.max(0, Math.min(1000 - w, x)), Math.max(TOP, Math.min(BOTTOM - h, y))]; };

  // 当前几何：所有点都在世界坐标里，换摆法时逐点插值，看起来像把框翻过去
  const geom = (oi, x, y) => {
    const o = ORIENTS[oi], f = toWorld(o, x, y), [w, h] = dims(o);
    return { path: PATH.map(f), squares: SQUARES.map((s) => s.map(f)), marks: MARK.map(f), rect: [x, y, w, h] };
  };
  const lerpG = (a, b, k) => {
    const L = (p, q) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    return { path: a.path.map((p, i) => L(p, b.path[i])), squares: a.squares.map((s, i) => s.map((p, j) => L(p, b.squares[i][j]))), marks: a.marks.map((p, i) => L(p, b.marks[i])), rect: a.rect.map((v, i) => v + (b.rect[i] - v) * k) };
  };

  function render() {
    let g = geom(st.oi, st.x, st.y);
    if (st.morph) g = lerpG(st.morph.from, g, st.morph.k);
    const [x, y, w, h] = g.rect;
    dim.setAttribute("d", `M0 ${TOP}H1000V${BOTTOM}H0Z M${x} ${y}h${w}v${h}h${-w}Z`);
    frameRect.setAttribute("x", x); frameRect.setAttribute("y", y);
    frameRect.setAttribute("width", w); frameRect.setAttribute("height", h);
    sqs.setAttribute("d", g.squares.map((s) => svgPath(s) + "Z").join(""));
    const d = svgPath(g.path);
    curve.setAttribute("d", d);
    trail.setAttribute("d", d);
    balance.setAttribute("d", svgPath(g.squares[0]) + "Z");
    const p = Math.max(0, Math.min(1, st.p));
    trail.style.strokeDasharray = st.p < 0 ? "0 1" : `${p} 1`;
    const pt = g.path[Math.round(p * (g.path.length - 1))];
    dot.setAttribute("cx", pt[0]); dot.setAttribute("cy", pt[1]);
    dot.style.opacity = st.p < 0 ? 0 : 1;
    marks.forEach((m, i) => {
      m.setAttribute("transform", `translate(${g.marks[i][0].toFixed(1)} ${g.marks[i][1].toFixed(1)})`);
      m.classList.toggle("on", st.step >= i || (st.p >= STEP_P[i] - 1e-6 && i < 3 && st.p >= 0));
      m.classList.toggle("now", st.step === i);
    });
    balance.classList.toggle("on", st.step === 3);
    const [ex, ey] = eyeAt(ORIENTS[st.oi], st.x, st.y);
    eyeBtn.style.left = `${ex / 10}%`;
    eyeBtn.style.top = `${((ey - TOP) / (BOTTOM - TOP)) * 100}%`;
    [...stepsEl.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-current", String(st.step === i)));
  }

  // ---- 状态文字 ----
  let lastMsg = "";
  function describe() {
    const [ex, ey] = eyeAt(ORIENTS[st.oi], st.x, st.y);
    const hit = SUBJECTS.find((s) => Math.hypot(s.x - ex, s.y - ey) < 4);
    const o = ORIENTS[st.oi];
    let msg;
    if (!hit) msg = "螺旋之眼落空了：曲线把视线送进去，那里什么也没有。拖动金色的眼，把它放到灯塔、月亮或小船上。";
    else if (hit.id === "lamp" && st.oi === TRUE.oi) msg = "对上了。眼落在灯塔上，螺旋的大弧正好贴着海湾：视线从月亮那边进场，顺着海岸线一路收紧，停在这盏灯上。";
    else if (hit.id === "lamp" && !o.tr) msg = "眼对上了灯塔，可曲线和海湾不是一个走向。换一种横幅摆法，让大弧顺着海岸线。";
    else if (hit.id === "lamp") msg = "竖幅也能把眼放到灯塔上，只是海湾是横着展开的，大弧贴不上它。横幅更顺。";
    else if (hit.id === "moon") msg = "眼落在月亮上：月亮成了焦点，海湾和灯塔退成陪衬。也成立，只是讲了另一个故事。";
    else msg = "眼落在小船上：小船成了主角，螺旋的大弧要从它周围的空水面绕进来。";
    if (msg !== lastMsg) status.textContent = lastMsg = msg;
    status.dataset.hit = hit ? (hit.id === "lamp" && st.oi === TRUE.oi ? "best" : "ok") : "none";
  }

  // 眼离某个主体够近就吸过去
  function moveEyeTo(ex, ey) {
    const o = ORIENTS[st.oi];
    const near = SUBJECTS.find((s) => Math.hypot(s.x - ex, s.y - ey) < 38);
    if (near) [ex, ey] = [near.x, near.y];
    const [w, h] = dims(o), [a, b] = orient([EYE, EYE], o);
    [st.x, st.y] = clampPos(o, ex - a * w, ey - b * h);
  }

  // ---- 8 种摆法的按钮 ----
  const rows = [document.getElementById("o-land"), document.getElementById("o-port")];
  const oButtons = ORIENTS.map((o, i) => {
    const [w, h] = o.tr ? [28, 45] : [45, 28];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "o-btn";
    b.setAttribute("aria-label", `${o.tr ? "竖幅" : "横幅"}，眼在${orient([EYE, EYE], o)[1] < 0.5 ? "上" : "下"}${orient([EYE, EYE], o)[0] < 0.5 ? "左" : "右"}`);
    const s = el("svg", { viewBox: `-2 -2 ${w + 4} ${h + 4}`, width: w + 4, height: h + 4, "aria-hidden": "true" }, b);
    el("rect", { x: 0, y: 0, width: w, height: h }, s);
    el("path", { d: svgPath(PATH.slice(0, 260), (p) => { const [u, v] = orient(p, o); return [u * w, v * h]; }) }, s);
    b.addEventListener("click", () => setOrient(i));
    rows[o.tr ? 1 : 0].append(b);
    return b;
  });

  let anim = 0;
  const tween = (ms, fn, done) => {
    cancelAnimationFrame(anim);
    if (reducedMotion.matches) { fn(1); done?.(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      fn(k);
      if (k < 1) anim = requestAnimationFrame(step); else done?.();
    };
    anim = requestAnimationFrame(step);
  };
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

  function setOrient(i) {
    if (i === st.oi) return;
    const from = geom(st.oi, st.x, st.y);
    const [ex, ey] = eyeAt(ORIENTS[st.oi], st.x, st.y); // 换摆法时眼尽量不动
    st.oi = i;
    moveEyeTo(ex, ey);
    st.p = -1; st.step = -1;
    oButtons.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    tween(520, (k) => { st.morph = k < 1 ? { from, k: ease(k) } : null; render(); });
    describe();
  }

  // ---- 拖眼 ----
  const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 1000, TOP + ((e.clientY - r.top) / r.height) * (BOTTOM - TOP)]; };
  let drag = null;
  eyeBtn.addEventListener("pointerdown", (e) => {
    const [px, py] = toSvg(e), [ex, ey] = eyeAt(ORIENTS[st.oi], st.x, st.y);
    drag = { dx: ex - px, dy: ey - py };
    eyeBtn.setPointerCapture(e.pointerId);
    eyeBtn.classList.add("drag");
    e.preventDefault();
  });
  eyeBtn.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const [px, py] = toSvg(e);
    moveEyeTo(px + drag.dx, py + drag.dy);
    render(); describe();
  });
  const endDrag = () => { drag = null; eyeBtn.classList.remove("drag"); };
  eyeBtn.addEventListener("pointerup", endDrag);
  eyeBtn.addEventListener("pointercancel", endDrag);
  eyeBtn.addEventListener("keydown", (e) => {
    const d = e.shiftKey ? 40 : 10;
    const v = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (!v) return;
    e.preventDefault();
    const [ex, ey] = eyeAt(ORIENTS[st.oi], st.x, st.y);
    // 键盘一步走 10，吸附半径 38：先离开当前主体，免得被吸回去
    const o = ORIENTS[st.oi], [w, h] = dims(o), [a, b] = orient([EYE, EYE], o);
    const nx = ex + v[0], ny = ey + v[1];
    const near = SUBJECTS.find((s) => Math.hypot(s.x - nx, s.y - ny) < 38 && Math.hypot(s.x - ex, s.y - ey) > 4);
    [st.x, st.y] = clampPos(o, (near ? near.x : nx) - a * w, (near ? near.y : ny) - b * h);
    render(); describe();
  });

  // ---- 视线怎么走 ----
  function showStep(i) {
    cancelAnimationFrame(anim);
    st.morph = null;
    st.step = i;
    st.p = STEP_P[i];
    render();
  }
  stepsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-step]");
    if (b) showStep(+b.dataset.step);
  });
  gazeBtn.addEventListener("click", () => {
    st.morph = null;
    if (reducedMotion.matches) return showStep(3);
    st.step = -1;
    tween(5200, (k) => {
      st.p = k;
      st.step = k < STEP_P[0] ? 0 : k < STEP_P[1] ? 1 : k < 0.999 ? 2 : 3;
      render();
    }, () => setTimeout(() => { if (st.p === 1) { st.step = 3; render(); } }, 500));
  });

  oButtons[st.oi].setAttribute("aria-pressed", "true");
  oButtons.forEach((b, j) => j !== st.oi && b.setAttribute("aria-pressed", "false"));
  render();
  describe();
}

// ---- 场景：画这幅夜海湾时，海岸线就是正确摆法下螺旋的大弧 ----
function scene(svg) {
  const o = ORIENTS[TRUE.oi];
  const W = ([u, v]) => { const [a, b] = orient([u, v], o); return [TRUE.x + a * FW, TRUE.y + b * FH]; };
  const arc = spiral(TH0, TH0 - 2 * QUARTER, 240).map((p) => W(toFrame(p)));
  const i0 = arc.findIndex((p) => p[1] >= HORIZON);
  let i1 = i0;
  while (i1 < arc.length - 1 && !(arc[i1][1] < 392 && arc[i1][0] > 900)) i1++;
  const shore = arc.slice(i0, i1 + 1);
  const lamp = SUBJECTS[0];

  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const stars = Array.from({ length: 90 }, () => [rnd() * 1000, rnd() * (HORIZON - 20), rnd()])
    .filter(([x, y]) => Math.hypot(x - 330, y - 282) > 80)
    .map(([x, y, r]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r * 1.6).toFixed(1)}" opacity="${(0.25 + r * 0.6).toFixed(2)}"/>`).join("");
  const eye = [lamp.x, lamp.y];
  // 海面的涟漪：把海岸线朝眼缩一缩（对数螺线缩放后还是自己），只留水面上的部分
  const ripple = (k) => svgPath(arc.map(([x, y]) => [eye[0] + (x - eye[0]) * k, eye[1] + (y - eye[1]) * k]).filter(([, y]) => y > HORIZON + 6));
  const gulls = [0.06, 0.1, 0.15].map((f, i) => {
    const [x, y] = arc[Math.round(f * 240)];
    const sz = 9 - i * 1.6;
    return `<path d="M${x + 26 - sz} ${y - 4}q${sz / 2} ${-sz / 2} ${sz} 0q${sz / 2} ${-sz / 2} ${sz} 0"/>`;
  }).join("");
  const reflect = Array.from({ length: 9 }, (_, i) => {
    const y = HORIZON + 10 + i * 11, w = 34 - i * 3;
    return `<path d="M${330 - w / 2} ${y}h${w}" opacity="${(0.7 - i * 0.06).toFixed(2)}"/>`;
  }).join("");
  const land = `M0 ${HORIZON}L${shore[0][0].toFixed(1)} ${HORIZON}` + shore.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join("") + `L1000 ${shore.at(-1)[1].toFixed(1)}L1000 1000L0 1000Z`;

  svg.innerHTML = `
  <defs>
    <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05050a"/><stop offset=".75" stop-color="#110f15"/><stop offset="1" stop-color="#241a10"/></linearGradient>
    <linearGradient id="c-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f12"/><stop offset=".35" stop-color="#110f13"/><stop offset="1" stop-color="#08070b"/></linearGradient>
    <radialGradient id="c-moon"><stop offset="0" stop-color="#fff6dc"/><stop offset=".7" stop-color="#f1d49a"/><stop offset="1" stop-color="#c99b52"/></radialGradient>
    <radialGradient id="c-halo"><stop offset="0" stop-color="#f6cf86" stop-opacity=".35"/><stop offset="1" stop-color="#f6cf86" stop-opacity="0"/></radialGradient>
    <radialGradient id="c-lamp"><stop offset="0" stop-color="#fff3d0"/><stop offset=".25" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>
    <linearGradient id="c-beamL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffd98f" stop-opacity=".5"/><stop offset="1" stop-color="#ffd98f" stop-opacity="0"/></linearGradient>
    <linearGradient id="c-beamR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd98f" stop-opacity=".4"/><stop offset="1" stop-color="#ffd98f" stop-opacity="0"/></linearGradient>
    <linearGradient id="c-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2b17"/><stop offset=".5" stop-color="#21180d"/><stop offset="1" stop-color="#120d08"/></linearGradient>
    <filter id="c-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1000" height="${HORIZON}" fill="url(#c-sky)"/>
  <g fill="#f4e2bb">${stars}</g>
  <circle cx="330" cy="282" r="130" fill="url(#c-halo)"/>
  <circle cx="330" cy="282" r="34" fill="url(#c-moon)"/>
  <path d="M0 ${HORIZON}c60-16 110-20 170-8s70 6 100 8H0z" fill="#0d0b0c" stroke="#7a5d33" stroke-width="1"/>
  <rect y="${HORIZON}" width="1000" height="${1000 - HORIZON}" fill="url(#c-sea)"/>
  <g stroke="#e9c27a" stroke-width="2.4" stroke-linecap="round">${reflect}</g>
  <g fill="none" stroke="#c99c58" stroke-width="1.3" opacity=".5"><path d="${ripple(0.9)}"/><path d="${ripple(0.8)}" opacity=".7"/><path d="${ripple(0.7)}" opacity=".45"/></g>
  <path d="M${lamp.x - 4} ${lamp.y}L${lamp.x - 520} ${lamp.y - 70}L${lamp.x - 520} ${lamp.y + 46}Z" fill="url(#c-beamL)" opacity=".55"/>
  <path d="M${lamp.x + 4} ${lamp.y}L${lamp.x + 300} ${lamp.y - 40}L${lamp.x + 300} ${lamp.y + 30}Z" fill="url(#c-beamR)" opacity=".5"/>
  <path d="${land}" fill="url(#c-land)"/>
  <path d="${svgPath(shore)}" fill="none" stroke="#f6d08a" stroke-width="3" filter="url(#c-glow)"/>
  <path d="${svgPath(shore.map(([x, y]) => [x, y + 9]))}" fill="none" stroke="#8a6a3a" stroke-width="1" opacity=".7"/>
  <g fill="none" stroke="#e7c27e" stroke-width="2" stroke-linecap="round" opacity=".8">${gulls}</g>
  <g transform="translate(478 520)">
    <path d="M-34 0h68l-10 12h-48z" fill="#16120d" stroke="#d9b06a" stroke-width="1.6"/>
    <path d="M-2 -2V-62L30 -6z" fill="#1c160f" stroke="#e8c27c" stroke-width="1.6"/>
    <path d="M-6 -2V-44L-26 -6z" fill="#14100c" stroke="#b8904f" stroke-width="1.4"/>
    <path d="M-40 18h80" stroke="#e9c27a" stroke-width="1.6" opacity=".5"/>
  </g>
  <g transform="translate(${lamp.x} 0)">
    <path d="M-70 ${lamp.y + 112}c14-16 30-22 50-24 22-2 44 2 60 10 16 6 26 14 30 14z" fill="#17120c" stroke="#c99c58" stroke-width="1.4"/>
    <path d="M-15 ${lamp.y + 96}L-9 ${lamp.y + 18}h18L15 ${lamp.y + 96}z" fill="#1b160f" stroke="#e8c27c" stroke-width="1.6"/>
    <path d="M-13 ${lamp.y + 72}h26M-11 ${lamp.y + 46}h22" stroke="#b8904f" stroke-width="5" opacity=".5"/>
    <path d="M-16 ${lamp.y + 18}h32" stroke="#e8c27c" stroke-width="2"/>
    <circle cy="${lamp.y}" r="70" fill="url(#c-lamp)"/>
    <path d="M-9 ${lamp.y + 16}V${lamp.y - 8}h18V${lamp.y + 16}" fill="#fff0c8" stroke="#f0c879" stroke-width="1.4"/>
    <path d="M-12 ${lamp.y - 8}L0 ${lamp.y - 22}L12 ${lamp.y - 8}z" fill="#1b160f" stroke="#e8c27c" stroke-width="1.6"/>
  </g>`;
}
