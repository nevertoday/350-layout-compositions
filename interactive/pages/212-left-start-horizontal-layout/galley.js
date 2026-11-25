// 212 横排左起 · 开放钴蓝排字校样画布（2D Canvas，data-perf-drag）
// 支持：直接横拖错位文字行对齐至金色左起轴、横拖右缘金色行宽标尺实时逐字重排、
// 键盘方向键精调、实测眼动回扫弧线动态演进，全面遵守 loop() 与 pixelRatio(2) 省电规矩。

import { loop, pixelRatio } from "../../lib/stage.js";
import { computeGalley, analyzeGalley } from "./model.js";

const SNAP_PX = 9;

export function mountGalley({ canvas, state, onChange }) {
  const ctx = canvas.getContext("2d");
  let W = 900;
  let H = 320;
  let dpr = 1;
  let layout = null;
  let analysis = null;

  // 实时交互状态
  let dragMode = null; // null | "line" | "measure"
  let dragLineIdx = -1;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragAxisLocked = null; // null | "h" | "v"
  let dragOrigOffsetPx = 0;
  let dragOrigMeasure = 28;
  let hoverLineIdx = -1;
  let hoverRail = false;
  let snapFlash = 0; // 0..1 磁吸闪烁
  let sweepPhase = 0; // 眼动光点相位

  function measureText(text, fontSize, weight, family) {
    ctx.save();
    ctx.font = `${weight} ${fontSize}px ${family}`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(2);
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    recompute(false);
  }

  function recompute(notify = true) {
    layout = computeGalley(state, W, H, measureText);
    analysis = analyzeGalley(layout, state);
    if (notify && onChange) onChange(analysis, layout);
  }

  function pointerToCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function hitTest(px, py) {
    if (!layout) return { kind: "none" };
    // 先检测右缘行宽金色标尺
    if (Math.abs(px - layout.rightRailX) <= 18 && py >= layout.topY - 26 && py <= layout.bottomY + 12) {
      return { kind: "measure" };
    }
    // 再检测命中的文字行（带适度垂直容差）
    let bestIdx = -1;
    let bestDist = Infinity;
    for (const line of layout.lines) {
      const d = Math.abs(py - line.midY);
      if (d < Math.max(20, line.h * 0.85) && d < bestDist) {
        bestDist = d;
        bestIdx = line.index;
      }
    }
    if (bestIdx >= 0) return { kind: "line", index: bestIdx };
    // 画布空白处默认控制当前焦点行（兼顾触摸中心拖动与 perf.mjs 测试）
    const fallbackIdx = Math.min(state.activeLine, Math.max(0, layout.lines.length - 1));
    return { kind: "line", index: fallbackIdx };
  }

  function applyLineDrag(dx) {
    if (!layout || dragLineIdx < 0) return;
    // 如果之前在 center/right/left，直接拖动文字行时自动切换为可逐行调节的自定义偏移态
    if (state.align !== "scattered") {
      // 将当前每行的实际偏移固化为 offsets，再移动当前行（保留 dragOrigOffsetPx 防跳变）
      state.offsets = layout.lines.map((l) => l.offsetPx / Math.max(1, layout.usableW));
      state.align = "scattered";
    }
    const line = layout.lines[dragLineIdx];
    const maxSlide = line ? line.maxSlide : layout.usableW * 0.45;
    let nextPx = Math.max(0, Math.min(maxSlide, dragOrigOffsetPx + dx));

    // 靠近左侧金色基准轴轻吸附
    if (nextPx <= SNAP_PX && dx < 0) {
      if ((state.offsets[dragLineIdx] || 0) * layout.usableW > SNAP_PX) {
        snapFlash = 1;
      }
      nextPx = 0;
    }
    state.offsets[dragLineIdx] = nextPx / Math.max(1, layout.usableW);

    // 如果所有行都归零了，自动晋升为纯净 left 模式
    const allZero = layout.lines.every((l, i) => (i === dragLineIdx ? nextPx : (state.offsets[i] || 0) * layout.usableW) <= 1.5);
    if (allZero) {
      state.align = "left";
      state.offsets = state.offsets.map(() => 0);
      snapFlash = 1;
    }
    recompute(true);
    runner.draw();
  }

  function applyMeasureDrag(dx) {
    if (!layout) return;
    const spanW = Math.max(80, layout.maxColW - layout.minColW);
    const deltaChars = (dx / spanW) * 34; // 10..44 = 34 字范围
    const next = Math.round(Math.max(10, Math.min(44, dragOrigMeasure + deltaChars)));
    if (next !== state.measureChars) {
      state.measureChars = next;
      recompute(true);
      runner.draw();
    }
  }

  // ---- Pointer Events (鼠标 + 触控笔) ----
  function onPointerDown(e) {
    if (e.pointerType === "touch") return; // 触屏单独走 touch 事件以便区分纵滚与横拖
    if (e.button !== 0) return;
    const pt = pointerToCanvas(e);
    const hit = hitTest(pt.x, pt.y);
    dragStartX = pt.x;
    dragStartY = pt.y;
    dragAxisLocked = "h";
    if (hit.kind === "measure") {
      dragMode = "measure";
      dragOrigMeasure = state.measureChars;
    } else if (hit.kind === "line") {
      dragMode = "line";
      dragLineIdx = hit.index;
      state.activeLine = hit.index;
      dragOrigOffsetPx = layout.lines[hit.index]?.offsetPx ?? 0;
    }
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    runner.draw();
  }

  function onPointerMove(e) {
    if (e.pointerType === "touch") return;
    const pt = pointerToCanvas(e);
    if (!dragMode) {
      const hit = hitTest(pt.x, pt.y);
      const nextRail = hit.kind === "measure";
      const nextLine = hit.kind === "line" ? hit.index : -1;
      if (nextRail !== hoverRail || nextLine !== hoverLineIdx) {
        hoverRail = nextRail;
        hoverLineIdx = nextLine;
        canvas.style.cursor = nextRail ? "ew-resize" : nextLine >= 0 ? "grab" : "default";
        runner.draw();
      }
      return;
    }
    canvas.style.cursor = dragMode === "measure" ? "ew-resize" : "grabbing";
    const dx = pt.x - dragStartX;
    if (dragMode === "measure") applyMeasureDrag(dx);
    else if (dragMode === "line") applyLineDrag(dx);
  }

  function onPointerUp(e) {
    if (e.pointerType === "touch") return;
    dragMode = null;
    dragAxisLocked = null;
    canvas.style.cursor = hoverRail ? "ew-resize" : hoverLineIdx >= 0 ? "grab" : "default";
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    runner.draw();
  }

  // ---- Touch Events（支持单指横拖不阻断纵向滚屏，且与 perf.mjs touchStart/touchMove 完美对接）----
  function onTouchStart(e) {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const pt = pointerToCanvas(t);
    const hit = hitTest(pt.x, pt.y);
    dragStartX = pt.x;
    dragStartY = pt.y;
    dragAxisLocked = null;
    if (hit.kind === "measure") {
      dragMode = "measure";
      dragOrigMeasure = state.measureChars;
    } else {
      dragMode = "line";
      dragLineIdx = hit.kind === "line" ? hit.index : Math.min(1, (layout?.lines.length || 1) - 1);
      state.activeLine = dragLineIdx;
      dragOrigOffsetPx = layout?.lines[dragLineIdx]?.offsetPx ?? 0;
    }
  }

  function onTouchMove(e) {
    if (!dragMode || !e.touches.length) return;
    const t = e.touches[0];
    const pt = pointerToCanvas(t);
    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;
    if (!dragAxisLocked) {
      if (Math.hypot(dx, dy) < 3) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        dragAxisLocked = "v";
        dragMode = null;
        return; // 让浏览器正常纵向滚屏
      }
      dragAxisLocked = "h";
    }
    if (dragAxisLocked === "h") {
      e.preventDefault();
      if (dragMode === "measure") applyMeasureDrag(dx);
      else if (dragMode === "line") applyLineDrag(dx);
    }
  }

  function onTouchEnd() {
    dragMode = null;
    dragAxisLocked = null;
  }

  // ---- 键盘直操 ----
  function onKeyDown(e) {
    if (!layout) return;
    const total = layout.lines.length;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      state.activeLine = (state.activeLine - 1 + total) % total;
      runner.draw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.activeLine = (state.activeLine + 1) % total;
      runner.draw();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + 左右：调行宽
        state.measureChars = Math.max(10, Math.min(44, state.measureChars + (e.key === "ArrowRight" ? 2 : -2)));
        recompute(true);
        runner.draw();
      } else {
        // 左右：挪动当前文字行
        dragLineIdx = state.activeLine;
        dragOrigOffsetPx = layout.lines[dragLineIdx]?.offsetPx ?? 0;
        applyLineDrag(e.key === "ArrowLeft" ? -14 : 14);
        dragLineIdx = -1;
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // 回车将当前选中行直接推齐左起轴
      if (state.align !== "scattered") {
        state.align = "left";
        state.offsets = state.offsets.map(() => 0);
      } else {
        state.offsets[state.activeLine] = 0;
        if (layout.lines.every((l, i) => (state.offsets[i] || 0) * layout.usableW <= 1.5)) {
          state.align = "left";
        }
      }
      snapFlash = 1;
      recompute(true);
      runner.draw();
    }
  }

  // ---- 2D 绘制（纯净 212 标牌钴蓝 + 暖信号金黄 + 锐利制图虚线）----
  function drawStar(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }

  function render(t, dt, { still }) {
    if (!layout || !analysis) resize();
    if (!layout) return;

    if (!still && dt > 0) {
      snapFlash = Math.max(0, snapFlash - dt * 2.8);
      sweepPhase = (sweepPhase + dt * (analysis.ok ? 0.58 : 0.42)) % Math.max(1, layout.lines.length);
    } else if (still) {
      sweepPhase = 0.65;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 钴蓝底板 + 细微排印刻度网格
    ctx.fillStyle = "#04258A";
    ctx.fillRect(0, 0, W, H);

    // 柔和内框（复刻原海报正确/错误示例的 1px 靛蓝框线）
    ctx.strokeStyle = "rgba(180, 198, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // 顶部字符刻度尺（标出 10 / 20 / 30 / 40 字刻度线）
    const rulerY = layout.topY - 22;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.beginPath();
    ctx.moveTo(layout.spineX, rulerY);
    ctx.lineTo(layout.spineX + layout.maxColW, rulerY);
    ctx.stroke();

    ctx.font = '500 10px "DM Mono", monospace';
    ctx.textBaseline = "bottom";
    for (const mark of [10, 18, 24, 32, 40]) {
      const norm = (mark - 10) / 34;
      const mx = layout.spineX + layout.minColW + norm * (layout.maxColW - layout.minColW);
      if (mx > W - 18) continue;
      ctx.strokeStyle = mark === 24 ? "rgba(246, 202, 12, 0.6)" : "rgba(255, 255, 255, 0.22)";
      ctx.beginPath();
      ctx.moveTo(mx, rulerY - 5);
      ctx.lineTo(mx, rulerY + 4);
      ctx.stroke();
      ctx.fillStyle = mark === 24 ? "#FFDA14" : "rgba(205, 218, 255, 0.72)";
      ctx.fillText(`${mark}字`, mx - 10, rulerY - 7);
    }

    // 舒适行宽带指示（16..34 字的淡金底条）
    const okStartX = layout.spineX + layout.minColW + ((16 - 10) / 34) * (layout.maxColW - layout.minColW);
    const okEndX = layout.spineX + layout.minColW + ((34 - 10) / 34) * (layout.maxColW - layout.minColW);
    ctx.fillStyle = "rgba(246, 202, 12, 0.12)";
    ctx.fillRect(okStartX, rulerY - 3, okEndX - okStartX, 6);

    // 2. 左侧「左起基准轴 START AXIS」（1:1 承袭 212 原海报虚线竖轴 + 金色同心圆起点 + 四角星）
    const spineColor = analysis.scatterPx === 0 ? "#F6CA0C" : "#FF7D66";
    if (snapFlash > 0.02) {
      ctx.fillStyle = `rgba(246, 202, 12, ${snapFlash * 0.26})`;
      ctx.fillRect(layout.spineX - 5, layout.topY - 12, 10, layout.bottomY - layout.topY + 18);
    }
    ctx.save();
    ctx.strokeStyle = spineColor;
    ctx.lineWidth = analysis.scatterPx === 0 ? 1.8 : 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(layout.spineX, layout.topY - 10);
    ctx.lineTo(layout.spineX, layout.bottomY);
    ctx.stroke();
    ctx.restore();

    // 基准轴顶部同心金点 + 四角星
    ctx.strokeStyle = spineColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(layout.spineX, rulerY, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = spineColor;
    ctx.beginPath();
    ctx.arc(layout.spineX, rulerY, 3.2, 0, Math.PI * 2);
    ctx.fill();
    drawStar(layout.spineX - 11, rulerY - 8, 4.5);

    ctx.font = '600 10px "Outfit", "Noto Sans SC", sans-serif';
    ctx.fillStyle = spineColor;
    ctx.textBaseline = "bottom";
    ctx.fillText("起点轴 X=0", layout.spineX + 11, rulerY - 4);

    // 3. 右缘可拖动金色「行宽标尺」
    const railColor =
      state.measureChars > 36 || state.measureChars < 14
        ? "#FF7D66"
        : hoverRail || dragMode === "measure"
          ? "#FFE55C"
          : "rgba(246, 202, 12, 0.85)";
    ctx.save();
    ctx.strokeStyle = railColor;
    ctx.lineWidth = hoverRail || dragMode === "measure" ? 2.2 : 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(layout.rightRailX, rulerY);
    ctx.lineTo(layout.rightRailX, layout.bottomY);
    ctx.stroke();
    ctx.restore();

    // 右缘拖柄标牌
    const pillW = layout.compact ? 64 : 78;
    const pillH = 20;
    const pillX = Math.min(W - pillW - 6, Math.max(layout.spineX + 76, layout.rightRailX - pillW / 2));
    const pillY = layout.bottomY - 8;
    ctx.fillStyle = dragMode === "measure" ? "#FFDA14" : "#0B35B5";
    ctx.strokeStyle = railColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.strokeRect(pillX, pillY, pillW, pillH);
    ctx.fillStyle = dragMode === "measure" ? "#04164D" : "#FFFFFF";
    ctx.font = '500 10.5px "DM Mono", "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`↔ ${state.measureChars}字`, pillX + pillW / 2, pillY + pillH / 2 + 0.5);
    ctx.textAlign = "left";

    // 4. 标题下方原海报同款金色虚线分割杠
    const headLine = layout.lines[0];
    if (headLine) {
      ctx.save();
      ctx.strokeStyle = analysis.scatterPx === 0 ? "rgba(246, 202, 12, 0.72)" : "rgba(180, 198, 255, 0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(layout.spineX, layout.headingRuleY);
      ctx.lineTo(layout.rightRailX, layout.headingRuleY);
      ctx.stroke();
      ctx.restore();
    }

    // 5. 眼动回扫弧线层（在文字下层轻描，再在最上层画活跃光点）
    if (state.showFlow) {
      for (const sw of layout.sweeps) {
        const badSweep = sw.huntErrPx > 4 || sw.lineSkipRisk || state.measureChars > 36;
        const ctrlX = (sw.fromX + sw.toX) * 0.5;
        const lift = Math.max(8, Math.min(18, (sw.toY - sw.fromY) * 0.42));
        const ctrlY = (sw.fromY + sw.toY) * 0.5 + (badSweep ? lift * 0.55 : -lift * 0.15);

        ctx.save();
        ctx.strokeStyle = badSweep ? "rgba(255, 125, 102, 0.52)" : "rgba(92, 224, 184, 0.48)";
        ctx.lineWidth = badSweep ? 1.4 : 1.25;
        ctx.setLineDash(badSweep ? [5, 4] : [2, 3]);
        ctx.beginPath();
        ctx.moveTo(sw.fromX + 4, sw.fromY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, sw.toX - 4, sw.toY);
        ctx.stroke();
        ctx.restore();

        // 错位回扫落点画出折返找行小圆圈（回扫偏离落点环）
        if (badSweep && sw.huntErrPx > 4) {
          ctx.strokeStyle = "rgba(255, 125, 102, 0.85)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sw.toX - 4, sw.toY, 4.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 6. 绘制每一行真实排印文字、左偏离量尺与交互高光
    for (const line of layout.lines) {
      const offPx = Math.round(line.x - layout.spineX);
      const isOff = Math.abs(offPx) > 4;
      const isHover = hoverLineIdx === line.index;
      const isActive = state.activeLine === line.index || (dragMode === "line" && dragLineIdx === line.index);

      // 选中/悬停行轻底衬
      if (isActive || isHover) {
        ctx.fillStyle = dragMode === "line" && dragLineIdx === line.index
          ? "rgba(246, 202, 12, 0.16)"
          : "rgba(255, 255, 255, 0.06)";
        ctx.fillRect(line.x - 6, line.y - 3, line.w + 14, line.h + 6);
      }

      // 偏离基准轴时的水平偏差桥线 + 像素标牌
      if (isOff) {
        ctx.save();
        ctx.strokeStyle = "#FF7D66";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(layout.spineX, line.midY);
        ctx.lineTo(line.x - 6, line.midY);
        ctx.stroke();

        // 小箭头指向左起轴提示可向左推齐
        if (offPx >= 18) {
          ctx.beginPath();
          ctx.moveTo(layout.spineX + 6, line.midY - 3);
          ctx.lineTo(layout.spineX + 1.5, line.midY);
          ctx.lineTo(layout.spineX + 6, line.midY + 3);
          ctx.stroke();
        }
        ctx.restore();

        if (offPx >= 52 && !layout.compact) {
          ctx.font = '500 10px "DM Mono", monospace';
          ctx.fillStyle = "#FFB4A6";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(`+${offPx}px`, layout.spineX + offPx * 0.5, line.midY - 4);
          ctx.textAlign = "left";
        }
      } else if (line.kind === "heading") {
        // 原海报「正确示例」主标左侧标志性实心金圆点
        ctx.fillStyle = "#F6CA0C";
        ctx.beginPath();
        ctx.arc(layout.spineX - 11, line.midY, 4.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 齐左小金刻度
        ctx.fillStyle = "rgba(246, 202, 12, 0.78)";
        ctx.fillRect(layout.spineX - 5, line.midY - 1, 4, 2);
      }

      // 左侧双点拖拽小记号（提示每一行都可直接横拖）
      ctx.fillStyle = isActive || isHover ? "#FFDA14" : "rgba(197, 209, 250, 0.42)";
      ctx.fillRect(line.x - 4, line.midY - 4, 2, 2);
      ctx.fillRect(line.x - 4, line.midY + 2, 2, 2);

      // 真实文字本体（错位态淡化靛灰呼应原海报错误示例；对齐态高亮纯白）
      ctx.font = `${line.weight} ${line.fontSize}px ${line.family}`;
      ctx.textBaseline = "top";
      if (line.kind === "heading") {
        ctx.fillStyle = isOff ? "#B8C4F2" : "#FFFFFF";
      } else if (line.kind === "body") {
        ctx.fillStyle = isOff ? "#9BA9DF" : "#F3F6FF";
      } else {
        ctx.fillStyle = isOff ? "#8A99D4" : "#C9D6FF";
      }
      ctx.fillText(line.text, line.x, line.y);
    }

    // 7. 活跃眼动扫读光点（展示水平左→右逐字推进与换行回扫）
    if (state.showFlow && layout.lines.length > 0) {
      const lineIdx = Math.floor(sweepPhase) % layout.lines.length;
      const frac = sweepPhase - Math.floor(sweepPhase);
      const cur = layout.lines[lineIdx];
      const next = layout.lines[(lineIdx + 1) % layout.lines.length];

      let gx = cur.x;
      let gy = cur.midY;
      let isSweepingBack = false;

      if (frac < 0.78) {
        // 水平左→右扫读
        const p = frac / 0.78;
        gx = cur.x + cur.w * p;
        gy = cur.midY;
        // 画出水平已扫轨迹亮条
        ctx.strokeStyle = analysis.ok ? "rgba(246, 202, 12, 0.85)" : "rgba(255, 190, 120, 0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cur.x, cur.y + cur.h + 2);
        ctx.lineTo(gx, cur.y + cur.h + 2);
        ctx.stroke();
      } else {
        // 换行回扫弧线跃迁
        isSweepingBack = true;
        const p = (frac - 0.78) / 0.22;
        const sx = cur.endX;
        const sy = cur.midY;
        const ex = next.x;
        const ey = next.midY;
        const cx = (sx + ex) * 0.5;
        const cy = (sy + ey) * 0.5 + (analysis.ok ? -4 : 10);
        gx = (1 - p) * (1 - p) * sx + 2 * (1 - p) * p * cx + p * p * ex;
        gy = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * cy + p * p * ey;
      }

      ctx.fillStyle = isSweepingBack
        ? analysis.ok
          ? "#5CE0B8"
          : "#FF7D66"
        : "#FFDA14";
      ctx.beginPath();
      ctx.arc(gx, gy, isSweepingBack ? 4.2 : 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(gx, gy, isSweepingBack ? 7.5 : 6.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 8. 画布底沿极简操作与状态注脚
    ctx.font = '500 10.5px "DM Mono", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(205, 219, 255, 0.85)";
    const footLeft = layout.compact
      ? "横拖任意行推齐左轴 · 拖右尺改行宽"
      : "横拖任意文字行推齐至金色左轴 · 拖右缘「↔ 行宽」标尺重排 · 方向键 ↑↓ 选行 / ←→ 挪位";
    ctx.fillText(footLeft, layout.spineX, H - 9);

    ctx.restore();
  }

  const runner = loop(canvas, render);

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);
  canvas.addEventListener("keydown", onKeyDown);

  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(canvas);

  resize();
  runner.draw();

  return {
    sync() {
      recompute(true);
      runner.draw();
    },
    getAnalysis() {
      return analysis;
    },
    getLayout() {
      return layout;
    },
  };
}
