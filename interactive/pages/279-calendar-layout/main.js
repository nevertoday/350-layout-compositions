// 279 日历布局 · 主开场活体日历排期台（DOM 矩阵 + 60fps 跨日拖拽 + 2D Canvas 测绘叠层）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  CATEGORIES,
  createBrokenEvents,
  createInitialState,
  createPosterEvents,
  dowLabel,
  evaluateCalendar,
  findConflicts,
  timeToMin,
} from "./model.js";
import {
  initDarkroomLabs,
  initEraTabs,
  initMicroscopeLab,
  initModuloLab,
  initPosterLightbox,
  initQuiz,
  initTriageLab,
} from "./labs.js";

const CHAOS_COLORS = {
  meeting: "#1E40FF",
  review: "#E51C63",
  research: "#D97706",
  training: "#7C3AED",
  personal: "#0F766E",
};

const state = createInitialState();
let evalResult = evaluateCalendar(state);
let activeDragEventId = "ev-design"; // 默认挂在拖拽轨上的焦点事件（6/20 撞期的「设计评审 14:00」）

// DOM 引用
const statusPill = document.getElementById("hero-status-pill");
const titleDayNum = document.getElementById("title-day-num");
const weekdaysEl = document.getElementById("cal-weekdays");
const gridStageEl = document.getElementById("cal-grid-stage");
const gridEl = document.getElementById("cal-grid");
const overlayCanvas = document.getElementById("cal-overlay-canvas");
const altViewEl = document.getElementById("cal-alt-view");
const dragHandleEl = document.getElementById("cal-drag-handle");
const dragPillDot = document.getElementById("drag-pill-dot");
const dragPillText = document.getElementById("drag-pill-text");
const rescheduleHint = document.getElementById("reschedule-hint");

const verdictBox = document.getElementById("verdict-box");
const verdictTag = document.getElementById("verdict-tag");
const verdictHeadline = document.getElementById("verdict-headline");
const verdictBody = document.getElementById("verdict-body");
const verdictAction = document.getElementById("verdict-action");

const todayDateLabel = document.getElementById("today-date-label");
const todayBody = document.getElementById("today-body");
const todayStat = document.getElementById("today-stat");

// 轻量 60fps 拖拽状态（拖动期间只做 GPU transform + Canvas 绘帧，绝不重排 DOM）
const drag = {
  active: false,
  mode: "rail", // "rail" | "cell"
  eventId: "ev-design",
  startX: 0,
  startY: 0,
  curX: 0,
  curY: 0,
  dx: 0,
  originDay: 20,
  hoverDay: 20,
  stageRect: null,
  cellBoxes: [], // { day, inMonth, col, row, x, y, w, h }
};

let overlayAnim = 0; // 开场扫描路径渐绘进度
let overlayPulse = 0;
let overlayNeedsDraw = true;

function getFeaturedEvent() {
  return state.events.find((e) => e.id === activeDragEventId) || state.events[0];
}

function getSelectedDayCell() {
  return evalResult.grid.cells.find((c) => c.inMonth && c.day === state.selectedDay) || evalResult.metrics.juneCells[0];
}

function moveEventToDay(eventId, newDay) {
  const targetDay = Math.max(1, Math.min(30, newDay));
  const ev = state.events.find((e) => e.id === eventId);
  if (!ev) return;
  ev.day = targetDay;
  state.selectedDay = targetDay;
  activeDragEventId = eventId;
  recomputeAndRender();
}

// 渲染顶部横拖改期轨状态
function renderDragRail() {
  const ev = getFeaturedEvent();
  if (!ev) return;
  const cat = CATEGORIES[ev.cat];
  const dayCell = evalResult.grid.cells.find((c) => c.inMonth && c.day === ev.day);
  const hasClash = dayCell && dayCell.conflicts.some(([a, b]) => a.id === ev.id || b.id === ev.id);

  dragPillDot.style.background = cat.dot;
  dragHandleEl.dataset.conflict = hasClash ? "true" : "false";
  dragPillText.textContent = `${ev.title} ${ev.start} · 6/${ev.day}${hasClash ? " 撞期" : ""}`;
  dragHandleEl.setAttribute("aria-label", `左右拖动或按方向键为 ${ev.title} 改期，当前 6 月 ${ev.day} 日`);
}

