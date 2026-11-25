import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  CARDS_DATA,
  MIN_GUTTER,
  MAX_GUTTER,
  getInitialState,
  evaluateGrid,
  POSTER_PRINCIPLES,
  HISTORY_ERAS,
  TRIAGE_SCENARIOS
} from "./model.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// -------------------- 迷你卡片几何 SVG（忠实 270 原海报几何语汇） --------------------
function cardArtSvg(kind, isSpot) {
  const c1 = isSpot ? "#0A1D56" : "#F9CA29";
  const c2 = isSpot ? "#1839B0" : "#023ACB";
  const c3 = isSpot ? "#FAF8F4" : "#BCC5E4";
  switch (kind) {
    case "quad":
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><rect x="3" y="2" width="16" height="11" rx="2" fill="${c1}"/><rect x="23" y="2" width="16" height="11" rx="2" fill="${c1}"/><rect x="3" y="17" width="16" height="11" rx="2" fill="${c1}"/><rect x="23" y="17" width="16" height="11" rx="2" fill="${c1}"/></svg>`;
    case "bars":
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><rect x="3" y="3" width="34" height="6" rx="1.5" fill="${c2}"/><rect x="3" y="12" width="26" height="6" rx="1.5" fill="${c3}"/><rect x="3" y="21" width="18" height="6" rx="1.5" fill="${c1}"/></svg>`;
    case "eye":
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><path d="M2 15C8 6 20 6 26 15C20 24 8 24 2 15Z" fill="none" stroke="${c2}" stroke-width="2.2"/><circle cx="14" cy="15" r="4" fill="${c2}"/><rect x="29" y="5" width="11" height="4" rx="1" fill="${c3}"/><rect x="29" y="13" width="11" height="4" rx="1" fill="${c3}"/><rect x="29" y="21" width="11" height="4" rx="1" fill="${c3}"/></svg>`;
    case "frame":
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><rect x="6" y="4" width="30" height="22" rx="2" fill="none" stroke="${c2}" stroke-width="2" stroke-dasharray="5 3"/><rect x="14" y="10" width="14" height="10" rx="1.5" fill="${c1}"/></svg>`;
    case "shapes":
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><rect x="2" y="8" width="11" height="11" rx="1.5" fill="${c1}"/><circle cx="21" cy="14" r="6" fill="${c2}"/><polygon points="35,7 41,21 29,21" fill="${c1}"/></svg>`;
    case "stairs":
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><line x1="4" y1="2" x2="4" y2="28" stroke="${c2}" stroke-dasharray="3 2" stroke-width="1.5"/><rect x="7" y="5" width="30" height="7" rx="1.5" fill="${c2}"/><rect x="7" y="16" width="21" height="7" rx="1.5" fill="${c1}"/></svg>`;
    default:
      return `<svg viewBox="0 0 42 30" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="${c2}"/><rect x="16" y="3" width="10" height="10" rx="1.5" fill="${c3}"/><rect x="29" y="3" width="10" height="10" rx="1.5" fill="none" stroke="${c2}" stroke-dasharray="3 2" stroke-width="1.5"/><rect x="3" y="17" width="10" height="10" rx="1.5" fill="${c3}"/><rect x="16" y="17" width="10" height="10" rx="1.5" fill="${c1}"/></svg>`;
  }
}

