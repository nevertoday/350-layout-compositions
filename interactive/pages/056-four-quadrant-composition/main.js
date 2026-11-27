// 056 四象限构图 — 页面总装配（单真源同步开场画布、2×2 探针、深松绿诊单与 01–07 节交互）
import { clonePreset, clamp } from "./model.js";
import { createHeroWorkbench } from "./hero.js";
import {
  initOriginTimeline,
  initBalanceSeesaw,
  initBindingLab,
  initUsecasePreview,
  initAntiPatterns,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

const state = clonePreset("broken", "poster");

// DOM 引用
const canvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const crossHub = document.getElementById("cross-hub");
const diagTag = document.getElementById("diag-score-tag");
const diagTier = document.getElementById("diag-tier");
const diagHeadline = document.getElementById("diag-headline");
const diagReason = document.getElementById("diag-reason");
const diagAction = document.getElementById("diag-action");
const mobileHeadline = document.getElementById("mobile-diag-headline");

const ctrlAx = document.getElementById("ctrl-ax");
const ctrlAy = document.getElementById("ctrl-ay");
const outAx = document.getElementById("out-ax");
const outAy = document.getElementById("out-ay");

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const echoBtns = [...document.querySelectorAll("[data-echo]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const calibrateBtns = [...document.querySelectorAll('[data-action="calibrate"]')];
const resetBtns = [...document.querySelectorAll('[data-action="reset"]')];
const guidesBtn = document.getElementById("btn-guides");
const cruiseBtn = document.getElementById("btn-cruise");
const cruiseMobileBtn = document.getElementById("btn-cruise-mobile");

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncUI(ev) {
  const okAll = ev.score === 4;
  const tagText = `${ev.score}/4 · ${ev.shortTag}`;

  setText(statusPill, tagText);
  statusPill.classList.toggle("is-ok", okAll);
  statusPill.classList.toggle("is-bad", !okAll);

  crossHub.classList.toggle("is-ok", okAll);

  setText(diagTag, tagText);
  diagTag.classList.toggle("is-ok", okAll);
  setText(diagTier, `结构档位：${ev.tensionTier}（示意）`);
  setText(diagHeadline, ev.headline);
  setText(diagReason, ev.reason);
  setText(diagAction, ev.action);
  setText(mobileHeadline, ev.headline);

  // 2×2 实时探针 + 原海报四枚彩圆徽章同步更新
  for (const p of ev.probes) {
    const cell = document.querySelector(`[data-probe="${p.id}"]`);
    const badge = document.getElementById(`probe-badge-${p.id}`);
    const pBadge = document.querySelector(`[data-pbadge="${p.id}"]`);
    if (cell) {
      cell.classList.toggle("is-pass", p.pass);
      cell.classList.toggle("is-fail", !p.pass);
    }
    setText(badge, p.badge);
    if (pBadge) pBadge.classList.toggle("is-pass", p.pass);
  }

  // 滑轨与呼应按钮与单真源状态保持一致
  const axPct = Math.round(state.ax * 100);
  const ayPct = Math.round(state.ay * 100);
  if (Number(ctrlAx.value) !== axPct) ctrlAx.value = String(axPct);
  if (Number(ctrlAy.value) !== ayPct) ctrlAy.value = String(ayPct);
  setText(outAx, `${axPct}%`);
  setText(outAy, `${ayPct}%`);

  echoBtns.forEach((btn) => {
    const active = btn.dataset.echo === state.echoMode;
    btn.classList.toggle("is-active", active);
    const s = String(active);
    if (btn.getAttribute("aria-pressed") !== s) btn.setAttribute("aria-pressed", s);
  });

  guidesBtn.classList.toggle("is-active", state.showGuides);
  const gs = String(state.showGuides);
  if (guidesBtn.getAttribute("aria-pressed") !== gs) guidesBtn.setAttribute("aria-pressed", gs);
  setText(guidesBtn, state.showGuides ? "重心标尺：开" : "重心标尺：关");
}

const workbench = createHeroWorkbench({
  canvas,
  state,
  onChange: syncUI,
});

function applyPreset(key) {
  const next = clonePreset(key, state.specimen);
  state.ax = next.ax;
  state.ay = next.ay;
  state.echoMode = next.echoMode;
  state.items = next.items;
  state.selectedId = 0;
  workbench.sync();
}

specimenBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    specimenBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    workbench.sync();
  });
});

ctrlAx.addEventListener("input", () => {
  state.ax = clamp(Number(ctrlAx.value) / 100, 0.25, 0.75);
  workbench.sync();
});
ctrlAy.addEventListener("input", () => {
  state.ay = clamp(Number(ctrlAy.value) / 100, 0.25, 0.75);
  workbench.sync();
});

echoBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.echoMode = btn.dataset.echo;
    workbench.sync();
  });
});

guidesBtn.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  workbench.sync();
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});

calibrateBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyPreset("poster"));
});

resetBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyPreset("broken"));
});

cruiseBtn.addEventListener("click", () => workbench.triggerCruise());
if (cruiseMobileBtn) cruiseMobileBtn.addEventListener("click", () => workbench.triggerCruise());

// 全局空格触发巡航（避免在表单/按钮获焦时冲突）
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement === document.body) {
    e.preventDefault();
    workbench.triggerCruise();
  }
});

// 初始化 01–07 节所有专属交互
initOriginTimeline();
initBalanceSeesaw();
initBindingLab();
initUsecasePreview();
initAntiPatterns();
initQuiz();
initPosterLightbox();
