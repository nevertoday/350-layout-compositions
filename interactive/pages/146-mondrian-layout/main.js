import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  RULES,
  createBrokenState,
  createSymmetryTrapState,
  moveLine,
  evaluate,
  evaluateLever,
} from "./model.js";

// ==================== 1. 开场主角玩具：蒙德里安纸带工作台 ====================
let state = createBrokenState();
let ev = evaluate(state);

const stageWrap = document.getElementById("hero-stage-wrap");
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const radarCanvas = document.getElementById("balance-radar");
const radarCtx = radarCanvas.getContext("2d");

const handles = {
  v1: document.getElementById("handle-v1"),
  v2: document.getElementById("handle-v2"),
  h1: document.getElementById("handle-h1"),
  h2: document.getElementById("handle-h2"),
};

const cutButtons = {
  cutTopV1: document.getElementById("toggle-top-v1"),
  cutRightH2: document.getElementById("toggle-right-h2"),
};

const ui = {
  stageMeta: document.getElementById("stage-meta"),
  cellStatus: document.getElementById("cell-status"),
  mobileChip: document.getElementById("mobile-status-chip"),
  diagBadge: document.getElementById("diag-badge"),
  diagScore: document.getElementById("diag-score"),
  diagHeadline: document.getElementById("diag-headline"),
  diagBody: document.getElementById("diag-body"),
  diagHint: document.getElementById("diag-hint"),
  scopeCoords: document.getElementById("scope-coords"),
  mWhite: document.getElementById("m-white"),
  mRatio: document.getElementById("m-ratio"),
  mTcount: document.getElementById("m-tcount"),
  mColors: document.getElementById("m-colors"),
  kw: {
    grid: { el: document.getElementById("kw-grid"), note: document.getElementById("kw-grid-note") },
    proportion: { el: document.getElementById("kw-proportion"), note: document.getElementById("kw-proportion-note") },
    alignment: { el: document.getElementById("kw-alignment"), note: document.getElementById("kw-alignment-note") },
    balance: { el: document.getElementById("kw-balance"), note: document.getElementById("kw-balance-note") },
  },
};

let heroDirty = true;
let hoverCellId = null;
let animComX = ev.metrics.comX;
let animComY = ev.metrics.comY;
let lastSize = { w: 0, h: 0, dpr: 0 };

function syncCanvasSize(canvas, host) {
  const rect = host.getBoundingClientRect();
  const w = Math.max(100, Math.round(rect.width));
  const h = Math.max(100, Math.round(rect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w, h, dpr, resized: true };
  }
  return { w, h, dpr, resized: false };
}

function positionOverlays(w, h) {
  // 把手落在线段中点，避开两段 T 字开关点，确保互不遮挡且中心点干净命中
  const v1Y = state.cutTopV1 ? (state.h1 + state.h2) * 0.5 : state.h1 + (1 - state.h1) * 0.5;
  const v2Y = state.cutRightH2 ? (state.h1 + state.h2) * 0.5 : state.h1 * 0.52;
  const h1X = state.v1 + (state.v2 - state.v1) * 0.5;
  const h2X = state.v1 * 0.5;

  handles.v1.style.left = `${state.v1 * w}px`;
  handles.v1.style.top = `${v1Y * h}px`;

  handles.v2.style.left = `${state.v2 * w}px`;
  handles.v2.style.top = `${v2Y * h}px`;

  handles.h1.style.left = `${h1X * w}px`;
  handles.h1.style.top = `${state.h1 * h}px`;

  handles.h2.style.left = `${h2X * w}px`;
  handles.h2.style.top = `${state.h2 * h}px`;

  // 两段可拆 T 字开关
  cutButtons.cutTopV1.style.left = `${state.v1 * w}px`;
  cutButtons.cutTopV1.style.top = `${state.h1 * 0.5 * h}px`;
  cutButtons.cutTopV1.classList.toggle("is-cut", !state.cutTopV1);
  cutButtons.cutTopV1.setAttribute("aria-pressed", String(!state.cutTopV1));
  cutButtons.cutTopV1.querySelector(".t-toggle-mark").textContent = state.cutTopV1 ? "×" : "+";

  cutButtons.cutRightH2.style.left = `${(state.v2 + (1 - state.v2) * 0.5) * w}px`;
  cutButtons.cutRightH2.style.top = `${state.h2 * h}px`;
  cutButtons.cutRightH2.classList.toggle("is-cut", !state.cutRightH2);
  cutButtons.cutRightH2.setAttribute("aria-pressed", String(!state.cutRightH2));
  cutButtons.cutRightH2.querySelector(".t-toggle-mark").textContent = state.cutRightH2 ? "×" : "+";
}

