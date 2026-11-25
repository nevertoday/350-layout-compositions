// 018 对称构图 · 主入口
import { loop, reducedMotion } from "../../lib/stage.js";
import { clamp, computeMetrics, createInitialState } from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);

const stageEl = $("hero-stage");
const canvas = $("hero-canvas");
const wingHandle = $("wing-handle");
const hingeHandle = $("hinge-handle");
const foldBtn = $("fold-btn");
const resetBtn = $("reset-btn");

const roStateTitle = $("ro-state-title");
const roSymSub = $("ro-sym-sub");
const roStateDesc = $("ro-state-desc");
const roEyeTitle = $("ro-eye-title");
const roEyeDesc = $("ro-eye-desc");
const roFoldTitle = $("ro-fold-title");
const roFoldDesc = $("ro-fold-desc");

const modeBtns = [...document.querySelectorAll("[data-mode]")];
const subjectBtns = [...document.querySelectorAll("[data-subject]")];

const state = createInitialState();
state.intro = reducedMotion.matches ? 1 : 0.88;

const renderer = createHeroCanvas(canvas);
let needsDraw = true;
let lastReadoutKey = "";

function syncHandles() {
  const m = computeMetrics(state);

  if (wingHandle) {
    const p = renderer.wingHandlePosition(state);
    wingHandle.style.left = `${p.x}px`;
    wingHandle.style.top = `${p.y}px`;
    wingHandle.dataset.mode = state.mode;
    wingHandle.classList.toggle("is-folded", state.fold > 0.35);
    wingHandle.setAttribute(
      "aria-label",
      state.mode === "near"
        ? `左翼内瓣细部柄：示意对称度 ${m.symmetryPct}%（外廓 100%）；可拖动或按方向键微调细节`
        : `左翼外廓校准柄：示意对称度 ${m.symmetryPct}%；可拖动靠近镜像位磁吸重合，或按方向键调整`
    );
  }

  if (hingeHandle) {
    const hp = renderer.hingeHandlePosition(state);
    hingeHandle.style.left = `${hp.x}px`;
    hingeHandle.style.top = `${hp.y}px`;
    hingeHandle.setAttribute("aria-pressed", String(state.foldTarget > 0.5));
    hingeHandle.setAttribute(
      "aria-label",
      state.foldTarget > 0.5
        ? "中轴对折铰链：当前已对折，向左拖或按空格展开双翼"
        : "中轴对折铰链：向右拖动把左半页翻到右边检验重合，或按空格对折"
    );
  }
}

function syncUI() {
  const m = computeMetrics(state);

  modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  subjectBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.subject === state.subject)));

  if (foldBtn) {
    const folded = state.dragging === "hinge" ? state.fold > 0.5 : state.foldTarget > 0.5;
    foldBtn.setAttribute("aria-pressed", String(folded));
    foldBtn.textContent = folded ? "展开双翼" : "对折检验";
  }

  const key = [
    m.stateTitle,
    m.symSub,
    m.stateDesc,
    m.eyeTitle,
    m.eyeDesc,
    m.foldTitle,
    m.foldDesc,
    m.tone,
  ].join("|");

  if (key !== lastReadoutKey) {
    lastReadoutKey = key;
    if (roStateTitle) {
      roStateTitle.textContent = m.stateTitle;
      roStateTitle.dataset.tone = m.tone;
    }
    if (roSymSub) roSymSub.textContent = m.symSub;
    if (roStateDesc) roStateDesc.textContent = m.stateDesc;
    if (roEyeTitle) roEyeTitle.textContent = m.eyeTitle;
    if (roEyeDesc) roEyeDesc.textContent = m.eyeDesc;
    if (roFoldTitle) roFoldTitle.textContent = m.foldTitle;
    if (roFoldDesc) roFoldDesc.textContent = m.foldDesc;
  }
}

function applyWingPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  const loc = renderer.screenToLocal(sx, sy);
  const { u } = renderer.geometry();

  if (state.mode === "outer") {
    const wasLocked = Math.abs(state.leftSpread - 1.0) < 0.005 && Math.abs(state.leftLift) < 0.005;
    const distFromAxis = Math.max(u * 0.2, -loc.x);
    let nextSpread = clamp(distFromAxis / Math.max(1, u * 0.90), 0.56, 1.32);
    let nextLift = clamp(loc.y / Math.max(1, u * 0.42), -0.26, 0.26);

    if (Math.abs(nextSpread - 1.0) < 0.055 && Math.abs(nextLift) < 0.055) {
      nextSpread = 1.0;
      nextLift = 0.0;
      if (!wasLocked) state.snapPulse = 1;
    }

    state.leftSpread = nextSpread;
    state.leftLift = nextLift;
  } else {
    const wasZero = Math.hypot(state.detailDx, state.detailDy) < 0.035;
    const rawDx = (0.58 - Math.max(0.15, -loc.x / Math.max(1, u))) / 0.18;
    const rawDy = loc.y / Math.max(1, u * 0.26);
    let nextDx = clamp(rawDx, -0.92, 0.92);
    let nextDy = clamp(rawDy, -0.92, 0.92);

    if (Math.hypot(nextDx, nextDy) < 0.09) {
      nextDx = 0;
      nextDy = 0;
      if (!wasZero) state.snapPulse = 1;
    }

    state.detailDx = nextDx;
    state.detailDy = nextDy;
  }

  if (state.foldTarget > 0.5) state.foldTarget = 0;
  needsDraw = true;
  syncUI();
}

