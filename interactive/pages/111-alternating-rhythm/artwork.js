// 111 交替节奏组织 · 2D Canvas 活体海报引擎
// 逐轨还原 111 号原海报的四道满幅交替带（条纹 / 圆点 / 三角 / 双波）+ 第 02 节五通道矩盘 + 第 07 节考题卡缩略渲染

import { clamp, computeCells, computeColorB, POSTER_COLORS, rgbToHex } from "./model.js";

// 根据画布实宽高计算四轨 Y 区间（保持严整呼吸与圆点正圆不变形）
export function getTrackBands(H) {
  const padTop = Math.round(H * 0.035);
  const padBot = Math.round(H * 0.035);
  const usable = H - padTop - padBot;
  const gap = Math.max(6, Math.round(H * 0.025));
  const totalGaps = gap * 3;
  const h1 = Math.round((usable - totalGaps) * 0.255); // 条纹
  const h2 = Math.round((usable - totalGaps) * 0.245); // 圆点
  const h3 = Math.round((usable - totalGaps) * 0.245); // 三角
  const h4 = usable - totalGaps - h1 - h2 - h3;       // 双波
  const y1 = padTop;
  const y2 = y1 + h1 + gap;
  const y3 = y2 + h2 + gap;
  const y4 = y3 + h3 + gap;
  return {
    stripes: { y: y1, h: h1 },
    circles: { y: y2, h: h2 },
    triangles: { y: y3, h: h3 },
    waves: { y: y4, h: h4 },
  };
}

// 4 维乱切压测的确定性伪随机偏移（不闪烁、但视觉明显杂乱）
const CHAOS_TABLE = [
  { scale: 1.24, rot: -0.28, outline: false, hue: "#1F2633", dy: -0.14 },
  { scale: 0.62, rot: 0.34, outline: true, hue: "#FFF3D1", dy: 0.16 },
  { scale: 1.05, rot: 0.18, outline: false, hue: "#2C1810", dy: -0.09 },
  { scale: 0.72, rot: -0.41, outline: true, hue: "#F5E4CC", dy: 0.18 },
  { scale: 1.28, rot: 0.26, outline: false, hue: "#070706", dy: -0.12 },
  { scale: 0.56, rot: -0.22, outline: true, hue: "#E0C9A4", dy: 0.14 },
  { scale: 1.12, rot: 0.37, outline: false, hue: "#1B1917", dy: -0.15 },
  { scale: 0.68, rot: -0.19, outline: true, hue: "#F5E4CC", dy: 0.11 },
];

