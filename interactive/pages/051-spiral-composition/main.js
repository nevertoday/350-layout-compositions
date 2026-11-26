// 051 螺旋构图 · 主入口：单真源 UI 同步、键盘操控、正文互动与原海报灯箱

import {
  FAILURE_PRESETS,
  OPENING_STATE,
  SOLUTIONS,
  auditSpiral,
  clamp,
  createInitialState,
  radialFraction,
} from "./model.js";
import { mountHeroStage } from "./heroStage.js";
import {
  mountContourDemo,
  mountHistoryDemo,
  mountMathCompareDemo,
  mountMythBusterDemo,
  mountQuiz,
  mountUsageDemo,
} from "./demos.js";

const state = createInitialState();

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// 自示范标题活螺徽：随实时圈数、扩张倍比与方向重绘 SVG 路径
function updateTitleEmblem(audit) {
  const pathEl = $("#hero-title-spiral-path");
  const dotEl = $("#hero-title-spiral-dot");
  if (!pathEl) return;
  const turns = clamp(state.turns, 0.55, 3.2);
  const thetaTotal = turns * Math.PI * 2;
  const cx = 24;
  const cy = 24;
  const maxR = 19;
  const minR = 3.2;
  const steps = 64;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const frac = radialFraction(s, state.curveType === "kink" ? "log" : state.curveType, turns, state.growth);
    const r = minR + (maxR - minR) * frac;
    const ang = -Math.PI * 0.65 + state.dir * s * thetaTotal;
    const x = (cx + Math.cos(ang) * r).toFixed(1);
    const y = (cy + Math.sin(ang) * r).toFixed(1);
    d += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }
  pathEl.setAttribute("d", d);
  if (dotEl) {
    const off = !audit.checks.focus.ok && audit.checks.focus.code === "offcore";
    dotEl.setAttribute("cx", off ? "10" : "24");
    dotEl.setAttribute("cy", off ? "11" : "24");
  }
}

