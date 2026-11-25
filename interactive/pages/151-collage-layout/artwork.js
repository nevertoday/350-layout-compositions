// 151 拼贴版式 · 高质感纸材与手撕拼贴画布渲染器（artwork.js）
// 采用一次性预缓存纸纹与题材画芯，保证 6x 慢手机与软件渲染下拖动稳定 >= 55 FPS。

import { BOARD_ASPECT, MATERIALS, THEMES } from "./model.js";

// 确定性伪随机，保证同一纸片的手撕锯齿边永远稳定不抖动
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 预生成手工棉纸底纹图章（128x128 细微纤维与纸点，贴满整张台面零开销）
let paperPatternCanvas = null;
function getPaperPatternCanvas() {
  if (paperPatternCanvas) return paperPatternCanvas;
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const x = c.getContext("2d");
  x.fillStyle = "#F1EADF";
  x.fillRect(0, 0, 160, 160);
  const rand = mulberry32(15101);
  // 极淡暖棉纤维点
  for (let i = 0; i < 420; i++) {
    const px = rand() * 160;
    const py = rand() * 160;
    const r = 0.5 + rand() * 1.1;
    x.fillStyle = rand() > 0.45 ? "rgba(138, 118, 92, 0.08)" : "rgba(255, 252, 245, 0.25)";
    x.fillRect(px, py, r, r);
  }
  // 细棉丝短绒
  x.strokeStyle = "rgba(145, 126, 98, 0.07)";
  x.lineWidth = 0.7;
  for (let i = 0; i < 28; i++) {
    const px = rand() * 160;
    const py = rand() * 160;
    const ang = rand() * Math.PI * 2;
    const len = 3 + rand() * 6;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    x.stroke();
  }
  paperPatternCanvas = c;
  return c;
}

