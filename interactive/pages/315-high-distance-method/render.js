// 315 高远法 · 2D 宣绢立轴与解剖图渲染引擎
// 逐点像素实采自 315 原海报配色；避开昂贵 shadowBlur，确保慢手机软件渲染仍高帧率。

import { clamp, evaluateScroll } from "./model.js";

export const PALETTE = {
  paper: "#E8E2D9",
  paperLight: "#F4EFE9",
  paperMid: "#ECEAE2",
  mist: "#EDE8DF",
  mistSoft: "#F5F1EA",
  farPeak: "#BBBBAF",
  farPeakMid: "#A8ACA2",
  midPeakL: "#55665A",
  midPeakR: "#3B574B",
  mainPeakL: "#2C5044",
  mainPeakR: "#1A3C2F",
  mainPeakDeep: "#122B21",
  baseMid: "#204538",
  baseDeep: "#0D321E",
  stepLight: "#E4DDD4",
  stepShade: "#CEC9BF",
  gold: "#BE9945",
  goldLine: "#AE934C",
  goldText: "#7A5B14",
  goldBright: "#E2C170",
  ink: "#11241B",
  inkMuted: "#42584D",
  err: "#A63322",
  errFill: "rgba(166, 51, 34, 0.14)",
  ok: "#1B5E42",
};

// 缓存一张轻量古绢纹理贴图（只建一次，不增加每帧开销）
let paperPatternCanvas = null;
function getPaperPattern(ctx) {
  if (!paperPatternCanvas) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = PALETTE.paper;
    g.fillRect(0, 0, 128, 128);
    // 细微宣绢纵横丝理
    g.fillStyle = "rgba(110, 96, 74, 0.032)";
    for (let y = 0; y < 128; y += 4) {
      g.fillRect(0, y, 128, 1);
    }
    g.fillStyle = "rgba(255, 252, 245, 0.06)";
    for (let x = 0; x < 128; x += 6) {
      g.fillRect(x, 0, 1, 128);
    }
    // 轻微矿物纤维点
    let seed = 315;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 140; i++) {
      const rx = rand() * 128;
      const ry = rand() * 128;
      g.fillStyle = i % 2 === 0 ? "rgba(92, 82, 66, 0.045)" : "rgba(255, 250, 240, 0.08)";
      g.fillRect(rx, ry, 1 + rand() * 2, 1);
    }
    paperPatternCanvas = c;
  }
  return ctx.createPattern(paperPatternCanvas, "repeat");
}

function drawPine(ctx, x, y, h, color) {
  const w = h * 0.56;
  ctx.fillStyle = color;
  // 树干
  ctx.fillRect(x - Math.max(1, h * 0.055), y - h * 0.24, Math.max(2, h * 0.11), h * 0.24);
  // 三层松冠
  const tiers = [
    { top: 1.0, bot: 0.62, hw: w * 0.42 },
    { top: 0.76, bot: 0.38, hw: w * 0.68 },
    { top: 0.50, bot: 0.16, hw: w * 0.94 },
  ];
  for (const t of tiers) {
    ctx.beginPath();
    ctx.moveTo(x, y - h * t.top);
    ctx.lineTo(x + t.hw, y - h * t.bot);
    ctx.lineTo(x - t.hw, y - h * t.bot);
    ctx.closePath();
    ctx.fill();
  }
}

// 无五官行旅剪影（严格遵守规范：仅背影轮廓，绝不画眼嘴）
function drawTraveler(ctx, x, y, h, color) {
  ctx.fillStyle = color;
  // 斗笠
  ctx.beginPath();
  ctx.moveTo(x, y - h * 1.02);
  ctx.lineTo(x + h * 0.34, y - h * 0.80);
  ctx.lineTo(x - h * 0.34, y - h * 0.80);
  ctx.closePath();
  ctx.fill();
  // 身形长袍背影
  ctx.beginPath();
  ctx.moveTo(x - h * 0.16, y - h * 0.78);
  ctx.lineTo(x + h * 0.16, y - h * 0.78);
  ctx.lineTo(x + h * 0.22, y - h * 0.16);
  ctx.lineTo(x - h * 0.20, y - h * 0.16);
  ctx.closePath();
  ctx.fill();
  // 行杖
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.beginPath();
  ctx.moveTo(x + h * 0.24, y - h * 0.74);
  ctx.lineTo(x + h * 0.30, y);
  ctx.stroke();
}

