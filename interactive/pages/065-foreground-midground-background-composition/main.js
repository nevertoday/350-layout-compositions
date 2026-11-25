// 065 前中后景构图主入口：
// 串联 model.js 单一真源、WebGL/2D 降级多平面舞台、三道实色景片调控带和正文 01–07 节交互。

import { loop, webgl } from "../../lib/stage.js";
import { createInitialState, BROKEN_STATE, evaluate } from "./model.js";
import { mountHero3D } from "./hero3d.js";
import { mountHeroFlat } from "./hero-flat.js";
import {
  initPeelLab,
  initOpticsLab,
  initHistoryStage,
  initParallaxLab,
  initAvoidClinic,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

const state = createInitialState();
let cachedEval = evaluate(state);

const heroCanvas = document.getElementById("hero-canvas");
const engineTag = document.getElementById("engine-tag");
const yawReadout = document.getElementById("yaw-readout");
const statusPill = document.getElementById("hero-status-pill");

const stratumFg = document.getElementById("stratum-fg");
const stratumMid = document.getElementById("stratum-mid");
const stratumBg = document.getElementById("stratum-bg");

const rangeFg = document.getElementById("range-fg");
const rangeDepth = document.getElementById("range-depth");
const rangeAtmo = document.getElementById("range-atmo");

const valFg = document.getElementById("val-fg");
const valBlock = document.getElementById("val-block");
const valDepth = document.getElementById("val-depth");
const valAtmo = document.getElementById("val-atmo");
const valLadder = document.getElementById("val-ladder");

const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagTip = document.getElementById("diag-tip");

const pillarDepth = document.getElementById("pillar-depth");
const pillarLayer = document.getElementById("pillar-layer");
const pillarDistance = document.getElementById("pillar-distance");
const pillarFocus = document.getElementById("pillar-focus");
const pillarDepthVal = document.getElementById("pillar-depth-val");
const pillarLayerVal = document.getElementById("pillar-layer-val");
const pillarDistanceVal = document.getElementById("pillar-distance-val");
const pillarFocusVal = document.getElementById("pillar-focus-val");

const btnSight = document.getElementById("btn-sight");
const btnYawFront = document.getElementById("btn-yaw-front");
const btnYawSplit = document.getElementById("btn-yaw-split");
const btnReset = document.getElementById("btn-reset");

// 挂载 3D 多平面舞台或 2D 透视降级舞台（两者共用 model.js + artwork.js）
let stageRenderer;
if (webgl()) {
  try {
    stageRenderer = mountHero3D(heroCanvas, () => state, () => cachedEval);
    if (engineTag) engineTag.textContent = "3D 多平面景片 · WebGL";
  } catch {
    stageRenderer = mountHeroFlat(heroCanvas, () => state, () => cachedEval);
    if (engineTag) engineTag.textContent = "多平面景片 · 2D 透视";
  }
} else {
  stageRenderer = mountHeroFlat(heroCanvas, () => state, () => cachedEval);
  if (engineTag) engineTag.textContent = "多平面景片 · 2D 透视";
}

const heroLoop = loop(heroCanvas, (t, dt, meta) => {
  stageRenderer.render(t, dt, meta);
});

function setPillar(el, valEl, data) {
  el.classList.toggle("is-ok", data.ok);
  el.classList.toggle("is-err", !data.ok);
  valEl.textContent = data.text;
}

function syncUI() {
  cachedEval = evaluate(state);
  const ev = cachedEval;

  // 顶眉状态丸
  statusPill.textContent = ev.ok ? "4 / 4 纵深成立" : `${ev.score} / 4 待分层`;
  statusPill.classList.toggle("is-ok", ev.ok);
  statusPill.classList.toggle("is-err", !ev.ok);

  // 视角指示条
  const deg = Math.round(state.camYaw);
  yawReadout.textContent =
    Math.abs(deg) <= 2
      ? "视角 0° 正视成品 · 左右拖动 3D 拆层"
      : `视角 ${deg > 0 ? "+" : ""}${deg}° 3D 拆层 · 拖回 0° 看成品`;

  // 三道实色景片带实时数与达标点亮
  stratumFg.classList.toggle("is-pass", ev.checks.okFg);
  stratumMid.classList.toggle("is-pass", ev.checks.okDepth && ev.checks.okFocus);
  stratumBg.classList.toggle("is-pass", ev.checks.okContrast);

  rangeFg.value = String(Math.round(state.fgScale * 100));
  rangeDepth.value = String(Math.round(state.depthSpan * 100));
  rangeAtmo.value = String(Math.round(state.atmoFade * 100));

  valFg.textContent = `${ev.fgCoverPct}%`;
  valBlock.textContent = ` · 遮主 ${ev.heroBlockedPct}%`;
  valDepth.textContent = `${ev.planes.spanTotal} · ${ev.depthTier}`;
  valAtmo.textContent = `${Math.round(state.atmoFade * 100)}%`;
  valLadder.textContent = `${ev.contrast.fg} → ${ev.contrast.mid} → ${ev.contrast.bg}`;

  // 同步按钮激活态
  document.querySelectorAll("[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-fg-layout]").forEach((b) => {
    const on = b.dataset.fgLayout === state.fgLayout;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-focus]").forEach((b) => {
    const on = b.dataset.focus === state.focusMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  btnSight.classList.toggle("is-active", state.sightPulse > 0);
  btnSight.setAttribute("aria-pressed", String(state.sightPulse > 0));

  // 白话单真源诊单
  diagBadge.textContent = ev.badge;
  diagBadge.classList.toggle("is-ok", ev.ok);
  diagBadge.classList.toggle("is-err", !ev.ok);
  diagHeadline.textContent = ev.headline;
  diagWhy.textContent = ev.why;
  diagTip.textContent = ev.tip;

  // 四枚原海报线性关键词徽
  setPillar(pillarDepth, pillarDepthVal, ev.pillars.depth);
  setPillar(pillarLayer, pillarLayerVal, ev.pillars.layer);
  setPillar(pillarDistance, pillarDistanceVal, ev.pillars.distance);
  setPillar(pillarFocus, pillarFocusVal, ev.pillars.focus);

  heroLoop.draw();
}

// ---------- 交互绑定 ----------
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    syncUI();
  });
});

