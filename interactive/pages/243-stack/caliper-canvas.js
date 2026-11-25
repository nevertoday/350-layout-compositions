// 243 堆栈 STACK · 2D 画布模块
// 1) 开场「间距与边距 X 光游标尺」（data-perf-drag，底轨与刻度离屏缓存，鼠/触/键 60fps 平滑直拖）
// 2) 第 02 节「双层嵌套堆栈节奏剖面」

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { GAP_MAX, GAP_MIN, GAP_SWEET_MAX, GAP_SWEET_MIN } from "./model.js";

const PAL = {
  forestDeep: "#182307",
  forest: "#23310B",
  cream: "#F3E6CF",
  pink: "#F396A0",
  pinkBright: "#F59CA4",
  olive: "#848E4F",
  oliveBright: "#B8C66B",
  ink: "#101010",
  err: "#FF7A7A",
  errDark: "#B31D28",
  ok: "#7FE0A4",
  okDark: "#156E42",
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawHatchFast(ctx, x, y, w, h, color, step = 5) {
  if (w <= 2 || h <= 2) return;
  ctx.beginPath();
  for (let d = 0; d < w + h; d += step) {
    const x1 = x + Math.max(0, d - h);
    const y1 = y + Math.min(h, d);
    const x2 = x + Math.min(w, d);
    const y2 = y + Math.max(0, d - w);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// =========================================================================
// 1. 开场横向 2D「间距与边距 X 光游标尺」（标有 data-perf-drag）
// =========================================================================
export function mountGapCaliper(canvas, { getEval, onGapInput, onGapCommit }) {
  const ctx = canvas.getContext("2d");
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");

  let w = 0;
  let h = 0;
  let dpr = 1;
  let bgKey = "";
  let cachedRect = null;

  let dragging = false;
  let activeInput = "";
  let pointerId = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLocked = false;

  let intro = reducedMotion.matches ? 1 : 0;
  let targetGap = getEval().gap;
  let visualGap = targetGap;
  let lastDomSyncTs = 0;
  let lastSyncedGap = targetGap;
  let dirty = true;

  const PAD_L = 18;
  const PAD_R = 18;

  function gapToX(g) {
    const trackW = Math.max(10, w - PAD_L - PAD_R);
    return PAD_L + ((g - GAP_MIN) / (GAP_MAX - GAP_MIN)) * trackW;
  }

  function rebuildBg(ownerOk) {
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, w, h);

    // 底层深橄榄刻度底槽
    roundRect(bgCtx, 0.5, 0.5, w - 1, h - 1, 10);
    bgCtx.fillStyle = PAL.forestDeep;
    bgCtx.fill();
    bgCtx.strokeStyle = ownerOk ? "rgba(184, 198, 107, 0.45)" : "rgba(255, 122, 122, 0.55)";
    bgCtx.lineWidth = 1.25;
    bgCtx.stroke();

    const trackY = h - 22;
    const trackW = w - PAD_L - PAD_R;
    const sweetX1 = gapToX(GAP_SWEET_MIN);
    const sweetX2 = gapToX(GAP_SWEET_MAX);

    // 上半部分 X 光剖面底槽
    bgCtx.fillStyle = "rgba(46, 62, 20, 0.72)";
    bgCtx.fillRect(PAD_L, 9, trackW, 16);

    // 下半部分标尺底轨 + 甜区高亮
    bgCtx.fillStyle = "rgba(243, 230, 207, 0.14)";
    bgCtx.fillRect(PAD_L, trackY - 3, trackW, 6);

    bgCtx.fillStyle = ownerOk ? "rgba(184, 198, 107, 0.42)" : "rgba(243, 230, 207, 0.18)";
    bgCtx.fillRect(sweetX1, trackY - 4, sweetX2 - sweetX1, 8);

    // 13 条刻度线合并绘制
    bgCtx.beginPath();
    for (let g = 0; g <= GAP_MAX; g += 4) {
      const tx = gapToX(g);
      bgCtx.moveTo(tx, trackY + 6);
      bgCtx.lineTo(tx, trackY + (g % 12 === 0 ? 11 : 8.5));
    }
    bgCtx.strokeStyle = "rgba(243, 230, 207, 0.32)";
    bgCtx.lineWidth = 1;
    bgCtx.stroke();

    // 刻度数字只在重建缓存时画一次（拖动期 0 次静态 fillText！）
    bgCtx.font = '500 10px "DM Mono", monospace';
    bgCtx.fillStyle = "rgba(243, 230, 207, 0.8)";
    bgCtx.textBaseline = "top";
    for (const g of [0, 12, 24, 32, 48]) {
      const tx = gapToX(g);
      bgCtx.textAlign = g === 0 ? "left" : g === 48 ? "right" : "center";
      bgCtx.fillText(`${g}`, tx, trackY + 11);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cachedRect = rect;
    const nw = Math.max(240, Math.round(rect.width));
    const nh = Math.max(54, Math.round(rect.height));
    const ndpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      bgKey = "";
      dirty = true;
    }
  }

  function clientXToGap(clientX) {
    const rect = cachedRect || canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const trackW = Math.max(10, rect.width - PAD_L - PAD_R);
    const ratio = Math.max(0, Math.min(1, (x - PAD_L) / trackW));
    return Math.round(GAP_MIN + ratio * (GAP_MAX - GAP_MIN));
  }

  function renderFrame(_t, dt, { still }) {
    if (!w || !h) resize();
    const ev = getEval();
    if (!dragging) targetGap = ev.gap;

    if (still) {
      intro = 1;
      visualGap = targetGap;
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.4);
        dirty = true;
      }
      if (dragging) {
        if (Math.abs(targetGap - visualGap) > 0.01) {
          visualGap = targetGap;
          dirty = true;
        }
        if (activeInput === "pointer") {
          const now = performance.now();
          if (targetGap !== lastSyncedGap && now - lastDomSyncTs >= 120) {
            lastDomSyncTs = now;
            lastSyncedGap = targetGap;
            onGapInput(targetGap);
          }
        }
      } else {
        const diff = targetGap - visualGap;
        if (Math.abs(diff) > 0.08) {
          visualGap += diff * Math.min(1, Math.max(dt, 0.016) * 18);
          dirty = true;
        } else if (visualGap !== targetGap) {
          visualGap = targetGap;
          dirty = true;
        }
      }
    }

    if (!dirty && !dragging && intro >= 1 && !still) return;
    dirty = false;

    const nextBgKey = `${w}x${h}@${dpr}|${ev.ownerOk}`;
    if (bgKey !== nextBgKey) {
      rebuildBg(ev.ownerOk);
      bgKey = nextBgKey;
    }

    const ease = 1 - Math.pow(1 - intro, 3);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const trackY = h - 22;
    const trackW = w - PAD_L - PAD_R;

    // 实时 X 光缩略堆栈条（纯 fillRect，极轻）
    const miniY = 9;
    const miniH = 16;
    const blocks = ev.blocks;
    const n = blocks.length;
    if (n > 0) {
      const toneMap = { cream: PAL.cream, pink: PAL.pink, olive: PAL.olive };
      const unitScale = Math.min(1.15, (trackW - 12) / Math.max(180, n * 48 + Math.max(0, n - 1) * visualGap));
      const slabW = Math.max(24, Math.min(54, 42 * unitScale));
      const gPx =
        ev.owner === "negative"
          ? -8
          : ev.owner === "child-margin"
          ? Math.max(6, visualGap * 0.55)
          : visualGap * 0.68;
      const totalSpan = n * slabW + Math.max(0, n - 1) * gPx;
      let sx = Math.max(PAD_L + 4, PAD_L + (trackW - totalSpan) / 2);

      if (ev.owner === "child-margin") {
        const leakW = Math.min(18, 7 + ev.topLeak * 0.32) * ease;
        const lx = Math.max(PAD_L, sx - leakW);
        ctx.fillStyle = "rgba(255, 122, 122, 0.24)";
        ctx.fillRect(lx, miniY + 2, leakW, miniH - 4);
        drawHatchFast(ctx, lx, miniY + 2, leakW, miniH - 4, PAL.err, 5);
      }

      for (let i = 0; i < n; i++) {
        const b = blocks[i];
        if (i > 0) {
          const prevStep = ev.owner === "child-margin" ? (i % 2 ? gPx * 1.4 : gPx * 0.65) : gPx;
          const prevX = sx - prevStep;
          if (ev.owner === "negative") {
            ctx.fillStyle = "rgba(255, 122, 122, 0.45)";
            ctx.fillRect(sx, miniY + 2, 8, miniH - 4);
          } else if (prevStep > 1) {
            ctx.fillStyle =
              ev.owner === "child-margin"
                ? "rgba(255, 122, 122, 0.35)"
                : visualGap < GAP_SWEET_MIN || visualGap > GAP_SWEET_MAX
                ? "rgba(255, 122, 122, 0.38)"
                : "rgba(127, 224, 164, 0.36)";
            ctx.fillRect(prevX + 1, miniY + 4, Math.max(1, prevStep - 2), miniH - 8);
          }
        }
        ctx.fillStyle = toneMap[b.tone] || PAL.cream;
        ctx.fillRect(sx, miniY + 3, Math.max(4, slabW * ease), miniH - 6);
        const nextStep = ev.owner === "child-margin" ? (i % 2 === 0 ? gPx * 1.4 : gPx * 0.65) : gPx;
        sx += slabW + nextStep;
      }

      if (ev.owner === "child-margin") {
        const lastStep = n % 2 === 1 ? gPx * 1.4 : gPx * 0.65;
        const lastRight = Math.min(PAD_L + trackW - 4, sx - lastStep);
        const leakW = Math.min(18, 7 + ev.bottomLeak * 0.32) * ease;
        const rw = Math.min(leakW, PAD_L + trackW - lastRight);
        ctx.fillStyle = "rgba(255, 122, 122, 0.24)";
        ctx.fillRect(lastRight, miniY + 2, rw, miniH - 4);
        drawHatchFast(ctx, lastRight, miniY + 2, rw, miniH - 4, PAL.err, 5);
      }
    }

    // 游标进度条 + 手柄
    const knobX = gapToX(visualGap);
    const activeColor = !ev.ownerOk
      ? PAL.err
      : visualGap < GAP_SWEET_MIN || visualGap > GAP_SWEET_MAX
      ? PAL.err
      : PAL.pinkBright;

    ctx.fillStyle = activeColor;
    ctx.fillRect(PAD_L, trackY - 3, Math.max(0, knobX - PAD_L), 6);

    ctx.beginPath();
    ctx.arc(knobX, trackY, dragging ? 10.5 : 9, 0, Math.PI * 2);
    ctx.fillStyle = PAL.cream;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = activeColor;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(knobX, trackY, 3, 0, Math.PI * 2);
    ctx.fillStyle = PAL.ink;
    ctx.fill();

    // 静置与桌面端显示胶囊数字；移动端快速触摸扫动时跳过昂贵的软件文字栅格化
    if (!(dragging && activeInput === "touch")) {
      const label = ev.owner === "negative" ? "-18px" : `${Math.round(visualGap)}px`;
      const tw = label.length * 7 + 12;
      const pillX = Math.max(PAD_L, Math.min(w - PAD_R - tw, knobX - tw / 2));
      const pillY = trackY - 25;
      roundRect(ctx, pillX, pillY, tw, 16, 4);
      ctx.fillStyle = activeColor;
      ctx.fill();
      ctx.fillStyle = PAL.ink;
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, pillX + tw / 2, pillY + 8.5);
    }
  }

  const runner = loop(canvas, renderFrame);

  function queueClientX(cx) {
    const nextGap = clientXToGap(cx);
    targetGap = nextGap;
    dirty = true;
  }

  function finishDrag() {
    if (!dragging) return;
    dragging = false;
    activeInput = "";
    pointerId = null;
    touchLocked = false;
    lastSyncedGap = targetGap;
    dirty = true;
    onGapCommit(targetGap);
    runner.draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || activeInput === "touch") return;
    if (e.button !== undefined && e.button !== 0) return;
    cachedRect = canvas.getBoundingClientRect();
    dragging = true;
    activeInput = "pointer";
    pointerId = e.pointerId;
    lastDomSyncTs = performance.now();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    queueClientX(e.clientX);
    onGapInput(targetGap);
    lastSyncedGap = targetGap;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || activeInput !== "pointer") return;
    if (pointerId !== null && e.pointerId !== pointerId) return;
    queueClientX(e.clientX);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (activeInput !== "pointer") return;
    if (pointerId !== null && e.pointerId !== pointerId) return;
    finishDrag();
  });
  canvas.addEventListener("pointercancel", () => {
    if (activeInput === "pointer") finishDrag();
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      cachedRect = canvas.getBoundingClientRect();
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchLocked = false;
      dragging = true;
      activeInput = "touch";
      lastDomSyncTs = performance.now();
      queueClientX(t.clientX);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (!touchLocked && (dx > 4 || dy > 4)) {
        touchLocked = dx >= dy;
      }
      if (touchLocked || dx >= dy) {
        if (e.cancelable) e.preventDefault();
        dragging = true;
        activeInput = "touch";
        queueClientX(t.clientX);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      if (activeInput === "touch") finishDrag();
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchcancel",
    () => {
      if (activeInput === "touch") finishDrag();
    },
    { passive: true }
  );

  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 6 : 2;
    const cur = getEval().gap;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(GAP_MIN, cur - step);
      targetGap = next;
      visualGap = next;
      onGapCommit(next);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(GAP_MAX, cur + step);
      targetGap = next;
      visualGap = next;
      onGapCommit(next);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      targetGap = GAP_MIN;
      visualGap = GAP_MIN;
      onGapCommit(GAP_MIN);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      targetGap = GAP_MAX;
      visualGap = GAP_MAX;
      onGapCommit(GAP_MAX);
    }
  });

  window.addEventListener("resize", () => {
    resize();
    runner.draw();
  });

  return {
    sync() {
      targetGap = getEval().gap;
      lastSyncedGap = targetGap;
      bgKey = "";
      dirty = true;
      runner.draw();
    },
  };
}

