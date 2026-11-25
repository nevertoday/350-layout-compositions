import { loop, pixelRatio } from "../../lib/stage.js";
import {
  COLS,
  ROWS,
  TOTAL_CELLS,
  RULES,
  ZONE_IDS,
  ZONE_META,
  BROKEN_PRESETS,
  clonePreset,
  clampSplit,
  clampZone,
  evaluateBlueprint,
  validateAreasMatrix,
} from "./model.js";

// ==================== HERO: 2D BLUEPRINT GRID COMPOSER ====================
const state = clonePreset(0);

const elGrid = document.getElementById("bp-grid");
const elViewport = document.getElementById("board-viewport");
const elCanvas = document.getElementById("bp-canvas");
const elRuler = document.getElementById("track-ruler");
const elRulerCols = document.getElementById("ruler-cols");
const elHandle = document.getElementById("track-handle");
const elHandleVal = document.getElementById("track-ratio-readout");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagScore = document.getElementById("diag-score");
const elDiagVerdict = document.getElementById("diag-verdict");
const elDiagWhy = document.getElementById("diag-why");
const elDiagCss = document.getElementById("diag-css");
const elMetrics = document.getElementById("board-metrics");
const elSelCss = document.getElementById("sel-css-area");
const elSelSpan = document.getElementById("sel-span-val");
const elGapVal = document.getElementById("gap-val");
const elBtnWire = document.getElementById("btn-wire");
const elBtnBroken = document.getElementById("btn-broken");
const elBtnReset = document.getElementById("btn-reset");

const zoneEls = Object.fromEntries(
  ZONE_IDS.map((id) => [id, elGrid.querySelector(`[data-zone="${id}"]`)])
);
const zoneTabBtns = [...document.querySelectorAll(".zt-btn")];
const gapBtns = [...document.querySelectorAll(".g-btn")];
const pillarEls = Object.fromEntries(
  ["tracks", "zones", "modules", "spacing", "order"].map((k) => [
    k,
    document.querySelector(`.pillar[data-pillar="${k}"]`),
  ])
);

let lastEval = evaluateBlueprint(state);
let canvasDirty = true;
let introDone = false;
let lastCanvasW = 0;
let lastCanvasH = 0;
let cachedRulerW = 0;
let cachedRulerRect = null;

function readStageSize() {
  const rect = elViewport.getBoundingClientRect();
  lastCanvasW = Math.max(1, Math.round(rect.width));
  lastCanvasH = Math.max(1, Math.round(rect.height));
  cachedRulerRect = elRuler.getBoundingClientRect();
  cachedRulerW = Math.max(1, Math.round(cachedRulerRect.width));
}

function syncHeroDOM() {
  if (!lastCanvasW) readStageSize();
  const ev = evaluateBlueprint(state);
  lastEval = ev;

  // Apply REAL CSS Grid tracks & gap directly to DOM
  const colAStr = `${ev.colA.toFixed(2)}fr`;
  const colBStr = `${ev.colB.toFixed(2)}fr`;
  const gapStr = `${state.gap}px`;

  elGrid.style.setProperty("--col-a", colAStr);
  elGrid.style.setProperty("--col-b", colBStr);
  elGrid.style.setProperty("--grid-gap", gapStr);
  elRulerCols.style.setProperty("--col-a", colAStr);
  elRulerCols.style.setProperty("--col-b", colBStr);
  elRulerCols.style.setProperty("--grid-gap", gapStr);

  // Position top yellow Line-3 track divider handle exactly on Line 3
  const handlePct = (state.trackSplit * 100).toFixed(2);
  elHandle.style.left = `${handlePct}%`;
  elHandle.setAttribute("aria-valuenow", String(Math.round(state.trackSplit * 100)));
  elHandleVal.textContent = `${ev.ratio.toFixed(2)}×`;

  // Compute track widths without forcing synchronous DOM reflow during drag
  const { colW } = getTrackMetrics(lastCanvasW, lastCanvasH);

  // Apply REAL grid-column / grid-row to each of the 4 heterogeneous UI zones
  for (const id of ZONE_IDS) {
    const z = state.zones[id];
    const el = zoneEls[id];
    el.style.gridColumn = `${z.c} / ${z.c + z.cw}`;
    el.style.gridRow = `${z.r} / ${z.r + z.rh}`;
    el.classList.toggle("is-selected", state.selected === id);
    const coordEl = el.querySelector(`[data-coord="${id}"]`);
    if (coordEl) coordEl.textContent = `${z.c}/${z.c + z.cw} · ${z.r}/${z.r + z.rh}`;

    // Adaptive compact labels computed directly from exact track pixel widths (zero layout thrash)
    let w = (z.cw - 1) * state.gap;
    for (let i = z.c - 1; i < z.c - 1 + z.cw; i++) w += colW[i] || 0;
    const size = w < 66 ? "xs" : w < 118 ? "sm" : "md";
    if (el.dataset.size !== size) el.dataset.size = size;
    const tagEl = el.querySelector(".z-tag");
    const wantTag =
      size === "xs" ? ZONE_META[id].tiny : size === "sm" ? ZONE_META[id].short : ZONE_META[id].label;
    if (tagEl && tagEl.textContent !== wantTag) tagEl.textContent = wantTag;
  }

  // Update invisible-order mode
  elViewport.classList.toggle("is-invisible", state.invisible);
  elBtnWire.setAttribute("aria-pressed", String(state.invisible));
  elBtnWire.textContent = state.invisible ? "隐形秩序：开（已藏辅助线）" : "隐形秩序：关";

  // Update console tabs & selected coordinates
  for (const btn of zoneTabBtns) {
    const active = btn.dataset.sel === state.selected;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  }
  const sz = state.zones[state.selected];
  elSelCss.textContent = `col ${sz.c}/${sz.c + sz.cw} · row ${sz.r}/${sz.r + sz.rh}`;
  elSelSpan.textContent = `${sz.cw} 列 × ${sz.rh} 行`;

  // Update gap pills
  for (const btn of gapBtns) {
    btn.classList.toggle("is-active", Number(btn.dataset.gap) === state.gap);
  }
  const gapTag =
    state.gap < RULES.gapMin ? "粘连" : state.gap > RULES.gapMax ? "过宽" : "舒适";
  elGapVal.textContent = `${state.gap}px（${gapTag}）`;

  // Update Canary Yellow Diagnosis Block
  elDiagBadge.textContent = ev.badge;
  elDiagBadge.className = `diag-badge ${ev.status === "ok" ? "is-ok" : "is-err"}`;
  elDiagScore.textContent = `${ev.passedCount} / 4 秩序项`;
  elDiagVerdict.textContent = ev.verdict;
  elDiagWhy.textContent = ev.why;
  elDiagCss.textContent = ev.cssLine;

  // Update metrics strip & column pixel widths in ruler (derived from exact live stage metrics)
  elMetrics.textContent = `重叠 ${ev.overlapCells.length} 格 · 覆盖 ${ev.coveredCells}/${TOTAL_CELLS} 格 · 轨比 ${ev.ratio.toFixed(2)}×`;

  const rulerCells = elRulerCols.querySelectorAll(".rc");
  const showPx = cachedRulerW >= 460;
  rulerCells.forEach((cell, idx) => {
    const txt = showPx ? `${idx + 1} · ${Math.round(colW[idx] || 0)}px` : String(idx + 1);
    if (cell.textContent !== txt) cell.textContent = txt;
  });

  // Update Poster 227 Five Pillar Strip
  const passMap = {
    tracks: ev.tracksOk,
    zones: ev.zonesOk,
    modules: ev.modulesOk,
    spacing: ev.spacingOk,
    order: ev.orderOk,
  };
  for (const [k, el] of Object.entries(pillarEls)) {
    if (!el) continue;
    el.classList.toggle("is-pass", passMap[k]);
    const st = el.querySelector(`[data-pst="${k}"]`);
    if (st && st.textContent !== ev.pillarLabels[k]) st.textContent = ev.pillarLabels[k];
  }

  elBtnBroken.textContent = `换个错版 (${state.presetIndex + 1}/${BROKEN_PRESETS.length})`;
  canvasDirty = true;
}

