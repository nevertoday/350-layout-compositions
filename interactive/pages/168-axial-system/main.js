// 168 轴线系统 · 总装配入口
import { clamp, createInitialState, PRESETS, THEMES } from "./model.js";
import { mountHeroCanvas } from "./hero.js";
import {
  mountBalanceSection,
  mountBoundarySection,
  mountHistorySection,
  mountPosterViewer,
  mountPracticeSection,
  mountTerminusSection,
  mountXraySection,
} from "./sections.js";

let state = createInitialState("poster");

const canvas = document.getElementById("hero-canvas");
const titleAxisLine = document.getElementById("title-axis-spine");
const heroStatusPill = document.getElementById("hero-status-pill");
const themeCaption = document.getElementById("theme-caption");

// 切角诊单卡元素
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const diagFixBtn = document.getElementById("diag-fix-btn");
const statAxis = document.getElementById("stat-axis");
const statDetach = document.getElementById("stat-detach");
const statSkew = document.getElementById("stat-skew");
const statTerm = document.getElementById("stat-term");

// 控件
const axisRange = document.getElementById("ctrl-axis-x");
const axisVal = document.getElementById("val-axis-x");
const tiltRange = document.getElementById("ctrl-tilt");
const tiltVal = document.getElementById("val-tilt");
const gutterRange = document.getElementById("ctrl-gutter");
const gutterVal = document.getElementById("val-gutter");
const termToggle = document.getElementById("ctrl-terminus");
const guidesToggle = document.getElementById("ctrl-guides");
const alignAllBtn = document.getElementById("ctrl-align-all");
const resetBtn = document.getElementById("ctrl-reset");

const subAxisBtns = [...document.querySelectorAll("[data-subaxis]")];
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const appCards = [...document.querySelectorAll("[data-app-theme]")];

// 4 条原海报标尺 + 4 枚深蓝圆徽
const rulerEls = {
  axis: document.getElementById("ruler-axis"),
  align: document.getElementById("ruler-align"),
  balance: document.getElementById("ruler-balance"),
  guide: document.getElementById("ruler-guide"),
};
const coreEls = {
  axis: document.getElementById("core-organize"),
  align: document.getElementById("core-unify"),
  balance: document.getElementById("core-stability"),
  guide: document.getElementById("core-guide"),
};

let lastFixAction = "fixAlign";

function syncControlsFromState() {
  if (axisRange) axisRange.value = String(Math.round(state.axisX * 100));
  if (axisVal) axisVal.textContent = `${Math.round(state.axisX * 100)}%`;
  if (tiltRange) tiltRange.value = String(state.tiltDeg);
  if (tiltVal) tiltVal.textContent = `${state.tiltDeg > 0 ? "+" : ""}${state.tiltDeg}°`;
  if (gutterRange) gutterRange.value = String(state.gutter);
  if (gutterVal) gutterVal.textContent = `${state.gutter}px`;

  if (termToggle) {
    termToggle.setAttribute("aria-pressed", String(state.terminus));
    termToggle.textContent = state.terminus ? "端景：开" : "端景：关";
  }
  if (guidesToggle) {
    guidesToggle.setAttribute("aria-pressed", String(state.showGuides));
    guidesToggle.textContent = state.showGuides ? "辅助线：显" : "辅助线：隐";
  }

  subAxisBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.subaxis === state.subAxis)));
  themeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === state.theme)));
  appCards.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.appTheme === state.theme)));
  if (themeCaption) themeCaption.textContent = THEMES[state.theme]?.caption || "";
}

function renderTelemetry(ev) {
  const ok = ev.score === 4;
  lastFixAction = ev.verdict.fixAction || "fixAlign";

  // 自示范标题朱红中轴线围绕「轴线 | 系统」正中字缝细腻呼应（50% 时正贯字缝）
  if (titleAxisLine) {
    const pct = clamp(50 + (ev.metrics.axisPosPct - 50) * 0.24, 43, 57);
    titleAxisLine.style.setProperty("--ax", `${pct.toFixed(1)}%`);
    titleAxisLine.style.setProperty("--tilt", `${clamp(ev.metrics.tiltDeg * 0.45, -8, 8)}deg`);
    titleAxisLine.dataset.ok = String(ok);
  }

  if (heroStatusPill) {
    heroStatusPill.textContent = `${ev.score}/4 · ${ev.verdict.badge}`;
    heroStatusPill.dataset.ok = String(ok);
  }
  if (diagBadge) {
    diagBadge.textContent = `${ev.score}/4 · ${ev.verdict.badge}`;
    diagBadge.dataset.ok = String(ok);
  }
  if (diagTitle) diagTitle.textContent = ev.verdict.title;
  if (diagBody) diagBody.textContent = ev.verdict.body;
  if (diagHint) diagHint.textContent = ev.verdict.hint;
  if (diagFixBtn) {
    diagFixBtn.textContent = ev.verdict.fixLabel;
    diagFixBtn.dataset.ok = String(ok);
  }

  if (statAxis) statAxis.textContent = `${ev.metrics.axisPosPct}% · ${ev.metrics.tiltDeg >= 0 ? "+" : ""}${ev.metrics.tiltDeg}°`;
  if (statDetach) statDetach.textContent = ev.metrics.collisionCount ? `压轴 ${ev.metrics.collisionCount} 块` : `${ev.metrics.meanDetachPx}px`;
  if (statSkew) statSkew.textContent = `${ev.metrics.skewDir} ${ev.metrics.skewPct}%`;
  if (statTerm) statTerm.textContent = ev.metrics.terminus ? "蓝球已落位" : "缺失滑出";

  // 同步 4 条原海报原理标尺 + 4 枚深蓝圆徽
  for (const key of ["axis", "align", "balance", "guide"]) {
    const p = ev.pillars[key];
    const rEl = rulerEls[key];
    if (rEl) {
      rEl.dataset.ok = String(p.ok);
      const tag = rEl.querySelector(".ruler-tag");
      if (tag) tag.textContent = p.status;
    }
    const cEl = coreEls[key];
    if (cEl) {
      cEl.dataset.ok = String(p.ok);
      const tag = cEl.querySelector(".core-tag");
      if (tag) tag.textContent = p.status;
    }
  }
}

