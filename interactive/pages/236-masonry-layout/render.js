// 236 · 瀑布流布局 2D Canvas 高精包豪斯渲染器
// 负责：1) 开场活体 9–12 卡包豪斯砌墙舞台（含 9 枚原海报几何插画 + 弹簧补位 + 红斜纹空洞 + 视口拖边）
//       2) 第 01 节单步放砖补位模拟器画布
//       3) 第 03 节墨黑暗室「自由逛图 vs 定向查价」视线扫描对比画布

import { pixelRatio } from "../../lib/stage.js";
import { PALETTE, THEME_STYLES } from "./model.js";

const FONT_HEAD = '"Noto Sans SC", sans-serif';
const FONT_MONO = '"Space Mono", monospace';
const FONT_EN = '"Archivo", sans-serif';

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
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

// 1:1 复刻 236 原海报 9 张卡片内的包豪斯几何插画（所有圆均为真圆，绝不压扁）
function drawCardMotif(ctx, card, x, y, w, h, isUneven, compact) {
  const padX = Math.max(8, Math.min(18, w * 0.09));
  const topOffset = compact ? Math.min(h * 0.44, 48) : Math.min(h * 0.44, 72);
  const bx = x + padX;
  const by = y + topOffset;
  const bw = Math.max(16, w - padX * 2);
  const bh = Math.max(14, h - topOffset - Math.max(8, h * 0.08));
  if (bh < 16 || bw < 20) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, h - 4);
  ctx.clip();

  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const u = Math.min(bw, bh);

  switch (card.motif) {
    case "bars": {
      // 红卡「列宽一致」：原海报三根等宽浅米竖条（不等宽模式下故意变胖瘦失衡，直观反讽！）
      const barH = Math.min(bh * 0.82, 54);
      const barY = by + bh - barH;
      const totalW = Math.min(bw * 0.72, 118);
      const g = Math.max(4, totalW * 0.09);
      const ratios = isUneven ? [0.54, 0.18, 0.28] : [0.333, 0.333, 0.334];
      const hs = [barH * 0.86, barH, barH * 0.9];
      let sx = cx - totalW / 2;
      ctx.fillStyle = PALETTE.cream;
      for (let i = 0; i < 3; i++) {
        const cw = (totalW - g * 2) * ratios[i];
        ctx.fillRect(sx, barY + (barH - hs[i]), cw, hs[i]);
        sx += cw + g;
      }
      break;
    }

    case "flow": {
      // 黄卡「自动补位」：虚线向下箭头 + 绿/红/黑/浅米几何贴合块
      const boxS = Math.min(bw * 0.72, bh * 0.56, 110);
      const boxX = cx - boxS / 2;
      const boxY = by + bh - boxS;
      const arrowTop = by + 2;
      const arrowBot = boxY - Math.max(8, bh * 0.08);
      if (arrowBot - arrowTop > 14) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, arrowTop);
        ctx.lineTo(cx, arrowBot);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx - 5, arrowBot - 6);
        ctx.lineTo(cx, arrowBot);
        ctx.lineTo(cx + 5, arrowBot - 6);
        ctx.stroke();
      }
      const half = boxS * 0.46;
      const gap = boxS * 0.08;
      // 左上翡翠绿块 + 左下朱红块
      ctx.fillStyle = PALETTE.teal;
      ctx.fillRect(boxX, boxY, half, half);
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(boxX, boxY + half, half, half);
      // 右上浅米圆
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(boxX + half + gap + half * 0.48, boxY + half * 0.48, half * 0.46, 0, Math.PI * 2);
      ctx.fill();
      // 右下墨黑直角三角
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.moveTo(boxX + half + gap, boxY + boxS);
      ctx.lineTo(boxX + boxS, boxY + boxS);
      ctx.lineTo(boxX + boxS, boxY + half * 0.78);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "wave": {
      // 浅米卡「节奏分布」：贯穿左右边的翡翠绿波浪 + 右下朱红实心圆
      const waveY = by + bh * 0.34;
      const amp = Math.min(18, bh * 0.16);
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 32; i++) {
        const t = i / 32;
        const px = x + t * w;
        const py = waveY - Math.sin(t * Math.PI * 2.55) * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      const r = Math.min(bw * 0.19, bh * 0.28, 24);
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.arc(x + w * 0.74, by + bh * 0.72, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "sunarch": {
      // 浅米卡「卡片高度可变」：朱红正圆 + 底部深翡翠绿大拱 + 左下 4×4 墨黑点阵
      const archR = Math.min(bw * 0.42, bh * 0.48, 56);
      const archY = y + h - 4;
      ctx.fillStyle = PALETTE.teal;
      ctx.beginPath();
      ctx.arc(cx, archY, archR, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      const sunR = Math.min(archR * 0.44, bh * 0.22, 20);
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.arc(cx - archR * 0.06, Math.max(by + sunR + 1, archY - archR - sunR - 4), sunR, 0, Math.PI * 2);
      ctx.fill();

      // 左下 4×4 墨黑点阵（合并单路径一次 fill，大幅减少软件渲染绘制调用）
      if (bh >= 24) {
        const cols = 4, rows = 4;
        const step = Math.max(4.2, Math.min(8, (bh - 8) / 3.4, bw * 0.052));
        const dx0 = bx + 2;
        const dy0 = Math.max(by + 3, y + h - 8 - (rows - 1) * step);
        const dr = step < 5.5 ? 1.4 : 1.75;
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = dx0 + c * step;
            const py = dy0 + r * step;
            ctx.moveTo(px + dr, py);
            ctx.arc(px, py, dr, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
      break;
    }

    case "spinner": {
      // 翡翠绿卡「无限滚动」：原海报 8 点大小递变环形加载阵
      const ringR = Math.min(u * 0.34, 24);
      ctx.fillStyle = PALETTE.cream;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const dotR = 2.1 + (i / 7) * 2.2;
        ctx.globalAlpha = 0.45 + (i / 7) * 0.55;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * ringR, cy + Math.sin(ang) * ringR, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case "eye": {
      // 墨黑卡「阅读更高效」：原海报白底翡翠绿瞳 + 顶部 5 根放射睫毛（按 bh 限幅，绝不碰上方文字）
      const eh = Math.min(bw * 0.22, bh * 0.27, 26);
      const ew = eh / 0.46;
      const ey = by + bh - eh - 4;
      const lashIn = eh * 1.12;
      const lashOut = Math.min(eh * 1.62, Math.max(lashIn + 3, ey - by - 2));
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      for (let i = -2; i <= 2; i++) {
        const a = -Math.PI / 2 + i * 0.34;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * lashIn, ey + Math.sin(a) * lashIn);
        ctx.lineTo(cx + Math.cos(a) * lashOut, ey + Math.sin(a) * lashOut);
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.moveTo(cx - ew / 2, ey);
      ctx.quadraticCurveTo(cx, ey - eh, cx + ew / 2, ey);
      ctx.quadraticCurveTo(cx, ey + eh, cx - ew / 2, ey);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.teal;
      ctx.beginPath();
      ctx.arc(cx, ey, eh * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(cx, ey, eh * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "ruler": {
      // 琥珀黄卡「保持间距」：合并为单路径一次 stroke
      const count = bw < 105 ? 9 : 13;
      const tickH = Math.min(bh * 0.42, 16);
      const ty = y + h - 12 - tickH;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const tx = bx + (i / (count - 1)) * bw;
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, ty + tickH);
      }
      ctx.stroke();
      break;
    }

    case "corners": {
      // 翡翠绿卡「节省空间」：原海报右下双直角裁切标尺
      const s = Math.min(bw * 0.34, bh * 0.56, 36);
      const rx = x + w - padX - 4;
      const ry = y + h - 12;
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 2;
      // 外直角
      ctx.beginPath();
      ctx.moveTo(rx - s * 1.35, ry - s * 0.45);
      ctx.lineTo(rx - s * 0.45, ry - s * 0.45);
      ctx.lineTo(rx - s * 0.45, ry - s * 1.35);
      ctx.stroke();
      // 内直角
      ctx.beginPath();
      ctx.moveTo(rx - s * 0.72, ry);
      ctx.lineTo(rx, ry);
      ctx.lineTo(rx, ry - s * 0.72);
      ctx.stroke();
      break;
    }

    case "icons": {
      // 朱红卡「适用场景广」：原海报三白图标（四格画廊 / 购物袋 / 资讯卡片）
      const s = Math.min(bw * 0.20, bh * 0.62, 24);
      const gap = Math.min(18, (bw - s * 3) / 2.6);
      const total = s * 3 + gap * 2;
      const x0 = cx - total / 2;
      const y0 = y + h - 12 - s;
      ctx.fillStyle = PALETTE.cream;
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1.8;

      // 1) 四格画廊
      const sq = (s - 3) / 2;
      ctx.fillRect(x0, y0, sq, sq);
      ctx.fillRect(x0 + sq + 3, y0, sq, sq);
      ctx.fillRect(x0, y0 + sq + 3, sq, sq);
      ctx.fillRect(x0 + sq + 3, y0 + sq + 3, sq, sq);

      // 2) 购物袋
      const x1 = x0 + s + gap;
      ctx.beginPath();
      ctx.arc(x1 + s / 2, y0 + s * 0.25, s * 0.22, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1 + s * 0.14, y0 + s * 0.28);
      ctx.lineTo(x1 + s * 0.86, y0 + s * 0.28);
      ctx.lineTo(x1 + s * 0.96, y0 + s);
      ctx.lineTo(x1 + s * 0.04, y0 + s);
      ctx.closePath();
      ctx.fill();

      // 3) 资讯卡框
      const x2 = x1 + s + gap;
      roundRectPath(ctx, x2, y0, s, s, 3);
      ctx.stroke();
      ctx.fillRect(x2 + 3.5, y0 + 3.5, s * 0.34, s * 0.34);
      ctx.fillRect(x2 + s * 0.48, y0 + 4.5, s * 0.36, 2.2);
      ctx.fillRect(x2 + s * 0.48, y0 + 9.5, s * 0.36, 2.2);
      ctx.fillRect(x2 + 3.5, y0 + s * 0.62, s - 7, 2.2);
      break;
    }

    case "ratio": {
      // 扩展卡 10：aspect-ratio 虚线预占位框架
      const rw = Math.min(bw * 0.72, 82);
      const rh = Math.min(bh * 0.68, 48);
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx - rw / 2, cy - rh / 2);
      ctx.lineTo(cx + rw / 2, cy + rh / 2);
      ctx.stroke();
      break;
    }

    case "tolerance": {
      // 扩展卡 11：容差带水平双线
      const rw = Math.min(bw * 0.78, 86);
      ctx.fillStyle = "rgba(250,242,231,0.34)";
      ctx.fillRect(cx - rw / 2, cy - 8, rw, 16);
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - rw / 2, cy - 8);
      ctx.lineTo(cx + rw / 2, cy - 8);
      ctx.moveTo(cx - rw / 2, cy + 8);
      ctx.lineTo(cx + rw / 2, cy + 8);
      ctx.stroke();
      break;
    }

    default: {
      // 扩展卡 12：响应式折列三竖条
      const total = Math.min(bw * 0.7, 74);
      const cw = (total - 8) / 3;
      const ch = Math.min(bh * 0.7, 36);
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(cx - total / 2, cy - ch / 2, cw, ch);
      ctx.fillRect(cx - total / 2 + cw + 4, cy - ch / 2 + 6, cw, ch - 6);
      ctx.fillRect(cx - total / 2 + (cw + 4) * 2, cy - ch / 2 + 3, cw, ch - 3);
      break;
    }
  }
  ctx.restore();
}

// 预生成离屏斜纹图案，消除每帧 clip + 循环画线开销（大幅提升软件渲染帧率）
function makeHatchPattern(ctx, bgColor, lineColor, size = 12) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (bgColor) {
    g.fillStyle = bgColor;
    g.fillRect(0, 0, size, size);
  }
  g.strokeStyle = lineColor;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, size);
  g.lineTo(size, 0);
  g.moveTo(-size / 2, size / 2);
  g.lineTo(size / 2, -size / 2);
  g.moveTo(size / 2, size * 1.5);
  g.lineTo(size * 1.5, size / 2);
  g.stroke();
  return ctx.createPattern(c, "repeat");
}

// =========================================================================
// 1. 开场活体包豪斯九卡砌墙台渲染器
// =========================================================================
export function createHeroWallRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const voidPattern = makeHatchPattern(ctx, "rgba(242, 90, 57, 0.12)", "rgba(182, 47, 18, 0.28)", 10);
  const outsidePattern = makeHatchPattern(ctx, "rgba(27, 27, 27, 0.04)", "rgba(27, 27, 27, 0.075)", 14);

  const animMap = new Map();
  let introProgress = 0;
  let lastSnapshot = null;
  let cachedCssW = 800;
  let cachedCssH = 390;
  let logicalW = 800;
  let logicalH = 390;
  let wallOffsetX = 16;
  let wallTopY = 32;
  let hoverCardId = null;
  let dirty = true;

  function syncBoxSize() {
    const r = canvas.getBoundingClientRect();
    if (r.width > 100) cachedCssW = Math.round(r.width);
    if (r.height > 100) cachedCssH = Math.round(r.height);
    dirty = true;
  }
  syncBoxSize();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => syncBoxSize()).observe(canvas);
  }

  function markDirty() {
    dirty = true;
  }

  function resize(w, h) {
    // 手机窄屏限制 DPR ≤ 1.5（GUIDE.md 建议），大幅减少软件渲染像素量
    const dpr = pixelRatio(w < 520 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    logicalW = w;
    logicalH = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function hitTestCard(px, py) {
    if (!lastSnapshot) return null;
    for (let i = lastSnapshot.placed.length - 1; i >= 0; i--) {
      const p = lastSnapshot.placed[i];
      const cur = animMap.get(p.id) || p;
      const rx = wallOffsetX + cur.x;
      const ry = wallTopY + cur.y;
      if (px >= rx && px <= rx + cur.w && py >= ry && py <= ry + cur.h) {
        return p.id;
      }
    }
    return null;
  }

  function setHover(id) {
    if (hoverCardId !== id) {
      hoverCardId = id;
      dirty = true;
    }
  }

  function draw(state, evalResult, dt, { still = false, force = false } = {}) {
    if (!force && !still && !dirty && introProgress >= 1) {
      // 卡片已停稳且无交互脏标记，跳过重复绘制以保持高帧率与省电
      return;
    }
    const { layout, checks } = evalResult;
    const curW = Math.max(260, cachedCssW);
    const isNarrow = curW < 520;
    const isLandscapeShort = window.innerHeight <= 450 && window.innerWidth >= 640;
    const padSide = isNarrow ? 10 : 18;
    const topBarH = isNarrow ? 26 : 32;
    const bottomPad = isNarrow ? 24 : 30;
    wallOffsetX = padSide;
    wallTopY = topBarH;

    const sx = Math.min(1, (curW - padSide * 2) / Math.max(1, layout.wallW));
    const maxCanvasH = isLandscapeShort ? 300 : isNarrow ? 396 : 420;
    const availH = maxCanvasH - topBarH - bottomPad;
    const sy = Math.min(1, availH / Math.max(1, layout.wallH));

    const drawWallW = layout.wallW * sx;
    const drawWallH = layout.wallH * sy;
    const desiredH = isLandscapeShort
      ? 296
      : Math.max(isNarrow ? 360 : 370, Math.min(maxCanvasH, Math.ceil(topBarH + drawWallH + bottomPad)));
    if (Math.abs(cachedCssH - desiredH) > 6) {
      cachedCssH = desiredH;
      canvas.style.height = `${desiredH}px`;
    }
    const { w, h } = resize(curW, desiredH);

    if (still) {
      introProgress = 1;
    } else {
      introProgress = Math.min(1, introProgress + (dt > 0 ? dt * 2.2 : 0.08));
    }

    // 1. 暖米宣纸画布底色
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    // 2. 右侧被拖窄后的未占用视口阴影区（单次 pattern fillRect！）
    const rightWallX = padSide + drawWallW;
    if (rightWallX < w - padSide - 4) {
      ctx.fillStyle = outsidePattern || "rgba(27, 27, 27, 0.05)";
      ctx.fillRect(rightWallX, topBarH, w - padSide - rightWallX, h - topBarH - 8);
    }

    // 3. 顶部列宽比例刻度尺
    ctx.save();
    ctx.font = `700 ${isNarrow ? 10 : 11}px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    const rulerY = topBarH * 0.5;
    layout.tracks.forEach((tr, i) => {
      const tx = padSide + tr.x * sx;
      const tw = tr.w * sx;
      const uneven = state.colWidthMode === "uneven";
      const tooNarrow = !checks.cols && state.colWidthMode === "equal";
      ctx.fillStyle = uneven || tooNarrow ? "rgba(242, 90, 57, 0.14)" : "rgba(9, 128, 113, 0.10)";
      ctx.fillRect(tx, 5, tw, topBarH - 10);
      ctx.strokeStyle = uneven || tooNarrow ? PALETTE.redDeep : PALETTE.tealDeep;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, topBarH - 5);
      ctx.lineTo(tx + tw, topBarH - 5);
      ctx.stroke();

      ctx.fillStyle = uneven || tooNarrow ? PALETTE.redDeep : PALETTE.inkSub;
      ctx.textAlign = "center";
      const pct = Math.round(tr.weight * 100);
      const label =
        tw >= 156 ? `C${i + 1} · ${pct}% (${Math.round(tr.w)}px)` :
        tw >= 88 ? `C${i + 1} · ${pct}%` :
        tw >= 44 ? `${Math.round(tr.w)}px` : `C${i + 1}`;
      ctx.fillText(label, tx + tw / 2, rulerY, Math.max(18, tw - 6));
    });
    ctx.restore();

    // 4. 列道淡色垂直基准槽
    ctx.fillStyle = "rgba(27, 27, 27, 0.025)";
    layout.tracks.forEach((tr) => {
      ctx.fillRect(padSide + tr.x * sx, topBarH, tr.w * sx, drawWallH);
    });

    // 5. 行内空洞朱红斜纹高亮（单次 pattern 填充，零 clip 开销！）
    if (layout.voids.length) {
      ctx.save();
      layout.voids.forEach((v) => {
        const vx = padSide + v.x * sx;
        const vy = topBarH + v.y * sy;
        const vw = v.w * sx;
        const vh = v.h * sy;
        if (vh < 6) return;

        ctx.fillStyle = voidPattern || "rgba(242, 90, 57, 0.14)";
        ctx.fillRect(vx, vy, vw, vh);

        ctx.strokeStyle = "rgba(182, 47, 18, 0.62)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1);
        ctx.setLineDash([]);

        if (vh >= 22 && vw >= 62) {
          const txt = `空洞 ${Math.round(v.h)}px`;
          ctx.font = `700 ${isNarrow ? 10 : 11}px ${FONT_MONO}`;
          const tw = Math.min(vw - 8, 72);
          ctx.fillStyle = PALETTE.paper;
          ctx.fillRect(vx + (vw - tw) / 2, vy + vh / 2 - 9, tw, 18);
          ctx.fillStyle = PALETTE.redDeep;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, vx + vw / 2, vy + vh / 2, tw - 4);
        }
      });
      ctx.restore();
    }

    // 6. 弹簧插值并绘制全部包豪斯卡片
    const lerpK = still ? 1 : Math.min(1, Math.max(0.24, (dt || 0.016) * 16));
    const snapshotPlaced = [];
    let moving = introProgress < 1;

    layout.placed.forEach((p) => {
      const tx = p.x * sx;
      const ty = p.y * sy;
      const tw = p.w * sx;
      const th = p.h * sy;

      let cur = animMap.get(p.id);
      if (!cur) {
        cur = { x: tx, y: Math.max(0, ty - (still ? 0 : 14)), w: tw, h: th };
        animMap.set(p.id, cur);
        if (!still) moving = true;
      } else {
        const dx = tx - cur.x, dy = ty - cur.y, dw = tw - cur.w, dh = th - cur.h;
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dw) + Math.abs(dh) > 0.6 && !still) {
          cur.x += dx * lerpK;
          cur.y += dy * lerpK;
          cur.w += dw * lerpK;
          cur.h += dh * lerpK;
          moving = true;
        } else {
          cur.x = tx; cur.y = ty; cur.w = tw; cur.h = th;
        }
      }

      const rx = padSide + cur.x;
      const ry = topBarH + cur.y;
      const rw = Math.max(12, cur.w);
      const rh = Math.max(22, cur.h);
      snapshotPlaced.push({ ...p, x: cur.x, y: cur.y, w: rw, h: rh });

      const style = THEME_STYLES[p.theme] || THEME_STYLES.beige;
      const isSelected = state.selectedCardId === p.id;
      const isHover = hoverCardId === p.id;
      const isAdded = state.lastAddedIds.includes(p.id);

      ctx.save();
      roundRectPath(ctx, rx, ry, rw, rh, 6);
      ctx.fillStyle = style.bg;
      ctx.fill();

      if (state.gutter === 0) {
        ctx.strokeStyle = "rgba(182, 47, 18, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.theme === "beige") {
        ctx.strokeStyle = "rgba(27, 27, 27, 0.09)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (isSelected || isHover || isAdded) {
        ctx.strokeStyle = isAdded ? PALETTE.yellow : PALETTE.ink;
        ctx.lineWidth = isSelected ? 2.4 : 1.6;
        roundRectPath(ctx, rx + 1, ry + 1, rw - 2, rh - 2, 6);
        ctx.stroke();
      }

      const compact = rw < 126 || rh < 70;
      const padX = Math.max(7, Math.min(14, rw * 0.08));
      const padY = Math.max(6, Math.min(12, rh * 0.11));
      const sqSize = compact ? 6 : 8;
      const titleFs = compact ? Math.max(10.5, Math.min(12.5, rw * 0.11)) : Math.max(12.5, Math.min(15.5, rw * 0.068));

      ctx.fillStyle = style.sq;
      ctx.fillRect(rx + padX, ry + padY + (titleFs - sqSize) * 0.46, sqSize, sqSize);

      ctx.fillStyle = style.fg;
      ctx.font = `900 ${titleFs}px ${FONT_HEAD}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(p.title, rx + padX + sqSize + 5, ry + padY - 1, Math.max(20, rw - padX * 2 - sqSize - 24));

      const badgeStr = String(p.domIndex + 1).padStart(2, "0");
      ctx.font = `700 ${compact ? 9.5 : 10.5}px ${FONT_MONO}`;
      ctx.textAlign = "right";
      ctx.fillStyle = style.fg;
      ctx.globalAlpha = 0.72;
      ctx.fillText(badgeStr, rx + rw - padX, ry + padY + 1);
      ctx.globalAlpha = 1;

      if (!compact && rh >= 74 && rw >= 150) {
        const subFs = Math.max(10, Math.min(11.5, rw * 0.048));
        ctx.font = `500 ${subFs}px ${FONT_HEAD}`;
        ctx.fillStyle = style.sub;
        ctx.textAlign = "left";
        const lines = p.sub.split("\n");
        lines.forEach((ln, li) => {
          ctx.fillText(ln, rx + padX + sqSize + 5, ry + padY + titleFs + 3 + li * (subFs + 3), rw - padX * 2 - sqSize - 6);
        });
      }

      drawCardMotif(ctx, p, rx, ry, rw, rh, state.colWidthMode === "uneven", compact);

      if (p.factor >= 1.8) {
        const warnText = rw < 130 ? `超长 ${p.factor.toFixed(1)}×` : `超长 ${p.factor.toFixed(1)}× · 点卡调矮`;
        ctx.font = `700 10px ${FONT_HEAD}`;
        const bw = Math.min(rw - 10, ctx.measureText(warnText).width + 12);
        ctx.fillStyle = PALETTE.ink;
        roundRectPath(ctx, rx + (rw - bw) / 2, ry + rh - 22, bw, 17, 3);
        ctx.fill();
        ctx.fillStyle = PALETTE.yellow;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(warnText, rx + rw / 2, ry + rh - 13.5, bw - 6);
      }

      ctx.restore();
    });

    const aliveIds = new Set(layout.placed.map((p) => p.id));
    for (const k of animMap.keys()) {
      if (!aliveIds.has(k)) animMap.delete(k);
    }
    lastSnapshot = { placed: snapshotPlaced };

    // 7. 阅读顺序 Z 序连线
    if (state.showOrder && snapshotPlaced.length > 1) {
      ctx.save();
      ctx.strokeStyle = state.algorithm === "columns" ? PALETTE.redDeep : PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      snapshotPlaced.forEach((p, idx) => {
        const px = padSide + p.x + p.w * 0.5;
        const py = topBarH + p.y + Math.min(24, p.h * 0.38);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      snapshotPlaced.forEach((p, idx) => {
        const px = padSide + p.x + p.w * 0.5;
        const py = topBarH + p.y + Math.min(24, p.h * 0.38);
        ctx.fillStyle = state.algorithm === "columns" ? PALETTE.red : PALETTE.ink;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = PALETTE.paper;
        ctx.font = `700 10px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), px, py + 0.5);
      });
      ctx.restore();
    }

    // 8. 各列底部水位标线
    const minColH = Math.min(...layout.colHeights);
    const maxColH = Math.max(...layout.colHeights);
    ctx.save();
    layout.tracks.forEach((tr, i) => {
      const tx = padSide + tr.x * sx;
      const tw = tr.w * sx;
      const cy = topBarH + layout.colHeights[i] * sy;
      const isShallow = Math.abs(layout.colHeights[i] - minColH) < 2;
      ctx.strokeStyle = isShallow ? PALETTE.teal : PALETTE.line;
      ctx.lineWidth = isShallow ? 2 : 1.2;
      ctx.setLineDash(isShallow ? [4, 3] : [2, 3]);
      ctx.beginPath();
      ctx.moveTo(tx, cy + 4);
      ctx.lineTo(tx + tw, cy + 4);
      ctx.stroke();
      ctx.setLineDash([]);

      if (tw >= 52) {
        ctx.font = `700 10px ${FONT_MONO}`;
        ctx.fillStyle = isShallow ? PALETTE.tealDeep : PALETTE.inkSub;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const tag = isShallow && tw >= 86 ? `最浅 ${Math.round(layout.colHeights[i])}px` : `${Math.round(layout.colHeights[i])}px`;
        ctx.fillText(tag, tx + tw / 2, Math.min(h - 14, cy + 6), tw - 6);
      }
    });

    if (layout.cols >= 2 && layout.tailSpreadPct > 44) {
      const y1 = topBarH + minColH * sy;
      const y2 = topBarH + maxColH * sy;
      const mx = rightWallX - 8;
      ctx.strokeStyle = PALETTE.redDeep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, y1);
      ctx.lineTo(mx, y2);
      ctx.stroke();
    }
    ctx.restore();

    // 9. 右缘可拖动视口边界虚线墙 + 实体双箭头把手
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rightWallX, topBarH - 4);
    ctx.lineTo(rightWallX, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    const handleH = 52;
    const handleW = 16;
    const hy = topBarH + Math.min(drawWallH * 0.45, (h - topBarH) * 0.45) - handleH / 2;
    const hx = Math.min(w - handleW - 2, rightWallX - handleW / 2);
    roundRectPath(ctx, hx, hy, handleW, handleH, 5);
    ctx.fillStyle = PALETTE.ink;
    ctx.fill();
    ctx.fillStyle = PALETTE.yellow;
    for (let k = -1; k <= 1; k++) {
      ctx.fillRect(hx + 4, hy + handleH / 2 + k * 6 - 1, handleW - 8, 2);
    }

    const widthTag = `墙宽 ${layout.wallW}px · ${layout.cols}列`;
    ctx.font = `700 10.5px ${FONT_MONO}`;
    const wtW = ctx.measureText(widthTag).width + 14;
    const wtX = Math.max(padSide, Math.min(w - wtW - 4, rightWallX - wtW - 2));
    roundRectPath(ctx, wtX, h - 22, wtW, 18, 3);
    ctx.fillStyle = PALETTE.ink;
    ctx.fill();
    ctx.fillStyle = PALETTE.paper;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(widthTag, wtX + wtW / 2, h - 13);
    ctx.restore();

    dirty = moving;
  }

  return {
    draw,
    hitTestCard,
    setHover,
    markDirty,
    syncBoxSize,
    getWallWidth: () => Math.max(260, cachedCssW - (cachedCssW < 520 ? 20 : 36)),
  };
}

// =========================================================================
// 2. 第 01 节：单步放砖补位模拟器画布
// =========================================================================
export function createStepPackRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const posMap = new Map();

  function draw(sim, tolerancePx, dt, { still = false } = {}) {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(300, Math.round(rect.height || 360));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, w, h);

    const padX = w < 420 ? 12 : 22;
    const topY = 34;
    const botPad = 32;
    const gap = 12;
    const cols = 3;
    const colW = (w - padX * 2 - gap * (cols - 1)) / cols;
    const maxWallH = Math.max(320, ...sim.colH, (sim.last ? sim.last.y + sim.last.h : 0) + 48);
    const scaleY = Math.min(1, (h - topY - botPad) / maxWallH);

    // 顶部三列标签
    ctx.font = `700 11px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    for (let c = 0; c < cols; c++) {
      const cx = padX + c * (colW + gap);
      ctx.fillStyle = "rgba(27,27,27,0.035)";
      ctx.fillRect(cx, topY, colW, h - topY - botPad);
      ctx.fillStyle = PALETTE.inkSub;
      ctx.textAlign = "center";
      ctx.fillText(`列 ${c + 1} · ${sim.colH[c]}px`, cx + colW / 2, 16);
    }

    // 当前各列底边 + 最短列翡翠绿水位线 & 容差带
    const minY = Math.min(...sim.colH);
    const minDrawY = topY + minY * scaleY;

    if (tolerancePx > 0) {
      ctx.fillStyle = "rgba(243, 181, 45, 0.22)";
      ctx.fillRect(padX, minDrawY, w - padX * 2, tolerancePx * scaleY);
      ctx.fillStyle = PALETTE.yellowDeep;
      ctx.font = `700 10px ${FONT_MONO}`;
      ctx.textAlign = "right";
      ctx.fillText(`容差带 +${tolerancePx}px`, w - padX - 4, minDrawY + Math.max(10, tolerancePx * scaleY * 0.5));
    }

    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, minDrawY);
    ctx.lineTo(w - padX, minDrawY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 下一张待落砖的虚线预览槽
    if (sim.nextBrick) {
      let nextCol = 0;
      for (let c = 0; c < cols; c++) {
        if (sim.colH[c] <= minY + tolerancePx) {
          nextCol = c;
          break;
        }
      }
      const nx = padX + nextCol * (colW + gap);
      const ny = topY + (sim.colH[nextCol] > 0 ? sim.colH[nextCol] + gap : 0) * scaleY;
      const nh = sim.nextBrick.h * scaleY;
      ctx.save();
      roundRectPath(ctx, nx + 1, ny + 1, colW - 2, Math.max(24, nh - 2), 6);
      ctx.fillStyle = "rgba(9, 128, 113, 0.10)";
      ctx.fill();
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.tealDeep;
      ctx.font = `700 11px ${FONT_HEAD}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`下一落点：#${sim.nextBrick.id}`, nx + colW / 2, ny + Math.max(24, nh) / 2, colW - 8);
      ctx.restore();
    }

    // 绘制已放入的卡片（带平滑下落动画）
    const lerpK = still ? 1 : Math.min(1, Math.max(0.2, (dt || 0.016) * 14));
    const alive = new Set();
    sim.placed.forEach((p, idx) => {
      alive.add(p.id);
      const tx = padX + p.col * (colW + gap);
      const ty = topY + p.y * scaleY;
      const th = Math.max(24, p.h * scaleY);
      let cur = posMap.get(p.id);
      if (!cur) {
        cur = { x: tx, y: still ? ty : Math.max(topY - 12, ty - 28) };
        posMap.set(p.id, cur);
      } else {
        cur.x += (tx - cur.x) * lerpK;
        cur.y += (ty - cur.y) * lerpK;
      }

      const st = THEME_STYLES[p.theme] || THEME_STYLES.beige;
      const isLast = idx === sim.placed.length - 1;
      ctx.save();
      roundRectPath(ctx, cur.x, cur.y, colW, th, 6);
      ctx.fillStyle = st.bg;
      ctx.fill();
      if (p.theme === "beige") {
        ctx.strokeStyle = "rgba(27,27,27,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (isLast) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2.2;
        roundRectPath(ctx, cur.x + 1, cur.y + 1, colW - 2, th - 2, 6);
        ctx.stroke();
      }

      ctx.fillStyle = st.fg;
      ctx.font = `900 ${w < 420 ? 11 : 12.5}px ${FONT_HEAD}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`#${p.id} ${p.title}`, cur.x + 8, cur.y + 7, colW - 16);

      ctx.font = `700 10px ${FONT_MONO}`;
      ctx.fillStyle = st.sub;
      ctx.fillText(`${p.h}px`, cur.x + 8, cur.y + th - 16);
      if (p.toleranceSaved && colW > 86) {
        ctx.textAlign = "right";
        ctx.fillText("容差靠左", cur.x + colW - 8, cur.y + th - 16);
      }
      ctx.restore();
    });
    for (const k of posMap.keys()) if (!alive.has(k)) posMap.delete(k);

    // 底部汇总栏
    ctx.fillStyle = PALETTE.inkSub;
    ctx.font = `700 10.5px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const diff = Math.max(...sim.colH) - Math.min(...sim.colH);
    ctx.fillText(`已放 ${sim.placed.length} / 10 块 · 当前最浅列 = ${minY}px · 列底差 = ${diff}px`, padX, h - 8);
  }

  return { draw };
}

// =========================================================================
// 3. 第 03 节（墨黑暗室）：自由逛图 vs 定向查价 视线路径对比画布
// =========================================================================
export function createScanCompareRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  let phase = 0;

  function draw(taskMode, layoutMode, dt, { still = false } = {}) {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(250, Math.round(rect.height || 300));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (still) phase = 1;
    else phase = (phase + (dt || 0.016) * 0.28) % 1;

    // 墨黑暗室底
    ctx.fillStyle = "#141413";
    ctx.fillRect(0, 0, w, h);

    const pad = w < 420 ? 12 : 20;
    const cols = 3;
    const gap = 10;
    const colW = (w - pad * 2 - gap * (cols - 1)) / cols;
    const topY = 36;

    // 构造 6 张卡片（带价格标签，用于「定向查价」任务）
    const specs = [
      { id: 1, title: "台灯", price: "¥380", h: 74, c: "#2A2926", accent: PALETTE.red },
      { id: 2, title: "木椅", price: "¥640", h: 112, c: "#2A2926", accent: PALETTE.yellow },
      { id: 3, title: "花器", price: "¥210", h: 66, c: "#2A2926", accent: PALETTE.teal },
      { id: 4, title: "挂钟", price: "¥290", h: 98, c: "#2A2926", accent: PALETTE.teal },
      { id: 5, title: "地毯", price: "¥520", h: 70, c: "#2A2926", accent: PALETTE.red },
      { id: 6, title: "边几", price: "¥450", h: 86, c: "#2A2926", accent: PALETTE.yellow },
    ];

    const placed = [];
    if (layoutMode === "grid") {
      const rowH = 104;
      specs.forEach((sp, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        placed.push({ ...sp, x: pad + c * (colW + gap), y: topY + r * (rowH + gap), w: colW, h: rowH });
      });
    } else {
      const colH = [0, 0, 0];
      specs.forEach((sp) => {
        const minY = Math.min(...colH);
        const c = colH.indexOf(minY);
        const y = topY + (colH[c] > 0 ? colH[c] + gap : 0);
        placed.push({ ...sp, x: pad + c * (colW + gap), y, w: colW, h: sp.h });
        colH[c] = (y - topY) + sp.h;
      });
    }

    // 顶栏状态提示
    ctx.fillStyle = "#E8E0D4";
    ctx.font = `700 11px ${FONT_MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const modeLabel = layoutMode === "masonry" ? "MASONRY 瀑布流" : "GRID 齐行网格";
    const taskLabel = taskMode === "browse" ? "任务：无目的漫游灵感" : "任务：横向比对每款价格";
    ctx.fillText(`${modeLabel} · ${taskLabel}`, pad, 18);

    // 若是齐行网格 + 查价，绘出一条水平基线锚线（一眼看懂为何齐行更快！）
    if (taskMode === "compare" && layoutMode === "grid") {
      [0, 1].forEach((r) => {
        const ly = topY + r * (104 + gap) + 88;
        ctx.strokeStyle = "rgba(86, 219, 199, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(pad, ly);
        ctx.lineTo(w - pad, ly);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // 绘制卡片与锚点
    const anchors = [];
    placed.forEach((p) => {
      roundRectPath(ctx, p.x, p.y, p.w, p.h, 6);
      ctx.fillStyle = p.c;
      ctx.fill();
      ctx.strokeStyle = "rgba(250, 242, 231, 0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 卡片内色块示意（顶部）
      const mediaH = Math.max(24, p.h - 32);
      roundRectPath(ctx, p.x + 6, p.y + 6, p.w - 12, mediaH, 4);
      ctx.fillStyle = p.accent;
      ctx.globalAlpha = taskMode === "browse" ? 0.92 : 0.32;
      ctx.fill();
      ctx.globalAlpha = 1;

      // 底部标题与价格（价格永远落在卡片底边 -14px）
      const py = p.y + p.h - 14;
      ctx.fillStyle = "#FAF2E7";
      ctx.font = `700 11px ${FONT_HEAD}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(p.title, p.x + 8, py);

      ctx.fillStyle = taskMode === "compare" ? "#FAD165" : "#B5AEA3";
      ctx.font = `700 11px ${FONT_MONO}`;
      ctx.textAlign = "right";
      ctx.fillText(p.price, p.x + p.w - 8, py);

      anchors.push({
        x: taskMode === "compare" ? p.x + p.w - 24 : p.x + p.w * 0.5,
        y: taskMode === "compare" ? py : p.y + mediaH * 0.5 + 6,
      });
    });

    // 绘制视线扫视轨迹（绿色 = 顺畅匹配任务，朱红 = 高低跳动耗神）
    const isGoodMatch =
      (taskMode === "browse" && layoutMode === "masonry") ||
      (taskMode === "compare" && layoutMode === "grid");
    const strokeCol = isGoodMatch ? "#56DBC7" : "#FF8164";

    ctx.save();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    anchors.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    anchors.forEach((pt, i) => {
      ctx.fillStyle = strokeCol;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#141413";
      ctx.font = `700 9.5px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), pt.x, pt.y + 0.5);
    });

    // 动态扫视光点（非静止时沿路径移动）
    if (!still && anchors.length > 1) {
      const segs = anchors.length - 1;
      const pos = phase * segs;
      const idx = Math.min(segs - 1, Math.floor(pos));
      const t = pos - idx;
      const a = anchors[idx];
      const b = anchors[idx + 1];
      const gx = a.x + (b.x - a.x) * t;
      const gy = a.y + (b.y - a.y) * t;
      ctx.fillStyle = "#FAF2E7";
      ctx.beginPath();
      ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  return { draw };
}