// Compute exact pixel geometry of the 6×4 grid tracks matching live CSS Grid
function getTrackMetrics(W, H) {
  const g = state.gap;
  const availW = Math.max(10, W - g * (COLS - 1));
  const availH = Math.max(10, H - g * (ROWS - 1));
  const totalFr = 2 * lastEval.colA + 4 * lastEval.colB;
  const colW = [];
  for (let i = 0; i < COLS; i++) {
    const fr = i < 2 ? lastEval.colA : lastEval.colB;
    colW.push((availW * fr) / totalFr);
  }
  const colX = [];
  let cx = 0;
  for (let i = 0; i < COLS; i++) {
    colX.push(cx);
    cx += colW[i] + g;
  }
  const rowH = availH / ROWS;
  const rowY = [];
  for (let r = 0; r < ROWS; r++) rowY.push(r * (rowH + g));
  return { colX, colW, rowY, rowH, g };
}

function drawBlueprintCanvas(t, { still }) {
  const W = lastCanvasW || Math.max(1, Math.round(elViewport.getBoundingClientRect().width));
  const H = lastCanvasH || Math.max(1, Math.round(elViewport.getBoundingClientRect().height));
  const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  const needW = Math.round(W * dpr);
  const needH = Math.round(H * dpr);

  if (elCanvas.width !== needW || elCanvas.height !== needH) {
    elCanvas.width = needW;
    elCanvas.height = needH;
    canvasDirty = true;
  }

  const prog = still ? 1 : Math.min(1, t / 0.78);
  if (prog >= 1 && introDone && !canvasDirty) return;
  if (prog >= 1) introDone = true;
  canvasDirty = false;

  const ctx = elCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (state.invisible) return; // 「隐形秩序」模式：真正撤掉全部辅助线与标记

  const { colX, colW, rowY, rowH, g } = getTrackMetrics(W, H);
  const ease = 1 - Math.pow(1 - prog, 3);

  // 1. Subtle dashed blueprint track lines (Cols & Rows)
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  for (let i = 1; i < COLS; i++) {
    const x = Math.round(colX[i] - g / 2) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H * ease);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    const y = Math.round(rowY[r] - g / 2) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W * ease, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 2. Highlight Line 3 (the live draggable split track seam) in crisp Canary Yellow
  const seam3 = Math.round(colX[2] - g / 2) + 0.5;
  ctx.strokeStyle = lastEval.tracksOk ? "rgba(255, 208, 15, 0.85)" : "#ff8f73";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(seam3, 0);
  ctx.lineTo(seam3, H * ease);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw faint coordinate crosses at empty cell centers when coverage is insufficient
  if (!lastEval.modulesOk && prog > 0.45) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.36)";
    ctx.lineWidth = 1;
    for (const ec of lastEval.emptyCells) {
      const ex = colX[ec.c - 1];
      const ey = rowY[ec.r - 1];
      const ew = colW[ec.c - 1];
      ctx.strokeRect(ex + 3.5, ey + 3.5, Math.max(2, ew - 7), Math.max(2, rowH - 7));
    }
  }

  // 4. Draw bold diagonal blueprint conflict hatching over overlapping cells
  if (lastEval.overlapCells.length > 0 && prog > 0.35) {
    for (const cell of lastEval.overlapCells) {
      const x = colX[cell.c - 1];
      const y = rowY[cell.r - 1];
      const w = colW[cell.c - 1];
      const h = rowH;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      ctx.fillStyle = "rgba(217, 54, 22, 0.42)";
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.6;
      const step = 12;
      for (let d = -h; d < w + h; d += step) {
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x + d + h, y + h);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = "#ff6b4a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, Math.max(2, w - 2), Math.max(2, h - 2));

      // Crisp conflict pill inside overlapping cell
      if (w >= 42 && h >= 32) {
        const pw = Math.min(w - 8, 56);
        const ph = 18;
        const px = x + (w - pw) / 2;
        const py = y + (h - ph) / 2;
        ctx.fillStyle = "#a81c08";
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = "#ffffff";
        ctx.font = '700 11px "Noto Sans SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("重叠!", x + w / 2, y + h / 2 + 0.5);
      }
    }
  }

  ctx.restore();
}

const heroLoop = loop(elViewport, (t, dt, opts) => {
  drawBlueprintCanvas(t, opts);
});

// ---- Handle Dragging on Top Yellow Line-3 Handle (data-perf-drag) ----
// Supports Pointer Events, Touch Events (for CDP perf.mjs touch drag), and Keyboard Arrows
let draggingHandle = false;
let activeTouchId = null;

