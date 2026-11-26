// 222 普通流布局 · 开场 2D Canvas 活体文档流修复台
// 1:1 承袭 222 原海报浅蓝单列微网页（深钴蓝标题条 + 浅天蓝正文行 + 双峰白日插图 + 6 瓣几何星标要点框），
// 左配活体 DOM #1–#5 流序连线，顶配单列栏宽标尺，零重阴影以保证慢手机软件渲染仍高帧流畅。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeFlowLayout } from "./model.js";

const COLORS = {
  bg: "#FAFCFF",
  gridDot: "#D7E6F8",
  rulerBg: "#EFF5FC",
  rulerLine: "#9BC0E8",
  rulerGood: "rgba(14, 122, 86, 0.16)",
  rulerGoodLine: "#0E7A56",
  docBg: "#E7F1F9",
  docBorder: "#BDD7F2",
  cobalt: "#045EC8",
  cobaltDeep: "#034A9E",
  cobaltDark: "#0A0E14",
  muted: "#4A5568",
  imgSky: "#BAD8F2",
  imgMtnBack: "#9DC4EC",
  imgMtnFront: "#8CB9E7",
  sun: "#FFFFFF",
  takeawayBg: "#F4F8FD",
  takeawayBorder: "#A5C7EE",
  err: "#C82820",
  errSoft: "rgba(200, 40, 32, 0.13)",
  errStripe: "rgba(200, 40, 32, 0.28)",
  ok: "#0E7A56",
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 1:1 向量绘制 222 原海报六瓣几何星标（不依赖字体缺字）
function drawAsterisk(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.9;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();
  }
  ctx.restore();
}

