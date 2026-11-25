import { reducedMotion } from "../../lib/stage.js";
import { createHero } from "./hero.js";
import {
  initAnatomyLab,
  initCalibratorLab,
  initCodeLab,
  initLightbox,
  initMismatchLab,
  initQuiz,
  initReveal,
  initStructLab,
} from "./labs.js";
import { evaluateIndent, fmtEm, INDENT_MAX, INDENT_MIN, PRESETS, snapIndent, uToIndent } from "./model.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  preset: "poster",
  indent: PRESETS.poster.sweet,
  snapped: true,
  showGrid: true,
  dragging: false,
  userTouched: false,
};

const stage = $("stage");
const canvas = $("hero-canvas");
const handle = $("hero-handle");
const handleVal = $("handle-val");
const range = $("hero-range");

let trackGeom = { x: 160, y: 58, x0: 40, x1: 280 };

const hero = createHero(canvas, stage, state, (geom) => {
  trackGeom = geom;
  handle.style.left = `${geom.x.toFixed(1)}px`;
  handle.style.top = `${geom.y.toFixed(1)}px`;
});

function syncUI() {
  const ev = evaluateIndent(state.indent, state.preset);
  const label = fmtEm(state.indent);

  handleVal.textContent = label.replace(" ", "");
  $("range-out").textContent = label;
  range.value = state.indent.toFixed(1);

  $("ro-title").textContent = ev.title;
  $("ro-badge").textContent = ev.badge;
  $("ro-badge").dataset.status = ev.status;
  $("ro-text").textContent = ev.text;
  $("ro-note").textContent = ev.hint;

  handle.classList.toggle("snapped", ev.status === "sweet");
  handle.classList.toggle("dragging", state.dragging);
  handle.setAttribute(
    "aria-label",
    `${PRESETS[state.preset].label}，悬挂缩进 ${label}，${ev.badge}。左右拖动或用方向键调节。`
  );
  $("btn-grid").setAttribute("aria-pressed", String(state.showGrid));

  hero.draw();
}

function setIndent(rawEm, useSnap = true) {
  state.userTouched = true;
  const res = useSnap
    ? snapIndent(state.preset, rawEm)
    : { em: Math.max(INDENT_MIN, Math.min(INDENT_MAX, Math.round(rawEm * 10) / 10)), snapped: false };
  state.indent = res.em;
  state.snapped = res.snapped;
  syncUI();
}

// 样本切换
$("preset-seg").addEventListener("change", (e) => {
  state.userTouched = true;
  state.preset = e.target.value;
  state.indent = PRESETS[state.preset].sweet;
  state.snapped = true;
  syncUI();
  hero.triggerScan();
});

// 滑块联动
range.addEventListener("input", () => {
  setIndent(parseFloat(range.value), true);
});

// 舞台工具栏
$("btn-grid").addEventListener("click", () => {
  state.showGrid = !state.showGrid;
  syncUI();
});
$("btn-scan").addEventListener("click", () => {
  hero.triggerScan();
});
$("btn-sweet").addEventListener("click", () => {
  state.userTouched = true;
  state.indent = PRESETS[state.preset].sweet;
  state.snapped = true;
  syncUI();
  hero.triggerScan();
});

// 卡尺游标拖动（支持鼠标、触屏；左右连续重绘）
let drag = null;
function emFromClientX(clientX) {
  const r = stage.getBoundingClientRect();
  const lx = clientX - r.left;
  const span = Math.max(40, trackGeom.x1 - trackGeom.x0);
  const u = (lx - trackGeom.x0) / span;
  return uToIndent(u);
}

handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  try {
    handle.setPointerCapture(e.pointerId);
  } catch {}
  handle.focus({ preventScroll: true });
  state.dragging = true;
  drag = { id: e.pointerId };
  setIndent(emFromClientX(e.clientX), false);
});
window.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  setIndent(emFromClientX(e.clientX), false);
});
const endDrag = (e) => {
  if (!drag || (e.pointerId != null && e.pointerId !== drag.id)) return;
  drag = null;
  state.dragging = false;
  setIndent(state.indent, true);
};
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
handle.addEventListener("lostpointercapture", endDrag);

// 点击标尺区域可直接跳到对应刻度
canvas.addEventListener("pointerdown", (e) => {
  const r = stage.getBoundingClientRect();
  const ly = e.clientY - r.top;
  if (Math.abs(ly - trackGeom.y) < 36) {
    setIndent(emFromClientX(e.clientX), true);
  }
});

// 键盘操作游标（左右键每步 0.2em，Shift 0.5em，Home 回推荐区，0 回 0em）
handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.5 : 0.2;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setIndent(state.indent - step, false);
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setIndent(state.indent + step, false);
  } else if (e.key === "Home") {
    e.preventDefault();
    state.indent = PRESETS[state.preset].sweet;
    state.userTouched = true;
    syncUI();
  } else if (e.key === "0") {
    e.preventDefault();
    setIndent(0, false);
  }
});

syncUI();
initAnatomyLab();
initCalibratorLab();
initStructLab();
initCodeLab();
initMismatchLab();
initQuiz();
initLightbox();
initReveal();
