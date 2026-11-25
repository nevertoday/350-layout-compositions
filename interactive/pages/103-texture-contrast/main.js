// 103 质感对比 · 主入口：统筹首屏 3D/2D 触感标本桌台、弧轨测光灯、材质样本匣与 01–08 节交互

import {
  CLUTTER_SLOTS,
  INITIAL_LIGHT,
  INITIAL_SLOTS,
  MATERIAL_ORDER,
  MATERIALS,
  POSTER_LIGHT,
  POSTER_SLOTS,
  SLOTS,
  SLOT_MAP,
  createInitialState,
  evaluate,
  lightGeometry,
} from "./model.js";
import { getSwatchDataUrl } from "./textures.js";
import { mountHeroStage } from "./stage3d.js";
import {
  initBauhausLayers,
  initDepthGradient,
  initFiveDimensions,
  initMoodMatrix,
  initNoiseStress,
  initPosterLightbox,
  initQuiz,
  initSplitLoupe,
} from "./demos.js";

const state = createInitialState();

const stageBox = document.getElementById("hero-stage");
const leaderSvg = document.getElementById("hero-leaders");
const lightTrack = document.getElementById("light-track");
const lightHandle = document.getElementById("light-handle");
const lightAngleEl = document.getElementById("light-angle");

const slotBtns = [...document.querySelectorAll("[data-slot-btn]")];
const matBtns = [...document.querySelectorAll("[data-mat-btn]")];
const btnReset = document.getElementById("btn-reset");
const btnPoster = document.getElementById("btn-poster");
const btnClutter = document.getElementById("btn-clutter");

const selectedTitleEl = document.getElementById("selected-slot-name");
const badgeEl = document.getElementById("diag-badge");
const headlineEl = document.getElementById("diag-headline");
const whyEl = document.getElementById("diag-why");
const spanValEl = document.getElementById("m-span");
const quietValEl = document.getElementById("m-quiet");
const seamValEl = document.getElementById("m-seam");

const pillarContrast = document.getElementById("pillar-contrast");
const pillarHarmony = document.getElementById("pillar-harmony");
const pillarLayer = document.getElementById("pillar-layer");
const pillarLight = document.getElementById("pillar-light");

// 为材质样本匣与按钮注入程序生成的真实触感底纹缩略图
matBtns.forEach((btn) => {
  const matId = btn.dataset.matBtn;
  const chip = btn.querySelector(".swatch-tex");
  if (chip && MATERIALS[matId]) {
    chip.style.backgroundImage = `url(${getSwatchDataUrl(matId)})`;
  }
});

let heroStage = null;

function selectSlot(slotId) {
  if (!SLOT_MAP[slotId]) return;
  state.selected = slotId;
  heroStage?.sync();
  renderUI();
}

function setSlotMaterial(slotId, matId) {
  if (!SLOT_MAP[slotId] || !MATERIALS[matId]) return;
  state.slots[slotId] = matId;
  heroStage?.sync(slotId);
  renderUI();
}

function setLightParam(param) {
  state.lightParam = Math.max(0, Math.min(1, param));
  heroStage?.forceDraw();
  renderLightBar();
  renderDiagnosis();
}

