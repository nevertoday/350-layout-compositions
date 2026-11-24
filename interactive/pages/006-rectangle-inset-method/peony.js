// 从页面里那张海报上裁出牡丹那一格，当作每个窗口里的主体。海报只内联一次，这里读它的 src。
// 海报在牡丹右边画了一个标注小框和虚线，裁的时候按上下两行像素的颜色逐列补平。

const CROP = { x: 382, y: 530, w: 320, h: 412 };
const PATCH = { x0: 240, x1: 320, y0: 264, y1: 294 }; // 标注所在的区域（裁剪后的坐标）

let canvas = null;
let url = "";
const waiting = [];

export const peony = () => canvas;
export const peonyURL = () => url;
export const PEONY_SIZE = { w: CROP.w, h: CROP.h };

export function onPeony(fn) {
  if (canvas) fn(canvas);
  else waiting.push(fn);
}

async function load() {
  const img = document.getElementById("poster");
  if (!img.complete || !img.naturalWidth) await new Promise((r) => img.addEventListener("load", r, { once: true }));
  const c = document.createElement("canvas");
  c.width = CROP.w;
  c.height = CROP.h;
  const x = c.getContext("2d", { willReadFrequently: true });
  const k = img.naturalWidth / 1086;
  x.drawImage(img, CROP.x * k, CROP.y * k, CROP.w * k, CROP.h * k, 0, 0, CROP.w, CROP.h);
  const { x0, x1, y0, y1 } = PATCH;
  const data = x.getImageData(x0, y0, x1 - x0, y1 - y0);
  const W = x1 - x0;
  const H = y1 - y0;
  for (let i = 0; i < W; i++) {
    const top = (0 * W + i) * 4;
    const bot = ((H - 1) * W + i) * 4;
    for (let j = 1; j < H - 1; j++) {
      const t = j / (H - 1);
      const p = (j * W + i) * 4;
      for (let ch = 0; ch < 3; ch++) data.data[p + ch] = data.data[top + ch] * (1 - t) + data.data[bot + ch] * t;
    }
  }
  x.putImageData(data, x0, y0);
  canvas = c;
  url = c.toDataURL("image/jpeg", 0.9);
  waiting.splice(0).forEach((fn) => fn(c));
}

load();
