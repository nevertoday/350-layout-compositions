// 155 插页式版式 · 开场 2D Canvas 活体夹页抽拉台与书脊剖面尺
// 1:1 化用 155 原海报深海藏青袋口、薄荷半调点阵、折角浅纸、指抠衬夹与索引耳插卡。
// 所有几何与遮盖率严格共享 model.js 的 computeLayout / diagnose，零硬编码读数。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, STOCKS, THEMES, clamp } from "./model.js";

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
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

function notchCardPath(ctx, x, y, w, h, r, notchR) {
  const rad = Math.min(r, w / 2, h / 2);
  const cx = x + w * 0.5;
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(cx - notchR, y);
  ctx.arc(cx, y, notchR, Math.PI, 0, true);
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

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 1;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, Math.max(1, lo)) + "…";
}

// 零 shadowBlur 柔和纸缘叠影（软件渲染下比 shadowBlur 快一个数量级）
function drawPaperShadow(ctx, drawShape, ox, oy, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(ox * 1.18, oy * 1.18);
  ctx.fillStyle = `rgba(2, 10, 24, ${(alpha * 0.36).toFixed(3)})`;
  drawShape();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(ox * 0.58, oy * 0.58);
  ctx.fillStyle = `rgba(2, 10, 24, ${(alpha * 0.56).toFixed(3)})`;
  drawShape();
  ctx.fill();
  ctx.restore();
}

