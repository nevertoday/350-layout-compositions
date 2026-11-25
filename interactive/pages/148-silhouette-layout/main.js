import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BANDS,
  STAGE_H,
  STAGE_W,
  THEMES,
  clamp,
  createInitialState,
  evaluate,
  lerp,
  rgbCss,
  wcagContrast,
} from "./model.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ==================== HERO：剪影暗房排字台 ====================
const state = createInitialState();
let lastEval = evaluate(state);

// 平滑动画插值态（确保开场动画与拖动每帧顺滑，且在 reducedMotion 下一步到位）
const anim = {
  intro: 0,
  exposure: state.exposure,
  scale: state.scale,
  gapPx: state.gapPx,
  offsetX: state.offsetX,
  snipFlash: null, // { x, y, life }
};

const heroCanvas = $("#hero-canvas");
const ctx = heroCanvas.getContext("2d");
let needsDraw = true;

function resizeHeroCanvas() {
  const rect = heroCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const maxDpr = window.innerWidth <= 680 ? 1.25 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (heroCanvas.width !== w || heroCanvas.height !== h) {
    heroCanvas.width = w;
    heroCanvas.height = h;
    needsDraw = true;
  }
}

// 绘制剪影主体内部镂空（原海报右下反白植物叶枝 / 飞羽月弧 / 提琴音孔）
function drawInnerCutout(c, theme, paperColor, scale, offsetX, alpha) {
  if (alpha <= 0.02) return;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = paperColor;
  c.strokeStyle = paperColor;

  if (theme === "portrait") {
    // 复刻 148 原海报肩部暖白叶枝反白剪影（锚定右下肩腹，绝不越过外轮廓）
    const cx = STAGE_W - (STAGE_W * 0.145) * Math.min(1.12, 0.55 + scale * 0.45) + offsetX * STAGE_W * 0.6;
    const cy = STAGE_H * 0.99;
    const s = clamp(0.62 + scale * 0.36, 0.65, 1.15);
    c.translate(cx, cy);
    c.scale(s, s);

    c.lineWidth = 5;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-4, 8);
    c.bezierCurveTo(-2, -46, 6, -108, 18, -168);
    c.stroke();

    const leaves = [
      // [mx,my, cp1x,cp1y, cp2x,cp2y, tipx,tipy, cp3x,cp3y, cp4x,cp4y]
      [-2, -26, -34, -36, -64, -64, -76, -98, -36, -90, -10, -64],
      [4, -72, -22, -92, -42, -124, -46, -162, -12, -138, 2, -106],
      [2, -20, 34, -32, 68, -54, 86, -84, 50, -82, 22, -58],
      [10, -90, 36, -112, 60, -142, 68, -178, 36, -158, 16, -124],
      [14, -140, -6, -166, -14, -196, -8, -224, 16, -198, 22, -170],
    ];
    for (const l of leaves) {
      c.beginPath();
      c.moveTo(l[0], l[1]);
      c.bezierCurveTo(l[2], l[3], l[4], l[5], l[6], l[7]);
      c.bezierCurveTo(l[8], l[9], l[10], l[11], l[0], l[1]);
      c.fill();
    }
  } else if (theme === "bird") {
    const cx = STAGE_W - STAGE_W * 0.16 * Math.min(1.1, 0.58 + scale * 0.42) + offsetX * STAGE_W * 0.5;
    const cy = STAGE_H * 0.58;
    const s = clamp(0.65 + scale * 0.32, 0.7, 1.1);
    c.translate(cx, cy);
    c.scale(s, s);
    // 反白新月与细苇叶
    c.beginPath();
    c.arc(0, 0, 36, 0.25 * Math.PI, 1.68 * Math.PI, false);
    c.arc(13, -7, 30, 1.62 * Math.PI, 0.32 * Math.PI, true);
    c.closePath();
    c.fill();

    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(-10, 118);
    c.quadraticCurveTo(4, 64, 24, 14);
    c.stroke();
  } else {
    // 复古提琴反白优雅 f 音孔
    const cx = STAGE_W - STAGE_W * 0.14 * Math.min(1.1, 0.58 + scale * 0.42) + offsetX * STAGE_W * 0.5;
    const cy = STAGE_H * 0.62;
    const s = clamp(0.68 + scale * 0.3, 0.7, 1.08);
    c.translate(cx, cy);
    c.scale(s, s);
    c.lineWidth = 7;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-14, 62);
    c.bezierCurveTo(-30, 18, 12, -22, 6, -64);
    c.stroke();
    c.beginPath();
    c.arc(-14, 62, 10, 0, Math.PI * 2);
    c.arc(6, -64, 8, 0, Math.PI * 2);
    c.fill();
    c.fillRect(-15, -4, 18, 4);
  }
  c.restore();
}

// 绘制抢戏小杂影（可被用户直接在画布上点剪）
function drawClutterShape(c, clutter, fillColor, showRing) {
  c.save();
  c.translate(clutter.px, clutter.py);
  c.fillStyle = fillColor;

  if (clutter.kind === "bird") {
    c.beginPath();
    c.moveTo(-26, 2);
    c.quadraticCurveTo(-8, -16, 4, -2);
    c.quadraticCurveTo(16, -22, 28, -4);
    c.quadraticCurveTo(12, 0, 2, 10);
    c.quadraticCurveTo(-12, 2, -26, 2);
    c.closePath();
    c.fill();
  } else if (clutter.kind === "spire") {
    c.beginPath();
    c.moveTo(-22, 24);
    c.lineTo(-14, -4);
    c.lineTo(-6, -4);
    c.lineTo(0, -28);
    c.lineTo(6, -4);
    c.lineTo(15, -4);
    c.lineTo(22, 24);
    c.closePath();
    c.fill();
  } else if (clutter.kind === "cloud") {
    c.beginPath();
    c.arc(-10, 4, 12, 0, Math.PI * 2);
    c.arc(4, -2, 15, 0, Math.PI * 2);
    c.arc(17, 6, 10, 0, Math.PI * 2);
    c.fill();
  } else if (clutter.kind === "twig") {
    c.lineWidth = 6;
    c.strokeStyle = fillColor;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-22, 18);
    c.lineTo(18, -16);
    c.moveTo(-4, 3);
    c.lineTo(-16, -14);
    c.moveTo(4, -4);
    c.lineTo(20, 8);
    c.stroke();
  } else {
    // note
    c.beginPath();
    c.ellipse(-6, 12, 10, 7, -0.3, 0, Math.PI * 2);
    c.fill();
    c.fillRect(1, -20, 5, 32);
    c.beginPath();
    c.moveTo(4, -20);
    c.quadraticCurveTo(22, -16, 18, 2);
    c.lineTo(13, 0);
    c.quadraticCurveTo(15, -11, 4, -13);
    c.closePath();
    c.fill();
  }

  if (showRing) {
    c.strokeStyle = "rgba(166, 56, 34, 0.85)";
    c.lineWidth = 1.5;
    c.setLineDash([4, 3]);
    c.beginPath();
    c.arc(0, 0, clutter.r + 3, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    // 简洁点剪角标
    c.fillStyle = "#A63822";
    c.fillRect(-20, clutter.r - 4, 40, 16);
    c.fillStyle = "#FAF1E4";
    c.font = '600 10px "Noto Serif SC", serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("点剪 ×", 0, clutter.r + 4);
  }
  c.restore();
}

