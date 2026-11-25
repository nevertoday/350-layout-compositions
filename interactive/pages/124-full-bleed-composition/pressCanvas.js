// 124 满幅构图 · 全宽深松绿印厂压印裁刀台 2D Canvas 渲染器
// 严格遵循 124 原海报视觉语言：朱橘大圆 #E34C0B、深松绿斜域 #0A512E、樱粉斜纹拱柱 #FD8FAF + #092058、暖沙角弧 #DCCFBA、樱粉出血虚线、深靛蓝十字裁切角标。

import { evaluate } from "./model.js";

export const PALETTE = {
  matBg: "#08331E",
  matGrid: "rgba(182, 232, 204, 0.08)",
  matGridMajor: "rgba(182, 232, 204, 0.17)",
  paper: "#FEF8F1",
  paperDim: "#F1E8DA",
  ink: "#101412",
  orange: "#E34C0B",
  green: "#0A512E",
  navy: "#092058",
  pink: "#FD8FAF",
  pinkDash: "#F387A7",
  sand: "#DCCFBA",
  danger: "#D92626",
  dangerDark: "#991515",
  ok: "#0E7A4B",
  okLight: "#7AE8B4",
  blade: "#D6DEE5",
  bladeEdge: "#FFFFFF",
};

// 绘制三题材共用的核心画面几何，严格按矩形 r={x,y,w,h} 铺满，绝不拉伸变形
export function drawSubjectArt(ctx, subject, r, bleedFactor = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();

  if (subject === "poster") {
    // 1:1 复刻 124 原海报核心几何满幅构成
    // 1. 深松绿基底满铺
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // 2. 左上巨大朱橘大半圆（与原海报精确对应，顶左直达边缘）
    const cx = r.x + r.w * 0.06;
    const cy = r.y + r.h * 0.14;
    const rad = Math.min(r.w, r.h) * (0.78 + bleedFactor * 0.025);
    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // 3. 左下暖沙四分之一角弧
    ctx.fillStyle = PALETTE.sand;
    ctx.beginPath();
    ctx.arc(r.x, r.y + r.h, Math.min(r.w, r.h) * 0.42, -Math.PI / 2, 0);
    ctx.lineTo(r.x, r.y + r.h);
    ctx.closePath();
    ctx.fill();

    // 4. 右侧标志樱粉拱顶塔 + 深靛蓝斜带（1:1 复刻原海报右翼）
    const colX = r.x + r.w * 0.67;
    const colW = r.w * 0.36;
    const domeR = colW * 0.52;
    const domeY = r.y + r.h * 0.25;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(colX, r.y + r.h);
    ctx.lineTo(colX, r.y + r.h * 0.50);
    ctx.lineTo(colX + colW * 0.10, r.y + r.h * 0.43);
    ctx.lineTo(colX + colW * 0.10, domeY);
    ctx.arc(colX + colW * 0.56, domeY, domeR, Math.PI, 0, false);
    ctx.lineTo(r.x + r.w + 2, r.y + r.h);
    ctx.closePath();
    ctx.fillStyle = PALETTE.pink;
    ctx.fill();
    ctx.clip();

    // 樱粉塔内 4 道深靛蓝平行斜条
    ctx.fillStyle = PALETTE.navy;
    const stripeCount = 4;
    for (let i = 0; i < stripeCount; i++) {
      const sy = r.y + r.h * (0.37 + i * 0.135);
      ctx.beginPath();
      ctx.moveTo(colX - r.w * 0.05, sy + r.h * 0.11);
      ctx.lineTo(r.x + r.w + r.w * 0.08, sy - r.h * 0.08);
      ctx.lineTo(r.x + r.w + r.w * 0.08, sy - r.h * 0.015);
      ctx.lineTo(colX - r.w * 0.05, sy + r.h * 0.175);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 5. 右下深靛蓝斜角基座（斜穿底右边缘）
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.31, r.y + r.h);
    ctx.lineTo(r.x + r.w, r.y + r.h * 0.67);
    ctx.lineTo(r.x + r.w, r.y + r.h);
    ctx.closePath();
    ctx.fill();
  } else if (subject === "spread") {
    // 建筑画册跨页：深靛蓝晴空 + 温暖日落朱橘立面 + 拱廊剪影 + 深松绿庭院倒影
    const sky = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h * 0.65);
    sky.addColorStop(0, "#092058");
    sky.addColorStop(1, "#184182");
    ctx.fillStyle = sky;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // 左侧斜射暖光墙面
    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h * 0.12);
    ctx.lineTo(r.x + r.w * 0.56, r.y + r.h * 0.34);
    ctx.lineTo(r.x + r.w * 0.56, r.y + r.h);
    ctx.lineTo(r.x, r.y + r.h);
    ctx.closePath();
    ctx.fill();

    // 右侧樱粉暮光建筑翼
    ctx.fillStyle = PALETTE.pink;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.56, r.y + r.h * 0.24);
    ctx.lineTo(r.x + r.w, r.y + r.h * 0.08);
    ctx.lineTo(r.x + r.w, r.y + r.h * 0.72);
    ctx.lineTo(r.x + r.w * 0.56, r.y + r.h * 0.72);
    ctx.closePath();
    ctx.fill();

    // 连续拱门光影节奏（避开中缝压主拱）
    ctx.fillStyle = "#08291A";
    const archW = r.w * 0.095;
    const archPositions = [0.11, 0.25, 0.39, 0.66, 0.80];
    for (const p of archPositions) {
      const ax = r.x + r.w * p;
      const ay = r.y + r.h * 0.48;
      const ah = r.h * 0.34;
      ctx.beginPath();
      ctx.arc(ax + archW / 2, ay, archW / 2, Math.PI, 0);
      ctx.lineTo(ax + archW, ay + ah);
      ctx.lineTo(ax, ay + ah);
      ctx.closePath();
      ctx.fill();
    }

    // 底部深松绿石阶广场
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(r.x, r.y + r.h * 0.71, r.w, r.h * 0.29);

    // 广场斜阳光带（暖沙）
    ctx.fillStyle = PALETTE.sand;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.14, r.y + r.h * 0.71);
    ctx.lineTo(r.x + r.w * 0.42, r.y + r.h * 0.71);
    ctx.lineTo(r.x + r.w * 0.62, r.y + r.h);
    ctx.lineTo(r.x + r.w * 0.04, r.y + r.h);
    ctx.closePath();
    ctx.fill();

    // 跨页太阳圆盘
    ctx.fillStyle = "#FEF8F1";
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.78, r.y + r.h * 0.26, Math.min(r.w, r.h) * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 全面屏移动端出血：深松绿至深靛蓝渐变大气场 + 跃出边缘的朱橘与樱粉有机环带
    const bg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    bg.addColorStop(0, "#092058");
    bg.addColorStop(0.55, "#0A512E");
    bg.addColorStop(1, "#072B1A");
    ctx.fillStyle = bg;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // 右上破边朱橘大球
    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.88, r.y + r.h * 0.28, r.w * 0.60, 0, Math.PI * 2);
    ctx.fill();

    // 左下破边樱粉大弧
    ctx.fillStyle = PALETTE.pink;
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.08, r.y + r.h * 0.76, r.w * 0.54, 0, Math.PI * 2);
    ctx.fill();

    // 中部暖沙几何切片
    ctx.fillStyle = PALETTE.sand;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.22, r.y + r.h * 0.46);
    ctx.lineTo(r.x + r.w * 0.84, r.y + r.h * 0.34);
    ctx.lineTo(r.x + r.w * 0.72, r.y + r.h * 0.64);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 在印张上绘制叠印标题（反映文字安全内距是否越界或被裁刀切掉）
