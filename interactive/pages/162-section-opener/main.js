// 162 栏目开启页 · 页面主入口
import { INITIAL_STATE, PRESETS, clamp, computeLayout } from "./model.js";
import { createHeroStudio } from "./hero.js";
import {
  initArchetypeDemo,
  initFlowDemo,
  initHistoryDemo,
  initPosterLightbox,
  initQuizDemo,
  initSkipDecisionDemo,
  initThumbFlipDemo,
  initXrayDemo,
} from "./demos.js";

let state = { ...INITIAL_STATE };
let studio = null;

// 首屏 DOM 绑定
const els = {
  canvas: document.getElementById("hero-canvas"),
  statusChip: document.getElementById("hero-status-chip"),
  emblemGroup: document.getElementById("emblem-arrow-group"),
  themeBtns: [...document.querySelectorAll("[data-theme]")],
  ctrlFlow: document.getElementById("ctrl-flow"),
  ctrlScale: document.getElementById("ctrl-scale"),
  valFlow: document.getElementById("val-flow"),
  valScale: document.getElementById("val-scale"),
  tabStyleBtns: [...document.querySelectorAll("[data-tab-style]")],
  subModeBtns: [...document.querySelectorAll("[data-sub-mode]")],
  btnClutter: document.getElementById("btn-clutter"),
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  diagTag: document.getElementById("diag-tag"),
  diagHead: document.getElementById("diag-head"),
  diagBody: document.getElementById("diag-body"),
  diagHint: document.getElementById("diag-hint"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  mdsWrap: document.getElementById("mobile-diag-strip"),
  mdsTag: document.getElementById("mds-tag"),
  mdsHead: document.getElementById("mds-head"),
  mdsFixBtn: document.getElementById("mds-fix-btn"),
  mRatio: document.getElementById("m-ratio"),
  mFlow: document.getElementById("m-flow"),
  mSpace: document.getElementById("m-space"),
  mSub: document.getElementById("m-sub"),
  pEntry: document.getElementById("pillar-entry"),
  pHier: document.getElementById("pillar-hierarchy"),
  pOrient: document.getElementById("pillar-orientation"),
  pbEntry: document.getElementById("p-badge-entry"),
  pbHier: document.getElementById("p-badge-hierarchy"),
  pbOrient: document.getElementById("p-badge-orientation"),
  pnEntry: document.getElementById("p-note-entry"),
  pnHier: document.getElementById("p-note-hierarchy"),
  pnOrient: document.getElementById("p-note-orientation"),
};

let currentFixAction = null;

function syncUI(L) {
  const layout = L || computeLayout(state, 900, 560);
  const { metrics, pillars, diag } = layout;

  // 顶眉状态章
  els.statusChip.textContent = diag.tag;
  els.statusChip.dataset.tone = diag.severity === "pass" ? "good" : "bad";

  // 刊头活体微型朱红箭徽（直接呼应当前 arrowFlow 朝向与推进！）
  if (els.emblemGroup) {
    if (state.arrowFlow < 0) {
      // 反指左页
      els.emblemGroup.setAttribute("transform", "translate(68 0) scale(-1 1)");
    } else {
      const shift = Math.round((state.arrowFlow - 1) * 26);
      els.emblemGroup.setAttribute("transform", `translate(${shift} 0)`);
    }
  }

  // 滑轨与标签同步
  els.ctrlFlow.value = String(Math.round(state.arrowFlow * 100));
  els.valFlow.textContent = `${metrics.forwardPct >= 0 ? "+" : ""}${metrics.forwardPct}%`;
  els.ctrlScale.value = String(Math.round(state.titleScale * 100));
  els.valScale.textContent = `${metrics.titleRatio.toFixed(1)}×`;

  // 题材按钮
  els.themeBtns.forEach((b) => {
    const a = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", a);
    b.setAttribute("aria-pressed", a ? "true" : "false");
  });

  // 书口出血按钮
  els.tabStyleBtns.forEach((b) => {
    const a = b.dataset.tabStyle === state.tabStyle;
    b.classList.toggle("is-active", a);
    b.setAttribute("aria-pressed", a ? "true" : "false");
  });

  // 子目负载按钮
  els.subModeBtns.forEach((b) => {
    const a = b.dataset.subMode === state.subMode;
    b.classList.toggle("is-active", a);
    b.setAttribute("aria-pressed", a ? "true" : "false");
  });

  // 干扰角标开关
  els.btnClutter.classList.toggle("is-active", state.clutter);
  els.btnClutter.setAttribute("aria-pressed", state.clutter ? "true" : "false");
  els.btnClutter.textContent = state.clutter ? "存在抢焦" : "已清除";

  // 单真源诊单
  els.diagTag.textContent = diag.tag;
  els.diagTag.dataset.tone = diag.severity === "pass" ? "good" : "bad";
  els.diagHead.textContent = diag.headline;
  els.diagBody.textContent = diag.body;
  els.diagHint.textContent = diag.hint;

  currentFixAction = diag.fixAction;
  if (diag.fixAction && diag.fixLabel) {
    els.diagFixBtn.hidden = false;
    els.diagFixBtn.textContent = diag.fixLabel;
  } else {
    els.diagFixBtn.hidden = true;
  }

  // 同步手机首屏单真源精简诊断条
  if (els.mdsWrap) {
    els.mdsWrap.dataset.tone = diag.severity === "pass" ? "good" : "bad";
    els.mdsTag.textContent = `${metrics.passedCount}/3`;
    els.mdsHead.textContent = diag.headline;
    if (diag.fixAction) {
      els.mdsFixBtn.hidden = false;
      els.mdsFixBtn.textContent = "纠错一步";
    } else {
      els.mdsFixBtn.hidden = true;
    }
  }

  // 四格单真源实测读数
  els.mRatio.textContent = `${metrics.titleRatio.toFixed(1)}×`;
  els.mFlow.textContent = `${metrics.forwardPct >= 0 ? "+" : ""}${metrics.forwardPct}%`;
  els.mSpace.textContent = `${metrics.whitespacePct}%`;
  els.mSub.textContent = `${metrics.subCount} 篇`;

  // 三把原海报尺实况灯
  els.pEntry.dataset.pass = String(pillars.entry.pass);
  els.pbEntry.textContent = pillars.entry.badge;
  els.pnEntry.textContent = pillars.entry.note;

  els.pHier.dataset.pass = String(pillars.hierarchy.pass);
  els.pbHier.textContent = pillars.hierarchy.badge;
  els.pnHier.textContent = pillars.hierarchy.note;

  els.pOrient.dataset.pass = String(pillars.orientation.pass);
  els.pbOrient.textContent = pillars.orientation.badge;
  els.pnOrient.textContent = pillars.orientation.note;
}

function updateState(patch) {
  state = {
    ...state,
    ...patch,
  };
  state.arrowFlow = clamp(state.arrowFlow, -0.65, 1.0);
  state.titleScale = clamp(state.titleScale, 1.1, 6.0);
  if (studio) {
    studio.draw();
  }
  syncUI(studio?.getLayout());
}

function bindHeroControls() {
  els.themeBtns.forEach((b) =>
    b.addEventListener("click", () => updateState({ theme: b.dataset.theme, sectionIndex: 0 }))
  );

  els.ctrlFlow.addEventListener("input", () => {
    updateState({ arrowFlow: Number(els.ctrlFlow.value) / 100 });
  });

  els.ctrlScale.addEventListener("input", () => {
    updateState({ titleScale: Number(els.ctrlScale.value) / 100 });
  });

  els.tabStyleBtns.forEach((b) =>
    b.addEventListener("click", () => updateState({ tabStyle: b.dataset.tabStyle }))
  );

  els.subModeBtns.forEach((b) =>
    b.addEventListener("click", () => updateState({ subMode: b.dataset.subMode }))
  );

  els.btnClutter.addEventListener("click", () => {
    updateState({ clutter: !state.clutter });
  });

  els.presetBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const p = PRESETS[b.dataset.preset];
      if (!p) return;
      updateState(p.patch);
    })
  );

  els.diagFixBtn.addEventListener("click", () => {
    if (currentFixAction && studio) studio.applyAction(currentFixAction);
  });
  if (els.mdsFixBtn) {
    els.mdsFixBtn.addEventListener("click", () => {
      if (currentFixAction && studio) studio.applyAction(currentFixAction);
    });
  }
}

// 启动开场与全部 8 节交互
studio = createHeroStudio(
  els.canvas,
  () => state,
  updateState,
  (layout) => {
    // 初次或尺寸变化重绘后保持读数与画布实绘尺寸 100% 同步
    if (!els.mRatio.dataset.synced) {
      els.mRatio.dataset.synced = "1";
      syncUI(layout);
    }
  }
);

bindHeroControls();
syncUI();

initXrayDemo();
initHistoryDemo();
initThumbFlipDemo();
initFlowDemo();
initArchetypeDemo();
initSkipDecisionDemo();
initQuizDemo();
initPosterLightbox();