function updateSplitFromClientX(clientX) {
  const rect = cachedRulerRect || elRuler.getBoundingClientRect();
  if (rect.width <= 0) return;
  let next = (clientX - rect.left) / rect.width;
  next = clampSplit(next);
  if (Math.abs(next - RULES.splitUniform) < RULES.splitSnapRadius) {
    next = RULES.splitUniform;
  }
  state.trackSplit = next;
  syncHeroDOM();
  heroLoop.draw();
}

elHandle.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // handled by touchstart to avoid double events
  draggingHandle = true;
  cachedRulerRect = elRuler.getBoundingClientRect();
  try { elHandle.setPointerCapture(e.pointerId); } catch {}
  updateSplitFromClientX(e.clientX);
});
elHandle.addEventListener("pointermove", (e) => {
  if (!draggingHandle || e.pointerType === "touch") return;
  updateSplitFromClientX(e.clientX);
});
elHandle.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  draggingHandle = false;
  try { elHandle.releasePointerCapture(e.pointerId); } catch {}
});
elHandle.addEventListener("pointercancel", () => { draggingHandle = false; });

elHandle.addEventListener("touchstart", (e) => {
  if (!e.changedTouches.length) return;
  const touch = e.changedTouches[0];
  activeTouchId = touch.identifier;
  draggingHandle = true;
  cachedRulerRect = elRuler.getBoundingClientRect();
  e.preventDefault();
  updateSplitFromClientX(touch.clientX);
}, { passive: false });

window.addEventListener("touchmove", (e) => {
  if (!draggingHandle || activeTouchId === null) return;
  for (const touch of e.changedTouches) {
    if (touch.identifier === activeTouchId) {
      e.preventDefault();
      updateSplitFromClientX(touch.clientX);
      break;
    }
  }
}, { passive: false });

window.addEventListener("touchend", (e) => {
  if (activeTouchId === null) return;
  for (const touch of e.changedTouches) {
    if (touch.identifier === activeTouchId) {
      draggingHandle = false;
      activeTouchId = null;
      break;
    }
  }
});

// Clicking anywhere on the ruler rail jumps Line 3 smoothly
elRuler.addEventListener("pointerdown", (e) => {
  if (e.target === elHandle || elHandle.contains(e.target) || e.pointerType === "touch") return;
  updateSplitFromClientX(e.clientX);
});

elHandle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.05 : 0.02;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.trackSplit = clampSplit(state.trackSplit - step);
    syncHeroDOM();
    heroLoop.draw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.trackSplit = clampSplit(state.trackSplit + step);
    syncHeroDOM();
    heroLoop.draw();
  }
});

// ---- Direct 2D Zone Drag (Move) & Corner Handle Drag (Resize Span) ----
function clientToCell(clientX, clientY) {
  const rect = elViewport.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));
  const { colX, colW, rowY, rowH } = getTrackMetrics(rect.width, rect.height);
  let col = COLS;
  for (let i = 0; i < COLS; i++) {
    if (x <= colX[i] + colW[i] + state.gap / 2) { col = i + 1; break; }
  }
  let row = ROWS;
  for (let r = 0; r < ROWS; r++) {
    if (y <= rowY[r] + rowH + state.gap / 2) { row = r + 1; break; }
  }
  return { col, row };
}

let zoneDrag = null;

for (const id of ZONE_IDS) {
  const el = zoneEls[id];
  const resizer = el.querySelector("[data-resize]");

  el.addEventListener("pointerdown", (e) => {
    state.selected = id;
    syncHeroDOM();
    heroLoop.draw();
    const isResize = e.target === resizer;
    if (e.pointerType === "touch" && !isResize) return; // keep mobile page scroll smooth; corner handle resizes directly
    const startCell = clientToCell(e.clientX, e.clientY);
    zoneDrag = {
      id,
      mode: isResize ? "resize" : "move",
      startCell,
      orig: { ...state.zones[id] },
      pointerId: e.pointerId,
      target: isResize ? resizer : el,
    };
    try { zoneDrag.target.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  });

  el.addEventListener("keydown", (e) => {
    state.selected = id;
    const z = state.zones[id];
    let changed = false;
    if (e.key === "ArrowLeft") { e.shiftKey ? z.cw-- : z.c--; changed = true; }
    else if (e.key === "ArrowRight") { e.shiftKey ? z.cw++ : z.c++; changed = true; }
    else if (e.key === "ArrowUp") { e.shiftKey ? z.rh-- : z.r--; changed = true; }
    else if (e.key === "ArrowDown") { e.shiftKey ? z.rh++ : z.r++; changed = true; }
    if (changed) {
      e.preventDefault();
      state.zones[id] = clampZone(z);
      syncHeroDOM();
      heroLoop.draw();
    }
  });
}

window.addEventListener("pointermove", (e) => {
  if (!zoneDrag || e.pointerId !== zoneDrag.pointerId) return;
  const cur = clientToCell(e.clientX, e.clientY);
  const { id, mode, startCell, orig } = zoneDrag;
  if (mode === "move") {
    const dc = cur.col - startCell.col;
    const dr = cur.row - startCell.row;
    state.zones[id] = clampZone({ ...orig, c: orig.c + dc, r: orig.r + dr });
  } else {
    const nextCw = Math.max(1, cur.col - orig.c + 1);
    const nextRh = Math.max(1, cur.row - orig.r + 1);
    state.zones[id] = clampZone({ ...orig, cw: nextCw, rh: nextRh });
  }
  syncHeroDOM();
  heroLoop.draw();
});

window.addEventListener("pointerup", (e) => {
  if (!zoneDrag || e.pointerId !== zoneDrag.pointerId) return;
  try { zoneDrag.target.releasePointerCapture(e.pointerId); } catch {}
  zoneDrag = null;
});

// ---- Console Buttons ----
zoneTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.selected = btn.dataset.sel;
    syncHeroDOM();
    heroLoop.draw();
  });
});

document.querySelectorAll(".c-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const z = { ...state.zones[state.selected] };
    switch (btn.dataset.act) {
      case "left": z.c--; break;
      case "right": z.c++; break;
      case "up": z.r--; break;
      case "down": z.r++; break;
      case "cw-": z.cw--; break;
      case "cw+": z.cw++; break;
      case "rh-": z.rh--; break;
      case "rh+": z.rh++; break;
    }
    state.zones[state.selected] = clampZone(z);
    syncHeroDOM();
    heroLoop.draw();
  });
});

gapBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gap = Number(btn.dataset.gap);
    syncHeroDOM();
    heroLoop.draw();
  });
});

elBtnWire.addEventListener("click", () => {
  state.invisible = !state.invisible;
  syncHeroDOM();
  heroLoop.draw();
});

