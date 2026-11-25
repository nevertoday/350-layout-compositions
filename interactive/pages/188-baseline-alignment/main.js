// 188 · 基线对齐 — 互动逻辑主控（main.js）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  HERO_BLOCKS,
  QUIZ_ITEMS,
  QUIZ_OPTIONS,
  SNAP_EM,
  SLIDER_MIN_EM,
  SLIDER_MAX_EM,
  measureFontSystem,
  computeBlockGeometry,
  computePresetOffsets,
  computeHeroLayout,
  evaluateHeroState,
  evaluateQuizOption,
  formatDelta,
} from "./model.js";

const COLORS = {
  paper: "#FBF9F5",
  ice: "#EEF2F9",
  embox: "#DFE6F1",
  ink: "#08090A",
  muted: "#4A5362",
  guide: "#C6CBD4",
  blue: "#0448D3",
  red: "#FC3414",
  redText: "#C9240C",
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

async function boot() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  const metrics = measureFontSystem();

  // 将唯一实测的 ideoDropPct 同步写进 01 节与 03 节，保证全页同源
  const pctStr = `${metrics.ideoDropPct.toFixed(1)}%`;
  const elNoteIdeo = document.getElementById("note-ideo-pct");
  const elCjkMeas = document.getElementById("cjk-meas-pct");
  if (elNoteIdeo) elNoteIdeo.textContent = pctStr;
  if (elCjkMeas) elCjkMeas.textContent = pctStr;

  initHero(metrics);
  initAnatomy(metrics);
  initHistory();
  initCjkLab(metrics);
  initGridLab();
  initCssLab();
  initDontCards();
  initQuiz(metrics);
  initLightbox();
}

