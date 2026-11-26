// 088 晶体式平衡 — 总控模块：单真源状态流、开场 3D/2D 舞台联动、探针与底栏同步、七大节初始化

import {
  createInitialState,
  evaluateCrystal,
  SOLUTIONS,
  FAILURE_MODES,
} from "./model.js";
import { createCrystalStage } from "./stage3d.js";
import {
  initAnatomySection,
  initLatticeSection,
  initRefractionLab,
  initHistorySection,
  initBoundarySection,
  initQuizSection,
  initPosterLightbox,
} from "./sections.js";

const state = createInitialState();

// DOM 缓存
const els = {
  stageHost: document.getElementById("crystal-stage"),
  statusChip: document.getElementById("hero-status-chip"),
  inpGap: document.getElementById("inp-gap"),
  inpFacet: document.getElementById("inp-facet"),
  inpBud: document.getElementById("inp-bud"),
  inpLight: document.getElementById("inp-light"),
  valGap: document.getElementById("val-gap"),
  valFacet: document.getElementById("val-facet"),
  valBud: document.getElementById("val-bud"),
  valLight: document.getElementById("val-light"),
  mqGap: document.getElementById("mq-gap"),
  mqFacet: document.getElementById("mq-facet"),
  mqGapVal: document.getElementById("mq-gap-val"),
  mqFacetVal: document.getElementById("mq-facet-val"),
  mqHead: document.getElementById("mq-head"),
  readGap: document.getElementById("read-gap"),
  readCom: document.getElementById("read-com"),
  readContrast: document.getElementById("read-contrast"),
  readBud: document.getElementById("read-bud"),
  diagTier: document.getElementById("diag-tier"),
  diagHeadline: document.getElementById("diag-headline"),
  diagReason: document.getElementById("diag-reason"),
  diagAction: document.getElementById("diag-action"),
  probeStructure: document.getElementById("probe-structure-tag"),
  probeSymmetry: document.getElementById("probe-symmetry-tag"),
  probeRefraction: document.getElementById("probe-refraction-tag"),
  probeGrowth: document.getElementById("probe-growth-tag"),
  kwStructure: document.getElementById("kw-structure"),
  kwSymmetry: document.getElementById("kw-symmetry"),
  kwRefraction: document.getElementById("kw-refraction"),
  kwGrowth: document.getElementById("kw-growth"),
  kwBalance: document.getElementById("kw-balance"),
  btnGuides: document.getElementById("btn-guides"),
};

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const dragModeBtns = [...document.querySelectorAll("[data-drag-mode]")];
const symBtns = [...document.querySelectorAll("[data-sym]")];
const highlightBtns = [...document.querySelectorAll("[data-highlight]")];

