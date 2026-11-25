import { reducedMotion } from "../../lib/stage.js";
import { createHero } from "./hero.js";
import {
  initCodeLab,
  initFinderLab,
  initLightbox,
  initMeasureLab,
  initMismatchLab,
  initQuiz,
  initReveal,
  initStructLab,
} from "./labs.js";
import {
  clamp,
  evaluateDualIndent,
  fmtEm,
  fmtPos,
  PRESETS,
  round1,
  RULER_MAX_EM,
  RULER_MIN_EM,
  snapFirstMarker,
  snapRestMarker,
} from "./model.js";

const $ = (id) => document.getElementById(id);
const setTextIf = (el, txt) => {
  if (el.textContent !== txt) el.textContent = txt;
};
let lastReadoutKey = "";
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  preset: "poster",
  firstEm: 0.0,
  restEm: PRESETS.poster.normHangEm,
  showGrid: true,
  dragging: null, // "first" | "rest" | null
  userTouched: false,
  autoAligned: true,
};

const stage = $("stage");
const canvas = $("hero-canvas");
const handleFirst = $("handle-first");
const handleRest = $("handle-rest");
const motifGhost = $("motif-ghost");
const motifSolid = $("motif-solid");

let geom = {
  firstX: 48,
  restX: 120,
  railTopY: 38,
  railBotY: 82,
  scaleTopY: 50,
  scaleBotY: 70,
  rulerBottom: 94,
  zeroX: 48,
  emPx: 18,
  maxMarkerEm: RULER_MAX_EM,
  metrics: { headEndEm: 3.1, alignEm: 4.1, measureEm: 30, maxMarkerEm: RULER_MAX_EM },
};

function positionHandles(g) {
  handleFirst.style.transform = `translate3d(${g.firstX.toFixed(1)}px, ${g.railTopY.toFixed(1)}px, 0) translate(-50%, -50%)`;
  handleRest.style.transform = `translate3d(${g.restX.toFixed(1)}px, ${g.railBotY.toFixed(1)}px, 0) translate(-50%, -50%)`;
}

const hero = createHero(canvas, stage, state, (g) => {
  const alignChanged = Math.abs(g.metrics.alignEm - geom.metrics.alignEm) > 0.04;
  geom = g;
  if (state.autoAligned && !state.userTouched && alignChanged) {
    state.firstEm = 0;
    state.restEm = g.metrics.alignEm;
    hero.draw();
  }
  positionHandles(g);
  syncReadoutOnly();
});

// 初始化时立刻按真实字号测出原海报词头对齐宽度
{
  const initM = hero.measurePreset(state.preset);
  state.firstEm = 0;
  state.restEm = initM.alignEm;
  geom.metrics = initM;
}

function syncReadoutOnly() {
  const m = geom.metrics;
  const rk = `${state.preset}|${state.firstEm}|${state.restEm}|${state.showGrid}|${state.dragging}|${m.alignEm}|${m.measureEm}`;
  if (rk === lastReadoutKey) return;
  lastReadoutKey = rk;

  const ev = evaluateDualIndent(state.firstEm, state.restEm, state.preset, m);
  const hang = round1(state.restEm - state.firstEm);

  setTextIf($("val-first"), fmtPos(state.firstEm));
  setTextIf($("val-rest"), fmtPos(state.restEm));
  setTextIf($("val-hang"), fmtEm(hang));

  setTextIf($("ro-title"), ev.title);
  setTextIf($("ro-badge"), ev.badge);
  if ($("ro-badge").dataset.status !== ev.status) $("ro-badge").dataset.status = ev.status;
  setTextIf($("ro-text"), ev.text);
  setTextIf($("ro-note"), ev.hint);

  // 联动刊头右侧原海报双圆母题（实心圆=首行 ▽，虚线圆=续行 △）
  if (motifSolid && motifGhost) {
    const baseCx = 27;
    const dxFirst = clamp(state.firstEm * 2.2, -5, 14);
    const dxRest = clamp(state.restEm * 2.6, -5, 20);
    motifSolid.setAttribute("cx", (baseCx + dxFirst).toFixed(1));
    motifGhost.setAttribute("cx", (baseCx + dxRest).toFixed(1));
    motifGhost.setAttribute("stroke", hang < 0 ? "#fb665b" : "#c3d142");
  }

  handleFirst.classList.toggle("dragging", state.dragging === "first");
  handleRest.classList.toggle("dragging", state.dragging === "rest");
  handleRest.classList.toggle("snapped", ev.status === "sweet");

  handleFirst.setAttribute(
    "aria-label",
    `首行缩进游标 ▽：当前 ${fmtPos(state.firstEm)}，悬挂差值 ${fmtEm(hang)}。左右拖动或按方向键调节，按 0 归零。`
  );
  handleRest.setAttribute(
    "aria-label",
    `左缩进游标 △：当前 ${fmtPos(state.restEm)}，悬挂差值 ${fmtEm(hang)}，${ev.badge}。左右拖动或按方向键调节，按 0 归零。`
  );
  $("btn-grid").setAttribute("aria-pressed", String(state.showGrid));
}