function renderHero(t, dt, { still }) {
  // 开场渐入动画（0.75 秒走完，每帧完整清晰；绝不在渲染帧内读 getBoundingClientRect 避免回流）
  const introTarget = 1;
  if (still) {
    anim.intro = 1;
    anim.exposure = state.exposure;
    anim.scale = state.scale;
    anim.gapPx = state.gapPx;
    anim.offsetX = state.offsetX;
    anim.snipFlash = null;
  } else {
    const k = dt > 0 ? Math.min(1, dt * 13) : 0.25;
    anim.intro = Math.min(introTarget, anim.intro + (dt > 0 ? dt * 1.45 : 0.08));
    anim.exposure = lerp(anim.exposure, state.exposure, k);
    anim.scale = lerp(anim.scale, state.scale, k);
    anim.gapPx = lerp(anim.gapPx, state.gapPx, k);
    anim.offsetX = lerp(anim.offsetX, state.offsetX, k);
    if (anim.snipFlash) {
      anim.snipFlash.life -= dt > 0 ? dt * 2.6 : 0.04;
      if (anim.snipFlash.life <= 0) anim.snipFlash = null;
    }
  }

  const moving =
    anim.intro < 0.999 ||
    Math.abs(anim.exposure - state.exposure) > 0.08 ||
    Math.abs(anim.scale - state.scale) > 0.002 ||
    Math.abs(anim.gapPx - state.gapPx) > 0.1 ||
    Math.abs(anim.offsetX - state.offsetX) > 0.0005 ||
    !!anim.snipFlash;

  if (!needsDraw && !moving && !still) return;
  needsDraw = false;

  // 用当前插值后的姿态求同源几何，确保画布与模型帧帧一致
  const drawState = {
    ...state,
    exposure: anim.exposure,
    scale: anim.scale,
    gapPx: anim.gapPx,
    offsetX: anim.offsetX,
  };
  const ev = evaluate(drawState);
  const { tone, geom, text } = ev;
  const th = THEMES[state.theme] || THEMES.portrait;

  const cw = heroCanvas.width;
  const ch = heroCanvas.height;
  ctx.save();
  ctx.scale(cw / STAGE_W, ch / STAGE_H);

  // 1. 暖米宣纸底色
  const paperCss = rgbCss(tone.paperRgb);
  const inkCss = rgbCss(tone.inkRgb);
  const oliveCss = rgbCss(tone.oliveRgb);
  ctx.fillStyle = paperCss;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  // 2. 低显影时的背景斜纹杂讯（向右推显影尺时平滑抽离清空）
  if (tone.noiseAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = tone.noiseAlpha * 0.28;
    ctx.strokeStyle = "#8C8678";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -STAGE_H; x < STAGE_W + STAGE_H; x += 18) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + STAGE_H * 0.65, STAGE_H);
    }
    ctx.stroke();
    // 几块灰雾杂景斑块
    ctx.fillStyle = "#B5AEA0";
    ctx.beginPath();
    ctx.arc(170, 140, 88, 0, Math.PI * 2);
    ctx.arc(310, 390, 112, 0, Math.PI * 2);
    ctx.arc(92, 430, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. 右上干橄榄绿角块（复刻 148 原海报右上角 + 小白圆点 + 三条竖线白字要点）
  const introSlide = (1 - Math.pow(1 - anim.intro, 3)) * 0 + (1 - anim.intro) * 28;
  ctx.save();
  ctx.translate(introSlide, 0);

  ctx.beginPath();
  ctx.moveTo(geom.backPx[0][0], 0);
  ctx.lineTo(STAGE_W, 0);
  ctx.lineTo(STAGE_W, geom.backPx[geom.backPx.length - 1][1]);
  for (let i = geom.backPx.length - 1; i >= 0; i--) {
    ctx.lineTo(geom.backPx[i][0], geom.backPx[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = oliveCss;
  ctx.fill();

  // 原海报右上角小暖白圆点与三条右对齐要点（随橄榄块大小自动避让）
  ctx.fillStyle = paperCss;
  ctx.beginPath();
  ctx.arc(STAGE_W - 26, 28, 4.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(250, 241, 228, 0.72)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(STAGE_W - 22, 54);
  ctx.lineTo(STAGE_W - 22, 174);
  ctx.stroke();

  ctx.fillStyle = paperCss;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  th.points.forEach((pt, idx) => {
    const py = 64 + idx * 42;
    ctx.font = '600 11.5px "Noto Serif SC", serif';
    ctx.fillText(pt[0], STAGE_W - 30, py);
    ctx.font = '400 10.5px "Noto Serif SC", serif';
    ctx.fillText(pt[1], STAGE_W - 30, py + 15);
  });

  // 4. 剪影主体路径（低显影时用轻量偏移描边模拟柔边，零 ctx.filter 保证软件渲染 60fps）
  const silPath = new Path2D();
  silPath.moveTo(geom.edgePx[0][0], geom.edgePx[0][1]);
  for (let i = 1; i < geom.edgePx.length; i++) {
    silPath.lineTo(geom.edgePx[i][0], geom.edgePx[i][1]);
  }
  silPath.lineTo(STAGE_W, STAGE_H);
  silPath.lineTo(STAGE_W, geom.backPx[geom.backPx.length - 1][1]);
  for (let i = geom.backPx.length - 1; i >= 0; i--) {
    silPath.lineTo(geom.backPx[i][0], geom.backPx[i][1]);
  }
  silPath.closePath();

  if (tone.edgeBlur > 0.6) {
    ctx.save();
    ctx.strokeStyle = rgbCss(tone.inkRgb, 0.24);
    ctx.lineWidth = tone.edgeBlur * 2.1;
    ctx.lineJoin = "round";
    ctx.stroke(silPath);
    ctx.restore();
  }
  ctx.fillStyle = inkCss;
  ctx.fill(silPath);

  // 低显影态：在主体内部画几道灰扑扑的未提纯明暗杂带（绝无五官），推高显影后彻底压平消失
  if (tone.noiseAlpha > 0.06) {
    ctx.save();
    ctx.clip(silPath);
    ctx.globalAlpha = tone.noiseAlpha * 0.42;
    ctx.fillStyle = "#C9C2B4";
    ctx.beginPath();
    ctx.ellipse(STAGE_W * 0.72, STAGE_H * 0.34, 72, 110, -0.35, 0, Math.PI * 2);
    ctx.ellipse(STAGE_W * 0.68, STAGE_H * 0.76, 94, 62, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#DED8CB";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = 52; y < STAGE_H; y += 54) {
      ctx.moveTo(STAGE_W * 0.42, y);
      ctx.lineTo(STAGE_W, y - 40);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 影内反白叶枝/月弧/音孔镂空（锚定肩腹内安全区，免二次复杂多边形裁剪以稳住软件渲染帧率）
  if (state.cutout) {
    const cutoutAlpha = clamp((anim.exposure - 24) / 48, 0, 1);
    drawInnerCutout(ctx, state.theme, paperCss, anim.scale, anim.offsetX, cutoutAlpha);
  }

  // 呼吸缝虚线引导弧（显示理论安全线）
  if (state.showCalipers) {
    ctx.save();
    const offsetGap = state.wrapMode === "contour" ? anim.gapPx : BANDS.gapSweet[0];
    ctx.strokeStyle =
      text.collidingCount > 0
        ? "rgba(166, 56, 34, 0.78)"
        : state.wrapMode === "contour" && ev.passShape
          ? "rgba(61, 90, 38, 0.65)"
          : "rgba(109, 106, 65, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < geom.edgePx.length; i += 2) {
      const gx = geom.edgePx[i][0] - offsetGap;
      const gy = geom.edgePx[i][1];
      if (i === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore(); // end introSlide

  // 5. 抢戏小杂影（存在时渲染，稍加深墨色确保灰雾态下也清晰可辨可剪）
  const clutterInk = rgbCss(
    [
      Math.max(36, Math.round(tone.inkRgb[0] * 0.72)),
      Math.max(36, Math.round(tone.inkRgb[1] * 0.72)),
      Math.max(36, Math.round(tone.inkRgb[2] * 0.72)),
    ],
  );
  for (const cl of geom.activeClutters) {
    drawClutterShape(ctx, cl, clutterInk, true);
  }

  // 剪除杂影瞬间的干脆闪光圆环
  if (anim.snipFlash) {
    ctx.save();
    ctx.strokeStyle = `rgba(109, 106, 65, ${clamp(anim.snipFlash.life, 0, 1)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(anim.snipFlash.x, anim.snipFlash.y, 18 + (1 - anim.snipFlash.life) * 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 6. 原海报左上小徽标与左下 5×4 橄榄点阵
  ctx.fillStyle = oliveCss;
  ctx.beginPath();
  ctx.arc(46, 32, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#242424";
  ctx.font = '600 11px "Noto Serif SC", serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("版式设计方法", 60, 29);
  ctx.fillStyle = "#4E4C29";
  ctx.font = '500 9px "IBM Plex Mono", monospace';
  ctx.fillText("LAYOUT PRINCIPLES", 60, 41);

  // 左下 5×4 橄榄绿点阵与细横线（单次路径合批，省 19 次 draw call）
  ctx.fillStyle = oliveCss;
  ctx.beginPath();
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 5; col++) {
      const dx = 44 + col * 10;
      const dy = 468 + r * 9;
      ctx.moveTo(dx + 1.8, dy);
      ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.strokeStyle = "rgba(109, 106, 65, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(40, 514);
  ctx.lineTo(226, 514);
  ctx.stroke();

  // 7. 逐行渲染由 model.js 单真源算出的文字层级与碰撞测绘
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let tightestRow = null;
  for (const row of text.rows) {
    if (!tightestRow || row.gap < tightestRow.gap) tightestRow = row;

    // 碰撞底纹警报
    if (row.gap < 0) {
      ctx.save();
      ctx.fillStyle = "rgba(166, 56, 34, 0.22)";
      ctx.fillRect(row.edgeX - 2, row.y - row.fontSize * 0.88, Math.max(12, row.x + row.width - row.edgeX + 6), row.fontSize * 1.12);
      ctx.strokeStyle = "#A63822";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(row.edgeX - 2, row.y - row.fontSize * 0.88, Math.max(12, row.x + row.width - row.edgeX + 6), row.fontSize * 1.12);
      ctx.restore();
    }

    if (row.kind === "title") {
      ctx.font = `900 ${row.fontSize}px "Noto Serif SC", serif`;
      ctx.fillStyle = "#242424";
    } else if (row.kind === "en") {
      ctx.font = `800 ${row.fontSize}px "Syne", sans-serif`;
      ctx.fillStyle = "#4E4C29";
    } else if (row.kind === "subhead") {
      ctx.font = `600 ${row.fontSize}px "Noto Serif SC", serif`;
      ctx.fillStyle = "#4E4C29";
      // 原海报同款短橄榄杠 + 细点虚线
      ctx.fillRect(row.x, row.y - 34, 38, 3.5);
      ctx.save();
      ctx.strokeStyle = "#6D6A41";
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(row.x, row.y + 12);
      ctx.lineTo(Math.min(row.edgeX - 10, row.x + 170), row.y + 12);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.font = `400 ${row.fontSize}px "Noto Serif SC", serif`;
      ctx.fillStyle = "#242424";
    }
    ctx.fillText(row.text, row.x, row.y);
  }

  // 最紧一行净距标尺（实测值直接标在轮廓边上）
  if (state.showCalipers && tightestRow) {
    const r = tightestRow;
    const xEnd = r.x + r.width;
    const cy = r.y - r.fontSize * 0.35;
    const isBad = r.gap < BANDS.gapMin || (state.wrapMode === "contour" && state.gapPx > BANDS.gapMax);
    const col = isBad ? "#A63822" : "#3D5A26";

    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xEnd, cy);
    ctx.lineTo(r.edgeX, cy);
    ctx.moveTo(xEnd, cy - 5);
    ctx.lineTo(xEnd, cy + 5);
    ctx.moveTo(r.edgeX, cy - 5);
    ctx.lineTo(r.edgeX, cy + 5);
    ctx.stroke();

    const label = r.gap < 0 ? `撞影 ${Math.round(r.gap)}px` : `净距 ${Math.round(r.gap)}px`;
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    const tw = ctx.measureText(label).width + 12;
    const bx = clamp((xEnd + r.edgeX) / 2 - tw / 2, 16, STAGE_W - tw - 16);
    const by = clamp(cy - 24, 14, STAGE_H - 28);
    ctx.fillRect(bx, by, tw, 18);
    ctx.fillStyle = "#FAF1E4";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + tw / 2, by + 9.5);
    ctx.restore();
  }

  // 8. 邮票缩影盲测窗（缩小至真实邮票比例实时检视外轮廓识别度）
  if (state.stampMode) {
    const sw = 104;
    const sh = 78;
    const sx = 40;
    const sy = 368;
    ctx.save();
    ctx.fillStyle = "#1F201F";
    ctx.fillRect(sx - 6, sy - 22, sw + 12, sh + 28);
    ctx.fillStyle = "#FAF1E4";
    ctx.font = '600 10px "Noto Serif SC", serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("邮票缩影盲测 (14%)", sx, sy - 11);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();
    ctx.translate(sx, sy);
    ctx.scale(sw / STAGE_W, sh / STAGE_H);
    ctx.fillStyle = paperCss;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = inkCss;
    ctx.fill(silPath);
    for (const cl of geom.activeClutters) {
      drawClutterShape(ctx, cl, inkCss, false);
    }
    ctx.restore();
    ctx.restore();
  }

  ctx.restore();
}

// ==================== 同步全页真源 DOM 读数 ====================
function syncUI() {
  lastEval = evaluate(state);
  const ev = lastEval;
  const pct = Math.round(state.exposure);
  const stampText = ev.passedCount === 4 ? "4 / 4 剪影成立" : `${ev.passedCount} / 4 待剪定`;
  const stampCls = ev.passedCount === 4 ? "is-ok" : ev.verdict.tone === "warn" ? "is-warn" : "is-bad";

  // 顶栏状态章 & 橄榄绿三要点灯
  for (const el of [$("#hero-stamp"), $("#mobile-badge")]) {
    el.textContent = stampText;
    el.className = `${el.id === "hero-stamp" ? "olive-stamp" : "mobile-badge"} ${stampCls}`;
  }
  $("#op-single").className = `op-item ${ev.passIdentity ? "is-ok" : "is-bad"}`;
  $("#op-wrap").className = `op-item ${ev.passShape ? "is-ok" : "is-bad"}`;
  $("#op-space").className = `op-item ${ev.passSpace ? "is-ok" : "is-bad"}`;

  // 逆光显影推光尺位置与读数
  $("#exp-blade").style.left = `${clamp(pct, 5, 95)}%`;
  $("#blade-num").textContent = `${pct}%`;
  $("#exp-readout").textContent = `显影 ${pct}% · 对比 ${ev.tone.contrast.toFixed(1)}:1`;
  const expTrack = $("#exp-track");
  expTrack.setAttribute("aria-valuenow", String(pct));
  $("#exp-range").value = String(pct);

  // 手机首屏一行快诊
  const mqvTag = $("#mqv-tag");
  mqvTag.textContent = ev.verdict.tag;
  mqvTag.className = `mqv-tag is-${ev.verdict.tone}`;
  $("#mqv-text").textContent = ev.verdict.title;

  // 深炭暗房完整诊单
  const dvTag = $("#dv-tag");
  dvTag.textContent = ev.verdict.tone === "ok" ? `达标 · ${ev.verdict.tag}` : `错态 · ${ev.verdict.tag}`;
  dvTag.className = `dv-tag is-${ev.verdict.tone}`;
  $("#dv-title").textContent = ev.verdict.title;
  $("#dv-body").textContent = ev.verdict.body;
  $("#dv-hint").textContent = ev.verdict.hint;

  $("#m-contrast").textContent = `${ev.tone.contrast.toFixed(1)}:1`;
  $("#m-shapes").textContent = ev.totalShapes === 1 ? "1 个（单一）" : `${ev.totalShapes} 个`;
  $("#m-gap").textContent = `${ev.text.minGapPx}px`;
  $("#m-area").textContent = `${ev.geom.silhouetteAreaPct}% / ${ev.paperWhitespacePct}%`;

  // 控件状态与单源数值同步
  $$("[data-theme]").forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $$("[data-wrap]").forEach((b) => {
    const on = b.dataset.wrap === state.wrapMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  $("#wrap-note").textContent =
    state.wrapMode === "rigid" ? "矩形硬切，文字易直撞轮廓" : "已开启沿轮廓曲线逐行绕排";

  const clutterBtn = $("#btn-clutter");
  const singleNow = ev.clutterCount === 0;
  clutterBtn.classList.toggle("is-active", singleNow);
  clutterBtn.setAttribute("aria-pressed", String(singleNow));
  clutterBtn.textContent = singleNow ? "已为单一形体" : "剪至单一形体";

  const cutoutBtn = $("#btn-cutout");
  cutoutBtn.classList.toggle("is-active", state.cutout);
  cutoutBtn.setAttribute("aria-pressed", String(state.cutout));

  const stampBtn = $("#btn-stamp");
  stampBtn.classList.toggle("is-active", state.stampMode);
  stampBtn.setAttribute("aria-pressed", String(state.stampMode));

  const calBtn = $("#btn-calipers");
  calBtn.classList.toggle("is-active", state.showCalipers);
  calBtn.setAttribute("aria-pressed", String(state.showCalipers));

  $("#gap-slider").value = String(state.gapPx);
  $("#gap-readout").textContent =
    state.wrapMode === "rigid"
      ? `硬框实测 ${ev.text.minGapPx}px（切绕排后生效）`
      : `${state.gapPx}px（经验 ${BANDS.gapSweet[0]}–${BANDS.gapSweet[1]}px）`;

  $("#scale-slider").value = String(state.scale);
  $("#scale-readout").textContent = `占地 ${ev.geom.silhouetteAreaPct}%（经验 ${BANDS.areaMin}%–${BANDS.areaMax}%）`;

  // 底沿四关键词印鉴带
  for (const key of ["shape", "space", "contrast", "identity"]) {
    const p = ev.pillars[key];
    $(`#kw-${key}`).className = `kw-item ${p.ok ? "is-ok" : "is-bad"}`;
    $(`#kws-${key}`).textContent = p.state;
  }

  needsDraw = true;
}

const heroLoop = loop(heroCanvas, renderHero);

function commitChange() {
  syncUI();
  heroLoop.draw();
}

// ---------- 主角横拖交互：逆光显影推光尺（鼠标 + 触屏 + 键盘） ----------
const expTrack = $("#exp-track");
let expDragging = false;
let expTrackRect = null;
let lastSyncedExp = -1;

function setExposureFromClientX(clientX) {
  const rect = expTrackRect || expTrack.getBoundingClientRect();
  if (!rect.width) return;
  const raw = Math.round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  if (raw === state.exposure) return;
  state.exposure = raw;
  // 拖动期间直接由 loop 的 rAF 合批重绘，避免单帧双绘；数值变化时同步 DOM
  if (raw !== lastSyncedExp) {
    lastSyncedExp = raw;
    syncUI();
  }
  if (reducedMotion.matches) heroLoop.draw();
}

expTrack.addEventListener("pointerdown", (e) => {
  expDragging = true;
  expTrackRect = expTrack.getBoundingClientRect();
  expTrack.setPointerCapture?.(e.pointerId);
  setExposureFromClientX(e.clientX);
});
expTrack.addEventListener("pointermove", (e) => {
  if (!expDragging) return;
  setExposureFromClientX(e.clientX);
});
const stopExpDrag = () => {
  expDragging = false;
  expTrackRect = null;
};
expTrack.addEventListener("pointerup", stopExpDrag);
expTrack.addEventListener("pointercancel", stopExpDrag);

// 额外兼容原始 touch 事件（缓存 rect 零回流，确保软件渲染 6× 降速下仍稳 ≥ 50 fps）
expTrack.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches[0]) {
      expDragging = true;
      expTrackRect = expTrack.getBoundingClientRect();
      setExposureFromClientX(e.touches[0].clientX);
    }
  },
  { passive: true },
);
expTrack.addEventListener(
  "touchmove",
  (e) => {
    if (expDragging && e.touches[0]) {
      setExposureFromClientX(e.touches[0].clientX);
    }
  },
  { passive: true },
);
expTrack.addEventListener("touchend", stopExpDrag, { passive: true });

expTrack.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 10 : 4;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.exposure = clamp(state.exposure + step, 0, 100);
    commitChange();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.exposure = clamp(state.exposure - step, 0, 100);
    commitChange();
  } else if (e.key === "Home") {
    e.preventDefault();
    state.exposure = 0;
    commitChange();
  } else if (e.key === "End") {
    e.preventDefault();
    state.exposure = 100;
    commitChange();
  }
});

// ---------- 画布直操：点按剪除杂影 + 横向轻拖主剪影微调重心 ----------
let canvasDrag = null;

function clientToStage(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * STAGE_W,
    y: ((clientY - rect.top) / rect.height) * STAGE_H,
  };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = clientToStage(e.clientX, e.clientY);
  // 优先命中抢戏杂影：一点即「咔嚓」剪掉
  for (const cl of lastEval.geom.activeClutters) {
    if (Math.hypot(pt.x - cl.px, pt.y - cl.py) <= cl.r + 14) {
      state.clutterMask[cl.index] = false;
      anim.snipFlash = { x: cl.px, y: cl.py, life: 1 };
      commitChange();
      return;
    }
  }
  // 否则若点在右侧主剪影区，允许横向轻拖微调重心
  if (pt.x >= lastEval.geom.edgeXAtY(pt.y) - 10) {
    canvasDrag = { startX: e.clientX, startOffset: state.offsetX };
    heroCanvas.setPointerCapture?.(e.pointerId);
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!canvasDrag) return;
  const rect = heroCanvas.getBoundingClientRect();
  const dx = (e.clientX - canvasDrag.startX) / Math.max(1, rect.width);
  state.offsetX = clamp(canvasDrag.startOffset + dx * 0.42, -0.06, 0.06);
  commitChange();
});

