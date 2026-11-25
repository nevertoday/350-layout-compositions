// 067 重叠空间构图 · 主入口与单真源交互控制（main.js）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  clamp,
  createBrokenState,
  createPosterReferenceState,
  evaluate,
  MID_MODES,
  orderedShapes,
  pointInShape,
  THEMES,
} from "./model.js";
import { clientToNorm, renderHeroStage } from "./artwork.js";
import {
  initSec01OcclusionLab,
  initSec02Mechanisms,
  initSec03Matrix,
  initSec04History,
  initSec05Scenarios,
  initSec06Practice,
} from "./sections.js";

const state = createBrokenState("poster");

const canvas = document.getElementById("hero-canvas");
const host = document.getElementById("stage-host");

// DOM 读数节点（全部由 evaluate(state) 单真源更新）
const elMastStatus = document.getElementById("mast-status");
const elDiagCard = document.getElementById("diag-card");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagWhy = document.getElementById("diag-why");
const elDiagHint = document.getElementById("diag-hint");
const elNumT = document.getElementById("num-t");
const elNumX = document.getElementById("num-x");
const elNumVis = document.getElementById("num-vis");
const elNumWs = document.getElementById("num-ws");

const elChipOverlap = document.getElementById("chip-overlap");
const elChipDepth = document.getElementById("chip-depth");
const elChipOcclusion = document.getElementById("chip-occlusion");
const elChipOrder = document.getElementById("chip-order");
const elMOverlap = document.getElementById("m-overlap");
const elMDepth = document.getElementById("m-depth");
const elMOcclusion = document.getElementById("m-occlusion");
const elMOrder = document.getElementById("m-order");

const elStatFront = document.getElementById("stat-front");
const elStatMid = document.getElementById("stat-mid");
const elStatBack = document.getElementById("stat-back");
const elScaleRange = document.getElementById("scale-range");
const elScaleVal = document.getElementById("scale-val");

const elRules = [
  document.getElementById("rule-1"),
  document.getElementById("rule-2"),
  document.getElementById("rule-3"),
  document.getElementById("rule-4"),
];

const anim = { intro: 0, explodeT: 0, pulse: 0 };
let latestEval = evaluate(state);
let dirty = true;

