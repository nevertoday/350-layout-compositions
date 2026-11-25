// 161 章节扉页 · 活体双页摊开书台与真实 2.5D 卷页过渡渲染器
// 所有几何尺寸、墨水层、拱门开合角与可点击纠错红标全部从 model.js 实算状态导出。

import { pixelRatio } from "../../lib/stage.js";

// 预生成原海报左下陶红点丘（确定性哈希，零帧内抖动、极速绘制）
const STIPPLE_DOTS = (() => {
  const dots = [];
  let seed = 1612026;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 240; i++) {
    const a = rand() * Math.PI * 0.56;
    const r = Math.sqrt(rand());
    const nx = Math.cos(a) * r; // 0..1 from bottom-left
    const ny = Math.sin(a) * r; // 0..1 upward from bottom-left
    dots.push({ nx, ny, sz: 0.75 + rand() * 0.9, tone: rand() > 0.45 ? 0 : 1 });
  }
  return dots;
})();

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function roundRectPath(ctx, x, y, w, h, r) {
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

// 绘制一片拟真的密排书页正文块（用于上章末页、下章正文及接排错态）
function drawDenseTextBlock(ctx, x, y, w, h, { ink, lineGap, firstIndent = true, rows = 14, seed = 1, alpha = 0.72 }) {
  ctx.save();
  ctx.fillStyle = ink;
  ctx.globalAlpha = alpha;
  const lh = Math.max(4.5, lineGap);
  const barH = Math.max(2.1, lh * 0.38);
  let cy = y;
  for (let i = 0; i < rows && cy + barH <= y + h; i++) {
    const isParaStart = i === 0 || i === 5 || i === 10;
    const isParaEnd = i === 4 || i === 9 || i === rows - 1;
    const ind = isParaStart && firstIndent ? Math.min(14, w * 0.09) : 0;
    const lenRatio = isParaEnd ? 0.56 + ((i * 19 + seed * 13) % 24) / 100 : 0.92 + ((i * 11 + seed * 7) % 8) / 100;
    const lw = Math.max(12, (w - ind) * Math.min(1, lenRatio));
    ctx.fillRect(x + ind, cy, lw, barH);
    cy += lh + (isParaEnd ? lh * 0.42 : 0);
  }
  ctx.restore();
}

// 绘制上一章密排正文整页（左页或右页）
function drawPrevChapterPage(ctx, px, py, pw, ph, side, theme) {
  ctx.fillStyle = theme.paper;
  ctx.fillRect(px, py, pw, ph);

  const mX = pw * 0.12;
  const mTop = ph * 0.085;
  const textW = pw - mX * 2;
  // 旧书眉
  ctx.fillStyle = theme.mutedInk;
  ctx.globalAlpha = 0.72;
  ctx.font = `500 ${Math.max(8, pw * 0.032)}px "Noto Serif SC", serif`;
  ctx.textBaseline = "top";
  if (side === "left") {
    ctx.textAlign = "left";
    ctx.fillText("18", px + mX, py + mTop * 0.55);
    ctx.textAlign = "right";
    ctx.fillText(theme.bookTitle, px + pw - mX, py + mTop * 0.55);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(theme.prevChapter, px + mX, py + mTop * 0.55);
    ctx.textAlign = "right";
    ctx.fillText("19", px + pw - mX, py + mTop * 0.55);
  }
  ctx.strokeStyle = theme.arch;
  ctx.globalAlpha = 0.24;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + mX, py + mTop * 1.15);
  ctx.lineTo(px + pw - mX, py + mTop * 1.15);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 密排正文（46% 灰度视觉感受）
  const bodyTop = py + ph * 0.14;
  const bodyH = ph * 0.76;
  drawDenseTextBlock(ctx, px + mX, bodyTop, textW, bodyH, {
    ink: theme.ink,
    lineGap: ph * 0.036,
    firstIndent: true,
    rows: 20,
    seed: side === "left" ? 3 : 7,
    alpha: 0.64,
  });

  // 底部淡注
  ctx.fillStyle = theme.accentDeep;
  ctx.globalAlpha = 0.85;
  ctx.font = `600 ${Math.max(8, pw * 0.03)}px "Archivo", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("上一章密排正文 · 灰度 46%", px + pw / 2, py + ph - ph * 0.065);
  ctx.globalAlpha = 1;
}

// 绘制下一章正文起页（向右掀页预览）
function drawNextChapterPage(ctx, px, py, pw, ph, side, theme) {
  ctx.fillStyle = theme.paperBright;
  ctx.fillRect(px, py, pw, ph);

  const mX = pw * 0.12;
  const mTop = ph * 0.085;
  ctx.fillStyle = theme.mutedInk;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 ${Math.max(8, pw * 0.032)}px "Noto Serif SC", serif`;
  ctx.textBaseline = "top";
  if (side === "left") {
    ctx.textAlign = "left";
    ctx.fillText("22", px + mX, py + mTop * 0.55);
    ctx.textAlign = "right";
    ctx.fillText(theme.bookTitle, px + pw - mX, py + mTop * 0.55);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(theme.nextChapterTitle, px + mX, py + mTop * 0.55);
    ctx.textAlign = "right";
    ctx.fillText("23", px + pw - mX, py + mTop * 0.55);
  }
  ctx.strokeStyle = theme.arch;
  ctx.globalAlpha = 0.24;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + mX, py + mTop * 1.15);
  ctx.lineTo(px + pw - mX, py + mTop * 1.15);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 新章正文开篇（呼应新章主题，微带一点松绿小节标）
  const bodyTop = py + ph * 0.145;
  ctx.fillStyle = theme.arch;
  ctx.fillRect(px + mX, bodyTop, 16, 2.5);
  drawDenseTextBlock(ctx, px + mX, bodyTop + 12, pw - mX * 2, ph * 0.72, {
    ink: theme.ink,
    lineGap: ph * 0.037,
    firstIndent: true,
    rows: 18,
    seed: side === "left" ? 11 : 17,
    alpha: 0.62,
  });

  ctx.fillStyle = theme.arch;
  ctx.globalAlpha = 0.85;
  ctx.font = `600 ${Math.max(8, pw * 0.03)}px "Archivo", "Noto Serif SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("新章正文续页 · 灰度 44%", px + pw / 2, py + ph - ph * 0.065);
  ctx.globalAlpha = 1;
}

// 在右页（或跨页右侧）绘制 1:1 承袭 161 原海报的深松绿拱门 + 推开墨黑门扇 + 光束射线 + 陶红四角星
function drawPosterArchway(ctx, rx, ry, rw, rh, evalData, theme, time) {
  const { doorOpen, state } = evalData;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();

  // 拱门整体坐标（紧贴右页偏右，承袭 161 原海报高耸拱门比例）
  const archW = rw * 0.84;
  const archX = rx + rw - archW + rw * 0.04;
  const archR = archW * 0.5;
  const archTopY = ry + rh * 0.09;
  const archCenterX = archX + archR;
  const archSpringY = archTopY + archR * 0.86;
  const floorY = ry + rh * 0.80;

  // 1. 深松绿拱门建筑外廓
  ctx.fillStyle = theme.arch;
  ctx.beginPath();
  ctx.moveTo(archX, floorY);
  ctx.lineTo(archX, archSpringY);
  ctx.ellipse(archCenterX, archSpringY, archR, archR * 0.86, 0, Math.PI, 0, false);
  ctx.lineTo(archX + archW, floorY + rh * 0.14);
  ctx.lineTo(archX, floorY);
  ctx.closePath();
  ctx.fill();

  // 2. 门洞内暖奶亮光（推门越开，门内光面越敞亮宽阔）
  const portalLeft = archX + archW * 0.21;
  const portalW = archW * (0.20 + doorOpen * 0.27);
  const portalTopLeftY = ry + rh * 0.34;
  const portalTopRightY = portalTopLeftY - rh * (0.045 + doorOpen * 0.025);
  const portalBotLeftY = floorY - rh * 0.03;
  const portalBotRightY = floorY + rh * 0.025;

  // 轻微呼吸微光
  const glowShift = Math.sin(time * 1.4) * 0.03;
  const glowGrad = ctx.createLinearGradient(portalLeft, portalTopLeftY, portalLeft + portalW, portalBotRightY);
  glowGrad.addColorStop(0, theme.doorGlow);
  glowGrad.addColorStop(1, theme.paperBright);
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.moveTo(portalLeft, portalTopLeftY);
  ctx.lineTo(portalLeft + portalW, portalTopRightY);
  ctx.lineTo(portalLeft + portalW, portalBotRightY);
  ctx.lineTo(portalLeft, portalBotLeftY);
  ctx.closePath();
  ctx.fill();

  // 3. 门缝倾泻到地面的光梯形与细线透视射线（1:1 原海报核心视觉母题）
  const rayAlpha = clamp(0.16 + doorOpen * 0.26 + glowShift, 0.1, 0.48);
  const floorGrad = ctx.createLinearGradient(portalLeft, portalBotLeftY, rx, ry + rh);
  floorGrad.addColorStop(0, `rgba(247, 235, 220, ${0.78})`);
  floorGrad.addColorStop(1, `rgba(239, 218, 193, 0)`);
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(portalLeft, portalBotLeftY);
  ctx.lineTo(portalLeft + portalW, portalBotRightY);
  ctx.lineTo(portalLeft + portalW + rw * 0.12, ry + rh);
  ctx.lineTo(rx - rw * 0.18, ry + rh);
  ctx.closePath();
  ctx.fill();

  // 右下门影梯形
  ctx.fillStyle = "rgba(182, 152, 122, 0.42)";
  ctx.beginPath();
  ctx.moveTo(portalLeft + portalW, portalBotRightY);
  ctx.lineTo(rx + rw, ry + rh * 0.92);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(portalLeft + portalW + rw * 0.08, ry + rh);
  ctx.closePath();
  ctx.fill();

  // 细透视地面辐射线
  ctx.strokeStyle = theme.arch;
  ctx.globalAlpha = rayAlpha;
  ctx.lineWidth = 0.85;
  const rays = 11;
  for (let i = 0; i < rays; i++) {
    const f = i / (rays - 1);
    const sx = portalLeft + f * portalW * 0.18;
    const sy = portalBotLeftY + f * (portalBotRightY - portalBotLeftY) * 0.45;
    const ex = rx - rw * 0.04 + f * (rw * 0.44);
    const ey = ry + rh * 0.98;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 4. 推开的墨黑大门扇（透视斜顶，随 doorOpen 角度动态打开）
  const leafLeft = portalLeft + portalW;
  const leafTopRightY = ry + rh * (0.15 + (1 - doorOpen) * 0.11);
  const leafBotRightY = ry + rh * (0.93 - (1 - doorOpen) * 0.05);
  ctx.fillStyle = theme.doorLeaf;
  ctx.beginPath();
  ctx.moveTo(leafLeft, portalTopRightY);
  ctx.lineTo(rx + rw + 2, leafTopRightY);
  ctx.lineTo(rx + rw + 2, leafBotRightY);
  ctx.lineTo(leafLeft, portalBotRightY);
  ctx.closePath();
  ctx.fill();

  // 5. 原海报陶红弧线扫过拱门右上
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.25;
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.ellipse(archCenterX + archW * 0.34, archSpringY - archR * 0.25, archR * 0.86, archR * 0.84, -0.15, Math.PI * 0.62, Math.PI * 1.48);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 6. 黑门扇上的三行口号 + 陶红横杠 + 四角星 ✦（非空壳模式时展现）
  if (state.cueMode !== "empty" && rw > 120) {
    const mx = leafLeft + Math.max(12, (rx + rw - leafLeft) * 0.22);
    const my = ry + rh * 0.47;
    ctx.fillStyle = theme.doorGlow;
    ctx.font = `500 ${Math.max(8.5, rw * 0.036)}px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const motto = state.theme === "poster" ? ["新章节，", "新视角，", "新启程。"] : state.theme === "novel" ? ["潮汐之前，", "先听一页", "纸的静默。"] : ["新板块，", "新尺规，", "新视野。"];
    const stepY = Math.max(12, rh * 0.044);
    motto.forEach((line, idx) => ctx.fillText(line, mx, my + idx * stepY));

    const barY = my + motto.length * stepY + 8;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(mx, barY, Math.max(14, rw * 0.075), 1.6);

    // 四角星 ✦
    const sx = mx + Math.max(8, rw * 0.035);
    const sy = barY + Math.max(15, rh * 0.055);
    const sr = Math.max(5.5, rw * 0.028);
    ctx.beginPath();
    ctx.moveTo(sx, sy - sr);
    ctx.quadraticCurveTo(sx, sy, sx + sr, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy + sr);
    ctx.quadraticCurveTo(sx, sy, sx - sr, sy);
    ctx.quadraticCurveTo(sx, sy, sx, sy - sr);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 绘制当前正在编排的「第二章扉页跨页」（左页 Verso + 右页 Recto）
