// 057 棋盘构图 · 页面总入口（单真源同步开场棋盘与 01–07 全部互动节）
import { createState, PRESETS, evaluateBoard } from "./model.js";
import { mountHeroCanvas } from "./hero.js";
import {
  mountSection01,
  mountSection02,
  mountSection03,
  mountSection04,
  mountSection05,
  mountSection06,
  mountPosterLightbox,
} from "./sections.js";

const state = createState();

// DOM 缓存
const canvas = document.getElementById("hero-canvas");
const topScore = document.getElementById("hero-score-badge");
const diagBox = document.getElementById("diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagMeta = document.getElementById("diag-meta");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");

const mobDiagBox = document.getElementById("mob-diag-box");
const mobDiagTitle = document.getElementById("mob-diag-title");
const mobPhaseSlider = document.getElementById("mob-phase-slider");
const mobPhaseVal = document.getElementById("mob-phase-val");

const phaseSlider = document.getElementById("phase-slider");
const phaseVal = document.getElementById("phase-val");
const gutterSlider = document.getElementById("gutter-slider");
const gutterVal = document.getElementById("gutter-val");

const kwModule = document.getElementById("kw-module-val");
const kwRhythm = document.getElementById("kw-rhythm-val");
const kwContrast = document.getElementById("kw-contrast-val");
const kwOrder = document.getElementById("kw-order-val");

const probeEls = {
  rhythm: { card: document.getElementById("probe-rhythm"), tag: document.getElementById("probe-rhythm-tag") },
  order: { card: document.getElementById("probe-order"), tag: document.getElementById("probe-order-tag") },
  contrast: { card: document.getElementById("probe-contrast"), tag: document.getElementById("probe-contrast-tag") },
  module: { card: document.getElementById("probe-module"), tag: document.getElementById("probe-module-tag") },
};

let lastAuditSignature = "";

function syncUI(audit) {
  const sig = `${audit.score}|${audit.code}|${audit.phaseOffset}|${state.gutter}|${audit.altPct}|${audit.solidRatio}|${audit.amberCount}|${audit.darkClumpEdges.length}|${state.script}|${state.brush}`;
  if (sig === lastAuditSignature) return;
  lastAuditSignature = sig;

  const isPass = audit.score === 4;
  const phaseStr = `${audit.phaseOffset > 0 ? "+" : ""}${audit.phaseOffset}%`;

  if (topScore) {
    topScore.textContent = audit.badge;
    topScore.classList.toggle("is-pass", isPass);
  }
  if (diagBox) diagBox.classList.toggle("is-pass", isPass);
  if (diagBadge) {
    diagBadge.textContent = audit.badge;
    diagBadge.classList.toggle("is-pass", isPass);
  }
  if (diagMeta) {
    diagMeta.textContent = `交替 ${audit.altPct}% · 实格 ${audit.solidRatio}% · 错缝 ${phaseStr} · 金焦 ${audit.amberCount} · ${audit.rhythmLevel}`;
  }
  if (diagTitle) diagTitle.textContent = audit.headline;
  if (diagBody) diagBody.textContent = audit.body;
  if (diagAction) diagAction.textContent = audit.action;

  if (mobDiagBox) mobDiagBox.classList.toggle("is-pass", isPass);
  if (mobDiagTitle) mobDiagTitle.textContent = audit.headline;

  if (phaseSlider && Number(phaseSlider.value) !== audit.phaseOffset) {
    phaseSlider.value = String(audit.phaseOffset);
  }
  if (phaseVal) phaseVal.textContent = phaseStr;
  if (mobPhaseSlider && Number(mobPhaseSlider.value) !== audit.phaseOffset) {
    mobPhaseSlider.value = String(audit.phaseOffset);
  }
  if (mobPhaseVal) mobPhaseVal.textContent = phaseStr;

  if (gutterSlider && Number(gutterSlider.value) !== state.gutter) {
    gutterSlider.value = String(state.gutter);
  }
  if (gutterVal) gutterVal.textContent = `${state.gutter}px`;

  // 更新 2×2 原海报四要点探针
  for (const p of audit.probes) {
    const slot = probeEls[p.id];
    if (!slot) continue;
    slot.card?.classList.toggle("is-pass", p.pass);
    if (slot.tag) slot.tag.textContent = p.tag;
  }

  // 更新底沿原海报四词关键词标尺实时读数
  if (kwModule) {
    kwModule.textContent = audit.passPhase ? "正交 0%" : `错缝 ${phaseStr}`;
    kwModule.classList.toggle("is-pass", audit.passPhase);
  }
  if (kwRhythm) {
    kwRhythm.textContent = audit.passAlt ? `交替 ${audit.altPct}%` : `交替 ${audit.altPct}%`;
    kwRhythm.classList.toggle("is-pass", audit.passAlt);
  }
  if (kwContrast) {
    kwContrast.textContent = `实格 ${audit.solidRatio}%`;
    kwContrast.classList.toggle("is-pass", audit.passDensity);
  }
  if (kwOrder) {
    kwOrder.textContent = audit.amberCount === 1 ? "单金焦 1" : `${audit.amberCount} 枚金焦`;
    kwOrder.classList.toggle("is-pass", audit.passFocal);
  }
}

