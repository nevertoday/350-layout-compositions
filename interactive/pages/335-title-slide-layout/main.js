// 335 标题幻灯片版式 — 主入口：串联开场编导台与 01–07 全页交互

import { INITIAL_STATE, PRESETS, auditSlide } from "./model.js";
import { createHeroStage } from "./stage-canvas.js";
import {
  initCaseSwitcher,
  initOpticsStage,
  initPosterLightbox,
  initQuiz,
  initRelayStrip,
  initScissorBench,
  initStripConsole,
} from "./sections.js";

const state = { ...INITIAL_STATE };

const canvas = document.getElementById("hero-canvas");
const statusChip = document.getElementById("hero-status-chip");
const slideCounter = document.getElementById("slide-counter");
const btnFlip = document.getElementById("btn-flip-slide");
const btnBackrow = document.getElementById("btn-backrow");
const btnGlance = document.getElementById("btn-glance");
const btnGuides = document.getElementById("btn-guides");
const btnStepFix = document.getElementById("btn-step-fix");

const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");

const mTitle = document.getElementById("m-title");
const mOverlap = document.getElementById("m-overlap");
const mWhite = document.getElementById("m-white");
const mRow = document.getElementById("m-row");

const rngTitleSize = document.getElementById("rng-title-size");
const valTitleSize = document.getElementById("val-title-size");
const rngHeroR = document.getElementById("rng-hero-r");
const valHeroR = document.getElementById("val-hero-r");
const rngIdScale = document.getElementById("rng-id-scale");
const valIdScale = document.getElementById("val-id-scale");

const deckTabs = [...document.querySelectorAll(".deck-tab")];
const pinBtns = [...document.querySelectorAll(".poster-pin")];
const segBtns = [...document.querySelectorAll(".seg-btn")];
const presetBtns = [...document.querySelectorAll(".preset-btn")];