// ---------- 左翼校准柄与中轴铰链交互（鼠标 / 触屏 / 键盘） ----------
let activeDrag = null; // "wing" | "hinge"
let activePointerId = null;
let dragStartClientX = 0;
let dragStartClientY = 0;
let dragMoved = false;
let hingeStartLocalX = 0;
let hingeStartFold = 0;

function beginDrag(kind, clientX, clientY) {
  activeDrag = kind;
  state.dragging = kind;
  dragStartClientX = clientX;
  dragStartClientY = clientY;
  dragMoved = false;

  if (kind === "wing") {
    wingHandle?.classList.add("is-dragging");
    applyWingPoint(clientX, clientY);
  } else if (kind === "hinge") {
    hingeHandle?.classList.add("is-dragging");
    const rect = canvas.getBoundingClientRect();
    const loc = renderer.screenToLocal(clientX - rect.left, clientY - rect.top);
    hingeStartLocalX = loc.x;
    hingeStartFold = state.fold;
  }

  needsDraw = true;
  if (reducedMotion.matches) ctrl.draw();
}

function moveDrag(clientX, clientY) {
  if (!activeDrag) return;
  if (Math.hypot(clientX - dragStartClientX, clientY - dragStartClientY) > 5) {
    dragMoved = true;
  }

  if (activeDrag === "wing") {
    applyWingPoint(clientX, clientY);
  } else if (activeDrag === "hinge") {
    const rect = canvas.getBoundingClientRect();
    const loc = renderer.screenToLocal(clientX - rect.left, clientY - rect.top);
    const { u } = renderer.geometry();
    const delta = (loc.x - hingeStartLocalX) / Math.max(40, u * 0.68);
    state.fold = clamp(hingeStartFold + delta, 0, 1);
    state.foldTarget = state.fold >= 0.45 ? 1 : 0;
    needsDraw = true;
    syncUI();
  }

  if (reducedMotion.matches) ctrl.draw();
}

function endDrag() {
  if (!activeDrag) return;
  const kind = activeDrag;
  activeDrag = null;
  activePointerId = null;
  state.dragging = null;

  wingHandle?.classList.remove("is-dragging");
  hingeHandle?.classList.remove("is-dragging");

  if (kind === "hinge") {
    if (!dragMoved) {
      state.foldTarget = state.foldTarget > 0.5 ? 0 : 1;
    } else {
      state.foldTarget = state.fold >= 0.42 ? 1 : 0;
    }
    syncUI();
  }

  needsDraw = true;
  if (reducedMotion.matches) ctrl.draw();
}

function bindHandle(el, kind) {
  if (!el) return;
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    e.preventDefault();
    e.stopPropagation();
    activePointerId = e.pointerId;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    beginDrag(kind, e.clientX, e.clientY);
  });
  el.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (activeDrag !== kind || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    moveDrag(e.clientX, e.clientY);
  });
  el.addEventListener("pointerup", () => {
    if (activeDrag === kind) endDrag();
  });
  el.addEventListener("pointercancel", () => {
    if (activeDrag === kind) endDrag();
  });

  el.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      e.stopPropagation();
      beginDrag(kind, e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );
}

bindHandle(wingHandle, "wing");
bindHandle(hingeHandle, "hinge");

window.addEventListener(
  "touchmove",
  (e) => {
    if (!activeDrag || !e.touches.length) return;
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  },
  { passive: true }
);
window.addEventListener("touchend", () => endDrag(), { passive: true });
window.addEventListener("touchcancel", () => endDrag(), { passive: true });

// 桌面端直接在画布空白处拖动：按落点判断是拖左翼还是铰链
canvas?.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const loc = renderer.screenToLocal(sx, sy);
  const { u } = renderer.geometry();

  const kind = Math.hypot(loc.x - state.fold * u * 0.28, loc.y) < 32 ? "hinge" : "wing";

  activePointerId = e.pointerId;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
  beginDrag(kind, e.clientX, e.clientY);
});
canvas?.addEventListener("pointermove", (e) => {
  if (!activeDrag || (activePointerId !== null && e.pointerId !== activePointerId)) return;
  moveDrag(e.clientX, e.clientY);
});
canvas?.addEventListener("pointerup", () => endDrag());
canvas?.addEventListener("pointercancel", () => endDrag());

