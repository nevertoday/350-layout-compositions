// 152 蒙太奇版式 · 2D Canvas 活体剪辑台绘制引擎
// 严格读取 model.js 的 computeFrameRects / diagnose 单真源数据，1:1 化用 152 原海报暗房视觉语言。
// 零 shadowBlur / 零逐帧 createPattern，确保手机软件渲染 6× 降速下依然 50–60fps。

import { PALETTE, computeFrameRects, diagnose } from "./model.js";

function getToneColors(tone) {
  if (tone === "dark") {
    return {
      bg: "#121110",
      fg: "#F2E1CB",
      sub: "rgba(242, 225, 203, 0.55)",
      shapeA: "#551014",
      shapeB: "#F2E1CB",
      grid: "rgba(242, 225, 203, 0.14)",
      border: "#2B2623",
    };
  }
  if (tone === "maroon") {
    return {
      bg: "#551014",
      fg: "#F5E7D5",
      sub: "rgba(245, 231, 213, 0.62)",
      shapeA: "#141110",
      shapeB: "#DFC7AD",
      grid: "rgba(245, 231, 213, 0.15)",
      border: "#3D0A0D",
    };
  }
  return {
    bg: "#F6E9D6",
    fg: "#121110",
    sub: "rgba(18, 17, 16, 0.56)",
    shapeA: "#551014",
    shapeB: "#151312",
    grid: "rgba(85, 16, 20, 0.14)",
    border: "#CCB69A",
  };
}

