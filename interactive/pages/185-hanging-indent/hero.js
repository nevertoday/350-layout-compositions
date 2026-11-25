// 开场互动舞台：高 DPI 2D Canvas 实时排版引擎 + 放大游标尺 + 原海报双圆母题 + 视线扫描演示
// 不依赖 WebGL：在所有设备、无 WebGL 与软件渲染环境下均保持锐利文字与 60 fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, INDENT_MAX, INDENT_MIN, indentToU, PRESETS } from "./model.js";

const COL = {
  bg: "#0e031d",
  cream: "#f4e9d4",
  creamSoft: "#cfc2af",
  mute: "#9a88ab",
  lime: "#c3d142",
  limeDim: "rgba(195, 209, 66, 0.36)",
  limeFaint: "rgba(195, 209, 66, 0.14)",
  coral: "#fb665b",
  coralSoft: "rgba(251, 102, 91, 0.17)",
  coralDim: "rgba(251, 102, 91, 0.58)",
};

// 合并同行同字体的连续文字段，将每帧 fillText 调用从 ~240 次降到 ~16 次，软件渲染 6× 降速也能稳跑 60fps
function pushMerged(line, seg) {
  const prev = line[line.length - 1];
  if (prev && prev.font === seg.font && prev.color === seg.color && prev.role === seg.role && seg.role !== "marker") {
    prev.text += seg.text;
    prev.w += seg.w;
  } else {
    line.push(seg);
  }
}

