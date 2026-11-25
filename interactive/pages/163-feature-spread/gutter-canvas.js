// 第 03 节「中缝与出血的物理账」2D Canvas 书脊拱折与俯视透视模拟机
// 上半区画真实书页俯视透视（展示中缝折槽如何把跨缝图形拉窄、吞噬），
// 下半区画实体书页侧面剖面弧线（直观对比骑马钉 174°、锁线精装 156°、厚刊胶装 124° 的装订深槽）。

export const GUTTER_BINDINGS = {
  perfect: {
    id: "perfect",
    name: "厚刊无线胶装（240 页）",
    angleDeg: 124,
    swallowMm: 14,
    archDepth: 0.72,
    bleedMm: 3,
    summary: "书脊胶层硬，双页呈深 V 拱折，左右各约 14mm 纸面弯进谷底，俯视读图时中缝附近被压缩变形。",
  },
  sewn: {
    id: "sewn",
    name: "锁线精装画册（160 页）",
    angleDeg: 156,
    swallowMm: 7,
    archDepth: 0.36,
    bleedMm: 3,
    summary: "锁线装订可以较好摊开，中缝吞图减半到单侧约 7mm，但仍不能把人像眼睛或细小文字正压在折线上。",
  },
  saddle: {
    id: "saddle",
    name: "骑马钉薄刊（48 页）",
    angleDeg: 174,
    swallowMm: 4,
    archDepth: 0.14,
    bleedMm: 3,
    summary: "薄本骑马钉几乎完全摊平，中缝最友好（单侧约 4mm），最适合做横跨整幅双页的大特写。",
  },
};