// 渲染表头 + 月视图网格（单真源读取 evalResult）
function renderMonthGrid() {
  const { grid } = evalResult;
  const templateCols = grid.colWeights.map((w) => `minmax(0, ${w}fr)`).join(" ");
  weekdaysEl.style.gridTemplateColumns = templateCols;
  gridEl.style.gridTemplateColumns = templateCols;
  gridEl.dataset.hierarchy = state.hierarchyMode;

  weekdaysEl.innerHTML = grid.headers.map((h) => `
    <div class="cal-wday ${h.weekend ? "is-weekend" : ""}" role="columnheader">
      <span>${h.zh}</span><span class="cal-wday-en" lang="en">${h.en}</span>
    </div>
  `).join("");

  const frag = document.createDocumentFragment();
  for (const cell of grid.cells) {
    const div = document.createElement("div");
    div.className = "cal-cell";
    div.setAttribute("role", "gridcell");
    div.dataset.day = String(cell.day);
    div.dataset.inMonth = cell.inMonth ? "1" : "0";
    div.dataset.col = String(cell.col);
    div.dataset.row = String(cell.row);

    if (!cell.inMonth) div.classList.add("is-out");
    if (cell.weekend) div.classList.add("is-weekend");
    if (cell.inMonth && cell.day === state.selectedDay) div.classList.add("is-selected");
    if (cell.conflicts.length > 0) div.classList.add("is-conflict");
    if (state.highlightPrinciple === "grid" && cell.inMonth && cell.dow === 1) div.classList.add("is-highlighted-col");

    const head = document.createElement("div");
    head.className = "cell-head";

    const daySpan = document.createElement("span");
    daySpan.className = "cell-day";
    daySpan.textContent = String(cell.day);
    head.appendChild(daySpan);

    // 5 列错拍或竖排时在每格角落印出真实星期，让用户肉眼看见「周一在四处乱跑」
    if (cell.inMonth && (state.colMode === "five" || state.orderMode !== "natural")) {
      const dowTag = document.createElement("span");
      dowTag.className = "cell-dow-tag";
      dowTag.textContent = dowLabel(cell.dow);
      head.appendChild(dowTag);
    } else if (cell.conflicts.length > 0) {
      const clash = document.createElement("span");
      clash.className = "cell-conflict-dot";
      clash.textContent = "撞期";
      head.appendChild(clash);
    }
    div.appendChild(head);

    if (cell.visible.length > 0) {
      const list = document.createElement("div");
      list.className = "cell-events";
      for (const ev of cell.visible) {
        const cat = CATEGORIES[ev.cat];
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "ev-chip";
        if (state.activeCat !== "all" && ev.cat !== state.activeCat) chip.classList.add("is-dimmed");
        if (ev.id === activeDragEventId) chip.classList.add("is-active-drag");
        chip.dataset.evId = ev.id;
        chip.style.setProperty("--ev-bg", cat.bg);
        chip.style.setProperty("--ev-fg", cat.fg);
        chip.style.setProperty("--ev-dot", cat.dot);
        chip.style.setProperty("--ev-chaos-bg", CHAOS_COLORS[ev.cat] || "#D91E63");

        const recTag = state.highlightPrinciple === "recurrence" && ev.recurring ? " · 周期" : "";
        let inner = `<span class="ev-chip-top"><span class="ev-dot"></span><span class="ev-title">${ev.title}${recTag}</span></span>`;
        if (state.hierarchyMode === "flat") {
          inner += `<span class="ev-verbose">${ev.start} ${ev.room} · ${ev.desc}</span>`;
        } else {
          inner += `<span class="ev-time">${ev.start}${ev.recurring && state.highlightPrinciple === "recurrence" ? " · " + ev.recurring : ""}</span>`;
        }
        chip.innerHTML = inner;

        chip.addEventListener("pointerdown", (e) => startCellEventDrag(e, ev.id));
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          activeDragEventId = ev.id;
          state.selectedDay = ev.day;
          recomputeAndRender();
        });
        list.appendChild(chip);
      }

      if (cell.hiddenCount > 0) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "cell-more-btn";
        more.textContent = `+${cell.hiddenCount} 项`;
        more.addEventListener("click", (e) => {
          e.stopPropagation();
          state.selectedDay = cell.day;
          recomputeAndRender();
        });
        list.appendChild(more);
      }
      div.appendChild(list);
    }

    if (cell.inMonth) {
      div.addEventListener("click", () => {
        state.selectedDay = cell.day;
        recomputeAndRender();
      });
    }
    frag.appendChild(div);
  }
  gridEl.replaceChildren(frag);
}

