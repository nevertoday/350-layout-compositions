// 182 轮廓绕排 · 全部 2D Canvas 视图绘制模块
// 严格读取 model.js 计算出的同一份实绘布局（单真源），零硬编码假读数。

import {
  RING_TEXT,
  SHAPES,
  computeLayout,
  getShapePolygon,
  transformPolygon,
  buildOffsetEnvelope,
} from "./model.js";

const COLORS = {
  paper: "#FDF7EE",
  paperSheet: "#FFFBF5",
  paperLine: "#E6DACB",
  ink: "#0C0B0A",
  inkSoft: "#4D453E",
  persimmon: "#F95F19",
  persimmonDeep: "#B33400",
  persimmonGlow: "rgba(249, 95, 25, 0.14)",
  danger: "#C42214",
  dangerFill: "rgba(196, 34, 20, 0.13)",
  ok: "#156E4B",
  okFill: "rgba(21, 110, 75, 0.12)",
  darkBg: "#1A130F",
  darkCard: "#241B15",
  darkInk: "#FAF2E6",
  darkMuted: "#C9BCAE",
  darkAccent: "#FF8B57",
};

function tracePoly(ctx, pts) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

export function drawShapeThumb(ctx, shapeId, w, h, fill = COLORS.persimmon) {
  ctx.clearRect(0, 0, w, h);
  const poly = getShapePolygon(shapeId, false);
  const aspectMap = { vase: 0.64, leaf: 0.78, blob: 0.80 };
  const ry = h * 0.43;
  const rx = ry * (aspectMap[shapeId] || 0.68);
  const { pts } = transformPolygon(poly, w * 0.5, h * 0.52, rx, ry);
  ctx.save();
  ctx.fillStyle = fill;
  tracePoly(ctx, pts);
  ctx.fill();
  ctx.restore();
}

