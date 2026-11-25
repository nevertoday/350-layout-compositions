// 018 对称构图 · 开场无框薄荷青对折校准台（2D Canvas，严格纯三色平涂）
import { pixelRatio } from "../../lib/stage.js";
import { computeMetrics } from "./model.js";

const COLORS = {
  mint: "#8BE0CF",
  navy: "#032A48",
  cream: "#F9F0D6",
};

// 追踪单侧「外廓」路径（用于精确 XOR 斜线错位区计算与深蓝细虚线轮廓）
function traceOuterPaths(ctx, subject, spread, lift, u) {
  const liftY = lift * u * 0.42;

  if (subject === "poster") {
    const gap = u * 0.082;
    const outerX = u * (0.90 * spread);
    const wingH = u * 0.77;
    const topY = -wingH + liftY * 0.55;
    const botY = wingH + liftY * 0.35;
    const midY = (topY + botY) * 0.5;
    const halfH = (botY - topY) * 0.5;
    const bandW = u * 0.275 * (0.74 + 0.26 * spread);
    const innerEdge = Math.min(outerX - u * 0.06, gap + bandW);
    const innerH = halfH * 0.64;

    const notchX = innerEdge + (outerX - innerEdge) * 0.26;
    ctx.beginPath();
    ctx.moveTo(outerX, topY);
    ctx.bezierCurveTo(
      gap + (outerX - gap) * 0.22, topY,
      gap, midY - halfH * 0.58,
      gap, midY
    );
    ctx.bezierCurveTo(
      gap, midY + halfH * 0.58,
      gap + (outerX - gap) * 0.22, botY,
      outerX, botY
    );
    ctx.lineTo(outerX, midY + innerH);
    ctx.bezierCurveTo(
      outerX, midY + innerH * 0.3,
      notchX + u * 0.19, midY + u * 0.04,
      notchX, midY
    );
    ctx.bezierCurveTo(
      notchX + u * 0.19, midY - u * 0.04,
      outerX, midY - innerH * 0.3,
      outerX, midY - innerH
    );
    ctx.closePath();

    // 顶部触须圆
    const orbX = outerX * 0.96;
    const orbY = topY - u * 0.135;
    const orbR = u * 0.115;
    ctx.moveTo(orbX + orbR, orbY);
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);

    // 底部斜叶
    const lx = gap + (outerX - gap) * 0.36;
    const ly = botY + u * 0.04;
    const cos = Math.cos(-0.60);
    const sin = Math.sin(-0.60);
    const pt = (px, py) => [lx + px * cos - py * sin, ly + px * sin + py * cos];
    const [p0x, p0y] = pt(0, -u * 0.20);
    const [c1x, c1y] = pt(u * 0.13, -u * 0.06);
    const [c2x, c2y] = pt(u * 0.13, u * 0.08);
    const [p1x, p1y] = pt(0, u * 0.20);
    const [c3x, c3y] = pt(-u * 0.13, u * 0.08);
    const [c4x, c4y] = pt(-u * 0.13, -u * 0.06);
    ctx.moveTo(p0x, p0y);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p1x, p1y);
    ctx.bezierCurveTo(c3x, c3y, c4x, c4y, p0x, p0y);
    ctx.closePath();
  } else if (subject === "facade") {
    const wingW = u * (0.94 * spread);
    const roofY = -u * 0.44 + liftY * 0.45;
    const baseY = u * 0.68;
    const pedW = Math.min(wingW * 0.56, u * 0.54);
    ctx.beginPath();
    ctx.rect(0, roofY, wingW, baseY - roofY + u * 0.07);
    ctx.moveTo(0, roofY - u * 0.35 + liftY * 0.2);
    ctx.lineTo(pedW, roofY);
    ctx.lineTo(0, roofY);
    ctx.closePath();
  } else {
    const cardW = u * (0.90 * spread);
    const cardTop = -u * 0.80 + liftY * 0.35;
    const cardH = u * 1.60;
    ctx.beginPath();
    ctx.rect(u * 0.025, cardTop, cardW - u * 0.025, cardH);
  }
}