function syncUI(ev) {
  latestEval = ev;
  const act = ev.activeState;
  const names = THEMES[act.theme]?.names || THEMES.poster.names;

  // 顶眉状态
  elMastStatus.textContent = ev.isPass ? "4 / 4 空间成立" : `${ev.passedCount} / 4 待理层`;
  elMastStatus.className = `mast-status ${ev.isPass ? "is-good" : "is-bad"}`;

  // 诊单主卡
  elDiagCard.className = `diag-card ${ev.isPass ? "is-good" : "is-bad"}`;
  elDiagBadge.textContent = ev.badge;
  elDiagTitle.textContent = ev.title;
  elDiagWhy.textContent = ev.why;
  elDiagHint.textContent = ev.hint;
  elNumT.textContent = `${ev.tCount} 处`;
  elNumX.textContent = `${ev.xCount} 处`;
  elNumVis.textContent = `${ev.focalVisiblePct}%`;
  elNumWs.textContent = `${ev.whitespacePct}%`;

  // 四枚原海报概念实况徽
  elChipOverlap.classList.toggle("is-pass", ev.passOcclusion);
  elMOverlap.textContent = ev.tangentCount > 0
    ? `擦边 ${ev.tangentCount}`
    : ev.tCount + ev.xCount === 0
      ? "零叠分离"
      : `叠压 ${ev.overlapRatioPct}%`;

  elChipDepth.classList.toggle("is-pass", ev.passHierarchy);
  elMDepth.textContent = ev.passHierarchy
    ? "前小后大"
    : ev.obsidianLayer === 3
      ? "大形反压"
      : `露全 ${ev.focalVisiblePct}%`;

  elChipOcclusion.classList.toggle("is-pass", ev.passContrast);
  elMOcclusion.textContent = ev.passContrast
    ? `${ev.contrastRatioFB.toFixed(1)}:1 阶梯`
    : act.midMode === "muddy"
      ? "透叠发脏"
      : act.midMode === "ghost"
        ? "中层断开"
        : `仅 ${ev.contrastRatioFB.toFixed(1)}:1`;

  elChipOrder.classList.toggle("is-pass", ev.passWhitespace);
  elMOrder.textContent = `留白 ${ev.whitespacePct}%`;

  // 教学要点 4 条实时亮灯
  const flags = [ev.passOcclusion, ev.passHierarchy, ev.passContrast, ev.passWhitespace];
  elRules.forEach((li, i) => {
    if (!li) return;
    li.classList.toggle("is-pass", flags[i]);
    const mark = li.querySelector(".rule-mark");
    if (mark) mark.textContent = flags[i] ? "✓" : "×";
  });

  // 三栏层槽实时简读与按钮选中态
  const sel = state.shapes.find((s) => s.id === state.selectedId) || state.shapes[0];
  const layerLabel = sel.layer === 3 ? "前层" : sel.layer === 2 ? "中层" : "后层";
  elStatFront.textContent = `${names[sel.id]} · ${layerLabel}`;
  elStatMid.textContent = MID_MODES[act.midMode]?.label || "透叠玻片";
  elStatBack.textContent = `${act.scale.toFixed(2)}× · 留白 ${ev.whitespacePct}%`;

  elScaleRange.value = String(Math.round(state.scale * 100));
  elScaleVal.textContent = `${state.scale.toFixed(2)}×`;

  document.querySelectorAll("[data-theme]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.theme === state.theme))
  );
  document.querySelectorAll("[data-pick]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.pick === state.selectedId))
  );
  document.querySelectorAll("[data-set-layer]").forEach((b) =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.setLayer) === sel.layer))
  );
  document.querySelectorAll("[data-mid]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.mid === state.midMode))
  );
  document.querySelectorAll("[data-hero-contrast]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.heroContrast === state.contrastMode))
  );
  document.querySelectorAll("[data-compare]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.compare === state.compareMode))
  );
  const btnNodes = document.getElementById("btn-nodes");
  const btnExplode = document.getElementById("btn-explode");
  if (btnNodes) btnNodes.setAttribute("aria-pressed", String(state.showNodes));
  if (btnExplode) btnExplode.setAttribute("aria-pressed", String(state.exploded));
}

