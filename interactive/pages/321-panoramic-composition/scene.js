// 321 全景式构图 · 2D Canvas 渲染引擎
// 1) drawHeroCanvas: 主全景开镜台（全宽出血青黛山河 + 银青湖波 + 墨青松林 + 飞鸟 + 朱红孤影 + 动态宣纸裁切帘幕）
// 2) drawDiagramCanvas: 紧贴主幕的原海报同款「淡青线稿同步剖析图」（前/中/远三层透明色阶 + 虚线标尺 + 实时山人尺度标）
// 3) drawDepthLabCanvas: 03 节深松墨暗室的四层独立空气透视剥离舞台

import {
  SCENES,
  clamp,
  foreBankHeight,
  layerColors,
  lerp,
  mixRgb,
  rgbCss,
  ridgeHeight,
} from "./model.js";

// 在给定区域内绘制一只极简剪影飞鸟（纯矢量双弧，零冗余）
function drawBird(ctx, x, y, size, flap, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.15, size * 0.14);
  ctx.lineCap = "round";
  ctx.beginPath();
  const wingLift = Math.sin(flap) * size * 0.22;
  ctx.moveTo(x - size, y - size * 0.25 + wingLift);
  ctx.quadraticCurveTo(x - size * 0.45, y - size * 0.65 - wingLift * 0.5, x, y);
  ctx.quadraticCurveTo(x + size * 0.45, y - size * 0.65 - wingLift * 0.5, x + size, y - size * 0.22 + wingLift);
  ctx.stroke();
}

// 绘制一棵尖顶针叶松树剪影（1:1 呼应原海报右侧前景墨青松林）
function drawPine(ctx, x, baseY, h, color) {
  const w = h * 0.34;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  const tiers = 5;
  for (let i = 1; i <= tiers; i++) {
    const f = i / tiers;
    const ty = baseY - h * (1 - f * 0.86);
    const tw = w * (0.28 + f * 0.78);
    ctx.lineTo(x + tw, ty);
    if (i < tiers) ctx.lineTo(x + tw * 0.46, ty - h * 0.045);
  }
  ctx.lineTo(x + w * 0.15, baseY);
  ctx.lineTo(x - w * 0.15, baseY);
  for (let i = tiers; i >= 1; i--) {
    const f = i / tiers;
    const ty = baseY - h * (1 - f * 0.86);
    const tw = w * (0.28 + f * 0.78);
    if (i < tiers) ctx.lineTo(x - tw * 0.46, ty - h * 0.045);
    ctx.lineTo(x - tw, ty);
  }
  ctx.closePath();
  ctx.fill();
}