// 追踪单侧「内瓣/细部」路径（用于近似对称模式下实时显示细部 XOR 斜线错位区与虚线轮廓）
function traceDetailPaths(ctx, subject, spread, lift, u, dx, dy) {
  const liftY = lift * u * 0.42;

  if (subject === "poster") {
    const gap = u * 0.082;
    const outerX = u * (0.90 * spread);
    const wingH = u * 0.77;
    const topY = -wingH + liftY * 0.55;
    const botY = wingH + liftY * 0.35;
    const midY = (topY + botY) * 0.5;
    const halfH = (botY - topY) * 0.5;
    const bandW = u * 0.275 * (0.74 + 0.26 * spread);
    const innerEdge = Math.min(outerX - u * 0.06, gap + bandW);
    const innerH = halfH * 0.64;

    const notchX = innerEdge + (outerX - innerEdge) * (0.26 + dx * 0.28);
    const lobeShiftY = dy * innerH * 0.32;
    const topEdge = midY - innerH + Math.max(0, lobeShiftY * 0.65);
    const botEdge = midY + innerH + Math.min(0, lobeShiftY * 0.65);
    const tipX = outerX - Math.max(0, dx) * u * 0.14;

    ctx.beginPath();
    ctx.moveTo(innerEdge, midY + lobeShiftY * 0.4);
    ctx.bezierCurveTo(
      innerEdge, midY - innerH * 0.56,
      innerEdge + (outerX - innerEdge) * 0.14, topEdge,
      tipX, topEdge
    );
    ctx.bezierCurveTo(
      tipX, midY - innerH * 0.26 + lobeShiftY * 0.5,
      notchX + u * 0.18, midY + lobeShiftY - u * 0.04,
      notchX, midY + lobeShiftY
    );
    ctx.bezierCurveTo(
      notchX + u * 0.18, midY + lobeShiftY + u * 0.04,
      tipX, midY + innerH * 0.26 + lobeShiftY * 0.5,
      tipX, botEdge
    );
    ctx.bezierCurveTo(
      innerEdge + (outerX - innerEdge) * 0.14, botEdge,
      innerEdge, midY + innerH * 0.56,
      innerEdge, midY + lobeShiftY * 0.4
    );
    ctx.closePath();

    // 底部小叶也随细节手势偏转/移位
    const lx = gap + (outerX - gap) * (0.36 + dx * 0.14);
    const ly = botY + u * (0.04 + dy * 0.08);
    const angle = -0.60 + dx * 0.34 - dy * 0.28;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pt = (px, py) => [lx + px * cos - py * sin, ly + px * sin + py * cos];
    const [p0x, p0y] = pt(0, -u * 0.20);
    const [c1x, c1y] = pt(u * 0.13, -u * 0.06);
    const [c2x, c2y] = pt(u * 0.13, u * 0.08);
    const [p1x, p1y] = pt(0, u * 0.20);
    const [c3x, c3y] = pt(-u * 0.13, u * 0.08);
    const [c4x, c4y] = pt(-u * 0.13, -u * 0.06);
    ctx.moveTo(p0x, p0y);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p1x, p1y);
    ctx.bezierCurveTo(c3x, c3y, c4x, c4y, p0x, p0y);
    ctx.closePath();
  } else if (subject === "facade") {
    const wingW = u * (0.94 * spread);
    const roofY = -u * 0.44 + liftY * 0.45;
    const col1 = wingW * 0.42;
    const col2 = wingW * 0.78;
    const winX = (col1 + col2) * 0.5 + dx * u * 0.07;
    const winW = Math.max(u * 0.11, (col2 - col1) * 0.48);
    const winY = roofY + u * (0.20 + dy * 0.14);
    const winH = u * (0.50 - Math.abs(dx) * 0.12);
    ctx.beginPath();
    if (Math.hypot(dx, dy) > 0.25) {
      const r = winW * 0.48;
      ctx.arc(winX, winY + r * 0.9, r, 0, Math.PI * 2);
      ctx.rect(winX - winW * 0.46, winY + r * 2.15, winW * 0.92, Math.max(u * 0.16, winH * 0.55));
    } else {
      ctx.rect(winX - winW * 0.5, winY, winW, winH);
    }
  } else {
    const cardW = u * (0.90 * spread);
    const cardTop = -u * 0.80 + liftY * 0.35;
    const cardH = u * 1.60;
    const cyM = liftY * 0.25 + dy * u * 0.16;
    const cutW = u * (0.18 + dx * 0.08);
    const cutH = u * (0.16 + Math.abs(dy) * 0.06);
    ctx.beginPath();
    ctx.moveTo(u * 0.04, cyM - cutH);
    ctx.lineTo(u * 0.04 + Math.max(u * 0.08, cutW), cyM);
    ctx.lineTo(u * 0.04, cyM + cutH);
    ctx.closePath();
    const footY = cardTop + cardH - u * 0.34;
    ctx.rect(u * 0.08, footY + u * 0.09, Math.max(u * 0.15, cardW * (0.44 + dx * 0.18)), u * 0.04);
  }
}

