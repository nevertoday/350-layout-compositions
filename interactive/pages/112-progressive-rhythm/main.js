// 112 渐进节奏组织 · 互动逻辑总控
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  INITIAL_STATE,
  PRESETS,
  clamp,
  computeBaseSeries,
  computeStageGeometry,
  evaluate,
  hitTestBeat,
} from "./model.js";
import { renderHeroStage, renderOriginPlate } from "./artwork.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, text = "") {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
}

// ============================================================
// 1. HERO 活体渐进阶梯谱台（单真源状态 + 横拖跨度 + 点拍修补 + 四维开关）
// ============================================================
const state = {
  ...INITIAL_STATE,
  dims: { ...INITIAL_STATE.dims },
};

const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const dom = {
  railStatus: document.getElementById("rail-status"),
  mobileStatus: document.getElementById("mobile-status"),
  diag: document.getElementById("hero-diag"),
  diagTag: document.getElementById("diag-tag"),
  diagHeadline: document.getElementById("diag-headline"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  mSpan: document.getElementById("m-span"),
  mRatio: document.getElementById("m-ratio"),
  mTail: document.getElementById("m-tail"),
  mDims: document.getElementById("m-dims"),
  footClimax: document.getElementById("foot-climax"),
  beatsVal: document.getElementById("beats-val"),
  btnFixDip: document.getElementById("btn-fix-dip"),
  pillars: {
    increase: { box: document.getElementById("p-increase"), val: document.getElementById("pv-increase") },
    momentum: { box: document.getElementById("p-momentum"), val: document.getElementById("pv-momentum") },
    sequence: { box: document.getElementById("p-sequence"), val: document.getElementById("pv-sequence") },
    emphasis: { box: document.getElementById("p-emphasis"), val: document.getElementById("pv-emphasis") },
  },
};

let heroW = 900;
let heroH = 430;
let heroCompact = false;
let heroGeom = null;
let heroEval = null;
let heroReveal = reducedMotion.matches ? 1 : 0.28; // 开场即见清晰起势，0.8 秒内渐进展开
let heroPulse = 0;
let heroHover = -1;
let heroDragging = false;
let heroDirty = true;

function resizeHeroCanvas() {
  const rect = heroCanvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(260, Math.round(rect.width));
  const h = Math.max(200, Math.round(rect.height));
  heroCompact = window.innerWidth < 1180;
  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  heroW = w;
  heroH = h;
  heroGeom = computeStageGeometry(state, heroW, heroH, heroCompact);
  heroDirty = true;
}

function syncHeroUI() {
  heroGeom = computeStageGeometry(state, heroW, heroH, heroCompact);
  heroEval = evaluate(state, heroGeom);
  const { score, pillars, diagnosis, metrics } = heroEval;
  const allOk = score === 4;

  // 顶眉与手机徽
  dom.railStatus.textContent = allOk ? "4 / 4 已校准" : `${score} / 4 待调律`;
  dom.railStatus.classList.toggle("is-ok", allOk);
  dom.railStatus.classList.toggle("is-warn", !allOk);
  if (dom.mobileStatus) {
    dom.mobileStatus.textContent = `${score} / 4`;
    dom.mobileStatus.classList.toggle("is-ok", allOk);
  }

  // 白话诊单
  dom.diag.classList.toggle("is-ok", allOk);
  dom.diag.classList.toggle("is-warn", !allOk);
  dom.diagTag.textContent = diagnosis.tag;
  dom.diagHeadline.textContent = diagnosis.headline;
  dom.diagWhy.textContent = diagnosis.why;
  dom.diagAction.textContent = diagnosis.action;

  dom.mSpan.textContent = `${metrics.span.toFixed(1)}×`;
  dom.mRatio.textContent = `${metrics.geomStepRatio.toFixed(2)}×`;
  dom.mTail.textContent = `+${Math.round(metrics.tailStepPct)}%`;
  dom.mDims.textContent = `${metrics.activeDimCount} 维`;
  dom.footClimax.textContent = `终点 / 焦点 · ${metrics.span.toFixed(1)}×`;
  dom.beatsVal.textContent = String(state.beats);

  // 四枚关键词柱
  for (const key of ["increase", "momentum", "sequence", "emphasis"]) {
    const p = pillars[key];
    const node = dom.pillars[key];
    node.box.classList.toggle("is-ok", p.ok);
    node.box.classList.toggle("is-warn", !p.ok);
    node.val.textContent = p.badge;
  }

  // 按钮激活态
  document.querySelectorAll("[data-curve]").forEach((btn) => {
    const active = btn.dataset.curve === state.curve;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll("[data-bardir]").forEach((btn) => {
    const active = btn.dataset.bardir === state.barDir;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  document.querySelectorAll("[data-dim]").forEach((btn) => {
    const on = Boolean(state.dims[btn.dataset.dim]);
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    const st = btn.querySelector(".dim-state");
    if (st) st.textContent = on ? "开" : "关";
  });

  const hasDip = state.dipIndex >= 1 && state.dipIndex <= state.beats - 2;
  dom.btnFixDip.textContent = hasDip ? `补齐第 ${state.dipIndex + 1} 拍` : "制造凹陷试错";
  dom.btnFixDip.classList.toggle("is-done", !hasDip);

  heroDirty = true;
}

const heroLoop = loop(heroCanvas, (_t, dt, { still }) => {
  if (still) {
    heroReveal = 1;
    if (!heroGeom || !heroEval) syncHeroUI();
    renderHeroStage(heroCtx, state, heroGeom, heroEval, {
      reveal: 1,
      pulse: 0,
      hoverBeat: heroHover,
      dragging: heroDragging,
    });
    heroDirty = false;
    return;
  }

  let needDraw = heroDirty;
  if (heroReveal < 1) {
    heroReveal = Math.min(1, heroReveal + Math.max(dt, 0.016) * 1.15);
    needDraw = true;
  }
  if (heroEval && heroEval.score === 4) {
    heroPulse = (heroPulse + Math.max(dt, 0.016) * 0.42) % 1;
    needDraw = true;
  }
  if (needDraw && heroGeom && heroEval) {
    renderHeroStage(heroCtx, state, heroGeom, heroEval, {
      reveal: heroReveal,
      pulse: heroPulse,
      hoverBeat: heroHover,
      dragging: heroDragging,
    });
    heroDirty = false;
  }
});

function refreshHero() {
  syncHeroUI();
  heroLoop.draw();
}

// 直接交互：画布横向拖动调节跨度 + 点击任意拍切换凹陷破序
let dragSession = null;

function canvasLocal(clientX, clientY) {
  const r = heroCanvas.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
}

function beginDrag(id, clientX, clientY) {
  const pt = canvasLocal(clientX, clientY);
  dragSession = {
    id,
    startX: clientX,
    startY: clientY,
    startSpan: state.span,
    moved: false,
    lockedH: false,
    hitBeat: hitTestBeat(heroGeom, pt.x, pt.y),
  };
}

function moveDrag(clientX, clientY, ev) {
  if (!dragSession) return;
  const dx = clientX - dragSession.startX;
  const dy = clientY - dragSession.startY;
  if (!dragSession.lockedH) {
    if (Math.abs(dx) > 4 && Math.abs(dx) >= Math.abs(dy) * 0.8) {
      dragSession.lockedH = true;
      dragSession.moved = true;
      heroDragging = true;
    } else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      // 纵向手势交还给浏览器滚动
      dragSession = null;
      heroDragging = false;
      return;
    }
  }
  if (dragSession.lockedH) {
    if (ev && ev.cancelable) ev.preventDefault();
    const sensitivity = 9.5 / Math.max(220, heroW * 0.65);
    const nextSpan = clamp(dragSession.startSpan + dx * sensitivity, 1.0, 11.5);
    const rounded = Math.round(nextSpan * 20) / 20;
    if (Math.abs(rounded - state.span) >= 0.01) {
      state.span = rounded;
      refreshHero();
    } else {
      heroDirty = true;
      heroLoop.draw();
    }
  }
}

function endDrag(clientX, clientY) {
  if (!dragSession) return;
  const wasMoved = dragSession.moved;
  const pt = canvasLocal(clientX, clientY);
  const beatIdx = hitTestBeat(heroGeom, pt.x, pt.y);
  dragSession = null;
  heroDragging = false;
  if (!wasMoved && beatIdx >= 0) {
    if (beatIdx === state.dipIndex) {
      state.dipIndex = -1;
    } else if (beatIdx >= 1 && beatIdx <= state.beats - 2) {
      state.dipIndex = beatIdx;
    } else if (state.dipIndex >= 0) {
      state.dipIndex = -1;
    }
    refreshHero();
  } else {
    heroDirty = true;
    heroLoop.draw();
  }
}

// 同时兼容 Pointer（鼠标）与原生 Touch（perf.mjs 触屏测试）
let touchActive = false;

heroCanvas.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  touchActive = true;
  const t = e.touches[0];
  beginDrag(t.identifier, t.clientX, t.clientY);
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!touchActive || !dragSession || !e.touches.length) return;
  const t = e.touches[0];
  moveDrag(t.clientX, t.clientY, e);
}, { passive: false });

heroCanvas.addEventListener("touchend", (e) => {
  if (!touchActive) return;
  const t = e.changedTouches[0];
  endDrag(t ? t.clientX : 0, t ? t.clientY : 0);
  setTimeout(() => { touchActive = false; }, 120);
}, { passive: true });

heroCanvas.addEventListener("pointerdown", (e) => {
  if (touchActive || e.pointerType === "touch") return;
  heroCanvas.setPointerCapture(e.pointerId);
  beginDrag(e.pointerId, e.clientX, e.clientY);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (touchActive || e.pointerType === "touch") return;
  if (dragSession && dragSession.id === e.pointerId) {
    moveDrag(e.clientX, e.clientY, e);
  } else {
    const pt = canvasLocal(e.clientX, e.clientY);
    const hIdx = hitTestBeat(heroGeom, pt.x, pt.y);
    if (hIdx !== heroHover) {
      heroHover = hIdx;
      heroCanvas.style.cursor = hIdx >= 0 ? "pointer" : "ew-resize";
      heroDirty = true;
      heroLoop.draw();
    }
  }
});

heroCanvas.addEventListener("pointerup", (e) => {
  if (touchActive || e.pointerType === "touch") return;
  if (dragSession && dragSession.id === e.pointerId) {
    endDrag(e.clientX, e.clientY);
  }
});

heroCanvas.addEventListener("pointerleave", () => {
  if (heroHover !== -1) {
    heroHover = -1;
    heroDirty = true;
    heroLoop.draw();
  }
});

// 画布键盘操作
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.span = clamp(Math.round((state.span + 0.4) * 10) / 10, 1.0, 11.5);
    refreshHero();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.span = clamp(Math.round((state.span - 0.4) * 10) / 10, 1.0, 11.5);
    refreshHero();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.beats = clamp(state.beats + 1, 3, 15);
    if (state.dipIndex >= state.beats - 1) state.dipIndex = -1;
    refreshHero();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.beats = clamp(state.beats - 1, 3, 15);
    if (state.dipIndex >= state.beats - 1) state.dipIndex = -1;
    refreshHero();
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    state.dipIndex = state.dipIndex >= 0 ? -1 : Math.floor(state.beats / 2);
    refreshHero();
  }
});