function drawCellContent(ctx, cell, x, y, w, h, mode, isPrimaryWhite) {
  if (mode === "pure") {
    // 纯构成模式：极克制地标出格子面积占比，让用户直观读到比例反差
    if (w >= 54 && h >= 40) {
      const pct = Math.round(cell.area * 100);
      ctx.fillStyle = cell.color === "red" || cell.color === "blue" ? "rgba(255,255,255,0.92)" : "rgba(8,8,8,0.72)";
      ctx.font = `700 ${w < 82 ? 11 : 12}px "JetBrains Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${pct}%`, x + 8, y + 7);
    }
    return;
  }

  const ink = cell.color === "red" || cell.color === "blue" ? "#FFFFFF" : "#080808";
  const subInk = cell.color === "red" || cell.color === "blue" ? "rgba(255,255,255,0.85)" : "rgba(8,8,8,0.72)";
  const pad = Math.max(8, Math.min(16, Math.min(w, h) * 0.1));

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4));
  ctx.clip();

  if (isPrimaryWhite && w >= 120 && h >= 85) {
    // 主角留白大格排入主标题
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const titleSize = Math.max(16, Math.min(34, Math.min(w * 0.14, h * 0.24)));
    ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
    const mainTitle = mode === "exhibition" ? "新造型主义展" : "现代秩序特刊";
    ctx.fillText(mainTitle, x + pad, y + pad);

    ctx.font = `900 ${Math.max(12, titleSize * 0.52)}px "Big Shoulders", sans-serif`;
    ctx.fillStyle = subInk;
    const enTitle = mode === "exhibition" ? "DE STIJL · 1917–2026" : "ISSUE 146 · ARCHIVE";
    ctx.fillText(enTitle, x + pad, y + pad + titleSize * 1.18);

    // 厚黑短横杠
    ctx.fillStyle = ink;
    ctx.fillRect(x + pad, y + pad + titleSize * 1.75, Math.min(44, w * 0.24), 4);

    if (h >= 125) {
      ctx.font = `400 12px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = subInk;
      const line = mode === "exhibition" ? "网格、比例与非对称平衡回顾" : "建筑与平面网格专题季刊";
      ctx.fillText(line, x + pad, y + pad + titleSize * 1.75 + 14);
    }
  } else if (cell.color === "white" && w >= 86 && h >= 58) {
    // 次要白格排入示意排版栏线
    ctx.fillStyle = ink;
    ctx.font = `700 11px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(mode === "exhibition" ? "INFO" : "NOTES", x + pad, y + pad);
    ctx.fillStyle = "rgba(8,8,8,0.65)";
    const lineCount = Math.min(4, Math.max(2, Math.floor((h - pad * 2 - 20) / 11)));
    for (let i = 0; i < lineCount; i++) {
      const lw = (w - pad * 2) * (i === lineCount - 1 ? 0.62 : 0.92);
      ctx.fillRect(x + pad, y + pad + 18 + i * 10, Math.max(16, lw), 3.5);
    }
  } else if (cell.color !== "white" && w >= 60 && h >= 44) {
    // 原色块仅放极短标记，不塞大段字
    ctx.fillStyle = ink;
    ctx.font = `700 11px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tag = cell.color === "red" ? "01" : cell.color === "blue" ? "02" : "03";
    ctx.fillText(tag, x + pad, y + h - pad + 2);
  }

  ctx.restore();
}

function renderRadar() {
  const dpr = pixelRatio(2);
  const cssW = 82;
  const cssH = 82;
  if (radarCanvas.width !== Math.round(cssW * dpr)) {
    radarCanvas.width = Math.round(cssW * dpr);
    radarCanvas.height = Math.round(cssH * dpr);
  }
  radarCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  radarCtx.clearRect(0, 0, cssW, cssH);

  // 背景与坐标十字
  radarCtx.fillStyle = "#F5EEE3";
  radarCtx.fillRect(0, 0, cssW, cssH);

  radarCtx.strokeStyle = "rgba(8,8,8,0.22)";
  radarCtx.lineWidth = 1;
  radarCtx.beginPath();
  radarCtx.moveTo(cssW / 2, 4);
  radarCtx.lineTo(cssW / 2, cssH - 4);
  radarCtx.moveTo(4, cssH / 2);
  radarCtx.lineTo(cssW - 4, cssH / 2);
  radarCtx.stroke();

  // 经验稳态圈（半径映射到画布坐标）
  const rStable = RULES.balanceRadius * cssW * 1.8;
  radarCtx.beginPath();
  radarCtx.arc(cssW / 2, cssH / 2, rStable, 0, Math.PI * 2);
  radarCtx.fillStyle = ev.checks.balance.ok ? "rgba(15, 71, 177, 0.16)" : "rgba(229, 28, 21, 0.10)";
  radarCtx.fill();
  radarCtx.strokeStyle = ev.checks.balance.ok ? "#0F47B1" : "#B8140E";
  radarCtx.setLineDash([3, 2]);
  radarCtx.stroke();
  radarCtx.setLineDash([]);

  // 偏移矢量与实时重心点
  const px = Math.max(8, Math.min(cssW - 8, cssW / 2 + (animComX - 0.5) * cssW * 1.8));
  const py = Math.max(8, Math.min(cssH - 8, cssH / 2 + (animComY - 0.5) * cssH * 1.8));

  radarCtx.strokeStyle = "#080808";
  radarCtx.lineWidth = 2;
  radarCtx.beginPath();
  radarCtx.moveTo(cssW / 2, cssH / 2);
  radarCtx.lineTo(px, py);
  radarCtx.stroke();

  radarCtx.beginPath();
  radarCtx.arc(px, py, 5.5, 0, Math.PI * 2);
  radarCtx.fillStyle = ev.checks.balance.ok ? "#0F47B1" : "#E51C15";
  radarCtx.fill();
  radarCtx.strokeStyle = "#080808";
  radarCtx.lineWidth = 2;
  radarCtx.stroke();
}

function renderHero(t, dt, { still }) {
  const { w, h, dpr, resized } = syncCanvasSize(heroCanvas, stageWrap);
  if (resized || w !== lastSize.w || h !== lastSize.h) {
    lastSize = { w, h, dpr };
    positionOverlays(w, h);
    heroDirty = true;
  }

  const intro = still ? 1 : Math.min(1, t / 0.6);
  const easedIntro = 1 - Math.pow(1 - intro, 3);

  // 平滑阻尼追踪重心点
  const targetX = ev.metrics.comX;
  const targetY = ev.metrics.comY;
  if (still || dt === 0) {
    animComX = targetX;
    animComY = targetY;
  } else {
    const k = Math.min(1, dt * 12);
    animComX += (targetX - animComX) * k;
    animComY += (targetY - animComY) * k;
  }

  const moving = !still && (intro < 1 || Math.hypot(animComX - targetX, animComY - targetY) > 0.0015);
  if (!heroDirty && !moving) return;
  heroDirty = false;

  heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  heroCtx.fillStyle = "#F5EEE3";
  heroCtx.fillRect(0, 0, w, h);

  const lineW = w < 440 ? 6 : 8;

  // 1. 绘制各个矩形色格
  for (const cell of ev.cells) {
    const x = cell.x * w;
    const y = cell.y * h;
    const cw = cell.w * w;
    const ch = cell.h * h;

    heroCtx.fillStyle = PALETTE[cell.color].hex;
    if (easedIntro < 1 && cell.color !== "white") {
      // 开场色块利落展开，任何时刻都有清晰轮廓
      const s = 0.25 + 0.75 * easedIntro;
      heroCtx.fillRect(x, y, cw * s, ch);
    } else {
      heroCtx.fillRect(x, y, cw, ch);
    }

    // 同色粘连警示细斜纹
    if (ev.touchingIds.has(cell.id)) {
      heroCtx.save();
      heroCtx.beginPath();
      heroCtx.rect(x + 3, y + 3, Math.max(0, cw - 6), Math.max(0, ch - 6));
      heroCtx.clip();
      heroCtx.strokeStyle = cell.color === "yellow" ? "rgba(8,8,8,0.22)" : "rgba(255,255,255,0.28)";
      heroCtx.lineWidth = 2;
      for (let d = -ch; d < cw + ch; d += 14) {
        heroCtx.beginPath();
        heroCtx.moveTo(x + d, y);
        heroCtx.lineTo(x + d + ch, y + ch);
        heroCtx.stroke();
      }
      heroCtx.restore();
    }

    // 悬停格子框线提示
    if (hoverCellId === cell.id) {
      heroCtx.strokeStyle = cell.color === "blue" ? "#F7BE12" : "#080808";
      heroCtx.lineWidth = 3;
      heroCtx.setLineDash([6, 4]);
      heroCtx.strokeRect(x + lineW * 0.65, y + lineW * 0.65, Math.max(0, cw - lineW * 1.3), Math.max(0, ch - lineW * 1.3));
      heroCtx.setLineDash([]);
    }

    const isPrimaryWhite = ev.largestWhiteCell && ev.largestWhiteCell.id === cell.id;
    drawCellContent(heroCtx, cell, x + lineW * 0.4, y + lineW * 0.4, cw - lineW * 0.8, ch - lineW * 0.8, state.viewMode, isPrimaryWhite);
  }

  // 2. 绘制拆开的 T 字虚线提示（方便用户随时接回）
  for (const tog of ev.segments.toggles) {
    if (!tog.active) {
      heroCtx.save();
      heroCtx.strokeStyle = "rgba(15, 71, 177, 0.35)";
      heroCtx.lineWidth = 2;
      heroCtx.setLineDash([5, 5]);
      heroCtx.beginPath();
      heroCtx.moveTo(tog.x1 * w, tog.y1 * h);
      heroCtx.lineTo(tog.x2 * w, tog.y2 * h);
      heroCtx.stroke();
      heroCtx.restore();
    }
  }

  // 3. 绘制正交粗黑纸带骨架（随开场动画顺滑生长）
  heroCtx.strokeStyle = "#080808";
  heroCtx.lineWidth = lineW;
  heroCtx.lineCap = "butt";
  for (const seg of ev.segments.lines) {
    const x1 = seg.x1 * w;
    const y1 = seg.y1 * h;
    const x2 = x1 + (seg.x2 * w - x1) * easedIntro;
    const y2 = y1 + (seg.y2 * h - y1) * easedIntro;
    heroCtx.beginPath();
    heroCtx.moveTo(x1, y1);
    heroCtx.lineTo(x2, y2);
    heroCtx.stroke();
  }

  // 4. 在画布正中绘制极简稳态圈与实时视觉重心矢量（几何实算）
  const cx0 = w * 0.5;
  const cy0 = h * 0.5;
  const rZone = RULES.balanceRadius * Math.min(w, h);
  const gx = animComX * w;
  const gy = animComY * h;

  heroCtx.save();
  heroCtx.beginPath();
  heroCtx.arc(cx0, cy0, rZone, 0, Math.PI * 2);
  heroCtx.strokeStyle = ev.checks.balance.ok ? "rgba(15, 71, 177, 0.55)" : "rgba(8, 8, 8, 0.35)";
  heroCtx.lineWidth = 1.5;
  heroCtx.setLineDash([4, 4]);
  heroCtx.stroke();
  heroCtx.setLineDash([]);

  // 中心小圆点
  heroCtx.beginPath();
  heroCtx.arc(cx0, cy0, 3, 0, Math.PI * 2);
  heroCtx.fillStyle = "rgba(8,8,8,0.45)";
  heroCtx.fill();

  // 偏移矢量与重心标记（外白环+内彩点，保证压在黑线或原色上都清楚）
  heroCtx.beginPath();
  heroCtx.moveTo(cx0, cy0);
  heroCtx.lineTo(gx, gy);
  heroCtx.strokeStyle = "#FFFFFF";
  heroCtx.lineWidth = 4;
  heroCtx.stroke();
  heroCtx.strokeStyle = ev.checks.balance.ok ? "#0F47B1" : "#E51C15";
  heroCtx.lineWidth = 2;
  heroCtx.stroke();

  heroCtx.beginPath();
  heroCtx.arc(gx, gy, 7, 0, Math.PI * 2);
  heroCtx.fillStyle = "#FFFFFF";
  heroCtx.fill();
  heroCtx.beginPath();
  heroCtx.arc(gx, gy, 4.5, 0, Math.PI * 2);
  heroCtx.fillStyle = ev.checks.balance.ok ? "#0F47B1" : "#E51C15";
  heroCtx.fill();
  heroCtx.restore();

  renderRadar();
}

const heroLoop = loop(stageWrap, renderHero);

function syncReadouts() {
  ev = evaluate(state);
  const { metrics, checks, diagnosis } = ev;

  ui.stageMeta.textContent = `${ev.cells.length} CELLS · ${metrics.areaRatio.toFixed(1)}×`;

  const isOk = diagnosis.tone === "ok";
  ui.cellStatus.classList.toggle("is-ok", isOk);
  ui.mobileChip.classList.toggle("is-ok", isOk);
  ui.mobileChip.textContent = `${metrics.passedCount} / 4`;

  ui.diagBadge.textContent = diagnosis.badge;
  ui.diagScore.textContent = `${metrics.passedCount} / 4`;
  ui.diagHeadline.textContent = diagnosis.headline;
  ui.diagBody.textContent = diagnosis.body;
  ui.diagHint.textContent = diagnosis.nextHint;

  const dxPct = Math.round(metrics.dx * 100);
  const dyPct = Math.round(metrics.dy * 100);
  const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
  ui.scopeCoords.textContent = `X ${sign(dxPct)}% · Y ${sign(dyPct)}%`;

  ui.mWhite.textContent = `${Math.round(metrics.whiteRatio * 100)}%`;
  ui.mRatio.textContent = `${metrics.areaRatio.toFixed(1)}×`;
  ui.mTcount.textContent = `${metrics.tJunctionCount} / 2`;
  ui.mColors.textContent = `${metrics.distinctColors} 色`;

  for (const key of ["grid", "proportion", "alignment", "balance"]) {
    ui.kw[key].el.classList.toggle("is-ok", checks[key].ok);
    ui.kw[key].note.textContent = checks[key].note;
  }

  const rect = stageWrap.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    positionOverlays(rect.width, rect.height);
  }
  heroDirty = true;
  heroLoop.draw();
}

// 绑定 4 条黑带拖拽（同时兼容 Pointer 事件与原生 Touch 事件，确保慢手机与 CDP 触控实测帧帧响应）
for (const [key, btn] of Object.entries(handles)) {
  const axis = key.startsWith("v") ? "v" : "h";
  let dragging = false;

  const updateFromClient = (clientX, clientY) => {
    const rect = stageWrap.getBoundingClientRect();
    const norm = axis === "v" ? (clientX - rect.left) / rect.width : (clientY - rect.top) / rect.height;
    state = moveLine(state, key, norm);
    syncReadouts();
  };

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    btn.classList.add("is-dragging");
    if (btn.setPointerCapture) {
      try { btn.setPointerCapture(e.pointerId); } catch {}
    }
    updateFromClient(e.clientX, e.clientY);
  });

  btn.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    e.preventDefault();
    updateFromClient(e.clientX, e.clientY);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    btn.classList.remove("is-dragging");
  };
  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);

  // 原生 Touch 兜底（防止部分无头触控派发路径绕过 pointer capture）
  btn.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      dragging = true;
      btn.classList.add("is-dragging");
      updateFromClient(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );

  btn.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || !e.touches.length) return;
      e.preventDefault();
      updateFromClient(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );

  btn.addEventListener("touchend", endDrag);
  btn.addEventListener("touchcancel", endDrag);

  // 键盘微调
  btn.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.05 : 0.025;
    let delta = 0;
    if (axis === "v" && e.key === "ArrowLeft") delta = -step;
    else if (axis === "v" && e.key === "ArrowRight") delta = step;
    else if (axis === "h" && e.key === "ArrowUp") delta = -step;
    else if (axis === "h" && e.key === "ArrowDown") delta = step;
    if (delta !== 0) {
      e.preventDefault();
      state = moveLine(state, key, state[key] + delta);
      syncReadouts();
    }
  });
}

// 绑定 2 段局部 T 字断线开关
for (const [cutKey, btn] of Object.entries(cutButtons)) {
  btn.addEventListener("click", () => {
    state = { ...state, [cutKey]: !state[cutKey] };
    syncReadouts();
  });
}

// 画布点击给格子蘸色 + 悬停高亮
function findCellAt(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  const u = (clientX - rect.left) / rect.width;
  const v = (clientY - rect.top) / rect.height;
  return ev.cells.find((c) => u >= c.x && u <= c.x + c.w && v >= c.y && v <= c.y + c.h) || null;
}

heroCanvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  const cell = findCellAt(e.clientX, e.clientY);
  const nextHover = cell ? cell.id : null;
  if (nextHover !== hoverCellId) {
    hoverCellId = nextHover;
    heroDirty = true;
    heroLoop.draw();
  }
});

heroCanvas.addEventListener("pointerleave", () => {
  if (hoverCellId !== null) {
    hoverCellId = null;
    heroDirty = true;
    heroLoop.draw();
  }
});

heroCanvas.addEventListener("click", (e) => {
  const cell = findCellAt(e.clientX, e.clientY);
  if (!cell) return;
  const nextColor = cell.color === state.brush && state.brush !== "white" ? "white" : state.brush;
  state = {
    ...state,
    colors: { ...state.colors, [cell.id]: nextColor },
  };
  syncReadouts();
});

// 蘸色笔刷、内容验字、对称陷阱与复原按钮
const brushBtns = [...document.querySelectorAll(".brush-btn")];
brushBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, brush: btn.dataset.brush };
    brushBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  });
});

const modeBtns = [...document.querySelectorAll(".mode-btn")];
modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = { ...state, viewMode: btn.dataset.mode };
    modeBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncReadouts();
  });
});

document.getElementById("btn-reset").addEventListener("click", () => {
  const currentBrush = state.brush;
  const currentMode = state.viewMode;
  state = { ...createBrokenState(), brush: currentBrush, viewMode: currentMode };
  syncReadouts();
});

document.getElementById("btn-symmetry").addEventListener("click", () => {
  const currentMode = state.viewMode;
  state = { ...createSymmetryTrapState(), viewMode: currentMode };
  brushBtns.forEach((b) => {
    const on = b.dataset.brush === state.brush;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  syncReadouts();
});

new ResizeObserver(() => {
  heroDirty = true;
  heroLoop.draw();
}).observe(stageWrap);

syncReadouts();

// ==================== 2. 01 节：切分基因对比 ====================
const PROP_PRESETS = {
  even: {
    ratio: "MAX / MIN 1.0×",
    caption: "三等分全贯通网格：9 个格面积都是 11%，像一张空白登记表。视线扫过去没有主次锚点，标题和附注抢同一个位置权重。",
    cells: [
      { x: 0, y: 0, w: 120, h: 83, fill: "#F5EEE3", pct: 11, label: "格 1" },
      { x: 120, y: 0, w: 120, h: 83, fill: "#E51C15", pct: 11, label: "格 2" },
      { x: 240, y: 0, w: 120, h: 83, fill: "#F5EEE3", pct: 11, label: "格 3" },
      { x: 0, y: 83, w: 120, h: 84, fill: "#F7BE12", pct: 11, label: "格 4" },
      { x: 120, y: 83, w: 120, h: 84, fill: "#F5EEE3", pct: 11, label: "格 5" },
      { x: 240, y: 83, w: 120, h: 84, fill: "#0F47B1", pct: 11, label: "格 6" },
      { x: 0, y: 167, w: 120, h: 83, fill: "#F5EEE3", pct: 11, label: "格 7" },
      { x: 120, y: 167, w: 120, h: 83, fill: "#F5EEE3", pct: 11, label: "格 8" },
      { x: 240, y: 167, w: 120, h: 83, fill: "#F5EEE3", pct: 11, label: "格 9" },
    ],
    focus: null,
    bars: [
      { name: "最大格", pct: 11, cls: "" },
      { name: "中位格", pct: 11, cls: "" },
      { name: "最小格", pct: 11, cls: "" },
    ],
  },
  tjunction: {
    ratio: "MAX / MIN 4.6×",
    caption: "T 字非对称切分：左上竖线在中途停住，合出 37% 的暖白主格托住标题；右上红块与左下黄蓝形成斜对角呼吸，大小阶梯立刻拉开。",
    cells: [
      { x: 0, y: 0, w: 246, h: 136, fill: "#F5EEE3", pct: 37, label: "主大格" },
      { x: 246, y: 0, w: 114, h: 136, fill: "#E51C15", pct: 17, label: "原红锚" },
      { x: 0, y: 136, w: 100, h: 114, fill: "#F7BE12", pct: 13, label: "明黄块" },
      { x: 100, y: 136, w: 146, h: 66, fill: "#F5EEE3", pct: 11, label: "说明格" },
      { x: 100, y: 202, w: 146, h: 48, fill: "#0F47B1", pct: 8, label: "钴蓝条" },
      { x: 246, y: 136, w: 114, h: 114, fill: "#F5EEE3", pct: 14, label: "留白柱" },
    ],
    focus: { x: 123, y: 68, r: 22 },
    bars: [
      { name: "左上暖白主格", pct: 37, cls: "" },
      { name: "右上原红锚点", pct: 17, cls: "pbar-fill--red" },
      { name: "左下明黄配重", pct: 13, cls: "pbar-fill--yellow" },
      { name: "中下钴蓝窄条", pct: 8, cls: "pbar-fill--blue" },
    ],
  },
  golden: {
    ratio: "MAX / MIN 6.0×",
    caption: "递进黄金切分（约 0.62 : 0.38 连续分割）：一块占近四成的巨幅白格领衔，其余网格逐级折小，节奏紧凑干脆，极适合建筑展封面。",
    cells: [
      { x: 0, y: 0, w: 222, h: 154, fill: "#F5EEE3", pct: 38, label: "主大格" },
      { x: 222, y: 0, w: 138, h: 96, fill: "#0F47B1", pct: 15, label: "钴蓝块" },
      { x: 222, y: 96, w: 138, h: 58, fill: "#F5EEE3", pct: 9, label: "副格" },
      { x: 0, y: 154, w: 138, h: 96, fill: "#E51C15", pct: 15, label: "原红块" },
      { x: 138, y: 154, w: 84, h: 96, fill: "#F5EEE3", pct: 9, label: "过渡格" },
      { x: 222, y: 154, w: 84, h: 96, fill: "#F5EEE3", pct: 9, label: "辅白" },
      { x: 306, y: 154, w: 54, h: 96, fill: "#F7BE12", pct: 6, label: "尾黄" },
    ],
    focus: { x: 111, y: 77, r: 24 },
    bars: [
      { name: "主暖白大格", pct: 38, cls: "" },
      { name: "原红 / 钴蓝", pct: 15, cls: "pbar-fill--red" },
      { name: "过渡白格", pct: 9, cls: "" },
      { name: "右下明黄窄格", pct: 6, cls: "pbar-fill--yellow" },
    ],
  },
};

const propSvg = document.getElementById("prop-svg");
const propBars = document.getElementById("prop-bars");
const propCaption = document.getElementById("prop-caption");
const propRatioTag = document.getElementById("prop-ratio-tag");
const propTabs = [...document.querySelectorAll(".seg-tab")];

function renderProp(key) {
  const data = PROP_PRESETS[key];
  propRatioTag.textContent = data.ratio;
  propCaption.textContent = data.caption;

  const rects = data.cells
    .map((c) => {
      const ink = c.fill === "#E51C15" || c.fill === "#0F47B1" ? "#FFFFFF" : "#080808";
      return `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${c.fill}" stroke="#080808" stroke-width="5"/>` +
        `<text x="${c.x + c.w / 2}" y="${c.y + c.h / 2 + 4}" text-anchor="middle" fill="${ink}" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">${c.pct}%</text>`;
    })
    .join("");

  const focusRing = data.focus
    ? `<circle cx="${data.focus.x}" cy="${data.focus.y}" r="${data.focus.r}" fill="none" stroke="#E51C15" stroke-width="2.5" stroke-dasharray="4 3"/>` +
      `<text x="${data.focus.x}" y="${data.focus.y - data.focus.r - 5}" text-anchor="middle" fill="#B8140E" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="900">第一眼主格</text>`
    : "";

  propSvg.innerHTML = rects + focusRing;

  propBars.innerHTML = data.bars
    .map(
      (b) =>
        `<div class="pbar-row">` +
        `<div class="pbar-top"><span>${b.name}</span><span lang="en">${b.pct}%</span></div>` +
        `<div class="pbar-track"><div class="pbar-fill ${b.cls}" style="width:${Math.min(100, b.pct * 2.2)}%"></div></div>` +
        `</div>`
    )
    .join("");
}

propTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    propTabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderProp(tab.dataset.prop);
  });
});
renderProp("even");

// ==================== 3. 02 节：2D Canvas 杠杆配重天平 ====================
const leverCanvas = document.getElementById("lever-canvas");
const leverCtx = leverCanvas.getContext("2d");
const leverAngleTag = document.getElementById("lever-angle-tag");
const leverVerdict = document.getElementById("lever-verdict");
const leverAreaInput = document.getElementById("lever-area");
const leverArmInput = document.getElementById("lever-arm");
const leverAreaVal = document.getElementById("lever-area-val");
const leverArmVal = document.getElementById("lever-arm-val");
const leverChips = [...document.querySelectorAll(".chip-btn")];

const leverState = {
  leftColor: "yellow",
  leftArea: 1.5,
  leftArm: 0.56,
  rightColor: "red",
  rightArea: 0.65,
  rightArm: 0.74,
};

let leverEval = evaluateLever(leverState);
let leverAnimAngle = leverEval.angleDeg;
let leverDirty = true;

function syncLever() {
  leverEval = evaluateLever(leverState);
  leverAreaVal.textContent = `${leverState.rightArea.toFixed(2)}×`;
  leverArmVal.textContent = `${Math.round(leverState.rightArm * 100)}%`;
  const sign = leverEval.angleDeg > 0.1 ? "+" : "";
  leverAngleTag.textContent = leverEval.balanced ? `${sign}${leverEval.angleDeg.toFixed(1)}° · 稳` : `${sign}${leverEval.angleDeg.toFixed(1)}°`;
  leverVerdict.textContent = leverEval.verdict;
  leverDirty = true;
  leverLoop.draw();
}

