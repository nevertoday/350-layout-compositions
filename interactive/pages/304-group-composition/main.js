// 304 群像构图 — 主入口：连接开场多层剪纸排演台、单真源诊单、原则圆徽与 01–07 节互动实验
import { createInitialState, clonePreset } from "./model.js";
import { mountHeroStage } from "./stage-canvas.js";
import { SCENARIOS } from "./palette.js";
import {
  initOriginSection,
  initSplitCurtainSection,
  initDepthLabSection,
  initDensityStripperSection,
  initDontUseCards,
  initQuizSection,
  initPosterLightbox,
} from "./sections.js";

let state = createInitialState();

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const scenarioWrap = document.getElementById("scenario-tabs");
const scenarioCaption = document.getElementById("scenario-caption");
const heroScorePill = document.getElementById("hero-score-pill");
const mobileScorePill = document.getElementById("mobile-score-pill");
const spreadRange = document.getElementById("ctrl-spread");
const spreadVal = document.getElementById("ctrl-spread-val");
const countRange = document.getElementById("ctrl-count");
const countVal = document.getElementById("ctrl-count-val");
const brushWrap = document.getElementById("ctrl-brush");
const presetWrap = document.getElementById("ctrl-presets");
const gazeBtn = document.getElementById("btn-gaze");
const calloutBtn = document.getElementById("btn-callouts");

// 左侧 5 枚原海报圆徽原则探针
const probeList = document.getElementById("probe-list");

// 底部单真源导演诊单 & 五步活体进度格 & 集中式 VS 分散式极性舱
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const diagFixBtn = document.getElementById("diag-fix-btn");
const diagResetBtn = document.getElementById("diag-reset-btn");
const mWeightEl = document.getElementById("m-weight");
const mCovEl = document.getElementById("m-cov");
const mHeightEl = document.getElementById("m-height");
const mComEl = document.getElementById("m-com");
const stepsGrid = document.getElementById("takeaway-steps");
const btnConcentrated = document.getElementById("vs-concentrated");
const btnDispersed = document.getElementById("vs-dispersed");
const vsStatus = document.getElementById("vs-status");

let heroStage = null;

function syncControlValues() {
  if (spreadRange) spreadRange.value = String(state.spread);
  if (spreadVal) spreadVal.textContent = state.spread <= 36 ? `集中 ${state.spread}%` : state.spread >= 64 ? `分散 ${state.spread}%` : `过渡 ${state.spread}%`;
  if (countRange) countRange.value = String(state.count);
  if (countVal) countVal.textContent = `${state.count} 人`;

  if (scenarioWrap) {
    [...scenarioWrap.querySelectorAll("button[data-scenario]")].forEach((b) => {
      const active = b.dataset.scenario === state.scenario;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  if (scenarioCaption) {
    scenarioCaption.textContent = SCENARIOS[state.scenario]?.caption || "";
  }
  if (brushWrap) {
    [...brushWrap.querySelectorAll("button[data-brush]")].forEach((b) => {
      const active = b.dataset.brush === state.brush;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  if (presetWrap) {
    [...presetWrap.querySelectorAll("button[data-preset]")].forEach((b) => {
      const active = b.dataset.preset === state.presetId;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  if (calloutBtn) {
    calloutBtn.setAttribute("aria-pressed", String(state.showCallouts));
    calloutBtn.textContent = state.showCallouts ? "虚线标注：开" : "虚线标注：关";
  }
}

function updateDomFromEval(ev) {
  if (!ev) return;
  const { score, checks, steps, diagnosis, metrics, polarity } = ev;
  const isOk = score === 5;

  // 顶栏与移动端得分徽章
  for (const el of [heroScorePill, mobileScorePill]) {
    if (!el) continue;
    el.textContent = diagnosis.badge;
    el.classList.toggle("is-ok", isOk);
    el.classList.toggle("is-err", !isOk);
  }

  // 左侧 5 枚原海报圆徽原则探针
  if (probeList) {
    [...probeList.querySelectorAll("button[data-probe]")].forEach((btn) => {
      const key = btn.dataset.probe;
      const c = checks[key];
      if (!c) return;
      const tag = btn.querySelector(".probe-tag");
      if (tag) {
        tag.textContent = c.ok ? `✓ ${c.tag}` : c.tag;
        tag.classList.toggle("is-ok", c.ok);
        tag.classList.toggle("is-err", !c.ok);
      }
      const selected = state.activeProbe === key;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });
  }

  // 单真源导演白话诊单
  if (diagBadge) {
    diagBadge.textContent = diagnosis.badge;
    diagBadge.classList.toggle("is-ok", isOk);
    diagBadge.classList.toggle("is-err", !isOk);
  }
  if (diagHeadline) diagHeadline.textContent = diagnosis.headline;
  if (diagWhy) diagWhy.textContent = diagnosis.why;
  if (diagAction) diagAction.textContent = diagnosis.action;
  if (diagFixBtn) {
    diagFixBtn.textContent = diagnosis.fixLabel;
    diagFixBtn.dataset.target = diagnosis.fixPreset || diagnosis.fixTarget || "poster";
  }

  const comDir = Math.abs(metrics.comOffset) < 0.03
    ? "居中"
    : metrics.comOffset > 0
    ? `右偏 ${Math.round(metrics.comOffset * 100)}%`
    : `左偏 ${Math.round(-metrics.comOffset * 100)}%`;
  if (mWeightEl) mWeightEl.textContent = `${metrics.weightRatio.toFixed(2)}×`;
  if (mCovEl) mCovEl.textContent = `${metrics.coveragePct}%`;
  if (mHeightEl) mHeightEl.textContent = `${metrics.heightRatio.toFixed(2)}×`;
  if (mComEl) mComEl.textContent = comDir;

  // 底部五步关键要点活体进度格
  if (stepsGrid) {
    steps.forEach((st) => {
      const cell = stepsGrid.querySelector(`[data-step="${st.id}"]`);
      if (!cell) return;
      cell.classList.toggle("is-ok", st.ok);
      const badge = cell.querySelector(".step-state");
      if (badge) badge.textContent = st.ok ? "✓ 已成立" : "待调校";
    });
  }

  // 集中式 VS 分散式极性舱状态
  if (btnConcentrated && btnDispersed) {
    btnConcentrated.classList.toggle("is-current", polarity === "concentrated");
    btnDispersed.classList.toggle("is-current", polarity === "dispersed");
  }
  if (vsStatus) {
    vsStatus.textContent =
      polarity === "concentrated"
        ? "当前画布呈「集中式」：主体向心凝聚"
        : polarity === "dispersed"
        ? `当前画布呈「分散式」：${metrics.clustersCount} 个子群落透气分布`
        : "当前画布尚未成型：点击任一侧或手动拖动对比";
  }
}

function mutateState(fn, syncControls = true, syncDraw = true) {
  fn(state);
  if (syncControls) syncControlValues();
  if (syncDraw) heroStage?.draw();
}

function applyPreset(presetKey) {
  state = clonePreset(presetKey, state);
  syncControlValues();
  heroStage?.draw();
}

// 挂载开场剪纸群像画布（画布内部拖拽只改状态不重复同步画布，交由 rAF 单帧合批重绘）
if (heroCanvas) {
  heroStage = mountHeroStage(
    heroCanvas,
    () => state,
    (fn, sync) => mutateState(fn, sync, false),
    (ev) => updateDomFromEval(ev)
  );
}

// 绑定开场全部原生控件
if (scenarioWrap) {
  scenarioWrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-scenario]");
    if (!b) return;
    mutateState((s) => { s.scenario = b.dataset.scenario; });
  });
}

if (spreadRange) {
  spreadRange.addEventListener("input", () => {
    mutateState((s) => {
      s.spread = Number(spreadRange.value);
      s.presetId = "custom";
    });
  });
}

if (countRange) {
  countRange.addEventListener("input", () => {
    mutateState((s) => {
      s.count = Number(countRange.value);
      s.presetId = "custom";
    });
  });
}

if (brushWrap) {
  brushWrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-brush]");
    if (!b) return;
    const role = b.dataset.brush;
    mutateState((s) => {
      s.brush = role;
      // 若指定了具体色层，顺手将当前选中人物同步点染，反馈立刻可见
      if (role !== "cycle" && s.actors[s.selectedId]) {
        s.actors[s.selectedId].role = role;
        s.presetId = "custom";
      }
    });
  });
}

if (presetWrap) {
  presetWrap.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-preset]");
    if (!b) return;
    applyPreset(b.dataset.preset);
  });
}