elBtnBroken.addEventListener("click", () => {
  const next = clonePreset((state.presetIndex + 1) % BROKEN_PRESETS.length);
  Object.assign(state, next);
  syncHeroDOM();
  heroLoop.draw();
});

elBtnReset.addEventListener("click", () => {
  const fresh = clonePreset(state.presetIndex);
  Object.assign(state, fresh);
  syncHeroDOM();
  heroLoop.draw();
});

// Initial sync & resize observer
readStageSize();
syncHeroDOM();
new ResizeObserver(() => {
  readStageSize();
  syncHeroDOM();
  heroLoop.draw();
}).observe(elViewport);


// ==================== SECTION 01: TRACK FORMULA LAB ====================
const s1Grid = document.getElementById("s1-grid");
const s1Range = document.getElementById("s1-range");
const s1RangeVal = document.getElementById("s1-range-val");
const s1WidthRead = document.getElementById("s1-width-read");
const s1Lines = document.getElementById("s1-lines");
const s1Note = document.getElementById("s1-note");
const s1Btns = [...document.querySelectorAll(".s1-btn")];

const S1_MODES = {
  equal: {
    tpl: "1fr 1fr 1fr",
    note: "三条 <code>1fr</code> 均分扣掉 2 条 12px 沟槽后的剩余宽度；容器缩窄时三列同比例收缩，边界始终压齐。",
  },
  fixed: {
    tpl: "120px 1fr 1fr",
    note: "列 1 锁定 <code>120px</code> 不动，列 2 和列 3 平分「总宽 − 120px − 沟槽」的余量——典型侧边导览配双栏主区写法。",
  },
  minmax: {
    tpl: "minmax(96px, 1fr) 2fr 1fr",
    note: "列 1 设了 <code>96px</code> 保底宽度，容器压窄时它先守住底线，由 <code>2fr / 1fr</code> 去吸收收缩压力。",
  },
  autofit: {
    tpl: "repeat(auto-fit, minmax(112px, 1fr))",
    note: "不写一行媒体查询：只要总宽塞不下 3 列 × 112px，<code>auto-fit</code> 会自动折成 2 列甚至 1 列并铺满整行。",
  },
};
let s1Current = "equal";

function updateS1() {
  const cfg = S1_MODES[s1Current];
  const pct = Number(s1Range.value);
  s1Grid.style.gridTemplateColumns = cfg.tpl;
  s1Grid.style.width = `${pct}%`;
  const realW = Math.round(s1Grid.getBoundingClientRect().width);
  s1RangeVal.textContent = `${pct}%`;
  s1WidthRead.textContent = `实测容器宽 ${realW}px`;
  s1Note.innerHTML = cfg.note;

  // Measure real rendered column widths directly from DOM
  const cells = [...s1Grid.querySelectorAll(".s1-cell")];
  const firstRowTop = cells[0].getBoundingClientRect().top;
  let colsInFirstRow = 0;
  cells.forEach((cell, i) => {
    const r = cell.getBoundingClientRect();
    if (Math.abs(r.top - firstRowTop) < 6) colsInFirstRow++;
    const pxEl = cell.querySelector(`[data-s1px="${i}"]`);
    if (pxEl) pxEl.textContent = `${Math.round(r.width)}px`;
  });
  const lineLabels = Array.from({ length: colsInFirstRow + 1 }, (_, i) => `线 ${i + 1}`);
  s1Lines.innerHTML = lineLabels.map((l) => `<span>${l}</span>`).join("");
}

s1Btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    s1Current = btn.dataset.s1;
    s1Btns.forEach((b) => b.classList.toggle("is-active", b === btn));
    updateS1();
  });
});
s1Range.addEventListener("input", updateS1);
new ResizeObserver(updateS1).observe(s1Grid.parentElement);
updateS1();


// ==================== SECTION 02: THREE GRID ARCHETYPES ====================
const s2Demo = document.getElementById("s2-demo");
const s2Tag = document.getElementById("s2-tag");
const s2Explain = document.getElementById("s2-explain");
const s2Code = document.getElementById("s2-code");
const s2Xray = document.getElementById("s2-xray");
const archBtns = [...document.querySelectorAll(".arch-card")];

const ARCH_INFO = {
  column: {
    cls: "is-column",
    tag: "列网格 · 垂直基准领跑",
    explain: "重在纵向列线对齐、横向高度顺着文字自然往下长——新闻站、博客正文和产品说明页最常用，长短不一的段落不会互相强拉。",
    code: "grid-template-columns: repeat(12, 1fr); grid-auto-rows: auto;",
  },
  modular: {
    cls: "is-modular",
    tag: "模块网格 · 纵横双轨等步",
    explain: "既分列又锁行，形成整齐划一的矩形单元矩阵——适合作品集、数据看板与组件库，每个模块跨 1 格或 2 格都能严丝合缝。",
    code: "grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 150px);",
  },
  hierarchical: {
    cls: "is-hierarchical",
    tag: "层级网格 · 非等比焦点主导",
    explain: "按信息轻重故意打破等分，用非对称宽轨把第一焦点拉到最大（如 2.1fr 主专题纵跨两行），常见于杂志封面与品牌专题首页。",
    code: "grid-template-columns: 2.1fr 1.1fr 0.85fr; grid-template-rows: 170px 136px;",
  },
};

archBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.arch;
    const info = ARCH_INFO[key];
    archBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    s2Demo.classList.remove("is-column", "is-modular", "is-hierarchical");
    s2Demo.classList.add(info.cls);
    s2Tag.textContent = info.tag;
    s2Explain.textContent = info.explain;
    s2Code.textContent = info.code;
  });
});

s2Xray.addEventListener("click", () => {
  const on = s2Xray.getAttribute("aria-pressed") !== "true";
  s2Xray.setAttribute("aria-pressed", String(on));
  s2Xray.textContent = on ? "蓝图骨架透视：开" : "蓝图骨架透视：关";
  s2Demo.classList.toggle("is-xray", on);
});


// ==================== SECTION 03: SPACING & RHYTHMIC SCALE ====================
const s3Cols = document.getElementById("s3-columns");
const s3Ruler = document.getElementById("s3-gutter-ruler");
const s3Badge = document.getElementById("s3-gutter-badge");
const s3Pill = document.getElementById("s3-pill");
const s3Ratio = document.getElementById("s3-ratio");
const s3Verdict = document.getElementById("s3-verdict");
const s3Mt = document.getElementById("s3-mt-val");
const s3Lh = document.getElementById("s3-lh-val");
const s3Pg = document.getElementById("s3-pg-val");
const s3Mb = document.getElementById("s3-mb-val");

