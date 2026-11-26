// 直接从页面内联的原海报 #poster 提取纯黑侧影剪影透明蒙版（零重复内联图片，干净剔除原海报虚线与四角 L 框），
// 并为另外两套片场剧本（剧场独白 / 窗畔凝思）提供纯轮廓侧影路径（严格零五官细节）。

const POSTER_BASE_W = 1086;
// 实测原海报 1086x1448 人物侧影区域：x=444..1022, y=514..1260；圆盘中心约 (733, 646)
const CROP = { x: 428, y: 502, w: 608, h: 760 };
const VLINE_X = 733 - CROP.x; // 305
const HLINE_Y = 646 - CROP.y; // 144

let posterMask = null;
const listeners = [];

export const POSTER_MASK_ASPECT = CROP.w / CROP.h;

export function getPosterSilhouette() {
  return posterMask;
}

export function onSilhouetteReady(fn) {
  if (posterMask) fn(posterMask);
  else listeners.push(fn);
}

function extractMaskFromPoster(img) {
  const k = img.naturalWidth / POSTER_BASE_W;
  const w = Math.round(CROP.w * 0.65); // ~395px
  const h = Math.round(CROP.h * 0.65); // ~494px
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(
    img,
    CROP.x * k,
    CROP.y * k,
    CROP.w * k,
    CROP.h * k,
    0,
    0,
    w,
    h
  );

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const n = w * h;
  const lum = new Float32Array(n);
  const core = new Uint8Array(n);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lum[p] = L;
    // 明确排除酒红 L 取景角（r 高且明显红偏）和暖背景像素，只保留真正漆黑人物实体
    const isMaroon = r > 75 && r > g * 1.45 && r > b * 1.25;
    const isWarmBg = r > 165 && r - b > 24 && L > 0.30;
    if (!isMaroon && !isWarmBg && L < 0.22) core[p] = 1;
  }

  // 从人物躯干正中（约 w*0.48, h*0.76）做 4-邻域连通洪泛，彻底剔除原海报左下/右下独立 L 形取景角及零星虚线点
  const kept = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qHead = 0, qTail = 0;

  // 在躯干附近找稳定种子
  const sx = Math.round(w * 0.48);
  const sy = Math.round(h * 0.78);
  for (let dy = -20; dy <= 20; dy++) {
    for (let dx = -20; dx <= 20; dx++) {
      const x = sx + dx, y = sy + dy;
      if (x >= 0 && x < w && y >= 0 && y < h) {
        const idx = y * w + x;
        if (core[idx] && !kept[idx]) {
          kept[idx] = 1;
          queue[qTail++] = idx;
        }
      }
    }
  }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0 && core[idx - 1] && !kept[idx - 1]) { kept[idx - 1] = 1; queue[qTail++] = idx - 1; }
    if (x + 1 < w && core[idx + 1] && !kept[idx + 1]) { kept[idx + 1] = 1; queue[qTail++] = idx + 1; }
    if (y > 0 && core[idx - w] && !kept[idx - w]) { kept[idx - w] = 1; queue[qTail++] = idx - w; }
    if (y + 1 < h && core[idx + w] && !kept[idx + w]) { kept[idx + w] = 1; queue[qTail++] = idx + w; }
  }

  // 向外膨胀 12px 形成「发丝允许带」：保留发髻四周细腻飘发丝，同时把远离躯干的 L 角彻底拒之门外
  const allow = new Uint8Array(n);
  const R = 12;
  // 先水平膨胀，再垂直膨胀（O(n*R) 极快，< 2ms）
  const tmp = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let dist = R + 1;
    for (let x = 0; x < w; x++) {
      if (kept[row + x]) dist = 0;
      else dist++;
      if (dist <= R) tmp[row + x] = 1;
    }
    dist = R + 1;
    for (let x = w - 1; x >= 0; x--) {
      if (kept[row + x]) dist = 0;
      else dist++;
      if (dist <= R) tmp[row + x] = 1;
    }
  }
  for (let x = 0; x < w; x++) {
    let dist = R + 1;
    for (let y = 0; y < h; y++) {
      if (tmp[y * w + x]) dist = 0;
      else dist++;
      if (dist <= R) allow[y * w + x] = 1;
    }
    dist = R + 1;
    for (let y = h - 1; y >= 0; y--) {
      if (tmp[y * w + x]) dist = 0;
      else dist++;
      if (dist <= R) allow[y * w + x] = 1;
    }
  }

  const vx = Math.round(VLINE_X * (w / CROP.w));
  const hy = Math.round(HLINE_Y * (h / CROP.h));

  const out = ctx.createImageData(w, h);
  const od = out.data;
  for (let y = 0; y < h; y++) {
    const nearH = Math.abs(y - hy) <= 3;
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (!allow[p]) continue;
      const i = p * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const nearV = Math.abs(x - vx) <= 3;
      let L = lum[p];

      if (nearV || nearH) {
        const leftL = lum[y * w + Math.max(0, x - 5)];
        const rightL = lum[y * w + Math.min(w - 1, x + 5)];
        const topL = lum[Math.max(0, y - 5) * w + x];
        const botL = lum[Math.min(h - 1, y + 5) * w + x];
        const insideV = nearV && leftL < 0.22 && rightL < 0.22;
        const insideH = nearH && topL < 0.22 && botL < 0.22;
        if (insideV || insideH) {
          L = 0.02;
        } else {
          const outsideMax = nearV ? Math.max(leftL, rightL) : Math.max(topL, botL);
          if (outsideMax > 0.40) L = 0.96;
        }
      }

      const isMaroon = r > 75 && r > g * 1.45 && r > b * 1.25;
      const isWarmBg = r > 170 && r - b > 26 && L > 0.34;
      // 通用内部闭孔：若该像素在剪影内部（左右各 7px 或上下各 7px 均为实黑躯干），强制补平（彻底消除原海报穿过剪影内部的任何细虚线）
      const inH = x >= 7 && x + 7 < w && kept[p - 7] && kept[p + 7];
      const inV = y >= 7 && y + 7 < h && kept[p - 7 * w] && kept[p + 7 * w];
      let a = 0;
      if (inH || inV) {
        a = 255;
      } else if (!isMaroon && !isWarmBg) {
        if (L <= 0.17) a = 255;
        else if (L < 0.54) {
          const t = 1 - (L - 0.17) / 0.37;
          a = Math.round(Math.pow(t, 1.35) * 255);
        }
      }

      od[i] = 5;
      od[i + 1] = 7;
      od[i + 2] = 7;
      od[i + 3] = a;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

export function initPosterSilhouette() {
  const img = document.getElementById("poster");
  if (!img) return;
  const run = () => {
    if (!img.naturalWidth) return;
    try {
      posterMask = extractMaskFromPoster(img);
      listeners.splice(0).forEach((fn) => fn(posterMask));
    } catch {
      // 若浏览器受限则平稳回退至矢量纯净侧影
    }
  };
  if (img.complete && img.naturalWidth) run();
  else img.addEventListener("load", run, { once: true });
}

// 统一在指定包围盒 (x, y, w, h) 内绘制指定剧本的纯净侧影（全员面向左、零五官细节）
export function drawSilhouette(ctx, scene, box, fill = "#050707") {
  const { x, y, w, h } = box;

  if (scene === "poster" && posterMask) {
    ctx.save();
    ctx.drawImage(posterMask, x, y, w, h);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / 400, h / 500);
  ctx.fillStyle = fill;

  if (scene === "theater") {
    ctx.beginPath();
    ctx.moveTo(96, 500);
    ctx.bezierCurveTo(100, 424, 118, 360, 148, 326);
    ctx.bezierCurveTo(164, 307, 174, 294, 174, 274);
    ctx.bezierCurveTo(174, 257, 165, 248, 152, 243);
    ctx.bezierCurveTo(130, 236, 118, 224, 121, 211);
    ctx.bezierCurveTo(116, 204, 116, 194, 124, 189);
    ctx.bezierCurveTo(119, 182, 119, 175, 125, 168);
    ctx.bezierCurveTo(112, 162, 108, 154, 116, 142);
    ctx.bezierCurveTo(128, 126, 134, 114, 136, 98);
    ctx.bezierCurveTo(140, 62, 176, 28, 224, 26);
    ctx.bezierCurveTo(278, 24, 324, 62, 330, 122);
    ctx.bezierCurveTo(334, 158, 320, 198, 294, 228);
    ctx.bezierCurveTo(280, 246, 274, 266, 284, 290);
    ctx.bezierCurveTo(308, 326, 336, 386, 344, 500);
    ctx.closePath();
    ctx.fill();
  } else if (scene === "window") {
    ctx.beginPath();
    ctx.moveTo(86, 500);
    ctx.bezierCurveTo(92, 426, 114, 364, 142, 334);
    ctx.bezierCurveTo(158, 314, 164, 294, 162, 274);
    ctx.bezierCurveTo(148, 268, 126, 260, 124, 244);
    ctx.bezierCurveTo(122, 234, 128, 226, 122, 218);
    ctx.bezierCurveTo(117, 211, 124, 204, 124, 196);
    ctx.bezierCurveTo(110, 189, 107, 178, 118, 164);
    ctx.bezierCurveTo(127, 150, 132, 134, 136, 112);
    ctx.bezierCurveTo(144, 66, 182, 34, 232, 36);
    ctx.bezierCurveTo(288, 38, 324, 80, 330, 146);
    ctx.bezierCurveTo(336, 212, 324, 286, 336, 364);
    ctx.bezierCurveTo(344, 416, 354, 458, 358, 500);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(74, 500);
    ctx.bezierCurveTo(80, 426, 98, 352, 126, 316);
    ctx.bezierCurveTo(144, 294, 162, 280, 166, 260);
    ctx.bezierCurveTo(156, 248, 148, 242, 138, 238);
    ctx.bezierCurveTo(114, 234, 106, 224, 112, 212);
    ctx.bezierCurveTo(107, 206, 110, 198, 116, 193);
    ctx.bezierCurveTo(111, 186, 113, 178, 120, 173);
    ctx.bezierCurveTo(106, 165, 104, 156, 118, 140);
    ctx.bezierCurveTo(128, 126, 132, 108, 142, 86);
    ctx.bezierCurveTo(158, 48, 194, 26, 244, 30);
    ctx.bezierCurveTo(286, 34, 316, 62, 326, 98);
    ctx.bezierCurveTo(348, 92, 370, 108, 372, 134);
    ctx.bezierCurveTo(374, 164, 352, 188, 324, 188);
    ctx.bezierCurveTo(308, 204, 286, 218, 274, 244);
    ctx.bezierCurveTo(298, 282, 326, 348, 336, 434);
    ctx.lineTo(344, 500);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
