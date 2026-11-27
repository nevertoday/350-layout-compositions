// 099 尺度对比（SCALE CONTRAST）入口控制器
import { mountHeroCanvas } from "./canvas-hero.js";
import { clamp, evaluate, FAILURES, INITIAL_STATE, SCENES, SOLUTIONS } from "./model.js";
import { initAllSections } from "./sections.js";

const state = {
  ...INITIAL_STATE,
  midClutter: [...INITIAL_STATE.midClutter],
};

const heroCanvas = document.getElementById("hero-canvas");
const statusPills = [...document.querySelectorAll("[data-status-pill]")];
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const sceneCaption = document.getElementById("hero-caption");

// 操轨与单真源诊断 DOM
const macroSlider = document.getElementById("ctrl-macro");
const microSlider = document.getElementById("ctrl-micro");
const gapSlider = document.getElementById("ctrl-gap");
const macroVal = document.getElementById("val-macro");
const microVal = document.getElementById("val-micro");
const gapVal = document.getElementById("val-gap");
const quickMacro = document.getElementById("quick-macro");
const quickMacroVal = document.getElementById("quick-macro-val");

const refToggleBtn = document.getElementById("btn-toggle-ref");
const clutterBtn = document.getElementById("btn-toggle-clutter");
const horizonBtn = document.getElementById("btn-toggle-horizon");
const verifyBtns = [...document.querySelectorAll("[data-action='verify']")];
const calibrateBtns = [...document.querySelectorAll("[data-action='calibrate']")];
const resetBtns = [...document.querySelectorAll("[data-action='reset']")];

const diagTier = document.getElementById("diag-tier");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagHint = document.getElementById("diag-hint");
const diagCard = document.getElementById("diag-card");
const mobileHeadline = document.getElementById("mobile-diag-headline");
const mobileHint = document.getElementById("mobile-diag-hint");

// 原海报右侧五枚实时探针
const pillarEls = {
  size: document.querySelector("[data-pillar='size']"),
  hierarchy: document.querySelector("[data-pillar='hierarchy']"),
  impact: document.querySelector("[data-pillar='impact']"),
  levels: document.querySelector("[data-pillar='levels']"),
  depth: document.querySelector("[data-pillar='depth']"),
};

// 自示范刊头大字副标实时标尺
const mastScaleReadout = document.getElementById("mast-scale-readout");

const stage = mountHeroCanvas(
  heroCanvas,
  () => state,
  (patch) => {
    Object.assign(state, patch);
    syncUI();
  }
);

function syncUI() {
  const { W, H } = stage.getSize();
  const audit = evaluate(state, W, H);
  const sceneMeta = SCENES[state.scene] || SCENES.poster;

  // 状态胶囊
  statusPills.forEach((el) => {
    el.textContent = audit.badge;
    el.classList.toggle("is-pass", audit.passed);
    el.classList.toggle("is-fail", !audit.passed);
  });

  // 场景按钮与画布注脚
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (sceneCaption) sceneCaption.textContent = sceneMeta.caption;

  // 滑轨数值同步
  const mPct = Math.round(state.macroScale * 100);
  const sPct = +(state.microScale * 100).toFixed(1);
  const gPct = Math.round(state.gapOffset * 100);
  if (macroSlider) macroSlider.value = String(mPct);
  if (quickMacro) quickMacro.value = String(mPct);
  if (microSlider) microSlider.value = String(Math.round(state.microScale * 1000));
  if (gapSlider) gapSlider.value = String(gPct);
  if (macroVal) macroVal.textContent = `${mPct}%`;
  if (quickMacroVal) quickMacroVal.textContent = `${mPct}%`;
  if (microVal) microVal.textContent = state.refVisible ? `${sPct}%` : "已撤除";
  if (gapVal) gapVal.textContent = `${gPct >= 0 ? "+" : ""}${gPct}%`;

  // 三个开关按钮（反映真实状态）
  if (refToggleBtn) {
    refToggleBtn.textContent = state.refVisible ? `尺标${sceneMeta.microName}：开` : `恢复${sceneMeta.microName}`;
    refToggleBtn.classList.toggle("is-warn", !state.refVisible);
    refToggleBtn.setAttribute("aria-pressed", String(state.refVisible));
  }
  const activeMids = state.midClutter.filter(Boolean).length;
  if (clutterBtn) {
    clutterBtn.textContent = activeMids > 0 ? `撤除中号干扰 (${activeMids})` : "中号干扰：已清";
    clutterBtn.classList.toggle("is-warn", activeMids > 0);
    clutterBtn.setAttribute("aria-pressed", String(activeMids === 0));
  }
  if (horizonBtn) {
    horizonBtn.textContent = state.horizonOn ? "暗丘光池：开" : "暗丘光池：关";
    horizonBtn.classList.toggle("is-warn", !state.horizonOn);
    horizonBtn.setAttribute("aria-pressed", String(state.horizonOn));
  }

  // 单真源诊断卡 + 手机首屏简诊
  if (diagTier) diagTier.textContent = audit.tier;
  if (diagHeadline) diagHeadline.textContent = audit.headline;
  if (diagWhy) diagWhy.textContent = audit.why;
  if (diagHint) diagHint.textContent = audit.hint;
  if (diagCard) {
    diagCard.classList.toggle("is-pass", audit.passed);
    diagCard.classList.toggle("is-fail", !audit.passed);
  }
  if (mobileHeadline) mobileHeadline.textContent = audit.headline;
  if (mobileHint) mobileHint.textContent = audit.hint;

  // 自示范刊头微型读数
  if (mastScaleReadout) {
    mastScaleReadout.textContent = state.refVisible
      ? `RATIO ${audit.geo.heightRatio.toFixed(1)} : 1`
      : "NO REFERENCE";
  }

  // 原海报右侧五枚探针实时亮暗与读数
  audit.pillars.forEach((p) => {
    const row = pillarEls[p.key];
    if (!row) return;
    row.classList.toggle("is-ok", p.ok);
    row.classList.toggle("is-bad", !p.ok);
    const chip = row.querySelector("[data-pillar-status]");
    if (chip) chip.textContent = p.status;
  });

  stage.redraw();
}