function syncUI(deferCanvas = false) {
  syncReadoutOnly();
  if (deferCanvas) {
    hero.markDirty();
  } else {
    hero.fitHeight();
  }
}

function setFirstEm(rawEm, useSnap = true, deferCanvas = false) {
  state.userTouched = true;
  state.autoAligned = false;
  const maxEm = geom.maxMarkerEm || RULER_MAX_EM;
  const res = useSnap
    ? snapFirstMarker(rawEm, state.restEm, maxEm)
    : { em: round1(clamp(rawEm, RULER_MIN_EM, maxEm)) };
  if (res.em === state.firstEm && deferCanvas) return;
  state.firstEm = res.em;
  syncUI(deferCanvas);
}

function setRestEm(rawEm, useSnap = true, deferCanvas = false) {
  state.userTouched = true;
  state.autoAligned = false;
  const maxEm = geom.maxMarkerEm || RULER_MAX_EM;
  const res = useSnap
    ? snapRestMarker(rawEm, state.firstEm, geom.metrics, maxEm)
    : { em: round1(clamp(rawEm, RULER_MIN_EM, maxEm)) };
  if (res.em === state.restEm && deferCanvas) return;
  state.restEm = res.em;
  syncUI(deferCanvas);
}

function snapToBest() {
  const m = hero.measurePreset(state.preset);
  geom.metrics = m;
  state.userTouched = true;
  state.autoAligned = true;
  state.firstEm = 0;
  state.restEm = m.alignEm;
  hero.fitHeight();
  syncUI();
  hero.triggerScan();
}

// 样本切换（并入标尺顶栏，切样本即按实测宽度对齐并贴合行数高度）
$("preset-seg").addEventListener("change", (e) => {
  state.preset = e.target.value;
  snapToBest();
});

$("btn-grid").addEventListener("click", () => {
  state.showGrid = !state.showGrid;
  syncUI();
});
$("btn-scan").addEventListener("click", () => {
  hero.triggerScan();
});
$("btn-sweet").addEventListener("click", () => {
  snapToBest();
});

// 双游标真指针拖动（缓存 rect 避免拖动中强制回流，并将画布重绘并入 rAF）
let drag = null;
function emFromClientX(clientX, rectLeft = null) {
  const left = rectLeft != null ? rectLeft : stage.getBoundingClientRect().left;
  const lx = clientX - left;
  return (lx - geom.zeroX) / Math.max(8, geom.emPx);
}

function bindHandle(el, which) {
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    el.focus({ preventScroll: true });
    state.dragging = which;
    const rectLeft = stage.getBoundingClientRect().left;
    drag = { id: e.pointerId, which, rectLeft };
    const v = emFromClientX(e.clientX, rectLeft);
    if (which === "first") setFirstEm(v, false, true);
    else setRestEm(v, false, true);
  });

  el.addEventListener("lostpointercapture", (e) => endDrag(e));

  el.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.5 : 0.2;
    const cur = which === "first" ? state.firstEm : state.restEm;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      if (which === "first") setFirstEm(cur - step, false);
      else setRestEm(cur - step, false);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (which === "first") setFirstEm(cur + step, false);
      else setRestEm(cur + step, false);
    } else if (e.key === "0") {
      e.preventDefault();
      if (which === "first") setFirstEm(0, false);
      else setRestEm(0, false);
    }
  });
}

window.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const v = emFromClientX(e.clientX, drag.rectLeft);
  if (drag.which === "first") setFirstEm(v, false, true);
  else setRestEm(v, false, true);
});

function endDrag(e) {
  if (!drag || (e && e.pointerId != null && e.pointerId !== drag.id)) return;
  const which = drag.which;
  drag = null;
  state.dragging = null;
  if (which === "first") setFirstEm(state.firstEm, true);
  else setRestEm(state.restEm, true);
  hero.fitHeight();
}

window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);

bindHandle(handleFirst, "first");
bindHandle(handleRest, "rest");

// 直接点击标尺带：点上半部调 ▽ 首行，点下半部调 △ 左缩进
canvas.addEventListener("pointerdown", (e) => {
  const r = stage.getBoundingClientRect();
  const ly = e.clientY - r.top;
  if (ly >= 18 && ly <= geom.rulerBottom + 10) {
    const midY = (geom.scaleTopY + geom.scaleBotY) * 0.5;
    const v = emFromClientX(e.clientX);
    if (ly < midY) setFirstEm(v, true);
    else setRestEm(v, true);
  }
});

syncUI();
hero.fitHeight();
initFinderLab();
initMeasureLab();
initStructLab();
initCodeLab();
initMismatchLab();
initQuiz();
initLightbox();
initReveal();
