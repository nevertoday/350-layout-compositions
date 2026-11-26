// 213 横排右起 · 页面总控入口
// 将 model.js（单真源）与 stage.js（2D Canvas 编排台）、顶部四步活体流程带、单真源诊单、精控台及 01–07 节全部联动。

import { clamp, computeLayout, createInitialState, PRESETS } from "./model.js";
import { createBannerStage } from "./stage.js";
import { initSections } from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const anchorPill = document.getElementById("hero-anchor-pill");
const anchorPillM = document.getElementById("hero-anchor-pill-m");

// 顶部 1:1 复刻原海报「阅读流程 READING FLOW」节点
const flowOriginNote = document.getElementById("flow-origin-note");
const flowStepEls = [1, 2, 3, 4].map((n) => ({
  root: document.querySelector(`[data-flow-step="${n}"]`),
  note: document.querySelector(`[data-flow-note="${n}"]`),
}));

// 单真源诊单与四项实测读数
const diagBox = document.getElementById("diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const diagFixBtn = document.getElementById("diag-fix-btn");

const metricGravity = document.getElementById("m-gravity");
const metricSpread = document.getElementById("m-spread");
const metricWeight = document.getElementById("m-weight");
const metricFlow = document.getElementById("m-flow");

// 精控台控件
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const pullBtns = [...document.querySelectorAll("[data-pull]")];
const weightBtns = [...document.querySelectorAll("[data-weight]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const focalSlider = document.getElementById("ctl-focal-x");
const focalVal = document.getElementById("ctl-focal-val");
const playFlowBtn = document.getElementById("ctl-play-flow");
const toggleGuidesBtn = document.getElementById("ctl-guides");

// 底部 4 栏原海报「设计要点」实时指示灯
const principleEls = {
  origin: document.querySelector('[data-principle="origin"]'),
  align: document.querySelector('[data-principle="align"]'),
  pull: document.querySelector('[data-principle="pull"]'),
  emphasis: document.querySelector('[data-principle="emphasis"]'),
};

let stage = null;

function applyPatch(patch) {
  Object.assign(state, patch);
  stage?.redraw();
  syncUI();
}

function syncUI() {
  const L = stage ? stage.getLayout() : computeLayout(state, 960, 310);
  const { metrics, diagnosis, flowNodes, principles, isSolved } = L;

  // 1. 右上绯红锚圆状态标（桌面与移动共源）
  const pillText = isSolved ? `右锚稳 · ${metrics.focalCenterPct}%` : `${metrics.passCount}/4 · ${diagnosis.badge.split("·").pop().trim()}`;
  if (anchorPill) {
    anchorPill.textContent = pillText;
    anchorPill.dataset.ok = String(isSolved);
  }
  if (anchorPillM) {
    anchorPillM.textContent = pillText;
    anchorPillM.dataset.ok = String(isSolved);
  }

  // 2. 顶部 4 步活体「阅读流程 READING FLOW」
  if (flowOriginNote) {
    flowOriginNote.textContent = isSolved
      ? `右锚 ${metrics.focalCenterPct}% · 顺流左展`
      : `重心 ${metrics.gravityPct}% · ${metrics.issueCount} 处待整`;
    flowOriginNote.dataset.ok = String(isSolved);
  }
  flowNodes.forEach((node, i) => {
    const slot = flowStepEls[i];
    if (!slot?.root) return;
    slot.root.dataset.status = node.status;
    if (slot.note) slot.note.textContent = node.note;
  });

  // 3. 单真源白话诊单
  if (diagBox) diagBox.dataset.ok = String(diagnosis.ok);
  if (diagBadge) diagBadge.textContent = diagnosis.badge;
  if (diagTitle) diagTitle.textContent = diagnosis.title;
  if (diagWhy) diagWhy.textContent = diagnosis.why;
  if (diagAction) diagAction.textContent = diagnosis.action;
  if (diagFixBtn) {
    diagFixBtn.textContent = diagnosis.fixLabel;
    diagFixBtn.dataset.preset = diagnosis.fixPreset || "";
    diagFixBtn.dataset.patch = diagnosis.fixPatch ? JSON.stringify(diagnosis.fixPatch) : "";
  }

  // 4. 四格实测读数（全自 computeLayout 单真源）
  if (metricGravity) metricGravity.textContent = `${metrics.gravityPct}% 处`;
  if (metricSpread) metricSpread.textContent = `${metrics.rightEdgeSpreadPx} px`;
  if (metricWeight) metricWeight.textContent = `${metrics.weightRatio}×`;
  if (metricFlow) metricFlow.textContent = metrics.flowGrade;

  // 5. 控件激活态同步
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.sceneId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  alignBtns.forEach((b) => {
    const on = b.dataset.align === state.align;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  pullBtns.forEach((b) => {
    const on = b.dataset.pull === state.pullMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  weightBtns.forEach((b) => {
    const on = b.dataset.weight === state.weightMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (focalSlider) focalSlider.value = String(Math.round(state.focalX * 100));
  if (focalVal) focalVal.textContent = `${Math.round(state.focalX * 100)}%`;
  if (toggleGuidesBtn) {
    toggleGuidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    toggleGuidesBtn.textContent = state.showGuides ? "参考线：开" : "参考线：关";
  }

  // 6. 底部 4 项原海报「设计要点」活体灯
  principles.forEach((p) => {
    const el = principleEls[p.id];
    if (!el) return;
    el.dataset.ok = String(p.ok);
    const tag = el.querySelector(".pt-tag");
    if (tag) tag.textContent = p.tag;
  });
}

// 初始化开场 2D Canvas 编排台
if (canvas) {
  stage = createBannerStage(
    canvas,
    () => state,
    (patch) => {
      Object.assign(state, patch);
      syncUI();
    }
  );
}

// 绑定所有控件事件
sceneBtns.forEach((b) => b.addEventListener("click", () => applyPatch({ sceneId: b.dataset.scene })));
alignBtns.forEach((b) => b.addEventListener("click", () => applyPatch({ align: b.dataset.align })));
pullBtns.forEach((b) => b.addEventListener("click", () => applyPatch({ pullMode: b.dataset.pull })));
weightBtns.forEach((b) => b.addEventListener("click", () => applyPatch({ weightMode: b.dataset.weight })));
presetBtns.forEach((b) => b.addEventListener("click", () => {
  const p = PRESETS[b.dataset.preset];
  if (p) applyPatch({ ...p });
}));

focalSlider?.addEventListener("input", () => {
  applyPatch({ focalX: clamp(Number(focalSlider.value) / 100, 0.24, 0.985), selected: "focal" });
});

diagFixBtn?.addEventListener("click", () => {
  const presetKey = diagFixBtn.dataset.preset;
  const patchRaw = diagFixBtn.dataset.patch;
  if (patchRaw) {
    try { applyPatch(JSON.parse(patchRaw)); return; } catch {}
  }
  if (presetKey && PRESETS[presetKey]) {
    applyPatch({ ...PRESETS[presetKey] });
  }
});

playFlowBtn?.addEventListener("click", () => {
  applyPatch({ showFlow: true });
  stage?.playFlowPulse();
});

toggleGuidesBtn?.addEventListener("click", () => {
  applyPatch({ showGuides: !state.showGuides });
});

// 画布键盘操控（1/2/3 选模块，←/→ 精准微调，Space 演练视线）
canvas?.addEventListener("keydown", (e) => {
  if (e.key === "1") { applyPatch({ selected: "focal" }); return; }
  if (e.key === "2") { applyPatch({ selected: "aux" }); return; }
  if (e.key === "3") { applyPatch({ selected: "pull" }); return; }
  if (e.key === " ") {
    e.preventDefault();
    applyPatch({ showFlow: true });
    stage?.playFlowPulse();
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.shiftKey ? 0.05 : 0.02;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    if (state.selected === "aux") {
      applyPatch({ auxX: clamp(state.auxX + dir * step, 0.08, 0.90) });
    } else if (state.selected === "pull") {
      applyPatch({ pullSpan: clamp(state.pullSpan - dir * step, 0.16, 0.52) });
    } else {
      applyPatch({ focalX: clamp(state.focalX + dir * step, 0.24, 0.985) });
    }
  }
});

// 顶部流程节点可点击定位对应模块
flowStepEls.forEach((slot, i) => {
  slot.root?.addEventListener("click", () => {
    const map = ["focal", "focal", "pull", "aux"];
    applyPatch({ selected: map[i] });
    stage?.playFlowPulse();
  });
});

// 初次同步读数并启动 01–07 全部小节交互
syncUI();
initSections();