/* ==================== HERO：五栏通栏基线校对台 ==================== */
function initHero(metrics) {
  const stageWrap = document.getElementById("hero-stage-wrap");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");
  const guidesEl = document.getElementById("hero-guides");
  const slider = document.getElementById("hero-slider");
  const vernierTrack = document.getElementById("vernier-track");
  const vernierFill = document.getElementById("vernier-fill");
  const vernierThumb = document.getElementById("vernier-thumb");
  const vernierReadout = document.getElementById("vernier-readout");
  const diagBadge = document.getElementById("diag-badge");
  const diagCount = document.getElementById("diag-count");
  const diagMax = document.getElementById("diag-max");
  const diagHeadline = document.getElementById("diag-headline");
  const diagWhy = document.getElementById("diag-why");
  const diagPerBlock = document.getElementById("diag-per-block");
  const btnXray = document.getElementById("btn-box-xray");
  const btnReset = document.getElementById("btn-hero-reset");

  const handleEls = {
    ag: document.getElementById("handle-ag"),
    body: document.getElementById("handle-body"),
    dual: document.getElementById("handle-dual"),
  };
  const pickBtns = [...document.querySelectorAll(".pick-chip")];
  const presetBtns = [...document.querySelectorAll("[data-preset]")];

  let layout = computeHeroLayout(Math.max(320, stageWrap.clientWidth), Math.max(200, stageWrap.clientHeight));

  // 状态：只存各块相对真基线的 em 偏移，初态严格采用实测「框体居中」
  const initialOffsets = computePresetOffsets(HERO_BLOCKS, layout.sizes, "box-center", metrics);
  const state = {
    selected: "ag",
    showBoxes: true,
    activePreset: "box-center",
    target: { ag: initialOffsets.ag, body: initialOffsets.body, dual: initialOffsets.dual },
    display: { ag: initialOffsets.ag, body: initialOffsets.body, dual: initialOffsets.dual },
    introProgress: reducedMotion.matches ? 1 : 0,
    dirty: true,
  };

  function resizeHero() {
    const rect = stageWrap.getBoundingClientRect();
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(w < 520 ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const prevPreset = state.activePreset;
    layout = computeHeroLayout(w, h);
    // 仅在仍处于标准预设态时随字号重算精确预设位置，确保 390/1440 均严格对齐外框中轴/底边
    if (prevPreset) {
      const nextP = computePresetOffsets(HERO_BLOCKS, layout.sizes, prevPreset, metrics);
      for (const id of ["ag", "body", "dual"]) {
        state.target[id] = nextP[id];
        state.display[id] = nextP[id];
      }
    }

    // 同步贯穿刊头至诊断框的四条竖虚线坐标
    const guideLines = guidesEl.querySelectorAll(".guide-line");
    layout.dividers.forEach((x, i) => {
      if (guideLines[i]) guideLines[i].style.left = `${x}px`;
    });

    state.dirty = true;
    syncControlsAndDiagnosis();
    ctrl.draw();
  }

  // 预建逐块状态 DOM 节点并缓存，避免拖拽每帧 innerHTML 重建触发布局抖动
  const pbNodes = {};
  diagPerBlock.innerHTML = HERO_BLOCKS.slice(1)
    .map(
      (b) =>
        `<span class="pb-item" data-pb="${b.id}"><i class="pb-dot" aria-hidden="true"></i>${b.shortLabel} <strong class="pb-val" lang="en"></strong></span>`
    )
    .join("");
  HERO_BLOCKS.slice(1).forEach((b) => {
    const row = diagPerBlock.querySelector(`[data-pb="${b.id}"]`);
    pbNodes[b.id] = { row, val: row.querySelector(".pb-val") };
  });

  let diagDirty = true;
  let lastDiagKey = "";

  function setBlockOffset(id, rawEm, { snap = false, fromPreset = null } = {}) {
    let val = clamp(rawEm, SLIDER_MIN_EM, SLIDER_MAX_EM);
    if (snap && Math.abs(val) <= SNAP_EM) val = 0;
    const rounded = Math.round(val * 100) / 100;
    if (state.target[id] === rounded && state.activePreset === fromPreset) return;
    state.target[id] = rounded;
    if (reducedMotion.matches) state.display[id] = rounded;
    state.activePreset = fromPreset;
    state.dirty = true;
    diagDirty = true;
    if (reducedMotion.matches) {
      syncControlsAndDiagnosis();
      ctrl.draw();
    }
  }

  function applyPreset(mode) {
    const next = computePresetOffsets(HERO_BLOCKS, layout.sizes, mode, metrics);
    for (const id of ["ag", "body", "dual"]) {
      state.target[id] = next[id];
      if (reducedMotion.matches) state.display[id] = next[id];
    }
    state.activePreset = mode;
    state.dirty = true;
    diagDirty = true;
    syncControlsAndDiagnosis();
    ctrl.draw();
  }

  function selectBlock(id) {
    state.selected = id;
    pickBtns.forEach((b) => {
      const on = b.dataset.pick === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    state.dirty = true;
    diagDirty = true;
    syncControlsAndDiagnosis();
    if (reducedMotion.matches) ctrl.draw();
  }

  function syncVernierVisual() {
    const id = state.selected;
    const idx = HERO_BLOCKS.findIndex((b) => b.id === id);
    const val = state.target[id];
    const pct = ((val - SLIDER_MIN_EM) / (SLIDER_MAX_EM - SLIDER_MIN_EM)) * 100;
    slider.value = String(val);
    vernierThumb.style.left = `${pct}%`;
    const zeroPct = 50;
    const leftPct = Math.min(pct, zeroPct);
    const widthPct = Math.abs(pct - zeroPct);
    vernierFill.style.left = `${leftPct}%`;
    vernierFill.style.width = `${widthPct}%`;
    vernierFill.style.background = Math.abs(val) <= SNAP_EM ? COLORS.blue : COLORS.red;
    vernierReadout.textContent = formatDelta(val, layout.sizes[idx]);
  }

  function syncHandlesPosition(evalRes) {
    evalRes.items.slice(1).forEach((it) => {
      const el = handleEls[it.block.id];
      if (!el) return;
      const col = layout.cols[it.block.col];
      const topY = clamp(it.geom.boxTop - (layout.narrow ? 14 : 18), 22, layout.height - 22);
      el.style.left = `${col.cx}px`;
      el.style.top = `${topY}px`;
      el.classList.toggle("is-selected", state.selected === it.block.id);
      el.classList.toggle("is-aligned", it.aligned);
    });
  }

  function syncControlsAndDiagnosis() {
    diagDirty = false;
    const res = evaluateHeroState(state.target, layout, metrics);
    const key = `${res.tierKey}|${res.alignedCount}|${res.headline}|${res.why}`;
    if (key !== lastDiagKey) {
      lastDiagKey = key;
      diagBadge.textContent = res.badge;
      diagBadge.dataset.tier = res.tierKey;
      diagCount.textContent = `${res.alignedCount} / 3`;
      diagHeadline.textContent = res.headline;
      diagWhy.textContent = res.why;
      presetBtns.forEach((b) => {
        b.classList.toggle("is-current", b.dataset.preset === state.activePreset);
      });
    }
    diagMax.textContent = `${res.maxAbsEm.toFixed(2)} em (${Math.round(res.maxAbsPx)} px)`;

    res.items.slice(1).forEach((it) => {
      const node = pbNodes[it.block.id];
      if (!node) return;
      node.row.classList.toggle("is-ok", it.aligned);
      node.val.textContent = formatDelta(it.offsetEm, it.geom.fontSize);
    });

    syncVernierVisual();
    syncHandlesPosition(res);
  }

  // 绘制第五栏微缩原海报几何徽记（黑柱底边与钴蓝直角三角底边踩在同一条主基线上）
  function drawEmblemColumn(col, baselineY) {
    const narrow = layout.narrow;
    const h = narrow ? 54 : Math.min(132, Math.round(layout.height * 0.44));
    const w = Math.min(col.w - (narrow ? 6 : 26), Math.round(h * 0.86));
    const x0 = Math.round(col.cx - w / 2);
    const baseY = baselineY;

    const barW = Math.round(w * 0.44);
    const barH = Math.round(h * 0.68);
    const halfH = Math.round(barH / 2);
    const triX = x0 + barW;
    const triW = w - barW;
    const triH = Math.round(triW * 1.05);
    const circleR = Math.max(7, Math.round(w * 0.21));
    const circleCx = x0 + w - circleR;
    const circleCy = baseY - barH - Math.round(circleR * 0.92);

    // 红色上柱
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x0, baseY - barH, barW, halfH);
    // 黑色下柱（底边严丝合缝踩在 baselineY）
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(x0, baseY - halfH, barW, halfH);
    // 钴蓝直角三角（底边同踩 baselineY）
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.moveTo(triX, baseY);
    ctx.lineTo(triX + triW, baseY);
    ctx.lineTo(triX + triW, baseY - triH);
    ctx.closePath();
    ctx.fill();
    // 顶部钴蓝实心圆
    ctx.beginPath();
    ctx.arc(circleCx, Math.max(circleR + 6, circleCy), circleR, 0, Math.PI * 2);
    ctx.fill();

    // 底部极细锚标（仅宽屏显示，避免窄横屏撞字）
    if (layout.width >= 640) {
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.blue;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("几何共底锚", col.cx, baseY + 12);
    }
  }

  function renderHero(t, dt, { still }) {
    // 开场扫入线动画（0.55 秒）；still 时一步到位
    if (still) {
      state.introProgress = 1;
      for (const id of ["ag", "body", "dual"]) state.display[id] = state.target[id];
    } else {
      if (state.introProgress < 1) {
        state.introProgress = Math.min(1, state.introProgress + (dt || 0.016) * 2.2);
      }
      let moving = false;
      const k = 1 - Math.exp(-(dt || 0.016) * 18);
      for (const id of ["ag", "body", "dual"]) {
        const diff = state.target[id] - state.display[id];
        if (Math.abs(diff) > 0.001) {
          state.display[id] += diff * k;
          moving = true;
        } else {
          state.display[id] = state.target[id];
        }
      }
      if (!moving && state.introProgress >= 1 && !state.dirty) return;
    }
    if (diagDirty) syncControlsAndDiagnosis();
    state.dirty = false;

    const W = layout.width;
    const H = layout.height;
    const by = layout.baselineY;
    const tightLabels = W < 640;
    ctx.clearRect(0, 0, W, H);

    // 1. 顶部轻微栏标（仅宽屏 ≥ 640px）
    if (!tightLabels) {
      const colTags = ["01 · 锚定大标", "02 · 西文降部", "03 · 中号正文", "04 · 双行末基线", "05 · 几何共底"];
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      layout.cols.forEach((col, i) => {
        ctx.fillText(colTags[i], col.x + 8, 6);
      });
    }

    // 2. 四块文字实测几何
    const geoms = HERO_BLOCKS.map((b, i) => {
      const em = b.locked ? 0 : state.display[b.id];
      return {
        block: b,
        col: layout.cols[b.col],
        em,
        geom: computeBlockGeometry(b, layout.sizes[i], by, em, metrics),
      };
    });

    // 3. 淡冰蓝外框（em-box / 行框）透视层
    if (state.showBoxes) {
      geoms.forEach(({ block, col, geom }) => {
        const padX = layout.narrow ? 2 : 10;
        const bx = col.x + padX;
        const bw = col.w - padX * 2;
        const isSel = !block.locked && state.selected === block.id;
        ctx.fillStyle = isSel ? "rgba(4, 72, 211, 0.13)" : COLORS.embox;
        ctx.fillRect(bx, geom.boxTop, bw, geom.boxHeight);

        // 外框底边（下降线）细虚线标示
        ctx.save();
        ctx.strokeStyle = isSel ? COLORS.blue : "rgba(74, 83, 98, 0.45)";
        ctx.lineWidth = isSel ? 1.5 : 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(bx + 0.5, geom.boxTop + 0.5, bw - 1, geom.boxHeight - 1);
        ctx.restore();
      });
    }

    // 4. 贯穿全幅的钴蓝主基线 + 左端原海报「基线」行标
    const lineEnd = W * (0.2 + 0.8 * state.introProgress);
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, by);
    ctx.lineTo(lineEnd, by);
    ctx.stroke();

    ctx.font = `700 ${layout.narrow ? 10 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.blue;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("基线", layout.narrow ? 2 : 0, by - (layout.narrow ? 28 : 5));

    // 5. 第五栏微缩几何徽记（底边共踩主基线）
    drawEmblemColumn(layout.cols[4], by);

    // 6. 绘制四块文字（先于红虚折线，保持文字清晰锐利）
    geoms.forEach(({ block, col, geom }) => {
      ctx.font = `${block.weight} ${geom.fontSize}px ${block.family}`;
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      block.lines.forEach((line, li) => {
        ctx.fillText(line, col.cx, geom.drawYs[li]);
      });

      // 若是锚定栏（宽屏）标「0.00 em 锚」
      if (block.locked && !tightLabels) {
        ctx.font = `700 11px "Chivo", "Noto Sans SC", sans-serif`;
        ctx.fillStyle = COLORS.blue;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("0.00 em 基准锚", col.cx, by + 12);
      }
    });

    // 7. 朱红虚线实时扫读折线（串起五栏实测真基线）
    const allAligned = geoms.slice(1).every((g) => Math.abs(g.em) <= SNAP_EM);
    ctx.save();
    ctx.strokeStyle = allAligned ? COLORS.blue : COLORS.red;
    ctx.lineWidth = allAligned ? 2.5 : 2;
    ctx.setLineDash(allAligned ? [] : [6, 4]);
    ctx.beginPath();
    geoms.forEach(({ col, geom }, idx) => {
      const x1 = col.x + (layout.narrow ? 2 : 8);
      const x2 = col.right - (layout.narrow ? 2 : 8);
      if (idx === 0) ctx.moveTo(x1, geom.trueBaselineY);
      else ctx.lineTo(x1, geom.trueBaselineY);
      ctx.lineTo(x2, geom.trueBaselineY);
    });
    // 连到第五栏几何共底线
    const col5 = layout.cols[4];
    ctx.lineTo(col5.x + (layout.narrow ? 2 : 8), by);
    ctx.lineTo(col5.right - (layout.narrow ? 2 : 8), by);
    ctx.stroke();
    ctx.restore();

    // 8. 每块偏离主基线时，绘竖向落差引线 + 实时 Δy 标签（同一 em / px 口径）
    geoms.slice(1).forEach(({ block, col, em, geom }) => {
      const aligned = Math.abs(em) <= SNAP_EM;
      const dotColor = aligned ? COLORS.blue : COLORS.red;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(col.cx, geom.trueBaselineY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (!aligned) {
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(col.cx, by);
        ctx.lineTo(col.cx, geom.trueBaselineY);
        ctx.stroke();
      }

      const tagY = Math.min(H - 14, Math.max(by + 16, geom.boxBottom + 12));
      ctx.font = `700 ${tightLabels ? 10 : 11.5}px "Chivo", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = aligned ? COLORS.blue : COLORS.redText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const txt = aligned
        ? tightLabels
          ? "✓ 0px"
          : "✓ 0.00 em"
        : tightLabels
          ? `${em > 0 ? "+" : "−"}${Math.abs(Math.round(geom.deltaPx))}px`
          : formatDelta(em, geom.fontSize);
      ctx.fillText(txt, col.cx, tagY);
    });
  }

  const ctrl = loop(stageWrap, renderHero);

  // ---------- 交互绑定 ----------
  // 1. 直接在 Canvas 上抓拖（仅鼠标 / 精准命中可调字块；触屏留给 ↕ 手柄与横向游标，避免阻断竖向滚屏）
  let dragBlock = null;
  let dragStartY = 0;
  let dragStartEm = 0;

  function hitBlockAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (let i = 1; i < HERO_BLOCKS.length; i++) {
      const b = HERO_BLOCKS[i];
      const col = layout.cols[b.col];
      if (x >= col.x && x <= col.right && y >= 0 && y <= layout.height) {
        return b.id;
      }
    }
    return null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由手柄与横轨，保页面顺畅竖滚
    const id = hitBlockAt(e.clientX, e.clientY);
    if (!id) return;
    e.preventDefault();
    selectBlock(id);
    dragBlock = id;
    dragStartY = e.clientY;
    dragStartEm = state.target[id];
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragBlock) return;
    const idx = HERO_BLOCKS.findIndex((b) => b.id === dragBlock);
    const dyPx = dragStartY - e.clientY; // 向上拖为正
    const nextEm = dragStartEm + dyPx / Math.max(18, layout.sizes[idx]);
    setBlockOffset(dragBlock, nextEm, { snap: false, fromPreset: null });
  });

  const endCanvasDrag = () => {
    if (!dragBlock) return;
    const id = dragBlock;
    dragBlock = null;
    canvas.classList.remove("is-dragging");
    setBlockOffset(id, state.target[id], { snap: true, fromPreset: null });
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // 2. 三个显式 ↕ 拖柄（支持鼠标与触屏垂直拖 + 键盘方向键）
  Object.entries(handleEls).forEach(([id, el]) => {
    let hStartY = 0;
    let hStartEm = 0;
    let active = false;

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectBlock(id);
      active = true;
      hStartY = e.clientY;
      hStartEm = state.target[id];
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!active) return;
      const idx = HERO_BLOCKS.findIndex((b) => b.id === id);
      const dyPx = hStartY - e.clientY;
      setBlockOffset(id, hStartEm + dyPx / Math.max(20, layout.sizes[idx]), { snap: false, fromPreset: null });
    });
    const endH = () => {
      if (!active) return;
      active = false;
      setBlockOffset(id, state.target[id], { snap: true, fromPreset: null });
    };
    el.addEventListener("pointerup", endH);
    el.addEventListener("pointercancel", endH);

    el.addEventListener("keydown", (e) => {
      selectBlock(id);
      const step = e.shiftKey ? 0.01 : 0.05;
      const prev = state.target[id];
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = prev + step;
        setBlockOffset(id, next, { snap: Math.abs(next) < Math.abs(prev), fromPreset: null });
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = prev - step;
        setBlockOffset(id, next, { snap: Math.abs(next) < Math.abs(prev), fromPreset: null });
      }
    });
  });

  // 3. 横向垫片游标轨（同时响应原生 range input + 触控事件，确保 perf.mjs 横拖真重画）
  function updateFromClientX(clientX, snap = false) {
    const rect = vernierTrack.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const val = SLIDER_MIN_EM + ratio * (SLIDER_MAX_EM - SLIDER_MIN_EM);
    setBlockOffset(state.selected, val, { snap, fromPreset: null });
  }

  slider.addEventListener("input", () => {
    setBlockOffset(state.selected, parseFloat(slider.value), { snap: false, fromPreset: null });
  });
  slider.addEventListener("change", () => {
    setBlockOffset(state.selected, parseFloat(slider.value), { snap: true, fromPreset: null });
  });

  // 显式监听 touch 事件，确保自动化触摸拖拽（perf.mjs）与移动端单指横拖 100% 灵敏重绘
  vernierTrack.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length) {
        e.preventDefault();
        updateFromClientX(e.touches[0].clientX, false);
      }
    },
    { passive: false }
  );
  vernierTrack.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length) {
        e.preventDefault();
        updateFromClientX(e.touches[0].clientX, false);
      }
    },
    { passive: false }
  );
  vernierTrack.addEventListener("touchend", () => {
    setBlockOffset(state.selected, state.target[state.selected], { snap: true, fromPreset: null });
  });

  // 4. 画布键盘微调（靠近基线时磁吸，主动离开 0 时不粘死）
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.01 : 0.05;
    const prev = state.target[state.selected];
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = prev + step;
      setBlockOffset(state.selected, next, { snap: Math.abs(next) < Math.abs(prev), fromPreset: null });
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = prev - step;
      setBlockOffset(state.selected, next, { snap: Math.abs(next) < Math.abs(prev), fromPreset: null });
    }
  });

  pickBtns.forEach((b) => b.addEventListener("click", () => selectBlock(b.dataset.pick)));
  presetBtns.forEach((b) => b.addEventListener("click", () => applyPreset(b.dataset.preset)));

  btnXray.addEventListener("click", () => {
    state.showBoxes = !state.showBoxes;
    btnXray.classList.toggle("is-toggled", state.showBoxes);
    btnXray.setAttribute("aria-pressed", String(state.showBoxes));
    state.dirty = true;
    ctrl.draw();
  });

  btnReset.addEventListener("click", () => applyPreset("box-center"));

  new ResizeObserver(resizeHero).observe(stageWrap);
  resizeHero();
}

