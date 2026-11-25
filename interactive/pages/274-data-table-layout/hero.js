// 开场活体账簿检校台（hero.js）
// - 实体 6 列 HTML 数据表格 + 可拖动列宽标尺（data-perf-drag）+ 实时 2D Canvas 光学小数轴与横扫跨距层
// - 原海报右上 3×3 绿海军矩阵徽章与底沿四柱验收条由 model.js 单一真源驱动

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  COLUMNS,
  computeColumnPercents,
  createBrokenState,
  evaluateLedger,
  formatCell,
  getOrderedRows,
  shareValue,
} from "./model.js";

const $ = (id) => document.getElementById(id);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// 原海报 5 品类的简洁线条图标（无五官、几何克制）
const CAT_ICONS = {
  bag: `<svg class="cat-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14l-1.2 11H6.2L5 9Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  sofa: `<svg class="cat-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M3 13h18v5H3v-5ZM6 18v2M18 18v2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  shirt: `<svg class="cat-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4l4 2 4-2 4 3-2 4-2-1v10H8V10l-2 1-2-4 4-3Z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  dumbbell: `<svg class="cat-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10M5 8v8M7 7v10M17 7v10M19 8v8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  bottle: `<svg class="cat-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="8" height="12" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 8V5h4v3M9 12h6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
};

