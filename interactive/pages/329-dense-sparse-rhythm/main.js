// 329 疏密相间构图 — 主入口与单真源 UI 同步
import {
  PRESETS,
  THEMES,
  clamp,
  createInitialState,
  evaluate,
  generateField,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  initBeatStrip,
  initBreathCard,
  initOriginsTimeline,
  initPosterLightbox,
  initPracticeQuiz,
  initScenarioCards,
  initSlopeScanner,
} from "./sections.js";

const state = createInitialState();

// 缓存当前帧的计算产物，确保画布、三圆徽、点评笺、三行图例和微点标尺完全共享同一份实算结果
let cachedAspect = 1.45;
let cachedPts = [];
let cachedEval = null;

function recompute(aspect = cachedAspect) {
  cachedAspect = aspect || 1.45;
  cachedPts = generateField(state);
  cachedEval = evaluate(state, cachedPts, cachedAspect);
  return { state, pts: cachedPts, evalRes: cachedEval };
}

// ---------- DOM 引用 ----------
const heroCanvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const titleRuler = document.getElementById("title-rhythm-ruler");
const themeCaption = document.getElementById("theme-caption");

// 左侧原海报三枚纯黑圆徽实时状态
const pillarEls = {
  contrast: {
    row: document.getElementById("pillar-contrast"),
    tag: document.getElementById("pillar-contrast-tag"),
    detail: document.getElementById("pillar-contrast-detail"),
  },
  rhythm: {
    row: document.getElementById("pillar-rhythm"),
    tag: document.getElementById("pillar-rhythm-tag"),
    detail: document.getElementById("pillar-rhythm-detail"),
  },
  breath: {
    row: document.getElementById("pillar-breath"),
    tag: document.getElementById("pillar-breath-tag"),
    detail: document.getElementById("pillar-breath-detail"),
  },
};

// 左下原海报细线「知识提示」活体点评笺
const tipBox = document.getElementById("hero-tip-box");
const tipHead = document.getElementById("tip-headline");
const tipBody = document.getElementById("tip-reason");
const tipHint = document.getElementById("tip-hint");
const tipActionBtn = document.getElementById("tip-action-btn");

// 画布底沿：原海报三行图形图例实况读数 + 轻量控条
const legDenseVal = document.getElementById("leg-dense-val");
const legSparseVal = document.getElementById("leg-sparse-val");
const legRhythmVal = document.getElementById("leg-rhythm-val");

const gatherInput = document.getElementById("ctrl-gather");
const gatherOut = document.getElementById("ctrl-gather-val");
const inkInput = document.getElementById("ctrl-ink");
const inkOut = document.getElementById("ctrl-ink-val");

const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

// 标题下方的自示范微点标尺（12 枚点随当前实测切片密度实时伸缩！）
function renderTitleRuler(profile) {
  if (!titleRuler) return;
  const dots = titleRuler.children;
  const len = profile.length;
  for (let i = 0; i < dots.length; i++) {
    const idx = clamp(Math.floor((i / dots.length) * len), 0, len - 1);
    const norm = clamp((profile[idx] || 0) / 70, 0, 1);
    const size = (3.5 + norm * 7.5).toFixed(1);
    dots[i].style.width = `${size}px`;
    dots[i].style.height = `${size}px`;
    dots[i].style.opacity = (0.38 + norm * 0.62).toFixed(2);
  }
}

