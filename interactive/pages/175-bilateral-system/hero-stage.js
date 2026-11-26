// 175 双边系统 · 开场双翼对轴排印台（2D Canvas，data-perf-drag）
// 1:1 复原原海报双半圆对话、古典居中扉页、双栏展册镜像三标本 + 对称脉冲扫描波 + 活体圆形徽章同步

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeLayout, PALETTE, clamp } from "./model.js";

export function createHeroStage({ canvas, getState, updateState, onAfterDraw }) {
  const ctx = canvas.getContext("2d");
  let logicalW = 920;
  let logicalH = 440;
  let dpr = 1;
  let layout = null;
  let dirty = true;

  // 开场渐显动画（0 → 0.95s 流畅完成，0.9s 截图也已经饱满美观）
  let introT = 0;
  const INTRO_DUR = 0.85;

  // 空格对称脉冲波（从垂直虚线中轴同时向左右扩散）
  let pulse = { active: false, progress: 0 };

  // 拖拽交互状态
  let drag = null; // { mode: 'corridor'|'axis'|'weight'|'orb', startX, startY, startVal, startYVal, moved }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const pr = pixelRatio(2);
    if (w !== logicalW || h !== logicalH || pr !== dpr || canvas.width !== Math.round(w * pr)) {
      logicalW = w;
      logicalH = h;
      dpr = pr;
      canvas.width = Math.round(w * pr);
      canvas.height = Math.round(h * pr);
      dirty = true;
    }
  }

  function drawDotMatrix(box, cols, rows, radius, alpha = 1) {
    if (cols < 2 || rows < 2) return;
    ctx.save();
    ctx.fillStyle = PALETTE.orange;
    ctx.globalAlpha = alpha;
    const stepX = box.w / (cols - 1);
    const stepY = box.h / (rows - 1);
    for (let r = 0; r < rows; r++) {
      const y = box.y + r * stepY;
      for (let c = 0; c < cols; c++) {
        const x = box.x + c * stepX;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawPosterSpecimen(L, reveal) {
    const { leftWing, rightWing, state, checks, W, H } = L;
    const highlight = state.highlightKey;
    const dimOther = (k) => (highlight && highlight !== k ? 0.34 : 1);

    // 1. 外侧炙柿橘红点阵（1:1 呼应原海报背景点阵）
    const dotCols = W < 500 ? 7 : 10;
    const dotRows = W < 500 ? 9 : 12;
    const dotR = Math.max(1.8, Math.min(3.1, W * 0.0032));
    drawDotMatrix(leftWing.dotBox, dotCols, dotRows, dotR, 0.88 * reveal * dimOther("symmetry"));
    drawDotMatrix(rightWing.dotBox, dotCols, dotRows, dotR, 0.88 * reveal * dimOther("symmetry"));

    // 2. 左翼：经典深松墨绿半圆（直弦向右面对中轴）
    ctx.save();
    ctx.globalAlpha = reveal * dimOther("balance");
    ctx.fillStyle = PALETTE.green;
    ctx.beginPath();
    ctx.arc(leftWing.chordX, leftWing.centerY, leftWing.radius * (0.85 + 0.15 * reveal), Math.PI * 0.5, Math.PI * 1.5, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. 右翼：标准镜像半圆 OR 异形光学配重（建筑双拱框 + 内部深松碑块）
    ctx.save();
    ctx.globalAlpha = reveal * dimOther("balance");
    const rRad = rightWing.radius * (0.85 + 0.15 * reveal);
    if (state.opticalVariant === "optical-pair") {
      // 厚实深松半圆外框
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = Math.max(8, rRad * 0.18);
      ctx.beginPath();
      ctx.arc(rightWing.chordX, rightWing.centerY, rRad * 0.91, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.closePath();
      ctx.stroke();
      // 内部光学配重碑块 + 横条韵律
      ctx.fillStyle = PALETTE.green;
      const bx = rightWing.chordX + rRad * 0.22;
      const bw = rRad * 0.44;
      const bh = rRad * 0.96;
      ctx.fillRect(bx, rightWing.centerY - bh / 2, bw, bh);
      // 镂空暖纸细横纹增强排版质感
      ctx.fillStyle = PALETTE.paper;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(bx + bw * 0.16, rightWing.centerY - bh * 0.34 + i * (bh * 0.22), bw * 0.68, Math.max(2, bh * 0.045));
      }
    } else {
      ctx.fillStyle = PALETTE.green;
      ctx.beginPath();
      ctx.arc(rightWing.chordX, rightWing.centerY, rRad, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.closePath();
      ctx.fill();
    }
    // 右翼外缘可拖微标（简洁建筑双竖杠拉柄）
    const handleX = rightWing.chordX + rRad + 6;
    const handleY = rightWing.centerY;
    ctx.strokeStyle = checks.balance ? PALETTE.green : PALETTE.dangerLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(handleX, handleY - 12);
    ctx.lineTo(handleX, handleY + 12);
    ctx.moveTo(handleX + 4, handleY - 7);
    ctx.lineTo(handleX + 4, handleY + 7);
    ctx.stroke();
    ctx.restore();

    // 4. 炙柿橘红双圆核（对望对话核心）
    const orbAlpha = reveal * dimOther("dialogue");
    ctx.save();
    ctx.globalAlpha = orbAlpha;
    for (const wing of [leftWing, rightWing]) {
      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(wing.orbX, wing.orbY, wing.orbR * (0.7 + 0.3 * reveal), 0, Math.PI * 2);
      ctx.fill();
      if (!checks.dialogue) {
        ctx.strokeStyle = PALETTE.dangerLight;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(wing.orbX, wing.orbY, wing.orbR + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // 对话连线提示（仅当两橘核向轴对望且距离合适时画柔和橘虚线呼应）
    if (state.orbMode === "facing" && Math.abs(rightWing.orbX - leftWing.orbX) > leftWing.orbR * 2.2) {
      ctx.strokeStyle = checks.dialogue ? "rgba(237,115,28,0.58)" : "rgba(182,38,30,0.65)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(leftWing.orbX + leftWing.orbR + 4, leftWing.orbY);
      ctx.lineTo(rightWing.orbX - rightWing.orbR - 4, rightWing.orbY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 5. 底部双翼四道深松墨绿排印线（实绘排印体量）
    ctx.save();
    ctx.globalAlpha = reveal * dimOther("dialogue");
    ctx.fillStyle = checks.typography ? PALETTE.green : "#6B4226";
    for (const b of leftWing.bars) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    for (const b of rightWing.bars) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    // 左齐破轴时用红虚框标注失配排印线
    if (!checks.typography && leftWing.bars.length) {
      const b0 = leftWing.bars[0];
      const b3 = leftWing.bars[leftWing.bars.length - 1];
      ctx.strokeStyle = PALETTE.dangerLight;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(b0.x - 4, b0.y - 4, b0.w + 8, b3.y - b0.y + b3.h + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawTitlePageSpecimen(L, reveal) {
    const { axisPx, titleLines, state, checks, W, H, leftWing, rightWing } = L;
    // 古典书籍裁切单框（呼应 1818 博多尼扉页比例）
    const frameW = Math.min(W * 0.68, H * 0.88);
    const frameH = H * 0.86;
    const fx = axisPx - frameW / 2;
    const fy = (H - frameH) / 2;

    ctx.save();
    ctx.globalAlpha = reveal;
    // 扉页纸面略亮于背景
    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(fx, fy, frameW, frameH);
    ctx.strokeStyle = PALETTE.green;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx, fy, frameW, frameH);
    ctx.strokeStyle = "rgba(17,63,41,0.32)";
    ctx.lineWidth = 1;
    ctx.strokeRect(fx + 7, fy + 7, frameW - 14, frameH - 14);

    // 顶部橘红装饰横线+单点（1:1 原海报母题）
    const ruleW = frameW * (0.48 - state.corridorGap * 0.4);
    const ruleY = fy + frameH * 0.14;
    ctx.strokeStyle = PALETTE.orange;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(axisPx - ruleW / 2, ruleY);
    ctx.lineTo(axisPx - 10, ruleY);
    ctx.moveTo(axisPx + 10, ruleY);
    ctx.lineTo(axisPx + ruleW / 2, ruleY);
    ctx.stroke();
    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.arc(axisPx, ruleY, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // 居中排印逐行文字 + 轮廓外包辅助线
    const scale = W < 500 ? 0.72 : 1;
    const polyL = [];
    const polyR = [];
    titleLines.forEach((row, idx) => {
      const y = fy + frameH * (0.26 + idx * 0.115) + (idx >= 3 ? (state.verticalDelta / 44) * 10 : 0);
      const sz = Math.max(10, Math.round(row.size * scale));
      const isEn = /[A-Z]/.test(row.text);
      ctx.font =
        row.role === "title"
          ? `400 ${Math.round(sz * 0.92)}px "ZCOOL XiaoWei", "Noto Sans SC", serif`
          : isEn
          ? `600 ${sz}px "Cormorant Garamond", serif`
          : `600 ${sz}px "Noto Sans SC", sans-serif`;
      const textW = ctx.measureText(row.text).width;
      const visualW = state.alignMode === "flat-slab" ? frameW * 0.74 : textW;
      const offsetShift = ((state.rightWeight - 1) * frameW * 0.24) * (idx % 2 === 0 ? 1 : -0.6);
      let drawX;
      if (state.alignMode === "flush-left") {
        drawX = fx + 24;
        ctx.textAlign = "left";
      } else {
        drawX = axisPx + offsetShift;
        ctx.textAlign = "center";
      }
      ctx.textBaseline = "middle";
      ctx.fillStyle = row.role === "title" ? PALETTE.ink : row.role === "lead" ? PALETTE.green : PALETTE.inkMuted;

      if (state.alignMode === "flat-slab") {
        // 强行拉伸成僵硬等宽块（展示反例）
        ctx.fillStyle = "rgba(17,63,41,0.12)";
        ctx.fillRect(axisPx - visualW / 2, y - sz * 0.65, visualW, sz * 1.3);
        ctx.fillStyle = PALETTE.ink;
      }
      ctx.fillText(row.text, drawX, y);
      const lx = state.alignMode === "flush-left" ? drawX : drawX - visualW / 2;
      const rx = state.alignMode === "flush-left" ? drawX + visualW : drawX + visualW / 2;
      polyL.push([lx - 6, y]);
      polyR.push([rx + 6, y]);
    });

    // 绘制花瓶轮廓虚线（清晰展示左右外轮廓是否对称收束）
    if (state.showGuides && polyL.length > 1) {
      ctx.strokeStyle = checks.balance && checks.typography ? "rgba(17,63,41,0.45)" : "rgba(182,38,30,0.65)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      for (const pts of [polyL, polyR]) {
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 底部双橘点饰件（可点切换对望/背离/撞心）
    for (const wing of [leftWing, rightWing]) {
      const ox = clamp(wing.orbX, fx + 16, fx + frameW - 16);
      const oy = fy + frameH * 0.89;
      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(ox, oy, Math.max(6, wing.orbR * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDialogueSpecimen(L, reveal) {
    const { leftWing, rightWing, state, checks, W, H } = L;
    const scale = W < 500 ? 0.78 : 1;
    const colW = Math.min(leftWing.radius * 1.65, W * 0.36);
    const rightColW = clamp(colW * Math.sqrt(state.rightWeight), colW * 0.56, colW * 1.35);

    ctx.save();
    ctx.globalAlpha = reveal;

    // 左翼：深松顶条 + 靠轴右齐中文展签（破轴时变左齐）
    const lx1 = leftWing.chordX;
    const lx0 = lx1 - colW;
    const ly0 = leftWing.centerY - leftWing.radius * 0.92;
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(lx0, ly0, colW, 8);

    const zhLines = [
      { t: "对称之秩序", big: true },
      { t: "左右两翼以中心轴为界，", big: false },
      { t: "左栏文字靠轴右齐收束，", big: false },
      { t: "视线在中缝处自然交汇。", big: false },
      { t: "稳重 · 克制 · 有呼吸", big: false, accent: true },
    ];
    zhLines.forEach((item, i) => {
      const y = ly0 + 34 + i * Math.round(28 * scale);
      ctx.font = item.big
        ? `900 ${Math.round(22 * scale)}px "Noto Sans SC", sans-serif`
        : `400 ${Math.round(13.5 * scale)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = item.accent ? PALETTE.orangeTextLight : item.big ? PALETTE.ink : PALETTE.inkMuted;
      ctx.textBaseline = "middle";
      if (state.alignMode === "flush-left") {
        ctx.textAlign = "left";
        ctx.fillText(item.t, lx0, y);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(item.t, lx1 - 4, y);
      }
    });

    // 右翼：深松顶条 + 靠轴左齐英文平行展签
    const rx0 = rightWing.chordX;
    const ry0 = rightWing.centerY - rightWing.radius * 0.92;
    ctx.fillStyle = state.opticalVariant === "optical-pair" ? PALETTE.paperLight : PALETTE.green;
    ctx.fillRect(rx0, ry0, rightColW, 8);
    if (state.opticalVariant === "optical-pair") {
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx0, ry0, rightColW, 8);
    }

    const enLines = [
      { t: "ORDER IN SYMMETRY", big: true },
      { t: "Left and right wings meet", big: false },
      { t: "along one shared spine,", big: false },
      { t: "turning balance into calm", big: false },
      { t: "bilingual dialogue.", big: false, accent: true },
    ];
    enLines.forEach((item, i) => {
      const y = ry0 + 34 + i * Math.round(28 * scale);
      const weightRatio = clamp(Math.sqrt(state.rightWeight), 0.72, 1.24);
      ctx.font = item.big
        ? `700 ${Math.round(16 * scale * weightRatio)}px "Sora", sans-serif`
        : `400 ${Math.round(14 * scale * weightRatio)}px "Cormorant Garamond", serif`;
      ctx.fillStyle = item.accent ? PALETTE.orangeTextLight : item.big ? PALETTE.ink : PALETTE.inkMuted;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(item.t, rx0 + 4, y);
    });

    // 双橘核对话锚点
    for (const wing of [leftWing, rightWing]) {
      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(wing.orbX, wing.centerY + wing.radius * 0.75, Math.max(9, wing.orbR * 0.65), 0, Math.PI * 2);
      ctx.fill();
    }

    // 水平基线对齐检视虚线
    if (state.showGuides) {
      ctx.strokeStyle = checks.symmetry ? "rgba(17,63,41,0.28)" : "rgba(182,38,30,0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lx0, ly0 + 34);
      ctx.lineTo(rx0 + rightColW, ly0 + 34);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawAxisAndGuides(L, reveal) {
    const { axisPx, W, H, leftWing, rightWing, state, metrics, checks, audit } = L;
    const trueCenter = W * 0.5;

    // 1. 若中轴偏离画心，用淡红细参考线标出真正的 50% 画心位置 + 偏距红带
    if (state.showGuides && Math.abs(axisPx - trueCenter) > 3) {
      ctx.save();
      ctx.fillStyle = "rgba(182, 38, 30, 0.08)";
      ctx.fillRect(Math.min(axisPx, trueCenter), 14, Math.abs(axisPx - trueCenter), H - 28);
      ctx.strokeStyle = "rgba(182, 38, 30, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(trueCenter, 16);
      ctx.lineTo(trueCenter, H - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      // 偏距标牌（置于偏距带下段空白处，绝不与顶栏读数或中缝标尺重叠）
      const midX = (axisPx + trueCenter) / 2;
      const badgeY = Math.max(H - 68, H * 0.78);
      ctx.font = '600 11px "IBM Plex Mono", "Noto Sans SC", monospace';
      const txt = `偏${metrics.axisOffsetPct > 0 ? "右" : "左"} ${Math.abs(metrics.axisOffsetPct)}%`;
      const tw = ctx.measureText(txt).width + 12;
      ctx.fillStyle = PALETTE.dangerLight;
      ctx.fillRect(midX - tw / 2, badgeY - 10, tw, 20);
      ctx.fillStyle = "#FFF8EE";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, midX, badgeY + 0.5);
      ctx.restore();
    }

    // 2. 原海报核心符号：垂直虚线中轴（自顶向下渐进绘出）
    ctx.save();
    const axisTop = 18;
    const axisBot = axisTop + (H - 36) * reveal;
    ctx.strokeStyle = checks.symmetry ? PALETTE.ink : PALETTE.dangerLight;
    ctx.lineWidth = state.highlightKey === "symmetry" ? 2.4 : 1.6;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(axisPx, axisTop);
    ctx.lineTo(axisPx, axisBot);
    ctx.stroke();
    ctx.setLineDash([]);

    // 轴柄（顶部与底部实心小圆珠，呼应原海报右下徽章的双端珠！）
    const capR = 4.5;
    ctx.fillStyle = checks.symmetry ? PALETTE.green : PALETTE.dangerLight;
    ctx.beginPath();
    ctx.arc(axisPx, axisTop, capR, 0, Math.PI * 2);
    ctx.arc(axisPx, axisBot, capR, 0, Math.PI * 2);
    ctx.fill();

    // 中轴可拖双三角矢量握柄（矢量绘制左右三角，零缺字风险）
    const gripY = H - 30;
    const gripColor = checks.symmetry ? PALETTE.green : PALETTE.dangerLight;
    ctx.fillStyle = PALETTE.paperLight;
    ctx.strokeStyle = gripColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(axisPx - 22, gripY - 10, 44, 20);
    ctx.strokeRect(axisPx - 22, gripY - 10, 44, 20);
    ctx.fillStyle = gripColor;
    // 左小三角
    ctx.beginPath();
    ctx.moveTo(axisPx - 16, gripY);
    ctx.lineTo(axisPx - 10, gripY - 3.6);
    ctx.lineTo(axisPx - 10, gripY + 3.6);
    ctx.closePath();
    ctx.fill();
    // 右小三角
    ctx.beginPath();
    ctx.moveTo(axisPx + 16, gripY);
    ctx.lineTo(axisPx + 10, gripY - 3.6);
    ctx.lineTo(axisPx + 10, gripY + 3.6);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("轴", axisPx, gripY + 0.5);
    ctx.restore();

    // 3. 纵位错牙红线（当 |ΔY| > 8px）
    if (state.showGuides && Math.abs(metrics.deltaYPx) > 8 && state.specimen !== "titlepage") {
      ctx.save();
      ctx.strokeStyle = PALETTE.dangerLight;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(leftWing.chordX - leftWing.radius * 0.4, leftWing.centerY);
      ctx.lineTo(rightWing.chordX + rightWing.radius * 0.4, leftWing.centerY);
      ctx.stroke();
      ctx.setLineDash([]);
      // 垂直落差箭段
      const mx = rightWing.chordX + 12;
      ctx.beginPath();
      ctx.moveTo(mx, leftWing.centerY);
      ctx.lineTo(mx, rightWing.centerY);
      ctx.stroke();
      const label = `ΔY ${metrics.deltaYPx > 0 ? "+" : ""}${metrics.deltaYPx}px`;
      ctx.font = '600 10.5px "IBM Plex Mono", monospace';
      const lw = ctx.measureText(label).width + 10;
      ctx.fillStyle = PALETTE.dangerLight;
      ctx.fillRect(mx + 6, (leftWing.centerY + rightWing.centerY) / 2 - 9, lw, 18);
      ctx.fillStyle = "#FFF8EE";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx + 11, (leftWing.centerY + rightWing.centerY) / 2);
      ctx.restore();
    }

    // 4. 中缝跨度标尺（画在两翼上方空白处）
    if (state.showGuides && state.specimen !== "titlepage") {
      const gy = Math.max(44, Math.min(leftWing.centerY, rightWing.centerY) - Math.max(leftWing.radius, rightWing.radius) - 18);
      ctx.save();
      ctx.strokeStyle = checks.dialogue ? PALETTE.green : PALETTE.dangerLight;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftWing.chordX, gy);
      ctx.lineTo(rightWing.chordX, gy);
      ctx.moveTo(leftWing.chordX, gy - 4);
      ctx.lineTo(leftWing.chordX, gy + 4);
      ctx.moveTo(rightWing.chordX, gy - 4);
      ctx.lineTo(rightWing.chordX, gy + 4);
      ctx.stroke();
      const txt = `中缝 ${metrics.corridorRatioPct}%`;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      const tw = ctx.measureText(txt).width + 12;
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(axisPx - tw / 2, gy - 10, tw, 20);
      ctx.strokeRect(axisPx - tw / 2, gy - 10, tw, 20);
      ctx.fillStyle = checks.dialogue ? PALETTE.green : PALETTE.dangerLight;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, axisPx, gy + 0.5);
      ctx.restore();
    }

    // 5. 左上角微读数条 + 右上角单真源状态章（窄屏精简避免拥挤）
    ctx.save();
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    const topMeta =
      W < 520
        ? `AXIS ${Math.round(state.axisX * 100)}% · WT ${metrics.weightRatioPct}%`
        : `AXIS ${Math.round(state.axisX * 100)}% · WEIGHT ${metrics.weightRatioPct}% · GAP ${metrics.corridorRatioPct}%`;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(topMeta, 14, 12);

    const badge = audit.badgeText;
    ctx.font = '600 11px "IBM Plex Mono", "Noto Sans SC", monospace';
    const bw = ctx.measureText(badge).width + 18;
    const bx = W - bw - 12;
    ctx.fillStyle = audit.allPass ? PALETTE.green : PALETTE.dangerLight;
    ctx.fillRect(bx, 10, bw, 22);
    ctx.fillStyle = "#FCF4E7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, bx + bw / 2, 21.5);
    ctx.restore();
  }

  function drawSymmetryPulse(L) {
    if (!pulse.active) return;
    const { axisPx, W, H, leftWing, rightWing, audit } = L;
    const p = pulse.progress;
    const maxDist = Math.max(axisPx, W - axisPx);
    const waveL = axisPx - p * maxDist;
    const waveR = axisPx + p * maxDist;
    const alpha = Math.max(0, 1 - p);

    ctx.save();
    ctx.strokeStyle = audit.allPass ? PALETTE.orange : PALETTE.dangerLight;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha * 0.9;
    // 左右对称扫描光幕
    for (const wx of [waveL, waveR]) {
      if (wx >= 0 && wx <= W) {
        ctx.beginPath();
        ctx.moveTo(wx, 18);
        ctx.lineTo(wx, H - 18);
        ctx.stroke();
      }
    }
    // 扫过左/右外缘时点亮回响弧，让用户亲眼看见是否同拍抵达！
    const hitL = Math.abs(waveL - leftWing.outerX) < 18;
    const hitR = Math.abs(waveR - rightWing.outerX) < 18;
    if (hitL) {
      ctx.fillStyle = PALETTE.orange;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(leftWing.outerX, leftWing.centerY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hitR) {
      ctx.fillStyle = audit.allPass ? PALETTE.orange : PALETTE.dangerLight;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(rightWing.outerX, rightWing.centerY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    let animating = false;
    if (still) {
      introT = INTRO_DUR;
    } else if (introT < INTRO_DUR) {
      introT = Math.min(INTRO_DUR, introT + (dt || 0.016));
      dirty = true;
      animating = true;
    }
    if (pulse.active) {
      if (still) {
        pulse.active = false;
      } else {
        pulse.progress += (dt || 0.016) * 0.95;
        if (pulse.progress >= 1) pulse.active = false;
        dirty = true;
        animating = true;
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
    const reveal = easeOut(introT / INTRO_DUR);

    const state = getState();
    layout = computeLayout(state, logicalW, logicalH);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 暖米宣纸底 + 极淡制图辅助横线
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // 极细外边线（0px 锐利建筑图版）
    ctx.strokeStyle = "rgba(17, 63, 41, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, logicalW - 1, logicalH - 1);

    if (state.specimen === "poster") drawPosterSpecimen(layout, reveal);
    else if (state.specimen === "titlepage") drawTitlePageSpecimen(layout, reveal);
    else drawDialogueSpecimen(layout, reveal);

    drawAxisAndGuides(layout, reveal);
    drawSymmetryPulse(layout);

    ctx.restore();
    if (onAfterDraw) onAfterDraw(layout);
  }

  const ticker = loop(canvas, renderFrame);

  // ---------- 指针与触屏交互（兼容 perf.mjs 水平滑动 & 手机顺畅竖向滚动） ----------
  function getCanvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function pickHandle(px, py) {
    if (!layout) return "corridor";
    const { axisPx, leftWing, rightWing, H } = layout;
    // 1. 底部轴柄或中轴线附近
    if (Math.abs(px - axisPx) <= 22 && (py >= H - 48 || Math.abs(py - H * 0.5) > H * 0.34)) {
      return "axis";
    }
    // 2. 双橘核点击/拖动
    for (const w of [leftWing, rightWing]) {
      if (Math.hypot(px - w.orbX, py - w.orbY) <= Math.max(22, w.orbR + 8)) {
        return "orb";
      }
    }
    // 3. 右翼外缘体量与纵位调柄
    const rightEdgeX = rightWing.chordX + rightWing.radius;
    if (Math.abs(px - rightEdgeX) <= 24 && Math.abs(py - rightWing.centerY) <= rightWing.radius) {
      return "weight";
    }
    // 4. 画布其余区域横拖开合中缝对话距（perf.mjs 从中心横拖会落在此处，每帧顺滑重绘）
    return "corridor";
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const { x, y } = getCanvasPos(e);
    const mode = pickHandle(x, y);
    const s = getState();
    drag = {
      id: e.pointerId,
      mode,
      startX: x,
      startY: y,
      startAxis: s.axisX,
      startGap: s.corridorGap,
      startWeight: s.rightWeight,
      startDeltaY: s.verticalDelta,
      moved: false,
      pointerType: e.pointerType,
    };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    canvas.classList.add("is-dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = getCanvasPos(e);
    if (!drag) {
      const h = pickHandle(x, y);
      canvas.style.cursor = h === "orb" ? "pointer" : h === "weight" ? "ew-resize" : "ew-resize";
      return;
    }
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    const s = getState();
    if (drag.mode === "axis") {
      let next = clamp(drag.startAxis + dx / logicalW, 0.32, 0.68);
      if (Math.abs(next - 0.5) < 0.012) next = 0.5; // 轻吸附画心 50%
      updateState({ axisX: +next.toFixed(3) });
    } else if (drag.mode === "weight") {
      let nextW = clamp(drag.startWeight + (dx / Math.max(120, logicalW * 0.25)) * 0.65, 0.45, 1.55);
      if (Math.abs(nextW - 1.0) < 0.025) nextW = 1.0;
      const patch = { rightWeight: +nextW.toFixed(2) };
      if (drag.pointerType !== "touch" || Math.abs(dy) > Math.abs(dx) * 1.2) {
        let nextY = clamp(Math.round(drag.startDeltaY + dy * 0.75), -44, 44);
        if (Math.abs(nextY) <= 4) nextY = 0;
        patch.verticalDelta = nextY;
      }
      updateState(patch);
    } else {
      // corridor 或 orb 横拖：横拖调节中缝对话距（右拖收拢或展开取决于象限，统一直觉：向右拓宽、向左收拢）
      const deltaGap = (dx / Math.max(220, logicalW * 0.7)) * 0.34;
      let nextGap = clamp(drag.startGap + deltaGap, 0.0, 0.34);
      if (Math.abs(nextGap - 0.14) < 0.008) nextGap = 0.14;
      if (!s.mirrorLock) {
        // 解除镜像锁时同时连带微移中轴，让用户直接感受失轴感
        const nextAxis = clamp(drag.startAxis + (dx / logicalW) * 0.35, 0.32, 0.68);
        updateState({ corridorGap: +nextGap.toFixed(3), axisX: +nextAxis.toFixed(3) });
      } else {
        updateState({ corridorGap: +nextGap.toFixed(3) });
      }
    }
  });

  function endDrag(e) {
    if (!drag) return;
    const wasOrbClick = drag.mode === "orb" && !drag.moved;
    try { canvas.releasePointerCapture(drag.id); } catch {}
    drag = null;
    canvas.classList.remove("is-dragging");
    if (wasOrbClick) {
      const cur = getState().orbMode;
      const next = cur === "outward" ? "facing" : cur === "facing" ? "colliding" : "facing";
      updateState({ orbMode: next });
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // Touch fallback：确保 CDP Input.dispatchTouchEvent（tools/perf.mjs）驱动实时平滑重绘
  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const r = canvas.getBoundingClientRect();
      const s = getState();
      touchStart = {
        x: e.touches[0].clientX - r.left,
        y: e.touches[0].clientY - r.top,
        startGap: s.corridorGap,
        startAxis: s.axisX,
      };
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchStart || !e.touches.length) return;
      const r = canvas.getBoundingClientRect();
      const dx = e.touches[0].clientX - r.left - touchStart.x;
      const dy = e.touches[0].clientY - r.top - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy) * 0.9 && Math.abs(dx) > 3) {
        const deltaGap = (dx / Math.max(180, logicalW * 0.72)) * 0.34;
        const nextGap = clamp(touchStart.startGap + deltaGap, 0.0, 0.34);
        updateState({ corridorGap: +nextGap.toFixed(3) });
      }
    },
    { passive: true }
  );
  canvas.addEventListener("touchend", () => { touchStart = null; }, { passive: true });

  // 键盘精细控制（无障碍）
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.code === "Space") {
      e.preventDefault();
      triggerPulse();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.shiftKey) updateState({ axisX: clamp(+(s.axisX - 0.015).toFixed(3), 0.32, 0.68) });
      else updateState({ corridorGap: clamp(+(s.corridorGap - 0.015).toFixed(3), 0, 0.34) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (e.shiftKey) updateState({ axisX: clamp(+(s.axisX + 0.015).toFixed(3), 0.32, 0.68) });
      else updateState({ corridorGap: clamp(+(s.corridorGap + 0.015).toFixed(3), 0, 0.34) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (e.shiftKey) updateState({ verticalDelta: clamp(s.verticalDelta - 4, -44, 44) });
      else updateState({ rightWeight: clamp(+(s.rightWeight + 0.04).toFixed(2), 0.45, 1.55) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (e.shiftKey) updateState({ verticalDelta: clamp(s.verticalDelta + 4, -44, 44) });
      else updateState({ rightWeight: clamp(+(s.rightWeight - 0.04).toFixed(2), 0.45, 1.55) });
    }
  });

  function markDirty() {
    dirty = true;
    ticker.draw();
  }

  function triggerPulse() {
    if (reducedMotion.matches) {
      dirty = true;
      ticker.draw();
      return;
    }
    pulse = { active: true, progress: 0 };
    dirty = true;
    ticker.draw();
  }

  window.addEventListener("resize", markDirty);

  // 首帧立刻同步布局
  markDirty();

  return {
    markDirty,
    triggerPulse,
    getLayout: () => layout,
  };
}
