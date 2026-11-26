// 300 组件级响应布局 · 2D Canvas 渲染模块（零 shadowBlur，软件渲染稳 60fps）
// 包含：1) 开场「一页双槽活体组件分轨台」；2) 03 节「遏制切断循环依赖」因果图解画布。

import { VIEWPORT_W, SLOTS_TOTAL_W, SPLIT_MIN, SPLIT_MAX, clamp } from "./model.js";

const PALETTE = {
  bgDeep: "#150A3F",
  panelBg: "#1D114D",
  slotBg: "#26195E",
  slotBorder: "#564891",
  slotBorderOk: "#69B58C",
  slotBorderBad: "#E86676",
  slotBorderWarn: "#C7A652",
  cardPaper: "#EFE9E4",
  cardInk: "#170A3F",
  cardSub: "#544975",
  mint: "#97D8B0",
  mintDark: "#569577",
  mintText: "#14093B",
  lavender: "#9B7FE8",
  lavenderBright: "#C5B4FF",
  lavenderMuted: "#BEB4DC",
  coral: "#FF7B87",
  coralDark: "#9E1B32",
  amber: "#F2C76E",
  cream: "#F3EFEA",
  dimText: "#C7C0DD",
  lineSoft: "rgba(181, 168, 224, 0.24)",
  stripeBad: "rgba(255, 118, 134, 0.16)",
};