// 绘制单帧的出版级图形母题（均严格不画人物五官！）
function drawMotif(ctx, frame, w, h, colors) {
  ctx.save();
  const m = frame.motif;

  if (m === "circles") {
    // 152 原海报右上：深红大圆 + 暖米小圆 + 纤细贝塞尔双弧线
    ctx.fillStyle = colors.shapeA;
    ctx.beginPath();
    ctx.arc(w * 0.64, h * 0.44, Math.min(w, h) * 0.34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.shapeB;
    ctx.beginPath();
    ctx.arc(w * 0.80, h * 0.68, Math.min(w, h) * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colors.fg;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = Math.max(1, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.92);
    ctx.bezierCurveTo(w * 0.30, h * 0.28, w * 0.68, h * 0.54, w * 0.96, h * 0.14);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.72);
    ctx.bezierCurveTo(w * 0.46, h * 0.76, w * 0.56, h * 0.18, w * 0.94, h * 0.28);
    ctx.stroke();

    // 左上微排版三短行（呼应「信息拼接 / 构建层次 / 讲述内容」）
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = colors.fg;
    ctx.fillRect(w * 0.09, h * 0.14, w * 0.24, Math.max(2, h * 0.025));
    ctx.fillRect(w * 0.09, h * 0.21, w * 0.19, Math.max(2, h * 0.025));
    ctx.fillRect(w * 0.09, h * 0.28, w * 0.22, Math.max(2, h * 0.025));
    ctx.fillRect(w * 0.09, h * 0.36, w * 0.10, 1.5);
  } else if (m === "dots") {
    // 152 原海报中上：细微点阵（单路径批量填充，零多次 fill 损耗）+ 切边半圆弧
    ctx.fillStyle = colors.fg;
    ctx.globalAlpha = 0.45;
    const cols = 8, rows = 5;
    const dr = Math.max(1.2, w * 0.007);
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = w * (0.14 + c * 0.10);
        const dy = h * (0.14 + r * 0.085);
        ctx.rect(dx - dr, dy - dr, dr * 2, dr * 2);
      }
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.shapeB;
    ctx.beginPath();
    ctx.arc(w * 0.06, h * 0.76, Math.min(w, h) * 0.44, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();

    // 侧边酒红几何切块
    ctx.fillStyle = colors.shapeA;
    ctx.fillRect(w * 0.56, h * 0.58, w * 0.34, h * 0.32);
  } else if (m === "contour") {
    // 152 原海报左下等高线（合并路径一次描边）+ 金句引号
    ctx.strokeStyle = colors.fg;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = Math.max(1, w * 0.006);
    ctx.beginPath();
    for (let k = 1; k <= 6; k++) {
      const rr = Math.min(w, h) * (0.15 + k * 0.085);
      ctx.moveTo(w * 0.14 + Math.cos(-Math.PI * 0.6) * rr * 1.15, h * 0.92 + Math.sin(-Math.PI * 0.6) * rr * 0.82);
      ctx.ellipse(w * 0.14, h * 0.92, rr * 1.15, rr * 0.82, -0.25, -Math.PI * 0.6, 0.1);
    }
    for (let k = 1; k <= 4; k++) {
      const rr = Math.min(w, h) * (0.12 + k * 0.08);
      ctx.moveTo(w * 0.90 + Math.cos(Math.PI * 0.4) * rr * 0.9, h * 0.18 + Math.sin(Math.PI * 0.4) * rr * 1.1);
      ctx.ellipse(w * 0.90, h * 0.18, rr * 0.9, rr * 1.1, 0.2, Math.PI * 0.4, Math.PI * 1.2);
    }
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = colors.fg;
    ctx.font = `700 ${Math.max(18, Math.round(h * 0.22))}px "DM Serif Display", Georgia, serif`;
    ctx.fillText("“", w * 0.10, h * 0.32);
    ctx.fillRect(w * 0.12, h * 0.42, w * 0.58, Math.max(3, h * 0.036));
    ctx.fillRect(w * 0.12, h * 0.51, w * 0.44, Math.max(3, h * 0.036));
    ctx.fillStyle = PALETTE.amber;
    ctx.fillRect(w * 0.12, h * 0.62, w * 0.16, Math.max(2, h * 0.018));
  } else if (m === "xpeak") {
    // 152 原海报右下：方格网（单路径批量描边）+ 双三角几何山峰 + 斜裁直线
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    const step = Math.max(16, Math.round(Math.min(w, h) / 6));
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();
    // 几何山峰剪影
    ctx.fillStyle = colors.shapeB;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.94);
    ctx.lineTo(w * 0.34, h * 0.40);
    ctx.lineTo(w * 0.72, h * 0.94);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.shapeA;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.94);
    ctx.lineTo(w * 0.88, h * 0.46);
    ctx.lineTo(w * 0.94, h * 0.94);
    ctx.closePath();
    ctx.fill();

    // 细长斜切线
    ctx.strokeStyle = colors.fg;
    ctx.globalAlpha = 0.68;
    ctx.lineWidth = Math.max(1.2, w * 0.007);
    ctx.beginPath();
    ctx.moveTo(w * 0.28, h * 0.86);
    ctx.lineTo(w * 0.82, h * 0.24);
    ctx.stroke();
  } else if (m === "silhouette") {
    // 城市剧本：门框 + 极简无五官人像背影剪影
    ctx.strokeStyle = colors.fg;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(1.5, w * 0.008);
    ctx.strokeRect(w * 0.18, h * 0.14, w * 0.64, h * 0.78);
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.shapeB;
    // 无五官圆头 + 流畅肩背剪影
    ctx.beginPath();
    ctx.arc(w * 0.50, h * 0.42, Math.min(w, h) * 0.125, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.26, h * 0.92);
    ctx.quadraticCurveTo(w * 0.28, h * 0.58, w * 0.50, h * 0.57);
    ctx.quadraticCurveTo(w * 0.72, h * 0.58, w * 0.74, h * 0.92);
    ctx.closePath();
    ctx.fill();
  } else if (m === "rain") {
    // 冷雨楼宇
    ctx.fillStyle = colors.shapeB;
    ctx.fillRect(w * 0.10, h * 0.28, w * 0.26, h * 0.66);
    ctx.fillStyle = colors.shapeA;
    ctx.fillRect(w * 0.39, h * 0.16, w * 0.30, h * 0.78);
    ctx.fillStyle = colors.shapeB;
    ctx.fillRect(w * 0.72, h * 0.38, w * 0.18, h * 0.56);
    // 窗户微格与斜雨线
    ctx.strokeStyle = colors.fg;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 11; i++) {
      const rx = w * (0.06 + i * 0.09);
      ctx.beginPath();
      ctx.moveTo(rx, h * 0.06);
      ctx.lineTo(rx - w * 0.12, h * 0.88);
      ctx.stroke();
    }
  } else if (m === "clock") {
    // 失速时钟
    const cx = w * 0.52, cy = h * 0.52, rad = Math.min(w, h) * 0.34;
    ctx.strokeStyle = colors.fg;
    ctx.lineWidth = Math.max(1.8, w * 0.012);
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rad * 0.82, cy + Math.sin(a) * rad * 0.82);
      ctx.lineTo(cx + Math.cos(a) * rad * 0.96, cy + Math.sin(a) * rad * 0.96);
      ctx.stroke();
    }
    ctx.strokeStyle = colors.shapeA === colors.bg ? colors.fg : PALETTE.maroonBright;
    ctx.lineWidth = Math.max(2.4, w * 0.016);
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx - rad * 0.55, cy - rad * 0.35);
    ctx.moveTo(cx, cy); ctx.lineTo(cx + rad * 0.72, cy - rad * 0.22);
    ctx.stroke();
  } else if (m === "window") {
    // 暗街屋脊 + 破晓斜光
    ctx.fillStyle = colors.shapeB;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.52);
    ctx.lineTo(w * 0.36, h * 0.36);
    ctx.lineTo(w * 0.62, h * 0.56);
    ctx.lineTo(w, h * 0.42);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    // 暖窗格框
    ctx.strokeStyle = colors.fg;
    ctx.lineWidth = Math.max(1.5, w * 0.01);
    ctx.strokeRect(w * 0.56, h * 0.22, w * 0.24, h * 0.32);
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.22); ctx.lineTo(w * 0.68, h * 0.54);
    ctx.moveTo(w * 0.56, h * 0.38); ctx.lineTo(w * 0.80, h * 0.38);
    ctx.stroke();
  } else if (m === "arch") {
    // 复古刊页：古典拱门
    ctx.strokeStyle = colors.fg;
    ctx.lineWidth = Math.max(1.6, w * 0.01);
    for (let k = 0; k < 3; k++) {
      const pad = 0.16 + k * 0.08;
      ctx.beginPath();
      ctx.moveTo(w * pad, h * 0.90);
      ctx.lineTo(w * pad, h * 0.46);
      ctx.arc(w * 0.5, h * 0.46, w * (0.5 - pad), Math.PI, 0);
      ctx.lineTo(w * (1 - pad), h * 0.90);
      ctx.stroke();
    }
    ctx.fillStyle = colors.shapeA;
    ctx.fillRect(w * 0.12, h * 0.86, w * 0.76, h * 0.06);
  } else if (m === "gear") {
    // 工业齿环 + 网点
    const cx = w * 0.54, cy = h * 0.52, rOuter = Math.min(w, h) * 0.33, rInner = rOuter * 0.72;
    ctx.fillStyle = colors.shapeB;
    ctx.beginPath();
    const teeth = 10;
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? rOuter : rInner;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (m === "press") {
    // 号外铅排栏条
    ctx.fillStyle = colors.fg;
    ctx.fillRect(w * 0.10, h * 0.16, w * 0.80, h * 0.12);
    ctx.fillStyle = colors.shapeA;
    ctx.fillRect(w * 0.10, h * 0.34, w * 0.38, h * 0.48);
    ctx.fillStyle = colors.fg;
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(w * 0.54, h * (0.36 + i * 0.095), w * (i % 2 ? 0.32 : 0.36), Math.max(2.5, h * 0.032));
    }
  } else if (m === "wedge") {
    // 构成主义斜楔（致敬利西茨基构图语言）
    ctx.fillStyle = colors.shapeB;
    ctx.beginPath();
    ctx.arc(w * 0.66, h * 0.54, Math.min(w, h) * 0.30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.shapeA;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.24);
    ctx.lineTo(w * 0.72, h * 0.56);
    ctx.lineTo(w * 0.18, h * 0.76);
    ctx.closePath();
    ctx.fill();
  }

  // 焦糖琥珀橘视觉爆点：复刻 152 原海报招牌干笔触大 X + 落日圆
  if (frame.accent) {
    ctx.globalAlpha = 1;
    const isPeak = m === "xpeak" || m === "window" || m === "wedge";
    // 琥珀落日圆
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(w * 0.74, h * 0.28, Math.min(w, h) * (isPeak ? 0.125 : 0.10), 0, Math.PI * 2);
    ctx.fill();

    // 干笔触焦糖橘大 X（多层错位粗笔划模拟原海报笔刷肌理）
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineCap = "square";
    const x1 = w * 0.24, y1 = h * 0.24, x2 = w * 0.76, y2 = h * 0.78;
    const bw = Math.max(5, Math.min(w, h) * 0.088);
    ctx.lineWidth = bw;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x2, y1); ctx.lineTo(x1, y2);
    ctx.stroke();

    // 干刷飞白细痕
    ctx.strokeStyle = "#F7B552";
    ctx.lineWidth = Math.max(1.5, bw * 0.22);
    ctx.beginPath();
    ctx.moveTo(x1 - 2, y1 + 3); ctx.lineTo(x2 - 2, y2 + 2);
    ctx.moveTo(x2 + 2, y1 + 2); ctx.lineTo(x1 + 2, y2 - 2);
    ctx.stroke();
  }

  ctx.restore();
}

