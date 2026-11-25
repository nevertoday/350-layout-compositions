import { loop, pixelRatio } from "../../lib/stage.js";
import {
  FRAME_PAD,
  MAX_FRAME_W,
  MAX_SINGLE_W,
  MIN_COL_W,
  MIN_FRAME_W,
  BROKEN_ORDER,
  LEAD_ORDER,
  createBrokenState,
  createSolutionState,
  evaluate,
  frameWToNorm,
} from "./model.js";

// ---------- 工具与图标 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ICONS = {
  kpi: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="4" fill="#A7AC9B"/><rect x="11" y="28" width="6" height="10" rx="1" fill="#FEFEFE"/><rect x="21" y="21" width="6" height="17" rx="1" fill="#FEFEFE"/><rect x="31" y="13" width="6" height="25" rx="1" fill="#FEFEFE"/></svg>`,
  profile: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#A7AC9B"/><circle cx="24" cy="18" r="6.5" fill="#FEFEFE"/><path d="M12 38C13.5 29.8 18 26.5 24 26.5C30 26.5 34.5 29.8 36 38Z" fill="#FEFEFE"/></svg>`,
  summary: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="4" fill="#A7AC9B"/><rect x="13" y="10" width="22" height="28" rx="2" fill="none" stroke="#FEFEFE" stroke-width="2"/><path d="M18 17H30M18 23H30M18 29H26" stroke="#FEFEFE" stroke-width="2" stroke-linecap="round"/></svg>`,
};

// ---------- 开场主角玩具状态 ----------
let state = createBrokenState();
let lastEval = evaluate(state);
let revealT = 0; // 开场扫描线轻缓落位（0.72 秒完成，减少动效直接为 1）
let needsCanvasDraw = true;
let currentScale = 1;
let currentOriginX = 0;
let currentFrameTop = 28;

const heroEl = $(".hero");
const topPill = $("#top-pill");
const caliperEl = $("#caliper");
const calFill = $("#cal-fill");
const calThumb = $("#cal-thumb");
const caliperVal = $("#caliper-val");
const viewportEl = $("#page-viewport");
const xrayCanvas = $("#xray-canvas");
const liveFrame = $("#live-frame");
const liveCards = $("#live-cards");
const chromeDim = $("#chrome-dim");
const frameGrip = $("#frame-grip");

const diagCard = $("#diag-card");
const diagBadge = $("#diag-badge");
const diagTitle = $("#diag-title");
const diagWhy = $("#diag-why");
const diagAct = $("#diag-act");
const mColw = $("#m-colw");
const mDrift = $("#m-drift");
const mStyle = $("#m-style");
const mReuse = $("#m-reuse");

const btnXray = $("#btn-xray");
const btnSolve = $("#btn-solve");
const btnReset = $("#btn-reset");
const btnDec = $("#btn-dec");
const btnInc = $("#btn-inc");
const countVal = $("#count-val");

function cardHTML(card, ev) {
  const m = card.meta;
  const isFirst = card.index === 0;
  const warnSlot = isFirst && !ev.orderOk;
  const divergent = state.reuseMode === "divergent" && (card.id === "kpiB" || card.id === "kpiC");
  const cramped = ev.diag.code === "narrow_cramp";
  const classes = [
    "m-card",
    isFirst ? "is-first" : "",
    warnSlot ? "is-warn-slot" : "",
    divergent ? "is-divergent" : "",
    cramped ? "is-cramped" : "",
  ].filter(Boolean).join(" ");

  let inner = "";
  if (m.kind === "kpi") {
    inner = `
      <span class="m-ico">${ICONS.kpi}</span>
      <span class="m-body">
        <span class="m-title">${m.badge}</span>
        <span class="m-sub">${m.desc}</span>
        <span class="m-kpi"><strong>${m.value}</strong><span class="m-trend">${m.trend}</span></span>
        <span class="m-note">${m.note}</span>
      </span>`;
  } else if (m.kind === "profile") {
    inner = `
      <span class="m-ico">${ICONS.profile}</span>
      <span class="m-body">
        <span class="m-title">${m.badge}</span>
        <span class="m-sub">${m.desc}</span>
        <span class="m-person">${m.name} <span>| ${m.title}</span></span>
        <span class="m-note">${m.bio}</span>
      </span>`;
  } else {
    inner = `
      <span class="m-ico">${ICONS.summary}</span>
      <span class="m-body">
        <span class="m-title">${m.badge}</span>
        <span class="m-sub">${m.desc}</span>
        <span class="m-note">${m.body}</span>
      </span>`;
  }

  return `<button type="button" class="${classes}" data-id="${card.id}" data-idx="${card.index}" title="点击将「${m.label}」提至首槽">${inner}</button>`;
}

function layoutCardsDOM(ev) {
  liveFrame.dataset.grid = state.gridMode;
  liveFrame.dataset.style = state.styleMode;
  liveFrame.dataset.reuse = state.reuseMode;
  liveFrame.style.width = `${ev.frameW}px`;
  chromeDim.textContent = `${ev.frameW}px · ${ev.count} 模块 · ${ev.cols} 列`;

  // 渲染或更新卡片列表
  const sig = `${ev.activeIds.join(",")}|${state.reuseMode}|${ev.orderOk}|${ev.diag.code === "narrow_cramp"}`;
  if (liveCards.dataset.sig !== sig) {
    liveCards.innerHTML = ev.cards.map((c) => cardHTML(c, ev)).join("");
    liveCards.dataset.sig = sig;
  }

  // 根据 gridMode 设置真实流式网格或散乱错位偏移
  if (state.gridMode === "free") {
    liveCards.style.display = "grid";
    liveCards.style.gridTemplateColumns = "1fr 1fr";
    liveCards.style.gap = `${ev.gapPx}px`;
    const btns = $$(".m-card", liveCards);
    btns.forEach((btn, i) => {
      const c = ev.cards[i];
      if (!c) return;
      const baseLeft = i % 2 === 1 ? FRAME_PAD + ev.baseColW + ev.gapPx : FRAME_PAD;
      const dx = c.x - baseLeft;
      btn.style.gridColumn = "auto";
      btn.style.transform = `translate(${dx}px, ${c.yNudge}px)`;
      btn.style.width = `${c.w}px`;
      btn.style.maxWidth = "100%";
    });
  } else {
    liveCards.style.display = "grid";
    liveCards.style.gridTemplateColumns = `repeat(${ev.cols}, minmax(0, 1fr))`;
    liveCards.style.gap = `${ev.gapPx}px`;
    const btns = $$(".m-card", liveCards);
    btns.forEach((btn, i) => {
      const c = ev.cards[i];
      btn.style.transform = "";
      btn.style.width = "100%";
      btn.style.maxWidth = "";
      btn.style.gridColumn = c && c.span > 1 ? `span ${c.span}` : "auto";
    });
  }

  // 按视口可用宽度等比缩放活体框（窄屏平滑缩放零溢出，超宽屏适度放大饱满呈现）
  const isMobileP = window.innerWidth <= 640;
  const isMobileL = window.innerHeight <= 460 && window.innerWidth >= 640;
  const sidePad = isMobileP ? 16 : isMobileL ? 16 : 64;
  const availW = Math.max(220, viewportEl.clientWidth - sidePad);
  const maxScale = availW > 960 ? 1.18 : 1;
  currentScale = Math.min(maxScale, availW / ev.frameW);
  const padTop = isMobileL ? 20 : isMobileP ? 24 : 28;
  currentFrameTop = padTop;
  liveFrame.style.top = `${padTop}px`;
  liveFrame.style.transform = `translateX(-50%) scale(${currentScale.toFixed(4)})`;
  const naturalH = liveFrame.offsetHeight || 320;
  const scaledH = Math.ceil(naturalH * currentScale);
  const minH = isMobileL ? 186 : isMobileP ? 236 : 380;
  const targetH = Math.max(minH, scaledH + padTop + (isMobileL ? 10 : 16));
  viewportEl.style.height = `${targetH}px`;
  currentOriginX = (viewportEl.clientWidth - ev.frameW * currentScale) / 2;
}

function updateUI() {
  const ev = evaluate(state);
  lastEval = ev;

  heroEl.dataset.aligned = String(ev.score === 4);

  // 顶部状态胶囊
  topPill.textContent = ev.score === 4 ? "4 / 4 已成体系" : `${ev.score} / 4 待整编`;
  topPill.classList.toggle("is-ok", ev.score === 4);
  topPill.classList.toggle("is-err", ev.score < 4);

  // 视口宽度卡尺同步
  const pct = (state.widthNorm * 100).toFixed(2);
  calFill.style.width = `${pct}%`;
  const thumbPct = Math.max(11, Math.min(89, state.widthNorm * 100));
  calThumb.style.left = `${thumbPct.toFixed(2)}%`;
  calThumb.firstElementChild.textContent = `↔ ${ev.frameW}px`;
  caliperEl.setAttribute("aria-valuenow", String(ev.frameW));
  const modeZh = { free: "散乱错轴", single: "单列", two: "双列", grid3: "3列网格", responsive: `自适 ${ev.cols}列` }[state.gridMode];
  caliperVal.textContent = `${ev.frameW}px · ${modeZh} · 单列 ${ev.minColW}px`;
  caliperVal.classList.toggle("is-ok", ev.gridOk);
  caliperEl.classList.toggle("is-ok", ev.gridOk);
  caliperEl.classList.toggle("is-err", !ev.gridOk);

  // 诊单读数同步（单真源）
  diagCard.classList.toggle("is-ok", ev.diag.pass);
  diagCard.classList.toggle("is-err", !ev.diag.pass);
  diagBadge.textContent = ev.diag.badge;
  diagTitle.textContent = ev.diag.headline;
  diagWhy.textContent = ev.diag.why;
  diagAct.textContent = ev.diag.action;
  mColw.textContent = `${ev.minColW}px`;
  mDrift.textContent = ev.maxDriftPx > 0 ? `${ev.maxDriftPx}px` : "0px 齐轴";
  mStyle.textContent = state.styleMode === "mixed" ? "3 套混用" : state.styleMode === "flat" ? "1 套抹平" : "1 套统一";
  mReuse.textContent = `${ev.reusePct}%`;

  // 控件激活态同步
  $$("[data-grid]").forEach((b) => {
    const on = b.dataset.grid === state.gridMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-grid-pick]").forEach((b) => {
    const on = b.dataset.gridPick === state.gridMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-style]").forEach((b) => {
    const on = b.dataset.style === state.styleMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-reuse]").forEach((b) => {
    const on = b.dataset.reuse === state.reuseMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-order]").forEach((b) => {
    const on = b.dataset.order === state.orderMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-gap]").forEach((b) => {
    const on = Number(b.dataset.gap) === state.gapPx;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });

  btnXray.classList.toggle("is-on", state.xray);
  btnXray.setAttribute("aria-pressed", String(state.xray));
  btnXray.textContent = state.xray ? "网格透视：开" : "网格透视：关";

  countVal.textContent = `${ev.count} 卡`;
  btnDec.disabled = ev.count <= 3;
  btnInc.disabled = ev.count >= 6;

  // 六原则实时状态条
  for (const [k, info] of Object.entries(ev.principles)) {
    const row = $(`.p6-item[data-p="${k}"]`);
    if (!row) continue;
    row.classList.toggle("is-ok", info.ok);
    $(".p6-st", row).textContent = info.tag;
  }

  layoutCardsDOM(ev);
  needsCanvasDraw = true;
}

// ---------- 2D Canvas 网格透视与偏差测绘层 ----------
const ctx = xrayCanvas.getContext("2d");

function drawXray(progress) {
  const w = viewportEl.clientWidth;
  const h = viewportEl.clientHeight;
  if (!w || !h) return;
  const dpr = pixelRatio(2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (xrayCanvas.width !== bw || xrayCanvas.height !== bh) {
    xrayCanvas.width = bw;
    xrayCanvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const ev = lastEval;
  const ox = currentOriginX;
  const fw = ev.frameW * currentScale;
  const fy = currentFrameTop;
  const fh = (liveFrame.offsetHeight || 280) * currentScale;
  const p = Math.max(0, Math.min(1, progress));

  // 顶沿实时页面宽度标尺（始终绘制，让用户直观看见当前模拟页宽）
  const rulerY = fy - 12;
  const isBadW = ev.diag.code === "narrow_cramp" || ev.diag.code === "wide_stretch";
  const rulerCol = isBadW ? "#B13B27" : ev.gridOk ? "#28593D" : "#4A563E";
  ctx.strokeStyle = rulerCol;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(ox, rulerY - 4);
  ctx.lineTo(ox, rulerY + 4);
  ctx.moveTo(ox + fw, rulerY - 4);
  ctx.lineTo(ox + fw, rulerY + 4);
  ctx.moveTo(ox, rulerY);
  ctx.lineTo(ox + fw * p, rulerY);
  ctx.stroke();

  const label = isBadW
    ? (ev.diag.code === "narrow_cramp" ? `${ev.frameW}px · 单列 ${ev.minColW}px < ${MIN_COL_W}px` : `${ev.frameW}px · 单列 > ${MAX_SINGLE_W}px`)
    : `${ev.frameW}px · ${ev.cols}列 × ${ev.baseColW}px`;
  ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
  const tw = ctx.measureText(label).width;
  const bx = ox + fw / 2 - tw / 2 - 7;
  ctx.fillStyle = isBadW ? "#FDF1EE" : "#F7F6F2";
  ctx.fillRect(bx, rulerY - 9, tw + 14, 17);
  ctx.strokeStyle = rulerCol;
  ctx.strokeRect(bx, rulerY - 9, tw + 14, 17);
  ctx.fillStyle = rulerCol;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, ox + fw / 2, rulerY);

  if (!state.xray) return;

  // 列轨虚线与安全带
  const padS = FRAME_PAD * currentScale;
  const gapS = ev.gapPx * currentScale;
  const colS = ev.baseColW * currentScale;
  const trackTop = fy + 28 * currentScale;
  const trackH = Math.max(40, (fh - 36 * currentScale) * p);

  ctx.save();
  for (let c = 0; c < ev.cols; c++) {
    const cx = ox + padS + c * (colS + gapS);
    ctx.fillStyle = ev.gridOk ? "rgba(40, 89, 61, 0.055)" : "rgba(177, 59, 39, 0.055)";
    ctx.fillRect(cx, trackTop, colS, trackH);

    ctx.strokeStyle = ev.gridOk ? "rgba(74, 86, 62, 0.45)" : "rgba(177, 59, 39, 0.52)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, trackTop);
    ctx.lineTo(cx, trackTop + trackH);
    ctx.moveTo(cx + colS, trackTop);
    ctx.lineTo(cx + colS, trackTop + trackH);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 散乱错位时，实绘红色偏移箭头标明纵轴错开了多少像素
  if (state.gridMode === "free") {
    ctx.strokeStyle = "#B13B27";
    ctx.fillStyle = "#B13B27";
    ctx.lineWidth = 1.5;
    ev.cards.forEach((c) => {
      if (c.driftPx < 4) return;
      const idealX = ox + (c.col === 1 ? FRAME_PAD + ev.baseColW + ev.gapPx : FRAME_PAD) * currentScale;
      const realX = ox + c.x * currentScale;
      const midY = trackTop + (c.row * 108 + 46) * currentScale;
      if (midY > fy + fh - 12) return;
      ctx.beginPath();
      ctx.moveTo(idealX, midY);
      ctx.lineTo(realX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(realX, midY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 尾行缺口虚线提示（扩展断尾错态）
  if (ev.orphanSlots > 0) {
    const totalUsed = ev.cards.reduce((a, c) => a + c.span, 0);
    const startCol = totalUsed % ev.cols;
    const rowY = fy + fh - 86 * currentScale;
    ctx.strokeStyle = "#B13B27";
    ctx.fillStyle = "rgba(227, 113, 92, 0.14)";
    ctx.setLineDash([5, 4]);
    for (let k = startCol; k < ev.cols; k++) {
      const ex = ox + padS + k * (colS + gapS);
      ctx.fillRect(ex, rowY, colS, 68 * currentScale);
      ctx.strokeRect(ex, rowY, colS, 68 * currentScale);
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "#B13B27";
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    const midEmpty = ox + padS + (startCol + (ev.cols - startCol) / 2) * (colS + gapS) - gapS / 2;
    ctx.fillText(`尾行悬空 ${ev.orphanSlots} 格`, midEmpty, rowY + 34 * currentScale);
  }
  ctx.restore();
}

const heroLoop = loop(viewportEl, (t, dt, { still }) => {
  if (still) {
    revealT = 1;
    drawXray(1);
    needsCanvasDraw = false;
    return;
  }
  if (revealT < 1) {
    revealT = Math.min(1, revealT + Math.max(dt, 0.016) / 0.72);
    const eased = 1 - (1 - revealT) ** 3;
    drawXray(eased);
    if (revealT >= 1) needsCanvasDraw = false;
  } else if (needsCanvasDraw) {
    drawXray(1);
    needsCanvasDraw = false;
  }
});

// ---------- 视口卡尺与右侧手柄拖拽（支持鼠标、触屏、perf.mjs 60Hz touchmove、键盘） ----------
function setWidthFromClientX(clientX, trackRect) {
  const norm = Math.max(0, Math.min(1, (clientX - trackRect.left) / Math.max(1, trackRect.width)));
  state.widthNorm = norm;
  updateUI();
  heroLoop.draw();
}

let draggingCaliper = false;
caliperEl.addEventListener("pointerdown", (e) => {
  draggingCaliper = true;
  if (caliperEl.setPointerCapture) {
    try { caliperEl.setPointerCapture(e.pointerId); } catch {}
  }
  setWidthFromClientX(e.clientX, caliperEl.getBoundingClientRect());
});
caliperEl.addEventListener("pointermove", (e) => {
  if (!draggingCaliper) return;
  setWidthFromClientX(e.clientX, caliperEl.getBoundingClientRect());
});
caliperEl.addEventListener("pointerup", () => { draggingCaliper = false; });
caliperEl.addEventListener("pointercancel", () => { draggingCaliper = false; });

// 兼容 perf.mjs 直接派发 CDP touchEvent（touchstart/touchmove）
caliperEl.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  draggingCaliper = true;
  setWidthFromClientX(e.touches[0].clientX, caliperEl.getBoundingClientRect());
}, { passive: true });
caliperEl.addEventListener("touchmove", (e) => {
  if (!draggingCaliper || !e.touches.length) return;
  setWidthFromClientX(e.touches[0].clientX, caliperEl.getBoundingClientRect());
}, { passive: true });
caliperEl.addEventListener("touchend", () => { draggingCaliper = false; }, { passive: true });

caliperEl.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 40 : 16;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.widthNorm = frameWToNorm(lastEval.frameW - step);
    updateUI();
    heroLoop.draw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.widthNorm = frameWToNorm(lastEval.frameW + step);
    updateUI();
    heroLoop.draw();
  }
});

// 画框右侧拉柄直接调宽
let gripDrag = null;
frameGrip.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  gripDrag = { startX: e.clientX, startW: lastEval.frameW };
  try { frameGrip.setPointerCapture(e.pointerId); } catch {}
});
frameGrip.addEventListener("pointermove", (e) => {
  if (!gripDrag) return;
  const dx = (e.clientX - gripDrag.startX) / Math.max(0.4, currentScale);
  state.widthNorm = frameWToNorm(gripDrag.startW + dx * 2);
  updateUI();
  heroLoop.draw();
});
frameGrip.addEventListener("pointerup", () => { gripDrag = null; });
frameGrip.addEventListener("pointercancel", () => { gripDrag = null; });

// ---------- 控件绑定 ----------
$$("[data-grid]").forEach((btn) => btn.addEventListener("click", () => {
  state.gridMode = btn.dataset.grid;
  updateUI();
  heroLoop.draw();
}));
$$("[data-grid-pick]").forEach((btn) => btn.addEventListener("click", () => {
  state.gridMode = btn.dataset.gridPick;
  updateUI();
  heroLoop.draw();
}));
$$("[data-style]").forEach((btn) => btn.addEventListener("click", () => {
  state.styleMode = btn.dataset.style;
  updateUI();
  heroLoop.draw();
}));
$$("[data-reuse]").forEach((btn) => btn.addEventListener("click", () => {
  state.reuseMode = btn.dataset.reuse;
  updateUI();
  heroLoop.draw();
}));
$$("[data-order]").forEach((btn) => btn.addEventListener("click", () => {
  state.orderMode = btn.dataset.order;
  state.orderIds = state.orderMode === "lead" ? [...LEAD_ORDER] : [...BROKEN_ORDER];
  updateUI();
  heroLoop.draw();
}));
$$("[data-gap]").forEach((btn) => btn.addEventListener("click", () => {
  state.gapPx = Number(btn.dataset.gap);
  updateUI();
  heroLoop.draw();
}));

btnXray.addEventListener("click", () => {
  state.xray = !state.xray;
  updateUI();
  heroLoop.draw();
});
let solveCycle = 0;
const SOLVE_KINDS = ["two", "responsive", "grid3", "single"];
btnSolve.addEventListener("click", () => {
  const kind = SOLVE_KINDS[solveCycle % SOLVE_KINDS.length];
  solveCycle++;
  state = createSolutionState(kind);
  updateUI();
  heroLoop.draw();
});
btnReset.addEventListener("click", () => {
  state = createBrokenState();
  updateUI();
  heroLoop.draw();
});
btnDec.addEventListener("click", () => {
  state.count = Math.max(3, state.count - 1);
  updateUI();
  heroLoop.draw();
});
btnInc.addEventListener("click", () => {
  state.count = Math.min(6, state.count + 1);
  updateUI();
  heroLoop.draw();
});

// 点击活体模块卡：将其提至首槽，真实改变信息主次
liveCards.addEventListener("click", (e) => {
  const card = e.target.closest(".m-card");
  if (!card) return;
  const id = card.dataset.id;
  const idx = state.orderIds.indexOf(id);
  if (idx <= 0) return;
  const next = [...state.orderIds];
  [next[0], next[idx]] = [next[idx], next[0]];
  state.orderIds = next;
  state.orderMode = (id === "kpiA" || id === "kpiB" || id === "kpiC") ? "lead" : "buried";
  updateUI();
  heroLoop.draw();
});

window.addEventListener("resize", () => {
  layoutCardsDOM(lastEval);
  needsCanvasDraw = true;
  heroLoop.draw();
});

// ---------- 01 节：六原则缺失因果实验 ----------
const PRIN_DATA = {
  grid: {
    tag: "如果拿掉「网格 GRID」",
    impact: "连锁受损：有序 · 可扩展",
    desc: "哪怕每张卡片本身都画得很精致，只要没有共同的纵横对齐线和统一沟槽，读者扫过三行后就失去参考坐标，新增模块也不知道该贴哪条边。",
    svg: `<svg viewBox="0 0 340 160"><rect x="12" y="12" width="138" height="58" fill="#FAF8F4" stroke="#B13B27" stroke-width="1.5"/><rect x="174" y="24" width="122" height="54" fill="#FAF8F4" stroke="#B13B27" stroke-width="1.5"/><rect x="30" y="88" width="144" height="56" fill="#FAF8F4" stroke="#B13B27" stroke-width="1.5"/><rect x="192" y="96" width="134" height="50" fill="#FAF8F4" stroke="#B13B27" stroke-width="1.5"/><path d="M12 4V156M30 4V156M174 4V156M192 4V156" stroke="#E3715C" stroke-dasharray="4 3" stroke-width="1.2"/></svg>`,
  },
  units: {
    tag: "如果拿掉「单元 UNITS」",
    impact: "连锁受损：可复用 · 可扩展",
    desc: "当页面不分独立模块、把指标、人物和长段落焊死成一整块大版面，改一个数据就得牵动整页重排，任何零件都拆不出来给别的页面用。",
    svg: `<svg viewBox="0 0 340 160"><rect x="16" y="14" width="308" height="132" fill="#DBDDCF" stroke="#B13B27" stroke-width="1.8"/><rect x="32" y="30" width="94" height="16" fill="#616D52"/><rect x="32" y="56" width="276" height="8" fill="#919C84"/><rect x="32" y="72" width="248" height="8" fill="#919C84"/><rect x="32" y="92" width="120" height="36" fill="#616D52" opacity="0.5"/><rect x="164" y="92" width="144" height="36" fill="#616D52" opacity="0.3"/><path d="M16 14L324 146" stroke="#B13B27" stroke-dasharray="5 4" stroke-width="1.4"/></svg>`,
  },
  system: {
    tag: "如果拿掉「系统 SYSTEM」",
    impact: "连锁受损：可复用 · 有序",
    desc: "网格摆齐了，却各画各的圆角、边框和主色——三张并排的卡片像从三个陌生网站剪贴来的广告，品牌感与专业度当场瓦解。",
    svg: `<svg viewBox="0 0 340 160"><rect x="14" y="20" width="96" height="118" rx="0" fill="#F2F5FA" stroke="#2B4C7E" stroke-width="2.5"/><rect x="122" y="20" width="96" height="118" rx="22" fill="#FDF8EE" stroke="#B46B15" stroke-width="1.8" stroke-dasharray="5 3"/><rect x="230" y="20" width="96" height="118" rx="8" fill="#FAF3F8" stroke="#8A4B76" stroke-width="1.5"/><rect x="28" y="42" width="44" height="14" fill="#2B4C7E"/><circle cx="170" cy="64" r="20" fill="#B46B15"/><rect x="246" y="88" width="64" height="24" rx="12" fill="#8A4B76"/></svg>`,
  },
  repeatability: {
    tag: "如果拿掉「可复用 REPEATABILITY」",
    impact: "连锁受损：系统 · 团队效率",
    desc: "同为数据指标卡，第一张左图右数、第二张居中压字、第三张藏进小标签。读者每次扫到新卡都要重新摸索结构，阅读成本成倍上升。",
    svg: `<svg viewBox="0 0 340 160"><rect x="14" y="22" width="146" height="114" rx="3" fill="#FAF8F4" stroke="#616D52"/><rect x="26" y="42" width="38" height="38" rx="3" fill="#A7AC9B"/><rect x="74" y="46" width="68" height="14" fill="#181A17"/><rect x="74" y="68" width="46" height="8" fill="#E3715C"/><rect x="180" y="22" width="146" height="114" rx="3" fill="#FAF8F4" stroke="#B13B27" stroke-width="1.8"/><rect x="218" y="38" width="70" height="9" fill="#919C84"/><rect x="206" y="56" width="94" height="8" fill="#DBDDCF"/><rect x="212" y="92" width="82" height="24" rx="12" fill="#E3715C" opacity="0.25" stroke="#B13B27"/></svg>`,
  },
  scalability: {
    tag: "如果拿掉「可扩展 SCALABILITY」",
    impact: "连锁受损：网格 · 长期维护",
    desc: "版面按当前刚好 3 条内容写死尺寸；一旦业务多出第 4、第 5 张卡，要么把整行压扁挤爆，要么在底行拖出孤零零的悬空大洞。",
    svg: `<svg viewBox="0 0 340 160"><rect x="16" y="14" width="94" height="58" rx="3" fill="#FAF8F4" stroke="#616D52"/><rect x="123" y="14" width="94" height="58" rx="3" fill="#FAF8F4" stroke="#616D52"/><rect x="230" y="14" width="94" height="58" rx="3" fill="#FAF8F4" stroke="#616D52"/><rect x="16" y="84" width="94" height="58" rx="3" fill="#FAF8F4" stroke="#616D52"/><rect x="123" y="84" width="201" height="58" rx="3" fill="#FDF1EE" stroke="#B13B27" stroke-dasharray="5 4" stroke-width="1.5"/></svg>`,
  },
  order: {
    tag: "如果拿掉「有序 ORDER」",
    impact: "连锁受损：信息清晰度",
    desc: "网格、统一、复用全都做对了，但把所有模块压成一样大小、一样灰、把长段注解摆在核心结论上面，页面整齐得像仓库货架，却找不到入口。",
    svg: `<svg viewBox="0 0 340 160"><rect x="16" y="16" width="146" height="58" rx="3" fill="#F2F3EE" stroke="#B8BDB0"/><rect x="178" y="16" width="146" height="58" rx="3" fill="#F2F3EE" stroke="#B8BDB0"/><rect x="16" y="86" width="146" height="58" rx="3" fill="#F2F3EE" stroke="#B8BDB0"/><rect x="178" y="86" width="146" height="58" rx="3" fill="#F2F3EE" stroke="#B8BDB0"/><g fill="#A7AC9B"><rect x="28" y="34" width="110" height="7"/><rect x="28" y="48" width="92" height="7"/><rect x="190" y="34" width="110" height="7"/><rect x="190" y="48" width="92" height="7"/><rect x="28" y="104" width="110" height="7"/><rect x="28" y="118" width="92" height="7"/><rect x="190" y="104" width="110" height="7"/><rect x="190" y="118" width="92" height="7"/></g></svg>`,
  },
};

function renderPrincipleLab(key) {
  const d = PRIN_DATA[key];
  if (!d) return;
  $("#p6-lab-tag").textContent = d.tag;
  $("#p6-lab-impact").textContent = d.impact;
  $("#p6-lab-viz").innerHTML = d.svg;
  $("#p6-lab-desc").textContent = d.desc;
  $$(".p6-card").forEach((b) => {
    const on = b.dataset.prin === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
$$(".p6-card").forEach((b) => b.addEventListener("click", () => renderPrincipleLab(b.dataset.prin)));
renderPrincipleLab("grid");

// ---------- 02 节：真实内容涨缩压力器 ----------
const STRESS_COPY = {
  short: {
    kpiV: "786",
    kpiU: "↑ 3%",
    kpiN: "本月新增",
    profName: "张云策",
    profRole: "设计师",
    profBio: "负责组件规范。",
    sumB: "模块化提升阅读效率。",
  },
  std: {
    kpiV: "7,860",
    kpiU: "↑ 12.3%",
    kpiN: "较上月增长",
    profName: "张云策",
    profRole: "产品设计师",
    profBio: "专注产品体验与设计系统构建。",
    sumB: "通过模块组织内容，提升页面的可读性与信息传达效率。",
  },
  long: {
    kpiV: "1,284,760",
    kpiU: "↑ 128.4%",
    kpiN: "较去年同期跨三端累计活跃口径增长（含国际化站点）",
    profName: "张云策",
    profRole: "高级产品与设计系统架构师",
    profBio: "长期负责多产品线模块化页面规范、跨端组件库治理、设计 Token 与前端落地协同。",
    sumB: "通过清晰职责边界与弹性槽位组织复杂业务信息，即使文案长度翻倍、多语言翻译变长，整行卡片底线依然齐平，不裁字也不撞框。",
  },
};

const specGrid = $("#specimen-grid");
const stressVerdict = $("#stress-verdict");
let stressLen = "std";
let stressSlot = "flex";

function updateStress() {
  const c = STRESS_COPY[stressLen];
  specGrid.dataset.len = stressLen;
  specGrid.dataset.slot = stressSlot;
  $("#sp-kpi-v").textContent = c.kpiV;
  $("#sp-kpi-u").textContent = c.kpiU;
  $("#sp-kpi-n").textContent = c.kpiN;
  $("#sp-prof-name").textContent = c.profName;
  $("#sp-prof-role").textContent = c.profRole;
  $("#sp-prof-bio").textContent = c.profBio;
  $("#sp-sum-b").textContent = c.sumB;

  const broke = stressLen === "long" && stressSlot === "rigid";
  stressVerdict.classList.toggle("is-warn", broke);
  if (broke) {
    stressVerdict.textContent = "破版警报：真实长文案和多位数指标直接撞破了 142px 固定高度底线！把模块写死像素高度，稿件一接真数据就会出现裁字或遮挡。";
  } else if (stressLen === "long") {
    stressVerdict.textContent = "弹性槽位稳稳接住了翻倍文案：三张卡保持同一顶边、同一底边与同一图标/标题起始线，高度随最长的那张自然同伸。";
  } else if (stressLen === "short") {
    stressVerdict.textContent = "极短草稿态：即使只有几个字，图标槽、标题槽与底部基线依然维持固定占位与留白，整行不会塌成轻重悬殊的碎块。";
  } else {
    stressVerdict.textContent = "当前为原海报标准长度与弹性槽位：三张卡外框对齐、内部三层槽位保持一致的留白节奏。试着切到「真实翻倍长文案 + 写死固定高度」，看看硬尺寸盒子为什么一上线就破版。";
  }
}

$$("[data-len]").forEach((b) => b.addEventListener("click", () => {
  stressLen = b.dataset.len;
  $$("[data-len]").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); });
  updateStress();
}));
$$("[data-slot]").forEach((b) => b.addEventListener("click", () => {
  stressSlot = b.dataset.slot;
  $$("[data-slot]").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); });
  updateStress();
}));

// ---------- 03 节：五层原子拆解步进器 ----------
const ATOMIC_STAGES = [
  {
    num: "01 / 05",
    cap: "<strong>第 1 层 · 原子（Atoms）</strong>：不可再分的视觉零件——鼠尾草色板、单点珊瑚信号、14px 间距单位与数字字重。这一层守住了，后面所有页面才不会跑偏。",
    svg: `<svg viewBox="0 0 360 176"><rect x="18" y="24" width="54" height="54" rx="3" fill="#919C84"/><rect x="84" y="24" width="54" height="54" rx="3" fill="#616D52"/><circle cx="184" cy="51" r="24" fill="#E3715C"/><rect x="228" y="28" width="114" height="46" rx="3" fill="#2D332B" stroke="#596354"/><text x="285" y="56" text-anchor="middle" fill="#F4F3EE" font-family="Archivo, sans-serif" font-size="20" font-weight="800">Aa 7,860</text><rect x="18" y="102" width="324" height="46" rx="3" fill="#262B24" stroke="#434B40"/><text x="32" y="130" fill="#C7CEBC" font-family="Space Mono, monospace" font-size="11">TOKEN: gap 14px · radius 3px · accent 1</text></svg>`,
  },
  {
    num: "02 / 05",
    cap: "<strong>第 2 层 · 分子（Molecules）</strong>：把几个原子绑成一个有单一职责的小组——比如「指标数值 + 珊瑚涨跌幅」或「无五官头像圆 + 姓名职级」。",
    svg: `<svg viewBox="0 0 360 176"><rect x="20" y="34" width="150" height="104" rx="4" fill="#2D332B" stroke="#919C84"/><text x="36" y="72" fill="#F4F3EE" font-family="Archivo, sans-serif" font-size="28" font-weight="800">7,860</text><text x="118" y="72" fill="#F28B77" font-family="Space Mono, monospace" font-size="12" font-weight="700">↑12.3%</text><text x="36" y="106" fill="#C7CEBC" font-size="12">指标数值分子</text><rect x="190" y="34" width="150" height="104" rx="4" fill="#2D332B" stroke="#919C84"/><circle cx="222" cy="72" r="18" fill="#919C84"/><circle cx="222" cy="67" r="5.5" fill="#F4F3EE"/><path d="M211 84C213 77 217 75 222 75C227 75 231 77 233 84Z" fill="#F4F3EE"/><text x="250" y="69" fill="#F4F3EE" font-size="14" font-weight="700">张云策</text><text x="250" y="88" fill="#C7CEBC" font-size="11">产品设计师</text><text x="208" y="122" fill="#C7CEBC" font-size="11">身份行分子</text></svg>`,
  },
  {
    num: "03 / 05",
    cap: "<strong>第 3 层 · 组织 / 模块（Organisms）</strong>：分子组合进外框与固定槽位，长成可独立复用的完整功能模块——对应原海报右侧的三枚模块示例。",
    svg: `<svg viewBox="0 0 360 176"><rect x="26" y="20" width="308" height="136" rx="4" fill="#FAF8F4" stroke="#919C84" stroke-width="1.5"/><rect x="44" y="42" width="66" height="66" rx="4" fill="#A7AC9B"/><rect x="57" y="80" width="8" height="16" fill="#FEFEFE"/><rect x="73" y="68" width="8" height="28" fill="#FEFEFE"/><rect x="89" y="54" width="8" height="42" fill="#FEFEFE"/><text x="128" y="60" fill="#111111" font-size="15" font-weight="700">数据卡片 · 独立可复用模块</text><text x="128" y="96" fill="#111111" font-family="Archivo, sans-serif" font-size="28" font-weight="800">7,860</text><text x="220" y="96" fill="#B13B27" font-family="Space Mono, monospace" font-size="14" font-weight="700">↑ 12.3%</text><text x="128" y="122" fill="#464C42" font-size="12">外框、内距与槽位全部定型，可跨页复制</text></svg>`,
  },
  {
    num: "04 / 05",
    cap: "<strong>第 4 层 · 模板（Templates）</strong>：先不填具体文案，只排布网格列数、沟槽宽与模块落位——正是原海报第一条应用建议「先定结构，后填内容」。",
    svg: `<svg viewBox="0 0 360 176"><rect x="24" y="14" width="312" height="148" rx="3" fill="#262B24" stroke="#919C84" stroke-dasharray="5 4"/><rect x="38" y="26" width="136" height="58" rx="2" fill="#3B4338" stroke="#919C84"/><rect x="186" y="26" width="136" height="58" rx="2" fill="#3B4338" stroke="#919C84"/><rect x="38" y="94" width="136" height="56" rx="2" fill="#3B4338" stroke="#919C84"/><rect x="186" y="94" width="136" height="56" rx="2" fill="#3B4338" stroke="#919C84"/><text x="106" y="59" text-anchor="middle" fill="#C7CEBC" font-family="Space Mono, monospace" font-size="11">SLOT A · KPI</text><text x="254" y="59" text-anchor="middle" fill="#C7CEBC" font-family="Space Mono, monospace" font-size="11">SLOT B · KPI</text><text x="106" y="126" text-anchor="middle" fill="#C7CEBC" font-family="Space Mono, monospace" font-size="11">SLOT C · PROFILE</text><text x="254" y="126" text-anchor="middle" fill="#C7CEBC" font-family="Space Mono, monospace" font-size="11">SLOT D · SUMMARY</text></svg>`,
  },
  {
    num: "05 / 05",
    cap: "<strong>第 5 层 · 页面（Pages）</strong>：把真实数据和长短不一的文案灌进模板检验——能经住真实业务考验且不崩格，才算闭环的模块化页面。",
    svg: `<svg viewBox="0 0 360 176"><rect x="24" y="12" width="312" height="152" rx="3" fill="#FEFEFE"/><rect x="24" y="12" width="312" height="22" fill="#F0F1E8"/><rect x="38" y="42" width="136" height="52" rx="2" fill="#FAF8F4" stroke="#D6D8CF"/><rect x="46" y="52" width="24" height="24" rx="2" fill="#A7AC9B"/><text x="78" y="68" fill="#111111" font-family="Archivo, sans-serif" font-size="15" font-weight="800">7,860</text><text x="128" y="68" fill="#B13B27" font-family="Space Mono, monospace" font-size="10" font-weight="700">↑12%</text><rect x="186" y="42" width="136" height="52" rx="2" fill="#FAF8F4" stroke="#D6D8CF"/><rect x="194" y="52" width="24" height="24" rx="2" fill="#A7AC9B"/><text x="226" y="68" fill="#111111" font-family="Archivo, sans-serif" font-size="15" font-weight="800">84.2%</text><text x="278" y="68" fill="#B13B27" font-family="Space Mono, monospace" font-size="10" font-weight="700">↑6%</text><rect x="38" y="102" width="136" height="50" rx="2" fill="#FAF8F4" stroke="#D6D8CF"/><circle cx="58" cy="126" r="12" fill="#A7AC9B"/><text x="78" y="124" fill="#111111" font-size="12" font-weight="700">张云策</text><text x="78" y="140" fill="#464C42" font-size="10">产品设计师</text><rect x="186" y="102" width="136" height="50" rx="2" fill="#FAF8F4" stroke="#D6D8CF"/><rect x="194" y="114" width="24" height="24" rx="2" fill="#A7AC9B"/><text x="226" y="124" fill="#111111" font-size="12" font-weight="700">内容摘要</text><text x="226" y="140" fill="#464C42" font-size="10">清晰 · 一致 · 扩展</text></svg>`,
  },
];

function renderAtomic(idx) {
  const s = ATOMIC_STAGES[idx];
  if (!s) return;
  $("#atomic-num").textContent = s.num;
  $("#atomic-stage").innerHTML = s.svg;
  $("#atomic-cap").innerHTML = s.cap;
  $$(".at-tab").forEach((b, i) => {
    const on = i === idx;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
}
$$(".at-tab").forEach((b) => b.addEventListener("click", () => renderAtomic(Number(b.dataset.stage))));
renderAtomic(0);

// ---------- 04 节：三种组合任务匹配 ----------
const TASK_DATA = {
  report: {
    single: { cls: "is-best", fit: "最契合", why: "长论证最怕左右分心。单列把结论、证据与说明排成一条直落动线，读完一块再进下一块。" },
    two: { cls: "", fit: "次选", why: "仅在需要边读段落边看配图时才值得切两列，否则短句会被切成碎段。" },
    grid3: { cls: "is-poor", fit: "不推荐", why: "把长篇深度文字塞进三列小卡，段落被压窄折行，阅读连贯性会完全被打碎。" },
  },
  compare: {
    single: { cls: "is-poor", fit: "不推荐", why: "上下叠放迫使人凭记忆对照前后两项，来回翻滚最耗精力。" },
    two: { cls: "is-best", fit: "最契合", why: "上跨栏定调，下双列把新旧方案或图文并肩摆开，视线左右平移一次即可比出差异。" },
    grid3: { cls: "", fit: "次选", why: "除非同时比对三组同级指标，否则三列反而稀释了「一对一」对照的焦点。" },
  },
  catalog: {
    single: { cls: "is-poor", fit: "不推荐", why: "十几个并列条目排成单列会拉成极长瀑布，一屏只能扫到两项，筛选效率极低。" },
    two: { cls: "", fit: "次选", why: "适合平板中等宽度，但在大屏上单卡略宽，一屏呈现条目仍然偏少。" },
    grid3: { cls: "is-best", fit: "最契合", why: "多张同构卡片按 3 列齐整排布，眼睛沿 Z 字迅速扫读对比，是产品库与模板库的首选。" },
  },
  board: {
    single: { cls: "is-poor", fit: "不推荐", why: "把核心 KPI、人物负责人和明细全压成竖条，第一屏看不到全局概览。" },
    two: { cls: "is-best", fit: "最契合", why: "首行跨栏放总览或主指标，下方两列拆开数据与说明——既有主次层级，又兼顾对照。" },
    grid3: { cls: "is-best", fit: "同适用", why: "若指标卡达到 3 或 6 张且屏宽充裕（≥ 680px），三列卡片网格也能形成利落的高密看板。" },
  },
};

function renderTask(key) {
  const t = TASK_DATA[key];
  if (!t) return;
  for (const mode of ["single", "two", "grid3"]) {
    const card = $(`.mode-card[data-mode="${mode}"]`);
    card.classList.remove("is-best", "is-poor");
    if (t[mode].cls) card.classList.add(t[mode].cls);
    $(`#fit-${mode}`).textContent = t[mode].fit;
    $(`#why-${mode}`).textContent = t[mode].why;
  }
  $$(".task-btn").forEach((b) => {
    const on = b.dataset.task === key;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
$$(".task-btn").forEach((b) => b.addEventListener("click", () => renderTask(b.dataset.task)));
renderTask("report");

// ---------- 05 节：强行套模块 vs 释放为通幅 ----------
const flipStage = $("#flip-stage");
const flipCap = $("#flip-cap");
$$(".flip-btn").forEach((b) => b.addEventListener("click", () => {
  const mode = b.dataset.flip;
  flipStage.dataset.flip = mode;
  $$(".flip-btn").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); });
  flipCap.textContent = mode === "forced"
    ? "强行套模块：展期、标题、地点、图形被平权切进四只规整卡片，信息虽然整齐，但展览的气氛与空间纵深荡然无存。"
    : "释放为通幅整体：撤掉模块框线，拱门、竖纹、珊瑚圆日与主标题融进同一空间张力里——情绪主导的画面，整体感胜过规整分块。";
}));

