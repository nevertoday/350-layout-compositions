// 294 微调模式 · 主入口：统筹主校对台、3×3 Nudge 键盘、单真源诊单与 01–07 节互动实验

import {
  PRESETS,
  centerActive,
  createState,
  evaluate,
  fixCurrentIssue,
  formatNum,
  getLoupeData,
  nudge,
  setGapBoth,
  switchMode,
} from "./model.js";
import { mountBench } from "./bench.js";
import {
  initOpticalLab,
  initOriginLab,
  initPosterLightbox,
  initQuiz,
  initScenarioCards,
  initSpacingLab,
  initSubpixelLab,
} from "./sections.js";

const state = createState("poster");

const benchCanvas = document.getElementById("bench-canvas");
const modeBtns = [...document.querySelectorAll("[data-mode]")];
const stepBtns = [...document.querySelectorAll("[data-step]")];
const modBtns = [...document.querySelectorAll("[data-mod-gap]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const nudgeBtns = [...document.querySelectorAll("[data-nudge]")];
const pillarBtns = [...document.querySelectorAll("[data-pillar]")];

const gapSlider = document.getElementById("gap-slider");
const gapSliderVal = document.getElementById("gap-slider-val");
const gridToggle = document.getElementById("btn-grid-toggle");
const fixOneBtn = document.getElementById("btn-fix-one");
const heroTuneChar = document.getElementById("hero-tune-char");
const heroTuneRule = document.getElementById("hero-tune-rule");

const diagBox = document.getElementById("diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagHint = document.getElementById("diag-hint");
const focusReadout = document.getElementById("focus-readout");
const footDots = [...document.querySelectorAll("[data-foot-dot]")];

function syncUI() {
  const ev = evaluate(state);
  const loupe = getLoupeData(state);

  // 1. 自示范大标「微调模式」：「调」字随真实基线最大偏差轻微上浮，校准归 0pt 后平滑落回蓝基线
  if (heroTuneChar) {
    const lift = Math.min(3.2, ev.maxBaselineErr * 1.4);
    heroTuneChar.style.transform = `translateY(${(-lift).toFixed(2)}px)`;
    heroTuneChar.dataset.aligned = String(ev.pillars.align.ok);
  }
  if (heroTuneRule) {
    heroTuneRule.dataset.aligned = String(ev.allPass);
  }

  // 2. 顶部标本切换按钮
  modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));

  // 3. 左侧三枚原海报实心圆徽实况状态
  const pMap = {
    spacing: ev.pillars.spacing,
    align: ev.pillars.align,
    tune: ev.pillars.tune,
  };
  pillarBtns.forEach((btn) => {
    const key = btn.dataset.pillar;
    const p = pMap[key];
    if (!p) return;
    btn.dataset.ok = String(p.ok);
    const stEl = btn.querySelector(".pillar-status");
    if (stEl) stEl.textContent = p.ok ? `✓ ${p.short}` : p.short;
  });

  // 4. 白话工程研判框
  if (diagBox) diagBox.dataset.state = ev.allPass ? "ok" : "err";
  if (diagBadge) {
    diagBadge.textContent = ev.allPass ? `校准成立 · ${ev.badge}` : `${ev.issueCount} 项待调 · ${ev.badge}`;
  }
  if (diagTitle) diagTitle.textContent = ev.headline;
  if (diagWhy) diagWhy.textContent = ev.why;
  if (diagHint) diagHint.textContent = ev.hint;
  if (fixOneBtn) {
    if (ev.allPass) {
      fixOneBtn.hidden = true;
    } else {
      fixOneBtn.hidden = false;
      fixOneBtn.textContent = ev.fixLabel;
    }
  }

  // 5. 焦点读数、步进按钮、间距滑条与 4px 模数快点尺
  if (focusReadout) {
    focusReadout.textContent = `${loupe.targetLabel} · ${loupe.metricText}`;
    focusReadout.dataset.sharp = String(loupe.isSharp);
  }
  stepBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.step) === state.step)));
  if (gapSlider) {
    gapSlider.value = String(Math.round(state.gaps[0]));
  }
  if (gapSliderVal) {
    const [g1, g2] = state.gaps;
    gapSliderVal.textContent =
      Math.abs(g1 - g2) < 0.1 ? `${formatNum(g1)}px` : `${formatNum(g1)} / ${formatNum(g2)}px`;
  }
  modBtns.forEach((b) => {
    const v = Number(b.dataset.modGap);
    const active = Math.abs(state.gaps[0] - v) < 0.1 && Math.abs(state.gaps[1] - v) < 0.1;
    b.setAttribute("aria-pressed", String(active));
  });
  if (gridToggle) {
    gridToggle.setAttribute("aria-pressed", String(state.showGrid));
    gridToggle.textContent = state.showGrid ? "工程格：开" : "工程格：关";
  }

  // 6. 底沿三圆点（蓝 · 红 · 黑）
  footDots.forEach((d) => {
    const k = d.dataset.footDot;
    const ok = k === "spacing" ? ev.pillars.spacing.ok : k === "align" ? ev.pillars.align.ok : ev.pillars.tune.ok;
    d.dataset.ok = String(ok);
  });
}

