// 136 非对称跨页 —— 页面总入口
// 单真源驱动：所有状态变更 -> computeSpread(state) -> 同步更新画布、四项原海报探针、诊单与精控条。

import {
  PRESETS,
  CORAL_LABELS,
  TEXT_LABELS,
  computeSpread,
  applyFix,
  clamp,
} from "./model.js";
import { createHeroCanvas } from "./heroCanvas.js";
import { createGutterCanvas, BINDINGS } from "./gutterCanvas.js";
import {
  initLeverSection,
  initCurtainSection,
  initHistorySection,
  initWhenNotSection,
  initQuizSection,
  initPosterLightbox,
} from "./sections.js";

// ---------- 1. 开场状态与单真源渲染 ----------
let state = { ...PRESETS.initial };
let computed = computeSpread(state);

const $ = (id) => document.getElementById(id);

const heroCanvasEl = $("hero-canvas");
const statusPillEl = $("hero-status-pill");
const diagBadgeEl = $("diag-badge");
const diagTitleEl = $("diag-title");
const diagWhyEl = $("diag-why");
const diagActionEl = $("diag-action");
const diagFixBtn = $("diag-fix-btn");
const diagCardEl = $("diag-card");

const mShareEl = $("m-share");
const mWhiteEl = $("m-white");
const mContrastEl = $("m-contrast");
const mTorqueEl = $("m-torque");
const mStanceEl = $("m-stance");

const probeEls = {
  gravity: $("probe-gravity"),
  tension: $("probe-tension"),
  offset: $("probe-offset"),
  balance: $("probe-balance"),
};

const reachSlider = $("ctrl-reach");
const reachVal = $("val-reach");
const coralArmSlider = $("ctrl-coral-arm");
const coralArmVal = $("val-coral-arm");
const flipBtn = $("btn-flip");
const guidesBtn = $("btn-guides");
const flowBtn = $("btn-flow");