function sizeHeroCanvas() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, Math.round(rect.width));
  const h = Math.max(120, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function paintHero() {
  const { ctx, w, h } = sizeHeroCanvas();
  renderHeroStage(ctx, w, h, state, latestEval, anim);
}

function commitChange() {
  syncUI(evaluate(state));
  dirty = true;
  heroLoop.draw();
}

const heroLoop = loop(host, (t, dt, { still }) => {
  const targetExplode = state.exploded ? 1 : 0;
  if (still) {
    anim.intro = 1;
    anim.explodeT = targetExplode;
    anim.pulse = 0;
    paintHero();
    dirty = false;
    return;
  }

  let needsFrame = dirty;
  if (anim.intro < 1) {
    anim.intro = Math.min(1, anim.intro + (dt > 0 ? dt * 2.4 : 0.04));
    needsFrame = true;
  }
  if (Math.abs(anim.explodeT - targetExplode) > 0.005) {
    const step = dt > 0 ? Math.min(1, dt * 7.5) : 0.16;
    anim.explodeT += (targetExplode - anim.explodeT) * step;
    if (Math.abs(anim.explodeT - targetExplode) <= 0.006) anim.explodeT = targetExplode;
    needsFrame = true;
  }

  if (needsFrame) {
    paintHero();
    dirty = false;
  }
});

// ---------- 画布直接拖拽（鼠标全向 + 触屏横向直拖不劫持竖屏滚动 + 兼容 perf.mjs） ----------
let drag = null;

function pickShapeAt(nx, ny) {
  const { list } = orderedShapes(state);
  // 从最顶层往下命中
  for (let i = list.length - 1; i >= 0; i--) {
    if (pointInShape(nx, ny, list[i])) return list[i].id;
  }
  return null;
}

function beginDrag(clientX, clientY, isTouch) {
  if (state.compareMode !== "live") {
    state.compareMode = "live";
  }
  const { nx, ny } = clientToNorm(canvas, clientX, clientY);
  const hitId = pickShapeAt(nx, ny);
  const targetId = hitId || state.selectedId || "focal";
  state.selectedId = targetId;
  const sh = state.shapes.find((s) => s.id === targetId);
  drag = {
    id: targetId,
    isTouch,
    locked: !isTouch,
    startClientX: clientX,
    startClientY: clientY,
    startNormX: nx,
    startNormY: ny,
    origX: sh.x,
    origY: sh.y,
  };
  commitChange();
}

function moveDrag(clientX, clientY, ev) {
  if (!drag) return;
  const dxPx = clientX - drag.startClientX;
  const dyPx = clientY - drag.startClientY;
  if (!drag.locked) {
    if (Math.abs(dyPx) > Math.abs(dxPx) * 1.25 && Math.abs(dyPx) > 8) {
      // 用户在竖向滚页，主动放手不拦截
      drag = null;
      return;
    }
    if (Math.abs(dxPx) >= 3 || Math.abs(dyPx) >= 3) {
      drag.locked = true;
    } else {
      return;
    }
  }
  if (ev && ev.cancelable) ev.preventDefault();
  const { nx, ny } = clientToNorm(canvas, clientX, clientY);
  const sh = state.shapes.find((s) => s.id === drag.id);
  if (!sh) return;
  sh.x = clamp(drag.origX + (nx - drag.startNormX), 0.11, 0.89);
  sh.y = clamp(drag.origY + (ny - drag.startNormY), 0.14, 0.84);
  commitChange();
}

function endDrag() {
  drag = null;
}

canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  beginDrag(e.clientX, e.clientY, false);
});
window.addEventListener("mousemove", (e) => {
  if (drag && !drag.isTouch) moveDrag(e.clientX, e.clientY, e);
});
window.addEventListener("mouseup", () => {
  if (drag && !drag.isTouch) endDrag();
});

// 原生 touch 事件（确保 perf.mjs 的 Input.dispatchTouchEvent 与真机触屏同步丝滑）
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  beginDrag(t.clientX, t.clientY, true);
}, { passive: true });
canvas.addEventListener("touchmove", (e) => {
  if (!drag || !drag.isTouch || e.touches.length !== 1) return;
  const t = e.touches[0];
  moveDrag(t.clientX, t.clientY, e);
}, { passive: false });
canvas.addEventListener("touchend", () => {
  if (drag && drag.isTouch) endDrag();
});
canvas.addEventListener("touchcancel", () => {
  if (drag && drag.isTouch) endDrag();
});

// 键盘操作：方向键微调选中形体、[ / ] 升降层序、Tab 或 1-5 切选形体
canvas.addEventListener("keydown", (e) => {
  const sh = state.shapes.find((s) => s.id === state.selectedId);
  if (!sh) return;
  const step = e.shiftKey ? 0.05 : 0.025;
  let handled = true;
  if (e.key === "ArrowLeft") sh.x = clamp(sh.x - step, 0.11, 0.89);
  else if (e.key === "ArrowRight") sh.x = clamp(sh.x + step, 0.11, 0.89);
  else if (e.key === "ArrowUp") sh.y = clamp(sh.y - step, 0.14, 0.84);
  else if (e.key === "ArrowDown") sh.y = clamp(sh.y + step, 0.14, 0.84);
  else if (e.key === "]") sh.layer = clamp(sh.layer + 1, 1, 3);
  else if (e.key === "[") sh.layer = clamp(sh.layer - 1, 1, 3);
  else handled = false;
  if (handled) {
    e.preventDefault();
    state.compareMode = "live";
    commitChange();
  }
});