// 渲染桌台两侧原海报风格的细折线标本引注（宽屏展示，极窄屏自动让位给清晰标本台）
function renderLeaders() {
  if (!leaderSvg || !heroStage || !stageBox) return;
  const rect = stageBox.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  leaderSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  if (w < 680) {
    leaderSvg.innerHTML = "";
    return;
  }

  const leftSlots = SLOTS.filter((s) => s.calloutSide === "left").sort((a, b) => a.v - b.v);
  const rightSlots = SLOTS.filter((s) => s.calloutSide === "right").sort((a, b) => a.v - b.v);
  const parts = [];

  const clusterLeft = heroStage.projectUV(0.14, 0.5).x;
  const clusterRight = heroStage.projectUV(0.86, 0.5).x;

  const drawSide = (list, side) => {
    const labelW = 114;
    const marginX =
      side === "left"
        ? Math.max(18, Math.round(clusterLeft - labelW - 96))
        : Math.min(w - 18, Math.round(clusterRight + labelW + 96));
    list.forEach((s, idx) => {
      const p = heroStage.projectUV(s.calloutAnchor.u, s.calloutAnchor.v);
      const ySlots = list.length === 3 ? [0.24, 0.52, 0.78] : [0.34, 0.66];
      const ly = Math.round(h * ySlots[idx]);
      const bendX = side === "left" ? marginX + labelW + 20 : marginX - labelW - 20;
      const lineStartX = side === "left" ? marginX + labelW : marginX - labelW;
      const active = s.id === state.selected;
      const mat = MATERIALS[state.slots[s.id]];
      const stroke = active ? "#B64E22" : "rgba(44, 36, 28, 0.56)";
      const sw = active ? 1.8 : 1.1;

      parts.push(
        `<g class="leader-item${active ? " is-active" : ""}" data-leader-slot="${s.id}">` +
          `<polyline points="${lineStartX},${ly} ${bendX},${ly} ${p.x.toFixed(1)},${p.y.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>` +
          `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${active ? 4.2 : 3.1}" fill="${active ? "#B64E22" : "#1F1B17"}"/>` +
          `<text x="${marginX}" y="${ly - 5}" text-anchor="${side === "left" ? "start" : "end"}" class="ld-zh">${mat.zh}</text>` +
          `<text x="${marginX}" y="${ly + 11}" text-anchor="${side === "left" ? "start" : "end"}" class="ld-en">${mat.en} · ${s.short}</text>` +
          `<rect x="${side === "left" ? marginX : marginX - 18}" y="${ly + 16}" width="18" height="2.4" fill="${active ? "#B64E22" : "#C9795A"}"/>` +
          `</g>`
      );
    });
  };

  drawSide(leftSlots, "left");
  drawSide(rightSlots, "right");
  leaderSvg.innerHTML = parts.join("");
}

function renderLightBar() {
  if (!lightHandle || !lightAngleEl) return;
  const lg = lightGeometry(state.lightParam);
  const pct = (state.lightParam * 100).toFixed(2);
  lightHandle.style.left = `${pct}%`;
  lightHandle.setAttribute("aria-valuenow", String(lg.elevDeg));
  lightHandle.setAttribute("aria-valuetext", `${lg.sideLabel} ${lg.elevDeg} 度`);
  lightHandle.dataset.raking = String(!lg.isFlat);
  lightAngleEl.textContent = `${lg.sideLabel} ${lg.elevDeg}°`;
}

function renderDiagnosis() {
  const res = evaluate(state);
  const m = res.metrics;

  if (badgeEl) {
    badgeEl.textContent = res.badge;
    badgeEl.dataset.status = res.status;
  }
  if (headlineEl) headlineEl.textContent = res.headline;
  if (whyEl) whyEl.textContent = res.why;

  if (spanValEl) {
    spanValEl.textContent = `${m.minR.toFixed(2)}–${m.maxR.toFixed(2)}`;
    spanValEl.dataset.ok = String(res.checks.contrast);
  }
  if (quietValEl) {
    quietValEl.textContent = `${m.quietCount} / 5 块`;
    quietValEl.dataset.ok = String(res.checks.harmony);
  }
  if (seamValEl) {
    seamValEl.textContent = `${m.cleanSeams} / ${m.totalSeams} 组`;
    seamValEl.dataset.ok = String(res.checks.layer);
  }

  const markPillar = (el, ok) => {
    if (el) el.dataset.ok = String(ok);
  };
  markPillar(pillarContrast, res.checks.contrast);
  markPillar(pillarHarmony, res.checks.harmony);
  markPillar(pillarLayer, res.checks.layer);
  markPillar(pillarLight, res.checks.light);
}

