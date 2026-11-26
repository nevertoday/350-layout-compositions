// 169 放射系统 · 主控模块（连接开场单真源轮盘、8 枚环绕活体徽章、底部原海报双联舱与 01–07 正文互动）

import {
  PRESETS,
  PRINCIPLES,
  THEMES,
  applySingleFix,
  createInitialState,
  evaluate,
  reachesForRhythm,
  tiersForRhythm,
} from "./model.js";
import { createHeroDial } from "./hero.js";
import {
  appIconSvg,
  initAnatomySection,
  initFittsSection,
  initHistorySection,
  initPosterLightbox,
  initQuizSection,
  initStressLabSection,
  initTriageSection,
  principleIconSvg,
} from "./sections.js";

let state = createInitialState("infographic");

// ---------------------------------------------------------------------------
// 1. 构建 8 枚原海报环绕圆形活体徽章（左右凹弧括号排布，点击高亮对应射线）
// ---------------------------------------------------------------------------
const leftArc = document.getElementById("orbit-left");
const rightArc = document.getElementById("orbit-right");
const medallionNodes = new Map();

function buildMedallions() {
  const renderOne = (p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `orbit-badge tone-${p.colorKey} slot-${p.slot}`;
    btn.dataset.pid = p.id;
    btn.dataset.idx = String(idx);
    btn.innerHTML = `
      <span class="orbit-ring">${principleIconSvg(p.id)}</span>
      <span class="orbit-text">
        <span class="orbit-head"><strong>${p.zh}</strong><em>${p.en}</em></span>
        <span class="orbit-status" data-status></span>
      </span>
    `;
    medallionNodes.set(p.id, { btn, statusEl: btn.querySelector("[data-status]") });
    return btn;
  };

  // 左弧（自上而下对应原海报左半圈：中心 12点 / 发散 10:30 / 层级 9:00 / 比例 7:30）
  const leftOrder = ["center", "radiate", "hierarchy", "scale"];
  // 右弧（自上而下对应原海报右半圈：聚焦 1:30 / 节奏 3:00 / 均衡 4:30 / 引导 6:00）
  const rightOrder = ["focus", "rhythm", "balance", "guide"];

  leftOrder.forEach((id) => {
    const idx = PRINCIPLES.findIndex((x) => x.id === id);
    leftArc.appendChild(renderOne(PRINCIPLES[idx], idx));
  });
  rightOrder.forEach((id) => {
    const idx = PRINCIPLES.findIndex((x) => x.id === id);
    rightArc.appendChild(renderOne(PRINCIPLES[idx], idx));
  });

  const onArcClick = (e) => {
    const btn = e.target.closest("button[data-idx]");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    setState({ ...state, selectedSpoke: state.selectedSpoke === idx ? -1 : idx });
  };
  leftArc.addEventListener("click", onArcClick);
  rightArc.addEventListener("click", onArcClick);
}

// ---------------------------------------------------------------------------
// 2. 构建底部右舱「应用场景 APPLICATIONS」1:1 四格虚线竖栏切签
// ---------------------------------------------------------------------------
const appGrid = document.getElementById("apps-grid");
function buildAppsGrid() {
  appGrid.innerHTML = Object.values(THEMES)
    .map(
      (th) => `
      <button type="button" class="app-cell" data-theme="${th.id}" aria-pressed="${th.id === state.theme}">
        <span class="app-icon">${appIconSvg(th.id)}</span>
        <strong class="app-zh">${th.zh}</strong>
        <span class="app-en">${th.en}</span>
      </button>
    `
    )
    .join("");

  appGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-theme]");
    if (!btn) return;
    setState({ ...state, theme: btn.dataset.theme });
  });
}

// ---------------------------------------------------------------------------
// 3. 构建原海报「设计提示 TIPS」4 条活体检查单
// ---------------------------------------------------------------------------
const tipsList = document.getElementById("tips-list");
const tipNodes = [];

