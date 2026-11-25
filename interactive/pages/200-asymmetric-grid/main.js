// 200 非对称 网格 · 主入口：联结 model.js、hero-stage.js 与正文七节互动
import { clampState, computeLayout, createInitialState, PRESETS } from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  initAntiSection,
  initCssGridLab,
  initHistorySwitcher,
  initLeverLab,
  initPosterLightbox,
  initQuiz,
  initXraySection,
} from "./sections.js";

let state = createInitialState();

const el = {
  topStatus: document.getElementById("top-status"),
  h1Shift: document.getElementById("h1-shift"),
  arcDot: document.getElementById("arc-dot"),
  diag: document.getElementById("diag"),
  diagPill: document.getElementById("diag-pill"),
  diagHead: document.getElementById("diag-head"),
  diagWhy: document.getElementById("diag-why"),
  diagHint: document.getElementById("diag-hint"),
  mCols: document.getElementById("m-cols"),
  mTorque: document.getElementById("m-torque"),
  mScale: document.getElementById("m-scale"),
  mOrder: document.getElementById("m-order"),
  cssLive: document.getElementById("css-live"),
  rngV1: document.getElementById("rng-v1"),
  outV1: document.getElementById("out-v1"),
  rngAnchor: document.getElementById("rng-anchor"),
  outAnchor: document.getElementById("out-anchor"),
  btnSnap: document.getElementById("btn-snap"),
  canvas: document.getElementById("hero-canvas"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  hierBtns: [...document.querySelectorAll("[data-hier]")],
  kpRows: [...document.querySelectorAll(".kp-row")],
};

// 缓存上次写入文本，拖动画布时仅在字符变化时改 DOM，保障 60fps 与低 CPU 占用
const lastTxt = new Map();
function setText(node, text) {
  if (!node || lastTxt.get(node) === text) return;
  lastTxt.set(node, text);
  node.textContent = text;
}

function syncUI() {
  const layout = computeLayout(state);
  const ok = layout.score === 4;

  // 顶眉状态
  setText(el.topStatus, layout.statusBadge);
  el.topStatus.classList.toggle("is-ok", ok);
  el.topStatus.classList.toggle("is-err", !ok);

  // 标题本身就是示范：大标第二行「网格」随 V1 偏离均分点的程度微移，展现非对称张力
  const shiftPx = Math.round((0.333 - layout.state.v1) * 140);
  const clampedShift = Math.max(-16, Math.min(28, shiftPx));
  el.h1Shift.style.transform = `translateX(${clampedShift}px)`;
  if (el.arcDot) {
    // 沿圆弧轨迹微移明黄圆点，呼应非对称重心变化
    const cy = Math.round(118 + layout.torqueNorm * 140);
    el.arcDot.setAttribute("cy", String(Math.max(46, Math.min(184, cy))));
  }

  // 白话单真源诊单
  el.diag.classList.toggle("is-ok", ok);
  el.diag.classList.toggle("is-err", !ok);
  setText(el.diagPill, ok ? `达标 · 非对称成立（4/4）` : `错态 · ${layout.statusBadge}`);
  setText(el.diagHead, layout.headline);
  setText(el.diagWhy, layout.why);
  setText(el.diagHint, layout.hint);

  setText(el.mCols, layout.pctValues.join(":"));
  setText(el.mTorque, `${layout.torquePct > 0 ? "+" : ""}${layout.torquePct}%`);
  setText(el.mScale, `${layout.scaleRatio.toFixed(1)}×`);
  setText(el.mOrder, `${Math.round(layout.whitespace * 100)}% · ${layout.driftedCount}块`);

  // CSS 轨道读数
  setText(el.cssLive, `grid-template-columns: ${layout.cssColumns}; /* ${layout.pctValues.join("% : ")}% */`);

  // 五枚核心要点实时徽章
  for (const kp of layout.keyPoints) {
    const badge = document.getElementById(`kp-${kp.key}`);
    if (!badge) continue;
    setText(badge, kp.pill);
    badge.classList.toggle("is-ok", kp.ok);
    badge.classList.toggle("is-err", !kp.ok);
  }

  // 滑块与按钮回显
  const v1Pct = Math.round(layout.state.v1 * 100);
  const axPct = Math.round(layout.anchorX * 100);
  if (Number(el.rngV1.value) !== v1Pct) el.rngV1.value = String(v1Pct);
  setText(el.outV1, `${v1Pct}%`);
  if (Number(el.rngAnchor.value) !== axPct) el.rngAnchor.value = String(axPct);
  setText(el.outAnchor, `${axPct}%`);

  el.sceneBtns.forEach((b) => {
    const on = b.dataset.scene === layout.state.scene;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });

  el.hierBtns.forEach((b) => {
    const on = b.dataset.hier === layout.state.hierarchy;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });

  setText(el.btnSnap, layout.driftedCount > 0 ? `锁回网格线 (${layout.driftedCount})` : "已锁轨 0px");
  el.btnSnap.classList.toggle("is-done", layout.driftedCount === 0);
}

let stage = null;

function patchState(patch) {
  state = clampState({ ...state, ...patch });
  syncUI();
  if (stage) stage.redraw();
}

// 挂起主角画布舞台
stage = mountHeroStage(
  el.canvas,
  () => state,
  (patch) => patchState(patch),
);

// 顶部题材切换
el.sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => patchState({ scene: btn.dataset.scene }));
});

// 顶部预设与压测按钮
el.presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    patchState({
      v1: p.v1,
      v2: p.v2,
      h1: p.h1,
      hierarchy: p.hierarchy,
      anchorX: p.anchorX,
      drifted: p.drifted,
      highlightKey: null,
    });
  });
});

// 底条滑块与按钮
el.rngV1.addEventListener("input", () => {
  const nextV1 = Number(el.rngV1.value) / 100;
  // 若 v1 逼近 v2，同步推开 v2 保留可拖范围
  const nextV2 = Math.max(state.v2, Math.min(0.90, nextV1 + 0.14));
  patchState({ v1: nextV1, v2: nextV2 });
});

el.rngAnchor.addEventListener("input", () => {
  patchState({ anchorX: Number(el.rngAnchor.value) / 100 });
});

el.hierBtns.forEach((btn) => {
  btn.addEventListener("click", () => patchState({ hierarchy: btn.dataset.hier }));
});

el.btnSnap.addEventListener("click", () => {
  patchState({ drifted: !state.drifted });
});

// 五要点点击高亮画布对应维度
el.kpRows.forEach((row) => {
  row.addEventListener("click", () => {
    const k = row.dataset.kp;
    const next = state.highlightKey === k ? null : k;
    el.kpRows.forEach((r) => r.setAttribute("aria-pressed", String(r.dataset.kp === next)));
    patchState({ highlightKey: next });
  });
});

// 初始化首屏读数与正文七节交互
syncUI();
initLeverLab();
initHistorySwitcher();
initXraySection();
initCssGridLab();
initAntiSection();
initQuiz();
initPosterLightbox();
