// 从页面内置原海报 <img id="poster"> 裁出中央陶瓶红花圆窗照片，不增加任何额外图片体积。
// 原海报尺寸 1086×1448，圆窗照片核心区域在 cx=596, cy=835, r=156（避开外圈桃粉边框）。

const SRC_W = 1086;
const SRC_H = 1448;
const CROP = { cx: 596, cy: 835, r: 156 };
const OUT_SIZE = 320;

let medallionCanvas = null;
const listeners = [];

export const getMedallion = () => medallionCanvas;

export function onMedallionReady(fn) {
  if (medallionCanvas) fn(medallionCanvas);
  else listeners.push(fn);
}

function buildFromImage(img) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return;
  const kx = img.naturalWidth / SRC_W;
  const ky = img.naturalHeight / SRC_H;
  const sx = (CROP.cx - CROP.r) * kx;
  const sy = (CROP.cy - CROP.r) * ky;
  const sw = CROP.r * 2 * kx;
  const sh = CROP.r * 2 * ky;

  const c = document.createElement("canvas");
  c.width = OUT_SIZE;
  c.height = OUT_SIZE;
  const ctx = c.getContext("2d");
  ctx.save();
  ctx.beginPath();
  ctx.arc(OUT_SIZE / 2, OUT_SIZE / 2, OUT_SIZE / 2 - 1, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_SIZE, OUT_SIZE);
  ctx.restore();

  medallionCanvas = c;
  while (listeners.length) listeners.shift()(c);
}

export function initMedallion() {
  const img = document.getElementById("poster");
  if (!img) return;
  if (img.complete && img.naturalWidth > 0) {
    buildFromImage(img);
  } else {
    img.addEventListener("load", () => buildFromImage(img), { once: true });
  }
}
