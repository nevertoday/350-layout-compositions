// 开场蓝图工作台：纯 2D Canvas 高分屏绘制，配色与几何语汇直接承袭 268 号海报
// 深蓝主内容区 (#132760) + 浅豆绿辅助窗格 (#e8f0db) + 底部星号 px 标尺 + 折叠虚线轮廓
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { REF_VIEWPORT_PX, SCENARIOS, SWEET_AUX_PX, SWEET_RATIO, clamp } from "./model.js";

const C = {
  navy: "#132760",
  navyDeep: "#0e1e4d",
  navyCard: "#243773",
  navyCardHi: "#344b8f",
  sage: "#e8f0db",
  sageSoft: "rgba(232, 240, 219, 0.16)",
  ink: "#12214b",
  inkSoft: "#42537e",
  warn: "#f0c96e",
};

const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = typeof r === "number" ? [r, r, r, r] : r;
  const [tl, tr, br, bl] = rr.map((v) => Math.min(v, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function drawIcon(ctx, key, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.3, s * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (key === "filter") {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.55, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.14, cy + s * 0.04);
    ctx.lineTo(cx + s * 0.14, cy + s * 0.5);
    ctx.lineTo(cx - s * 0.14, cy + s * 0.36);
    ctx.lineTo(cx - s * 0.14, cy + s * 0.04);
    ctx.closePath();
    ctx.stroke();
  } else if (key === "tags") {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.45, cy - s * 0.05);
    ctx.lineTo(cx + s * 0.05, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.48, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.48, cy - s * 0.05);
    ctx.lineTo(cx - s * 0.02, cy + s * 0.48);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * 0.22, cy - s * 0.24, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (key === "notes") {
    roundRectPath(ctx, cx - s * 0.42, cy - s * 0.48, s * 0.84, s * 0.96, s * 0.14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, cy - s * 0.14);
    ctx.lineTo(cx + s * 0.2, cy - s * 0.14);
    ctx.moveTo(cx - s * 0.2, cy + s * 0.14);
    ctx.lineTo(cx + s * 0.12, cy + s * 0.14);
    ctx.stroke();
  } else if (key === "tips") {
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.1, s * 0.32, Math.PI * 0.8, Math.PI * 0.2, false);
    ctx.lineTo(cx + s * 0.16, cy + s * 0.36);
    ctx.lineTo(cx - s * 0.16, cy + s * 0.36);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.12, cy + s * 0.5);
    ctx.lineTo(cx + s * 0.12, cy + s * 0.5);
    ctx.stroke();
  } else if (key === "relation") {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    roundRectPath(ctx, -s * 0.54, -s * 0.2, s * 0.52, s * 0.4, s * 0.2);
    ctx.stroke();
    roundRectPath(ctx, s * 0.02, -s * 0.2, s * 0.52, s * 0.4, s * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.16, 0);
    ctx.lineTo(s * 0.16, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// 绘制海报底部的 8 角星号 * 分界标记
function drawStarburst(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

export function createHero(canvas, stageEl, state, onLayout) {
  const ctx = canvas.getContext("2d");
  let w = 640;
  let h = 420;
  let dpr = 1;

  // 开场缓动：从 14%（约 200 px）平滑落至 360 px（25%），任何时刻构图都完整
  let enter = reducedMotion.matches ? 1 : 0;
  let dispRatio = reducedMotion.matches ? (state.collapsed ? 0 : state.auxPx / REF_VIEWPORT_PX) : 0.14;
  let filterBlend = state.filterOn ? 1 : 0;

  let hitZones = [];
  let frameGeom = { fx: 16, fy: 14, fw: 608, fh: 320, splitX: 460, rulerY: 368 };

  const dotTile = document.createElement("canvas");
  dotTile.width = 28;
  dotTile.height = 28;
  const dotCtx = dotTile.getContext("2d");
  dotCtx.fillStyle = "rgba(232, 240, 219, 0.08)";
  dotCtx.fillRect(14, 14, 1.2, 1.2);
  const dotPattern = ctx.createPattern(dotTile, "repeat");

  function resize() {
    const r = stageEl.getBoundingClientRect();
    w = Math.max(260, Math.round(r.width));
    h = Math.max(200, Math.round(r.height));
    dpr = pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function drawMainContent(fx, fy, mainW, fh, scen, focusIdx, fBlend, t, anchors) {
    const pad = clamp(mainW * 0.06, 10, 24);
    const ix = fx + pad;
    const iw = Math.max(40, mainW - pad * 2);
    const compact = mainW < 235;
    const shortH = fh < 210;

    // 顶部概览头：还原海报左上浅豆绿圆 + 三道横条
    const topY = fy + pad * (shortH ? 0.72 : 0.9);
    const headH = clamp(fh * (shortH ? 0.18 : 0.21), 30, 66);
    const radius = clamp(Math.min(headH * 0.44, iw * 0.11), 11, 26);

    ctx.save();
    ctx.beginPath();
    ctx.arc(ix + radius, topY + headH * 0.5, radius, 0, Math.PI * 2);
    ctx.fillStyle = C.sage;
    ctx.fill();
    if (fBlend > 0.05) {
      ctx.beginPath();
      ctx.arc(ix + radius, topY + headH * 0.5, radius * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 2;
      ctx.globalAlpha = fBlend * 0.75;
      ctx.stroke();
    }
    ctx.restore();

    const bx = ix + radius * 2 + clamp(iw * 0.055, 9, 20);
    const bw = Math.max(24, ix + iw - bx);
    const barH = clamp(headH * 0.14, 4, 7.5);
    const gapY = clamp(headH * 0.25, 8, 15);
    const by0 = topY + headH * 0.5 - gapY - barH * 0.5;
    const widths = [1.0, 0.74, 0.44];
    ctx.fillStyle = C.sage;
    widths.forEach((mul, i) => {
      const targetW = bw * (i === 1 ? lerp(mul, 0.9, fBlend) : mul);
      ctx.globalAlpha = i === 2 ? 0.7 : 0.95;
      roundRectPath(ctx, bx, by0 + i * gapY, Math.max(12, targetW), barH, 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 中间主卡片：索引 0 为整卡，索引 1 为卡片内的可点击热点（数据拐点 / 术语句 / 锚点 / 开关）
    const midY = topY + headH + clamp(fh * 0.05, 7, 16);
    const midH = clamp(fh * (shortH ? 0.4 : 0.38), 58, 134);
    const isFocus0 = focusIdx === 0;
    const isFocus1 = focusIdx === 1;
    roundRectPath(ctx, ix, midY, iw, midH, 8);
    ctx.fillStyle = isFocus0 || isFocus1 ? C.navyCardHi : C.navyCard;
    ctx.fill();
    if (isFocus0) {
      ctx.strokeStyle = C.sage;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else if (isFocus1) {
      ctx.strokeStyle = "rgba(232, 240, 219, 0.55)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    hitZones.push({ x: ix, y: midY, w: iw, h: midH, kind: "main", idx: 0 });
    anchors.main[0] = { x: ix + iw - 10, y: midY + midH * 0.36 };
    anchors.main[1] = { x: ix + iw * 0.65, y: midY + midH * 0.5 };

    const padIn = clamp(iw * 0.055, 8, 18);
    const pulse = reducedMotion.matches ? 0 : 0.5 + 0.5 * Math.sin(t * 2.6);

    if (scen.id === "analysis") {
      const s = scen.series[0];
      const pts = s.all.map((v, i) => lerp(v, s.filtered[i], fBlend));
      ctx.strokeStyle = "rgba(232, 240, 219, 0.14)";
      ctx.lineWidth = 1;
      for (let g = 1; g <= 2; g++) {
        const gy = midY + (midH * g) / 3;
        ctx.beginPath();
        ctx.moveTo(ix + padIn, gy);
        ctx.lineTo(ix + iw - padIn, gy);
        ctx.stroke();
      }
      ctx.beginPath();
      const stepX = (iw - padIn * 2) / (pts.length - 1);
      pts.forEach((v, i) => {
        const px = ix + padIn + i * stepX;
        const py = midY + midH - padIn - v * (midH - padIn * 2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = C.sage;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // 可直接点击的 4 月拐点数据点（idx = 1）
      const hi = 4;
      const hx = ix + padIn + hi * stepX;
      const hy = midY + midH - padIn - pts[hi] * (midH - padIn * 2);
      ctx.beginPath();
      ctx.arc(hx, hy, (isFocus1 ? 9 : 6) + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = isFocus1 ? "rgba(240, 201, 110, 0.3)" : "rgba(232, 240, 219, 0.24)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy, isFocus1 ? 5.2 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isFocus1 ? C.warn : C.sage;
      ctx.fill();
      if (isFocus1) {
        ctx.strokeStyle = C.navyDeep;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      anchors.main[1] = { x: hx, y: hy };
      hitZones.push({ x: hx - 22, y: hy - 22, w: 44, h: 44, kind: "main", idx: 1 });
    } else if (scen.id === "browsing") {
      const lines = [0.92, 0.96, 0.78, 0.94, 0.65];
      const lh = (midH - padIn * 2) / lines.length;
      lines.forEach((mul, i) => {
        const ly = midY + padIn + i * lh + lh * 0.25;
        const isQuote = i === 2;
        if (isQuote) {
          const qw = (iw - padIn * 2) * mul + 8;
          const qh = Math.max(12, lh * 0.72);
          ctx.fillStyle = isFocus1 ? "rgba(240, 201, 110, 0.26)" : "rgba(232, 240, 219, 0.22)";
          roundRectPath(ctx, ix + padIn - 4, ly - 4, qw, qh, 3);
          ctx.fill();
          if (isFocus1) {
            ctx.strokeStyle = C.warn;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
          anchors.main[1] = { x: ix + padIn + qw - 6, y: ly + qh * 0.35 };
          hitZones.push({ x: ix + padIn - 6, y: ly - 8, w: qw + 12, h: qh + 12, kind: "main", idx: 1 });
        }
        ctx.fillStyle = isQuote ? C.sage : `rgba(232, 240, 219, ${lerp(0.58, 0.28, fBlend)})`;
        roundRectPath(ctx, ix + padIn, ly, (iw - padIn * 2) * mul, Math.max(4, lh * 0.28), 2);
        ctx.fill();
      });
    } else if (scen.id === "creation") {
      const boxW = (iw - padIn * 2) * lerp(0.56, 0.72, fBlend);
      const boxH = (midH - padIn * 2) * 0.68;
      const ox = ix + (iw - boxW) * 0.5;
      const oy = midY + (midH - boxH) * 0.5;
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(232, 240, 219, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix + iw * 0.5, midY + 4);
      ctx.lineTo(ix + iw * 0.5, midY + midH - 4);
      ctx.stroke();
      ctx.restore();
      roundRectPath(ctx, ox, oy, boxW, boxH, 4);
      ctx.fillStyle = "rgba(232, 240, 219, 0.2)";
      ctx.fill();
      ctx.strokeStyle = C.sage;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = C.sage;
      for (const [cx, cy] of [[ox, oy], [ox + boxW, oy], [ox, oy + boxH], [ox + boxW, oy + boxH]]) {
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
      }
      // 右上锚点可单独点击（idx = 1）
      const ax = ox + boxW;
      const ay = oy;
      ctx.beginPath();
      ctx.arc(ax, ay, (isFocus1 ? 7 : 5) + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = isFocus1 ? "rgba(240, 201, 110, 0.35)" : "rgba(232, 240, 219, 0.26)";
      ctx.fill();
      ctx.fillStyle = isFocus1 ? C.warn : C.sage;
      ctx.fillRect(ax - 3.5, ay - 3.5, 7, 7);
      anchors.main[1] = { x: ax, y: ay };
      hitZones.push({ x: ax - 20, y: ay - 20, w: 40, h: 40, kind: "main", idx: 1 });
    } else {
      const rows = 3;
      const rh = (midH - padIn * 2) / rows;
      for (let i = 0; i < rows; i++) {
        const ry = midY + padIn + i * rh + rh * 0.5;
        const isHot = i === 1;
        if (isHot && isFocus1) {
          roundRectPath(ctx, ix + padIn - 4, ry - rh * 0.42, iw - padIn * 2 + 8, rh * 0.84, 5);
          ctx.fillStyle = "rgba(240, 201, 110, 0.16)";
          ctx.fill();
          ctx.strokeStyle = C.warn;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.fillStyle = isHot ? C.sage : "rgba(232, 240, 219, 0.62)";
        roundRectPath(ctx, ix + padIn, ry - 3, (iw - padIn * 2) * (isHot ? 0.52 : 0.44), 6, 2);
        ctx.fill();
        const tw = 24, th = 12;
        const tx = ix + iw - padIn - tw;
        const on = i !== 2 || fBlend > 0.5;
        roundRectPath(ctx, tx, ry - th / 2, tw, th, th / 2);
        ctx.fillStyle = on ? (isHot && isFocus1 ? C.warn : C.sage) : "rgba(232, 240, 219, 0.22)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(on ? tx + tw - 6 : tx + 6, ry, 4, 0, Math.PI * 2);
        ctx.fillStyle = on ? C.navy : C.sage;
        ctx.fill();
        if (isHot) {
          anchors.main[1] = { x: tx + tw, y: ry };
          hitZones.push({ x: ix + padIn - 4, y: ry - rh * 0.45, w: iw - padIn * 2 + 8, h: rh * 0.9, kind: "main", idx: 1 });
        }
      }
    }

    // 底部三张小卡：还原海报的「柱图 + 文本条 + 饼图」三联卡片（idx 2 = 柱图，idx 3 = 饼图/右侧卡）
    const botY = midY + midH + clamp(fh * 0.045, 6, 14);
    const botH = Math.max(32, fy + fh - pad * (shortH ? 0.72 : 0.9) - botY);
    const cardGap = clamp(iw * 0.04, 6, 12);
    const cols = compact ? 2 : 3;
    const cardW = (iw - cardGap * (cols - 1)) / cols;

    for (let c = 0; c < cols; c++) {
      const cx = ix + c * (cardW + cardGap);
      const mappedIdx = c === 0 ? 2 : 3;
      const focused = focusIdx === mappedIdx && (c === 0 || c === cols - 1);
      roundRectPath(ctx, cx, botY, cardW, botH, 7);
      ctx.fillStyle = focused ? C.navyCardHi : C.navyCard;
      ctx.fill();
      if (focused) {
        ctx.strokeStyle = C.sage;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      hitZones.push({ x: cx, y: botY, w: cardW, h: botH, kind: "main", idx: mappedIdx });
      if (c === 0 || c === cols - 1) {
        anchors.main[mappedIdx] = { x: cx + cardW * 0.85, y: botY + botH * 0.45 };
      }

      const cp = clamp(Math.min(cardW, botH) * 0.14, 4, 13);
      if (c === 0) {
        const bars = SCENARIOS.analysis.series[1];
        const bw2 = Math.max(4, (cardW - cp * 2 - 8) / 3);
        const availH = Math.max(12, botH - cp * 2);
        for (let b = 0; b < 3; b++) {
          const val = lerp(bars.barsAll[b], bars.barsFiltered[b], fBlend);
          const bh = Math.max(4, availH * val);
          ctx.fillStyle = C.sage;
          ctx.globalAlpha = b === 2 ? 1 : 0.84;
          roundRectPath(ctx, cx + cp + b * (bw2 + 4), botY + botH - cp - bh, bw2, bh, 1.5);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (c === 1 && cols === 3) {
        const lw = [0.95, 0.78, 0.5];
        const availH = Math.max(12, botH - cp * 2);
        const step = availH / 3;
        const lh = clamp(step * 0.44, 2.4, 4.5);
        ctx.fillStyle = C.sage;
        lw.forEach((m, i) => {
          ctx.globalAlpha = i === 0 ? 0.96 : 0.74;
          roundRectPath(ctx, cx + cp, botY + cp + i * step + (step - lh) * 0.5, (cardW - cp * 2) * m, lh, 1.5);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      } else {
        const r = Math.min(cardW, botH) * 0.31;
        const px = cx + cardW * 0.5;
        const py = botY + botH * 0.5;
        const pieSpan = lerp(0.72, 0.85, fBlend) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, r, 0, pieSpan);
        ctx.closePath();
        ctx.fillStyle = C.sage;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + 2, py - 2);
        ctx.arc(px + 2, py - 2, r * 0.9, pieSpan + 0.08, Math.PI * 2 - 0.08);
        ctx.closePath();
        ctx.fillStyle = "rgba(232, 240, 219, 0.45)";
        ctx.fill();
      }
    }
  }

  function drawAuxPane(splitX, fy, auxW, fh, scen, activeAuxKey, anchors) {
    if (auxW < 2) {
      const ghostW = Math.min(54, frameGeom.fw * 0.14);
      const gx = frameGeom.fx + frameGeom.fw - ghostW - 10;
      const gy = fy + 10;
      const gh = fh - 20;
      ctx.save();
      ctx.setLineDash([5, 5]);
      roundRectPath(ctx, gx, gy, ghostW, gh, 8);
      ctx.strokeStyle = "rgba(232, 240, 219, 0.48)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(232, 240, 219, 0.82)";
      ctx.font = `700 11px "Manrope", "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("折叠", gx + ghostW / 2, gy + gh / 2 - 8);
      ctx.fillText("OPEN", gx + ghostW / 2, gy + gh / 2 + 8);
      ctx.restore();
      hitZones.push({ x: gx, y: gy, w: ghostW, h: gh, kind: "uncollapse" });
      return;
    }

    ctx.save();
    roundRectPath(ctx, splitX, fy, auxW, fh, [0, 14, 14, 0]);
    ctx.fillStyle = C.sage;
    ctx.fill();
    ctx.clip();

    const simAuxPx = Math.round((auxW / Math.max(1, frameGeom.fw)) * REF_VIEWPORT_PX);
    if (simAuxPx > 560) {
      ctx.fillStyle = C.warn;
      ctx.fillRect(splitX, fy, auxW, 5);
    }

    const items = scen.auxItems;
    const tightAux = auxW < 116;
    const padX = tightAux ? 5 : clamp(auxW * 0.075, 6, 14);
    const padY = clamp(fh * 0.045, 7, 15);
    const rowH = (fh - padY * 2 - 8) / items.length;
    const showText = auxW >= 74;
    const showDesc = auxW >= 140;
    const iconS = tightAux ? clamp(rowH * 0.34, 10, 12.5) : clamp(Math.min(rowH * 0.4, auxW * 0.19), 11, 16);

    items.forEach((item, i) => {
      const ry = fy + padY + i * rowH + (i >= 3 ? 8 : 0);
      const rh = rowH - 3;
      const isSelected = activeAuxKey === item.key || (item.key === "filter" && state.filterOn);

      if (i === 3) {
        ctx.strokeStyle = "rgba(18, 33, 75, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(splitX + padX, ry - 4);
        ctx.lineTo(splitX + auxW - padX, ry - 4);
        ctx.stroke();
      }

      if (isSelected) {
        roundRectPath(ctx, splitX + padX - 3, ry + 1, auxW - padX * 2 + 6, rh - 2, 6);
        ctx.fillStyle = "rgba(19, 39, 96, 0.13)";
        ctx.fill();
      }
      if (item.dashed) {
        ctx.save();
        ctx.setLineDash([4, 3]);
        roundRectPath(ctx, splitX + padX - 3, ry + 1, auxW - padX * 2 + 6, rh - 2, 6);
        ctx.strokeStyle = isSelected ? C.navy : "rgba(18, 33, 75, 0.46)";
        ctx.lineWidth = isSelected ? 1.5 : 1.1;
        ctx.stroke();
        ctx.restore();
      }

      const icx = showText ? splitX + padX + iconS * 0.62 : splitX + auxW * 0.5;
      const icy = ry + rh * 0.5;
      drawIcon(ctx, item.key, icx, icy, iconS, C.ink);

      anchors.aux[item.key] = { x: splitX + 4, y: icy };

      if (showText) {
        const tx = icx + iconS * (tightAux ? 0.92 : 1.06);
        const maxTextW = Math.max(24, splitX + auxW - tx - 5);
        ctx.fillStyle = C.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const zhSize = clamp(rowH * 0.26, 11.5, 13.5);
        ctx.font = `700 ${zhSize}px "Noto Sans SC", sans-serif`;
        ctx.fillText(item.zh, tx, icy - 7.5, maxTextW);

        ctx.fillStyle = C.inkSoft;
        ctx.font = `600 11px "Manrope", "Noto Sans SC", sans-serif`;
        ctx.fillText(showDesc ? item.desc : item.en, tx, icy + 8.5, maxTextW);
      }

      if (item.interactive) {
        hitZones.push({ x: splitX + 4, y: ry, w: auxW - 8, h: rh, kind: "aux", key: item.key });
      }
    });

    ctx.restore();
  }

  function drawConnectionLines(anchors, focusIdx, activeAuxKey, t) {
    if (dispRatio < 0.05) return;
    const src = anchors.main[focusIdx] || anchors.main[0];
    const dst = anchors.aux[activeAuxKey] || anchors.aux.notes;
    if (!src || !dst) return;

    ctx.save();
    ctx.globalAlpha = 0.92;
    const midX = (src.x + dst.x) * 0.5;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.bezierCurveTo(midX, src.y, midX, dst.y, dst.x, dst.y);
    ctx.strokeStyle = focusIdx === 1 ? C.warn : C.sage;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    if (!reducedMotion.matches) ctx.lineDashOffset = -t * 18;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = focusIdx === 1 ? C.warn : C.sage;
    ctx.beginPath();
    ctx.arc(src.x, src.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(dst.x, dst.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = C.navy;
    ctx.strokeStyle = focusIdx === 1 ? C.warn : C.sage;
    ctx.lineWidth = 1.6;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.restore();
  }

  function drawRuler(fx, fy, fw, fh, splitX, auxRatio) {
    const compactH = h < 275;
    const ry = fy + fh + (compactH ? 18 : 34);
    const auxPx = auxRatio < 0.01 ? 0 : Math.round(auxRatio * REF_VIEWPORT_PX);
    const mainPx = REF_VIEWPORT_PX - auxPx;
    const auxPct = Math.round(auxRatio * 100);
    const mainPct = 100 - auxPct;
    const sweetX = fx + fw * (1 - SWEET_RATIO);

    ctx.save();
    // 360 px 推荐吸附点小三角标记
    ctx.fillStyle = "rgba(232, 240, 219, 0.78)";
    ctx.beginPath();
    ctx.moveTo(sweetX, ry - 7);
    ctx.lineTo(sweetX - 4.5, ry - 13);
    ctx.lineTo(sweetX + 4.5, ry - 13);
    ctx.closePath();
    ctx.fill();

    if (!compactH) {
      ctx.font = `700 11px "Manrope", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(232, 240, 219, 0.74)";
      ctx.fillText(`${SWEET_AUX_PX}px`, sweetX, ry - 15);
    }

    // 虚线水平标尺（致敬海报底部标尺）
    ctx.strokeStyle = "rgba(232, 240, 219, 0.65)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([2.5, 3.5]);
    ctx.beginPath();
    ctx.moveTo(fx + 2, ry);
    ctx.lineTo(fx + fw - 2, ry);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = C.sage;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx + 1, ry - 6);
    ctx.lineTo(fx + 1, ry + 6);
    ctx.moveTo(fx + 7, ry - 3.5);
    ctx.lineTo(fx + 2, ry);
    ctx.lineTo(fx + 7, ry + 3.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fx + fw - 1, ry - 6);
    ctx.lineTo(fx + fw - 1, ry + 6);
    ctx.moveTo(fx + fw - 7, ry - 3.5);
    ctx.lineTo(fx + fw - 2, ry);
    ctx.lineTo(fx + fw - 7, ry + 3.5);
    ctx.stroke();

    drawStarburst(ctx, clamp(splitX, fx + 12, fx + fw - 12), ry, 6, C.sage);

    const mainMid = fx + (splitX - fx) * 0.5;
    const auxMid = splitX + (fx + fw - splitX) * 0.5;
    const labelY = ry + (compactH ? 9 : 11);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    if (splitX - fx > 96) {
      ctx.fillStyle = C.sage;
      ctx.font = `700 ${compactH ? 11.5 : 12.5}px "Manrope", "Noto Sans SC", sans-serif`;
      ctx.fillText(`主区弹性 ${mainPx} px`, mainMid, labelY);
      if (!compactH) {
        ctx.fillStyle = "rgba(232, 240, 219, 0.72)";
        ctx.font = `600 11px "Manrope", "Noto Sans SC", sans-serif`;
        ctx.fillText(`MAIN FLUID · ${mainPct}%`, mainMid, labelY + 18);
      }
    }

    if (fx + fw - splitX > 82) {
      const auxLabelX = Math.min(auxMid, fx + fw - 40);
      ctx.fillStyle = auxPx > 560 || (auxPx > 0 && auxPx < 260) ? C.warn : C.sage;
      ctx.font = `700 ${compactH ? 11.5 : 12.5}px "Manrope", "Noto Sans SC", sans-serif`;
      ctx.fillText(`辅助 ${auxPx} px`, auxLabelX, labelY);
      if (!compactH) {
        ctx.fillStyle = "rgba(232, 240, 219, 0.72)";
        ctx.font = `600 11px "Manrope", "Noto Sans SC", sans-serif`;
        ctx.fillText(`AUX · 占 ${auxPct}%`, auxLabelX, labelY + 18);
      }
    } else {
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(232, 240, 219, 0.84)";
      ctx.font = `700 11.5px "Manrope", "Noto Sans SC", sans-serif`;
      ctx.fillText(auxPx === 0 ? "已折叠 0 px" : `${auxPx} px`, fx + fw, labelY);
    }
    ctx.restore();
    return ry;
  }

  function render(t, dt, { still }) {
    const targetRatio = state.collapsed ? 0 : state.auxPx / REF_VIEWPORT_PX;
    const targetFilter = state.filterOn ? 1 : 0;

    if (still) {
      enter = 1;
      dispRatio = targetRatio;
      filterBlend = targetFilter;
    } else {
      enter = Math.min(1, enter + (dt || 0.016) / 0.68);
      const eRatio = enter < 1 ? lerp(0.14, targetRatio, easeOut(enter)) : targetRatio;
      const k = dt > 0 ? 1 - Math.exp(-(state.dragging ? 34 : 15) * dt) : 0.45;
      dispRatio += (eRatio - dispRatio) * k;
      filterBlend += (targetFilter - filterBlend) * k;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, w, h);

    if (dotPattern) {
      ctx.fillStyle = dotPattern;
      ctx.fillRect(0, 0, w, h);
    }

    const compactH = h < 275;
    const padX = clamp(w * 0.03, 10, 20);
    const padTop = compactH ? 8 : 10;
    const rulerReserve = compactH ? 46 : 80;
    const fx = padX;
    const fy = padTop;
    const fw = w - padX * 2;
    const fh = Math.max(136, h - padTop - rulerReserve);

    const auxW = fw * dispRatio;
    const mainW = fw - auxW;
    const splitX = fx + mainW;

    hitZones = [];
    const anchors = { main: {}, aux: {} };
    const scen = SCENARIOS[state.scenario] || SCENARIOS.analysis;

    roundRectPath(ctx, fx, fy, fw, fh, 14);
    ctx.fillStyle = C.navyDeep;
    ctx.fill();

    drawMainContent(fx, fy, mainW, fh, scen, state.focusIdx, filterBlend, t, anchors);
    drawAuxPane(splitX, fy, auxW, fh, scen, state.activeAux, anchors);
    drawConnectionLines(anchors, state.focusIdx, state.activeAux, t);

    roundRectPath(ctx, fx, fy, fw, fh, 14);
    ctx.strokeStyle = C.sage;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    if (auxW >= 2) {
      ctx.beginPath();
      ctx.moveTo(splitX, fy + 2);
      ctx.lineTo(splitX, fy + fh - 2);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const rulerY = drawRuler(fx, fy, fw, fh, splitX, dispRatio);

    frameGeom = { fx, fy, fw, fh, splitX, rulerY };
    onLayout(frameGeom);
  }

  resize();
  new ResizeObserver(() => {
    resize();
    ctrl.draw();
  }).observe(stageEl);

  const ctrl = loop(stageEl, render);

  return {
    draw: () => ctrl.draw(),
    geom: () => frameGeom,
    hitTest(lx, ly) {
      for (let i = hitZones.length - 1; i >= 0; i--) {
        const z = hitZones[i];
        if (lx >= z.x && lx <= z.x + z.w && ly >= z.y && ly <= z.y + z.h) return z;
      }
      return null;
    },
  };
}
