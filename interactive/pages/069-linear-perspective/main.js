// 069 线性透视 · 主控制器（状态管理、直拖交互、键盘控制、loop 渲染与正文七节调度）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, clamp, computePlaza } from "./model.js";
import { renderPlaza, renderBlueprint } from "./hero-render.js";
import {
  initSec01,
  initSec02,
  initSec03,
  initSec04,
  initSec05,
  initSec06,
  initSec07,
  initPosterLightbox,
} from "./sections.js";

const state = { ...INITIAL_STATE };
let geo = computePlaza(state);
let lastHitCoords = { vpX: 0, vpY: 0, wvpX: 0, wvpY: 0 };

const heroCanvas = document.getElementById("hero-canvas");
const bpCanvas = document.getElementById("blueprint-canvas");
const titlePlane = document.getElementById("title-plane");

const els = {
  topStatus: document.getElementById("top-status"),
  badgeVanishing: document.getElementById("badge-vanishing"),
  badgeDepth: document.getElementById("badge-depth"),
  badgeDirection: document.getElementById("badge-direction"),
  badgeSpace: document.getElementById("badge-space"),
  principlesPanel: document.querySelector(".principles-panel"),
  diagTag: document.getElementById("diag-tag"),
  diagHeadline: document.getElementById("diag-headline"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  mVpGap: document.getElementById("m-vpgap"),
  mHRatio: document.getElementById("m-hratio"),
  mContrast: document.getElementById("m-contrast"),
  mFov: document.getElementById("m-fov"),
  pItems: [0, 1, 2, 3].map((i) => document.getElementById(`p-item-${i}`)),
  bpTitle: document.getElementById("bp-title"),
  fovSlider: document.getElementById("hero-fov"),
  fovOut: document.getElementById("hero-fov-out"),
  btnRays: document.getElementById("btn-rays"),
  btnSnapVp: document.getElementById("btn-snap-vp"),
  btnSplitVp: document.getElementById("btn-split-vp"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  depthBtns: [...document.querySelectorAll("[data-depth]")],
  aerialBtns: [...document.querySelectorAll("[data-aerial]")],
  bpTabs: [...document.querySelectorAll("[data-bp-tab]")],
  fovMiniBtns: [...document.querySelectorAll("[data-fov]")],
};

let heroDirty = true;
let bpDirty = true;
let bpVisible = true;
let hoverNode = null;
let dragNode = null;
let dragStartU = 0;
let dragStartClientX = 0;
let lastUiSignature = "";
let lastUiSyncMs = 0;

// 缓存画布逻辑宽高，避免在拖拽每帧调用 getBoundingClientRect() 触发布局回流
const canvasDims = new WeakMap();
function measureCanvas(canvas, maxDpr) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(160, Math.round(rect.width));
  const h = Math.max(110, Math.round(rect.height));
  const dpr = pixelRatio(maxDpr);
  const tw = Math.round(w * dpr);
  const th = Math.round(h * dpr);
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
  const info = { ctx: canvas.getContext("2d"), W: w, H: h, dpr };
  canvasDims.set(canvas, info);
  return info;
}

function sizeCanvas(canvas, isHero = false) {
  const maxDpr = isHero && window.innerWidth <= 600 ? 1.5 : 2;
  let info = canvasDims.get(canvas);
  if (!info) info = measureCanvas(canvas, maxDpr);
  info.ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0);
  return info;
}

if (bpCanvas && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    bpVisible = entry.isIntersecting;
    if (bpVisible && bpDirty) {
      const b = sizeCanvas(bpCanvas, false);
      renderBlueprint(b.ctx, b.W, b.H, state, geo);
      bpDirty = false;
    }
  }).observe(bpCanvas);
}

function setBadge(el, ok, text) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-ok", ok);
  el.classList.toggle("is-err", !ok);
}

