import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BASE_CARDS,
  EXTRA_CARDS,
  FIND_ITEMS,
  PRACTICE_OPTIONS,
  RATIO_RANGE,
  SWEET_RATIO,
  VIEWPORT_PRESETS,
  computeWaterfall,
  simulateStepPacking,
} from "./model.js";
import { CARD_ICONS, PILLAR_ICONS, cardArtSvg } from "./art.js";

// ==================== 0. 工具 ====================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 注入原海报底部四柱 SVG 图标
for (const k of ["stagger", "browse", "flexible", "rich"]) {
  const el = $(`#ico-${k}`);
  if (el) el.innerHTML = PILLAR_ICONS[k];
}

// ==================== 1. 顶部四股橄榄水波流徽标 ====================
function initWaveEmblem() {
  const canvas = $("#wave-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = 160;
  const H = 168;
  const dots = [
    [22, 108], [46, 104], [74, 112], [102, 106], [130, 114],
    [16, 126], [38, 122], [62, 130], [88, 124], [116, 132], [142, 126],
    [28, 144], [54, 140], [80, 148], [108, 142], [134, 148],
    [42, 158], [72, 160], [100, 158], [126, 160],
  ];

  function drawWave(t, _dt, { still }) {
    const dpr = Math.min(pixelRatio(2), 1.25);
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const phase = still ? 0 : t * 1.65;
    ctx.strokeStyle = "#5B5833";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    for (let s = 0; s < 4; s++) {
      const bx = 46 + s * 22;
      ctx.beginPath();
      for (let y = 8; y <= 94; y += 3) {
        const wave = Math.sin(y * 0.088 - phase + s * 0.65) * 5.2;
        if (y === 8) ctx.moveTo(bx + wave, y);
        else ctx.lineTo(bx + wave, y);
      }
      ctx.stroke();
    }

    dots.forEach(([x, y], i) => {
      const dy = still ? 0 : ((t * 14 + i * 7) % 10) - 5;
      const r = i % 3 === 0 ? 2.6 : 2.0;
      ctx.fillStyle = i % 5 === 0 ? "#CE5D2B" : "#5B5833";
      ctx.beginPath();
      ctx.arc(x, y + dy * 0.32, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const ctrl = loop(canvas, drawWave);
  ctrl.draw();
}

// ==================== 2. HERO 活体瀑布流砌墙台 ====================
function initHeroWall() {
  const wallWrap = $("#wall-canvas-wrap");
  const cardsEl = $("#wall-cards");
  const canvas = $("#hero-canvas");
  const ctx = canvas.getContext("2d");
  const rail = $("#ratio-rail");
  const thumb = $("#rail-thumb");
  const ratioOut = $("#ratio-readout");
  const btnReserve = $("#btn-reserve");
  const btnDrop = $("#btn-drop");
  const btnReset = $("#btn-reset");
  const chkXray = $("#chk-xray");
  const colsBtnsWrap = $("#cols-btns");
  const footerBand = $("#hero-footer-band");
  const mobileAnchor = $("#hero-verdict-mobile-anchor");
  const wallStage = $(".hero-wall-stage");

  const isLandscapePhone = () => window.innerHeight <= 460 && window.innerWidth > window.innerHeight;
  const isCompactView = () => {
    const wallW = wallWrap.clientWidth || window.innerWidth;
    return window.innerWidth <= 600 || isLandscapePhone() || wallW < 560;
  };

  function initialCols() {
    if (isLandscapePhone()) return 4; // 横屏右侧舞台宽 ~470px，4 列约 110px 刚好踩碎但仍可读
    if (isCompactView()) return 3; // 手机竖屏开场停在 3 列挤碎态（单卡 ~110px < 138px）
    return 6; // 桌面/平板开场停在 6 列过密/发散态
  }

  const state = {
    packing: "grid", // 开场：等高行锁（0/4 翻车态）
    cols: initialCols(),
    maxRatio: 3.0, // 开场：放任超长竖图霸屏
    reserveRatio: false, // 开场：未开启宽高比预占位
    xray: true,
    cards: BASE_CARDS.slice(),
    extraCursor: 0,
    pendingIds: new Set(),
    lastShiftPx: 0,
    shiftCardId: null,
    colJumpsOnAppend: 0,
    dragging: false,
    wallWidth: 900,
    layout: null,
  };

  let measuredTextHeights = new Map();
  let lastMeasureKey = "";
  let cardDomMap = new Map();
  let dropTimers = [];

  function syncColButtonsForViewport() {
    const compact = isCompactView();
    const opts = compact ? [1, 2, 3, 4] : [2, 3, 4, 6];
    const existing = $$("button", colsBtnsWrap).map((b) => Number(b.dataset.cols));
    if (existing.join(",") !== opts.join(",")) {
      colsBtnsWrap.innerHTML = opts
        .map(
          (n) =>
            `<button type="button" class="seg-btn" data-cols="${n}" aria-pressed="${state.cols === n}">${n}列</button>`
        )
        .join("");
      if (!opts.includes(state.cols)) {
        state.cols = compact ? 3 : 6;
      }
      bindColBtns();
    }
    $$("button", colsBtnsWrap).forEach((b) => {
      const on = Number(b.dataset.cols) === state.cols;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 横屏手机时把诊断条挪到左栏底部，让右侧瀑布墙通高舒展
    if (isLandscapePhone()) {
      if (footerBand.parentElement !== mobileAnchor) mobileAnchor.appendChild(footerBand);
    } else if (footerBand.parentElement !== wallStage) {
      wallStage.appendChild(footerBand);
    }
  }

  function createCardElement(card) {
    const el = document.createElement("article");
    el.className = `m-card tone-${card.tone} kind-${card.kind} art-${card.artPos}`;
    el.dataset.id = card.id;

    const headHtml =
      card.kind === "quote"
        ? `<div class="m-card-head"><div class="m-head-left">${CARD_ICONS.quote}</div><span class="m-order">#${String(card.order).padStart(2, "0")}</span></div>`
        : `<div class="m-card-head">
            <div class="m-head-left">${CARD_ICONS[card.icon] || ""}<h3 class="m-title">${card.title}</h3></div>
            <span class="m-order">#${String(card.order).padStart(2, "0")}</span>
          </div>`;

    const copyHtml = `<div class="m-copy">
      ${headHtml}
      <p class="m-body">${card.body}</p>
      ${card.kind === "quote" ? `<div class="m-quote-rule" aria-hidden="true"></div>` : ""}
      ${card.tags ? `<p class="m-tags">${card.tags}</p>` : ""}
    </div>`;

    const mediaHtml = card.art
      ? `<div class="m-media">
          ${cardArtSvg(card.art)}
          <span class="m-ratio-pill" aria-hidden="true"></span>
          <span class="m-long-badge" hidden>长图</span>
          <div class="m-pending-box" hidden>加载中…</div>
        </div>`
      : "";

    el.innerHTML = copyHtml + mediaHtml;
    cardsEl.appendChild(el);
    cardDomMap.set(card.id, {
      el,
      copy: $(".m-copy", el),
      media: $(".m-media", el),
      art: $(".c-art", el),
      ratioPill: $(".m-ratio-pill", el),
      longBadge: $(".m-long-badge", el),
      pendingBox: $(".m-pending-box", el),
    });
    return cardDomMap.get(card.id);
  }

  function ensureCardDom() {
    const activeIds = new Set(state.cards.map((c) => c.id));
    for (const [id, refs] of cardDomMap.entries()) {
      if (!activeIds.has(id)) {
        refs.el.remove();
        cardDomMap.delete(id);
      }
    }
    for (const card of state.cards) {
      if (!cardDomMap.has(card.id)) createCardElement(card);
    }
  }

  function measureRealCopyHeights(colW) {
    const key = `${Math.round(colW)}-${state.cards.length}`;
    if (key === lastMeasureKey) return;
    lastMeasureKey = key;
    const cramped = colW < 156;
    for (const card of state.cards) {
      const refs = cardDomMap.get(card.id);
      if (!refs) continue;
      refs.el.style.width = `${colW}px`;
      refs.el.classList.toggle("is-cramped", cramped);
    }
    for (const card of state.cards) {
      const refs = cardDomMap.get(card.id);
      if (!refs) continue;
      measuredTextHeights.set(card.id, Math.ceil(refs.copy.offsetHeight));
    }
  }

  function computeCurrentLayout() {
    const compact = isCompactView();
    const gap = compact ? 8 : 14;
    const wallW = Math.max(240, wallWrap.clientWidth || 860);
    state.wallWidth = wallW;
    const colW = (wallW - gap * (state.cols - 1)) / state.cols;

    ensureCardDom();
    if (!state.dragging) measureRealCopyHeights(colW);

    const layout = computeWaterfall({
      wallWidth: wallW,
      cols: state.cols,
      gap,
      packing: state.packing,
      maxRatio: state.maxRatio,
      cards: state.cards,
      measuredTextHeights,
      pendingIds: state.pendingIds,
      reserveRatio: state.reserveRatio,
      isCompact: compact,
      lastShiftPx: state.lastShiftPx,
      colJumpsOnAppend: state.colJumpsOnAppend,
      appendedCount: state.extraCursor,
    });

    state.layout = layout;
    return layout;
  }

  let latchedWallH = 0;

  function renderDom(layout) {
    const cramped = layout.colW < 156;
    const neededH = Math.ceil(layout.totalHeight + 22);
    // 拖动时只扩不缩，避免 60fps 反复引起整页下方八节全文档回流
    const targetWallH = state.dragging ? Math.max(latchedWallH, neededH) : neededH;
    if (targetWallH !== latchedWallH) {
      latchedWallH = targetWallH;
      cardsEl.style.height = `${targetWallH}px`;
    }

    for (const it of layout.items) {
      const refs = cardDomMap.get(it.card.id);
      if (!refs) continue;
      refs.el.classList.toggle("is-dragging-fast", state.dragging);
      if (!state.dragging) {
        refs.el.classList.toggle("is-cramped", cramped);
        refs.el.classList.toggle("is-shifted", state.shiftCardId === it.card.id);
        refs.el.style.width = `${it.w}px`;
      }
      refs.el.style.transform = `translate3d(${Math.round(it.x)}px, ${Math.round(it.y)}px, 0)`;

      if (refs.media) {
        const mh = Math.max(0, Math.round(it.mediaH));
        refs.media.style.height = `${mh}px`;
        if (refs.art && !state.dragging) {
          // 固定 SVG 原始高宽比尺寸，拖动限高只裁切外框，避免每帧 CPU 重光栅化 SVG
          const naturalH = Math.max(mh, Math.round(it.w * it.card.naturalRatio));
          refs.art.style.height = `${naturalH}px`;
        }
        if (refs.longBadge) refs.longBadge.hidden = !it.clipped || mh < 44;
        if (refs.ratioPill) {
          refs.ratioPill.hidden = cramped || mh < 48;
          if (!refs.ratioPill.hidden) {
            refs.ratioPill.textContent = it.clipped
              ? `${it.card.naturalRatio.toFixed(1)}→${it.effectiveRatio.toFixed(2)}×`
              : `${it.effectiveRatio.toFixed(2)}×`;
          }
        }
        if (refs.pendingBox) {
          const showSkeleton = state.pendingIds.has(it.card.id) && state.reserveRatio;
          refs.pendingBox.hidden = !showSkeleton;
          if (showSkeleton) refs.pendingBox.textContent = `aspect-ratio 占位`;
        }
      }
    }

    // 更新闸轨 UI
    const ratioPct = ((state.maxRatio - RATIO_RANGE.min) / (RATIO_RANGE.max - RATIO_RANGE.min)) * 100;
    thumb.style.left = `${clamp(ratioPct, 2, 98)}%`;
    const inSweet = state.maxRatio >= SWEET_RATIO.min && state.maxRatio <= SWEET_RATIO.max;
    rail.classList.toggle("in-sweet", inSweet);
    rail.setAttribute("aria-valuenow", state.maxRatio.toFixed(2));
    const ratioDesc =
      state.maxRatio < SWEET_RATIO.min
        ? `${state.maxRatio.toFixed(2)}× · 压扁齐平`
        : state.maxRatio > SWEET_RATIO.max
        ? `${state.maxRatio.toFixed(2)}× · 放任长图`
        : `${state.maxRatio.toFixed(2)}× · 错落甜区`;
    ratioOut.textContent = ratioDesc;
    rail.setAttribute("aria-valuetext", ratioDesc);

    if (!state.dragging) {
      // 更新按钮状态（拖动限高时这些按钮不会变，跳过 DOM 写入）
      $$("[data-pack]").forEach((b) => {
        const on = b.dataset.pack === state.packing;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      $$("button", colsBtnsWrap).forEach((b) => {
        const on = Number(b.dataset.cols) === state.cols;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      btnReserve.classList.toggle("is-active", state.reserveRatio);
      btnReserve.setAttribute("aria-pressed", String(state.reserveRatio));
      btnReserve.textContent = state.reserveRatio ? "已预写宽高比 ✓" : "无比例占位";
      btnDrop.disabled = state.extraCursor >= EXTRA_CARDS.length;
      btnDrop.textContent =
        state.extraCursor >= EXTRA_CARDS.length
          ? `已投满 (${state.cards.length}张)`
          : `+ 投放新卡 (${state.cards.length}/${BASE_CARDS.length + EXTRA_CARDS.length})`;
    }

    // 更新印章、诊断条与四柱实检
    $("#score-num").textContent = `${layout.passedCount}/4`;
    $("#score-sub").textContent = layout.passedCount === 4 ? "瀑布流成立" : layout.passedCount === 0 ? "翻车态" : "调校中";
    $("#score-seal").classList.toggle("is-ok", layout.passedCount === 4);

    const vBar = $("#verdict-bar");
    vBar.dataset.state = layout.severity;
    $("#verdict-badge").textContent = layout.badge;
    $("#verdict-title").textContent = layout.headline;
    $("#verdict-detail").textContent = layout.detail;
    $("#m-colw").textContent = `${Math.round(layout.colW)}px`;
    $("#m-void").textContent = `${layout.voidPct}%`;
    $("#m-tail").textContent = `${layout.tailGap}px`;
    $("#m-shift").textContent = state.lastShiftPx > 0 ? `+${state.lastShiftPx}px` : "0px";

    const tStatus = $("#tuner-status");
    if (tStatus) {
      tStatus.dataset.state = layout.severity;
      $("#ts-badge").textContent = `${layout.passedCount}/4 · ${layout.badge}`;
      $("#ts-msg").textContent = layout.headline;
      $("#ts-nums").textContent = `单卡 ${Math.round(layout.colW)}px · 空洞 ${layout.voidPct}% · 尾差 ${layout.tailGap}px`;
    }

    for (const k of ["stagger", "browse", "flexible", "rich"]) {
      const info = layout.checks[k];
      const li = $(`.pillar-item[data-key="${k}"]`);
      const chip = $(`#st-${k}`);
      if (li) li.classList.toggle("is-ok", info.ok);
      if (chip) chip.textContent = info.state;
    }
  }

  function drawOverlay(layout, pulseT = 0) {
    if (!layout) return;
    const w = Math.ceil(state.wallWidth);
    const h = Math.max(latchedWallH, Math.ceil(layout.totalHeight + 22));
    const dpr = Math.min(pixelRatio(2), 1.5);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!state.xray) return;

    // 1. 等高行锁模式：画出所有行底空洞斜线与水平停眼线
    if (state.packing === "grid") {
      ctx.save();
      for (const r of layout.voidRects) {
        ctx.fillStyle = "rgba(206, 93, 43, 0.14)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "rgba(206, 93, 43, 0.52)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.setLineDash([]);
        if (r.h >= 24 && r.w >= 72) {
          ctx.fillStyle = "#9E3D13";
          ctx.font = "600 11px 'DM Mono', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`空洞 ${Math.round(r.waste)}px`, r.x + r.w / 2, r.y + r.h / 2 + 4);
        }
      }
      ctx.strokeStyle = "rgba(158, 61, 19, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 5]);
      for (const by of layout.rowBaselines) {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(w, by);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. 纵列硬分模式：画出 1→2→3 竖直坠落的箭头，揭穿顺序错乱
    if (state.packing === "columns") {
      ctx.save();
      ctx.strokeStyle = "rgba(206, 93, 43, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      layout.items.forEach((it, idx) => {
        const cx = it.x + it.w * 0.5;
        const cy = it.y + 22;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      layout.items.forEach((it) => {
        ctx.fillStyle = "#CE5D2B";
        ctx.beginPath();
        ctx.arc(it.x + it.w * 0.5, it.y + 22, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 3. 最短列补位模式：标出各列底端水位线与「最短列落点」
    if (state.packing === "masonry") {
      ctx.save();
      const gap = layout.gap;
      for (let c = 0; c < layout.cols; c++) {
        const x0 = c * (layout.colW + gap);
        const y = layout.colHeights[c] + 5;
        const isShortest = c === layout.shortestCol;
        ctx.strokeStyle = isShortest ? "#CE5D2B" : "rgba(69, 68, 39, 0.65)";
        ctx.lineWidth = isShortest ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(x0 + 4, y);
        ctx.lineTo(x0 + layout.colW - 4, y);
        ctx.stroke();

        if (isShortest && layout.colW >= 80) {
          const bounce = reducedMotion.matches ? 0 : Math.sin(pulseT * 4) * 2;
          ctx.fillStyle = "#CE5D2B";
          ctx.font = "700 11px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`▲ 最短列 (${Math.round(layout.colHeights[c])}px)`, x0 + layout.colW / 2, y + 14 + bounce);
        }
      }
      ctx.restore();
    }

    // 4. 若发生无占位 CLS 跳动，标出冲击位移尺
    if (state.lastShiftPx > 0 && state.shiftCardId) {
      const target = layout.items.find((it) => it.card.id === state.shiftCardId);
      if (target) {
        ctx.save();
        ctx.fillStyle = "rgba(206, 93, 43, 0.92)";
        const bx = clamp(target.x + 8, 8, Math.max(8, w - 126));
        const by = Math.max(8, target.y + target.h - 30);
        ctx.fillRect(bx, by, 118, 22);
        ctx.fillStyle = "#F9EDDA";
        ctx.font = "700 11px 'DM Mono', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`CLS +${state.lastShiftPx}px`, bx + 8, by + 15);
        ctx.restore();
      }
    }
  }

  function updateAll() {
    syncColButtonsForViewport();
    const layout = computeCurrentLayout();
    renderDom(layout);
    drawOverlay(layout, 0);
  }

  // 监听开场动态水位脉冲（仅最短列模式且未在拖动时才轻缓刷新，平时零多余重绘）
  const overlayLoop = loop(wallWrap, (t, _dt, { still }) => {
    if (!state.layout || state.dragging) return;
    if (state.packing === "masonry" && state.xray) drawOverlay(state.layout, still ? 0 : t);
  });

  // 排布算法切换
  $$("[data-pack]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.packing = btn.dataset.pack;
      state.colJumpsOnAppend = 0;
      updateAll();
    });
  });

  // 列数切换
  function bindColBtns() {
    $$("button", colsBtnsWrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.cols = Number(btn.dataset.cols);
        lastMeasureKey = "";
        updateAll();
      });
    });
  }
  bindColBtns();

  // 预占位切换
  btnReserve.addEventListener("click", () => {
    state.reserveRatio = !state.reserveRatio;
    if (state.reserveRatio) {
      state.lastShiftPx = 0;
      state.shiftCardId = null;
    }
    updateAll();
  });

  // 水位透视开关
  chkXray.addEventListener("change", () => {
    state.xray = chkXray.checked;
    if (state.layout) drawOverlay(state.layout, 0);
  });

  // 异步投放新卡（模拟弱网图片延迟 380ms 解码）
  btnDrop.addEventListener("click", () => {
    if (state.extraCursor >= EXTRA_CARDS.length) return;
    const prevCols = new Map((state.layout?.items || []).map((it) => [it.card.id, it.col]));
    const nextCard = EXTRA_CARDS[state.extraCursor++];
    state.cards.push(nextCard);
    state.pendingIds.add(nextCard.id);
    lastMeasureKey = "";

    const layoutBefore = computeCurrentLayout();
    // 统计旧卡跨列跳动（CSS Columns 模式会立刻暴露跳列！）
    let jumps = 0;
    for (const it of layoutBefore.items) {
      if (prevCols.has(it.card.id) && prevCols.get(it.card.id) !== it.col) jumps++;
    }
    state.colJumpsOnAppend = jumps;
    renderDom(layoutBefore);
    drawOverlay(layoutBefore, 0);

    const beforeItem = layoutBefore.items.find((it) => it.card.id === nextCard.id);
    const delay = reducedMotion.matches ? 40 : 380;
    const timer = setTimeout(() => {
      state.pendingIds.delete(nextCard.id);
      const layoutAfter = computeCurrentLayout();
      const afterItem = layoutAfter.items.find((it) => it.card.id === nextCard.id);
      if (!state.reserveRatio && beforeItem && afterItem && afterItem.h > beforeItem.h + 4) {
        state.lastShiftPx = Math.round(afterItem.h - beforeItem.h);
        state.shiftCardId = nextCard.id;
        // 再次算一遍带 lastShiftPx 的诊断
        const finalLayout = computeCurrentLayout();
        renderDom(finalLayout);
        drawOverlay(finalLayout, 0);
      } else {
        state.lastShiftPx = 0;
        state.shiftCardId = null;
        renderDom(layoutAfter);
        drawOverlay(layoutAfter, 0);
      }
    }, delay);
    dropTimers.push(timer);
  });

  // 复原错版
  btnReset.addEventListener("click", () => {
    dropTimers.forEach(clearTimeout);
    dropTimers = [];
    state.packing = "grid";
    state.cols = initialCols();
    state.maxRatio = 3.0;
    state.reserveRatio = false;
    state.cards = BASE_CARDS.slice();
    state.extraCursor = 0;
    state.pendingIds.clear();
    state.lastShiftPx = 0;
    state.shiftCardId = null;
    state.colJumpsOnAppend = 0;
    lastMeasureKey = "";
    updateAll();
  });

  // 高宽比限高闸轨：支持 Pointer + Touch + 键盘（rAF 合并避免触屏双触发，保证 60fps）
  let dragRaf = 0;
  let pendingClientX = null;
  let railRect = null;

  function applyRatioFromClientX(clientX) {
    const r = railRect || rail.getBoundingClientRect();
    const u = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
    const next = Math.round((RATIO_RANGE.min + u * (RATIO_RANGE.max - RATIO_RANGE.min)) * 100) / 100;
    if (next === state.maxRatio) return;
    state.maxRatio = next;
    const layout = computeCurrentLayout();
    renderDom(layout);
    drawOverlay(layout, 0);
  }

  function scheduleDrag(clientX) {
    pendingClientX = clientX;
    if (dragRaf) return;
    dragRaf = requestAnimationFrame(() => {
      dragRaf = 0;
      if (pendingClientX != null) {
        const cx = pendingClientX;
        pendingClientX = null;
        applyRatioFromClientX(cx);
      }
    });
  }

  rail.addEventListener("pointerdown", (e) => {
    state.dragging = true;
    railRect = rail.getBoundingClientRect();
    try { rail.setPointerCapture(e.pointerId); } catch {}
    applyRatioFromClientX(e.clientX);
  });
  rail.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    scheduleDrag(e.clientX);
  });
  const endDrag = () => {
    if (!state.dragging) return;
    state.dragging = false;
    railRect = null;
    if (dragRaf) {
      cancelAnimationFrame(dragRaf);
      dragRaf = 0;
    }
    if (pendingClientX != null) {
      const cx = pendingClientX;
      pendingClientX = null;
      applyRatioFromClientX(cx);
    }
    if (state.layout) {
      renderDom(state.layout);
      drawOverlay(state.layout, 0);
    }
  };
  rail.addEventListener("pointerup", endDrag);
  rail.addEventListener("pointercancel", endDrag);

  // 兼容 CDP 直接派发的纯 Touch 事件（rAF 合并，不会与 pointermove 重复绘制）
  rail.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      state.dragging = true;
      railRect = rail.getBoundingClientRect();
      scheduleDrag(e.touches[0].clientX);
    },
    { passive: true }
  );
  rail.addEventListener(
    "touchmove",
    (e) => {
      if (!state.dragging || !e.touches.length) return;
      scheduleDrag(e.touches[0].clientX);
    },
    { passive: true }
  );
  rail.addEventListener("touchend", endDrag, { passive: true });

  rail.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.15 : 0.05;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.maxRatio = clamp(Math.round((state.maxRatio - step) * 100) / 100, RATIO_RANGE.min, RATIO_RANGE.max);
      updateAll();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.maxRatio = clamp(Math.round((state.maxRatio + step) * 100) / 100, RATIO_RANGE.min, RATIO_RANGE.max);
      updateAll();
    }
  });

  // ResizeObserver 响应窗口尺寸变化
  let resizeRaf = 0;
  new ResizeObserver(() => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      lastMeasureKey = "";
      updateAll();
    });
  }).observe(wallWrap);

  updateAll();
  overlayLoop.draw();
}

