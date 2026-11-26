// 133 双栏版式 · 蓝图排印画布渲染与交互引擎（纯 2D Canvas，零 shadowBlur，60fps）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SPECIMENS, clamp, evaluate, wrapText } from "./model.js";

const COLORS = {
  bg: "#001438",
  bgCard: "#051B47",
  bgDeep: "#02102C",
  gridLine: "rgba(106, 154, 227, 0.11)",
  ruleBlue: "#6A9AE3",
  ruleSoft: "rgba(106, 154, 227, 0.42)",
  ruleDim: "rgba(106, 154, 227, 0.24)",
  amber: "#F59E18",
  amberSoft: "rgba(245, 158, 24, 0.22)",
  cream: "#F4ECDA",
  text: "#E8F0FC",
  textDim: "#A8C1E6",
  ok: "#3EE0A8",
  okSoft: "rgba(62, 224, 168, 0.16)",
  err: "#FF6B6B",
  errSoft: "rgba(255, 107, 107, 0.18)",
  heavyWall: "#F59E18",
};

const SNAP_SPLITS = [0.38, 0.46, 0.5, 0.58];

export function mountHeroCanvas(canvas, getState, setState, onRenderMeta) {
  const ctx = canvas.getContext("2d");
  let viewW = 740;
  let viewH = 490;
  let dpr = pixelRatio(2);
  let hitZones = { clashBox: null, driftBox: null, gutterPill: null };
  let activeDrag = null; // { mode: "split"|"gutterL"|"gutterR", startX, startY, startLeft, startGutter, moved }
  let hoverMode = "";
  let revealT = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    dpr = pixelRatio(rect.width < 520 ? 1.5 : 2);
    viewW = rect.width;
    viewH = rect.height;
    const pw = Math.round(viewW * dpr);
    const ph = Math.round(viewH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  // 绘制圆头 S 形阅读路径矢（1:1 承袭 133 原海报 ●╰───→）
  function drawSCurveArrow(x0, y0, x1, y1, color, lw = 2, dashed = false) {
    const midX = x0 + Math.min(72, (x1 - x0) * 0.34);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + (midX - x0) * 0.65, y0, x0 + (midX - x0) * 0.45, y1, midX + 12, y1);
    ctx.lineTo(x1 - 7, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    // 起点实心圆
    ctx.beginPath();
    ctx.arc(x0, y0, Math.max(3.5, lw * 2.1), 0, Math.PI * 2);
    ctx.fill();

    // 终点开放式尖箭头
    ctx.beginPath();
    ctx.moveTo(x1 - 8, y1 - 4.5);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 - 8, y1 + 4.5);
    ctx.stroke();
    ctx.restore();
  }

  // 绘制双向水平箭头 <--->
  function drawDoubleArrow(x0, x1, y, color, lw = 1.6) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x0 + 2, y);
    ctx.lineTo(x1 - 2, y);
    ctx.stroke();
    if (x1 - x0 > 12) {
      const a = Math.min(5, (x1 - x0) * 0.25);
      ctx.beginPath();
      ctx.moveTo(x0 + 2 + a, y - a);
      ctx.lineTo(x0 + 2, y);
      ctx.lineTo(x0 + 2 + a, y + a);
      ctx.moveTo(x1 - 2 - a, y - a);
      ctx.lineTo(x1 - 2, y);
      ctx.lineTo(x1 - 2 - a, y + a);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 绘制 133 原海报招牌：琥珀金 + 右侧半调圆点渐变矩形
  function drawHalftoneBlock(x, y, w, h, reveal) {
    const rw = w * reveal;
    if (rw < 4 || h < 4) return;
    ctx.save();
    ctx.fillStyle = COLORS.amber;
    ctx.fillRect(x, y, rw, h);

    // 右侧 38% 叠加深蓝规则半调点阵（单 path 批绘，仅 1 次 fill 调用保 60fps）
    const dotStart = x + rw * 0.58;
    const step = w < 150 ? 6.5 : 8;
    ctx.fillStyle = COLORS.bg;
    ctx.beginPath();
    for (let dx = dotStart; dx < x + rw - 3; dx += step) {
      const prog = (dx - dotStart) / Math.max(1, x + rw - dotStart);
      const r = 0.75 + prog * (w < 150 ? 1.15 : 1.55);
      for (let dy = y + 4; dy < y + h - 3; dy += step) {
        ctx.moveTo(dx + r, dy);
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  let dirty = true;
  let lastPulseAt = 0;

  // 主绘制函数（绝不在每帧调 getBoundingClientRect，彻底避免拖拽时的强制回流）
  function render(t, dt, { still }) {
    const state = getState();
    const animating = !still && (revealT < 1 || state.flowPlaying);
    const needPulse = !still && state.showGuides && state.gutterRatio < 0.045 && (t - lastPulseAt >= 0.08);
    if (!dirty && !animating && !needPulse && !still) return;
    dirty = false;
    if (needPulse) lastPulseAt = t;

    const m = evaluate(state, viewW, viewH);
    hitZones = { clashBox: null, driftBox: null, gutterPill: null };

    // 开场 0.55 秒干脆展开，0.9 秒截图时已经完全清晰稳定
    if (still) {
      revealT = 1;
    } else {
      revealT = Math.min(1, revealT + (dt || 0.016) * 2.1);
    }
    const ease = 1 - Math.pow(1 - revealT, 3);

    // 演播视线光珠推进
    if (!still && state.flowPlaying) {
      const next = (state.flowProgress + (dt || 0.016) * 0.34) % 1;
      state.flowProgress = next;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深午夜蓝图底面与精细网格线
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, m.W, m.H);

    // 建筑蓝图细网格
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    const gridStep = m.compact ? 24 : 32;
    ctx.beginPath();
    for (let gx = m.padX; gx <= m.W - m.padX + 1; gx += gridStep) {
      ctx.moveTo(Math.round(gx) + 0.5, m.padTop);
      ctx.lineTo(Math.round(gx) + 0.5, m.H - m.padBot);
    }
    for (let gy = m.padTop; gy <= m.H - m.padBot + 1; gy += m.leadingPx) {
      ctx.moveTo(m.padX, Math.round(gy) + 0.5);
      ctx.lineTo(m.W - m.padX, Math.round(gy) + 0.5);
    }
    ctx.stroke();

    // 外版芯细蓝边框
    ctx.strokeStyle = COLORS.ruleDim;
    ctx.lineWidth = 1;
    ctx.strokeRect(m.padX + 0.5, m.padTop + 0.5, m.innerW - 1, m.innerH - 1);

    // 2. 顶部栏宽标尺带
    const topBarY = m.padTop - (m.compact ? 18 : 22);
    ctx.font = `600 ${m.compact ? 10 : 11}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = "middle";

    // 左栏标尺
    ctx.fillStyle = m.probes.column.ok ? COLORS.ruleBlue : COLORS.err;
    ctx.textAlign = "left";
    ctx.fillText(`L ${m.leftPct}%`, m.leftX, topBarY);
    if (!m.compact) {
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText(`· ${m.leftW}px`, m.leftX + 44, topBarY);
    }

    // 右栏标尺
    ctx.fillStyle = m.probes.column.ok ? COLORS.ruleBlue : COLORS.err;
    ctx.textAlign = "right";
    ctx.fillText(`R ${m.rightPct}%`, m.rightX + m.rightW, topBarY);

    // 中央栏距读数胶囊（顶部居中于栏距）
    const gColor = m.probes.gutter.ok ? COLORS.ok : COLORS.err;
    const gLabel = `栏距 ${m.gutterPx}px (${m.gutterToLeading.toFixed(2)}×)`;
    ctx.font = `600 ${m.compact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    const gTw = ctx.measureText(gLabel).width + 14;
    const gBx = clamp(m.gutterCenterX - gTw / 2, m.padX + 56, m.W - m.padX - 56 - gTw);
    ctx.fillStyle = m.probes.gutter.ok ? "rgba(62, 224, 168, 0.14)" : "rgba(255, 107, 107, 0.18)";
    ctx.fillRect(gBx, topBarY - 10, gTw, 20);
    ctx.strokeStyle = gColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(gBx + 0.5, topBarY - 9.5, gTw - 1, 19);
    ctx.fillStyle = gColor;
    ctx.textAlign = "center";
    ctx.fillText(gLabel, gBx + gTw / 2, topBarY + 0.5);
    hitZones.gutterPill = { x: gBx, y: topBarY - 10, w: gTw, h: 20 };

    // 3. 左右两栏微弱底舱（便于清晰感知版芯与栏距）
    ctx.fillStyle = "rgba(8, 30, 74, 0.55)";
    ctx.fillRect(m.leftX + 1, m.padTop + 1, m.leftW - 2, m.innerH - 2);
    ctx.fillRect(m.rightX + 1, m.padTop + 1, m.rightW - 2, m.innerH - 2);

    // 4. 渲染当前标本内容（左栏 + 右栏）
    const drift = m.driftPx;
    const bleedYList = []; // 记录用于绘制跨栏串读红弧的真实行 Y 坐标

    if (state.specimen === "poster") {
      drawPosterSpecimen(m, state, ease, drift, bleedYList);
    } else if (state.specimen === "article") {
      drawArticleSpecimen(m, state, ease, drift, bleedYList);
    } else {
      drawCompareSpecimen(m, state, ease, drift, bleedYList);
    }

    // 5. 中央栏距走廊（1:1 承袭 133 原海报贯穿全高的双虚线 + 双向箭头！）
    const gutTop = m.padTop - 8;
    const gutBot = m.H - m.padBot + 8;
    const railH = (gutBot - gutTop) * ease;
    const railColor =
      m.probes.gutter.code === "gutter_collapse" || m.probes.gutter.code === "gutter_chasm"
        ? COLORS.err
        : COLORS.ruleBlue;

    // 栏距区底纹（错态时用淡红警示，达标时用极淡蓝图青）
    if (m.probes.gutter.code === "gutter_collapse" || m.probes.gutter.code === "gutter_chasm") {
      ctx.fillStyle = "rgba(255, 107, 107, 0.12)";
      ctx.fillRect(m.gutterX, m.padTop, m.gutterPx, m.innerH);
    } else if (m.probes.gutter.ok) {
      ctx.fillStyle = "rgba(106, 154, 227, 0.06)";
      ctx.fillRect(m.gutterX, m.padTop, m.gutterPx, m.innerH);
    }

    // 栏线形态：原海报双虚线 / 纯留白 / 粗实硬线
    if (state.ruleStyle === "heavy") {
      ctx.fillStyle = COLORS.err;
      ctx.fillRect(m.gutterCenterX - 3, m.padTop, 6, m.innerH * ease);
    } else if (state.ruleStyle === "dashed" || state.showGuides) {
      ctx.save();
      ctx.strokeStyle = state.ruleStyle === "none" ? "rgba(106, 154, 227, 0.32)" : railColor;
      ctx.lineWidth = state.ruleStyle === "none" ? 1 : 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(m.gutterX + 0.5, gutTop);
      ctx.lineTo(m.gutterX + 0.5, gutTop + railH);
      ctx.moveTo(m.gutterX + m.gutterPx - 0.5, gutTop);
      ctx.lineTo(m.gutterX + m.gutterPx - 0.5, gutTop + railH);
      ctx.stroke();
      ctx.restore();
    }

    // 中央 <---> 双向箭头与可拖手柄
    const midY = m.padTop + m.innerH * 0.5;
    if (m.gutterPx >= 18) {
      drawDoubleArrow(m.gutterX + 2, m.gutterX + m.gutterPx - 2, midY, railColor, 1.8);
    } else {
      // 塌陷态画突出小拉手，明确提示可拖拽
      ctx.fillStyle = COLORS.err;
      ctx.beginPath();
      ctx.arc(m.gutterCenterX, midY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 10px "IBM Plex Mono", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", m.gutterCenterX, midY + 0.5);
    }

    // 两侧虚线边轨上的微缩拖拽圆钮（用于直拖调栏距）
    if (m.gutterPx >= 20) {
      for (const rx of [m.gutterX, m.gutterX + m.gutterPx]) {
        ctx.fillStyle = COLORS.bg;
        ctx.strokeStyle = hoverMode === "gutterL" || hoverMode === "gutterR" ? COLORS.amber : railColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(rx, midY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 6. 跨栏串读红色跳行虚线弧（当且仅当真实 gutterPx < leadingPx * 0.95 时出现！）
    if (m.probes.gutter.code === "gutter_collapse" && state.showGuides) {
      const pulse = still ? 0 : (t * 28) % 16;
      const rows = bleedYList.slice(0, 3);
      for (let i = 0; i < rows.length; i++) {
        const y = rows[i];
        const xStart = Math.max(m.leftX + 12, m.gutterX - 28);
        const xEnd = Math.min(m.rightX + m.rightW - 12, m.rightX + 34);
        ctx.save();
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.lineDashOffset = -pulse;
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.quadraticCurveTo(m.gutterCenterX, y - 9, xEnd, y + clamp(drift, -6, 6));
        ctx.stroke();
        ctx.setLineDash([]);
        // 箭头
        ctx.fillStyle = COLORS.err;
        ctx.beginPath();
        ctx.moveTo(xEnd, y + clamp(drift, -6, 6));
        ctx.lineTo(xEnd - 6, y + clamp(drift, -6, 6) - 3.5);
        ctx.lineTo(xEnd - 6, y + clamp(drift, -6, 6) + 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // 警示签：置于跨栏弧下方空位，与顶部基线标尺彻底分离，绝不重叠
      const lastArcY = rows.length ? rows[rows.length - 1] : midY - 12;
      const warnY = clamp(lastArcY + 20, m.padTop + Math.round(m.innerH * 0.56), m.H - m.padBot - 50);
      const warnText = "× 横向串读跨栏";
      ctx.font = `700 ${m.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const ww = ctx.measureText(warnText).width + 14;
      const wx = clamp(m.gutterCenterX - ww / 2, m.padX + 6, m.W - m.padX - ww - 6);
      ctx.fillStyle = "#A81C1C";
      ctx.fillRect(wx, warnY, ww, 20);
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1;
      ctx.strokeRect(wx + 0.5, warnY + 0.5, ww - 1, 19);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnText, wx + ww / 2, warnY + 10.5);
    }

    // 7. 基线错牙标尺（当 |drift| > 2px 时显影并支持点击一键归零；停靠在右栏顶/底留白缝，零遮挡）
    if (Math.abs(drift) > 2 && state.showGuides) {
      const refY = m.padTop + (m.compact ? 58 : 74);
      const rightRefY = refY + drift;
      ctx.save();
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(m.leftX + 8, refY + 0.5);
      ctx.lineTo(m.gutterCenterX + 14, refY + 0.5);
      ctx.moveTo(m.gutterCenterX - 14, rightRefY + 0.5);
      ctx.lineTo(m.rightX + m.rightW - 8, rightRefY + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 错牙可点修复签（正向错牙停靠右栏顶空隙，负向错牙停靠右栏底空隙，绝不撞正文与红签）
      const dLabel = m.compact
        ? `基线 ${drift > 0 ? "+" : ""}${drift}px · 点齐`
        : `基线错牙 ${drift > 0 ? "+" : ""}${drift}px · 点此对齐`;
      ctx.font = `600 ${m.compact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
      const dw = ctx.measureText(dLabel).width + 14;
      const dx = clamp(m.rightX + m.rightW - dw - 6, m.padX + 6, m.W - m.padX - dw - 6);
      const dy = drift > 0 ? m.padTop + 4 : m.H - m.padBot - 25;
      ctx.fillStyle = "#2E1C04";
      ctx.fillRect(dx, dy, dw, 20);
      ctx.strokeStyle = COLORS.amber;
      ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, 19);
      ctx.fillStyle = COLORS.amber;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(dLabel, dx + 7, dy + 10.5);
      hitZones.driftBox = { x: dx, y: dy, w: dw, h: 20 };
      ctx.restore();
    }

    // 8. 演播视线流动光珠（按动或达标时轻描路径）
    if (state.flowPlaying || (m.score === 4 && state.showGuides)) {
      drawReadingFlowOverlay(m, state, still ? 0.55 : state.flowPlaying ? state.flowProgress : (t * 0.22) % 1);
    }

    // 9. 底沿操作微提示与状态条
    const footY = m.H - m.padBot + (m.compact ? 16 : 19);
    ctx.font = `500 ${m.compact ? 10 : 11}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.textDim;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const tip = m.compact
      ? "左右横拖调栏宽 · 点红/黄签修错态"
      : "左右横拖画布调栏宽 · 拖双虚线边轨调栏距 · 点红/黄标直修错态 · ←/→ 微调";
    ctx.fillText(tip, m.padX, footY);

    ctx.textAlign = "right";
    ctx.fillStyle = m.score === 4 ? COLORS.ok : COLORS.amber;
    ctx.fillText(`${m.score}/4 · ${m.bleedRisk}`, m.W - m.padX, footY);

    ctx.restore();

    if (onRenderMeta) onRenderMeta(m);
  }

  // ---- 标本 1：133 原海报图文双栏 ----
  function drawPosterSpecimen(m, state, ease, drift, bleedYList) {
    const spec = SPECIMENS.poster;
    const padIn = m.compact ? 8 : 14;
    let ly = m.padTop + (m.compact ? 14 : 20);

    // 冲突态：左栏顶部插入与右栏同量级的琥珀强色块（双头抢焦，支持直点撤掉！）
    if (state.entryClash) {
      const ch = m.compact ? 36 : 44;
      const cw = m.leftW - padIn * 2;
      ctx.save();
      ctx.fillStyle = COLORS.amber;
      ctx.fillRect(m.leftX + padIn, ly, cw, ch);
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(m.leftX + padIn + 1, ly + 1, cw - 2, ch - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "#001438";
      ctx.font = `900 ${m.compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const tag = cw > 175 ? "× 双头抢焦块 · 点此撤除" : "× 抢焦 · 点此撤除";
      ctx.fillText(tag, m.leftX + padIn + 8, ly + ch / 2 + 0.5);
      hitZones.clashBox = { x: m.leftX + padIn, y: ly, w: cw, h: ch };
      ctx.restore();
      ly += ch + (m.compact ? 10 : 14);
    }

    // 左栏：编辑排印文字
    ctx.fillStyle = COLORS.cream;
    ctx.font = `900 ${Math.round(m.fontSize * 1.25)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(spec.leftTitle, m.leftX + padIn, ly, Math.max(40, m.leftW - padIn * 2));
    ly += Math.round(m.leadingPx * 1.25);

    // 蓝图横线箭头（原海报元素）
    ctx.strokeStyle = COLORS.ruleBlue;
    ctx.lineWidth = 1.4;
    const arrEnd = m.leftX + Math.min(m.leftW - padIn, m.leftW * 0.72);
    ctx.beginPath();
    ctx.moveTo(m.leftX + padIn, ly);
    ctx.lineTo(arrEnd, ly);
    ctx.moveTo(arrEnd - 6, ly - 4);
    ctx.lineTo(arrEnd, ly);
    ctx.lineTo(arrEnd - 6, ly + 4);
    ctx.stroke();
    ly += Math.round(m.leadingPx * 0.7);

    // 真实折行中文正文
    ctx.font = `400 ${m.fontSize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.text;
    const maxY = m.padTop + m.innerH - (m.compact ? 22 : 28);
    for (let i = 0; i < m.leftLines.length; i++) {
      const line = m.leftLines[i];
      if (ly + m.leadingPx > maxY) break;
      if (!line) {
        ly += Math.round(m.leadingPx * 0.45);
        continue;
      }
      ctx.fillText(line, m.leftX + padIn, ly);
      if (i < 4) bleedYList.push(ly + m.fontSize * 0.55);
      ly += m.leadingPx;
    }

    // 左栏底部小标注
    ctx.font = `500 ${m.compact ? 10 : 10.5}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = COLORS.ruleBlue;
    ctx.fillText(`左栏约 ${m.leftChars} 字/行`, m.leftX + padIn, m.padTop + m.innerH - 18, Math.max(40, m.leftW - padIn * 2));

    // ---- 右栏：1:1 承袭 133 原海报三段琥珀几何 + S 形天蓝阅读路径 ----
    const rx = m.rightX + padIn;
    const rw = Math.max(36, m.rightW - padIn * 2);
    let ry = m.padTop + (m.compact ? 14 : 20) + drift;
    const availH = m.innerH - (m.compact ? 28 : 40);

    // 模块 1：琥珀半调点阵块 + 文字示意线 + S 形路径矢
    const h1 = Math.round(availH * 0.24);
    drawHalftoneBlock(rx, ry, rw, h1, ease);
    const l1Start = ry + h1 + (m.compact ? 8 : 11);
    ctx.strokeStyle = COLORS.ruleSoft;
    ctx.lineWidth = 1.1;
    for (let k = 0; k < 2; k++) {
      const y = l1Start + k * (m.compact ? 8 : 10);
      ctx.beginPath();
      ctx.moveTo(rx, y);
      ctx.lineTo(rx + rw, y);
      ctx.stroke();
    }
    const s1Y = l1Start + (m.compact ? 14 : 18);
    if (rw > 54) {
      drawSCurveArrow(rx + 4, s1Y, rx + rw, s1Y + (m.compact ? 14 : 18), COLORS.ruleBlue, 1.8);
    }

    // 模块 2：琥珀实心圆 + 右侧文字排线 + S 形路径矢
    const ry2 = ry + Math.round(availH * 0.38);
    const rad = Math.max(12, Math.min(Math.round(availH * 0.115), Math.round(rw * 0.22)));
    ctx.fillStyle = COLORS.amber;
    ctx.beginPath();
    ctx.arc(rx + rad + 2, ry2 + rad, rad * ease, 0, Math.PI * 2);
    ctx.fill();

    const textColX = rx + rad * 2 + (m.compact ? 10 : 16);
    const textColW = rx + rw - textColX;
    if (textColW > 16) {
      ctx.strokeStyle = COLORS.ruleSoft;
      ctx.lineWidth = 1.1;
      for (let k = 0; k < 4; k++) {
        const y = ry2 + 4 + k * ((rad * 1.9) / 3.4);
        ctx.beginPath();
        ctx.moveTo(textColX, y);
        ctx.lineTo(rx + rw, y);
        ctx.stroke();
      }
    }
    const s2Y = ry2 + rad * 2 + (m.compact ? 9 : 13);
    if (rw > 54) {
      drawSCurveArrow(rx + 4, s2Y, rx + rw, s2Y + (m.compact ? 13 : 16), COLORS.ruleBlue, 1.8);
    }

    // 模块 3：琥珀实心方 + 蓝图斜线对照方（133 原海报最经典「对照」母题！）
    const ry3 = ry + Math.round(availH * 0.72);
    const boxGap = Math.max(6, Math.round(rw * 0.08));
    const boxS = Math.max(16, Math.min(Math.round(availH * 0.2), Math.round((rw - boxGap) / 2)));
    // 实心琥珀方
    ctx.fillStyle = COLORS.amber;
    ctx.fillRect(rx, ry3, boxS * ease, boxS * ease);
    // 蓝图对角线框方
    const bx2 = rx + boxS + boxGap;
    if (bx2 + boxS <= rx + rw + 4) {
      ctx.strokeStyle = COLORS.ruleBlue;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx2 + 0.5, ry3 + 0.5, boxS - 1, boxS - 1);
      ctx.beginPath();
      ctx.moveTo(bx2 + 1, ry3 + 1);
      ctx.lineTo(bx2 + boxS - 1, ry3 + boxS - 1);
      ctx.stroke();
    }
    const s3Y = ry3 + boxS + (m.compact ? 8 : 11);
    if (rw > 54 && s3Y + 14 < m.padTop + m.innerH) {
      drawSCurveArrow(rx + 4, s3Y, rx + rw, s3Y + (m.compact ? 11 : 14), COLORS.ruleBlue, 1.8);
    }
  }

  // ---- 标本 2：书刊连读·双栏专稿（真实跨栏文字流） ----
  function drawArticleSpecimen(m, state, ease, drift, bleedYList) {
    const spec = SPECIMENS.article;
    const padIn = m.compact ? 7 : 12;
    const headY = m.padTop + (m.compact ? 12 : 16);

    // 刊头小标
    ctx.fillStyle = COLORS.cream;
    ctx.font = `900 ${Math.round(m.fontSize * 1.18)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(spec.title, m.leftX + padIn, headY, Math.max(40, m.leftW - padIn * 2));

    // 若双头抢焦开启，右栏顶放一个刺眼伪标题块抢入口
    let rightStartY = headY + Math.round(m.leadingPx * 1.35) + drift;
    if (state.entryClash) {
      const ch = m.compact ? 26 : 30;
      const cw = Math.max(44, m.rightW - padIn * 2);
      ctx.fillStyle = COLORS.amber;
      ctx.fillRect(m.rightX + padIn, headY + drift, cw, ch);
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(m.rightX + padIn + 1, headY + drift + 1, cw - 2, ch - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "#001438";
      ctx.font = `900 ${m.compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(cw > 140 ? "× 右栏抢焦标 · 点此撤" : "× 抢焦 · 点撤", m.rightX + padIn + 6, headY + drift + ch / 2 + 0.5);
      hitZones.clashBox = { x: m.rightX + padIn, y: headY + drift, w: cw, h: ch };
      rightStartY = headY + drift + ch + 10;
    }

    const bodyStartY = headY + Math.round(m.leadingPx * 1.35);
    ctx.font = `400 ${m.fontSize}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";

    // 左栏文字
    const maxY = m.padTop + m.innerH - 24;
    let ly = bodyStartY;
    for (let i = 0; i < m.leftLines.length; i++) {
      if (ly + m.leadingPx > maxY) break;
      ctx.fillStyle = COLORS.text;
      ctx.fillText(m.leftLines[i], m.leftX + padIn, ly);
      if (i < 4) bleedYList.push(ly + m.fontSize * 0.55);
      ly += m.leadingPx;
    }

    // 右栏续接文字
    let ry = rightStartY;
    for (let i = 0; i < m.rightLines.length; i++) {
      if (ry + m.leadingPx > maxY) break;
      ctx.fillStyle = COLORS.text;
      ctx.fillText(m.rightLines[i], m.rightX + padIn, ry);
      ry += m.leadingPx;
    }

    // 底部实测字数读数
    ctx.font = `600 ${m.compact ? 10 : 10.5}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = m.probes.column.ok ? COLORS.ruleBlue : COLORS.err;
    ctx.fillText(`左栏 ${m.leftChars} 字/行`, m.leftX + padIn, m.padTop + m.innerH - 18, Math.max(40, m.leftW - padIn * 2));
    ctx.fillText(`右栏 ${m.rightChars} 字/行`, m.rightX + padIn, m.padTop + m.innerH - 18, Math.max(40, m.rightW - padIn * 2));
  }

  // ---- 标本 3：左右对照·方案对比 ----
  function drawCompareSpecimen(m, state, ease, drift, bleedYList) {
    const spec = SPECIMENS.compare;
    const padIn = m.compact ? 7 : 12;
    const topY = m.padTop + (m.compact ? 12 : 16);
    const lInner = Math.max(44, m.leftW - padIn * 2);
    const rInner = Math.max(44, m.rightW - padIn * 2);

    // 表头：左栏 vs 右栏
    const headH = m.compact ? 26 : 30;
    ctx.fillStyle = state.entryClash ? COLORS.amber : "rgba(106, 154, 227, 0.16)";
    ctx.fillRect(m.leftX + padIn, topY, lInner, headH);
    ctx.fillStyle = COLORS.amber;
    ctx.fillRect(m.rightX + padIn, topY + drift, rInner, headH);

    if (state.entryClash) {
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(m.leftX + padIn + 1, topY + 1, lInner - 2, headH - 2);
      ctx.setLineDash([]);
      hitZones.clashBox = { x: m.leftX + padIn, y: topY, w: lInner, h: headH };
    }

    ctx.font = `800 ${m.compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = state.entryClash ? "#001438" : COLORS.cream;
    ctx.fillText(
      state.entryClash ? "× 同色抢主 · 点此弱化左标" : `A · ${spec.leftHead}`,
      m.leftX + padIn + 8,
      topY + headH / 2 + 0.5,
      lInner - 14
    );
    ctx.fillStyle = "#001438";
    ctx.fillText(`B · ${spec.rightHead}`, m.rightX + padIn + 8, topY + drift + headH / 2 + 0.5, rInner - 14);

    // 4 行平行对比
    const rowStart = topY + headH + (m.compact ? 12 : 16);
    const rowH = Math.floor((m.innerH - headH - (m.compact ? 38 : 48)) / spec.rows.length);

    spec.rows.forEach((row, idx) => {
      const ly = rowStart + idx * rowH;
      const ry = ly + drift;
      if (idx < 3) bleedYList.push(ly + 16);

      // 左栏条目
      ctx.strokeStyle = COLORS.ruleDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.leftX + padIn, ly);
      ctx.lineTo(m.leftX + padIn + lInner, ly);
      ctx.moveTo(m.rightX + padIn, ry);
      ctx.lineTo(m.rightX + padIn + rInner, ry);
      ctx.stroke();

      ctx.font = `700 ${m.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.ruleBlue;
      ctx.textBaseline = "top";
      ctx.fillText(row.key, m.leftX + padIn, ly + 6, lInner);
      ctx.fillStyle = COLORS.amber;
      ctx.fillText(row.key, m.rightX + padIn, ry + 6, rInner);

      ctx.font = `400 ${Math.max(10, m.fontSize - 1)}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = COLORS.text;
      const lLines = wrapText(row.left, lInner, Math.max(10, m.fontSize - 1)).slice(0, 2);
      const rLines = wrapText(row.right, rInner, Math.max(10, m.fontSize - 1)).slice(0, 2);
      lLines.forEach((s, k) => ctx.fillText(s, m.leftX + padIn, ly + 22 + k * (m.fontSize + 4), lInner));
      rLines.forEach((s, k) => ctx.fillText(s, m.rightX + padIn, ry + 22 + k * (m.fontSize + 4), rInner));

      // 指标条
      const barY = ly + rowH - 12;
      const rBarY = ry + rowH - 12;
      ctx.fillStyle = "rgba(106, 154, 227, 0.16)";
      ctx.fillRect(m.leftX + padIn, barY, lInner, 4);
      ctx.fillStyle = COLORS.ruleBlue;
      ctx.fillRect(m.leftX + padIn, barY, lInner * row.lVal * ease, 4);

      ctx.fillStyle = "rgba(245, 158, 24, 0.18)";
      ctx.fillRect(m.rightX + padIn, rBarY, rInner, 4);
      ctx.fillStyle = COLORS.amber;
      ctx.fillRect(m.rightX + padIn, rBarY, rInner * row.rVal * ease, 4);
    });
  }

  // 阅读路径演播光珠叠加层
  function drawReadingFlowOverlay(m, state, prog) {
    const pts =
      state.specimen === "compare"
        ? [
            { x: m.leftX + m.leftW * 0.25, y: m.padTop + m.innerH * 0.22 },
            { x: m.rightX + m.rightW * 0.75, y: m.padTop + m.innerH * 0.22 },
            { x: m.leftX + m.leftW * 0.25, y: m.padTop + m.innerH * 0.55 },
            { x: m.rightX + m.rightW * 0.75, y: m.padTop + m.innerH * 0.55 },
            { x: m.leftX + m.leftW * 0.25, y: m.padTop + m.innerH * 0.84 },
            { x: m.rightX + m.rightW * 0.75, y: m.padTop + m.innerH * 0.84 },
          ]
        : [
            { x: m.leftX + m.leftW * 0.5, y: m.padTop + m.innerH * 0.16 },
            { x: m.leftX + m.leftW * 0.5, y: m.padTop + m.innerH * 0.84 },
            { x: m.rightX + m.rightW * 0.5, y: m.padTop + m.innerH * 0.18 },
            { x: m.rightX + m.rightW * 0.5, y: m.padTop + m.innerH * 0.84 },
          ];

    ctx.save();
    ctx.strokeStyle = state.flowPlaying ? "rgba(62, 224, 168, 0.65)" : "rgba(106, 154, 227, 0.28)";
    ctx.lineWidth = state.flowPlaying ? 2 : 1.3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    // 沿折线插值光珠位置
    const segs = pts.length - 1;
    const raw = prog * segs;
    const si = Math.min(segs - 1, Math.floor(raw));
    const localT = raw - si;
    const a = pts[si];
    const b = pts[si + 1];
    const bx = a.x + (b.x - a.x) * localT;
    const by = a.y + (b.y - a.y) * localT;

    ctx.fillStyle = "rgba(62, 224, 168, 0.25)";
    ctx.beginPath();
    ctx.arc(bx, by, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ok;
    ctx.beginPath();
    ctx.arc(bx, by, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---- 指针与触屏交互（兼容鼠标、手指与 perf.mjs 触控拖拽） ----
  function localXY(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function inBox(pt, box) {
    return box && pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  function classifyHit(pt, m) {
    if (inBox(pt, hitZones.clashBox)) return "clash";
    if (inBox(pt, hitZones.driftBox)) return "drift";
    if (inBox(pt, hitZones.gutterPill)) return "gutterPill";
    const railTol = 12;
    if (m.gutterPx >= 20 && Math.abs(pt.x - m.gutterX) <= railTol) return "gutterL";
    if (m.gutterPx >= 20 && Math.abs(pt.x - (m.gutterX + m.gutterPx)) <= railTol) return "gutterR";
    return "split";
  }

  canvas.addEventListener("pointerdown", (ev) => {
    const pt = localXY(ev);
    const st = getState();
    const m = evaluate(st, viewW, viewH);
    const kind = classifyHit(pt, m);
    activeDrag = {
      id: ev.pointerId,
      mode: kind,
      startX: pt.x,
      startY: pt.y,
      startLeft: st.leftRatio,
      startGutter: st.gutterRatio,
      innerW: m.innerW,
      moved: false,
    };
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pt = localXY(ev);
    const st = getState();
    const m = evaluate(st, viewW, viewH);

    if (!activeDrag) {
      const hit = classifyHit(pt, m);
      hoverMode = hit;
      canvas.style.cursor =
        hit === "clash" || hit === "drift" || hit === "gutterPill"
          ? "pointer"
          : hit === "gutterL" || hit === "gutterR"
            ? "col-resize"
            : "ew-resize";
      return;
    }

    const dx = pt.x - activeDrag.startX;
    const dy = pt.y - activeDrag.startY;
    if (!activeDrag.moved && Math.hypot(dx, dy) > 4) {
      activeDrag.moved = true;
    }
    if (!activeDrag.moved) return;

    const iw = Math.max(180, activeDrag.innerW);
    const deferDraw = !reducedMotion.matches;
    dirty = true;
    if (activeDrag.mode === "gutterL") {
      // 拖左虚线轨：向左拉宽栏距，向右收窄栏距
      const nextG = clamp(activeDrag.startGutter - (dx * 2) / iw, 0.008, 0.22);
      setState({ gutterRatio: nextG }, deferDraw);
    } else if (activeDrag.mode === "gutterR") {
      const nextG = clamp(activeDrag.startGutter + (dx * 2) / iw, 0.008, 0.22);
      setState({ gutterRatio: nextG }, deferDraw);
    } else {
      // 拖画布或中缝主体：连续滑动左右栏宽比例（靠近经典比值轻吸附）
      let nextL = clamp(activeDrag.startLeft + dx / iw, 0.22, 0.78);
      for (const snap of SNAP_SPLITS) {
        if (Math.abs(nextL - snap) < 0.012) {
          nextL = snap;
          break;
        }
      }
      setState({ leftRatio: nextL }, deferDraw);
    }
  });

  function endDrag(ev) {
    if (!activeDrag) return;
    const drag = activeDrag;
    activeDrag = null;
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch {}

    if (!drag.moved) {
      const st = getState();
      if (drag.mode === "clash") {
        setState({ entryClash: !st.entryClash });
      } else if (drag.mode === "drift") {
        setState({ baselineDrift: 0 });
      } else if (drag.mode === "gutterPill") {
        const spec = SPECIMENS[st.specimen] || SPECIMENS.poster;
        const nextG = st.gutterRatio < 0.04 || st.gutterRatio > 0.14 ? spec.idealGutter : 0.011;
        setState({ gutterRatio: nextG });
      }
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    activeDrag = null;
  });

  // 键盘微调支持（让画布本身也能聚焦并按方向键操控）
  canvas.addEventListener("keydown", (ev) => {
    const st = getState();
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      setState({ leftRatio: clamp(st.leftRatio - 0.02, 0.22, 0.78) });
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      setState({ leftRatio: clamp(st.leftRatio + 0.02, 0.22, 0.78) });
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setState({ gutterRatio: clamp(st.gutterRatio + 0.012, 0.008, 0.22) });
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setState({ gutterRatio: clamp(st.gutterRatio - 0.012, 0.008, 0.22) });
    } else if (ev.key === " ") {
      ev.preventDefault();
      setState({ flowPlaying: !st.flowPlaying });
    }
  });

  const rawController = loop(canvas, render);
  const controller = {
    draw() {
      dirty = true;
      rawController.draw();
    },
  };
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      controller.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    resize();
    controller.draw();
  });

  // 立即绘制首帧，确保 0ms 首屏与静态模式清晰
  resize();
  controller.draw();
  return controller;
}
