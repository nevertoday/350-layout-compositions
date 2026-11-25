// 322 一河两岸式构图 · 主入口
import { loop } from "../../lib/stage.js";
import { createHeroRenderer, renderMiniSchematic } from "./canvas.js";
import { INITIAL_STATE, MOTIFS, MOTIF_ORDER, PRESETS, clamp, evaluate } from "./model.js";
import { initBalanceSeesaw, initFlowLab, initLineageSwitch, initPosterLightbox, initQuiz, initXrayCurtain } from "./sections.js";

const state = {
  ...INITIAL_STATE,
  left: [...INITIAL_STATE.left],
  right: [...INITIAL_STATE.right],
};

const canvas = document.getElementById("hero-canvas");
const miniSvg = document.getElementById("mini-schematic");
const heroTitle = document.getElementById("hero-title");
const heroSeal = document.getElementById("hero-seal");

const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagMobilePeek = document.getElementById("diag-mobile-peek");
const diagReason = document.getElementById("diag-reason");
const diagHint = document.getElementById("diag-hint");
const usageList = [...document.querySelectorAll("[data-usage-idx]")];

const kwSym = document.getElementById("kw-symmetry-state");
const kwBal = document.getElementById("kw-balance-state");
const kwGui = document.getElementById("kw-guidance-state");

const leftTierTag = document.getElementById("left-weight-tag");
const rightTierTag = document.getElementById("right-weight-tag");

const bendSlider = document.getElementById("ctrl-bend");
const bendVal = document.getElementById("val-bend");
const widthSlider = document.getElementById("ctrl-width");
const widthVal = document.getElementById("val-width");
const depthSlider = document.getElementById("ctrl-depth");
const depthVal = document.getElementById("val-depth");
const blockerBtn = document.getElementById("ctrl-blocker");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const slotBtns = [...document.querySelectorAll("[data-bank-side]")];
const mobileTabs = [...document.querySelectorAll("[data-mobile-tab]")];
const mobilePanels = [...document.querySelectorAll("[data-mobile-panel]")];

const renderer = createHeroRenderer(canvas);
let hoverSlot = null;
let hoverBlocker = false;
let isDragging = false;
let lastEval = evaluate(state);
let drawFrame = () => {};

function syncUI(redraw = true) {
  const ev = evaluate(state);
  lastEval = ev;
  lastDiagKey = `${ev.faultId}:${ev.passedCount}`;

  // 标题示范：河道越清通、曲直越舒展，「一河」与「两岸式构图」之间的水脉呼吸感越自然
  const gapEm = state.centerBlocker ? 0.08 : clamp(0.18 + state.riverWidth * 1.15, 0.24, 0.64);
  heroTitle.style.setProperty("--river-gap", `${gapEm.toFixed(2)}em`);
  heroTitle.dataset.state = ev.allOk ? "ok" : "warn";

  heroSeal.textContent = ev.allOk ? "两岸成章 · 气脉贯通" : `${ev.badge} · ${ev.passedCount}/4 项就位`;
  heroSeal.dataset.state = ev.allOk ? "ok" : "warn";

  // 三大海报关键词徽章实时同步
  const setKw = (el, info) => {
    if (!el) return;
    el.textContent = info.text;
    el.dataset.state = info.ok ? "ok" : "warn";
  };
  setKw(kwSym, ev.keywordTags.symmetry);
  setKw(kwBal, ev.keywordTags.balance);
  setKw(kwGui, ev.keywordTags.guidance);

  // 左右岸分量档位
  leftTierTag.textContent = `左岸分量 · ${ev.leftTier}`;
  rightTierTag.textContent = `右岸分量 · ${ev.rightTier}`;

  // 底部「构图要点 / 实时诊岸」盒
  diagBadge.textContent = ev.badge;
  diagBadge.dataset.state = ev.allOk ? "ok" : "warn";
  diagHeadline.textContent = ev.headline;
  if (diagMobilePeek) {
    diagMobilePeek.textContent = `${ev.badge}：${ev.headline}`;
    diagMobilePeek.dataset.state = ev.allOk ? "ok" : "warn";
  }
  diagReason.textContent = ev.reason;
  diagHint.textContent = ev.hint;

  usageList.forEach((li) => {
    const idx = Number(li.dataset.usageIdx);
    const info = ev.usageChecks[idx];
    if (info) li.dataset.state = info.ok ? "ok" : "warn";
  });

  // 河势控槽同步
  bendSlider.value = String(Math.round(state.bend * 100));
  const bendDir = Math.abs(state.bend) < 0.01 ? "笔直" : state.bend > 0 ? `右弯 ${Math.round(state.bend * 100)}%` : `左弯 ${Math.round(-state.bend * 100)}%`;
  bendVal.textContent = bendDir;

  widthSlider.value = String(Math.round(state.riverWidth * 100));
  widthVal.textContent = `${Math.round(state.riverWidth * 100)}%`;

  depthSlider.value = String(Math.round(state.depthFade * 100));
  depthVal.textContent =
    state.depthFade < -0.05 ? "远实近虚" : state.depthFade < 0.3 ? "平涂无深" : `雾阶 ${Math.round(state.depthFade * 100)}%`;

  blockerBtn.textContent = state.centerBlocker ? "移出河心堵物" : "放回堵物试错";
  blockerBtn.dataset.state = state.centerBlocker ? "warn" : "ok";

  // 题材按钮
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 左右岸 6 处按钮同步
  slotBtns.forEach((b) => {
    const side = b.dataset.bankSide;
    const tier = Number(b.dataset.bankTier);
    const id = state[side][tier];
    const m = MOTIFS[id] || MOTIFS.empty;
    const valSpan = b.querySelector(".slot-val");
    if (valSpan) valSpan.textContent = m.label;
    b.classList.toggle("is-filled", id !== "empty");
  });

  // 底部联动矢量缩略图（与主画布 100% 单真源）
  renderMiniSchematic(miniSvg, state, ev);
  if (redraw) drawFrame();
}