const FONT_ZH = '"Noto Sans SC", system-ui, sans-serif';
const FONT_EN = '"Space Grotesk", "Noto Sans SC", sans-serif';
const FONT_MONO = '"IBM Plex Mono", monospace';

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, fill, stroke, lineW = 1) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
  }
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawMountainCard(ctx, x, y, w, h, r) {
  fillRoundRect(ctx, x, y, w, h, r, PALETTE.mint);
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  // 大山与副峰（1:1 复刻 300 原海报）
  ctx.fillStyle = PALETTE.mintDark;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.90);
  ctx.lineTo(x + w * 0.42, y + h * 0.48);
  ctx.lineTo(x + w * 0.66, y + h * 0.78);
  ctx.lineTo(x + w * 0.77, y + h * 0.65);
  ctx.lineTo(x + w * 0.93, y + h * 0.90);
  ctx.closePath();
  ctx.fill();
  // 太阳圆点
  const sunR = clamp(Math.min(w, h) * 0.11, 3.5, 11);
  ctx.beginPath();
  ctx.arc(x + w * 0.64, y + h * 0.34, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSparkline(ctx, x, y, w, h) {
  const pts = [
    [0.0, 0.85],
    [0.2, 0.56],
    [0.4, 0.70],
    [0.62, 0.34],
    [0.8, 0.50],
    [1.0, 0.12],
  ];
  ctx.strokeStyle = PALETTE.cardInk;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  pts.forEach(([u, v], idx) => {
    const px = x + u * w;
    const py = y + v * h;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = PALETTE.cardInk;
  for (const [u, v] of pts) {
    ctx.beginPath();
    ctx.arc(x + u * w, y + v * h, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBarMini(ctx, x, y, w, h, seed = 0) {
  const vals = seed === 0 ? [0.35, 0.62, 0.44, 0.92, 0.58] : [0.32, 0.58, 0.42, 0.95, 0.64];
  const gap = Math.max(2, w * 0.06);
  const bw = Math.max(2.5, (w - gap * (vals.length - 1)) / vals.length);
  ctx.fillStyle = PALETTE.lavender;
  vals.forEach((v, i) => {
    const bh = Math.max(3, h * v);
    fillRoundRect(ctx, x + i * (bw + gap), y + h - bh, bw, bh, 1.5, PALETTE.lavender);
  });
}

function drawEyeIcon(ctx, cx, cy, s) {
  ctx.strokeStyle = PALETTE.cardInk;
  ctx.fillStyle = PALETTE.cardInk;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy);
  ctx.quadraticCurveTo(cx, cy - s * 0.78, cx + s, cy);
  ctx.quadraticCurveTo(cx, cy + s * 0.78, cx - s, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function drawBookmarkIcon(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.lavender;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w * 0.5, y + h * 0.74);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawOverflowHazard(ctx, x, y, w, h, overflowPx) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.fillStyle = PALETTE.stripeBad;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255, 123, 135, 0.36)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let d = -h; d < w + h; d += 14) {
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = PALETTE.coral;
  ctx.lineWidth = 1.6;
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.restore();

  const tag = w < 90 ? `+${overflowPx}px` : w < 138 ? `溢出 +${overflowPx}` : `挤爆溢出 +${overflowPx}px`;
  ctx.font = `600 10px ${FONT_MONO}`;
  const boxW = Math.min(ctx.measureText(tag).width + 12, Math.max(36, w - 8));
  const tx = x + Math.max(4, w - boxW - 4);
  const ty = y + h - 22;
  fillRoundRect(ctx, tx, ty, boxW, 18, 4, PALETTE.coralDark);
  ctx.save();
  roundRectPath(ctx, tx, ty, boxW, 18, 4);
  ctx.clip();
  ctx.fillStyle = "#FFF5F6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tag, tx + boxW / 2, ty + 9.5);
  ctx.restore();
}

// 绘制单个组件卡片（案例一：信息卡片）
function drawCardComponent(ctx, box, slot, state, scale) {
  const { x, y, w, h } = box;
  const pad = Math.max(7, Math.round(slot.pad * scale));
  fillRoundRect(ctx, x, y, w, h, 12, PALETTE.cardPaper);

  const innerX = x + pad;
  const innerY = y + pad;
  const innerW = Math.max(30, w - pad * 2);
  const innerH = Math.max(40, h - pad * 2);

  ctx.save();
  roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, 10);
  ctx.clip();

  if (slot.mode === "wide") {
    // 宽态：左图右文（原海报案例一左图）
    const imgW = Math.max(30, Math.round(innerW * 0.38));
    const gap = Math.max(6, Math.round(12 * scale));
    const textX = innerX + imgW + gap;
    const realTextW = Math.max(36, innerW - imgW - gap);
    // 仅在真正爆框溢出时按强撑宽绘出裁切效果；正常宽态严格适应 realTextW 绝不裁字
    const drawTextW = slot.overflowPx > 0 ? Math.max(realTextW, 146 * scale) : realTextW;

    const imgH = Math.min(innerH, Math.max(52, innerH * 0.92));
    const imgY = innerY + (innerH - imgH) * 0.5;
    drawMountainCard(ctx, innerX, imgY, imgW, imgH, 7);

    // 按可用高度等比纵向分配四段元素，确保矮画布（如 844x390 横屏）绝不重叠
    const compactH = innerH < 118;
    const titleH = compactH ? 7 : clamp(11 * scale, 8, 12);
    const barY = imgY + (compactH ? 2 : 4);
    fillRoundRect(ctx, textX, barY, drawTextW * 0.80, titleH, 4, PALETTE.lavender);

    const headingY = barY + titleH + (compactH ? 4 : 6);
    const headingSize = compactH ? 10 : clamp(12 * scale, 9.5, 13);
    ctx.fillStyle = PALETTE.cardInk;
    ctx.font = `700 ${headingSize}px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(realTextW < 105 ? "卡片单元" : "设计系统 · 卡片单元", textX, headingY);

    const lineY = headingY + headingSize + (compactH ? 5 : 7);
    fillRoundRect(ctx, textX, lineY, drawTextW * 0.90, compactH ? 4.5 : 5.5, 2.5, PALETTE.lavenderMuted);
    if (!compactH) {
      fillRoundRect(ctx, textX, lineY + 10, drawTextW * 0.66, 5.5, 2.5, PALETTE.lavenderMuted);
    }

    const btnH = compactH ? 16 : 19;
    const btnY = imgY + imgH - btnH;
    const starY = Math.min(btnY - (compactH ? 10 : 14), lineY + (compactH ? 14 : 26));
    const starR = compactH ? 4.4 : clamp(6 * scale, 4.5, 6.8);
    for (let i = 0; i < 4; i++) {
      drawStar(ctx, textX + starR + i * (starR * 2.45), starY, starR, PALETTE.mintDark);
    }

    const btnGap = realTextW < 120 ? 3 : Math.max(4, Math.round(6 * scale));
    const btnW = Math.max(slot.overflowPx > 0 ? 36 : 22, (drawTextW - btnGap * 2) / 3);
    const labels = ["查看", "收藏", "复用"];
    for (let i = 0; i < 3; i++) {
      const bx = textX + i * (btnW + btnGap);
      fillRoundRect(ctx, bx, btnY, btnW, btnH, 4, PALETTE.lavender);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 ${realTextW < 115 ? 8.5 : clamp(10 * scale, 8.5, 10.5)}px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[i], bx + btnW / 2, btnY + btnH / 2 + 0.5);
    }
  } else {
    // 窄态：上图下文（原海报案例一右图），支持测试 flipOrder 与 dropInfo 错态
    const isFlipped = state.flipOrder;
    const isDropped = state.dropInfo;
    const btnH = 18;
    const btnGap = 5;
    const btnW = Math.max(22, (innerW - btnGap * 2) / 3);
    const labels = ["查看", "收藏", "复用"];

    let cursorY = innerY;

    const drawButtons = (by) => {
      if (isDropped) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        fillRoundRect(ctx, innerX, by, innerW, btnH, 4, "rgba(255,123,135,0.12)", PALETTE.coral, 1.2);
        ctx.restore();
        ctx.fillStyle = PALETTE.coralDark;
        ctx.font = `600 9.5px ${FONT_ZH}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 操作与评分已被隐藏", innerX + innerW / 2, by + btnH / 2);
        return;
      }
      for (let i = 0; i < 3; i++) {
        const bx = innerX + i * (btnW + btnGap);
        fillRoundRect(ctx, bx, by, btnW, btnH, 4, isFlipped ? PALETTE.coral : PALETTE.lavender);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 9.5px ${FONT_ZH}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[i], bx + btnW / 2, by + btnH / 2 + 0.5);
      }
    };

    if (isFlipped) {
      drawButtons(cursorY);
      cursorY += btnH + 8;
    }

    const imgH = clamp(innerH * 0.42, 46, 94);
    drawMountainCard(ctx, innerX, cursorY, innerW, imgH, 7);
    cursorY += imgH + 9;

    // 标题与正文条
    ctx.fillStyle = PALETTE.cardInk;
    ctx.font = `700 ${clamp(11.5 * scale, 9.5, 12.5)}px ${FONT_ZH}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("设计系统 · 卡片单元", innerX, cursorY);
    cursorY += 16;

    fillRoundRect(ctx, innerX, cursorY, innerW * 0.92, 5.5, 3, PALETTE.lavenderMuted);
    fillRoundRect(ctx, innerX, cursorY + 9, innerW * 0.65, 5.5, 3, PALETTE.lavenderMuted);
    cursorY += 22;

    // 星级
    if (!isDropped) {
      const starR = 5.2;
      for (let i = 0; i < 4; i++) {
        drawStar(ctx, innerX + starR + i * 13, cursorY + 4, starR, PALETTE.mintDark);
      }
      cursorY += 15;
    }

    if (!isFlipped) {
      drawButtons(Math.min(y + h - pad - btnH, cursorY + 2));
    }
  }

  ctx.restore();

  if (slot.overflowPx > 0 || slot.crushed) {
    drawOverflowHazard(ctx, x, y, w, h, Math.max(slot.overflowPx, 18));
  } else if (slot.earlyCollapsed) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 1.6;
    roundRectPath(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.restore();
  }
}

// 绘制案例二：数据统计组件（1:1 复刻原海报 128k / 3.6% / 742 / ¥ 23.8w）
function drawStatsComponent(ctx, box, slot, state, scale) {
  const { x, y, w, h } = box;
  const pad = Math.max(8, Math.round(slot.pad * scale));
  fillRoundRect(ctx, x, y, w, h, 12, PALETTE.cardPaper);

  const items = [
    { val: "128k", label: "访问量", kind: "line" },
    { val: "3.6%", label: "转化率", kind: "bar", seed: 0 },
    { val: "742", label: "订单数", kind: "line" },
    { val: "¥23.8w", label: "营收", kind: "bar", seed: 1 },
  ];

  const innerX = x + pad;
  const innerY = y + pad;
  const innerW = Math.max(30, w - pad * 2);
  const innerH = Math.max(40, h - pad * 2);

  ctx.save();
  roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, 10);
  ctx.clip();

  const drawCell = (item, cx, cy, cw, ch, dropped, flipped) => {
    if (dropped) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      fillRoundRect(ctx, cx + 4, cy + 4, cw - 8, ch - 8, 5, "rgba(255,123,135,0.12)", PALETTE.coral, 1.1);
      ctx.restore();
      ctx.fillStyle = PALETTE.coralDark;
      ctx.font = `600 9.5px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("× 指标已隐藏", cx + cw / 2, cy + ch / 2);
      return;
    }

    const valSize = clamp(Math.min(cw * 0.22, 18 * scale), 11, 18);
    const lblSize = clamp(10.5 * scale, 9, 11);
    const chartH = clamp(ch * 0.34, 18, 36);
    const chartW = Math.max(24, cw - 16);

    if (flipped) {
      // 错误示范：微图顶在最上面，把核心数字挤到底部
      const topY = cy + 6;
      if (item.kind === "line") drawSparkline(ctx, cx + 8, topY, chartW, chartH);
      else drawBarMini(ctx, cx + 8, topY, chartW, chartH, item.seed);
      ctx.fillStyle = PALETTE.coralDark;
      ctx.font = `700 ${valSize}px ${FONT_EN}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(item.val, cx + cw / 2, topY + chartH + 8);
      ctx.fillStyle = PALETTE.cardSub;
      ctx.font = `500 ${lblSize}px ${FONT_ZH}`;
      ctx.fillText(item.label, cx + cw / 2, topY + chartH + 8 + valSize + 3);
    } else {
      ctx.fillStyle = PALETTE.cardInk;
      ctx.font = `700 ${valSize}px ${FONT_EN}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(item.val, cx + cw / 2, cy + 8);

      ctx.fillStyle = PALETTE.cardSub;
      ctx.font = `500 ${lblSize}px ${FONT_ZH}`;
      ctx.fillText(item.label, cx + cw / 2, cy + 11 + valSize);

      const chartY = cy + ch - chartH - 8;
      if (item.kind === "line") drawSparkline(ctx, cx + 8, chartY, chartW, chartH);
      else drawBarMini(ctx, cx + 8, chartY, chartW, chartH, item.seed);
    }
  };

  if (slot.mode === "wide") {
    // 4 列单行横排
    const drawW = slot.overflowPx > 0 ? Math.max(innerW, 330 * scale) : innerW;
    const colW = drawW / 4;
    const cellH = Math.min(innerH, 136);
    const cellY = innerY + (innerH - cellH) * 0.5;
    items.forEach((it, idx) => {
      const cx = innerX + idx * colW;
      if (idx > 0) {
        ctx.strokeStyle = "rgba(84, 73, 117, 0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cellY + 6);
        ctx.lineTo(cx, cellY + cellH - 6);
        ctx.stroke();
      }
      drawCell(it, cx, cellY, colW, cellH, false, false);
    });
  } else {
    // 2×2 四宫格
    const colW = innerW / 2;
    const rowH = innerH / 2;
    ctx.strokeStyle = "rgba(84, 73, 117, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(innerX + colW, innerY + 4);
    ctx.lineTo(innerX + colW, innerY + innerH - 4);
    ctx.moveTo(innerX + 4, innerY + rowH);
    ctx.lineTo(innerX + innerW - 4, innerY + rowH);
    ctx.stroke();

    items.forEach((it, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const isDropped = state.dropInfo && idx >= 2;
      drawCell(it, innerX + col * colW, innerY + row * rowH, colW, rowH, isDropped, state.flipOrder);
    });
  }

  ctx.restore();

  if (slot.overflowPx > 0 || slot.crushed) {
    drawOverflowHazard(ctx, x, y, w, h, Math.max(slot.overflowPx, 20));
  } else if (slot.earlyCollapsed) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 1.6;
    roundRectPath(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.restore();
  }
}

