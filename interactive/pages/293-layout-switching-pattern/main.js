// 293 布局切换模式 — 主入口

import { reducedMotion } from "../../lib/stage.js";
import { createInitialState, evaluate, TEMPLATES, VIEW_MIN, VIEW_MAX } from "./model.js";
import { initHeroCanvas } from "./hero.js";
import { initGridPainter } from "./lab-grid.js";
import { initContinuityLab } from "./lab-continuity.js";
import { initPatternComparator, initScenarioCards, initPracticeQuiz, initPosterLightbox } from "./sections.js";

const state = createInitialState();

const heroCanvas = document.getElementById("hero-canvas");
const vwRange = document.getElementById("ctrl-vw");
const vwVal = document.getElementById("val-vw");
const bpRange = document.getElementById("ctrl-bp");
const bpVal = document.getElementById("val-bp");
const tplGroup = document.getElementById("ctrl-tpl");
const subjectGroup = document.getElementById("ctrl-subject");
const identityBtn = document.getElementById("ctrl-identity");
const focusBtn = document.getElementById("ctrl-focus");
const swapFixBtn = document.getElementById("ctrl-swap-fix");
const resetBtn = document.getElementById("ctrl-reset");

// 底部三步演进胶囊与单真源结构研判
const verdictBadge = document.getElementById("v-badge");
const verdictHeadline = document.getElementById("v-headline");
const verdictReason = document.getElementById("v-reason");
const verdictHint = document.getElementById("v-hint");
const verdictMetrics = document.getElementById("v-metrics");
const cssPreview = document.getElementById("hero-css-preview");
const stepEls = [
  document.getElementById("pipe-1"),
  document.getElementById("pipe-2"),
  document.getElementById("pipe-3"),
];
const heroTitle = document.getElementById("title");

let heroApi = null;
let lastMetricsHtml = "";
let lastCssCode = "";

function syncUI() {
  const ev = evaluate(state);

  if (vwRange) vwRange.value = String(state.viewportW);
  if (vwVal) vwVal.textContent = `${state.viewportW}px`;
  if (bpRange) bpRange.value = String(state.breakpoint);
  if (bpVal) bpVal.textContent = `${state.breakpoint}px`;

  tplGroup?.querySelectorAll("button[data-tpl]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.tpl === state.template));
  });
  subjectGroup?.querySelectorAll("button[data-subject]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.subject === state.subject));
  });

  if (identityBtn) {
    identityBtn.setAttribute("aria-pressed", String(state.keepIdentity));
    identityBtn.textContent = state.keepIdentity ? "身份锚点：保留 01–04" : "身份锚点：已剥离换壳";
  }
  if (focusBtn) {
    focusBtn.setAttribute("aria-pressed", String(state.showFocusPath));
    focusBtn.textContent = state.showFocusPath ? "Tab 焦点路径：显" : "Tab 焦点路径：隐";
  }

  // 自示范标题随当前切换态微调字块呼应
  if (heroTitle) {
    const isSwitched = state.viewportW >= state.breakpoint && ev.wideCols >= 2;
    heroTitle.dataset.switched = String(isSwitched);
  }

  // 结构研判（无 0/4 模板，直接用原海报演化胶囊展示真实几何结论）
  if (verdictBadge) {
    verdictBadge.textContent = ev.passed ? "结构成立" : ev.code === "identity_lost" ? "锚点断裂" : "结构失衡";
    verdictBadge.dataset.tone = ev.passed ? "ok" : "err";
  }
  if (verdictHeadline) verdictHeadline.textContent = ev.headline;
  if (verdictReason) verdictReason.textContent = ev.reason;
  if (verdictHint) verdictHint.textContent = ev.actionHint;

  if (verdictMetrics) {
    const modeNow = state.viewportW >= state.breakpoint ? TEMPLATES[state.template].label : "线性单列";
    const metricsHtml =
      `<span>现态 <b>${modeNow}</b></span>` +
      `<span>375 最小卡宽 <b>${ev.mobileMinW}px</b></span>` +
      `<span>主副面积比 <b>${ev.areaRatio.toFixed(1)}×</b></span>` +
      `<span>焦点逆序 <b>${ev.inversions} 处</b></span>`;
    if (metricsHtml !== lastMetricsHtml) {
      lastMetricsHtml = metricsHtml;
      verdictMetrics.innerHTML = metricsHtml;
    }
  }

  if (cssPreview && ev.cssCode !== lastCssCode) {
    lastCssCode = ev.cssCode;
    cssPreview.textContent = ev.cssCode;
  }

  // 原海报底部三步流向灯：线性→断点 / 拆解→序次 / 模块→锚点
  const flags = [ev.stepSwitch, ev.stepOrder, ev.stepIdentity];
  stepEls.forEach((el, i) => {
    if (!el) return;
    el.dataset.ok = String(flags[i]);
  });

  if (reducedMotion.matches) heroApi?.draw();
}

function mutate(patch) {
  Object.assign(state, patch);
  syncUI();
}

if (heroCanvas) {
  heroApi = initHeroCanvas(heroCanvas, () => state, mutate);
}

vwRange?.addEventListener("input", () => {
  const v = Math.max(VIEW_MIN, Math.min(VIEW_MAX, Number(vwRange.value)));
  mutate({ viewportW: v });
});

bpRange?.addEventListener("input", () => {
  mutate({ breakpoint: Number(bpRange.value) });
});

tplGroup?.querySelectorAll("button[data-tpl]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mutate({ template: btn.dataset.tpl, selectedModule: -1 });
  });
});

subjectGroup?.querySelectorAll("button[data-subject]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mutate({ subject: btn.dataset.subject });
  });
});

identityBtn?.addEventListener("click", () => {
  mutate({ keepIdentity: !state.keepIdentity });
});

focusBtn?.addEventListener("click", () => {
  mutate({ showFocusPath: !state.showFocusPath });
});

swapFixBtn?.addEventListener("click", () => {
  // 按顺位归正 01->02->03->04（若已经归正则故意倒置 04/01 供试错对照）
  const isNormal = state.slotOrder.every((v, i) => v === i);
  mutate({
    slotOrder: isNormal ? [3, 1, 2, 0] : [0, 1, 2, 3],
    selectedModule: -1,
  });
});

resetBtn?.addEventListener("click", () => {
  Object.assign(state, createInitialState());
  syncUI();
});

// 初始化其余各节交互
initPatternComparator();
initGridPainter();
initContinuityLab();
initScenarioCards();
initPracticeQuiz();
initPosterLightbox();

syncUI();