function cycleSlot(side, tier) {
  const cur = state[side][tier];
  const next = MOTIF_ORDER[(MOTIF_ORDER.indexOf(cur) + 1) % MOTIF_ORDER.length];
  state[side][tier] = next;
  syncUI();
}

function toggleBlocker(moveToLighterBank = false) {
  if (state.centerBlocker) {
    state.centerBlocker = false;
    if (moveToLighterBank) {
      // 点击画布堵心亭时，若右岸全空则顺势迁去右岸中段呼应，否则纯清河心
      if (state.right.every((x) => x === "empty")) {
        state.right[1] = "trees";
        state.right[2] = "boat";
      }
      if (state.taper < 0.35) state.taper = 0.66;
    }
  } else {
    state.centerBlocker = true;
  }
  syncUI();
}

// ---------- 画布直接交互：横拖拨河 + 点移堵物 + 点换两岸景物 ----------
// 合并同一帧内频繁输入，缓存画布宽度避免拖动时同步回流，确保软件渲染同样稳居高帧率。
let dragStartX = 0;
let dragStartY = 0;
let dragStartBend = 0;
let dragCanvasW = 360;
let dragMoved = false;
let dragSource = null; // "pointer" | "touch"
let activePointer = null;
let dragUiDirty = false;
let lastDiagKey = "";

function applyLightDragUI() {
  const ev = evaluate(state);
  lastEval = ev;
  const bendDir =
    Math.abs(state.bend) < 0.01
      ? "笔直"
      : state.bend > 0
        ? `右弯 ${Math.round(state.bend * 100)}%`
        : `左弯 ${Math.round(-state.bend * 100)}%`;
  bendVal.textContent = bendDir;
  bendSlider.value = String(Math.round(state.bend * 100));
  const diagKey = `${ev.faultId}:${ev.passedCount}`;
  if (diagKey !== lastDiagKey) {
    lastDiagKey = diagKey;
    syncUI(false);
  }
}

function beginDrag(source, clientX, clientY) {
  if (isDragging) return;
  dragSource = source;
  dragStartX = clientX;
  dragStartY = clientY;
  dragStartBend = state.bend;
  dragCanvasW = Math.max(120, canvas.getBoundingClientRect().width);
  dragMoved = false;
  isDragging = true;
}

function moveDrag(source, clientX) {
  if (!isDragging || dragSource !== source) return;
  const dx = clientX - dragStartX;
  if (Math.abs(dx) > 5) dragMoved = true;
  if (dragMoved) {
    const delta = (dx / dragCanvasW) * 0.58;
    state.bend = clamp(dragStartBend + delta, -0.27, 0.27);
    if (Math.abs(state.bend) >= 0.06 && state.taper < 0.64) {
      state.taper = clamp(0.12 + Math.abs(state.bend) * 4.2, 0.08, 0.68);
    }
    dragUiDirty = true;
  }
}

function endDrag(source, clientX, clientY) {
  if (!isDragging || dragSource !== source) return;
  const wasClick = !dragMoved && Math.hypot(clientX - dragStartX, clientY - dragStartY) < 9;
  isDragging = false;
  dragSource = null;
  if (wasClick) {
    const hit = renderer.hitTest(clientX, clientY, state, lastEval);
    if (hit.kind === "blocker") toggleBlocker(true);
    else if (hit.kind === "slot") cycleSlot(hit.slot.side, hit.slot.tier);
  } else {
    dragUiDirty = false;
    syncUI(true);
  }
}

canvas.addEventListener("pointerdown", (e) => {
  activePointer = e.pointerId;
  canvas.setPointerCapture?.(e.pointerId);
  beginDrag("pointer", e.clientX, e.clientY);
});