// 按钮控件绑定
document.querySelectorAll("[data-curve]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.curve = btn.dataset.curve;
    refreshHero();
  });
});

document.querySelectorAll("[data-bardir]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.barDir = btn.dataset.bardir;
    refreshHero();
  });
});

document.querySelectorAll("[data-dim]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.dim;
    state.dims[k] = !state.dims[k];
    refreshHero();
  });
});

document.getElementById("btn-beats-dec").addEventListener("click", () => {
  state.beats = clamp(state.beats - 1, 3, 15);
  if (state.dipIndex >= state.beats - 1) state.dipIndex = -1;
  refreshHero();
});

document.getElementById("btn-beats-inc").addEventListener("click", () => {
  state.beats = clamp(state.beats + 1, 3, 15);
  refreshHero();
});

dom.btnFixDip.addEventListener("click", () => {
  const hasDip = state.dipIndex >= 1 && state.dipIndex <= state.beats - 2;
  state.dipIndex = hasDip ? -1 : Math.max(1, Math.min(state.beats - 2, Math.floor(state.beats / 2)));
  refreshHero();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const factory = PRESETS[btn.dataset.preset];
    if (!factory) return;
    const next = factory();
    state.span = next.span;
    state.beats = next.beats;
    state.curve = next.curve;
    state.dipIndex = next.dipIndex;
    state.barDir = next.barDir;
    state.dims = { ...next.dims };
    refreshHero();
  });
});

