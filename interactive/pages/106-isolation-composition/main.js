import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  INITIAL_ITEMS,
  RULES,
  SCALES,
  computeLayout,
  createInitialState,
} from "./model.js";

// ==================== HERO：清场隔离台（2D Canvas + 实体清场标尺） ====================
const stageEl = document.getElementById("hero-stage");
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

const state = createInitialState();

// 渲染用平滑态（逻辑真源始终是 model.js 的 computeLayout）
const anim = {
  entrance: 0,
  orbR: SCALES[state.scaleId].diameter / 2,
  moatR: 0.3,
  lift: 0,
  passPulse: 0,
  wasPass: false,
  hoverId: null,
  itemPos: new Map(),     // id -> { x, y, alpha }
  needsDraw: true,
};

let stageW = 900;
let stageH = 440;
let dpr = 1;
let lastLayout = null;
let cachedRailRect = { left: 0, width: 320 };
let cachedThumbW = 44;

const elTier = document.getElementById("hero-tier");
const elPills = document.getElementById("check-pills");
const elCornerEmpty = document.getElementById("corner-empty");
const elCornerRivals = document.getElementById("corner-rivals");
const elCornerGap = document.getElementById("corner-gap");
const elCornerClutter = document.getElementById("corner-clutter");
const elCaliperRead = document.getElementById("caliper-read");
const elMoatRail = document.getElementById("moat-rail");
const elMoatFill = document.getElementById("moat-fill");
const elMoatThumb = document.getElementById("moat-thumb");
const elDiag = document.getElementById("hero-diag");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagHeadline = document.getElementById("diag-headline");
const elDiagDetail = document.getElementById("diag-detail");
const elMGap = document.getElementById("m-gap");
const elMEmpty = document.getElementById("m-empty");
const elMRivals = document.getElementById("m-rivals");
const elMClutter = document.getElementById("m-clutter");
const elScaleGroup = document.getElementById("scale-group");
const btnPruneRivals = document.getElementById("btn-prune-rivals");
const btnPruneStep = document.getElementById("btn-prune-step");
const btnPosterRef = document.getElementById("btn-poster-ref");
const btnReset = document.getElementById("btn-reset");
const pillNodes = [...elPills.querySelectorAll("li")];
const scaleBtns = [...elScaleGroup.querySelectorAll("button")];

function measureRail() {
  const r = elMoatRail.getBoundingClientRect();
  if (r.width > 10) cachedRailRect = { left: r.left, width: r.width };
  const tw = elMoatThumb.offsetWidth;
  if (tw > 10) cachedThumbW = tw;
}

function resizeCanvas() {
  const rect = stageEl.getBoundingClientRect();
  stageW = Math.max(240, Math.round(rect.width));
  stageH = Math.max(220, Math.round(rect.height));
  // 手机小屏像素比上限 1.5，兼顾清晰度与软渲染 60fps 拖动流畅度
  dpr = pixelRatio(stageW <= 500 ? 1.5 : 2);
  canvas.width = Math.round(stageW * dpr);
  canvas.height = Math.round(stageH * dpr);
  measureRail();
  anim.needsDraw = true;
}

// 文本差异缓存：拖动标尺时仅更新发生变化的节点，避免每帧触发无谓 DOM 重排
const prev = {};
function setText(key, el, val) {
  if (prev[key] !== val) {
    prev[key] = val;
    el.textContent = val;
  }
}

