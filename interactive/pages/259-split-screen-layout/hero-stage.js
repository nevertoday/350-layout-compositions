// 259 开场主角玩具：双极分屏中缝调度台（2D Canvas, data-perf-drag）
// 1:1 承袭 259 原海报纯黑 / 炭灰 / 混凝土浅灰 / 酸青绿极性美学与三大原海报标本。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { auditState, clampSplit, snapSplit, SPECIMENS, TONE_ORDER } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapText(ctx, text, maxW) {
  if (maxW <= 18) return [text.slice(0, 2) + "…"];
  const lines = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawBadgeIcon(ctx, type, cx, cy, r, bg, fg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = fg;
  ctx.lineWidth = Math.max(1.8, r * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (type === "check") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.38, cy + r * 0.02);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.32);
    ctx.lineTo(cx + r * 0.42, cy - r * 0.28);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.32, cy - r * 0.32);
    ctx.lineTo(cx + r * 0.32, cy + r * 0.32);
    ctx.moveTo(cx + r * 0.32, cy - r * 0.32);
    ctx.lineTo(cx - r * 0.32, cy + r * 0.32);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRowIcon(ctx, kind, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const r = s * 0.46;
  if (kind === "rocket") {
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.7, cy - r * 0.7);
    ctx.quadraticCurveTo(cx + r * 0.05, cy - r * 0.65, cx - r * 0.55, cy + r * 0.1);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.55);
    ctx.quadraticCurveTo(cx + r * 0.65, cy - r * 0.05, cx + r * 0.7, cy - r * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.65, cy + r * 0.65);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.28);
    ctx.stroke();
  } else if (kind === "target") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "team") {
    // 无五官剪影肩头双人图符
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.34, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.36, cy - r * 0.24, r * 0.21, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy + r * 0.62, r * 0.52, Math.PI * 1.12, Math.PI * 1.88);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.36, cy + r * 0.62, r * 0.4, Math.PI * 1.12, Math.PI * 1.88);
    ctx.fill();
  } else if (kind === "clock") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.46);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + r * 0.36, cy + r * 0.2);
    ctx.stroke();
  } else if (kind === "warn") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.8);
    ctx.lineTo(cx + r * 0.85, cy + r * 0.72);
    ctx.lineTo(cx - r * 0.85, cy + r * 0.72);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.22);
    ctx.lineTo(cx, cy + r * 0.22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.48, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "shuffle") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.75, cy - r * 0.38);
    ctx.lineTo(cx - r * 0.1, cy - r * 0.38);
    ctx.lineTo(cx + r * 0.25, cy + r * 0.38);
    ctx.lineTo(cx + r * 0.75, cy + r * 0.38);
    ctx.moveTo(cx - r * 0.75, cy + r * 0.38);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.38);
    ctx.lineTo(cx + r * 0.25, cy - r * 0.38);
    ctx.lineTo(cx + r * 0.75, cy - r * 0.38);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNatureIllustration(ctx, x, y, w, h, mainColor, subColor, bgColor) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // 日轮（原海报左下示例）
  const sunR = Math.min(w * 0.13, h * 0.24, 24);
  if (sunR > 5) {
    ctx.beginPath();
    ctx.arc(x + w * 0.26, y + h * 0.36, sunR, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.fill();
  }

  // 远山与缓坡
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.68);
  ctx.quadraticCurveTo(x + w * 0.28, y + h * 0.46, x + w * 0.56, y + h * 0.78);
  ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.94, x + w, y + h * 0.72);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = mainColor;
  ctx.fill();

  // 有机小树（随宽度自适应）
  if (w > 86) {
    const tx = x + w * 0.72;
    const baseY = y + h * 0.88;
    const tr = Math.min(w * 0.12, h * 0.26, 22);
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(tx, baseY - tr * 1.45, tr * 0.78, 0, Math.PI * 2);
    ctx.arc(tx - tr * 0.55, baseY - tr * 1.02, tr * 0.6, 0, Math.PI * 2);
    ctx.arc(tx + tr * 0.55, baseY - tr * 1.05, tr * 0.56, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = bgColor;
    ctx.lineWidth = Math.max(2, tr * 0.14);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, baseY + 4);
    ctx.lineTo(tx, baseY - tr * 1.4);
    ctx.moveTo(tx, baseY - tr * 0.9);
    ctx.lineTo(tx - tr * 0.38, baseY - tr * 1.24);
    ctx.moveTo(tx, baseY - tr * 1.05);
    ctx.lineTo(tx + tr * 0.34, baseY - tr * 1.32);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDesignIllustration(ctx, x, y, w, h, mainColor, subColor, bgColor) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // 现代主义几何建筑体块（1:1 承袭 259 原海报右下示例）
  const base = y + h;
  const u = Math.min(w / 5.2, h / 2.3);
  if (u > 8) {
    // 远景浅体块
    ctx.fillStyle = subColor;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, base);
    ctx.lineTo(x + w * 0.52, base - u * 1.85);
    ctx.lineTo(x + w * 0.78, base - u * 2.15);
    ctx.lineTo(x + w * 0.78, base);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.35;
    ctx.fillRect(x + w * 0.78, base - u * 1.28, w * 0.18, u * 1.28);

    // 前景厚实体块
    ctx.globalAlpha = 1;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.16, base);
    ctx.lineTo(x + w * 0.16, base - u * 1.15);
    ctx.lineTo(x + w * 0.44, base - u * 1.55);
    ctx.lineTo(x + w * 0.44, base);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = subColor;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.44, base);
    ctx.lineTo(x + w * 0.44, base - u * 1.55);
    ctx.lineTo(x + w * 0.64, base - u * 1.25);
    ctx.lineTo(x + w * 0.64, base);
    ctx.closePath();
    ctx.fill();

    // 圆形与矩形建筑开窗
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x + w * 0.3, base - u * 0.68, Math.max(4, u * 0.24), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w * 0.51, base - u * 0.85, Math.max(4, u * 0.16), Math.max(6, u * 0.34));
  }

  // 底线底座
  ctx.fillStyle = mainColor;
  ctx.fillRect(x, base - 5, w, 5);
  ctx.restore();
}