const bench = benchCanvas ? mountBench(benchCanvas, state, syncUI) : { draw() {} };

function commit() {
  syncUI();
  bench.draw();
}

// 标本切换
modeBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    switchMode(state, btn.dataset.mode);
    commit();
  })
);

// 点击左脊三枚圆徽，立刻把画布焦距切到对应待校元件
pillarBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const ev = evaluate(state);
    const key = btn.dataset.pillar;
    if (key === "align") state.focus = ev.firstOffAlignId || "g0";
    else if (key === "spacing") state.focus = "gap1";
    else state.focus = ev.pillars.tune.subpixelOk ? "stroke" : ev.firstSubpixelId || "g5";
    commit();
  })
);

// 步进精度切换
stepBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    state.step = Number(btn.dataset.step);
    commit();
  })
);

// 4px 模数快点条
modBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    state.focus = "gap1";
    setGapBoth(state, Number(btn.dataset.modGap));
    commit();
  })
);

// 连续间距滑条（允许拉进 13px / 38px / 6px 等双向错态）
if (gapSlider) {
  gapSlider.addEventListener("input", () => {
    state.focus = "gap1";
    setGapBoth(state, Number(gapSlider.value));
    commit();
  });
}

// 网格开关
if (gridToggle) {
  gridToggle.addEventListener("click", () => {
    state.showGrid = !state.showGrid;
    commit();
  });
}

// 一键校准当前最紧迫单项
if (fixOneBtn) {
  fixOneBtn.addEventListener("click", () => {
    fixCurrentIssue(state);
    commit();
  });
}

// 多解与试错标本快切
presetBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    preset.apply(state);
    commit();
  })
);

// 1:1 原海报 03 细微位移（Nudge）3×3 机械方向键阵
function flashNudgeBtn(key) {
  const btn = nudgeBtns.find((b) => b.dataset.nudge === key);
  if (!btn) return;
  btn.classList.add("is-pressed");
  setTimeout(() => btn.classList.remove("is-pressed"), 140);
}

nudgeBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    const dir = btn.dataset.nudge;
    flashNudgeBtn(dir);
    if (dir === "center") {
      centerActive(state);
    } else {
      const [sx, sy] = dir.split(",").map(Number);
      nudge(state, sx, sy);
    }
    commit();
  })
);

// 物理键盘方向键支持（焦点在主校对区时按 ↑↓←→ 每次 1px、Shift 每次 4px）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const hero = document.getElementById("hero");
  if (!hero) return;
  const r = hero.getBoundingClientRect();
  // 只有在开场校对台在视口内时才拦截方向键，不抢占下方滚页体验
  if (r.bottom < 80 || r.top > window.innerHeight - 40) return;

  const map = {
    ArrowLeft: [-1, 0, "-1,0"],
    ArrowRight: [1, 0, "1,0"],
    ArrowUp: [0, -1, "0,-1"],
    ArrowDown: [0, 1, "0,1"],
  };
  const hit = map[e.key];
  if (!hit) return;
  e.preventDefault();
  const [sx, sy, key] = hit;
  flashNudgeBtn(key);
  nudge(state, sx, sy, e.shiftKey ? 4 : state.step);
  commit();
});

// 初始化首屏与 01–07 全部互动小节
syncUI();
initOpticalLab();
initSpacingLab();
initSubpixelLab();
initOriginLab();
initScenarioCards();
initQuiz();
initPosterLightbox();
