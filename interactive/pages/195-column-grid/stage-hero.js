// 195 · 开场主角玩具：活体瑞士分栏拼版台（2D Canvas + 离屏缓存双层架构 + 鼠标/触屏/键盘直拖）
import { pixelRatio, loop, reducedMotion } from "../../lib/stage.js";
import {
  LOGICAL_W,
  LOGICAL_H,
  LINE_HEIGHT_PX,
  evaluateBoard,
  dragDivider
} from "./model.js";

const C = {
  paper: "#FBF9F5",
  paperEdge: "#D4CFC6",
  colFill: "rgba(219, 219, 240, 0.72)",
  colFillHover: "rgba(184, 202, 245, 0.72)",
  blue: "#013DBF",
  blueMid: "#406CEB",
  blueSoft: "#B8CAF5",
  gold: "#F5C02C",
  ink: "#151924",
  inkSoft: "#4C5466",
  err: "#C62828",
  errSoft: "rgba(198, 40, 40, 0.14)",
  ok: "#0D7A5F"
};

// 轻量换行缓存
const wrapCache = new Map();
function wrapLines(ctx, text, maxW, maxLines) {
  if (maxW < 18) return [];
  const key = `${ctx.font}|${Math.round(maxW / 4) * 4}|${maxLines}|${text.length}|${text.slice(0, 12)}`;
  const cached = wrapCache.get(key);
  if (cached) return cached;
  const lines = [];
  let line = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      lines.push(line);
      line = ch;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (wrapCache.size > 400) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

// 预绘一次沙漠风景底图（避免每帧创建渐变与贝塞尔路径）
let desertSprite = null;
function getDesertSprite() {
  if (desertSprite) return desertSprite;
  const c = document.createElement("canvas");
  c.width = 360;
  c.height = 220;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, "#1E4EB8");
  grad.addColorStop(0.54, "#7BA4E8");
  grad.addColorStop(0.55, "#E0B66E");
  grad.addColorStop(1, "#A87434");
  g.fillStyle = grad;
  g.fillRect(0, 0, 360, 220);

  g.fillStyle = "#C69047";
  g.beginPath();
  g.moveTo(0, 220);
  g.lineTo(0, 140);
  g.quadraticCurveTo(122, 96, 234, 150);
  g.lineTo(360, 123);
  g.lineTo(360, 220);
  g.closePath();
  g.fill();

  g.fillStyle = "#7D521E";
  g.beginPath();
  g.moveTo(90, 220);
  g.quadraticCurveTo(223, 128, 360, 172);
  g.lineTo(360, 220);
  g.closePath();
  g.fill();

  g.fillStyle = C.gold;
  g.beginPath();
  g.arc(282, 56, 18, 0, Math.PI * 2);
  g.fill();

  desertSprite = c;
  return c;
}

