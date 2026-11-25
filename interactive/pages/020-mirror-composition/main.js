// 020 镜像构图 · 主控脚本（开场落镜建构台交互 + 各节实验装配）

import {
  LOGICAL_W,
  LOGICAL_H,
  SPECIMENS,
  createInitialState,
  createReferenceState,
  evaluateScene,
} from "./model.js";
import {
  renderMirrorScene,
  hitTestMirrorScene,
  clientToLogicalAxis,
} from "./hero-canvas.js";
import {
  initSpotLab,
  initLayersLab,
  initDualityLab,
  initHistoryLab,
  initCurtainLab,
  initPitfallCards,
  initQuizLab,
  initPosterLightbox,
} from "./labs.js";
import { loop, reducedMotion } from "../../lib/stage.js";

const heroStage = document.getElementById("hero-stage");
const heroCanvas = document.getElementById("hero-canvas");
const axisHandle = document.getElementById("axis-handle");
const handleLabel = document.getElementById("handle-label");
const elementList = document.getElementById("element-list");
const posterChecks = document.getElementById("poster-checks");

const roBadge = document.getElementById("ro-badge");
const roHeadline = document.getElementById("ro-headline");
const roWhy = document.getElementById("ro-why");
const roRatio = document.getElementById("ro-ratio");
const leftNoteTitle = document.getElementById("left-note-title");
const leftNoteBody = document.getElementById("left-note-body");
const rightNoteTitle = document.getElementById("right-note-title");
const rightNoteBody = document.getElementById("right-note-body");

const specBtns = [...document.querySelectorAll(".spec-btn")];
const modeBtns = [...document.querySelectorAll(".mode-btn")];
const btnReset = document.getElementById("btn-reset");
const btnRef = document.getElementById("btn-ref");

let state = createInitialState("poster");
let hoverId = null;
let selectedId = null;
let introProgress = 0.25;
let arcProgress = 0;
let needsDraw = true;
let lastEval = null;

function clampAxis(spec, val) {
  return Math.max(spec.axisMin, Math.min(spec.axisMax, val));
}

// 同步顶沿/左沿光学手柄到精确逻辑轴位（与 4:3 画布等比一致）
function syncHandlePosition(ev) {
  const isV = ev.spec.orientation === "vertical";
  axisHandle.dataset.orient = ev.spec.orientation;
  handleLabel.textContent = ev.spec.axisLabel;
  const tri = axisHandle.querySelector(".handle-tri");
  if (tri) tri.textContent = isV ? "▼" : "▶";
  if (isV) {
    axisHandle.style.left = `${(ev.axis / LOGICAL_W) * 100}%`;
    axisHandle.style.top = "";
  } else {
    axisHandle.style.top = `${(ev.axis / LOGICAL_H) * 100}%`;
    axisHandle.style.left = "";
  }
}

// 渲染左侧「逐元素参与镜像 / 保持正向」切签按钮
function rebuildElementButtons() {
  const spec = SPECIMENS[state.specimenId];
  elementList.innerHTML = "";
  for (const el of spec.elements) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "el-toggle";
    btn.dataset.elId = el.id;

    const left = document.createElement("span");
    left.className = "el-name";
    const sw = document.createElement("span");
    sw.className = "el-swatch";
    sw.style.background = el.color;
    const nm = document.createElement("span");
    nm.textContent = el.short;
    left.append(sw, nm);

    const st = document.createElement("span");
    st.className = "el-state-tag";

    btn.append(left, st);
    btn.addEventListener("click", () => toggleElementMirror(el.id));
    btn.addEventListener("mouseenter", () => { hoverId = el.id; markDirty(); });
    btn.addEventListener("mouseleave", () => { hoverId = null; markDirty(); });
    elementList.appendChild(btn);
  }
}

function updateElementButtonStates(ev) {
  const spec = ev.spec;
  for (const el of spec.elements) {
    const btn = elementList.querySelector(`[data-el-id="${el.id}"]`);
    if (!btn) continue;
    const isMirrored = !!state.mirrorFlags[el.id];
    const tag = btn.querySelector(".el-state-tag");
    btn.setAttribute("aria-pressed", String(isMirrored));

    if (el.kind === "text") {
      if (isMirrored) {
        btn.dataset.state = "warn";
        tag.textContent = ev.mode === "mirror" ? "参与镜像·反字" : "参与镜像";
      } else {
        btn.dataset.state = "ok-upright";
        tag.textContent = "保持正向 ✓";
      }
    } else {
      if (isMirrored) {
        btn.dataset.state = "normal";
        tag.textContent = "参与镜像";
      } else {
        btn.dataset.state = "warn";
        tag.textContent = "未镜像 !";
      }
    }
  }
}

