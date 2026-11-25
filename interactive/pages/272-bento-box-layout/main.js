import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  COLS,
  ROWS,
  MODULE_META,
  createInitialState,
  tryResize,
  tryMove,
  trySwap,
  evaluateBento,
  HIERARCHY_PRESETS,
  HISTORY_ERAS,
  computeResponsivePlan,
  calcCornerGeometry,
  QUIZ_OPTIONS,
} from "./model.js";

// ==================== 0. 开场活体便当装盒台 ====================
const state = createInitialState();
let swapArmed = false;
let blockedId = null;
let blockedTimer = 0;
let dragState = null; // { mode: 'resize'|'divider'|'move', id, pointerId, startX, startY, rect, previewX, previewY, previewW, previewH, valid, rawPxW, rawPxH }

const elGrid = document.getElementById("bento-grid");
const elSlots = document.getElementById("bento-slots");
const elCells = document.getElementById("bento-cells");
const elXray = document.getElementById("bento-xray");
const elMiniSvg = document.getElementById("mini-bento-svg");
const elScoreBadge = document.getElementById("hero-score-badge");
const elScoreSub = document.getElementById("hero-score-sub");

const elSelSwatch = document.getElementById("sel-swatch");
const elSelName = document.getElementById("sel-name");
const elSelSpan = document.getElementById("sel-span");
const elValW = document.getElementById("val-w");
const elValH = document.getElementById("val-h");
const btnWDec = document.getElementById("btn-w-dec");
const btnWInc = document.getElementById("btn-w-inc");
const btnHDec = document.getElementById("btn-h-dec");
const btnHInc = document.getElementById("btn-h-inc");
const btnSwapMode = document.getElementById("btn-swap-mode");
const elSwapHint = document.getElementById("swap-hint");
const btnXray = document.getElementById("btn-xray");
const btnReset = document.getElementById("btn-reset");

const elDiagCard = document.getElementById("diag-card");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagBody = document.getElementById("diag-body");
const elDiagHint = document.getElementById("diag-hint");
const elDiagAreas = document.getElementById("diag-areas");
const elMFill = document.getElementById("m-fill");
const elMRatio = document.getElementById("m-ratio");
const elMGap = document.getElementById("m-gap");

// 生成 12 格空槽底座
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const slot = document.createElement("div");
    slot.className = "bslot";
    slot.dataset.x = String(c);
    slot.dataset.y = String(r);
    slot.innerHTML = `空仓<span>${c + 1},${r + 1}</span>`;
    elSlots.appendChild(slot);
  }
}

function cellArtworkHTML(id) {
  if (id === "headline") {
    return `<div class="bcell-art art-pink-wrap" aria-hidden="true"><span class="disc"></span><span class="moon"></span></div>`;
  }
  if (id === "highlight") {
    return `<div class="bcell-art art-cream-wrap" aria-hidden="true"><svg viewBox="0 0 60 60"><path d="M30 4l4 15 14-7-7 14 15 4-15 4 7 14-14-7-4 15-4-15-14 7 7-14-15-4 15-4-7-14 14 7z"/></svg></div>`;
  }
  if (id === "content") {
    return `<div class="bcell-art art-peach-wrap" aria-hidden="true"><div class="art-peach-top"><span class="art-peach-pic"></span><span class="art-peach-bars"><i></i><i></i><i></i></span></div><div class="art-peach-chips"><i></i><i></i><i></i></div></div>`;
  }
  if (id === "support") {
    return `<div class="bcell-art art-mint-wrap" aria-hidden="true"><svg viewBox="0 0 60 52"><path d="M30 6C16 6 6 14 6 24c0 5 3 10 8 13l-3 9 10-5c3 1 6 1 9 1 14 0 24-8 24-18S44 6 30 6z"/><circle cx="20" cy="24" r="2.6" fill="#D7E9D1"/><circle cx="30" cy="24" r="2.6" fill="#D7E9D1"/><circle cx="40" cy="24" r="2.6" fill="#D7E9D1"/></svg></div>`;
  }
  return `<div class="bcell-art art-butter-wrap" aria-hidden="true"><i></i><i></i></div>`;
}

// 渲染 5 个持久化仓位 DOM（复用节点避免拖动丢焦）
const cellEls = new Map();
for (const c of state.cells) {
  const meta = MODULE_META[c.id];
  const node = document.createElement("div");
  node.className = "bcell";
  node.dataset.id = c.id;
  node.dataset.tone = meta.tone;
  node.tabIndex = 0;
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", `${meta.name}，当前 ${c.w} 列 ${c.h} 行，方向键移位，Shift 加方向键调尺寸`);
  node.innerHTML = `
    <div class="bcell-top">
      <div class="bcell-id">
        <span class="bcell-en" lang="en">${meta.no} · ${meta.en}</span>
        <p class="bcell-name">${meta.name}</p>
      </div>
      <span class="bcell-span" lang="en">${c.w}×${c.h}</span>
    </div>
    <p class="bcell-copy">${meta.short}</p>
    ${cellArtworkHTML(c.id)}
    <button type="button" class="bcell-grip" aria-label="拖动调整${meta.name}宽高">↘</button>
    ${c.id === "support" ? `<button type="button" class="bcell-divider" data-perf-drag aria-label="左右拖动青绿隔板调整补充说明区宽度"><span class="bcell-divider-pill" aria-hidden="true"><i></i><i></i><i></i></span></button>` : ""}
  `;
  elCells.appendChild(node);
  cellEls.set(c.id, node);
}

function flashBlocked(id, msg) {
  blockedId = id || null;
  clearTimeout(blockedTimer);
  if (msg) elDiagHint.textContent = msg;
  renderCells();
  blockedTimer = setTimeout(() => {
    blockedId = null;
    renderCells();
  }, 900);
}