// 绘制案例三：内容列表组件（1:1 复刻原海报 3 条带眼/气泡/书签列表）
function drawListComponent(ctx, box, slot, state, scale) {
  const { x, y, w, h } = box;
  const pad = Math.max(8, Math.round(slot.pad * scale));
  fillRoundRect(ctx, x, y, w, h, 12, PALETTE.cardPaper);

  const rows = [
    { title: "容器查询规范解读", views: "12", comments: "8" },
    { title: "卡片断点与网格节奏", views: "12", comments: "8" },
    { title: "组件复用边界清单", views: "12", comments: "8" },
  ];

  const innerX = x + pad;
  const innerY = y + pad;
  const innerW = Math.max(30, w - pad * 2);
  const innerH = Math.max(40, h - pad * 2);

  ctx.save();
  roundRectPath(ctx, x + 2, y + 2, w - 4, h - 4, 10);
  ctx.clip();

  if (slot.mode === "wide") {
    const drawW = slot.overflowPx > 0 ? Math.max(innerW, 310 * scale) : innerW;
    const rowH = innerH / 3;
    rows.forEach((r, idx) => {
      const ry = innerY + idx * rowH;
      if (idx > 0) {
        ctx.strokeStyle = "rgba(84, 73, 117, 0.24)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX, ry);
        ctx.lineTo(innerX + innerW, ry);
        ctx.stroke();
      }
      const thumbS = clamp(rowH * 0.66, 22, 34);
      const ty = ry + (rowH - thumbS) / 2;
      fillRoundRect(ctx, innerX, ty, thumbS, thumbS, 5, PALETTE.mint);

      const textX = innerX + thumbS + 10;
      const rightX = innerX + drawW;
      const titleW = Math.max(40, drawW - thumbS - 118);

      ctx.fillStyle = PALETTE.cardInk;
      ctx.font = `700 ${clamp(11.5 * scale, 9.5, 12.5)}px ${FONT_ZH}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(r.title, textX, ry + rowH * 0.36);

      fillRoundRect(ctx, textX, ry + rowH * 0.62, Math.min(titleW, 130), 5, 2.5, PALETTE.lavenderMuted);

      // 右侧操作区：👁 12  💬 8  🔖
      const midY = ry + rowH * 0.5;
      drawEyeIcon(ctx, rightX - 92, midY, 6);
      ctx.fillStyle = PALETTE.cardInk;
      ctx.font = `600 10.5px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText(r.views, rightX - 82, midY + 0.5);

      fillRoundRect(ctx, rightX - 58, midY - 5, 11, 9, 2, PALETTE.cardInk);
      ctx.fillText(r.comments, rightX - 43, midY + 0.5);

      drawBookmarkIcon(ctx, rightX - 18, midY - 8, 12, 16);
    });
  } else {
    // 窄态：卡片堆叠，操作区沉到底行（3 张紧凑子卡，2 张完整 + 第 3 张紧致适配）
    const gap = 6;
    const cardH = (innerH - gap * 2) / 3;
    rows.forEach((r, idx) => {
      const cy = innerY + idx * (cardH + gap);
      fillRoundRect(ctx, innerX, cy, innerW, cardH, 6, "#F8F5F2", "rgba(84,73,117,0.18)", 1);

      const padC = 6;
      const topH = cardH * 0.56;
      const botY = cy + topH + 1;

      if (state.flipOrder) {
        // 错态：把操作区顶到最上面
        const actY = cy + 9;
        if (!state.dropInfo) {
          drawEyeIcon(ctx, innerX + padC + 6, actY, 5);
          ctx.fillStyle = PALETTE.coralDark;
          ctx.font = `600 9.5px ${FONT_MONO}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(`${r.views}  ·  ${r.comments}`, innerX + padC + 15, actY + 0.5);
          drawBookmarkIcon(ctx, innerX + innerW - padC - 10, actY - 6, 9, 12);
        }
        fillRoundRect(ctx, innerX + padC, cy + cardH - 22, 16, 16, 3, PALETTE.mint);
        ctx.fillStyle = PALETTE.cardInk;
        ctx.font = `700 10px ${FONT_ZH}`;
        ctx.fillText(r.title, innerX + padC + 22, cy + cardH - 14);
      } else {
        const thumbS = clamp(topH - 6, 16, 24);
        fillRoundRect(ctx, innerX + padC, cy + 5, thumbS, thumbS, 4, PALETTE.mint);
        const tx = innerX + padC + thumbS + 7;
        ctx.fillStyle = PALETTE.cardInk;
        ctx.font = `700 10.5px ${FONT_ZH}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(r.title, tx, cy + 6);
        fillRoundRect(ctx, tx, cy + 20, Math.max(24, innerW - thumbS - 28), 4.5, 2, PALETTE.lavenderMuted);

        // 底行次要操作区
        const actY = Math.min(cy + cardH - 9, botY + 8);
        if (state.dropInfo) {
          ctx.fillStyle = PALETTE.coralDark;
          ctx.font = `600 9px ${FONT_ZH}`;
          ctx.textBaseline = "middle";
          ctx.fillText("× 操作区已移除", innerX + padC, actY);
        } else {
          drawEyeIcon(ctx, innerX + padC + 6, actY, 4.8);
          ctx.fillStyle = PALETTE.cardSub;
          ctx.font = `600 9.5px ${FONT_MONO}`;
          ctx.textBaseline = "middle";
          ctx.fillText(`${r.views}`, innerX + padC + 15, actY + 0.5);
          fillRoundRect(ctx, innerX + padC + 34, actY - 4, 9, 7, 1.5, PALETTE.cardSub);
          ctx.fillText(`${r.comments}`, innerX + padC + 47, actY + 0.5);
          drawBookmarkIcon(ctx, innerX + innerW - padC - 10, actY - 6, 9, 12);
        }
      }
    });
  }

  ctx.restore();

  if (slot.overflowPx > 0 || slot.crushed) {
    drawOverflowHazard(ctx, x, y, w, h, Math.max(slot.overflowPx, 18));
  } else if (slot.earlyCollapsed) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 1.6;
    roundRectPath(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.restore();
  }
}

// =========================================================
// 1. 开场双槽活体组件分轨台 Renderer
// =========================================================
export function createHeroRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  let animSplit = 0.72;
  let pulseT = 0;
  let lastModes = "";
  let dragging = false;

  const geometry = {
    spineX: 0,
    slotsLeft: 0,
    slotsWidth: 1,
    leftRect: null,
    rightRect: null,
  };

  function setDragging(v) {
    dragging = v;
  }

  function render(evalRes, t, dt, { still }) {
    const cssW = canvas.clientWidth || 800;
    const cssH = canvas.clientHeight || 360;
    const maxDpr = cssW < 540 ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 丝滑缓动（reducedMotion 时一步到位）
    const targetSplit = evalRes.state.split;
    if (still || dragging || dt === 0) {
      animSplit = targetSplit;
    } else {
      const k = 1 - Math.exp(-16 * dt);
      animSplit += (targetSplit - animSplit) * k;
      if (Math.abs(targetSplit - animSplit) < 0.0008) animSplit = targetSplit;
    }

    const modeKey = `${evalRes.left.mode}-${evalRes.right.mode}-${evalRes.state.queryMode}-${evalRes.state.component}`;
    if (modeKey !== lastModes) {
      lastModes = modeKey;
      pulseT = 0;
    } else if (!still) {
      pulseT = Math.min(1, pulseT + dt * 2.2);
    } else {
      pulseT = 1;
    }

    const intro = still ? 1 : clamp(t / 0.55, 0, 1);
    const easeIntro = 1 - (1 - intro) ** 3;

    // 背景
    ctx.fillStyle = PALETTE.panelBg;
    ctx.fillRect(0, 0, cssW, cssH);

    // 微弱工程网格底纹（单次路径合批，降低软件渲染绘制调用）
    ctx.strokeStyle = "rgba(155, 127, 232, 0.07)";
    ctx.lineWidth = 1;
    const gridStep = 28;
    ctx.beginPath();
    for (let gx = gridStep; gx < cssW; gx += gridStep) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, cssH);
    }
    for (let gy = gridStep; gy < cssH; gy += gridStep) {
      ctx.moveTo(0, gy);
      ctx.lineTo(cssW, gy);
    }
    ctx.stroke();

    const compactScreen = cssW < 540;
    const padX = compactScreen ? 12 : 22;
    const topBarH = compactScreen ? 46 : 50;
    const footerRulerH = compactScreen ? 34 : 38;
    const spineW = compactScreen ? 26 : 34;

    const slotsLeft = padX;
    const slotsWidth = Math.max(160, cssW - padX * 2);
    const usableW = slotsWidth - spineW;

    const leftDrawW = Math.round(usableW * animSplit);
    const rightDrawW = usableW - leftDrawW;
    const spineX = slotsLeft + leftDrawW;
    const rightX = spineX + spineW;

    const slotTop = topBarH + 8;
    const slotH = Math.max(150, cssH - slotTop - footerRulerH - 8);

    geometry.spineX = spineX + spineW / 2;
    geometry.slotsLeft = slotsLeft;
    geometry.slotsWidth = slotsWidth;
    geometry.leftRect = { x: slotsLeft, y: slotTop, w: leftDrawW, h: slotH };
    geometry.rightRect = { x: rightX, y: slotTop, w: rightDrawW, h: slotH };

    // === 顶部：全局视口固定标尺（1280px 纹丝不动！） ===
    const vpY = 18;
    const isMedia = evalRes.state.queryMode === "media";
    ctx.strokeStyle = isMedia ? PALETTE.coral : "rgba(199, 192, 221, 0.35)";
    ctx.lineWidth = isMedia ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(slotsLeft, vpY);
    ctx.lineTo(slotsLeft + slotsWidth, vpY);
    // 两端竖勾
    ctx.moveTo(slotsLeft, vpY - 5);
    ctx.lineTo(slotsLeft, vpY + 5);
    ctx.moveTo(slotsLeft + slotsWidth, vpY - 5);
    ctx.lineTo(slotsLeft + slotsWidth, vpY + 5);
    ctx.stroke();

    // 居中视口胶囊
    const vpText = compactScreen
      ? `整屏视口 ${VIEWPORT_W}px（不变）`
      : isMedia
      ? `整屏视口 ${VIEWPORT_W}px（不变） · @media 正在误读此处宽度`
      : `整屏视口 ${VIEWPORT_W}px（不变） · @container 已改读下方各槽实宽`;
    ctx.font = `600 ${compactScreen ? 10 : 11}px ${FONT_MONO}`;
    const vpTW = ctx.measureText(vpText).width + 20;
    const vpBX = (cssW - vpTW) / 2;
    fillRoundRect(
      ctx,
      vpBX,
      6,
      vpTW,
      24,
      12,
      isMedia ? "#3D1538" : "#221654",
      isMedia ? PALETTE.coral : PALETTE.mint,
      1.3
    );
    ctx.fillStyle = isMedia ? "#FFD5DA" : PALETTE.mint;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(vpText, cssW / 2, 18.5);

    // 信号读取连线：@media 从顶尺直插两槽；@container 各自在槽顶横向测量
    if (isMedia) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255, 123, 135, 0.72)";
      ctx.lineWidth = 1.4;
      const leftMid = slotsLeft + leftDrawW / 2;
      const rightMid = rightX + rightDrawW / 2;
      ctx.beginPath();
      ctx.moveTo(leftMid, 30);
      ctx.lineTo(leftMid, slotTop);
      ctx.moveTo(rightMid, 30);
      ctx.lineTo(rightMid, slotTop);
      ctx.stroke();
      ctx.restore();
    } else {
      // @container：各自标出独立测量箭头
      const drawMeasureCue = (sx, sw, slot) => {
        const cy = topBarH - 6;
        ctx.strokeStyle = slot.status === "ok" ? PALETTE.mint : PALETTE.amber;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx + 6, cy);
        ctx.lineTo(sx + sw - 6, cy);
        ctx.moveTo(sx + 6, cy - 3.5);
        ctx.lineTo(sx + 6, cy + 3.5);
        ctx.moveTo(sx + sw - 6, cy - 3.5);
        ctx.lineTo(sx + sw - 6, cy + 3.5);
        ctx.stroke();
      };
      drawMeasureCue(slotsLeft, leftDrawW, evalRes.left);
      drawMeasureCue(rightX, rightDrawW, evalRes.right);
    }

    // === 绘制左右两槽容器 + 同源组件 ===
    const drawSlotFrame = (slot, sx, sy, sw, sh) => {
      const borderColor =
        slot.status === "ok"
          ? PALETTE.slotBorderOk
          : slot.status === "early"
          ? PALETTE.slotBorderWarn
          : PALETTE.slotBorderBad;

      fillRoundRect(ctx, sx, sy, sw, sh, 14, PALETTE.slotBg, borderColor, slot.status === "ok" ? 1.5 : 1.9);

      // 槽顶信息栏（自适应宽度防碰字）
      const headH = compactScreen ? 30 : 34;
      const roleShort = sw < 225 ? (slot.id === "left" ? "主槽" : "侧槽") : slot.role;
      const titleStr = `${roleShort} ${slot.width}px`;
      ctx.font = `600 ${compactScreen ? 10 : 11.5}px ${FONT_MONO}`;
      const titleW = ctx.measureText(titleStr).width;
      ctx.fillStyle = PALETTE.cream;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(titleStr, sx + 10, sy + headH / 2 + 1);

      // 右上状态胶囊（1:1 承袭原海报 宽屏/窄屏 绿药丸，依据剩余宽度自动精简文案绝不碰字）
      const availPillW = sw - titleW - 26;
      const pillText =
        slot.status === "ok"
          ? slot.mode === "wide"
            ? availPillW < 78 ? "宽态" : "宽态 WIDE"
            : availPillW < 92 ? "窄态" : "窄态 COMPACT"
          : availPillW < 82 && slot.overflowPx > 0
          ? `+${slot.overflowPx}px`
          : slot.statusTag;

      ctx.font = `700 ${compactScreen ? 9.5 : 10}px ${FONT_EN}`;
      const pillW = ctx.measureText(pillText).width + 14;
      const pillFill =
        slot.status === "ok"
          ? slot.mode === "wide"
            ? PALETTE.mint
            : PALETTE.lavenderBright
          : slot.status === "early"
          ? PALETTE.amber
          : PALETTE.coral;

      if (pillW <= availPillW + 4) {
        fillRoundRect(ctx, sx + sw - pillW - 8, sy + (headH - 20) / 2 + 1, pillW, 20, 10, pillFill);
        ctx.fillStyle = PALETTE.mintText;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pillText, sx + sw - pillW / 2 - 8, sy + headH / 2 + 1.5);
      }

      // 组件盒几何：缩放比按真实槽位宽度映射到画布宽度，同时保持卡片完整可见
      const cardPadX = compactScreen ? 8 : 12;
      const cardPadB = compactScreen ? 24 : 26;
      const cardBox = {
        x: sx + cardPadX,
        y: sy + headH + 4,
        w: Math.max(44, sw - cardPadX * 2),
        h: Math.max(90, sh - headH - cardPadB - 6),
      };

      // 入场微缓缩放（始终优雅可见）
      const scale = clamp(sw / Math.max(220, slot.width), 0.72, 1.05);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * easeIntro;
      if (evalRes.state.component === "card") {
        drawCardComponent(ctx, cardBox, slot, evalRes.state, scale);
      } else if (evalRes.state.component === "stats") {
        drawStatsComponent(ctx, cardBox, slot, evalRes.state, scale);
      } else {
        drawListComponent(ctx, cardBox, slot, evalRes.state, scale);
      }
      ctx.restore();

      // 槽底实测单真源细读数
      const footText = compactScreen ? slot.detailShort : `${slot.detailMetric}`;
      ctx.fillStyle = slot.status === "ok" ? PALETTE.dimText : PALETTE.coral;
      ctx.font = `500 ${compactScreen ? 9.5 : 10.5}px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx + 8, sy + sh - 22, sw - 16, 18);
      ctx.clip();
      ctx.fillText(footText, sx + 10, sy + sh - 12);
      ctx.restore();
    };

    drawSlotFrame(evalRes.left, slotsLeft, slotTop, leftDrawW, slotH);
    drawSlotFrame(evalRes.right, rightX, slotTop, rightDrawW, slotH);

    // === 中央薰衣草紫实体分栏拉脊（核心拖拽把手） ===
    const spineMidX = spineX + spineW / 2;
    const spineMidY = slotTop + slotH / 2;

    // 竖向虚线轨道
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = dragging ? PALETTE.mint : PALETTE.lavender;
    ctx.lineWidth = dragging ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(spineMidX, slotTop + 6);
    ctx.lineTo(spineMidX, slotTop + slotH - 6);
    ctx.stroke();
    ctx.restore();

    // 中段实体拉柄胶囊
    const handleW = compactScreen ? 18 : 22;
    const handleH = 62;
    fillRoundRect(
      ctx,
      spineMidX - handleW / 2,
      spineMidY - handleH / 2,
      handleW,
      handleH,
      handleW / 2,
      dragging ? PALETTE.mint : PALETTE.lavender,
      PALETTE.cream,
      dragging ? 2 : 1.2
    );
    // 把手内双竖握纹
    ctx.strokeStyle = PALETTE.bgDeep;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(spineMidX - 3, spineMidY - 11);
    ctx.lineTo(spineMidX - 3, spineMidY + 11);
    ctx.moveTo(spineMidX + 3, spineMidY - 11);
    ctx.lineTo(spineMidX + 3, spineMidY + 11);
    ctx.stroke();

    // 左右转换小箭提示
    ctx.fillStyle = dragging ? PALETTE.mint : PALETTE.lavenderBright;
    ctx.font = `700 10px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", spineMidX, spineMidY - handleH / 2 - 12);

    // 切态瞬间微脉冲光圈（仅脉冲期间出现，不常驻晃动）
    if (!still && pulseT < 1) {
      const a = (1 - pulseT) * 0.55;
      ctx.strokeStyle = evalRes.ok ? `rgba(151,216,176,${a})` : `rgba(255,123,135,${a})`;
      ctx.lineWidth = 2;
      roundRectPath(ctx, slotsLeft - 2, slotTop - 2, slotsWidth + 4, slotH + 4, 16);
      ctx.stroke();
    }

    // === 底部：容器断点与两槽实时对照刻度轨 ===
    const rulerY = cssH - footerRulerH + 14;
    const barX = slotsLeft + 6;
    const barW = slotsWidth - 12;
    const minPx = 160;
    const maxPx = 780;
    const toBarX = (px) => barX + clamp((px - minPx) / (maxPx - minPx), 0, 1) * barW;

    ctx.strokeStyle = "rgba(181, 168, 224, 0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX, rulerY);
    ctx.lineTo(barX + barW, rulerY);
    ctx.stroke();

    // 推荐断点安全绿区（单真源）
    const safeX0 = toBarX(evalRes.spec.minWideW);
    const safeX1 = toBarX(evalRes.spec.earlyCollapseW - 20);
    ctx.fillStyle = "rgba(151, 216, 176, 0.22)";
    ctx.fillRect(safeX0, rulerY - 4, Math.max(4, safeX1 - safeX0), 8);

    // 刻度文字与刻度线（合批绘制）
    ctx.strokeStyle = "rgba(181, 168, 224, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const tick of [200, 300, 400, 500, 600, 700]) {
      const tx = toBarX(tick);
      ctx.moveTo(tx, rulerY - 3);
      ctx.lineTo(tx, rulerY + 3);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(201, 195, 222, 0.62)";
    ctx.font = `500 9.5px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const tick of [200, 300, 400, 500, 600, 700]) {
      if (!compactScreen || tick % 200 === 0) {
        ctx.fillText(`${tick}`, toBarX(tick), rulerY + 6);
      }
    }

    // 断点竖针
    const bpX = toBarX(evalRes.state.breakpoint);
    ctx.fillStyle = PALETTE.mint;
    ctx.beginPath();
    ctx.moveTo(bpX, rulerY - 10);
    ctx.lineTo(bpX - 5, rulerY - 17);
    ctx.lineTo(bpX + 5, rulerY - 17);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.mint;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bpX, rulerY - 10);
    ctx.lineTo(bpX, rulerY + 4);
    ctx.stroke();

    // 左右两槽当前实宽圆点
    const drawDot = (px, color, label) => {
      const dx = toBarX(px);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dx, rulerY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.bgDeep;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      if (!compactScreen) {
        ctx.fillStyle = color;
        ctx.font = `600 9.5px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(label, dx, rulerY - 8);
      }
    };

    drawDot(evalRes.left.width, PALETTE.lavenderBright, `主${evalRes.left.width}`);
    drawDot(evalRes.right.width, evalRes.right.status === "ok" ? PALETTE.mint : PALETTE.coral, `侧${evalRes.right.width}`);

    ctx.restore();
    return { animating: Math.abs(targetSplit - animSplit) > 0.001 || pulseT < 1 || intro < 1 };
  }

  function clientXToSplit(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = (x - geometry.slotsLeft) / Math.max(1, geometry.slotsWidth);
    return clamp(ratio, SPLIT_MIN, SPLIT_MAX);
  }

  return { render, setDragging, clientXToSplit, geometry };
}