const heroCtrl = mountHeroCanvas(canvas, state, {
  onChange: () => {
    syncUI(evaluateBoard(state));
  },
  onAudit: (audit) => {
    syncUI(audit);
  },
});

// 剧本切换
const scriptBtns = [...document.querySelectorAll("[data-script]")];
for (const btn of scriptBtns) {
  btn.addEventListener("click", () => {
    state.script = btn.dataset.script;
    for (const b of scriptBtns) b.setAttribute("aria-pressed", String(b.dataset.script === state.script));
    heroCtrl.invalidate();
    syncUI(evaluateBoard(state));
  });
}

// 笔刷切换
const brushBtns = [...document.querySelectorAll("[data-brush]")];
for (const btn of brushBtns) {
  btn.addEventListener("click", () => {
    state.brush = btn.dataset.brush;
    for (const b of brushBtns) b.setAttribute("aria-pressed", String(b.dataset.brush === state.brush));
    syncUI(evaluateBoard(state));
  });
}

// 滑轨绑定（桌面 + 手机首屏快捷轨双向同步）
function setPhase(val) {
  let next = Number(val);
  if (Math.abs(next) <= 2) next = 0;
  state.phaseOffset = Math.max(-50, Math.min(50, Math.round(next)));
  heroCtrl.invalidate();
  syncUI(evaluateBoard(state));
}

phaseSlider?.addEventListener("input", (e) => setPhase(e.target.value));
mobPhaseSlider?.addEventListener("input", (e) => setPhase(e.target.value));

gutterSlider?.addEventListener("input", (e) => {
  state.gutter = Number(e.target.value);
  heroCtrl.invalidate();
  syncUI(evaluateBoard(state));
});

// 轴线参考线开关
const axesBtn = document.getElementById("btn-axes");
axesBtn?.addEventListener("click", () => {
  state.showAxes = !state.showAxes;
  axesBtn.setAttribute("aria-pressed", String(state.showAxes));
  axesBtn.textContent = state.showAxes ? "纵轴线：开" : "纵轴线：关";
  heroCtrl.invalidate();
});

// 演播按钮（顶部 + 手机快控共用）
for (const id of ["btn-scan", "mob-btn-scan"]) {
  document.getElementById(id)?.addEventListener("click", () => heroCtrl.triggerScan());
}

// 预设与试错加载（含一键校准与复原开场错态）
function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  state.phaseOffset = p.phaseOffset;
  state.gutter = p.gutter;
  state.cells = [...p.cells];
  state.scanActive = false;
  heroCtrl.invalidate();
  syncUI(evaluateBoard(state));
}

for (const btn of document.querySelectorAll("[data-preset]")) {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
}

// 全局 Space 快捷键（在页面顶部聚焦非输入控件时触发节拍演播）
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !/INPUT|BUTTON|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
    const heroRect = canvas.getBoundingClientRect();
    if (heroRect.bottom > 80 && heroRect.top < window.innerHeight) {
      e.preventDefault();
      heroCtrl.triggerScan();
    }
  }
});

// 初始同步
syncUI(evaluateBoard(state));

// 挂载 01–07 互动节
mountSection01();
mountSection02();
mountSection03();
mountSection04();
mountSection05();
mountSection06();
mountPosterLightbox();
