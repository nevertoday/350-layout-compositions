// 138 满出血 版式 · 页面总入口（单真源同步 + 键盘控制 + 7 节互动挂载）
import { createState, evaluate, PRESETS, clamp } from "./model.js";
import { mountHeroCanvas } from "./heroCanvas.js";
import {
  mountCompareCurtain,
  mountPrepressLoupe,
  mountMediumInspector,
  mountHistoryStepper,
  mountBriefJudge,
  mountQuiz,
  mountLightbox,
} from "./sections.js";

const state = createState();

const $ = (id) => document.getElementById(id);
const heroCanvas = $("hero-canvas");

const ui = {
  heroBadge: $("hero-badge"),
  auditBadge: $("audit-badge"),
  auditPosture: $("audit-posture"),
  auditHead: $("audit-head"),
  auditWhy: $("audit-why"),
  auditHint: $("audit-hint"),
  btnCutTop: $("btn-cut-top"),
  btnCut: $("btn-cut"),
  btnQuickFix: $("btn-quick-fix"),
  btnGuides: $("btn-guides"),
  btnFix: $("btn-fix"),
  btnReset: $("btn-reset"),
  mBleed: $("m-bleed"),
  mSafe: $("m-safe"),
  mCrop: $("m-crop"),
  mSliver: $("m-sliver"),
  slBleed: $("sl-bleed"),
  slCrop: $("sl-crop"),
  slSafe: $("sl-safe"),
  valBleed: $("val-bleed"),
  valCrop: $("val-crop"),
  valSafe: $("val-safe"),
  specBtns: [...document.querySelectorAll("[data-specimen]")],
  tolBtns: [...document.querySelectorAll("[data-tol]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  probeItems: [...document.querySelectorAll("[data-probe]")],
};

let heroCtrl = null;

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setAttr(el, name, val) {
  if (el && el.getAttribute(name) !== val) el.setAttribute(name, val);
}

function syncAll(reason = "") {
  const ev = evaluate(state);

  // 状态章
  const okStr = String(ev.allOk);
  setText(ui.heroBadge, ev.badge);
  if (ui.heroBadge.dataset.ok !== okStr) ui.heroBadge.dataset.ok = okStr;
  setText(ui.auditBadge, ev.badge);
  if (ui.auditBadge.dataset.ok !== okStr) ui.auditBadge.dataset.ok = okStr;
  setText(ui.auditPosture, ev.posture);

  // 白话诊单
  setText(ui.auditHead, ev.headline);
  setText(ui.auditWhy, ev.why);
  setText(ui.auditHint, ev.actionHint);

  // 落刀按钮文案
  setText(ui.btnCut, state.trimmed ? "展开印张检视" : "落刀裁切");
  setText(ui.btnCutTop, state.trimmed ? "展开印张 · Space" : "落刀裁切 · Space");
  setText(ui.btnFix, ev.fixPreset ? ev.fixLabel : (state.trimmed ? "展开印张继续试错" : "落刀验真成品"));

  // 四格毫米读数（严格同源）
  setText(ui.mBleed, `${ev.bleedMm >= 0 ? "+" : ""}${ev.bleedMm.toFixed(1)}mm`);
  setText(ui.mSafe, `${ev.safeMm.toFixed(1)}mm`);
  setText(ui.mCrop, `${ev.actualCropPct}%`);
  setText(ui.mSliver, ev.sliverMm > 0 ? `${ev.sliverMm.toFixed(1)}mm` : "0.0mm");

  // 四项原海报关键词探针
  for (const p of ev.probes) {
    const li = ui.probeItems.find((el) => el.dataset.probe === p.key);
    const tag = $(`p-${p.key}`);
    const pOk = String(p.ok);
    if (li && li.dataset.ok !== pOk) li.dataset.ok = pOk;
    setText(tag, p.tag);
  }

  // 滑杆同步
  if (ui.slBleed.value !== String(state.bleedMm)) ui.slBleed.value = String(state.bleedMm);
  if (ui.slCrop.value !== String(state.cropPct)) ui.slCrop.value = String(state.cropPct);
  if (ui.slSafe.value !== String(state.safeMm)) ui.slSafe.value = String(state.safeMm);
  setText(ui.valBleed, `${ev.bleedMm >= 0 ? "+" : ""}${ev.bleedMm.toFixed(1)} mm`);
  setText(ui.valCrop, `${ev.actualCropPct}%`);
  setText(ui.valSafe, `${ev.safeMm.toFixed(1)} mm`);

  // 按钮按压态
  setAttr(ui.btnGuides, "aria-pressed", String(state.showGuides));
  setText(ui.btnGuides, state.showGuides ? "参考线：开" : "参考线：关");
  ui.specBtns.forEach((b) => setAttr(b, "aria-pressed", String(b.dataset.specimen === state.specimen)));
  ui.tolBtns.forEach((b) => setAttr(b, "aria-pressed", String(Math.abs(Number(b.dataset.tol) - state.bladeTol) < 0.05)));

  if (heroCtrl) {
    if (reason === "cut") heroCtrl.triggerCut();
    else if (reason !== "drag") heroCtrl.draw();
  }
}

function toggleCut() {
  state.trimmed = !state.trimmed;
  syncAll("cut");
}

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  state.bleedMm = p.bleedMm;
  state.cropPct = p.cropPct;
  state.safeMm = p.safeMm;
  if (p.bladeTol != null) state.bladeTol = p.bladeTol;
  if (key === "resetBroken") state.trimmed = false;
  syncAll("preset");
}

// 挂载开场印前裁纸画布
heroCtrl = mountHeroCanvas(heroCanvas, state, (reason) => syncAll(reason));

// 控件事件
ui.btnCut.addEventListener("click", toggleCut);
ui.btnCutTop.addEventListener("click", toggleCut);
ui.btnQuickFix.addEventListener("click", () => applyPreset("classic"));
ui.btnReset.addEventListener("click", () => applyPreset("resetBroken"));

ui.btnFix.addEventListener("click", () => {
  const ev = evaluate(state);
  if (ev.fixPreset) {
    applyPreset(ev.fixPreset);
  } else {
    toggleCut();
  }
});

ui.btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncAll("guides");
});