// ==================== HERO 活体卡片网格编排台 ====================
function initHero() {
  const gridEl = $("#card-grid");
  const stageEl = $("#grid-stage");
  const bpCanvas = $("#bp-canvas");
  const caliperHit = $("#gutter-caliper");
  const caliperCanvas = $("#caliper-canvas");
  const scanOverlay = $("#scan-overlay");
  const colBtns = $$("#col-btns button");
  const alignBtns = $$("#align-btns button");
  const guidesBtn = $("#guides-btn");
  const resetBtn = $("#reset-btn");
  const gutterReadout = $("#gutter-readout");
  const bpScore = $("#bp-score");
  const bpListItems = $$("#bp-list li");
  const diagEl = $("#hero-diag");
  const diagBadge = $("#diag-badge");
  const diagTitle = $("#diag-title");
  const diagWhy = $("#diag-why");
  const mWidth = $("#m-width");
  const mRatio = $("#m-ratio");
  const mJitter = $("#m-jitter");
  const mSpot = $("#m-spot");

  const state = getInitialState(window.innerWidth);
  let lastEval = null;
  let lastRects = [];
  let animPhase = 0;
  let dragging = false;
  let pendingRaf = 0;

  function renderCardsDom() {
    const visible = CARDS_DATA.slice(0, state.cardCount);
    const frag = document.createDocumentFragment();
    for (const item of visible) {
      const isSpot = state.spotlights.has(item.id);
      const art = document.createElement("article");
      art.className = "cg-card" + (isSpot ? " is-spot" : "");
      art.dataset.cardId = String(item.id);

      const canRemove = item.id > 6;
      art.innerHTML = `
        <div class="cg-head">
          <span class="cg-no" lang="en">${item.no}</span>
          <div class="cg-actions-top">
            <button type="button" class="cg-spot-btn" data-toggle-spot="${item.id}" aria-pressed="${isSpot}">${isSpot ? "★ 焦点" : "设焦点"}</button>
            ${canRemove ? `<button type="button" class="cg-del-btn" data-del-card="${item.id}" aria-label="移除 ${item.no} 号卡片">×</button>` : ""}
          </div>
        </div>
        <div class="cg-media">
          ${cardArtSvg(item.art, isSpot)}
          <span class="cg-cat">${item.category}</span>
        </div>
        <div class="cg-title-block">
          <h2 class="cg-title">${item.title}</h2>
          ${item.tag ? `<span class="cg-tag">${item.tag}</span>` : ""}
        </div>
        <p class="cg-desc">${item.desc}</p>
        <div class="cg-foot">
          <span class="cg-price" lang="en">${item.price}</span>
          <span class="cg-cta">${item.action} →</span>
        </div>
      `;
      frag.appendChild(art);
    }

    // 源自 270 原海报 08「延展」的虚线幽灵槽
    if (state.cardCount < CARDS_DATA.length) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "cg-extend-slot";
      slot.id = "extend-card-btn";
      slot.innerHTML = `
        <span class="cg-extend-plus" aria-hidden="true">+</span>
        <span class="cg-extend-label">延展新卡（${state.cardCount}/${CARDS_DATA.length}）</span>
        <span class="cg-extend-sub">08 EXTEND · 原海报延展槽</span>
      `;
      frag.appendChild(slot);
    }
    gridEl.replaceChildren(frag);
  }

  function applyGridStyles() {
    gridEl.style.setProperty("--cg-cols", String(state.cols));
    gridEl.style.setProperty("--cg-gap", `${state.gutter}px`);
    gridEl.dataset.align = state.alignMode;
    gutterReadout.textContent = `${state.gutter} px`;
    caliperHit.setAttribute("aria-valuenow", String(state.gutter));

    for (const b of colBtns) {
      const on = Number(b.dataset.cols) === state.cols;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of alignBtns) {
      const on = b.dataset.align === state.alignMode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    }
    guidesBtn.classList.toggle("is-on", state.showGuides);
    guidesBtn.setAttribute("aria-pressed", String(state.showGuides));
  }

  function measureDom() {
    const stageR = stageEl.getBoundingClientRect();
    const gridR = gridEl.getBoundingClientRect();
    const cards = $$(".cg-card", gridEl);
    const rects = cards.map((card) => {
      const r = card.getBoundingClientRect();
      const titleR = card.querySelector(".cg-title").getBoundingClientRect();
      const descR = card.querySelector(".cg-desc").getBoundingClientRect();
      const footR = card.querySelector(".cg-foot").getBoundingClientRect();
      return {
        id: Number(card.dataset.cardId),
        isSpot: card.classList.contains("is-spot"),
        x: r.left - stageR.left,
        y: r.top - stageR.top,
        w: r.width,
        h: r.height,
        titleBottom: titleR.bottom - stageR.top,
        descTop: descR.height > 0 ? descR.top - stageR.top : titleR.bottom - stageR.top,
        footTop: footR.top - stageR.top
      };
    });
    lastRects = rects;

    // 按行分组，真实量出同行标题底沿、正文起行与底栏顶沿的垂直偏差
    const rows = [];
    for (const r of rects) {
      let row = rows.find((grp) => Math.abs(grp[0].y - r.y) < 18);
      if (!row) {
        row = [];
        rows.push(row);
      }
      row.push(r);
    }

    let maxJitter = 0;
    for (const row of rows) {
      if (row.length < 2) continue;
      const tVals = row.map((c) => c.titleBottom);
      const dVals = row.map((c) => c.descTop);
      const fVals = row.map((c) => c.footTop);
      const tDiff = Math.max(...tVals) - Math.min(...tVals);
      const dDiff = Math.max(...dVals) - Math.min(...dVals);
      const fDiff = Math.max(...fVals) - Math.min(...fVals);
      maxJitter = Math.max(maxJitter, tDiff, dDiff, fDiff);
    }

    const firstCard = cards[0];
    const innerGap = firstCard ? parseFloat(getComputedStyle(firstCard).paddingLeft) || 12 : 12;

    return {
      containerW: gridR.width,
      cardW: rects[0] ? rects[0].w : gridR.width / state.cols,
      innerGap,
      rowCount: rows.length,
      baselineJitter: maxJitter
    };
  }

  function updateReadouts(ev) {
    lastEval = ev;
    bpScore.textContent = `${ev.passed} / 4`;
    bpScore.classList.toggle("is-done", ev.passed === 4);

    for (const li of bpListItems) {
      const pass = ev.checks[li.dataset.check];
      li.classList.toggle("is-pass", pass);
      li.querySelector(".bp-mark").textContent = pass ? "✓" : "×";
    }

    diagEl.dataset.tone = ev.tone;
    diagBadge.textContent = ev.badge;
    diagTitle.textContent = ev.title;
    diagWhy.textContent = ev.why;

    mWidth.textContent = `${ev.metrics.cardW}px`;
    mRatio.textContent = `${ev.metrics.ratio.toFixed(1)}×`;
    mJitter.textContent = `${ev.metrics.jitter}px`;
    mSpot.textContent = `${ev.metrics.spotCount}/${ev.metrics.cardCount}`;
  }

  // 画卡距卡尺轨 Canvas
  function drawCaliper() {
    const r = caliperHit.getBoundingClientRect();
    const w = Math.max(120, Math.round(r.width));
    const h = Math.max(32, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (caliperCanvas.width !== Math.round(w * dpr) || caliperCanvas.height !== Math.round(h * dpr)) {
      caliperCanvas.width = Math.round(w * dpr);
      caliperCanvas.height = Math.round(h * dpr);
    }
    const ctx = caliperCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padX = 14;
    const trackW = w - padX * 2;
    const toX = (val) => padX + ((val - MIN_GUTTER) / (MAX_GUTTER - MIN_GUTTER)) * trackW;

    // 经验甜区带（12px–28px）
    const sw0 = toX(12);
    const sw1 = toX(28);
    ctx.fillStyle = "rgba(107, 242, 179, 0.22)";
    ctx.fillRect(sw0, 6, sw1 - sw0, h - 12);
    ctx.strokeStyle = "rgba(107, 242, 179, 0.65)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sw0 + 0.5, 6.5, sw1 - sw0 - 1, h - 13);

    // 标尺刻度线
    for (let v = 2; v <= 44; v += 2) {
      const x = Math.round(toX(v)) + 0.5;
      const major = v % 10 === 0 || v === 4 || v === 12 || v === 28;
      ctx.strokeStyle = v >= 12 && v <= 28 ? "rgba(250,248,244,0.75)" : "rgba(250,248,244,0.34)";
      ctx.lineWidth = major ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(x, major ? 8 : 14);
      ctx.lineTo(x, h - (major ? 8 : 14));
      ctx.stroke();
    }

    // 中心基准轴
    ctx.strokeStyle = "rgba(250,248,244,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, h / 2 + 0.5);
    ctx.lineTo(w - padX, h / 2 + 0.5);
    ctx.stroke();

    // 实时卡尺滑块柄
    const tx = toX(state.gutter);
    const inSweet = state.gutter >= 12 && state.gutter <= 32;
    ctx.fillStyle = inSweet ? "#F9CA29" : "#FF6B4A";
    ctx.beginPath();
    ctx.roundRect(tx - 11, 5, 22, h - 10, 6);
    ctx.fill();

    // 三道握纹
    ctx.strokeStyle = "#0A1D56";
    ctx.lineWidth = 1.6;
    for (const dx of [-3.5, 0, 3.5]) {
      ctx.beginPath();
      ctx.moveTo(tx + dx, 12);
      ctx.lineTo(tx + dx, h - 12);
      ctx.stroke();
    }
  }

  // 画顶栏原海报 3×3 活体蓝图 Canvas
  function drawBlueprint(t, still) {
    const r = bpCanvas.getBoundingClientRect();
    const w = Math.max(80, Math.round(r.width));
    const h = Math.max(60, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (bpCanvas.width !== Math.round(w * dpr) || bpCanvas.height !== Math.round(h * dpr)) {
      bpCanvas.width = Math.round(w * dpr);
      bpCanvas.height = Math.round(h * dpr);
    }
    const ctx = bpCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cols = state.cols;
    const rows = Math.max(1, Math.ceil(state.cardCount / cols));
    const pad = 12;
    const gap = Math.max(2, Math.min(11, state.gutter * 0.26));
    const cellW = (w - pad * 2 - gap * (cols - 1)) / cols;
    const availH = h - pad * 2 - gap * (rows - 1);
    const cellH = Math.max(10, Math.min(34, availH / rows));
    const totalH = rows * cellH + (rows - 1) * gap;
    const startY = (h - totalH) / 2;

    // 绘原海报标志性十字定位标（网格缝交叉点）
    ctx.strokeStyle = "rgba(2, 58, 203, 0.45)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      const gx = pad + c * (cellW + gap) - (c > 0 && c < cols ? gap / 2 : 0);
      ctx.beginPath();
      ctx.moveTo(gx, Math.max(4, startY - 6));
      ctx.lineTo(gx, Math.min(h - 4, startY + totalH + 6));
      ctx.stroke();
    }
    for (let rw = 0; rw <= rows; rw++) {
      const gy = startY + rw * (cellH + gap) - (rw > 0 && rw < rows ? gap / 2 : 0);
      ctx.beginPath();
      ctx.moveTo(6, gy);
      ctx.lineTo(w - 6, gy);
      ctx.stroke();
    }

    // 绘卡片微缩矩阵（亮黄反映焦点，高低抖动反映未对齐）
    const centers = [];
    for (let i = 0; i < state.cardCount; i++) {
      const c = i % cols;
      const rw = Math.floor(i / cols);
      const x = pad + c * (cellW + gap);
      const wobble = state.alignMode === "raw" ? ((i % 3) - 1) * 3.5 : state.alignMode === "stretch" ? 0 : 0;
      const innerWobble = state.alignMode === "subgrid" ? 0 : ((i % 2) * 4 - 2);
      const y = startY + rw * (cellH + gap);
      const ch = Math.max(8, cellH + wobble);
      const isSpot = state.spotlights.has(i + 1);

      ctx.fillStyle = isSpot ? "#F9CA29" : "#023ACB";
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(4, cellW), ch, 2.5);
      ctx.fill();

      // 内部基线示意条
      ctx.fillStyle = isSpot ? "#0A1D56" : "rgba(250, 248, 244, 0.85)";
      const barY = y + ch * 0.62 + innerWobble;
      ctx.fillRect(x + 2, Math.min(y + ch - 3, Math.max(y + 2, barY)), Math.max(2, cellW - 4), 2);
      centers.push({ x: x + cellW / 2, y: Math.min(y + ch - 2, Math.max(y + 3, barY + 1)) });
    }

    // 扫读路径虚线 + 扫描光点
    if (centers.length >= 2) {
      const aligned = lastEval ? lastEval.checks.scan : false;
      ctx.strokeStyle = aligned ? "#0E6B47" : "#D9481E";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      centers.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.setLineDash([]);

      const progress = still ? 0.35 : ((t * 0.28) % 1);
      const segF = progress * (centers.length - 1);
      const idx = Math.min(centers.length - 2, Math.floor(segF));
      const frac = segF - idx;
      const px = centers[idx].x + (centers[idx + 1].x - centers[idx].x) * frac;
      const py = centers[idx].y + (centers[idx + 1].y - centers[idx].y) * frac;

      ctx.fillStyle = "#FAF8F4";
      ctx.strokeStyle = aligned ? "#0E6B47" : "#D9481E";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 画活体卡片网格上的真实基线透视层
  function drawScanOverlay() {
    const r = stageEl.getBoundingClientRect();
    const w = Math.max(100, Math.round(r.width));
    const h = Math.max(80, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (scanOverlay.width !== Math.round(w * dpr) || scanOverlay.height !== Math.round(h * dpr)) {
      scanOverlay.width = Math.round(w * dpr);
      scanOverlay.height = Math.round(h * dpr);
    }
    const ctx = scanOverlay.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!state.showGuides || !lastRects.length) return;

    // 按行归类真实卡片
    const rows = [];
    for (const c of lastRects) {
      let row = rows.find((grp) => Math.abs(grp[0].y - c.y) < 18);
      if (!row) {
        row = [];
        rows.push(row);
      }
      row.push(c);
    }

    const jitter = lastEval ? lastEval.metrics.jitter : 0;
    const isFlat = jitter <= 2;

    for (const row of rows) {
      if (row.length < 2) continue;
      // 自由散排画底栏折线；仅外框等高时底栏虽齐、但正文起行错位，直接画正文起行折线揭露外齐内乱
      const useDescLine = state.alignMode === "stretch" && !isFlat;
      const getY = (c) => (useDescLine ? c.descTop : c.footTop);

      ctx.strokeStyle = isFlat ? "rgba(107, 242, 179, 0.95)" : "rgba(255, 94, 58, 0.95)";
      ctx.lineWidth = 2;
      ctx.setLineDash(isFlat ? [6, 4] : [4, 3]);
      ctx.beginPath();
      row.forEach((c, idx) => {
        const cx = c.x + c.w / 2;
        const cy = getY(c);
        if (idx === 0) ctx.moveTo(c.x + 8, cy);
        ctx.lineTo(cx, cy);
        if (idx === row.length - 1) ctx.lineTo(c.x + c.w - 8, cy);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      for (const c of row) {
        ctx.fillStyle = isFlat ? "#0E6B47" : "#D9381E";
        ctx.strokeStyle = "#FAF8F4";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, getY(c), 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 第一行卡片间外距标尺标注（清晰深蓝底黄字小标，避免与黄卡重合）
    if (rows[0] && rows[0].length >= 2) {
      const a = rows[0][0];
      const b = rows[0][1];
      const x1 = a.x + a.w;
      const x2 = b.x;
      const midY = a.y + Math.min(48, a.h * 0.24);
      const midX = (x1 + x2) / 2;
      if (x2 - x1 >= 2) {
        ctx.strokeStyle = "#0A1D56";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, midY);
        ctx.lineTo(x2, midY);
        ctx.stroke();

        ctx.strokeStyle = "#F9CA29";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, midY);
        ctx.lineTo(x2, midY);
        ctx.moveTo(x1 + 0.5, midY - 6);
        ctx.lineTo(x1 + 0.5, midY + 6);
        ctx.moveTo(x2 - 0.5, midY - 6);
        ctx.lineTo(x2 - 0.5, midY + 6);
        ctx.stroke();

        const label = `${state.gutter}px`;
        ctx.font = "700 10px 'IBM Plex Sans', sans-serif";
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = "#0A1D56";
        ctx.beginPath();
        ctx.roundRect(midX - tw / 2, midY - 22, tw, 15, 4);
        ctx.fill();
        ctx.fillStyle = "#F9CA29";
        ctx.textAlign = "center";
        ctx.fillText(label, midX, midY - 11);
      }
    }
  }

  let bpLoop = null;

  function syncAll(rebuildCards = false) {
    if (rebuildCards) renderCardsDom();
    applyGridStyles();
    const measured = measureDom();
    const ev = evaluateGrid(state, measured);
    updateReadouts(ev);
    drawCaliper();
    drawScanOverlay();
    if (bpLoop) bpLoop.draw();
  }

  function scheduleSync() {
    if (pendingRaf) return;
    pendingRaf = requestAnimationFrame(() => {
      pendingRaf = 0;
      syncAll(false);
    });
  }

  // 事件绑定：列数、对齐、引导线、复原
  colBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.cols = Number(btn.dataset.cols);
      syncAll(false);
    });
  });

  alignBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.alignMode = btn.dataset.align;
      syncAll(false);
    });
  });

  guidesBtn.addEventListener("click", () => {
    state.showGuides = !state.showGuides;
    syncAll(false);
  });

  resetBtn.addEventListener("click", () => {
    const fresh = getInitialState(window.innerWidth);
    state.cols = fresh.cols;
    state.gutter = fresh.gutter;
    state.alignMode = fresh.alignMode;
    state.spotlights = new Set(fresh.spotlights);
    state.cardCount = fresh.cardCount;
    state.showGuides = true;
    syncAll(true);
  });

  // 卡片焦点切换、删除、延展新卡
  gridEl.addEventListener("click", (e) => {
    const spotBtn = e.target.closest("[data-toggle-spot]");
    if (spotBtn) {
      const id = Number(spotBtn.dataset.toggleSpot);
      if (state.spotlights.has(id)) state.spotlights.delete(id);
      else state.spotlights.add(id);
      syncAll(true);
      return;
    }
    const delBtn = e.target.closest("[data-del-card]");
    if (delBtn) {
      if (state.cardCount > 6) {
        state.spotlights.delete(state.cardCount);
        state.cardCount--;
        syncAll(true);
      }
      return;
    }
    if (e.target.closest("#extend-card-btn")) {
      if (state.cardCount < CARDS_DATA.length) {
        state.cardCount++;
        syncAll(true);
      }
    }
  });

  // 拖拉卡距卡尺轨（支持 Pointer + Touch + 键盘方向键，保证 perf drag 60fps 响应）
  function setGutterFromClientX(clientX) {
    const r = caliperHit.getBoundingClientRect();
    const padX = 14;
    const t = Math.max(0, Math.min(1, (clientX - r.left - padX) / Math.max(1, r.width - padX * 2)));
    const next = Math.round(MIN_GUTTER + t * (MAX_GUTTER - MIN_GUTTER));
    if (next !== state.gutter) {
      state.gutter = next;
      scheduleSync();
    } else {
      // 即使像素取整没跳档，也在拖拽帧里重绘卡尺确保交互手感流畅
      drawCaliper();
    }
  }

  caliperHit.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { caliperHit.setPointerCapture(e.pointerId); } catch {}
    setGutterFromClientX(e.clientX);
  });
  caliperHit.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setGutterFromClientX(e.clientX);
  });
  const endDrag = () => { dragging = false; };
  caliperHit.addEventListener("pointerup", endDrag);
  caliperHit.addEventListener("pointercancel", endDrag);

  // 兼容直接派发的 TouchEvent（如移动触控与性能脚本）
  caliperHit.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    dragging = true;
    setGutterFromClientX(e.touches[0].clientX);
  }, { passive: true });
  caliperHit.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches.length) return;
    setGutterFromClientX(e.touches[0].clientX);
  }, { passive: true });
  caliperHit.addEventListener("touchend", endDrag, { passive: true });

  caliperHit.addEventListener("keydown", (e) => {
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 2;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -2;
    if (!delta) return;
    e.preventDefault();
    state.gutter = Math.max(MIN_GUTTER, Math.min(MAX_GUTTER, state.gutter + delta));
    syncAll(false);
  });

  // 视口尺寸变化同步重测
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 640 && state.cols > 3) state.cols = 3;
      syncAll(false);
    }, 80);
  });

  renderCardsDom();
  syncAll(false);

  bpLoop = loop(bpCanvas, (t, _dt, { still }) => {
    animPhase = t;
    drawBlueprint(animPhase, still);
  });
  // 确保首帧立刻画出
  drawBlueprint(0, reducedMotion.matches);
}

