// 085 开场主角：三维压平压画台（The Flatness Press）纯 2D Canvas 渲染与直接交互引擎
// 100% 读取 model.js 单真源几何；无重度 shadowBlur，软件渲染与手机均保持流畅 60fps。
import { clamp, evaluate, lerp } from "./model.js";
import { loop, pixelRatio } from "../../lib/stage.js";

function drawHouseWindows(ctx, x, y, w, h, simplify, color, persp) {
  ctx.fillStyle = color;
  if (simplify === 2) {
    // 极简原海报纯黑小方窗
    ctx.fillRect(x, y, w, h);
    return;
  }
  // 繁琐写实多格窗棂与窗台
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#FCF2DA";
  ctx.lineWidth = Math.max(1.2, w * 0.08);
  const cols = simplify === 0 ? 3 : 2;
  const rows = simplify === 0 ? 3 : 2;
  for (let i = 1; i < cols; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / cols, y);
    ctx.lineTo(x + (w * i) / cols, y + h);
    ctx.stroke();
  }
  for (let j = 1; j < rows; j++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h * j) / rows);
    ctx.lineTo(x + w, y + (h * j) / rows);
    ctx.stroke();
  }
  if (simplify === 0) {
    // 写实百叶与小窗台投影
    ctx.fillStyle = "rgba(8,8,8,0.32)";
    ctx.fillRect(x - w * 0.14, y + h, w * 1.28, h * (0.18 + 0.12 * persp));
  }
}

function traceVasePath(ctx, r, sceneId, simplify) {
  const { x, y, w, h } = r;
  const cx = x + w * 0.5;
  ctx.beginPath();
  if (sceneId === "ukiyoe") {
    // 浮世绘炭黑古松剪影（干脆层叠树冠 + 树干）
    ctx.moveTo(cx - w * 0.14, y + h);
    ctx.lineTo(cx - w * 0.1, y + h * 0.45);
    ctx.lineTo(x + w * 0.02, y + h * 0.48);
    ctx.quadraticCurveTo(x - w * 0.02, y + h * 0.3, cx - w * 0.18, y + h * 0.28);
    ctx.lineTo(x + w * 0.08, y + h * 0.24);
    ctx.quadraticCurveTo(cx, y - h * 0.02, x + w * 0.92, y + h * 0.22);
    ctx.lineTo(cx + w * 0.24, y + h * 0.32);
    ctx.quadraticCurveTo(x + w * 1.04, y + h * 0.38, x + w * 0.92, y + h * 0.55);
    ctx.lineTo(cx + w * 0.12, y + h * 0.52);
    ctx.lineTo(cx + w * 0.18, y + h);
    ctx.closePath();
    return;
  }
  if (sceneId === "matisse") {
    // 马蒂斯炭黑长颈壶
    ctx.moveTo(cx - w * 0.26, y + h);
    ctx.bezierCurveTo(x - w * 0.06, y + h * 0.78, x + w * 0.02, y + h * 0.48, cx - w * 0.12, y + h * 0.34);
    ctx.lineTo(cx - w * 0.13, y + h * 0.06);
    ctx.lineTo(cx - w * 0.24, y);
    ctx.lineTo(cx + w * 0.24, y);
    ctx.lineTo(cx + w * 0.13, y + h * 0.06);
    ctx.lineTo(cx + w * 0.12, y + h * 0.34);
    ctx.bezierCurveTo(x + w * 0.98, y + h * 0.48, x + w * 1.06, y + h * 0.78, cx + w * 0.26, y + h);
    ctx.closePath();
    return;
  }
  // 原海报经典双曲颈单耳黑陶瓶
  const lipW = simplify === 2 ? w * 0.28 : w * 0.32;
  ctx.moveTo(cx - w * 0.31, y + h);
  ctx.bezierCurveTo(x - w * 0.05, y + h * 0.80, x - w * 0.02, y + h * 0.46, cx - w * 0.17, y + h * 0.28);
  ctx.lineTo(cx - w * 0.18, y + h * 0.075);
  ctx.lineTo(cx - lipW, y + h * 0.02);
  ctx.lineTo(cx - lipW, y);
  ctx.lineTo(cx + lipW, y);
  ctx.lineTo(cx + lipW, y + h * 0.02);
  ctx.lineTo(cx + w * 0.18, y + h * 0.075);
  ctx.lineTo(cx + w * 0.17, y + h * 0.28);
  ctx.bezierCurveTo(x + w * 1.02, y + h * 0.46, x + w * 1.05, y + h * 0.80, cx + w * 0.31, y + h);
  ctx.closePath();
}

