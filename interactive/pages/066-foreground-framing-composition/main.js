// 066 前景框架构图 — 主入口：活体穿框取景台交互、单真源读数同步、灯箱与 01–06 节装配
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ARCHETYPES,
  ERROR_STATE,
  POSTER_SOLUTION,
  SCENES,
  clamp,
  evaluate,
} from "./model.js";
import { renderHeroStage } from "./artwork.js";
import { initSec01, initSec02, initSec03, initSec04, initSec05, initSec06 } from "./sections.js";

const $ = (id) => document.getElementById(id);

// ---------- 开场活体穿框取景台 ----------
const heroCanvas = $("hero-canvas");
const heroWrap = $("hero-stage-wrap");

const state = { ...ERROR_STATE };
const shown = {
  stanceX: state.stanceX,
  apertureSize: state.apertureSize,
};

let aspect = 1.18;
let cssW = 560;
let cssH = 475;
let lastHandles = { rimX: 0, rimY: 0, acX: 0, acY: 0 };
let dragMode = null; // "pan" | "aperture" | null
let dragStartX = 0;
let dragStartStance = 0;
let dragStartAperture = 0;
let lastUiSyncMs = 0;

// 预缓存高频 DOM 节点，避免拖动时反复 querySelectorAll 和触发整页回流
const dom = {
  topStatus: $("top-status"),
  titleWord: $("title-frame-word"),
  hudArch: $("hud-archetype"),
  hudMetrics: $("hud-metrics"),
  rulerNeedle: $("ruler-needle"),
  coFrameVal: $("co-frame-val"),
  coEncloseVal: $("co-enclose-val"),
  coGuideVal: $("co-guide-val"),
  coFrameBtn: document.querySelector('.callout-btn[data-part="frame"]'),
  coEncloseBtn: document.querySelector('.callout-btn[data-part="enclose"]'),
  coGuideBtn: document.querySelector('.callout-btn[data-part="guide"]'),
  diagCard: $("diag-card"),
  diagBadge: $("diag-badge"),
  diagHeadline: $("diag-headline"),
  diagWhy: $("diag-why"),
  diagAction: $("diag-action"),
  valAperture: $("val-aperture"),
  ctrlFrame: $("ctrl-frame"),
  rngAperture: $("rng-aperture"),
  valEnclose: $("val-enclose"),
  ctrlEnclose: $("ctrl-enclose"),
  valStance: $("val-stance"),
  ctrlGuide: $("ctrl-guide"),
  rngStance: $("rng-stance"),
  valEmphasis: $("val-emphasis"),
  ctrlEmphasis: $("ctrl-emphasis"),
  guideBtn: $("btn-toggle-guides"),
  clutterBtns: [...document.querySelectorAll("[data-clutter]")],
  toneBtns: [...document.querySelectorAll("[data-tone]")],
  archBtns: [...document.querySelectorAll("[data-archetype]")],
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
};

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function setClass(el, cls) {
  if (el && el.className !== cls) el.className = cls;
}

function heroDpr() {
  return cssW < 500 ? pixelRatio(1.5) : pixelRatio(2);
}

function resizeHero() {
  const r = heroWrap.getBoundingClientRect();
  cssW = Math.max(200, Math.round(r.width));
  cssH = Math.max(200, Math.round(r.height));
  aspect = cssW / Math.max(cssH, 1);
  const dpr = heroDpr();
  heroCanvas.width = Math.round(cssW * dpr);
  heroCanvas.height = Math.round(cssH * dpr);
}

