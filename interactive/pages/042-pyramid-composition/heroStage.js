// 042 金字塔构图 · 开场「筑塔叠层台」3D 立体截锥石阶画布
// 纯 2D Canvas 立体斜轴投影（无 WebGL 降级负担，6× CPU 慢手机与软件渲染稳定 60fps）
// 支持：单层左右边缘把手独立改宽、主体开放区横拖连续调坡（data-perf-drag）、点按两层互换层序、键盘精调。

import { loop, pixelRatio } from "../../lib/stage.js";
import { applySlopeDelta, clamp, evaluate, setSlotWidth, swapSlots } from "./model.js";

const EASE_OUT = (x) => 1 - (1 - clamp(x, 0, 1)) ** 3;

// 绘制原海报同款极简白色符号（绝不画人物五官）
function drawTierIcon(ctx, type, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.4, r * 0.14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (type === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.44;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (type === "peak") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.15, cy + r * 0.65);
    ctx.lineTo(cx - r * 0.32, cy - r * 0.55);
    ctx.lineTo(cx + r * 0.15, cy + r * 0.15);
    ctx.lineTo(cx + r * 0.58, cy - r * 0.38);
    ctx.lineTo(cx + r * 1.15, cy + r * 0.65);
    ctx.closePath();
    ctx.fill();
  } else if (type === "group") {
    // 简洁三剪影（无任何五官，仅几何头肩剪影）
    const drawBust = (bx, by, s) => {
      ctx.beginPath();
      ctx.arc(bx, by - s * 0.42, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by + s * 0.58, s * 0.58, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
    };
    ctx.globalAlpha = 0.78;
    drawBust(cx - r * 0.88, cy + r * 0.16, r * 0.74);
    drawBust(cx + r * 0.88, cy + r * 0.16, r * 0.74);
    ctx.globalAlpha = 1;
    drawBust(cx, cy + r * 0.06, r * 0.92);
  } else {
    // 4 宫格基础方块（1:1 呼应原海报基础层白图标）
    const s = r * 0.78;
    const g = r * 0.22;
    ctx.fillRect(cx - s - g * 0.5, cy - s - g * 0.5, s, s);
    ctx.fillRect(cx + g * 0.5, cy - s - g * 0.5, s, s);
    ctx.fillRect(cx - s - g * 0.5, cy + g * 0.5, s, s);
    ctx.fillRect(cx + g * 0.5, cy + g * 0.5, s, s);
  }
  ctx.restore();
}

