// 298 折叠双窗格 · 主入口：将 model.js 单真源绑定到立体折叠舞台、左右虚线引注、四栏实况横带与使用示例操轨

import { PRESETS, SCENES, createState, evaluate, syncFoldMemory } from "./model.js";
import { mountStage } from "./stage.js";
import { mountSections } from "./sections.js";

const state = createState();

const $ = (id) => document.getElementById(id);

const heroEl = document.querySelector(".hero");
const canvas = $("fold-canvas");
let lastUiKey = "";
let uiRaf = 0;

function scheduleUI() {
  if (uiRaf) return;
  uiRaf = requestAnimationFrame(() => {
    uiRaf = 0;
    renderUI();
  });
}

const stageCtrl = mountStage(canvas, state, (reason) => {
  if (reason === "drag" || reason === "anim") scheduleUI();
  else renderUI();
});

// DOM 引用
const titleEl = $("hero-title");
const statusBadge = $("hero-badge");
const diagBadge = $("diag-badge");
const diagHeadline = $("diag-headline");
const diagWhy = $("diag-why");
const diagHint = $("diag-hint");
const diagFixBtn = $("diag-fix-btn");

const mainReadout = $("main-readout");
const subReadout = $("sub-readout");

const foldSlider = $("ctrl-fold");
const foldVal = $("ctrl-fold-val");
const ratioSlider = $("ctrl-ratio");
const ratioVal = $("ctrl-ratio-val");

const noiseBtn = $("ctrl-noise");
const seamBtn = $("ctrl-seam");
const memoryBtn = $("ctrl-memory");

const openDemoBtn = $("demo-open-btn");
const foldedDemoBtn = $("demo-folded-btn");
const pillarSwitchBtn = $("pillar-switch-btn");

const pillarIds = {
  context: { tag: $("p-context-tag"), detail: $("p-context-detail"), card: $("pillar-context") },
  space: { tag: $("p-space-tag"), detail: $("p-space-detail"), card: $("pillar-space") },
  structure: { tag: $("p-structure-tag"), detail: $("p-structure-detail"), card: $("pillar-structure") },
  switchState: { tag: $("p-switch-tag"), detail: $("p-switch-detail"), card: $("pillar-switch") },
};

const sceneBtns = document.querySelectorAll("[data-scene]");
const simBtns = document.querySelectorAll("[data-simw]");
const presetBtns = document.querySelectorAll("[data-preset]");

function setTxt(el, val) {
  if (el.textContent !== val) el.textContent = val;
}
function setAttr(el, name, val) {
  if (el.getAttribute(name) !== val) el.setAttribute(name, val);
}

function renderUI() {
  const ev = evaluate(state);
  const uiKey = `${ev.deg}|${ev.openSubPct}|${state.scene}|${state.subNoise}|${state.crossSeam}|${state.preserveState}|${state.simWidth}|${state.activeItem}|${state.lostCount}|${state.lastEvent}`;
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;

  // 1. 自示范大标题随折叠角微张合
  const openRatio = Math.min(1, state.foldDeg / 142);
  titleEl.style.setProperty("--fold-gap", `${(openRatio * 14).toFixed(1)}px`);
  setAttr(titleEl, "data-folded", String(ev.isFolded));
  setAttr(heroEl, "data-status", ev.status);

  // 2. 顶部徽标与左翼单真源诊单
  setTxt(statusBadge, ev.badge);
  setAttr(statusBadge, "data-status", ev.status);

  setTxt(diagBadge, ev.badge);
  setAttr(diagBadge, "data-status", ev.status);
  setTxt(diagHeadline, ev.headline);
  setTxt(diagWhy, ev.why);
  setTxt(diagHint, ev.hint);
  setTxt(diagFixBtn, ev.fixLabel);

  // 3. 原海报左右翼实时读数（同源实算）
  const sc = SCENES[state.scene];
  setTxt(
    mainReadout,
    ev.isFolded
      ? `独占 100% · ${ev.mainPx}px · 约 ${ev.charsPerLine} 字/行`
      : `占 ${ev.openMainPct}% · ${ev.mainPx}px · 约 ${ev.charsPerLine} 字/行`
  );
  setTxt(
    subReadout,
    ev.isFolded
      ? `已折叠收拢 · 锁定 ${sc.subItems[state.activeItem].tag}`
      : `占 ${ev.openSubPct}% · ${ev.subPx}px · ${state.subNoise ? "强色抢焦" : "温和承托"}`
  );

  // 4. 原海报中下浅米绿四栏横带实时状态
  for (const [key, dom] of Object.entries(pillarIds)) {
    const p = ev.pillars[key];
    setTxt(dom.tag, p.tag);
    setTxt(dom.detail, p.detail);
    setAttr(dom.card, "data-ok", String(p.ok));
  }
  setAttr(pillarSwitchBtn, "aria-pressed", String(!ev.isFolded));

  // 5. 原海报底部使用示例双态激活状态
  setAttr(openDemoBtn, "aria-pressed", String(!ev.isFolded));
  setAttr(foldedDemoBtn, "aria-pressed", String(ev.isFolded));

  // 6. 滑轨与细控开关同步
  if (foldSlider.value !== String(ev.deg)) foldSlider.value = String(ev.deg);
  setTxt(foldVal, `${ev.deg}°`);
  if (ratioSlider.value !== String(ev.openSubPct)) ratioSlider.value = String(ev.openSubPct);
  setTxt(ratioVal, `${ev.openMainPct}:${ev.openSubPct}`);

  setAttr(noiseBtn, "aria-pressed", String(state.subNoise));
  setTxt(noiseBtn, state.subNoise ? "副窗强色：抢焦" : "副窗强色：克制");

  setAttr(seamBtn, "aria-pressed", String(state.crossSeam));
  setTxt(seamBtn, state.crossSeam ? "折缝跨越：截断" : "折缝跨越：安全");

  setAttr(memoryBtn, "aria-pressed", String(state.preserveState));
  setTxt(memoryBtn, state.preserveState ? "情境保留：开启" : "情境保留：清零");

  sceneBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.scene === state.scene)));
  simBtns.forEach((b) => setAttr(b, "aria-pressed", String(Number(b.dataset.simw) === state.simWidth)));
}

