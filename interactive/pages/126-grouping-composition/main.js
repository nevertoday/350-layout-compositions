// 126 群组构图 · 主入口：串联开场单真源玩具、右侧三轴标注边栏、底沿四柱与 01–07 节交互

import {
  PRESETS,
  SORTED_ASSIGNMENTS,
  SCRAMBLED_ASSIGNMENTS,
  applyPreset,
  clamp,
  createInitialState,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import {
  initAvoidDeck,
  initChunkStepper,
  initConflictLab,
  initLayerPeeler,
  initPosterLightbox,
  initQuiz,
  initRefactorShowcase,
  initSearchLab,
} from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const topBadge = document.getElementById("hero-status-pill");
const titleMark = document.getElementById("title-glyph");

// 载体切签
const carrierBtns = [...document.querySelectorAll("[data-carrier]")];
// 右侧三轴标注控件
const shapeBtns = [...document.querySelectorAll("[data-shape-rule]")];
const colorBtns = [...document.querySelectorAll("[data-color-rule]")];
const modeBtns = [...document.querySelectorAll("[data-layout-mode]")];
const interRange = document.getElementById("range-inter");
const intraRange = document.getElementById("range-intra");
const interVal = document.getElementById("val-inter");
const intraVal = document.getElementById("val-intra");
const guideToggle = document.getElementById("toggle-guides");

// 快捷预设与试错
const presetBtns = [...document.querySelectorAll("[data-preset]")];

// 诊断卡（复刻 126 原海报底右圆角黑框白勾卡）
const diagCard = document.getElementById("diag-card");
const diagIcon = document.getElementById("diag-icon");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagReason = document.getElementById("diag-reason");
const diagStep = document.getElementById("diag-step");
const diagFixBtn = document.getElementById("diag-fix-btn");
const mRatio = document.getElementById("m-ratio");
const mGroups = document.getElementById("m-groups");
const mPurity = document.getElementById("m-purity");
const mTier = document.getElementById("m-tier");

// 三条原海报虚线箭边栏实况签
const calloutShapeBadge = document.getElementById("callout-shape-state");
const calloutColorBadge = document.getElementById("callout-color-state");
const calloutSpaceBadge = document.getElementById("callout-space-state");

// 底沿四柱实时感知卡（聚类｜间距｜模块｜组织）
const pillarEls = {
  cluster: document.getElementById("pillar-cluster"),
  spacing: document.getElementById("pillar-spacing"),
  module: document.getElementById("pillar-module"),
  organize: document.getElementById("pillar-organize"),
};

let stageCtrl = null;
let currentFixId = null;

function syncUI(ev) {
  const isPass = ev.statusCode === "pass";
  const { layout } = ev;

  // 顶眉状态签与自示范标题徽标
  if (topBadge) {
    topBadge.textContent = ev.badgeFull;
    topBadge.dataset.state = isPass ? "ok" : "bad";
  }
  if (titleMark) {
    titleMark.dataset.grouped = String(isPass);
  }

  // 右侧三轴虚线箭实况态
  if (calloutShapeBadge) {
    const ok = layout.shapePurity >= 90 && state.layoutMode !== "one";
    calloutShapeBadge.textContent = ok ? `同形 ${layout.shapePurity}%` : `混形 ${layout.shapePurity}%`;
    calloutShapeBadge.dataset.state = ok ? "ok" : "bad";
  }
  if (calloutColorBadge) {
    const ok = !layout.cueConflict && (!layout.colorCueActive || layout.colorPurity >= 90) && state.layoutMode !== "one";
    calloutColorBadge.textContent = !layout.colorCueActive
      ? "去色盲测"
      : layout.cueConflict
        ? "色形冲突"
        : ok
          ? `同色 ${layout.colorPurity}%`
          : `杂色 ${layout.colorPurity}%`;
    calloutColorBadge.dataset.state = ok ? "ok" : "bad";
  }
  if (calloutSpaceBadge) {
    const ok = layout.spacingRatio >= 1.65 && layout.spacingRatio <= 4.65 && state.layoutMode !== "one";
    calloutSpaceBadge.textContent = `${ev.ratioStr} · ${layout.perceivedGroups}组`;
    calloutSpaceBadge.dataset.state = ok ? "ok" : "bad";
  }

  // 按钮激活态
  for (const b of carrierBtns) b.setAttribute("aria-pressed", String(b.dataset.carrier === state.carrier));
  for (const b of shapeBtns) b.setAttribute("aria-pressed", String(b.dataset.shapeRule === state.shapeRule));
  for (const b of colorBtns) b.setAttribute("aria-pressed", String(b.dataset.colorRule === state.colorRule));
  for (const b of modeBtns) b.setAttribute("aria-pressed", String(b.dataset.layoutMode === state.layoutMode));
  for (const b of presetBtns) b.setAttribute("aria-pressed", String(b.dataset.preset === state.activePreset));

  // 滑杆读数（直接反映真实测得像素与比例）
  if (interRange) interRange.value = String(Math.round(state.interGap * 100));
  if (intraRange) intraRange.value = String(Math.round(state.intraGap * 100));
  if (interVal) interVal.textContent = state.layoutMode === "one" ? "0px" : `${Math.round(layout.interPx)}px (${ev.ratioStr})`;
  if (intraVal) intraVal.textContent = `${Math.round(layout.intraPx)}px`;
  if (guideToggle) {
    guideToggle.setAttribute("aria-pressed", String(state.showGuides));
    guideToggle.textContent = state.showGuides ? "标注引线：开" : "标注引线：关";
  }

  // 原海报同款圆角黑框诊断卡
  if (diagCard) diagCard.dataset.state = isPass ? "ok" : "bad";
  if (diagIcon) diagIcon.textContent = isPass ? "✓" : "!";
  if (diagBadge) diagBadge.textContent = ev.badgeFull;
  if (diagHeadline) diagHeadline.textContent = ev.headline;
  if (diagReason) diagReason.textContent = ev.reason;
  if (diagStep) diagStep.textContent = ev.nextStep;

  currentFixId = ev.quickFix ? ev.quickFix.id : null;
  if (diagFixBtn) {
    if (ev.quickFix) {
      diagFixBtn.hidden = false;
      diagFixBtn.textContent = ev.quickFix.label;
    } else {
      diagFixBtn.hidden = true;
    }
  }

  if (mRatio) mRatio.textContent = ev.ratioStr;
  if (mGroups) mGroups.textContent = `${layout.perceivedGroups} 组`;
  if (mPurity) mPurity.textContent = `${ev.purityMin}%`;
  if (mTier) mTier.textContent = ev.tier;

  // 底沿四柱（聚类｜间距｜模块｜组织）
  for (const p of ev.pillars) {
    const el = pillarEls[p.id];
    if (!el) continue;
    el.dataset.state = p.state;
    const valEl = el.querySelector(".pillar-val");
    const subEl = el.querySelector(".pillar-sub");
    if (valEl) valEl.textContent = p.value;
    if (subEl) subEl.textContent = p.detail;
  }
}

function update() {
  if (!stageCtrl) return;
  const ev = stageCtrl.refresh();
  syncUI(ev);
}

// ---------- 挂载开场画布 ----------
if (canvas) {
  stageCtrl = mountHeroCanvas(canvas, state, () => {
    syncUI(stageCtrl.getEval());
  });
  syncUI(stageCtrl.getEval());
}

// ---------- 绑定开场全部控件 ----------
for (const b of carrierBtns) {
  b.addEventListener("click", () => {
    state.carrier = b.dataset.carrier;
    update();
  });
}

for (const b of shapeBtns) {
  b.addEventListener("click", () => {
    const rule = b.dataset.shapeRule;
    state.shapeRule = rule;
    if (rule === "sorted") {
      if (state.colorRule === "sorted" || state.colorRule === "mono") {
        state.assignments = [...SORTED_ASSIGNMENTS];
      }
    } else {
      state.assignments = [...SCRAMBLED_ASSIGNMENTS];
    }
    state.activePreset = "";
    update();
  });
}

for (const b of colorBtns) {
  b.addEventListener("click", () => {
    const rule = b.dataset.colorRule;
    state.colorRule = rule;
    if (rule === "sorted" && state.shapeRule === "sorted") {
      state.assignments = [...SORTED_ASSIGNMENTS];
    } else if (rule === "mixed") {
      state.assignments = [...SCRAMBLED_ASSIGNMENTS];
    }
    state.activePreset = "";
    update();
  });
}

for (const b of modeBtns) {
  b.addEventListener("click", () => {
    state.layoutMode = b.dataset.layoutMode;
    if (state.layoutMode !== "one" && state.interGap < 0.12) {
      state.interGap = 0.48;
    }
    state.activePreset = "";
    update();
  });
}

interRange?.addEventListener("input", () => {
  if (state.layoutMode === "one") state.layoutMode = "four";
  state.interGap = clamp(Number(interRange.value) / 100, 0.02, 1.0);
  state.activePreset = "";
  update();
});

intraRange?.addEventListener("input", () => {
  state.intraGap = clamp(Number(intraRange.value) / 100, 0.0, 1.0);
  state.activePreset = "";
  update();
});

guideToggle?.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  update();
});