// 中英文混排精细折行（缓存字符宽度 + 合并同行段）
function wrapStyledTokens(ctx, tokens, firstW, restW, measureCache) {
  const measure = (font, str) => {
    const key = font + "\0" + str;
    let w = measureCache.get(key);
    if (w === undefined) {
      ctx.font = font;
      w = ctx.measureText(str).width;
      measureCache.set(key, w);
    }
    return w;
  };

  const lines = [];
  let cur = [];
  let curW = 0;
  let maxW = Math.max(52, firstW);

  const pushLine = () => {
    lines.push(cur);
    cur = [];
    curW = 0;
    maxW = Math.max(52, restW);
  };

  for (const tok of tokens) {
    const pieces = tok.atomic ? [tok.text] : tok.text.match(/[A-Za-z0-9.,:;()[\]/'-]+\s*|[^\s]/g) || [tok.text];
    for (const raw of pieces) {
      const text = cur.length === 0 ? raw.replace(/^\s+/, "") : raw;
      if (!text) continue;
      const w = measure(tok.font, text);
      const isClosePunct = /^[，。、；：！？）》】.,;:!?)]$/.test(text);
      if (cur.length > 0 && curW + w > maxW && !isClosePunct) {
        pushLine();
        const trimmed = text.replace(/^\s+/, "");
        if (!trimmed) continue;
        const tw = measure(tok.font, trimmed);
        pushMerged(cur, { text: trimmed, font: tok.font, color: tok.color, role: tok.role, w: tw });
        curW = tw;
      } else {
        pushMerged(cur, { text, font: tok.font, color: tok.color, role: tok.role, w });
        curW += w;
      }
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

export function createHero(canvas, stageEl, state, onLayout) {
  const ctx = canvas.getContext("2d");
  const measureCache = new Map();
  let cssW = 640;
  let cssH = 440;
  let dpr = 1;

  // 平滑动画与按需重绘状态
  let shownEm = reducedMotion.matches ? state.indent : 0;
  let scanPhase = reducedMotion.matches ? -1 : 0;
  let introTimer = 0;
  let introDone = reducedMotion.matches;
  let dirty = true;
  let lastKey = "";
  let lastNotified = { x: -1, y: -1, x0: -1, x1: -1 };

  function resize() {
    const r = stageEl.getBoundingClientRect();
    cssW = Math.max(280, Math.round(r.width));
    cssH = Math.max(320, Math.round(r.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    dirty = true;
  }

  function triggerScan() {
    dirty = true;
    if (reducedMotion.matches) {
      scanPhase = 0.45;
      ctl.draw();
      return;
    }
    scanPhase = 0.001;
    ctl.draw();
  }

  function drawFrame(_t, dt, { still }) {
    const key = `${state.preset}|${state.indent}|${state.showGrid}|${cssW}|${cssH}`;
    if (key !== lastKey) {
      lastKey = key;
      dirty = true;
    }

    let animating = false;
    if (still) {
      shownEm = state.indent;
      introDone = true;
    } else {
      if (!introDone) {
        animating = true;
        introTimer += dt;
        if (state.userTouched) {
          introDone = true;
        } else if (introTimer > 0.2) {
          shownEm += (state.indent - shownEm) * (1 - Math.exp(-dt * 8));
          if (Math.abs(shownEm - state.indent) < 0.015) {
            shownEm = state.indent;
            introDone = true;
            scanPhase = 0.001;
          }
        }
      }
      if (introDone && Math.abs(shownEm - state.indent) > 0.003) {
        animating = true;
        const k = dt > 0 ? 1 - Math.exp(-dt * (state.dragging ? 34 : 15)) : 1;
        shownEm += (state.indent - shownEm) * k;
        if (Math.abs(shownEm - state.indent) < 0.004) shownEm = state.indent;
      }
      if (scanPhase > 0) {
        animating = true;
        scanPhase += dt * 0.58;
        if (scanPhase >= 1.15) scanPhase = -1;
      }
    }

    // 静置且无任何状态变化时跳过重绘，省电且保持 60fps
    if (!still && !animating && !dirty) return;
    dirty = false;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深紫墨底
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    const compact = cssW < 460;
    const padX = compact ? 16 : 28;
    const rulerY = compact ? 58 : 66;
    const topBand = compact ? 98 : 112;
    const bottomPad = 50;

    // 右上角原海报双圆母题（与缩进量实时联动）
    const badgeR = compact ? 14 : 20;
    const rightEdge = cssW - padX - (compact ? 14 : 24);
    const motifCenterX = rightEdge - badgeR * 1.95;
    const motifCenterY = compact ? 42 : 48;
    const motifAxisX = motifCenterX - badgeR;

    // 顶部游标尺轨道
    const trackX0 = padX + 22;
    const trackX1 = Math.max(trackX0 + 130, motifAxisX - (compact ? 22 : 34));
    const trackSpan = trackX1 - trackX0;
    const emToTrackX = (em) => trackX0 + indentToU(em) * trackSpan;

    const zeroTrackX = emToTrackX(0);
    const handleX = emToTrackX(shownEm);

    // 标尺底线
    ctx.strokeStyle = "rgba(195, 209, 66, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(trackX0, rulerY);
    ctx.lineTo(trackX1, rulerY);
    ctx.stroke();

    // 推荐区间色带 (+1.5 .. +2.8 em)
    const sweetA = emToTrackX(1.5);
    const sweetB = emToTrackX(2.8);
    ctx.fillStyle = COL.limeFaint;
    ctx.fillRect(sweetA, rulerY - 6, sweetB - sweetA, 12);

    // 从 0 到当前值的游标高亮段
    ctx.strokeStyle = shownEm >= 0 ? COL.lime : COL.coral;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(zeroTrackX, rulerY);
    ctx.lineTo(handleX, rulerY);
    ctx.stroke();

    // 刻度线与数值
    const ticks = compact ? [-2, 0, 2, 4] : [-2, -1, 0, 1, 2, 3, 4, 5];
    ctx.font = `500 10.5px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (const tk of ticks) {
      const tx = emToTrackX(tk);
      ctx.strokeStyle = tk === 0 ? COL.coral : "rgba(195, 209, 66, 0.48)";
      ctx.lineWidth = tk === 0 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(tx, rulerY - (tk === 0 ? 9 : 5));
      ctx.lineTo(tx, rulerY + (tk === 0 ? 9 : 4));
      ctx.stroke();
      ctx.fillStyle = tk === 0 ? COL.coral : COL.mute;
      ctx.fillText(tk === 0 ? "0" : `${tk > 0 ? "+" : ""}${tk}em`, tx, rulerY - 13);
    }

    // 左上角标尺说明
    ctx.fillStyle = COL.mute;
    ctx.font = `500 10.5px "IBM Plex Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(compact ? "游标尺 · 左右拖" : "缩进游标尺 · 拖动珊瑚红卡尺改变续行退让", padX, 11);

    // ---------- 右上角双圆母题 ----------
    const shiftFrac = clamp(shownEm / 3.0, -0.55, 1.15);
    const ghostDx = shiftFrac * badgeR * 0.92;

    ctx.save();
    ctx.strokeStyle = COL.limeDim;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(motifAxisX, motifCenterY - badgeR - 5);
    ctx.lineTo(motifAxisX, motifCenterY + badgeR + 7);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COL.coral;
    ctx.beginPath();
    ctx.arc(motifAxisX, motifCenterY + badgeR + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COL.lime;
    ctx.beginPath();
    ctx.arc(motifCenterX, motifCenterY, badgeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = shownEm < 0 ? COL.coral : COL.lime;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3.5, 3]);
    ctx.beginPath();
    ctx.arc(motifCenterX + ghostDx, motifCenterY, badgeR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ---------- 真实排印字号与 em 缩进 ----------
    const baseFont = compact ? 13.5 : 15;
    const emPx = baseFont * 1.12;
    const lineH = Math.round(baseFont * 1.62);

    const textAxisX = padX + (compact ? 10 : 18);
    const indentPx = shownEm * emPx;
    const firstLineX = shownEm >= 0 ? textAxisX : textAxisX - indentPx;
    const restLineX = shownEm >= 0 ? textAxisX + indentPx : textAxisX;

    const firstAvailW = Math.max(100, rightEdge - firstLineX - 8);
    const restAvailW = Math.max(72, rightEdge - restLineX - 8);

    const preset = PRESETS[state.preset] || PRESETS.poster;
    const bodyFont = `400 ${baseFont}px "Noto Sans SC", sans-serif`;
    const headFont = `700 ${baseFont}px "Noto Sans SC", sans-serif`;
    const markerFont = `600 ${Math.round(baseFont * 0.92)}px "IBM Plex Mono", "Noto Sans SC", monospace`;

    const laidOut = [];
    let curY = topBand + 4;
    const maxBottom = cssH - bottomPad - 24;

    for (let idx = 0; idx < preset.entries.length; idx++) {
      const entry = preset.entries[idx];
      const tokens = [];
      if (entry.marker) {
        tokens.push({
          text: entry.marker === "●" ? "●" : entry.marker + " ",
          font: markerFont,
          color: COL.coral,
          role: "marker",
          atomic: true,
        });
      }
      tokens.push({
        text: (entry.marker === "●" ? " " : "") + entry.head + (entry.head.endsWith("】") ? " " : "  "),
        font: headFont,
        color: COL.cream,
        role: "head",
        atomic: true,
      });
      tokens.push({
        text: entry.body,
        font: bodyFont,
        color: COL.creamSoft,
        role: "body",
        atomic: false,
      });

      const lines = wrapStyledTokens(ctx, tokens, firstAvailW, restAvailW, measureCache);
      const blockH = lines.length * lineH;
      const gapAfter = compact ? 12 : 16;

      if (laidOut.length >= 2 && curY + blockH > maxBottom) break;
      laidOut.push({ idx, entry, lines, y: curY, h: blockH });
      curY += blockH + gapAfter;
    }

    const contentTop = laidOut.length ? laidOut[0].y - 6 : topBand;
    const contentBottom = laidOut.length ? laidOut[laidOut.length - 1].y + laidOut[laidOut.length - 1].h + 4 : maxBottom;

    // ---------- 尺面与正文基线的连接折线 ----------
    const activeRailX = shownEm >= 0 ? restLineX : firstLineX;
    ctx.save();
    ctx.strokeStyle = "rgba(195, 209, 66, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(handleX, rulerY + 12);
    ctx.lineTo(handleX, rulerY + 22);
    ctx.lineTo(activeRailX, contentTop - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ---------- 检索走廊高亮与垂直参考线 ----------
    if (shownEm > 0.25) {
      const alpha = state.showGrid ? 0.16 : clamp((shownEm - 0.25) / 2.2, 0, 1) * 0.085;
      ctx.fillStyle = `rgba(195, 209, 66, ${alpha.toFixed(3)})`;
      ctx.fillRect(textAxisX, contentTop, restLineX - textAxisX, contentBottom - contentTop);
    } else if (shownEm < -0.25 && state.showGrid) {
      ctx.fillStyle = COL.coralSoft;
      ctx.fillRect(textAxisX, contentTop, firstLineX - textAxisX, contentBottom - contentTop);
    }

    ctx.save();
    ctx.strokeStyle = state.showGrid ? COL.coral : "rgba(251, 102, 91, 0.58)";
    ctx.lineWidth = state.showGrid ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(textAxisX, contentTop - 4);
    ctx.lineTo(textAxisX, contentBottom + 10);
    ctx.stroke();

    ctx.fillStyle = COL.coral;
    ctx.beginPath();
    ctx.arc(textAxisX, contentBottom + 10, 3, 0, Math.PI * 2);
    ctx.fill();

    if (Math.abs(shownEm) >= 0.08) {
      ctx.strokeStyle = shownEm >= 0 ? COL.lime : COL.coral;
      ctx.lineWidth = state.showGrid ? 1.5 : 1.1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(activeRailX, contentTop - 4);
      ctx.lineTo(activeRailX, contentBottom + 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (state.showGrid || Math.abs(shownEm) > 0.35) {
      const arrowY = contentBottom + 10;
      ctx.strokeStyle = shownEm >= 0 ? COL.lime : COL.coral;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(textAxisX + 4, arrowY);
      ctx.lineTo(activeRailX, arrowY);
      ctx.stroke();

      ctx.fillStyle = shownEm >= 0 ? COL.lime : COL.coral;
      ctx.font = `500 10.5px "IBM Plex Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const labelTxt =
        shownEm >= 0.1
          ? `续行内缩 +${shownEm.toFixed(1)}em`
          : shownEm <= -0.1
            ? `首行内缩 ${Math.abs(shownEm).toFixed(1)}em`
            : "0em 齐左对齐";
      ctx.fillText(labelTxt, Math.min(activeRailX + 8, rightEdge - 115), arrowY);
    }

    // 右侧原海报珊瑚红方括号 `]`
    const brX = rightEdge + (compact ? 6 : 12);
    ctx.strokeStyle = COL.coralDim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(brX - 7, contentTop);
    ctx.lineTo(brX, contentTop);
    ctx.lineTo(brX, contentBottom);
    ctx.lineTo(brX - 7, contentBottom);
    ctx.stroke();
    ctx.restore();

    // ---------- 绘制条目文本与点状分隔线 ----------
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const scanY = scanPhase > 0 ? contentTop + clamp(scanPhase, 0, 1) * (contentBottom - contentTop) : -999;

    for (let i = 0; i < laidOut.length; i++) {
      const item = laidOut[i];
      const headMidY = item.y + lineH * 0.46;
      const scanHit = scanPhase > 0 ? clamp(1 - Math.abs(scanY - headMidY) / 36, 0, 1) : 0;

      if (scanHit > 0.05) {
        ctx.fillStyle = `rgba(195, 209, 66, ${(scanHit * 0.22).toFixed(3)})`;
        ctx.fillRect(firstLineX - 4, item.y - 2, Math.min(130, firstAvailW), lineH + 2);
      }

      for (let li = 0; li < item.lines.length; li++) {
        const line = item.lines[li];
        const baselineY = item.y + (li + 1) * lineH - Math.round(lineH * 0.26);
        let penX = li === 0 ? firstLineX : restLineX;

        if (state.showGrid && li === 0 && shownEm > 0.35) {
          ctx.fillStyle = COL.lime;
          ctx.fillRect(textAxisX - 7, item.y + 4, 3, lineH - 8);
        }

        for (const seg of line) {
          if (seg.role === "marker" && seg.text.trim() === "●") {
            const r = compact ? 4.2 : 5;
            ctx.fillStyle = COL.coral;
            ctx.beginPath();
            ctx.arc(penX + r, baselineY - baseFont * 0.34, r, 0, Math.PI * 2);
            ctx.fill();
            penX += seg.w;
          } else {
            ctx.font = seg.font;
            ctx.fillStyle = scanHit > 0.25 && seg.role === "head" ? COL.lime : seg.color;
            ctx.fillText(seg.text, penX, baselineY);
            penX += seg.w;
          }
        }
      }

      if (i < laidOut.length - 1) {
        const sepY = item.y + item.h + (compact ? 6 : 8);
        ctx.save();
        ctx.strokeStyle = COL.limeDim;
        ctx.lineWidth = 1;
        ctx.setLineDash([1.5, 4]);
        ctx.beginPath();
        ctx.moveTo(textAxisX, sepY);
        ctx.lineTo(rightEdge, sepY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 扫描光束
    if (scanPhase > 0 && scanPhase <= 1.05) {
      const clampedScanY = clamp(scanY, contentTop, contentBottom);
      const beamW = shownEm > 0.4 ? Math.max(64, restLineX - textAxisX + 46) : 92;
      const grad = ctx.createLinearGradient(textAxisX, 0, textAxisX + beamW, 0);
      grad.addColorStop(0, "rgba(195, 209, 66, 0.92)");
      grad.addColorStop(1, "rgba(195, 209, 66, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(textAxisX - 4, clampedScanY);
      ctx.lineTo(textAxisX + beamW, clampedScanY);
      ctx.stroke();

      ctx.fillStyle = COL.lime;
      ctx.beginPath();
      ctx.arc(textAxisX, clampedScanY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (
      onLayout &&
      (Math.abs(handleX - lastNotified.x) > 0.25 ||
        Math.abs(rulerY - lastNotified.y) > 0.25 ||
        Math.abs(trackX0 - lastNotified.x0) > 0.25 ||
        Math.abs(trackX1 - lastNotified.x1) > 0.25)
    ) {
      lastNotified = { x: handleX, y: rulerY, x0: trackX0, x1: trackX1 };
      onLayout({ x: handleX, y: rulerY, x0: trackX0, x1: trackX1 });
    }
  }

  const ctl = loop(stageEl, drawFrame);
  const ro = new ResizeObserver(() => {
    resize();
    ctl.draw();
  });
  ro.observe(stageEl);
  resize();
  ctl.draw();

  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    triggerScan,
    getGeom: () => lastNotified,
    setImmediate: (em) => {
      shownEm = clamp(em, INDENT_MIN, INDENT_MAX);
      introDone = true;
      dirty = true;
      ctl.draw();
    },
  };
}
