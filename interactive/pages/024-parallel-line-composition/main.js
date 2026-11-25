// 024 平行线构图 — 总入口：协调开场单源模型、四柱动态图腾、间距梳轨、正文实验与原海报灯箱
import { initHeroStage } from "./hero-stage.js";
import { SCENES, THRESHOLDS, clamp, computeModel, createBrokenState, geometricPositions } from "./model.js";
import { initSections } from "./sections.js";

const state = createBrokenState("pavilion");

// ===== DOM 引用 =====
const heroCanvas = document.getElementById("hero-canvas");
const titleSvg = document.getElementById("title-parallel-svg");
const tdL1 = document.getElementById("td-l1");
const tdL2 = document.getElementById("td-l2");
const tdL3 = document.getElementById("td-l3");

const scorePill = document.getElementById("hero-score-pill");
const btnReset = document.getElementById("btn-hero-reset");
const sceneTabs = [...document.querySelectorAll(".scene-tab")];

const combTrack = document.getElementById("spacing-comb-track");
const combThumb = document.getElementById("spacing-comb-thumb");
const combReadout = document.getElementById("comb-ratio-readout");

const diagBox = document.getElementById("hero-diagnosis");
const diagTag = document.getElementById("diag-tag");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");

const inputLines = document.getElementById("input-lines");
const btnLinesMinus = document.getElementById("btn-lines-minus");
const btnLinesPlus = document.getElementById("btn-lines-plus");
const gradChips = [...document.querySelectorAll("[data-grad]")];
const inputSpread = document.getElementById("input-spread");
const orientChips = [...document.querySelectorAll("[data-orient]")];
const btnAnchor = document.getElementById("btn-anchor-toggle");
const btnCadence = document.getElementById("btn-cadence-toggle");

const glyphRep = document.getElementById("glyph-repetition");
const glyphSpa = document.getElementById("glyph-spacing");
const glyphOrd = document.getElementById("glyph-order");
const glyphCad = document.getElementById("glyph-cadence");

// ===== 实时重绘原海报四枚标志性小图形（完全由 model 同源数据驱动） =====
function renderPillarGlyphs(model) {
  const { pillars, metrics, state: st } = model;
  const col = (ok) => (ok ? "#B4CC3B" : "#F27B5A");

  // 01 重复：根据当前线束密度映射出 2..7 条预览线
  {
    const n = clamp(Math.round(metrics.lineCount / 5), 2, 7);
    const c = col(pillars.repetition.ok);
    const lines = [];
    for (let i = 0; i < n; i++) {
      const y = 5 + (n === 1 ? 13 : (i / (n - 1)) * 26);
      lines.push(`<line x1="2" y1="${y.toFixed(1)}" x2="82" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="${n >= 6 ? 1.3 : 1.8}"/>`);
    }
    glyphRep.innerHTML = lines.join("");
  }

  // 02 间距：按真实疏密比摆出 4 条横线 + 原海报标志性垂直双箭头
  {
    const c = col(pillars.spacing.ok);
    const pos = geometricPositions(4, metrics.spacingRatio);
    const ys = pos.map((p) => 4 + p * 28);
    const lines = ys.map((y, idx) => `<line x1="2" y1="${y.toFixed(1)}" x2="82" y2="${y.toFixed(1)}" stroke="${idx === 2 ? c : "#8E9EA9"}" stroke-width="1.5"/>`);
    const yA = ys[1] + 2;
    const yB = ys[3] - 2;
    lines.push(`<line x1="42" y1="${yA.toFixed(1)}" x2="42" y2="${yB.toFixed(1)}" stroke="${c}" stroke-width="1.5"/>`);
    lines.push(`<polyline points="38,${(yA + 4).toFixed(1)} 42,${yA.toFixed(1)} 46,${(yA + 4).toFixed(1)}" fill="none" stroke="${c}" stroke-width="1.4"/>`);
    lines.push(`<polyline points="38,${(yB - 4).toFixed(1)} 42,${yB.toFixed(1)} 46,${(yB - 4).toFixed(1)}" fill="none" stroke="${c}" stroke-width="1.4"/>`);
    glyphSpa.innerHTML = lines.join("");
  }

  // 03 秩序：5 条线按真实散角偏折，归零时瞬间齐平
  {
    const c = col(pillars.order.ok);
    const sp = clamp(metrics.spreadDeg, -18, 18);
    const lines = [];
    for (let i = 0; i < 5; i++) {
      const mid = 5 + (i / 4) * 26;
      const offset = ((i - 2) / 2) * (sp * 0.42);
      const y1 = clamp(mid - offset, 2, 34);
      const y2 = clamp(mid + offset, 2, 34);
      lines.push(`<line x1="2" y1="${y1.toFixed(1)}" x2="82" y2="${y2.toFixed(1)}" stroke="${i % 2 === 1 ? c : "#8E9EA9"}" stroke-width="1.5"/>`);
    }
    glyphOrd.innerHTML = lines.join("");
  }

  // 04 韵律：复刻原海报五线谱台阶与 3 枚酸绿音点（随开关与锚点联动）
  {
    const c = col(pillars.cadence.ok);
    const wave = st.cadenceOn ? 6 : 0;
    const paths = [8, 15, 22, 29].map((y, idx) => {
      const d = wave
        ? `M2 ${y} L34 ${y} C42 ${y} 44 ${y - wave} 52 ${y - wave} L82 ${y - wave}`
        : `M2 ${y} L82 ${y}`;
      return `<path d="${d}" fill="none" stroke="${idx === 1 && st.cadenceOn ? c : "#8E9EA9"}" stroke-width="1.4"/>`;
    });
    if (st.anchorOn) {
      const ax = clamp(12 + st.anchorU * 60, 12, 72);
      paths.push(`<circle cx="${ax.toFixed(1)}" cy="${(22 - wave * 0.4).toFixed(1)}" r="3.4" fill="${c}"/>`);
    }
    if (st.cadenceOn) {
      paths.push(`<circle cx="24" cy="15" r="2.6" fill="${c}"/>`);
      paths.push(`<circle cx="66" cy="${29 - wave}" r="2.6" fill="${c}"/>`);
    }
    glyphCad.innerHTML = paths.join("");
  }
}

