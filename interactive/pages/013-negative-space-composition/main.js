import { reducedMotion } from "../../lib/stage.js";
import { createHero } from "./hero.js";
import { initClosureLab, initEmptyLab, initLightbox, initLogoLab, initPunLab, initQuiz, initReveal, initRubinLab } from "./labs.js";
import { SPECIMENS, pct, snapU } from "./model.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  specimen: "cat",
  u: SPECIMENS.cat.sweet,
  snapped: true,
  inverted: false,
  reveal: false,
};

const stage = $("stage");
const canvas = $("hero-canvas");
const handle = $("hero-handle");
const range = $("hero-range");
const titleCut = $("title-cut");

let trackGeom = { x0: 44, x1: 300, y: 300 };

const hero = createHero(canvas, stage, state, (geom) => {
  trackGeom = geom;
  handle.style.left = `${geom.x.toFixed(1)}px`;
  handle.style.top = `${geom.y.toFixed(1)}px`;
});

function syncUI() {
  const spec = SPECIMENS[state.specimen];
  const info = spec.describe(state.u, state.inverted);

  $("hud-spec").textContent = spec.label;
  $("hud-val").textContent = pct(state.u);
  $("hud-state").textContent = info.badge;
  $("hud-state").dataset.status = info.status;

  $("range-label").textContent = spec.sliderLabel;
  $("range-en").textContent = spec.sliderEn;
  $("range-out").textContent = pct(state.u);
  $("axis-low").textContent = spec.axisLow;
  $("axis-mid").textContent = spec.axisMid;
  $("axis-high").textContent = spec.axisHigh;
  range.value = String(Math.round(state.u * 100));

  $("ro-title").textContent = info.title;
  $("ro-badge").textContent = info.badge;
  $("ro-badge").dataset.status = info.status;
  $("ro-text").textContent = info.text;
  $("ro-note").textContent = info.note;

  stage.dataset.inverted = String(state.inverted);
  titleCut.dataset.inverted = String(state.inverted);
  handle.classList.toggle("snapped", info.status === "sweet");
  handle.setAttribute("aria-label", `${spec.label}，${spec.sliderLabel} ${pct(state.u)}，${info.badge}`);

  $("btn-invert").setAttribute("aria-pressed", String(state.inverted));
  $("btn-reveal").setAttribute("aria-pressed", String(state.reveal));

  hero.draw();
}

function setU(rawU, useSnap = true) {
  const res = useSnap ? snapU(state.specimen, rawU) : { u: Math.max(0.04, Math.min(0.96, rawU)), snapped: false };
  state.u = res.u;
  state.snapped = res.snapped;
  syncUI();
}

// 标本切换
$("spec-seg").addEventListener("change", (e) => {
  state.specimen = e.target.value;
  state.u = SPECIMENS[state.specimen].sweet;
  state.snapped = true;
  syncUI();
});

// 滑块
range.addEventListener("input", () => {
  setU(+range.value / 100, true);
});

// 画布工具按钮
$("btn-invert").addEventListener("click", () => {
  state.inverted = !state.inverted;
  syncUI();
});
$("btn-reveal").addEventListener("click", () => {
  state.reveal = !state.reveal;
  syncUI();
});
$("btn-sweet").addEventListener("click", () => {
  state.u = SPECIMENS[state.specimen].sweet;
  state.snapped = true;
  syncUI();
});

// 手柄拖动（支持鼠标与触屏；水平拖动连续重绘，不阻塞页面其他区域竖滑）
let drag = null;
function uFromClientX(clientX) {
  const r = stage.getBoundingClientRect();
  const lx = clientX - r.left;
  const span = Math.max(40, trackGeom.x1 - trackGeom.x0);
  return (lx - trackGeom.x0) / span;
}

handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  handle.setPointerCapture(e.pointerId);
  drag = { id: e.pointerId };
  setU(uFromClientX(e.clientX), false);
});
handle.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  setU(uFromClientX(e.clientX), false);
});
const endHandleDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  drag = null;
  setU(state.u, true);
};
handle.addEventListener("pointerup", endHandleDrag);
handle.addEventListener("pointercancel", endHandleDrag);

// 点击画布空白轨道也能直接跳过去
canvas.addEventListener("pointerdown", (e) => {
  const r = stage.getBoundingClientRect();
  const ly = e.clientY - r.top;
  if (Math.abs(ly - trackGeom.y) < 34) {
    setU(uFromClientX(e.clientX), true);
  }
});

// 手柄键盘支持（左右键微调，Home 归位）
handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.08 : 0.03;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setU(state.u - step, false);
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setU(state.u + step, false);
  } else if (e.key === "Home") {
    e.preventDefault();
    state.u = SPECIMENS[state.specimen].sweet;
    syncUI();
  }
});

syncUI();
initClosureLab();
initRubinLab();
initLogoLab();
initPunLab();
initEmptyLab();
initQuiz();
initLightbox();
initReveal();