ui.specBtns.forEach((b) => b.addEventListener("click", () => {
  state.specimen = b.dataset.specimen;
  syncAll("specimen");
}));

ui.tolBtns.forEach((b) => b.addEventListener("click", () => {
  state.bladeTol = Number(b.dataset.tol);
  syncAll("tol");
}));

ui.presetBtns.forEach((b) => b.addEventListener("click", () => applyPreset(b.dataset.preset)));

ui.slBleed.addEventListener("input", () => {
  state.bleedMm = Number(ui.slBleed.value);
  syncAll("slider");
});
ui.slCrop.addEventListener("input", () => {
  state.cropPct = Number(ui.slCrop.value);
  syncAll("slider");
});
ui.slSafe.addEventListener("input", () => {
  state.safeMm = Number(ui.slSafe.value);
  syncAll("slider");
});

// 键盘操作（不抢输入框焦点，支持方向键微调与空格落刀）
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = $("lightbox");
  if (lb && !lb.hidden) return;

  if (e.code === "Space") {
    e.preventDefault();
    toggleCut();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.bleedMm = Math.round(clamp(state.bleedMm + 0.5, -14, 10) * 10) / 10;
    syncAll("key");
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.bleedMm = Math.round(clamp(state.bleedMm - 0.5, -14, 10) * 10) / 10;
    syncAll("key");
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.safeMm = Math.round(clamp(state.safeMm + 0.5, -1, 24) * 10) / 10;
    syncAll("key");
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.safeMm = Math.round(clamp(state.safeMm - 0.5, -1, 24) * 10) / 10;
    syncAll("key");
  } else if (e.key === "]") {
    state.cropPct = Math.round(clamp(state.cropPct + 2, 0, 66));
    syncAll("key");
  } else if (e.key === "[") {
    state.cropPct = Math.round(clamp(state.cropPct - 2, 0, 66));
    syncAll("key");
  }
});

// 首次同步
syncAll("init");

// 挂载正文 01–07 全部互动模块
mountCompareCurtain(document.getElementById("sec-01"));
mountPrepressLoupe(document.getElementById("sec-02"));
mountMediumInspector(document.getElementById("sec-03"));
mountHistoryStepper(document.getElementById("sec-04"));
mountBriefJudge(document.getElementById("sec-05"));
mountQuiz(document.getElementById("sec-06"));
mountLightbox();
