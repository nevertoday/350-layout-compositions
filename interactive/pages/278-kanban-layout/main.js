import { loop, pixelRatio } from "../../lib/stage.js";
import {
  ANTI_CASES,
  CARD_FIELDS,
  COLUMNS,
  HISTORY_ERAS,
  IDEAL_ORDER,
  LANES,
  LANE_MAP,
  PILLAR_DOCS,
  PRACTICE_OPTIONS,
  PRIORITIES,
  WIP_SIM_MODES,
  createBrokenState,
  createHealthyState,
  evaluateBoard,
  swapColumns,
  tryMoveCard,
} from "./model.js";

// ==================== 状态 ====================
let state = createBrokenState();
let dragSession = null; // { cardId, fromCol, el, startX, startY, dx, dy, pointerX, pointerY, hoverCol, active, blockedCol }
let lastEval = evaluateBoard(state);
let flowNeedsDraw = true;

// DOM 缓存
const $ = (sel, root = document) => root.querySelector(sel);
const boardEl = $("#kanban-board");
const boardScrollEl = $("#board-scroll");
const flowCanvas = $("#flow-canvas");
const topStatusEl = $("#top-status");
const titleDemoEl = $("#title-demo");
const kpiWipEl = $("#kpi-wip");
const kpiHotEl = $("#kpi-hot");
const kpiCycleEl = $("#kpi-cycle");
const stageToastEl = $("#stage-toast");
const diagBoxEl = $("#diag-box");
const diagTagEl = $("#diag-tag");
const diagTitleEl = $("#diag-title");
const diagWhyEl = $("#diag-why");
const diagActionEl = $("#diag-action");
const fiveStripEl = $("#five-strip");

// ==================== 辅助：原海报色形 SVG（无五官） ====================
function shapeSvg(shape, color, size = 10) {
  if (shape === "square") {
    return `<svg class="k-shape" viewBox="0 0 12 12" width="${size}" height="${size}" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill="${color}"/></svg>`;
  }
  if (shape === "triangle") {
    return `<svg class="k-shape" viewBox="0 0 12 12" width="${size}" height="${size}" aria-hidden="true"><polygon points="6,1.2 11,10.5 1,10.5" fill="${color}"/></svg>`;
  }
  return `<svg class="k-shape" viewBox="0 0 12 12" width="${size}" height="${size}" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="${color}"/></svg>`;
}

// ==================== 渲染活体看板 ====================
function renderCardMarkup(card, colIndex, colCount) {
  const lane = LANE_MAP[card.lane];
  const prio = PRIORITIES[card.priority];
  const isDone = card.col === "done";
  const isSelected = state.selectedCardId === card.id;
  const isBloated = state.cardDensity === "bloated";
  const isStripped = state.cardDensity === "stripped";
  const shapeColor = isBloated ? "#7B8074" : lane.color;
  const urgentDue = card.due === "明天" && !isDone;
  const prevCol = colIndex > 0 ? state.colOrder[colIndex - 1] : "";
  const nextCol = colIndex < colCount - 1 ? state.colOrder[colIndex + 1] : "";

  const perfAttr = card.isHeroDrag ? ' id="hero-drag-card" data-perf-drag' : "";
  const classes = [
    "k-card",
    isSelected ? "is-selected" : "",
    isDone ? "is-done-card" : "",
    isBloated ? "is-bloated" : "",
  ].filter(Boolean).join(" ");

  let metaHtml = "";
  if (!isStripped) {
    metaHtml = `
      <div class="k-meta">
        <div class="k-badges">
          <span class="k-prio" style="background:${prio.bg};color:${prio.fg};border-color:${prio.border}">${prio.label}</span>
          <span class="k-due${urgentDue ? " is-urgent" : ""}">${card.due}</span>
        </div>
        <div class="k-right">
          <span class="k-owner" style="background:${isBloated ? "#687064" : lane.text}" title="负责人：${card.owner}">${card.owner}</span>
          <button type="button" class="k-move-btn" data-move-card="${card.id}" data-move-to="${prevCol}" ${prevCol ? "" : "disabled"} aria-label="将${card.title}移到左一列">←</button>
          <button type="button" class="k-move-btn" data-move-card="${card.id}" data-move-to="${nextCol}" ${nextCol ? "" : "disabled"} aria-label="将${card.title}移到右一列">→</button>
        </div>
      </div>
    `;
  } else {
    metaHtml = `
      <div class="k-meta">
        <span class="k-due">缺优先级 / 缺负责人</span>
        <div class="k-right">
          <button type="button" class="k-move-btn" data-move-card="${card.id}" data-move-to="${prevCol}" ${prevCol ? "" : "disabled"} aria-label="将${card.title}移到左一列">←</button>
          <button type="button" class="k-move-btn" data-move-card="${card.id}" data-move-to="${nextCol}" ${nextCol ? "" : "disabled"} aria-label="将${card.title}移到右一列">→</button>
        </div>
      </div>
    `;
  }

  const bloatHtml = isBloated
    ? `<div class="k-bloat"><div class="k-bloat-row"><span>${card.extra.idCode} · 建于 ${card.extra.created}</span><span>估 ${card.extra.est}</span></div><p class="k-bloat-note">${card.extra.note}</p></div>`
    : "";

  return `
    <article class="${classes}"${perfAttr} data-card-id="${card.id}" data-col-id="${card.col}" tabindex="0" role="group" aria-label="${card.title}，所在列${COLUMNS[card.col].zh}，${prio.label}，负责人${card.owner}">
      <div class="k-top">
        ${isStripped ? "" : shapeSvg(card.shape, shapeColor)}
        <p class="k-title">${card.title}</p>
        ${isDone ? '<span class="k-done-check" aria-hidden="true">✓</span>' : ""}
      </div>
      ${metaHtml}
      ${bloatHtml}
    </article>
  `;
}

function renderBoard() {
  lastEval = evaluateBoard(state);
  const { counts, overloadedCols } = lastEval;
  const overSet = new Set(overloadedCols.map((o) => o.id));

  boardEl.classList.toggle("has-lanes", state.swimlanes);
  const parts = [];

  if (state.swimlanes) {
    parts.push(`<div class="kb-corner">泳道<span lang="en">LANES</span></div>`);
  }

  // 5 列表头
  state.colOrder.forEach((colId, idx) => {
    const col = COLUMNS[colId];
    const cnt = counts[colId];
    const isOver = overSet.has(colId);
    const isWrongOrder = col.idealIndex !== idx;
    const wipLabel =
      col.wipLimit === null
        ? `${cnt}`
        : state.wipEnabled
          ? `${cnt}/${col.wipLimit}`
          : `${cnt}/∞`;
    const swapNext = idx < state.colOrder.length - 1;
    const nextColId = swapNext ? state.colOrder[idx + 1] : null;
    const isAlertSwap = swapNext && COLUMNS[colId].idealIndex > COLUMNS[nextColId].idealIndex;

    parts.push(`
      <div class="kb-col-head${isOver ? " is-over" : ""}${isWrongOrder ? " is-wrong-order" : ""}" data-col="${colId}" data-col-idx="${idx}">
        <div class="kb-head-top">
          <span class="kb-col-zh">${col.zh}</span>
        </div>
        <span class="kb-col-en" lang="en">${col.en}</span>
        <div class="kb-head-bottom">
          <span class="wip-pill">${wipLabel}</span>
          ${
            swapNext
              ? `<button type="button" class="swap-btn${isAlertSwap ? " is-alert" : ""}" data-swap="${idx}" aria-label="与右侧${COLUMNS[nextColId].zh}交换列序" title="与右列交换顺序">⇄</button>`
              : ""
          }
        </div>
      </div>
    `);
  });

  // 单元格与卡片
  if (state.swimlanes) {
    LANES.forEach((lane, rowIdx) => {
      parts.push(`
        <div class="kb-lane-head" data-lane="${lane.id}">
          <span class="kb-lane-zh"><i class="kb-lane-bar" style="background:${lane.color}"></i>${lane.zh}</span>
          <span class="kb-lane-en" lang="en">${lane.en}</span>
        </div>
      `);
      state.colOrder.forEach((colId, colIdx) => {
        const cards = state.cards.filter((c) => c.col === colId && c.lane === lane.id);
        const cls = [
          "kb-cell",
          rowIdx % 2 === 1 ? "is-alt-row" : "",
          colIdx === state.colOrder.length - 1 ? "is-last-col" : "",
          overSet.has(colId) ? "is-over-col" : "",
        ].filter(Boolean).join(" ");
        parts.push(`
          <div class="${cls}" data-drop-col="${colId}" data-drop-lane="${lane.id}">
            ${cards.map((c) => renderCardMarkup(c, colIdx, state.colOrder.length)).join("")}
          </div>
        `);
      });
    });
  } else {
    state.colOrder.forEach((colId, colIdx) => {
      const cards = state.cards.filter((c) => c.col === colId);
      const cls = [
        "kb-cell",
        "is-flat-col",
        colIdx === state.colOrder.length - 1 ? "is-last-col" : "",
        overSet.has(colId) ? "is-over-col" : "",
      ].filter(Boolean).join(" ");
      parts.push(`
        <div class="${cls}" data-drop-col="${colId}">
          ${
            cards.length
              ? cards.map((c) => renderCardMarkup(c, colIdx, state.colOrder.length)).join("")
              : `<span class="kb-empty-slot">空列</span>`
          }
        </div>
      `);
    });
  }

  boardEl.innerHTML = parts.join("");
  syncTelemetryUI();
  flowNeedsDraw = true;
}