// 将单真源 audit 同步到全开场界面（刊头徽、四竖点、灯泡诊单、底沿四圆徽、滑轨与按钮）
function syncUI(audit) {
  const m = audit.geom.metrics;
  const okAll = audit.score === 4;

  // 1. 顶部与移动端实时状态章
  for (const el of $$("[data-status-pill]")) {
    el.textContent = `${audit.score}/4 · ${audit.statusTag}`;
    el.dataset.ok = String(okAll);
  }

  // 2. 自示范标题螺徽
  updateTitleEmblem(audit);

  // 3. 左栏原海报四点竖列实时探针 + 底沿四色圆徽实时读数
  const map = {
    guidance: audit.checks.guidance,
    rhythm: audit.checks.rhythm,
    focus: audit.checks.focus,
    movement: audit.checks.movement,
  };
  for (const key of Object.keys(map)) {
    const chk = map[key];
    for (const stepBtn of $$(`[data-layer-btn="${key}"]`)) {
      stepBtn.dataset.ok = String(chk.ok);
      stepBtn.classList.toggle("is-selected", state.activeLayer === key);
      stepBtn.setAttribute("aria-pressed", String(state.activeLayer === key));
      const badge = stepBtn.querySelector("[data-layer-badge]");
      if (badge) badge.textContent = chk.badge;
      const short = stepBtn.querySelector("[data-layer-short]");
      if (short) short.textContent = chk.short;
    }
  }

  // 4. 原海报圆角灯泡诊单卡（单真源白话解释）
  const diagCard = $("#diag-card");
  if (diagCard) diagCard.dataset.ok = String(okAll);
  const diagScore = $("#diag-score");
  if (diagScore) diagScore.textContent = `${audit.score}/4`;
  const diagTier = $("#diag-tier");
  if (diagTier) diagTier.textContent = audit.tierLabel;
  const diagHeadline = $("#diag-headline");
  if (diagHeadline) diagHeadline.textContent = audit.diagnosis.headline;
  for (const el of $$("[data-mobile-diag-headline]")) {
    el.textContent = audit.diagnosis.headline;
  }
  const diagBody = $("#diag-body");
  if (diagBody) diagBody.textContent = audit.diagnosis.body;
  const diagAction = $("#diag-action");
  if (diagAction) diagAction.textContent = audit.diagnosis.action;

  // 5. 滑轨数值同步
  const syncRange = (id, val, labelId, text) => {
    const inp = $(id);
    if (inp && Math.abs(Number(inp.value) - val) > 0.005) inp.value = String(val);
    const lbl = $(labelId);
    if (lbl) lbl.textContent = text;
  };
  syncRange("#ctrl-turns", state.turns, "#val-turns", `${m.turns.toFixed(2)} 圈`);
  syncRange("#mobile-turns", state.turns, "#mobile-turns-val", `${m.turns.toFixed(2)} 圈`);
  syncRange("#ctrl-growth", state.growth, "#val-growth", `${m.quarterRatio.toFixed(2)}×`);
  syncRange("#ctrl-taper", state.taper, "#val-taper", `${m.taperRatio.toFixed(1)}×`);
  syncRange("#ctrl-span", Math.round(state.entrySpan * 100), "#val-span", `${m.spanPct}%`);

  // 6. 标本、曲线模式、方向与网格按钮状态
  for (const b of $$("[data-specimen]")) {
    const on = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of $$("[data-curve]")) {
    const on = b.dataset.curve === state.curveType;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  }
  const dirBtn = $("#btn-dir");
  if (dirBtn) {
    dirBtn.textContent = state.dir > 0 ? "顺时针 ↻" : "逆时针 ↺";
    dirBtn.setAttribute("aria-pressed", String(state.dir < 0));
  }
  const gridBtn = $("#btn-grid");
  if (gridBtn) {
    gridBtn.textContent = state.showGoldenGrid ? "黄金分格 · 开" : "黄金分格 · 关";
    gridBtn.classList.toggle("is-active", state.showGoldenGrid);
    gridBtn.setAttribute("aria-pressed", String(state.showGoldenGrid));
  }
}

// 挂载开场「盘螺导引台」
const heroCanvas = $("#hero-canvas");
const heroStage = mountHeroStage(heroCanvas, state, { onChange: syncUI });

function commitState() {
  heroStage.markDirty();
  const audit = heroStage.getAudit();
  syncUI(audit);
  heroStage.draw();
}

// 初次同步
syncUI(heroStage.getAudit());

// 绑定所有开场控件
for (const btn of $$("[data-specimen]")) {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    commitState();
  });
}

for (const btn of $$("[data-curve]")) {
  btn.addEventListener("click", () => {
    state.curveType = btn.dataset.curve;
    if (state.curveType === "log" && state.growth < 1.25) {
      state.growth = 1.62;
    }
    commitState();
  });
}

for (const btn of $$("[data-layer-btn]")) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.layerBtn;
    state.activeLayer = state.activeLayer === key ? null : key;
    commitState();
  });
}

const bindRange = (sel, handler) => {
  const el = $(sel);
  if (!el) return;
  el.addEventListener("input", () => {
    handler(Number(el.value));
    commitState();
  });
};

bindRange("#ctrl-turns", (v) => {
  state.turns = +clamp(v, 0.45, 3.4).toFixed(2);
});
bindRange("#mobile-turns", (v) => {
  state.turns = +clamp(v, 0.45, 3.4).toFixed(2);
});
bindRange("#ctrl-growth", (v) => {
  state.growth = +clamp(v, 1.02, 2.48).toFixed(2);
  if (state.curveType === "arch" && state.growth > 1.2) state.curveType = "log";
});
bindRange("#ctrl-taper", (v) => {
  state.taper = +clamp(v, 1.0, 5.5).toFixed(2);
});
bindRange("#ctrl-span", (v) => {
  state.entrySpan = +clamp(v / 100, 0.48, 0.95).toFixed(2);
});