// 绘制单张剪辑帧（含纸张投影、锯齿局部撕边、编号角章、选中高亮）
function drawFrameCard(ctx, r, W, H, state, diag, introT) {
  const px = r.x * W;
  const py = r.y * H;
  const pw = r.w * W;
  const ph = r.h * H;
  const cx = r.cx * W;
  const cy = r.cy * H;

  // 开场平滑飞入（0.0 -> 1.0，任意时刻都完整可读）
  const stagger = Math.max(0, Math.min(1, (introT - r.idx * 0.08) / 0.55));
  const ease = 1 - Math.pow(1 - stagger, 3);
  const enterY = (1 - ease) * 16;

  const colors = getToneColors(r.tone);
  const isSelected = state.activeId === r.id;

  ctx.save();
  ctx.translate(cx, cy + enterY);
  ctx.rotate((r.angle * Math.PI) / 180);
  ctx.translate(-pw / 2, -ph / 2);

  // 锐利双层印刷叠影（替代昂贵的 shadowBlur 高斯模糊，兼顾出版美感与软件渲染 60fps）
  const offX = 4 + state.splice * 4;
  const offY = 5 + state.splice * 4;
  ctx.fillStyle = "rgba(18, 12, 8, 0.18)";
  ctx.fillRect(offX, offY, pw, ph);

  // 若为 bridge 帧，右缘模拟 152 原海报经典锯齿局部撕边
  ctx.fillStyle = colors.bg;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(pw, 0);
  if (r.role === "bridge") {
    const steps = 14;
    for (let s = 1; s < steps; s++) {
      const sy = (s / steps) * ph;
      const sx = pw - (s % 2 === 0 ? 0 : Math.min(5, pw * 0.025));
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(pw, ph);
  } else {
    ctx.lineTo(pw, ph);
  }
  ctx.lineTo(0, ph);
  ctx.closePath();
  ctx.fill();

  // 画内部图案（裁切在片框内）
  ctx.save();
  ctx.clip();
  drawMotif(ctx, r, pw, ph, colors);
  ctx.restore();

  // 锋利 0px 裁切框线
  ctx.strokeStyle = isSelected ? PALETTE.amberBright : colors.border;
  ctx.lineWidth = isSelected ? 2.5 : 1;
  ctx.strokeRect(0.5, 0.5, pw - 1, ph - 1);

  // 高亮六维诊断时的专属标线
  if (state.highlightMetric === "rhythm") {
    ctx.strokeStyle = PALETTE.amberBright;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(4, 4, pw - 8, ph - 8);
    ctx.setLineDash([]);
  }

  // 左上胶片序章 + 帧名条（暗条白字保证极高对比度）
  const tagH = Math.max(19, Math.min(24, H * 0.056));
  ctx.fillStyle = isSelected ? PALETTE.amber : "rgba(18, 17, 16, 0.88)";
  ctx.fillRect(0, 0, Math.min(pw, Math.max(88, pw * 0.62)), tagH);

  ctx.fillStyle = isSelected ? "#0A0B0A" : "#FAF3E8";
  ctx.font = `600 ${Math.max(10, Math.round(tagH * 0.54))}px "IBM Plex Mono", "Noto Serif SC", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(`0${r.idx + 1} ${r.name}`, 7, tagH * 0.53);

  // 右下尺度徽（L/M/S）
  const badgeW = 22;
  ctx.fillStyle = r.accent ? PALETTE.amber : "rgba(85, 16, 20, 0.90)";
  ctx.fillRect(pw - badgeW, ph - tagH + 1, badgeW, tagH - 1);
  ctx.fillStyle = r.accent ? "#0A0B0A" : "#FAF3E8";
  ctx.font = `700 ${Math.max(10, Math.round(tagH * 0.54))}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(r.scale, pw - badgeW / 2, ph - tagH / 2 + 1);
  ctx.textAlign = "left";

  // 选中态四角裁切括号
  if (isSelected) {
    const k = 10;
    ctx.strokeStyle = PALETTE.amberBright;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-4, k); ctx.lineTo(-4, -4); ctx.lineTo(k, -4);
    ctx.moveTo(pw - k, -4); ctx.lineTo(pw + 4, -4); ctx.lineTo(pw + 4, k);
    ctx.moveTo(pw + 4, ph - k); ctx.lineTo(pw + 4, ph + 4); ctx.lineTo(pw - k, ph + 4);
    ctx.moveTo(k, ph + 4); ctx.lineTo(-4, ph + 4); ctx.lineTo(-4, ph - k);
    ctx.stroke();
  }

  ctx.restore();
}