function syncTelemetryUI() {
  const ev = lastEval;

  // 顶眉胶囊
  topStatusEl.textContent = ev.score === 4 ? "4 / 4 看板畅通" : `${ev.score} / 4 待理顺`;
  topStatusEl.className = `status-pill ${ev.score === 4 ? "is-ok" : ev.score >= 2 ? "is-warn" : "is-err"}`;

  // 标题缩微 5 柱徽
  const bars = titleDemoEl.querySelectorAll("i");
  const overSet = new Set(ev.hiddenOverloadedCols.map((o) => o.id));
  state.colOrder.forEach((colId, i) => {
    const bar = bars[i];
    if (!bar) return;
    const cnt = ev.counts[colId];
    const h = Math.max(5, Math.min(22, 4 + cnt * 3));
    bar.style.height = `${h}px`;
    bar.className = overSet.has(colId) ? "is-over" : colId === "backlog" || colId === "done" ? "is-muted" : "";
  });

  // 刊头 KPI
  kpiWipEl.textContent = `${ev.activeWip} 张`;
  kpiWipEl.className = ev.doingIdle || ev.hiddenOverloadedCols.length ? "is-err" : "is-ok";
  const hotCol = COLUMNS[ev.bottleneckId];
  kpiHotEl.textContent = `${hotCol.zh} ${ev.counts[ev.bottleneckId]}`;
  kpiHotEl.className = ev.hiddenOverloadedCols.length ? "is-err" : "is-ok";
  kpiCycleEl.textContent = ev.activeWip === 0 ? "停摆" : `${ev.estCycleDays} 天`;
  kpiCycleEl.className = ev.estCycleDays > 7.5 || ev.activeWip === 0 ? "is-err" : "is-ok";

  // 诊单盒
  diagBoxEl.className = `diag-box is-${ev.diagnosis.kind}`;
  diagTagEl.textContent = ev.diagnosis.tag;
  diagTitleEl.textContent = ev.diagnosis.headline;
  diagWhyEl.textContent = ev.diagnosis.why;
  diagActionEl.textContent = ev.diagnosis.action;

  // 控件激活态同步
  document.querySelectorAll("[data-wip]").forEach((b) => {
    const active = (b.dataset.wip === "on") === state.wipEnabled;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-lane]").forEach((b) => {
    const active = (b.dataset.lane === "on") === state.swimlanes;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-density]").forEach((b) => {
    const active = b.dataset.density === state.cardDensity;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 底部五柱原则实时检核带
  for (const [key, info] of Object.entries(ev.fivePrinciples)) {
    const badge = fiveStripEl.querySelector(`[data-badge="${key}"]`);
    if (badge) {
      badge.textContent = info.badge;
      badge.classList.toggle("is-ok", info.ok);
    }
  }
}

function showToast(msg, ok = false) {
  stageToastEl.textContent = msg;
  stageToastEl.classList.toggle("is-ok", ok);
}

// 手机窄屏下把焦点「进行中」列居中滚入视口，露出左右相邻列边缘且使 data-perf-drag 位于屏幕水平中部
function centerFocusColumnIfNarrow() {
  if (boardScrollEl.scrollWidth <= boardScrollEl.clientWidth + 4) return;
  const focusCard = $("#hero-drag-card") || boardEl.querySelector('[data-col="doing"]');
  if (!focusCard) return;
  const sRect = boardScrollEl.getBoundingClientRect();
  const cRect = focusCard.getBoundingClientRect();
  const cardCenter = cRect.left - sRect.left + boardScrollEl.scrollLeft + cRect.width / 2;
  boardScrollEl.scrollLeft = Math.max(0, cardCenter - boardScrollEl.clientWidth / 2);
}

// ==================== 看板真实卡片跨列拖拽（Pointer Events，零 DOM 重建每帧 60fps） ====================
function detectHoverColumn(clientX) {
  const heads = [...boardEl.querySelectorAll(".kb-col-head")];
  for (const h of heads) {
    const r = h.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right) return h.dataset.col;
  }
  if (!heads.length) return null;
  if (clientX < heads[0].getBoundingClientRect().left) return heads[0].dataset.col;
  return heads[heads.length - 1].dataset.col;
}

function setColumnDropHighlight(colId, isBlocked) {
  boardEl.querySelectorAll(".is-drop-ok, .is-drop-block").forEach((el) => {
    el.classList.remove("is-drop-ok", "is-drop-block");
  });
  if (!colId) return;
  const cls = isBlocked ? "is-drop-block" : "is-drop-ok";
  const head = boardEl.querySelector(`.kb-col-head[data-col="${colId}"]`);
  if (head) head.classList.add(cls);
  boardEl.querySelectorAll(`.kb-cell[data-drop-col="${colId}"]`).forEach((c) => c.classList.add(cls));
}

boardEl.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  if (e.target.closest("button")) return;
  const cardEl = e.target.closest(".k-card");
  if (!cardEl) return;

  const cardId = cardEl.dataset.cardId;
  const fromCol = cardEl.dataset.colId;
  state.selectedCardId = cardId;
  boardEl.querySelectorAll(".k-card.is-selected").forEach((c) => c.classList.remove("is-selected"));
  cardEl.classList.add("is-selected");

  dragSession = {
    cardId,
    fromCol,
    el: cardEl,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    dx: 0,
    dy: 0,
    pointerX: e.clientX,
    pointerY: e.clientY,
    hoverCol: fromCol,
    active: false,
    blocked: false,
  };
  try { cardEl.setPointerCapture(e.pointerId); } catch {}
});

boardEl.addEventListener("pointermove", (e) => {
  if (!dragSession || e.pointerId !== dragSession.pointerId) return;
  const dx = e.clientX - dragSession.startX;
  const dy = e.clientY - dragSession.startY;

  if (!dragSession.active) {
    // 若非主角卡且明显竖向滑动，交给页面滚动
    if (!dragSession.el.hasAttribute("data-perf-drag") && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.35) {
      dragSession = null;
      return;
    }
    if (Math.hypot(dx, dy) < 4) return;
    dragSession.active = true;
    dragSession.el.classList.add("is-dragging");
  }

  dragSession.dx = dx;
  dragSession.dy = dy;
  dragSession.pointerX = e.clientX;
  dragSession.pointerY = e.clientY;

  const tilt = Math.max(-4, Math.min(4, dx * 0.025));
  dragSession.el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;

  const hoverCol = detectHoverColumn(e.clientX);
  if (hoverCol !== dragSession.hoverCol) {
    dragSession.hoverCol = hoverCol;
    const colMeta = hoverCol ? COLUMNS[hoverCol] : null;
    const blocked =
      !!colMeta &&
      hoverCol !== dragSession.fromCol &&
      state.wipEnabled &&
      colMeta.wipLimit !== null &&
      lastEval.counts[hoverCol] >= colMeta.wipLimit;
    dragSession.blocked = blocked;
    setColumnDropHighlight(hoverCol === dragSession.fromCol ? null : hoverCol, blocked);
  }
  flowNeedsDraw = true;
});

function finishDrag(cancelled) {
  if (!dragSession) return;
  const ds = dragSession;
  dragSession = null;

  ds.el.classList.remove("is-dragging");
  ds.el.style.transform = "";
  setColumnDropHighlight(null, false);

  if (!cancelled && ds.active && ds.hoverCol && ds.hoverCol !== ds.fromCol) {
    const res = tryMoveCard(state, ds.cardId, ds.hoverCol);
    if (res.moved) {
      showToast(res.message, true);
      renderBoard();
      return;
    }
    if (res.blocked) {
      showToast(res.message, false);
      ds.el.classList.add("is-blocked-shake");
      setTimeout(() => ds.el.classList.remove("is-blocked-shake"), 520);
    }
  }
  flowNeedsDraw = true;
}

boardEl.addEventListener("pointerup", (e) => {
  if (dragSession && e.pointerId === dragSession.pointerId) finishDrag(false);
});
boardEl.addEventListener("pointercancel", (e) => {
  if (dragSession && e.pointerId === dragSession.pointerId) finishDrag(true);
});