/* ==================== 01 单字五线解剖与光学过冲显微 ==================== */
function initAnatomy(metrics) {
  const canvas = document.getElementById("anatomy-canvas");
  const ctx = canvas.getContext("2d");
  const readout = document.getElementById("anatomy-readout");
  const glyphBtns = [...document.querySelectorAll("[data-glyph]")];
  const faceBtns = [...document.querySelectorAll("[data-face]")];
  const lineChecks = [...document.querySelectorAll("[data-line]")];

  const st = {
    glyph: "O",
    face: "chivo",
    lines: { cap: true, xheight: true, baseline: true, descent: true, loupe: true },
  };

  function draw() {
    const dpr = pixelRatio(2);
    const W = 640;
    const H = 360;
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    const isHan = st.glyph === "永";
    const fontFamily = isHan
      ? '"Noto Sans SC", sans-serif'
      : st.face === "garamond"
        ? '"EB Garamond", serif'
        : '"Chivo", sans-serif';
    const fontWeight = isHan ? 700 : st.face === "garamond" ? 600 : 900;
    const S = 180;
    const baseY = 258;
    const gx = 152;

    ctx.font = `${fontWeight} ${S}px ${fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const m = ctx.measureText(st.glyph);
    const mH = ctx.measureText("H");
    const mx = ctx.measureText("x");

    const fontAsc = m.fontBoundingBoxAscent ?? S * 0.94;
    const fontDesc = m.fontBoundingBoxDescent ?? S * 0.25;
    const inkAsc = m.actualBoundingBoxAscent ?? S * 0.7;
    const inkDesc = Math.max(0, m.actualBoundingBoxDescent ?? 0);
    const capY = baseY - (isHan ? inkAsc : mH.actualBoundingBoxAscent);
    const xhY = baseY - (isHan ? inkAsc * 0.65 : mx.actualBoundingBoxAscent);
    const boxTop = baseY - fontAsc;
    const boxBottom = baseY + fontDesc;
    const ideoY = baseY + S * metrics.ideoDropRatio;

    // 淡冰蓝 em-box 外框
    ctx.fillStyle = COLORS.embox;
    ctx.fillRect(gx - 12, boxTop, m.width + 24, boxBottom - boxTop);

    // 字符主体
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(st.glyph, gx, baseY);

    // 左侧对照平底字符 H（半透明参考）
    if (!isHan && st.glyph !== "H") {
      ctx.save();
      ctx.fillStyle = "rgba(8, 9, 10, 0.14)";
      ctx.font = `${fontWeight} ${S}px ${fontFamily}`;
      ctx.fillText("H", 26, baseY);
      ctx.restore();
    }

    const lx = 434;
    const ly = 104;
    const lw = 182;
    const lh = 128;

    const drawRule = (y, color, label, dashed = false, stopBeforeLoupe = false) => {
      const endX = st.lines.loupe && stopBeforeLoupe ? lx - 12 : W - 18;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 2;
      if (dashed) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, endX - 2, y - 4);
      ctx.restore();
    };

    if (st.lines.cap) drawRule(capY, COLORS.muted, isHan ? "汉字字面顶" : "大写高 Cap", true, true);
    if (st.lines.xheight && !isHan) drawRule(xhY, "#6B7484", "x 字高", true, true);
    if (st.lines.baseline) drawRule(baseY, COLORS.blue, isHan ? "西文字母基线 romn" : "基线 Baseline (romn)", false, false);
    if (st.lines.descent) {
      if (isHan) {
        drawRule(ideoY, COLORS.redText, `汉字方块底 ideo (−${metrics.ideoDropPct.toFixed(1)}%)`, true, false);
      } else {
        drawRule(boxBottom, COLORS.redText, "外框下降线 Descender", true, false);
      }
    }

    // 右侧底部过冲 / 降部 3.2× 放大镜
    if (st.lines.loupe) {
      ctx.save();
      ctx.fillStyle = COLORS.paper;
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 2;
      ctx.fillRect(lx, ly, lw, lh);
      ctx.strokeRect(lx, ly, lw, lh);

      ctx.beginPath();
      ctx.rect(lx + 1, ly + 1, lw - 2, lh - 2);
      ctx.clip();

      const zoom = 3.2;
      const lBaseY = ly + (st.glyph === "g" ? 42 : 76);
      const srcFocusX = gx + m.width * 0.5;
      ctx.save();
      ctx.translate(lx + lw / 2, lBaseY);
      ctx.scale(zoom, zoom);
      ctx.font = `${fontWeight} ${S}px ${fontFamily}`;
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(st.glyph, -m.width * 0.5, 0);
      ctx.restore();

      // 放大镜内基线与实际墨底线
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, lBaseY);
      ctx.lineTo(lx + lw, lBaseY);
      ctx.stroke();

      const inkLineY = lBaseY + inkDesc * zoom;
      if (inkDesc > 0.5 && inkLineY < ly + lh - 4) {
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(lx, inkLineY);
        ctx.lineTo(lx + lw, inkLineY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.blue;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("底部 3.2× 显微视窗", lx, ly - 5);
    }

    // 实时解读（读数完全来自实测）
    const faceData = st.face === "garamond" ? metrics.fonts.garamond600 : metrics.fonts.chivo900;
    const faceName = st.face === "garamond" ? "EB Garamond" : "Chivo";
    if (st.glyph === "H") {
      readout.innerHTML = `<strong>平底参照 ${faceName} 「H」：</strong>底脚精准坐死在蓝线上，外框下降线仍在下方留出约 <strong>${(faceData.fontDesc * 100).toFixed(0)}% em</strong> 的空白——这就是「框底」远低于「基线」的根源。`;
    } else if (st.glyph === "O") {
      readout.innerHTML = `<strong>光学过冲 ${faceName} 「O」：</strong>为了视觉上不比平底 H 显得矮，底弧故意探出基线约 <strong>${faceData.overshootOPct}%</strong>（相对大写高，落在 1%–3% 的字体设计常见经验区间内）。`;
    } else if (st.glyph === "o") {
      readout.innerHTML = `<strong>小写圆弧过冲 ${faceName} 「o」：</strong>小写圆底同样探出基线约 <strong>${faceData.overshootoPct}%</strong>（相对 x 字高），放大镜中红虚线清晰落在蓝线下方。`;
    } else if (st.glyph === "g") {
      readout.innerHTML = `<strong>降部垂出 ${faceName} 「g」：</strong>底圈探出基线下方实测 <strong>${(faceData.gDesc * 100).toFixed(1)}% em</strong>。若误用「字墨底对齐」把尾巴尖端硬贴蓝线，整个字母躯干就会被顶浮到半空。`;
    } else {
      readout.innerHTML = `<strong>汉字方块外框 Noto Sans SC 「永」：</strong>汉字字面底在西文基线下方约 <strong>${(metrics.hanFaceDescRatio * 100).toFixed(1)}% em</strong>，而正方形外框底（ideo 线）经当前字体 TextMetrics 实测位于西文基线下方 <strong>${metrics.ideoDropPct.toFixed(1)}%</strong>。`;
    }
  }

  glyphBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.glyph = b.dataset.glyph;
      glyphBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      draw();
    })
  );
  faceBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.face = b.dataset.face;
      faceBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      draw();
    })
  );
  lineChecks.forEach((c) =>
    c.addEventListener("change", () => {
      st.lines[c.dataset.line] = c.checked;
      draw();
    })
  );
  draw();
}

/* ==================== 02 历史演进 + 1894 活字垫纸台 ==================== */
function initHistory() {
  const eras = [
    {
      title: "1894 · Inland Type Foundry 率先统一基线",
      desc: "1894 年，Carl Schraubstadter 的三个儿子 William A.、Oswald 与 Carl Jr. 在密苏里州圣路易斯创立 Inland Type Foundry。因为是新建铸字厂、没有旧式非统一基线活字的库存包袱，他们率先将同字号的所有字体铸造在同一基线上，并以「Standard Line Type」之名大力推广，免去了排字工混排不同字体时反复垫纸对齐的繁琐工序。",
      cite: "核实来源：Wikipedia「Inland Type Foundry」词条。",
    },
    {
      title: "1981 · Josef Müller-Brockmann 与网格系统",
      desc: "瑞士平面设计大师 Josef Müller-Brockmann 于 1981 年由 Verlag Niggli 出版英德双语版《Grid Systems in Graphic Design / Raster-Systeme für die visuelle Gestaltung》，把基线与正文字号、行距结合成严谨的跨栏网格模数，使杂志与画册的左右栏行脚跨越插图与标题后依然严丝合缝。",
      cite: "核实来源：Wikipedia「Josef Müller-Brockmann」及出版记录。",
    },
    {
      title: "1992 · Robert Bringhurst 与书籍垂直韵律",
      desc: "加拿大排版学者 Robert Bringhurst 在 1992 年由 Hartley & Marks 首版的《The Elements of Typographic Style》中系统阐述了垂直韵律与行距节拍，强调标题、引语、脚注与正文的垂直节奏应当回到同一基线网格，像乐谱节拍一样托住长文阅读。",
      cite: "核实来源：Wikipedia「The Elements of Typographic Style」。",
    },
    {
      title: "OpenType · BASE 多文种基线表",
      desc: "进入数字与全球化排版时代，单一拉丁底线已不够用。Microsoft OpenType 规范引入 BASE 表，用标准化标签登记不同文字体系的对齐基线（romn 拉丁底线、ideo 表意方块底、hang 顶挂线、math 数学中线），让浏览器与排版引擎能够自动换算跨语种混排的基线落差。",
      cite: "核实来源：Microsoft OpenType Specification — BASE Table & Baseline Tag Registry。",
    },
  ];

  const eraBtns = [...document.querySelectorAll(".era-tab")];
  const eraTitle = document.getElementById("era-title");
  const eraDesc = document.getElementById("era-desc");
  const eraCite = document.getElementById("era-cite");

  eraBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const i = Number(b.dataset.era);
      eraBtns.forEach((x, idx) => {
        x.classList.toggle("is-active", idx === i);
        x.setAttribute("aria-selected", String(idx === i));
      });
      eraTitle.textContent = eras[i].title;
      eraDesc.textContent = eras[i].desc;
      eraCite.textContent = eras[i].cite;
    })
  );

  // 活字垫纸手感台：三块旧铸活字初始肩部差 [0, 3, 5] pt，每点一次垫进 1pt 铜垫片（循环 0..6）
  const needed = [0, 3, 5];
  const names = ["Chivo", "Garamond", "Garamond 斜"];
  const shims = [0, 0, 0];
  let standardMode = false;

  const slugEls = [...document.querySelectorAll(".lead-slug")];
  const btnStd = document.getElementById("btn-standard-line");
  const btnReset = document.getElementById("btn-metal-reset");
  const readout = document.getElementById("metal-readout");

  function renderSlugs() {
    let aligned = 0;
    slugEls.forEach((el, i) => {
      const face = el.querySelector(".slug-face");
      const meta = document.getElementById(`slug-meta-${i}`);
      const effGap = standardMode ? 0 : needed[i] - shims[i]; // >0 偏低，<0 垫过高
      const dyPx = effGap * 4.2;
      face.style.transform = `translateY(${dyPx}px)`;
      const ok = effGap === 0;
      if (ok) aligned++;
      el.classList.toggle("is-aligned", ok);
      if (standardMode) {
        meta.textContent = `${names[i]} · 统一基线`;
      } else {
        meta.textContent = `${names[i]} · ${shims[i]} 片${ok ? " ✓" : ""}`;
      }
    });

    btnStd.classList.toggle("is-toggled", standardMode);
    if (standardMode) {
      readout.textContent = "已切换 1894 Standard Line 统一基线铸造：无需塞入任何垫纸，三款不同风格活字的基线在出厂铸模时便严丝合缝。";
    } else if (aligned === 3) {
      readout.textContent = `三块非标旧铸活字已全部靠手工铜垫片垫齐（共塞入 ${shims[1] + shims[2]} 片 1 pt 垫纸）——想想整版数千字都这么垫有多耗时，就懂了 1894 年 Standard Line 的分量。`;
    } else {
      const todo = needed
        .map((n, i) => {
          const d = n - shims[i];
          if (d === 0) return null;
          return d > 0 ? `${names[i]} 还差 ${d} 片` : `${names[i]} 垫高了 ${-d} 片`;
        })
        .filter(Boolean);
      readout.textContent = `1894 年前非标旧铸态：${todo.join("；")}。点击对应铅字块继续塞入（垫超会循环归零），或切至 Standard Line。`;
    }
  }

  slugEls.forEach((el, i) =>
    el.addEventListener("click", () => {
      if (standardMode) standardMode = false;
      shims[i] = (shims[i] + 1) % 7;
      renderSlugs();
    })
  );
  btnStd.addEventListener("click", () => {
    standardMode = !standardMode;
    renderSlugs();
  });
  btnReset.addEventListener("click", () => {
    standardMode = false;
    shims[0] = 0;
    shims[1] = 0;
    shims[2] = 0;
    renderSlugs();
  });
  renderSlugs();
}

/* ==================== 03 中英混排基线与连续滑块 ==================== */
function initCjkLab(metrics) {
  const canvas = document.getElementById("cjk-canvas");
  const ctx = canvas.getContext("2d");
  const slider = document.getElementById("cjk-offset-slider");
  const valEl = document.getElementById("cjk-offset-val");
  const readout = document.getElementById("cjk-readout");
  const scriptBtns = [...document.querySelectorAll("[data-script]")];

  // 滑块范围与默认刻度严格来自 TextMetrics 实测 ideoDropPct
  slider.min = String(metrics.cjkSliderMin);
  slider.max = String(metrics.cjkSliderMax);
  slider.value = "0"; // 初态停在 0% 硬贴红线，让用户亲眼看见汉字上浮并拉到实测点
  document.getElementById("cjk-tick-min").textContent = `−${Math.abs(metrics.cjkSliderMin)}%`;
  document.getElementById("cjk-tick-rec").textContent = `实测 −${metrics.ideoDropPct.toFixed(1)}%`;
  document.getElementById("cjk-tick-max").textContent = `+${metrics.cjkSliderMax}%`;

  const st = { script: "romn", ideoShiftPct: 0 };

  function draw() {
    const dpr = pixelRatio(2);
    const W = 640;
    const H = 270;
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    const S = 46;
    const romnY = 160;
    const shiftPx = ((st.ideoShiftPct + metrics.ideoDropPct) / 100) * S; // 0% 时汉字上浮 +ideoDropPct

    // 按当前选择的 OpenType 基线轴画出对应高亮基准线
    const capTopY = romnY - S * metrics.fonts.chivo900.capHeight;
    const mathY = romnY - S * metrics.fonts.chivo900.xHeight * 0.5;
    const hanY = romnY - shiftPx; // 当 ideoShiftPct = -ideoDropPct 时 shiftPx = 0，落回自然混排位
    const hanBoxTop = hanY - S * (1 - metrics.ideoDropRatio);
    const hanBoxBot = hanY + S * metrics.ideoDropRatio;

    // 淡冰蓝方块字框（展示汉字正方形文字外框与内部字面衬空）
    ctx.font = `700 ${S}px "Noto Sans SC", sans-serif`;
    const wZh = ctx.measureText("基线对齐").width;
    const xStart = 32;
    ctx.fillStyle = COLORS.embox;
    ctx.fillRect(xStart - 4, hanBoxTop, wZh + 8, S);
    ctx.strokeStyle = COLORS.guide;
    ctx.strokeRect(xStart - 3.5, hanBoxTop + 0.5, wZh + 7, S - 1);

    // 绘制中文与西文
    ctx.fillStyle = COLORS.ink;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText("基线对齐", xStart, hanY);

    ctx.font = `700 ${S}px "Chivo", sans-serif`;
    const xEn = xStart + wZh + 16;
    ctx.fillText("Typo", xEn, romnY);
    const wEn = ctx.measureText("Typo").width;
    ctx.fillStyle = COLORS.blue;
    ctx.fillText("2026", xEn + wEn + 12, romnY);

    // 绘制四条 OpenType 基线参考（上下/左右错开标签，哪怕两线重合也绝不叠字）
    const drawRef = (y, color, text, bold, { align = "right", pos = "above" } = {}) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = bold ? 2.4 : 1.3;
      if (!bold) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(W - 16, y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `${bold ? 700 : 600} 11.5px "Chivo", "Noto Sans SC", sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = pos === "above" ? "bottom" : "top";
      ctx.fillText(text, align === "right" ? W - 20 : 20, pos === "above" ? y - 5 : y + 6);
      ctx.restore();
    };

    drawRef(romnY, st.script === "romn" ? COLORS.blue : "#7D8899", "romn 拉丁字母基线", st.script === "romn", { align: "right", pos: "below" });
    drawRef(hanBoxBot, st.script === "ideo" ? COLORS.red : COLORS.redText, `ideo 汉字方块底 (${st.ideoShiftPct >= 0 ? "+" : "−"}${Math.abs(st.ideoShiftPct).toFixed(1)}%)`, st.script === "ideo", { align: "left", pos: "below" });
    if (st.script === "hang") drawRef(capTopY, COLORS.blue, "hang 顶挂基线（藏文/天城文）", true, { align: "right", pos: "above" });
    if (st.script === "math") drawRef(mathY, COLORS.blue, "math 数学运算符中线", true, { align: "right", pos: "above" });

    valEl.textContent = `${st.ideoShiftPct > 0 ? "+" : st.ideoShiftPct < 0 ? "−" : ""}${Math.abs(st.ideoShiftPct).toFixed(1)}%`;

    const diffFromIdeal = Math.abs(st.ideoShiftPct + metrics.ideoDropPct);
    const scriptNotes = {
      romn: "romn 是拉丁字母与数字的默认基线（Typo 的 T、o 坐在线上，p、y 降部垂落其下）。",
      ideo: "ideo 标定汉字正方形文字外框（CLREQ §6.4）的底边；因字面居中留有底空，ideo 必须低于 romn。",
      hang: "hang 用于藏文、天城文等自上而下悬挂书写的文字体系，字形从顶部横杠往下长。",
      math: "math 将分数线、等号与加减号居中对齐到 x 字高的中轴，而非压在字母底线上。",
    };

    if (diffFromIdeal <= 1.2) {
      readout.innerHTML = `<strong>视觉齐平（实测 −${metrics.ideoDropPct.toFixed(1)}%）：</strong>${scriptNotes[st.script]} 此时淡蓝方块外框底略低于蓝线，汉字字面底恰好与「Typo 2026」平齐不发飘。`;
    } else if (st.ideoShiftPct > -metrics.ideoDropPct + 1.2) {
      readout.innerHTML = `<strong>汉字偏高上浮（${valEl.textContent}）：</strong>${scriptNotes[st.script]} 汉字方块底抬得太靠近拉丁基线，底边衬空把「基线对齐」顶得像上标。向左拖到实测 −${metrics.ideoDropPct.toFixed(1)}% 附近看字脚落稳。`;
    } else {
      readout.innerHTML = `<strong>汉字偏低沉落（${valEl.textContent}）：</strong>${scriptNotes[st.script]} 方块底压得比实测值 −${metrics.ideoDropPct.toFixed(1)}% 更低，中文整体掉到英文行脚之下。`;
    }
  }

  scriptBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.script = b.dataset.script;
      scriptBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      draw();
    })
  );
  slider.addEventListener("input", () => {
    st.ideoShiftPct = parseFloat(slider.value);
    draw();
  });
  draw();
}