// ==================== 01 共同区域显影实验 ====================
function initRegionLab() {
  const stage = $("#region-stage");
  const btns = $$("#region-modes button");
  const items = $$(".rg-item", stage);
  const caption = $("#region-caption");

  const copy = {
    bare: "无框裸排：四块图与四组文字裸露在同一底面上，内部间距又拉得偏散，视线横扫时很难立刻分辨哪行字配哪张图。",
    filled: "色块包裹（Filled）：用暖白底色配合 18px 外沟壑划出「共同区域」，不需要一根多余线条，四个独立单元已经清清楚楚。",
    outlined: "细线描边（Outlined）：当卡片与页面同为浅白底时，用 2px 钴蓝描边锁定归属，适合信息边界需要高度克制的工具界面。",
    cramped: "外距 < 内距反例：卡间只留 3px 细缝，而卡内文字隔了 14px——格式塔接近律让相邻卡片粘成砖墙，边框反而成了视觉噪音。"
  };

  let mode = "filled";
  let picked = -1;

  function render() {
    stage.dataset.mode = mode;
    btns.forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    items.forEach((it, idx) => it.setAttribute("aria-pressed", String(idx === picked)));
    const extra = picked >= 0 ? ` 当前选中第 ${picked + 1} 项，观察它的完整点击热区边界。` : "";
    caption.textContent = copy[mode] + extra;
  }

  btns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; render(); }));
  items.forEach((it, idx) => it.addEventListener("click", () => { picked = picked === idx ? -1 : idx; render(); }));
  render();
}