function drawCurrentOpeningSpread(ctx, lx, rx, py, pw, ph, evalData, time, hitRects) {
  const { state: s, theme } = evalData;

  // 纸面底色
  ctx.fillStyle = theme.paper;
  ctx.fillRect(lx, py, pw, ph);
  ctx.fillStyle = theme.paperBright;
  ctx.fillRect(rx, py, pw, ph);

  const mX = pw * 0.125;
  const mIn = pw * 0.14; // 靠书脊内边距略宽
  const headY = py + ph * 0.065;

  // --------- 1. 左页（Verso）绘制 ---------
  if (s.placement === "inline") {
    // 接排错态：左页满排上一章正文，左下角隐约透出被密排字压住的原海报陶红点丘
    drawPrevChapterPage(ctx, lx, py, pw, ph, "left", theme);
    ctx.save();
    ctx.beginPath();
    ctx.rect(lx, py, pw, ph);
    ctx.clip();
    const hillW = pw * 0.54;
    const hillH = ph * 0.18;
    for (let i = 0; i < STIPPLE_DOTS.length; i += 2) {
      const d = STIPPLE_DOTS[i];
      ctx.fillStyle = d.tone === 0 ? theme.accentDeep : theme.accent;
      ctx.globalAlpha = 0.32;
      ctx.fillRect(lx + d.nx * hillW, py + ph - d.ny * hillH, 1.2, 1.2);
    }
    ctx.restore();
  } else if (s.placement === "anypage") {
    // 平装另起新页：左页是上一章自然收尾的半页
    ctx.fillStyle = theme.mutedInk;
    ctx.globalAlpha = 0.7;
    ctx.font = `500 ${Math.max(8, pw * 0.03)}px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("20", lx + mX, headY * 0.96);
    ctx.textAlign = "right";
    ctx.fillText(theme.prevChapter, lx + pw - mIn, headY * 0.96);
    ctx.strokeStyle = theme.arch;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(lx + mX, py + ph * 0.11);
    ctx.lineTo(lx + pw - mIn, py + ph * 0.11);
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawDenseTextBlock(ctx, lx + mX, py + ph * 0.145, pw - mX - mIn, ph * 0.44, {
      ink: theme.ink,
      lineGap: ph * 0.036,
      firstIndent: true,
      rows: 10,
      seed: 9,
      alpha: 0.58,
    });
    // 上章收尾小菱符
    ctx.fillStyle = theme.arch;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(lx + (pw - 22) / 2, py + ph * 0.62, 22, 1.5);
    ctx.globalAlpha = 1;
  } else if (s.placement === "recto") {
    // 精装左空右启：大片干净呼吸左页，仅在中下留一枚淡陶红章序徽或微弧
    if (s.cueMode !== "empty") {
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(lx + pw * 0.52, py + ph * 0.54, pw * 0.19, Math.PI * 0.1, Math.PI * 1.45);
      ctx.stroke();
      ctx.fillStyle = theme.mutedInk;
      ctx.globalAlpha = 0.52;
      ctx.font = `italic 600 ${Math.max(10, pw * 0.05)}px "Cormorant Garamond", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(theme.chapterNum, lx + pw * 0.52, py + ph * 0.54);
      ctx.restore();
    }
    ctx.fillStyle = theme.mutedInk;
    ctx.globalAlpha = 0.5;
    ctx.font = `500 ${Math.max(8, pw * 0.028)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("VERSO · 静白呼吸页", lx + pw * 0.5, py + ph - ph * 0.045);
    ctx.globalAlpha = 1;
  } else if (s.placement === "spread" || s.placement === "gutter") {
    // 跨页门扉左页：1:1 原海报左下陶红点丘 + 6×7 黑点阵 + （spread 模式下）左页主标题与精炼导语
    ctx.save();
    ctx.beginPath();
    ctx.rect(lx, py, pw, ph);
    ctx.clip();
    // 陶红点丘
    const hillW = pw * 0.72;
    const hillH = ph * 0.25;
    for (const d of STIPPLE_DOTS) {
      const dx = lx + d.nx * hillW;
      const dy = py + ph - d.ny * hillH;
      ctx.fillStyle = d.tone === 0 ? theme.accentDeep : theme.accent;
      ctx.globalAlpha = d.tone === 0 ? 0.55 : 0.7;
      ctx.fillRect(dx, dy, d.sz * (pw / 240), d.sz * (pw / 240));
    }
    // 6×7 细墨点阵
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.52;
    const dotX0 = lx + mX;
    const dotY0 = py + ph * 0.56;
    const dotStep = Math.max(5.5, pw * 0.038);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.beginPath();
        ctx.arc(dotX0 + c * dotStep, dotY0 + r * dotStep, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    if (s.placement === "spread" && s.cueMode !== "empty") {
      const topY = py + ph * (0.07 + (s.sink / 100) * 0.62);
      // 深松绿顶短杠
      ctx.fillStyle = theme.arch;
      ctx.fillRect(lx + mX, topY - 12, Math.max(18, pw * 0.09), 3);

      const baseSize = Math.max(9.5, pw * 0.036);
      const titleSize = clamp(baseSize * s.scale, 11, pw * 0.165);
      ctx.fillStyle = theme.ink;
      ctx.font = `900 ${titleSize}px "Noto Serif SC", serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(theme.title, lx + mX, topY);

      const subY = topY + titleSize * 1.18;
      ctx.fillStyle = theme.arch;
      ctx.font = `700 ${Math.max(7.5, pw * 0.03)}px "Archivo", sans-serif`;
      ctx.fillText(theme.subtitleEn, lx + mX, subY);

      ctx.fillStyle = theme.arch;
      ctx.fillRect(lx + mX, subY + Math.max(12, pw * 0.048), Math.max(18, pw * 0.085), 1.6);

      const cueY = subY + Math.max(22, pw * 0.085);
      if (s.cueMode === "balanced") {
        ctx.fillStyle = theme.mutedInk;
        ctx.font = `500 ${Math.max(8.5, pw * 0.034)}px "Noto Serif SC", serif`;
        drawWrappedText(ctx, theme.cue, lx + mX, cueY, pw - mX - mIn, Math.max(13, ph * 0.045), 3);
      } else if (s.cueMode === "spoiler") {
        ctx.fillStyle = theme.accentDeep;
        ctx.font = `600 ${Math.max(8, pw * 0.031)}px "Noto Serif SC", serif`;
        let cy = cueY;
        for (const sl of theme.spoilerLines) {
          cy = drawWrappedText(ctx, sl, lx + mX, cy, pw - mX - mIn, Math.max(11.5, ph * 0.039), 2) + 3;
        }
      } else if (s.cueMode === "flat") {
        drawDenseTextBlock(ctx, lx + mX, cueY, pw - mX - mIn, ph * 0.25, {
          ink: theme.ink,
          lineGap: ph * 0.038,
          firstIndent: s.firstIndent,
          rows: 6,
          seed: 5,
          alpha: 0.62,
        });
      }
    }
  }

  // --------- 2. 右页（Recto）绘制 ---------
  // 旧书眉 / 顶角页码（若未清除，画出来并留作点击目标）
  if (s.runningHead || s.folio === "top") {
    ctx.save();
    ctx.fillStyle = s.runningHead ? "#A62626" : theme.mutedInk;
    ctx.font = `600 ${Math.max(8, pw * 0.031)}px "Noto Serif SC", serif`;
    ctx.textBaseline = "top";
    if (s.runningHead) {
      ctx.textAlign = "left";
      ctx.fillText(theme.prevChapter, rx + mIn, headY * 0.96);
    }
    if (s.folio === "top") {
      ctx.textAlign = "right";
      ctx.fillText("21", rx + pw - mX, headY * 0.96);
    }
    ctx.strokeStyle = "rgba(166, 38, 38, 0.45)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + mIn, py + ph * 0.108);
    ctx.lineTo(rx + pw - mX, py + ph * 0.108);
    ctx.stroke();
    ctx.restore();
  }

  if (s.placement === "spread") {
    // 跨页门扉右页：1:1 原海报深松绿拱门与推开黑门
    drawPosterArchway(ctx, rx, py, pw, ph, evalData, theme, time);
    // 可选底部居中下沉页码
    if (s.folio === "bottom") {
      ctx.fillStyle = theme.mutedInk;
      ctx.font = `500 ${Math.max(8.5, pw * 0.03)}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("21", rx + pw * 0.34, py + ph - ph * 0.038);
    }
  } else if (s.placement === "inline") {
    // 接排同页错态：右缘先显出 161 标志性的深松绿拱门与紧闭黑门（被旧章密排正文死死挤在门外！）
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, py, pw, ph);
    ctx.clip();
    const jamW = pw * 0.56;
    const jamX = rx + pw - jamW * 0.78;
    const jamR = jamW * 0.52;
    const jamSpringY = py + ph * 0.34;
    const jamFloorY = py + ph * 0.84;
    // 被挤在右缘的深松绿拱门
    ctx.fillStyle = theme.arch;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(jamX, jamFloorY);
    ctx.lineTo(jamX, jamSpringY);
    ctx.ellipse(jamX + jamR, jamSpringY, jamR, jamR * 0.9, 0, Math.PI, 0, false);
    ctx.lineTo(rx + pw + 2, jamFloorY + ph * 0.14);
    ctx.closePath();
    ctx.fill();
    // 仅露一线窄缝的门光 + 紧闭墨黑门扇
    const slitX = jamX + jamW * 0.24;
    const slitW = Math.max(5, jamW * 0.08);
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.doorGlow;
    ctx.beginPath();
    ctx.moveTo(slitX, py + ph * 0.37);
    ctx.lineTo(slitX + slitW, py + ph * 0.36);
    ctx.lineTo(slitX + slitW, jamFloorY + 4);
    ctx.lineTo(slitX, jamFloorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = theme.doorLeaf;
    ctx.beginPath();
    ctx.moveTo(slitX + slitW, py + ph * 0.36);
    ctx.lineTo(rx + pw + 2, py + ph * 0.28);
    ctx.lineTo(rx + pw + 2, py + ph * 0.92);
    ctx.lineTo(slitX + slitW, jamFloorY + 4);
    ctx.closePath();
    ctx.fill();
    // 陶红弧线
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.ellipse(jamX + jamR * 1.1, jamSpringY - jamR * 0.15, jamR * 0.85, jamR * 0.85, -0.1, Math.PI * 0.65, Math.PI * 1.45);
    ctx.stroke();
    ctx.restore();

    // 上半截仍塞满上一章尾段（压在门前，半透明暖纸托底让字块真实盖住拱门）
    ctx.fillStyle = "rgba(245, 232, 214, 0.78)";
    ctx.fillRect(rx + mIn - 4, py + ph * 0.125, pw - mIn - mX + 8, ph * 0.78);
    const prevEndH = ph * 0.35;
    drawDenseTextBlock(ctx, rx + mIn, py + ph * 0.135, pw - mIn - mX, prevEndH, {
      ink: theme.ink,
      lineGap: ph * 0.035,
      firstIndent: true,
      rows: 9,
      seed: 19,
      alpha: 0.64,
    });
    // 红虚线接缝标记
    const seamY = py + ph * 0.525;
    ctx.save();
    ctx.strokeStyle = "rgba(166, 38, 38, 0.78)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(rx + mIn * 0.6, seamY);
    ctx.lineTo(rx + pw - mX * 0.6, seamY);
    ctx.stroke();
    ctx.restore();

    const baseSize = Math.max(9.5, pw * 0.036);
    const titleSize = clamp(baseSize * s.scale, 10.5, pw * 0.14);
    ctx.fillStyle = theme.ink;
    ctx.font = `700 ${titleSize}px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${theme.chapterNumZh} ${theme.title}`, rx + mIn, seamY + 8);
    drawDenseTextBlock(ctx, rx + mIn, seamY + 14 + titleSize * 1.2, pw - mIn - mX, ph * 0.32, {
      ink: theme.ink,
      lineGap: ph * 0.035,
      firstIndent: s.firstIndent,
      rows: 7,
      seed: 23,
      alpha: 0.66,
    });
  } else {
    // anypage / recto / gutter 右页经典出版沉降排印
    const sinkPx = ph * (0.075 + (s.sink / 100) * 0.72);

    // 淡绘天头沉降测量线（方便直观看懂 Sink）
    if (s.sink >= 12) {
      ctx.save();
      const rulerX = rx + pw - mX * 0.48;
      ctx.strokeStyle = s.sink > 48 ? "rgba(166,38,38,0.65)" : "rgba(56,68,53,0.42)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rulerX, py + ph * 0.04);
      ctx.lineTo(rulerX, py + sinkPx);
      ctx.moveTo(rulerX - 3, py + ph * 0.04);
      ctx.lineTo(rulerX + 3, py + ph * 0.04);
      ctx.moveTo(rulerX - 3, py + sinkPx);
      ctx.lineTo(rulerX + 3, py + sinkPx);
      ctx.stroke();
      ctx.fillStyle = s.sink > 48 ? "#A62626" : theme.arch;
      ctx.font = `500 ${Math.max(7.5, pw * 0.027)}px "JetBrains Mono", monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`沉降 ${s.sink}%`, rulerX - 5, py + (ph * 0.04 + sinkPx) / 2);
      ctx.restore();
    }

    // 轻雅拱门背景细线徽（在精装右页 / 另起新页时给一点点 161 视觉血脉，不抢字）
    if (s.cueMode !== "empty") {
      ctx.save();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 1;
      const ar = pw * 0.14;
      ctx.beginPath();
      ctx.arc(rx + pw - mX - ar * 0.55, py + Math.max(ph * 0.18, sinkPx * 0.75), ar, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (s.cueMode !== "empty" && s.placement !== "gutter") {
      const baseSize = Math.max(9.2, pw * 0.035);
      const titleSize = clamp(baseSize * s.scale, 10.5, pw * 0.145);
      let cy = py + sinkPx;

      // 章号
      if (s.cueMode !== "flat") {
        ctx.fillStyle = theme.accentDeep;
        ctx.font = `600 ${Math.max(8, pw * 0.036)}px "Cormorant Garamond", serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`${theme.chapterNum} · ${theme.chapterNumZh}`, rx + mIn, cy - Math.max(14, ph * 0.042));
      }

      // 主标题
      ctx.fillStyle = theme.ink;
      ctx.font = `900 ${titleSize}px "Noto Serif SC", serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(theme.title, rx + mIn, cy);
      cy += titleSize * 1.24;

      // 细松绿横杠
      ctx.fillStyle = theme.arch;
      ctx.fillRect(rx + mIn, cy, Math.max(18, pw * 0.09), 1.8);
      cy += Math.max(10, ph * 0.03);

      // 导语 / 剧透墙
      if (s.cueMode === "balanced") {
        ctx.fillStyle = theme.mutedInk;
        ctx.font = `italic 500 ${Math.max(8.2, pw * 0.031)}px "Noto Serif SC", serif`;
        cy = drawWrappedText(ctx, theme.cue, rx + mIn, cy, pw - mIn - mX, Math.max(12, ph * 0.041), 2) + Math.max(10, ph * 0.032);
      } else if (s.cueMode === "spoiler") {
        // 红色阴影底盒凸显剧透墙压迫感
        const boxH = Math.min(ph * 0.34, py + ph * 0.88 - cy);
        ctx.fillStyle = "rgba(166, 38, 38, 0.08)";
        ctx.fillRect(rx + mIn - 4, cy - 4, pw - mIn - mX + 8, Math.max(30, boxH));
        ctx.fillStyle = theme.accentDeep;
        ctx.font = `600 ${Math.max(7.8, pw * 0.029)}px "Noto Serif SC", serif`;
        for (const sl of theme.spoilerLines) {
          if (cy > py + ph * 0.86) break;
          cy = drawWrappedText(ctx, sl, rx + mIn, cy, pw - mIn - mX, Math.max(11, ph * 0.036), 2) + 2;
        }
        cy += 8;
      }

      // 开篇正文（展示首段顶格 vs 多余缩进）
      const availH = py + ph * 0.89 - cy;
      if (availH > 22) {
        drawDenseTextBlock(ctx, rx + mIn, cy, pw - mIn - mX, availH, {
          ink: theme.ink,
          lineGap: ph * 0.037,
          firstIndent: s.firstIndent,
          rows: Math.max(2, Math.floor(availH / (ph * 0.044))),
          seed: 31,
          alpha: 0.64,
        });
        // 如果首段错误缩进，用细腻红括号点出缩进缺口
        if (s.firstIndent) {
          ctx.fillStyle = "rgba(166, 38, 38, 0.25)";
          ctx.fillRect(rx + mIn, cy, Math.min(14, (pw - mIn - mX) * 0.09), Math.max(4, ph * 0.018));
        }
      }
    }

    // 底部下沉居中页码
    if (s.folio === "bottom") {
      ctx.fillStyle = theme.mutedInk;
      ctx.font = `500 ${Math.max(8.5, pw * 0.03)}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("21", rx + pw * 0.5, py + ph - ph * 0.038);
    }
  }

  // --------- 3. 压脊错态：标题横跨中缝警示 ---------
  if (s.placement === "gutter") {
    const spineX = rx;
    const gutterW = Math.max(16, pw * 0.11);
    ctx.save();
    ctx.fillStyle = "rgba(166, 38, 38, 0.14)";
    ctx.fillRect(spineX - gutterW / 2, py, gutterW, ph);
    ctx.strokeStyle = "rgba(166, 38, 38, 0.65)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(spineX - gutterW / 2, py);
    ctx.lineTo(spineX - gutterW / 2, py + ph);
    ctx.moveTo(spineX + gutterW / 2, py);
    ctx.lineTo(spineX + gutterW / 2, py + ph);
    ctx.stroke();

    const ty = py + ph * 0.34;
    ctx.fillStyle = theme.ink;
    ctx.font = `900 ${Math.max(16, pw * 0.13)}px "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.title, spineX, ty);
    // 模拟中缝遮吞黑阴影条
    ctx.fillStyle = "rgba(18, 20, 23, 0.38)";
    ctx.fillRect(spineX - 4, ty - pw * 0.09, 8, pw * 0.18);
    ctx.restore();
  }

  // --------- 4. 书页上可直点修复的红标（只在居中编辑态显示，避免翻页时飘移） ---------
  if (Math.abs(s.flow) < 0.22) {
    const zoneCoords = {
      "right-head": { cx: rx + pw * 0.5, cy: py + ph * 0.15 },
      "right-top-mid": { cx: rx + pw * 0.5, cy: py + ph * 0.49 },
      "right-sink": { cx: rx + pw * 0.5, cy: py + ph * 0.20 },
      "right-title": { cx: rx + pw * 0.5, cy: py + ph * 0.34 },
      "right-mid": { cx: rx + pw * 0.5, cy: py + ph * 0.48 },
      "right-para": { cx: rx + pw * 0.5, cy: py + ph * 0.72 },
      "right-bottom": { cx: rx + pw * 0.5, cy: py + ph * 0.80 },
      "spine-mid": { cx: rx, cy: py + ph * 0.48 },
    };
    const usedY = [];
    for (const fix of evalData.hotFixes) {
      const base = zoneCoords[fix.zone] || zoneCoords["right-mid"];
      let cy = base.cy;
      for (const uy of usedY) {
        if (Math.abs(cy - uy) < 28) cy = uy + 30;
      }
      cy = clamp(cy, py + 24, py + ph - 26);
      usedY.push(cy);

      ctx.save();
      ctx.font = `700 ${Math.max(10, Math.min(12, pw * 0.044))}px "Noto Serif SC", sans-serif`;
      const tw = ctx.measureText(fix.label).width;
      const padX = 10;
      const bw = Math.min(pw * 0.92, tw + padX * 2);
      const bh = 24;
      const bx = clamp(base.cx - bw / 2, lx + 8, rx + pw - bw - 8);
      const by = cy - bh / 2;

      roundRectPath(ctx, bx, by, bw, bh, 2);
      ctx.fillStyle = "#A62626";
      ctx.fill();
      ctx.strokeStyle = "#FAF3E8";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#FFFDF9";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fix.label, bx + bw / 2, by + bh / 2 + 0.5);
      ctx.restore();

      hitRects.push({ x: bx, y: by, w: bw, h: bh, patch: fix.patch, label: fix.label });
    }
  }
}

function drawWrappedText(ctx, text, x, y, maxW, lineH, maxLines) {
  let line = "";
  let cy = y;
  let count = 0;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      ctx.fillText(line, x, cy);
      cy += lineH;
      count++;
      line = ch;
      if (count >= maxLines) return cy;
    } else {
      line = test;
    }
  }
  if (line && count < maxLines) {
    ctx.fillText(line, x, cy);
    cy += lineH;
  }
  return cy;
}

