// 程序化物理质感贴图工坊（零外链、确定性随机、一次生成全局缓存）
// 为 3D PBR（albedo + normal + roughness）、2D 降级画布、各节剖检仪与小练习共用。

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

function makeCanvas(size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

// 快速周期性值噪声（无接缝平铺）
function createTileNoise(gridSize, seed) {
  const rnd = mulberry32(seed);
  const g = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const at = (ix, iy) => g[((iy % gridSize) + gridSize) % gridSize * gridSize + (((ix % gridSize) + gridSize) % gridSize)];
  return (u, v) => {
    const x = u * gridSize;
    const y = v * gridSize;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}

function clamp255(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

// 从高度图生成切线空间法线贴图（给 Three.js MeshStandardMaterial 提供锐利微影）
function normalCanvasFromHeight(height, size, strength) {
  const c = makeCanvas(size);
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const hAt = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * strength;
      const dy = (hAt(x, y + 1) - hAt(x, y - 1)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const inv = 1 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      const i = (y * size + x) * 4;
      d[i] = clamp255((nx * 0.5 + 0.5) * 255);
      d[i + 1] = clamp255((ny * 0.5 + 0.5) * 255);
      d[i + 2] = clamp255((nz * 0.5 + 0.5) * 255);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function buildRoughSandstone(size) {
  const n1 = createTileNoise(10, 1031);
  const n2 = createTileNoise(28, 1032);
  const n3 = createTileNoise(64, 1033);
  const rnd = mulberry32(1034);
  const albedo = makeCanvas(size);
  const ctx = albedo.getContext("2d");
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const h = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const f = n1(u, v) * 0.45 + n2(u, v) * 0.33 + n3(u, v) * 0.22;
      // 砂岩粗孔隙与骨料颗粒
      const grain = (rnd() - 0.5) * 0.28;
      const pit = f < 0.34 ? -0.35 * (0.34 - f) / 0.34 : 0;
      const hv = Math.max(0, Math.min(1, f + grain * 0.55 + pit));
      h[y * size + x] = hv;
      const shade = 0.72 + hv * 0.46;
      const i = (y * size + x) * 4;
      d[i] = clamp255(198 * shade + grain * 18);
      d[i + 1] = clamp255(175 * shade + grain * 14);
      d[i + 2] = clamp255(145 * shade + grain * 10);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const normal = normalCanvasFromHeight(h, size, 5.2);
  return { albedo, normal, height: h };
}

function buildGrainyTerracotta(size) {
  const n1 = createTileNoise(12, 2031);
  const n2 = createTileNoise(36, 2032);
  const n3 = createTileNoise(88, 2033);
  const rnd = mulberry32(2034);
  const albedo = makeCanvas(size);
  const ctx = albedo.getContext("2d");
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const h = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const f = n1(u, v) * 0.25 + n2(u, v) * 0.35 + n3(u, v) * 0.40;
      const grit = (rnd() - 0.5) * 0.44;
      const hv = Math.max(0, Math.min(1, f * 0.8 + grit * 0.65 + 0.1));
      h[y * size + x] = hv;
      const shade = 0.68 + hv * 0.52;
      const speck = rnd() < 0.03 ? -26 : rnd() > 0.97 ? 20 : 0;
      const i = (y * size + x) * 4;
      d[i] = clamp255(184 * shade + speck);
      d[i + 1] = clamp255(86 * shade + speck * 0.6);
      d[i + 2] = clamp255(36 * shade + speck * 0.4);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const normal = normalCanvasFromHeight(h, size, 5.8);
  return { albedo, normal, height: h };
}

function buildCottonPaper(size) {
  const n1 = createTileNoise(8, 3031);
  const n2 = createTileNoise(24, 3032);
  const rnd = mulberry32(3033);
  const albedo = makeCanvas(size);
  const ctx = albedo.getContext("2d");
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const h = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const f = n1(u, v) * 0.55 + n2(u, v) * 0.45 + (rnd() - 0.5) * 0.06;
      const hv = Math.max(0, Math.min(1, f));
      h[y * size + x] = hv;
      const shade = 0.94 + hv * 0.08;
      const i = (y * size + x) * 4;
      d[i] = clamp255(234 * shade);
      d[i + 1] = clamp255(223 * shade);
      d[i + 2] = clamp255(205 * shade);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // 叠加柔和可见的手工纸植物纤维丝（海报「纤维可见 · 柔和自然」）
  ctx.save();
  ctx.lineCap = "round";
  for (let k = 0; k < 220; k++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const len = 5 + rnd() * 14;
    const ang = rnd() * Math.PI * 2;
    const bend = (rnd() - 0.5) * 6;
    const bright = rnd() > 0.45;
    ctx.strokeStyle = bright ? "rgba(255,250,242,0.34)" : "rgba(176,156,128,0.22)";
    ctx.lineWidth = 0.6 + rnd() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + bend, y + Math.sin(ang) * len * 0.5 - bend, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();

  const normal = normalCanvasFromHeight(h, size, 1.45);
  return { albedo, normal, height: h };
}

function buildSmoothLacquer(size) {
  const albedo = makeCanvas(size);
  const ctx = albedo.getContext("2d");
  const grad = ctx.createRadialGradient(size * 0.35, size * 0.35, size * 0.04, size * 0.5, size * 0.5, size * 0.72);
  grad.addColorStop(0, "#5C3C22");
  grad.addColorStop(0.55, "#3E2614");
  grad.addColorStop(1, "#2A180B");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const h = new Float32Array(size * size);
  h.fill(0.5);
  const normal = normalCanvasFromHeight(h, size, 0.0);
  return { albedo, normal, height: h };
}

function buildBrushedMetal(size) {
  const rnd = mulberry32(5031);
  const n1 = createTileNoise(14, 5032);
  const albedo = makeCanvas(size);
  const ctx = albedo.getContext("2d");
  const h = new Float32Array(size * size);

  // 斜向拉丝条纹（沿约 34° 方向拉伸，像原海报冷硬拉丝钢三角）
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const cosA = Math.cos(0.56);
  const sinA = Math.sin(0.56);
  // 1D 拉丝波形表
  const stripes = new Float32Array(size * 2);
  for (let i = 0; i < stripes.length; i++) {
    stripes[i] = 0.5 + (rnd() - 0.5) * 0.45 + Math.sin(i * 0.25) * 0.1;
  }
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const proj = x * sinA - y * cosA;
      const along = (x * cosA + y * sinA) / size;
      const idx = ((Math.floor(proj * 1.45) % stripes.length) + stripes.length) % stripes.length;
      const streak = stripes[idx];
      const slow = n1(u, v) * 0.22 + Math.sin(along * Math.PI * 2) * 0.08;
      const hv = Math.max(0, Math.min(1, streak * 0.74 + slow + (rnd() - 0.5) * 0.08));
      h[y * size + x] = hv;
      const base = 98 + hv * 58;
      const i = (y * size + x) * 4;
      d[i] = clamp255(base - 2);
      d[i + 1] = clamp255(base);
      d[i + 2] = clamp255(base + 4);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const normal = normalCanvasFromHeight(h, size, 2.3);
  return { albedo, normal, height: h };
}

let CACHE = null;

export function getTextureSet() {
  if (CACHE) return CACHE;
  const size = 256;
  CACHE = {
    rough: buildRoughSandstone(size),
    grainy: buildGrainyTerracotta(size),
    paper: buildCottonPaper(size),
    smooth: buildSmoothLacquer(size),
    metal: buildBrushedMetal(size),
  };
  return CACHE;
}

// 为小圆点/按钮生成轻量 dataURL 样式质感缩略图
const SWATCH_URLS = {};
export function getSwatchDataUrl(matId) {
  if (SWATCH_URLS[matId]) return SWATCH_URLS[matId];
  const set = getTextureSet()[matId];
  const c = makeCanvas(72);
  const ctx = c.getContext("2d");
  ctx.drawImage(set.albedo, 0, 0, 72, 72);
  if (matId === "smooth") {
    const g = ctx.createRadialGradient(22, 20, 2, 32, 32, 42);
    g.addColorStop(0, "rgba(255,244,230,0.68)");
    g.addColorStop(0.28, "rgba(180,145,112,0.22)");
    g.addColorStop(1, "rgba(15,8,2,0.42)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 72, 72);
  } else if (matId === "metal") {
    const g = ctx.createLinearGradient(0, 0, 72, 72);
    g.addColorStop(0, "rgba(255,255,255,0.28)");
    g.addColorStop(0.42, "rgba(255,255,255,0.02)");
    g.addColorStop(0.55, "rgba(245,248,255,0.34)");
    g.addColorStop(1, "rgba(20,22,25,0.34)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 72, 72);
  }
  SWATCH_URLS[matId] = c.toDataURL("image/png");
  return SWATCH_URLS[matId];
}

// 生成一张高精度的无彩色同均值（灰度均值 ≈ 148）质感样本，专供 01 节「去色同形剖检仪」证明纯质感对比
const GRAY_CACHE = {};
export function getEqualGrayTexture(matId) {
  if (GRAY_CACHE[matId]) return GRAY_CACHE[matId];
  const set = getTextureSet()[matId];
  const src = set.albedo;
  const size = src.width;
  const c = makeCanvas(size);
  const ctx = c.getContext("2d");
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  const lum = new Float32Array(size * size);
  let sum = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    lum[p] = y;
    sum += y;
  }
  const mean = sum / lum.length;
  const targetMean = 148;
  // 放大粗糙/颗粒微影的清晰度，保持各材质平均灰度完全一致
  const gain = matId === "rough" ? 1.45 : matId === "grainy" ? 1.65 : matId === "metal" ? 1.25 : matId === "paper" ? 1.15 : 0.25;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = clamp255(targetMean + (lum[p] - mean) * gain);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  GRAY_CACHE[matId] = c;
  return c;
}
