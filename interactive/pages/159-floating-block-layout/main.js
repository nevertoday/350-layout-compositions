// 159 浮动块版式 · 主入口（连接单真源 model、开放排布画布、Z 轴剖面槽与正文七节）
import { loop, reducedMotion } from "../../lib/stage.js";
import { PRESETS, clonePreset } from "./model.js";
import { createHeroWorkbench } from "./hero-canvas.js";
import { initSections } from "./sections.js";

const state = clonePreset("broken");

const stageCanvas = document.getElementById("hero-canvas");
const profileCanvas = document.getElementById("elevation-canvas");
const titleEl = document.getElementById("hero-title");
const statusPill = document.getElementById("hero-status-pill");
const diagCard = document.getElementById("diag-card");
const diagTag = document.getElementById("diag-tag");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagNext = document.getElementById("diag-next");
const mWhite = document.getElementById("m-white");
const mOverlap = document.getElementById("m-overlap");
const mTilt = document.getElementById("m-tilt");
const mDp = document.getElementById("m-dp");

const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const selectBtns = [...document.querySelectorAll("[data-select]")];
const zBtns = [...document.querySelectorAll("[data-z]")];
const tiltRange = document.getElementById("tilt-range");
const tiltVal = document.getElementById("tilt-val");
const btnGrid = document.getElementById("btn-grid");
const btnSight = document.getElementById("btn-sight");

function syncDOM(ev) {
  // 1. 自示范大标浮动模式与顶部状态丸
  if (titleEl) titleEl.dataset.mode = ev.titleFloatMode;
  if (statusPill) {
    statusPill.textContent = ev.primaryDiag.ok
      ? "4 / 4 浮动通畅"
      : `${ev.passCount} / 4 待整版`;
    statusPill.classList.toggle("is-ok", ev.primaryDiag.ok);
  }

  // 2. 五枚原海报紫罗兰圆徽实时状态
  for (const p of ev.pillars) {
    const li = document.querySelector(`[data-pillar="${p.id}"]`);
    const badge = document.getElementById(`pstat-${p.id}`);
    if (li) {
      li.classList.toggle("is-ok", p.ok);
      li.classList.toggle("is-bad", !p.ok);
    }
    if (badge) badge.textContent = p.status;
  }

  // 3. 轻浮白卡单真源诊单
  if (diagCard) diagCard.classList.toggle("is-ok", ev.primaryDiag.ok);
  if (diagTag) diagTag.textContent = ev.primaryDiag.tag;
  if (diagHeadline) diagHeadline.textContent = ev.primaryDiag.headline;
  if (diagBody) diagBody.textContent = ev.primaryDiag.body;
  if (diagNext) diagNext.textContent = `下一步：${ev.primaryDiag.next}`;
  if (mWhite) mWhite.textContent = `${ev.whitespacePct}%`;
  if (mOverlap) mOverlap.textContent = `${ev.maxOverlapPct}%`;
  if (mTilt) mTilt.textContent = `${ev.maxAbsDeg}°`;
  if (mDp) mDp.textContent = `${ev.dpSpan}dp`;

  // 4. 选中卡精调栏同步
  const cur = state.cards[state.selectedId];
  selectBtns.forEach((b) => {
    const active = b.dataset.select === state.selectedId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  if (cur) {
    if (tiltRange) tiltRange.value = String(cur.deg);
    if (tiltVal) tiltVal.textContent = `${cur.deg > 0 ? "+" : ""}${cur.deg}°`;
    zBtns.forEach((b) => {
      const active = Number(b.dataset.z) === cur.z;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
}

let drawFrame = () => {};
let domDirty = true;

const workbench = createHeroWorkbench({
  stageCanvas,
  profileCanvas,
  state,
  onChange() {
    syncDOM(workbench.getEval());
    domDirty = false;
    workbench.markDirty();
    if (reducedMotion.matches) heroLoop.draw();
  },
});

const heroLoop = loop(stageCanvas, (t, dt, opts) => {
  const ev = workbench.render(t, dt, opts);
  if (domDirty || opts.still) {
    syncDOM(ev);
    domDirty = false;
  }
});
drawFrame = () => {
  domDirty = true;
  workbench.markDirty();
  heroLoop.draw();
};

// 题材切换
themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    themeBtns.forEach((b) => {
      const active = b.dataset.theme === state.theme;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    syncDOM(workbench.syncEval());
    drawFrame();
  });
});

// 预设与试错切换
presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.elevationGain = p.elevationGain;
    for (const [id, v] of Object.entries(p.cards)) {
      state.cards[id] = { ...v };
    }
    syncDOM(workbench.syncEval());
    drawFrame();
  });
});