export function createSpreadRenderer(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let cssW = 800;
  let cssH = 500;
  let dpr = 1;
  let hitRects = [];

  // 离屏缓存：仅在排版参数或尺寸改变时重绘书页底图，左右横拖翻页时直接零开销合成（软件渲染亦可稳跑 60fps）
  const curLayer = document.createElement("canvas");
  const prevLayer = document.createElement("canvas");
  const nextLayer = document.createElement("canvas");
  const curCtx = curLayer.getContext("2d", { alpha: false });
  const prevCtx = prevLayer.getContext("2d", { alpha: false });
  const nextCtx = nextLayer.getContext("2d", { alpha: false });
  let cachedSpreadKey = "";
  let cachedThemeKey = "";
  let geom = { bx: 0, by: 0, sw: 0, sh: 0, pw: 0, lx: 0, rx: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    const maxDpr = window.innerWidth <= 600 ? 1.5 : 2;
    const nextDpr = pixelRatio(maxDpr);
    const pwPx = Math.round(w * nextDpr);
    const phPx = Math.round(h * nextDpr);
    if (canvas.width !== pwPx || canvas.height !== phPx || cssW !== w || cssH !== h) {
      canvas.width = pwPx;
      canvas.height = phPx;
      curLayer.width = pwPx;
      curLayer.height = phPx;
      prevLayer.width = pwPx;
      prevLayer.height = phPx;
      nextLayer.width = pwPx;
      nextLayer.height = phPx;
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      cachedSpreadKey = "";
      cachedThemeKey = "";
    }
    const padX = Math.max(14, cssW * 0.04);
    const padTop = Math.max(26, cssH * 0.075);
    const padBot = Math.max(24, cssH * 0.075);
    const availW = cssW - padX * 2;
    const availH = cssH - padTop - padBot;
    const spreadAspect = 1.46;
    let sw = availW;
    let sh = sw / spreadAspect;
    if (sh > availH) {
      sh = availH;
      sw = sh * spreadAspect;
    }
    const bx = Math.round((cssW - sw) / 2);
    const by = Math.round(padTop + (availH - sh) / 2);
    const pw = sw / 2;
    geom = { bx, by, sw, sh, pw, lx: bx, rx: bx + pw };
  }

  function rebuildNeighborLayers(theme) {
    const { lx, rx, by, pw, sh } = geom;
    prevCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPrevChapterPage(prevCtx, lx, by, pw, sh, "left", theme);
    drawPrevChapterPage(prevCtx, rx, by, pw, sh, "right", theme);

    nextCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawNextChapterPage(nextCtx, lx, by, pw, sh, "left", theme);
    drawNextChapterPage(nextCtx, rx, by, pw, sh, "right", theme);
  }

  function rebuildCurrentLayer(evalData, time) {
    const { bx, by, sw, sh, pw, lx, rx } = geom;
    const { theme } = evalData;
    curCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 暖牛皮书桌背景（与页面同色无黑框）
    const deskGrad = curCtx.createLinearGradient(0, 0, cssW, cssH);
    deskGrad.addColorStop(0, "#ECDBC2");
    deskGrad.addColorStop(0.55, "#E4CEB1");
    deskGrad.addColorStop(1, "#D9C1A1");
    curCtx.fillStyle = deskGrad;
    curCtx.fillRect(0, 0, cssW, cssH);

    // 2. 书本硬壳封底与落地投影
    curCtx.fillStyle = "rgba(33, 42, 32, 0.14)";
    curCtx.fillRect(bx - 5, by + 7, sw + 14, sh + 6);
    curCtx.fillStyle = "rgba(33, 42, 32, 0.22)";
    curCtx.fillRect(bx - 3, by + 3, sw + 8, sh + 3);
    curCtx.fillStyle = theme.arch;
    curCtx.fillRect(bx - 5, by - 4, sw + 10, sh + 8);

    // 左右书页叠层厚度
    const stackW = Math.max(4, sw * 0.011);
    curCtx.fillStyle = "#DEC9AE";
    curCtx.fillRect(lx - stackW, by + 2, stackW, sh - 2);
    curCtx.fillRect(rx + pw, by + 2, stackW, sh - 2);
    curCtx.strokeStyle = "rgba(56, 68, 53, 0.25)";
    curCtx.lineWidth = 0.75;
    for (let i = 1; i <= 3; i++) {
      const off = (stackW * i) / 4;
      curCtx.beginPath();
      curCtx.moveTo(lx - off, by + 2);
      curCtx.lineTo(lx - off, by + sh);
      curCtx.moveTo(rx + pw + off, by + 2);
      curCtx.lineTo(rx + pw + off, by + sh);
      curCtx.stroke();
    }

    // 3. 当前编排双页主体（包含红标热区，仅在翻页近零时绘制）
    hitRects = [];
    drawCurrentOpeningSpread(curCtx, lx, rx, by, pw, sh, evalData, time, hitRects);

    // 书脊凹槽基础阴影
    const spineX = rx;
    const spL = curCtx.createLinearGradient(spineX - pw * 0.14, 0, spineX, 0);
    spL.addColorStop(0, "rgba(18, 20, 23, 0)");
    spL.addColorStop(0.75, "rgba(18, 20, 23, 0.08)");
    spL.addColorStop(1, "rgba(18, 20, 23, 0.28)");
    curCtx.fillStyle = spL;
    curCtx.fillRect(spineX - pw * 0.14, by, pw * 0.14, sh);

    const spR = curCtx.createLinearGradient(spineX, 0, spineX + pw * 0.14, 0);
    spR.addColorStop(0, "rgba(18, 20, 23, 0.24)");
    spR.addColorStop(0.25, "rgba(18, 20, 23, 0.06)");
    spR.addColorStop(1, "rgba(18, 20, 23, 0)");
    curCtx.fillStyle = spR;
    curCtx.fillRect(spineX, by, pw * 0.14, sh);

    // 书台底沿静态提示
    const isNarrow = cssW < 560;
    curCtx.fillStyle = "#3B4339";
    curCtx.font = `500 ${isNarrow ? 10.5 : Math.min(11.5, Math.max(10.5, cssW * 0.0145))}px "Noto Serif SC", sans-serif`;
    curCtx.textAlign = "center";
    curCtx.textBaseline = "middle";
    curCtx.fillText(
      isNarrow ? "↔ 横拖书页翻阅上下章 · 点红标修错" : "↔ 左右横拖摊开的书页实时翻阅上下章 · 直点红标就地修错 · 方向键微调",
      cssW / 2,
      by + sh + 15
    );
  }

  function render(evalData, time = 0) {
    if (!cachedSpreadKey) resize();
    const { state: s, theme } = evalData;
    const showHot = Math.abs(s.flow) < 0.22 ? 1 : 0;
    const themeKey = `${s.theme}|${cssW}x${cssH}`;
    const spreadKey = `${themeKey}|${s.placement}|${s.sink}|${s.runningHead}|${s.folio}|${s.firstIndent}|${s.cueMode}|${s.scale}|${showHot}`;

    if (cachedThemeKey !== themeKey) {
      rebuildNeighborLayers(theme);
      cachedThemeKey = themeKey;
    }
    if (cachedSpreadKey !== spreadKey) {
      rebuildCurrentLayer(evalData, time);
      cachedSpreadKey = spreadKey;
    }

    const { bx, by, sw, sh, pw, lx, rx } = geom;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(curLayer, 0, 0);

    // 仅在翻页时极速合成已缓存的上下章页面与 2.5D 卷页折光
    if (Math.abs(s.flow) > 0.015) {
      const p = Math.abs(s.flow);
      const goingPrev = s.flow < 0;
      const srcCanvas = goingPrev ? prevLayer : nextLayer;
      if (goingPrev) {
        const revW = Math.round(sw * p * dpr);
        if (revW > 0) {
          ctx.drawImage(
            srcCanvas,
            Math.round(lx * dpr),
            Math.round(by * dpr),
            revW,
            Math.round(sh * dpr),
            Math.round(lx * dpr),
            Math.round(by * dpr),
            revW,
            Math.round(sh * dpr)
          );
        }
      } else {
        const revW = Math.round(sw * p * dpr);
        const sx = Math.round((rx + pw) * dpr) - revW;
        if (revW > 0) {
          ctx.drawImage(srcCanvas, sx, Math.round(by * dpr), revW, Math.round(sh * dpr), sx, Math.round(by * dpr), revW, Math.round(sh * dpr));
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(lx, by, sw, sh);
      ctx.clip();
      const foldX = goingPrev ? lx + p * sw : rx + pw - p * sw;
      const wingW = Math.min(pw * 0.32, 22 + Math.sin(p * Math.PI) * pw * 0.28);
      const shGrad = goingPrev
        ? ctx.createLinearGradient(foldX - wingW * 0.7, 0, foldX + wingW, 0)
        : ctx.createLinearGradient(foldX - wingW, 0, foldX + wingW * 0.7, 0);
      if (goingPrev) {
        shGrad.addColorStop(0, "rgba(18, 20, 23, 0.02)");
        shGrad.addColorStop(0.42, "rgba(18, 20, 23, 0.26)");
        shGrad.addColorStop(0.55, "rgba(255, 250, 240, 0.96)");
        shGrad.addColorStop(0.75, "rgba(232, 212, 185, 0.92)");
        shGrad.addColorStop(1, "rgba(18, 20, 23, 0)");
        ctx.fillStyle = shGrad;
        ctx.fillRect(foldX - wingW * 0.7, by, wingW * 1.7, sh);
      } else {
        shGrad.addColorStop(0, "rgba(18, 20, 23, 0)");
        shGrad.addColorStop(0.28, "rgba(232, 212, 185, 0.92)");
        shGrad.addColorStop(0.46, "rgba(255, 250, 240, 0.96)");
        shGrad.addColorStop(0.58, "rgba(18, 20, 23, 0.24)");
        shGrad.addColorStop(1, "rgba(18, 20, 23, 0.02)");
        ctx.fillStyle = shGrad;
        ctx.fillRect(foldX - wingW, by, wingW * 1.7, sh);
      }
      ctx.restore();
    }

    // 书页细外框与顶沿实时标尺
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(56, 68, 53, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, sw, sh);

    const isNarrow = cssW < 560;
    const hudSize = isNarrow ? 10.5 : Math.min(11.5, Math.max(10.5, cssW * 0.015));
    ctx.font = `500 ${hudSize}px "JetBrains Mono", "Noto Serif SC", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#2B3B28";
    const dropStr = evalData.deltaInk > 0 ? `降灰 ${evalData.deltaInk}%` : evalData.deltaInk === 0 ? "降灰 0%" : `偏密 +${Math.abs(evalData.deltaInk)}%`;
    const leftHud = isNarrow
      ? `灰度 ${evalData.prevChapterInk}%→${evalData.openerInk}% · ${dropStr}`
      : `上章 ${evalData.prevChapterInk}% 灰 → 本章扉页 ${evalData.openerInk}% 灰（${dropStr}）`;
    ctx.fillText(leftHud, bx, by - 13);

    const shortFlow = s.flow < -0.28 ? "← 回看上章" : s.flow > 0.28 ? "预览下章 →" : "扉页编辑中";
    ctx.textAlign = "right";
    ctx.fillStyle = evalData.severity === "pass" ? "#1D6344" : "#8C3227";
    ctx.fillText(isNarrow ? shortFlow : evalData.flowLabel, bx + sw, by - 13);
  }

  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (let i = hitRects.length - 1; i >= 0; i--) {
      const r = hitRects[i];
      if (x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 4 && y <= r.y + r.h + 4) {
        return r;
      }
    }
    return null;
  }

  return { render, hitTest, resize };
}
