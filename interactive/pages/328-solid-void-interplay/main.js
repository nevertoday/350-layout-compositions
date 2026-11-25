// 328 虚实 相生构图 · 主入口：联结开场单真源状态机与正文各节交互
import { reducedMotion } from "../../lib/stage.js";
import { createInitialState, evaluate, resolvePreset, SCENES } from "./model.js";
import { createHeroStage } from "./stage.js";
import {
  initCompareCurtain,
  initCounterCards,
  initFlowTheater,
  initModernStudio,
  initPosterLightbox,
  initQuiz,
  initSpecimenLightbox,
} from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const stage = canvas ? createHeroStage(canvas, () => state, patchState) : null;

// DOM 缓存
const els = {
  heroScore: document.getElementById("hero-score"),
  heroTitle: document.querySelector(".hero-title"),
  diagBox: document.getElementById("diag-box"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  mSolid: document.getElementById("m-solid"),
  mOverlap: document.getElementById("m-overlap"),
  mAperture: document.getElementById("m-aperture"),
  mTier: document.getElementById("m-tier"),
  legSolid: document.getElementById("leg-solid-pct"),
  legVoid: document.getElementById("leg-void-pct"),
  legTrans: document.getElementById("leg-trans-pct"),
  sceneNote: document.getElementById("scene-note"),
  rngMass: document.getElementById("rng-mass"),
  valMass: document.getElementById("val-mass"),
  rngAperture: document.getElementById("rng-aperture"),
  valAperture: document.getElementById("val-aperture"),
  rngVeil: document.getElementById("rng-veil"),
  valVeil: document.getElementById("val-veil"),
  btnWave: document.getElementById("btn-wave"),
  btnMulti: document.getElementById("btn-multi"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  layerBtns: [...document.querySelectorAll("[data-solo-layer]")],
  kpBadges: {
    contrast: document.getElementById("kp-contrast"),
    interdependence: document.getElementById("kp-interdependence"),
    hierarchy: document.getElementById("kp-hierarchy"),
  },
};

let currentFix = null;
let uiTimer = 0;
let lastSyncTs = 0;

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setAttr(el, name, val) {
  if (el && el.getAttribute(name) !== val) el.setAttribute(name, val);
}
function setClass(el, cls, on) {
  if (el && el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

function syncUI() {
  lastSyncTs = performance.now();
  const aspect = stage ? stage.getAspect() : 4 / 3;
  const res = stage ? stage.evalState(state) : evaluate(state, aspect);
  currentFix = res.primary.fix || null;

  // 顶部与诊单分数徽
  const scoreLabel = `${res.passed}/4 · ${res.primary.short}`;
  const isAllOk = res.passed === 4;
  setText(els.heroScore, scoreLabel);
  setClass(els.heroScore, "is-ok", isAllOk);
  setText(els.diagBadge, scoreLabel);
  setClass(els.diagBadge, "is-ok", isAllOk);
  setClass(els.diagBox, "is-ok", isAllOk);
  setClass(els.heroTitle, "is-balanced", isAllOk);

  setText(els.diagTitle, res.primary.title);
  setText(els.diagWhy, res.primary.why);
  setText(els.diagAction, res.primary.action);
  if (els.diagFixBtn) {
    const hideBtn = !currentFix;
    if (els.diagFixBtn.hidden !== hideBtn) els.diagFixBtn.hidden = hideBtn;
    if (currentFix) setText(els.diagFixBtn, `一步校准：${res.primary.short}`);
  }

  // 四项单真源读数
  setText(els.mSolid, `${res.rawSolidPct}%`);
  setText(els.mOverlap, `${res.overlapPct}%`);
  setText(els.mAperture, `${res.aperturePct}%`);
  setText(els.mTier, res.rhythmTier);

  // 底部三枚原海报图例实时占比（总和 100%）
  setText(els.legSolid, `${res.solidPct}%`);
  setText(els.legVoid, `${res.voidPct}%`);
  setText(els.legTrans, `${res.transPct}%`);

  // 左栏原海报三大「核心知识点」实况徽
  for (const p of res.principles) {
    const el = els.kpBadges[p.key];
    if (!el) continue;
    setText(el, p.status);
    setClass(el, "is-ok", p.ok);
  }

  // 控件值与状态同步
  const massStr = String(Math.round(state.solidMass * 100));
  if (els.rngMass && els.rngMass.value !== massStr) els.rngMass.value = massStr;
  setText(els.valMass, `${massStr}%`);
  const apStr = String(Math.round(state.aperture * 100));
  if (els.rngAperture && els.rngAperture.value !== apStr) els.rngAperture.value = apStr;
  setText(els.valAperture, `${apStr}%`);
  const veilStr = String(Math.round(state.veilOpacity * 100));
  if (els.rngVeil && els.rngVeil.value !== veilStr) els.rngVeil.value = veilStr;
  setText(els.valVeil, `${veilStr}%`);

  setAttr(els.btnWave, "aria-pressed", String(state.waveFlow));
  setText(els.btnWave, state.waveFlow ? "引流雾波：开" : "引流雾波：关");
  setAttr(els.btnMulti, "aria-pressed", String(state.multiFocus));
  setText(els.btnMulti, state.multiFocus ? "双焦试错：开" : "双焦试错：关");

  if (SCENES[state.scene]) setText(els.sceneNote, SCENES[state.scene].note);

  els.sceneBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.scene === state.scene)));
  els.layerBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.soloLayer === state.soloLayer)));
}