// ============================================================
// 2. 01 节：四条递增把手 2×2 独立步进倍率矩阵
// ============================================================
const LEVER_MODES = {
  flat: {
    ratio: 1.0,
    size: "7 颗圆半径全同，视线原地打转，退化成了静止重复。",
    spacing: "等距栅栏均匀排开，没有松紧呼吸，也看不出从哪头读起。",
    thickness: "所有横杠粗细一致，页面里分不出谁轻谁重。",
    density: "每格都只有 2 颗点，缺乏聚拢感，视觉分量完全平权。",
  },
  steady: {
    ratio: 1.28,
    size: "圆径按 1.28× 逐拍放大，小圆起势轻巧，末圆自然成为视觉锚点。",
    spacing: "竖线本身等高同粗，只靠空隙逐步拉开，仍能制造由紧绷到舒展的呼吸势能。",
    thickness: "线宽从纤细发丝增至厚重实杠，像乐谱里的渐强记号，极适合目录条与标题层级。",
    density: "单点本身不放大，靠群组点数由 1 枚逐级聚拢到 12 枚，在不改轮廓尺寸时推高分量。",
  },
  steep: {
    ratio: 1.62,
    size: "倍率飙到 1.62×：前两颗圆缩成尘点，最后两颗突然撑爆边框。",
    spacing: "左侧线条粘成一团黑影，右侧又空出大片断崖，失去匀称节奏。",
    thickness: "前段细线几乎隐形，末段厚块压得画面严重右沉。",
    density: "尾端密点爆堆成实心色块，单点节拍被糊掉。",
  },
};

function drawLeverCards(modeKey) {
  const cfg = LEVER_MODES[modeKey] || LEVER_MODES.steady;
  const r = cfg.ratio;
  const n = 7;

  // 1) 大小递增
  const svgSize = document.getElementById("svg-lever-size");
  svgSize.innerHTML = "";
  const rawR = Array.from({ length: n }, (_, i) => Math.pow(r, i));
  const maxR = rawR[n - 1];
  const minPx = r === 1 ? 13 : r > 1.5 ? 2.4 : 4.5;
  const maxPx = r === 1 ? 13 : r > 1.5 ? 36 : 26;
  const radii = rawR.map((v) => minPx + ((v - 1) / Math.max(0.001, maxR - 1)) * (maxPx - minPx));
  let totalW = radii.reduce((acc, rad) => acc + rad * 2, 0);
  const gapS = Math.max(4, (320 - totalW) / (n - 1));
  let cx = 20;
  radii.forEach((rad, i) => {
    cx += rad;
    svgSize.append(svgEl("circle", {
      cx: cx.toFixed(1),
      cy: 46,
      r: rad.toFixed(1),
      fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
    }));
    cx += rad + gapS;
  });
  document.getElementById("read-lever-size").textContent = cfg.size;

  // 2) 间距递增
  const svgSp = document.getElementById("svg-lever-spacing");
  svgSp.innerHTML = "";
  const gaps = Array.from({ length: n - 1 }, (_, i) => Math.pow(r, i));
  const sumG = gaps.reduce((a, b) => a + b, 0);
  let sx = 28;
  for (let i = 0; i < n; i++) {
    svgSp.append(svgEl("rect", {
      x: sx.toFixed(1),
      y: 18,
      width: 4,
      height: 56,
      fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
    }));
    if (i < gaps.length) sx += (gaps[i] / sumG) * 300;
  }
  document.getElementById("read-lever-spacing").textContent = cfg.spacing;

  // 3) 粗细递增
  const svgTh = document.getElementById("svg-lever-thickness");
  svgTh.innerHTML = "";
  const ths = Array.from({ length: n }, (_, i) => {
    if (r === 1) return 8;
    const t = (Math.pow(r, i) - 1) / (Math.pow(r, n - 1) - 1);
    return (r > 1.5 ? 1.4 : 2.2) + t * (r > 1.5 ? 36 : 22);
  });
  const segW = 36;
  const stepX = (324 - segW) / (n - 1);
  ths.forEach((h, i) => {
    svgTh.append(svgEl("rect", {
      x: (18 + i * stepX).toFixed(1),
      y: (46 - h / 2).toFixed(1),
      width: segW,
      height: h.toFixed(1),
      fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
    }));
  });
  document.getElementById("read-lever-thickness").textContent = cfg.thickness;

  // 4) 密度递增
  const svgDn = document.getElementById("svg-lever-density");
  svgDn.innerHTML = "";
  const counts = r === 1
    ? [2, 2, 2, 2, 2, 2, 2]
    : r > 1.5
      ? [1, 1, 2, 3, 6, 12, 20]
      : [1, 2, 3, 4, 6, 9, 12];
  const cellW = 324 / n;
  counts.forEach((cnt, i) => {
    const cols = Math.min(4, Math.ceil(Math.sqrt(cnt)));
    const rows = Math.ceil(cnt / cols);
    const gx0 = 18 + i * cellW + cellW / 2 - ((cols - 1) * 7.5) / 2;
    const gy0 = 46 - ((rows - 1) * 7.5) / 2;
    let placed = 0;
    for (let rr = 0; rr < rows && placed < cnt; rr++) {
      for (let cc = 0; cc < cols && placed < cnt; cc++) {
        svgDn.append(svgEl("circle", {
          cx: (gx0 + cc * 7.5).toFixed(1),
          cy: (gy0 + rr * 7.5).toFixed(1),
          r: 2.6,
          fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
        }));
        placed++;
      }
    }
  });
  document.getElementById("read-lever-density").textContent = cfg.density;
}