// 同步单真源读数、标题透视微倾、按钮状态与白话诊单
function syncUI() {
  geo = computePlaza(state);
  const { dims, score, primaryError, okSummary } = geo;

  // 轻微避免每帧无意义 DOM 写入（高帧率拖拽时仅在值变动时更新）
  const sig = `${score}|${dims.vanishing.status}|${dims.depth.status}|${dims.direction.status}|${dims.space.status}|${primaryError?.code || "ok"}|${state.scene}|${state.depthLaw}|${state.aerialMode}|${state.blueprintTab}|${state.showRays}|${Math.round(state.fovDeg)}|${Math.round(geo.vpMainU * 100)}|${Math.round(geo.horizonV * 100)}`;
  if (sig === lastUiSignature) return;
  lastUiSignature = sig;

  // 顶眉状态徽
  setBadge(els.topStatus, score === 4, score === 4 ? "4 / 4 空间成立" : `${score} / 4 透视失准`);

  // 四大图标状态徽
  setBadge(els.badgeVanishing, dims.vanishing.ok, dims.vanishing.status);
  setBadge(els.badgeDepth, dims.depth.ok, dims.depth.status);
  setBadge(els.badgeDirection, dims.direction.ok, dims.direction.status);
  setBadge(els.badgeSpace, dims.space.ok, dims.space.status);

  // 标题平面随消失点横移微调透视倾角（标题即示范，且保持清晰不裁切）
  if (titlePlane && !reducedMotion.matches) {
    const yaw = clamp(6 + (geo.vpMainU - 0.25) * 14, 4, 15);
    const skew = clamp(1.2 + (geo.horizonV - 0.3) * 4.5, 0.8, 4.2);
    titlePlane.style.setProperty("--title-yaw", `${yaw.toFixed(1)}deg`);
    titlePlane.style.setProperty("--title-skew", `${skew.toFixed(1)}deg`);
  }

  // 左下黑底「原理要点」实况诊单
  if (els.principlesPanel) {
    els.principlesPanel.classList.toggle("is-all-ok", score === 4);
  }
  if (score === 4 && okSummary) {
    setBadge(els.diagTag, true, `成立 · ${okSummary.styleName} (4/4)`);
    els.diagHeadline.textContent = okSummary.title;
    els.diagWhy.textContent = okSummary.why;
    els.diagAction.textContent = okSummary.action;
  } else if (primaryError) {
    setBadge(els.diagTag, false, `错态 · ${primaryError.badge} (${score}/4)`);
    els.diagHeadline.textContent = primaryError.title;
    els.diagWhy.textContent = primaryError.why;
    els.diagAction.textContent = primaryError.action;
  }

  // 四项单真源数值读数
  setBadge(els.mVpGap, dims.vanishing.ok, dims.vanishing.ok ? `Δ${Math.round(geo.vpGap * 100)}%` : `偏 ${Math.round(geo.vpGap * 100)}%`);
  setBadge(els.mHRatio, dims.depth.ok, `${geo.heightRatio.toFixed(1)}×`);
  setBadge(els.mContrast, dims.space.ok, `${geo.contrastDropRatio.toFixed(1)}×`);
  setBadge(els.mFov, dims.direction.ok, `${Math.round(geo.fovDeg)}° · ${geo.equivMm}mm`);

  // 原海报四条要点圆点亮灯状态
  const pStates = [dims.vanishing.ok, dims.depth.ok, dims.space.ok, dims.direction.ok];
  els.pItems.forEach((li, i) => li && li.classList.toggle("is-ok", pStates[i]));

  // 按钮状态同步
  els.sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (els.btnRays) {
    els.btnRays.classList.toggle("is-on", state.showRays);
    els.btnRays.setAttribute("aria-pressed", String(state.showRays));
    els.btnRays.textContent = state.showRays ? "透射线: 开" : "透射线: 关";
  }
  els.depthBtns.forEach((b) => {
    const on = b.dataset.depth === state.depthLaw;
    b.classList.toggle("is-on", on && state.depthLaw === "true");
    b.classList.toggle("is-err-on", on && state.depthLaw !== "true");
    b.setAttribute("aria-pressed", String(on));
  });
  els.aerialBtns.forEach((b) => {
    const on = b.dataset.aerial === state.aerialMode;
    b.classList.toggle("is-on", on && state.aerialMode === "receding");
    b.classList.toggle("is-err-on", on && state.aerialMode !== "receding");
    b.setAttribute("aria-pressed", String(on));
  });
  els.bpTabs.forEach((b) => {
    const on = b.dataset.bpTab === state.blueprintTab;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
  if (els.bpTitle) {
    els.bpTitle.textContent = state.blueprintTab === "pyramid" ? "阿尔贝蒂视觉金字塔（俯视剖面）" : "线性透视示意图";
  }
  if (els.fovSlider) els.fovSlider.value = String(Math.round(state.fovDeg));
  if (els.fovOut) els.fovOut.textContent = `${Math.round(state.fovDeg)}°`;
}

function redrawHero(reveal = 1, pulse = 0, forceUi = false) {
  const now = performance.now();
  // 拖拽中始终更新几何单真源，DOM 文本刷新按 90ms 节流并在松手时立刻补齐，避免慢 CPU 软渲染掉帧
  if (forceUi || !dragNode || now - lastUiSyncMs >= 90) {
    syncUI();
    lastUiSyncMs = now;
  } else {
    geo = computePlaza(state);
  }
  const h = sizeCanvas(heroCanvas, true);
  lastHitCoords = renderPlaza(h.ctx, h.W, h.H, state, geo, {
    reveal,
    pulse,
    hoverNode,
    dragNode,
  });
  if (bpCanvas) {
    if (bpVisible) {
      const b = sizeCanvas(bpCanvas, false);
      renderBlueprint(b.ctx, b.W, b.H, state, geo);
      bpDirty = false;
    } else {
      bpDirty = true;
    }
  }
  heroDirty = false;
}

// 绑定 lib/stage.js 的节能 loop()（开场 1.15s 射线柔和展开，静止后仅在状态变更时重画，零空闲耗电）
const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const reveal = still ? 1 : clamp(0.32 + (t / 1.05) * 0.68, 0.32, 1);
  const opening = !still && t < 1.18;
  if (still || opening || heroDirty) {
    const pulse = still ? 0 : (t * 0.55) % 1;
    redrawHero(reveal, pulse, !dragNode);
  }
});