let s3LineHeight = 1.5;
let s3ColGap = 10;

function updateS3() {
  const basePx = 16;
  const lhPx = Math.round(basePx * s3LineHeight);
  const ratio = s3ColGap / lhPx;

  s3Cols.style.lineHeight = String(s3LineHeight);
  s3Cols.style.columnGap = `${s3ColGap}px`;
  s3Cols.querySelectorAll("p").forEach((p, idx) => {
    p.style.marginBottom = idx === 0 ? `${lhPx}px` : "0";
  });

  // Sync Poster 227 giant A measurement ticks to whole baseline step
  s3Mt.textContent = `${lhPx}px`;
  s3Lh.textContent = `${lhPx}px`;
  s3Pg.textContent = `${lhPx}px`;
  s3Mb.textContent = `${lhPx}px`;

  s3Ruler.style.width = `${s3ColGap}px`;
  s3Badge.textContent = `${s3ColGap}px`;

  const ok = ratio >= 1.0 && ratio <= 2.4;
  s3Ruler.classList.toggle("is-ok", ok);
  s3Pill.classList.toggle("is-ok", ok);
  s3Ratio.textContent = `沟槽 / 行高 = ${ratio.toFixed(2)}×（经验值建议 1.0×–2.4×）`;

  if (ratio < 1.0) {
    s3Pill.textContent = "串行风险 · 沟槽窄过行距";
    s3Verdict.textContent = `当前列沟槽只有 ${s3ColGap}px，比正文行高 ${lhPx}px 还窄。按格式塔接近律，左栏行尾离右栏行首比离自己下一行更近，眼睛极易直接跨栏串读。`;
  } else if (ratio > 2.4) {
    s3Pill.textContent = "略显疏离 · 沟槽偏宽";
    s3Verdict.textContent = `当前列沟槽 ${s3ColGap}px 达到行高 ${lhPx}px 的 ${ratio.toFixed(2)}×，虽绝不会串行，但两栏在窄屏上会显得各自孤立，白带略显突兀。`;
  } else {
    s3Pill.textContent = "呼吸清晰 · 节奏成立";
    s3Verdict.textContent = `列沟槽 ${s3ColGap}px 清晰宽于正文行高 ${lhPx}px（${ratio.toFixed(2)}×），上下行先紧密抱成段落，左右两栏再自然分开，一眼扫描顺畅无阻。`;
  }
}

document.querySelectorAll(".s3-btn[data-lh]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s3LineHeight = Number(btn.dataset.lh);
    document.querySelectorAll(".s3-btn[data-lh]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateS3();
  });
});
document.querySelectorAll(".s3-btn[data-cg]").forEach((btn) => {
  btn.addEventListener("click", () => {
    s3ColGap = Number(btn.dataset.cg);
    document.querySelectorAll(".s3-btn[data-cg]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateS3();
  });
});
updateS3();


// ==================== SECTION 04: NAMED TEMPLATE AREAS PAINTER ====================
const s4MatrixEl = document.getElementById("s4-matrix");
const s4Badge = document.getElementById("s4-badge");
const s4Msg = document.getElementById("s4-msg");
const s4Code = document.getElementById("s4-code");
const s4Preview = document.getElementById("s4-preview");
const brushBtns = [...document.querySelectorAll(".brush-btn")];

const S4_PRESETS = {
  ok: [
    ["head", "head", "head"],
    ["nav", "main", "side"],
    ["nav", "main", "side"],
  ],
  lshape: [
    ["head", "head", "side"],
    ["nav", "head", "side"],
    ["nav", "main", "main"],
  ],
  hole: [
    ["head", "head", "."],
    ["nav", "main", "main"],
    [".", "main", "main"],
  ],
};

let s4Brush = "head";
let s4Grid = S4_PRESETS.ok.map((r) => [...r]);

function renderS4() {
  const res = validateAreasMatrix(s4Grid);

  s4MatrixEl.innerHTML = "";
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = s4Grid[r][c];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "s4-cell";
      btn.dataset.area = val;
      if (res.badCellKeys.has(`${r}-${c}`)) btn.classList.add("is-bad");
      btn.innerHTML = `<span>${val}</span><small>R${r + 1}·C${c + 1}</small>`;
      btn.setAttribute("aria-label", `第 ${r + 1} 行第 ${c + 1} 列，当前为 ${val}，点击涂成 ${s4Brush}`);
      btn.addEventListener("click", () => {
        s4Grid[r][c] = s4Brush;
        renderS4();
      });
      s4MatrixEl.appendChild(btn);
    }
  }

  s4Code.textContent = `grid-template-areas:\n  ${res.rowsCss.join("\n  ")};`;

  const pCells = {
    head: s4Preview.querySelector(".p-head"),
    nav: s4Preview.querySelector(".p-nav"),
    main: s4Preview.querySelector(".p-main"),
    side: s4Preview.querySelector(".p-side"),
  };

  if (res.valid) {
    s4Badge.textContent = `声明合法 · ${res.presentNames.length} 个矩形区域`;
    s4Badge.className = "s4-badge is-ok";
    s4Msg.textContent = "每个命名区域都是完整实心矩形（点号 . 留出显式空白），浏览器精准归位。";
    s4Preview.classList.remove("is-broken");
    s4Preview.style.gridTemplateAreas = res.rowsCss.join(" ");
    for (const [name, el] of Object.entries(pCells)) {
      const has = res.presentNames.includes(name);
      el.style.display = has ? "flex" : "none";
      el.style.gridArea = has ? name : "auto";
    }
  } else {
    s4Badge.textContent = res.invalidNames.length
      ? `非法形状 · ${res.invalidNames.join("、")} 非矩形`
      : "空地图 · 至少保留一个命名区";
    s4Badge.className = "s4-badge is-err";
    s4Msg.textContent = res.invalidNames.length
      ? `按 W3C 规范，${res.invalidNames.join("、")} 成了 L 形或断裂块——整条 grid-template-areas 声明作废，一旁的预览立刻退回默认顺序流！`
      : "整张地图全是空白点号 . ，没有可落位的命名区域。";
    s4Preview.classList.add("is-broken");
    s4Preview.style.gridTemplateAreas = "none";
    for (const el of Object.values(pCells)) {
      el.style.display = "flex";
      el.style.gridArea = "auto";
    }
  }
}

brushBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    s4Brush = btn.dataset.brush;
    brushBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", String(on));
    });
  });
});

document.getElementById("s4-preset-ok").addEventListener("click", () => {
  s4Grid = S4_PRESETS.ok.map((r) => [...r]);
  renderS4();
});
document.getElementById("s4-preset-l").addEventListener("click", () => {
  s4Grid = S4_PRESETS.lshape.map((r) => [...r]);
  renderS4();
});
document.getElementById("s4-preset-hole").addEventListener("click", () => {
  s4Grid = S4_PRESETS.hole.map((r) => [...r]);
  renderS4();
});
renderS4();


// ==================== SECTION 05: ORIGINS & 4-ERA SCHEMATIC CANVAS ====================
const s5Canvas = document.getElementById("s5-canvas");
const s5Kicker = document.getElementById("s5-kicker");
const s5Heading = document.getElementById("s5-heading");
const s5P1 = document.getElementById("s5-p1");
const s5P2 = document.getElementById("s5-p2");
const eraBtns = [...document.querySelectorAll(".era-btn")];

const ERAS = [
  {
    kicker: "PRINT SYSTEM · 1964–1981 瑞士印刷网格",
    heading: "卡尔·格斯特纳与约瑟夫·米勒-布罗克曼",
    p1: "1964 年，瑞士设计师 Karl Gerstner 出版《Designing Programmes》（原德文 Programme entwerfen，Arthur Niggli 出版），把版面拆解为可复用的规则程序；1981 年，Josef Müller-Brockmann 由同一出版社推出德英双语经典《Grid Systems in Graphic Design》（Raster Systeme für die visuelle Gestaltung），系统整理了 8 格到 32 格的平面与三维空间网格法。",
    p2: "纸张尺寸固定，印刷设计师用毫米和活字点就能锁死行距与栏宽；而屏幕宽窄千变万化，网页整整花了三十多年才等来原生二维网格。",
  },
  {
    kicker: "WEB HACKS · 1995–2010 表格与浮动代工期",
    heading: "拿表格硬套、靠浮动与清除补丁撑版面",
    p1: "早期 CSS 根本没有二维页面网格。设计师先是用多层嵌套 <table>（详见 230 表格布局）硬拼边框，把视觉结构写死在 HTML 语义里；后来转向 float 浮动（231 浮动布局）加 clearfix 清除补丁，再叠上 12 列栅格框架（如 960 Grid System / Bootstrap）模拟栏宽。",
    p2: "这种写法只要某张卡片多出两行字，整排浮动就容易卡阶梯，横向能凑出列，纵向却几乎无法锁齐行轨。",
  },
  {
    kicker: "W3C FIRST DRAFT · 2011–2012 从微软草案起步",
    heading: "2011 年首份公开工作草案与 IE10 先行实现",
    p1: "2011 年 4 月 7 日，W3C 发布了第一份 CSS Grid Layout 公开工作草案（由微软工程师 Alex Mogilevsky、Phil Cupp、Markus Mielke 等主导起草），随后 Internet Explorer 10 在 2012 年率先带 -ms- 前缀落地。",
    p2: "接下来五年，W3C CSS 工作组（Tab Atkins Jr.、Elika Etemad 等编辑）反复重写规范，补全了 fr 单位、隐式轨道与命名区域语法。",
  },
  {
    kicker: "MODERN STANDARD · 2017 年 3 月全平台原生落地",
    heading: "三大浏览器同月齐发，网页真正进入二维时代",
    p1: "2017 年 3 月成为网页排版史上罕见的同步时刻：Firefox 52（3 月 7 日）、Chrome 57（3 月 9 日）与 Safari 10.1（3 月 27 日）在三周内相继上线无前缀 CSS Grid Level 1，Rachel Andrew 与 Jen Simmons 等人的长期布道让开发者迅速拥抱二维布局。",
    p2: "此后 CSS Grid Level 2 从 2018 年起继续推进子网格（228 子网格布局），让嵌套卡片内部标题与页脚也能直接对齐外层主轨。",
  },
];

let currentEra = 0;
let eraDirty = true;