function drawVaseHandle(ctx, r, color, bgRing) {
  const cx = r.x + r.w * 0.5;
  const hx = cx + r.w * 0.28;
  const hy = r.y + r.h * 0.27;
  const rx = r.w * 0.18;
  const ry = r.h * 0.09;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(hx, hy, rx, ry, 0.1, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, r.w * 0.11);
  ctx.stroke();
  ctx.restore();
}

function drawPlant(ctx, r, pal, simplify, shading) {
  const cx = r.x + r.w * 0.5;
  const stemW = Math.max(2.5, r.w * 0.055);
  ctx.save();
  ctx.strokeStyle = pal.plant;
  ctx.fillStyle = pal.plant;
  ctx.lineWidth = stemW;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, r.y + r.h);
  ctx.quadraticCurveTo(cx + r.w * 0.03, r.y + r.h * 0.52, cx - r.w * 0.04, r.y + r.h * 0.12);
  ctx.stroke();

  // 7 片对称交错的大红叶（1:1 复刻原海报）
  const leaves = [
    { u: -0.22, v: 0.12, ang: -0.45, s: 1.02 },
    { u: 0.22, v: 0.27, ang: 0.62, s: 1.05 },
    { u: -0.25, v: 0.40, ang: -0.68, s: 0.96 },
    { u: 0.25, v: 0.51, ang: 0.65, s: 1.04 },
    { u: -0.26, v: 0.65, ang: -0.75, s: 0.96 },
    { u: 0.22, v: 0.78, ang: 0.68, s: 0.92 },
    { u: -0.24, v: 0.87, ang: -0.78, s: 0.82 },
  ];
  const lw = r.w * 0.44;
  const lh = r.h * 0.135;
  for (const lf of leaves) {
    const lx = cx + lf.u * r.w;
    const ly = r.y + lf.v * r.h;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(lf.ang);
    ctx.beginPath();
    ctx.moveTo(0, -lh * lf.s);
    ctx.quadraticCurveTo(lw * 0.58 * lf.s, 0, 0, lh * lf.s);
    ctx.quadraticCurveTo(-lw * 0.58 * lf.s, 0, 0, -lh * lf.s);
    ctx.closePath();
    ctx.fill();
    if (simplify < 2) {
      // 繁琐写实叶脉
      ctx.strokeStyle = shading === 0 ? "rgba(255,240,210,0.55)" : "rgba(8,8,8,0.28)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -lh * lf.s * 0.8);
      ctx.lineTo(0, lh * lf.s * 0.8);
      if (simplify === 0) {
        ctx.moveTo(0, -lh * 0.25);
        ctx.lineTo(lw * 0.24, -lh * 0.45);
        ctx.moveTo(0, 0.05 * lh);
        ctx.lineTo(-lw * 0.24, -lh * 0.18);
        ctx.moveTo(0, lh * 0.35);
        ctx.lineTo(lw * 0.2, lh * 0.12);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawBowl(ctx, r, pal, sceneId, simplify, shading, persp) {
  const cx = r.x + r.w * 0.5;
  const rimY = r.y + r.h * (0.14 + 0.12 * persp);
  const rx = r.w * 0.5;
  const ry = r.h * (0.11 + 0.11 * persp);

  // 立体地面投影
  if (shading < 2) {
    ctx.fillStyle = shading === 0 ? "rgba(8,8,8,0.28)" : "rgba(8,8,8,0.12)";
    ctx.beginPath();
    ctx.ellipse(
      cx + r.w * (0.16 + 0.12 * persp),
      r.y + r.h * 0.95,
      rx * (0.85 + 0.2 * persp),
      r.h * (0.16 + 0.08 * persp),
      0.06,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 碗身 / 小舟半圆
  ctx.beginPath();
  ctx.moveTo(r.x, rimY);
  if (sceneId === "ukiyoe") {
    ctx.quadraticCurveTo(cx, r.y + r.h * 1.18, r.x + r.w, rimY);
  } else {
    ctx.bezierCurveTo(r.x + r.w * 0.04, r.y + r.h * 1.12, r.x + r.w * 0.96, r.y + r.h * 1.12, r.x + r.w, rimY);
  }
  ctx.closePath();

  if (shading === 0) {
    const grad = ctx.createLinearGradient(r.x, rimY, r.x + r.w, r.y + r.h);
    grad.addColorStop(0, pal.bowl);
    grad.addColorStop(0.65, pal.bowl);
    grad.addColorStop(1, "#7F776B");
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = pal.bowl;
  }
  ctx.fill();

  // 碗口内弧
  ctx.beginPath();
  ctx.ellipse(cx, rimY, rx * 0.98, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = pal.bowlRim;
  ctx.fill();

  // 繁琐写实碗身纹饰
  if (simplify < 2) {
    ctx.strokeStyle = "rgba(8,8,8,0.32)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.12, rimY + r.h * 0.34);
    ctx.quadraticCurveTo(cx, rimY + r.h * 0.46, r.x + r.w * 0.88, rimY + r.h * 0.34);
    ctx.stroke();
    if (simplify === 0) {
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.2, rimY + r.h * 0.56);
      ctx.quadraticCurveTo(cx, rimY + r.h * 0.66, r.x + r.w * 0.8, rimY + r.h * 0.56);
      ctx.stroke();
    }
  }

  // 写实高光点
  if (shading === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.ellipse(r.x + r.w * 0.28, rimY + r.h * 0.36, r.w * 0.12, r.h * 0.08, -0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function mountFlatnessPress(canvas, getState, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 800;
  let h = 360;
  let dpr = 1;
  let animT = 0;
  let intro = 0; // 开场平滑入场（绝不给答案，仅平滑画出透视网格与场景）
  let dirty = true;
  let dragMode = null; // 'flatten' | 'vase' | 'bowl' | 'plant'
  let dragStartX = 0;
  let dragStartVal = 0;
  let hoverProp = null;

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    dpr = pixelRatio(1.5);
    w = Math.max(240, Math.round(rect.width));
    h = Math.max(180, Math.round(rect.height));
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function toPx(rect) {
    return { x: rect.x * w, y: rect.y * h, w: rect.w * w, h: rect.h * h };
  }

  // 保持器物在不同画幅宽高比下形态优雅（既不在 2.85:1 宽屏拉胖，也不在 4:3 竖屏压扁）
  function fitProp(rect, maxRatio, minRatio) {
    const px = toPx(rect);
    const targetW = clamp(px.w, px.h * minRatio, px.h * maxRatio);
    return { x: px.x + (px.w - targetW) * 0.5, y: px.y, w: targetW, h: px.h };
  }

  function render(t, dt, { still }) {
    animT = t;
    if (!still && intro < 1) {
      intro = clamp(intro + (dt || 0.016) * 1.4, 0, 1);
      dirty = true;
    } else if (still) {
      intro = 1;
      dirty = true;
    }
    if (!dirty && !dragMode) return;
    dirty = false;

    const state = getState();
    const ev = evaluate(state);
    const { pal, geom: g, scene } = ev;
    const persp = g.persp;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 天空/背景场（不用重度逐像素渐变，软件渲染同样极速）
    ctx.fillStyle = pal.sky;
    ctx.fillRect(0, 0, w, h);
    if (state.shading === 0) {
      const skyH = h * g.tableTopY;
      ctx.fillStyle = "rgba(182, 194, 206, 0.28)";
      ctx.fillRect(0, skyH * 0.48, w, skyH * 0.52);
      ctx.fillStyle = "rgba(198, 208, 218, 0.32)";
      ctx.fillRect(0, skyH * 0.74, w, skyH * 0.26);
    }

    // 若为「花纹失序」错态，全背景铺碎乱斜格/噪点摧毁纯色整体
    if (state.decor === "chaos") {
      ctx.save();
      ctx.strokeStyle = "rgba(252,242,218,0.34)";
      ctx.lineWidth = 2;
      for (let x = -h; x < w + h; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h * 0.7, h);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(253,206,33,0.42)";
      for (let gx = 10; gx < w; gx += 34) {
        for (let gy = 10; gy < h * g.tableTopY; gy += 28) {
          ctx.fillRect(gx, gy, 8, 8);
        }
      }
      ctx.restore();
    }

    // 2. 透视未压平时的消失点与空间网格辅助线
    const vpX = g.vanishingPoint.x * w;
    const vpY = g.vanishingPoint.y * h;
    const tblTopY = g.tableTopY * h;
    if (persp > 0.04) {
      ctx.save();
      ctx.strokeStyle = `rgba(252, 242, 218, ${(0.45 * persp).toFixed(2)})`;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      const rays = [0, 0.25, 0.5, 0.75, 1];
      for (const rx of rays) {
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(rx * w, h);
        ctx.stroke();
      }
      // 消失点圆点标记
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(253, 206, 33, ${(0.88 * persp * intro).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(vpX, vpY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 左小屋（或马蒂斯蓝窗 / 浮世绘雪峰）
    const hL = toPx(g.houseL);
    const sideLW = g.houseL.sideW * w;
    const roofH = g.houseL.roofH * h;

    if (state.scene === "ukiyoe") {
      // 远山雪峰剪影
      ctx.fillStyle = pal.roof;
      ctx.beginPath();
      ctx.moveTo(hL.x, tblTopY);
      ctx.lineTo(hL.x + hL.w * 0.48, hL.y - roofH * 0.5);
      ctx.lineTo(hL.x + hL.w * 1.05, tblTopY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.house;
      ctx.beginPath();
      ctx.moveTo(hL.x + hL.w * 0.31, hL.y + hL.h * 0.14);
      ctx.lineTo(hL.x + hL.w * 0.48, hL.y - roofH * 0.5);
      ctx.lineTo(hL.x + hL.w * 0.67, hL.y + hL.h * 0.14);
      ctx.lineTo(hL.x + hL.w * 0.54, hL.y + hL.h * 0.08);
      ctx.lineTo(hL.x + hL.w * 0.44, hL.y + hL.h * 0.16);
      ctx.closePath();
      ctx.fill();
    } else {
      // 主墙面（左高右低 L 型，忠实复刻原海报）
      const upperW = hL.w * 0.56;
      const lowerTop = hL.y + hL.h * 0.22;
      ctx.fillStyle = pal.house;
      ctx.fillRect(hL.x, hL.y, upperW, hL.h);
      ctx.fillRect(hL.x + upperW - 1, lowerTop, hL.w - upperW + 1, tblTopY - lowerTop);

      // 透视侧墙（随着 flatten -> 1 压平成 0）
      if (sideLW > 1) {
        ctx.fillStyle = pal.sideWall;
        ctx.beginPath();
        ctx.moveTo(hL.x + hL.w, lowerTop);
        ctx.lineTo(hL.x + hL.w + sideLW, lowerTop + 12 * persp);
        ctx.lineTo(hL.x + hL.w + sideLW, tblTopY - 6 * persp);
        ctx.lineTo(hL.x + hL.w, tblTopY);
        ctx.closePath();
        ctx.fill();
      }

      // 屋顶（左黑梯形 + 右朱红三角，1:1 复刻原海报）
      ctx.fillStyle = pal.roof;
      ctx.beginPath();
      ctx.moveTo(hL.x, hL.y);
      ctx.lineTo(hL.x + upperW * 0.35, hL.y - roofH);
      ctx.lineTo(hL.x + upperW, hL.y - roofH);
      ctx.lineTo(hL.x + upperW, hL.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pal.roofAccent;
      ctx.beginPath();
      ctx.moveTo(hL.x + upperW, hL.y - roofH);
      ctx.lineTo(hL.x + upperW + hL.w * 0.21, lowerTop);
      ctx.lineTo(hL.x + upperW, lowerTop);
      ctx.closePath();
      ctx.fill();

      // 左屋窗户
      drawHouseWindows(
        ctx,
        hL.x + upperW * 0.14,
        hL.y + hL.h * 0.24,
        upperW * 0.2,
        upperW * 0.2,
        state.simplify,
        pal.arch,
        persp
      );
    }

    // 4. 右侧拱门小屋（或马蒂斯挂画框 / 浮世绘白亭）
    const hR = toPx(g.houseR);
    const sideRW = g.houseR.sideW * w;
    const stepX = hR.x + hR.w * 0.61;
    const stepY = hR.y + hR.h * 0.28;

    // 透视左侧墙
    if (sideRW > 1) {
      ctx.fillStyle = pal.sideWall;
      ctx.beginPath();
      ctx.moveTo(hR.x, hR.y);
      ctx.lineTo(hR.x - sideRW, hR.y + 16 * persp);
      ctx.lineTo(hR.x - sideRW, tblTopY - 8 * persp);
      ctx.lineTo(hR.x, tblTopY);
      ctx.closePath();
      ctx.fill();
    }

    // 右屋正面阶梯几何墙面
    ctx.fillStyle = pal.house;
    ctx.fillRect(hR.x, hR.y, hR.w * 0.62, hR.h);
    ctx.fillRect(stepX - 1, stepY, hR.w - (stepX - hR.x) + 1, tblTopY - stepY);

    // 繁琐写实砌砖线（仅 simplify === 0）
    if (state.simplify === 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(8,8,8,0.12)";
      ctx.lineWidth = 1;
      for (let by = hR.y + 18; by < tblTopY; by += 18) {
        ctx.beginPath();
        ctx.moveTo(hR.x, by);
        ctx.lineTo(by > stepY ? hR.x + hR.w : stepX, by);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 右屋纯黑拱门（同色融死检测区！）
    const arch = toPx(g.archDoor);
    const archR = arch.w * 0.5;
    ctx.fillStyle = pal.arch;
    ctx.beginPath();
    ctx.moveTo(arch.x, arch.y + arch.h);
    ctx.lineTo(arch.x, arch.y + archR);
    ctx.arc(arch.x + archR, arch.y + archR, archR, Math.PI, 0, false);
    ctx.lineTo(arch.x + arch.w, arch.y + arch.h);
    ctx.closePath();
    ctx.fill();

    // 右屋小方窗
    drawHouseWindows(
      ctx,
      stepX + (hR.w - (stepX - hR.x)) * 0.25,
      stepY + (tblTopY - stepY) * 0.22,
      hR.w * 0.12,
      hR.w * 0.12,
      state.simplify,
      pal.arch,
      persp
    );

    // 5. 朱红台面（从透视梯形连续压平为纯红横带！）
    const inset = g.tableInsetTop * w;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(inset, tblTopY);
    ctx.lineTo(w - inset, tblTopY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = pal.table;
    ctx.fill();
    if (state.shading === 0) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "rgba(38, 28, 22, 0.34)";
      ctx.fillRect(0, tblTopY, w, (h - tblTopY) * 0.28);
      ctx.fillStyle = "rgba(38, 28, 22, 0.22)";
      ctx.fillRect(0, tblTopY + (h - tblTopY) * 0.72, w, (h - tblTopY) * 0.28);
      ctx.restore();
    }

    // 若未压平，标示桌沿透视侧边线与木纹
    if (persp > 0.06) {
      ctx.strokeStyle = "rgba(253, 206, 33, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(inset, tblTopY);
      ctx.lineTo(0, h);
      ctx.moveTo(w - inset, tblTopY);
      ctx.lineTo(w, h);
      ctx.stroke();
    }
    ctx.restore();

    // 6. 右下棋盘格节奏带（rhythm）或满台花纹噪点（chaos）
    if (state.decor === "rhythm") {
      const ck = toPx(g.checker);
      const cols = 6;
      const rows = 2;
      ctx.save();
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const u0 = cc / cols;
          const u1 = (cc + 1) / cols;
          const v0 = rr / rows;
          const v1 = (rr + 1) / rows;
          // 透视未压平时棋盘格也跟随透视梯形斜切
          const topShift = 0.08 * persp * ck.w;
          const x00 = ck.x + lerp(topShift, 0, v0) + u0 * (ck.w - lerp(topShift * 1.4, 0, v0));
          const x10 = ck.x + lerp(topShift, 0, v0) + u1 * (ck.w - lerp(topShift * 1.4, 0, v0));
          const x11 = ck.x + lerp(topShift, 0, v1) + u1 * (ck.w - lerp(topShift * 1.4, 0, v1));
          const x01 = ck.x + lerp(topShift, 0, v1) + u0 * (ck.w - lerp(topShift * 1.4, 0, v1));
          const y0 = ck.y + v0 * ck.h;
          const y1 = ck.y + v1 * ck.h;
          ctx.fillStyle = (rr + cc) % 2 === 0 ? pal.decorA : pal.decorB;
          ctx.beginPath();
          ctx.moveTo(x00, y0);
          ctx.lineTo(x10, y0);
          ctx.lineTo(x11, y1);
          ctx.lineTo(x01, y1);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (state.decor === "chaos") {
      ctx.save();
      ctx.fillStyle = "rgba(8,8,8,0.28)";
      for (let cx = 8; cx < w; cx += 22) {
        for (let cy = tblTopY + 8; cy < h; cy += 18) {
          ctx.beginPath();
          ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 7. 朱红七叶枝（可拖）
    const pl = fitProp(g.plant, 0.72, 0.42);
    drawPlant(ctx, pl, pal, state.simplify, state.shading);

    // 8. 炭黑花瓶（可拖）
    const vs = fitProp(g.vase, 0.72, 0.52);
    // 立体长投影（仅 shading < 2）
    if (state.shading < 2) {
      ctx.save();
      ctx.fillStyle = state.shading === 0 ? "rgba(8,8,8,0.34)" : "rgba(8,8,8,0.14)";
      ctx.beginPath();
      ctx.ellipse(
        vs.x + vs.w * (0.78 + 0.24 * persp),
        vs.y + vs.h * 0.96,
        vs.w * (0.72 + 0.28 * persp),
        vs.h * (0.12 + 0.05 * persp),
        -0.08,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
    if (state.scene === "mediterranean") {
      drawVaseHandle(ctx, vs, pal.vase);
    }
    ctx.save();
    traceVasePath(ctx, vs, state.scene, state.simplify);
    if (state.shading === 0) {
      const vGrad = ctx.createRadialGradient(
        vs.x + vs.w * 0.34,
        vs.y + vs.h * 0.56,
        vs.w * 0.06,
        vs.x + vs.w * 0.5,
        vs.y + vs.h * 0.62,
        vs.w * 0.72
      );
      vGrad.addColorStop(0, "#7E7A74");
      vGrad.addColorStop(0.55, pal.vase);
      vGrad.addColorStop(1, "#050505");
      ctx.fillStyle = vGrad;
    } else if (state.shading === 1) {
      const vGrad = ctx.createLinearGradient(vs.x, vs.y, vs.x + vs.w, vs.y);
      vGrad.addColorStop(0, "#353330");
      vGrad.addColorStop(0.5, pal.vase);
      vGrad.addColorStop(1, pal.vase);
      ctx.fillStyle = vGrad;
    } else {
      ctx.fillStyle = pal.vase;
    }
    ctx.fill();

    // 写实花瓶釉纹细节
    if (state.simplify < 2 && state.scene !== "ukiyoe") {
      ctx.strokeStyle = "rgba(252,242,218,0.38)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(vs.x + vs.w * 0.18, vs.y + vs.h * 0.52);
      ctx.lineTo(vs.x + vs.w * 0.82, vs.y + vs.h * 0.52);
      if (state.simplify === 0) {
        ctx.moveTo(vs.x + vs.w * 0.14, vs.y + vs.h * 0.64);
        ctx.lineTo(vs.x + vs.w * 0.86, vs.y + vs.h * 0.64);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 9. 奶白蓝口大碗（可拖）
    const bw = fitProp(g.bowl, 2.35, 1.55);
    drawBowl(ctx, bw, pal, state.scene, state.simplify, state.shading, persp);

    // 10. 实绘几何诊断高亮（同色融死 / 器物叠死 / 切线粘连 / 可拖提示）
    if (state.showGuides) {
      ctx.save();
      if (ev.archMerge) {
        ctx.strokeStyle = "#FDCE21";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(arch.x - 4, arch.y - 4, arch.w + 8, arch.h + 8);
        drawCanvasPill(ctx, arch.x + arch.w * 0.5, Math.max(24, arch.y - 14), "× 同色融死 · 拖离黑门", "#080808", "#FDCE21", w);
      } else if (ev.fgClash) {
        const mx = (vs.x + vs.w * 0.5 + bw.x + bw.w * 0.5) * 0.5;
        ctx.strokeStyle = "#FDCE21";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(Math.min(vs.x, bw.x), bw.y - 4, Math.max(vs.x + vs.w, bw.x + bw.w) - Math.min(vs.x, bw.x), bw.h + 8);
        drawCanvasPill(ctx, mx, Math.max(24, bw.y - 16), `× 轮廓互挡 ${Math.round(ev.vaseBowlOverlap * 100)}%`, "#080808", "#FDCE21", w);
      } else if (ev.tangentTrap) {
        const edgeX = hL.x + hL.w;
        ctx.strokeStyle = "#FDCE21";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(edgeX, hL.y);
        ctx.lineTo(edgeX, tblTopY);
        ctx.stroke();
        drawCanvasPill(ctx, edgeX, Math.max(24, hL.y - 10), "× 切线粘连 · 推入墙内", "#080808", "#FDCE21", w);
      } else if (ev.stickerFlat && state.flatten >= 0.85) {
        drawCanvasPill(ctx, vs.x + vs.w * 0.5, Math.max(24, vs.y - 10), "← 拖压左墙建层序", "#080808", "#FDCE21", w);
      }

      // 若正在悬停或拖动某件器物，画一条干脆的 2px 铬黄底部滑轨线
      const focusKey = dragMode === "vase" || dragMode === "bowl" || dragMode === "plant" ? dragMode : hoverProp;
      if (focusKey) {
        const fr = focusKey === "vase" ? vs : focusKey === "bowl" ? bw : pl;
        ctx.setLineDash([]);
        ctx.strokeStyle = "#FDCE21";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(fr.x - 3, fr.y - 3, fr.w + 6, fr.h + 6);
      }
      ctx.restore();
    }

    // 11. 顶部角落克制标注：实测压平度与倾角
    const hudText = `压平 ${ev.flattenPct}% · 桌倾 ${ev.tableAngleDeg}° · 跨界 ${ev.overlapCount} 处`;
    drawCornerTag(ctx, 12, 12, hudText, "#080808", "#FCF2DA");
    const statusBg = ev.passedCount === 4 ? "#0E6B3F" : "#080808";
    const statusFg = ev.passedCount === 4 ? "#FCF2DA" : "#FDCE21";
    drawCornerTag(ctx, w - 12, 12, ev.badge, statusBg, statusFg, "right");

    // 若处于开场透视态，在左上蓝天纯空白处放静态清晰的横拖压平引导胶囊（不持续晃动，不遮挡红叶枝）
    if (ev.issueKey === "persp" && !dragMode) {
      const slideIn = still ? 0 : (1 - intro) * -14;
      drawCanvasPill(
        ctx,
        w * 0.28 + slideIn,
        h * 0.16,
        "← 空白处向右横拖 · 把立体压平 →",
        "#080808",
        "#FDCE21",
        w
      );
    }

    ctx.restore();
  }

  function drawCornerTag(c, x, y, text, bg, fg, align = "left") {
    c.save();
    c.font = '700 12px "Chivo", "Noto Sans SC", sans-serif';
    const tw = c.measureText(text).width;
    const pw = tw + 16;
    const ph = 24;
    const bx = align === "right" ? x - pw : x;
    c.fillStyle = bg;
    c.fillRect(bx, y, pw, ph);
    c.fillStyle = fg;
    c.textBaseline = "middle";
    c.fillText(text, bx + 8, y + ph * 0.5 + 0.5);
    c.restore();
  }

  function drawCanvasPill(c, cx, cy, text, bg, fg, maxW) {
    c.save();
    c.font = '700 12px "Noto Sans SC", sans-serif';
    const tw = c.measureText(text).width;
    const pw = tw + 18;
    const ph = 26;
    const bx = clamp(cx - pw * 0.5, 8, maxW - pw - 8);
    const by = clamp(cy - ph * 0.5, 38, h - ph - 8);
    c.fillStyle = bg;
    c.fillRect(bx, by, pw, ph);
    c.strokeStyle = fg;
    c.lineWidth = 1.5;
    c.strokeRect(bx, by, pw, ph);
    c.fillStyle = fg;
    c.textBaseline = "middle";
    c.fillText(text, bx + 9, by + ph * 0.5 + 0.5);
    c.restore();
  }

  function hitTest(px, py) {
    const state = getState();
    const g = evaluate(state).geom;
    const u = px / w;
    const v = py / h;
    // 命中次序：碗（最前） -> 花瓶 -> 红叶
    if (u >= g.bowl.x - 0.02 && u <= g.bowl.x + g.bowl.w + 0.02 && v >= g.bowl.y - 0.02 && v <= g.bowl.bottom + 0.02) {
      return "bowl";
    }
    if (u >= g.vase.x - 0.02 && u <= g.vase.x + g.vase.w + 0.02 && v >= g.vase.y - 0.02 && v <= g.vase.bottom + 0.02) {
      return "vase";
    }
    if (u >= g.plant.x - 0.02 && u <= g.plant.x + g.plant.w + 0.02 && v >= g.plant.y - 0.02 && v <= g.plant.bottom + 0.02) {
      return "plant";
    }
    return null;
  }

  const getLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  // 支持鼠标 + 触摸（纵向滚动不拦截，仅横向拖动压平或移动器物）
  let startY = 0;
  let axisLocked = null;

  function onDown(e) {
    const pt = getLocal(e);
    const hit = hitTest(pt.x, pt.y);
    const state = getState();
    dragStartX = pt.x;
    startY = pt.y;
    axisLocked = e.type === "touchstart" ? null : "x";
    if (hit) {
      dragMode = hit;
      dragStartVal = hit === "vase" ? state.vaseX : hit === "bowl" ? state.bowlX : state.plantX;
    } else {
      dragMode = "flatten";
      dragStartVal = state.flatten;
    }
    if (e.type === "pointerdown" && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onMove(e) {
    const pt = getLocal(e);
    if (!dragMode) {
      const hit = hitTest(pt.x, pt.y);
      if (hit !== hoverProp) {
        hoverProp = hit;
        canvas.style.cursor = hit ? "grab" : "ew-resize";
        requestDraw();
      }
      return;
    }
    const dx = pt.x - dragStartX;
    const dy = pt.y - startY;
    if (axisLocked === null) {
      if (Math.hypot(dx, dy) < 6) return;
      axisLocked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (axisLocked === "y") return;
    if (e.cancelable) e.preventDefault();

    dirty = true;
    const du = dx / Math.max(160, w * 0.62);
    if (dragMode === "flatten") {
      const next = clamp(dragStartVal + du, 0, 1);
      onChange({ flatten: +next.toFixed(3) });
    } else if (dragMode === "vase") {
      onChange({ vaseX: +clamp(dragStartVal + dx / w, 0.09, 0.91).toFixed(3) });
    } else if (dragMode === "bowl") {
      onChange({ bowlX: +clamp(dragStartVal + dx / w, 0.11, 0.89).toFixed(3) });
    } else if (dragMode === "plant") {
      onChange({ plantX: +clamp(dragStartVal + dx / w, 0.09, 0.91).toFixed(3) });
    }
  }

  function onUp() {
    const wasDragging = !!dragMode;
    dragMode = null;
    axisLocked = null;
    dirty = true;
    if (wasDragging) onChange({}, true);
    else requestDraw();
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  // 额外监听 touch 事件，兼容 perf.mjs 直接派发 Input.dispatchTouchEvent
  canvas.addEventListener("touchstart", onDown, { passive: true });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onUp, { passive: true });

  // 键盘无障碍操作（←/→ 压平透视，Shift+←/→ 移花瓶，Space 切平涂光影）
  canvas.addEventListener("keydown", (e) => {
    const s = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (e.shiftKey) onChange({ vaseX: +clamp(s.vaseX + 0.04, 0.09, 0.91).toFixed(3) }, true);
      else onChange({ flatten: +clamp(s.flatten + 0.08, 0, 1).toFixed(3) }, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.shiftKey) onChange({ vaseX: +clamp(s.vaseX - 0.04, 0.09, 0.91).toFixed(3) }, true);
      else onChange({ flatten: +clamp(s.flatten - 0.08, 0, 1).toFixed(3) }, true);
    } else if (e.key === " ") {
      e.preventDefault();
      onChange({ shading: (s.shading + 1) % 3 }, true);
    }
  });

  function requestDraw() {
    dirty = true;
    runner.draw();
  }

  syncSize();
  const runner = loop(canvas, render);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      syncSize();
      requestDraw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    syncSize();
    requestDraw();
  });
  return { draw: requestDraw, markDirty: () => { dirty = true; } };
}
