// 090 动态构图 · 2D Canvas 斜势弹道编排台渲染器
// 严格单真源：直接消费 model.js 的 layout 与 evalResult，不另算常量；零 shadowBlur，稳跑 60fps。

import { pixelRatio } from "../../lib/stage.js";
import { clamp, evaluate, SCENES } from "./model.js";

const COL = {
  paper: "#FCF6E6",
  paperGrid: "rgba(0, 55, 59, 0.085)",
  paperGridStrong: "rgba(0, 55, 59, 0.16)",
  orange: "#FB5700",
  orangeBright: "#FF6F1F",
  orangeDeep: "#B83B00",
  teal: "#00373B",
  tealMid: "#005E63",
  tealDark: "#002427",
  ink: "#0A2628",
  danger: "#C4251C",
  dangerSoft: "rgba(196, 37, 28, 0.14)",
  ok: "#0C6E58",
};

// 确定性半调网点种子表（零每帧随机数抖动）
const HALFTONE_SEEDS = Array.from({ length: 46 }, (_, i) => {
  const row = i % 5;
  const col = Math.floor(i / 5);
  const jitterX = Math.sin(i * 12.9898) * 0.014;
  const jitterY = Math.cos(i * 78.233) * 0.012;
  return {
    s: -0.92 + col * 0.085 + jitterX,
    off: (row - 2) * 0.052 + jitterY,
    size: 0.0055 + (4 - row) * 0.0014 + (i % 3) * 0.001,
    tone: i % 3 === 0 ? "teal" : "orange",
  };
});