function drawEraCanvas() {
  if (!eraDirty) return;
  eraDirty = false;
  const ctx = s5Canvas.getContext("2d");
  const W = s5Canvas.width;
  const H = s5Canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Blueprint background
  ctx.fillStyle = "#04237d";
  ctx.fillRect(0, 0, W, H);

  // Outer registration border
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(18.5, 18.5, W - 37, H - 37);

  ctx.font = '500 12px "DM Mono", monospace';
  ctx.textBaseline = "top";

  if (currentEra === 0) {
    // 1964-1981: Swiss 8-field modular print grid with corner crop marks
    const padX = 52, padY = 44, gw = W - 104, gh = H - 88, gap = 12;
    const cw = (gw - gap * 3) / 4, rh = (gh - gap) / 2;
    // Crop marks
    ctx.strokeStyle = "#ffd00f";
    ctx.lineWidth = 1.5;
    for (const [cx, cy] of [[padX, padY], [padX + gw, padY], [padX, padY + gh], [padX + gw, padY + gh]]) {
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
      ctx.stroke();
    }
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const x = padX + c * (cw + gap), y = padY + r * (rh + gap);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.strokeRect(x, y, cw, rh);
      }
    }
    ctx.fillStyle = "#ffd00f";
    ctx.fillRect(padX, padY, cw * 2 + gap, rh);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(padX + (cw + gap) * 2, padY, cw * 2 + gap, rh * 0.44);
    ctx.fillRect(padX, padY + rh + gap, cw, rh * 0.65);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(padX + cw + gap, padY + rh + gap, cw * 3 + gap * 2, rh);
    ctx.fillStyle = "#ffd00f";
    ctx.fillText("SWISS 8-FIELD PRINT GRID · mm", 28, H - 34);
  } else if (currentEra === 1) {
    // 1995-2010: Nested <table> + broken float staircase
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(42, 42, W - 84, H - 86);
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff8f73";
    ctx.fillText("<table><tr><td> + float: left; clear: both;", 42, 26);

    // Uneven float boxes snagging into a staircase
    const boxes = [
      { x: 52, y: 54, w: 120, h: 108, col: "#ffffff", lbl: "float #1 (tall)" },
      { x: 184, y: 54, w: 136, h: 64, col: "#ffd00f", lbl: "float #2" },
      { x: 332, y: 54, w: 134, h: 64, col: "#ffffff", lbl: "float #3" },
      { x: 184, y: 130, w: 140, h: 72, col: "#ff6b4a", lbl: "卡阶梯折行!" },
    ];
    for (const b of boxes) {
      ctx.fillStyle = b.col;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "#041b5e";
      ctx.fillText(b.lbl, b.x + 8, b.y + 10);
    }
    ctx.strokeStyle = "#ff6b4a";
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 174, 120, 40);
    ctx.fillStyle = "#ffd7cc";
    ctx.fillText("空洞", 96, 187);
  } else if (currentEra === 2) {
    // 2011-2012: W3C 2011 Draft / -ms-grid explicit row & col lines
    const padX = 56, padY = 50, gw = W - 112, gh = H - 102;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i <= 4; i++) {
      const x = padX + (gw * i) / 4;
      ctx.beginPath(); ctx.moveTo(x, padY); ctx.lineTo(x, padY + gh); ctx.stroke();
      ctx.fillStyle = "#ffd00f";
      ctx.fillText(String(i + 1), x - 4, padY - 18);
    }
    for (let r = 0; r <= 3; r++) {
      const y = padY + (gh * r) / 3;
      ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(padX + gw, y); ctx.stroke();
      ctx.fillStyle = "#ffd00f";
      ctx.fillText(String(r + 1), padX - 18, y - 6);
    }
    ctx.fillStyle = "rgba(255,208,15,0.88)";
    ctx.fillRect(padX + 2, padY + 2, gw * 0.75 - 4, gh / 3 - 4);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(padX + 2, padY + gh / 3 + 2, gw * 0.5 - 4, (gh * 2) / 3 - 4);
    ctx.fillStyle = "#041b5e";
    ctx.fillText("-ms-grid-column: 1; -ms-grid-column-span: 3;", padX + 12, padY + 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("W3C WD 2011-04-07 · IE10", 28, H - 34);
  } else {
    // 2017-Present: Clean native CSS Grid 2D tracks + gap + areas
    const padX = 50, padY = 44, gw = W - 100, gh = H - 94, g = 12;
    const c1 = (gw - g * 2) * 0.28, c2 = (gw - g * 2) * 0.44, c3 = (gw - g * 2) * 0.28;
    const r1 = (gh - g) * 0.54, r2 = (gh - g) * 0.46;

    ctx.fillStyle = "#063ed1";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.fillRect(padX, padY, c1, gh);
    ctx.strokeRect(padX, padY, c1, gh);

    ctx.fillStyle = "#ffd00f";
    ctx.fillRect(padX + c1 + g, padY, c2 + g + c3, r1);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(padX + c1 + g, padY + r1 + g, c2, r2);

    ctx.fillStyle = "#ffe054";
    ctx.fillRect(padX + c1 + g + c2 + g, padY + r1 + g, c3, r2);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("nav", padX + 10, padY + 12);
    ctx.fillStyle = "#041b5e";
    ctx.fillText("hero (2fr + 1fr)", padX + c1 + g + 10, padY + 12);
    ctx.fillText("main", padX + c1 + g + 10, padY + r1 + g + 12);
    ctx.fillText("aside", padX + c1 + g + c2 + g + 10, padY + r1 + g + 12);
    ctx.fillStyle = "#53f2a6";
    ctx.fillText("display: grid; gap: 12px; // FF52 · Chrome57 · Safari10.1", 28, H - 34);
  }
}

const s5Loop = loop(s5Canvas, () => drawEraCanvas());

eraBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentEra = Number(btn.dataset.era);
    eraBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const info = ERAS[currentEra];
    s5Kicker.textContent = info.kicker;
    s5Heading.textContent = info.heading;
    s5P1.textContent = info.p1;
    s5P2.textContent = info.p2;
    eraDirty = true;
    s5Loop.draw();
  });
});
drawEraCanvas();


// ==================== SECTION 06: SCENARIO VERDICT & DOM TAB ORDER ====================
const s6Visual = document.getElementById("s6-visual");
const s6Vtag = document.getElementById("s6-vtag");
const s6Vtitle = document.getElementById("s6-vtitle");
const s6Vbody = document.getElementById("s6-vbody");
const s6Extra = document.getElementById("s6-extra");
const scBtns = [...document.querySelectorAll(".sc-btn")];

let tabStep = 0;