// 渲染周视图 / 议程流视图（与月视图共用同一份 state.events）
function renderAltView() {
  if (state.viewMode === "month") {
    weekdaysEl.hidden = false;
    gridStageEl.hidden = false;
    altViewEl.hidden = true;
    return;
  }

  weekdaysEl.hidden = true;
  gridStageEl.hidden = true;
  altViewEl.hidden = false;

  if (state.viewMode === "week") {
    // 以选中日所在自然周（6/17–6/23 或包含 selectedDay 的 7 天）展示等比小时时间轴
    const anchor = state.selectedDay;
    // June 1 = Sat(6), June 3 = Mon(1), June 10 = Mon, June 17 = Mon, June 24 = Mon
    const weekStartDay = anchor <= 2 ? 1 : anchor <= 9 ? 3 : anchor <= 16 ? 10 : anchor <= 23 ? 17 : 24;
    const days = Array.from({ length: 7 }, (_, i) => Math.min(30, weekStartDay + i));
    const hours = Array.from({ length: 12 }, (_, i) => 9 + i); // 09:00..20:00

    let html = `<div class="week-view-grid"><div class="wv-head">时段</div>`;
    for (const d of days) {
      const dow = new Date(Date.UTC(2024, 5, d)).getUTCDay();
      html += `<div class="wv-head ${d === state.selectedDay ? "is-today" : ""}">${dowLabel(dow)} 6/${d}</div>`;
    }
    html += `<div class="wv-time-col">${hours.map((h) => `<div class="wv-hour-label">${String(h).padStart(2, "0")}:00</div>`).join("")}</div>`;

    for (const d of days) {
      const evs = state.events
        .filter((e) => e.day === d && (state.activeCat === "all" || e.cat === state.activeCat))
        .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
      const clashes = findConflicts(evs);
      const clashIds = new Set(clashes.flatMap(([a, b]) => [a.id, b.id]));

      let blocks = "";
      evs.forEach((ev, idx) => {
        const cat = CATEGORIES[ev.cat];
        const topPx = Math.max(0, ((timeToMin(ev.start) - 9 * 60) / 60) * 36);
        const durPx = Math.max(28, ((timeToMin(ev.end) - timeToMin(ev.start)) / 60) * 36);
        const isOverlap = clashIds.has(ev.id);
        const offsetStyle = isOverlap ? `width:48%;left:${idx % 2 === 0 ? "2%" : "50%"};right:auto;` : "";
        blocks += `
          <div class="wv-block ${isOverlap ? "is-overlap" : ""}" style="top:${topPx}px;height:${durPx}px;--ev-bg:${cat.bg};--ev-fg:${cat.fg};--ev-dot:${cat.dot};${offsetStyle}">
            <strong>${ev.title}</strong>
            <span>${ev.start}–${ev.end}</span>
          </div>
        `;
      });
      html += `<div class="wv-day-col ${d === state.selectedDay ? "is-selected" : ""}">${blocks}</div>`;
    }
    html += `</div>`;
    altViewEl.innerHTML = html;
  } else {
    // 议程流视图
    const grouped = new Map();
    for (const ev of state.events) {
      if (state.activeCat !== "all" && ev.cat !== state.activeCat) continue;
      if (!grouped.has(ev.day)) grouped.set(ev.day, []);
      grouped.get(ev.day).push(ev);
    }
    const sortedDays = [...grouped.keys()].sort((a, b) => a - b);
    altViewEl.innerHTML = `<div class="agenda-list">${sortedDays.map((d) => {
      const dow = new Date(Date.UTC(2024, 5, d)).getUTCDay();
      const evs = grouped.get(d).sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
      return `
        <div class="agenda-day-group ${d === state.selectedDay ? "is-selected" : ""}">
          <div class="agenda-day-badge">
            <strong>6/${d}</strong>
            <span>${dowLabel(dow)} · ${evs.length} 场</span>
          </div>
          <div class="agenda-items">
            ${evs.map((ev) => {
              const cat = CATEGORIES[ev.cat];
              return `
                <div class="agenda-row" style="--ev-bg:${cat.bg};--ev-fg:${cat.fg};">
                  <div class="agenda-row-main">
                    <span class="ev-dot" style="background:${cat.dot};width:8px;height:8px;"></span>
                    <strong>${ev.title}</strong>
                    <span style="font-size:12px;color:var(--ink-muted);">${ev.room}</span>
                  </div>
                  <span class="agenda-row-time">${ev.start} – ${ev.end}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("")}</div>`;
  }
}

// 渲染右栏「布局逻辑」单真源诊断 + 4 项检核 + 「当日概览」抽屉
function renderSideRail() {
  const { checks, score, verdict } = evalResult;
  titleDayNum.textContent = String(state.selectedDay);

  statusPill.dataset.tone = verdict.tone;
  statusPill.textContent = verdict.tone === "pass" ? "4 / 4 已校准" : `${score} / 4 待校准`;

  verdictBox.dataset.tone = verdict.tone;
  verdictTag.textContent = verdict.tag;
  verdictHeadline.textContent = verdict.headline;
  verdictBody.textContent = verdict.body;
  verdictAction.textContent = verdict.action;

  for (const key of ["grid", "order", "hierarchy", "balance"]) {
    const li = document.querySelector(`.logic-item[data-check="${key}"]`);
    const txt = document.getElementById(`check-${key}-text`);
    if (li) li.dataset.pass = String(checks[key].pass);
    if (txt) txt.textContent = checks[key].label;
  }

  // 当日概览抽屉（实时随选中日刷新，支持一键前后移日）
  const cell = getSelectedDayCell();
  const clashIds = new Set(cell.conflicts.flatMap(([a, b]) => [a.id, b.id]));
  todayDateLabel.textContent = `6/${cell.day} ${dowLabel(cell.dow)}`;

  if (cell.events.length === 0) {
    todayBody.innerHTML = `<p class="today-empty">6 月 ${cell.day} 日目前全天无排期，是一块干净的可预约空档；可以直接把其他日期的撞期事件拖到这里。</p>`;
    todayStat.textContent = `空档日 · 留白 100%`;
  } else {
    todayBody.innerHTML = cell.events.map((ev) => {
      const cat = CATEGORIES[ev.cat];
      const clash = clashIds.has(ev.id);
      return `
        <div class="today-ev">
          <span class="today-ev-dot" style="background:${cat.dot}"></span>
          <div class="today-ev-info">
            <div class="today-ev-top">
              <span class="today-ev-title">${ev.title}</span>
              ${clash ? `<span class="today-ev-clash">${ev.start} 撞期</span>` : ""}
            </div>
            <div class="today-ev-meta">${ev.start} – ${ev.end} · ${ev.room}</div>
            <p class="today-ev-desc">${ev.desc}</p>
            <div class="today-ev-move">
              <button type="button" class="mini-move-btn" data-move-ev="${ev.id}" data-delta="-1" ${ev.day <= 1 ? "disabled" : ""}>← 移至 6/${Math.max(1, ev.day - 1)}</button>
              <button type="button" class="mini-move-btn" data-move-ev="${ev.id}" data-delta="1" ${ev.day >= 30 ? "disabled" : ""}>移至 6/${Math.min(30, ev.day + 1)} →</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    todayStat.textContent = `共 ${cell.events.length} 项 · ${cell.conflicts.length ? `${cell.conflicts.length} 处撞期` : `留白 ${cell.whitespacePct}%`}`;
    todayBody.querySelectorAll("[data-move-ev]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.moveEv;
        const delta = Number(btn.dataset.delta);
        const ev = state.events.find((x) => x.id === id);
        if (ev) moveEventToDay(id, ev.day + delta);
      });
    });
  }
}

function syncButtonStates() {
  document.querySelectorAll("[data-col-mode]").forEach((b) => {
    const on = b.dataset.colMode === state.colMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-order-mode]").forEach((b) => {
    const on = b.dataset.orderMode === state.orderMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-hierarchy-mode]").forEach((b) => {
    const on = b.dataset.hierarchyMode === state.hierarchyMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-cap-mode]").forEach((b) => {
    const on = b.dataset.capMode === state.capMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-week-start]").forEach((b) => {
    const on = b.dataset.weekStart === state.weekStart;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-view]").forEach((b) => {
    const on = b.dataset.view === state.viewMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-cat]").forEach((b) => {
    const on = b.dataset.cat === state.activeCat;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-principle]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.principle === state.highlightPrinciple));
  });
}

function recomputeAndRender() {
  evalResult = evaluateCalendar(state);
  syncButtonStates();
  renderDragRail();
  renderMonthGrid();
  renderAltView();
  renderSideRail();
  overlayAnim = 0;
  overlayNeedsDraw = true;
  if (overlayRunner) overlayRunner.draw();
}

/* ==================== 2D Canvas 实时测绘叠层（扫读轨迹 / 撞期环 / 60fps 拖拽投影） ==================== */
function measureCellBoxes() {
  const stageRect = gridStageEl.getBoundingClientRect();
  const boxes = [];
  for (const el of gridEl.children) {
    const r = el.getBoundingClientRect();
    boxes.push({
      day: Number(el.dataset.day),
      inMonth: el.dataset.inMonth === "1",
      col: Number(el.dataset.col),
      row: Number(el.dataset.row),
      x: r.left - stageRect.left,
      y: r.top - stageRect.top,
      w: r.width,
      h: r.height,
    });
  }
  return { stageRect, boxes };
}

function drawOverlay(t, dt, { still }) {
  if (state.viewMode !== "month") return;
  const rect = gridStageEl.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;

  const isAnimating = !still && (overlayAnim < 1 || drag.active || evalResult.metrics.conflictCount > 0 || state.orderMode !== "natural" || state.highlightPrinciple !== null);
  if (!isAnimating && !overlayNeedsDraw) return;

  if (still) {
    overlayAnim = 1;
  } else {
    if (overlayAnim < 1) overlayAnim = Math.min(1, overlayAnim + (dt || 0.016) * 1.4);
    overlayPulse = t;
  }
  overlayNeedsDraw = false;

  const dpr = pixelRatio(2);
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);
  if (overlayCanvas.width !== cw || overlayCanvas.height !== ch) {
    overlayCanvas.width = cw;
    overlayCanvas.height = ch;
  }
  const ctx = overlayCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const boxes = drag.active && drag.cellBoxes.length ? drag.cellBoxes : measureCellBoxes().boxes;
  if (!boxes.length) return;

  // 1. 若日期流向错乱（竖排跳行 / 倒序），画出前 12 天的赤红折返扫描路径
  if (state.orderMode !== "natural" && !drag.active) {
    const seq = boxes.filter((b) => b.inMonth && b.day >= 1 && b.day <= 12).sort((a, b) => a.day - b.day);
    if (seq.length >= 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(194, 31, 75, 0.72)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      const segs = seq.length - 1;
      const lim = overlayAnim * segs;
      ctx.beginPath();
      ctx.moveTo(seq[0].x + seq[0].w * 0.5, seq[0].y + 18);
      for (let i = 0; i < segs; i++) {
        const p = Math.max(0, Math.min(1, lim - i));
        if (p <= 0) break;
        const a = seq[i], b = seq[i + 1];
        const ax = a.x + a.w * 0.5, ay = a.y + 18;
        const bx = b.x + b.w * 0.5, by = b.y + 18;
        ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // 标出起止点
      const last = seq[Math.min(seq.length - 1, Math.floor(lim))];
      ctx.fillStyle = "#C21F4B";
      ctx.beginPath();
      ctx.arc(last.x + last.w * 0.5, last.y + 18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. 若点击「网格一致」原则或处于 5 列错拍，连结 6 月 4 个周一揭示是否竖直对齐
  if ((state.highlightPrinciple === "grid" || state.colMode === "five") && !drag.active) {
    const monDays = [3, 10, 17, 24];
    const pts = monDays
      .map((d) => boxes.find((b) => b.inMonth && b.day === d))
      .filter(Boolean);
    if (pts.length >= 2) {
      ctx.save();
      const aligned = state.colMode === "seven" && state.orderMode === "natural";
      ctx.strokeStyle = aligned ? "rgba(20, 108, 91, 0.8)" : "rgba(76, 60, 153, 0.62)";
      ctx.lineWidth = aligned ? 2.6 : 1.8;
      if (!aligned) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      pts.forEach((b, idx) => {
        const px = b.x + b.w - 14;
        const py = b.y + 16;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      for (const b of pts) {
        ctx.fillStyle = aligned ? "#146C5B" : "#4C3C99";
        ctx.beginPath();
        ctx.arc(b.x + b.w - 14, b.y + 16, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 3. 撞期脉冲框（轻量描边，60fps 极低开销）
  if (evalResult.metrics.conflictCount > 0 && !drag.active) {
    const pulse = still ? 0.85 : 0.45 + 0.45 * Math.sin(overlayPulse * 3.2);
    const seen = new Set(evalResult.metrics.conflicts.map((c) => c.day));
    for (const d of seen) {
      const box = boxes.find((b) => b.inMonth && b.day === d);
      if (!box) continue;
      ctx.save();
      ctx.strokeStyle = `rgba(194, 31, 75, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
      ctx.restore();
    }
  }

  // 4. 实时 60fps 拖拽投影（落点高光 + 弧线轨迹 + 目标日期空档/撞期即时浮标）
  if (drag.active) {
    const orig = boxes.find((b) => b.inMonth && b.day === drag.originDay);
    const target = boxes.find((b) => b.inMonth && b.day === drag.hoverDay);
    const ev = state.events.find((e) => e.id === drag.eventId);

    if (target && ev) {
      // 检查若落在此天是否撞期
      const others = state.events.filter((e) => e.id !== ev.id && e.day === target.day);
      const willClash = findConflicts([...others, { ...ev, day: target.day }]).length > 0;

      // 落点高亮整格
      ctx.save();
      ctx.fillStyle = willClash ? "rgba(194, 31, 75, 0.16)" : "rgba(76, 60, 153, 0.16)";
      ctx.fillRect(target.x + 1, target.y + 1, target.w - 2, target.h - 2);
      ctx.strokeStyle = willClash ? "#C21F4B" : "#4C3C99";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(target.x + 2, target.y + 2, target.w - 4, target.h - 4);

      // 起止抛物线弧线
      if (orig) {
        const sx = orig.x + orig.w * 0.5;
        const sy = orig.y + orig.h * 0.5;
        const tx = target.x + target.w * 0.5;
        const ty = target.y + target.h * 0.5;
        const mx = (sx + tx) * 0.5;
        const my = Math.min(sy, ty) - 34;

        ctx.strokeStyle = willClash ? "#C21F4B" : "#4C3C99";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(mx, my, tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = willClash ? "#C21F4B" : "#4C3C99";
        ctx.beginPath();
        ctx.arc(tx, ty, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 浮动实时目标读数胶囊
      const tag = `松手移至 6/${target.day} · ${willClash ? "将撞期" : others.length === 0 ? "空档" : `已有 ${others.length} 项`}`;
      ctx.font = '700 12px "Noto Sans SC", "Space Grotesk", sans-serif';
      const tw = ctx.measureText(tag).width + 20;
      const bx = Math.max(8, Math.min(rect.width - tw - 8, target.x + target.w * 0.5 - tw * 0.5));
      const by = Math.max(8, target.y - 28);
      ctx.fillStyle = willClash ? "#C21F4B" : "#28188B";
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, 24, 12);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, bx + tw * 0.5, by + 12.5);
      ctx.restore();
    }
  }
}

const overlayRunner = loop(overlayCanvas, drawOverlay);

/* ==================== 跨日拖拽交互（横拖轨 data-perf-drag + 网格内事件芯片直拖） ==================== */
function pickHoverDayFromPoint(clientX, clientY, mode) {
  if (!drag.stageRect || !drag.cellBoxes.length) return drag.originDay;
  const rx = clientX - drag.stageRect.left;
  const ry = clientY - drag.stageRect.top;

  if (mode === "rail") {
    // 横拖轨：根据水平位置映射到同一周或按列跨日改期，流畅连续覆盖 6/15..6/26 等多个邻日
    const ratio = Math.max(0, Math.min(1, rx / Math.max(1, drag.stageRect.width)));
    const { cols } = evalResult.grid;
    const targetCol = Math.min(cols - 1, Math.floor(ratio * cols));
    // 优先落在原事件所在行的对应列，若该格不在 6 月则回退同列最近 6 月日
    const origBox = drag.cellBoxes.find((b) => b.inMonth && b.day === drag.originDay);
    const sameRow = origBox && drag.cellBoxes.find((b) => b.inMonth && b.row === origBox.row && b.col === targetCol);
    if (sameRow) return sameRow.day;
    const sameCol = drag.cellBoxes.find((b) => b.inMonth && b.col === targetCol);
    return sameCol ? sameCol.day : drag.originDay;
  }

  // 网格内任意二维拖动：精确命中任意 6 月单元格
  for (const b of drag.cellBoxes) {
    if (b.inMonth && rx >= b.x && rx <= b.x + b.w && ry >= b.y && ry <= b.y + b.h) {
      return b.day;
    }
  }
  return drag.hoverDay;
}

function beginDrag(evId, clientX, clientY, mode) {
  if (state.viewMode !== "month") {
    state.viewMode = "month";
    recomputeAndRender();
  }
  const ev = state.events.find((e) => e.id === evId);
  if (!ev) return;
  const measured = measureCellBoxes();
  drag.active = true;
  drag.mode = mode;
  drag.eventId = evId;
  drag.startX = clientX;
  drag.startY = clientY;
  drag.curX = clientX;
  drag.curY = clientY;
  drag.dx = 0;
  drag.originDay = ev.day;
  drag.hoverDay = ev.day;
  drag.stageRect = measured.stageRect;
  drag.cellBoxes = measured.boxes;
  dragHandleEl.classList.add("is-dragging");
  overlayNeedsDraw = true;
  overlayRunner.draw();
}

function updateDrag(clientX, clientY) {
  if (!drag.active) return;
  drag.curX = clientX;
  drag.curY = clientY;
  drag.dx = Math.max(-130, Math.min(130, clientX - drag.startX));
  drag.hoverDay = pickHoverDayFromPoint(clientX, clientY, drag.mode);
  if (drag.mode === "rail") {
    dragHandleEl.style.transform = `translate3d(${drag.dx}px, 0, 0)`;
  }
  overlayNeedsDraw = true;
  overlayRunner.draw();
}

function finishDrag() {
  if (!drag.active) return;
  const targetDay = drag.hoverDay;
  const evId = drag.eventId;
  const moved = targetDay !== drag.originDay;
  drag.active = false;
  dragHandleEl.classList.remove("is-dragging");
  dragHandleEl.style.transform = "";
  if (moved) {
    moveEventToDay(evId, targetDay);
  } else {
    overlayNeedsDraw = true;
    overlayRunner.draw();
  }
}

// 绑定横拖改期轨（Pointer + Touch 兼容，保证 perf.mjs dispatchTouchEvent 百分百响应且 60fps）
dragHandleEl.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  dragHandleEl.setPointerCapture(e.pointerId);
  beginDrag(activeDragEventId, e.clientX, e.clientY, "rail");
});
dragHandleEl.addEventListener("pointermove", (e) => {
  if (drag.active && drag.mode === "rail") updateDrag(e.clientX, e.clientY);
});
dragHandleEl.addEventListener("pointerup", () => { if (drag.active && drag.mode === "rail") finishDrag(); });
dragHandleEl.addEventListener("pointercancel", () => { if (drag.active && drag.mode === "rail") finishDrag(); });

// 键盘操作支持：选中拖拽轨后用 ←/→ 改期，↑/↓ 跨周改期
dragHandleEl.addEventListener("keydown", (e) => {
  const ev = getFeaturedEvent();
  if (!ev) return;
  const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" ? -7 : e.key === "ArrowDown" ? 7 : 0;
  if (step !== 0) {
    e.preventDefault();
    moveEventToDay(ev.id, ev.day + step);
  }
});

// 网格内任意事件卡片直接按住跨日拖移
function startCellEventDrag(e, evId) {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const startX = e.clientX;
  const startY = e.clientY;
  let started = false;

  const onMove = (me) => {
    if (!started && Math.hypot(me.clientX - startX, me.clientY - startY) > 6) {
      started = true;
      beginDrag(evId, startX, startY, "cell");
    }
    if (started) updateDrag(me.clientX, me.clientY);
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    if (started) finishDrag();
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

/* ==================== 绑定 Hero 全部交互控件 ==================== */
document.querySelectorAll("[data-col-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.colMode = btn.dataset.colMode;
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-order-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.orderMode = btn.dataset.orderMode;
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-hierarchy-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.hierarchyMode = btn.dataset.hierarchyMode;
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-cap-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.capMode = btn.dataset.capMode;
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-week-start]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.weekStart = btn.dataset.weekStart;
    if (state.colMode === "five") state.colMode = "seven"; // 切换周首时自动切入 7 列让周首变化立竿见影
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.viewMode = btn.dataset.view;
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-cat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeCat = btn.dataset.cat;
    recomputeAndRender();
  });
});

document.querySelectorAll("[data-principle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.principle;
    state.highlightPrinciple = state.highlightPrinciple === p ? null : p;
    if (p === "overview" && state.highlightPrinciple === "overview") {
      state.viewMode = state.viewMode === "month" ? "week" : "month";
    }
    recomputeAndRender();
  });
});

document.getElementById("btn-jump-agenda").addEventListener("click", () => {
  state.viewMode = state.viewMode === "agenda" ? "month" : "agenda";
  recomputeAndRender();
});

document.getElementById("btn-load-poster").addEventListener("click", () => {
  state.colMode = "seven";
  state.weekStart = "mon";
  state.orderMode = "natural";
  state.hierarchyMode = "layered";
  state.capMode = "cap2";
  state.viewMode = "month";
  state.selectedDay = 20;
  state.activeCat = "all";
  state.events = createPosterEvents();
  activeDragEventId = "ev-design";
  recomputeAndRender();
});

document.getElementById("btn-reset-broken").addEventListener("click", () => {
  Object.assign(state, createInitialState());
  state.events = createBrokenEvents();
  activeDragEventId = "ev-design";
  recomputeAndRender();
});

window.addEventListener("resize", () => {
  overlayNeedsDraw = true;
  overlayRunner.draw();
}, { passive: true });

// 首次渲染 + 初始化全部正文实验室
recomputeAndRender();
initModuloLab();
initMicroscopeLab();
initDarkroomLabs();
initEraTabs();
initTriageLab();
initQuiz();
initPosterLightbox();