function buildTipsList() {
  const initialEval = evaluate(state);
  tipsList.innerHTML = initialEval.tipsStatus
    .map(
      (t) => `
      <li class="tip-row" data-tip="${t.id}">
        <span class="tip-dot tone-${t.colorKey}" aria-hidden="true"></span>
        <span class="tip-copy"><strong>${t.lead}</strong> → ${t.desc}</span>
        <span class="tip-pill" data-tip-note></span>
      </li>
    `
    )
    .join("");
  for (const li of tipsList.querySelectorAll("li[data-tip]")) {
    tipNodes.push({ id: li.dataset.tip, li, noteEl: li.querySelector("[data-tip-note]") });
  }
}

// ---------------------------------------------------------------------------
// 4. 构建预设按钮（3 组合法解 + 3 组试错反例 + 复原错态）
// ---------------------------------------------------------------------------
const presetStrip = document.getElementById("preset-strip");
function buildPresets() {
  presetStrip.innerHTML = Object.entries(PRESETS)
    .map(
      ([key, p]) =>
        `<button type="button" class="preset-btn kind-${p.kind}" data-preset="${key}">${p.label}</button>`
    )
    .join("");
  presetStrip.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-preset]");
    if (!btn) return;
    const p = PRESETS[btn.dataset.preset];
    if (p) setState(p.apply(state));
  });
}

