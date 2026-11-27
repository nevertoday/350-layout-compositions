// 344 大数字页幻灯片版式 — 主入口与单真源 DOM 同步
import { initialState, SCENARIOS, LAYOUTS, CONTEXT_MODES, PRESETS, SCALE_MIN, SCALE_MAX, evaluate } from "./model.js";
import { mountHeroCanvas } from "./heroCanvas.js";
import {
  initFlashTest,
  initDistanceScope,
  initContextBuilder,
  initLineage,
  initDeckSequencer,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

let state = initialState();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const heroCanvasEl = $("#hero-canvas");
const navStatusEl = $("#nav-status");
const heroScaleBadge = $("#hero-scale-self");
const diagScoreEl = $("#diag-score");
const diagTierEl = $("#diag-tier");
const diagHeadEl = $("#diag-head");
const diagReasonEl = $("#diag-reason");
const diagNextEl = $("#diag-next");
const scaleInput = $("#ctrl-scale");
const scaleOut = $("#ctrl-scale-val");
const extrasCountOut = $("#ctrl-extras-val");
const extrasToggleBtn = $("#ctrl-extras-toggle");
const precisionBtn = $("#ctrl-precision");
const contrastBtn = $("#ctrl-contrast");
const blinkBtn = $("#ctrl-blink");
const fixBtn = $("#ctrl-fix");
const resetBtn = $("#ctrl-reset");

const pillarNodes = {
  focus: $("#probe-focus"),
  emphasis: $("#probe-emphasis"),
  contrast: $("#probe-contrast"),
  impact: $("#probe-impact"),
};

const heroApi = mountHeroCanvas(
  heroCanvasEl,
  () => state,
  (patch, opts) => updateState(patch, opts)
);

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setClass(el, val) {
  if (el && el.className !== val) el.className = val;
}

function syncUI() {
  const ev = evaluate(state);

  setText(navStatusEl, `${ev.score}/4 · ${ev.tag}`);
  setClass(navStatusEl, `nav-status ${ev.score === 4 ? "is-ok" : "is-bad"}`);

  if (heroScaleBadge) {
    setText(heroScaleBadge, ev.numText);
    const visualSize = `${Math.round(28 + ((ev.scale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 30)}px`;
    if (heroScaleBadge.style.fontSize !== visualSize) heroScaleBadge.style.fontSize = visualSize;
  }

  for (const [k, node] of Object.entries(pillarNodes)) {
    if (!node) continue;
    const p = ev.pillars[k];
    setText(node, p.badge);
    setClass(node, `med-chip ${p.ok ? "is-ok" : "is-bad"}`);
  }

  setText(diagScoreEl, `${ev.score}/4 · ${ev.tag}`);
  setClass(diagScoreEl, `diag-pill ${ev.score === 4 ? "is-ok" : "is-bad"}`);
  setText(diagTierEl, ev.tier);
  setText(diagHeadEl, ev.headline);
  setText(diagReasonEl, ev.reason);
  setText(diagNextEl, `下一步：${ev.nextStep}`);

  const scVal = String(ev.scale);
  if (scaleInput.value !== scVal) scaleInput.value = scVal;
  setText(scaleOut, `${ev.scale.toFixed(1)}×（数高占屏 ${Math.round(ev.heroHeightPct)}%）`);

  const nExtra = state.activeExtras.length;
  setText(extrasCountOut, nExtra === 0 ? "已清零（单数独尊）" : `屏上还剩 ${nExtra} 张副卡`);
  setText(extrasToggleBtn, nExtra === 0 ? "加回 3 张副卡" : `移出 ${nExtra} 张副卡`);
  extrasToggleBtn.classList.toggle("is-alert", nExtra > 0);

  setText(precisionBtn, state.precision === "clean" ? `精度：取整 ${ev.sc.cleanNum}` : `精度：冗余 ${ev.sc.rawNum}`);
  precisionBtn.classList.toggle("is-alert", state.precision === "raw");

  setText(contrastBtn, state.contrastMode === "high" ? `反差：高 ${ev.ratioWCAG.toFixed(1)}:1` : `反差：低 ${ev.ratioWCAG.toFixed(1)}:1`);
  contrastBtn.classList.toggle("is-alert", state.contrastMode === "low");

  $$("[data-scenario]").forEach((b) => {
    const on = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  $$("[data-layout]").forEach((b) => {
    const on = b.dataset.layout === state.layout;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  $$("[data-context]").forEach((b) => {
    const on = b.dataset.context === state.contextMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

function updateState(patch, { deferDraw = false } = {}) {
  const next = { ...state, ...patch };
  // 若拖拽未跨过 0.1 步进且其余字段无变化，跳过冗余重绘
  if (
    next.scale === state.scale &&
    next.scenario === state.scenario &&
    next.layout === state.layout &&
    next.precision === state.precision &&
    next.contextMode === state.contextMode &&
    next.contrastMode === state.contrastMode &&
    next.activeExtras === state.activeExtras
  ) {
    return;
  }
  state = next;
  syncUI();
  heroApi.draw(!deferDraw);
}

// 绑定开场全部交互控件
$$("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sc = btn.dataset.scenario;
    if (!SCENARIOS[sc]) return;
    updateState({ scenario: sc });
  });
});

$$("[data-layout]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lay = btn.dataset.layout;
    if (!LAYOUTS[lay]) return;
    updateState({ layout: lay });
  });
});

$$("[data-context]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.context;
    if (!CONTEXT_MODES[mode]) return;
    updateState({ contextMode: mode });
  });
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    updateState(p.patch);
  });
});

scaleInput.addEventListener("input", () => {
  updateState({ scale: Number(scaleInput.value) });
});

extrasToggleBtn.addEventListener("click", () => {
  if (state.activeExtras.length > 0) updateState({ activeExtras: [] });
  else updateState({ activeExtras: ["e1", "e2", "e3"] });
});

precisionBtn.addEventListener("click", () => {
  updateState({ precision: state.precision === "clean" ? "raw" : "clean" });
});

contrastBtn.addEventListener("click", () => {
  updateState({ contrastMode: state.contrastMode === "high" ? "low" : "high" });
});

fixBtn.addEventListener("click", () => updateState(PRESETS.posterGood.patch));
resetBtn.addEventListener("click", () => updateState(PRESETS.brokenStart.patch));
blinkBtn.addEventListener("click", () => heroApi.triggerBlink());

// 全局快捷键 Space 触发 3 秒后排闪读（仅当焦点不在按钮或输入框内，且英雄区在视口内）
window.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.repeat) return;
  const tag = document.activeElement?.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "A") return;
  const rect = heroCanvasEl.getBoundingClientRect();
  if (rect.bottom > 80 && rect.top < window.innerHeight - 60) {
    e.preventDefault();
    heroApi.triggerBlink();
  }
});

// 初始化首次同步与正文七节交互
syncUI();
initFlashTest();
initDistanceScope();
initContextBuilder();
initLineage();
initDeckSequencer();
initQuiz();
initPosterLightbox();
