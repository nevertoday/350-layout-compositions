// 089 静态构图 · 主入口：绑定开场石碑立面单真源状态与 01–07 全部交互

import { loop } from "../../lib/stage.js";
import { clamp, createInitialState, evaluate, LIMITS, PRESETS, SCENES } from "./model.js";
import { createPlinthStage } from "./plinth.js";
import {
  initAnatomyDeck,
  initBalanceScale,
  initContextSwitch,
  initHistoryTimeline,
  initOrientationLab,
  initPosterLightbox,
  initQuiz,
} from "./sections.js";

const state = createInitialState("monolith");

const heroCanvas = document.getElementById("hero-canvas");
const statusBadge = document.getElementById("hero-status-pill");
const sceneCaption = document.getElementById("hero-scene-caption");
const diagBox = document.getElementById("diag-box");
const diagTag = document.getElementById("diag-tag");
const diagCount = document.getElementById("diag-count");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");

// 单行建筑校正标尺坞控件
const tiltRange = document.getElementById("ctrl-tilt");
const tiltVal = document.getElementById("val-tilt");
const rhythmRange = document.getElementById("ctrl-rhythm");
const rhythmVal = document.getElementById("val-rhythm");
const floatRange = document.getElementById("ctrl-float");
const floatVal = document.getElementById("val-float");
const guidesBtn = document.getElementById("btn-guides");
const pulseBtn = document.getElementById("btn-pulse");
const fixBtn = document.getElementById("btn-fix");
const resetBtn = document.getElementById("btn-reset");

const sceneBtns = [...document.querySelectorAll("[data-scene-btn]")];
const presetBtns = [...document.querySelectorAll("[data-preset-btn]")];

// 底部原海报四柱圆徽探针读数节点
const probeEls = {
  stability: document.getElementById("probe-stability"),
  balance: document.getElementById("probe-balance"),
  rhythm: document.getElementById("probe-rhythm"),
  order: document.getElementById("probe-order"),
};

let stageCtrl = null;
let heroLoop = null;

function syncUI() {
  const ev = evaluate(state);
  const { metrics, checks, primary, passedCount } = ev;

  // 顶部状态章
  if (statusBadge) {
    statusBadge.textContent = ev.statusPill;
    statusBadge.dataset.state = passedCount === 4 ? "ok" : "bad";
  }

  // 语境切换说明
  const sc = SCENES[state.scene] || SCENES.monolith;
  if (sceneCaption) sceneCaption.textContent = sc.caption;
  sceneBtns.forEach((b) => {
    const on = b.dataset.sceneBtn === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 单真源诊单栏
  if (diagBox) diagBox.dataset.state = passedCount === 4 ? "ok" : "bad";
  if (diagTag) diagTag.textContent = ev.statusPill;
  if (diagCount) {
    diagCount.textContent =
      passedCount === 4
        ? `单真源实测 · 倾角 ${metrics.tiltDeg.toFixed(1)}° · 力矩示意 ${metrics.torquePct >= 0 ? "+" : ""}${Math.round(metrics.torquePct)}% · 柱距变异 ${Math.round(metrics.rhythmCvPct)}%`
        : `当前检出 ${4 - passedCount} 项失稳 · 倾角 ${metrics.tiltDeg >= 0 ? "+" : ""}${metrics.tiltDeg.toFixed(1)}° · 力矩示意 ${metrics.torquePct >= 0 ? "+" : ""}${Math.round(metrics.torquePct)}%`;
  }
  if (diagHeadline) diagHeadline.textContent = primary.headline;
  if (diagWhy) diagWhy.textContent = primary.why;
  if (diagAction) diagAction.textContent = primary.action;

  // 底部原海报四柱圆徽探针
  for (const key of Object.keys(probeEls)) {
    const el = probeEls[key];
    if (!el) continue;
    el.textContent = checks[key].badge;
    el.dataset.state = checks[key].ok ? "ok" : "bad";
  }

  // 同步标尺坞原生滑轨
  if (tiltRange) tiltRange.value = String(Math.round(state.tilt * 10));
  if (tiltVal) tiltVal.textContent = `${state.tilt >= 0 ? "+" : ""}${state.tilt.toFixed(1)}°`;

  if (rhythmRange) rhythmRange.value = String(Math.round(state.rhythmJitter * 100));
  if (rhythmVal) rhythmVal.textContent = `CV ${Math.round(metrics.rhythmCvPct)}%`;

  const avgFloat = (state.leftFloat + state.rightFloat + state.centerFloat) / 3;
  if (floatRange) floatRange.value = String(Math.round((avgFloat / LIMITS.float[1]) * 100));
  if (floatVal) floatVal.textContent = metrics.floatPct <= 2.5 ? "已坐实" : `+${Math.round(metrics.floatPct)}%`;

  if (guidesBtn) {
    guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    guidesBtn.textContent = state.showGuides ? "轴线标尺：开" : "轴线标尺：关";
  }
}

function applyPatch(patch) {
  Object.assign(state, patch);
  syncUI();
  if (heroLoop) heroLoop.draw();
}

function triggerPulse() {
  state.pulseT = performance.now() / 1000;
  syncUI();
  if (heroLoop) heroLoop.draw();
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  applyPatch({
    tilt: p.tilt,
    leftX: p.leftX,
    rightX: p.rightX,
    rightScale: p.rightScale,
    centerShift: p.centerShift,
    leftFloat: p.leftFloat,
    rightFloat: p.rightFloat,
    centerFloat: p.centerFloat,
    rhythmJitter: p.rhythmJitter,
  });
}

// 启动开场石碑画布
if (heroCanvas) {
  stageCtrl = createPlinthStage(heroCanvas, () => state, applyPatch);
  heroLoop = loop(heroCanvas, (t, dt, meta) => {
    stageCtrl.render(t, dt, meta);
  });
  window.addEventListener("resize", () => {
    if (heroLoop) heroLoop.draw();
  });
}

// 语境切换
sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const nextScene = b.dataset.sceneBtn;
    if (!SCENES[nextScene]) return;
    applyPatch({ scene: nextScene });
  });
});

