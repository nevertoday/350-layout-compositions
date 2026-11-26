// 308 净单人镜头 · 主入口：驱动开场片场清场与月轮逆光取景台 + 全页 01–07 节交互

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, VALID_PRESETS, FAIL_PRESETS, evaluate, clamp } from "./model.js";
import { renderViewfinder, hitTestClutter } from "./viewfinder.js";
import { initPosterSilhouette, onSilhouetteReady } from "./silhouette.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

const state = { ...INITIAL_STATE };
let gazeAnim = 0;       // 0 表示静止；>0 表示 0.8s 读图验真进度
let gazePlaying = false;
let introReveal = 0;    // 极克制的开场淡入展开（0.45s 内顺滑完成，任何一帧都清晰完整）
let dirty = true;

const canvas = document.getElementById("hero-canvas");
const scorePills = [...document.querySelectorAll("[data-score-pill]")];
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const diagMetrics = document.getElementById("diag-metrics");
const mobileHeadline = document.getElementById("mobile-diag-headline");
const badgeItems = [...document.querySelectorAll("[data-poster-badge]")];

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const toggleBtns = [...document.querySelectorAll("[data-toggle]")];
const validBtns = [...document.querySelectorAll("[data-valid]")];
const failBtns = [...document.querySelectorAll("[data-fail]")];

const sliderHaloX = document.getElementById("ctrl-halo-x");
const sliderSubX = document.getElementById("ctrl-sub-x");
const sliderAperture = document.getElementById("ctrl-aperture");
const sliderScale = document.getElementById("ctrl-scale");
const valHaloX = document.getElementById("val-halo-x");
const valSubX = document.getElementById("val-sub-x");
const valAperture = document.getElementById("val-aperture");
const valScale = document.getElementById("val-scale");

const btnCalibrate = document.getElementById("btn-calibrate");
const btnReset = document.getElementById("btn-reset");
const btnGaze = document.getElementById("btn-gaze");
const btnGuides = document.getElementById("btn-guides");
const btnMobileCalibrate = document.getElementById("btn-mobile-calibrate");
const btnMobileGaze = document.getElementById("btn-mobile-gaze");

let currentAspect = 1.28;
let lastCssW = 0;
let lastCssH = 0;

function syncUI(ev) {
  // 顶部与手机端状态胶囊
  scorePills.forEach((pill) => {
    pill.textContent = ev.badgeTag;
    pill.dataset.state = ev.passedCount === 4 ? "ok" : "warn";
  });

  // 底部原海报圆角「核心要点」实时白话诊单
  if (diagHeadline) diagHeadline.textContent = ev.headline;
  if (diagBody) diagBody.textContent = ev.body;
  if (diagAction) diagAction.textContent = ev.action;
  if (mobileHeadline) mobileHeadline.textContent = ev.headline;
  if (diagMetrics) {
    diagMetrics.textContent = `对比 ${ev.contourRatio}:1 · 视线留白 ${ev.lookRoomPct}% · 光圈 f/${state.aperture.toFixed(1)} · 人物占高 ${ev.subjectHeightPct}%`;
  }

  // 左栏 5 枚原海报酒红圆徽探针
  badgeItems.forEach((el) => {
    const idx = Number(el.dataset.posterBadge);
    const info = ev.posterBadges[idx];
    if (!info) return;
    const tag = el.querySelector("[data-badge-status]");
    if (tag) {
      tag.textContent = info.status;
      tag.dataset.state = info.ok ? "ok" : "warn";
    }
    el.dataset.ok = info.ok ? "true" : "false";
    el.setAttribute("aria-pressed", String(state.highlightBadge === idx));
  });

  // 场景按钮
  sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scene === state.scene)));

  // 4 个直击清场开关
  toggleBtns.forEach((b) => {
    const key = b.dataset.toggle;
    const isPresent = !!state[key];
    b.setAttribute("aria-pressed", String(isPresent));
    b.dataset.present = isPresent ? "true" : "false";
  });

  // 辅助线开关
  if (btnGuides) {
    btnGuides.setAttribute("aria-pressed", String(state.showGuides));
    btnGuides.textContent = state.showGuides ? "参考线：开" : "参考线：关";
  }

  // 原生滑块同步（不反向触发 input）
  if (sliderHaloX) sliderHaloX.value = String(Math.round(state.haloX * 100));
  if (sliderSubX) sliderSubX.value = String(Math.round(state.subjectX * 100));
  if (sliderAperture) sliderAperture.value = String(state.aperture.toFixed(1));
  if (sliderScale) sliderScale.value = String(Math.round(state.shotScale * 100));

  if (valHaloX) valHaloX.textContent = `${Math.round(state.haloX * 100)}%`;
  if (valSubX) valSubX.textContent = `${Math.round(state.subjectX * 100)}%`;
  if (valAperture) valAperture.textContent = `f/${state.aperture.toFixed(1)}`;
  if (valScale) valScale.textContent = `${Math.round(state.shotScale * 100)}%`;
}

