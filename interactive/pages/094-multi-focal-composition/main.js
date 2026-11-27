// 094 多重焦点构图 — 总入口：协调单真源状态、星图画布、底部紫卡与四探针及七节互动。

import { initPosterCrops } from "./assets.js";
import { mountHeroCanvas } from "./canvas-hero.js";
import {
  SCENARIOS,
  applyPreset,
  createInitialState,
  evaluate,
  setFocalCount,
} from "./model.js";
import {
  initApplicationsXRay,
  initDecisionTree,
  initHierarchyMixer,
  initHistoryAndYarbus,
  initPathwaysLab,
  initPosterLightbox,
  initQuiz,
} from "./sections.js";

const state = createInitialState();

const heroCanvas = document.getElementById("hero-canvas");
const topStatus = document.getElementById("hero-status-pill");
const scenarioCaption = document.getElementById("hero-scenario-caption");
const diagBadge = document.getElementById("diag-badge");
const diagTier = document.getElementById("diag-tier");
const diagTitle = document.getElementById("diag-title");
const diagReason = document.getElementById("diag-reason");
const diagAction = document.getElementById("diag-action");

// 手机端折线内精简诊单同步元素
const mobDiagTitle = document.getElementById("mob-diag-title");
const mobDiagAction = document.getElementById("mob-diag-action");
const mobSizeSlider = document.getElementById("mob-size-slider");
const mobSizeVal = document.getElementById("mob-size-val");

const nodePickWrap = document.getElementById("ctrl-node-picks");
const sizeSlider = document.getElementById("ctrl-size");
const sizeVal = document.getElementById("ctrl-size-val");
const contrastSlider = document.getElementById("ctrl-contrast");
const contrastVal = document.getElementById("ctrl-contrast-val");
const countSlider = document.getElementById("ctrl-count");
const countVal = document.getElementById("ctrl-count-val");
const guideToggle = document.getElementById("ctrl-guides");

const probeIds = ["distribution", "pathway", "contrast", "balance"];

let stage = null;

function syncUI() {
  const aspect = stage ? stage.getAspect() : 1.65;
  const ev = evaluate(state, aspect);
  const nd = state.nodes[state.selected] || state.nodes[0];

  // 顶部状态胶囊与场景说明
  if (topStatus) {
    topStatus.textContent = ev.diagnosis.badge;
    topStatus.classList.toggle("is-pass", ev.allPass);
  }
  if (scenarioCaption) {
    scenarioCaption.textContent = SCENARIOS[state.scenario]?.caption || "";
  }

  // 左侧紫罗兰核心诊单卡（单真源实算）
  if (diagBadge) {
    diagBadge.textContent = ev.diagnosis.badge;
    diagBadge.classList.toggle("is-pass", ev.allPass);
  }
  if (diagTier) diagTier.textContent = ev.diagnosis.tier;
  if (diagTitle) diagTitle.textContent = ev.diagnosis.title;
  if (diagReason) diagReason.textContent = ev.diagnosis.reason;
  if (diagAction) diagAction.textContent = ev.diagnosis.action;

  // 手机端折线内精简诊单
  if (mobDiagTitle) mobDiagTitle.textContent = ev.diagnosis.title;
  if (mobDiagAction) mobDiagAction.textContent = ev.diagnosis.action;

  // 四列原海报同款实时图标探针
  for (const key of probeIds) {
    const p = ev.pillars[key];
    const card = document.querySelector(`[data-probe="${key}"]`);
    const tag = document.querySelector(`[data-probe-badge="${key}"]`);
    if (card) {
      card.classList.toggle("is-ok", p.ok);
      card.classList.toggle("is-fail", !p.ok);
    }
    if (tag) tag.textContent = p.badge;
  }

  // 节点选择按钮（动态匹配当前 2–6 枚焦点）
  if (nodePickWrap) {
    const currentCount = nodePickWrap.children.length;
    if (currentCount !== state.nodes.length) {
      nodePickWrap.innerHTML = state.nodes
        .map(
          (n, i) =>
            `<button type="button" class="mini-btn${i === state.selected ? " is-active" : ""}" data-pick-node="${i}">${n.id}</button>`
        )
        .join("");
      nodePickWrap.querySelectorAll("[data-pick-node]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.selected = Number(btn.dataset.pickNode);
          syncUI();
          stage.redraw();
        });
      });
    } else {
      [...nodePickWrap.children].forEach((btn, i) => btn.classList.toggle("is-active", i === state.selected));
    }
  }

  // 当前选中节点的滑杆与形态按钮状态
  if (nd) {
    const sizePct = Math.round(((nd.size - 0.055) / (0.175 - 0.055)) * 100);
    const conPct = Math.round(nd.contrast * 100);
    if (sizeSlider) sizeSlider.value = String(sizePct);
    if (sizeVal) sizeVal.textContent = `${nd.id} · ${Math.round(ev.shares[state.selected] * 100)}%`;
    if (mobSizeSlider) mobSizeSlider.value = String(sizePct);
    if (mobSizeVal) mobSizeVal.textContent = `${nd.id} 权重 ${Math.round(ev.shares[state.selected] * 100)}%`;
    if (contrastSlider) contrastSlider.value = String(conPct);
    if (contrastVal) contrastVal.textContent = `${conPct}%`;
    document.querySelectorAll("[data-shape]").forEach((b) => b.classList.toggle("is-active", b.dataset.shape === nd.shape));
  }

  if (countSlider) countSlider.value = String(state.nodes.length);
  if (countVal) countVal.textContent = `${state.nodes.length} 枚`;

  document.querySelectorAll("[data-path-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.pathMode === state.pathMode));
  document.querySelectorAll("[data-scenario]").forEach((b) => b.classList.toggle("is-active", b.dataset.scenario === state.scenario));
  if (guideToggle) {
    guideToggle.setAttribute("aria-pressed", String(state.showGuides));
    guideToggle.textContent = state.showGuides ? "支点轨线：开" : "支点轨线：关";
  }
}

