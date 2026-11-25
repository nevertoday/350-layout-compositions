// 028 偏轴构图 · 全部 2D Canvas 绘图引擎
// 严格遵循 028 原海报配色与几何气质；人物全部采用无五官侧影/背影剪影；所有圆均用 Math.min(w,h) 实算绝不拉扁。

import { PALETTE, ANCHOR_MODES, evaluateHero } from "./model.js";

function fitCanvas(canvas, dpr, knownSize = null) {
  let w, h;
  if (knownSize && knownSize.w > 0 && knownSize.h > 0) {
    w = knownSize.w;
    h = knownSize.h;
  } else {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
  }
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// 绘制无五官大衣剪影（背影/微侧影，纯轮廓，完全复刻 028 原海报孤独旅人气质）
function drawCloakedFigure(ctx, x, footY, scale, facing, color = PALETTE.plumDark) {
  ctx.save();
  ctx.translate(x, footY);
  ctx.scale(facing * scale, scale);

  // 地面拉长斜影
  ctx.fillStyle = "rgba(22, 10, 28, 0.34)";
  ctx.beginPath();
  ctx.ellipse(16, 4, 24, 4.2, 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  // 双腿站姿（微步向前）
  ctx.beginPath();
  ctx.moveTo(-4, -28);
  ctx.lineTo(-6, 1);
  ctx.lineTo(-1, 1);
  ctx.lineTo(1, -24);
  ctx.lineTo(5, 2);
  ctx.lineTo(10, 2);
  ctx.lineTo(7, -28);
  ctx.closePath();
  ctx.fill();

  // 长款风衣/斗篷轮廓（无五官）
  ctx.beginPath();
  ctx.moveTo(-7, -74);
  ctx.quadraticCurveTo(-13, -52, -13, -24);
  ctx.lineTo(11, -26);
  ctx.quadraticCurveTo(13, -50, 9, -73);
  ctx.quadraticCurveTo(2, -79, -7, -74);
  ctx.closePath();
  ctx.fill();

  // 头部与颈部纯剪影（侧转朝向 facing 方向，无眼鼻口）
  ctx.beginPath();
  ctx.ellipse(2.5, -86, 6.2, 7.6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // 后脑微发髻/衣领转折，让朝向一眼明确
  ctx.beginPath();
  ctx.moveTo(-2, -91);
  ctx.quadraticCurveTo(-7, -86, -4, -79);
  ctx.lineTo(4, -78);
  ctx.lineTo(6, -86);
  ctx.closePath();
  ctx.fill();

  // 朝向鼻尖微廓（极克制的侧影外轮廓，不画五官）
  ctx.beginPath();
  ctx.moveTo(7.5, -88);
  ctx.lineTo(10.2, -85.5);
  ctx.lineTo(8, -83);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 绘制小帆船（复刻 028 原海报底部「示例对比」独帆剪影）
function drawSailboat(ctx, x, waterY, scale, facing, ink = PALETTE.plum, accent = PALETTE.vermilion) {
  ctx.save();
  ctx.translate(x, waterY);
  ctx.scale(facing * scale, scale);

  // 水面细倒影
  ctx.fillStyle = "rgba(55, 37, 64, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 30, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 船体
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-26, -3);
  ctx.lineTo(30, -3);
  ctx.quadraticCurveTo(24, 5, 16, 6);
  ctx.lineTo(-20, 6);
  ctx.quadraticCurveTo(-25, 4, -26, -3);
  ctx.closePath();
  ctx.fill();

  // 桅杆
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-1, -3);
  ctx.lineTo(-1, -76);
  ctx.stroke();

  // 主帆（朝前行进的弧面感）
  ctx.fillStyle = PALETTE.ivory;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(1, -72);
  ctx.quadraticCurveTo(24, -40, 26, -8);
  ctx.lineTo(1, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 后副帆
  ctx.fillStyle = "rgba(55, 37, 64, 0.14)";
  ctx.beginPath();
  ctx.moveTo(-3, -60);
  ctx.lineTo(-19, -9);
  ctx.lineTo(-3, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 桅顶小红旗（朝风向指向前方）
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-1, -76);
  ctx.lineTo(11, -72);
  ctx.lineTo(-1, -68);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 绘制远空飞鸟群
function drawBirdFlock(ctx, x, y, scale, facing, color, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  const birds = [
    [0, 0, 1.0, 0],
    [-16, 10, 0.85, 0.7],
    [15, -9, 0.8, 1.4],
    [-28, 22, 0.7, 2.1],
    [28, -16, 0.65, 2.8],
    [9, 13, 0.72, 1.1],
  ];
  for (const [bx, by, s, ph] of birds) {
    const flap = Math.sin(t * 2.6 + ph) * 2.2;
    ctx.lineWidth = 2.1 * s;
    ctx.beginPath();
    ctx.moveTo(bx - 9 * s, by + 2 * s + flap);
    ctx.quadraticCurveTo(bx - 3 * s, by - 4 * s, bx, by + 1 * s);
    ctx.quadraticCurveTo(bx + 3 * s, by - 4 * s, bx + 9 * s, by + 2 * s + flap);
    ctx.stroke();
  }
  ctx.restore();
}

// ======================== 开场主角玩具：圆窗移轴取景台 ========================
export function getHeroMetrics(w, h) {
  // 真圆半径：确保圆窗永远是几何正圆（390/844/1440/2560 全不拉扁）
  const r = Math.min(w * 0.48, h * 0.475);
  // 轻微左偏的圆心，致敬 028 原海报大圆窗向左侧轻轻出血的构图气质
  const cx = w * 0.485;
  const cy = h * 0.5;
  const frame = {
    x: cx - r * 0.88,
    y: cy - r * 0.86,
    w: r * 1.76,
    h: r * 1.72,
  };
  return { cx, cy, r, frame };
}

export function heroToPx(nx, ny, metrics) {
  return {
    x: metrics.frame.x + nx * metrics.frame.w,
    y: metrics.frame.y + ny * metrics.frame.h,
  };
}

export function pxToHero(px, py, metrics) {
  return {
    x: (px - metrics.frame.x) / metrics.frame.w,
    y: (py - metrics.frame.y) / metrics.frame.h,
  };
}

export function drawHeroStage(canvas, state, evalRes, opts = {}) {
  const { dpr = 1, t = 0, enter = 1, dragKind = null, size = null } = opts;
  const { ctx, w, h } = fitCanvas(canvas, dpr, size);
  const m = getHeroMetrics(w, h);
  const { cx, cy, r, frame } = m;

  // 1. 熏衣草灰底纸（与页面无缝融合）
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  // 背景极克制外环建筑刻度弧（呼应 028 轴环母题）
  ctx.save();
  ctx.strokeStyle = "rgba(55, 37, 64, 0.14)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, -Math.PI * 0.82, Math.PI * 0.82);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 2. 暖米白大圆窗剪裁区
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 圆窗暖米白底（原海报 #F4EBE9）
  ctx.fillStyle = state.scene === "sail" ? "#ECE6EC" : state.scene === "arch" ? "#F2EAE8" : PALETTE.cream;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // 开场入场柔和过渡
  const e = 1 - Math.pow(1 - Math.min(1, enter), 3);

  // 3. 按题材绘制环境（山坡 / 海天 / 廊柱）
  const { geom } = evalRes;
  if (state.scene === "hill") {
    // 远层浅紫山影（纯平涂印刷层次，无需每帧重算径向渐变）
    ctx.fillStyle = "rgba(64, 39, 68, 0.09)";
    ctx.beginPath();
    const yL0 = heroToPx(0, geom.slopeY(0) - 0.06, m).y;
    const yR0 = heroToPx(1, geom.slopeY(1) - 0.02, m).y;
    ctx.moveTo(cx - r - 20, yL0);
    ctx.quadraticCurveTo(cx, Math.min(yL0, yR0) - 14, cx + r + 20, yR0);
    ctx.lineTo(cx + r + 20, cy + r + 20);
    ctx.lineTo(cx - r - 20, cy + r + 20);
    ctx.closePath();
    ctx.fill();

    // 标志深梅紫斜坡（像素实采 #402744）
    const pL = heroToPx(-0.15, geom.slopeY(-0.15), m);
    const pR = heroToPx(1.15, geom.slopeY(1.15), m);
    ctx.fillStyle = PALETTE.plumSlope;
    ctx.beginPath();
    ctx.moveTo(pL.x, pL.y);
    ctx.lineTo(pR.x, pR.y);
    ctx.lineTo(cx + r + 30, cy + r + 30);
    ctx.lineTo(cx - r - 30, cy + r + 30);
    ctx.closePath();
    ctx.fill();
  } else if (state.scene === "sail") {
    // 海天分界（原海报底部独帆示例，平涂分色轻量高速）
    const seaY = heroToPx(0.5, geom.footY, m).y;
    ctx.fillStyle = "#EAE3E8";
    ctx.fillRect(cx - r, cy - r, r * 2, seaY - (cy - r));

    ctx.fillStyle = "#AEA6B6";
    ctx.fillRect(cx - r, seaY, r * 2, cy + r - seaY);
    ctx.fillStyle = "rgba(55, 37, 64, 0.22)";
    ctx.fillRect(cx - r, seaY + (cy + r - seaY) * 0.48, r * 2, (cy + r - seaY) * 0.52);

    // 极细海平线与柔和波纹
    ctx.strokeStyle = "rgba(55, 37, 64, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r, seaY);
    ctx.lineTo(cx + r, seaY);
    ctx.stroke();

    const waveShift = Math.sin(t * 1.1) * 6;
    ctx.strokeStyle = "rgba(250, 245, 243, 0.32)";
    for (let i = 0; i < 4; i++) {
      const wy = seaY + 18 + i * 24;
      const wx = cx - r * 0.55 + (i % 2) * 54 + waveShift * (i % 2 ? 1 : -1);
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 66 - i * 8, wy);
      ctx.stroke();
    }
  } else {
    // 剧场廊柱微光
    const floorY = heroToPx(0.5, geom.footY, m).y;
    ctx.fillStyle = "#EFE6E6";
    ctx.fillRect(cx - r, cy - r, r * 2, floorY - (cy - r));
    ctx.fillStyle = PALETTE.plumSlope;
    ctx.fillRect(cx - r, floorY, r * 2, cy + r - floorY);

    // 远景淡淡几何柱列（不喧宾夺主）
    ctx.fillStyle = "rgba(55, 37, 64, 0.08)";
    for (const pxNorm of [0.12, 0.34, 0.56, 0.78, 0.92]) {
      const px = heroToPx(pxNorm, 0.5, m).x;
      ctx.fillRect(px - 7, cy - r, 14, floorY - (cy - r));
    }
    // 地面透视细线
    ctx.strokeStyle = "rgba(244, 235, 233, 0.16)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const ly = floorY + i * 26;
      ctx.beginPath();
      ctx.moveTo(cx - r, ly);
      ctx.lineTo(cx + r, ly);
      ctx.stroke();
    }
  }

  // 4. 构图辅助标线（可开关：居中虚线 + 左右三分/偏轴带 + 视线连线）
  const subPx = heroToPx(geom.sx, geom.footY, m);
  const headPx = heroToPx(geom.sx, geom.headY, m);
  const ancPx = heroToPx(evalRes.anchorPos.x, evalRes.anchorPos.y, m);
  const centerX = heroToPx(0.5, 0.5, m).x;

  if (state.showGuides) {
    ctx.save();
    // 偏轴甜区极淡底纹带（18%–38% 与 62%–82%）
    const hlOffset = state.highlightPillar === "offset";
    ctx.fillStyle = hlOffset ? "rgba(240, 90, 59, 0.12)" : "rgba(55, 37, 64, 0.035)";
    const z1L = heroToPx(0.18, 0, m).x;
    const z1R = heroToPx(0.38, 0, m).x;
    const z2L = heroToPx(0.62, 0, m).x;
    const z2R = heroToPx(0.82, 0, m).x;
    ctx.fillRect(z1L, cy - r, z1R - z1L, r * 2);
    ctx.fillRect(z2L, cy - r, z2R - z2L, r * 2);

    // 三分竖线（33.3% & 66.7%）
    ctx.strokeStyle = hlOffset ? "rgba(180, 52, 28, 0.46)" : "rgba(55, 37, 64, 0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const gx of [1 / 3, 2 / 3]) {
      const lx = heroToPx(gx, 0, m).x;
      ctx.beginPath();
      ctx.moveTo(lx, cy - r);
      ctx.lineTo(lx, cy + r);
      ctx.stroke();
    }

    // 中心 50% 参照虚线
    ctx.strokeStyle = evalRes.axisZone === "center" ? "rgba(180, 52, 28, 0.58)" : "rgba(55, 37, 64, 0.20)";
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, cy - r);
    ctx.lineTo(centerX, cy + r);
    ctx.stroke();

    // 当前主体竖直结构轴线
    const axisColor = evalRes.pillars.offset.ok ? PALETTE.sage : PALETTE.vermilionInk;
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = dragKind === "axis" ? 2 : 1.35;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(subPx.x, cy - r + 14);
    ctx.lineTo(subPx.x, cy + r - 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 5. 视线与远端呼应斜向虚线（复刻 028 原海报标志性斜虚线！）
  if (state.anchorMode !== "none") {
    ctx.save();
    const lineGood = evalRes.pillars.dynamism.ok && evalRes.pillars.balance.ok;
    ctx.strokeStyle =
      state.highlightPillar === "dynamism" || state.highlightPillar === "balance"
        ? PALETTE.vermilion
        : lineGood
          ? "rgba(55, 37, 64, 0.65)"
          : "rgba(180, 52, 28, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -t * 14;
    ctx.beginPath();
    // 略微向主体身后延伸一点，致敬原海报斜线穿过人影的构图感
    const vx = ancPx.x - headPx.x;
    const vy = ancPx.y - headPx.y;
    const len = Math.hypot(vx, vy) || 1;
    const backExt = Math.min(28, len * 0.25);
    ctx.moveTo(headPx.x - (vx / len) * backExt, headPx.y - (vy / len) * backExt);
    ctx.lineTo(headPx.x + vx * e, headPx.y + vy * e);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  } else if (state.showGuides) {
    // 无锚点时画一条朝向面部的断头视线，直觉呈现「滑出去收不回来」
    ctx.save();
    ctx.strokeStyle = "rgba(180, 52, 28, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(headPx.x, headPx.y);
    ctx.lineTo(headPx.x + state.facing * r * 0.9, headPx.y - 26);
    ctx.stroke();
    ctx.restore();
  }

  // 6. 留白走廊中的干扰杂块（点击即可清除）
  for (const c of state.clutter) {
    if (!c.active) continue;
    const cp = heroToPx(c.x, c.y, m);
    const cw = Math.max(24, r * 0.14);
    const ch = Math.max(18, r * 0.1);
    ctx.save();
    // 暗色杂物剪影
    ctx.fillStyle = "rgba(55, 37, 64, 0.72)";
    ctx.beginPath();
    if (state.scene === "hill") {
      ctx.moveTo(cp.x - cw * 0.55, cp.y + ch * 0.45);
      ctx.lineTo(cp.x - cw * 0.28, cp.y - ch * 0.55);
      ctx.lineTo(cp.x + cw * 0.24, cp.y - ch * 0.42);
      ctx.lineTo(cp.x + cw * 0.58, cp.y + ch * 0.45);
      ctx.closePath();
    } else {
      ctx.rect(cp.x - cw * 0.5, cp.y - ch * 0.45, cw, ch * 0.9);
    }
    ctx.fill();

    // 红色可点击虚线圈 + × 徽章
    ctx.strokeStyle = PALETTE.vermilionBadge;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, Math.max(cw, ch) * 0.68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const bx = cp.x + Math.max(cw, ch) * 0.46;
    const by = cp.y - Math.max(cw, ch) * 0.46;
    ctx.fillStyle = PALETTE.vermilionInk;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ivory;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bx - 3.2, by - 3.2);
    ctx.lineTo(bx + 3.2, by + 3.2);
    ctx.moveTo(bx + 3.2, by - 3.2);
    ctx.lineTo(bx - 3.2, by + 3.2);
    ctx.stroke();
    ctx.restore();
  }

  // 7. 绘制远端呼应锚点（朱红日轮 / 远空飞鸟 / 暖光廊窗）
  if (state.anchorMode !== "none") {
    const aSpec = ANCHOR_MODES[state.anchorMode];
    const baseR = Math.max(15, r * 0.115) * aSpec.radiusScale;
    ctx.save();
    if (state.scene === "hill") {
      // 柔和呼吸外圈（拖拽或抢重时显露）
      if (dragKind === "anchor" || state.anchorMode === "rival") {
        ctx.strokeStyle = state.anchorMode === "rival" ? "rgba(180,52,28,0.65)" : "rgba(240,90,59,0.5)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(ancPx.x, ancPx.y, baseR + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = state.anchorMode === "rival" ? "#C93920" : PALETTE.vermilion;
      ctx.beginPath();
      ctx.arc(ancPx.x, ancPx.y, baseR * e, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.scene === "sail") {
      if (state.anchorMode === "rival") {
        // 抢重错态：放一轮巨大深色压顶巨日/黑云团抢戏
        ctx.fillStyle = PALETTE.plum;
        ctx.beginPath();
        ctx.arc(ancPx.x, ancPx.y, baseR * 0.92, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 原海报轻盈飞鸟群
        drawBirdFlock(ctx, ancPx.x, ancPx.y, Math.max(0.75, r / 230), state.facing, PALETTE.plum, t);
        // 极淡暖红日晕点睛
        ctx.fillStyle = "rgba(240, 90, 59, 0.88)";
        ctx.beginPath();
        ctx.arc(ancPx.x + state.facing * 26, ancPx.y - 16, Math.max(7, r * 0.042), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // 远端暖窗光门
      const ww = baseR * 1.35;
      const wh = baseR * 2.05;
      ctx.fillStyle = state.anchorMode === "rival" ? "#B8341C" : PALETTE.vermilion;
      ctx.beginPath();
      ctx.roundRect(ancPx.x - ww / 2, ancPx.y - wh / 2, ww, wh, [ww / 2, ww / 2, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // 轻量可拖锚点标识环
    if (state.showGuides) {
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ancPx.x, ancPx.y, 4.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 8. 绘制主角主体（山坡披风剪影 / 海面独帆 / 廊下人影）
  const figScale = Math.max(0.68, Math.min(1.18, r / 215));
  if (state.scene === "hill") {
    drawCloakedFigure(ctx, subPx.x, subPx.y, figScale, state.facing, "#211229");
  } else if (state.scene === "sail") {
    drawSailboat(ctx, subPx.x, subPx.y, figScale * 0.95, state.facing, PALETTE.plum, PALETTE.vermilion);
  } else {
    drawCloakedFigure(ctx, subPx.x, subPx.y, figScale * 1.05, state.facing, "#211229");
  }

  // 朝向短箭标（在主体身前清晰标出面向，并提醒点按可转身）
  if (state.showGuides) {
    const arrowY = headPx.y + 8;
    const arrowX0 = subPx.x + state.facing * 18;
    const arrowX1 = subPx.x + state.facing * 42;
    const facingGood = evalRes.leadRoomPct >= 55;
    ctx.save();
    ctx.strokeStyle = facingGood ? PALETTE.sage : PALETTE.vermilionInk;
    ctx.fillStyle = facingGood ? PALETTE.sage : PALETTE.vermilionInk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowX0, arrowY);
    ctx.lineTo(arrowX1, arrowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrowX1, arrowY);
    ctx.lineTo(arrowX1 - state.facing * 6, arrowY - 4);
    ctx.lineTo(arrowX1 - state.facing * 6, arrowY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 若处于「面壁堵死」错态，在近侧圆窗边画出清晰碰撞提示弧
  if (evalRes.diag.code === "facing-wall") {
    ctx.save();
    const wallX = state.facing < 0 ? frame.x + 12 : frame.x + frame.w - 12;
    ctx.strokeStyle = PALETTE.vermilionInk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wallX, headPx.y - 34);
    ctx.lineTo(wallX, headPx.y + 34);
    ctx.stroke();
    ctx.restore();
  }

  // 9. 圆窗内部底部极简轴位标尺（显示实时 X 轴坐标与甜区）
  const rulerY = cy + r - 24;
  const rLeft = cx - r * 0.58;
  const rRight = cx + r * 0.58;
  const rW = rRight - rLeft;
  ctx.save();
  ctx.strokeStyle = "rgba(244, 235, 233, 0.38)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rLeft, rulerY);
  ctx.lineTo(rRight, rulerY);
  ctx.stroke();

  // 标出 33% / 50% / 67% 刻度
  for (const frac of [0.18, 0.333, 0.5, 0.667, 0.82]) {
    const tx = rLeft + ((frac - 0.1) / 0.8) * rW;
    ctx.strokeStyle = frac === 0.5 ? "rgba(244,235,233,0.75)" : "rgba(244,235,233,0.42)";
    ctx.beginPath();
    ctx.moveTo(tx, rulerY - (frac === 0.5 ? 6 : 4));
    ctx.lineTo(tx, rulerY + (frac === 0.5 ? 6 : 4));
    ctx.stroke();
  }

  // 当前轴位滑点
  const curTx = rLeft + ((geom.sx - 0.1) / 0.8) * rW;
  ctx.fillStyle = evalRes.pillars.offset.ok ? PALETTE.sageLight : PALETTE.vermilionBright;
  ctx.beginPath();
  ctx.arc(curTx, rulerY, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plumDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // 结束圆窗剪裁

  // 10. 圆窗清脆外描边（高对比收边）
  ctx.save();
  ctx.strokeStyle = evalRes.solved ? "rgba(27, 102, 93, 0.55)" : "rgba(55, 37, 64, 0.24)";
  ctx.lineWidth = evalRes.solved ? 2.2 : 1.3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 左上角轻浮标：当前轴位读数（定宽避免每帧 measureText 布局抖动）
  const tagText = `AXIS ${evalRes.axisPct}% · ${state.facing > 0 ? "朝右 →" : "← 朝左"}`;
  ctx.font = '500 11px "DM Mono", "Noto Sans SC", monospace';
  const tw = 128;
  const tx = Math.max(8, cx - r + 6);
  const ty = Math.max(8, cy - r + 8);
  ctx.fillStyle = PALETTE.plumTip;
  ctx.fillRect(tx, ty, tw, 24);
  ctx.fillStyle = PALETTE.cream;
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, tx + 9, ty + 12.5);
  ctx.restore();
}

// ======================== 01 节：双帧同步独帆对照器（复刻原海报底部左右示例） ========================
export function drawCurtainDemo(canvas, boatAxis, showPaths, dpr = 1, t = 0) {
  const { ctx, w, h } = fitCanvas(canvas, dpr);
  ctx.fillStyle = PALETTE.ivory;
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(10, Math.round(w * 0.022));
  const fw = (w - gap) / 2;
  const fh = h;

  const drawPanel = (ox, isRight) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, 0, fw, fh);
    ctx.clip();

    const seaY = fh * 0.72;
    const sky = ctx.createLinearGradient(0, 0, 0, seaY);
    sky.addColorStop(0, "#EEE7EB");
    sky.addColorStop(1, "#DED6DF");
    ctx.fillStyle = sky;
    ctx.fillRect(ox, 0, fw, seaY);

    const sea = ctx.createLinearGradient(0, seaY, 0, fh);
    sea.addColorStop(0, "#B7B0BF");
    sea.addColorStop(1, "#8D8498");
    ctx.fillStyle = sea;
    ctx.fillRect(ox, seaY, fw, fh - seaY);

    ctx.strokeStyle = "rgba(55,37,64,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, seaY);
    ctx.lineTo(ox + fw, seaY);
    ctx.stroke();

    const scale = Math.min(fw, fh) / 245;

    if (!isRight) {
      // 左帧固定参照：居中构图 50%
      ctx.strokeStyle = "rgba(55, 37, 64, 0.36)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox + fw * 0.5, 14);
      ctx.lineTo(ox + fw * 0.5, fh - 14);
      ctx.stroke();
      ctx.setLineDash([]);

      drawSailboat(ctx, ox + fw * 0.5, seaY, scale, 1, PALETTE.plum, PALETTE.inkMuted);

      if (showPaths) {
        ctx.strokeStyle = PALETTE.vermilionInk;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(ox + fw * 0.5, seaY - 30 * scale, Math.min(fw, fh) * 0.19, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const refTxt = "参照 · 居中 50%";
      ctx.font = '600 11.5px "Noto Sans SC", sans-serif';
      const refW = Math.ceil(ctx.measureText(refTxt).width) + 16;
      ctx.fillStyle = PALETTE.plumTip;
      ctx.fillRect(ox + 8, 8, refW, 22);
      ctx.fillStyle = PALETTE.cream;
      ctx.textBaseline = "middle";
      ctx.fillText(refTxt, ox + 16, 19.5);
    } else {
      // 右帧活体偏轴：boatAxis 决定独帆轴位（默认 0.24 左偏），鸟群自动呼应至对侧留白
      const facing = boatAxis <= 0.5 ? 1 : -1;
      const offAmount = Math.abs(boatAxis - 0.5);
      const isOff = offAmount >= 0.12;
      const birdX = ox + fw * (facing > 0 ? 0.68 : 0.32);
      const birdY = fh * 0.3;

      ctx.strokeStyle = isOff ? "rgba(27, 102, 93, 0.42)" : "rgba(180, 52, 28, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox + fw * boatAxis, 14);
      ctx.lineTo(ox + fw * boatAxis, fh - 14);
      ctx.stroke();
      ctx.setLineDash([]);

      drawSailboat(ctx, ox + fw * boatAxis, seaY, scale, facing, PALETTE.plum, PALETTE.vermilion);

      // 偏开越大，远空飞鸟群越清晰地托住对侧留白
      const birdAlpha = Math.min(1, Math.max(0.12, (offAmount - 0.04) / 0.16));
      ctx.save();
      ctx.globalAlpha = birdAlpha;
      drawBirdFlock(ctx, birdX, birdY, scale * 0.85, facing, PALETTE.plum, t);
      ctx.restore();

      if (showPaths) {
        if (isOff) {
          ctx.strokeStyle = PALETTE.vermilion;
          ctx.lineWidth = 1.9;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(ox + fw * boatAxis + facing * 12, seaY - 28 * scale);
          ctx.quadraticCurveTo(ox + fw * 0.5, fh * 0.52, birdX, birdY + 4);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = PALETTE.vermilion;
          ctx.beginPath();
          ctx.arc(birdX, birdY + 4, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = PALETTE.vermilionInk;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(ox + fw * boatAxis, seaY - 30 * scale, Math.min(fw, fh) * 0.19, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      const tagTxt = isOff ? `偏轴 ${Math.round(boatAxis * 100)}%` : `近似居中 ${Math.round(boatAxis * 100)}%`;
      ctx.font = '600 11.5px "Noto Sans SC", sans-serif';
      const tagW = Math.ceil(ctx.measureText(tagTxt).width) + 16;
      ctx.fillStyle = isOff ? PALETTE.sage : PALETTE.vermilionInk;
      ctx.fillRect(ox + 8, 8, tagW, 22);
      ctx.fillStyle = PALETTE.ivory;
      ctx.textBaseline = "middle";
      ctx.fillText(tagTxt, ox + 16, 19.5);
    }

    ctx.strokeStyle = "rgba(55, 37, 64, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, 0.5, fw - 1, fh - 1);
    ctx.restore();
  };

  drawPanel(0, false);
  drawPanel(fw + gap, true);
}

// ======================== 02 节：原海报「构图逻辑」方格与杠杆 ========================
export function drawLogicBoard(canvas, subject, weightBox, kind, evalLogic, dpr = 1) {
  const { ctx, w, h } = fitCanvas(canvas, dpr);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, w, h);

  const pad = 16;
  const boardH = h * 0.72;
  const bx = pad;
  const by = pad;
  const bw = w - pad * 2;
  const bh = boardH - pad;
  const cw = bw / 6;
  const ch = bh / 4;

  // 方格浅线
  ctx.strokeStyle = "rgba(55, 37, 64, 0.12)";
  ctx.lineWidth = 1;
  for (let c = 1; c < 6; c++) {
    ctx.beginPath();
    ctx.moveTo(bx + c * cw, by);
    ctx.lineTo(bx + c * cw, by + bh);
    ctx.stroke();
  }
  for (let r = 1; r < 4; r++) {
    ctx.beginPath();
    ctx.moveTo(bx, by + r * ch);
    ctx.lineTo(bx + bw, by + r * ch);
    ctx.stroke();
  }

  // 外框（复刻 028 构图逻辑细实框）
  ctx.strokeStyle = PALETTE.plum;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, bw, bh);

  // 配重视觉块（斜纹鲑红 / 轻红点 / 标题排字块）
  const wx = bx + weightBox.col * cw;
  const wy = by + weightBox.row * ch;
  const ww = weightBox.w * cw;
  const wh = weightBox.h * ch;

  ctx.save();
  if (kind === "dot") {
    const r = Math.min(cw, ch) * 0.42;
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    ctx.arc(wx + ww / 2, wy + wh / 2, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "type") {
    ctx.fillStyle = "rgba(55, 37, 64, 0.08)";
    ctx.fillRect(wx + 4, wy + 4, ww - 8, wh - 8);
    ctx.fillStyle = PALETTE.plum;
    ctx.font = `900 ${Math.max(15, Math.round(ch * 0.44))}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("偏轴构图", wx + ww / 2, wy + wh / 2 - 4);
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(wx + ww * 0.2, wy + wh - 11, ww * 0.6, 3);
  } else {
    // 复刻 028 原海报斜线填充鲑红块 (#DD8374)
    ctx.fillStyle = PALETTE.salmon;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.rect(wx, wy, ww, wh);
    ctx.clip();
    ctx.strokeStyle = "rgba(244, 235, 233, 0.38)";
    ctx.lineWidth = 1.4;
    for (let d = -wh; d < ww + wh; d += 11) {
      ctx.beginPath();
      ctx.moveTo(wx + d, wy + wh);
      ctx.lineTo(wx + d + wh, wy);
      ctx.stroke();
    }
    ctx.strokeStyle = PALETTE.plum;
    ctx.lineWidth = 1.1;
    ctx.strokeRect(wx, wy, ww, wh);
  }
  ctx.restore();

  // 穿过主体的偏轴虚线十字（原海报构图逻辑标志）
  const sx = bx + (subject.col + 0.5) * cw;
  const sy = by + (subject.row + 0.5) * ch;
  ctx.save();
  ctx.strokeStyle = "rgba(55, 37, 64, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(sx, by);
  ctx.lineTo(sx, by + bh);
  ctx.moveTo(bx, sy);
  ctx.lineTo(bx + bw, sy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 深梅紫主体大圆（复刻原海报）
  const sr = Math.min(cw, ch) * 0.4;
  ctx.fillStyle = PALETTE.plum;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("主体", sx, sy + 0.5);

  // 底部实时杠杆平衡尺（示意）
  const fulcrumX = bx + bw * 0.5;
  const fulcrumY = by + bh + (h - (by + bh)) * 0.62;
  const beamHalf = bw * 0.44;
  const tiltRad = Math.max(-0.18, Math.min(0.18, evalLogic.torque * 0.55));

  ctx.save();
  ctx.translate(fulcrumX, fulcrumY);
  // 支点三角
  ctx.fillStyle = evalLogic.balanced ? PALETTE.sage : PALETTE.vermilionInk;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, 12);
  ctx.lineTo(8, 12);
  ctx.closePath();
  ctx.fill();

  // 水平基准虚线
  ctx.strokeStyle = "rgba(55,37,64,0.2)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(-beamHalf, 0);
  ctx.lineTo(beamHalf, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // 倾摆横梁
  ctx.rotate(tiltRad);
  ctx.strokeStyle = PALETTE.plum;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-beamHalf, 0);
  ctx.lineTo(beamHalf, 0);
  ctx.stroke();

  // 主体与配重挂点
  const subPos = (evalLogic.subX - 0.5) * bw;
  const boxPos = (evalLogic.boxX - 0.5) * bw;
  ctx.fillStyle = PALETTE.plum;
  ctx.beginPath();
  ctx.arc(subPos, -7, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.arc(boxPos, -6, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ======================== 03 节：2.39:1 电影朝向与反留白剧场 ========================
export function drawCinemaStage(canvas, sceneId, axisPos, facingMode, dpr = 1, t = 0) {
  const { ctx, w, h } = fitCanvas(canvas, dpr);
  // 暗房纯底
  ctx.fillStyle = "#191122";
  ctx.fillRect(0, 0, w, h);

  // 2.39:1 宽银幕有效框
  const marginX = 16;
  const availW = w - marginX * 2;
  const availH = h - 32;
  let fw = availW;
  let fh = fw / 2.39;
  if (fh > availH) {
    fh = availH;
    fw = fh * 2.39;
  }
  const fx = (w - fw) / 2;
  const fy = (h - fh) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();

  // 影院氛围底色
  const bg = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
  if (sceneId === "thriller") {
    bg.addColorStop(0, "#1D1429");
    bg.addColorStop(1, "#35213D");
  } else if (sceneId === "horizon") {
    bg.addColorStop(0, "#2C1D3A");
    bg.addColorStop(0.65, "#4E3254");
    bg.addColorStop(1, "#6C3E4A");
  } else {
    bg.addColorStop(0, "#291C36");
    bg.addColorStop(1, "#452D4F");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(fx, fy, fw, fh);

  const groundY = fy + fh * 0.78;
  // 地平线/跑道/海面
  ctx.fillStyle = "#150D1E";
  ctx.fillRect(fx, groundY, fw, fy + fh - groundY);

  // 主体横坐标与朝向
  const sx = fx + fw * axisPos;
  const openDir = axisPos <= 0.5 ? 1 : -1;
  const facing = facingMode === "open" ? openDir : -openDir;
  const isShortSiding = facingMode === "short" && Math.abs(axisPos - 0.5) > 0.1;

  // 远端光晕/山峦/走廊门
  if (sceneId === "horizon") {
    const sunX = fx + fw * (axisPos <= 0.5 ? 0.78 : 0.22);
    const sunY = fy + fh * 0.42;
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, fh * 0.42);
    glow.addColorStop(0, "rgba(255, 123, 97, 0.92)");
    glow.addColorStop(0.35, "rgba(240, 90, 59, 0.24)");
    glow.addColorStop(1, "rgba(240, 90, 59, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = PALETTE.vermilionBright;
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.max(8, fh * 0.085), 0, Math.PI * 2);
    ctx.fill();
  } else if (sceneId === "thriller") {
    // 身后暗影中藏一扇幽微开缝的亮门，强化反留白悬疑感
    const doorX = fx + fw * (axisPos <= 0.5 ? 0.8 : 0.2);
    ctx.fillStyle = isShortSiding ? "rgba(255, 123, 97, 0.22)" : "rgba(206, 195, 212, 0.1)";
    ctx.fillRect(doorX - 10, fy + fh * 0.26, 20, groundY - (fy + fh * 0.26));
    ctx.fillStyle = isShortSiding ? PALETTE.vermilionBright : "rgba(206, 195, 212, 0.22)";
    ctx.fillRect(doorX - 2, fy + fh * 0.26, 4, groundY - (fy + fh * 0.26));
  } else {
    // 奔跑地平透视线
    ctx.strokeStyle = "rgba(244, 235, 233, 0.14)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const tx = fx + ((i * 0.19 + ((t * 0.04) % 0.19)) % 1) * fw;
      ctx.beginPath();
      ctx.moveTo(tx, groundY);
      ctx.lineTo(tx - facing * 14, fy + fh);
      ctx.stroke();
    }
  }

  // 视线锥（浅半透明扇形，直觉展示前方留白 vs 短边撞框）
  const eyeY = groundY - fh * 0.36;
  const coneLen = facing > 0 ? fx + fw - sx : sx - fx;
  const coneGrad = ctx.createLinearGradient(sx, eyeY, sx + facing * coneLen, eyeY);
  coneGrad.addColorStop(0, isShortSiding ? "rgba(255, 123, 97, 0.32)" : "rgba(122, 214, 200, 0.28)");
  coneGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(sx, eyeY);
  ctx.lineTo(sx + facing * coneLen, eyeY - fh * 0.22);
  ctx.lineTo(sx + facing * coneLen, eyeY + fh * 0.22);
  ctx.closePath();
  ctx.fill();

  // 绘制人物剪影（奔跑大衣剪影或站立背影，无五官）
  const sc = Math.max(0.54, fh / 195);
  if (sceneId === "runner") {
    ctx.save();
    ctx.translate(sx, groundY);
    ctx.scale(facing * sc, sc);
    // 地面速度影
    ctx.fillStyle = "rgba(10, 5, 16, 0.5)";
    ctx.beginPath();
    ctx.ellipse(2, 3, 28, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F4EBE9";
    // 前倾头部侧影（无五官）
    ctx.beginPath();
    ctx.ellipse(12, -80, 6.4, 7.6, 0.22, 0, Math.PI * 2);
    ctx.fill();
    // 飘动短风衣躯干与跨步轮廓
    ctx.beginPath();
    ctx.moveTo(8, -72);
    ctx.quadraticCurveTo(18, -52, 13, -34);
    ctx.lineTo(-18, -32);
    ctx.quadraticCurveTo(-8, -48, 0, -70);
    ctx.closePath();
    ctx.fill();
    // 前后奔跑双腿与摆臂（锥形剪影感）
    ctx.beginPath();
    ctx.moveTo(4, -36);
    ctx.lineTo(24, -4);
    ctx.lineTo(17, -2);
    ctx.lineTo(-2, -32);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, -36);
    ctx.lineTo(-24, -10);
    ctx.lineTo(-18, -6);
    ctx.lineTo(2, -31);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -62);
    ctx.lineTo(26, -48);
    ctx.lineTo(23, -44);
    ctx.lineTo(6, -56);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    drawCloakedFigure(ctx, sx, groundY, sc, facing, "#F4EBE9");
  }

  // 三分参考细虚线
  ctx.strokeStyle = "rgba(244, 235, 233, 0.16)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  for (const g of [1 / 3, 2 / 3]) {
    ctx.beginPath();
    ctx.moveTo(fx + fw * g, fy);
    ctx.lineTo(fx + fw * g, fy + fh);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // 电影遮幅细边线 + 留白占比读数
  ctx.strokeStyle = "rgba(244, 235, 233, 0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(fx, fy, fw, fh);

  const leadPct = Math.round((facing > 0 ? 1 - axisPos : axisPos) * 100);
  ctx.fillStyle = isShortSiding ? PALETTE.vermilionBright : PALETTE.sageLight;
  ctx.font = '500 11px "DM Mono", "Noto Sans SC", monospace';
  ctx.textBaseline = "top";
  ctx.fillText(`2.39:1 · 轴位 ${Math.round(axisPos * 100)}% · 前方留白 ${leadPct}%`, fx + 8, fy + 8);
}

// ======================== 04 节：史料偏轴骨架透视图 ========================
export function drawLineageDiagram(canvas, item, dpr = 1) {
  const { ctx, w, h } = fitCanvas(canvas, dpr);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, w, h);

  const pad = 16;
  const fx = pad;
  const fy = pad;
  const fw = w - pad * 2;
  const fh = h - pad * 2;

  // 马远用团扇圆框，其余用画幅矩形框
  ctx.save();
  if (item.id === "mayuan") {
    const r = Math.min(fw, fh) * 0.46;
    const cx = w * 0.5;
    const cy = h * 0.5;
    ctx.fillStyle = PALETTE.ivory;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plum;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.clip();
  } else {
    ctx.fillStyle = PALETTE.ivory;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = PALETTE.plum;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();
  }

  // 三分参考网格
  ctx.strokeStyle = "rgba(55,37,64,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const g of [1 / 3, 2 / 3]) {
    ctx.beginPath();
    ctx.moveTo(fx + fw * g, fy);
    ctx.lineTo(fx + fw * g, fy + fh);
    ctx.moveTo(fx, fy + fh * g);
    ctx.lineTo(fx + fw, fy + fh * g);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 按名作特征画极简体量块
  const m = item.diagram.mass;
  if (m === "corner-bl") {
    ctx.fillStyle = "rgba(55,37,64,0.82)";
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh * 0.52);
    ctx.quadraticCurveTo(fx + fw * 0.36, fy + fh * 0.58, fx + fw * 0.46, fy + fh);
    ctx.lineTo(fx, fy + fh);
    ctx.closePath();
    ctx.fill();
    // 斜伸梅枝线
    ctx.strokeStyle = PALETTE.plum;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(fx + fw * 0.14, fy + fh * 0.6);
    ctx.quadraticCurveTo(fx + fw * 0.36, fy + fh * 0.4, fx + fw * 0.56, fy + fh * 0.34);
    ctx.stroke();
  } else if (m === "low-dune") {
    // 暗海与低沙丘
    ctx.fillStyle = "rgba(55,37,64,0.16)";
    ctx.fillRect(fx, fy + fh * 0.72, fw, fh * 0.14);
    ctx.fillStyle = PALETTE.plum;
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh * 0.84);
    ctx.quadraticCurveTo(fx + fw * 0.32, fy + fh * 0.76, fx + fw, fy + fh * 0.88);
    ctx.lineTo(fx + fw, fy + fh);
    ctx.lineTo(fx, fy + fh);
    ctx.closePath();
    ctx.fill();
  } else if (m === "wave-arc") {
    ctx.fillStyle = "rgba(55,37,64,0.84)";
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh * 0.88);
    ctx.bezierCurveTo(fx + fw * 0.08, fy + fh * 0.18, fx + fw * 0.48, fy + fh * 0.16, fx + fw * 0.54, fy + fh * 0.44);
    ctx.bezierCurveTo(fx + fw * 0.4, fy + fh * 0.36, fx + fw * 0.28, fy + fh * 0.62, fx + fw * 0.52, fy + fh * 0.82);
    ctx.lineTo(fx, fy + fh);
    ctx.closePath();
    ctx.fill();
    // 偏右富士三角
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    ctx.moveTo(fx + fw * 0.58, fy + fh * 0.78);
    ctx.lineTo(fx + fw * 0.68, fy + fh * 0.58);
    ctx.lineTo(fx + fw * 0.78, fy + fh * 0.78);
    ctx.closePath();
    ctx.fill();
  } else if (m === "diag-tables") {
    // 左下空桌斜切
    ctx.fillStyle = "rgba(221, 131, 116, 0.42)";
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh * 0.62);
    ctx.lineTo(fx + fw * 0.62, fy + fh * 0.54);
    ctx.lineTo(fx + fw * 0.42, fy + fh);
    ctx.lineTo(fx, fy + fh);
    ctx.closePath();
    ctx.fill();
    // 右上人物双体块
    ctx.fillStyle = PALETTE.plum;
    ctx.fillRect(fx + fw * 0.6, fy + fh * 0.22, fw * 0.14, fh * 0.34);
    ctx.fillRect(fx + fw * 0.78, fy + fh * 0.18, fw * 0.15, fh * 0.38);
  } else {
    // 奇肖尔德 + 阿恩海姆几何构图
    ctx.fillStyle = PALETTE.plum;
    ctx.fillRect(fx + fw * 0.14, fy + fh * 0.22, fw * 0.3, fh * 0.28);
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(fx + fw * 0.14, fy + fh * 0.56, fw * 0.68, 5);
    ctx.strokeStyle = "rgba(55,37,64,0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + fw, fy + fh);
    ctx.moveTo(fx + fw, fy);
    ctx.lineTo(fx, fy + fh);
    ctx.stroke();
  }

  // 主体点与呼应点连线
  const sx = fx + item.diagram.subject[0] * fw;
  const sy = fy + item.diagram.subject[1] * fh;
  const ax = fx + item.diagram.anchor[0] * fw;
  const ay = fy + item.diagram.anchor[1] * fh;

  ctx.strokeStyle = PALETTE.vermilion;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ax, ay);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = PALETTE.plumTip;
  ctx.beginPath();
  ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ivory;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 清晰图文小标放在剪裁区之外绘制，防止马远团扇圆框裁切标签
  const drawPill = (px, py, text, bg) => {
    ctx.font = '600 11px "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(text).width + 12;
    const rx = Math.max(fx + 6, Math.min(fx + fw - tw - 6, px - tw / 2));
    const ry = Math.max(fy + 6, Math.min(fy + fh - 26, py));
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, tw, 20);
    ctx.fillStyle = PALETTE.ivory;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rx + 6, ry + 10.5);
  };
  drawPill(sx, sy + 12, item.diagram.labelS, PALETTE.plumTip);
  drawPill(ax, ay - 28, item.diagram.labelA, PALETTE.vermilionInk);
}

// ======================== 05 节：原海报四大应用场景示意 ========================
export function drawApplicationScene(canvas, appId, isGood, dpr = 1) {
  const { ctx, w, h } = fitCanvas(canvas, dpr);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, w, h);

  // 三分线参考
  ctx.strokeStyle = "rgba(55,37,64,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const g of [1 / 3, 2 / 3]) {
    ctx.beginPath();
    ctx.moveTo(w * g, 0);
    ctx.lineTo(w * g, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  if (appId === "portrait") {
    // 无五官人像剪影半身像
    const px = isGood ? w * 0.28 : w * 0.5;
    const py = h * 0.86;
    // 背景柔和光斑（呼应景深）
    ctx.fillStyle = isGood ? "rgba(240, 90, 59, 0.22)" : "rgba(55, 37, 64, 0.08)";
    ctx.beginPath();
    ctx.arc(isGood ? w * 0.78 : w * 0.5, h * 0.34, Math.min(w, h) * 0.14, 0, Math.PI * 2);
    ctx.fill();
    // 半身侧影（纯轮廓，零五官）
    ctx.save();
    ctx.translate(px, py);
    const s = Math.min(w, h) / 220;
    ctx.scale(s, s);
    ctx.fillStyle = PALETTE.plum;
    // 肩膀
    ctx.beginPath();
    ctx.moveTo(-46, 20);
    ctx.quadraticCurveTo(-40, -34, -10, -40);
    ctx.lineTo(14, -40);
    ctx.quadraticCurveTo(42, -32, 46, 20);
    ctx.closePath();
    ctx.fill();
    // 颈部与侧转头部
    ctx.fillRect(-10, -64, 20, 26);
    ctx.beginPath();
    ctx.ellipse(isGood ? 4 : 0, -86, 20, 25, isGood ? 0.08 : 0, 0, Math.PI * 2);
    ctx.fill();
    if (isGood) {
      // 朝右微侧鼻廓（无五官细节）
      ctx.beginPath();
      ctx.moveTo(22, -92);
      ctx.lineTo(29, -84);
      ctx.lineTo(22, -78);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (isGood) {
      ctx.strokeStyle = PALETTE.vermilion;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(px + 28, h * 0.44);
      ctx.lineTo(w * 0.78, h * 0.34);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (appId === "landscape") {
    const horY = isGood ? h * 0.72 : h * 0.5;
    ctx.fillStyle = "#EAE1E8";
    ctx.fillRect(0, 0, w, horY);
    ctx.fillStyle = PALETTE.plumSlope;
    ctx.fillRect(0, horY, w, h - horY);

    // 远山
    ctx.fillStyle = "rgba(64, 39, 68, 0.25)";
    ctx.beginPath();
    ctx.moveTo(0, horY);
    ctx.lineTo(w * (isGood ? 0.74 : 0.5), horY - h * 0.18);
    ctx.lineTo(w, horY);
    ctx.closePath();
    ctx.fill();

    // 孤树剪影
    const tx = isGood ? w * 0.27 : w * 0.5;
    ctx.fillStyle = PALETTE.plumDark;
    ctx.fillRect(tx - 3, horY - h * 0.34, 6, h * 0.36);
    ctx.beginPath();
    ctx.arc(tx, horY - h * 0.38, h * 0.11, 0, Math.PI * 2);
    ctx.arc(tx - h * 0.07, horY - h * 0.31, h * 0.08, 0, Math.PI * 2);
    ctx.arc(tx + h * 0.07, horY - h * 0.32, h * 0.085, 0, Math.PI * 2);
    ctx.fill();

    if (isGood) {
      ctx.fillStyle = PALETTE.vermilion;
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.28, h * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (appId === "graphic") {
    // 海报版式示意
    if (isGood) {
      // 偏左下图形圆 + 右上大标题块 + 留白通道
      ctx.fillStyle = PALETTE.plum;
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.64, Math.min(w, h) * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.vermilion;
      ctx.beginPath();
      ctx.arc(w * 0.42, h * 0.42, Math.min(w, h) * 0.08, 0, Math.PI * 2);
      ctx.fill();

      // 右上偏轴排版块
      ctx.fillStyle = PALETTE.plum;
      ctx.fillRect(w * 0.54, h * 0.2, w * 0.34, h * 0.09);
      ctx.fillStyle = PALETTE.vermilion;
      ctx.fillRect(w * 0.54, h * 0.33, w * 0.22, h * 0.035);
      ctx.fillStyle = "rgba(55,37,64,0.35)";
      ctx.fillRect(w * 0.54, h * 0.42, w * 0.3, 4);
      ctx.fillRect(w * 0.54, h * 0.48, w * 0.26, 4);
      ctx.fillRect(w * 0.54, h * 0.54, w * 0.28, 4);
    } else {
      // 全员居中圣诞树堆叠
      ctx.fillStyle = PALETTE.plum;
      ctx.fillRect(w * 0.28, h * 0.14, w * 0.44, h * 0.08);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(55,37,64,0.35)";
      ctx.fillRect(w * 0.32, h * 0.74, w * 0.36, 5);
      ctx.fillRect(w * 0.36, h * 0.82, w * 0.28, 5);
    }
  } else {
    // 插画创作（复刻原海报斜坡望日 vs 满塞居中）
    if (isGood) {
      ctx.fillStyle = PALETTE.plumSlope;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.lineTo(w, h * 0.86);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      drawCloakedFigure(ctx, w * 0.28, h * 0.66, Math.min(w, h) / 290, 1, "#1D0E26");
      ctx.fillStyle = PALETTE.vermilion;
      ctx.beginPath();
      ctx.arc(w * 0.76, h * 0.28, Math.min(w, h) * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.plum;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.5);
      ctx.lineTo(w * 0.72, h * 0.3);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = PALETTE.plumSlope;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
      // 满塞各种色块与居中大人物
      ctx.fillStyle = "rgba(55,37,64,0.22)";
      ctx.beginPath();
      ctx.arc(w * 0.2, h * 0.36, h * 0.16, 0, Math.PI * 2);
      ctx.arc(w * 0.8, h * 0.38, h * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.vermilion;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.24, h * 0.13, 0, Math.PI * 2);
      ctx.fill();
      drawCloakedFigure(ctx, w * 0.5, h * 0.72, Math.min(w, h) / 230, 1, "#1D0E26");
    }
  }
}

// ======================== 07 节：眼力测验缩略画框 ========================
export function drawQuizThumb(canvas, mode, dpr = 1, revealed = false) {
  const { ctx, w, h } = fitCanvas(canvas, dpr);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, w, h);

  const seaY = h * 0.72;
  ctx.fillStyle = "#EAE2E8";
  ctx.fillRect(0, 0, w, seaY);
  ctx.fillStyle = "#9C92A8";
  ctx.fillRect(0, seaY, w, h - seaY);

  if (mode.startsWith("q1-")) {
    // 题目一：海岸灯塔与光束 + 飞鸟（只变轴位与朝向）
    let tx = w * 0.28;
    let dir = 1;
    let birdX = w * 0.76;
    if (mode === "q1-center") {
      tx = w * 0.5;
      dir = 0;
    } else if (mode === "q1-wall") {
      tx = w * 0.25;
      dir = -1;
      birdX = w * 0.13;
    } else if (mode === "q1-edge") {
      tx = w * 0.09;
      dir = 1;
      birdX = w * 0.72;
    }

    // 光束
    const topY = seaY - h * 0.38;
    if (dir === 0) {
      ctx.fillStyle = "rgba(240, 90, 59, 0.22)";
      ctx.beginPath();
      ctx.moveTo(tx, topY);
      ctx.lineTo(tx - w * 0.24, topY - 12);
      ctx.lineTo(tx - w * 0.24, topY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx, topY);
      ctx.lineTo(tx + w * 0.24, topY - 12);
      ctx.lineTo(tx + w * 0.24, topY + 12);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(240, 90, 59, 0.28)";
      ctx.beginPath();
      ctx.moveTo(tx, topY);
      ctx.lineTo(tx + dir * w * 0.44, topY - 20);
      ctx.lineTo(tx + dir * w * 0.44, topY + 16);
      ctx.closePath();
      ctx.fill();
    }

    // 灯塔轮廓
    ctx.fillStyle = PALETTE.plum;
    ctx.beginPath();
    ctx.moveTo(tx - 9, seaY + 2);
    ctx.lineTo(tx - 5, topY);
    ctx.lineTo(tx + 5, topY);
    ctx.lineTo(tx + 9, seaY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    ctx.arc(tx, topY - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // 飞鸟
    if (dir === 0) {
      drawBirdFlock(ctx, w * 0.25, h * 0.28, 0.42, 1, PALETTE.plum, 0);
      drawBirdFlock(ctx, w * 0.75, h * 0.28, 0.42, -1, PALETTE.plum, 0);
    } else {
      drawBirdFlock(ctx, birdX, h * 0.26, 0.48, dir, PALETTE.plum, 0);
    }
  } else {
    // 题目二：主体全部锁定在左 29% 朝右，仅变对侧配重
    ctx.fillStyle = PALETTE.plumSlope;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    ctx.lineTo(w, h * 0.84);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    drawCloakedFigure(ctx, w * 0.29, h * 0.67, Math.min(w, h) / 260, 1, "#1D0E26");

    if (mode === "q2-same-side") {
      // 同侧加巨石
      ctx.fillStyle = PALETTE.plumDark;
      ctx.beginPath();
      ctx.arc(w * 0.14, h * 0.52, h * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === "q2-rival") {
      // 对侧放同体量深色巨块
      ctx.fillStyle = PALETTE.plumDark;
      ctx.fillRect(w * 0.66, h * 0.22, w * 0.22, h * 0.44);
    } else if (mode === "q2-good") {
      // 远端轻巧朱红日轮
      ctx.fillStyle = PALETTE.vermilion;
      ctx.beginPath();
      ctx.arc(w * 0.76, h * 0.28, Math.min(w, h) * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === "q2-clutter") {
      // 走廊横塞三块杂物
      ctx.fillStyle = "rgba(55,37,64,0.72)";
      ctx.fillRect(w * 0.46, h * 0.34, w * 0.1, h * 0.14);
      ctx.fillRect(w * 0.6, h * 0.44, w * 0.12, h * 0.16);
      ctx.fillRect(w * 0.76, h * 0.28, w * 0.1, h * 0.14);
    }
  }

  // 答题揭晓后叠画辅助轴线
  if (revealed) {
    ctx.strokeStyle = mode.endsWith("-good") ? PALETTE.sage : PALETTE.vermilionInk;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    const ax = mode === "q1-center" ? w * 0.5 : mode === "q1-edge" ? w * 0.09 : w * 0.28;
    ctx.beginPath();
    ctx.moveTo(ax, 6);
    ctx.lineTo(ax, h - 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