// 实时同步右上原海报同款迷你便当饭盒 SVG
function renderMiniLunchbox(ev) {
  const pad = 12;
  const innerX = 20;
  const innerY = 18;
  const innerW = 140;
  const innerH = 104;
  const g = state.gutter <= 6 ? 2 : state.gutter >= 24 ? 7 : 4;
  const cw = (innerW - g * (COLS - 1)) / COLS;
  const ch = (innerH - g * (ROWS - 1)) / ROWS;

  const foodFill = {
    headline: "#FD887E", // 三文鱼主菜
    highlight: "#FFFDF7", // 梅干米饭
    content: "#FCC459", // 玉子蛋卷与配菜
    support: "#46A665", // 西兰花绿蔬
    action: "#FB643C", // 樱桃番茄
  };

  let shapes = `
    <rect x="10" y="10" width="166" height="128" rx="22" fill="#B7D8A3"/>
    <rect x="6" y="6" width="164" height="126" rx="22" fill="#FFF4DD" stroke="#FFFFFF" stroke-width="2.5"/>
    <rect x="14" y="13" width="148" height="112" rx="15" fill="#FFCD9C"/>
  `;

  // 空槽虚线显示
  for (const hole of ev.emptyCoords) {
    const x = innerX + hole.x * (cw + g);
    const y = innerY + hole.y * (ch + g);
    shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="5" fill="#FFF4DD" fill-opacity="0.55" stroke="#B66B36" stroke-width="1.2" stroke-dasharray="3 2"/>`;
  }

  // 每个仓位按真实比例映射到迷你便当饭菜
  for (const c of state.cells) {
    const x = innerX + c.x * (cw + g);
    const y = innerY + c.y * (ch + g);
    const w = c.w * cw + (c.w - 1) * g;
    const h = c.h * ch + (c.h - 1) * g;
    const cx = x + w / 2;
    const cy = y + h / 2;
    shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="6" fill="${foodFill[c.id]}" stroke="#FFF4DD" stroke-width="1.5"/>`;
    if (c.id === "highlight") {
      // 白米饭 + 红梅干 + 芝麻点
      const r = Math.min(w, h) * 0.22;
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="#FD7972"/>`;
      shapes += `<circle cx="${(x + w * 0.25).toFixed(1)}" cy="${(y + h * 0.28).toFixed(1)}" r="1.4" fill="#222"/>`;
      shapes += `<circle cx="${(x + w * 0.76).toFixed(1)}" cy="${(y + h * 0.72).toFixed(1)}" r="1.4" fill="#222"/>`;
    } else if (c.id === "headline") {
      // 三文鱼斜纹
      shapes += `<path d="M${(x + 6).toFixed(1)} ${(y + h - 5).toFixed(1)} Q${cx.toFixed(1)} ${(y + 5).toFixed(1)} ${(x + w - 6).toFixed(1)} ${(y + 8).toFixed(1)}" fill="none" stroke="#FDC6BF" stroke-width="2.2" stroke-linecap="round"/>`;
    } else if (c.id === "support") {
      // 西兰花朵
      const r = Math.min(w, h) * 0.24;
      shapes += `<circle cx="${(cx - r * 0.6).toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="#1E873F"/>`;
      shapes += `<circle cx="${(cx + r * 0.6).toFixed(1)}" cy="${(cy - r * 0.2).toFixed(1)}" r="${(r * 0.9).toFixed(1)}" fill="#269A4A"/>`;
    } else if (c.id === "content") {
      // 煎蛋蛋白圈
      const r = Math.min(w, h) * 0.28;
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 1.15).toFixed(1)}" fill="#FFFDF7"/>`;
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.62).toFixed(1)}" fill="#F6A429"/>`;
    }
  }

  if (ev.status === "pass") {
    shapes += `<circle cx="156" cy="20" r="11" fill="#175C37" stroke="#fff" stroke-width="2"/><path d="M151 20l3.5 3.5 6.5-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  elMiniSvg.innerHTML = shapes;
  void pad;
}

function renderCells() {
  elGrid.style.setProperty("--tray-gap", `${state.gutter}px`);
  for (const c of state.cells) {
    const node = cellEls.get(c.id);
    const meta = MODULE_META[c.id];
    const area = c.w * c.h;
    node.style.gridColumn = `${c.x + 1} / span ${c.w}`;
    node.style.gridRow = `${c.y + 1} / span ${c.h}`;
    node.dataset.selected = String(state.selectedId === c.id);
    node.dataset.size = area >= 4 ? "big" : area >= 2 ? "mid" : "tiny";
    node.classList.toggle("is-swap-ready", swapArmed && state.selectedId !== c.id);
    node.classList.toggle("is-blocked", blockedId === c.id);
    node.querySelector(".bcell-span").textContent = `${c.w}×${c.h}`;
    node.setAttribute("aria-label", `${meta.name}，位置第 ${c.x + 1} 列第 ${c.y + 1} 行，尺寸 ${c.w}×${c.h}`);
  }
}

let cachedEv = evaluateBento(state);
let cachedGridW = 0;
let cachedGridH = 0;
let xrayDirty = true;

function measureGrid() {
  const r = elGrid.getBoundingClientRect();
  cachedGridW = r.width;
  cachedGridH = r.height;
  xrayDirty = true;
}
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(measureGrid).observe(elGrid);
}

function renderAll() {
  renderCells();
  const ev = evaluateBento(state);
  cachedEv = ev;
  const sel = state.cells.find((c) => c.id === state.selectedId) || state.cells[0];
  const selMeta = MODULE_META[sel.id];

  elSelSwatch.style.background = selMeta.fill;
  elSelName.textContent = `${selMeta.no} ${selMeta.name}`;
  elSelSpan.textContent = `${sel.w}×${sel.h}（${sel.w * sel.h} 格）`;
  elValW.textContent = String(sel.w);
  elValH.textContent = String(sel.h);
  btnWDec.disabled = sel.w <= 1;
  btnWInc.disabled = sel.w >= COLS;
  btnHDec.disabled = sel.h <= 1;
  btnHInc.disabled = sel.h >= ROWS;

  document.querySelectorAll("[data-gutter]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.gutter) === state.gutter));
  });
  btnSwapMode.setAttribute("aria-pressed", String(swapArmed));
  elSwapHint.textContent = swapArmed
    ? `请点击另一仓，与「${selMeta.name}」互换格位`
    : "点此按钮后再点另一仓即可互换";
  btnXray.setAttribute("aria-pressed", String(state.xray));
  btnXray.textContent = `格栅透视：${state.xray ? "开" : "关"}`;

  elScoreBadge.textContent = ev.badge;
  elScoreBadge.dataset.state = ev.status;
  elScoreSub.textContent = ev.status === "pass" ? "四步全达标，继续互换试不同构图" : "拖中间青绿隔板或点仓调格";

  elDiagCard.dataset.state = ev.status;
  elDiagBadge.textContent = ev.badge;
  elDiagTitle.textContent = ev.headline;
  elDiagBody.textContent = ev.explanation;
  if (!blockedId) elDiagHint.textContent = ev.nextHint;
  elMFill.textContent = `填满 ${ev.filled}/12`;
  elMRatio.textContent = `级差 ${ev.areaRatio.toFixed(1)}×`;
  elMGap.textContent = `缝 ${state.gutter}px`;
  elDiagAreas.textContent = ev.areasCss.join("\n");

  // 原海报底部四步法验收带实时同步
  for (const st of ev.steps) {
    const li = document.querySelector(`.step-item[data-step="${st.key}"]`);
    if (li) {
      li.dataset.ok = String(st.ok);
      li.querySelector(".step-live").textContent = st.note;
    }
  }

  renderMiniLunchbox(ev);
  xrayDirty = true;
  if (reducedMotion.matches) xrayLoop.draw();
}

// 2D Canvas 格栅与重心透视层（按需重绘，开场缓动与拖动期间每帧平滑渲染）
let introElapsed = 0;
function drawXray(t, dt, { still }) {
  if (!cachedGridW || !cachedGridH) measureGrid();
  const rwBox = cachedGridW;
  const rhBox = cachedGridH;
  if (rwBox < 20 || rhBox < 20) return;

  const introRunning = !still && introElapsed < 0.9;
  if (introRunning && dt > 0) {
    introElapsed = Math.min(0.9, introElapsed + dt);
    xrayDirty = true;
  }
  if (!still && !xrayDirty && !dragState) return;
  xrayDirty = false;

  const dpr = window.innerWidth <= 540 ? 1 : pixelRatio(1.5);
  const w = Math.round(rwBox * dpr);
  const h = Math.round(rhBox * dpr);
  if (elXray.width !== w || elXray.height !== h) {
    elXray.width = w;
    elXray.height = h;
  }
  const ctx = elXray.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rwBox, rhBox);

  const introP = still ? 1 : Math.min(1, introElapsed / 0.85);
  const ev = cachedEv;
  const gap = state.gutter;
  const cw = (rwBox - gap * (COLS - 1)) / COLS;
  const ch = (rhBox - gap * (ROWS - 1)) / ROWS;

  // 透视线与面积重心（开启透视或正在拖动时绘制）
  if (state.xray || dragState) {
    ctx.save();
    ctx.strokeStyle = "rgba(26, 92, 56, 0.34)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let c = 1; c < COLS; c++) {
      const gx = c * cw + (c - 0.5) * gap;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, rhBox * introP);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      const gy = r * ch + (r - 0.5) * gap;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(rwBox * introP, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 重心标记点（由实算面积加权得出）
    const cx = ev.comX * rwBox;
    const cy = ev.comY * rhBox;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.strokeStyle = ev.status === "pass" ? "rgba(23, 92, 55, 0.78)" : "rgba(142, 24, 56, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = ev.status === "pass" ? "#175C37" : "#8E1838";
    ctx.fill();
    ctx.restore();
  }

  // 拖动实时橡皮筋外框与像素读数（拖动中每帧重绘）
  if (dragState) {
    ctx.save();
    const { mode, id, rawPxX, rawPxY, rawPxW, rawPxH, previewW, previewH, valid } = dragState;
    const stroke = valid ? "#175C37" : "#9F1E3F";
    ctx.strokeStyle = stroke;
    ctx.fillStyle = valid ? "rgba(89, 179, 131, 0.18)" : "rgba(254, 125, 162, 0.22)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    const rx = Math.max(2, Math.min(rwBox - 20, rawPxX));
    const ry = Math.max(2, Math.min(rhBox - 20, rawPxY));
    const rw = Math.max(24, Math.min(rwBox - rx - 2, rawPxW));
    const rh = Math.max(24, Math.min(rhBox - ry - 2, rawPxH));
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 12);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // 标尺标签
    const label =
      mode === "move"
        ? `挪移 ${MODULE_META[id].name}`
        : `${previewW}×${previewH} · ${Math.round(rw)}px`;
    ctx.font = '700 12px "Outfit", "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(label).width + 16;
    const lx = Math.max(6, Math.min(rwBox - tw - 6, rx + rw - tw));
    const ly = Math.max(6, ry + 6);
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.roundRect(lx, ly, tw, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(label, lx + 8, ly + 15);
    ctx.restore();
  }
  void t;
}

const xrayLoop = loop(elGrid, drawXray);

// 指针交互：支持中央隔板柄（data-perf-drag）、每仓右下角柄、以及整仓拖动挪位/互换
function startDrag(e, mode, id) {
  if (e.button && e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  state.selectedId = id;
  swapArmed = false;

  const gridRect = elGrid.getBoundingClientRect();
  cachedGridW = gridRect.width;
  cachedGridH = gridRect.height;
  const cell = state.cells.find((c) => c.id === id);
  const gap = state.gutter;
  const cw = (gridRect.width - gap * (COLS - 1)) / COLS;
  const ch = (gridRect.height - gap * (ROWS - 1)) / ROWS;

  const basePxX = cell.x * (cw + gap);
  const basePxY = cell.y * (ch + gap);
  const basePxW = cell.w * cw + (cell.w - 1) * gap;
  const basePxH = cell.h * ch + (cell.h - 1) * gap;

  dragState = {
    mode,
    id,
    pointerId: e.pointerId,
    gridRect,
    startClientX: e.clientX,
    startClientY: e.clientY,
    baseCell: { ...cell },
    basePxX,
    basePxY,
    basePxW,
    basePxH,
    rawPxX: basePxX,
    rawPxY: basePxY,
    rawPxW: basePxW,
    rawPxH: basePxH,
    previewW: cell.w,
    previewH: cell.h,
    valid: true,
    moved: false,
  };

  if (mode === "move") {
    cellEls.get(id).classList.add("is-dragging");
  }
  renderAll();
}

function onPointerMove(e) {
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  const gridRect = dragState.gridRect;
  const gap = state.gutter;
  const cw = (gridRect.width - gap * (COLS - 1)) / COLS;
  const ch = (gridRect.height - gap * (ROWS - 1)) / ROWS;
  const dx = e.clientX - dragState.startClientX;
  const dy = e.clientY - dragState.startClientY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragState.moved = true;

  if (dragState.mode === "divider" || dragState.mode === "resize") {
    const rawW = Math.max(cw * 0.55, Math.min(gridRect.width - dragState.basePxX, dragState.basePxW + dx));
    const rawH =
      dragState.mode === "divider"
        ? dragState.basePxH
        : Math.max(ch * 0.55, Math.min(gridRect.height - dragState.basePxY, dragState.basePxH + dy));

    const targetW = Math.max(1, Math.min(COLS, Math.round((rawW + gap) / (cw + gap))));
    const targetH =
      dragState.mode === "divider"
        ? state.cells.find((c) => c.id === dragState.id).h
        : Math.max(1, Math.min(ROWS, Math.round((rawH + gap) / (ch + gap))));

    dragState.rawPxW = rawW;
    dragState.rawPxH = rawH;
    dragState.previewW = targetW;
    dragState.previewH = targetH;

    const current = state.cells.find((c) => c.id === dragState.id);
    if (targetW !== current.w || targetH !== current.h) {
      const res = tryResize(state.cells, dragState.id, targetW, targetH);
      dragState.valid = res.ok;
      if (res.ok && res.changed) {
        state.cells = res.cells;
        const updated = state.cells.find((c) => c.id === dragState.id);
        dragState.rawPxX = updated.x * (cw + gap);
        dragState.rawPxY = updated.y * (ch + gap);
        renderAll();
      } else if (!res.ok) {
        flashBlocked(res.blockerId, res.reason);
      }
    } else {
      dragState.valid = true;
    }
    xrayDirty = true;
  } else if (dragState.mode === "move") {
    dragState.rawPxX = dragState.basePxX + dx;
    dragState.rawPxY = dragState.basePxY + dy;
    // 高亮悬停空槽
    const px = e.clientX - gridRect.left;
    const py = e.clientY - gridRect.top;
    const gx = Math.max(0, Math.min(COLS - 1, Math.floor(px / (cw + gap))));
    const gy = Math.max(0, Math.min(ROWS - 1, Math.floor(py / (ch + gap))));
    elSlots.querySelectorAll(".bslot").forEach((s) => {
      s.classList.toggle("is-drop-target", Number(s.dataset.x) === gx && Number(s.dataset.y) === gy);
    });
    xrayDirty = true;
  }
}

function onPointerEnd(e) {
  if (!dragState || e.pointerId !== dragState.pointerId) return;
  const ds = dragState;
  dragState = null;
  cellEls.get(ds.id)?.classList.remove("is-dragging");
  elSlots.querySelectorAll(".bslot.is-drop-target").forEach((s) => s.classList.remove("is-drop-target"));

  if (ds.mode === "move" && ds.moved) {
    const gridRect = elGrid.getBoundingClientRect();
    const gap = state.gutter;
    const cw = (gridRect.width - gap * (COLS - 1)) / COLS;
    const ch = (gridRect.height - gap * (ROWS - 1)) / ROWS;
    const px = e.clientX - gridRect.left;
    const py = e.clientY - gridRect.top;
    const gx = Math.max(0, Math.min(COLS - 1, Math.floor(px / (cw + gap))));
    const gy = Math.max(0, Math.min(ROWS - 1, Math.floor(py / (ch + gap))));
    // 看看落点是否在另一仓上 → 直接互换格位
    const hit = state.cells.find(
      (c) => c.id !== ds.id && gx >= c.x && gx < c.x + c.w && gy >= c.y && gy < c.y + c.h
    );
    const res = hit ? trySwap(state.cells, ds.id, hit.id) : tryMove(state.cells, ds.id, gx, gy);
    if (res.ok && res.changed) state.cells = res.cells;
    else if (!res.ok && res.reason) flashBlocked(null, res.reason);
  }
  renderAll();
}

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerup", onPointerEnd);
window.addEventListener("pointercancel", onPointerEnd);

// 绑定每仓事件（点击选中 / 互换、键盘方向键与 Shift+方向键、手柄拖动）
for (const [id, node] of cellEls.entries()) {
  const grip = node.querySelector(".bcell-grip");
  grip.addEventListener("pointerdown", (e) => startDrag(e, "resize", id));

  const divider = node.querySelector(".bcell-divider");
  if (divider) {
    divider.addEventListener("pointerdown", (e) => startDrag(e, "divider", id));
  }

  node.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    if (swapArmed && state.selectedId !== id) {
      const res = trySwap(state.cells, state.selectedId, id);
      if (res.ok) state.cells = res.cells;
      swapArmed = false;
      state.selectedId = id;
      renderAll();
      return;
    }
    state.selectedId = id;
    renderAll();
    // 鼠标拖动整仓挪位（触屏上单指保留给页面滚动，用「互换格位」按钮或手柄）
    if (e.pointerType === "mouse") {
      startDrag(e, "move", id);
    }
  });

  node.addEventListener("keydown", (e) => {
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      e.preventDefault();
      const [dx, dy] = dirs[e.key];
      const cur = state.cells.find((c) => c.id === id);
      const res = e.shiftKey
        ? tryResize(state.cells, id, cur.w + dx, cur.h + dy)
        : tryMove(state.cells, id, cur.x + dx, cur.y + dy);
      if (res.ok && res.changed) {
        state.cells = res.cells;
        renderAll();
      } else if (!res.ok) {
        flashBlocked(res.blockerId, res.reason);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (swapArmed && state.selectedId !== id) {
        const res = trySwap(state.cells, state.selectedId, id);
        if (res.ok) state.cells = res.cells;
        swapArmed = false;
      }
      state.selectedId = id;
      renderAll();
    }
  });
}

// 操控面板按钮绑定
function adjustSelected(dw, dh) {
  const cur = state.cells.find((c) => c.id === state.selectedId);
  if (!cur) return;
  const res = tryResize(state.cells, cur.id, cur.w + dw, cur.h + dh);
  if (res.ok && res.changed) {
    state.cells = res.cells;
    renderAll();
  } else if (!res.ok) {
    flashBlocked(res.blockerId, res.reason);
  }
}

btnWDec.addEventListener("click", () => adjustSelected(-1, 0));
btnWInc.addEventListener("click", () => adjustSelected(1, 0));
btnHDec.addEventListener("click", () => adjustSelected(0, -1));
btnHInc.addEventListener("click", () => adjustSelected(0, 1));

document.querySelectorAll("[data-gutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gutter = Number(btn.dataset.gutter);
    renderAll();
  });
});

btnSwapMode.addEventListener("click", () => {
  swapArmed = !swapArmed;
  renderAll();
});

btnXray.addEventListener("click", () => {
  state.xray = !state.xray;
  renderAll();
});

btnReset.addEventListener("click", () => {
  const fresh = createInitialState();
  state.cells = fresh.cells;
  state.gutter = fresh.gutter;
  state.selectedId = fresh.selectedId;
  swapArmed = false;
  blockedId = null;
  renderAll();
});

window.addEventListener("resize", () => {
  measureGrid();
  if (reducedMotion.matches) xrayLoop.draw();
  renderHierarchy();
});
renderAll();

// ==================== 01 边界显影推窗 ====================
const crStage = document.getElementById("cr-stage");
const crRange = document.getElementById("cr-range");
const crDivider = document.getElementById("cr-divider");
const crReadout = document.getElementById("cr-readout");

function setSplit(pct) {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  crRange.value = String(v);
  crStage.style.setProperty("--split", `${v}%`);
  const boxed = 100 - v;
  const risk = boxed >= 80 ? "低（清晰分仓）" : boxed <= 25 ? "高（邻组易串味）" : "对比中";
  crReadout.textContent = `仓界覆盖 ${boxed}% · 串味风险：${risk}（示意）`;
}
crRange.addEventListener("input", () => setSplit(Number(crRange.value)));

let crDragging = false;
function updateSplitFromClient(clientX) {
  const r = crStage.getBoundingClientRect();
  setSplit(((clientX - r.left) / r.width) * 100);
}
crDivider.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  crDragging = true;
  crDivider.setPointerCapture(e.pointerId);
  updateSplitFromClient(e.clientX);
});
crDivider.addEventListener("pointermove", (e) => {
  if (crDragging) updateSplitFromClient(e.clientX);
});
crDivider.addEventListener("pointerup", () => { crDragging = false; });
crDivider.addEventListener("pointercancel", () => { crDragging = false; });
setSplit(52);

// ==================== 02 面积就是音量 ====================
let hierKey = "balanced";
let hierOverflow = false;
const elHierGrid = document.getElementById("hier-grid");
const elHierSvg = document.getElementById("hier-svg");
const elHierRatio = document.getElementById("hier-ratio");
const elHierVerdict = document.getElementById("hier-verdict");
const btnHierOverflow = document.getElementById("hier-overflow-btn");

function renderHierarchy() {
  const preset = HIERARCHY_PRESETS[hierKey];
  document.querySelectorAll("[data-hier]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.hier === hierKey));
  });
  btnHierOverflow.setAttribute("aria-pressed", String(hierOverflow));
  btnHierOverflow.textContent = `溢文压测：${hierOverflow ? "开" : "关"}`;

  elHierGrid.innerHTML = preset.order
    .map((item) => {
      const cramped = hierOverflow && parseFloat(item.share) <= 15;
      return `
        <div class="hier-cell ${cramped ? "is-overflow-warn" : ""}" data-tone="${item.tone}" style="grid-column:${item.cols};grid-row:${item.rows}">
          <div class="hier-cell-top">
            <span class="hier-rank">${item.rank}</span>
            <span class="hier-share" lang="en">${item.share}</span>
          </div>
          <div>
            <h3>${item.title}</h3>
            <p>${hierOverflow ? item.longCopy : item.shortCopy}</p>
            ${cramped ? `<span class="hier-warn-tag">⚠ 长文撑挤 1×1 小格</span>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  const drawHierPath = () => {
    const w = Math.max(200, elHierGrid.clientWidth);
    const h = Math.max(140, elHierGrid.clientHeight);
    elHierSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    elHierSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const coords = preset.path.map(([px, py]) => [(px / 100) * w, (py / 100) * h]);
    const pts = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    elHierSvg.innerHTML = `
      <polyline points="${pts}" fill="none" stroke="#164C2E" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>
      ${coords.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#164C2E" stroke="#FFFFFF" stroke-width="2"/>`).join("")}
    `;
  };
  requestAnimationFrame(drawHierPath);

  elHierRatio.textContent = hierOverflow ? `${preset.ratioText} · 溢文测试中` : preset.ratioText;
  elHierVerdict.textContent = hierOverflow
    ? "长文案一灌进小格，原本精致的 1×1 轻配仓立刻被撑高或折成碎行——说明便当盒必须按仓位体量控字数，而非「随便塞什么都灵活」。"
    : preset.verdict;
}

document.querySelectorAll("[data-hier]").forEach((btn) => {
  btn.addEventListener("click", () => {
    hierKey = btn.dataset.hier;
    renderHierarchy();
  });
});
btnHierOverflow.addEventListener("click", () => {
  hierOverflow = !hierOverflow;
  renderHierarchy();
});
renderHierarchy();

// ==================== 03 从漆盒到网格 ====================
let eraId = "shokado";
const elEraBp = document.getElementById("era-blueprint");
const elEraCode = document.getElementById("era-code");
const elEraSub = document.getElementById("era-sub");
const elEraTitle = document.getElementById("era-title");
const elEraBody = document.getElementById("era-body");

function renderEra() {
  const era = HISTORY_ERAS.find((x) => x.id === eraId) || HISTORY_ERAS[0];
  document.querySelectorAll("[data-era]").forEach((b) => {
    b.setAttribute("aria-selected", String(b.dataset.era === era.id));
  });
  elEraBp.style.gridTemplateColumns = `repeat(${era.cols}, minmax(0, 1fr))`;
  elEraBp.style.gridTemplateRows = `repeat(${era.rows}, minmax(68px, 1fr))`;
  elEraBp.innerHTML = era.cells
    .map(
      (c) => `
      <div class="era-cell" data-tone="${c.tone}" style="grid-area:${c.area}">
        <strong>${c.label}</strong>
        <span>${c.sub}</span>
      </div>`
    )
    .join("");
  elEraCode.textContent = `grid-template-areas:\n  ${era.code.join("\n  ")};`;
  elEraSub.textContent = era.sub;
  elEraTitle.textContent = `${era.year} · ${era.title}`;
  elEraBody.textContent = era.summary;
}

document.querySelectorAll("[data-era]").forEach((btn) => {
  btn.addEventListener("click", () => {
    eraId = btn.dataset.era;
    renderEra();
  });
});
renderEra();

// ==================== 04 窄屏怎么不散架 ====================
let respWidth = 390;
let respStrategy = "shrink"; // 开场停在错法，让用户切到「正解」立刻看到差异
const elRespSlider = document.getElementById("resp-width");
const elRespWVal = document.getElementById("resp-w-val");
const elRespBadge = document.getElementById("resp-badge");
const elRespFrame = document.getElementById("resp-frame");
const elRespGrid = document.getElementById("resp-grid");
const elRespMinW = document.getElementById("resp-min-w");
const elRespReason = document.getElementById("resp-reason");
const elRespCode = document.getElementById("resp-code");

const RESP_ITEMS = [
  { code: "H", name: "大标题区", sub: "核心卖点", tone: "pink" },
  { code: "P", name: "重点指标", sub: "32h 续航", tone: "cream" },
  { code: "C", name: "内容主体", sub: "声波图文", tone: "peach" },
  { code: "S", name: "补充说明", sub: "28g 参数", tone: "mint" },
  { code: "A", name: "快捷入口", sub: "预订按钮", tone: "butter" },
];

function renderResponsive() {
  const plan = computeResponsivePlan(respWidth, respStrategy);
  elRespSlider.value = String(plan.width);
  elRespWVal.textContent = `${plan.width}px`;
  elRespBadge.textContent = plan.badge;
  elRespBadge.dataset.ok = String(plan.ok);
  elRespFrame.style.maxWidth = `${plan.width}px`;
  elRespFrame.classList.toggle("is-crushed", !plan.ok && respStrategy === "shrink");

  elRespGrid.style.gridTemplateColumns = `repeat(${plan.cols}, minmax(0, 1fr))`;
  elRespGrid.style.gap = `${plan.gap}px`;
  elRespGrid.style.gridTemplateAreas = plan.areas.join(" ");
  elRespGrid.innerHTML = RESP_ITEMS.map(
    (it) => `<div class="resp-cell" data-tone="${it.tone}" style="grid-area:${it.code}"><b>${it.name}</b><span>${it.sub}</span></div>`
  ).join("");

  elRespMinW.textContent = `${plan.minCellW}px`;
  elRespReason.textContent = plan.reason;
  elRespCode.textContent = `/* ${plan.width}px · ${plan.cols} 列 */\ngrid-template-areas:\n  ${plan.areas.join("\n  ")};`;

  document.querySelectorAll("[data-resp-mode]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.respMode === respStrategy));
  });
}

elRespSlider.addEventListener("input", () => {
  respWidth = Number(elRespSlider.value);
  renderResponsive();
});
document.querySelectorAll("[data-resp-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    respStrategy = btn.dataset.respMode;
    renderResponsive();
  });
});
document.querySelectorAll("[data-resp-w]").forEach((btn) => {
  btn.addEventListener("click", () => {
    respWidth = Number(btn.dataset.respW);
    renderResponsive();
  });
});
renderResponsive();

// ==================== 05 什么时候别用（试装体检器） ====================
const SCENARIOS = {
  article: {
    fit: "bad",
    pill: "别硬装进便当盒",
    title: "三千字深度报道被格板切碎，读完一段不知去哪找下句",
    desc: "连续论述依赖前后文顺流衔接。硬把第 1–4 段拆到大小不一的四格后，眼球不得不在左右与上下间反复跳跃，刚建立的思维线瞬间断裂。",
    alt: "更适合：单栏长文版式，或按时间推进的信息流布局（269）。",
    boxes: [
      { title: "第一段：引子…", note: "读到半句被迫换行跳格", area: "1 / 1 / 3 / 3", cls: "is-bad" },
      { title: "第三段？", note: "顺序误判", area: "1 / 3 / 2 / 5", cls: "is-bad" },
      { title: "第二段（截断）", note: "字数溢出被裁", area: "2 / 3 / 3 / 4", cls: "is-bad" },
      { title: "第四段尾句", note: "孤立角落", area: "2 / 4 / 3 / 5", cls: "is-bad" },
    ],
  },
  compare: {
    fit: "bad",
    pill: "别硬装进便当盒",
    title: "48 款耳机强排大小格，面积差制造虚假「推荐偏见」",
    desc: "比价与筛选需要公平对齐：价格、频响、续航必须在同一纵列一眼扫比。便当盒强行放大某一款，既让用户误以为它更值得买，又让其余款难以同项对照。",
    alt: "更适合：卡片网格布局（270）或数据表格布局（274）。",
    boxes: [
      { title: "A 款 ¥399", note: "为什么它占 4 格？广告吗？", area: "1 / 1 / 3 / 3", cls: "is-bad" },
      { title: "B 款 ¥429", note: "参数被挤没", area: "1 / 3 / 2 / 4", cls: "is-bad" },
      { title: "C 款 ¥389", note: "价格对齐错位", area: "1 / 4 / 2 / 5", cls: "is-bad" },
      { title: "D/E/F 款…", note: "还有 42 款装不下", area: "2 / 3 / 3 / 5", cls: "is-bad" },
    ],
  },
  approval: {
    fit: "bad",
    pill: "别硬装进便当盒",
    title: "报销审批有强前后序，二维格栅让人直接跳过第二步",
    desc: "二维便当盒鼓励视线自由跳转，这在展示页是优点，在强顺序流程里却是陷阱——填写者很容易先点最醒目的「提交」而漏掉中间的发票核验。",
    alt: "更适合：表单布局（284）或分步表单（285）。",
    boxes: [
      { title: "③ 立即提交", note: "放得太大，用户最先点错", area: "1 / 1 / 3 / 3", cls: "is-bad" },
      { title: "① 选部门", note: "缩在右上角", area: "1 / 3 / 2 / 4", cls: "is-bad" },
      { title: "② 传发票", note: "容易漏看", area: "1 / 4 / 2 / 5", cls: "is-bad" },
      { title: "备注说明", note: "干扰主线", area: "2 / 3 / 3 / 5", cls: "is-bad" },
    ],
  },
  launch: {
    fit: "good",
    pill: "最适合便当盒",
    title: "新品发布卖点总览：5 组异质亮点互不依赖，一屏打包看清",
    desc: "芯片性能、续航小时数、屏幕观感、重量参数与预订入口各自独立、字数可控。装进大小错落的便当盒后，读者两秒就能抓出主卖点，还能按兴趣随手扫读配菜。",
    alt: "适用诀窍：单屏控制 4–7 仓，确保最大主仓一眼定调。",
    boxes: [
      { title: "M 系自研芯片", note: "主仓 2×2 · 第一眼锚点", area: "1 / 1 / 3 / 3", cls: "is-good-pink" },
      { title: "32h 续航", note: "点睛指标", area: "1 / 3 / 2 / 5", cls: "is-good-cream" },
      { title: "屏幕实拍对比", note: "图文主体", area: "2 / 3 / 3 / 4", cls: "is-good-peach" },
      { title: "28g · 预订", note: "轻配角收尾", area: "2 / 4 / 3 / 5", cls: "is-good-mint" },
    ],
  },
};

let scenKey = "article";
const elScenPreview = document.getElementById("scen-preview");
const elScenPill = document.getElementById("scen-pill");
const elScenTitle = document.getElementById("scen-title");
const elScenDesc = document.getElementById("scen-desc");
const elScenAlt = document.getElementById("scen-alt");

function renderScenario() {
  const sc = SCENARIOS[scenKey];
  document.querySelectorAll("[data-scen]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.scen === scenKey));
  });
  elScenPill.dataset.fit = sc.fit;
  elScenPill.textContent = sc.pill;
  elScenTitle.textContent = sc.title;
  elScenDesc.textContent = sc.desc;
  elScenAlt.textContent = sc.alt;
  elScenPreview.innerHTML = sc.boxes
    .map(
      (b) => `
      <div class="scen-box ${b.cls}" style="grid-area:${b.area}">
        <strong>${b.title}</strong>
        <em>${b.note}</em>
      </div>`
    )
    .join("");
}

document.querySelectorAll("[data-scen]").forEach((btn) => {
  btn.addEventListener("click", () => {
    scenKey = btn.dataset.scen;
    renderScenario();
  });
});
renderScenario();

// ==================== 06 同心圆角显微放大镜（2D Canvas） ====================
const elCornerCanvas = document.getElementById("corner-canvas");
const elRin = document.getElementById("corner-rin");
const elPad = document.getElementById("corner-pad");
const elValRin = document.getElementById("val-rin");
const elValPad = document.getElementById("val-pad");
const btnCornerMode = document.getElementById("corner-mode-btn");
const elCornerReadout = document.getElementById("corner-readout");

let cornerConcentric = false; // 开场展示「照抄同圆角」鼓包，再切换看同心归零

function drawCornerLoupe() {
  const g = calcCornerGeometry(Number(elRin.value), Number(elPad.value), cornerConcentric);
  elValRin.textContent = `${g.rIn}px`;
  elValPad.textContent = `${g.pad}px`;
  btnCornerMode.setAttribute("aria-pressed", String(g.concentric));
  btnCornerMode.textContent = g.concentric
    ? `同心公式：开（R_外 = ${g.rOut}px）`
    : `同心公式：关（照抄 R_外 = ${g.rOut}px）`;

  const dpr = pixelRatio(2);
  const cssW = 520;
  const cssH = 300;
  if (elCornerCanvas.width !== cssW * dpr || elCornerCanvas.height !== cssH * dpr) {
    elCornerCanvas.width = cssW * dpr;
    elCornerCanvas.height = cssH * dpr;
  }
  const ctx = elCornerCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  // 放大倍率（以左上拐角为显微镜中心）
  const scale = 3.2;
  const ox = 48;
  const oy = 32;
  const padPx = g.pad * scale;
  const rInPx = g.rIn * scale;
  const rOutPx = g.rOut * scale;

  // 外托盘木框
  ctx.fillStyle = "#FFCD9C";
  ctx.strokeStyle = "#8C4A19";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(ox, oy, 420, 240, [rOutPx, 16, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // 内仓（樱粉）
  ctx.fillStyle = "#F6CED0";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(ox + padPx, oy + padPx, 420 - padPx, 240 - padPx, [rInPx, 12, 12, 12]);
  ctx.fill();
  ctx.stroke();

  // 标出外圆心与内圆心
  const cOutX = ox + rOutPx;
  const cOutY = oy + rOutPx;
  const cInX = ox + padPx + rInPx;
  const cInY = oy + padPx + rInPx;

  // 45° 对角线上的外弧点与内弧点
  const invS2 = Math.SQRT1_2;
  const pOutX = cOutX - rOutPx * invS2;
  const pOutY = cOutY - rOutPx * invS2;
  const pInX = cInX - rInPx * invS2;
  const pInY = cInY - rInPx * invS2;

  // 垂直边厚度线（严格 = P）
  ctx.strokeStyle = "#175C37";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox + 260, oy);
  ctx.lineTo(ox + 260, oy + padPx);
  ctx.stroke();
  ctx.fillStyle = "#175C37";
  ctx.font = '700 13px "Outfit", "Noto Sans SC", sans-serif';
  ctx.fillText(`直边壁厚 ${g.pad}px`, ox + 270, oy + Math.max(16, padPx / 2 + 5));

  // 45° 对角壁厚测量红/绿线
  const bad = Math.abs(g.delta) > 0.2;
  ctx.strokeStyle = bad ? "#9F1E3F" : "#175C37";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pOutX, pOutY);
  ctx.lineTo(pInX, pInY);
  ctx.stroke();

  // 圆心十字
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "rgba(13, 21, 10, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(pOutX, pOutY);
  ctx.lineTo(cOutX, cOutY);
  ctx.moveTo(pInX, pInY);
  ctx.lineTo(cInX, cInY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#0D150A";
  ctx.beginPath();
  ctx.arc(cOutX, cOutY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bad ? "#9F1E3F" : "#175C37";
  ctx.beginPath();
  ctx.arc(cInX, cInY, 4, 0, Math.PI * 2);
  ctx.fill();

  // 文字标注框
  ctx.fillStyle = bad ? "#FCE1E6" : "#EFFAF2";
  ctx.strokeStyle = bad ? "#9F1E3F" : "#175C37";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(ox + padPx + 24, oy + padPx + 24, 246, 54, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = bad ? "#8E1838" : "#164C2E";
  ctx.font = '700 13px "Outfit", "Noto Sans SC", sans-serif';
  ctx.fillText(
    `45° 斜角壁厚：${g.diagThickness}px（偏差 ${g.delta >= 0 ? "+" : ""}${g.delta}px）`,
    ox + padPx + 36,
    oy + padPx + 47
  );
  ctx.font = '500 12px "Noto Sans SC", sans-serif';
  ctx.fillText(
    bad ? "内外圆心分离，拐角明显鼓出一块" : "内外同心重合，拐角壁厚全程等宽",
    ox + padPx + 36,
    oy + padPx + 67
  );

  elCornerReadout.textContent = bad
    ? `外圆角直接照抄 ${g.rOut}px 时，45° 拐角壁厚涨到 ${g.diagThickness}px（比直边多出 +${g.delta}px）。点上方开启「同心公式」把外圆角改成 ${g.rIn + g.pad}px 看看。`
    : `采用同心公式 R_外 = ${g.rIn} + ${g.pad} = ${g.rOut}px 后，45° 拐角壁厚严格等于 ${g.diagThickness}px（偏差 0.0px），转角干脆利落。`;
}

elRin.addEventListener("input", drawCornerLoupe);
elPad.addEventListener("input", drawCornerLoupe);
btnCornerMode.addEventListener("click", () => {
  cornerConcentric = !cornerConcentric;
  drawCornerLoupe();
});
drawCornerLoupe();

// ==================== 07 小练习（单变量中性四选一） ====================
const elQuizGrid = document.getElementById("quiz-grid");
const elQuizVerdict = document.getElementById("quiz-verdict");
const elQvTitle = document.getElementById("qv-title");
const elQvBody = document.getElementById("qv-body");

let pickedQuiz = null;

function renderQuiz() {
  elQuizGrid.innerHTML = Object.values(QUIZ_OPTIONS)
    .map((opt) => {
      const reveal = pickedQuiz ? (opt.correct ? "right" : opt.id === pickedQuiz ? "wrong" : "") : "";
      const tag = pickedQuiz
        ? opt.correct
          ? "✓ 合理分仓"
          : opt.id === "A"
            ? "× 平权+缺口"
            : opt.id === "C"
              ? "× 主次倒挂"
              : "× 单仓霸盒"
        : "方案 " + opt.id;
      return `
        <button type="button" class="quiz-card" data-quiz="${opt.id}" aria-pressed="${pickedQuiz === opt.id}" ${reveal ? `data-reveal="${reveal}"` : ""}>
          <div class="quiz-head">
            <span class="quiz-letter" lang="en">${opt.id}</span>
            <span class="quiz-tag">${tag}</span>
          </div>
          <div class="quiz-mini" aria-hidden="true">
            ${opt.cells
              .map(
                (c) =>
                  `<div class="qcell" data-tone="${c.tone}" style="grid-area:${c.area}"><b>${c.name}</b><span lang="en">${c.tag}</span></div>`
              )
              .join("")}
          </div>
        </button>
      `;
    })
    .join("");

  elQuizGrid.querySelectorAll("[data-quiz]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedQuiz = btn.dataset.quiz;
      const opt = QUIZ_OPTIONS[pickedQuiz];
      elQuizVerdict.dataset.state = opt.correct ? "right" : "wrong";
      elQvTitle.textContent = (opt.correct ? "答对了 · " : "再看一眼 · ") + opt.title;
      elQvBody.textContent = opt.body;
      renderQuiz();
    });
  });
}
renderQuiz();

// ==================== 08 原海报放大拖动查看层 ====================
const posterBtn = document.getElementById("poster-btn");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbZoom = document.getElementById("lb-zoom");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate3d(${lbTx}px, ${lbTy}px, 0) scale(${lbScale})`;
  lbZoom.textContent = lbScale > 1.1 ? "还原 1×" : "放大 1.8×";
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoom.addEventListener("click", () => {
  lbScale = lbScale > 1.1 ? 1 : 1.8;
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  e.preventDefault();
  lbDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy, moved: false };
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  const dx = e.clientX - lbDrag.x;
  const dy = e.clientY - lbDrag.y;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) lbDrag.moved = true;
  if (lbScale > 1) {
    lbTx = lbDrag.tx + dx;
    lbTy = lbDrag.ty + dy;
    applyLbTransform();
  }
});
lbStage.addEventListener("pointerup", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  const moved = lbDrag.moved;
  lbDrag = null;
  if (!moved) {
    lbScale = lbScale > 1.1 ? 1 : 1.8;
    if (lbScale === 1) { lbTx = 0; lbTy = 0; }
    applyLbTransform();
  }
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
void reducedMotion;
