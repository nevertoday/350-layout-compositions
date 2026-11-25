// 080 平视构图 · 主入口：装配单真源开场玩具、手势/键盘操控与正文七节交互
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, SCENES, LIMITS, clamp, evaluate } from "./model.js";
import { renderHeroScene, hitHeightRail, railPxToCamY } from "./scene.js";
import { initSection01, initSection02, initSection03, initSection04, initSection05, initSection06, initSection07 } from "./sections.js";

const state = { ...INITIAL_STATE };
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

// DOM 引用
const els = {
  titleLevel: document.getElementById("title-level"),
  titleLevelBar: document.getElementById("title-level-bar"),
  titleLevelDot: document.getElementById("title-level-dot"),
  statusPill: document.getElementById("hero-status-pill"),
  diagPanel: document.getElementById("diag-panel"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  btnFix: document.getElementById("btn-fix"),
  lsDiag: document.getElementById("landscape-diag"),
  lsHeadline: document.getElementById("ls-diag-headline"),
  lsAction: document.getElementById("ls-diag-action"),
  lsBtnFix: document.getElementById("ls-btn-fix"),
  lsBtnReset: document.getElementById("ls-btn-reset"),
  mTilt: document.getElementById("m-tilt"),
  mHdiff: document.getElementById("m-hdiff"),
  mHpos: document.getElementById("m-hpos"),
  mGround: document.getElementById("m-ground"),
  ctrlPitch: document.getElementById("ctrl-pitch"),
  ctrlCamY: document.getElementById("ctrl-camy"),
  ctrlRoll: document.getElementById("ctrl-roll"),
  valPitch: document.getElementById("val-pitch"),
  valCamY: document.getElementById("val-camy"),
  valRoll: document.getElementById("val-roll"),
  btnGuides: document.getElementById("btn-guides"),
  btnReset: document.getElementById("btn-reset"),
  sceneTabs: [...document.querySelectorAll("[data-scene]")],
  focalBtns: [...document.querySelectorAll("[data-focal]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  pillars: {
    balance: { box: document.getElementById("pillar-balance"), live: document.getElementById("live-balance") },
    narrative: { box: document.getElementById("pillar-narrative"), live: document.getElementById("live-narrative") },
    comfort: { box: document.getElementById("pillar-comfort"), live: document.getElementById("live-comfort") },
    clarity: { box: document.getElementById("pillar-clarity"), live: document.getElementById("live-clarity") },
  },
};

let viewW = 960;
let viewH = 400;
let dirty = true;
let lastEval = null;
let animDone = false;

function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(280, Math.round(r.width));
  const h = Math.max(240, Math.round(r.height));
  const dpr = pixelRatio(2);
  viewW = w;
  viewH = h;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  dirty = true;
}

function syncUI(ev) {
  lastEval = ev;

  // 标题自示范水准微标随俯仰和横滚真实联动
  const barAngle = clamp(state.roll * 1.4, -14, 14);
  const dotShiftY = clamp((state.pitch / 24) * 6, -6, 6);
  const dotShiftX = clamp((state.roll / 8) * 18, -18, 18);
  els.titleLevel.classList.toggle("is-ok", ev.ok);
  els.titleLevelBar.style.transform = `rotate(${barAngle}deg)`;
  els.titleLevelDot.style.transform = `translate(${dotShiftX}px, ${dotShiftY}px)`;

  // 状态签与单真源诊单
  els.statusPill.textContent = ev.badge;
  els.statusPill.classList.toggle("is-ok", ev.ok);
  els.diagPanel.classList.toggle("is-ok", ev.ok);
  els.diagBadge.textContent = ev.badge;
  els.diagHeadline.textContent = ev.headline;
  els.diagWhy.textContent = ev.why;
  els.diagAction.textContent = ev.action;
  if (ev.primary) {
    els.btnFix.textContent = ev.primary.fixLabel;
  }
  if (els.lsDiag) {
    els.lsDiag.classList.toggle("is-ok", ev.ok);
    els.lsHeadline.textContent = ev.headline;
    els.lsAction.textContent = ev.action;
    if (ev.primary) els.lsBtnFix.textContent = ev.primary.fixLabel;
  }

  // 四枚实算读数
  els.mTilt.textContent = `${ev.wallTiltMax.toFixed(1)}°`;
  els.mHdiff.textContent = `${ev.heightDiff >= 0 ? "+" : ""}${ev.heightDiff.toFixed(2)}m`;
  els.mHpos.textContent = `${Math.round(ev.horiz.ratio * 100)}%`;
  els.mGround.textContent = `${Math.round(ev.groundRatio * 100)}%`;

  // 滑轨与按钮同步
  els.ctrlPitch.value = String(state.pitch);
  els.ctrlCamY.value = String(state.camY);
  els.ctrlRoll.value = String(state.roll);
  els.valPitch.textContent = `${state.pitch >= 0 ? "+" : ""}${state.pitch.toFixed(1)}°`;
  els.valCamY.textContent = `${state.camY.toFixed(2)}m`;
  els.valRoll.textContent = `${state.roll >= 0 ? "+" : ""}${state.roll.toFixed(1)}°`;

  els.sceneTabs.forEach((b) => {
    const on = b.dataset.scene === state.sceneId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.focalBtns.forEach((b) => {
    const on = Number(b.dataset.focal) === state.focal;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.btnGuides.classList.toggle("is-active", state.showGuides);
  els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  els.btnGuides.textContent = state.showGuides ? "垂线基准：开" : "垂线基准：关";

  // 四栏原海报核心要点灯实时联动
  for (const [k, item] of Object.entries(els.pillars)) {
    const p = ev.pillars[k];
    item.box.classList.toggle("is-ok", p.ok);
    item.live.textContent = p.tag;
  }
}

// 仅在开场动画阶段或状态脏时重绘，静态零耗电；拖动时每帧实时重绘满足 perf
const runner = loop(canvas, (t, dt, { still }) => {
  const animT = still || animDone ? 1 : clamp(t / 0.72, 0, 1);
  if (animT >= 1) animDone = true;
  if (!dirty && animDone) return;

  dirty = false;
  const dpr = pixelRatio(2);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ev = evaluate(state, viewW, viewH);
  renderHeroScene(ctx, state, ev, viewW, viewH, animT);
  ctx.restore();
  syncUI(ev);
});

function updateState(patch, snap = false) {
  Object.assign(state, patch);
  state.camY = clamp(state.camY, LIMITS.camY[0], LIMITS.camY[1]);
  state.pitch = clamp(state.pitch, LIMITS.pitch[0], LIMITS.pitch[1]);
  state.roll = clamp(state.roll, LIMITS.roll[0], LIMITS.roll[1]);
  if (snap) {
    if (Math.abs(state.pitch) < 1.1) state.pitch = 0;
    if (Math.abs(state.roll) < 0.7) state.roll = 0;
    const eye = SCENES[state.sceneId].targetEyeY;
    if (Math.abs(state.camY - eye) < 0.06) state.camY = eye;
  }
  dirty = true;
  runner.draw();
}

// ---------- 画布直接交互：兼容鼠标、触屏与 perf.mjs 左右拖 ----------
let dragInfo = null;
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const lx = e.clientX - rect.left;
  const ly = e.clientY - rect.top;
  const onRail = hitHeightRail(lx, rect.width);

  dragInfo = {
    id: e.pointerId,
    isTouch: e.pointerType === "touch",
    onRail,
    startX: e.clientX,
    startY: e.clientY,
    startPitch: state.pitch,
    startCamY: state.camY,
  };
  if (onRail) {
    updateState({ camY: railPxToCamY(ly, rect.height) }, true);
  }
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  const rect = canvas.getBoundingClientRect();
  if (dragInfo.onRail) {
    updateState({ camY: railPxToCamY(e.clientY - rect.top, rect.height) }, true);
    return;
  }
  const dx = e.clientX - dragInfo.startX;
  const dy = e.clientY - dragInfo.startY;
  // 横向拖动连续俯仰光轴（左俯右仰），响应灵敏且与 perf.mjs 左右触拖一致
  const pitch = dragInfo.startPitch + (dx / Math.max(180, rect.width * 0.65)) * 34;
  if (dragInfo.isTouch) {
    // 触屏主区只取横向拖动，确保页面可自然上下滚动
    updateState({ pitch: Math.round(pitch * 2) / 2 }, false);
  } else {
    // 桌面鼠标可同时上下微调机位高度
    const camY = dragInfo.startCamY - (dy / Math.max(180, rect.height)) * 1.65;
    updateState({
      pitch: Math.round(pitch * 2) / 2,
      camY: Math.round(camY * 100) / 100,
    }, false);
  }
});

const endDrag = (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  dragInfo = null;
  updateState({}, true);
};
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

// 兼容纯 touch 事件派发（CDP Input.dispatchTouchEvent 在某些环境下触发 touchmove）
let touchDrag = null;
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  if (!t) return;
  const rect = canvas.getBoundingClientRect();
  const lx = t.clientX - rect.left;
  const onRail = hitHeightRail(lx, rect.width);
  touchDrag = {
    onRail,
    startX: t.clientX,
    startY: t.clientY,
    startPitch: state.pitch,
    lockedH: false,
  };
  if (onRail) {
    e.preventDefault();
    updateState({ camY: railPxToCamY(t.clientY - rect.top, rect.height) }, true);
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  if (!t || !touchDrag) return;
  const rect = canvas.getBoundingClientRect();
  if (touchDrag.onRail) {
    e.preventDefault();
    updateState({ camY: railPxToCamY(t.clientY - rect.top, rect.height) }, true);
    return;
  }
  const dx = t.clientX - touchDrag.startX;
  const dy = t.clientY - touchDrag.startY;
  if (!touchDrag.lockedH && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
    touchDrag.lockedH = true;
  }
  if (touchDrag.lockedH) {
    const pitch = touchDrag.startPitch + (dx / Math.max(160, rect.width * 0.65)) * 34;
    updateState({ pitch: Math.round(pitch * 2) / 2 }, false);
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  if (touchDrag) {
    touchDrag = null;
    updateState({}, true);
  }
});

// 键盘方向键微调（不抄 Home 归中，改用 R 复原、方向键细调）
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); updateState({ pitch: state.pitch + 1 }, true); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); updateState({ pitch: state.pitch - 1 }, true); }
  else if (e.key === "ArrowUp") { e.preventDefault(); updateState({ camY: state.camY + 0.08 }, true); }
  else if (e.key === "ArrowDown") { e.preventDefault(); updateState({ camY: state.camY - 0.08 }, true); }
  else if (e.key === "r" || e.key === "R") { e.preventDefault(); updateState({ ...INITIAL_STATE }, false); }
});