function triggerScan() {
  state.scanActive = true;
  state.scanProgress = 0;
  stage.redraw();
}

// 挂载开场星图画布
initPosterCrops();
stage = mountHeroCanvas(heroCanvas, state, () => syncUI());

// 绑定场景切换
document.querySelectorAll("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scenario = btn.dataset.scenario;
    syncUI();
    stage.redraw();
  });
});

// 绑定尺寸与对比滑杆
const handleSizeInput = (val) => {
  const nd = state.nodes[state.selected];
  if (!nd) return;
  nd.size = 0.055 + (Number(val) / 100) * (0.175 - 0.055);
  syncUI();
  stage.redraw();
};
if (sizeSlider) sizeSlider.addEventListener("input", () => handleSizeInput(sizeSlider.value));
if (mobSizeSlider) mobSizeSlider.addEventListener("input", () => handleSizeInput(mobSizeSlider.value));

if (contrastSlider) {
  contrastSlider.addEventListener("input", () => {
    const nd = state.nodes[state.selected];
    if (!nd) return;
    nd.contrast = Number(contrastSlider.value) / 100;
    syncUI();
    stage.redraw();
  });
}

if (countSlider) {
  countSlider.addEventListener("input", () => {
    setFocalCount(state, Number(countSlider.value));
    syncUI();
    stage.redraw();
  });
}

// 形态切换
document.querySelectorAll("[data-shape]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nd = state.nodes[state.selected];
    if (!nd) return;
    nd.shape = btn.dataset.shape;
    syncUI();
    stage.redraw();
  });
});

// 路径模式切换
document.querySelectorAll("[data-path-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.pathMode = btn.dataset.pathMode;
    syncUI();
    stage.redraw();
  });
});

// 支点轨线开关
if (guideToggle) {
  guideToggle.addEventListener("click", () => {
    state.showGuides = !state.showGuides;
    syncUI();
    stage.redraw();
  });
}

// 合法多解 & 双向试错预设按钮
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(state, btn.dataset.preset);
    syncUI();
    stage.redraw();
  });
});

// 放飞视线巡航按钮
document.querySelectorAll("[data-scan-btn]").forEach((btn) => {
  btn.addEventListener("click", triggerScan);
});

// 键盘操控（Space 放飞视线巡航；方向键微调选中焦点坐标；1–6 切选中焦点；+/- 调大小）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const modal = document.getElementById("lightbox");
  if (modal && !modal.hidden) return;

  if (e.code === "Space") {
    e.preventDefault();
    triggerScan();
    return;
  }
  if (/^Digit[1-6]$/.test(e.code)) {
    const idx = Number(e.code.slice(5)) - 1;
    if (idx < state.nodes.length) {
      state.selected = idx;
      syncUI();
      stage.redraw();
    }
    return;
  }
  const nd = state.nodes[state.selected];
  if (!nd) return;
  const step = e.shiftKey ? 0.045 : 0.02;
  let moved = true;
  if (e.key === "ArrowLeft") nd.u = Math.max(0.08, nd.u - step);
  else if (e.key === "ArrowRight") nd.u = Math.min(0.92, nd.u + step);
  else if (e.key === "ArrowUp") nd.v = Math.max(0.11, nd.v - step);
  else if (e.key === "ArrowDown") nd.v = Math.min(0.89, nd.v + step);
  else if (e.key === "=" || e.key === "+") nd.size = Math.min(0.175, nd.size + 0.008);
  else if (e.key === "-") nd.size = Math.max(0.055, nd.size - 0.008);
  else moved = false;

  if (moved) {
    e.preventDefault();
    syncUI();
    stage.redraw();
  }
});

// 初始化七节互动模块
syncUI();
initHierarchyMixer();
initPathwaysLab();
initHistoryAndYarbus();
initApplicationsXRay();
initDecisionTree();
initQuiz();
initPosterLightbox();
