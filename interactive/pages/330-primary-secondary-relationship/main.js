// 330 主宾关系构图 · 页面总入口
// 串联 model.js 单真源、hero-stage.js 开放画布、原海报复刻状态带与 01–07 各节独立交互。

import {
  TIER_META,
  INKS,
  createInitialState,
  clonePreset,
  clamp,
  swapHostGuest,
  fixTopIssue,
} from "./model.js";
import { mountHeroStage, renderMiniSchematic } from "./hero-stage.js";
import {
  initLeversSection,
  initTierCascadeSection,
  initHistoryXraySection,
  initScenarioCards,
  initCurtainSection,
  initQuizSection,
  initPosterLightbox,
} from "./sections.js";

const state = createInitialState();

const heroCanvas = document.getElementById("hero-canvas");
const miniSvg = document.getElementById("mini-schematic");

// 顶部与原海报复刻区 DOM 句柄
const folioStatus = document.getElementById("folio-status");
const titleHostSpan = document.getElementById("title-host");
const titleGuestSpan = document.getElementById("title-guest");

const mediumBtns = [...document.querySelectorAll("button[data-medium]")];
const tierBtns = [...document.querySelectorAll("button[data-tier]")];
const inkBtns = [...document.querySelectorAll("button[data-ink]")];
const presetBtns = [...document.querySelectorAll("button[data-preset]")];

const radiusRange = document.getElementById("tier-radius");
const radiusLabel = document.getElementById("tier-radius-label");
const radiusVal = document.getElementById("tier-radius-val");
const swapBtn = document.getElementById("btn-swap");
const orbitToggle = document.getElementById("btn-orbit");
const moatToggle = document.getElementById("btn-moat");

// 原海报四栏「核心知识点」实况区
const orderVal = document.getElementById("pillar-order");
const contrastMetric = document.getElementById("pillar-contrast-metric");
const contrastNote = document.getElementById("pillar-contrast-note");
const contrastItem = document.getElementById("pillar-contrast");

const guidanceMetric = document.getElementById("pillar-guidance-metric");
const guidanceNote = document.getElementById("pillar-guidance-note");
const guidanceItem = document.getElementById("pillar-guidance");

const hierarchyMetric = document.getElementById("pillar-hierarchy-metric");
const hierarchyNote = document.getElementById("pillar-hierarchy-note");
const hierarchyItem = document.getElementById("pillar-hierarchy");

// 暖砂大引号实时研判长笺
const diagBox = document.getElementById("hero-diag");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const diagFixBtn = document.getElementById("diag-fix");

// 底部三条注意事项实况项
const noticeItems = [...document.querySelectorAll("[data-notice-idx]")];

let latestReport = null;