function drawPosterRingText(ctx, layout, progress) {
  const { visualGeom, box } = layout;
  const ringPts = buildOffsetEnvelope(visualGeom.pts, Math.max(12, box.fontSize * 0.92));
  const n = ringPts.length;
  const cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = ringPts[i];
    const b = ringPts[(i + 1) % n];
    cum[i + 1] = cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const totalLen = cum[n] || 1;
  const startS = totalLen * 0.78;
  const chars = [...RING_TEXT];
  const step = Math.min(box.fontSize * 1.12, (totalLen * 0.88) / chars.length);

  ctx.save();
  ctx.font = `600 ${Math.round(box.fontSize * 0.92)}px "Noto Serif SC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const drawCount = Math.floor(chars.length * Math.min(1, progress * 1.25));
  for (let i = 0; i < drawCount; i++) {
    const target = (startS + i * step) % totalLen;
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (cum[mid] <= target) lo = mid;
      else hi = mid - 1;
    }
    const p1 = ringPts[lo];
    const p2 = ringPts[(lo + 1) % n];
    const segLen = cum[lo + 1] - cum[lo] || 1;
    const f = (target - cum[lo]) / segLen;
    const x = p1[0] + (p2[0] - p1[0]) * f;
    const y = p1[1] + (p2[1] - p1[1]) * f;
    const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const upsideDown = Math.abs(ang) > Math.PI * 0.56;
    ctx.fillStyle = upsideDown ? COLORS.persimmonDeep : COLORS.ink;
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// =========================================================================
// 1. 开场核心画布：活体书页绕排排字台
// =========================================================================
export function drawHeroStage(ctx, layout, state, ui = {}) {
  const { W, H, padX, padTop, padBot } = layout.box;
  const intro = ui.intro ?? 1;
  const scanT = ui.scanT ?? -1;
  const hoverTarget = ui.hoverTarget || "";
  const dragging = ui.dragging || "";
  const interactive = ui.interactive !== false;

  ctx.save();
  ctx.fillStyle = COLORS.paperSheet;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#E5D7C6";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // 顶部微型书眉（窄屏自动精简，绝不与右侧状态胶囊重叠！）
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = `700 10.5px "Bricolage Grotesque", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const compactHead = W < 440;
  const modeTag =
    state.wrapMode === "ring"
      ? compactHead ? "环边对照" : "POSTER RING REF"
      : state.wrapMode === "box"
      ? compactHead ? "183 矩形盒" : "BOX WRAP · 183"
      : compactHead ? "182 轮廓绕排" : "CONTOUR WRAP · 182";
  const headText = compactHead
    ? `${modeTag} · ${state.cols}栏 · ${layout.metrics.marginPx}px`
    : `${modeTag}  ·  ${state.cols === 2 ? "2-COL" : "1-COL"}  ·  MARGIN ${layout.metrics.marginPx}px (${layout.metrics.marginEm}em)`;
  const headLineY = padTop - 8;
  const headMidY = headLineY * 0.5;
  ctx.fillText(headText, padX, headMidY);

  const passed = layout.metrics.passCount === 4;
  const pillText = layout.diagnosis.badge;
  ctx.font = `700 10.5px "Noto Serif SC", serif`;
  const pillW = ctx.measureText(pillText).width + 16;
  const pillX = W - padX - pillW;
  const pillY = headMidY - 10;
  ctx.fillStyle = passed
    ? COLORS.okFill
    : state.wrapMode === "ring"
    ? COLORS.persimmonGlow
    : COLORS.dangerFill;
  ctx.strokeStyle = passed
    ? COLORS.ok
    : state.wrapMode === "ring"
    ? COLORS.persimmonDeep
    : COLORS.danger;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, 20, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = passed
    ? COLORS.ok
    : state.wrapMode === "ring"
    ? COLORS.persimmonDeep
    : COLORS.danger;
  ctx.textAlign = "center";
  ctx.fillText(pillText, pillX + pillW / 2, pillY + 10.5);

  ctx.strokeStyle = "#EAE0D3";
  ctx.beginPath();
  ctx.moveTo(padX, headLineY);
  ctx.lineTo(W - padX, headLineY);
  ctx.stroke();

  // 栏框参考线
  ctx.save();
  ctx.strokeStyle = "rgba(180, 160, 140, 0.28)";
  ctx.setLineDash([3, 4]);
  for (const col of layout.columns) {
    ctx.strokeRect(col.l, padTop - 2, col.r - col.l, H - padTop - padBot + 4);
  }
  ctx.restore();

  // 矩形模式死白区
  if (state.wrapMode === "box") {
    const bb = layout.wrapGeom.bbox;
    ctx.save();
    ctx.fillStyle = "rgba(196, 34, 20, 0.06)";
    ctx.fillRect(
      bb.minX - state.marginPx,
      bb.minY - state.marginPx,
      bb.maxX - bb.minX + state.marginPx * 2,
      bb.maxY - bb.minY + state.marginPx * 2
    );
    ctx.restore();
  }

  // 绕排缓冲区与虚线外环
  if (state.wrapMode !== "ring") {
    ctx.save();
    if (state.marginPx > 0.5) {
      ctx.fillStyle =
        layout.diagnosis.faultId === "wide"
          ? "rgba(196, 34, 20, 0.08)"
          : "rgba(249, 95, 25, 0.07)";
      tracePoly(ctx, layout.envelopePts);
      ctx.fill();
    }

    const ringActive = hoverTarget === "ring" || dragging === "ring";
    ctx.strokeStyle =
      layout.diagnosis.faultId === "tight" || layout.diagnosis.faultId === "wide"
        ? COLORS.danger
        : ringActive
        ? COLORS.persimmonDeep
        : COLORS.persimmon;
    ctx.lineWidth = ringActive ? 2.2 : 1.5;
    ctx.setLineDash(state.wrapMode === "box" ? [6, 4] : [4, 4]);
    tracePoly(ctx, layout.envelopePts);
    ctx.stroke();
    ctx.restore();
  }

  // 柿红有机主体（拖动/悬停用零模糊外描边替代昂贵 shadowBlur，确保软件渲染满帧）
  ctx.save();
  const sEase = 0.92 + 0.08 * Math.min(1, intro);
  ctx.translate(layout.cxPx, layout.cyPx);
  ctx.scale(sEase, sEase);
  ctx.translate(-layout.cxPx, -layout.cyPx);

  ctx.fillStyle = COLORS.persimmon;
  tracePoly(ctx, layout.visualGeom.pts);
  ctx.fill();
  if (hoverTarget === "shape" || dragging === "shape") {
    ctx.strokeStyle = "rgba(179, 52, 0, 0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();

  // 正文或原海报环边文字
  if (state.wrapMode === "ring") {
    drawPosterRingText(ctx, layout, intro);
  } else {
    drawGalleyLines(ctx, layout, state, intro);
  }

  // 可拖边距圆珠（只在交互主画布画出，悬停/拖动时才弹出距离气泡，绝不压住文字！）
  if (interactive && state.wrapMode !== "ring") {
    const handlePt = pickEnvelopeHandle(layout, W);
    if (handlePt) {
      const active = hoverTarget === "ring" || dragging === "ring";
      ctx.save();
      ctx.strokeStyle = COLORS.persimmonDeep;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(handlePt.innerX, handlePt.y);
      ctx.lineTo(handlePt.x, handlePt.y);
      ctx.stroke();

      ctx.fillStyle = active ? COLORS.persimmonDeep : "#FFFBF5";
      ctx.strokeStyle = COLORS.persimmonDeep;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(handlePt.x, handlePt.y, active ? 7.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (active) {
        const lbl = `边距 ${layout.metrics.marginPx}px`;
        ctx.font = `700 10.5px "Bricolage Grotesque", "Noto Serif SC", sans-serif`;
        const lw = ctx.measureText(lbl).width + 12;
        const lx = clampNum(handlePt.x - lw / 2, 8, W - lw - 8);
        const ly = Math.max(padTop, handlePt.y - 26);
        ctx.fillStyle = COLORS.ink;
        ctx.beginPath();
        ctx.roundRect(lx, ly, lw, 18, 9);
        ctx.fill();
        ctx.fillStyle = "#FFFBF5";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, lx + lw / 2, ly + 9.5);
      }
      ctx.restore();
    }
  }

  // 主体内部精巧标签
  ctx.save();
  ctx.fillStyle = "#FFFBF5";
  ctx.font = `700 11px "Noto Serif SC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (interactive) {
    ctx.fillText(
      dragging === "shape" ? "松手落位" : "拖我移动",
      layout.cxPx,
      layout.cyPx - 5
    );
    ctx.font = `600 10px "Noto Serif SC", serif`;
    ctx.fillStyle = "rgba(255, 251, 245, 0.92)";
    ctx.fillText(SHAPES[state.shape].sub, layout.cxPx, layout.cyPx + 11);
  } else {
    ctx.fillText(SHAPES[state.shape].sub, layout.cxPx, layout.cyPx);
  }
  ctx.restore();

  // Space 视线扫视脉冲
  if (scanT >= 0 && state.wrapMode !== "ring" && layout.lines.length > 0) {
    drawEyeScanPulse(ctx, layout, scanT);
  }

  // 底沿说明（交互主画布显示操作提示，静态暗礁剖面显示实测数据）
  ctx.save();
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = `400 10.5px "Noto Serif SC", serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    interactive
      ? compactHead
        ? "拖柿红主体改落位 · 拖外圈圆珠调呼吸距"
        : "拖动柿红主体改落位 · 拖外圈圆珠调呼吸距 · 空格键放飞视线扫视"
      : `实测：边距 ${layout.metrics.marginPx}px · 绕流 ${layout.metrics.wrappedLineCount} 行 · 最窄 ${layout.metrics.minWrappedChars} 字`,
    padX,
    H - padBot * 0.45
  );
  ctx.restore();

  ctx.restore();
}