// ==================== 3. Section 01：单步落砖模拟器 ====================
function initStepLab() {
  const arena = $("#step-arena");
  const cap = $("#step-caption");
  const btnNext = $("#step-next");
  const btnAll = $("#step-all");
  const btnClear = $("#step-clear");
  if (!arena) return;

  let count = 4;
  let strategy = "shortest";

  function render() {
    const res = simulateStepPacking(count, strategy, 4, 8);
    arena.innerHTML = "";
    for (let c = 0; c < 4; c++) {
      const colEl = document.createElement("div");
      colEl.className = "step-col" + (count < 8 && c === res.nextCol ? " is-target" : "");
      colEl.innerHTML = `<div class="step-col-head"><span>列 ${c + 1}</span><span>${res.heights[c]}px</span></div>`;
      res.placed
        .filter((b) => b.col === c)
        .forEach((b) => {
          const brick = document.createElement("div");
          brick.className = `step-brick tone-${b.tone}`;
          brick.style.height = `${Math.round(b.h * 0.62)}px`;
          brick.innerHTML = `<span>#${b.id} ${b.name}</span><small>${b.h}px</small>`;
          colEl.appendChild(brick);
        });
      arena.appendChild(colEl);
    }

    btnNext.disabled = count >= 8;
    const modeName = strategy === "shortest" ? "最短列补位" : "轮流发牌 (i%4)";
    cap.textContent =
      count === 0
        ? `当前策略「${modeName}」：点「投下一张」观察每块卡片落进哪一列。`
        : count < 8
        ? `「${modeName}」已投 ${count}/8 张 · 当前列尾落差 ${res.tailDiff}px · 下一张将落入第 ${res.nextCol + 1} 列。`
        : `「${modeName}」8 张全部落位 · 最终列尾落差 ${res.tailDiff}px${strategy === "shortest" ? "（明显更均衡）" : "（高块扎堆把列尾拉开了）"}。`;
  }

  $$("[data-step-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      strategy = btn.dataset.stepMode;
      $$("[data-step-mode]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });
  btnNext.addEventListener("click", () => {
    if (count < 8) { count++; render(); }
  });
  btnAll.addEventListener("click", () => { count = 8; render(); });
  btnClear.addEventListener("click", () => { count = 0; render(); });
  render();
}

// ==================== 4. Section 02：三代实现引擎 X 光对比 ====================
function initEngineLab() {
  const board = $("#eng-board");
  const codeEl = $("#eng-code");
  const noteEl = $("#eng-note");
  const btnAppend = $("#eng-append");
  if (!board) return;

  const tiles = [
    { id: 1, h: 66, tone: "#FBF4E7", fg: "#16120D" },
    { id: 2, h: 48, tone: "#CE5D2B", fg: "#F9EDDA" },
    { id: 3, h: 58, tone: "#6B6942", fg: "#F9EDDA" },
    { id: 4, h: 74, tone: "#2C2113", fg: "#F9EDDA" },
    { id: 5, h: 50, tone: "#FBF4E7", fg: "#16120D" },
    { id: 6, h: 62, tone: "#6B6942", fg: "#F9EDDA" },
    { id: 7, h: 46, tone: "#CE5D2B", fg: "#F9EDDA" },
    { id: 8, h: 56, tone: "#FBF4E7", fg: "#16120D" },
    { id: 9, h: 58, tone: "#2C2113", fg: "#F9EDDA" },
  ];

  const META = {
    columns: {
      code: `.wall {\n  column-count: 3;\n  column-gap: 12px;\n}\n.card { break-inside: avoid; }`,
      note: "零脚本即可排出错落外观，但编号 01→02→03 先竖向填满左列。点「追加 #09」看：原本在列尾的旧卡会被整体甩去下一列。",
    },
    js: {
      code: `// 监听宽度与图片加载，按最矮列算 translate\nconst col = indexOfMin(colHeights);\ncard.style.transform = \`translate(\${x}px, \${y}px)\`;`,
      note: "David DeSandro 2009 年开启的经典思路：阅读顺序从左到右，追加 #09 只落进当前最矮列，旧卡纹丝不动；代价是需要 JS 测量与维护坐标。",
    },
    lanes: {
      code: `.wall {\n  display: grid-lanes;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}`,
      note: "W3C CSS Grid Level 3 新方向：浏览器原生按最短泳道落位，兼顾左右逻辑顺序、零 JS 计算与追加不跳列（目前正随浏览器引擎推进普及）。",
    },
  };

  let eng = "columns";
  let appended = false;
  const domMap = new Map();

  function calcPos(count, mode) {
    const w = Math.max(220, board.clientWidth - 20);
    const cols = 3;
    const gap = 8;
    const colW = (w - gap * (cols - 1)) / cols;
    const heights = [0, 0, 0];
    const out = [];
    const list = tiles.slice(0, count);

    if (mode === "columns") {
      const perCol = Math.ceil(list.length / cols);
      list.forEach((t, idx) => {
        const c = Math.min(cols - 1, Math.floor(idx / perCol));
        const y = heights[c] === 0 ? 0 : heights[c] + gap;
        out.push({ ...t, col: c, x: 10 + c * (colW + gap), y: 10 + y, w: colW });
        heights[c] = y + t.h;
      });
    } else {
      list.forEach((t) => {
        let best = 0;
        for (let c = 1; c < cols; c++) if (heights[c] < heights[best]) best = c;
        const y = heights[best] === 0 ? 0 : heights[best] + gap;
        out.push({ ...t, col: best, x: 10 + best * (colW + gap), y: 10 + y, w: colW });
        heights[best] = y + t.h;
      });
    }
    return { items: out, totalH: Math.max(...heights) + 22 };
  }

  function render() {
    const count = appended ? 9 : 8;
    const base8 = calcPos(8, eng);
    const prevCol = new Map(base8.items.map((i) => [i.id, i.col]));
    const cur = calcPos(count, eng);

    board.style.height = `${cur.totalH}px`;
    const activeIds = new Set(cur.items.map((i) => i.id));
    for (const [id, el] of domMap.entries()) {
      if (!activeIds.has(id)) { el.remove(); domMap.delete(id); }
    }

    let jumped = 0;
    for (const it of cur.items) {
      let el = domMap.get(it.id);
      if (!el) {
        el = document.createElement("div");
        el.className = "eng-tile";
        board.appendChild(el);
        domMap.set(it.id, el);
      }
      const didJump = appended && it.id <= 8 && prevCol.get(it.id) !== it.col;
      if (didJump) jumped++;
      el.classList.toggle("is-jumped", didJump);
      el.style.width = `${it.w}px`;
      el.style.height = `${it.h}px`;
      el.style.background = it.tone;
      el.style.color = it.fg;
      el.style.transform = `translate3d(${Math.round(it.x - 10)}px, ${Math.round(it.y - 10)}px, 0)`;
      el.innerHTML = `<span>#${String(it.id).padStart(2, "0")}</span><span>${didJump ? "跳列!" : `C${it.col + 1}`}</span>`;
    }

    codeEl.textContent = META[eng].code;
    noteEl.textContent =
      appended && eng === "columns"
        ? `已追加 #09：注意红框标出的 ${jumped} 张旧卡被硬生生挤进了别的列，正在看的内容瞬间丢失位置。`
        : appended
        ? `已追加 #09：新卡直接落进当前最矮列，前 8 张旧卡坐标 0 变动。`
        : META[eng].note;

    btnAppend.textContent = appended ? "收回 #09" : "+ 追加 #09";
  }

  $$("[data-eng]").forEach((btn) => {
    btn.addEventListener("click", () => {
      eng = btn.dataset.eng;
      $$("[data-eng]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      render();
    });
  });

  btnAppend.addEventListener("click", () => {
    appended = !appended;
    render();
  });

  new ResizeObserver(render).observe(board);
  render();
}

// ==================== 5. Section 03：双屏对比帘 ====================
function initSplitLab() {
  const stage = $("#split-stage");
  const bad = $("#split-bad");
  const divider = $("#split-divider");
  const range = $("#split-range");
  const pctEl = $("#split-pct");
  if (!stage) return;

  function apply(val) {
    const p = clamp(Number(val), 8, 92);
    bad.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    divider.style.left = `${p}%`;
    range.value = String(p);
    pctEl.textContent = `${Math.round(p)}% / ${Math.round(100 - p)}%`;
  }

  range.addEventListener("input", () => apply(range.value));

  let dragging = false;
  const fromClientX = (cx) => {
    const r = stage.getBoundingClientRect();
    apply(((cx - r.left) / Math.max(1, r.width)) * 100);
  };
  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { stage.setPointerCapture(e.pointerId); } catch {}
    fromClientX(e.clientX);
  });
  stage.addEventListener("pointermove", (e) => {
    if (dragging) fromClientX(e.clientX);
  });
  const stop = () => { dragging = false; };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  apply(38);
}

// ==================== 6. Section 04：弱网 CLS 回放剧场 ====================
function initClsLab() {
  const mediaA = $("#cls-media-a");
  const mediaB = $("#cls-media-b");
  const target = $("#cls-target");
  const finger = $("#cls-finger");
  const scoreEl = $("#cls-score");
  const gradeEl = $("#cls-grade");
  const shiftEl = $("#cls-shift");
  const hitEl = $("#cls-hit");
  const explainEl = $("#cls-explain");
  const btnPlay = $("#cls-play");
  if (!mediaA) return;

  let mode = "naive";
  let timers = [];

  function resetVisual() {
    timers.forEach(clearTimeout);
    timers = [];
    mediaA.classList.remove("is-loaded");
    mediaB.classList.remove("is-loaded");
    finger.classList.remove("is-show", "is-hit");
    if (mode === "reserved") {
      mediaA.style.height = "116px";
      mediaB.style.height = "84px";
      mediaA.textContent = "aspect-ratio: 4/3 已占位";
      mediaB.textContent = "aspect-ratio: 16/10 已占位";
      explainEl.textContent = "容器已提前写入宽高比：点「播放加载」，看图 A 到达后目标卡坐标是否移动。";
    } else {
      mediaA.style.height = "24px";
      mediaB.style.height = "24px";
      mediaA.textContent = "无尺寸（未撑开）";
      mediaB.textContent = "无尺寸（未撑开）";
      explainEl.textContent = "当前关闭了宽高比占位：点击「播放加载」，观察图 A 解码瞬间如何把目标卡踹离手指落点。";
    }
    scoreEl.textContent = "0.000";
    gradeEl.textContent = "待播放";
    gradeEl.classList.remove("is-good");
    shiftEl.textContent = "0 px";
    hitEl.textContent = "未触发点击";
    hitEl.classList.remove("is-good");
  }

  function play() {
    resetVisual();
    const vp = $("#cls-viewport");
    const vpH = Math.max(240, vp.clientHeight);
    const targetBeforeY = target.offsetTop;

    // 手指瞄准加载前目标卡的中心
    finger.style.top = `${targetBeforeY + 26}px`;
    const fast = reducedMotion.matches ? 0.15 : 1;

    timers.push(
      setTimeout(() => {
        mediaB.style.height = "84px";
        mediaB.classList.add("is-loaded");
        mediaB.textContent = "图 B 解码完成";
      }, Math.round(280 * fast))
    );

    timers.push(
      setTimeout(() => {
        mediaA.style.height = "116px";
        mediaA.classList.add("is-loaded");
        mediaA.textContent = "图 A 解码完成";
      }, Math.round(620 * fast))
    );

    timers.push(
      setTimeout(() => {
        const targetAfterY = target.offsetTop;
        const delta = Math.max(0, Math.round(targetAfterY - targetBeforeY));
        // 按 W3C Layout Instability 公式估算：impactFraction * distanceFraction
        const distFrac = delta / vpH;
        const impactFrac = delta > 0 ? Math.min(1, (delta + target.offsetHeight) / vpH) : 0;
        const cls = impactFrac * distFrac;

        finger.classList.add("is-show");
        finger.classList.toggle("is-hit", delta === 0);

        scoreEl.textContent = cls.toFixed(3);
        shiftEl.textContent = `${delta} px`;
        if (delta > 0) {
          gradeEl.textContent = cls > 0.1 ? "超标 (>0.1)" : "轻度跳动";
          gradeEl.classList.remove("is-good");
          hitEl.textContent = "误触到图 A！";
          hitEl.classList.remove("is-good");
          explainEl.textContent = `图 A 解码把目标卡向下顶偏了 ${delta}px（估算 CLS ${cls.toFixed(3)}），原本落在「收藏」上的手指点进了上方刚展开的图片里。`;
        } else {
          gradeEl.textContent = "优秀 (≤0.1)";
          gradeEl.classList.add("is-good");
          hitEl.textContent = "精准命中收藏 ✓";
          hitEl.classList.add("is-good");
          explainEl.textContent = "因为提前预留了 aspect-ratio 占位高度，两张图陆续解码后目标卡移动 0px，估算 CLS = 0.000，点击零误触。";
        }
      }, Math.round(920 * fast))
    );
  }

  $$("[data-cls-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.clsMode;
      $$("[data-cls-mode]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      resetVisual();
    });
  });

  btnPlay.addEventListener("click", play);
  resetVisual();
}