function syncUI(report) {
  latestReport = report;

  // 1. 展笺眉状态徽
  folioStatus.textContent = report.diagnosis.badge;
  folioStatus.className = `folio-badge ${report.ok ? "is-pass" : "is-fail"}`;

  // 2. 标题本身自示范：主强宾让时「主」沉着朱砂红、稍大，「宾」退稳黛青；失衡时「主」「宾」同趋僵硬警示
  if (titleHostSpan && titleGuestSpan) {
    const clash = report.issues.some((i) => i.code === "color_clash" || i.code === "guest_usurp" || i.code === "rival_size");
    titleHostSpan.classList.toggle("is-dominant", report.ok);
    titleGuestSpan.classList.toggle("is-rival", clash);
  }

  // 3. 题材切签
  for (const b of mediumBtns) {
    const active = b.dataset.medium === state.medium;
    b.setAttribute("aria-pressed", String(active));
    b.classList.toggle("is-active", active);
  }

  // 4. 三阶选层 & 半径滑块 & 色阶按钮
  const activeTier = state.activeTier;
  const activeNode = state[activeTier];
  const meta = TIER_META[activeTier];

  for (const b of tierBtns) {
    const on = b.dataset.tier === activeTier;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  }

  if (radiusRange) {
    radiusRange.min = String(Math.round(meta.minR * 1000));
    radiusRange.max = String(Math.round(meta.maxR * 1000));
    radiusRange.value = String(Math.round(activeNode.r * 1000));
    radiusLabel.textContent = `${meta.label}体量`;
    const covPct = Math.round(report.nodes[activeTier].coverage * 100);
    radiusVal.textContent = `占幅 ${covPct}%`;
  }

  for (const b of inkBtns) {
    const on = b.dataset.ink === activeNode.ink;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  }

  if (orbitToggle) {
    orbitToggle.setAttribute("aria-pressed", String(state.showOrbit));
    orbitToggle.textContent = state.showOrbit ? "引导弧：开" : "引导弧：关";
  }
  if (moatToggle) {
    moatToggle.setAttribute("aria-pressed", String(state.showMoat));
    moatToggle.textContent = state.showMoat ? "护城环：开" : "护城环：关";
  }

  // 5. 四栏核心知识点实时徽章
  orderVal.textContent = report.gazeOrder;
  orderVal.classList.toggle("is-pass", report.ok);
  orderVal.classList.toggle("is-fail", !report.ok);

  contrastMetric.textContent = report.pillars.contrast.metric;
  contrastNote.textContent = report.pillars.contrast.note;
  contrastItem.classList.toggle("is-fail", !report.pillars.contrast.ok);

  guidanceMetric.textContent = report.pillars.guidance.metric;
  guidanceNote.textContent = report.pillars.guidance.note;
  guidanceItem.classList.toggle("is-fail", !report.pillars.guidance.ok);

  hierarchyMetric.textContent = report.pillars.hierarchy.metric;
  hierarchyNote.textContent = report.pillars.hierarchy.note;
  hierarchyItem.classList.toggle("is-fail", !report.pillars.hierarchy.ok);

  // 6. 暖砂大引号实时单真源研判
  diagBox.classList.toggle("is-pass", report.ok);
  diagBox.classList.toggle("is-fail", !report.ok);
  diagBadge.textContent = report.diagnosis.badge;
  diagHeadline.textContent = report.diagnosis.headline;
  diagBody.textContent = report.diagnosis.body;
  diagAction.textContent = report.diagnosis.action;

  if (report.diagnosis.cta) {
    diagFixBtn.hidden = false;
    diagFixBtn.textContent = report.diagnosis.cta;
  } else {
    diagFixBtn.hidden = true;
  }

  // 7. 动态微缩示意图
  renderMiniSchematic(miniSvg, report);

  // 8. 底部三条注意事项状态灯
  report.notices.forEach((n, i) => {
    const el = noticeItems[i];
    if (!el) return;
    el.classList.toggle("is-ok", n.ok);
    el.classList.toggle("is-bad", !n.ok);
    const mark = el.querySelector(".notice-mark");
    if (mark) mark.textContent = n.ok ? "✓" : "!";
  });
}

// 挂载开场 2D 开放画布
const stage = mountHeroStage(heroCanvas, state, {
  onChange: (report) => syncUI(report),
});

// 绑定控件事件
for (const b of mediumBtns) {
  b.addEventListener("click", () => {
    state.medium = b.dataset.medium;
    syncUI(stage.sync());
  });
}

for (const b of tierBtns) {
  b.addEventListener("click", () => {
    state.activeTier = b.dataset.tier;
    syncUI(stage.sync());
  });
}

for (const b of inkBtns) {
  b.addEventListener("click", () => {
    if (!INKS[b.dataset.ink]) return;
    state[state.activeTier].ink = b.dataset.ink;
    syncUI(stage.sync());
  });
}

if (radiusRange) {
  radiusRange.addEventListener("input", () => {
    const meta = TIER_META[state.activeTier];
    state[state.activeTier].r = clamp(Number(radiusRange.value) / 1000, meta.minR, meta.maxR);
    syncUI(stage.sync());
  });
}

if (swapBtn) {
  swapBtn.addEventListener("click", () => {
    swapHostGuest(state);
    syncUI(stage.sync());
  });
}

if (orbitToggle) {
  orbitToggle.addEventListener("click", () => {
    state.showOrbit = !state.showOrbit;
    syncUI(stage.sync());
  });
}

if (moatToggle) {
  moatToggle.addEventListener("click", () => {
    state.showMoat = !state.showMoat;
    syncUI(stage.sync());
  });
}

for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const next = clonePreset(b.dataset.preset, {
      medium: state.medium,
      activeTier: state.activeTier,
      showOrbit: state.showOrbit,
      showMoat: state.showMoat,
    });
    Object.assign(state, next);
    syncUI(stage.sync());
  });
}

if (diagFixBtn) {
  diagFixBtn.addEventListener("click", () => {
    if (!latestReport) return;
    fixTopIssue(state, latestReport);
    syncUI(stage.sync());
  });
}

// 初始化 UI 与 01–07 全部章节交互
syncUI(stage.getReport());
initLeversSection();
initTierCascadeSection();
initHistoryXraySection();
initScenarioCards();
initCurtainSection();
initQuizSection();
initPosterLightbox();