function patchState(next, isDrag = false) {
  Object.assign(state, next);
  if (isDrag) {
    // 拖拽期间画布 60fps 实时响应，侧栏 DOM 读数按 ~12Hz 节流并去重写入，松手立即全量同步
    const elapsed = performance.now() - lastSyncTs;
    if (elapsed >= 80) {
      if (uiTimer) { clearTimeout(uiTimer); uiTimer = 0; }
      syncUI();
    } else if (!uiTimer) {
      uiTimer = setTimeout(() => {
        uiTimer = 0;
        syncUI();
      }, 80 - elapsed);
    }
  } else {
    if (uiTimer) { clearTimeout(uiTimer); uiTimer = 0; }
    syncUI();
  }
  // 动态模式下 rAF 正在 60fps 跑，无需在每次 touchmove 再同步二次重绘；仅在减少动态模式下手动补画一帧
  if (stage && reducedMotion.matches) stage.draw();
}

// 绑定开场控件
els.sceneBtns.forEach((b) => {
  b.addEventListener("click", () => patchState({ scene: b.dataset.scene }));
});

els.presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const aspect = stage ? stage.getAspect() : 4 / 3;
    const p = resolvePreset(b.dataset.preset, aspect);
    if (!p) return;
    patchState(p);
  });
});

els.layerBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const target = b.dataset.soloLayer;
    patchState({ soloLayer: state.soloLayer === target ? "all" : target });
  });
});

if (els.rngMass) {
  els.rngMass.addEventListener("input", () => patchState({ solidMass: Number(els.rngMass.value) / 100 }));
}
if (els.rngAperture) {
  els.rngAperture.addEventListener("input", () => patchState({ aperture: Number(els.rngAperture.value) / 100 }));
}
if (els.rngVeil) {
  els.rngVeil.addEventListener("input", () => patchState({ veilOpacity: Number(els.rngVeil.value) / 100 }));
}
if (els.btnWave) {
  els.btnWave.addEventListener("click", () => patchState({ waveFlow: !state.waveFlow }));
}
if (els.btnMulti) {
  els.btnMulti.addEventListener("click", () => patchState({ multiFocus: !state.multiFocus }));
}
if (els.diagFixBtn) {
  els.diagFixBtn.addEventListener("click", () => {
    if (currentFix) patchState(currentFix);
  });
}

// 启动同步与各节交互
syncUI();
if (stage) stage.draw();
window.addEventListener("resize", () => {
  if (stage) {
    stage.resize();
    stage.draw();
  }
  syncUI();
});

initCompareCurtain();
initFlowTheater();
initSpecimenLightbox();
initModernStudio();
initCounterCards();
initQuiz();
initPosterLightbox();