canvas.addEventListener("pointermove", (e) => {
  if (isDragging && dragSource === "pointer" && (activePointer === null || e.pointerId === activePointer)) {
    moveDrag("pointer", e.clientX);
    return;
  }
  if (isDragging) return;
  const hit = renderer.hitTest(e.clientX, e.clientY, state, lastEval);
  const nextBlocker = hit.kind === "blocker";
  const nextSlot = hit.kind === "slot" ? hit.slot : null;
  if (
    nextBlocker !== hoverBlocker ||
    nextSlot?.side !== hoverSlot?.side ||
    nextSlot?.tier !== hoverSlot?.tier
  ) {
    hoverBlocker = nextBlocker;
    hoverSlot = nextSlot;
    canvas.style.cursor = nextBlocker || nextSlot ? "pointer" : "ew-resize";
    drawFrame();
  }
});

canvas.addEventListener("pointerup", (e) => {
  if (activePointer === e.pointerId) activePointer = null;
  endDrag("pointer", e.clientX, e.clientY);
});

canvas.addEventListener("pointercancel", () => {
  activePointer = null;
  if (dragSource === "pointer") {
    isDragging = false;
    dragSource = null;
    syncUI(true);
  }
});

canvas.addEventListener("pointerleave", () => {
  if (!isDragging && (hoverSlot || hoverBlocker)) {
    hoverSlot = null;
    hoverBlocker = false;
    drawFrame();
  }
});

// 兼容不含 PointerEvent 的触控环境（若 pointer 已接管则不重复触发）
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length || isDragging) return;
    beginDrag("touch", e.touches[0].clientX, e.touches[0].clientY);
  },
  { passive: true }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    if (!e.touches.length || dragSource !== "touch") return;
    moveDrag("touch", e.touches[0].clientX);
  },
  { passive: true }
);
canvas.addEventListener(
  "touchend",
  (e) => {
    if (dragSource !== "touch") return;
    const t = e.changedTouches[0];
    endDrag("touch", t ? t.clientX : dragStartX, t ? t.clientY : dragStartY);
  },
  { passive: true }
);

// 键盘完整操控
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.bend = clamp(state.bend - 0.03, -0.27, 0.27);
    if (Math.abs(state.bend) >= 0.06 && state.taper < 0.64) state.taper = 0.66;
    syncUI();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.bend = clamp(state.bend + 0.03, -0.27, 0.27);
    if (Math.abs(state.bend) >= 0.06 && state.taper < 0.64) state.taper = 0.66;
    syncUI();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.riverWidth = clamp(state.riverWidth + 0.02, 0.1, 0.44);
    syncUI();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.riverWidth = clamp(state.riverWidth - 0.02, 0.1, 0.44);
    syncUI();
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    toggleBlocker(true);
  }
});

// 控槽事件绑定
bendSlider.addEventListener("input", () => {
  state.bend = Number(bendSlider.value) / 100;
  if (Math.abs(state.bend) >= 0.06 && state.taper < 0.6) state.taper = 0.66;
  if (Math.abs(state.bend) < 0.03) state.taper = 0.1;
  syncUI();
});

widthSlider.addEventListener("input", () => {
  state.riverWidth = Number(widthSlider.value) / 100;
  syncUI();
});

depthSlider.addEventListener("input", () => {
  state.depthFade = Number(depthSlider.value) / 100;
  if (state.depthFade >= 0.35 && state.taper < 0.55) state.taper = 0.66;
  syncUI();
});

blockerBtn.addEventListener("click", () => toggleBlocker(false));

sceneBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.scene = b.dataset.scene;
    syncUI();
  })
);

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    Object.assign(state, p.patch, {
      left: [...p.patch.left],
      right: [...p.patch.right],
    });
    syncUI();
  })
);

slotBtns.forEach((b) =>
  b.addEventListener("click", () => {
    cycleSlot(b.dataset.bankSide, Number(b.dataset.bankTier));
  })
);

// 窄屏三叶控槽切换（河势 / 左岸 / 右岸）
function setMobileTab(name) {
  mobileTabs.forEach((t) => {
    const on = t.dataset.mobileTab === name;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
  mobilePanels.forEach((p) => {
    p.classList.toggle("is-mobile-active", p.dataset.mobilePanel === name);
  });
}
mobileTabs.forEach((t) => t.addEventListener("click", () => setMobileTab(t.dataset.mobileTab)));
setMobileTab("river");

// 启动省电主循环（可见时温柔流水与远鸟飘动，拖动按帧合并绘制，隐藏或 reduced-motion 自动静止）
const runner = loop(canvas, (t, _dt, { still }) => {
  if (dragUiDirty) {
    dragUiDirty = false;
    applyLightDragUI();
  }
  renderer.draw(state, lastEval, t, { still, hoverSlot, hoverBlocker, dragging: isDragging });
});
drawFrame = runner.draw;

window.addEventListener("resize", () => drawFrame());

// 初始化首屏与下文全部互动小节
syncUI();
initFlowLab();
initBalanceSeesaw();
initLineageSwitch();
initXrayCurtain();
initQuiz();
initPosterLightbox();