function renderUI() {
  const activeSlot = SLOT_MAP[state.selected];
  const activeMatId = state.slots[state.selected];
  if (selectedTitleEl) {
    selectedTitleEl.textContent = `${activeSlot.name}（当前：${MATERIALS[activeMatId].full}）`;
  }

  slotBtns.forEach((btn) => {
    const id = btn.dataset.slotBtn;
    const mat = MATERIALS[state.slots[id]];
    btn.setAttribute("aria-pressed", String(id === state.selected));
    const sub = btn.querySelector(".slot-mat");
    if (sub) sub.textContent = mat.zh;
  });

  matBtns.forEach((btn) => {
    const id = btn.dataset.matBtn;
    btn.setAttribute("aria-pressed", String(id === activeMatId));
  });

  renderLightBar();
  renderDiagnosis();
  renderLeaders();
}

// ---------- 绑定首屏交互 ----------
heroStage = mountHeroStage(stageBox, state, {
  onSelect: selectSlot,
});

// 顶部黄铜测光灯把手（支持鼠标、触摸横向拖动，以及键盘 ← → 调整入射角）
if (lightTrack && lightHandle) {
  let dragLamp = false;
  const updateFromClientX = (cx) => {
    const rect = lightTrack.getBoundingClientRect();
    const p = (cx - rect.left) / Math.max(1, rect.width);
    setLightParam(p);
  };

  lightHandle.addEventListener("pointerdown", (e) => {
    dragLamp = true;
    lightHandle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  lightHandle.addEventListener("pointermove", (e) => {
    if (!dragLamp) return;
    updateFromClientX(e.clientX);
  });
  lightHandle.addEventListener("pointerup", () => {
    dragLamp = false;
  });
  lightHandle.addEventListener("pointercancel", () => {
    dragLamp = false;
  });

  // 兼容 perf.mjs 派发纯 TouchEvent 的场景
  lightHandle.addEventListener(
    "touchstart",
    (e) => {
      dragLamp = true;
      if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  lightHandle.addEventListener(
    "touchmove",
    (e) => {
      if (!dragLamp || !e.touches[0]) return;
      updateFromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  lightHandle.addEventListener("touchend", () => {
    dragLamp = false;
  });

  lightTrack.addEventListener("pointerdown", (e) => {
    if (e.target === lightHandle || lightHandle.contains(e.target)) return;
    dragLamp = true;
    updateFromClientX(e.clientX);
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragLamp) return;
    updateFromClientX(e.clientX);
  });
  window.addEventListener("pointerup", () => {
    dragLamp = false;
  });

  lightHandle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      setLightParam(state.lightParam - 0.06);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setLightParam(state.lightParam + 0.06);
      e.preventDefault();
    }
  });
}

slotBtns.forEach((btn) => {
  btn.addEventListener("click", () => selectSlot(btn.dataset.slotBtn));
});

matBtns.forEach((btn) => {
  btn.addEventListener("click", () => setSlotMaterial(state.selected, btn.dataset.matBtn));
});

btnReset?.addEventListener("click", () => {
  Object.assign(state.slots, INITIAL_SLOTS);
  state.lightParam = INITIAL_LIGHT;
  state.selected = "sphere";
  heroStage?.sync();
  renderUI();
});

btnPoster?.addEventListener("click", () => {
  Object.assign(state.slots, POSTER_SLOTS);
  state.lightParam = POSTER_LIGHT;
  heroStage?.sync();
  renderUI();
});

btnClutter?.addEventListener("click", () => {
  Object.assign(state.slots, CLUTTER_SLOTS);
  state.lightParam = POSTER_LIGHT;
  heroStage?.sync();
  renderUI();
});

// 窗口尺寸变化时重算折线引注位置
if (stageBox) {
  new ResizeObserver(() => {
    renderLeaders();
  }).observe(stageBox);
}

renderUI();

// ---------- 初始化第 01–08 节全部交互 ----------
initSplitLoupe();
initFiveDimensions();
initDepthGradient();
initMoodMatrix();
initBauhausLayers();
initNoiseStress();
initQuiz();
initPosterLightbox();
