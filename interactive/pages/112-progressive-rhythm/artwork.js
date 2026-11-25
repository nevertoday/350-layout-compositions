// 112 渐进节奏组织 · 2D Canvas 活体绘制引擎
// 1:1 承袭 112 原海报的电光钴蓝斜升双轨视觉语言：金米渐大圆列 + 纯白实虚双斜箭 + 斜切阶梯柱阵 + 密度微点阵

import { PALETTE, clamp } from "./model.js";

function drawArrowhead(ctx, x1, y1, angle, size) {
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.56);
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, size * 0.56);
  ctx.stroke();
  ctx.restore();
}

export function renderHeroStage(ctx, state, geom, evalRes, anim) {
  const { w, h, compact, orbs, bars, solidArrow, dashedArrow, baseLineY } = geom;
  const { reveal = 1, pulse = 0, hoverBeat = -1, dragging = false } = anim;

  // 1. 电光钴蓝底色与极淡蓝图坐标系
  ctx.fillStyle = PALETTE.cobalt;
  ctx.fillRect(0, 0, w, h);

  // 细微建筑蓝图网格（极克制，保留海报干净纯蓝呼吸感）
  ctx.save();
  ctx.strokeStyle = "rgba(248, 247, 241, 0.065)";
  ctx.lineWidth = 1;
  const gridStep = compact ? 36 : 48;
  ctx.beginPath();
  for (let gx = gridStep; gx < w; gx += gridStep) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
  }
  for (let gy = gridStep; gy < h; gy += gridStep) {
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
  }
  ctx.stroke();
  ctx.restore();

  // 2. 下方斜切阶梯柱阵（先绘柱阵，层次在斜箭之下）
  ctx.save();
  const n = bars.length;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    const stepReveal = clamp((reveal * (n + 1.5) - i * 0.72) / 2.2, 0, 1);
    const eased = 1 - Math.pow(1 - stepReveal, 3);
    if (eased <= 0.01) continue;

    const topL = baseLineY - (baseLineY - b.topLeftY) * eased;
    const topR = baseLineY - (baseLineY - b.topRightY) * eased;

    ctx.beginPath();
    ctx.moveTo(b.x, baseLineY);
    ctx.lineTo(b.x, topL);
    ctx.lineTo(b.x + b.w, topR);
    ctx.lineTo(b.x + b.w, baseLineY);
    ctx.closePath();

    if (b.isDip && state.barDir === "aligned") {
      ctx.fillStyle = "rgba(255, 142, 114, 0.34)";
      ctx.fill();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = PALETTE.coralDark;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (state.barDir === "reverse") {
      // 双轨反向时柱阵略压半透并附带反向警示顶边，让对冲一眼可见
      ctx.fillStyle = b.color === PALETTE.gold ? "rgba(254, 198, 19, 0.72)" : "rgba(246, 232, 205, 0.72)";
      ctx.fill();
      ctx.strokeStyle = PALETTE.coralDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, topL);
      ctx.lineTo(b.x + b.w, topR);
      ctx.stroke();
    } else {
      ctx.fillStyle = b.color;
      ctx.fill();
    }

    if (hoverBeat === i) {
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x - 1, Math.min(topL, topR) - 1, b.w + 2, baseLineY - Math.min(topL, topR) + 1);
    }

    // 密度递增微点群（点亮「密度递增」时在每根柱底向上展开精确递增点阵）
    if (b.dotCount > 0 && eased > 0.4) {
      const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(b.dotCount))));
      const rows = Math.ceil(b.dotCount / cols);
      const dotR = compact ? 1.8 : 2.3;
      const gap = compact ? 5.2 : 6.6;
      const startX = b.cx - ((cols - 1) * gap) / 2;
      const startY = baseLineY - (compact ? 7 : 9);
      ctx.fillStyle = PALETTE.cobaltDeep;
      let drawn = 0;
      for (let r = 0; r < rows && drawn < b.dotCount; r++) {
        for (let c = 0; c < cols && drawn < b.dotCount; c++) {
          ctx.beginPath();
          ctx.arc(startX + c * gap, startY - r * gap, dotR, 0, Math.PI * 2);
          ctx.fill();
          drawn++;
        }
      }
    }
  }
  ctx.restore();

  // 3. 虚线斜坡箭头（原海报同款白色虚线斜箭，反向对冲时标成珊瑚反向斜箭！）
  ctx.save();
  const dashReveal = clamp(reveal * 1.15, 0, 1);
  if (state.barDir === "reverse") {
    // 反向警示虚线：从左上跌向右下
    const rx0 = dashedArrow.x0;
    const ry0 = !compact ? baseLineY - h * 0.38 : dashedArrow.y1 + h * 0.06;
    const rx1 = rx0 + (dashedArrow.x1 - rx0) * dashReveal;
    const ry1 = ry0 + (dashedArrow.y0 - ry0) * dashReveal;
    ctx.strokeStyle = PALETTE.coralDark;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(rx0, ry0);
    ctx.lineTo(rx1, ry1);
    ctx.stroke();
    ctx.setLineDash([]);
    if (dashReveal > 0.7) {
      drawArrowhead(ctx, rx1, ry1, Math.atan2(ry1 - ry0, rx1 - rx0), compact ? 7 : 9);
    }
    // 独立深钴实底徽标，确保文字清晰不与柱条撞色
    const rText = "下轨逆向衰减";
    ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const rtw = ctx.measureText(rText).width + 14;
    const rbx = clamp(dashedArrow.x1 - rtw - 6, 10, w - rtw - 10);
    const rby = clamp(baseLineY - (compact ? 64 : 74), 48, baseLineY - 40);
    ctx.fillStyle = PALETTE.cobaltDeep;
    ctx.fillRect(rbx, rby, rtw, 22);
    ctx.strokeStyle = PALETTE.coralDark;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(rbx, rby, rtw, 22);
    ctx.fillStyle = PALETTE.coralDark;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(rText, rbx + 7, rby + 11);
  } else {
    const dx1 = dashedArrow.x0 + (dashedArrow.x1 - dashedArrow.x0) * dashReveal;
    const dy1 = dashedArrow.y0 + (dashedArrow.y1 - dashedArrow.y0) * dashReveal;
    ctx.strokeStyle = "rgba(248, 247, 241, 0.88)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(dashedArrow.x0, dashedArrow.y0);
    ctx.lineTo(dx1, dy1);
    ctx.stroke();
    ctx.setLineDash([]);
    if (dashReveal > 0.7) {
      drawArrowhead(ctx, dx1, dy1, Math.atan2(dy1 - dashedArrow.y0, dx1 - dashedArrow.x0), compact ? 6.5 : 8);
    }
  }
  ctx.restore();

  // 4. 中段纯白实线推进斜箭（原海报最具识别度的视觉脊椎）
  ctx.save();
  const sRev = clamp(reveal * 1.1, 0, 1);
  const sx1 = solidArrow.x0 + (solidArrow.x1 - solidArrow.x0) * sRev;
  const sy1 = solidArrow.y0 + (solidArrow.y1 - solidArrow.y0) * sRev;
  ctx.strokeStyle = PALETTE.white;
  ctx.lineWidth = compact ? 1.6 : 2;
  ctx.beginPath();
  ctx.moveTo(solidArrow.x0, solidArrow.y0);
  ctx.lineTo(sx1, sy1);
  ctx.stroke();

  // 起点小白圆点
  ctx.fillStyle = PALETTE.white;
  ctx.beginPath();
  ctx.arc(solidArrow.x0, solidArrow.y0, compact ? 2.5 : 3.2, 0, Math.PI * 2);
  ctx.fill();

  if (sRev > 0.65) {
    drawArrowhead(ctx, sx1, sy1, Math.atan2(sy1 - solidArrow.y0, sx1 - solidArrow.x0), compact ? 8 : 11);
  }

  // 达标时沿推进箭头流动的一束克制光点（仅单向稳步推进，非晃动装饰）
  if (evalRes.score === 4 && pulse > 0) {
    const pt = pulse % 1;
    const px = solidArrow.x0 + (solidArrow.x1 - solidArrow.x0) * pt;
    const py = solidArrow.y0 + (solidArrow.y1 - solidArrow.y0) * pt;
    ctx.fillStyle = PALETTE.mintDark;
    ctx.beginPath();
    ctx.arc(px, py, compact ? 3.5 : 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. 上方斜升金米圆列（支持点击破拍与直觉读取递增节律）
  ctx.save();
  for (let i = 0; i < orbs.length; i++) {
    const o = orbs[i];
    const stepReveal = clamp((reveal * (orbs.length + 1.4) - i * 0.72) / 2.1, 0, 1);
    const eased = 1 - Math.pow(1 - stepReveal, 3);
    if (eased <= 0.01) continue;

    const r = Math.max(1.8, o.r * eased);

    // 悬停或破拍光环
    if (o.isDip) {
      ctx.save();
      ctx.strokeStyle = PALETTE.coralDark;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(o.x, o.y, Math.max(14, r + 7), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (hoverBeat === i) {
      ctx.save();
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 末拍达标微辉环（标示终点焦点）
    if (i === orbs.length - 1 && evalRes.score === 4) {
      ctx.save();
      ctx.strokeStyle = "rgba(108, 242, 206, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 实心金/米/白圆
    ctx.beginPath();
    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    ctx.fillStyle = o.isDip ? PALETTE.coralFill : o.color;
    ctx.fill();

    // 密度开启且圆够大时在圆心加极简同心点呼应原海报
    if (state.dims.density && r >= 11 && !o.isDip) {
      ctx.fillStyle = PALETTE.cobalt;
      const dotN = Math.min(5, Math.floor(i / 2) + 1);
      if (dotN === 1) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ringR = Math.min(r * 0.42, 10);
        for (let d = 0; d < dotN; d++) {
          const ang = (d / dotN) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.arc(o.x + Math.cos(ang) * ringR, o.y + Math.sin(ang) * ringR, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 破拍提示稍后在最顶层绘制，避免被后续圆点盖住
  }

  // 5b. 顶层绘制破拍提示标签（避让相邻右上方圆点，永不被遮挡）
  for (let i = 0; i < orbs.length; i++) {
    const o = orbs[i];
    if (!o.isDip) continue;
    const stepReveal = clamp((reveal * (orbs.length + 1.4) - i * 0.72) / 2.1, 0, 1);
    if (stepReveal <= 0.65) continue;
    const r = Math.max(1.8, o.r);
    const label = `第 ${o.beatNo} 拍凹陷 · 点此抬回`;
    ctx.save();
    ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(label).width;
    const boxW = tw + 16;
    const boxH = 24;
    // 向左上方偏移，彻底避开右上方第 i+1 拍圆点
    const bx = clamp(o.x - boxW * 0.72, compact ? 10 : w * 0.36, w - boxW - 10);
    const by = Math.max(compact ? 42 : 12, o.y - Math.max(18, r + 14) - boxH - 4);
    ctx.strokeStyle = PALETTE.coralDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y - Math.max(14, r + 7));
    ctx.lineTo(clamp(o.x, bx + 12, bx + boxW - 12), by + boxH);
    ctx.stroke();

    ctx.fillStyle = PALETTE.coralFill;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = PALETTE.white;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + 8, by + boxH / 2);
    ctx.restore();
  }
  ctx.restore();

  // 6. 原海报核心视觉标注：起点 START / 推进 MOMENTUM / 强化 EMPHASIS + 拖动跨度读数标尺
  ctx.save();
  ctx.textBaseline = "top";

  // 左下：起点 START
  const startOrb = orbs[0];
  if (startOrb) {
    ctx.fillStyle = PALETTE.white;
    ctx.textAlign = "left";
    ctx.font = `700 ${compact ? 12 : 14}px "Noto Sans SC", sans-serif`;
    ctx.fillText("起点", Math.max(12, startOrb.x - 16), Math.min(h - 32, startOrb.y + startOrb.r + 8));
    ctx.font = `500 ${compact ? 10 : 11}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "rgba(248, 247, 241, 0.88)";
    ctx.fillText("START", Math.max(12, startOrb.x - 16), Math.min(h - 16, startOrb.y + startOrb.r + 25));
  }

  // 右上：强化 EMPHASIS（始终落在末圆右侧纯蓝留空，绝不压圆）
  const endOrb = orbs[orbs.length - 1];
  if (endOrb) {
    const labelY = Math.max(compact ? 44 : 16, endOrb.y - (compact ? 22 : 26));
    ctx.textAlign = "right";
    ctx.fillStyle = PALETTE.white;
    ctx.font = `700 ${compact ? 13 : 15}px "Noto Sans SC", sans-serif`;
    ctx.fillText("强化", w - 12, labelY);
    ctx.font = `500 ${compact ? 10 : 11}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "rgba(248, 247, 241, 0.88)";
    ctx.fillText("EMPHASIS", w - 12, labelY + (compact ? 16 : 20));
    ctx.fillStyle = evalRes.score === 4 ? PALETTE.mintDark : PALETTE.gold;
    ctx.fillRect(w - 40, labelY + (compact ? 31 : 37), 28, 3);

    // 实时跨度微章（横向拖动时高亮反馈）
    const pillText = `跨度 ${state.span.toFixed(1)}× · ${state.beats} 拍`;
    ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
    const pw = ctx.measureText(pillText).width + 18;
    const px = compact ? 12 : w - pw - 14;
    const py = compact ? 10 : h - 32;
    ctx.fillStyle = dragging ? PALETTE.gold : PALETTE.cobaltDeep;
    ctx.fillRect(px, py, pw, 24);
    ctx.strokeStyle = dragging ? PALETTE.white : "rgba(248, 247, 241, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, 24);
    ctx.fillStyle = dragging ? PALETTE.ink : PALETTE.white;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, px + 9, py + 12);
  }

  // 中右斜箭下方：推进 MOMENTUM
  if (!compact || w >= 360) {
    const mx = solidArrow.x0 + (solidArrow.x1 - solidArrow.x0) * 0.78;
    const my = solidArrow.y0 + (solidArrow.y1 - solidArrow.y0) * 0.78 + (compact ? 12 : 16);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = PALETTE.white;
    ctx.font = `700 ${compact ? 11 : 13}px "Noto Sans SC", sans-serif`;
    ctx.fillText("推进", Math.min(w - 64, mx), my);
    ctx.font = `500 ${compact ? 9.5 : 10.5}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "rgba(248, 247, 241, 0.84)";
    ctx.fillText("MOMENTUM", Math.min(w - 76, mx), my + (compact ? 14 : 17));
  }

  // 底部左中轻微操作指引（手机无遮挡画布上清晰可见）
  if (compact) {
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(248, 247, 241, 0.86)";
    ctx.font = `500 11px "Noto Sans SC", sans-serif`;
    ctx.fillText("横拖调跨度 · 点圆修破拍", w - 14, 15);
  }

  ctx.restore();
}

// 03 节历史图板专用画布绘制器：分别呈现 5 个真实历史节点的可视化标本
export function renderOriginPlate(ctx, mode, w, h, param) {
  ctx.fillStyle = PALETTE.cobalt;
  ctx.fillRect(0, 0, w, h);

  // 极淡底格
  ctx.strokeStyle = "rgba(248, 247, 241, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 32; x < w; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = 32; y < h; y += 32) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();

  if (mode === "fechner") {
    // 1860 费希纳：物理刺激 vs 对数感知曲线 + 等距感知步点
    const padL = 44, padR = 26, padT = 30, padB = 38;
    const pw = w - padL - padR, ph = h - padT - padB;
    ctx.strokeStyle = "rgba(248,247,241,0.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + ph);
    ctx.lineTo(padL + pw, padT + ph);
    ctx.stroke();

    // 物理等比点在纵轴上映射出等距感知
    const steps = Math.round(clamp(param, 5, 10));
    const maxX = Math.pow(1.42, steps - 1);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const fx = 1 + (maxX - 1) * (i / 80);
      const px = padL + ((fx - 1) / (maxX - 1)) * pw;
      const py = padT + ph - (Math.log(fx) / Math.log(maxX)) * ph * 0.92;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    for (let i = 0; i < steps; i++) {
      const fx = Math.pow(1.42, i);
      const px = padL + ((fx - 1) / (maxX - 1)) * pw;
      const py = padT + ph - (Math.log(fx) / Math.log(maxX)) * ph * 0.92;
      ctx.strokeStyle = "rgba(246, 232, 205, 0.35)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(px, py);
      ctx.lineTo(px, padT + ph);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = i % 2 === 0 ? PALETTE.cream : PALETTE.gold;
      ctx.beginPath();
      ctx.arc(px, py, 4.5 + i * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.white;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillText("P = k · ln(I / I0)", padL + 10, padT + 14);
    ctx.fillText("物理刺激 I（等比放大）→", padL + pw - 150, padT + ph + 24);
    ctx.fillText("感知阶梯 P", 8, padT - 10);
  } else if (mode === "latourette") {
    // 1956–1960 泽纳基斯 × 勒·柯布西耶 拉图雷特修道院「波形玻璃立面」
    const padX = 24, padY = 26;
    const fw = w - padX * 2, fh = h - padY * 2 - 22;
    // 上下混凝土梁
    ctx.fillStyle = PALETTE.cobaltDeep;
    ctx.fillRect(padX, padY, fw, fh);
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(padX, padY, fw, 8);
    ctx.fillRect(padX, padY + fh - 8, fw, 8);

    // 模度数列驱动的渐密—渐疏竖向混凝土棂条
    const seq = [1, 1.32, 1.75, 2.3, 3.05, 4.05, 5.3, 4.05, 3.05, 2.3, 1.75, 1.32, 1, 1.32, 1.75, 2.3, 3.05, 4.05];
    const densityShift = clamp(param, 5, 10) / 7;
    const adj = seq.map((v) => Math.pow(v, densityShift));
    const total = adj.reduce((a, b) => a + b, 0);
    let x = padX;
    for (let i = 0; i < adj.length; i++) {
      const segW = (adj[i] / total) * fw;
      // 玻璃透光面（按开间宽窄呈现暖光渐强）
      const lum = clamp(adj[i] / 5.5, 0.14, 0.85);
      ctx.fillStyle = `rgba(254, 198, 19, ${lum * 0.28})`;
      ctx.fillRect(x + 2, padY + 8, Math.max(1, segW - 4), fh - 16);
      // 混凝土竖棂
      ctx.fillStyle = i % 3 === 0 ? PALETTE.gold : PALETTE.cream;
      ctx.fillRect(x, padY + 8, 3.2, fh - 16);
      x += segW;
    }
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(padX + fw - 3.2, padY + 8, 3.2, fh - 16);
    ctx.fillStyle = PALETTE.white;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillText("PANS DE VERRE ONDULATOIRES · MODULOR INTERVALS", padX, h - 14);
  } else if (mode === "arnheim") {
    // 1954 阿恩海姆：向心透视与视觉渐强（Crescendo）
    const count = Math.round(clamp(param, 5, 10));
    const vx = w * 0.84, vy = h * 0.24;
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const t = Math.pow(u, 1.35);
      const cx = w * 0.12 + (vx - w * 0.12) * t;
      const cy = h * 0.78 + (vy - h * 0.78) * t;
      const side = 14 + Math.pow(1.26, i) * 7.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.18 + u * 0.18);
      ctx.strokeStyle = i % 2 === 0 ? PALETTE.cream : PALETTE.gold;
      ctx.lineWidth = 1.2 + u * 3.2;
      ctx.strokeRect(-side / 2, -side / 2, side, side);
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.white;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillText("VISUAL CRESCENDO · DIRECTIONAL TENSION", 20, h - 14);
  } else if (mode === "hofmann") {
    // 1965 霍夫曼 & 1972 王无邪：巴塞尔点线黑白面积渐进练习
    const cols = Math.round(clamp(param, 5, 10)) + 2;
    const padX = 28, padY = 26;
    const spanW = w - padX * 2;
    const cellW = spanW / cols;
    for (let i = 0; i < cols; i++) {
      const u = i / (cols - 1);
      const barW = Math.max(2, cellW * (0.1 + 0.8 * Math.pow(u, 1.25)));
      const x = padX + i * cellW + (cellW - barW) / 2;
      ctx.fillStyle = i % 2 === 0 ? PALETTE.cream : PALETTE.gold;
      ctx.fillRect(x, padY, barW, h - padY * 2 - 20);
    }
    ctx.fillStyle = PALETTE.white;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillText("BASEL PROGRESSION · FIGURE / GROUND SHIFT", padX, h - 14);
  } else {
    // 1992 布林赫斯特：音程模数字号阶梯（6–72pt）
    const ratios = [1.125, 1.2, 1.25, 1.333, 1.414, 1.5];
    const r = ratios[clamp(Math.round(param) - 5, 0, ratios.length - 1)];
    const sizes = [11, 11 * r, 11 * r * r, 11 * Math.pow(r, 3), 11 * Math.pow(r, 4)];
    const labels = ["注释 CAPTION", "正文 BODY", "小标 SUBHEAD", "栏标 SECTION", "大标 DISPLAY"];
    let y = 26;
    for (let i = 0; i < sizes.length; i++) {
      const sz = clamp(sizes[i], 11, 44);
      ctx.fillStyle = i === sizes.length - 1 ? PALETTE.gold : PALETTE.white;
      ctx.font = `700 ${sz}px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(`${labels[i]}`, 24, y);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `500 11px "IBM Plex Mono", monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(sz)}px`, w - 24, y + sz * 0.22);
      ctx.textAlign = "left";
      y += sz + 11;
      if (y > h - 24) break;
    }
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillText(`MODULAR RATIO ×${r.toFixed(3)}`, 24, h - 18);
  }
}