export function mountHeroStage(canvas, getState, setState, onChange) {
  const ctx = canvas.getContext("2d");
  const cacheCanvas = document.createElement("canvas");
  const cacheCtx = cacheCanvas.getContext("2d");

  let draggingDivider = -1;
  let hoverDivider = -1;
  let hoverBlock = false;
  let pointerId = null;
  let downX = 0;
  let downY = 0;
  let pulsePhase = 0;
  let introT = 0;
  let blockHitRects = [];
  let cacheDirty = true;
  let cachedW = 0;
  let cachedH = 0;
  let lastFastMode = false;
  let touchDragging = false;
  let touchDiv = -1;
  let touchStartX = 0;
  let touchStartY = 0;

  function metrics() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(260, rect.width || 640);
    const cssH = Math.max(170, rect.height || 400);
    const compact = cssH < 260 || cssW < 420;
    const padL = compact ? 14 : 32;
    const padR = compact ? 14 : 32;
    const padT = compact ? 24 : 36;
    const padB = compact ? 22 : 32;
    const availW = cssW - padL - padR;
    const availH = cssH - padT - padB;
    const scale = Math.min(availW / LOGICAL_W, availH / LOGICAL_H);
    const pageW = LOGICAL_W * scale;
    const pageH = LOGICAL_H * scale;
    const ox = (cssW - pageW) / 2;
    const oy = padT + (availH - pageH) / 2;
    return { cssW, cssH, scale, pageW, pageH, ox, oy };
  }

  function clientToLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const m = metrics();
    return { lx: (cx - m.ox) / m.scale, ly: (cy - m.oy) / m.scale, cx, cy, m };
  }

  function findDivider(ev, lx, radius = 32) {
    if (ev.gutters.length === 0) return -1;
    let best = -1;
    let bestDist = Infinity;
    for (const g of ev.gutters) {
      const d = Math.abs(lx - g.centerX);
      if (d < bestDist) {
        bestDist = d;
        best = g.index;
      }
    }
    return bestDist <= radius ? best : -1;
  }

  function hitBlock(lx, ly) {
    return blockHitRects.some((r) => lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h);
  }

  // 把静态排版与分栏纸面画到离屏缓存（拖动手势期间用 fastText 避免慢手机软件光栅化数百 CJK 字形，松手即刻还原完整汉字）
  function rebuildCache(state, ev, m, dpr, fastMode) {
    const needW = Math.round(m.cssW * dpr);
    const needH = Math.round(m.cssH * dpr);
    if (cacheCanvas.width !== needW || cacheCanvas.height !== needH) {
      cacheCanvas.width = needW;
      cacheCanvas.height = needH;
    }

    const g = cacheCtx;
    g.save();
    g.scale(dpr, dpr);
    g.clearRect(0, 0, m.cssW, m.cssH);

    // 舞台台面底纸
    g.fillStyle = "#EDE8DF";
    g.fillRect(0, 0, m.cssW, m.cssH);

    // 1. 出版页面实体（960:600 严格等比）
    const { ox, oy, pageW, pageH, scale } = m;
    g.fillStyle = "rgba(1, 61, 191, 0.08)";
    g.fillRect(ox + 5, oy + 5, pageW, pageH);
    g.fillStyle = C.paper;
    g.fillRect(ox, oy, pageW, pageH);
    g.strokeStyle = C.paperEdge;
    g.lineWidth = 1;
    g.strokeRect(ox + 0.5, oy + 0.5, pageW - 1, pageH - 1);

    // 顶部标尺（宽屏三段，窄画布居中精简单行，0 重叠）
    g.font = `600 ${pageW < 460 ? 10.5 : 11}px "DM Mono", "Noto Sans SC", monospace`;
    g.textBaseline = "middle";
    const rulerY = oy - (m.cssH < 260 ? 12 : 16);
    if (pageW < 500) {
      g.textAlign = "center";
      g.fillStyle = ev.passCount === 4 ? C.ok : C.blue;
      const alignShort = ev.offGridPx > 0 ? `脱栏+${ev.offGridPx}px` : "贴栏";
      const summary = ev.cols === 1
        ? `单栏 · 边距${state.marginPct}% · ${ev.maxChars}字/行`
        : `${ev.cols}栏 ${ev.ratioText} · 缝${ev.gutterPx}px · 边${state.marginPct}% · ${alignShort}`;
      g.fillText(summary, ox + pageW / 2, rulerY);
    } else {
      g.fillStyle = C.inkSoft;
      g.textAlign = "left";
      g.fillText(`M ${state.marginPct}% (${ev.marginX}px)`, ox, rulerY);
      g.textAlign = "center";
      g.fillStyle = ev.passCount === 4 ? C.ok : C.blue;
      g.fillText(
        ev.cols === 1 ? `1 COL · ${ev.maxChars}字/行` : `${ev.cols} COLS · ${ev.ratioText} · GUTTER ${ev.gutterPx}px`,
        ox + pageW / 2,
        rulerY
      );
      g.textAlign = "right";
      g.fillStyle = ev.offGridPx > 0 ? C.err : C.ok;
      g.fillText(ev.offGridPx > 0 ? `OFF-GRID +${ev.offGridPx}px` : "ALIGNED 0px", ox + pageW, rulerY);
    }

    // 逻辑坐标系（960 × 600）
    g.save();
    g.translate(ox, oy);
    g.scale(scale, scale);

    // 2. 淡蓝紫垂直栏柱
    if (state.showGrid) {
      ev.columns.forEach((col, i) => {
        const isAdj = i === draggingDivider || i === draggingDivider + 1 || i === hoverDivider || i === hoverDivider + 1;
        g.fillStyle = isAdj ? C.colFillHover : C.colFill;
        g.fillRect(col.x, col.y, col.w, ev.innerH);
      });
    }

    // 3. 水平蓝虚线基线（合并单次 path + stroke，极速光栅化）
    if (state.showBaseline) {
      g.save();
      g.strokeStyle = "rgba(64, 108, 235, 0.28)";
      g.lineWidth = 1 / scale;
      g.setLineDash([4, 4]);
      g.beginPath();
      for (let y = ev.marginY; y <= LOGICAL_H - ev.marginY + 0.5; y += LINE_HEIGHT_PX * 2) {
        g.moveTo(ev.marginX, y);
        g.lineTo(LOGICAL_W - ev.marginX, y);
      }
      g.stroke();
      g.restore();
    }

    // 4. 蓝色虚线页边距框
    g.save();
    const marginBad = state.marginPct < 6 || state.marginPct > 17;
    g.strokeStyle = marginBad ? C.err : C.blueMid;
    g.lineWidth = 1.2 / scale;
    g.setLineDash([6, 4]);
    g.strokeRect(ev.marginX, ev.marginY, ev.innerW, ev.innerH);
    g.restore();

    // 5. 出版物内容块
    blockHitRects = [];
    drawEditorialContent(g, state, ev, blockHitRects, scale, fastMode);

    // 6. 栏缝竖轨与微柄
    ev.gutters.forEach((gt) => {
      const active = gt.index === draggingDivider || gt.index === hoverDivider || gt.index === state.activeDivider;
      if (ev.crossReadRisk) {
        g.fillStyle = C.errSoft;
        g.fillRect(gt.x - 4, gt.y, gt.w + 8, gt.h);
      } else if (ev.splitRisk) {
        g.fillStyle = "rgba(198, 40, 40, 0.08)";
        g.fillRect(gt.x, gt.y, gt.w, gt.h);
      }

      g.save();
      g.strokeStyle = ev.crossReadRisk || ev.splitRisk ? C.err : active ? C.blue : "rgba(1, 61, 191, 0.45)";
      g.lineWidth = (active ? 2.4 : 1.2) / scale;
      g.setLineDash(active ? [] : [5, 5]);
      g.beginPath();
      g.moveTo(gt.centerX, gt.y - 6);
      g.lineTo(gt.centerX, gt.y + gt.h + 6);
      g.stroke();
      g.restore();

      const handleY = ev.marginY + ev.innerH * 0.68;
      const hw = 26;
      const hh = 34;
      g.fillStyle = gt.index === draggingDivider ? C.gold : ev.crossReadRisk ? C.err : active ? C.blue : "#FFFFFF";
      g.strokeStyle = ev.crossReadRisk ? C.err : C.blue;
      g.lineWidth = 1.6 / scale;
      g.fillRect(gt.centerX - hw / 2, handleY - hh / 2, hw, hh);
      g.strokeRect(gt.centerX - hw / 2, handleY - hh / 2, hw, hh);
      g.fillStyle = gt.index === draggingDivider ? C.ink : ev.crossReadRisk || active ? "#FFFFFF" : C.blue;
      g.font = `700 13px "IBM Plex Sans", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("↔", gt.centerX, handleY + 0.5);
    });

    // 7. 底部各栏实时字数刻度
    g.font = `600 12px "DM Mono", "Noto Sans SC", monospace`;
    g.textAlign = "center";
    g.textBaseline = "top";
    ev.columns.forEach((col, i) => {
      const cramped = col.chars < (ev.cols >= 4 ? 9 : 10);
      g.fillStyle = cramped ? C.err : C.ink;
      g.fillText(`C${i + 1} · ${col.chars}字`, col.x + col.w / 2, LOGICAL_H + 10);
    });

    g.restore();
    g.restore();
    cacheDirty = false;
    cachedW = needW;
    cachedH = needH;
    lastFastMode = fastMode;
  }

  function drawScene(t, dt, { still }) {
    const state = getState();
    const ev = evaluateBoard(state);
    const m = metrics();
    // 手机窄屏用 1.5 DPR 兼顾清晰度与软件渲染帧率（桌面保持 2）
    const dpr = pixelRatio(m.cssW <= 500 ? 1.5 : 2);
    const needW = Math.round(m.cssW * dpr);
    const needH = Math.round(m.cssH * dpr);
    if (canvas.width !== needW || canvas.height !== needH) {
      canvas.width = needW;
      canvas.height = needH;
      cacheDirty = true;
    }

    if (still) {
      introT = 1;
      pulsePhase = 0.35;
    } else {
      introT = Math.min(1, introT + (dt || 0.016) * 2.6);
      pulsePhase = (t * 0.9) % 1;
    }

    const fastMode = touchDragging || draggingDivider >= 0;
    if (cacheDirty || cachedW !== needW || cachedH !== needH || lastFastMode !== fastMode) {
      rebuildCache(state, ev, m, dpr, fastMode);
    }

    // 主画布仅 1 次极快 drawImage 贴入缓存底板，再叠画极轻的动态串行脉动线与开场扫描线
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cacheCanvas, 0, 0);

    // 串行警示动画层（仅 4 个轻量原语，软件渲染也能稳定 60fps！）
    if (ev.crossReadRisk && ev.gutters.length > 0) {
      ctx.scale(dpr, dpr);
      ctx.translate(m.ox, m.oy);
      ctx.scale(m.scale, m.scale);

      const g0 = ev.gutters[0];
      const leftCol = ev.columns[0];
      const rightCol = ev.columns[1];
      const yLine = ev.marginY + 185;
      const x1 = leftCol.x + leftCol.w * 0.55;
      const x2 = rightCol.x + Math.min(rightCol.w * 0.72, 110);

      ctx.strokeStyle = C.err;
      ctx.lineWidth = 2.4 / m.scale;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, yLine);
      ctx.lineTo(x2, yLine);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = C.err;
      ctx.beginPath();
      ctx.moveTo(x2 + 6, yLine);
      ctx.lineTo(x2 - 4, yLine - 5);
      ctx.lineTo(x2 - 4, yLine + 5);
      ctx.closePath();
      ctx.fill();

      const px = x1 + (x2 - x1) * pulsePhase;
      ctx.beginPath();
      ctx.arc(px, yLine, 5, 0, Math.PI * 2);
      ctx.fill();

      if (!fastMode) {
        const tagW = 196;
        const tagH = 26;
        const tagX = Math.max(ev.marginX + 6, Math.min(LOGICAL_W - ev.marginX - tagW - 6, g0.centerX - tagW / 2));
        const tagY = yLine - 36;
        ctx.fillStyle = C.err;
        ctx.fillRect(tagX, tagY, tagW, tagH);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`栏缝 ${ev.gutterPx}px < 行距 ${LINE_HEIGHT_PX}px · 易串行`, tagX + tagW / 2, tagY + tagH / 2 + 0.5);
      }
    }
    ctx.restore();
  }

  function drawEditorialContent(ctx, state, ev, hitList, scale, fastMode) {
    const t = ev.topic;
    const cols = ev.columns;
    const offX = ev.offGridPx;
    const topY = ev.marginY + 14;

    const titleSpan = state.topic === "news" ? cols.length : Math.min(cols.length, Math.max(1, state.heroSpan));
    const headX = cols[0].x;
    const headEndCol = cols[titleSpan - 1];
    const headW = headEndCol.x + headEndCol.w - headX;

    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(headX + 6, topY + 7, 5, 0, Math.PI * 2);
    ctx.fill();

    let curY = topY + 28;
    if (fastMode) {
      ctx.fillStyle = C.blue;
      ctx.fillRect(headX + 18, topY + 4, Math.min(headW - 24, 156), 6);
      ctx.fillStyle = C.ink;
      ctx.fillRect(headX, curY - 4, Math.min(headW, 300), 20);
      curY += 30;
    } else {
      ctx.font = `600 11px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = C.blue;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(t.kicker, headX + 18, topY + 7.5);

      ctx.font = `900 ${cols.length === 1 ? 28 : 24}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = C.ink;
      const headLines = wrapLines(ctx, t.headline, headW, 2);
      headLines.forEach((ln) => {
        ctx.fillText(ln, headX, curY);
        curY += 30;
      });
    }

    ctx.fillStyle = C.blue;
    ctx.fillRect(headX, curY - 4, Math.min(headW, 72), 3);
    const contentTopY = curY + 14;
    const contentBottomY = ev.marginY + ev.innerH - 12;

    if (state.topic === "magazine") {
      const imgSpan = Math.min(cols.length > 1 ? Math.min(state.heroSpan, cols.length - 1) : 1, cols.length);
      const imgStartCol = cols[0];
      const imgEndCol = cols[imgSpan - 1];
      const imgBaseX = imgStartCol.x;
      const imgW = imgEndCol.x + imgEndCol.w - imgBaseX;
      const imgX = imgBaseX + offX;
      const imgY = contentTopY;
      const imgH = cols.length === 1 ? 150 : 210;

      drawPhotoBlock(ctx, imgX, imgY, imgW, imgH, offX, scale, "主图（点击贴栏）", fastMode);
      hitList.push({ x: imgX, y: imgY, w: imgW, h: imgH });
      if (offX > 0) drawOffGridCue(ctx, imgBaseX, imgY, imgW, imgH, offX, scale);

      if (cols.length === 1) {
        drawParagraphInCol(ctx, cols[0], imgY + imgH + 18, contentBottomY, t.body.join(""), fastMode);
      } else {
        drawParagraphInCol(ctx, { ...cols[0], w: imgW }, imgY + imgH + 16, contentBottomY - 12, t.lead, fastMode);
        for (let i = imgSpan; i < cols.length; i++) {
          const isLast = i === cols.length - 1;
          const qH = isLast ? 92 : 0;
          drawParagraphInCol(
            ctx,
            cols[i],
            contentTopY,
            contentBottomY - (isLast ? qH + 14 : 0),
            t.body[(i - imgSpan) % t.body.length] + t.body[(i - imgSpan + 1) % t.body.length],
            fastMode
          );
          if (isLast) {
            const qX = cols[i].x - (offX > 0 ? Math.min(offX, 16) : 0);
            const qY = contentBottomY - qH;
            drawQuoteBlock(ctx, qX, qY, cols[i].w, qH, t.quote, offX > 0, scale, fastMode);
            hitList.push({ x: qX, y: qY, w: cols[i].w, h: qH });
          }
        }
      }
    } else if (state.topic === "product") {
      cols.forEach((col, i) => {
        const shift = i === 1 && offX > 0 ? offX : 0;
        const bx = col.x + shift;
        const by = contentTopY;
        const bh = contentBottomY - contentTopY;
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.fillRect(bx, by, col.w, bh);
        ctx.strokeStyle = shift > 0 ? C.err : "rgba(1, 61, 191, 0.18)";
        ctx.lineWidth = (shift > 0 ? 1.6 : 1) / scale;
        ctx.strokeRect(bx, by, col.w, bh);
        if (shift > 0) drawOffGridCue(ctx, col.x, by, col.w, bh, shift, scale);
        hitList.push({ x: bx, y: by, w: col.w, h: bh });

        const iconCx = bx + Math.min(28, col.w / 2);
        const iconCy = by + 30;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(iconCx, iconCy, 14, 0, Math.PI * 2);
        ctx.stroke();
        if (!fastMode) {
          ctx.fillStyle = C.blue;
          ctx.font = `700 11px "DM Mono", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`0${i + 1}`, iconCx, iconCy + 0.5);
        }
        ctx.fillStyle = C.gold;
        ctx.fillRect(bx + 14, by + 56, Math.min(44, col.w - 28), 4);

        drawParagraphInCol(
          ctx,
          { x: bx + 12, w: Math.max(20, col.w - 24), chars: col.chars },
          by + 74,
          by + bh - 14,
          t.body[i % t.body.length],
          fastMode
        );
      });
    } else if (state.topic === "data") {
      const heights = [
        [0.35, 0.55, 0.88],
        [0.28, 0.62, 0.94],
        [0.42, 0.72, 0.98],
        [0.48, 0.82, 0.40]
      ];
      cols.forEach((col, i) => {
        const mItem = t.metrics[i % t.metrics.length];
        const shift = i === cols.length - 1 && offX > 0 ? -offX : 0;
        const bx = col.x + shift;
        const by = contentTopY;
        const bh = contentBottomY - contentTopY;

        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(bx, by, col.w, bh);
        ctx.strokeStyle = shift !== 0 ? C.err : "rgba(1, 61, 191, 0.22)";
        ctx.lineWidth = (shift !== 0 ? 1.6 : 1) / scale;
        ctx.strokeRect(bx, by, col.w, bh);
        if (shift !== 0) drawOffGridCue(ctx, col.x, by, col.w, bh, shift, scale);
        hitList.push({ x: bx, y: by, w: col.w, h: bh });

        if (fastMode) {
          ctx.fillStyle = C.blue;
          ctx.fillRect(bx + 12, by + 20, Math.min(60, col.w - 24), 22);
          ctx.fillStyle = C.ink;
          ctx.fillRect(bx + 12, by + 54, Math.min(54, col.w - 24), 8);
        } else {
          ctx.fillStyle = C.blue;
          ctx.font = `800 ${col.w < 110 ? 22 : 30}px "Big Shoulders", "DM Mono", sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(mItem.value, bx + 12, by + 18);
          ctx.fillStyle = C.ink;
          ctx.font = `700 12px "Noto Sans SC", sans-serif`;
          ctx.fillText(mItem.label, bx + 12, by + 56);
        }

        const chartBaseY = by + bh - 24;
        const chartH = 92;
        const bars = heights[i % heights.length];
        const barW = Math.max(6, Math.min(18, (col.w - 36) / 4));
        const gap = Math.max(4, barW * 0.45);
        bars.forEach((hRatio, bi) => {
          const rx = bx + 12 + bi * (barW + gap);
          const rh = chartH * hRatio;
          ctx.fillStyle = bi === 2 ? C.blue : C.blueSoft;
          ctx.fillRect(rx, chartBaseY - rh, barW, rh);
        });
        ctx.fillStyle = C.blue;
        ctx.fillRect(bx + 12, chartBaseY, Math.max(24, col.w - 24), 2);

        drawParagraphInCol(
          ctx,
          { x: bx + 12, w: Math.max(20, col.w - 24), chars: col.chars },
          by + 84,
          chartBaseY - chartH - 12,
          t.body[i % t.body.length],
          fastMode
        );
      });
    } else {
      cols.forEach((col, i) => {
        const isLast = i === cols.length - 1;
        const qH = isLast ? 116 : 0;
        drawParagraphInCol(
          ctx,
          col,
          contentTopY,
          contentBottomY - (isLast ? qH + 14 : 0),
          t.body[i % t.body.length] + t.body[(i + 1) % t.body.length],
          fastMode
        );
        if (isLast) {
          const qX = col.x + (offX > 0 ? -offX : 0);
          const qY = contentBottomY - qH;
          drawQuoteBlock(ctx, qX, qY, col.w, qH, t.quote, offX > 0, scale, fastMode);
          if (offX > 0) drawOffGridCue(ctx, col.x, qY, col.w, qH, -offX, scale);
          hitList.push({ x: qX, y: qY, w: col.w, h: qH });
        }
      });
    }
  }

  function drawPhotoBlock(ctx, x, y, w, h, offX, scale, caption, fastMode) {
    ctx.drawImage(getDesertSprite(), x, y, w, h);
    if (offX > 0) {
      ctx.strokeStyle = C.err;
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(x, y, w, h);
    }
    ctx.fillStyle = offX > 0 ? C.err : "rgba(21, 25, 36, 0.78)";
    ctx.fillRect(x, y + h - 24, w, 24);
    if (!fastMode) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(offX > 0 ? `脱栏 +${offX}px · 点击吸附栏线` : caption, x + 8, y + h - 12);
    }
  }

  function drawQuoteBlock(ctx, x, y, w, h, quote, isOff, scale, fastMode) {
    ctx.fillStyle = C.gold;
    ctx.fillRect(x, y, w, h);
    if (isOff) {
      ctx.strokeStyle = C.err;
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(x, y, w, h);
    }
    if (fastMode) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x + 12, y + 26, Math.max(18, w - 28), 6);
      ctx.fillRect(x + 12, y + 40, Math.max(14, w - 40), 6);
      return;
    }
    ctx.fillStyle = C.ink;
    ctx.font = `900 22px "Big Shoulders", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("“", x + 10, y + 6);

    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    const lines = wrapLines(ctx, quote.replace(/[“”]/g, ""), Math.max(24, w - 22), 3);
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, x + 11, y + 32 + idx * 17);
    });
  }

  function drawOffGridCue(ctx, baseX, y, w, h, shift, scale) {
    ctx.save();
    ctx.strokeStyle = C.err;
    ctx.lineWidth = 1.4 / scale;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(baseX, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = C.err;
    const lx = shift > 0 ? baseX : baseX + w;
    ctx.fillRect(lx, y - 16, Math.abs(shift), 12);
    ctx.restore();
  }

  function drawParagraphInCol(ctx, col, startY, endY, text, fastMode) {
    const padX = 4;
    const maxW = col.w - padX * 2;
    const maxLines = Math.max(0, Math.floor((endY - startY) / LINE_HEIGHT_PX));
    if (maxLines <= 0 || maxW < 24) return;
    if (fastMode) {
      const n = Math.min(maxLines, Math.ceil((text.length * 14) / Math.max(28, maxW)));
      ctx.fillStyle = "rgba(21, 25, 36, 0.55)";
      for (let i = 0; i < n; i++) {
        const lw = i === n - 1 ? maxW * 0.65 : maxW;
        ctx.fillRect(col.x + padX, startY + i * LINE_HEIGHT_PX + 4, lw, 6);
      }
      if (col.chars < 9 && n > 0) {
        ctx.fillStyle = C.err;
        ctx.fillRect(col.x, startY, 3, Math.min(endY - startY, n * LINE_HEIGHT_PX));
      }
      return;
    }
    ctx.font = `400 13.5px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = C.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const lines = wrapLines(ctx, text, maxW, maxLines);
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, col.x + padX, startY + idx * LINE_HEIGHT_PX);
    });
    if (col.chars < 9 && lines.length > 0) {
      ctx.fillStyle = C.err;
      ctx.fillRect(col.x, startY, 3, Math.min(endY - startY, lines.length * LINE_HEIGHT_PX));
    }
  }

  const runner = loop(canvas, drawScene);

  function markDirty(forceDraw = false) {
    cacheDirty = true;
    if (forceDraw || reducedMotion.matches) runner.draw();
  }

  // 鼠标/笔交互（触屏走 touch，不重复触发；拖动过程仅标 dirty 由 rAF 统一一帧一画）
  function handleDown(e) {
    if (e.pointerType === "touch") return;
    const state = getState();
    const ev = evaluateBoard(state);
    const { lx, ly } = clientToLogical(e.clientX, e.clientY);
    pointerId = e.pointerId;
    downX = e.clientX;
    downY = e.clientY;

    let idx = findDivider(ev, lx, 44);
    if (idx === -1 && ev.gutters.length > 0 && !hitBlock(lx, ly)) {
      idx = findDivider(ev, lx, LOGICAL_W);
    }
    draggingDivider = idx;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    markDirty();
  }

  function handleMove(e) {
    if (e.pointerType === "touch") return;
    const state = getState();
    const ev = evaluateBoard(state);
    const { lx, ly } = clientToLogical(e.clientX, e.clientY);

    if (pointerId === e.pointerId) {
      if (draggingDivider >= 0 && ev.cols >= 2) {
        if (e.cancelable) e.preventDefault();
        const norm = (lx - ev.marginX) / Math.max(1, ev.innerW);
        setState(dragDivider(state, draggingDivider, norm));
        onChange();
        markDirty();
      }
      return;
    }

    const nearDiv = findDivider(ev, lx, 34);
    const nextBlock = nearDiv === -1 && hitBlock(lx, ly);
    if (nearDiv !== hoverDivider || nextBlock !== hoverBlock) {
      hoverDivider = nearDiv;
      hoverBlock = nextBlock;
      canvas.style.cursor = nearDiv >= 0 ? "ew-resize" : nextBlock ? "pointer" : "default";
      markDirty();
    }
  }

  function handleUp(e) {
    if (e.pointerType === "touch" || pointerId !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (moved < 6) {
      const state = getState();
      const { lx, ly } = clientToLogical(e.clientX, e.clientY);
      if (hitBlock(lx, ly)) {
        setState({ ...state, aligned: !state.aligned });
        onChange();
      }
    }
    draggingDivider = -1;
    pointerId = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    markDirty(true);
  }

  // 触屏交互（仅横向接管，竖向留给页面滚动；拖动时只标 dirty 让 rAF 节流同帧只画一次）
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const state = getState();
    const ev = evaluateBoard(state);
    const { lx } = clientToLogical(t0.clientX, t0.clientY);
    touchStartX = t0.clientX;
    touchStartY = t0.clientY;
    touchDragging = false;
    touchDiv = findDivider(ev, lx, LOGICAL_W);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1 || touchDiv < 0) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - touchStartX;
    const dy = t0.clientY - touchStartY;
    if (!touchDragging) {
      if (Math.abs(dx) > 4 && Math.abs(dx) >= Math.abs(dy)) {
        touchDragging = true;
      } else if (Math.abs(dy) > 8) {
        touchDiv = -1;
        return;
      } else {
        return;
      }
    }
    if (e.cancelable) e.preventDefault();
    const state = getState();
    const ev = evaluateBoard(state);
    const { lx } = clientToLogical(t0.clientX, t0.clientY);
    const norm = (lx - ev.marginX) / Math.max(1, ev.innerW);
    setState(dragDivider(state, touchDiv, norm));
    onChange();
    markDirty();
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchDragging = false;
    touchDiv = -1;
    markDirty(true);
  }, { passive: true });

  canvas.addEventListener("pointerdown", handleDown);
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);

  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const ev = evaluateBoard(state);
    if (ev.cols < 2) return;
    const idx = Math.min(state.activeDivider, ev.gutters.length - 1);
    const curNorm = ev.gutters[idx].normBoundary;
    const step = e.shiftKey ? 0.06 : 0.025;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setState(dragDivider(state, idx, curNorm - step));
      onChange();
      markDirty(true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setState(dragDivider(state, idx, curNorm + step));
      onChange();
      markDirty(true);
    } else if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      const nextIdx = (idx + (e.key === "]" ? 1 : ev.gutters.length - 1)) % ev.gutters.length;
      setState({ ...state, activeDivider: nextIdx });
      onChange();
      markDirty(true);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setState({ ...state, aligned: !state.aligned });
      onChange();
      markDirty(true);
    }
  });

  const ro = new ResizeObserver(() => markDirty(true));
  ro.observe(canvas);

  return {
    draw: () => markDirty(true)
  };
}
