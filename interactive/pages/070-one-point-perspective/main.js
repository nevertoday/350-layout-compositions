// 070 一点透视 · 页面总装配与单真源状态联动

import { createInitialState, PRESETS, SCENES, diagnose } from "./model.js";
import { mountHeroStage } from "./heroStage.js";
import { initSec01, initSec02, initSec03, initSec04, initSec05, initSec06, initSec07 } from "./labs.js";

const state = createInitialState();

// DOM 引用
const topStatus = document.getElementById("top-status");
const heroDiag = document.getElementById("hero-diag");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const vpReadout = document.getElementById("vp-readout");

const pVpState = document.getElementById("p-vp-state");
const pFocusState = document.getElementById("p-focus-state");
const pDepthState = document.getElementById("p-depth-state");
const pConvState = document.getElementById("p-conv-state");

const lblBench = document.getElementById("lbl-bench");
const lblDoor = document.getElementById("lbl-door");
const lblPedestal = document.getElementById("lbl-pedestal");
const valBench = document.getElementById("val-bench");
const valDoor = document.getElementById("val-door");
const valPedestal = document.getElementById("val-pedestal");

const partTabs = [...document.querySelectorAll(".part-tab")];
const partSlider = document.getElementById("part-slider");
const partSliderLabel = document.getElementById("part-slider-label");
const snapBtn = document.getElementById("btn-snap-part");

const vpxSlider = document.getElementById("vpx-slider");
const vpySlider = document.getElementById("vpy-slider");
const vpxVal = document.getElementById("vpx-val");
const vpyVal = document.getElementById("vpy-val");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const guidesBtn = document.getElementById("btn-guides");
const pillarBtns = [...document.querySelectorAll(".pillar-item")];
const floorBtns = [...document.querySelectorAll("[data-floor]")];
const fgBtns = [...document.querySelectorAll("[data-fg]")];

function setStatePill(el, ok, text) {
  el.textContent = text;
  el.classList.toggle("is-ok", ok);
  el.classList.toggle("is-err", !ok);
}

function syncUI() {
  const diag = diagnose(state);
  const sc = SCENES[state.scene] || SCENES.poster;

  // 顶眉徽章
  topStatus.textContent = diag.allOk
    ? `3 / 3 ${diag.solutionName}`
    : `${diag.alignedCount} / 3 错构未齐`;
  topStatus.classList.toggle("is-ok", diag.allOk);
  topStatus.classList.toggle("is-err", !diag.allOk);

  // 白话单真源诊单卡
  heroDiag.classList.toggle("is-ok", diag.allOk);
  diagBadge.textContent = diag.badge;
  diagBadge.classList.toggle("is-ok", diag.allOk);
  diagBadge.classList.toggle("is-err", !diag.allOk);
  diagHeadline.textContent = diag.headline;
  diagBody.textContent = diag.body;
  diagHint.textContent = diag.hint;

  // 坐标读数
  const px = Math.round(state.vpX * 100);
  const py = Math.round(state.vpY * 100);
  vpReadout.textContent = `VP ${px}%, ${py}%`;
  vpxSlider.value = String(px);
  vpySlider.value = String(py);
  vpxVal.textContent = `${px}%`;
  vpyVal.textContent = `${py}%`;

  // 纯黑四柱原理带
  setStatePill(pVpState, diag.pillars.vp.ok, diag.pillars.vp.status);
  setStatePill(pFocusState, diag.pillars.focus.ok, diag.pillars.focus.status);
  setStatePill(pDepthState, diag.pillars.depth.ok, diag.pillars.depth.status);
  setStatePill(pConvState, diag.pillars.convergence.ok, diag.pillars.convergence.status);

  // 三构件标签与读数
  lblBench.textContent = sc.benchLabel;
  lblDoor.textContent = sc.doorLabel;
  lblPedestal.textContent = sc.pedestalLabel;

  valBench.textContent = diag.checks.benchOk
    ? "已齐"
    : `${state.benchAngleDeg > 0 ? "+" : ""}${state.benchAngleDeg.toFixed(0)}°`;
  valDoor.textContent = diag.checks.doorOk
    ? "已齐"
    : `${state.doorHorizonOffset > 0 ? "低" : "高"}${Math.abs(state.doorHorizonOffset).toFixed(0)}%`;
  valPedestal.textContent = diag.checks.pedOk
    ? "已齐"
    : `${state.pedestalYawDeg > 0 ? "+" : ""}${state.pedestalYawDeg.toFixed(0)}°`;

  const activePart = state.activeTarget === "vp" ? "bench" : state.activeTarget;
  partTabs.forEach((t) => {
    const key = t.dataset.part;
    const ok = key === "bench" ? diag.checks.benchOk : key === "door" ? diag.checks.doorOk : diag.checks.pedOk;
    t.classList.toggle("is-ok", ok);
    t.classList.toggle("is-err", !ok);
    const active = key === activePart;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });

  // 构件精细滑轨联动
  if (activePart === "bench") {
    partSliderLabel.textContent = `${sc.benchLabel}纵深偏角 (${state.benchAngleDeg > 0 ? "+" : ""}${state.benchAngleDeg.toFixed(1)}°)`;
    partSlider.min = "-28";
    partSlider.max = "28";
    partSlider.value = String(state.benchAngleDeg);
  } else if (activePart === "door") {
    partSliderLabel.textContent = `${sc.doorLabel}视平高度差 (${state.doorHorizonOffset > 0 ? "低 " : state.doorHorizonOffset < 0 ? "高 " : ""}${Math.abs(state.doorHorizonOffset).toFixed(1)}%)`;
    partSlider.min = "-32";
    partSlider.max = "32";
    partSlider.value = String(state.doorHorizonOffset);
  } else {
    partSliderLabel.textContent = `${sc.pedestalLabel}水平偏航角 (${state.pedestalYawDeg > 0 ? "+" : ""}${state.pedestalYawDeg.toFixed(1)}°)`;
    partSlider.min = "-32";
    partSlider.max = "32";
    partSlider.value = String(state.pedestalYawDeg);
  }

  // 压测按钮激活态
  sceneBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
  floorBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.floor === state.floorMode));
  fgBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.fg === state.foregroundScale));
  guidesBtn.classList.toggle("is-active", state.showGuides);
  guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
  guidesBtn.textContent = state.showGuides ? "辅助射线：开" : "辅助射线：关";
  pillarBtns.forEach((b) => {
    const active = state.highlightLayer === b.dataset.highlight;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}

// 挂载主舞台
const heroStage = mountHeroStage(document.getElementById("hero-canvas"), state, syncUI);

// 绑定事件
sceneBtns.forEach((b) => b.addEventListener("click", () => {
  state.scene = b.dataset.scene;
  syncUI();
  heroStage.draw();
}));

presetBtns.forEach((b) => b.addEventListener("click", () => {
  const p = PRESETS[b.dataset.preset];
  if (!p) return;
  state.vpX = p.vpX;
  state.vpY = p.vpY;
  state.benchAngleDeg = p.benchAngleDeg;
  state.doorHorizonOffset = p.doorHorizonOffset;
  state.pedestalYawDeg = p.pedestalYawDeg;
  state.floorMode = p.floorMode;
  state.foregroundScale = p.foregroundScale;
  state.activeTarget = p.activeTarget;
  syncUI();
  heroStage.draw();
}));

guidesBtn.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
  heroStage.draw();
});