// ---------- 工具栏 & 三栏层槽事件绑定 ----------
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    commitChange();
  });
});

document.getElementById("btn-nodes")?.addEventListener("click", () => {
  state.showNodes = !state.showNodes;
  commitChange();
});
document.getElementById("btn-explode")?.addEventListener("click", () => {
  state.exploded = !state.exploded;
  commitChange();
});
document.getElementById("btn-reset")?.addEventListener("click", () => {
  const fresh = createBrokenState(state.theme);
  Object.assign(state, fresh);
  commitChange();
});

document.querySelectorAll("[data-pick]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.selectedId = btn.dataset.pick;
    state.compareMode = "live";
    commitChange();
  });
});

document.querySelectorAll("[data-set-layer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sh = state.shapes.find((s) => s.id === state.selectedId);
    if (!sh) return;
    sh.layer = Number(btn.dataset.setLayer);
    state.compareMode = "live";
    commitChange();
  });
});

document.querySelectorAll("[data-mid]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.midMode = btn.dataset.mid;
    state.compareMode = "live";
    commitChange();
  });
});

document.querySelectorAll("[data-hero-contrast]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.contrastMode = btn.dataset.heroContrast;
    state.compareMode = "live";
    commitChange();
  });
});

elScaleRange?.addEventListener("input", () => {
  state.scale = Number(elScaleRange.value) / 100;
  state.compareMode = "live";
  commitChange();
});

document.querySelectorAll("[data-compare]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const m = btn.dataset.compare;
    if (m === "ref_good") {
      // 点击「看原海报解」可直接把参考解预览到舞台上，再切回或拖动即基于它微调
      state.compareMode = "ref_good";
    } else if (m === "flat_none") {
      state.compareMode = "flat_none";
    } else {
      state.compareMode = "live";
    }
    commitChange();
  });
});

// ---------- 原海报全屏缩放拖拽灯箱 ----------
function initPosterLightbox() {
  const posterBtn = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  if (!posterBtn || !posterImg || !lb || !lbImg) return;

  let z = 1, tx = 0, ty = 0, pan = null;
  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  };
  const open = () => {
    lbImg.src = posterImg.src;
    z = 1; tx = 0; ty = 0; apply();
    lb.hidden = false;
    posterBtn.setAttribute("aria-expanded", "true");
    document.getElementById("lb-close")?.focus();
  };
  const close = () => {
    lb.hidden = true;
    posterBtn.setAttribute("aria-expanded", "false");
    posterBtn.focus();
  };

  posterBtn.addEventListener("click", open);
  document.getElementById("lb-close")?.addEventListener("click", close);
  document.getElementById("lb-in")?.addEventListener("click", () => { z = Math.min(3.5, z + 0.4); apply(); });
  document.getElementById("lb-out")?.addEventListener("click", () => { z = Math.max(0.7, z - 0.4); apply(); });
  document.getElementById("lb-reset")?.addEventListener("click", () => { z = 1; tx = 0; ty = 0; apply(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    z = clamp(z + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 3.5);
    apply();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) { close(); return; }
    pan = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = pan.ox + (e.clientX - pan.sx);
    ty = pan.oy + (e.clientY - pan.sy);
    apply();
  });
  lbStage.addEventListener("pointerup", () => { pan = null; });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// ---------- 初始化全页模块 & 窗口尺寸同步 ----------
syncUI(latestEval);
if (reducedMotion.matches) anim.intro = 1;
paintHero();

const redrawS1 = initSec01OcclusionLab();
const redrawS2 = initSec02Mechanisms();
const redrawS3 = initSec03Matrix();
const redrawS4 = initSec04History();
initSec05Scenarios();
initSec06Practice();
initPosterLightbox();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    paintHero();
    redrawS1();
    redrawS2();
    redrawS3();
    redrawS4();
  }, 60);
});