// 按钮点击：卡片内 ← / → 与列头 ⇄
boardEl.addEventListener("click", (e) => {
  const moveBtn = e.target.closest("[data-move-card]");
  if (moveBtn && moveBtn.dataset.moveTo) {
    const res = tryMoveCard(state, moveBtn.dataset.moveCard, moveBtn.dataset.moveTo);
    showToast(res.message, !!res.moved);
    if (res.moved) renderBoard();
    else {
      const cardEl = moveBtn.closest(".k-card");
      if (cardEl) {
        cardEl.classList.add("is-blocked-shake");
        setTimeout(() => cardEl.classList.remove("is-blocked-shake"), 500);
      }
    }
    return;
  }

  const swapBtn = e.target.closest("[data-swap]");
  if (swapBtn) {
    const idx = Number(swapBtn.dataset.swap);
    const a = COLUMNS[state.colOrder[idx]].zh;
    const b = COLUMNS[state.colOrder[idx + 1]].zh;
    swapColumns(state, idx, idx + 1);
    showToast(`已交换「${a}」与「${b}」的列序。`, true);
    renderBoard();
  }
});

// 键盘支持：焦点在卡片上时 ← / → 跨列移动，↑ / ↓ 切卡
boardEl.addEventListener("keydown", (e) => {
  const cardEl = e.target.closest(".k-card");
  if (!cardEl) return;
  const cardId = cardEl.dataset.cardId;
  const colIdx = state.colOrder.indexOf(cardEl.dataset.colId);
  if (e.key === "ArrowRight" && colIdx < state.colOrder.length - 1) {
    e.preventDefault();
    const res = tryMoveCard(state, cardId, state.colOrder[colIdx + 1]);
    showToast(res.message, !!res.moved);
    if (res.moved) {
      renderBoard();
      boardEl.querySelector(`[data-card-id="${cardId}"]`)?.focus();
    }
  } else if (e.key === "ArrowLeft" && colIdx > 0) {
    e.preventDefault();
    const res = tryMoveCard(state, cardId, state.colOrder[colIdx - 1]);
    showToast(res.message, !!res.moved);
    if (res.moved) {
      renderBoard();
      boardEl.querySelector(`[data-card-id="${cardId}"]`)?.focus();
    }
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const all = [...boardEl.querySelectorAll(".k-card")];
    const i = all.indexOf(cardEl);
    const next = all[(i + (e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length];
    if (next) {
      e.preventDefault();
      state.selectedCardId = next.dataset.cardId;
      next.focus();
      boardEl.querySelectorAll(".k-card.is-selected").forEach((c) => c.classList.remove("is-selected"));
      next.classList.add("is-selected");
    }
  }
});

// 控参按钮绑定
document.querySelectorAll("[data-wip]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.wipEnabled = btn.dataset.wip === "on";
    showToast(state.wipEnabled ? "已开启严格 WIP 上限：爆仓列将亮红灯，满额列将拦截新卡。" : "已关闭 WIP 上限：队列不再限制堆积。", state.wipEnabled);
    renderBoard();
  });
});

document.querySelectorAll("[data-lane]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.swimlanes = btn.dataset.lane === "on";
    showToast(state.swimlanes ? "已按产品 / 设计 / 开发 / 运维切开 4 条横向泳道。" : "已关闭泳道，所有职能任务混排在垂直列中。", state.swimlanes);
    renderBoard();
  });
});

document.querySelectorAll("[data-density]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.cardDensity = btn.dataset.density;
    const map = {
      bloated: "切换为 8 字段过载态：冗余描述拉高列长并撤去色标。",
      minimal: "切换为原海报 5 要素精简态：标题、色形、优先级、截止时间与负责人。",
      stripped: "切换为极简缺标态：撤去了优先级和负责人，只剩标题。",
    };
    showToast(map[state.cardDensity], state.cardDensity === "minimal");
    renderBoard();
  });
});

$("#btn-fix-order").addEventListener("click", () => {
  state.colOrder = [...IDEAL_ORDER];
  showToast("已将 5 列按真实工作流理顺：待办 → 进行中 → 评审中 → 测试中 → 已完成。", true);
  renderBoard();
});

$("#btn-healthy").addEventListener("click", () => {
  state = createHealthyState();
  showToast("已载入参考稳态：你仍可继续拖卡，试着把待办卡硬塞进 4/4 的进行中列。", true);
  renderBoard();
});

$("#btn-reset").addEventListener("click", () => {
  state = createBrokenState();
  showToast("已复原 0/4 错态：列序倒置、未限流爆仓、混堆无泳道、卡片过载。", false);
  renderBoard();
  centerFocusColumnIfNarrow();
});

// ==================== 顶沿 2D Canvas：五列在制品水位与流向测绘带 ====================
const flowCtx = flowCanvas.getContext("2d");
let flowW = 0;
let flowH = 0;

function resizeFlowCanvas() {
  const rect = flowCanvas.parentElement.getBoundingClientRect();
  const dpr = pixelRatio(2);
  flowW = Math.max(200, Math.round(rect.width));
  flowH = Math.max(40, Math.round(rect.height));
  flowCanvas.width = Math.round(flowW * dpr);
  flowCanvas.height = Math.round(flowH * dpr);
  flowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  flowNeedsDraw = true;
}

