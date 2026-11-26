// 141 文字主导 版式 — 主入口
import {
  CONTEXTS,
  FAIL_PRESETS,
  INITIAL_STATE,
  VALID_PRESETS,
  clamp,
} from "./model.js";
import { createProofStage } from "./stage-canvas.js";
import {
  initHistoryDrawers,
  initLeversMatrix,
  initPosterLightbox,
  initQuiz,
  initRhythmSequencer,
  initScenarioTriage,
  initSquintLab,
} from "./sections.js";

const state = { ...INITIAL_STATE };

const heroCanvas = document.getElementById("proof-canvas");
const waveCanvas = document.getElementById("wave-canvas");

// 控件引用
const scaleRange = document.getElementById("ctrl-scale");
const scaleVal = document.getElementById("val-scale");
const leadRange = document.getElementById("ctrl-leading");
const leadVal = document.getElementById("val-leading");
const imgRange = document.getElementById("ctrl-image");
const imgVal = document.getElementById("val-image");
const mobileScaleRange = document.getElementById("mobile-scale");
const mobileScaleVal = document.getElementById("mobile-val-scale");

const ctxBtns = [...document.querySelectorAll("[data-context]")];
const weightBtns = [...document.querySelectorAll("[data-weight-diff]")];
const alignBtns = [...document.querySelectorAll("[data-align]")];
const validBtns = [...document.querySelectorAll("[data-valid-preset]")];
const failBtns = [...document.querySelectorAll("[data-fail-preset]")];
const guidesBtn = document.getElementById("btn-guides");
const sweepBtns = [...document.querySelectorAll("[data-action='sweep']")];
const fixBtns = [...document.querySelectorAll("[data-action='fix']")];
const resetBtns = [...document.querySelectorAll("[data-action='reset']")];

// 单真源 DOM 读数绑定
const dom = {
  heroBadge: document.getElementById("hero-status-badge"),
  verdictCard: document.getElementById("verdict-card"),
  verdictBadge: document.getElementById("verdict-badge"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictWhy: document.getElementById("verdict-why"),
  verdictAction: document.getElementById("verdict-action"),
  mobileVerdictBadge: document.getElementById("mobile-verdict-badge"),
  mobileVerdictTitle: document.getElementById("mobile-verdict-title"),
  probeHierarchy: document.getElementById("probe-hierarchy"),
  probeLeading: document.getElementById("probe-leading"),
  probeSize: document.getElementById("probe-size"),
  probeRhythm: document.getElementById("probe-rhythm"),
  waveLabel: document.getElementById("wave-label"),
  cardHierarchyStat: document.getElementById("card-stat-hierarchy"),
  cardLeadingStat: document.getElementById("card-stat-leading"),
  cardSizeStat: document.getElementById("card-stat-size"),
};

function syncControls() {
  if (scaleRange) scaleRange.value = String(state.scaleRatio);
  if (scaleVal) scaleVal.textContent = `${state.scaleRatio.toFixed(2)}×`;
  if (mobileScaleRange) mobileScaleRange.value = String(state.scaleRatio);
  if (mobileScaleVal) mobileScaleVal.textContent = `${state.scaleRatio.toFixed(2)}×`;

  if (leadRange) leadRange.value = String(state.leading);
  if (leadVal) leadVal.textContent = `${state.leading.toFixed(2)}×`;

  if (imgRange) imgRange.value = String(state.imageShare);

  ctxBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.context === state.context)));
  weightBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.weightDiff) === state.weightDiff)));
  alignBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.align === state.align)));
  if (guidesBtn) {
    guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
    guidesBtn.textContent = state.showGuides ? "标尺：开" : "标尺：关";
  }
}

const WAVE_NAMES = {
  harmonic: "舒畅正弦节律波",
  flatline: "平权死直线（无起伏）",
  cramped: "高频挤压撞行波",
  jagged: "乱轴 / 抢戏锯齿噪波",
  broken: "散行断气虚散波",
};

