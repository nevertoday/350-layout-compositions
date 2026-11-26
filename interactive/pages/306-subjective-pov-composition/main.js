// 306 主观视角构图 · 主入口：连接单真源 model.js、开场画布、五枚圆标、关键要点与 01–07 节互动
import {
  FAIL_PRESETS,
  INITIAL_STATE,
  VALID_PRESETS,
  computeFrame,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import {
  initAvoidSection,
  initCoverageSection,
  initMasksSection,
  initMontageSection,
  initOriginSection,
  initPosterLightbox,
  initQuizSection,
} from "./sections.js";

const state = { ...INITIAL_STATE };
const $ = (sel) => document.querySelector(sel);

const heroCanvas = $("#pov-canvas");
const scorePill = $("#hero-score-pill");
const diagBadge = $("#diag-badge");
const diagTier = $("#diag-tier");
const diagTitle = $("#diag-title");
const diagWhy = $("#diag-why");
const diagAction = $("#diag-action");

// 四个滑轨与数值读出
const slDoor = $("#sl-door");
const outDoor = $("#out-door");
const slDetach = $("#sl-detach");
const outDetach = $("#out-detach");
const slHands = $("#sl-hands");
const outHands = $("#out-hands");
const slFocal = $("#sl-focal");
const outFocal = $("#out-focal");
const slYaw = $("#sl-yaw");
const outYaw = $("#out-yaw");

// 四个单真源实测小卡
const mPov = $("#m-pov");
const mFocus = $("#m-focus");
const mFrame = $("#m-frame");
const mAnchor = $("#m-anchor");

let heroApi = null;

function syncUI(geom) {
  const g = geom || computeFrame(state, 800, 560);
  const { diagnosis, metrics, rules, callouts, keyPoints } = g;

  // 顶部状态章
  scorePill.textContent = diagnosis.badge;
  scorePill.classList.toggle("is-ok", diagnosis.ok);

  // 白话诊单
  diagBadge.textContent = diagnosis.badge;
  diagBadge.classList.toggle("is-ok", diagnosis.ok);
  diagTier.textContent = diagnosis.tier;
  diagTitle.textContent = diagnosis.headline;
  diagWhy.textContent = diagnosis.why;
  diagAction.textContent = diagnosis.action;

  // 四格单真源实测值
  mPov.textContent = rules.pov.value;
  mPov.dataset.ok = String(rules.pov.ok);
  mFocus.textContent = rules.focus.value;
  mFocus.dataset.ok = String(rules.focus.ok);
  mFrame.textContent = rules.frame.value;
  mFrame.dataset.ok = String(rules.frame.ok);
  mAnchor.textContent = rules.anchor.value;
  mAnchor.dataset.ok = String(rules.anchor.ok);

  // 滑轨同步
  slDoor.value = String(metrics.doorOpen);
  outDoor.textContent = `${metrics.doorOpen}° · 框占 ${metrics.framePct}%`;
  slDetach.value = String(metrics.detachPct);
  outDetach.textContent = metrics.detachPct <= 4 ? "0%（已入眼）" : `退离 ${metrics.detachPct}%`;
  slHands.value = String(Math.round(state.handsHeight * 100));
  outHands.textContent =
    state.handsHeight < 0.05
      ? "无前景"
      : state.handsHeight > 0.68
        ? `${Math.round(state.handsHeight * 100)}%（过高）`
        : `${Math.round(state.handsHeight * 100)}%（托杯）`;
  slFocal.value = String(metrics.focalMm);
  outFocal.textContent = `${metrics.focalMm}mm · ${metrics.fovDeg}°`;
  slYaw.value = String(metrics.yaw);
  outYaw.textContent = `${metrics.yaw > 0 ? "+" : ""}${metrics.yaw}°`;

  // 场景签 & 情绪签高亮
  document.querySelectorAll("[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-mood]").forEach((b) => {
    const on = b.dataset.mood === state.mood;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 五枚原海报右侧圆徽探针（单真源同步！）
  for (const [key, info] of Object.entries(callouts)) {
    const card = document.querySelector(`[data-callout="${key}"]`);
    if (!card) continue;
    card.classList.toggle("is-ok", info.ok);
    card.classList.toggle("is-warn", !info.ok);
    card.classList.toggle("is-focused", state.focusLayer === key);
    const chip = card.querySelector(".callout-status");
    if (chip) chip.textContent = info.tag;
  }

  // 底部原海报五列「关键要点 KEY POINTS」实时状态同步
  for (const [key, info] of Object.entries(keyPoints)) {
    const col = document.querySelector(`[data-kp="${key}"]`);
    if (!col) continue;
    col.classList.toggle("is-ok", info.ok);
    const out = col.querySelector(".kp-live");
    if (out) out.textContent = info.badge;
  }
}

function updateState(patch) {
  Object.assign(state, patch);
  if (heroApi) heroApi.draw();
  syncUI(heroApi ? heroApi.getGeom() : null);
}

// 挂载开场 2D 透视推门画布
heroApi = mountHeroCanvas(
  heroCanvas,
  () => state,
  updateState,
  (geom) => {
    // 仅当关键指标变化时才更新 DOM（避免每帧无效 DOM Mutation 拖慢 perf）
    const sig = `${geom.score}|${geom.metrics.doorOpen}|${geom.metrics.yaw}|${geom.metrics.focalMm}|${geom.metrics.detachPct}|${geom.metrics.fgPct}|${geom.metrics.visPct}|${state.scene}|${state.mood}|${state.focusLayer}`;
    if (heroCanvas.dataset.lastSig !== sig) {
      heroCanvas.dataset.lastSig = sig;
      syncUI(geom);
    }
  },
);

// 顶部剧本切换
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ scene: btn.dataset.scene }));
});

