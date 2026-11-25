// 205 嵌套网格 — 主入口：串联单真源状态、开场排格台与正文七节交互

import { INITIAL_STATE, PRESETS, computeLayout, normalizeState, applyFix } from "./model.js";
import { createHeroCanvas } from "./heroCanvas.js";
import {
  initCascadeLab,
  initGutterLab,
  initSubgridLab,
  initExamplesLab,
  initHistoryLab,
  initDepthLab,
  initQuizLab,
  initPosterLightbox,
} from "./labs.js";

let state = normalizeState(INITIAL_STATE);

const canvas = document.getElementById("hero-canvas");
const scorePills = [...document.querySelectorAll("[data-score-pill]")];
const diagCard = document.getElementById("diag-card");
const diagTag = document.getElementById("diag-tag");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const diagFixBtn = document.getElementById("diag-fix-btn");

const mParentCol = document.getElementById("m-parent-col");
const mChildA = document.getElementById("m-child-a");
const mGapRatio = document.getElementById("m-gap-ratio");
const mGroupMod = document.getElementById("m-group-mod");

const pGapSlider = document.getElementById("ctrl-pgap");
const pGapVal = document.getElementById("ctrl-pgap-val");
const cGapSlider = document.getElementById("ctrl-cgap");
const cGapVal = document.getElementById("ctrl-cgap-val");

// 预先缓存所有控件节点，避免拖动时每帧重复扫描 DOM
const principleNodes = new Map(
  [...document.querySelectorAll("[data-principle]")].map((el) => [
    el.dataset.principle,
    { el, badge: el.querySelector(".p-state") },
  ])
);
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const pcolBtns = [...document.querySelectorAll("[data-pcols]")];
const caBtns = [...document.querySelectorAll("[data-ca]")];
const cbBtns = [...document.querySelectorAll("[data-cb]")];
const bottomBtns = [...document.querySelectorAll("[data-bottom]")];
const layerBtns = [...document.querySelectorAll("[data-layer]")];
const zoneBtns = [...document.querySelectorAll("[data-zone-btn]")];

function setText(el, v) {
  if (el && el.textContent !== v) el.textContent = v;
}

const hero = createHeroCanvas(
  canvas,
  () => state,
  (patch) => {
    state = normalizeState({ ...state, ...patch });
    syncUI();
  }
);

let lastButtonsSig = "";

function syncUI() {
  const layout = computeLayout(state, 680, 490);
  const { checks, diag, metrics } = layout;

  // 顶部与窄屏得分章
  for (const el of scorePills) {
    setText(el, diag.tag);
    if (el.dataset.tone !== diag.tone) el.dataset.tone = diag.tone;
  }

  // 左脊四项核心原则实时状态
  for (const c of checks) {
    const node = principleNodes.get(c.key);
    if (!node) continue;
    const okStr = String(c.ok);
    if (node.badge) {
      setText(node.badge, c.badge);
      if (node.badge.dataset.ok !== okStr) node.badge.dataset.ok = okStr;
    }
    if (node.el.dataset.ok !== okStr) node.el.dataset.ok = okStr;
  }

  // 诊单主卡（单真源）
  if (diagCard.dataset.tone !== diag.tone) diagCard.dataset.tone = diag.tone;
  setText(diagTag, diag.tag);
  if (diagTag.dataset.tone !== diag.tone) diagTag.dataset.tone = diag.tone;
  setText(diagHead, diag.headline);
  setText(diagBody, diag.body);
  setText(diagAction, diag.action);
  const shouldHide = !diag.fixKey;
  if (diagFixBtn.hidden !== shouldHide) diagFixBtn.hidden = shouldHide;
  if (diag.fixKey && diagFixBtn.dataset.fix !== diag.fixKey) diagFixBtn.dataset.fix = diag.fixKey;

  // 四格实时工程指标
  setText(mParentCol, `${layout.leftSpan} + ${layout.rightSpan} 列`);
  setText(mChildA, `${metrics.refColWA}px`);
  setText(mGapRatio, `${state.parentGap}/${state.childGap}px`);
  setText(mGroupMod, `${state.bottomCards} 栏 (${state.parentCols % state.bottomCards === 0 ? "整除" : "余" + (state.parentCols % state.bottomCards)})`);

  // 仅当按钮组或滑块参数变化时才同步按钮高亮（拖动分界脊时零冗余 DOM 写操作）
  const sig = `${state.scene}|${state.parentCols}|${state.childColsA}|${state.childColsB}|${state.bottomCards}|${state.layerMode}|${state.focusZone}|${state.parentGap}|${state.childGap}`;
  if (sig !== lastButtonsSig) {
    lastButtonsSig = sig;
    pGapSlider.value = String(state.parentGap);
    setText(pGapVal, `${state.parentGap}px`);
    cGapSlider.value = String(state.childGap);
    setText(cGapVal, `${state.childGap}px`);

    const syncGroup = (list, match) => {
      for (const b of list) {
        const on = match(b);
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      }
    };
    syncGroup(sceneBtns, (b) => b.dataset.scene === state.scene);
    syncGroup(pcolBtns, (b) => Number(b.dataset.pcols) === state.parentCols);
    syncGroup(caBtns, (b) => Number(b.dataset.ca) === state.childColsA);
    syncGroup(cbBtns, (b) => Number(b.dataset.cb) === state.childColsB);
    syncGroup(bottomBtns, (b) => Number(b.dataset.bottom) === state.bottomCards);
    syncGroup(layerBtns, (b) => b.dataset.layer === state.layerMode);
    syncGroup(zoneBtns, (b) => Number(b.dataset.zoneBtn) === state.focusZone);
  }

  hero.invalidate();
}