function drawLever(t, dt, { still }) {
  const { w, h, dpr, resized } = syncCanvasSize(leverCanvas, leverCanvas);
  if (resized) leverDirty = true;

  if (still || dt === 0) {
    leverAnimAngle = leverEval.angleDeg;
  } else {
    const k = Math.min(1, dt * 10);
    leverAnimAngle += (leverEval.angleDeg - leverAnimAngle) * k;
  }

  const moving = !still && Math.abs(leverAnimAngle - leverEval.angleDeg) > 0.04;
  if (!leverDirty && !moving) return;
  leverDirty = false;

  leverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  leverCtx.fillStyle = "#F5EEE3";
  leverCtx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const fulcrumY = h * 0.74;
  const halfBeam = Math.min(w * 0.42, 210);

  // 背景水平参考虚线
  leverCtx.strokeStyle = "rgba(8,8,8,0.2)";
  leverCtx.lineWidth = 1.5;
  leverCtx.setLineDash([5, 4]);
  leverCtx.beginPath();
  leverCtx.moveTo(cx - halfBeam - 14, fulcrumY - 26);
  leverCtx.lineTo(cx + halfBeam + 14, fulcrumY - 26);
  leverCtx.stroke();
  leverCtx.setLineDash([]);

  // 旋转横梁与左右色块
  leverCtx.save();
  leverCtx.translate(cx, fulcrumY - 26);
  leverCtx.rotate((leverAnimAngle * Math.PI) / 180);

  // 粗黑横梁
  leverCtx.fillStyle = "#080808";
  leverCtx.fillRect(-halfBeam, -4, halfBeam * 2, 8);

  // 左侧固定大黄块（代表大片轻亮区，两行排字保证左右留白透气）
  const lx = -leverState.leftArm * halfBeam;
  const lw = 86;
  const lh = 56;
  leverCtx.fillStyle = PALETTE[leverState.leftColor].hex;
  leverCtx.fillRect(lx - lw / 2, -lh - 4, lw, lh);
  leverCtx.strokeStyle = "#080808";
  leverCtx.lineWidth = 3.5;
  leverCtx.strokeRect(lx - lw / 2, -lh - 4, lw, lh);
  leverCtx.fillStyle = "#080808";
  leverCtx.font = `700 11.5px "Noto Sans SC", sans-serif`;
  leverCtx.textAlign = "center";
  leverCtx.textBaseline = "middle";
  leverCtx.fillText("固定明黄", lx, -lh / 2 - 12);
  leverCtx.font = `700 11px "JetBrains Mono", monospace`;
  leverCtx.fillText("1.50×", lx, -lh / 2 + 5);

  // 右侧可调原色块
  const rx = leverState.rightArm * halfBeam;
  const side = Math.sqrt(leverState.rightArea) * 46;
  const rw = Math.max(30, Math.min(82, side * 1.12));
  const rh = Math.max(26, Math.min(68, side * 0.9));
  leverCtx.fillStyle = PALETTE[leverState.rightColor].hex;
  leverCtx.fillRect(rx - rw / 2, -rh - 4, rw, rh);
  leverCtx.strokeStyle = "#080808";
  leverCtx.lineWidth = 3.5;
  leverCtx.strokeRect(rx - rw / 2, -rh - 4, rw, rh);
  leverCtx.fillStyle = PALETTE[leverState.rightColor].ink;
  leverCtx.font = `700 11px "Noto Sans SC", sans-serif`;
  leverCtx.fillText(PALETTE[leverState.rightColor].label, rx, -rh / 2 - 4);

  // 中心支点圆（呼应原海报「平衡」图标）
  leverCtx.beginPath();
  leverCtx.arc(0, -14, 7, 0, Math.PI * 2);
  leverCtx.fillStyle = leverEval.balanced ? "#0F47B1" : "#E51C15";
  leverCtx.fill();
  leverCtx.strokeStyle = "#080808";
  leverCtx.lineWidth = 2.5;
  leverCtx.stroke();
  leverCtx.restore();

  // 底部纯黑支点三角（原海报「平衡」符号）
  leverCtx.fillStyle = "#080808";
  leverCtx.beginPath();
  leverCtx.moveTo(cx, fulcrumY - 20);
  leverCtx.lineTo(cx - 18, fulcrumY + 14);
  leverCtx.lineTo(cx + 18, fulcrumY + 14);
  leverCtx.closePath();
  leverCtx.fill();

  // 左右力矩标注
  leverCtx.fillStyle = "#3A3731";
  leverCtx.font = `700 11px "JetBrains Mono", monospace`;
  leverCtx.textAlign = "left";
  leverCtx.fillText(`L TORQUE ${leverEval.leftTorque.toFixed(2)}`, 14, h - 12);
  leverCtx.textAlign = "right";
  leverCtx.fillText(`R TORQUE ${leverEval.rightTorque.toFixed(2)}`, w - 14, h - 12);
}

