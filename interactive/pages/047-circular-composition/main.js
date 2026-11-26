// 047 圆形构图 · 主入口
// 单真源驱动：星盘画布、四项原则实况探针、单真源诊单、底部 TIPS 四步图与正文七节交互同步联动。

import {
  INITIAL_STATE,
  PRESETS,
  SKINS,
  applyQuickFix,
  cloneState,
  evaluate,
  normDeg,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import {
  initAspectStress,
  initBuildTheater,
  initClosureLab,
  initHistoryDeck,
  initPosterLightbox,
  initQuiz,
  initXrayCurtain,
} from "./widgets.js";

const state = cloneState(INITIAL_STATE);

const els = {
  canvas: document.getElementById("heroCanvas"),
  topChip: document.getElementById("topStatusChip"),
  skinBtns: [...document.querySelectorAll("[data-skin]")],
  principleCards: [...document.querySelectorAll("[data-principle]")],
  // 诊单
  diagChip: document.getElementById("diagChip"),
  diagHeadline: document.getElementById("diagHeadline"),
  diagBody: document.getElementById("diagBody"),
  diagAction: document.getElementById("diagAction"),
  diagFixBtn: document.getElementById("diagFixBtn"),
  diagPulseBtn: document.getElementById("diagPulseBtn"),
  diagBox: document.getElementById("diagBox"),
  // 四项单真源读数
  mGap: document.getElementById("metricGap"),
  mTorque: document.getElementById("metricTorque"),
  mRatio: document.getElementById("metricRatio"),
  mPosture: document.getElementById("metricPosture"),
  // 轨控
  focusRange: document.getElementById("focusRange"),
  focusVal: document.getElementById("focusVal"),
  orbitRange: document.getElementById("orbitRange"),
  orbitVal: document.getElementById("orbitVal"),
  arcBtns: [...document.querySelectorAll("[data-arc-mode]")],
  dotBtn: document.getElementById("dotRingToggle"),
  dirBtns: [...document.querySelectorAll("[data-flow-dir]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  resetBtn: document.getElementById("resetOpening"),
  // 底部原海报 TIPS 四步条
  tipStepCards: [...document.querySelectorAll("[data-tip-step]")],
};

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}
function setData(el, key, val) {
  if (el && el.dataset[key] !== val) el.dataset[key] = val;
}

function syncAllUI() {
  const res = evaluate(state);
  const ok = res.passCount === 4;
  const tone = ok ? "ok" : "bad";

  // 顶栏与诊单状态胶囊（值未变时不触发 DOM 写操作，拖动更顺滑）
  setText(els.topChip, res.statusChip);
  setData(els.topChip, "tone", tone);
  setText(els.diagChip, res.statusChip);
  setData(els.diagChip, "tone", tone);
  setData(els.diagBox, "tone", tone);

  setText(els.diagHeadline, res.headline);
  setText(els.diagBody, res.body);
  setText(els.diagAction, res.action);
  setText(els.diagFixBtn, res.fixLabel);
  setData(els.diagFixBtn, "fixType", res.fixType);

  // 读数（严格单真源，态势明确标「示意」）
  setText(els.mGap, `${res.metrics.maxGapDeg}°`);
  setText(els.mTorque, `${res.metrics.torquePct}%`);
  setText(els.mRatio, `${res.metrics.hierarchyRatio.toFixed(2)}×`);
  setText(els.mPosture, res.posture);

  // 4 枚原海报原则实况探针
  els.principleCards.forEach((card) => {
    const key = card.dataset.principle;
    const p = res.pillars[key];
    if (!p) return;
    const badge = card.querySelector(".p-tag");
    setText(badge, p.tag);
    setData(card, "ok", String(p.ok));
    const active = state.highlight === key;
    if (card.getAttribute("aria-pressed") !== String(active)) {
      card.setAttribute("aria-pressed", String(active));
      card.classList.toggle("is-hi", active);
    }
  });

  // 底部原海报 TIPS 四步微缩卡联动点亮
  els.tipStepCards.forEach((card) => {
    const idx = +card.dataset.tipStep - 1;
    const done = !!res.steps[idx];
    setData(card, "done", String(done));
    const st = card.querySelector(".tip-step-state");
    setText(st, done ? "已达成" : "待校准");
  });

  // 题材皮肤按钮
  els.skinBtns.forEach((b) => {
    const on = b.dataset.skin === state.skin;
    if (b.getAttribute("aria-pressed") !== String(on)) {
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    }
  });

  // 滑杆读数同步
  const fStr = String(Math.round(state.focusR * 100));
  if (els.focusRange.value !== fStr) els.focusRange.value = fStr;
  setText(els.focusVal, `${fStr}%`);
  const oStr = String(Math.round(state.orbitR * 100));
  if (els.orbitRange.value !== oStr) els.orbitRange.value = oStr;
  setText(els.orbitVal, `${oStr}%`);

  // 引导弧 / 内点阵 / 流向开关
  els.arcBtns.forEach((b) => {
    const on = b.dataset.arcMode === state.arcMode;
    if (b.getAttribute("aria-pressed") !== String(on)) {
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    }
  });
  if (els.dotBtn.getAttribute("aria-pressed") !== String(state.dotRing)) {
    els.dotBtn.setAttribute("aria-pressed", String(state.dotRing));
    els.dotBtn.classList.toggle("is-active", state.dotRing);
    setText(els.dotBtn, state.dotRing ? "蓝点内环：开" : "蓝点内环：关");
  }

  els.dirBtns.forEach((b) => {
    const on = Number(b.dataset.flowDir) === state.flowDir;
    if (b.getAttribute("aria-pressed") !== String(on)) {
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    }
  });
}

// 挂载开场星盘（拖拽过程节流 DOM 诊单更新至 120ms，松手/点按立刻同步，避免软件渲染下每帧强排 HTML）
let heroCtrl = null;
let lastUiSync = 0;
let uiTimer = 0;
function scheduleSyncUI(immediate = false) {
  if (immediate) {
    clearTimeout(uiTimer);
    uiTimer = 0;
    lastUiSync = performance.now();
    syncAllUI();
    return;
  }
  const now = performance.now();
  if (now - lastUiSync >= 120) {
    clearTimeout(uiTimer);
    uiTimer = 0;
    lastUiSync = now;
    syncAllUI();
  } else if (!uiTimer) {
    uiTimer = setTimeout(() => {
      uiTimer = 0;
      lastUiSync = performance.now();
      syncAllUI();
    }, 120 - (now - lastUiSync));
  }
}

if (els.canvas) {
  heroCtrl = mountHeroCanvas(
    els.canvas,
    () => state,
    (mutator, flush = false) => {
      mutator(state);
      scheduleSyncUI(flush);
    }
  );
}

function redrawAndSync() {
  syncAllUI();
  if (heroCtrl) heroCtrl.draw();
}

// 题材切换
els.skinBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.skin = b.dataset.skin;
    redrawAndSync();
  });
});

