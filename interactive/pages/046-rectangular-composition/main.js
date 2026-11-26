// 046 矩形构图 — 主入口：单真源状态联动开场舞台、四柱监控、诊单、精控与 01–07 节组件

import { loop } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, clamp, normalizeState } from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./widgets.js";

let state = normalizeState(INITIAL_STATE);

const heroCanvas = document.getElementById("hero-canvas");
const miniSvg = document.getElementById("mini-emblem");
const posterImg = document.getElementById("poster");

// DOM 引用
const statusStamp = document.getElementById("hero-status-stamp");
const diagCard = document.querySelector(".diag-card");
const diagPill = document.getElementById("diag-pill");
const diagHeadline = document.getElementById("diag-headline");
const diagReason = document.getElementById("diag-reason");
const diagHint = document.getElementById("diag-hint");
const btnFixStep = document.getElementById("btn-fix-step");

const mAspect = document.getElementById("m-aspect");
const mZoning = document.getElementById("m-zoning");
const mGutter = document.getElementById("m-gutter");
const mStatus = document.getElementById("m-status");

const ctrlAspect = document.getElementById("ctrl-aspect");
const outAspect = document.getElementById("out-aspect");
const ctrlX1 = document.getElementById("ctrl-x1");
const outX1 = document.getElementById("out-x1");
const lblX1 = document.getElementById("lbl-x1");
const ctrlGutter = document.getElementById("ctrl-gutter");
const outGutter = document.getElementById("out-gutter");

const btnBorder = document.getElementById("btn-border");
const btnFlow = document.getElementById("btn-flow");
const btnGuides = document.getElementById("btn-guides");
const btnPulse = document.getElementById("btn-pulse");
const btnReset = document.getElementById("btn-reset");
const specimenTabs = document.getElementById("specimen-tabs");

let lastEval = null;
let lastUiKey = "";
let heroLoop = null;

