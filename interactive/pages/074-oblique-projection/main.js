// 074 斜投影构图 · 页面总入口（单真源同步开场制图台与所有正文互动）
import { INITIAL_STATE, PRESETS } from "./model.js";
import { initHeroStage } from "./heroStage.js";
import {
  initStepBuilder,
  initCavalierCabinet,
  initProjectionMorph,
  initHistoryTabs,
  initCssExtruder,
  initAntiPatternCards,
  initPracticeQuiz,
  initPosterLightbox,
} from "./labs.js";

const state = { ...INITIAL_STATE };

const heroCanvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const diagBox = document.getElementById("hero-diag");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");

// 四项单真源实测读数
const rCorner = document.getElementById("ro-corner");
const rAngle = document.getElementById("ro-angle");
const rDepth = document.getElementById("ro-depth");
const rParallel = document.getElementById("ro-parallel");

// 底部三枚原海报圆徽实况标签
const cardFront = document.getElementById("card-stat-front");
const cardDir = document.getElementById("card-stat-dir");
const cardVisual = document.getElementById("card-stat-visual");

// 原生控件（滑轨 + 按钮 + 题材切换）
const sliderAngle = document.getElementById("ctrl-angle");
const sliderDepth = document.getElementById("ctrl-depth");
const btnFixFront = document.getElementById("btn-fix-front");
const btnFixParallel = document.getElementById("btn-fix-parallel");
const subjectBtns = [...document.querySelectorAll("[data-subject]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

let heroApi = null;

function syncHeroUI() {
  if (!heroApi) return;
  const s = heroApi.getScene();
  const { metrics, checks, diagnosis } = s;

  // 状态胶囊 & 诊单
  statusPill.textContent = diagnosis.badge;
  statusPill.dataset.sev = diagnosis.severity;
  diagBox.dataset.sev = diagnosis.severity;
  diagBadge.textContent = diagnosis.badge;
  diagTitle.textContent = diagnosis.headline;
  diagBody.textContent = diagnosis.body;
  diagHint.textContent = diagnosis.hint;

  // 四项单真源读数
  rCorner.textContent = `${metrics.cornerDeg.toFixed(1)}°`;
  rCorner.dataset.ok = String(checks.frontTrue);

  rAngle.textContent = `${metrics.angleDeg.toFixed(0)}°`;
  rAngle.dataset.ok = String(checks.angleOk);

  rDepth.textContent = `${metrics.depthRatio.toFixed(2)}×`;
  rDepth.dataset.ok = checks.depthBalanced ? "true" : (checks.depthCavalier ? "warn" : "false");

  rParallel.textContent = metrics.parallelDiff <= 2 ? "0.0° 平行" : `偏 ${metrics.parallelDiff.toFixed(0)}°`;
  rParallel.dataset.ok = String(checks.parallelOk);

  // 三枚原海报圆徽卡实时状态
  cardFront.textContent = checks.frontTrue ? "90° 真形" : `歪斜 ${metrics.cornerDeg.toFixed(0)}°`;
  cardFront.dataset.ok = String(checks.frontTrue);

  cardDir.textContent = checks.parallelOk ? "严格平行" : `错角 ${metrics.parallelDiff.toFixed(0)}°`;
  cardDir.dataset.ok = String(checks.parallelOk);

  cardVisual.textContent = checks.visualOk
    ? `自然 ${metrics.depthRatio.toFixed(2)}×`
    : checks.cavalierValid
      ? `骑士 1:1`
      : `${metrics.angleDeg.toFixed(0)}° · ${metrics.depthRatio.toFixed(2)}×`;
  cardVisual.dataset.ok = checks.visualOk ? "true" : (checks.cavalierValid ? "warn" : "false");

  // 滑轨与快修钮同步
  sliderAngle.value = String(Math.round(state.angleDeg));
  sliderDepth.value = String(Math.round(state.depthRatio * 100));

  btnFixFront.textContent = checks.frontTrue ? "正面已正 90°（试歪）" : "扳正正面 → 90°";
  btnFixFront.dataset.need = String(!checks.frontTrue);

  btnFixParallel.textContent = checks.parallelOk ? "副体已平行（试错）" : "对齐副体 → 平行";
  btnFixParallel.dataset.need = String(!checks.parallelOk);

  subjectBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.subject === state.subject)));
}

if (heroCanvas) {
  heroApi = initHeroStage(heroCanvas, state, syncHeroUI);
  syncHeroUI();

  sliderAngle.addEventListener("input", () => {
    state.angleDeg = +sliderAngle.value;
    heroApi.redraw();
    syncHeroUI();
  });

  sliderDepth.addEventListener("input", () => {
    state.depthRatio = +(+sliderDepth.value / 100).toFixed(2);
    heroApi.redraw();
    syncHeroUI();
  });

  btnFixFront.addEventListener("click", () => {
    state.frontShearDeg = Math.abs(state.frontShearDeg) > 1.5 ? 0 : 14;
    heroApi.redraw();
    syncHeroUI();
  });

  btnFixParallel.addEventListener("click", () => {
    state.companionOffsetDeg = Math.abs(state.companionOffsetDeg) > 2 ? 0 : 38;
    heroApi.redraw();
    syncHeroUI();
  });

  subjectBtns.forEach((b) => b.addEventListener("click", () => {
    state.subject = b.dataset.subject;
    heroApi.redraw();
    syncHeroUI();
  }));

  presetBtns.forEach((b) => b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    Object.assign(state, {
      frontShearDeg: p.frontShearDeg,
      angleDeg: p.angleDeg,
      depthRatio: p.depthRatio,
      companionOffsetDeg: p.companionOffsetDeg,
    });
    heroApi.redraw();
    syncHeroUI();
  }));
}

// 初始化正文 01–08 节交互
initStepBuilder();
initCavalierCabinet();
initProjectionMorph();
initHistoryTabs();
initCssExtruder();
initAntiPatternCards();
initPracticeQuiz();
initPosterLightbox();