pillarBtns.forEach((b) => b.addEventListener("click", () => {
  const k = b.dataset.highlight;
  state.highlightLayer = state.highlightLayer === k ? null : k;
  syncUI();
  heroStage.draw();
}));

partTabs.forEach((t) => t.addEventListener("click", () => {
  state.activeTarget = t.dataset.part;
  syncUI();
  heroStage.draw();
}));

partSlider.addEventListener("input", () => {
  const v = Number(partSlider.value);
  const activePart = state.activeTarget === "vp" ? "bench" : state.activeTarget;
  if (activePart === "bench") state.benchAngleDeg = Math.abs(v) < 1.2 ? 0 : v;
  else if (activePart === "door") state.doorHorizonOffset = Math.abs(v) < 1.5 ? 0 : v;
  else state.pedestalYawDeg = Math.abs(v) < 1.5 ? 0 : v;
  syncUI();
  heroStage.draw();
});

snapBtn.addEventListener("click", () => {
  const activePart = state.activeTarget === "vp" ? "bench" : state.activeTarget;
  if (activePart === "bench") state.benchAngleDeg = 0;
  else if (activePart === "door") state.doorHorizonOffset = 0;
  else state.pedestalYawDeg = 0;
  syncUI();
  heroStage.draw();
});

vpxSlider.addEventListener("input", () => {
  state.vpX = Number(vpxSlider.value) / 100;
  syncUI();
  heroStage.draw();
});

vpySlider.addEventListener("input", () => {
  state.vpY = Number(vpySlider.value) / 100;
  syncUI();
  heroStage.draw();
});

floorBtns.forEach((b) => b.addEventListener("click", () => {
  state.floorMode = b.dataset.floor;
  syncUI();
  heroStage.draw();
}));

fgBtns.forEach((b) => b.addEventListener("click", () => {
  state.foregroundScale = b.dataset.fg;
  syncUI();
  heroStage.draw();
}));

// 初始化全页 01–07 节互动实验
syncUI();
heroStage.draw();
initSec01();
initSec02();
initSec03();
initSec04();
initSec05();
initSec06();
initSec07();