function syncUI(layout) {
  setText("tier", elTier, layout.tier);
  elTier.classList.toggle("is-pass", layout.status === "pass");

  for (const li of pillNodes) {
    li.classList.toggle("is-ok", Boolean(layout.checks[li.dataset.key]));
  }

  // 四角展墙标注
  const emptyStr = `${Math.round(layout.emptyPct)}%`;
  const rivalsStr = layout.activeRivalsCount === 0 ? "唯一焦点" : `${layout.activeRivalsCount} 抢戏`;
  const gapStr = `${layout.minGapD.toFixed(2)} D`;
  const clutterStr = layout.activeClutterCount === 0 ? "已清净" : `${layout.activeClutterCount} 余噪`;

  setText("ce", elCornerEmpty, emptyStr);
  elCornerEmpty.parentElement.classList.toggle("is-ok", layout.checks.whitespace);
  elCornerEmpty.parentElement.classList.toggle("is-warn", !layout.checks.whitespace);

  setText("cr", elCornerRivals, rivalsStr);
  elCornerRivals.parentElement.classList.toggle("is-ok", layout.checks.singular);
  elCornerRivals.parentElement.classList.toggle("is-warn", !layout.checks.singular);

  setText("cg", elCornerGap, gapStr);
  const gapOk = layout.crowdingCount === 0 && layout.borderJammedCount === 0;
  elCornerGap.parentElement.classList.toggle("is-ok", gapOk);
  elCornerGap.parentElement.classList.toggle("is-warn", !gapOk);

  setText("cc", elCornerClutter, clutterStr);
  elCornerClutter.parentElement.classList.toggle("is-ok", layout.activeClutterCount <= RULES.maxClutter);
  elCornerClutter.parentElement.classList.toggle("is-warn", layout.activeClutterCount > RULES.maxClutter);

  // 清场标尺用纯 transform 更新，零布局重排
  const pct = Math.round(state.clearance * 100);
  const tx = state.clearance * cachedRailRect.width - cachedThumbW * 0.5;
  elMoatFill.style.transform = `scaleX(${state.clearance})`;
  elMoatThumb.style.transform = `translate3d(${tx.toFixed(1)}px, -50%, 0)`;
  if (prev.ariaVal !== pct) {
    prev.ariaVal = pct;
    elMoatThumb.setAttribute("aria-valuenow", String(pct));
  }
  setText("cal", elCaliperRead, `净距 ${gapStr}`);

  // 诊单
  if (prev.status !== layout.status) {
    prev.status = layout.status;
    elDiag.dataset.status = layout.status;
  }
  setText("badge", elDiagBadge, layout.badge);
  setText("head", elDiagHeadline, layout.headline);
  setText("detail", elDiagDetail, layout.detail);
  setText("mg", elMGap, gapStr);
  setText("me", elMEmpty, emptyStr);
  setText("mr", elMRivals, `${layout.activeRivalsCount} 枚`);
  setText("mc", elMClutter, `${layout.activeClutterCount} 件`);

  if (prev.scaleId !== state.scaleId) {
    prev.scaleId = state.scaleId;
    for (const btn of scaleBtns) {
      const on = btn.dataset.scale === state.scaleId;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  }

  const prText = layout.activeRivalsCount === 0 ? "抢戏红点已清" : `清掉抢戏红点 (${layout.activeRivalsCount})`;
  btnPruneRivals.disabled = layout.activeRivalsCount === 0;
  setText("pr", btnPruneRivals, prText);

  const psText = layout.activeClutterCount === 0 ? "灰调杂物已清" : `清减杂物 (-3 / 剩 ${layout.activeClutterCount})`;
  btnPruneStep.disabled = layout.activeClutterCount === 0;
  setText("ps", btnPruneStep, psText);

  if (prev.ref !== state.showPosterRef) {
    prev.ref = state.showPosterRef;
    btnPosterRef.setAttribute("aria-pressed", String(state.showPosterRef));
  }

  if (layout.status === "pass" && !anim.wasPass) {
    anim.passPulse = 1;
  }
  anim.wasPass = layout.status === "pass";
}

function updateModel(fromDrag = false) {
  lastLayout = computeLayout(state, stageW / stageH);
  syncUI(lastLayout);
  anim.needsDraw = true;
  if (!fromDrag || reducedMotion.matches) heroLoop.draw();
}

function drawItemBody(it, px, py, scalePx, alpha) {
  ctx.save();
  ctx.translate(px, py);
  if (it.rot) ctx.rotate(it.rot);
  ctx.globalAlpha = alpha;

  const r = it.radius * scalePx;
  if (it.kind === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = it.tone;
    ctx.fill();
  } else if (it.kind === "ring") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(4, r * 0.34);
    ctx.strokeStyle = it.tone;
    ctx.stroke();
  } else if (it.kind === "rect" || it.kind === "bar") {
    const w = it.w * scalePx;
    const h = it.h * scalePx;
    ctx.fillStyle = it.tone;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  } else if (it.kind === "pill") {
    const w = it.w * scalePx;
    const h = it.h * scalePx;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = it.tone;
    ctx.fill();
  } else if (it.kind === "frame") {
    const w = it.w * scalePx;
    const h = it.h * scalePx;
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = it.tone;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  } else if (it.kind === "cross") {
    const arm = r * 0.95;
    ctx.lineWidth = Math.max(3, r * 0.28);
    ctx.strokeStyle = it.tone;
    ctx.beginPath();
    ctx.moveTo(-arm, 0); ctx.lineTo(arm, 0);
    ctx.moveTo(0, -arm); ctx.lineTo(0, arm);
    ctx.stroke();
  }
  ctx.restore();
}