function syncUI(ev) {
  // 1. 顶眉状态章 & 示范大标微联动（不改 padding 以免整页回流，用框色与轮廓偏移响应）
  setText(dom.topStatus, ev.isPass ? "4 / 4 已成框" : `${ev.passedCount} / 4 待框景`);
  setClass(dom.topStatus, `status-pill ${ev.isPass ? "is-ok" : "is-err"}`);

  if (dom.titleWord) {
    dom.titleWord.classList.toggle("is-ok", ev.isPass);
  }

  // 2. 画布角标
  setText(dom.hudArch, `${ARCHETYPES[state.archetype].label} · ${SCENES[state.scene].label}`);
  const openPct = Math.round(ev.openRatio * 100);
  const clipPct = Math.round(ev.clipRatio * 100);
  setText(
    dom.hudMetrics,
    clipPct > 0 ? `开口 ${openPct}% · 裁切 ${clipPct}%` : `开口 ${openPct}% · 反差 ${ev.frameBgContrast.toFixed(1)}:1`
  );

  // 3. 底沿标尺指针（直接映射真实开口百分比 0..100%）
  const needleLeft = `${clamp(openPct, 2, 98)}%`;
  if (dom.rulerNeedle.style.left !== needleLeft) dom.rulerNeedle.style.left = needleLeft;

  // 4. 左翼原海报三道引注实时读数
  const mapCo = [
    [dom.coFrameBtn, dom.coFrameVal, ev.callouts.frame],
    [dom.coEncloseBtn, dom.coEncloseVal, ev.callouts.enclose],
    [dom.coGuideBtn, dom.coGuideVal, ev.callouts.guide],
  ];
  for (const [btn, valEl, info] of mapCo) {
    setText(valEl, info.status);
    setClass(valEl, `callout-val ${info.ok ? "is-ok" : "is-err"}`);
    if (btn) btn.classList.toggle("is-ok", info.ok);
  }

  // 5. 右翼深酒红建筑竖柱：白话诊单
  dom.diagCard.classList.toggle("is-ok", ev.isPass);
  setText(dom.diagBadge, ev.badge);
  setClass(dom.diagBadge, `diag-badge ${ev.isPass ? "is-ok" : "is-err"}`);
  setText(dom.diagHeadline, ev.headline);
  setText(dom.diagWhy, ev.why);
  setText(dom.diagAction, ev.action);

  // 6. 运用要点四控条状态同步
  setText(dom.valAperture, `${openPct}%`);
  setClass(dom.ctrlFrame, `ctrl-row ${ev.pillars.okFrame ? "is-ok" : "is-err"}`);
  const apStr = String(Math.round(state.apertureSize * 100));
  if (dom.rngAperture.value !== apStr) dom.rngAperture.value = apStr;

  setText(dom.valEnclose, ev.callouts.enclose.status);
  setClass(dom.ctrlEnclose, `ctrl-row ${ev.pillars.okEnclose ? "is-ok" : "is-err"}`);
  for (const b of dom.clutterBtns) {
    b.classList.toggle("is-active", (b.dataset.clutter === "on") === state.clutter);
  }

  const stPct = Math.round(state.stanceX * 100);
  setText(dom.valStance, stPct === 0 ? "正中 0%" : stPct < 0 ? `偏左 ${Math.abs(stPct)}%` : `偏右 ${stPct}%`);
  setClass(dom.ctrlGuide, `ctrl-row ${ev.pillars.okGuide ? "is-ok" : "is-err"}`);
  const stStr = String(stPct);
  if (dom.rngStance.value !== stStr) dom.rngStance.value = stStr;

  setText(dom.valEmphasis, ev.callouts.emphasis.status);
  setClass(dom.ctrlEmphasis, `ctrl-row ${ev.pillars.okEmphasis ? "is-ok" : "is-err"}`);
  for (const b of dom.toneBtns) {
    b.classList.toggle("is-active", b.dataset.tone === state.toneMode);
  }

  // 7. 底部原型卡片与场景切换同步
  for (const b of dom.archBtns) {
    const active = b.dataset.archetype === state.archetype;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  }
  for (const b of dom.sceneBtns) {
    b.classList.toggle("is-active", b.dataset.scene === state.scene);
  }

  dom.guideBtn.setAttribute("aria-pressed", String(state.showGuides));
  setText(dom.guideBtn, state.showGuides ? "标线：显" : "标线：隐");
}

function drawHeroFrame(t, dt, { still }) {
  const k = still || dragMode ? 1 : dt ? 1 - Math.exp(-dt * 12) : 1;
  shown.stanceX += (state.stanceX - shown.stanceX) * k;
  shown.apertureSize += (state.apertureSize - shown.apertureSize) * k;

  const liveState = {
    ...state,
    stanceX: shown.stanceX,
    apertureSize: shown.apertureSize,
  };
  const ev = evaluate(liveState, aspect);
  const dpr = heroDpr();
  const ctx = heroCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lastHandles = renderHeroStage(ctx, cssW, cssH, liveState, ev, still ? 0 : t);
}

const heroLoop = loop(heroWrap, drawHeroFrame);

function refresh(immediate = false, fromDrag = false) {
  if (immediate || reducedMotion.matches) {
    shown.stanceX = state.stanceX;
    shown.apertureSize = state.apertureSize;
  }
  const now = performance.now();
  // 连续拖动时节流 DOM 读数更新至 ~12Hz，放手立即全量同步；画布保持 60Hz 丝滑重绘
  if (!fromDrag || now - lastUiSyncMs > 85) {
    lastUiSyncMs = now;
    syncUI(evaluate(state, aspect));
  }
  if (!fromDrag || reducedMotion.matches) {
    heroLoop.draw();
  }
}

// ---------- 主画布直接交互：横拖移步视差 & 拖框口拉环开合 ----------
function localXY(e) {
  const r = heroCanvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const { x, y } = localXY(e);
  const distRim = Math.hypot(x - lastHandles.rimX, y - lastHandles.rimY);
  dragMode = distRim <= 28 ? "aperture" : "pan";
  dragStartX = e.clientX;
  dragStartStance = state.stanceX;
  dragStartAperture = state.apertureSize;
  heroCanvas.classList.add("is-dragging");
  try {
    heroCanvas.setPointerCapture(e.pointerId);
  } catch {
    // 某些合成触摸事件下忽略 pointerCapture 异常
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragMode) return;
  const dx = e.clientX - dragStartX;
  if (dragMode === "aperture") {
    state.apertureSize = clamp(dragStartAperture + (dx / Math.max(cssW, 1)) * 1.65, 0.22, 0.95);
  } else {
    // 横向拖动直接驱动近远视差机位
    state.stanceX = clamp(dragStartStance + (dx / Math.max(cssW, 1)) * 1.25, -0.44, 0.44);
  }
  refresh(true, true);
});