// 1:1 复刻原海报顶端七芒金日
function drawSun(ctx, cx, cy, r, focusRatio, pulse, isPass) {
  ctx.save();
  const rayCount = 7;
  const startA = -Math.PI * 0.92;
  const endA = -Math.PI * 0.08;
  const rayInner = r * 1.48;
  const rayLen = r * (0.58 + 0.44 * focusRatio);

  // 柔和微光晕
  const glowR = r * (2.2 + 0.65 * focusRatio);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, glowR);
  grad.addColorStop(0, isPass ? "rgba(191,129,22,0.28)" : "rgba(191,129,22,0.12)");
  grad.addColorStop(1, "rgba(191,129,22,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
  ctx.fill();

  // 七道日光短杠
  ctx.strokeStyle = isPass ? "#BF8116" : "#9E7840";
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.lineCap = "round";
  for (let i = 0; i < rayCount; i++) {
    const a = startA + (i / (rayCount - 1)) * (endA - startA);
    const breath = 1 + 0.06 * Math.sin(pulse * 2.2 + i * 0.7);
    const r0 = rayInner;
    const r1 = rayInner + rayLen * breath;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }

  // 日轮本体
  const discGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
  discGrad.addColorStop(0, isPass ? "#DDA02A" : "#C99A4E");
  discGrad.addColorStop(1, isPass ? "#B3720E" : "#8F6A35");
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function createHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  const animWidths = [...state.widths];
  let hover = { slot: -1, edge: null }; // edge: "left" | "right" | "body" | null
  let drag = null; // { mode: "edge" | "slope", slot, edge, startX, startY, lastX, moved, pointerId, pointerType }
  let intro = 0;
  let pulse = 0;
  let hitRects = []; // 当帧绘制的 4 块石阶屏幕命中区
  let cssW = 720;
  let cssH = 500;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(280, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(cssW < 520 ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);
  resize();

  function computeLayout() {
    const compact = cssW < 480;
    const padL = compact ? 30 : 62;
    const padR = compact ? 38 : 148;
    const padT = compact ? 14 : 18;
    const padB = compact ? 22 : 28;
    const spanW = Math.max(170, cssW - padL - padR);
    const spanH = Math.max(170, cssH - padT - padB);
    const centerX = padL + spanW * (compact ? 0.48 : 0.45);
    const depthX = clamp(spanW * 0.085, 16, 40);
    const depthY = -clamp(spanH * 0.014, 4, 7);
    return { compact, padL, padR, padT, padB, spanW, spanH, centerX, depthX, depthY };
  }

  function render(t, dt, { still }) {
    if (still) {
      intro = 1;
      for (let i = 0; i < 4; i++) animWidths[i] = state.widths[i];
    } else {
      intro = Math.min(1, intro + (dt > 0 ? dt / 0.58 : 0.08));
      pulse = t;
      const k = dt > 0 ? Math.min(1, dt * 16) : 1;
      for (let i = 0; i < 4; i++) {
        animWidths[i] += (state.widths[i] - animWidths[i]) * k;
      }
    }

    const evalRes = evaluate(state);
    const lay = computeLayout();
    const { compact, padL, padT, spanW, spanH, centerX, depthX, depthY } = lay;

    ctx.clearRect(0, 0, cssW, cssH);

    // 淡建筑标尺底纹（极克制细线，衬托建筑砌筑感；背景暖光交由 CSS .canvas-shell 合成，零逐帧像素开销）
    const baseY = padT + evalRes.baseLineY * spanH;
    ctx.save();
    ctx.strokeStyle = "rgba(80, 18, 21, 0.075)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL - 8, baseY);
    ctx.lineTo(cssW - 14, baseY);
    ctx.stroke();
    ctx.restore();

    // 计算当帧 4 块 3D 石阶几何（自底向上绘制或自顶向下分层避免遮挡）
    const rects = [];
    for (let i = 0; i < 4; i++) {
      const tr = evalRes.tiers[i];
      // 柔和入场：底石先落位、上石依次叠落
      const delay = (3 - i) * 0.09;
      const prog = still ? 1 : EASE_OUT((intro - delay) / 0.62);
      const liftY = (1 - prog) * -18;

      const wNorm = animWidths[i];
      const botW = wNorm * spanW;
      const topFactor = i === 0 ? 0.74 : 0.87;
      const topW = botW * topFactor;
      const yTop = padT + tr.yTop * spanH + liftY;
      const yBot = padT + tr.yBot * spanH + liftY;

      // 悬挑层增加细微重力侧偏示意（让物理失稳肉眼可见）
      const tiltPx = tr.overhangsBelow ? Math.sin((still ? 0.9 : pulse * 2.6) + i) * 2.2 : 0;

      const xBL = centerX - botW * 0.5 + tiltPx;
      const xBR = centerX + botW * 0.5 + tiltPx;
      const xTL = centerX - topW * 0.5 + tiltPx;
      const xTR = centerX + topW * 0.5 + tiltPx;

      // 右侧 3D 立体纵深（越靠底层纵深略厚，呈现真实石台透视）
      const dX = depthX * (0.64 + i * 0.14);
      const dY = depthY * (0.82 + i * 0.08);

      rects.push({
        slot: i,
        tr,
        prog,
        xBL,
        xBR,
        xTL,
        xTR,
        yTop,
        yBot,
        botW,
        topW,
        dX,
        dY,
      });
    }
    hitRects = rects;

    // 1. 地面建筑投影（紧贴最底层底边）
    const btm = rects[3];
    ctx.save();
    const shGrad = ctx.createLinearGradient(btm.xBL - 14, baseY, btm.xBR + btm.dX + 32, baseY + 18);
    shGrad.addColorStop(0, "rgba(116, 77, 46, 0.24)");
    shGrad.addColorStop(0.7, "rgba(116, 77, 46, 0.18)");
    shGrad.addColorStop(1, "rgba(116, 77, 46, 0)");
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.moveTo(btm.xBL - 6, baseY + 1);
    ctx.lineTo(btm.xBR + btm.dX + 26, baseY + 1);
    ctx.lineTo(btm.xBR + btm.dX + 42, baseY + 15);
    ctx.lineTo(btm.xBL + 16, baseY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. 自底向上逐层绘制 3D 截锥石阶（底块在下、上块压顶，顶面台阶清晰露白光边）
    for (let i = 3; i >= 0; i--) {
      const r = rects[i];
      const { tr, xBL, xBR, xTL, xTR, yTop, yBot, dX, dY, prog } = r;
      ctx.save();
      ctx.globalAlpha = clamp(prog * 1.15, 0.08, 1);

      // 2a. 顶面水平退台面（仅在有空隙、最顶层、或下层宽于上层时露出的 3D 台面）
      const topSideY = yTop + dY;
      ctx.fillStyle = tr.color.top;
      ctx.beginPath();
      ctx.moveTo(xTL, yTop);
      ctx.lineTo(xTR, yTop);
      ctx.lineTo(xTR + dX, topSideY);
      ctx.lineTo(xTL + dX * 0.72, topSideY);
      ctx.closePath();
      ctx.fill();

      // 2b. 右侧 3D 阴影立面
      const sideGrad = ctx.createLinearGradient(xTR, yTop, xBR + dX, yBot);
      sideGrad.addColorStop(0, tr.color.side);
      sideGrad.addColorStop(1, "#2A0A0B");
      ctx.fillStyle = sideGrad;
      ctx.beginPath();
      ctx.moveTo(xTR, yTop);
      ctx.lineTo(xTR + dX, yTop + dY);
      ctx.lineTo(xBR + dX, yBot + dY);
      ctx.lineTo(xBR, yBot);
      ctx.closePath();
      ctx.fill();

      // 2c. 正面受光梯形立面
      const frontGrad = ctx.createLinearGradient(xTL, yTop, xBR, yBot);
      frontGrad.addColorStop(0, tr.color.front);
      frontGrad.addColorStop(1, tr.color.side);
      ctx.fillStyle = frontGrad;
      ctx.beginPath();
      ctx.moveTo(xTL, yTop);
      ctx.lineTo(xTR, yTop);
      ctx.lineTo(xBR, yBot);
      ctx.lineTo(xBL, yBot);
      ctx.closePath();
      ctx.fill();

      // 顶部极细高光折棱（强化建筑石材块面感）
      ctx.strokeStyle = "rgba(255, 244, 224, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xTL + 1, yTop + 0.5);
      ctx.lineTo(xTR - 1, yTop + 0.5);
      ctx.stroke();

      // 若被选中准备换序：高亮金框
      const isSelected = state.selectedSlot === i;
      const isHovered = hover.slot === i;
      if (isSelected) {
        ctx.strokeStyle = "#F5C85B";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(xTL, yTop);
        ctx.lineTo(xTR, yTop);
        ctx.lineTo(xBR, yBot);
        ctx.lineTo(xBL, yBot);
        ctx.closePath();
        ctx.stroke();
      } else if (tr.overhangsBelow) {
        // 悬挑警示虚线外框与底部悬挑阴影
        const below = rects[i + 1];
        ctx.strokeStyle = "#E03E2D";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(xBL, yBot);
        ctx.lineTo(below.xTL, yBot + 2);
        ctx.moveTo(xBR, yBot);
        ctx.lineTo(below.xTR, yBot + 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 下缘红色悬挑短标（避开左侧把手与居中层名）
        const tagText = compact ? `+${tr.overhangPct}%` : `悬挑 +${tr.overhangPct}%`;
        ctx.font = `600 10px "IBM Plex Mono", "Noto Serif SC", serif`;
        const tw = ctx.measureText(tagText).width + 10;
        const tx = xBL + 13;
        const ty = yBot - 16;
        ctx.fillStyle = "rgba(179, 33, 24, 0.94)";
        ctx.fillRect(tx, ty, tw, 14);
        ctx.fillStyle = "#FFF8F2";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + 5, ty + 7.5);
      }

      // 2d. 正面图标 + 中文层名 + 简述（严格按实测梯面宽度自适配，永不溢边）
      const midX = (xTL + xTR + xBL + xBR) * 0.25;
      const midY = (yTop + yBot) * 0.5;
      const tierH = yBot - yTop;
      const availW = (r.topW + r.botW) * 0.5 - 26;

      const iconR = clamp(tierH * 0.16, 5.5, 10.5);
      const showSub = !compact && availW >= 150 && tierH >= 64;
      const iconY = showSub ? midY - tierH * 0.24 : midY - tierH * 0.17;
      const titleY = showSub ? midY + tierH * 0.06 : midY + tierH * 0.17;
      const subY = midY + tierH * 0.30;

      drawTierIcon(ctx, tr.icon, midX, iconY, iconR, tr.color.ink);

      const titleSize = compact ? clamp(tierH * 0.21, 11, 13.5) : clamp(tierH * 0.22, 12, 16);
      ctx.fillStyle = tr.color.ink;
      ctx.font = `700 ${titleSize}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tr.name, midX, titleY, Math.max(44, availW));

      if (showSub) {
        ctx.fillStyle = tr.color.subInk;
        ctx.font = `400 11px "Noto Serif SC", serif`;
        ctx.fillText(tr.sub, midX, subY, Math.max(70, availW));
      }

      // 若该层语义错位（比如顶点沉在底层），在左上角贴一枚克制错序徽签（避开把手与标题）
      if (tr.misplaced && availW >= (compact ? 112 : 96)) {
        const badgeText = tr.roleId === "apex" ? "应居顶" : tr.roleId === "base" ? "应落底" : "错序";
        ctx.font = `600 10px "Noto Serif SC", serif`;
        const bw = ctx.measureText(badgeText).width + 10;
        const bx = xTL + 12;
        const by = yTop + 5;
        ctx.fillStyle = "rgba(46, 11, 10, 0.78)";
        ctx.fillRect(bx, by, bw, 15);
        ctx.strokeStyle = "rgba(240, 185, 78, 0.72)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, 15);
        ctx.fillStyle = "#F8EBD6";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, bx + 5, by + 8);
      }

      // 2e. 左右可拖建筑把手（让用户一眼看出每层边缘可拉宽/收窄）
      const drawEdgeGrip = (gx, gy, active) => {
        ctx.save();
        const gh = clamp(tierH * 0.38, 16, 26);
        const gw = active ? 9 : 7;
        ctx.fillStyle = active ? "#F0B94E" : "rgba(248, 235, 214, 0.9)";
        ctx.strokeStyle = active ? "#3B0C09" : "rgba(80, 18, 21, 0.65)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(gx - gw * 0.5, gy - gh * 0.5, gw, gh, 2);
        ctx.fill();
        ctx.stroke();
        // 中间微竖线
        ctx.strokeStyle = active ? "#3B0C09" : "rgba(80, 18, 21, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, gy - gh * 0.24);
        ctx.lineTo(gx, gy + gh * 0.24);
        ctx.stroke();
        ctx.restore();
      };

      const leftMidX = (xTL + xBL) * 0.5;
      const rightMidX = (xTR + xBR) * 0.5;
      const leftActive = (drag && drag.slot === i && drag.edge === "left") || (isHovered && hover.edge === "left");
      const rightActive = (drag && drag.slot === i && drag.edge === "right") || (isHovered && hover.edge === "right");
      drawEdgeGrip(leftMidX, midY, leftActive);
      drawEdgeGrip(rightMidX, midY, rightActive);

      // 层宽小标（悬浮或拖动时显示实时宽度 %）
      if (isHovered || (drag && drag.slot === i) || isSelected) {
        const wLabel = `${tr.widthPct}%`;
        ctx.font = `600 10px "IBM Plex Mono", monospace`;
        const lw = ctx.measureText(wLabel).width + 10;
        const lx = xTR + dX + 6;
        const ly = midY - 8;
        if (lx + lw < cssW - 4) {
          ctx.fillStyle = "#3B0C09";
          ctx.fillRect(lx, ly, lw, 16);
          ctx.fillStyle = "#F8EBD6";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(wLabel, lx + 5, ly + 8.5);
        }
      }

      ctx.restore();
    }

    // 3. 顶峰七芒金日（悬于最顶层上方，聚焦达标时璀璨舒展）
    const topRect = rects[0];
    const sunR = clamp(spanH * 0.062, 13, 24);
    const sunY = Math.max(sunR * 1.9, topRect.yTop - sunR * 1.85);
    const focusRatio = evalRes.focusOk ? 1 : evalRes.apexOnTop ? 0.52 : 0.2;
    drawSun(ctx, centerX, sunY, sunR, focusRatio, still ? 0 : pulse, evalRes.passedCount === 4);

    // 4. 左侧建筑高程重心尺（实时显示视觉重心 G 的高度与 43% 稳固安全线）
    const rulerX = compact ? 16 : 28;
    const rulerTopY = rects[0].yTop;
    const rulerBotY = baseY;
    const rulerH = Math.max(40, rulerBotY - rulerTopY);
    const safeTopY = rulerBotY - 0.43 * rulerH;
    const cogY = rulerBotY - (evalRes.visualCogPct / 100) * rulerH;
    const cogSafe = evalRes.visualCogPct <= 43 && evalRes.overhangCount === 0;

    ctx.save();
    // 稳固下半安全带
    ctx.fillStyle = "rgba(30, 107, 71, 0.14)";
    ctx.fillRect(rulerX - 3, safeTopY, 6, rulerBotY - safeTopY);
    // 尺干
    ctx.strokeStyle = "rgba(80, 18, 21, 0.34)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rulerX, rulerTopY);
    ctx.lineTo(rulerX, rulerBotY);
    ctx.moveTo(rulerX - 5, safeTopY);
    ctx.lineTo(rulerX + 5, safeTopY);
    ctx.stroke();

    // 重心菱形游标
    ctx.fillStyle = cogSafe ? "#1E6B47" : "#B32118";
    ctx.beginPath();
    ctx.moveTo(rulerX + 8, cogY);
    ctx.lineTo(rulerX + 1, cogY - 5);
    ctx.lineTo(rulerX - 6, cogY);
    ctx.lineTo(rulerX + 1, cogY + 5);
    ctx.closePath();
    ctx.fill();

    if (!compact) {
      ctx.font = `600 10px "IBM Plex Mono", monospace`;
      ctx.fillStyle = cogSafe ? "#1E6B47" : "#B32118";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`G ${evalRes.visualCogPct}%`, rulerX + 11, cogY);
      ctx.font = `400 10px "Noto Serif SC", serif`;
      ctx.fillStyle = "#633D36";
      ctx.fillText("稳区", rulerX - 10, rulerBotY + 14);
    }
    ctx.restore();

    // 5. 右侧 1:1 原海报「视线轨迹」实况路径（由实绘右外坡坐标单真源生成）
    if (state.showSightline) {
      ctx.save();
      const offset = compact ? 14 : 22;
      const pts = [];
      for (let i = 3; i >= 0; i--) {
        const rr = rects[i];
        pts.push({
          x: Math.min(cssW - 14, rr.xBR + rr.dX + offset),
          y: rr.yBot - 6,
        });
      }
      pts.push({
        x: Math.min(cssW - 14, topRect.xTR + topRect.dX + offset * 0.85),
        y: Math.max(sunY + 4, topRect.yTop - 16),
      });

      const smoothLine = evalRes.overhangCount === 0 && state.gapMode !== "broken";
      const lineColor = smoothLine ? "#461214" : "#B32118";

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = smoothLine ? 1.5 : 1.7;
      if (!smoothLine) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 顶端箭头
      const pEnd = pts[pts.length - 1];
      const pPrev = pts[pts.length - 2];
      const ang = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.moveTo(pEnd.x, pEnd.y);
      ctx.lineTo(pEnd.x - Math.cos(ang - 0.45) * 9, pEnd.y - Math.sin(ang - 0.45) * 9);
      ctx.lineTo(pEnd.x - Math.cos(ang + 0.45) * 9, pEnd.y - Math.sin(ang + 0.45) * 9);
      ctx.closePath();
      ctx.fill();

      // 沿视线轨迹上升的流动光点（顺滑时直冲塔尖，受阻时在半途折返）
      if (!still) {
        const segs = pts.length - 1;
        const rawP = (pulse * 0.46) % 1;
        const limitP = smoothLine ? rawP : rawP * 0.55;
        const segF = limitP * segs;
        const si = Math.min(segs - 1, Math.floor(segF));
        const st = segF - si;
        const gx = pts[si].x + (pts[si + 1].x - pts[si].x) * st;
        const gy = pts[si].y + (pts[si + 1].y - pts[si].y) * st;
        ctx.fillStyle = smoothLine ? "#BF8116" : "#B32118";
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 原海报右侧横引线 + 圆点 + 「视线轨迹」实时说明（严格落在右安全列，绝不压线）
      if (!compact && cssW >= 540) {
        const maxRightX = Math.max(...pts.map((p) => p.x));
        const anchorPt = pts[2];
        const callY = Math.max(66, anchorPt.y - 16);
        const callX = clamp(maxRightX + 18, cssW - 118, cssW - 92);
        ctx.strokeStyle = "rgba(80, 18, 21, 0.36)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(anchorPt.x + 2, callY);
        ctx.lineTo(cssW - 14, callY);
        ctx.stroke();

        ctx.fillStyle = "#501215";
        ctx.beginPath();
        ctx.arc(cssW - 14, callY, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2E0B0A";
        ctx.font = `700 12px "Noto Serif SC", serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("视线轨迹", callX, callY - 30);

        ctx.fillStyle = smoothLine ? "#633D36" : "#B32118";
        ctx.font = `400 10.5px "Noto Serif SC", serif`;
        const line1 = evalRes.overhangCount > 0 ? "悬挑折断路径" : state.gapMode === "broken" ? "层缝截断上升" : evalRes.taperRatio < 1.8 ? "直筒难聚顶峰" : "沿坡自然收敛";
        const line2 = evalRes.ascentOk ? `斜坡 ${evalRes.slopeDeg}° 聚顶` : `当前坡角 ${evalRes.slopeDeg}°`;
        ctx.fillText(line1, callX, callY - 15);
        ctx.fillText(line2, callX, callY - 3);
      }
      ctx.restore();
    }

    // 6. 选中换序提示浮条（仅在用户已点选第一层时短暂呈现）
    if (state.selectedSlot >= 0) {
      const selTier = evalRes.tiers[state.selectedSlot];
      const msg = `已选中「${selTier.name}」· 再点任意另一层即可互换位序`;
      ctx.save();
      ctx.font = `600 11.5px "Noto Serif SC", serif`;
      const mw = ctx.measureText(msg).width + 22;
      const mx = clamp(centerX - mw * 0.5, 10, cssW - mw - 10);
      const my = 6;
      ctx.fillStyle = "#3B0C09";
      ctx.fillRect(mx, my, mw, 24);
      ctx.strokeStyle = "#F0B94E";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(mx, my, mw, 24);
      ctx.fillStyle = "#FFF7E9";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, mx + mw * 0.5, my + 12.5);
      ctx.restore();
    }
  }

  function hitTest(px, py) {
    const edgeTol = 20;
    for (let i = 0; i < hitRects.length; i++) {
      const r = hitRects[i];
      if (py >= r.yTop - 5 && py <= r.yBot + 5) {
        const lMid = (r.xTL + r.xBL) * 0.5;
        const rMid = (r.xTR + r.xBR) * 0.5;
        if (Math.abs(px - lMid) <= edgeTol) return { slot: i, edge: "left" };
        if (Math.abs(px - rMid) <= edgeTol) return { slot: i, edge: "right" };
        if (px >= Math.min(r.xTL, r.xBL) && px <= Math.max(r.xTR, r.xBR) + r.dX) {
          return { slot: i, edge: "body" };
        }
      }
    }
    return { slot: -1, edge: null };
  }

  function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pt = getPoint(e);
    const hit = hitTest(pt.x, pt.y);
    drag = {
      mode: hit.edge === "left" || hit.edge === "right" ? "edge" : "slope",
      slot: hit.slot,
      edge: hit.edge,
      startX: pt.x,
      startY: pt.y,
      lastX: pt.x,
      moved: false,
      pointerId: e.pointerId,
    };
    if (e.pointerType !== "touch") {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = getPoint(e);
    if (!drag) {
      const h = hitTest(pt.x, pt.y);
      if (h.slot !== hover.slot || h.edge !== hover.edge) {
        hover = h;
        canvas.style.cursor =
          h.edge === "left" || h.edge === "right" ? "ew-resize" : h.slot >= 0 ? "grab" : "ew-resize";
        ctrl.draw();
      }
      return;
    }

    const dxTotal = pt.x - drag.startX;
    const dyTotal = pt.y - drag.startY;
    if (!drag.moved && Math.hypot(dxTotal, dyTotal) > 5) {
      // 触屏下如果是明显竖向滑动，不拦页面滚动
      if (e.pointerType === "touch" && Math.abs(dyTotal) > Math.abs(dxTotal) * 1.35) {
        drag = null;
        return;
      }
      drag.moved = true;
      if (e.pointerType === "touch") {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {}
      }
    }
    if (!drag.moved) return;

    const lay = computeLayout();
    const dx = pt.x - drag.lastX;
    drag.lastX = pt.x;

    if (drag.mode === "edge" && drag.slot >= 0) {
      const halfDist = Math.abs(pt.x - lay.centerX);
      const newW = (halfDist * 2) / lay.spanW;
      setSlotWidth(state, drag.slot, newW);
    } else {
      // 开放区横拖连续调节整塔坡度（保证 data-perf-drag 实时重画与直观手感）
      applySlopeDelta(state, dx / (lay.spanW * 0.72));
    }

    onChange("drag");
    ctrl.draw();
  });

  function finishPointer(e) {
    if (!drag) return;
    const wasMoved = drag.moved;
    const clickedSlot = drag.slot;
    const clickedEdge = drag.edge;
    try {
      canvas.releasePointerCapture(drag.pointerId);
    } catch {}
    drag = null;

    if (!wasMoved && clickedSlot >= 0 && clickedEdge === "body") {
      if (state.selectedSlot === -1) {
        state.selectedSlot = clickedSlot;
      } else if (state.selectedSlot === clickedSlot) {
        state.selectedSlot = -1;
      } else {
        swapSlots(state, state.selectedSlot, clickedSlot);
      }
      onChange("swap");
      ctrl.draw();
    } else if (!wasMoved && clickedSlot === -1 && state.selectedSlot !== -1) {
      state.selectedSlot = -1;
      onChange("select");
      ctrl.draw();
    }
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  canvas.addEventListener("pointerleave", () => {
    if (!drag && hover.slot !== -1) {
      hover = { slot: -1, edge: null };
      ctrl.draw();
    }
  });

  // 键盘精调：左右调当前选中层或整塔坡度，上下切换选中层，Enter/Space 与下一层互换
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (state.selectedSlot >= 0) {
        setSlotWidth(state, state.selectedSlot, state.widths[state.selectedSlot] + dir * 0.04);
      } else {
        applySlopeDelta(state, dir * 0.08);
      }
      onChange("key");
      ctrl.draw();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.key === "ArrowUp" ? -1 : 1;
      if (e.shiftKey && state.selectedSlot >= 0) {
        const next = clamp(state.selectedSlot + step, 0, 3);
        swapSlots(state, state.selectedSlot, next);
        state.selectedSlot = next;
      } else {
        state.selectedSlot = state.selectedSlot < 0 ? 0 : (state.selectedSlot + step + 4) % 4;
      }
      onChange("key");
      ctrl.draw();
    } else if (e.key === "Escape" && state.selectedSlot >= 0) {
      state.selectedSlot = -1;
      onChange("key");
      ctrl.draw();
    }
  });

  const ctrl = loop(canvas, render);
  ctrl.draw();

  return {
    draw: () => ctrl.draw(),
    snapInstant: () => {
      for (let i = 0; i < 4; i++) animWidths[i] = state.widths[i];
      ctrl.draw();
    },
  };
}
