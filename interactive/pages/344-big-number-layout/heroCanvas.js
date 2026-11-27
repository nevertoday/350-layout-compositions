// 344 开场主角画布：大数字焦点手术台 & 15 米后排闪读仪（2D Canvas）
// 1:1 承袭 344 原海报炽烈朱橙、巨型骨白数字、斜切纯黑楔角、↗ 粗箭与 4×6 骨白点阵。
// 性能优化：按需脏标记重绘、批量路径点阵、手机端 pixelRatio 上限 1.5、15m 后排缩略单次 drawImage 复用主画面，慢手机软件渲染亦可稳跑 ≥ 40fps。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SLIDE_W, SLIDE_H, SCALE_MIN, SCALE_MAX, SAFE_SCALE_MIN, SAFE_SCALE_MAX, evaluate } from "./model.js";

const CONTEXT_CYCLE = ["wall", "bare", "vague", "anchor"];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 缓存中文折行结果，避免拖拽字阶时每帧重复逐字 measureText
const wrapCache = new Map();
function wrapCJK(ctx, text, maxW, maxLines, fontKey) {
  if (!text) return [];
  const key = `${fontKey}|${Math.round(maxW)}|${maxLines}|${text}`;
  const hit = wrapCache.get(key);
  if (hit) return hit;
  const lines = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines) break;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && text.length > lines.join("").length) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
  }
  if (wrapCache.size > 64) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

function drawUpRightArrow(ctx, x, y, size, color, strokeW = 4.2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeW;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x + size * 0.25, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size * 0.75);
  ctx.stroke();
}

