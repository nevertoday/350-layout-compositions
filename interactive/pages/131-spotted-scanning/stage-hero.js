// 131 开场主舞台：2D Canvas 极夜星图 · 1:1 复刻 131 原海报图形母题与非线性跃迁弧
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, evaluate, getNodeRect } from "./model.js";

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// 绘制 1:1 原海报各节点图形母题
function drawNodeVisual(ctx, node, rect, state, evalData, t, pulsePhase) {
  const { cx, cy, hw, hh, radius, isCard } = rect;
  const cNorm = state.contrast / 100;
  const isCompound = state.signalMode === "compound";
  const isNone = state.signalMode === "none";
  const isSelected = state.selectedId === node.id;
  const isEntry = evalData.entryNode && evalData.entryNode.id === node.id && node.tier >= 1 && !isNone && state.contrast >= 22;

  // 图例过滤淡化
  let filterAlpha = 1;
  if (state.legendFilter && state.legendFilter !== "all") {
    const f = state.legendFilter;
    const match =
      (f === "hotspot" && (node.shape === "ringDot" || node.shape === "dot2x2" || node.shape === "dot3x3")) ||
      (f === "node" && isCard) ||
      (f === "signal" && (node.tier === 2 || node.shape === "bangCircle")) ||
      (f === "jump" && evalData.jumpPath.some((p) => p.id === node.id)) ||
      (f === "path" && evalData.jumpPath.some((p) => p.id === node.id));
    if (!match) filterAlpha = 0.22;
  }

  // 根据信号反差与层级计算实绘视觉亮度
  let alpha = 1;
  if (node.tier === 0) {
    // 退隐次级节点：反差越高背景退暗越干净
    alpha = 0.22 + (1 - cNorm) * 0.34;
  } else if (isNone) {
    alpha = 0.42;
  } else {
    alpha = 0.36 + 0.64 * Math.min(1, cNorm * 1.15);
  }
  alpha *= filterAlpha;

  ctx.save();
  ctx.globalAlpha = alpha;

  const isStrong = node.tier === 2 && !isNone;
  const active = node.tier >= 1 && !isNone && state.contrast >= 24;
  const primaryBlue = isNone ? "#464F5B" : PALETTE.blue;
  const primaryCyan = isNone ? "#6E7987" : PALETTE.cyan;
  const primaryViolet = isNone ? "#5C6472" : PALETTE.violet;

  // 若在「仅靠颜色」模式，把独特几何卡片/图标全部压扁成同质圆形色块，肉眼直接看到形状通道缺失！
  const effectiveShape = !isCompound && !isNone ? "flatColorDot" : node.shape;

  // 选中态外环与起跳入口波纹
  if (isSelected) {
    ctx.save();
    ctx.globalAlpha = 0.9 * filterAlpha;
    ctx.strokeStyle = PALETTE.cyanBright;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    roundRect(ctx, cx - hw - 6, cy - hh - 6, (hw + 6) * 2, (hh + 6) * 2, isCard ? 16 : 999);
    ctx.stroke();
    ctx.restore();
  }

  if (isEntry) {
    ctx.save();
    const ringR = Math.max(hw, hh) + 7 + Math.sin(t * 2.6) * 3;
    ctx.globalAlpha = 0.55 * filterAlpha;
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 空壳装饰节点警示红虚圈（亮起时）
  if (node.isDecoy && node.tier >= 1) {
    ctx.save();
    ctx.globalAlpha = 0.92 * filterAlpha;
    ctx.strokeStyle = PALETTE.warn;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 强信号微光晕（用两层轻量半透明同心圆代替逐像素径向渐变，确保慢机软件渲染 60fps）
  if (isStrong && state.contrast >= 36) {
    const glowR = Math.max(hw, hh) * 1.38;
    const gc = node.isDecoy ? "255,107,91" : "132,73,239";
    ctx.fillStyle = `rgba(${gc},${(0.10 * cNorm).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${gc},${(0.14 * cNorm).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }

  const compact = rect.hw < 74;

  // ---------- 按母题绘制 ----------
  if (effectiveShape === "flatColorDot") {
    // 「仅靠颜色」模式：丧失形状差异，全变成平权圆点
    const r = Math.min(hw, hh) * 0.72;
    ctx.fillStyle = node.isDecoy
      ? "#E25548"
      : node.tier === 2
        ? primaryViolet
        : node.tier === 1
          ? primaryBlue
          : "#2A313C";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.25, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    drawPillAndText(ctx, cx, cy + r * 0.66, node, isStrong ? primaryViolet : primaryCyan, isNone, compact, false);
  } else if (effectiveShape === "ringDot" || effectiveShape === "decoyRing") {
    const r = radius * 0.62;
    const cyIcon = cy - radius * 0.26;
    ctx.fillStyle = node.isDecoy
      ? "#C93E36"
      : node.tier === 2
        ? primaryViolet
        : active
          ? primaryBlue
          : "#1C2432";
    ctx.beginPath();
    ctx.arc(cx, cyIcon, r, 0, Math.PI * 2);
    ctx.fill();
    // 中心白圆（原海报标志蓝白靶点）
    ctx.fillStyle = isNone ? "#9BA5B2" : PALETTE.white;
    ctx.beginPath();
    ctx.arc(cx, cyIcon, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    drawPillAndText(ctx, cx, cy + radius * 0.62, node, node.isDecoy ? PALETTE.warn : isStrong ? PALETTE.violetPill : PALETTE.cyanPill, isNone, compact, node.isDecoy);
  } else if (effectiveShape === "bangCircle" || effectiveShape === "decoyBang") {
    const r = radius * 0.70;
    const cyIcon = cy - radius * 0.22;
    ctx.fillStyle = node.isDecoy
      ? "#D4483E"
      : active
        ? primaryViolet
        : "#25203A";
    ctx.beginPath();
    ctx.arc(cx, cyIcon, r, 0, Math.PI * 2);
    ctx.fill();
    // 白色感叹号（1:1 复刻原海报中央紫圆 !）
    ctx.fillStyle = PALETTE.white;
    const barW = Math.max(3.5, r * 0.16);
    const barH = r * 0.66;
    ctx.fillRect(cx - barW / 2, cyIcon - r * 0.50, barW, barH);
    ctx.beginPath();
    ctx.arc(cx, cyIcon + r * 0.36, barW * 0.62, 0, Math.PI * 2);
    ctx.fill();
    drawPillAndText(ctx, cx, cy + radius * 0.68, node, node.isDecoy ? PALETTE.warn : PALETTE.violetPill, isNone, compact, node.isDecoy);
  } else if (effectiveShape === "dot2x2") {
    // 原海报热点 3：2×2 青色圆点阵
    const cyIcon = cy - radius * 0.25;
    const step = radius * 0.42;
    const dotR = radius * 0.15;
    ctx.fillStyle = isStrong ? primaryViolet : active ? primaryCyan : "#313B47";
    for (const dx of [-step / 2, step / 2]) {
      for (const dy of [-step / 2, step / 2]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cyIcon + dy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawPillAndText(ctx, cx, cy + radius * 0.56, node, isStrong ? PALETTE.violetPill : PALETTE.cyanPill, isNone, compact, false);
  } else if (effectiveShape === "dot3x3") {
    // 原海报收尾点：3×3 紫罗兰圆点阵
    const cyIcon = cy - radius * 0.28;
    const step = radius * 0.36;
    const dotR = radius * 0.115;
    ctx.fillStyle = active ? primaryViolet : "#342E48";
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        ctx.beginPath();
        ctx.arc(cx + ix * step, cyIcon + iy * step, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawPillAndText(ctx, cx, cy + radius * 0.58, node, isStrong ? PALETTE.violetPill : PALETTE.cyanPill, isNone, compact, false);
  } else if (effectiveShape === "titleCard") {
    // 原海报标题信号细框卡：左上紫方 + 右上三白点 + 青色衬线大 T
    const x0 = cx - hw, y0 = cy - hh, w = hw * 2, h = hh * 2;
    ctx.fillStyle = PALETTE.cardBg;
    roundRect(ctx, x0, y0, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = isStrong ? primaryViolet : active ? "#4A5666" : PALETTE.cardBorder;
    ctx.lineWidth = isStrong ? 1.8 : 1.2;
    ctx.stroke();

    // 左上紫方块
    const sq = Math.max(7, h * 0.12);
    ctx.fillStyle = active ? primaryViolet : "#3E4754";
    ctx.fillRect(x0 + 10, y0 + 9, sq, sq);
    // 右上三白点
    ctx.fillStyle = "#8D99A8";
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(x0 + w - 12 - k * 8, y0 + 13, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // 标志青色衬线大 T
    const tSize = Math.max(18, Math.min(32, h * 0.44));
    ctx.font = `600 ${tSize}px "Fraunces", Georgia, serif`;
    ctx.fillStyle = isStrong ? PALETTE.violetSoft : active ? primaryCyan : "#667180";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("T", x0 + (compact ? 8 : 12), cy + 5);

    // 右侧标题文字
    const textX = x0 + (compact ? 11 : 16) + tSize * 0.68;
    ctx.font = `700 ${compact ? 10.5 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(node.pill, textX, cy - (compact ? 1 : 4));
    if (!compact) {
      ctx.font = `500 9.5px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(node.en, textX, cy + 12);
    }
  } else if (effectiveShape === "donutCard") {
    // 原海报数据节点细框卡：左上青环 + 蓝/紫/青三色饼环
    const x0 = cx - hw, y0 = cy - hh, w = hw * 2, h = hh * 2;
    ctx.fillStyle = PALETTE.cardBg;
    roundRect(ctx, x0, y0, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = isStrong ? primaryViolet : active ? "#4A5666" : PALETTE.cardBorder;
    ctx.lineWidth = isStrong ? 1.8 : 1.2;
    ctx.stroke();

    // 左上青色小圆环
    ctx.strokeStyle = active ? primaryCyan : "#4D5866";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x0 + 14, y0 + 14, 5, 0, Math.PI * 2);
    ctx.stroke();

    // 三色环形图
    const dr = Math.min(w * 0.16, h * 0.30);
    const dcx = x0 + 18 + dr;
    const dcy = cy + 6;
    const ringW = Math.max(5.5, dr * 0.46);
    const segs = [
      { a0: -Math.PI * 0.5, a1: Math.PI * 0.32, color: active ? primaryCyan : "#4B5664" },
      { a0: Math.PI * 0.32, a1: Math.PI * 0.85, color: active ? primaryViolet : "#3D4652" },
      { a0: Math.PI * 0.85, a1: Math.PI * 1.5, color: active ? primaryBlue : "#323A46" },
    ];
    for (const s of segs) {
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = ringW;
      ctx.arc(dcx, dcy, dr - ringW / 2, s.a0, s.a1);
      ctx.stroke();
    }

    const textX = dcx + dr + (compact ? 6 : 10);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${compact ? 10.5 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(node.pill, textX, cy - (compact ? 0 : 3));
    if (!compact) {
      ctx.font = `500 9.5px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(node.en, textX, cy + 13);
    }
  } else if (effectiveShape === "peakCard") {
    // 原海报视觉节点细框卡：左上双紫横线 + 双青三角山峰
    const x0 = cx - hw, y0 = cy - hh, w = hw * 2, h = hh * 2;
    ctx.fillStyle = PALETTE.cardBg;
    roundRect(ctx, x0, y0, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = isStrong ? primaryViolet : active ? "#4A5666" : PALETTE.cardBorder;
    ctx.lineWidth = isStrong ? 1.8 : 1.2;
    ctx.stroke();

    // 左上双紫短横杠
    ctx.fillStyle = active ? primaryViolet : "#464F5B";
    ctx.fillRect(x0 + 12, y0 + 11, 18, 2.2);
    ctx.fillRect(x0 + 12, y0 + 17, 12, 2.2);

    // 双青三角山峰
    const baseY = y0 + h - 12;
    const peakBaseX = x0 + 12;
    const pw = Math.min(w * 0.34, 48);
    const ph = h * 0.38;
    ctx.fillStyle = active ? primaryCyan : "#4D5967";
    ctx.beginPath();
    ctx.moveTo(peakBaseX, baseY);
    ctx.lineTo(peakBaseX + pw * 0.36, baseY - ph * 0.85);
    ctx.lineTo(peakBaseX + pw * 0.68, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = active ? "#74ECFF" : "#626E7D";
    ctx.beginPath();
    ctx.moveTo(peakBaseX + pw * 0.34, baseY);
    ctx.lineTo(peakBaseX + pw * 0.72, baseY - ph);
    ctx.lineTo(peakBaseX + pw * 1.06, baseY);
    ctx.closePath();
    ctx.fill();

    const textX = peakBaseX + pw + (compact ? 6 : 10);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${compact ? 10.5 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(node.pill, textX, cy - (compact ? 0 : 3));
    if (!compact) {
      ctx.font = `500 9.5px "DM Mono", monospace`;
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(node.en, textX, cy + 13);
    }
  }

  // 右上角标出起跳入口标记或跃迁序号（仅亮起并在路径上时）
  const stepIdx = evalData.jumpPath.findIndex((p) => p.id === node.id);
  if (stepIdx >= 0 && !isNone && state.contrast >= 24) {
    ctx.save();
    ctx.globalAlpha = 0.96 * filterAlpha;
    const bx = isCard ? cx + hw - 6 : cx + radius * 0.72;
    const by = isCard ? cy - hh - 2 : cy - radius * 0.74;
    const br = compact ? 9.5 : 11;
    ctx.fillStyle = stepIdx === 0 ? PALETTE.cyan : node.isDecoy ? PALETTE.warn : "#121A24";
    ctx.strokeStyle = stepIdx === 0 ? PALETTE.bg : node.isDecoy ? PALETTE.warn : PALETTE.cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = `600 ${compact ? 10 : 11}px "DM Mono", monospace`;
    ctx.fillStyle = stepIdx === 0 ? "#041116" : PALETTE.white;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(stepIdx + 1), bx, by + 0.5);
    ctx.restore();
  }

  ctx.restore();
}

function drawPillAndText(ctx, cx, py, node, pillBg, isNone, compact, isDecoy) {
  ctx.font = `700 ${compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
  const textW = ctx.measureText(node.pill).width;
  const pw = textW + (compact ? 14 : 18);
  const ph = compact ? 20 : 22;

  if (isNone) {
    ctx.fillStyle = "#1E232B";
  } else if (node.tier === 0) {
    ctx.fillStyle = "#1D242E";
  } else {
    ctx.fillStyle = pillBg;
  }
  roundRect(ctx, cx - pw / 2, py - ph / 2, pw, ph, ph / 2);
  ctx.fill();

  ctx.fillStyle = isNone || node.tier === 0 ? "#9AA5B2" : isDecoy ? "#FFFFFF" : pillBg === PALETTE.violetPill ? "#FFFFFF" : "#031015";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.pill, cx, py + 0.5);

  if (!compact) {
    ctx.font = `500 10px "DM Mono", monospace`;
    ctx.fillStyle = isDecoy ? "#FF9F94" : PALETTE.muted;
    ctx.fillText(node.short, cx, py + ph / 2 + 12);
  }
}

// 绘制原海报同款青色非线性虚线曲线箭头
function drawJumpCurve(ctx, fromRect, toRect, index, t, isWarn, filterAlpha, still) {
  const x1 = fromRect.cx, y1 = fromRect.cy;
  const x2 = toRect.cx, y2 = toRect.cy;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 20) return;

  // 起止点退到外框外沿，避免压住圆心文字
  const pad1 = Math.min(fromRect.hw, fromRect.hh) * 0.85 + 8;
  const pad2 = Math.min(toRect.hw, toRect.hh) * 0.85 + 12;
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * pad1, sy = y1 + uy * pad1;
  const ex = x2 - ux * pad2, ey = y2 - uy * pad2;

  // 交替正负曲率，还原原海报柔和 S 形/弧形虚线跳跃轨
  const bend = (index % 2 === 0 ? -1 : 1) * Math.min(54, len * 0.24);
  const mx = (sx + ex) / 2 - uy * bend;
  const my = (sy + ey) / 2 + ux * bend;

  ctx.save();
  ctx.globalAlpha = 0.88 * filterAlpha;
  ctx.strokeStyle = isWarn ? PALETTE.warn : PALETTE.cyan;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.setLineDash([4, 7]);
  ctx.lineDashOffset = still ? 0 : -t * 22;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);

  // 末端实心青箭头
  const tx = ex - mx, ty = ey - my;
  const tLen = Math.hypot(tx, ty) || 1;
  const ax = tx / tLen, ay = ty / tLen;
  const head = 8.5;
  ctx.fillStyle = isWarn ? PALETTE.warn : PALETTE.cyan;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ax * head - ay * head * 0.55, ey - ay * head + ax * head * 0.55);
  ctx.lineTo(ex - ax * head + ay * head * 0.55, ey - ay * head - ax * head * 0.55);
  ctx.closePath();
  ctx.fill();

  // 跃迁脉冲光珠（静态模式下停在 58% 处）
  const p = still ? 0.58 : ((t * 0.45 - index * 0.22) % 1 + 1) % 1;
  if (p >= 0 && p <= 1) {
    const inv = 1 - p;
    const px = inv * inv * sx + 2 * inv * p * mx + p * p * ex;
    const py = inv * inv * sy + 2 * inv * p * my + p * p * ey;
    ctx.fillStyle = isWarn ? "#FFB0A6" : PALETTE.cyanBright;
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function mountHeroStage(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 900, h = 480, dpr = 1;
  let dragging = null; // { mode: 'node'|'contrast', id?, startX, startY, origX, origY, origContrast, moved }
  let hoverId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(300, Math.round(rect.width));
    h = Math.max(240, Math.round(rect.height));
    dpr = pixelRatio(w <= 500 ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  resize();
  const ro = new ResizeObserver(() => { resize(); ctl.draw(); });
  ro.observe(canvas);

  function frame(t, _dt, { still }) {
    const state = getState();
    const ev = evaluate(state, w, h);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 极夜纯黑底 + 极微弱的星图坐标微点（体现空间留白而不喧宾夺主）
    ctx.fillStyle = "#040609";
    ctx.fillRect(0, 0, w, h);

    // 淡灰四象限十字标尺线（极克制，方便直观理解多象限分散）
    ctx.strokeStyle = "rgba(130, 152, 178, 0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 16);
    ctx.lineTo(w * 0.5, h - 28);
    ctx.moveTo(16, h * 0.5);
    ctx.lineTo(w - 16, h * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // 轻微底噪模拟：当 contrast 低或 signalMode === 'none' 时，背景浮现均匀灰文字占位行，展现「热点被文字海淹没」
    const noiseAlpha = state.signalMode === "none" ? 0.34 : Math.max(0, (55 - state.contrast) / 140);
    if (noiseAlpha > 0.03) {
      ctx.fillStyle = `rgba(148, 162, 178, ${noiseAlpha.toFixed(3)})`;
      const rowGap = 24;
      for (let ry = 28; ry < h - 38; ry += rowGap) {
        ctx.fillRect(28, ry, w * 0.28, 3);
        ctx.fillRect(w * 0.36, ry, w * 0.26, 3);
        ctx.fillRect(w * 0.67, ry, w * 0.25, 3);
      }
    }

    // 2. 预计算全部节点矩形（与 model.js 同一几何）
    const rectMap = new Map();
    for (const n of ev.nodes) {
      rectMap.set(n.id, getNodeRect(n, w, h, state.signalMode));
    }

    // 3. 绘制最严重的最多 2 对拥挤粘连警示虚线（保持画布清爽不盖字）
    const topCrowded = [...ev.crowdedPairs].sort((p, q) => p.gapPct - q.gapPct).slice(0, 2);
    for (const pair of topCrowded) {
      const ra = rectMap.get(pair.a.id);
      const rb = rectMap.get(pair.b.id);
      if (!ra || !rb) continue;
      ctx.save();
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(ra.cx, ra.cy);
      ctx.lineTo(rb.cx, rb.cy);
      ctx.stroke();
      ctx.setLineDash([]);
      const mx = (ra.cx + rb.cx) / 2;
      const my = (ra.cy + rb.cy) / 2;
      const lbl = pair.gapPct <= 0 ? "重叠" : `挤粘 ${pair.gapPct}%`;
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(lbl).width + 12;
      ctx.fillStyle = "rgba(48, 14, 14, 0.94)";
      roundRect(ctx, mx - tw / 2, my - 10, tw, 20, 4);
      ctx.fill();
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#FFD6D0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lbl, mx, my + 0.5);
      ctx.restore();
    }

    // 4. 绘制非线性青色虚线跃迁路径（从任意入口跳向后续热点）
    const pathAlpha = state.legendFilter === "all" || state.legendFilter === "path" || state.legendFilter === "jump" ? 1 : 0.2;
    for (let i = 0; i < ev.jumpPath.length - 1; i++) {
      const a = ev.jumpPath[i];
      const b = ev.jumpPath[i + 1];
      const ra = rectMap.get(a.id);
      const rb = rectMap.get(b.id);
      if (ra && rb) {
        const segWarn = Boolean(a.isDecoy || b.isDecoy || ev.issues.some((x) => x.code === "overload"));
        drawJumpCurve(ctx, ra, rb, i, t, segWarn, pathAlpha, still);
      }
    }

    // 5. 绘制节点（先画退隐层，再画常规热点，最后画强核与选中项）
    const sorted = [...ev.nodes].sort((a, b) => {
      if (a.id === state.selectedId) return 1;
      if (b.id === state.selectedId) return -1;
      return a.tier - b.tier;
    });
    for (const n of sorted) {
      drawNodeVisual(ctx, n, rectMap.get(n.id), state, ev, t, 0);
    }

    // 6. 左上微遥测标（真实单真源）& 底沿内嵌信噪比进度条（直观响应横拖！）
    ctx.save();
    ctx.font = `500 ${w < 500 ? 10 : 11}px "DM Mono", monospace`;
    ctx.fillStyle = PALETTE.muted;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hud = `ACTIVE ${ev.activeCount} · SNR ${state.contrast}% · MIN GAP ${ev.minGapPct}% · ${ev.quadrantCount}/4 QUAD`;
    ctx.fillText(hud, 14, 10);

    // 顶部右侧实时档位小徽
    const badgeText = ev.grade;
    ctx.font = `700 ${w < 500 ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
    const bw = ctx.measureText(badgeText).width + 18;
    const bx = w - bw - 12;
    ctx.fillStyle = ev.gradeTone === "ok" ? "rgba(56,232,176,0.16)" : "rgba(255,107,91,0.18)";
    roundRect(ctx, bx, 8, bw, 22, 11);
    ctx.fill();
    ctx.strokeStyle = ev.gradeTone === "ok" ? PALETTE.ok : PALETTE.warn;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = ev.gradeTone === "ok" ? PALETTE.ok : "#FFB4AC";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, bx + bw / 2, 19.5);

    // 底沿细轨：显示当前信号反差（合法舒适区 44%–86% 以浅青标出）
    const barX = 16, barY = h - 14, barW = w - 32;
    ctx.fillStyle = "#19202B";
    roundRect(ctx, barX, barY, barW, 4, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(56, 218, 245, 0.28)";
    ctx.fillRect(barX + barW * 0.44, barY, barW * 0.42, 4);
    const knobX = barX + barW * (state.contrast / 100);
    ctx.fillStyle = ev.gradeTone === "ok" ? PALETTE.cyan : PALETTE.warn;
    ctx.fillRect(barX, barY, Math.max(4, knobX - barX), 4);
    ctx.beginPath();
    ctx.arc(knobX, barY + 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  const ctl = loop(canvas, frame);

  // 命中测试
  function hitNode(px, py) {
    const state = getState();
    const ev = evaluate(state, w, h);
    // 按绘制逆序检测
    const ordered = [...ev.nodes].reverse();
    for (const n of ordered) {
      const r = getNodeRect(n, w, h, state.signalMode);
      if (px >= r.x0 - 6 && px <= r.x1 + 6 && py >= r.y0 - 6 && py <= r.y1 + 6) {
        return n;
      }
    }
    return null;
  }

  function clientToLocal(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // 指针交互：拖节点移动位置；点节点切换层级；拖空白横向调信号反差（竖向滑动不阻断手机滚动）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const { x, y } = clientToLocal(e);
    const hit = hitNode(x, y);
    const state = getState();
    if (hit) {
      dragging = {
        mode: "node",
        id: hit.id,
        startX: x,
        startY: y,
        origX: hit.x,
        origY: hit.y,
        moved: false,
        pointerId: e.pointerId,
      };
      canvas.setPointerCapture?.(e.pointerId);
    } else {
      dragging = {
        mode: "contrast",
        startX: x,
        startY: y,
        origContrast: state.contrast,
        moved: false,
        locked: false,
        pointerId: e.pointerId,
      };
      canvas.setPointerCapture?.(e.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = clientToLocal(e);
    if (!dragging) {
      const hit = hitNode(x, y);
      const nextHover = hit ? hit.id : null;
      if (nextHover !== hoverId) {
        hoverId = nextHover;
        canvas.style.cursor = hit ? "grab" : "ew-resize";
      }
      return;
    }
    const dx = x - dragging.startX;
    const dy = y - dragging.startY;
    if (dragging.mode === "node") {
      if (Math.hypot(dx, dy) > 5) dragging.moved = true;
      if (!dragging.moved) return;
      canvas.style.cursor = "grabbing";
      const nx = Math.max(0.10, Math.min(0.90, dragging.origX + dx / w));
      const ny = Math.max(0.14, Math.min(0.84, dragging.origY + dy / h));
      onChange((s) => ({
        ...s,
        selectedId: dragging.id,
        nodes: { ...s.nodes, [dragging.id]: { ...s.nodes[dragging.id], x: +nx.toFixed(3), y: +ny.toFixed(3) } },
      }), true);
    } else if (dragging.mode === "contrast") {
      if (!dragging.locked) {
        if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy) * 0.9) {
          dragging.locked = true;
          dragging.moved = true;
        } else if (Math.abs(dy) > 10 && e.pointerType === "touch") {
          dragging = null;
          return;
        }
      }
      if (dragging && dragging.locked) {
        const delta = Math.round((dx / Math.max(220, w * 0.65)) * 100);
        const nextC = Math.max(0, Math.min(100, dragging.origContrast + delta));
        onChange((s) => ({ ...s, contrast: nextC }), true);
      }
    }
  });

  function endDrag(e) {
    if (!dragging) return;
    const cur = dragging;
    dragging = null;
    canvas.style.cursor = hoverId ? "grab" : "ew-resize";
    try { canvas.releasePointerCapture?.(cur.pointerId); } catch {}

    // 拖完松手时强制非节流同步一次最终态 UI
    if (cur.moved) {
      onChange((s) => s, false);
    }
    // 轻点节点：循环切换层级 0 -> 1 -> 2 -> 0（若是空壳点：0 <-> 1/2 直接开关更顺手）
    if (cur.mode === "node" && !cur.moved) {
      onChange((s) => {
        const old = s.nodes[cur.id];
        if (!old) return s;
        const nextTier = cur.id.startsWith("decoy")
          ? (old.tier >= 1 ? 0 : 2)
          : ((old.tier + 1) % 3);
        return {
          ...s,
          selectedId: cur.id,
          nodes: { ...s.nodes, [cur.id]: { ...old, tier: nextTier } },
        };
      });
      ctl.draw();
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  return {
    draw: () => ctl.draw(),
    resize,
  };
}