// =========================================================================
// 2. 第 02 节「双层嵌套堆栈节奏剖面」2D 画布
// =========================================================================
export function mountNestingCanvas(canvas, { getNesting }) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(240, Math.round(rect.width));
    const nh = Math.max(210, Math.round(rect.height));
    const ndpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  }

  function drawFrame(_t, _dt, { still }) {
    if (!w || !h) resize();
    if (!dirty && !still) return;
    dirty = false;

    const { outer, inner, ratio, tone } = getNesting();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 12);
    ctx.fillStyle = "#FAF3E6";
    ctx.fill();
    ctx.strokeStyle = "rgba(35, 49, 11, 0.16)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    const padX = 20;
    const rulerX = w - 82;
    const cardW = Math.max(120, rulerX - padX - 18);

    const sOuter = Math.max(4, Math.min(44, outer * 0.85));
    const sInner = Math.max(2, Math.min(28, inner * 0.85));
    const hTitle = 16;
    const hBody = 14;
    const hBtn = 24;

    const totalH = (hTitle + sInner + hBody) * 2 + sOuter * 2 + hBtn;
    let y = Math.max(16, (h - totalH) / 2);

    const g1Top = y;
    roundRect(ctx, padX, y, cardW * 0.56, hTitle, 4);
    ctx.fillStyle = PAL.forest;
    ctx.fill();
    y += hTitle;

    ctx.fillStyle = tone === "err" && outer < inner ? "rgba(179, 29, 40, 0.28)" : "rgba(243, 150, 160, 0.55)";
    ctx.fillRect(padX, y, cardW, sInner);
    drawRulerTick(ctx, rulerX, y, sInner, `内 ${inner}px`, "#9E2438");
    y += sInner;

    roundRect(ctx, padX, y, cardW * 0.92, hBody, 4);
    ctx.fillStyle = "rgba(35, 49, 11, 0.22)";
    ctx.fill();
    y += hBody;

    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(158, 36, 56, 0.5)";
    ctx.lineWidth = 1;
    roundRect(ctx, padX - 5, g1Top - 4, cardW + 10, y - g1Top + 8, 6);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = tone === "ok" ? "rgba(132, 142, 79, 0.36)" : "rgba(179, 29, 40, 0.2)";
    ctx.fillRect(padX, y, cardW, sOuter);
    drawRulerTick(ctx, rulerX, y, sOuter, `外 ${outer}px`, tone === "ok" ? "#3B4914" : "#B31D28");
    y += sOuter;

    const g2Top = y;
    roundRect(ctx, padX, y, cardW * 0.48, hTitle, 4);
    ctx.fillStyle = PAL.forest;
    ctx.fill();
    y += hTitle;

    ctx.fillStyle = "rgba(243, 150, 160, 0.55)";
    ctx.fillRect(padX, y, cardW, sInner);
    y += sInner;

    roundRect(ctx, padX, y, cardW * 0.85, hBody, 4);
    ctx.fillStyle = "rgba(35, 49, 11, 0.22)";
    ctx.fill();
    y += hBody;

    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(158, 36, 56, 0.5)";
    ctx.lineWidth = 1;
    roundRect(ctx, padX - 5, g2Top - 4, cardW + 10, y - g2Top + 8, 6);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = tone === "ok" ? "rgba(132, 142, 79, 0.36)" : "rgba(179, 29, 40, 0.2)";
    ctx.fillRect(padX, y, cardW, sOuter);
    y += sOuter;

    roundRect(ctx, padX, y, Math.min(130, cardW * 0.55), hBtn, 6);
    ctx.fillStyle = PAL.olive;
    ctx.fill();
    ctx.fillStyle = PAL.ink;
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("操作区", padX + Math.min(130, cardW * 0.55) / 2, y + hBtn / 2 + 0.5);

    ctx.font = '500 11px "DM Mono", monospace';
    ctx.fillStyle = tone === "ok" ? PAL.okDark : PAL.errDark;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`外/内 = ${ratio.toFixed(1)}×`, w - 14, h - 10);
  }

  function drawRulerTick(ctx, x, y, span, text, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 3, y + span);
    ctx.moveTo(x, y + span);
    ctx.lineTo(x + 6, y + span);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = '500 11px "DM Mono", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 10, y + span / 2);
    ctx.restore();
  }

  const runner = loop(canvas, drawFrame);
  window.addEventListener("resize", () => {
    resize();
    runner.draw();
  });

  return {
    sync() {
      dirty = true;
      runner.draw();
    },
  };
}