function updateTitleDemo(model) {
  const sp = clamp(model.metrics.spreadDeg, -18, 18);
  const dy = (sp / 18) * 6.5;
  tdL1.setAttribute("y1", (6 - dy).toFixed(1));
  tdL1.setAttribute("y2", (6 + dy).toFixed(1));
  tdL2.setAttribute("y1", "13");
  tdL2.setAttribute("y2", "13");
  tdL3.setAttribute("y1", (20 + dy).toFixed(1));
  tdL3.setAttribute("y2", (20 - dy).toFixed(1));
  titleSvg.classList.toggle("is-warn", !model.pillars.order.ok);
}

function syncUI(model) {
  const { pillars, metrics, diagnosis, state: st } = model;

  // 顶栏状态章
  scorePill.textContent = metrics.passCount === 4 ? "4 / 4 秩序成立" : `${metrics.passCount} / 4 待校准`;
  scorePill.classList.toggle("is-pass", metrics.passCount === 4);

  // 题材按钮
  sceneTabs.forEach((b) => {
    const act = b.dataset.scene === st.scene;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  });

  // 标题旁平行示范线
  updateTitleDemo(model);

  // 间距梳轨位置与读数（用 --comb-t 0..1 保证滑块在任何屏幕宽下严丝合缝在轨内）
  combThumb.style.setProperty("--comb-t", clamp(st.spacingGrad, 0, 1).toFixed(4));
  combThumb.classList.toggle("is-warn", !pillars.spacing.ok);
  combReadout.textContent = `${metrics.spacingRatio.toFixed(2)}×`;
  combTrack.setAttribute("aria-valuenow", String(Math.round(metrics.spacingRatio * 100)));
  combTrack.setAttribute("aria-valuetext", `${metrics.spacingRatio.toFixed(2)}倍，${pillars.spacing.status}`);

  // 四柱状态与实测值
  for (const key of ["repetition", "spacing", "order", "cadence"]) {
    const card = document.getElementById(`pillar-${key}`);
    const stEl = document.getElementById(`state-${key}`);
    const valEl = document.getElementById(`val-${key}`);
    if (card) card.dataset.ok = String(pillars[key].ok);
    if (stEl) stEl.textContent = pillars[key].status;
    if (valEl) valEl.textContent = pillars[key].value;
  }
  renderPillarGlyphs(model);

  // 控件值同步
  inputLines.value = String(st.lineCount);
  inputSpread.value = String(st.divergence);
  gradChips.forEach((b) => {
    const g = Number(b.dataset.grad);
    b.classList.toggle("is-active", Math.abs(st.spacingGrad - g) < 0.08);
  });
  orientChips.forEach((b) => {
    const act = b.dataset.orient === st.orient;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  });
  btnAnchor.setAttribute("aria-pressed", String(st.anchorOn));
  btnAnchor.textContent = `破局锚点：${st.anchorOn ? "开" : "关"}`;
  btnCadence.setAttribute("aria-pressed", String(st.cadenceOn));
  btnCadence.textContent = `线长律动：${st.cadenceOn ? "开" : "关"}`;

  // 白话诊单
  diagBox.dataset.level = diagnosis.level;
  diagTag.textContent = diagnosis.tag;
  diagHeadline.textContent = diagnosis.headline;
  diagBody.textContent = diagnosis.body;
  diagHint.textContent = diagnosis.hint;
}

let heroStage = null;

