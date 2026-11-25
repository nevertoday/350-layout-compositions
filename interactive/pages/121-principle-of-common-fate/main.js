// 121 共同命运原则 · 主入口：统筹开场编队指挥台、标题自示范动势与 01–07 节交互
import { loop, reducedMotion } from "../../lib/stage.js";
import { createInitialState, diagnose, PRESETS } from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";
import {
  initSec01Camouflage,
  initSec02Timing,
  initSec03Tug,
  initSec04UiDemo,
  initSec05BioMotion,
  initSec06ReducedCompare,
  initSec07QuizAndPoster,
} from "./sections.js";

let state = createInitialState();
let lastSyncKey = "";

const el = {
  heroCanvas: document.getElementById("hero-canvas"),
  heroChars: [...document.querySelectorAll(".hero-char")],
  topBadge: document.getElementById("hero-top-badge"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  pauseBtn: document.getElementById("ctrl-pause"),
  guidesBtn: document.getElementById("ctrl-guides"),
  // 四个原海报仪眉状态项
  dimMotion: document.getElementById("dim-motion"),
  dimMotionTag: document.getElementById("dim-motion-tag"),
  dimDirection: document.getElementById("dim-direction"),
  dimDirectionTag: document.getElementById("dim-direction-tag"),
  dimDirectionArrow: document.getElementById("dim-direction-arrow"),
  dimSync: document.getElementById("dim-sync"),
  dimSyncTag: document.getElementById("dim-sync-tag"),
  dimUnity: document.getElementById("dim-unity"),
  dimUnityTag: document.getElementById("dim-unity-tag"),
  // 底部深靛蓝指挥与诊单底座
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next"),
  metricSpread: document.getElementById("metric-spread"),
  metricSpeedRatio: document.getElementById("metric-speed-ratio"),
  metricShare: document.getElementById("metric-share"),
  metricTier: document.getElementById("metric-tier"),
  // 四枚滑杆与读数
  rngSpread: document.getElementById("rng-spread"),
  valSpread: document.getElementById("val-spread"),
  rngHeading: document.getElementById("rng-heading"),
  valHeading: document.getElementById("val-heading"),
  rngSpeedRatio: document.getElementById("rng-speed-ratio"),
  valSpeedRatio: document.getElementById("val-speed-ratio"),
  rngBgNoise: document.getElementById("rng-bg-noise"),
  valBgNoise: document.getElementById("val-bg-noise"),
  rngBaseSpeed: document.getElementById("rng-base-speed"),
  valBaseSpeed: document.getElementById("val-base-speed"),
  rngPhaseLag: document.getElementById("rng-phase-lag"),
  valPhaseLag: document.getElementById("val-phase-lag"),
};

let heroLoop = null;

function syncUI(diag) {
  // 仅当关键指标或模式变化时更新 DOM，避免 60fps 空刷 DOM 影响 perf
  const key = [
    state.scene,
    state.headingDeg,
    state.spreadDeg,
    state.baseSpeed,
    state.speedRatio,
    state.phaseLag,
    state.bgNoise,
    state.paused,
    state.showGuides,
    state.activePreset,
    diag.passed,
    diag.flockCount,
    diag.maxAngleSpan,
    diag.actualSpeedRatio,
    diag.noisyBgCount,
    diag.primary.code,
  ].join("|");
  if (key === lastSyncKey) return;
  lastSyncKey = key;

  // 1. 刊头「共同命运」四字自示范动势：合拍时齐整同倾，散队时各自偏斜
  el.heroChars.forEach((ch, idx) => {
    const spreadFrac = state.spreadDeg / 60;
    const baseTilt = diag.isValid ? Math.max(-6, Math.min(6, state.headingDeg * 0.14)) : 0;
    const scatterRot = diag.isValid ? 0 : (idx - 1.5) * 3.4 * spreadFrac;
    const arcY = diag.isValid ? -Math.sin((idx / 3) * Math.PI) * 3.5 : ((idx % 2 === 0 ? -1 : 1) * Math.min(4, spreadFrac * 3));
    ch.style.transform = `translateY(${arcY.toFixed(1)}px) rotate(${(baseTilt + scatterRot).toFixed(1)}deg)`;
    ch.dataset.aligned = String(diag.isValid);
  });

  // 2. 顶部印章
  if (el.topBadge) {
    el.topBadge.textContent = diag.isValid
      ? `4/4 · ${diag.unityTier}`
      : `${diag.passed}/4 · ${diag.issues[0]?.badge || "待校准"}`;
    el.topBadge.dataset.state = diag.isValid ? "ok" : "err";
  }

  // 3. 四枚原海报仪眉状态
  const applyDim = (box, tagEl, d) => {
    if (box) box.dataset.status = d.status;
    if (tagEl) tagEl.textContent = d.tag;
  };
  applyDim(el.dimMotion, el.dimMotionTag, diag.dims.motion);
  applyDim(el.dimDirection, el.dimDirectionTag, diag.dims.direction);
  applyDim(el.dimSync, el.dimSyncTag, diag.dims.sync);
  applyDim(el.dimUnity, el.dimUnityTag, diag.dims.unity);

  // 原海报深蓝 45° 斜箭仪眉跟着当前领航角实时旋转！
  if (el.dimDirectionArrow) {
    el.dimDirectionArrow.style.transform = `rotate(${Math.round(state.headingDeg)}deg)`;
  }

  // 4. 底部深靛蓝白话诊单
  if (el.diagCard) el.diagCard.dataset.state = diag.isValid ? "ok" : "err";
  if (el.diagBadge) el.diagBadge.textContent = diag.primary.badge;
  if (el.diagTitle) el.diagTitle.textContent = diag.primary.title;
  if (el.diagBody) el.diagBody.textContent = diag.primary.body;
  if (el.diagNext) el.diagNext.textContent = diag.primary.next;

  if (el.metricSpread) el.metricSpread.textContent = `${diag.maxAngleSpan}°`;
  if (el.metricSpeedRatio) el.metricSpeedRatio.textContent = `${diag.actualSpeedRatio.toFixed(1)}×`;
  if (el.metricShare) el.metricShare.textContent = `${diag.flockCount}/${diag.total} (${diag.flockShare}%)`;
  if (el.metricTier) el.metricTier.textContent = diag.unityTier;

  // 5. 同步控件值与按压态
  if (el.rngSpread) el.rngSpread.value = String(state.spreadDeg);
  if (el.valSpread) el.valSpread.textContent = `${state.spreadDeg}°`;
  if (el.rngHeading) el.rngHeading.value = String(state.headingDeg);
  if (el.valHeading) el.valHeading.textContent = `${state.headingDeg > 0 ? "+" : ""}${state.headingDeg}°`;
  if (el.rngSpeedRatio) el.rngSpeedRatio.value = String(state.speedRatio);
  if (el.valSpeedRatio) el.valSpeedRatio.textContent = `${state.speedRatio.toFixed(1)}×`;
  if (el.rngBgNoise) el.rngBgNoise.value = String(state.bgNoise);
  if (el.valBgNoise) el.valBgNoise.textContent = `${state.bgNoise}%`;
  if (el.rngBaseSpeed) el.rngBaseSpeed.value = String(state.baseSpeed);
  if (el.valBaseSpeed) el.valBaseSpeed.textContent = `${state.baseSpeed} px/s`;
  if (el.rngPhaseLag) el.rngPhaseLag.value = String(state.phaseLag);
  if (el.valPhaseLag) el.valPhaseLag.textContent = `${state.phaseLag}%`;

  el.sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scene === state.scene)));
  el.presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === state.activePreset)));

  if (el.pauseBtn) {
    el.pauseBtn.setAttribute("aria-pressed", String(state.paused));
    el.pauseBtn.textContent = state.paused ? "继续运动" : "暂停运动";
  }
  if (el.guidesBtn) {
    el.guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    el.guidesBtn.textContent = state.showGuides ? "轨迹引注：开" : "轨迹引注：关";
  }
}