function syncUI(ev) {
  lastEval = ev;
  syncHandlePosition(ev);
  updateElementButtonStates(ev);

  roBadge.textContent = ev.badge;
  roBadge.dataset.tone = ev.tone;
  roHeadline.textContent = ev.headline;
  roWhy.textContent = ev.why;
  roRatio.textContent = ev.minSignedDist < 0 ? "撞镜重叠" : `${ev.ratio.toFixed(1)}×`;

  leftNoteTitle.textContent = ev.leftNoteTitle;
  leftNoteBody.textContent = ev.leftNoteBody;
  rightNoteTitle.textContent = ev.rightNoteTitle;
  rightNoteBody.textContent = ev.rightNoteBody;

  for (const li of posterChecks.querySelectorAll("li")) {
    const k = li.dataset.check;
    const pass = !!ev.checks[k];
    li.dataset.pass = String(pass);
    const mark = li.querySelector(".ck-mark");
    if (mark) mark.textContent = pass ? "✓" : "○";
  }

  for (const b of specBtns) {
    b.setAttribute("aria-pressed", String(b.dataset.specimen === state.specimenId));
  }
  for (const b of modeBtns) {
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  }
}

function markDirty() {
  needsDraw = true;
  if (reducedMotion.matches) heroLoop.draw();
}

function toggleElementMirror(id) {
  state.mirrorFlags[id] = !state.mirrorFlags[id];
  selectedId = id;
  syncUI(evaluateScene(state));
  markDirty();
}

function setAxis(nextVal, { snap = false } = {}) {
  const spec = SPECIMENS[state.specimenId];
  let v = clampAxis(spec, nextVal);
  // 靠近原海报基准 1.0× 时轻微吸附（±4 逻辑单位内）
  if (snap && Math.abs(v - spec.idealAxis) <= 4) {
    v = spec.idealAxis;
  }
  state.axis = v;
  syncUI(evaluateScene(state));
  markDirty();
}

function switchSpecimen(id) {
  state = createInitialState(id);
  selectedId = null;
  hoverId = null;
  rebuildElementButtons();
  syncUI(evaluateScene(state));
  markDirty();
}

// 使用 lib/stage.js 的 loop()：离屏自动停帧、静置跳过冗余重绘、支持 reducedMotion
const heroLoop = loop(heroStage, (_t, dt, { still }) => {
  const ev = lastEval || evaluateScene(state);
  const targetArc = ev.allGood ? 1 : 0;
  let animating = false;
  if (still) {
    introProgress = 1;
    arcProgress = targetArc;
  } else {
    if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + dt * 1.15);
      animating = true;
    }
    const diff = targetArc - arcProgress;
    if (Math.abs(diff) > 0.004) {
      arcProgress += diff * Math.min(1, dt * 8);
      animating = true;
    } else if (arcProgress !== targetArc) {
      arcProgress = targetArc;
      animating = true;
    }
  }
  if (!still && !needsDraw && !animating) return;
  needsDraw = false;
  renderMirrorScene(heroCanvas, state, {
    hoverId,
    selectedId,
    introProgress,
    arcProgress,
  });
});

// ---------- 交互绑定：主拖柄（鼠标 + 触控 + 键盘） ----------
let dragMode = null; // "axis" | null
let dragMoved = false;

function handleAxisDragStart(clientX, clientY) {
  dragMode = "axis";
  dragMoved = true;
  axisHandle.classList.add("dragging");
  const spec = SPECIMENS[state.specimenId];
  setAxis(clientToLogicalAxis(heroCanvas, clientX, clientY, spec.orientation));
}

function handleAxisDragMove(clientX, clientY) {
  if (dragMode !== "axis") return;
  const spec = SPECIMENS[state.specimenId];
  setAxis(clientToLogicalAxis(heroCanvas, clientX, clientY, spec.orientation));
}

function handleAxisDragEnd() {
  if (dragMode !== "axis") return;
  dragMode = null;
  axisHandle.classList.remove("dragging");
  setAxis(state.axis, { snap: true });
}

axisHandle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  axisHandle.setPointerCapture?.(e.pointerId);
  handleAxisDragStart(e.clientX, e.clientY);
});
axisHandle.addEventListener("pointermove", (e) => {
  if (dragMode !== "axis") return;
  e.preventDefault();
  handleAxisDragMove(e.clientX, e.clientY);
});
axisHandle.addEventListener("pointerup", handleAxisDragEnd);
axisHandle.addEventListener("pointercancel", handleAxisDragEnd);