document.querySelectorAll("[data-lever-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-lever-mode]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    drawLeverCards(btn.dataset.leverMode);
  });
});

// ============================================================
// 3. 02 节：韦伯-费希纳双轨实测（等差 vs 等比）
// ============================================================
const weberInput = document.getElementById("weber-steps");
const weberOut = document.getElementById("weber-steps-out");
const svgWeberLin = document.getElementById("svg-weber-lin");
const svgWeberGeo = document.getElementById("svg-weber-geo");

function renderWeberTrack(svg, diameters, isGeo) {
  svg.innerHTML = "";
  const n = diameters.length;
  const padL = 44;
  const padR = 52;
  const spanW = 880 - padL - padR;

  // 水平基准轴
  svg.append(svgEl("line", {
    x1: padL - 10, y1: 64, x2: 880 - padR + 18, y2: 64,
    stroke: "rgba(248,247,241,0.22)", "stroke-width": 1.2,
  }));

  const xs = [];
  for (let i = 0; i < n; i++) {
    xs.push(padL + (spanW * i) / (n - 1));
  }

  for (let i = 0; i < n; i++) {
    const r = diameters[i] / 2;
    const cx = xs[i];
    svg.append(svgEl("circle", {
      cx: cx.toFixed(1),
      cy: 64,
      r: r.toFixed(1),
      fill: i === n - 1 ? PALETTE.gold : i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
    }));
    svg.append(svgEl("text", {
      x: cx.toFixed(1),
      y: 124,
      "text-anchor": "middle",
      fill: PALETTE.cream,
      "font-size": 15,
      "font-family": "IBM Plex Mono, monospace",
    }, `${Math.round(diameters[i])}px`));

    if (i > 0) {
      const pct = Math.round((diameters[i] / diameters[i - 1] - 1) * 100);
      const midX = (xs[i - 1] + cx) / 2;
      const weak = !isGeo && pct <= 14;
      svg.append(svgEl("text", {
        x: midX.toFixed(1),
        y: 20,
        "text-anchor": "middle",
        fill: weak ? PALETTE.coralDark : isGeo ? PALETTE.mintDark : PALETTE.gold,
        "font-size": 15,
        "font-weight": 700,
        "font-family": "IBM Plex Mono, monospace",
      }, `+${pct}%`));
    }
  }
}

function updateWeberLab() {
  const n = clamp(Number(weberInput.value), 5, 11);
  weberOut.textContent = `${n} 拍`;
  const d0 = 12;
  const d1 = 68;
  const lin = Array.from({ length: n }, (_, i) => d0 + ((d1 - d0) * i) / (n - 1));
  const ratio = Math.pow(d1 / d0, 1 / (n - 1));
  const geo = Array.from({ length: n }, (_, i) => d0 * Math.pow(ratio, i));

  renderWeberTrack(svgWeberLin, lin, false);
  renderWeberTrack(svgWeberGeo, geo, true);

  const linHead = Math.round((lin[1] / lin[0] - 1) * 100);
  const linTail = Math.round((lin[n - 1] / lin[n - 2] - 1) * 100);
  const geoStep = Math.round((ratio - 1) * 100);

  document.getElementById("weber-lin-stat").textContent = `首步 +${linHead}% → 尾步 +${linTail}% · 落差衰减 ${(linHead / Math.max(1, linTail)).toFixed(1)}×`;
  document.getElementById("weber-geo-stat").textContent = `每步稳定 +${geoStep}%（×${ratio.toFixed(2)}）· 动势直达终点`;
  document.getElementById("weber-explain").textContent =
    `同样从 12px 涨到 68px、拆成 ${n} 拍：等差序列每步固定加 ${((d1 - d0) / (n - 1)).toFixed(1)}px，开头一步就猛跳 +${linHead}%，末尾却跌到 +${linTail}%，肉眼像撞上平顶；等比序列每步稳定按 ×${ratio.toFixed(2)}（+${geoStep}%）递进，符合人眼的对数辨别规律。`;
}

weberInput.addEventListener("input", updateWeberLab);

