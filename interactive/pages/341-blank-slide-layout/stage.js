// 341 空白幻灯片版式 — 开场 2D Canvas 交互舞台（空白页雕琢与翻页实测台）
// 1:1 承袭 341 原海报暖米画纸 #FAF7ED、石青灰细虚线边距框、天蓝实心焦点圆 #A0CDF9 与细虚线坐标轴。
// 支持直接拖拽安全边距、主焦点、说明文案，直点扫除 3 处「填满焦虑」杂物，并演播「密集前页 → 空白页」切页凝视波纹。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { CLUTTER_KEYS, SCENARIOS, SLIDE_ASPECT, clamp, evaluate } from "./model.js";

const COLORS = {
  paper: "#FAF7ED",
  slideSurface: "#FFFDF7",
  borderHair: "#DDD7C8",
  dashedGuide: "#C0B9AA",
  skyFill: "#A0CDF9",
  blueInk: "#1668B8",
  blueDeep: "#0F4C8A",
  ink: "#0D0E0D",
  bodyInk: "#2B2C29",
  mutedInk: "#5C5B53",
  failRed: "#B92B27",
  failSoft: "rgba(185, 43, 39, 0.085)",
  failBorder: "rgba(185, 43, 39, 0.62)",
  passTeal: "#156F52",
  clutterBg: "#ECE8DC",
  clutterStroke: "#B5AFA0",
  badgeBg: "#2E84DB",
};

const SANS = '"Noto Sans SC", sans-serif';
const LATIN = '"Bebas Neue", "Noto Sans SC", sans-serif';
const MONO = '"DM Mono", "Noto Sans SC", monospace';