function syncControlsUI() {
  const gapInt = Math.round(state.gap * 100);
  const facetInt = Math.round(state.facetDepth * 100);
  const budInt = Math.round(state.budRatio * 100);
  const lightInt = Math.round(state.lightAngle);

  const gapStr = `${gapInt >= 0 ? "+" : ""}${gapInt}%`;
  const facetStr = `${facetInt}%`;
  const budStr = `${state.budRatio.toFixed(2)}×`;
  const lightStr = `${lightInt}°`;

  if (els.inpGap) els.inpGap.value = String(gapInt);
  if (els.inpFacet) els.inpFacet.value = String(facetInt);
  if (els.inpBud) els.inpBud.value = String(budInt);
  if (els.inpLight) els.inpLight.value = String(lightInt);

  if (els.valGap) els.valGap.textContent = gapStr;
  if (els.valFacet) els.valFacet.textContent = facetStr;
  if (els.valBud) els.valBud.textContent = budStr;
  if (els.valLight) els.valLight.textContent = lightStr;

  if (els.mqGap) els.mqGap.value = String(gapInt);
  if (els.mqFacet) els.mqFacet.value = String(facetInt);
  if (els.mqGapVal) els.mqGapVal.textContent = gapStr;
  if (els.mqFacetVal) els.mqFacetVal.textContent = facetStr;

  specimenBtns.forEach((b) => {
    const on = b.getAttribute("data-specimen") === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  dragModeBtns.forEach((b) => {
    const on = b.getAttribute("data-drag-mode") === state.dragMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  symBtns.forEach((b) => {
    const on = b.getAttribute("data-sym") === state.symmetry;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  highlightBtns.forEach((b) => {
    const on = b.getAttribute("data-highlight") === state.highlightKey && state.highlightKey !== "";
    b.classList.toggle("is-highlighted", on);
    b.setAttribute("aria-pressed", String(on));
  });

  if (els.btnGuides) {
    els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
    els.btnGuides.textContent = state.showGuides ? "轴线标尺：开" : "轴线标尺：关";
  }
}

function syncDiagnosticsUI(ev) {
  if (els.statusChip) {
    els.statusChip.textContent = ev.badge;
    els.statusChip.className = "status-chip " + (ev.isBalanced ? "is-ok" : "is-warn");
  }
  if (els.diagTier) els.diagTier.textContent = ev.tierLabel;
  if (els.diagHeadline) els.diagHeadline.textContent = ev.headline;
  if (els.diagReason) els.diagReason.textContent = ev.reason;
  if (els.diagAction) els.diagAction.textContent = ev.action;
  if (els.mqHead) {
    els.mqHead.textContent = ev.headline;
    els.mqHead.className = "mq-head " + (ev.isBalanced ? "is-ok" : "is-warn");
  }
  if (els.readGap) els.readGap.textContent = `${ev.metrics.gapPct >= 0 ? "+" : ""}${ev.metrics.gapPct}%`;
  if (els.readCom) els.readCom.textContent = `ΔG ${ev.metrics.comOffsetPct}%`;
  if (els.readContrast) els.readContrast.textContent = `${ev.metrics.contrastPct}%`;
  if (els.readBud) els.readBud.textContent = `${ev.metrics.budRatioVal.toFixed(2)}×`;

  const setDim = (probeEl, kwEl, dim) => {
    if (probeEl) {
      probeEl.textContent = dim.tag;
      probeEl.className = "probe-tag " + (dim.ok ? "is-ok" : "is-warn");
      const card = probeEl.closest(".probe-card");
      if (card) {
        card.classList.toggle("is-ok-card", dim.ok);
        card.classList.toggle("is-warn-card", !dim.ok);
      }
    }
    if (kwEl) {
      kwEl.textContent = dim.tag;
      kwEl.className = "kw-state" + (dim.ok ? " is-ok" : "");
    }
  };

  setDim(els.probeStructure, els.kwStructure, ev.dims.structure);
  setDim(els.probeSymmetry, els.kwSymmetry, ev.dims.symmetry);
  setDim(els.probeRefraction, els.kwRefraction, ev.dims.refraction);
  setDim(els.probeGrowth, els.kwGrowth, ev.dims.growth);
  if (els.kwBalance) {
    els.kwBalance.textContent = ev.dims.balance.tag;
    els.kwBalance.className = "kw-state" + (ev.dims.balance.ok ? " is-ok" : "");
  }
}

const stageApi = createCrystalStage(els.stageHost, {
  getState: () => state,
  onMutate: (patch) => {
    Object.assign(state, patch);
    syncControlsUI();
    stageApi.invalidate();
  },
  onEval: (mesh) => {
    const ev = evaluateCrystal(state, mesh);
    syncDiagnosticsUI(ev);
    return ev;
  },
});

function mutate(patch) {
  Object.assign(state, patch);
  syncControlsUI();
  stageApi.invalidate();
}

// 绑定所有开场控件
specimenBtns.forEach((b) => {
  b.addEventListener("click", () => mutate({ specimen: b.getAttribute("data-specimen") }));
});

dragModeBtns.forEach((b) => {
  b.addEventListener("click", () => mutate({ dragMode: b.getAttribute("data-drag-mode") }));
});

symBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const sym = b.getAttribute("data-sym");
    if (sym === "broken") {
      mutate({ symmetry: "broken", missingArms: [3, 4], armSkew: 17 });
    } else {
      mutate({ symmetry: sym, missingArms: [], armSkew: 0 });
    }
  });
});

highlightBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.getAttribute("data-highlight");
    mutate({ highlightKey: state.highlightKey === key ? "" : key });
  });
});

els.inpGap?.addEventListener("input", () => mutate({ gap: Number(els.inpGap.value) / 100 }));
els.inpFacet?.addEventListener("input", () => mutate({ facetDepth: Number(els.inpFacet.value) / 100 }));
els.inpBud?.addEventListener("input", () => mutate({ budRatio: Number(els.inpBud.value) / 100 }));
els.inpLight?.addEventListener("input", () => mutate({ lightAngle: Number(els.inpLight.value) }));

els.mqGap?.addEventListener("input", () => mutate({ gap: Number(els.mqGap.value) / 100 }));
els.mqFacet?.addEventListener("input", () => mutate({ facetDepth: Number(els.mqFacet.value) / 100 }));

document.getElementById("btn-pulse")?.addEventListener("click", () => stageApi.triggerPulse());
document.getElementById("mq-pulse")?.addEventListener("click", () => stageApi.triggerPulse());
els.btnGuides?.addEventListener("click", () => mutate({ showGuides: !state.showGuides }));

// 一键校准（回到原海报经典合法解）与复原开场坏态
function applyCalibrate() {
  mutate({ ...SOLUTIONS.posterClassic.patch });
  stageApi.triggerPulse();
}
document.getElementById("btn-calibrate")?.addEventListener("click", applyCalibrate);
document.getElementById("mq-fix")?.addEventListener("click", applyCalibrate);
document.getElementById("btn-reset")?.addEventListener("click", () => {
  const init = createInitialState();
  mutate({ ...init, specimen: state.specimen });
});

document.querySelectorAll("[data-solution]").forEach((b) => {
  b.addEventListener("click", () => {
    const sol = SOLUTIONS[b.getAttribute("data-solution")];
    if (sol) {
      mutate({ ...sol.patch });
      stageApi.triggerPulse();
    }
  });
});

document.querySelectorAll("[data-failure]").forEach((b) => {
  b.addEventListener("click", () => {
    const fail = FAILURE_MODES[b.getAttribute("data-failure")];
    if (fail) mutate({ ...fail.patch });
  });
});

// 全局快捷键（焦点不在输入框时，按 Space 发射偏振折射光脉）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (e.key === " " && tag !== "INPUT" && tag !== "BUTTON" && tag !== "TEXTAREA") {
    e.preventDefault();
    stageApi.triggerPulse();
  }
});

// 初始化首帧 UI 与七大节独立交互
syncControlsUI();
stageApi.invalidate();

initAnatomySection();
initLatticeSection();
initRefractionLab();
initHistorySection();
initBoundarySection();
initQuizSection();
initPosterLightbox();
