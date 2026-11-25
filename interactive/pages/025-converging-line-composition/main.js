// 025 汇聚线构图 · 主入口控制器
// 协调开场单源模型、活体透视画布、底沿汇点收拢尺（data-perf-drag）及 01–08 节交互。

import { clamp, evaluate, INITIAL_STATE } from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  initArchetypeCards,
  initDepthLayersLab,
  initHistoryTabs,
  initMisuseCards,
  initPonzoLab,
  initPosterLightbox,
  initPracticeQuiz,
  initZoneMatrix,
} from "./sections.js";

const state = {
  ...INITIAL_STATE,
  vp: { ...INITIAL_STATE.vp },
};

const heroCanvas = document.getElementById("hero-canvas");
const convTrack = document.getElementById("conv-track");
const convThumb = document.getElementById("conv-thumb");
const convFill = document.getElementById("conv-fill");
const convReadout = document.getElementById("conv-readout");

const scoreBadgeTop = document.getElementById("hero-score-top");
const scoreBadgeMobile = document.getElementById("hero-score-mobile");
const diagBox = document.getElementById("hero-diag");
const diagTag = document.getElementById("diag-tag");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagNext = document.getElementById("diag-next");

const statSpread = document.getElementById("stat-spread");
const statAngle = document.getElementById("stat-angle");
const statDepth = document.getElementById("stat-depth");
const statZone = document.getElementById("stat-zone");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const focalBtns = [...document.querySelectorAll("[data-focal]")];
const spacingBtns = [...document.querySelectorAll("[data-spacing]")];
const targetBtns = [...document.querySelectorAll("[data-target]")];
const guidesBtn = document.getElementById("btn-guides");
const resetBtn = document.getElementById("btn-reset");
const titleRule = document.getElementById("title-conv-rule");

let heroCtrl = null;

function syncUI() {
  const aspect = heroCtrl ? heroCtrl.getAspect() : 1.8;
  const m = evaluate(state, aspect);

  // 1. 顶部与移动端分数灯
  const scoreText = m.passCount === 4 ? "4 / 4 已校准" : `${m.passCount} / 4 待校准`;
  for (const el of [scoreBadgeTop, scoreBadgeMobile]) {
    if (!el) continue;
    el.textContent = scoreText;
    el.classList.toggle("is-ok", m.passCount === 4);
  }

  // 2. 示范标题下的透视线装饰：随离散度与夹角实时收拢/张开
  if (titleRule) {
    titleRule.style.setProperty("--disp", String(state.dispersion));
    titleRule.classList.toggle("is-locked", m.converged);
  }

  // 3. 底沿「汇点收拢尺」（data-perf-drag）：左 0% 离散大 → 右 100% 单点锁汇
  const pct = Math.round((1 - state.dispersion) * 100);
  if (convThumb) convThumb.style.left = `${pct}%`;
  if (convFill) convFill.style.width = `${pct}%`;
  if (convTrack) {
    convTrack.setAttribute("aria-valuenow", String(pct));
    convTrack.setAttribute(
      "aria-valuetext",
      m.converged ? "单点已锁汇（偏差 0%）" : `三束射线离散 ${m.maxSpreadPct}%`
    );
    convTrack.classList.toggle("is-locked", m.converged);
  }
  if (convReadout) {
    convReadout.textContent = m.converged ? "单点锁汇 · 0.0%" : `三束离散 · ${m.maxSpreadPct}%`;
    convReadout.classList.toggle("is-ok", m.converged);
  }

  // 4. 按钮激活态
  sceneBtns.forEach((b) => {
    const active = b.dataset.scene === state.scene;
    b.setAttribute("aria-pressed", String(active));
    b.classList.toggle("is-active", active);
  });
  focalBtns.forEach((b) => {
    const active = Number(b.dataset.focal) === state.focalMm;
    b.setAttribute("aria-pressed", String(active));
    b.classList.toggle("is-active", active);
  });
  spacingBtns.forEach((b) => {
    const active = b.dataset.spacing === state.spacing;
    b.setAttribute("aria-pressed", String(active));
    b.classList.toggle("is-active", active);
  });
  targetBtns.forEach((b) => {
    const active = b.dataset.target === state.target;
    b.setAttribute("aria-pressed", String(active));
    b.classList.toggle("is-active", active);
  });
  if (guidesBtn) {
    guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    guidesBtn.textContent = state.showGuides ? "透视线：显" : "透视线：隐";
  }

  // 5. 原海报底沿四柱核心要点实时状态
  for (const key of ["focus", "perspective", "depth", "guidance"]) {
    const p = m.pillars[key];
    const col = document.querySelector(`[data-pillar="${key}"]`);
    if (!col) continue;
    col.classList.toggle("is-ok", p.ok);
    const badge = col.querySelector(".pillar-badge");
    if (badge) badge.textContent = p.badge;
  }

  // 6. 白话诊单与实测四数
  if (diagBox) diagBox.classList.toggle("is-ok", m.statusTone === "ok");
  if (diagTag) diagTag.textContent = m.statusTag;
  if (diagTitle) diagTitle.textContent = m.headline;
  if (diagBody) diagBody.textContent = m.detail;
  if (diagNext) diagNext.textContent = m.nextStep;

  if (statSpread) statSpread.textContent = `${m.maxSpreadPct}%`;
  if (statAngle) statAngle.textContent = `${m.apexAngleDeg}°`;
  if (statDepth) statDepth.textContent = `${m.depthRatio.toFixed(2)}×`;
  if (statZone) statZone.textContent = m.vpZoneLabel;
}

