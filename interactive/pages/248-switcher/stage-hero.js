// 248 切换器 · 开场活体切换器 2D Canvas 控制台
// 1:1 承袭原海报：国际克莱因电光蓝底 + 顶部大圆角胶囊切换轨（亮黄高亮 + 向下尖角）+ 细白圆角外框 4 张联动卡片
// + 中间三段信号传导脉动 + 就地可点红标纠偏 + 横拖顶部游标滑轨（data-perf-drag）流畅物理响应。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, evaluate } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 绘制原海报同款 4 种几何图标（五角星 / 3×3 圆点 / 空心粗环 / 三横杠）
function drawMiniIcon(ctx, kind, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (kind === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size * 0.56 : size * 0.25;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === "dots") {
    const gap = size * 0.34;
    const rad = Math.max(1.3, size * 0.11);
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.arc(cx + c * gap, cy + r * gap, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === "ring") {
    ctx.lineWidth = Math.max(1.8, size * 0.14);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.lineWidth = Math.max(1.8, size * 0.14);
    ctx.lineCap = "round";
    const hw = size * 0.46;
    const gap = size * 0.3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy + i * gap);
      ctx.lineTo(cx + hw, cy + i * gap);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 绘制每张联动卡片内部的活体图形（忠实承袭原海报 4 张卡的图形语言，同时对 3 个题材适配）
function drawCardGraphic(ctx, visual, sceneId, isLit, x, y, w, h, t) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();

  if (sceneId === "poster") {
    if (visual === "toggle") {
      // 原海报卡片 1：纯黑圆角大胶囊 + 右侧电光蓝圆钮（激活时呼吸微动）
      const pw = Math.min(w * 0.78, h * 1.95);
      const ph = pw * 0.52;
      const px = cx - pw / 2;
      const py = cy - ph / 2;
      roundRectPath(ctx, px, py, pw, ph, ph / 2);
      ctx.fillStyle = isLit ? "#080A12" : "#A9ACB5";
      ctx.fill();
      const knobR = ph * 0.38;
      const shift = isLit ? (pw - ph) * 0.5 + Math.sin(t * 2.2) * 1.5 : -(pw - ph) * 0.42;
      ctx.beginPath();
      ctx.arc(cx + shift, cy, knobR, 0, Math.PI * 2);
      ctx.fillStyle = isLit ? PALETTE.cobalt : "#D0D2D8";
      ctx.fill();
    } else if (visual === "tabs") {
      // 原海报卡片 2：重叠标签窗口图形
      const bw = Math.min(w * 0.78, h * 1.85);
      const bh = bw * 0.56;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      // 后窗
      roundRectPath(ctx, bx, by, bw * 0.7, bh * 0.78, 6);
      ctx.fillStyle = isLit ? "#1E45EA" : "#B6B8C0";
      ctx.fill();
      roundRectPath(ctx, bx, by, bw * 0.7, bh * 0.2, 6);
      ctx.fillStyle = isLit ? "#0D2487" : "#9FA2AC";
      ctx.fill();
      // 前窗
      roundRectPath(ctx, bx + bw * 0.34, by + bh * 0.24, bw * 0.66, bh * 0.76, 6);
      ctx.fillStyle = isLit ? PALETTE.yellow : "#C7C9D0";
      ctx.fill();
      roundRectPath(ctx, bx + bw * 0.34, by + bh * 0.24, bw * 0.66, bh * 0.18, 6);
      ctx.fillStyle = isLit ? "#140700" : "#A8ABB4";
      ctx.fill();
    } else if (visual === "view") {
      // 原海报卡片 3：左 2×2 网格卡 + 右 3 行列表卡
      const gw = Math.min(w * 0.82, h * 2.05);
      const gh = gw * 0.48;
      const gap = gw * 0.08;
      const cardW = (gw - gap) / 2;
      const lx = cx - gw / 2;
      const ly = cy - gh / 2;
      // 左网格卡
      roundRectPath(ctx, lx, ly, cardW, gh, 6);
      ctx.fillStyle = isLit ? "#EDF2FF" : "#C6C8CF";
      ctx.fill();
      const pad = cardW * 0.18;
      const cw = (cardW - pad * 2 - 4) / 2;
      const ch = (gh - pad * 2 - 4) / 2;
      ctx.fillStyle = isLit ? PALETTE.cobalt : "#5C606C";
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillRect(lx + pad + c * (cw + 4), ly + pad + r * (ch + 4), cw, ch);
        }
      }
      // 右列表卡
      const rx = lx + cardW + gap;
      roundRectPath(ctx, rx, ly, cardW, gh, 6);
      ctx.fillStyle = isLit ? "#FFF5CC" : "#C6C8CF";
      ctx.fill();
      ctx.fillStyle = isLit ? "#140700" : "#5C606C";
      for (let i = 0; i < 3; i++) {
        const barY = ly + gh * (0.26 + i * 0.24) - 1.5;
        ctx.fillRect(rx + pad, barY, cardW - pad * 2, 3);
      }
    } else {
      // 原海报卡片 4：居中圆形三点溢出徽
      const rad = Math.min(w * 0.28, h * 0.44);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fillStyle = isLit ? PALETTE.cobalt : "#BCBEC6";
      ctx.fill();
      const dr = Math.max(2.2, rad * 0.14);
      ctx.fillStyle = isLit ? PALETTE.yellow : "#525661";
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(cx + i * rad * 0.44, cy, dr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (sceneId === "docs") {
    // 云文档多视图图形
    const bw = Math.min(w * 0.84, h * 1.9);
    const bh = bw * 0.56;
    const bx = cx - bw / 2;
    const by = cy - bh / 2;
    roundRectPath(ctx, bx, by, bw, bh, 6);
    ctx.fillStyle = isLit ? "#EDF2FF" : "#D3D5DC";
    ctx.fill();
    if (visual === "toggle") {
      // 正文段落行
      ctx.fillStyle = isLit ? PALETTE.cobalt : "#7A7E8C";
      ctx.fillRect(bx + 10, by + 9, bw * 0.48, 4.5);
      ctx.fillStyle = isLit ? "#283558" : "#979BA8";
      ctx.fillRect(bx + 10, by + 19, bw - 20, 3);
      ctx.fillRect(bx + 10, by + 26, bw * 0.78, 3);
      ctx.fillStyle = isLit ? PALETTE.yellow : "#AEB2BD";
      ctx.fillRect(bx + 10, by + 34, bw * 0.52, 4);
    } else if (visual === "tabs") {
      // 三列看板
      const colW = (bw - 20) / 3;
      for (let i = 0; i < 3; i++) {
        const cx0 = bx + 6 + i * (colW + 4);
        ctx.fillStyle = isLit ? (i === 1 ? PALETTE.yellow : "#FFFFFF") : "#C1C4CD";
        roundRectPath(ctx, cx0, by + 7, colW, bh - 14, 4);
        ctx.fill();
        ctx.fillStyle = isLit ? PALETTE.cobalt : "#7F8390";
        ctx.fillRect(cx0 + 4, by + 12, colW - 8, 4);
        ctx.fillRect(cx0 + 4, by + 20, colW * 0.7, 3);
      }
    } else if (visual === "view") {
      // 字段表格
      ctx.strokeStyle = isLit ? "#8EA8FF" : "#A6A9B4";
      ctx.lineWidth = 1;
      for (let r = 1; r <= 3; r++) {
        const ry = by + (bh / 4) * r;
        ctx.beginPath();
        ctx.moveTo(bx + 6, ry);
        ctx.lineTo(bx + bw - 6, ry);
        ctx.stroke();
      }
      ctx.fillStyle = isLit ? PALETTE.cobalt : "#7A7E8C";
      ctx.fillRect(bx + 6, by + 5, bw - 12, bh / 4 - 6);
    } else {
      // 溢出三点菜单展开
      ctx.fillStyle = isLit ? "#0B1226" : "#8F93A0";
      roundRectPath(ctx, cx - 22, by + 6, 44, bh - 12, 5);
      ctx.fill();
      ctx.fillStyle = isLit ? PALETTE.yellow : "#D6D8DF";
      ctx.fillRect(cx - 15, by + 13, 30, 3);
      ctx.fillStyle = isLit ? "#FFFFFF" : "#C2C5CE";
      ctx.fillRect(cx - 15, by + 21, 22, 2.5);
      ctx.fillRect(cx - 15, by + 28, 26, 2.5);
    }
  } else {
    // 数据看板图形（柱状 / 折线 / 漏斗 / 汇总）
    const bw = Math.min(w * 0.84, h * 1.9);
    const bh = bw * 0.56;
    const bx = cx - bw / 2;
    const by = cy - bh / 2;
    roundRectPath(ctx, bx, by, bw, bh, 6);
    ctx.fillStyle = isLit ? "#EEF3FF" : "#D3D5DC";
    ctx.fill();
    if (visual === "toggle") {
      const vals = [0.42, 0.72, 0.58, 0.9, 0.76];
      const barW = (bw - 26) / vals.length;
      vals.forEach((v, i) => {
        const h0 = (bh - 16) * v;
        ctx.fillStyle = isLit ? (i === 3 ? PALETTE.yellow : PALETTE.cobalt) : "#969AA6";
        ctx.fillRect(bx + 8 + i * (barW + 2.5), by + bh - 8 - h0, barW, h0);
      });
    } else if (visual === "tabs") {
      ctx.strokeStyle = isLit ? PALETTE.cobalt : "#818592";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      const pts = [0.7, 0.5, 0.62, 0.28, 0.36, 0.16];
      pts.forEach((p, i) => {
        const px = bx + 10 + (i / (pts.length - 1)) * (bw - 20);
        const py = by + 8 + p * (bh - 16);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.fillStyle = isLit ? PALETTE.yellow : "#767A86";
      ctx.beginPath();
      ctx.arc(bx + bw - 10, by + 8 + 0.16 * (bh - 16), 3.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (visual === "view") {
      const widths = [0.84, 0.64, 0.44, 0.28];
      widths.forEach((wf, i) => {
        const rw = (bw - 16) * wf;
        ctx.fillStyle = isLit ? (i === 0 ? PALETTE.cobalt : i === 3 ? PALETTE.yellow : "#3C62F5") : "#969AA6";
        ctx.fillRect(cx - rw / 2, by + 7 + i * ((bh - 14) / 4), rw, (bh - 22) / 4);
      });
    } else {
      ctx.fillStyle = isLit ? PALETTE.cobalt : "#9EA2AE";
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(bw, bh) * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isLit ? PALETTE.yellow : "#C7C9D1";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Math.min(bw, bh) * 0.34, -Math.PI / 2, Math.PI * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

export function mountHeroStage(canvas, state, callbacks) {
  const ctx = canvas.getContext("2d");
  let hitZones = []; // 每次绘制实时记录可点击热区（顶部格、卡片、红标、溢出项）
  let barRect = { x: 0, y: 0, w: 600, h: 52, cols: 4, rows: 1 };
  let lastW = 0;
  let lastH = 0;
  const wrapCache = new Map();
  let dirty = true; // 按需重绘标记（静置无动画时省电，拖动/点击/加载/脉冲时满帧重绘）

  function wrapLines(raw, maxW, canTwoLines, fontStr) {
    const key = `${raw}|${Math.round(maxW)}|${canTwoLines ? 2 : 1}|${fontStr}`;
    let hit = wrapCache.get(key);
    if (hit) return hit;
    ctx.font = fontStr;
    let line1 = "";
    let line2 = "";
    for (const ch of raw) {
      if (ctx.measureText(line1 + ch).width <= maxW) {
        line1 += ch;
      } else if (canTwoLines) {
        if (ctx.measureText(line2 + ch).width <= maxW - 10) line2 += ch;
        else { line2 = line2.slice(0, -1) + "…"; break; }
      } else {
        line1 = line1.slice(0, -1) + "…";
        break;
      }
    }
    hit = [line1, line2];
    if (wrapCache.size > 160) wrapCache.clear();
    wrapCache.set(key, hit);
    return hit;
  }

  // 给外部读取实绘条宽（用于 model.js 单真源核算）
  const getBarWidth = () => Math.max(260, barRect.w || canvas.clientWidth - 28);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    // 手机小屏像素比限 1.5（兼顾清晰度与慢机软件渲染 60fps）
    const dpr = pixelRatio(w < 520 ? 1.5 : 2);
    if (w !== lastW || h !== lastH || canvas.width !== Math.round(w * dpr)) {
      lastW = w;
      lastH = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
    return { w, h, dpr };
  }

  function render(t, dt, { still }) {
    const { w, h, dpr } = resize();
    const compact = w < 520;
    const ultraShort = h < 270;
    const padX = compact ? 12 : 22;
    const padTop = compact ? 10 : 14;
    const barW = w - padX * 2;
    const ev = evaluate(state, barW);

    // 弹簧插值更新游标位置与异步加载进度
    let animating = false;
    if (still) {
      state.cursorPos = ev.activeIdx;
      state.signalPulse = 1;
      dirty = true;
    } else if (dt > 0) {
      if (!state.dragging) {
        const diff = ev.activeIdx - state.cursorPos;
        if (Math.abs(diff) >= 0.003) {
          state.cursorPos += diff * Math.min(1, dt * 16);
          animating = true;
        } else if (state.cursorPos !== ev.activeIdx) {
          state.cursorPos = ev.activeIdx;
          animating = true;
        }
      }
      if (state.signalPulse < 1) {
        state.signalPulse = Math.min(1, state.signalPulse + dt * 2.8);
        animating = true;
      }
      if (state.signalBrokenFlash > 0) {
        state.signalBrokenFlash = Math.max(0, state.signalBrokenFlash - dt * 1.6);
        animating = true;
      }
      if (state.doneFlash > 0) {
        state.doneFlash = Math.max(0, state.doneFlash - dt * 0.9);
        animating = true;
      }
      if (state.loading) {
        const dur = Math.max(0.18, state.latencyMs / 1000);
        state.loadingProgress = Math.min(1, state.loadingProgress + dt / dur);
        animating = true;
        if (state.loadingProgress >= 1) {
          state.loading = false;
          state.renderedIdx = state.loadingTarget;
          state.doneFlash = 1;
          callbacks.onSyncUI?.();
        }
      }
      if (state.probeState === "loading") animating = true;
    }

    if (!dirty && !animating && !state.dragging) return;
    dirty = false;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hitZones = [];

    // 1. 画布背景：纯正 248 原海报电光钴蓝（单次 fillRect，避免 180 次小点绘制拖慢软件渲染）
    ctx.fillStyle = PALETTE.cobalt;
    ctx.fillRect(0, 0, w, h);

    // 2. 顶部大圆角胶囊切换轨（1:1 承袭原海报）
    const singleRowH = ev.rows === 2
      ? (compact ? 35 : (ultraShort ? 34 : 42))
      : (compact ? 42 : (ultraShort ? 42 : 50));
    const barH = ev.rows === 2 ? singleRowH * 2 + 4 : singleRowH;
    const barX = padX;
    const barY = padTop;
    const barRadius = compact ? 12 : 16;
    barRect = { x: barX, y: barY, w: barW, h: barH, cols: ev.colsPerRow, rows: ev.rows };

    // 整轨底板（冷灰白 #EBEBED）
    roundRectPath(ctx, barX, barY, barW, barH, barRadius);
    ctx.fillStyle = ev.hl.idleBg;
    ctx.fill();

    // 若为双排折行错态，绘出醒目警示虚线红框提示折行违例
    if (ev.rows === 2) {
      ctx.save();
      roundRectPath(ctx, barX - 3, barY - 3, barW + 6, barH + 6, barRadius + 3);
      ctx.strokeStyle = "#FF8FA3";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    }

    const slotW = barW / ev.colsPerRow;
    const rowH = ev.rows === 2 ? (barH - 4) / 2 : barH;

    // 绘制竖向分隔细线
    ctx.strokeStyle = "rgba(20, 7, 0, 0.12)";
    ctx.lineWidth = 1;
    for (let c = 1; c < ev.colsPerRow; c++) {
      const sx = barX + c * slotW;
      ctx.beginPath();
      ctx.moveTo(sx, barY + 8);
      ctx.lineTo(sx, barY + barH - 8);
      ctx.stroke();
    }
    if (ev.rows === 2) {
      ctx.beginPath();
      ctx.moveTo(barX + 8, barY + rowH + 2);
      ctx.lineTo(barX + barW - 8, barY + rowH + 2);
      ctx.stroke();
    }

    // 计算当前滑块坐标（单排支持连续流畅横拖；双排则按行/列落位）
    const activeRow = ev.rows === 2 ? Math.floor(ev.activeIdx / ev.colsPerRow) : 0;
    const activeColFloat = ev.rows === 2
      ? (ev.activeIdx % ev.colsPerRow)
      : Math.max(0, Math.min(ev.colsPerRow - 1, state.cursorPos));
    const pillX = barX + activeColFloat * slotW;
    const pillY = barY + activeRow * (rowH + 4);

    // 高亮滑块裁剪在轨道圆角内
    ctx.save();
    roundRectPath(ctx, barX, barY, barW, barH, barRadius);
    ctx.clip();
    ctx.fillStyle = ev.hl.bg;
    ctx.fillRect(pillX, pillY, slotW, rowH);
    if (ev.hl.id === "weak") {
      ctx.strokeStyle = "rgba(20, 7, 0, 0.22)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pillX + 1, pillY + 1, slotW - 2, rowH - 2);
    }
    ctx.restore();

    // 标志性向下小三角尖角（原海报核心视觉母题！）
    const caretX = pillX + slotW / 2;
    const caretY = pillY + rowH;
    if (state.pointerCaret) {
      const cw = compact ? 8 : 11;
      const ch = compact ? 7 : 9;
      ctx.beginPath();
      ctx.moveTo(caretX - cw, caretY - 0.5);
      ctx.lineTo(caretX + cw, caretY - 0.5);
      ctx.lineTo(caretX, caretY + ch);
      ctx.closePath();
      ctx.fillStyle = ev.hl.bg;
      ctx.fill();
    }

    // 绘制每一个切换格的文字、图标、悬停态与聚焦双环
    const slotFontSize = compact
      ? (ev.colsPerRow >= 6 ? 10.5 : 12.5)
      : (ev.colsPerRow >= 6 ? 12 : 16);
    ev.visibleSlots.forEach((slot, idx) => {
      const r = ev.rows === 2 ? Math.floor(idx / ev.colsPerRow) : 0;
      const c = ev.rows === 2 ? idx % ev.colsPerRow : idx;
      const sx = barX + c * slotW;
      const sy = barY + r * (rowH + 4);
      const isAct = idx === ev.activeIdx;
      const isHover = (state.hoverIdx === idx || (state.probeState === "hover" && idx === (ev.activeIdx + 1) % ev.visibleSlots.length))
        && !isAct && state.microStates === "full";
      const isFocus = (state.probeState === "focus" && isAct) || (state.focusIdx === idx && state.microStates === "full" && state.activation === "manual");

      if (isHover) {
        ctx.save();
        roundRectPath(ctx, sx + 3, sy + 3, slotW - 6, rowH - 6, 8);
        ctx.fillStyle = "rgba(0, 49, 237, 0.10)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 49, 237, 0.45)";
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      if (isFocus) {
        ctx.save();
        roundRectPath(ctx, sx + 3, sy + 3, slotW - 6, rowH - 6, 10);
        ctx.strokeStyle = isAct ? "#0B1226" : PALETTE.cobalt;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        roundRectPath(ctx, sx + 6, sy + 6, slotW - 12, rowH - 12, 7);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      const fg = isAct ? ev.hl.fg : "#1A1E2A";
      const showIcon = slotW >= (compact ? 74 : 112);
      const labelText = slotW < 76 ? slot.short : slot.title;
      ctx.font = `700 ${slotFontSize}px "Noto Sans SC", sans-serif`;
      const textW = ctx.measureText(labelText).width;
      const iconS = compact ? 12 : 16;
      const gapI = showIcon ? (compact ? 6 : 9) : 0;
      const totalW = (showIcon ? iconS : 0) + gapI + textW;
      const startX = sx + (slotW - totalW) / 2;
      const midY = sy + rowH / 2;

      if (showIcon) {
        drawMiniIcon(ctx, slot.icon, startX + iconS / 2, midY, iconS, fg);
      }
      ctx.fillStyle = fg;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, startX + (showIcon ? iconS + gapI : 0), midY + 0.5);

      // 如果正在加载当前目标项，或探针强制显示 LOADING / DONE
      const showLoading = (state.loading && state.loadingTarget === idx && state.microStates === "full") || (state.probeState === "loading" && isAct);
      const showDone = ((state.doneFlash > 0.05 && isAct && state.microStates === "full") || (state.probeState === "done" && isAct)) && !showLoading;
      if (showLoading) {
        const lx = sx + slotW - (compact ? 14 : 20);
        ctx.save();
        ctx.translate(lx, midY);
        ctx.rotate(t * 5.2);
        ctx.strokeStyle = isAct ? fg : PALETTE.cobalt;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, compact ? 5.5 : 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (showDone) {
        const lx = sx + slotW - (compact ? 14 : 20);
        ctx.save();
        ctx.strokeStyle = isAct && ev.hl.id !== "cobalt" ? "#0B6B46" : "#7FFFD4";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(lx - 4, midY);
        ctx.lineTo(lx - 1, midY + 3.5);
        ctx.lineTo(lx + 5, midY - 3.5);
        ctx.stroke();
        ctx.restore();
      }

      hitZones.push({
        type: "tab",
        idx,
        x: sx,
        y: sy,
        w: slotW,
        h: rowH,
      });
    });

    // 3. 中段信号传导通道（把顶部选中游标和下方对应联动卡片连接起来，同时容纳故障红标不压字）
    const linkTop = barY + barH + (state.pointerCaret ? 11 : 6);
    const corridorH = !ev.allPass ? (compact ? 34 : 38) : (compact ? 22 : 26);
    const frameTop = linkTop + corridorH;
    const frameH = Math.max(122, h - frameTop - (compact ? 8 : 10));
    const frameX = padX;
    const frameW = barW;

    // 计算下方 4 张卡片（始终展示 4 格核心面板阵列，与原海报 1:1 呼应；少于 4 项时展示对应张数）
    const panelCount = Math.min(4, Math.max(1, ev.visibleSlots.length));
    const innerPad = compact ? 7 : 11;
    const cardGap = compact ? 6 : 12;
    const cardW = (frameW - innerPad * 2 - cardGap * (panelCount - 1)) / panelCount;
    const cardH = frameH - innerPad * 2;
    const targetCardIdx = Math.min(panelCount - 1, ev.panelIdx % panelCount);
    const targetCardCenterX = frameX + innerPad + targetCardIdx * (cardW + cardGap) + cardW / 2;

    // 信号传导折线
    ctx.save();
    const midLinkY = (linkTop + frameTop) / 2;
    const isBroken = state.responseMode !== "synced";
    ctx.strokeStyle = isBroken
      ? "rgba(255, 138, 152, 0.92)"
      : (ev.hl.id === "weak" ? "rgba(255,255,255,0.45)" : PALETTE.yellow);
    ctx.lineWidth = isBroken ? 2 : 2.2;
    if (isBroken) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(caretX, linkTop);
    ctx.lineTo(caretX, midLinkY);
    ctx.lineTo(targetCardCenterX, midLinkY);
    ctx.lineTo(targetCardCenterX, frameTop - 1);
    ctx.stroke();

    // 流动信号光点
    if (!isBroken && !still) {
      const p = state.loading ? ((t * 1.4) % 1) : state.signalPulse;
      const px = caretX + (targetCardCenterX - caretX) * p;
      ctx.fillStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(px, midLinkY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBroken && ev.allPass) {
      const mx = (caretX + targetCardCenterX) / 2;
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.errPillBg;
      roundRectPath(ctx, mx - 11, midLinkY - 9, 22, 18, 9);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 11px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×", mx, midLinkY + 0.5);
    }
    ctx.restore();

    // 4. 下方细白圆角外框（1:1 复刻原海报 4 卡外壳）
    roundRectPath(ctx, frameX, frameTop, frameW, frameH, compact ? 14 : 18);
    ctx.fillStyle = "rgba(0, 29, 156, 0.28)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 绘制联动卡片
    for (let i = 0; i < panelCount; i++) {
      const cx0 = frameX + innerPad + i * (cardW + cardGap);
      const cy0 = frameTop + innerPad;
      const slot = ev.visibleSlots[i] || ev.scene.items[i];
      const displayItem = slot.isOverflowTrigger && slot.pickedOverflow ? slot.pickedOverflow : slot;
      const isLit = i === targetCardIdx;
      const isWeakDim = isLit && ev.hl.id === "weak";
      const cardBg = isLit ? (isWeakDim ? "#EBECEF" : PALETTE.white) : PALETTE.cardIdle;

      ctx.save();
      roundRectPath(ctx, cx0, cy0, cardW, cardH, compact ? 10 : 12);
      ctx.fillStyle = cardBg;
      ctx.fill();
      if (isLit && !isWeakDim) {
        ctx.strokeStyle = ev.hl.id === "yellow" ? "rgba(255, 202, 28, 0.9)" : "rgba(255,255,255,0.95)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 顶部圆点 + 卡片名（原海报风格：亮黄圆点 ● + 粗黑标题）
      const headY = cy0 + (compact ? 15 : 19);
      const dotX = cx0 + (compact ? 9 : 15);
      const dotR = compact ? 4 : 5;
      ctx.beginPath();
      ctx.arc(dotX, headY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = isLit && !isWeakDim
        ? (ev.hl.id === "cobalt" ? PALETTE.cobalt : PALETTE.yellow)
        : PALETTE.dotIdle;
      ctx.fill();

      ctx.fillStyle = isLit ? "#11141E" : "#3E4352";
      ctx.font = `700 ${compact ? 11.5 : 14.5}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const cardTitle = compact && cardW < 88 ? displayItem.short : displayItem.title;
      ctx.fillText(cardTitle, dotX + dotR + (compact ? 5 : 8), headY + 0.5);

      // 左下角原海报招牌箭头 `→`（先算底部安全线，确保文案绝不碰箭头）
      const arrY = cy0 + cardH - (compact ? 12 : 15);
      const arrX = cx0 + (compact ? 9 : 14);

      // 图形区
      const gfxTop = headY + (compact ? 10 : 12);
      const availForGfxAndText = arrY - 10 - gfxTop;
      const gfxH = Math.max(38, Math.min(availForGfxAndText * 0.56, compact ? 74 : 78));
      drawCardGraphic(ctx, displayItem.visual, ev.scene.id, isLit && !isWeakDim, cx0 + 8, gfxTop, cardW - 16, gfxH, t);

      // 文案摘要（按剩余高度自适应 1 行或 2 行，走缓存零多余 measureText，严禁碰触底部箭头）
      const descTop = gfxTop + gfxH + (compact ? 6 : 8);
      const textRoom = arrY - 9 - descTop;
      if (textRoom >= 14) {
        const fontStr = `500 ${compact ? 10 : 12}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = isLit ? "#1D2436" : "#555B6B";
        ctx.font = fontStr;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const textMaxW = cardW - (compact ? 14 : 24);
        const raw = compact ? displayItem.metric : displayItem.desc;
        const canTwoLines = textRoom >= (compact ? 28 : 31);
        const [line1, line2] = wrapLines(raw, textMaxW, canTwoLines, fontStr);
        ctx.fillText(line1, cx0 + (compact ? 7 : 12), descTop);
        if (canTwoLines && line2) {
          ctx.fillText(line2, cx0 + (compact ? 7 : 12), descTop + (compact ? 13 : 16));
        }
      }

      // 绘制箭头
      ctx.strokeStyle = isLit && !isWeakDim ? PALETTE.cobalt : "#7A7E8B";
      ctx.lineWidth = compact ? 1.6 : 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const arrLen = compact ? 12 : 18;
      ctx.beginPath();
      ctx.moveTo(arrX, arrY);
      ctx.lineTo(arrX + arrLen, arrY);
      ctx.moveTo(arrX + arrLen - 4.5, arrY - 4);
      ctx.lineTo(arrX + arrLen, arrY);
      ctx.lineTo(arrX + arrLen - 4.5, arrY + 4);
      ctx.stroke();

      // 慢加载遮罩（当该卡正在等待响应且开启了 LOADING 微状态时）
      if ((state.loading && state.loadingTarget === i && state.microStates === "full") || (state.probeState === "loading" && isLit)) {
        roundRectPath(ctx, cx0, cy0, cardW, cardH, compact ? 10 : 12);
        ctx.fillStyle = "rgba(0, 49, 237, 0.78)";
        ctx.fill();
        const rcx = cx0 + cardW / 2;
        const rcy = cy0 + cardH / 2;
        ctx.fillStyle = PALETTE.yellow;
        ctx.beginPath();
        ctx.arc(rcx, rcy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(rcx, rcy);
        ctx.rotate(t * 4.5);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 11px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`LOADING ${Math.round(state.loading ? state.loadingProgress * 100 : 64)}%`, rcx, rcy + 28);
      }
      ctx.restore();

      hitZones.push({ type: "card", idx: i, x: cx0, y: cy0, w: cardW, h: cardH });
    }

    // 5. 若有溢出菜单打开，在「更多选项」下方浮出精致白底子菜单
    if (state.overflowMenuOpen && ev.overflowItems.length > 0) {
      const mW = Math.min(200, Math.max(146, slotW + 24));
      const itemH = 30;
      const mH = ev.overflowItems.length * itemH + 12;
      const mX = Math.min(w - padX - mW, barX + 3 * slotW + slotW - mW);
      const mY = barY + barH + 8;
      ctx.save();
      roundRectPath(ctx, mX, mY, mW, mH, 10);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = "#0B1226";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ev.overflowItems.forEach((it, j) => {
        const iy = mY + 6 + j * itemH;
        const picked = state.selectedOverflowIdx === it.srcIdx && ev.activeIdx === 3;
        if (picked) {
          roundRectPath(ctx, mX + 6, iy + 2, mW - 12, itemH - 4, 6);
          ctx.fillStyle = PALETTE.yellow;
          ctx.fill();
        }
        ctx.fillStyle = "#0B1226";
        ctx.font = `${picked ? 700 : 500} 12.5px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(it.title, mX + 14, iy + itemH / 2);
        hitZones.unshift({ type: "overflow-item", srcIdx: it.srcIdx, x: mX + 4, y: iy, w: mW - 8, h: itemH });
      });
      ctx.restore();
    }

    // 6. 画布内就地可点故障红标（整齐安放在顶轨与白框之间的电光蓝信号走廊，绝不遮盖任何卡片文字！）
    if (!ev.allPass && !state.overflowMenuOpen) {
      const pills = ev.issues.slice(0, compact ? 1 : 2);
      const th = compact ? 24 : 26;
      const py = linkTop + (corridorH - th) / 2;
      const gapP = 10;
      ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      const widths = pills.map((iss) => ctx.measureText(`× ${iss.badge} · 点修`).width + 20);
      const totalP = widths.reduce((a, b) => a + b, 0) + gapP * (pills.length - 1);
      let curX = Math.max(padX + 6, frameX + (frameW - totalP) / 2);

      pills.forEach((iss, k) => {
        const label = `× ${iss.badge} · 点修`;
        const tw = widths[k];
        const px = Math.min(w - padX - tw - 4, curX);
        curX += tw + gapP;
        ctx.save();
        roundRectPath(ctx, px, py, tw, th, 999);
        ctx.fillStyle = PALETTE.errPillBg;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = PALETTE.errPillFg;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + tw / 2, py + th / 2 + 0.5);
        ctx.restore();
        hitZones.unshift({ type: "fix", fixPatch: iss.fixPatch, x: px, y: py, w: tw, h: th });
      });
    }

    // 7. 底部极细操作提示文字（非全宽侵入，仅宽屏可见）
    if (!compact && ev.allPass) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = `500 11.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("↔ 横拖滑轨切项 · 点击卡片或红标 · 方向键 ←/→ 导航", frameX + frameW - 6, h - 2);
      ctx.restore();
    }
  }

  const runner = loop(canvas, render);
  const redraw = () => {
    dirty = true;
    runner.draw();
  };

  // 触发切换到某个选项索引（统一走单真源响应节奏与微状态）
  function selectTab(idx, { fromKeyboard = false } = {}) {
    const ev = evaluate(state, getBarWidth());
    const clamped = Math.max(0, Math.min(ev.visibleSlots.length - 1, idx));
    const slot = ev.visibleSlots[clamped];
    state.probeState = null;

    if (slot && slot.isOverflowTrigger && !fromKeyboard) {
      state.overflowMenuOpen = !state.overflowMenuOpen;
    } else {
      state.overflowMenuOpen = false;
    }

    state.activeIdx = clamped;
    state.focusIdx = clamped;
    state.signalPulse = 0;

    if (state.responseMode === "synced") {
      if (state.latencyMs > 220) {
        state.loading = true;
        state.loadingProgress = 0;
        state.loadingTarget = clamped;
        state.doneFlash = 0;
      } else {
        state.loading = false;
        state.renderedIdx = clamped;
        state.doneFlash = 0.85;
      }
    } else {
      state.loading = false;
      state.signalBrokenFlash = 1;
    }
    callbacks.onSyncUI?.();
    redraw();
  }

  // 指针与触摸拖拽：支持横拖平滑滑移亮黄游标（同时 perf.mjs 触屏横拖 100% 流畅触发）
  let ptrDown = false;
  let startX = 0;
  let startY = 0;
  let movedHoriz = false;
  let activePointerId = null;

  function toLocal(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function scrubToX(lx) {
    const ev = evaluate(state, getBarWidth());
    const rel = (lx - barRect.x) / Math.max(1, barRect.w);
    const maxCol = Math.max(1, ev.colsPerRow - 1);
    const pos = Math.max(0, Math.min(maxCol, rel * ev.colsPerRow - 0.5));
    state.cursorPos = pos;
    const nearest = Math.round(pos);
    if (nearest !== state.activeIdx && nearest < ev.visibleSlots.length) {
      state.activeIdx = nearest;
      state.focusIdx = nearest;
      state.signalPulse = 0.35;
      if (state.responseMode === "synced" && state.latencyMs <= 220) {
        state.renderedIdx = nearest;
      }
      callbacks.onSyncUI?.();
    }
    dirty = true;
  }

  canvas.addEventListener("pointerdown", (e) => {
    const p = toLocal(e.clientX, e.clientY);
    ptrDown = true;
    movedHoriz = false;
    startX = p.x;
    startY = p.y;
    activePointerId = e.pointerId;
    state.dragging = false;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = toLocal(e.clientX, e.clientY);
    if (ptrDown && (activePointerId === null || e.pointerId === activePointerId)) {
      const dx = p.x - startX;
      const dy = p.y - startY;
      if (!movedHoriz && Math.abs(dx) > 5 && Math.abs(dx) >= Math.abs(dy) * 0.7) {
        movedHoriz = true;
        state.dragging = true;
        state.overflowMenuOpen = false;
      }
      if (movedHoriz) {
        scrubToX(p.x);
      }
      return;
    }
    // 悬停检测（桌面鼠标准确显示 HOVER 微状态）
    const hitTab = hitZones.find((z) => z.type === "tab" && p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h);
    const nextHover = hitTab ? hitTab.idx : -1;
    if (nextHover !== state.hoverIdx) {
      state.hoverIdx = nextHover;
      redraw();
    }
    const overAny = hitZones.some((z) => p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h);
    canvas.style.cursor = overAny ? "pointer" : "ew-resize";
  });

  function endPointer(e) {
    if (!ptrDown) return;
    const p = toLocal(e.clientX, e.clientY);
    const wasDrag = movedHoriz;
    ptrDown = false;
    movedHoriz = false;
    state.dragging = false;
    activePointerId = null;
    if (wasDrag) {
      selectTab(Math.round(state.cursorPos));
      return;
    }
    // 点击命中判定（按优先级：红标 > 溢出子菜单 > 顶轨选项 > 下方卡片）
    const hit = hitZones.find((z) => p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h);
    if (!hit) {
      if (state.overflowMenuOpen) {
        state.overflowMenuOpen = false;
        redraw();
      }
      return;
    }
    if (hit.type === "fix") {
      Object.assign(state, hit.fixPatch);
      if (hit.fixPatch.responseMode === "synced") {
        state.renderedIdx = state.activeIdx;
      }
      callbacks.onSyncUI?.();
      redraw();
    } else if (hit.type === "overflow-item") {
      state.selectedOverflowIdx = hit.srcIdx;
      state.overflowMenuOpen = false;
      selectTab(3);
    } else if (hit.type === "tab" || hit.type === "card") {
      selectTab(hit.idx);
    }
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", () => {
    ptrDown = false;
    movedHoriz = false;
    state.dragging = false;
  });
  canvas.addEventListener("pointerleave", () => {
    if (state.hoverIdx !== -1) {
      state.hoverIdx = -1;
      redraw();
    }
  });

  // 键盘支持（完整 WAI-ARIA Tabs 导航：←/→ 切换，Home/End 首尾，Enter/Space 确认）
  canvas.addEventListener("keydown", (e) => {
    const ev = evaluate(state, getBarWidth());
    const n = ev.visibleSlots.length;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (state.focusIdx + 1) % n;
      state.focusIdx = next;
      if (state.activation === "auto") selectTab(next, { fromKeyboard: true });
      else { callbacks.onSyncUI?.(); redraw(); }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const next = (state.focusIdx - 1 + n) % n;
      state.focusIdx = next;
      if (state.activation === "auto") selectTab(next, { fromKeyboard: true });
      else { callbacks.onSyncUI?.(); redraw(); }
    } else if (e.key === "Home") {
      e.preventDefault();
      state.focusIdx = 0;
      if (state.activation === "auto") selectTab(0, { fromKeyboard: true });
      else { callbacks.onSyncUI?.(); redraw(); }
    } else if (e.key === "End") {
      e.preventDefault();
      state.focusIdx = n - 1;
      if (state.activation === "auto") selectTab(n - 1, { fromKeyboard: true });
      else { callbacks.onSyncUI?.(); redraw(); }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectTab(state.focusIdx, { fromKeyboard: true });
    }
  });

  // 响应视口变化立刻重算实绘条宽并刷新 UI 读数
  new ResizeObserver(() => {
    redraw();
    callbacks.onResize?.();
  }).observe(canvas);

  return {
    draw: redraw,
    selectTab,
    getBarWidth,
  };
}
