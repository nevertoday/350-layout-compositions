// 135 对称跨页 · 主控模块：串联单真源模型、开场书卷舞台、六节实验台与原海报灯箱

import { INITIAL_STATE, PRESETS, clamp, computeSpread } from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import {
  initCanonLab,
  initFoldCompareLab,
  initGutterSectionLab,
  initPillarBreakLab,
  initQuizLab,
  initScenarioFilter,
} from "./stage-labs.js";

const state = { ...INITIAL_STATE };
let heroStage = null;

// ---------- 单真源 DOM 同步 ----------
const el = {
  statusPill: document.getElementById("hero-status-pill"),
  foldBtn: document.getElementById("btn-hero-fold"),
  guidesBtn: document.getElementById("btn-hero-guides"),
  chipAxis: document.getElementById("chip-axis"),
  chipMirror: document.getElementById("chip-mirror"),
  chipBalance: document.getElementById("chip-balance"),
  chipOrder: document.getElementById("chip-order"),
  diagPanel: document.querySelector(".diag-panel"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  diagFixBtn: document.getElementById("btn-diag-fix"),
  mInner: document.getElementById("m-inner"),
  mFit: document.getElementById("m-fit"),
  mMass: document.getElementById("m-mass"),
  mPosture: document.getElementById("m-posture"),
  rngShift: document.getElementById("rng-shift"),
  outShift: document.getElementById("out-shift"),
  rngDy: document.getElementById("rng-dy"),
  outDy: document.getElementById("out-dy"),
  rngScale: document.getElementById("rng-scale"),
  outScale: document.getElementById("out-scale"),
};

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const modeBtns = [...document.querySelectorAll("[data-mode]")];
const bindingBtns = [...document.querySelectorAll("[data-binding]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

let latestFixPatch = null;

function setText(node, val) {
  if (node && node.textContent !== val) node.textContent = val;
}
function setClass(node, val) {
  if (node && node.className !== val) node.className = val;
}

function setChip(node, pillar) {
  if (!node) return;
  setText(node, pillar.chip);
  setClass(node, `pillar-chip ${pillar.ok ? "is-ok" : "is-bad"}`);
}

let syncRaf = 0;

function flushDomSync() {
  syncRaf = 0;
  const res = computeSpread(state);
  const { diagnosis, pillars, metrics } = res;
  latestFixPatch = diagnosis.fixPatch;

  // 刊头状态丸与快捷开关（只在值真变化时触碰 DOM，避免拖动期无谓重排）
  setText(el.statusPill, diagnosis.badge);
  setClass(el.statusPill, `verdict-pill ${diagnosis.ok ? "is-ok" : "is-bad"}`);

  el.foldBtn.classList.toggle("is-active", state.foldOpen);
  el.foldBtn.setAttribute("aria-pressed", String(state.foldOpen));
  setText(el.foldBtn, state.foldOpen ? "摊平跨页" : "对折验镜");

  el.guidesBtn.classList.toggle("is-active", state.guides);
  el.guidesBtn.setAttribute("aria-pressed", String(state.guides));
  setText(el.guidesBtn, state.guides ? "标尺：开" : "标尺：关");

  // 四柱探针（轴线 / 镜像 / 平衡 / 秩序）
  setChip(el.chipAxis, pillars.axis);
  setChip(el.chipMirror, pillars.mirror);
  setChip(el.chipBalance, pillars.balance);
  setChip(el.chipOrder, pillars.order);

  // 单真源白话诊单
  el.diagPanel.classList.toggle("is-ok", diagnosis.ok);
  setText(el.diagBadge, diagnosis.badge);
  setClass(el.diagBadge, `diag-badge ${diagnosis.ok ? "is-ok" : "is-bad"}`);
  setText(el.diagTitle, diagnosis.title);
  setText(el.diagWhy, diagnosis.why);
  setText(el.diagAction, diagnosis.action);
  setText(el.diagFixBtn, diagnosis.fixLabel);
  el.diagFixBtn.classList.toggle("is-ok", diagnosis.ok);

  // 实测指标（全部出自 computeSpread 单真源）
  setText(el.mInner, `${metrics.rectoInnerMm.toFixed(1)}mm`);
  setText(el.mFit, `${metrics.mirrorFitPct}%`);
  setText(el.mMass, `${metrics.massRatio.toFixed(2)}×`);
  setText(el.mPosture, metrics.postureLabel);

  // 按钮组激活态
  for (const b of specimenBtns) {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
  for (const b of modeBtns) {
    const on = b.dataset.mode === state.mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of bindingBtns) {
    const on = b.dataset.binding === state.binding;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }

  // 三滑块同步
  const shiftStr = String(state.rectoShift);
  if (el.rngShift.value !== shiftStr) el.rngShift.value = shiftStr;
  setText(el.outShift, `${state.rectoShift > 0 ? "+" : state.rectoShift < 0 ? "−" : ""}${Math.abs(state.rectoShift).toFixed(1)}%`);

  const dyStr = String(state.deltaY);
  if (el.rngDy.value !== dyStr) el.rngDy.value = dyStr;
  setText(el.outDy, `${state.deltaY > 0 ? "+" : state.deltaY < 0 ? "−" : ""}${Math.abs(Math.round(state.deltaY))}px`);

  const scaleStr = String(state.rectoScale);
  if (el.rngScale.value !== scaleStr) el.rngScale.value = scaleStr;
  setText(el.outScale, `${state.rectoScale.toFixed(2)}×`);
}

let syncTimer = 0;
let lastDomSync = 0;

function syncAll(immediate = false, dragging = false) {
  if (heroStage) heroStage.markDirty(immediate);
  if (immediate) {
    if (syncRaf) { cancelAnimationFrame(syncRaf); syncRaf = 0; }
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = 0; }
    lastDomSync = performance.now();
    flushDomSync();
    return;
  }
  if (dragging) {
    // 拖动期画布每帧 60Hz 重绘，但外围 DOM 诊单节流至 120ms 刷新一次并在松手瞬间补齐，杜绝慢手机软件渲染每帧整页重排
    const now = performance.now();
    if (now - lastDomSync >= 120) {
      lastDomSync = now;
      flushDomSync();
    } else if (!syncTimer) {
      syncTimer = setTimeout(() => {
        syncTimer = 0;
        lastDomSync = performance.now();
        flushDomSync();
      }, 120);
    }
    return;
  }
  if (!syncRaf) {
    syncRaf = requestAnimationFrame(() => {
      lastDomSync = performance.now();
      flushDomSync();
    });
  }
}

function updateState(patch, immediate = false, dragging = false) {
  Object.assign(state, patch);
  syncAll(immediate, dragging);
}

// ---------- 绑定首屏所有控件 ----------
for (const b of specimenBtns) {
  b.addEventListener("click", () => updateState({ specimen: b.dataset.specimen }));
}
for (const b of modeBtns) {
  b.addEventListener("click", () => updateState({ mode: b.dataset.mode }));
}
for (const b of bindingBtns) {
  b.addEventListener("click", () => updateState({ binding: b.dataset.binding }));
}
for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) updateState(p.patch);
  });
}

