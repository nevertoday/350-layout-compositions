// 348 矩阵页 幻灯片版式 — 主控入口（连接单真源 model.js、活体画布 stage.js 与七节交互 sections.js）
import {
  SCENARIOS,
  QUADRANTS,
  createInitialState,
  cloneItemsForScenario,
  applyPreset,
  evaluate,
} from "./model.js";
import { createMatrixStage } from "./stage.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

const state = createInitialState("poster");

const canvas = document.getElementById("matrix-canvas");
const topStatus = document.getElementById("top-status");
const titleCrossV = document.getElementById("title-cross-v");
const titleQuadActive = document.getElementById("title-quad-active");

// 诊单区 DOM
const diagScore = document.getElementById("diag-score");
const diagGrade = document.getElementById("diag-grade");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagNext = document.getElementById("diag-next");

// 控台 DOM
const splitSlider = document.getElementById("ctrl-split");
const splitVal = document.getElementById("ctrl-split-val");
const scenarioBtns = document.querySelectorAll("[data-scenario]");
const axisBtns = document.querySelectorAll("[data-axis-mode]");
const labelToggleBtn = document.getElementById("ctrl-labels");
const densityBtns = document.querySelectorAll("[data-density]");
const quadPaintBtns = document.querySelectorAll("[data-paint-quad]");
const presetBtns = document.querySelectorAll("[data-preset]");
const scanBtn = document.getElementById("btn-scan");
const calibrateBtn = document.getElementById("btn-calibrate");
const brokenBtn = document.getElementById("btn-broken");

let stageCtrl = null;

function syncUI() {
  const ev = evaluate(state);

  // 1. 顶栏状态与自示范标题联动（标题里的 2×2 细白坐标随门槛实时微移）
  if (topStatus) {
    topStatus.textContent = `${ev.score}/5 · ${ev.verdictTag}`;
    topStatus.classList.toggle("is-ok", ev.ok);
  }
  if (titleCrossV) {
    titleCrossV.style.left = `${Math.max(24, Math.min(76, ev.leftPct))}%`;
  }
  if (titleQuadActive) {
    const fq = ev.focusList.length === 1 ? ev.focusList[0] : ev.focusList.length > 1 ? "all" : "none";
    titleQuadActive.dataset.focus = fq;
  }

  // 2. 虚线蓝图胶囊：白话诊单
  if (diagScore) {
    diagScore.textContent = `${ev.score}/5 · ${ev.verdictTag}`;
    diagScore.classList.toggle("is-ok", ev.ok);
  }
  if (diagGrade) {
    diagGrade.textContent = `5 秒扫视：${ev.scanGrade}（示意）`;
  }
  if (diagHeadline) diagHeadline.textContent = ev.headline;
  if (diagWhy) diagWhy.textContent = ev.why;
  if (diagNext) diagNext.textContent = ev.nextStep;

  // 3. 原海报底沿五项实时探针（分类 / 对比 / 象限 / 维度 / 聚焦）
  for (const key of ["classify", "compare", "quadrant", "dimension", "focus"]) {
    const p = ev.pillars[key];
    const el = document.querySelector(`[data-pillar="${key}"]`);
    if (!el) continue;
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-err", !p.ok);
    const badge = el.querySelector(".pillar-live");
    if (badge) badge.textContent = p.badge;
  }

  // 4. 同步滑轨与按钮激活态
  if (splitSlider) {
    splitSlider.value = String(Math.round(state.splitX * 100));
  }
  if (splitVal) {
    splitVal.textContent = `${ev.leftPct}% : ${ev.rightPct}%`;
  }

  scenarioBtns.forEach((b) => {
    const on = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  axisBtns.forEach((b) => {
    const on = b.dataset.axisMode === state.axisMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  if (labelToggleBtn) {
    labelToggleBtn.textContent = state.showAxisLabels ? "方向标：开" : "方向标：关";
    labelToggleBtn.classList.toggle("is-active", state.showAxisLabels);
    labelToggleBtn.setAttribute("aria-pressed", String(state.showAxisLabels));
  }

  densityBtns.forEach((b) => {
    const on = b.dataset.density === state.density;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  const sc = SCENARIOS[state.scenario];
  quadPaintBtns.forEach((b) => {
    const q = b.dataset.paintQuad;
    const on = state.focus[q];
    b.classList.toggle("is-lit", on);
    b.setAttribute("aria-pressed", String(on));
    b.textContent = `${on ? "★ " : ""}${sc.quadrants[q].title.slice(0, 4)}`;
  });

  if (scanBtn) {
    scanBtn.classList.toggle("is-running", state.scanActive);
  }
}

function updateAndDraw() {
  syncUI();
  stageCtrl?.draw();
}

// 绑定开场活体画布
if (canvas) {
  stageCtrl = createMatrixStage(canvas, state, () => {
    syncUI();
    stageCtrl?.draw();
  });
}

// 剧本切换（保留当前错态或好态结构，让三套剧本都能从坏修到好）
scenarioBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.scenario;
    if (!SCENARIOS[next]) return;
    state.scenario = next;
    state.items = cloneItemsForScenario(next, state.axisMode);
    // 若当前正好处于 1 个焦点状态，切剧本时自动贴合该剧本推荐焦区，否则保留用户当前高亮态
    const litCount = QUADRANTS.filter((q) => state.focus[q]).length;
    if (litCount === 1) {
      const target = next === "product" ? "tl" : "tr";
      state.focus = { tl: target === "tl", tr: target === "tr", bl: false, br: false };
    }
    updateAndDraw();
  });
});

// 竖向门槛滑轨
splitSlider?.addEventListener("input", () => {
  let v = Number(splitSlider.value) / 100;
  if (Math.abs(v - 0.5) < 0.025) v = 0.5;
  state.splitX = +v.toFixed(3);
  updateAndDraw();
});

// 正交 / 同义假双轴切换
axisBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.axisMode;
    if (mode !== state.axisMode) {
      state.axisMode = mode;
      state.items = cloneItemsForScenario(state.scenario, mode);
      updateAndDraw();
    }
  });
});

// 四端方向极性开关
labelToggleBtn?.addEventListener("click", () => {
  state.showAxisLabels = !state.showAxisLabels;
  updateAndDraw();
});

// 文案密度切换
densityBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.density = btn.dataset.density;
    updateAndDraw();
  });
});

// 四格独立涂黄开关
quadPaintBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const q = btn.dataset.paintQuad;
    state.focus[q] = !state.focus[q];
    updateAndDraw();
  });
});

// 一键校准 / 复原错态 / 多解与反向试错预设
calibrateBtn?.addEventListener("click", () => {
  applyPreset(state, "calibrate_current");
  updateAndDraw();
});

brokenBtn?.addEventListener("click", () => {
  applyPreset(state, "broken");
  updateAndDraw();
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(state, btn.dataset.preset);
    updateAndDraw();
  });
});

// 5 秒会议扫视验真（按钮 + 全局 Space 快捷键，输入框内不拦截）
function triggerScan() {
  state.scanActive = true;
  state.scanElapsed = 0;
  updateAndDraw();
}

scanBtn?.addEventListener("click", triggerScan);

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
  if (e.code === "Space" && document.getElementById("poster-lightbox")?.hidden !== false) {
    // 仅在页面顶部附近触发 5 秒扫视，避免妨碍正文空格翻页
    if (window.scrollY < window.innerHeight * 0.85) {
      e.preventDefault();
      triggerScan();
    }
  }
});

// 初始渲染与七节交互初始化
syncUI();
stageCtrl?.draw();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