// ==================== 02 原海报八条原则矩阵 ====================
function initPrinciples() {
  const matrix = $("#p-matrix");
  const pdNo = $("#pd-no");
  const pdTitle = $("#pd-title");
  const pdCaveat = $("#pd-caveat");
  const pdQuote = $("#pd-quote");
  const pdExplain = $("#pd-explain");
  const pdDemo = $("#pd-demo");
  const pdNote = $("#pd-note");
  const goodBtn = $("#pd-good");
  const badBtn = $("#pd-bad");

  function miniIcon(art, isYellow) {
    const accent = isYellow ? "#0A1D56" : "#F9CA29";
    const blue = "#023ACB";
    const soft = isYellow ? "#FAF8F4" : "#F3DFA4";
    switch (art) {
      case "quad":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><rect x="14" y="4" width="22" height="15" rx="2" fill="${accent}"/><rect x="44" y="4" width="22" height="15" rx="2" fill="${accent}"/><rect x="14" y="24" width="22" height="15" rx="2" fill="${accent}"/><rect x="44" y="24" width="22" height="15" rx="2" fill="${accent}"/></svg>`;
      case "consistent":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><rect x="14" y="4" width="22" height="15" rx="2" fill="${soft}"/><rect x="44" y="4" width="22" height="15" rx="2" fill="${soft}"/><rect x="14" y="24" width="22" height="15" rx="2" fill="${soft}"/><rect x="44" y="24" width="22" height="15" rx="2" fill="${soft}"/></svg>`;
      case "eye":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><path d="M6 22C16 9 34 9 44 22C34 35 16 35 6 22Z" fill="none" stroke="${blue}" stroke-width="2.5"/><circle cx="25" cy="22" r="5" fill="${blue}"/><rect x="52" y="8" width="22" height="5" rx="1" fill="${soft}"/><rect x="52" y="19" width="22" height="5" rx="1" fill="${soft}"/><rect x="52" y="30" width="22" height="5" rx="1" fill="${soft}"/></svg>`;
      case "shapes":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><rect x="8" y="13" width="18" height="18" rx="2" fill="${accent}"/><circle cx="42" cy="22" r="10" fill="${accent}"/><polygon points="66,11 76,33 56,33" fill="${accent}"/></svg>`;
      case "align":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><line x1="12" y1="4" x2="12" y2="40" stroke="${blue}" stroke-dasharray="3 2" stroke-width="1.5"/><rect x="16" y="8" width="52" height="10" rx="1.5" fill="${blue}"/><rect x="16" y="24" width="38" height="10" rx="1.5" fill="${blue}"/></svg>`;
      case "frame":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><rect x="18" y="6" width="44" height="32" rx="2" fill="none" stroke="${blue}" stroke-width="2.2" stroke-dasharray="6 4"/></svg>`;
      case "hierarchy":
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><rect x="10" y="7" width="60" height="11" rx="1.5" fill="${blue}"/><rect x="10" y="22" width="60" height="6" rx="1" fill="#BCC5E4"/><rect x="10" y="32" width="44" height="5" rx="1" fill="#D4DCF0"/></svg>`;
      default:
        return `<svg viewBox="0 0 80 44" aria-hidden="true"><rect x="6" y="6" width="14" height="13" rx="1.5" fill="#5878D8"/><rect x="24" y="6" width="14" height="13" rx="1.5" fill="#5878D8"/><rect x="42" y="6" width="14" height="13" rx="1.5" fill="#88A1E4"/><rect x="60" y="6" width="14" height="13" rx="1.5" fill="none" stroke="${blue}" stroke-dasharray="3 2" stroke-width="1.5"/><rect x="6" y="24" width="14" height="13" rx="1.5" fill="#88A1E4"/><rect x="24" y="24" width="14" height="13" rx="1.5" fill="#BCC5E4"/></svg>`;
    }
  }

  function demoSvg(p, isGood) {
    const cream = "#F6EFE4";
    const yellow = "#F9CA29";
    const bad = "#FF6B4A";
    const blue = "#0A1D56";
    if (isGood) {
      switch (p.no) {
        case "01":
          return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="14" y="14" width="156" height="82" rx="8" fill="${cream}"/><rect x="24" y="24" width="48" height="62" rx="4" fill="${yellow}"/><rect x="82" y="28" width="76" height="10" rx="2" fill="${blue}"/><rect x="82" y="46" width="60" height="6" rx="2" fill="#5878D8"/><rect x="82" y="68" width="46" height="14" rx="4" fill="#023ACB"/><rect x="190" y="14" width="156" height="82" rx="8" fill="${cream}"/><rect x="200" y="24" width="48" height="62" rx="4" fill="#5878D8"/><rect x="258" y="28" width="76" height="10" rx="2" fill="${blue}"/><rect x="258" y="46" width="60" height="6" rx="2" fill="#5878D8"/><rect x="258" y="68" width="46" height="14" rx="4" fill="#023ACB"/></svg>`;
        case "02":
          return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2].map((i) => `<g transform="translate(${16 + i * 114},14)"><rect width="98" height="82" rx="8" fill="${cream}"/><rect x="10" y="10" width="78" height="30" rx="4" fill="${yellow}"/><rect x="10" y="48" width="60" height="7" rx="2" fill="${blue}"/><rect x="10" y="62" width="42" height="6" rx="2" fill="#5878D8"/></g>`).join("")}</svg>`;
        case "03":
          return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2].map((i) => `<g transform="translate(${16 + i * 114},14)"><rect width="98" height="82" rx="8" fill="${i === 1 ? yellow : cream}"/><rect x="10" y="10" width="78" height="32" rx="4" fill="${i === 1 ? blue : "#5878D8"}"/><rect x="10" y="50" width="66" height="8" rx="2" fill="${blue}"/></g>`).join("")}<line x1="20" y1="68" x2="340" y2="68" stroke="#6BF2B3" stroke-width="2.5" stroke-dasharray="6 4"/></svg>`;
        case "04":
          return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="16" y="14" width="144" height="82" rx="8" fill="none" stroke="${cream}" stroke-dasharray="4 3"/><rect x="24" y="22" width="58" height="30" rx="5" fill="${cream}"/><rect x="92" y="22" width="58" height="30" rx="5" fill="${yellow}"/><rect x="24" y="58" width="58" height="30" rx="5" fill="${cream}"/><rect x="92" y="58" width="58" height="30" rx="5" fill="${cream}"/><path d="M174 55h28m-8-7l8 7-8 7" fill="none" stroke="${yellow}" stroke-width="2.5"/><rect x="216" y="14" width="128" height="82" rx="8" fill="none" stroke="${cream}" stroke-dasharray="4 3"/><rect x="226" y="22" width="108" height="18" rx="4" fill="${cream}"/><rect x="226" y="46" width="108" height="18" rx="4" fill="${yellow}"/><rect x="226" y="70" width="108" height="18" rx="4" fill="${cream}"/></svg>`;
        case "05":
          return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2].map((i) => `<g transform="translate(${16 + i * 114},14)"><rect width="98" height="82" rx="8" fill="${cream}"/><rect x="10" y="12" width="64" height="8" rx="2" fill="${blue}"/><rect x="10" y="34" width="76" height="6" rx="2" fill="#5878D8"/><rect x="10" y="64" width="52" height="10" rx="3" fill="#023ACB"/></g>`).join("")}<line x1="12" y1="83" x2="348" y2="83" stroke="#6BF2B3" stroke-width="2" stroke-dasharray="5 3"/></svg>`;
        case "06":
          return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="24" y="16" width="142" height="78" rx="8" fill="${cream}"/><rect x="40" y="30" width="110" height="12" rx="2" fill="${blue}"/><rect x="40" y="50" width="84" height="8" rx="2" fill="#5878D8"/><rect x="194" y="16" width="142" height="78" rx="8" fill="${cream}"/><rect x="210" y="30" width="110" height="12" rx="2" fill="${blue}"/><rect x="210" y="50" width="84" height="8" rx="2" fill="#5878D8"/><path d="M166 55h28" stroke="${yellow}" stroke-width="2.5"/><text x="180" y="48" text-anchor="middle" fill="${yellow}" font-size="11" font-weight="700">外&gt;内</text></svg>`;
        case "07":
          return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<rect x="${16 + i * 85}" y="16" width="73" height="78" rx="8" fill="${i === 1 ? yellow : cream}"/>`).join("")}</svg>`;
        default:
          return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2].map((i) => `<rect x="${16 + i * 84}" y="16" width="72" height="78" rx="8" fill="${cream}"/>`).join("")}<rect x="268" y="16" width="76" height="78" rx="8" fill="none" stroke="${yellow}" stroke-width="2.5" stroke-dasharray="6 4"/><text x="306" y="61" text-anchor="middle" fill="${yellow}" font-size="22" font-weight="800">+</text></svg>`;
      }
    }
    // 破功态
    switch (p.no) {
      case "01":
        return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="24" y="12" width="312" height="86" rx="8" fill="${cream}" stroke="${bad}" stroke-width="2.5"/><rect x="36" y="22" width="70" height="14" rx="3" fill="${bad}"/><rect x="116" y="22" width="90" height="14" rx="3" fill="${yellow}"/><rect x="216" y="22" width="108" height="14" rx="3" fill="#5878D8"/><rect x="36" y="46" width="130" height="10" rx="2" fill="${blue}"/><rect x="178" y="46" width="146" height="10" rx="2" fill="${blue}"/><rect x="36" y="66" width="66" height="20" rx="4" fill="${bad}"/><rect x="112" y="66" width="66" height="20" rx="4" fill="${blue}"/><rect x="188" y="66" width="66" height="20" rx="4" fill="${yellow}"/></svg>`;
      case "02":
        return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="14" y="10" width="90" height="88" rx="22" fill="${cream}"/><rect x="116" y="26" width="124" height="58" rx="0" fill="${yellow}"/><rect x="252" y="8" width="94" height="92" rx="4" fill="#BCC5E4" stroke="${bad}" stroke-width="2.5"/></svg>`;
      case "03":
        return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<rect x="${12 + i * 86}" y="14" width="78" height="82" rx="6" fill="${cream}"/>`).join("")}<path d="M30 34H120L50 56H220L140 76H325" fill="none" stroke="${bad}" stroke-width="2.5"/></svg>`;
      case "04":
        return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="16" y="14" width="140" height="82" rx="6" fill="${cream}"/><rect x="164" y="14" width="96" height="44" rx="6" fill="${yellow}"/><rect x="242" y="34" width="104" height="62" rx="6" fill="${bad}" opacity="0.88"/></svg>`;
      case "05":
        return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="16" y="14" width="98" height="64" rx="8" fill="${cream}"/><rect x="26" y="54" width="52" height="10" rx="3" fill="${bad}"/><rect x="130" y="14" width="98" height="86" rx="8" fill="${cream}"/><rect x="140" y="78" width="52" height="10" rx="3" fill="${bad}"/><rect x="244" y="14" width="98" height="72" rx="8" fill="${cream}"/><rect x="254" y="64" width="52" height="10" rx="3" fill="${bad}"/><path d="M52 59L166 83L280 69" fill="none" stroke="${bad}" stroke-width="2.5"/></svg>`;
      case "06":
        return `<svg viewBox="0 0 360 110" aria-hidden="true"><rect x="18" y="14" width="160" height="82" rx="4" fill="${cream}"/><rect x="182" y="14" width="160" height="82" rx="4" fill="${cream}"/><rect x="22" y="20" width="152" height="14" fill="${blue}"/><rect x="186" y="20" width="152" height="14" fill="${blue}"/><line x1="180" y1="10" x2="180" y2="100" stroke="${bad}" stroke-width="3"/></svg>`;
      case "07":
        return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<rect x="${16 + i * 85}" y="16" width="73" height="78" rx="8" fill="${yellow}" stroke="${bad}" stroke-width="2.5"/>`).join("")}</svg>`;
      default:
        return `<svg viewBox="0 0 360 110" aria-hidden="true">${[0, 1, 2].map((i) => `<rect x="${16 + i * 94}" y="16" width="84" height="78" rx="8" fill="${cream}"/>`).join("")}<rect x="298" y="24" width="58" height="70" rx="8" fill="${bad}"/></svg>`;
    }
  }

  let selected = 2; // 默认停在原海报亮黄的 03 号「扫读」
  let showGood = true;

  function renderMatrix() {
    matrix.innerHTML = POSTER_PRINCIPLES.map((p, idx) => `
      <button type="button" class="p-tile${p.spotlight ? " is-yellow" : ""}" role="option" data-p-idx="${idx}" aria-selected="${idx === selected}">
        <span class="p-tile-no" lang="en">${p.no}</span>
        <span class="p-tile-zh">${p.zh}</span>
        <span class="p-tile-en" lang="en">${p.en}</span>
        ${miniIcon(p.art, !!p.spotlight)}
      </button>
    `).join("");
  }

  function renderDetail() {
    const p = POSTER_PRINCIPLES[selected];
    pdNo.textContent = p.no;
    pdTitle.innerHTML = `${p.zh} <span class="pd-en" lang="en">${p.en}</span>`;
    if (p.caveat) {
      pdCaveat.hidden = false;
      pdCaveat.textContent = p.caveat;
    } else {
      pdCaveat.hidden = true;
    }
    pdQuote.textContent = `原海报：「${p.quote}」`;
    pdExplain.textContent = p.explain;
    pdDemo.dataset.state = showGood ? "good" : "bad";
    pdDemo.innerHTML = demoSvg(p, showGood);
    pdNote.textContent = showGood ? `✓ ${p.goodNote}` : `× ${p.badNote}`;

    goodBtn.classList.toggle("is-on", showGood);
    badBtn.classList.toggle("is-on", !showGood);
    goodBtn.setAttribute("aria-pressed", String(showGood));
    badBtn.setAttribute("aria-pressed", String(!showGood));
    $$(".p-tile", matrix).forEach((el, idx) => el.setAttribute("aria-selected", String(idx === selected)));
  }

  matrix.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-p-idx]");
    if (!btn) return;
    selected = Number(btn.dataset.pIdx);
    showGood = true;
    renderDetail();
  });
  goodBtn.addEventListener("click", () => { showGood = true; renderDetail(); });
  badBtn.addEventListener("click", () => { showGood = false; renderDetail(); });

  renderMatrix();
  renderDetail();
}