export function createHeroStage(canvas, getState, getDiag, actions) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 480;
  let dpr = 1;
  let dirty = true;
  let intro = 0;
  let dragging = false;
  let pointerId = null;
  let downX = 0;
  let downY = 0;
  let startExposure = 0.42;
  let moved = false;
  let hitZones = { primary: null, chopPill: null, extras: [] };
  let dotsCache = [];

  // 离屏图层缓存：静态宿主页与前景波浪袋口仅在尺寸/题材/锚位变更时重绘
  const bgLayer = document.createElement("canvas");
  const bgCtx = bgLayer.getContext("2d");
  let bgKey = "";
  const pocketLayer = document.createElement("canvas");
  const pocketCtx = pocketLayer.getContext("2d");
  let pocketKey = "";

  function buildDots(w, h) {
    // 原海报右下深蓝袋口的薄荷渐隐半调圆点
    const pts = [];
    const cols = 12;
    const rows = 9;
    const ox = w * 0.69;
    const oy = h * 0.56;
    const stepX = (w * 0.32) / cols;
    const stepY = (h * 0.27) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);
        const dist = (u + v) * 0.5;
        if (dist < 0.34) continue;
        const rad = clamp((dist - 0.3) * 4.4, 1.0, 3.6);
        pts.push({
          x: ox + c * stepX + (r % 2) * stepX * 0.42,
          y: oy + r * stepY,
          r: rad,
          a: clamp((dist - 0.25) * 0.78, 0.16, 0.72),
        });
      }
    }
    dotsCache = pts;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cssW = Math.round(rect.width);
    cssH = Math.round(rect.height);
    // 窄屏/手机上限 1.5（GUIDE.md 建议），大幅提升软渲染拖动帧率
    dpr = pixelRatio(cssW <= 500 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    bgKey = "";
    pocketKey = "";
    buildDots(cssW, cssH);
    dirty = true;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function drawEyeBadge(x, y, size, darkMode) {
    const half = size * 0.5;
    const br = size * 0.24;
    ctx.save();
    ctx.strokeStyle = darkMode ? PALETTE.citrineTab : PALETTE.ink;
    ctx.lineWidth = 1.6;
    // 四角取景折角（完全来自 155 原海报）
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    for (const [sx, sy] of corners) {
      const cx = x + sx * half;
      const cy = y + sy * half;
      ctx.beginPath();
      ctx.moveTo(cx - sx * br, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy - sy * br);
      ctx.stroke();
    }
    // 深藏青圆盘与金黄瞳眼图徽
    const r = size * 0.34;
    ctx.fillStyle = darkMode ? PALETTE.citrineTab : PALETTE.navyTab;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = darkMode ? PALETTE.navyTab : PALETTE.citrineBright;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.62, y);
    ctx.quadraticCurveTo(x, y - r * 0.54, x + r * 0.62, y);
    ctx.quadraticCurveTo(x, y + r * 0.54, x - r * 0.62, y);
    ctx.stroke();

    ctx.fillStyle = darkMode ? PALETTE.navyTab : PALETTE.citrineBright;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHostSpread(c, host, theme, state, w, h) {
    const hx = host.x * w;
    const hy = host.y * h;
    const hw = host.w * w;
    const hh = host.h * h;

    drawPaperShadow(c, () => roundRectPath(c, hx, hy, hw, hh, 5), 0, 8, 0.36);
    roundRectPath(c, hx, hy, hw, hh, 5);
    c.fillStyle = PALETTE.paper;
    c.fill();

    c.save();
    roundRectPath(c, hx, hy, hw, hh, 5);
    c.clip();

    // 左上淡薄荷折角（155 原海报视觉标记）
    c.fillStyle = PALETTE.mintCorner;
    c.beginPath();
    c.moveTo(hx, hy);
    c.lineTo(hx + hw * 0.13, hy);
    c.lineTo(hx, hy + hh * 0.11);
    c.closePath();
    c.fill();

    // 左下松绿折角 + 细斜线（155 原海报标志细节）
    const foldW = Math.min(44, hw * 0.085);
    const foldH = Math.min(44, hh * 0.14);
    c.fillStyle = PALETTE.tealFold;
    c.beginPath();
    c.moveTo(hx, hy + hh - foldH);
    c.lineTo(hx + foldW, hy + hh);
    c.lineTo(hx, hy + hh);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(46, 126, 110, 0.42)";
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 1; i <= 5; i++) {
      c.moveTo(hx + foldW * 0.25 + i * 5, hy + hh - foldH * 0.95 + i * 3);
      c.lineTo(hx + foldW + i * 6, hy + hh - 2);
    }
    c.stroke();

    // 中缝书脊折痕（双页跨页感）
    const spineX = hx + hw * 0.48;
    const grad = c.createLinearGradient(spineX - 18, hy, spineX + 18, hy);
    grad.addColorStop(0, "rgba(3,17,30,0)");
    grad.addColorStop(0.5, "rgba(3,17,30,0.085)");
    grad.addColorStop(1, "rgba(3,17,30,0)");
    c.fillStyle = grad;
    c.fillRect(spineX - 18, hy, 36, hh);

    // 顶栏页眉
    const padX = Math.max(14, hw * 0.04);
    const padY = Math.max(14, hh * 0.065);
    const smallFs = clamp(w * 0.0175, 10, 12);
    const headFs = clamp(w * 0.026, 13, 19);
    const bodyFs = clamp(w * 0.018, 10.5, 13);

    c.fillStyle = PALETTE.tealSafe;
    c.font = `600 ${smallFs}px "JetBrains Mono", "Noto Sans SC", monospace`;
    c.fillText(fitText(c, theme.hostTag, hw - padX * 2), hx + padX, hy + padY + smallFs * 0.4);

    c.fillStyle = PALETTE.ink;
    c.font = `900 ${headFs}px "Noto Sans SC", sans-serif`;
    c.fillText(fitText(c, theme.hostTitle, hw * 0.86), hx + padX, hy + padY + smallFs + headFs * 1.15);

    c.strokeStyle = "rgba(46, 126, 110, 0.35)";
    c.lineWidth = 1;
    const ruleY = hy + padY + smallFs + headFs * 1.55;
    c.beginPath();
    c.moveTo(hx + padX, ruleY);
    c.lineTo(hx + hw - padX, ruleY);
    c.stroke();

    // 左栏与右栏正文排版
    const colGap = Math.max(18, hw * 0.06);
    const colW = (hw - padX * 2 - colGap) / 2;
    const lineH = clamp(hh * 0.082, 16, 24);
    const startY = ruleY + lineH * 1.15;

    c.font = `400 ${bodyFs}px "Noto Sans SC", sans-serif`;
    theme.colA.forEach((line, idx) => {
      const ly = startY + idx * lineH;
      if (ly > hy + hh - 16) return;
      c.fillStyle = PALETTE.inkSub;
      c.fillText(fitText(c, line, colW), hx + padX, ly);
      // 若处于「腰斩正文」错态，在第 2 行处画出红色剪断标
      if (state.autonomy === "chop" && idx === 2 && state.count >= 1) {
        c.save();
        c.strokeStyle = PALETTE.errLight;
        c.setLineDash([4, 3]);
        c.lineWidth = 1.4;
        c.strokeRect(hx + padX - 3, ly - bodyFs * 0.95, colW + 4, lineH * 1.1);
        c.restore();
      }
    });

    const colBX = hx + padX + colW + colGap;
    theme.colB.forEach((line, idx) => {
      const ly = startY + idx * lineH;
      if (ly > hy + hh - 16) return;
      c.fillStyle = PALETTE.inkSub;
      c.fillText(fitText(c, line, colW), colBX, ly);
    });

    // 订口缝线标（当 anchor === "spine" 时高亮中缝物理装订点）
    if (state.anchor === "spine" && state.count >= 1) {
      c.save();
      c.strokeStyle = PALETTE.tealSafe;
      c.lineWidth = 2;
      c.setLineDash([6, 6]);
      c.beginPath();
      c.moveTo(spineX, hy + 6);
      c.lineTo(spineX, hy + hh - 6);
      c.stroke();
      c.restore();
    }

    c.restore();

    // 纸张轮廓细边
    c.strokeStyle = "rgba(183, 208, 196, 0.55)";
    c.lineWidth = 1;
    roundRectPath(c, hx, hy, hw, hh, 5);
    c.stroke();
  }

  function ensureBgCache(host, theme, state, w, h) {
    const k = `${w}x${h}@${dpr}|${state.theme}|${state.autonomy === "chop" ? 1 : 0}|${state.anchor === "spine" ? 1 : 0}|${state.count === 0 ? 0 : 1}`;
    if (k === bgKey) return;
    bgKey = k;
    bgLayer.width = canvas.width;
    bgLayer.height = canvas.height;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.fillStyle = PALETTE.navyDeep;
    bgCtx.fillRect(0, 0, w, h);

    // 极淡出版基线（单次路径合并 stroke）
    bgCtx.strokeStyle = "rgba(183, 208, 196, 0.07)";
    bgCtx.lineWidth = 1;
    const step = 32;
    bgCtx.beginPath();
    for (let x = step; x < w; x += step) {
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, h * 0.81);
    }
    for (let y = step; y < h * 0.81; y += step) {
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(w, y);
    }
    bgCtx.stroke();

    drawHostSpread(bgCtx, host, theme, state, w, h);
  }

  function drawSecondaryCard(card, theme, state, w, h, ease) {
    const cx = card.x * w + (1 - ease) * 26;
    const cy = card.y * h + (1 - ease) * 14;
    const cw = card.w * w;
    const ch = card.h * h;
    const isEqualErr = state.count === 2 && state.pairBalance === "equal";
    const fill = isEqualErr ? PALETTE.citrine : PALETTE.folderMint;

    const drawShape = () => {
      if (card.hasNotch) notchCardPath(ctx, cx, cy, cw, ch, 6, Math.min(14, cw * 0.08));
      else roundRectPath(ctx, cx, cy, cw, ch, 6);
    };
    drawPaperShadow(ctx, drawShape, -5, 7, 0.28);
    drawShape();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    if (card.hasNotch) notchCardPath(ctx, cx, cy, cw, ch, 6, Math.min(14, cw * 0.08));
    else roundRectPath(ctx, cx, cy, cw, ch, 6);
    ctx.clip();

    if (!isEqualErr) {
      // 原海报浅薄荷衬夹的右上大圆弧与斜线纹 + 明黄圆点
      ctx.fillStyle = "rgba(183, 208, 196, 0.58)";
      ctx.beginPath();
      ctx.arc(cx + cw * 0.96, cy + ch * 0.42, Math.min(cw, ch) * 0.46, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(46, 126, 110, 0.22)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + ch * 0.52 + i * 9);
        ctx.lineTo(cx + cw * 0.65, cy + ch * 0.92 + i * 9);
        ctx.stroke();
      }

      ctx.fillStyle = PALETTE.citrineBright;
      ctx.beginPath();
      ctx.arc(cx + cw * 0.26, cy + ch * 0.64, Math.min(cw, ch) * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }

    const pad = Math.max(10, cw * 0.07);
    const kFs = clamp(w * 0.0145, 9.5, 11);
    const tFs = clamp(w * 0.019, 11, 14);
    ctx.fillStyle = isEqualErr ? PALETTE.errLight : PALETTE.tealSafe;
    ctx.font = `700 ${kFs}px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.fillText(
      fitText(ctx, isEqualErr ? "平权抢戏 · 同级竞争" : theme.secondaryKicker, cw - pad * 2),
      cx + pad,
      cy + pad + (card.hasNotch ? 14 : 6)
    );
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 ${tFs}px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      fitText(ctx, theme.secondaryTitle, cw - pad * 2),
      cx + pad,
      cy + pad + (card.hasNotch ? 32 : 24)
    );
    ctx.restore();

    ctx.strokeStyle = isEqualErr ? PALETTE.errLight : "rgba(46, 126, 110, 0.35)";
    ctx.lineWidth = isEqualErr ? 1.8 : 1;
    if (card.hasNotch) notchCardPath(ctx, cx, cy, cw, ch, 6, Math.min(14, cw * 0.08));
    else roundRectPath(ctx, cx, cy, cw, ch, 6);
    ctx.stroke();
  }

  function drawExtraCard(card, theme, w, h, ease) {
    const cx = card.x * w;
    const cy = card.y * h + (1 - ease) * 16;
    const cw = card.w * w;
    const ch = card.h * h;
    const item = theme.extras[card.idx] || theme.extras[0];

    drawPaperShadow(ctx, () => roundRectPath(ctx, cx, cy, cw, ch, 5), 0, 5, 0.24);
    roundRectPath(ctx, cx, cy, cw, ch, 5);
    ctx.fillStyle = card.idx === 0 ? "#F4EAE8" : "#F5F2DC";
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = PALETTE.errLight;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, cx, cy, cw, ch, 5);
    ctx.stroke();
    ctx.setLineDash([]);

    const pad = 10;
    ctx.fillStyle = PALETTE.errLight;
    ctx.font = `700 ${clamp(w * 0.015, 10, 11.5)}px "Noto Sans SC", sans-serif`;
    ctx.fillText(fitText(ctx, `冗余插卡 · ${item.title}`, cw - pad * 2), cx + pad, cy + pad + 10);
    ctx.fillStyle = PALETTE.inkSub;
    ctx.font = `400 ${clamp(w * 0.0155, 10, 12)}px "Noto Sans SC", sans-serif`;
    ctx.fillText(fitText(ctx, item.line, cw - pad * 2), cx + pad, cy + pad + 28);
    ctx.fillStyle = "rgba(184, 42, 36, 0.14)";
    roundRectPath(ctx, cx + pad, cy + ch - 24, Math.min(cw - pad * 2, 92), 18, 3);
    ctx.fill();
    ctx.fillStyle = PALETTE.errLight;
    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.fillText("点此清掉多余卡", cx + pad + 6, cy + ch - 11);
    ctx.restore();

    hitZones.extras.push({ x: cx, y: cy, w: cw, h: ch });
  }

  function drawPrimaryCard(card, theme, state, diag, w, h, ease) {
    const stock = STOCKS[state.stock];
    const slideOffset = (1 - ease) * (state.anchor === "spine" ? -28 : 34);
    const cx = card.x * w + slideOffset;
    const cy = card.y * h + (dragging ? -3 : 0);
    const cw = card.w * w;
    const ch = card.h * h;

    hitZones.primary = { x: cx, y: cy, w: cw, h: ch };
    hitZones.chopPill = null;

    // 侧边凸出索引耳（155 原海报标志设计）
    const tabW = clamp(w * 0.025, 13, 19);
    const tabH = clamp(ch * 0.26, 36, 56);
    const tabX = cx + cw - 1;
    const tabY = cy + ch * 0.2;

    if (stock.shadowAlpha > 0) {
      const lift = dragging ? 4 : 0;
      const sx = (state.anchor === "spine" ? 1 : -1) * (stock.shadowOffset + lift * 0.6);
      const sy = stock.shadowOffset * 0.8 + lift;
      drawPaperShadow(ctx, () => roundRectPath(ctx, cx, cy, cw, ch, 7), sx, sy, stock.shadowAlpha);
    }

    // 绘制索引耳
    roundRectPath(ctx, tabX, tabY, tabW, tabH, 4);
    ctx.fillStyle = stock.tabFill;
    ctx.fill();

    // 绘制主插页本体
    roundRectPath(ctx, cx, cy, cw, ch, 7);
    ctx.fillStyle = stock.fill;
    ctx.fill();

    // 索引耳内抽拉防滑线
    ctx.save();
    ctx.strokeStyle = stock.tabInk;
    ctx.lineWidth = 1.4;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(tabX + tabW * 0.35, tabY + tabH * 0.5 + i * 6);
      ctx.lineTo(tabX + tabW * 0.72, tabY + tabH * 0.5 + i * 6);
      ctx.stroke();
    }
    ctx.restore();

    // 若为硫酸纸，叠一层极细纤维斜纹让半透质感可辨
    ctx.save();
    roundRectPath(ctx, cx, cy, cw, ch, 7);
    ctx.clip();

    if (state.stock === "vellum") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
      ctx.lineWidth = 1;
      for (let i = -ch; i < cw + ch; i += 14) {
        ctx.beginPath();
        ctx.moveTo(cx + i, cy);
        ctx.lineTo(cx + i - ch * 0.3, cy + ch);
        ctx.stroke();
      }
    }

    // 卡片底沿装饰点阵（合并单次 beginPath/fill，省 30+ 次 draw 调用）
    const dotCol = state.stock === "navy" ? "rgba(176, 207, 188, 0.35)" : state.stock === "citrine" ? "rgba(255, 255, 255, 0.58)" : "rgba(46, 126, 110, 0.25)";
    ctx.fillStyle = dotCol;
    const dotRows = 2;
    const dotCols = Math.max(4, Math.floor((cw - 28) / 14));
    ctx.beginPath();
    for (let r = 0; r < dotRows; r++) {
      for (let c = 0; c < dotCols; c++) {
        const dx = cx + 16 + c * 14;
        const dy = cy + ch - 18 + r * 8;
        ctx.moveTo(dx + 1.5, dy);
        ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    const padX = clamp(cw * 0.08, 10, 22);
    const padY = clamp(ch * 0.08, 12, 20);
    const innerW = Math.max(30, cw - padX * 2);
    const isNarrow = cw < 145;

    // 顶部焦点眼标（够宽且非密文墙时呈现，直接传承原海报「视觉焦点」白卡）
    let curY = cy + padY;
    if (!isNarrow && state.autonomy === "clean" && ch > 175) {
      const badgeS = clamp(ch * 0.21, 34, 48);
      drawEyeBadge(cx + cw - padX - badgeS * 0.52, cy + padY + badgeS * 0.48, badgeS, state.stock === "navy");
    }

    // Kicker
    const kFs = clamp(w * 0.015, 10, 11.5);
    ctx.fillStyle =
      state.stock === "navy"
        ? PALETTE.citrineTab
        : state.stock === "flat"
          ? "#607384"
          : PALETTE.ink;
    ctx.font = `700 ${kFs}px "Bricolage Grotesque", "JetBrains Mono", "Noto Sans SC", sans-serif`;
    const kickerText =
      state.autonomy === "chop"
        ? "错态 · 截断正文半句"
        : state.autonomy === "wall"
          ? "错态 · 密排文字墙"
          : theme.insertKicker;
    ctx.fillText(fitText(ctx, kickerText, innerW - (!isNarrow && state.autonomy === "clean" ? 56 : 0)), cx + padX, curY + kFs);
    curY += kFs + 8;

    // 短分隔杠
    ctx.fillStyle = state.stock === "navy" ? PALETTE.citrineTab : state.stock === "flat" ? "#B5C3C7" : PALETTE.ink;
    ctx.fillRect(cx + padX, curY, Math.min(28, innerW * 0.35), 2);
    curY += 12;

    // 主标题
    const titleStr =
      state.autonomy === "chop"
        ? theme.chopTitle
        : state.autonomy === "wall"
          ? theme.wallTitle
          : theme.insertTitle;
    const tFs = clamp(cw * 0.075, 12, 18);
    ctx.fillStyle = stock.ink;
    ctx.font = `900 ${tFs}px "Noto Sans SC", sans-serif`;
    ctx.fillText(fitText(ctx, titleStr, innerW - (!isNarrow && state.autonomy === "clean" ? 56 : 0)), cx + padX, curY + tFs * 0.85);
    curY += tFs + 12;

    // 卡片内容行
    const lines =
      state.autonomy === "chop"
        ? theme.chopLines
        : state.autonomy === "wall"
          ? theme.wallLines
          : theme.insertLines;
    const bFs = state.autonomy === "wall" ? clamp(w * 0.0145, 9.5, 10.8) : clamp(w * 0.0175, 10.5, 13);
    const lh = state.autonomy === "wall" ? bFs * 1.48 : bFs * 1.65;
    ctx.font = `400 ${bFs}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = stock.subInk;
    for (let i = 0; i < lines.length; i++) {
      if (curY + lh > cy + ch - (state.autonomy === "chop" ? 48 : 26)) break;
      ctx.fillText(fitText(ctx, lines[i], innerW), cx + padX, curY + bFs * 0.8);
      curY += lh;
    }

    // 腰斩错态交互修复红标（点画布直接修）
    if (state.autonomy === "chop" && cw > 96) {
      const pw = Math.min(innerW, 152);
      const ph = 24;
      const px = cx + padX;
      const py = cy + ch - 46;
      roundRectPath(ctx, px, py, pw, ph, 4);
      ctx.fillStyle = PALETTE.errLight;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.fillText(fitText(ctx, "✂ 腰斩正文 · 点此改正", pw - 14), px + 8, py + 15.5);
      hitZones.chopPill = { x: px, y: py, w: pw, h: ph };
    }

    // 悬空无锚错态四角虚标
    if (state.anchor === "float") {
      ctx.strokeStyle = PALETTE.errLight;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      roundRectPath(ctx, cx + 2, cy + 2, cw - 4, ch - 4, 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // 外描边（若同色隐身，故意极淡；若错态且被拖拽则高亮边界）
    ctx.save();
    roundRectPath(ctx, cx, cy, cw, ch, 7);
    ctx.strokeStyle =
      state.stock === "flat"
        ? "rgba(184, 42, 36, 0.55)"
        : dragging
          ? PALETTE.citrineBright
          : stock.border;
    ctx.lineWidth = dragging ? 2 : state.stock === "flat" ? 1.4 : 1.1;
    if (state.stock === "flat") ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();

    // 明确抽拉提示小标贴在主插页自由边缘
    const edgeX = state.anchor === "spine" ? cx + cw : cx;
    const pillW = 86;
    const pillH = 22;
    const pillX = clamp(edgeX - pillW * 0.5, 10, w - pillW - 10);
    const pillY = clamp(cy - pillH * 0.5, 8, h * 0.72);
    ctx.save();
    roundRectPath(ctx, pillX, pillY, pillW, pillH, 11);
    ctx.fillStyle = diag.checks.span ? PALETTE.tealSafe : PALETTE.errLight;
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 10.5px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`↔ 露出 ${diag.layout.exposurePct}%`, pillX + pillW * 0.5, pillY + 14.5);
    ctx.restore();
  }

  function ensurePocketCache(w, h, state) {
    const k = `${w}x${h}@${dpr}|${state.anchor === "pocket" ? 1 : 0}`;
    if (k === pocketKey) return;
    pocketKey = k;
    pocketLayer.width = canvas.width;
    pocketLayer.height = canvas.height;
    pocketCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pocketCtx.clearRect(0, 0, w, h);

    // 155 原海报前景波浪形深藏青袋口 + 薄荷半调圆点
    const pocketTop = h * 0.68;
    const pocketBottom = h * 0.805;
    pocketCtx.save();
    pocketCtx.beginPath();
    pocketCtx.moveTo(w * 0.45, pocketBottom);
    pocketCtx.bezierCurveTo(w * 0.6, pocketBottom - 8, w * 0.66, pocketTop + 8, w * 0.78, pocketTop);
    pocketCtx.quadraticCurveTo(w * 0.9, pocketTop - 6, w, pocketTop - 22);
    pocketCtx.lineTo(w, pocketBottom);
    pocketCtx.closePath();

    pocketCtx.fillStyle = state.anchor === "pocket" ? PALETTE.navyPocket : "rgba(18, 40, 71, 0.42)";
    pocketCtx.fill();

    // 袋口顶部高光细线
    pocketCtx.strokeStyle = state.anchor === "pocket" ? "rgba(176, 207, 188, 0.48)" : "rgba(176, 207, 188, 0.16)";
    pocketCtx.lineWidth = 1.4;
    pocketCtx.stroke();

    // 裁切后在袋口内画薄荷半调点阵
    pocketCtx.clip();
    for (let i = 0; i < dotsCache.length; i++) {
      const d = dotsCache[i];
      if (d.y > pocketBottom) continue;
      pocketCtx.fillStyle = `rgba(176, 207, 188, ${d.a})`;
      pocketCtx.beginPath();
      pocketCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      pocketCtx.fill();
    }
    pocketCtx.restore();
  }

  function drawXray(host, cards, state, diag, w, h, t) {
    const hx = host.x * w;
    const hy = host.y * h;
    const hw = host.w * w;
    const hh = host.h * h;

    ctx.save();
    // 24%–56% 露出经验甜区竖带（按当前锚位标示）
    const sweetA = state.anchor === "spine" ? hx + hw * 0.48 + hw * 0.24 : hx + hw * (1 - 0.56);
    const sweetB = state.anchor === "spine" ? hx + hw * 0.48 + hw * 0.56 : hx + hw * (1 - 0.24);
    const sa = clamp(Math.min(sweetA, sweetB), hx, hx + hw);
    const sb = clamp(Math.max(sweetA, sweetB), hx, hx + hw);
    ctx.fillStyle = "rgba(46, 126, 110, 0.14)";
    ctx.fillRect(sa, hy, sb - sa, hh);
    ctx.strokeStyle = PALETTE.okDark;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(sa, hy, sb - sa, hh);

    // 视线阅读与刹车动线
    const pCard = cards[cards.length - 1];
    if (pCard) {
      const p1 = { x: hx + hw * 0.18, y: hy + hh * 0.28 };
      const p2 = { x: hx + hw * 0.24, y: hy + hh * 0.54 };
      const p3 = { x: (pCard.x + pCard.w * 0.5) * w, y: (pCard.y + pCard.h * 0.42) * h };
      const p4 = { x: hx + hw * 0.72, y: hy + hh * 0.86 };

      ctx.strokeStyle = diag.passed ? PALETTE.citrineBright : PALETTE.errDark;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.quadraticCurveTo(p2.x + 28, p3.y, p3.x, p3.y);
      ctx.quadraticCurveTo(p3.x, p4.y - 16, p4.x, p4.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 焦点停顿脉冲环
      const pulse = 1 + 0.22 * Math.sin(t * 3.6);
      ctx.strokeStyle = diag.passed ? PALETTE.citrineBright : PALETTE.errDark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(p3.x, p3.y, 14 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = PALETTE.navyDeep;
      roundRectPath(ctx, p3.x - 42, p3.y - 26, 84, 18, 4);
      ctx.fill();
      ctx.fillStyle = diag.passed ? PALETTE.citrineBright : PALETTE.errDark;
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(diag.brakeTier, p3.x, p3.y - 13.5);
    }
    ctx.restore();
  }

  function drawSpineCrossSection(layout, state, diag, w, h) {
    // 底部 18% 专属「书脊 Z 轴纸层剖面尺」——把看不见的纸层厚度、露出比例和甜区直接画成侧剖图
    const barY = h * 0.825;
    const barH = h * 0.155;
    const bx = layout.host.x * w;
    const bw = layout.host.w * w;

    ctx.save();
    roundRectPath(ctx, bx, barY, bw, barH, 6);
    ctx.fillStyle = "rgba(4, 17, 37, 0.86)";
    ctx.fill();
    ctx.strokeStyle = "rgba(183, 208, 196, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const padX = 14;
    const trackX = bx + padX;
    const trackW = bw - padX * 2;
    const baseLineY = barY + barH - 16;

    // 标题与实测毫米读数（先量左侧实宽，避免窄屏撞字重影）
    const compactBar = trackW < 420;
    const barFs = compactBar ? 10 : 10.5;
    ctx.font = `600 ${barFs}px "JetBrains Mono", "Noto Sans SC", monospace`;
    const leftLabel = compactBar ? "书脊 Z 轴剖面" : "书脊 Z 轴纸层剖面（示意）";
    const leftW = ctx.measureText(leftLabel).width;
    ctx.fillStyle = "#C6DDD2";
    ctx.fillText(leftLabel, trackX, barY + 15);

    ctx.textAlign = "right";
    ctx.fillStyle = diag.checks.span ? PALETTE.okDark : PALETTE.errDark;
    const specTxt =
      state.count === 0
        ? compactBar
          ? "0 层 · 185mm"
          : "0 层 · 仅宿主页 185mm"
        : compactBar
          ? `露出 ${layout.exposurePct}% · 遮盖 ${layout.coveragePct}%`
          : `露出 ${layout.exposurePct}%（≈${layout.sheetMm}mm / 185mm 开本）· 净遮盖 ${layout.coveragePct}%`;
    const rightMaxW = Math.max(76, trackW - leftW - 12);
    ctx.fillText(fitText(ctx, specTxt, rightMaxW), trackX + trackW, barY + 15);
    ctx.textAlign = "left";

    // 经验甜区标尺带（24%–56%）
    const sweetX1 = trackX + trackW * 0.24;
    const sweetX2 = trackX + trackW * 0.56;
    ctx.fillStyle = "rgba(124, 229, 200, 0.14)";
    ctx.fillRect(sweetX1, baseLineY - 22, sweetX2 - sweetX1, 24);
    ctx.strokeStyle = "rgba(124, 229, 200, 0.45)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sweetX1, baseLineY - 22);
    ctx.lineTo(sweetX1, baseLineY + 2);
    ctx.moveTo(sweetX2, baseLineY - 22);
    ctx.lineTo(sweetX2, baseLineY + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // L0 宿主页底座线
    ctx.fillStyle = "#B7D0C4";
    ctx.fillRect(trackX, baseLineY, trackW, 3);

    // L1 副衬夹剖面条
    if (state.count >= 2) {
      ctx.fillStyle = PALETTE.folderMint;
      ctx.fillRect(trackX + trackW * 0.08, baseLineY - 7, trackW * 0.44, 3);
    }

    // L2 主插页剖面条（高度直接反映纸材 Z 阶，宽度直接反映 exposure）
    if (state.count >= 1) {
      const stock = STOCKS[state.stock];
      const liftPx = stock.zStepMm === 0 ? 1 : Math.round(6 + stock.zStepMm * 2.2);
      const barW = trackW * clamp(state.exposure, 0.08, 0.94);
      ctx.fillStyle = state.stock === "flat" ? "#98AAB0" : state.stock === "citrine" ? PALETTE.citrine : state.stock === "vellum" ? "#89C9B8" : "#6AA5F8";
      ctx.fillRect(trackX, baseLineY - liftPx, barW, 4);

      // 端头刻度点
      ctx.beginPath();
      ctx.arc(trackX + barW, baseLineY - liftPx + 2, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 底沿刻度字
    ctx.fillStyle = "#A9C4BA";
    ctx.font = `400 10px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.fillText("0%", trackX, baseLineY + 12);
    ctx.textAlign = "center";
    ctx.fillText("24%–56% 经验甜区", (sweetX1 + sweetX2) * 0.5, baseLineY + 12);
    ctx.textAlign = "right";
    ctx.fillText("100%", trackX + trackW, baseLineY + 12);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    const state = getState();
    const diag = getDiag();

    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 1.9);
      dirty = true;
    }

    if (!dirty && !state.xray) return;
    dirty = false;

    const w = cssW;
    const h = cssH;
    const ease = 1 - Math.pow(1 - intro, 3);
    const theme = THEMES[state.theme];
    const { layout } = diag;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1 & 2. 离屏缓存：深海藏青工作台网格 + 双栏宿主页（单次 drawImage）
    ensureBgCache(layout.host, theme, state, w, h);
    ctx.drawImage(bgLayer, 0, 0, w, h);

    // 3. 叠层插页们（按 Z 序）
    hitZones = { primary: null, chopPill: null, extras: [] };
    for (const c of layout.cards) {
      if (c.role === "secondary") drawSecondaryCard(c, theme, state, w, h, ease);
      else if (c.role === "extra") drawExtraCard(c, theme, w, h, ease);
    }
    const primary = layout.cards.find((c) => c.role === "primary");
    if (primary) drawPrimaryCard(primary, theme, state, diag, w, h, ease);

    // 4. 离屏缓存：前景波浪形深藏青袋口与半调圆点（单次 drawImage）
    ensurePocketCache(w, h, state);
    ctx.drawImage(pocketLayer, 0, 0, w, h);

    // 5. 剖面透视与视线停顿动线（开启时）
    if (state.xray) drawXray(layout.host, layout.cards, state, diag, w, h, t);

    // 6. 底部实时书脊 Z 轴纸层剖面尺
    drawSpineCrossSection(layout, state, diag, w, h);

    ctx.restore();
  }

  const ctl = loop(canvas, render);

  // 指针交互：画布任意位置横向直拖抽拉主插页露出宽度，点击切换纸材/修腰斩/清冗余
  function localPt(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  const inRect = (pt, r) => r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    const pt = localPt(ev);
    dragging = true;
    moved = false;
    pointerId = ev.pointerId;
    downX = pt.x;
    downY = pt.y;
    startExposure = getState().exposure;
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {}
    canvas.classList.add("is-dragging");
    dirty = true;
    ctl.draw();
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!dragging || ev.pointerId !== pointerId) return;
    const pt = localPt(ev);
    const dx = pt.x - downX;
    const dy = pt.y - downY;
    if (!moved && Math.hypot(dx, dy) > 5) moved = true;
    if (!moved) return;

    const state = getState();
    const hostW = Math.max(160, cssW * 0.85);
    // 袋口从右侧抽出时：向左拉增宽、向右推进收窄；订口向右展开时：向右拉增宽
    const dir = state.anchor === "spine" ? 1 : -1;
    let nextExp = clamp(startExposure + (dx * dir) / hostW, 0.08, 0.94);
    // 靠近原海报经典露出宽 42% 时轻微吸附
    if (Math.abs(nextExp - 0.42) < 0.014) nextExp = 0.42;
    actions.setExposure(nextExp);
    dirty = true;
  });

  function endPointer(ev) {
    if (!dragging || ev.pointerId !== pointerId) return;
    const pt = localPt(ev);
    dragging = false;
    pointerId = null;
    canvas.classList.remove("is-dragging");
    if (!moved) {
      // 按 Z 序自顶向下命中：先最前红标 -> 再顶层主插页 -> 最后才露在外侧的冗余卡
      if (inRect(pt, hitZones.chopPill)) {
        actions.fixAutonomy();
      } else if (inRect(pt, hitZones.primary)) {
        actions.cycleStock();
      } else if (hitZones.extras.some((r) => inRect(pt, r))) {
        actions.trimClutter();
      }
    }
    dirty = true;
    ctl.draw();
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  // 键盘操作：←/→ 抽拉露出宽，1–4 切纸材，X 切剖面透视
  canvas.addEventListener("keydown", (ev) => {
    const step = ev.shiftKey ? 0.08 : 0.04;
    let handled = true;
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      actions.setExposure(clamp(getState().exposure - step, 0.08, 0.94));
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      actions.setExposure(clamp(getState().exposure + step, 0.08, 0.94));
    } else if (["1", "2", "3", "4"].includes(ev.key)) {
      const order = ["flat", "citrine", "vellum", "navy"];
      actions.setStock(order[Number(ev.key) - 1]);
    } else if (ev.key === "x" || ev.key === "X") {
      actions.toggleXray();
    } else {
      handled = false;
    }
    if (handled) {
      dirty = true;
      ctl.draw();
    }
  });

  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
    destroy() {
      ro.disconnect();
    },
  };
}