function applyPreset(presetState) {
  Object.assign(state, {
    ...presetState,
    midClutter: [...presetState.midClutter],
  });
  syncUI();
}

// 绑定场景切换
sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.scene = b.dataset.scene;
    syncUI();
  });
});

// 绑定滑轨
const onMacroInput = (e) => {
  state.macroScale = clamp(Number(e.target.value) / 100, 0.2, 0.96);
  syncUI();
};
macroSlider?.addEventListener("input", onMacroInput);
quickMacro?.addEventListener("input", onMacroInput);

microSlider?.addEventListener("input", (e) => {
  state.refVisible = true;
  state.microScale = clamp(Number(e.target.value) / 1000, 0.015, 0.42);
  syncUI();
});

gapSlider?.addEventListener("input", (e) => {
  state.gapOffset = clamp(Number(e.target.value) / 100, -0.06, 0.24);
  syncUI();
});

// 绑定开关与动作按钮
refToggleBtn?.addEventListener("click", () => {
  state.refVisible = !state.refVisible;
  syncUI();
});
clutterBtn?.addEventListener("click", () => {
  const any = state.midClutter.some(Boolean);
  state.midClutter = any ? [false, false] : [true, true];
  syncUI();
});
horizonBtn?.addEventListener("click", () => {
  state.horizonOn = !state.horizonOn;
  syncUI();
});

verifyBtns.forEach((b) => b.addEventListener("click", () => stage.triggerVerify()));
calibrateBtns.forEach((b) => b.addEventListener("click", () => applyPreset(SOLUTIONS.poster.state)));
resetBtns.forEach((b) => b.addEventListener("click", () => applyPreset(INITIAL_STATE)));

document.querySelectorAll("[data-solution]").forEach((b) => {
  b.addEventListener("click", () => {
    const sol = SOLUTIONS[b.dataset.solution];
    if (sol) applyPreset(sol.state);
  });
});

document.querySelectorAll("[data-failure]").forEach((b) => {
  b.addEventListener("click", () => {
    const fail = FAILURES[b.dataset.failure];
    if (fail) applyPreset(fail.state);
  });
});

// 键盘操作：Space 验真、左右键调主物尺度、上下键调参照尺度、R 复原开场、1/2/3 切换语境
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = document.getElementById("lightbox");
  if (lb && !lb.hidden) return;

  if (e.code === "Space") {
    const heroRect = heroCanvas.getBoundingClientRect();
    if (heroRect.bottom > 80 && heroRect.top < window.innerHeight - 60) {
      e.preventDefault();
      stage.triggerVerify();
    }
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.macroScale = clamp(+(state.macroScale + 0.03).toFixed(3), 0.2, 0.96);
    syncUI();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.macroScale = clamp(+(state.macroScale - 0.03).toFixed(3), 0.2, 0.96);
    syncUI();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.refVisible = true;
    state.microScale = clamp(+(state.microScale + 0.015).toFixed(3), 0.015, 0.42);
    syncUI();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.refVisible = true;
    state.microScale = clamp(+(state.microScale - 0.015).toFixed(3), 0.015, 0.42);
    syncUI();
  } else if (e.key === "r" || e.key === "R") {
    applyPreset(INITIAL_STATE);
  } else if (e.key === "1") {
    state.scene = "poster";
    syncUI();
  } else if (e.key === "2") {
    state.scene = "boullee";
    syncUI();
  } else if (e.key === "3") {
    state.scene = "type";
    syncUI();
  }
});

syncUI();
initAllSections();