// 拖拽过程中只标脏交由 rAF 统一一帧一画，避免 pointermove 同步双画卡顿；离散点击或减少动态时立即重画
function requestHeroRedraw(immediate = false) {
  heroDirty = true;
  if (immediate || reducedMotion.matches) {
    redrawHero(1, 0, true);
  }
}

// ==================== 画布直拖交互（支持鼠标 + 触屏 + tools/perf.mjs 横拖） ====================
let dragRect = null;
function canvasCoords(e, useCached = false) {
  const rect = useCached && dragRect ? dragRect : heroCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    u: clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0.05, 0.95),
    v: clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0.08, 0.92),
    w: Math.max(1, rect.width),
  };
}

function hitTestNode(x, y) {
  const rHit = 34;
  if (!geo.dims.vanishing.ok) {
    const dw = Math.hypot(x - lastHitCoords.wvpX, y - lastHitCoords.wvpY);
    if (dw <= rHit) return "wallVP";
  }
  const dm = Math.hypot(x - lastHitCoords.vpX, y - lastHitCoords.vpY);
  if (dm <= rHit) return "mainVP";
  return null;
}

function applyDragAt(pt, isTouchSweep = false) {
  if (dragNode === "wallVP") {
    let nu = clamp(pt.u, 0.16, 0.84);
    let nv = clamp(pt.v, 0.14, 0.84);
    // 靠近主灭点时轻吸合，不自动替用户跳过去
    if (Math.hypot(nu - state.vpMainU, nv - state.horizonV) < 0.032) {
      nu = state.vpMainU;
      nv = state.horizonV;
    }
    state.vpWallU = nu;
    state.vpWallV = nv;
  } else if (dragNode === "mainVP") {
    const wasLocked = geo.dims.vanishing.ok;
    const nu = clamp(pt.u, 0.20, 0.80);
    const nv = isTouchSweep ? state.horizonV : clamp(pt.v, 0.16, 0.84);
    state.vpMainU = nu;
    state.horizonV = nv;
    if (wasLocked) {
      state.vpWallU = nu;
      state.vpWallV = nv;
    }
  } else if (dragNode === "sweep") {
    // 在画布空白区横向拖拽：未合拢时横扫墙面灭点 X，合拢后横移共享主灭点 X
    const du = (pt.clientX - dragStartClientX) / Math.max(160, pt.w);
    if (!geo.dims.vanishing.ok) {
      let nu = clamp(dragStartU + du, 0.16, 0.84);
      if (Math.abs(nu - state.vpMainU) < 0.025 && Math.abs(state.vpWallV - state.horizonV) < 0.025) {
        nu = state.vpMainU;
      }
      state.vpWallU = nu;
    } else {
      const nu = clamp(dragStartU + du, 0.22, 0.78);
      state.vpMainU = nu;
      state.vpWallU = nu;
    }
  }
  requestHeroRedraw();
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button && e.button !== 0) return;
  dragRect = heroCanvas.getBoundingClientRect();
  const pt = canvasCoords(e, true);
  const hit = hitTestNode(pt.x, pt.y);
  dragStartClientX = e.clientX;
  if (hit) {
    dragNode = hit;
    dragStartU = hit === "wallVP" ? state.vpWallU : state.vpMainU;
  } else {
    dragNode = "sweep";
    dragStartU = geo.dims.vanishing.ok ? state.vpMainU : state.vpWallU;
  }
  try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  heroDirty = true;
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (dragNode) {
    const pt = canvasCoords(e, true);
    applyDragAt({ ...pt, clientX: e.clientX }, e.pointerType === "touch" && dragNode === "sweep");
    return;
  }
  const pt = canvasCoords(e, false);
  const h = hitTestNode(pt.x, pt.y);
  if (h !== hoverNode) {
    hoverNode = h;
    heroCanvas.style.cursor = h ? "move" : "ew-resize";
    requestHeroRedraw(false);
  }
});