function clampNum(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function drawGalleyLines(ctx, layout, state, intro) {
  const { fontSize } = layout.box;
  ctx.save();
  ctx.font = `400 ${fontSize}px "Noto Serif SC", serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const visibleCount = Math.ceil(layout.lines.length * Math.min(1, intro * 1.35));

  // 左缘锯齿红虚线连线
  if (!layout.checks.anchor && state.cols === 1) {
    const col0 = layout.lines.filter((l) => l.col === 0 && l.x0 > layout.columns[0].l + 2);
    if (col0.length >= 2) {
      ctx.save();
      ctx.strokeStyle = "rgba(196, 34, 20, 0.78)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      col0.forEach((l, idx) => {
        if (idx === 0) ctx.moveTo(l.x0 - 3, l.yMid);
        else ctx.lineTo(l.x0 - 3, l.yMid);
      });
      ctx.stroke();
      ctx.restore();
    }
  }

  for (let i = 0; i < visibleCount; i++) {
    const ln = layout.lines[i];
    if (ln.isCollision || ln.isOrphan || ln.trappedInNotch) {
      ctx.fillStyle = COLORS.dangerFill;
      ctx.fillRect(ln.x0 - 2, ln.yTop - 1, Math.max(12, ln.textEnd - ln.x0 + 4), fontSize + 3);
      ctx.strokeStyle = "rgba(196, 34, 20, 0.55)";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(ln.x0 - 2, ln.yTop - 1, Math.max(12, ln.textEnd - ln.x0 + 4), fontSize + 3);
    }

    if (ln.splitBridge) {
      ctx.save();
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ln.splitBridge.x0 + 2, ln.splitBridge.y);
      ctx.lineTo(ln.splitBridge.x1 - 2, ln.splitBridge.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = ln.isCollision || ln.trappedInNotch ? COLORS.danger : COLORS.ink;
    ctx.fillText(ln.text, ln.x0, ln.yTop);
  }

  // 4/4 通过时的优雅锚线与贴边韵律点
  if (layout.metrics.passCount === 4) {
    const col0 = layout.columns[0];
    ctx.save();
    ctx.strokeStyle = "rgba(21, 110, 75, 0.45)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(col0.l - 5, layout.box.padTop);
    ctx.lineTo(col0.l - 5, layout.box.H - layout.box.padBot);
    ctx.stroke();

    ctx.fillStyle = COLORS.persimmon;
    for (const ln of layout.lines) {
      if (ln.wasAffected && ln.x1 < col0.r - 4 && ln.col === 0) {
        ctx.beginPath();
        ctx.arc(ln.x1 + 3, ln.yMid, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawEyeScanPulse(ctx, layout, scanT) {
  const lines = layout.lines;
  const maxLines = Math.min(lines.length, 14);
  const segTotal = maxLines * 2 - 1;
  const curPos = scanT * segTotal;
  const curIdx = Math.min(maxLines - 1, Math.floor(curPos / 2));

  ctx.save();
  for (let i = 0; i <= curIdx; i++) {
    const ln = lines[i];
    const lineProg = i < curIdx ? 1 : Math.min(1, curPos - i * 2);
    const ex = ln.x0 + (ln.textEnd - ln.x0) * lineProg;
    ctx.strokeStyle = ln.isCollision || ln.isSplit ? COLORS.danger : COLORS.persimmon;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ln.x0, ln.yMid);
    ctx.lineTo(ex, ln.yMid);
    ctx.stroke();

    if (i < curIdx && i + 1 < maxLines) {
      const next = lines[i + 1];
      const sameRowSplit = next.row === ln.row && next.col === ln.col;
      ctx.strokeStyle = sameRowSplit
        ? COLORS.danger
        : Math.abs(next.x0 - ln.x0) > 22
        ? COLORS.danger
        : "rgba(249, 95, 25, 0.38)";
      ctx.lineWidth = sameRowSplit ? 1.8 : 1.1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ln.textEnd, ln.yMid);
      ctx.lineTo(next.x0, next.yMid);
      ctx.stroke();
    }
  }

  const activeLn = lines[curIdx];
  const sub = curPos - curIdx * 2;
  let gx, gy;
  if (sub <= 1 || curIdx + 1 >= maxLines) {
    const p = Math.min(1, sub);
    gx = activeLn.x0 + (activeLn.textEnd - activeLn.x0) * p;
    gy = activeLn.yMid;
  } else {
    const p = sub - 1;
    const nxt = lines[curIdx + 1];
    gx = activeLn.textEnd + (nxt.x0 - activeLn.textEnd) * p;
    gy = activeLn.yMid + (nxt.yMid - activeLn.yMid) * p;
  }
  ctx.fillStyle = "rgba(249, 95, 25, 0.24)";
  ctx.beginPath();
  ctx.arc(gx, gy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.persimmonDeep;
  ctx.beginPath();
  ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function pickEnvelopeHandle(layout, W) {
  const wantLeft = layout.cxPx >= W * 0.45;
  const env = layout.envelopePts;
  const vis = layout.visualGeom.pts;
  if (!env.length) return null;
  const targetY = layout.cyPx - layout.ry * 0.10;
  let bestIdx = 0;
  let bestScore = Infinity;
  for (let i = 0; i < env.length; i++) {
    const [x, y] = env[i];
    const sideMatch = wantLeft ? x <= layout.cxPx : x >= layout.cxPx;
    if (!sideMatch) continue;
    const score = Math.abs(y - targetY);
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  const [hx, hy] = env[bestIdx];
  const [ix] = vis[Math.min(bestIdx, vis.length - 1)];
  return { x: hx, y: hy, innerX: ix, dir: wantLeft ? -1 : 1 };
}

// =========================================================================
// 2. 第 01 节：双面卷帘刮开对比台（183 矩形盒 vs 182 轮廓绕排）
// =========================================================================
export function drawWipeCompare(ctx, W, H, splitRatio, shapeId) {
  const baseState = {
    shape: shapeId,
    cols: 1,
    bridge: true,
    cx: 0.85,
    cy: 0.50,
    scale: 0.80,
    marginPx: 14,
  };
  const layoutBox = computeLayout({ ...baseState, wrapMode: "box" }, { W, H });
  const layoutContour = computeLayout({ ...baseState, wrapMode: "contour" }, { W, H });

  const splitX = Math.round(W * splitRatio);

  function renderSide(layout, isBox) {
    ctx.fillStyle = isBox ? "#F5EDE2" : COLORS.paperSheet;
    ctx.fillRect(0, 0, W, H);

    if (isBox) {
      const bb = layout.wrapGeom.bbox;
      ctx.fillStyle = "rgba(196, 34, 20, 0.09)";
      ctx.fillRect(
        bb.minX - 14,
        bb.minY - 14,
        layout.columns[0].r - (bb.minX - 14),
        bb.maxY - bb.minY + 28
      );
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(
        bb.minX - 14,
        bb.minY - 14,
        bb.maxX - bb.minX + 28,
        bb.maxY - bb.minY + 28
      );
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = COLORS.persimmon;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      tracePoly(ctx, layout.envelopePts);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = COLORS.persimmon;
    tracePoly(ctx, layout.visualGeom.pts);
    ctx.fill();

    ctx.font = `400 ${layout.box.fontSize}px "Noto Serif SC", serif`;
    ctx.fillStyle = COLORS.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const ln of layout.lines) {
      ctx.fillText(ln.text, ln.x0, ln.yTop);
    }

    ctx.font = `700 11px "Bricolage Grotesque", "Noto Serif SC", sans-serif`;
    ctx.fillStyle = isBox ? COLORS.danger : COLORS.ok;
    ctx.textAlign = isBox ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
      isBox
        ? `183 矩形盒 · 边角死白 ${layout.metrics.deadCornerPct}%`
        : `182 轮廓绕排 · 起伏 ${layout.metrics.edgeRange}px`,
      isBox ? layout.box.padX : W - layout.box.padX,
      layout.box.padTop * 0.45
    );
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, H);
  ctx.clip();
  renderSide(layoutBox, true);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, 0, W - splitX, H);
  ctx.clip();
  renderSide(layoutContour, false);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = COLORS.persimmonDeep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, H);
  ctx.stroke();

  const cy = H * 0.5;
  ctx.fillStyle = COLORS.persimmonDeep;
  ctx.beginPath();
  ctx.arc(splitX, cy, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFBF5";
  ctx.font = `700 13px "Bricolage Grotesque", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↔", splitX, cy + 0.5);
  ctx.restore();

  return {
    deadCornerPct: layoutBox.metrics.deadCornerPct,
    boxChars: layoutBox.lines.reduce((s, l) => s + l.charCount, 0),
    contourChars: layoutContour.lines.reduce((s, l) => s + l.charCount, 0),
    edgeRange: layoutContour.metrics.edgeRange,
  };
}

// =========================================================================
// 3. 第 02 节：四暗礁标本解剖剖面图
// =========================================================================
export const REEF_CASES = {
  tight: {
    title: "暗礁一 · 零边距啃边与过松脱形",
    bad: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 0 },
    good: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 14 },
    rule: "经验安全窗：边距取 0.6–1.5 倍字宽（约 10–22px）。低于 6px 笔画粘边，超过 28px 曲线被撑成死白直墙。",
  },
  notch: {
    title: "暗礁二 · 深裂口与凹湾吞孤字",
    bad: { shape: "leaf", cols: 1, wrapMode: "contour", bridge: false, cx: 0.83, cy: 0.50, scale: 0.82, marginPx: 8 },
    good: { shape: "leaf", cols: 1, wrapMode: "contour", bridge: true, cx: 0.84, cy: 0.50, scale: 0.78, marginPx: 15 },
    rule: "遇到龟背竹叶、人物手肘等深凹口时，绝不能把正文放进裂口；用简化多边形或外包络跨缝桥接，保住行尾顺滑、最短行 ≥ 5 字。",
  },
  split: {
    title: "暗礁三 · 居中跨图劈栏迫使跳读",
    bad: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.48, cy: 0.50, scale: 0.76, marginPx: 12 },
    good: { shape: "vase", cols: 2, wrapMode: "contour", bridge: true, cx: 0.50, cy: 0.50, scale: 0.72, marginPx: 13 },
    rule: "绝对禁止同一行文字被异形图形截成左右两段；若想让主体坐镇视觉中央，必须先拆成左右双栏，让它稳嵌在栏缝之间。",
  },
  jagged: {
    title: "暗礁四 · 锯齿破坏左起行回扫锚",
    bad: { shape: "vase", cols: 1, wrapMode: "contour", bridge: false, cx: 0.15, cy: 0.50, scale: 0.80, marginPx: 14 },
    good: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 14 },
    rule: "中文横排习惯从左向右扫读，齐整的左起行是眼睛换行时唯一的着陆线。把异形主体移向行尾侧（左齐右绕），立刻同时保住可读性与曲率美。",
  },
};