// ============================================================
// 4. 03 节：历史源流 5 枚交互标本图板
// ============================================================
const ORIGINS = {
  fechner: {
    cite: "古斯塔夫·费希纳 · 《心理物理学纲要》（1860）",
    title: "用数学证实「比例递增」才等于人眼的「等步增长」",
    desc: "费希纳在 1860 年整理恩斯特·韦伯的感官辨别实验，提出韦伯-费希纳定律：主观感受量随物理刺激呈对数增长。1957 年史蒂文斯又在《心理学评论》发表幂定律细化各通道指数。这解释了为何面积、字号与亮度的渐进不能简单加固定像素。",
    takeaway: "给排版的启发：发现递进图形尾段「长不动了」，多半是误用了等差加法，改用等比步进立刻恢复呼吸感。",
    label: "调节对数采样拍数：",
  },
  latourette: {
    cite: "勒·柯布西耶《模度》（1948/1950）与泽纳基斯 · 拉图雷特修道院（1956–1960）",
    title: "把渐进间距浇筑进混凝土与玻璃立面",
    desc: "建筑师兼作曲家伊阿尼斯·泽纳基斯在柯布西耶事务所工作时，把管弦乐作品《转移》（1953–1954）的连续密度变化与《模度》黄金数列转译到拉图雷特修道院的「波形玻璃窗」上：竖向混凝土棂条间距逐级收密再舒展，让静止的立面像乐章一样流动。",
    takeaway: "给排版的启发：即便元素本身的形状和粗细一成不变，单靠「间距递增」也足以撑起建筑级的视觉动势。",
    label: "调节模度疏密对比：",
  },
  arnheim: {
    cite: "鲁道夫·阿恩海姆 · 《艺术与视知觉》（1954）",
    title: "把渐进透视与尺度累积叫做视觉里的「渐强」",
    desc: "格式塔心理学美学家阿恩海姆指出，画框里的图形不是死物，而是彼此推拉的视觉力场。当形态、轮廓线宽或空间透视沿同一轴线逐级收束或放大时，画面会产生音乐里渐强记号般的定向推力，迫使视线滑向高潮。",
    takeaway: "给排版的启发：渐进必须有归宿。推力越强，终点那个焦点的信息就越该配得上这份期待。",
    label: "调节力场递增层数：",
  },
  hofmann: {
    cite: "阿明·霍夫曼《平面设计手册》（1965）与王无邪《平面设计原理》（1972）",
    title: "将「渐进」拆解为点、线、面可教学的平面语法",
    desc: "瑞士巴塞尔设计学院的霍夫曼在 1965 年手册里，用黑白点阵与线条密度的渐进训练学生把握正负空间；香港设计师王无邪则在 1972 年英文版《平面设计原理》第六章系统归纳了形状、大小、位置与方向渐进，成为全球设计基础课的通用语言。",
    takeaway: "给排版的启发：一次只改动 1 到 2 条基础变量，比把颜色、角度、大小全一起拧更克制也更有力。",
    label: "调节巴塞尔条阵柱数：",
  },
  bringhurst: {
    cite: "罗伯特·布林赫斯特 · 《字体排印风格要素》（1992）",
    title: "古典铅字尺码表本质上就是一套渐进音阶",
    desc: "布林赫斯特在 1992 年初版中指出，欧洲沿用数百年的金属活字序列（6、7、8、9、10、11、12、14、16、18、21、24、36、48、60、72pt）并非随意拍脑袋：小字号增量细腻以保易读，大字号步幅成倍拉开以立层级，和音乐里 5:4、4:3、3:2 的音程比率异曲同工。",
    takeaway: "给排版的启发：网页与海报做层级时，先定一个 1.25× 或 1.333× 的等比字号阶梯，远比临场乱挑字号稳健。",
    label: "切换音乐音程模数档位：",
  },
};

let currentOrigin = "fechner";
const originCanvas = document.getElementById("origin-canvas");
const originCtx = originCanvas.getContext("2d");
const originParam = document.getElementById("origin-param");
const originParamVal = document.getElementById("origin-param-val");
const originParamLabel = document.getElementById("origin-param-label");

