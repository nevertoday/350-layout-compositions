// 219 直排中西文直立 — 主入口
import { INITIAL_STATE, PRESETS, clamp } from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

const state = { ...INITIAL_STATE };

const canvas = document.getElementById("hero-canvas");
const mobilePill = document.getElementById("mobile-status-pill");
const auditCard = document.querySelector(".audit-card");
const auditPill = document.getElementById("audit-pill");
const auditTitle = document.getElementById("audit-title");
const auditBody = document.getElementById("audit-body");
const auditHint = document.getElementById("audit-hint");
const btnFixAll = document.getElementById("btn-fix-all");
const btnScan = document.getElementById("btn-scan");
const btnGuides = document.getElementById("btn-guides");

const mForm = document.getElementById("m-form");
const mAxis = document.getElementById("m-axis");
const mStep = document.getElementById("m-step");
const mFoot = document.getElementById("m-foot");

const ctrlAxis = document.getElementById("ctrl-axis");
const ctrlStep = document.getElementById("ctrl-step");
const ctrlScale = document.getElementById("ctrl-scale");
const valAxis = document.getElementById("val-axis");
const valStep = document.getElementById("val-step");
const valScale = document.getElementById("val-scale");

const specBtns = [...document.querySelectorAll("[data-specimen]")];
const caseBtns = [...document.querySelectorAll("[data-case]")];
const divBtns = [...document.querySelectorAll("[data-divider]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const bracketBtns = [...document.querySelectorAll("[data-highlight]")];

const probeEls = {
  upright: { row: document.getElementById("probe-upright"), chip: document.querySelector('[data-probe-chip="upright"]') },
  alignment: { row: document.getElementById("probe-alignment"), chip: document.querySelector('[data-probe-chip="alignment"]') },
  rhythm: { row: document.getElementById("probe-rhythm"), chip: document.querySelector('[data-probe-chip="rhythm"]') },
  integration: { row: document.getElementById("probe-integration"), chip: document.querySelector('[data-probe-chip="integration"]') },
};

let latestAudit = null;

function syncControls() {
  ctrlAxis.value = String(state.axisOffset);
  ctrlStep.value = String(state.stepRatio);
  ctrlScale.value = String(state.latinScale);

  valAxis.textContent = state.axisOffset === 0
    ? "居中 0%"
    : `${state.axisOffset < 0 ? "左" : "右"}偏 ${Math.abs(state.axisOffset)}%`;
  valStep.textContent = `${state.stepRatio.toFixed(2)}×`;
  valScale.textContent = `${Math.round(state.latinScale * 100)}%`;

  for (const b of specBtns) {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of caseBtns) {
    const on = b.dataset.case === state.caseMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of divBtns) {
    const on = b.dataset.divider === state.dividerMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of bracketBtns) {
    const on = b.dataset.highlight === state.highlightPrinciple;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  btnGuides.textContent = state.showGuides ? "中轴标尺：开" : "中轴标尺：关";
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
}

function syncAudit(audit) {
  latestAudit = audit;
  auditCard.classList.toggle("is-ok", audit.allGood);
  auditPill.textContent = audit.statusPill;
  auditPill.className = `status-pill ${audit.allGood ? "is-ok" : "is-bad"}`;
  if (mobilePill) {
    mobilePill.textContent = audit.statusPill;
    mobilePill.className = `status-pill ${audit.allGood ? "is-ok" : "is-bad"}`;
  }
  auditTitle.textContent = audit.headline;
  auditBody.textContent = audit.body;
  auditHint.textContent = audit.hint;

  if (audit.allGood) {
    btnFixAll.textContent = "已达 4/4 · 复原开场错态";
  } else {
    const left = Math.max(1, 4 - audit.score);
    btnFixAll.textContent = `一键校准全部（剩 ${left} 处）`;
  }

  mForm.textContent = audit.readouts.form;
  mAxis.textContent = audit.readouts.axis;
  mStep.textContent = audit.readouts.step;
  mFoot.textContent = audit.readouts.foot;

  for (const [k, info] of Object.entries(audit.probes)) {
    const el = probeEls[k];
    if (!el || !el.row) continue;
    el.row.classList.toggle("is-ok", info.ok);
    el.row.classList.toggle("is-bad", !info.ok);
    el.chip.textContent = info.chip;
  }
}

const stage = mountHeroStage(
  canvas,
  () => state,
  (patch, opts) => {
    Object.assign(state, patch);
    syncControls();
    if (!opts?.deferDraw) stage.draw();
  },
  syncAudit
);

function updateState(patch) {
  Object.assign(state, patch);
  syncControls();
  stage.draw();
}

// 标本切换
for (const b of specBtns) {
  b.addEventListener("click", () => {
    const nextSpec = b.dataset.specimen;
    if (nextSpec === state.specimen) return;
    updateState({ specimen: nextSpec });
  });
}

// 姿态与分隔
for (const b of caseBtns) {
  b.addEventListener("click", () => updateState({ caseMode: b.dataset.case }));
}
for (const b of divBtns) {
  b.addEventListener("click", () => updateState({ dividerMode: b.dataset.divider }));
}

// 三个滑块
ctrlAxis.addEventListener("input", () => {
  let v = parseInt(ctrlAxis.value, 10);
  if (Math.abs(v) <= 2) v = 0;
  updateState({ axisOffset: v });
});
ctrlStep.addEventListener("input", () => {
  updateState({ stepRatio: parseFloat(ctrlStep.value) });
});
ctrlScale.addEventListener("input", () => {
  updateState({ latinScale: parseFloat(ctrlScale.value) });
});

// 辅助线开关
btnGuides.addEventListener("click", () => {
  updateState({ showGuides: !state.showGuides });
});

// 原海报三枚 [ 括号高亮联动
for (const b of bracketBtns) {
  b.addEventListener("click", () => {
    const key = b.dataset.highlight;
    updateState({ highlightPrinciple: state.highlightPrinciple === key ? null : key });
  });
}

// 一键校准 / 复原
btnFixAll.addEventListener("click", () => {
  if (latestAudit && latestAudit.allGood) {
    updateState({ ...INITIAL_STATE });
  } else if (latestAudit) {
    updateState(latestAudit.fullFixPatch);
  }
});

// 演播纵读视线光带
btnScan.addEventListener("click", () => stage.triggerScan());

// 多解与试错预设
for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) updateState(p.patch);
  });
}

// 键盘操作（焦点在输入框/滑块外生效）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const modal = document.getElementById("poster-lightbox");
  if (modal && !modal.hidden) return;

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    updateState({ axisOffset: clamp(state.axisOffset - 4, -40, 40) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    updateState({ axisOffset: clamp(state.axisOffset + 4, -40, 40) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    updateState({ stepRatio: +(clamp(state.stepRatio - 0.04, 0.82, 2.05)).toFixed(2) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    updateState({ stepRatio: +(clamp(state.stepRatio + 0.04, 0.82, 2.05)).toFixed(2) });
  } else if (e.key === "c" || e.key === "C") {
    const order = ["lower", "upper", "sideways"];
    updateState({ caseMode: order[(order.indexOf(state.caseMode) + 1) % order.length] });
  } else if (e.key === " " && tag !== "BUTTON") {
    e.preventDefault();
    stage.triggerScan();
  }
});

syncControls();

// 启动正文各节交互
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
