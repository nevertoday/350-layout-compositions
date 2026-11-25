// 079 顶视构图 · 2D 矢量真三维投影渲染器（主角转盘 + 全部章节教学画布）
import { PALETTE as P } from "./palette.js";
import {
  MAT_RADIUS,
  projectPoint,
  shadowVector,
  rectCorners,
  evaluate,
} from "./model.js";

// 将归一化台面坐标 (-1..1) 转换为画布像素坐标
function toPx(nx, ny, cx, cy, R) {
  return { x: cx + nx * R, y: cy + ny * R };
}

function projPx(x, y, z, pitchDeg, focalMm, cx, cy, R) {
  const p = projectPoint(x, y, z, pitchDeg, focalMm);
  return { x: cx + p.x * R, y: cy + p.y * R, scale: p.scale };
}

// 绘阴影：用两层轻柔叠加，避免昂贵的 ctx.filter blur，确保软件渲染 60 帧
function drawSoftPolyShadow(ctx, pts, alpha, soft) {
  if (!pts.length) return;
  const drawPath = (ox, oy) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x + ox, p.y + oy) : ctx.moveTo(p.x + ox, p.y + oy)));
    ctx.closePath();
    ctx.fill();
  };
  if (soft) {
    ctx.fillStyle = `rgba(15, 30, 22, ${(alpha * 0.45).toFixed(3)})`;
    drawPath(2.5, 2.5);
    ctx.fillStyle = `rgba(15, 30, 22, ${(alpha * 0.65).toFixed(3)})`;
    drawPath(0, 0);
  } else {
    ctx.fillStyle = `rgba(15, 30, 22, ${Math.min(0.46, alpha * 1.45).toFixed(3)})`;
    drawPath(0, 0);
  }
}