if (probeList) {
  probeList.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-probe]");
    if (!b) return;
    const key = b.dataset.probe;
    mutateState((s) => {
      s.activeProbe = s.activeProbe === key ? null : key;
    }, false);
  });
}

if (diagFixBtn) {
  diagFixBtn.addEventListener("click", () => {
    applyPreset(diagFixBtn.dataset.target || "poster");
  });
}

if (diagResetBtn) {
  diagResetBtn.addEventListener("click", () => {
    applyPreset("broken");
  });
}

if (btnConcentrated) {
  btnConcentrated.addEventListener("click", () => applyPreset("poster"));
}
if (btnDispersed) {
  btnDispersed.addEventListener("click", () => applyPreset("dispersed"));
}

if (gazeBtn) {
  gazeBtn.addEventListener("click", () => heroStage?.triggerGazePulse());
}

if (calloutBtn) {
  calloutBtn.addEventListener("click", () => {
    mutateState((s) => { s.showCallouts = !s.showCallouts; });
  });
}

// 画布键盘操作：方向键微调选中人物位置与高低，Tab/Enter 切色，Space 演播视线动势
if (heroCanvas) {
  heroCanvas.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === " ") {
      heroStage?.triggerGazePulse();
      return;
    }
    const step = 0.03;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      mutateState((s) => {
        const a = s.actors[s.selectedId];
        if (!a) return;
        if (e.key === "ArrowLeft") a.x = Math.max(0.09, a.x - step);
        if (e.key === "ArrowRight") a.x = Math.min(0.91, a.x + step);
        if (e.key === "ArrowUp") {
          a.y = Math.max(0.58, a.y - 0.025);
          a.h = Math.min(0.64, a.h + (s.selectedId === 0 ? 0.03 : 0.015));
        }
        if (e.key === "ArrowDown") {
          a.y = Math.min(0.94, a.y + 0.025);
          a.h = Math.max(0.24, a.h - (s.selectedId === 0 ? 0.03 : 0.015));
        }
        s.presetId = "custom";
      });
    }
  });
}

// 空格键在非输入聚焦且首屏可见时快捷演播视线动势
window.addEventListener("keydown", (e) => {
  if (e.key !== " ") return;
  const tag = document.activeElement?.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || document.activeElement === heroCanvas) return;
  const r = heroCanvas?.getBoundingClientRect();
  if (r && r.bottom > 80 && r.top < window.innerHeight - 80) {
    e.preventDefault();
    heroStage?.triggerGazePulse();
  }
});

// 初始化控件显示与 01–07 节全部互动实验
syncControlValues();
heroStage?.draw();
initOriginSection();
initSplitCurtainSection();
initDepthLabSection();
initDensityStripperSection();
initDontUseCards();
initQuizSection();
initPosterLightbox();