// 绘制真实咬合接缝处的斜贴焦糖赭橘胶带（152 原海报招牌细节！）或断裂/糊死提示
function drawSpliceDetails(ctx, W, H, state, diag) {
  ctx.save();
  const { joints, overlapPct, maxCoreOccludedPct } = diag;

  if (joints.length === 0 || overlapPct < 10) {
    // 0% 零叠合错态：在中间十字白缝里标示「断缝·各自孤立」
    ctx.strokeStyle = "rgba(179, 38, 30, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.08); ctx.lineTo(W * 0.5, H * 0.92);
    ctx.moveTo(W * 0.08, H * 0.5); ctx.lineTo(W * 0.92, H * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    const pillW = Math.min(188, W * 0.44);
    const pillH = 26;
    ctx.fillStyle = "#551014";
    ctx.fillRect(W * 0.5 - pillW / 2, H * 0.5 - pillH / 2, pillW, pillH);
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 1;
    ctx.strokeRect(W * 0.5 - pillW / 2 + 0.5, H * 0.5 - pillH / 2 + 0.5, pillW - 1, pillH - 1);
    ctx.fillStyle = "#FAF3E8";
    ctx.font = `600 12px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("零叠合 · 退化为四格平铺", W * 0.5, H * 0.5 + 0.5);
    ctx.restore();
    return;
  }

  // 在前 2 处最显著接缝斜贴焦糖赭橘胶带（呼应 152 原海报中间那条经典橘胶带）
  const shown = joints.slice(0, 3);
  shown.forEach((j, idx) => {
    const bx = (j.box.x + j.box.w * 0.5) * W;
    const by = (j.box.y + j.box.h * 0.5) * H;
    const isCrush = maxCoreOccludedPct > 34 || overlapPct > 42;

    if (state.highlightMetric === "layering" || state.highlightMetric === "fragment" || isCrush) {
      ctx.fillStyle = isCrush ? "rgba(179, 38, 30, 0.24)" : "rgba(226, 129, 21, 0.22)";
      ctx.fillRect(j.box.x * W, j.box.y * H, j.box.w * W, j.box.h * H);
      ctx.strokeStyle = isCrush ? "#FF7D73" : PALETTE.amber;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(j.box.x * W, j.box.y * H, j.box.w * W, j.box.h * H);
      ctx.setLineDash([]);
    }

    if (!isCrush && idx < 2) {
      // 斜贴半透明焦糖赭橘纸胶带
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(idx === 0 ? 0.26 : -0.32);
      const tw = Math.max(36, Math.min(58, W * 0.08));
      const th = Math.max(12, Math.min(18, H * 0.036));
      ctx.fillStyle = "rgba(205, 117, 42, 0.88)";
      ctx.fillRect(-tw / 2, -th / 2, tw, th);
      ctx.fillStyle = "rgba(255, 244, 224, 0.22)";
      ctx.fillRect(-tw / 2 + 2, -th / 2 + 2, tw - 4, 2);
      ctx.restore();
    }
  });

  if (maxCoreOccludedPct > 34 || overlapPct > 42) {
    const pillW = Math.min(204, W * 0.48);
    const pillH = 26;
    ctx.fillStyle = "#8C1915";
    ctx.fillRect(W * 0.5 - pillW / 2, H * 0.5 - pillH / 2, pillW, pillH);
    ctx.fillStyle = "#FAF3E8";
    ctx.font = `600 12px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`叠压过猛 · 核心被遮 ${maxCoreOccludedPct}%`, W * 0.5, H * 0.5 + 0.5);
  }

  ctx.restore();
}