// 控件绑定
els.ctrlPitch.addEventListener("input", () => updateState({ pitch: parseFloat(els.ctrlPitch.value) }, true));
els.ctrlCamY.addEventListener("input", () => updateState({ camY: parseFloat(els.ctrlCamY.value) }, true));
els.ctrlRoll.addEventListener("input", () => updateState({ roll: parseFloat(els.ctrlRoll.value) }, true));

els.sceneTabs.forEach((b) => {
  b.addEventListener("click", () => updateState({ sceneId: b.dataset.scene }, false));
});
els.focalBtns.forEach((b) => {
  b.addEventListener("click", () => updateState({ focal: Number(b.dataset.focal) }, false));
});
els.btnGuides.addEventListener("click", () => updateState({ showGuides: !state.showGuides }, false));
els.btnReset.addEventListener("click", () => updateState({ ...INITIAL_STATE }, false));
els.btnFix.addEventListener("click", () => {
  if (lastEval && lastEval.primary && lastEval.primary.fix) {
    updateState(lastEval.primary.fix, true);
  }
});
if (els.lsBtnFix) {
  els.lsBtnFix.addEventListener("click", () => {
    if (lastEval && lastEval.primary && lastEval.primary.fix) {
      updateState(lastEval.primary.fix, true);
    }
  });
}
if (els.lsBtnReset) {
  els.lsBtnReset.addEventListener("click", () => updateState({ ...INITIAL_STATE }, false));
}
els.presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    const patch = {};
    if (p.sceneId !== undefined) patch.sceneId = p.sceneId;
    if (p.camY !== undefined) patch.camY = p.camY;
    if (p.pitch !== undefined) patch.pitch = p.pitch;
    if (p.roll !== undefined) patch.roll = p.roll;
    if (p.focal !== undefined) patch.focal = p.focal;
    updateState(patch, false);
  });
});

// 初始化尺寸与正文七节
new ResizeObserver(() => {
  resizeCanvas();
  runner.draw();
}).observe(canvas);
resizeCanvas();
if (reducedMotion.matches) animDone = true;
runner.draw();

initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initSection07();
