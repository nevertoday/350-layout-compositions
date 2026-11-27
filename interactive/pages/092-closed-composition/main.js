// 092 封闭式构图 CLOSED COMPOSITION — 主入口：单真源同步开场藏室与正文各节

import {
  SCENARIOS,
  createInitialState,
  applyPreset,
  audit,
  clamp,
} from "./model.js";
import { mountHeroCanvas } from "./canvas-hero.js";
import {
  mountPeelLab,
  mountXrayLab,
  mountEraStepper,
  mountMarginTester,
  mountAvoidCards,
  mountQuiz,
  mountPosterLightbox,
} from "./sections.js";

const state = createInitialState();

// DOM 缓存
const canvas = document.getElementById("hero-canvas");
const titleFrame = document.getElementById("title-frame");
const statusPill = document.getElementById("hero-status-pill");
const scenarioCaption = document.getElementById("scenario-caption");

const rangeSeal = document.getElementById("range-seal");
const valSeal = document.getElementById("val-seal");
const rangeCore = document.getElementById("range-core");
const valCore = document.getElementById("val-core");

const btnFormSquare = document.getElementById("btn-form-square");
const btnFormTondo = document.getElementById("btn-form-tondo");
const btnBevels = document.getElementById("btn-bevels");
const btnIntruder = document.getElementById("btn-intruder");
const btnGuides = document.getElementById("btn-guides");
const btnGaze = document.getElementById("btn-gaze");

const auditCard = document.getElementById("audit-card");
const auditStamp = document.getElementById("audit-stamp");
const auditTier = document.getElementById("audit-tier");
const auditHeadline = document.getElementById("audit-headline");
const auditWhy = document.getElementById("audit-why");
const auditHint = document.getElementById("audit-hint");

const btnCalibrate = document.getElementById("btn-calibrate");
const btnSealGates = document.getElementById("btn-seal-gates");
const btnReset = document.getElementById("btn-reset");

