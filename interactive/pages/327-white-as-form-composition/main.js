// 327 计白当黑构图 · 主入口：统筹开场刻形台、反拓验形镜、单真源诊单与七节互动
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENES, clamp, createInitialState, evaluate } from "./model.js";
import { drawComposition, drawStepThumb, hitTestHandle, makeTransform } from "./hero-canvas.js";
import { initLightbox, initSec01, initSec02, initSec03, initSec04, initSec05, initSec06 } from "./sections.js";

const heroCanvas = document.getElementById("hero-canvas");
const mirrorCanvas = document.getElementById("mirror-canvas");
const heroCtx = heroCanvas.getContext("2d");
const mirrorCtx = mirrorCanvas.getContext("2d");

const state = createInitialState("arch");
let activeHandle = null;
let dragStart = null;
let needsRedraw = true;
let cachedEval = evaluate(state);
let revealT = reducedMotion.matches ? 1 : 0;

// DOM 引用
const els = {
  titleSlab: document.getElementById("title-slab"),
  titleRule: document.getElementById("title-gold-rule"),
  statusPill: document.getElementById("hero-status-pill"),
  btnInvert: document.getElementById("btn-invert"),
  btnInvertLabel: document.getElementById("btn-invert-label"),
  mirrorFlipBtn: document.getElementById("mirror-flip-btn"),
  canvasHint: document.getElementById("canvas-hint"),
  rangeCarve: document.getElementById("range-carve"),
  valCarve: document.getElementById("val-carve"),
  btnEye: document.getElementById("btn-eye"),
  btnGuides: document.getElementById("btn-guides"),
  presetRow: document.getElementById("preset-row"),
  pillarForm: document.getElementById("pillar-form"),
  pillarBalance: document.getElementById("pillar-balance"),
  pillarGuide: document.getElementById("pillar-guide"),
  tagForm: document.getElementById("tag-form"),
  tagBalance: document.getElementById("tag-balance"),
  tagGuide: document.getElementById("tag-guide"),
  mnP1: document.getElementById("mn-p1"),
  mnD1: document.getElementById("mn-d1"),
  mnP2: document.getElementById("mn-p2"),
  mnD2: document.getElementById("mn-d2"),
  mnP3: document.getElementById("mn-p3"),
  mnD3: document.getElementById("mn-d3"),
  mirrorTag: document.getElementById("mirror-tag"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next"),
  mRatio: document.getElementById("m-ratio"),
  mGap: document.getElementById("m-gap"),
  mAngle: document.getElementById("m-angle"),
  mTension: document.getElementById("m-tension"),
  step1: document.getElementById("step-card-1"),
  step2: document.getElementById("step-card-2"),
  step3: document.getElementById("step-card-3"),
  thumb1: document.getElementById("step-thumb-1"),
  thumb2: document.getElementById("step-thumb-2"),
  thumb3: document.getElementById("step-thumb-3"),
};

// 高清尺寸同步（窄屏上限 1.5，桌面 2，兼顾清晰度与软件渲染帧率）
let cssW = 600;
let cssH = 452;

function resizeHero() {
  const rect = heroCanvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const maxDpr = window.innerWidth <= 500 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  cssW = rect.width;
  cssH = rect.height;
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (heroCanvas.width !== bw || heroCanvas.height !== bh) {
    heroCanvas.width = bw;
    heroCanvas.height = bh;
    heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needsRedraw = true;
  }
}

function buildPresetsUI() {
  const sc = SCENES[state.scene];
  els.presetRow.innerHTML = "";
  for (const p of sc.presets) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-btn ${p.kind === "err" ? "is-err-preset" : ""}`;
    btn.textContent = p.label;
    btn.dataset.preset = p.id;
    els.presetRow.appendChild(btn);
  }
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "preset-btn is-reset";
  resetBtn.textContent = "复原 0/4 错态";
  resetBtn.dataset.preset = "__broken__";
  els.presetRow.appendChild(resetBtn);
}

// 同步所有 UI 读数、自示范标题块、三黄标、反拓镜与三步微缩图
function syncUI(ev) {
  const sc = SCENES[state.scene];
  const isOk = ev.score === 4;

  // 自示范标题联动：「当黑」白块留白与明黄短杠随刻白量呼吸
  const padX = Math.round(6 + state.carve * 12);
  els.titleSlab.style.paddingInline = `${padX}px`;
  els.titleRule.style.width = `${Math.round(42 + state.carve * 64)}px`;

  // 顶栏状态与翻转钮
  els.statusPill.textContent = ev.badge;
  els.statusPill.classList.toggle("is-ok", isOk);
  els.statusPill.classList.toggle("is-err", !isOk);
  els.btnInvert.setAttribute("aria-pressed", String(state.inverted));
  els.btnInvertLabel.textContent = state.inverted ? "恢复玄底" : "翻转黑白";
  els.mirrorTag.textContent = state.inverted ? "INK → WHITE" : "WHITE → INK";

  // 提示与控件
  els.canvasHint.textContent = sc.caption;
  els.rangeCarve.value = String(Math.round(state.carve * 100));
  els.valCarve.textContent = `白 ${ev.whitePct}%`;
  els.btnEye.classList.toggle("is-on", state.eyeOn);
  els.btnEye.setAttribute("aria-pressed", String(state.eyeOn));
  els.btnEye.textContent = state.eyeOn ? "黑眼：开" : "黑眼：关";
  els.btnGuides.classList.toggle("is-on", state.showGuides);
  els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  els.btnGuides.textContent = state.showGuides ? "引注：开" : "引注：关";

  // 左栏三枚原海报知识标
  els.pillarForm.classList.toggle("is-ok", ev.pillarStates.form.ok);
  els.tagForm.textContent = ev.pillarStates.form.tag;
  els.pillarBalance.classList.toggle("is-ok", ev.pillarStates.balance.ok);
  els.tagBalance.textContent = ev.pillarStates.balance.tag;
  els.pillarGuide.classList.toggle("is-ok", ev.pillarStates.guide.ok);
  els.tagGuide.textContent = ev.pillarStates.guide.tag;

  // 右栏反拓标注文案
  els.mnP1.textContent = sc.labels.primary;
  els.mnD1.textContent = sc.labels.primarySub;
  els.mnP2.textContent = sc.labels.secondary;
  els.mnD2.textContent = sc.labels.secondarySub;
  els.mnP3.textContent = sc.labels.guide;
  els.mnD3.textContent = sc.labels.guideSub;

  // 诊单卡
  els.diagCard.classList.toggle("is-ok", isOk);
  els.diagBadge.textContent = ev.badge;
  els.diagBadge.classList.toggle("is-ok", isOk);
  els.diagHeadline.textContent = ev.headline;
  els.diagBody.textContent = ev.body;
  els.diagNext.textContent = ev.nextStep;

  // 四项单真源读数
  els.mRatio.textContent = `${ev.blackPct} : ${ev.whitePct}`;
  els.mGap.textContent = ev.layer.collided
    ? "粘连 0%"
    : ev.layer.detached
      ? "脱节断联"
      : `隔离 ${Math.max(1, Math.round(ev.layer.gap * 100))}%`;
  els.mAngle.textContent = `${Math.abs(ev.gaze.deg)}°${ev.gaze.ok ? " 正对" : " 偏轴"}`;
  els.mTension.textContent = ev.tensionLabel;

  // 底栏三步骤
  els.step1.classList.toggle("is-done", ev.steps.s1);
  els.step2.classList.toggle("is-done", ev.steps.s2);
  els.step3.classList.toggle("is-done", ev.steps.s3);

  // 反拓验形镜（永远显示与主画布相反极性，让读者一眼看穿白形本体！）
  drawComposition(mirrorCtx, mirrorCanvas.width, mirrorCanvas.height, ev, {
    invertOverride: !state.inverted,
    mini: true,
    reveal: 1,
  });

  // 三步微缩线框同步
  drawStepThumb(els.thumb1, 1, ev);
  drawStepThumb(els.thumb2, 2, ev);
  drawStepThumb(els.thumb3, 3, ev);
}

function commitState() {
  cachedEval = evaluate(state);
  syncUI(cachedEval);
  needsRedraw = true;
  heroLoop.draw();
}

// 渲染循环：走 lib/stage.js 的 loop()，离开视口或切标签页自动停帧省电
const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  resizeHero();
  if (still) {
    revealT = 1;
  } else if (revealT < 1) {
    revealT = Math.min(1, revealT + Math.max(dt, 0.016) * 1.65);
    needsRedraw = true;
  }

  // 拖动或入场动画期间每帧重绘；静置时不再空烧 GPU（省电），同时拖动时 100% 满帧响应
  if (needsRedraw || activeHandle || revealT < 1) {
    const ease = 1 - (1 - revealT) ** 3;
    drawComposition(heroCtx, cssW, cssH, cachedEval, {
      reveal: ease,
      activeHandle,
      pulse: t * 3.2,
    });
    needsRedraw = false;
  }
});

// 画布指针与触摸交互（支持三控点直拖 + 空白处横拖雕刻白体量 + 靠近正轴微吸附）
function pointerToLocal(e) {
  const r = heroCanvas.getBoundingClientRect();
  return { px: e.clientX - r.left, py: e.clientY - r.top, r };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const { px, py } = pointerToLocal(e);
  const hit = hitTestHandle(px, py, cachedEval.geo, cssW, cssH);
  activeHandle = hit;
  dragStart = {
    px,
    py,
    carve: state.carve,
  };
  if (hit !== "carve") {
    e.preventDefault();
  }
  try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  needsRedraw = true;
  heroLoop.draw();
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!activeHandle || !dragStart) return;
  const { px, py } = pointerToLocal(e);
  const t = makeTransform(cssW, cssH);
  const world = t.toWorld(px, py);

  if (activeHandle === "carve") {
    // 空白处横拖实时雕刻白形厚薄（每拖半幅画布变化约 0.85，手感顺滑）
    const dx = px - dragStart.px;
    state.carve = clamp(dragStart.carve + (dx / Math.max(180, cssW * 0.65)), 0.06, 1.0);
  } else if (activeHandle === "portal") {
    let nx = clamp(world.x, -0.20, 0.20);
    let ny = clamp(world.y + 0.015, -0.18, 0.16);
    if (Math.abs(nx) < 0.015) nx = 0; // 轻吸附中轴
    state.portalX = nx;
    state.portalY = ny;
  } else if (activeHandle === "apex") {
    let nx = clamp(world.x, -0.30, 0.30);
    if (Math.abs(nx - state.portalX) < 0.018) nx = state.portalX; // 轻吸附对准门洞
    state.pathAim = nx;
  } else if (activeHandle === "eye") {
    let nx = clamp(world.x, -0.26, 0.26);
    const ny = clamp(world.y, 0.16, 0.36);
    if (Math.abs(nx - state.pathAim * 0.6) < 0.016) nx = state.pathAim * 0.6;
    state.eyeX = nx;
    state.eyeY = ny;
  }
  commitState();
});

function endPointer() {
  if (!activeHandle) return;
  activeHandle = null;
  dragStart = null;
  needsRedraw = true;
  heroLoop.draw();
}
heroCanvas.addEventListener("pointerup", endPointer);
heroCanvas.addEventListener("pointercancel", endPointer);

// 键盘操作：方向键微调刻白量，空格翻转黑白
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.carve = clamp(state.carve + 0.04, 0.06, 1.0);
    commitState();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.carve = clamp(state.carve - 0.04, 0.06, 1.0);
    commitState();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.portalY = clamp(state.portalY - 0.025, -0.18, 0.16);
    commitState();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.portalY = clamp(state.portalY + 0.025, -0.18, 0.16);
    commitState();
  } else if (e.key === " ") {
    e.preventDefault();
    state.inverted = !state.inverted;
    commitState();
  }
});

// 顶栏题材切换
document.querySelector(".scene-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-scene]");
  if (!btn) return;
  const next = btn.dataset.scene;
  if (!SCENES[next]) return;
  Object.assign(state, { scene: next, ...SCENES[next].broken });
  for (const b of document.querySelectorAll(".scene-tabs .tab-btn")) {
    const on = b === btn;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  }
  buildPresetsUI();
  commitState();
});

// 翻转黑白按钮与可点击反拓拓片窗
function toggleInvert() {
  state.inverted = !state.inverted;
  commitState();
}
els.btnInvert.addEventListener("click", toggleInvert);
if (els.mirrorFlipBtn) els.mirrorFlipBtn.addEventListener("click", toggleInvert);

// 刻白滑轨与开关
els.rangeCarve.addEventListener("input", () => {
  state.carve = clamp(Number(els.rangeCarve.value) / 100, 0.06, 1.0);
  commitState();
});

els.btnEye.addEventListener("click", () => {
  state.eyeOn = !state.eyeOn;
  commitState();
});

els.btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  commitState();
});

// 预设与复原按钮
els.presetRow.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-preset]");
  if (!btn) return;
  const id = btn.dataset.preset;
  const sc = SCENES[state.scene];
  if (id === "__broken__") {
    Object.assign(state, sc.broken);
  } else {
    const found = sc.presets.find((p) => p.id === id);
    if (found) Object.assign(state, found.state);
  }
  commitState();
});

window.addEventListener("resize", () => {
  resizeHero();
  heroLoop.draw();
});

// 初始化全部模块
buildPresetsUI();
resizeHero();
syncUI(cachedEval);
heroLoop.draw();

initSec01();
initSec02();
initSec03();
initSec04();
initSec05();
initSec06();
initLightbox();
