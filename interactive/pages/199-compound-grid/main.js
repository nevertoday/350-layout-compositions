// 199 复合网格 · 总控入口（单真源同步首屏画布、活体组合公式栏、原海报五要点灯与正文各节）
import {
  COL_OPTIONS,
  MOD_OPTIONS,
  BASELINE_OPTIONS,
  SCENES,
  createInitialState,
  presetPosterSolution,
  presetTwelveColSolution,
  presetOverdenseClash,
  evaluateLayout,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

let state = createInitialState();

const canvas = document.getElementById("heroCanvas");
const topStatus = document.getElementById("topStatus");
const titleTrackOverlay = document.getElementById("titleTrackOverlay");
const formulaCols = document.getElementById("formulaCols");
const formulaMods = document.getElementById("formulaMods");
const formulaBase = document.getElementById("formulaBase");
const formulaResult = document.getElementById("formulaResult");
const formulaColsThumb = document.getElementById("formulaColsThumb");
const formulaModsThumb = document.getElementById("formulaModsThumb");
const formulaBaseThumb = document.getElementById("formulaBaseThumb");
const formulaResultThumb = document.getElementById("formulaResultThumb");

const diagBadge = document.getElementById("diagBadge");
const diagHeadline = document.getElementById("diagHeadline");
const diagWhy = document.getElementById("diagWhy");
const diagAction = document.getElementById("diagAction");
const mDivisor = document.getElementById("mDivisor");
const mOffset = document.getElementById("mOffset");
const mRoles = document.getElementById("mRoles");
const mSlivers = document.getElementById("mSlivers");
const kpList = document.getElementById("kpList");
const cssPreview = document.getElementById("heroCssPreview");
const sceneHint = document.getElementById("sceneHint");
const btnSnapZero = document.getElementById("btnSnapZero");
const btnFixRoles = document.getElementById("btnFixRoles");
const btnMarginToggle = document.getElementById("btnMarginToggle");
const btnDriftToggle = document.getElementById("btnDriftToggle");

// 微型组合公式 SVG 实时更新（完全呼应原海报底沿四格「组合方式示意」；带缓存键避免拖动时高频重建 DOM）
let lastStaticFormulaKey = "";
let lastResultFormulaKey = "";
let cachedCBars = "";
function renderFormulaThumbs(st, ev) {
  const staticKey = `${st.cols}|${st.modCols}|${st.modRows}|${st.baseline}`;
  if (staticKey !== lastStaticFormulaKey) {
    lastStaticFormulaKey = staticKey;
    // 1. 栏栅微图
    let cBars = "";
    const cw = 48 / st.cols;
    for (let i = 0; i < st.cols; i++) {
      cBars += `<rect x="${2 + i * cw + 0.8}" y="2" width="${Math.max(1.5, cw - 1.6)}" height="32" fill="#9A8ED4"/>`;
    }
    cachedCBars = cBars;
    formulaColsThumb.innerHTML = `<svg viewBox="0 0 52 36" aria-hidden="true">${cBars}</svg>`;

    // 2. 模块微图
    if (st.modCols === 0) {
      formulaModsThumb.innerHTML = `<svg viewBox="0 0 52 36" aria-hidden="true"><rect x="2" y="2" width="48" height="32" fill="none" stroke="#B62738" stroke-dasharray="3 2"/></svg>`;
    } else {
      let mCells = "";
      const mw = 48 / st.modCols, mh = 32 / st.modRows;
      for (let r = 0; r < st.modRows; r++) {
        for (let c = 0; c < st.modCols; c++) {
          mCells += `<rect x="${2 + c * mw + 0.8}" y="${2 + r * mh + 0.8}" width="${Math.max(1.5, mw - 1.6)}" height="${Math.max(1.5, mh - 1.6)}" fill="none" stroke="#614EAD" stroke-width="1"/>`;
        }
      }
      formulaModsThumb.innerHTML = `<svg viewBox="0 0 52 36" aria-hidden="true">${mCells}</svg>`;
    }

    // 3. 基线微图
    let bLines = "";
    const step = st.baseline === "20" ? 5 : 6.5;
    for (let y = 4; y <= 33; y += step) {
      const jitter = st.baseline === "off" ? ((y * 7) % 3) - 1.5 : 0;
      bLines += `<line x1="2" y1="${y + jitter}" x2="50" y2="${y - jitter}" stroke="${st.baseline === "off" ? "#B62738" : "#0A6665"}" stroke-width="1" stroke-dasharray="${st.baseline === "off" ? "3 2" : "none"}"/>`;
    }
    formulaBaseThumb.innerHTML = `<svg viewBox="0 0 52 36" aria-hidden="true">${bLines}</svg>`;
  }

  // 4. 复合合成微图（仅在合成结果像素级变化时刷新）
  const qOff = Math.round(st.offsetRatio * 48);
  const resKey = `${staticKey}|${qOff}|${ev.score}|${ev.phaseOk ? 1 : 0}`;
  if (resKey !== lastResultFormulaKey) {
    lastResultFormulaKey = resKey;
    let combo = cachedCBars;
    if (st.modCols > 0) {
      for (let j = 1; j < st.modCols; j++) {
        const x = 2 + (48 * j) / st.modCols + qOff;
        combo += `<line x1="${x}" y1="2" x2="${x}" y2="34" stroke="${ev.divisorOk && ev.phaseOk ? "#0A6665" : "#B62738"}" stroke-width="1.3"/>`;
      }
    }
    combo += `<rect x="2" y="2" width="48" height="32" fill="none" stroke="${ev.score === 4 ? "#0A6665" : "#4B3893"}" stroke-width="1.2"/>`;
    formulaResultThumb.innerHTML = `<svg viewBox="0 0 52 36" aria-hidden="true">${combo}</svg>`;
  }
}

let stageApi = null;
stageApi = mountHeroStage(
  canvas,
  () => state,
  (act) => {
    if (act.type === "offset") {
      state.offsetRatio = act.value;
    } else if (act.type === "selectBlock") {
      state.selectedBlock = act.block;
    } else if (act.type === "toggleBlock") {
      state.selectedBlock = act.block;
      if (act.block === "lead") {
        state.leadRole = state.leadRole === "column" ? "bad_module" : "column";
      } else if (act.block === "data") {
        state.dataRole = state.dataRole === "module" ? "bad_float" : "module";
      } else if (act.block === "hero") {
        state.heroRole = state.heroRole === "anchor" ? "bad_drift" : "anchor";
      }
    }
    syncUI();
    stageApi.draw();
  },
  () => {
    if (stageApi) syncUI();
  }
);

let lastUiSig = "";
function syncUI() {
  const fw = stageApi.getFieldWidth();
  const ev = evaluateLayout(state, fw);
  const sig = `${state.scene}|${state.cols}|${state.modCols}|${state.modRows}|${ev.offsetPx}|${state.baseline}|${state.marginOn}|${state.leadRole}|${state.dataRole}|${state.heroRole}|${state.selectedBlock}|${ev.score}|${ev.slivers.length}`;
  if (sig === lastUiSig) return;
  lastUiSig = sig;

  // 顶眉实况状态章
  topStatus.textContent = ev.score === 4 ? "4 / 4 协同达标" : `${ev.score} / 4 待协同`;
  topStatus.className = "top-status " + (ev.score === 4 ? "is-ok" : "is-err");

  // 标题自示范双轨线（紫轨随描纸偏移实时微移，合槽时与青轨严丝合缝）
  if (titleTrackOverlay) {
    const pxShift = Math.round(state.offsetRatio * 110);
    titleTrackOverlay.style.setProperty("--mod-shift", `${pxShift}px`);
    titleTrackOverlay.classList.toggle("is-locked", ev.divisorOk && ev.phaseOk);
  }

  // 活体组合公式按钮状态
  formulaCols.querySelectorAll("button").forEach((b) => {
    const on = Number(b.dataset.cols) === state.cols;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  formulaMods.querySelectorAll("button").forEach((b) => {
    const on = Number(b.dataset.modCols) === state.modCols;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  formulaBase.querySelectorAll("button").forEach((b) => {
    const on = b.dataset.base === state.baseline;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  formulaResult.className = "formula-result " + (ev.score === 4 ? "is-ok" : "is-err");
  formulaResult.querySelector(".fr-val").textContent = ev.score === 4
    ? `${state.cols}栏 × ${state.modCols}×${state.modRows}`
    : ev.diag.badge.replace("错态 · ", "");
  formulaResult.querySelector(".fr-sub").textContent = ev.score === 4
    ? `共轨 ${ev.sharedAxes} 线 · 0 碎缝`
    : `${ev.score}/4 项就位`;

  renderFormulaThumbs(state, ev);

  // 场景按钮与说明
  document.querySelectorAll("[data-scene]").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (sceneHint) sceneHint.textContent = SCENES[state.scene].caption;

  // 单真源诊单面板
  diagBadge.textContent = `${ev.diag.badge} (${ev.score}/4)`;
  diagBadge.className = "diag-badge " + (ev.score === 4 ? "is-ok" : "is-err");
  diagHeadline.textContent = ev.diag.headline;
  diagWhy.textContent = ev.diag.why;
  diagAction.textContent = ev.diag.action;

  mDivisor.textContent = ev.isSingleGrid
    ? "单网无次轨"
    : ev.divisorOk
      ? `整除 · 共轨 ${ev.sharedAxes}`
      : `gcd ${ev.commonDiv} · 冲突`;
  mDivisor.className = "metric-val " + (ev.divisorOk ? "is-ok" : "is-err");

  mOffset.textContent = ev.phaseOk ? "0px 合槽" : `${ev.offsetPx > 0 ? "+" : ""}${ev.offsetPx}px`;
  mOffset.className = "metric-val " + (ev.phaseOk ? "is-ok" : "is-err");

  mRoles.textContent = ev.rolesOk ? "3/3 归轨" : `错配 ${ev.misassignedCount} 处`;
  mRoles.className = "metric-val " + (ev.rolesOk ? "is-ok" : "is-err");

  mSlivers.textContent = ev.slivers.length === 0 ? "0 处碎缝" : `${ev.slivers.length} 处碎缝`;
  mSlivers.className = "metric-val " + (ev.slivers.length === 0 ? "is-ok" : "is-err");

  // 五枚原海报核心要点实况灯
  const items = kpList.querySelectorAll("[data-kp-idx]");
  ev.keyPoints.forEach((kp, idx) => {
    const el = items[idx];
    if (!el) return;
    el.classList.toggle("is-ok", kp.ok);
    el.classList.toggle("is-err", !kp.ok);
    const pill = el.querySelector(".kp-pill");
    if (pill) pill.textContent = kp.tag;
  });

  // 快捷操作钮状态
  btnSnapZero.disabled = ev.phaseOk && state.modCols > 0;
  btnFixRoles.disabled = ev.rolesOk;
  btnMarginToggle.textContent = state.marginOn ? "压测：去外边距" : "恢复外边距";
  btnMarginToggle.classList.toggle("is-warn", !state.marginOn);
  btnDriftToggle.textContent = state.heroRole === "anchor" ? "压测：大图脱锚" : "恢复大图锚定";
  btnDriftToggle.classList.toggle("is-warn", state.heroRole !== "anchor");

  // 实时 CSS 轨道代码预览
  cssPreview.textContent = `.compound-field { grid-template-columns: ${ev.cssTrackStr}; }`;
}

// 绑定顶沿活体组合公式按钮
formulaCols.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cols]");
  if (!btn) return;
  state.cols = Number(btn.dataset.cols);
  syncUI();
  stageApi.draw();
});
formulaMods.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-mod-cols]");
  if (!btn) return;
  const mc = Number(btn.dataset.modCols);
  const opt = MOD_OPTIONS.find((m) => m.cols === mc);
  state.modCols = opt.cols;
  state.modRows = opt.rows;
  syncUI();
  stageApi.draw();
});
formulaBase.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-base]");
  if (!btn) return;
  state.baseline = btn.dataset.base;
  syncUI();
  stageApi.draw();
});

