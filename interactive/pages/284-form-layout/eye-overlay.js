// 284 表单布局 · 2D Canvas 眼动扫视示波带 & 真实 DOM 眼动轨迹覆层 + 02 节分组密度标尺
// 直接轻量矢量绘制 + 按需脏绘 + rAF 合并拖动事件（零跨画布 drawImage 同步开销），硬件与软件渲染均 55–60 fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

const COLORS = {
  navy: "#001C48",
  blue: "#0848E8",
  teal: "#00A8A0",
  tealDeep: "#006B66",
  red: "#EB2C38",
  redText: "#C41E2E",
  grid: "rgba(0, 28, 72, 0.08)",
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 从真实活体表单 DOM 采一次各字段的几何锚点（避免在 drag 中重复 layout reflow）
export function measureFormGeometry(formEl, state) {
  const formRect = formEl.getBoundingClientRect();
  const width = Math.max(1, formRect.width);
  const height = Math.max(1, formRect.height);
  const isNarrow = width < 540;

  const fieldEls = [...formEl.querySelectorAll("[data-field-item]")];
  const points = [];
  const gaps = [];
  let zigzagCount = 0;

  for (let i = 0; i < fieldEls.length; i++) {
    const item = fieldEls[i];
    const fieldId = item.dataset.fieldItem;
    const isCheck = item.dataset.fieldType === "checkbox";
    const ctrl = item.querySelector("input, select, textarea");
    const lbl = item.querySelector(".lf-label");
    if (!ctrl) continue;

    const cRect = ctrl.getBoundingClientRect();
    const cx = cRect.left - formRect.left + Math.min(28, cRect.width * 0.25);
    const cy = cRect.top - formRect.top + cRect.height * 0.5;

    let badgeX = cRect.right - formRect.left - (ctrl.tagName === "SELECT" ? 28 : 11);
    let badgeY = cRect.top - formRect.top + 8;
    if (isCheck) {
      badgeX = cRect.left - formRect.left + 9;
      badgeY = cRect.top - formRect.top - 7;
    }
    badgeX = clamp(badgeX, 11, width - 11);
    badgeY = clamp(badgeY, 11, height - 11);

    let lx = cx;
    let ly = cy;
    let gapPx = 8;
    let gapRect = null;

    if (lbl && getComputedStyle(lbl).display !== "none" && !isCheck) {
      const lRect = lbl.getBoundingClientRect();
      const span = lbl.querySelector(".lf-label-text") || lbl;
      const tRect = span.getBoundingClientRect();
      const sideBySide =
        Math.abs(lRect.top - cRect.top) < Math.max(lRect.height, cRect.height) * 0.7 &&
        lRect.left < cRect.left - 4;
      if (sideBySide) {
        lx = tRect.left - formRect.left + Math.min(18, tRect.width * 0.4);
        ly = tRect.top - formRect.top + tRect.height * 0.5;
        gapPx = Math.max(0, cRect.left - tRect.right);
        if (gapPx > 22) {
          gapRect = {
            x: tRect.right - formRect.left,
            y: tRect.top - formRect.top + tRect.height * 0.5,
            w: gapPx,
          };
        }
      } else {
        lx = tRect.left - formRect.left + Math.min(18, tRect.width * 0.4);
        ly = tRect.top - formRect.top + tRect.height * 0.5;
        gapPx = Math.max(0, cRect.top - lRect.bottom);
      }
    } else if (!isCheck) {
      gapPx = 42;
    }

    if (!isCheck) gaps.push(gapPx);

    const prev = points[points.length - 1];
    let isZigzag = false;
    if (prev && Math.abs(cx - prev.cx) > 65) {
      zigzagCount++;
      isZigzag = true;
    }

    points.push({
      index: points.length + 1,
      id: fieldId,
      lx,
      ly,
      cx,
      cy,
      badgeX,
      badgeY,
      gapPx,
      gapRect,
      isZigzag,
      isError: item.classList.contains("is-error"),
      badStep: isZigzag || gapPx > 26 || (state.clarity === "placeholder-only" && !isCheck),
    });
  }

  const primaryBtn = formEl.querySelector("[data-role='submit']");
  if (primaryBtn) {
    const bRect = primaryBtn.getBoundingClientRect();
    const bx = bRect.left - formRect.left + bRect.width * 0.5;
    const by = bRect.top - formRect.top + bRect.height * 0.5;
    const prev = points[points.length - 1];
    const jumpBad = prev ? Math.abs(bx - prev.cx) > 120 && state.action !== "primary-outline" : false;
    points.push({
      index: points.length + 1,
      id: "_submit",
      lx: bx,
      ly: by,
      cx: bx,
      cy: by,
      badgeX: clamp(bRect.right - formRect.left - 11, 11, width - 11),
      badgeY: clamp(bRect.top - formRect.top + 8, 11, height - 11),
      gapPx: 0,
      gapRect: null,
      isZigzag: false,
      isError: state.action === "equal-flat" || state.action === "inverted",
      badStep: state.action === "equal-flat" || state.action === "inverted" || jumpBad,
      isAction: true,
    });
  }

  const groupEls = [...formEl.querySelectorAll(".lf-group")];
  const interGaps = [];
  for (let i = 1; i < groupEls.length; i++) {
    const prevFields = groupEls[i - 1].querySelectorAll("[data-field-item]");
    const nextFields = groupEls[i].querySelectorAll("[data-field-item]");
    if (prevFields.length && nextFields.length) {
      const a = prevFields[prevFields.length - 1].getBoundingClientRect();
      const b = nextFields[0].getBoundingClientRect();
      const d = b.top - a.bottom;
      if (d > 0) interGaps.push(d);
    }
  }
  const intraGaps = [];
  for (const g of groupEls) {
    const fItems = [...g.querySelectorAll("[data-field-item]")];
    for (let i = 1; i < fItems.length; i++) {
      const a = fItems[i - 1].getBoundingClientRect();
      const b = fItems[i].getBoundingClientRect();
      if (b.top > a.bottom + 2) intraGaps.push(b.top - a.bottom);
    }
  }
  const avgIntra = intraGaps.length ? intraGaps.reduce((s, v) => s + v, 0) / intraGaps.length : 14;
  const avgInter = interGaps.length ? interGaps.reduce((s, v) => s + v, 0) / interGaps.length : avgIntra;
  let groupRatio = avgInter / Math.max(8, avgIntra);
  if (state.grouping === "flat") groupRatio = Math.min(1.08, Math.max(0.96, groupRatio));
  if (state.grouping === "overboxed") groupRatio = Math.min(1.22, groupRatio);

  let totalPathPx = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    totalPathPx += Math.hypot(p.cx - p.lx, p.cy - p.ly);
    if (i > 0) {
      const prev = points[i - 1];
      totalPathPx += Math.hypot(p.lx - prev.cx, p.ly - prev.cy);
    }
  }

  const avgLabelGapPx = gaps.length ? gaps.reduce((s, v) => s + v, 0) / gaps.length : 10;

  return {
    width,
    height,
    isNarrow,
    points,
    avgLabelGapPx,
    zigzagCount,
    groupRatio,
    totalPathPx,
  };
}

