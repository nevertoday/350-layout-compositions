// 087 放射平衡 RADIAL BALANCE — 主入口与单真源同步控制器
import { loop } from "../../lib/stage.js";
import { createBrokenState, createPreset, evaluate, setRayCount } from "./model.js";
import { mountAstrolabe } from "./astrolabe.js";
import { initAntiCases, initHistoryLab, initPieDemo, initPosterLightbox, initQuiz, initTierDeck, initTugLab } from "./sections.js";

const state = createBrokenState("poster");
const canvas = document.getElementById("astrolabe");
const titleGlyph = document.getElementById("title-glyph");

const dom = {
  mastStatus: document.getElementById("mast-status"),
  rngSpan: document.getElementById("rng-span"),
  rngHub: document.getElementById("rng-hub"),
  rngRhythm: document.getElementById("rng-rhythm"),
  rngReach: document.getElementById("rng-reach"),
  valSpan: document.getElementById("val-span"),
  valHub: document.getElementById("val-hub"),
  valRhythm: document.getElementById("val-rhythm"),
  valReach: document.getElementById("val-reach"),
  diagLevel: document.getElementById("diag-level"),
  diagHeadline: document.getElementById("diag-headline"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  btnFix: document.getElementById("btn-fix"),
  btnPulse: document.getElementById("btn-pulse"),
  btnPulseTop: document.getElementById("btn-pulse-top"),
  btnReset: document.getElementById("btn-reset"),
  btnGuides: document.getElementById("btn-guides"),
};

// 缓存节点避免高频拖拽时重复查询 DOM
const probeEls = {};
for (const key of ["center", "extend", "balance", "rhythm"]) {
  probeEls[key] = {
    card: document.getElementById(`probe-${key}`),
    badge: document.getElementById(`badge-${key}`),
    metric: document.getElementById(`metric-${key}`),
    kwStat: document.getElementById(`kw-stat-${key}`),
    kwItem: document.querySelector(`.kw-item[data-probe="${key}"]`),
  };
}
const rayBtns = [...document.querySelectorAll("[data-rays]")];
const specBtns = [...document.querySelectorAll(".spec-btn")];

// 安全写入：只有值真的变化时才碰 DOM，拖拽 60fps 零冗余回流
function setText(el, txt) {
  if (el && el.textContent !== txt) el.textContent = txt;
}

let lastGlyphKey = "";
function renderTitleGlyph(ev) {
  if (!titleGlyph) return;
  const gKey = `${Math.round(state.spanDeg / 6)}|${ev.hubPct}|${ev.activeCount}|${Math.round(state.reach * 20)}`;
  if (gKey === lastGlyphKey) return;
  lastGlyphKey = gKey;
  const cx = 22;
  const cy = 22;
  const rHub = 3 + ev.hubR * 18;
  const lines = ev.rays.filter((r) => r.active).slice(0, 12).map((r) => {
    const r0 = rHub + 2.2;
    const r1 = 10 + r.outerR * 9.5;
    const x1 = (cx + Math.cos(r.angleRad) * r0).toFixed(1);
    const y1 = (cy + Math.sin(r.angleRad) * r0).toFixed(1);
    const x2 = (cx + Math.cos(r.angleRad) * r1).toFixed(1);
    const y2 = (cy + Math.sin(r.angleRad) * r1).toFixed(1);
    const col = r.tier === 3 ? "#641720" : r.tier === 2 ? "#341114" : "#B47F5A";
    const sw = r.tier === 3 ? 1.8 : 1.2;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }).join("");
  titleGlyph.innerHTML = `${lines}<circle cx="${cx}" cy="${cy}" r="${rHub.toFixed(1)}" fill="#E45B45"/>`;
}

// 标记是否待在下一帧同步 DOM（把 60Hz touchmove 合并到 rAF 里）
let uiDirty = true;

function syncUI() {
  uiDirty = false;
  const ev = evaluate(state);

  setText(dom.mastStatus, ev.tag);
  dom.mastStatus.classList.toggle("is-ok", ev.isOk);

  const spanStr = String(Math.round(state.spanDeg));
  const hubStr = String(Math.round(state.hubRatio * 100));
  const rhyStr = String(Math.round(state.rhythmContrast));
  const rchStr = String(Math.round(state.reach * 100));
  if (dom.rngSpan.value !== spanStr) dom.rngSpan.value = spanStr;
  if (dom.rngHub.value !== hubStr) dom.rngHub.value = hubStr;
  if (dom.rngRhythm.value !== rhyStr) dom.rngRhythm.value = rhyStr;
  if (dom.rngReach.value !== rchStr) dom.rngReach.value = rchStr;

  setText(dom.valSpan, `${spanStr}°`);
  setText(dom.valHub, `${ev.hubPct}%`);
  setText(dom.valRhythm, `${rhyStr}%`);
  setText(dom.valReach, `${ev.reachPct}%`);

  for (const key of ["center", "extend", "balance", "rhythm"]) {
    const p = ev.probes[key];
    const refs = probeEls[key];
    if (refs.card) {
      refs.card.classList.toggle("is-pass", p.pass);
      refs.card.classList.toggle("is-highlighted", state.highlightMode === key);
    }
    setText(refs.badge, p.badge);
    setText(refs.metric, p.metric);
    setText(refs.kwStat, p.badge);
    if (refs.kwItem) {
      refs.kwItem.classList.toggle("is-pass", p.pass);
      refs.kwItem.classList.toggle("is-highlighted", state.highlightMode === key);
    }
  }

  setText(dom.diagLevel, ev.summaryLevel);
  setText(dom.diagHeadline, ev.headline);
  setText(dom.diagWhy, ev.why);
  setText(dom.diagAction, ev.action);
  setText(dom.btnFix, ev.fixLabel);
  dom.btnFix.dataset.action = ev.fixAction;

  for (const b of rayBtns) {
    b.classList.toggle("is-active", Number(b.dataset.rays) === state.rayCount);
  }
  for (const b of specBtns) {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }

  renderTitleGlyph(ev);
  return ev;
}

const astrolabe = mountAstrolabe(canvas, state, (reason) => {
  uiDirty = true;
  // 拖拽中完全由 rAF loop 每帧最多同步一次（绝不双绘），点按动作立即同步保证即时反馈
  if (reason !== "drag") {
    syncUI();
    heroLoop.draw();
  }
});

const heroLoop = loop(canvas, (t, dt, meta) => {
  if (uiDirty) syncUI();
  astrolabe.render(t, dt, meta);
});

function commitChange() {
  astrolabe.markDirty();
  syncUI();
  heroLoop.draw();
}

function applyPreset(name) {
  const next = createPreset(name, state.specimen);
  Object.assign(state, next);
  commitChange();
}

specBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    commitChange();
  });
});

