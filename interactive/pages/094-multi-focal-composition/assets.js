// 从页面内的原海报 <img id="poster"> 实时裁剪出四个焦点摄影块（A 山峰、B 灯塔、C 城影六边形、D 紫纹大理石），
// 并温和修补原海报叠在边缘的小紫色几何徽章，避免重复内联图片体积。

const CROPS = {
  A: { cx: 722, cy: 453, r: 102, patch: null },
  B: { cx: 350, cy: 635, r: 84, patch: { x: 0.72, y: 0.14, rx: 0.27, ry: 0.27, fill: "#1d1a4c" } },
  C: { cx: 746, cy: 845, r: 82, patch: { x: 0.86, y: 0.24, rx: 0.22, ry: 0.24, fill: "#7a5ee0" } },
  D: { cx: 336, cy: 966, r: 78, patch: { x: 0.12, y: 0.16, rx: 0.24, ry: 0.24, fill: "#281948" } },
};

const cache = {};
let ready = false;
const listeners = [];

export const getFocalCrop = (id) => cache[id] || null;
export const assetsReady = () => ready;

export function onAssetsReady(fn) {
  if (ready) fn();
  else listeners.push(fn);
}

function buildCrop(img, key, cfg) {
  const size = Math.round(cfg.r * 2);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const k = (img.naturalWidth || 1086) / 1086;
  const sx = (cfg.cx - cfg.r) * k;
  const sy = (cfg.cy - cfg.r) * k;
  const sw = cfg.r * 2 * k;
  ctx.drawImage(img, sx, sy, sw, sw, 0, 0, size, size);

  // 原海报 B/C/D 边缘各有一枚紫色小几何徽章略微压入照片边角，用柔和同色径向晕化自然过渡
  if (cfg.patch) {
    const px = cfg.patch.x * size;
    const py = cfg.patch.y * size;
    const pr = Math.max(cfg.patch.rx, cfg.patch.ry) * size;
    const g = ctx.createRadialGradient(px, py, pr * 0.18, px, py, pr);
    g.addColorStop(0, cfg.patch.fill);
    g.addColorStop(0.58, cfg.patch.fill);
    g.addColorStop(1, "rgba(25, 20, 66, 0)");
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  cache[key] = c;
}

export function initPosterCrops() {
  const img = document.getElementById("poster");
  if (!img) return;
  const run = () => {
    if (!img.naturalWidth) return;
    for (const [k, cfg] of Object.entries(CROPS)) {
      try {
        buildCrop(img, k, cfg);
      } catch {
        // 降级回程序化矢量焦点
      }
    }
    ready = true;
    listeners.splice(0).forEach((fn) => fn());
  };
  if (img.complete && img.naturalWidth > 0) run();
  else img.addEventListener("load", run, { once: true });
}