// 卡片选择、倾角滑条与 Z 层级按钮
selectBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.selectedId = btn.dataset.select;
    syncDOM(workbench.syncEval());
    drawFrame();
  });
});

if (tiltRange) {
  tiltRange.addEventListener("input", () => {
    const cur = state.cards[state.selectedId];
    if (!cur) return;
    cur.deg = Number(tiltRange.value);
    syncDOM(workbench.syncEval());
    drawFrame();
  });
}

zBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cur = state.cards[state.selectedId];
    if (!cur) return;
    cur.z = Number(btn.dataset.z);
    syncDOM(workbench.syncEval());
    drawFrame();
  });
});

// 暗网参考线与视线丝线开关
if (btnGrid) {
  btnGrid.addEventListener("click", () => {
    state.showGrid = !state.showGrid;
    btnGrid.classList.toggle("is-on", state.showGrid);
    btnGrid.setAttribute("aria-pressed", String(state.showGrid));
    btnGrid.textContent = `暗网基准：${state.showGrid ? "开" : "关"}`;
    drawFrame();
  });
}
if (btnSight) {
  btnSight.addEventListener("click", () => {
    state.showSightline = !state.showSightline;
    btnSight.classList.toggle("is-on", state.showSightline);
    btnSight.setAttribute("aria-pressed", String(state.showSightline));
    btnSight.textContent = `视线丝线：${state.showSightline ? "开" : "关"}`;
    drawFrame();
  });
}

// 键盘操作主画布：1-4 选卡、方向键移动、[ / ] 调倾角、+ / - 调层级
if (stageCanvas) {
  const ORDER_IDS = ["hero", "quote", "power", "less"];
  stageCanvas.addEventListener("keydown", (e) => {
    const cur = state.cards[state.selectedId];
    if (!cur) return;
    let handled = true;
    if (e.key >= "1" && e.key <= "4") {
      state.selectedId = ORDER_IDS[Number(e.key) - 1];
    } else if (e.key === "ArrowLeft") {
      cur.u = Math.max(0.11, +(cur.u - 0.025).toFixed(3));
    } else if (e.key === "ArrowRight") {
      cur.u = Math.min(0.89, +(cur.u + 0.025).toFixed(3));
    } else if (e.key === "ArrowUp") {
      cur.v = Math.max(0.12, +(cur.v - 0.025).toFixed(3));
    } else if (e.key === "ArrowDown") {
      cur.v = Math.min(0.88, +(cur.v + 0.025).toFixed(3));
    } else if (e.key === "[") {
      cur.deg = Math.max(-24, +(cur.deg - 1).toFixed(1));
    } else if (e.key === "]") {
      cur.deg = Math.min(24, +(cur.deg + 1).toFixed(1));
    } else if (e.key === "+" || e.key === "=") {
      cur.z = Math.min(3, cur.z + 1);
    } else if (e.key === "-" || e.key === "_") {
      cur.z = Math.max(0, cur.z - 1);
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      syncDOM(workbench.syncEval());
      drawFrame();
    }
  });
}

window.addEventListener("resize", () => {
  workbench.resize();
  syncDOM(workbench.getEval());
  drawFrame();
});

// 初始静态同步，并初始化七节正文互动
syncDOM(workbench.syncEval());
drawFrame();
initSections();