export function renderHeroLoom(ctx, W, H, state, diag, scanPhase, { still = false } = {}) {
  const { metrics } = diag;
  const { colorA, colorB, cells, beatInfo } = metrics;
  const bands = getTrackBands(H);
  const compact = W < 520;
  const padX = compact ? 10 : 18;
  const innerW = W - padX * 2;

  // 1. 全出血原海报炽朱红底
  ctx.fillStyle = POSTER_COLORS.vermilion;
  ctx.fillRect(0, 0, W, H);

  // 极淡轨间基准细线（仿原海报分栏秩序）
  ctx.strokeStyle = "rgba(7, 7, 6, 0.14)";
  ctx.lineWidth = 1;
  for (const yLine of [
    bands.circles.y - 3,
    bands.triangles.y - 3,
    bands.waves.y - 3,
  ]) {
    ctx.beginPath();
    ctx.moveTo(padX, yLine + 0.5);
    ctx.lineTo(W - padX, yLine + 0.5);
    ctx.stroke();
  }

  // 计算当前扫描游标命中的节拍
  const scanX = padX + scanPhase * innerW;
  let activeScanBeat = -1;
  if (state.scanner && !still) {
    const rel = clamp(scanPhase, 0, 0.9999);
    const hit = cells.find((c) => rel >= c.x0 && rel < c.x1);
    if (hit) activeScanBeat = hit.index;
  }

  // ---------- 轨 01：黑白垂直交替条纹（复刻原海报首带） ----------
  {
    const { y, h } = bands.stripes;
    if (state.mode === "glare") {
      // 24 拍高频密条压测
      const cols = 24;
      const bw = innerW / cols;
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
        ctx.fillRect(padX + i * bw, y, Math.ceil(bw) + 0.4, h);
      }
    } else {
      for (const c of cells) {
        const x = padX + c.x0 * innerW;
        const w = c.w * innerW;
        const ch = state.mode === "chaos" ? CHAOS_TABLE[c.index] : null;
        if (ch && ch.outline) {
          ctx.fillStyle = "rgba(7,7,6,0.12)";
          ctx.fillRect(x, y + h * 0.15, w - 2, h * 0.7);
          ctx.strokeStyle = ch.hue;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 2, y + h * 0.15, Math.max(4, w - 5), h * 0.7);
        } else {
          ctx.fillStyle = ch ? ch.hue : c.type === "A" ? colorA : colorB;
          const topOff = ch ? h * ch.dy * 0.4 : 0;
          ctx.fillRect(x, y + Math.max(0, topOff), w + 0.5, h - Math.abs(topOff));
          // 相邻同态拍之间画极细朱红刻线，清楚标出可点按的独立节拍格
          if (c.index > 0 && state.beats[c.index - 1] === c.type && state.mode === "normal") {
            ctx.fillStyle = "rgba(252, 78, 11, 0.34)";
            ctx.fillRect(Math.round(x), y + 4, 1, h - 8);
          }
        }

        // 当前焦点/键盘选中框
        if (c.index === state.selectedBeat) {
          ctx.save();
          ctx.strokeStyle = c.type === "A" ? POSTER_COLORS.creamB : POSTER_COLORS.inkA;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, Math.max(4, w - 6), h - 6);
          ctx.restore();
        }

        // 顶部极小拍号（够宽时显示，绝不重叠）
        if (w >= 26) {
          ctx.save();
          ctx.font = `500 ${compact ? 10 : 11}px "DM Mono", monospace`;
          ctx.fillStyle =
            c.type === "A"
              ? "rgba(245, 228, 204, 0.72)"
              : state.contrast > 0.45
                ? "rgba(7, 7, 6, 0.72)"
                : "rgba(245, 228, 204, 0.72)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(`${c.index + 1}${c.type}`, x + w * 0.5, y + 5);
          ctx.restore();
        }
      }
    }

    // 若存在 >= 3 连拍撞车，在条纹带底部直接画醒目红米标注括弧
    if (state.mode === "normal" && beatInfo.longRuns.length > 0 && beatInfo.status === "aperiodic") {
      for (const run of beatInfo.longRuns) {
        const x0 = padX + cells[run.start].x0 * innerW + 3;
        const x1 = padX + cells[run.end].x1 * innerW - 3;
        const bw = x1 - x0;
        if (bw > 28) {
          ctx.save();
          ctx.strokeStyle = POSTER_COLORS.creamB;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(x0, y + 2, bw, h - 4);
          ctx.setLineDash([]);
          const tag = `连拍撞车 ${run.len}×${run.type} · 点拍翻转`;
          ctx.font = `700 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
          const tw = ctx.measureText(tag).width + 14;
          const tx = clamp((x0 + x1) * 0.5 - tw * 0.5, padX + 4, W - padX - tw - 4);
          const ty = y + h - (compact ? 21 : 23);
          ctx.fillStyle = POSTER_COLORS.creamB;
          ctx.fillRect(tx, ty, tw, compact ? 18 : 20);
          ctx.fillStyle = POSTER_COLORS.inkA;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tag, tx + tw * 0.5, ty + (compact ? 9 : 10));
          ctx.restore();
        }
      }
    }
  }

  // ---------- 轨 02：黑白正圆交替（严格等比正圆，绝不压扁成椭圆） ----------
  {
    const { y, h } = bands.circles;
    const cy = y + h * 0.5;
    const count = state.mode === "glare" ? 16 : cells.length;
    const maxR = h * 0.43;

    if (state.mode === "glare") {
      const cw = innerW / count;
      const r = Math.min(maxR, cw * 0.44);
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(padX + (i + 0.5) * cw, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
        ctx.fill();
      }
    } else {
      for (const c of cells) {
        const cx = padX + c.cx * innerW;
        const cw = c.w * innerW;
        const ch = state.mode === "chaos" ? CHAOS_TABLE[c.index] : null;
        const baseR = Math.min(maxR, cw * 0.43);
        const r = Math.max(5, baseR * (ch ? ch.scale : 1));
        const pulse = activeScanBeat === c.index ? 1.07 : 1;

        ctx.save();
        ctx.translate(cx, cy + (ch ? h * ch.dy * 0.55 : 0));
        if (ch && ch.outline) {
          ctx.beginPath();
          ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = ch.hue;
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
          ctx.fillStyle = ch ? ch.hue : c.type === "A" ? colorA : colorB;
          ctx.fill();
        }

        // 扫拍点亮外圈
        if (activeScanBeat === c.index) {
          ctx.beginPath();
          ctx.arc(0, 0, r * pulse + 4, 0, Math.PI * 2);
          ctx.strokeStyle = c.type === "A" ? POSTER_COLORS.inkA : POSTER_COLORS.creamB;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // ---------- 轨 03：反相/错相三角轨（沿 X 随 phaseDeg 实时水平平移，180° 精准落回原海报反相咬合） ----------
  {
    const { y, h } = bands.triangles;
    const baseY = y + h * 0.89;
    const topY = y + h * 0.10;
    const triH = baseY - topY;
    const phaseFrac = clamp(state.phaseDeg, 0, 180) / 180; // 0..1 对应偏移半个 2 拍周期（即 1 拍宽度）
    const shiftPx = phaseFrac * (innerW / 8);

    // 轨 02 与轨 03 间的相位对位丝线（错牙时显出歪斜折角，0°/180° 显出垂线咬合）
    if (state.mode === "normal") {
      const cYBot = bands.circles.y + bands.circles.h * 0.94;
      const tYTop = y + h * 0.08;
      const phaseOk = diag.pillars.phase.ok;
      ctx.save();
      ctx.strokeStyle = phaseOk ? "rgba(7, 7, 6, 0.34)" : "rgba(245, 228, 204, 0.82)";
      ctx.lineWidth = phaseOk ? 1 : 1.5;
      ctx.setLineDash(phaseOk ? [2, 3] : [4, 3]);
      for (let i = 0; i < cells.length; i += 2) {
        const cxTop = padX + cells[i].cx * innerW;
        const cxBot = padX + ((cells[i].cx * innerW + shiftPx) % innerW);
        if (Math.abs(cxBot - cxTop) < innerW * 0.5) {
          ctx.beginPath();
          ctx.moveTo(cxTop, cYBot);
          ctx.lineTo(cxBot, tYTop);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, y, innerW, h);
    ctx.clip();

    if (state.mode === "glare") {
      const cols = 16;
      const cw = innerW / cols;
      for (let i = -1; i <= cols; i++) {
        const x0 = padX + i * cw + (shiftPx % (cw * 2));
        ctx.beginPath();
        ctx.moveTo(x0 + cw * 0.5, topY);
        ctx.lineTo(x0 + cw * 0.95, baseY);
        ctx.lineTo(x0 + cw * 0.05, baseY);
        ctx.closePath();
        ctx.fillStyle = Math.abs(i) % 2 === 0 ? colorB : colorA;
        ctx.fill();
      }
    } else {
      // 前后各多画 1 周期确保滑移无缝环绕
      for (const wrapOff of [-innerW, 0, innerW]) {
        for (const c of cells) {
          const cx = padX + c.cx * innerW + shiftPx + wrapOff;
          const halfW = Math.min(c.w * innerW * 0.45, triH * 0.62);
          if (cx + halfW < padX - 8 || cx - halfW > W - padX + 8) continue;

          const ch = state.mode === "chaos" ? CHAOS_TABLE[c.index] : null;
          ctx.save();
          ctx.translate(cx, (topY + baseY) * 0.5 + (ch ? h * ch.dy * 0.45 : 0));
          if (ch) ctx.rotate(ch.rot * 2.2);
          const sc = ch ? ch.scale : 1;
          const hh = triH * 0.5 * sc;
          const hw = halfW * sc;

          ctx.beginPath();
          ctx.moveTo(0, -hh);
          ctx.lineTo(hw, hh);
          ctx.lineTo(-hw, hh);
          ctx.closePath();

          if (ch && ch.outline) {
            ctx.strokeStyle = ch.hue;
            ctx.lineWidth = 2.8;
            ctx.stroke();
          } else {
            ctx.fillStyle = ch ? ch.hue : c.type === "A" ? colorA : colorB;
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }
    ctx.restore();

    // 错牙角度就地提醒签（仅错牙且未处眩光/乱切时）
    if (state.mode === "normal" && !diag.pillars.phase.ok) {
      const tip = `层间错牙 ${Math.round(state.phaseDeg)}° · 横拖此轨或底尺`;
      ctx.save();
      ctx.font = `700 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tip).width + 14;
      const tx = W - padX - tw - 4;
      const ty = y + 3;
      ctx.fillStyle = POSTER_COLORS.inkA;
      ctx.fillRect(tx, ty, tw, compact ? 18 : 20);
      ctx.fillStyle = POSTER_COLORS.creamB;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tip, tx + tw * 0.5, ty + (compact ? 9 : 10));
      ctx.restore();
    }
  }

  // ---------- 轨 04：黑白双波纹带（复刻原海报底部标志性双正弦波） ----------
  {
    const { y, h } = bands.waves;
    const midY = y + h * 0.5;
    const amp = h * 0.17;
    const dutyA = clamp(state.dutyA, 0.2, 0.8);
    const totalThick = h * 0.52;
    const thickA = Math.max(4, totalThick * dutyA);
    const thickB = Math.max(4, totalThick * (1 - dutyA));
    const phaseRad = (clamp(state.phaseDeg, 0, 180) / 180) * Math.PI;
    const waveCycles = state.mode === "glare" ? 12 : 4;

    // 根据拍序是否周期平滑改变波形：断律时在撞车段产生轻微失真折波，规律时如原海报丝滑正弦
    const sampleY = (u) => {
      const baseAngle = u * waveCycles * Math.PI * 2;
      if (state.mode === "chaos") {
        return Math.sin(baseAngle * 1.3 + phaseRad) * amp * 1.15 + Math.cos(baseAngle * 3.1) * amp * 0.55;
      }
      if (!beatInfo.ok && state.mode === "normal") {
        // 用当前格类型轻微调制波形，直觉呈现断拍磕绊
        const cell = cells.find((c) => u >= c.x0 && u <= c.x1) || cells[cells.length - 1];
        const stutter = cell.type === "A" ? 0.55 : -0.85;
        return Math.sin(baseAngle + phaseRad * 0.5) * amp * 0.6 + stutter * amp * 0.45;
      }
      const periodScale = beatInfo.period === 4 ? 0.5 : 1;
      return Math.sin(baseAngle * periodScale - Math.PI * 0.5) * amp;
    };

    const steps = Math.max(96, Math.round(innerW / 6));
    const drawWaveRibbon = (yOffset, thickness, fill, phaseShiftU) => {
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const px = padX + u * innerW;
        const py = midY + yOffset + sampleY((u + phaseShiftU) % 1) - thickness * 0.5;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let s = steps; s >= 0; s--) {
        const u = s / steps;
        const px = padX + u * innerW;
        const py = midY + yOffset + sampleY((u + phaseShiftU) % 1) + thickness * 0.5;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const gapWave = Math.max(1.5, h * 0.03);
    const topOff = -(thickB * 0.5 + gapWave * 0.5);
    const botOff = thickA * 0.5 + gapWave * 0.5;
    // B 波随相位微微错移，180° 时与 A 波贴合最紧致
    const bPhaseShift = ((180 - state.phaseDeg) / 180) * 0.09;
    drawWaveRibbon(topOff, thickA, colorA, 0);
    drawWaveRibbon(botOff, thickB, colorB, bPhaseShift);
  }

  // ---------- 光学扫拍游标（运行态下平顺扫过四轨，reduced-motion 静止不画动光标） ----------
  if (state.scanner && !still) {
    ctx.save();
    ctx.strokeStyle = "rgba(245, 228, 204, 0.88)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scanX, bands.stripes.y);
    ctx.lineTo(scanX, bands.waves.y + bands.waves.h);
    ctx.stroke();

    // 游标顶沿极小菱形读拍点
    ctx.fillStyle = POSTER_COLORS.inkA;
    ctx.beginPath();
    ctx.moveTo(scanX, bands.stripes.y - 5);
    ctx.lineTo(scanX + 5, bands.stripes.y);
    ctx.lineTo(scanX, bands.stripes.y + 5);
    ctx.lineTo(scanX - 5, bands.stripes.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// 命中检测：判断点在四轨画布的哪一拍、哪一轨
export function hitTestHeroCanvas(px, py, W, H, state) {
  const compact = W < 520;
  const padX = compact ? 10 : 18;
  const innerW = W - padX * 2;
  const bands = getTrackBands(H);
  const u = clamp((px - padX) / innerW, 0, 0.9999);
  const cells = computeCells(state.beats, state.dutyA);
  const cell = cells.find((c) => u >= c.x0 && u < c.x1) || cells[cells.length - 1];

  let track = "stripes";
  if (py >= bands.waves.y - 4) track = "waves";
  else if (py >= bands.triangles.y - 4) track = "triangles";
  else if (py >= bands.circles.y - 4) track = "circles";

  return { beatIndex: cell.index, track };
}

// ---------- 第 02 节：五维度通道叠加预览画布 ----------
export function renderChannelMatrix(ctx, W, H, activeSet) {
  ctx.fillStyle = "#121210";
  ctx.fillRect(0, 0, W, H);

  const count = 8;
  const padX = W < 440 ? 12 : 24;
  const innerW = W - padX * 2;
  const useScale = activeSet.has("scale");
  const useValue = activeSet.has("value");
  const useShape = activeSet.has("shape");
  const useOrient = activeSet.has("orient");
  const useSolid = activeSet.has("solid");

  // 计算每格宽
  const weights = Array.from({ length: count }, (_, i) => (useScale ? (i % 2 === 0 ? 1.38 : 0.68) : 1));
  const sumW = weights.reduce((a, b) => a + b, 0);

  let x = padX;
  const cy = H * 0.5;
  const maxDim = H * 0.64;

  for (let i = 0; i < count; i++) {
    const isB = i % 2 === 1;
    const cw = (weights[i] / sumW) * innerW;
    const cx = x + cw * 0.5;

    // 淡灰分格底线
    ctx.strokeStyle = "rgba(245, 228, 204, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, H * 0.12, cw - 4, H * 0.76);

    const size = Math.min(cw * 0.68, maxDim) * (useScale ? (isB ? 0.72 : 1.0) : 0.86);
    const fill = useValue ? (isB ? POSTER_COLORS.creamB : POSTER_COLORS.vermilion) : POSTER_COLORS.creamB;
    const isHollow = useSolid && isB;

    ctx.save();
    ctx.translate(cx, cy);
    if (useOrient && isB) ctx.rotate(Math.PI * 0.25);

    ctx.fillStyle = fill;
    ctx.strokeStyle = fill;
    ctx.lineWidth = Math.max(2.2, size * 0.085);

    const r = size * 0.46;
    if (useShape && isB) {
      // 圆形 B
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      if (isHollow) ctx.stroke();
      else ctx.fill();
    } else if (useOrient && !useShape) {
      // 竖条 / 横条方向交替
      const rw = isB ? size * 0.88 : size * 0.34;
      const rh = isB ? size * 0.34 : size * 0.88;
      if (isHollow) ctx.strokeRect(-rw * 0.5, -rh * 0.5, rw, rh);
      else ctx.fillRect(-rw * 0.5, -rh * 0.5, rw, rh);
    } else {
      // 方块 A（或未开形态时全为方块）
      const s = size * 0.82;
      if (isHollow) ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
      else ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
    }
    ctx.restore();

    // 底部 A / B 拍标
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.fillStyle = "rgba(245, 228, 204, 0.72)";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(isB ? "B" : "A", cx, H - 8);

    x += cw;
  }
}

// ---------- 第 07 节：考题卡同构缩略图（双层：上圆点 + 下三角，单真源复用） ----------
export function renderQuizCanvas(ctx, W, H, optState) {
  const colorA = POSTER_COLORS.inkA;
  const colorB = rgbToHex(computeColorB(optState.contrast));
  const cells = computeCells(optState.beats, optState.dutyA);

  ctx.fillStyle = POSTER_COLORS.vermilion;
  ctx.fillRect(0, 0, W, H);

  const padX = 12;
  const innerW = W - padX * 2;
  const y1 = H * 0.11;
  const h1 = H * 0.24;
  const cy2 = H * 0.53;
  const rMax = H * 0.135;
  const y3Top = H * 0.70;
  const y3Bot = H * 0.91;
  const shiftPx = (optState.phaseDeg / 180) * (innerW / 8);

  // 上：条纹
  for (const c of cells) {
    ctx.fillStyle = c.type === "A" ? colorA : colorB;
    ctx.fillRect(padX + c.x0 * innerW, y1, c.w * innerW + 0.5, h1);
  }
  // 中：正圆
  for (const c of cells) {
    const r = Math.min(rMax, c.w * innerW * 0.42);
    ctx.beginPath();
    ctx.arc(padX + c.cx * innerW, cy2, Math.max(3, r), 0, Math.PI * 2);
    ctx.fillStyle = c.type === "A" ? colorA : colorB;
    ctx.fill();
  }
  // 下：三角（反相）
  ctx.save();
  ctx.beginPath();
  ctx.rect(padX, y3Top - 2, innerW, y3Bot - y3Top + 4);
  ctx.clip();
  for (const off of [-innerW, 0, innerW]) {
    for (const c of cells) {
      const cx = padX + c.cx * innerW + shiftPx + off;
      const hw = Math.min(c.w * innerW * 0.44, (y3Bot - y3Top) * 0.62);
      if (cx + hw < padX - 4 || cx - hw > W - padX + 4) continue;
      ctx.beginPath();
      ctx.moveTo(cx, y3Top);
      ctx.lineTo(cx + hw, y3Bot);
      ctx.lineTo(cx - hw, y3Bot);
      ctx.closePath();
      ctx.fillStyle = c.type === "A" ? colorA : colorB;
      ctx.fill();
    }
  }
  ctx.restore();
}