function drawOrigin() {
  const rect = originCanvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(260, Math.round(rect.width));
  const h = Math.max(220, Math.round(rect.height));
  if (originCanvas.width !== Math.round(w * dpr) || originCanvas.height !== Math.round(h * dpr)) {
    originCanvas.width = Math.round(w * dpr);
    originCanvas.height = Math.round(h * dpr);
    originCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const val = Number(originParam.value);
  originParamVal.textContent = String(val);
  renderOriginPlate(originCtx, currentOrigin, w, h, val);
}

function selectOrigin(key) {
  currentOrigin = key;
  const info = ORIGINS[key];
  document.getElementById("origin-cite").textContent = info.cite;
  document.getElementById("origin-title").textContent = info.title;
  document.getElementById("origin-desc").textContent = info.desc;
  document.getElementById("origin-takeaway").textContent = info.takeaway;
  originParamLabel.firstChild.textContent = info.label;

  document.querySelectorAll(".origin-tab").forEach((t) => {
    const on = t.dataset.origin === key;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
  drawOrigin();
}

document.querySelectorAll(".origin-tab").forEach((tab) => {
  tab.addEventListener("click", () => selectOrigin(tab.dataset.origin));
});
originParam.addEventListener("input", drawOrigin);

// ============================================================
// 5. 04 节：同类节奏家族实时变形对比
// ============================================================
const FAMILY_NOTES = {
  "107": "107 重复原则：9 枚元素尺寸与间距完全一致（变化量 0%），传达稳固与平等，但没有单向推进的起点和终点。",
  "110": "110 渐变组织：取消离散的独立拍点，用连续平滑的过渡带连接两端，看的是「连绵」而不是「步进」。",
  "111": "111 交替节奏：在大小或明暗两态之间 A–B–A–B 往复切换，脉搏稳健但能量原地来回摆动。",
  "112": "112 渐进节奏（本页）：可数的离散节拍按同一方向逐级增强（a<sub>1</sub> &lt; a<sub>2</sub> &lt; … &lt; a<sub>n</sub>），既保留清晰的拍点，又把全部势能汇向末端焦点。",
  "113": "113 流动节奏：元素沿弯曲波轨蜿蜒游走，靠路径曲率牵引视线起伏，不强求尺度单向递增。",
  "114": "114 随机节奏：刻意打散大小、高低与间距的规律，用不可预测的疏密落点营造自由张力。",
};

const svgFamily = document.getElementById("svg-family");
const familyNote = document.getElementById("family-note");

function drawFamily(key) {
  svgFamily.innerHTML = "";
  const n = 9;
  const xs = Array.from({ length: n }, (_, i) => 66 + (748 * i) / (n - 1));

  if (key === "110") {
    // 连续渐变条，对比离散节拍
    const defs = svgEl("defs");
    const grad = svgEl("linearGradient", { id: "fam-grad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
    grad.append(svgEl("stop", { offset: "0%", "stop-color": "#0033BC" }));
    grad.append(svgEl("stop", { offset: "45%", "stop-color": PALETTE.cream }));
    grad.append(svgEl("stop", { offset: "100%", "stop-color": PALETTE.gold }));
    defs.append(grad);
    svgFamily.append(defs);
    svgFamily.append(svgEl("rect", { x: 48, y: 34, width: 784, height: 60, fill: "url(#fam-grad)" }));
    svgFamily.append(svgEl("text", { x: 440, y: 112, "text-anchor": "middle", fill: PALETTE.cream, "font-size": 12, "font-family": "IBM Plex Mono, monospace" }, "CONTINUOUS TRANSITION · 无离散拍点"));
  } else if (key === "113") {
    // 流动曲线波轨
    svgFamily.append(svgEl("path", {
      d: "M 48 64 C 160 14, 290 114, 440 64 C 590 14, 720 114, 832 64",
      fill: "none", stroke: "rgba(248,247,241,0.5)", "stroke-width": 2, "stroke-dasharray": "5 4",
    }));
    xs.forEach((x, i) => {
      const y = 64 - Math.sin((i / (n - 1)) * Math.PI * 2) * 30;
      svgFamily.append(svgEl("circle", { cx: x, cy: y.toFixed(1), r: 14, fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold }));
    });
  } else if (key === "114") {
    // 随机节奏（固定可复现的伪随机打散，避免闪烁）
    const rx = [68, 128, 254, 308, 438, 566, 610, 720, 816];
    const ry = [76, 42, 84, 44, 62, 86, 38, 68, 50];
    const rr = [18, 9, 24, 12, 7, 20, 14, 28, 10];
    for (let i = 0; i < n; i++) {
      svgFamily.append(svgEl("circle", { cx: rx[i], cy: ry[i], r: rr[i], fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold }));
    }
  } else if (key === "107") {
    xs.forEach((x) => {
      svgFamily.append(svgEl("circle", { cx: x, cy: 64, r: 18, fill: PALETTE.cream }));
    });
  } else if (key === "111") {
    xs.forEach((x, i) => {
      const isA = i % 2 === 0;
      svgFamily.append(svgEl("circle", { cx: x, cy: 64, r: isA ? 24 : 11, fill: isA ? PALETTE.gold : PALETTE.cream }));
    });
  } else {
    // 112 渐进节奏：等比放大 + 间距递增 + 导向箭
    const vals = computeBaseSeries(n, 5.8, "geometric");
    const radii = vals.map((v) => 6.5 + ((v - 1) / 4.8) * 28);
    const weights = vals.slice(0, -1).map((v) => 0.45 + (v / 5.8) * 1.4);
    const sumW = weights.reduce((a, b) => a + b, 0);
    let x = 58;
    for (let i = 0; i < n; i++) {
      svgFamily.append(svgEl("circle", { cx: x.toFixed(1), cy: 56, r: radii[i].toFixed(1), fill: i % 2 === 0 ? PALETTE.cream : PALETTE.gold }));
      if (i < weights.length) x += (weights[i] / sumW) * 748;
    }
    svgFamily.append(svgEl("path", { d: "M 54 106 L 818 106 M 808 99 L 818 106 L 808 113", fill: "none", stroke: PALETTE.white, "stroke-width": 1.8 }));
  }

  familyNote.innerHTML = `<strong>${FAMILY_NOTES[key].split("：")[0]}</strong>：${FAMILY_NOTES[key].split("：")[1]}`;
}

document.querySelectorAll(".fam-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".fam-pill").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    drawFamily(btn.dataset.fam);
  });
});

// ============================================================
// 6. 05 节：真实落版小样（3 场景 × 3 倍率）
// ============================================================
const appStage = document.getElementById("app-stage");
const appVerdict = document.getElementById("app-verdict");
let currentAppScene = "type";
let currentAppRatio = "good";

const APP_COPY = {
  type: {
    flat: "平权 1.00×：图注、正文、导语和大标几乎同号，版面像一段纯文本，找不到阅读入口。",
    good: "稳健 1.28×（经验参考带）：每级清晰递进，视线被自然领进大标，再落回导语与正文。",
    wild: "失控 1.65×：大标膨胀压垮版心，图注被迫缩到 10.5px 边缘，小字可读性受损。",
  },
  pricing: {
    flat: "平权 1.00×：三张套餐卡体积与色量一致，用户要逐字读完才分得出推荐项。",
    good: "稳健 1.28×：入门、标准到工作室推荐逐级加高并转向钴蓝高对比，推举感清晰又不显得强迫。",
    wild: "失控 1.65×：左侧入门卡被压成边角料，右侧卡片夸张膨胀，反而让页面失去可信度。",
  },
  poster: {
    flat: "平权 1.00×：五场日程的进度条一样长粗，看不出哪一场是当晚的高潮压轴。",
    good: "稳健 1.28×：条长、条粗逐级爬坡，读者一秒就能顺着时间线滑到 21:15 闭幕大展。",
    wild: "失控 1.65×：前两场细到像漏印的杂线，末行厚条霸占近半高度，整体节奏断裂。",
  },
};

function updateAppStage() {
  appStage.dataset.scene = currentAppScene;
  appStage.dataset.ratio = currentAppRatio;
  document.querySelectorAll(".mockup-pane").forEach((p) => {
    p.classList.toggle("is-visible", p.id === `mock-${currentAppScene}`);
  });
  appVerdict.textContent = APP_COPY[currentAppScene][currentAppRatio];
}

document.querySelectorAll("[data-app]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAppScene = btn.dataset.app;
    document.querySelectorAll("[data-app]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateAppStage();
  });
});

document.querySelectorAll("[data-appratio]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAppRatio = btn.dataset.appratio;
    document.querySelectorAll("[data-appratio]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateAppStage();
  });
});