// =========================================================
// 2. 第 03 节「遏制切断循环依赖」2D Canvas 因果模拟器
// =========================================================
export function createContainmentRenderer(canvas) {
  const ctx = canvas.getContext("2d");

  function render(mode, t, { still }) {
    const cssW = canvas.clientWidth || 640;
    const cssH = canvas.clientHeight || 260;
    const dpr = Math.min(window.devicePixelRatio || 1, cssW < 540 ? 1.5 : 2);
    const tw = Math.round(cssW * dpr);
    const th = Math.round(cssH * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#120836";
    ctx.fillRect(0, 0, cssW, cssH);

    const vertical = cssW < 520;
    const phase = still ? 0.35 : (t * 0.75) % 1;
    const osc = mode === "loop" && !still ? Math.sin(t * 11) * 7 : mode === "loop" ? 5 : 0;
    const pColor = mode === "inline" ? PALETTE.mint : mode === "loop" ? PALETTE.coral : PALETTE.amber;

    if (vertical) {
      // 窄屏自动改为上下双层垂直布局，零遮挡零碰字（组件级响应自身示范！）
      const bw = Math.min(280, cssW - 36);
      const bx = (cssW - bw) / 2;
      const topBoxH = mode === "size" ? 38 : 66;
      const topY = 14;
      fillRoundRect(ctx, bx - osc * 0.5, topY, bw + osc, topBoxH, 10, "#231657", pColor, 2);

      ctx.fillStyle = PALETTE.cream;
      ctx.font = `700 12px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("父容器 · CONTAINER", cssW / 2, topY + (mode === "size" ? 13 : 22));
      ctx.fillStyle = pColor;
      ctx.font = `600 10.5px ${FONT_MONO}`;
      ctx.fillText(
        mode === "loop" ? `宽 ${Math.round(400 + osc * 3)}px ⇄ 震荡` : mode === "inline" ? "inline-size（锁宽不锁高）" : "height: 0px 高度塌陷!",
        cssW / 2,
        topY + (mode === "size" ? 28 : 44)
      );

      // 中段左右两条竖轨：左轨 父→子，右轨 子→父（或遏制盾）
      const midTop = topY + topBoxH + 8;
      const botY = cssH - 96;
      const midBot = botY - 8;
      const leftLane = cssW * 0.30;
      const rightLane = cssW * 0.70;

      // 左竖轨（父 → 子 向下）
      ctx.strokeStyle = mode === "loop" ? PALETTE.coral : PALETTE.mint;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftLane, midTop);
      ctx.lineTo(leftLane, midBot);
      ctx.stroke();
      ctx.fillStyle = mode === "loop" ? PALETTE.coral : PALETTE.mint;
      ctx.beginPath();
      ctx.moveTo(leftLane, midBot);
      ctx.lineTo(leftLane - 5, midBot - 8);
      ctx.lineTo(leftLane + 5, midBot - 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(leftLane, midTop + (midBot - midTop) * phase, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `600 10px ${FONT_ZH}`;
      ctx.fillText("① 父宽通知子", leftLane, (midTop + midBot) / 2 - 10);

      // 右竖轨（子 → 父 向上，或被切断）
      if (mode === "loop") {
        ctx.strokeStyle = PALETTE.coral;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rightLane, midBot);
        ctx.lineTo(rightLane, midTop);
        ctx.stroke();
        ctx.fillStyle = PALETTE.coral;
        ctx.beginPath();
        ctx.moveTo(rightLane, midTop);
        ctx.lineTo(rightLane - 5, midTop + 8);
        ctx.lineTo(rightLane + 5, midTop + 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightLane, midBot - (midBot - midTop) * phase, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("② 反向撑宽死循环!", rightLane, (midTop + midBot) / 2 + 12);
      } else {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(181, 168, 224, 0.35)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(rightLane, midBot);
        ctx.lineTo(rightLane, midTop);
        ctx.stroke();
        ctx.restore();
        const cy = (midTop + midBot) / 2;
        fillRoundRect(ctx, rightLane - 26, cy - 12, 52, 24, 6, PALETTE.lavender, PALETTE.cream, 1.3);
        ctx.fillStyle = PALETTE.bgDeep;
        ctx.font = `700 10px ${FONT_ZH}`;
        ctx.fillText("已切断", rightLane, cy + 0.5);
        ctx.fillStyle = mode === "inline" ? PALETTE.mint : PALETTE.amber;
        ctx.font = `600 9.5px ${FONT_ZH}`;
        ctx.fillText(mode === "inline" ? "② 仅断宽不断高" : "② 宽高双断→归零", rightLane, cy + 23);
      }

      // 下方：内部组件盒
      fillRoundRect(ctx, bx, botY, bw, 62, 10, PALETTE.cardPaper, PALETTE.lavender, 1.8);
      ctx.fillStyle = PALETTE.cardInk;
      ctx.font = `700 12px ${FONT_ZH}`;
      ctx.fillText("内部组件 · @container", cssW / 2, botY + 21);
      fillRoundRect(ctx, bx + 24, botY + 34, bw - 48, 20, 5, mode === "loop" ? PALETTE.coral : PALETTE.mint);
      ctx.fillStyle = PALETTE.mintText;
      ctx.font = `600 10px ${FONT_ZH}`;
      ctx.fillText(mode === "loop" ? "横排 ⇄ 竖排 规则打架" : mode === "inline" ? "单向稳定重排 · 不塌陷" : "内容冲出 0px 父框", cssW / 2, botY + 44.5);

      const note =
        mode === "loop"
          ? "不遏制尺寸回流，浏览器会无限震荡"
          : mode === "inline"
          ? "标准解法：container-type: inline-size"
          : "踩坑：误用 size 且未定高时高度塌为 0";
      ctx.fillStyle = PALETTE.dimText;
      ctx.font = `500 10.5px ${FONT_ZH}`;
      ctx.fillText(note, cssW / 2, cssH - 14);
      ctx.restore();
      return;
    }

    // 宽屏水平布局：左侧父容器盒；右侧子组件盒
    const compact = false;
    const boxW = 178;
    const boxH = mode === "size" ? 36 : 112;
    const midY = cssH * 0.46;
    const leftX = Math.max(26, cssW * 0.08);
    const rightX = cssW - leftX - boxW;

    // 父容器框
    const pY = mode === "size" ? midY - 44 : midY - boxH / 2;
    fillRoundRect(ctx, leftX, pY, boxW + osc, boxH, 10, "#231657", pColor, 2);

    ctx.fillStyle = PALETTE.cream;
    ctx.font = `700 ${compact ? 11.5 : 13}px ${FONT_ZH}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("父容器", leftX + (boxW + osc) / 2, pY + (mode === "size" ? 13 : 30));

    ctx.fillStyle = pColor;
    ctx.font = `600 ${compact ? 9.5 : 11}px ${FONT_MONO}`;
    const pSub =
      mode === "loop"
        ? `宽 ${Math.round(400 + osc * 3)}px ⇄`
        : mode === "inline"
        ? "inline-size"
        : "height: 0px 塌陷!";
    ctx.fillText(pSub, leftX + (boxW + osc) / 2, pY + (mode === "size" ? 26 : 56));

    if (mode === "inline") {
      ctx.fillStyle = PALETTE.dimText;
      ctx.font = `500 ${compact ? 9.5 : 10.5}px ${FONT_ZH}`;
      ctx.fillText("宽度由外部给定", leftX + boxW / 2, pY + 80);
      ctx.fillText("高度仍随内容自撑", leftX + boxW / 2, pY + 96);
    } else if (mode === "size") {
      // 子组件直接溢出零高父框
      ctx.save();
      ctx.setLineDash([4, 3]);
      fillRoundRect(ctx, leftX + 10, pY + boxH + 8, boxW - 20, 62, 8, "rgba(242,199,110,0.14)", PALETTE.amber, 1.5);
      ctx.restore();
      ctx.fillStyle = PALETTE.amber;
      ctx.font = `600 10.5px ${FONT_ZH}`;
      ctx.fillText("子内容冲出塌陷容器", leftX + boxW / 2, pY + boxH + 40);
    }

    // 右侧：子组件框
    const cY = midY - 56;
    fillRoundRect(ctx, rightX, cY, boxW, 112, 10, PALETTE.cardPaper, PALETTE.lavender, 1.8);
    ctx.fillStyle = PALETTE.cardInk;
    ctx.font = `700 ${compact ? 11.5 : 13}px ${FONT_ZH}`;
    ctx.fillText("内部组件", rightX + boxW / 2, cY + 30);
    ctx.fillStyle = "#4B2CA0";
    ctx.font = `600 ${compact ? 9.5 : 11}px ${FONT_MONO}`;
    ctx.fillText(mode === "loop" ? "横排 ⇄ 竖排 闪烁" : "@container 生效", rightX + boxW / 2, cY + 56);
    fillRoundRect(ctx, rightX + 16, cY + 74, boxW - 32, 22, 5, PALETTE.mint);
    ctx.fillStyle = PALETTE.mintText;
    ctx.font = `600 10px ${FONT_ZH}`;
    ctx.fillText(mode === "loop" ? "规则互相打架" : "单向稳定重排", rightX + boxW / 2, cY + 85);

    // 上下两条因果连线（父 → 子；子 → 父）
    const ax0 = leftX + boxW + osc + 8;
    const ax1 = rightX - 8;
    const topY = midY - 28;
    const botY = midY + 28;

    // 上轨：父宽通知子组件（始终畅通）
    ctx.strokeStyle = mode === "loop" ? PALETTE.coral : PALETTE.mint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax0, topY);
    ctx.lineTo(ax1, topY);
    ctx.stroke();
    // 箭头
    ctx.fillStyle = mode === "loop" ? PALETTE.coral : PALETTE.mint;
    ctx.beginPath();
    ctx.moveTo(ax1, topY);
    ctx.lineTo(ax1 - 8, topY - 5);
    ctx.lineTo(ax1 - 8, topY + 5);
    ctx.closePath();
    ctx.fill();

    // 上轨光珠
    const pxTop = ax0 + (ax1 - ax0) * phase;
    ctx.beginPath();
    ctx.arc(pxTop, topY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.cream;
    ctx.font = `600 ${compact ? 9.5 : 10.5}px ${FONT_ZH}`;
    ctx.textAlign = "center";
    ctx.fillText("① 父宽通知子组件", (ax0 + ax1) / 2, topY - 12);

    // 下轨：子内容宽反向撑父容器
    const midX = (ax0 + ax1) / 2;
    if (mode === "loop") {
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax1, botY);
      ctx.lineTo(ax0, botY);
      ctx.stroke();
      ctx.fillStyle = PALETTE.coral;
      ctx.beginPath();
      ctx.moveTo(ax0, botY);
      ctx.lineTo(ax0 + 8, botY - 5);
      ctx.lineTo(ax0 + 8, botY + 5);
      ctx.closePath();
      ctx.fill();

      const pxBot = ax1 - (ax1 - ax0) * phase;
      ctx.beginPath();
      ctx.arc(pxBot, botY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PALETTE.coral;
      ctx.fillText("② 子又撑宽父 → 死循环!", midX, botY + 18);
    } else {
      // 遏制盾切断回环
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(181, 168, 224, 0.35)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ax1, botY);
      ctx.lineTo(ax0, botY);
      ctx.stroke();
      ctx.restore();

      // 紫色遏制盾
      fillRoundRect(ctx, midX - 24, botY - 13, 48, 26, 6, PALETTE.lavender, PALETTE.cream, 1.4);
      ctx.fillStyle = PALETTE.bgDeep;
      ctx.font = `700 10px ${FONT_ZH}`;
      ctx.fillText("已切断", midX, botY + 0.5);

      ctx.fillStyle = mode === "inline" ? PALETTE.mint : PALETTE.amber;
      ctx.font = `600 ${compact ? 9.5 : 10.5}px ${FONT_ZH}`;
      ctx.fillText(
        mode === "inline" ? "② 切断横向回环，保留纵向自撑" : "② 横纵双轴全切断 → 父高归零",
        midX,
        botY + 24
      );
    }

    // 底部结论带
    const note =
      mode === "loop"
        ? "历史死结：不遏制尺寸回流，浏览器布局引擎会无限震荡"
        : mode === "inline"
        ? "标准解法：container-type: inline-size 只锁宽不锁高，安全实用"
        : "常见踩坑：误写 container-type: size 且未定高时，容器高度直接塌成 0";
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = `500 ${compact ? 10 : 11.5}px ${FONT_ZH}`;
    ctx.textAlign = "center";
    ctx.fillText(note, cssW / 2, cssH - 18);

    ctx.restore();
  }

  return { render };
}