const stopCanvasDrag = () => {
  canvasDrag = null;
};
heroCanvas.addEventListener("pointerup", stopCanvasDrag);
heroCanvas.addEventListener("pointercancel", stopCanvasDrag);

// ---------- 控件绑定 ----------
$$("[data-theme]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    commitChange();
  }),
);
$$("[data-wrap]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.wrapMode = btn.dataset.wrap;
    commitChange();
  }),
);
$("#btn-clutter").addEventListener("click", () => {
  const anyOn = state.clutterMask.some(Boolean);
  state.clutterMask = anyOn ? [false, false] : [true, true];
  commitChange();
});
$("#btn-cutout").addEventListener("click", () => {
  state.cutout = !state.cutout;
  commitChange();
});
$("#btn-stamp").addEventListener("click", () => {
  state.stampMode = !state.stampMode;
  commitChange();
});
$("#btn-calipers").addEventListener("click", () => {
  state.showCalipers = !state.showCalipers;
  commitChange();
});
$("#btn-reset").addEventListener("click", () => {
  Object.assign(state, createInitialState());
  commitChange();
});
$("#gap-slider").addEventListener("input", (e) => {
  state.gapPx = Number(e.target.value);
  if (state.wrapMode === "rigid") state.wrapMode = "contour";
  commitChange();
});
$("#scale-slider").addEventListener("input", (e) => {
  state.scale = Number(e.target.value);
  commitChange();
});
$("#exp-range").addEventListener("input", (e) => {
  state.exposure = Number(e.target.value);
  commitChange();
});

