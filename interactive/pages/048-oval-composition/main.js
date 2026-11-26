// 048 椭圆构图 · 主入口：统筹单真源状态、自示范椭圆刊头、五徽探针、四步演化条与各节实验台
import { INITIAL_STATE, PRESETS, LIMITS, clamp, evaluate } from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import {
  mountStringLab,
  mountCurtainLab,
  mountHistoryStepper,
  mountDomainLab,
  mountAvoidToggle,
  mountQuiz,
  mountPosterLightbox,
} from "./labs.js";

const state = {
  ...INITIAL_STATE,
  subj: { ...INITIAL_STATE.subj },
  copy: { ...INITIAL_STATE.copy },
};

const getState = () => state;
function setState(patch) {
  if (patch.subj) state.subj = { ...patch.subj };
  if (patch.copy) state.copy = { ...patch.copy };
  for (const [k, v] of Object.entries(patch)) {
    if (k !== "subj" && k !== "copy") state[k] = v;
  }
}

const heroCanvas = document.getElementById("hero-canvas");

// 顶部自示范椭圆刊头环（实时微调倾角与扁率，呼应主画布）
const haloEllipse = document.getElementById("masthead-oval-ring");
const mastheadPill = document.getElementById("hero-status-pill");

// 诊单元素
const diagScore = document.getElementById("diag-score");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagHow = document.getElementById("diag-how");
const diagFixBtn = document.getElementById("diag-fix-btn");
const mRatio = document.getElementById("m-ratio");
const mEcc = document.getElementById("m-ecc");
const mMargin = document.getElementById("m-margin");
const mPosture = document.getElementById("m-posture");

// 滑杆与读数
const slRatio = document.getElementById("sl-ratio");
const slTilt = document.getElementById("sl-tilt");
const slScale = document.getElementById("sl-scale");
const valRatio = document.getElementById("val-ratio");
const valTilt = document.getElementById("val-tilt");
const valScale = document.getElementById("val-scale");

const btnMargin = document.getElementById("btn-margin-mode");
const btnGuides = document.getElementById("btn-guides");
const btnFlow = document.getElementById("btn-flow");
const btnReset = document.getElementById("btn-reset");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const badgeEls = [...document.querySelectorAll("[data-badge-key]")];
const stepEls = [...document.querySelectorAll("[data-step-id]")];

let heroApi = null;
let lastFixPatch = null;

function syncUI() {
  const sz = heroApi ? heroApi.getSize() : { width: 640, height: 500 };
  const res = evaluate(state, sz.width, sz.height);
  const g = res.g;

  // 1. 自示范刊头椭圆细环：轻微呼应当前长短轴比例与倾角
  if (haloEllipse) {
    const ry = clamp(68 - (g.ratio - 1.0) * 14, 46, 68);
    const tiltVisual = clamp((g.tiltDeg - 30) * 0.08, -5, 5);
    haloEllipse.setAttribute("ry", ry.toFixed(1));
    haloEllipse.setAttribute("transform", `rotate(${tiltVisual.toFixed(1)} 250 76)`);
  }

  // 2. 顶部与诊单状态印章
  const tone = res.score === 4 ? "ok" : res.score >= 2 ? "mid" : "bad";
  const badgeStr = `${res.score}/4 · ${res.primary.tag}`;
  if (mastheadPill) {
    mastheadPill.textContent = badgeStr;
    mastheadPill.dataset.tone = tone;
  }
  if (diagScore) {
    diagScore.textContent = badgeStr;
    diagScore.dataset.tone = tone;
  }

  // 3. 白话单真源诊单
  diagHeadline.textContent = res.primary.headline;
  diagWhy.textContent = res.primary.why;
  diagHow.textContent = res.primary.how;
  diagFixBtn.textContent = res.primary.fixLabel;
  lastFixPatch = res.primary.fixPatch;

  // 4. 实测指标（全部从同一份 computeGeometry 来）
  mRatio.textContent = `${g.ratio.toFixed(2)} : 1`;
  mEcc.textContent = `e = ${g.e.toFixed(2)}`;
  mMargin.textContent = res.isClipped ? `切边 −${Math.max(1, Math.round(g.clipPx))}px` : `余量 +${Math.round(g.minMarginPx)}px`;
  mPosture.textContent = res.postureLabel;

  // 5. 同步滑杆与按钮态
  slRatio.value = state.ratio.toFixed(2);
  slTilt.value = String(Math.round(state.tilt));
  slScale.value = Math.round(state.scale * 100);
  valRatio.textContent = `${state.ratio.toFixed(2)} : 1`;
  valTilt.textContent = `${Math.round(state.tilt)}°`;
  valScale.textContent = `${Math.round(state.scale * 100)}%`;

  btnMargin.textContent = state.marginMode === "curved" ? "外围留白：顺形导流" : "外围留白：硬角切框";
  btnMargin.setAttribute("aria-pressed", String(state.marginMode === "curved"));
  btnMargin.classList.toggle("is-alert", state.marginMode !== "curved");

  btnGuides.textContent = state.showGuides ? "双焦辅助：开" : "双焦辅助：关";
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));

  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 6. 五枚原海报关键词圆徽实时探针
  for (const item of res.badges) {
    const el = badgeEls.find((node) => node.dataset.badgeKey === item.key);
    if (!el) continue;
    const chip = el.querySelector(".probe-chip");
    if (chip) {
      chip.textContent = item.chip;
      chip.dataset.ok = String(item.ok);
    }
    el.dataset.ok = String(item.ok);
  }

  // 7. 底沿「如何运用」四步演化活体进度
  for (const st of res.steps) {
    const el = stepEls.find((node) => Number(node.dataset.stepId) === st.id);
    if (!el) continue;
    el.dataset.done = String(st.done);
    el.dataset.active = String(st.active);
    const tag = el.querySelector(".step-state");
    if (tag) tag.textContent = st.done ? "已达成" : st.active ? "正在调校" : "待完成";
  }
}

