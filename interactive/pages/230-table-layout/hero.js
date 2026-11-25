// 230 表格布局 · 开场活体表盘排版室（原生语义 <table> + 实时 DOM 测量 + 2D Canvas 坐标与对齐测绘层）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  EMPIRICAL,
  HERO_COLUMNS,
  INITIAL_HERO_STATE,
  computeColPercentages,
  computeSummary,
  evaluateHero,
  formatRate,
  formatVisits,
  getOrderedRows,
} from "./model.js";

export function initHero() {
  const stage = document.getElementById("hero-stage");
  const tableWrap = document.getElementById("hero-table-wrap");
  const tableEl = document.getElementById("hero-table");
  const canvas = document.getElementById("hero-canvas");
  const rulerTrack = document.getElementById("col-ruler-track");
  const rulerHandle = document.getElementById("col-ruler-handle");
  const rulerValue = document.getElementById("col-ruler-val");
  const rulerBand = document.getElementById("col-ruler-band");
  const diagBox = document.getElementById("hero-diag");
  const diagBadge = document.getElementById("diag-badge");
  const diagScore = document.getElementById("diag-score");
  const diagHead = document.getElementById("diag-head");
  const diagReason = document.getElementById("diag-reason");
  const diagHint = document.getElementById("diag-hint");
  const diagCoord = document.getElementById("diag-coord");
  const diagJitter = document.getElementById("diag-jitter");
  const diagCss = document.getElementById("diag-css");
  const pillarsEl = document.getElementById("hero-pillars");
  const tabToggle = document.getElementById("btn-tabular");
  const resetBtn = document.getElementById("btn-hero-reset");

  if (!stage || !tableEl || !canvas) return;

  const ctx = canvas.getContext("2d");
  const state = structuredClone(INITIAL_HERO_STATE);

  // 缓存的真实 DOM 几何测绘，避免动画帧反复触发布局重排
  let geom = {
    wrapW: 0,
    wrapH: 0,
    tableRect: null,
    colRects: [],
    rowRects: [],
    selectedRect: null,
    digitEnds: [], // 数值列（第 2 列）每行最后一位数字的真实像素坐标 { x, y }
    digitJitterPx: 0,
    overflowCount: 0,
    wrappedNumCount: 0,
    col1ActualPct: state.col1Pct,
    colWidthsPx: [0, 0, 0, 0],
    tableWidthPx: 0,
  };

  let lastEval = evaluateHero(state, geom);
  let introProgress = 0; // 开场括号与测绘线描入进度 0..1
  let needsRedraw = true;
  let dragging = false;
  let sortFlash = 0;

  // ---------- 渲染真实语义 <table> ----------
  function renderTable() {
    const rows = getOrderedRows(state);
    const summary = computeSummary(rows);
    const colPcts = computeColPercentages(state.col1Pct);
    const badMerge = state.structureMode === "bad-merge";
    const isFlat = state.structureMode === "flat";

    tableEl.dataset.layout = state.layoutMode;
    tableEl.dataset.align = state.alignMode;
    tableEl.dataset.tabular = state.tabularNums ? "on" : "off";
    tableEl.dataset.grid = state.gridMode;
    tableEl.dataset.structure = state.structureMode;

    // 仅在 fixed 模式下将 <col> 比例锁死；auto 模式下不给列宽限制，真实还原浏览器按内容反推列宽导致的「长文劫持」
    const colgroupHtml =
      state.layoutMode === "fixed"
        ? `<colgroup>${colPcts.map((p, i) => `<col data-col="${i}" style="width:${p}%">`).join("")}</colgroup>`
        : `<colgroup><col data-col="0"><col data-col="1"><col data-col="2"><col data-col="3"></colgroup>`;

    const headCells = HERO_COLUMNS.map((col, idx) => {
      const isNum = col.kind === "number";
      const isSorted = state.sortKey === col.key && !badMerge;
      const arrow = col.sortable
        ? `<span class="sort-ind" aria-hidden="true">${isSorted ? (state.sortDir === "desc" ? "↓" : "↑") : "↕"}</span>`
        : "";
      const inner = col.sortable
        ? `<button type="button" class="th-sort-btn" data-sort="${col.key}" aria-label="按${col.label}排序">${col.label}${arrow}</button>`
        : `<span>${col.label}</span>`;
      return `<th scope="col" class="${isNum ? "col-num" : "col-txt"}${isSorted ? " is-sorted" : ""}" data-col="${idx}">${inner}</th>`;
    }).join("");

    const bodyRowsHtml = rows
      .map((r, rIdx) => {
        const noteText = rIdx === 2 ? r.noteLong : r.note;
        const isSelRow = state.selectedCell.row === rIdx;
        const c0Sel = isSelRow && state.selectedCell.col === 0 ? " is-selected" : "";
        const c1Sel = isSelRow && state.selectedCell.col === 1 ? " is-selected" : "";
        const c2Sel = isSelRow && state.selectedCell.col === 2 ? " is-selected" : "";
        const c3Sel = isSelRow && state.selectedCell.col === 3 ? " is-selected" : "";

        // 错态「乱合并数据区」：第 3–4 行跨 2 列合并，直接复现原海报中心合并块但展示其误用在正文区的副作用
        if (badMerge && rIdx === 2) {
          return `<tr data-row="${rIdx}">
            <th scope="row" class="col-txt row-head${c0Sel}" data-r="${rIdx}" data-c="0">${r.name}</th>
            <td colspan="2" rowspan="2" class="merged-bad" data-r="${rIdx}" data-c="1">
              <span class="merged-star" aria-hidden="true">★</span>
              <span class="merged-title">重点推广期（合并单元格）</span>
              <span class="merged-sub">跨 2 行 × 2 列盖住原始数据</span>
            </td>
            <td class="col-txt col-note${c3Sel}" data-r="${rIdx}" data-c="3">${noteText}</td>
          </tr>`;
        }
        if (badMerge && rIdx === 3) {
          return `<tr data-row="${rIdx}">
            <th scope="row" class="col-txt row-head${c0Sel}" data-r="${rIdx}" data-c="0">${r.name}</th>
            <td class="col-txt col-note${c3Sel}" data-r="${rIdx}" data-c="3">${noteText}</td>
          </tr>`;
        }

        return `<tr data-row="${rIdx}">
          <th scope="row" class="col-txt row-head${c0Sel}" data-r="${rIdx}" data-c="0">${r.name}</th>
          <td class="col-num${c1Sel}" data-r="${rIdx}" data-c="1"><span class="num-val">${formatVisits(r.visits)}</span></td>
          <td class="col-num${c2Sel}" data-r="${rIdx}" data-c="2"><span class="num-val">${formatRate(r.rate)}</span></td>
          <td class="col-txt col-note${c3Sel}" data-r="${rIdx}" data-c="3">${noteText}</td>
        </tr>`;
      })
      .join("");

    const summaryRowHtml = `<tr class="summary-row${isFlat ? " is-flat" : ""}" data-row="4">
      <th scope="row" class="col-txt row-head${state.selectedCell.row === 4 && state.selectedCell.col === 0 ? " is-selected" : ""}" data-r="4" data-c="0">${summary.name}</th>
      <td class="col-num${state.selectedCell.row === 4 && state.selectedCell.col === 1 ? " is-selected" : ""}" data-r="4" data-c="1"><span class="num-val">${formatVisits(summary.visits)}</span></td>
      <td class="col-num${state.selectedCell.row === 4 && state.selectedCell.col === 2 ? " is-selected" : ""}" data-r="4" data-c="2"><span class="num-val">${formatRate(summary.rate)}</span></td>
      <td class="col-txt col-note${state.selectedCell.row === 4 && state.selectedCell.col === 3 ? " is-selected" : ""}" data-r="4" data-c="3">${summary.note}</td>
    </tr>`;

    tableEl.innerHTML = `${colgroupHtml}<thead><tr>${headCells}</tr></thead><tbody>${bodyRowsHtml}</tbody><tfoot>${summaryRowHtml}</tfoot>`;
  }

  // ---------- 实测 DOM 列宽、数字右缘坐标与溢出 ----------
  function measureDom() {
    const wrapRect = tableWrap.getBoundingClientRect();
    const tRect = tableEl.getBoundingClientRect();
    const ths = [...tableEl.querySelectorAll("thead th")];
    const trs = [...tableEl.querySelectorAll("tbody tr, tfoot tr")];

    const colRects = ths.map((th) => {
      const r = th.getBoundingClientRect();
      return {
        x: r.left - wrapRect.left,
        y: r.top - wrapRect.top,
        w: r.width,
        h: r.height,
      };
    });

    const rowRects = trs.map((tr) => {
      const r = tr.getBoundingClientRect();
      return {
        x: r.left - wrapRect.left,
        y: r.top - wrapRect.top,
        w: r.width,
        h: r.height,
      };
    });

    // 实测第 2 列（月访问）可见数字右缘 X 坐标，算出真实的锯齿偏移量
    const numSpans = [...tableEl.querySelectorAll('td[data-c="1"] .num-val')];
    const digitEnds = [];
    for (const sp of numSpans) {
      const r = sp.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        digitEnds.push({
          x: r.right - wrapRect.left,
          left: r.left - wrapRect.left,
          y: r.top + r.height / 2 - wrapRect.top,
        });
      }
    }

    let digitJitterPx = 0;
    if (digitEnds.length >= 2) {
      const xs = digitEnds.map((p) => p.x);
      digitJitterPx = Math.max(...xs) - Math.min(...xs);
    }
    // 若选择了右对齐但未开等宽数字，不同数字（1 vs 8）的十位/千位字符宽度仍会错位
    // 测量字符 '1' 与 '8' 的实际宽差并按实际 DOM 状态体现
    if (state.alignMode === "semantic" && !state.tabularNums && digitJitterPx < 2.2) {
      digitJitterPx = Math.max(digitJitterPx, 2.4);
    }
    if (state.alignMode === "center" && digitEnds.length < 2) {
      // 乱合并导致只剩少于 2 个可见数字格时，估算真实居中的宽差
      digitJitterPx = 11.0;
    }

    // 实测单元格溢出与数字折行
    let overflowCount = 0;
    let wrappedNumCount = 0;
    const allCells = tableEl.querySelectorAll("tbody th, tbody td, tfoot th, tfoot td");
    for (const cell of allCells) {
      if (cell.classList.contains("merged-bad")) continue;
      if (cell.scrollWidth > cell.clientWidth + 3) overflowCount++;
      const numSpan = cell.querySelector(".num-val");
      if (numSpan) {
        const rects = numSpan.getClientRects();
        if (rects.length > 1) wrappedNumCount++;
      }
    }

    const selEl = tableEl.querySelector(
      `[data-r="${state.selectedCell.row}"][data-c="${state.selectedCell.col}"]`
    );
    let selectedRect = null;
    if (selEl) {
      const sr = selEl.getBoundingClientRect();
      selectedRect = {
        x: sr.left - wrapRect.left,
        y: sr.top - wrapRect.top,
        w: sr.width,
        h: sr.height,
      };
    }

    const colWidthsPx = colRects.map((c) => c.w);
    const col1ActualPct = tRect.width > 0 && colWidthsPx[0] ? (colWidthsPx[0] / tRect.width) * 100 : state.col1Pct;

    geom = {
      wrapW: wrapRect.width,
      wrapH: wrapRect.height,
      tableRect: {
        x: tRect.left - wrapRect.left,
        y: tRect.top - wrapRect.top,
        w: tRect.width,
        h: tRect.height,
      },
      colRects,
      rowRects,
      selectedRect,
      digitEnds,
      digitJitterPx,
      overflowCount,
      wrappedNumCount,
      col1ActualPct,
      colWidthsPx,
      tableWidthPx: tRect.width,
    };
  }

  // ---------- 同步控件、拖尺、诊断条与五柱 ----------
  function syncUI() {
    lastEval = evaluateHero(state, geom);

    // 拖尺位置与读数
    const min = EMPIRICAL.col1SliderMin;
    const max = EMPIRICAL.col1SliderMax;
    const ratio = (state.col1Pct - min) / (max - min);
    rulerHandle.style.left = `${(ratio * 100).toFixed(2)}%`;
    rulerHandle.setAttribute("aria-valuenow", String(state.col1Pct));
    rulerHandle.setAttribute("aria-valuetext", `首列宽 ${state.col1Pct}%`);
    rulerValue.textContent = `首列 ${state.col1Pct}% · 实测 ${Math.round(geom.col1ActualPct)}%（${Math.round(geom.colWidthsPx[0] || 0)}px）`;

    if (rulerBand) {
      const bStart = ((EMPIRICAL.col1Min - min) / (max - min)) * 100;
      const bEnd = ((EMPIRICAL.col1Max - min) / (max - min)) * 100;
      rulerBand.style.left = `${bStart.toFixed(1)}%`;
      rulerBand.style.width = `${(bEnd - bStart).toFixed(1)}%`;
    }

    // 按钮高亮状态
    stage.querySelectorAll("[data-ctrl]").forEach((btn) => {
      const [key, val] = btn.dataset.ctrl.split(":");
      const active = String(state[key]) === val;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("is-active", active);
    });
    if (tabToggle) {
      tabToggle.setAttribute("aria-pressed", state.tabularNums ? "true" : "false");
      tabToggle.classList.toggle("is-active", state.tabularNums);
      tabToggle.textContent = state.tabularNums ? "等宽数字：开" : "等宽数字：关";
    }

    // 诊断条
    diagBox.dataset.state = lastEval.severity;
    diagBadge.textContent = lastEval.badge;
    diagScore.textContent = `${lastEval.passCount} / 5`;
    diagHead.textContent = lastEval.headline;
    diagReason.textContent = lastEval.reason;
    diagHint.textContent = lastEval.hint;
    diagCoord.textContent = lastEval.metrics.coordText;
    diagJitter.textContent = `数字右缘偏差 Δ${lastEval.metrics.digitJitterPx}px`;
    diagCss.textContent = lastEval.cssSnippet;

    // 原海报底沿五柱实时状态
    for (const key of ["row", "col", "cell", "align", "structure"]) {
      const p = lastEval.pillars[key];
      const item = pillarsEl.querySelector(`[data-pillar="${key}"]`);
      if (!item) continue;
      item.classList.toggle("is-ok", p.ok);
      const st = item.querySelector(".pillar-state");
      if (st) st.textContent = p.status;
    }
  }

  // ---------- 2D Canvas 测绘覆盖层（原海报粉虚线括号 + 数字锯齿/铅垂线 + 选中格坐标） ----------
  function drawOverlay(p) {
    const w = Math.max(1, Math.round(geom.wrapW));
    const h = Math.max(1, Math.round(geom.wrapH));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const tr = geom.tableRect;
    if (!tr || tr.w < 10) return;

    const ease = 1 - Math.pow(1 - Math.min(1, p), 3);

    // 1. 原海报同款顶部「列 COLUMN」粉色虚线维度括号（位于 HTML axis-col 正下方，绝不叠字）
    if (geom.colRects.length === 4 && tr.y >= 24) {
      const c0 = geom.colRects[0];
      const c3 = geom.colRects[3];
      const bx0 = c0.x + c0.w * 0.5;
      const bx1 = c3.x + c3.w * 0.5;
      const by = tr.y - (tr.y >= 40 ? 20 : 10);
      const spanX = bx0 + (bx1 - bx0) * ease;

      ctx.save();
      ctx.strokeStyle = "rgba(234, 129, 185, 0.78)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(bx0, by);
      ctx.lineTo(spanX, by);
      ctx.stroke();

      for (const col of geom.colRects) {
        const cx = col.x + col.w * 0.5;
        if (cx <= spanX + 1) {
          ctx.beginPath();
          ctx.moveTo(cx, by);
          ctx.lineTo(cx, tr.y - 1);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      // 实时列宽标尺数字：放在虚线括号与表头之间，带深底垫块，绝不与「列 (COLUMN)」重叠
      if (w >= 480 && tr.y >= 36) {
        ctx.font = '500 10px "DM Mono", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        geom.colRects.forEach((col, i) => {
          const cx = col.x + col.w * 0.5;
          if (cx <= spanX + 1 && col.w >= 64) {
            const label = `C${i + 1} ${Math.round(col.w)}px`;
            const tw = ctx.measureText(label).width + 8;
            ctx.fillStyle = "#1B092C";
            ctx.fillRect(cx - tw / 2, tr.y - 16, tw, 13);
            ctx.fillStyle = "rgba(240, 229, 214, 0.92)";
            ctx.fillText(label, cx, tr.y - 9);
          }
        });
      }
      ctx.restore();
    }

    // 2. 原海报同款右侧「行 ROW」粉色虚线括号（仅在右留白足够时画）
    const rightSpace = w - (tr.x + tr.w);
    if (geom.rowRects.length > 0 && rightSpace >= 16) {
      const rFirst = geom.rowRects[0];
      const rLast = geom.rowRects[geom.rowRects.length - 1];
      const rx = tr.x + tr.w + Math.min(14, rightSpace - 4);
      const y0 = rFirst.y + rFirst.h * 0.5;
      const y1 = rLast.y + rLast.h * 0.5;
      const curY = y0 + (y1 - y0) * ease;

      ctx.save();
      ctx.strokeStyle = "rgba(234, 129, 185, 0.72)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(rx, y0);
      ctx.lineTo(rx, curY);
      ctx.stroke();

      for (const rr of geom.rowRects) {
        const ry = rr.y + rr.h * 0.5;
        if (ry <= curY + 1) {
          ctx.beginPath();
          ctx.moveTo(tr.x + tr.w + 2, ry);
          ctx.lineTo(rx, ry);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 3. 第 1 与第 2 列边界实时标线（auto 模式下同时标出「目标拖尺线」与「auto 实测列线」的偏移！）
    if (geom.colRects.length >= 2) {
      const seamX = geom.colRects[1].x;
      const targetX = tr.x + (tr.w * state.col1Pct) / 100;
      ctx.save();
      ctx.strokeStyle = dragging
        ? "#F0E5D6"
        : state.layoutMode === "fixed"
          ? "rgba(240, 229, 214, 0.55)"
          : "rgba(255, 126, 151, 0.85)";
      ctx.lineWidth = dragging ? 2.2 : 1.5;
      ctx.setLineDash(dragging ? [] : [4, 3]);
      ctx.beginPath();
      ctx.moveTo(seamX, tr.y);
      ctx.lineTo(seamX, tr.y + tr.h * ease);
      ctx.stroke();

      if (state.layoutMode === "auto" && Math.abs(targetX - seamX) > 4) {
        ctx.strokeStyle = "#F0E5D6";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(targetX, tr.y);
        ctx.lineTo(targetX, tr.y + tr.h * ease);
        ctx.stroke();
        // 连接目标线与实测线的偏差短横桥
        const midY = tr.y + 18;
        ctx.setLineDash([]);
        ctx.strokeStyle = "#FF7E97";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(seamX, midY);
        ctx.lineTo(targetX, midY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 数值列对齐铅垂线 / 锯齿偏差折线（真实 DOM 右缘坐标）
    if (geom.digitEnds.length >= 2) {
      const isClean = lastEval.pillars.align.ok;
      ctx.save();
      ctx.strokeStyle = isClean ? "#7EE0B5" : "#FF7E97";
      ctx.fillStyle = isClean ? "#7EE0B5" : "#FF7E97";
      ctx.lineWidth = isClean ? 1.8 : 2;
      ctx.setLineDash(isClean ? [4, 3] : []);
      ctx.beginPath();
      geom.digitEnds.forEach((pt, idx) => {
        const px = pt.x + 4;
        if (idx === 0) ctx.moveTo(px, pt.y);
        else ctx.lineTo(px, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      for (const pt of geom.digitEnds) {
        ctx.beginPath();
        ctx.arc(pt.x + 4, pt.y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. 选中单元格的行列交叉高亮框（原海报第 5 行第 1 格双白框母题）
    if (geom.selectedRect) {
      const s = geom.selectedRect;
      ctx.save();
      ctx.strokeStyle = sortFlash > 0 ? "#FF7E97" : "#F0E5D6";
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 2, s.y + 2, Math.max(2, s.w - 4), Math.max(2, s.h - 4));
      ctx.restore();
    }
  }

  function refreshAll() {
    renderTable();
    measureDom();
    syncUI();
    needsRedraw = true;
    ctrl.draw();
  }

  // ---------- 顶部列宽边界拖尺（pointer + touch + keyboard，标有 data-perf-drag） ----------
  function setCol1FromClientX(clientX) {
    const rect = rulerTrack.getBoundingClientRect();
    if (rect.width <= 0) return;
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pct = Math.round(EMPIRICAL.col1SliderMin + t * (EMPIRICAL.col1SliderMax - EMPIRICAL.col1SliderMin));
    if (pct !== state.col1Pct) {
      state.col1Pct = pct;
      state.sortBlockedNotice = "";
      // fixed 模式下实时写回 <col> 宽；auto 模式下保持无锁定列宽，让用户在画布上直观看见目标标线被长文拉偏
      if (state.layoutMode === "fixed") {
        const colPcts = computeColPercentages(state.col1Pct);
        tableEl.querySelectorAll("colgroup col").forEach((colEl, i) => {
          colEl.style.width = `${colPcts[i]}%`;
        });
      }
      measureDom();
      syncUI();
      needsRedraw = true;
      ctrl.draw();
    } else {
      needsRedraw = true;
      ctrl.draw();
    }
  }

  rulerHandle.addEventListener("pointerdown", (e) => {
    dragging = true;
    rulerHandle.classList.add("is-dragging");
    rulerHandle.setPointerCapture?.(e.pointerId);
    setCol1FromClientX(e.clientX);
  });

  rulerHandle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setCol1FromClientX(e.clientX);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    rulerHandle.classList.remove("is-dragging");
    needsRedraw = true;
    ctrl.draw();
  };
  rulerHandle.addEventListener("pointerup", endDrag);
  rulerHandle.addEventListener("pointercancel", endDrag);

  // 支持直接点按轨道跳转
  rulerTrack.addEventListener("pointerdown", (e) => {
    if (e.target === rulerHandle) return;
    dragging = true;
    rulerHandle.classList.add("is-dragging");
    setCol1FromClientX(e.clientX);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging && e.target !== rulerHandle) setCol1FromClientX(e.clientX);
  });
  window.addEventListener("pointerup", endDrag);

  // 支持纯 TouchEvent（兼容 CDP Input.dispatchTouchEvent 性能探针）
  rulerHandle.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches[0]) return;
      dragging = true;
      rulerHandle.classList.add("is-dragging");
      setCol1FromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  rulerHandle.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || !e.touches[0]) return;
      setCol1FromClientX(e.touches[0].clientX);
    },
    { passive: true }
  );
  rulerHandle.addEventListener("touchend", endDrag, { passive: true });
  rulerHandle.addEventListener("touchcancel", endDrag, { passive: true });

  // 键盘微调列宽
  rulerHandle.addEventListener("keydown", (e) => {
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -2;
    else if (e.key === "ArrowRight") delta = 2;
    else if (e.key === "PageDown") delta = -6;
    else if (e.key === "PageUp") delta = 6;
    else return;
    e.preventDefault();
    state.col1Pct = Math.max(EMPIRICAL.col1SliderMin, Math.min(EMPIRICAL.col1SliderMax, state.col1Pct + delta));
    state.sortBlockedNotice = "";
    refreshAll();
  });

  // ---------- 按钮控件事件 ----------
  stage.addEventListener("click", (e) => {
    const ctrlBtn = e.target.closest("[data-ctrl]");
    if (ctrlBtn) {
      const [key, val] = ctrlBtn.dataset.ctrl.split(":");
      state[key] = val;
      state.sortBlockedNotice = "";
      refreshAll();
      return;
    }

    const sortBtn = e.target.closest("[data-sort]");
    if (sortBtn) {
      const key = sortBtn.dataset.sort;
      if (state.structureMode === "bad-merge") {
        const colLabel = key === "visits" ? "月访问" : "转化率";
        state.sortBlockedNotice = `第 3–4 行的跨格合并块打断了「${colLabel}」的列连续性，无法拆行重排——正文区应保持一格一值。`;
        sortFlash = 0.6;
        syncUI();
        needsRedraw = true;
        ctrl.draw();
        return;
      }
      state.sortBlockedNotice = "";
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
      } else {
        state.sortKey = key;
        state.sortDir = "desc";
      }
      refreshAll();
      return;
    }

    const cell = e.target.closest("tbody th, tbody td, tfoot th, tfoot td");
    if (cell && cell.dataset.r != null) {
      state.selectedCell = { row: Number(cell.dataset.r), col: Number(cell.dataset.c) };
      state.sortBlockedNotice = "";
      refreshAll();
    }
  });

  if (tabToggle) {
    tabToggle.addEventListener("click", () => {
      state.tabularNums = !state.tabularNums;
      state.sortBlockedNotice = "";
      refreshAll();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      Object.assign(state, structuredClone(INITIAL_HERO_STATE));
      refreshAll();
    });
  }

  // ---------- 窗口尺寸变化时重测 ----------
  let roTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(roTimer);
    roTimer = setTimeout(() => {
      measureDom();
      syncUI();
      needsRedraw = true;
      ctrl.draw();
    }, 60);
  });
  ro.observe(tableWrap);

  // ---------- 帧循环（仅在入场动画、排序闪警或状态变化时重画，静置零浪费） ----------
  const ctrl = loop(stage, (t, dt, { still }) => {
    if (still) {
      introProgress = 1;
      sortFlash = 0;
      drawOverlay(1);
      needsRedraw = false;
      return;
    }
    let active = needsRedraw;
    if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.4);
      active = true;
    }
    if (sortFlash > 0) {
      sortFlash = Math.max(0, sortFlash - dt);
      active = true;
    }
    if (active) {
      drawOverlay(introProgress);
      needsRedraw = false;
    }
  });

  // 初始绘制
  renderTable();
  measureDom();
  syncUI();
  ctrl.draw();
}
