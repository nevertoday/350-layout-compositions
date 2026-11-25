// 251 比例框 · 主入口：联结单真源 model.js、开场画布 stage.js 与 01–07 节交互

import {
  PRESETS,
  clampRatio,
  createInitialState,
  evaluate,
  snapRatio,
} from "./model.js";
import { applyFixAction, mountHeroStage } from "./stage.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

const state = createInitialState();

// DOM 索引
const heroCanvas = document.getElementById("hero-canvas");
const stampEl = document.getElementById("hero-stamp");
const readoutRatioEl = document.getElementById("readout-ratio");
const readoutWordsEl = document.getElementById("readout-words");
const readoutKickerEl = document.getElementById("readout-kicker");
const quickrefUseEl = document.getElementById("quickref-use");
const sliderEl = document.getElementById("ratio-slider");
const presetRowEl = document.getElementById("preset-row");

const diagHeadlineEl = document.getElementById("diag-headline");
const diagWhyEl = document.getElementById("diag-why");
const diagFixHintEl = document.getElementById("diag-fix-hint");
const btnStepFix = document.getElementById("btn-step-fix");
const metricStripEl = document.getElementById("metric-strip");
const liveCssEl = document.getElementById("live-css");

const miniWireRect = document.getElementById("mini-wire-rect");
const miniWireD1 = document.getElementById("mini-wire-d1");
const miniWireD2 = document.getElementById("mini-wire-d2");

const badgeCrop = document.getElementById("badge-crop");
const badgeMedia = document.getElementById("badge-media");
const badgeOrder = document.getElementById("badge-order");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const enableBtns = [...document.querySelectorAll("[data-enable]")];
const fitBtns = [...document.querySelectorAll("[data-fit]")];
const focusBtns = [...document.querySelectorAll("[data-focus]")];
const pillarBtns = [...document.querySelectorAll("[data-pillar]")];
const quickBtns = [...document.querySelectorAll("[data-quick]")];
const btnClsSim = document.getElementById("btn-cls-sim");

// 生成原海报底沿「常用比例速查」5 枚按真实比例绘出的对角虚线十字线框
function buildPresetCards() {
  presetRowEl.innerHTML = PRESETS.map((p) => {
    // 在 58×40 框内等面积/限高按真实 p.ratio 绘出
    const maxW = 56;
    const maxH = 38;
    const area = 1150;
    let rw = Math.sqrt(area * p.ratio);
    let rh = Math.sqrt(area / p.ratio);
    if (rw > maxW) { rw = maxW; rh = rw / p.ratio; }
    if (rh > maxH) { rh = maxH; rw = rh * p.ratio; }
    const x = (60 - rw) / 2;
    const y = (42 - rh) / 2;
    return `
      <button type="button" class="preset-card" data-preset="${p.id}" title="${p.label} ${p.zh}（${p.sceneHint}）">
        <span class="preset-ratio-label">${p.label}</span>
        <span class="preset-wire" aria-hidden="true">
          <svg viewBox="0 0 60 42" width="60" height="42">
            <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" fill="#EADAD2" stroke="#A43C45" stroke-width="1.2"/>
            <line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + rw).toFixed(1)}" y2="${(y + rh).toFixed(1)}" stroke="#A43C45" stroke-width="0.85" stroke-dasharray="2.5 2"/>
            <line x1="${(x + rw).toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + rh).toFixed(1)}" stroke="#A43C45" stroke-width="0.85" stroke-dasharray="2.5 2"/>
            <path d="M27.5 21h5M30 18.5v5" stroke="#D75156" stroke-width="1.4"/>
          </svg>
        </span>
        <span class="preset-zh">${p.zh}${p.posterPick ? " ★" : ""}</span>
        <span class="preset-en" lang="en">${p.en}</span>
      </button>`;
  }).join("");

  presetRowEl.querySelectorAll(".preset-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS.find((x) => x.id === btn.dataset.preset);
      if (!p) return;
      state.ratio = p.ratio;
      syncUI();
      stageCtrl.draw();
    });
  });
}

