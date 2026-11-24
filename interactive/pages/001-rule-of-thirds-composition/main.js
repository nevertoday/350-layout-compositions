import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import { describe, GUIDES, HORIZONS, nearest, powerPoints, SNAP, SUBJECTS } from "./model.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initFigures } from "./figures.js";

const $ = (id) => document.getElementById(id);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const fmt = (x) => x.toFixed(3);
const FRACTION = { upper: "1/3", middle: "1/2", lower: "2/3" };

// ---------- 取景器 ----------
const vf = $("vf");
const af = $("af");
const readout = $("readout");
const subjects = Object.fromEntries(Object.entries(SUBJECTS).map(([k, s]) => [k, { ...s.start }]));
const state = { active: "sun", horizonKey: "lower", horizon: HORIZONS.lower.v, guide: "thirds", subjects };
// 画出来的位置向目标缓动；减少动态效果时直接跳过去
const shown = { horizon: state.horizon, subjects: Object.fromEntries(Object.entries(subjects).map(([k, p]) => [k, { ...p }])) };
const startCentered = !reducedMotion.matches;
if (startCentered) shown.subjects.sun = { u: 0.5, v: 0.5 };

let scene;
try {
  scene = webgl() ? createScene3D($("scene")) : null;
} catch {
  scene = null;
}
if (!scene) {
  scene = createSceneFlat($("scene"));
  vf.classList.add("flat");
}

let aspect = 1.5;
let dragging = false;
let locked = false;

function settle(dt) {
  const k = dt ? 1 - Math.exp(-dt * (dragging ? 30 : 7)) : 1;
  shown.horizon += (state.horizon - shown.horizon) * k;
  for (const key of Object.keys(subjects)) {
    const s = shown.subjects[key], t = subjects[key];
    s.u += (t.u - s.u) * k;
    s.v += (t.v - s.v) * k;
  }
}

function paintOverlay() {
  const p = shown.subjects[state.active];
  af.style.left = `${p.u * 100}%`;
  af.style.top = `${p.v * 100}%`;
  $("hz-tick").style.top = `${shown.horizon * 100}%`;
  $("hud-xy").textContent = `X ${fmt(p.u)}  Y ${fmt(p.v)}`;
}

const view = loop(vf, (t, dt) => {
  settle(dt);
  paintOverlay();
  scene.render({ ...shown.subjects, horizon: shown.horizon }, t);
});

// 对焦框按主体的大小框住它（太阳直径约是画框高度的 17%）
const AF_SIZE = { sun: 0.24, birds: 0.16, peak: 0.13 };
let frameH = 400;
const sizeAf = () => (af.style.width = `${Math.max(48, AF_SIZE[state.active] * frameH)}px`);
function frameSize() {
  const r = vf.getBoundingClientRect();
  aspect = r.width / Math.max(r.height, 1);
  frameH = r.height;
  sizeAf();
  scene.resize(Math.round(r.width), Math.round(r.height));
}
new ResizeObserver(() => {
  frameSize();
  if (reducedMotion.matches) settle(0);
  view.draw();
}).observe(vf);

function updateReadout() {
  const pos = subjects[state.active];
  const { zone, text } = describe(state, aspect);
  locked = zone.kind === "point";
  $("ro-where").textContent = `${SUBJECTS[state.active].label} · ${zone.name}`;
  $("ro-lock").hidden = !locked;
  $("ro-text").textContent = text;
  $("ro-hz").textContent = HORIZONS[state.horizonKey].text;
  $("hud-lock").textContent = locked ? "AF · 对准" : "AF";
  vf.classList.toggle("locked", locked);
  af.setAttribute("aria-label", `对焦框：${SUBJECTS[state.active].label}，横向 ${Math.round(pos.u * 100)}%，纵向 ${Math.round(pos.v * 100)}%。方向键移动。`);
  vf.querySelectorAll(".pp").forEach((el, i) => {
    const p = powerPoints(state.guide)[i];
    el.classList.toggle("hot", locked && Math.abs(p.u - zone.point.u) < 1e-6 && Math.abs(p.v - zone.point.v) < 1e-6);
  });
}

function changed() {
  if (reducedMotion.matches) settle(0);
  updateReadout();
  view.draw();
}