const flowLoop = loop(flowCanvas, (t, _dt, { still }) => {
  const isAnimating = dragSession?.active || lastEval.overloadedCols.length > 0 || !lastEval.orderOk || lastEval.score === 4 || t < 1.2;
  if (!still && !isAnimating && !flowNeedsDraw) return;
  if (!flowW) resizeFlowCanvas();
  flowNeedsDraw = false;

  const ctx = flowCtx;
  ctx.clearRect(0, 0, flowW, flowH);

  // 如果宽度足够且未发生横滚，直接对齐下方真实列；否则在全宽上等分 5 列作全局总览
  const sRect = flowCanvas.getBoundingClientRect();
  const isScrollable = boardScrollEl.scrollWidth > boardScrollEl.clientWidth + 6;
  const colRects = state.colOrder.map((colId, i) => {
    if (!isScrollable) {
      const head = boardEl.querySelector(`.kb-col-head[data-col="${colId}"]`);
      if (head) {
        const r = head.getBoundingClientRect();
        return { colId, x: r.left - sRect.left, w: r.width };
      }
    }
    const pad = 4;
    const cw = (flowW - pad * 2) / 5;
    return { colId, x: pad + i * cw, w: cw };
  });

  const overSet = new Set(lastEval.overloadedCols.map((o) => o.id));
  const hiddenOverSet = new Set(lastEval.hiddenOverloadedCols.map((o) => o.id));
  const introP = still ? 1 : Math.min(1, t / 0.5);
  const shortNames = { backlog: "待办", doing: "进行", review: "评审", testing: "测试", done: "完成" };

  // 每列水位柱 + WIP 虚线警戒位
  colRects.forEach((cr, idx) => {
    const col = COLUMNS[cr.colId];
    const cnt = lastEval.counts[cr.colId];
    const padX = cr.w < 84 ? 4 : 8;
    const barX = cr.x + padX;
    const barW = Math.max(24, cr.w - padX * 2);
    const baseY = flowH - 10;
    const maxH = flowH - 24;

    // 淡底槽
    ctx.fillStyle = "#E8E2D0";
    ctx.fillRect(barX, baseY - maxH, barW, maxH);

    // 实际高度（以 6 张为满槽）
    const fillRatio = Math.min(1, cnt / 6) * introP;
    const fillH = Math.max(cnt > 0 ? 4 : 0, fillRatio * maxH);
    const isOver = overSet.has(cr.colId);
    const isHiddenOver = hiddenOverSet.has(cr.colId);
    const isWrongPos = col.idealIndex !== idx;

    if (isOver) {
      const pulse = still ? 0 : Math.sin(t * 5) * 0.08;
      ctx.fillStyle = pulse > 0 ? "#C43B2B" : "#B83324";
    } else if (isHiddenOver) {
      ctx.fillStyle = "#D4692A";
    } else if (cr.colId === "backlog" || cr.colId === "done") {
      ctx.fillStyle = "#95AA8A";
    } else {
      ctx.fillStyle = "#3E6A3F";
    }
    ctx.fillRect(barX, baseY - fillH, barW, fillH);

    // WIP 上限警戒虚线
    if (col.wipLimit !== null) {
      const limY = baseY - (col.wipLimit / 6) * maxH;
      ctx.save();
      ctx.strokeStyle = state.wipEnabled ? (isOver ? "#8F2217" : "#1C3415") : "rgba(79,99,73,0.5)";
      ctx.lineWidth = state.wipEnabled ? 1.5 : 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(barX - 1, limY);
      ctx.lineTo(barX + barW + 1, limY);
      ctx.stroke();
      ctx.restore();
    }

    // 列名与数量短标（窄屏自动缩为两字短称防撞字）
    const compact = barW < 84;
    const titleLabel = compact ? shortNames[cr.colId] : col.zh;
    const tag =
      col.wipLimit !== null
        ? state.wipEnabled
          ? `${cnt}/${col.wipLimit}`
          : compact
            ? `${cnt}`
            : `${cnt}/∞`
        : `${cnt}`;

    ctx.fillStyle = isOver ? "#9E2618" : isWrongPos ? "#8B5700" : "#1C3415";
    ctx.font = `700 ${compact ? 10 : 11}px "Manrope","Noto Sans SC",sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(titleLabel, barX + 2, 11);

    ctx.textAlign = "right";
    ctx.font = `500 ${compact ? 10 : 10.5}px "DM Mono",monospace`;
    ctx.fillText(tag, barX + barW - 2, 11);
  });

  // 若存在列序倒置，画一条赤陶折返警示弧
  if (!lastEval.orderOk) {
    for (let i = 0; i < state.colOrder.length - 1; i++) {
      if (COLUMNS[state.colOrder[i]].idealIndex > COLUMNS[state.colOrder[i + 1]].idealIndex) {
        const a = colRects[i];
        const b = colRects[i + 1];
        const x1 = a.x + a.w * 0.5;
        const x2 = b.x + b.w * 0.5;
        ctx.save();
        ctx.strokeStyle = "#B83324";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x2, flowH - 6);
        ctx.quadraticCurveTo((x1 + x2) / 2, 12, x1, flowH - 6);
        ctx.stroke();
        ctx.restore();
        break;
      }
    }
  }

  // 若正在拖拽卡片，实时绘制从原列到当前指针/目标列的动态流向引导弧
  if (dragSession && dragSession.active) {
    const fromRect = colRects.find((r) => r.colId === dragSession.fromCol);
    const toRect = colRects.find((r) => r.colId === dragSession.hoverCol);
    if (fromRect) {
      const fx = fromRect.x + fromRect.w * 0.5;
      const tx = toRect
        ? toRect.x + toRect.w * 0.5
        : Math.max(12, Math.min(flowW - 12, dragSession.pointerX - sRect.left));
      const ptrX = Math.max(12, Math.min(flowW - 12, dragSession.pointerX - sRect.left));
      const targetX = isScrollable ? ptrX : tx;
      ctx.save();
      ctx.strokeStyle = dragSession.blocked ? "#B83324" : "#236636";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx, flowH - 5);
      ctx.quadraticCurveTo((fx + targetX) / 2, 6, targetX, flowH - 5);
      ctx.stroke();

      ctx.fillStyle = dragSession.blocked ? "#B83324" : "#236636";
      ctx.beginPath();
      ctx.arc(targetX, flowH - 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (lastEval.score === 4 && !still) {
    // 稳态时克制的单向左向右流光脉冲点（代表拉动流）
    const p = (t * 0.28) % 1;
    const x = 16 + p * (flowW - 32);
    ctx.fillStyle = "rgba(35, 102, 54, 0.72)";
    ctx.beginPath();
    ctx.arc(x, flowH - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
});

// ==================== 01 节：五柱骨架透视台 ====================
const pillarIcons = {
  status: `<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="4" y="6" width="11" height="24" rx="2" fill="currentColor"/><rect x="20" y="12" width="11" height="18" rx="2" fill="currentColor" opacity="0.55"/></svg>`,
  grouping: `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="7" r="4.5" fill="currentColor"/><rect x="13.5" y="14" width="9" height="9" rx="1.5" fill="currentColor" opacity="0.72"/><circle cx="18" cy="29" r="4.5" fill="currentColor" opacity="0.45"/></svg>`,
  flow: `<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M5 18H29M22 11L30 18L22 25" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  priority: `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="7" r="4.5" fill="currentColor"/><polygon points="18,13.5 23,22.5 13,22.5" fill="currentColor" opacity="0.75"/><rect x="13.5" y="25" width="9" height="8" rx="1.2" fill="currentColor" opacity="0.55"/></svg>`,
  compare: `<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="5" y="17" width="6" height="13" rx="1.5" fill="currentColor" opacity="0.55"/><rect x="15" y="11" width="6" height="19" rx="1.5" fill="currentColor"/><rect x="25" y="6" width="6" height="24" rx="1.5" fill="currentColor" opacity="0.78"/></svg>`,
};

function renderPillarDiagram(id) {
  const hiCol = id === "status";
  const hiLane = id === "grouping";
  const hiFlow = id === "flow";
  const hiPrio = id === "priority";
  const hiCmp = id === "compare";
  return `
    <svg viewBox="0 0 320 200" role="img" aria-label="看板${id}透视结构图">
      <rect x="8" y="8" width="304" height="184" rx="10" fill="#FAF7EE" stroke="#C5BEA8" stroke-width="1.5"/>
      <!-- 顶列表头 -->
      <rect x="8" y="8" width="304" height="34" rx="8" fill="${hiCol ? "#245728" : "#47683E"}"/>
      ${[0, 1, 2, 3].map((i) => {
        const x = 58 + i * 63;
        const labels = ["待办", "进行中", "评审", "完成"];
        return `
          <line x1="${x}" y1="8" x2="${x}" y2="192" stroke="${hiCol ? "#245728" : "#D6D0BC"}" stroke-width="${hiCol ? 1.8 : 1}"/>
          <text x="${x + 31}" y="29" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">${labels[i]}</text>
        `;
      }).join("")}
      <!-- 左侧泳道条 -->
      <rect x="8" y="42" width="50" height="150" fill="${hiLane ? "#245728" : "#4A6E47"}"/>
      ${["产品", "设计", "开发"].map((name, i) => {
        const y = 42 + i * 50;
        const colors = ["#5B8A47", "#D9A826", "#D86B20"];
        return `
          <line x1="8" y1="${y}" x2="312" y2="${y}" stroke="${hiLane ? "#245728" : "#D6D0BC"}" stroke-width="${hiLane ? 2 : 1}"/>
          <rect x="14" y="${y + 18}" width="3" height="14" rx="1.5" fill="${colors[i]}"/>
          <text x="23" y="${y + 29}" fill="#F6FAF2" font-size="11" font-weight="700">${name}</text>
        `;
      }).join("")}
      <!-- 示例卡 -->
      <g>
        <rect x="65" y="50" width="49" height="22" rx="4" fill="#FFF" stroke="#CCC6B3"/>
        <circle cx="73" cy="61" r="3.5" fill="${hiPrio ? "#5B8A47" : "#8FA585"}"/>
        <rect x="81" y="58" width="26" height="5" rx="2" fill="#D5D0BE"/>

        <rect x="128" y="50" width="49" height="22" rx="4" fill="#FFF" stroke="${hiCmp ? "#B83324" : "#CCC6B3"}" stroke-width="${hiCmp ? 2 : 1}"/>
        <rect x="132" y="57" width="7" height="7" rx="1.2" fill="${hiPrio ? "#D86B20" : "#8FA585"}"/>
        <rect x="143" y="58" width="26" height="5" rx="2" fill="${hiPrio ? "#D86B20" : "#D5D0BE"}"/>

        <rect x="128" y="99" width="49" height="22" rx="4" fill="#FFF" stroke="${hiCmp ? "#B83324" : "#CCC6B3"}" stroke-width="${hiCmp ? 2 : 1}"/>
        <circle cx="136" cy="110" r="3.5" fill="${hiPrio ? "#D9A826" : "#8FA585"}"/>
        <rect x="144" y="107" width="25" height="5" rx="2" fill="#D5D0BE"/>

        <rect x="128" y="149" width="49" height="22" rx="4" fill="#FFF" stroke="${hiCmp ? "#B83324" : "#CCC6B3"}" stroke-width="${hiCmp ? 2 : 1}"/>
        <polygon points="136,155 140,164 132,164" fill="${hiPrio ? "#B83324" : "#8FA585"}"/>
        <rect x="144" y="158" width="25" height="5" rx="2" fill="${hiPrio ? "#B83324" : "#D5D0BE"}"/>

        <rect x="191" y="100" width="49" height="22" rx="4" fill="#FFF" stroke="#CCC6B3"/>
        <circle cx="199" cy="111" r="3.5" fill="#5B8A47"/>
        <rect x="207" y="108" width="25" height="5" rx="2" fill="#D5D0BE"/>

        <rect x="254" y="50" width="49" height="22" rx="4" fill="#EFF5EC" stroke="#9FC29A"/>
        <text x="278" y="65" text-anchor="middle" fill="#245728" font-size="11" font-weight="700">✓</text>
      </g>
      ${
        hiFlow
          ? `<g>
              <path d="M90 132 H276" stroke="#245728" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M266 123 L278 132 L266 141" fill="none" stroke="#245728" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="122" y="120" width="62" height="22" rx="11" fill="#245728"/>
              <text x="153" y="135" text-anchor="middle" fill="#FFFFFF" font-size="10.5" font-weight="700">WIP ≤ 3</text>
            </g>`
          : ""
      }
      ${
        hiCmp
          ? `<g>
              <rect x="125" y="45" width="55" height="142" rx="6" fill="rgba(184,51,36,0.1)" stroke="#B83324" stroke-width="2" stroke-dasharray="4 3"/>
              <rect x="122" y="170" width="62" height="18" rx="9" fill="#B83324"/>
              <text x="153" y="183" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="700">瓶颈堆积</text>
            </g>`
          : ""
      }
    </svg>
  `;
}

function initPillars() {
  const tabsEl = $("#pillar-tabs");
  tabsEl.innerHTML = PILLAR_DOCS.map(
    (p, i) => `
      <button type="button" class="pillar-tab${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-pillar="${p.id}">
        ${pillarIcons[p.id]}
        <div><strong>${p.zh}</strong><span lang="en">${p.en}</span></div>
      </button>
    `
  ).join("");

  function selectPillar(id) {
    const doc = PILLAR_DOCS.find((p) => p.id === id) || PILLAR_DOCS[0];
    tabsEl.querySelectorAll(".pillar-tab").forEach((b) => {
      const on = b.dataset.pillar === doc.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $("#pillar-svg-box").innerHTML = renderPillarDiagram(doc.id);
    $("#pillar-kicker").textContent = `${doc.zh} · ${doc.en}`;
    $("#pillar-quote").textContent = `“${doc.quote}”`;
    $("#pillar-plain").textContent = doc.plain;
    $("#pillar-tip").textContent = `实操提醒：${doc.tip}`;
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pillar]");
    if (btn) selectPillar(btn.dataset.pillar);
  });
  selectPillar("status");
}

// ==================== 02 节：深松柏暗室 2D Canvas 利特尔法则模拟器 ====================
const wipCanvas = $("#wip-canvas");
const wipCtx = wipCanvas.getContext("2d");
let wipMode = WIP_SIM_MODES[1]; // 默认 WIP = 3 经验甜区
const sim = {
  clock: 0,
  spawnAccum: 0,
  nextId: 1,
  backlog: [],
  active: [],
  doneCount: 0,
  cycleSamples: [],
};

function seedSim() {
  sim.clock = 0;
  sim.spawnAccum = 0;
  sim.nextId = 1;
  sim.backlog = [];
  sim.active = [];
  sim.doneCount = 0;
  sim.cycleSamples = [];
  // 预置 5 张任务，开场画面立刻生动
  for (let i = 0; i < 5; i++) pushSimTask(true);
}

function pushSimTask(initial = false) {
  const colors = ["#8EE09C", "#F2C95D", "#F49A5A", "#B5C8B2"];
  const task = {
    id: sim.nextId++,
    color: colors[(sim.nextId - 1) % colors.length],
    createdAt: sim.clock,
    startedAt: null,
    progress: initial ? Math.random() * 0.55 : 0,
    laneSlot: (sim.nextId - 1) % 4,
  };
  if (sim.active.length < wipMode.limit) {
    task.startedAt = sim.clock;
    sim.active.push(task);
  } else if (sim.backlog.length < 10) {
    sim.backlog.push(task);
  }
}

let simW = 0;
let simH = 0;
function resizeWipCanvas() {
  const rect = wipCanvas.parentElement.getBoundingClientRect();
  const dpr = pixelRatio(2);
  simW = Math.max(240, Math.round(rect.width));
  simH = Math.max(180, Math.round(rect.height));
  wipCanvas.width = Math.round(simW * dpr);
  wipCanvas.height = Math.round(simH * dpr);
  wipCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateSimReadout() {
  const L = sim.active.length;
  const avgW = sim.cycleSamples.length
    ? (sim.cycleSamples.reduce((a, b) => a + b, 0) / sim.cycleSamples.length).toFixed(1)
    : ((Math.max(1, L) / Math.max(0.3, wipMode.capacity * (1 - wipMode.switchLoss))) * 1.8).toFixed(1);
  const lossPct = Math.round(wipMode.switchLoss * 100);
  $("#sim-l").textContent = `${L} 张`;
  $("#sim-l").className = L >= 6 ? "is-bad" : L >= 2 && L <= 4 ? "is-good" : "";
  $("#sim-done").textContent = `${sim.doneCount} 张`;
  $("#sim-w").textContent = `${avgW} 天`;
  $("#sim-w").className = Number(avgW) >= 6.5 ? "is-bad" : "is-good";
  $("#sim-loss").textContent = `${lossPct}%`;
  $("#sim-loss").className = lossPct >= 25 ? "is-bad" : "is-good";
  $("#sim-explain").textContent = wipMode.note;
}

function initWipSim() {
  const modesEl = $("#wip-modes");
  modesEl.innerHTML = WIP_SIM_MODES.map(
    (m) => `<button type="button" class="wip-mode-btn${m.id === wipMode.id ? " is-active" : ""}" data-sim-mode="${m.id}" aria-pressed="${m.id === wipMode.id}">${m.label}</button>`
  ).join("");

  modesEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sim-mode]");
    if (!btn) return;
    wipMode = WIP_SIM_MODES.find((m) => m.id === btn.dataset.simMode) || wipMode;
    modesEl.querySelectorAll(".wip-mode-btn").forEach((b) => {
      const on = b.dataset.simMode === wipMode.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    seedSim();
    updateSimReadout();
    wipLoop.draw();
  });

  $("#wip-push-btn").addEventListener("click", () => {
    pushSimTask(false);
    updateSimReadout();
    wipLoop.draw();
  });
  $("#wip-reset-btn").addEventListener("click", () => {
    seedSim();
    updateSimReadout();
    wipLoop.draw();
  });

  seedSim();
  updateSimReadout();
}

const wipLoop = loop(wipCanvas, (_t, dt, { still }) => {
  if (!simW) resizeWipCanvas();

  if (!still && dt > 0) {
    sim.clock += dt;
    sim.spawnAccum += dt;
    if (sim.spawnAccum >= 1.35) {
      sim.spawnAccum = 0;
      pushSimTask(false);
    }

    // 有效推进速度 = 团队基础吞吐 × (1 - 上下文切换损耗) / 当前并行数
    const n = sim.active.length;
    if (n > 0) {
      const effTeamSpeed = wipMode.capacity * (1 - wipMode.switchLoss);
      const perCardSpeed = (effTeamSpeed / n) * 0.28;
      for (let i = sim.active.length - 1; i >= 0; i--) {
        const item = sim.active[i];
        item.progress += perCardSpeed * dt;
        if (item.progress >= 1) {
          sim.active.splice(i, 1);
          sim.doneCount++;
          const days = Math.max(0.8, (sim.clock - item.startedAt) * 1.15);
          sim.cycleSamples.push(days);
          if (sim.cycleSamples.length > 10) sim.cycleSamples.shift();
        }
      }
    }
    while (sim.active.length < wipMode.limit && sim.backlog.length > 0) {
      const pulled = sim.backlog.shift();
      pulled.startedAt = sim.clock;
      sim.active.push(pulled);
    }
    updateSimReadout();
  }

  // 绘制三区队列：待办池 → 在制流水通道（带上限标尺）→ 已完成出口
  const ctx = wipCtx;
  ctx.clearRect(0, 0, simW, simH);

  const z1 = Math.round(simW * 0.22);
  const z2 = Math.round(simW * 0.78);

  // 分区背景
  ctx.fillStyle = "#172A18";
  ctx.fillRect(0, 0, z1, simH);
  ctx.fillStyle = sim.active.length >= 6 ? "#271C19" : "#122113";
  ctx.fillRect(z1, 0, z2 - z1, simH);
  ctx.fillStyle = "#172A18";
  ctx.fillRect(z2, 0, simW - z2, simH);

  // 分隔线
  ctx.strokeStyle = "#345235";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(z1, 0); ctx.lineTo(z1, simH);
  ctx.moveTo(z2, 0); ctx.lineTo(z2, simH);
  ctx.stroke();

  // 区标题
  ctx.font = `600 11px "Manrope","Noto Sans SC",sans-serif`;
  ctx.fillStyle = "#B9CEB5";
  ctx.textAlign = "left";
  ctx.fillText(`待办池 (${sim.backlog.length})`, 12, 20);
  ctx.fillStyle = sim.active.length >= 6 ? "#FF9482" : "#8EE09C";
  const limText = wipMode.id === "wipInf" ? "∞ 不限流" : `上限 ${wipMode.limit}`;
  ctx.fillText(`在制流道 L = ${sim.active.length} · ${limText}`, z1 + 12, 20);
  ctx.fillStyle = "#B9CEB5";
  ctx.fillText(`已交付 (${sim.doneCount})`, z2 + 12, 20);

  // 待办排队小块
  sim.backlog.slice(0, 8).forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = 12 + col * ((z1 - 30) / 2 + 4);
    const by = 34 + row * 38;
    const bw = Math.max(24, (z1 - 32) / 2);
    ctx.fillStyle = "#263D27";
    ctx.fillRect(bx, by, bw, 28);
    ctx.fillStyle = item.color;
    ctx.fillRect(bx, by, 4, 28);
    ctx.fillStyle = "#DCE8D9";
    ctx.font = `500 10px "DM Mono",monospace`;
    ctx.fillText(`#${item.id}`, bx + 8, by + 18);
  });

  // 在制流道任务块（水平推进条）
  const trackX = z1 + 14;
  const trackW = Math.max(80, z2 - z1 - 28);
  const rows = Math.max(4, Math.min(8, sim.active.length));
  const rowH = Math.min(34, (simH - 42) / rows);

  sim.active.slice(0, 8).forEach((item, i) => {
    const ry = 34 + i * rowH;
    const cardW = Math.min(68, trackW * 0.28);
    const px = trackX + item.progress * (trackW - cardW);

    // 轨道线
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(trackX, ry + rowH * 0.5 - 2, trackW, 4);

    // 移动中的任务卡
    ctx.fillStyle = "#233C25";
    ctx.strokeStyle = sim.active.length >= 6 ? "#E07D6C" : item.color;
    ctx.lineWidth = 1.4;
    ctx.fillRect(px, ry + 2, cardW, Math.max(18, rowH - 8));
    ctx.strokeRect(px, ry + 2, cardW, Math.max(18, rowH - 8));

    ctx.fillStyle = "#F2F7F0";
    ctx.font = `500 10px "DM Mono",monospace`;
    ctx.fillText(`#${item.id}`, px + 6, ry + Math.max(14, (rowH - 4) * 0.62));
  });

  // 出口汇总柱
  const doneBars = Math.min(10, sim.doneCount);
  for (let i = 0; i < doneBars; i++) {
    const by = simH - 18 - i * 16;
    if (by < 34) break;
    ctx.fillStyle = "#487A4B";
    ctx.fillRect(z2 + 14, by, Math.max(24, simW - z2 - 28), 11);
  }
});

// ==================== 03 节：卡片信息字段解剖台 ====================
const fieldState = Object.fromEntries(CARD_FIELDS.map((f) => [f.id, f.defaultOn]));

function renderCardAnatomy() {
  const stackEl = $("#sample-stack");
  const samples = [
    { title: "用户权限系统", lane: LANE_MAP.develop, shape: "circle", prio: PRIORITIES.high, due: "明天", owner: "铭", tag: "核心", code: "KB-110 · 11-14", desc: "角色颗粒度鉴权中间件重构与接口联调，涉及登录态兼容。", subs: ["权限表结构评审", "接口鉴权中间件", "灰度开关配置"] },
    { title: "组件库整理", lane: LANE_MAP.design, shape: "square", prio: PRIORITIES.mid, due: "周三", owner: "岚", tag: "规范", code: "KB-106 · 11-17", desc: "清理旧版弹窗变体并统一高对比色板与焦框规范。", subs: ["梳理弹窗变体", "核对色板对比度", "同步设计文档"] },
    { title: "容器资源扩容", lane: LANE_MAP.ops, shape: "triangle", prio: PRIORITIES.low, due: "周五", owner: "岳", tag: "基建", code: "KB-116 · 11-11", desc: "高峰时段自动弹性伸缩策略联调与压测演练。", subs: ["配置阈值策略", "压测冷启动耗时", "回滚演练"] },
  ];

  const coreOn = CARD_FIELDS.filter((f) => f.core && fieldState[f.id]).length;
  const extraOn = CARD_FIELDS.filter((f) => !f.core && fieldState[f.id]).length;
  const estHeight = Math.max(
    44,
    24 + CARD_FIELDS.reduce((sum, f) => sum + (fieldState[f.id] ? f.px : 0), 0)
  );
  const perScreen = Math.max(1, Math.floor(540 / (estHeight + 10)));

  $("#card-h-read").textContent = `单卡高度约 ${estHeight}px`;
  $("#card-cap-read").textContent = `一屏约扫 ${perScreen} 张 / 列`;

  const chip = $("#card-verdict-chip");
  const diag = $("#card-diagnosis");
  if (coreOn === 5 && extraOn === 0) {
    chip.textContent = "原海报 5 要素 · 刚刚好";
    chip.className = "card-verdict-chip is-ok";
    diag.textContent = "五项必要信息齐全且零冗余：一屏能一眼扫完多张卡的轻重缓急与归属，又不会把列撑成无休止的长滚条。点开灰度模拟，还能看到圆、方、三角三种形状在无色彩时依旧可辨。";
  } else if (extraOn > 0) {
    chip.textContent = `冗余 +${extraOn} 项 · 卡片偏胖`;
    chip.className = "card-verdict-chip";
    diag.textContent = `当前多勾选了 ${extraOn} 项详情页字段，单卡高度涨到约 ${estHeight}px，一屏只能扫到约 ${perScreen} 张。建议把长描述、创建日和明细子任务收回点开后的详情抽屉。`;
  } else {
    const missing = CARD_FIELDS.filter((f) => f.core && !fieldState[f.id]).map((f) => f.label.split("（")[0]).join("、");
    chip.textContent = `缺失 ${5 - coreOn} 项必要信息`;
    chip.className = "card-verdict-chip is-err";
    diag.textContent = `现在少了「${missing}」。卡面看似很瘦，但站会扫板时没法直接拍板先拉哪张、找谁协同，团队反而要一张张点开问。`;
  }

  stackEl.innerHTML = samples
    .map(
      (s) => `
      <article class="sample-card">
        <div class="sc-head">
          ${fieldState.tag ? shapeSvg(s.shape, s.lane.color, 11) : ""}
          <h4 class="sc-title">${fieldState.title ? s.title : "（未显示标题）"}</h4>
        </div>
        ${
          fieldState.priority || fieldState.tag
            ? `<div class="sc-tags">
                ${fieldState.priority ? `<span class="k-prio" style="background:${s.prio.bg};color:${s.prio.fg};border-color:${s.prio.border}">${s.prio.label}</span>` : ""}
                ${fieldState.tag ? `<span class="sc-tag">${s.tag}</span>` : ""}
              </div>`
            : ""
        }
        ${fieldState.desc ? `<p class="sc-desc">${s.desc}</p>` : ""}
        ${fieldState.meta ? `<p class="sc-meta">${s.code}</p>` : ""}
        ${fieldState.subtasks ? `<ul class="sc-subs">${s.subs.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
        ${
          fieldState.due || fieldState.owner
            ? `<div class="sc-foot">
                <span>${fieldState.due ? `截止：${s.due}` : ""}</span>
                ${fieldState.owner ? `<span class="k-owner" style="background:${s.lane.text}">${s.owner}</span>` : ""}
              </div>`
            : ""
        }
      </article>
    `
    )
    .join("");
}

function initCardLab() {
  const checksEl = $("#field-checks");
  const legend = checksEl.querySelector("legend");
  const itemsHtml = CARD_FIELDS.map(
    (f) => `
      <label class="field-item${f.core ? "" : " is-extra"}">
        <input type="checkbox" data-field="${f.id}" ${fieldState[f.id] ? "checked" : ""}>
        <div><strong>${f.label}</strong><span>${f.why}</span></div>
        <span class="field-badge">${f.core ? "必要" : "冗余"}</span>
      </label>
    `
  ).join("");
  checksEl.innerHTML = "";
  checksEl.appendChild(legend);
  checksEl.insertAdjacentHTML("beforeend", itemsHtml);

  checksEl.addEventListener("change", (e) => {
    const input = e.target.closest("[data-field]");
    if (!input) return;
    fieldState[input.dataset.field] = input.checked;
    renderCardAnatomy();
  });

  $("#mono-sim").addEventListener("change", (e) => {
    $("#sample-stack").classList.toggle("is-mono", e.target.checked);
  });

  $("#preset-five").addEventListener("click", () => {
    CARD_FIELDS.forEach((f) => { fieldState[f.id] = f.core; });
    checksEl.querySelectorAll("[data-field]").forEach((i) => { i.checked = fieldState[i.dataset.field]; });
    renderCardAnatomy();
  });

  $("#preset-all").addEventListener("click", () => {
    CARD_FIELDS.forEach((f) => { fieldState[f.id] = true; });
    checksEl.querySelectorAll("[data-field]").forEach((i) => { i.checked = true; });
    renderCardAnatomy();
  });

  renderCardAnatomy();
}

// ==================== 04 节：看板历史四代形态展签 ====================
function renderEraSvg(id) {
  if (id === "toyota1953") {
    return `<svg viewBox="0 0 320 190" role="img" aria-label="1953年丰田车间纸质取货看板卡示意">
      <rect x="16" y="20" width="136" height="150" rx="8" fill="#FAF7EE" stroke="#39623A" stroke-width="2"/>
      <rect x="16" y="20" width="136" height="30" rx="6" fill="#39623A"/>
      <text x="84" y="39" text-anchor="middle" fill="#FFF" font-size="11.5" font-weight="700">取货看板 · KANBAN</text>
      <text x="28" y="72" fill="#1C3415" font-size="11" font-weight="700">零件号：A-204</text>
      <text x="28" y="94" fill="#465A40" font-size="10.5">容器定量：20 件</text>
      <text x="28" y="116" fill="#465A40" font-size="10.5">前工序：机加工 2 线</text>
      <text x="28" y="138" fill="#465A40" font-size="10.5">后工序：总装台</text>
      <circle cx="128" cy="146" r="14" fill="none" stroke="#B83324" stroke-width="1.8"/>
      <text x="128" y="150" text-anchor="middle" fill="#B83324" font-size="10" font-weight="700">拉动</text>
      <path d="M162 95 H214" stroke="#245728" stroke-width="2.5" stroke-dasharray="5 3"/>
      <path d="M206 88 L216 95 L206 102" fill="none" stroke="#245728" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="224" y="42" width="80" height="46" rx="6" fill="#E6EFE0" stroke="#5B8A47" stroke-width="1.5"/>
      <text x="264" y="69" text-anchor="middle" fill="#1C3415" font-size="11" font-weight="700">下游取走</text>
      <rect x="224" y="106" width="80" height="46" rx="6" fill="#FAF7EE" stroke="#39623A" stroke-width="1.5"/>
      <text x="264" y="133" text-anchor="middle" fill="#1C3415" font-size="11" font-weight="700">上游补齐</text>
    </svg>`;
  }
  if (id === "little1961") {
    return `<svg viewBox="0 0 320 190" role="img" aria-label="1961年利特尔法则队列公式图">
      <rect x="14" y="16" width="292" height="158" rx="10" fill="#182B19"/>
      <text x="160" y="66" text-anchor="middle" fill="#8EE09C" font-size="30" font-weight="700" font-family="DM Mono,monospace">L = λ · W</text>
      <line x1="42" y1="88" x2="278" y2="88" stroke="#365537" stroke-width="1.2"/>
      <text x="64" y="114" text-anchor="middle" fill="#F2F7F0" font-size="12" font-weight="700">L 在制品</text>
      <text x="64" y="134" text-anchor="middle" fill="#B5CBB2" font-size="10.5">队列里堆的卡</text>
      <text x="160" y="114" text-anchor="middle" fill="#F2F7F0" font-size="12" font-weight="700">λ 吞吐率</text>
      <text x="160" y="134" text-anchor="middle" fill="#B5CBB2" font-size="10.5">每天交付几张</text>
      <text x="256" y="114" text-anchor="middle" fill="#FF9482" font-size="12" font-weight="700">W 周期时间</text>
      <text x="256" y="134" text-anchor="middle" fill="#F2C6BF" font-size="10.5">单卡耗时 W=L/λ</text>
    </svg>`;
  }
  if (id === "anderson2010") {
    return `<svg viewBox="0 0 320 190" role="img" aria-label="2010年研发团队实体白板便签墙示意">
      <rect x="14" y="16" width="292" height="158" rx="8" fill="#FAF7EE" stroke="#39623A" stroke-width="2"/>
      <line x1="111" y1="16" x2="111" y2="174" stroke="#B8B29C" stroke-width="1.5"/>
      <line x1="209" y1="16" x2="209" y2="174" stroke="#B8B29C" stroke-width="1.5"/>
      <text x="62" y="37" text-anchor="middle" fill="#1C3415" font-size="11.5" font-weight="800">分析 (2)</text>
      <text x="160" y="37" text-anchor="middle" fill="#1C3415" font-size="11.5" font-weight="800">开发 (3)</text>
      <text x="258" y="37" text-anchor="middle" fill="#1C3415" font-size="11.5" font-weight="800">上线</text>
      <rect x="28" y="52" width="68" height="38" rx="3" fill="#FAF0CE" stroke="#D9A826"/>
      <rect x="28" y="100" width="68" height="38" rx="3" fill="#E6EFE0" stroke="#5B8A47"/>
      <rect x="126" y="52" width="68" height="38" rx="3" fill="#FBE5D2" stroke="#D86B20"/>
      <rect x="126" y="100" width="68" height="38" rx="3" fill="#FAF0CE" stroke="#D9A826"/>
      <rect x="224" y="52" width="68" height="38" rx="3" fill="#E6EFE0" stroke="#5B8A47"/>
      <text x="258" y="75" text-anchor="middle" fill="#245728" font-size="12" font-weight="700">✓ 已交付</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 320 190" role="img" aria-label="2011年起数字多列拖拽看板界面示意">
    <rect x="14" y="16" width="292" height="158" rx="10" fill="#E8E3D2" stroke="#47683E" stroke-width="1.8"/>
    <rect x="14" y="16" width="292" height="24" rx="8" fill="#39623A"/>
    <circle cx="28" cy="28" r="3.5" fill="#AEBFA0"/><circle cx="40" cy="28" r="3.5" fill="#D9A826"/><circle cx="52" cy="28" r="3.5" fill="#D86B20"/>
    ${[0, 1, 2].map((i) => {
      const x = 24 + i * 94;
      return `<rect x="${x}" y="48" width="84" height="116" rx="6" fill="#FAF7EE" stroke="#CFC9B6"/>`;
    }).join("")}
    <rect x="31" y="58" width="70" height="26" rx="4" fill="#EFEAD8"/>
    <rect x="31" y="90" width="70" height="26" rx="4" fill="#EFEAD8"/>
    <g transform="translate(116,68) rotate(-4)">
      <rect x="0" y="0" width="76" height="30" rx="5" fill="#FFF" stroke="#245728" stroke-width="2"/>
      <circle cx="12" cy="15" r="4" fill="#D86B20"/>
      <rect x="22" y="11" width="42" height="7" rx="2" fill="#39623A"/>
    </g>
    <rect x="219" y="58" width="70" height="26" rx="4" fill="#E6EFE0" stroke="#5B8A47"/>
  </svg>`;
}

function initHistory() {
  const swEl = $("#era-switcher");
  swEl.innerHTML = HISTORY_ERAS.map(
    (e, i) => `
      <button type="button" class="era-btn${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-era="${e.id}">
        <span class="eb-y">${e.year}</span>
        <strong>${e.title}</strong>
      </button>
    `
  ).join("");

  function selectEra(id) {
    const era = HISTORY_ERAS.find((x) => x.id === id) || HISTORY_ERAS[0];
    swEl.querySelectorAll(".era-btn").forEach((b) => {
      const on = b.dataset.era === era.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $("#era-visual").innerHTML = renderEraSvg(era.id);
    $("#era-year").textContent = era.year;
    $("#era-title").textContent = era.title;
    $("#era-who").textContent = era.who;
    $("#era-body").textContent = era.body;
    $("#era-takeaway").textContent = `关键遗产：${era.takeaway}`;
  }

  swEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-era]");
    if (btn) selectEra(btn.dataset.era);
  });
  selectEra("toyota1953");
}

// ==================== 05 节：什么时候别用看板 ====================
function renderAntiSvgs(id) {
  const badItems =
    id === "calendar"
      ? ["周二 14:00", "周二 14:30", "周三 10:00", "周二 14:15"]
      : id === "table"
        ? ["#001 ¥480", "#002 ¥1290", "#003 ¥86", "... 297 条"]
        : id === "timeline"
          ? ["2021 v1", "2024 v4", "2022 v2", "2023 v3"]
          : ["卡 #12", "卡 #19", "卡 #24", "缺总指标"];
  const bad = `<svg viewBox="0 0 280 124" role="img" aria-label="硬套看板出现的问题示意">
    <rect x="6" y="6" width="268" height="112" rx="8" fill="#FAF7EE" stroke="#E09B92" stroke-width="1.5"/>
    ${[0, 1, 2].map((i) => `<rect x="${14 + i * 86}" y="14" width="78" height="96" rx="5" fill="#F4EFE1" stroke="#D8D2BF"/>`).join("")}
    ${badItems
      .map(
        (txt, r) =>
          `<rect x="19" y="${21 + r * 21}" width="68" height="16" rx="3" fill="#FCEBE8" stroke="#D88A80"/><text x="53" y="${32 + r * 21}" text-anchor="middle" fill="#8F2217" font-size="8.5" font-weight="700">${txt}</text>`
      )
      .join("")}
    <text x="184" y="66" text-anchor="middle" fill="#9E2618" font-size="11.5" font-weight="700">${
      id === "calendar" ? "时间撞车看不见" : id === "table" ? "300 张卡竖成天梯" : id === "timeline" ? "历史跨度被打散" : "缺全局汇总视角"
    }</text>
  </svg>`;

  let good = "";
  if (id === "calendar") {
    good = `<svg viewBox="0 0 280 124" role="img" aria-label="279 日历网格示意">
      <rect x="6" y="6" width="268" height="112" rx="8" fill="#FAF7EE" stroke="#9CC5A6" stroke-width="1.5"/>
      ${[0, 1, 2, 3, 4].map((c) => `<line x1="${16 + c * 52}" y1="24" x2="${16 + c * 52}" y2="112" stroke="#D4CEBA"/>`).join("")}
      ${[0, 1, 2].map((r) => `<line x1="16" y1="${24 + r * 30}" x2="264" y2="${24 + r * 30}" stroke="#D4CEBA"/>`).join("")}
      <rect x="20" y="30" width="44" height="20" rx="4" fill="#39623A"/>
      <rect x="72" y="60" width="96" height="20" rx="4" fill="#D86B20"/>
      <rect x="176" y="30" width="44" height="20" rx="4" fill="#5B8A47"/>
    </svg>`;
  } else if (id === "table") {
    good = `<svg viewBox="0 0 280 124" role="img" aria-label="274 数据表格示意">
      <rect x="6" y="6" width="268" height="112" rx="8" fill="#FAF7EE" stroke="#9CC5A6" stroke-width="1.5"/>
      <rect x="14" y="14" width="252" height="20" rx="4" fill="#39623A"/>
      ${[0, 1, 2, 3].map((r) => `<rect x="14" y="${40 + r * 18}" width="252" height="13" rx="2" fill="${r % 2 ? "#EFEAD8" : "#F7F4EA"}"/>`).join("")}
      <line x1="94" y1="14" x2="94" y2="108" stroke="#C8C2AE"/><line x1="176" y1="14" x2="176" y2="108" stroke="#C8C2AE"/>
    </svg>`;
  } else if (id === "timeline") {
    good = `<svg viewBox="0 0 280 124" role="img" aria-label="277 时间线示意">
      <rect x="6" y="6" width="268" height="112" rx="8" fill="#FAF7EE" stroke="#9CC5A6" stroke-width="1.5"/>
      <line x1="26" y1="62" x2="254" y2="62" stroke="#39623A" stroke-width="3"/>
      ${[44, 108, 172, 236].map((x, i) => `<circle cx="${x}" cy="62" r="7" fill="${i === 2 ? "#D86B20" : "#39623A"}"/><rect x="${x - 20}" y="${i % 2 ? 78 : 24}" width="40" height="16" rx="4" fill="#E6EFE0"/>`).join("")}
    </svg>`;
  } else {
    good = `<svg viewBox="0 0 280 124" role="img" aria-label="273 仪表盘示意">
      <rect x="6" y="6" width="268" height="112" rx="8" fill="#FAF7EE" stroke="#9CC5A6" stroke-width="1.5"/>
      <rect x="16" y="16" width="76" height="36" rx="5" fill="#E6EFE0"/><rect x="102" y="16" width="76" height="36" rx="5" fill="#FAF0CE"/><rect x="188" y="16" width="76" height="36" rx="5" fill="#FBE8D6"/>
      <path d="M24 98 L72 82 L124 88 L178 66 L252 72" fill="none" stroke="#39623A" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }
  return { bad, good };
}

function initAntiCases() {
  const tabsEl = $("#anti-tabs");
  tabsEl.innerHTML = ANTI_CASES.map(
    (c, i) => `<button type="button" class="anti-tab${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-anti="${c.id}">${c.scene}</button>`
  ).join("");

  function selectAnti(id) {
    const item = ANTI_CASES.find((c) => c.id === id) || ANTI_CASES[0];
    tabsEl.querySelectorAll(".anti-tab").forEach((b) => {
      const on = b.dataset.anti === item.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const svgs = renderAntiSvgs(item.id);
    $("#anti-svg-bad").innerHTML = svgs.bad;
    $("#anti-svg-good").innerHTML = svgs.good;
    $("#anti-why-bad").textContent = item.whyBad;
    $("#anti-why-good").textContent = item.betterWhy;
    const link = $("#anti-link");
    link.href = item.betterUrl;
    link.textContent = `去看 ${item.betterName} 互动版 →`;
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-anti]");
    if (btn) selectAnti(btn.dataset.anti);
  });
  selectAnti("calendar");
}

// ==================== 06 节：练一练（盲测 A / B / C / D） ====================
let quizPicked = null;

function renderQuizSvg(opt, revealed) {
  const n = opt.cols.length;
  const pad = 8;
  const colW = (320 - pad * 2) / n;
  return `
    <svg viewBox="0 0 320 152" aria-hidden="true">
      <rect x="4" y="4" width="312" height="144" rx="8" fill="#F4EFE1" stroke="#C8C2AE" stroke-width="1.2"/>
      ${opt.cols
        .map((c, i) => {
          const x = pad + i * colW;
          const badge = c.limit !== null ? `${c.count}/${c.limit}` : `${c.count}`;
          const isErrCol =
            revealed &&
            ((opt.id === "A" && (c.name === "评审中" || c.name === "进行中")) ||
              (opt.id === "C" && c.name === "进行中") ||
              (opt.id === "D" && c.name === "处理中"));
          const headFill = isErrCol ? "#9E2618" : revealed && opt.correct ? "#2D5D31" : "#3E663F";
          const cardsToDraw = Math.min(c.count, 6);
          const cardH = cardsToDraw >= 5 ? 11.5 : 14;
          const gap = cardsToDraw >= 5 ? 3 : 4;
          const cardRects = Array.from({ length: cardsToDraw }, (_, k) => {
            const y = 44 + k * (cardH + gap);
            const dotC = ["#5B8A47", "#D9A826", "#D86B20", "#5C6B57"][(k + i) % 4];
            const barW = Math.max(14, (colW - 24) * (0.65 + ((k * 17) % 30) / 100));
            return `<rect x="${x + 4}" y="${y}" width="${colW - 10}" height="${cardH}" rx="2.5" fill="#FAF7EE" stroke="#CEC8B5" stroke-width="0.9"/><circle cx="${x + 10}" cy="${y + cardH / 2}" r="2.2" fill="${dotC}"/><rect x="${x + 15.5}" y="${y + cardH / 2 - 1.5}" width="${barW.toFixed(1)}" height="3" rx="1.2" fill="#D5D0BE"/>`;
          }).join("");
          const more = c.count > 6 ? `<text x="${x + colW / 2 - 1}" y="140" text-anchor="middle" fill="#465A40" font-size="9.5" font-weight="700">+${c.count - 6} 张</text>` : "";
          return `
            <rect x="${x + 1}" y="8" width="${colW - 4}" height="30" rx="4" fill="${headFill}"/>
            <text x="${x + colW / 2 - 1}" y="20" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="700">${c.name}</text>
            <text x="${x + colW / 2 - 1}" y="33" text-anchor="middle" fill="#E3EFE0" font-size="9" font-family="DM Mono,monospace">${badge}</text>
            ${cardRects}
            ${more}
          `;
        })
        .join("")}
    </svg>
  `;
}

function renderQuiz() {
  const grid = $("#quiz-grid");
  const revealed = quizPicked !== null;
  grid.innerHTML = PRACTICE_OPTIONS.map((opt) => {
    const picked = quizPicked === opt.id;
    const cls = [
      "quiz-opt",
      picked ? "is-picked" : "",
      revealed && opt.correct ? "is-correct" : "",
      revealed && picked && !opt.correct ? "is-wrong" : "",
    ].filter(Boolean).join(" ");
    const flag = !revealed ? "点击选择" : opt.correct ? "最佳方案" : picked ? "存在漏洞" : "对照项";
    return `
      <button type="button" class="${cls}" data-quiz="${opt.id}" aria-pressed="${picked}">
        <div class="qo-head">
          <span class="qo-letter">${opt.id}</span>
          <span class="qo-flag">${flag}</span>
        </div>
        ${renderQuizSvg(opt, revealed)}
      </button>
    `;
  }).join("");

  if (revealed) {
    const chosen = PRACTICE_OPTIONS.find((o) => o.id === quizPicked);
    const vBox = $("#quiz-verdict");
    vBox.className = `quiz-verdict ${chosen.correct ? "is-correct" : "is-wrong"}`;
    $("#qv-title").textContent = chosen.verdictTitle;
    $("#qv-body").textContent = chosen.verdictBody;
  }
}

function initQuiz() {
  renderQuiz();
  $("#quiz-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quiz]");
    if (!btn) return;
    quizPicked = btn.dataset.quiz;
    renderQuiz();
  });
}

