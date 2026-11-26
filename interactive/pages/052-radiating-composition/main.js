// 052 放射式构图 — 主控装配脚本
import {
  FAIL_CASES,
  RAY_COUNT,
  SOLUTIONS,
  clamp,
  createInitialState,
  evaluate,
} from "./model.js";
import { mountHeroStage } from "./hero.js";
import {
  mountAvoidDemo,
  mountGlareDemo,
  mountOriginDemo,
  mountPolarityDemo,
  mountQuizDemo,
  mountXrayDemo,
} from "./sections.js";

const state = createInitialState();

// DOM 引用（与单真源 evaluate(state) 严格联动）
const dom = {
  heroCanvas: document.getElementById("heroCanvas"),
  statusPill: document.getElementById("heroStatusPill"),
  specBtns: [...document.querySelectorAll("[data-specimen]")],
  pulseBtn: document.getElementById("pulseBtn"),
  calibrateBtn: document.getElementById("calibrateBtn"),
  resetBtn: document.getElementById("resetBtn"),
  mobilePulseBtn: document.getElementById("mobilePulseBtn"),
  mobileCalibrateBtn: document.getElementById("mobileCalibrateBtn"),

  // 薄金胶囊诊单
  diagBadge: document.getElementById("diagBadge"),
  diagHeadline: document.getElementById("diagHeadline"),
  diagWhy: document.getElementById("diagWhy"),
  diagFix: document.getElementById("diagFix"),
  diagEmblem: document.getElementById("diagEmblem"),

  // 移动端折线内快览条
  mobileRhythmSlider: document.getElementById("mobileRhythmSlider"),
  mobileRhythmVal: document.getElementById("mobileRhythmVal"),
  mobileDiagHead: document.getElementById("mobileDiagHead"),

  // 四轨精控滑块
  slRhythm: document.getElementById("slRhythm"),
  valRhythm: document.getElementById("valRhythm"),
  slCore: document.getElementById("slCore"),
  valCore: document.getElementById("valCore"),
  slReach: document.getElementById("slReach"),
  valReach: document.getElementById("valReach"),
  slConv: document.getElementById("slConv"),
  valConv: document.getElementById("valConv"),

  // 合法多解与试错按钮
  solBtns: [...document.querySelectorAll("[data-solution]")],
  failBtns: [...document.querySelectorAll("[data-fail]")],

  // 五要点环绕探针
  ptFocus: document.getElementById("ptTagFocus"),
  ptExpand: document.getElementById("ptTagExpand"),
  ptDir: document.getElementById("ptTagDir"),
  ptEnergy: document.getElementById("ptTagEnergy"),
  ptRhythm: document.getElementById("ptTagRhythm"),
  calloutEls: [...document.querySelectorAll("[data-callout-dim]")],

  // 底沿四栏原海报金标读数
  ftExpand: document.getElementById("ftValExpand"),
  ftEnergy: document.getElementById("ftValEnergy"),
  ftFocus: document.getElementById("ftValFocus"),
  ftDir: document.getElementById("ftValDir"),
};

let lastDomKey = "";

function setTag(el, text, ok) {
  if (!el) return;
  if (el.textContent !== text) el.textContent = text;
  const tone = ok ? "ok" : "err";
  if (el.dataset.tone !== tone) el.dataset.tone = tone;
}