const stopDrag = () => {
  if (!dragNode) return;
  dragNode = null;
  dragRect = null;
  requestHeroRedraw(true);
};
heroCanvas.addEventListener("pointerup", stopDrag);
heroCanvas.addEventListener("pointercancel", stopDrag);

// 当触摸直接抓在灭点节点上时阻止页面竖滚，其余空白区让 touch-action: pan-y 保持顺滑滚屏
heroCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (dragNode === "wallVP" || dragNode === "mainVP") {
      e.preventDefault();
    }
  },
  { passive: false }
);

// 键盘操作（方向键微调节点、[ / ] 调观察视锥，不使用 Home 归中套话）
heroCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.04 : 0.015;
  let handled = true;
  const moveWall = !geo.dims.vanishing.ok;
  if (e.key === "ArrowLeft") {
    if (moveWall) state.vpWallU = clamp(state.vpWallU - step, 0.16, 0.84);
    else { state.vpMainU = clamp(state.vpMainU - step, 0.20, 0.80); state.vpWallU = state.vpMainU; }
  } else if (e.key === "ArrowRight") {
    if (moveWall) state.vpWallU = clamp(state.vpWallU + step, 0.16, 0.84);
    else { state.vpMainU = clamp(state.vpMainU + step, 0.20, 0.80); state.vpWallU = state.vpMainU; }
  } else if (e.key === "ArrowUp") {
    if (moveWall) state.vpWallV = clamp(state.vpWallV - step, 0.14, 0.84);
    else { state.horizonV = clamp(state.horizonV - step, 0.16, 0.84); state.vpWallV = state.horizonV; }
  } else if (e.key === "ArrowDown") {
    if (moveWall) state.vpWallV = clamp(state.vpWallV + step, 0.14, 0.84);
    else { state.horizonV = clamp(state.horizonV + step, 0.16, 0.84); state.vpWallV = state.horizonV; }
  } else if (e.key === "[") {
    state.fovDeg = clamp(state.fovDeg - 4, 14, 118);
  } else if (e.key === "]") {
    state.fovDeg = clamp(state.fovDeg + 4, 14, 118);
  } else {
    handled = false;
  }
  if (handled) {
    e.preventDefault();
    if (moveWall && Math.hypot(state.vpWallU - state.vpMainU, state.vpWallV - state.horizonV) < 0.028) {
      state.vpWallU = state.vpMainU;
      state.vpWallV = state.horizonV;
    }
    requestHeroRedraw(true);
  }
});

// ==================== 按钮与滑条绑定 ====================
els.sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.scene = b.dataset.scene;
    requestHeroRedraw(true);
  });
});

els.presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    Object.assign(state, p);
    requestHeroRedraw(true);
  });
});

els.btnRays?.addEventListener("click", () => {
  state.showRays = !state.showRays;
  requestHeroRedraw(true);
});

els.btnSnapVp?.addEventListener("click", () => {
  state.vpWallU = state.vpMainU;
  state.vpWallV = state.horizonV;
  requestHeroRedraw(true);
});

els.btnSplitVp?.addEventListener("click", () => {
  state.vpWallU = clamp(state.vpMainU + 0.22, 0.18, 0.82);
  state.vpWallV = clamp(state.horizonV - 0.17, 0.16, 0.80);
  requestHeroRedraw(true);
});

els.depthBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.depthLaw = b.dataset.depth;
    requestHeroRedraw(true);
  });
});

els.aerialBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.aerialMode = b.dataset.aerial;
    requestHeroRedraw(true);
  });
});

els.bpTabs.forEach((b) => {
  b.addEventListener("click", () => {
    state.blueprintTab = b.dataset.bpTab;
    requestHeroRedraw(true);
  });
});

els.fovSlider?.addEventListener("input", () => {
  state.fovDeg = Number(els.fovSlider.value);
  requestHeroRedraw(true);
});

els.fovMiniBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.fovDeg = Number(b.dataset.fov);
    requestHeroRedraw(true);
  });
});

// ==================== 初始化正文七节与灯箱 + 统一尺寸响应 ====================
const sectionRedraws = [
  initSec01(),
  initSec02(),
  initSec03(),
  initSec04(),
  initSec05(),
  initSec06(),
  initSec07(),
];
initPosterLightbox();

// 初始立即绘制完整第一帧（保证 reduced-motion 与极速截屏都有清晰画面）
redrawHero(reducedMotion.matches ? 1 : 0.45, 0, true);

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    canvasDims.delete(heroCanvas);
    if (bpCanvas) canvasDims.delete(bpCanvas);
    requestHeroRedraw(true);
    sectionRedraws.forEach((fn) => fn && fn());
  }, 80);
});