export function mountHeroStage(canvas, getState, onPatch, onSweepChange) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { draw() {}, triggerSweep() {}, getLayout: () => null };

  const anim = {
    intro: 0,
    visMeasure: getState().measurePct,
    visRhythm: getState().rhythm,
    blockAnim: new Map(),
    sweepActive: false,
    sweepT: 0,
    dragging: false,
    dragStartX: 0,
    dragStartMeasure: 0,
    dragMoved: false,
    dirty: true,
    lastW: 0,
    lastH: 0,
    bgCanvas: null,
  };

  let lastLayout = null;
  let hitZones = [];

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(260, Math.round(rect.height));
    const dpr = pixelRatio(w < 460 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      anim.bgCanvas = null;
      anim.dirty = true;
    }
    return { w, h, dpr };
  }

  function ensureBgCache(w, h, dpr, railW, topRulerH, compact) {
    if (anim.bgCanvas && anim.lastW === w && anim.lastH === h) return anim.bgCanvas;
    const off = document.createElement("canvas");
    off.width = Math.round(w * dpr);
    off.height = Math.round(h * dpr);
    const octx = off.getContext("2d");
    octx.scale(dpr, dpr);
    octx.fillStyle = COLORS.bg;
    octx.fillRect(0, 0, w, h);
    const step = compact ? 20 : 24;
    octx.fillStyle = COLORS.gridDot;
    for (let gx = railW + 12; gx < w - 10; gx += step) {
      for (let gy = topRulerH + 14; gy < h - 18; gy += step) {
        octx.fillRect(gx, gy, 1.5, 1.5);
      }
    }
    octx.fillStyle = COLORS.rulerBg;
    octx.fillRect(0, 0, w, topRulerH);
    octx.strokeStyle = COLORS.rulerLine;
    octx.lineWidth = 1;
    octx.beginPath();
    octx.moveTo(0, topRulerH + 0.5);
    octx.lineTo(w, topRulerH + 0.5);
    octx.stroke();
    octx.fillStyle = COLORS.cobaltDeep;
    octx.font = `700 ${compact ? 10 : 11}px "Space Mono", monospace`;
    octx.textAlign = "left";
    octx.textBaseline = "middle";
    octx.fillText("DOM", 12, topRulerH * 0.52);

    octx.fillStyle = COLORS.muted;
    octx.font = `500 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "bottom";
    octx.fillText(
      compact
        ? "← 横拖调行宽 · 点红标修复脱流/逆流 →"
        : "画布内左右横拖调栏宽看实时折行 · 点红标把插图归流或顺排 · Space 演播阅读流",
      w / 2,
      h - 6
    );
    anim.bgCanvas = off;
    anim.lastW = w;
    anim.lastH = h;
    return off;
  }

  function lerp(a, b, k) {
    return a + (b - a) * k;
  }

  function drawFigureMotif(b, compact) {
    const { x, y, w, h, motif } = b;
    ctx.save();
    roundRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = COLORS.imgSky;
    ctx.fill();
    ctx.clip();

    if (motif === "mountain") {
      const sunR = Math.max(6, Math.min(12, h * 0.125));
      ctx.beginPath();
      ctx.arc(x + w * 0.64, y + h * 0.30, sunR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.sun;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + w * 0.38, y + h);
      ctx.quadraticCurveTo(x + w * 0.68, y + h * 0.36, x + w * 0.78, y + h * 0.44);
      ctx.lineTo(x + w * 1.06, y + h);
      ctx.closePath();
      ctx.fillStyle = COLORS.imgMtnBack;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x - w * 0.05, y + h);
      ctx.quadraticCurveTo(x + w * 0.26, y + h * 0.24, x + w * 0.38, y + h * 0.40);
      ctx.lineTo(x + w * 0.74, y + h);
      ctx.closePath();
      ctx.fillStyle = COLORS.imgMtnFront;
      ctx.fill();
    } else if (motif === "diagram") {
      const pad = compact ? 8 : 12;
      const bw = Math.min(w - pad * 2, 160);
      const bx = x + (w - bw) / 2;
      const bh = Math.max(10, Math.floor((h - pad * 2 - 12) / 3));
      for (let i = 0; i < 3; i++) {
        const by = y + pad + i * (bh + 6);
        roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fillStyle = i === 0 ? COLORS.cobalt : "#79ACE3";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 ${compact ? 9 : 10}px "Space Mono", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`BLOCK 0${i + 1}`, bx + 8, by + bh / 2);
      }
    } else {
      const pad = compact ? 10 : 14;
      ctx.strokeStyle = "rgba(4, 94, 200, 0.25)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const gy = y + (h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x + pad, gy);
        ctx.lineTo(x + w - pad, gy);
        ctx.stroke();
      }
      const pts = [0.76, 0.42, 0.28, 0.34, 0.62, 0.82];
      ctx.beginPath();
      pts.forEach((p, i) => {
        const px = x + pad + ((w - pad * 2) * i) / (pts.length - 1);
        const py = y + pad + (h - pad * 2) * p;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.lineTo(x + w - pad, y + h - pad);
      ctx.lineTo(x + pad, y + h - pad);
      ctx.closePath();
      ctx.fillStyle = "rgba(4, 94, 200, 0.22)";
      ctx.fill();

      ctx.beginPath();
      pts.forEach((p, i) => {
        const px = x + pad + ((w - pad * 2) * i) / (pts.length - 1);
        const py = y + pad + (h - pad * 2) * p;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = COLORS.cobalt;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    const { w, h, dpr } = sizeCanvas();
    const state = getState();
    const compact = w < 460;

    // 静置且所有缓动均已到位时跳过重绘，拖动/开场/演播时每帧实时重绘
    const measureDelta = Math.abs(anim.visMeasure - state.measurePct);
    const rhythmDelta = Math.abs(anim.visRhythm - state.rhythm);
    const blocksSettled = !anim.dirty && measureDelta < 0.05 && rhythmDelta < 0.05 && anim.intro >= 1 && !anim.sweepActive && !anim.dragging;
    if (blocksSettled && !still) {
      return;
    }

    const k = still ? 1 : Math.min(1, dt * 14 || 0.22);
    anim.intro = still ? 1 : Math.min(1, anim.intro + (dt || 0.016) * 1.9);
    anim.visMeasure = measureDelta < 0.05 ? state.measurePct : lerp(anim.visMeasure, state.measurePct, k);
    anim.visRhythm = rhythmDelta < 0.05 ? state.rhythm : lerp(anim.visRhythm, state.rhythm, k);

    const layoutState = {
      ...state,
      measurePct: anim.dragging || still ? state.measurePct : anim.visMeasure,
      rhythm: still ? state.rhythm : anim.visRhythm,
    };
    const lay = computeFlowLayout(layoutState, { w, h, compact });
    lastLayout = computeFlowLayout(state, { w, h, compact });
    hitZones = [];
    let anyBlockMoving = false;

    if (anim.sweepActive && !still) {
      anim.sweepT += (dt || 0.016) * 0.34;
      if (anim.sweepT >= 1) {
        anim.sweepT = 0;
        anim.sweepActive = false;
        if (onSweepChange) onSweepChange(false, 0);
      } else if (onSweepChange) {
        onSweepChange(true, anim.sweepT);
      }
    }

    const availH = h - lay.topRulerH - 26;
    const scaleY = lay.docH > availH ? Math.max(0.72, availH / lay.docH) : 1;
    const offsetY = lay.docH < availH ? Math.round(Math.min(26, (availH - lay.docH) * 0.28)) : 0;
    const mapY = (y) => lay.topRulerH + 8 + offsetY + (y - (lay.topRulerH + 8)) * scaleY;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 1. 一次 drawImage 贴上缓存好的白底点阵+顶部标尺+底沿提示（省去 350 次 fillRect！）
    const bgCache = ensureBgCache(w, h, dpr, lay.railW, lay.topRulerH, compact);
    ctx.drawImage(bgCache, 0, 0);
    ctx.scale(dpr, dpr);

    // 2. 顶部栏宽动态游标与实测读数
    const trackX0 = lay.railW + 10;
    const trackW = lay.maxDocW;
    const bandY = lay.topRulerH - 11;
    const normGood0 = (18 - 12) / 44;
    const normGood1 = (36 - 12) / 44;
    const gx0 = trackX0 + (lay.minDocW + normGood0 * (lay.maxDocW - lay.minDocW));
    const gx1 = trackX0 + (lay.minDocW + normGood1 * (lay.maxDocW - lay.minDocW));

    ctx.fillStyle = "rgba(4, 94, 200, 0.08)";
    ctx.fillRect(trackX0, bandY, trackW, 5);
    ctx.fillStyle = COLORS.rulerGood;
    ctx.fillRect(gx0, bandY - 1, Math.max(8, gx1 - gx0), 7);
    ctx.strokeStyle = COLORS.rulerGoodLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx0, bandY - 2);
    ctx.lineTo(gx0, bandY + 7);
    ctx.moveTo(gx1, bandY - 2);
    ctx.lineTo(gx1, bandY + 7);
    ctx.stroke();

    ctx.fillStyle = lay.checks.measureOk ? COLORS.ok : COLORS.err;
    ctx.fillRect(lay.docX, bandY, lay.docW, 5);

    ctx.font = `700 ${compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = lay.checks.measureOk ? COLORS.ok : COLORS.err;
    ctx.textAlign = "left";
    ctx.fillText(
      compact ? `${lastLayout.charsPerLine} 字/行` : `行宽 ≈ ${lastLayout.charsPerLine} 汉字/行 (${lastLayout.equivPx}px)`,
      trackX0,
      compact ? 12 : 13
    );

    ctx.textAlign = "right";
    ctx.fillStyle = lastLayout.isValid ? COLORS.ok : COLORS.err;
    ctx.fillText(lastLayout.badge, w - 12, compact ? 12 : 13);

    // 3. 垂直自适应区（含温和居中偏移）
    ctx.save();
    ctx.translate(0, lay.topRulerH + 8 + offsetY);
    ctx.scale(1, scaleY);
    ctx.translate(0, -(lay.topRulerH + 8));

    // 3a. 文档外卡（无重阴影，干脆利落且保证高帧率）
    roundRect(ctx, lay.docX + 3, lay.docY + 4, lay.docW, lay.docH, 12);
    ctx.fillStyle = "rgba(4, 94, 200, 0.09)";
    ctx.fill();
    roundRect(ctx, lay.docX, lay.docY, lay.docW, lay.docH, 12);
    ctx.fillStyle = COLORS.docBg;
    ctx.fill();
    ctx.strokeStyle = lay.isValid ? COLORS.docBorder : (lay.checks.measureOk ? COLORS.docBorder : "rgba(200,40,32,0.45)");
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 右边栏宽拖拽把手 ||
    const handleX = lay.docX + lay.docW;
    const handleY = lay.docY + lay.docH * 0.44;
    const handleW = compact ? 16 : 18;
    const handleH = compact ? 42 : 52;
    roundRect(ctx, handleX - handleW / 2, handleY - handleH / 2, handleW, handleH, 6);
    ctx.fillStyle = anim.dragging ? COLORS.cobaltDeep : COLORS.cobalt;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(handleX - 2.5, handleY - 9);
    ctx.lineTo(handleX - 2.5, handleY + 9);
    ctx.moveTo(handleX + 2.5, handleY - 9);
    ctx.lineTo(handleX + 2.5, handleY + 9);
    ctx.stroke();
    hitZones.push({
      kind: "measure-handle",
      x: handleX - 18,
      y: mapY(handleY - handleH / 2),
      w: 36,
      h: handleH * scaleY,
      cursor: "ew-resize",
    });

    if (lay.ghostFigureRect) {
      const g = lay.ghostFigureRect;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(200, 40, 32, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = COLORS.err;
      ctx.font = `600 ${compact ? 9 : 10}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(compact ? "↑ 插图脱流，下方段塌陷 ↑" : "↑ 插图脱流，下方段向上塌陷 ↑", g.x + g.w / 2, g.y + g.h / 2);
      ctx.restore();
    }

    // 3b. 绘制五个内容块（先流内，最后脱流压在最上）
    const orderedPaint = [...lay.blocks].sort((a, b) => (a.outOfFlow ? 1 : 0) - (b.outOfFlow ? 1 : 0));
    const introEase = 1 - Math.pow(1 - anim.intro, 3);

    orderedPaint.forEach((b) => {
      const prev = anim.blockAnim.get(b.id) || { x: b.x, y: b.y + 8, w: b.w, h: b.h };
      const bk = still || anim.dragging ? 1 : Math.min(1, (dt || 0.016) * 16);
      const bx = Math.abs(prev.x - b.x) < 0.3 ? b.x : lerp(prev.x, b.x, bk);
      const by = Math.abs(prev.y - b.y) < 0.3 ? b.y : lerp(prev.y, b.y, bk);
      const bw = Math.abs(prev.w - b.w) < 0.3 ? b.w : lerp(prev.w, b.w, bk);
      const bh = Math.abs(prev.h - b.h) < 0.3 ? b.h : lerp(prev.h, b.h, bk);
      if (bx !== b.x || by !== b.y || bw !== b.w || bh !== b.h) anyBlockMoving = true;
      anim.blockAnim.set(b.id, { x: bx, y: by, w: bw, h: bh });

      const rb = { ...b, x: bx, y: by, w: bw, h: bh };
      const isInverted = lay.invertedIds.has(b.id);

      ctx.save();
      ctx.globalAlpha = Math.min(1, 0.35 + introEase * 0.65);

      if (b.kind === "heading") {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx - 2, by - 2, bw + 4, bh + 6);
        ctx.clip();
        const barW = Math.min(bw * 0.42, compact ? 86 : 124);
        roundRect(ctx, bx, by, barW, compact ? 8 : 10, 3);
        ctx.fillStyle = COLORS.cobalt;
        ctx.fill();

        ctx.fillStyle = COLORS.cobaltDark;
        ctx.font = `800 ${lay.headFontPx}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        b.lines.forEach((ln, idx) => {
          ctx.fillText(ln, bx, by + (compact ? 11 : 14) + idx * (compact ? 14 : 16));
        });
        ctx.restore();
      } else if (b.kind === "paragraph") {
        roundRect(ctx, bx - 3, by - 2, bw + 6, bh + 4, 5);
        ctx.fillStyle = b.fixedClamped ? "rgba(200, 40, 32, 0.06)" : "rgba(255, 255, 255, 0.58)";
        ctx.fill();
        if (b.fixedClamped) {
          ctx.strokeStyle = COLORS.err;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 水平方向严格裁剪在段落盒宽内；垂直方向仅在定高陷阱开启时允许向下溢出
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx - 2, by - 2, bw + 4, b.fixedClamped ? bh + b.overflowPx + 20 : bh + 6);
        ctx.clip();

        ctx.font = `400 ${lay.paraFontPx}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        b.lines.forEach((ln, idx) => {
          const ly = by + 4 + idx * lay.lineH;
          const isSpill = b.fixedClamped && ly + lay.lineH > by + bh + 2;
          const barLen = Math.min(bw, idx === b.lines.length - 1 ? bw * 0.62 : bw * 0.96);
          roundRect(ctx, bx, ly + 1, barLen, compact ? 8.5 : 10, 2.5);
          ctx.fillStyle = isSpill ? "rgba(200, 40, 32, 0.16)" : "rgba(170, 202, 243, 0.28)";
          ctx.fill();
          ctx.fillStyle = isSpill ? COLORS.err : "#1D2C40";
          ctx.fillText(ln, bx + 2, ly);
        });
        ctx.restore();

        if (b.fixedClamped) {
          const pillW = compact ? 92 : 112;
          const pillH = 18;
          const px = bx + bw - pillW;
          const py = by + bh - 8;
          roundRect(ctx, px, py, pillW, pillH, 4);
          ctx.fillStyle = COLORS.err;
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `700 9.5px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("定高溢出 · 点此自动", px + pillW / 2, py + pillH / 2);
          hitZones.push({
            kind: "release-height",
            id: b.id,
            x: px - 6,
            y: mapY(py) - 6,
            w: pillW + 12,
            h: (pillH + 12) * scaleY,
            cursor: "pointer",
          });
        }
      } else if (b.kind === "figure") {
        if (b.outOfFlow) {
          roundRect(ctx, bx + 4, by + 5, bw, bh, 8);
          ctx.fillStyle = "rgba(200, 40, 32, 0.18)";
          ctx.fill();
        }
        drawFigureMotif(rb, compact);

        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.strokeStyle = b.outOfFlow ? COLORS.err : "rgba(4, 94, 200, 0.22)";
        ctx.lineWidth = b.outOfFlow ? 2 : 1;
        if (b.outOfFlow) ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const tagText = b.outOfFlow
          ? (compact ? "脱流 · 点此归流" : "position: absolute · 点此归回普通流")
          : (compact ? "在流内 static" : "in-flow · static（点可试脱流）");
        ctx.font = `700 ${compact ? 9.5 : 10.5}px "Space Mono", "Noto Sans SC", sans-serif`;
        const tw = Math.min(bw - 12, ctx.measureText(tagText).width + 16);
        const th = compact ? 20 : 22;
        const tx = bx + 8;
        const ty = by + 7;
        roundRect(ctx, tx, ty, tw, th, 5);
        ctx.fillStyle = b.outOfFlow ? COLORS.err : "rgba(4, 94, 200, 0.88)";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + 8, ty + th / 2);

        hitZones.push({
          kind: "toggle-figure",
          id: b.id,
          x: bx,
          y: mapY(by),
          w: bw,
          h: bh * scaleY,
          cursor: "pointer",
        });
      } else if (b.kind === "takeaway") {
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fillStyle = isInverted ? "#FFF3F2" : COLORS.takeawayBg;
        ctx.fill();
        ctx.strokeStyle = isInverted ? COLORS.err : COLORS.takeawayBorder;
        ctx.lineWidth = isInverted ? 1.8 : 1;
        if (isInverted) ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 若顺序逆流，顶部留出独立红标条，绝不压正文！
        let textTop = by + 6;
        if (isInverted) {
          const pill = compact ? "DOM #5 逆流 · 点此归回文末" : "DOM #5 被强行提前 · 点此归回文末";
          ctx.font = `700 ${compact ? 9 : 9.5}px "Noto Sans SC", sans-serif`;
          const pw = Math.min(bw - 12, ctx.measureText(pill).width + 14);
          const ph = 17;
          const px = bx + 7;
          const py = by + 5;
          roundRect(ctx, px, py, pw, ph, 4);
          ctx.fillStyle = COLORS.err;
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(pill, px + 7, py + ph / 2);
          textTop = by + 26;

          hitZones.push({
            kind: "fix-order",
            id: b.id,
            x: bx,
            y: mapY(by),
            w: bw,
            h: bh * scaleY,
            cursor: "pointer",
          });
        }

        // 1:1 向量六瓣几何星标
        drawAsterisk(ctx, bx + 13, textTop + 5.5, 4.5, isInverted ? COLORS.err : COLORS.cobalt);

        ctx.save();
        ctx.beginPath();
        ctx.rect(bx + 20, textTop - 2, bw - 24, bh - (textTop - by) + 4);
        ctx.clip();
        ctx.fillStyle = isInverted ? "#8F1812" : "#1D2C40";
        ctx.font = `500 ${lay.noteFontPx}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        b.lines.forEach((ln, idx) => {
          ctx.fillText(ln, bx + 22, textTop + idx * lay.lineH);
        });
        ctx.restore();
      }

      ctx.restore();
    });

    // 3c. 绘制真实几何重叠红色斜纹警示区
    lay.overlaps.forEach((ov) => {
      const r = ov.rect;
      ctx.save();
      ctx.fillStyle = COLORS.errSoft;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.strokeStyle = COLORS.errStripe;
      ctx.lineWidth = 1.5;
      for (let d = -r.h; d < r.w + r.h; d += 10) {
        ctx.beginPath();
        ctx.moveTo(r.x + d, r.y);
        ctx.lineTo(r.x + d - r.h, r.y + r.h);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    // 3d. 左侧 DOM #1–#5 流序轨 + 贝塞尔实时连线
    const domNodesX = compact ? 22 : 34;
    const domTop = lay.docY + 22;
    const domSpan = Math.max(150, lay.docH - 46);

    ctx.strokeStyle = "#C3D9F4";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(domNodesX, domTop);
    ctx.lineTo(domNodesX, domTop + domSpan);
    ctx.stroke();
    ctx.setLineDash([]);

    lay.byDom.forEach((b, i) => {
      const ny = domTop + (domSpan * i) / 4;
      const curAnim = anim.blockAnim.get(b.id) || b;
      const targetX = curAnim.x - 4;
      const targetY = curAnim.y + Math.min(curAnim.h * 0.45, 22);
      const isBadWire = b.outOfFlow || lay.invertedIds.has(b.id);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(domNodesX + (compact ? 11 : 13), ny);
      const midX = (domNodesX + targetX) * 0.5;
      ctx.bezierCurveTo(midX, ny, midX, targetY, targetX, targetY);
      ctx.strokeStyle = isBadWire ? COLORS.err : "rgba(4, 94, 200, 0.42)";
      ctx.lineWidth = isBadWire ? 1.8 : 1.25;
      if (isBadWire) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();

      const nr = compact ? 10 : 12;
      ctx.beginPath();
      ctx.arc(domNodesX, ny, nr, 0, Math.PI * 2);
      ctx.fillStyle = isBadWire ? COLORS.err : COLORS.cobalt;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${compact ? 9 : 10}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`#${i + 1}`, domNodesX, ny + 0.5);

      if (!compact) {
        ctx.fillStyle = isBadWire ? COLORS.err : COLORS.muted;
        ctx.font = `600 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(b.shortTag, domNodesX, ny + 19);
      }
    });

    // 3e. 演播阅读流光点（Space / 按钮）
    if (anim.sweepActive && lay.sweepPath.length >= 2) {
      const pts = lay.sweepPath;
      const segCount = pts.length - 1;
      const f = anim.sweepT * segCount;
      const idx = Math.min(segCount - 1, Math.floor(f));
      const local = f - idx;
      const p0 = pts[idx];
      const p1 = pts[idx + 1];
      const sx = lerp(p0.x, p1.x, local);
      const sy = lerp(p0.y, p1.y, local);
      const isJumpBack = p1.y < p0.y - 4;
      const isHazard = isJumpBack || p0.outOfFlow || p1.outOfFlow;

      ctx.save();
      for (let s = 0; s <= idx; s++) {
        const a = pts[s];
        const b = pts[s + 1];
        if (!b) break;
        const back = b.y < a.y - 4;
        const endX = s === idx ? sx : b.x;
        const endY = s === idx ? sy : b.y;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = back ? COLORS.err : COLORS.cobalt;
        ctx.lineWidth = back ? 3 : 2.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, 13, 0, Math.PI * 2);
      ctx.fillStyle = isHazard ? "rgba(200, 40, 32, 0.20)" : "rgba(4, 94, 200, 0.22)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = isHazard ? COLORS.err : COLORS.cobalt;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      const msg = isJumpBack
        ? "× 顺序回折跳读！"
        : (p1.outOfFlow ? "× 撞上脱流插图！" : `顺读 DOM #${idx + 1}→#${idx + 2}`);
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      const mw = ctx.measureText(msg).width + 16;
      const mx = Math.max(lay.railW + 8, Math.min(w - mw - 10, sx + 14));
      const my = Math.max(lay.docY + 6, sy - 11);
      roundRect(ctx, mx, my, mw, 22, 5);
      ctx.fillStyle = isHazard ? COLORS.err : COLORS.cobaltDark;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, mx + 8, my + 11);
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
    anim.dirty = anyBlockMoving;
  }

  const ctl = loop(canvas, renderFrame);

  function localPt(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function hitTest(pt) {
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) {
        return z;
      }
    }
    return null;
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    const pt = localPt(ev);
    anim.dragging = true;
    anim.dragStartX = pt.x;
    anim.dragStartMeasure = getState().measurePct;
    anim.dragMoved = false;
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pt = localPt(ev);
    if (!anim.dragging) {
      const hit = hitTest(pt);
      canvas.style.cursor = hit ? hit.cursor : "ew-resize";
      return;
    }
    const dx = pt.x - anim.dragStartX;
    if (Math.abs(dx) > 4) anim.dragMoved = true;
    if (anim.dragMoved && lastLayout) {
      const span = Math.max(120, lastLayout.maxDocW - lastLayout.minDocW);
      const deltaPct = (dx / span) * 72 * 1.35;
      const next = Math.round(Math.max(28, Math.min(100, anim.dragStartMeasure + deltaPct)));
      anim.dirty = true;
      if (next !== getState().measurePct) {
        onPatch({ measurePct: next }, { fromDrag: true });
      }
    }
  });

  function endDrag(ev) {
    if (!anim.dragging) return;
    const pt = localPt(ev);
    const moved = anim.dragMoved;
    anim.dragging = false;
    anim.dragMoved = false;
    anim.dirty = true;
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch {}

    if (!moved) {
      const hit = hitTest(pt);
      if (hit) {
        if (hit.kind === "toggle-figure") {
          const cur = getState().figureFlow;
          onPatch({ figureFlow: cur === "absolute" ? "static" : "absolute" });
        } else if (hit.kind === "fix-order") {
          onPatch({ visualOrder: [0, 1, 2, 3, 4] });
        } else if (hit.kind === "release-height") {
          onPatch({ fixedHeight: false });
        }
      }
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    anim.dragging = false;
    anim.dragMoved = false;
  });

  canvas.addEventListener("keydown", (ev) => {
    const st = getState();
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      onPatch({ measurePct: Math.max(28, st.measurePct - 4) });
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      onPatch({ measurePct: Math.min(100, st.measurePct + 4) });
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      onPatch({ rhythm: Math.max(4, st.rhythm - 2) });
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      onPatch({ rhythm: Math.min(56, st.rhythm + 2) });
    } else if (ev.key === "f" || ev.key === "F") {
      ev.preventDefault();
      onPatch({ figureFlow: st.figureFlow === "absolute" ? "static" : "absolute" });
    } else if (ev.key === "o" || ev.key === "O") {
      ev.preventDefault();
      onPatch({ visualOrder: [0, 1, 2, 3, 4] });
    } else if (ev.key === " ") {
      ev.preventDefault();
      triggerSweep();
    }
  });

  function triggerSweep() {
    anim.dirty = true;
    if (reducedMotion.matches) {
      anim.sweepActive = false;
      anim.sweepT = 0;
      if (onSweepChange) onSweepChange(false, 1);
      ctl.draw();
      return;
    }
    anim.sweepActive = true;
    anim.sweepT = 0.01;
    if (onSweepChange) onSweepChange(true, 0.01);
    ctl.draw();
  }

  ctl.draw();

  return {
    draw: () => {
      anim.dirty = true;
      if (reducedMotion.matches) ctl.draw();
    },
    triggerSweep,
    getLayout: () => lastLayout,
  };
}