function patchState(patch) {
  if (patch.vp) state.vp = { ...state.vp, ...patch.vp };
  if (patch.scene !== undefined) state.scene = patch.scene;
  if (patch.dispersion !== undefined) state.dispersion = clamp(patch.dispersion, 0, 1);
  if (patch.focalMm !== undefined) state.focalMm = patch.focalMm;
  if (patch.spacing !== undefined) state.spacing = patch.spacing;
  if (patch.target !== undefined) state.target = patch.target;
  if (patch.showGuides !== undefined) state.showGuides = patch.showGuides;
  syncUI();
  heroCtrl?.redraw();
}

// 挂载开场透视舞台（画布尺寸变化时同步刷新 DOM 读数，确保画布徽标与下方四数严格单源一致）
if (heroCanvas) {
  heroCtrl = mountHeroStage(
    heroCanvas,
    () => state,
    (patch) => patchState(patch),
    () => syncUI()
  );
}

// 底沿「汇点收拢尺」（data-perf-drag）：兼容鼠标、触控（touchstart/touchmove）与键盘方向键
if (convTrack) {
  let dragging = false;

  const setFromClientX = (clientX) => {
    const rect = convTrack.getBoundingClientRect();
    const frac = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    let disp = +(1 - frac).toFixed(3);
    // 靠近右侧单点锁汇区（≤ 4.5%）轻轻磁吸归零
    if (disp < 0.045) disp = 0;
    patchState({ dispersion: disp });
  };

  convTrack.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    dragging = true;
    convTrack.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  });
  convTrack.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  });
  const endPointer = (e) => {
    if (!dragging) return;
    dragging = false;
    if (e?.pointerId != null) {
      try { convTrack.releasePointerCapture(e.pointerId); } catch {}
    }
  };
  convTrack.addEventListener("pointerup", endPointer);
  convTrack.addEventListener("pointercancel", endPointer);

  // 额外绑定原生 touch 事件，确保 perf.mjs 直接派发的触摸事件每帧零延迟驱动重画
  convTrack.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      dragging = true;
      setFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  convTrack.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || !e.touches.length) return;
      e.preventDefault();
      setFromClientX(e.touches[0].clientX);
    },
    { passive: false }
  );
  convTrack.addEventListener("touchend", () => { dragging = false; }, { passive: true });
  convTrack.addEventListener("touchcancel", () => { dragging = false; }, { passive: true });

  // 键盘操作
  convTrack.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.14 : 0.05;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = state.dispersion - step;
      patchState({ dispersion: next < 0.04 ? 0 : next });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      patchState({ dispersion: state.dispersion + step });
    }
  });
}

// 绑定场景、焦段、递进、焦点目标与复原错态按钮
sceneBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ scene: b.dataset.scene }))
);
focalBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ focalMm: Number(b.dataset.focal) }))
);
spacingBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ spacing: b.dataset.spacing }))
);
targetBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ target: b.dataset.target }))
);
guidesBtn?.addEventListener("click", () => patchState({ showGuides: !state.showGuides }));
resetBtn?.addEventListener("click", () =>
  patchState({
    ...INITIAL_STATE,
    vp: { ...INITIAL_STATE.vp },
    scene: state.scene,
  })
);

syncUI();

// 初始化 01–08 节交互模块
initPonzoLab();
initZoneMatrix();
initDepthLayersLab();
initArchetypeCards();
initHistoryTabs();
initMisuseCards();
initPracticeQuiz();
initPosterLightbox();