window.addEventListener("resize", () => {
  resizeHeroCanvas();
  heroLoop.draw();
});

// ==================== 01 节：邮票盲测视距仪 ====================
const stampGrid = $("#stamp-grid");
const blackoutBtn = $("#btn-blackout");
let isBlackout = false;

$$("[data-dist]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const s = Number(btn.dataset.dist);
    $$("[data-dist]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$(".test-svg").forEach((svg) => {
      svg.style.transform = `scale(${s})`;
    });
  }),
);

blackoutBtn.addEventListener("click", () => {
  isBlackout = !isBlackout;
  stampGrid.dataset.blackout = String(isBlackout);
  blackoutBtn.classList.toggle("is-active", isBlackout);
  blackoutBtn.setAttribute("aria-pressed", String(isBlackout));
  blackoutBtn.textContent = isBlackout ? "压成纯黑剪影：开" : "压成纯黑剪影：关";
});

// ==================== 02 节：绕影排字四态解剖 ====================
const ANAT_DATA = {
  crash: {
    title: "矩形硬切：文字直接劈开鼻尖与唇线",
    desc: "把文字按默认矩形硬塞进左栏，右侧端头毫不避让地冲入炭黑侧影。结果是双输——鼻梁和唇部的关键识别拐点被切碎，越界字迹也因黑底黑字彻底消失。",
    caption: "红色框标出文字冲入剪影外沿的碰撞区：轮廓识别与阅读同时失效。",
    svg: `
      <rect x="208" y="138" width="66" height="44" fill="rgba(166,56,34,0.34)" stroke="#A63822" stroke-width="2"/>
      <rect x="208" y="212" width="58" height="50" fill="rgba(166,56,34,0.34)" stroke="#A63822" stroke-width="2"/>
      <text x="26" y="114" font-size="44" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">剪影构图</text>
      <text x="26" y="172" font-size="44" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">强烈视觉</text>
      <text x="26" y="232" font-size="15" font-weight="600" fill="#4E4C29" font-family="Noto Serif SC, serif">用矩形硬框直接横跨黑白边界</text>
      <text x="26" y="258" font-size="14" fill="#242424" font-family="Noto Serif SC, serif">文字与外轮廓发生大面积碰撞</text>
      <rect x="26" y="346" width="144" height="26" fill="#A63822"/>
      <text x="98" y="363" text-anchor="middle" font-size="12" font-weight="600" fill="#FAF1E4" font-family="Noto Serif SC, serif">净距 -42px · 撞毁鼻唇</text>
    `,
  },
  tight: {
    title: "死贴轮廓：字尾粘在黑边上，满屏发闷",
    desc: "虽然知道不能压黑，却把字边顶到距离黑影只剩 2–4px。黑白交界处的高对比会强烈吸走目光，导致读者看不清字尾、也喘不过气。",
    caption: "红色紧贴带显示字尾距黑影不足 4px，视觉边缘发粘拥挤。",
    svg: `
      <path d="M236 96 C236 126 248 140 240 162 C228 184 208 200 214 214 C228 222 234 234 232 252" fill="none" stroke="#A63822" stroke-width="6" opacity="0.45"/>
      <text x="112" y="118" font-size="46" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">剪影</text>
      <text x="116" y="174" font-size="46" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">版式</text>
      <text x="58" y="218" font-size="15" font-weight="600" fill="#4E4C29" font-family="Noto Serif SC, serif">以轮廓建立强识别主体</text>
      <text x="48" y="252" font-size="13.5" fill="#242424" font-family="Noto Serif SC, serif">字尾紧紧黏在黑影边界上</text>
      <text x="72" y="276" font-size="13.5" fill="#242424" font-family="Noto Serif SC, serif">完全没有喘息的空气带</text>
      <rect x="26" y="346" width="144" height="26" fill="#A63822"/>
      <text x="98" y="363" text-anchor="middle" font-size="12" font-weight="600" fill="#FAF1E4" font-family="Noto Serif SC, serif">净距 3px · 贴死窒息</text>
    `,
  },
  breath: {
    title: "左齐保稳，右尾顺着轮廓凹谷留出均匀气口",
    desc: "大标题立在额头前宽敞的暖白区，副标与导语顺着鼻梁、唇线到颈窝的起伏自然控制行宽，全程守住约 16–34px 的呼吸气口（经验值）。眼睛既能一口气读完左栏，又能余光完整欣赏右侧剪影的每一个拐点。",
    caption: "绿色虚线标出文字右端与剪影外沿之间均匀的呼吸气口带。",
    svg: `
      <path d="M192 20 C210 56 222 86 224 122 C226 144 236 154 226 176 C214 198 192 212 200 226 C214 232 222 242 216 254 C224 264 220 274 230 288 C236 300 244 316 268 326" fill="none" stroke="#3D5A26" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="28" y="114" font-size="48" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">剪影</text>
      <text x="28" y="172" font-size="48" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">版式</text>
      <text x="28" y="200" font-size="9.2" font-weight="800" letter-spacing="0.6" fill="#6D6A41" font-family="Syne, sans-serif">SILHOUETTE LAYOUT</text>
      <line x1="28" y1="216" x2="72" y2="216" stroke="#6D6A41" stroke-width="3"/>
      <text x="28" y="246" font-size="14.5" font-weight="600" fill="#4E4C29" font-family="Noto Serif SC, serif">以轮廓建立强识别</text>
      <text x="28" y="278" font-size="13.5" fill="#242424" font-family="Noto Serif SC, serif">用单一剪影集中注意，</text>
      <text x="28" y="302" font-size="13.5" fill="#242424" font-family="Noto Serif SC, serif">文字围绕形体展开，形成</text>
      <text x="28" y="326" font-size="13.5" fill="#242424" font-family="Noto Serif SC, serif">清晰的主体与留白关系。</text>
      <line x1="176" y1="274" x2="218" y2="274" stroke="#3D5A26" stroke-width="1.8"/>
      <rect x="28" y="356" width="152" height="26" fill="#3D5A26"/>
      <text x="104" y="373" text-anchor="middle" font-size="12" font-weight="600" fill="#FAF1E4" font-family="Noto Serif SC, serif">呼吸带 24px · 轮廓清晰</text>
    `,
  },
  inside: {
    title: "反白内嵌：把轻视觉或极短印记收进黑影腹地",
    desc: "当剪影下半部拥有大块饱满的实体面积（如 148 原海报的肩背）时，可以把一枝反白植物或极短编号印记安放在黑影中心腹地，既卸掉沉闷黑块，又严格远离外轮廓边界。",
    caption: "反白内容严格留在黑影腹部安全区，与外轮廓保持充足肉厚。",
    svg: `
      <text x="28" y="114" font-size="46" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">剪影</text>
      <text x="28" y="170" font-size="46" font-weight="900" fill="#242424" font-family="Noto Serif SC, serif">版式</text>
      <text x="28" y="212" font-size="13.5" fill="#4E4C29" font-family="Noto Serif SC, serif">大块实黑内部可做反白容器</text>
      <g transform="translate(332 436) scale(0.86)">
        <path d="M0 10 C-2 -30 4 -78 14 -126" fill="none" stroke="#FAF1E4" stroke-width="4" stroke-linecap="round"/>
        <path d="M2 -24 C-22 -32 -44 -54 -56 -82 C-26 -76 -6 -58 2 -24 Z" fill="#FAF1E4"/>
        <path d="M6 -60 C-14 -76 -30 -100 -34 -130 C-8 -112 4 -88 6 -60 Z" fill="#FAF1E4"/>
        <path d="M4 -18 C24 -26 48 -42 64 -66 C36 -66 16 -48 4 -18 Z" fill="#FAF1E4"/>
      </g>
      <circle cx="332" cy="364" r="72" fill="none" stroke="#C8C68E" stroke-width="1.6" stroke-dasharray="5 4"/>
      <rect x="28" y="356" width="166" height="26" fill="#5E5C37"/>
      <text x="111" y="373" text-anchor="middle" font-size="12" font-weight="600" fill="#FAF1E4" font-family="Noto Serif SC, serif">腹地反白 · 绝不破外沿</text>
    `,
  },
};