// ==================== 03 Subgrid 压力台 + 水平激光尺 ====================
function initSubgridLab() {
  const cardsWrap = $("#sg-cards");
  const modeBtns = $$("#sg-mode-btns button");
  const longTitleBtn = $("#sg-long-title");
  const addTagBtn = $("#sg-add-tag");
  const resetBtn = $("#sg-reset");
  const laser = $("#sg-laser");
  const laserRange = $("#sg-ruler-range");
  const diffReadout = $("#sg-diff-readout");
  const t1 = $("#sg-t1");
  const b1 = $("#sg-b1");
  const t2 = $("#sg-t2");

  const st = {
    mode: "normal",
    extraTitle: true,
    extraTag: false
  };

  function applyContent() {
    t1.textContent = st.extraTitle
      ? "现代平面排印系统、跨屏栅格秩序与多栏出版物实战研究（增订全本）"
      : "平面排印实战";
    b1.textContent = st.extraTitle
      ? "完整拆解二十组书刊与网页跨设备网格结构，附真实数据压力测试案例与跨浏览器实现清单。"
      : "拆解书刊与网页网格结构。";
    t2.innerHTML = st.extraTag
      ? `<span class="sg-extra-tag">双语修订</span>纸张肌理、专色网点与界面色彩明度对照指南`
      : `纸张与色彩指南`;
  }

  function measureSubgridDiff() {
    const cards = $$(".sg-card", cardsWrap);
    const wrapR = cardsWrap.getBoundingClientRect();
    // 手机竖屏折成单列时不报水平偏差
    if (cards.length < 2 || Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) > 30) {
      diffReadout.textContent = "窄屏自动折为单列；切宽屏可实测同行 3 卡水平基线差。";
      return;
    }
    const bodyTops = cards.map((c) => c.querySelector(".sg-body").getBoundingClientRect().top - wrapR.top);
    const footTops = cards.map((c) => c.querySelector(".sg-foot").getBoundingClientRect().top - wrapR.top);
    const bodyDiff = Math.round(Math.max(...bodyTops) - Math.min(...bodyTops));
    const footDiff = Math.round(Math.max(...footTops) - Math.min(...footTops));

    if (st.mode === "subgrid") {
      diffReadout.textContent = `实测：正文起行差 ${bodyDiff}px · 底栏基线差 ${footDiff}px（行轨锁齐）`;
    } else if (st.mode === "stretch") {
      diffReadout.textContent = `实测：外框等高，但正文起行仍错位 ${bodyDiff}px · 底栏靠底对齐`;
    } else {
      diffReadout.textContent = `实测：正文起行错位 ${bodyDiff}px · 底栏按钮上下差 ${footDiff}px`;
    }
  }

  function render() {
    cardsWrap.dataset.sg = st.mode;
    modeBtns.forEach((b) => {
      const on = b.dataset.sg === st.mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    longTitleBtn.classList.toggle("is-on", st.extraTitle);
    addTagBtn.classList.toggle("is-on", st.extraTag);
    applyContent();
    laser.style.top = `${laserRange.value}%`;
    requestAnimationFrame(measureSubgridDiff);
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => { st.mode = b.dataset.sg; render(); }));
  longTitleBtn.addEventListener("click", () => { st.extraTitle = !st.extraTitle; render(); });
  addTagBtn.addEventListener("click", () => { st.extraTag = !st.extraTag; render(); });
  resetBtn.addEventListener("click", () => {
    st.extraTitle = false;
    st.extraTag = false;
    render();
  });
  laserRange.addEventListener("input", () => {
    laser.style.top = `${laserRange.value}%`;
  });
  window.addEventListener("resize", () => requestAnimationFrame(measureSubgridDiff));

  render();
}