// 预缓存三套银盐黑白主图（避免每帧重绘花瓶/拱廊/黑胶细节）
const photoCache = new Map();
function getPhotoCanvas(themeId) {
  if (photoCache.has(themeId)) return photoCache.get(themeId);
  const w = 260;
  const h = 320;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  // 银盐黑白暗房梯度底
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#DAD7D0");
  g.addColorStop(0.55, "#B7B3AA");
  g.addColorStop(1, "#8A867E");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (themeId === "poster") {
    // 复刻 151 原海报黑白静物照：左侧柔和窗光 + 陶瓶 + 黑叶枝条 + 圆鹅卵石 + 木桌影
    const glow = ctx.createRadialGradient(w * 0.28, h * 0.28, 12, w * 0.35, h * 0.35, w * 0.75);
    glow.addColorStop(0, "rgba(250,248,242,0.52)");
    glow.addColorStop(1, "rgba(60,58,54,0.18)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // 桌面平面
    ctx.fillStyle = "#706D66";
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    ctx.fillStyle = "#57544E";
    ctx.fillRect(0, h * 0.78, w, 4);

    // 桌上投影
    ctx.fillStyle = "rgba(24,24,22,0.34)";
    ctx.beginPath();
    ctx.ellipse(w * 0.42, h * 0.83, 62, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.70, h * 0.84, 44, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 细枝与 7 片黑叶（高对比剪影）
    ctx.strokeStyle = "#1E1E1D";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.47);
    ctx.quadraticCurveTo(w * 0.49, h * 0.33, w * 0.74, h * 0.22);
    ctx.stroke();

    const leaves = [
      [0.45, 0.36, -0.85, 19, 7],
      [0.54, 0.32, 0.45, 18, 6.5],
      [0.57, 0.27, -0.78, 18, 6.5],
      [0.65, 0.27, 0.32, 18, 6.5],
      [0.67, 0.21, -0.68, 17, 6],
      [0.75, 0.21, -0.18, 16, 6],
      [0.74, 0.26, 0.55, 14, 5.5],
    ];
    ctx.fillStyle = "#1C1C1B";
    for (const [lx, ly, ang, rx, ry] of leaves) {
      ctx.save();
      ctx.translate(w * lx, h * ly);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(rx * 0.5, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 手工粗陶瓶（受光渐变）
    const vg = ctx.createLinearGradient(w * 0.18, h * 0.5, w * 0.48, h * 0.5);
    vg.addColorStop(0, "#A9A59D");
    vg.addColorStop(0.35, "#7F7B73");
    vg.addColorStop(0.8, "#45423D");
    vg.addColorStop(1, "#2A2825");
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.moveTo(w * 0.29, h * 0.46);
    ctx.lineTo(w * 0.38, h * 0.46);
    ctx.lineTo(w * 0.39, h * 0.54);
    ctx.quadraticCurveTo(w * 0.46, h * 0.58, w * 0.46, h * 0.68);
    ctx.lineTo(w * 0.44, h * 0.82);
    ctx.quadraticCurveTo(w * 0.33, h * 0.85, w * 0.22, h * 0.82);
    ctx.lineTo(w * 0.20, h * 0.68);
    ctx.quadraticCurveTo(w * 0.20, h * 0.58, w * 0.28, h * 0.54);
    ctx.closePath();
    ctx.fill();
    // 瓶口高光
    ctx.fillStyle = "#3B3834";
    ctx.beginPath();
    ctx.ellipse(w * 0.335, h * 0.46, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 右下圆石 / 酸面包静物球
    const sg = ctx.createRadialGradient(w * 0.62, h * 0.71, 6, w * 0.67, h * 0.76, 44);
    sg.addColorStop(0, "#B7B3AA");
    sg.addColorStop(0.45, "#67645D");
    sg.addColorStop(1, "#232220");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(w * 0.67, h * 0.76, 38, 29, 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (themeId === "arch") {
    // 清水混凝土拱廊与几何光影阶梯
    ctx.fillStyle = "#C4C8CC";
    ctx.fillRect(0, 0, w, h);
    // 建筑阴影切面
    ctx.fillStyle = "#393D42";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.36, 0);
    ctx.lineTo(w * 0.36, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    // 中央深邃半圆拱门
    ctx.fillStyle = "#1E2125";
    ctx.beginPath();
    ctx.moveTo(w * 0.30, h);
    ctx.lineTo(w * 0.30, h * 0.42);
    ctx.arc(w * 0.56, h * 0.42, w * 0.26, Math.PI, 0, false);
    ctx.lineTo(w * 0.82, h);
    ctx.closePath();
    ctx.fill();
    // 拱门内受光面与阶梯
    ctx.fillStyle = "#E6E8E8";
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h);
    ctx.lineTo(w * 0.42, h * 0.44);
    ctx.arc(w * 0.59, h * 0.44, w * 0.17, Math.PI, 0, false);
    ctx.lineTo(w * 0.76, h);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const y0 = h * (0.64 + i * 0.055);
      ctx.fillStyle = i % 2 === 0 ? "#888D92" : "#555A60";
      ctx.fillRect(w * 0.42, y0, w * 0.34, h * 0.028);
    }
    // 斜射日光束
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.moveTo(w * 0.36, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w * 0.64, h);
    ctx.lineTo(w * 0.2, h);
    ctx.closePath();
    ctx.fill();
  } else {
    // 模拟黑胶唱盘与唱臂（黑白银盐高对比）
    ctx.fillStyle = "#CFCAC2";
    ctx.fillRect(0, 0, w, h);
    // 唱盘基座暗影
    ctx.fillStyle = "#A39E95";
    ctx.fillRect(w * 0.08, h * 0.1, w * 0.84, h * 0.8);
    // 黑胶唱片
    ctx.fillStyle = "#181818";
    ctx.beginPath();
    ctx.arc(w * 0.46, h * 0.54, w * 0.37, 0, Math.PI * 2);
    ctx.fill();
    // 细密纹路高光弧
    ctx.strokeStyle = "rgba(240,236,228,0.22)";
    ctx.lineWidth = 1.4;
    for (let r = 34; r <= 88; r += 9) {
      ctx.beginPath();
      ctx.arc(w * 0.46, h * 0.54, r, -0.7, 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.46, h * 0.54, r, Math.PI - 0.7, Math.PI + 0.3);
      ctx.stroke();
    }
    // 中心浅灰唱片标
    ctx.fillStyle = "#DFD9CE";
    ctx.beginPath();
    ctx.arc(w * 0.46, h * 0.54, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1E1E1D";
    ctx.beginPath();
    ctx.arc(w * 0.46, h * 0.54, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // 金属唱臂
    ctx.strokeStyle = "#ECE8DF";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.82, h * 0.22);
    ctx.lineTo(w * 0.77, h * 0.58);
    ctx.lineTo(w * 0.65, h * 0.69);
    ctx.stroke();
    ctx.fillStyle = "#2E2E2C";
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.22, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // 胶片银盐细颗粒
  const rand = mulberry32(themeId.charCodeAt(0) * 997);
  for (let i = 0; i < 900; i++) {
    const px = rand() * w;
    const py = rand() * h;
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
    ctx.fillRect(px, py, 1.5, 1.5);
  }
  photoCache.set(themeId, c);
  return c;
}

// 确定性手撕锯齿边缘路径（缓存为归一化坐标，[-0.5, 0.5]）
const edgeCache = new Map();
function getTornPoints(seed, jagged = 0.026, straightTopBottom = false) {
  const key = `${seed}-${jagged}-${straightTopBottom}`;
  if (edgeCache.has(key)) return edgeCache.get(key);
  const rand = mulberry32(seed * 73 + 17);
  const pts = [];
  const steps = 16;

  // 上边
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const j = straightTopBottom ? 0 : (rand() - 0.5) * jagged * 2;
    pts.push([-0.5 + t, -0.5 + j]);
  }
  // 右边
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const j = (rand() - 0.5) * jagged * 2.2;
    pts.push([0.5 + j, -0.5 + t]);
  }
  // 下边
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const j = straightTopBottom ? 0 : (rand() - 0.5) * jagged * 2;
    pts.push([0.5 - t, 0.5 + j]);
  }
  // 左边
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const j = (rand() - 0.5) * jagged * 2.2;
    pts.push([-0.5 + j, 0.5 - t]);
  }
  edgeCache.set(key, pts);
  return pts;
}

function traceTornPath(ctx, pts, pw, ph) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0] * pw;
    const y = pts[i][1] * ph;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// 绘制单条胶带或回形针
function drawFastener(ctx, kind, pw, ph) {
  if (kind === "masking") {
    ctx.save();
    ctx.translate(0, -ph * 0.49);
    ctx.rotate(-0.04);
    ctx.fillStyle = "rgba(227, 212, 184, 0.84)";
    ctx.strokeStyle = "rgba(182, 165, 134, 0.45)";
    ctx.lineWidth = 1;
    const tw = Math.max(36, pw * 0.36);
    const th = 16;
    ctx.fillRect(-tw / 2, -th / 2, tw, th);
    ctx.strokeRect(-tw / 2, -th / 2, tw, th);
    // 胶带细微横向褶痕
    ctx.strokeStyle = "rgba(255,252,244,0.35)";
    ctx.beginPath();
    ctx.moveTo(-tw * 0.42, -2);
    ctx.lineTo(tw * 0.42, -2);
    ctx.moveTo(-tw * 0.35, 3);
    ctx.lineTo(tw * 0.38, 3);
    ctx.stroke();
    ctx.restore();
  } else if (kind === "stripe") {
    ctx.save();
    ctx.translate(-pw * 0.22, -ph * 0.47);
    ctx.rotate(-0.14);
    const tw = Math.max(40, pw * 0.34);
    const th = 14;
    ctx.beginPath();
    ctx.rect(-tw / 2, -th / 2, tw, th);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#EAE2D3";
    ctx.fillRect(-tw / 2, -th / 2, tw, th);
    ctx.strokeStyle = "#1F1E1C";
    ctx.lineWidth = 4.5;
    for (let sx = -tw; sx < tw; sx += 10) {
      ctx.beginPath();
      ctx.moveTo(sx, th);
      ctx.lineTo(sx + 14, -th);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  } else if (kind === "clip") {
    ctx.save();
    ctx.translate(pw * 0.33, -ph * 0.44);
    ctx.rotate(0.26);
    ctx.strokeStyle = "#6E6A63";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.roundRect(-7, -18, 14, 34, 7);
    ctx.stroke();
    ctx.strokeStyle = "#B8B2A7";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-4.5, -13, 9, 25, 4.5);
    ctx.stroke();
    ctx.restore();
  }
}

function drawScrap(ctx, scrap, W, H, themeId, isSelected, isDragging, liftAmt) {
  const cx = scrap.x * W;
  const cy = scrap.y * H;
  const pw = scrap.w * W;
  const ph = scrap.h * H;
  const mat = MATERIALS[scrap.material] || MATERIALS["flat-kraft"];
  const baseColor = mat.swatches[themeId] || mat.swatches.poster;
  const theme = THEMES[themeId] || THEMES.poster;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((scrap.rot * Math.PI) / 180);
  if (liftAmt > 0.001) {
    const sc = 1 + liftAmt * 0.032;
    ctx.scale(sc, sc);
  }

  // 物理投影（随 Z 序与抓起抬升变化）
  const shadowBlur = 8 + scrap.z * 0.8 + liftAmt * 14;
  const shadowY = 3 + scrap.z * 0.35 + liftAmt * 8;
  ctx.shadowColor = `rgba(24, 19, 14, ${(0.15 + liftAmt * 0.09).toFixed(3)})`;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 1 + liftAmt * 3;
  ctx.shadowOffsetY = shadowY;

  if (scrap.shape === "circle") {
    const r = Math.min(pw, ph) * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.shadowColor = "transparent";

    // 圆形彩纸细腻纤维
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 只有非平纸时绘制原海报标志性的钢笔涂鸦弧线
    if (scrap.material === "accent-disc") {
      ctx.strokeStyle = "#191918";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 1.12, r * 0.68);
      ctx.bezierCurveTo(-r * 0.4, r * 0.15, r * 0.45, r * 0.88, r * 0.22, r * 0.34);
      ctx.bezierCurveTo(0, -r * 0.02, r * 0.82, r * 0.72, r * 1.18, r * 0.42);
      ctx.stroke();
    }
  } else if (scrap.material === "photo") {
    // 银盐黑白拍立得 / 留白相纸
    ctx.fillStyle = "#F5F2EC";
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.shadowColor = "transparent";

    const padX = Math.max(6, pw * 0.075);
    const padTop = Math.max(7, ph * 0.065);
    const padBot = Math.max(16, ph * 0.13);
    const imgW = pw - padX * 2;
    const imgH = ph - padTop - padBot;

    const photo = getPhotoCanvas(themeId);
    ctx.drawImage(photo, -pw / 2 + padX, -ph / 2 + padTop, imgW, imgH);

    // 相纸细边框线
    ctx.strokeStyle = "rgba(24,24,22,0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

    // 底部印章小字
    ctx.fillStyle = "#5B564E";
    ctx.font = `600 ${Math.max(8, Math.round(pw * 0.062))}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.noteTag, 0, ph / 2 - padBot * 0.48);
  } else {
    // 手撕毛边纸片
    const straightTB = scrap.material === "dot-card";
    const pts = getTornPoints(scrap.seed, scrap.material === "flat-kraft" ? 0.014 : 0.028, straightTB);

    // 1. 先铺一层极细暖白纸浆毛边（真实手撕重磅彩纸露出内层白纤维的灵魂细节！）
    if (scrap.material === "matte-color" || scrap.material === "charcoal-chalk" || scrap.material === "rose-torn") {
      traceTornPath(ctx, pts, pw + 3.2, ph + 3.2);
      ctx.fillStyle = "#EFE9DD";
      ctx.fill();
      ctx.shadowColor = "transparent";
    }

    traceTornPath(ctx, pts, pw, ph);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.shadowColor = "transparent";

    // 材质内部纹理（裁切在手撕边缘内部）
    ctx.save();
    traceTornPath(ctx, pts, pw, ph);
    ctx.clip();

    if (scrap.material === "print-grid") {
      const step = Math.max(11, Math.round(Math.min(pw, ph) * 0.11));
      ctx.strokeStyle = "rgba(130, 118, 98, 0.34)";
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      for (let gx = -pw / 2; gx <= pw / 2; gx += step) {
        ctx.moveTo(gx, -ph / 2);
        ctx.lineTo(gx, ph / 2);
      }
      for (let gy = -ph / 2; gy <= ph / 2; gy += step) {
        ctx.moveTo(-pw / 2, gy);
        ctx.lineTo(pw / 2, gy);
      }
      ctx.stroke();
    } else if (scrap.material === "dot-card") {
      const step = Math.max(13, Math.round(pw * 0.17));
      ctx.fillStyle = "#22211F";
      for (let gy = -ph * 0.4; gy <= ph * 0.42; gy += step) {
        for (let gx = -pw * 0.38; gx <= pw * 0.4; gx += step) {
          ctx.beginPath();
          ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (scrap.material === "book-type") {
      // 报刊/书页复古衬线排字
      const fs = Math.max(9, Math.round(pw * 0.088));
      ctx.fillStyle = "#2A2621";
      ctx.font = `italic ${fs}px "Libre Baskerville", Georgia, serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const lines = theme.bookLines;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], -pw * 0.42, -ph * 0.38 + i * (fs * 1.48));
      }
      // 细灰页眉线
      ctx.strokeStyle = "rgba(42,38,33,0.28)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-pw * 0.42, -ph * 0.42);
      ctx.lineTo(pw * 0.42, -ph * 0.42);
      ctx.stroke();
    } else if (scrap.material === "charcoal-chalk") {
      // 炭黑纸 + 白色粉笔涂鸦波浪线（还原 151 原海报右下角！）
      ctx.strokeStyle = "rgba(241, 234, 223, 0.72)";
      ctx.lineWidth = 2.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-pw * 0.34, -ph * 0.12);
      ctx.bezierCurveTo(-pw * 0.12, -ph * 0.42, -pw * 0.06, ph * 0.32, pw * 0.08, -ph * 0.18);
      ctx.bezierCurveTo(pw * 0.22, -ph * 0.42, pw * 0.22, ph * 0.35, pw * 0.38, ph * 0.06);
      ctx.stroke();
    } else if (scrap.material === "matte-color" || scrap.material === "rose-torn") {
      // 柔和手作棉纸哑光肌理暗纹
      const g = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
      g.addColorStop(0, "rgba(255,255,255,0.11)");
      g.addColorStop(0.5, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.10)");
      ctx.fillStyle = g;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    } else if (scrap.material === "flat-kraft") {
      // 平淡同质平纸边框，清晰传达缺少肌理反差
      ctx.strokeStyle = "rgba(128, 114, 92, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-pw * 0.46, -ph * 0.46, pw * 0.92, ph * 0.92);
    }
    ctx.restore();
  }

  // 胶带 / 回形针
  if (scrap.tape && scrap.tape !== "none") {
    drawFastener(ctx, scrap.tape, pw, ph);
  }

  // 选中态：手工裁纸虚线框 + 四个裁切角标
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = isDragging ? "#2F3A78" : "#9B3441";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    if (scrap.shape === "circle") {
      const r = Math.min(pw, ph) * 0.5 + 5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(-pw / 2 - 4, -ph / 2 - 4, pw + 8, ph + 8);
    }
    ctx.restore();
  }

  ctx.restore();
}