// ============================================================
// 7. 06 节：什么时候别用渐进节奏（四场景对照）
// ============================================================
const AVOID_CASES = {
  table: {
    badHtml: `
      <div class="ad-row" style="font-size:11px;padding:3px 8px"><span>成都</span><span>21°C</span></div>
      <div class="ad-row" style="font-size:13.5px;padding:6px 10px"><span>武汉</span><span>22°C</span></div>
      <div class="ad-row" style="font-size:17px;padding:9px 10px"><span>杭州</span><span>21°C</span></div>
      <div class="ad-row" style="font-size:22px;padding:12px 10px;color:#FEC613;font-weight:800"><span>青岛</span><span>20°C</span></div>`,
    badDesc: "四座城市气温几乎相等，把字号和行高越排越大，读者会误以为青岛更热或排名第一——视觉递进伪造了不存在的权重。",
    goodHtml: `
      <div class="ad-row"><span>成都</span><span>21°C</span></div>
      <div class="ad-row is-hi"><span>武汉</span><span>22°C（当日最高）</span></div>
      <div class="ad-row"><span>杭州</span><span>21°C</span></div>
      <div class="ad-row"><span>青岛</span><span>20°C</span></div>`,
    goodDesc: "平权数据应采用等高等字号的中性重复列表，只在真实需要提示的数据项上做单点标记。",
  },
  article: {
    badHtml: `
      <p style="margin:0;font-size:11.5px;line-height:1.3;color:#F6E8CD">第一段：清晨六点，老印刷厂的卷筒纸刚装上机器。</p>
      <p style="margin:0;font-size:15px;line-height:1.5;color:#F8F7F1">第二段：油墨气味混着潮湿的空气在厂房里散开。</p>
      <p style="margin:0;font-size:19.5px;line-height:1.65;color:#FEC613;font-weight:700">第三段：工人把第一张校样铺在看样台下核对套准。</p>`,
    badDesc: "长文正文追求平稳的阅读流。字号与行距逐段放大，每换一段眼睛就要重新对焦，读不到半页就会头晕。",
    goodHtml: `
      <p style="margin:0;font-size:14px;line-height:1.65;color:#F8F7F1">第一段：清晨六点，老印刷厂的卷筒纸刚装上机器。</p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#F8F7F1">第二段：油墨气味混着潮湿的空气在厂房里散开。</p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#F8F7F1">第三段：工人把第一张校样铺在看样台下核对套准。</p>`,
    goodDesc: "渐进只用在「正文 → 小标 → 主标」的层级跳转上；同属正文内部的连续段落务必保持恒定字号与行距。",
  },
  few: {
    badHtml: `
      <div class="ad-bar-strip">
        <div style="width:28px;height:26px;background:#F6E8CD"></div>
        <div style="width:82px;height:78px;background:#FEC613"></div>
      </div>`,
    badDesc: "只有 2 块图形时，人眼看到的只是「大小对比」，根本归纳不出第三拍会怎么变，强行套用渐进理论只是贴标签。",
    goodHtml: `
      <div class="ad-bar-strip">
        <div style="width:14px;height:18px;background:#F6E8CD"></div>
        <div style="width:20px;height:27px;background:#FEC613"></div>
        <div style="width:28px;height:39px;background:#F6E8CD"></div>
        <div style="width:38px;height:56px;background:#FEC613"></div>
        <div style="width:52px;height:78px;background:#F6E8CD"></div>
      </div>`,
    goodDesc: "元素少于 4 个时直接按主次对比构图；需要节奏推进时，给足 5 拍以上再展开渐进序列。",
  },
  nav: {
    badHtml: `
      <div class="ad-nav-strip">
        <span class="ad-chip" style="font-size:11px;padding:3px 6px">文件</span>
        <span class="ad-chip" style="font-size:13px;padding:5px 8px">编辑</span>
        <span class="ad-chip" style="font-size:16px;padding:7px 11px">视图</span>
        <span class="ad-chip" style="font-size:20px;padding:9px 14px;background:#FEC613;color:#0A1638">帮助</span>
      </div>`,
    badDesc: "顶栏高频菜单需要平等的随机点选。把「帮助」一路放大成终点焦点，反而喧宾夺主、拖慢常用操作。",
    goodHtml: `
      <div class="ad-nav-strip">
        <span class="ad-chip" style="font-size:13.5px">文件</span>
        <span class="ad-chip" style="font-size:13.5px">编辑</span>
        <span class="ad-chip" style="font-size:13.5px">视图</span>
        <span class="ad-chip" style="font-size:13.5px">帮助</span>
      </div>`,
    goodDesc: "同级导航项保持一致尺寸和字重，只在有明确「主行动按钮」的独立位置给单一强调。",
  },
};

function renderAvoid(key) {
  const c = AVOID_CASES[key];
  document.getElementById("avoid-bad-demo").innerHTML = c.badHtml;
  document.getElementById("avoid-bad-desc").textContent = c.badDesc;
  document.getElementById("avoid-good-demo").innerHTML = c.goodHtml;
  document.getElementById("avoid-good-desc").textContent = c.goodDesc;
}

document.querySelectorAll(".avoid-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".avoid-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderAvoid(btn.dataset.avoid);
  });
});

// ============================================================
// 8. 07 节：四选一单一变量视觉测验
// ============================================================
const QUIZ_CONFIGS = {
  // A: 等差（首尾相同，但尾三柱增幅跌破 12%，失去推进）
  A: {
    heights: [22, 37, 52, 67, 82, 97, 112, 127],
    gaps: [6, 7, 8.5, 10, 12, 14, 16.5],
    widths: [10, 12, 14.5, 17, 20, 23, 27, 32],
    note: "A 等差尾熄：+68% → +13%",
    issueBar: 6,
  },
  // B: 等比 1.28× 但第 6 柱轻微回跌 13%（隐蔽单拍破序！）
  B: {
    heights: [22, 28, 36, 46, 59, 51, 98, 126],
    gaps: [6, 7, 8.5, 10, 12, 14, 16.5],
    widths: [10, 12, 14.5, 17, 20, 23, 27, 32],
    note: "B 第 6 柱回跌 -14%",
    issueBar: 5,
  },
  // C: 正解！等比 1.28×，柱高、柱宽、间距严格同向单调协同
  C: {
    heights: [22, 28, 36, 46, 59, 76, 98, 126],
    gaps: [6, 7, 8.5, 10, 12, 14, 16.5],
    widths: [10, 12, 14.5, 17, 20, 23, 27, 32],
    note: "C 等比 +28% · 同向协同",
    issueBar: -1,
  },
  // D: 柱高按等比 1.28× 增长，但横向间距反向收紧（大柱挤撞成墙）
  D: {
    heights: [22, 28, 36, 46, 59, 76, 98, 126],
    gaps: [22, 17, 13, 9.5, 6.5, 3.5, 1.5],
    widths: [10, 12, 14.5, 17, 20, 23, 27, 32],
    note: "D 柱增距缩 · 终点挤墙",
    issueBar: 7,
  },
};