// ==================== 7. Section 05：屏宽与列数经验对照尺 ====================
function initScaleLab() {
  const screen = $("#scale-screen");
  const specs = $("#scale-specs");
  const btns = $$("#scale-btns button");
  if (!screen) return;

  const tones = ["#F3E2C8", "#CE5D2B", "#6B6942", "#2C2113"];
  const heights = [42, 60, 36, 52, 46, 38, 56, 34, 48, 40];

  function render(id) {
    const p = VIEWPORT_PRESETS.find((x) => x.id === id) || VIEWPORT_PRESETS[2];
    const effectiveW = Math.min(p.width, 1680);
    const colW = Math.round((effectiveW - p.pad * 2 - p.gap * (p.cols - 1)) / p.cols);

    const previewW = p.id === "phone" ? 136 : p.id === "tablet" ? 212 : p.id === "laptop" ? 290 : 350;
    const colsHtml = Array.from({ length: p.cols }, (_, c) => {
      const b1 = heights[(c * 2) % heights.length];
      const b2 = heights[(c * 2 + 3) % heights.length];
      const c1 = tones[c % tones.length];
      const c2 = tones[(c + 2) % tones.length];
      return `<div class="sc-col">
        <div class="sc-block" style="height:${b1}px;background:${c1}"></div>
        <div class="sc-block" style="height:${b2}px;background:${c2}"></div>
      </div>`;
    }).join("");

    screen.innerHTML = `<div class="sc-device" style="width:${previewW}px;grid-template-columns:repeat(${p.cols},1fr)">${colsHtml}</div>`;
    specs.innerHTML = `
      <div class="sc-nums">
        <div class="sc-stat"><span>经验列数</span><b class="mono">${p.cols} 列</b></div>
        <div class="sc-stat"><span>建议槽宽</span><b class="mono">${p.gap} px</b></div>
        <div class="sc-stat"><span>推算单卡</span><b class="mono">${colW} px</b></div>
      </div>
      <p class="sc-note">${p.note}</p>
    `;
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render(btn.dataset.vp);
    });
  });

  render("laptop");
}