export function drawReefCanvas(ctx, W, H, reefId, fixed) {
  const spec = REEF_CASES[reefId] || REEF_CASES.tight;
  const st = fixed ? spec.good : spec.bad;
  const layout = computeLayout(st, { W, H });
  drawHeroStage(ctx, layout, st, { intro: 1, scanT: -1, interactive: false });
  return layout;
}

// =========================================================================
// 4. 第 03 节（深窑暗室）：三形态阅读节奏波形仪
// =========================================================================
export function drawRhythmLab(ctx, W, H, shapeId, smoothEnvelope, playHead) {
  const st = {
    shape: shapeId,
    cols: 1,
    wrapMode: "contour",
    bridge: smoothEnvelope,
    cx: 0.85,
    cy: 0.50,
    scale: 0.80,
    marginPx: 14,
  };
  const stageW = Math.round(W * 0.56);
  const waveX = stageW + 18;
  const waveW = W - waveX - 18;
  const layout = computeLayout(st, { W: stageW, H });

  ctx.save();
  ctx.fillStyle = COLORS.darkBg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.darkCard;
  ctx.fillRect(0, 0, stageW, H);

  ctx.strokeStyle = smoothEnvelope ? COLORS.darkAccent : "#FF5A4E";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  tracePoly(ctx, layout.envelopePts);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.persimmon;
  tracePoly(ctx, layout.visualGeom.pts);
  ctx.fill();

  const activeIdx =
    playHead >= 0 && layout.lines.length
      ? Math.min(layout.lines.length - 1, Math.floor(playHead * layout.lines.length))
      : -1;

  for (let i = 0; i < layout.lines.length; i++) {
    const ln = layout.lines[i];
    const isAct = i === activeIdx;
    ctx.fillStyle = isAct
      ? COLORS.darkAccent
      : ln.trappedInNotch || ln.isOrphan
      ? "#FF5A4E"
      : "rgba(250, 242, 230, 0.78)";
    ctx.fillRect(ln.x0, ln.yMid - 2.2, Math.max(8, ln.textEnd - ln.x0), isAct ? 5.5 : 4);
  }

  // 右半：逐行字宽韵律谱（因为主体已贴右浮动，每行只有干净唯一的一条主通道！）
  ctx.fillStyle = COLORS.darkCard;
  ctx.fillRect(waveX, 0, waveW, H);

  const innerTop = layout.box.padTop;
  const innerBot = H - layout.box.padBot;
  const barMaxW = waveW - 36;

  ctx.fillStyle = COLORS.darkMuted;
  ctx.font = `700 10.5px "Bricolage Grotesque", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    W < 420 ? "逐行字宽谱" : "LINE LENGTH RHYTHM · 逐行字宽谱",
    waveX + 14,
    innerTop * 0.48
  );

  const fullW = layout.columns[0].r - layout.columns[0].l;
  const pts = [];
  let maxJump = 0;
  let prevRatio = null;

  for (let i = 0; i < layout.lines.length; i++) {
    const ln = layout.lines[i];
    const ratio = Math.min(1, (ln.x1 - ln.x0) / fullW);
    if (prevRatio !== null) {
      maxJump = Math.max(maxJump, Math.abs(ratio - prevRatio));
    }
    prevRatio = ratio;
    const x = waveX + 14 + ratio * barMaxW;
    const y = ln.yMid;
    pts.push({ x, y, ratio, ln, isAct: i === activeIdx });

    ctx.fillStyle =
      i === activeIdx
        ? COLORS.darkAccent
        : ln.isOrphan || ln.trappedInNotch
        ? "rgba(255, 90, 78, 0.55)"
        : "rgba(250, 242, 230, 0.16)";
    ctx.fillRect(waveX + 14, y - 2.5, ratio * barMaxW, 5);
  }

  if (pts.length >= 2) {
    ctx.strokeStyle = COLORS.darkAccent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    for (const p of pts) {
      ctx.fillStyle = p.isAct ? "#FFFBF5" : p.ln.trappedInNotch ? "#FF5A4E" : COLORS.darkAccent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isAct ? 4.5 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = COLORS.darkInk;
  ctx.font = `400 11px "Noto Serif SC", serif`;
  ctx.textAlign = "left";
  ctx.fillText(
    `极差 ${layout.metrics.edgeRange}px · 最大跳变 ${Math.round(maxJump * 100)}%`,
    waveX + 14,
    innerBot + (H - innerBot) * 0.52
  );
  ctx.restore();

  return {
    edgeRange: layout.metrics.edgeRange,
    maxJumpPct: Math.round(maxJump * 100),
    minChars: layout.metrics.minWrappedChars,
    traps: layout.concaveTrapSlots.length,
  };
}

// =========================================================================
// 5. 第 06 节（深窑暗室）：单变量眼力盲测四宫格绘制
// =========================================================================
export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    prompt: "四版稿件的陶瓶位置、字号与正文完全一致，只改变了「绕排边距（shape-margin）」。哪一版最适合杂志正文阅读？",
    variable: "唯一变量：绕排边距",
    correct: "C",
    options: [
      {
        key: "A",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 0 },
        reason: "A 版边距为 0px：行尾文字直接啃进柿红瓶身边缘，图底打架，贴边笔画难以辨认。",
      },
      {
        key: "B",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 4 },
        reason: "B 版边距仅 4px（不到半字宽）：虽然没完全压叠，但视觉上仍极度紧绷，标点频频擦边。",
      },
      {
        key: "C",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 14 },
        reason: "C 版边距 14px（约 0.9 字宽）：落在 0.6–1.5em 经验呼吸窗内，图文清澈分离，又忠实保留了瓶颈与瓶腹的曲线韵律。",
      },
      {
        key: "D",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 40 },
        reason: "D 版边距撑到 40px：缓冲带过大，把原本灵动的瓶颈凹弧彻底填平，图文之间只剩一道空洞的远距离白墙。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "四版稿件的陶瓶尺寸与 14px 呼吸距完全一致，只改变了「主体落位」。哪一版既护住了视线回扫，又保留了清晰绕排？",
    variable: "唯一变量：主体落位",
    correct: "C",
    options: [
      {
        key: "A",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.48, cy: 0.50, scale: 0.76, marginPx: 14 },
        reason: "A 版居中硬劈单栏：正文每一行被陶瓶劈成左右两截，强迫读者跨图跳读，语义不断被打断。",
      },
      {
        key: "B",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.15, cy: 0.50, scale: 0.80, marginPx: 14 },
        reason: "B 版压在左缘起行侧：把横排中文最关键的左对齐起跑线锯成大弧度锯齿，眼睛每次换行都要重新寻找行首。",
      },
      {
        key: "C",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.85, cy: 0.50, scale: 0.80, marginPx: 14 },
        reason: "C 版采用左齐右绕：左侧起行边笔直稳固接住换行回扫，右侧行尾随瓶身起伏形成呼吸感，且通道充裕无碎行。",
      },
      {
        key: "D",
        state: { shape: "vase", cols: 1, wrapMode: "contour", bridge: true, cx: 0.62, cy: 0.50, scale: 0.80, marginPx: 14 },
        reason: "D 版悬在栏内偏右却未贴边：右侧与纸边之间硬塞出一窄条碎词，依然迫使读者跨图跳读且节奏破碎。",
      },
    ],
  },
];

export function drawQuizThumb(ctx, W, H, optState, revealed, isCorrect, isPicked) {
  const layout = computeLayout(optState, { W, H });
  ctx.save();
  ctx.fillStyle = COLORS.paperSheet;
  ctx.fillRect(0, 0, W, H);

  if (revealed) {
    ctx.strokeStyle = isCorrect ? COLORS.ok : COLORS.danger;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    tracePoly(ctx, layout.envelopePts);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = COLORS.persimmon;
  tracePoly(ctx, layout.visualGeom.pts);
  ctx.fill();

  const fs = Math.max(8.5, layout.box.fontSize * 0.95);
  ctx.font = `400 ${fs}px "Noto Serif SC", serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const ln of layout.lines) {
    if (revealed && (ln.isCollision || ln.isOrphan || ln.isSplit)) {
      ctx.fillStyle = COLORS.dangerFill;
      ctx.fillRect(ln.x0 - 1, ln.yTop - 1, Math.max(8, ln.textEnd - ln.x0 + 2), fs + 2);
    }
    ctx.fillStyle = revealed && (ln.isCollision || ln.isSplit) ? COLORS.danger : COLORS.ink;
    ctx.fillText(ln.text, ln.x0, ln.yTop);
  }

  if (revealed) {
    const tag = isCorrect
      ? `✓ 边距 ${layout.metrics.marginPx}px · 0 事故`
      : !layout.checks.avoid
      ? `边距 ${layout.metrics.marginPx}px`
      : layout.metrics.splitRowCount > 0
      ? `跨图劈栏 ${layout.metrics.splitRowCount} 行`
      : !layout.checks.anchor
      ? `左缘抖动 ${layout.metrics.leftSpanMax}px`
      : `最窄 ${layout.metrics.minWrappedChars} 字`;
    ctx.fillStyle = isCorrect ? COLORS.ok : isPicked ? COLORS.danger : "#5A4E44";
    ctx.fillRect(0, H - 22, W, 22);
    ctx.fillStyle = "#FFFBF5";
    ctx.font = `700 10.5px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, W / 2, H - 11);
  }
  ctx.restore();
}