function drawSheetTypography(ctx, spec, trimPx, pxPerMm, textInsetMm, isTextBad, bladeCut) {
  const insetPx = textInsetMm * pxPerMm;
  const x = trimPx.x + insetPx;
  const y = trimPx.y + insetPx;
  const maxW = Math.max(40, trimPx.w - insetPx * 2);

  ctx.save();
  // 如果处于裁切态，成品框外的文字真的会被一刀切掉！
  if (bladeCut) {
    ctx.beginPath();
    ctx.rect(trimPx.x, trimPx.y, trimPx.w, trimPx.h);
    ctx.clip();
  }

  // 半透明深墨文字护底条，同时测量主标与副标宽度，确保英文副标永不溢出黑/红底框
  const fontSize = Math.max(12, Math.min(19, trimPx.w * 0.082));
  const subSize = Math.max(8.5, Math.min(10.5, trimPx.w * 0.041));
  ctx.font = `900 ${fontSize}px "Noto Sans SC", sans-serif`;
  const titleW = ctx.measureText(spec.title).width;
  ctx.font = `600 ${subSize}px "IBM Plex Mono", monospace`;
  const subW = ctx.measureText(spec.subtitle).width;
  const boxW = Math.min(Math.max(48, trimPx.w - insetPx - 4), Math.max(titleW, subW) + 16);
  const tagH = fontSize + subSize + 15;

  // 若贴边过紧 (<safeMin)，用警示绯红底；否则用纯墨底
  ctx.fillStyle = isTextBad ? "rgba(168, 22, 22, 0.94)" : "rgba(12, 18, 15, 0.86)";
  ctx.fillRect(x, y, boxW, tagH);

  ctx.font = `900 ${fontSize}px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = "#FEF8F1";
  ctx.textBaseline = "top";
  ctx.fillText(spec.title, x + 7, y + 5, Math.max(24, boxW - 14));

  ctx.font = `600 ${subSize}px "IBM Plex Mono", monospace`;
  ctx.fillStyle = isTextBad ? "#FFD5D2" : "#FD8FAF";
  ctx.fillText(spec.subtitle, x + 7, y + fontSize + 8, Math.max(24, boxW - 14));

  // 底角日期/期号徽（同步受文字安全内距约束，演示底边也会被切！）
  const footText = spec.medium === "mobile" ? "EXPLORE FULL-BLEED →" : "NO.124 · 2026";
  ctx.font = `600 ${subSize}px "IBM Plex Mono", monospace`;
  const fw = ctx.measureText(footText).width + 12;
  const fh = subSize + 10;
  const fx = trimPx.x + trimPx.w - insetPx - fw;
  const fy = trimPx.y + trimPx.h - insetPx - fh;
  ctx.fillStyle = isTextBad ? "rgba(168, 22, 22, 0.92)" : "rgba(9, 32, 88, 0.88)";
  ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = "#FEF8F1";
  ctx.fillText(footText, fx + 6, fy + 5);

  ctx.restore();
}

// 绘制 124 原海报标志深靛蓝 `+` 十字裁切角标
function drawCropMarks(ctx, r, arm = 12, gap = 5, color = "#FEF8F1") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  const corners = [
    [r.x, r.y, -1, -1],
    [r.x + r.w, r.y, 1, -1],
    [r.x, r.y + r.h, -1, 1],
    [r.x + r.w, r.y + r.h, 1, 1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    // 外延水平角标
    ctx.moveTo(cx + dx * gap, cy);
    ctx.lineTo(cx + dx * (gap + arm), cy);
    // 外延垂直角标
    ctx.moveTo(cx, cy + dy * gap);
    ctx.lineTo(cx, cy + dy * (gap + arm));
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoundedRectPath(ctx, x, y, w, h, rad) {
  const rr = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// 绘制画布上的可点红色纠错签，并返回命中盒供点击交互使用
function drawCalloutPill(ctx, cx, cy, text, bg = "#B51E1E", stroke = "#FEF8F1", canvasW = 1000) {
  ctx.save();
  ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 18;
  const ph = 24;
  const x = Math.max(8, Math.min(canvasW - pw - 8, cx - pw / 2));
  const y = Math.max(8, cy - ph / 2);

  ctx.fillStyle = bg;
  drawRoundedRectPath(ctx, x, y, pw, ph, 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#FEF8F1";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 9, y + ph / 2 + 0.5);
  ctx.restore();
  return { x, y, w: pw, h: ph };
}

// 主渲染入口：返回 hitTargets（画布可点纠错签坐标），全部基于 evalRes 单真源
export function renderPressStage(ctx, width, height, state, anim) {
  const res = evaluate(state);
  const { spec } = res;
  const hitTargets = [];

  ctx.save();
  // 1. 深松绿专业印厂切割垫底色 + 毫米方格
  ctx.fillStyle = PALETTE.matBg;
  ctx.fillRect(0, 0, width, height);

  const gridStep = width < 640 ? 22 : 28;
  ctx.strokeStyle = PALETTE.matGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = (width % gridStep) / 2; x < width; x += gridStep) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = (height % gridStep) / 2; y < height; y += gridStep) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 顶部毫米刻度细标尺（呼应印前专业质感）
  ctx.fillStyle = "rgba(254, 248, 241, 0.04)";
  ctx.fillRect(0, 0, width, 22);
  ctx.strokeStyle = "rgba(254, 248, 241, 0.22)";
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(width, 22);
  for (let x = 20; x < width - 10; x += 14) {
    const major = ((x - 20) / 14) % 5 === 0;
    ctx.moveTo(x, 22);
    ctx.lineTo(x, major ? 12 : 17);
  }
  ctx.stroke();

  const compact = width < 720;
  // 中心内容限宽（2560 宽屏时铺展至 1660，不缩在中间）
  const innerW = Math.min(width - (compact ? 24 : 56), 1660);
  const innerX = (width - innerW) / 2;
  const topPad = compact ? 58 : 42;
  const bottomPad = compact ? 62 : 64;
  const availH = Math.max(140, height - topPad - bottomPad);

  // 桌面 / 平板：左 62% 主压印台 + 中间原海报朱橘箭头 + 右 34% 普通版面（留白）实时对照样张
  // 手机窄屏：专注大画幅单主印张（确保等比不压扁、圆形纯圆！）+ 右上角紧凑对比面积胶囊
  const mainAreaW = compact ? innerW : innerW * 0.60;
  const compAreaW = compact ? 0 : innerW * 0.32;
  const arrowZoneW = compact ? 0 : innerW * 0.08;

  // 预留印张外围 16mm 空白用于展示出血线、十字角标与落刀白边
  const padMm = 15;
  const totalMmW = spec.sheetW + padMm * 2;
  const totalMmH = spec.sheetH + padMm * 2;
  const pxPerMm = Math.min((mainAreaW - 12) / totalMmW, availH / totalMmH);

  const trimW = spec.sheetW * pxPerMm;
  const trimH = spec.sheetH * pxPerMm;
  const mainCenterX = compact ? width / 2 : innerX + mainAreaW * 0.51;
  const mainCenterY = topPad + availH / 2;
  const trimPx = {
    x: mainCenterX - trimW / 2,
    y: mainCenterY - trimH / 2,
    w: trimW,
    h: trimH,
  };

  // 印张纸底（含外延 11mm 大纸印前边距，落刀时被切落褪隐）
  const cutProg = anim.cutProgress; // 0 = 摊开大纸, 1 = 已落刀成品
  const sheetPadPx = 11 * pxPerMm;

  // 如果还没落刀，绘制大纸印张底座（带真实印刷纸质感）
  if (cutProg < 0.99) {
    ctx.save();
    ctx.globalAlpha = 1 - cutProg * 0.92;
    const bigX = trimPx.x - sheetPadPx;
    const bigY = trimPx.y - sheetPadPx;
    const bigW = trimPx.w + sheetPadPx * 2;
    const bigH = trimPx.h + sheetPadPx * 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.fillRect(bigX + 6, bigY + 8, bigW, bigH);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(bigX, bigY, bigW, bigH);
    ctx.strokeStyle = "rgba(16, 20, 18, 0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bigX, bigY, bigW, bigH);
    ctx.restore();
  }

  // 计算实际成品裁切窗口（若已落刀且为印刷模式，体现机械刀偏 driftX / driftY）
  const activeDriftX = spec.medium === "print" ? spec.driftX * cutProg : 0;
  const activeDriftY = spec.medium === "print" ? spec.driftY * cutProg : 0;
  const finalTrimPx = {
    x: trimPx.x - activeDriftX * pxPerMm,
    y: trimPx.y - activeDriftY * pxPerMm,
    w: trimPx.w,
    h: trimPx.h,
  };

  // 绘制成品纸底（落刀后悬在深松绿切割垫上，投影更锐利）
  ctx.save();
  if (cutProg > 0.05) {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.42 * cutProg})`;
    if (spec.medium === "mobile") {
      drawRoundedRectPath(ctx, finalTrimPx.x + 6, finalTrimPx.y + 10, finalTrimPx.w, finalTrimPx.h, 16 * (pxPerMm / 1.4));
      ctx.fill();
    } else {
      ctx.fillRect(finalTrimPx.x + 6, finalTrimPx.y + 9, finalTrimPx.w, finalTrimPx.h);
    }
  }
  ctx.fillStyle = PALETTE.paper;
  if (spec.medium === "mobile") {
    drawRoundedRectPath(ctx, finalTrimPx.x, finalTrimPx.y, finalTrimPx.w, finalTrimPx.h, 16 * (pxPerMm / 1.4));
    ctx.fill();
  } else {
    ctx.fillRect(finalTrimPx.x, finalTrimPx.y, finalTrimPx.w, finalTrimPx.h);
  }
  ctx.restore();

  // 绘制实际色块画面（严格由 model.js 的 res.artRect 坐标转换而来！）
  const artPx = {
    x: trimPx.x + res.artRect.left * pxPerMm,
    y: trimPx.y + res.artRect.top * pxPerMm,
    w: (res.artRect.right - res.artRect.left) * pxPerMm,
    h: (res.artRect.bottom - res.artRect.top) * pxPerMm,
  };

  ctx.save();
  // 若已落刀，按 finalTrimPx 裁切（0mm 没出血时，finalTrimPx 偏移出来的左侧/上侧就会露出惨白纸底！）
  if (cutProg > 0.5) {
    if (spec.medium === "mobile") {
      drawRoundedRectPath(ctx, finalTrimPx.x, finalTrimPx.y, finalTrimPx.w, finalTrimPx.h, 16 * (pxPerMm / 1.4));
    } else {
      ctx.beginPath();
      ctx.rect(finalTrimPx.x, finalTrimPx.y, finalTrimPx.w, finalTrimPx.h);
    }
    ctx.clip();
  } else if (spec.medium === "mobile") {
    drawRoundedRectPath(ctx, trimPx.x - sheetPadPx, trimPx.y - sheetPadPx, trimPx.w + sheetPadPx * 2, trimPx.h + sheetPadPx * 2, 18);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(trimPx.x - sheetPadPx, trimPx.y - sheetPadPx, trimPx.w + sheetPadPx * 2, trimPx.h + sheetPadPx * 2);
    ctx.clip();
  }

  // 主画面色块
  drawSubjectArt(ctx, state.subject, artPx, Math.max(0, state.bleedMm));

  // 跨页题材的中缝折痕指示
  if (state.subject === "spread") {
    const midX = trimPx.x + trimPx.w / 2;
    const grad = ctx.createLinearGradient(midX - 10, 0, midX + 10, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.28)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(midX - 10, trimPx.y - sheetPadPx, 20, trimPx.h + sheetPadPx * 2);
  }

  // 若未落刀，把成品裁切线以外的出血位轻轻叠加微暗半透滤层，清晰区分「成品内」vs「出血外延」
  if (cutProg <= 0.5) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(trimPx.x - sheetPadPx, trimPx.y - sheetPadPx, trimPx.w + sheetPadPx * 2, trimPx.h + sheetPadPx * 2);
    ctx.rect(trimPx.x, trimPx.y, trimPx.w, trimPx.h);
    ctx.fillStyle = "rgba(8, 32, 22, 0.24)";
    ctx.fill("evenodd");
    ctx.restore();
  }
  ctx.restore();

  // 叠印文字（检验文字安全内距）
  const isTextBad = !res.checks.c3_text;
  drawSheetTypography(ctx, spec, cutProg > 0.5 ? finalTrimPx : trimPx, pxPerMm, res.textInset, isTextBad, cutProg > 0.5);

  // 移动端全面屏硬件特征（圆角框、顶部状态岛、底部手势条）
  if (spec.medium === "mobile") {
    const rScreen = cutProg > 0.5 ? finalTrimPx : trimPx;
    const cornerR = 16 * (pxPerMm / 1.4);
    ctx.save();
    drawRoundedRectPath(ctx, rScreen.x, rScreen.y, rScreen.w, rScreen.h, cornerR);
    ctx.strokeStyle = "#111618";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 顶部灵动岛
    const islandW = rScreen.w * 0.30;
    const islandH = Math.max(7, rScreen.h * 0.032);
    ctx.fillStyle = "#0D1113";
    drawRoundedRectPath(ctx, rScreen.x + (rScreen.w - islandW) / 2, rScreen.y + 5, islandW, islandH, islandH / 2);
    ctx.fill();

    // 底部手势条
    const barW = rScreen.w * 0.34;
    ctx.fillStyle = "rgba(254, 248, 241, 0.85)";
    drawRoundedRectPath(ctx, rScreen.x + (rScreen.w - barW) / 2, rScreen.y + rScreen.h - 7, barW, 3, 2);
    ctx.fill();
    ctx.restore();
  }

  // 印前辅助线（粉色 +3mm 出血虚线、深靛蓝十字裁切角标、文字安全内框）
  if (state.showGuides && cutProg < 0.92) {
    ctx.save();
    ctx.globalAlpha = 1 - cutProg;

    // 1. 原海报标志：+3mm 樱粉出血虚线（仅印刷题材显示）
    if (spec.medium === "print") {
      const bPx = spec.bleedTarget * pxPerMm;
      ctx.strokeStyle = PALETTE.pinkDash;
      ctx.lineWidth = 2.1;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(trimPx.x - bPx, trimPx.y - bPx, trimPx.w + bPx * 2, trimPx.h + bPx * 2);
      ctx.setLineDash([]);
    }

    // 2. 成品裁切实线 + 深靛蓝 `+` 裁切角标（1:1 呼应 124 原海报！）
    ctx.strokeStyle = "rgba(9, 32, 88, 0.72)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(trimPx.x, trimPx.y, trimPx.w, trimPx.h);
    drawCropMarks(ctx, trimPx, 11, 4, PALETTE.navy);

    // 3. 文字安全内区细虚线
    const sPx = spec.safeMin * pxPerMm;
    ctx.strokeStyle = isTextBad ? "rgba(217, 38, 38, 0.92)" : "rgba(254, 248, 241, 0.65)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(trimPx.x + sPx, trimPx.y + sPx, trimPx.w - sPx * 2, trimPx.h - sPx * 2);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 落刀后若 0mm 漏白，用高醒目红框圈出露出的白毛边！
  if (cutProg > 0.6 && spec.medium === "print" && res.maxSliver > 0.05) {
    ctx.save();
    ctx.strokeStyle = "#FF5A52";
    ctx.lineWidth = 2.2;
    if (res.sliver.left > 0.05) {
      const sw = Math.max(3, res.sliver.left * pxPerMm);
      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.fillRect(finalTrimPx.x, finalTrimPx.y, sw, finalTrimPx.h);
      ctx.strokeRect(finalTrimPx.x, finalTrimPx.y, sw, finalTrimPx.h);
    }
    if (res.sliver.top > 0.05) {
      const sh = Math.max(3, res.sliver.top * pxPerMm);
      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.fillRect(finalTrimPx.x, finalTrimPx.y, finalTrimPx.w, sh);
      ctx.strokeRect(finalTrimPx.x, finalTrimPx.y, finalTrimPx.w, sh);
    }
    ctx.restore();
  }

  // 金属裁纸刀落刀动画（cutProg 在 0.02..0.98 期间扫过四边）
  if (anim.bladeFlash > 0.01) {
    ctx.save();
    ctx.globalAlpha = anim.bladeFlash;
    const sweep = (1 - anim.bladeFlash) * 40;
    ctx.strokeStyle = PALETTE.bladeEdge;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(finalTrimPx.x - 24, finalTrimPx.y);
    ctx.lineTo(finalTrimPx.x + finalTrimPx.w + 24, finalTrimPx.y);
    ctx.moveTo(finalTrimPx.x, finalTrimPx.y - 24);
    ctx.lineTo(finalTrimPx.x, finalTrimPx.y + finalTrimPx.h + 24);
    ctx.moveTo(finalTrimPx.x + finalTrimPx.w, finalTrimPx.y - 24 + sweep * 0.2);
    ctx.lineTo(finalTrimPx.x + finalTrimPx.w, finalTrimPx.y + finalTrimPx.h + 24);
    ctx.moveTo(finalTrimPx.x - 24, finalTrimPx.y + finalTrimPx.h);
    ctx.lineTo(finalTrimPx.x + finalTrimPx.w + 24, finalTrimPx.y + finalTrimPx.h);
    ctx.stroke();
    ctx.restore();
  }

  // 主样张底部橙色铭牌（1:1 呼应原海报「满幅构图」朱橘底标，严格位于底部提示条之上，绝不重叠）
  const rawBadgeY = trimPx.y + trimPx.h + (cutProg > 0.5 ? 10 : sheetPadPx + 8);
  const badgeY = Math.min(height - 46, rawBadgeY);
  const mainBadgeText = state.bladeCut
    ? `成品实裁 · ${res.fillPct}% 铺满${res.spec.medium === "print" ? ` · 刀偏 ±${spec.driftX}mm` : ""}`
    : `满幅压印台 · 出血 ${res.minExt >= 0 ? "+" : ""}${res.minExt}mm · ${res.reachedCount}/4 边`;
  ctx.save();
  ctx.font = `700 11.5px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
  const mbw = ctx.measureText(mainBadgeText).width + 20;
  const mbx = Math.max(8, Math.min(width - mbw - 8, mainCenterX - mbw / 2));
  ctx.fillStyle = res.code === "pass" ? PALETTE.orange : "#B53504";
  ctx.fillRect(mbx, badgeY, mbw, 22);
  ctx.fillStyle = "#FEF8F1";
  ctx.textBaseline = "middle";
  ctx.fillText(mainBadgeText, mbx + 10, badgeY + 11.5);
  ctx.restore();

  // 画布上直接可点的单步纠错红签（仅在错态时出现，点一下立刻修这一项）
  if (res.quickFix) {
    let px = mainCenterX;
    let py = trimPx.y + trimPx.h * 0.52;
    let pillText = `× ${res.quickFix.label}`;
    if (res.code === "zero_bleed_sliver") {
      px = trimPx.x + 68;
      py = trimPx.y + 34;
      pillText = `× 露白 ${Math.max(res.maxSliver, spec.driftX)}mm · 点推至 +3.5mm`;
    } else if (res.code === "text_sliced") {
      px = trimPx.x + trimPx.w * 0.48;
      py = trimPx.y + 24;
      pillText = `× 文字距边 ${res.textInset}mm · 点退回安全区`;
    } else if (res.code === "partial_bleed") {
      px = trimPx.x + trimPx.w * 0.45;
      py = trimPx.y + trimPx.h - 22;
      pillText = `× ${res.missingSides.length} 边留白 · 点开四边通边`;
    } else if (res.code === "margin_trapped") {
      px = mainCenterX;
      py = trimPx.y + trimPx.h * 0.5;
      pillText = `× 留白缩水 ${Math.round(100 - res.fillPct)}% · 点推至满幅`;
    }
    const rect = drawCalloutPill(ctx, px, py, pillText, "#B51E1E", "#FEF8F1", width);
    hitTargets.push({ ...rect, patch: res.quickFix.patch, label: pillText });
  }

  // 2. 桌面/平板宽屏：右侧绘制原海报标志朱橘右箭 + 「普通版面（留白）」实时对照样张！
  if (!compact && compAreaW > 140) {
    const arrowX = innerX + mainAreaW + arrowZoneW * 0.5;
    const arrowY = mainCenterY;

    // 原海报标志朱橘粗箭头
    ctx.save();
    ctx.fillStyle = PALETTE.orange;
    ctx.beginPath();
    ctx.moveTo(arrowX - 18, arrowY - 9);
    ctx.lineTo(arrowX + 2, arrowY - 9);
    ctx.lineTo(arrowX + 2, arrowY - 18);
    ctx.lineTo(arrowX + 20, arrowY);
    ctx.lineTo(arrowX + 2, arrowY + 18);
    ctx.lineTo(arrowX + 2, arrowY + 9);
    ctx.lineTo(arrowX - 18, arrowY + 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 右侧对照卡：与主成品等比例略微收小（呼应原海报左大右小对比）
    const compScale = pxPerMm * 0.78;
    const cW = spec.sheetW * compScale;
    const cH = spec.sheetH * compScale;
    const compCx = innerX + mainAreaW + arrowZoneW + compAreaW * 0.5;
    const compRect = { x: compCx - cW / 2, y: mainCenterY - cH / 2, w: cW, h: cH };

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(compRect.x + 5, compRect.y + 7, compRect.w, compRect.h);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(compRect.x, compRect.y, compRect.w, compRect.h);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(compRect.x, compRect.y, compRect.w, compRect.h);

    // 普通版面四周白边（严格按 model.js regMargin 实绘！）
    const mPx = res.regMargin * compScale;
    const innerArt = {
      x: compRect.x + mPx,
      y: compRect.y + mPx,
      w: compRect.w - mPx * 2,
      h: compRect.h - mPx * 2,
    };
    drawSubjectArt(ctx, state.subject, innerArt, 0);

    // 右侧暖沙底铭牌（1:1 呼应原海报「普通版面（留白）」暖沙标）
    const cBadgeY = compRect.y + compRect.h + 12;
    const cText = `普通版面（留白） · 仅占 ${Math.round(res.regFillPct)}%`;
    ctx.font = `700 11px "Noto Sans SC", "IBM Plex Mono", sans-serif`;
    const cbw = ctx.measureText(cText).width + 18;
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(compCx - cbw / 2, cBadgeY, cbw, 22);
    ctx.fillStyle = PALETTE.ink;
    ctx.textBaseline = "middle";
    ctx.fillText(cText, compCx - cbw / 2 + 9, cBadgeY + 11.5);

    // 顶部实时面积倍率对比徽
    const ratioText = `左侧有效画面 = 对照组的 ${res.areaRatio.toFixed(2)}×`;
    ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", monospace`;
    const rw = ctx.measureText(ratioText).width + 16;
    ctx.fillStyle = "rgba(9, 32, 88, 0.88)";
    ctx.fillRect(compCx - rw / 2, compRect.y - 30, rw, 22);
    ctx.strokeStyle = "rgba(253, 143, 175, 0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(compCx - rw / 2, compRect.y - 30, rw, 22);
    ctx.fillStyle = "#FEF8F1";
    ctx.fillText(ratioText, compCx - rw / 2 + 8, compRect.y - 18.5);
    ctx.restore();
  } else {
    // 手机竖屏与横屏窄画布：顶栏居中实况徽，位于纸张上方专属留空带，零重叠
    const chip = `较留白版 ${res.areaRatio.toFixed(2)}× · 出血 ${res.minExt >= 0 ? "+" : ""}${res.minExt}mm`;
    ctx.save();
    ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", monospace`;
    const cw = ctx.measureText(chip).width + 16;
    const cx = Math.max(10, (width - cw) / 2);
    ctx.fillStyle = "rgba(9, 32, 88, 0.92)";
    ctx.fillRect(cx, 27, cw, 22);
    ctx.strokeStyle = "rgba(253, 143, 175, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, 27, cw, 22);
    ctx.fillStyle = "#FEF8F1";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, cx + 8, 38.5);
    ctx.restore();
  }

  // 底部操作微提示（独立深底细带，零遮挡、高对比）
  ctx.save();
  ctx.fillStyle = "rgba(4, 24, 14, 0.72)";
  ctx.fillRect(0, height - 22, width, 22);
  ctx.font = `500 11px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = "#DDF0E4";
  ctx.textBaseline = "middle";
  const hint = compact
    ? "↔ 左右横拖推拉出血 · 点红标直修"
    : "↔ 左右横拖画布推拉出血（-20mm 留白 ↔ +12mm 过扩） · 点红标直修 · 方向键 ←→ 调出血 / ↑↓ 调文字内距";
  if (compact) {
    ctx.textAlign = "center";
    ctx.fillText(hint, width / 2, height - 11);
  } else {
    ctx.fillText(hint, innerX + 2, height - 11);
  }
  ctx.restore();

  ctx.restore();
  return { res, hitTargets };
}