// 东方卷云片（平底柔弧，致敬 315 原海报云层语言）
function drawCloudBand(ctx, cx, y, spanW, thickH, alpha, tint = PALETTE.mistSoft) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 0.94);
  ctx.fillStyle = tint;
  ctx.beginPath();
  const x0 = cx - spanW * 0.5;
  const x1 = cx + spanW * 0.5;
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo(x0 + spanW * 0.14, y - thickH * 0.55, x0 + spanW * 0.28, y - thickH * 0.38);
  ctx.quadraticCurveTo(x0 + spanW * 0.48, y - thickH * 1.18, x0 + spanW * 0.68, y - thickH * 0.45);
  ctx.quadraticCurveTo(x0 + spanW * 0.84, y - thickH * 0.66, x1, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 画布通用立轴渲染器：主舞台、分屏对比、小练习、层叠分解均可调用
export function drawHighDistanceScroll(ctx, w, h, state, opts = {}) {
  const ev = opts.evalRes || evaluateScroll(state);
  const time = opts.time || 0;
  const intro = opts.intro ?? 1; // 0..1 入场进度
  const showRuler = opts.showRuler ?? true;
  const showHandles = opts.showHandles ?? false;
  const showWarnings = opts.showWarnings ?? true;
  const activeHandle = opts.activeHandle || null;
  const compact = opts.compact ?? false;
  const layers = opts.layers || { base: true, mist: true, peak: true, guide: true };

  const axisX = showRuler ? w * 0.47 : w * 0.50;
  const horizonPx = ev.horizonY * h;
  const footPx = ev.footY * h;
  const peakTopPx = ev.peakTopY * h;
  const spanPx = Math.max(12, footPx - peakTopPx);
  const sunPx = ev.sunY * h;
  const sunR = Math.max(8, Math.min(w, h) * (compact ? 0.032 : 0.030));

  // 1. 古绢底纸与顶部清朗渐层
  ctx.fillStyle = getPaperPattern(ctx);
  ctx.fillRect(0, 0, w, h);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, "rgba(246, 242, 235, 0.62)");
  skyGrad.addColorStop(0.55, "rgba(232, 226, 217, 0.10)");
  skyGrad.addColorStop(1, "rgba(216, 209, 198, 0.36)");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. 顶部古金日轮（原海报视觉冠点）
  if (layers.guide) {
    const sunHalo = ctx.createRadialGradient(axisX, sunPx, sunR * 0.3, axisX, sunPx, sunR * 3.1);
    sunHalo.addColorStop(0, ev.passCount === 4 ? "rgba(190, 153, 69, 0.28)" : "rgba(190, 153, 69, 0.14)");
    sunHalo.addColorStop(1, "rgba(190, 153, 69, 0)");
    ctx.fillStyle = sunHalo;
    ctx.beginPath();
    ctx.arc(axisX, sunPx, sunR * 3.1, 0, Math.PI * 2);
    ctx.fill();

    // 虚线外环（原海报标志母题）
    const sunAlert = showWarnings && ev.sunCollision;
    ctx.save();
    ctx.strokeStyle = sunAlert ? PALETTE.err : PALETTE.goldLine;
    ctx.lineWidth = compact ? 1.1 : 1.4;
    ctx.setLineDash([2.5, 3]);
    ctx.beginPath();
    ctx.arc(axisX, sunPx, sunR * 1.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = sunAlert ? PALETTE.err : PALETTE.gold;
    ctx.beginPath();
    ctx.arc(axisX, sunPx, sunR * 0.92, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 仰视收束导视线（两条金色斜线自山脚收敛至日轮）
  if (layers.guide && state.showGuides) {
    ctx.save();
    const lineAlpha = ev.fault === "high-horizon" ? 0.35 : 0.72;
    ctx.strokeStyle = ev.fault === "high-horizon" ? `rgba(166, 51, 34, ${lineAlpha})` : `rgba(174, 147, 76, ${lineAlpha})`;
    ctx.lineWidth = compact ? 0.9 : 1.15;
    const baseSpread = w * 0.37;
    const drawEnd = intro;
    const lx0 = axisX - baseSpread;
    const rx0 = axisX + baseSpread;
    const ly0 = footPx;
    ctx.beginPath();
    ctx.moveTo(lx0, ly0);
    ctx.lineTo(lx0 + (axisX - sunR * 0.9 - lx0) * drawEnd, ly0 + (sunPx + sunR * 1.5 - ly0) * drawEnd);
    ctx.moveTo(rx0, ly0);
    ctx.lineTo(rx0 + (axisX + sunR * 0.9 - rx0) * drawEnd, ly0 + (sunPx + sunR * 1.5 - ly0) * drawEnd);
    ctx.stroke();
    ctx.restore();
  }

  // 4. 山体绘制（三种题材共享完全同一组 peakTopPx / footPx / horizonPx 坐标）
  if (layers.peak) {
    const peakW = w * (state.scene === "tower" ? 0.22 : state.scene === "song" ? 0.42 : 0.34);

    if (state.scene === "poster") {
      // 4A. 原海报孤峰：多层几何棱面叠进 + 居中拔天青黛孤峰
      // 远层浅雾山体（左右错阶）
      ctx.fillStyle = PALETTE.farPeak;
      ctx.beginPath();
      ctx.moveTo(axisX - peakW * 1.15, footPx);
      ctx.lineTo(axisX - peakW * 0.92, footPx - spanPx * 0.30);
      ctx.lineTo(axisX - peakW * 0.76, footPx - spanPx * 0.26);
      ctx.lineTo(axisX - peakW * 0.56, footPx - spanPx * 0.58);
      ctx.lineTo(axisX - peakW * 0.38, footPx - spanPx * 0.62);
      ctx.lineTo(axisX - peakW * 0.22, footPx - spanPx * 0.73);
      ctx.lineTo(axisX + peakW * 0.14, footPx - spanPx * 0.64);
      ctx.lineTo(axisX + peakW * 0.44, footPx - spanPx * 0.48);
      ctx.lineTo(axisX + peakW * 0.72, footPx - spanPx * 0.39);
      ctx.lineTo(axisX + peakW * 0.95, footPx - spanPx * 0.22);
      ctx.lineTo(axisX + peakW * 1.12, footPx);
      ctx.closePath();
      ctx.fill();

      // 次层灰绿棱面（增加层层递进感）
      ctx.fillStyle = PALETTE.midPeakL;
      ctx.beginPath();
      ctx.moveTo(axisX - peakW * 0.88, footPx);
      ctx.lineTo(axisX - peakW * 0.58, footPx - spanPx * 0.44);
      ctx.lineTo(axisX - peakW * 0.30, footPx - spanPx * 0.56);
      ctx.lineTo(axisX + peakW * 0.26, footPx - spanPx * 0.42);
      ctx.lineTo(axisX + peakW * 0.58, footPx - spanPx * 0.30);
      ctx.lineTo(axisX + peakW * 0.82, footPx);
      ctx.closePath();
      ctx.fill();

      // 主峰孤峭拔起：左侧受光青黛面 + 右侧深松背光面（高度精确到 peakTopPx）
      const apexW = peakW * 0.11;
      const baseHalf = peakW * 0.50;
      const ridgeX = axisX + peakW * 0.03;

      // 左受光面
      ctx.fillStyle = PALETTE.mainPeakL;
      ctx.beginPath();
      ctx.moveTo(axisX - baseHalf, footPx);
      ctx.lineTo(axisX - baseHalf * 0.74, footPx - spanPx * 0.48);
      ctx.lineTo(axisX - apexW, peakTopPx + spanPx * 0.035);
      ctx.lineTo(axisX, peakTopPx);
      ctx.lineTo(ridgeX, footPx);
      ctx.closePath();
      ctx.fill();

      // 右背光深面
      ctx.fillStyle = PALETTE.mainPeakR;
      ctx.beginPath();
      ctx.moveTo(axisX, peakTopPx);
      ctx.lineTo(axisX + apexW * 1.25, peakTopPx + spanPx * 0.03);
      ctx.lineTo(axisX + baseHalf * 0.64, footPx - spanPx * 0.44);
      ctx.lineTo(axisX + baseHalf * 0.94, footPx);
      ctx.lineTo(ridgeX, footPx);
      ctx.closePath();
      ctx.fill();

      // 峰腰前耸暗礁阶梯（原海报中下部标志性锯齿峭坡）
      ctx.fillStyle = PALETTE.baseMid;
      ctx.beginPath();
      ctx.moveTo(axisX - peakW * 0.92, footPx);
      ctx.lineTo(axisX - peakW * 0.68, footPx - spanPx * 0.20);
      ctx.lineTo(axisX - peakW * 0.42, footPx - spanPx * 0.26);
      ctx.lineTo(axisX - peakW * 0.18, footPx - spanPx * 0.34);
      ctx.lineTo(axisX + peakW * 0.08, footPx - spanPx * 0.42);
      ctx.lineTo(axisX + peakW * 0.46, footPx - spanPx * 0.24);
      ctx.lineTo(axisX + peakW * 0.80, footPx);
      ctx.closePath();
      ctx.fill();
    } else if (state.scene === "song") {
      // 4B. 北宋溪山：巨碑圆浑主峰（致敬范宽/郭熙）+ 细白飞瀑
      ctx.fillStyle = PALETTE.farPeakMid;
      ctx.beginPath();
      ctx.moveTo(axisX - peakW * 1.15, footPx);
      ctx.quadraticCurveTo(axisX - peakW * 0.85, footPx - spanPx * 0.55, axisX - peakW * 0.42, footPx - spanPx * 0.66);
      ctx.quadraticCurveTo(axisX + peakW * 0.45, footPx - spanPx * 0.70, axisX + peakW * 1.10, footPx);
      ctx.closePath();
      ctx.fill();

      // 堂堂主峰巨碑体
      const grad = ctx.createLinearGradient(axisX, peakTopPx, axisX, footPx);
      grad.addColorStop(0, PALETTE.mainPeakR);
      grad.addColorStop(0.58, PALETTE.mainPeakL);
      grad.addColorStop(1, PALETTE.midPeakL);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(axisX - peakW * 0.72, footPx);
      ctx.bezierCurveTo(
        axisX - peakW * 0.78, footPx - spanPx * 0.62,
        axisX - peakW * 0.45, peakTopPx + spanPx * 0.04,
        axisX - peakW * 0.06, peakTopPx
      );
      ctx.bezierCurveTo(
        axisX + peakW * 0.34, peakTopPx + spanPx * 0.02,
        axisX + peakW * 0.70, footPx - spanPx * 0.50,
        axisX + peakW * 0.74, footPx
      );
      ctx.closePath();
      ctx.fill();

      // 雨点皴短墨笔触（克制轻量，每帧固定 18 条）
      ctx.strokeStyle = "rgba(13, 40, 28, 0.32)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 16; i++) {
        const fx = ((i * 37) % 100) / 100 - 0.5;
        const fy = 0.14 + ((i * 53) % 62) / 100;
        const sx = axisX + fx * peakW * 0.92;
        const sy = peakTopPx + fy * spanPx;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 2, sy + 7);
        ctx.stroke();
      }

      // 峰间细白一线飞瀑
      ctx.strokeStyle = PALETTE.paperLight;
      ctx.lineWidth = compact ? 1.5 : 2.1;
      ctx.beginPath();
      ctx.moveTo(axisX + peakW * 0.16, peakTopPx + spanPx * 0.34);
      ctx.quadraticCurveTo(axisX + peakW * 0.14, peakTopPx + spanPx * 0.56, axisX + peakW * 0.18, footPx - spanPx * 0.10);
      ctx.stroke();
    } else {
      // 4C. 现代摩天：低机位仰望竖向钢构塔群
      // 两侧陪衬楼体
      ctx.fillStyle = PALETTE.farPeak;
      ctx.fillRect(axisX - peakW * 1.45, footPx - spanPx * 0.46, peakW * 0.72, spanPx * 0.46);
      ctx.fillRect(axisX + peakW * 0.75, footPx - spanPx * 0.38, peakW * 0.68, spanPx * 0.38);

      // 中央仰视收束主塔（呈轻微一点仰视梯形收窄）
      const topHalf = peakW * 0.36;
      const botHalf = peakW * 0.68;
      ctx.fillStyle = PALETTE.mainPeakL;
      ctx.beginPath();
      ctx.moveTo(axisX - botHalf, footPx);
      ctx.lineTo(axisX - topHalf, peakTopPx + spanPx * 0.07);
      ctx.lineTo(axisX, peakTopPx);
      ctx.lineTo(axisX, footPx);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = PALETTE.mainPeakR;
      ctx.beginPath();
      ctx.moveTo(axisX, peakTopPx);
      ctx.lineTo(axisX + topHalf, peakTopPx + spanPx * 0.07);
      ctx.lineTo(axisX + botHalf, footPx);
      ctx.lineTo(axisX, footPx);
      ctx.closePath();
      ctx.fill();

      // 竖向幕墙古金细线
      ctx.strokeStyle = "rgba(190, 153, 69, 0.35)";
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        const t = i / 3;
        ctx.beginPath();
        ctx.moveTo(axisX + t * botHalf * 0.9, footPx);
        ctx.lineTo(axisX + t * topHalf * 0.9, peakTopPx + spanPx * 0.08);
        ctx.stroke();
      }
    }
  }

  // 5. 烟霞锁腰带（紧扣郭熙「烟霞锁其腰，则高矣」）
  const drift = Math.sin(time * 0.55) * w * 0.012;
  if (layers.mist && ev.mist > 0.015) {
    const mY = ev.mistCenterY * h;
    const mH = ev.mistBandHeight * h;
    const mAlpha = clamp(ev.mist * 1.15, 0, 0.94);

    // 柔雾横向渐变幕（当浓雾 > 68% 时向上漫延吞峰）
    const mistSpreadTop = ev.mist > 0.68 ? peakTopPx + spanPx * 0.05 : mY - mH * 0.95;
    const mistGrad = ctx.createLinearGradient(0, mistSpreadTop, 0, mY + mH * 0.65);
    mistGrad.addColorStop(0, "rgba(236, 231, 222, 0)");
    mistGrad.addColorStop(0.45, `rgba(238, 233, 224, ${clamp(ev.mist * 0.92, 0, 0.86)})`);
    mistGrad.addColorStop(0.75, `rgba(244, 239, 233, ${clamp(ev.mist * 0.85, 0, 0.82)})`);
    mistGrad.addColorStop(1, "rgba(232, 226, 217, 0)");
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, mistSpreadTop, w, mY + mH * 0.65 - mistSpreadTop);

    // 三片东方卷云片（左右错位呼应 315 原海报）
    drawCloudBand(ctx, axisX - w * 0.14 + drift, mY - mH * 0.15, w * (0.28 + ev.mist * 0.18), mH * 0.46, mAlpha, PALETTE.mistSoft);
    drawCloudBand(ctx, axisX + w * 0.18 - drift * 0.8, mY + mH * 0.20, w * (0.30 + ev.mist * 0.22), mH * 0.42, mAlpha * 0.92, PALETTE.mist);
    drawCloudBand(ctx, axisX + w * 0.09 + drift * 0.5, mY - mH * 0.68, w * (0.18 + ev.mist * 0.14), mH * 0.30, mAlpha * 0.72, PALETTE.mistSoft);
  }

  // 6. 山脚地平线与低处近坡石阶（当 horizonY 抬高到中上方时，下半幅真实摊开为俯视长坡！）
  if (layers.base) {
    const groundTop = footPx;
    const groundH = Math.max(12, h - groundTop);

    // 地平线以下底坡（俯视时拉展为宽大坡面，仰视时压成坚实底座）
    ctx.fillStyle = PALETTE.stepLight;
    ctx.fillRect(0, groundTop, w, groundH);

    // 左近坡深松棱块
    ctx.fillStyle = PALETTE.baseMid;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, groundTop + groundH * 0.12);
    ctx.lineTo(axisX - w * 0.26, groundTop - groundH * 0.26);
    ctx.lineTo(axisX - w * 0.06, groundTop + groundH * 0.04);
    ctx.lineTo(axisX - w * 0.14, h);
    ctx.closePath();
    ctx.fill();

    // 右近坡深松棱块
    ctx.fillStyle = PALETTE.baseMid;
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w, groundTop + groundH * 0.16);
    ctx.lineTo(axisX + w * 0.24, groundTop - groundH * 0.32);
    ctx.lineTo(axisX + w * 0.07, groundTop + groundH * 0.02);
    ctx.lineTo(axisX + w * 0.18, h);
    ctx.closePath();
    ctx.fill();

    // 底部最重深松压脚台基
    ctx.fillStyle = PALETTE.baseDeep;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - Math.min(h * 0.09, groundH * 0.42));
    ctx.lineTo(axisX - w * 0.12, h - Math.min(h * 0.06, groundH * 0.28));
    ctx.lineTo(axisX - w * 0.06, h);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w, h - Math.min(h * 0.095, groundH * 0.44));
    ctx.lineTo(axisX + w * 0.11, h - Math.min(h * 0.055, groundH * 0.25));
    ctx.lineTo(axisX + w * 0.07, h);
    ctx.closePath();
    ctx.fill();

    // 中央拾级而上的石阶山道（原海报中轴引导起点）
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      const sy0 = h - groundH * t0;
      const sy1 = h - groundH * t1;
      const hw0 = w * (0.145 - t0 * 0.10);
      const hw1 = w * (0.145 - t1 * 0.10);
      const zig = Math.sin(i * 1.15) * w * 0.022;
      ctx.fillStyle = i % 2 === 0 ? PALETTE.stepLight : PALETTE.stepShade;
      ctx.beginPath();
      ctx.moveTo(axisX - hw0 + zig, sy0);
      ctx.lineTo(axisX + hw0 + zig, sy0);
      ctx.lineTo(axisX + hw1 + zig * 0.65, sy1);
      ctx.lineTo(axisX - hw1 + zig * 0.65, sy1);
      ctx.closePath();
      ctx.fill();
    }

    // 7. 低处尺度参比（巨树喧宾 / 空脚无尺 / 矮松拾级）
    if (ev.baseRef === "humble") {
      const pineH = Math.max(12, h * 0.052);
      if (state.scene === "tower") {
        // 街灯与微渺行人背影
        ctx.strokeStyle = PALETTE.baseDeep;
        ctx.lineWidth = 1.6;
        const lampX = axisX - w * 0.24;
        const lampY = groundTop + groundH * 0.35;
        ctx.beginPath();
        ctx.moveTo(lampX, lampY);
        ctx.lineTo(lampX, lampY - pineH * 1.15);
        ctx.lineTo(lampX + 7, lampY - pineH * 1.15);
        ctx.stroke();
        drawTraveler(ctx, axisX - w * 0.03, groundTop + groundH * 0.68, pineH * 0.56, PALETTE.baseDeep);
        drawTraveler(ctx, axisX + w * 0.02, groundTop + groundH * 0.56, pineH * 0.44, PALETTE.baseMid);
      } else {
        drawPine(ctx, axisX - w * 0.34, groundTop + groundH * 0.28, pineH * 1.05, PALETTE.baseDeep);
        drawPine(ctx, axisX - w * 0.39, groundTop + groundH * 0.34, pineH * 0.72, PALETTE.baseMid);
        drawPine(ctx, axisX - w * 0.29, groundTop + groundH * 0.36, pineH * 0.64, PALETTE.baseMid);
        drawPine(ctx, axisX + w * 0.31, groundTop + groundH * 0.26, pineH * 0.96, PALETTE.baseDeep);
        drawPine(ctx, axisX + w * 0.36, groundTop + groundH * 0.34, pineH * 0.68, PALETTE.baseMid);
        // 石阶山脚微小行旅剪影
        drawTraveler(ctx, axisX - w * 0.025, groundTop + groundH * 0.64, pineH * 0.54, PALETTE.baseDeep);
      }
    } else if (ev.baseRef === "giant") {
      // 喧宾夺主的近景巨树（高达画幅 34%，把主峰比矮！）
      const giantH = h * 0.34;
      drawPine(ctx, axisX - w * 0.25, Math.min(h * 0.96, groundTop + groundH * 0.65), giantH, "#102D21");
      drawPine(ctx, axisX + w * 0.27, Math.min(h * 0.98, groundTop + groundH * 0.72), giantH * 0.84, "#173A2B");
    }
  }

  // 8. 中轴金色虚线箭柱（自山脚石阶垂直攀升至顶沿日轮）
  if (layers.guide && state.showGuides) {
    const startY = footPx + Math.min(18, (h - footPx) * 0.22);
    const endY = sunPx + sunR * 1.95;
    const arrowTop = startY - (startY - endY) * intro;
    ctx.save();
    const isErr = ev.fault === "high-horizon" || ev.fault === "choked";
    ctx.strokeStyle = isErr ? PALETTE.err : PALETTE.gold;
    ctx.fillStyle = isErr ? PALETTE.err : PALETTE.gold;
    ctx.lineWidth = compact ? 1.2 : 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(axisX, startY);
    ctx.lineTo(axisX, arrowTop);
    ctx.stroke();
    ctx.setLineDash([]);

    // 沿中轴向上的小金色人字箭头（原海报同款）
    const count = compact ? 4 : 6;
    for (let i = 1; i <= count; i++) {
      const f = i / (count + 0.4);
      const ay = startY - (startY - arrowTop) * f;
      if (ay < endY + 6) continue;
      const sz = compact ? 3.5 : 4.6;
      ctx.beginPath();
      ctx.moveTo(axisX, ay - sz);
      ctx.lineTo(axisX + sz * 0.82, ay + sz * 0.72);
      ctx.lineTo(axisX, ay + sz * 0.18);
      ctx.lineTo(axisX - sz * 0.82, ay + sz * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 9. 地平线虚线（当偏高成俯视或打开导视线时轻柔显示，帮助读懂压低山脚）
  if (state.showGuides && layers.guide) {
    ctx.save();
    const hiErr = ev.horizonY < 0.68;
    ctx.strokeStyle = hiErr ? "rgba(166, 51, 34, 0.78)" : "rgba(19, 58, 39, 0.34)";
    ctx.lineWidth = hiErr ? 1.4 : 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(10, horizonPx);
    ctx.lineTo(showRuler ? w * 0.80 : w - 10, horizonPx);
    ctx.stroke();
    ctx.restore();

    if (!compact) {
      ctx.save();
      ctx.font = `500 11px "IBM Plex Mono", monospace`;
      const lbl = hiErr ? `地平线 ${Math.round(ev.horizonY * 100)}% · 偏高` : `地平线 ${Math.round(ev.horizonY * 100)}%`;
      const tw = ctx.measureText(lbl).width;
      const bx = 8;
      // 当地平线在画幅上半时把标签放在虚线下方，彻底避开山腰「烟腰」圆标
      const placeBelow = ev.horizonY < 0.58;
      const by = placeBelow ? Math.min(h - 24, horizonPx + 6) : Math.max(10, horizonPx - 23);
      ctx.fillStyle = "rgba(244, 239, 233, 0.94)";
      ctx.fillRect(bx, by, tw + 12, 18);
      ctx.strokeStyle = hiErr ? "rgba(166, 51, 34, 0.55)" : "rgba(17, 36, 27, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, tw + 12, 18);
      ctx.fillStyle = hiErr ? PALETTE.err : PALETTE.ink;
      ctx.fillText(lbl, bx + 6, by + 13);
      ctx.restore();
    }
  }

  // 10. 顶天窒息预警红线（练习未作答时不显示，避免剧透）
  if (showWarnings && ev.headroom < 0.095 && layers.peak) {
    ctx.save();
    ctx.fillStyle = PALETTE.errFill;
    ctx.fillRect(0, 0, w, Math.max(14, peakTopPx + 4));
    ctx.strokeStyle = PALETTE.err;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, peakTopPx);
    ctx.lineTo(w, peakTopPx);
    ctx.stroke();
    ctx.restore();
  }

  // 11. 原海报右侧垂直虚线标尺：「高处为主 HIGH POINT」 ↔ 「低处为辅 LOW BASE」
  if (showRuler) {
    const rx = w * 0.815;
    const topY = clamp(peakTopPx, 24, h * 0.52);
    const botY = clamp(footPx, topY + 46, h - 24);

    ctx.save();
    ctx.strokeStyle = "rgba(19, 58, 39, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(rx, topY);
    ctx.lineTo(rx, botY);
    ctx.stroke();

    // 水平引线接向主峰顶与山脚
    ctx.beginPath();
    ctx.moveTo(axisX + 12, topY);
    ctx.lineTo(rx, topY);
    ctx.moveTo(axisX + 20, botY);
    ctx.lineTo(rx, botY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 顶部与底部深松圆点（原海报标志符号）
    ctx.fillStyle = ev.checks.ascent.ok ? PALETTE.gold : PALETTE.ink;
    ctx.beginPath();
    ctx.arc(rx, topY, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ev.checks.base.ok ? PALETTE.gold : PALETTE.ink;
    ctx.beginPath();
    ctx.arc(rx, botY, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // 标尺文字配素绢微衬底，确保压在深松坡面上仍极清晰且不贴边裁切
    const drawTag = (text, x, y, font, color) => {
      ctx.font = font;
      const tw = ctx.measureText(text).width;
      const tx = Math.min(x, w - tw - 6);
      ctx.fillStyle = "rgba(244, 239, 233, 0.92)";
      ctx.fillRect(tx - 3, y - 11, tw + 6, 15);
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(text, tx, y);
    };
    drawTag("高处为主", rx + 8, topY + 4, `500 11px "LXGW WenKai", serif`, PALETTE.ink);
    drawTag("低处为辅", rx + 8, botY + 4, `500 11px "LXGW WenKai", serif`, PALETTE.ink);
    drawTag(`升程 ${Math.round(ev.spanRatio * 100)}%`, rx + 8, (topY + botY) * 0.5 + 4, `500 10.5px "IBM Plex Mono", monospace`, PALETTE.goldText);
    ctx.restore();
  }

  // 12. 画布内直拖节点（简洁古金圆标）
  const handles = {
    peak: { x: axisX, y: peakTopPx, label: "峰顶" },
    mist: { x: axisX - w * 0.16, y: ev.mistCenterY * h, label: "烟腰" },
    horizon: { x: axisX + w * 0.24, y: horizonPx, label: "山脚" },
  };

  if (showHandles) {
    for (const [key, pt] of Object.entries(handles)) {
      const isAct = activeHandle === key;
      const r = isAct ? 9 : 6.5;
      ctx.save();
      ctx.fillStyle = isAct ? PALETTE.gold : PALETTE.paperLight;
      ctx.strokeStyle = isAct ? PALETTE.ink : PALETTE.goldText;
      ctx.lineWidth = isAct ? 2.2 : 1.6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // 小标签避让
      ctx.font = `500 10.5px "LXGW WenKai", serif`;
      const tx = key === "mist" ? pt.x - 32 : pt.x + 11;
      const ty = pt.y + 4;
      ctx.fillStyle = "rgba(244, 239, 233, 0.88)";
      ctx.fillRect(tx - 3, ty - 11, 28, 14);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText(pt.label, tx, ty);
      ctx.restore();
    }
  }

  return { handles, evalRes: ev };
}

// 右翼「侧视仰角剖面仪」：一眼看清为什么抬头仰望时，地平线反而落在画幅下方
export function drawElevationProfile(ctx, w, h, state, ev) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, w, h);

  // 细坐标网格
  ctx.strokeStyle = "rgba(17, 36, 27, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gy = (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  const groundY = h * 0.80;
  // 地面基线
  ctx.strokeStyle = PALETTE.baseDeep;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(10, groundY);
  ctx.lineTo(w - 10, groundY);
  ctx.stroke();

  // 观者站位（左）与主峰剖面（右）
  const viewerX = w * 0.16;
  const viewerH = clamp(ev.pitch < 0 ? h * 0.44 : h * 0.16, h * 0.14, h * 0.46);
  const eyeY = groundY - viewerH;

  // 若是俯视，画一座高台垫高观者；仰视则站在山脚平地
  if (ev.pitch < 0) {
    ctx.fillStyle = "rgba(166, 51, 34, 0.16)";
    ctx.fillRect(10, eyeY + 14, viewerX + 16, groundY - (eyeY + 14));
  }

  // 无五官观者剪影
  drawTraveler(ctx, viewerX, eyeY + 14, 15, PALETTE.ink);

  // 主峰侧剖面
  const mBaseL = w * 0.56;
  const mBaseR = w * 0.92;
  const mPeakX = w * 0.78;
  const mPeakH = h * (0.28 + ev.peakScale * 0.44);
  const mPeakY = clamp(groundY - mPeakH, 14, groundY - 22);

  ctx.fillStyle = PALETTE.mainPeakL;
  ctx.beginPath();
  ctx.moveTo(mBaseL, groundY);
  ctx.lineTo(mPeakX, mPeakY);
  ctx.lineTo(mBaseR, groundY);
  ctx.closePath();
  ctx.fill();

  // 侧剖面烟霞锁腰带
  if (ev.mist > 0.05) {
    const my = groundY - (groundY - mPeakY) * 0.40;
    ctx.fillStyle = `rgba(244, 239, 233, ${clamp(ev.mist * 0.95, 0, 0.88)})`;
    ctx.fillRect(mBaseL - 10, my - 5, mBaseR - mBaseL + 16, 10 + ev.mist * 12);
  }

  // 水平视平参考虚线
  ctx.save();
  ctx.strokeStyle = "rgba(17, 36, 27, 0.35)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(viewerX + 6, eyeY);
  ctx.lineTo(w - 10, eyeY);
  ctx.stroke();
  ctx.restore();

  // 真实视线视锥扇面（按 ev.pitch 仰起或俯下）
  const rad = (-ev.pitch * Math.PI) / 180; // Canvas Y 向下，仰视取负角
  const rayLen = w * 0.64;
  const coneSpread = 0.25;
  const isErr = ev.pitch < 18;
  ctx.fillStyle = isErr ? "rgba(166, 51, 34, 0.14)" : "rgba(190, 153, 69, 0.20)";
  ctx.beginPath();
  ctx.moveTo(viewerX + 4, eyeY);
  ctx.lineTo(viewerX + 4 + Math.cos(rad - coneSpread) * rayLen, eyeY + Math.sin(rad - coneSpread) * rayLen);
  ctx.lineTo(viewerX + 4 + Math.cos(rad + coneSpread) * rayLen, eyeY + Math.sin(rad + coneSpread) * rayLen);
  ctx.closePath();
  ctx.fill();

  // 主视线中心线
  ctx.strokeStyle = isErr ? PALETTE.err : PALETTE.goldText;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(viewerX + 4, eyeY);
  ctx.lineTo(viewerX + 4 + Math.cos(rad) * rayLen, eyeY + Math.sin(rad) * rayLen);
  ctx.stroke();

  // 右上角读数角标
  ctx.font = `500 11px "IBM Plex Mono", monospace`;
  ctx.fillStyle = isErr ? PALETTE.err : PALETTE.ink;
  ctx.textAlign = "right";
  const sign = ev.pitch > 0 ? "+" : "";
  const mode = ev.pitch < -2 ? "俯视" : ev.pitch < 18 ? "平视" : "仰视";
  ctx.fillText(`${sign}${Math.round(ev.pitch)}° ${mode}`, w - 10, 18);

  ctx.textAlign = "left";
  ctx.font = `500 10.5px "LXGW WenKai", serif`;
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.fillText(ev.pitch < 0 ? "高机位向下看" : "山脚抬头仰望", 10, 18);
}

// 04 节：北宋三杰与当代竖屏真实画幅比例骨法图
export function drawHistoryDiagram(ctx, w, h, item) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.paperMid;
  ctx.fillRect(0, 0, w, h);

  // 按文物真实高宽比在画布内等比置中，底部留出比例标注空间避免叠压
  const padX = 18;
  const padTop = 14;
  const padBottom = 30;
  const maxW = w - padX * 2;
  const maxH = h - padTop - padBottom;
  const aspect = item.ratioW / item.ratioH;
  let fw = maxH * aspect;
  let fh = maxH;
  if (fw > maxW) {
    fw = maxW;
    fh = fw / aspect;
  }
  const fx = (w - fw) * 0.5;
  const fy = padTop + (maxH - fh) * 0.5;

  // 挂轴天地绫边
  ctx.fillStyle = "#D8D1C4";
  ctx.fillRect(fx - 7, fy - 7, fw + 14, fh + 14);
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(fx, fy, fw, fh);

  const scene = item.id === "modern" ? "tower" : item.id === "fankuan" || item.id === "guoxi" ? "song" : "poster";
  const tmpState = {
    scene,
    pitch: 36,
    peakScale: item.id === "fankuan" ? 0.86 : 0.78,
    mist: item.id === "fankuan" ? 0.48 : 0.42,
    baseRef: "humble",
    showGuides: true,
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();
  ctx.translate(fx, fy);
  drawHighDistanceScroll(ctx, fw, fh, tmpState, {
    showRuler: false,
    showHandles: false,
    compact: true,
  });
  ctx.restore();

  // 画心边框与外沿真实比例标注
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(fx, fy, fw, fh);

  ctx.font = `500 11px "IBM Plex Mono", monospace`;
  ctx.fillStyle = PALETTE.goldText;
  ctx.textAlign = "right";
  ctx.fillText(`比例 ${(item.ratioH / item.ratioW).toFixed(2)} : 1`, w - 12, h - 10);
}

// 05 节：三远与游观六法视向剖面罗盘
export function drawFamilyCompass(ctx, w, h, method) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0F241C";
  ctx.fillRect(0, 0, w, h);

  // 左半：侧视视向剖面；右半：成片构图骨架
  const split = w * 0.54;
  ctx.strokeStyle = "rgba(226, 193, 112, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(split, 14);
  ctx.lineTo(split, h - 14);
  ctx.stroke();

  // 左侧剖面地面与三山
  const gy = h * 0.78;
  ctx.strokeStyle = "rgba(241, 236, 227, 0.35)";
  ctx.beginPath();
  ctx.moveTo(16, gy);
  ctx.lineTo(split - 16, gy);
  ctx.stroke();

  const drawMtn = (cx, mw, mh, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx - mw * 0.5, gy);
    ctx.lineTo(cx, gy - mh);
    ctx.lineTo(cx + mw * 0.5, gy);
    ctx.closePath();
    ctx.fill();
  };

  if (method.id === "315") {
    drawMtn(split * 0.74, 86, h * 0.54, "#2C5849");
    drawMtn(split * 0.52, 48, h * 0.20, "#1D4235");
  } else if (method.id === "316") {
    drawMtn(split * 0.48, 60, h * 0.36, "#1D4235");
    drawMtn(split * 0.66, 66, h * 0.44, "#2C5849");
    drawMtn(split * 0.82, 64, h * 0.48, "#467060");
  } else if (method.id === "317") {
    drawMtn(split * 0.44, 62, h * 0.16, "#1D4235");
    drawMtn(split * 0.76, 94, h * 0.18, "#3B6254");
  } else {
    drawMtn(split * 0.44, 52, h * 0.22, "#1D4235");
    drawMtn(split * 0.65, 62, h * 0.48, "#2C5849");
    drawMtn(split * 0.84, 54, h * 0.20, "#467060");
  }

  // 视点与视线
  const vx = 34;
  const vy = method.id === "316" ? gy - h * 0.42 : gy - 16;
  ctx.fillStyle = PALETTE.goldBright;
  ctx.beginPath();
  ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 1.8;
  if (method.id === "319" || method.id === "320") {
    // 散点/游观：多视点波浪移动轨迹
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.bezierCurveTo(vx + 55, vy - 28, split * 0.55, gy - 14, split * 0.82, gy - h * 0.34);
    ctx.stroke();
    for (const [px, py] of [[vx + 44, vy - 18], [split * 0.58, gy - 26]]) {
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const rad = (-method.angle * Math.PI) / 180;
    const len = split * 0.64;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + Math.cos(rad) * len, vy + Math.sin(rad) * len);
    ctx.stroke();
  }

  // 右侧：成片画幅骨架缩图
  const rx = split + (w - split) * 0.5;
  const boxW = method.id === "317" || method.id === "320" ? Math.min(w - split - 34, 150) : 84;
  const boxH = method.id === "317" || method.id === "320" ? 74 : Math.min(h - 44, 122);
  const bx = rx - boxW * 0.5;
  const by = (h - boxH) * 0.5;

  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(bx, by, boxW, boxH);

  // 缩图内简洁山水骨线
  ctx.fillStyle = PALETTE.mainPeakR;
  if (method.id === "315") {
    ctx.beginPath();
    ctx.moveTo(bx + boxW * 0.20, by + boxH * 0.86);
    ctx.lineTo(bx + boxW * 0.50, by + boxH * 0.16);
    ctx.lineTo(bx + boxW * 0.80, by + boxH * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.mistSoft;
    ctx.fillRect(bx + 4, by + boxH * 0.56, boxW - 8, 9);
  } else if (method.id === "316") {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? "#85948A" : i === 1 ? "#3F6254" : "#153629";
      const y0 = by + boxH * (0.26 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(bx, by + boxH);
      ctx.lineTo(bx + boxW * (0.28 + i * 0.15), y0);
      ctx.lineTo(bx + boxW, by + boxH);
      ctx.closePath();
      ctx.fill();
    }
  } else if (method.id === "317") {
    ctx.fillStyle = "#9BA59B";
    ctx.fillRect(bx, by + boxH * 0.56, boxW, boxH * 0.08);
    ctx.fillStyle = "#2C5044";
    ctx.fillRect(bx, by + boxH * 0.72, boxW * 0.55, boxH * 0.12);
  } else {
    ctx.beginPath();
    ctx.moveTo(bx + 8, by + boxH * 0.84);
    ctx.lineTo(bx + boxW * 0.45, by + boxH * 0.22);
    ctx.lineTo(bx + boxW * 0.74, by + boxH * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 10, by + boxH * 0.82);
    ctx.quadraticCurveTo(bx + boxW * 0.55, by + boxH * 0.62, bx + boxW - 10, by + boxH * 0.44);
    ctx.stroke();
  }

  ctx.font = `500 11px "IBM Plex Mono", monospace`;
  ctx.fillStyle = "#D8DDD5";
  ctx.textAlign = "left";
  ctx.fillText("侧视视向", 16, 22);
  ctx.fillText("画幅骨法", split + 14, 22);
}