let stage = null;

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncUI() {
  const audit = auditSlide(state);
  const { primary, metrics, partMeta, passedCount, isClean } = audit;

  // 顶部状态签（仅在文案变化时写 DOM，拖动零冗余重排）
  setText(statusChip, `${passedCount}/4 · ${primary.short}`);
  statusChip.classList.toggle("is-clean", isClean);

  // 放映栏按钮态
  setText(slideCounter, `SLIDE 0${state.slideIndex + 1} / 02`);
  setText(btnFlip, state.slideIndex === 0 ? "翻到 02 承接页" : "翻回 01 封面页");
  btnFlip.classList.toggle("is-on", state.slideIndex === 1);
  btnFlip.setAttribute("aria-pressed", String(state.slideIndex === 1));

  btnBackrow.classList.toggle("is-on", state.viewMode === "backrow");
  btnBackrow.setAttribute("aria-pressed", String(state.viewMode === "backrow"));

  btnGuides.classList.toggle("is-on", state.showGuides);
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));

  // 右侧四枚原海报引出针同步
  pinBtns.forEach((btn) => {
    const part = btn.dataset.part;
    const info = partMeta[part];
    const pill = document.getElementById(`pin-state-${part}`);
    const active = state.activePart === part;
    btn.classList.toggle("is-active", active);
    btn.classList.toggle("is-ok", !info.fault);
    btn.setAttribute("aria-pressed", String(active));
    if (pill) {
      setText(pill, info.fault ? info.fault.short : info.okTag);
      pill.classList.toggle("is-fault", !!info.fault);
      pill.classList.toggle("is-ok", !info.fault);
    }
  });

  // 诊单白话面板
  setText(diagHeadline, primary.headline);
  setText(diagWhy, primary.why);
  setText(diagAction, `怎么改：${primary.action}`);
  setText(btnStepFix, primary.fixLabel);
  const fixJson = JSON.stringify(primary.fixPatch);
  if (btnStepFix.dataset.fix !== fixJson) btnStepFix.dataset.fix = fixJson;

  // 四枚实时单真源读数
  setText(mTitle, `${metrics.titlePt}pt · ${metrics.scaleRatio}×`);
  setText(mOverlap, `${metrics.overlapPct}%${metrics.overlapPct >= 5 ? " 撞压" : " 净空"}`);
  setText(mWhite, `${metrics.whitespacePct}%`);
  setText(mRow, `${metrics.backRowArcmin}′ · ${metrics.backRowGrade}`);

  // 滑轨与按钮同步
  if (rngTitleSize.value !== String(state.titleSize)) rngTitleSize.value = String(state.titleSize);
  setText(valTitleSize, `${state.titleSize} pt`);

  const heroPct = Math.round(state.heroRadius * 100);
  if (rngHeroR.value !== String(heroPct)) rngHeroR.value = String(heroPct);
  setText(valHeroR, `${heroPct}%`);

  const idPct = String(Math.round(state.identityScale * 100));
  if (rngIdScale.value !== idPct) rngIdScale.value = idPct;
  setText(valIdScale, `${state.identityScale.toFixed(2)}×`);

  deckTabs.forEach((b) => {
    const on = b.dataset.deck === state.deck;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  segBtns.forEach((b) => {
    const [k, v] = b.dataset.set.split(":");
    const on = String(state[k]) === v;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

let lastUiSync = 0;
let uiTimer = 0;
function patchState(patch, fromDrag = false) {
  Object.assign(state, patch);
  if (fromDrag) {
    // 拖动过程按 rAF 节奏只重绘画布，DOM 诊单节流同步以防软件渲染主线程抖动
    stage?.invalidate(false);
    const now = performance.now();
    if (now - lastUiSync >= 90) {
      lastUiSync = now;
      syncUI();
    } else if (!uiTimer) {
      uiTimer = setTimeout(() => {
        uiTimer = 0;
        lastUiSync = performance.now();
        syncUI();
      }, 90);
    }
  } else {
    if (uiTimer) {
      clearTimeout(uiTimer);
      uiTimer = 0;
    }
    lastUiSync = performance.now();
    syncUI();
    stage?.invalidate(true);
  }
}

if (canvas) {
  stage = createHeroStage(canvas, () => state, patchState);
}

deckTabs.forEach((b) => {
  b.addEventListener("click", () => patchState({ deck: b.dataset.deck, slideIndex: 0 }));
});

pinBtns.forEach((b) => {
  b.addEventListener("click", () => patchState({ activePart: b.dataset.part, slideIndex: 0 }));
});

segBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const [k, v] = b.dataset.set.split(":");
    const next = { [k]: v, slideIndex: 0 };
    // 切换版面轴向时，若当前是已干净布局则顺手把视觉焦点摆到对应空侧，若故意试错则保留由用户拖
    if (k === "axis") {
      if (v === "right" && state.heroX > 0.55) next.heroX = 0.25;
      else if (v === "left" && state.heroX < 0.35) next.heroX = 0.74;
      else if (v === "center") {
        next.heroX = 0.5;
        next.heroY = 0.23;
        next.heroRadius = Math.min(state.heroRadius, 0.18);
      }
    }
    patchState(next);
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const preset = PRESETS[b.dataset.preset];
    if (!preset) return;
    stage?.stopGlance();
    patchState(preset.patch);
  });
});

rngTitleSize.addEventListener("input", () => {
  patchState({ titleSize: Number(rngTitleSize.value), activePart: "title", slideIndex: 0 });
});

rngHeroR.addEventListener("input", () => {
  patchState({ heroRadius: Number(rngHeroR.value) / 100, activePart: "hero", slideIndex: 0 });
});

rngIdScale.addEventListener("input", () => {
  patchState({ identityScale: Number(rngIdScale.value) / 100, activePart: "identity", slideIndex: 0 });
});

btnFlip.addEventListener("click", () => {
  stage?.stopGlance();
  patchState({ slideIndex: state.slideIndex === 0 ? 1 : 0 });
});

btnBackrow.addEventListener("click", () => {
  patchState({ viewMode: state.viewMode === "backrow" ? "studio" : "backrow" });
});

btnGlance.addEventListener("click", () => {
  patchState({ slideIndex: 0 });
  stage?.startGlance();
});

btnGuides.addEventListener("click", () => {
  patchState({ showGuides: !state.showGuides });
});

btnStepFix.addEventListener("click", () => {
  try {
    const p = JSON.parse(btnStepFix.dataset.fix || "{}");
    stage?.stopGlance();
    patchState(p);
  } catch {}
});

syncUI();

// 初始化 01–07 全部交互模块
initStripConsole();
initScissorBench();
initOpticsStage();
initRelayStrip();
initCaseSwitcher();
initQuiz();
initPosterLightbox();
