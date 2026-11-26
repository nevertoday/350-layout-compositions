// 085 平面化构图 · 主入口与全页联动
import { createInitialState, evaluate, PRESETS } from "./model.js";
import { reducedMotion } from "../../lib/stage.js";
import { mountFlatnessPress } from "./press.js";
import { mountAntiChecklist, mountAppGallery, mountCompareCurtain, mountHistoryStage, mountLayerDeck, mountQuiz } from "./labs.js";

const state = createInitialState();

// DOM 引用
const pressCanvas = document.getElementById("press-canvas");
const flattenRange = document.getElementById("flatten-range");
const flattenVal = document.getElementById("flatten-val");
const stampDesktop = document.getElementById("status-stamp");
const stampMobile = document.getElementById("status-stamp-m");
const diagPill = document.getElementById("diag-pill");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const btnFix = document.getElementById("btn-fix");
const mAngle = document.getElementById("m-angle");
const mOverlap = document.getElementById("m-overlap");
const mContrast = document.getElementById("m-contrast");
const mPosture = document.getElementById("m-posture");
const btnGuides = document.getElementById("btn-guides");

const sceneBtns = document.querySelectorAll("[data-scene]");
const presetBtns = document.querySelectorAll("[data-preset]");
const shadingBtns = document.querySelectorAll("[data-shading]");
const colorBtns = document.querySelectorAll("[data-color]");
const simplifyBtns = document.querySelectorAll("[data-simplify]");
const decorBtns = document.querySelectorAll("[data-decor]");

let press = null;
let currentFixPatch = null;

const setText = (el, val) => {
  if (el && el.textContent !== val) el.textContent = val;
};
const setAttr = (el, k, v) => {
  if (el && el.getAttribute(k) !== v) el.setAttribute(k, v);
};

function syncUI(forceDraw = false) {
  const ev = evaluate(state);
  const pass = ev.passedCount === 4;

  // 顶部与手机印章
  for (const el of [stampDesktop, stampMobile]) {
    if (!el) continue;
    setText(el, ev.badge);
    el.classList.toggle("is-pass", pass);
  }

  // 压平滑杆
  if (flattenRange && flattenRange.value !== String(ev.flattenPct)) flattenRange.value = String(ev.flattenPct);
  setText(flattenVal, `${ev.flattenPct}%`);

  // 单真源诊单
  setText(diagPill, ev.badge);
  diagPill.classList.toggle("is-pass", pass);
  setText(diagHeadline, ev.headline);
  diagHeadline.classList.toggle("is-pass", pass);
  setText(diagBody, ev.body);
  setText(diagHint, ev.hint);

  setText(mAngle, `${ev.tableAngleDeg}°`);
  setText(mOverlap, `${ev.overlapCount} 处`);
  setText(mContrast, `${ev.minEdgeContrast}:1`);
  setText(mPosture, ev.posture);

  if (ev.fixAction) {
    currentFixPatch = ev.fixAction.patch;
    setText(btnFix, ev.fixAction.label);
    btnFix.hidden = false;
  } else {
    currentFixPatch = PRESETS.errMerge.patch;
    setText(btnFix, "故意试错：看同色融死");
    btnFix.hidden = false;
  }

  // 原海报四枚核心特征实时探针
  for (const key of ["plane", "compress", "silhouette", "decor"]) {
    const f = ev.features[key];
    const card = document.querySelector(`[data-feat="${key}"]`);
    const tag = document.getElementById(`feat-${key}`);
    if (card) card.classList.toggle("is-ok", f.ok);
    setText(tag, f.tag);
  }

  // 按钮激活态同步
  sceneBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.scene === state.scene)));
  shadingBtns.forEach((b) => setAttr(b, "aria-pressed", String(Number(b.dataset.shading) === state.shading)));
  colorBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.color === state.colorMode)));
  simplifyBtns.forEach((b) => setAttr(b, "aria-pressed", String(Number(b.dataset.simplify) === state.simplify)));
  decorBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.decor === state.decor)));
  if (btnGuides) {
    setAttr(btnGuides, "aria-pressed", String(state.showGuides));
    setText(btnGuides, state.showGuides ? "标注线：开" : "标注线：关");
  }

  if (press && (forceDraw || reducedMotion.matches)) press.draw();
}

let dragUiTimer = 0;
function patchState(patch, fromDrag = false) {
  Object.assign(state, patch);
  if (fromDrag && !reducedMotion.matches) {
    // 拖动中 Canvas 由 rAF 60fps 直绘，DOM 读数合并节流刷新以降低慢手机软件渲染主线程压力
    if (!dragUiTimer) {
      dragUiTimer = window.setTimeout(() => {
        dragUiTimer = 0;
        syncUI(false);
      }, 64);
    }
    return;
  }
  if (dragUiTimer) {
    clearTimeout(dragUiTimer);
    dragUiTimer = 0;
  }
  syncUI(true);
}

// 绑定开场主交互（拖动期间由 rAF loop 单次绘帧，抬手立即精确同步 DOM）
press = mountFlatnessPress(
  pressCanvas,
  () => state,
  (patch, done = false) => patchState(patch, !done)
);

if (flattenRange) {
  flattenRange.addEventListener("input", () => patchState({ flatten: Number(flattenRange.value) / 100 }));
}

sceneBtns.forEach((b) => b.addEventListener("click", () => patchState({ scene: b.dataset.scene })));
presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) patchState(p.patch);
  })
);
shadingBtns.forEach((b) => b.addEventListener("click", () => patchState({ shading: Number(b.dataset.shading) })));
colorBtns.forEach((b) => b.addEventListener("click", () => patchState({ colorMode: b.dataset.color })));
simplifyBtns.forEach((b) => b.addEventListener("click", () => patchState({ simplify: Number(b.dataset.simplify) })));
decorBtns.forEach((b) => b.addEventListener("click", () => patchState({ decor: b.dataset.decor })));

if (btnFix) {
  btnFix.addEventListener("click", () => {
    if (currentFixPatch) patchState(currentFixPatch);
  });
}

if (btnGuides) {
  btnGuides.addEventListener("click", () => patchState({ showGuides: !state.showGuides }));
}

// 01–06 节交互挂载
mountCompareCurtain();
mountLayerDeck();
mountHistoryStage();
mountAppGallery();
mountAntiChecklist();
mountQuiz();

// 07 节：原海报灯箱（复用 #poster 的 src，绝不重复内联，支持放大/拖拽/Esc 关闭）
function mountLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const stage = document.getElementById("lb-stage");
  const img = document.getElementById("lb-img");
  const btnZoom = document.getElementById("lb-zoom");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!trigger || !poster || !lb || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnZoom.textContent = scale > 1.1 ? "还原 1×" : "放大 1.8×";
  }

  function open() {
    img.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });
  btnZoom.addEventListener("click", () => {
    scale = scale > 1.1 ? 1 : 1.8;
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage && scale === 1) {
      close();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

mountLightbox();
syncUI();