export function createHeroStage(canvas, getState, onPatch) {
  const ctx = canvas.getContext("2d");
  const hits = {
    frame: { x: 0, y: 0, w: 0, h: 0 },
    seamX: 0,
    bridge: { x: 0, y: 0, r: 22 },
    leftTonePill: { x: 0, y: 0, w: 0, h: 0 },
    rightTonePill: { x: 0, y: 0, w: 0, h: 0 },
  };

  let width = 640;
  let height = 390;
  let dpr = 1;
  let introT = 0;
  let pulseActive = false;
  let pulseT = 0;
  let dirty = true;
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartSplit = 0.5;
  let activePointerId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const maxDpr = window.innerWidth < 640 ? 1.5 : 2;
    dpr = pixelRatio(maxDpr);
    width = rect.width;
    height = rect.height;
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    dirty = true;
  }

  function drawTopChrome(frame, audit, state) {
    const topH = 26;
    ctx.fillStyle = "#161715";
    ctx.fillRect(frame.x, frame.y, frame.w, topH);
    ctx.strokeStyle = "#2E302B";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(frame.x, frame.y + topH + 0.5);
    ctx.lineTo(frame.x + frame.w, frame.y + topH + 0.5);
    ctx.stroke();

    // 窗口三圆点
    const dotColors = ["#BEEB4B", "#6D7068", "#484A44"];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(frame.x + 14 + i * 11, frame.y + topH / 2, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = dotColors[i];
      ctx.fill();
    }

    ctx.font = `500 11px "DM Mono", "Noto Sans SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#C6C9C0";
    const narrowChrome = frame.w < 430;
    const meta = audit.stacked
      ? (narrowChrome ? `390px · STACK` : `390px · STACK 50/50 · ${audit.ratio.toFixed(1)}:1`)
      : (narrowChrome ? `${audit.simW}px · ${audit.splitPctL}:${audit.splitPctR}` : `${audit.simW}px · ${audit.splitPctL}:${audit.splitPctR} · 反差 ${audit.ratio.toFixed(1)}:1`);
    ctx.fillText(meta, frame.x + 50, frame.y + topH / 2);

    ctx.textAlign = "right";
    ctx.fillStyle = audit.score === 4 ? "#BEEB4B" : "#FF877E";
    ctx.fillText(audit.badge, frame.x + frame.w - 10, frame.y + topH / 2);
    return topH;
  }

  function drawTonePill(x, y, text, isRight, pane) {
    ctx.save();
    ctx.font = `500 11px "Noto Sans SC", sans-serif`;
    const padX = 8;
    const h = 21;
    const tw = ctx.measureText(text).width;
    const w = Math.min(tw + padX * 2, 118);
    const px = isRight ? x - w : x;
    ctx.fillStyle = pane.bg === "#0F0F0F" || pane.bg === "#444542" || pane.bg === "#4F504C"
      ? "rgba(255,255,255,0.11)"
      : "rgba(15,15,15,0.11)";
    roundRectPath(ctx, px, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = pane.rule;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = pane.fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, px + w / 2, y + h / 2 + 0.5, w - 8);
    ctx.restore();
    return { x: px, y, w, h };
  }

  function drawVsPane(paneRect, data, palette, state, audit, isRight) {
    const { x, y, w, h } = paneRect;
    const padX = Math.max(10, Math.min(22, w * 0.085));
    const innerW = Math.max(24, w - padX * 2);
    const short = h < 255;
    const compact = w < 145 || short;
    const rowShift = isRight && !audit.stacked ? (short ? 16 : audit.rowDeltaPx) : 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // 顶部角标（点换底色）
    const pillY = y + (short ? 6 : 9);
    const pillLabel = compact ? palette.label : `底色 · ${palette.label}`;
    const pillBox = drawTonePill(isRight ? x + w - 8 : x + 8, pillY, pillLabel, isRight, palette);
    if (isRight) hits.rightTonePill = pillBox;
    else hits.leftTonePill = pillBox;

    // 圆形对错标 + 大标题
    const headTop = y + (short ? 31 : compact ? 36 : 40);
    const badgeR = short ? 8.5 : compact ? 10 : 12;
    drawBadgeIcon(ctx, data.badge, x + padX + badgeR, headTop + badgeR, badgeR, palette.badgeBg, palette.badgeFg);

    const titleSize = short ? 16 : compact ? 17 : Math.min(24, Math.max(18, w * 0.092));
    ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = palette.fg;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const titleY = short ? headTop : headTop + badgeR * 2 + (compact ? 5 : 7);
    const titleX = short ? x + padX + badgeR * 2 + 8 : x + padX;
    ctx.fillText(data.title, titleX, titleY, Math.max(20, x + w - padX - titleX));

    ctx.font = `600 ${short ? 9.5 : 10.5}px "Bricolage Grotesque", sans-serif`;
    ctx.fillStyle = palette.id === "obsidian" || palette.id === "slate" ? palette.accent : palette.sub;
    const enY = titleY + titleSize + (short ? 2 : 3);
    ctx.fillText(data.en, titleX, enY, Math.max(20, x + w - padX - titleX));

    // 水平细线
    const ruleY = enY + (short ? 13 : 16);
    ctx.strokeStyle = palette.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + padX, ruleY);
    ctx.lineTo(x + w - padX, ruleY);
    ctx.stroke();

    // 列表行（底部预留 30px 给画布级错态警示签，零重叠！）
    const items = state.density === "packed" ? [...data.items, ...data.extraItems] : data.items;
    const bottomSafe = state.showGuides && audit.score < 4 ? 32 : 12;
    const listStartY = ruleY + (short ? 7 : 10) + rowShift;
    const availH = Math.max(48, y + h - listStartY - bottomSafe);
    const rowH = Math.min(state.density === "packed" ? (short ? 20 : 25) : (short ? 32 : 42), availH / items.length);
    const rowCenters = [];

    items.forEach((item, idx) => {
      const ry = listStartY + idx * rowH;
      const cy = ry + rowH * 0.5;
      rowCenters.push(cy);
      const iconS = state.density === "packed" ? (short ? 11 : 12.5) : compact ? 13.5 : 17;
      drawRowIcon(ctx, item.icon, x + padX + iconS * 0.55, cy, iconS, palette.accent);

      ctx.font = `500 ${state.density === "packed" ? (short ? 10.5 : 11.5) : compact ? 12 : 13.5}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = palette.fg;
      ctx.textBaseline = "middle";
      const textX = x + padX + iconS + 8;
      ctx.fillText(item.text, textX, cy, Math.max(18, x + w - padX - textX));

      if (idx < items.length - 1) {
        ctx.strokeStyle = palette.rule;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + padX, ry + rowH - 0.5);
        ctx.lineTo(x + w - padX, ry + rowH - 0.5);
        ctx.stroke();
      }
    });

    ctx.restore();
    return rowCenters;
  }

  function drawAndPane(paneRect, data, palette, state, audit, isRight) {
    const { x, y, w, h } = paneRect;
    const padX = Math.max(10, Math.min(22, w * 0.085));
    const innerW = Math.max(24, w - padX * 2);
    const compact = w < 145 || h < 190;
    const rowShift = isRight && !audit.stacked ? audit.rowDeltaPx : 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const pillLabel = compact ? palette.label : `底色 · ${palette.label}`;
    const pillBox = drawTonePill(isRight ? x + w - 9 : x + 9, y + 9, pillLabel, isRight, palette);
    if (isRight) hits.rightTonePill = pillBox;
    else hits.leftTonePill = pillBox;

    const titleSize = compact ? 18 : Math.min(26, Math.max(19, w * 0.098));
    const titleY = y + (compact ? 38 : 42) + rowShift * 0.6;
    ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = palette.id === "obsidian" || palette.id === "slate" ? palette.accent : palette.fg;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(data.title, x + padX, titleY, innerW);

    ctx.font = `600 ${compact ? 10 : 11}px "Bricolage Grotesque", sans-serif`;
    ctx.fillStyle = palette.id === "obsidian" || palette.id === "slate" ? palette.accent : palette.sub;
    const enY = titleY + titleSize + 4;
    ctx.fillText(data.en, x + padX, enY, innerW);

    const ruleY = enY + 17;
    ctx.strokeStyle = palette.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + padX, ruleY);
    ctx.lineTo(x + padX + Math.min(innerW * 0.45, 58), ruleY);
    ctx.stroke();

    // 正文（自动按实绘宽度折行）
    const copy = state.density === "packed" ? data.copy + data.extraCopy : data.copy;
    const fontSize = state.density === "packed" ? 11.5 : compact ? 11.5 : 13;
    ctx.font = `400 ${fontSize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = palette.fg;
    const lines = wrapText(ctx, copy, innerW);
    const lineH = fontSize * 1.5;
    const textTop = ruleY + 11;
    const maxLines = state.density === "packed" ? 7 : 4;
    lines.slice(0, maxLines).forEach((ln, i) => {
      ctx.fillText(ln, x + padX, textTop + i * lineH, innerW);
    });

    // 底部插画（1:1 复刻原海报自然山树 / 现代建筑）
    const illusTop = Math.min(y + h - 54, textTop + Math.min(lines.length, maxLines) * lineH + 8);
    const illusH = Math.max(44, y + h - illusTop);
    if (data.motif === "nature") {
      drawNatureIllustration(ctx, x, illusTop, w, illusH, palette.motifMain, palette.motifSub, palette.bg);
    } else {
      drawDesignIllustration(ctx, x, illusTop, w, illusH, palette.motifMain, palette.motifSub, palette.bg);
    }

    ctx.restore();
    return [titleY + titleSize * 0.5, textTop + lineH * 0.9, illusTop + illusH * 0.5];
  }

  function drawPolarityPane(paneRect, data, palette, state, audit, isRight) {
    const { x, y, w, h } = paneRect;
    const padX = Math.max(10, Math.min(20, w * 0.08));
    const compact = w < 145 || h < 185;
    const rowShift = isRight && !audit.stacked ? audit.rowDeltaPx : 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const pillLabel = compact ? palette.label : `底色 · ${palette.label}`;
    const pillBox = drawTonePill(isRight ? x + w - 9 : x + 9, y + 9, pillLabel, isRight, palette);
    if (isRight) hits.rightTonePill = pillBox;
    else hits.leftTonePill = pillBox;

    // 1:1 复刻原海报左中极性圆图（纯黑框内绿圆 ↔ 酸绿框内黑圆）
    const cx = x + w * 0.5;
    const cy = y + h * 0.5 + rowShift * 0.5;
    const orbR = Math.max(14, Math.min(w * 0.22, h * 0.22, 42));
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.fillStyle = palette.motifMain;
    ctx.fill();

    // 若过载，塞满冗余标签破坏纯极性构成
    if (state.density === "packed") {
      ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
      data.extraTags.forEach((tag, idx) => {
        const ty = y + 42 + idx * Math.max(22, (h - 70) / 4);
        ctx.fillStyle = palette.cardBg;
        ctx.strokeStyle = palette.rule;
        ctx.lineWidth = 1;
        roundRectPath(ctx, x + padX, ty, Math.max(30, w - padX * 2), 19, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = palette.fg;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, x + padX + 6, ty + 9.5, Math.max(20, w - padX * 2 - 10));
      });
    } else {
      ctx.font = `700 ${compact ? 11.5 : 13}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = palette.fg;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(data.title, cx, cy + orbR + 12, Math.max(28, w - padX * 2));
      if (!compact) {
        ctx.font = `400 11px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = palette.sub;
        ctx.fillText(data.tag, cx, cy + orbR + 30, Math.max(28, w - padX * 2));
      }
    }

    ctx.restore();
    return [cy - orbR * 0.4, cy, cy + orbR * 0.4];
  }

  function drawScanPulse(frame, leftRect, rightRect, leftRows, rightRows, audit, p) {
    if (audit.stacked) return;
    const count = Math.min(leftRows.length, rightRows.length, 3);
    if (!count) return;
    const seamX = leftRect.x + leftRect.w + audit.wallPx * 0.5;
    const ok = audit.score === 4;
    const seg = p * count;
    const idx = Math.min(count - 1, Math.floor(seg));
    const local = seg - idx;

    const lx = leftRect.x + leftRect.w * 0.52;
    const rx = rightRect.x + rightRect.w * 0.48;
    const ly = leftRows[idx];
    const ry = rightRows[idx];

    ctx.save();
    let px = lx;
    let py = ly;
    let trailColor = ok ? "#BEEB4B" : "#FF6B61";

    if (audit.axes.dialogue.status === "wall") {
      // 厚墙反弹动画
      const bounce = local < 0.5 ? local * 2 : (1 - local) * 2;
      px = lx + (leftRect.x + leftRect.w - 8 - lx) * bounce;
      py = ly;
    } else if (!audit.axes.contrast.ok) {
      // 同底迷航：小幅无序漂移
      px = lx + (rx - lx) * local;
      py = ly + Math.sin(local * Math.PI * 3) * 14;
    } else {
      // 跨缝扫视（错行时在中缝折转寻找）
      if (local < 0.45) {
        const k = local / 0.45;
        px = lx + (seamX - lx) * k;
        py = ly;
      } else if (local < 0.58) {
        const k = (local - 0.45) / 0.13;
        px = seamX;
        py = ly + (ry - ly) * k;
      } else {
        const k = (local - 0.58) / 0.42;
        px = seamX + (rx - seamX) * k;
        py = ry;
      }
    }

    // 轨迹线
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    if (audit.axes.dialogue.status === "wall") {
      ctx.lineTo(leftRect.x + leftRect.w - 6, ly);
    } else {
      ctx.lineTo(seamX, ly);
      ctx.lineTo(seamX, ry);
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 扫描光点
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = ok ? "rgba(190,235,75,0.28)" : "rgba(255,107,97,0.32)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = trailColor;
    ctx.fill();
    ctx.strokeStyle = "#0F0F0F";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 演播实时提示签
    const tip = ok
      ? "跨缝对读顺畅 · 极性与桥接同步引流"
      : audit.axes.dialogue.status === "wall"
        ? "视线撞上 44px 厚墙弹回"
        : !audit.axes.contrast.ok
          ? "双屏同底无落点 · 视线散漫"
          : `跨缝落空 +${audit.rowDeltaPx}px · 折转找行`;
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(tip).width + 18;
    const tx = Math.max(frame.x + 8, Math.min(frame.x + frame.w - tw - 8, seamX - tw / 2));
    const ty = frame.y + frame.h - 32;
    ctx.fillStyle = "#0F0F0F";
    roundRectPath(ctx, tx, ty, tw, 24, 3);
    ctx.fill();
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = trailColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tip, tx + tw / 2, ty + 12.5);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (still) {
      introT = 1;
    } else if (introT < 1) {
      introT = Math.min(1, introT + (dt || 0.016) / 0.68);
      dirty = true;
    }

    if (pulseActive) {
      if (still) {
        pulseT = 0.45;
      } else {
        pulseT += (dt || 0.016) / 2.6;
        if (pulseT >= 1) {
          pulseActive = false;
          pulseT = 0;
        }
        dirty = true;
      }
    }

    if (!dirty) return;
    dirty = false;

    const state = getState();
    const audit = auditState(state);
    const spec = SPECIMENS[state.specimen];
    const ease = 1 - Math.pow(1 - introT, 3);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 舞台底板（与原海报右翼炭灰一脉相承，含细微制图刻线）
    ctx.fillStyle = "#2A2B28";
    ctx.fillRect(0, 0, width, height);

    // 底部比例标尺区预留 34px，左右留 12px
    const rulerH = 34;
    const outerPadX = 12;
    const outerPadY = 10;
    const maxStageW = width - outerPadX * 2;
    const maxStageH = height - outerPadY - rulerH;

    // 手机 390px 模拟时居中收束屏幕框架，直观对比真机视口窄度
    const screenW = state.viewportMode === "mobile390" ? Math.min(maxStageW, Math.max(226, maxStageH * 0.66)) : maxStageW;
    const screenH = maxStageH;
    const frame = {
      x: Math.round((width - screenW) / 2),
      y: outerPadY,
      w: Math.round(screenW),
      h: Math.round(screenH),
    };
    hits.frame = frame;

    // 模拟浏览器框架外廓
    ctx.fillStyle = "#0F0F0F";
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
    const topH = drawTopChrome(frame, audit, state);
    const body = { x: frame.x, y: frame.y + topH, w: frame.w, h: frame.h - topH };

    let leftRect;
    let rightRect;
    let wallW = 0;
    if (audit.stacked) {
      const halfH = Math.round(body.h * 0.5);
      leftRect = { x: body.x, y: body.y, w: body.w, h: halfH };
      rightRect = { x: body.x, y: body.y + halfH, w: body.w, h: body.h - halfH };
    } else {
      wallW = state.bridge === "wall" ? Math.round((audit.wallPx / audit.simW) * body.w) : 0;
      const effW = body.w - wallW;
      const lw = Math.round(effW * state.split);
      leftRect = { x: body.x, y: body.y, w: lw, h: body.h };
      rightRect = { x: body.x + lw + wallW, y: body.y, w: body.w - lw - wallW, h: body.h };
    }

    // 绘制左右（或上下）极性底面
    ctx.fillStyle = audit.left.bg;
    ctx.fillRect(leftRect.x, leftRect.y, leftRect.w, leftRect.h);
    ctx.fillStyle = audit.right.bg;
    ctx.fillRect(rightRect.x, rightRect.y, rightRect.w, rightRect.h);

    // 极性图式时按原海报加酸绿细描边
    if (state.specimen === "polarity" && !audit.stacked) {
      ctx.strokeStyle = "#BEEB4B";
      ctx.lineWidth = 1;
      ctx.strokeRect(leftRect.x + 0.5, leftRect.y + 0.5, leftRect.w - 1, leftRect.h - 1);
    }

    // 绘制两屏内容
    let leftRows = [];
    let rightRows = [];
    if (state.specimen === "vs") {
      leftRows = drawVsPane(leftRect, spec.left, audit.left, state, audit, false);
      rightRows = drawVsPane(rightRect, spec.right, audit.right, state, audit, true);
    } else if (state.specimen === "and") {
      leftRows = drawAndPane(leftRect, spec.left, audit.left, state, audit, false);
      rightRows = drawAndPane(rightRect, spec.right, audit.right, state, audit, true);
    } else {
      leftRows = drawPolarityPane(leftRect, spec.left, audit.left, state, audit, false);
      rightRows = drawPolarityPane(rightRect, spec.right, audit.right, state, audit, true);
    }

    // 中缝结构：虚线 / 厚墙 / 骑缝桥接徽章（置于列表垂直中段，避开两侧标题）
    const seamX = audit.stacked ? body.x + body.w * 0.5 : leftRect.x + leftRect.w + wallW * 0.5;
    const seamY = audit.stacked ? leftRect.y + leftRect.h : body.y + body.h * 0.58;
    hits.seamX = seamX;

    if (audit.stacked) {
      ctx.strokeStyle = "#BEEB4B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(body.x, seamY);
      ctx.lineTo(body.x + body.w * ease, seamY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (state.bridge === "wall") {
      // 44px 实心厚墙反例
      ctx.fillStyle = "#262724";
      ctx.fillRect(leftRect.x + leftRect.w, body.y, wallW, body.h);
      ctx.strokeStyle = "#FF6B61";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(leftRect.x + leftRect.w + 1, body.y + 2, Math.max(2, wallW - 2), body.h - 4);
      ctx.setLineDash([]);
    } else {
      // 招牌垂直虚线中缝（开场随 ease 从顶扫到底）
      ctx.strokeStyle = audit.axes.dialogue.ok ? "#BEEB4B" : "#FF6B61";
      ctx.lineWidth = dragging ? 2.4 : 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(seamX, body.y);
      ctx.lineTo(seamX, body.y + body.h * ease);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 中缝骑跨徽章（VS / & / ↔ 或 错态提醒）
    const br = audit.stacked ? 17 : 21;
    hits.bridge = { x: seamX, y: seamY, r: br + 6 };
    ctx.save();
    ctx.beginPath();
    ctx.arc(seamX, seamY, br, 0, Math.PI * 2);
    if (state.bridge === "linked") {
      ctx.fillStyle = "#0F0F0F";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#F4F5F1";
      ctx.stroke();
      ctx.fillStyle = "#BEEB4B";
      ctx.font = `800 ${spec.bridgeGlyph.length > 1 ? 12 : 16}px "Unbounded", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.bridgeGlyph, seamX, seamY + 0.5);
    } else {
      ctx.fillStyle = "#1F0E0E";
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#FF6B61";
      ctx.stroke();
      ctx.fillStyle = "#FF8E86";
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(state.bridge === "wall" ? "厚墙" : "断联", seamX, seamY + 0.5);
    }
    ctx.restore();

    // 错态精准标尺叠层（避开文字与中缝徽章，放进安全空隙）
    if (state.showGuides && !audit.stacked) {
      // 1. 错行基线警示（精准贴在右屏下沉腾出的顶部空隙里，不遮挡右侧任何文字）
      if (state.bridge === "broken" && leftRows.length && rightRows.length) {
        const yL = leftRows[0];
        const yR = rightRows[0];
        ctx.save();
        ctx.strokeStyle = "#FF6B61";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(Math.max(leftRect.x + 12, seamX - 78), yL);
        ctx.lineTo(Math.min(rightRect.x + rightRect.w - 12, seamX + 78), yL);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(seamX + 8, yL);
        ctx.lineTo(seamX + 8, yR);
        ctx.stroke();
        const tagW = 66;
        const tx = Math.max(leftRect.x + 8, seamX - tagW - 8);
        const ty = yL - 9;
        ctx.fillStyle = "#B8231B";
        roundRectPath(ctx, tx, ty, tagW, 18, 2);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.font = `500 10.5px "DM Mono", "Noto Sans SC", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`错 +${audit.rowDeltaPx}px`, tx + tagW / 2, ty + 9.5);
        ctx.restore();
      }

      // 2. 顶部/底部汇总警签（放在底沿预留安全带内，零压字）
      const warnLabels = [];
      if (!audit.axes.contrast.ok) {
        warnLabels.push(audit.axes.contrast.status === "clash" ? "× 双高饱和互炸" : `× 同底反差仅 ${audit.ratio.toFixed(1)}:1`);
      }
      if (!audit.axes.tension.ok) {
        warnLabels.push(`× 窄侧仅 ${audit.narrowPx}px（约 ${audit.charsPerLine}字/行）`);
      }
      if (audit.axes.clarity.status === "mobileCrush") {
        warnLabels.push(`× 390px 硬切单侧仅 ${audit.narrowPx}px`);
      } else if (audit.axes.clarity.status === "packed" && warnLabels.length < 2) {
        warnLabels.push(`× 半屏过载 · 留白 ${audit.whitespacePct}%`);
      }
      if (warnLabels.length) {
        const txt = warnLabels.slice(0, body.w > 460 ? 2 : 1).join("   ");
        ctx.save();
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        const tw = Math.min(body.w - 16, ctx.measureText(txt).width + 18);
        const tx = body.x + (body.w - tw) / 2;
        const ty = body.y + body.h - 26;
        ctx.fillStyle = "#B8231B";
        roundRectPath(ctx, tx, ty, tw, 20, 3);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt, tx + tw / 2, ty + 10.5, tw - 10);
        ctx.restore();
      }
    }

    // 屏幕边框收口
    ctx.strokeStyle = audit.score === 4 ? "#BEEB4B" : "#565852";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frame.x + 0.5, frame.y + 0.5, frame.w - 1, frame.h - 1);

    // 视线脉冲演播
    if (pulseActive) {
      drawScanPulse(frame, leftRect, rightRect, leftRows, rightRows, audit, pulseT);
    }

    // 底部实时比例标尺条（单真源数字 + 拖动手柄提示）
    const ry = frame.y + frame.h + 11;
    const barH = 12;
    ctx.fillStyle = "#181917";
    ctx.fillRect(frame.x, ry, frame.w, barH);
    const leftBarW = audit.stacked ? frame.w * 0.5 : frame.w * state.split;
    ctx.fillStyle = audit.axes.tension.ok ? "#BEEB4B" : "#FF6B61";
    ctx.fillRect(frame.x, ry, leftBarW, barH);
    ctx.fillStyle = "#696B65";
    ctx.fillRect(frame.x + leftBarW, ry, frame.w - leftBarW, barH);

    // 理想安全区刻度（35%–65%）
    if (!audit.stacked) {
      ctx.strokeStyle = "#F4F5F1";
      ctx.lineWidth = 1;
      for (const mark of [0.35, 0.5, 0.65]) {
        const mx = Math.round(frame.x + frame.w * mark) + 0.5;
        ctx.beginPath();
        ctx.moveTo(mx, ry - 2);
        ctx.lineTo(mx, ry + barH + 2);
        ctx.stroke();
      }
    }

    ctx.font = `500 10.5px "DM Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0F0F0F";
    ctx.textAlign = "left";
    if (leftBarW > 46) ctx.fillText(audit.stacked ? "TOP 50%" : `L ${audit.splitPctL}%`, frame.x + 5, ry + barH / 2 + 0.5);
    ctx.fillStyle = "#F4F5F1";
    ctx.textAlign = "right";
    if (frame.w - leftBarW > 46) ctx.fillText(audit.stacked ? "BOT 50%" : `R ${audit.splitPctR}%`, frame.x + frame.w - 5, ry + barH / 2 + 0.5);

    ctx.restore();
  }

  function canvasCoords(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function inBox(pt, box) {
    return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  function cycleTone(cur) {
    const idx = TONE_ORDER.indexOf(cur);
    return TONE_ORDER[(idx + 1) % TONE_ORDER.length];
  }

  function cycleBridge(cur) {
    if (cur === "broken") return "linked";
    if (cur === "linked") return "wall";
    return "linked";
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const pt = canvasCoords(e);
    dragging = true;
    dragMoved = false;
    dragStartX = pt.x;
    dragStartY = pt.y;
    dragStartSplit = getState().split;
    activePointerId = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    dirty = true;
    ctrl.draw();
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = canvasCoords(e);
    if (!dragging) {
      const nearSeam = Math.abs(pt.x - hits.seamX) < 20;
      const onPill = inBox(pt, hits.leftTonePill) || inBox(pt, hits.rightTonePill);
      const onBridge = Math.hypot(pt.x - hits.bridge.x, pt.y - hits.bridge.y) <= hits.bridge.r;
      canvas.style.cursor = onPill || onBridge ? "pointer" : nearSeam ? "ew-resize" : "grab";
      return;
    }
    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragMoved = true;

    const state = getState();
    const fw = Math.max(120, hits.frame.w);
    // 直接映射水平位移为分屏中缝比例（即使在 390 模拟态也能流畅调比例）
    const next = clampSplit(dragStartSplit + dx / fw);
    if (Math.abs(next - state.split) > 0.001) {
      const patch = { split: next };
      if (state.viewportMode === "mobile390" && state.mobileMode === "stack") {
        // 拖动时如处于堆叠态，轻微更新比例并提示
        patch.split = next;
      }
      onPatch(patch, { silentSnap: true });
    }
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (activePointerId != null) {
      try {
        canvas.releasePointerCapture(activePointerId);
      } catch {}
      activePointerId = null;
    }

    const pt = canvasCoords(e);
    const state = getState();
    if (!dragMoved) {
      // 精准点按交互：中缝徽章 / 左右底色角标
      if (Math.hypot(pt.x - hits.bridge.x, pt.y - hits.bridge.y) <= hits.bridge.r) {
        onPatch({ bridge: cycleBridge(state.bridge) });
      } else if (inBox(pt, hits.leftTonePill)) {
        onPatch({ leftTone: cycleTone(state.leftTone) });
      } else if (inBox(pt, hits.rightTonePill)) {
        onPatch({ rightTone: cycleTone(state.rightTone) });
      }
    } else {
      // 松手轻柔吸附到经典比例（50:50 / 42:58 / 40:60）
      const snapped = snapSplit(state.split);
      if (snapped !== state.split) onPatch({ split: snapped });
    }
    dirty = true;
    ctrl.draw();
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  const ctrl = loop(canvas, render);
  if (reducedMotion.matches) {
    introT = 1;
    dirty = true;
    ctrl.draw();
  }

  return {
    invalidate() {
      dirty = true;
      ctrl.draw();
    },
    triggerPulse() {
      pulseActive = true;
      pulseT = 0;
      dirty = true;
      ctrl.draw();
    },
  };
}