$("#btn-dir")?.addEventListener("click", () => {
  state.dir = state.dir > 0 ? -1 : 1;
  commitState();
});

$("#btn-grid")?.addEventListener("click", () => {
  state.showGoldenGrid = !state.showGoldenGrid;
  commitState();
});

function applyPatch(patch) {
  Object.assign(state, patch);
  if (patch.eye) state.eye = { ...patch.eye };
  if (patch.core) state.core = { ...patch.core };
  commitState();
}

for (const btn of $$("[data-solution]")) {
  btn.addEventListener("click", () => {
    const sol = SOLUTIONS[btn.dataset.solution];
    if (sol) applyPatch(sol.patch);
  });
}

for (const btn of $$("[data-fail]")) {
  btn.addEventListener("click", () => {
    const fail = FAILURE_PRESETS[btn.dataset.fail];
    if (fail) applyPatch(fail.patch);
  });
}

for (const btn of $$("[data-action-calibrate]")) {
  btn.addEventListener("click", () => {
    applyPatch(SOLUTIONS.poster.patch);
  });
}

for (const btn of $$("[data-action-gaze]")) {
  btn.addEventListener("click", () => {
    heroStage.triggerGaze();
  });
}

for (const btn of $$("[data-action-reset]")) {
  btn.addEventListener("click", () => {
    const spec = state.specimen;
    applyPatch({ ...OPENING_STATE, specimen: spec, eye: { ...OPENING_STATE.eye }, core: { ...OPENING_STATE.core } });
  });
}

// 键盘操作（画布聚焦时可用方向键和空格）
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.turns = +clamp(state.turns - 0.1, 0.45, 3.4).toFixed(2);
    commitState();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.turns = +clamp(state.turns + 0.1, 0.45, 3.4).toFixed(2);
    commitState();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.growth = +clamp(state.growth + 0.06, 1.02, 2.48).toFixed(2);
    if (state.curveType === "arch" && state.growth > 1.2) state.curveType = "log";
    commitState();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.growth = +clamp(state.growth - 0.06, 1.02, 2.48).toFixed(2);
    commitState();
  } else if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    heroStage.triggerGaze();
  }
});

// 挂载正文 01–06 节互动演示
const s01 = $("#sec-01");
if (s01) mountContourDemo(s01);
const s02 = $("#sec-02");
if (s02) mountMathCompareDemo(s02);
const s03 = $("#sec-03");
if (s03) mountHistoryDemo(s03);
const s04 = $("#sec-04");
if (s04) mountMythBusterDemo(s04);
const s05 = $("#sec-05");
if (s05) mountUsageDemo(s05);
const s06 = $("#sec-06");
if (s06) mountQuiz(s06);

// =========================================================================
// 07 节：原海报点击放大、缩放、拖拽灯箱（只读 #poster.src，不重复内联图片）
// =========================================================================
(function mountPosterLightbox() {
  const posterImg = $("#poster");
  const openBtn = $("#poster-open");
  const modal = $("#poster-modal");
  const modalImg = $("#poster-modal-img");
  const stage = $("#poster-modal-stage");
  const closeBtn = $("#poster-close");
  const zoomInBtn = $("#poster-zoom-in");
  const zoomOutBtn = $("#poster-zoom-out");
  const zoomResetBtn = $("#poster-zoom-reset");
  const zoomReadout = $("#poster-zoom-readout");
  if (!posterImg || !modal || !modalImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomReadout) zoomReadout.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    if (!modalImg.src) modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 0.75, 3.5);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 0.75, 3.5);
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      if (modal.hidden) return;
      e.preventDefault();
      scale = clamp(+(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2), 0.75, 3.5);
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    modalImg.setPointerCapture?.(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });
  const stopPan = () => {
    dragging = false;
  };
  modalImg.addEventListener("pointerup", stopPan);
  modalImg.addEventListener("pointercancel", stopPan);
})();