// 多合法解 & 双向试错按钮
presetBtns.forEach((b) => {
  b.addEventListener("click", () => applyPreset(b.dataset.presetBtn));
});

// 标尺坞滑轨绑定
if (tiltRange) {
  tiltRange.addEventListener("input", () => {
    let val = Number(tiltRange.value) / 10;
    if (Math.abs(val) < 0.7) val = 0;
    applyPatch({ tilt: clamp(val, LIMITS.tilt[0], LIMITS.tilt[1]) });
  });
}
if (rhythmRange) {
  rhythmRange.addEventListener("input", () => {
    const v = Number(rhythmRange.value) / 100;
    applyPatch({ rhythmJitter: v < 0.05 ? 0 : clamp(v, 0, 1) });
  });
}
if (floatRange) {
  floatRange.addEventListener("input", () => {
    const ratio = Number(floatRange.value) / 100;
    const f = ratio < 0.04 ? 0 : ratio * LIMITS.float[1];
    applyPatch({ leftFloat: f, rightFloat: f, centerFloat: f });
  });
}

if (guidesBtn) {
  guidesBtn.addEventListener("click", () => applyPatch({ showGuides: !state.showGuides }));
}
if (pulseBtn) {
  pulseBtn.addEventListener("click", triggerPulse);
}
if (fixBtn) {
  fixBtn.addEventListener("click", () => {
    const sc = SCENES[state.scene] || SCENES.monolith;
    applyPreset(sc.defaultPreset || "classic");
  });
}
if (resetBtn) {
  resetBtn.addEventListener("click", () => applyPreset("openBad"));
}

// 键盘操作：方向键微调地基倾角与石块落座，Space 触发重力微震沉降测试
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || document.querySelector("dialog[open]")) return;
  if (e.code === "Space") {
    const heroRect = heroCanvas?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > 80 && heroRect.top < window.innerHeight - 60) {
      e.preventDefault();
      triggerPulse();
    }
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const heroRect = heroCanvas?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > 80 && heroRect.top < window.innerHeight - 60) {
      e.preventDefault();
      const step = e.shiftKey ? 3 : 1;
      let next = clamp(state.tilt + (e.key === "ArrowRight" ? step : -step), LIMITS.tilt[0], LIMITS.tilt[1]);
      if (Math.abs(next) < 0.6) next = 0;
      applyPatch({ tilt: Math.round(next * 10) / 10 });
    }
  } else if (e.key === "ArrowDown") {
    const heroRect = heroCanvas?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > 80 && heroRect.top < window.innerHeight - 60) {
      if (state.leftFloat > 0 || state.rightFloat > 0 || state.centerFloat > 0) {
        e.preventDefault();
        applyPatch({
          leftFloat: Math.max(0, state.leftFloat - 0.06),
          rightFloat: Math.max(0, state.rightFloat - 0.06),
          centerFloat: Math.max(0, state.centerFloat - 0.06),
        });
      }
    }
  }
});

// 初始化 UI 与 01–07 节全部交互
syncUI();
if (heroLoop) heroLoop.draw();
initOrientationLab();
initAnatomyDeck();
initBalanceScale();
initHistoryTimeline();
initContextSwitch();
initQuiz();
initPosterLightbox();