// ==================== 04 历史标本时间轨 ====================
function initHistory() {
  const tabsEl = $("#era-tabs");
  const artifactEl = $("#era-artifact");
  const yearEl = $("#era-year");
  const whoEl = $("#era-who");
  const titleEl = $("#era-title");
  const summaryEl = $("#era-summary");

  function eraSvg(kind) {
    switch (kind) {
      case "hypercard":
        return `<svg viewBox="0 0 320 176" aria-hidden="true"><rect x="34" y="24" width="240" height="128" rx="4" fill="#FAF8F4" stroke="#0A1D56" stroke-width="2"/><rect x="24" y="16" width="240" height="128" rx="4" fill="#FAF8F4" stroke="#0A1D56" stroke-width="2"/><rect x="24" y="16" width="240" height="22" fill="#0A1D56"/><text x="34" y="31" fill="#FAF8F4" font-size="11" font-weight="700">HyperCard · Stack 1 / 24</text><rect x="38" y="50" width="90" height="58" fill="#EEF2FB" stroke="#0A1D56" stroke-width="1.5"/><rect x="142" y="52" width="104" height="10" fill="#0A1D56"/><rect x="142" y="70" width="84" height="7" fill="#5878D8"/><rect x="142" y="84" width="92" height="7" fill="#5878D8"/><rect x="142" y="112" width="66" height="20" rx="10" fill="#F9CA29" stroke="#0A1D56" stroke-width="1.5"/><text x="175" y="126" text-anchor="middle" fill="#0A1D56" font-size="10" font-weight="700">Next Card</text></svg>`;
      case "palmer":
        return `<svg viewBox="0 0 320 176" aria-hidden="true"><rect x="18" y="26" width="130" height="124" rx="12" fill="#FAF8F4" stroke="#023ACB" stroke-width="2.5"/><rect x="172" y="26" width="130" height="124" rx="12" fill="#F9CA29" stroke="#0A1D56" stroke-width="2.5"/><circle cx="56" cy="88" r="14" fill="#023ACB"/><circle cx="110" cy="88" r="14" fill="#023ACB"/><circle cx="210" cy="88" r="14" fill="#0A1D56"/><circle cx="264" cy="88" r="14" fill="#0A1D56"/><text x="160" y="166" text-anchor="middle" fill="#0A1D56" font-size="11" font-weight="700">封闭边界内的点被优先归为同一组</text></svg>`;
      case "mobilecards":
        return `<svg viewBox="0 0 320 176" aria-hidden="true"><rect x="96" y="10" width="128" height="156" rx="16" fill="#0A1D56"/><rect x="104" y="22" width="112" height="132" rx="8" fill="#EEF2FB"/><rect x="112" y="30" width="96" height="36" rx="6" fill="#FAF8F4"/><rect x="118" y="37" width="32" height="22" rx="3" fill="#F9CA29"/><rect x="156" y="39" width="44" height="6" rx="2" fill="#0A1D56"/><rect x="156" y="49" width="34" height="5" rx="2" fill="#5878D8"/><rect x="112" y="72" width="96" height="36" rx="6" fill="#FAF8F4"/><rect x="118" y="79" width="84" height="8" rx="2" fill="#023ACB"/><rect x="118" y="92" width="60" height="6" rx="2" fill="#5878D8"/><rect x="112" y="114" width="96" height="32" rx="6" fill="#F9CA29"/><rect x="118" y="124" width="66" height="8" rx="2" fill="#0A1D56"/></svg>`;
      case "material":
        return `<svg viewBox="0 0 320 176" aria-hidden="true"><g transform="translate(18,22)"><rect x="4" y="6" width="84" height="126" rx="10" fill="rgba(10,29,86,0.18)"/><rect width="84" height="126" rx="10" fill="#FAF8F4"/><rect x="0" y="0" width="84" height="50" rx="10" fill="#023ACB"/><text x="42" y="114" text-anchor="middle" fill="#0A1D56" font-size="10" font-weight="700">Elevated</text></g><g transform="translate(118,22)"><rect width="84" height="126" rx="10" fill="#F6EFE4"/><rect x="8" y="10" width="68" height="44" rx="6" fill="#F9CA29"/><text x="42" y="114" text-anchor="middle" fill="#0A1D56" font-size="10" font-weight="700">Filled</text></g><g transform="translate(218,22)"><rect width="84" height="126" rx="10" fill="#FAF8F4" stroke="#023ACB" stroke-width="2"/><rect x="8" y="10" width="68" height="44" rx="6" fill="#BCC5E4"/><text x="42" y="114" text-anchor="middle" fill="#0A1D56" font-size="10" font-weight="700">Outlined</text></g></svg>`;
      default:
        return `<svg viewBox="0 0 320 176" aria-hidden="true">${[0, 1, 2].map((i) => `<g transform="translate(${14 + i * 100},18)"><rect width="90" height="136" rx="8" fill="${i === 1 ? "#F9CA29" : "#FAF8F4"}" stroke="#023ACB" stroke-width="1.5"/><rect x="8" y="10" width="74" height="32" rx="4" fill="#023ACB"/><rect x="8" y="50" width="64" height="8" rx="2" fill="#0A1D56"/><rect x="8" y="64" width="${i === 1 ? 70 : 42}" height="7" rx="2" fill="#5878D8"/><rect x="8" y="112" width="74" height="14" rx="4" fill="#0A1D56"/></g>`).join("")}<line x1="8" y1="68" x2="312" y2="68" stroke="#0E6B47" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="8" y1="130" x2="312" y2="130" stroke="#0E6B47" stroke-width="1.5" stroke-dasharray="4 3"/></svg>`;
    }
  }

  let active = 0;
  function render() {
    tabsEl.innerHTML = HISTORY_ERAS.map((e, idx) => `
      <button type="button" class="era-tab" role="tab" data-era="${idx}" aria-selected="${idx === active}">
        <strong lang="en">${e.year}</strong>
        <span>${e.title}</span>
      </button>
    `).join("");

    const cur = HISTORY_ERAS[active];
    yearEl.textContent = cur.year;
    whoEl.textContent = cur.who;
    titleEl.textContent = cur.title;
    summaryEl.textContent = cur.summary;
    artifactEl.innerHTML = eraSvg(cur.artifact);
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-era]");
    if (!btn) return;
    active = Number(btn.dataset.era);
    render();
  });

  render();
}

