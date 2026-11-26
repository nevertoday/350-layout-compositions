// 341 空白幻灯片版式 — 总控入口
// 将 model.js 单真源状态同步到开场 2D 舞台、四方向蓝箭悬浮探针、自示范标题短杠、底沿诊单与全页七节交互。

import { CLUTTER_KEYS, SCENARIOS, applyPreset, createInitialState, evaluate } from "./model.js";
import { createHeroStage } from "./stage.js";
import {
  initCounterCases,
  initDeckRouter,
  initFourForcesLab,
  initHistoryTimeline,
  initPosterLightbox,
  initPracticeQuiz,
  initSplitCurtain,
} from "./sections.js";

const state = createInitialState("poster");
const heroCanvas = document.getElementById("hero-canvas");

// DOM 引用（开场）
const statusPills = [...document.querySelectorAll("[data-hero-status]")];
const titleRuleBar = document.getElementById("title-air-bar");
const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
const clutterBtns = [...document.querySelectorAll("[data-clutter]")];
const slideTabBtns = [...document.querySelectorAll("[data-slide-tab]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const marginRange = document.getElementById("ctrl-margin");
const marginOut = document.getElementById("val-margin");
const focalRange = document.getElementById("ctrl-focal");
const focalOut = document.getElementById("val-focal");
const guidesToggle = document.getElementById("btn-guides");
const beatBtns = [...document.querySelectorAll("[data-play-beat]")];
const fixBtns = [...document.querySelectorAll("[data-quick-fix]")];
const resetBtns = [...document.querySelectorAll("[data-quick-reset]")];

// 诊断与四向蓝箭探针
const diagTag = document.getElementById("diag-tag");
const diagTier = document.getElementById("diag-tier");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const diagCard = document.getElementById("diag-bar");
const cornerCoord = document.getElementById("corner-coord");

const probeMap = {
  margin: {
    card: document.getElementById("probe-margin"),
    badge: document.getElementById("probe-margin-badge"),
  },
  whitespace: {
    card: document.getElementById("probe-whitespace"),
    badge: document.getElementById("probe-whitespace-badge"),
  },
  focus: {
    card: document.getElementById("probe-focus"),
    badge: document.getElementById("probe-focus-badge"),
  },
  breathing: {
    card: document.getElementById("probe-breathing"),
    badge: document.getElementById("probe-breathing-badge"),
  },
};

function syncUI() {
  const audit = evaluate(state);
  const pass = audit.passed === 4;

  // 1. 顶部与移动端状态章
  statusPills.forEach((el) => {
    el.textContent = audit.diagnosis.shortTag;
    el.classList.toggle("is-pass", pass);
  });

  // 2. 自示范标题下天蓝短杠宽度随留白通透率平滑伸缩（44px–124px）
  if (titleRuleBar) {
    const barW = Math.round(36 + audit.whitespace * 92);
    titleRuleBar.style.width = `${barW}px`;
    titleRuleBar.classList.toggle("is-pass", pass);
  }

  // 3. 四向 341 蓝箭悬浮探针（100% 单真源）
  for (const key of ["margin", "whitespace", "focus", "breathing"]) {
    const p = probeMap[key];
    const c = audit.checks[key];
    if (!p || !c) continue;
    if (p.badge) p.badge.textContent = c.badge;
    if (p.card) {
      p.card.classList.toggle("is-ok", c.ok);
      p.card.classList.toggle("is-fail", !c.ok);
    }
  }

  // 右下 [ + ] 构图角标显示实测重心与留白占比
  if (cornerCoord) {
    cornerCoord.textContent = `空白 ${Math.round(audit.whitespace * 100)}% · 重心 ${Math.round(audit.centroid.x * 100)}/${Math.round(audit.centroid.y * 100)}`;
  }

  // 4. 底部白话单真源诊单
  if (diagCard) diagCard.classList.toggle("is-pass", pass);
  if (diagTag) {
    diagTag.textContent = pass ? `${audit.arrangement} · 4/4` : audit.diagnosis.shortTag;
    diagTag.classList.toggle("is-pass", pass);
  }
  if (diagTier) diagTier.textContent = audit.scanTier;
  if (diagTitle) diagTitle.textContent = audit.diagnosis.title;
  if (diagBody) diagBody.textContent = audit.diagnosis.body;
  if (diagAction) diagAction.textContent = audit.diagnosis.action;

  // 5. 剧本切签、杂物芯片、3 页胶片条与微调滑轨
  scenarioBtns.forEach((b) => {
    const on = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  const sc = SCENARIOS[state.scenario];
  clutterBtns.forEach((b) => {
    const k = b.dataset.clutter;
    const on = state.clutter[k];
    b.classList.toggle("is-present", on);
    b.setAttribute("aria-pressed", String(on));
    const shortName = sc.clutterShort[k];
    b.textContent = on ? `× ${shortName}` : `✓ 已清${shortName.slice(0, 2)}`;
  });

  slideTabBtns.forEach((b) => {
    const on = Number(b.dataset.slideTab) === state.activeSlide;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  if (marginRange) marginRange.value = String((state.margin * 100).toFixed(1));
  if (marginOut) marginOut.textContent = `${(state.margin * 100).toFixed(1)}%`;
  if (focalRange) focalRange.value = String((state.focal.size * 100).toFixed(1));
  if (focalOut) focalOut.textContent = `${Math.round(state.focal.size * 100)}%`;
  if (guidesToggle) {
    guidesToggle.textContent = state.showGuides ? "标尺：开" : "标尺：关";
    guidesToggle.setAttribute("aria-pressed", String(state.showGuides));
  }
}

const stage = createHeroStage(heroCanvas, state, syncUI);

// 绑定开场控件
scenarioBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.scenario = b.dataset.scenario;
    state.activeSlide = 1;
    syncUI();
    stage.redraw();
  });
});

clutterBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const k = b.dataset.clutter;
    if (!CLUTTER_KEYS.includes(k)) return;
    state.clutter[k] = !state.clutter[k];
    state.activeSlide = 1;
    syncUI();
    stage.redraw();
  });
});

slideTabBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.activeSlide = Number(b.dataset.slideTab);
    syncUI();
    stage.redraw();
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(state, b.dataset.preset);
    syncUI();
    stage.redraw();
  });
});

fixBtns.forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(state, "poster");
    syncUI();
    stage.redraw();
  });
});

resetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    applyPreset(state, "bad");
    syncUI();
    stage.redraw();
  });
});

beatBtns.forEach((b) => {
  b.addEventListener("click", () => {
    stage.playTransitionBeat();
  });
});

marginRange?.addEventListener("input", () => {
  state.margin = +(Number(marginRange.value) / 100).toFixed(3);
  state.activeSlide = 1;
  syncUI();
  stage.redraw();
});

focalRange?.addEventListener("input", () => {
  state.focal.size = +(Number(focalRange.value) / 100).toFixed(3);
  state.activeSlide = 1;
  syncUI();
  stage.redraw();
});

guidesToggle?.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
  stage.redraw();
});

// 全局 Space 快捷键（非输入框聚焦且在首屏附近时触发翻页实测）
document.addEventListener("keydown", (ev) => {
  if (ev.code !== "Space") return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
  const modal = document.getElementById("poster-modal");
  if (modal && !modal.hidden) return;
  const heroEl = document.getElementById("hero");
  if (heroEl && heroEl.getBoundingClientRect().bottom > 120) {
    ev.preventDefault();
    stage.playTransitionBeat();
  }
});

// 初始化首屏 UI 与正文 01–07 节
syncUI();
initSplitCurtain();
initHistoryTimeline();
initFourForcesLab();
initDeckRouter();
initCounterCases();
initPracticeQuiz();
initPosterLightbox();
