// 051 螺旋构图 · 开场「盘螺导引台」2D Canvas 渲染与直接操控引擎
// 全程无 shadowBlur（软件渲染仍稳跑 60fps），纹理在初始化时一次性预烘焙。

import { loop, pixelRatio } from "../../lib/stage.js";
import { PHI, SPECIMENS, auditSpiral, clamp } from "./model.js";

const PALETTE = {
  paper: "#FDF6E9",
  paperWarm: "#F7ECD8",
  navy: "#0A1932",
  navyDeep: "#0B1B33",
  navyMid: "#394657",
  navyFade: "#B6B4AE",
  coral: "#E66240",
  coralBright: "#EB694B",
  coralPeach: "#F5AD92",
  coralInk: "#B53D1E",
  sand: "#E7D6B9",
  sandDark: "#9E8460",
  ok: "#1B6B56",
  err: "#B8292F",
};

// 一次性预烘焙 128×128 纸面颗粒噪点图案，还原 051 原海报的墨粒渐散质感
function createStipplePattern(ctx, colorRgb, density = 0.24) {
  const size = 128;
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const g = off.getContext("2d");
  // 确定性伪随机，避免每次打开纹理跳动
  let seed = 51051;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const count = Math.floor(size * size * density);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * size);
    const y = Math.floor(rnd() * size);
    const a = 0.08 + rnd() * 0.24;
    g.fillStyle = `rgba(${colorRgb},${a.toFixed(3)})`;
    g.fillRect(x, y, rnd() > 0.72 ? 2 : 1, 1);
  }
  return ctx.createPattern(off, "repeat");
}

// 用左右法线边界拼出一条从外到内渐细的实体螺带多边形路径
function traceRibbonPolygon(ctx, pts, scaleWidth = 1) {
  if (pts.length < 2) return;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const w = p.halfW * scaleWidth;
    const x = p.x + p.nx * w;
    const y = p.y + p.ny * w;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    const w = p.halfW * scaleWidth;
    const x = p.x - p.nx * w;
    const y = p.y - p.ny * w;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// 简洁圆角标签（用于画布内的单真源标注，不用 shadowBlur）
function drawTag(ctx, x, y, text, bg, fg, border = null) {
  ctx.save();
  ctx.font = '600 11.5px "IBM Plex Mono", "Noto Sans SC", sans-serif';
  const padX = 7;
  const h = 21;
  const w = Math.ceil(ctx.measureText(text).width + padX * 2);
  const bx = Math.round(x - w / 2);
  const by = Math.round(y - h / 2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 3);
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, Math.round(x), Math.round(y) + 0.5);
  ctx.restore();
}