// 原则探针点击高亮对应结构层
els.principleCards.forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.principle;
    state.highlight = state.highlight === key ? null : key;
    redrawAndSync();
  });
});

// 诊单快捷纠偏 / 演播脉冲
els.diagFixBtn.addEventListener("click", () => {
  const fixType = els.diagFixBtn.dataset.fixType;
  if (fixType === "pulse") {
    if (heroCtrl) heroCtrl.startPulse();
    return;
  }
  const fixed = applyQuickFix(state, fixType);
  Object.assign(state, fixed);
  redrawAndSync();
});

els.diagPulseBtn.addEventListener("click", () => {
  if (heroCtrl) heroCtrl.startPulse();
});

// 滑杆与轨道精控
els.focusRange.addEventListener("input", () => {
  state.focusR = +(Number(els.focusRange.value) / 100).toFixed(3);
  redrawAndSync();
});

els.orbitRange.addEventListener("input", () => {
  state.orbitR = +(Number(els.orbitRange.value) / 100).toFixed(3);
  redrawAndSync();
});

els.arcBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.arcMode = b.dataset.arcMode;
    redrawAndSync();
  });
});

els.dotBtn.addEventListener("click", () => {
  state.dotRing = !state.dotRing;
  redrawAndSync();
});

els.dirBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.flowDir = Number(b.dataset.flowDir);
    redrawAndSync();
  });
});

// 多组合法解与试错预设
els.presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    const patch = p.patch;
    state.focusX = patch.focusX;
    state.focusY = patch.focusY;
    state.focusR = patch.focusR;
    state.orbitR = patch.orbitR;
    state.arcMode = patch.arcMode;
    state.dotRing = patch.dotRing;
    state.flowDir = patch.flowDir;
    state.sats = patch.sats.map((s) => ({ ...s }));
    state.highlight = null;
    redrawAndSync();
  });
});

els.resetBtn.addEventListener("click", () => {
  const fresh = cloneState(INITIAL_STATE);
  fresh.skin = state.skin;
  Object.assign(state, fresh);
  redrawAndSync();
});

// 底部 TIPS 四步卡片：点击即可聚焦演示对应步骤
els.tipStepCards.forEach((card) => {
  card.addEventListener("click", () => {
    const step = +card.dataset.tipStep;
    if (step === 1) {
      state.focusX = 0;
      state.focusY = 0;
      state.focusR = Math.max(0.29, Math.min(0.32, state.focusR));
      state.highlight = "center";
    } else if (step === 2) {
      const base = normDeg(state.sats[0].angle);
      state.sats.forEach((s, i) => (s.angle = normDeg(base + i * 90)));
      state.highlight = "enclosure";
    } else if (step === 3) {
      state.sats.forEach((s) => (s.tier = "md"));
      state.focusR = 0.31;
      state.orbitR = 0.68;
      state.highlight = "unity";
    } else if (step === 4) {
      state.arcMode = "dashed";
      state.dotRing = true;
      state.flowDir = 1;
      state.highlight = "flow";
      if (heroCtrl) heroCtrl.startPulse();
    }
    redrawAndSync();
  });
});

// 启动同步与正文各节独立组件
syncAllUI();
initClosureLab();
initXrayCurtain();
initBuildTheater();
initHistoryDeck();
initAspectStress();
initQuiz();
initPosterLightbox();
