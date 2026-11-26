// 299 自适应网格 · 开场 2D Canvas 瑞士制图级活体网格工作台
// 1:1 承袭 299 原海报的电光明黄底面、COLUMNS/GUTTER/CONTAINER 三道工程尺标、虚线容器、纯白几何模块卡与赤色空洞/溢出警示。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

const COLORS = {
  yellow: "#FDCE05",
  trackTint: "rgba(255, 249, 200, 0.34)",
  trackEmpty: "rgba(17, 1, 0, 0.06)",
  ink: "#110100",
  inkSoft: "#3E3306",
  inkFaint: "rgba(17, 1, 0, 0.35)",
  card: "#FDFDFD",
  cardSelected: "#FFFFFF",
  motif: "#DBDBDB",
  motifMid: "#C9C9C9",
  danger: "#B41E0A",
  dangerSoft: "rgba(180, 30, 10, 0.13)",
  dangerStripe: "rgba(180, 30, 10, 0.24)",
  ok: "#0A5C3F",
  okSoft: "rgba(10, 92, 63, 0.12)",
  handleBg: "#110100",
  handleFg: "#FDCE05",
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawMotif(ctx, motif, x, y, w, h, isTight) {
  const padX = Math.max(8, Math.min(16, w * 0.08));
  const topY = y + Math.max(22, Math.min(30, h * 0.34));
  const areaW = Math.max(12, w - padX * 2);
  const areaH = Math.max(14, h - (topY - y) - Math.max(8, h * 0.12));
  const cx = x + padX;
  const cy = topY;

  ctx.save();
  ctx.fillStyle = isTight ? "#E4C5BE" : COLORS.motif;
  const barH = Math.max(3, Math.min(5.5, areaH * 0.14));
  const barGap = Math.max(5, Math.min(9, areaH * 0.2));

  const drawBars = (bx, by, bw, count) => {
    const widths = [1, 0.78, 0.56];
    for (let i = 0; i < count; i++) {
      const ly = by + i * (barH + barGap * 0.65);
      if (ly + barH > cy + areaH + 2) break;
      const lw = Math.max(8, bw * widths[i % widths.length]);
      roundRectPath(ctx, bx, ly, lw, barH, barH / 2);
      ctx.fill();
    }
  };

  const drawMountains = (mx, my, mw, mh) => {
    ctx.beginPath();
    ctx.moveTo(mx, my + mh);
    ctx.lineTo(mx + mw * 0.36, my + mh * 0.25);
    ctx.lineTo(mx + mw * 0.58, my + mh * 0.65);
    ctx.lineTo(mx + mw * 0.75, my + mh * 0.06);
    ctx.lineTo(mx + mw, my + mh);
    ctx.closePath();
    ctx.fill();
  };

  if (areaW < 42) {
    // 极窄被挤扁时，只勉强放下压缩条，真实直观暴露「被挤碎」
    drawBars(cx, cy, areaW, 3);
    ctx.restore();
    return;
  }

  if (motif === "circle-lines") {
    const r = Math.min(areaH * 0.36, areaW * 0.18, 16);
    ctx.beginPath();
    ctx.arc(cx + r, cy + areaH * 0.45, r, 0, Math.PI * 2);
    ctx.fill();
    drawBars(cx + r * 2 + 10, cy + areaH * 0.24, Math.max(10, areaW - r * 2 - 10), 2);
  } else if (motif === "big-circle-lines") {
    const r = Math.min(areaH * 0.42, areaW * 0.2, 20);
    ctx.beginPath();
    ctx.arc(cx + r, cy + areaH * 0.48, r, 0, Math.PI * 2);
    ctx.fill();
    drawBars(cx + r * 2 + 12, cy + areaH * 0.26, Math.max(10, areaW - r * 2 - 12), 2);
  } else if (motif === "lines-mountains" || motif === "lines-big-mountains") {
    const mw = Math.min(areaW * 0.34, areaH * 1.45, motif === "lines-big-mountains" ? 78 : 56);
    const mh = Math.min(areaH * 0.78, mw * 0.62);
    drawBars(cx, cy + areaH * 0.14, Math.max(12, areaW - mw - 12), 3);
    drawMountains(cx + areaW - mw, cy + areaH - mh, mw, mh);
  } else if (motif === "lines-small-mountain") {
    const mw = Math.min(areaW * 0.36, areaH * 1.1, 46);
    const mh = Math.min(areaH * 0.55, mw * 0.56);
    drawBars(cx, cy + areaH * 0.08, areaW * 0.85, 3);
    drawMountains(cx + areaW - mw, cy + areaH - mh, mw, mh);
  } else if (motif === "lines-square") {
    const sq = Math.min(areaH * 0.66, areaW * 0.3, 28);
    drawBars(cx, cy + areaH * 0.14, Math.max(10, areaW - sq - 10), 3);
    roundRectPath(ctx, cx + areaW - sq, cy + (areaH - sq) * 0.5, sq, sq, 3);
    ctx.fill();
  } else if (motif === "square-lines") {
    const sq = Math.min(areaH * 0.66, areaW * 0.3, 28);
    roundRectPath(ctx, cx, cy + (areaH - sq) * 0.5, sq, sq, 3);
    ctx.fill();
    drawBars(cx + sq + 10, cy + areaH * 0.22, Math.max(10, areaW - sq - 10), 2);
  } else {
    // circle-wide-lines
    const r = Math.min(areaH * 0.36, areaW * 0.15, 16);
    ctx.beginPath();
    ctx.arc(cx + r, cy + areaH * 0.48, r, 0, Math.PI * 2);
    ctx.fill();
    drawBars(cx + r * 2 + 12, cy + areaH * 0.24, Math.max(12, areaW - r * 2 - 12), 2);
  }
  ctx.restore();
}

export function createHeroStage(canvas, callbacks) {
  const ctx = canvas.getContext("2d");
  let evalData = null;
  let selectedIdx = 1;
  let hoveredCard = -1;
  let hoverHandle = false;
  let introProgress = 0;

  // 平滑插值状态（实现真实 FLIP 过渡 + 60fps 阻尼拖拽）
  const animCards = new Map();
  let animContainerW = 860;
  let hitCards = [];
  let handleRect = { x: 0, y: 0, w: 0, h: 0 };
  let stageGeo = { boxX: 20, boxY: 56, scale: 1, maxWorldW: 1240, availW: 600 };

  let cssW = 720;
  let cssH = 416;
  let sizeDirty = true;

  function syncCanvasSize() {
    if (!sizeDirty) return;
    sizeDirty = false;
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width));
    cssH = Math.max(220, Math.round(rect.height));
    const maxDpr = window.innerWidth <= 768 ? 1.5 : 2;
    const dpr = pixelRatio(maxDpr);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      sizeDirty = true;
    }).observe(canvas);
  } else {
    window.addEventListener("resize", () => {
      sizeDirty = true;
    }, { passive: true });
  }

  function setEvaluation(nextEval, selIdx) {
    evalData = nextEval;
    selectedIdx = selIdx;
  }

  function drawRulerBracket(x1, x2, y, label, isErr, dashed = false) {
    ctx.save();
    ctx.strokeStyle = isErr ? COLORS.danger : COLORS.ink;
    ctx.fillStyle = isErr ? COLORS.danger : COLORS.ink;
    ctx.lineWidth = 1.25;
    if (dashed) ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y + 7);
    ctx.lineTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.lineTo(x2, y + 7);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `600 ${cssW < 420 ? 10 : 11}px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const mid = (x1 + x2) / 2;
    const clampedMid = Math.max(46, Math.min(cssW - 46, mid));
    ctx.fillText(label, clampedMid, y - 4);
    ctx.restore();
  }

  function drawHatch(x, y, w, h, color) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    const step = 9;
    for (let d = -h; d < w + h; d += step) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - h, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render(t, dt, { still }) {
    syncCanvasSize();
    if (!evalData) return;

    const dpr = canvas.width / cssW;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    // 开场渐进展开（0.75s 丝滑舒展，减少动态效果时直接满格）
    if (still) {
      introProgress = 1;
    } else {
      introProgress = Math.min(1, introProgress + (dt || 0.016) * 1.9);
    }
    const easeIntro = 1 - Math.pow(1 - introProgress, 3);

    const layout = evalData.current;
    const lerpRate = still ? 1 : Math.min(1, (dt || 0.016) * 14);
    animContainerW += (layout.containerWidth - animContainerW) * lerpRate;

    const compact = cssW < 460;
    const padL = compact ? 14 : 22;
    const padR = compact ? 26 : 38;
    const topRulerY = compact ? 48 : 56;
    const bottomPad = compact ? 30 : 34;

    const maxWorldW = 1240;
    const availW = Math.max(180, cssW - padL - padR);
    // 虚线容器在画布里按世界宽度 1240px 映射，窄屏时保证至少占 52% 以上可见宽度，视觉直观清晰
    const minFrac = compact ? 0.56 : 0.34;
    const wFrac = Math.max(minFrac, Math.min(1, (animContainerW - 320) / (maxWorldW - 320) * (1 - minFrac) + minFrac));
    const boxW = Math.round(availW * wFrac);
    const boxX = padL;
    const boxY = topRulerY;
    const boxH = Math.max(160, cssH - topRulerY - bottomPad);

    const worldScale = boxW / Math.max(1, layout.containerWidth);
    stageGeo = { boxX, boxY, boxW, boxH, scale: worldScale, maxWorldW, availW, minFrac };

    // 底部 320..1240 背景参考标尺（淡墨刻度，强化“容器正在拉尺变化”的空间感）
    ctx.save();
    const rulerY = boxY + boxH + 14;
    ctx.strokeStyle = "rgba(17, 1, 0, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX, rulerY);
    ctx.lineTo(boxX + availW, rulerY);
    ctx.stroke();

    const ticks = compact ? [360, 640, 960, 1200] : [360, 520, 640, 768, 960, 1200];
    ctx.font = `500 ${compact ? 10 : 10.5}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const tw of ticks) {
      const tf = Math.max(minFrac, Math.min(1, (tw - 320) / (maxWorldW - 320) * (1 - minFrac) + minFrac));
      const tx = boxX + Math.round(availW * tf);
      const active = Math.abs(layout.containerWidth - tw) <= 18;
      ctx.strokeStyle = active ? COLORS.ink : "rgba(17, 1, 0, 0.35)";
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(tx, rulerY - 4);
      ctx.lineTo(tx, rulerY + 4);
      ctx.stroke();
      ctx.fillStyle = active ? COLORS.ink : COLORS.inkSoft;
      ctx.fillText(`${tw}`, tx, rulerY + 5);
    }
    // 右侧剩余展墙区画出淡墨可拉伸导轨，消除宽屏右侧视觉空感
    if (!compact && boxX + boxW + 26 < boxX + availW) {
      const rx1 = boxX + boxW + 18;
      const rx2 = boxX + availW;
      ctx.strokeStyle = "rgba(17, 1, 0, 0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(rx1, boxY + 0.5, rx2 - rx1, boxH - 1);
      ctx.setLineDash([]);
      if (rx2 - rx1 > 82) {
        ctx.fillStyle = "rgba(17, 1, 0, 0.48)";
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("向右拉宽容器 →", (rx1 + rx2) / 2, boxY + boxH / 2 - 8);
        ctx.font = `500 10.5px "JetBrains Mono", monospace`;
        ctx.fillText("MAX 1240px", (rx1 + rx2) / 2, boxY + boxH / 2 + 10);
      }
    }
    ctx.restore();

    // 内边距与网格真实几何
    const innerPad = compact ? 10 : 16;
    const gridX = boxX + innerPad;
    const gridY = boxY + innerPad;
    const gridAvailW = Math.max(60, boxW - innerPad * 2);
    const gridScale = gridAvailW / layout.containerWidth;
    const gridAvailH = Math.max(80, boxH - innerPad * 2);

    const gPx = layout.gutter * gridScale;
    const cPx = layout.colWidth * gridScale;
    const rows = Math.max(1, layout.rowCount);
    const rowGap = Math.max(3, Math.min(18, gPx || 3));
    const rowH = Math.max(36, Math.min(116, (gridAvailH - (rows - 1) * rowGap) / rows));

    // 1. 绘列轨道半透明浅黄衬底（原海报标志视觉语言）
    for (let c = 0; c < layout.renderedCols; c++) {
      const tx = gridX + c * (cPx + gPx);
      const isImplicitOverflow = c >= layout.autoCols;
      const isEmptyAutoFill = layout.fillMode === "auto-fill" && layout.rowCount === 1 && c >= layout.renderedCols - layout.emptyTrailingTracks;
      ctx.save();
      if (isImplicitOverflow) {
        ctx.fillStyle = COLORS.dangerSoft;
        ctx.fillRect(tx, boxY + 3, cPx, boxH - 6);
        drawHatch(tx, boxY + 3, cPx, boxH - 6, COLORS.dangerStripe);
      } else if (isEmptyAutoFill) {
        ctx.fillStyle = COLORS.trackEmpty;
        ctx.fillRect(tx, boxY + 4, cPx, boxH - 8);
        ctx.strokeStyle = "rgba(17, 1, 0, 0.28)";
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(tx + 0.5, boxY + 4.5, Math.max(1, cPx - 1), boxH - 9);
      } else {
        ctx.fillStyle = COLORS.trackTint;
        ctx.fillRect(tx, boxY + 4, cPx, boxH - 8);
      }
      ctx.restore();
    }

    // 2. 绘原海报标志「虚线 CONTAINER 外框」
    ctx.save();
    ctx.strokeStyle = layout.overflowPx > 0 ? COLORS.danger : COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
    ctx.setLineDash([]);
    ctx.restore();

    // 3. 顶部三道工程尺寸标注尺：COLUMNS / GUTTER / CONTAINER（严格错位绝不重叠）
    const firstColX1 = gridX;
    const firstColX2 = gridX + Math.min(cPx, gridAvailW);
    const colLabel = compact
      ? `${layout.renderedCols}列·${Math.round(layout.colWidth)}px`
      : `COLUMNS · ${layout.renderedCols}列 (${Math.round(layout.colWidth)}px)`;
    const colBracketEnd = layout.renderedCols >= 2 ? Math.min(gridX + cPx * 2 + gPx, boxX + boxW * 0.36) : firstColX2;
    drawRulerBracket(firstColX1, Math.max(firstColX1 + 44, colBracketEnd), boxY - 12, colLabel, layout.colWidth < 120, false);

    if (layout.renderedCols >= 2 && boxW > 220) {
      // 取中段间隙（与原海报一致落在容器中央），确保与左侧 COLUMNS 及右侧 CONTAINER 标签彻底避让
      const gapIdx = Math.max(1, Math.min(layout.renderedCols - 2, Math.floor(layout.renderedCols * 0.5)));
      const gx1 = gridX + (gapIdx + 1) * cPx + gapIdx * gPx;
      const gx2 = gx1 + Math.max(3, gPx);
      const gErr = layout.gutter < 10 || layout.gutter > 32;
      ctx.save();
      ctx.strokeStyle = gErr ? COLORS.danger : COLORS.ink;
      ctx.fillStyle = gErr ? COLORS.danger : COLORS.ink;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([2.5, 2.5]);
      ctx.beginPath();
      ctx.moveTo(gx1, boxY - 20);
      ctx.lineTo(gx1, boxY + 4);
      ctx.moveTo(gx2, boxY - 20);
      ctx.lineTo(gx2, boxY + 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(gx1 - 6, boxY - 12);
      ctx.lineTo(gx2 + 6, boxY - 12);
      ctx.stroke();
      ctx.font = `600 ${compact ? 10 : 11}px "JetBrains Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const gLabel = compact ? `隙 ${layout.gutter}px` : `GUTTER ${layout.gutter}px`;
      const minGLabelX = compact ? boxX + 115 : boxX + 205;
      const maxGLabelX = compact ? boxX + boxW - 82 : boxX + boxW - 135;
      const labelX = minGLabelX <= maxGLabelX
        ? Math.max(minGLabelX, Math.min(maxGLabelX, (gx1 + gx2) / 2))
        : (gx1 + gx2) / 2;
      ctx.fillText(gLabel, labelX, boxY - 23);
      ctx.restore();
    }

    // 右上 CONTAINER 标尺
    ctx.save();
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = layout.overflowPx > 0 ? COLORS.danger : COLORS.ink;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    const cLabel = compact ? `容器 ${layout.containerWidth}px` : `CONTAINER · ${layout.containerWidth}px`;
    ctx.fillText(cLabel, boxX + boxW, boxY - 8);
    ctx.restore();

    // 4. 绘行内 / 尾行空洞警示格
    for (const hole of layout.holes) {
      const hx = gridX + hole.x * gridScale;
      const hy = gridY + hole.row * (rowH + rowGap);
      const hw = Math.max(8, hole.w * gridScale);
      const isInterior = hole.kind === "interior";
      const isBadTrailing = hole.kind === "trailing" && layout.renderedCols >= 3 && layout.trailingHoleCells >= Math.ceil(layout.renderedCols * 0.55) && layout.rowCount > 1;
      if (!isInterior && !isBadTrailing && layout.fillMode !== "auto-fill") continue;

      ctx.save();
      roundRectPath(ctx, hx, hy, hw, rowH, 7);
      ctx.fillStyle = isInterior ? COLORS.dangerSoft : "rgba(17, 1, 0, 0.05)";
      ctx.fill();
      if (isInterior) {
        ctx.save();
        roundRectPath(ctx, hx, hy, hw, rowH, 7);
        ctx.clip();
        drawHatch(hx, hy, hw, rowH, COLORS.dangerStripe);
        ctx.restore();
      }
      ctx.strokeStyle = isInterior ? COLORS.danger : "rgba(17, 1, 0, 0.34)";
      ctx.lineWidth = isInterior ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      roundRectPath(ctx, hx + 0.5, hy + 0.5, Math.max(2, hw - 1), rowH - 1, 7);
      ctx.stroke();
      ctx.setLineDash([]);

      if (hw > 28) {
        ctx.fillStyle = isInterior ? COLORS.danger : COLORS.inkSoft;
        ctx.font = `700 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fullText = isInterior ? `× 空洞 ${hole.span} 格` : `空轨 ${hole.span} 格`;
        const shortText = isInterior ? `空${hole.span}格` : `空${hole.span}`;
        const hText = ctx.measureText(fullText).width <= hw - 8
          ? fullText
          : ctx.measureText(shortText).width <= hw - 6
            ? shortText
            : "";
        if (hText) ctx.fillText(hText, hx + hw / 2, hy + rowH / 2);
      }
      ctx.restore();
    }

    // 5. 绘纯白模块卡片（带 FLIP 位置大小缓动）
    hitCards = [];
    const totalActualHeight = rows * rowH + (rows - 1) * rowGap;
    const verticalOffset = Math.max(0, (gridAvailH - totalActualHeight) * 0.5);

    for (let i = 0; i < layout.placements.length; i++) {
      const p = layout.placements[i];
      const tx = gridX + p.x * gridScale;
      const ty = gridY + verticalOffset + p.row * (rowH + rowGap);
      const tw = Math.max(18, p.w * gridScale);
      const th = rowH;

      let st = animCards.get(p.id);
      if (!st || still) {
        st = { x: tx, y: ty, w: tw, h: th };
        animCards.set(p.id, st);
      } else {
        st.x += (tx - st.x) * lerpRate;
        st.y += (ty - st.y) * lerpRate;
        st.w += (tw - st.w) * lerpRate;
        st.h += (th - st.h) * lerpRate;
      }

      // 开场错落弹入（保持每帧美观）
      const cardEase = Math.max(0, Math.min(1, easeIntro * 1.15 - i * 0.04));
      const drawY = st.y + (1 - cardEase) * 10;

      const isSelected = i === selectedIdx;
      const isHovered = i === hoveredCard;
      const isTight = layout.colWidth < 120 && p.usedSpan === 1;
      const isOverflow = p.overflowed;

      hitCards.push({ idx: i, x: st.x, y: drawY, w: st.w, h: st.h });

      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * cardEase;

      // 卡片实体阴影（极轻，贴近瑞士印刷叠纸感）
      if (isSelected) {
        ctx.fillStyle = "rgba(17, 1, 0, 0.14)";
        roundRectPath(ctx, st.x + 2, drawY + 3, st.w, st.h, 8);
        ctx.fill();
      }

      roundRectPath(ctx, st.x, drawY, st.w, st.h, 8);
      ctx.fillStyle = isSelected ? COLORS.cardSelected : COLORS.card;
      ctx.fill();

      // 边框：溢出错卡标赤、选中卡标粗墨黑、悬停微墨框
      if (isOverflow) {
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else if (isSelected) {
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else if (isHovered) {
        ctx.strokeStyle = "rgba(17, 1, 0, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // 卡片内部原海报极简几何图形
      drawMotif(ctx, p.motif, st.x, drawY, st.w, st.h, isTight);

      // 左上角 SPAN 标签（1:1 复刻原海报 `SPAN 2` / `SPAN 4`）
      const padLCard = Math.max(7, Math.min(14, st.w * 0.08));
      ctx.fillStyle = isOverflow || isTight ? COLORS.danger : COLORS.ink;
      ctx.font = `800 ${st.w < 68 ? 10 : compact ? 10.5 : 12}px "Archivo", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const spanText = st.w < 56 ? `S${p.usedSpan}` : `SPAN ${p.usedSpan}`;
      ctx.fillText(spanText, st.x + padLCard, drawY + (compact ? 6 : 8));

      // 若被自动钳制，旁注原值
      if (p.clamped && st.w >= 96) {
        ctx.fillStyle = COLORS.ok;
        ctx.font = `600 10px "JetBrains Mono", monospace`;
        ctx.fillText(`←${p.requestedSpan}`, st.x + padLCard + 48, drawY + (compact ? 6.5 : 8.5));
      }

      // 右上角：若溢出标红「爆框」、若被 dense 跳序标序号、选中卡标「点改」
      if (isOverflow && st.w >= 64) {
        const bw = 44;
        roundRectPath(ctx, st.x + st.w - bw - 6, drawY + 5, bw, 16, 4);
        ctx.fillStyle = COLORS.danger;
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("溢出", st.x + st.w - bw / 2 - 6, drawY + 13.5);
      } else if (layout.flowMode === "dense" && p.visualIndex !== p.domIndex && st.w >= 64) {
        const bw = 46;
        roundRectPath(ctx, st.x + st.w - bw - 6, drawY + 5, bw, 16, 4);
        ctx.fillStyle = COLORS.ink;
        ctx.fill();
        ctx.fillStyle = COLORS.yellow;
        ctx.font = `700 10px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`#${p.domIndex + 1}跳`, st.x + st.w - bw / 2 - 6, drawY + 13.5);
      } else if (isSelected && st.w >= 96) {
        const bw = 54;
        roundRectPath(ctx, st.x + st.w - bw - 6, drawY + 5, bw, 16, 4);
        ctx.fillStyle = COLORS.ink;
        ctx.fill();
        ctx.fillStyle = COLORS.yellow;
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("点按改宽", st.x + st.w - bw / 2 - 6, drawY + 13.5);
      } else if (st.w >= 112) {
        ctx.fillStyle = "rgba(17, 1, 0, 0.45)";
        ctx.font = `500 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(p.title, st.x + st.w - padLCard, drawY + (compact ? 6.5 : 8.5));
      }

      ctx.restore();
    }

    // 6. 右缘实体纯黑双杠拉杆（清楚示意“按住左右拉动改容器宽度”）
    const hW = compact ? 18 : 22;
    const hH = Math.min(76, boxH * 0.34);
    const hx = boxX + boxW - hW / 2;
    const hy = boxY + (boxH - hH) / 2;
    handleRect = { x: hx - 8, y: hy - 12, w: hW + 16, h: hH + 24 };

    ctx.save();
    roundRectPath(ctx, hx, hy, hW, hH, 6);
    ctx.fillStyle = hoverHandle ? "#2B2400" : COLORS.handleBg;
    ctx.fill();
    // 两条明黄竖握杠
    ctx.fillStyle = COLORS.handleFg;
    const gx = hx + hW / 2;
    ctx.fillRect(gx - 3, hy + hH * 0.28, 2, hH * 0.44);
    ctx.fillRect(gx + 1, hy + hH * 0.28, 2, hH * 0.44);
    ctx.restore();

    // 若发生横向溢出，在右侧拉出一条高对比赤色溢出标牌
    if (layout.overflowPx > 0) {
      ctx.save();
      const warnText = `× 溢出 +${layout.overflowPx}px`;
      ctx.font = `700 11px "Noto Sans SC", "JetBrains Mono", sans-serif`;
      const tw = ctx.measureText(warnText).width + 18;
      const wx = Math.min(cssW - tw - 6, boxX + boxW - tw + 4);
      const wy = boxY + boxH - 28;
      roundRectPath(ctx, wx, wy, tw, 22, 4);
      ctx.fillStyle = COLORS.danger;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnText, wx + tw / 2, wy + 11.5);
      ctx.restore();
    }

    ctx.restore();
  }

  // ---------- 指针 / 触摸 / 键盘交互（触屏严守不拦纵向滚动） ----------
  let dragMode = null; // "width" | null
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 620;
  let moved = false;
  let touchAxis = null; // "x" | "y" | null

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitTestCard(pt) {
    for (let i = hitCards.length - 1; i >= 0; i--) {
      const c = hitCards[i];
      if (pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h) return c.idx;
    }
    return -1;
  }

  function hitTestHandle(pt) {
    return (
      pt.x >= handleRect.x &&
      pt.x <= handleRect.x + handleRect.w &&
      pt.y >= handleRect.y &&
      pt.y <= handleRect.y + handleRect.h
    );
  }

  function applyDeltaX(dx) {
    const spanPx = Math.max(120, stageGeo.availW * (1 - stageGeo.minFrac));
    const worldRange = stageGeo.maxWorldW - 320;
    const nextW = Math.max(320, Math.min(1240, Math.round(startWidth + (dx / spanPx) * worldRange)));
    callbacks.onWidthChange(nextW);
  }

  // 同时支持 PointerEvent 和 TouchEvent（兼容 tools/perf.mjs 的 dispatchTouchEvent！）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch 由 touchstart 精细分轴处理，避免误拦竖滚
    const pt = toLocal(e.clientX, e.clientY);
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = evalData ? evalData.current.containerWidth : 620;
    moved = false;
    dragMode = "width";
    canvas.setPointerCapture(e.pointerId);
    if (hitTestHandle(pt)) canvas.style.cursor = "ew-resize";
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = toLocal(e.clientX, e.clientY);
    if (dragMode === "width" && e.pointerId === pointerId) {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      if (moved) applyDeltaX(dx);
      return;
    }
    if (e.pointerType !== "touch") {
      hoverHandle = hitTestHandle(pt);
      hoveredCard = hoverHandle ? -1 : hitTestCard(pt);
      canvas.style.cursor = hoverHandle ? "ew-resize" : hoveredCard >= 0 ? "pointer" : "ew-resize";
    }
  });

  function finishPointer(e) {
    if (e.pointerId !== pointerId) return;
    const pt = toLocal(e.clientX, e.clientY);
    if (!moved) {
      const idx = hitTestCard(pt);
      if (idx >= 0) callbacks.onCardClick(idx);
    }
    dragMode = null;
    pointerId = null;
    moved = false;
  }
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);

  canvas.addEventListener("pointerleave", () => {
    hoveredCard = -1;
    hoverHandle = false;
  });

  // Touch 处理：只接管横向拖动，纵向滑动立刻放行给浏览器页面滚动
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      startX = t0.clientX;
      startY = t0.clientY;
      startWidth = evalData ? evalData.current.containerWidth : 620;
      moved = false;
      touchAxis = null;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - startX;
      const dy = t0.clientY - startY;
      if (!touchAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchAxis === "x") {
        e.preventDefault();
        moved = true;
        applyDeltaX(dx);
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", (e) => {
    if (!moved && e.changedTouches.length) {
      const t0 = e.changedTouches[0];
      const pt = toLocal(t0.clientX, t0.clientY);
      const idx = hitTestCard(pt);
      if (idx >= 0) callbacks.onCardClick(idx);
    }
    touchAxis = null;
    moved = false;
  });

  canvas.addEventListener("keydown", (e) => {
    if (!evalData) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      callbacks.onWidthChange(Math.max(320, evalData.current.containerWidth - 28));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      callbacks.onWidthChange(Math.min(1240, evalData.current.containerWidth + 28));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      callbacks.onSelectedSpanDelta(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      callbacks.onSelectedSpanDelta(-1);
    } else if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      callbacks.onSelectOffset(e.key === "]" ? 1 : -1);
    }
  });

  const runner = loop(canvas, render);
  return {
    setEvaluation(nextEval, selIdx) {
      setEvaluation(nextEval, selIdx);
      if (reducedMotion.matches) runner.draw();
    },
    draw: runner.draw,
  };
}