// 场景切换
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    syncUI();
    stageApi.draw();
  });
});

// 快捷操作与预设
btnSnapZero.addEventListener("click", () => {
  state.offsetRatio = 0;
  state.marginOn = true;
  syncUI();
  stageApi.pulseSnap();
});
btnFixRoles.addEventListener("click", () => {
  state.leadRole = "column";
  state.dataRole = "module";
  state.heroRole = "anchor";
  syncUI();
  stageApi.draw();
});
btnMarginToggle.addEventListener("click", () => {
  state.marginOn = !state.marginOn;
  syncUI();
  stageApi.draw();
});
btnDriftToggle.addEventListener("click", () => {
  state.heroRole = state.heroRole === "anchor" ? "bad_drift" : "anchor";
  syncUI();
  stageApi.draw();
});

document.getElementById("btnPresetPoster")?.addEventListener("click", () => {
  state = presetPosterSolution(state.scene);
  syncUI();
  stageApi.pulseSnap();
});
document.getElementById("btnPresetTwelve")?.addEventListener("click", () => {
  state = presetTwelveColSolution(state.scene);
  syncUI();
  stageApi.pulseSnap();
});
document.getElementById("btnPresetClash")?.addEventListener("click", () => {
  state = presetOverdenseClash(state.scene);
  syncUI();
  stageApi.draw();
});
document.getElementById("btnResetChaos")?.addEventListener("click", () => {
  const sc = state.scene;
  state = createInitialState();
  state.scene = sc;
  syncUI();
  stageApi.draw();
});

// 初始化首屏与正文七节
syncUI();
stageApi.draw();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