export function renderGutterSim(ctx, width, height, simState) {
  const b = GUTTER_BINDINGS[simState.binding] || GUTTER_BINDINGS.perfect;
  const bleedOn = simState.bleedOn;
  const offsetMode = simState.offsetMode; // "center" | "safe"
  const isNarrow = width < 500;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#001F1D";
  ctx.fillRect(0, 0, width, height);

  // 上半部分：俯视实印对开效果（高度占 62%）
  const topH = Math.round(height * 0.62);
  const padX = isNarrow ? 18 : 34;
  const padTop = 32;
  const spW = Math.min(width - padX * 2, (topH - padTop - 16) * 1.56);
  const spH = spW / 1.56;
  const spX = (width - spW) * 0.5;
  const spY = padTop + (topH - padTop - spH) * 0.5;
  const midX = spX + spW * 0.5;

  // 顶部标尺说明
  ctx.fillStyle = "#F5C438";
  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("TOP VIEW · 俯视实印变形", padX, 10);
  ctx.textAlign = "right";
  ctx.fillStyle = offsetMode === "center" ? "#FF846B" : "#6FE3B5";
  ctx.fillText(
    offsetMode === "center" ? `焦心跨缝 · 被吞 ±${b.swallowMm}mm` : `焦心右移避缝 · 安全留距`,
    width - padX,
    10
  );

  // 俯视双页底板
  ctx.save();
  ctx.fillStyle = "#013230";
  ctx.fillRect(spX, spY, spW, spH);

  // 如果关掉 3mm 出血，模拟裁纸刀漂移 1.5mm 露出的刺眼白边！
  const trimDrift = bleedOn ? 0 : Math.max(4, spW * 0.015);
  ctx.beginPath();
  ctx.rect(spX + trimDrift, spY + trimDrift * 0.7, spW - trimDrift * 2, spH - trimDrift * 1.4);
  ctx.clip();

  // 画一个带金芯的暖奶白圆环（代表特写核心），分 36 条竖带模拟中缝曲率透视压缩！
  const cx = offsetMode === "center" ? midX : spX + spW * 0.72;
  const cy = spY + spH * 0.52;
  const R = spH * 0.56;
  const swallowPx = (b.swallowMm / 220) * (spW * 0.5);

  // 镉金斜楔
  ctx.fillStyle = "#F0AF03";
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.9, spY + spH + 10);
  ctx.lineTo(cx, cy + R * 0.15);
  ctx.lineTo(spX + spW + 20, cy + R * 0.5);
  ctx.lineTo(spX + spW + 20, spY + spH + 10);
  ctx.closePath();
  ctx.fill();

  // 暖奶白圆环（当焦心在正中时，模拟实体中缝吃掉中间 2*swallowMm 的真实视觉断层！）
  const drawHalfRing = (side) => {
    ctx.save();
    ctx.beginPath();
    if (side < 0) ctx.rect(spX, spY, spW * 0.5, spH);
    else ctx.rect(midX, spY, spW * 0.5, spH);
    ctx.clip();
    // 物理吞图偏移：左页右沿被往中缝吞进 swallowPx*0.75，右页左沿亦然，导致跨缝图形被截断错位
    const shift = offsetMode === "center" ? side * -swallowPx * 0.72 : 0;
    ctx.beginPath();
    ctx.arc(cx + shift, cy, R, 0, Math.PI * 2);
    ctx.arc(cx + shift, cy, R * 0.45, 0, Math.PI * 2, true);
    ctx.fillStyle = "#F1E7D4";
    ctx.fill("evenodd");

    // 焦心金点
    ctx.fillStyle = "#F0AF03";
    ctx.beginPath();
    ctx.arc(cx + shift, cy, Math.max(5, R * 0.14), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawHalfRing(-1);
  drawHalfRing(1);

  ctx.restore();

  // 若关掉出血：在裁切外缘标出刺眼露白边
  if (!bleedOn) {
    ctx.strokeStyle = "#F7F1E4";
    ctx.lineWidth = trimDrift;
    ctx.strokeRect(spX + trimDrift * 0.5, spY + trimDrift * 0.5, spW - trimDrift, spH - trimDrift);
    ctx.fillStyle = "#C93522";
    ctx.fillRect(spX + spW - 118, spY + 8, 110, 20);
    ctx.fillStyle = "#FFF7F4";
    ctx.font = '600 10px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("裁刀漂移露白边!", spX + spW - 63, spY + 18);
  }

  // 俯视中缝深谷阴影 + 吞图红虚线
  const gW = Math.max(8, swallowPx * 1.6);
  const grad = ctx.createLinearGradient(midX - gW, 0, midX + gW, 0);
  grad.addColorStop(0, "rgba(0, 10, 9, 0)");
  grad.addColorStop(0.5, `rgba(0, 8, 7, ${(0.28 + b.archDepth * 0.55).toFixed(2)})`);
  grad.addColorStop(1, "rgba(0, 10, 9, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(midX - gW, spY, gW * 2, spH);

  ctx.strokeStyle = offsetMode === "center" ? "#FF846B" : "rgba(240, 175, 3, 0.5)";
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(midX - swallowPx, spY);
  ctx.lineTo(midX - swallowPx, spY + spH);
  ctx.moveTo(midX + swallowPx, spY);
  ctx.lineTo(midX + swallowPx, spY + spH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(241, 231, 212, 0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(spX, spY, spW, spH);

  // 下半部分：实体书页侧面剖面弧线（直观展示为什么胶装会吃掉 14mm！）
  const botTop = topH + 6;
  const botH = height - botTop - 12;
  ctx.strokeStyle = "rgba(241, 231, 212, 0.14)";
  ctx.beginPath();
  ctx.moveTo(padX, botTop);
  ctx.lineTo(width - padX, botTop);
  ctx.stroke();

  ctx.fillStyle = "#F5C438";
  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`CROSS-SECTION · 开合角 ${b.angleDeg}° / 吞图槽 ±${b.swallowMm}mm`, padX, botTop + 8);

  const baseY = height - 18;
  const dipY = baseY - 4;
  const peakLift = Math.max(18, Math.min(botH - 36, 12 + b.archDepth * 42));
  const leftEdge = spX;
  const rightEdge = spX + spW;

  // 纸叠基底厚度块
  ctx.fillStyle = "rgba(241, 231, 212, 0.14)";
  ctx.fillRect(leftEdge, baseY - 4, spW, 5);

  // 左右书页拱起曲线
  ctx.strokeStyle = "#F1E7D4";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(leftEdge, baseY - peakLift * 0.45);
  ctx.bezierCurveTo(
    leftEdge + spW * 0.28, baseY - peakLift * 1.12,
    midX - spW * 0.12, baseY - peakLift * 0.92,
    midX, dipY
  );
  ctx.bezierCurveTo(
    midX + spW * 0.12, baseY - peakLift * 0.92,
    rightEdge - spW * 0.28, baseY - peakLift * 1.12,
    rightEdge, baseY - peakLift * 0.45
  );
  ctx.stroke();

  // 中缝不可见谷底红区标记
  ctx.fillStyle = "rgba(201, 53, 34, 0.42)";
  ctx.fillRect(midX - swallowPx, baseY - peakLift * 0.85, swallowPx * 2, peakLift * 0.85);

  // 焦心在纸面弧线上的落点小圆
  const dotX = offsetMode === "center" ? midX : spX + spW * 0.72;
  const dotY = offsetMode === "center" ? dipY - 3 : baseY - peakLift * 0.86;
  ctx.fillStyle = offsetMode === "center" ? "#FF846B" : "#6FE3B5";
  ctx.beginPath();
  ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#001F1D";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
