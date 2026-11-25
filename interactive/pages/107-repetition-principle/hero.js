// 开场：9×8 活体印版矩阵（高 DPI 2D Canvas + 弹簧插值 + 秩序归位轨 data-perf-drag）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  COLS,
  ROWS,
  POSTER_BREAK,
  PALETTE,
  SPACING_MODES,
  CELL_SEEDS,
  createInitialState,
  createWallpaperState,
  toggleBreakAt,
  isEdgeBreak,
  breakCoversCell,
  evaluate,
  computeMatrixGeometry,
  hitTestCell,
} from "./model.js";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const VERMILION_RGB = hexToRgb(PALETTE.vermilion);
const CHAOS_RGB = PALETTE.chaos.map(hexToRgb);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rgbMix(a, b, t) {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

// 形状渐变绘制：shapeMix=1 为纯圆，shapeMix=0 为方/三角/菱/圆杂排
function drawMorphCell(ctx, cx, cy, radius, seedShape, shapeMix, rot) {
  if (seedShape === 0 || shapeMix > 0.985) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);

  if (seedShape === 1 || seedShape === 3) {
    // 方形（1）或 45° 菱形（3），随 shapeMix 趋近 1 圆角增大直至正圆
    if (seedShape === 3) ctx.rotate(Math.PI / 4);
    const half = radius * lerp(seedShape === 3 ? 0.86 : 0.9, 1.0, shapeMix);
    const corner = half * lerp(0.06, 1.0, shapeMix);
    const x = -half;
    const y = -half;
    const w = half * 2;
    ctx.beginPath();
    ctx.moveTo(x + corner, y);
    ctx.arcTo(x + w, y, x + w, y + w, corner);
    ctx.arcTo(x + w, y + w, x, y + w, corner);
    ctx.arcTo(x, y + w, x, y, corner);
    ctx.arcTo(x, y, x + w, y, corner);
    ctx.closePath();
    ctx.fill();
  } else {
    // 三角形（2）：用 3 个顶点与中点插值成圆弧，过渡极其平滑
    const pts = 18;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const ang = (i / pts) * Math.PI * 2 - Math.PI / 2;
      // 三角形极径方程（每 120° 周期）
      const sector = ((ang + Math.PI / 2) % ((Math.PI * 2) / 3) + ((Math.PI * 2) / 3)) % ((Math.PI * 2) / 3);
      const triR = (radius * 0.62) / Math.cos(sector - Math.PI / 3);
      const r = lerp(Math.min(triR, radius * 1.12), radius, shapeMix);
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const track = document.getElementById("order-track");
  const fill = document.getElementById("order-fill");
  const thumb = document.getElementById("order-thumb");
  const orderVal = document.getElementById("order-val");
  const metaTag = document.getElementById("plate-meta-tag");
  const scorePill = document.getElementById("hero-score-pill");

  const btnShape = document.getElementById("btn-shape");
  const btnColor = document.getElementById("btn-color");
  const btnGuide = document.getElementById("btn-guide");
  const btnWallpaper = document.getElementById("btn-wallpaper");
  const btnReset = document.getElementById("btn-reset");
  const spacingBtns = [...document.querySelectorAll("[data-spacing]")];

  const pillarsDom = {
    unity: { el: document.getElementById("pillar-unity"), st: document.getElementById("pillar-unity-st") },
    rhythm: { el: document.getElementById("pillar-rhythm"), st: document.getElementById("pillar-rhythm-st") },
    emphasis: { el: document.getElementById("pillar-emphasis"), st: document.getElementById("pillar-emphasis-st") },
    order: { el: document.getElementById("pillar-order"), st: document.getElementById("pillar-order-st") },
  };

  const diagBox = document.getElementById("diag-box");
  const diagBadge = document.getElementById("diag-badge");
  const diagScore = document.getElementById("diag-score");
  const diagHeadline = document.getElementById("diag-headline");
  const diagReason = document.getElementById("diag-reason");
  const diagHint = document.getElementById("diag-hint");
  const dmRatio = document.getElementById("dm-ratio");
  const dmGap = document.getElementById("dm-gap");
  const dmJitter = document.getElementById("dm-jitter");

  let state = createInitialState();
  let hoverCell = null;
  let keyboardFocus = false;
  let wasAllOk = false;

  // 动画插值状态（让形、色、对齐度、间距、破格缩放与通关涟漪丝滑重绘）
  const anim = {
    intro: 0,
    order: state.order,
    shapeMix: 0,
    colorMix: 0,
    radiusRatio: SPACING_MODES[state.spacing].radiusRatio,
    rippleT: -1,
    rippleOrigin: { c: POSTER_BREAK.c + 0.5, r: POSTER_BREAK.r + 0.5 },
    breakScale: new Map(),
  };

  let geom = computeMatrixGeometry(600, 500);
  let dirty = true;
  let lastSizeKey = "";

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(120, Math.round(rect.width));
    const h = Math.max(100, Math.round(rect.height));
    const dpr = pixelRatio(2);
    const key = `${w}x${h}@${dpr}`;
    if (key !== lastSizeKey) {
      lastSizeKey = key;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      geom = computeMatrixGeometry(w, h);
      dirty = true;
    }
  }

  function syncUI() {
    const ev = evaluate(state);

    // 秩序归位轨读数与视觉
    const pct = Math.round(state.order);
    track.setAttribute("aria-valuenow", String(pct));
    fill.style.width = `${pct}%`;
    thumb.style.left = `${Math.max(4, Math.min(96, pct))}%`;
    thumb.classList.toggle("is-ok", ev.orderOk);
    orderVal.textContent = ev.orderOk ? `对位 ${pct}% · 秩序成立` : `对位 ${pct}% · 抖动 ${ev.jitterPct}%`;
    orderVal.classList.toggle("is-ok", ev.orderOk);

    metaTag.textContent = `9×8 印版 · ${ev.smallCount} 小元 + ${ev.breakCount} 处破格（${ev.breakAreaPct}%）`;
    if (scorePill) scorePill.textContent = `${ev.passedCount} / 4`;

    // 按钮按下状态
    btnShape.setAttribute("aria-pressed", String(state.unifiedShape));
    btnColor.setAttribute("aria-pressed", String(state.unifiedColor));
    btnGuide.setAttribute("aria-pressed", String(state.showPosterGuide));
    for (const b of spacingBtns) {
      const on = b.dataset.spacing === state.spacing;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }

    // 原海报四栏实况条
    for (const key of ["unity", "rhythm", "emphasis", "order"]) {
      const info = ev.pillars[key];
      pillarsDom[key].el.classList.toggle("is-ok", info.ok);
      pillarsDom[key].st.textContent = info.status;
    }

    // 诊单更新
    diagBox.classList.toggle("is-ok", ev.kind === "ok");
    diagBox.classList.toggle("is-warn", ev.kind === "warn");
    diagBadge.textContent = ev.tier;
    diagScore.textContent = `${ev.passedCount} / 4 达标（经验判定）`;
    diagHeadline.textContent = ev.headline;
    diagReason.textContent = ev.reason;
    diagHint.textContent = ev.hint;
    if (dmRatio) dmRatio.textContent = `${ev.smallCount} 小元 · ${ev.breakAreaPct}%`;
    if (dmGap) dmGap.textContent = `${ev.gapPct}%（${SPACING_MODES[state.spacing].short}）`;
    if (dmJitter) dmJitter.textContent = `${ev.jitterPct}%`;

    // 首次全过时，从破格大圆发出一道温和单次涟漪
    const allOk = ev.passedCount === 4;
    if (allOk && !wasAllOk && state.breaks.length === 1) {
      anim.rippleT = 0;
      anim.rippleOrigin = { c: state.breaks[0].c + 0.5, r: state.breaks[0].r + 0.5 };
    }
    wasAllOk = allOk;
    dirty = true;
  }

  function renderFrame(_t, dt, { still }) {
    syncCanvasSize();

    const targetShape = state.unifiedShape ? 1 : 0;
    const targetColor = state.unifiedColor ? 1 : 0;
    const targetRadius = SPACING_MODES[state.spacing].radiusRatio;

    let moving = false;
    if (still) {
      anim.intro = 1;
      anim.order = state.order;
      anim.shapeMix = targetShape;
      anim.colorMix = targetColor;
      anim.radiusRatio = targetRadius;
      anim.rippleT = -1;
      for (const b of state.breaks) anim.breakScale.set(`${b.c},${b.r}`, 1);
    } else {
      const step = Math.min(1, dt * 13);
      if (anim.intro < 1) {
        anim.intro = Math.min(1, anim.intro + dt * 2.4);
        moving = true;
      }
      const easeProp = (k, target, eps = 0.002) => {
        const diff = target - anim[k];
        if (Math.abs(diff) > eps) {
          anim[k] += diff * step;
          moving = true;
        } else {
          anim[k] = target;
        }
      };
      easeProp("order", state.order, 0.08);
      easeProp("shapeMix", targetShape);
      easeProp("colorMix", targetColor);
      easeProp("radiusRatio", targetRadius);

      const liveKeys = new Set(state.breaks.map((b) => `${b.c},${b.r}`));
      for (const key of liveKeys) {
        const cur = anim.breakScale.get(key) ?? 0.35;
        if (Math.abs(1 - cur) > 0.004) {
          anim.breakScale.set(key, cur + (1 - cur) * Math.min(1, dt * 15));
          moving = true;
        } else {
          anim.breakScale.set(key, 1);
        }
      }
      for (const key of [...anim.breakScale.keys()]) {
        if (!liveKeys.has(key)) anim.breakScale.delete(key);
      }

      if (anim.rippleT >= 0) {
        anim.rippleT += dt * 1.45;
        if (anim.rippleT > 1.35) anim.rippleT = -1;
        else moving = true;
      }
    }

    if (!dirty && !moving) return;
    dirty = false;

    const { ox, oy, cell, gridW, gridH, width, height } = geom;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, width, height);

    // 淡雅正交印刷网格辅助线（秩序越低越显对比，秩序归位后自动退淡）
    const guideAlpha = lerp(0.28, 0.07, anim.order / 100);
    ctx.strokeStyle = `rgba(14,13,11,${guideAlpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= COLS; c++) {
      const x = Math.round(ox + c * cell) + 0.5;
      ctx.moveTo(x, oy);
      ctx.lineTo(x, oy + gridH);
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = Math.round(oy + r * cell) + 0.5;
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + gridW, y);
    }
    ctx.stroke();

    const jitterFactor = Math.max(0, 1 - anim.order / 100);
    const introEase = 1 - Math.pow(1 - anim.intro, 3);

    // 绘制未被 2×2 破格覆盖的小单元
    for (let idx = 0; idx < CELL_SEEDS.length; idx++) {
      const s = CELL_SEEDS[idx];
      let covered = false;
      for (let i = 0; i < state.breaks.length; i++) {
        if (breakCoversCell(state.breaks[i], s.c, s.r)) {
          covered = true;
          break;
        }
      }
      if (covered) continue;

      const baseX = ox + (s.c + 0.5) * cell;
      const baseY = oy + (s.r + 0.5) * cell;
      const cx = baseX + s.dx * cell * jitterFactor;
      const cy = baseY + s.dy * cell * jitterFactor;

      let r = cell * anim.radiusRatio * lerp(1, s.scaleErr, jitterFactor);
      // 柔和入场缩放（开场每一帧都清晰可见：从 0.72 到 1.0）
      r *= lerp(0.72, 1, introEase);

      // 达标单次柔和涟漪
      if (anim.rippleT >= 0) {
        const dist = Math.hypot(s.c - anim.rippleOrigin.c, s.r - anim.rippleOrigin.r);
        const wave = anim.rippleT * 9.5 - dist;
        if (wave > -1.1 && wave < 1.1) {
          r *= 1 + 0.08 * Math.cos((wave / 1.1) * (Math.PI / 2));
        }
      }

      const rot = s.rotErr * jitterFactor;
      ctx.fillStyle = rgbMix(CHAOS_RGB[s.colorIdx], VERMILION_RGB, anim.colorMix);
      drawMorphCell(ctx, cx, cy, Math.max(2, r), s.shape, anim.shapeMix, rot);
    }

    // 绘制 2×2 破格大圆（及贴边 / 争焦警示虚线环）
    const multiBreak = state.breaks.length > 1;
    for (let i = 0; i < state.breaks.length; i++) {
      const b = state.breaks[i];
      const key = `${b.c},${b.r}`;
      const bScale = anim.breakScale.get(key) ?? 1;
      const cx = ox + (b.c + 1) * cell;
      const cy = oy + (b.r + 1) * cell;
      const edgeBad = isEdgeBreak(b);

      // 与原海报一致：2×2 破格大圆直径约为 1.88 倍单格宽
      const bigR = cell * (0.935 * (anim.radiusRatio / SPACING_MODES.sweet.radiusRatio) * 0.48 + 0.49) * bScale * lerp(0.78, 1, introEase);
      const clampedBigR = Math.min(cell * 0.96, Math.max(cell * 0.62, bigR));

      // 杂色未统一时，破格本身也受杂色影响（避开近黑炭色，保证墨黑印章标签高对比清晰）
      const bColor = rgbMix(CHAOS_RGB[(b.c + b.r) % 3], VERMILION_RGB, anim.colorMix);
      ctx.fillStyle = bColor;
      ctx.beginPath();
      ctx.arc(cx, cy, clampedBigR, 0, Math.PI * 2);
      ctx.fill();

      // 清晰标出「贴边破框」或「争焦」状态
      if (edgeBad || multiBreak) {
        ctx.save();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, clampedBigR + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 简明印章小签（加浅纸细描边，在任意底色上都利落可读）
        const tag = edgeBad ? "贴边破框" : `争焦 #${i + 1}`;
        ctx.save();
        ctx.font = `700 ${Math.max(11, Math.round(cell * 0.19))}px "Noto Sans SC", sans-serif`;
        const tw = ctx.measureText(tag).width + 10;
        const th = Math.max(18, Math.round(cell * 0.3));
        ctx.fillStyle = PALETTE.ink;
        ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - tw / 2, cy - th / 2, tw, th);
        ctx.fillStyle = PALETTE.paper;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, cx, cy + 0.5);
        ctx.restore();
      }
    }

    // 可选叠看：107 原海报实测偏心破格位（第 4–5 列、第 5–6 行）
    if (state.showPosterGuide) {
      const pcx = ox + (POSTER_BREAK.c + 1) * cell;
      const pcy = oy + (POSTER_BREAK.r + 1) * cell;
      ctx.save();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.75;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(pcx, pcy, cell * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(ox + POSTER_BREAK.c * cell, oy + POSTER_BREAK.r * cell, cell * 2, cell * 2);
      ctx.setLineDash([]);
      ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
      const label = "107 原海报位 C4-5·R5-6";
      const lw = ctx.measureText(label).width + 10;
      ctx.fillStyle = PALETTE.cotton;
      ctx.fillRect(pcx - lw / 2, oy + POSTER_BREAK.r * cell - 20, lw, 18);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(pcx - lw / 2, oy + POSTER_BREAK.r * cell - 20, lw, 18);
      ctx.fillStyle = PALETTE.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, pcx, oy + POSTER_BREAK.r * cell - 11);
      ctx.restore();
    }

    // 悬停或键盘格位预览框（标示即将合并或拆散的 2×2 区域）
    const activeCell = hoverCell || (keyboardFocus ? state.cursor : null);
    if (activeCell) {
      const hitBreak = state.breaks.find((b) => breakCoversCell(b, activeCell.c, activeCell.r));
      const boxC = hitBreak ? hitBreak.c : Math.min(COLS - 2, activeCell.c);
      const boxR = hitBreak ? hitBreak.r : Math.min(ROWS - 2, activeCell.r);
      ctx.save();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(ox + boxC * cell + 1, oy + boxR * cell + 1, cell * 2 - 2, cell * 2 - 2);
      ctx.restore();
    }
  }

  const ctrl = loop(canvas, renderFrame);

  // 画布指针点击：直接种下或拆散 2×2 破格圆
  function pointerToCell(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return hitTestCell(geom, clientX - rect.left, clientY - rect.top);
  }

  canvas.addEventListener("pointermove", (e) => {
    const cellHit = pointerToCell(e.clientX, e.clientY);
    if (
      (cellHit?.c ?? -1) !== (hoverCell?.c ?? -1) ||
      (cellHit?.r ?? -1) !== (hoverCell?.r ?? -1)
    ) {
      hoverCell = cellHit;
      dirty = true;
      ctrl.draw();
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (hoverCell) {
      hoverCell = null;
      dirty = true;
      ctrl.draw();
    }
  });

  canvas.addEventListener("click", (e) => {
    const cellHit = pointerToCell(e.clientX, e.clientY);
    if (!cellHit) return;
    state = toggleBreakAt(state, cellHit.c, cellHit.r);
    syncUI();
    ctrl.draw();
  });

  canvas.addEventListener("focus", () => {
    keyboardFocus = true;
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener("blur", () => {
    keyboardFocus = false;
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.cursor.c = Math.max(0, state.cursor.c - 1);
      dirty = true;
      ctrl.draw();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.cursor.c = Math.min(COLS - 1, state.cursor.c + 1);
      dirty = true;
      ctrl.draw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.cursor.r = Math.max(0, state.cursor.r - 1);
      dirty = true;
      ctrl.draw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.cursor.r = Math.min(ROWS - 1, state.cursor.r + 1);
      dirty = true;
      ctrl.draw();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      state = toggleBreakAt(state, state.cursor.c, state.cursor.r);
      syncUI();
      ctrl.draw();
    }
  });

  // 秩序归位轨（data-perf-drag）：同时支持 Pointer、Touch（perf.mjs 触控拖动）与键盘方向键
  let draggingRail = false;

  function setOrderFromClientX(clientX, snap = false) {
    const rect = track.getBoundingClientRect();
    const raw = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    let next = Math.max(0, Math.min(100, Math.round(raw)));
    if (snap && next >= 95) next = 100;
    if (next !== state.order) {
      state = { ...state, order: next };
      syncUI();
      ctrl.draw();
    }
  }

  track.addEventListener("pointerdown", (e) => {
    draggingRail = true;
    if (track.setPointerCapture) {
      try { track.setPointerCapture(e.pointerId); } catch {}
    }
    setOrderFromClientX(e.clientX, false);
  });

  track.addEventListener("pointermove", (e) => {
    if (!draggingRail) return;
    setOrderFromClientX(e.clientX, false);
  });

  const endRailDrag = (e) => {
    if (!draggingRail) return;
    draggingRail = false;
    if (typeof e.clientX === "number") setOrderFromClientX(e.clientX, true);
  };
  track.addEventListener("pointerup", endRailDrag);
  track.addEventListener("pointercancel", () => { draggingRail = false; });

  // 显式兼容 CDP Input.dispatchTouchEvent（tools/perf.mjs 触屏测试）
  track.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      draggingRail = true;
      setOrderFromClientX(e.touches[0].clientX, false);
    },
    { passive: true }
  );
  track.addEventListener(
    "touchmove",
    (e) => {
      if (!draggingRail || !e.touches.length) return;
      setOrderFromClientX(e.touches[0].clientX, false);
    },
    { passive: true }
  );
  track.addEventListener("touchend", () => {
    draggingRail = false;
  });

  track.addEventListener("keydown", (e) => {
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -4;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 4;
    else if (e.key === "PageDown") delta = -15;
    else if (e.key === "PageUp") delta = 15;
    if (!delta) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(100, state.order + delta));
    state = { ...state, order: next };
    syncUI();
    ctrl.draw();
  });

  // 母题、间距与试错按钮
  btnShape.addEventListener("click", () => {
    state = { ...state, unifiedShape: !state.unifiedShape };
    syncUI();
    ctrl.draw();
  });

  btnColor.addEventListener("click", () => {
    state = { ...state, unifiedColor: !state.unifiedColor };
    syncUI();
    ctrl.draw();
  });

  btnGuide.addEventListener("click", () => {
    state = { ...state, showPosterGuide: !state.showPosterGuide };
    syncUI();
    ctrl.draw();
  });

  for (const b of spacingBtns) {
    b.addEventListener("click", () => {
      state = { ...state, spacing: b.dataset.spacing };
      syncUI();
      ctrl.draw();
    });
  }

  btnWallpaper.addEventListener("click", () => {
    state = createWallpaperState();
    syncUI();
    ctrl.draw();
  });

  btnReset.addEventListener("click", () => {
    state = createInitialState();
    syncUI();
    ctrl.draw();
  });

  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });

  syncUI();
  ctrl.draw();
}