function sizeCanvas(canvas, w, h, maxDpr = 1.5) {
  const dpr = pixelRatio(maxDpr);
  const pw = Math.max(1, Math.round(w * dpr));
  const ph = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  return dpr;
}

export function createEyeSystem({ scrubberCanvas, overlayCanvas, getState, getGeometry, onScrub }) {
  const initTarget = getState().scrubber;
  let activeProgress = reducedMotion.matches ? initTarget : 0.14;
  let targetProgress = initTarget;
  let dragging = false;
  let dirtyFrame = true;
  let cachedScrubW = 0;
  let cachedScrubH = 0;

  function drawScrubber() {
    if (!cachedScrubW || !cachedScrubH) {
      const rect = scrubberCanvas.getBoundingClientRect();
      cachedScrubW = rect.width;
      cachedScrubH = rect.height;
    }
    const w = cachedScrubW;
    const h = cachedScrubH;
    if (w < 20 || h < 16) return;

    const dpr = sizeCanvas(scrubberCanvas, w, h, 1.5);
    const ctx = scrubberCanvas.getContext("2d");
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const geo = getGeometry();
    const pts = geo.points || [];

    const padX = 16;
    const trackW = Math.max(10, w - padX * 2);
    const topSafeY = 22;
    const baseY = h - 11;

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, baseY);
    ctx.lineTo(w - padX, baseY);
    ctx.moveTo(padX, topSafeY);
    ctx.lineTo(w - padX, topSafeY);
    ctx.stroke();

    const n = Math.max(2, pts.length);
    const amp = Math.max(8, baseY - topSafeY - 4);
    const xs = new Array(n);
    const ys = new Array(n);
    let anyBad = false;

    for (let i = 0; i < n; i++) {
      const p = pts[i] || { gapPx: 10, isZigzag: false, badStep: false };
      if (p.badStep) anyBad = true;
      const u = n > 1 ? i / (n - 1) : 0;
      const x = padX + u * trackW;
      const spike = Math.min(1, p.gapPx / 105 + (p.isZigzag ? 0.5 : 0) + (p.isError ? 0.25 : 0));
      const y = baseY - 3 - spike * amp;
      xs[i] = x;
      ys[i] = y;

      ctx.strokeStyle = p.badStep ? "rgba(235, 44, 56, 0.30)" : "rgba(0, 168, 160, 0.30)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (i === 0) ctx.moveTo(xs[i], ys[i]);
      else ctx.lineTo(xs[i], ys[i]);
    }
    ctx.strokeStyle = anyBad ? "rgba(235, 44, 56, 0.72)" : "rgba(8, 72, 232, 0.75)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const curX = padX + activeProgress * trackW;
    ctx.strokeStyle = anyBad ? COLORS.red : COLORS.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(padX, baseY);
    ctx.lineTo(curX, baseY);
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const p = pts[i] || {};
      ctx.beginPath();
      ctx.arc(xs[i], ys[i], xs[i] <= curX + 2 ? 3.4 : 2.4, 0, Math.PI * 2);
      ctx.fillStyle = p.badStep ? COLORS.red : p.isAction ? COLORS.blue : COLORS.teal;
      ctx.fill();
    }

    ctx.strokeStyle = anyBad ? "rgba(235, 44, 56, 0.55)" : "rgba(8, 72, 232, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, topSafeY - 2);
    ctx.lineTo(curX, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(curX, baseY, 9.5, 0, Math.PI * 2);
    ctx.fillStyle = anyBad ? "rgba(235, 44, 56, 0.16)" : "rgba(8, 72, 232, 0.16)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(curX, baseY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = anyBad ? COLORS.red : COLORS.blue;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(curX, baseY, 2.3, 0, Math.PI * 2);
    ctx.fillStyle = anyBad ? COLORS.red : COLORS.blue;
    ctx.fill();

    ctx.font = '600 11px "DM Mono", monospace';
    ctx.fillStyle = COLORS.navy;
    ctx.textBaseline = "top";
    const stepIdx = Math.min(n, Math.max(1, Math.round(activeProgress * (n - 1)) + 1));
    ctx.fillText(`EYE PATH ${String(stepIdx).padStart(2, "0")}/${String(n).padStart(2, "0")}`, padX, 4);

    ctx.textAlign = "right";
    ctx.fillStyle = anyBad ? COLORS.redText : COLORS.tealDeep;
    ctx.fillText(anyBad ? "← 横拖回放折返与裂口 →" : "← 横拖回放顺滑视线轨 →", w - padX, 4);

    ctx.restore();
  }

  function drawOverlay() {
    const geo = getGeometry();
    const state = getState();
    const w = geo.width || overlayCanvas.clientWidth;
    const h = geo.height || overlayCanvas.clientHeight;
    if (w < 20 || h < 20) return;

    const dpr = sizeCanvas(overlayCanvas, w, h, 1.5);
    const ctx = overlayCanvas.getContext("2d");
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pts = geo.points || [];
    if (!state.showOverlay || !pts.length) {
      ctx.restore();
      return;
    }

    // 1. 左置左对齐横向裂口红尺标注
    for (const p of pts) {
      if (p.gapRect && p.gapRect.w > 22) {
        const { x, y, w: gw } = p.gapRect;
        ctx.fillStyle = "rgba(235, 44, 56, 0.12)";
        ctx.fillRect(x + 2, y - 9, gw - 4, 18);
        ctx.strokeStyle = "rgba(235, 44, 56, 0.78)";
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + gw - 4, y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (gw > 34) {
          ctx.font = '600 10px "DM Mono", monospace';
          ctx.fillStyle = COLORS.redText;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${Math.round(gw)}px`, x + gw * 0.5, y);
        }
      }
    }

    // 2. 构建完整视线轨迹折线
    const poly = [];
    for (const p of pts) {
      poly.push({ x: p.lx, y: p.ly, bad: p.badStep });
      if (Math.hypot(p.cx - p.lx, p.cy - p.ly) > 4) {
        poly.push({ x: p.cx, y: p.cy, bad: p.badStep });
      }
    }

    ctx.beginPath();
    for (let i = 0; i < poly.length; i++) {
      if (i === 0) ctx.moveTo(poly[i].x, poly[i].y);
      else ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.strokeStyle = "rgba(8, 72, 232, 0.15)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    const maxSeg = Math.max(1, poly.length - 1);
    const exactIdx = activeProgress * maxSeg;
    const stopIdx = Math.floor(exactIdx);
    const frac = exactIdx - stopIdx;

    for (let i = 0; i < Math.min(stopIdx + 1, poly.length - 1); i++) {
      const a = poly[i];
      const b = poly[i + 1];
      const endX = i === stopIdx ? a.x + (b.x - a.x) * frac : b.x;
      const endY = i === stopIdx ? a.y + (b.y - a.y) * frac : b.y;
      const horizJump = Math.abs(b.x - a.x) > 55;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = horizJump || b.bad ? "rgba(235, 44, 56, 0.70)" : "rgba(0, 168, 160, 0.76)";
      ctx.lineWidth = horizJump ? 2.2 : 1.9;
      ctx.stroke();
    }

    // 3. 控件右上角序号角标（钳位在安全内边距，绝不遮挡文字也不切边）
    ctx.font = '700 10px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const reached = i / Math.max(1, pts.length - 1) <= activeProgress + 0.03;
      const bx = p.badgeX;
      const by = p.badgeY;
      ctx.beginPath();
      ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = reached
        ? (p.badStep ? COLORS.red : p.isAction ? COLORS.blue : COLORS.tealDeep)
        : "rgba(255,255,255,0.94)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = p.badStep ? COLORS.red : p.isAction ? COLORS.blue : COLORS.teal;
      ctx.stroke();
      ctx.fillStyle = reached ? "#FFFFFF" : COLORS.navy;
      ctx.fillText(String(p.index), bx, by + 0.5);
    }

    // 4. 当前实时注视光圈
    const curA = poly[Math.min(stopIdx, poly.length - 1)];
    const curB = poly[Math.min(stopIdx + 1, poly.length - 1)];
    const gx = curA.x + (curB.x - curA.x) * frac;
    const gy = curA.y + (curB.y - curA.y) * frac;
    const badNow = curB.bad || curA.bad;

    ctx.beginPath();
    ctx.arc(gx, gy, 13, 0, Math.PI * 2);
    ctx.fillStyle = badNow ? "rgba(235, 44, 56, 0.22)" : "rgba(8, 72, 232, 0.20)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(gx, gy, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = badNow ? COLORS.red : COLORS.blue;
    ctx.stroke();

    ctx.restore();
  }

  function pointerToProgress(clientX) {
    const r = scrubberCanvas.getBoundingClientRect();
    cachedScrubW = r.width;
    cachedScrubH = r.height;
    const padX = 16;
    const u = (clientX - r.left - padX) / Math.max(1, r.width - padX * 2);
    return clamp(u, 0, 1);
  }

  // 拖动时仅更新状态并标脏，由 rAF 合并每帧最多重画 1 次（彻底避免 touchMove 风暴）
  const onDown = (e) => {
    dragging = true;
    if (e.pointerId != null && scrubberCanvas.setPointerCapture) {
      try { scrubberCanvas.setPointerCapture(e.pointerId); } catch {}
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    targetProgress = pointerToProgress(clientX);
    activeProgress = targetProgress;
    dirtyFrame = true;
    onScrub(activeProgress);
    if (reducedMotion.matches) ctrl.draw();
  };
  const onMove = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    targetProgress = pointerToProgress(clientX);
    activeProgress = targetProgress;
    dirtyFrame = true;
    onScrub(activeProgress);
    if (reducedMotion.matches) ctrl.draw();
  };
  const onUp = () => {
    dragging = false;
  };

  scrubberCanvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  scrubberCanvas.addEventListener("touchstart", onDown, { passive: true });
  scrubberCanvas.addEventListener("touchmove", onMove, { passive: true });
  scrubberCanvas.addEventListener("touchend", onUp, { passive: true });

  scrubberCanvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      targetProgress = Math.min(1, activeProgress + 0.08);
      activeProgress = targetProgress;
      dirtyFrame = true;
      onScrub(activeProgress);
      ctrl.draw();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      targetProgress = Math.max(0, activeProgress - 0.08);
      activeProgress = targetProgress;
      dirtyFrame = true;
      onScrub(activeProgress);
      ctrl.draw();
    }
  });

  const ctrl = loop(scrubberCanvas, (_t, dt, { still }) => {
    let animating = false;
    if (still) {
      if (Math.abs(targetProgress - activeProgress) > 0.001) {
        activeProgress = targetProgress;
        dirtyFrame = true;
      }
    } else if (!dragging) {
      const diff = targetProgress - activeProgress;
      if (Math.abs(diff) > 0.002) {
        activeProgress += diff * Math.min(1, Math.max(dt, 0.016) * 5.2);
        dirtyFrame = true;
        animating = true;
      } else if (activeProgress !== targetProgress) {
        activeProgress = targetProgress;
        dirtyFrame = true;
      }
    }

    if (!dirtyFrame && !animating) return;
    dirtyFrame = false;
    drawScrubber();
    drawOverlay();
  });

  return {
    focusField(fieldId) {
      const pts = getGeometry().points || [];
      const idx = pts.findIndex((p) => p.id === fieldId);
      if (idx >= 0) {
        targetProgress = pts.length > 1 ? idx / (pts.length - 1) : 0;
        if (reducedMotion.matches) activeProgress = targetProgress;
        dirtyFrame = true;
        onScrub(targetProgress);
        ctrl.draw();
      }
    },
    setProgress(u) {
      targetProgress = clamp(u, 0, 1);
      if (reducedMotion.matches) activeProgress = targetProgress;
      dirtyFrame = true;
      ctrl.draw();
    },
    redraw() {
      cachedScrubW = 0;
      cachedScrubH = 0;
      dirtyFrame = true;
      ctrl.draw();
    },
  };
}

// 02 节分组密度标尺 2D Canvas（按需脏绘）
export function createChunkMeter(canvas, getEval) {
  let dirty = true;
  let lastW = 0;
  const ctrl = loop(canvas, () => {
    const r = canvas.getBoundingClientRect();
    if (r.width < 20 || r.height < 16) return;
    if (!dirty && Math.abs(r.width - lastW) < 1) return;
    lastW = r.width;
    dirty = false;

    const dpr = sizeCanvas(canvas, r.width, r.height, 1.5);
    const ctx = canvas.getContext("2d");
    const w = r.width;
    const h = r.height;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const data = getEval();
    const sizes = data.sizes;
    const total = sizes.reduce((s, v) => s + v, 0);
    const padX = 12;
    const gap = sizes.length > 1 ? 10 : 0;
    const usableW = Math.max(20, w - padX * 2 - gap * (sizes.length - 1));

    let curX = padX;
    for (let i = 0; i < sizes.length; i++) {
      const bw = (sizes[i] / total) * usableW;
      const isBad = sizes.length === 1 || sizes[i] === 1 || sizes.length >= 6;
      const col = isBad ? COLORS.red : i % 2 === 0 ? COLORS.blue : COLORS.tealDeep;
      const fill = isBad
        ? "rgba(235, 44, 56, 0.14)"
        : i % 2 === 0
          ? "rgba(8, 72, 232, 0.13)"
          : "rgba(0, 168, 160, 0.16)";

      ctx.fillStyle = fill;
      ctx.fillRect(curX, 12, bw, h - 24);
      ctx.fillStyle = col;
      ctx.fillRect(curX, 12, bw, 4);

      if (bw > 30) {
        ctx.font = '600 11px "DM Mono", monospace';
        ctx.fillStyle = COLORS.navy;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`组${i + 1}·${sizes[i]}项`, curX + bw * 0.5, h * 0.5 + 2);
      }
      curX += bw + gap;
    }

    ctx.restore();
  });

  return {
    redraw: () => {
      dirty = true;
      ctrl.draw();
    },
  };
}
