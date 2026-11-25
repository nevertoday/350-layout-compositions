// 113 流动节奏组织 · 2D Canvas 渲染引擎
// 1. Hero 活体丝带河道雕塑台（支持原海报丝带 / 浮世绘浪势 / 长页叙事流三套实景）
// 2. Section 02 曲率梳与视线惯性竞速画布

import { pixelRatio } from "../../lib/stage.js";
import { MOON_CENTER, sampleAtS } from "./model.js";

const COLORS = {
  bg: "#170627",
  bgSoft: "#220A38",
  pink: "#F16393",
  pinkBright: "#F95D92",
  pinkSoft: "rgba(241, 99, 147, 0.35)",
  moon: "#F3EADB",
  white: "#F8F5FA",
  muted: "#C7B7D8",
  err: "#FF8B73",
  ok: "#6EE7C8",
  grid: "rgba(241, 99, 147, 0.09)",
};

const sizeCache = new WeakMap();

function getCanvasSize(canvas) {
  let info = sizeCache.get(canvas);
  if (!info) {
    const rect = canvas.getBoundingClientRect();
    info = { w: Math.max(240, Math.round(rect.width)), h: Math.max(200, Math.round(rect.height)) };
    sizeCache.set(canvas, info);
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        const r = canvas.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          info.w = Math.max(240, Math.round(r.width));
          info.h = Math.max(200, Math.round(r.height));
        }
      });
      ro.observe(canvas);
    }
  }
  return info;
}