function syncUI(ev) {
  // 高频拖动时用轻量键去重，避免无效 DOM 写入拖慢 perf
  const key = [
    state.specimen,
    ev.score,
    ev.diag.badge,
    ev.rhythmRatio,
    ev.corePct,
    ev.reachPct,
    ev.scatterPct,
    ev.activeCount,
    state.splitHub,
    Math.round(state.rhythm * 100),
    Math.round(state.convergence * 100),
  ].join("|");
  if (key === lastDomKey) return;
  lastDomKey = key;

  const tone = ev.score === 4 ? "ok" : "err";
  if (dom.statusPill) {
    dom.statusPill.textContent = ev.diag.badge;
    dom.statusPill.dataset.tone = tone;
  }
  if (dom.diagBadge) {
    dom.diagBadge.textContent = ev.diag.badge;
    dom.diagBadge.dataset.tone = tone;
  }
  if (dom.diagHeadline) dom.diagHeadline.textContent = ev.diag.headline;
  if (dom.diagWhy) dom.diagWhy.textContent = ev.diag.why;
  if (dom.diagFix) dom.diagFix.textContent = ev.diag.fix;
  if (dom.diagEmblem) dom.diagEmblem.dataset.tone = tone;

  if (dom.mobileDiagHead) dom.mobileDiagHead.textContent = ev.diag.headline;

  // 同步滑轨读数（均源自同一份 state 与 ev）
  const rhythmPct = Math.round(state.rhythm * 100);
  if (dom.slRhythm) dom.slRhythm.value = String(rhythmPct);
  if (dom.valRhythm) dom.valRhythm.textContent = `${ev.rhythmRatio.toFixed(2)}×`;
  if (dom.mobileRhythmSlider) dom.mobileRhythmSlider.value = String(rhythmPct);
  if (dom.mobileRhythmVal) dom.mobileRhythmVal.textContent = `${ev.rhythmRatio.toFixed(2)}×`;

  if (dom.slCore) dom.slCore.value = String(ev.corePct);
  if (dom.valCore) dom.valCore.textContent = `${ev.corePct}%`;

  if (dom.slReach) dom.slReach.value = String(Math.round(state.reach * 100));
  if (dom.valReach) dom.valReach.textContent = `${ev.reachPct}%`;

  const convPct = Math.round(state.convergence * 100);
  if (dom.slConv) dom.slConv.value = String(convPct);
  if (dom.valConv) dom.valConv.textContent = state.splitHub ? "双核撕裂" : `偏散 ${ev.scatterPct}%`;

  // 同步原海报五条环绕要点实时状态
  setTag(dom.ptFocus, ev.fivePoints.focus.tag, ev.fivePoints.focus.ok);
  setTag(dom.ptExpand, ev.fivePoints.expand.tag, ev.fivePoints.expand.ok);
  setTag(dom.ptDir, ev.fivePoints.direction.tag, ev.fivePoints.direction.ok);
  setTag(dom.ptEnergy, ev.fivePoints.energy.tag, ev.fivePoints.energy.ok);
  setTag(dom.ptRhythm, ev.fivePoints.rhythm.tag, ev.fivePoints.rhythm.ok);

  // 同步原海报底沿四枚金标读数
  setTag(dom.ftExpand, ev.fourFooter.expansion.val, ev.fourFooter.expansion.ok);
  setTag(dom.ftEnergy, ev.fourFooter.energy.val, ev.fourFooter.energy.ok);
  setTag(dom.ftFocus, ev.fourFooter.focus.val, ev.fourFooter.focus.ok);
  setTag(dom.ftDir, ev.fourFooter.direction.val, ev.fourFooter.direction.ok);

  // 标本按钮激活态
  dom.specBtns.forEach((btn) => {
    const active = btn.dataset.specimen === state.specimen;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function updateState(patch) {
  Object.assign(state, patch);
  const ev = evaluate(state);
  syncUI(ev);
  if (heroApi) heroApi.draw();
}

const heroApi = mountHeroStage({
  canvas: dom.heroCanvas,
  getState: () => state,
  updateState,
  onFrameEval: syncUI,
});

// 初次同步确保所有文字与画布同源
syncUI(evaluate(state));

// ---------- 控件绑定 ----------
dom.specBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ specimen: btn.dataset.specimen });
  });
});

const bindSlider = (el, fn) => {
  if (!el) return;
  el.addEventListener("input", () => fn(Number(el.value)));
};

bindSlider(dom.slRhythm, (v) => updateState({ rhythm: clamp(v / 100, 0, 1) }));
bindSlider(dom.mobileRhythmSlider, (v) => updateState({ rhythm: clamp(v / 100, 0, 1) }));
bindSlider(dom.slCore, (v) => updateState({ coreRadius: clamp(v / 100, 0.03, 0.56) }));
bindSlider(dom.slReach, (v) => updateState({ reach: clamp(v / 100, 0.36, 1.12) }));
bindSlider(dom.slConv, (v) => updateState({ convergence: clamp(v / 100, 0.3, 1), splitHub: false }));