function renderS6(key) {
  s6Extra.innerHTML = "";

  if (key === "dash") {
    s6Vtag.textContent = "推荐用 CSS Grid";
    s6Vtag.className = "s6-vtag is-use";
    s6Vtitle.textContent = "跨行跨列的二维工作区，正是 Grid 主场";
    s6Vbody.textContent = "顶栏横跨全宽、侧边导览纵跨两行、主图与指标卡上下对齐——一张二维轨道表就定死全部边界，无需层层嵌套无意义外框。";
    s6Visual.innerHTML = `
      <div class="s6-mini-dash">
        <div class="s6-md md-top">HEADER (1 / 4)</div>
        <div class="s6-md md-nav">NAV<br>2 / 4</div>
        <div class="s6-md md-hero">HERO CHART (2 / 4)</div>
        <div class="s6-md md-w">KPI A</div>
        <div class="s6-md md-w">KPI B</div>
      </div>`;
  } else if (key === "nav") {
    s6Vtag.textContent = "别硬用 Grid · 改用 226 弹性盒";
    s6Vtag.className = "s6-vtag is-avoid";
    s6Vtitle.textContent = "字数长短不一的一维标签行，强等分反而挤坏长词";
    s6Vbody.textContent = "单行导航或标签组需要按自身内容宽自然排开。硬塞进 4 等分 Grid 会让短词空一大截、长词被挤碎；交给一维 Flexbox（226）才是正道。";
    s6Visual.innerHTML = `
      <div class="s6-mini-nav">
        <div>
          <div class="s6-row-label">硬套 4 等分 Grid（短词空、长词挤）</div>
          <div class="s6-grid-nav">
            <span class="s6-chip">首页</span>
            <span class="s6-chip is-cramp">产品设计系统</span>
            <span class="s6-chip">文档</span>
            <span class="s6-chip">登录</span>
          </div>
        </div>
        <div>
          <div class="s6-row-label">改用 Flexbox（按各自内容宽舒展）</div>
          <div class="s6-flex-nav">
            <span class="s6-chip">首页</span>
            <span class="s6-chip">产品设计系统</span>
            <span class="s6-chip">文档</span>
            <span class="s6-chip">登录</span>
          </div>
        </div>
      </div>`;
  } else if (key === "masonry") {
    s6Vtag.textContent = "别硬用 Grid · 改看 236 瀑布流";
    s6Vtag.className = "s6-vtag is-avoid";
    s6Vtitle.textContent = "高差悬殊的图片集合会被行轨强行撑出大白洞";
    s6Vbody.textContent = "标准 CSS Grid 每条行轨由同排最高那张卡片决定高度，短图底下会留下扎眼的空白空洞。追求紧密咬合的图片墙更适合 236 瀑布流布局。";
    s6Visual.innerHTML = `
      <div class="s6-mini-mas">
        <div class="s6-mcard" style="height:142px">竖幅长图<br>3:5</div>
        <div>
          <div class="s6-mcard" style="height:68px">横幅短图</div>
          <div class="s6-mhole" style="height:68px">行轨撑出的空洞</div>
        </div>
        <div>
          <div class="s6-mcard" style="height:92px">中幅图</div>
          <div class="s6-mhole" style="height:44px">空洞</div>
        </div>
      </div>`;
  } else if (key === "order") {
    s6Vtag.textContent = "红线警告 · 视觉重排 ≠ 阅读顺序";
    s6Vtag.className = "s6-vtag is-avoid";
    s6Vtitle.textContent = "别用 grid-area / order 把阅读次序翻得面目全非";
    s6Vbody.textContent = "CSS Grid 能把源码里排第 4 的卡片挪到左上角，但键盘 Tab 键与读屏器依然严格按 HTML 源码 1→2→3→4 跳跃。点下面按钮模拟按 Tab 键，看焦点如何在画面上乱跳。";
    tabStep = 1;
    const renderOrderDemo = () => {
      // Visual placement is scrambled: DOM #4 top-left, DOM #2 top-right, DOM #1 bottom-left, DOM #3 bottom-right
      const items = [
        { dom: 4, label: "左上 · 源码第 4 块" },
        { dom: 2, label: "右上 · 源码第 2 块" },
        { dom: 1, label: "左下 · 源码第 1 块" },
        { dom: 3, label: "右下 · 源码第 3 块" },
      ];
      s6Visual.innerHTML = `
        <div class="s6-row-label">当前键盘 Tab 焦点落在：DOM #${tabStep}（注意视线从左下→右上→右下→左上来回横跳！）</div>
        <div class="s6-order-grid">
          ${items
            .map(
              (it) =>
                `<div class="s6-ocell ${it.dom === tabStep ? "is-focus" : ""}"><span>${it.label}</span><code>#${it.dom}</code></div>`
            )
            .join("")}
        </div>`;
    };
    renderOrderDemo();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "s6-tab-btn";
    btn.textContent = "模拟按一次 Tab 键（焦点按 DOM #1→#4 走）";
    btn.addEventListener("click", () => {
      tabStep = (tabStep % 4) + 1;
      renderOrderDemo();
    });
    s6Extra.appendChild(btn);
  }
}

scBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    scBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderS6(btn.dataset.sc);
  });
});
renderS6("dash");


// ==================== SECTION 07: BLUEPRINT QUIZ ====================
const quizGrid = document.getElementById("quiz-grid");
const qfTitle = document.getElementById("qf-title");
const qfBody = document.getElementById("qf-body");
const qCards = [...document.querySelectorAll(".q-card")];

const QUIZ_REASONS = {
  A: {
    ok: false,
    tag: "纵缝错位",
    title: "再看看红色垂直虚线：方案 A 只是两排各自为政的横条",
    body: "上行 50/50 居中切缝，下行 33/33/33 三等分——上下两排的垂直边界完全没有落在同一套列线上，丢失了二维网格最核心的「跨行共享纵轨」。正确答案是方案 B。",
  },
  B: {
    ok: true,
    tag: "正确 · 秩序成立",
    title: "选对了！方案 B 三条核心维度全部成立",
    body: "上行占 4 列 + 2 列，下行占 2 + 2 + 2 列，所有纵缝精准压在同一套 6 列基准线上（绿色虚线上下贯通）；14px 沟槽清晰隔开各栏；左上主专题面积最大，第一眼重心明确。",
  },
  C: {
    ok: false,
    tag: "沟槽粘连",
    title: "列线确实对齐了，但方案 C 败在沟槽被压成细缝",
    body: "方案 C 把列沟槽和行沟槽压到只有 3px（窄过卡片内部文字行距），相邻两栏的内容边缘几乎粘在一起，眼睛扫读时很容易直接跨栏串行。正确答案是方案 B。",
  },
  D: {
    ok: false,
    tag: "主次倒置",
    title: "列线和沟槽都对，但方案 D 把主次层级搞反了",
    body: "左上主专题被挤成小小 2 列窄块，右下辅助卡反而霸占 4 列宽 + 双倍高，把整页的视觉重心拽到了角落。网格划分区域的首要目的是明确主副层级。正确答案是方案 B。",
  },
};

qCards.forEach((card) => {
  card.addEventListener("click", () => {
    const pick = card.dataset.opt;
    quizGrid.classList.add("is-answered");
    qCards.forEach((c) => {
      const opt = c.dataset.opt;
      const info = QUIZ_REASONS[opt];
      c.classList.toggle("is-picked", opt === pick);
      c.classList.toggle("is-correct", info.ok);
      c.classList.toggle("is-wrong", opt === pick && !info.ok);
      const resEl = c.querySelector(`[data-qres="${opt}"]`);
      if (resEl) resEl.textContent = info.tag;
    });
    const chosen = QUIZ_REASONS[pick];
    qfTitle.textContent = chosen.title;
    qfBody.textContent = chosen.body;
  });
});


// ==================== SECTION 08: POSTER LIGHTBOX (ZOOM / PAN / ESC) ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbZoom = document.getElementById("lb-zoom");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoom.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src; // 只内联一次，直接复用 #poster.src
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lbScale = Math.min(4, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1; lbX = 0; lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.6, Math.min(4, +(lbScale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1.05) return;
  lbPan = { x0: e.clientX, y0: e.clientY, bx: lbX, by: lbY, pid: e.pointerId };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbPan || e.pointerId !== lbPan.pid) return;
  lbX = lbPan.bx + (e.clientX - lbPan.x0);
  lbY = lbPan.by + (e.clientY - lbPan.y0);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", (e) => {
  if (!lbPan || e.pointerId !== lbPan.pid) return;
  try { lbStage.releasePointerCapture(e.pointerId); } catch {}
  lbPan = null;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