function setState(updater) {
  state = typeof updater === "function" ? updater(state) : { ...state, ...updater };
  const diag = diagnose(state);
  syncUI(diag);
  // 正常 rAF 运行期间由下一帧自动重绘，避免触屏/鼠标拖动时与 rAF 叠加导致双倍重画
  if (heroLoop && (reducedMotion.matches || state.paused)) heroLoop.draw();
}

// 初始化开场主画布
if (el.heroCanvas) {
  const heroRenderer = createHeroCanvas(el.heroCanvas, {
    getState: () => state,
    setState,
    onFrameDiagnose: (diag) => syncUI(diag),
  });
  heroLoop = loop(el.heroCanvas, heroRenderer.render);
}

// 绑定题材切换
el.sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextScene = btn.dataset.scene;
    setState((prev) => ({ ...prev, scene: nextScene, activePreset: "custom" }));
  });
});

// 绑定多解与试错预设
el.presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState((prev) => ({ ...prev, ...p.patch() }));
  });
});

// 绑定暂停与轨迹开关
el.pauseBtn?.addEventListener("click", () => {
  setState((prev) => ({ ...prev, paused: !prev.paused }));
});
el.guidesBtn?.addEventListener("click", () => {
  setState((prev) => ({ ...prev, showGuides: !prev.showGuides }));
});

// 绑定滑杆
const bindRange = (input, key, parse = Number) => {
  if (!input) return;
  input.addEventListener("input", () => {
    setState((prev) => ({ ...prev, [key]: parse(input.value), activePreset: "custom" }));
  });
};
bindRange(el.rngSpread, "spreadDeg", (v) => Math.round(Number(v)));
bindRange(el.rngHeading, "headingDeg", (v) => Math.round(Number(v)));
bindRange(el.rngSpeedRatio, "speedRatio", (v) => +Number(v).toFixed(2));
bindRange(el.rngBgNoise, "bgNoise", (v) => Math.round(Number(v)));
bindRange(el.rngBaseSpeed, "baseSpeed", (v) => Math.round(Number(v)));
bindRange(el.rngPhaseLag, "phaseLag", (v) => Math.round(Number(v)));

// 初始同步一次界面
syncUI(diagnose(state));

// 初始化 01–07 节专属交互
initSec01Camouflage();
initSec02Timing();
initSec03Tug();
initSec04UiDemo();
initSec05BioMotion();
initSec06ReducedCompare();
initSec07QuizAndPoster();