dom.rngSpan.addEventListener("input", () => {
  let v = Number(dom.rngSpan.value);
  if (Math.abs(v - 360) < 5) v = 360;
  state.spanDeg = v;
  if (Math.abs(v - 360) < 10) state.startDeg = -90;
  commitChange();
});
dom.rngHub.addEventListener("input", () => {
  state.hubRatio = Number(dom.rngHub.value) / 100;
  commitChange();
});
dom.rngRhythm.addEventListener("input", () => {
  state.rhythmContrast = Number(dom.rngRhythm.value);
  commitChange();
});
dom.rngReach.addEventListener("input", () => {
  state.reach = Number(dom.rngReach.value) / 100;
  commitChange();
});

rayBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    setRayCount(state, Number(btn.dataset.rays));
    commitChange();
  });
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});

dom.btnFix.addEventListener("click", () => {
  const act = dom.btnFix.dataset.action;
  if (act === "pulse") {
    astrolabe.startPulse();
    heroLoop.draw();
    return;
  } else if (act === "fixBalance") {
    state.spanDeg = 360;
    state.startDeg = -90;
    state.angleOffsets = new Array(state.rayCount).fill(0);
    if (state.tiers.filter((t) => t > 0).length < 6) setRayCount(state, state.rayCount);
  } else if (act === "fixCenter") {
    state.hubRatio = 0.20;
    state.hubOffset = { x: 0, y: 0 };
  } else if (act === "fixRhythm") {
    state.rhythmContrast = 68;
    if (new Set(state.tiers.filter((t) => t > 0)).size < 2) setRayCount(state, state.rayCount);
  } else if (act === "fixExtend") {
    state.reach = 0.86;
  } else {
    applyPreset("posterClassic");
    astrolabe.startPulse();
    return;
  }
  commitChange();
});

const triggerPulse = () => {
  astrolabe.startPulse();
  heroLoop.draw();
};
dom.btnPulse.addEventListener("click", triggerPulse);
dom.btnPulseTop?.addEventListener("click", triggerPulse);
dom.btnReset.addEventListener("click", () => applyPreset("broken"));

dom.btnGuides?.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  dom.btnGuides.classList.toggle("is-on", state.showGuides);
  dom.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  dom.btnGuides.textContent = state.showGuides ? "测角刻度：开" : "测角刻度：关";
  astrolabe.markDirty();
  heroLoop.draw();
});

document.querySelectorAll("[data-probe]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.probe;
    state.highlightMode = state.highlightMode === k ? null : k;
    commitChange();
  });
});

document.addEventListener("keydown", (e) => {
  const tag = (e.target?.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (e.code === "Space") {
    const box = document.getElementById("lightbox");
    if (box && !box.hidden) return;
    if (tag === "BUTTON") return;
    e.preventDefault();
    triggerPulse();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.spanDeg = Math.min(435, state.spanDeg + 15);
    if (Math.abs(state.spanDeg - 360) < 8) { state.spanDeg = 360; state.startDeg = -90; }
    commitChange();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.spanDeg = Math.max(90, state.spanDeg - 15);
    commitChange();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.hubRatio = Math.min(0.42, +(state.hubRatio + 0.02).toFixed(2));
    commitChange();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.hubRatio = Math.max(0.05, +(state.hubRatio - 0.02).toFixed(2));
    commitChange();
  }
});

syncUI();
heroLoop.draw();
initTugLab();
initTierDeck();
initHistoryLab();
initPieDemo();
initAntiCases();
initQuiz();
initPosterLightbox();