function wrapLines(ctx, text, maxW, maxLines = 3) {
  const lines = [];
  let cur = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = cur + ch;
    if (ctx.measureText(next).width > maxW && cur.length > 0) {
      lines.push(cur);
      if (lines.length >= maxLines) {
        const last = lines[maxLines - 1];
        lines[maxLines - 1] = last.length > 1 ? `${last.slice(0, -1)}…` : last;
        return lines;
      }
      cur = ch;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r = 2) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function createHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let width = 800;
  let height = 450;
  let dpr = 1;
  let compactMode = false;

  let slideRect = { x: 0, y: 0, w: 800, h: 450 };
  let mobileRulerRect = null;
  let mobileChipRects = [];
  let mobileSlideTabRects = [];

  let introProgress = reducedMotion.matches ? 1 : 0;
  let beatActive = false;
  let beatTime = 0;
  const BEAT_PREV_END = 1.05;
  const BEAT_CUT_END = 1.25;
  const BEAT_TOTAL = 2.85;

  let hoverTarget = null;
  let drag = null;
  let dirty = true;

  function computeLayout() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(280, Math.round(rect.width || 800));
    const isPortraitPhone = cssW < 520 && window.innerHeight > window.innerWidth;
    compactMode = isPortraitPhone;
    const cssH = compactMode
      ? Math.round(cssW * 1.08)
      : Math.round(cssW / SLIDE_ASPECT);

    if (canvas.style.height !== `${cssH}px`) {
      canvas.style.height = `${cssH}px`;
    }
    const maxDpr = compactMode ? 1.5 : 2;
    const nextDpr = Math.min(pixelRatio(maxDpr), maxDpr);
    const pxW = Math.round(cssW * nextDpr);
    const pxH = Math.round(cssH * nextDpr);

    if (canvas.width !== pxW || canvas.height !== pxH || width !== cssW || height !== cssH) {
      canvas.width = pxW;
      canvas.height = pxH;
      width = cssW;
      height = cssH;
      dpr = nextDpr;
      dirty = true;
    }

    if (compactMode) {
      const pad = 6;
      const sw = width - pad * 2;
      const sh = Math.round(sw / SLIDE_ASPECT);
      slideRect = { x: pad, y: pad, w: sw, h: sh };
      const dockY = slideRect.y + slideRect.h + 12;
      mobileRulerRect = { x: pad, y: dockY, w: sw, h: 46 };
      const chipY = dockY + 54;
      const chipGap = 6;
      const chipW = (sw - chipGap * 2) / 3;
      mobileChipRects = CLUTTER_KEYS.map((key, i) => ({
        key,
        x: pad + i * (chipW + chipGap),
        y: chipY,
        w: chipW,
        h: 34,
      }));
      const tabY = chipY + 42;
      const tabW = (sw - chipGap * 2) / 3;
      mobileSlideTabRects = [0, 1, 2].map((idx) => ({
        idx,
        x: pad + idx * (tabW + chipGap),
        y: tabY,
        w: tabW,
        h: Math.max(30, height - tabY - 6),
      }));
    } else {
      slideRect = { x: 0, y: 0, w: width, h: height };
      mobileRulerRect = null;
      mobileChipRects = [];
      mobileSlideTabRects = [];
    }
  }

  function toSlideUV(px, py) {
    return {
      u: (px - slideRect.x) / slideRect.w,
      v: (py - slideRect.y) / slideRect.h,
    };
  }

  function inRect(px, py, r) {
    return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function hitTest(px, py, audit) {
    if (compactMode) {
      for (const tab of mobileSlideTabRects) {
        if (inRect(px, py, tab)) return { kind: "slideTab", idx: tab.idx };
      }
      for (const chip of mobileChipRects) {
        if (inRect(px, py, chip)) return { kind: "clutterChip", key: chip.key };
      }
      if (inRect(px, py, mobileRulerRect)) return { kind: "ruler" };
    }

    if (!inRect(px, py, slideRect)) return { kind: "space" };
    if (state.activeSlide !== 1 || beatActive) return { kind: "slideBg" };

    const { u, v } = toSlideUV(px, py);
    const { focalBox, copyBox, clutterBoxes, safeRect } = audit.geom;

    for (const key of ["badge", "notes", "frameTop", "frameBottom"]) {
      const cb = clutterBoxes[key];
      if (cb && u >= cb.x0 && u <= cb.x1 && v >= cb.y0 && v <= cb.y1) {
        return { kind: "clutter", key: cb.key };
      }
    }

    const distF = Math.hypot((u - focalBox.cx) / (focalBox.rx * 1.08), (v - focalBox.cy) / (focalBox.ry * 1.08));
    if (distF <= 1.02) return { kind: "focal" };

    if (u >= copyBox.x0 - 0.015 && u <= copyBox.x1 + 0.015 && v >= copyBox.y0 - 0.02 && v <= copyBox.y1 + 0.02) {
      return { kind: "copy" };
    }

    const tolX = 0.028;
    const tolY = 0.04;
    const nearLeft = Math.abs(u - safeRect.x0) < tolX && v >= safeRect.y0 - tolY && v <= safeRect.y1 + tolY;
    const nearRight = Math.abs(u - safeRect.x1) < tolX && v >= safeRect.y0 - tolY && v <= safeRect.y1 + tolY;
    const nearTop = Math.abs(v - safeRect.y0) < tolY && u >= safeRect.x0 - tolX && u <= safeRect.x1 + tolX;
    const nearBottom = Math.abs(v - safeRect.y1) < tolY && u >= safeRect.x0 - tolX && u <= safeRect.x1 + tolX;
    if (nearLeft || nearRight || nearTop || nearBottom) {
      return { kind: "margin" };
    }

    return { kind: "space" };
  }

  function snapValue(val, targets, radius = 0.018) {
    for (const t of targets) {
      if (Math.abs(val - t) < radius) return t;
    }
    return val;
  }

  function drawDensePrevSlide(r, scenario, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#F4F1E8";
    ctx.fillRect(r.x, r.y, r.w, r.h);

    const headerH = r.h * 0.16;
    ctx.fillStyle = "#2A3542";
    ctx.fillRect(r.x, r.y, r.w, headerH);
    ctx.fillStyle = "#E8EDF2";
    ctx.font = `700 ${Math.max(10, Math.round(r.w * 0.021))}px ${SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(scenario.prevTitle, r.x + r.w * 0.035, r.y + headerH * 0.52);

    ctx.fillStyle = "#A0CDF9";
    ctx.font = `500 ${Math.max(9, Math.round(r.w * 0.014))}px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText("SLIDE 01 · DENSE DATA", r.x + r.w * 0.965, r.y + headerH * 0.52);

    const padX = r.w * 0.032;
    const bodyY = r.y + headerH + r.h * 0.04;
    const leftW = r.w * 0.54;
    const rowH = r.h * 0.165;
    for (let i = 0; i < scenario.prevBullets.length; i++) {
      const ry = bodyY + i * (rowH + r.h * 0.02);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(r.x + padX, ry, leftW, rowH);
      ctx.strokeStyle = "#CFC9BA";
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + padX, ry, leftW, rowH);
      ctx.fillStyle = "#3A4654";
      ctx.fillRect(r.x + padX, ry, 4, rowH);
      ctx.fillStyle = "#2C3034";
      ctx.font = `500 ${Math.max(9, Math.round(r.w * 0.0155))}px ${SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const lines = wrapLines(ctx, scenario.prevBullets[i], leftW - 18, 2);
      lines.forEach((ln, li) => {
        const yOff = lines.length === 1 ? rowH * 0.5 : rowH * (0.34 + li * 0.34);
        ctx.fillText(ln, r.x + padX + 11, ry + yOff);
      });
    }

    const rightX = r.x + padX + leftW + r.w * 0.028;
    const rightW = r.w - (rightX - r.x) - padX;
    const chartH = r.h * 0.42;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(rightX, bodyY, rightW, chartH);
    ctx.strokeStyle = "#CFC9BA";
    ctx.strokeRect(rightX, bodyY, rightW, chartH);

    for (let g = 1; g <= 4; g++) {
      const gy = bodyY + (chartH * g) / 5;
      ctx.strokeStyle = "#E6E2D8";
      ctx.beginPath();
      ctx.moveTo(rightX + 8, gy);
      ctx.lineTo(rightX + rightW - 8, gy);
      ctx.stroke();
    }
    const bars = [0.42, 0.58, 0.49, 0.68, 0.62, 0.77, 0.85];
    const bw = (rightW - 28) / bars.length;
    bars.forEach((v, i) => {
      const bh = (chartH - 28) * v;
      ctx.fillStyle = i === bars.length - 1 ? "#2E6DA8" : "#8FA3B8";
      ctx.fillRect(rightX + 14 + i * bw + 2, bodyY + chartH - 12 - bh, Math.max(4, bw - 5), bh);
    });

    const gridY = bodyY + chartH + r.h * 0.03;
    const cellW = (rightW - 6) / 2;
    const cellH = r.h * 0.125;
    const kpis = ["Q1 61.4%", "Q2 64.0%", "Q3 69.2%", "Q4 78.1%"];
    kpis.forEach((txt, i) => {
      const cx = rightX + (i % 2) * (cellW + 6);
      const cy = gridY + Math.floor(i / 2) * (cellH + 6);
      ctx.fillStyle = "#EAE5D9";
      ctx.fillRect(cx, cy, cellW, cellH);
      ctx.strokeStyle = "#C5BFAE";
      ctx.strokeRect(cx, cy, cellW, cellH);
      ctx.fillStyle = "#2F353B";
      ctx.font = `600 ${Math.max(9, Math.round(r.w * 0.0145))}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, cx + cellW / 2, cy + cellH / 2);
    });

    const tipW = Math.min(r.w * 0.54, 300);
    const tipH = Math.max(24, r.h * 0.085);
    const tipX = r.x + (r.w - tipW) / 2;
    const tipY = r.y + r.h - tipH - 10;
    ctx.fillStyle = "rgba(16, 23, 32, 0.88)";
    drawRoundedRect(ctx, tipX, tipY, tipW, tipH, 2);
    ctx.fill();
    ctx.fillStyle = "#F4F6F9";
    ctx.font = `600 ${Math.max(10, Math.round(r.w * 0.0155))}px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(beatActive ? "01 密集前页 → 即将切入空白页…" : "01 密集前页（点击返回 02 空白页）", tipX + tipW / 2, tipY + tipH / 2);
    ctx.restore();
  }

  function drawNextFollowupSlide(r, scenario) {
    ctx.save();
    ctx.fillStyle = COLORS.slideSurface;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    const mx = r.w * 0.1;
    const my = r.h * 0.12;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.dashedGuide;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + mx, r.y + my, r.w - mx * 2, r.h - my * 2);
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.blueInk;
    ctx.font = `500 ${Math.max(10, Math.round(r.w * 0.015))}px ${MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("SLIDE 03 · FOLLOW-UP", r.x + mx + 12, r.y + my + 12);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `800 ${Math.max(13, Math.round(r.w * 0.03))}px ${SANS}`;
    ctx.fillText(scenario.nextTitle, r.x + mx + 12, r.y + my + r.h * 0.11);

    ctx.fillStyle = COLORS.mutedInk;
    ctx.font = `400 ${Math.max(10, Math.round(r.w * 0.017))}px ${SANS}`;
    ctx.fillText(scenario.nextSub, r.x + mx + 12, r.y + my + r.h * 0.22);

    const cardTop = r.y + my + r.h * 0.34;
    const cardGap = r.w * 0.025;
    const availW = r.w - mx * 2 - 24;
    const cw = (availW - cardGap * 2) / 3;
    const ch = r.h * 0.34;
    const steps = ["01 承接上页核心", "02 展开证据拆解", "03 落地执行排期"];
    steps.forEach((st, i) => {
      const cx = r.x + mx + 12 + i * (cw + cardGap);
      ctx.fillStyle = "#F5F2E8";
      ctx.fillRect(cx, cardTop, cw, ch);
      ctx.strokeStyle = COLORS.borderHair;
      ctx.strokeRect(cx, cardTop, cw, ch);
      ctx.fillStyle = COLORS.skyFill;
      ctx.fillRect(cx, cardTop, cw * 0.35, 3);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${Math.max(10, Math.round(r.w * 0.016))}px ${SANS}`;
      ctx.fillText(st, cx + 10, cardTop + 14);
      ctx.fillStyle = "#CBC5B7";
      ctx.fillRect(cx + 10, cardTop + ch * 0.48, cw * 0.72, 3);
      ctx.fillRect(cx + 10, cardTop + ch * 0.62, cw * 0.56, 3);
      ctx.fillRect(cx + 10, cardTop + ch * 0.76, cw * 0.64, 3);
    });

    const tipW = Math.min(r.w * 0.5, 270);
    const tipH = Math.max(24, r.h * 0.085);
    ctx.fillStyle = "rgba(15, 76, 138, 0.9)";
    drawRoundedRect(ctx, r.x + (r.w - tipW) / 2, r.y + r.h - tipH - 10, tipW, tipH, 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 ${Math.max(10, Math.round(r.w * 0.0155))}px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("03 后续展开页（点击返回 02 空白页）", r.x + r.w / 2, r.y + r.h - tipH / 2 - 10);
    ctx.restore();
  }

  function drawRemovePill(rightX, midY, text, slideW, hot) {
    const fs = Math.max(9, Math.round(slideW * 0.013));
    ctx.font = `600 ${fs}px ${SANS}`;
    const tw = ctx.measureText(text).width + 14;
    const th = fs + 8;
    ctx.fillStyle = hot ? COLORS.failRed : "#16202C";
    drawRoundedRect(ctx, rightX - tw, midY - th / 2, tw, th, 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rightX - tw / 2, midY + 0.5);
  }

  function drawBreathingGauge(r, audit) {
    const { focalBox, copyBox } = audit.geom;
    const bCheck = audit.checks.breathing;
    const color = bCheck.ok ? COLORS.blueInk : COLORS.failRed;

    let x1, y1, x2, y2;
    if (copyBox.x1 <= focalBox.x0) {
      x1 = r.x + copyBox.x1 * r.w;
      x2 = r.x + focalBox.x0 * r.w;
      const midY = (Math.max(copyBox.y0, focalBox.y0) + Math.min(copyBox.y1, focalBox.y1)) * 0.5;
      y1 = y2 = r.y + (Number.isFinite(midY) && midY > 0.1 && midY < 0.9 ? midY : focalBox.cy) * r.h;
    } else if (focalBox.x1 <= copyBox.x0) {
      x1 = r.x + focalBox.x1 * r.w;
      x2 = r.x + copyBox.x0 * r.w;
      const midY = (Math.max(copyBox.y0, focalBox.y0) + Math.min(copyBox.y1, focalBox.y1)) * 0.5;
      y1 = y2 = r.y + (Number.isFinite(midY) && midY > 0.1 && midY < 0.9 ? midY : focalBox.cy) * r.h;
    } else if (focalBox.y1 <= copyBox.y0) {
      x1 = x2 = r.x + focalBox.cx * r.w;
      y1 = r.y + focalBox.y1 * r.h;
      y2 = r.y + copyBox.y0 * r.h;
    } else if (copyBox.y1 <= focalBox.y0) {
      x1 = x2 = r.x + focalBox.cx * r.w;
      y1 = r.y + copyBox.y1 * r.h;
      y2 = r.y + focalBox.y0 * r.h;
    } else {
      x1 = r.x + copyBox.cx * r.w;
      y1 = r.y + copyBox.cy * r.h;
      x2 = r.x + focalBox.cx * r.w;
      y2 = r.y + focalBox.cy * r.h;
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x1, y1, 2.5, 0, Math.PI * 2);
    ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const mx = (x1 + x2) / 2;
    const spanPx = Math.hypot(x2 - x1, y2 - y1);
    const narrowGap = spanPx < 68;
    const clearAboveCopy = r.y + copyBox.y0 * r.h - 14;
    const my = narrowGap
      ? Math.max(r.y + 34, Math.min((y1 + y2) / 2 - 28, clearAboveCopy))
      : (y1 + y2) / 2;
    const label = audit.gapInfo.overlapping ? "叠压" : `净距 ${(audit.gap * 100).toFixed(1)}%`;
    const fs = Math.max(9, Math.round(r.w * 0.0135));
    ctx.font = `500 ${fs}px ${MONO}`;
    const lw = ctx.measureText(label).width + 10;
    const lh = fs + 6;
    if (narrowGap) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((x1 + x2) / 2, (y1 + y2) / 2);
      ctx.lineTo(mx, my + lh / 2);
      ctx.stroke();
    }
    ctx.fillStyle = bCheck.ok ? "rgba(250, 247, 237, 0.94)" : "rgba(185, 43, 39, 0.92)";
    drawRoundedRect(ctx, mx - lw / 2, my - lh / 2, lw, lh, 2);
    ctx.fill();
    if (bCheck.ok) {
      ctx.strokeStyle = "rgba(22, 104, 184, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = bCheck.ok ? COLORS.blueInk : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, mx, my + 0.5);
    ctx.restore();
  }

  function drawCornerViewfinder(cx, cy) {
    const s = 9;
    const leg = 4.5;
    ctx.save();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s + leg); ctx.lineTo(cx - s, cy - s); ctx.lineTo(cx - s + leg, cy - s);
    ctx.moveTo(cx + s - leg, cy - s); ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx + s, cy - s + leg);
    ctx.moveTo(cx - s, cy + s - leg); ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx - s + leg, cy + s);
    ctx.moveTo(cx + s - leg, cy + s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx + s, cy + s - leg);
    ctx.stroke();
    ctx.strokeStyle = COLORS.blueInk;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
    ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
    ctx.stroke();
    ctx.restore();
  }

  function drawBeatBanner(r, text, bg) {
    const fs = Math.max(10, Math.round(r.w * 0.016));
    ctx.font = `600 ${fs}px ${SANS}`;
    const bw = Math.min(r.w - 20, ctx.measureText(text).width + 26);
    const bh = fs + 12;
    const bx = r.x + (r.w - bw) / 2;
    const by = r.y + 10;
    ctx.fillStyle = bg;
    drawRoundedRect(ctx, bx, by, bw, bh, 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
  }

  function drawGazeSimulation(r, audit, p) {
    const { focalBox, copyBox, clutterBoxes } = audit.geom;
    const fcx = r.x + focalBox.cx * r.w;
    const fcy = r.y + focalBox.cy * r.h;
    ctx.save();

    if (audit.passed === 4) {
      for (let k = 0; k < 2; k++) {
        const kp = clamp(p * 1.4 - k * 0.25, 0, 1);
        if (kp <= 0) continue;
        const rad = focalBox.rx * r.w * (0.4 + kp * 1.15);
        ctx.beginPath();
        ctx.arc(fcx, fcy, rad, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(22, 104, 184, ${(1 - kp) * 0.72})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      drawBeatBanner(r, "切页实测 · 视线 1 步落定单一焦点", COLORS.passTeal);
    } else if (clutterBoxes.badge || clutterBoxes.notes) {
      const rival = clutterBoxes.badge || clutterBoxes.notes;
      const rx = r.x + rival.cx * r.w;
      const ry = r.y + rival.cy * r.h;
      const bounce = 0.5 - 0.5 * Math.cos(p * Math.PI * 4);
      const gx = fcx + (rx - fcx) * bounce;
      const gy = fcy + (ry - fcy) * bounce;

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COLORS.failRed;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fcx, fcy);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(gx, gy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(185, 43, 39, 0.22)";
      ctx.fill();
      ctx.strokeStyle = COLORS.failRed;
      ctx.lineWidth = 2;
      ctx.stroke();

      drawBeatBanner(r, "切页实测 · 视线在多焦间往复弹跳", COLORS.failRed);
    } else {
      const cpx = r.x + copyBox.cx * r.w;
      const cpy = r.y + copyBox.cy * r.h;
      const prog = clamp(p * 1.5, 0, 1);
      const gx = fcx + (cpx - fcx) * prog;
      const gy = fcy + (cpy - fcy) * prog;
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.failRed;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      drawBeatBanner(r, `切页实测 · ${audit.diagnosis.shortTag.split(" · ")[1] || "空间失序"}`, COLORS.failRed);
    }
    ctx.restore();
  }

  function drawBlankSlide(r, audit, t, alpha = 1) {
    const scenario = SCENARIOS[state.scenario];
    const { safeRect, focalBox, copyBox, clutterBoxes } = audit.geom;
    const ease = 1 - Math.pow(1 - clamp(introProgress, 0, 1), 3);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    const sx0 = r.x + safeRect.x0 * r.w;
    const sy0 = r.y + safeRect.y0 * r.h;
    const sw = (safeRect.x1 - safeRect.x0) * r.w;
    const sh = (safeRect.y1 - safeRect.y0) * r.h;

    if (!audit.checks.margin.ok) {
      ctx.fillStyle = COLORS.failSoft;
      ctx.fillRect(r.x, r.y, r.w, sy0 - r.y);
      ctx.fillRect(r.x, sy0 + sh, r.w, r.y + r.h - (sy0 + sh));
      ctx.fillRect(r.x, sy0, sx0 - r.x, sh);
      ctx.fillRect(sx0 + sw, sy0, r.x + r.w - (sx0 + sw), sh);
    } else if (audit.passed === 4) {
      ctx.fillStyle = "rgba(255, 253, 247, 0.72)";
      ctx.fillRect(sx0, sy0, sw, sh);
    }

    ctx.save();
    ctx.setLineDash([5, 5]);
    const isMarginHot = hoverTarget?.kind === "margin" || drag?.kind === "margin" || drag?.kind === "space";
    ctx.strokeStyle = !audit.checks.margin.ok
      ? COLORS.failBorder
      : isMarginHot
      ? COLORS.blueInk
      : COLORS.dashedGuide;
    ctx.lineWidth = isMarginHot ? 1.6 : 1.1;
    if (ease < 0.99) {
      const perim = (sw + sh) * 2;
      ctx.setLineDash([perim * ease, perim]);
    }
    ctx.strokeRect(sx0, sy0, sw, sh);
    ctx.restore();

    if (state.showGuides) {
      ctx.fillStyle = !audit.checks.margin.ok ? COLORS.failRed : isMarginHot ? COLORS.blueInk : "#ACA596";
      const tick = 6;
      ctx.fillRect(sx0 - 1.5, sy0 + sh / 2 - tick, 3, tick * 2);
      ctx.fillRect(sx0 + sw - 1.5, sy0 + sh / 2 - tick, 3, tick * 2);
      ctx.fillRect(sx0 + sw / 2 - tick, sy0 - 1.5, tick * 2, 3);
      ctx.fillRect(sx0 + sw / 2 - tick, sy0 + sh - 1.5, tick * 2, 3);
    }

    // 杂物 1：装饰框与页脚
    if (state.clutter.frame) {
      const topB = clutterBoxes.frameTop;
      const botB = clutterBoxes.frameBottom;
      const tx = r.x + topB.x0 * r.w;
      const ty = r.y + topB.y0 * r.h;
      const tw = (topB.x1 - topB.x0) * r.w;
      const th = (topB.y1 - topB.y0) * r.h;
      const bx = r.x + botB.x0 * r.w;
      const by = r.y + botB.y0 * r.h;
      const bw = (botB.x1 - botB.x0) * r.w;
      const bh = (botB.y1 - botB.y0) * r.h;

      const hot = hoverTarget?.kind === "clutter" && hoverTarget.key === "frame";
      ctx.save();
      ctx.strokeStyle = hot ? COLORS.failRed : COLORS.clutterStroke;
      ctx.lineWidth = hot ? 2 : 1.5;
      ctx.strokeRect(tx, ty, tw, by + bh - ty);
      ctx.fillStyle = hot ? "#F6E4E2" : COLORS.clutterBg;
      ctx.fillRect(tx, ty, tw, th);
      ctx.fillStyle = "#5B584E";
      ctx.font = `600 ${Math.max(9, Math.round(r.w * 0.015))}px ${SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("2026 通用模板 · 固定品牌顶栏", tx + 10, ty + th * 0.5);
      drawRemovePill(tx + tw - 8, ty + th * 0.5, "× 移出装饰框", r.w, hot);

      ctx.fillStyle = hot ? "#F6E4E2" : COLORS.clutterBg;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#67645A";
      ctx.font = `400 ${Math.max(9, Math.round(r.w * 0.0135))}px ${SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("内部汇报 · 第 15 页 / 共 48 页", bx + 10, by + bh * 0.5);

      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = COLORS.failBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 1, ty + 1, tw - 2, th - 2);
      ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      ctx.restore();
    }

    // 341 原海报核心母题：天蓝焦点圆与石青灰细虚线坐标轴
    const fcx = r.x + focalBox.cx * r.w;
    const fcy = r.y + focalBox.cy * r.h;
    const fRad = focalBox.rx * r.w * (0.86 + 0.14 * ease);
    const axisLen = Math.max(fRad * 1.95, r.w * 0.14) * ease;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.dashedGuide;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fcx - axisLen, fcy);
    ctx.lineTo(fcx + axisLen, fcy);
    ctx.moveTo(fcx, fcy - axisLen * 0.92);
    ctx.lineTo(fcx, fcy + axisLen * 0.92);
    ctx.stroke();
    ctx.restore();

    if (audit.passed === 4) {
      const breathe = reducedMotion.matches ? 1 : 1 + Math.sin(t * 1.8) * 0.025;
      ctx.beginPath();
      ctx.arc(fcx, fcy, fRad * 1.18 * breathe, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(160, 205, 249, 0.16)";
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(fcx, fcy, fRad, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.skyFill;
    ctx.fill();

    if (hoverTarget?.kind === "focal" || drag?.kind === "focal") {
      ctx.strokeStyle = COLORS.blueInk;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else if (audit.checks.focus.code === "bloated" || audit.checks.focus.code === "weak") {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = COLORS.failRed;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (state.scenario === "poster") {
      ctx.beginPath();
      ctx.arc(fcx, fcy, Math.max(2.6, fRad * 0.055), 0, Math.PI * 2);
      ctx.fillStyle = COLORS.ink;
      ctx.fill();
    } else if (state.scenario === "data") {
      ctx.fillStyle = COLORS.ink;
      ctx.font = `400 ${Math.max(16, Math.round(fRad * 0.88))}px ${LATIN}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(scenario.focalTitle, fcx, fcy - fRad * 0.04);
      ctx.fillStyle = COLORS.blueDeep;
      ctx.font = `500 ${Math.max(8, Math.round(fRad * 0.19))}px ${MONO}`;
      ctx.fillText(scenario.focalSub, fcx, fcy + fRad * 0.42);
    } else {
      const pw = fRad * 0.72;
      const ph = fRad * 1.18;
      ctx.fillStyle = "#141920";
      drawRoundedRect(ctx, fcx - pw / 2, fcy - ph / 2, pw, ph, Math.max(4, pw * 0.16));
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(fcx - pw * 0.34, fcy - ph * 0.42, 1.5, ph * 0.84);
      ctx.beginPath();
      ctx.arc(fcx, fcy - ph * 0.24, Math.max(2.2, pw * 0.09), 0, Math.PI * 2);
      ctx.fillStyle = COLORS.skyFill;
      ctx.fill();
      ctx.fillStyle = "#F4F6F9";
      ctx.font = `500 ${Math.max(8, Math.round(fRad * 0.2))}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(scenario.focalTitle, fcx, fcy + ph * 0.22);
    }
    ctx.restore();

    // 说明文案块
    const cx0 = r.x + copyBox.x0 * r.w;
    const cy0 = r.y + copyBox.y0 * r.h;
    const cw = copyBox.w * r.w;
    const ch = copyBox.h * r.h;
    const isCopyHot = hoverTarget?.kind === "copy" || drag?.kind === "copy";

    ctx.save();
    if (isCopyHot || audit.checks.breathing.code === "overlap") {
      ctx.fillStyle = audit.checks.breathing.code === "overlap" ? COLORS.failSoft : "rgba(22, 104, 184, 0.06)";
      ctx.fillRect(cx0 - 6, cy0 - 6, cw + 12, ch + 12);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = audit.checks.breathing.code === "overlap" ? COLORS.failRed : COLORS.blueInk;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx0 - 6, cy0 - 6, cw + 12, ch + 12);
      ctx.setLineDash([]);
    }

    const centered = copyBox.align === "center";
    const textX = centered ? cx0 + cw / 2 : cx0;
    ctx.textAlign = centered ? "center" : "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = COLORS.blueInk;
    ctx.font = `500 ${Math.max(9, Math.round(r.w * 0.0135))}px ${MONO}`;
    ctx.fillText(scenario.eyebrow, textX, cy0);

    const dashW = Math.max(18, r.w * 0.042);
    ctx.fillStyle = COLORS.skyFill;
    ctx.fillRect(centered ? textX - dashW / 2 : textX, cy0 + Math.max(13, r.h * 0.042), dashW, 2.5);

    const hSize = Math.max(11, Math.round(r.w * (r.w < 460 ? 0.032 : 0.029)));
    ctx.fillStyle = COLORS.ink;
    ctx.font = `800 ${hSize}px ${SANS}`;
    const hLines = wrapLines(ctx, scenario.headline, cw, 2);
    const hTop = cy0 + Math.max(16, r.h * 0.064);
    hLines.forEach((ln, li) => {
      ctx.fillText(ln, textX, hTop + li * (hSize * 1.24));
    });

    const subSize = Math.max(9, Math.round(r.w * (r.w < 460 ? 0.0185 : 0.016)));
    ctx.fillStyle = COLORS.mutedInk;
    ctx.font = `400 ${subSize}px ${SANS}`;
    const subTop = hTop + hLines.length * (hSize * 1.24) + 4;
    const sLines = wrapLines(ctx, scenario.subline, cw, 2);
    sLines.forEach((ln, li) => {
      ctx.fillText(ln, textX, subTop + li * (subSize * 1.36));
    });
    ctx.restore();

    // 杂物 2：抢戏副徽章
    if (state.clutter.badge && clutterBoxes.badge) {
      const b = clutterBoxes.badge;
      const bx = r.x + b.x0 * r.w;
      const by = r.y + b.y0 * r.h;
      const bw = (b.x1 - b.x0) * r.w;
      const bh = (b.y1 - b.y0) * r.h;
      const hot = hoverTarget?.kind === "clutter" && hoverTarget.key === "badge";
      ctx.save();
      ctx.fillStyle = hot ? COLORS.failRed : COLORS.badgeBg;
      drawRoundedRect(ctx, bx, by, bw, bh, 3);
      ctx.fill();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = COLORS.failRed;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
      ctx.setLineDash([]);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${Math.max(10, Math.round(r.w * 0.016))}px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(scenario.clutterLabels.badge.split(" · ")[0], bx + bw / 2, by + bh * 0.36);
      ctx.fillStyle = "#E6F1FC";
      ctx.font = `500 ${Math.max(9, Math.round(r.w * 0.0125))}px ${SANS}`;
      ctx.fillText("× 点此移出抢戏块", bx + bw / 2, by + bh * 0.7);
      ctx.restore();
    }

    // 杂物 3：边角补充备注
    if (state.clutter.notes && clutterBoxes.notes) {
      const n = clutterBoxes.notes;
      const nx = r.x + n.x0 * r.w;
      const ny = r.y + n.y0 * r.h;
      const nw = (n.x1 - n.x0) * r.w;
      const nh = (n.y1 - n.y0) * r.h;
      const hot = hoverTarget?.kind === "clutter" && hoverTarget.key === "notes";
      ctx.save();
      ctx.fillStyle = hot ? "#F6E4E2" : "#ECE8DC";
      ctx.fillRect(nx, ny, nw, nh);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = COLORS.failBorder;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(nx, ny, nw, nh);
      ctx.setLineDash([]);

      ctx.fillStyle = "#3E3D37";
      ctx.font = `600 ${Math.max(9, Math.round(r.w * 0.014))}px ${SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("• 补充备注：3 条口述即可带过的细节", nx + 9, ny + nh * 0.16);
      ctx.fillStyle = COLORS.failRed;
      ctx.font = `600 ${Math.max(9, Math.round(r.w * 0.013))}px ${SANS}`;
      ctx.fillText("× 点此移出边角备注", nx + 9, ny + nh * 0.58);
      ctx.restore();
    }

    if (state.showGuides) {
      drawBreathingGauge(r, audit);
      drawCornerViewfinder(sx0 + sw - 16, sy0 + sh - 16);
    }

    if (beatActive && beatTime >= BEAT_CUT_END) {
      const p = clamp((beatTime - BEAT_CUT_END) / (BEAT_TOTAL - BEAT_CUT_END), 0, 1);
      drawGazeSimulation(r, audit, p);
    }

    ctx.strokeStyle = COLORS.borderHair;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.restore();
  }

  function drawMobileDock(audit) {
    if (!compactMode || !mobileRulerRect) return;
    const r = mobileRulerRect;
    ctx.save();

    ctx.fillStyle = "#F4F0E4";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COLORS.borderHair;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    ctx.fillStyle = COLORS.mutedInk;
    ctx.font = `500 11px ${SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("← 横拖调安全边距与留白 →", r.x + 10, r.y + 6);

    ctx.fillStyle = audit.checks.margin.ok ? COLORS.passTeal : COLORS.failRed;
    ctx.font = `500 11px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(`边距 ${(state.margin * 100).toFixed(1)}% · 留白 ${Math.round(audit.whitespace * 100)}%`, r.x + r.w - 10, r.y + 6);

    const trX = r.x + 12;
    const trW = r.w - 24;
    const trY = r.y + 32;
    ctx.fillStyle = "#DDD7C7";
    ctx.fillRect(trX, trY - 2, trW, 4);
    const okStart = ((0.08 - 0.02) / (0.26 - 0.02)) * trW;
    const okEnd = ((0.22 - 0.02) / (0.26 - 0.02)) * trW;
    ctx.fillStyle = COLORS.skyFill;
    ctx.fillRect(trX + okStart, trY - 2.5, okEnd - okStart, 5);
    const thumbX = trX + clamp((state.margin - 0.02) / (0.26 - 0.02), 0, 1) * trW;
    ctx.beginPath();
    ctx.arc(thumbX, trY, 7, 0, Math.PI * 2);
    ctx.fillStyle = audit.checks.margin.ok ? COLORS.blueInk : COLORS.failRed;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    const labels = { frame: "装饰外框", badge: "抢戏徽章", notes: "边角备注" };
    for (const chip of mobileChipRects) {
      const on = state.clutter[chip.key];
      ctx.fillStyle = on ? "#FCECEB" : "#EEF6F3";
      ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
      ctx.setLineDash(on ? [3, 3] : []);
      ctx.strokeStyle = on ? COLORS.failBorder : "rgba(21,111,82,0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(chip.x + 0.5, chip.y + 0.5, chip.w - 1, chip.h - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = on ? COLORS.failRed : COLORS.passTeal;
      ctx.font = `600 11px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(on ? `× ${labels[chip.key]}` : `✓ 已清${labels[chip.key].slice(0, 2)}`, chip.x + chip.w / 2, chip.y + chip.h / 2 + 0.5);
    }

    const tabNames = ["01 密集前页", "02 当前空白页", "03 后续展开"];
    for (const tab of mobileSlideTabRects) {
      const active = state.activeSlide === tab.idx;
      ctx.fillStyle = active ? COLORS.ink : "#F4F0E4";
      ctx.fillRect(tab.x, tab.y, tab.w, tab.h);
      ctx.strokeStyle = active ? COLORS.ink : COLORS.borderHair;
      ctx.strokeRect(tab.x + 0.5, tab.y + 0.5, tab.w - 1, tab.h - 1);
      ctx.fillStyle = active ? "#FAF7ED" : COLORS.bodyInk;
      ctx.font = `600 11px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tabNames[tab.idx], tab.x + tab.w / 2, tab.y + tab.h / 2 + 0.5);
    }

    ctx.restore();
  }

  function renderFrame(t, dt, { still }) {
    computeLayout();
    if (still) {
      introProgress = 1;
      beatActive = false;
    } else if (introProgress < 1) {
      introProgress = clamp(introProgress + (dt || 0.016) * 1.4, 0, 1);
      dirty = true;
    }

    if (beatActive) {
      beatTime += dt || 0.016;
      dirty = true;
      if (beatTime >= BEAT_TOTAL) {
        beatActive = false;
        beatTime = 0;
        state.activeSlide = 1;
        onChange?.();
      }
    }

    const audit = evaluate(state);
    if (!dirty && !still && !(audit.passed === 4 && !reducedMotion.matches)) {
      return;
    }
    dirty = false;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, width, height);

    const scenario = SCENARIOS[state.scenario];

    if (beatActive) {
      if (beatTime < BEAT_PREV_END) {
        drawDensePrevSlide(slideRect, scenario, 1);
      } else if (beatTime < BEAT_CUT_END) {
        const k = (beatTime - BEAT_PREV_END) / (BEAT_CUT_END - BEAT_PREV_END);
        drawDensePrevSlide(slideRect, scenario, 1 - k);
        drawBlankSlide(slideRect, audit, t, k);
      } else {
        drawBlankSlide(slideRect, audit, t, 1);
      }
    } else if (state.activeSlide === 0) {
      drawDensePrevSlide(slideRect, scenario, 1);
    } else if (state.activeSlide === 2) {
      drawNextFollowupSlide(slideRect, scenario);
    } else {
      drawBlankSlide(slideRect, audit, t, 1);
    }

    drawMobileDock(audit);
    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  function pointerPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function applyRulerX(px) {
    const r = mobileRulerRect || slideRect;
    const ratio = clamp((px - (r.x + 12)) / Math.max(40, r.w - 24), 0, 1);
    state.margin = +(0.02 + ratio * 0.24).toFixed(3);
  }

  function handleDown(ev) {
    const pt = pointerPos(ev);
    const audit = evaluate(state);
    const hit = hitTest(pt.x, pt.y, audit);

    if (hit.kind === "slideTab") {
      beatActive = false;
      state.activeSlide = hit.idx;
      dirty = true;
      onChange?.();
      ctrl.draw();
      return;
    }
    if (hit.kind === "clutterChip") {
      state.clutter[hit.key] = !state.clutter[hit.key];
      state.activeSlide = 1;
      dirty = true;
      onChange?.();
      ctrl.draw();
      return;
    }
    if (hit.kind === "slideBg") {
      beatActive = false;
      state.activeSlide = 1;
      dirty = true;
      onChange?.();
      ctrl.draw();
      return;
    }
    const isClutterHit = hit.kind === "clutter";
    const { u, v } = toSlideUV(pt.x, pt.y);
    drag = {
      id: ev.pointerId,
      kind: isClutterHit ? "space" : hit.kind,
      pendingClutter: isClutterHit ? hit.key : null,
      startX: pt.x,
      startY: pt.y,
      startU: u,
      startV: v,
      startMargin: state.margin,
      startFocal: { ...state.focal },
      startCopy: { ...state.copy },
      locked: !isClutterHit && (hit.kind !== "space" || ev.pointerType === "mouse"),
      touch: ev.pointerType === "touch",
    };

    if (hit.kind === "ruler") {
      applyRulerX(pt.x);
      dirty = true;
      onChange?.();
      ctrl.draw();
    }

    if (drag.locked && ev.pointerId != null) {
      try { canvas.setPointerCapture(ev.pointerId); } catch {}
    }
  }

  function handleMove(ev) {
    const pt = pointerPos(ev);
    if (!drag) {
      if (ev.pointerType !== "touch") {
        const audit = evaluate(state);
        hoverTarget = hitTest(pt.x, pt.y, audit);
        canvas.style.cursor =
          hoverTarget.kind === "clutter" || hoverTarget.kind === "clutterChip" || hoverTarget.kind === "slideTab"
            ? "pointer"
            : hoverTarget.kind === "focal" || hoverTarget.kind === "copy"
            ? "grab"
            : hoverTarget.kind === "margin" || hoverTarget.kind === "ruler" || hoverTarget.kind === "space"
            ? "ew-resize"
            : "default";
        dirty = true;
        ctrl.draw();
      }
      return;
    }

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;

    if (!drag.locked) {
      if (Math.hypot(dx, dy) < 5) return;
      if (drag.touch && Math.abs(dy) > Math.abs(dx) * 1.25) {
        drag = null;
        return;
      }
      drag.pendingClutter = null;
      drag.locked = true;
      if (ev.pointerId != null) {
        try { canvas.setPointerCapture(ev.pointerId); } catch {}
      }
    }

    if (ev.cancelable) ev.preventDefault();
    state.activeSlide = 1;
    beatActive = false;

    const { u, v } = toSlideUV(pt.x, pt.y);
    const du = u - drag.startU;
    const dv = v - drag.startV;

    if (drag.kind === "ruler") {
      applyRulerX(pt.x);
    } else if (drag.kind === "focal") {
      let nx = clamp(drag.startFocal.x + du, 0.08, 0.92);
      let ny = clamp(drag.startFocal.y + dv, 0.14, 0.86);
      nx = snapValue(nx, [0.30, 0.50, 0.69], 0.016);
      ny = snapValue(ny, [0.38, 0.50, 0.54], 0.02);
      state.focal.x = +nx.toFixed(3);
      state.focal.y = +ny.toFixed(3);
    } else if (drag.kind === "copy") {
      let nx = clamp(drag.startCopy.x + du, 0.02, 0.86);
      let ny = clamp(drag.startCopy.y + dv, 0.04, 0.78);
      if (Math.abs(nx - 0.5) < 0.035 && Math.abs(state.focal.x - 0.5) < 0.07) {
        state.copy.align = "center";
        nx = 0.5;
      } else {
        state.copy.align = "left";
      }
      state.copy.x = +nx.toFixed(3);
      state.copy.y = +ny.toFixed(3);
    } else if (drag.kind === "margin") {
      const edgeDist = Math.min(u, 1 - u, v / 1.12, (1 - v) / 1.12);
      state.margin = +clamp(edgeDist, 0.02, 0.26).toFixed(3);
    } else {
      const deltaM = (dx / Math.max(200, slideRect.w)) * 0.28;
      state.margin = +clamp(drag.startMargin + deltaM, 0.02, 0.26).toFixed(3);
      const nextSize = clamp(drag.startFocal.size - deltaM * 0.45, 0.06, 0.32);
      state.focal.size = +nextSize.toFixed(3);
    }

    dirty = true;
    onChange?.();
    ctrl.draw();
  }

  function handleUp(ev) {
    const clickedClutter = drag?.pendingClutter || null;
    if (drag && ev.pointerId != null) {
      try { canvas.releasePointerCapture(ev.pointerId); } catch {}
    }
    drag = null;
    if (clickedClutter) {
      state.clutter[clickedClutter] = false;
      dirty = true;
      onChange?.();
      ctrl.draw();
    }
  }

  canvas.addEventListener("pointerdown", handleDown);
  canvas.addEventListener("pointermove", handleMove);
  canvas.addEventListener("pointerup", handleUp);
  canvas.addEventListener("pointercancel", handleUp);
  canvas.addEventListener("pointerleave", () => {
    if (!drag) {
      hoverTarget = null;
      dirty = true;
      ctrl.draw();
    }
  });

  canvas.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      state.margin = +clamp(state.margin + 0.01, 0.02, 0.26).toFixed(3);
      dirty = true;
      onChange?.();
      ctrl.draw();
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      state.margin = +clamp(state.margin - 0.01, 0.02, 0.26).toFixed(3);
      dirty = true;
      onChange?.();
      ctrl.draw();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      state.focal.size = +clamp(state.focal.size + 0.01, 0.06, 0.32).toFixed(3);
      dirty = true;
      onChange?.();
      ctrl.draw();
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      state.focal.size = +clamp(state.focal.size - 0.01, 0.06, 0.32).toFixed(3);
      dirty = true;
      onChange?.();
      ctrl.draw();
    } else if (ev.key === " ") {
      ev.preventDefault();
      playTransitionBeat();
    }
  });

  const ro = new ResizeObserver(() => {
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  function playTransitionBeat() {
    if (reducedMotion.matches) {
      state.activeSlide = 1;
      beatActive = false;
      dirty = true;
      onChange?.();
      ctrl.draw();
      return;
    }
    state.activeSlide = 1;
    beatActive = true;
    beatTime = 0;
    dirty = true;
    onChange?.();
    ctrl.draw();
  }

  function redraw() {
    dirty = true;
    ctrl.draw();
  }

  computeLayout();
  ctrl.draw();

  return { redraw, playTransitionBeat };
}