// 兼容直接派发的 TouchEvent（如 tools/perf.mjs 的 CDP dispatchTouchEvent）
axisHandle.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  e.preventDefault();
  handleAxisDragStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
axisHandle.addEventListener("touchmove", (e) => {
  if (dragMode !== "axis" || !e.touches.length) return;
  e.preventDefault();
  handleAxisDragMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
axisHandle.addEventListener("touchend", handleAxisDragEnd);
axisHandle.addEventListener("touchcancel", handleAxisDragEnd);

// 画布点击元素切「参与镜像 / 保持正向」，或直接拖镜轴线
heroCanvas.addEventListener("pointerdown", (e) => {
  const hit = hitTestMirrorScene(heroCanvas, e.clientX, e.clientY, state);
  if (hit.type === "axis") {
    e.preventDefault();
    heroCanvas.setPointerCapture?.(e.pointerId);
    handleAxisDragStart(e.clientX, e.clientY);
  } else if (hit.type === "element") {
    dragMoved = false;
    toggleElementMirror(hit.id);
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (dragMode === "axis") {
    e.preventDefault();
    handleAxisDragMove(e.clientX, e.clientY);
    return;
  }
  const hit = hitTestMirrorScene(heroCanvas, e.clientX, e.clientY, state);
  const nextHover = hit.type === "element" ? hit.id : null;
  const isV = SPECIMENS[state.specimenId].orientation === "vertical";
  heroCanvas.style.cursor =
    hit.type === "axis" ? (isV ? "ew-resize" : "ns-resize") : hit.type === "element" ? "pointer" : "default";
  if (nextHover !== hoverId) {
    hoverId = nextHover;
    markDirty();
  }
});
heroCanvas.addEventListener("pointerup", handleAxisDragEnd);
heroCanvas.addEventListener("pointercancel", handleAxisDragEnd);
heroCanvas.addEventListener("pointerleave", () => {
  if (hoverId !== null) {
    hoverId = null;
    markDirty();
  }
});

// 键盘操作：方向键移轴，Space 切模式，1-4 切元素镜像/正向，R 复原
axisHandle.addEventListener("keydown", (e) => {
  const spec = SPECIMENS[state.specimenId];
  const step = e.shiftKey ? 14 : 4;
  if ((spec.orientation === "vertical" && e.key === "ArrowLeft") || (spec.orientation === "horizontal" && e.key === "ArrowUp")) {
    e.preventDefault();
    setAxis(state.axis - step);
  } else if ((spec.orientation === "vertical" && e.key === "ArrowRight") || (spec.orientation === "horizontal" && e.key === "ArrowDown")) {
    e.preventDefault();
    setAxis(state.axis + step);
  } else if (e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    state.mode = state.mode === "mirror" ? "copy" : "mirror";
    syncUI(evaluateScene(state));
    markDirty();
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    e.stopPropagation();
    switchSpecimen(state.specimenId);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === "r" || e.key === "R") {
    switchSpecimen(state.specimenId);
  } else if (e.key >= "1" && e.key <= "4") {
    const spec = SPECIMENS[state.specimenId];
    const el = spec.elements[Number(e.key) - 1];
    if (el) toggleElementMirror(el.id);
  }
});

// 按钮事件
for (const b of specBtns) {
  b.addEventListener("click", () => switchSpecimen(b.dataset.specimen));
}
for (const b of modeBtns) {
  b.addEventListener("click", () => {
    state.mode = b.dataset.mode;
    syncUI(evaluateScene(state));
    markDirty();
  });
}
btnReset.addEventListener("click", () => switchSpecimen(state.specimenId));
btnRef.addEventListener("click", () => {
  state = createReferenceState(state.specimenId);
  syncUI(evaluateScene(state));
  markDirty();
});

// 初始化全部模块
rebuildElementButtons();
syncUI(evaluateScene(state));
needsDraw = true;
heroLoop.draw();
window.addEventListener("resize", () => {
  needsDraw = true;
  heroLoop.draw();
});

initSpotLab();
initLayersLab();
initDualityLab();
initHistoryLab();
initCurtainLab();
initPitfallCards();
initQuizLab((optModel) => {
  state = createReferenceState("poster");
  state.axis = optModel.heroAxisForTry;
  rebuildElementButtons();
  syncUI(evaluateScene(state));
  needsDraw = true;
  heroLoop.draw();
  document.getElementById("hero")?.scrollIntoView({ block: "start" });
});
initPosterLightbox();