function drawHero(t, dt, { still }) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(200, Math.round(rect.width || 640));
  const cssH = Math.max(180, Math.round(rect.height || 480));
  const sizeChanged = cssW !== lastCssW || cssH !== lastCssH;

  if (still) {
    introReveal = 1;
    if (gazePlaying) {
      gazeAnim = 0.95;
      gazePlaying = false;
    }
  } else {
    if (introReveal < 1) {
      introReveal = Math.min(1, introReveal + (dt || 0.016) * 2.4);
      dirty = true;
    }
    if (gazePlaying) {
      gazeAnim += (dt || 0.016) / 1.15;
      dirty = true;
      if (gazeAnim >= 1.25) {
        gazePlaying = false;
        gazeAnim = 0;
      }
    }
  }

  if (!dirty && !sizeChanged) return;
  dirty = false;
  lastCssW = cssW;
  lastCssH = cssH;
  currentAspect = cssW / Math.max(1, cssH);

  const dpr = pixelRatio(2);
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ev = renderViewfinder(ctx, cssW, cssH, state, {
    interactive: true,
    showStrikeHints: true,
    gazeAnim: gazeAnim > 0 ? Math.min(1, gazeAnim) : 0,
    t,
  });

  syncUI(ev);
}

const heroLoop = canvas ? loop(canvas, drawHero) : { draw() {} };

function touchState(patch) {
  Object.assign(state, patch);
  dirty = true;
  heroLoop.draw();
}

function triggerGazeTest() {
  if (reducedMotion.matches) {
    gazeAnim = gazeAnim > 0 ? 0 : 0.96;
    gazePlaying = false;
  } else {
    gazeAnim = 0.01;
    gazePlaying = true;
  }
  dirty = true;
  heroLoop.draw();
}

// =========================================================================
// 画布直觉交互：
// 1. 直接点击画布内干扰物（前肩、路人、穿头杆、杂墙亮灯）立即清场
// 2. 横向拖动画布平滑滑动淡奶黄圆月光池（同时自动补足自然亮度）
// 3. 触屏智能区分横拖 vs 竖滚，绝不阻塞页面上下滚动！
// =========================================================================
if (canvas) {
  let pointerId = null;
  let mode = "idle"; // "pending" | "drag" | "scroll"
  let startX = 0, startY = 0, startHaloX = 0, moved = false;

  const toNorm = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return {
      nx: clamp((clientX - r.left) / Math.max(1, r.width), 0, 1),
      ny: clamp((clientY - r.top) / Math.max(1, r.height), 0, 1),
      w: r.width,
    };
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId = e.pointerId;
    mode = e.pointerType === "touch" ? "pending" : "drag";
    startX = e.clientX;
    startY = e.clientY;
    startHaloX = state.haloX;
    moved = false;
    if (mode === "drag") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (pointerId !== e.pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (mode === "pending") {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        mode = "scroll"; // 让位给手机纵向滚动
        pointerId = null;
        return;
      }
      mode = "drag";
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }

    if (mode === "drag") {
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      const r = canvas.getBoundingClientRect();
      const nextHaloX = clamp(startHaloX + dx / Math.max(120, r.width), 0.14, 0.88);
      // 拖动光池靠近人物时柔和唤醒光池亮度，确保直观看到明暗分离
      const distToSub = Math.abs(nextHaloX - state.subjectX);
      const nextBright = distToSub < 0.22 ? Math.max(state.haloBright, 0.84) : state.haloBright;
      touchState({ haloX: +nextHaloX.toFixed(3), haloBright: +nextBright.toFixed(2) });
    }
  });

  // 为 tools/perf.mjs 的 Input.dispatchTouchEvent 提供零延迟原生触控响应
  let touchStartX = 0, touchStartY = 0, touchStartHalo = 0, touchLock = "";
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartHalo = state.haloX;
      touchLock = "";
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (!touchLock && Math.hypot(dx, dy) > 4) {
        touchLock = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (touchLock === "h") {
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        const nextHaloX = clamp(touchStartHalo + dx / Math.max(120, r.width), 0.14, 0.88);
        const distToSub = Math.abs(nextHaloX - state.subjectX);
        const nextBright = distToSub < 0.22 ? Math.max(state.haloBright, 0.84) : state.haloBright;
        touchState({ haloX: +nextHaloX.toFixed(3), haloBright: +nextBright.toFixed(2) });
      }
    },
    { passive: false }
  );

  const finishPointer = (e) => {
    if (pointerId !== e.pointerId) return;
    if (!moved) {
      const { nx, ny } = toNorm(e.clientX, e.clientY);
      const hit = hitTestClutter(state, nx, ny, currentAspect);
      if (hit) {
        touchState({ [hit]: false });
      }
    }
    pointerId = null;
    mode = "idle";
  };

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => {
    pointerId = null;
    mode = "idle";
  });

  // 键盘操作画布（方向键调光池与落位，Space 演播 0.8s 读图，R 复原）
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.shiftKey) touchState({ subjectX: +clamp(state.subjectX - 0.04, 0.22, 0.88).toFixed(2) });
      else touchState({ haloX: +clamp(state.haloX - 0.04, 0.14, 0.88).toFixed(2), haloBright: Math.max(state.haloBright, 0.84) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (e.shiftKey) touchState({ subjectX: +clamp(state.subjectX + 0.04, 0.22, 0.88).toFixed(2) });
      else touchState({ haloX: +clamp(state.haloX + 0.04, 0.14, 0.88).toFixed(2), haloBright: Math.max(state.haloBright, 0.84) });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerGazeTest();
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      touchState({ ...INITIAL_STATE, scene: state.scene });
    }
  });
}