// 绑定开场控件事件
document.querySelectorAll("[data-scene]").forEach((b) =>
  b.addEventListener("click", () => {
    state = normalizeState({ ...state, scene: b.dataset.scene });
    syncUI();
  })
);
document.querySelectorAll("[data-pcols]").forEach((b) =>
  b.addEventListener("click", () => {
    const nextCols = Number(b.dataset.pcols);
    const ratio = state.splitCol / state.parentCols;
    state = normalizeState({ ...state, parentCols: nextCols, splitCol: Math.round(ratio * nextCols * 10) / 10 });
    syncUI();
  })
);
document.querySelectorAll("[data-ca]").forEach((b) =>
  b.addEventListener("click", () => {
    state = normalizeState({ ...state, childColsA: Number(b.dataset.ca) });
    syncUI();
  })
);
document.querySelectorAll("[data-cb]").forEach((b) =>
  b.addEventListener("click", () => {
    state = normalizeState({ ...state, childColsB: Number(b.dataset.cb) });
    syncUI();
  })
);
document.querySelectorAll("[data-bottom]").forEach((b) =>
  b.addEventListener("click", () => {
    state = normalizeState({ ...state, bottomCards: Number(b.dataset.bottom) });
    syncUI();
  })
);
document.querySelectorAll("[data-layer]").forEach((b) =>
  b.addEventListener("click", () => {
    state = normalizeState({ ...state, layerMode: b.dataset.layer });
    syncUI();
  })
);
document.querySelectorAll("[data-zone-btn]").forEach((b) =>
  b.addEventListener("click", () => {
    const z = Number(b.dataset.zoneBtn);
    state = normalizeState({ ...state, focusZone: state.focusZone === z ? 0 : z });
    syncUI();
  })
);
document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    state = normalizeState({ ...state, ...p.patch });
    syncUI();
  })
);

pGapSlider.addEventListener("input", () => {
  state = normalizeState({ ...state, parentGap: Number(pGapSlider.value) });
  syncUI();
});
cGapSlider.addEventListener("input", () => {
  state = normalizeState({ ...state, childGap: Number(cGapSlider.value) });
  syncUI();
});
diagFixBtn.addEventListener("click", () => {
  const key = diagFixBtn.dataset.fix;
  if (!key) return;
  state = normalizeState(applyFix(state, key));
  syncUI();
});

// 初始化开场与正文七节交互
syncUI();
initCascadeLab();
initGutterLab();
initSubgridLab();
initExamplesLab();
initHistoryLab();
initDepthLab();
initQuizLab();
initPosterLightbox();