// 绘制单侧完整标本（side = -1 左翼，+1 右翼；始终纯三色平涂，零半透明叠色）
function drawHalfMotif(ctx, side, subject, spread, lift, u, dx = 0, dy = 0) {
  ctx.save();
  ctx.scale(side, 1);

  const liftY = lift * u * 0.42;
  const detailMag = Math.hypot(dx, dy);

  if (subject === "poster") {
    const gap = u * 0.082;
    const outerX = u * (0.90 * spread);
    const wingH = u * 0.77;
    const topY = -wingH + liftY * 0.55;
    const botY = wingH + liftY * 0.35;
    const midY = (topY + botY) * 0.5;
    const halfH = (botY - topY) * 0.5;
    const bandW = u * 0.275 * (0.74 + 0.26 * spread);
    const innerEdge = Math.min(outerX - u * 0.06, gap + bandW);
    const innerH = halfH * 0.64;

    // 1. 奶油厚弧外翼（面向中轴拱起、朝外开口）
    ctx.beginPath();
    ctx.moveTo(outerX, topY);
    ctx.bezierCurveTo(
      gap + (outerX - gap) * 0.22, topY,
      gap, midY - halfH * 0.58,
      gap, midY
    );
    ctx.bezierCurveTo(
      gap, midY + halfH * 0.58,
      gap + (outerX - gap) * 0.22, botY,
      outerX, botY
    );
    ctx.lineTo(outerX, midY + innerH);
    ctx.bezierCurveTo(
      innerEdge + (outerX - innerEdge) * 0.14, midY + innerH,
      innerEdge, midY + innerH * 0.56,
      innerEdge, midY
    );
    ctx.bezierCurveTo(
      innerEdge, midY - innerH * 0.56,
      innerEdge + (outerX - innerEdge) * 0.14, midY - innerH,
      outerX, midY - innerH
    );
    ctx.closePath();
    ctx.fillStyle = COLORS.cream;
    ctx.fill();

    // 2. 内嵌深海墨蓝双叶蝶瓣（近似对称模式下随手势变形与微调）
    const notchX = innerEdge + (outerX - innerEdge) * (0.26 + dx * 0.28);
    const lobeShiftY = dy * innerH * 0.32;
    const lobeTop = midY - innerH + Math.max(0, lobeShiftY * 0.65);
    const lobeBot = midY + innerH + Math.min(0, lobeShiftY * 0.65);
    const tipX = outerX - Math.max(0, dx) * u * 0.14;

    ctx.beginPath();
    ctx.moveTo(innerEdge, midY + lobeShiftY * 0.4);
    ctx.bezierCurveTo(
      innerEdge, midY - innerH * 0.56,
      innerEdge + (outerX - innerEdge) * 0.14, lobeTop,
      tipX, lobeTop
    );
    ctx.bezierCurveTo(
      tipX, midY - innerH * 0.26 + lobeShiftY * 0.5,
      notchX + u * 0.18, midY + lobeShiftY - u * 0.04,
      notchX, midY + lobeShiftY
    );
    ctx.bezierCurveTo(
      notchX + u * 0.18, midY + lobeShiftY + u * 0.04,
      tipX, midY + innerH * 0.26 + lobeShiftY * 0.5,
      tipX, lobeBot
    );
    ctx.bezierCurveTo(
      innerEdge + (outerX - innerEdge) * 0.14, lobeBot,
      innerEdge, midY + innerH * 0.56,
      innerEdge, midY + lobeShiftY * 0.4
    );
    ctx.closePath();
    ctx.fillStyle = COLORS.navy;
    ctx.fill();

    // 近似对称细部明显变化时，在内瓣上下对称浮现纯几何奶油菱形镂空（非拟人五官）
    if (detailMag > 0.12) {
      const k = Math.min(1, (detailMag - 0.12) / 0.34);
      const dSize = u * (0.048 * k);
      const cxD = innerEdge + (tipX - innerEdge) * 0.48;
      const ys = [
        lobeTop + (midY + lobeShiftY - lobeTop) * 0.48,
        midY + lobeShiftY + (lobeBot - (midY + lobeShiftY)) * 0.52,
      ];
      ctx.fillStyle = COLORS.cream;
      for (const cyD of ys) {
        ctx.beginPath();
        ctx.moveTo(cxD, cyD - dSize);
        ctx.lineTo(cxD + dSize * 0.85, cyD);
        ctx.lineTo(cxD, cyD + dSize);
        ctx.lineTo(cxD - dSize * 0.85, cyD);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 3. 顶部悬浮奶油圆点
    const orbX = outerX * 0.96;
    const orbY = topY - u * 0.135;
    const orbR = u * 0.115;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.cream;
    ctx.fill();

    // 4. 底部奶油斜叶
    ctx.save();
    ctx.translate(gap + (outerX - gap) * (0.36 + dx * 0.14), botY + u * (0.04 + dy * 0.08));
    ctx.rotate(-0.60 + dx * 0.34 - dy * 0.28);
    ctx.beginPath();
    ctx.moveTo(0, -u * 0.20);
    ctx.bezierCurveTo(u * 0.13, -u * 0.06, u * 0.13, u * 0.08, 0, u * 0.20);
    ctx.bezierCurveTo(-u * 0.13, u * 0.08, -u * 0.13, -u * 0.06, 0, -u * 0.20);
    ctx.closePath();
    ctx.fillStyle = COLORS.cream;
    ctx.fill();
    ctx.restore();
  } else if (subject === "facade") {
    const wingW = u * (0.94 * spread);
    const roofY = -u * 0.44 + liftY * 0.45;
    const baseY = u * 0.68;

    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, baseY - u * 0.08, wingW * 1.04, u * 0.08);
    ctx.fillRect(0, baseY, wingW * 1.09, u * 0.07);

    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(0, roofY, wingW, baseY - u * 0.08 - roofY);

    const pedW = Math.min(wingW * 0.56, u * 0.54);
    ctx.beginPath();
    ctx.moveTo(0, roofY - u * 0.35 + liftY * 0.2);
    ctx.lineTo(pedW, roofY);
    ctx.lineTo(0, roofY);
    ctx.closePath();
    ctx.fillStyle = COLORS.navy;
    ctx.fill();

    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, roofY - u * 0.04, wingW * 1.02, u * 0.06);

    ctx.beginPath();
    ctx.moveTo(0, baseY - u * 0.08);
    ctx.lineTo(u * 0.16, baseY - u * 0.08);
    ctx.lineTo(u * 0.16, u * 0.14);
    ctx.arc(0, u * 0.14, u * 0.16, 0, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = COLORS.navy;
    ctx.fill();

    const col1 = wingW * 0.42;
    const col2 = wingW * 0.78;
    const colW = u * 0.065;
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(col1 - colW / 2, roofY + u * 0.04, colW, baseY - u * 0.12 - roofY);
    ctx.fillRect(col2 - colW / 2, roofY + u * 0.04, colW, baseY - u * 0.12 - roofY);

    const winX = (col1 + col2) * 0.5 + dx * u * 0.07;
    const winW = Math.max(u * 0.11, (col2 - col1) * 0.48);
    const winY = roofY + u * (0.20 + dy * 0.14);
    const winH = u * (0.50 - Math.abs(dx) * 0.12);
    ctx.fillStyle = COLORS.navy;
    if (detailMag > 0.25) {
      const r = winW * 0.48;
      ctx.beginPath();
      ctx.arc(winX, winY + r * 0.9, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(winX - winW * 0.46, winY + r * 2.15, winW * 0.92, Math.max(u * 0.16, winH * 0.55));
    } else {
      ctx.fillRect(winX - winW * 0.5, winY, winW, winH);
    }

    ctx.beginPath();
    ctx.arc(wingW * 0.94, roofY - u * 0.12, u * 0.065, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.cream;
    ctx.fill();
  } else {
    const cardW = u * (0.90 * spread);
    const cardTop = -u * 0.80 + liftY * 0.35;
    const cardH = u * 1.60;

    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(u * 0.025, cardTop, cardW - u * 0.025, cardH);

    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = Math.max(1.3, u * 0.015);
    ctx.strokeRect(u * 0.025, cardTop + u * 0.07, cardW - u * 0.095, cardH - u * 0.14);

    const barW = cardW * 0.72;
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(u * 0.05, cardTop + u * 0.17, barW, u * 0.13);
    ctx.fillRect(u * 0.05, cardTop + u * 0.35, barW * 0.68, u * 0.055);

    const cyM = liftY * 0.25;
    ctx.beginPath();
    ctx.arc(u * 0.025, cyM, u * (0.31 * Math.min(1.16, spread)), -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = COLORS.navy;
    ctx.fill();

    const cutY = cyM + dy * u * 0.16;
    const cutW = Math.max(u * 0.08, u * (0.18 + dx * 0.08));
    const cutH = u * (0.16 + Math.abs(dy) * 0.06);
    ctx.beginPath();
    if (detailMag > 0.32) {
      ctx.rect(u * 0.04, cutY - cutH * 0.85, cutW * 0.9, cutH * 1.7);
    } else {
      ctx.moveTo(u * 0.04, cutY - cutH);
      ctx.lineTo(u * 0.04 + cutW, cutY);
      ctx.lineTo(u * 0.04, cutY + cutH);
      ctx.closePath();
    }
    ctx.fillStyle = COLORS.cream;
    ctx.fill();

    const footY = cardTop + cardH - u * 0.34;
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(u * 0.08, footY, cardW * 0.58, u * 0.04);
    ctx.fillRect(u * 0.08, footY + u * 0.09, Math.max(u * 0.15, cardW * (0.44 + dx * 0.18)), u * 0.036);
  }

  ctx.restore();
}

export function createHeroCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  let width = 600;
  let height = 460;
  let dpr = 1;

  // 预建纯净 45° 双色斜线错位纹（透明底 + 纯墨蓝 #032A48 与纯暖奶油 #F9F0D6 实线，零灰底叠色）
  const hatchTile = document.createElement("canvas");
  hatchTile.width = 12;
  hatchTile.height = 12;
  const hctx = hatchTile.getContext("2d");
  hctx.strokeStyle = COLORS.cream;
  hctx.lineWidth = 1.6;
  hctx.beginPath();
  hctx.moveTo(-4, 10);
  hctx.lineTo(10, -4);
  hctx.moveTo(2, 16);
  hctx.lineTo(16, 2);
  hctx.stroke();

  hctx.strokeStyle = COLORS.navy;
  hctx.lineWidth = 2.0;
  hctx.beginPath();
  hctx.moveTo(-2, 10);
  hctx.lineTo(10, -2);
  hctx.moveTo(4, 16);
  hctx.lineTo(16, 4);
  hctx.stroke();
  const hatchPattern = ctx.createPattern(hatchTile, "repeat");

  // 复用离屏 XOR 错位蒙版画布（零每帧分配）
  const diffCanvas = document.createElement("canvas");
  const dctx = diffCanvas.getContext("2d");

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(240, rect.width);
    height = Math.max(200, rect.height);
    dpr = pixelRatio(2);
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const diffScale = Math.min(dpr, 1.25);
    const dw = Math.max(160, Math.round(width * diffScale));
    const dh = Math.max(160, Math.round(height * diffScale));
    if (diffCanvas.width !== dw || diffCanvas.height !== dh) {
      diffCanvas.width = dw;
      diffCanvas.height = dh;
    }
  }

  function geometry() {
    const cx = width * 0.5;
    const cy = height * 0.51;
    const u = Math.min(width * 0.415, height * 0.40, 340);
    const axisHalf = Math.min(u * 1.12, Math.min(cx, cy) - 14);
    return { cx, cy, u, axisHalf };
  }

  function localToScreen(lx, ly) {
    const { cx, cy } = geometry();
    return { x: cx + lx, y: cy + ly };
  }

  function screenToLocal(sx, sy) {
    const { cx, cy } = geometry();
    return { x: sx - cx, y: sy - cy };
  }

  function wingHandlePosition(state) {
    const { u } = geometry();
    let lx;
    let ly;
    if (state.mode === "near") {
      lx = -u * (0.58 - state.detailDx * 0.18);
      ly = state.detailDy * u * 0.26;
    } else {
      lx = -u * (0.90 * state.leftSpread);
      ly = state.leftLift * u * 0.42;
    }
    const p = localToScreen(lx, ly);
    return {
      x: Math.max(24, Math.min(width - 24, p.x)),
      y: Math.max(24, Math.min(height - 24, p.y)),
      u,
    };
  }

  function hingeHandlePosition(state) {
    const { u } = geometry();
    const shiftX = state.fold * u * 0.28;
    const p = localToScreen(shiftX, 0);
    return {
      x: Math.max(26, Math.min(width - 26, p.x)),
      y: Math.max(26, Math.min(height - 26, p.y)),
    };
  }

  // 在离屏画布计算精确 XOR 错位区，再用纯净 45° 双色斜线填充后叠到主画布右侧
  function drawHatchedMismatch(state, metrics, cx, cy, u, scaleIntro, alpha) {
    if (alpha <= 0.02) return;
    const diffScale = diffCanvas.width / width;
    dctx.save();
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.clearRect(0, 0, diffCanvas.width, diffCanvas.height);

    dctx.scale(diffScale, diffScale);
    dctx.translate(cx, cy);
    dctx.scale(scaleIntro, scaleIntro);

    dctx.fillStyle = "#000";
    if (state.mode === "outer") {
      traceOuterPaths(dctx, state.subject, metrics.rightSpread, metrics.rightLift, u);
      dctx.fill();
      dctx.globalCompositeOperation = "xor";
      traceOuterPaths(dctx, state.subject, metrics.activeLeftSpread, metrics.activeLeftLift, u);
      dctx.fill();
    } else {
      traceDetailPaths(dctx, state.subject, metrics.rightSpread, metrics.rightLift, u, 0, 0);
      dctx.fill();
      dctx.globalCompositeOperation = "xor";
      traceDetailPaths(
        dctx,
        state.subject,
        metrics.activeLeftSpread,
        metrics.activeLeftLift,
        u,
        state.detailDx,
        state.detailDy
      );
      dctx.fill();
    }

    dctx.globalCompositeOperation = "source-in";
    dctx.setTransform(diffScale, 0, 0, diffScale, 0, 0);
    dctx.fillStyle = hatchPattern;
    dctx.fillRect(0, 0, width, height);
    dctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(diffCanvas, 0, 0, diffCanvas.width, diffCanvas.height, 0, 0, width, height);
    ctx.restore();
  }

  function draw(state) {
    resize();
    const { cx, cy, u, axisHalf } = geometry();
    const metrics = computeMetrics(state);
    const intro = state.intro;
    const scaleIntro = 0.90 + 0.10 * intro;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 纯净无框薄荷青底纸
    ctx.fillStyle = COLORS.mint;
    ctx.fillRect(0, 0, width, height);

    // 2. 进入中轴局部坐标系
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleIntro, scaleIntro);

    const fold = state.fold;
    const foldCos = Math.cos(fold * Math.PI); // +1 -> 0 -> -1
    const leftDx = state.mode === "near" ? state.detailDx : 0;
    const leftDy = state.mode === "near" ? state.detailDy : 0;
    const hasMismatch = state.mode === "outer" ? !metrics.outerLocked : !metrics.detailLocked;
    const draggingWing = state.dragging === "wing";

    // 未对齐时，在左侧画出右翼的镜像参考深蓝细虚线轮廓，告诉用户「磁吸目标在哪」
    if (state.mode === "outer" && !metrics.outerLocked && fold < 0.25) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.globalAlpha = (draggingWing ? 0.65 : 0.42) * (1 - fold * 4);
      traceOuterPaths(ctx, state.subject, metrics.rightSpread, metrics.rightLift, u);
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 右半翼（锚定不动，始终保持纯三色干净平涂，绝不叠半透明灰米色带）
    drawHalfMotif(ctx, 1, state.subject, metrics.rightSpread, metrics.rightLift, u, 0, 0);

    // 左半翼（未折叠时实色平涂；折叠过程前 90° 随折页收窄，过 90° 后改为右侧深蓝细虚线翻叠轮廓）
    if (fold < 0.008) {
      drawHalfMotif(
        ctx,
        -1,
        state.subject,
        metrics.activeLeftSpread,
        metrics.activeLeftLift,
        u,
        leftDx,
        leftDy
      );
    } else {
      const leafW = u * 1.14;
      const leafH = u * 1.02;
      const absCos = Math.abs(foldCos);

      if (foldCos > 0) {
        // 0° -> 90°：左半翼沿中轴翻起透视收窄
        ctx.save();
        ctx.scale(foldCos, 1);
        drawHalfMotif(
          ctx,
          -1,
          state.subject,
          metrics.activeLeftSpread,
          metrics.activeLeftLift,
          u,
          leftDx,
          leftDy
        );
        ctx.strokeStyle = COLORS.navy;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-leafW, -leafH, leafW, leafH * 2);
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        // 90° -> 180°：翻到右侧后右翼保持纯平涂，仅用深蓝细虚线描出折页边框与翻叠左翼轮廓
        ctx.save();
        ctx.scale(-foldCos, 1);
        ctx.strokeStyle = COLORS.navy;
        ctx.globalAlpha = 0.34;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, -leafH, leafW, leafH * 2);

        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 5]);
        if (state.mode === "outer") {
          traceOuterPaths(ctx, state.subject, metrics.activeLeftSpread, metrics.activeLeftLift, u);
        } else {
          traceOuterPaths(ctx, state.subject, metrics.activeLeftSpread, metrics.activeLeftLift, u);
          ctx.stroke();
          traceDetailPaths(ctx, state.subject, metrics.activeLeftSpread, metrics.activeLeftLift, u, leftDx, leftDy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 翻折中段仅在折缝处给一条极轻折线提示，完全合拢后归零，避免染色右翼
      const midArc = Math.sin(fold * Math.PI);
      if (midArc > 0.08) {
        ctx.save();
        ctx.strokeStyle = COLORS.navy;
        ctx.globalAlpha = 0.24 * midArc;
        ctx.lineWidth = 3 * midArc;
        ctx.beginPath();
        ctx.moveTo(0, -leafH);
        ctx.lineTo(0, leafH);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 磁吸锁回 100% 时的温和光环反馈
    if (state.snapPulse > 0.02) {
      ctx.save();
      ctx.globalAlpha = state.snapPulse * 0.65;
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 2.5;
      const r = u * (0.28 + (1 - state.snapPulse) * 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // 离开局部坐标，在屏幕空间叠加精确 XOR 45° 斜线错位层

    // 3. 错位只用 45° 纯净斜线区表示（零灰米色半透明影子）
    if (hasMismatch) {
      let hatchAlpha = 0;
      if (fold > 0.55) {
        hatchAlpha = Math.min(1, (fold - 0.55) / 0.28);
      } else if (draggingWing) {
        hatchAlpha = 1;
      } else if (fold < 0.2) {
        hatchAlpha = 0.92 * (1 - fold * 5);
      }
      if (hatchAlpha > 0.02) {
        drawHatchedMismatch(state, metrics, cx, cy, u, scaleIntro, hatchAlpha);
      }
    }

    // 4. 在右侧用与左翼目标虚线框同款的「深蓝细虚线轮廓」标出左翼翻叠边界（不填充半透明底色）
    if (fold < 0.5 && (draggingWing || hasMismatch)) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scaleIntro, scaleIntro);
      ctx.globalAlpha = (draggingWing ? 0.80 : 0.52) * (1 - fold * 2);
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      if (state.mode === "outer") {
        traceOuterPaths(ctx, state.subject, metrics.activeLeftSpread, metrics.activeLeftLift, u);
      } else {
        traceDetailPaths(ctx, state.subject, metrics.activeLeftSpread, metrics.activeLeftLift, u, leftDx, leftDy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 中轴虚线与正中对折铰链（忠实复刻 018 原海报）
    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(0, -axisHalf);
    ctx.lineTo(0, axisHalf);
    ctx.stroke();
    ctx.setLineDash([]);

    // 上下对称轴端圆点
    ctx.fillStyle = COLORS.navy;
    ctx.beginPath();
    ctx.arc(0, -axisHalf, 3.4, 0, Math.PI * 2);
    ctx.arc(0, axisHalf, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // 中心海蓝圆铰链 + 横耳 + 向右翻折轻弧箭头
    const hingeX = fold * u * 0.28;
    if (fold < 0.35) {
      ctx.save();
      ctx.globalAlpha = 0.76 * (1 - fold * 2.8);
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hingeX + 8, 0, 22, -0.78, 0.78);
      ctx.stroke();
      const ax = hingeX + 8 + Math.cos(0.78) * 22;
      const ay = Math.sin(0.78) * 22;
      ctx.beginPath();
      ctx.moveTo(ax - 5, ay - 5);
      ctx.lineTo(ax, ay);
      ctx.lineTo(ax + 3.5, ay - 6);
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(hingeX - 17, 0);
    ctx.lineTo(hingeX + 17, 0);
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(hingeX, 0, 9.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.navy;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hingeX, 0, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.cream;
    ctx.fill();

    // 若为「近似对称」模式，在左翼内瓣区域轻点一圈虚线提示可拖细节
    if (state.mode === "near" && fold < 0.25 && state.dragging !== "wing") {
      ctx.save();
      ctx.globalAlpha = 0.52 * (1 - fold * 4);
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(-u * (0.58 - state.detailDx * 0.18), state.detailDy * u * 0.26, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  return {
    resize,
    draw,
    wingHandlePosition,
    hingeHandlePosition,
    screenToLocal,
    geometry,
  };
}
