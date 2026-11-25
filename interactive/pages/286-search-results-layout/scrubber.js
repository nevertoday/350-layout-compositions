// 开场 2D Canvas：摘要预算窗 × 首屏注意力衰减游标尺（data-perf-drag）
// 横拖直接改变摘要预算字数（0–155 字），实时重绘词元切片、舒适带与首屏截断线
import { loop, pixelRatio } from "../../lib/stage.js";

const PAL = {
  paper: "#FFFDF8",
  band: "#F4EDE0",
  ink: "#141311",
  muted: "#5E574E",
  cobalt: "#2A508E",
  cobaltDeep: "#1E3E78",
  cobaltSoft: "#E4EBF4",
  rust: "#B6481E",
  rustSoft: "rgba(182, 72, 30, 0.14)",
  green: "#275A3A",
  greenSoft: "rgba(39, 90, 58, 0.13)",
  red: "#B4232C",
  redSoft: "rgba(180, 35, 44, 0.13)",
  rule: "#DDD5C6",
};

export function createScrubber(canvas, { getEval, getState, onChange }) {
  const ctx = canvas.getContext("2d");
  let w = 640;
  let h = 114;
  let dragging = false;
  let activePointer = null;
  let targetChars = getState().snippetChars;
  let visualChars = targetChars;
  let lastNotified = targetChars;
  let lastNotifyTs = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function trackBounds() {
    const padX = w < 420 ? 12 : 16;
    return { x0: padX, x1: w - padX, span: Math.max(80, w - padX * 2) };
  }

  function charsToX(chars) {
    const { x0, span } = trackBounds();
    return x0 + (Math.max(0, Math.min(155, chars)) / 155) * span;
  }

  function xToChars(clientX) {
    const rect = canvas.getBoundingClientRect();
    const { x0, span } = trackBounds();
    const localX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (localX - x0) / span));
    return Math.round(ratio * 155);
  }

  function pushValue(val, forceNow = false) {
    const clamped = Math.max(0, Math.min(155, Math.round(val)));
    targetChars = clamped;
    visualChars = clamped;
    const now = performance.now();
    // 节流同步给下方 DOM 卡片（32ms 一次，抬手立刻同步），确保拖动画布稳 60fps
    if (forceNow || (clamped !== lastNotified && now - lastNotifyTs >= 32)) {
      lastNotified = clamped;
      lastNotifyTs = now;
      onChange(clamped);
    }
    ctrl.draw();
  }

  // 同时接 Pointer 与 Touch（确保 perf.mjs 的 CDP touch 事件和真手指一样零延迟）
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLock = null; // "h" | "v" | null

  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchLock = null;
    dragging = true;
    pushValue(xToChars(t.clientX), false);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches.length) return;
    const t = e.touches[0];
    if (!touchLock) {
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (dx > 4 || dy > 4) touchLock = dx >= dy ? "h" : "v";
    }
    if (touchLock === "v") {
      dragging = false;
      return;
    }
    if (e.cancelable) e.preventDefault();
    pushValue(xToChars(t.clientX), false);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (dragging) {
      dragging = false;
      pushValue(targetChars, true);
    }
    touchLock = null;
  }, { passive: true });

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    activePointer = e.pointerId;
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    pushValue(xToChars(e.clientX), true);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !dragging || e.pointerId !== activePointer) return;
    pushValue(xToChars(e.clientX), false);
  });

  const endPointer = (e) => {
    if (e.pointerType === "touch" || !dragging) return;
    dragging = false;
    activePointer = null;
    pushValue(targetChars, true);
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 15 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      pushValue(getState().snippetChars - step, true);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      pushValue(getState().snippetChars + step, true);
    }
  });

  function roundRect(x, y, rw, rh, r) {
    const rr = Math.min(r, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
    ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
    ctx.arcTo(x, y + rh, x, y, rr);
    ctx.arcTo(x, y, x + rw, y, rr);
    ctx.closePath();
  }

  function render(t, dt, { still }) {
    resize();
    const st = getState();
    const ev = getEval();
    targetChars = st.snippetChars;
    if (still || dragging) {
      visualChars = targetChars;
    } else {
      visualChars += (targetChars - visualChars) * Math.min(1, dt * 14 + 0.12);
      if (Math.abs(targetChars - visualChars) < 0.25) visualChars = targetChars;
    }

    const { x0, x1, span } = trackBounds();
    const [optMin, optMax] = ev.optimalRange;
    const inSweet = visualChars >= optMin && visualChars <= optMax;
    const accent = inSweet ? PAL.green : PAL.rust;
    const compact = w < 420;

    // 背景
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, w, h);

    // 顶部信息行
    ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.ink;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(compact ? "摘要预算窗 · 横拖裁切" : "摘要预算窗 × 首屏可见条数（横拖调节 0–155 字）", x0, 8);

    ctx.textAlign = "right";
    ctx.font = `600 ${compact ? 11 : 12}px "JetBrains Mono", monospace`;
    ctx.fillStyle = inSweet ? PAL.green : PAL.red;
    const statusText = `${Math.round(visualChars)} 字 · 首屏 ≈ ${ev.foldCount} 条`;
    ctx.fillText(statusText, x1, 8);

    // 轨道主体：摘要字数标尺（含意图舒适带）
    const trackY = 30;
    const trackH = 34;
    roundRect(x0, trackY, span, trackH, 6);
    ctx.fillStyle = PAL.band;
    ctx.fill();
    ctx.strokeStyle = PAL.rule;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 舒适带高亮区（会随「信息型 / 导航型」动态左移右移！）
    const optX0 = charsToX(optMin);
    const optX1 = charsToX(optMax);
    ctx.fillStyle = PAL.greenSoft;
    ctx.fillRect(optX0, trackY + 1, optX1 - optX0, trackH - 2);
    ctx.strokeStyle = "rgba(39, 90, 58, 0.45)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(optX0, trackY + 1);
    ctx.lineTo(optX0, trackY + trackH - 1);
    ctx.moveTo(optX1, trackY + 1);
    ctx.lineTo(optX1, trackY + trackH - 1);
    ctx.stroke();
    ctx.setLineDash([]);

    // 舒适带小标签
    ctx.font = `500 10px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.green;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const sweetCenter = (optX0 + optX1) / 2;
    const sweetLabel = ev.scenario.intent === "navigational" ? "导航舒适带" : "信息舒适带";
    ctx.fillText(sweetLabel, Math.max(x0 + 34, Math.min(x1 - 34, sweetCenter)), trackY + 3);

    // 轨道内实际词元切片示意（来自首位结果真实正文长度）
    const handleX = charsToX(visualChars);
    const topCard = ev.cards[0];
    const sampleText = topCard ? (st.match === "none" ? topCard.staticLead : topCard.body) : "";
    const activeW = Math.max(0, handleX - x0);
    if (activeW > 2) {
      ctx.save();
      roundRect(x0 + 1, trackY + 16, Math.max(0, activeW - 1), 15, 3);
      ctx.fillStyle = inSweet ? "rgba(42, 80, 142, 0.16)" : PAL.rustSoft;
      ctx.fill();
      ctx.restore();
    }

    // 在条内绘出真实截断文字预览 + 命中词高亮点
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + 6, trackY + 15, span - 12, 18);
    ctx.clip();
    ctx.font = `400 10.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const previewY = trackY + 24;
    ctx.fillStyle = "rgba(94, 87, 78, 0.42)";
    ctx.fillText(sampleText.slice(0, 80), x0 + 6, previewY);
    // 窗口内的清晰文字
    ctx.beginPath();
    ctx.rect(x0 + 6, trackY + 15, Math.max(0, handleX - x0 - 6), 18);
    ctx.clip();
    ctx.fillStyle = PAL.ink;
    ctx.fillText(sampleText.slice(0, 80), x0 + 6, previewY);
    ctx.restore();

    // 游标竖线与手柄
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(handleX, trackY - 3);
    ctx.lineTo(handleX, trackY + trackH + 3);
    ctx.stroke();

    const pillW = 24;
    const pillH = 20;
    const clampedHX = Math.max(x0 + pillW / 2, Math.min(x1 - pillW / 2, handleX));
    roundRect(clampedHX - pillW / 2, trackY + trackH / 2 - pillH / 2, pillW, pillH, 10);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#FFFDF8";
    ctx.font = `700 11px "Archivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", clampedHX, trackY + trackH / 2 + 0.5);

    // 下半区：#1–#5 首屏可见占用条与截断线（让「摘要撑爆挤出首屏」一目了然）
    const barY = 74;
    const barH = 16;
    const totalListH = Math.max(ev.viewportListHeight * 1.38, ev.cards.reduce((s, c) => s + c.estHeight + 12, 0));
    const foldRatio = Math.min(1, ev.viewportListHeight / totalListH);
    const foldX = x0 + foldRatio * span;

    roundRect(x0, barY, span, barH, 4);
    ctx.fillStyle = "#F0EAE0";
    ctx.fill();

    let curX = x0;
    ev.cards.forEach((c, idx) => {
      const segW = Math.max(12, ((c.estHeight + 12) / totalListH) * span - 2);
      const drawW = Math.min(segW, x1 - curX);
      if (drawW > 2) {
        const isBest = c.id === ev.bestDoc.id;
        const fill = c.isAd
          ? "#B4232C"
          : isBest
          ? (idx === 0 ? PAL.rust : "#C96A42")
          : (idx === 0 ? PAL.cobalt : "#9AA9C1");
        roundRect(curX, barY + 2, drawW, barH - 4, 3);
        ctx.fillStyle = fill;
        ctx.fill();
        if (drawW > 22) {
          ctx.fillStyle = "#FFFDF8";
          ctx.font = `600 10px "JetBrains Mono", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`#${idx + 1}`, curX + drawW / 2, barY + barH / 2 + 0.5);
        }
      }
      curX += segW + 2;
    });

    // 首屏截断竖线
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(foldX, barY - 3);
    ctx.lineTo(foldX, barY + barH + 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // 底部刻度说明（严格防左右重叠且自适应高度）
    const labelY = Math.min(95, h - 14);
    ctx.font = `500 10px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.muted;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(compact ? "0字" : "0 字（空）", x0, labelY);
    ctx.textAlign = "right";
    ctx.fillText(compact ? "155字" : "155 字（段墙）", x1, labelY);
    ctx.textAlign = "center";
    ctx.fillStyle = PAL.ink;
    const minLabelX = x0 + (compact ? 86 : 112);
    const maxLabelX = x1 - (compact ? 94 : 122);
    const clampedFoldLabelX = Math.max(minLabelX, Math.min(maxLabelX, foldX));
    ctx.fillText(`首屏线（可露 ${ev.foldCount} 条）`, clampedFoldLabelX, labelY);
  }

  const ctrl = loop(canvas, render);
  const ro = new ResizeObserver(() => ctrl.draw());
  ro.observe(canvas);

  return {
    draw: () => ctrl.draw(),
    syncTarget: (val) => {
      targetChars = val;
      if (!dragging) ctrl.draw();
    },
  };
}
