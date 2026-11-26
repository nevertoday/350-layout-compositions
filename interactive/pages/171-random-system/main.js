// 171 随机 系统 RANDOM SYSTEM — 主控入口：连接单真源状态、开场主角台与 01–07 互动模块

import { DEFAULT_STATE, PRESETS, PALETTE, mulberry32 } from "./model.js";
import { createHeroBench } from "./hero-stage.js";
import {
  initGaltonLab,
  initDistributionLab,
  initModelDarkroom,
  initHistoryArchive,
  initStressLab,
  initQuiz,
  initPosterLightbox,
} from "./sections.js";

let state = { ...DEFAULT_STATE, pins: {} };

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const statusStamp = document.getElementById("hero-status-stamp");
const briefTabs = [...document.querySelectorAll("[data-brief]")];
const distBtns = [...document.querySelectorAll("[data-dist]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const disorderRange = document.getElementById("disorder-range");
const disorderVal = document.getElementById("disorder-val");
const btnHierarchy = document.getElementById("btn-hierarchy");
const btnGuard = document.getElementById("btn-guard");
const btnClearPins = document.getElementById("btn-clear-pins");
const pinCountEl = document.getElementById("pin-count");
const btnReroll = document.getElementById("btn-reroll");

const diagCard = document.getElementById("diag-card");
const diagKicker = document.getElementById("diag-kicker");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const btnPrimaryFix = document.getElementById("btn-primary-fix");
const mOverlap = document.getElementById("m-overlap");
const mAngle = document.getElementById("m-angle");
const mScale = document.getElementById("m-scale");
const mOffset = document.getElementById("m-offset");
const mRegime = document.getElementById("m-regime");
const stickySeed = document.getElementById("sticky-seed");
const spectrumPin = document.getElementById("spectrum-pin");
const constellationSvg = document.getElementById("hero-constellation");

const titleGlyphs = [0, 1, 2, 3].map((i) => document.getElementById(`tg-${i}`));

const bench = createHeroBench(
  heroCanvas,
  () => state,
  (patch) => updateState(patch)
);

function renderConstellation(disorder, seed) {
  if (!constellationSvg) return;
  const rng = mulberry32(seed * 41 + 9);
  const cols = [PALETTE.ink, PALETTE.ink, PALETTE.cobalt, PALETTE.lime, PALETTE.red];
  const parts = [];
  for (let i = 0; i < 42; i++) {
    const gx = 28 + (i % 7) * 20;
    const gy = 14 + Math.floor(i / 7) * 14;
    const angle = rng() * Math.PI * 2;
    const radius = Math.pow(rng(), 0.7) * 44;
    const rx = 98 + Math.cos(angle) * radius * 1.45;
    const ry = 48 + Math.sin(angle) * radius * 0.92;
    const x = gx + (rx - gx) * Math.max(0.06, disorder);
    const y = gy + (ry - gy) * Math.max(0.06, disorder);
    const r = 1.6 + rng() * 2.4;
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${cols[i % cols.length]}"/>`);
  }
  constellationSvg.innerHTML = parts.join("");
}

function updateSelfDemoTitle(disorder) {
  // 自示范巨标：克制微移微倾（绝不裁切或断行），0% 时完全平直，高扰动时浮现轻盈随机张力
  const shifts = [
    { dx: -2.2, dy: -2.5, deg: -3.2 },
    { dx: 2.0, dy: 2.2, deg: 2.8 },
    { dx: 1.5, dy: -1.8, deg: 2.2 },
    { dx: -1.8, dy: 2.6, deg: -3.0 },
  ];
  const k = Math.min(1, disorder);
  titleGlyphs.forEach((el, idx) => {
    if (!el) return;
    const s = shifts[idx];
    if (k < 0.06) {
      el.style.transform = "none";
    } else {
      el.style.transform = `translate(${(s.dx * k).toFixed(1)}px, ${(s.dy * k).toFixed(1)}px) rotate(${(s.deg * k).toFixed(1)}deg)`;
    }
  });
}

function syncUI() {
  const { ev } = bench.getMetrics();

  // 1. 顶栏状态章 & 控件同步
  statusStamp.textContent = ev.badgeShort;
  statusStamp.className = `status-stamp is-${ev.statusKind}`;

  briefTabs.forEach((b) => {
    const active = b.dataset.brief === state.briefId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  distBtns.forEach((b) => {
    b.classList.toggle("is-active", b.dataset.dist === state.dist);
  });

  const pct = Math.round(state.disorder * 100);
  disorderRange.value = String(pct);
  disorderVal.textContent = `${pct}%`;

  const layered = state.hierarchy === "layered";
  btnHierarchy.setAttribute("aria-pressed", String(layered));
  btnHierarchy.textContent = layered ? "层级：阶梯主次" : "层级：同号拉平";

  btnGuard.setAttribute("aria-pressed", String(state.guard));
  btnGuard.textContent = state.guard ? "避碰护栏：开" : "避碰护栏：关";

  const pinTotal = Object.keys(state.pins || {}).length;
  btnClearPins.hidden = pinTotal === 0;
  pinCountEl.textContent = String(pinTotal);

  // 2. 四项原海报特征活体状态
  for (const key of ["chance", "variation", "irregular", "motion"]) {
    const t = ev.traits[key];
    const item = document.querySelector(`[data-trait="${key}"]`);
    const tag = document.getElementById(`trait-${key}-tag`);
    if (item) item.classList.toggle("is-ok", t.ok);
    if (tag) tag.textContent = t.tag;
  }

  // 3. 钴蓝胶带单真源诊单卡
  diagCard.className = `taped-card is-${ev.statusKind}`;
  diagKicker.textContent = ev.badgeShort;
  diagTitle.textContent = ev.primary.title;
  diagWhy.textContent = ev.primary.why;
  diagAction.textContent = ev.primary.action;
  btnPrimaryFix.textContent = ev.primary.fixLabel;
  btnPrimaryFix.dataset.fix = ev.primary.fixAction;

  mOverlap.textContent = `${ev.overlapPct.toFixed(1)}%`;
  mAngle.textContent = `${Math.round(ev.maxAnyAngle)}°`;
  mScale.textContent = `${ev.scaleRatio.toFixed(1)}×`;
  mOffset.textContent = `${ev.offsetPct.toFixed(0)}%`;
  mRegime.textContent = ev.regime;

  // 4. 折角酸柠绿便签核验单
  stickySeed.textContent = `SEED #${state.seed}`;
  const chkMap = [
    ["chk-overlap", ev.checks.checkNoOverlap],
    ["chk-hierarchy", ev.checks.checkHierarchy],
    ["chk-random", ev.checks.checkModerateRandom],
    ["chk-balance", ev.checks.checkBalanceEdge],
  ];
  for (const [id, ok] of chkMap) {
    const li = document.getElementById(id);
    if (!li) continue;
    li.classList.toggle("is-pass", ok);
    const box = li.querySelector(".chk-box");
    if (box) box.textContent = ok ? "✓" : "×";
  }

  // 5. 底沿「随机 ≠ 混乱」光谱指示针 + 自示范巨标 + 散点云
  if (spectrumPin) spectrumPin.style.left = `${ev.spectrumPos.toFixed(1)}%`;
  updateSelfDemoTitle(state.disorder);
  renderConstellation(state.disorder, state.seed);
}

function updateState(patch) {
  state = { ...state, ...patch };
  bench.refresh();
  syncUI();
}

// 绑定开场交互控件
briefTabs.forEach((b) => {
  b.addEventListener("click", () => updateState({ briefId: b.dataset.brief, pins: {} }));
});

distBtns.forEach((b) => {
  b.addEventListener("click", () => updateState({ dist: b.dataset.dist }));
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    updateState({ ...p.patch, pins: { ...(p.patch.pins || {}) } });
  });
});

disorderRange.addEventListener("input", () => {
  updateState({ disorder: Number(disorderRange.value) / 100 });
});

btnHierarchy.addEventListener("click", () => {
  updateState({ hierarchy: state.hierarchy === "layered" ? "flat" : "layered" });
});

btnGuard.addEventListener("click", () => {
  updateState({ guard: !state.guard });
});

btnClearPins.addEventListener("click", () => {
  updateState({ pins: {} });
});

btnReroll.addEventListener("click", () => {
  updateState({ seed: state.seed + 1 });
});

btnPrimaryFix.addEventListener("click", () => {
  const act = btnPrimaryFix.dataset.fix;
  if (act === "reroll") {
    updateState({ seed: state.seed + 1 });
  } else if (act === "fix_overlap") {
    updateState({ guard: true, disorder: 0.44, hierarchy: "layered", dist: state.dist === "exponential" ? "normal" : state.dist });
  } else if (act === "fix_tilt") {
    updateState({ guard: true, disorder: 0.42 });
  } else if (act === "fix_rigid") {
    updateState({ disorder: 0.44, guard: true, hierarchy: "layered" });
  } else if (act === "fix_hierarchy") {
    updateState({ hierarchy: "layered" });
  } else if (act === "fix_balance") {
    updateState({ dist: "normal", guard: true, pins: {} });
  } else if (act === "fix_edge") {
    updateState({ guard: true, pins: {} });
  } else {
    updateState({ ...PRESETS.normal_focus.patch, pins: {} });
  }
});

// 初始化 UI 与正文 01–07 模块
syncUI();
initGaltonLab();
initDistributionLab();
initModelDarkroom();
initHistoryArchive();
initStressLab();
initQuiz();
initPosterLightbox();