// 绘制 ①→②→③→④ 蒙太奇叙事视线折线
function drawNarrativePath(ctx, W, H, state, diag) {
  if (!state.showLines && state.highlightMetric !== "narrative" && state.highlightMetric !== "juxtaposition") {
    return;
  }
  const { rects, order } = diag;
  ctx.save();
  const isBroken = !order.ok;
  ctx.strokeStyle = isBroken ? "#D93829" : "#E28115";
  ctx.lineWidth = 2.1;
  ctx.setLineDash(isBroken ? [7, 5] : []);

  ctx.beginPath();
  rects.forEach((r, i) => {
    const x = r.cx * W;
    const y = r.cy * H;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // 方向箭头 + 编号圆点
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const x = r.cx * W;
    const y = r.cy * H;

    if (i < rects.length - 1) {
      const nx = rects[i + 1].cx * W;
      const ny = rects[i + 1].cy * H;
      const mx = (x + nx) * 0.5;
      const my = (y + ny) * 0.5;
      const ang = Math.atan2(ny - y, nx - x);
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang);
      ctx.fillStyle = isBroken ? "#D93829" : "#E28115";
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-5, -4.5);
      ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 序号实心圆章
    ctx.fillStyle = isBroken ? "#8C1915" : "#121110";
    ctx.beginPath();
    ctx.arc(x, y, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isBroken ? "#FF9E94" : PALETTE.amberBright;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = "#FAF3E8";
    ctx.font = `700 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), x, y + 0.5);
  }
  ctx.restore();
}

export function renderMontageStage(canvas, state, introT = 1) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const isMobile = window.innerWidth <= 680;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(280, Math.round(rect.width));
  const H = Math.max(210, Math.round(rect.height));
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. 暖旧相纸台面底色（逐像素采自 152 原海报 #F2E1CB）
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);

  // 原海报装饰 DNA：左上小酒红切条 + 右上细黑红点阵（单路径批量填充）+ 四角印刷裁切角规
  ctx.fillStyle = PALETTE.maroon;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W * 0.24, 0);
  ctx.lineTo(W * 0.20, 8);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(85,16,20,0.38)";
  ctx.beginPath();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      ctx.rect(W - 15 - col * 9, 13 + row * 8, 2.5, 2.5);
    }
  }
  ctx.fill();

  // 印刷裁切角规（四边微细刻度线）
  ctx.strokeStyle = "rgba(85, 16, 20, 0.24)";
  ctx.lineWidth = 1;
  const cm = 12;
  ctx.beginPath();
  ctx.moveTo(8, 8 + cm); ctx.lineTo(8, 8); ctx.lineTo(8 + cm, 8);
  ctx.moveTo(W - 8 - cm, H - 8); ctx.lineTo(W - 8, H - 8); ctx.lineTo(W - 8, H - 8 - cm);
  ctx.moveTo(8, H - 8 - cm); ctx.lineTo(8, H - 8); ctx.lineTo(8 + cm, H - 8);
  ctx.stroke();

  // 2. 从单真源算几何与诊断
  const diag = diagnose(state);

  // 3. 逐层绘制 4 枚蒙太奇剪辑帧
  for (const r of diag.rects) {
    drawFrameCard(ctx, r, W, H, state, diag, introT);
  }

  // 4. 绘制真实接缝胶带或错态热区
  drawSpliceDetails(ctx, W, H, state, diag);

  // 5. 绘制 ①→②→③→④ 叙事连线
  drawNarrativePath(ctx, W, H, state, diag);

  // 6. 左下暗房时间码水印（纯功能读数，高对比度暗条）
  const footerText = `SPLICE ${diag.overlapPct}% · RATIO ${diag.scaleRatio.toFixed(1)}× · ${diag.passedCount}/4`;
  ctx.fillStyle = "rgba(18, 17, 16, 0.88)";
  ctx.fillRect(10, H - 28, Math.min(W - 20, 224), 20);
  ctx.fillStyle = "#FAF3E8";
  ctx.font = `500 10.5px "IBM Plex Mono", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(footerText, 17, H - 18);

  ctx.restore();
  return diag;
}

// 命中测试：按绘制逆序（最顶层优先）找被点中/拖中的帧
export function hitTestFrame(state, normX, normY) {
  const rects = computeFrameRects(state);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (normX >= r.x && normX <= r.x + r.w && normY >= r.y && normY <= r.y + r.h) {
      return r;
    }
  }
  return null;
}
