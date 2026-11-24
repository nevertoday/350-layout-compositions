// 开场：一张按黄金三角摆的风景。拖太阳（或点画面、或方向键）到垂足上，画框多宽多高都现算。
// 状态只有三样：主斜线方向、太阳在画框里的比例位置、是否给三角形上色。
import { loop, reducedMotion } from "../../lib/stage.js";
import { armature, dist, lerp, onDiagonal, placeName } from "./geo.js";
import { armatureMarkup, landscape, mountain } from "./scene.js";

const $ = (id) => document.getElementById(id);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const SUN_R = 0.075;
const ease = (k) => 1 - (1 - k) ** 3;
const seg = (x, a, b) => ease(clamp((x - a) / (b - a), 0, 1));

function inTri(p, [a, b, c]) {
  const s = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

export function hero() {
  const frame = $("frame"), svg = $("hero-svg"), btn = $("sun"), readout = $("readout");
  const state = { dir: "rise", sun: [0.5, 0.5], lock: null, tri: false };
  const shown = { sun: [0.5, 0.5], grow: reducedMotion.matches ? 1 : 0 };
  let g, W = 600, H = 400, els = {}, dragging = false, touched = false;

  const upperIdx = () => (g.perps[0].foot[1] <= g.perps[1].foot[1] ? 0 : 1);
  const footUV = (i) => [g.perps[i].foot[0] / W, g.perps[i].foot[1] / H];
  const px = ([u, v]) => [u * W, v * H];

  function build() {
    g = armature(W, H, state.dir);
    const up = upperIdx(), low = 1 - up;
    const face = Math.sign(g.perps[up].foot[0] - g.perps[low].foot[0]) || 1; // 登山的人朝着太阳那边
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `<g class="land">${landscape(g, { sun: [0, 0], sunR: SUN_R, hiker: { at: g.perps[low].foot, face } })}</g><g class="arm">${armatureMarkup(g, { tri: state.tri, nums: state.tri })}</g>`;
    els = {
      sun: svg.querySelector("[data-sun]"),
      diag: svg.querySelector("[data-diag]"),
      arrow: svg.querySelector("[data-arrow]"),
      perps: [...svg.querySelectorAll("[data-perp]")],
      marks: [...svg.querySelectorAll("[data-mark]")],
      feet: [...svg.querySelectorAll("[data-foot]")],
    };
    const d = Math.round(SUN_R * 2 * Math.min(W, H) + 18);
    btn.style.width = btn.style.height = `${Math.max(44, d)}px`;
    if (state.lock != null) state.sun = footUV(state.lock);
    $("hud-ratio").textContent = `${(Math.max(W, H) / Math.min(W, H)).toFixed(2)} : 1`;
    $("hud-theta").textContent = `θ ${((g.theta * 180) / Math.PI).toFixed(1)}°`;
    lastGrow = -1;
    lastSun = "";
    paint();
    fitTitle();
  }

  // 宽屏上标题叠在画里那块空三角中：往里让开从上角出发的那条垂线，不压线
  const titleEl = document.querySelector(".hero-title");
  const overlay = matchMedia("(min-width: 960px) and (min-height: 600px)");
  function fitTitle() {
    titleEl.style.removeProperty("--pad-x");
    if (!overlay.matches) return;
    const p = g.perps.find((q) => q.corner[1] === 0);
    const bottom = titleEl.getBoundingClientRect().height - parseFloat(getComputedStyle(titleEl).paddingBottom);
    const x = (Math.abs(p.foot[0] - p.corner[0]) * bottom) / p.foot[1];
    titleEl.style.setProperty("--pad-x", `${Math.round(x + 24)}px`);
  }

  let lastGrow = -1, lastSun = "";
  function paint() {
    const k = shown.grow;
    if (k !== lastGrow) {
      lastGrow = k;
      const kd = seg(k, 0, 0.42), set = (el, a, b, t) => {
        const e = lerp(a, b, t);
        el.setAttribute("x2", e[0].toFixed(1));
        el.setAttribute("y2", e[1].toFixed(1));
        el.style.opacity = t > 0 ? 1 : 0;
      };
      set(els.diag, g.A, g.C, kd);
      els.arrow.style.opacity = seg(k, 0.36, 0.46);
      g.perps.forEach((p, i) => set(els.perps[i], p.corner, p.foot, seg(k, 0.3 + i * 0.16, 0.66 + i * 0.16)));
      const km = seg(k, 0.78, 1);
      els.marks.forEach((m) => (m.style.opacity = km));
      els.feet.forEach((f) => (f.style.opacity = km));
    }
    const [x, y] = px(shown.sun);
    const key = `${x.toFixed(1)} ${y.toFixed(1)}`;
    if (key === lastSun) return; // 停稳以后不再写 DOM
    lastSun = key;
    els.sun.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    btn.style.left = `${shown.sun[0] * 100}%`;
    btn.style.top = `${shown.sun[1] * 100}%`;
  }

  function settle(dt) {
    if (shown.grow < 1) shown.grow = dt ? Math.min(1, shown.grow + dt / 0.95) : 1;
    const k = dt ? 1 - Math.exp(-dt * (dragging ? 30 : 6)) : 1;
    shown.sun = lerp(shown.sun, state.sun, k);
  }

  // dt 为 0 是 draw() 补画的一帧：只有减少动态效果时才直接跳到终点
  const view = loop(frame, (t, dt) => {
    if (dt || reducedMotion.matches) settle(dt);
    paint();
  });

  // ---------- 读数 ----------
  function classify() {
    const p = px(state.sun), diag = Math.hypot(W, H);
    if (state.lock != null) return { kind: state.lock === upperIdx() ? "upper" : "lower", i: state.lock };
    const feet = g.perps.map((q, i) => ({ i, d: dist(p, q.foot) })).sort((a, b) => a.d - b.d);
    const near = feet[0];
    if (dist(p, [W / 2, H / 2]) < diag * 0.045) return { kind: "center", near };
    const { summit, corner, base } = mountain(g);
    if (inTri(p, [summit, corner, base]) && onDiagonal(p, g).d > Math.min(W, H) * SUN_R * 0.8) return { kind: "hidden", near };
    const e = 0.07;
    if (state.sun[0] < e || state.sun[0] > 1 - e || state.sun[1] < e || state.sun[1] > 1 - e) return { kind: "edge", near };
    if (onDiagonal(p, g).d < diag * 0.02) return { kind: "line", near };
    return { kind: "free", near, pct: Math.round((near.d / diag) * 100) };
  }

  const TEXT = {
    upper: (n) => `主斜线在这里被垂线接住，成一个直角。眼睛从${n.from}顺着斜线往上走，走到这里停下——海报叫它「强交点」。`,
    lower: () => "也是一个强点，可这里已经站着登山的人。两个垂足别放两个一样抢眼的东西：一主一次，一大一小。",
    center: () => "对角线的正中。两条垂线都不经过这里——放在这，三角形帮不上忙，画面回到了「居中」的安静。",
    hidden: () => "太阳躲到山后面了。",
    edge: () => "太靠边：主体被画框挤着，视线顺势滑出画面。",
    line: () => "在主斜线上，但没到垂足：线有方向、没有落点，眼睛会顺着滑过去。",
    free: (n) => `离最近的垂足（${n.name}）还差画面对角线的 ${n.pct}%。拖近一点，会被吸住。`,
  };
  const corner = (p) => `${p[0] < W / 2 ? "左" : "右"}${p[1] < H / 2 ? "上" : "下"}角`;

  function updateReadout() {
    const c = classify();
    const i = c.i ?? c.near.i;
    const name = `${placeName(g.perps[i].foot, W, H)}垂足`;
    const where = { upper: name, lower: name, center: "画面正中", hidden: "山后面", edge: "贴着边", line: "主斜线上", free: `靠近${name}` }[c.kind];
    $("ro-where").textContent = `太阳 · ${where}`;
    $("ro-lock").hidden = c.kind !== "upper" && c.kind !== "lower";
    $("ro-text").textContent = TEXT[c.kind]({ from: corner(g.A[1] === H ? g.A : g.C), name, pct: c.pct });
    frame.classList.toggle("locked", state.lock != null);
    els.feet.forEach((f, j) => f.classList.toggle("hot", state.lock === j));
    btn.setAttribute("aria-label", `太阳：横向 ${Math.round(state.sun[0] * 100)}%，纵向 ${Math.round(state.sun[1] * 100)}%，${where}。方向键移动。`);
  }

  function changed() {
    if (reducedMotion.matches) settle(0);
    updateReadout();
    view.draw();
  }

  function place(u, v) {
    state.sun = [clamp(u, 0.04, 0.96), clamp(v, 0.04, 0.96)];
    state.lock = null;
  }
  function snap(radius = 0.07) {
    const p = px(state.sun), r = Math.hypot(W, H) * radius;
    const best = g.perps.map((q, i) => ({ i, d: dist(p, q.foot) })).sort((a, b) => a.d - b.d)[0];
    if (best.d < r) {
      state.lock = best.i;
      state.sun = footUV(best.i);
    }
  }

  // ---------- 拖、点、键盘 ----------
  const fromEvent = (e) => {
    const r = frame.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    btn.setPointerCapture(e.pointerId);
    btn.focus({ preventScroll: true });
    dragging = touched = true;
    readout.setAttribute("aria-live", "off");
    frame.classList.add("dragging");
  });
  btn.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    place(...fromEvent(e));
    const p = px(state.sun);
    els.feet.forEach((f, j) => f.classList.toggle("hot", dist(p, g.perps[j].foot) < Math.hypot(W, H) * 0.07));
    if (reducedMotion.matches) settle(0);
    view.draw();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    frame.classList.remove("dragging");
    readout.setAttribute("aria-live", "polite");
    snap();
    changed();
  };
  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);
  btn.addEventListener("click", (e) => e.stopPropagation());
  svg.addEventListener("click", (e) => {
    touched = true;
    place(...fromEvent(e));
    snap();
    changed();
  });
  btn.addEventListener("keydown", (e) => {
    const s = e.shiftKey ? 1 / 96 : 1 / 24;
    const mv = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (!mv) return;
    e.preventDefault();
    touched = true;
    const before = px(state.sun);
    const nearBefore = Math.min(...g.perps.map((q) => dist(before, q.foot)));
    place(state.sun[0] + mv[0], state.sun[1] + mv[1]);
    const nearAfter = Math.min(...g.perps.map((q) => dist(px(state.sun), q.foot)));
    if (nearAfter < nearBefore) snap(0.05); // 只在靠近时吸，往外走不会被拽回来
    changed();
  });

  // ---------- 控件 ----------
  document.querySelectorAll('input[name="dir"]').forEach((input) =>
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.dir = input.value;
      frame.dataset.dir = state.dir;
      state.sun = [1 - state.sun[0], state.sun[1]];
      shown.sun = [1 - shown.sun[0], shown.sun[1]];
      build();
      changed();
    }),
  );
  const triBtn = $("tri-toggle");
  triBtn.addEventListener("click", () => {
    state.tri = !state.tri;
    triBtn.setAttribute("aria-pressed", String(state.tri));
    build();
    changed();
  });
  $("replay").addEventListener("click", () => {
    if (reducedMotion.matches) return;
    shown.grow = 0;
    shown.sun = [0.5, 0.5];
    state.lock = upperIdx();
    state.sun = footUV(state.lock);
    updateReadout();
    view.draw();
  });

  // ---------- 尺寸 ----------
  new ResizeObserver(() => {
    const r = frame.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    build();
    if (reducedMotion.matches) settle(0);
    updateReadout();
    view.draw();
  }).observe(frame);

  document.fonts?.ready.then(() => g && fitTitle());

  // 开场：线画进来，太阳从正中滑到上方垂足
  const r = frame.getBoundingClientRect();
  W = Math.max(2, Math.round(r.width));
  H = Math.max(2, Math.round(r.height));
  build();
  state.lock = upperIdx();
  state.sun = footUV(state.lock);
  if (reducedMotion.matches) settle(0);
  else if (!touched) shown.sun = [0.5, 0.5];
  updateReadout();
  view.draw();
}