function syncUI(ev) {
  if (!ev) return;
  lastEval = ev;
  const { state: s, vertical } = ev.layout;
  const { diagnosis, pillars, metrics, passCount } = ev;
  const uiKey = JSON.stringify([s.specimen, s.aspect, s.x1, s.x2, s.y1, s.gutter, s.borderOn, s.flowDir, s.showGuides, passCount, diagnosis.badge]);
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;

  // 顶部状态印章
  statusStamp.textContent = diagnosis.badge;
  statusStamp.classList.toggle("is-ok", passCount === 4);
  statusStamp.classList.toggle("is-bad", passCount < 4);

  // 四柱活体监控带
  for (const p of pillars) {
    const cell = document.querySelector(`[data-pillar="${p.id}"]`);
    const tag = document.querySelector(`[data-pillar-tag="${p.id}"]`);
    if (cell) cell.classList.toggle("is-ok", p.ok);
    if (tag) tag.textContent = p.tag;
  }

  // 诊单匣
  diagCard.classList.toggle("is-ok", diagnosis.ok);
  diagPill.textContent = diagnosis.badge;
  diagHeadline.textContent = diagnosis.headline;
  diagReason.textContent = diagnosis.reason;
  diagHint.textContent = diagnosis.fixHint;
  btnFixStep.textContent = diagnosis.fixLabel;

  // 四格实测指标
  mAspect.textContent = metrics.aspectText;
  mZoning.textContent = `${metrics.sceneSharePct}% · ${metrics.domRatioText}`;
  mGutter.textContent = `${metrics.gutterText} · ${metrics.breathingPct}%`;
  mStatus.textContent = diagnosis.statusLevel;

  // 同步滑轨与按钮
  ctrlAspect.value = s.aspect.toFixed(2);
  outAspect.textContent = metrics.aspectText;

  const x1Max = vertical ? 0.76 : +(s.x2 - 0.14).toFixed(3);
  ctrlX1.min = vertical ? "0.26" : "0.14";
  ctrlX1.max = String(x1Max);
  ctrlX1.value = s.x1.toFixed(3);
  lblX1.textContent = vertical ? "中排焦支刃" : "主隔断刃";
  outX1.textContent = `${Math.round(s.x1 * 100)}%`;

  ctrlGutter.value = String(s.gutter);
  outGutter.textContent = metrics.gutterText;

  btnBorder.textContent = s.borderOn ? "外框边界：开" : "外框边界：关";
  btnBorder.classList.toggle("is-on", s.borderOn);
  btnBorder.classList.toggle("is-bad-toggle", !s.borderOn);
  btnBorder.setAttribute("aria-pressed", String(s.borderOn));

  const isFwd = s.flowDir === "forward";
  btnFlow.textContent = isFwd ? "叙事动线：顺流" : "叙事动线：逆流";
  btnFlow.classList.toggle("is-on", isFwd);
  btnFlow.classList.toggle("is-bad-toggle", !isFwd);
  btnFlow.setAttribute("aria-pressed", String(isFwd));

  btnGuides.textContent = s.showGuides ? "阅读序点：开" : "阅读序点：关";
  btnGuides.classList.toggle("is-on", s.showGuides);
  btnGuides.setAttribute("aria-pressed", String(s.showGuides));

  specimenTabs.querySelectorAll("[data-specimen]").forEach((b) => {
    const on = b.dataset.specimen === s.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

function setState(patch) {
  state = normalizeState({ ...state, ...patch });
  hero.markDirty();
  if (heroLoop) heroLoop.draw();
}

const hero = createHeroCanvas(
  heroCanvas,
  miniSvg,
  () => state,
  (patch) => setState(patch),
  () => posterImg
);

heroLoop = loop(heroCanvas, (t, dt, opts) => {
  const ev = hero.draw(t, dt, opts);
  syncUI(ev);
});

// 立即绘制一帧，确保首屏静态截图与 reducedMotion 下完整清晰
syncUI(hero.draw(0, 0, { still: true }));

// 控件事件绑定
ctrlAspect.addEventListener("input", () => setState({ aspect: Number(ctrlAspect.value) }));
ctrlX1.addEventListener("input", () => setState({ x1: Number(ctrlX1.value) }));
ctrlGutter.addEventListener("input", () => setState({ gutter: Number(ctrlGutter.value) }));

btnBorder.addEventListener("click", () => setState({ borderOn: !state.borderOn }));
btnFlow.addEventListener("click", () => setState({ flowDir: state.flowDir === "forward" ? "reversed" : "forward" }));
btnGuides.addEventListener("click", () => setState({ showGuides: !state.showGuides }));
btnPulse.addEventListener("click", () => {
  const next = !hero.isPulsing();
  hero.setPulse(next);
  btnPulse.classList.toggle("is-on", next);
  btnPulse.setAttribute("aria-pressed", String(next));
  btnPulse.textContent = next ? "停止演播视线" : "演播视线流";
  if (next && !state.showGuides) setState({ showGuides: true });
  else heroLoop.draw();
});

btnFixStep.addEventListener("click", () => {
  if (lastEval && lastEval.diagnosis.fixPatch) {
    setState(lastEval.diagnosis.fixPatch);
  }
});

btnReset.addEventListener("click", () => {
  hero.setPulse(false);
  btnPulse.classList.remove("is-on");
  btnPulse.setAttribute("aria-pressed", "false");
  btnPulse.textContent = "演播视线流";
  setState({ ...INITIAL_STATE, specimen: state.specimen });
});

specimenTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-specimen]");
  if (!btn) return;
  setState({ specimen: btn.dataset.specimen });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState(p.patch);
  });
});

// 画布键盘操控
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ x1: +(state.x1 - 0.025).toFixed(3) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ x1: +(state.x1 + 0.025).toFixed(3) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setState({ aspect: +(clamp(state.aspect + 0.08, 0.50, 2.88)).toFixed(2) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setState({ aspect: +(clamp(state.aspect - 0.08, 0.50, 2.88)).toFixed(2) });
  } else if (e.key === " ") {
    e.preventDefault();
    btnPulse.click();
  } else if (e.key === "r" || e.key === "R") {
    btnReset.click();
  }
});

// 初始化 01–07 节组件
const redrawW1 = initSection01(() => posterImg);
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();

// 当原海报解码完成后立即重绘开场画布和 01 节实景裁窗
if (posterImg) {
  const onPosterReady = () => {
    hero.markDirty();
    heroLoop.draw();
    redrawW1();
  };
  if (posterImg.complete && posterImg.naturalWidth > 0) onPosterReady();
  else posterImg.addEventListener("load", onPosterReady, { once: true });
}

window.addEventListener("resize", () => {
  hero.markDirty();
  heroLoop.draw();
  redrawW1();
});