// ---------- 06 节：四选一单变量练习 ----------
const QUIZ_LABELS = {
  A: "A · 正解：同构复用 + 统一契约 + 层级清晰",
  B: "B · 破在「可复用」：第二张数据卡换了异构排法",
  C: "C · 破在「系统」：四张卡混用多套边框、圆角与竞色",
  D: "D · 破在「有序」：抹平字号与焦点色，失去视觉主角",
};
const QUIZ_EXPLAIN = {
  A: [
    "选对了！A 版守住了模块化页面的全部三道底线。",
    "两张数据卡片共享一模一样的「图标 → 标题 → 大号主值 + 珊瑚涨跌」结构（同构复用），四张卡圆角、边框与灰绿体系一致（系统契约），核心数据明显重于辅助说明（有序层级）。看 B、C、D 各自标出的单一变量缺陷，就能一眼认出常见假模块化。",
  ],
  B: [
    "差一点——B 版只改坏了「可复用同构」这一个变量。",
    "B 版的网格和配色都干净，但右上第二张数据卡把图标省掉、把数字缩进小胶囊居中摆，与左上同为数据卡的结构冲突。读者每次扫到新指标都得重新适应。正解是 A。",
  ],
  C: [
    "差一点——C 版只改坏了「系统样式契约」这一个变量。",
    "C 版虽然骨架齐整、内结构同构，但四张卡混用了三种圆角、实虚粗细不一的边框与蓝/橙/紫/红四套抢戏色，失去整体系统感。正解是 A。",
  ],
  D: [
    "差一点——D 版只改坏了「有序层级」这一个变量。",
    "D 版把一致性推向了反面陷阱：所有文字压成同一字号与灰调、删掉珊瑚焦点色，虽然工整，却让人一眼分不出 7,860 增长指标与普通标注的轻重。正解是 A。",
  ],
};