// ==================== 05 场景分诊台 ====================
function initTriage() {
  const tabsEl = $("#triage-tabs");
  const visualEl = $("#triage-visual");
  const verdictEl = $("#tr-verdict");
  const altEl = $("#tr-alt");
  const reasonEl = $("#tr-reason");
  const costGridEl = $("#tr-cost-grid");
  const costAltEl = $("#tr-cost-alt");

  function previewSvg(type) {
    // 左侧固定「卡片网格」，右侧「对照版式」
    const leftGrid = `<rect x="10" y="24" width="154" height="156" rx="8" fill="#023ACB"/>
      <text x="87" y="16" text-anchor="middle" fill="#0A1D56" font-size="11" font-weight="700">卡片网格（270）</text>
      ${[0, 1, 2, 3].map((i) => `<rect x="${20 + (i % 2) * 70}" y="${36 + Math.floor(i / 2) * 70}" width="62" height="60" rx="6" fill="${i === 1 ? "#F9CA29" : "#F6EFE4"}"/>`).join("")}`;

    let right = "";
    let rightLabel = "";
    if (type === "grid-win") {
      rightLabel = "强行压成纯文字表";
      right = `<rect x="186" y="24" width="154" height="156" rx="8" fill="#FAF8F4" stroke="#5878D8" stroke-width="1.5"/>
        ${[0, 1, 2, 3, 4].map((r) => `<line x1="196" y1="${52 + r * 26}" x2="330" y2="${52 + r * 26}" stroke="#BCC5E4"/><rect x="198" y="${36 + r * 26}" width="58" height="8" rx="2" fill="#0A1D56"/><rect x="276" y="${36 + r * 26}" width="44" height="8" rx="2" fill="#5878D8"/>`).join("")}`;
    } else if (type === "table") {
      rightLabel = "推荐：274 数据表格";
      right = `<rect x="186" y="24" width="154" height="156" rx="8" fill="#FAF8F4" stroke="#0E6B47" stroke-width="2.5"/>
        <rect x="186" y="24" width="154" height="24" rx="6" fill="#023ACB"/>
        ${[0, 1, 2, 3].map((r) => `<rect x="196" y="${58 + r * 28}" width="32" height="10" rx="2" fill="#0A1D56"/><rect x="240" y="${58 + r * 28}" width="32" height="10" rx="2" fill="#5878D8"/><rect x="288" y="${58 + r * 28}" width="40" height="10" rx="2" fill="${r === 1 ? "#F9CA29" : "#0E6B47"}"/>`).join("")}`;
    } else if (type === "feed") {
      rightLabel = "推荐：269 信息流";
      right = `<rect x="186" y="24" width="154" height="156" rx="8" fill="#FAF8F4" stroke="#0E6B47" stroke-width="2.5"/>
        <line x1="204" y1="36" x2="204" y2="168" stroke="#023ACB" stroke-width="2"/>
        ${[0, 1, 2].map((r) => `<circle cx="204" cy="${52 + r * 46}" r="5" fill="#F9CA29" stroke="#023ACB" stroke-width="2"/><rect x="218" y="${38 + r * 46}" width="110" height="32" rx="6" fill="#EEF2FB"/>`).join("")}`;
    } else if (type === "masonry") {
      rightLabel = "推荐：271 瀑布流";
      right = `<rect x="186" y="24" width="154" height="156" rx="8" fill="#023ACB" stroke="#0E6B47" stroke-width="2.5"/>
        <rect x="196" y="34" width="64" height="82" rx="6" fill="#F6EFE4"/>
        <rect x="268" y="34" width="62" height="44" rx="6" fill="#F9CA29"/>
        <rect x="196" y="122" width="64" height="48" rx="6" fill="#BCC5E4"/>
        <rect x="268" y="84" width="62" height="86" rx="6" fill="#F6EFE4"/>`;
    } else {
      rightLabel = "推荐：272 便当盒";
      right = `<rect x="186" y="24" width="154" height="156" rx="8" fill="#023ACB" stroke="#0E6B47" stroke-width="2.5"/>
        <rect x="196" y="34" width="84" height="86" rx="8" fill="#F9CA29"/>
        <rect x="286" y="34" width="44" height="40" rx="6" fill="#F6EFE4"/>
        <rect x="286" y="80" width="44" height="40" rx="6" fill="#BCC5E4"/>
        <rect x="196" y="126" width="134" height="44" rx="6" fill="#F6EFE4"/>`;
    }

    return `<svg viewBox="0 0 350 190" aria-hidden="true">${leftGrid}${right}<text x="263" y="16" text-anchor="middle" fill="#0A1D56" font-size="11" font-weight="700">${rightLabel}</text></svg>`;
  }

  let idx = 0;
  function render() {
    tabsEl.innerHTML = TRIAGE_SCENARIOS.map((s, i) => `
      <button type="button" class="pill-btn${i === idx ? " is-on" : ""}" role="tab" data-tr="${i}" aria-selected="${i === idx}">${s.label}</button>
    `).join("");

    const s = TRIAGE_SCENARIOS[idx];
    verdictEl.textContent = s.verdict;
    verdictEl.dataset.tone = s.tone;
    altEl.innerHTML = s.altHref
      ? `更合适：<a href="${s.altHref}" target="_blank" rel="noopener">${s.altName} ↗</a>`
      : `结论：${s.altName}`;
    reasonEl.textContent = s.reason;
    costGridEl.textContent = s.costGrid;
    costAltEl.textContent = s.costAlt;
    visualEl.innerHTML = previewSvg(s.previewType);
  }

  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tr]");
    if (!b) return;
    idx = Number(b.dataset.tr);
    render();
  });
  render();
}

// ==================== 06 密度与孤卡 2D Canvas 模拟器 ====================
function initDensitySim() {
  const widthInput = $("#d-width");
  const widthVal = $("#d-width-val");
  const countBtns = $$("#d-count-btns button");
  const canvas = $("#density-canvas");
  const readout = $("#density-readout");

  let simW = 960;
  let cardCount = 6;
  const minCard = 240;
  const gap = 16;

  function draw() {
    const r = canvas.getBoundingClientRect();
    const cw = Math.max(240, Math.round(r.width));
    const ch = Math.max(180, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const cols = Math.max(1, Math.floor((simW + gap) / (minCard + gap)));
    const actualCardW = Math.round((simW - gap * (cols - 1)) / cols);
    const rows = Math.ceil(cardCount / cols);
    const lastRowCount = cardCount % cols || cols;
    const isOrphan = cols > 1 && lastRowCount === 1;

    // 按比例缩放模拟容器，高度紧贴实际行数并居中展示
    const maxW = cw - 32;
    const boxW = Math.max(96, (simW / 1280) * maxW);
    const boxX = (cw - boxW) / 2;
    const pad = 10;
    const gPx = Math.max(3, (gap / simW) * boxW);
    const cellW = (boxW - pad * 2 - gPx * (cols - 1)) / cols;
    const maxBoxH = ch - 38;
    const cellH = Math.min(44, Math.max(18, (maxBoxH - pad * 2 - gPx * (rows - 1)) / rows));
    const boxH = Math.min(maxBoxH, rows * cellH + (rows - 1) * gPx + pad * 2);
    const boxY = 24 + (maxBoxH - boxH) / 2;

    // 外框与尺寸标尺
    ctx.strokeStyle = "rgba(250, 248, 244, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    ctx.fillStyle = "#F9CA29";
    ctx.font = "700 11px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`容器 ${simW}px → 自动 ${cols} 列 × 单卡 ${actualCardW}px`, cw / 2, Math.max(15, boxY - 8));

    for (let i = 0; i < cardCount; i++) {
      const c = i % cols;
      const rw = Math.floor(i / cols);
      const x = boxX + pad + c * (cellW + gPx);
      const y = boxY + pad + rw * (cellH + gPx);
      const orphanCard = isOrphan && i === cardCount - 1;

      ctx.fillStyle = orphanCard ? "#FF6B4A" : i === 0 ? "#F9CA29" : "#F6EFE4";
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(6, cellW), cellH, 4);
      ctx.fill();

      ctx.fillStyle = orphanCard ? "#FAF8F4" : "#0A1D56";
      ctx.font = "700 10px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1).padStart(2, "0"), x + cellW / 2, y + cellH / 2 + 3.5);
    }

    // 末行空位虚线提醒
    if (lastRowCount < cols) {
      const rw = rows - 1;
      for (let c = lastRowCount; c < cols; c++) {
        const x = boxX + pad + c * (cellW + gPx);
        const y = boxY + pad + rw * (cellH + gPx);
        ctx.strokeStyle = isOrphan ? "#FF6B4A" : "rgba(250, 248, 244, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(5, cellW - 1), cellH - 1);
        ctx.setLineDash([]);
      }
    }

    const tailNote = isOrphan
      ? `末行仅剩 1 张「孤卡」（红标），右侧留出 ${cols - 1} 个空位——建议微调每页条数或用全宽尾卡收口。`
      : lastRowCount === cols
        ? `共 ${rows} 行全部填满，底沿收口齐整无空洞。`
        : `末行排入 ${lastRowCount} 张卡，剩余 ${cols - lastRowCount} 格虚线留白，仍保持可读平衡。`;

    readout.textContent = `按 minmax(240px, 1fr)（经验值）推算：${simW}px 下排 ${cols} 列，实测单卡 ${actualCardW}px。${tailNote}`;
  }

  widthInput.addEventListener("input", () => {
    simW = Number(widthInput.value);
    widthVal.textContent = `${simW} px`;
    draw();
  });

  countBtns.forEach((b) => {
    b.addEventListener("click", () => {
      cardCount = Number(b.dataset.n);
      countBtns.forEach((btn) => btn.classList.toggle("is-on", btn === b));
      draw();
    });
  });

  const simLoop = loop(canvas, (_t, _dt, { still }) => {
    if (still) draw();
  });
  draw();
  window.addEventListener("resize", draw);
  void simLoop;
}