const applyClassic = () => {
  updateState({
    ...SOLUTIONS.classic.patch,
    specimen: state.specimen,
    overrides: new Array(RAY_COUNT).fill(null),
  });
  heroApi.triggerPulse();
};

const resetBroken = () => {
  const init = createInitialState();
  init.specimen = state.specimen;
  updateState(init);
};

if (dom.calibrateBtn) dom.calibrateBtn.addEventListener("click", applyClassic);
if (dom.mobileCalibrateBtn) dom.mobileCalibrateBtn.addEventListener("click", applyClassic);
if (dom.resetBtn) dom.resetBtn.addEventListener("click", resetBroken);
if (dom.pulseBtn) dom.pulseBtn.addEventListener("click", () => heroApi.triggerPulse());
if (dom.mobilePulseBtn) dom.mobilePulseBtn.addEventListener("click", () => heroApi.triggerPulse());

dom.solBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sol = SOLUTIONS[btn.dataset.solution];
    if (!sol) return;
    updateState({ ...sol.patch, overrides: new Array(RAY_COUNT).fill(null) });
    heroApi.triggerPulse();
  });
});

dom.failBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const fc = FAIL_CASES[btn.dataset.fail];
    if (!fc) return;
    updateState({ ...fc.patch, overrides: new Array(RAY_COUNT).fill(null) });
  });
});

// 悬停/点击原海报五要点探针高亮画布对应维度
dom.calloutEls.forEach((el) => {
  const dim = el.dataset.calloutDim;
  el.addEventListener("mouseenter", () => heroApi.setHighlight(dim));
  el.addEventListener("mouseleave", () => heroApi.setHighlight(null));
  el.addEventListener("focus", () => heroApi.setHighlight(dim));
  el.addEventListener("blur", () => heroApi.setHighlight(null));
});

// 全局空格键（焦点不在输入控件内且灯箱未打开时）触发脉冲波
window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  const tag = document.activeElement?.tagName;
  const lb = document.getElementById("posterLightbox");
  if (lb && !lb.hidden) return;
  if (tag === "INPUT" || tag === "BUTTON" || tag === "A" || tag === "CANVAS") return;
  // 仅当开场画布大致在首屏内时响应空格，避免影响页面翻页
  const rect = dom.heroCanvas.getBoundingClientRect();
  if (rect.bottom > 100 && rect.top < window.innerHeight) {
    e.preventDefault();
    heroApi.triggerPulse();
  }
});

// ---------- 原海报点击放大 / 拖拽 / Esc 关闭灯箱 ----------
function mountPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("posterZoomBtn");
  const modal = document.getElementById("posterLightbox");
  const fullImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");
  const zoomToggle = document.getElementById("lightboxZoomToggle");
  if (!thumb || !modal || !fullImg) return;

  let zoomed = false;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    fullImg.style.transform = zoomed
      ? `translate(${tx}px, ${ty}px) scale(2)`
      : "translate(0px, 0px) scale(1)";
    fullImg.style.cursor = zoomed ? "grab" : "zoom-in";
    if (zoomToggle) zoomToggle.textContent = zoomed ? "还原 1×" : "放大 2×";
  }

  function open() {
    if (!fullImg.src) fullImg.src = thumb.currentSrc || thumb.src;
    zoomed = false;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  thumb.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  zoomToggle?.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  });

  fullImg.addEventListener("pointerdown", (e) => {
    if (!zoomed) {
      zoomed = true;
      tx = 0;
      ty = 0;
      applyTransform();
      return;
    }
    e.preventDefault();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, tx0: tx, ty0: ty };
    fullImg.style.cursor = "grabbing";
    try { fullImg.setPointerCapture(e.pointerId); } catch {}
  });
  fullImg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = clamp(drag.tx0 + (e.clientX - drag.x), -480, 480);
    ty = clamp(drag.ty0 + (e.clientY - drag.y), -620, 620);
    applyTransform();
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    applyTransform();
  };
  fullImg.addEventListener("pointerup", endDrag);
  fullImg.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

// 装配正文各节互动
mountPolarityDemo();
mountGlareDemo();
mountOriginDemo();
mountXrayDemo();
mountAvoidDemo();
mountQuizDemo();
mountPosterLightbox();