let lastFixAction = null;

function updateMiniWire(r) {
  const maxW = 52;
  const maxH = 38;
  const area = 1100;
  let rw = Math.sqrt(area * r);
  let rh = Math.sqrt(area / r);
  if (rw > maxW) { rw = maxW; rh = rw / r; }
  if (rh > maxH) { rh = maxH; rw = rh * r; }
  const x = (64 - rw) / 2;
  const y = (48 - rh) / 2;
  miniWireRect.setAttribute("x", x.toFixed(1));
  miniWireRect.setAttribute("y", y.toFixed(1));
  miniWireRect.setAttribute("width", rw.toFixed(1));
  miniWireRect.setAttribute("height", rh.toFixed(1));
  miniWireD1.setAttribute("x1", x.toFixed(1));
  miniWireD1.setAttribute("y1", y.toFixed(1));
  miniWireD1.setAttribute("x2", (x + rw).toFixed(1));
  miniWireD1.setAttribute("y2", (y + rh).toFixed(1));
  miniWireD2.setAttribute("x1", (x + rw).toFixed(1));
  miniWireD2.setAttribute("y1", y.toFixed(1));
  miniWireD2.setAttribute("x2", x.toFixed(1));
  miniWireD2.setAttribute("y2", (y + rh).toFixed(1));
}

// 预先建好 4 格读数 DOM，拖动时只改 textContent 与 classList，零 innerHTML 重建重排
let metricNodes = null;
function ensureMetricNodes() {
  if (metricNodes) return metricNodes;
  metricStripEl.innerHTML = Array.from({ length: 4 }, () => `<div class="metric-cell"><span class="metric-k"></span><strong class="metric-v"></strong></div>`).join("");
  metricNodes = [...metricStripEl.children].map((cell) => ({
    k: cell.querySelector(".metric-k"),
    v: cell.querySelector(".metric-v"),
  }));
  return metricNodes;
}

let lastCssText = "";
let lastHeadline = "";
let lastWhy = "";
let lastFixHint = "";

function syncUI(opts = {}) {
  const ev = evaluate(state);
  lastFixAction = ev.fixAction;

  // 顶眉印章
  if (stampEl.textContent !== ev.stamp) stampEl.textContent = ev.stamp;
  stampEl.classList.toggle("is-ok", ev.ok);

  // 右列大号比例标头
  if (readoutRatioEl.textContent !== ev.ratioLabel) readoutRatioEl.textContent = ev.ratioLabel;
  if (readoutWordsEl.textContent !== ev.char.words) readoutWordsEl.textContent = ev.char.words;
  const isPoster43 = Math.abs(ev.ratio - 4 / 3) < 0.025;
  const kicker = isPoster43 ? "重点推荐 · 原海报经典比例" : `当前装裱画幅（原图 ${ev.scene.naturalLabel}）`;
  if (readoutKickerEl.textContent !== kicker) readoutKickerEl.textContent = kicker;
  const useText = `适用场景：${ev.char.use}`;
  if (quickrefUseEl.textContent !== useText) quickrefUseEl.textContent = useText;

  // 滑尺同步
  if (document.activeElement !== sliderEl) {
    sliderEl.value = ev.ratio.toFixed(2);
  }

  // 5 枚速查线框高亮
  presetRowEl.querySelectorAll(".preset-card").forEach((btn) => {
    const p = PRESETS.find((x) => x.id === btn.dataset.preset);
    btn.classList.toggle("is-active", !!p && Math.abs(ev.ratio - p.ratio) < 0.03);
  });

  // 左列原海报三要点实况灯
  const setBadge = (el, p) => {
    if (el.textContent !== p.badge) el.textContent = p.badge;
    el.classList.toggle("is-ok", p.ok);
  };
  setBadge(badgeCrop, ev.pillars.crop);
  setBadge(badgeMedia, ev.pillars.media);
  setBadge(badgeOrder, ev.pillars.order);

  pillarBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(state.highlightPillar === b.dataset.pillar));
  });

  // NOTE 诊单与实时 CSS（仅文本变化时写 DOM，避免连续拖拽触发多余重排）
  if (lastHeadline !== ev.headline) { diagHeadlineEl.textContent = ev.headline; lastHeadline = ev.headline; }
  if (lastWhy !== ev.why) { diagWhyEl.textContent = ev.why; lastWhy = ev.why; }
  if (lastFixHint !== ev.fixHint) { diagFixHintEl.textContent = ev.fixHint; lastFixHint = ev.fixHint; }
  if (ev.fixAction && ev.fixLabel) {
    btnStepFix.hidden = false;
    if (btnStepFix.textContent !== ev.fixLabel) btnStepFix.textContent = ev.fixLabel;
  } else {
    btnStepFix.hidden = true;
  }

  const nodes = ensureMetricNodes();
  ev.metrics.forEach((m, i) => {
    if (nodes[i].k.textContent !== m.label) nodes[i].k.textContent = m.label;
    if (nodes[i].v.textContent !== m.value) nodes[i].v.textContent = m.value;
    nodes[i].v.classList.toggle("is-bad", !!m.bad);
  });

  if (lastCssText !== ev.cssText) {
    liveCssEl.textContent = ev.cssText;
    lastCssText = ev.cssText;
  }
  updateMiniWire(ev.ratio);

  if (!opts.fromDrag) {
    sceneBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
    enableBtns.forEach((b) => b.classList.toggle("is-active", (b.dataset.enable === "1") === state.enabled));
    fitBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.fit === state.fit));
    focusBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.focus === state.focusKey));
  }
}

