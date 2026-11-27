// 348 活体四象限决策工作台 2D Canvas 引擎
// 1:1 转译原海报皇家钴蓝 (#003A9F / #0043AE) × 信号明黄 (#F9CB15) × 0px 锐白四格坐标系
// 支持：画布中轴横拖改门槛（标 data-perf-drag）、直拖议题筹码跨象限、直点四格开关黄亮、点错态直修、Space 5 秒扫视验真

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  QUADRANTS,
  SPLIT_MIN,
  SPLIT_MAX,
  SNAP_CENTER,
  SNAP_RADIUS,
  evaluate,
} from "./model.js";

const COLOR = {
  cobaltBg: "#003A9F",
  cobaltDeep: "#002B7A",
  cobaltCard: "#0043AE",
  cobaltCardHover: "#054EC2",
  yellow: "#F9CB15",
  yellowSoft: "#FDE068",
  white: "#FCFCFC",
  ice: "#D6E4FF",
  ink: "#0A1428",
  inkSub: "#1D2C4A",
  err: "#FF6B6B",
  errBg: "#9C1C26",
  ok: "#5CE6A0",
  okBg: "#0B5C3B",
};

const FONT_SANS = '"Noto Sans SC", "IBM Plex Sans", sans-serif';
const FONT_EN = '"IBM Plex Sans", "Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", "Noto Sans SC", monospace';
const FONT_DISP = '"Bebas Neue", "IBM Plex Sans", sans-serif';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function easeOutCubic(x) {
  const t = clamp(x, 0, 1);
  return 1 - (1 - t) ** 3;
}

// 绘制原海报 4 枚精简几何线绘象限图标（0 细节冗余，严格对齐海报语言）
function drawQuadrantIcon(ctx, type, cx, cy, r, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";

  if (type === "ribbon") {
    // 原海报左上：书签旗帜
    const w = r * 1.25;
    const h = r * 1.65;
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + w, y0);
    ctx.lineTo(x0 + w, y0 + h);
    ctx.lineTo(cx, y0 + h - r * 0.48);
    ctx.lineTo(x0, y0 + h);
    ctx.closePath();
    ctx.stroke();
  } else if (type === "target") {
    // 原海报右上：聚焦靶环（四向短刻度 + 圆心点）
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    const t0 = r * 0.52;
    const t1 = r * 1.08;
    ctx.beginPath();
    ctx.moveTo(cx, cy - t1);
    ctx.lineTo(cx, cy - t0);
    ctx.moveTo(cx, cy + t0);
    ctx.lineTo(cx, cy + t1);
    ctx.moveTo(cx - t1, cy);
    ctx.lineTo(cx - t0, cy);
    ctx.moveTo(cx + t0, cy);
    ctx.lineTo(cx + t1, cy);
    ctx.stroke();
  } else if (type === "ban") {
    // 原海报左下：斜杠圆圈（减少干预）
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    const d = r * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - d, cy - d);
    ctx.lineTo(cx + d, cy + d);
    ctx.stroke();
  } else {
    // 原海报右下：闪电折线（快速应对）
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.14, cy - r * 0.92);
    ctx.lineTo(cx - r * 0.56, cy + r * 0.08);
    ctx.lineTo(cx + r * 0.02, cy + r * 0.08);
    ctx.lineTo(cx - r * 0.18, cy + r * 0.92);
    ctx.lineTo(cx + r * 0.58, cy - r * 0.12);
    ctx.lineTo(cx - r * 0.02, cy - r * 0.12);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

// 文本按真实像素宽度折行（带量化缓存，避免每帧重复逐字 measureText）
const wrapCache = new Map();
function wrapLines(ctx, text, maxW, maxLines) {
  if (maxW <= 16) return [];
  const qW = Math.max(16, Math.floor(maxW / 4) * 4);
  const key = `${ctx.font}|${qW}|${maxLines}|${text}`;
  const cached = wrapCache.get(key);
  if (cached) return cached;

  const lines = [];
  let cur = "";
  for (const ch of text) {
    const next = cur + ch;
    if (ctx.measureText(next).width > qW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && lines.join("").length < text.length) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + "…").width > qW) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + "…";
  }
  if (wrapCache.size > 400) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

