// 034 V形构图 — 主入口：串联单真源 model.js、开场剧场画布、动态 V 标题示范与全部 7 节交互
import {
  PRESETS,
  SCENES,
  applyPreset,
  clamp,
  createInitialState,
  solveGeometry,
} from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const topStatus = document.getElementById("top-status");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagReason = document.getElementById("diag-reason");
const diagAction = document.getElementById("diag-action");
const diagBox = document.getElementById("diag-box");

// 4 项单真源读数格
const readAngle = document.getElementById("read-angle");
const readAsym = document.getElementById("read-asym");
const readFocal = document.getElementById("read-focal");
const readFlow = document.getElementById("read-flow");

// 动态响应大 V 标（标题本身就是示范）
const dynVLeft = document.getElementById("dyn-v-left");
const dynVRight = document.getElementById("dyn-v-right");
const dynVDot = document.getElementById("dyn-v-dot");

// 控件
const rangeLeft = document.getElementById("ctrl-left");
const rangeRight = document.getElementById("ctrl-right");
const rangeWeight = document.getElementById("ctrl-weight");
const valLeft = document.getElementById("val-left");
const valRight = document.getElementById("val-right");
const valWeight = document.getElementById("val-weight");
const btnMode = document.getElementById("btn-flip-mode");
const btnGuides = document.getElementById("btn-guides");
const btnSnapFocal = document.getElementById("btn-snap-focal");
const btnClearRebels = document.getElementById("btn-clear-rebels");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const appCards = [...document.querySelectorAll("[data-app-scene]")];

let heroStage = null;

const setText = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
const setAttr = (el, k, v) => { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); };
const setData = (el, k, v) => { if (el && el.dataset[k] !== v) el.dataset[k] = v; };

function updateDynamicVTitle(g) {
  if (!dynVLeft || !dynVRight || !dynVDot) return;
  // 依据真实左右倾角实时微调标题中巨型 V 字的两臂张合，并在倒 V 模式下真的翻成 ∧
  const lx = Math.round(clamp(12 + (46 - state.leftDeg) * 0.45, 6, 34));
  const rx = Math.round(clamp(88 - (46 - state.rightDeg) * 0.45, 66, 94));
  const apexX = Math.round(clamp(50 + g.apexX * 36, 34, 66));
  if (g.isUp) {
    setAttr(dynVLeft, "points", `${lx},86 ${lx + 15},86 ${apexX + 5},14 ${apexX - 5},14`);
    setAttr(dynVRight, "points", `${rx},86 ${rx - 15},86 ${apexX - 5},14 ${apexX + 5},14`);
    setAttr(dynVDot, "cx", String(apexX));
    setAttr(dynVDot, "cy", "14");
  } else {
    setAttr(dynVLeft, "points", `${lx},10 ${lx + 16},10 ${apexX + 6},84 ${apexX - 6},84`);
    setAttr(dynVRight, "points", `${rx},10 ${rx - 16},10 ${apexX - 6},84 ${apexX + 6},84`);
    setAttr(dynVDot, "cx", String(apexX));
    setAttr(dynVDot, "cy", "84");
  }
  setAttr(dynVDot, "fill", g.passed === 4 ? "#7BE8BF" : "#DC3874");
}

function syncUI(snap = false) {
  const g = solveGeometry(state);

  // 顶眉状态灯
  setText(topStatus, g.passed === 4 ? "4 / 4 聚光成立" : `${g.passed} / 4 待调聚光`);
  setData(topStatus, "tone", g.tone);

  // 单真源白话诊单
  setData(diagBox, "tone", g.tone);
  setText(diagBadge, g.badge);
  setText(diagTitle, g.headline);
  setText(diagReason, g.reason);
  setText(diagAction, g.action);

  // 4 项精确测量读数
  setText(readAngle, `${Math.round(g.vAngle)}°`);
  setText(readAsym, g.asymDeg < 1 ? "0° 对称" : `差 ${Math.round(g.asymDeg)}°`);
  setText(readFocal, g.checks.okFocalAlign
    ? `${state.focalWeight.toFixed(2)}× 锁焦`
    : `偏 ${Math.round(g.focalOffset * 100)}%`);
  setText(readFlow, g.funnelTier);

  // 同步 6 枚原海报玫红圆徽实况灯
  for (const [key, info] of Object.entries(g.pills)) {
    const el = document.querySelector(`[data-pill="${key}"]`);
    if (!el) continue;
    setText(el, info.tag);
    setData(el, "ok", String(info.ok));
  }

  // 同步滑杆与按钮状态
  const lStr = String(Math.round(state.leftDeg));
  const rStr = String(Math.round(state.rightDeg));
  const wStr = String(Math.round(state.focalWeight * 100));
  if (rangeLeft.value !== lStr) rangeLeft.value = lStr;
  if (rangeRight.value !== rStr) rangeRight.value = rStr;
  if (rangeWeight.value !== wStr) rangeWeight.value = wStr;
  setText(valLeft, `${lStr}°`);
  setText(valRight, `${rStr}°`);
  setText(valWeight, `${state.focalWeight.toFixed(2)}×`);

  setText(btnMode, state.mode === "down" ? "当前：正 V（∨）" : "切回正 V（∨）");
  setData(btnMode, "warn", String(state.mode === "up"));
  setText(btnGuides, state.showGuides ? "虚线导轨：开" : "虚线导轨：关");
  setAttr(btnGuides, "aria-pressed", String(state.showGuides));

  setText(btnClearRebels, g.rebelCount > 0 ? `归顺干扰（${g.rebelCount}）` : "方向已统一");
  btnClearRebels.disabled = g.rebelCount === 0;

  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    setAttr(b, "aria-pressed", String(on));
  });

  appCards.forEach((c) => {
    c.classList.toggle("is-active", c.dataset.appScene === state.scene);
  });

  updateDynamicVTitle(g);
  if (heroStage) {
    if (snap) heroStage.snapAnim();
    else heroStage.draw();
  }
}

// 挂载开场剧场画布
heroStage = mountHeroStage(canvas, state, () => syncUI(false));

// 控件事件
rangeLeft.addEventListener("input", () => {
  state.leftDeg = Number(rangeLeft.value);
  syncUI(true);
});
rangeRight.addEventListener("input", () => {
  state.rightDeg = Number(rangeRight.value);
  syncUI(true);
});
rangeWeight.addEventListener("input", () => {
  state.focalWeight = Number(rangeWeight.value) / 100;
  syncUI(true);
});

btnMode.addEventListener("click", () => {
  state.mode = state.mode === "down" ? "up" : "down";
  syncUI(false);
});
btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI(false);
});
btnSnapFocal.addEventListener("click", () => {
  const g = solveGeometry(state);
  state.focalX = g.apexX;
  state.focalY = clamp(g.apexY, 0.28, 0.84);
  if (state.focalWeight < 0.92) state.focalWeight = 1.05;
  syncUI(false);
});
btnClearRebels.addEventListener("click", () => {
  state.rebels = [false, false];
  syncUI(false);
});

sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    if (SCENES[b.dataset.scene]) {
      state.scene = b.dataset.scene;
      syncUI(false);
    }
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const k = b.dataset.preset;
    if (PRESETS[k]) {
      applyPreset(state, k);
      syncUI(false);
    }
  });
});

// 底沿 1:1 复刻原海报「应用场景」四栏点击可直切对应剧场实景
appCards.forEach((c) => {
  c.addEventListener("click", () => {
    const s = c.dataset.appScene;
    if (SCENES[s]) {
      state.scene = s;
      syncUI(false);
    }
  });
});

// 初始化正文全部互动节与灯箱
syncUI(true);
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