const leverLoop = loop(leverCanvas, drawLever);

leverChips.forEach((btn) => {
  btn.addEventListener("click", () => {
    leverState.rightColor = btn.dataset.lcolor;
    leverChips.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncLever();
  });
});

leverAreaInput.addEventListener("input", () => {
  leverState.rightArea = parseFloat(leverAreaInput.value);
  syncLever();
});

leverArmInput.addEventListener("input", () => {
  leverState.rightArm = parseFloat(leverArmInput.value);
  syncLever();
});

new ResizeObserver(() => {
  leverDirty = true;
  leverLoop.draw();
}).observe(leverCanvas);

syncLever();

// ==================== 4. 03 节：线型 × 色彩预算双维对照台 ====================
const specimenShell = document.getElementById("specimen-shell");
const styleBadge = document.getElementById("style-badge");
const styleBudgetNum = document.getElementById("style-budget-num");
const styleDesc = document.getElementById("style-desc");
const lineStyleBtns = [...document.querySelectorAll("[data-line-style]")];
const budgetBtns = [...document.querySelectorAll("[data-color-budget]")];

const STYLE_STATE = { line: "thick", budget: "classic" };

const LINE_META = {
  thick: { width: "骨线 8px", feel: "强建筑构成感，最贴近 1920s 海报原味，适合展览封面与主视觉。" },
  hairline: { width: "骨线 1.5px", feel: "轻盈现代编辑感，保留正交对齐骨架却不压文字，适合杂志内页与网页。" },
  gutter: { width: "隐线 10px 白缝", feel: "拿掉黑线、改用留白缝分割网格——蒙德里安的骨架还在，商业品牌适配面最广。" },
  flush: { width: "0px 贴边", feel: "色块直接贴边碰撞，白底与白底的边界会消失，更考验面积和色相本身撑住秩序。" },
};