document.querySelectorAll("[data-fg-layout]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.fgLayout = btn.dataset.fgLayout;
    syncUI();
  });
});

document.querySelectorAll("[data-focus]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.focusMode = btn.dataset.focus;
    syncUI();
  });
});

rangeFg.addEventListener("input", () => {
  state.fgScale = Number(rangeFg.value) / 100;
  syncUI();
});

rangeDepth.addEventListener("input", () => {
  state.depthSpan = Number(rangeDepth.value) / 100;
  syncUI();
});

rangeAtmo.addEventListener("input", () => {
  state.atmoFade = Number(rangeAtmo.value) / 100;
  syncUI();
});

btnYawFront.addEventListener("click", () => {
  state.camYaw = 0;
  syncUI();
});

btnYawSplit.addEventListener("click", () => {
  state.camYaw = Math.abs(state.camYaw - 28) < 4 ? -28 : 28;
  syncUI();
});

btnSight.addEventListener("click", () => {
  state.sightPulse = state.sightPulse > 0 ? 0 : 1;
  syncUI();
});

btnReset.addEventListener("click", () => {
  Object.assign(state, BROKEN_STATE);
  syncUI();
});

// 画布直接横向拖拽（兼容 Pointer 与 Touch 事件，perf.mjs 触屏拖拽可实时触发 60fps 重绘）
let dragActive = false;
let dragStartX = 0;
let dragStartYaw = 0;

function beginDrag(clientX) {
  dragActive = true;
  dragStartX = clientX;
  dragStartYaw = state.camYaw;
}

function moveDrag(clientX) {
  if (!dragActive) return;
  const dx = clientX - dragStartX;
  let next = Math.max(-42, Math.min(42, dragStartYaw + dx * 0.24));
  // 靠近 0° 时轻吸附
  if (Math.abs(next) < 1.8 && Math.abs(dx) > 6) next = 0;
  state.camYaw = next;
  const deg = Math.round(state.camYaw);
  yawReadout.textContent =
    Math.abs(deg) <= 2
      ? "视角 0° 正视成品 · 左右拖动 3D 拆层"
      : `视角 ${deg > 0 ? "+" : ""}${deg}° 3D 拆层 · 拖回 0° 看成品`;
  heroLoop.draw();
}

function endDrag() {
  dragActive = false;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  beginDrag(e.clientX);
  try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
});
heroCanvas.addEventListener("pointermove", (e) => moveDrag(e.clientX));
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

heroCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) beginDrag(e.touches[0].clientX);
}, { passive: true });
heroCanvas.addEventListener("touchmove", (e) => {
  if (dragActive && e.touches.length === 1) moveDrag(e.touches[0].clientX);
}, { passive: true });
heroCanvas.addEventListener("touchend", endDrag, { passive: true });

// 键盘操作 3D 拆层视角（左右键转动视角，0 键正视）
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.camYaw = Math.max(-42, state.camYaw - 6);
    syncUI();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.camYaw = Math.min(42, state.camYaw + 6);
    syncUI();
  } else if (e.key === "0") {
    e.preventDefault();
    state.camYaw = 0;
    syncUI();
  }
});

// 初始化
syncUI();
initPeelLab();
initOpticsLab();
initHistoryStage();
initParallaxLab();
initAvoidClinic();
initQuiz();
initPosterLightbox();