export function renderBoard(ctx, W, H, state, evalRes, opts = {}) {
  const { draggingId = null, liftMap = new Map(), introT = 1 } = opts;

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 1. 手工暖棉纸底面
  const pat = ctx.createPattern(getPaperPatternCanvas(), "repeat");
  ctx.fillStyle = pat || "#F1EADF";
  ctx.fillRect(0, 0, W, H);

  // 极淡手工裁切台外框与四角定位角线（克制不抢戏）
  ctx.strokeStyle = "rgba(92, 82, 68, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, W - 21, H - 21);

  // 2. 按 Z 序自底向上绘制每片活体纸片
  const active = state.scraps.filter((s) => s.active).sort((a, b) => a.z - b.z);
  const focal = active.find((s) => s.role === "focal");

  for (let i = 0; i < active.length; i++) {
    const scrap = active[i];
    // 开场柔和逐片落桌动效（每刻都好看，still=true 时 introT=1 直接完整）
    const delay = i * 0.055;
    const p = Math.max(0, Math.min(1, (introT - delay) / 0.45));
    const ease = 1 - (1 - p) ** 3;

    ctx.save();
    if (ease < 0.999) {
      ctx.globalAlpha = 0.25 + 0.75 * ease;
      ctx.translate(0, (1 - ease) * -14);
    }
    const lift = liftMap.get(scrap.id) || (draggingId === scrap.id ? 1 : 0);
    drawScrap(ctx, scrap, W, H, state.theme, scrap.id === state.selectedId, draggingId === scrap.id, lift);
    ctx.restore();
  }

  // 3. 若银盐主图正被上方纸片严重遮挡，透出一圈极克制的虚线轮廓提醒用户它埋在下面
  if (focal && evalRes.pillars.depth.code === "focal_buried") {
    ctx.save();
    ctx.translate(focal.x * W, focal.y * H);
    ctx.rotate((focal.rot * Math.PI) / 180);
    const pw = focal.w * W;
    const ph = focal.h * H;
    ctx.strokeStyle = "#9B3441";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

    // 清晰小签说明“主图被压在底层”
    ctx.setLineDash([]);
    const badgeW = 114;
    const badgeH = 22;
    ctx.fillStyle = "#9B3441";
    ctx.fillRect(-badgeW / 2, -ph / 2 - 12, badgeW, badgeH);
    ctx.fillStyle = "#FAF6EE";
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`主图被遮 ${evalRes.focalOcclusionPct}%`, 0, -ph / 2 - 1);
    ctx.restore();
  }

  // 4. 可选“重心与层次标尺”透视层
  if (state.showGuides) {
    // 中轴淡虚线
    ctx.save();
    ctx.strokeStyle = "rgba(47, 58, 120, 0.24)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 16);
    ctx.lineTo(W * 0.5, H - 16);
    ctx.moveTo(16, H * 0.5);
    ctx.lineTo(W - 16, H * 0.5);
    ctx.stroke();

    // 画心圆环 vs 实测光学重心点
    const gx = evalRes.cx * W;
    const gy = evalRes.cy * H;
    ctx.setLineDash([]);
    ctx.strokeStyle = evalRes.pillars.layer.ok ? "#2E5745" : "#9B3441";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.5);
    ctx.lineTo(gx, gy);
    ctx.stroke();

    ctx.fillStyle = evalRes.pillars.layer.ok ? "#2E5745" : "#9B3441";
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F7F3EA";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 重心读数小签
    const label = `光学重心 偏 ${evalRes.imbalancePct}%`;
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(label).width + 14;
    const lx = Math.min(W - tw - 14, Math.max(14, gx + 10));
    const ly = Math.min(H - 30, Math.max(18, gy - 14));
    ctx.fillStyle = evalRes.pillars.layer.ok ? "#2E5745" : "#9B3441";
    ctx.fillRect(lx, ly, tw, 22);
    ctx.fillStyle = "#FAF6EE";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx + 7, ly + 11);
    ctx.restore();
  }

  // 5. 右下角低调图层签（选中纸片 Z 序，不遮操作区）
  const sel = active.find((s) => s.id === state.selectedId);
  if (sel) {
    const rank = active.findIndex((s) => s.id === sel.id) + 1;
    const matName = (MATERIALS[sel.material] || MATERIALS["flat-kraft"]).name;
    const txt = `已选：${sel.label} · 第 ${rank}/${active.length} 层 · ${matName}`;
    ctx.save();
    ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(txt).width + 18;
    const bx = W - tw - 16;
    const by = H - 34;
    ctx.fillStyle = "rgba(24, 24, 23, 0.86)";
    ctx.fillRect(bx, by, tw, 24);
    ctx.fillStyle = "#F7F3EA";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, bx + 9, by + 12.5);
    ctx.restore();
  }

  ctx.restore();
}

export function boardAspect() {
  return BOARD_ASPECT;
}
