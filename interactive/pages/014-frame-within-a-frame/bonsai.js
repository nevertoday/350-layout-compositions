// 从页面里那张原海报上裁出庭院里的梅花盆景与白墙青瓦，作为 3D 内景与 SVG 小图的真实主体。
// 海报只内联一次，这里直接读取 #poster 的像素，不增加任何文件体积。

const CROP = { x: 278, y: 552, w: 270, h: 290 };

let canvas = null;
let url = "";
const waiting = [];

export const bonsai = () => canvas;
export const bonsaiURL = () => url;
export const BONSAI_SIZE = { w: CROP.w, h: CROP.h };

export function onBonsai(fn) {
  if (canvas) fn(canvas);
  else waiting.push(fn);
}

async function load() {
  const img = document.getElementById("poster");
  if (!img) return;
  if (!img.complete || !img.naturalWidth) {
    await new Promise((r) => img.addEventListener("load", r, { once: true }));
  }
  const c = document.createElement("canvas");
  c.width = CROP.w;
  c.height = CROP.h;
  const ctx = c.getContext("2d");
  const k = img.naturalWidth / 1086;
  ctx.drawImage(img, CROP.x * k, CROP.y * k, CROP.w * k, CROP.h * k, 0, 0, CROP.w, CROP.h);
  canvas = c;
  url = c.toDataURL("image/jpeg", 0.9);
  waiting.splice(0).forEach((fn) => fn(c));
}

load();
