import { reducedMotion, webgl } from "../../lib/stage.js";
import { framesSVG, svgEl } from "./flat.js";
import { createHero3D } from "./hero3d.js";
import { ASPECT, PHI, RHYTHMS, describe, frames, pct, placeKind, snap } from "./model.js";
import { onPeony } from "./peony.js";
import { initFigures } from "./figures.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = { layers: 3, gap: 0.08, rhythm: "even", focus: { u: 0.5, v: 0.5 } };
const stage = $("stage");
const handle = $("handle");

// 两种画法同一个接口：set(frames)、project(u,v)、framePx()
function createFlat() {
  const svg = svgEl(80, 100, 0.065);
  stage.prepend(svg);
  let f = null;
  const pad = 0.065;
  const draw = () => f && (svg.innerHTML = framesSVG(f));
  onPeony(draw);
  const px = () => {
    const h = stage.clientHeight / (1 + 2 * pad);
    return { w: h * ASPECT, h };
  };
  return {
    kind: "flat",
    set(next) {
      f = next;
      draw();
    },
    project(u, v) {
      const p = px();
      return { x: (stage.clientWidth - p.w) / 2 + u * p.w, y: (stage.clientHeight - p.h) / 2 + v * p.h };
    },
    framePx: px,
    view() {},
    fly: () => false,
    flying: () => null,
  };
}

let view;
const placeHandle = () => {
  const f = current;
  const w = f.rects.at(-1);
  const p = view.project(w.x + w.w / 2, w.y + w.h / 2);
  handle.style.transform = `translate(${(p.x - stage.clientWidth / 2).toFixed(1)}px, ${(p.y - stage.clientHeight / 2).toFixed(1)}px)`;
  const fl = view.flying();
  handle.hidden = !!fl;
  $("hud-fly").textContent = fl ? `推近 · 镜头 ${Math.round(fl.fov)}°` : "";
};

const viewBtn = $("btn-view");
const setViewBtn = (front) => {
  viewBtn.setAttribute("aria-pressed", String(front));
  viewBtn.firstChild.textContent = front ? "侧着看 " : "正面看 ";
  viewBtn.lastElementChild.textContent = front ? "Angle" : "Front";
};
view = webgl() ? createHero3D(stage, { onFrame: () => placeHandle(), onView: setViewBtn }) : createFlat();

let current = frames(state);
function render() {
  current = frames(state);
  view.set(current);
  placeHandle();
  const d = describe(state, current);
  $("ro-area").textContent = pct(d.area);
  $("ro-where").textContent = d.where;
  $("ro-band").textContent = `${(Math.min(...current.bands) * 100).toFixed(1)}%`;
  $("ro-text").textContent = d.text;
  $("ro-warn").hidden = !d.warn;
  $("ro-warn").textContent = d.warn;
  $("hud-layers").textContent = `${state.layers} 层`;
  $("hud-rhythm").textContent = RHYTHMS[state.rhythm].label;
  $("layers-out").textContent = state.layers;
  $("gap-out").textContent = `${Math.round(state.gap * 100)}%`;
  handle.classList.toggle("snapped", d.kind !== "free");
  for (const r of document.querySelectorAll('input[name="place"]')) r.checked = r.value === d.kind;
  handle.setAttribute("aria-label", `主体窗口，${d.where}，横 ${current.focus.u.toFixed(2)}，竖 ${current.focus.v.toFixed(2)}`);
}

// 主体位置每次都存修正后的值，放不下的地方不会「藏」在状态里
const moveTo = (pos) => {
  state.focus = frames({ ...state, focus: snap(state, pos) }).focus;
  render();
};
const refit = () => {
  // 改了层数、宽度以后，原来吸住的点尽量保持
  const kind = placeKind(current);
  const want = kind === "free" ? state.focus : kind === "center" ? { u: 0.5, v: 0.5 } : { u: state.focus.u < 0.5 ? PHI : 1 - PHI, v: state.focus.v < 0.5 ? PHI : 1 - PHI };
  state.focus = frames({ ...state, focus: snap(state, want) }).focus;
  render();
};

$("layers").addEventListener("input", (e) => {
  state.layers = +e.target.value;
  refit();
});
$("gap").addEventListener("input", (e) => {
  state.gap = +e.target.value;
  refit();
});
$("rhythm").addEventListener("change", (e) => {
  state.rhythm = e.target.value;
  refit();
});
$("place").addEventListener("change", (e) => {
  if (e.target.value === "center") moveTo({ u: 0.5, v: 0.5 });
  if (e.target.value === "golden") moveTo({ u: PHI, v: 1 - PHI });
});

// 准星：拖或方向键
let drag = null;
handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  handle.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, u: current.focus.u, v: current.focus.v };
});
handle.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const p = view.framePx();
  moveTo({ u: drag.u + (e.clientX - drag.x) / p.w, v: drag.v + (e.clientY - drag.y) / p.h });
});
const stop = () => (drag = null);
handle.addEventListener("pointerup", stop);
handle.addEventListener("pointercancel", stop);
handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.06 : 0.02;
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (e.key === "Home") {
    e.preventDefault();
    moveTo({ u: 0.5, v: 0.5 });
    return;
  }
  if (!d) return;
  e.preventDefault();
  // 被吸住时一步可能还在吸附圈里，就多走几步，直到离开这个点
  const base = current.focus;
  let next = { u: base.u + d[0], v: base.v + d[1] };
  for (let i = 2; i < 8; i++) {
    const p = snap(state, next);
    if (p.u !== base.u || p.v !== base.v) break;
    next = { u: base.u + d[0] * i, v: base.v + d[1] * i };
  }
  moveTo(next);
});

const flyBtn = $("btn-fly");
if (view.kind === "flat") {
  flyBtn.hidden = true;
  viewBtn.hidden = true;
} else {
  if (reducedMotion.matches) flyBtn.hidden = true;
  flyBtn.addEventListener("click", () => view.fly());
  viewBtn.addEventListener("click", () => {
    const front = viewBtn.getAttribute("aria-pressed") !== "true";
    view.view(front ? "front" : "angle");
    setViewBtn(front);
  });
}
new ResizeObserver(() => placeHandle()).observe(stage);

render();
initFigures();