function drawSoftEllipseShadow(ctx, x, y, rx, ry, alpha, soft) {
  if (soft) {
    ctx.fillStyle = `rgba(15, 30, 22, ${(alpha * 0.42).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 2, rx * 1.09, ry * 1.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(15, 30, 22, ${(alpha * 0.68).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = `rgba(15, 30, 22, ${Math.min(0.48, alpha * 1.5).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 绘制 3D 挤出矩形（底面 z=0 → 顶面 z=topZ，自动画出面向镜头的侧壁）
function drawExtrudedRect(ctx, it, state, cx, cy, R, colors, contourOnly) {
  const { pitchDeg, focalMm } = state;
  const baseCorners = rectCorners(it);
  const bot = baseCorners.map((p) => projPx(p.x, p.y, 0, pitchDeg, focalMm, cx, cy, R));
  const top = baseCorners.map((p) => projPx(p.x, p.y, it.z, pitchDeg, focalMm, cx, cy, R));

  if (contourOnly) {
    ctx.beginPath();
    top.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = "rgba(250, 248, 244, 0.92)";
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    return { top, bot };
  }

  // 画出底面到顶面的四个侧面（用极简有向面积判断面向相机的侧壁）
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const dx = top[i].x - bot[i].x;
    const dy = top[i].y - bot[i].y;
    if (Math.hypot(dx, dy) < 0.7) continue;
    ctx.beginPath();
    ctx.moveTo(bot[i].x, bot[i].y);
    ctx.lineTo(bot[j].x, bot[j].y);
    ctx.lineTo(top[j].x, top[j].y);
    ctx.lineTo(top[i].x, top[i].y);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? colors.sideA : colors.sideB;
    ctx.fill();
  }

  // 顶面主体
  ctx.beginPath();
  top.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = colors.top;
  ctx.fill();
  if (colors.stroke) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  return { top, bot };
}

// 绘制 3D 圆柱/圆形器物（z=0 底圆 → z=topZ 顶圆 + 侧面柱壁）
function drawExtrudedCylinder(ctx, x, y, r, z, state, cx, cy, R, colors, contourOnly) {
  const { pitchDeg, focalMm } = state;
  const sinA = Math.sin((pitchDeg * Math.PI) / 180);
  const bot = projPx(x, y, 0, pitchDeg, focalMm, cx, cy, R);
  const top = projPx(x, y, z, pitchDeg, focalMm, cx, cy, R);
  const rxB = r * R * bot.scale;
  const ryB = rxB * sinA;
  const rxT = r * R * top.scale;
  const ryT = rxT * sinA;

  if (contourOnly) {
    ctx.beginPath();
    ctx.ellipse(top.x, top.y, rxT, ryT, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(250, 248, 244, 0.92)";
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    return { top, bot, rxT, ryT, rxB, ryB };
  }

  const dist = Math.hypot(top.x - bot.x, top.y - bot.y);
  if (dist > 0.8 && colors.side) {
    // 圆柱包络侧壁
    const ang = Math.atan2(top.y - bot.y, top.x - bot.x);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    ctx.fillStyle = colors.side;
    ctx.beginPath();
    ctx.ellipse(bot.x, bot.y, rxB, ryB, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bot.x + nx * rxB, bot.y + ny * ryB);
    ctx.lineTo(top.x + nx * rxT, top.y + ny * ryT);
    ctx.lineTo(top.x - nx * rxT, top.y - ny * ryT);
    ctx.lineTo(bot.x - nx * rxB, bot.y - ny * ryB);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.ellipse(top.x, top.y, rxT, ryT, 0, 0, Math.PI * 2);
  ctx.fillStyle = colors.top;
  ctx.fill();
  if (colors.stroke) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  return { top, bot, rxT, ryT, rxB, ryB };
}

// 绘单件阴影：沿底座到投影末端的连续扫掠阴影，绝不脱离物体底部悬空
function drawItemShadow(ctx, it, state, cx, cy, R) {
  const { pitchDeg, focalMm, lightElev, lightAzim, lightSoft } = state;
  const sinA = Math.sin((pitchDeg * Math.PI) / 180);
  const topZ = it.lensZ || it.z;
  const sv = shadowVector(topZ, lightElev, lightAzim);
  const steps = Math.max(2, Math.min(5, Math.ceil(sv.len / 0.08)));
  const baseAlpha = lightSoft ? 0.13 : 0.22;

  if (it.kind === "rect") {
    const base = rectCorners(it);
    // 沿阴影方向做底座至末端连续填充（先连底层包络，避免长影断开）
    const p0 = base.map((p) => projPx(p.x, p.y, 0, pitchDeg, focalMm, cx, cy, R));
    const p1 = base.map((p) => projPx(p.x + sv.dx, p.y + sv.dy, 0, pitchDeg, focalMm, cx, cy, R));
    ctx.fillStyle = lightSoft ? `rgba(15, 30, 22, 0.12)` : `rgba(15, 30, 22, 0.24)`;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      ctx.beginPath();
      ctx.moveTo(p0[i].x, p0[i].y);
      ctx.lineTo(p0[j].x, p0[j].y);
      ctx.lineTo(p1[j].x, p1[j].y);
      ctx.lineTo(p1[i].x, p1[i].y);
      ctx.closePath();
      ctx.fill();
    }
    drawSoftPolyShadow(ctx, p1, baseAlpha, lightSoft);
    if (it.style === "camera") {
      const lsv = shadowVector(it.lensZ, lightElev, lightAzim);
      const b0 = projPx(it.x, it.y, 0, pitchDeg, focalMm, cx, cy, R);
      const b1 = projPx(it.x + lsv.dx, it.y + lsv.dy, 0, pitchDeg, focalMm, cx, cy, R);
      const rx = it.lensR * R * b1.scale;
      const ry = rx * sinA;
      const ang = Math.atan2(b1.y - b0.y, b1.x - b0.x);
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      ctx.fillStyle = lightSoft ? "rgba(15, 30, 22, 0.13)" : "rgba(15, 30, 22, 0.26)";
      ctx.beginPath();
      ctx.moveTo(b0.x + nx * rx, b0.y + ny * ry);
      ctx.lineTo(b1.x + nx * rx, b1.y + ny * ry);
      ctx.lineTo(b1.x - nx * rx, b1.y - ny * ry);
      ctx.lineTo(b0.x - nx * rx, b0.y - ny * ry);
      ctx.closePath();
      ctx.fill();
      drawSoftEllipseShadow(ctx, b1.x, b1.y, rx, ry, baseAlpha, lightSoft);
    }
  } else {
    const b0 = projPx(it.x, it.y, 0, pitchDeg, focalMm, cx, cy, R);
    const b1 = projPx(it.x + sv.dx, it.y + sv.dy, 0, pitchDeg, focalMm, cx, cy, R);
    const mul = it.style === "plant" ? 0.84 : 1;
    const rx = it.r * R * b1.scale * mul;
    const ry = rx * sinA;
    const dist = Math.hypot(b1.x - b0.x, b1.y - b0.y);
    if (dist > 1) {
      const ang = Math.atan2(b1.y - b0.y, b1.x - b0.x);
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      ctx.fillStyle = lightSoft ? "rgba(15, 30, 22, 0.12)" : "rgba(15, 30, 22, 0.24)";
      ctx.beginPath();
      ctx.moveTo(b0.x + nx * rx, b0.y + ny * ry);
      ctx.lineTo(b1.x + nx * rx, b1.y + ny * ry);
      ctx.lineTo(b1.x - nx * rx, b1.y - ny * ry);
      ctx.lineTo(b0.x - nx * rx, b0.y - ny * ry);
      ctx.closePath();
      ctx.fill();
    }
    drawSoftEllipseShadow(ctx, b1.x, b1.y, rx, ry, baseAlpha, lightSoft);
  }
}

// 绘单件精细器物（3 套题材共 18 种精致图形）
function drawItemBody(ctx, it, state, cx, cy, R, contourOnly) {
  const { pitchDeg, focalMm } = state;
  const sinA = Math.sin((pitchDeg * Math.PI) / 180);

  // 辅助：局部坐标映射至投影点
  const rad = (it.rot * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  const localPt = (lx, ly, lz = it.z) =>
    projPx(it.x + lx * cosR - ly * sinR, it.y + lx * sinR + ly * cosR, lz, pitchDeg, focalMm, cx, cy, R);

  switch (it.style) {
    case "notebook": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, {
        top: P.pineMid,
        sideA: "#EAE4D6", // 书页侧切面！斜拍时清晰露馅
        sideB: "#102E21",
      }, contourOnly);
      if (!contourOnly) {
        // 左侧深松书脊压槽
        const s0 = localPt(-it.w * 0.38, -it.h * 0.5);
        const s1 = localPt(-it.w * 0.38, it.h * 0.5);
        ctx.strokeStyle = "#102C20";
        ctx.lineWidth = Math.max(1.5, R * 0.012);
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
        // 原海报标志姜黄束书带
        const b0 = localPt(-it.w * 0.25, -it.h * 0.5);
        const b1 = localPt(-it.w * 0.25, it.h * 0.5);
        ctx.strokeStyle = P.gold;
        ctx.lineWidth = Math.max(2.6, R * 0.022);
        ctx.beginPath();
        ctx.moveTo(b0.x, b0.y);
        ctx.lineTo(b1.x, b1.y);
        ctx.stroke();
      } else {
        const b0 = localPt(-it.w * 0.25, -it.h * 0.5);
        const b1 = localPt(-it.w * 0.25, it.h * 0.5);
        ctx.strokeStyle = P.dash;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b0.x, b0.y);
        ctx.lineTo(b1.x, b1.y);
        ctx.stroke();
      }
      break;
    }

    case "camera": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, {
        top: P.gold,
        sideA: "#BA880E",
        sideB: "#C99616",
      }, contourOnly);
      if (!contourOnly) {
        // 机顶取景窗与快门小钮
        const vf = localPt(it.w * 0.30, -it.h * 0.28);
        ctx.fillStyle = "#1E2220";
        ctx.beginPath();
        ctx.arc(vf.x, vf.y, Math.max(2.5, R * 0.018), 0, Math.PI * 2);
        ctx.fill();
        // 镜头筒投在机身表面的短影
        const lsv = shadowVector(it.lensZ - it.z, state.lightElev, state.lightAzim);
        const ls = projPx(it.x + lsv.dx * 0.55, it.y + lsv.dy * 0.55, it.z, pitchDeg, focalMm, cx, cy, R);
        const lrx = it.lensR * R * ls.scale;
        drawSoftEllipseShadow(ctx, ls.x, ls.y, lrx, lrx * sinA, 0.22, state.lightSoft);
      }
      // 高耸黑镜头圆柱（斜拍与广角最明显！）
      const lens = drawExtrudedCylinder(ctx, it.x, it.y, it.lensR, it.lensZ, state, cx, cy, R, {
        top: P.inkLens,
        side: "#3A3E3B",
        stroke: "#111412",
      }, contourOnly);
      if (!contourOnly) {
        // 镜片同心细圈与微反光
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(lens.top.x, lens.top.y, lens.rxT * 0.64, lens.ryT * 0.64, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.ellipse(lens.top.x - lens.rxT * 0.24, lens.top.y - lens.ryT * 0.24, lens.rxT * 0.14, lens.ryT * 0.10, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "cup": {
      // 咖啡杯耳（在杯口平面附近）
      const earBase = localPt(it.r * 1.08, -it.r * 0.15, it.z * 0.72);
      const earTip = localPt(it.r * 1.32, -it.r * 0.22, it.z * 0.72);
      ctx.strokeStyle = contourOnly ? P.ink : "#F8F6F1";
      ctx.lineWidth = Math.max(4.5, R * 0.044);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(earBase.x, earBase.y);
      ctx.lineTo(earTip.x, earTip.y);
      ctx.stroke();
      if (contourOnly) {
        ctx.strokeStyle = P.paperBright;
        ctx.lineWidth = Math.max(2, R * 0.022);
        ctx.stroke();
      }

      const cup = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: "#F8F6F1",
        side: "#D8D5CD", // 陶瓷杯身侧壁，斜拍或 24mm 广角立刻显形！
        stroke: "#D4D1C9",
      }, contourOnly);
      if (!contourOnly) {
        // 深松绿咖啡液面（略低于杯沿）
        const liq = projPx(it.x, it.y, it.z * 0.84, pitchDeg, focalMm, cx, cy, R);
        const rx = it.r * 0.80 * R * liq.scale;
        const ry = rx * sinA;
        ctx.fillStyle = P.pine;
        ctx.beginPath();
        ctx.ellipse(liq.x, liq.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(liq.x, liq.y, rx * 0.78, ry * 0.78, 0, Math.PI * 1.1, Math.PI * 1.55);
        ctx.stroke();
      } else {
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(cup.top.x, cup.top.y, cup.rxT * 0.78, cup.ryT * 0.78, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "coaster": {
      const c = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: P.gold,
        side: "#C28E12",
      }, contourOnly);
      if (!contourOnly) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(c.top.x, c.top.y, c.rxT * 0.80, c.ryT * 0.80, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "plant": {
      // 底座小花盆（仅斜拍或广角时露出来）
      if (!contourOnly) {
        drawExtrudedCylinder(ctx, it.x, it.y, it.r * 0.48, it.z * 0.65, state, cx, cy, R, {
          top: "#132E22",
          side: "#2D3832",
        }, false);
      }
      // 三层星芒尖叶（1:1 复刻原海报多肉盆栽）
      const layers = [
        { count: 10, radMul: 1.0, width: 0.25, zH: it.z * 0.76, offset: 0.1, fill: P.pine },
        { count: 9, radMul: 0.76, width: 0.27, zH: it.z * 0.92, offset: 0.45, fill: P.leafMid },
        { count: 7, radMul: 0.46, width: 0.30, zH: it.z * 1.05, offset: 0.2, fill: P.leafLight },
      ];
      for (let li = 0; li < layers.length; li++) {
        if (contourOnly && li > 0) break;
        const L = layers[li];
        const center = projPx(it.x, it.y, L.zH, pitchDeg, focalMm, cx, cy, R);
        for (let k = 0; k < L.count; k++) {
          const ang = (k / L.count) * Math.PI * 2 + L.offset + rad;
          const rLeaf = it.r * L.radMul;
          const tip = projPx(it.x + Math.cos(ang) * rLeaf, it.y + Math.sin(ang) * rLeaf, L.zH * 0.96, pitchDeg, focalMm, cx, cy, R);
          const sideL = projPx(it.x + Math.cos(ang - L.width) * rLeaf * 0.42, it.y + Math.sin(ang - L.width) * rLeaf * 0.42, L.zH, pitchDeg, focalMm, cx, cy, R);
          const sideR = projPx(it.x + Math.cos(ang + L.width) * rLeaf * 0.42, it.y + Math.sin(ang + L.width) * rLeaf * 0.42, L.zH, pitchDeg, focalMm, cx, cy, R);
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(sideL.x, sideL.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.lineTo(sideR.x, sideR.y);
          ctx.closePath();
          if (contourOnly) {
            ctx.fillStyle = "rgba(250, 248, 244, 0.95)";
            ctx.fill();
            ctx.strokeStyle = P.ink;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          } else {
            ctx.fillStyle = L.fill;
            ctx.fill();
            ctx.strokeStyle = "rgba(15, 34, 24, 0.22)";
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      if (!contourOnly) {
        const bud = projPx(it.x, it.y, it.z * 1.08, pitchDeg, focalMm, cx, cy, R);
        ctx.fillStyle = "#5F8D48";
        ctx.beginPath();
        ctx.arc(bud.x, bud.y, Math.max(2.2, R * 0.016), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "pencil": {
      // 削尖木铅笔（左尖右尾）
      const hw = it.w / 2;
      const hh = it.h / 2;
      const tip = localPt(-hw, 0);
      const coneTop = localPt(-hw + it.w * 0.14, -hh);
      const coneBot = localPt(-hw + it.w * 0.14, hh);
      const endTop = localPt(hw, -hh);
      const endBot = localPt(hw, hh);
      const leadTop = localPt(-hw + it.w * 0.055, -hh * 0.38);
      const leadBot = localPt(-hw + it.w * 0.055, hh * 0.38);

      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(coneTop.x, coneTop.y);
      ctx.lineTo(endTop.x, endTop.y);
      ctx.lineTo(endBot.x, endBot.y);
      ctx.lineTo(coneBot.x, coneBot.y);
      ctx.closePath();
      if (contourOnly) {
        ctx.fillStyle = "rgba(250, 248, 244, 0.95)";
        ctx.fill();
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        ctx.fillStyle = P.pineMid;
        ctx.fill();
        // 木削锥
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(coneTop.x, coneTop.y);
        ctx.lineTo(coneBot.x, coneBot.y);
        ctx.closePath();
        ctx.fillStyle = "#DFC798";
        ctx.fill();
        // 铅芯
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(leadTop.x, leadTop.y);
        ctx.lineTo(leadBot.x, leadBot.y);
        ctx.closePath();
        ctx.fillStyle = P.ink;
        ctx.fill();
        // 尾端金箍
        const f0 = localPt(hw - it.w * 0.07, -hh);
        const f1 = localPt(hw - it.w * 0.07, hh);
        ctx.strokeStyle = P.gold;
        ctx.lineWidth = Math.max(2, R * 0.015);
        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f1.x, f1.y);
        ctx.stroke();
      }
      break;
    }

    // ---- 题材二：餐桌平面图 ----
    case "mat": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, { top: P.pineMid, sideA: "#102E21", sideB: "#153829" }, contourOnly);
      if (!contourOnly) {
        const inner = [
          localPt(-it.w * 0.42, -it.h * 0.42),
          localPt(it.w * 0.42, -it.h * 0.42),
          localPt(it.w * 0.42, it.h * 0.42),
          localPt(-it.w * 0.42, it.h * 0.42),
        ];
        ctx.strokeStyle = "rgba(250, 248, 244, 0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        inner.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }
      break;
    }
    case "plate": {
      const pl = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: "#FAF8F2",
        side: "#D7D4CB",
        stroke: "#C7C3B9",
      }, contourOnly);
      ctx.strokeStyle = contourOnly ? P.ink : P.pineMid;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(pl.top.x, pl.top.y, pl.rxT * 0.68, pl.ryT * 0.68, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "vase": {
      const vs = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: P.gold,
        side: "#BE8C12",
      }, contourOnly);
      if (!contourOnly) {
        ctx.fillStyle = P.pine;
        ctx.beginPath();
        ctx.ellipse(vs.top.x, vs.top.y, vs.rxT * 0.42, vs.ryT * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "chair":
    case "chairGold": {
      const accent = it.style === "chairGold" ? P.gold : P.pineMid;
      drawExtrudedRect(ctx, it, state, cx, cy, R, {
        top: "#EAE6DD",
        sideA: "#CAC5B9",
        sideB: "#B9B4A8",
        stroke: "#B8B3A7",
      }, contourOnly);
      if (!contourOnly) {
        const a0 = localPt(-it.w * 0.44, -it.h * 0.22);
        const a1 = localPt(it.w * 0.44, -it.h * 0.22);
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(3, R * 0.025);
        ctx.beginPath();
        ctx.moveTo(a0.x, a0.y);
        ctx.lineTo(a1.x, a1.y);
        ctx.stroke();
      }
      break;
    }
    case "cutlery": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, { top: P.sageTint, sideA: "#9EB09E", sideB: "#AEC0AE" }, contourOnly);
      if (!contourOnly) {
        for (const ox of [-0.18, 0.18]) {
          const p0 = localPt(it.w * ox, -it.h * 0.36);
          const p1 = localPt(it.w * ox, it.h * 0.36);
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = Math.max(2, R * 0.015);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }
      break;
    }

    // ---- 题材三：工具拆解台 (Knolling) ----
    case "ruler": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, { top: P.pineMid, sideA: "#102D21", sideB: "#153829" }, contourOnly);
      if (!contourOnly) {
        ctx.strokeStyle = "rgba(250, 248, 244, 0.72)";
        ctx.lineWidth = 1;
        for (let k = -4; k <= 4; k++) {
          const lx = (k / 5) * (it.w * 0.45);
          const t0 = localPt(lx, -it.h * 0.5);
          const t1 = localPt(lx, -it.h * (k % 2 === 0 ? 0.24 : 0.35));
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.stroke();
        }
      }
      break;
    }
    case "film": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, { top: P.gold, sideA: "#BC8A10", sideB: "#CE9B18" }, contourOnly);
      if (!contourOnly) {
        const sp = localPt(0, 0);
        ctx.fillStyle = P.inkLens;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, it.h * 0.26 * R * sp.scale, it.h * 0.26 * R * sp.scale * sinA, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "loupe": {
      const lp = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: P.inkLens,
        side: "#404542",
      }, contourOnly);
      if (!contourOnly) {
        ctx.fillStyle = "#D4E0DA";
        ctx.beginPath();
        ctx.ellipse(lp.top.x, lp.top.y, lp.rxT * 0.70, lp.ryT * 0.70, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(lp.top.x, lp.top.y, lp.rxT * 0.52, lp.ryT * 0.52, 0, Math.PI * 1.05, Math.PI * 1.48);
        ctx.stroke();
      }
      break;
    }
    case "protractor": {
      const pr = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: P.sageTint,
        side: "#95A896",
        stroke: P.pineMid,
      }, contourOnly);
      if (!contourOnly) {
        ctx.strokeStyle = P.pine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(pr.top.x, pr.top.y, pr.rxT * 0.50, pr.ryT * 0.50, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "knife": {
      drawExtrudedRect(ctx, it, state, cx, cy, R, { top: P.pineMid, sideA: "#102C20", sideB: "#183C2C" }, contourOnly);
      if (!contourOnly) {
        const s0 = localPt(-it.w * 0.22, 0);
        const s1 = localPt(it.w * 0.14, 0);
        ctx.strokeStyle = P.gold;
        ctx.lineWidth = Math.max(3, R * 0.024);
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
      }
      break;
    }
    case "tape": {
      const tp = drawExtrudedCylinder(ctx, it.x, it.y, it.r, it.z, state, cx, cy, R, {
        top: P.gold,
        side: "#BC8A10",
      }, contourOnly);
      if (!contourOnly) {
        ctx.fillStyle = P.paperBright;
        ctx.beginPath();
        ctx.ellipse(tp.top.x, tp.top.y, tp.rxT * 0.48, tp.ryT * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
}

// ---------- 主角画布：079 圆形俯拍静物转盘 ----------
export function drawTurntable(ctx, w, h, state, evalRes, opts = {}) {
  const { intro = 1, interactive = true } = opts;
  ctx.clearRect(0, 0, w, h);

  const size = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = size * 0.43; // 归一化坐标 1.0 对应的像素半径
  const sinA = Math.sin((state.pitchDeg * Math.PI) / 180);

  // 1. 外圈四向测绘虚线与细外环（1:1 承袭 079 原海报）
  ctx.save();
  ctx.strokeStyle = "rgba(123, 130, 124, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.11, 0, Math.PI * 2);
  ctx.stroke();

  // 四向虚线坐标轴（还原原海报圆环四向标尺）
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(123, 130, 124, 0.58)";
  for (const [ax, ay, bx, by] of [
    [cx, cy - R * 1.15, cx, cy - R * 0.90],
    [cx, cy + R * 0.90, cx, cy + R * 1.15],
    [cx - R * 1.15, cy, cx - R * 0.90, cy],
    [cx + R * 0.90, cy, cx + R * 1.15, cy],
  ]) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 2. 四段双色状态断弧（交互态按四维是否通过点亮；非交互盲测图样保持中性全实弧不泄题！）
  const arcDefs = [
    { start: Math.PI * 1.04, end: Math.PI * 1.46, color: P.pine, ok: !interactive || evalRes.pillars.plan.ok },
    { start: Math.PI * 1.54, end: Math.PI * 1.96, color: P.gold, ok: !interactive || evalRes.pillars.contour.ok },
    { start: Math.PI * 0.54, end: Math.PI * 0.96, color: P.gold, ok: !interactive || evalRes.pillars.zone.ok },
    { start: Math.PI * 0.04, end: Math.PI * 0.46, color: P.pine, ok: !interactive || evalRes.pillars.order.ok },
  ];
  const arcSweep = 0.25 + 0.75 * Math.min(1, intro);
  for (const a of arcDefs) {
    const mid = (a.start + a.end) / 2;
    const half = ((a.end - a.start) / 2) * arcSweep;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.03, mid - half, mid + half);
    ctx.strokeStyle = a.ok ? a.color : "rgba(123, 130, 124, 0.55)";
    ctx.lineWidth = a.ok ? Math.max(4, size * 0.011) : Math.max(2.5, size * 0.007);
    if (!a.ok) ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 四向菱点圆徽（原海报标配）
  const markers = [
    { x: cx, y: cy - R * 1.03, fill: P.pine, dot: P.gold },
    { x: cx + R * 1.03, y: cy, fill: P.gold, dot: P.paperBright },
    { x: cx, y: cy + R * 1.03, fill: P.pine, dot: P.paperBright },
    { x: cx - R * 1.03, y: cy, fill: P.pine, dot: P.paperBright },
  ];
  for (const m of markers) {
    ctx.fillStyle = m.fill;
    ctx.beginPath();
    ctx.arc(m.x, m.y, Math.max(4.5, size * 0.013), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = m.dot;
    ctx.beginPath();
    ctx.arc(m.x, m.y, Math.max(1.8, size * 0.0055), 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 中央石膏灰圆环与素白台面（俯角倾斜时台面真实按 sinA 压成椭圆！）
  const ringRx = R * 0.96;
  const ringRy = ringRx * (0.42 + 0.58 * sinA); // 柔化圆环纵缩，既直观体现斜拍，又不丢视觉饱满度
  const matRx = R * MAT_RADIUS;
  const matRy = matRx * sinA;

  // 外石膏圆环
  ctx.fillStyle = P.bevelRing;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ringRx, ringRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.bevelOuter;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 内圆素白台面（剪裁内部绘图）
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, matRx, matRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = state.contourMode ? "#FFFFFF" : P.paperBright;
  ctx.fill();
  ctx.strokeStyle = state.contourMode ? P.ink : "rgba(20, 25, 22, 0.14)";
  ctx.lineWidth = state.contourMode ? 1.4 : 1;
  ctx.stroke();
  ctx.clip();

  // 4. 可选叠加层：分区 ZONE 与 秩序网格 ORDER
  if (state.showZone) {
    ctx.fillStyle = "rgba(197, 209, 196, 0.34)";
    ctx.fillRect(cx - matRx, cy - matRy, matRx, matRy * 2);
    ctx.fillStyle = "rgba(242, 206, 123, 0.28)";
    ctx.fillRect(cx, cy, matRx, matRy);
    ctx.strokeStyle = "rgba(24, 71, 51, 0.42)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - matRy);
    ctx.lineTo(cx, cy + matRy);
    ctx.moveTo(cx - matRx, cy);
    ctx.lineTo(cx + matRx, cy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (state.showOrder) {
    ctx.strokeStyle = "rgba(132, 89, 0, 0.30)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    for (const g of [-0.45, -0.15, 0.15, 0.45]) {
      const p1 = projPx(g, -MAT_RADIUS, 0, state.pitchDeg, state.focalMm, cx, cy, R);
      const p2 = projPx(g, MAT_RADIUS, 0, state.pitchDeg, state.focalMm, cx, cy, R);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      const q1 = projPx(-MAT_RADIUS, g, 0, state.pitchDeg, state.focalMm, cx, cy, R);
      const q2 = projPx(MAT_RADIUS, g, 0, state.pitchDeg, state.focalMm, cx, cy, R);
      ctx.beginPath();
      ctx.moveTo(q1.x, q1.y);
      ctx.lineTo(q2.x, q2.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 安全呼吸内圈细参考线
  ctx.strokeStyle = "rgba(123, 130, 124, 0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, matRx * 0.90, matRy * 0.90, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. 按纵坐标由后往前排布绘图（先全阴影，再全实体，避免近物阴影盖到远物顶面）
  const order = state.items.map((it, idx) => ({ it, idx })).sort((a, b) => a.it.y - b.it.y);
  if (!state.contourMode) {
    for (const { it } of order) drawItemShadow(ctx, it, state, cx, cy, R);
  }
  for (const { it, idx } of order) {
    drawItemBody(ctx, it, state, cx, cy, R, state.contourMode);
    // 选中态微细虚框（仅交互模式显示）
    if (interactive && idx === state.selectedIndex) {
      const p = projPx(it.x, it.y, it.z, state.pitchDeg, state.focalMm, cx, cy, R);
      const radPx = (it.kind === "circle" ? it.r : Math.hypot(it.w, it.h) * 0.5) * R * p.scale + 5;
      ctx.strokeStyle = P.pine;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, radPx, radPx * sinA, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 6. 视觉重心标（开分区层或重心失衡时显式标出）
  if (interactive && (state.showZone || !evalRes.pillars.zone.ok)) {
    const com = projPx(evalRes.comX, evalRes.comY, 0.02, state.pitchDeg, state.focalMm, cx, cy, R);
    ctx.strokeStyle = evalRes.pillars.zone.ok ? P.pine : P.err;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(com.x, com.y);
    ctx.stroke();
    ctx.fillStyle = evalRes.pillars.zone.ok ? P.pine : P.err;
    ctx.beginPath();
    ctx.arc(com.x, com.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.paperBright;
    ctx.beginPath();
    ctx.arc(com.x, com.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. 碰撞红圈提示（单真源标出真正撞在一起的器物对）
  if (interactive && evalRes.overlapPairs.length > 0) {
    for (const [ia, ib] of evalRes.overlapPairs.slice(0, 3)) {
      const a = state.items[ia];
      const b = state.items[ib];
      const mp = projPx((a.x + b.x) / 2, (a.y + b.y) / 2, 0.12, state.pitchDeg, state.focalMm, cx, cy, R);
      ctx.fillStyle = "rgba(180, 52, 40, 0.16)";
      ctx.strokeStyle = P.err;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = P.err;
      ctx.font = `700 ${Math.max(10, Math.round(size * 0.026))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×", mp.x, mp.y + 0.5);
    }
  }

  ctx.restore(); // 结束台面剪裁

  // 8. 顶沿机位/俯角小角签（斜拍时给出清晰光学标尺，正顶时呈现安静绿标）
  if (interactive) {
    const label = state.contourMode
      ? "纯轮廓剪影模式 · CONTOUR"
      : state.pitchDeg < 84
        ? `斜拍 ${state.pitchDeg}° · 圆度 ${evalRes.roundnessPct}%`
        : state.focalMm < 45
          ? `90° · ${state.focalMm}mm 广角边沿外翻`
          : `90° 正顶 · ${state.focalMm}mm 平面`;
    const isWarn = !state.contourMode && (!evalRes.pillars.plan.ok);
    const pillY = cy - ringRy + Math.max(18, size * 0.048);
    ctx.font = `700 ${Math.max(11, Math.round(size * 0.025))}px "Space Mono", "Noto Sans SC", monospace`;
    const tw = ctx.measureText(label).width + 18;
    const th = 22;
    ctx.fillStyle = isWarn ? P.errTint : "rgba(250, 248, 244, 0.94)";
    ctx.strokeStyle = isWarn ? P.err : P.pine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - tw / 2, pillY - th / 2, tw, th, 11);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isWarn ? P.err : P.pine;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, pillY + 0.5);
  }

  ctx.restore();
}

// ---------- 第 01 节：双机位剖面 × 餐桌四椅步进比对画布 ----------
export function drawSec01Optics(ctx, w, h, preset) {
  ctx.clearRect(0, 0, w, h);
  const split = w * 0.44;
  ctx.fillStyle = P.paperBright;
  ctx.fillRect(0, 0, w, h);

  // 分隔细竖线
  ctx.strokeStyle = P.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(split, 14);
  ctx.lineTo(split, h - 14);
  ctx.stroke();

  // 左半区：侧视机位支架剖面
  const lx = split * 0.52;
  const tableY = h * 0.78;
  const tableW = Math.min(split * 0.52, 130);

  // 地面与方桌剖面
  ctx.strokeStyle = P.dash;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(18, tableY + 22);
  ctx.lineTo(split - 18, tableY + 22);
  ctx.stroke();
  ctx.setLineDash([]);

  // 桌腿与桌面
  ctx.strokeStyle = P.pine;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(lx - tableW * 0.42, tableY);
  ctx.lineTo(lx - tableW * 0.42, tableY + 22);
  ctx.moveTo(lx + tableW * 0.42, tableY);
  ctx.lineTo(lx + tableW * 0.42, tableY + 22);
  ctx.stroke();
  ctx.fillStyle = P.pineMid;
  ctx.fillRect(lx - tableW / 2, tableY - 7, tableW, 8);
  // 桌上放一个黄杯子示意高度
  ctx.fillStyle = P.gold;
  ctx.fillRect(lx + tableW * 0.14, tableY - 22, 14, 15);

  // 相机位置由俯角与焦段（距离）决定
  const armR = preset.focalMm === 24 ? Math.min(split * 0.34, h * 0.36) : Math.min(split * 0.44, h * 0.56);
  const rad = (preset.pitchDeg * Math.PI) / 180;
  const camX = lx - Math.cos(rad) * armR;
  const camY = tableY - Math.sin(rad) * armR;

  // 视锥扇形
  const fovHalf = preset.focalMm === 24 ? 0.54 : 0.28;
  const aimAng = Math.atan2(tableY - camY, lx - camX);
  ctx.fillStyle = preset.ok ? "rgba(24, 71, 51, 0.10)" : "rgba(180, 52, 40, 0.11)";
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(aimAng - fovHalf) * (armR + 28), camY + Math.sin(aimAng - fovHalf) * (armR + 28));
  ctx.lineTo(camX + Math.cos(aimAng + fovHalf) * (armR + 28), camY + Math.sin(aimAng + fovHalf) * (armR + 28));
  ctx.closePath();
  ctx.fill();

  // 俯角参考弧与虚线法线
  ctx.strokeStyle = P.dash;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(lx, tableY - 8);
  ctx.lineTo(lx, Math.max(20, tableY - armR - 18));
  ctx.stroke();
  ctx.setLineDash([]);

  // 相机主体图标
  ctx.save();
  ctx.translate(camX, camY);
  ctx.rotate(aimAng);
  ctx.fillStyle = preset.ok ? P.pine : P.err;
  ctx.fillRect(-11, -7, 18, 14);
  ctx.fillStyle = P.gold;
  ctx.fillRect(7, -4.5, 6, 9);
  ctx.restore();

  // 左上与右上标注（窄屏自动精简避免触线）
  const fs = w < 440 ? 10.5 : 12;
  ctx.fillStyle = P.inkMuted;
  ctx.font = `700 ${fs}px "Space Mono", "Noto Sans SC", monospace`;
  ctx.textAlign = "left";
  ctx.fillText(w < 440 ? `剖面 ${preset.pitchDeg}°/${preset.focalMm}mm` : `机位剖面 · ${preset.pitchDeg}° / ${preset.focalMm}mm`, 12, 22);

  // 右半区：取景窗内的原海报「方桌+四椅+圆杯」实拍投影
  const rx = split + (w - split) / 2;
  const ry = h * 0.53;
  const RR = Math.min((w - split) * 0.35, h * 0.33);
  const sinA = Math.sin(rad);

  ctx.fillStyle = P.inkMuted;
  ctx.fillText("实拍取景效果", split + 12, 22);

  // 虚线框
  const fw = Math.min((w - split) - 28, h * 0.72);
  const fh = h * 0.68;
  ctx.strokeStyle = P.dash;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(rx - fw / 2, ry - fh / 2, fw, fh);
  ctx.setLineDash([]);

  // 绘制四把椅子（有真实 3D 椅背高度 z=0.22，斜拍和 24mm 广角都会露出外翻侧壁）
  const chairs = [
    { x: 0, y: -0.58, w: 0.36, h: 0.16, rot: 0, z: 0.24 },
    { x: 0, y: 0.58, w: 0.36, h: 0.16, rot: 0, z: 0.24 },
    { x: -0.58, y: 0, w: 0.16, h: 0.36, rot: 0, z: 0.24 },
    { x: 0.58, y: 0, w: 0.16, h: 0.36, rot: 0, z: 0.24 },
  ];
  const st = { pitchDeg: preset.pitchDeg, focalMm: preset.focalMm };
  for (const ch of chairs) {
    drawExtrudedRect(ctx, ch, st, rx, ry, RR, {
      top: "#FAF8F4",
      sideA: "#D0CCC2",
      sideB: "#B9B5AA",
      stroke: P.ink,
    }, false);
  }
  // 中央深绿方桌
  drawExtrudedRect(ctx, { x: 0, y: 0, w: 0.76, h: 0.76, rot: 0, z: 0.18 }, st, rx, ry, RR, {
    top: P.pineMid,
    sideA: "#102E21",
    sideB: "#173D2D",
    stroke: P.ink,
  }, false);
  // 桌心白圆碗 + 右上角高杯（测试圆度与广角外翻）
  drawExtrudedCylinder(ctx, 0, 0, 0.14, 0.25, st, rx, ry, RR, {
    top: "#FAF8F4",
    side: "#D2CEC4",
  }, false);
  drawExtrudedCylinder(ctx, 0.26, -0.22, 0.085, 0.35, st, rx, ry, RR, {
    top: P.gold,
    side: "#A8790B",
  }, false);

  // 底部圆度实算条
  const roundPct = Math.round(sinA * 100);
  ctx.fillStyle = preset.ok ? P.pine : P.err;
  ctx.font = `700 ${fs}px "Space Mono", "Noto Sans SC", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(w < 440 ? `圆度 ${roundPct}% · ${preset.note}` : `圆桌/碗口圆度 ${roundPct}% · ${preset.note}`, rx, h - 12);
}

// ---------- 第 02 节：四层建筑描图纸叠层画布 ----------
export function drawSec02Layers(ctx, w, h, layers) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = P.paperBright;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;

  // 基准原海报解六件器物（与 model.js posterSol 同步）
  const items = [
    { id: "notebook", kind: "rect", w: 0.34, h: 0.41, z: 0.055, style: "notebook", x: -0.39, y: 0.11, rot: -26 },
    { id: "camera", kind: "rect", w: 0.33, h: 0.23, z: 0.085, lensZ: 0.175, lensR: 0.082, style: "camera", x: 0.09, y: 0.25, rot: 0 },
    { id: "plant", kind: "circle", r: 0.195, z: 0.14, style: "plant", x: 0.47, y: 0.02, rot: 0 },
    { id: "cup", kind: "circle", r: 0.125, z: 0.165, style: "cup", x: -0.44, y: -0.36, rot: -26 },
    { id: "coaster", kind: "circle", r: 0.088, z: 0.015, style: "coaster", x: 0.36, y: -0.39, rot: 0 },
    { id: "pencil", kind: "rect", w: 0.34, h: 0.044, z: 0.025, style: "pencil", x: 0.16, y: 0.51, rot: -12 },
  ];
  const st = { pitchDeg: 90, focalMm: 50, lightElev: 62, lightAzim: 42, lightSoft: true };

  // 圆盘外框
  ctx.strokeStyle = P.hairline;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.94, 0, Math.PI * 2);
  ctx.stroke();

  // 层 3：分区色块（最底层铺色）
  if (layers.zone) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.94, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(197, 209, 196, 0.48)";
    ctx.fillRect(cx - R, cy - R, R, R * 2);
    ctx.fillStyle = "rgba(242, 206, 123, 0.42)";
    ctx.fillRect(cx, cy, R, R);
    ctx.strokeStyle = P.pine;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 层 1：实体静物
  if (layers.solid) {
    for (const it of items) drawItemShadow(ctx, it, st, cx, cy, R);
    for (const it of items) drawItemBody(ctx, it, st, cx, cy, R, false);
  }

  // 层 2：纯轮廓边界描边（叠加时清晰显出所有边界形状）
  if (layers.contour) {
    for (const it of items) {
      drawItemBody(ctx, it, st, cx, cy, R, !layers.solid);
      if (layers.solid) {
        // 叠在实体上时用高对比纯墨外框圈出剪影
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 2;
        if (it.kind === "circle") {
          const p = toPx(it.x, it.y, cx, cy, R);
          ctx.beginPath();
          ctx.arc(p.x, p.y, it.r * R, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const cs = rectCorners(it).map((p) => toPx(p.x, p.y, cx, cy, R));
          ctx.beginPath();
          cs.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  }

  // 层 4：3×3 秩序网格与对齐基准线
  if (layers.order) {
    ctx.strokeStyle = P.goldInk;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    for (const g of [-0.42, 0, 0.42]) {
      ctx.beginPath();
      ctx.moveTo(cx + g * R, cy - R * 0.90);
      ctx.lineTo(cx + g * R, cy + R * 0.90);
      ctx.moveTo(cx - R * 0.90, cy + g * R);
      ctx.lineTo(cx + R * 0.90, cy + g * R);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // 交点小圆锚
    for (const gx of [-0.42, 0, 0.42]) {
      for (const gy of [-0.42, 0, 0.42]) {
        ctx.fillStyle = (gx === 0 && gy === 0) ? P.pine : P.gold;
        ctx.beginPath();
        ctx.arc(cx + gx * R, cy + gy * R, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 若开分区，标出面积加权重心
  if (layers.zone) {
    ctx.fillStyle = P.pine;
    ctx.beginPath();
    ctx.arc(cx + 0.02 * R, cy + 0.07 * R, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.gold;
    ctx.beginPath();
    ctx.arc(cx + 0.02 * R, cy + 0.07 * R, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!layers.solid && !layers.contour && !layers.zone && !layers.order) {
    ctx.fillStyle = P.inkMuted;
    ctx.font = `500 14px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("打开任意一层测绘图纸，观察顶视背后的平面骨架", cx, cy);
  }
}

// ---------- 第 03 节：暗室 360° 环形布光罗盘画布 ----------
export function drawSec03Lighting(ctx, w, h, lightState) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = P.pineDark;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.40;

  // 外圈灯轨（半径代表灯高度角：外圈 = 低角 18° 长影，内圈 = 高角 78° 短影）
  ctx.strokeStyle = "rgba(183, 206, 188, 0.26)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 亮白俯拍桌面
  ctx.fillStyle = P.paperBright;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // 光影投射方向与光源方位相反 (+180°)
  const shadowAzim = (lightState.azim + 180) % 360;
  const st = {
    pitchDeg: 90,
    focalMm: 50,
    lightElev: lightState.elev,
    lightAzim: shadowAzim,
    lightSoft: lightState.soft,
  };

  // 三件经典高度梯度器物（高咖啡杯 z=0.175、姜黄相机 z=0.18、扁圆垫 z=0.02）
  const demoItems = [
    { id: "cup", kind: "circle", r: 0.145, z: 0.175, style: "cup", x: -0.26, y: -0.16, rot: -20 },
    { id: "camera", kind: "rect", w: 0.34, h: 0.24, z: 0.085, lensZ: 0.18, lensR: 0.085, style: "camera", x: 0.16, y: 0.12, rot: 0 },
    { id: "coaster", kind: "circle", r: 0.10, z: 0.018, style: "coaster", x: 0.26, y: -0.28, rot: 0 },
  ];

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
  ctx.clip();
  for (const it of demoItems) drawItemShadow(ctx, it, st, cx, cy, R * 0.88);
  for (const it of demoItems) drawItemBody(ctx, it, st, cx, cy, R * 0.88, false);
  ctx.restore();

  // 绘制可拖动的姜黄灯头把手
  const rad = (lightState.azim * Math.PI) / 180;
  const normDist = 1.12 - ((lightState.elev - 16) / (82 - 16)) * 0.30; // 低角靠外，高角靠内
  const lx = cx + Math.cos(rad) * R * normDist;
  const ly = cy + Math.sin(rad) * R * normDist;

  // 光线指向虚线
  ctx.strokeStyle = "rgba(242, 190, 59, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // 灯头光晕与本体
  ctx.fillStyle = "rgba(242, 190, 59, 0.22)";
  ctx.beginPath();
  ctx.arc(lx, ly, lightState.soft ? 22 : 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = P.goldDarkBg;
  ctx.beginPath();
  ctx.arc(lx, ly, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.pineDark;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 暗室环轨角度刻标与实况角标
  ctx.fillStyle = "rgba(194, 214, 198, 0.82)";
  ctx.font = `400 ${w < 360 ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`高角 ${Math.round(lightState.elev)}° · ${lightState.soft ? "SOFT" : "HARD"}`, 12, 10);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(194, 214, 198, 0.68)";
  ctx.fillText("低角 18°", cx, cy + R * 1.12 + 12);

  // 返回把手位置供指针命中
  return { lx, ly, cx, cy, R };
}

// ---------- 第 04 节：历史四时代俯视图式重绘画布 ----------
export function drawSec04History(ctx, w, h, eraId, t = 0) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = P.paperBright;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.39;

  if (eraId === "vitruvius") {
    // 古罗马神庙平面图 ichnographia（圆规弧线 + 柱列圆点 + 中央圣殿墙体）
    ctx.strokeStyle = "rgba(24, 71, 51, 0.24)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.96, 0, Math.PI * 2);
    ctx.moveTo(cx - R * 1.1, cy);
    ctx.lineTo(cx + R * 1.1, cy);
    ctx.moveTo(cx, cy - R * 1.05);
    ctx.lineTo(cx, cy + R * 1.05);
    ctx.stroke();
    ctx.setLineDash([]);

    const bw = R * 1.32;
    const bh = R * 0.92;
    ctx.strokeStyle = P.pine;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
    // 内殿墙
    ctx.fillStyle = "rgba(24, 71, 51, 0.10)";
    ctx.fillRect(cx - bw * 0.28, cy - bh * 0.28, bw * 0.56, bh * 0.56);
    ctx.strokeRect(cx - bw * 0.28, cy - bh * 0.28, bw * 0.56, bh * 0.56);
    // 周边柱列
    ctx.fillStyle = P.pine;
    for (let i = 0; i < 7; i++) {
      const x = cx - bw / 2 + (i / 6) * bw;
      for (const y of [cy - bh / 2 - 14, cy + bh / 2 + 14]) {
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let j = 1; j < 4; j++) {
      const y = cy - bh / 2 + (j / 4) * bh;
      for (const x of [cx - bw / 2 - 14, cx + bw / 2 + 14]) {
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = P.gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (eraId === "moholy") {
    // 1928 莫霍利-纳吉：柏林无线电塔垂直几何斜切投影
    ctx.fillStyle = "#181C19";
    ctx.fillRect(14, 14, w - 28, h - 28);
    ctx.save();
    ctx.beginPath();
    ctx.rect(14, 14, w - 28, h - 28);
    ctx.clip();
    // 高反差斜切白雪/铺装几何块
    ctx.fillStyle = "#EAE6DD";
    ctx.beginPath();
    ctx.moveTo(w * 0.14, 14);
    ctx.lineTo(w * 0.78, 14);
    ctx.lineTo(w * 0.44, h - 14);
    ctx.lineTo(14, h * 0.62);
    ctx.closePath();
    ctx.fill();
    // 俯视圆形广场与斜影射线
    ctx.fillStyle = "#181C19";
    ctx.beginPath();
    ctx.arc(cx - R * 0.25, cy + R * 0.10, R * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = 2.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.85, h * 0.12);
      ctx.lineTo(cx + i * R * 0.32, h * 0.92);
      ctx.stroke();
    }
    ctx.restore();
  } else if (eraId === "berkeley") {
    // 1933 巴斯比·伯克利：纯几何万花筒俯拍编舞（无面孔，纯几何花瓣与圆帽轮廓）
    ctx.fillStyle = P.pineDark;
    ctx.fillRect(14, 14, w - 28, h - 28);
    const rot = t * 0.25;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let ring = 0; ring < 2; ring++) {
      const n = ring === 0 ? 12 : 8;
      const dist = ring === 0 ? R * 0.68 : R * 0.34;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = ring === 0 ? P.paperBright : P.goldDarkBg;
        ctx.beginPath();
        ctx.ellipse(dist, 0, R * 0.22, R * 0.085, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.pine;
        ctx.beginPath();
        ctx.arc(dist + R * 0.12, 0, R * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = P.goldDarkBg;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // 1987 / 2010 / 2013 Knolling 90° 拆解阵
    const pad = 26;
    const cols = 5;
    const rows = 3;
    const cw = (w - pad * 2) / cols;
    const ch = (h - pad * 2) / rows;
    ctx.strokeStyle = "rgba(123, 130, 124, 0.28)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(pad + c * cw, pad);
      ctx.lineTo(pad + c * cw, h - pad);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(pad, pad + r * ch);
      ctx.lineTo(w - pad, pad + r * ch);
      ctx.stroke();
    }
    // 严格 0°/90° 平行摆放的拆解部件（由大到小）
    const parts = [
      { c: 0, r: 0, w: 0.72, h: 0.72, kind: "rect", fill: P.pineMid },
      { c: 1, r: 0, w: 0.64, h: 0.56, kind: "rect", fill: P.gold },
      { c: 2, r: 0, w: 0.54, h: 0.54, kind: "circle", fill: P.inkLens },
      { c: 3, r: 0, w: 0.44, h: 0.44, kind: "circle", fill: P.pine },
      { c: 4, r: 0, w: 0.28, h: 0.66, kind: "rect", fill: P.sageTint },
      { c: 0, r: 1, w: 0.76, h: 0.24, kind: "rect", fill: P.pine },
      { c: 1, r: 1, w: 0.68, h: 0.24, kind: "rect", fill: P.pineMid },
      { c: 2, r: 1, w: 0.56, h: 0.22, kind: "rect", fill: P.gold },
      { c: 3, r: 1, w: 0.44, h: 0.22, kind: "rect", fill: P.ink },
      { c: 4, r: 1, w: 0.30, h: 0.20, kind: "rect", fill: P.gold },
      { c: 0, r: 2, w: 0.24, h: 0.24, kind: "circle", fill: P.gold },
      { c: 1, r: 2, w: 0.22, h: 0.22, kind: "circle", fill: P.pine },
      { c: 2, r: 2, w: 0.18, h: 0.18, kind: "circle", fill: P.ink },
      { c: 3, r: 2, w: 0.14, h: 0.14, kind: "circle", fill: P.pine },
      { c: 4, r: 2, w: 0.10, h: 0.10, kind: "circle", fill: P.gold },
    ];
    for (const p of parts) {
      const px = pad + (p.c + 0.5) * cw;
      const py = pad + (p.r + 0.5) * ch;
      ctx.fillStyle = p.fill;
      if (p.kind === "rect") {
        const rw = p.w * cw;
        const rh = p.h * ch;
        ctx.fillRect(px - rw / 2, py - rh / 2, rw, rh);
      } else {
        const rr = Math.min(cw, ch) * p.w * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ---------- 第 05 节：六题材双轴适配决策散点图 ----------
export function drawSec05Matrix(ctx, w, h, items, activeId) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = P.paperBright;
  ctx.fillRect(0, 0, w, h);

  const padL = 44;
  const padR = 18;
  const padT = 22;
  const padB = 34;
  const gw = w - padL - padR;
  const gh = h - padT - padB;

  // 右下推荐区（高平面关系 × 低立面依赖）
  ctx.fillStyle = "rgba(24, 71, 51, 0.10)";
  ctx.fillRect(padL + gw * 0.48, padT + gh * 0.48, gw * 0.52, gh * 0.52);
  // 左上禁区（高立面/情绪依赖 × 低平面关系）
  ctx.fillStyle = "rgba(180, 52, 40, 0.08)";
  ctx.fillRect(padL, padT, gw * 0.52, gh * 0.52);

  // 坐标轴与十字中线
  ctx.strokeStyle = P.hairline;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padL + gw * 0.5, padT);
  ctx.lineTo(padL + gw * 0.5, padT + gh);
  ctx.moveTo(padL, padT + gh * 0.5);
  ctx.lineTo(padL + gw, padT + gh * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + gh);
  ctx.lineTo(padL + gw, padT + gh);
  ctx.stroke();

  // 区域标注
  ctx.font = `600 11px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = P.pine;
  ctx.textAlign = "right";
  ctx.fillText("推荐顶视构图区", padL + gw - 8, padT + gh - 10);
  ctx.fillStyle = P.err;
  ctx.textAlign = "left";
  ctx.fillText("建议改道其他视角", padL + 8, padT + 16);

  // 轴名称
  ctx.fillStyle = P.inkMuted;
  ctx.textAlign = "center";
  ctx.fillText("平面布局与空间关系依赖度 →", padL + gw / 2, h - 10);
  ctx.save();
  ctx.translate(15, padT + gh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("立面造型与表情依赖度 →", 0, 0);
  ctx.restore();

  // 绘制 6 个题材点
  for (const it of items) {
    const px = padL + it.planNeed * gw;
    const py = padT + (1 - it.elevNeed) * gh;
    const isActive = it.id === activeId;
    if (isActive) {
      ctx.fillStyle = it.fit ? "rgba(24, 71, 51, 0.18)" : "rgba(180, 52, 40, 0.18)";
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = it.fit ? P.pine : P.err;
    ctx.beginPath();
    ctx.arc(px, py, isActive ? 7.5 : 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.paperBright;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.font = `${isActive ? 700 : 500} 12px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = isActive ? P.ink : P.inkMuted;
    ctx.textAlign = it.planNeed > 0.72 ? "right" : "left";
    ctx.fillText(it.name, px + (it.planNeed > 0.72 ? -11 : 11), py + 4);
  }
}

// ---------- 第 06 节：单变量盲测选项图样渲染 ----------
export function drawQuizOption(ctx, w, h, mode) {
  const baseItems = [
    { id: "notebook", kind: "rect", w: 0.34, h: 0.41, z: 0.055, style: "notebook", x: -0.39, y: 0.11, rot: -26 },
    { id: "camera", kind: "rect", w: 0.33, h: 0.23, z: 0.085, lensZ: 0.175, lensR: 0.082, style: "camera", x: 0.09, y: 0.25, rot: 0 },
    { id: "plant", kind: "circle", r: 0.195, z: 0.14, style: "plant", x: 0.47, y: 0.02, rot: 0 },
    { id: "cup", kind: "circle", r: 0.125, z: 0.165, style: "cup", x: -0.44, y: -0.36, rot: -26 },
    { id: "coaster", kind: "circle", r: 0.088, z: 0.015, style: "coaster", x: 0.36, y: -0.39, rot: 0 },
    { id: "pencil", kind: "rect", w: 0.34, h: 0.044, z: 0.025, style: "pencil", x: 0.16, y: 0.51, rot: -12 },
  ];

  const st = {
    themeId: "poster",
    pitchDeg: 90,
    focalMm: 50,
    lightElev: 62,
    lightAzim: 42,
    lightSoft: true,
    contourMode: false,
    showZone: false,
    showOrder: false,
    selectedIndex: -1,
    items: baseItems.map((x) => ({ ...x })),
  };

  if (mode === "hollow") {
    const angs = [-150, -90, -30, 30, 90, 150];
    st.items.forEach((it, i) => {
      const a = (angs[i] * Math.PI) / 180;
      it.x = Math.cos(a) * 0.65;
      it.y = Math.sin(a) * 0.65;
      it.rot = 0;
    });
  } else if (mode === "overlap") {
    st.items[0].x = -0.14; st.items[0].y = 0.08;
    st.items[1].x = 0.02;  st.items[1].y = 0.16;
    st.items[2].x = 0.24;  st.items[2].y = 0.04;
    st.items[3].x = -0.24; st.items[3].y = -0.12;
  } else if (mode === "lopsided") {
    st.items[0].x = -0.46; st.items[0].y = 0.14; st.items[0].rot = 0;
    st.items[1].x = -0.04; st.items[1].y = 0.48; st.items[1].rot = 0;
    st.items[2].x = -0.04; st.items[2].y = 0.10; st.items[2].rot = 0;
    st.items[3].x = -0.46; st.items[3].y = -0.26; st.items[3].rot = -20;
    st.items[4].x = -0.18; st.items[4].y = -0.34; st.items[4].rot = 0;
    st.items[5].x = -0.44; st.items[5].y = 0.48; st.items[5].rot = 0;
  } else if (mode === "tilt") {
    st.pitchDeg = 60;
  } else if (mode === "wide") {
    st.pitchDeg = 90;
    st.focalMm = 24;
  } else if (mode === "harshShadow") {
    st.pitchDeg = 90;
    st.lightElev = 18;
    st.lightSoft = false;
  }

  const res = evaluate(st);
  drawTurntable(ctx, w, h, st, res, { intro: 1, interactive: false });
}
