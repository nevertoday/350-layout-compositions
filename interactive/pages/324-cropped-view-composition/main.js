// 324 截景式构图 —— 入口模块：绑定主舞台状态、单真源诊单与 01–07 节全部交互
import { SUBJECTS, createInitialState, evaluateCrop } from "./model.js";
import { mountHeroStage, updateMiniDiagram } from "./heroCanvas.js";
import {
  mountPosterLightbox,
  mountSection01,
  mountSection02,
  mountSection03,
  mountSection04,
  mountSection05,
  mountSection06,
} from "./sections.js";

const state = createInitialState();

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const miniSvg = document.getElementById("mini-diagram");
const topPill = document.getElementById("top-status-pill");
const titleCutNum = document.getElementById("title-cut-num");
const subjectSubtitle = document.getElementById("subject-subtitle");

const checkCrop = document.getElementById("check-crop");
const checkExtend = document.getElementById("check-extend");
const checkFocus = document.getElementById("check-focus");
const tagCrop = document.getElementById("tag-crop");
const tagExtend = document.getElementById("tag-extend");
const tagFocus = document.getElementById("tag-focus");

const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagNext = document.getElementById("diag-next");

const mCut = document.getElementById("m-cut");
const mCov = document.getElementById("m-cov");
const mCore = document.getElementById("m-core");
const mTier = document.getElementById("m-tier");

const rngCx = document.getElementById("rng-cx");
const rngCy = document.getElementById("rng-cy");
const rngScale = document.getElementById("rng-scale");
const outCx = document.getElementById("out-cx");
const outCy = document.getElementById("out-cy");
const outScale = document.getElementById("out-scale");

const xrayBtn = document.getElementById("xray-toggle");
const presetMainBtn = document.getElementById("preset-main");
const presetDiagBtn = document.getElementById("preset-diag");
const presetResetBtn = document.getElementById("preset-reset");
const trapOverBtn = document.getElementById("trap-overcrop");
const trapTrapBtn = document.getElementById("trap-trapped");
const subjectBtns = [...document.querySelectorAll("[data-subject]")];

const pct = (v) => `${Math.round(v * 100)}%`;

function syncUI() {
  const info = evaluateCrop(state);
  const subj = info.subj;

  // 顶栏状态与自示范裁切签
  if (topPill) {
    topPill.textContent = info.badge;
    topPill.classList.toggle("is-pass", info.pass);
    topPill.classList.toggle("is-warn", !info.pass);
  }
  if (titleCutNum) titleCutNum.textContent = `截 ${pct(info.cutRatio)}`;
  if (subjectSubtitle) subjectSubtitle.textContent = subj.subtitle;

  // 原海报三枚黑圆徽实况
  if (checkCrop) checkCrop.classList.toggle("is-ok", info.checks.crop);
  if (checkExtend) checkExtend.classList.toggle("is-ok", info.checks.extend);
  if (checkFocus) checkFocus.classList.toggle("is-ok", info.checks.focus);
  if (tagCrop) tagCrop.textContent = info.tags.crop;
  if (tagExtend) tagExtend.textContent = info.tags.extend;
  if (tagFocus) tagFocus.textContent = info.tags.focus;

  // 单真源白话诊单
  if (diagBadge) {
    diagBadge.textContent = info.badge;
    diagBadge.classList.toggle("is-pass", info.pass);
    diagBadge.classList.toggle("is-warn", !info.pass);
  }
  if (diagHeadline) diagHeadline.textContent = info.headline;
  if (diagBody) diagBody.textContent = info.body;
  if (diagNext) diagNext.textContent = info.nextStep;

  // 四格实算读数
  if (mCut) mCut.textContent = pct(info.cutRatio);
  if (mCov) mCov.textContent = pct(info.inFrameCoverage);
  if (mCore) mCore.textContent = pct(info.coreKeep);
  if (mTier) mTier.textContent = info.tensionTier;

  // 滑杆与按钮文案同步
  if (rngCx) rngCx.value = String(state.cx);
  if (rngCy) rngCy.value = String(state.cy);
  if (rngScale) rngScale.value = String(state.scale);
  if (outCx) outCx.textContent = `${Math.round(state.cx * 100)}%`;
  if (outCy) outCy.textContent = `${Math.round(state.cy * 100)}%`;
  if (outScale) outScale.textContent = `${state.scale.toFixed(2)}×`;

  subjectBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.subject === state.subject));
  if (xrayBtn) {
    xrayBtn.classList.toggle("is-active", state.xray);
    xrayBtn.setAttribute("aria-pressed", String(state.xray));
    xrayBtn.textContent = state.xray ? "画外硫酸纸：开" : "画外硫酸纸：关";
  }

  // 预设按钮随题材自动更新名称
  if (presetMainBtn) presetMainBtn.textContent = subj.presets.poster.label;
  if (presetDiagBtn) presetDiagBtn.textContent = subj.presets.diagonal.label;
  if (trapOverBtn) trapOverBtn.textContent = subj.presets.overcrop.label;
  if (trapTrapBtn) trapTrapBtn.textContent = subj.presets.trapped.label;

  // 联动左侧底左解剖小图
  updateMiniDiagram(miniSvg, state, info);
}

const stage = mountHeroStage(heroCanvas, state, syncUI);

function applyCoords(coords) {
  state.cx = coords.cx;
  state.cy = coords.cy;
  state.scale = coords.scale;
  syncUI();
  stage.draw();
}

// 绑定主舞台控件
subjectBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.subject;
    if (!SUBJECTS[id]) return;
    state.subject = id;
    applyCoords(SUBJECTS[id].badStart);
  });
});

if (xrayBtn) {
  xrayBtn.addEventListener("click", () => {
    state.xray = !state.xray;
    syncUI();
    stage.draw();
  });
}

if (presetMainBtn) {
  presetMainBtn.addEventListener("click", () => applyCoords(SUBJECTS[state.subject].presets.poster));
}
if (presetDiagBtn) {
  presetDiagBtn.addEventListener("click", () => applyCoords(SUBJECTS[state.subject].presets.diagonal));
}
if (presetResetBtn) {
  presetResetBtn.addEventListener("click", () => applyCoords(SUBJECTS[state.subject].badStart));
}
if (trapOverBtn) {
  trapOverBtn.addEventListener("click", () => applyCoords(SUBJECTS[state.subject].presets.overcrop));
}
if (trapTrapBtn) {
  trapTrapBtn.addEventListener("click", () => applyCoords(SUBJECTS[state.subject].presets.trapped));
}

if (rngCx) {
  rngCx.addEventListener("input", () => {
    state.cx = Number(rngCx.value);
    syncUI();
    stage.draw();
  });
}
if (rngCy) {
  rngCy.addEventListener("input", () => {
    state.cy = Number(rngCy.value);
    syncUI();
    stage.draw();
  });
}
if (rngScale) {
  rngScale.addEventListener("input", () => {
    state.scale = Number(rngScale.value);
    syncUI();
    stage.draw();
  });
}

// 挂载 01–07 节全部独立交互
mountSection01();
mountSection02();
mountSection03();
mountSection04();
mountSection05();
mountSection06();
mountPosterLightbox();

// 首次同步并绘帧
syncUI();
stage.draw();
