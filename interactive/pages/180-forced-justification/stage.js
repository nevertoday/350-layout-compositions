// 180 强制两端对齐 · 2D Canvas 交互画布模块（stage.js）
// 1. Hero 主角玩具：张力牵引校样机（1:1 转译 180 原海报排字框 + 黑点蓝虚线节拍仪 + 铺══●══满拉筋桥）
// 2. Section 03 暗室画布：末行字数 1/(n-1) 拉裂双曲线与实时应力灯带

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluate, fmtEm, ruptureCurve } from "./model.js";

const COL = {
  paper: "#EBE9E8",
  paperBright: "#F7F7F6",
  paperCard: "#FAFAFA",
  ink: "#000000",
  inkSoft: "#3B3E46",
  inkMuted: "#6A6E78",
  blue: "#0043FB",
  blueDark: "#0033CC",
  blueSoft: "rgba(0, 67, 251, 0.10)",
  blueMid: "rgba(0, 67, 251, 0.28)",
  red: "#C92A1D",
  redSoft: "rgba(201, 42, 29, 0.11)",
  green: "#0A6E43",
  greenSoft: "rgba(10, 110, 67, 0.11)",
  rule: "#C7C8C6",
};

// ---------------- Hero 主画布：张力牵引校样机 ----------------
export function createHeroStage(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let W = 900;
  let H = 430;
  let dpr = 1;

  // 动画态（开场推进、扫光脉冲、按需重绘避免空转耗尽软渲染帧率）
  let intro = 0;
  let scanPhase = -1; // >=0 时正在播放 Space 张力扫光（0..1）
  let dirty = true;
  let hoverSplit = null; // { lineIdx, charIdx, x, y }
  let dragMode = null; // "jaw" | "canvas" | null
  let dragStartX = 0;
  let dragStartMeasure = 0.88;
  let pointerMoved = false;
  let splitHitZones = [];
  let boxGeom = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = rect.width < 520 ? pixelRatio(1.5) : pixelRatio(2);
    W = rect.width;
    H = rect.height;
    const tw = Math.round(W * dpr);
    const th = Math.round(H * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      dirty = true;
    }
  }
  resize();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      ctrl.draw();
    }).observe(canvas);
  }

  function triggerScan() {
    scanPhase = 0;
    dirty = true;
    ctrl.draw();
  }

  let drawnOnce = false;
  function markDirtyAndDraw() {
    dirty = true;
    if (!drawnOnce || reducedMotion.matches) ctrl.draw();
  }

  function drawFrame(t, dt, { still }) {
    if (canvas.width < 10) resize();
    const animating = !still && (intro < 1 || scanPhase >= 0);
    if (!dirty && !animating) return;
    dirty = false;
    drawnOnce = true;

    if (still) {
      intro = 1;
      if (scanPhase >= 0) scanPhase = -1;
    } else {
      if (intro < 1) intro = Math.min(1, intro + (dt > 0 ? dt * 2.2 : 0.04));
      if (scanPhase >= 0) {
        scanPhase += dt * 0.72;
        if (scanPhase > 1.15) scanPhase = -1;
      }
    }

    const easeIntro = 1 - Math.pow(1 - intro, 3);
    const { specimenId, state } = getState();
    const res = evaluate(specimenId, state);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 冷矿灰展纸底面（轻微网格标尺感，0px 直角）
    ctx.fillStyle = COL.paperBright;
    ctx.fillRect(0, 0, W, H);

    // 极克制的竖向参考底格（排印校样纸感）
    const padX = W < 520 ? 14 : 26;
    const padTop = W < 520 ? 14 : 20;
    const compact = W < 680;

    // 2. 顶部单行实时标尺眉
    const hudH = compact ? 26 : 30;
    drawTopHud(ctx, padX, padTop, W - padX * 2, hudH, res, compact);

    // 3. 布局分区：
    //    宽屏（W >= 680）：左 71% 主排字校样框 + 右 29% 原海报同款黑点蓝虚线节拍仪
    //    窄屏（W < 680）：上主排字校样框 + 中段精简节拍仪 + 下铺满拉筋轨
    const railH = compact ? 48 : 62;
    const mainTop = padTop + hudH + (compact ? 10 : 14);
    const mainBottom = H - railH - (compact ? 12 : 16);
    const mainH = Math.max(130, mainBottom - mainTop);

    const seismoW = compact ? 0 : Math.min(265, Math.max(190, W * 0.27));
    const gapBetween = compact ? 0 : 20;
    const proofAreaW = W - padX * 2 - seismoW - gapBetween;
    const proofH = compact ? mainH * 0.65 : mainH;

    // 计算校样内框真实像素宽（受 measure 控制，左对齐于左钳，右钳可自由推拉！）
    const jawMargin = compact ? 10 : 14;
    const maxBoxPx = proofAreaW - jawMargin * 2;
    const animatedMeasure = res.measure * (0.86 + 0.14 * easeIntro);
    const boxPx = Math.max(110, maxBoxPx * animatedMeasure);
    const boxX = padX + jawMargin;
    const boxY = mainTop + (compact ? 6 : 10);
    const boxH = proofH - (compact ? 26 : 34);

    boxGeom = {
      boxX,
      boxY,
      boxPx,
      maxBoxPx,
      boxH,
      proofAreaX: padX,
      proofAreaW,
      minMeasure: res.spec.minMeasure,
      maxMeasure: res.spec.maxMeasure,
    };

    // 绘制最大可用栏宽虚线幽灵轨道（标出 100% 边界，让用户一眼懂可以左右拖蓝钳）
    ctx.save();
    ctx.fillStyle = "#F0F1EF";
    ctx.fillRect(boxX, boxY, maxBoxPx, boxH);
    ctx.strokeStyle = "#C5C7C4";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, maxBoxPx - 1, boxH - 1);
    ctx.setLineDash([]);
    ctx.restore();

    // 4. 绘制当前有效校样白纸框
    const isPass = res.passCount === 4;
    const frameColor = isPass
      ? COL.blue
      : res.anyCollision || res.maxGap > res.thresholds.TENSION_MAX || res.anyUnexpandable
        ? COL.red
        : state.mode === "forced"
          ? COL.blue
          : COL.ink;

    ctx.fillStyle = COL.paperCard;
    ctx.fillRect(boxX, boxY, boxPx, boxH);

    // 校样外框（0px 锐利直角，贴合 180 原海报）
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = state.mode === "forced" ? 2 : 1.5;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxPx - 1, boxH - 1);

    // 5. 渲染真实排版字符 + 逐缝应力条 + 可点断行缝
    const innerPadX = compact ? 10 : 18;
    const usableW = Math.max(60, boxPx - innerPadX * 2);
    const emPx = usableW / res.boxEm;
    const fontSize = clamp(emPx, compact ? 11.5 : 13, compact ? 25 : 34);
    const scaleX = usableW / res.boxEm;

    const lineCount = res.lines.length;
    const lineSlotH = boxH / (lineCount + 0.45);
    const firstBaselineY = boxY + (boxH - (lineCount - 1) * lineSlotH) * 0.5 + fontSize * 0.34;

    splitHitZones = [];

    // 渲染左右内部基准线（极细竖线，标明黑墨真实边界）
    const leftEdgePx = boxX + innerPadX;
    const rightEdgePx = boxX + innerPadX + usableW;
    ctx.save();
    ctx.strokeStyle = isPass ? "rgba(0, 67, 251, 0.25)" : "rgba(0, 0, 0, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(leftEdgePx, boxY + 4);
    ctx.lineTo(leftEdgePx, boxY + boxH - 4);
    ctx.moveTo(rightEdgePx, boxY + 4);
    ctx.lineTo(rightEdgePx, boxY + boxH - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const fontFamily = res.spec.isLatin
      ? `700 ${fontSize.toFixed(1)}px "Sora", "Noto Sans SC", sans-serif`
      : `700 ${fontSize.toFixed(1)}px "Noto Sans SC", sans-serif`;
    ctx.font = fontFamily;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    res.lines.forEach((line, lIdx) => {
      const baseY = firstBaselineY + lIdx * lineSlotH;
      const lineGapBad =
        line.effectiveGapEm > res.thresholds.TENSION_MAX ||
        line.charGap < 0.01 ||
        line.unexpandable ||
        (state.spaceMode === "word" && line.maxWordGapEm > 1.05);

      // 行级微弱红底警示（仅在撕裂或撞字行出现）
      if (lineGapBad) {
        ctx.fillStyle = COL.redSoft;
        ctx.fillRect(leftEdgePx - 2, baseY - fontSize * 0.92, usableW + 4, fontSize * 1.18);
      }

      // 逐缝绘张力细簧 / 空白警示带（在异常缝或 Space 扫光时显著浮现）
      const scanActive = scanPhase >= 0;
      for (let i = 0; i < line.glyphs.length - 1; i++) {
        const g = line.glyphs[i];
        const next = line.glyphs[i + 1];
        const x1 = leftEdgePx + (g.x + g.w) * scaleX;
        const x2 = leftEdgePx + next.x * scaleX;
        const gapPx = x2 - x1;
        const gapEm = (next.x - (g.x + g.w));

        // 决定何时高亮字缝
        const isRuptureGap = gapEm > res.thresholds.TENSION_MAX;
        const isCollisionGap = gapEm < 0.01;
        if (gapPx > 1.5 && (isRuptureGap || scanActive)) {
          ctx.save();
          const barColor = isRuptureGap
            ? "rgba(201, 42, 29, 0.24)"
            : gapEm < res.thresholds.TENSION_MIN
              ? "rgba(180, 120, 0, 0.18)"
              : "rgba(0, 67, 251, 0.16)";
          ctx.fillStyle = barColor;
          ctx.fillRect(x1 + 0.5, baseY - fontSize * 0.72, Math.max(0, gapPx - 1), fontSize * 0.8);

          // 撕裂缝画红虚线张力桥
          if (isRuptureGap) {
            ctx.strokeStyle = COL.red;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x1 + 2, baseY - fontSize * 0.32);
            ctx.lineTo(x2 - 2, baseY - fontSize * 0.32);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();
        } else if (isCollisionGap) {
          ctx.fillStyle = "rgba(201, 42, 29, 0.35)";
          ctx.fillRect(x2 - 1, baseY - fontSize * 0.8, 2, fontSize * 0.9);
        }

        // 记录可点击断行点（第 1 行与第 2 行字符之间）
        if (lIdx < res.lines.length - 1 || (res.lines.length === 2 && lIdx === 0)) {
          const globalIdx = line.startIdx + i + 1;
          if (globalIdx >= 2 && globalIdx <= res.spec.text.length - 2) {
            splitHitZones.push({
              lineIdx: lIdx,
              globalIdx,
              x: (x1 + x2) * 0.5,
              y: baseY - fontSize * 0.34,
              halfW: Math.max(8, (next.center - g.center) * scaleX * 0.45),
              halfH: fontSize * 0.72,
            });
          }
        }
      }

      // 逐字绘制字符本身（使用精确单真源坐标）
      line.glyphs.forEach((g) => {
        if (g.isSpace) return;
        const gx = leftEdgePx + g.x * scaleX;
        ctx.fillStyle = lineGapBad && line.charGap < 0.01 ? COL.red : COL.ink;
        if (g.isTrailPunct && line.opticalDentEm > 0.25) {
          // 标出机械对齐时的全角尾标点凹陷区
          const dentX = gx + g.w * scaleX * 0.52;
          const dentW = g.w * scaleX * 0.48;
          ctx.fillStyle = "rgba(201, 42, 29, 0.22)";
          ctx.fillRect(dentX, baseY - fontSize * 0.78, dentW, fontSize * 0.88);
          ctx.strokeStyle = COL.red;
          ctx.lineWidth = 1;
          ctx.strokeRect(dentX + 0.5, baseY - fontSize * 0.78 + 0.5, dentW - 1, fontSize * 0.88 - 1);
          ctx.fillStyle = COL.ink;
        }
        ctx.fillText(g.ch, gx, baseY);
      });

      // 未触达右缘时画出右侧“塌缩缺口”斜纹带
      if (line.flushRatio < 0.94 && line.charGap >= 0) {
        const endPx = leftEdgePx + Math.max(0, line.visualRightEdgeEm) * scaleX;
        const gapRight = rightEdgePx - endPx;
        if (gapRight > 10) {
          ctx.save();
          ctx.fillStyle = "rgba(201, 42, 29, 0.09)";
          ctx.fillRect(endPx + 2, baseY - fontSize * 0.76, gapRight - 2, fontSize * 0.88);
          ctx.strokeStyle = COL.red;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(endPx + 2.5, baseY - fontSize * 0.76 + 0.5, gapRight - 3, fontSize * 0.88 - 1);
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // 去掉行内悬浮 em 牌以免遮挡末尾字形，改为由右侧/下方节拍仪统一清晰标出每行实测 em
    });

    // 悬停可点断行提示游标
    if (hoverSplit && state.lineCount === 2) {
      ctx.save();
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hoverSplit.x, hoverSplit.y - 16);
      ctx.lineTo(hoverSplit.x, hoverSplit.y + 16);
      ctx.stroke();
      ctx.fillStyle = COL.blue;
      ctx.fillRect(hoverSplit.x - 22, hoverSplit.y - 32, 44, 15);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("点此断行", hoverSplit.x, hoverSplit.y - 21);
      ctx.restore();
    }

    // 6. 绘制左右钳爪（左固定黑锚 + 右可拖动电光蓝钳爪）
    drawClampingJaws(ctx, boxX, boxY, boxPx, boxH, res, compact);

    // 7. 校样框底沿：原海报同款电光蓝双向箭头「◀────── 向两端扩展 ──────▶」
    const arrowY = boxY + boxH + (compact ? 14 : 18);
    drawExpandArrow(ctx, boxX, boxX + boxPx, arrowY, res, compact);

    // 8. 原海报同款「黑点 + 蓝竖虚线」节拍仪（宽屏在右侧齐高，窄屏紧贴下方）
    if (!compact) {
      const sx = padX + proofAreaW + gapBetween;
      drawSeismograph(ctx, sx, boxY, seismoW, boxH + 18, res, false);
    } else {
      const sy = boxY + boxH + 26;
      const sh = Math.max(46, mainBottom - sy);
      drawSeismograph(ctx, boxX, sy, maxBoxPx, sh, res, true);
    }

    // 9. Space 张力透视扫描光束
    if (scanPhase >= 0 && scanPhase <= 1.1) {
      const p = clamp(scanPhase, 0, 1);
      const scanX = leftEdgePx + usableW * p;
      ctx.save();
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scanX, boxY);
      ctx.lineTo(scanX, boxY + boxH);
      ctx.stroke();
      // 左右双缘同步校齐高亮线
      ctx.strokeStyle = isPass ? COL.green : COL.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftEdgePx, boxY);
      ctx.lineTo(leftEdgePx, boxY + boxH);
      ctx.moveTo(rightEdgePx, boxY);
      ctx.lineTo(rightEdgePx, boxY + boxH);
      ctx.stroke();
      ctx.restore();
    }

    // 10. 底部 Iconic Motif：1:1 原海报「铺 ═════●═════ 满」11 道电光蓝拉筋桥！
    //     随当前框宽实时伸缩，直接把“铺满张力”实体化成一条看得见的物理结构
    drawPuManBridge(ctx, padX, H - railH - 4, W - padX * 2, railH - 4, boxX, boxPx, res, compact);

    ctx.restore();
  }

  function drawTopHud(ctx, x, y, w, h, res, compact) {
    ctx.save();
    // 左侧实测数字带
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const midY = y + h * 0.5;
    const summary = compact
      ? `框宽 ${Math.round(res.measure * 100)}% · 最大 ${fmtEm(res.maxGap)} · 比 ${res.pitchRatio.toFixed(1)}×`
      : `MEASURE ${Math.round(res.measure * 100)}% · GAP ${fmtEm(res.minGap)}–${fmtEm(res.maxGap)} · PITCH ${res.pitchRatio.toFixed(2)}× · 张力：${res.tensionTier}（示意）`;
    ctx.fillStyle = COL.ink;
    ctx.fillText(summary, x, midY);

    // 右侧状态硬签
    const tag = res.primary.tag;
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(tag).width + 18;
    const tx = x + w - tw;
    ctx.fillStyle = res.passCount === 4 ? COL.green : COL.red;
    ctx.fillRect(tx, y + 2, tw, h - 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(tag, tx + tw * 0.5, midY + 0.5);
    ctx.restore();
  }

  function drawClampingJaws(ctx, bx, by, bw, bh, res, compact) {
    ctx.save();
    // 左锚固钳（黑）
    ctx.fillStyle = COL.ink;
    ctx.fillRect(bx - 4, by, 4, bh);

    // 右可拖蓝钳把手
    const rx = bx + bw;
    const handleW = compact ? 14 : 16;
    const handleH = compact ? 42 : 52;
    const hy = by + (bh - handleH) * 0.5;

    ctx.fillStyle = res.passCount === 4 ? COL.blue : (res.anyCollision || res.maxGap > res.thresholds.TENSION_MAX ? COL.red : COL.blue);
    ctx.fillRect(rx - 1, by, 4, bh);
    ctx.fillRect(rx - handleW * 0.5 + 1, hy, handleW, handleH);

    // 把手内白色双竖防滑纹
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx - 1.5, hy + 12);
    ctx.lineTo(rx - 1.5, hy + handleH - 12);
    ctx.moveTo(rx + 3.5, hy + 12);
    ctx.lineTo(rx + 3.5, hy + handleH - 12);
    ctx.stroke();

    // 轻标「拖蓝钳」提示小签（仅当未触碰右侧节拍仪时显示）
    if (!compact && rx + handleW * 0.5 + 52 < boxGeom.proofAreaX + boxGeom.proofAreaW) {
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COL.blueDark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("拖蓝钳", rx + handleW * 0.5 + 5, by + bh * 0.5);
    }
    ctx.restore();
  }

  function drawExpandArrow(ctx, x1, x2, y, res, compact) {
    ctx.save();
    const color = res.passCount === 4 ? COL.blue : COL.blueDark;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;

    const label = res.lines.length === 2
      ? `向两端扩展 · 行字数 ${res.lines[0].visibleChars}+${res.lines[1].visibleChars}`
      : `向两端扩展 · ${res.lines.map((l) => l.visibleChars).join("+")}`;
    ctx.font = `700 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    const lw = ctx.measureText(label).width + 16;
    const mid = (x1 + x2) * 0.5;

    // 左半线 + 左三角箭
    if (mid - lw * 0.5 > x1 + 10) {
      ctx.beginPath();
      ctx.moveTo(x1 + 6, y);
      ctx.lineTo(mid - lw * 0.5, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + 7, y - 4);
    ctx.lineTo(x1 + 7, y + 4);
    ctx.closePath();
    ctx.fill();

    // 右半线 + 右三角箭
    if (mid + lw * 0.5 < x2 - 10) {
      ctx.beginPath();
      ctx.moveTo(mid + lw * 0.5, y);
      ctx.lineTo(x2 - 6, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 7, y - 4);
    ctx.lineTo(x2 - 7, y + 4);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, mid, y + 0.5);
    ctx.restore();
  }

  // 1:1 复刻原海报右侧「黑点 + 蓝竖虚线」字距节拍仪
  function drawSeismograph(ctx, x, y, w, h, res, horizontalCompact) {
    ctx.save();
    ctx.fillStyle = "#F2F2F0";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#CFD1CE";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    const pad = horizontalCompact ? 10 : 14;
    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = COL.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const compactSummary = res.lines
      .map((l, i) => `L${i + 1}:${l.unexpandable ? "失灵" : fmtEm(l.effectiveGapEm)}`)
      .join(" · ");
    ctx.fillText(horizontalCompact ? `节拍仪 · ${compactSummary}` : "RHYTHM SEISMOGRAPH · 节拍仪", x + pad, y + 6);

    const rows = res.lines;
    const innerTop = y + (horizontalCompact ? 22 : 28);
    const innerH = Math.max(24, h - (horizontalCompact ? 26 : 34));
    const rowH = innerH / rows.length;
    const railX1 = x + pad;
    const railW = w - pad * 2;

    rows.forEach((line, idx) => {
      const rowTop = innerTop + idx * rowH;
      const ry = rowTop + rowH * (horizontalCompact ? 0.78 : 0.84);
      const topTick = rowTop + (horizontalCompact ? 4 : 18);

      const lineBad =
        line.effectiveGapEm > res.thresholds.TENSION_MAX ||
        line.charGap < 0.01 ||
        line.unexpandable ||
        line.flushRatio < 0.94;

      // 宽屏每行独立顶部标题栏（位于竖虚线上方，绝不与蓝色虚线重叠）
      if (!horizontalCompact) {
        ctx.font = `700 10px "Space Mono", "Noto Sans SC", monospace`;
        ctx.fillStyle = lineBad ? COL.red : COL.blueDark;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`L${idx + 1}（${line.visibleChars}字）`, railX1, rowTop + 2);
        ctx.textAlign = "right";
        const tagText = line.unexpandable ? "词空失灵" : line.charGap < 0.01 ? `撞 ${fmtEm(line.charGap)}` : fmtEm(line.effectiveGapEm);
        ctx.fillText(tagText, railX1 + railW, rowTop + 2);
      }

      // 黑色基准横线（原海报标志母题）
      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(railX1, ry);
      ctx.lineTo(railX1 + railW, ry);
      ctx.stroke();

      // 每个可见字符在节拍仪上的真实比例位置（合并路径一次描边与一次填点，大幅提速软渲染）
      const vis = line.glyphs.filter((g) => !g.isSpace);
      const denom = Math.max(0.1, res.boxEm);
      const xs = vis.map((g) => railX1 + clamp(g.center / denom, 0.01, 0.99) * railW);

      // 蓝色垂直虚线（单次合批描边）
      ctx.strokeStyle = lineBad ? COL.red : COL.blue;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        ctx.moveTo(xs[i], topTick);
        ctx.lineTo(xs[i], ry - 4);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 黑色实心节拍圆点（单次合批填充）
      const dotR = horizontalCompact ? 2.5 : 3.2;
      ctx.fillStyle = lineBad ? COL.red : COL.ink;
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        ctx.moveTo(xs[i] + dotR, ry);
        ctx.arc(xs[i], ry, dotR, 0, Math.PI * 2);
      }
      ctx.fill();
    });

    ctx.restore();
  }

  // 1:1 复刻原海报底部「铺 ═════●═════ 满」11 道电光蓝拉筋带，随框宽实时伸张！
  function drawPuManBridge(ctx, x, y, w, h, boxX, boxPx, res, compact) {
    ctx.save();
    const blue = res.passCount === 4 ? COL.blue : res.anyCollision ? COL.red : COL.blue;
    const leftX = boxX;
    const rightX = Math.min(x + w - 4, boxX + boxPx);
    const span = Math.max(120, rightX - leftX);
    const charW = compact ? 30 : 42;
    const barsX1 = leftX + charW + 4;
    const barsX2 = rightX - charW - 4;
    const midY = y + h * 0.5;
    const barCount = compact ? 7 : 11;
    const barSpanH = h * 0.78;
    const barTop = midY - barSpanH * 0.5;

    // 左右巨字「铺」「满」贴紧框宽双缘
    ctx.fillStyle = blue;
    ctx.font = `900 ${compact ? 30 : 44}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("铺", leftX, midY + 2);
    ctx.textAlign = "right";
    ctx.fillText("满", rightX, midY + 2);

    // 中间 11 道平行电光蓝拉筋横条（单次合批描边）
    if (barsX2 > barsX1 + 16) {
      const step = barSpanH / (barCount - 1);
      ctx.strokeStyle = blue;
      ctx.lineWidth = compact ? 1.8 : 2.1;
      ctx.beginPath();
      for (let i = 0; i < barCount; i++) {
        const by = barTop + i * step;
        ctx.moveTo(barsX1, by);
        ctx.lineTo(barsX2, by);
      }
      ctx.stroke();
      // 中央电光蓝实心张力圆
      const cx = (barsX1 + barsX2) * 0.5;
      const rad = Math.min(barSpanH * 0.46, (barsX2 - barsX1) * 0.22);
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.arc(cx, midY, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 右侧剩余未用区域标注当前框宽百分比
    if (rightX + 54 < x + w) {
      ctx.font = `700 10.5px "Space Mono", monospace`;
      ctx.fillStyle = COL.inkMuted;
      ctx.textAlign = "left";
      ctx.fillText(`${Math.round(res.measure * 100)}%`, rightX + 10, midY + 1);
    }

    ctx.restore();
  }

  // ---------------- 真实鼠标 + 触摸交互（横向拖动不抢页面竖向滚动！） ----------------
  function getCanvasPos(ev) {
    const r = canvas.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function findSplitHit(pt) {
    const { state } = getState();
    if (state.lineCount !== 2) return null;
    let best = null;
    let bestD = Infinity;
    for (const z of splitHitZones) {
      if (Math.abs(pt.x - z.x) <= z.halfW && Math.abs(pt.y - z.y) <= z.halfH) {
        const d = Math.hypot(pt.x - z.x, pt.y - z.y);
        if (d < bestD) {
          bestD = d;
          best = z;
        }
      }
    }
    return best;
  }

  // 鼠标拖动 + 点击断行
  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "touch") return; // 触屏单独处理以保护竖向滚动
    if (!boxGeom) return;
    const pt = getCanvasPos(ev);
    dragMode = "jaw";
    dragStartX = pt.x;
    dragStartMeasure = getState().state.measure;
    pointerMoved = false;
    canvas.setPointerCapture?.(ev.pointerId);
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (ev.pointerType === "touch") return;
    if (!boxGeom) return;
    const pt = getCanvasPos(ev);

    if (dragMode) {
      const dx = pt.x - dragStartX;
      if (Math.abs(dx) > 4) pointerMoved = true;
      if (pointerMoved) {
        const deltaMeasure = dx / Math.max(120, boxGeom.maxBoxPx);
        const nextM = clamp(dragStartMeasure + deltaMeasure, boxGeom.minMeasure, boxGeom.maxMeasure);
        onMutate({ measure: +nextM.toFixed(3) });
      }
      return;
    }

    const hit = findSplitHit(pt);
    const prev = hoverSplit;
    hoverSplit = hit;
    const nearJaw = Math.abs(pt.x - (boxGeom.boxX + boxGeom.boxPx)) < 18 && pt.y >= boxGeom.boxY && pt.y <= boxGeom.boxY + boxGeom.boxH;
    canvas.style.cursor = nearJaw ? "ew-resize" : hit ? "pointer" : "ew-resize";
    if (prev !== hoverSplit) markDirtyAndDraw();
  });

  canvas.addEventListener("pointerup", (ev) => {
    if (ev.pointerType === "touch") return;
    if (dragMode && !pointerMoved) {
      const pt = getCanvasPos(ev);
      const hit = findSplitHit(pt);
      if (hit) {
        onMutate({ split1: hit.globalIdx, lineCount: 2 });
      }
    }
    dragMode = null;
  });

  canvas.addEventListener("pointerleave", () => {
    if (hoverSplit) {
      hoverSplit = null;
      markDirtyAndDraw();
    }
  });

  // 触屏：仅锁定横向拖动，竖滑交还给浏览器滚动（同时完美响应 tools/perf.mjs 的左右来回拖！）
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLocked = null; // "h" | "v" | null
  let touchStartM = 0.88;

  canvas.addEventListener(
    "touchstart",
    (ev) => {
      if (!ev.touches.length || !boxGeom) return;
      const t0 = ev.touches[0];
      touchStartX = t0.clientX;
      touchStartY = t0.clientY;
      touchStartM = getState().state.measure;
      touchLocked = null;
    },
    { passive: true },
  );

  canvas.addEventListener(
    "touchmove",
    (ev) => {
      if (!ev.touches.length || !boxGeom) return;
      const t0 = ev.touches[0];
      const dx = t0.clientX - touchStartX;
      const dy = t0.clientY - touchStartY;
      if (!touchLocked) {
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          touchLocked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
        }
      }
      if (touchLocked === "h") {
        ev.preventDefault();
        const deltaMeasure = dx / Math.max(120, boxGeom.maxBoxPx);
        const nextM = clamp(touchStartM + deltaMeasure, boxGeom.minMeasure, boxGeom.maxMeasure);
        onMutate({ measure: +nextM.toFixed(3) });
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchend",
    (ev) => {
      if (!touchLocked && ev.changedTouches.length && boxGeom) {
        const r = canvas.getBoundingClientRect();
        const t0 = ev.changedTouches[0];
        const hit = findSplitHit({ x: t0.clientX - r.left, y: t0.clientY - r.top });
        if (hit) onMutate({ split1: hit.globalIdx, lineCount: 2 });
      }
      touchLocked = null;
    },
    { passive: true },
  );

  const ctrl = loop(canvas, drawFrame);
  window.addEventListener("resize", () => {
    resize();
    markDirtyAndDraw();
  });

  return {
    draw: markDirtyAndDraw,
    triggerScan,
  };
}