const BUDGET_META = {
  classic: {
    tag: "经典原色平衡",
    white: "留白 66%",
    note: "红、黄、蓝只占三成出头，主标题和展讯安稳躺在暖白纸面上，既有辨识度又不刺眼。",
  },
  brand: {
    tag: "品牌现代落地",
    white: "留白 78%",
    note: "换成深海蓝与暖陶红两组品牌克制色，立刻褪去「蒙德里安纪念品」标签，保留纯粹的几何节奏。",
  },
  overload: {
    tag: "满涂翻车警示",
    white: "留白 14%",
    note: "连主标题和展讯区都被高饱和原色糊满，眼睛在黄红蓝之间无处休息，阅读阻力直线上升。",
  },
};

function syncStyleLab() {
  specimenShell.dataset.lineStyle = STYLE_STATE.line;
  specimenShell.dataset.colorBudget = STYLE_STATE.budget;
  const lm = LINE_META[STYLE_STATE.line];
  const bm = BUDGET_META[STYLE_STATE.budget];
  styleBadge.textContent = bm.tag;
  styleBudgetNum.textContent = `${bm.white} · ${lm.width}`;
  styleDesc.textContent = `${lm.feel} ${bm.note}`;
}

lineStyleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    STYLE_STATE.line = btn.dataset.lineStyle;
    lineStyleBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncStyleLab();
  });
});

budgetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    STYLE_STATE.budget = btn.dataset.colorBudget;
    budgetBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    syncStyleLab();
  });
});
syncStyleLab();

// ==================== 5. 04 节：历史胶带时间轴（全核实史料） ====================
const ERAS = {
  "1917": {
    badge: "1917 · LEIDEN",
    title: "风格派（De Stijl）在荷兰莱顿成立",
    body: "特奥·凡·杜斯堡（Theo van Doesburg）与皮特·蒙德里安（Piet Mondrian）等人在荷兰莱顿创办《风格》（De Stijl）期刊。1917–1918 年间，蒙德里安在刊上连载《绘画中的新造型主义》（De nieuwe beelding in de schilderkunst），主张把造型要素精简为水平线、垂直线、三原色与黑白灰。",
    source: "核实馆藏：海牙市立博物馆（Kunstmuseum Den Haag）《蒙德里安与风格派》常设展区。",
    svg: `
      <rect x="0" y="0" width="280" height="280" fill="#F5EEE3"/>
      <rect x="24" y="28" width="76" height="58" fill="#E51C15"/>
      <rect x="136" y="42" width="110" height="36" fill="#0F47B1"/>
      <rect x="52" y="128" width="66" height="96" fill="#F7BE12"/>
      <rect x="150" y="114" width="92" height="56" fill="#080808"/>
      <rect x="174" y="198" width="64" height="44" fill="#E51C15"/>
      <line x1="16" y1="102" x2="264" y2="102" stroke="#080808" stroke-width="5"/>
      <line x1="126" y1="18" x2="126" y2="262" stroke="#080808" stroke-width="5"/>
    `,
  },
  "1921": {
    badge: "1920–1921 · PARIS / DEN HAAG",
    title: "《新造型主义》出版与大红平面构图定型",
    body: "1920 年蒙德里安在巴黎经由莱昂斯·罗森伯格（Léonce Rosenberg）的现代努力画廊出版法文专著《新造型主义》（Le Néo-Plasticisme）。1921 年创作的《大红平面、黄、黑、灰与蓝的构图》把粗黑骨线锁成严密网格，用一块占主位的纯红与远处窄蓝、窄黄做非对称对位。",
    source: "核实藏品：海牙市立博物馆藏《Composition with Large Red Plane, Yellow, Black, Gray and Blue》（1921）。",
    svg: `
      <rect x="0" y="0" width="280" height="280" fill="#F5EEE3"/>
      <rect x="0" y="0" width="64" height="48" fill="#F5EEE3"/>
      <rect x="64" y="0" width="160" height="164" fill="#E51C15"/>
      <rect x="224" y="0" width="56" height="98" fill="#F7BE12"/>
      <rect x="0" y="164" width="64" height="116" fill="#F7BE12"/>
      <rect x="64" y="164" width="72" height="62" fill="#080808"/>
      <rect x="224" y="210" width="56" height="70" fill="#0F47B1"/>
      <g stroke="#080808" stroke-width="7">
        <line x1="64" y1="0" x2="64" y2="280"/>
        <line x1="224" y1="0" x2="224" y2="280"/>
        <line x1="0" y1="164" x2="280" y2="164"/>
        <line x1="136" y1="164" x2="136" y2="280"/>
        <line x1="64" y1="226" x2="224" y2="226"/>
        <line x1="224" y1="98" x2="280" y2="98"/>
      </g>
    `,
  },
  "1930": {
    badge: "1930 · ZÜRICH",
    title: "偏心十字与三原色最简平衡：《红、蓝、黄构图》",
    body: "1930 年的方形油画《红、蓝、黄构图》（约 46×46 cm）把黑线交点压向画布左下方，右上几乎全让给一整块巨大纯红，仅靠左下小蓝块与右下窄黄块便牢牢拉住整幅画面，成为后世平面设计引用最多的经典原型。",
    source: "核实藏品：苏黎世美术馆（Kunsthaus Zürich），1987 年由建筑师 Alfred Roth 捐赠（馆藏号 1987/0028）。",
    svg: `
      <rect x="0" y="0" width="280" height="280" fill="#F5EEE3"/>
      <rect x="74" y="0" width="206" height="206" fill="#E51C15"/>
      <rect x="0" y="206" width="74" height="74" fill="#0F47B1"/>
      <rect x="242" y="242" width="38" height="38" fill="#F7BE12"/>
      <g stroke="#080808" stroke-width="9">
        <line x1="74" y1="0" x2="74" y2="280"/>
        <line x1="0" y1="206" x2="280" y2="206"/>
        <line x1="0" y1="94" x2="74" y2="94"/>
        <line x1="242" y1="206" x2="242" y2="280"/>
        <line x1="242" y1="242" x2="280" y2="242"/>
      </g>
    `,
  },
  "1942": {
    badge: "1942–1944 · NEW YORK",
    title: "百老汇爵士乐：撤掉黑线，用彩带排节奏",
    body: "二战期间迁居纽约后，蒙德里安被曼哈顿街区网格与布吉乌吉爵士乐打动。他在《百老汇爵士乐》（1942–43）和未竟遗作《胜利爵士乐》（1942–44）中彻底撤掉粗黑线，改用彩色胶带贴出闪烁的明黄、红、蓝脉冲网格——证明「正交比例与节奏」比黑线本身更根本。",
    source: "核实藏品：纽约现代艺术博物馆 MoMA（馆藏号 73.1943）与海牙市立博物馆。",
    svg: `
      <rect x="0" y="0" width="280" height="280" fill="#F5EEE3"/>
      <g fill="#F7BE12">
        <rect x="34" y="0" width="14" height="280"/>
        <rect x="122" y="0" width="14" height="280"/>
        <rect x="218" y="0" width="14" height="280"/>
        <rect x="0" y="54" width="280" height="14"/>
        <rect x="0" y="156" width="280" height="14"/>
        <rect x="0" y="230" width="280" height="14"/>
      </g>
      <rect x="34" y="54" width="14" height="14" fill="#E51C15"/>
      <rect x="122" y="54" width="14" height="14" fill="#0F47B1"/>
      <rect x="218" y="156" width="14" height="14" fill="#E51C15"/>
      <rect x="34" y="230" width="14" height="14" fill="#0F47B1"/>
      <rect x="164" y="96" width="44" height="44" fill="#E51C15"/>
      <rect x="176" y="108" width="20" height="20" fill="#F5EEE3"/>
      <rect x="64" y="182" width="46" height="36" fill="#0F47B1"/>
      <rect x="78" y="192" width="18" height="16" fill="#F7BE12"/>
    `,
  },
  "1965": {
    badge: "1965 · PARIS",
    title: "伊夫·圣洛朗推出「蒙德里安裙」",
    body: "1965 年 8 月 6 日，法国设计师伊夫·圣洛朗（Yves Saint Laurent）发布秋冬高定系列，把蒙德里安的红、黄、蓝、白与黑线裁成直筒针织裙。它们不是简单印花，而是把各色羊毛针织布精密无缝拼接，让二维平面网格站立到人体立体曲面之上，把蒙德里安美学推向全球大众视野。",
    source: "核实机构：巴黎伊夫·圣洛朗博物馆（Musée Yves Saint Laurent Paris）与阿姆斯特丹国立博物馆。",
    svg: `
      <rect x="0" y="0" width="280" height="280" fill="#F5EEE3"/>
      <g clip-path="url(#dressClip)">
        <rect x="62" y="30" width="156" height="224" fill="#FAF6EE"/>
        <rect x="62" y="30" width="102" height="72" fill="#E51C15"/>
        <rect x="164" y="102" width="54" height="74" fill="#0F47B1"/>
        <rect x="62" y="176" width="52" height="78" fill="#F7BE12"/>
        <g stroke="#080808" stroke-width="7">
          <line x1="164" y1="30" x2="164" y2="254"/>
          <line x1="114" y1="102" x2="114" y2="254"/>
          <line x1="62" y1="102" x2="218" y2="102"/>
          <line x1="62" y1="176" x2="218" y2="176"/>
        </g>
      </g>
      <defs>
        <clipPath id="dressClip">
          <polygon points="94,30 186,30 218,254 62,254"/>
        </clipPath>
      </defs>
      <polygon points="94,30 186,30 218,254 62,254" fill="none" stroke="#080808" stroke-width="6"/>
    `,
  },
  "1967": {
    badge: "1967 · ADVERTISING TEXTBOOK",
    title: "平面广告教材正式确立「Mondrian Layout」",
    body: "美国广告设计教授罗伊·保罗·纳尔逊（Roy Paul Nelson）在 1967 年首版的经典教材《广告设计》（The Design of Advertising）中，将印刷广告版式归纳成若干原型——把「蒙德里安版式」与图片窗口版式、马戏团版式等并列，专门用来把标题、产品图、卖点与标语分别装进正交色块与留白格。",
    source: "核实书目：Roy Paul Nelson, The Design of Advertising (1967, Wm. C. Brown Co.)。",
    svg: `
      <rect x="0" y="0" width="280" height="280" fill="#F5EEE3"/>
      <rect x="0" y="0" width="184" height="122" fill="#FAF6EE" stroke="#080808" stroke-width="6"/>
      <rect x="184" y="0" width="96" height="122" fill="#E51C15" stroke="#080808" stroke-width="6"/>
      <rect x="0" y="122" width="96" height="96" fill="#F7BE12" stroke="#080808" stroke-width="6"/>
      <rect x="96" y="122" width="184" height="96" fill="#FAF6EE" stroke="#080808" stroke-width="6"/>
      <rect x="0" y="218" width="184" height="62" fill="#0F47B1" stroke="#080808" stroke-width="6"/>
      <rect x="184" y="218" width="96" height="62" fill="#FAF6EE" stroke="#080808" stroke-width="6"/>
      <rect x="18" y="24" width="120" height="16" fill="#080808"/>
      <rect x="18" y="50" width="84" height="12" fill="#080808"/>
      <rect x="18" y="76" width="140" height="6" fill="#3A3731"/>
      <rect x="18" y="90" width="110" height="6" fill="#3A3731"/>
      <rect x="114" y="144" width="142" height="8" fill="#080808"/>
      <rect x="114" y="162" width="130" height="6" fill="#3A3731"/>
      <rect x="114" y="176" width="112" height="6" fill="#3A3731"/>
    `,
  },
};