function fitCanvas(canvas) {
  const { w, h } = getCanvasSize(canvas);
  const dpr = pixelRatio(w < 500 ? 1.5 : 2);
  const tw = Math.round(w * dpr);
  const th = Math.round(h * dpr);
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function drawDotMatrix(ctx, w, h) {
  const cols = 6;
  const rows = 6;
  const gap = Math.max(10, Math.min(14, w * 0.019));
  const r = Math.max(1.8, Math.min(2.6, w * 0.0034));
  const x0 = w - 22 - (cols - 1) * gap;
  const y0 = h - 22 - (rows - 1) * gap;
  ctx.fillStyle = "rgba(241, 99, 147, 0.72)";
  ctx.beginPath();
  for (let row = 0; row < rows; row++) {
    const cy = y0 + row * gap;
    for (let col = 0; col < cols; col++) {
      const cx = x0 + col * gap;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

function drawArrowHead(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-size, -size * 0.56);
  ctx.lineTo(0, 0);
  ctx.lineTo(-size, size * 0.56);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawRibbonPolyline(ctx, pts, cum, totalLen, w, h, sStart, sEnd, width, color, lineJoin) {
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < pts.length; i++) {
    const s = cum[i] / Math.max(1e-5, totalLen);
    if (s < sStart || s > sEnd) continue;
    const x = pts[i].u * w;
    const y = pts[i].v * h;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  if (!started) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = lineJoin;
  ctx.stroke();
}

// 绘制原海报风格的折线微标注（严格避开主干与节点）
function drawElbowTag(ctx, ax, ay, bx, by, title, sub, alignRight, ok, compact) {
  if (compact) return;
  const color = ok ? COLORS.pink : COLORS.err;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ax, ay, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = alignRight ? "right" : "left";
  ctx.textBaseline = "middle";
  const tx = alignRight ? bx - 7 : bx + 7;
  ctx.font = '600 11.5px "Noto Sans SC", sans-serif';
  ctx.fillStyle = COLORS.white;
  ctx.fillText(title, tx, by - 5);
  ctx.font = '400 10px "Space Mono", monospace';
  ctx.fillStyle = ok ? "#DFCBEB" : "#FFB5A5";
  ctx.fillText(sub, tx, by + 9);
  ctx.restore();
}

export function renderHeroCanvas(canvas, state, ev, anim) {
  const { ctx, w, h } = fitCanvas(canvas);
  const compact = w < 460;
  const minDim = Math.min(w, h);
  const ribbonW = Math.max(14, Math.min(26, minDim * 0.044));

  // 1. 深紫夜幕底 + 极淡星轨坐标底格
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  // 轻量双层明月晕圈（避开全画布径向渐变，软件渲染下极快）
  const moonX = MOON_CENTER.u * w;
  const moonY = MOON_CENTER.v * h;
  const moonR = Math.max(22, minDim * 0.095) * ev.moonScale;
  if (ev.focusOk) {
    ctx.fillStyle = "rgba(243, 234, 219, 0.06)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(243, 234, 219, 0.09)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // 极轻引导坐标细线（合批单次 stroke）
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i <= 3; i++) {
    const gx = (w * i) / 4;
    const gy = (h * i) / 4;
    ctx.moveTo(gx, 12);
    ctx.lineTo(gx, h - 12);
    ctx.moveTo(12, gy);
    ctx.lineTo(w - 12, gy);
  }
  ctx.stroke();

  // 右下 6×6 粉点阵（113 原海报标志）
  drawDotMatrix(ctx, w, h);

  // 2. 按题材叠加背景语境层（浮世绘浪势 / 长页叙事流）
  if (state.scene === "wave") {
    // 浮世绘多重弧浪影衬 + 远方山峰轮廓（无写实杂乱，保持深紫粉明月统一色系）
    ctx.save();
    for (let k = -2; k <= 2; k++) {
      if (k === 0) continue;
      ctx.beginPath();
      for (let i = 0; i < ev.pts.length; i++) {
        const s = ev.cum[i] / Math.max(1e-5, ev.totalLen);
        const sample = sampleAtS(ev.pts, ev.cum, ev.totalLen, s);
        const off = k * (14 + s * 10);
        const x = ev.pts[i].u * w + sample.nu * off;
        const y = ev.pts[i].v * h + sample.nv * off;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = k < 0 ? "rgba(241, 99, 147, 0.22)" : "rgba(243, 234, 219, 0.14)";
      ctx.lineWidth = Math.max(1.5, 4 - Math.abs(k));
      ctx.stroke();
    }
    // 远方山峦轮廓衬在明月下方
    ctx.fillStyle = "rgba(243, 234, 219, 0.12)";
    ctx.beginPath();
    ctx.moveTo(moonX - 78, moonY + moonR + 48);
    ctx.quadraticCurveTo(moonX - 24, moonY + moonR + 28, moonX, moonY + moonR - 6);
    ctx.quadraticCurveTo(moonX + 24, moonY + moonR + 28, moonX + 78, moonY + moonR + 48);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (state.scene === "editorial") {
    // 长页叙事流：沿 5 枚拍点绘制真实交错图文摘要卡框，演示隐形流动动线
    ctx.save();
    const cardLabels = ["01 引入", "02 铺陈", "03 转折", "04 递进", "05 呼应"];
    ev.orbs.forEach((orb, i) => {
      const cx = orb.u * w;
      const cy = orb.v * h;
      const cw = compact ? 64 : 88;
      const ch = compact ? 34 : 44;
      const sideX = i % 2 === 0 ? -cw - 14 : 16;
      const rx = Math.max(12, Math.min(w - cw - 12, cx + sideX));
      const ry = Math.max(14, Math.min(h - ch - 14, cy - ch / 2));
      ctx.fillStyle = "rgba(33, 11, 54, 0.84)";
      ctx.strokeStyle = ev.cadenceOk ? "rgba(241, 99, 147, 0.55)" : "rgba(255, 139, 115, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.fillRect(rx, ry, cw, ch);
      ctx.strokeRect(rx, ry, cw, ch);
      ctx.fillStyle = COLORS.moon;
      ctx.font = '600 10px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(cardLabels[i], rx + 7, ry + 6);
      ctx.fillStyle = "rgba(248, 245, 250, 0.32)";
      ctx.fillRect(rx + 7, ry + 22, cw - 18, 3);
      ctx.fillRect(rx + 7, ry + 29, cw * 0.55, 3);
    });
    ctx.restore();
  }

  // 3. 伴随主河道的细粉虚线气流轨（O(N) 邻点法线，零二分查找，末端带箭头）
  ctx.save();
  ctx.beginPath();
  let dashStarted = false;
  const invLen = 1 / Math.max(1e-5, ev.totalLen);
  const lastIdx = ev.pts.length - 1;
  for (let i = 0; i <= lastIdx; i += 2) {
    const s = ev.cum[i] * invLen;
    if (ev.gapRange && s > ev.gapRange[0] && s < ev.gapRange[1]) {
      dashStarted = false;
      continue;
    }
    const pPrev = ev.pts[Math.max(0, i - 1)];
    const pNext = ev.pts[Math.min(lastIdx, i + 1)];
    const tx = pNext.u - pPrev.u;
    const ty = pNext.v - pPrev.v;
    const tl = Math.max(1e-6, Math.hypot(tx, ty));
    const nu = -ty / tl;
    const nv = tx / tl;
    const wave = (0.044 + 0.015 * Math.sin(s * Math.PI * 3.4)) * minDim;
    const x = ev.pts[i].u * w + nu * wave;
    const y = ev.pts[i].v * h + nv * wave;
    if (!dashStarted) {
      ctx.moveTo(x, y);
      dashStarted = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.setLineDash([5, 6]);
  ctx.lineDashOffset = anim.still ? 0 : -anim.t * 26;
  ctx.strokeStyle = "rgba(249, 93, 146, 0.72)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // 气流虚线末端小箭头
  const arrowSample = sampleAtS(ev.pts, ev.cum, ev.totalLen, 0.96);
  const arrowWave = (0.044 + 0.015 * Math.sin(0.96 * Math.PI * 3.4)) * minDim;
  const ax = arrowSample.u * w + arrowSample.nu * arrowWave;
  const ay = arrowSample.v * h + arrowSample.nv * arrowWave;
  const ang = Math.atan2(arrowSample.tv * h, arrowSample.tu * w);
  drawArrowHead(ctx, ax, ay, ang, 7, COLORS.pinkBright);
  ctx.restore();

  // 4. 主珊瑚粉流势丝带（带开场描线进度 anim.reveal）
  const reveal = anim.still ? 1 : Math.min(1, anim.reveal);
  const joinStyle = state.smoothMode === "kink" ? "miter" : "round";
  const mainRibbonColor =
    state.scene === "editorial" ? "rgba(241, 99, 147, 0.56)" : COLORS.pink;

  if (ev.gapRange) {
    drawRibbonPolyline(ctx, ev.pts, ev.cum, ev.totalLen, w, h, 0, Math.min(reveal, ev.gapRange[0]), ribbonW, mainRibbonColor, joinStyle);
    if (reveal > ev.gapRange[1]) {
      drawRibbonPolyline(ctx, ev.pts, ev.cum, ev.totalLen, w, h, ev.gapRange[1], reveal, ribbonW, mainRibbonColor, joinStyle);
    }
    // 断口警示虚线桥与直接点击修复区
    const gA = sampleAtS(ev.pts, ev.cum, ev.totalLen, ev.gapRange[0]);
    const gB = sampleAtS(ev.pts, ev.cum, ev.totalLen, ev.gapRange[1]);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(gA.u * w, gA.v * h);
    ctx.lineTo(gB.u * w, gB.v * h);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.setLineDash([]);

    const gx = ev.gapCenter.u * w;
    const gy = ev.gapCenter.v * h;
    const pulse = anim.still ? 0 : Math.sin(anim.t * 4) * 2;
    ctx.beginPath();
    ctx.arc(gx, gy, 18 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 139, 115, 0.16)";
    ctx.fill();
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 简洁文字签放在断口下方，绝不与左上折角标签重叠
    const tagW = compact ? 92 : 108;
    const tagH = 22;
    const tx = Math.max(10, Math.min(w - tagW - 10, gx - tagW / 2));
    const ty = Math.min(h - tagH - 12, gy + 24);
    ctx.fillStyle = "#41101C";
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 1.2;
    ctx.fillRect(tx, ty, tagW, tagH);
    ctx.strokeRect(tx, ty, tagW, tagH);
    ctx.fillStyle = "#FFD7CE";
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("断口 · 点此弥合", tx + tagW / 2, ty + tagH / 2 + 0.5);
    ctx.restore();
  } else {
    drawRibbonPolyline(ctx, ev.pts, ev.cum, ev.totalLen, w, h, 0, reveal, ribbonW, mainRibbonColor, joinStyle);
  }

  // 若处于硬折断流错态，在最大折角顶点上方标出视觉碰撞角弧（绝不撞断口标签）
  if (state.smoothMode === "kink" || ev.maxTurnDeg > 28) {
    const kx = ev.worstTurnPoint.u * w;
    const ky = ev.worstTurnPoint.v * h;
    ctx.save();
    ctx.beginPath();
    ctx.arc(kx, ky, 22, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.setLineDash([]);
    const lbl = `硬折 ${Math.round(ev.maxTurnDeg)}°`;
    const lw = 76;
    const lx = Math.max(10, Math.min(w - lw - 10, kx - lw / 2));
    const ly = Math.max(46, ky - 48);
    ctx.fillStyle = "#41101C";
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 1.1;
    ctx.fillRect(lx, ly, lw, 20);
    ctx.strokeRect(lx, ly, lw, 20);
    ctx.fillStyle = "#FFD7CE";
    ctx.font = '600 10.5px "Space Mono", "Noto Sans SC", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl, lx + lw / 2, ly + 10.5);
    ctx.restore();
  }

  // 5. 终点象牙明月（可点击直接切换明月收束）
  ctx.save();
  // 如果处于偏靶错态，用虚线标出“失焦溜边”轨迹箭头，标签置右侧避免碰左上徽章
  if (state.focusMode === "veer") {
    const ex = ev.endPt.u * w;
    const ey = ev.endPt.v * h;
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 22, Math.max(6, ey - 20));
    ctx.stroke();
    ctx.setLineDash([]);
    const vx = Math.min(w - 106, ex + 14);
    const vy = Math.max(46, ey + 6);
    ctx.fillStyle = "#41101C";
    ctx.strokeStyle = COLORS.err;
    ctx.fillRect(vx, vy, 92, 20);
    ctx.strokeRect(vx, vy, 92, 20);
    ctx.fillStyle = "#FFD7CE";
    ctx.font = '600 10.5px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("视线溜边偏靶", vx + 46, vy + 10.5);
  }

  // 若明月过小，外圈虚线提示标准焦点体量
  if (!ev.focusOk) {
    ctx.beginPath();
    ctx.arc(moonX, moonY, Math.max(22, minDim * 0.095), 0, Math.PI * 2);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(243, 234, 219, 0.32)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fillStyle = ev.focusOk ? COLORS.moon : "rgba(243, 234, 219, 0.56)";
  ctx.fill();
  if (ev.focusOk) {
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(110, 231, 200, 0.34)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();

  // 6. 五枚拍点圆（忠实呼应 113 原海报）
  ctx.save();
  ev.orbs.forEach((orb, idx) => {
    const ox = orb.u * w;
    const oy = orb.v * h;
    const or = Math.max(7, orb.r * minDim);
    ctx.beginPath();
    ctx.arc(ox, oy, or, 0, Math.PI * 2);
    ctx.fillStyle = ev.cadenceOk ? COLORS.pink : "#D8537C";
    ctx.fill();
    if (!ev.cadenceOk) {
      ctx.strokeStyle = "rgba(255, 139, 115, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (anim.hoverOrb === idx) {
      ctx.strokeStyle = COLORS.moon;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  });
  ctx.restore();

  // 7. 实时「视线浮标」惯性试游粒子（沿曲线滑动；遇折角撞击火花、遇断口散落、达标后丝滑滑入明月）
  ctx.save();
  const sFlow = anim.still ? 0.68 : anim.gazeS;
  let blocked = false;
  let blockReason = "";
  let drawS = sFlow;

  if ((state.smoothMode === "kink" || ev.maxTurnDeg > 28) && sFlow > ev.worstTurnS) {
    drawS = ev.worstTurnS;
    blocked = true;
    blockReason = "kink";
  } else if (ev.gapRange && sFlow > ev.gapRange[0]) {
    drawS = ev.gapRange[0];
    blocked = true;
    blockReason = "gap";
  }

  // 尾迹（合批 2 档透明度，降低软件渲染绘制调用）
  for (let band = 0; band < 2; band++) {
    ctx.beginPath();
    const startI = band === 0 ? 1 : 4;
    const endI = band === 0 ? 3 : 7;
    for (let i = startI; i <= endI; i++) {
      const ts = Math.max(0, drawS - i * 0.016);
      if (ev.gapRange && ts > ev.gapRange[0] && ts < ev.gapRange[1]) continue;
      const pt = sampleAtS(ev.pts, ev.cum, ev.totalLen, ts);
      const pr = Math.max(2, 6.2 - i * 0.55);
      const px = pt.u * w;
      const py = pt.v * h;
      ctx.moveTo(px + pr, py);
      ctx.arc(px, py, pr, 0, Math.PI * 2);
    }
    ctx.fillStyle = blocked
      ? band === 0 ? "rgba(255, 139, 115, 0.56)" : "rgba(255, 139, 115, 0.28)"
      : band === 0 ? "rgba(243, 234, 219, 0.56)" : "rgba(243, 234, 219, 0.28)";
    ctx.fill();
  }

  // 浮标本体
  const head = sampleAtS(ev.pts, ev.cum, ev.totalLen, drawS);
  const hx = head.u * w;
  const hy = head.v * h;
  ctx.beginPath();
  ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = blocked ? COLORS.err : ev.passedCount === 4 ? COLORS.ok : COLORS.moon;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.bg;
  ctx.stroke();

  if (blocked && !anim.still) {
    // 撞角 / 断流刹停涟漪
    const ring = 9 + ((anim.t * 28) % 16);
    ctx.beginPath();
    ctx.arc(hx, hy, ring, 0, Math.PI * 2);
    ctx.strokeStyle = blockReason === "kink" ? "rgba(255, 139, 115, 0.7)" : "rgba(255, 139, 115, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // 8. 三个可直拖弯道塑形节点（入弯 / 中腰 / 收弯）
  ctx.save();
  state.nodes.forEach((node, idx) => {
    const nx = node.u * w;
    const ny = node.v * h;
    const isActive = idx === state.activeNode || idx === anim.dragNode;
    const r = isActive ? 11 : 8.5;

    ctx.beginPath();
    ctx.arc(nx, ny, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? "rgba(243, 234, 219, 0.22)" : "rgba(23, 6, 39, 0.45)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? COLORS.moon : COLORS.bg;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = isActive ? COLORS.pinkBright : COLORS.moon;
    ctx.stroke();

    // 节点内小圆心
    ctx.beginPath();
    ctx.arc(nx, ny, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? COLORS.bg : COLORS.pinkBright;
    ctx.fill();

    // 节点中文标签（在节点下方微偏移，绝不遮挡丝带）
    ctx.font = '600 10.5px "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isActive ? COLORS.moon : "#DFCBEB";
    ctx.fillText(node.label, nx, ny + r + 5);
  });
  ctx.restore();

  // 9. 桌面宽屏画布角落轻量呈现原海报起止折线标（起点引入 / 终点聚焦）
  if (!compact && w >= 540) {
    const p1 = sampleAtS(ev.pts, ev.cum, ev.totalLen, 0.08);
    drawElbowTag(ctx, p1.u * w, p1.v * h + 16, p1.u * w + 36, Math.min(h - 18, p1.v * h + 28), "起点引入", "START PATH", false, ev.stages[0].ok, compact);
    drawElbowTag(ctx, moonX, moonY + moonR + 8, Math.min(w - 92, moonX + 18), moonY + moonR + 34, "终点聚焦", ev.focusOk ? "FOCUS LOCKED" : "OFF TARGET", false, ev.focusOk, compact);
  }

  // 画布左上极简实时弯曲比徽章（窄屏精简文本避免拥挤）
  ctx.save();
  const badgeText = compact
    ? `弯曲比 ${ev.sinuosity.toFixed(2)}×`
    : `弯曲比 ${ev.sinuosity.toFixed(2)}× · 甜区 1.12–1.68×`;
  ctx.font = '600 11px "Space Mono", "Noto Sans SC", monospace';
  const tw = ctx.measureText(badgeText).width + 20;
  ctx.fillStyle = "rgba(23, 6, 39, 0.86)";
  ctx.strokeStyle = ev.curveOk ? "rgba(110, 231, 200, 0.55)" : "rgba(241, 99, 147, 0.5)";
  ctx.lineWidth = 1;
  ctx.fillRect(14, 14, tw, 26);
  ctx.strokeRect(14, 14, tw, 26);
  ctx.fillStyle = ev.curveOk ? COLORS.ok : COLORS.white;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, 24, 27.5);
  ctx.restore();
}

// ============================================================================
// Section 02: 三阶连续性（C0 折线 / C1 圆弧拼接 / C2 柔弯样条）曲率梳与视线惯性画布
// ============================================================================
export function renderCurvatureLab(canvas, opts, anim) {
  const { ctx, w, h } = fitCanvas(canvas);
  const { order, amp } = opts; // order: "c0" | "c1" | "c2", amp: 0.15..0.95
  const padX = Math.max(24, w * 0.07);
  const midY = h * 0.54;
  const maxAmp = Math.min(h * 0.30, 88) * amp;
  const usableW = w - padX * 2;

  ctx.fillStyle = "#170627";
  ctx.fillRect(0, 0, w, h);

  // 水平基准轴
  ctx.strokeStyle = "rgba(241, 99, 147, 0.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(padX, midY);
  ctx.lineTo(w - padX, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 采样曲线 y(u)
  const N = 140;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = padX + u * usableW;
    let y = midY;
    if (order === "c0") {
      // 锯齿折线（在 0.25, 0.5, 0.75 处存在 C0 硬折）
      if (u < 0.25) y = midY - (u / 0.25) * maxAmp;
      else if (u < 0.75) y = midY - maxAmp + ((u - 0.25) / 0.5) * (maxAmp * 2);
      else y = midY + maxAmp - ((u - 0.75) / 0.25) * maxAmp;
    } else if (order === "c1") {
      // 两段半圆弧/抛物线硬拼接：切线在 u=0.5 连续，但曲率瞬间反号跳变
      if (u < 0.5) {
        const s = (u - 0.25) / 0.25;
        y = midY - maxAmp * (1 - s * s);
      } else {
        const s = (u - 0.75) / 0.25;
        y = midY + maxAmp * (1 - s * s);
      }
    } else {
      // C2 平滑正弦样条：位置、切线、曲率全程连续渐变
      y = midY - Math.sin(u * Math.PI * 2) * maxAmp;
    }
    pts.push({ x, y, u });
  }

  // 绘制曲率梳（每个采样点按二阶差分 κ 垂直画梳齿，直观展示 C0 爆针 / C1 断阶 / C2 柔波）
  ctx.save();
  for (let i = 3; i < N - 3; i += 2) {
    const a = pts[i - 2];
    const b = pts[i];
    const c = pts[i + 2];
    const dx1 = b.x - a.x;
    const dy1 = b.y - a.y;
    const dx2 = c.x - b.x;
    const dy2 = c.y - b.y;
    const cross = dx1 * dy2 - dy1 * dx2;
    const d1 = Math.hypot(dx1, dy1);
    const d2 = Math.hypot(dx2, dy2);
    const kappa = cross / Math.max(1e-4, d1 * d2 * ((d1 + d2) * 0.5));
    const tx = (c.x - a.x) / Math.max(1e-4, Math.hypot(c.x - a.x, c.y - a.y));
    const ty = (c.y - a.y) / Math.max(1e-4, Math.hypot(c.x - a.x, c.y - a.y));
    const nx = -ty;
    const ny = tx;
    const combLen = Math.max(-52, Math.min(52, kappa * 2400));
    const spike = Math.abs(combLen) > 36;
    ctx.strokeStyle = spike ? COLORS.err : "rgba(243, 234, 219, 0.42)";
    ctx.lineWidth = spike ? 1.8 : 1;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + nx * combLen, b.y + ny * combLen);
    ctx.stroke();
  }
  ctx.restore();

  // 主曲线
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = order === "c0" ? COLORS.err : order === "c1" ? "#F7A6C1" : COLORS.pink;
  ctx.lineWidth = 4;
  ctx.lineJoin = order === "c0" ? "miter" : "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // 移动视线粒子与切线甩出示意
  const pIdx = anim.still ? Math.floor(N * 0.36) : Math.floor(((anim.t * 0.36) % 1) * (N - 2)) + 1;
  const cur = pts[pIdx];
  const prev = pts[Math.max(0, pIdx - 2)];
  const next = pts[Math.min(N, pIdx + 2)];
  const angA = Math.atan2(cur.y - prev.y, cur.x - prev.x);
  const angB = Math.atan2(next.y - cur.y, next.x - cur.x);
  let jump = Math.abs(angB - angA);
  if (jump > Math.PI) jump = Math.PI * 2 - jump;

  // 在 C0 折点处标红，在 C1 中点标曲率跳变
  if (order === "c0") {
    [Math.floor(N * 0.25), Math.floor(N * 0.75)].forEach((k) => {
      ctx.beginPath();
      ctx.arc(pts[k].x, pts[k].y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  } else if (order === "c1") {
    const mid = pts[Math.floor(N * 0.5)];
    ctx.beginPath();
    ctx.arc(mid.x, mid.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.moon;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 视线圆点
  ctx.beginPath();
  ctx.arc(cur.x, cur.y, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = jump > 0.25 ? COLORS.err : order === "c2" ? COLORS.ok : COLORS.moon;
  ctx.fill();
  ctx.strokeStyle = COLORS.bg;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 顶部紧凑图例
  ctx.fillStyle = COLORS.white;
  ctx.font = '600 11.5px "Space Mono", "Noto Sans SC", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const tag =
    order === "c0"
      ? "C0 位置相连 · 顶点曲率飙升，视线撞角急刹"
      : order === "c1"
        ? "C1 切线相连 · 拐点曲率瞬间反号，手感微顿"
        : "C2 曲率渐变 · 梳齿平滑过渡，视线丝滑滑行";
  ctx.fillText(tag, 16, 14);
}