function updateState(patch) {
  Object.assign(state, patch);
  const model = computeModel(state);
  syncUI(model);
  if (heroStage) heroStage.notify();
}

heroStage = initHeroStage(heroCanvas, () => state, updateState);
syncUI(computeModel(state));

// ===== 间距梳轨（data-perf-drag）：同时支持鼠标、触控（CDP touch）与键盘 =====
let combDragging = false;
let lastCombClientX = null;

function setCombFromClientX(clientX) {
  if (lastCombClientX !== null && Math.abs(clientX - lastCombClientX) < 0.05) return;
  lastCombClientX = clientX;
  const rect = combTrack.getBoundingClientRect();
  const next = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  updateState({ spacingGrad: Number(next.toFixed(4)) });
}

combTrack.addEventListener("pointerdown", (e) => {
  combDragging = true;
  lastCombClientX = null;
  if (combTrack.setPointerCapture) {
    try { combTrack.setPointerCapture(e.pointerId); } catch {}
  }
  setCombFromClientX(e.clientX);
  e.preventDefault();
});

combTrack.addEventListener("pointermove", (e) => {
  if (!combDragging) return;
  setCombFromClientX(e.clientX);
});

const stopCombDrag = () => {
  combDragging = false;
  lastCombClientX = null;
};
combTrack.addEventListener("pointerup", stopCombDrag);
combTrack.addEventListener("pointercancel", stopCombDrag);

// 兼容原生触摸事件流（保障 perf.mjs 的 touchStart/touchMove 100% 实时响应）
combTrack.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  combDragging = true;
  lastCombClientX = null;
  setCombFromClientX(e.touches[0].clientX);
  e.preventDefault();
}, { passive: false });

combTrack.addEventListener("touchmove", (e) => {
  if (!e.touches.length) return;
  setCombFromClientX(e.touches[0].clientX);
  e.preventDefault();
}, { passive: false });

combTrack.addEventListener("touchend", stopCombDrag);
combTrack.addEventListener("touchcancel", stopCombDrag);

combTrack.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    updateState({ spacingGrad: Number(clamp(state.spacingGrad - 0.05, 0, 1).toFixed(3)) });
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    updateState({ spacingGrad: Number(clamp(state.spacingGrad + 0.05, 0, 1).toFixed(3)) });
  } else if (e.key === "PageDown") {
    e.preventDefault();
    updateState({ spacingGrad: Number(clamp(state.spacingGrad - 0.15, 0, 1).toFixed(3)) });
  } else if (e.key === "PageUp") {
    e.preventDefault();
    updateState({ spacingGrad: Number(clamp(state.spacingGrad + 0.15, 0, 1).toFixed(3)) });
  }
});

// ===== 题材与四柱控件事件 =====
sceneTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    const scene = btn.dataset.scene;
    updateState({ scene, anchorU: SCENES[scene]?.defaultAnchorU ?? state.anchorU });
  });
});

btnReset.addEventListener("click", () => {
  updateState(createBrokenState(state.scene));
});

inputLines.addEventListener("input", () => {
  updateState({ lineCount: Number(inputLines.value) });
});
btnLinesMinus.addEventListener("click", () => {
  updateState({ lineCount: clamp(state.lineCount - 1, 3, 36) });
});
btnLinesPlus.addEventListener("click", () => {
  updateState({ lineCount: clamp(state.lineCount + 1, 3, 36) });
});

gradChips.forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ spacingGrad: Number(btn.dataset.grad) });
  });
});

inputSpread.addEventListener("input", () => {
  let deg = Number(inputSpread.value);
  if (Math.abs(deg) <= THRESHOLDS.snapSpreadDeg) deg = 0;
  updateState({ divergence: Number(deg.toFixed(1)) });
});

orientChips.forEach((btn) => {
  btn.addEventListener("click", () => {
    updateState({ orient: btn.dataset.orient });
  });
});

btnAnchor.addEventListener("click", () => {
  updateState({ anchorOn: !state.anchorOn });
});

btnCadence.addEventListener("click", () => {
  updateState({ cadenceOn: !state.cadenceOn });
});

// ===== 原海报放大灯箱（复用 #poster.src，不重复内联图片） =====
function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const viewport = document.getElementById("lb-viewport");
  const scaleEl = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnLbReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!posterImg || !openBtn || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    scaleEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    lbImg.src = posterImg.src;
    resetView();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 0.8, 3.5);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 0.8, 3.5);
    applyTransform();
  });
  btnLbReset.addEventListener("click", resetView);

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.8, 3.5);
    applyTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    if (e.target === viewport && scale <= 1.01) {
      close();
      return;
    }
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });

  const endPan = () => {
    dragging = false;
    viewport.classList.remove("is-dragging");
  };
  viewport.addEventListener("pointerup", endPan);
  viewport.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) {
      e.preventDefault();
      close();
    }
  });
}

initSections();
initPosterLightbox();