export function createHeroCanvas(canvas, getState, onMutate) {
  const ctx = canvas.getContext("2d");
  let cssW = 800;
  let cssH = 500;
  let dpr = 1;

  // 平滑视觉插值（减少动态效果 still 时一步到位）
  const anim = {
    angle: getState().angle,
    contrast: getState().contrast,
    rhythm: getState().rhythm,
    intro: 0,
    pulseActive: false,
    pulseT: 0,
    pulseOutcome: "pass", // pass | stall | collide | cram
    hitFlash: 0,
  };

  let lastEval = evaluate(getState(), cssW, cssH);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(240, Math.round(rect.width));
    cssH = Math.max(200, Math.round(rect.height));
    dpr = pixelRatio(cssW < 460 ? 1.5 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function triggerPulse() {
    const ev = evaluate(getState(), cssW, cssH);
    anim.pulseActive = true;
    anim.pulseT = 0;
    if (ev.metrics.absAngle < 14) anim.pulseOutcome = "stall";
    else if (ev.metrics.conflictCount > 0) anim.pulseOutcome = "collide";
    else if (ev.code === "CORNER_CRAM" || ev.code === "OVER_BLOAT") anim.pulseOutcome = "cram";
    else anim.pulseOutcome = "pass";
  }

  // 绘制斜向闪电（对应原海报标志性深青锯齿闪电）
  function drawLightning(x, y, angle, scale, fill, isConflict, highlighted) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle);
    // 沿 +X 方向刺出的锯齿闪电
    ctx.beginPath();
    ctx.moveTo(-scale * 0.92, -scale * 0.14);
    ctx.lineTo(scale * 0.08, -scale * 0.34);
    ctx.lineTo(-scale * 0.06, -scale * 0.04);
    ctx.lineTo(scale * 0.96, -scale * 0.08);
    ctx.lineTo(-scale * 0.04, scale * 0.36);
    ctx.lineTo(scale * 0.1, scale * 0.05);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // 速度白切线
    ctx.strokeStyle = COL.paper;
    ctx.lineWidth = Math.max(1.2, scale * 0.032);
    ctx.beginPath();
    ctx.moveTo(-scale * 0.42, -scale * 0.06);
    ctx.lineTo(scale * 0.32, -scale * 0.11);
    ctx.stroke();

    if (isConflict || highlighted) {
      ctx.strokeStyle = isConflict ? COL.danger : COL.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(-scale * 1.0, -scale * 0.44, scale * 2.04, scale * 0.88);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 绘制辅助尖镖（可点击翻顺/翻逆）
  function drawDart(x, y, angle, scale, fill, isConflict, highlighted) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle);
    ctx.beginPath();
    ctx.moveTo(scale * 0.92, 0);
    ctx.lineTo(-scale * 0.72, -scale * 0.42);
    ctx.lineTo(-scale * 0.38, 0);
    ctx.lineTo(-scale * 0.72, scale * 0.42);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    if (isConflict || highlighted) {
      ctx.strokeStyle = isConflict ? COL.danger : COL.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-scale * 0.84, -scale * 0.52, scale * 1.88, scale * 1.04);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 绘制 090 标志性亮橙主冲锋箭
  function drawMainArrow(tail, head, angle, minDim, speedCue, highlightDir) {
    const len = Math.hypot(head.x - tail.x, head.y - tail.y);
    const shaftW = minDim * 0.095;
    const headLen = Math.min(len * 0.38, minDim * 0.24);
    const headW = minDim * 0.21;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(-angle);

    // 箭身 + 尖头
    ctx.beginPath();
    ctx.moveTo(0, -shaftW * 0.5);
    ctx.lineTo(len - headLen, -shaftW * 0.42);
    ctx.lineTo(len - headLen, -headW * 0.5);
    ctx.lineTo(len, 0);
    ctx.lineTo(len - headLen, headW * 0.5);
    ctx.lineTo(len - headLen, shaftW * 0.42);
    ctx.lineTo(0, shaftW * 0.5);
    ctx.closePath();
    ctx.fillStyle = COL.orange;
    ctx.fill();

    // 原海报风格的白色斜切缝（把箭身与箭头拉出呼吸缝和速度刀感）
    ctx.strokeStyle = COL.paper;
    ctx.lineWidth = Math.max(2, minDim * 0.0085);
    ctx.beginPath();
    ctx.moveTo(len - headLen - minDim * 0.012, -headW * 0.55);
    ctx.lineTo(len - headLen - minDim * 0.012, headW * 0.55);
    ctx.stroke();

    if (speedCue) {
      ctx.strokeStyle = COL.paper;
      ctx.lineWidth = Math.max(1.3, minDim * 0.005);
      ctx.beginPath();
      ctx.moveTo(len * 0.1, -shaftW * 0.16);
      ctx.lineTo(len * 0.72, -shaftW * 0.16);
      ctx.moveTo(len * 0.22, shaftW * 0.18);
      ctx.lineTo(len * 0.62, shaftW * 0.18);
      ctx.stroke();
    }

    if (highlightDir) {
      ctx.strokeStyle = COL.teal;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 绘制纯剪影冲刺跑者（绝不画五官，严格遵守 BRIEF 规矩）
  function drawSprinterSilhouette(x, y, angle, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle * 0.55);
    ctx.fillStyle = COL.teal;

    // 简洁几何现代主义前倾剪影：头圆（纯黑青剪影无五官）、前倾躯干、前后摆臂、迈腿
    const s = scale;
    // 头部纯圆剪影
    ctx.beginPath();
    ctx.arc(s * 0.34, -s * 0.58, s * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // 躯干与动态肢体多边形
    ctx.beginPath();
    ctx.moveTo(s * 0.26, -s * 0.4);
    ctx.lineTo(s * 0.42, -s * 0.26);
    ctx.lineTo(s * 0.04, s * 0.16);
    ctx.lineTo(-s * 0.16, s * 0.08);
    ctx.closePath();
    ctx.fill();

    // 前冲臂 + 后摆臂
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = COL.teal;
    ctx.lineWidth = s * 0.115;
    ctx.beginPath();
    ctx.moveTo(s * 0.24, -s * 0.28);
    ctx.lineTo(s * 0.56, -s * 0.12);
    ctx.lineTo(s * 0.74, -s * 0.32);
    ctx.moveTo(s * 0.14, -s * 0.22);
    ctx.lineTo(-s * 0.24, -s * 0.26);
    ctx.lineTo(-s * 0.46, -s * 0.06);
    ctx.stroke();

    // 前蹬腿 + 后蹬腿
    ctx.lineWidth = s * 0.14;
    ctx.beginPath();
    ctx.moveTo(s * 0.02, s * 0.1);
    ctx.lineTo(s * 0.42, s * 0.26);
    ctx.lineTo(s * 0.28, s * 0.68);
    ctx.moveTo(-s * 0.08, s * 0.08);
    ctx.lineTo(-s * 0.44, s * 0.38);
    ctx.lineTo(-s * 0.72, s * 0.26);
    ctx.stroke();

    // 亮橙运动流带
    ctx.strokeStyle = COL.orange;
    ctx.lineWidth = Math.max(2, s * 0.055);
    ctx.beginPath();
    ctx.moveTo(-s * 0.95, s * 0.18);
    ctx.lineTo(-s * 0.38, -s * 0.08);
    ctx.moveTo(-s * 0.82, -s * 0.18);
    ctx.lineTo(-s * 0.28, -s * 0.36);
    ctx.stroke();

    ctx.restore();
  }

  // 绘制入口 S 曲波（原海报左下亮橙动感曲线）
  function drawWaveRibbon(x, y, angle, minDim) {
    const s = minDim * 0.11;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle);
    ctx.strokeStyle = COL.orange;
    ctx.lineWidth = Math.max(4, minDim * 0.022);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 1.15, s * 0.32);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.55, -s * 0.1, s * 0.55, s * 0.52, -s * 0.26);
    ctx.quadraticCurveTo(s * 0.85, -s * 0.56, s * 1.15, -s * 0.12);
    ctx.stroke();
    ctx.restore();
  }

  // 画布内清晰徽标（用于标示逆冲可点元素或角度读数，确保 ≥11px 且高对比）
  function drawPill(x, y, text, bg, fg, align = "center") {
    ctx.save();
    const fontSize = cssW < 420 ? 11 : 12;
    ctx.font = `700 ${fontSize}px "Noto Sans SC", "Space Grotesk", sans-serif`;
    const padX = 8;
    const h = fontSize + 10;
    const w = ctx.measureText(text).width + padX * 2;
    let rx = align === "left" ? x : align === "right" ? x - w : x - w / 2;
    let ry = y - h / 2;
    rx = clamp(rx, 8, cssW - w - 8);
    ry = clamp(ry, 8, cssH - h - 8);
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rx + w / 2, ry + h / 2 + 0.5);
    ctx.restore();
  }

  function render(t, dt, { still = false } = {}) {
    const state = getState();
    // 入场缓动（still 为 true 时直接到达最终开场错态，绝不空白）
    if (still) {
      anim.intro = 1;
      anim.angle = state.angle;
      anim.contrast = state.contrast;
      anim.rhythm = state.rhythm;
    } else {
      anim.intro = Math.min(1, anim.intro + (dt || 0.016) * 2.6);
      const ease = 1 - Math.exp(-(dt || 0.016) * 14);
      anim.angle += (state.angle - anim.angle) * ease;
      anim.contrast += (state.contrast - anim.contrast) * ease;
      anim.rhythm += (state.rhythm - anim.rhythm) * ease;
      if (anim.hitFlash > 0) anim.hitFlash = Math.max(0, anim.hitFlash - (dt || 0.016) * 3.5);
      if (anim.pulseActive) {
        anim.pulseT += (dt || 0.016) * 1.15;
        if (anim.pulseT >= 1.35) {
          anim.pulseActive = false;
          anim.pulseT = 0;
        }
      }
    }

    const visualState = {
      ...state,
      angle: anim.angle,
      contrast: anim.contrast,
      rhythm: anim.rhythm,
    };
    const ev = evaluate(visualState, cssW, cssH);
    lastEval = ev;
    const L = ev.layout;
    const m = ev.metrics;
    const hi = state.highlightProbe;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 暖亮米纸底色（逐像素同 090 原海报 #FCF6E6）
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 2. 静态正交基准网格：当轴线平躺时显得格外牢笼，掰向斜势后渐渐淡隐
    const staticOpacity = clamp(1 - m.absAngle / 42, 0.22, 0.9);
    ctx.strokeStyle = `rgba(0, 55, 59, ${(0.08 * staticOpacity).toFixed(3)})`;
    ctx.lineWidth = 1;
    const step = Math.round(L.minDim / 8);
    ctx.beginPath();
    for (let x = step; x < cssW; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, cssH);
    }
    for (let y = step; y < cssH; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(cssW, y + 0.5);
    }
    ctx.stroke();

    // 水平基准虚线（用来直观对照「你已经把画面从 0° 水平重力里挣脱了多少度」）
    ctx.save();
    ctx.strokeStyle = m.absAngle < 14 ? "rgba(196, 37, 28, 0.45)" : "rgba(0, 55, 59, 0.22)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(16, L.cy);
    ctx.lineTo(cssW - 16, L.cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 3. 右下角标志性深石油青微斜切角标（呼应原海报的构图切角基因）
    ctx.save();
    ctx.fillStyle = "rgba(0, 55, 59, 0.06)";
    ctx.beginPath();
    ctx.moveTo(cssW * 0.64, cssH);
    ctx.lineTo(cssW, cssH * 0.72);
    ctx.lineTo(cssW, cssH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. 场景背景层（音乐节声波带 / 冲刺跑道斜条 / 原海报对角辅助轨道）
    const pStart = L.along(-1.12, 0);
    const pEnd = L.along(1.12, 0);

    if (state.scene === "festival") {
      // 音乐节：斜切声波节奏竖柱，间距由实测步距驱动
      ctx.save();
      ctx.translate(L.cx, L.cy);
      ctx.rotate(-L.rad);
      const bars = 15;
      for (let i = 0; i < bars; i++) {
        const u = i / (bars - 1);
        const k = clamp(visualState.rhythm / 100, 0, 1);
        const warped = 1 - Math.pow(1 - u, 1 + k * 2.1);
        const bx = (-0.88 + warped * 1.76) * L.halfSpan;
        const amp = (0.12 + 0.24 * Math.abs(Math.sin(i * 1.1 + 0.5))) * L.minDim * (0.65 + u * 0.65);
        ctx.fillStyle = i % 3 === 0 ? "rgba(251, 87, 0, 0.14)" : "rgba(0, 55, 59, 0.10)";
        ctx.fillRect(bx - 3.5, -amp * 0.5, 7, amp);
      }
      ctx.restore();
    } else if (state.scene === "sprint") {
      // 运动赛事：斜向冲刺跑道标线 + 场景斜体大字水印
      ctx.save();
      ctx.translate(L.cx, L.cy);
      ctx.rotate(-L.rad);
      ctx.strokeStyle = "rgba(0, 55, 59, 0.14)";
      ctx.lineWidth = 1.5;
      for (const lane of [-0.22, -0.11, 0.11, 0.22]) {
        ctx.beginPath();
        ctx.moveTo(-L.halfSpan * 1.1, lane * L.minDim);
        ctx.lineTo(L.halfSpan * 1.1, lane * L.minDim);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0, 55, 59, 0.08)";
      ctx.font = `400 ${Math.round(L.minDim * 0.22)}px "Anton", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SPRINT 090", 0, -L.minDim * 0.26);
      ctx.restore();
    }

    // 5. 原海报半调喷点尾迹 + 速度切线（仅在 speedCue 开启时显示）
    if (visualState.speedCue) {
      ctx.save();
      for (const d of HALFTONE_SEEDS) {
        const pt = L.along(d.s, d.off + 0.06);
        const r = Math.max(1.4, d.size * L.minDim);
        ctx.fillStyle = d.tone === "teal" ? "rgba(0, 55, 59, 0.68)" : "rgba(251, 87, 0, 0.72)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // 末端上方的深青+亮橙冲锋尾翼速度尖条（对应 090 原海报右上角斜锋）
      const tipA = L.along(0.68, -0.14);
      const tipB = L.along(1.14, -0.02);
      const tipC = L.along(0.84, -0.01);
      ctx.fillStyle = COL.teal;
      ctx.beginPath();
      ctx.moveTo(tipA.x, tipA.y);
      ctx.lineTo(tipB.x, tipB.y);
      ctx.lineTo(tipC.x, tipC.y);
      ctx.closePath();
      ctx.fill();

      // 细速度光束线
      ctx.strokeStyle = hi === "speed" ? COL.orange : "rgba(0, 55, 59, 0.42)";
      ctx.lineWidth = hi === "speed" ? 2.4 : 1.3;
      for (const off of [-0.21, -0.02, 0.14]) {
        const a = L.along(-1.05, off);
        const b = L.along(1.06, off * 0.65);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. 主构图斜轴虚线轨道 + 角度扇形弧（直观展示倾角读数）
    ctx.save();
    ctx.strokeStyle =
      hi === "direction"
        ? COL.orange
        : m.absAngle < 14 || m.absAngle > 68
          ? COL.danger
          : "rgba(0, 55, 59, 0.56)";
    ctx.lineWidth = hi === "direction" ? 2.5 : 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 角度扇弧（从水平向右扫至当前轨迹角）
    const arcR = Math.min(72, L.minDim * 0.18);
    if (Math.abs(L.rad) > 0.03) {
      ctx.fillStyle =
        m.absAngle < 14 || m.absAngle > 68 ? "rgba(196, 37, 28, 0.12)" : "rgba(251, 87, 0, 0.12)";
      ctx.beginPath();
      ctx.moveTo(L.cx, L.cy);
      ctx.arc(L.cx, L.cy, arcR, 0, -L.rad, L.rad > 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = m.absAngle < 14 || m.absAngle > 68 ? COL.danger : COL.orangeDeep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, arcR, 0, -L.rad, L.rad > 0);
      ctx.stroke();
    }
    ctx.restore();

    // 7. 入口 S 动感波浪 + 主橙色冲锋箭
    drawWaveRibbon(L.waveAnchor.x, L.waveAnchor.y, L.rad, L.minDim);
    drawMainArrow(L.arrowTail, L.arrowHead, L.rad, L.minDim, visualState.speedCue, hi === "direction");

    // 8. 步距节奏刻度线（当点击「动感节奏」探针或出现等拍/挤角错态时清晰显形）
    if (hi === "rhythm" || ev.code === "UNIFORM_BEAT" || ev.code === "CORNER_CRAM") {
      ctx.save();
      for (let i = 0; i < L.orbs.length - 1; i++) {
        const a = L.orbs[i];
        const b = L.orbs[i + 1];
        ctx.strokeStyle = ev.code === "CORNER_CRAM" ? COL.danger : COL.teal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        const mx = (a.x + b.x) * 0.5 + L.nx * 14;
        const my = (a.y + b.y) * 0.5 + L.ny * 14;
        const distPct = Math.round((Math.hypot(b.x - a.x, b.y - a.y) / L.minDim) * 100);
        drawPill(mx, my, `距 ${distPct}`, "rgba(0, 55, 59, 0.9)", COL.paper);
      }
      ctx.restore();
    }

    // 9. 核心对比圆球（由单一真源半径绘制，正圆绝不变形）
    for (const o of L.orbs) {
      ctx.save();
      ctx.fillStyle = o.tone === "teal" ? COL.teal : COL.orange;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();

      // 原海报切穿圆球的白色速度细杠
      if (visualState.speedCue) {
        ctx.strokeStyle = COL.paper;
        ctx.lineWidth = Math.max(1.4, o.r * 0.055);
        ctx.beginPath();
        ctx.moveTo(o.x - L.ux * o.r * 1.05, o.y - L.uy * o.r * 1.05);
        ctx.lineTo(o.x + L.ux * o.r * 1.05, o.y + L.uy * o.r * 1.05);
        ctx.stroke();
      }

      // 主焦点光环或窒息警告圈
      if (o.isHero) {
        if (ev.code === "OVER_BLOAT") {
          ctx.strokeStyle = COL.danger;
          ctx.lineWidth = 2.6;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (hi === "tension" || hi === "energy" || ev.isPass) {
          ctx.strokeStyle = hi === "energy" ? COL.teal : "rgba(251, 87, 0, 0.36)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r + 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 紧咬主橙球左下沿的卫星深青圆（090 原海报标志性「大小撞色咬合」张力细节）
    ctx.save();
    ctx.fillStyle = COL.teal;
    ctx.beginPath();
    ctx.arc(L.satelliteOrb.x, L.satelliteOrb.y, L.satelliteOrb.r, 0, Math.PI * 2);
    ctx.fill();
    if (visualState.speedCue) {
      ctx.strokeStyle = COL.paper;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L.satelliteOrb.x - L.ux * L.satelliteOrb.r, L.satelliteOrb.y - L.uy * L.satelliteOrb.r);
      ctx.lineTo(L.satelliteOrb.x + L.ux * L.satelliteOrb.r, L.satelliteOrb.y + L.uy * L.satelliteOrb.r);
      ctx.stroke();
    }
    ctx.restore();

    // 冲刺海报模式：在中段叠加纯剪影奔跑者
    if (state.scene === "sprint") {
      const runnerPt = L.along(-0.18, 0.08);
      drawSprinterSilhouette(runnerPt.x, runnerPt.y, L.rad, L.minDim * 0.2);
    }

    // 10. 两个可点击的「逆冲/顺势」演员：深青闪电 + 尖镖
    const boltScale = L.minDim * 0.145;
    drawLightning(
      L.bolt.x,
      L.bolt.y,
      L.bolt.angle,
      boltScale,
      L.bolt.conflict ? COL.danger : COL.tealMid,
      L.bolt.conflict,
      hi === "direction"
    );

    const dartScale = L.minDim * 0.075;
    drawDart(
      L.dart.x,
      L.dart.y,
      L.dart.angle,
      dartScale,
      L.dart.conflict ? COL.danger : COL.orangeDeep,
      L.dart.conflict,
      hi === "direction"
    );

    // 标红逆冲交互提示签（直点即扳顺）
    if (L.bolt.conflict) {
      drawPill(L.bolt.x, L.bolt.y + boltScale * 0.62, "× 逆冲闪电 · 点扳顺", COL.danger, "#FFFFFF");
    }
    if (L.dart.conflict) {
      drawPill(L.dart.x, L.dart.y - dartScale * 0.92, "× 反向尖镖 · 点扳顺", COL.danger, "#FFFFFF");
    }

    // 11. Space 脉冲放流验真动画（真实按构图状态表现：顺畅爆发 / 半路停滞 / 撞击弹散 / 堵角折返）
    if (anim.pulseActive && !still) {
      const p = anim.pulseT;
      ctx.save();
      if (anim.pulseOutcome === "pass") {
        const sPos = -0.92 + Math.min(1, p * 0.95) * 1.88;
        const pt = L.along(sPos, 0);
        // 尾流光带
        const tailS = Math.max(-0.95, sPos - 0.36);
        const tailPt = L.along(tailS, 0);
        ctx.strokeStyle = COL.orangeBright;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailPt.x, tailPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();

        ctx.fillStyle = COL.tealDark;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.paper;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // 抵达主焦点时炸开能量扩散环
        if (p > 0.82) {
          const ringP = (p - 0.82) / 0.53;
          const hero = L.orbs[3];
          ctx.strokeStyle = `rgba(251, 87, 0, ${clamp(1 - ringP, 0, 1).toFixed(2)})`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(hero.x, hero.y, hero.r + ringP * L.minDim * 0.22, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (anim.pulseOutcome === "collide") {
        // 冲到中段撞上逆冲闪电并爆出红叉回弹
        const hitS = 0.08;
        const curS = p < 0.5 ? -0.9 + (p / 0.5) * (hitS + 0.9) : hitS - ((p - 0.5) / 0.85) * 0.38;
        const pt = L.along(curS, 0);
        ctx.fillStyle = COL.danger;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fill();
        if (p >= 0.45) {
          const blast = L.along(hitS, 0);
          const sp = (p - 0.45) * 46;
          ctx.strokeStyle = COL.danger;
          ctx.lineWidth = 2.5;
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3 + 0.3;
            ctx.beginPath();
            ctx.moveTo(blast.x + Math.cos(a) * 6, blast.y + Math.sin(a) * 6);
            ctx.lineTo(blast.x + Math.cos(a) * (10 + sp), blast.y + Math.sin(a) * (10 + sp));
            ctx.stroke();
          }
          drawPill(blast.x, blast.y - 26, "能量对冲受阻！", COL.danger, "#FFFFFF");
        }
      } else {
        // 平躺停滞或挤角卡死
        const stallS = -0.82 + Math.min(0.68, p * 0.55);
        const pt = L.along(stallS, 0);
        ctx.fillStyle = COL.danger;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fill();
        drawPill(
          pt.x,
          pt.y - 24,
          anim.pulseOutcome === "stall" ? "0° 无斜势 · 脉冲停滞" : "通道拥堵 · 流动受阻",
          COL.danger,
          "#FFFFFF"
        );
      }
      ctx.restore();
    }

    // 12. 顶角实测数值带（全部来自同一单真源 layout.metrics！）
    const angleTxt = m.angle > 0 ? `+${m.angle}°` : `${m.angle}°`;
    const topHud = `AXIS ${angleTxt} · SCALE ${m.scaleRatio}× · BEAT ${m.gapRatio}×`;
    drawPill(12, 20, topHud, "rgba(0, 46, 47, 0.92)", COL.paper, "left");

    const statusBg = ev.isPass ? COL.ok : COL.danger;
    drawPill(cssW - 12, 20, ev.badge, statusBg, "#FFFFFF", "right");

    // 底部极简场景标（窄屏且有底部提示胶囊时自动避让，绝不重叠）
    const sceneTag = SCENES[state.scene]?.titleTag || "DYNAMIC 090";
    ctx.save();
    if (!(cssW < 450 && ev.code === "STATIC_FLAT")) {
      ctx.fillStyle = "rgba(0, 46, 47, 0.62)";
      ctx.font = `600 11px "Space Grotesk", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(sceneTag, 14, cssH - 10);
    }

    // 拖拽提示（仅当还处在 0° 僵死态时轻轻给一个指向斜上的引导）
    if (ev.code === "STATIC_FLAT") {
      drawPill(L.cx, cssH - 22, "→ 向右横拖画布，打破 0° 水平僵局", COL.teal, COL.paper, "center");
    }
    ctx.restore();

    ctx.restore();
  }

  // ---------- 指针与触屏交互（严格保护页面竖向滚动！） ----------
  let ptrId = null;
  let startX = 0;
  let startY = 0;
  let startAngle = 0;
  let moved = false;
  let mode = null; // null | "drag-angle"

  const toLocal = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  function handleTap(localX, localY) {
    const L = lastEval.layout;
    // 1. 命中逆冲/顺势闪电
    if (Math.hypot(localX - L.bolt.x, localY - L.bolt.y) <= L.bolt.hitR) {
      const s = getState();
      onMutate({ conflicts: { ...s.conflicts, bolt: !s.conflicts.bolt } }, "bolt-toggle");
      anim.hitFlash = 1;
      return true;
    }
    // 2. 命中逆冲/顺势尖镖
    if (Math.hypot(localX - L.dart.x, localY - L.dart.y) <= L.dart.hitR) {
      const s = getState();
      onMutate({ conflicts: { ...s.conflicts, dart: !s.conflicts.dart } }, "dart-toggle");
      anim.hitFlash = 1;
      return true;
    }
    // 3. 命中任意圆球 -> 阶跃调整体量对比，让用户不碰滑杆也能直点拉大反差
    for (let i = L.orbs.length - 1; i >= 0; i--) {
      const o = L.orbs[i];
      if (Math.hypot(localX - o.x, localY - o.y) <= Math.max(o.r + 8, 26)) {
        const cur = getState().contrast;
        const next = cur < 2.2 ? 3.2 : cur < 3.9 ? 4.0 : cur > 4.6 ? 3.1 : 1.2;
        onMutate({ contrast: next }, "orb-tap");
        anim.hitFlash = 1;
        return true;
      }
    }
    return false;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    ptrId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startAngle = getState().angle;
    moved = false;
    mode = null;
    try {
      canvas.setPointerCapture(ptrId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    if (ptrId !== e.pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) > 5) {
      moved = true;
      // 鼠标任意拖都调角度；触屏时只有偏横向拖动才锁定，竖滑留给页面滚动
      if (e.pointerType !== "touch" || Math.abs(dx) >= Math.abs(dy) * 0.75) {
        mode = "drag-angle";
      }
    }
    if (mode === "drag-angle") {
      // 横拖直接掰动斜轴倾角（向右横拖上扬，向左可试俯冲负角）
      const sensitivity = cssW < 450 ? 0.55 : 0.36;
      const nextAngle = Math.round(clamp(startAngle + dx * sensitivity - dy * 0.08, -55, 75));
      if (nextAngle !== getState().angle) {
        onMutate({ angle: nextAngle }, "canvas-drag");
      }
    }
  });

  const endPtr = (e) => {
    if (ptrId !== e.pointerId) return;
    if (!moved) {
      const pt = toLocal(e.clientX, e.clientY);
      handleTap(pt.x, pt.y);
    }
    try {
      canvas.releasePointerCapture(ptrId);
    } catch {}
    ptrId = null;
    mode = null;
  };
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  // 同时兼容 tools/perf.mjs 发送的原生 TouchEvent（touchStart / touchMove / touchEnd）
  let touchStartX = 0;
  let touchStartAngle = 0;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartAngle = getState().angle;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const dx = e.touches[0].clientX - touchStartX;
      if (Math.abs(dx) > 3) {
        const nextAngle = Math.round(clamp(touchStartAngle + dx * 0.52, -55, 75));
        if (nextAngle !== getState().angle) {
          onMutate({ angle: nextAngle }, "touch-drag");
        }
      }
    },
    { passive: true }
  );

  resize();

  return {
    resize,
    render,
    triggerPulse,
    getLayout: () => lastEval.layout,
  };
}