el.foldBtn.addEventListener("click", () => updateState({ foldOpen: !state.foldOpen }));
el.guidesBtn.addEventListener("click", () => updateState({ guides: !state.guides }));
el.diagFixBtn.addEventListener("click", () => {
  if (latestFixPatch) updateState(latestFixPatch);
});

el.rngShift.addEventListener("input", () => updateState({ rectoShift: Number(el.rngShift.value) }));
el.rngDy.addEventListener("input", () => updateState({ deltaY: Number(el.rngDy.value) }));
el.rngScale.addEventListener("input", () => updateState({ rectoScale: Number(el.rngScale.value) }));

// 挂载开场书卷 2D Canvas
const heroCanvas = document.getElementById("hero-canvas");
if (heroCanvas) {
  heroStage = mountHeroStage(heroCanvas, () => state, updateState);
}
syncAll(true);

// ---------- 挂载正文 01–06 节差异化实验台 ----------
initFoldCompareLab();
initPillarBreakLab();
initGutterSectionLab();
initCanonLab();
initScenarioFilter();
initQuizLab();

// ---------- 原海报灯箱（复用 #poster.src，绝不二次内联；支持放大、拖拽、Esc 关闭） ----------
function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const box = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const img = document.getElementById("lb-img");
  const zoomOut = document.getElementById("lb-out");
  const zoomIn = document.getElementById("lb-in");
  const zoomReset = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  const zoomRead = document.getElementById("lb-zoom");
  if (!poster || !openBtn || !box || !img) return;

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function apply() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    zoomRead.textContent = `${Math.round(zoom * 100)}%`;
  }

  function open() {
    img.src = poster.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    apply();
    box.hidden = false;
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomIn.addEventListener("click", () => {
    zoom = clamp(zoom + 0.35, 0.7, 3.5);
    apply();
  });
  zoomOut.addEventListener("click", () => {
    zoom = clamp(zoom - 0.35, 0.7, 3.5);
    if (zoom <= 1) { tx = 0; ty = 0; }
    apply();
  });
  zoomReset.addEventListener("click", () => {
    zoom = 1;
    tx = 0;
    ty = 0;
    apply();
  });

  vp.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom = clamp(zoom + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 3.5);
      if (zoom <= 1) { tx = 0; ty = 0; }
      apply();
    },
    { passive: false }
  );

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp && zoom <= 1.05) {
      close();
      return;
    }
    pan = { x: e.clientX, y: e.clientY, tx0: tx, ty0: ty };
    vp.classList.add("is-panning");
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = pan.tx0 + (e.clientX - pan.x);
    ty = pan.ty0 + (e.clientY - pan.y);
    apply();
  });

  const endPan = () => {
    pan = null;
    vp.classList.remove("is-panning");
  };
  vp.addEventListener("pointerup", endPan);
  vp.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (!box.hidden && e.key === "Escape") close();
  });
}

initLightbox();
