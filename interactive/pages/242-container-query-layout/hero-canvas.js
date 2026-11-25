// 242 开场同屏三槽组件自治实验室 · 2D Canvas 渲染与直接拖拽
// 1:1 承袭 242 原海报深靛紫底、三阶翠绿圆角容器框、顶部虚线双向测宽箭、暖米组件卡、翠绿双峰日光图与姜黄按钮。

import { loop, pixelRatio } from "../../lib/stage.js";
import { MAX_SLOT_W, MIN_SLOT_W, clampSlotW } from "./model.js";

const C = {
  bg: "#180A3F",
  bgDeep: "#110630",
  grid: "rgba(240, 233, 222, 0.07)",
  mint: "#67C89D",
  mintDim: "rgba(103, 200, 157, 0.34)",
  mintSoft: "rgba(103, 200, 157, 0.14)",
  cream: "#EFE8DE",
  creamSoft: "#E3DACD",
  ink: "#190C42",
  inkSoft: "#4B4169",
  gold: "#F2BD38",
  goldDim: "rgba(242, 189, 56, 0.45)",
  err: "#FF7E75",
  errFill: "rgba(255, 126, 117, 0.18)",
  errDark: "#9E1F2A",
  white: "#F5F0E6",
};

function rrect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawDashedArrow(ctx, x1, x2, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1 + 7, y);
  ctx.lineTo(x2 - 7, y);
  ctx.stroke();
  ctx.setLineDash([]);
  // 左箭头
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 + 6, y - 3.5);
  ctx.lineTo(x1 + 6, y + 3.5);
  ctx.closePath();
  ctx.fill();
  // 右箭头
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 6, y - 3.5);
  ctx.lineTo(x2 - 6, y + 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 复刻原海报左侧三枚虚线容器图标（小/中/大）
function drawLeftSlotIcon(ctx, x, y, size, idx, active, color) {
  ctx.save();
  ctx.strokeStyle = active ? C.white : "rgba(240, 233, 222, 0.72)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  const w = idx === 0 ? size * 0.78 : idx === 1 ? size * 0.94 : size * 1.14;
  const h = size * 0.72;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.7;
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (idx === 0) {
    // 向下箭头（原海报小容器图标）
    ctx.beginPath();
    ctx.moveTo(cx, y + 5);
    ctx.lineTo(cx, y + h - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + h - 10);
    ctx.lineTo(cx, y + h - 5);
    ctx.lineTo(cx + 4, y + h - 10);
    ctx.stroke();
  } else {
    // 双向水平箭头（原海报中/大容器图标）
    const pad = idx === 2 ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(x + pad, cy);
    ctx.lineTo(x + w - pad, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + pad + 4, cy - 3.5);
    ctx.lineTo(x + pad, cy);
    ctx.lineTo(x + pad + 4, cy + 3.5);
    ctx.moveTo(x + w - pad - 4, cy - 3.5);
    ctx.lineTo(x + w - pad, cy);
    ctx.lineTo(x + w - pad - 4, cy + 3.5);
    ctx.stroke();
    if (idx === 2) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 6);
      ctx.lineTo(x + 4, y + h - 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 绘制原海报同款卡片主配图（山峰日光 / 手冲壶 / 漏斗柱图）
function drawCardArt(ctx, x, y, w, h, artType) {
  ctx.save();
  rrect(ctx, x, y, w, h, 5);
  ctx.clip();
  ctx.fillStyle = C.mint;
  ctx.fillRect(x, y, w, h);

  if (artType === "mountain") {
    // 原海报标志：左上米圆日 + 深靛双山峰
    const sunR = Math.max(4.5, Math.min(w, h) * 0.14);
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.arc(x + w * 0.31, y + h * 0.28, sunR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.04, y + h);
    ctx.lineTo(x + w * 0.36, y + h * 0.50);
    ctx.lineTo(x + w * 0.56, y + h * 0.72);
    ctx.lineTo(x + w * 0.74, y + h * 0.36);
    ctx.lineTo(x + w * 0.98, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (artType === "kettle") {
    // 几何手冲壶侧影
    const cx = x + w * 0.5;
    const cy = y + h * 0.56;
    const bw = Math.min(w * 0.42, h * 0.56);
    const bh = bw * 0.88;
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.arc(x + w * 0.28, y + h * 0.26, Math.max(4, bw * 0.17), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.46, cy + bh * 0.48);
    ctx.lineTo(cx - bw * 0.32, cy - bh * 0.42);
    ctx.lineTo(cx + bw * 0.32, cy - bh * 0.42);
    ctx.lineTo(cx + bw * 0.46, cy + bh * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(2, bw * 0.11);
    ctx.lineCap = "round";
    // 鹅颈壶嘴
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.36, cy + bh * 0.22);
    ctx.quadraticCurveTo(cx - bw * 0.78, cy + bh * 0.14, cx - bw * 0.72, cy - bh * 0.46);
    ctx.stroke();
    // 壶柄
    ctx.beginPath();
    ctx.moveTo(cx + bw * 0.34, cy - bh * 0.26);
    ctx.quadraticCurveTo(cx + bw * 0.76, cy - bh * 0.16, cx + bw * 0.52, cy + bh * 0.32);
    ctx.stroke();
  } else {
    // 极简数据柱图 + 趋势折线
    const pad = Math.max(6, w * 0.12);
    const bars = [0.36, 0.62, 0.48, 0.84, 0.72];
    const bw = (w - pad * 2 - 12) / bars.length;
    ctx.fillStyle = C.ink;
    bars.forEach((v, i) => {
      const bh = (h - pad * 2) * v;
      ctx.fillRect(x + pad + i * (bw + 3), y + h - pad - bh, bw, bh);
    });
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    bars.forEach((v, i) => {
      const px = x + pad + i * (bw + 3) + bw / 2;
      const py = y + h - pad - (h - pad * 2) * v - 5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  ctx.restore();
}

// 绘制原海报同款三枚翠绿圆形数据图标（柱状/饼图/人像剪影，绝无五官）
function drawMetricBadge(ctx, x, y, r, iconType) {
  ctx.save();
  ctx.fillStyle = C.mint;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.cream;
  if (iconType === "bars") {
    const bw = r * 0.26;
    ctx.fillRect(x - r * 0.48, y + r * 0.02, bw, r * 0.44);
    ctx.fillRect(x - r * 0.13, y - r * 0.34, bw, r * 0.80);
    ctx.fillRect(x + r * 0.22, y - r * 0.14, bw, r * 0.60);
  } else if (iconType === "pie") {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r * 0.62, -Math.PI * 0.5, Math.PI * 0.15);
    ctx.closePath();
    ctx.fill();
  } else {
    // 简洁人像剪影（无五官）
    ctx.beginPath();
    ctx.arc(x, y - r * 0.24, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + r * 0.52, r * 0.45, Math.PI * 1.15, Math.PI * 1.85);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 轻量级字符宽估算（避免每帧上百次 ctx.measureText 拖慢慢手机 / SwiftShader 软件渲染）
function estWidth(text, size) {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    w += text.charCodeAt(i) > 0x2e80 ? size * 1.02 : size * 0.64;
  }
  return w;
}

function clipText(ctx, text, maxW, size = 11) {
  if (maxW <= 12) return "…";
  if (estWidth(text, size) <= maxW) return text;
  let w = 0;
  let end = 0;
  const lim = maxW - size * 0.9;
  for (let i = 0; i < text.length; i++) {
    w += text.charCodeAt(i) > 0x2e80 ? size * 1.02 : size * 0.64;
    if (w > lim) break;
    end = i + 1;
  }
  return text.slice(0, Math.max(1, end)) + "…";
}

function wrapLines(ctx, text, maxW, maxLines, size = 11) {
  const lines = [];
  let cur = "";
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const cw = text.charCodeAt(i) > 0x2e80 ? size * 1.02 : size * 0.58;
    if (w + cw > maxW && cur.length > 0) {
      lines.push(cur);
      if (lines.length >= maxLines) {
        lines[maxLines - 1] = clipText(ctx, lines[maxLines - 1], maxW - size * 0.5, size);
        return lines;
      }
      cur = ch;
      w = cw;
    } else {
      cur += ch;
      w += cw;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

export function mountHeroCanvas(canvas, getState, getEval, onChange) {
  const ctx = canvas.getContext("2d");
  const visW = [270, 470, 680];
  let intro = 0;
  let hoverRow = -1;
  let dragInfo = null; // { row, startX, startW, moved, pointerId }
  let layoutCache = null;
  let dirty = true;
  let cssW = 0;
  let cssH = 0;

  function measureSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(260, Math.round(rect.height));
    if (w !== cssW || h !== cssH) {
      cssW = w;
      cssH = h;
      dirty = true;
    }
  }
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(measureSize).observe(canvas);
  }
  measureSize();

  function computeLayout(W, H) {
    const narrow = W < 580;
    const topBand = narrow ? 28 : 32;
    const botPad = narrow ? 16 : 20;
    const leftCol = narrow ? 12 : 148;
    const rightPad = narrow ? 16 : 24;
    const trackX = leftCol;
    const trackW = Math.max(180, W - trackX - rightPad);
    const scale = trackW / MAX_SLOT_W;
    const availH = H - topBand - botPad;
    const rowGap = 14;
    const weights = narrow ? [0.29, 0.34, 0.37] : [0.27, 0.34, 0.39];
    const usableH = availH - rowGap * 2;
    const rows = [];
    let cy = topBand;
    for (let i = 0; i < 3; i++) {
      const rh = Math.floor(usableH * weights[i]);
      rows.push({ y: cy, h: rh });
      cy += rh + rowGap;
    }
    return { W, H, narrow, topBand, leftCol, trackX, trackW, scale, rows };
  }

  function syncBackingStore() {
    if (!cssW || !cssH) measureSize();
    const w = cssW || 360;
    const h = cssH || 390;
    const dpr = pixelRatio(w < 640 ? 1.5 : 2);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: w, H: h };
  }

  function render(t, dt, { still }) {
    const state = getState();
    let animating = false;

    if (still) {
      if (intro < 1) { intro = 1; dirty = true; }
      for (let i = 0; i < 3; i++) {
        if (visW[i] !== state.slots[i].w) { visW[i] = state.slots[i].w; dirty = true; }
      }
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + (dt || 0.016) * 2.4);
        animating = true;
      }
      const k = 1 - Math.exp(-(dt || 0.016) * 18);
      for (let i = 0; i < 3; i++) {
        const target = state.slots[i].w;
        const diff = target - visW[i];
        if (Math.abs(diff) >= 0.4) {
          visW[i] += diff * (dragInfo && dragInfo.row === i ? 0.75 : k);
          animating = true;
        } else if (visW[i] !== target) {
          visW[i] = target;
          dirty = true;
        }
      }
    }

    if (!dirty && !animating) return;
    dirty = false;

    const ev = getEval();
    const { W, H } = syncBackingStore();
    const L = computeLayout(W, H);
    layoutCache = L;

    // 1. 深靛底与工程测宽刻度网
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // 顶沿视口锁定标尺条
    ctx.fillStyle = C.bgDeep;
    ctx.fillRect(0, 0, W, L.topBand - 4);
    ctx.strokeStyle = "rgba(103, 200, 157, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, L.topBand - 4);
    ctx.lineTo(W, L.topBand - 4);
    ctx.stroke();

    // 标尺刻度和视口锁死徽章
    ctx.font = `700 ${L.narrow ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = C.cream;
    ctx.textBaseline = "middle";
    const vpText = L.narrow
      ? `视口锁死 ${state.viewportW}px · 拖右柄调槽宽`
      : `视口锁死 ${state.viewportW}px · 拖任意容器右侧翠绿墙`;
      const vpTextRight = 12 + estWidth(vpText, L.narrow ? 10 : 11) + 18;
    ctx.fillText(vpText, 12, (L.topBand - 4) / 2);

    // 刻度线（200 / 400 / 600 / 760px）——文字绝不撞左标题
    const ticks = [200, 400, 600, 760];
    ctx.font = `400 10px "Space Mono", monospace`;
    for (const pxVal of ticks) {
      const tx = L.trackX + pxVal * L.scale;
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, L.topBand);
      ctx.lineTo(tx, H - 6);
      ctx.stroke();
      const lbl = `${pxVal}px`;
      const lblW = estWidth(lbl, 10);
      if (tx - lblW - 4 > vpTextRight && (!L.narrow || pxVal !== 760)) {
        ctx.fillStyle = "rgba(240, 233, 222, 0.5)";
        ctx.textAlign = "right";
        ctx.fillText(lbl, tx - 3, (L.topBand - 4) / 2);
      }
    }
    ctx.textAlign = "left";

    // 2. 垂直门槛参考虚线（M 翠绿 / L 姜黄；异常时红）
    const g = ev.theme.geom;
    const drawThresholdGuide = (pxVal, label, baseColor, valid) => {
      const gx = L.trackX + clampSlotW(pxVal) * L.scale;
      const col = valid ? baseColor : C.err;
      ctx.save();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, L.topBand + 1);
      ctx.lineTo(gx, H - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      // 底部门槛标牌
      const tagText = `${label} ${pxVal}`;
      ctx.font = `700 10px "Space Mono", monospace`;
      const tw = estWidth(tagText, 10) + 12;
      const bx = Math.max(L.trackX, Math.min(W - tw - 6, gx - tw / 2));
      const by = H - 18;
      rrect(ctx, bx, by, tw, 15, 3);
      ctx.fillStyle = valid ? C.bgDeep : C.errDark;
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = valid ? col : C.white;
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, bx + 5, by + 7.5);
      ctx.restore();
    };

    const mOk = state.bpM >= g.safeM[0] && state.bpM <= g.safeM[1] && state.bpM < state.bpL;
    const lOk = state.bpL >= g.safeL[0] && state.bpL <= g.safeL[1] && state.bpL - state.bpM >= g.minGap;
    // 在背景画一条很淡的几何安全带提示（让用户懂为什么 M/L 有合理区间）
    if (state.queryMode === "container" && state.containerType === "inline-size") {
      ctx.save();
      ctx.fillStyle = "rgba(103, 200, 157, 0.05)";
      ctx.fillRect(L.trackX + g.safeM[0] * L.scale, L.topBand, (g.safeM[1] - g.safeM[0]) * L.scale, H - L.topBand - 20);
      ctx.fillStyle = "rgba(242, 189, 56, 0.045)";
      ctx.fillRect(L.trackX + g.safeL[0] * L.scale, L.topBand, (g.safeL[1] - g.safeL[0]) * L.scale, H - L.topBand - 20);
      ctx.restore();
    }
    drawThresholdGuide(state.bpM, "M", C.mint, mOk);
    drawThresholdGuide(state.bpL, "L", C.gold, lOk);

    // 3. 逐槽绘制三座容器与内部暖米组件卡
    for (let i = 0; i < 3; i++) {
      const slot = ev.slots[i];
      const row = L.rows[i];
      const isFocused = state.activeSlot === i;
      const isHover = hoverRow === i || (dragInfo && dragInfo.row === i);
      const isErr = slot.status === "error";
      const isWarn = slot.status === "warn";
      const frameColor = isErr ? C.err : isWarn ? C.gold : C.mint;

      const easeIn = Math.min(1, Math.max(0, (intro - i * 0.12) / 0.72));
      const boxW = Math.max(106, visW[i] * L.scale * (0.86 + 0.14 * easeIn));
      const boxX = L.trackX;
      const boxY = row.y;
      const boxH = row.h;

      // 桌面左侧：原海报图标 + 小/中/大容器文案
      if (!L.narrow) {
        drawLeftSlotIcon(ctx, 14, boxY + 6, 30, i, isFocused, frameColor);
        ctx.fillStyle = isFocused ? C.white : C.cream;
        ctx.font = `900 15px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(slot.name, 14, boxY + 34);

        ctx.fillStyle = "rgba(240, 233, 222, 0.72)";
        ctx.font = `400 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(slot.role + " · " + slot.w + "px", 14, boxY + 54);

        // 状态短签
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = frameColor;
        ctx.fillText(clipText(ctx, slot.badge, 126), 14, boxY + 71);
      }

      // 容器外框（双轴塌陷时压扁成细缝！）
      const collapsed = slot.renderedTier === "COLLAPSE";
      const actualFrameH = collapsed ? Math.min(34, boxH * 0.36) : boxH;
      const frameY = collapsed ? boxY + (boxH - actualFrameH) * 0.45 : boxY;

      ctx.save();
      rrect(ctx, boxX, frameY, boxW, actualFrameH, 9);
      ctx.fillStyle = isFocused ? "rgba(103, 200, 157, 0.06)" : "rgba(17, 6, 48, 0.45)";
      ctx.fill();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = isFocused || isHover ? 2.2 : 1.6;
      if (collapsed) ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 顶部虚线测宽箭头 + 宽度/cqi 胶囊
      const arrowY = frameY + (L.narrow ? 10 : 12);
      drawDashedArrow(ctx, boxX + 8, boxX + boxW - 14, arrowY, frameColor);

      const pillTxt = L.narrow
        ? `${slot.name} ${slot.w}px · ${slot.renderedTier === "COLLAPSE" ? "塌陷0px" : slot.renderedTier}`
        : `${slot.w}px · 1cqi=${slot.cqiUnit}px · ${slot.renderedTier === "COLLAPSE" ? "height: 0px" : slot.renderedTier}`;
      const pillSize = L.narrow ? 9.5 : 10;
      ctx.font = `700 ${pillSize}px "Space Mono", "Noto Sans SC", monospace`;
      const pw = Math.min(boxW - 26, estWidth(pillTxt, pillSize) + 16);
      const px = boxX + (boxW - pw) / 2;
      rrect(ctx, px, arrowY - 7.5, pw, 15, 3);
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.fillStyle = frameColor;
      ctx.textBaseline = "middle";
      ctx.fillText(clipText(ctx, pillTxt, pw - 8, pillSize), px + 6, arrowY);

      // 绘制内部暖米组件卡（或双轴塌陷警报）
      const cardPadX = L.narrow ? 7 : 10;
      const cardX = boxX + cardPadX;
      const cardY = frameY + (L.narrow ? 20 : 23);
      const cardW = Math.max(84, boxW - cardPadX * 2 - 6);
      const cardH = Math.max(12, actualFrameH - (L.narrow ? 26 : 31));

      if (collapsed) {
        // 可视化呈现 container-type: size 塌陷：溢出残影 + 红色塌陷条
        ctx.save();
        rrect(ctx, cardX, frameY + actualFrameH + 2, cardW, Math.min(34, boxH - actualFrameH - 6), 5);
        ctx.fillStyle = "rgba(239, 232, 222, 0.16)";
        ctx.fill();
        ctx.strokeStyle = C.err;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.err;
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(
          clipText(ctx, "container-type: size 未定高 → 内容被压扁裁切", cardW - 14),
          cardX + 8,
          frameY + actualFrameH + 17
        );
        ctx.restore();
      } else {
        drawComponentCard(ctx, cardX, cardY, cardW, cardH, slot, ev.theme, L.narrow);
      }

      // 右侧可拖翠绿把手（高亮 + 直观双竖线）
      const handleX = boxX + boxW - 2;
      const handleH = Math.min(46, Math.max(24, actualFrameH * 0.56));
      const handleY = frameY + (actualFrameH - handleH) / 2;
      rrect(ctx, handleX - 6, handleY, 12, handleH, 6);
      ctx.fillStyle = isHover ? C.gold : frameColor;
      ctx.fill();
      // 把手中间双细杠
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(handleX - 2, handleY + handleH * 0.28);
      ctx.lineTo(handleX - 2, handleY + handleH * 0.72);
      ctx.moveTo(handleX + 2, handleY + handleH * 0.28);
      ctx.lineTo(handleX + 2, handleY + handleH * 0.72);
      ctx.stroke();
    }

    // 右下角简短操作提示（桌面）
    if (!L.narrow) {
      ctx.font = `400 10px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "rgba(240, 233, 222, 0.56)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("横拖任意容器翠绿边墙 · 方向键 ←/→ 微调聚焦槽宽", W - 14, H - 4);
      ctx.textAlign = "left";
    }
  }

  function drawComponentCard(ctx, x, y, w, h, slot, theme, narrow) {
    ctx.save();
    rrect(ctx, x, y, w, h, 7);
    ctx.fillStyle = C.cream;
    ctx.fill();
    // 严格裁切在卡片内部，绝不让任何图标或字飞到卡片外的深紫背景上
    ctx.clip();

    const overflow = slot.overflowPx > 0;
    const tier = slot.renderedTier === "FALLBACK" ? "S" : slot.renderedTier;

    const pad = narrow ? 6 : 8;
    const innerX = x + pad;
    const innerY = y + pad;
    const innerW = Math.max(56, w - pad * 2);
    const innerH = Math.max(26, h - pad * 2);

    // 1. 配图区（严格保持等比比例，绝不压扁）
    const artFrac = tier === "L" ? 0.30 : tier === "M" ? 0.27 : 0.26;
    const maxArtW = tier === "L" ? innerH * 1.36 : tier === "M" ? innerH * 1.16 : innerH * 1.02;
    const artW = Math.max(26, Math.min(maxArtW, innerW * artFrac));
    const artH = Math.min(innerH, tier === "S" ? Math.min(innerH, artW * 0.96) : innerH);
    const artY = innerY + (innerH - artH) / 2;

    drawCardArt(ctx, innerX, artY, artW, artH, theme.art);

    // 2. 右侧信息区
    const colX = innerX + artW + (narrow ? 7 : 10);
    const colW = Math.max(24, innerX + innerW - colX);

    const titleSize = Math.max(10.5, Math.min(narrow ? 13.5 : 17.5, slot.titlePx * (narrow ? 0.66 : 0.85)));
    ctx.fillStyle = slot.issue === "vw-bloat" ? C.errDark : C.ink;
    ctx.font = `900 ${titleSize.toFixed(1)}px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(clipText(ctx, theme.title, colW, titleSize), colX, innerY);

    const bodyY = innerY + titleSize + (narrow ? 3 : 4);
    const bodySize = Math.max(9.5, Math.min(11.5, narrow ? 9.5 : 11));
    ctx.font = `400 ${bodySize}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = C.inkSoft;

    const ctaH = narrow ? 17 : 20;
    const ctaFont = narrow ? 9 : 10;
    const ctaW = Math.min(colW * (tier === "S" ? 0.72 : 0.44), narrow ? 64 : 78);
    const showMetrics = tier === "M" || tier === "L";

    if (!showMetrics) {
      const copyW = colW - (colW > 130 ? ctaW + 6 : 0);
      const maxLn = innerH > 54 ? 2 : 1;
      const lines = wrapLines(ctx, theme.copyShort, Math.max(36, copyW), maxLn);
      lines.forEach((ln, k) => ctx.fillText(ln, colX, bodyY + k * (bodySize + 3)));

      const btnX = innerX + innerW - ctaW;
      const btnY = innerY + innerH - ctaH;
      rrect(ctx, btnX, btnY, ctaW, ctaH, 4);
      ctx.fillStyle = C.gold;
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = `700 ${ctaFont}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(clipText(ctx, theme.cta, ctaW - 6, ctaFont), btnX + ctaW / 2, btnY + ctaH / 2);
      ctx.textAlign = "left";
    } else {
      // 平衡态 M / 展开态 L：高度紧张（如小容器被误塞 L 态）时避免正文撞上底部指标
      const footY = innerY + innerH - ctaH;
      const spaceForCopy = footY - bodyY - 3;
      if (spaceForCopy >= bodySize) {
        const copyStr = tier === "L" ? theme.copyLong : theme.copyShort;
        const maxLines = spaceForCopy >= bodySize * 2 + 5 ? 2 : 1;
        const lines = wrapLines(ctx, copyStr, Math.max(32, colW), maxLines);
        lines.forEach((ln, k) => ctx.fillText(ln, colX, bodyY + k * (bodySize + 3)));
      }

      const metricAreaW = Math.max(10, colW - ctaW - 6);
      const count = theme.metrics.length;
      const step = metricAreaW / count;
      const badgeR = Math.max(5.5, Math.min(tier === "L" ? 9.5 : 8.2, narrow ? 6 : 9));

      ctx.save();
      ctx.beginPath();
      ctx.rect(colX - 2, footY - 3, metricAreaW + 2, ctaH + 6);
      ctx.clip();

      theme.metrics.forEach((m, k) => {
        const mx = colX + k * (overflow ? Math.max(step, 52) : step);
        const cy = footY + ctaH / 2;
        if (k > 0 && !narrow && step >= 62) {
          ctx.strokeStyle = "rgba(25, 12, 66, 0.16)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mx - 4, footY + 2);
          ctx.lineTo(mx - 4, footY + ctaH - 2);
          ctx.stroke();
        }
        drawMetricBadge(ctx, mx + badgeR, cy, badgeR, m.icon);
        const textX = mx + badgeR * 2 + 3.5;
        const textAvail = Math.max(0, step - badgeR * 2 - 6);
        if (step >= 56 || overflow) {
          ctx.fillStyle = C.inkSoft;
          ctx.font = `400 ${narrow ? 8.5 : 9.5}px "Noto Sans SC", sans-serif`;
          ctx.textBaseline = "top";
          ctx.fillText(m.label, textX, footY + 0.5);
          ctx.fillStyle = C.ink;
          ctx.font = `700 ${narrow ? 9.5 : 10.5}px "Space Mono", sans-serif`;
          ctx.fillText(m.val, textX, footY + (narrow ? 9 : 10.5));
        } else if (textAvail >= 22) {
          // 窄屏紧凑展示：只显示精简数值，绝不互撞
          ctx.fillStyle = C.ink;
          ctx.font = `700 9.5px "Space Mono", sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(clipText(ctx, m.val, textAvail), textX, cy);
        }
      });
      ctx.restore();

      const btnX = innerX + innerW - ctaW;
      rrect(ctx, btnX, footY, ctaW, ctaH, 4);
      ctx.fillStyle = C.gold;
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = `700 ${ctaFont}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(clipText(ctx, theme.cta, ctaW - 6, ctaFont), btnX + ctaW / 2, footY + ctaH / 2);
      ctx.textAlign = "left";
    }

    // 若发生溢出，在右侧叠清晰的红条警示（绝不遮盖左侧标题起点）
    if (overflow) {
      const stripW = Math.min(w * 0.34, 84);
      ctx.save();
      ctx.fillStyle = "rgba(181, 35, 46, 0.92)";
      ctx.fillRect(x + w - stripW, y, stripW, h);
      ctx.fillStyle = C.white;
      ctx.font = `700 ${narrow ? 9.5 : 10.5}px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("挤爆", x + w - stripW / 2, y + h / 2 - 7);
      ctx.fillText(`+${slot.overflowPx}px`, x + w - stripW / 2, y + h / 2 + 7);
      ctx.restore();
    } else if (slot.issue === "late-starve" || slot.issue === "no-container") {
      const idleW = Math.max(36, w * 0.24);
      ctx.save();
      rrect(ctx, x + w - idleW - 4, y + 4, idleW, h - 8, 5);
      ctx.fillStyle = "rgba(242, 189, 56, 0.22)";
      ctx.fill();
      ctx.strokeStyle = "#825300";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#6B4200";
      ctx.font = `700 9.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(slot.issue === "no-container" ? "未响应" : "宽槽空置", x + w - idleW / 2 - 4, y + h / 2);
      ctx.restore();
    }

    ctx.restore();

    // 在 clip 外补画一道干净外描边
    if (overflow) {
      ctx.save();
      rrect(ctx, x, y, w, h, 7);
      ctx.strokeStyle = C.err;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 坐标命中测试：找到按下的容器行
  function hitRow(clientX, clientY) {
    if (!layoutCache) return 1;
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    for (let i = 0; i < 3; i++) {
      const r = layoutCache.rows[i];
      if (y >= r.y - 8 && y <= r.y + r.h + 8) return i;
    }
    return 1;
  }

  function pointerToSlotW(clientX) {
    if (!layoutCache) return 460;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    return clampSlotW((x - layoutCache.trackX) / layoutCache.scale);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    const row = hitRow(e.clientX, e.clientY);
    const state = getState();
    dragInfo = {
      row,
      startX: e.clientX,
      startW: state.slots[row].w,
      moved: false,
      pointerId: e.pointerId,
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    dirty = true;
    onChange({ activeSlot: row });
  }

  function onPointerMove(e) {
    if (!dragInfo) {
      const hr = hitRow(e.clientX, e.clientY);
      if (hr !== hoverRow) { hoverRow = hr; dirty = true; }
      canvas.style.cursor = "ew-resize";
      return;
    }
    if (!layoutCache) return;
    const dx = e.clientX - dragInfo.startX;
    if (Math.abs(dx) > 2) dragInfo.moved = true;
    const deltaSlotW = dx / layoutCache.scale;
    const nextW = clampSlotW(dragInfo.startW + deltaSlotW);
    dirty = true;
    onChange({ slotIndex: dragInfo.row, slotW: nextW, activeSlot: dragInfo.row });
  }

  function onPointerUp(e) {
    if (!dragInfo) return;
    // 若只是轻点容器轨道而非拖动，把该槽直接吸附到点击位置对应的宽度（便于快速测试）
    if (!dragInfo.moved && e.pointerType === "mouse") {
      const clickedW = pointerToSlotW(e.clientX);
      if (Math.abs(clickedW - dragInfo.startW) > 18) {
        dirty = true;
        onChange({ slotIndex: dragInfo.row, slotW: clickedW, activeSlot: dragInfo.row });
      }
    }
    try {
      canvas.releasePointerCapture(dragInfo.pointerId);
    } catch {}
    dragInfo = null;
    dirty = true;
  }

  function onPointerLeave() {
    if (hoverRow !== -1) { hoverRow = -1; dirty = true; }
  }

  function onKeyDown(e) {
    const state = getState();
    const idx = state.activeSlot;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.shiftKey ? 40 : 16;
      const nextW = clampSlotW(state.slots[idx].w + (e.key === "ArrowRight" ? step : -step));
      dirty = true;
      onChange({ slotIndex: idx, slotW: nextW });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (idx + (e.key === "ArrowDown" ? 1 : 2)) % 3;
      dirty = true;
      onChange({ activeSlot: nextIdx });
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("keydown", onKeyDown);

  const runner = loop(canvas, render);
  return {
    draw() {
      dirty = true;
      // 减少动态效果时主动补画一帧；正常模式交给 rAF 单次重绘，避免拖动时同帧双画
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) runner.draw();
    },
  };
}