const tlSvg = document.getElementById("tl-svg");
const tlBadge = document.getElementById("tl-era-badge");
const tlTitle = document.getElementById("tl-era-title");
const tlBody = document.getElementById("tl-era-body");
const tlSource = document.getElementById("tl-era-source");
const tlNodes = [...document.querySelectorAll(".tl-node")];

function renderEra(key) {
  const era = ERAS[key];
  tlBadge.textContent = era.badge;
  tlTitle.textContent = era.title;
  tlBody.textContent = era.body;
  tlSource.textContent = era.source;
  tlSvg.innerHTML = era.svg;
}

tlNodes.forEach((btn) => {
  btn.addEventListener("click", () => {
    tlNodes.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra(btn.dataset.era);
  });
});
renderEra("1917");

// ==================== 6. 05 节：真实设计需求自检 ====================
const BRIEFS = {
  arch: {
    go: true,
    pill: "高度适配",
    title: "建筑双年展导览折页：蒙德里安版式的天然主场",
    text: "展厅分区、开放时段、票务与主题标题都是简短并列信息，且建筑展天然契合正交网格的理性美感。把粗黑线降到 2px、留白保持 65% 以上，再拿红蓝黄标出三处核心展馆即可。",
  },
  essay: {
    go: false,
    pill: "建议绕行",
    title: "三千字人物深度专访：别让粗黑格线切碎长文流",
    text: "连续大段文字需要舒缓的栏宽和安静的页边留白。强行塞进蒙德里安格子，读者每读几行就会撞上黑框，视觉很快疲劳。这类题材直接改用 <a href=\"https://layout.xiaoxiaodong.ai/141/play/\" target=\"_blank\" rel=\"noopener\">141 文字主导版式</a>。",
  },
  promo: {
    go: false,
    pill: "建议绕行",
    title: "生鲜超市周末特价单：太冷静，推不出热闹劲",
    text: "折扣海报讲究价格数字跳脱、优惠标签层层叠加和紧迫感；蒙德里安的严格正交与克制留白反而会削弱促销冲击力。需要满屏热闹张力时，请换 <a href=\"https://layout.xiaoxiaodong.ai/147/play/\" target=\"_blank\" rel=\"noopener\">147 马戏团版式</a>。",
  },
  catalog: {
    go: true,
    pill: "适配 · 建议降线宽",
    title: "独立书店年度书单封面：保留骨架，换品牌克制色",
    text: "封面要把书单主题、年份、精选分类与书店名利落排开。不必硬抄高饱和红黄蓝，只要沿用非对称 T 字切分 + 1.5px 细线 + 书店自有双色锚点，就能做出既现代又耐看的出版物封面。",
  },
};

const briefResult = document.getElementById("brief-result");
const briefBtns = [...document.querySelectorAll(".brief-btn")];

