// 269 信息流布局 · 2D Canvas 绘图模块
// 1) 主舞台大幅洋红 S 型流向轨（实时读取每张错位卡片的真实坐标，沿斜向瀑布大幅摆动穿过节点，带手绘箭头与三点）
// 2) 声波节奏拖轨（呼应海报第 4 枚「节奏」图标，随 gap 连续压缩/舒展，承担 data-perf-drag 实时重绘）

import { loop, pixelRatio } from "../../lib/stage.js";

const MAGENTA = "#fa2c64";
const MAGENTA_SOFT = "rgba(250, 44, 100, 0.16)";
const INK = "#111116";
const MUTED = "rgba(17, 17, 22, 0.17)";
const PAPER = "#fcf9f6";

export function mountFlowSpine(canvas, stageEl, timeLayerEl, getState) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let nodes = [];

  function measure() {
    const rect = stageEl.getBoundingClientRect();
    w = Math.max(48, Math.round(rect.width));
    h = Math.max(220, Math.round(rect.height));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const cards = [...stageEl.querySelectorAll(".feed-card")];
    const baseLeft = rect.left;
    const baseTop = rect.top;
    nodes = cards.map((card, i) => {
      const cr = card.getBoundingClientRect();
      return {
        left: cr.left - baseLeft,
        right: cr.right - baseLeft,
        top: cr.top - baseTop,
        bottom: cr.bottom - baseTop,
        idx: i,
        saved: card.dataset.saved === "1",
        hot: card.dataset.hot === "1",
      };
    });
  }

  function samplePoint(segments, u) {
    if (!segments.length) return { x: 26, y: 20 };
    const total = segments.length;
    const scaled = Math.max(0, Math.min(total - 0.0001, u * total));
    const idx = Math.floor(scaled);
    const t = scaled - idx;
    const s = segments[idx];
    const mt = 1 - t;
    const x =
      mt * mt * mt * s.x0 +
      3 * mt * mt * t * s.cx1 +
      3 * mt * t * t * s.cx2 +
      t * t * t * s.x1;
    const y =
      mt * mt * mt * s.y0 +
      3 * mt * mt * t * s.cy1 +
      3 * mt * t * t * s.cy2 +
      t * t * t * s.y1;
    return { x, y };
  }

  function buildSegments(gap) {
    if (!nodes.length) return { segments: [], dots: [], endX: 26, endY: 200 };
    const N = nodes.length;
    const compact = w < 520;
    const dots = [];
    const segments = [];

    // 全部节点统一落在每张卡下方的卡间空隙中线；末张卡落在底沿下方空隙中线
    const nodeY = (i) =>
      i < N - 1
        ? (nodes[i].bottom + nodes[i + 1].top) * 0.5
        : nodes[i].bottom + Math.max(11, gap * 0.52);

    if (compact) {
      // 手机端：卡片右边对齐、左边预留 34px 通道，节点统一在卡间空隙，时间标签紧挂节点右旁
      const spineX = 14;
      const sway = Math.max(4.5, Math.min(8.5, 4.5 + (gap - 4) * 0.1));
      let prevX = Math.min(nodes[0].left + 2, spineX + sway * 1.4);
      let prevY = Math.max(8, nodes[0].top + 10);

      nodes.forEach((n, i) => {
        const dotX = Math.max(8, spineX + (i % 2 === 0 ? -1.4 : 1.4));
        const dotY = nodeY(i);
        const dy = Math.max(20, dotY - prevY);
        segments.push({
          x0: prevX,
          y0: prevY,
          cx1: Math.max(4, prevX - sway * 0.8),
          cy1: prevY + dy * 0.34,
          cx2: Math.max(4, dotX - sway * 0.92),
          cy2: dotY - dy * 0.3,
          x1: dotX,
          y1: dotY,
        });
        dots.push({
          x: dotX,
          y: dotY,
          labelX: n.left + 2,
          labelY: dotY,
          saved: n.saved,
        });
        prevX = dotX;
        prevY = dotY;
      });

      const endX = spineX;
      const endY = Math.min(h - 22, prevY + 34);
      const dy = Math.max(14, endY - prevY);
      segments.push({
        x0: prevX,
        y0: prevY,
        cx1: Math.max(4, prevX - sway * 0.7),
        cy1: prevY + dy * 0.42,
        cx2: Math.max(5, endX - sway * 0.25),
        cy2: endY - dy * 0.25,
        x1: endX,
        y1: endY,
      });
      return { segments, dots, endX, endY };
    }

    // 桌面/大平板端：复刻 269 原海报——卡片右边对齐、仅左边沿 S 线错开；节点统一在卡间空隙，时间挂在节点旁
    const bow = Math.max(18, Math.min(36, 18 + (gap - 4) * 0.45));
    const startX = nodes[0].left + 4;
    const startY = Math.max(10, nodes[0].top + 14);

    let prevX = startX;
    let prevY = startY;

    nodes.forEach((n, i) => {
      const nextLeft = i < N - 1 ? nodes[i + 1].left : n.left;
      const guardLeft = Math.min(n.left, nextLeft);
      const dotX = Math.max(22, guardLeft - 18 - (i % 2 === 0 ? 5 : 0));
      const dotY = nodeY(i);
      const dy = Math.max(24, dotY - prevY);

      if (i === 0) {
        const arcPeakX = Math.max(12, dotX - bow * 0.78);
        segments.push({
          x0: prevX,
          y0: prevY,
          cx1: arcPeakX,
          cy1: prevY + dy * 0.14,
          cx2: Math.max(10, arcPeakX - bow * 0.12),
          cy2: dotY - dy * 0.24,
          x1: dotX,
          y1: dotY,
        });
      } else {
        const arcOut = bow * (i % 2 === 1 ? 0.95 : 0.76);
        const c1x = Math.max(10, Math.min(n.left - 8, prevX - arcOut * 0.32));
        const c2x = Math.max(10, Math.min(prevX, dotX) - arcOut);
        segments.push({
          x0: prevX,
          y0: prevY,
          cx1: c1x,
          cy1: prevY + dy * 0.34,
          cx2: c2x,
          cy2: dotY - dy * 0.28,
          x1: dotX,
          y1: dotY,
        });
      }

      dots.push({
        x: dotX,
        y: dotY,
        labelX: dotX + 13,
        labelY: dotY,
        saved: n.saved,
      });
      prevX = dotX;
      prevY = dotY;
    });

    // 收尾弧：从末节点向左下自然甩出，承接手绘箭头与三圆点
    const endX = Math.max(20, prevX - 10);
    const endY = Math.min(h - 24, prevY + 42);
    const tailDy = Math.max(18, endY - prevY);
    segments.push({
      x0: prevX,
      y0: prevY,
      cx1: Math.max(10, prevX - bow * 0.65),
      cy1: prevY + tailDy * 0.42,
      cx2: Math.max(12, endX - bow * 0.22),
      cy2: endY - tailDy * 0.24,
      x1: endX,
      y1: endY,
    });

    return { segments, dots, endX, endY };
  }

  function syncTimeTags(dots) {
    if (!timeLayerEl) return;
    const tags = timeLayerEl.children;
    for (let i = 0; i < dots.length && i < tags.length; i++) {
      const tag = tags[i];
      const d = dots[i];
      const lx = Math.round(d.labelX * 2) / 2;
      const ly = Math.round(d.labelY * 2) / 2;
      if (tag._lx !== lx || tag._ly !== ly) {
        tag._lx = lx;
        tag._ly = ly;
        tag.style.transform = `translate3d(${lx}px, ${ly}px, 0) translateY(-50%)`;
      }
    }
  }

  const ctrl = loop(canvas, (t, dt, { still }) => {
    measure();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const state = getState();
    const { segments, dots, endX, endY } = buildSegments(state.gap);
    if (!segments.length) return;
    syncTimeTags(dots);

    // Opening draw-in progress (starts at 0.42 so 0.9s screenshot is complete & crisp)
    const reveal = still ? 1 : Math.min(1, 0.42 + t * 1.15);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Soft ribbon under-track so the sweeping S silhouette reads immediately
    ctx.beginPath();
    ctx.moveTo(segments[0].x0, segments[0].y0);
    for (const s of segments) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x1, s.y1);
    ctx.strokeStyle = MAGENTA_SOFT;
    ctx.lineWidth = w < 520 ? 3.5 : 5;
    ctx.stroke();

    // Active magenta S-curve
    const totalSamples = segments.length * 24;
    const drawCount = Math.max(4, Math.floor(totalSamples * reveal));
    ctx.beginPath();
    const p0 = samplePoint(segments, 0);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i <= drawCount; i++) {
      const p = samplePoint(segments, i / totalSamples);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = state.gap <= 10 ? "#b91c4a" : MAGENTA;
    ctx.lineWidth = state.gap >= 30 ? 2 : w < 520 ? 2.4 : 2.9;
    if (state.gap >= 30) ctx.setLineDash([7, 7]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Flowing momentum pulses along the S-curve
    if (!still && reveal > 0.85) {
      const speed = state.sort === "time" ? 0.19 : state.sort === "priority" ? 0.25 : 0.31;
      for (let k = 0; k < 2; k++) {
        const u = (t * speed + k * 0.5) % 1;
        const p = samplePoint(segments, u);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(250, 44, 100, 0.24)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = MAGENTA;
        ctx.fill();
      }
    }

    // Hollow white-center magenta nodes placed uniformly in card gaps (filled when bookmarked)
    dots.forEach((d, i) => {
      const nodeU = (i + 0.78) / segments.length;
      if (nodeU > reveal + 0.15) return;

      const r = w < 520 ? (d.saved ? 4.8 : 4.1) : d.saved ? 6.2 : 5.4;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = d.saved ? MAGENTA : PAPER;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = MAGENTA;
      ctx.stroke();
    });

    // Bottom poster-style hand-drawn downward arrow + 3 dots
    if (reveal > 0.72) {
      const aAlpha = Math.min(1, (reveal - 0.72) / 0.28);
      ctx.globalAlpha = aAlpha;
      const aw = w < 520 ? 7.5 : 10;
      const ah = w < 520 ? 8.5 : 11;
      ctx.beginPath();
      ctx.moveTo(endX - aw, endY - ah);
      ctx.lineTo(endX, endY + 2);
      ctx.lineTo(endX + aw * 1.05, endY - ah * 0.92);
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = w < 520 ? 2.5 : 3;
      ctx.stroke();

      const dotOffsets = [
        { dx: -11, dy: 14.5, r: 2.4 },
        { dx: 0, dy: 17, r: 2.9 },
        { dx: 11, dy: 14.8, r: 2.4 },
      ];
      dotOffsets.forEach((pt, idx) => {
        const pulse = still ? 1 : 0.78 + 0.22 * Math.sin(t * 4 - idx * 0.9);
        ctx.beginPath();
        ctx.arc(endX + pt.dx, endY + pt.dy, pt.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = MAGENTA;
        ctx.fill();
      });
    }

    ctx.restore();
  });

  const ro = new ResizeObserver(() => ctrl.draw());
  ro.observe(stageEl);

  return {
    draw: () => ctrl.draw(),
    destroy: () => ro.disconnect(),
  };
}