const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    title: "选了方案 A：这是「等差平加」，后三柱已经明显发平",
    body: "方案 A 每柱固定增加 15px：第 1→2 柱暴涨 +68%，但第 6→7→8 柱只剩 +15%、+13%，顶部斜线变成一条死直斜坡，靠近终点前动势先熄火了。正确答案是方案 C（每柱等比递增约 +28%，且间距与柱宽同步打开）。",
  },
  B: {
    ok: false,
    title: "选了方案 B：暗藏一处「第 6 柱微跌」",
    body: "方案 B 的前五柱和最后两柱都按等比推进，唯独第 6 柱比第 5 柱矮了 14%，制造了轻微踩空。眼睛扫过那道凹口时，刚刚建立的加速预期立刻断拍。正确答案是严格单调的方案 C。",
  },
  C: {
    ok: true,
    title: "选对了！方案 C 把等比递增、严格单调与双维协同全做稳了",
    body: "方案 C 的 8 根柱高稳定按约 1.28×（+28%）攀升，从起拍到尾拍都维持着均匀的心理加速；同时柱宽与间距也同向放大，没有逆序踩空，也没有把终点挤成一堵闷墙。",
  },
  D: {
    ok: false,
    title: "选了方案 D：高度向右递增，间距却向右反向收紧",
    body: "方案 D 的 8 根柱高其实与方案 C 一模一样，但柱间空隙从左到右越缩越紧（22px 缩到 1.5px），大柱在终点挤成一团，两条维度互相打架。正确答案是高度与间距同向舒展的方案 C。",
  },
};

function drawQuizPlate(key, revealed = false) {
  const svg = document.getElementById(`quiz-svg-${key}`);
  const cfg = QUIZ_CONFIGS[key];
  svg.innerHTML = "";
  const baseY = 148;
  const totalW = cfg.widths.reduce((a, b) => a + b, 0) + cfg.gaps.reduce((a, b) => a + b, 0);
  const scale = Math.min(1, 286 / totalW);
  let x = (320 - totalW * scale) / 2;

  const pts = [];
  for (let i = 0; i < cfg.heights.length; i++) {
    const bw = cfg.widths[i] * scale;
    const bh = cfg.heights[i];
    const y = baseY - bh;
    const isFault = revealed && cfg.issueBar === i;
    svg.append(svgEl("rect", {
      x: x.toFixed(1),
      y: y.toFixed(1),
      width: bw.toFixed(1),
      height: bh.toFixed(1),
      fill: isFault ? PALETTE.coralFill : i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
      stroke: isFault ? PALETTE.coralDark : "none",
      "stroke-width": isFault ? 2 : 0,
    }));
    pts.push(`${(x + bw / 2).toFixed(1)},${(y - 4).toFixed(1)}`);
    if (i < cfg.gaps.length) x += bw + cfg.gaps[i] * scale;
  }

  if (revealed) {
    svg.append(svgEl("polyline", {
      points: pts.join(" "),
      fill: "none",
      stroke: key === "C" ? PALETTE.mintDark : PALETTE.coralDark,
      "stroke-width": 2,
      "stroke-dasharray": key === "C" ? "none" : "4 3",
    }));
    svg.append(svgEl("rect", { x: 8, y: 8, width: 186, height: 22, fill: PALETTE.cobaltDeep }));
    svg.append(svgEl("text", {
      x: 16, y: 23,
      fill: key === "C" ? PALETTE.mintDark : PALETTE.coralDark,
      "font-size": 11,
      "font-weight": 700,
      "font-family": "Noto Sans SC, sans-serif",
    }, cfg.note));
  }
}

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const choice = card.dataset.choice;
    const exp = QUIZ_EXPLAIN[choice];
    ["A", "B", "C", "D"].forEach((k) => drawQuizPlate(k, true));
    document.querySelectorAll(".quiz-card").forEach((c) => {
      const k = c.dataset.choice;
      c.setAttribute("aria-pressed", String(k === choice));
      c.classList.toggle("is-correct", k === "C");
      c.classList.toggle("is-picked", k === choice && k !== "C");
    });
    const box = document.getElementById("quiz-verdict");
    box.classList.toggle("is-ok", exp.ok);
    box.classList.toggle("is-warn", !exp.ok);
    document.getElementById("qv-title").textContent = exp.title;
    document.getElementById("qv-body").textContent = exp.body;
  });
});

// ============================================================
// 9. 08 节：原海报放大拖拽灯箱（只引用一次 poster.webp）
// ============================================================
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbScaleEl = document.getElementById("lb-scale");
const posterImg = document.getElementById("poster");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.75, 3.2);
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.75, 3.2);
  if (lbScale <= 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbStage.setPointerCapture(e.pointerId);
  lbStage.classList.add("is-dragging");
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ============================================================
// 10. 初始化与视口响应
// ============================================================
function initAll() {
  resizeHeroCanvas();
  refreshHero();
  drawLeverCards("steady");
  updateWeberLab();
  selectOrigin("fechner");
  drawFamily("112");
  updateAppStage();
  renderAvoid("table");
  ["A", "B", "C", "D"].forEach((k) => drawQuizPlate(k, false));
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeHeroCanvas();
    refreshHero();
    drawOrigin();
  }, 60);
});

initAll();