export function mountHeroStage(canvas, state, { onChange }) {
  const ctx = canvas.getContext("2d");
  const paperGrain = createStipplePattern(ctx, "253,246,233", 0.28);
  const inkGrain = createStipplePattern(ctx, "10,25,50", 0.12);

  let width = 760;
  let height = 520;
  let dpr = 1;
  let lastAudit = null;
  let dirty = true;

  // 开场绘制进场动画（0.62s 完毕，确保 0.9s 截图清晰完整）
  let reveal = 0;
  // 滴墨视线脉冲状态
  const gaze = {
    active: false,
    progress: 0, // 0..1.25
    outcome: "lock",
    ripple: 0,
  };

  // 指针交互状态
  const drag = {
    mode: null, // 'core' | 'bead' | 'wind'
    pointerId: null,
    startX: 0,
    startY: 0,
    startTurns: 0,
    startGrowth: 0,
    startSpan: 0,
    startAngle: 0,
    isTouch: false,
    lockedAxis: null,
  };

  let hoverPart = null; // 'core' | 'bead' | 'blueprint' | null
  let blueprintRect = { x: 0, y: 0, w: 0, h: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 遵循 GUIDE.md：手机小屏像素比最高 1.5，桌面最高 2，兼顾锐利与软件渲染高帧率
    dpr = rect.width <= 520 ? pixelRatio(1.5) : pixelRatio(2);
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      dirty = true;
    }
  }

  function triggerGaze() {
    gaze.active = true;
    gaze.progress = 0;
    gaze.ripple = 0;
    dirty = true;
  }

  function markDirty() {
    dirty = true;
  }

  // 根据当前画布尺寸评估坐标命中的交互件
  function hitTest(px, py) {
    if (!lastAudit) return null;
    const g = lastAudit.geom;
    // 1. 右下角活体黄金方格蓝图
    if (
      px >= blueprintRect.x &&
      px <= blueprintRect.x + blueprintRect.w &&
      py >= blueprintRect.y &&
      py <= blueprintRect.y + blueprintRect.h
    ) {
      return "blueprint";
    }
    // 2. 珊瑚焦点核心（放大点击半径方便触屏）
    const coreHit = Math.max(24, g.core.r * 1.45);
    if (Math.hypot(px - g.core.x, py - g.core.y) <= coreHit) return "core";
    // 3. 外圈海蓝入口珠
    if (Math.hypot(px - g.bead1.x, py - g.bead1.y) <= 24) return "bead";
    return "wind";
  }

  // 绘制黄金矩形分格叠加层（当开启 showGoldenGrid 时铺在画布中）
  function drawGoldenOverlay(geom) {
    const { eye, maxR, width: w, height: h } = geom;
    ctx.save();
    // 构造以螺眼为中心、宽高比约为 φ:1 的经典黄金分割矩形框
    const boxH = Math.min(h * 0.78, maxR * 1.66);
    const boxW = Math.min(w * 0.88, boxH * PHI);
    const finalH = boxW / PHI;
    // 黄金螺眼位于距左 0.7236、距顶 0.7236（或随镜像翻转）
    const rx = clamp(eye.x - boxW * 0.7236, 14, w - boxW - 14);
    const ry = clamp(eye.y - finalH * 0.62, 14, h - finalH - 14);

    ctx.strokeStyle = "rgba(10, 25, 50, 0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(rx, ry, boxW, finalH);
    ctx.setLineDash([]);

    // 递归画 6 阶黄金正方形细分
    let x = rx, y = ry, bw = boxW, bh = finalH;
    let sideIdx = 0; // 0: left, 1: top, 2: right, 3: bottom
    ctx.strokeStyle = "rgba(10, 25, 50, 0.22)";
    for (let step = 0; step < 6; step++) {
      if (sideIdx === 0) {
        const sq = bh;
        ctx.beginPath();
        ctx.moveTo(x + sq, y);
        ctx.lineTo(x + sq, y + bh);
        ctx.stroke();
        // 黄金弧参考线
        ctx.save();
        ctx.strokeStyle = "rgba(230, 98, 64, 0.42)";
        ctx.beginPath();
        ctx.arc(x + sq, y + sq, sq, Math.PI, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
        x += sq;
        bw -= sq;
      } else if (sideIdx === 1) {
        const sq = bw;
        ctx.beginPath();
        ctx.moveTo(x, y + sq);
        ctx.lineTo(x + bw, y + sq);
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = "rgba(230, 98, 64, 0.42)";
        ctx.beginPath();
        ctx.arc(x, y + sq, sq, Math.PI * 1.5, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        y += sq;
        bh -= sq;
      } else if (sideIdx === 2) {
        const sq = bh;
        ctx.beginPath();
        ctx.moveTo(x + bw - sq, y);
        ctx.lineTo(x + bw - sq, y + bh);
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = "rgba(230, 98, 64, 0.42)";
        ctx.beginPath();
        ctx.arc(x + bw - sq, y, sq, 0, Math.PI * 0.5);
        ctx.stroke();
        ctx.restore();
        bw -= sq;
      } else {
        const sq = bw;
        ctx.beginPath();
        ctx.moveTo(x, y + bh - sq);
        ctx.lineTo(x + bw, y + bh - sq);
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = "rgba(230, 98, 64, 0.42)";
        ctx.beginPath();
        ctx.arc(x + sq, y + bh - sq, sq, Math.PI * 0.5, Math.PI);
        ctx.stroke();
        ctx.restore();
        bh -= sq;
      }
      sideIdx = (sideIdx + 1) % 4;
      if (bw < 6 || bh < 6) break;
    }

    ctx.fillStyle = "rgba(10, 25, 50, 0.62)";
    ctx.font = '500 10.5px "IBM Plex Mono", sans-serif';
    ctx.fillText("1 : 1.618 GOLDEN SUBDIVISION", rx + 6, ry + 14);
    ctx.restore();
  }

  // 右下角 1:1 复刻原海报「黄金螺旋分格蓝图」小图（随实时参数联动，点击可切换全幅网格）
  function drawMiniBlueprint(geom, audit) {
    const compact = width < 440;
    const bw = compact ? 86 : 112;
    const bh = Math.round(bw / PHI);
    const pad = compact ? 10 : 14;
    const bx = width - bw - pad;
    const by = height - bh - pad - 14;
    blueprintRect = { x: bx - 4, y: by - 4, w: bw + 8, h: bh + 22 };

    ctx.save();
    ctx.fillStyle = state.showGoldenGrid ? "rgba(10, 25, 50, 0.08)" : "rgba(253, 246, 233, 0.88)";
    ctx.strokeStyle = hoverPart === "blueprint" || state.showGoldenGrid ? PALETTE.coral : "rgba(10, 25, 50, 0.45)";
    ctx.lineWidth = state.showGoldenGrid ? 1.5 : 1;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    // 黄金矩形细分线
    let x = bx, y = by, w = bw, h = bh;
    ctx.strokeStyle = "rgba(10, 25, 50, 0.35)";
    ctx.lineWidth = 0.8;
    const s1 = h;
    ctx.beginPath();
    ctx.moveTo(x + s1, y);
    ctx.lineTo(x + s1, y + h);
    const s2 = w - s1;
    ctx.moveTo(x + s1, y + s2);
    ctx.lineTo(x + w, y + s2);
    const s3 = h - s2;
    ctx.moveTo(x + w - s3, y + s2);
    ctx.lineTo(x + w - s3, y + h);
    ctx.stroke();

    // 在蓝图内部绘出用户当前真实的螺线微缩投影，立刻对比黄金分格与实际螺线的贴合度
    const cx = bx + bw * 0.68;
    const cy = by + bh * 0.62;
    const scale = Math.min(bw, bh) * 0.44;
    ctx.beginPath();
    const n = 56;
    const turns = clamp(state.turns, 0.5, 3.2);
    const thetaTotal = turns * Math.PI * 2;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const u = 1 - s;
      let frac = u;
      if (state.curveType !== "arch" && state.growth > 1.03) {
        const b = Math.log(state.growth) / (Math.PI / 2);
        const den = Math.exp(b * thetaTotal) - 1;
        frac = den > 1e-4 ? (Math.exp(b * thetaTotal * u) - 1) / den : u;
      }
      const r = 2 + scale * frac;
      const ang = Math.PI + state.dir * s * thetaTotal;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = audit.checks.rhythm.ok ? PALETTE.navy : PALETTE.coral;
    ctx.lineWidth = 1.35;
    ctx.stroke();

    // 底部小签
    ctx.fillStyle = state.showGoldenGrid ? PALETTE.coralInk : "rgba(10, 25, 50, 0.72)";
    ctx.font = '500 10px "IBM Plex Mono", "Noto Sans SC", sans-serif';
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(state.showGoldenGrid ? "黄金分格 · 开" : "点叠黄金分格", bx + bw, by + bh + 4);
    ctx.restore();
  }

  // 标本 A：1:1 原海报双带墨螺
  function drawPosterSpecimen(geom, visCount) {
    const { eye, pts, coralPts, orbitR, bead1, bead2, minR, maxR } = geom;
    const slicePts = pts.slice(0, visCount);
    const coralVis = Math.max(2, Math.floor((visCount / pts.length) * coralPts.length));
    const sliceCoral = coralPts.slice(0, coralVis);

    // 1. 暖米宣纸底色（静止时带柔和径向亮心；拖动期间用纯色底保证软件渲染满帧 60fps）
    if (drag.mode) {
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createRadialGradient(eye.x, eye.y, minR, eye.x, eye.y, maxR * 1.45);
      bgGrad.addColorStop(0, "#FFFBF2");
      bgGrad.addColorStop(0.55, PALETTE.paper);
      bgGrad.addColorStop(1, "#F6ECDA");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. 外围珊瑚虚线轨道 + 两颗海蓝小珠（原海报标志母题）
    ctx.save();
    ctx.strokeStyle = state.activeLayer === "guidance" ? PALETTE.coral : "rgba(230, 98, 64, 0.56)";
    ctx.lineWidth = state.activeLayer === "guidance" ? 2 : 1.15;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, orbitR, state.entryAngle - 0.55 * Math.PI, state.entryAngle + 1.08 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // 外圈双珠（第一颗可拖）
    const drawBead = (b, primary) => {
      if (primary && (hoverPart === "bead" || drag.mode === "bead" || state.activeLayer === "guidance")) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(230, 98, 64, 0.16)";
        ctx.fill();
        ctx.strokeStyle = PALETTE.coral;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, primary ? 5.6 : 4.2, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.navy;
      ctx.fill();
      if (primary) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.paper;
        ctx.fill();
      }
    };
    drawBead(bead1, true);
    drawBead(bead2, false);
    ctx.restore();

    // 3. 精细构造线（呼应原海报缠绕在双带间的极细深蓝构造线）
    ctx.save();
    ctx.strokeStyle = "rgba(10, 25, 50, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < slicePts.length; i++) {
      const p = slicePts[i];
      const ang = p.angle + 0.18 * state.dir;
      const r = p.r * 0.86;
      const x = eye.x + Math.cos(ang) * r;
      const y = eye.y + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 4. 深午夜海军蓝主螺带（免 clip 全屏填充，直接路径叠纸粒，软件渲染 60fps 且还原版画渐淡）
    if (slicePts.length >= 2) {
      const pStart = slicePts[0];
      const pEnd = slicePts[slicePts.length - 1];
      ctx.save();
      traceRibbonPolygon(ctx, slicePts, 1.0);
      const navyGrad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
      navyGrad.addColorStop(0, "rgba(10, 25, 50, 0.14)");
      navyGrad.addColorStop(0.18, "rgba(42, 56, 74, 0.72)");
      navyGrad.addColorStop(0.4, "#0C192D");
      navyGrad.addColorStop(0.8, "#0A1932");
      navyGrad.addColorStop(1, "#182D4D");
      ctx.fillStyle = navyGrad;
      ctx.fill();

      // 静止时在当前螺带路径上叠一层预烘焙宣纸颗粒，还原版画墨粒渐散（拖动中跳过纹理采样保 60fps）
      if (paperGrain && !drag.mode) {
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = paperGrain;
        ctx.fill();
      }
      ctx.restore();

      // 中段主脊微光强调（激活 rhythm 层时高亮）
      if (state.activeLayer === "rhythm" || state.activeLayer === "movement") {
        ctx.save();
        ctx.strokeStyle = PALETTE.coralBright;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < slicePts.length; i++) {
          if (i === 0) ctx.moveTo(slicePts[i].x, slicePts[i].y);
          else ctx.lineTo(slicePts[i].x, slicePts[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. 陶土珊瑚红对向内螺带（由右下暖桃柔和入画，渐浓收锋卷向焦核）
    if (sliceCoral.length >= 2) {
      const c0 = sliceCoral[0];
      const cEnd = sliceCoral[sliceCoral.length - 1];
      ctx.save();
      traceRibbonPolygon(ctx, sliceCoral, 0.96);
      const coralGrad = ctx.createLinearGradient(c0.x, c0.y, cEnd.x, cEnd.y);
      coralGrad.addColorStop(0, "rgba(245, 173, 146, 0.32)");
      coralGrad.addColorStop(0.26, "#EB694B");
      coralGrad.addColorStop(0.82, "#E66240");
      coralGrad.addColorStop(1, "#C94726");
      ctx.fillStyle = coralGrad;
      ctx.fill();
      if (inkGrain && !drag.mode) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = inkGrain;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 标本 B：浮世绘 · 巨浪归峰（几何化木刻版画风格，绝不画恐怖五官）
  function drawWaveSpecimen(geom, visCount) {
    const { eye, pts, coralPts, minR, maxR } = geom;
    const slicePts = pts.slice(0, visCount);
    const coralVis = Math.max(2, Math.floor((visCount / pts.length) * coralPts.length));
    const sliceCoral = coralPts.slice(0, coralVis);

    // 浮世绘暖黄和纸底天
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#FBF2DF");
    sky.addColorStop(0.62, "#F6E8CC");
    sky.addColorStop(1, "#EFE0C0");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // 远处水平海平线
    ctx.strokeStyle = "rgba(10, 25, 50, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, eye.y + maxR * 0.45);
    ctx.lineTo(width, eye.y + maxR * 0.45);
    ctx.stroke();

    // 普鲁士蓝巨浪主卷带
    if (slicePts.length >= 2) {
      ctx.save();
      traceRibbonPolygon(ctx, slicePts, 1.12);
      const wg = ctx.createLinearGradient(slicePts[0].x, slicePts[0].y, eye.x, eye.y);
      wg.addColorStop(0, "#29466E");
      wg.addColorStop(0.45, "#0E2649");
      wg.addColorStop(1, "#0A1932");
      ctx.fillStyle = wg;
      ctx.fill();

      // 浪脊白色浪花锯齿（沿外螺带内沿）
      ctx.fillStyle = "#FFFBF2";
      const step = Math.max(4, Math.floor(slicePts.length / 26));
      for (let i = 2; i < slicePts.length - 4; i += step) {
        const p = slicePts[i];
        const rFoam = Math.max(2.5, p.halfW * 0.56);
        const fx = p.x - p.nx * (p.halfW * 0.92);
        const fy = p.y - p.ny * (p.halfW * 0.92);
        ctx.beginPath();
        ctx.arc(fx, fy, rFoam, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 内卷暖沙与朱红晚霞带
    if (sliceCoral.length >= 2) {
      ctx.save();
      traceRibbonPolygon(ctx, sliceCoral, 0.72);
      ctx.fillStyle = "rgba(230, 98, 64, 0.78)";
      ctx.fill();
      ctx.restore();
    }

    // 远方海湾水波细线
    ctx.save();
    ctx.strokeStyle = "rgba(10, 25, 50, 0.22)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const y = eye.y + minR * 2.2 + k * 16;
      if (y > height - 24) break;
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.quadraticCurveTo(width * 0.35, y - 6, width * 0.7, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 标本 C：建筑 · 旋梯天井（俯视透视旋梯，每级踏步实读 model 几何点列）
  function drawStairSpecimen(geom, visCount) {
    const { eye, pts, coralPts, maxR } = geom;
    const slicePts = pts.slice(0, visCount);
    const coralVis = Math.max(2, Math.floor((visCount / pts.length) * coralPts.length));
    const sliceCoral = coralPts.slice(0, coralVis);

    // 暖石灰建筑天井背景
    const wall = ctx.createRadialGradient(eye.x, eye.y, 12, eye.x, eye.y, maxR * 1.45);
    wall.addColorStop(0, "#FBF5E9");
    wall.addColorStop(0.6, "#F2E6D2");
    wall.addColorStop(1, "#E5D5BA");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, width, height);

    // 按螺线采样踏步阶梯（外宽内窄，自然透视下潜）
    const stepStride = Math.max(2, Math.floor(pts.length / 44));
    ctx.save();
    for (let i = 0; i < slicePts.length - stepStride; i += stepStride) {
      const p0 = slicePts[i];
      const p1 = slicePts[Math.min(slicePts.length - 1, i + stepStride)];
      const w0 = p0.halfW * 1.15;
      const w1 = p1.halfW * 1.15;
      ctx.beginPath();
      ctx.moveTo(p0.x + p0.nx * w0, p0.y + p0.ny * w0);
      ctx.lineTo(p1.x + p1.nx * w1, p1.y + p1.ny * w1);
      ctx.lineTo(p1.x - p1.nx * w1, p1.y - p1.ny * w1);
      ctx.lineTo(p0.x - p0.nx * w0, p0.y - p0.ny * w0);
      ctx.closePath();
      const shade = i % (stepStride * 2) === 0 ? "#0D1E38" : "#223654";
      ctx.fillStyle = shade;
      ctx.fill();
      ctx.strokeStyle = "#F7EBD5";
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
    ctx.restore();

    // 陶红连续扶手带沿内缘旋下
    if (sliceCoral.length >= 2) {
      ctx.save();
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = Math.max(2.5, geom.minDim * 0.012);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < sliceCoral.length; i++) {
        if (i === 0) ctx.moveTo(sliceCoral[i].x, sliceCoral[i].y);
        else ctx.lineTo(sliceCoral[i].x, sliceCoral[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // 绘制螺眼靶标 + 可拖拽焦点核心（原海报珊瑚圆 / 巨浪远山赤日 / 旋梯底厅圆井）
  function drawEyeAndCore(geom, audit, t) {
    const { eye, core, minR } = geom;
    const offCore = !audit.checks.focus.ok && audit.checks.focus.code === "offcore";
    const highlightFocus = state.activeLayer === "focus";

    // 若焦核偏离螺眼，清晰画出空螺眼与红色脱轨虚线
    if (offCore || highlightFocus) {
      ctx.save();
      ctx.strokeStyle = offCore ? PALETTE.err : PALETTE.navy;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, Math.max(15, minR * 0.65), 0, Math.PI * 2);
      ctx.stroke();
      if (offCore) {
        ctx.beginPath();
        ctx.moveTo(core.x, core.y);
        ctx.lineTo(eye.x, eye.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (offCore) {
        drawTag(
          ctx,
          eye.x,
          eye.y + Math.max(24, minR * 0.92),
          "空螺眼 · 拖主体入眼",
          "rgba(10, 25, 50, 0.9)",
          "#FFFBF2"
        );
      }
      ctx.restore();
    }

    // 焦点核心外圈微呼吸提示（可拖拽感）
    const pulse = 1 + 0.06 * Math.sin(t * 2.6);
    if (hoverPart === "core" || drag.mode === "core" || offCore || highlightFocus) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * (1.35 * pulse), 0, Math.PI * 2);
      ctx.fillStyle = offCore ? "rgba(184, 41, 47, 0.14)" : "rgba(230, 98, 64, 0.16)";
      ctx.fill();
      ctx.strokeStyle = offCore ? PALETTE.err : PALETTE.coral;
      ctx.lineWidth = 1.4;
      ctx.setLineDash(offCore ? [3, 3] : []);
      ctx.stroke();
      ctx.restore();
    }

    // 主体图形随标本变化
    ctx.save();
    if (state.specimen === "wave") {
      // 珊瑚红日 + 远山雪峰剪影（呼应神奈川冲浪里核心构图）
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.coral;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(core.x - core.r * 1.25, core.y + core.r * 0.85);
      ctx.lineTo(core.x, core.y - core.r * 0.45);
      ctx.lineTo(core.x + core.r * 1.25, core.y + core.r * 0.85);
      ctx.closePath();
      ctx.fillStyle = PALETTE.navy;
      ctx.fill();
      // 山顶白雪
      ctx.beginPath();
      ctx.moveTo(core.x - core.r * 0.36, core.y + core.r * 0.02);
      ctx.lineTo(core.x, core.y - core.r * 0.45);
      ctx.lineTo(core.x + core.r * 0.36, core.y + core.r * 0.02);
      ctx.lineTo(core.x + core.r * 0.14, core.y - core.r * 0.08);
      ctx.lineTo(core.x, core.y + core.r * 0.04);
      ctx.lineTo(core.x - core.r * 0.14, core.y - core.r * 0.08);
      ctx.closePath();
      ctx.fillStyle = "#FFFBF2";
      ctx.fill();
    } else if (state.specimen === "stair") {
      // 建筑底厅圆井与陶砖中心纹
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFBF2";
      ctx.fill();
      ctx.strokeStyle = PALETTE.navy;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.coral;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFBF2";
      ctx.fill();
    } else {
      // 原海报：标志性实心珊瑚焦核
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 1.04, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.coral;
      ctx.fill();
      if (audit.score === 4) {
        ctx.beginPath();
        ctx.arc(core.x, core.y, core.r * 1.48, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(27, 107, 86, 0.42)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
    ctx.restore();

    if (offCore) {
      // 核心在画布上半区时把脱轨签放在核心下方，避开上方螺线诊断签，绝不撞字
      const tagY = core.y < eye.y ? core.y + core.r + 18 : core.y - core.r - 18;
      drawTag(
        ctx,
        clamp(core.x, 78, width - 78),
        clamp(tagY, 34, height - 34),
        `${SPECIMENS[state.specimen].coreName} · 脱轨 ${audit.geom.metrics.coreOffsetPct}%`,
        PALETTE.err,
        "#FFFBF2"
      );
    }
  }

  // 绘制激活的诊断层标注（用户点击四竖点或四圆徽时）
  function drawLayerAnnotations(geom, audit) {
    const { eye, pts, metrics } = geom;
    // 在 0/4 错态时给出简洁清晰的画内诊断签（避开左上脱轨核心，绝不互相遮压）
    if (audit.score < 4 && !gaze.active) {
      const avoidCoreX = geom.core.x < eye.x ? eye.x + geom.maxR * 0.34 : eye.x - geom.maxR * 0.34;
      const topY = clamp(eye.y - geom.maxR - 18, 40, height - 70);
      if (!audit.checks.movement.ok) {
        const tx = clamp(avoidCoreX, 112, width - 116);
        drawTag(
          ctx,
          tx,
          topY,
          audit.checks.movement.code === "overwound"
            ? `等距死缠 ${metrics.turns.toFixed(2)} 圈 · ←横拖舒展`
            : `仅 ${metrics.turns.toFixed(2)} 圈退弧 · →横拖盘卷`,
          "rgba(184, 41, 47, 0.92)",
          "#FFFBF2"
        );
      } else if (!audit.checks.rhythm.ok) {
        drawTag(
          ctx,
          clamp(avoidCoreX, 96, width - 96),
          topY,
          audit.checks.rhythm.badge,
          "rgba(184, 41, 47, 0.92)",
          "#FFFBF2"
        );
      } else if (!audit.checks.guidance.ok) {
        drawTag(
          ctx,
          clamp(geom.bead1.x, 90, width - 96),
          clamp(geom.bead1.y - 22, 40, height - 60),
          audit.checks.guidance.badge,
          "rgba(184, 41, 47, 0.92)",
          "#FFFBF2"
        );
      }
    }

    // 若用户点击了「层层深入 / 节奏」，在主螺线上标出 90° 径向步距刻度线
    if (state.activeLayer === "rhythm") {
      ctx.save();
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = 1.4;
      for (let q = 0; q < 4; q++) {
        const idx = Math.floor((q / 4) * (pts.length - 1));
        const p = pts[idx];
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.coral;
        ctx.fill();
      }
      drawTag(
        ctx,
        eye.x,
        clamp(eye.y - geom.maxR * 0.52, 38, height - 48),
        `90° 径向递缩实测 ${metrics.quarterRatio.toFixed(2)}×`,
        PALETTE.navy,
        "#FFFBF2"
      );
      ctx.restore();
    }
  }

  // 绘制按空格释放的「滴墨引流」视线光珠
  function drawGazeTracer(geom, audit) {
    if (!gaze.active) return;
    const pts = geom.pts;
    if (pts.length < 3) return;
    const p = clamp(gaze.progress, 0, 1);
    const outcome = audit.gazeOutcome;

    let gx = pts[0].x;
    let gy = pts[0].y;
    let label = "";

    // 画已走过的尾迹弧
    const maxS = outcome === "dizzy" ? 0.62 : outcome === "snag" ? 0.38 : outcome === "escape" ? 0.44 : 1.0;
    const curS = Math.min(p, maxS);
    const idxF = curS * (pts.length - 1);
    const i0 = Math.floor(idxF);
    const i1 = Math.min(pts.length - 1, i0 + 1);
    const frac = idxF - i0;
    gx = pts[i0].x + (pts[i1].x - pts[i0].x) * frac;
    gy = pts[i0].y + (pts[i1].y - pts[i0].y) * frac;

    ctx.save();
    ctx.strokeStyle = outcome === "lock" ? PALETTE.ok : PALETTE.coral;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    const trailStart = Math.max(0, i0 - 26);
    for (let i = trailStart; i <= i0; i++) {
      if (i === trailStart) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(gx, gy);
    ctx.stroke();

    // 若已到达异常分支，模拟真实的物理逃逸/卡顿/落空
    if (p > maxS) {
      const over = (p - maxS) / Math.max(0.1, 1 - maxS);
      if (outcome === "escape") {
        const pt = pts[i0];
        const dist = over * geom.minDim * 0.42;
        gx = pt.x + pt.tx * dist;
        gy = pt.y + pt.ty * dist;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(gx, gy);
        ctx.stroke();
        ctx.setLineDash([]);
        label = "沿切线滑出画外";
      } else if (outcome === "snag") {
        const jitter = Math.sin(over * 26) * 5 * (1 - over);
        gx += jitter;
        gy -= jitter;
        label = "折角卡顿 · 连续性断开";
      } else if (outcome === "dizzy") {
        const ang = over * Math.PI * 4;
        gx += Math.cos(ang) * 7 * (1 - over * 0.4);
        gy += Math.sin(ang) * 7 * (1 - over * 0.4);
        label = "绕圈疲惫 · 未达核心";
      }
    } else if (p >= 0.96) {
      if (outcome === "miss") {
        label = "落入空眼 · 错过主体";
      } else if (outcome === "lock") {
        label = "顺流归心 ✓";
      }
    }

    // 光珠本体
    ctx.beginPath();
    ctx.arc(gx, gy, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = outcome === "lock" ? PALETTE.ok : PALETTE.err;
    ctx.fill();
    ctx.strokeStyle = "#FFFBF2";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 落点涟漪
    if (gaze.progress > 0.92) {
      const rProg = clamp((gaze.progress - 0.92) / 0.35, 0, 1);
      ctx.beginPath();
      ctx.arc(gx, gy, 10 + rProg * 36, 0, Math.PI * 2);
      ctx.strokeStyle =
        outcome === "lock"
          ? `rgba(27, 107, 86, ${(1 - rProg) * 0.7})`
          : `rgba(184, 41, 47, ${(1 - rProg) * 0.7})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (label) {
      drawTag(
        ctx,
        clamp(gx, 86, width - 86),
        clamp(gy - 22, 34, height - 34),
        label,
        outcome === "lock" ? PALETTE.ok : PALETTE.err,
        "#FFFBF2"
      );
    }
    ctx.restore();
  }

  // 画布顶角轻量 HUD（只读单真源 audit，窄屏自动精简避免左右撞字）
  function drawCornerHud(audit) {
    const m = audit.geom.metrics;
    const compact = width < 460;
    ctx.save();
    ctx.font = compact
      ? '500 10.5px "IBM Plex Mono", "Noto Sans SC", sans-serif'
      : '500 11px "IBM Plex Mono", "Noto Sans SC", sans-serif';
    ctx.fillStyle = "rgba(10, 25, 50, 0.76)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const modeName = m.curveType === "log" ? "LOG" : m.curveType === "arch" ? "ARCH" : "KINK";
    const hud = compact
      ? `${modeName} · ${m.turns.toFixed(2)}圈 · k=${m.quarterRatio.toFixed(2)}×`
      : `${modeName} · ${m.turns.toFixed(2)} TURNS · k=${m.quarterRatio.toFixed(2)}× · ${m.dir > 0 ? "CW ↻" : "CCW ↺"}`;
    ctx.fillText(hud, 12, 11);

    // 右上简标
    const ok = audit.score === 4;
    ctx.textAlign = "right";
    ctx.fillStyle = ok ? PALETTE.ok : PALETTE.err;
    ctx.fillText(`${audit.score}/4 · ${audit.statusTag}`, width - 12, 11);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();
    if (still) {
      reveal = 1;
    } else if (reveal < 1) {
      reveal = Math.min(1, reveal + dt * 1.75);
      dirty = true;
    }

    if (gaze.active) {
      if (still) {
        gaze.progress = 0.98;
      } else {
        gaze.progress += dt * 0.72;
        if (gaze.progress >= 1.28) {
          gaze.active = false;
          gaze.progress = 0;
        }
      }
      dirty = true;
    }

    const audit = auditSpiral(state, width, height);
    lastAudit = audit;
    const geom = audit.geom;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const ease = 1 - Math.pow(1 - reveal, 3);
    const visCount = Math.max(2, Math.round(geom.pts.length * ease));

    if (state.specimen === "wave") drawWaveSpecimen(geom, visCount);
    else if (state.specimen === "stair") drawStairSpecimen(geom, visCount);
    else drawPosterSpecimen(geom, visCount);

    if (state.showGoldenGrid) drawGoldenOverlay(geom);
    drawEyeAndCore(geom, audit, t);
    drawLayerAnnotations(geom, audit);
    drawGazeTracer(geom, audit);
    drawMiniBlueprint(geom, audit);
    drawCornerHud(audit);

    ctx.restore();
    dirty = false;
  }

  let uiDirty = false;
  let lastUiSync = 0;

  const ctrl = loop(canvas, (t, dt, opts) => {
    // 静止时不浪费多余重绘，拖动、动画、脉冲或 hover 时按每 rAF 帧合并重绘一次
    if (dirty || reveal < 1 || gaze.active || opts.still) {
      render(t, dt, opts);
      if (uiDirty && lastAudit) {
        const now = performance.now();
        // 拖动期间把繁重的 DOM 文本同步节流到 ~18Hz，画布本身保持满 60fps 丝滑
        if (!drag.mode || now - lastUiSync > 55) {
          uiDirty = false;
          lastUiSync = now;
          onChange(lastAudit);
        }
      }
    }
  });

  // 指针 / 触摸坐标换算
  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function startDrag(clientX, clientY, pointerId, isTouch) {
    const { x, y } = localPos(clientX, clientY);
    const hit = hitTest(x, y);
    if (hit === "blueprint") {
      state.showGoldenGrid = !state.showGoldenGrid;
      dirty = true;
      onChange(auditSpiral(state, width, height));
      ctrl.draw();
      return false;
    }
    drag.mode = hit || "wind";
    drag.pointerId = pointerId;
    drag.startX = x;
    drag.startY = y;
    drag.startTurns = state.turns;
    drag.startGrowth = state.growth;
    drag.startSpan = state.entrySpan;
    drag.startAngle = state.entryAngle;
    drag.isTouch = isTouch;
    drag.lockedAxis = hit === "core" || hit === "bead" ? "both" : null;
    canvas.classList.add("is-dragging");
    return true;
  }

  function moveDrag(clientX, clientY) {
    const { x, y } = localPos(clientX, clientY);
    if (!drag.mode) {
      const nextHover = hitTest(x, y);
      if (nextHover !== hoverPart) {
        hoverPart = nextHover;
        canvas.style.cursor =
          hoverPart === "blueprint" ? "pointer" : hoverPart === "core" || hoverPart === "bead" ? "grab" : "ew-resize";
        dirty = true;
        ctrl.draw();
      }
      return false;
    }

    const dx = x - drag.startX;
    const dy = y - drag.startY;

    // 触屏非把手区：竖滑让浏览器滚屏，横滑盘卷螺线
    if (drag.isTouch && drag.mode === "wind" && !drag.lockedAxis) {
      if (Math.hypot(dx, dy) < 6) return false;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        drag.mode = null;
        canvas.classList.remove("is-dragging");
        return false;
      }
      drag.lockedAxis = "x";
    }

    if (drag.mode === "core") {
      let nu = clamp(x / width, 0.08, 0.92);
      let nv = clamp(y / height, 0.08, 0.92);
      // 靠近螺眼轻吸附（5.5% 半径内）
      const distEye = Math.hypot((nu - state.eye.u) * width, (nv - state.eye.v) * height);
      if (distEye < Math.min(width, height) * 0.055) {
        nu = state.eye.u;
        nv = state.eye.v;
      }
      state.core.u = nu;
      state.core.v = nv;
    } else if (drag.mode === "bead") {
      const eyeX = state.eye.u * width;
      const eyeY = state.eye.v * height;
      state.entryAngle = Math.atan2(y - eyeY, x - eyeX);
      const rDist = Math.hypot(x - eyeX, y - eyeY);
      const minDim = Math.min(width, height);
      state.entrySpan = clamp(rDist / (minDim * 0.465 * 1.11), 0.48, 0.95);
    } else if (drag.mode === "wind") {
      // 横拖直接增减盘旋圈数：向右卷紧，向左舒展（开场 3.10 圈向左拖即舒展成经典 1.68 圈！）
      const deltaTurns = (dx / Math.max(180, width * 0.48)) * 1.85;
      state.turns = +clamp(drag.startTurns + deltaTurns, 0.45, 3.4).toFixed(2);
      // 桌面端纵拖同步调对数扩张倍比 k（向上拉大扩张倍比，向下压扁）
      if (!drag.isTouch && Math.abs(dy) > 10) {
        const deltaK = (-dy / Math.max(160, height * 0.5)) * 1.1;
        state.growth = +clamp(drag.startGrowth + deltaK, 1.02, 2.48).toFixed(2);
        if (state.curveType === "arch" && state.growth > 1.22) {
          state.curveType = "log";
        }
      }
    }

    dirty = true;
    uiDirty = true;
    return true;
  }

  function endDrag() {
    if (!drag.mode) return;
    drag.mode = null;
    drag.pointerId = null;
    drag.lockedAxis = null;
    canvas.classList.remove("is-dragging");
    dirty = true;
    uiDirty = false;
    onChange(auditSpiral(state, width, height));
    ctrl.draw();
  }

  // 鼠标走 Pointer Events，触屏走下方原生 Touch Events（避免同一次触屏触发双倍计算）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const started = startDrag(e.clientX, e.clientY, e.pointerId, false);
    if (started && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    moveDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointercancel", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
  });
  canvas.addEventListener("pointerleave", () => {
    if (!drag.mode && hoverPart) {
      hoverPart = null;
      dirty = true;
      ctrl.draw();
    }
  });

  // 显式兼容 CDP Input.dispatchTouchEvent（tools/perf.mjs 发原生 touch 事件）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t0 = e.touches[0];
      startDrag(t0.clientX, t0.clientY, t0.identifier, true);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!drag.mode || e.touches.length !== 1) return;
      const t0 = e.touches[0];
      const consumed = moveDrag(t0.clientX, t0.clientY);
      if (consumed && e.cancelable) e.preventDefault();
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", endDrag, { passive: true });
  canvas.addEventListener("touchcancel", endDrag, { passive: true });

  // 响应尺寸变化
  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  // 初始化即同步一次单真源数据
  resize();
  const initialAudit = auditSpiral(state, width, height);
  lastAudit = initialAudit;
  ctrl.draw();

  return {
    draw: () => {
      dirty = true;
      ctrl.draw();
    },
    triggerGaze,
    markDirty,
    getAudit: () => auditSpiral(state, width, height),
  };
}