// 单次 beginPath + fill 批量绘制 4×6 点阵（1 次 draw call 替代 24 次）
function drawDotMatrix(ctx, x0, y0, cols, rows, gap, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let row = 0; row < rows; row++) {
    const cy = y0 + row * gap;
    for (let col = 0; col < cols; col++) {
      const cx = x0 + col * gap;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

function renderSlide(ctx, state, ev, { animIn = 1, hoverZone = "", blink = null } = {}) {
  const { lay, sc, numText, numColor, heroPx, heroBox, wedgeBox, wedgePoly, extraBoxes, activeNote, clipped } = ev;

  ctx.save();
  ctx.fillStyle = lay.bg;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  const ease = 1 - Math.pow(1 - clamp(animIn, 0, 1), 3);

  // 1) 主大数字（先绘，让 344 斜切纯黑楔角如原海报般斜切住数字底脚）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SLIDE_W, SLIDE_H);
  ctx.clip();

  const numYOffset = (1 - ease) * 18;
  ctx.font = `900 ${heroPx}px "Outfit", "Big Shoulders", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (clipped) {
    ctx.strokeStyle = lay.id === "slash" ? "#0A0B08" : "#FF5A3C";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(
      Math.max(4, heroBox.x),
      Math.max(4, heroBox.y),
      Math.min(SLIDE_W - 8, heroBox.w),
      Math.min(SLIDE_H - 8, heroBox.h)
    );
    ctx.setLineDash([]);
  }

  if (lay.id === "center" && state.contrastMode === "high" && numText.endsWith("%")) {
    const mainPart = numText.slice(0, -1);
    const pctPart = "%";
    const wMain = ctx.measureText(mainPart).width;
    const wPct = ctx.measureText(pctPart).width;
    const startX = heroBox.cx - (wMain + wPct) / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = numColor;
    ctx.fillText(mainPart, startX, heroBox.cy + numYOffset + heroPx * 0.04);
    ctx.fillStyle = lay.accent;
    ctx.fillText(pctPart, startX + wMain, heroBox.cy + numYOffset + heroPx * 0.04);
  } else {
    ctx.fillStyle = numColor;
    ctx.fillText(numText, heroBox.cx, heroBox.cy + numYOffset + heroPx * 0.04);
  }

  if (state.precision === "raw") {
    const badgeW = 196;
    const badgeH = 30;
    const bx = clamp(heroBox.cx - badgeW / 2, 18, SLIDE_W - badgeW - 18);
    const by = clamp(heroBox.y - 40, 14, SLIDE_H - 180);
    ctx.fillStyle = "#0A0B08";
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.strokeStyle = "#F3EADB";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, badgeW, badgeH);
    ctx.font = `700 14px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#F3EADB";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("× 冗余小数 · 点数字取整", bx + badgeW / 2, by + badgeH / 2 + 1);
  } else if (hoverZone === "hero") {
    ctx.strokeStyle = lay.id === "center" ? "#F64316" : "rgba(243,234,219,0.75)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(heroBox.x - 8, heroBox.y - 8, heroBox.w + 16, heroBox.h + 16);
    ctx.setLineDash([]);
  }
  ctx.restore();

  // 2) 争宠副数字卡（开场 3 张，点即移出归口述）
  extraBoxes.forEach((card, idx) => {
    const oy = (1 - ease) * (10 + idx * 8);
    const cy0 = card.y + oy;
    const isHov = hoverZone === card.id;
    ctx.fillStyle = lay.id === "slash" ? "rgba(10, 11, 8, 0.88)" : lay.id === "split" ? "#1E1B18" : "#FAF6EE";
    ctx.fillRect(card.x, cy0, card.w, card.h);
    ctx.strokeStyle = isHov ? "#F3EADB" : "#FF7D5C";
    ctx.lineWidth = isHov ? 2.5 : 2;
    ctx.setLineDash([7, 4]);
    ctx.strokeRect(card.x, cy0, card.w, card.h);
    ctx.setLineDash([]);

    ctx.font = `800 36px "Outfit", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = lay.id === "center" ? "#141210" : "#F3EADB";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(card.num, card.cx, cy0 + card.h * 0.43);

    ctx.font = `500 15px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = lay.id === "center" ? "#5A5248" : "#CFC5B6";
    ctx.fillText(card.label, card.cx, cy0 + card.h * 0.72);

    const tw = Math.min(card.w - 12, 130);
    const tx = card.x + card.w - tw - 6;
    const ty = cy0 + 6;
    ctx.fillStyle = "#B51D0E";
    ctx.fillRect(tx, ty, tw, 24);
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#FFF8F0";
    ctx.fillText("× 点此移出副数", tx + tw / 2, ty + 12.5);
  });

  // 3) 说明区：344 斜切纯黑楔角 / 暗场右栏 / 暖骨底部黑带
  if (lay.id === "slash" && wedgePoly) {
    ctx.beginPath();
    ctx.moveTo(wedgePoly[0].x, wedgePoly[0].y);
    for (let i = 1; i < wedgePoly.length; i++) ctx.lineTo(wedgePoly[i].x, wedgePoly[i].y);
    ctx.closePath();
    ctx.fillStyle = lay.wedgeBg;
    ctx.fill();

    drawDotMatrix(ctx, SLIDE_W - 118, SLIDE_H - 132, 4, 6, 22, 3.4, "#F3EADB");

    if (hoverZone === "wedge") {
      ctx.strokeStyle = "#F3EADB";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(wedgePoly[0].x, wedgePoly[0].y + 2);
      ctx.lineTo(wedgePoly[1].x, wedgePoly[1].y + 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (lay.id === "split") {
    ctx.fillStyle = lay.wedgeBg;
    ctx.fillRect(wedgeBox.x, wedgeBox.y, wedgeBox.w, wedgeBox.h);
    ctx.fillStyle = lay.accent;
    ctx.fillRect(wedgeBox.x, wedgeBox.y, 5, wedgeBox.h);
    drawDotMatrix(ctx, wedgeBox.x + wedgeBox.w - 76, wedgeBox.y + wedgeBox.h - 92, 4, 4, 18, 2.8, "rgba(243,234,219,0.55)");
  } else {
    ctx.fillStyle = lay.wedgeBg;
    ctx.fillRect(wedgeBox.x, wedgeBox.y, wedgeBox.w, wedgeBox.h);
    ctx.fillStyle = lay.accent;
    ctx.fillRect(wedgeBox.x, wedgeBox.y, 6, wedgeBox.h);
  }

  const padX = lay.id === "slash" ? wedgeBox.x + 8 : wedgeBox.x + 28;
  const padY = lay.id === "slash" ? wedgeBox.y + 18 : wedgeBox.y + 26;
  const maxTextW = lay.id === "slash" ? 560 : wedgeBox.w - 56;

  if (state.contextMode === "bare") {
    ctx.strokeStyle = "#FF6D42";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(padX, padY + 6, Math.min(340, maxTextW), 72);
    ctx.setLineDash([]);
    ctx.font = `700 16px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#FF8B6B";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("× 空降孤数（缺指标与基线）· 点此补全", padX + 16, padY + 42);
  } else {
    const arrowSz = lay.id === "slash" ? 28 : 24;
    drawUpRightArrow(ctx, padX, padY + 2, arrowSz, lay.id === "split" ? lay.accent : "#F3EADB", 4.2);

    ctx.font = `900 ${lay.id === "slash" ? 30 : 28}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = lay.wedgeText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(sc.label, padX + arrowSz + 18, padY - 1);

    const ruleY = padY + 44;
    ctx.fillStyle = "rgba(243, 234, 219, 0.45)";
    ctx.fillRect(padX + arrowSz + 18, ruleY, Math.min(430, maxTextW - arrowSz - 18), 1.5);

    const isWall = state.contextMode === "wall";
    const noteFont = `${isWall ? 400 : 500} ${isWall ? 15.5 : 17}px "Noto Sans SC", sans-serif`;
    ctx.font = noteFont;
    ctx.fillStyle = isWall ? "#FFB8A5" : lay.wedgeMuted;
    const noteLines = wrapCJK(ctx, activeNote, maxTextW - arrowSz - 18, isWall ? 5 : 2, noteFont);
    noteLines.forEach((ln, i) => {
      ctx.fillText(ln, padX + arrowSz + 18, ruleY + 12 + i * (isWall ? 22 : 25));
    });

    if (state.contextMode === "wall" || state.contextMode === "vague") {
      const warnTxt = state.contextMode === "wall" ? `× ${ev.captionChars}字字墙 · 点此精简` : "× 缺对比基线 · 点此补口径";
      ctx.font = `700 12.5px "Noto Sans SC", sans-serif`;
      const bw = ctx.measureText(warnTxt).width + 20;
      const bx = lay.id === "slash" ? SLIDE_W - 140 - bw : wedgeBox.x + wedgeBox.w - bw - 14;
      const by = lay.id === "slash" ? wedgeBox.y + 10 : wedgeBox.y + 12;
      ctx.fillStyle = "#B51D0E";
      ctx.fillRect(bx, by, bw, 24);
      ctx.fillStyle = "#FFF8F0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTxt, bx + bw / 2, by + 12.5);
    }
  }

  // 4) 顶部左右排印角标
  ctx.font = `700 13px "Space Mono", monospace`;
  ctx.textBaseline = "top";
  const chipBg = lay.id === "center" ? "rgba(10,11,8,0.08)" : "rgba(10,11,8,0.28)";
  const chipFg = lay.id === "center" ? "#1A1815" : "#F3EADB";
  const leftLabel = `16:9 SLIDE · ${ev.scale.toFixed(1)}× · ${ev.ratioWCAG.toFixed(1)}:1`;
  const lw = ctx.measureText(leftLabel).width + 18;
  ctx.fillStyle = chipBg;
  ctx.fillRect(16, 14, lw, 26);
  ctx.fillStyle = chipFg;
  ctx.textAlign = "left";
  ctx.fillText(leftLabel, 25, 20);

  const statusLabel = `${ev.score}/4 · ${ev.tag}`;
  const sw = ctx.measureText(statusLabel).width + 26;
  ctx.fillStyle = ev.score === 4 ? "#0F7A52" : "#0A0B08";
  ctx.fillRect(SLIDE_W - sw - 16, 14, sw, 26);
  ctx.fillStyle = "#F3EADB";
  ctx.textAlign = "center";
  ctx.fillText(statusLabel, SLIDE_W - sw / 2 - 16, 20);

  // 5) Space 3 秒后排闪读叠加层
  if (blink && blink.active) {
    const elapsedMs = blink.elapsed * 1000;
    const progress = clamp(elapsedMs / 3000, 0, 1);

    ctx.fillStyle = "rgba(6, 6, 5, 0.34)";
    ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

    let accMs = 0;
    let prevPt = null;
    for (let i = 0; i < ev.eyePath.length; i++) {
      const pt = ev.eyePath[i];
      const startMs = accMs;
      accMs += pt.ms;
      if (elapsedMs < startMs) break;
      const segP = clamp((elapsedMs - startMs) / pt.ms, 0, 1);
      if (prevPt) {
        ctx.strokeStyle = ev.score === 4 ? "#5EE0A8" : "#FFCC4D";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(prevPt.x + (pt.x - prevPt.x) * segP, prevPt.y + (pt.y - prevPt.y) * segP);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (segP >= 0.35) {
        const pulse = 18 + Math.sin(blink.elapsed * 9 + i) * 4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = ev.score === 4 ? "#5EE0A8" : "#FF6D42";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = ev.score === 4 ? "#5EE0A8" : "#FF6D42";
        ctx.fill();

        ctx.font = `700 13px "Noto Sans SC", sans-serif`;
        const nw = ctx.measureText(pt.note).width + 18;
        const nx = clamp(pt.x - nw / 2, 16, SLIDE_W - nw - 16);
        const ny = clamp(pt.y - 38, 48, SLIDE_H - 42);
        ctx.fillStyle = "rgba(10,11,8,0.92)";
        ctx.fillRect(nx, ny, nw, 24);
        ctx.fillStyle = ev.score === 4 ? "#5EE0A8" : "#FFD685";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pt.note, nx + nw / 2, ny + 12.5);
      }
      prevPt = pt;
    }

    ctx.fillStyle = "rgba(10,11,8,0.9)";
    ctx.fillRect(0, SLIDE_H - 34, SLIDE_W, 34);
    ctx.fillStyle = ev.score === 4 ? "#0F7A52" : "#F64316";
    ctx.fillRect(0, SLIDE_H - 34, SLIDE_W * progress, 5);
    ctx.font = `700 14px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = "#F3EADB";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const secStr = `${Math.min(3.0, blink.elapsed).toFixed(1)}s / 3.0s`;
    const verdict =
      ev.score === 4
        ? `15m 后排闪读验真 · ${secStr} · 约 ${(ev.totalScanMs / 1000).toFixed(1)}s 锁死重点（示意）`
        : `15m 后排闪读验真 · ${secStr} · 视线受阻，3 秒内难以锁焦（示意）`;
    ctx.fillText(verdict, 18, SLIDE_H - 15);
  }

  ctx.restore();
}

export function mountHeroCanvas(canvas, getState, onPatch) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let animIn = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let hoverZone = "";
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScale = 1.8;
  let blink = { active: false, elapsed: 0 };

  let geom = {
    cssW: 800,
    cssH: 450,
    dpr: 1.5,
    slideRect: { x: 0, y: 0, w: 800, h: 450 },
    rulerRect: null,
    isMobileTall: false,
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    const h = Math.max(180, Math.round(r.height));
    // 手机竖屏或窄画布按 GUIDE 建议限制 DPR ≤ 1.5，大幅降低慢手机软件光栅负载
    const dpr = pixelRatio(w <= 560 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
    geom.cssW = w;
    geom.cssH = h;
    geom.dpr = dpr;
    const ideal169H = (w * SLIDE_H) / SLIDE_W;
    if (h > ideal169H + 64) {
      geom.isMobileTall = true;
      geom.slideRect = { x: 0, y: 0, w, h: ideal169H };
      geom.rulerRect = { x: 0, y: ideal169H, w, h: h - ideal169H };
    } else {
      geom.isMobileTall = false;
      const s = Math.min(w / SLIDE_W, h / SLIDE_H);
      const sw = SLIDE_W * s;
      const sh = SLIDE_H * s;
      geom.slideRect = { x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh };
      geom.rulerRect = null;
    }
  }

  function clientToCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function toSlideCoords(pt) {
    const sr = geom.slideRect;
    if (pt.x < sr.x || pt.x > sr.x + sr.w || pt.y < sr.y || pt.y > sr.y + sr.h) return null;
    return {
      x: ((pt.x - sr.x) / sr.w) * SLIDE_W,
      y: ((pt.y - sr.y) / sr.h) * SLIDE_H,
    };
  }

  function hitTest(pt, ev) {
    const sp = toSlideCoords(pt);
    if (!sp) return "";
    for (const b of ev.extraBoxes) {
      if (sp.x >= b.x && sp.x <= b.x + b.w && sp.y >= b.y && sp.y <= b.y + b.h) return b.id;
    }
    if (ev.lay.id === "slash" && ev.wedgePoly) {
      const t = sp.x / SLIDE_W;
      const edgeY = ev.wedgePoly[0].y + (ev.wedgePoly[1].y - ev.wedgePoly[0].y) * t;
      if (sp.y >= edgeY) return "wedge";
    } else {
      const wb = ev.wedgeBox;
      if (sp.x >= wb.x && sp.x <= wb.x + wb.w && sp.y >= wb.y && sp.y <= wb.y + wb.h) return "wedge";
    }
    const hb = ev.heroBox;
    const pad = 18;
    if (sp.x >= hb.x - pad && sp.x <= hb.x + hb.w + pad && sp.y >= hb.y - pad && sp.y <= hb.y + hb.h + pad) return "hero";
    return "canvas";
  }

  function drawFrame(t, dt, { still }) {
    resize();
    let animating = false;
    if (still) {
      if (animIn < 1) {
        animIn = 1;
        dirty = true;
      }
    } else {
      if (animIn < 1) {
        animIn = Math.min(1, animIn + Math.max(dt, 0.016) * 2.4);
        animating = true;
      }
      if (blink.active) {
        blink.elapsed += dt;
        animating = true;
        if (blink.elapsed >= 3.2) {
          blink.active = false;
          blink.elapsed = 0;
        }
      }
    }

    // 静置且无脏标记时直接跳过绘制，零多余 GPU/软件渲染开销
    if (!dirty && !animating && !still) return;
    dirty = false;

    const state = getState();
    const ev = evaluate(state);
    const dpr = geom.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0A0B08";
    ctx.fillRect(0, 0, geom.cssW, geom.cssH);

    // 主 16:9 幻灯片（严格等比）
    const sr = geom.slideRect;
    ctx.save();
    ctx.translate(sr.x, sr.y);
    ctx.scale(sr.w / SLIDE_W, sr.h / SLIDE_H);
    renderSlide(ctx, state, ev, { animIn, hoverZone, blink: still ? null : blink });
    ctx.restore();

    // 手机竖屏下方 15m 后排缩略：单次 drawImage 直接拷贝上方已画好的主画面，零二次渲染成本！
    if (geom.isMobileTall && geom.rulerRect) {
      const rr = geom.rulerRect;
      ctx.fillStyle = "#11100E";
      ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
      ctx.fillStyle = "#F64316";
      ctx.fillRect(rr.x, rr.y, rr.w, 2);

      const pad = 14;
      const thumbW = Math.min(144, Math.round(rr.w * 0.4));
      const thumbH = Math.round((thumbW * SLIDE_H) / SLIDE_W);
      const tx = rr.x + pad;
      const ty = rr.y + 16;

      ctx.drawImage(
        canvas,
        Math.round(sr.x * dpr),
        Math.round(sr.y * dpr),
        Math.round(sr.w * dpr),
        Math.round(sr.h * dpr),
        tx,
        ty,
        thumbW,
        thumbH
      );
      ctx.strokeStyle = ev.score === 4 ? "#5EE0A8" : "#F64316";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx - 1, ty - 1, thumbW + 2, thumbH + 2);

      ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
      ctx.fillStyle = "#CFC5B6";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("15m 后排缩略视野", tx, ty + thumbH + 7);

      const rx = tx + thumbW + 14;
      const rw = rr.w - (rx - rr.x) - pad;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#F3EADB";
      ctx.fillText("横拖调字阶比", rx, ty);

      ctx.font = `700 22px "Space Mono", monospace`;
      ctx.fillStyle = ev.pillars.contrast.ok ? "#5EE0A8" : "#FF7B54";
      ctx.fillText(`${ev.scale.toFixed(1)}×`, rx, ty + 20);

      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#CFC5B6";
      ctx.fillText(`安全区 ${SAFE_SCALE_MIN}×–${SAFE_SCALE_MAX}×`, rx, ty + 50);

      const barY = ty + 72;
      const barH = 10;
      ctx.fillStyle = "#2A2622";
      ctx.fillRect(rx, barY, rw, barH);
      const sLo = (SAFE_SCALE_MIN - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
      const sHi = (SAFE_SCALE_MAX - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
      ctx.fillStyle = "rgba(94, 224, 168, 0.28)";
      ctx.fillRect(rx + rw * sLo, barY, rw * (sHi - sLo), barH);
      const norm = clamp((ev.scale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN), 0, 1);
      ctx.fillStyle = ev.pillars.contrast.ok ? "#5EE0A8" : "#F64316";
      ctx.fillRect(rx, barY, rw * norm, barH);
      ctx.fillStyle = "#F3EADB";
      ctx.fillRect(rx + rw * norm - 3, barY - 4, 6, barH + 8);

      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#BDB2A2";
      ctx.fillText("点红卡移副数 · 点大数取整 · 点黑区切口径", rr.x + pad, rr.y + rr.h - 24);
    }
  }

  const ctrl = loop(canvas, drawFrame);

  function markDirty(immediate = false) {
    dirty = true;
    if (immediate || reducedMotion.matches) ctrl.draw();
  }

  function onDown(e) {
    if (e.pointerType === "touch") return;
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartScale = getState().scale;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }

  function onMove(e) {
    if (e.pointerType === "touch") return;
    const pt = clientToCanvas(e);
    if (!dragging) {
      const ev = evaluate(getState());
      const hz = hitTest(pt, ev);
      if (hz !== hoverZone) {
        hoverZone = hz;
        canvas.style.cursor = hz === "canvas" || hz === "" ? "ew-resize" : "pointer";
        markDirty();
      }
      return;
    }
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!dragMoved && Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy) * 0.75) {
      dragMoved = true;
    }
    if (dragMoved) {
      const span = Math.max(200, geom.cssW * 0.62);
      const nextScale = clamp(dragStartScale + (dx / span) * (SCALE_MAX - SCALE_MIN), SCALE_MIN, SCALE_MAX);
      onPatch({ scale: Math.round(nextScale * 10) / 10 });
    }
  }

  function handleTap(pt) {
    const st = getState();
    const ev = evaluate(st);
    const zone = hitTest(pt, ev);
    if (zone && zone.startsWith("e")) {
      onPatch({ activeExtras: st.activeExtras.filter((id) => id !== zone) });
    } else if (zone === "hero") {
      onPatch({ precision: st.precision === "raw" ? "clean" : "raw" });
    } else if (zone === "wedge") {
      const nextIdx = (CONTEXT_CYCLE.indexOf(st.contextMode) + 1) % CONTEXT_CYCLE.length;
      onPatch({ contextMode: CONTEXT_CYCLE[nextIdx] });
    } else if (geom.isMobileTall && geom.rulerRect && pt.y >= geom.rulerRect.y) {
      const pad = 14;
      const thumbW = Math.min(144, Math.round(geom.rulerRect.w * 0.4));
      const rx = pad + thumbW + 14;
      const rw = Math.max(80, geom.rulerRect.w - rx - pad);
      const norm = clamp((pt.x - rx) / rw, 0, 1);
      const nextScale = SCALE_MIN + norm * (SCALE_MAX - SCALE_MIN);
      onPatch({ scale: Math.round(nextScale * 10) / 10 });
    }
  }

  function onUp(e) {
    if (e.pointerType === "touch") return;
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    if (!dragMoved) handleTap(clientToCanvas(e));
  }

  // 触屏原生事件（单指横滑调级差、轻点手术操作，仅标脏待下一 rAF 绘制，避免同帧双绘）
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartScale = 1.8;
  let touchDragged = false;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartScale = getState().scale;
    touchDragged = false;
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (!touchDragged && Math.abs(dx) > 4 && Math.abs(dx) >= Math.abs(dy) * 0.65) {
      touchDragged = true;
    }
    if (touchDragged) {
      const span = Math.max(170, geom.cssW * 0.62);
      const nextScale = clamp(touchStartScale + (dx / span) * (SCALE_MAX - SCALE_MIN), SCALE_MIN, SCALE_MAX);
      onPatch({ scale: Math.round(nextScale * 10) / 10 }, { deferDraw: true });
    }
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    if (!touchDragged && e.changedTouches.length) {
      const t0 = e.changedTouches[0];
      const r = canvas.getBoundingClientRect();
      handleTap({ x: t0.clientX - r.left, y: t0.clientY - r.top });
    }
    touchDragged = false;
  }, { passive: true });

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  canvas.addEventListener("pointerleave", () => {
    if (!dragging && hoverZone) {
      hoverZone = "";
      markDirty();
    }
  });

  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ scale: Math.round(clamp(st.scale + 0.6, SCALE_MIN, SCALE_MAX) * 10) / 10 });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ scale: Math.round(clamp(st.scale - 0.6, SCALE_MIN, SCALE_MAX) * 10) / 10 });
    } else if (e.key === " ") {
      e.preventDefault();
      triggerBlink();
    }
  });

  const ro = new ResizeObserver(() => markDirty(true));
  ro.observe(canvas);

  function triggerBlink() {
    blink = { active: true, elapsed: 0 };
    markDirty(true);
  }

  markDirty(true);

  return {
    draw: (immediate = false) => markDirty(immediate),
    triggerBlink,
  };
}