export function mountRhythmRail(canvas, getState) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(160, Math.round(r.width));
    h = Math.max(40, Math.round(r.height));
    dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
  }

  const ctrl = loop(canvas, (t, dt, { still }) => {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const { gap, dragging } = getState();
    const minG = 4;
    const maxG = 44;
    const norm = (gap - minG) / (maxG - minG);
    const pad = 14;
    const trackW = w - pad * 2;
    const midY = h * 0.5;

    // Empirical sweet-spot band (12px–24px)
    const s0 = pad + ((12 - minG) / (maxG - minG)) * trackW;
    const s1 = pad + ((24 - minG) / (maxG - minG)) * trackW;
    ctx.fillStyle = "rgba(250, 44, 100, 0.09)";
    ctx.fillRect(s0, 4, s1 - s0, h - 8);

    // Sweet-spot hairline marker at 16px
    const sweetX = pad + ((16 - minG) / (maxG - minG)) * trackW;
    ctx.beginPath();
    ctx.moveTo(sweetX, 3);
    ctx.lineTo(sweetX, h - 3);
    ctx.strokeStyle = "rgba(250, 44, 100, 0.36)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Poster motif #4: acoustic rhythm bars whose density & height respond to gap
    const barCount = Math.max(14, Math.min(34, Math.round(trackW / 10)));
    const knobX = pad + norm * trackW;

    for (let i = 0; i < barCount; i++) {
      const u = i / (barCount - 1);
      const bx = pad + u * trackW;
      const dist = Math.abs(bx - knobX) / trackW;
      const wave = 0.52 + 0.48 * Math.sin(i * (1.25 - norm * 0.55) + (still ? 0.6 : t * 1.6));
      const proximity = Math.max(0, 1 - dist * 4.5);
      const halfH = Math.max(3.5, (4.5 + wave * 9.5 + proximity * 7.5) * (h / 48));
      const active = bx <= knobX;

      ctx.beginPath();
      ctx.moveTo(bx, midY - halfH);
      ctx.lineTo(bx, midY + halfH);
      ctx.lineCap = "round";
      ctx.lineWidth = active ? 2.5 : 1.9;
      ctx.strokeStyle = active
        ? gap <= 10
          ? INK
          : gap > 24
            ? "rgba(250, 44, 100, 0.52)"
            : MAGENTA
        : MUTED;
      ctx.stroke();
    }

    // Center axis baseline
    ctx.beginPath();
    ctx.moveTo(pad, midY);
    ctx.lineTo(w - pad, midY);
    ctx.strokeStyle = "rgba(17, 17, 22, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tactile draggable pill handle
    const kw = dragging ? 15 : 13;
    const kh = Math.min(h - 8, dragging ? 30 : 27);
    ctx.save();
    ctx.shadowColor = "rgba(17, 17, 22, 0.18)";
    ctx.shadowBlur = dragging ? 10 : 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(knobX - kw / 2, midY - kh / 2, kw, kh, 6.5);
    ctx.fill();
    ctx.restore();

    // Magenta grip bar inside handle
    ctx.beginPath();
    ctx.moveTo(knobX, midY - kh * 0.24);
    ctx.lineTo(knobX, midY + kh * 0.24);
    ctx.strokeStyle = MAGENTA;
    ctx.lineWidth = 2.3;
    ctx.lineCap = "round";
    ctx.stroke();
  });

  const ro = new ResizeObserver(() => ctrl.draw());
  ro.observe(canvas);

  return {
    draw: () => ctrl.draw(),
    destroy: () => ro.disconnect(),
  };
}