const hero = mountHeroCanvas(
  canvas,
  () => state,
  (fn) => {
    fn(state);
    syncControlsFromState();
    hero.markDirty();
  },
  renderTelemetry
);

function mutate(fn) {
  fn(state);
  syncControlsFromState();
  hero.markDirty();
}

// 一键分步纠偏（每次只修当前最致命那一条，不直接跳终态，鼓励玩家一步步理清逻辑）
function runFixAction(action) {
  mutate((st) => {
    if (action === "fixAxisPos") {
      st.axisX = 0.5;
    } else if (action === "fixSubAxis") {
      st.subAxis = "cross";
    } else if (action === "fixAlign") {
      st.items.forEach((it) => {
        it.across = false;
        it.detachPx = 0;
      });
    } else if (action === "fixTilt") {
      st.tiltDeg = st.tiltDeg >= 0 ? 10 : -10;
    } else if (action === "fixBalance") {
      st.items.forEach((it, idx) => {
        it.side = idx % 2 === 0 ? "L" : "R";
        it.across = false;
        it.detachPx = 0;
      });
      if (st.axisX < 0.34 || st.axisX > 0.66) st.axisX = 0.5;
    } else if (action === "fixTerminus") {
      st.terminus = true;
    } else if (action === "toggleGuides") {
      st.showGuides = !st.showGuides;
    }
  });
}

diagFixBtn?.addEventListener("click", () => runFixAction(lastFixAction));

axisRange?.addEventListener("input", () => mutate((st) => { st.axisX = +(Number(axisRange.value) / 100).toFixed(3); }));
tiltRange?.addEventListener("input", () => mutate((st) => { st.tiltDeg = Number(tiltRange.value); }));
gutterRange?.addEventListener("input", () => mutate((st) => { st.gutter = Number(gutterRange.value); }));

termToggle?.addEventListener("click", () => mutate((st) => { st.terminus = !st.terminus; }));
guidesToggle?.addEventListener("click", () => mutate((st) => { st.showGuides = !st.showGuides; }));
alignAllBtn?.addEventListener("click", () => runFixAction("fixAlign"));
resetBtn?.addEventListener("click", () => {
  state = createInitialState(state.theme);
  syncControlsFromState();
  hero.markDirty();
});

subAxisBtns.forEach((b) => b.addEventListener("click", () => mutate((st) => { st.subAxis = b.dataset.subaxis; })));
themeBtns.forEach((b) => b.addEventListener("click", () => mutate((st) => { st.theme = b.dataset.theme; })));
appCards.forEach((c) => {
  c.addEventListener("click", () => {
    mutate((st) => { st.theme = c.dataset.appTheme; });
    canvas?.scrollIntoView({ block: "nearest" });
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    mutate((st) => {
      st.axisX = p.patch.axisX;
      st.tiltDeg = p.patch.tiltDeg;
      st.gutter = p.patch.gutter;
      st.terminus = p.patch.terminus;
      st.subAxis = p.patch.subAxis;
      if (p.patch.showGuides !== undefined) st.showGuides = p.patch.showGuides;
      st.items = p.patch.items.map((x) => ({ ...x }));
    });
  });
});

// 画布键盘微调（方向键左右移主轴、上下微调倾角）
canvas?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutate((st) => { st.axisX = +clamp(st.axisX - 0.02, 0.16, 0.84).toFixed(3); });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    mutate((st) => { st.axisX = +clamp(st.axisX + 0.02, 0.16, 0.84).toFixed(3); });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mutate((st) => { st.tiltDeg = clamp(st.tiltDeg + 2, -18, 18); });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    mutate((st) => { st.tiltDeg = clamp(st.tiltDeg - 2, -18, 18); });
  }
});

// 挂载初始化
syncControlsFromState();
hero.markDirty();
mountXraySection();
mountBalanceSection();
mountTerminusSection();
mountHistorySection();
mountBoundarySection();
mountPracticeSection();
mountPosterViewer();