heroApi = mountHeroStage(heroCanvas, { getState, setState, onChange: syncUI });
syncUI();

// ---------- 控件绑定 ----------
slRatio.addEventListener("input", () => {
  setState({ ratio: +Number(slRatio.value).toFixed(2) });
  syncUI();
  heroApi.draw();
});
slTilt.addEventListener("input", () => {
  setState({ tilt: Math.round(Number(slTilt.value)) });
  syncUI();
  heroApi.draw();
});
slScale.addEventListener("input", () => {
  setState({ scale: +(Number(slScale.value) / 100).toFixed(2) });
  syncUI();
  heroApi.draw();
});

btnMargin.addEventListener("click", () => {
  setState({ marginMode: state.marginMode === "curved" ? "cut" : "curved" });
  syncUI();
  heroApi.draw();
});
btnGuides.addEventListener("click", () => {
  setState({ showGuides: !state.showGuides });
  syncUI();
  heroApi.draw();
});
btnFlow.addEventListener("click", () => {
  heroApi.triggerFlow();
});
btnReset.addEventListener("click", () => {
  setState({
    ...INITIAL_STATE,
    scene: state.scene,
    subj: { ...INITIAL_STATE.subj },
    copy: { ...INITIAL_STATE.copy },
  });
  syncUI();
  heroApi.draw();
});

diagFixBtn.addEventListener("click", () => {
  if (lastFixPatch) {
    setState(lastFixPatch);
    syncUI();
    heroApi.draw();
  } else {
    heroApi.triggerFlow();
  }
});

sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    setState({ scene: b.dataset.scene });
    syncUI();
    heroApi.draw();
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    setState(p.patch);
    syncUI();
    heroApi.draw();
  });
});

// 点击左栏五枚圆徽：高亮画布上对应的椭圆几何层
badgeEls.forEach((el) => {
  el.addEventListener("click", () => {
    const layer = el.dataset.layer;
    const wasOn = el.classList.contains("is-focus");
    badgeEls.forEach((n) => n.classList.remove("is-focus"));
    if (!wasOn) el.classList.add("is-focus");
    heroApi.setActiveLayer(layer);
  });
});

// 点击底沿「如何运用」4 步演化微缩图：直接演示海报 1→4 建构步骤
const STEP_STATES = {
  1: { ...INITIAL_STATE, subj: { ...INITIAL_STATE.subj }, copy: { ...INITIAL_STATE.copy } },
  2: { ratio: 1.40, tilt: 58, scale: 0.85, subj: { u: 0.02, v: 0.03 }, copy: { u: 0.14, v: -0.15 }, marginMode: "cut" },
  3: { ratio: 1.40, tilt: 58, scale: 0.85, subj: { u: -0.40, v: 0.12 }, copy: { u: 0.42, v: -0.05 }, marginMode: "cut" },
  4: { ...PRESETS.poster.patch },
};
stepEls.forEach((el) => {
  el.addEventListener("click", () => {
    const id = Number(el.dataset.stepId);
    if (!STEP_STATES[id]) return;
    setState(STEP_STATES[id]);
    syncUI();
    heroApi.draw();
  });
});

// 键盘操控开场画布（←/→ 调长短轴比，↑/↓ 调倾角，空格演播视线流）
heroCanvas.addEventListener("keydown", (ev) => {
  if (ev.key === "ArrowRight") {
    ev.preventDefault();
    setState({ ratio: +clamp(state.ratio + 0.08, LIMITS.ratioMin, LIMITS.ratioMax).toFixed(2) });
  } else if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    setState({ ratio: +clamp(state.ratio - 0.08, LIMITS.ratioMin, LIMITS.ratioMax).toFixed(2) });
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    setState({ tilt: clamp(state.tilt + 5, LIMITS.tiltMin, LIMITS.tiltMax) });
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    setState({ tilt: clamp(state.tilt - 5, LIMITS.tiltMin, LIMITS.tiltMax) });
  } else if (ev.key === " ") {
    ev.preventDefault();
    heroApi.triggerFlow();
    return;
  } else {
    return;
  }
  syncUI();
  heroApi.draw();
});

// 启动全部专题交互节
mountStringLab();
mountCurtainLab();
mountHistoryStepper();
mountDomainLab();
mountAvoidToggle();
mountQuiz();
mountPosterLightbox();