// ---------------------------------------------------------------------------
// 5. 细粒度无闪烁 DOM 同步（拖拽时仅更新变化字段，不重建 innerHTML，保 60fps）
// ---------------------------------------------------------------------------
const els = {
  topBadge: document.getElementById("hero-top-badge"),
  verdictCard: document.getElementById("verdict-card"),
  verdictBadge: document.getElementById("verdict-badge"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictBody: document.getElementById("verdict-body"),
  verdictAction: document.getElementById("verdict-action"),
  fixBtn: document.getElementById("verdict-fix-btn"),
  mDrift: document.getElementById("m-drift"),
  mHub: document.getElementById("m-hub"),
  mGap: document.getElementById("m-gap"),
  mTier: document.getElementById("m-tier"),
  hubRange: document.getElementById("ctrl-hub"),
  hubVal: document.getElementById("ctrl-hub-val"),
  mobTitle: document.getElementById("mob-verdict-title"),
  mobFixBtn: document.getElementById("mob-fix-btn"),
};

function setText(el, str) {
  if (el && el.textContent !== str) el.textContent = str;
}

function syncUI(ev) {
  // 顶眉徽章
  setText(els.topBadge, ev.verdict.badge);
  els.topBadge.classList.toggle("is-ok", ev.verdict.ok);

  // 诊单卡（全宽 & 移动端首屏摘要同源）
  els.verdictCard.classList.toggle("is-ok", ev.verdict.ok);
  setText(els.verdictBadge, ev.verdict.badge);
  setText(els.verdictTitle, ev.verdict.title);
  setText(els.verdictBody, ev.verdict.body);
  setText(els.verdictAction, ev.verdict.action);
  setText(els.mobTitle, ev.verdict.title);

  if (ev.verdict.fixKey) {
    els.fixBtn.hidden = false;
    els.fixBtn.dataset.fix = ev.verdict.fixKey;
    setText(els.fixBtn, ev.verdict.fixLabel);
    els.mobFixBtn.hidden = false;
    els.mobFixBtn.dataset.fix = ev.verdict.fixKey;
    setText(els.mobFixBtn, ev.verdict.fixLabel);
  } else {
    els.fixBtn.hidden = true;
    els.mobFixBtn.hidden = true;
  }

  // 四枚单真源实测读数
  setText(els.mDrift, `${ev.comDriftPct}%`);
  setText(els.mHub, `${Math.round(ev.hubR * 100)}%`);
  setText(els.mGap, `${ev.minGapDeg}°–${ev.maxGapDeg}°`);
  setText(els.mTier, ev.energyTier);

  // 内圈滑轨值
  const hubPct = Math.round(state.hubRatio * 100);
  if (Number(els.hubRange.value) !== hubPct) els.hubRange.value = String(hubPct);
  setText(els.hubVal, `${hubPct}%`);

  // 排印开关高亮状态
  for (const btn of document.querySelectorAll("[data-baseline]")) {
    const on = btn.dataset.baseline === state.baselineMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  for (const btn of document.querySelectorAll("[data-rhythm]")) {
    const on = btn.dataset.rhythm === state.rhythmMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  for (const btn of document.querySelectorAll("[data-aim]")) {
    const on = btn.dataset.aim === state.aimMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  for (const btn of appGrid.querySelectorAll("[data-theme]")) {
    const on = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }

  // 8 枚环绕原海报徽章活体灯
  PRINCIPLES.forEach((p, idx) => {
    const node = medallionNodes.get(p.id);
    const st = ev.principleStates[p.id];
    if (!node || !st) return;
    node.btn.classList.toggle("is-ok", st.ok);
    node.btn.classList.toggle("is-err", !st.ok);
    node.btn.classList.toggle("is-selected", state.selectedSpoke === idx);
    setText(node.statusEl, st.badge);
  });

  // 4 条原海报 TIPS 实况灯
  ev.tipsStatus.forEach((t, idx) => {
    const node = tipNodes[idx];
    if (!node) return;
    node.li.classList.toggle("is-ok", t.ok);
    node.li.classList.toggle("is-err", !t.ok);
    setText(node.noteEl, t.note);
  });
}

// ---------------------------------------------------------------------------
// 6. 绑定开场主画布与控阀事件（拖拽中节流非画布 DOM 更新，绝不抢占帧预算）
// ---------------------------------------------------------------------------
let heroCtrl = null;
let lastDragSync = 0;

function setState(next, opts = {}) {
  state = next;
  if (opts.dragging) {
    const now = performance.now();
    if (now - lastDragSync > 160) {
      lastDragSync = now;
      syncUI(evaluate(state));
    }
    return;
  }
  syncUI(evaluate(state));
  heroCtrl?.draw();
}

buildMedallions();
buildAppsGrid();
buildTipsList();
buildPresets();

heroCtrl = createHeroDial({
  canvas: document.getElementById("hero-canvas"),
  getState: () => state,
  setState,
  onRenderMeta: (ev) => syncUI(ev),
});

// 单步纠偏按钮（桌面 + 移动端首屏共用）
const handleFixClick = (e) => {
  const key = e.currentTarget.dataset.fix;
  if (key) setState(applySingleFix(state, key));
};
els.fixBtn.addEventListener("click", handleFixClick);
els.mobFixBtn.addEventListener("click", handleFixClick);

// 内圈清距滑轨
els.hubRange.addEventListener("input", () => {
  setState({ ...state, hubRatio: Number(els.hubRange.value) / 100 });
});

// 基线 / 节奏 / 指向 排印阀门
document.getElementById("hero-valves").addEventListener("click", (e) => {
  const bBtn = e.target.closest("[data-baseline]");
  if (bBtn) {
    setState({ ...state, baselineMode: bBtn.dataset.baseline });
    return;
  }
  const rBtn = e.target.closest("[data-rhythm]");
  if (rBtn) {
    const mode = rBtn.dataset.rhythm;
    setState({
      ...state,
      rhythmMode: mode,
      spokeReaches: reachesForRhythm(mode),
      spokeTiers: tiersForRhythm(mode),
    });
    return;
  }
  const aBtn = e.target.closest("[data-aim]");
  if (aBtn) {
    setState({ ...state, aimMode: aBtn.dataset.aim });
  }
});

// 初始化首次 UI 状态与正文全部 01–07 互动模块
syncUI(evaluate(state));
initAnatomySection();
initFittsSection();
initStressLabSection();
initHistorySection();
initTriageSection();
initQuizSection();
initPosterLightbox();