function syncUI() {
  const { evalRes } = recompute(heroCtl ? heroCtl.getAspect() : cachedAspect);

  // 顶部极简实况章
  if (statusPill) {
    statusPill.textContent = evalRes.badge;
    statusPill.dataset.ok = evalRes.ok ? "1" : "0";
  }

  renderTitleRuler(evalRes.profile);

  // 题材按钮与说明
  themeBtns.forEach((b) => {
    const active = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  if (themeCaption) themeCaption.textContent = THEMES[state.theme].caption;

  // 三枚原海报纯黑圆徽同步
  for (const key of ["contrast", "rhythm", "breath"]) {
    const data = evalRes.pillars[key];
    const el = pillarEls[key];
    if (!el.row) continue;
    el.row.dataset.ok = data.ok ? "1" : "0";
    if (el.tag) el.tag.textContent = data.tag;
    if (el.detail) el.detail.textContent = data.detail;
  }

  // 左下原海报细线点评笺同步
  if (tipBox) tipBox.dataset.ok = evalRes.ok ? "1" : "0";
  if (tipHead) tipHead.textContent = evalRes.headline;
  if (tipBody) tipBody.textContent = evalRes.reason;
  if (tipHint) tipHint.textContent = evalRes.hint;
  if (tipActionBtn) {
    if (evalRes.quickAction) {
      tipActionBtn.hidden = false;
      tipActionBtn.textContent = evalRes.quickAction.label;
    } else {
      tipActionBtn.hidden = true;
    }
  }

  // 原海报底沿三行图形图例实时数值
  if (legDenseVal) legDenseVal.textContent = `${evalRes.peakDensity}%`;
  if (legSparseVal) legSparseVal.textContent = `${evalRes.valleyDensity}%（疏域 ${evalRes.sparseAreaPct}%）`;
  if (legRhythmVal) legRhythmVal.textContent = evalRes.rhythmTier;

  // 滑杆读数同步
  const gPct = Math.round(state.gather * 100);
  const iPct = Math.round(state.ink * 100);
  if (gatherInput && Number(gatherInput.value) !== gPct) gatherInput.value = String(gPct);
  if (gatherOut) gatherOut.textContent = `${gPct}%`;
  if (inkInput && Number(inkInput.value) !== iPct) inkInput.value = String(iPct);
  if (inkOut) inkOut.textContent = `${iPct}%`;

  // 预设高亮（若当前参数贴近某预设）
  presetBtns.forEach((b) => {
    const p = PRESETS[b.dataset.preset];
    const match =
      p &&
      p.mode === state.mode &&
      Boolean(p.evenSplit) === Boolean(state.evenSplit) &&
      Math.abs(p.gather - state.gather) < 0.05 &&
      Math.abs(p.ink - state.ink) < 0.06;
    b.classList.toggle("is-active", Boolean(match));
  });
}

// 挂接开场画布
const heroCtl = heroCanvas
  ? mountHeroStage(
      heroCanvas,
      (aspect) => {
        if (!cachedEval || Math.abs(aspect - cachedAspect) > 0.02) recompute(aspect);
        return { state, pts: cachedPts, evalRes: cachedEval };
      },
      {
        onGatherChange(v) {
          state.gather = clamp(v, 0, 1);
          state.evenSplit = false;
          syncUI();
          heroCtl.invalidate();
        },
        onInkChange(v) {
          state.ink = clamp(v, 0.14, 1);
          syncUI();
          heroCtl.invalidate();
        },
        onFocusMove(u, v) {
          state.focus.u = clamp(u, 0.06, 0.94);
          state.focus.v = clamp(v, 0.1, 0.9);
          syncUI();
          heroCtl.invalidate();
        },
        onEyePlace(u, v) {
          state.eye.u = u;
          state.eye.v = v;
          syncUI();
          heroCtl.invalidate();
        },
      }
    )
  : null;

// 事件绑定：题材切签
themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const t = btn.dataset.theme;
    if (!THEMES[t]) return;
    state.theme = t;
    syncUI();
    heroCtl?.invalidate();
  });
});

// 事件绑定：章法预设与试错
presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.gather = p.gather;
    state.ink = p.ink;
    state.mode = p.mode;
    state.evenSplit = Boolean(p.evenSplit);
    state.focus = { ...p.focus };
    state.eye = { ...p.eye };
    syncUI();
    heroCtl?.invalidate();
  });
});

// 事件绑定：点评笺温和动作链
tipActionBtn?.addEventListener("click", () => {
  if (!cachedEval?.quickAction?.patch) return;
  const patch = cachedEval.quickAction.patch;
  if (patch.gather !== undefined) state.gather = patch.gather;
  if (patch.ink !== undefined) state.ink = patch.ink;
  if (patch.mode !== undefined) state.mode = patch.mode;
  if (patch.evenSplit !== undefined) state.evenSplit = patch.evenSplit;
  if (patch.focus) state.focus = { ...patch.focus };
  syncUI();
  heroCtl?.invalidate();
});

// 事件绑定：聚散势与总墨量滑杆
gatherInput?.addEventListener("input", () => {
  state.gather = clamp(Number(gatherInput.value) / 100, 0, 1);
  if (state.gather < 0.6) state.evenSplit = false;
  syncUI();
  heroCtl?.invalidate();
});
inkInput?.addEventListener("input", () => {
  state.ink = clamp(Number(inkInput.value) / 100, 0.14, 1);
  syncUI();
  heroCtl?.invalidate();
});

// 初始渲染
syncUI();
heroCtl?.invalidate();

// 挂载正文 01–07 节专属交互
initBeatStrip();
initSlopeScanner();
initBreathCard();
initOriginsTimeline();
initScenarioCards();
initPracticeQuiz();
initPosterLightbox();