const specimenBtns = [...document.querySelectorAll("[data-specimen]")];
const coralBtns = [...document.querySelectorAll("[data-coral]")];
const textBtns = [...document.querySelectorAll("[data-text-mode]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setClass(el, val) {
  if (el && el.className !== val) el.className = val;
}

function syncUI() {
  computed = computeSpread(state);
  const { metrics, probeTags, diag } = computed;

  // 顶部与诊单状态印章（仅当值变化时写 DOM，拖动时零多余回流）
  setText(statusPillEl, diag.badge);
  setClass(statusPillEl, `status-pill is-${diag.tone}`);
  setText(diagBadgeEl, diag.badge);
  setClass(diagBadgeEl, `diag-badge is-${diag.tone}`);
  if (diagCardEl && diagCardEl.dataset.tone !== diag.tone) {
    diagCardEl.dataset.tone = diag.tone;
  }
  setText(diagTitleEl, diag.title);
  setText(diagWhyEl, diag.why);
  setText(diagActionEl, diag.action);
  if (diagFixBtn) {
    setText(diagFixBtn, diag.fixLabel);
    if (diagFixBtn.dataset.fix !== diag.fixAction) diagFixBtn.dataset.fix = diag.fixAction;
  }

  // 四项单真源指标卡
  setText(mShareEl, `${metrics.screenLeftShare}:${metrics.screenRightShare}`);
  setText(mWhiteEl, `${metrics.whitespacePct}%`);
  setText(mContrastEl, `${metrics.contrastRatio}×`);
  const sign = metrics.torqueImbalancePct > 0 ? "+" : "";
  setText(mTorqueEl, `${sign}${metrics.torqueImbalancePct}%`);
  setText(mStanceEl, metrics.stanceLabel);

  // 原海报顶部四关键词红细竖线探针
  for (const key of ["gravity", "tension", "offset", "balance"]) {
    const el = probeEls[key];
    if (!el) continue;
    const p = probeTags[key];
    setText(el, p.label);
    setClass(el, `kw-pill ${p.ok ? "is-ok" : "is-bad"}`);
  }

  // 精控滑杆与按钮组同步
  if (reachSlider) {
    const pct = String(Math.round(state.anchorReach * 100));
    if (reachSlider.value !== pct) reachSlider.value = pct;
    setText(reachVal, `${pct}%`);
  }
  if (coralArmSlider) {
    const arm = String(Math.round(state.coralX * 100));
    if (coralArmSlider.value !== arm) coralArmSlider.value = arm;
    setText(coralArmVal, `${metrics.coralArmPct}%`);
  }

  for (const b of specimenBtns) {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    if (b.getAttribute("aria-pressed") !== String(on)) b.setAttribute("aria-pressed", String(on));
  }
  for (const b of coralBtns) {
    const on = Number(b.dataset.coral) === state.coralSize;
    b.classList.toggle("is-active", on);
    if (b.getAttribute("aria-pressed") !== String(on)) b.setAttribute("aria-pressed", String(on));
  }
  for (const b of textBtns) {
    const on = b.dataset.textMode === state.textMode;
    b.classList.toggle("is-active", on);
    if (b.getAttribute("aria-pressed") !== String(on)) b.setAttribute("aria-pressed", String(on));
  }
  if (flipBtn) {
    setText(flipBtn, state.flipped ? "重心方位：右重左疏" : "重心方位：左重右疏");
    flipBtn.classList.toggle("is-active", state.flipped);
    if (flipBtn.getAttribute("aria-pressed") !== String(state.flipped)) {
      flipBtn.setAttribute("aria-pressed", String(state.flipped));
    }
  }
  if (guidesBtn) {
    setText(guidesBtn, state.showGuides ? "标尺：开" : "标尺：关");
    guidesBtn.classList.toggle("is-active", state.showGuides);
    if (guidesBtn.getAttribute("aria-pressed") !== String(state.showGuides)) {
      guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    }
  }

  heroCtrl.draw();
}

function mutate(patch) {
  state = { ...state, ...patch };
  syncUI();
}

const heroCtrl = createHeroCanvas(
  heroCanvasEl,
  () => computed,
  (patch) => mutate(patch),
  () => {
    if (flowBtn) flowBtn.classList.remove("is-playing");
  }
);

function triggerFlow() {
  if (flowBtn) flowBtn.classList.add("is-playing");
  heroCtrl.playFlow();
}

// 绑定开场控件事件
for (const b of specimenBtns) {
  b.addEventListener("click", () => mutate({ specimen: b.dataset.specimen }));
}
for (const b of coralBtns) {
  b.addEventListener("click", () => mutate({ coralSize: Number(b.dataset.coral) }));
}
for (const b of textBtns) {
  b.addEventListener("click", () => mutate({ textMode: b.dataset.textMode }));
}
for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const key = b.dataset.preset;
    const p = PRESETS[key];
    if (!p) return;
    // 切换合法解或试错预设时保留当前标尺开关
    state = { ...p, showGuides: state.showGuides };
    syncUI();
  });
}

if (reachSlider) {
  reachSlider.addEventListener("input", () => {
    mutate({ anchorReach: Number(reachSlider.value) / 100 });
  });
}
if (coralArmSlider) {
  coralArmSlider.addEventListener("input", () => {
    const nextX = Number(coralArmSlider.value) / 100;
    const patch = { coralX: nextX };
    if (state.coralSize === 0) patch.coralSize = 2;
    mutate(patch);
  });
}
if (flipBtn) {
  flipBtn.addEventListener("click", () => mutate({ flipped: !state.flipped }));
}
if (guidesBtn) {
  guidesBtn.addEventListener("click", () => mutate({ showGuides: !state.showGuides }));
}
if (flowBtn) {
  flowBtn.addEventListener("click", triggerFlow);
}
if (diagFixBtn) {
  diagFixBtn.addEventListener("click", () => {
    const act = diagFixBtn.dataset.fix;
    if (act === "play_flow") {
      triggerFlow();
    } else {
      state = applyFix(state, act);
      syncUI();
    }
  });
}