const limits = (key) => (key === "peak" ? { vMin: 0.12, vMax: state.horizon - 0.06 } : { vMin: 0.05, vMax: 0.95 });
function place(key, u, v) {
  const { vMin, vMax } = limits(key);
  subjects[key].u = clamp(u, 0.05, 0.95);
  subjects[key].v = clamp(v, vMin, vMax);
}

// 放开时离交点够近就吸过去
function snap() {
  const pos = subjects[state.active];
  const n = nearest(pos, state.guide, aspect);
  if (n.d < SNAP) place(state.active, n.u, n.v);
}

const fromEvent = (e) => {
  const r = vf.getBoundingClientRect();
  return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height };
};

af.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  af.setPointerCapture(e.pointerId);
  af.focus({ preventScroll: true });
  dragging = true;
  readout.setAttribute("aria-live", "off");
  vf.classList.add("dragging");
});
af.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = fromEvent(e);
  place(state.active, p.u, p.v);
  if (reducedMotion.matches) settle(0);
  updateReadout();
  view.draw();
});
const endDrag = () => {
  if (!dragging) return;
  dragging = false;
  vf.classList.remove("dragging");
  readout.setAttribute("aria-live", "polite");
  snap();
  changed();
};
af.addEventListener("pointerup", endDrag);
af.addEventListener("pointercancel", endDrag);
af.addEventListener("click", (e) => e.stopPropagation());

vf.addEventListener("click", (e) => {
  const p = fromEvent(e);
  place(state.active, p.u, p.v);
  snap();
  changed();
});

const STEP = 1 / 12;
af.addEventListener("keydown", (e) => {
  const fine = e.shiftKey ? STEP / 4 : STEP;
  const move = { ArrowLeft: [-fine, 0], ArrowRight: [fine, 0], ArrowUp: [0, -fine], ArrowDown: [0, fine] }[e.key];
  if (!move) return;
  e.preventDefault();
  const pos = subjects[state.active];
  // 停在 1/12 的格子上，三分线正好在第 4、8 格
  const q = (x, d) => (e.shiftKey ? x + d : Math.round((x + d) / STEP) * STEP);
  place(state.active, q(pos.u, move[0]), q(pos.v, move[1]));
  changed();
});

const radios = (name, fn) =>
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => input.addEventListener("change", () => input.checked && fn(input.value)));

radios("subject", (v) => {
  state.active = v;
  vf.dataset.subject = v;
  sizeAf();
  changed();
});
// 换地平线时天空变大或变小：山峰的高度按天空比例缩放；太阳、飞鸟只有在会沉到水下时才跟着挪
const SKY_MARGIN = { sun: 0.1, birds: 0.06 };
radios("horizon", (v) => {
  const from = state.horizon, to = HORIZONS[v].v;
  state.horizonKey = v;
  state.horizon = to;
  $("hud-hz").textContent = `地平线 ${FRACTION[v]}`;
  for (const [key, margin] of Object.entries(SKY_MARGIN)) {
    const s = subjects[key];
    if (s.v > to - margin) place(key, s.u, Math.min((s.v / from) * to, to - margin));
  }
  const peak = subjects.peak;
  place("peak", peak.u, to - (from - peak.v) * (to / from));
  changed();
});
radios("guide", (v) => {
  state.guide = v;
  vf.dataset.guide = v;
  $("hud-guide").textContent = GUIDES[v].hud;
  if (v !== "thirds") vf.style.setProperty("--a", `${GUIDES[v].lines[0] * 100}%`), vf.style.setProperty("--b", `${GUIDES[v].lines[1] * 100}%`);
  else vf.style.removeProperty("--a"), vf.style.removeProperty("--b");
  changed();
});

// 开场：太阳先在正中，然后缓缓落到左上交点
if (startCentered) {
  subjects.sun = { u: 0.5, v: 0.5 };
  updateReadout();
  setTimeout(() => {
    if (dragging || state.active !== "sun" || subjects.sun.u !== 0.5 || subjects.sun.v !== 0.5) return;
    place("sun", 1 / 3, 1 / 3);
    updateReadout();
  }, 450);
} else {
  updateReadout();
}
frameSize();
view.draw();

initFigures();