function applyPatch(patch) {
  if (!patch) return;
  if (typeof patch.foldDeg === "number") {
    state.foldDeg = patch.foldDeg;
    state.targetFoldDeg = patch.foldDeg;
  }
  if (typeof patch.targetFoldDeg === "number") {
    state.targetFoldDeg = patch.targetFoldDeg;
  }
  if (typeof patch.subRatio === "number") state.subRatio = patch.subRatio;
  if (typeof patch.subNoise === "boolean") state.subNoise = patch.subNoise;
  if (typeof patch.crossSeam === "boolean") state.crossSeam = patch.crossSeam;
  if (typeof patch.preserveState === "boolean") {
    state.preserveState = patch.preserveState;
    if (state.preserveState) state.lastEvent = "";
  }
  if (typeof patch.simWidth === "number") state.simWidth = patch.simWidth;
  syncFoldMemory(state);
  renderUI();
  stageCtrl.draw();
}

// 绑定开场全部交互控件
sceneBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.scene = b.dataset.scene;
    renderUI();
    stageCtrl.draw();
  })
);

simBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.simWidth = Number(b.dataset.simw);
    renderUI();
    stageCtrl.draw();
  })
);

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    if (b.dataset.preset === "initial") {
      state.activeItem = 1;
      state.savedItem = 1;
      state.lostCount = 0;
      state.lastEvent = "";
    }
    applyPatch({
      targetFoldDeg: p.foldDeg,
      subRatio: p.subRatio,
      subNoise: p.subNoise,
      crossSeam: p.crossSeam,
      preserveState: p.preserveState,
      simWidth: p.simWidth,
    });
  })
);

diagFixBtn.addEventListener("click", () => {
  const ev = evaluate(state);
  applyPatch(ev.fixPatch);
});

foldSlider.addEventListener("input", () => {
  const v = Number(foldSlider.value);
  state.foldDeg = v;
  state.targetFoldDeg = v;
  syncFoldMemory(state);
  renderUI();
  stageCtrl.repaint();
});

ratioSlider.addEventListener("input", () => {
  state.subRatio = Number(ratioSlider.value) / 100;
  renderUI();
  stageCtrl.draw();
});

noiseBtn.addEventListener("click", () => {
  state.subNoise = !state.subNoise;
  renderUI();
  stageCtrl.draw();
});

seamBtn.addEventListener("click", () => {
  state.crossSeam = !state.crossSeam;
  renderUI();
  stageCtrl.draw();
});

memoryBtn.addEventListener("click", () => {
  state.preserveState = !state.preserveState;
  if (state.preserveState) {
    state.savedItem = state.activeItem;
    state.lastEvent = "";
  }
  renderUI();
  stageCtrl.draw();
});

openDemoBtn.addEventListener("click", () => applyPatch({ targetFoldDeg: 142 }));
foldedDemoBtn.addEventListener("click", () => applyPatch({ targetFoldDeg: 0 }));
pillarSwitchBtn.addEventListener("click", () => {
  const ev = evaluate(state);
  applyPatch({ targetFoldDeg: ev.isFolded ? 142 : 0 });
});

// 初次渲染 + 启动正文 01–07 节全部交互
renderUI();
stageCtrl.draw();
mountSections();