function syncReadouts(layout, ev) {
  const m = layout.metrics;
  const v = ev.verdict;

  // 滑块旁读数统一由实绘单真源回填，杜绝滑杆与诊单数字打架
  if (imgVal) imgVal.textContent = `${m.imageShare}%`;

  if (dom.heroBadge) {
    dom.heroBadge.textContent = v.badge;
    dom.heroBadge.dataset.state = v.ok ? "ok" : "fail";
  }
  if (dom.verdictCard) dom.verdictCard.dataset.state = v.ok ? "ok" : "fail";
  if (dom.verdictBadge) dom.verdictBadge.textContent = v.badge;
  if (dom.verdictTitle) dom.verdictTitle.textContent = v.title;
  if (dom.verdictWhy) dom.verdictWhy.textContent = v.why;
  if (dom.verdictAction) dom.verdictAction.textContent = v.action;

  if (dom.mobileVerdictBadge) {
    dom.mobileVerdictBadge.textContent = v.badge;
    dom.mobileVerdictBadge.dataset.state = v.ok ? "ok" : "fail";
  }
  if (dom.mobileVerdictTitle) dom.mobileVerdictTitle.textContent = v.title;

  const setProbe = (el, p) => {
    if (!el) return;
    el.textContent = p.tag;
    el.dataset.state = p.status;
  };
  setProbe(dom.probeHierarchy, ev.probes.hierarchy);
  setProbe(dom.probeLeading, ev.probes.leading);
  setProbe(dom.probeSize, ev.probes.size);
  setProbe(dom.probeRhythm, ev.probes.rhythm);

  if (dom.waveLabel) dom.waveLabel.textContent = WAVE_NAMES[ev.waveMode] || "";

  if (dom.cardHierarchyStat) {
    dom.cardHierarchyStat.textContent = `首眼：${layout.scanOrder[0]?.label || "主标"} · 重差 ${m.weightDiff}`;
    dom.cardHierarchyStat.dataset.state = ev.probes.hierarchy.status;
  }
  if (dom.cardLeadingStat) {
    dom.cardLeadingStat.textContent = `实测 ${m.leading}×（行间白带 ${m.lineGapPct}%）`;
    dom.cardLeadingStat.dataset.state = ev.probes.leading.status;
  }
  if (dom.cardSizeStat) {
    dom.cardSizeStat.textContent = `主 ${m.titleSizePx}px / 正 ${m.bodySizePx}px（${m.titleToBody}×）`;
    dom.cardSizeStat.dataset.state = ev.probes.size.status;
  }
}

let stage = null;

function applyPatch(patch) {
  Object.assign(state, patch);
  syncControls();
  stage?.markDirty();
}

if (heroCanvas) {
  stage = createProofStage(
    heroCanvas,
    waveCanvas,
    () => state,
    (patch) => applyPatch(patch),
    (layout, ev) => syncReadouts(layout, ev)
  );
  // 供交互自检脚本读取单真源状态（只读）
  window.__p141 = {
    getState: () => ({ ...state }),
    getSnapshot: () => stage.getSnapshot(),
  };
}

// 控件事件
scaleRange?.addEventListener("input", () => applyPatch({ scaleRatio: Number(scaleRange.value) }));
mobileScaleRange?.addEventListener("input", () => applyPatch({ scaleRatio: Number(mobileScaleRange.value) }));
leadRange?.addEventListener("input", () => applyPatch({ leading: Number(leadRange.value) }));
imgRange?.addEventListener("input", () => applyPatch({ imageShare: Number(imgRange.value) }));

ctxBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const id = b.dataset.context;
    if (CONTEXTS[id]) applyPatch({ context: id });
  });
});

weightBtns.forEach((b) => {
  b.addEventListener("click", () => applyPatch({ weightDiff: Number(b.dataset.weightDiff) }));
});

alignBtns.forEach((b) => {
  b.addEventListener("click", () => applyPatch({ align: b.dataset.align }));
});

validBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const preset = VALID_PRESETS[b.dataset.validPreset];
    if (preset) applyPatch({ ...preset.patch });
  });
});

failBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const preset = FAIL_PRESETS[b.dataset.failPreset];
    if (preset) applyPatch({ ...preset.patch });
  });
});

guidesBtn?.addEventListener("click", () => applyPatch({ showGuides: !state.showGuides }));

sweepBtns.forEach((b) => b.addEventListener("click", () => stage?.triggerSweep()));
fixBtns.forEach((b) => b.addEventListener("click", () => applyPatch({ ...VALID_PRESETS.classic.patch })));
resetBtns.forEach((b) => b.addEventListener("click", () => applyPatch({ ...INITIAL_STATE, context: state.context })));

// 键盘操作：焦点在画布或页面空白区时，方向键微调字阶/行距，空格演播扫读路径
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const dialog = document.getElementById("poster-dialog");
  if (dialog && !dialog.hidden) return;

  if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    e.preventDefault();
    stage?.triggerSweep();
  } else if (document.activeElement === heroCanvas) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      applyPatch({ scaleRatio: +clamp(state.scaleRatio + 0.04, 1.0, 1.62).toFixed(2) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyPatch({ scaleRatio: +clamp(state.scaleRatio - 0.04, 1.0, 1.62).toFixed(2) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      applyPatch({ leading: +clamp(state.leading + 0.08, 0.95, 2.55).toFixed(2) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      applyPatch({ leading: +clamp(state.leading - 0.08, 0.95, 2.55).toFixed(2) });
    }
  }
});

syncControls();

// 初始化正文七节差异化交互
initSquintLab();
initLeversMatrix();
initRhythmSequencer();
initHistoryDrawers();
initScenarioTriage();
initQuiz();
initPosterLightbox();