// 呼吸/情绪状态切换
document.querySelectorAll("[data-mood]").forEach((btn) => {
  btn.addEventListener("click", () => updateState({ mood: btn.dataset.mood }));
});

// 滑轨事件
slDoor.addEventListener("input", () => updateState({ doorOpen: Number(slDoor.value) }));
slDetach.addEventListener("input", () => updateState({ eyeDetach: Number(slDetach.value) / 100 }));
slHands.addEventListener("input", () => updateState({ handsHeight: Number(slHands.value) / 100 }));
slFocal.addEventListener("input", () => updateState({ focalMm: Number(slFocal.value) }));
slYaw.addEventListener("input", () => updateState({ yaw: Number(slYaw.value) }));

// 一键入眼校准（原海报经典推门解）、眨眼揭示、复原开场破局态
$("#btn-fix-poster").addEventListener("click", () => updateState({ ...VALID_PRESETS.poster.patch, focusLayer: null }));
$("#btn-reset-bad").addEventListener("click", () => updateState({ ...INITIAL_STATE, scene: state.scene, focusLayer: null }));
const triggerBlinkAll = () => heroApi && heroApi.triggerBlink();
$("#btn-blink-top").addEventListener("click", triggerBlinkAll);
$("#btn-blink-dock").addEventListener("click", triggerBlinkAll);

// 多组合法解与反向试错按钮
document.querySelectorAll("[data-valid]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = VALID_PRESETS[btn.dataset.valid];
    if (preset) updateState({ ...preset.patch, focusLayer: null });
  });
});
document.querySelectorAll("[data-fail]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = FAIL_PRESETS[btn.dataset.fail];
    if (preset) updateState({ ...preset.patch, focusLayer: null });
  });
});

// 五枚原海报右侧圆徽点击：高亮对应光学结构层
document.querySelectorAll("[data-callout]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.callout;
    updateState({ focusLayer: state.focusLayer === key ? null : key });
  });
});

// 全局 Space 快捷触发「睁眼揭示」（不在输入框或按钮聚焦时抢键）
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName || "")) {
    const heroRect = heroCanvas.getBoundingClientRect();
    if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
      e.preventDefault();
      triggerBlinkAll();
    }
  }
});

// 初始同步并启动 01–07 节独立互动
syncUI(null);
initOriginSection($("#sec-origin"));
initCoverageSection($("#sec-coverage"));
initMontageSection($("#sec-montage"));
initMasksSection($("#sec-masks"));
initAvoidSection($("#sec-avoid"));
initQuizSection($("#sec-quiz"));
initPosterLightbox();
