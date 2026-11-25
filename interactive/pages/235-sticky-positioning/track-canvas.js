// 235 · 2D Canvas 粘性状态轨道示波器 & 水平滚卷拖轨（data-perf-drag）
// 纯 2D Canvas 渲染，奶油手账纸色系，直接映射 model.js 单真源的 3 个分区滑行区间、触发点与游标。
// 响应鼠标拖拽、触屏水平拖拽（60Hz perf.mjs）、点击定位与键盘微调，零外部依赖、软渲染稳 60fps。

import { pixelRatio } from "../../lib/stage.js";
import { MAX_SCROLL } from "./model.js";

const PALETTE = {
  paper: "#FDF8EE",
  trackBg: "#F4E7D1",
  trackBorder: "#D9C7AE",
  ink: "#361905",
  inkSub: "#6D513C",
  pink: "#F15B87",
  pinkDeep: "#B31E4F",
  pinkSoft: "rgba(241, 91, 135, 0.20)",
  olive: "#A89139",
  oliveSoft: "rgba(168, 145, 57, 0.22)",
  caramel: "#C97D3A",
  err: "#B82822",
  errSoft: "rgba(184, 40, 34, 0.14)",
  ok: "#136B52",
};

export function createTrackCanvas(canvas, { getEval, onScrollChange }) {
  const ctx = canvas.getContext("2d");
  let w = 640;
  let h = 68;
  let padL = 18;
  let padR = 18;
  let dragging = false;
  let activePointerId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    w = rect.width;
    h = rect.height;
    const dpr = pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    padL = w < 380 ? 12 : 18;
    padR = w < 380 ? 12 : 18;
  }

  function clientXToScroll(clientX) {
    const rect = canvas.getBoundingClientRect();
    const usable = Math.max(1, rect.width - padL - padR);
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left - padL) / usable));
    return Math.round(ratio * MAX_SCROLL);
  }

  function rrect(x, y, rw, rh, r) {
    const rad = Math.min(r, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, rad);
    ctx.arcTo(x + rw, y + rh, x, y + rh, rad);
    ctx.arcTo(x, y + rh, x, y, rad);
    ctx.arcTo(x, y, x + rw, y, rad);
    ctx.closePath();
  }

  function draw() {
    resize();
    const ev = getEval();
    const dpr = pixelRatio(2);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // 纸底
    rrect(0.5, 0.5, w - 1, h - 1, 10);
    ctx.fillStyle = PALETTE.paper;
    ctx.fill();
    ctx.strokeStyle = ev.passCount === 4 ? "#D4C2A6" : "#DFB1A8";
    ctx.lineWidth = 1;
    ctx.stroke();

    const trackX = padL;
    const trackW = Math.max(40, w - padL - padR);
    const trackY = h < 56 ? 21 : 25;
    const trackH = h < 56 ? 18 : 22;
    const toX = (s) => trackX + (Math.max(0, Math.min(MAX_SCROLL, s)) / MAX_SCROLL) * trackW;

    // 顶行微型状态标注（中窄屏自动切紧凑短语，绝不左右相撞）
    const compact = w < 540;
    ctx.font = `600 ${compact ? 10.5 : 11}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = "top";
    ctx.fillStyle = PALETTE.inkSub;
    ctx.textAlign = "left";
    ctx.fillText(
      compact ? `拖轨滚卷 · Y ${ev.scrollY}px` : `滚卷轨迹（拖此条或滚下方视口）· scrollY ${ev.scrollY} / ${MAX_SCROLL}px`,
      padL,
      6
    );

    ctx.textAlign = "right";
    const statusLabel = ev.engineActive
      ? ev.runwayPx > 0
        ? compact ? `行程 ${ev.runwayPx}px` : `单区吸附行程 ${ev.runwayPx}px`
        : compact ? "行程 0px" : "行程 0px · 刚触即退"
      : compact ? "断路 · 0px" : "粘性断路 · 0px 吸附";
    ctx.fillStyle = ev.engineActive && ev.runwayPx > 0 ? PALETTE.pinkDeep : PALETTE.err;
    ctx.fillText(statusLabel, w - padR, 6);

    // 轨道底槽
    rrect(trackX, trackY, trackW, trackH, 6);
    ctx.fillStyle = PALETTE.trackBg;
    ctx.fill();
    ctx.strokeStyle = PALETTE.trackBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 画 3 个分区的粘性行程带（真实由 model.js 计算）
    ev.sections.forEach((sec, idx) => {
      if (ev.engineActive && sec.stickStartScroll !== null && sec.stickEndScroll !== null) {
        const sx = toX(sec.stickStartScroll);
        const ex = toX(sec.stickEndScroll);
        const pxEnd = toX(sec.pushEndScroll);

        if (ex > sx + 2) {
          // 玫粉吸附段（阶段 03）
          rrect(sx, trackY + 2, Math.max(3, ex - sx), trackH - 4, 4);
          ctx.fillStyle = sec.isStuck ? PALETTE.pink : "rgba(241, 91, 135, 0.34)";
          ctx.fill();

          // 交棒顶出小段（阶段 04）
          if (pxEnd > ex + 1) {
            ctx.fillStyle = sec.isPushing ? PALETTE.caramel : "rgba(201, 125, 58, 0.42)";
            ctx.fillRect(ex, trackY + 3, Math.max(2, pxEnd - ex), trackH - 6);
          }

          // 段内标签
          if (ex - sx > 34) {
            ctx.font = `600 10px "IBM Plex Mono", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = sec.isStuck ? "#FFFDF8" : PALETTE.pinkDeep;
            ctx.fillText(`S${idx + 1}`, (sx + ex) / 2, trackY + trackH / 2 + 0.5);
          }
        } else {
          // 父盒行程为 0px 时画出醒目红色断针
          ctx.fillStyle = PALETTE.err;
          ctx.fillRect(sx - 1.5, trackY + 2, 3, trackH - 4);
        }
      } else {
        // 粘性断路时在各分区原始到达点画红色虚线短标
        const missX = toX(sec.top);
        ctx.save();
        ctx.strokeStyle = PALETTE.err;
        ctx.setLineDash([3, 2]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(missX, trackY + 2);
        ctx.lineTo(missX, trackY + trackH - 2);
        ctx.stroke();
        ctx.restore();
      }
    });

    // 若未启动，给轨道叠一层极浅的斜红警示纹
    if (!ev.engineActive || ev.runwayPx === 0) {
      ctx.save();
      rrect(trackX, trackY, trackW, trackH, 6);
      ctx.clip();
      ctx.strokeStyle = PALETTE.errSoft;
      ctx.lineWidth = 5;
      for (let rx = trackX - trackH; rx < trackX + trackW + trackH; rx += 16) {
        ctx.beginPath();
        ctx.moveTo(rx, trackY + trackH);
        ctx.lineTo(rx + trackH, trackY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 底部极细刻度点（标记 01 / 02 / 03 区间起点）
    if (h >= 58) {
      ctx.font = `500 9.5px "IBM Plex Mono", monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillStyle = PALETTE.inkSub;
      ev.sections.forEach((sec, i) => {
        const mx = toX(sec.top);
        if (mx > padL + 16 && mx < w - padR - 16) {
          ctx.fillText(`区${i + 1}`, mx, trackY + trackH + 4);
        }
      });
    }

    // 实时滚卷游标滑块（可直观抓握的覆盆子/深焙把手）
    const curX = toX(ev.scrollY);
    const thumbW = 24;
    const thumbH = trackH + 6;
    const tx = Math.max(trackX - 2, Math.min(trackX + trackW - thumbW + 2, curX - thumbW / 2));
    const ty = trackY - 3;

    // 阴影
    ctx.save();
    ctx.fillStyle = "rgba(54, 25, 5, 0.16)";
    rrect(tx, ty + 2, thumbW, thumbH, 6);
    ctx.fill();
    ctx.restore();

    // 把手主体
    rrect(tx, ty, thumbW, thumbH, 6);
    ctx.fillStyle = ev.passCount === 4 ? PALETTE.ink : PALETTE.err;
    ctx.fill();
    ctx.strokeStyle = "#FDF8EE";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 把手中间三条防滑抓纹
    ctx.strokeStyle = "#FDF8EE";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    for (let g = -4; g <= 4; g += 4) {
      ctx.beginPath();
      ctx.moveTo(tx + thumbW / 2 + g, ty + 6);
      ctx.lineTo(tx + thumbW / 2 + g, ty + thumbH - 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 同时支持 PointerEvents 与 TouchEvents（确保 perf.mjs 的 CDP touchStart/touchMove/touchEnd 100% 流畅触发！）
  function handleTouchStart(e) {
    if (!e.touches.length) return;
    dragging = true;
    const y = clientXToScroll(e.touches[0].clientX);
    onScrollChange(y);
  }
  function handleTouchMove(e) {
    if (!dragging || !e.touches.length) return;
    e.preventDefault();
    const y = clientXToScroll(e.touches[0].clientX);
    onScrollChange(y);
  }
  function handleTouchEnd() {
    dragging = false;
  }

  function handlePointerDown(e) {
    if (e.pointerType === "touch") return; // 交给上方 touch 处理器避免重复
    dragging = true;
    activePointerId = e.pointerId;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    onScrollChange(clientXToScroll(e.clientX));
  }
  function handlePointerMove(e) {
    if (!dragging || e.pointerType === "touch") return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    onScrollChange(clientXToScroll(e.clientX));
  }
  function handlePointerUp(e) {
    if (e.pointerType === "touch") return;
    dragging = false;
    activePointerId = null;
  }

  canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
  canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });

  canvas.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  return { draw, resize };
}