const scenarioTabs = [...document.querySelectorAll("[data-scenario]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const probeItems = {
  boundary: document.querySelector('[data-probe="boundary"]'),
  guidance: document.querySelector('[data-probe="guidance"]'),
  focus: document.querySelector('[data-probe="focus"]'),
  unity: document.querySelector('[data-probe="unity"]'),
};
const probeTags = {
  boundary: document.getElementById("probe-boundary-tag"),
  guidance: document.getElementById("probe-guidance-tag"),
  focus: document.getElementById("probe-focus-tag"),
  unity: document.getElementById("probe-unity-tag"),
};
const kwCells = {
  boundary: document.querySelector('[data-kw="boundary"]'),
  guidance: document.querySelector('[data-kw="guidance"]'),
  focus: document.querySelector('[data-kw="focus"]'),
  unity: document.querySelector('[data-kw="unity"]'),
};
const kwText = {
  boundary: document.getElementById("kw-boundary"),
  guidance: document.getElementById("kw-guidance"),
  focus: document.getElementById("kw-focus"),
  unity: document.getElementById("kw-unity"),
};

function syncUI() {
  const res = audit(state);
  const { g, probes } = res;

  // 1. 自示范细金角框大标随真实合围度张合
  const gapPx = Math.round(res.titleBracketSpread * 11);
  titleFrame.style.setProperty("--bracket-gap", `${gapPx}px`);
  titleFrame.classList.toggle("is-ok", res.ok);
  titleFrame.classList.toggle("is-cage", g.seal > 105);

  statusPill.textContent = res.stamp;
  statusPill.classList.toggle("is-ok", res.ok);
  statusPill.classList.toggle("is-bad", !res.ok);

  scenarioCaption.textContent = SCENARIOS[state.scenario].caption;

  // 2. 卡尺读数与按钮状态
  rangeSeal.value = String(g.seal);
  valSeal.textContent = `${g.seal}%`;
  rangeCore.value = String(g.coreScale);
  valCore.textContent = `${g.coreScale}%`;

  const isSq = state.form === "square";
  btnFormSquare.classList.toggle("is-active", isSq);
  btnFormSquare.setAttribute("aria-pressed", String(isSq));
  btnFormTondo.classList.toggle("is-active", !isSq);
  btnFormTondo.setAttribute("aria-pressed", String(!isSq));

  btnBevels.textContent = state.inwardBevels ? "斜切：向内收束" : "斜切：外散";
  btnBevels.classList.toggle("is-active", state.inwardBevels);
  btnBevels.classList.toggle("is-warn", !state.inwardBevels);
  btnBevels.setAttribute("aria-pressed", String(state.inwardBevels));

  btnIntruder.textContent = state.strayIntruder ? "闯边块：在框" : "闯边块：已收";
  btnIntruder.classList.toggle("is-warn", state.strayIntruder);
  btnIntruder.classList.toggle("is-active", !state.strayIntruder);
  btnIntruder.setAttribute("aria-pressed", String(state.strayIntruder));

  btnGuides.textContent = state.guides ? "导引矢：开" : "导引矢：关";
  btnGuides.classList.toggle("is-active", state.guides);
  btnGuides.setAttribute("aria-pressed", String(state.guides));

  for (const tab of scenarioTabs) {
    const active = tab.dataset.scenario === state.scenario;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  }

  // 3. 单真源诊单
  auditCard.classList.toggle("is-ok", res.ok);
  auditCard.classList.toggle("is-bad", !res.ok);
  auditStamp.textContent = res.stamp;
  auditTier.textContent = `围合状态：${res.tier}`;
  auditHeadline.textContent = res.headline;
  auditWhy.textContent = res.why;
  auditHint.textContent = res.hint;

  btnSealGates.textContent = g.closedCount < 4 ? `封齐四门（剩 ${g.openGates.length} 缺口）` : "四门已全闭";
  btnSealGates.disabled = g.closedCount === 4;

  // 4. 四枚原海报圆徽探针 + 底部深柏压脚四关键词同步
  for (const k of ["boundary", "guidance", "focus", "unity"]) {
    const p = probes[k];
    probeItems[k]?.classList.toggle("is-ok", p.ok);
    probeItems[k]?.classList.toggle("is-bad", !p.ok);
    if (probeTags[k]) probeTags[k].textContent = p.tag;
    kwCells[k]?.classList.toggle("is-ok", p.ok);
    if (kwText[k]) kwText[k].textContent = p.kw;
  }
}

const heroCtrl = mountHeroCanvas(canvas, state, () => syncUI());

// 语境切换
for (const tab of scenarioTabs) {
  tab.addEventListener("click", () => {
    state.scenario = tab.dataset.scenario;
    syncUI();
    heroCtrl.redraw();
  });
}

// 卡尺滑轨
rangeSeal.addEventListener("input", () => {
  state.seal = clamp(Number(rangeSeal.value), 20, 120);
  syncUI();
  heroCtrl.redraw();
});
rangeCore.addEventListener("input", () => {
  state.coreScale = clamp(Number(rangeCore.value), 10, 60);
  syncUI();
  heroCtrl.redraw();
});

// 形态与结构开关
btnFormSquare.addEventListener("click", () => {
  state.form = "square";
  syncUI();
  heroCtrl.redraw();
});
btnFormTondo.addEventListener("click", () => {
  state.form = "tondo";
  syncUI();
  heroCtrl.redraw();
});
btnBevels.addEventListener("click", () => {
  state.inwardBevels = !state.inwardBevels;
  syncUI();
  heroCtrl.redraw();
});
btnIntruder.addEventListener("click", () => {
  state.strayIntruder = !state.strayIntruder;
  syncUI();
  heroCtrl.redraw();
});
btnGuides.addEventListener("click", () => {
  state.guides = !state.guides;
  syncUI();
  heroCtrl.redraw();
});

// 诊单快捷动作
btnCalibrate.addEventListener("click", () => {
  applyPreset(state, "poster");
  syncUI();
  heroCtrl.launchGaze();
});
btnSealGates.addEventListener("click", () => {
  state.gates = { n: true, e: true, s: true, w: true };
  syncUI();
  heroCtrl.redraw();
});
btnReset.addEventListener("click", () => {
  applyPreset(state, "broken");
  heroCtrl.clearGaze();
  syncUI();
  heroCtrl.redraw();
});
btnGaze.addEventListener("click", () => {
  heroCtrl.launchGaze();
});

// 合法多解与双向试错按钮
for (const btn of presetBtns) {
  btn.addEventListener("click", () => {
    applyPreset(state, btn.dataset.preset);
    heroCtrl.clearGaze();
    syncUI();
    heroCtrl.redraw();
  });
}

// 键盘操作：方向键微调合围度 / 核心尺度，Space 放飞视线验真
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  const inControl = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  if (e.code === "Space" && !inControl && tag !== "BUTTON" && tag !== "A") {
    const lb = document.getElementById("lightbox");
    if (lb && !lb.hidden) return;
    e.preventDefault();
    heroCtrl.launchGaze();
    return;
  }
  if (inControl) return;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.seal = clamp(state.seal + 4, 20, 120);
    syncUI();
    heroCtrl.redraw();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.seal = clamp(state.seal - 4, 20, 120);
    syncUI();
    heroCtrl.redraw();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.coreScale = clamp(state.coreScale + 2, 10, 60);
    syncUI();
    heroCtrl.redraw();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.coreScale = clamp(state.coreScale - 2, 10, 60);
    syncUI();
    heroCtrl.redraw();
  }
});

// 初始化正文六大互动实验与原海报灯箱
syncUI();
mountPeelLab();
mountXrayLab();
mountEraStepper();
mountMarginTester();
mountAvoidCards();
mountQuiz();
mountPosterLightbox();