buildPresetCards();
const stageCtrl = mountHeroStage(heroCanvas, state, (opts) => syncUI(opts));

// 绑定控件事件
sliderEl.addEventListener("input", () => {
  state.ratio = snapRatio(parseFloat(sliderEl.value), 0.02);
  syncUI();
  stageCtrl.draw();
});

sceneBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.scene = b.dataset.scene;
    syncUI();
    stageCtrl.draw();
  })
);

enableBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.enabled = b.dataset.enable === "1";
    syncUI();
    stageCtrl.draw();
  })
);

fitBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.fit = b.dataset.fit;
    syncUI();
    stageCtrl.draw();
  })
);

focusBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.focusKey = b.dataset.focus;
    syncUI();
    stageCtrl.draw();
  })
);

pillarBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.highlightPillar = state.highlightPillar === b.dataset.pillar ? null : b.dataset.pillar;
    syncUI();
    stageCtrl.draw();
  })
);

btnStepFix.addEventListener("click", () => {
  if (!lastFixAction) return;
  applyFixAction(state, lastFixAction);
  syncUI();
  stageCtrl.draw();
});

btnClsSim.addEventListener("click", () => {
  state.clsRunning = true;
  state.clsProgress = 0;
  state.clsTriggeredOnce = true;
  syncUI();
  stageCtrl.draw();
});

quickBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.quick;
    if (k === "bad") {
      Object.assign(state, createInitialState());
    } else if (k === "43") {
      state.enabled = true;
      state.fit = "cover";
      state.ratio = 4 / 3;
      state.focusKey = state.scene === "silhouette" ? "top" : "center";
    } else if (k === "32") {
      state.enabled = true;
      state.fit = "cover";
      state.ratio = 3 / 2;
      state.focusKey = state.scene === "silhouette" ? "top" : "center";
    } else if (k === "169") {
      state.enabled = true;
      state.fit = "cover";
      state.ratio = 16 / 9;
      state.focusKey = state.scene === "silhouette" ? "top" : "center";
    } else if (k === "11") {
      state.enabled = true;
      state.fit = "cover";
      state.ratio = 1;
      state.focusKey = state.scene === "sunset" ? "sun" : state.scene === "silhouette" ? "top" : "center";
    }
    state.clsRunning = false;
    state.clsProgress = 1;
    syncUI();
    stageCtrl.draw();
  })
);

// 初始同步 & 挂载正文各节
syncUI();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
