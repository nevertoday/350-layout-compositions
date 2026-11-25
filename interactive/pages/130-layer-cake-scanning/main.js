// 130 层蛋糕扫描模式 · 主入口：统筹单真源状态、开场切片台与正文七节交互
import { mountHeroStage } from "./hero-stage.js";
import { BROKEN_ORDER, CANONICAL_ORDER, clamp, createInitialState } from "./model.js";
import { mountSections } from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("cake-canvas");
const sepSlider = document.getElementById("sep-slider");
const sepValEl = document.getElementById("sep-val");
const statusPill = document.getElementById("hero-status-pill");
const verdictTag = document.getElementById("verdict-tag");
const verdictTitle = document.getElementById("verdict-title");
const verdictBody = document.getElementById("verdict-body");
const verdictHint = document.getElementById("verdict-hint");
const guidedFixBtn = document.getElementById("btn-guided-fix");
const metricRatio = document.getElementById("m-ratio");
const metricGap = document.getElementById("m-gap");
const metricScan = document.getElementById("m-scan");
const viewToggleBtn = document.getElementById("btn-view-toggle");
const mobVerdictText = document.getElementById("mob-verdict-text");
const mobQuickFix = document.getElementById("mob-quick-fix");

const themeBtns = [...document.querySelectorAll("[data-theme]")];
const headBtns = [...document.querySelectorAll("[data-heading]")];
const rhythmBtns = [...document.querySelectorAll("[data-rhythm]")];
const actionBtns = [...document.querySelectorAll("[data-action]")];

let currentFixPatch = null;

function syncControlsFromState() {
  if (sepSlider) sepSlider.value = String(Math.round(state.separation));
  if (sepValEl) sepValEl.textContent = `${Math.round(state.separation)}%`;
  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  headBtns.forEach((b) => {
    const on = b.dataset.heading === state.headingMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  rhythmBtns.forEach((b) => {
    const on = b.dataset.rhythm === state.rhythm;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (viewToggleBtn) {
    const gazeOn = state.viewMode === "gaze";
    viewToggleBtn.textContent = gazeOn ? "眼动带：开" : "眼动带：关";
    viewToggleBtn.classList.toggle("is-active", gazeOn);
    viewToggleBtn.setAttribute("aria-pressed", String(gazeOn));
  }
}

function applyPatch(patch) {
  if (!patch) return;
  if (patch.reset) {
    Object.assign(state, createInitialState());
  } else {
    if (patch.theme !== undefined) {
      state.theme = patch.theme;
      state.expandedKey = null;
    }
    if (patch.separation !== undefined) state.separation = clamp(patch.separation, 0, 100);
    if (patch.headingMode !== undefined) state.headingMode = patch.headingMode;
    if (patch.rhythm !== undefined) state.rhythm = patch.rhythm;
    if (patch.order !== undefined) state.order = [...patch.order];
    if (patch.expandedKey !== undefined) state.expandedKey = patch.expandedKey;
    if (patch.viewMode !== undefined) state.viewMode = patch.viewMode;
    if (patch.selectedLayerIdx !== undefined) state.selectedLayerIdx = patch.selectedLayerIdx;
  }
  syncControlsFromState();
  stage.draw();
}

function renderEvaluation(ev) {
  currentFixPatch = ev.fixPatch;

  if (statusPill) {
    statusPill.textContent = ev.tierLabel;
    statusPill.className = "status-pill " + (ev.isValid ? "is-ok" : "is-fault");
  }
  if (verdictTag) {
    verdictTag.textContent = ev.tierLabel;
    verdictTag.className = "verdict-tag " + (ev.isValid ? "is-ok" : "is-fault");
  }
  if (verdictTitle) verdictTitle.textContent = ev.headline;
  if (verdictBody) verdictBody.textContent = ev.explanation;
  if (verdictHint) verdictHint.textContent = ev.hint;

  if (guidedFixBtn) {
    if (ev.fixPatch && ev.fixLabel) {
      guidedFixBtn.hidden = false;
      guidedFixBtn.textContent = ev.fixLabel;
    } else {
      guidedFixBtn.hidden = true;
    }
  }
  if (mobVerdictText) mobVerdictText.textContent = ev.headline;
  if (mobQuickFix) {
    if (ev.fixPatch && ev.fixLabel) {
      mobQuickFix.hidden = false;
      mobQuickFix.textContent = ev.fixLabel.length > 9 ? "一键修复" : ev.fixLabel;
    } else {
      mobQuickFix.hidden = true;
    }
  }

  if (metricRatio) metricRatio.textContent = ev.metrics.sizeRatio;
  if (metricGap) metricGap.textContent = ev.metrics.gapPx;
  if (metricScan) metricScan.textContent = ev.metrics.scanTier.split(" · ")[0] + "（示意）";

  // 同步原海报右侧 5 项「核心原则」活体指示灯
  for (const p of ev.principles) {
    const row = document.querySelector(`[data-principle="${p.id}"]`);
    if (!row) continue;
    row.classList.toggle("is-pass", p.pass);
    row.classList.toggle("is-fail", !p.pass);
    const badge = row.querySelector(".p-badge");
    const note = row.querySelector(".p-reason");
    if (badge) badge.textContent = p.badge;
    if (note) note.textContent = p.reason;
  }

  // 同步首屏底沿 4 项原海报「带来的价值」实况条
  for (const v of ev.values) {
    const card = document.querySelector(`[data-value="${v.id}"]`);
    if (!card) continue;
    card.classList.toggle("is-ok", v.ok);
    const st = card.querySelector(".v-status");
    if (st) st.textContent = v.status;
  }
}

const stage = mountHeroStage(
  canvas,
  () => state,
  applyPatch,
  renderEvaluation
);

// 绑定所有开场控台按钮与滑轨
sepSlider?.addEventListener("input", () => {
  applyPatch({ separation: Number(sepSlider.value) });
});

themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ theme: btn.dataset.theme }));
});

headBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ headingMode: btn.dataset.heading }));
});

rhythmBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyPatch({ rhythm: btn.dataset.rhythm }));
});

viewToggleBtn?.addEventListener("click", () => {
  applyPatch({ viewMode: state.viewMode === "gaze" ? "clean" : "gaze" });
});

guidedFixBtn?.addEventListener("click", () => {
  if (currentFixPatch) applyPatch(currentFixPatch);
});
mobQuickFix?.addEventListener("click", () => {
  if (currentFixPatch) applyPatch(currentFixPatch);
});

actionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const act = btn.dataset.action;
    if (act === "poster-solve") {
      applyPatch({ separation: 64, headingMode: "clear", rhythm: "poster", order: [...CANONICAL_ORDER], expandedKey: null });
    } else if (act === "compact-solve") {
      applyPatch({ separation: 50, headingMode: "clear", rhythm: "left", order: ["overview", "points", "verify", "detail", "action"], expandedKey: null });
    } else if (act === "fix-order") {
      applyPatch({ order: [...CANONICAL_ORDER] });
    } else if (act === "break-shatter") {
      applyPatch({ separation: 96, headingMode: "clear", rhythm: "poster", order: [...CANONICAL_ORDER] });
    } else if (act === "break-order") {
      applyPatch({ order: [...BROKEN_ORDER] });
    } else if (act === "reset") {
      applyPatch({ reset: true });
    }
  });
});

// 点原海报右侧「核心原则」条目时，直接聚焦引导或修该项
document.querySelectorAll("[data-principle]").forEach((row) => {
  row.addEventListener("click", () => {
    const id = row.dataset.principle;
    if (id === "layers" && (state.separation < 36 || state.separation > 84)) {
      applyPatch({ separation: 64 });
    } else if (id === "skim") {
      applyPatch({ headingMode: state.headingMode === "clear" ? "vague" : "clear" });
    } else if (id === "stripes") {
      applyPatch({ rhythm: state.rhythm === "poster" ? "left" : "poster" });
    } else if (id === "hierarchy") {
      applyPatch({ order: [...CANONICAL_ORDER] });
    } else if (id === "focus") {
      applyPatch({ separation: 64, headingMode: "clear", rhythm: "poster" });
    }
  });
});

syncControlsFromState();
stage.draw();
mountSections();
