// 177 右对齐 左参差 — 页面主控入口

import {
  createState,
  FAIL_PRESETS,
  INITIAL_STATE,
  VALID_PRESETS,
} from "./model.js";
import { createHeroStage } from "./hero-stage.js";
import { initSections } from "./sections.js";

let state = createState();

const canvas = document.getElementById("hero-canvas");
const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const linesRange = document.getElementById("ctrl-lines");
const linesVal = document.getElementById("ctrl-lines-val");
const widthRange = document.getElementById("ctrl-width");
const widthVal = document.getElementById("ctrl-width-val");
const gazeBtn = document.getElementById("btn-gaze");
const fixBtn = document.getElementById("btn-fix");
const resetBtn = document.getElementById("btn-reset");
const validBtns = [...document.querySelectorAll("[data-valid-preset]")];
const failBtns = [...document.querySelectorAll("[data-fail-preset]")];

// 诊断与三枚原海报几何探针节点
const mastBadge = document.getElementById("mast-status-badge");
const diagBadge = document.getElementById("diag-badge");
const diagMetrics = document.getElementById("diag-metrics");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagTip = document.getElementById("diag-tip");
const probeEnd = document.getElementById("probe-clear-end");
const probeTension = document.getElementById("probe-typo-tension");
const probeRight = document.getElementById("probe-right-emphasis");

function syncControlsFromState() {
  scenarioBtns.forEach((b) => {
    const active = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  alignBtns.forEach((b) => {
    const active = b.dataset.align === state.align;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  linesRange.value = String(state.lineCount);
  linesVal.textContent = `${state.lineCount} 行`;
  widthRange.value = String(Math.round(state.colWidth * 100));
  widthVal.textContent = `${Math.round(state.colWidth * 100)}%`;
}

function syncReadoutFromLayout(layout) {
  const { score, verdict, metrics, probes } = layout;
  const ok = score === 4;

  mastBadge.textContent = verdict.tag;
  mastBadge.classList.toggle("is-ok", ok);
  mastBadge.classList.toggle("is-bad", !ok);

  diagBadge.textContent = verdict.tag;
  diagBadge.classList.toggle("is-ok", ok);
  diagBadge.classList.toggle("is-bad", !ok);

  diagMetrics.textContent =
    `实绘 ${metrics.lineCount} 行 · 左参差 ${metrics.ragSpreadPct}% · 轴净空 ${metrics.clearancePx}px · 配重 ${metrics.orbPct}%`;
  diagTitle.textContent = verdict.title;
  diagWhy.textContent = verdict.why;
  diagTip.textContent = verdict.tip;

  const setProbe = (el, p) => {
    el.textContent = p.text;
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-bad", !p.ok);
  };
  setProbe(probeEnd, probes.clearEnd);
  setProbe(probeTension, probes.typoTension);
  setProbe(probeRight, probes.rightEmphasis);
}

let stage = null;

function updateState(patch) {
  state = {
    ...state,
    ...patch,
    nudges: patch.nudges ? [...patch.nudges] : state.nudges,
  };
  syncControlsFromState();
  if (stage) stage.invalidate();
}

stage = createHeroStage(
  canvas,
  () => state,
  updateState,
  syncReadoutFromLayout
);
syncControlsFromState();

// 事件绑定
scenarioBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({
      scenario: btn.dataset.scenario,
      nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
  });
});

alignBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ align: btn.dataset.align });
  });
});

linesRange.addEventListener("input", () => {
  updateState({
    lineCount: Number(linesRange.value),
    nudges: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });
});

widthRange.addEventListener("input", () => {
  updateState({ colWidth: Number(widthRange.value) / 100 });
});

gazeBtn.addEventListener("click", () => {
  stage.triggerGaze();
});

fixBtn.addEventListener("click", () => {
  updateState({ ...VALID_PRESETS.classic.patch });
});

resetBtn.addEventListener("click", () => {
  updateState({
    align: INITIAL_STATE.align,
    orbX: INITIAL_STATE.orbX,
    lineCount: INITIAL_STATE.lineCount,
    colWidth: INITIAL_STATE.colWidth,
    nudges: [...INITIAL_STATE.nudges],
  });
});

validBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = VALID_PRESETS[btn.dataset.validPreset];
    if (preset) updateState({ ...preset.patch });
  });
});

failBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = FAIL_PRESETS[btn.dataset.failPreset];
    if (preset) updateState({ ...preset.patch });
  });
});

// 全局 Space 快捷放行回扫（焦点不在输入/按钮上时触发）
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
  const heroRect = canvas.getBoundingClientRect();
  if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
    e.preventDefault();
    stage.triggerGaze();
  }
});

initSections();