function renderBrief(key) {
  const b = BRIEFS[key];
  briefResult.innerHTML =
    `<div class="brief-verdict-row">` +
    `<span class="brief-pill ${b.go ? "brief-pill--go" : "brief-pill--stop"}">${b.pill}</span>` +
    `<strong>${b.title}</strong>` +
    `</div>` +
    `<p>${b.text}</p>`;
}

briefBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    briefBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    renderBrief(btn.dataset.brief);
  });
});
renderBrief("arch");

// ==================== 7. 06 节：同骨架四选一小练习 ====================
// 四个选项完全共用同一套非对称 T 字骨架与相同标题区域，仅改变原色分布与覆盖面积一个变量
function buildQuizSvg(fills) {
  // 骨架：左上合并主格(0,0,164,84) / 右上(164,0,76,84) / 左中(0,84,74,50) / 正中(74,84,90,50) / 右中(164,84,76,50) / 左下(0,134,74,46) / 中下(74,134,90,46) / 右下(164,134,76,46)
  const rects = [
    { k: "tl", x: 0, y: 0, w: 164, h: 84 },
    { k: "tr", x: 164, y: 0, w: 76, h: 84 },
    { k: "ml", x: 0, y: 84, w: 74, h: 50 },
    { k: "mc", x: 74, y: 84, w: 90, h: 50 },
    { k: "mr", x: 164, y: 84, w: 76, h: 50 },
    { k: "bl", x: 0, y: 134, w: 74, h: 46 },
    { k: "bc", x: 74, y: 134, w: 90, h: 46 },
    { k: "br", x: 164, y: 134, w: 76, h: 46 },
  ];
  const colorMap = { W: "#F5EEE3", R: "#E51C15", B: "#0F47B1", Y: "#F7BE12" };
  const body = rects
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${colorMap[fills[r.k]]}" stroke="#080808" stroke-width="4.5"/>`)
    .join("");
  // 相同的标题与展讯文字示意条，确保四版唯一变量是原色落位
  const titleInk = fills.tl === "R" || fills.tl === "B" ? "#FFFFFF" : "#080808";
  const subInk = fills.mc === "R" || fills.mc === "B" ? "#FFFFFF" : "#3A3731";
  const copy =
    `<rect x="14" y="18" width="96" height="12" fill="${titleInk}"/>` +
    `<rect x="14" y="36" width="66" height="9" fill="${titleInk}"/>` +
    `<rect x="14" y="54" width="32" height="3.5" fill="${titleInk}"/>` +
    `<rect x="84" y="96" width="62" height="5" fill="${subInk}"/>` +
    `<rect x="84" y="106" width="52" height="5" fill="${subInk}"/>` +
    `<rect x="84" y="116" width="44" height="5" fill="${subInk}"/>`;
  return body + copy;
}

const QUIZ_DATA = {
  A: {
    fills: { tl: "W", tr: "B", ml: "W", mc: "W", mr: "Y", bl: "R", bc: "W", br: "W" },
    correct: true,
    reason: "方案 A（正解）：左下红块与右上蓝块、右中明黄隔着大片暖白形成斜对角配重，暖白留白 68% 让标题与展讯清清爽爽，完全符合非对称动态平衡。",
  },
  B: {
    fills: { tl: "R", tr: "W", ml: "Y", mc: "W", mr: "W", bl: "B", bc: "W", br: "W" },
    correct: false,
    reason: "方案 B（单侧堆重）：红、黄、蓝全压在最左侧一列（留白 52%），整张海报的视觉重心往左严重倾倒，右半边轻飘飘接不住。",
  },
  C: {
    fills: { tl: "Y", tr: "R", ml: "B", mc: "R", mr: "Y", bl: "R", bc: "B", br: "W" },
    correct: false,
    reason: "方案 C（原色过载）：留白被压到仅剩 8%，连标题与说明文字都泡在强饱和色里，色块彼此抢戏，读者一眼感到窒息。",
  },
  D: {
    fills: { tl: "W", tr: "W", ml: "R", mc: "W", mr: "R", bl: "B", bc: "W", br: "B" },
    correct: false,
    reason: "方案 D（静态镜像对称）：虽然留白 67% 且标题在白格里，但左右两翼排了完全镜像对称的双红与双蓝，锁死了动态张力，偏离蒙德里安的非对称对位原则。",
  },
};

for (const [k, item] of Object.entries(QUIZ_DATA)) {
  document.getElementById(`quiz-svg-${k}`).innerHTML = buildQuizSvg(item.fills);
}

const quizCards = [...document.querySelectorAll(".quiz-card")];
const quizFeedback = document.getElementById("quiz-feedback");
const quizFbBadge = document.getElementById("quiz-fb-badge");
const quizFbTitle = document.getElementById("quiz-fb-title");
const quizFbBody = document.getElementById("quiz-fb-body");
const quizBreakdown = document.getElementById("quiz-breakdown");

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const pick = card.dataset.choice;
    const item = QUIZ_DATA[pick];
    quizCards.forEach((c) => {
      c.classList.remove("is-picked", "is-correct", "is-wrong");
      if (c.dataset.choice === "A") c.classList.add("is-correct");
      if (c === card) {
        c.classList.add("is-picked");
        if (!item.correct) c.classList.add("is-wrong");
      }
    });

    quizFeedback.hidden = false;
    quizFbBadge.classList.toggle("is-wrong", !item.correct);
    quizFbBadge.textContent = item.correct ? "判断准确" : `你选了方案 ${pick}`;
    quizFbTitle.textContent = item.correct
      ? "方案 A 是唯一同时做到留白透气与斜对角非对称平衡的版面"
      : "最稳的是方案 A——看看这四版在同一个变量上的差别";
    quizFbBody.textContent = item.reason;
    quizBreakdown.innerHTML = ["A", "B", "C", "D"]
      .map((k) => `<div class="qbd-item">${QUIZ_DATA[k].reason}</div>`)
      .join("");
  });
});

// ==================== 8. 07 节：原海报放大灯箱（Esc 关、可拖、可缩） ====================
const posterEl = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbZoom = document.getElementById("lb-zoom");

const lb = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lb.tx}px, ${lb.ty}px) scale(${lb.scale})`;
  lbZoom.textContent = `${Math.round(lb.scale * 100)}%`;
}

function resetLb() {
  lb.scale = 1;
  lb.tx = 0;
  lb.ty = 0;
  applyLbTransform();
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterEl.src; // 只复用已内联的一份海报 src
  resetLb();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-in").addEventListener("click", () => {
  lb.scale = Math.min(3.2, +(lb.scale + 0.3).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-out").addEventListener("click", () => {
  lb.scale = Math.max(0.7, +(lb.scale - 0.3).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", resetLb);

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.16 : -0.16;
    lb.scale = Math.max(0.7, Math.min(3.4, +(lb.scale + step).toFixed(2)));
    applyLbTransform();
  },
  { passive: false }
);

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lb.scale <= 1.05) {
    closeLightbox();
    return;
  }
  lb.dragging = true;
  lb.sx = e.clientX;
  lb.sy = e.clientY;
  lb.ox = lb.tx;
  lb.oy = lb.ty;
  lbStage.classList.add("is-dragging");
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lb.dragging) return;
  lb.tx = lb.ox + (e.clientX - lb.sx);
  lb.ty = lb.oy + (e.clientY - lb.sy);
  applyLbTransform();
});

const stopLbDrag = () => {
  lb.dragging = false;
  lbStage.classList.remove("is-dragging");
};
lbStage.addEventListener("pointerup", stopLbDrag);
lbStage.addEventListener("pointercancel", stopLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});