for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const key = b.dataset.preset;
    if (PRESETS[key]) {
      applyPreset(state, key);
      update();
    }
  });
}

diagFixBtn?.addEventListener("click", () => {
  if (!currentFixId) return;
  if (currentFixId === "fix-color") {
    state.colorRule = "sorted";
  } else if (currentFixId === "fix-four") {
    state.layoutMode = "four";
    if (state.interGap < 0.35) state.interGap = 0.44;
  } else if (currentFixId === "fix-intra") {
    state.intraGap = 0.26;
  } else if (currentFixId === "fix-gap") {
    if (state.layoutMode === "one") state.layoutMode = "four";
    state.interGap = 0.44;
    state.intraGap = 0.26;
  } else if (currentFixId === "fix-sort") {
    state.shapeRule = "sorted";
    if (state.colorRule === "mixed" || state.colorRule === "conflict") state.colorRule = "sorted";
    state.assignments = [...SORTED_ASSIGNMENTS];
  } else if (currentFixId === "fix-balance") {
    state.interGap = 0.44;
    state.intraGap = 0.26;
  }
  state.activePreset = "";
  update();
});

// ---------- 启动 01–07 节独立交互 ----------
initSearchLab();
initLayerPeeler();
initConflictLab();
initChunkStepper();
initRefactorShowcase();
initAvoidDeck();
initQuiz();
initPosterLightbox();
