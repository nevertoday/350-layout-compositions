// 177 右对齐 左参差 — 开场「右轴咬合与张力配重台」2D Canvas 引擎
// 1:1 承袭 177 原海报午夜蓝 #010F28 × 电光青柠 #C5E224 × 暖象牙 #F2EDE1，所有读数与几何均取自 model.js 单真源。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeLayout } from "./model.js";

const PALETTE = {
  bg: "#010F28",
  bgDeep: "#000B1F",
  grid: "rgba(197, 226, 36, 0.075)",
  lime: "#C5E224",
  limeBright: "#D5EC37",
  limeDash: "rgba(197, 226, 36, 0.56)",
  limeSoft: "rgba(197, 226, 36, 0.16)",
  ivory: "#F2EDE1",
  ivoryMuted: "rgba(242, 237, 225, 0.72)",
  fault: "#FF6B5B",
  faultSoft: "rgba(255, 107, 91, 0.20)",
  faultGlow: "rgba(255, 107, 91, 0.42)",
  okGlow: "rgba(197, 226, 36, 0.34)",
};

export function createHeroStage(canvas, getState, updateState, onLayout) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let width = 880;
  let height = 470;
  let dpr = 1;

  // 开场缓动与交互状态
  let intro = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let hoveredLine = -1;
  let hoveredPart = null; // "orb" | "gate" | "line" | null

  // 回扫视线光轨演播
  const gaze = {
    active: false,
    progress: 0, // 0 .. lines.length
    speed: 1.55,
  };

  // 拖拽状态
  const drag = {
    mode: null, // "orb" | "gate" | null
    pointerId: null,
    startX: 0,
    startY: 0,
    startOrbX: 0,
    startLines: 4,
    moved: false,
    lockedAxis: null, // "h" | "v" | null
  };

  let lastLayout = null;

  function fontSpec(size, mono = false, bold = false) {
    if (mono) return `400 ${size}px "Space Mono", "IBM Plex Sans", monospace`;
    return `${bold ? 700 : 500} ${size}px "Noto Sans SC", "IBM Plex Sans", sans-serif`;
  }

  function measureText(text, size, mono = false) {
    ctx.font = fontSpec(size, mono);
    return ctx.measureText(text).width;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const maxDpr = w < 520 ? 1.5 : 2;
    const nextDpr = pixelRatio(maxDpr);
    if (w !== width || h !== height || nextDpr !== dpr) {
      width = w;
      height = h;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      dirty = true;
    }
  }

  function compute() {
    const state = getState();
    const layout = computeLayout(state, { width, height }, measureText);
    lastLayout = layout;
    if (onLayout) onLayout(layout);
    return layout;
  }

  function drawDashedLine(x1, y1, x2, y2, color, dash = [4, 5], lineWidth = 1) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawTag(x, y, text, bg, fg, alignRight = false) {
    ctx.save();
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    const padX = 7;
    const tw = ctx.measureText(text).width + padX * 2;
    const th = 21;
    const bx = alignRight ? x - tw : x;
    const by = y - th / 2;
    ctx.fillStyle = bg;
    ctx.fillRect(Math.round(bx), Math.round(by), Math.round(tw), th);
    ctx.fillStyle = fg;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, Math.round(bx + padX), Math.round(y + 0.5));
    ctx.restore();
  }

  function drawCounterweight(layout, ease) {
    const { orb, gates, scenario, H } = layout;
    const ok = gates.weight;
    const accent = ok ? PALETTE.lime : PALETTE.fault;
    const r = orb.r * (0.86 + 0.14 * ease);

    // 1) 贯通垂直虚线轴（1:1 复刻原海报贯穿巨圆的垂直虚线）
    const axisTop = Math.round(H * 0.10);
    const axisBot = Math.round(H * 0.92);
    const axisSpan = axisTop + (axisBot - axisTop) * ease;
    drawDashedLine(
      orb.cx,
      axisTop,
      orb.cx,
      axisSpan,
      ok ? PALETTE.limeDash : "rgba(255, 107, 91, 0.62)",
      [3, 5],
      1.2
    );

    // 2) 4 条水平虚线张力桥（向右指向文字参差边缘）
    const targetRight = Math.max(orb.cx + r + 14, layout.colLeft - 14);
    layout.bridgeYs.forEach((by, idx) => {
      const startX = idx === 1 || idx === 2 ? orb.cx + r + 10 : orb.cx + 12;
      const endX = startX + Math.max(0, targetRight - startX) * ease;
      if (endX > startX + 8) {
        drawDashedLine(
          startX,
          by,
          endX,
          by,
          ok ? "rgba(197, 226, 36, 0.45)" : "rgba(255, 107, 91, 0.42)",
          [3, 5],
          1
        );
      }
    });

    // 3) 左侧主体配重图形（依三场景切换；若与文字碰撞则自动降不透明度，确保文字永保高对比可读）
    const colliding = layout.metrics.clearancePx < 8;
    ctx.save();
    if (scenario.massKind === "orb") {
      // 轻柔外光晕
      const grad = ctx.createRadialGradient(orb.cx, orb.cy, r * 0.25, orb.cx, orb.cy, r * 1.48);
      grad.addColorStop(0, ok ? "rgba(197, 226, 36, 0.22)" : "rgba(255, 107, 91, 0.18)");
      grad.addColorStop(1, "rgba(1, 15, 40, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.cx, orb.cy, r * 1.48, 0, Math.PI * 2);
      ctx.fill();

      // 主巨圆（碰撞时半透明呈现，文字始终清晰可读）
      ctx.fillStyle = ok
        ? PALETTE.lime
        : colliding
          ? "rgba(230, 180, 34, 0.26)"
          : "#D8BE20";
      ctx.beginPath();
      ctx.arc(orb.cx, orb.cy, r, 0, Math.PI * 2);
      ctx.fill();

      // 失衡时加警戒虚环，保留原海报青柠气质同时明示问题
      if (!ok) {
        ctx.strokeStyle = PALETTE.fault;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(orb.cx, orb.cy, colliding ? r : r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 原海报精髓：垂直虚线穿透实心青柠圆内部
      drawDashedLine(
        orb.cx,
        orb.cy - r,
        orb.cx,
        orb.cy + r,
        colliding ? "rgba(255, 107, 91, 0.55)" : "rgba(1, 15, 40, 0.48)",
        [3, 4],
        1.2
      );
    } else if (scenario.massKind === "frame") {
      // 展墙建筑摄影框（无五官抽象建筑几何光影）
      const fw = r * 1.78;
      const fh = r * 2.28;
      const fx = orb.cx - fw / 2;
      const fy = orb.cy - fh / 2;
      ctx.fillStyle = "#081C3E";
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, fw, fh);

      // 内部抽象极简建筑光束
      ctx.fillStyle = ok ? "rgba(197, 226, 36, 0.20)" : "rgba(255, 107, 91, 0.20)";
      ctx.beginPath();
      ctx.moveTo(fx + fw * 0.14, fy + fh * 0.86);
      ctx.lineTo(fx + fw * 0.48, fy + fh * 0.20);
      ctx.lineTo(fx + fw * 0.86, fy + fh * 0.86);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = ok ? PALETTE.lime : PALETTE.fault;
      ctx.fillRect(fx + fw * 0.64, fy + fh * 0.18, fw * 0.18, fh * 0.68);
      ctx.fillStyle = PALETTE.ivory;
      ctx.font = `700 10px "Space Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("PLATE 04", fx + 8, fy + 8);
    } else {
      // 财报量级环 + 右向对比刻度
      ctx.strokeStyle = ok ? PALETTE.lime : PALETTE.fault;
      ctx.lineWidth = Math.max(8, r * 0.22);
      ctx.beginPath();
      ctx.arc(orb.cx, orb.cy, r * 0.78, -Math.PI * 0.5, Math.PI * 1.05);
      ctx.stroke();

      ctx.strokeStyle = "rgba(242, 237, 225, 0.22)";
      ctx.lineWidth = Math.max(8, r * 0.22);
      ctx.beginPath();
      ctx.arc(orb.cx, orb.cy, r * 0.78, Math.PI * 1.05, Math.PI * 1.5);
      ctx.stroke();

      ctx.fillStyle = PALETTE.ivory;
      ctx.font = `700 ${Math.max(12, Math.round(r * 0.34))}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+18.4%", orb.cx, orb.cy);
    }

    // 悬停或拖拽手势提示环
    if (hoveredPart === "orb" || drag.mode === "orb") {
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(orb.cx, orb.cy, r + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 球下坐标标签（紧贴配重圆下方，绝不挡字）
    const labelText = ok
      ? `← 横拖配重 ${layout.metrics.orbPct}% →`
      : colliding
        ? `撞字 ${layout.metrics.clearancePx}px · ← 左拖`
        : `${layout.probes.rightEmphasis.text} · ← 左拖`;
    const tagX = clamp(orb.cx - 64, 12, Math.max(12, layout.colLeft - 148));
    drawTag(
      tagX,
      Math.min(H - 22, orb.cy + r + 22),
      labelText,
      ok ? "rgba(10, 31, 66, 0.94)" : PALETTE.fault,
      ok ? PALETTE.lime : "#010F28",
      false
    );
    ctx.restore();
  }

  function drawRightSpineAndText(layout, state, ease) {
    const { spineX, colLeft, colW, lines, enBoxes, gates, fontSize, enFontSize, H } = layout;
    const spineOk = gates.spine;
    const spineColor = spineOk ? PALETTE.lime : PALETTE.fault;

    // 1) 右侧贯通终线轴（┃ 终线统一）
    const topY = Math.round(H * 0.08);
    const botY = Math.round(H * 0.92);
    ctx.save();
    ctx.strokeStyle = spineColor;
    ctx.lineWidth = spineOk ? 2.5 : 1.5;
    if (!spineOk) ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(spineX + 0.5, topY);
    ctx.lineTo(spineX + 0.5, topY + (botY - topY) * ease);
    ctx.stroke();
    ctx.setLineDash([]);

    // 终线顶端实心锚块
    ctx.fillStyle = spineColor;
    ctx.fillRect(spineX - 3, topY, 7, 14);

    // 栏左边界参考淡线
    drawDashedLine(colLeft, topY + 18, colLeft, botY - 22, "rgba(242, 237, 225, 0.14)", [2, 6], 1);

    // 2) 左侧参差轮廓折线（展示左缘跳动与张力）
    if (lines.length >= 2) {
      ctx.beginPath();
      lines.forEach((b, i) => {
        const px = b.xLeft - 7;
        const py = b.y + b.height * 0.52;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = gates.rag && gates.sweep
        ? "rgba(197, 226, 36, 0.52)"
        : "rgba(255, 107, 91, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 每行左侧起点锚圆点（回扫目标点）
      lines.forEach((b) => {
        const px = b.xLeft - 7;
        const py = b.y + b.height * 0.52;
        ctx.fillStyle = gates.rag && gates.sweep ? PALETTE.lime : PALETTE.fault;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3) 若非右对齐，画出每行行尾离右终线的赤红脱线缺口
    if (!spineOk) {
      lines.forEach((b) => {
        const gap = spineX - b.xRight;
        if (gap > 6) {
          ctx.fillStyle = PALETTE.faultSoft;
          ctx.fillRect(b.xRight + 2, b.y + 4, gap - 4, fontSize * 1.05);
        }
      });
    }

    // 4) 绘制逐行真实文字（含两端对齐拉伸视觉呈现与悬停修边提示）
    ctx.font = fontSpec(fontSize, state.scenario === "ledger" && false);
    ctx.textBaseline = "alphabetic";

    lines.forEach((b, idx) => {
      const isHover = hoveredLine === idx;
      const isLastFault = idx === lines.length - 1 && layout.faults.some((f) => f.id === "widow_stub");
      const isOverloadRow = idx >= 6;

      if (isHover) {
        ctx.fillStyle = "rgba(197, 226, 36, 0.14)";
        ctx.fillRect(b.xLeft - 6, b.y + 2, b.drawW + 12, b.height - 4);
      } else if (isLastFault) {
        ctx.fillStyle = PALETTE.faultSoft;
        ctx.fillRect(b.xLeft - 4, b.y + 2, b.drawW + 8, b.height - 4);
      }

      ctx.fillStyle = isOverloadRow
        ? "rgba(255, 198, 188, 0.95)"
        : isLastFault
          ? "#FFB4AA"
          : PALETTE.ivory;

      if (state.align === "justify" && b.stretchRatio > 1.04) {
        // 真实按字符间距撑开至右终线，暴露内部白色裂隙
        const chars = [...b.text];
        const charWidths = chars.map((ch) => ctx.measureText(ch).width);
        const totalCharsW = charWidths.reduce((a, c) => a + c, 0);
        const extraGap = (b.drawW - totalCharsW) / Math.max(1, chars.length - 1);
        let curX = b.xLeft;
        ctx.textAlign = "left";
        chars.forEach((ch, ci) => {
          ctx.fillText(ch, curX, b.baselineY);
          // 标出被强行撑开的刺眼缝隙
          if (ci < chars.length - 1 && extraGap > fontSize * 0.28) {
            ctx.fillStyle = "rgba(255, 107, 91, 0.28)";
            ctx.fillRect(curX + charWidths[ci] + 1, b.y + 5, extraGap - 2, fontSize * 0.92);
            ctx.fillStyle = PALETTE.ivory;
          }
          curX += charWidths[ci] + extraGap;
        });
      } else {
        ctx.textAlign = "left";
        ctx.fillText(b.text, b.xLeft, b.baselineY);
      }
    });

    // 5) 短句时在下方绘出原海报英文等宽副文（与主文共享同一对齐模式）
    if (enBoxes.length > 0) {
      ctx.font = fontSpec(enFontSize, true);
      ctx.fillStyle = "rgba(242, 237, 225, 0.68)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      enBoxes.forEach((eb) => {
        ctx.fillText(eb.text, eb.xLeft, eb.y);
      });
    }

    // 6) 底部可纵拖「行数闸门」手柄（直拖上下增减 2–10 行）
    const lastBox = lines[lines.length - 1];
    if (lastBox) {
      const gateY = Math.min(H - 36, (enBoxes.length ? enBoxes[enBoxes.length - 1].y + enFontSize + 18 : lastBox.y + lastBox.height + 14));
      const gateLeft = spineX - Math.min(colW, 180);
      const gateColor = gates.sweep ? PALETTE.lime : PALETTE.fault;

      drawDashedLine(gateLeft, gateY, spineX, gateY, gateColor, [3, 4], 1.3);
      const handleW = 92;
      const handleH = 22;
      const hx = spineX - handleW;
      const hy = gateY - handleH / 2;

      drawRoundedRect(hx, hy, handleW, handleH, 2);
      ctx.fillStyle = drag.mode === "gate" || hoveredPart === "gate" ? PALETTE.ivory : gateColor;
      ctx.fill();

      ctx.fillStyle = "#010F28";
      ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`↕ ${lines.length} 行`, hx + handleW / 2, gateY + 0.5);

      layout._gateHandle = { x: hx - 8, y: hy - 8, w: handleW + 16, h: handleH + 16, gateY };
    }

    // 7) 顶沿实时几何标尺（窄屏缩略左标，确保与右徽章永不碰头）
    const topLabelY = Math.round(H < 300 ? 15 : Math.max(18, H * 0.055));
    const leftKicker = layout.compact ? `NO.177 · ${layout.scenario.shortLabel}` : layout.scenario.kicker;
    drawTag(
      12,
      topLabelY,
      leftKicker,
      "rgba(10, 29, 64, 0.92)",
      PALETTE.ivoryMuted,
      false
    );
    drawTag(
      spineX - 8,
      topLabelY,
      layout.verdict.tag,
      layout.score === 4 ? PALETTE.lime : PALETTE.fault,
      "#010F28",
      true
    );

    ctx.restore();
  }

  function drawGazeSweep(layout) {
    if (!gaze.active || layout.lines.length < 1) return;
    const { lines } = layout;
    const n = lines.length;
    const p = clamp(gaze.progress, 0, n);
    const activeIdx = Math.min(n - 1, Math.floor(p));
    const frac = p - Math.floor(p);

    ctx.save();
    // 绘出已完成各行的顺读轨道（实线）+ 斜向回扫弧线（虚线）
    for (let i = 0; i < activeIdx; i++) {
      const cur = lines[i];
      const next = lines[i + 1];
      const y1 = cur.y + cur.height * 0.52;
      const y2 = next.y + next.height * 0.52;

      // 顺读实线
      ctx.strokeStyle = "rgba(197, 226, 36, 0.50)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cur.xLeft, y1);
      ctx.lineTo(cur.xRight, y1);
      ctx.stroke();

      // 回扫弧线（下一行左起偏移越大，回扫越显红警折返）
      const delta = Math.abs(next.xLeft - cur.xLeft);
      const rough = delta > 24 || i >= 5;
      ctx.strokeStyle = rough ? "rgba(255, 107, 91, 0.85)" : "rgba(197, 226, 36, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cur.xRight, y1);
      ctx.quadraticCurveTo(
        (cur.xRight + next.xLeft) * 0.5,
        (y1 + y2) * 0.5 + (rough ? 14 : 6),
        next.xLeft,
        y2
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // 长文或大跳动时在左侧起点画出视线修正卡顿双圈
      if (rough) {
        ctx.strokeStyle = PALETTE.fault;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(next.xLeft - 4, y2, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 当前正在行进的光点：前半段顺读至右终线，后半段斜向回扫至下一行起点
    const cur = lines[activeIdx];
    const cy = cur.y + cur.height * 0.52;
    let dotX = cur.xLeft;
    let dotY = cy;
    let isSweepingBack = false;

    if (frac <= 0.68 || activeIdx === n - 1) {
      const f = activeIdx === n - 1 ? frac : frac / 0.68;
      dotX = cur.xLeft + (cur.xRight - cur.xLeft) * f;
      dotY = cy;
      ctx.strokeStyle = PALETTE.limeBright;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cur.xLeft, cy);
      ctx.lineTo(dotX, cy);
      ctx.stroke();
    } else {
      isSweepingBack = true;
      const next = lines[activeIdx + 1];
      const ny = next.y + next.height * 0.52;
      const f = (frac - 0.68) / 0.32;
      const mx = (cur.xRight + next.xLeft) * 0.5;
      const my = (cy + ny) * 0.5 + 10;
      dotX = (1 - f) * (1 - f) * cur.xRight + 2 * (1 - f) * f * mx + f * f * next.xLeft;
      dotY = (1 - f) * (1 - f) * cy + 2 * (1 - f) * f * my + f * f * ny;
    }

    // 发光视线点
    ctx.fillStyle = isSweepingBack && activeIdx >= 5 ? PALETTE.fault : PALETTE.limeBright;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#010F28";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();

    let needDraw = dirty;
    if (still) {
      if (intro < 1) {
        intro = 1;
        needDraw = true;
      }
      if (gaze.active) {
        gaze.active = false;
        needDraw = true;
      }
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.1);
        needDraw = true;
      }
      if (gaze.active) {
        const lineTotal = lastLayout ? lastLayout.lines.length : 4;
        gaze.progress += Math.max(dt, 0.016) * gaze.speed;
        if (gaze.progress >= lineTotal) {
          gaze.active = false;
          gaze.progress = 0;
        }
        needDraw = true;
      }
    }

    if (!needDraw) return;
    dirty = false;

    const ease = 1 - Math.pow(1 - intro, 3);
    const state = getState();
    const layout = compute();

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深海午夜蓝底 + 极微弱工程坐标网
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    const step = width < 520 ? 36 : 48;
    ctx.beginPath();
    for (let x = step; x < width; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = step; y < height; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();

    // 底部极细重力天平刻度（反映重心偏右度）
    const barY = height - 10;
    const barLeft = 18;
    const barRight = layout.spineX;
    const barMid = (barLeft + barRight) / 2;
    ctx.strokeStyle = "rgba(242, 237, 225, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barLeft, barY);
    ctx.lineTo(barRight, barY);
    ctx.moveTo(barMid, barY - 4);
    ctx.lineTo(barMid, barY + 4);
    ctx.stroke();

    const gravX = clamp(
      barMid + (layout.metrics.gravityBiasPct / 50) * ((barRight - barLeft) * 0.45),
      barLeft + 6,
      barRight - 6
    );
    ctx.fillStyle = layout.gates.weight ? PALETTE.lime : PALETTE.fault;
    ctx.beginPath();
    ctx.arc(gravX, barY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    drawCounterweight(layout, ease);
    drawRightSpineAndText(layout, state, ease);
    drawGazeSweep(layout);

    ctx.restore();
  }

  const runner = loop(canvas, render);

  // ---------- 指针与触摸交互（鼠标、触摸、键盘全支持） ----------
  function getLocalPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: clientX - r.left,
      y: clientY - r.top,
    };
  }

  function hitTest(x, y) {
    if (!lastLayout) return { part: null, lineIdx: -1 };
    const { orb, lines, _gateHandle } = lastLayout;
    if (
      _gateHandle &&
      x >= _gateHandle.x &&
      x <= _gateHandle.x + _gateHandle.w &&
      y >= _gateHandle.y &&
      y <= _gateHandle.y + _gateHandle.h
    ) {
      return { part: "gate", lineIdx: -1 };
    }
    const dist = Math.hypot(x - orb.cx, y - orb.cy);
    if (dist <= orb.r + 18) {
      return { part: "orb", lineIdx: -1 };
    }
    for (const b of lines) {
      if (x >= b.xLeft - 14 && x <= lastLayout.spineX + 8 && y >= b.y && y <= b.y + b.height) {
        return { part: "line", lineIdx: b.idx };
      }
    }
    return { part: "orb", lineIdx: -1 };
  }

  function startDrag(clientX, clientY, pointerId = null) {
    const pos = getLocalPos(clientX, clientY);
    const hit = hitTest(pos.x, pos.y);
    const state = getState();
    drag.mode = hit.part === "gate" ? "gate" : "orb";
    drag.pointerId = pointerId;
    drag.startX = pos.x;
    drag.startY = pos.y;
    drag.startOrbX = state.orbX;
    drag.startLines = state.lineCount;
    drag.moved = false;
    drag.lockedAxis = hit.part === "gate" ? "v" : null;
    drag._hitLine = hit.part === "line" ? hit.lineIdx : -1;
  }

  function moveDrag(clientX, clientY, isTouch = false, preventDefaultFn = null) {
    const pos = getLocalPos(clientX, clientY);
    if (!drag.mode) {
      const hit = hitTest(pos.x, pos.y);
      const nextPart = hit.part;
      const nextLine = hit.lineIdx;
      if (nextPart !== hoveredPart || nextLine !== hoveredLine) {
        hoveredPart = nextPart;
        hoveredLine = nextLine;
        canvas.style.cursor =
          nextPart === "gate"
            ? "ns-resize"
            : nextPart === "line"
              ? "pointer"
              : "ew-resize";
        dirty = true;
        runner.draw();
      }
      return;
    }

    const dx = pos.x - drag.startX;
    const dy = pos.y - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    if (isTouch && !drag.lockedAxis && Math.hypot(dx, dy) > 6) {
      drag.lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }

    if (drag.mode === "gate") {
      if (preventDefaultFn) preventDefaultFn();
      const stepPx = Math.max(20, (lastLayout ? lastLayout.lineHeight : 28) * 0.9);
      const nextLines = clamp(Math.round(drag.startLines + dy / stepPx), 1, 10);
      updateState({ lineCount: nextLines });
      return;
    }

    // 触屏竖滑不抢页面滚动，横滑才拖配重圆
    if (isTouch && drag.lockedAxis === "v") {
      return;
    }

    if (preventDefaultFn) preventDefaultFn();
    let nextOrbX = clamp(drag.startOrbX + dx / Math.max(180, width), 0.08, 0.78);
    // 靠近原海报经典配重点（0.18）轻吸附
    if (Math.abs(nextOrbX - 0.18) < 0.012) nextOrbX = 0.18;
    updateState({ orbX: Number(nextOrbX.toFixed(3)) });
  }

  function endDrag() {
    if (drag.mode && !drag.moved && drag._hitLine >= 0) {
      // 单击某一行：循环微调该行分切，手工雕塑左参差轮廓
      const state = getState();
      const nudges = [...(state.nudges || new Array(10).fill(0))];
      const cur = nudges[drag._hitLine] || 0;
      const cycle = [0, -2, 2, -4];
      const nextIdx = (cycle.indexOf(cur) + 1) % cycle.length;
      nudges[drag._hitLine] = cycle[nextIdx];
      updateState({ nudges });
    }
    drag.mode = null;
    drag.pointerId = null;
    drag.lockedAxis = null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触控交由原生 touch 事件，保证 perf.mjs dispatchTouchEvent 100% 流畅响应
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    startDrag(e.clientX, e.clientY, e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    moveDrag(e.clientX, e.clientY, false, null);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (drag.pointerId === e.pointerId) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    endDrag();
  });

  canvas.addEventListener("pointercancel", () => endDrag());
  canvas.addEventListener("pointerleave", () => {
    if (!drag.mode && (hoveredPart || hoveredLine >= 0)) {
      hoveredPart = null;
      hoveredLine = -1;
      dirty = true;
      runner.draw();
    }
  });

  // 触屏监听（同时兼容真机手指滑动与 perf.mjs 的 Input.dispatchTouchEvent）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY, t.identifier);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY, true, () => {
        if (e.cancelable) e.preventDefault();
      });
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => endDrag(), { passive: true });
  canvas.addEventListener("touchcancel", () => endDrag(), { passive: true });

  // 键盘操作支持
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateState({ orbX: Number(clamp(state.orbX - 0.025, 0.08, 0.78).toFixed(3)) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      updateState({ orbX: Number(clamp(state.orbX + 0.025, 0.08, 0.78).toFixed(3)) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateState({ lineCount: clamp(state.lineCount - 1, 1, 10) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      updateState({ lineCount: clamp(state.lineCount + 1, 1, 10) });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerGaze();
    }
  });

  const ro = new ResizeObserver(() => {
    dirty = true;
    runner.draw();
  });
  ro.observe(canvas);

  function triggerGaze() {
    if (reducedMotion.matches) return;
    gaze.active = true;
    gaze.progress = 0;
    dirty = true;
    runner.draw();
  }

  function invalidate() {
    dirty = true;
    runner.draw();
  }

  // 首帧立即算一次，让 DOM 诊单零延迟拿到单真源数据
  resize();
  compute();
  runner.draw();

  return {
    invalidate,
    triggerGaze,
    getLayout: () => lastLayout,
  };
}