function setAnatomy(key) {
  const item = ANAT_DATA[key] || ANAT_DATA.breath;
  $$(".anat-tab").forEach((b) => {
    const on = b.dataset.anat === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#anat-title").textContent = item.title;
  $("#anat-desc").textContent = item.desc;
  $("#anat-caption").textContent = item.caption;
  $("#anat-layer").innerHTML = item.svg;
}
$$(".anat-tab").forEach((b) => b.addEventListener("click", () => setAnatomy(b.dataset.anat)));
setAnatomy("breath");

// ==================== 03 节：暗房图底反转与镂空尺度 ====================
const SWATCHES = {
  poster: {
    bg: [250, 241, 228],
    sil: [36, 36, 36],
    olive: [109, 106, 65],
    text: "#242424",
    accent: "#6D6A41",
    note: "暖米纸与炭黑拉开高反差，封闭的侧影瞬间跳成「图」，文字落脚极稳。",
  },
  invert: {
    bg: [36, 36, 36],
    sil: [250, 241, 228],
    olive: [109, 106, 65],
    text: "#FAF1E4",
    accent: "#C8C68E",
    note: "把黑影翻成黑夜纸上的暖白剪影，对比度同等锋利，画面瞬间转入夜间剧场或精装典藏气质。",
  },
  olive: {
    bg: [94, 92, 55],
    sil: [250, 241, 228],
    olive: [36, 36, 36],
    text: "#FAF1E4",
    accent: "#FAF1E4",
    note: "干橄榄展墙托住暖白剪影，属于温和中强反差——适合安静文艺气质，但小字需加大字重守住清晰度。",
  },
  muddy: {
    bg: [184, 179, 166],
    sil: [123, 120, 109],
    olive: [148, 144, 131],
    text: "#5A584F",
    accent: "#6A675D",
    note: "反面教材：灰底配灰影，明度对比暴跌至不足 2.5:1。大脑分不清谁是图谁是底，剪影最核心的抓眼能力彻底失灵。",
  },
};

let fgSwatch = "poster";
let fgCutoutScale = 1.0;

function updateFigureGround() {
  const sw = SWATCHES[fgSwatch];
  const bgHex = rgbCss(sw.bg);
  const silHex = rgbCss(sw.sil);
  const oliveHex = rgbCss(sw.olive);
  const ratio = wcagContrast(sw.bg, sw.sil);

  $("#fg-bg").setAttribute("fill", bgHex);
  $("#fg-sil").setAttribute("fill", silHex);
  $("#fg-olive").setAttribute("fill", oliveHex);

  const cutoutG = $("#fg-cutout");
  cutoutG.setAttribute("transform", `translate(362 344) scale(${fgCutoutScale.toFixed(2)})`);
  cutoutG.setAttribute("opacity", fgCutoutScale < 0.05 ? "0" : "1");
  cutoutG.querySelectorAll("path").forEach((p, idx) => {
    if (idx === 0) p.setAttribute("stroke", bgHex);
    else p.setAttribute("fill", bgHex);
  });

  const texts = $("#fg-text").querySelectorAll("text");
  texts.forEach((el, idx) => el.setAttribute("fill", idx === 2 ? sw.accent : sw.text));
  $("#fg-text line").setAttribute("stroke", sw.accent);

  const breached = fgCutoutScale > 1.3;
  $("#fg-breach-mark").setAttribute("visibility", breached ? "visible" : "hidden");

  $("#cutout-val").textContent =
    fgCutoutScale < 0.05
      ? "0.00×（纯实心剪影）"
      : breached
        ? `${fgCutoutScale.toFixed(2)}×（已切破外轮廓！）`
        : `适度 ${fgCutoutScale.toFixed(2)}×（守住外沿）`;

  $("#fg-ratio").textContent = `图底对比 ${ratio.toFixed(1)} : 1`;
  const pill = $("#fg-status");
  let explain = sw.note;

  if (ratio < 4.5) {
    pill.textContent = "图底糊成一片";
    pill.className = "dpv-pill is-bad";
  } else if (breached) {
    pill.textContent = "镂空破边解体";
    pill.className = "dpv-pill is-bad";
    explain = "反白叶枝放大过度，直接刺穿了侧面下颌与胸肩外轮廓！一旦外沿被内部镂空切开缺口，封闭剪影立刻碎成几片散碎色块。";
  } else if (fgCutoutScale < 0.05) {
    pill.textContent = "纯实黑强对比";
    pill.className = "dpv-pill is-ok";
    explain = `${sw.note} 关掉影内反白后轮廓更厚重凝练，适合小尺寸印章或远距招牌。`;
  } else if (ratio < 7.0) {
    pill.textContent = "中强反差·可用";
    pill.className = "dpv-pill is-warn";
  } else {
    pill.textContent = "图底利落";
    pill.className = "dpv-pill is-ok";
    explain = `${sw.note} 内部反白叶枝安静停在肩部腹地，既卸掉大块黑墨的笨重，又绝不触碰脸部外轮廓。`;
  }
  $("#fg-explain").textContent = explain;
}

$$(".swatch-btn").forEach((b) =>
  b.addEventListener("click", () => {
    fgSwatch = b.dataset.swatch;
    $$(".swatch-btn").forEach((x) => {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-pressed", String(on));
    });
    updateFigureGround();
  }),
);
$("#cutout-slider").addEventListener("input", (e) => {
  fgCutoutScale = Number(e.target.value);
  updateFigureGround();
});
updateFigureGround();

// ==================== 04 节：五纪元美术馆档案匣 ====================
const ERAS = {
  1759: {
    loc: "1759 · 法国巴黎",
    title: "财政总监的省钱绰号，成了黑纸剪影的名字",
    body: "1759 年 3 月至 11 月，艾蒂安·德·西鲁埃特（Étienne de Silhouette）出任法王路易十五的财政总监。他在七年战争财政危机中大砍贵族年金并推行紧缩税制，引起巴黎上流社会嘲讽，「à la silhouette」一时成了「简陋、省到只剩骨架」的代名词。同一时期，只需黑纸与剪刀、几分钟就能完成的平价侧面剪影肖像风靡欧洲，因比油画便宜得多，便顺势被称作「剪影」。",
    takeaway: "给排版的启示：剪影天生自带「减法」基因——把一切繁复渲染裁掉，只留最具识别度的侧面外廓。",
    svg: `
      <rect width="320" height="260" fill="#FAF1E4"/>
      <ellipse cx="160" cy="130" rx="82" ry="104" fill="#FCF8F0" stroke="#6D6A41" stroke-width="2"/>
      <ellipse cx="160" cy="130" rx="74" ry="96" fill="none" stroke="#6D6A41" stroke-width="1" stroke-dasharray="3 3"/>
      <path d="M164 56 C188 58 202 78 200 104 C198 124 190 138 196 164 C202 184 210 198 202 214 C178 224 142 224 126 214 C132 192 146 180 148 164 C138 162 130 156 134 148 C128 144 130 136 136 132 C126 126 118 122 126 112 C134 102 134 86 138 74 C144 62 152 56 164 56 Z" fill="#242424"/>
      <text x="160" y="246" text-anchor="middle" font-size="11" fill="#4E4C29" font-family="IBM Plex Mono, monospace">PARIS · 1759 PAPER CUTOUT</text>
    `,
  },
  1915: {
    loc: "1915 · 丹麦哥本哈根",
    title: "鲁宾花瓶：用一条共享轮廓证明图底切换",
    body: "丹麦心理学家埃德加·鲁宾（Edgar Rubin）在 1915 年出版的博士著作《视觉经验图形》（Synsoplevede Figurer）里系统提出「图底关系」：当黑与白共用同一条轮廓线时，大脑不会同时把两边看成实体，而是在「中间白花瓶」与「两侧黑侧脸」之间瞬时切换。轮廓一旦归属于某一侧，另一侧立刻退成背景。",
    takeaway: "给排版的启示：剪影版式不能让图与底五五平手打架——必须让主体轮廓更封闭、更强对比，文字区才稳得住背景身份。",
    svg: `
      <rect width="320" height="260" fill="#FAF1E4"/>
      <rect x="44" y="24" width="232" height="196" fill="#242424"/>
      <path d="M116 24 L204 24 C196 52 178 66 176 84 C174 98 192 110 182 122 C174 130 182 138 176 146 C172 152 184 162 186 176 C188 194 202 206 208 220 L112 220 C118 206 132 194 134 176 C136 162 148 152 144 146 C138 138 146 130 138 122 C128 110 146 98 144 84 C142 66 124 52 116 24 Z" fill="#FAF1E4"/>
      <text x="160" y="244" text-anchor="middle" font-size="11" fill="#4E4C29" font-family="IBM Plex Mono, monospace">EDGAR RUBIN · 1915 FIGURE / GROUND</text>
    `,
  },
  1926: {
    loc: "1926 · 德国柏林",
    title: "洛特·赖尼格：纯黑剪纸撑起整部动画长片",
    body: "德国动画先驱洛特·赖尼格（Lotte Reiniger）历时三年，用黑卡纸和铅片关节剪出全片角色，在底部打光的玻璃台上逐帧拍出《阿基米德王子历险记》（Die Abenteuer des Prinzen Achmed，1926），成为现存最早的动画长片。全片没有一张写实人脸，却靠舒展的剪影身姿演活了整段奇幻冒险。",
    takeaway: "给排版的启示：好剪影靠「动态大轮廓与关节空隙」讲故事，根本不需要五官细节。",
    svg: `
      <rect width="320" height="260" fill="#6D6A41"/>
      <path d="M36 226 L36 108 C36 48 102 22 160 22 C218 22 284 48 284 108 L284 226 Z" fill="#FAF1E4"/>
      <path d="M168 78 C176 78 182 84 180 92 C178 96 174 99 170 100 L184 114 L222 94 L226 102 L184 126 L176 152 L212 214 L200 218 L166 164 L134 218 L124 212 L152 152 L148 122 L104 134 L100 124 L152 108 L158 98 C154 94 155 86 160 81 C163 79 166 78 168 78 Z" fill="#242424"/>
      <path d="M36 212 L284 212 L284 226 L36 226 Z" fill="#242424"/>
      <text x="160" y="246" text-anchor="middle" font-size="11" fill="#FAF1E4" font-family="IBM Plex Mono, monospace">LOTTE REINIGER · 1926 BACKLIT CUTOUT</text>
    `,
  },
  1959: {
    loc: "1955 & 1959 · 美国纽约",
    title: "索尔·巴斯：把单剪影推上现代电影海报中央",
    body: "平面设计大师索尔·巴斯（Saul Bass）在《金臂人》（1955，MoMA 藏品号 202.1956）与《桃色血案》（Anatomy of a Murder，1959，MoMA 藏品号 38.1960）两部普雷明格电影海报里，甩开了当时流行的明星大头照，分别用一支扭曲纸剪手臂和一具拆解的黑纸人偶统领整张版面，文字紧随剪影块面与留白排开。",
    takeaway: "给排版的启示：单一象征剪影 + 克制色块 + 围绕形体的手绘/无衬线大字，足以在一条街外抢下视线。",
    svg: `
      <rect width="320" height="260" fill="#FAF1E4"/>
      <rect x="28" y="22" width="120" height="26" fill="#242424"/>
      <text x="88" y="40" text-anchor="middle" font-size="13" font-weight="800" fill="#FAF1E4" font-family="Syne, sans-serif">ANATOMY</text>
      <rect x="28" y="54" width="88" height="22" fill="#6D6A41"/>
      <text x="72" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="#FAF1E4" font-family="IBM Plex Mono, monospace">1959 · BASS</text>
      <!-- 致敬拆解黑纸人偶剪影（极简几何片） -->
      <circle cx="206" cy="54" r="17" fill="#242424"/>
      <polygon points="184,82 232,80 226,144 190,142" fill="#242424"/>
      <polygon points="146,96 178,86 174,104 142,114" fill="#242424"/>
      <polygon points="236,88 274,104 268,120 232,104" fill="#242424"/>
      <polygon points="186,154 206,154 196,216 176,214" fill="#242424"/>
      <polygon points="216,154 236,156 250,214 230,218" fill="#242424"/>
      <text x="160" y="244" text-anchor="middle" font-size="11" fill="#4E4C29" font-family="IBM Plex Mono, monospace">SAUL BASS · 1955–1959 FILM POSTER</text>
    `,
  },
  2003: {
    loc: "2003 · 美国洛杉矶",
    title: "Apple iPod 剪影广告：不画人脸的全球符号",
    body: "2003 年，TBWA\\Chiat\\Day 艺术总监 Susan Alinsangan 等人在 Lee Clow 指导下推出 Apple iPod 剪影系列广告：在高饱和单色纯底上只放全黑舞动人影，全场唯一亮色是舞者手中的纯白 iPod 与耳机白线。起初连乔布斯都怀疑「看不清产品细节」，结果却靠强轮廓和一抹留白成为广告史里程碑。",
    takeaway: "给排版的启示：全黑剪影把「任何人」变成了主角，留出唯一亮色点缀就能把注意力精确锁死在产品上。",
    svg: `
      <rect width="320" height="260" fill="#6D6A41"/>
      <path d="M168 48 C178 48 184 56 182 65 C180 71 175 74 170 76 L192 88 L224 64 L232 74 L192 104 L182 142 L212 214 L196 218 L168 156 L138 216 L124 208 L152 140 L150 104 L112 118 L108 106 L154 88 L158 76 C154 71 154 62 158 55 C161 50 164 48 168 48 Z" fill="#242424"/>
      <!-- 唯一反白焦点：随身听与白色耳机线 -->
      <rect x="220" y="64" width="10" height="16" rx="1.5" fill="#FAF1E4"/>
      <path d="M224 66 C204 54 186 58 176 64 C182 76 198 92 222 72" fill="none" stroke="#FAF1E4" stroke-width="2.2"/>
      <text x="160" y="244" text-anchor="middle" font-size="11" fill="#FAF1E4" font-family="IBM Plex Mono, monospace">TBWA\\CHIAT\\DAY · 2003 SILHOUETTE CAMPAIGN</text>
    `,
  },
};

function setEra(key) {
  const item = ERAS[key] || ERAS["1759"];
  $$(".era-btn").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#era-loc").textContent = item.loc;
  $("#era-title").textContent = item.title;
  $("#era-body").textContent = item.body;
  $("#era-takeaway").innerHTML = `<strong>给排版的启示：</strong>${item.takeaway.replace(/^给排版的启示：/, "")}`;
  $("#era-svg").innerHTML = item.svg;
}
$$(".era-btn").forEach((b) => b.addEventListener("click", () => setEra(b.dataset.era)));
setEra("1759");

// ==================== 05 节：六场景快筛台 ====================
const BRIEFS = {
  film: {
    yes: true,
    title: "独立电影节海报：悬念与远距识别一次拿满",
    body: "电影海报往往要在人流中一秒抓人，又不能剧透全部细节。一个高辨识单一剪影配上沿轮廓展开的片名和展期，既立住象征隐喻，又为观众留足想象空间——这正是索尔·巴斯屡试不爽的套路。",
  },
  book: {
    yes: true,
    title: "人物传记精装书封：静气、克制又有辨识度",
    body: "书封在书架和电商缩略图上经常小如邮票。用人物代表性的侧影轮廓（如礼帽、烟斗、发髻）搭配大片书纸留白与绕排书名，小图也极稳、且省去繁杂版权修图烦恼。",
  },
  coffee: {
    yes: true,
    title: "精品手冲咖啡礼盒：单色烫印天然契合剪影",
    body: "天鹅嘴手冲壶或滤杯侧影拥有极强外轮廓辨识度；做成炭黑或橄榄色单色剪影后，在瓦楞纸、棉纸礼盒上压凹或烫黑都能保持 razor-sharp 边缘，高级又省印费。",
  },
  camera: {
    yes: false,
    title: "微单相机参数详情页：剪影会把卖点全涂黑",
    body: "买家点开详情页是为了看清拨盘布局、镜头镀膜质感与机身接口，压成剪影后这些成交信息全部消失。建议换用 140 图片主导版式（高清实拍配精炼标注）或 145 多面板版式分项拆解。",
  },
  menu: {
    yes: false,
    title: "八道招牌菜菜单：既丢色泽又违背单一形体",
    body: "餐饮点单依赖食物诱人的油润色泽，而且需要同时平级展示八道菜方便比选。把菜品压成黑影不仅毫无食欲，八个轮廓并排还会互相抢戏——换 145 多面板版式或 143 图片窗口版式才对路。",
  },
  interview: {
    yes: false,
    title: "四千字人物专访内页：长文绕排会让眼睛跳脱",
    body: "专访既需要看清受访者的真实眼神神态，又要让读者一口气舒服读完数千字。把长正文沿曲折轮廓绕排极易导致回行疲劳——请用 141 文字主导版式稳住阅读栏，只在开篇配一幅克制人像。",
  },
};

function setBrief(key) {
  const b = BRIEFS[key] || BRIEFS.film;
  $$(".brief-card").forEach((el) => {
    const on = el.dataset.brief === key;
    el.classList.toggle("is-active", on);
    el.setAttribute("aria-pressed", String(on));
  });
  const badge = $("#bv-badge");
  badge.textContent = b.yes ? "适合剪影版式" : "不建议用剪影";
  badge.className = `bv-badge ${b.yes ? "is-yes" : "is-no"}`;
  $("#bv-title").textContent = b.title;
  $("#bv-body").textContent = b.body;
}
$$(".brief-card").forEach((el) => el.addEventListener("click", () => setBrief(el.dataset.brief)));
setBrief("film");

// ==================== 06 节：小练习 ====================
const QUIZ_FEEDBACK = {
  A: {
    right: false,
    title: "方案 A：硬矩形排法逼近喇叭口，边缘发粘且下方留死角",
    body: "文字虽没直接冲进黑影，但「秋夜独奏」与英文横条按硬矩形拉到最宽，右端距离萨克斯喇叭口与额头只剩极窄一缝，中下部却在矩形块与乐手弧线之间空出一块生硬死角，视觉呼吸不够均匀。",
  },
  B: {
    right: true,
    title: "答对了 · 方案 B 守住了「沿轮廓展开 + 均匀呼吸缝」",
    body: "大标题折成两行厚重块面稳占上左宽阔留白，中下段的副标与演出信息顺着萨克斯喇叭口向内微收，全程与黑影保持均匀空气缝；帽檐、吹嘴、喇叭口等关键外轮廓拐点全部清晰无遮，图与字彼此托举。",
  },
  C: {
    right: false,
    title: "方案 C：文字压入黑影边缘，切碎了关键轮廓拐点",
    body: "为了追求「紧扣形体」，标题右字与正文尾字直接骑在了乐手侧脸与萨克斯喇叭口上——这恰恰是萨克斯剪影最核心的辨识特征。黑白交界处文字难以辨读，轮廓的利落感也被啃出缺口。",
  },
  D: {
    right: false,
    title: "方案 D：躲避过度，文字被挤成孤立窄条、与剪影断联",
    body: "为了绝不碰黑，把大标题硬拆成四个竖排单字、正文压成最左一条极窄细柱，中间劈出一道宽阔空白鸿沟。结果左侧文字失去标题势能，整张海报分裂成互不对话的两块孤岛。",
  },
};

$$(".quiz-card").forEach((card) =>
  card.addEventListener("click", () => {
    const choice = card.dataset.choice;
    const fb = QUIZ_FEEDBACK[choice];
    $$(".quiz-card").forEach((c) => {
      c.classList.remove("is-picked", "is-right", "is-wrong");
      c.setAttribute("aria-pressed", "false");
    });
    card.classList.add("is-picked", fb.right ? "is-right" : "is-wrong");
    card.setAttribute("aria-pressed", "true");
    const box = $("#quiz-verdict");
    box.className = `quiz-verdict ${fb.right ? "is-right" : "is-wrong"}`;
    $("#qv-title").textContent = fb.title;
    $("#qv-body").textContent = fb.body;
  }),
);

// ==================== 07 节：原海报放大拖动灯箱 ====================
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
const posterTrigger = $("#poster-trigger");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}
function openLightbox() {
  if (!lbImg.src) lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 1, 3.2);
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.2);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1; lbX = 0; lbY = 0;
  applyLbTransform();
});
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale === 1) {
    closeLightbox();
    return;
  }
  lbDrag = { sx: e.clientX - lbX, sy: e.clientY - lbY };
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.sx;
  lbY = e.clientY - lbDrag.sy;
  applyLbTransform();
});
const endLbDrag = () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
};
lbStage.addEventListener("pointerup", endLbDrag);
lbStage.addEventListener("pointercancel", endLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化首帧 ====================
syncUI();
if (reducedMotion.matches) anim.intro = 1;
resizeHeroCanvas();
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    resizeHeroCanvas();
    heroLoop.draw();
  }).observe(heroCanvas);
}
heroLoop.draw();
