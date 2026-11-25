// 开场蓝图工作台：纯 2D Canvas 高分屏绘制，配色与几何语汇直接承袭 268 号海报
// 深蓝主内容区 (#132760) + 浅豆绿辅助窗格 (#e8f0db) + 底部星号标尺 (|<···*···>|) + 折叠虚线轮廓
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { SCENARIOS, SWEET_RATIO, clamp } from "./model.js";

const C = {
  navy: "#132760",
  navyDeep: "#0e1e4d",
  navyCard: "#2b3e79",
  navyCardHi: "#3a5092",
  navyStroke: "rgba(232, 240, 219, 0.32)",
  sage: "#e8f0db",
  sageDim: "#d5e1c3",
  sageSoft: "rgba(232, 240, 219, 0.16)",
  ink: "#12214b",
  inkSoft: "#42537e",
  warn: "#f0c96e",
  warnDim: "rgba(240, 201, 110, 0.25)",
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

  // 开场缓动：从 16% 平滑展开到 30%（0.72 秒落定，任何时刻构图都完整）
  let enter = reducedMotion.matches ? 1 : 0;
  let dispRatio = reducedMotion.matches ? (state.collapsed ? 0 : state.ratio) : 0.15;
  let filterBlend = state.filterOn ? 1 : 0;
  let linksBlend = state.showLinks ? 1 : 0;

  // 记录命中热区，供点击画布直接切换焦点或筛选
  let hitZones = [];
  let frameGeom = { fx: 16, fy: 18, fw: 608, fh: 320, splitX: 440, rulerY: 368 };

  function resize() {
    const r = stageEl.getBoundingClientRect();
    w = Math.max(260, Math.round(r.width));
    h = Math.max(240, Math.round(r.height));
    dpr = pixelRatio(2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function drawMainContent(fx, fy, mainW, fh, scen, focusIdx, fBlend, t, anchors) {
    const pad = clamp(mainW * 0.065, 10, 26);
    const ix = fx + pad;
    const iw = Math.max(40, mainW - pad * 2);
    const compact = mainW < 230;

    // 顶部概览头：还原海报左上浅豆绿圆 + 三道横条
    const topY = fy + pad;
    const headH = clamp(fh * 0.22, 42, 74);
    const radius = clamp(Math.min(headH * 0.44, iw * 0.12), 13, 30);

    // 图标圆
    ctx.save();
    ctx.beginPath();
    ctx.arc(ix + radius, topY + headH * 0.5, radius, 0, Math.PI * 2);
    ctx.fillStyle = C.sage;
    ctx.fill();
    // 内微环（体现聚焦或筛选状态）
    if (fBlend > 0.05) {
      ctx.beginPath();
      ctx.arc(ix + radius, topY + headH * 0.5, radius * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 2;
      ctx.globalAlpha = fBlend * 0.7;
      ctx.stroke();
    }
    ctx.restore();

    // 标题三横条（与海报主图一致）
    const bx = ix + radius * 2 + clamp(iw * 0.055, 10, 22);
    const bw = Math.max(24, ix + iw - bx);
    const barH = clamp(headH * 0.13, 5, 8);
    const gapY = clamp(headH * 0.24, 10, 16);
    const by0 = topY + headH * 0.5 - gapY - barH * 0.5;
    const widths = [1.0, 0.74, 0.42];
    ctx.fillStyle = C.sage;
    widths.forEach((mul, i) => {
      const targetW = bw * (i === 1 ? lerp(mul, 0.88, fBlend) : mul);
      ctx.globalAlpha = i === 2 ? 0.72 : 0.96;
      roundRectPath(ctx, bx, by0 + i * gapY, Math.max(12, targetW), barH, 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 中间主卡片：按不同场景画不同结构，默认「数据分析」完全致敬海报的折线图大块
    const midY = topY + headH + clamp(fh * 0.055, 10, 18);
    const midH = clamp(fh * 0.36, 72, 136);
    const isFocus0 = focusIdx === 0;
    roundRectPath(ctx, ix, midY, iw, midH, 8);
    ctx.fillStyle = isFocus0 ? C.navyCardHi : C.navyCard;
    ctx.fill();
    if (isFocus0) {
      ctx.strokeStyle = C.sage;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    hitZones.push({ x: ix, y: midY, w: iw, h: midH, kind: "main", idx: 0 });
    anchors.main[0] = { x: ix + iw - 8, y: midY + midH * 0.42 };

    // 场景内绘图
    const padIn = clamp(iw * 0.06, 8, 18);
    if (scen.id === "analysis") {
      const s = scen.series[0];
      const pts = s.all.map((v, i) => lerp(v, s.filtered[i], fBlend));
      // 细水平参考线
      ctx.strokeStyle = "rgba(232, 240, 219, 0.14)";
      ctx.lineWidth = 1;
      for (let g = 1; g <= 2; g++) {
        const gy = midY + (midH * g) / 3;
        ctx.beginPath();
        ctx.moveTo(ix + padIn, gy);
        ctx.lineTo(ix + iw - padIn, gy);
        ctx.stroke();
      }
      // 折线本体
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

      // 关键节点脉冲点（4月拐点）
      const hi = 4;
      const hx = ix + padIn + hi * stepX;
      const hy = midY + midH - padIn - pts[hi] * (midH - padIn * 2);
      const pulse = reducedMotion.matches ? 0 : 0.5 + 0.5 * Math.sin(t * 2.6);
      ctx.beginPath();
      ctx.arc(hx, hy, 5 + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 240, 219, 0.25)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = C.sage;
      ctx.fill();
      anchors.main[0] = { x: hx, y: hy };
    } else if (scen.id === "browsing") {
      // 清晰的文章排版行 + 高亮引文块
      const lines = [0.92, 0.96, 0.78, 0.94, 0.65];
      const lh = (midH - padIn * 2) / lines.length;
      lines.forEach((mul, i) => {
        const ly = midY + padIn + i * lh + lh * 0.25;
        const isQuote = i === 2;
        if (isQuote) {
          ctx.fillStyle = "rgba(232, 240, 219, 0.22)";
          roundRectPath(ctx, ix + padIn - 3, ly - 3, (iw - padIn * 2) * mul + 6, Math.max(8, lh * 0.52), 3);
          ctx.fill();
          anchors.main[0] = { x: ix + padIn + (iw - padIn * 2) * mul, y: ly + 2 };
        }
        ctx.fillStyle = isQuote ? C.sage : "rgba(232, 240, 219, 0.58)";
        roundRectPath(ctx, ix + padIn, ly, (iw - padIn * 2) * lerp(mul, mul * 0.94, fBlend), Math.max(4, lh * 0.28), 2);
        ctx.fill();
      });
    } else if (scen.id === "creation") {
      // 画布里的选中对象 + 四个控制角点 + 居中对齐参考线
      const boxW = (iw - padIn * 2) * lerp(0.56, 0.72, fBlend);
      const boxH = (midH - padIn * 2) * 0.68;
      const ox = ix + (iw - boxW) * 0.5;
      const oy = midY + (midH - boxH) * 0.5;
      // 十字虚线参考
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(232, 240, 219, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix + iw * 0.5, midY + 4);
      ctx.lineTo(ix + iw * 0.5, midY + midH - 4);
      ctx.stroke();
      ctx.restore();
      // 对象块
      roundRectPath(ctx, ox, oy, boxW, boxH, 4);
      ctx.fillStyle = "rgba(232, 240, 219, 0.22)";
      ctx.fill();
      ctx.strokeStyle = C.sage;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // 四角手柄
      ctx.fillStyle = C.sage;
      for (const [cx, cy] of [[ox, oy], [ox + boxW, oy], [ox, oy + boxH], [ox + boxW, oy + boxH]]) {
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
      }
      anchors.main[0] = { x: ox + boxW, y: oy + boxH * 0.5 };
    } else {
      // 设置管理：3 行策略开关
      const rows = 3;
      const rh = (midH - padIn * 2) / rows;
      for (let i = 0; i < rows; i++) {
        const ry = midY + padIn + i * rh + rh * 0.5;
        ctx.fillStyle = i === 1 ? C.sage : "rgba(232, 240, 219, 0.62)";
        roundRectPath(ctx, ix + padIn, ry - 3, (iw - padIn * 2) * (i === 1 ? 0.52 : 0.44), 6, 2);
        ctx.fill();
        // 开关胶囊
        const tw = 24, th = 12;
        const tx = ix + iw - padIn - tw;
        const on = i !== 2 || fBlend > 0.5;
        roundRectPath(ctx, tx, ry - th / 2, tw, th, th / 2);
        ctx.fillStyle = on ? C.sage : "rgba(232, 240, 219, 0.22)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(on ? tx + tw - 6 : tx + 6, ry, 4, 0, Math.PI * 2);
        ctx.fillStyle = on ? C.navy : C.sage;
        ctx.fill();
        if (i === 1) anchors.main[0] = { x: tx + tw, y: ry };
      }
    }

    // 底部三张小卡：还原海报的「柱图 + 文本条 + 饼图」三联卡片
    const botY = midY + midH + clamp(fh * 0.048, 8, 15);
    const botH = Math.max(40, fy + fh - pad - botY);
    const cardGap = clamp(iw * 0.04, 6, 12);
    const cols = compact ? 2 : 3;
    const cardW = (iw - cardGap * (cols - 1)) / cols;

    for (let c = 0; c < cols; c++) {
      const cx = ix + c * (cardW + cardGap);
      const focused = (c === 0 && focusIdx === 1) || (c === cols - 1 && focusIdx === 2);
      roundRectPath(ctx, cx, botY, cardW, botH, 7);
      ctx.fillStyle = focused ? C.navyCardHi : C.navyCard;
      ctx.fill();
      if (focused) {
        ctx.strokeStyle = C.sage;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      const mappedIdx = c === 0 ? 1 : 2;
      hitZones.push({ x: cx, y: botY, w: cardW, h: botH, kind: "main", idx: mappedIdx });
      anchors.main[mappedIdx] = { x: cx + cardW * 0.85, y: botY + botH * 0.45 };

      const cp = clamp(cardW * 0.14, 6, 14);
      if (c === 0) {
        // 3 根柱图
        const bars = SCENARIOS.analysis.series[1];
        const bw2 = Math.max(4, (cardW - cp * 2 - 8) / 3);
        for (let b = 0; b < 3; b++) {
          const val = lerp(bars.barsAll[b], bars.barsFiltered[b], fBlend);
          const bh = Math.max(8, (botH - cp * 2) * val);
          ctx.fillStyle = C.sage;
          ctx.globalAlpha = b === 2 ? 1 : 0.84;
          roundRectPath(ctx, cx + cp + b * (bw2 + 4), botY + botH - cp - bh, bw2, bh, 1.5);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (c === 1 && cols === 3) {
        // 三条进度/文字线
        const lw = [0.95, 0.78, 0.5];
        const step = (botH - cp * 2) / 3;
        ctx.fillStyle = C.sage;
        lw.forEach((m, i) => {
          ctx.globalAlpha = i === 0 ? 0.96 : 0.75;
          roundRectPath(ctx, cx + cp, botY + cp + i * step + step * 0.25, (cardW - cp * 2) * m, 5, 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      } else {
        // 缺口饼图（致敬海报右下角饼图）
        const r = Math.min(cardW, botH) * 0.31;
        const px = cx + cardW * 0.5;
        const py = botY + botH * 0.5;
        const pieSpan = lerp(0.72, 0.84, fBlend) * Math.PI * 2;
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
      // 折叠态：画出海报 TIP 里的虚线占位矩形，提示「可随时唤出」
      const ghostW = Math.min(54, frameGeom.fw * 0.14);
      const gx = frameGeom.fx + frameGeom.fw - ghostW - 10;
      const gy = fy + 10;
      const gh = fh - 20;
      ctx.save();
      ctx.setLineDash([5, 5]);
      roundRectPath(ctx, gx, gy, ghostW, gh, 8);
      ctx.strokeStyle = "rgba(232, 240, 219, 0.46)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(232, 240, 219, 0.72)";
      ctx.font = `600 10px "JetBrains Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("折叠", gx + ghostW / 2, gy + gh / 2 - 7);
      ctx.fillText("OPEN", gx + ghostW / 2, gy + gh / 2 + 8);
      ctx.restore();
      hitZones.push({ x: gx, y: gy, w: ghostW, h: gh, kind: "uncollapse" });
      return;
    }

    // 浅豆绿实体辅助窗格（右侧贴框圆角）
    ctx.save();
    roundRectPath(ctx, splitX, fy, auxW, fh, [0, 14, 14, 0]);
    ctx.fillStyle = C.sage;
    ctx.fill();
    ctx.clip();

    // 若过宽 (>42%)，顶部挂一条淡淡的警示色条
    const ratio = auxW / Math.max(1, frameGeom.fw);
    if (ratio > 0.42) {
      ctx.fillStyle = C.warn;
      ctx.fillRect(splitX, fy, auxW, 5);
    }

    const items = scen.auxItems;
    const padX = clamp(auxW * 0.08, 8, 16);
    const padY = clamp(fh * 0.055, 10, 18);
    const rowH = (fh - padY * 2 - 8) / items.length;
    const showText = auxW >= 96;
    const showDesc = auxW >= 158;
    const iconS = clamp(Math.min(rowH * 0.42, auxW * 0.22), 11, 18);

    items.forEach((item, i) => {
      const ry = fy + padY + i * rowH + (i >= 3 ? 8 : 0);
      const rh = rowH - 4;
      const isSelected = activeAuxKey === item.key || (item.key === "filter" && state.filterOn);

      // 第 3、4 项之间的水平分割线（致敬海报原图！）
      if (i === 3) {
        ctx.strokeStyle = "rgba(18, 33, 75, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(splitX + padX, ry - 4);
        ctx.lineTo(splitX + auxW - padX, ry - 4);
        ctx.stroke();
      }

      // 选中底色或海报同款「关联」虚线框
      if (isSelected) {
        roundRectPath(ctx, splitX + padX - 4, ry + 1, auxW - padX * 2 + 8, rh - 2, 6);
        ctx.fillStyle = "rgba(19, 39, 96, 0.12)";
        ctx.fill();
      }
      if (item.dashed) {
        ctx.save();
        ctx.setLineDash([4, 3]);
        roundRectPath(ctx, splitX + padX - 4, ry + 1, auxW - padX * 2 + 8, rh - 2, 6);
        ctx.strokeStyle = isSelected ? C.navy : "rgba(18, 33, 75, 0.48)";
        ctx.lineWidth = isSelected ? 1.5 : 1.1;
        ctx.stroke();
        ctx.restore();
      }

      const icx = showText ? splitX + padX + iconS * 0.72 : splitX + auxW * 0.5;
      const icy = ry + rh * 0.5;
      drawIcon(ctx, item.key, icx, icy, iconS, C.ink);

      anchors.aux[item.key] = { x: splitX + 4, y: icy };

      if (showText) {
        const tx = icx + iconS * 1.15;
        ctx.fillStyle = C.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${clamp(rowH * 0.27, 11, 13.5)}px "Noto Sans SC", sans-serif`;
        ctx.fillText(item.zh, tx, showDesc ? icy - 8 : icy - 5);

        ctx.fillStyle = C.inkSoft;
        ctx.font = `600 9.5px "JetBrains Mono", monospace`;
        ctx.fillText(showDesc ? item.desc : item.en, tx, showDesc ? icy + 8 : icy + 8);
      }

      if (item.interactive) {
        hitZones.push({ x: splitX + 4, y: ry, w: auxW - 8, h: rh, kind: "aux", key: item.key });
      }
    });

    ctx.restore();
  }

  function drawConnectionLines(anchors, focusIdx, activeAuxKey, blend, t) {
    if (blend < 0.02 || dispRatio < 0.06) return;
    const src = anchors.main[focusIdx] || anchors.main[0];
    const targetKeys = focusIdx === 0 ? ["notes", "filter"] : focusIdx === 1 ? ["filter", "relation"] : ["tags", "relation"];
    const primaryKey = anchors.aux[activeAuxKey] ? activeAuxKey : targetKeys[0];
    const dst = anchors.aux[primaryKey];
    if (!src || !dst) return;

    ctx.save();
    ctx.globalAlpha = blend * 0.92;
    const midX = (src.x + dst.x) * 0.5;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.bezierCurveTo(midX, src.y, midX, dst.y, dst.x, dst.y);
    ctx.strokeStyle = C.sage;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    if (!reducedMotion.matches) ctx.lineDashOffset = -t * 18;
    ctx.stroke();
    ctx.setLineDash([]);

    // 起点圆 ● 与 终点菱形 ◆（致敬海报底部四图形！）
    ctx.fillStyle = C.sage;
    ctx.beginPath();
    ctx.arc(src.x, src.y, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(dst.x, dst.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = C.navy;
    ctx.strokeStyle = C.sage;
    ctx.lineWidth = 1.6;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.restore();
  }

  function drawRuler(fx, fy, fw, fh, splitX, auxRatio) {
    const ry = fy + fh + 22;
    const auxPct = Math.round(auxRatio * 100);
    const mainPct = 100 - auxPct;
    const sweetX = fx + fw * (1 - SWEET_RATIO);

    ctx.save();
    // 推荐 30% 刻度小三角标记
    ctx.fillStyle = "rgba(232, 240, 219, 0.52)";
    ctx.beginPath();
    ctx.moveTo(sweetX, ry - 9);
    ctx.lineTo(sweetX - 4, ry - 15);
    ctx.lineTo(sweetX + 4, ry - 15);
    ctx.closePath();
    ctx.fill();

    // 虚线水平标尺（完全致敬海报底部标尺！）
    ctx.strokeStyle = "rgba(232, 240, 219, 0.65)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([2.5, 3.5]);
    ctx.beginPath();
    ctx.moveTo(fx + 2, ry);
    ctx.lineTo(fx + fw - 2, ry);
    ctx.stroke();
    ctx.setLineDash([]);

    // 两端建筑标尺端线 |< 和 >|
    ctx.strokeStyle = C.sage;
    ctx.lineWidth = 1.4;
    // 左端
    ctx.beginPath();
    ctx.moveTo(fx + 1, ry - 7);
    ctx.lineTo(fx + 1, ry + 7);
    ctx.moveTo(fx + 8, ry - 4);
    ctx.lineTo(fx + 2, ry);
    ctx.lineTo(fx + 8, ry + 4);
    ctx.stroke();
    // 右端
    ctx.beginPath();
    ctx.moveTo(fx + fw - 1, ry - 7);
    ctx.lineTo(fx + fw - 1, ry + 7);
    ctx.moveTo(fx + fw - 8, ry - 4);
    ctx.lineTo(fx + fw - 2, ry);
    ctx.lineTo(fx + fw - 8, ry + 4);
    ctx.stroke();

    // 分界处的 8 角星号 *
    drawStarburst(ctx, clamp(splitX, fx + 12, fx + fw - 12), ry, 6.5, C.sage);

    // 下方中英双语刻度标签
    const mainMid = fx + (splitX - fx) * 0.5;
    const auxMid = splitX + (fx + fw - splitX) * 0.5;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    if (splitX - fx > 88) {
      ctx.fillStyle = C.sage;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillText(`主内容区 ${mainPct}%`, mainMid, ry + 11);
      ctx.fillStyle = "rgba(232, 240, 219, 0.68)";
      ctx.font = `600 9.5px "JetBrains Mono", monospace`;
      ctx.fillText("MAIN CONTENT", mainMid, ry + 27);
    }

    if (fx + fw - splitX > 76) {
      ctx.fillStyle = auxPct > 42 ? C.warn : C.sage;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillText(`辅助窗格 ${auxPct}%`, auxMid, ry + 11);
      ctx.fillStyle = "rgba(232, 240, 219, 0.68)";
      ctx.font = `600 9.5px "JetBrains Mono", monospace`;
      ctx.fillText("AUXILIARY PANE", auxMid, ry + 27);
    } else {
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(232, 240, 219, 0.72)";
      ctx.font = `600 10.5px "JetBrains Mono", "Noto Sans SC", monospace`;
      ctx.fillText(auxPct === 0 ? "已折叠 0%" : `${auxPct}%`, fx + fw, ry + 12);
    }
    ctx.restore();
    return ry;
  }

  function render(t, dt, { still }) {
    resize();
    const targetRatio = state.collapsed ? 0 : state.ratio;
    const targetFilter = state.filterOn ? 1 : 0;
    const targetLinks = state.showLinks ? 1 : 0;

    if (still) {
      enter = 1;
      dispRatio = targetRatio;
      filterBlend = targetFilter;
      linksBlend = targetLinks;
    } else {
      enter = Math.min(1, enter + (dt || 0.016) / 0.7);
      const eRatio = enter < 1 ? lerp(0.14, targetRatio, easeOut(enter)) : targetRatio;
      const k = dt > 0 ? 1 - Math.exp(-(state.dragging ? 34 : 15) * dt) : 0.45;
      dispRatio += (eRatio - dispRatio) * k;
      filterBlend += (targetFilter - filterBlend) * k;
      linksBlend += (targetLinks - linksBlend) * k;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 深蓝海报底色
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, w, h);

    // 极轻的建筑蓝图微格点（增加精密制图感，不喧闹）
    ctx.fillStyle = "rgba(232, 240, 219, 0.08)";
    const step = 28;
    for (let gx = 14; gx < w; gx += step) {
      for (let gy = 14; gy < h; gy += step) {
        ctx.fillRect(gx, gy, 1.2, 1.2);
      }
    }

    const padX = clamp(w * 0.035, 10, 22);
    const padTop = 14;
    const rulerReserve = 66;
    const fx = padX;
    const fy = padTop;
    const fw = w - padX * 2;
    const fh = Math.max(150, h - padTop - rulerReserve);

    const auxW = fw * dispRatio;
    const mainW = fw - auxW;
    const splitX = fx + mainW;

    hitZones = [];
    const anchors = { main: {}, aux: {} };
    const scen = SCENARIOS[state.scenario] || SCENARIOS.analysis;

    // 外主框底色
    roundRectPath(ctx, fx, fy, fw, fh, 14);
    ctx.fillStyle = C.navyDeep;
    ctx.fill();

    // 画主内容区与辅助窗格
    drawMainContent(fx, fy, mainW, fh, scen, state.focusIdx, filterBlend, t, anchors);
    drawAuxPane(splitX, fy, auxW, fh, scen, state.activeAux, anchors);

    // 联动路径
    drawConnectionLines(anchors, state.focusIdx, state.activeAux, linksBlend, t);

    // 外框 Crisp 豆绿细描边（致敬海报主图外框）
    roundRectPath(ctx, fx, fy, fw, fh, 14);
    ctx.strokeStyle = C.sage;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 分界竖线
    if (auxW >= 2) {
      ctx.beginPath();
      ctx.moveTo(splitX, fy + 2);
      ctx.lineTo(splitX, fy + fh - 2);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 底部建筑标尺
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
