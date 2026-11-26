// 215 直排左起 · 入口编排：单真源同步画布、右脊五原则、路径条、黑底诊单与正文七节互动

import { INITIAL_STATE, PRESETS } from "./model.js";
import { mountHeroStage } from "./stage.js";
import {
  initCompass,
  initCssLab,
  initPosterLightbox,
  initQuiz,
  initRotator,
  initScenarios,
  initTraps,
} from "./sections.js";

const state = { ...INITIAL_STATE };

const elCanvas = document.getElementById("heroCanvas");
const elOriginDot = document.getElementById("heroOriginDot");
const elStatusDesktop = document.getElementById("heroStatusDesktop");
const elStatusMobile = document.getElementById("heroStatusMobile");
const elScanStrip = document.getElementById("scanStrip");
const elMColGap = document.getElementById("mColGap");
const elMCharGap = document.getElementById("mCharGap");
const elMRatio = document.getElementById("mRatio");
const elDiagBadge = document.getElementById("diagBadge");
const elDiagHeadline = document.getElementById("diagHeadline");
const elDiagBody = document.getElementById("diagBody");
const elDiagHint = document.getElementById("diagHint");
const elBtnQuickFix = document.getElementById("btnQuickFix");
const elRangeCol = document.getElementById("rangeColGap");
const elRangeChar = document.getElementById("rangeCharGap");
const elValCol = document.getElementById("valColGap");
const elValChar = document.getElementById("valCharGap");
const elCssLine = document.getElementById("heroCssLine");
const elBtnGuides = document.getElementById("btnGuides");
const elBtnScan = document.getElementById("btnScanPlay");

let latestEval = null;
let lastKey = "";
let rafDraw = 0;

function setTxt(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncControlsFromState() {
  const colStr = `${state.colGap.toFixed(2)}em`;
  const charStr = `${state.charGap.toFixed(2)}em`;
  if (elRangeCol.value !== String(state.colGap)) elRangeCol.value = String(state.colGap);
  if (elRangeChar.value !== String(state.charGap)) elRangeChar.value = String(state.charGap);
  setTxt(elValCol, colStr);
  setTxt(elValChar, charStr);

  const btnKey = `${state.specimen}|${state.anchor}|${state.order}|${state.hierarchy}|${state.guides}`;
  if (btnKey === lastKey) return;
  lastKey = btnKey;

  document.querySelectorAll(".tab-btn[data-specimen]").forEach((b) => {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll("[data-anchor]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.anchor === state.anchor)
  );
  document.querySelectorAll("[data-order]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.order === state.order)
  );
  document.querySelectorAll("[data-hierarchy]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.hierarchy === state.hierarchy)
  );

  elBtnGuides.textContent = state.guides ? "界栏：开" : "界栏：关";
  elBtnGuides.setAttribute("aria-pressed", String(state.guides));
}

function syncReport(layout, ev) {
  latestEval = ev;
  const isOk = ev.passed === ev.total;

  elOriginDot.classList.toggle("is-solved", isOk);
  setTxt(elStatusDesktop, ev.statusTag);
  elStatusDesktop.classList.toggle("is-ok", isOk);
  setTxt(elStatusMobile, ev.statusTag);

  elScanStrip.classList.toggle("is-bad", !isOk);
  setTxt(elMColGap, `${state.colGap.toFixed(2)}em`);
  setTxt(elMCharGap, `${state.charGap.toFixed(2)}em`);
  setTxt(elMRatio, `${layout.ratio.toFixed(2)}×`);

  setTxt(elDiagBadge, ev.statusTag);
  elDiagBadge.classList.toggle("is-ok", isOk);
  setTxt(elDiagHeadline, ev.headline);
  setTxt(elDiagBody, ev.body);
  setTxt(elDiagHint, ev.hint);
  setTxt(elBtnQuickFix, ev.quickFixLabel);
  setTxt(elCssLine, ev.cssSnippet);

  for (const p of ev.principles) {
    const card = document.querySelector(`.principle-card[data-p="${p.id}"]`);
    const badge = document.getElementById(`ps-${p.id}`);
    if (card) {
      card.classList.toggle("is-ok", p.ok);
      card.classList.toggle("is-fault", !p.ok);
    }
    setTxt(badge, p.badge);
  }
}

let stage = null;

function patchState(patch, opts = {}) {
  Object.assign(state, patch);
  syncControlsFromState();
  if (opts.immediate) {
    stage?.draw();
  } else if (!rafDraw) {
    // 合并高频拖动到每帧一次绘制，软渲染下仍稳守高帧率
    rafDraw = requestAnimationFrame(() => {
      rafDraw = 0;
      stage?.draw();
    });
  }
  if (opts.scan) stage?.triggerScan();
}

stage = mountHeroStage(
  elCanvas,
  () => state,
  (patch) => patchState(patch),
  syncReport
);

// 绑定开场控件
document.querySelectorAll(".tab-btn[data-specimen]").forEach((b) =>
  b.addEventListener("click", () => patchState({ specimen: b.dataset.specimen }))
);
elRangeCol.addEventListener("input", () => patchState({ colGap: +elRangeCol.value }));
elRangeChar.addEventListener("input", () => patchState({ charGap: +elRangeChar.value }));

document.querySelectorAll("[data-anchor]").forEach((b) =>
  b.addEventListener("click", () => patchState({ anchor: b.dataset.anchor }))
);
document.querySelectorAll("[data-order]").forEach((b) =>
  b.addEventListener("click", () => patchState({ order: b.dataset.order }))
);
document.querySelectorAll("[data-hierarchy]").forEach((b) =>
  b.addEventListener("click", () => patchState({ hierarchy: b.dataset.hierarchy }))
);

document.querySelectorAll(".preset-btn[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    const preset = PRESETS[b.dataset.preset];
    if (preset) patchState(preset.patch, { scan: preset.kind === "valid" });
  })
);

elBtnGuides.addEventListener("click", () => patchState({ guides: !state.guides }));
elBtnScan.addEventListener("click", () => stage.triggerScan());
elBtnQuickFix.addEventListener("click", () => {
  if (latestEval?.quickFixPatch) {
    patchState(latestEval.quickFixPatch);
  } else {
    stage.triggerScan();
  }
});

// 初始化控件并挂载正文 01–07 节互动
syncControlsFromState();
stage.draw();
initCompass();
initRotator();
initCssLab();
initScenarios();
initTraps();
initQuiz();
initPosterLightbox();