// ---------- 键盘无障碍操控 ----------
wingHandle?.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.12 : 0.05;
  let handled = true;
  if (state.mode === "outer") {
    if (e.key === "ArrowLeft") state.leftSpread = clamp(state.leftSpread + step, 0.56, 1.32);
    else if (e.key === "ArrowRight") state.leftSpread = clamp(state.leftSpread - step, 0.56, 1.32);
    else if (e.key === "ArrowUp") state.leftLift = clamp(state.leftLift - step, -0.26, 0.26);
    else if (e.key === "ArrowDown") state.leftLift = clamp(state.leftLift + step, -0.26, 0.26);
    else if (e.key === " " || e.key === "Enter") state.foldTarget = state.foldTarget > 0.5 ? 0 : 1;
    else if (e.key === "r" || e.key === "R") alignAndReset();
    else handled = false;

    if (handled && Math.abs(state.leftSpread - 1.0) < 0.03 && Math.abs(state.leftLift) < 0.03) {
      state.leftSpread = 1.0;
      state.leftLift = 0.0;
      state.snapPulse = 1;
    }
  } else {
    const dStep = e.shiftKey ? 0.22 : 0.12;
    if (e.key === "ArrowLeft") state.detailDx = clamp(state.detailDx - dStep, -0.92, 0.92);
    else if (e.key === "ArrowRight") state.detailDx = clamp(state.detailDx + dStep, -0.92, 0.92);
    else if (e.key === "ArrowUp") state.detailDy = clamp(state.detailDy - dStep, -0.92, 0.92);
    else if (e.key === "ArrowDown") state.detailDy = clamp(state.detailDy + dStep, -0.92, 0.92);
    else if (e.key === " " || e.key === "Enter") state.foldTarget = state.foldTarget > 0.5 ? 0 : 1;
    else if (e.key === "r" || e.key === "R") alignAndReset();
    else handled = false;
  }

  if (handled) {
    e.preventDefault();
    needsDraw = true;
    syncUI();
    ctrl.draw();
  }
});

hingeHandle?.addEventListener("keydown", (e) => {
  let handled = true;
  if (e.key === "ArrowRight") state.foldTarget = 1;
  else if (e.key === "ArrowLeft") state.foldTarget = 0;
  else if (e.key === " " || e.key === "Enter") state.foldTarget = state.foldTarget > 0.5 ? 0 : 1;
  else handled = false;
  if (handled) {
    e.preventDefault();
    needsDraw = true;
    syncUI();
    ctrl.draw();
  }
});

// ---------- 控制条与标本小签 ----------
modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    if (state.mode === "near") {
      state.leftSpread = 1.0;
      state.leftLift = 0.0;
    }
    needsDraw = true;
    syncUI();
    ctrl.draw();
  });
});

subjectBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.subject = btn.dataset.subject;
    needsDraw = true;
    syncUI();
    ctrl.draw();
  });
});

foldBtn?.addEventListener("click", () => {
  state.foldTarget = state.foldTarget > 0.5 ? 0 : 1;
  needsDraw = true;
  syncUI();
  ctrl.draw();
});

function alignAndReset() {
  state.mode = "outer";
  state.leftSpread = 1.0;
  state.leftLift = 0.0;
  state.detailDx = 0.0;
  state.detailDy = 0.0;
  state.foldTarget = 0;
  state.snapPulse = 1;
  needsDraw = true;
  syncUI();
  ctrl.draw();
}

resetBtn?.addEventListener("click", alignAndReset);

// ---------- 渲染主循环（屏幕外自动停绘，尊重减少动态效果） ----------
const ctrl = loop(stageEl, (_t, dt, { still }) => {
  let moving = false;

  if (still) {
    state.intro = 1;
    state.fold = state.foldTarget;
    state.snapPulse = 0;
  } else {
    if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt * 0.45);
      moving = true;
    }
    if (state.dragging !== "hinge") {
      const df = state.foldTarget - state.fold;
      if (Math.abs(df) > 0.002) {
        state.fold += df * Math.min(1, dt * 8.0);
        if (Math.abs(state.foldTarget - state.fold) <= 0.002) state.fold = state.foldTarget;
        moving = true;
      }
    }
    if (state.snapPulse > 0) {
      state.snapPulse = Math.max(0, state.snapPulse - dt * 2.4);
      moving = true;
    }
  }

  if (needsDraw || moving || still) {
    renderer.draw(state);
    syncHandles();
    needsDraw = false;
  }
});

const ro = new ResizeObserver(() => {
  needsDraw = true;
  ctrl.draw();
});
ro.observe(stageEl);

syncUI();
renderer.draw(state);
syncHandles();

initLabs();