// 绑定所有原生控件
sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => touchState({ scene: btn.dataset.scene }));
});

toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.toggle;
    touchState({ [k]: !state[k] });
  });
});

validBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = VALID_PRESETS[btn.dataset.valid];
    if (p) touchState({ ...p.patch });
  });
});

failBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = FAIL_PRESETS[btn.dataset.fail];
    if (p) touchState({ ...p.patch });
  });
});

badgeItems.forEach((el) => {
  el.addEventListener("click", () => {
    const idx = Number(el.dataset.posterBadge);
    touchState({ highlightBadge: state.highlightBadge === idx ? -1 : idx });
  });
});

sliderHaloX?.addEventListener("input", () => {
  const x = Number(sliderHaloX.value) / 100;
  touchState({ haloX: x, haloBright: Math.max(state.haloBright, 0.84) });
});
sliderSubX?.addEventListener("input", () => {
  touchState({ subjectX: Number(sliderSubX.value) / 100 });
});
sliderAperture?.addEventListener("input", () => {
  touchState({ aperture: Number(sliderAperture.value) });
});
sliderScale?.addEventListener("input", () => {
  touchState({ shotScale: Number(sliderScale.value) / 100 });
});

const applyClassic = () => touchState({ ...VALID_PRESETS.classic.patch });
btnCalibrate?.addEventListener("click", applyClassic);
btnMobileCalibrate?.addEventListener("click", applyClassic);
btnReset?.addEventListener("click", () => touchState({ ...INITIAL_STATE, scene: state.scene }));
btnGaze?.addEventListener("click", triggerGazeTest);
btnMobileGaze?.addEventListener("click", triggerGazeTest);
btnGuides?.addEventListener("click", () => touchState({ showGuides: !state.showGuides }));

// 全局 Space 快捷验真（仅在首屏可见且焦点不在按钮/滑块上）
window.addEventListener("keydown", (e) => {
  if (e.key !== " ") return;
  const tag = document.activeElement?.tagName || "";
  if (/BUTTON|INPUT|A|TEXTAREA|SELECT/.test(tag) || document.activeElement === canvas) return;
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const r = hero.getBoundingClientRect();
  if (r.bottom > 120 && r.top < window.innerHeight * 0.7) {
    e.preventDefault();
    triggerGazeTest();
  }
});

window.addEventListener("resize", () => {
  dirty = true;
  heroLoop.draw();
});

// 从页内 #poster 提取高清无虚线剪影，就绪后自动重绘首屏画布
initPosterSilhouette();
onSilhouetteReady(() => {
  dirty = true;
  heroLoop.draw();
});

// 同步初始化开场与 01–07 全部小节交互
heroLoop.draw();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