export function createMatrixStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let width = 960;
  let height = 560;
  let compact = false;
  let dirty = true;

  // 实时交互命中区（每次绘制更新，确保视觉与交互同源）
  const hits = {
    plot: { x: 0, y: 0, w: 0, h: 0 },
    quads: {},
    chips: [],
    axisFixBtn: null,
    densityFixBtn: null,
    splitXLine: 0,
  };

  let hoverQuad = null;
  let hoverChipId = null;
  let dragMode = null; // null | "axis" | "chip"
  let dragChipId = null;
  let dragStartPt = null;
  let dragMoved = false;
  let dragStartSplitX = state.splitX;
  let intro = reducedMotion.matches ? 1 : 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    width = rect.width;
    height = rect.height;
    compact = width < 560;
    // 遵循 GUIDE.md：手机端像素比封顶 1.5，大幅降低软件渲染填充成本同时保持高清锐度
    const dpr = pixelRatio(compact ? 1.5 : 2);
    const cw = Math.round(width * dpr);
    const ch = Math.round(height * dpr);
    let changed = false;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
      changed = true;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return changed;
  }

  function computeLayout() {
    // 为顶部遥测行 + 轴端方向标留出清晰双轨，永不撞车重叠
    const padTop = compact ? 58 : 62;
    const padBottom = compact ? 44 : 48;
    const padSide = compact ? 36 : 64;
    const plotX = padSide;
    const plotY = padTop;
    const plotW = Math.max(180, width - padSide * 2);
    const plotH = Math.max(180, height - padTop - padBottom);
    const gap = compact ? 10 : 14;

    const splitPxX = plotX + plotW * state.splitX;
    const splitPxY = plotY + plotH * state.splitY;

    const tl = {
      x: plotX,
      y: plotY,
      w: Math.max(24, splitPxX - plotX - gap / 2),
      h: Math.max(24, splitPxY - plotY - gap / 2),
    };
    const tr = {
      x: splitPxX + gap / 2,
      y: plotY,
      w: Math.max(24, plotX + plotW - (splitPxX + gap / 2)),
      h: tl.h,
    };
    const bl = {
      x: plotX,
      y: splitPxY + gap / 2,
      w: tl.w,
      h: Math.max(24, plotY + plotH - (splitPxY + gap / 2)),
    };
    const br = {
      x: tr.x,
      y: bl.y,
      w: tr.w,
      h: bl.h,
    };

    return {
      plot: { x: plotX, y: plotY, w: plotW, h: plotH },
      gap,
      splitPxX,
      splitPxY,
      quads: { tl, tr, bl, br },
    };
  }

  function drawArrow(x1, y1, x2, y2, color, lw = 1.75) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = compact ? 7 : 8.5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - len * Math.cos(ang - 0.48), y2 - len * Math.sin(ang - 0.48));
    ctx.lineTo(x2 - len * Math.cos(ang + 0.48), y2 - len * Math.sin(ang + 0.48));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawVerticalText(text, x, cy, fontSize, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `700 ${fontSize}px ${FONT_SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const chars = [...text];
    const step = fontSize * 1.15;
    const startY = cy - ((chars.length - 1) * step) / 2;
    chars.forEach((ch, idx) => {
      ctx.fillText(ch, x, startY + idx * step);
    });
    ctx.restore();
  }

  function draw(t, dt, { still } = { still: false }) {
    const resized = resize();
    if (resized) dirty = true;

    const animating = (!still && intro < 1) || state.scanActive;
    if (!dirty && !animating) return;
    dirty = false;

    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.2);
    }

    if (state.scanActive) {
      if (still) {
        state.scanElapsed = 5;
        state.scanActive = false;
      } else {
        state.scanElapsed += dt;
        if (state.scanElapsed >= 5.15) {
          state.scanActive = false;
          state.scanElapsed = 0;
          onChange("scan-end");
        }
      }
    }

    const ev = evaluate(state);
    const lay = computeLayout();
    hits.plot = lay.plot;
    hits.quads = lay.quads;
    hits.splitXLine = lay.splitPxX;
    hits.chips = [];
    hits.axisFixBtn = null;
    hits.densityFixBtn = null;

    const reveal = easeOutCubic(intro);

    // 1. 蓝图钴蓝底场 + 单路径合批工程网格（1 次 stroke 替代 40 次）
    ctx.fillStyle = COLOR.cobaltBg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(252,252,252,0.065)";
    ctx.lineWidth = 1;
    const gridStep = compact ? 30 : 38;
    ctx.beginPath();
    for (let gx = Math.floor(lay.plot.x % gridStep); gx < width; gx += gridStep) {
      ctx.moveTo(gx + 0.5, 0);
      ctx.lineTo(gx + 0.5, height);
    }
    for (let gy = Math.floor(lay.plot.y % gridStep); gy < height; gy += gridStep) {
      ctx.moveTo(0, gy + 0.5);
      ctx.lineTo(width, gy + 0.5);
    }
    ctx.stroke();
    ctx.restore();

    // 2. 顶部极简蓝图状态条（第 1 轨：y = 6..24，与下方第 2 轨轴标彻底分离）
    ctx.save();
    ctx.font = `500 ${compact ? 10 : 11.5}px ${FONT_MONO}`;
    ctx.fillStyle = COLOR.ice;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const metaText = compact
      ? `2×2 · ${ev.leftPct}:${ev.rightPct} · 亮 ${ev.focusCount}/4`
      : `2×2 MATRIX SLIDE  ·  SPLIT ${ev.leftPct}:${ev.rightPct}  ·  FOCUS ${ev.focusCount}/4  ·  ${ev.chars.total} CHARS`;
    ctx.fillText(metaText, lay.plot.x, 15);

    const badgeTxt = `${ev.score}/5 · ${ev.verdictTag}`;
    ctx.font = `700 ${compact ? 10 : 11.5}px ${FONT_SANS}`;
    const bw = ctx.measureText(badgeTxt).width + 16;
    const bx = lay.plot.x + lay.plot.w - bw;
    ctx.fillStyle = ev.ok ? COLOR.okBg : COLOR.errBg;
    ctx.fillRect(bx, 5, bw, 20);
    ctx.strokeStyle = ev.ok ? COLOR.ok : COLOR.err;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, 5.5, bw - 1, 19);
    ctx.fillStyle = COLOR.white;
    ctx.textAlign = "center";
    ctx.fillText(badgeTxt, bx + bw / 2, 15.5);
    ctx.restore();

    // 3. 绘制 4 个 0px 锐白边框象限卡
    const sc = ev.scenario;
    for (const qKey of QUADRANTS) {
      const r = lay.quads[qKey];
      const info = sc.quadrants[qKey];
      const isFocus = state.focus[qKey];
      const isHover = hoverQuad === qKey && !hoverChipId && dragMode !== "axis";
      const qCount = ev.counts[qKey];
      const isNarrow = r.w < (compact ? 112 : 170);

      // 入场微缩放动效（保持首帧就清晰可读）
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const scale = 0.96 + 0.04 * reveal;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      // 填充
      ctx.fillStyle = isFocus
        ? isHover
          ? COLOR.yellowSoft
          : COLOR.yellow
        : isHover
          ? COLOR.cobaltCardHover
          : COLOR.cobaltCard;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // 边框：若多格争亮或高亮空区或该格被挤扁，以细警示描边提示，否则纯白 1.8px 锐框
      const cardWarn =
        (isFocus && (ev.focusCount > 1 || ev.focusEmpty)) ||
        (!ev.pillars.quadrant.ok && (r.w / lay.plot.w < 0.34));
      ctx.strokeStyle = cardWarn ? COLOR.err : COLOR.white;
      ctx.lineWidth = cardWarn ? 2.2 : 1.8;
      ctx.strokeRect(r.x + 0.9, r.y + 0.9, r.w - 1.8, r.h - 1.8);

      // 裁剪象限内文
      ctx.beginPath();
      ctx.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.clip();

      const fg = isFocus ? COLOR.ink : COLOR.white;
      const fgSub = isFocus ? COLOR.inkSub : COLOR.ice;
      const padX = isNarrow ? 8 : compact ? 11 : 20;
      const padY = compact ? 10 : 16;

      // 象限右上角：聚焦开关小标 + 议题计数
      if (r.w > 95) {
        ctx.font = `500 ${compact ? 10 : 11}px ${FONT_MONO}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillStyle = isFocus ? "rgba(10,20,40,0.72)" : "rgba(214,228,255,0.78)";
        const tag = isFocus ? `★ 聚焦 · ${qCount}项` : `点此涂黄 · ${qCount}项`;
        ctx.fillText(compact ? `${isFocus ? "★" : "○"} ${qCount}项` : tag, r.x + r.w - padX, r.y + padY);
      }

      // 原海报象限几何图标
      const iconR = compact ? 10 : isNarrow ? 10 : 13;
      drawQuadrantIcon(ctx, info.icon, r.x + padX + iconR, r.y + padY + iconR, iconR, fg, compact ? 1.6 : 1.9);

      // 象限标题
      const titleSize = isNarrow ? (compact ? 13 : 15) : compact ? 15 : 21;
      const titleY = r.y + padY + iconR * 2 + (compact ? 9 : 13);
      ctx.fillStyle = fg;
      ctx.font = `900 ${titleSize}px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(info.title, r.x + padX, titleY, Math.max(20, r.w - padX * 2));

      // 原海报短横线（标题下方标志性细杠）
      const ruleY = titleY + titleSize + (compact ? 6 : 9);
      ctx.fillStyle = fg;
      ctx.fillRect(r.x + padX, ruleY, Math.min(26, r.w - padX * 2), 2);

      // 按 density 绘制文案（单真源！）
      const bodyY = ruleY + (compact ? 7 : 10);
      const availW = Math.max(24, r.w - padX * 2);
      const reserveChipH = compact ? 44 : 58;
      const availH = Math.max(16, r.y + r.h - bodyY - reserveChipH);

      if (state.density === "hollow") {
        ctx.fillStyle = isFocus ? "rgba(156,28,38,0.85)" : "rgba(255,155,155,0.92)";
        ctx.font = `600 ${compact ? 10.5 : 12}px ${FONT_SANS}`;
        const warnLines = wrapLines(ctx, "× 缺少判定标准与策略动作", availW, 2);
        warnLines.forEach((ln, i) => ctx.fillText(ln, r.x + padX, bodyY + i * 16));
      } else if (state.density === "concise") {
        const fs = compact ? 10.5 : isNarrow ? 11.5 : 13;
        const lh = fs * 1.48;
        ctx.font = `500 ${fs}px ${FONT_SANS}`;
        ctx.fillStyle = fgSub;
        const l1 = wrapLines(ctx, `${info.trait} · ${info.detail}`, availW, compact ? 2 : 1);
        l1.forEach((ln, i) => ctx.fillText(ln, r.x + padX, bodyY + i * lh));

        const stratY = bodyY + l1.length * lh + (compact ? 2 : 4);
        if (stratY + fs < r.y + r.h - 24) {
          ctx.font = `700 ${fs}px ${FONT_SANS}`;
          ctx.fillStyle = fg;
          const l2 = wrapLines(ctx, info.strategy, availW, 2);
          l2.forEach((ln, i) => ctx.fillText(ln, r.x + padX, stratY + i * lh));
        }
      } else {
        // 密字报表坏态：真把大段小正文塞满象限，直观感受视觉窒息！
        const fs = compact ? 10 : 11;
        const lh = fs * 1.38;
        const maxLines = Math.max(2, Math.floor((availH + 26) / lh));
        ctx.font = `400 ${fs}px ${FONT_SANS}`;
        ctx.fillStyle = fgSub;
        const lines = wrapLines(ctx, info.dense, availW, maxLines);
        lines.forEach((ln, i) => ctx.fillText(ln, r.x + padX, bodyY + i * lh));
      }

      ctx.restore();
    }

    // 4. 若处于「同义假双轴」，在矩阵上绘制直观的对角线塌陷虚线走廊
    if (state.axisMode === "collinear") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,107,107,0.88)";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(lay.plot.x + 18, lay.plot.y + lay.plot.h - 18);
      ctx.lineTo(lay.plot.x + lay.plot.w - 18, lay.plot.y + 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 正交十字坐标轴 + 四端箭头（原海报核心视觉骨架）
    const axColor = state.showAxisLabels ? COLOR.white : "rgba(255,122,122,0.85)";
    const ext = compact ? 12 : 16;
    // 纵轴（上下双向）
    drawArrow(lay.splitPxX, lay.plot.y + lay.plot.h / 2, lay.splitPxX, lay.plot.y - ext, axColor, 2);
    drawArrow(lay.splitPxX, lay.plot.y + lay.plot.h / 2, lay.splitPxX, lay.plot.y + lay.plot.h + ext, axColor, 2);
    // 横轴（左右双向）
    drawArrow(lay.plot.x + lay.plot.w / 2, lay.splitPxY, lay.plot.x - ext, lay.splitPxY, axColor, 2);
    drawArrow(lay.plot.x + lay.plot.w / 2, lay.splitPxY, lay.plot.x + lay.plot.w + ext, lay.splitPxY, axColor, 2);

    // 可拖动的竖向门槛滑柄（正居于十字中轴上，用户和 perf 测试横拖即触发实时重绘）
    ctx.save();
    const hW = compact ? 22 : 26;
    const hH = compact ? 38 : 44;
    const hx = lay.splitPxX - hW / 2;
    const hy = lay.splitPxY - hH / 2;
    ctx.fillStyle = dragMode === "axis" ? COLOR.yellow : COLOR.cobaltDeep;
    ctx.fillRect(hx, hy, hW, hH);
    ctx.strokeStyle = ev.pillars.quadrant.ok ? COLOR.white : COLOR.err;
    ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hW, hH);
    ctx.fillStyle = dragMode === "axis" ? COLOR.ink : COLOR.yellow;
    ctx.font = `700 ${compact ? 11 : 12}px ${FONT_EN}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", lay.splitPxX, lay.splitPxY - 5);
    ctx.font = `500 ${compact ? 9.5 : 10}px ${FONT_MONO}`;
    ctx.fillStyle = dragMode === "axis" ? COLOR.ink : COLOR.white;
    ctx.fillText(`${ev.leftPct}%`, lay.splitPxX, lay.splitPxY + 9);
    ctx.restore();

    // 6. 四端轴极性标签（原海报：上下横排、左右竖排）
    const activeAxes = state.axisMode === "collinear" ? sc.collinearAxes : sc.axes;
    const poleFont = compact ? 11.5 : 14;
    if (state.showAxisLabels) {
      const poleColor = state.axisMode === "collinear" ? "#FFB3B3" : COLOR.white;
      ctx.save();
      ctx.fillStyle = poleColor;
      ctx.font = `700 ${poleFont}px ${FONT_SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(activeAxes.top, lay.splitPxX, lay.plot.y - ext - 4);
      ctx.textBaseline = "top";
      ctx.fillText(activeAxes.bottom, lay.splitPxX, lay.plot.y + lay.plot.h + ext + 4);
      ctx.restore();

      drawVerticalText(activeAxes.left, lay.plot.x - ext - (compact ? 10 : 20), lay.splitPxY, compact ? 11 : 13.5, poleColor);
      drawVerticalText(activeAxes.right, lay.plot.x + lay.plot.w + ext + (compact ? 10 : 20), lay.splitPxY, compact ? 11 : 13.5, poleColor);
    } else {
      // 缺方向极性时的明确红色警示签（固定在第 2 轨 y = 28..48，与第 1 轨完全错开不撞车）
      const msg = "× 缺少方向极性 · 点此补标";
      ctx.save();
      ctx.font = `700 ${compact ? 10 : 11.5}px ${FONT_SANS}`;
      const mw = ctx.measureText(msg).width + 16;
      const mx = clamp(lay.splitPxX - mw / 2, lay.plot.x, lay.plot.x + lay.plot.w - mw);
      const my = 29;
      ctx.fillStyle = COLOR.errBg;
      ctx.fillRect(mx, my, mw, 19);
      ctx.strokeStyle = COLOR.err;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(mx, my, mw, 19);
      ctx.fillStyle = COLOR.white;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, mx + mw / 2, my + 9.5);
      hits.axisFixBtn = { x: mx, y: my, w: mw, h: 19 };
      ctx.restore();
    }

    // 7. 若处于密字超载或同义双轴，在画布底边绘一枚醒目直修胶囊
    if (state.axisMode === "collinear" || state.density !== "concise") {
      const fixMsg =
        state.axisMode === "collinear"
          ? `× 同义假双轴（${activeAxes.xLabel}×${activeAxes.yLabel}）· 点此切正交`
          : state.density === "dense"
            ? `× 密字 ${ev.chars.total} 字超载 · 点此切精炼三行`
            : "× 空壳缺行动策略 · 点此补回策略";
      ctx.save();
      ctx.font = `700 ${compact ? 10.5 : 11.5}px ${FONT_SANS}`;
      const fw = Math.min(lay.plot.w - 8, ctx.measureText(fixMsg).width + 20);
      const fx = lay.plot.x + (lay.plot.w - fw) / 2;
      const fy = height - 25;
      ctx.fillStyle = COLOR.errBg;
      ctx.fillRect(fx, fy, fw, 21);
      ctx.strokeStyle = COLOR.err;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(fx, fy, fw, 21);
      ctx.fillStyle = COLOR.white;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fixMsg, fx + fw / 2, fy + 10.5, fw - 10);
      hits.densityFixBtn = { x: fx, y: fy, w: fw, h: 21, kind: state.axisMode === "collinear" ? "axis" : "density" };
      ctx.restore();
    }

    // 8. 绘制 6 枚可自由跨象限拖拽的「待决策议题筹码」
    const chipFont = compact ? 10.5 : 12;
    const chipH = compact ? 22 : 26;
    ctx.font = `700 ${chipFont}px ${FONT_SANS}`;
    for (const it of state.items) {
      const qKey = ev.itemQuadrant[it.id];
      const onYellow = state.focus[qKey];
      const isDragging = dragMode === "chip" && dragChipId === it.id;
      const isHover = hoverChipId === it.id;

      const labelW = ctx.measureText(it.label).width;
      const cw = labelW + (compact ? 20 : 26);
      const px = clamp(lay.plot.x + it.x * lay.plot.w, lay.plot.x + cw / 2 + 4, lay.plot.x + lay.plot.w - cw / 2 - 4);
      const py = clamp(lay.plot.y + it.y * lay.plot.h, lay.plot.y + chipH / 2 + 4, lay.plot.y + lay.plot.h - chipH / 2 - 4);

      const rx = px - cw / 2;
      const ry = py - chipH / 2;
      hits.chips.push({ id: it.id, x: rx, y: ry, w: cw, h: chipH });

      ctx.save();
      if (isDragging) {
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
      }
      // 筹码配色根据所处象限底色自动反色，确保超高对比度
      ctx.fillStyle = isDragging
        ? COLOR.white
        : onYellow
          ? COLOR.ink
          : "#002366";
      ctx.fillRect(rx, ry, cw, chipH);

      ctx.strokeStyle = isDragging || isHover ? COLOR.yellow : onYellow ? COLOR.ink : COLOR.yellow;
      ctx.lineWidth = isDragging || isHover ? 2 : 1.4;
      ctx.strokeRect(rx + 0.5, ry + 0.5, cw - 1, chipH - 1);

      // 左侧小小抓手色点
      ctx.fillStyle = isDragging ? COLOR.cobaltBg : COLOR.yellow;
      ctx.fillRect(rx + 5, py - 3, 4, 6);

      ctx.fillStyle = isDragging ? COLOR.ink : COLOR.white;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, rx + 13, py + 0.5);
      ctx.restore();
    }

    // 9. Space 触发的「5 秒会议扫视验真」光束覆盖层
    if (state.scanActive) {
      drawScanOverlay(ctx, lay, ev, state.scanElapsed, compact);
    }
  }

  function drawScanOverlay(ctx, lay, ev, elapsed, isCompact) {
    const p = clamp(elapsed / 5.0, 0, 1);
    const qCenter = (k) => {
      const r = lay.quads[k];
      return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    };

    // 构造真实扫视路径：若 5/5 成立，依次 轴端 → 唯一黄区 → 其余三格对照 → 回到焦点拍板；
    // 若失败，视线在杂乱象限与空区间反复折返迷航
    let stops;
    if (ev.ok) {
      const fq = ev.focusList[0];
      const others = QUADRANTS.filter((q) => q !== fq);
      stops = [
        { x: lay.splitPxX, y: lay.plot.y + 12, label: "1 读坐标轴" },
        { ...qCenter(fq), label: "2 锁黄区焦点" },
        { ...qCenter(others[0]), label: "3 对照其余象限" },
        { ...qCenter(fq), label: "4 拍板执行策略" },
      ];
    } else {
      stops = [
        { ...qCenter("tl"), label: "1 找轴向?" },
        { ...qCenter("br"), label: "2 视线分散" },
        { ...qCenter("tr"), label: "3 密字/争亮" },
        { ...qCenter("bl"), label: "4 焦点迷航" },
      ];
    }

    const totalSegs = stops.length - 1;
    const f = p * totalSegs;
    const segIdx = Math.min(totalSegs - 1, Math.floor(f));
    const segT = f - segIdx;
    const curX = stops[segIdx].x + (stops[segIdx + 1].x - stops[segIdx].x) * segT;
    const curY = stops[segIdx].y + (stops[segIdx + 1].y - stops[segIdx].y) * segT;

    ctx.save();
    // 柔暗遮罩突出光束
    ctx.fillStyle = "rgba(2, 16, 48, 0.38)";
    ctx.fillRect(lay.plot.x, lay.plot.y, lay.plot.w, lay.plot.h);

    const beamColor = ev.ok ? COLOR.ok : COLOR.err;
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 2.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(stops[0].x, stops[0].y);
    for (let i = 1; i <= segIdx; i++) ctx.lineTo(stops[i].x, stops[i].y);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 停驻点标记
    for (let i = 0; i <= segIdx; i++) {
      const st = stops[i];
      ctx.fillStyle = beamColor;
      ctx.beginPath();
      ctx.arc(st.x, st.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLOR.ink;
      ctx.font = `700 10px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), st.x, st.y + 0.5);
    }

    // 当前凝视光斑
    ctx.strokeStyle = COLOR.white;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(curX, curY, 13 + Math.sin(elapsed * 12) * 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // 右下角 5 秒计时仪读数条
    const hudW = isCompact ? 176 : 226;
    const hudH = 32;
    const hx = lay.plot.x + lay.plot.w - hudW - 10;
    const hy = lay.plot.y + 10;
    ctx.fillStyle = "rgba(4, 24, 72, 0.94)";
    ctx.fillRect(hx, hy, hudW, hudH);
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hx, hy, hudW, hudH);
    ctx.fillStyle = COLOR.white;
    ctx.font = `700 ${isCompact ? 11 : 12}px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const statusTxt = ev.ok ? "5 秒扫视 · 焦点清晰" : "5 秒扫视 · 视线迷航";
    ctx.fillText(`${Math.min(5, elapsed).toFixed(1)}s  ${statusTxt}`, hx + 10, hy + hudH / 2);
    ctx.restore();
  }

  // ---------- 指针与触控交互 ----------
  function getCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function hitRect(pt, r) {
    return r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
  }

  function findChipAt(pt) {
    for (let i = hits.chips.length - 1; i >= 0; i--) {
      if (hitRect(pt, hits.chips[i])) return hits.chips[i].id;
    }
    return null;
  }

  function findQuadAt(pt) {
    for (const q of QUADRANTS) {
      if (hitRect(pt, hits.quads[q])) return q;
    }
    return null;
  }

  function beginDrag(pt, pointerType) {
    dragStartPt = pt;
    dragMoved = false;
    dragStartSplitX = state.splitX;

    // 1. 优先命中画布内直修按钮（不进入拖动）
    if (hitRect(pt, hits.axisFixBtn) || hitRect(pt, hits.densityFixBtn)) {
      dragMode = "btn";
      return;
    }

    // 2. 命中议题筹码 → 拖动筹码跨象限
    const chipId = findChipAt(pt);
    if (chipId) {
      dragMode = "chip";
      dragChipId = chipId;
      state.selectedItemId = chipId;
      return;
    }

    // 3. 命中竖向门槛中轴或画布中央区域 → 横拖连续调 X 门槛（触屏/鼠标通用，兼容 perf.mjs 从画布中心左右横拖！）
    const nearAxis = Math.abs(pt.x - hits.splitXLine) <= (pointerType === "touch" ? 36 : 26);
    const inPlot = hitRect(pt, hits.plot);
    if (nearAxis || inPlot) {
      dragMode = "axis";
    }
  }

  function moveDrag(pt) {
    if (!dragMode || dragMode === "btn") return;
    const dx = pt.x - dragStartPt.x;
    const dy = pt.y - dragStartPt.y;
    if (Math.hypot(dx, dy) > 5) dragMoved = true;
    if (!dragMoved) return;

    if (dragMode === "chip" && dragChipId) {
      const it = state.items.find((x) => x.id === dragChipId);
      if (it && hits.plot.w > 0 && hits.plot.h > 0) {
        it.x = clamp((pt.x - hits.plot.x) / hits.plot.w, 0.08, 0.92);
        it.y = clamp((pt.y - hits.plot.y) / hits.plot.h, 0.08, 0.92);
        onChange("chip-drag");
      }
      return;
    }

    if (dragMode === "axis" && hits.plot.w > 0) {
      let next = clamp(dragStartSplitX + dx / hits.plot.w, SPLIT_MIN, SPLIT_MAX);
      if (Math.abs(next - SNAP_CENTER) < SNAP_RADIUS) next = SNAP_CENTER;
      if (Math.abs(next - state.splitX) > 0.001) {
        state.splitX = +next.toFixed(3);
        dirty = true;
        onChange("axis-drag");
      } else {
        dirty = true;
      }
    }
  }

  function endDrag(pt) {
    if (!dragMode) return;
    if (!dragMoved && pt) {
      // 点击处理
      if (hitRect(pt, hits.axisFixBtn)) {
        state.showAxisLabels = true;
        onChange("fix-labels");
      } else if (hitRect(pt, hits.densityFixBtn)) {
        if (hits.densityFixBtn.kind === "axis") {
          state.axisMode = "orthogonal";
          state.showAxisLabels = true;
          const sc = evaluate(state).scenario;
          state.items = sc.items.map((it) => ({ id: it.id, label: it.label, x: it.orthoX, y: it.orthoY }));
          onChange("fix-axis");
        } else {
          state.density = "concise";
          onChange("fix-density");
        }
      } else {
        const q = findQuadAt(pt);
        if (q && !findChipAt(pt)) {
          state.focus[q] = !state.focus[q];
          onChange("toggle-quad");
        }
      }
    }
    dragMode = null;
    dragChipId = null;
    dragMoved = false;
  }

  // Pointer events（桌面 + 现代触控）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触控交给下方原生 touch 监听，确保页面竖向滚动顺滑且兼容 CDP Input.dispatchTouchEvent
    const pt = getCanvasPoint(e.clientX, e.clientY);
    beginDrag(pt, e.pointerType);
    if (dragMode === "chip" || dragMode === "axis") {
      canvas.setPointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (dragMode) {
      moveDrag(pt);
    } else {
      const ch = findChipAt(pt);
      const q = findQuadAt(pt);
      const onBtn = hitRect(pt, hits.axisFixBtn) || hitRect(pt, hits.densityFixBtn);
      const nearAxis = Math.abs(pt.x - hits.splitXLine) <= 22;
      if (hoverChipId !== ch || hoverQuad !== q) {
        hoverChipId = ch;
        hoverQuad = q;
        dirty = true;
      }
      canvas.style.cursor = onBtn
        ? "pointer"
        : ch
          ? "grab"
          : nearAxis
            ? "ew-resize"
            : q
              ? "pointer"
              : "default";
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    const pt = getCanvasPoint(e.clientX, e.clientY);
    endDrag(pt);
    dirty = true;
  });

  canvas.addEventListener("pointerleave", () => {
    if (hoverChipId !== null || hoverQuad !== null) {
      hoverChipId = null;
      hoverQuad = null;
      dirty = true;
    }
  });

  // Touch events：仅在横向意图或拖动筹码时接管，竖向手势放行页面滚动（GUIDE.md 规矩！）
  let touchStart = null;
  let touchAxisLock = null; // null | "h" | "v"
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      const pt = getCanvasPoint(t0.clientX, t0.clientY);
      touchStart = pt;
      touchAxisLock = null;
      beginDrag(pt, "touch");
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !touchStart) return;
      const t0 = e.touches[0];
      const pt = getCanvasPoint(t0.clientX, t0.clientY);
      const dx = Math.abs(pt.x - touchStart.x);
      const dy = Math.abs(pt.y - touchStart.y);
      if (!touchAxisLock && (dx > 4 || dy > 4)) {
        touchAxisLock = dragMode === "chip" || dx >= dy ? "h" : "v";
      }
      if (touchAxisLock === "h") {
        if (e.cancelable) e.preventDefault();
        moveDrag(pt);
      } else if (touchAxisLock === "v") {
        dragMode = null;
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", (e) => {
    const t0 = e.changedTouches[0];
    const pt = t0 ? getCanvasPoint(t0.clientX, t0.clientY) : touchStart;
    endDrag(pt);
    touchStart = null;
    touchAxisLock = null;
  });

  // 键盘操作画布：←/→ 微调 X 门槛，1–4 切换四象限涂黄，Space 放飞 5 秒扫视
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.splitX = +clamp(state.splitX - 0.04, SPLIT_MIN, SPLIT_MAX).toFixed(3);
      onChange("kbd-split");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.splitX = +clamp(state.splitX + 0.04, SPLIT_MIN, SPLIT_MAX).toFixed(3);
      onChange("kbd-split");
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      e.preventDefault();
      const map = { 1: "tl", 2: "tr", 3: "bl", 4: "br" };
      const q = map[e.key];
      state.focus[q] = !state.focus[q];
      onChange("kbd-focus");
    } else if (e.key === " ") {
      e.preventDefault();
      state.scanActive = true;
      state.scanElapsed = 0;
      onChange("kbd-scan");
    }
  });

  const controller = loop(canvas, draw);
  const ro = new ResizeObserver(() => {
    dirty = true;
    controller.draw();
  });
  ro.observe(canvas);

  return {
    draw: () => {
      dirty = true;
      controller.draw();
    },
    destroy: () => ro.disconnect(),
  };
}