/* ==================== 04 双栏跨页基线网格步进台 ==================== */
function initGridLab() {
  const canvas = document.getElementById("grid-canvas");
  const ctx = canvas.getContext("2d");
  const valOut = document.getElementById("grid-height-val");
  const readout = document.getElementById("grid-readout");
  const btnDec = document.getElementById("grid-dec");
  const btnInc = document.getElementById("grid-inc");
  const btnLines = document.getElementById("btn-grid-lines");
  const quickBtns = [...document.querySelectorAll("[data-mag-h]")];

  const STEP = 24; // 正文基线网格步长 24px
  const st = { headingH: 53, showGrid: true }; // 初始故意落在非整倍 53px（错齿 +5px）

  const leftTop = ["版面像乐谱，正文行距就是全页", "不变的基准节拍。当左栏插进一", "枚醒目的小标题时，别只看它自", "己好不好看，更要算清它占掉的"];
  const leftBot = ["总高度是不是行距的整数倍。差", "哪怕几像素，左栏下半截与右栏", "每一行文字都会从此错开半格，", "整张跨页瞬间失去平稳感。"];
  const rightAll = [
    "右栏正文一直按固定二十四像素",
    "步长往下走，像一把隐形的卡尺",
    "竖在页面中央。只要左侧标题总",
    "高度刚好等于两倍或三倍步长，",
    "左右两栏跨过栏缝后就能严丝合",
    "缝地重新对脚。这就是瑞士网格",
    "书刊读起来安静耐看、久读不累",
    "的底层原因：眼睛每次跨栏换眼",
    "都能踩在熟悉的高度节拍上，不",
    "必重新适应高低起伏的文字行。",
  ];

  function draw() {
    const dpr = pixelRatio(2);
    const W = 1120;
    const H = 390;
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    const firstBase = 52;
    const rem = st.headingH % STEP;
    const synced = rem === 0;
    const offset = synced ? 0 : rem <= STEP / 2 ? rem : rem - STEP;

    // 1. 全页 24px 基线网格横线
    if (st.showGrid) {
      ctx.strokeStyle = "rgba(4, 72, 211, 0.22)";
      ctx.lineWidth = 1;
      for (let y = firstBase; y < H - 16; y += STEP) {
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(W - 24, y);
        ctx.stroke();
      }
    }

    // 中缝分隔虚线
    const midX = W / 2;
    ctx.save();
    ctx.strokeStyle = COLORS.guide;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, H - 20);
    ctx.stroke();
    ctx.restore();

    const col1X = 56;
    const col2X = midX + 44;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 左栏上半正文
    ctx.font = `400 16px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.ink;
    leftTop.forEach((line, i) => {
      ctx.fillText(line, col1X, firstBase + i * STEP);
    });

    // 左栏内嵌标题占高块（高度 = st.headingH）
    const headTopY = firstBase + (leftTop.length - 1) * STEP + 8;
    const headBotY = headTopY + st.headingH;
    ctx.fillStyle = synced ? "rgba(4, 72, 211, 0.1)" : "rgba(252, 52, 20, 0.1)";
    ctx.fillRect(col1X - 8, headTopY, 456, st.headingH);
    ctx.strokeStyle = synced ? COLORS.blue : COLORS.red;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(col1X - 8, headTopY, 456, st.headingH);

    ctx.font = `900 22px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.ink;
    ctx.fillText("栏内插标题：占高决定下半页秩序", col1X, headTopY + st.headingH * 0.64);

    // 占高标尺注释
    ctx.font = `700 12px "Chivo", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = synced ? COLORS.blue : COLORS.redText;
    ctx.textAlign = "right";
    ctx.fillText(`${st.headingH} px`, col1X + 440, headTopY + 18);
    ctx.textAlign = "left";

    // 左栏下半正文（从 headBotY 后起排，行距仍为 24px）
    const botFirstBase = firstBase + leftTop.length * STEP + st.headingH;
    ctx.font = `400 16px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = synced ? COLORS.ink : COLORS.redText;
    leftBot.forEach((line, i) => {
      const y = botFirstBase + i * STEP;
      if (y < H - 16) {
        ctx.fillText(line, col1X, y);
        // 跨栏对脚核对短线（指向中缝）
        ctx.strokeStyle = synced ? COLORS.blue : COLORS.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(col1X + 448, y);
        ctx.lineTo(midX - 6, y);
        ctx.stroke();
      }
    });

    // 右栏连续正文（永远稳踩 24px 网格）
    ctx.font = `400 16px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.ink;
    rightAll.forEach((line, i) => {
      const y = firstBase + i * STEP;
      if (y < H - 16) {
        ctx.fillText(line, col2X, y);
        if (i >= 5) {
          ctx.strokeStyle = COLORS.blue;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(midX + 6, y);
          ctx.lineTo(col2X - 10, y);
          ctx.stroke();
        }
      }
    });

    valOut.textContent = `${st.headingH} px`;
    quickBtns.forEach((b) => b.classList.toggle("is-current", Number(b.dataset.magH) === st.headingH));
    if (synced) {
      readout.innerHTML = `<strong>跨栏对脚成立（${st.headingH} px = ${st.headingH / STEP}× 网格步长）：</strong>中缝两侧的蓝色短线严丝合缝接在同一高度上，读者跨栏扫读毫不跳眼。`;
    } else {
      readout.innerHTML = `<strong>两栏错齿 ${offset > 0 ? "+" : "−"}${Math.abs(offset)} px：</strong>左栏标题占高 ${st.headingH} px 不是 24 px 步长的整数倍，中缝处红色短线与右侧蓝色短线错开，左栏下半截全部失步。用 − / + 调至 48 px 或 72 px 即可锁回网格。`;
    }
  }

  btnDec.addEventListener("click", () => {
    st.headingH = clamp(st.headingH - 1, 36, 96);
    draw();
  });
  btnInc.addEventListener("click", () => {
    st.headingH = clamp(st.headingH + 1, 36, 96);
    draw();
  });
  quickBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.headingH = Number(b.dataset.magH);
      draw();
    })
  );
  btnLines.addEventListener("click", () => {
    st.showGrid = !st.showGrid;
    btnLines.classList.toggle("is-toggled", st.showGrid);
    btnLines.setAttribute("aria-pressed", String(st.showGrid));
    draw();
  });
  draw();
}

/* ==================== 05 CSS 属性芯片矩阵驱动三组真 DOM ==================== */
function initCssLab() {
  const chips = [...document.querySelectorAll("[data-css-align]")];
  const rows = [
    document.getElementById("demo-price"),
    document.getElementById("demo-news"),
    document.getElementById("demo-form"),
  ];
  const statPrice = document.getElementById("css-stat-price");
  const statNews = document.getElementById("css-stat-news");
  const statForm = document.getElementById("css-stat-form");
  const codeOut = document.getElementById("bp-code-out");
  const diagOut = document.getElementById("bp-diag");

  const copyMap = {
    "flex-start": {
      price: "顶齐悬挂",
      news: "齐首行顶",
      form: "标签偏高",
      diag: "flex-start 把各元素外框顶边吊在同一水平线：价格里的 ¥、/ 月与 Pro plan 全浮在 188 头顶，表单标签也比输入框内文字偏高。",
    },
    center: {
      price: "居中飘浮",
      news: "居中悬空",
      form: "框中轴齐",
      diag: "center 只对齐矩形外框中心：价格里的小字全飘在 188 腰部，双行新闻标题旁的日期悬在两行夹缝里。",
    },
    "flex-end": {
      price: "框底齐平",
      news: "齐末行框底",
      form: "框底微偏",
      diag: "flex-end 让各元素外框底边齐平：由于 188 字号大、下降部留白比小字深得多，大数字的底脚反而被抬高；输入框的外边框底边也压得比标签文字更低。",
    },
    "first baseline": {
      price: "基线稳齐 ✓",
      news: "齐首行基线 ✓",
      form: "字脚直对齐 ✓",
      diag: "first baseline（即 align-items: baseline）：价格标牌与表单输入框文字瞬间与主字共踩同一条基线；双行标题旁的日期则与第一行文字齐脚，适合列表项抬头。",
    },
    "last baseline": {
      price: "基线稳齐 ✓",
      news: "齐末行收底 ✓",
      form: "字脚直对齐 ✓",
      diag: "last baseline：价格标牌与表单同样稳齐；遇到双行新闻标题时，日期标签直接落到第二行末行基线上，与整段标题平直收底，呼应 188 号原海报右侧双行小标的做法。",
    },
  };

  function apply(mode) {
    rows.forEach((r) => {
      r.style.alignItems = mode;
    });
    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.cssAlign === mode));
    const info = copyMap[mode];
    statPrice.textContent = info.price;
    statNews.textContent = info.news;
    statForm.textContent = info.form;
    codeOut.textContent = `.row { display: flex; align-items: ${mode}; gap: 10px; }`;
    diagOut.textContent = info.diag;
  }

  chips.forEach((c) => c.addEventListener("click", () => apply(c.dataset.cssAlign)));
  apply("center");
}

/* ==================== 06 什么时候别硬对齐 · 四张独立翻转卡 ==================== */
function initDontCards() {
  const texts = {
    icon: {
      badBtn: "看改用居中",
      goodBtn: "看死守基线",
      badCap: "死守基线：图标底边压到文字基线上，整枚放大镜显得比文字高出一截，按钮视觉失衡。",
      goodCap: "放手改用视觉居中：图标与汉字主体中轴对齐，整枚胶囊按钮稳重舒展。",
    },
    kpi: {
      badBtn: "看改用顶齐",
      goodBtn: "看死守基线",
      badCap: "死守首基线：三行备注的第一行贴到 94 的脚底，后两行悬空吊在数字下方，上下空出大洞。",
      goodCap: "放手改用顶对齐（cap-top）：备注第一行与 94 顶沿齐平，三行正文刚好填满大数字的纵高。",
    },
    script: {
      badBtn: "看视觉中线",
      goodBtn: "看死守底线",
      badCap: "死守拉丁底线：天城文、藏文等文字以顶部横杠悬挂生长，强压底部会让顶杠高低失序。",
      goodCap: "放手改用中轴或各自基准：尊重顶挂文字从上横杠向下垂落的结构，混排更自然。",
    },
    poster: {
      badBtn: "看错位律动",
      goodBtn: "看死守基线",
      badCap: "死守基线：音乐节或实验展报需要切分与跳动节奏，一味锁死水平基线反而磨平了表现力。",
      goodCap: "放手打破基线：有意让单词错落高低，立刻制造出爵士切分音般的动态张力。",
    },
  };

  document.querySelectorAll("[data-flip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.flip;
      const card = btn.closest(".dont-card");
      const next = card.dataset.mode === "bad" ? "good" : "bad";
      card.dataset.mode = next;
      const t = texts[key];
      btn.textContent = next === "bad" ? t.badBtn : t.goodBtn;
      document.getElementById(`cap-${key}`).textContent = next === "bad" ? t.badCap : t.goodCap;
    });
  });
}

/* ==================== 07 四选一单变量盲测 ==================== */
function initQuiz(metrics) {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const btnSubmit = document.getElementById("quiz-submit");
  const btnReset = document.getElementById("quiz-reset");
  const feedback = document.getElementById("quiz-feedback");

  let picked = null;
  let revealed = false;

  const QUIZ_SIZES = [48, 21, 16]; // 清晰表达 48 / 从标题到正文 21 / Design·Typography 16

  function drawQuizCard(canvas, mode, showGuides) {
    const ctx = canvas.getContext("2d");
    const dpr = pixelRatio(2);
    const W = 560;
    const H = 156;
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    const baseY = 98;
    const evalQ = evaluateQuizOption(mode, QUIZ_SIZES, baseY, metrics);
    const xs = [24, 240, 396];

    // 揭晓后绘外框与主基线、朱红折线
    if (showGuides) {
      evalQ.items.forEach(({ block, geom }, i) => {
        ctx.font = `${block.weight} ${geom.fontSize}px ${block.family}`;
        const w = Math.max(...block.lines.map((l) => ctx.measureText(l).width));
        ctx.fillStyle = COLORS.embox;
        ctx.fillRect(xs[i] - 4, geom.boxTop, w + 8, geom.boxHeight);
        ctx.strokeStyle = "rgba(74, 83, 98, 0.45)";
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(xs[i] - 3.5, geom.boxTop + 0.5, w + 7, geom.boxHeight - 1);
        ctx.setLineDash([]);
      });

      // 钴蓝主基线
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(14, baseY);
      ctx.lineTo(W - 14, baseY);
      ctx.stroke();
    }

    // 绘制三块文字
    evalQ.items.forEach(({ block, geom }, i) => {
      ctx.font = `${block.weight} ${geom.fontSize}px ${block.family}`;
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      block.lines.forEach((line, li) => {
        ctx.fillText(line, xs[i], geom.drawYs[li]);
      });
    });

    // 揭晓后叠绘朱红真实基线折线
    if (showGuides) {
      const ok = mode === "baseline";
      ctx.save();
      ctx.strokeStyle = ok ? COLORS.blue : COLORS.red;
      ctx.lineWidth = 2;
      if (!ok) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      evalQ.items.forEach(({ block, geom }, i) => {
        ctx.font = `${block.weight} ${geom.fontSize}px ${block.family}`;
        const w = Math.max(...block.lines.map((l) => ctx.measureText(l).width));
        if (i === 0) ctx.moveTo(xs[i] - 4, geom.trueBaselineY);
        else ctx.lineTo(xs[i] - 4, geom.trueBaselineY);
        ctx.lineTo(xs[i] + w + 4, geom.trueBaselineY);
      });
      ctx.stroke();
      ctx.restore();
    }

    return evalQ;
  }

  function renderAll() {
    QUIZ_OPTIONS.forEach((opt) => {
      const c = document.querySelector(`.quiz-canvas[data-opt="${opt.key}"]`);
      const stat = document.querySelector(`[data-stat="${opt.key}"]`);
      const ev = drawQuizCard(c, opt.mode, revealed);
      if (revealed && stat) {
        stat.hidden = false;
        const maxStr = `${ev.maxAbsEm.toFixed(2)} em (${Math.round(ev.maxAbsPx)} px)`;
        if (opt.mode === "baseline") {
          stat.textContent = `✓ 真基线对齐（最大落差 0.00 em）：大标字面底、正文字面底与末行 Typography 基线共线，y/p/g 降部自然垂出。`;
        } else if (opt.mode === "box-bottom") {
          stat.textContent = `× 框底对齐（最大落差 ${maxStr}）：大标下降线最深，外框底边齐平后反把大标基线相对抬高、小字压低。`;
        } else if (opt.mode === "ink-bottom") {
          stat.textContent = `× 字墨底对齐（最大落差 ${maxStr}）：Typography 中 y/p/g 的尾巴尖端贴死蓝线，把整块双行英文顶高一截。`;
        } else {
          stat.textContent = `× 双行标误用首行基线（最大落差 ${maxStr}）：把第一行 Design 对上了蓝线，第二行 Typography 整行掉穿底界。`;
        }
      } else if (stat) {
        stat.hidden = true;
      }
    });
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (revealed) return;
      picked = card.dataset.opt;
      cards.forEach((c) => {
        const on = c.dataset.opt === picked;
        c.classList.toggle("is-picked", on);
        c.setAttribute("aria-checked", String(on));
      });
      btnSubmit.disabled = false;
      feedback.textContent = `已选方案 ${picked}，点击「揭晓实测基线」对照四版的真实基线折线。`;
    });
  });

  btnSubmit.addEventListener("click", () => {
    if (!picked) return;
    revealed = true;
    btnSubmit.disabled = true;
    btnReset.hidden = false;
    cards.forEach((c) => {
      const opt = QUIZ_OPTIONS.find((o) => o.key === c.dataset.opt);
      c.classList.remove("is-picked");
      if (opt.correct) c.classList.add("is-right");
      else if (c.dataset.opt === picked) c.classList.add("is-wrong");
    });
    renderAll();
    if (picked === "C") {
      feedback.textContent = "判断准确！方案 C 是唯一把大标字面底、正文字面底与双行标末行 Typography 字母基线锁在一条线上的版本，y/p/g 降部自然垂出蓝线下方，扫读最稳。";
    } else {
      feedback.textContent = `方案 ${picked} 存在隐藏错位，正确答案为方案 C。对照四张图叠出的钴蓝基线与朱红折线：A 是框底对齐抬高大字基线，B 是双行标误用首行基线导致末行漏底，D 是字墨底对齐被降部尾巴顶翘。`;
    }
  });

  btnReset.addEventListener("click", () => {
    picked = null;
    revealed = false;
    btnSubmit.disabled = true;
    btnReset.hidden = true;
    cards.forEach((c) => {
      c.classList.remove("is-picked", "is-right", "is-wrong");
      c.setAttribute("aria-checked", "false");
    });
    feedback.textContent = "先点选 A、B、C、D 中你认为底脚最稳的一版，再点击「揭晓实测基线」。";
    renderAll();
  });

  renderAll();
}

/* ==================== 08 原海报放大拖拽灯箱 ==================== */
function initLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtns = [document.getElementById("poster-open"), document.getElementById("poster-zoom-btn")];
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbVp = document.getElementById("lb-viewport");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLb() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function closeLb() {
    lb.hidden = true;
    openBtns[0].focus();
  }

  openBtns.forEach((b) => b && b.addEventListener("click", openLb));
  btnClose.addEventListener("click", closeLb);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.3, 0.7, 3.6);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.3, 0.7, 3.6);
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbVp.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.6);
      applyTransform();
    },
    { passive: false }
  );

  lbVp.addEventListener("pointerdown", (e) => {
    if (e.target === lbVp) {
      closeLb();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbVp.classList.add("is-panning");
    lbVp.setPointerCapture(e.pointerId);
  });
  lbVp.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endPan = () => {
    panning = false;
    lbVp.classList.remove("is-panning");
  };
  lbVp.addEventListener("pointerup", endPan);
  lbVp.addEventListener("pointercancel", endPan);

  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") closeLb();
  });
}

boot();