export function initHero() {
  const stage = $("ledger-stage");
  const table = $("audit-table");
  const colgroup = $("audit-colgroup");
  const thead = $("audit-thead");
  const tbody = $("audit-tbody");
  const tfoot = $("audit-tfoot");
  const canvas = $("ledger-canvas");
  const ctx = canvas.getContext("2d");

  const track = $("col-ruler-track");
  const handle = $("col-drag-handle");
  const rulerReadout = $("ruler-readout");
  const sealSvg = $("matrix-seal");

  let state = createBrokenState();
  let overlayOn = true;
  let dragging = false;
  let hoverRowIdx = -1;
  let layoutDirty = true;
  let canvasDirty = true;
  let passSweepT = -1;
  let prevPassCount = 0;

  // 实测 DOM 坐标缓存（避免每帧强制重排）
  let measured = {
    axisDriftPx: 17.8,
    spanPx: 620,
    spines: [],
    rowRects: [],
    stageW: 0,
    stageH: 0,
    col1Right: 0,
    tableRight: 0,
  };

  // ---------- 渲染 3×3 原海报矩阵徽章 ----------
  function renderSeal(cells) {
    const size = 28;
    const gap = 6;
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = col * (size + gap);
      const y = row * (size + gap);
      const active = cells[i];
      if (i === 8) {
        // 右下角原海报斜切三角
        if (active) {
          parts.push(`<polygon points="${x},${y + size} ${x + size},${y} ${x + size},${y + size}" fill="#018868"/>`);
          parts.push(`<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" fill="none" stroke="#d2dcd8" stroke-width="1"/>`);
        } else {
          parts.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fbecea" stroke="#e5a9a2" stroke-width="1.2" stroke-dasharray="3 2"/>`);
        }
      } else if (i === 2) {
        // 右上角海军蓝焦点格
        const fill = active ? "#002252" : "#e3e8ee";
        const stroke = active ? "none" : "#b9c5d4";
        parts.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`);
      } else {
        const fill = active ? "#018868" : "#e5ece9";
        parts.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}"/>`);
      }
    }
    sealSvg.innerHTML = parts.join("");
  }

  // ---------- 应用列宽（拖拽时走轻量路径，不重建表格 DOM） ----------
  function applyColumnWidths() {
    const cols = colgroup.querySelectorAll("col");
    const isLandscapeShort = window.innerHeight <= 460 && window.innerWidth >= 641 && window.innerWidth <= 960;
    const isNarrowCompact = (window.innerWidth <= 640 || isLandscapeShort) && !stage.classList.contains("mobile-show-all");
    if (isNarrowCompact) {
      // 窄屏 / 手机横屏 4 列模式：项目 / Q2 / 环比 / 占比
      const c1 = Math.round(clamp(state.colSplit * 1.35, 0.22, 0.44) * 1000) / 10;
      const rem = 100 - c1;
      const widths = [c1, 0, Math.round(rem * 0.27 * 10) / 10, Math.round(rem * 0.35 * 10) / 10, Math.round(rem * 0.38 * 10) / 10, 0];
      cols.forEach((c, idx) => { c.style.width = widths[idx] ? `${widths[idx]}%` : ""; });
    } else {
      const pcts = computeColumnPercents(state.colSplit);
      cols.forEach((c, idx) => { c.style.width = `${pcts[idx]}%`; });
    }

    const frac = (state.colSplit - 0.10) / (0.46 - 0.10);
    handle.style.left = `${clamp(frac * 100, 4, 96)}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(state.colSplit * 100)));

    const pctInt = Math.round(state.colSplit * 100);
    const zone = state.colSplit < 0.19 ? "挤压" : state.colSplit > 0.35 ? "白河过宽" : "舒适带";
    rulerReadout.textContent = `首列 ${pctInt}% · ${zone}`;
    rulerReadout.dataset.ok = String(state.colSplit >= 0.19 && state.colSplit <= 0.35);

    layoutDirty = true;
    canvasDirty = true;
  }

  // ---------- 渲染表格 DOM（仅在结构/排序/格式等离散变化时调用） ----------
  function renderTable() {
    stage.dataset.grid = state.gridMode;
    stage.dataset.align = state.alignMode;
    stage.dataset.tabular = state.tabular ? "on" : "off";
    stage.dataset.spotlight = state.spotlight;

    const spotCol = state.spotlight;
    const isSpot = (key) => spotCol === "all" || spotCol === key;

    // 表头
    thead.innerHTML = `<tr>${COLUMNS.map((col) => {
      const activeSort = state.sortKey === col.key;
      const ind = col.sortable ? (activeSort ? (state.sortDir === "desc" ? "↓" : "↑") : "↕") : "";
      const alignCls = col.type === "text" ? "th-text" : col.type === "share" ? "th-share" : "th-num";
      const spotCls = isSpot(col.key) ? "is-spot" : "";
      const sortAria = col.sortable
        ? (activeSort ? (state.sortDir === "desc" ? "descending" : "ascending") : "none")
        : "";
      if (!col.sortable) {
        return `<th scope="col" data-col="${col.key}" class="${alignCls} ${spotCls}"><div class="th-btn"><span class="th-main">${col.label}</span><span class="th-en" lang="en">${col.en}</span></div></th>`;
      }
      return `<th scope="col" data-col="${col.key}" class="${alignCls} ${spotCls}" aria-sort="${sortAria}">
        <button type="button" class="th-btn" data-sort="${col.key}" aria-label="按${col.label}排序">
          <span class="th-main">${col.label} <span class="sort-ind" aria-hidden="true">${ind}</span></span>
          <span class="th-en" lang="en">${col.en}</span>
        </button>
      </th>`;
    }).join("")}</tr>`;

    const { bodyRows, footerRow } = getOrderedRows(state);

    const buildRowHtml = (row, idx, isFoot = false) => {
      const isTot = !!row.isTotal;
      const trCls = isTot ? (isFoot ? "row-total-footer" : "row-total-mixed") : "";
      const sharePct = shareValue(row, state.formatMode, isTot);
      const q1Str = formatCell(row, "q1", state.formatMode, isTot);
      const q2Str = formatCell(row, "q2", state.formatMode, isTot);
      const qoqStr = formatCell(row, "qoq", state.formatMode, isTot);
      const shareStr = formatCell(row, "share", state.formatMode, isTot);
      const achStr = formatCell(row, "achieve", state.formatMode, isTot);
      const mismatchHtml = isTot && state.formatMode === "messy"
        ? `<span class="total-mismatch">分项实加 92.2%</span>`
        : "";

      const itemHtml = isTot
        ? `<div class="item-cell"><div class="item-names"><span class="item-zh">${row.name}</span><span class="item-en" lang="en">${row.en}</span></div></div>`
        : `<div class="item-cell">${CAT_ICONS[row.icon] || ""}<div class="item-names"><span class="item-zh">${row.name}</span><span class="item-en" lang="en">${row.en}</span></div></div>`;

      const barHtml = state.inlineBars
        ? `<div class="share-bar-track" aria-hidden="true"><div class="share-bar-fill" style="width:${clamp(sharePct, 4, 100)}%"></div></div>`
        : "";

      return `<tr class="${trCls}" data-row-idx="${idx}" data-total="${isTot}">
        <td data-col="item" class="cell-text ${isSpot("item") ? "is-spot" : ""}">${itemHtml}</td>
        <td data-col="q1" class="cell-num ${isSpot("q1") ? "is-spot" : ""}"><span class="num-val">${q1Str}</span></td>
        <td data-col="q2" class="cell-num col-q2-accent ${isSpot("q2") ? "is-spot" : ""}"><span class="num-val">${q2Str}</span></td>
        <td data-col="qoq" class="cell-num ${isSpot("qoq") ? "is-spot" : ""}"><span class="num-val">${qoqStr}</span><span class="qoq-arrow" aria-hidden="true">↗</span></td>
        <td data-col="share" class="cell-share ${isSpot("share") ? "is-spot" : ""}">
          <div class="share-wrap"><span class="share-num">${shareStr}${mismatchHtml}</span>${barHtml}</div>
        </td>
        <td data-col="achieve" class="cell-num col-ach-accent ${isSpot("achieve") ? "is-spot" : ""}"><span class="num-val">${achStr}</span></td>
      </tr>`;
    };

    tbody.innerHTML = bodyRows.map((r, i) => buildRowHtml(r, i, false)).join("");
    tfoot.innerHTML = footerRow ? buildRowHtml(footerRow, bodyRows.length, true) : "";

    applyColumnWidths();
  }

  // ---------- 实测 DOM 位值坐标（单一几何真源：用真实像素坐标算 Δpx） ----------
  function measureAxisGeometry() {
    const stageRect = stage.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    const spines = [];
    const numCols = ["q1", "q2", "qoq", "achieve"];
    let maxDrift = 0;

    for (const colKey of numCols) {
      const cells = [...table.querySelectorAll(`tbody tr[data-total="false"] td[data-col="${colKey}"] .num-val`)];
      const pts = [];
      for (const span of cells) {
        const rect = span.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue; // 手机窄屏隐藏列跳过
        // 优先锁定小数点/百分号前一位，否则锁定最右数字边缘
        const textNode = span.firstChild;
        let anchorX = rect.right;
        if (textNode && textNode.nodeType === 3) {
          const str = textNode.textContent || "";
          const dotIdx = str.indexOf(".");
          const pctIdx = str.indexOf("%");
          const idx = dotIdx >= 0 ? dotIdx : (pctIdx >= 0 ? pctIdx : str.length);
          if (idx > 0 && idx <= str.length) {
            try {
              const range = document.createRange();
              range.setStart(textNode, Math.max(0, idx - 1));
              range.setEnd(textNode, idx);
              const cr = range.getBoundingClientRect();
              if (cr.width > 0) anchorX = cr.right;
            } catch {}
          }
        }
        pts.push({
          x: anchorX - stageRect.left,
          y: rect.top + rect.height / 2 - stageRect.top,
        });
      }
      if (pts.length >= 2) {
        const xs = pts.map((p) => p.x);
        const drift = Math.max(...xs) - Math.min(...xs);
        if (drift > maxDrift) maxDrift = drift;
        spines.push({ colKey, pts, drift });
      }
    }

    const firstRowItem = table.querySelector('tbody tr td[data-col="item"]');
    const col1Right = firstRowItem ? firstRowItem.getBoundingClientRect().right - stageRect.left : 140;
    const rowRects = [...table.querySelectorAll("tbody tr, tfoot tr")].map((tr) => {
      const r = tr.getBoundingClientRect();
      return {
        top: r.top - stageRect.top,
        height: r.height,
        isTotal: tr.dataset.total === "true",
      };
    });

    measured = {
      axisDriftPx: Math.round(maxDrift * 10) / 10,
      spanPx: Math.round(tableRect.width),
      spines,
      rowRects,
      stageW: stageRect.width,
      stageH: stageRect.height,
      col1Right,
      tableRight: tableRect.right - stageRect.left,
    };
    layoutDirty = false;
  }

  // ---------- 同步 UI 按钮、诊单、四柱与 3×3 矩阵徽章 ----------
  function syncDiagnostics() {
    if (layoutDirty) measureAxisGeometry();
    const diag = evaluateLedger(state, measured);

    // 徽章 & 3×3 矩阵
    const badge = $("hero-badge");
    badge.textContent = diag.tag;
    badge.dataset.tone = diag.tone;
    $("seal-sub").textContent = diag.passCount === 4
      ? "四柱全部达标 · 原海报 3×3 矩阵已完整锁定"
      : `${4 - diag.passCount} 项待校准 · 拖标尺或点表头调整`;
    renderSeal(diag.sealCells);

    // 诊单
    const verdict = $("hero-verdict");
    verdict.dataset.tone = diag.tone;
    $("verdict-tag").textContent = diag.tag;
    $("verdict-title").textContent = diag.headline;
    $("verdict-why").textContent = diag.why;
    $("verdict-hint").textContent = diag.hint;

    $("m-drift").textContent = `${diag.axisDriftPx.toFixed(1)}px`;
    $("m-ink").textContent = diag.inkTier;
    $("m-share").textContent = diag.shareSum === 100
      ? "100.0% = 100.0% 平账"
      : `${diag.shareSum.toFixed(1)}% ≠ 100.0%`;
    $("m-span").textContent = `${diag.spanPx}px`;

    // 底部四柱验收标
    for (const key of ["structure", "align", "compare", "precise"]) {
      const p = diag.pillars[key];
      const card = document.querySelector(`.pillar-item[data-pillar="${key}"]`);
      if (card) card.dataset.ok = String(p.ok);
      const ps = $(`ps-${key}`);
      if (ps) ps.textContent = p.status;
    }

    // 按钮 aria-pressed 状态
    document.querySelectorAll("[data-ctrl]").forEach((btn) => {
      const k = btn.dataset.ctrl;
      const v = btn.dataset.val;
      if (v === "toggle") {
        btn.setAttribute("aria-pressed", String(Boolean(state[k])));
      } else {
        btn.setAttribute("aria-pressed", String(state[k] === v));
      }
    });

    const quickSort = $("btn-quick-sort");
    if (quickSort) {
      quickSort.setAttribute("aria-pressed", String(state.sortKey === "qoq" && state.sortDir === "desc"));
    }

    if (diag.passCount === 4 && prevPassCount < 4) {
      passSweepT = 0;
      canvasDirty = true;
    }
    prevPassCount = diag.passCount;
  }

  // ---------- 2D Canvas 光学位值轴与横扫跨距绘制 ----------
  function resizeCanvas() {
    const r = stage.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutDirty = true;
    canvasDirty = true;
  }

  let introDone = false;
  function drawOverlay(t, dt, { still }) {
    const introP = still ? 1 : clamp(t / 0.85, 0, 1);
    const animatingIntro = !still && introP < 1;
    const animatingSweep = !still && passSweepT >= 0 && passSweepT < 0.9;
    if (animatingSweep) passSweepT += dt;
    else if (passSweepT >= 0.9) passSweepT = -1;

    if (!canvasDirty && !animatingIntro && !animatingSweep && introDone) return;
    if (introP >= 1) introDone = true;

    if (layoutDirty) {
      measureAxisGeometry();
      syncDiagnostics();
    }

    const W = measured.stageW || stage.clientWidth;
    const H = measured.stageH || stage.clientHeight;
    ctx.clearRect(0, 0, W, H);
    canvasDirty = false;

    if (!overlayOn || W < 40 || H < 40) return;

    const diag = evaluateLedger(state, measured);

    // 1. 挤压 / 白河警告区透视带（轻透纵线标示首列右缘，不遮挡数据文字）
    if (diag.squeezed || diag.river || dragging) {
      const colX = measured.col1Right;
      ctx.save();
      ctx.fillStyle = diag.squeezed || diag.river ? "rgba(181, 43, 33, 0.06)" : "rgba(1, 136, 104, 0.06)";
      ctx.fillRect(0, 0, colX, H);

      ctx.strokeStyle = diag.squeezed || diag.river ? "rgba(181, 43, 33, 0.85)" : "rgba(1, 136, 104, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, H);
      ctx.stroke();

      // 仅在拖拽列宽时在表头顶沿贴一枚紧凑尺寸读数，静置时不压正文
      if (dragging) {
        ctx.setLineDash([]);
        const tag = `${Math.round(state.colSplit * 100)}%`;
        ctx.font = '500 11px "DM Mono", monospace';
        const tw = ctx.measureText(tag).width + 10;
        const bx = clamp(colX - tw / 2, 4, W - tw - 4);
        ctx.fillStyle = diag.squeezed || diag.river ? "#b52b21" : "#018868";
        ctx.fillRect(bx, 3, tw, 18);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(tag, bx + 5, 15.5);
      }
      ctx.restore();
    }

    // 2. 垂直位值对齐轴线（真实 DOM 字符测量点连线）
    const alignOk = diag.pillars.align.ok;
    for (const spine of measured.spines) {
      const pts = spine.pts;
      if (pts.length < 2) continue;
      const isStraight = spine.drift <= 1.2 && alignOk;
      ctx.save();
      ctx.strokeStyle = isStraight ? "rgba(1, 136, 104, 0.72)" : "rgba(181, 43, 33, 0.78)";
      ctx.lineWidth = isStraight ? 1.5 : 1.75;
      ctx.setLineDash(isStraight ? [3, 3] : []);

      // 随开场进度向下描线
      const topY = pts[0].y - 10;
      const botY = pts[pts.length - 1].y + 10;
      const clipH = topY + (botY - topY) * introP;

      ctx.beginPath();
      ctx.rect(0, 0, W, clipH + 20);
      ctx.clip();

      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // 每个数据点的位值锚点小圆
      ctx.setLineDash([]);
      for (const p of pts) {
        ctx.fillStyle = isStraight ? "#018868" : "#b52b21";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isStraight ? 2.4 : 3.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 错位大于 1.5px 时在第一列和焦点列标注实测 Δpx
      if (!isStraight && spine.drift > 1.5 && (spine.colKey === "q2" || spine.colKey === "qoq")) {
        const label = `Δ${spine.drift.toFixed(0)}px`;
        ctx.font = '500 10.5px "DM Mono", monospace';
        const lw = ctx.measureText(label).width + 8;
        const lx = clamp(pts[0].x - lw / 2, 4, W - lw - 4);
        const ly = Math.max(4, pts[0].y - 22);
        ctx.fillStyle = "#b52b21";
        ctx.fillRect(lx, ly, lw, 16);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, lx + 4, ly + 11.5);
      }
      ctx.restore();
    }

    // 3. 悬停行时的横向扫视通道提示线
    if (hoverRowIdx >= 0 && measured.rowRects[hoverRowIdx]) {
      const rr = measured.rowRects[hoverRowIdx];
      ctx.save();
      ctx.strokeStyle = "rgba(0, 34, 82, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6, rr.top + rr.height - 1);
      ctx.lineTo(W - 6, rr.top + rr.height - 1);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 4/4 达标时的一次性翡翠验核光扫（绝不循环晃动）
    if (animatingSweep) {
      const sx = (passSweepT / 0.9) * (W + 120) - 60;
      const g = ctx.createLinearGradient(sx - 50, 0, sx + 50, 0);
      g.addColorStop(0, "rgba(1, 136, 104, 0)");
      g.addColorStop(0.5, "rgba(1, 136, 104, 0.22)");
      g.addColorStop(1, "rgba(1, 136, 104, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const runner = loop(stage, drawOverlay);

  // ---------- 交互绑定 ----------
  function commitFull() {
    renderTable();
    syncDiagnostics();
    canvasDirty = true;
    runner.draw();
  }

  // 1. 拖动顶部列宽标尺（支持鼠标 + 触屏 Pointer Events + 键盘微调）
  const setColFromClientX = (clientX) => {
    const r = track.getBoundingClientRect();
    if (r.width <= 0) return;
    const frac = clamp((clientX - r.left) / r.width, 0, 1);
    const next = Math.round((0.10 + frac * 0.36) * 1000) / 1000;
    if (Math.abs(next - state.colSplit) < 0.001) return;
    state.colSplit = next;
    applyColumnWidths();
    // 拖拽期间用 rAF 节流测量，保证 6× CPU 降速依然 60fps
    canvasDirty = true;
    runner.draw();
  };

  let dragActiveId = null;
  const startDrag = (e) => {
    e.preventDefault();
    dragging = true;
    dragActiveId = e.pointerId;
    try { handle.setPointerCapture(e.pointerId); } catch {}
    handle.focus({ preventScroll: true });
    setColFromClientX(e.clientX);
  };
  const moveDrag = (e) => {
    if (!dragging) return;
    setColFromClientX(e.clientX);
  };
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    dragActiveId = null;
    layoutDirty = true;
    syncDiagnostics();
    canvasDirty = true;
    runner.draw();
  };

  handle.addEventListener("pointerdown", startDrag);
  handle.addEventListener("pointermove", moveDrag);
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  // 兼容直接点击或拖动整条标尺轨（包括 touch 事件下 perf.mjs 从中心滑动）
  track.addEventListener("pointerdown", (e) => {
    if (e.target === handle) return;
    startDrag(e);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging && e.pointerId === dragActiveId) moveDrag(e);
  });
  window.addEventListener("pointerup", (e) => {
    if (dragging && e.pointerId === dragActiveId) endDrag();
  });

  // 显式兼容 dispatchTouchEvent（无头模拟触屏保证每一帧都触发）
  handle.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    e.preventDefault();
    dragging = true;
    setColFromClientX(e.touches[0].clientX);
  }, { passive: false });
  handle.addEventListener("touchmove", (e) => {
    if (!e.touches.length) return;
    e.preventDefault();
    dragging = true;
    setColFromClientX(e.touches[0].clientX);
  }, { passive: false });
  handle.addEventListener("touchend", () => {
    if (dragging) endDrag();
  });

  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.01 : 0.025;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.colSplit = clamp(state.colSplit - step, 0.10, 0.46);
      applyColumnWidths();
      syncDiagnostics();
      runner.draw();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.colSplit = clamp(state.colSplit + step, 0.10, 0.46);
      applyColumnWidths();
      syncDiagnostics();
      runner.draw();
    }
  });

  // 2. 点击真实表头排序
  thead.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-sort]");
    if (!btn) return;
    const key = btn.dataset.sort;
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
    } else {
      state.sortKey = key;
      state.sortDir = "desc";
    }
    commitFull();
  });

  // 3. 表格行悬停追踪
  tbody.addEventListener("pointermove", (e) => {
    const tr = e.target.closest("tr");
    const idx = tr ? Number(tr.dataset.rowIdx) : -1;
    if (idx !== hoverRowIdx) {
      hoverRowIdx = idx;
      canvasDirty = true;
      runner.draw();
    }
  });
  tbody.addEventListener("pointerleave", () => {
    if (hoverRowIdx !== -1) {
      hoverRowIdx = -1;
      canvasDirty = true;
      runner.draw();
    }
  });

  // 4. 调控带按钮
  document.querySelectorAll("[data-ctrl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.ctrl;
      const v = btn.dataset.val;
      if (v === "toggle") state[k] = !state[k];
      else state[k] = v;
      commitFull();
    });
  });

  $("btn-quick-sort").addEventListener("click", () => {
    if (state.sortKey === "qoq" && state.sortDir === "desc") {
      state.sortKey = "none";
    } else {
      state.sortKey = "qoq";
      state.sortDir = "desc";
    }
    commitFull();
  });

  $("btn-overlay").addEventListener("click", (e) => {
    overlayOn = !overlayOn;
    e.currentTarget.setAttribute("aria-pressed", String(overlayOn));
    e.currentTarget.textContent = overlayOn ? "光学轴线：开" : "光学轴线：关";
    canvasDirty = true;
    runner.draw();
  });

  $("btn-reset-broken").addEventListener("click", () => {
    state = createBrokenState();
    passSweepT = -1;
    prevPassCount = 0;
    commitFull();
  });

  $("btn-mobile-cols").addEventListener("click", (e) => {
    const on = stage.classList.toggle("mobile-show-all");
    e.currentTarget.setAttribute("aria-pressed", String(on));
    e.currentTarget.textContent = on ? "切回精简 4 列" : "显示全部 6 列";
    applyColumnWidths();
    syncDiagnostics();
    runner.draw();
  });

  // ResizeObserver 保证任何屏幕切分后标尺与 Canvas 对齐
  new ResizeObserver(() => {
    resizeCanvas();
    applyColumnWidths();
    syncDiagnostics();
    runner.draw();
  }).observe(stage);

  // 初始化
  renderTable();
  resizeCanvas();
  syncDiagnostics();
  if (reducedMotion.matches) runner.draw();
}