// ==================== 07 节：原海报灯箱（复用 #poster.src，缩放 + 拖动 + Esc） ====================
function initLightbox() {
  const trigger = $("#poster-trigger");
  const posterImg = $("#poster");
  const lb = $("#lightbox");
  const lbStage = $("#lb-stage");
  const lbImg = $("#lb-img");
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  const applyTransform = () => {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    $("#lb-zoom-reset").textContent = `${Math.round(scale * 100)}%`;
  };

  function openLb() {
    lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1.15;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    $("#lb-close").focus();
  }

  function closeLb() {
    lb.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", openLb);
  $("#lb-close").addEventListener("click", closeLb);
  $("#lb-zoom-in").addEventListener("click", () => { scale = Math.min(3, +(scale + 0.3).toFixed(2)); applyTransform(); });
  $("#lb-zoom-out").addEventListener("click", () => { scale = Math.max(0.7, +(scale - 0.3).toFixed(2)); applyTransform(); });
  $("#lb-zoom-reset").addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.7, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    pan = { id: e.pointerId, sx: e.clientX, sy: e.clientY, bx: tx, by: ty };
    lbStage.classList.add("is-panning");
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = pan.bx + (e.clientX - pan.sx);
    ty = pan.by + (e.clientY - pan.sy);
    applyTransform();
  });
  const endPan = (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    pan = null;
    lbStage.classList.remove("is-panning");
  };
  lbStage.addEventListener("pointerup", endPan);
  lbStage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLb();
  });
}

// ==================== 启动 ====================
renderBoard();
initPillars();
initWipSim();
initCardLab();
initHistory();
initAntiCases();
initQuiz();
initLightbox();

window.addEventListener("resize", () => {
  resizeFlowCanvas();
  resizeWipCanvas();
  flowLoop.draw();
  wipLoop.draw();
  centerFocusColumnIfNarrow();
});

requestAnimationFrame(() => {
  resizeFlowCanvas();
  resizeWipCanvas();
  centerFocusColumnIfNarrow();
  flowLoop.draw();
  wipLoop.draw();
});