function renderHero(t, dt, { still }) {
  if (!lastLayout) lastLayout = computeLayout(state, stageW / stageH);
  const layout = lastLayout;

  // 开场入场进度（0.65s 内完整落稳；减少动态效果一步到位）
  let moving = false;
  if (still) {
    anim.entrance = 1;
    anim.orbR = layout.sR;
    anim.moatR = layout.moatR;
    anim.lift = layout.status === "pass" ? 1 : 0;
    anim.passPulse = 0;
  } else {
    if (anim.entrance < 1) {
      anim.entrance = Math.min(1, anim.entrance + (dt || 0.016) / 0.55);
      moving = true;
    }
    const k = 1 - Math.exp(-(dt || 0.016) * 14);
    const dOrb = layout.sR - anim.orbR;
    const dMoat = layout.moatR - anim.moatR;
    const targetLift = layout.status === "pass" ? 1 : 0;
    const dLift = targetLift - anim.lift;
    if (Math.abs(dOrb) > 0.0004) { anim.orbR += dOrb * k; moving = true; } else anim.orbR = layout.sR;
    if (Math.abs(dMoat) > 0.0004) { anim.moatR += dMoat * k; moving = true; } else anim.moatR = layout.moatR;
    if (Math.abs(dLift) > 0.001) { anim.lift += dLift * k; moving = true; } else anim.lift = targetLift;
    if (anim.passPulse > 0.005) {
      anim.passPulse = Math.max(0, anim.passPulse - (dt || 0.016) * 1.15);
      moving = true;
    }
  }

  for (const it of layout.items) {
    let cur = anim.itemPos.get(it.id);
    const targetAlpha = it.active ? 1 : 0;
    if (!cur || still) {
      cur = { x: it.x, y: it.y, alpha: targetAlpha };
      anim.itemPos.set(it.id, cur);
    } else {
      const k = 1 - Math.exp(-(dt || 0.016) * 15);
      const dx = it.x - cur.x;
      const dy = it.y - cur.y;
      const da = targetAlpha - cur.alpha;
      if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004 || Math.abs(da) > 0.004) {
        cur.x += dx * k;
        cur.y += dy * k;
        cur.alpha += da * k;
        moving = true;
      } else {
        cur.x = it.x;
        cur.y = it.y;
        cur.alpha = targetAlpha;
      }
    }
  }

  if (!anim.needsDraw && !moving) return;
  anim.needsDraw = moving;

  const H = stageH;
  const W = stageW;
  const cx = layout.center.x * H;
  const cy = layout.center.y * H;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 1. 展墙背景（原海报冷瓷浅灰白）
  ctx.fillStyle = "#EAEEF2";
  ctx.fillRect(0, 0, W, H);

  // 极克制的画廊中心微轴刻度（只留端头小短线，不破留白）
  ctx.strokeStyle = "#CBD3DB";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, 12); ctx.lineTo(cx, 24);
  ctx.moveTo(cx, H - 24); ctx.lineTo(cx, H - 12);
  ctx.moveTo(12, cy); ctx.lineTo(24, cy);
  ctx.moveTo(W - 24, cy); ctx.lineTo(W - 12, cy);
  ctx.stroke();

  // 2. 经验净空带外圈（1.15 D 隔离安全环，始终完整落在画框内不裁切）
  const maxFitR = Math.min(cx - 10, W - cx - 10, cy - 10, H - cy - 10);
  const safeRingR = Math.min((anim.orbR + RULES.minGapD * anim.orbR * 2) * H, maxFitR);
  const moatPx = Math.min(anim.moatR * H, maxFitR);

  if (layout.crowdingCount > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, safeRingR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(233, 75, 26, 0.045)";
    ctx.fill();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(185, 52, 11, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // 当前清场半径虚线环
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, moatPx, 0, Math.PI * 2);
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = layout.status === "pass" ? "rgba(22, 97, 67, 0.45)" : "rgba(22, 24, 25, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 成立瞬间的静默扩散环（只走一次，不循环晃）
  if (anim.passPulse > 0.01) {
    const p = 1 - anim.passPulse;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, anim.orbR * H + p * H * 0.34, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(233, 75, 26, ${(1 - p) * 0.45})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // 3. 叠看 106 原海报实测圆位参考框（106.webp 实测宽 19.2% / 高 14.4%）
  if (state.showPosterRef) {
    const refR = H * 0.12; // 等价于 106 原海报约 24% 中央视域高比例
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, refR, 0, Math.PI * 2);
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "#161819";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#161819";
    ctx.font = `500 11px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("POSTER 106 REF", cx, cy - refR - 8);
    ctx.restore();
  }

  // 4. 批量绘制入侵连线 + 13 件元素 + 批量警示圈（减少每帧 Canvas 绘制调用）
  ctx.save();
  ctx.strokeStyle = "rgba(185, 52, 11, 0.32)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  let hasCrowdingLine = false;
  for (const it of layout.items) {
    const p = anim.itemPos.get(it.id);
    if (!p || p.alpha < 0.015 || !it.active || !it.crowding) continue;
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x * H, p.y * H);
    hasCrowdingLine = true;
  }
  if (hasCrowdingLine) ctx.stroke();
  ctx.restore();

  for (const it of layout.items) {
    const p = anim.itemPos.get(it.id);
    if (!p || p.alpha < 0.015) continue;
    drawItemBody(it, p.x * H, p.y * H, H, p.alpha * anim.entrance);
  }

  // 批量警示圈（红圈一次 stroke，灰圈一次 stroke）
  ctx.save();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = "rgba(185, 52, 11, 0.72)";
  ctx.beginPath();
  let hasRedRing = false;
  for (const it of layout.items) {
    const p = anim.itemPos.get(it.id);
    if (!p || p.alpha < 0.05 || !(it.crowding || it.rival) || anim.hoverId === it.id) continue;
    const rr = it.radius * H + 5;
    const ix = p.x * H;
    const iy = p.y * H;
    ctx.moveTo(ix + rr, iy);
    ctx.arc(ix, iy, rr, 0, Math.PI * 2);
    hasRedRing = true;
  }
  if (hasRedRing) ctx.stroke();

  ctx.strokeStyle = "rgba(86, 95, 104, 0.65)";
  ctx.beginPath();
  let hasGrayRing = false;
  for (const it of layout.items) {
    const p = anim.itemPos.get(it.id);
    if (!p || p.alpha < 0.05 || !it.borderJammed || it.crowding || it.rival || anim.hoverId === it.id) continue;
    const rr = it.radius * H + 5;
    const ix = p.x * H;
    const iy = p.y * H;
    ctx.moveTo(ix + rr, iy);
    ctx.arc(ix, iy, rr, 0, Math.PI * 2);
    hasGrayRing = true;
  }
  if (hasGrayRing) ctx.stroke();

  if (anim.hoverId) {
    const it = layout.items.find((x) => x.id === anim.hoverId);
    const p = it && anim.itemPos.get(it.id);
    if (it && p && p.alpha > 0.05) {
      const rr = it.radius * H + 6;
      const ix = p.x * H;
      const iy = p.y * H;
      ctx.strokeStyle = "#161819";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ix, iy, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#161819";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("点击移出", ix, iy - rr - 5);
    }
  }
  ctx.restore();

  // 5. 核心主角：原海报同款悬浮朱赤圆 + 下方柔灰椭圆影
  const ease = 1 - Math.pow(1 - anim.entrance, 3);
  const orbPx = anim.orbR * H * (0.88 + 0.12 * ease);
  const liftPx = anim.lift * 10;
  const orbY = cy - liftPx;

  // 柔灰椭圆影（原海报实采 #CACECF）
  const shadowY = cy + orbPx + Math.max(14, H * 0.062);
  if (shadowY < H - 8) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, shadowY, orbPx * (0.56 - anim.lift * 0.05), Math.max(3.5, orbPx * 0.095), 0, 0, Math.PI * 2);
    ctx.fillStyle = "#CACECF";
    ctx.globalAlpha = ease * (layout.crowdingCount > 0 ? 0.65 : 0.95);
    ctx.fill();
    ctx.restore();
  }

  // 朱赤孤圆（原海报实采 #E94B1A）
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, orbY, orbPx, 0, Math.PI * 2);
  ctx.fillStyle = "#E94B1A";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

const heroLoop = loop(stageEl, renderHero);
resizeCanvas();
updateModel();

const ro = new ResizeObserver(() => {
  resizeCanvas();
  updateModel();
});
ro.observe(stageEl);

// ---------- 交互 1：实体清场半径游标（data-perf-drag，支持鼠标、触控与方向键） ----------
let draggingRail = false;

function setClearanceFromClientX(clientX, fromDrag = true) {
  const v = Math.max(0, Math.min(1, (clientX - cachedRailRect.left) / Math.max(1, cachedRailRect.width)));
  state.clearance = +v.toFixed(3);
  updateModel(fromDrag);
}

elMoatRail.addEventListener("pointerdown", (e) => {
  draggingRail = true;
  measureRail();
  elMoatThumb.setPointerCapture?.(e.pointerId);
  setClearanceFromClientX(e.clientX, false);
});
window.addEventListener("pointermove", (e) => {
  if (!draggingRail) return;
  setClearanceFromClientX(e.clientX, true);
});
window.addEventListener("pointerup", () => { draggingRail = false; });
window.addEventListener("pointercancel", () => { draggingRail = false; });

elMoatThumb.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.12 : 0.04;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.clearance = Math.min(1, +(state.clearance + step).toFixed(3));
    updateModel();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.clearance = Math.max(0, +(state.clearance - step).toFixed(3));
    updateModel();
  }
});

// ---------- 交互 2：画布直接点击删去干扰体 / 横拖清场 ----------
function pickCanvasItem(clientX, clientY) {
  if (!lastLayout) return null;
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / stageH;
  const y = (clientY - rect.top) / stageH;
  let best = null;
  let bestD = Infinity;
  for (const it of lastLayout.items) {
    if (!it.active) continue;
    const hitR = Math.max(it.radius, (it.w || 0) * 0.55, (it.h || 0) * 0.55) + 0.032;
    const d = Math.hypot(x - it.x, y - it.y);
    if (d <= hitR && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}

let canvasDrag = null;
canvas.addEventListener("pointerdown", (e) => {
  canvasDrag = {
    x0: e.clientX,
    y0: e.clientY,
    c0: state.clearance,
    moved: false,
    horiz: false,
  };
});
canvas.addEventListener("pointermove", (e) => {
  if (canvasDrag) {
    const dx = e.clientX - canvasDrag.x0;
    const dy = e.clientY - canvasDrag.y0;
    if (!canvasDrag.moved && Math.hypot(dx, dy) > 8) {
      canvasDrag.moved = true;
      canvasDrag.horiz = Math.abs(dx) > Math.abs(dy);
    }
    if (canvasDrag.horiz) {
      state.clearance = Math.max(0, Math.min(1, +(canvasDrag.c0 + dx / Math.max(180, stageW * 0.45)).toFixed(3)));
      updateModel(true);
    }
    return;
  }
  const hit = pickCanvasItem(e.clientX, e.clientY);
  const nextHover = hit ? hit.id : null;
  if (nextHover !== anim.hoverId) {
    anim.hoverId = nextHover;
    canvas.style.cursor = nextHover ? "pointer" : "ew-resize";
    anim.needsDraw = true;
    heroLoop.draw();
  }
});
canvas.addEventListener("pointerup", (e) => {
  if (canvasDrag && !canvasDrag.moved) {
    const hit = pickCanvasItem(e.clientX, e.clientY);
    if (hit) {
      state.removed.add(hit.id);
      anim.hoverId = null;
      updateModel();
    }
  }
  canvasDrag = null;
});
canvas.addEventListener("pointerleave", () => {
  if (anim.hoverId) {
    anim.hoverId = null;
    anim.needsDraw = true;
    heroLoop.draw();
  }
  canvasDrag = null;
});

// ---------- 交互 3：主体体量 & 清场操作按钮 ----------
elScaleGroup.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-scale]");
  if (!btn) return;
  state.scaleId = btn.dataset.scale;
  updateModel();
});

btnPruneRivals.addEventListener("click", () => {
  for (const it of INITIAL_ITEMS) {
    if (it.rival) state.removed.add(it.id);
  }
  updateModel();
});

btnPruneStep.addEventListener("click", () => {
  const remaining = INITIAL_ITEMS.filter((it) => !it.rival && !state.removed.has(it.id));
  for (const it of remaining.slice(0, 3)) {
    state.removed.add(it.id);
  }
  updateModel();
});

btnPosterRef.addEventListener("click", () => {
  state.showPosterRef = !state.showPosterRef;
  updateModel();
});

btnReset.addEventListener("click", () => {
  const fresh = createInitialState();
  state.clearance = fresh.clearance;
  state.scaleId = fresh.scaleId;
  state.showPosterRef = fresh.showPosterRef;
  state.removed = fresh.removed;
  anim.wasPass = false;
  updateModel();
});

// ==================== 01：博马侧视拥挤实测 ====================
const crowdRange = document.getElementById("crowd-range");
const crowdVal = document.getElementById("crowd-val");
const crowdZone = document.getElementById("crowd-zone");
const crowdChar = document.getElementById("crowd-char");
const flL = document.getElementById("fl-l");
const flR = document.getElementById("fl-r");
const crowdVerdict = document.getElementById("crowd-verdict");
const crowdShuffle = document.getElementById("crowd-shuffle");

const CROWD_SETS = [
  { t: "E", l: "M", r: "W" },
  { t: "H", l: "N", r: "K" },
  { t: "S", l: "B", r: "R" },
  { t: "N", l: "H", r: "M" },
];
let crowdIdx = 0;

function updateCrowding() {
  const px = Number(crowdRange.value);
  crowdVal.textContent = `${px} px`;
  crowdZone.style.gap = `${px}px`;
  if (px < 14) {
    crowdVerdict.innerHTML = `<strong>紧密拥挤（${px} px）：</strong>盯着左侧 + 时，左右两个黑灰字母把中间朱赤字母的笔画搅糊了——即使它们根本没重叠，余光也很难一眼认准。`;
  } else if (px < 30) {
    crowdVerdict.innerHTML = `<strong>临界分离（${px} px）：</strong>轮廓开始从侧翼里挣脱出来，但余光仍会感到两边在拉扯注意力，辨认需要犹豫半拍。`;
  } else {
    crowdVerdict.innerHTML = `<strong>无拥挤视窗（${px} px）：</strong>侧翼已经退到临界间距之外，不用转眼珠，中间的朱赤字母瞬间变得清晰可辨——这就是空间隔离的生理基础。`;
  }
}

crowdRange.addEventListener("input", updateCrowding);
crowdShuffle.addEventListener("click", () => {
  crowdIdx = (crowdIdx + 1) % CROWD_SETS.length;
  const s = CROWD_SETS[crowdIdx];
  crowdChar.textContent = s.t;
  flL.textContent = s.l;
  flR.textContent = s.r;
});
updateCrowding();

// ==================== 02：原海报六语联动解剖图 ====================
const axiomGrid = document.getElementById("axiom-grid");
const anatomySvg = document.getElementById("anatomy-svg");
const anatomyCap = document.getElementById("anatomy-cap");

const AXIOM_CAPS = {
  def: "<strong>定义 · 切断粘连：</strong>把辅助文案退到最外沿，主体周围保留完整一圈无人闯入的隔离带，存在感自然立住。",
  space: "<strong>留白 · 约 89% 的静默场：</strong>106 原海报绝大部分面积都是冷瓷灰白墙，让朱赤圆拥有足够的呼吸空气。",
  focus: "<strong>聚焦 · 四向视线向心收束：</strong>没有第二个抢戏亮点时，目光从画框四边进来后自然滑向中心唯一主角。",
  dist: "<strong>距离 · 拉开临界护城河：</strong>周边元素至少退开主体直径的 1.2 倍以上（经验值），格式塔邻近律便不再把它们拼成一团。",
  indep: "<strong>独立 · 轮廓与投影完整：</strong>主体不压边、不叠字，连脚下那枚淡灰悬浮影也完整呈现，视觉上自成一体。",
  emph: "<strong>强调 · 安静即放大：</strong>不靠加粗边框和刺眼特效，靠四周克制的留白让单点重要性被记住。",
};

axiomGrid.addEventListener("click", (e) => {
  const card = e.target.closest("button[data-axiom]");
  if (!card) return;
  const key = card.dataset.axiom;
  for (const btn of axiomGrid.querySelectorAll("button[data-axiom]")) {
    const on = btn.dataset.axiom === key;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", String(on));
  }
  for (const layer of anatomySvg.querySelectorAll(".an-layer")) {
    layer.classList.toggle("is-show", layer.dataset.for === key);
  }
  anatomyCap.innerHTML = AXIOM_CAPS[key];
});

// ==================== 03：五态展报切换对照 ====================
const specTabs = document.getElementById("specimen-tabs");
const gazeToggle = document.getElementById("gaze-toggle");
const posterMock = document.getElementById("poster-mock");
const specStatus = document.getElementById("spec-status");
const specTitle = document.getElementById("spec-title");
const specDesc = document.getElementById("spec-desc");
const spSpan = document.getElementById("sp-span");
const spGap = document.getElementById("sp-gap");
const spFocus = document.getElementById("sp-focus");
const spEye = document.getElementById("sp-eye");

const SPECIMENS = {
  balanced: {
    status: "理想孤立 · 经验参考",
    warn: false,
    title: "大面积静默托起唯一主角，视觉路径一步到位",
    desc: "器物居于画布中央，高占比约 24%，四周没有任何文案压近；日期、展厅名全部降为深灰小字退守四边。读者第一眼直接锁死朱赤圆钵，随后才扫向标题与展期。",
    span: "24%", gap: "1.9 D", focus: "1 处", eye: "单一锁焦",
  },
  crowded: {
    status: "错态 · 贴身拥挤",
    warn: true,
    title: "文字卡紧贴主角身旁，外框再空也算不上隔离",
    desc: "很多人误以为「四边留了白就是隔离构图」。这里整张海报外围依然很空，但说明卡贴在圆钵右侧仅隔 0.15 D，视觉拥挤直接吞掉了主体的独立轮廓。",
    span: "24%", gap: "0.15 D", focus: "1 处", eye: "左右拉扯",
  },
  twin: {
    status: "错态 · 双红抢戏",
    warn: true,
    title: "多出两处同色朱赤角标，视线被迫来回弹跳",
    desc: "器物大小和距离都没错，但右上日期与左下「限量展品」同样刷成朱赤色。按照孤立效应的上下文机制，多个高饱和焦点并存时，主角的独特性立刻折损。",
    span: "24%", gap: "1.9 D", focus: "3 处", eye: "三角跳动",
  },
  tiny: {
    status: "错态 · 缩成芝麻",
    warn: true,
    title: "主体缩到 6% 高度，空白从托盘变成了荒漠",
    desc: "把主体一味缩小只会让它失去视觉重量。读者扫过展报时，第一眼反而先落在较重的黑字标题上，中间的小红点像不小心沾上的油墨点。",
    span: "6%", gap: "6.4 D", focus: "1 处", eye: "主角失踪",
  },
  corner: {
    status: "错态 · 推到墙角",
    warn: true,
    title: "主体紧贴右上画框，视线刚进来就被甩出去",
    desc: "隔离构图不必死守正中，但主体一旦挤到画框边沿，边框的几何吸力会与主体发生紧绷摩擦，其余大块空地则变成毫无联系的死白。",
    span: "24%", gap: "0.08 D (贴框)", focus: "1 处", eye: "滑出画外",
  },
};

specTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-spec]");
  if (!btn) return;
  const key = btn.dataset.spec;
  const s = SPECIMENS[key];
  posterMock.dataset.spec = key;
  for (const b of specTabs.querySelectorAll("button[data-spec]")) {
    const on = b.dataset.spec === key;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  }
  specStatus.textContent = s.status;
  specStatus.classList.toggle("is-warn", s.warn);
  specTitle.textContent = s.title;
  specDesc.textContent = s.desc;
  spSpan.textContent = s.span;
  spGap.textContent = s.gap;
  spFocus.textContent = s.focus;
  spEye.textContent = s.eye;
});

gazeToggle.addEventListener("click", () => {
  const on = gazeToggle.getAttribute("aria-pressed") !== "true";
  gazeToggle.setAttribute("aria-pressed", String(on));
  posterMock.dataset.gaze = on ? "on" : "off";
});

// ==================== 04：百年孤立史（暗房时间轴） ====================
const timelineList = document.getElementById("timeline-list");
const eraVisual = document.getElementById("era-visual");
const eraMeta = document.getElementById("era-meta");
const eraTitle = document.getElementById("era-title");
const eraBody = document.getElementById("era-body");

const ERAS = {
  "1933": {
    meta: "1933 · Psychologische Forschung（第 18 卷，299–342 页）",
    title: "柏林实验室里的第一份「孤立效应」报告",
    body: "德国心理学家 Hedwig von Restorff 在格式塔学派代表人物 Wolfgang Köhler 指导下发表论文《Über die Wirkung von Bereichsbildungen im Spurenfeld》。她用同质序列里夹入单个异质项的记忆实验证明：与其他条目隔离出来的那一项，回忆率远高于埋在群体里的同类项——后世称作「冯·雷斯托夫效应」（von Restorff effect）或「孤立效应」。",
    svg: `<svg viewBox="0 0 180 180"><g fill="#505B66"><rect x="24" y="42" width="18" height="18"/><rect x="52" y="42" width="18" height="18"/><rect x="80" y="42" width="18" height="18"/><rect x="108" y="42" width="18" height="18"/><rect x="136" y="42" width="18" height="18"/><rect x="24" y="80" width="18" height="18"/><rect x="52" y="80" width="18" height="18"/><rect x="108" y="80" width="18" height="18"/><rect x="136" y="80" width="18" height="18"/><rect x="24" y="118" width="18" height="18"/><rect x="52" y="118" width="18" height="18"/><rect x="80" y="118" width="18" height="18"/><rect x="108" y="118" width="18" height="18"/><rect x="136" y="118" width="18" height="18"/></g><circle cx="89" cy="89" r="11" fill="#FF784E"/></svg>`,
  },
  "1954": {
    meta: "1954 初版 / 1974 修订版 · 加州大学出版社（University of California Press）",
    title: "Arnheim：空旷天空里的一轮孤月最重",
    body: "艺术心理学家 Rudolf Arnheim 在《Art and Visual Perception》（《艺术与视知觉》）中专门论述视觉重量，指出「孤立产生重量」（Isolation makes for weight）：一片空旷天空里孤立的太阳或月亮，视觉分量远重于周围塞满物体的同类图形。因此设计师常能用一侧极小的孤立主角，去平衡另一侧大块复杂的图文群。",
    svg: `<svg viewBox="0 0 180 180"><line x1="22" y1="132" x2="158" y2="132" stroke="#7E8B97" stroke-width="1.5"/><polygon points="90,132 82,146 98,146" fill="#7E8B97"/><g fill="#505B66"><rect x="28" y="90" width="16" height="36"/><rect x="48" y="102" width="16" height="24"/><rect x="68" y="96" width="12" height="30"/></g><circle cx="136" cy="72" r="16" fill="#FF784E"/><circle cx="136" cy="72" r="32" fill="none" stroke="#FF784E" stroke-dasharray="3 4" stroke-opacity="0.6"/></svg>`,
  },
  "1970": {
    meta: "1970 Nature（226:177–178）& 2008 Nature Neuroscience（11:1129–1135）",
    title: "视觉拥挤：为什么邻居太近就认不清主角",
    body: "Herman Bouma 在 1970 年发现，人眼在余光区识别目标字符时，一旦左右邻居靠得太近就会发生强烈遮蔽（博马律）。2008 年 Denis Pelli 与 Katharine Tillman 进一步将其总结为「无拥挤视窗」（The uncrowded window of object recognition）：辨认物体通常不是被清晰度卡住，而是被周边拥挤卡住。拉开净距，等于替大脑打开识别窗口。",
    svg: `<svg viewBox="0 0 180 180"><line x1="24" y1="90" x2="156" y2="90" stroke="#3D4650" stroke-dasharray="3 3"/><circle cx="90" cy="90" r="46" fill="none" stroke="#FF784E" stroke-width="1.4" stroke-dasharray="5 4"/><circle cx="90" cy="90" r="14" fill="#FF784E"/><rect x="22" y="80" width="12" height="20" fill="#63707C"/><rect x="146" y="80" width="12" height="20" fill="#63707C"/></svg>`,
  },
  "1995": {
    meta: "1995 · Psychonomic Bulletin & Review（第 2 卷，105–112 页）",
    title: "Hunt 重读 1933 原文：隔离靠的不是炫目，而是周围一致",
    body: "心理学家 R. Reed Hunt 在《The subtlety of distinctiveness: What von Restorff really did》中澄清了一个流行误解：很多人以为孤立效应靠的是「做得足够花哨醒目」，其实 von Restorff 早已证明，孤立是相对上下文成立的——只有背景与配角足够同质、克制，唯一的差异才会被放大；全场都在喊叫时，孤立立刻失效。",
    svg: `<svg viewBox="0 0 180 180"><g stroke="#505B66" stroke-width="1.5" fill="none"><circle cx="42" cy="48" r="12"/><circle cx="90" cy="48" r="12"/><circle cx="138" cy="48" r="12"/><circle cx="42" cy="132" r="12"/><circle cx="90" cy="132" r="12"/><circle cx="138" cy="132" r="12"/></g><circle cx="90" cy="90" r="16" fill="#FF784E"/></svg>`,
  },
  "2008": {
    meta: "2008 中央公論新社《白》 / 2010 Lars Müller Publishers《White》",
    title: "原研哉：空白不是「没有」，而是承接意义的空容器",
    body: "日本平面设计师原研哉在著作《白》（英文版《White》于 2010 年出版）里，从日本美学中的「空」与余白出发，把白重新理解为一只等待被注满想象的「空容器」。在当代极简海报与包装里，大面积留白不再是省油墨的被动背景，而是主动托举单一器物或图形的场域。",
    svg: `<svg viewBox="0 0 180 180"><rect x="22" y="22" width="136" height="136" fill="none" stroke="#EEF2F5" stroke-width="1.2" stroke-opacity="0.55"/><circle cx="90" cy="84" r="20" fill="#FF784E"/><ellipse cx="90" cy="126" rx="16" ry="3" fill="#EEF2F5" fill-opacity="0.28"/></svg>`,
  },
};

function renderEra(key) {
  const e = ERAS[key];
  eraMeta.textContent = e.meta;
  eraTitle.textContent = e.title;
  eraBody.textContent = e.body;
  eraVisual.innerHTML = e.svg;
}

timelineList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-era]");
  if (!btn) return;
  const key = btn.dataset.era;
  for (const b of timelineList.querySelectorAll("button[data-era]")) {
    const on = b.dataset.era === key;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  }
  renderEra(key);
});
renderEra("1933");

// ==================== 05：三层隔离产品卡组合开关 ====================
const layerSwitches = document.getElementById("layer-switches");
const prodCard = document.getElementById("prod-card");
const layerVerdict = document.getElementById("layer-verdict");
const layers = { moat: false, chroma: false, group: false };

function syncLayers() {
  prodCard.dataset.moat = layers.moat ? "1" : "0";
  prodCard.dataset.chroma = layers.chroma ? "1" : "0";
  prodCard.dataset.group = layers.group ? "1" : "0";

  const count = Number(layers.moat) + Number(layers.chroma) + Number(layers.group);
  if (count === 0) {
    layerVerdict.innerHTML = "<strong>0/3 混杂状态：</strong>空间紧贴、三处红标互抢、参数散落上方——这是商品卡最常见的「什么都想强调，结果什么都没记住」。试着逐个打开上面三枚开关。";
  } else if (count === 3) {
    layerVerdict.innerHTML = "<strong>3/3 三层叠齐：</strong>产品本体独享宽阔呼吸带与唯一朱赤色相，次级参数退到底部细灰栏。信息一个没删，焦点强度却翻了倍。";
  } else {
    const onNames = [
      layers.moat && "空间净距",
      layers.chroma && "色彩降噪",
      layers.group && "碎片归拢",
    ].filter(Boolean).join(" + ");
    const missing = [
      !layers.moat && "再拉开呼吸净距",
      !layers.chroma && "压暗多余红标",
      !layers.group && "归拢上方散乱标签",
    ].filter(Boolean).join("、");
    layerVerdict.innerHTML = `<strong>${count}/3 已开（${onNames}）：</strong>画面已经清爽许多，但仍可${missing}，看孤立感如何再上一层。`;
  }
}

layerSwitches.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-layer]");
  if (!btn) return;
  const k = btn.dataset.layer;
  layers[k] = !layers[k];
  btn.setAttribute("aria-pressed", String(layers[k]));
  syncLayers();
});

// ==================== 07：练一练（四选一） ====================
const quizGrid = document.getElementById("quiz-grid");
const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");

const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "选了 A：主体留白够，但多出两处朱赤抢戏",
    body: "A 的圆钵大小和四周距离都没问题，唯一坏在右上角日期块和左下圆章同样刷成了高饱和朱赤。三个红点在画面里拉出三角形跳转，孤立效应被自己拆散了。正确答案是 C。",
  },
  B: {
    ok: false,
    title: "选了 B：唯一红点且空，但主体缩得太小被留白吞没",
    body: "B 只把圆钵缩小到画面高度的 6% 左右。留白过头时，黑体标题「素器展」反而比主角更重，中间小红点退化成一粒标点符号。正确答案是 C。",
  },
  C: {
    ok: true,
    title: "选对了！C 同时满足唯一焦点、适中体量与充裕净距",
    body: "C 保留了 22% 左右的主体占高，把日期与展厅信息降为低饱和深灰退守边沿，主角四周留出超过 1.8 D 的净空护城河——没有任何视觉竞争者，也没有空到失重。",
  },
  D: {
    ok: false,
    title: "选了 D：外框留白不少，但说明文字紧贴主体侧翼",
    body: "D 的整张纸依然很空，但右侧文字块离朱赤圆只有约 0.12 D，落入视觉拥挤区。外围页边距不等于主体隔离——真正要清空的是主角紧邻的一圈。正确答案是 C。",
  },
};

quizGrid.addEventListener("click", (e) => {
  const card = e.target.closest("button[data-opt]");
  if (!card) return;
  const opt = card.dataset.opt;
  const fb = QUIZ_FEEDBACK[opt];
  quizGrid.classList.add("is-revealed");
  for (const b of quizGrid.querySelectorAll("button[data-opt]")) {
    const k = b.dataset.opt;
    b.setAttribute("aria-pressed", String(k === opt));
    b.classList.toggle("is-picked", k === opt);
    b.classList.toggle("is-correct", k === "C");
    b.classList.toggle("is-wrong", k === opt && !fb.ok);
  }
  quizVerdict.classList.toggle("is-ok", fb.ok);
  quizVerdict.classList.toggle("is-err", !fb.ok);
  qvTitle.textContent = fb.title;
  qvBody.textContent = fb.body;
});

// ==================== 08：原海报灯箱（放大、拖动、Esc 关） ====================
const posterOpen = document.getElementById("poster-open");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbZoom = document.getElementById("lb-zoom");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoom.setAttribute("aria-pressed", String(lbScale > 1));
  lbZoom.textContent = lbScale > 1 ? "还原 1×" : "放大 1.8×";
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterOpen.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.setAttribute("aria-expanded", "false");
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoom.addEventListener("click", () => {
  lbScale = lbScale > 1 ? 1 : 1.8;
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport) { closeLightbox(); return; }
  lbDrag = { x0: e.clientX, y0: e.clientY, ox: lbX, oy: lbY };
  lbViewport.setPointerCapture?.(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.x0);
  lbY = lbDrag.oy + (e.clientY - lbDrag.y0);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbDrag = null; });
lbViewport.addEventListener("pointercancel", () => { lbDrag = null; });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
