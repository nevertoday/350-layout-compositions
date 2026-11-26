// 215 直排左起 · 2D Canvas 纵横栅格与视线校准台
// 1:1 承袭 215 原海报铬黄底面、五柱竖排、红圆起点、虚线竖轨与红虚线右向箭，支持直接拖拽与 60fps 重绘。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { LIMITS, clamp, computeLayout, evaluate } from "./model.js";

const COLORS = {
  bg: "#FDD602",
  bgSubtle: "#F4CC00",
  ink: "#141512",
  inkSoft: "#423D18",
  inkGuide: "rgba(20, 21, 18, 0.28)",
  red: "#D81511",
  redText: "#A10D0A",
  redWash: "rgba(216, 21, 17, 0.14)",
  ok: "#0D6B4A",
  okWash: "rgba(13, 107, 74, 0.13)",
  pillBg: "#141512",
  pillFg: "#FDD602",
};

// 中文直排标点光学右上微偏，贴近真实直排排印习惯
const VERTICAL_OFFSET_PUNCT = new Set(["，", "。", "、", "；", "：", "！", "？"]);

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, size * 0.56);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function mountHeroStage(canvas, getState, onChange, onReport) {
  const ctx = canvas.getContext("2d");
  let cssW = 680;
  let cssH = 440;
  let dpr = pixelRatio(2);
  let lastLayout = null;
  let lastEval = null;

  // 动效状态：开场 1.15s 柔滑落列 + 按需演练眼动路径（静止时 0 重绘省电）
  let introProgress = reducedMotion.matches ? 1 : 0;
  let scanActive = false;
  let scanT = 0;

  // 拖拽交互状态
  let dragMode = null; // "colGap" | "charGap" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartVal = 0;
  let dragPointerId = null;
  let movedEnough = false;
  let lockedAxis = null; // "x" | "y" | null

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = Math.round(rect.width);
    cssH = Math.round(rect.height);
    // 手机竖屏与矮屏按 GUIDE.md 限 1.5× 像素比，兼顾清晰度与软渲染 60fps 拖动手感
    dpr = pixelRatio(cssW <= 500 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function buildScanPoints(layout, ev) {
    const cols = layout.columns;
    if (ev.scanMode === "cross") {
      // 横串误读：视线在第一、二行横向跨列滑动
      const row0 = cols.map((c) => ({ x: c.cx, y: c.cells[0].cy }));
      const row1 = cols.map((c) => ({ x: c.cx, y: c.cells[1].cy }));
      const row2 = cols.map((c) => ({ x: c.cx, y: c.cells[2].cy }));
      return [...row0, ...row1, ...row2];
    }
    if (ev.scanMode === "rtl") {
      // 右起倒读：从最右列向最左列逐列读
      const pts = [];
      for (let i = cols.length - 1; i >= 0; i--) {
        const c = cols[i];
        pts.push({ x: c.cx, y: c.topY + 4 });
        pts.push({ x: c.cx, y: c.bottomY - 4 });
      }
      return pts;
    }
    // 标准左起或顺列读：自左向右每列由上到下
    const pts = [];
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      pts.push({ x: c.cx, y: c.topY + 4 });
      pts.push({ x: c.cx, y: c.bottomY - 4 });
    }
    return pts;
  }

  function samplePolyline(pts, u) {
    if (pts.length < 2) return pts[0] || { x: 0, y: 0 };
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segs.push(len);
      total += len;
    }
    let target = clamp(u, 0, 1) * total;
    for (let i = 0; i < segs.length; i++) {
      if (target <= segs[i] || i === segs.length - 1) {
        const k = segs[i] > 0.001 ? target / segs[i] : 0;
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * k,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * k,
          segIdx: i,
        };
      }
      target -= segs[i];
    }
    return pts[pts.length - 1];
  }

  function render(t, dt, { still }) {
    resize();
    const state = getState();
    const layout = computeLayout(state, cssW, cssH);
    const ev = evaluate(state, layout);
    lastLayout = layout;
    lastEval = ev;

    if (still) {
      introProgress = 1;
      scanActive = false;
    } else {
      if (introProgress < 1 && dt > 0) {
        introProgress = Math.min(1, introProgress + dt * 1.35);
      }
      if (scanActive && dt > 0) {
        scanT += dt * 0.24;
        if (scanT >= 1) {
          scanT = 1;
          scanActive = false;
        }
      }
    }

    const ease = 1 - Math.pow(1 - introProgress, 3);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 海报铬黄无缝底面 + 极轻的满幅列展跑道（宽屏下直观体现五列缩挤与向右展开空间）
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    // 展开跑道框与右侧推拉提示（当五列被压窄在左侧时，空跑道直接提醒读者向右横拖展开）
    const trackX = layout.padLeft - 4;
    const trackW = cssW - layout.padLeft - layout.padRight + 8;
    const trackY = layout.startY - 6;
    const trackH = Math.max(110, layout.maxBottomY - layout.startY + 14);
    if (state.guides) {
      ctx.save();
      ctx.strokeStyle = "rgba(20, 21, 18, 0.14)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeRect(trackX, trackY, trackW, trackH);
      ctx.restore();

      const emptyRight = trackX + trackW - (layout.columns[4].x1 + 12);
      if (emptyRight > 95) {
        const hintX = layout.columns[4].x1 + 12 + emptyRight * 0.5;
        const hintY = trackY + trackH * 0.5;
        ctx.save();
        ctx.strokeStyle = "rgba(161, 13, 10, 0.32)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(layout.columns[4].x1 + 16, hintY);
        ctx.lineTo(trackX + trackW - 16, hintY);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrowHead(ctx, trackX + trackW - 16, hintY, 0, 6, "rgba(161, 13, 10, 0.55)");

        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = COLORS.redText;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("向右横拖画布拉开列距 →", hintX, hintY - 6);
        ctx.restore();
      }
    }

    // 2. 顶部独立轨迹（y=22）：起点红点锚 + 另一侧实测状态胶囊（永不互相遮挡）
    const b = layout.beacon;
    const topTag =
      ev.spacingFault === "crossRead"
        ? `× 横串 · 列/字 ${layout.ratio.toFixed(2)}×`
        : ev.spacingFault === "colIsland"
          ? `× 孤柱 · 列距 ${state.colGap.toFixed(2)}em`
          : ev.passed === 5
            ? `✓ 顺流 · 列/字 ${layout.ratio.toFixed(1)}×`
            : `${ev.statusTag} · ${layout.ratio.toFixed(2)}×`;

    // 顶部右侧固定状态胶囊（起点偏右时红标文字向左延展，永不与右侧胶囊撞车）
    ctx.save();
    ctx.font = `600 11px "Noto Sans SC", "DM Mono", sans-serif`;
    const tagW = ctx.measureText(topTag).width + 16;
    const tagOnLeft = state.anchor === "right" && b.x > cssW - tagW - 36;
    const tagX = tagOnLeft ? 10 : cssW - tagW - 10;
    drawRoundedRect(ctx, tagX, 11, tagW, 22, 3);
    ctx.fillStyle = ev.passed === 5 ? COLORS.ok : COLORS.ink;
    ctx.fill();
    ctx.fillStyle = ev.passed === 5 ? "#FFFFFF" : COLORS.bg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(topTag, tagX + tagW * 0.5, 22.5);
    ctx.restore();

    if (state.anchor === "left" || state.anchor === "right") {
      const isBad = state.anchor === "right";
      ctx.save();
      ctx.strokeStyle = isBad ? COLORS.red : "rgba(216, 21, 17, 0.65)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash(isBad ? [3, 3] : []);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.r + 2);
      ctx.lineTo(b.x, layout.columns[0].badgeY - 12);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = isBad ? COLORS.red : "rgba(216, 21, 17, 0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.red;
      ctx.fill();

      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.redText;
      ctx.textBaseline = "middle";
      if (isBad) {
        const labelBad = cssW < 460 ? "× 起点偏右" : "× 起点偏右（点切左）";
        const putLeft = b.x > 105;
        ctx.textAlign = putLeft ? "right" : "left";
        ctx.fillText(labelBad, putLeft ? b.x - b.r - 7 : b.x + b.r + 7, b.y);
      } else {
        ctx.textAlign = "left";
        ctx.fillText("起点 START", b.x + b.r + 7, b.y);
      }
    } else {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(layout.columns[0].cx, b.y, b.r * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.redText;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();

      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.redText;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("? 缺起点（点此开启）", layout.columns[0].cx + b.r + 7, b.y);
    }

    // 3. 列间竖向虚线界栏（1:1 承袭原海报五柱间的细虚线）
    if (state.guides) {
      ctx.save();
      ctx.strokeStyle = COLORS.inkGuide;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < layout.columns.length - 1; i++) {
        const midX = (layout.columns[i].x1 + layout.columns[i + 1].x0) * 0.5;
        ctx.beginPath();
        ctx.moveTo(midX, layout.startY - 6);
        ctx.lineTo(midX, layout.maxBottomY + 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 格式塔横串错误 / 孤柱断链实况叠加层（先画在字后，不挡字）
    if (ev.spacingFault === "crossRead" || ev.spacingFault === "ambiguous") {
      const isHardCross = ev.spacingFault === "crossRead";
      ctx.save();
      const rowsToMark = Math.min(3, layout.columns[0].cells.length);
      for (let r = 0; r < rowsToMark; r++) {
        const c0 = layout.columns[0].cells[r];
        const c4 = layout.columns[4].cells[r];
        drawRoundedRect(
          ctx,
          c0.x0 - 4,
          c0.y0 - 2,
          c4.x0 + c4.size - c0.x0 + 8,
          c0.size + 4,
          4
        );
        ctx.fillStyle = isHardCross ? "rgba(216, 21, 17, 0.16)" : "rgba(216, 21, 17, 0.09)";
        ctx.fill();
        ctx.strokeStyle = isHardCross ? COLORS.red : "rgba(216, 21, 17, 0.55)";
        ctx.lineWidth = isHardCross ? 1.4 : 1;
        ctx.setLineDash(isHardCross ? [] : [4, 3]);
        ctx.stroke();
      }
      // 首行横穿箭头
      const yRow0 = layout.columns[0].cells[0].cy;
      const xStart = layout.columns[0].x0 - 8;
      const xEnd = layout.columns[4].x1 + 10;
      ctx.setLineDash([]);
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(xStart, yRow0);
      ctx.lineTo(xEnd, yRow0);
      ctx.stroke();
      drawArrowHead(ctx, xEnd, yRow0, 0, 6.5, COLORS.red);
      ctx.restore();
    } else if (ev.spacingFault === "colIsland") {
      // 列距过大：在列缝中画出断链警示斜带
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const x1 = layout.columns[i].x1 + 4;
        const x2 = layout.columns[i + 1].x0 - 4;
        const w = Math.max(2, x2 - x1);
        ctx.fillStyle = "rgba(216, 21, 17, 0.09)";
        ctx.fillRect(x1, layout.startY, w, layout.maxBottomY - layout.startY);
        ctx.strokeStyle = "rgba(216, 21, 17, 0.45)";
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, layout.startY, w, layout.maxBottomY - layout.startY);
      }
      ctx.restore();
    } else if (ev.passed === 5 && state.guides) {
      // 全部达成：第 1 列左缘极轻的翡翠/墨线纵流导轨
      ctx.save();
      ctx.strokeStyle = "rgba(13, 107, 74, 0.35)";
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) {
        const cA = layout.columns[i];
        const cB = layout.columns[i + 1];
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(cA.cx, cA.bottomY + 4);
        ctx.quadraticCurveTo(
          (cA.cx + cB.cx) * 0.5,
          layout.maxBottomY + 14,
          cB.cx,
          cB.topY - 6
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 五枚顶部实心黑圆编号徽标（1:1 复刻原海报 ❶ ❷ ❸ ❹ ❺）
    for (let i = 0; i < layout.columns.length; i++) {
      const col = layout.columns[i];
      const badgeR = Math.max(9.5, layout.fs * 0.56);
      const isBadOrder = state.order !== "ltr";
      const isLeftOrigin = i === 0 && state.anchor === "left" && state.order === "ltr";

      ctx.save();
      ctx.beginPath();
      ctx.arc(col.cx, col.badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = isLeftOrigin ? COLORS.red : COLORS.ink;
      ctx.fill();

      if (isBadOrder) {
        ctx.beginPath();
        ctx.arc(col.cx, col.badgeY, badgeR + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      ctx.font = `700 ${Math.round(badgeR * 1.15)}px "DM Mono", monospace`;
      ctx.fillStyle = isLeftOrigin ? "#FFFFFF" : COLORS.bg;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(col.displayNum), col.cx, col.badgeY + 0.5);
      ctx.restore();
    }

    // 6. 绘制五列真实竖排文字（按字重分两批设 ctx.font，避免每字重设字体拖慢软渲染）
    const boldFont = `900 ${(layout.fs * 1.03).toFixed(1)}px "Noto Sans SC", sans-serif`;
    const regFont = `400 ${(layout.fs * 0.96).toFixed(1)}px "Noto Sans SC", sans-serif`;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.ink;

    for (let i = 0; i < layout.columns.length; i++) {
      const col = layout.columns[i];
      if (col.isHeavy) {
        drawRoundedRect(ctx, col.x0 - 4, col.topY - 4, layout.fs + 8, col.bottomY - col.topY + 8, 4);
        ctx.fillStyle = "rgba(20, 21, 18, 0.10)";
        ctx.fill();
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = COLORS.ink;
      }
    }

    // 批 1：常规字重
    ctx.font = regFont;
    for (let i = 0; i < layout.columns.length; i++) {
      const col = layout.columns[i];
      const colReveal = clamp((ease - i * 0.06) / 0.72, 0, 1);
      const slideY = (1 - colReveal) * 8;
      ctx.globalAlpha = 0.25 + 0.75 * colReveal;
      for (const cell of col.cells) {
        if (cell.isBold) continue;
        const isPunct = VERTICAL_OFFSET_PUNCT.has(cell.ch);
        ctx.fillText(
          cell.ch,
          cell.cx + (isPunct ? layout.fs * 0.22 : 0),
          cell.cy + (isPunct ? -layout.fs * 0.18 : 0) + slideY
        );
      }
    }
    // 批 2：加粗首句
    ctx.font = boldFont;
    for (let i = 0; i < layout.columns.length; i++) {
      const col = layout.columns[i];
      const colReveal = clamp((ease - i * 0.06) / 0.72, 0, 1);
      const slideY = (1 - colReveal) * 8;
      ctx.globalAlpha = 0.25 + 0.75 * colReveal;
      for (const cell of col.cells) {
        if (!cell.isBold) continue;
        const isPunct = VERTICAL_OFFSET_PUNCT.has(cell.ch);
        ctx.fillText(
          cell.ch,
          cell.cx + (isPunct ? layout.fs * 0.22 : 0),
          cell.cy + (isPunct ? -layout.fs * 0.18 : 0) + slideY
        );
      }
    }
    ctx.restore();

    // 7. 底部独立列距卡尺（列 1–2 正下方）与左侧字距竖卡尺（列 1 左侧）
    const calColor = ev.principles[2].ok ? COLORS.ok : COLORS.redText;
    const cc = layout.colCaliper;
    if (cc.x2 - cc.x1 > 1) {
      ctx.save();
      ctx.strokeStyle = calColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cc.x1, cc.y - 4);
      ctx.lineTo(cc.x1, cc.y + 4);
      ctx.moveTo(cc.x2, cc.y - 4);
      ctx.lineTo(cc.x2, cc.y + 4);
      ctx.moveTo(cc.x1, cc.y);
      ctx.lineTo(cc.x2, cc.y);
      ctx.stroke();

      const label = `↔ 列距 ${state.colGap.toFixed(2)}em`;
      ctx.font = `600 10.5px "DM Mono", "Noto Sans SC", monospace`;
      const tw = ctx.measureText(label).width + 12;
      const lx = clamp(cc.x2 + 8, layout.padLeft, cssW - layout.padRight - tw);
      drawRoundedRect(ctx, lx, cc.y - 9, tw, 18, 3);
      ctx.fillStyle = dragMode === "colGap" ? COLORS.ink : "rgba(253, 214, 2, 0.96)";
      ctx.fill();
      ctx.strokeStyle = calColor;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = dragMode === "colGap" ? COLORS.bg : calColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + tw * 0.5, cc.y + 0.5);
      ctx.restore();
    }

    // 7b. 字距竖卡尺（列 1 左侧，直接上下拖拽调字距）
    const vc = layout.charCaliper;
    ctx.save();
    ctx.strokeStyle = calColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(vc.x, layout.columns[0].cells[0].cy);
    ctx.lineTo(vc.x, layout.columns[0].cells[2].cy);
    ctx.moveTo(vc.x - 4, layout.columns[0].cells[0].cy);
    ctx.lineTo(vc.x + 4, layout.columns[0].cells[0].cy);
    ctx.moveTo(vc.x - 4, layout.columns[0].cells[2].cy);
    ctx.lineTo(vc.x + 4, layout.columns[0].cells[2].cy);
    ctx.stroke();

    const knobY = (layout.columns[0].cells[0].cy + layout.columns[0].cells[2].cy) * 0.5;
    drawRoundedRect(ctx, vc.x - 10, knobY - 12, 20, 24, 3);
    ctx.fillStyle = dragMode === "charGap" ? COLORS.red : COLORS.ink;
    ctx.fill();
    ctx.font = `700 10px "DM Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = COLORS.bg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↕", vc.x, knobY);

    ctx.font = `600 10px "DM Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = calColor;
    ctx.textAlign = "center";
    ctx.fillText(`${state.charGap.toFixed(2)}`, vc.x, layout.columns[0].cells[2].cy + 14);
    ctx.fillText("字距", vc.x, layout.columns[0].cells[2].cy + 27);
    ctx.restore();

    // 8. 底部原海报 1:1 纯净红虚线推进箭（绝不被字或胶囊挡住）
    const ax1 = layout.columns[0].x0;
    const ax2 = Math.max(layout.columns[4].x1, layout.padLeft + layout.availW * 0.72);
    const ay = layout.arrowY;
    ctx.save();
    const arrowColor = ev.passed === 5 ? COLORS.ok : COLORS.red;
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ax1, ay);
    ctx.lineTo(ax2, ay);
    ctx.stroke();
    ctx.setLineDash([]);
    if (state.order === "rtl") {
      drawArrowHead(ctx, ax1, ay, Math.PI, 7, COLORS.red);
    } else {
      drawArrowHead(ctx, ax2, ay, 0, 7, arrowColor);
    }
    ctx.restore();

    // 9. 实时眼动视线光珠（演练时画出真实移动路径）
    if (scanActive && !still) {
      const pts = buildScanPoints(layout, ev);
      const pos = samplePolyline(pts, scanT);
      ctx.save();
      // 轨迹虚线
      ctx.strokeStyle = ev.scanMode === "good" ? COLORS.ok : COLORS.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i <= (pos.segIdx ?? 0); i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 视线靶环
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = ev.scanMode === "good" ? "rgba(13, 107, 74, 0.22)" : "rgba(216, 21, 17, 0.24)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = ev.scanMode === "good" ? COLORS.ok : COLORS.red;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    if (onReport) onReport(layout, ev);
  }

  const ctl = loop(canvas, (t, dt, opts) => {
    // 省电守则：开场完毕且无眼动演练时，跳过空转重绘；交互和 resize 会显式调 ctl.draw()
    if (dt > 0 && !opts.still && introProgress >= 1 && !scanActive) return;
    render(t, dt, opts);
  });

  function hitTest(px, py) {
    if (!lastLayout) return null;
    const { beacon, charCaliper, columns, fs } = lastLayout;
    // 1. 起点红圆（含标签区）
    if (Math.hypot(px - beacon.x, py - beacon.y) < 28 || (py < beacon.y + 18 && py > beacon.y - 18 && Math.abs(px - beacon.x) < 120)) {
      return { kind: "beacon" };
    }
    // 2. 五枚列号圆标
    for (const c of columns) {
      if (Math.hypot(px - c.cx, py - c.badgeY) < Math.max(18, fs * 0.9)) {
        return { kind: "badge", col: c };
      }
    }
    // 3. 左侧字距竖卡尺
    if (Math.abs(px - charCaliper.x) < 26 && py >= charCaliper.dragTop - 16 && py <= charCaliper.dragBottom + 36) {
      return { kind: "charGap" };
    }
    return { kind: "colGap" };
  }

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = toLocal(e.clientX, e.clientY);
    const hit = hitTest(pt.x, pt.y);
    dragPointerId = e.pointerId ?? "touch";
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    movedEnough = false;
    lockedAxis = null;

    const st = getState();
    if (hit?.kind === "charGap") {
      dragMode = "charGap";
      dragStartVal = st.charGap;
      lockedAxis = "y";
      if (canvas.setPointerCapture && e.pointerId !== undefined) {
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      }
    } else if (hit?.kind === "beacon" || hit?.kind === "badge") {
      dragMode = hit.kind;
      dragStartVal = st.colGap;
    } else {
      dragMode = "colGap";
      dragStartVal = st.colGap;
    }
  }

  function onPointerMove(e) {
    if (dragMode === null) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (!movedEnough && Math.hypot(dx, dy) > 5) {
      movedEnough = true;
      if (!lockedAxis) {
        lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
    }
    if (!movedEnough) return;

    if (dragMode === "charGap" || (dragMode === "colGap" && lockedAxis === "y" && e.pointerType === "mouse")) {
      const next = clamp(dragStartVal + dy / 170, LIMITS.charGap.min, LIMITS.charGap.max);
      onChange({ charGap: +next.toFixed(2) });
    } else if (lockedAxis === "x" || dragMode === "colGap") {
      // 横向拖动连续推拉列距（手机触屏与 perf.mjs 横拖均平滑 60fps 响应）
      const scale = Math.max(120, cssW * 0.36);
      const next = clamp(dragStartVal + (dx / scale) * 1.45, LIMITS.colGap.min, LIMITS.colGap.max);
      onChange({ colGap: +next.toFixed(2) });
    }
  }

  function onPointerUp(e) {
    if (dragMode === null) return;
    const mode = dragMode;
    dragMode = null;
    lockedAxis = null;
    if (canvas.releasePointerCapture && e.pointerId !== undefined) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }

    if (!movedEnough) {
      const st = getState();
      if (mode === "beacon") {
        // 点红点起点在 左起锚定 → 无起点 → 右端偏置 间循环（错态时优先直切左起）
        const nextAnchor = st.anchor === "left" ? "none" : st.anchor === "none" ? "right" : "left";
        onChange({ anchor: nextAnchor });
      } else if (mode === "badge") {
        // 点编号圆标在 左起正序 → 右起反序 → 错乱列序 间切换（错态时直切正序）
        const nextOrder = st.order === "ltr" ? "rtl" : st.order === "rtl" ? "ltr" : "ltr";
        onChange({ order: nextOrder });
      }
    }
  }

  // 统一走 Pointer Events，并在极少数只派发 Touch 的环境下用 fallback（严防双触发）
  let pointerActive = false;
  canvas.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    onPointerDown(e);
  });
  window.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    onPointerMove(e);
  }, { passive: true });
  window.addEventListener("pointerup", (e) => {
    if (!pointerActive) return;
    pointerActive = false;
    onPointerUp(e);
  });
  window.addEventListener("pointercancel", (e) => {
    if (!pointerActive) return;
    pointerActive = false;
    onPointerUp(e);
  });

  let touchFallback = false;
  canvas.addEventListener("touchstart", (e) => {
    if (pointerActive || dragMode !== null || !e.touches.length) return;
    touchFallback = true;
    const t0 = e.touches[0];
    onPointerDown({ clientX: t0.clientX, clientY: t0.clientY, pointerType: "touch" });
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchFallback || !e.touches.length) return;
    const t0 = e.touches[0];
    onPointerMove({ clientX: t0.clientX, clientY: t0.clientY, pointerType: "touch" });
  }, { passive: true });
  canvas.addEventListener("touchend", () => {
    if (!touchFallback) return;
    touchFallback = false;
    onPointerUp({});
  }, { passive: true });

  // 键盘直接控制画布：←/→ 调列距、↑/↓ 调字距、Space 演练视线
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange({ colGap: +clamp(st.colGap + 0.1, LIMITS.colGap.min, LIMITS.colGap.max).toFixed(2) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange({ colGap: +clamp(st.colGap - 0.1, LIMITS.colGap.min, LIMITS.colGap.max).toFixed(2) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange({ charGap: +clamp(st.charGap + 0.04, LIMITS.charGap.min, LIMITS.charGap.max).toFixed(2) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange({ charGap: +clamp(st.charGap - 0.04, LIMITS.charGap.min, LIMITS.charGap.max).toFixed(2) });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      triggerScan();
    }
  });

  const ro = new ResizeObserver(() => ctl.draw());
  ro.observe(canvas);

  function triggerScan() {
    if (reducedMotion.matches) {
      ctl.draw();
      return;
    }
    scanActive = true;
    scanT = 0;
    ctl.draw();
  }

  return {
    draw: () => ctl.draw(),
    triggerScan,
    getSnapshot: () => ({ layout: lastLayout, ev: lastEval }),
  };
}