// ---------------- Section 03 暗室画布：末行字数拉裂双曲线与实时灯带 ----------------
export function createRuptureStage(canvas, getCount) {
  const ctx = canvas.getContext("2d");
  const BOX_EM = 18.0;
  const pts = ruptureCurve(BOX_EM, 2, 14);
  let dpr = 1;
  let W = 680;
  let H = 260;
  let dirty = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = rect.width < 520 ? pixelRatio(1.5) : pixelRatio(2);
    W = rect.width;
    H = rect.height;
    const tw = Math.round(W * dpr);
    const th = Math.round(H * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      dirty = true;
    }
  }
  resize();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      ctrl.draw();
    }).observe(canvas);
  }

  function drawFrame() {
    if (canvas.width < 10) resize();
    if (!dirty) return;
    dirty = false;

    const activeN = clamp(getCount(), 2, 14);
    const activeGap = (BOX_EM - activeN) / (activeN - 1);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深钴暗室底
    ctx.fillStyle = "#0B1126";
    ctx.fillRect(0, 0, W, H);

    const padL = W < 440 ? 40 : 54;
    const padR = 20;
    const padT = 26;
    const padB = 38;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const maxPlotGap = 6.0; // em 纵轴上限（2 字时为 16 em，超出顶沿标示箭）
    const xOf = (n) => padL + ((n - 2) / 12) * plotW;
    const yOf = (g) => padT + (1 - clamp(g / maxPlotGap, 0, 1)) * plotH;

    // 经验安全视窗带（0.16..1.15 em）
    const ySafeTop = yOf(1.15);
    const ySafeBot = yOf(0.16);
    ctx.fillStyle = "rgba(0, 67, 251, 0.20)";
    ctx.fillRect(padL, ySafeTop, plotW, ySafeBot - ySafeTop);

    // 孤岛撕裂警戒线（1.15 em）
    ctx.strokeStyle = "#FF7E70";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, ySafeTop);
    ctx.lineTo(padL + plotW, ySafeTop);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = "#FF9E94";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(W < 420 ? "1.15em 警戒线" : "1.15em 撕裂警戒线（经验）", padL + plotW - 4, ySafeTop - 5);

    // 坐标轴与纵轴刻度
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = "#B8C4E0";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const tick of [0, 1, 2, 4, 6]) {
      const ty = yOf(tick);
      ctx.fillText(`${tick}em`, padL - 8, ty);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.beginPath();
      ctx.moveTo(padL, ty);
      ctx.lineTo(padL + plotW, ty);
      ctx.stroke();
    }

    // 绘 1/(n-1) 双曲线
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = xOf(p.n);
      const py = yOf(p.gap);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = "#6B9BFF";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // 逐点圆标与 X 轴字数标
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    pts.forEach((p) => {
      const px = xOf(p.n);
      const py = yOf(p.gap);
      const isActive = p.n === activeN;
      const isBad = p.gap > 1.15;

      if (isActive) {
        // 当前竖向准线
        ctx.strokeStyle = isBad ? "rgba(255, 126, 112, 0.65)" : "rgba(94, 224, 164, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = isBad ? "#FF7E70" : "#5EE0A4";
      ctx.beginPath();
      ctx.arc(px, py, isActive ? 6.5 : 3.2, 0, Math.PI * 2);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (W >= 420 || p.n % 2 === 0 || isActive) {
        ctx.fillStyle = isActive ? "#FFFFFF" : "#9AA8C7";
        ctx.font = `${isActive ? 700 : 400} 10.5px "Space Mono", monospace`;
        ctx.fillText(`${p.n}字`, px, padT + plotH + 8);
      }
    });

    // 当前点悬浮实测牌
    const ax = xOf(activeN);
    const ay = yOf(activeGap);
    const isBad = activeGap > 1.15;
    const badge = `${activeN}字 → ${activeGap.toFixed(2)}em${activeGap > 6 ? "（爆顶）" : ""}`;
    ctx.font = `700 11.5px "Space Mono", "Noto Sans SC", monospace`;
    const bw = ctx.measureText(badge).width + 16;
    const bx = clamp(ax - bw * 0.5, padL + 4, padL + plotW - bw - 4);
    const by = ay > padT + 30 ? ay - 30 : ay + 12;
    ctx.fillStyle = isBad ? "#C92A1D" : "#0A6E43";
    ctx.fillRect(bx, by, bw, 22);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, bx + bw * 0.5, by + 11.5);

    ctx.restore();
  }

  const ctrl = loop(canvas, drawFrame);
  const redraw = () => {
    dirty = true;
    ctrl.draw();
  };
  window.addEventListener("resize", () => {
    resize();
    redraw();
  });
  return { draw: redraw };
}