// 键盘操控（仅在焦点不在表单输入或页面靠顶时响应，避免干扰滚动和输入框）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = $("poster-lightbox");
  if (lb && !lb.hidden) return;
  if (window.scrollY > window.innerHeight * 0.85) return;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    mutate({ anchorReach: Number(clamp(state.anchorReach + 0.02, 0.24, 0.66).toFixed(3)) });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutate({ anchorReach: Number(clamp(state.anchorReach - 0.02, 0.24, 0.66).toFixed(3)) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mutate({ coralX: Number(clamp(state.coralX + 0.03, 0.54, 0.91).toFixed(3)), coralSize: Math.max(1, state.coralSize) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    mutate({ coralX: Number(clamp(state.coralX - 0.03, 0.54, 0.91).toFixed(3)) });
  } else if (e.key === "c" || e.key === "C") {
    mutate({ coralSize: (state.coralSize + 1) % 4 });
  } else if (e.key === "f" || e.key === "F") {
    mutate({ flipped: !state.flipped });
  } else if (e.key === " ") {
    // 仅当焦点不在按钮上时用空格触发视线流，防止破坏按钮原生激活
    if (tag !== "BUTTON") {
      e.preventDefault();
      triggerFlow();
    }
  }
});

// 暴露给自动探针脚本核对单真源读数用（无副作用）
window.__spread136 = {
  getState: () => ({ ...state }),
  getComputed: () => computed,
  setPreset: (k) => {
    if (PRESETS[k]) {
      state = { ...PRESETS[k] };
      syncUI();
    }
  },
  labels: { CORAL_LABELS, TEXT_LABELS },
};

syncUI();

// ---------- 2. 第 03 节深群青暗室：书脊弯折模拟器 ----------
const s3State = {
  binding: "perfect",
  arcCross: 0.55,
  textPos: 0.42, // 开场故意压进书脊中缝，让读者一眼看清吞字变形
};

const s3Canvas = $("s3-gutter-canvas");
const s3Note = $("s3-bind-note");
const s3PosSlider = $("s3-text-pos");
const s3PosVal = $("s3-text-pos-val");
const s3ArcSlider = $("s3-arc-cross");
const s3ArcVal = $("s3-arc-cross-val");
const s3BindBtns = [...document.querySelectorAll("[data-binding]")];

if (s3Canvas) {
  const s3Ctrl = createGutterCanvas(
    s3Canvas,
    () => s3State,
    (patch) => {
      Object.assign(s3State, patch);
      syncS3();
    }
  );

  function syncS3() {
    const b = BINDINGS[s3State.binding];
    if (s3Note) s3Note.textContent = `${b.name}（${b.en}）：${b.note}`;
    if (s3PosSlider) s3PosSlider.value = String(Math.round(s3State.textPos * 100));
    if (s3PosVal) s3PosVal.textContent = `${Math.round(s3State.textPos * 100)}%`;
    if (s3ArcSlider) s3ArcSlider.value = String(Math.round(s3State.arcCross * 100));
    if (s3ArcVal) s3ArcVal.textContent = `${Math.round(s3State.arcCross * 100)}%`;
    for (const btn of s3BindBtns) {
      const on = btn.dataset.binding === s3State.binding;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
    s3Ctrl.draw();
  }

  for (const btn of s3BindBtns) {
    btn.addEventListener("click", () => {
      s3State.binding = btn.dataset.binding;
      syncS3();
    });
  }
  if (s3PosSlider) {
    s3PosSlider.addEventListener("input", () => {
      s3State.textPos = Number(s3PosSlider.value) / 100;
      syncS3();
    });
  }
  if (s3ArcSlider) {
    s3ArcSlider.addEventListener("input", () => {
      s3State.arcCross = Number(s3ArcSlider.value) / 100;
      syncS3();
    });
  }

  syncS3();
}

// ---------- 3. 其余各节独立交互 ----------
initLeverSection();
initCurtainSection();
initHistorySection();
initWhenNotSection();
initQuizSection();
initPosterLightbox();