// ==================== 07 练一练：单变量对比测验 ====================
function initQuiz() {
  const grid = $("#quiz-grid");
  const qvTitle = $("#qv-title");
  const qvText = $("#qv-text");

  const options = [
    {
      id: "A",
      correct: true,
      note: "正确：3 列 × 20px 外距（大于卡内距）× 1 张亮黄焦点 × 同行标题与按钮基线齐平",
      reason: "方案 A 同时守住了全部四条底线：20px 外沟壑让六张卡清晰成组；只点亮第 03 号一张推荐书店，视线有明确第一落点；同行卡片的标题底沿与底部按钮在同一条水平线上，扫读毫不费力。"
    },
    {
      id: "B",
      correct: false,
      note: "仅改坏外距：卡距缩成 4px（小于卡内距），六张卡粘成一块",
      reason: "方案 B 的列数、焦点数量和对齐其实都对，唯独把外距压到了 4px——比卡片内部的留白还窄，邻卡边界在视觉上粘连成墙。对比方案 A，拉开 20px 沟壑后每张卡立刻独立清晰。"
    },
    {
      id: "C",
      correct: false,
      note: "仅改坏行内对齐：同行标题与底部按钮高低参差错位",
      reason: "方案 C 的卡距和单焦点都没问题，但它漏掉了跨卡行轨对齐：长标题卡片把底部按钮顶了下去，眼睛横向扫过价格与「路线」按钮时上下折返。用 Subgrid 锁齐行轨就能像方案 A 一样平顺。"
    },
    {
      id: "D",
      correct: false,
      note: "仅改坏层级比例：6 张里 4 张涂成亮黄，视觉焦点通胀失效",
      reason: "方案 D 间距齐整、基线也平直，但把 4/6 张卡都染成了亮黄色——全员喊重点反而失去了入口锚点。像方案 A 那样克制到只保留 1 张焦点卡，主次层级才立得住。"
    }
  ];

  function renderOptionSvg(optId, revealed) {
    // 统一 320×176 蓝底 3×2 卡片网格；只差单一变量
    const tight = optId === "B";
    const ragged = optId === "C";
    const overSpot = optId === "D";

    const gx = tight ? 4 : 14;
    const gy = tight ? 4 : 12;
    const padX = tight ? 22 : 14;
    const padY = tight ? 18 : 12;
    const cw = (320 - padX * 2 - gx * 2) / 3;
    const ch = (176 - padY * 2 - gy) / 2;

    let cardsSvg = "";
    for (let i = 0; i < 6; i++) {
      const c = i % 3;
      const rw = Math.floor(i / 3);
      const x = padX + c * (cw + gx);
      const y = padY + rw * (ch + gy);
      const isSpot = overSpot ? (i === 0 || i === 1 || i === 2 || i === 4) : i === 2;
      const hMod = ragged ? (i % 3 === 1 ? 8 : i % 3 === 0 ? -9 : -2) : 0;
      const cardH = ch + hMod;
      const btnY = y + cardH - 13;

      cardsSvg += `<g>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${cardH.toFixed(1)}" rx="6" fill="${isSpot ? "#F9CA29" : "#F6EFE4"}"/>
        <rect x="${(x + 7).toFixed(1)}" y="${(y + 7).toFixed(1)}" width="${(cw - 14).toFixed(1)}" height="18" rx="3" fill="${isSpot ? "#0A1D56" : "#5878D8"}"/>
        <rect x="${(x + 7).toFixed(1)}" y="${(y + 30).toFixed(1)}" width="${(cw * (i % 2 ? 0.72 : 0.56)).toFixed(1)}" height="5" rx="1.5" fill="#0A1D56"/>
        <rect x="${(x + 7).toFixed(1)}" y="${(y + 39).toFixed(1)}" width="${(cw * 0.48).toFixed(1)}" height="4" rx="1.5" fill="${isSpot ? "#1839B0" : "#889BD6"}"/>
        <rect x="${(x + 7).toFixed(1)}" y="${btnY.toFixed(1)}" width="26" height="7" rx="2" fill="${isSpot ? "#0A1D56" : "#023ACB"}"/>
      </g>`;
    }

    let overlay = "";
    if (revealed) {
      if (optId === "A") {
        const y1 = padY + ch - 10;
        const y2 = padY + ch + gy + ch - 10;
        overlay = `<line x1="10" y1="${y1}" x2="310" y2="${y1}" stroke="#6BF2B3" stroke-width="2" stroke-dasharray="5 3"/>
          <line x1="10" y1="${y2}" x2="310" y2="${y2}" stroke="#6BF2B3" stroke-width="2" stroke-dasharray="5 3"/>`;
      } else if (optId === "B") {
        const x1 = padX + cw + 2;
        const x2 = padX + cw * 2 + gx + 2;
        overlay = `<line x1="${x1}" y1="12" x2="${x1}" y2="164" stroke="#FF5E3A" stroke-width="2.5"/>
          <line x1="${x2}" y1="12" x2="${x2}" y2="164" stroke="#FF5E3A" stroke-width="2.5"/>`;
      } else if (optId === "C") {
        const yA = padY + ch - 9 - 10;
        const yB = padY + ch + 8 - 10;
        const yC = padY + ch - 2 - 10;
        overlay = `<path d="M40 ${yA} L160 ${yB} L280 ${yC}" fill="none" stroke="#FF5E3A" stroke-width="2.5"/>`;
      } else if (optId === "D") {
        overlay = `<rect x="8" y="8" width="304" height="160" rx="8" fill="none" stroke="#FF5E3A" stroke-width="3" stroke-dasharray="6 4"/>`;
      }
    }

    return `<svg class="quiz-svg" viewBox="0 0 320 176" aria-hidden="true">${cardsSvg}${overlay}</svg>`;
  }

  let picked = null;

  function render() {
    const revealed = picked !== null;
    grid.innerHTML = options.map((o) => {
      const isPicked = picked === o.id;
      let cls = "quiz-card";
      if (isPicked) cls += " is-picked";
      if (revealed) cls += o.correct ? " is-right" : isPicked ? " is-wrong" : "";
      return `
        <button type="button" class="${cls}" data-quiz="${o.id}" aria-pressed="${isPicked}">
          <div class="quiz-head">
            <span class="quiz-label">方案 ${o.id}</span>
            <span class="quiz-tag">${revealed ? (o.correct ? "✓ 最佳方案" : o.note.split("：")[0]) : "3 列 · 6 张卡"}</span>
          </div>
          ${renderOptionSvg(o.id, revealed)}
        </button>
      `;
    }).join("");

    if (revealed) {
      const chosen = options.find((o) => o.id === picked);
      qvTitle.textContent = chosen.correct ? "选对了：方案 A 最稳！" : `方案 ${chosen.id} 有一处破功——最稳的是方案 A`;
      qvText.textContent = chosen.reason;
    }
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quiz]");
    if (!btn) return;
    picked = btn.dataset.quiz;
    render();
  });
  render();
}

// ==================== 08 原海报放大、拖拽平移灯箱 ====================
function initLightbox() {
  const openBtn = $("#poster-open");
  const posterImg = $("#poster");
  const lb = $("#lightbox");
  const lbImg = $("#lb-img");
  const lbStage = $("#lb-stage");
  const closeBtn = $("#lb-close");
  const zoomIn = $("#lb-zoom-in");
  const zoomOut = $("#lb-zoom-out");
  const zoomReset = $("#lb-zoom-reset");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    closeBtn.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lbStage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });

  zoomIn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOut.addEventListener("click", () => { scale = Math.max(1, +(scale - 0.35).toFixed(2)); if (scale === 1) { tx = 0; ty = 0; } applyTransform(); });
  zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    pan = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-panning");
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stopPan = () => { pan = false; lbStage.classList.remove("is-panning"); };
  lbStage.addEventListener("pointerup", stopPan);
  lbStage.addEventListener("pointercancel", stopPan);
}

// -------------------- 启动 --------------------
initHero();
initRegionLab();
initPrinciples();
initSubgridLab();
initHistory();
initTriage();
initDensitySim();
initQuiz();
initLightbox();