function endDrag() {
  if (!dragMode) return;
  // 靠近理想视差中心时轻微吸附，但不强制阻拦故意偏离试错
  if (dragMode === "pan" && Math.abs(state.stanceX - 0.02) < 0.032) {
    state.stanceX = 0.02;
  }
  dragMode = null;
  heroCanvas.classList.remove("is-dragging");
  refresh(false);
}

heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

// 键盘操作画布：←/→ 移步视差，↑/↓ 开合框口
heroCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.02 : 0.05;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.stanceX = clamp(state.stanceX - step, -0.44, 0.44);
    refresh(true);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.stanceX = clamp(state.stanceX + step, -0.44, 0.44);
    refresh(true);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.apertureSize = clamp(state.apertureSize + step, 0.22, 0.95);
    refresh(true);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.apertureSize = clamp(state.apertureSize - step, 0.22, 0.95);
    refresh(true);
  }
});

// ---------- 控件绑定 ----------
$("rng-aperture").addEventListener("input", (e) => {
  state.apertureSize = clamp(Number(e.target.value) / 100, 0.22, 0.95);
  refresh(true);
});

$("rng-stance").addEventListener("input", (e) => {
  state.stanceX = clamp(Number(e.target.value) / 100, -0.44, 0.44);
  refresh(true);
});

document.querySelectorAll("[data-clutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.clutter = btn.dataset.clutter === "on";
    refresh(true);
  });
});

document.querySelectorAll("[data-tone]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.toneMode = btn.dataset.tone;
    refresh(true);
  });
});

document.querySelectorAll("[data-archetype]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.archetype = btn.dataset.archetype;
    refresh(false);
  });
});

document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    refresh(false);
  });
});

$("btn-center-stance").addEventListener("click", () => {
  state.stanceX = 0.02;
  refresh(false);
});

$("btn-toggle-guides").addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  refresh(true);
});

$("btn-reset-error").addEventListener("click", () => {
  Object.assign(state, ERROR_STATE);
  document.querySelectorAll(".callout-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
  refresh(false);
});

$("btn-poster-sol").addEventListener("click", () => {
  Object.assign(state, POSTER_SOLUTION);
  document.querySelectorAll(".callout-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
  refresh(false);
});

document.querySelectorAll(".callout-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const part = btn.dataset.part;
    state.highlightPart = state.highlightPart === part ? null : part;
    document.querySelectorAll(".callout-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.part === state.highlightPart));
    });
    refresh(true);
  });
});

// ---------- 07 节原海报灯箱（复用 #poster.src，支持缩放、拖动、Esc 关） ----------
function initLightbox() {
  const poster = $("poster");
  const openBtn = $("poster-open");
  const lb = $("lightbox");
  const lbImg = $("lb-img");
  const lbVp = $("lb-viewport");
  const scaleEl = $("lb-scale");

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let px0 = 0;
  let py0 = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    scaleEl.textContent = `${Math.round(zoom * 100)}%`;
  }

  function resetLb() {
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    lbImg.src = poster.src;
    resetLb();
    lb.hidden = false;
    $("lb-close").focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  $("lb-close").addEventListener("click", close);
  $("lb-reset").addEventListener("click", resetLb);
  $("lb-in").addEventListener("click", () => {
    zoom = clamp(zoom + 0.35, 0.75, 3.5);
    applyTransform();
  });
  $("lb-out").addEventListener("click", () => {
    zoom = clamp(zoom - 0.35, 0.75, 3.5);
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  lbVp.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = clamp(zoom + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 3.5);
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbVp.addEventListener("pointerdown", (e) => {
    if (e.target === lbVp && zoom <= 1) {
      close();
      return;
    }
    panning = true;
    px0 = e.clientX - tx;
    py0 = e.clientY - ty;
    lbVp.classList.add("is-dragging");
    try { lbVp.setPointerCapture(e.pointerId); } catch {}
  });
  lbVp.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - px0;
    ty = e.clientY - py0;
    applyTransform();
  });
  const stopPan = () => {
    panning = false;
    lbVp.classList.remove("is-dragging");
  };
  lbVp.addEventListener("pointerup", stopPan);
  lbVp.addEventListener("pointercancel", stopPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// ---------- 初始化 ----------
resizeHero();
refresh(true);
new ResizeObserver(() => {
  resizeHero();
  refresh(true);
}).observe(heroWrap);

initSec01();
initSec02();
initSec03();
initSec04();
initSec05();
initSec06();
initLightbox();
