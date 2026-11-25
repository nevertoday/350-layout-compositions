// 212 横排左起 · 入口协调器
// 统一绑定开场排字校样画布、顶部阅读动线箭轨、单真源诊断条、标牌标题自示范及七节独立交互。

import { createInitialState, PRESETS, INITIAL_SCATTER_FRACS } from "./model.js";
import { mountGalley } from "./galley.js";
import {
  mountSpanLab,
  mountCurtainLab,
  mountHistoryLab,
  mountComponentLab,
  mountBoundaryLab,
  mountPracticeLab,
  mountPosterLightbox,
} from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("galley-canvas");
const titleRule = document.getElementById("title-arrow-fill");
const heroTitle = document.getElementById("title");
const startBadge = document.getElementById("start-badge");
const startBadgeVal = document.getElementById("start-badge-val");
const flowSteps = [...document.querySelectorAll(".flow-step")];
const flowArrowFill = document.getElementById("flow-arrow-fill");
const flowStatusTag = document.getElementById("flow-status-tag");

const diagTag = document.getElementById("diag-tag");
const diagHead = document.getElementById("diag-head");
const diagReason = document.getElementById("diag-reason");
const diagHint = document.getElementById("diag-hint");
const diagAction = document.getElementById("diag-action");
const diagStrip = document.getElementById("diag-strip");

const mScatter = document.getElementById("m-scatter");
const mChars = document.getElementById("m-chars");
const mLeading = document.getElementById("m-leading");
const mLoad = document.getElementById("m-load");

const specBtns = [...document.querySelectorAll("[data-specimen]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const leadBtns = [...document.querySelectorAll("[data-leading]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const measureRange = document.getElementById("measure-range");
const measureVal = document.getElementById("measure-val");
const flowToggle = document.getElementById("toggle-flow");

let currentActionKind = "snapLeft";

function updateUI(analysis) {
  if (!analysis) return;

  // 1. 刊头自示范：大标底金箭延展比例 & 左缘状态、右上金色圆形起点锚徽
  const pct = analysis.flowStage === 4 ? 100 : analysis.flowStage === 3 ? 74 : analysis.flowStage === 2 ? 50 : 28;
  if (titleRule) titleRule.style.setProperty("--flow-pct", `${pct}%`);
  if (heroTitle) heroTitle.classList.toggle("is-aligned", analysis.scatterPx === 0);
  if (startBadge) startBadge.classList.toggle("is-off", analysis.scatterPx > 0);
  if (startBadgeVal) {
    startBadgeVal.textContent = analysis.scatterPx === 0 ? "X = 0px" : `散差 ${analysis.scatterPx}px`;
  }

  // 2. 通栏「阅读动线」四阶箭轨联动
  if (flowArrowFill) flowArrowFill.style.setProperty("--flow-pct", `${pct}%`);
  if (flowStatusTag) {
    flowStatusTag.textContent = analysis.ok
      ? `4/4 全线贯通 · ${analysis.solutionTag}`
      : `停滞于第 ${analysis.flowStage}/4 阶 · ${analysis.primary.badge}`;
    flowStatusTag.dataset.state = analysis.ok ? "ok" : "warn";
  }
  flowSteps.forEach((step, idx) => {
    const n = idx + 1;
    step.classList.toggle("is-lit", n <= analysis.flowStage);
    step.classList.toggle("is-stalled", !analysis.ok && n === analysis.flowStage);
  });

  // 3. 单真源诊单（所有文字与数字均源自 analysis）
  if (diagStrip) diagStrip.dataset.state = analysis.ok ? "ok" : "warn";
  if (diagTag) diagTag.textContent = analysis.primary.badge;
  if (diagHead) diagHead.textContent = analysis.primary.headline;
  if (diagReason) diagReason.textContent = analysis.primary.reason;
  if (diagHint) diagHint.textContent = analysis.primary.actionHint;
  if (diagAction) {
    diagAction.textContent = analysis.primary.actionLabel;
    currentActionKind = analysis.primary.actionKind;
  }

  // 4. 四枚单真源实测指标
  if (mScatter) {
    mScatter.textContent = `${analysis.scatterPx}px`;
    mScatter.dataset.state = analysis.scatterPx === 0 ? "ok" : "warn";
  }
  if (mChars) {
    mChars.textContent = `${analysis.effectiveChars} 字/行`;
    mChars.dataset.state = analysis.effectiveChars >= 14 && analysis.effectiveChars <= 36 ? "ok" : "warn";
  }
  if (mLeading) {
    mLeading.textContent = `${analysis.leading.toFixed(2)}×`;
    mLeading.dataset.state = analysis.leading >= 1.32 && analysis.leading <= 2.25 ? "ok" : "warn";
  }
  if (mLoad) {
    mLoad.textContent = analysis.loadTier;
    mLoad.dataset.state = analysis.ok ? "ok" : "warn";
  }

  // 5. 同步控件状态
  specBtns.forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  alignBtns.forEach((b) => {
    const on = b.dataset.align === state.align;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  leadBtns.forEach((b) => {
    const on = Math.abs(Number(b.dataset.leading) - state.leading) < 0.05;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (measureRange) measureRange.value = String(state.measureChars);
  if (measureVal) measureVal.textContent = `${state.measureChars} 字`;
  if (flowToggle) {
    flowToggle.setAttribute("aria-pressed", String(state.showFlow));
    flowToggle.textContent = state.showFlow ? "回扫轨迹：开" : "回扫轨迹：关";
    flowToggle.classList.toggle("is-active", state.showFlow);
  }
}

const galley = canvas
  ? mountGalley({
      canvas,
      state,
      onChange: (analysis) => updateUI(analysis),
    })
  : null;

function syncAll() {
  if (galley) galley.sync();
}

// ---- 绑定英雄区全部真实交互 ----
specBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    syncAll();
  });
});

alignBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.align;
    state.align = next;
    if (next === "scattered") {
      state.offsets = [...INITIAL_SCATTER_FRACS];
    } else if (next === "left") {
      state.offsets = state.offsets.map(() => 0);
    }
    syncAll();
  });
});

leadBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.leading = Number(btn.dataset.leading);
    syncAll();
  });
});

if (measureRange) {
  measureRange.addEventListener("input", () => {
    state.measureChars = Number(measureRange.value);
    syncAll();
  });
}

if (flowToggle) {
  flowToggle.addEventListener("click", () => {
    state.showFlow = !state.showFlow;
    syncAll();
  });
}

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.align = p.align;
    state.measureChars = p.measureChars;
    state.leading = p.leading;
    state.offsets = [...p.offsets];
    syncAll();
  });
});

// 诊单快捷动作钮 & 右上金色圆形「阅读起点」活体锚徽
function runContextualFix(kind) {
  if (kind === "snapLeft") {
    state.align = "left";
    state.offsets = state.offsets.map(() => 0);
  } else if (kind === "fixMeasure") {
    state.measureChars = 24;
  } else if (kind === "fixLeading") {
    state.leading = 1.65;
  } else if (kind === "resetPoor") {
    const p = PRESETS.poor;
    state.align = p.align;
    state.measureChars = p.measureChars;
    state.leading = p.leading;
    state.offsets = [...p.offsets];
  }
  syncAll();
}

if (diagAction) {
  diagAction.addEventListener("click", () => runContextualFix(currentActionKind));
}

if (startBadge) {
  startBadge.addEventListener("click", () => {
    // 点击右上标志金色圆形「阅读起点」徽章：未齐则一键吸回左轴，已齐则切回散乱方便反复比对
    if (state.align === "left") {
      runContextualFix("resetPoor");
    } else {
      runContextualFix("snapLeft");
    }
  });
}

// ---- 滚动渐显（遵循 prefers-reduced-motion） ----
const reveals = [...document.querySelectorAll(".reveal")];
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.02 }
  );
  reveals.forEach((el) => io.observe(el));
}

// 初始同步 & 挂载七节交互
syncAll();
mountSpanLab();
mountCurtainLab();
mountHistoryLab();
mountComponentLab();
mountBoundaryLab();
mountPracticeLab();
mountPosterLightbox();