// 绘制点景锚剪影（严守红线：绝对不画五官！仅用纯净剪影/背影）
function drawAnchorFigure(ctx, sceneKey, x, footY, h, color, isWarn) {
  if (h < 2) return;
  ctx.save();
  ctx.fillStyle = color;

  // 轻微岸边接触影
  ctx.save();
  ctx.fillStyle = "rgba(3, 34, 34, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x, footY + 1, Math.max(4, h * 0.24), Math.max(1.4, h * 0.06), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (sceneKey === "scroll") {
    // 乌篷小舟 + 极简执篙背影
    const boatW = h * 1.95;
    const boatH = h * 0.34;
    ctx.beginPath();
    ctx.moveTo(x - boatW * 0.52, footY - boatH * 0.75);
    ctx.quadraticCurveTo(x, footY + boatH * 0.35, x + boatW * 0.54, footY - boatH * 0.85);
    ctx.lineTo(x + boatW * 0.36, footY);
    ctx.lineTo(x - boatW * 0.36, footY);
    ctx.closePath();
    ctx.fill();
    // 舟篷
    ctx.beginPath();
    ctx.arc(x - boatW * 0.08, footY - boatH * 0.55, h * 0.34, Math.PI, 0);
    ctx.fill();
    // 船尾背影渔人（斗笠 + 披衣剪影，无五官）
    const px = x + boatW * 0.24;
    const py = footY - boatH * 0.65;
    ctx.beginPath();
    ctx.moveTo(px - h * 0.18, py - h * 0.48);
    ctx.lineTo(px, py - h * 0.66);
    ctx.lineTo(px + h * 0.18, py - h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - h * 0.12, py);
    ctx.lineTo(px - h * 0.09, py - h * 0.48);
    ctx.lineTo(px + h * 0.09, py - h * 0.48);
    ctx.lineTo(px + h * 0.13, py);
    ctx.closePath();
    ctx.fill();
  } else if (sceneKey === "desert") {
    // 驼骑旅人远影（侧剪影，无五官）
    const cw = h * 1.05;
    ctx.beginPath();
    // 骆驼躯干与单峰
    ctx.moveTo(x - cw * 0.42, footY - h * 0.34);
    ctx.quadraticCurveTo(x - cw * 0.1, footY - h * 0.78, x + cw * 0.14, footY - h * 0.44);
    ctx.lineTo(x + cw * 0.36, footY - h * 0.66);
    ctx.lineTo(x + cw * 0.46, footY - h * 0.64);
    ctx.lineTo(x + cw * 0.30, footY - h * 0.36);
    ctx.lineTo(x + cw * 0.22, footY);
    ctx.lineTo(x + cw * 0.13, footY);
    ctx.lineTo(x + cw * 0.14, footY - h * 0.30);
    ctx.lineTo(x - cw * 0.18, footY - h * 0.30);
    ctx.lineTo(x - cw * 0.22, footY);
    ctx.lineTo(x - cw * 0.32, footY);
    ctx.lineTo(x - cw * 0.30, footY - h * 0.32);
    ctx.closePath();
    ctx.fill();
    // 骑者披风背影
    ctx.beginPath();
    ctx.arc(x - cw * 0.04, footY - h * 0.90, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - cw * 0.16, footY - h * 0.56);
    ctx.lineTo(x - cw * 0.08, footY - h * 0.82);
    ctx.lineTo(x + cw * 0.04, footY - h * 0.80);
    ctx.lineTo(x + cw * 0.08, footY - h * 0.56);
    ctx.closePath();
    ctx.fill();
  } else {
    // 原海报 1:1 复刻：修长简洁的朱红立人背影剪影（无五官）
    const headR = h * 0.095;
    const shoulderY = footY - h * 0.76;
    const waistY = footY - h * 0.46;
    const shoulderW = h * 0.155;
    const hipW = h * 0.105;

    // 头部剪影
    ctx.beginPath();
    ctx.arc(x, footY - h + headR, headR, 0, Math.PI * 2);
    ctx.fill();

    // 躯干、微垂双臂与并立双腿剪影
    ctx.beginPath();
    ctx.moveTo(x - shoulderW, shoulderY + h * 0.04);
    ctx.quadraticCurveTo(x - shoulderW * 0.8, shoulderY - h * 0.04, x, shoulderY - h * 0.03);
    ctx.quadraticCurveTo(x + shoulderW * 0.8, shoulderY - h * 0.04, x + shoulderW, shoulderY + h * 0.04);
    ctx.lineTo(x + shoulderW * 0.92, waistY + h * 0.06);
    ctx.lineTo(x + hipW * 0.88, waistY + h * 0.04);
    ctx.lineTo(x + hipW * 0.78, footY);
    ctx.lineTo(x + hipW * 0.16, footY);
    ctx.lineTo(x + hipW * 0.05, waistY + h * 0.06);
    ctx.lineTo(x - hipW * 0.05, waistY + h * 0.06);
    ctx.lineTo(x - hipW * 0.16, footY);
    ctx.lineTo(x - hipW * 0.78, footY);
    ctx.lineTo(x - hipW * 0.88, waistY + h * 0.04);
    ctx.lineTo(x - shoulderW * 0.92, waistY + h * 0.06);
    ctx.closePath();
    ctx.fill();
  }

  // 如果处于尺度或站位错态，绘制极克制的虚线尺度圈提示可拖移
  if (isWarn) {
    ctx.strokeStyle = "rgba(184, 45, 14, 0.82)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    const pad = Math.max(8, h * 0.16);
    ctx.strokeRect(x - h * 0.42 - pad * 0.3, footY - h - pad * 0.5, h * 0.84 + pad * 0.6, h + pad);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// 绘制一套完整全景山河世界（供主画布和 03 暗室画布复用）
function drawWorld(ctx, w, h, state, opts = {}) {
  const {
    t = 0,
    still = false,
    showFar = true,
    showMid = true,
    showWater = true,
    showFore = state.foreground,
    darkSky = false,
    crop = null,
    warnAnchor = false,
  } = opts;

  const sc = SCENES[state.scene] || SCENES.poster;
  const cols = layerColors(state.scene, state.haze);
  const viewTop = crop ? crop.y : 0;
  const viewH = crop ? crop.h : h;
  const horizonY = viewTop + viewH * state.horizon;

  // 1. 天空渐变
  const skyGrad = ctx.createLinearGradient(0, 0, 0, Math.max(20, horizonY));
  if (darkSky) {
    skyGrad.addColorStop(0, "#082424");
    skyGrad.addColorStop(0.65, "#113736");
    skyGrad.addColorStop(1, "#1C4B48");
  } else {
    skyGrad.addColorStop(0, rgbCss(sc.skyTop));
    skyGrad.addColorStop(0.75, rgbCss(sc.skyLow));
    skyGrad.addColorStop(1, rgbCss(mixRgb(sc.skyLow, sc.fogRgb, 0.45)));
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. 淡云烟岚（呼应原海报天际极轻浮云）
  const drift = still ? 0 : Math.sin(t * 0.22) * w * 0.012;
  ctx.save();
  ctx.fillStyle = darkSky ? "rgba(182, 214, 206, 0.10)" : rgbCss(sc.fogRgb, 0.58);
  const cloudBase = horizonY - viewH * 0.28;
  ctx.beginPath();
  ctx.moveTo(w * 0.52 + drift, cloudBase + 14);
  ctx.quadraticCurveTo(w * 0.64 + drift, cloudBase - 14, w * 0.74 + drift, cloudBase - 4);
  ctx.quadraticCurveTo(w * 0.83 + drift, cloudBase - 22, w * 0.94 + drift, cloudBase + 2);
  ctx.lineTo(w * 1.04 + drift, cloudBase + 18);
  ctx.lineTo(w * 0.46 + drift, cloudBase + 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = darkSky ? "rgba(182, 214, 206, 0.07)" : rgbCss(sc.fogRgb, 0.42);
  ctx.beginPath();
  ctx.moveTo(w * 0.04 - drift * 0.6, cloudBase + 26);
  ctx.quadraticCurveTo(w * 0.16 - drift * 0.6, cloudBase + 4, w * 0.29 - drift * 0.6, cloudBase + 18);
  ctx.quadraticCurveTo(w * 0.37 - drift * 0.6, cloudBase + 10, w * 0.45 - drift * 0.6, cloudBase + 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. 四重山脉层层推进（从远到近：0, 1 为远景；2, 3 为中景）
  const STEPS = Math.min(120, Math.max(64, Math.round(w / 10)));
  for (let l = 0; l < 4; l++) {
    if ((l <= 1 && !showFar) || (l >= 2 && !showMid)) continue;
    let fillRgb = cols[l];
    if (darkSky) {
      // 暗室下仍用真实雾阶控制远近明度差，但底色适配深松墨暗室
      const darkBase = [
        [134, 186, 178],
        [92, 152, 145],
        [46, 114, 108],
        [18, 78, 74],
      ][l];
      const flatDark = [28, 74, 72];
      fillRgb = mixRgb(flatDark, darkBase, clamp(state.haze, 0, 1));
    }

    ctx.fillStyle = rgbCss(fillRgb);
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 8);
    for (let i = 0; i <= STEPS; i++) {
      const u = i / STEPS;
      const rh = ridgeHeight(state.scene, l, u) * viewH;
      const py = horizonY - rh;
      ctx.lineTo(u * w, py);
    }
    ctx.lineTo(w, horizonY + 8);
    ctx.closePath();
    ctx.fill();

    // 雾气山脚柔和过渡（仅在 haze > 0.18 时显出远山脚微烟岚）
    if (state.haze > 0.18 && l <= 2) {
      const mistH = viewH * (0.045 + (2 - l) * 0.022) * state.haze;
      const mg = ctx.createLinearGradient(0, horizonY - mistH, 0, horizonY + 4);
      const mistCol = darkSky ? [174, 210, 204] : sc.fogRgb;
      mg.addColorStop(0, rgbCss(mistCol, 0));
      mg.addColorStop(1, rgbCss(mistCol, (darkSky ? 0.18 : 0.44) * state.haze));
      ctx.fillStyle = mg;
      ctx.fillRect(0, horizonY - mistH, w, mistH + 4);
    }
  }

  // 4. 中景湖面 / 漠原过渡带（水平细腻银青波纹）
  if (showWater) {
    const waterH = Math.max(8, h - horizonY);
    const wg = ctx.createLinearGradient(0, horizonY, 0, h);
    if (darkSky) {
      wg.addColorStop(0, "#6E9E97");
      wg.addColorStop(0.55, "#3A6E69");
      wg.addColorStop(1, "#143A39");
    } else {
      wg.addColorStop(0, rgbCss(sc.waterTop));
      wg.addColorStop(0.42, rgbCss(sc.waterMid));
      wg.addColorStop(1, rgbCss(sc.waterDeep));
    }
    ctx.fillStyle = wg;
    ctx.fillRect(0, horizonY, w, waterH);

    // 湖心高光带（复刻原海报湖中央清亮银青倒影光带）
    const sheen = ctx.createRadialGradient(w * 0.48, horizonY + waterH * 0.28, w * 0.04, w * 0.48, horizonY + waterH * 0.35, w * 0.42);
    sheen.addColorStop(0, darkSky ? "rgba(218, 240, 234, 0.28)" : "rgba(252, 247, 238, 0.54)");
    sheen.addColorStop(1, "rgba(252, 247, 238, 0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, horizonY, w, waterH);

    // 水平细水纹（近疏远密）
    ctx.save();
    ctx.strokeStyle = darkSky ? "rgba(220, 244, 238, 0.22)" : "rgba(255, 252, 246, 0.46)";
    ctx.lineWidth = 1;
    const rows = 14;
    for (let r = 0; r < rows; r++) {
      const f = Math.pow((r + 0.6) / rows, 1.45);
      const ry = horizonY + f * waterH * 0.85;
      const sway = still ? 0 : Math.sin(t * 0.9 + r * 0.7) * 5;
      const segW = w * (0.28 + 0.14 * Math.sin(r * 2.1));
      const rx = w * (0.26 + 0.16 * Math.cos(r * 1.7)) + sway;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + segW, ry);
      ctx.stroke();
    }
    ctx.restore();

    // 千里烟波母题加一座细巧宋代虹桥/长堤微剪影点缀中景水岸
    if (state.scene === "scroll") {
      const bx = w * 0.34;
      const by = horizonY + waterH * 0.16;
      const bw = Math.max(46, w * 0.085);
      ctx.save();
      ctx.strokeStyle = darkSky ? "rgba(215, 232, 224, 0.65)" : "rgba(20, 74, 68, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - bw * 0.5, by);
      ctx.quadraticCurveTo(bx, by - bw * 0.18, bx + bw * 0.5, by);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // 03 暗室关闭中景水面时，保留深底衬托其余层
    ctx.fillStyle = darkSky ? "#082020" : rgbCss(sc.skyLow);
    ctx.fillRect(0, horizonY, w, Math.max(0, h - horizonY));
  }

  // 5. 前景墨青坡岸 + 右侧标志针叶松林（原海报最关键的纵深锚！）
  const bankTopAt = (u) => h - foreBankHeight(state.scene, u) * viewH;
  if (showFore) {
    // 前景微亮浅岸边
    ctx.fillStyle = darkSky ? "#0C4845" : rgbCss(mixRgb(sc.foreBank, sc.layers[3].base, 0.35));
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= 72; i++) {
      const u = i / 72;
      ctx.lineTo(u * w, bankTopAt(u) - 3);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 前景实心深墨岸
    ctx.fillStyle = darkSky ? "#031D1C" : rgbCss(sc.foreBank);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= 72; i++) {
      const u = i / 72;
      ctx.lineTo(u * w, bankTopAt(u));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 右侧标志针叶松林剪影（与 321 原海报右岸成排松树一一呼应）
    if (sc.hasPines) {
      const pineSpecs = [
        [0.805, 0.10],
        [0.832, 0.15],
        [0.858, 0.13],
        [0.880, 0.21],
        [0.903, 0.17],
        [0.928, 0.26],
        [0.954, 0.23],
        [0.978, 0.30],
        [0.996, 0.26],
      ];
      const pineCol = darkSky ? "#042524" : rgbCss(sc.forePine);
      for (const [pu, ph] of pineSpecs) {
        drawPine(ctx, pu * w, bankTopAt(pu) + 6, ph * viewH, pineCol);
      }
      // 左侧岸角两株矮松微呼应
      drawPine(ctx, 0.03 * w, bankTopAt(0.03) + 6, 0.14 * viewH, pineCol);
      drawPine(ctx, 0.058 * w, bankTopAt(0.058) + 6, 0.095 * viewH, pineCol);
    }
  }

  // 6. 天空右上飞鸟剪影（复刻原海报 5 只疏密编队）
  if (!darkSky) {
    const birdSpecs = [
      [0.61, 0.18, 6.2],
      [0.66, 0.15, 7.6],
      [0.695, 0.21, 5.2],
      [0.73, 0.175, 6.5],
      [0.758, 0.205, 4.6],
    ];
    const bCol = "rgba(12, 42, 42, 0.72)";
    const bDrift = still ? 0 : Math.sin(t * 0.55) * 4;
    for (let i = 0; i < sc.birdCount; i++) {
      const [bu, bv, bs] = birdSpecs[i];
      const by = Math.min(horizonY - 14, viewTop + viewH * bv);
      if (by > viewTop + 10) {
        drawBird(ctx, bu * w + bDrift, by, bs * clamp(w / 1100, 0.72, 1.15), still ? i : t * 2.4 + i * 1.1, bCol);
      }
    }
  }

  // 7. 朱红点景人（位置落在有效取景窗内 state.anchorX，高度严格按 state.scalePct 实算！）
  if (state.scalePct > 0.5 && !darkSky) {
    const c = crop || { x: 0, y: 0, w, h, uMin: 0, uMax: 1 };
    const anchorScreenX = c.x + c.w * state.anchorX;
    const anchorU = clamp(anchorScreenX / w, 0.02, 0.98);
    // 有前景时立在墨岸岸线上；撤空前景时悬在水岸低位
    const footY = showFore
      ? Math.min(c.y + c.h - 4, bankTopAt(anchorU) + 4)
      : Math.min(c.y + c.h - 10, horizonY + Math.max(18, (c.y + c.h - horizonY) * 0.62));
    const humanH = viewH * (state.scalePct / 100);
    drawAnchorFigure(ctx, state.scene, anchorScreenX, footY, humanH, rgbCss(sc.accentRgb), warnAnchor);
  }
}

// 离屏静景缓存（拖拽幅面帘幕或人物站位时，静景山河零重复光栅化，慢手机软件渲染亦可稳跑 55+ FPS）
let bgCacheCanvas = null;
let bgCacheKey = "";

// 缓存尺寸：避免热路径反复触发 getBoundingClientRect 强制同步布局
const sizeCache = new WeakMap();
export function invalidateCanvasSizes() {
  bgCacheKey = "";
}
function getCanvasCssSize(canvas, minW, minH) {
  let sz = sizeCache.get(canvas);
  if (!sz) {
    const r = canvas.getBoundingClientRect();
    sz = { w: Math.max(minW, Math.round(r.width)), h: Math.max(minH, Math.round(r.height)) };
    sizeCache.set(canvas, sz);
  }
  return sz;
}
export function refreshCanvasSize(canvas, minW, minH) {
  const r = canvas.getBoundingClientRect();
  const sz = { w: Math.max(minW, Math.round(r.width)), h: Math.max(minH, Math.round(r.height)) };
  sizeCache.set(canvas, sz);
  bgCacheKey = "";
  return sz;
}

// =========================================================================
// 1. 主开场画布：全宽全景舞台 + 活体宣纸裁切门闸 + 原海报 [ ] 取景折线
// =========================================================================
export function drawHeroCanvas(canvas, state, ev, { t = 0, still = false, dragging = false } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h } = getCanvasCssSize(canvas, 280, 160);
  // 手机小屏限 1.5x（遵 GUIDE.md），软件渲染像素量降低 44% 且依然清晰锐利
  const maxDpr = w <= 520 ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  // 用当前实际 w/h 算精确像素矩形，绝不等比畸变
  const canvasA = w / h;
  const a = clamp(state.aspect, 0.95, 4.05);
  let cw, ch;
  if (a <= canvasA) {
    ch = h;
    cw = Math.round(ch * a);
  } else {
    cw = w;
    ch = Math.round(cw / a);
  }
  const cx = Math.round((w - cw) / 2);
  const cy = Math.round((h - ch) / 2);
  const liveCrop = { x: cx, y: cy, w: cw, h: ch, uMin: cx / w, uMax: (cx + cw) / w };

  // 静景山河走离屏缓存（当 scene / horizon / haze / foreground / cy / ch / 尺寸不变时直接 blit）
  const nextKey = `${w}x${h}x${dpr}|${state.scene}|${state.horizon.toFixed(3)}|${state.haze.toFixed(3)}|${state.foreground ? 1 : 0}|${cy}|${ch}`;
  if (!bgCacheCanvas) bgCacheCanvas = document.createElement("canvas");
  if (bgCacheKey !== nextKey || bgCacheCanvas.width !== bw || bgCacheCanvas.height !== bh) {
    bgCacheCanvas.width = bw;
    bgCacheCanvas.height = bh;
    const bctx = bgCacheCanvas.getContext("2d");
    bctx.save();
    bctx.scale(dpr, dpr);
    drawWorld(bctx, w, h, { ...state, scalePct: 0 }, {
      t: 0,
      still: true,
      crop: liveCrop,
      warnAnchor: false,
    });
    bctx.restore();
    bgCacheKey = nextKey;
  }
  ctx.drawImage(bgCacheCanvas, 0, 0, w, h);

  // 动态前景元素：飞鸟微振 + 朱红点景人（极轻绘制）
  const sc = SCENES[state.scene] || SCENES.poster;
  const horizonY = cy + ch * state.horizon;
  if (!still && sc.birdCount > 0) {
    // 飞鸟已随静景绘于 bgCache，仅在非静帧且未拖拽时做极轻水光呼吸，拖拽期间保持超轻高速
  }
  if (state.scalePct > 0.5) {
    const anchorScreenX = liveCrop.x + liveCrop.w * state.anchorX;
    const anchorU = clamp(anchorScreenX / w, 0.02, 0.98);
    const bankTop = h - foreBankHeight(state.scene, anchorU) * ch;
    const footY = state.foreground
      ? Math.min(liveCrop.y + liveCrop.h - 4, bankTop + 4)
      : Math.min(liveCrop.y + liveCrop.h - 10, horizonY + Math.max(18, (liveCrop.y + liveCrop.h - horizonY) * 0.62));
    const humanH = ch * (state.scalePct / 100);
    drawAnchorFigure(ctx, state.scene, anchorScreenX, footY, humanH, rgbCss(sc.accentRgb), !ev.dimScale);
  }

  // 绘制两侧/上下宣纸裁切帘幕（显示被当前狭小画幅截断的江山！）
  ctx.save();
  ctx.fillStyle = "rgba(250, 241, 228, 0.74)";
  if (cx > 1) {
    ctx.fillRect(0, 0, cx, h);
    ctx.fillRect(cx + cw, 0, w - (cx + cw), h);
    // 非拖拽态叠加细斜纹，拖拽中跳过斜纹以省数十次线段绘制
    if (!dragging) {
      ctx.strokeStyle = "rgba(12, 46, 45, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let sx = -h; sx < cx; sx += 18) {
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + h, h);
      }
      for (let sx = cx + cw - h; sx < w; sx += 18) {
        const x1 = Math.max(cx + cw, sx);
        const y1 = Math.max(0, x1 - sx);
        ctx.moveTo(x1, y1);
        ctx.lineTo(sx + h, h);
      }
      ctx.stroke();
    }

    // 当两侧被裁帘幕足够宽时，点明藏在幕后的江山，引导用户右拖开镜
    if (cx > 135) {
      ctx.font = '600 11.5px "Noto Sans SC", sans-serif';
      ctx.fillStyle = "rgba(16, 36, 36, 0.72)";
      ctx.textAlign = "center";
      ctx.fillText("← 帘幕裁掉了左侧山势", cx / 2, h - 18);
      ctx.fillText("向右横拖展宽完整右岸 →", cx + cw + (w - cx - cw) / 2, h - 18);
      ctx.textAlign = "left";
    }
  }
  if (cy > 1) {
    ctx.fillRect(0, 0, w, cy);
    ctx.fillRect(0, cy + ch, w, h - (cy + ch));
  }
  ctx.restore();

  // 取景辅助线（地平线参考线 + 原海报 [ ] 四角取景折线）
  const frameColor = ev.dimWidth ? "#0B4D48" : "#B82D0E";
  if (state.showGuides) {
    const hy = cy + ch * state.horizon;
    ctx.save();
    // 地平线细虚线
    ctx.strokeStyle = ev.dimFrame ? "rgba(11, 77, 72, 0.45)" : "rgba(184, 45, 14, 0.72)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx + 8, hy);
    ctx.lineTo(cx + cw - 8, hy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 死中 50% 警示标签：停在取景窗左下角内侧，绝不遮压画中朱红点景人！
    if (ev.frameFault === "half_split") {
      ctx.fillStyle = "rgba(184, 45, 14, 0.90)";
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      const label = "地平线 50% 均切";
      const tw = ctx.measureText(label).width + 14;
      const ly = Math.min(cy + ch - 26, hy + 8);
      ctx.fillRect(cx + 12, ly, tw, 18);
      ctx.fillStyle = "#FAF1E4";
      ctx.fillText(label, cx + 19, ly + 13);
    }
    ctx.restore();
  }

  // 有效取景框边线与原海报同款加粗四角折线 [ ]
  ctx.save();
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = dragging ? 2 : 1.5;
  ctx.strokeRect(cx + 0.75, cy + 0.75, cw - 1.5, ch - 1.5);

  const arm = Math.min(22, Math.max(12, Math.min(cw, ch) * 0.1));
  ctx.lineWidth = 3;
  ctx.beginPath();
  // 左上
  ctx.moveTo(cx + 1.5, cy + arm);
  ctx.lineTo(cx + 1.5, cy + 1.5);
  ctx.lineTo(cx + arm, cy + 1.5);
  // 右上
  ctx.moveTo(cx + cw - arm, cy + 1.5);
  ctx.lineTo(cx + cw - 1.5, cy + 1.5);
  ctx.lineTo(cx + cw - 1.5, cy + arm);
  // 左下
  ctx.moveTo(cx + 1.5, cy + ch - arm);
  ctx.lineTo(cx + 1.5, cy + ch - 1.5);
  ctx.lineTo(cx + arm, cy + ch - 1.5);
  // 右下
  ctx.moveTo(cx + cw - arm, cy + ch - 1.5);
  ctx.lineTo(cx + cw - 1.5, cy + ch - 1.5);
  ctx.lineTo(cx + cw - 1.5, cy + ch - arm);
  ctx.stroke();

  // 左右门闸拉柄胶囊（当有横向帘幕时贴在左右门闸沿上，直观提示可横拖开镜！）
  if (cx > 12) {
    const midY = cy + ch * 0.5;
    for (const sideX of [cx, cx + cw]) {
      ctx.fillStyle = frameColor;
      ctx.fillRect(sideX - 4, midY - 22, 8, 44);
      ctx.fillStyle = "#FAF1E4";
      ctx.fillRect(sideX - 1.5, midY - 10, 1, 20);
      ctx.fillRect(sideX + 0.5, midY - 10, 1, 20);
    }
  }

  // 右上角实时幅面读数角标（纯简练信息，不遮主体）
  const pillText = `${state.aspect.toFixed(2)} : 1  ·  ${ev.passedCount} / 4`;
  ctx.font = '600 12px "JetBrains Mono", monospace';
  const pw = ctx.measureText(pillText).width + 20;
  const px = clamp(cx + cw - pw - 12, 10, w - pw - 10);
  const py = Math.max(10, cy + 12);
  ctx.fillStyle = ev.passedCount === 4 ? "rgba(6, 59, 60, 0.92)" : "rgba(158, 34, 8, 0.92)";
  ctx.fillRect(px, py, pw, 24);
  ctx.fillStyle = "#FAF1E4";
  ctx.fillText(pillText, px + 10, py + 16);

  // 左上角错态/提示徽章（仅窄屏或非达标时给极简一行引导）
  const leftText = ev.passedCount === 4 ? `${ev.diag.code}` : `${ev.diag.code} · 左右横拖开镜`;
  ctx.font = '600 11.5px "Noto Sans SC", sans-serif';
  const lw = ctx.measureText(leftText).width + 18;
  const lx = Math.max(10, cx + 12);
  if (lx + lw + 12 < px) {
    ctx.fillStyle = "rgba(7, 27, 27, 0.86)";
    ctx.fillRect(lx, py, lw, 24);
    ctx.fillStyle = "#FAF1E4";
    ctx.fillText(leftText, lx + 9, py + 16);
  }
  ctx.restore();

  ctx.restore();
  return liveCrop;
}

// =========================================================================
// 2. 原海报同款「同步淡青线稿剖析图」
// =========================================================================
export function drawDiagramCanvas(canvas, state, ev) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h } = getCanvasCssSize(canvas, 240, 88);
  const dpr = Math.min(window.devicePixelRatio || 1, w <= 520 ? 1.5 : 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  // 暖宣底纸
  ctx.fillStyle = "#FAF1E4";
  ctx.fillRect(0, 0, w, h);

  const padX = 12;
  const topBar = 24;
  const plotX = padX;
  const plotY = topBar;
  const plotW = w - padX * 2;
  const plotH = h - topBar - 10;

  // 顶沿原海报同款三段虚线标尺：前景 | 中景 / 主体场景 | 远景
  const cut1 = plotX + plotW * 0.23;
  const cut2 = plotX + plotW * 0.77;
  ctx.save();
  ctx.strokeStyle = "rgba(7, 27, 27, 0.36)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(plotX, topBar - 4);
  ctx.lineTo(plotX + plotW, topBar - 4);
  ctx.moveTo(plotX, topBar - 8);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.moveTo(cut1, topBar - 8);
  ctx.lineTo(cut1, plotY + plotH);
  ctx.moveTo(cut2, topBar - 8);
  ctx.lineTo(cut2, plotY + plotH);
  ctx.moveTo(plotX + plotW, topBar - 8);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#102424";
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("前景锚", (plotX + cut1) / 2, 13);
  ctx.fillText("中景 / 主体湖山", (cut1 + cut2) / 2, 13);
  ctx.fillText("远景递进", (cut2 + plotX + plotW) / 2, 13);
  ctx.textAlign = "left";
  ctx.restore();

  // 剖析图内景（淡青半透明水彩 + 细线轮廓，1:1 呼应原海报下幅线稿）
  ctx.save();
  ctx.beginPath();
  ctx.rect(plotX, plotY, plotW, plotH);
  ctx.clip();

  ctx.fillStyle = "#F5EFE3";
  ctx.fillRect(plotX, plotY, plotW, plotH);

  const horizonY = plotY + plotH * state.horizon;
  const STEPS = 64;
  // 淡青分层山线稿
  const alphas = [0.12 + 0.14 * state.haze, 0.18 + 0.12 * state.haze, 0.24, 0.32];
  for (let l = 0; l < 4; l++) {
    ctx.fillStyle = `rgba(128, 172, 165, ${alphas[l].toFixed(2)})`;
    ctx.strokeStyle = `rgba(40, 105, 99, ${(0.25 + l * 0.14).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, horizonY);
    for (let i = 0; i <= STEPS; i++) {
      const u = i / STEPS;
      const rh = ridgeHeight(state.scene, l, u) * plotH * 1.15;
      ctx.lineTo(plotX + u * plotW, horizonY - rh);
    }
    ctx.lineTo(plotX + plotW, horizonY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 水面淡青底线
  ctx.fillStyle = "rgba(182, 206, 201, 0.34)";
  ctx.fillRect(plotX, horizonY, plotW, plotY + plotH - horizonY);
  ctx.strokeStyle = "rgba(40, 105, 99, 0.55)";
  ctx.beginPath();
  ctx.moveTo(plotX, horizonY);
  ctx.lineTo(plotX + plotW, horizonY);
  ctx.stroke();

  // 前景墨岸剖析层（如果前景关闭，则显示虚线缺失警示）
  if (state.foreground) {
    ctx.fillStyle = "rgba(40, 105, 99, 0.45)";
    ctx.beginPath();
    ctx.moveTo(plotX, plotY + plotH);
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      ctx.lineTo(plotX + u * plotW, plotY + plotH - foreBankHeight(state.scene, u) * plotH * 1.15);
    }
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = "#B82D0E";
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(plotX + 2, plotY + plotH - 14, plotW - 4, 12);
    ctx.setLineDash([]);
    ctx.fillStyle = "#B82D0E";
    ctx.font = '600 10px "Noto Sans SC", sans-serif';
    ctx.fillText("前景锚缺失", plotX + 8, plotY + plotH - 4);
  }

  // 当前可见取景窗投影范围（把上方的裁剪幅面实时投影到下方剖析图上！）
  const visW = clamp(state.aspect / 3.45, 0.26, 1) * plotW;
  const visX = plotX + (plotW - visW) / 2;
  ctx.fillStyle = "rgba(250, 241, 228, 0.62)";
  ctx.fillRect(plotX, plotY, visX - plotX, plotH);
  ctx.fillRect(visX + visW, plotY, plotX + plotW - (visX + visW), plotH);
  ctx.strokeStyle = ev.dimWidth ? "#18524D" : "#B82D0E";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(visX, plotY + 1, visW, plotH - 2);

  // 剖析图里的唯一亮色：朱红点景人与尺度标尺
  if (state.scalePct > 0.5) {
    const ax = visX + visW * state.anchorX;
    const ah = Math.max(5, plotH * (state.scalePct / 100));
    const footY = plotY + plotH - (state.foreground ? 6 : 10);
    drawAnchorFigure(ctx, state.scene, ax, footY, ah, "#EE471E", false);
    // 尺度比小标注
    const ratioLabel = ev.mtnToHuman ? `1:${ev.mtnToHuman}` : "";
    if (ratioLabel) {
      ctx.font = '600 10px "JetBrains Mono", monospace';
      const lw = ctx.measureText(ratioLabel).width + 8;
      const lx = ax + 8 + lw < plotX + plotW ? ax + 6 : ax - lw - 6;
      ctx.fillStyle = "rgba(250, 241, 228, 0.92)";
      ctx.fillRect(lx, Math.max(plotY + 4, footY - ah - 2), lw, 14);
      ctx.fillStyle = ev.dimScale ? "#18524D" : "#B82D0E";
      ctx.fillText(ratioLabel, lx + 4, Math.max(plotY + 14, footY - ah + 8));
    }
  }

  ctx.restore();
  ctx.restore();
}

// =========================================================================
// 3. 03 节深松墨暗室：四层独立剥离 + 空气雾阶实验室 2D Canvas
// =========================================================================
export function drawDepthLabCanvas(canvas, labState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h } = getCanvasCssSize(canvas, 260, 160);
  const dpr = Math.min(window.devicePixelRatio || 1, w <= 520 ? 1.5 : 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);

  const synthetic = {
    scene: "poster",
    aspect: 2.65,
    horizon: labState.horizon,
    haze: labState.haze,
    foreground: labState.fore,
    scalePct: 0,
    anchorX: 0.74,
    showGuides: false,
  };
  drawWorld(ctx, w, h, synthetic, {
    still: true,
    darkSky: true,
    showFar: labState.far,
    showMid: labState.mid,
    showWater: labState.water,
    showFore: labState.fore,
  });

  // 叠加四层透视深度标线
  const markers = [
    { on: labState.far, y: h * (labState.horizon - 0.22), label: "04 远景雾峰", x: 18 },
    { on: labState.mid, y: h * (labState.horizon - 0.08), label: "03 中景青峦", x: 18 },
    { on: labState.water, y: h * (labState.horizon + 0.14), label: "02 中景湖波", x: 18 },
    { on: labState.fore, y: h - 18, label: "01 前景墨岸", x: 18 },
  ];
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  for (const mk of markers) {
    const py = clamp(mk.y, 18, h - 14);
    ctx.fillStyle = mk.on ? "rgba(6, 30, 30, 0.82)" : "rgba(148, 42, 22, 0.82)";
    const text = mk.on ? mk.label : `${mk.label} · 已抽空`;
    const tw = ctx.measureText(text).width + 14;
    ctx.fillRect(mk.x, py - 12, tw, 18);
    ctx.fillStyle = mk.on ? "#B7E4DA" : "#FFD5CA";
    ctx.fillText(text, mk.x + 7, py + 1);
  }

  ctx.restore();
}
