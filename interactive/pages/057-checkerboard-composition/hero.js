// 057 棋盘构图 · 开场活体棋盘落子与错缝排演板（2D Canvas）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  COLS,
  ROWS,
  CELL_TITLE,
  CELL_LIGHT,
  CELL_DARK,
  CELL_AMBER,
  COLORS,
  SCRIPTS,
  evaluateBoard,
} from "./model.js";

export function mountHeroCanvas(canvas, state, { onChange, onAudit }) {
  const ctx = canvas.getContext("2d");
  let layout = null; // 缓存当前帧每个格子的精确像素矩形，供点击命中与单真源渲染共用
  let intro = reducedMotion.matches ? 1 : 0;
  let displayPhase = state.phaseOffset; // 视觉平滑插值相位（still 时立即对齐单真源 state.phaseOffset）
  let dragTension = 0; // 触达 ±50% 行程端点时的微阻尼指示
  let dirty = true;
  let hoverIdx = -1;

  // 触屏 / 指针交互状态：区分点击翻子 vs 水平横拖调整偶数行相位（不抢手机竖滚）
  let pointer = null;

  function computeLayout(w, h) {
    const padX = Math.max(12, Math.round(w * 0.036));
    const padTop = Math.max(34, Math.round(h * 0.068));
    const padBottom = Math.max(42, Math.round(h * 0.088));
    const availW = w - padX * 2;
    const availH = h - padTop - padBottom;
    const gap = Math.round((state.gutter / 14) * Math.min(12, Math.max(4, w * 0.02)));
    // 严格保持方格 1:1 正方形比例（绝不在任何视口下把方块拉扁）
    const cellFromW = (availW - gap * (COLS - 1)) / COLS;
    const cellFromH = (availH - gap * (ROWS - 1)) / ROWS;
    const cell = Math.floor(Math.min(cellFromW, cellFromH));
    const boardW = cell * COLS + gap * (COLS - 1);
    const boardH = cell * ROWS + gap * (ROWS - 1);
    const ox = Math.round((w - boardW) / 2);
    const oy = Math.round(padTop + (availH - boardH) / 2);
    const rects = [];
    const phasePx = (displayPhase / 100) * cell * 0.55;

    for (let r = 0; r < ROWS; r++) {
      // 偶数行（r = 0, 2, 4）随 phaseOffset 水平滑移，直观展示纵轴正交错缝
      const rowShift = r % 2 === 0 ? phasePx : 0;
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const x = ox + c * (cell + gap) + rowShift;
        const y = oy + r * (cell + gap);
        rects.push({ idx, r, c, x, y, w: cell, h: cell });
      }
    }
    return { w, h, ox, oy, cell, gap, boardW, boardH, phasePx, rects };
  }

  function hitTest(clientX, clientY) {
    if (!layout) return -1;
    const br = canvas.getBoundingClientRect();
    const x = clientX - br.left;
    const y = clientY - br.top;
    for (const rc of layout.rects) {
      if (state.cells[rc.idx] === CELL_TITLE) continue;
      if (x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h) {
        return rc.idx;
      }
    }
    return -1;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(rect.width < 460 ? 1.5 : 2);
    const cw = Math.round(rect.width * dpr);
    const ch = Math.round(rect.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = computeLayout(rect.width, rect.height);
    dirty = true;
  }

  function applyCellClick(idx, forceAmber = false) {
    if (idx < 0 || state.cells[idx] === CELL_TITLE) return;
    state.selectedIdx = idx;
    if (forceAmber) {
      state.cells[idx] = state.cells[idx] === CELL_AMBER ? CELL_LIGHT : CELL_AMBER;
    } else if (state.brush === "dark") {
      state.cells[idx] = state.cells[idx] === CELL_DARK ? CELL_LIGHT : CELL_DARK;
    } else if (state.brush === "amber") {
      state.cells[idx] = state.cells[idx] === CELL_AMBER ? CELL_LIGHT : CELL_AMBER;
    } else if (state.brush === "light") {
      state.cells[idx] = CELL_LIGHT;
    } else {
      // 默认循环：浅米(0) → 深绿(1) → 琥珀金(2) → 浅米(0)
      state.cells[idx] = (state.cells[idx] + 1) % 3;
    }
    dirty = true;
    onChange("cell");
  }

  // ---------- 几何母题绘制（1:1 承袭 057 原海报，随实/浅/金格自适应反差） ----------
  function drawMotif(rc, val, motif, script) {
    const { x, y, w, h } = rc;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const s = Math.min(w, h);
    if (!motif) return;

    const onDark = val === CELL_DARK;
    const onAmber = val === CELL_AMBER;
    const fg = onDark ? COLORS.cream : onAmber ? COLORS.paper : COLORS.ink;
    const greenStroke = onDark ? "rgba(248,243,231,0.82)" : onAmber ? COLORS.paper : COLORS.green;

    if (onAmber) {
      // 琥珀金格一律呈现 057 原海报招牌「暖白冲孔圆」，视觉焦度最高
      ctx.fillStyle = COLORS.paper;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.21, 0, Math.PI * 2);
      ctx.fill();
      if (motif.label && s >= 64) {
        ctx.fillStyle = COLORS.ink;
        ctx.font = `700 ${Math.max(9, Math.round(s * 0.115))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(motif.label, cx, y + h - s * 0.08);
      }
      return;
    }

    switch (motif.kind) {
      case "dots5": {
        const n = 5;
        const span = s * 0.54;
        const step = span / (n - 1);
        const startX = cx - span / 2;
        const startY = cy - span / 2;
        ctx.fillStyle = onDark ? COLORS.paper : COLORS.green;
        const r = Math.max(1.5, s * 0.022);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            ctx.beginPath();
            ctx.arc(startX + j * step, startY + i * step, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case "dots4": {
        const n = 4;
        const span = s * 0.48;
        const step = span / (n - 1);
        const startX = cx - span / 2;
        const startY = cy - span / 2;
        ctx.fillStyle = fg;
        const r = Math.max(1.8, s * 0.026);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            ctx.beginPath();
            ctx.arc(startX + j * step, startY + i * step, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case "dashedCircle": {
        const box = s * 0.52;
        ctx.save();
        ctx.strokeStyle = greenStroke;
        ctx.lineWidth = Math.max(1.2, s * 0.015);
        ctx.setLineDash([s * 0.055, s * 0.04]);
        ctx.strokeRect(cx - box / 2, cy - box / 2, box, box);
        ctx.restore();
        ctx.fillStyle = onDark ? COLORS.paper : COLORS.green;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.125, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "framedDiamond": {
        const box = s * 0.52;
        ctx.strokeStyle = greenStroke;
        ctx.lineWidth = Math.max(1.2, s * 0.014);
        ctx.strokeRect(cx - box / 2, cy - box / 2, box, box);
        const d = s * 0.175;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx + d, cy);
        ctx.lineTo(cx, cy + d);
        ctx.lineTo(cx - d, cy);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "miniChecker": {
        const box = s * 0.50;
        const sub = box / 3;
        const bx = cx - box / 2;
        const by = cy - box / 2;
        for (let rr = 0; rr < 3; rr++) {
          for (let cc = 0; cc < 3; cc++) {
            const darkSub = (rr + cc) % 2 === 0;
            ctx.fillStyle = darkSub ? fg : onDark ? COLORS.green : COLORS.paper;
            ctx.fillRect(bx + cc * sub, by + rr * sub, sub + 0.3, sub + 0.3);
          }
        }
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx, by, box, box);
        break;
      }
      case "hatch45": {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, w - 4, h - 4);
        ctx.clip();
        ctx.strokeStyle = onDark ? "rgba(248,243,231,0.34)" : "rgba(7,80,49,0.52)";
        ctx.lineWidth = Math.max(1, s * 0.012);
        const step = Math.max(5.5, s * 0.085);
        for (let d = -h; d < w + h; d += step) {
          ctx.beginPath();
          ctx.moveTo(x + d, y + h);
          ctx.lineTo(x + d + h, y);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case "bigCircle": {
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "concentric": {
        ctx.strokeStyle = greenStroke;
        ctx.lineWidth = Math.max(1.1, s * 0.013);
        const sizes = [0.58, 0.45, 0.32, 0.19];
        for (const f of sizes) {
          const b = s * f;
          ctx.strokeRect(cx - b / 2, cy - b / 2, b, b);
        }
        const core = s * 0.12;
        ctx.fillStyle = onDark ? COLORS.paper : COLORS.green;
        ctx.fillRect(cx - core / 2, cy - core / 2, core, core);
        break;
      }
      case "copy": {
        if (s < 42) break;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, w - 4, h - 4);
        ctx.clip();
        const pad = Math.round(s * 0.11);
        const showSub = s >= 82;
        const maxChars = showSub ? Math.max(motif.zh1.length, motif.zh2.length, 6) : Math.max(motif.zh1.length, 4);
        const fzFit = Math.floor((w - pad * 2) / (maxChars + 0.6));
        const fz = Math.max(8.5, Math.min(13, fzFit, Math.round(s * 0.145)));
        ctx.fillStyle = onDark ? COLORS.paper : COLORS.ink;
        ctx.font = `700 ${fz}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = showSub ? "left" : "center";
        ctx.textBaseline = showSub ? "top" : "middle";
        if (showSub) {
          ctx.fillText(motif.zh1, x + pad, y + pad * 1.15);
          ctx.fillText(motif.zh2, x + pad, y + pad * 1.15 + fz * 1.42);
          const enFz = Math.max(8, Math.min(10.5, Math.round(fz * 0.78)));
          ctx.fillStyle = onDark ? "rgba(248,243,231,0.75)" : COLORS.inkMuted;
          ctx.font = `500 ${enFz}px "Space Grotesk", sans-serif`;
          ctx.fillText(motif.en, x + pad, y + h - pad * 1.55);
        } else {
          ctx.fillText(motif.zh1, cx, cy);
        }
        ctx.restore();
        break;
      }
      case "archPlate": {
        // 建筑画册图版：极简几何立面剪影（绝不画人脸五官）
        ctx.strokeStyle = onDark ? "rgba(248,243,231,0.34)" : "rgba(7,80,49,0.28)";
        ctx.lineWidth = 1;
        const m = s * 0.14;
        ctx.strokeRect(x + m, y + m, w - m * 2, h - m * 2);
        ctx.fillStyle = onDark ? "rgba(248,243,231,0.16)" : "rgba(7,80,49,0.12)";
        ctx.fillRect(x + m + 4, y + s * 0.42, (w - m * 2) * 0.42, h - m - s * 0.42 - 4);
        ctx.fillRect(x + m + (w - m * 2) * 0.52, y + s * 0.28, (w - m * 2) * 0.38, h - m - s * 0.28 - 4);
        if (s >= 56) {
          ctx.fillStyle = onDark ? COLORS.paper : COLORS.ink;
          ctx.font = `600 ${Math.max(9, Math.round(s * 0.11))}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(motif.label || "PLATE", x + m + 4, y + m + 4);
        }
        break;
      }
      case "plinth": {
        // 品牌展墙展龛：方形陈列台座 + 极简器物轮廓
        const bx = cx - s * 0.18;
        const by = cy - s * 0.14;
        ctx.strokeStyle = onDark ? "rgba(248,243,231,0.55)" : "rgba(7,80,49,0.55)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, by + s * 0.16, s * 0.36, s * 0.18);
        ctx.fillStyle = onDark ? COLORS.paper : COLORS.green;
        ctx.beginPath();
        ctx.arc(cx, by + s * 0.08, s * 0.085, 0, Math.PI * 2);
        ctx.fill();
        if (s >= 56) {
          ctx.fillStyle = onDark ? "rgba(248,243,231,0.8)" : COLORS.inkMuted;
          ctx.font = `600 ${Math.max(9, Math.round(s * 0.105))}px "IBM Plex Mono", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(motif.label || "EXH", cx, y + h - s * 0.09);
        }
        break;
      }
      case "focalCircle": {
        // 当原本是琥珀格被点成深绿或浅米时，仍保持克制同心圆提示
        ctx.strokeStyle = greenStroke;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.19, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      default:
        break;
    }
  }

  function drawTitlePlaque(r1c1, r1c2, script) {
    const x = r1c1.x;
    const y = r1c1.y;
    const w = r1c2.x + r1c2.w - r1c1.x;
    const h = r1c1.h;
    // 与原海报 057 完全一致的亮暖宣纸底 + 粗黑中文主标 + 深绿全大写英文 + 深绿短横杠
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(7,80,49,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    const padL = Math.round(w * 0.085);
    const zhSize = Math.max(15, Math.min(34, Math.round(h * 0.34)));
    ctx.fillStyle = COLORS.ink;
    ctx.font = `900 ${zhSize}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(script.titleZh, x + padL, y + h * 0.41);

    const enSize = Math.max(8.5, Math.min(13, Math.round(h * 0.118)));
    ctx.fillStyle = COLORS.green;
    ctx.font = `700 ${enSize}px "Space Grotesk", sans-serif`;
    ctx.fillText(script.titleEn, x + padL, y + h * 0.69);

    // 原海报招牌深绿短横杠
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(x + padL, y + h * 0.81, Math.max(18, w * 0.14), Math.max(2.5, h * 0.032));
  }

  function drawSawtoothEdge(rcA, rcB, dir, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (dir === "v") {
      // rcA 在左，rcB 在右
      const mx = (rcA.x + rcA.w + rcB.x) / 2;
      const y0 = rcA.y + 6;
      const y1 = rcA.y + rcA.h - 6;
      const steps = 8;
      const dy = (y1 - y0) / steps;
      ctx.moveTo(mx, y0);
      for (let i = 1; i <= steps; i++) {
        const amp = i % 2 === 1 ? 3.5 : -3.5;
        ctx.lineTo(mx + amp, y0 + dy * (i - 0.5));
        ctx.lineTo(mx, y0 + dy * i);
      }
    } else {
      // rcA 在上，rcB 在下（可能因错缝水平偏开，取公共水平交集段）
      const x0 = Math.max(rcA.x, rcB.x) + 6;
      const x1 = Math.min(rcA.x + rcA.w, rcB.x + rcB.w) - 6;
      if (x1 <= x0 + 8) { ctx.restore(); return; }
      const my = (rcA.y + rcA.h + rcB.y) / 2;
      const steps = 8;
      const dx = (x1 - x0) / steps;
      ctx.moveTo(x0, my);
      for (let i = 1; i <= steps; i++) {
        const amp = i % 2 === 1 ? 3.5 : -3.5;
        ctx.lineTo(x0 + dx * (i - 0.5), my + amp);
        ctx.lineTo(x0 + dx * i, my);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (!layout) resize();
    if (!layout) return;

    if (still) {
      intro = 1;
      displayPhase = state.phaseOffset;
      dragTension = 0;
      layout = computeLayout(layout.w, layout.h);
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.9);
        dirty = true;
      }
      if (Math.abs(displayPhase - state.phaseOffset) > 0.04) {
        displayPhase += (state.phaseOffset - displayPhase) * Math.min(1, Math.max(dt, 0.016) * 18);
        if (Math.abs(displayPhase - state.phaseOffset) <= 0.04) displayPhase = state.phaseOffset;
        layout = computeLayout(layout.w, layout.h);
        dirty = true;
      }
      if (!pointer && Math.abs(dragTension) > 0.01) {
        dragTension *= Math.max(0, 1 - Math.max(dt, 0.016) * 14);
        if (Math.abs(dragTension) <= 0.01) dragTension = 0;
        dirty = true;
      }
    }

    if (state.scanActive) {
      if (still) {
        state.scanProgress = 0.82;
      } else {
        state.scanProgress += Math.max(dt, 0.016) * 0.42;
        if (state.scanProgress >= 1) {
          state.scanActive = false;
          state.scanProgress = 0;
        }
      }
      dirty = true;
    }

    const settling = !still && (Math.abs(displayPhase - state.phaseOffset) > 0.04 || (!pointer && Math.abs(dragTension) > 0.01));
    if (!dirty && !state.scanActive && intro >= 1 && !settling) return;
    dirty = false;

    const audit = evaluateBoard(state);
    if (onAudit) onAudit(audit);

    const { w, h, ox, oy, cell, gap, boardW, boardH, rects } = layout;
    const script = SCRIPTS[state.script] || SCRIPTS.poster;

    // 1. 宣纸底色 + 建筑外框微网格
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, w, h);

    // 2. 顶部极简实测角标行（窄画幅自动精简，绝不与右上徽章重叠）
    const topY = Math.max(16, oy * 0.50);
    const statusText = audit.badge;
    ctx.font = `700 10.5px "IBM Plex Mono", monospace`;
    const badgeW = Math.ceil(ctx.measureText(statusText).width) + 14;
    const badgeX = Math.min(w - 10, ox + boardW) - badgeW;

    const telLeft = Math.max(10, ox);
    const fullTel = `ALT ${audit.altPct}% · FILL ${audit.solidRatio}% · PHASE ${audit.phaseOffset > 0 ? "+" : ""}${audit.phaseOffset}% · FOCAL ${audit.amberCount}`;
    const shortTel = `ALT ${audit.altPct}% · FILL ${audit.solidRatio}% · FOCAL ${audit.amberCount}`;
    const miniTel = `ALT ${audit.altPct}% · FILL ${audit.solidRatio}%`;
    const tinyTel = `ALT ${audit.altPct}%`;
    ctx.font = `600 10.5px "IBM Plex Mono", monospace`;
    const maxTelW = badgeX - telLeft - 10;
    let telStr = fullTel;
    if (ctx.measureText(telStr).width > maxTelW) telStr = shortTel;
    if (ctx.measureText(telStr).width > maxTelW) telStr = miniTel;
    if (ctx.measureText(telStr).width > maxTelW) telStr = tinyTel;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.inkMuted;
    if (ctx.measureText(telStr).width <= maxTelW) ctx.fillText(telStr, telLeft, topY);

    // 右上角实时通断徽
    ctx.fillStyle = audit.score === 4 ? COLORS.green : COLORS.warn;
    ctx.fillRect(badgeX, topY - 9, badgeW, 18);
    ctx.fillStyle = COLORS.paper;
    ctx.font = `700 10.5px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(statusText, badgeX + badgeW / 2, topY + 0.5);

    // 3. 正交基准轴线（展示错缝时纵轴是否断裂）
    if (state.showAxes) {
      ctx.save();
      ctx.strokeStyle = audit.passPhase ? "rgba(7,80,49,0.22)" : "rgba(185,43,28,0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let c = 0; c <= COLS; c++) {
        const ax = ox + c * (cell + gap) - (c > 0 && c < COLS ? gap / 2 : 0);
        ctx.beginPath();
        ctx.moveTo(ax, oy - 7);
        ctx.lineTo(ax, oy + boardH + 7);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 绘制 20 枚方格模块（含入场错峰缩放动画，每一帧都清晰可读）
    for (let i = 0; i < rects.length; i++) {
      const rc = rects[i];
      const val = state.cells[i];
      if (val === CELL_TITLE) continue;

      const delay = ((rc.r + rc.c) / (ROWS + COLS)) * 0.35;
      const p = Math.max(0, Math.min(1, (intro - delay) / (1 - delay)));
      const ease = 1 - Math.pow(1 - p, 3);
      const scale = 0.88 + 0.12 * ease;

      ctx.save();
      if (scale < 0.999) {
        ctx.translate(rc.x + rc.w / 2, rc.y + rc.h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(rc.x + rc.w / 2), -(rc.y + rc.h / 2));
      }

      ctx.fillStyle = val === CELL_DARK ? COLORS.green : val === CELL_AMBER ? COLORS.amber : COLORS.cream;
      ctx.fillRect(rc.x, rc.y, rc.w, rc.h);

      // 细微建筑格边线
      ctx.strokeStyle = val === CELL_LIGHT ? "rgba(7,80,49,0.14)" : "rgba(248,243,231,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rc.x + 0.5, rc.y + 0.5, rc.w - 1, rc.h - 1);

      drawMotif(rc, val, script.motifs[i], script);

      // 悬停或键盘选中格位指示
      if (i === hoverIdx || i === state.selectedIdx) {
        ctx.strokeStyle = i === state.selectedIdx ? COLORS.ink : "rgba(20,23,21,0.45)";
        ctx.lineWidth = i === state.selectedIdx ? 2 : 1.2;
        ctx.strokeRect(rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4);
      }
      ctx.restore();
    }

    // 5. 原海报 2×1 跨格主标槽
    drawTitlePlaque(rects[5], rects[6], script);

    // 6. 实时标红「同色粘连边」与「双焦警告环」
    for (const edge of audit.darkClumpEdges) {
      drawSawtoothEdge(rects[edge.a], rects[edge.b], edge.dir, COLORS.warn);
    }
    for (const edge of audit.solidTouchEdges) {
      drawSawtoothEdge(rects[edge.a], rects[edge.b], edge.dir, COLORS.warn);
    }
    if (audit.amberCount >= 2) {
      ctx.save();
      ctx.strokeStyle = COLORS.warn;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([5, 3]);
      for (const rc of rects) {
        if (state.cells[rc.idx] === CELL_AMBER) {
          ctx.strokeRect(rc.x + 3, rc.y + 3, rc.w - 6, rc.h - 6);
        }
      }
      ctx.restore();
    }

    // 7. 视线节拍演播轨迹（按 Space 或点演播按钮触发）
    if (state.scanActive && audit.scanPath.length) {
      const pts = audit.scanPath.map((step) => {
        const rc = rects[step.idx];
        return { x: rc.x + rc.w / 2, y: rc.y + rc.h / 2, ...step };
      });
      const totalSeg = Math.max(1, pts.length - 1);
      const prog = state.scanProgress * totalSeg;
      const segIdx = Math.min(totalSeg - 1, Math.floor(prog));
      const frac = prog - segIdx;

      ctx.save();
      ctx.strokeStyle = audit.score === 4 ? COLORS.amber : COLORS.warn;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k <= segIdx; k++) ctx.lineTo(pts[k].x, pts[k].y);
      const curX = pts[segIdx].x + (pts[segIdx + 1]?.x - pts[segIdx].x || 0) * frac;
      const curY = pts[segIdx].y + (pts[segIdx + 1]?.y - pts[segIdx].y || 0) * frac;
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 脉冲视线点
      ctx.fillStyle = audit.score === 4 ? COLORS.amber : COLORS.warn;
      ctx.beginPath();
      ctx.arc(curX, curY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.paper;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 停顿在唯一焦点时放出暖金光环
      const last = pts[pts.length - 1];
      if (last.focal && state.scanProgress > 0.72) {
        const pulse = (state.scanProgress - 0.72) / 0.28;
        ctx.strokeStyle = `rgba(228,155,4,${(1 - pulse * 0.6).toFixed(2)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(last.x, last.y, cell * (0.24 + pulse * 0.28), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 8. 底部错缝相位微标尺（与最底一行保留充足呼吸空隙）
    const textY = oy + boardH + 14;
    const barY = Math.min(h - 11, oy + boardH + 29);
    const barX0 = ox;
    const barW = boardW;
    ctx.strokeStyle = "rgba(7,80,49,0.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barX0, barY);
    ctx.lineTo(barX0 + barW, barY);
    ctx.stroke();

    // 0% 中心绿刻度
    const midX = barX0 + barW / 2;
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX, barY - 6);
    ctx.lineTo(midX, barY + 6);
    ctx.stroke();

    // 当前相位滑标（同步跟随视觉阻尼相位，端点触壁时带轻微弹性位移提示）
    const tPhase = (displayPhase + 50) / 100;
    const knobX = barX0 + Math.max(0, Math.min(1, tPhase)) * barW + dragTension * 4;
    ctx.fillStyle = audit.passPhase ? COLORS.green : COLORS.warn;
    ctx.fillRect(knobX - 6, barY - 5, 12, 10);

    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = `500 10px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(barW < 290 ? "点格翻子 · 横拖错缝" : "点格翻子 · 横拖调偶数行错缝", barX0, textY);
    ctx.textAlign = "right";
    ctx.fillStyle = audit.passPhase ? COLORS.green : COLORS.warn;
    ctx.font = `600 10px "IBM Plex Mono", monospace`;
    ctx.fillText(`0% 正交`, barX0 + barW, textY);
  }

  // ---------- 指针 + 触摸事件（横拖调错缝相位 / 轻点翻子 / 竖划放行页面滚动） ----------
  function startGesture(id, x, y, isTouch) {
    pointer = {
      id,
      startX: x,
      startY: y,
      startPhase: state.phaseOffset,
      mode: "pending", // pending | drag | scroll
      isTouch,
    };
  }

  function moveGesture(x, y, prevent) {
    if (!pointer) return;
    const dx = x - pointer.startX;
    const dy = y - pointer.startY;
    if (pointer.mode === "pending") {
      if (Math.hypot(dx, dy) < 6) return;
      if (pointer.isTouch && Math.abs(dy) > Math.abs(dx) * 1.15) {
        pointer.mode = "scroll";
        return;
      }
      pointer.mode = "drag";
    }
    if (pointer.mode === "drag") {
      if (prevent) prevent();
      const span = Math.max(210, (layout?.boardW || 280) * 0.82);
      const raw = pointer.startPhase + (dx / span) * 100;
      let next = Math.max(-50, Math.min(50, raw));
      // 靠近 0% 正交位置轻吸附，手感干脆；拖动中保留连续小数保证每帧丝滑重绘
      if (Math.abs(next) <= 1.8) next = 0;
      const smooth = Math.round(next * 10) / 10;
      const nextTension = Math.max(-1, Math.min(1, (raw - next) / 28));
      if (smooth !== state.phaseOffset || Math.abs(nextTension - dragTension) > 0.005) {
        state.phaseOffset = smooth;
        dragTension = nextTension;
        dirty = true;
        onChange("phase");
      }
    }
  }

  function endGesture(x, y, button = 0) {
    if (!pointer) return;
    if (pointer.mode === "pending") {
      const idx = hitTest(x, y);
      if (idx >= 0) applyCellClick(idx, button === 2);
    } else if (Math.abs(dragTension) > 0.01) {
      dirty = true;
    }
    pointer = null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由原生 touch 事件保证 perf.mjs dispatchTouchEvent 100% 命中
    if (e.button === 2) {
      e.preventDefault();
      const idx = hitTest(e.clientX, e.clientY);
      if (idx >= 0) applyCellClick(idx, true);
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    startGesture(e.pointerId, e.clientX, e.clientY, false);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (pointer && pointer.id === e.pointerId) {
      moveGesture(e.clientX, e.clientY);
    } else {
      const h = hitTest(e.clientX, e.clientY);
      if (h !== hoverIdx) {
        hoverIdx = h;
        canvas.style.cursor = h >= 0 ? "pointer" : "ew-resize";
        dirty = true;
      }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (pointer && pointer.id === e.pointerId) endGesture(e.clientX, e.clientY, e.button);
  });
  canvas.addEventListener("pointerleave", () => {
    if (hoverIdx !== -1) {
      hoverIdx = -1;
      dirty = true;
    }
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // 触屏直通：保证手机横拖调错缝、轻点翻子、竖滑顺畅滚动，并完美响应 perf.mjs 触控拖拽
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startGesture(t.identifier, t.clientX, t.clientY, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!pointer || !e.touches.length) return;
      const t = e.touches[0];
      moveGesture(t.clientX, t.clientY, () => {
        if (e.cancelable) e.preventDefault();
      });
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!pointer) return;
      const t = e.changedTouches[0];
      endGesture(t ? t.clientX : pointer.startX, t ? t.clientY : pointer.startY, 0);
    },
    { passive: true }
  );

  // 键盘操作：方向键选格、Shift+←/→ 调相位、Enter 翻子、Space 演播视线节拍
  canvas.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      state.scanActive = true;
      state.scanProgress = 0;
      dirty = true;
      return;
    }
    if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -4 : 4;
      state.phaseOffset = Math.max(-50, Math.min(50, state.phaseOffset + step));
      if (Math.abs(state.phaseOffset) <= 2) state.phaseOffset = 0;
      if (layout) layout = computeLayout(layout.w, layout.h);
      dirty = true;
      onChange("phase");
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      applyCellClick(state.selectedIdx, false);
      return;
    }
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };
    if (moves[e.key] != null) {
      e.preventDefault();
      let next = state.selectedIdx + moves[e.key];
      while (next >= 0 && next < COLS * ROWS && state.cells[next] === CELL_TITLE) {
        next += moves[e.key];
      }
      if (next >= 0 && next < COLS * ROWS) {
        state.selectedIdx = next;
        dirty = true;
      }
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctrl = loop(canvas, render);
  ctrl.draw();

  return {
    invalidate() {
      if (reducedMotion.matches) displayPhase = state.phaseOffset;
      if (layout) layout = computeLayout(layout.w, layout.h);
      dirty = true;
      ctrl.draw();
    },
    triggerScan() {
      state.scanActive = true;
      state.scanProgress = reducedMotion.matches ? 0.85 : 0;
      dirty = true;
      ctrl.draw();
    },
  };
}