$$(".quiz-opt").forEach((btn) => btn.addEventListener("click", () => {
  const pick = btn.dataset.opt;
  $$(".quiz-opt").forEach((x) => {
    const k = x.dataset.opt;
    x.classList.remove("is-picked", "is-right", "is-wrong");
    x.setAttribute("aria-pressed", String(k === pick));
    if (k === "A") x.classList.add("is-right");
    else if (k === pick) x.classList.add("is-wrong");
    if (k === pick) x.classList.add("is-picked");
    $(`#q-tag-${k}`).textContent = QUIZ_LABELS[k];
  });
  const [title, body] = QUIZ_EXPLAIN[pick];
  $("#qv-title").textContent = title;
  $("#qv-body").textContent = body;
}));

// ---------- 07 节：原海报灯箱（复用 #poster.src，支持缩放、拖动平移、Esc 关闭） ----------
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbZoom = $("#lb-zoom");
let zoom = 1;
let panX = 0;
let panY = 0;
let panDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom.toFixed(2)})`;
  lbZoom.textContent = `${Math.round(zoom * 100)}%`;
}
function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  zoom = 1;
  panX = 0;
  panY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  $("#poster-open").focus();
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => { zoom = Math.min(3, zoom + 0.35); applyLbTransform(); });
$("#lb-out").addEventListener("click", () => { zoom = Math.max(0.6, zoom - 0.35); if (zoom <= 1) { panX = 0; panY = 0; } applyLbTransform(); });
$("#lb-reset").addEventListener("click", () => { zoom = 1; panX = 0; panY = 0; applyLbTransform(); });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  zoom = Math.max(0.6, Math.min(3, zoom + (e.deltaY < 0 ? 0.2 : -0.2)));
  if (zoom <= 1) { panX = 0; panY = 0; }
  applyLbTransform();
}, { passive: false });
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg && e.target !== lbStage) return;
  panDrag = { x: e.clientX - panX, y: e.clientY - panY };
  lbStage.classList.add("is-dragging");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!panDrag) return;
  panX = e.clientX - panDrag.x;
  panY = e.clientY - panDrag.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { panDrag = null; lbStage.classList.remove("is-dragging"); });
lbStage.addEventListener("pointercancel", () => { panDrag = null; lbStage.classList.remove("is-dragging"); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 初始化首帧
updateUI();
heroLoop.draw();