// ==================== 8. Section 06：找出 #07 通知小实验 ====================
function initFindLab() {
  const board = $("#find-board");
  const resultEl = $("#find-result");
  if (!board) return;

  let mode = "masonry";
  let startTime = 0;
  let misses = 0;

  function render() {
    startTime = performance.now();
    misses = 0;
    board.innerHTML = "";

    if (mode === "list") {
      const wrap = document.createElement("div");
      wrap.className = "find-list";
      for (const item of FIND_ITEMS) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "find-item";
        b.dataset.no = item.no;
        b.innerHTML = `<span class="find-meta">#${item.no} · ${item.time}</span><span>${item.title}</span>`;
        wrap.appendChild(b);
      }
      board.appendChild(wrap);
      resultEl.textContent = "对齐时间列表：从上往下单列扫读，直接点中「#07 · 14:20」。";
    } else {
      // 最短列排入 4 列，视觉顺序左右上下交错
      const cols = [[], [], [], []];
      const hs = [0, 0, 0, 0];
      for (const item of FIND_ITEMS) {
        let best = 0;
        for (let c = 1; c < 4; c++) if (hs[c] < hs[best]) best = c;
        cols[best].push(item);
        hs[best] += item.h + 8;
      }
      const wrap = document.createElement("div");
      wrap.className = "find-masonry";
      cols.forEach((colItems) => {
        const colEl = document.createElement("div");
        colEl.className = "find-mcol";
        colItems.forEach((item) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "find-item";
          b.style.minHeight = `${Math.round(item.h * 0.72)}px`;
          b.dataset.no = item.no;
          b.innerHTML = `<span class="find-meta">#${item.no} · ${item.time}</span><span>${item.title}</span>`;
          colEl.appendChild(b);
        });
        wrap.appendChild(colEl);
      });
      board.appendChild(wrap);
      resultEl.textContent = "瀑布流错落墙：编号按最矮列穿插落位，试试点中「#07 · 14:20」。";
    }

    $$(".find-item", board).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.no === "07") {
          const sec = ((performance.now() - startTime) / 1000).toFixed(2);
          btn.classList.add("is-found");
          resultEl.textContent =
            mode === "masonry"
              ? `在瀑布流里找到 #07 用时 ${sec} 秒（误点 ${misses} 次）：因为高低参差且跨列补位，没法一眼确定 14:20 该排在 14:26 的左边还是下方。切到「对齐时间列表」再试一次。`
              : `在对齐列表里找到 #07 用时 ${sec} 秒（误点 ${misses} 次）：时间轴沿单一纵轴递减，扫读路径是一条直线。`;
        } else {
          misses++;
          btn.classList.add("is-miss");
          resultEl.textContent = `点到了 #${btn.dataset.no}，目标在 #07（14:20）——继续找。`;
        }
      });
    });
  }

  $$("[data-find-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.findMode;
      $$("[data-find-mode]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  render();
}

// ==================== 9. Section 07：小练习 ====================
function initPractice() {
  const grid = $("#quiz-grid");
  const verdict = $("#quiz-verdict");
  const titleEl = $("#qv-title");
  const bodyEl = $("#qv-body");
  if (!grid) return;

  const cards = $$(".quiz-card", grid);
  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      const info = PRACTICE_OPTIONS[choice];
      if (!info) return;
      grid.classList.add("is-answered");
      cards.forEach((c) => {
        const isMe = c === btn;
        const isCorrect = PRACTICE_OPTIONS[c.dataset.choice].correct;
        c.setAttribute("aria-pressed", String(isMe));
        c.classList.toggle("is-picked-ok", isMe && isCorrect);
        c.classList.toggle("is-picked-bad", isMe && !isCorrect);
        c.classList.toggle("is-answer-hint", !isMe && isCorrect);
      });
      verdict.classList.toggle("is-bad", !info.correct);
      titleEl.textContent = info.title;
      bodyEl.textContent = info.body;
    });
  });
}

// ==================== 10. Section 08：原海报放大拖拽灯箱 ====================
function initPosterLightbox() {
  const btn = $("#poster-btn");
  const posterImg = $("#poster");
  const lb = $("#lightbox");
  const lbImg = $("#lb-img");
  const lbStage = $("#lb-stage");
  const lbClose = $("#lb-close");
  if (!btn || !lb) return;

  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }

  function open() {
    lbImg.src = posterImg.src;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    lbClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }

  btn.addEventListener("click", open);
  lbClose.addEventListener("click", close);
  lbStage.addEventListener("click", (e) => {
    if (e.target === lbStage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const end = () => { dragging = false; };
  lbStage.addEventListener("pointerup", end);
  lbStage.addEventListener("pointercancel", end);
}

// ==================== 启动 ====================
initWaveEmblem();
initHeroWall();
initStepLab();
initEngineLab();
initSplitLab();
initClsLab();
initScaleLab();
initFindLab();
initPractice();
initPosterLightbox();
