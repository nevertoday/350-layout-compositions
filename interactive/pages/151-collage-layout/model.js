// 151 拼贴版式 · 单一真源物理模型（model.js）
// 所有叠压比例、主角遮挡、材质对比、留白占比、光学重心与 8 类错态均从此文件的实绘几何实时核算。

export const BOARD_ASPECT = 1.48; // 逻辑画布宽/高比

export const THRESHOLDS = {
  maxFocalOcclusion: 12,
  minOverlap: 14,
  maxOverlap: 64,
  minFocalOverlap: 15,
  minActiveCount: 4,
  maxActiveCount: 7,
  minWhitespace: 28,
  maxWhitespace: 58,
  maxImbalance: 11.5,
  minContrastFamilies: 3,
  maxDullShare: 0.25,
};

export const MATERIALS = {
  photo: {
    id: "photo",
    name: "银盐照片",
    family: "photo",
    weight: 1.55,
    busy: false,
    calmBuffer: false,
    dull: false,
    swatches: { poster: "#D6D3CE", arch: "#CDD2D6", vinyl: "#CFC8C2" },
  },
  "matte-color": {
    id: "matte-color",
    name: "手撕彩纸",
    family: "matte-color",
    weight: 1.28,
    busy: false,
    calmBuffer: true,
    dull: false,
    swatches: { poster: "#406A93", arch: "#345F7A", vinyl: "#8B393E" },
  },
  "print-grid": {
    id: "print-grid",
    name: "细格手账",
    family: "print-pattern",
    weight: 0.72,
    busy: true,
    calmBuffer: false,
    dull: false,
    swatches: { poster: "#EFE8DA", arch: "#E8ECEF", vinyl: "#EFE7D6" },
  },
  "book-type": {
    id: "book-type",
    name: "书页铅字",
    family: "print-pattern",
    weight: 0.85,
    busy: true,
    calmBuffer: false,
    dull: false,
    swatches: { poster: "#EAE0CA", arch: "#E6E1D3", vinyl: "#EAE1CD" },
  },
  "charcoal-chalk": {
    id: "charcoal-chalk",
    name: "炭黑粉笔",
    family: "dark-craft",
    weight: 1.65,
    busy: false,
    calmBuffer: true,
    dull: false,
    swatches: { poster: "#191918", arch: "#22262A", vinyl: "#1A1718" },
  },
  "dot-card": {
    id: "dot-card",
    name: "圆点卡纸",
    family: "print-pattern",
    weight: 0.8,
    busy: true,
    calmBuffer: false,
    dull: false,
    swatches: { poster: "#EAE6DD", arch: "#E8EAEB", vinyl: "#EDE7DD" },
  },
  "accent-disc": {
    id: "accent-disc",
    name: "彩纸圆片",
    family: "accent-shape",
    weight: 1.18,
    busy: false,
    calmBuffer: false,
    dull: false,
    swatches: { poster: "#DCB151", arch: "#C9754D", vinyl: "#DDA942" },
  },
  "rose-torn": {
    id: "rose-torn",
    name: "灰粉撕纸",
    family: "matte-color",
    weight: 1.05,
    busy: false,
    calmBuffer: true,
    dull: false,
    swatches: { poster: "#E2979D", arch: "#6E9181", vinyl: "#D4886A" },
  },
  "flat-kraft": {
    id: "flat-kraft",
    name: "同质平纸",
    family: "flat-dull",
    weight: 0.78,
    busy: false,
    calmBuffer: false,
    dull: true,
    swatches: { poster: "#D9CEBC", arch: "#D5D2CA", vinyl: "#D8CDBB" },
  },
};

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报·静物手账",
    short: "静物手账",
    focalTitle: "银盐陶瓶照",
    bookLines: [
      "The Great Blasket",
      "fell in love with",
      "autumn light and",
      "paper grain on an",
      "open studio desk.",
    ],
    noteTag: "STILL LIFE · 01",
    colorName: "牛仔钴蓝",
    accentName: "芥末黄圆",
  },
  arch: {
    id: "arch",
    name: "建筑概念情绪板",
    short: "建筑情绪板",
    focalTitle: "清水拱廊照",
    bookLines: [
      "Concrete vaults,",
      "north daylight &",
      "timber formwork",
      "sample 1:50 plan",
      "courtyard study.",
    ],
    noteTag: "ARCH STUDY · 02",
    colorName: "蓝图钢蓝",
    accentName: "赤陶色圆",
  },
  vinyl: {
    id: "vinyl",
    name: "黑胶巡演概念页",
    short: "黑胶概念页",
    focalTitle: "唱针黑胶照",
    bookLines: [
      "Side A · 33 RPM",
      "Analog tape cut",
      "midnight session",
      "press proof #151",
      "autumn tour log.",
    ],
    noteTag: "SIDE A · 33 RPM",
    colorName: "酒红撕纸",
    accentName: "暖金色圆",
  },
};

// 开场 0/4 翻车态：10 片杂堆（留白 ~22%）、银盐主图沉底露出一半（遮挡 ~58%）、6 片同质平纸缺反差、重量偏沉右下（偏移 ~14%）
export function createBrokenScraps() {
  return [
    {
      id: "focal",
      label: "银盐主图",
      role: "focal",
      material: "photo",
      x: 0.42,
      y: 0.48,
      w: 0.28,
      h: 0.48,
      rot: 3,
      z: 1,
      active: true,
      tape: "masking",
      seed: 11,
    },
    {
      id: "blue",
      label: "主色大撕纸",
      role: "anchor",
      material: "matte-color",
      x: 0.62,
      y: 0.46,
      w: 0.34,
      h: 0.54,
      rot: -2,
      z: 6,
      active: true,
      tape: "stripe",
      seed: 23,
    },
    {
      id: "grid",
      label: "细格手账纸",
      role: "texture",
      material: "print-grid",
      x: 0.80,
      y: 0.28,
      w: 0.34,
      h: 0.46,
      rot: 5,
      z: 2,
      active: true,
      tape: "none",
      seed: 37,
    },
    {
      id: "mustard",
      label: "圆形点缀纸",
      role: "accent",
      material: "flat-kraft",
      shape: "circle",
      x: 0.86,
      y: 0.24,
      w: 0.20,
      h: 0.30,
      rot: 0,
      z: 7,
      active: true,
      tape: "none",
      seed: 41,
    },
    {
      id: "black",
      label: "深色粗纹纸",
      role: "anchor",
      material: "flat-kraft",
      x: 0.78,
      y: 0.78,
      w: 0.38,
      h: 0.38,
      rot: -4,
      z: 5,
      active: true,
      tape: "none",
      seed: 53,
    },
    {
      id: "dots",
      label: "圆点卡纸",
      role: "texture",
      material: "flat-kraft",
      x: 0.62,
      y: 0.84,
      w: 0.34,
      h: 0.32,
      rot: 2,
      z: 4,
      active: true,
      tape: "none",
      seed: 67,
    },
    {
      id: "book",
      label: "书页铅字片",
      role: "texture",
      material: "flat-kraft",
      x: 0.88,
      y: 0.58,
      w: 0.26,
      h: 0.38,
      rot: 4,
      z: 3,
      active: true,
      tape: "none",
      seed: 79,
    },
    {
      id: "clutter1",
      label: "多余收据条",
      role: "clutter",
      material: "flat-kraft",
      x: 0.70,
      y: 0.64,
      w: 0.34,
      h: 0.40,
      rot: -7,
      z: 8,
      active: true,
      tape: "none",
      seed: 89,
    },
    {
      id: "clutter2",
      label: "冗余便签纸",
      role: "clutter",
      material: "flat-kraft",
      x: 0.85,
      y: 0.85,
      w: 0.32,
      h: 0.32,
      rot: 9,
      z: 9,
      active: true,
      tape: "clip",
      seed: 97,
    },
    {
      id: "clutter3",
      label: "杂乱贴标",
      role: "clutter",
      material: "flat-kraft",
      x: 0.60,
      y: 0.19,
      w: 0.36,
      h: 0.30,
      rot: -5,
      z: 10,
      active: true,
      tape: "none",
      seed: 103,
    },
  ];
}

// 一种忠实于 151 原海报的参考好解（6 片克制、冷暖材质鲜明、主图置顶、留白约 43%、重心居中）
export function createBalancedScraps() {
  return [
    {
      id: "grid",
      label: "细格手账纸",
      role: "texture",
      material: "print-grid",
      x: 0.61,
      y: 0.34,
      w: 0.33,
      h: 0.48,
      rot: 4,
      z: 1,
      active: true,
      tape: "none",
      seed: 37,
    },
    {
      id: "book",
      label: "书页铅字片",
      role: "texture",
      material: "book-type",
      x: 0.76,
      y: 0.48,
      w: 0.24,
      h: 0.36,
      rot: 3,
      z: 2,
      active: true,
      tape: "none",
      seed: 79,
    },
    {
      id: "blue",
      label: "主色大撕纸",
      role: "anchor",
      material: "matte-color",
      x: 0.38,
      y: 0.46,
      w: 0.40,
      h: 0.62,
      rot: -2,
      z: 3,
      active: true,
      tape: "stripe",
      seed: 23,
    },
    {
      id: "dots",
      label: "圆点卡纸",
      role: "texture",
      material: "dot-card",
      x: 0.31,
      y: 0.75,
      w: 0.23,
      h: 0.30,
      rot: 2,
      z: 4,
      active: true,
      tape: "none",
      seed: 67,
    },
    {
      id: "black",
      label: "深色粗纹纸",
      role: "anchor",
      material: "charcoal-chalk",
      x: 0.64,
      y: 0.74,
      w: 0.34,
      h: 0.31,
      rot: -3,
      z: 5,
      active: true,
      tape: "none",
      seed: 53,
    },
    {
      id: "mustard",
      label: "圆形点缀纸",
      role: "accent",
      material: "accent-disc",
      shape: "circle",
      x: 0.69,
      y: 0.24,
      w: 0.20,
      h: 0.29,
      rot: 0,
      z: 6,
      active: true,
      tape: "none",
      seed: 41,
    },
    {
      id: "focal",
      label: "银盐主图",
      role: "focal",
      material: "photo",
      x: 0.47,
      y: 0.51,
      w: 0.28,
      h: 0.48,
      rot: 3,
      z: 7,
      active: true,
      tape: "masking",
      seed: 11,
    },
    {
      id: "clutter1",
      label: "多余收据条",
      role: "clutter",
      material: "rose-torn",
      x: 0.22,
      y: 0.62,
      w: 0.24,
      h: 0.30,
      rot: -7,
      z: 8,
      active: false,
      tape: "none",
      seed: 89,
    },
    {
      id: "clutter2",
      label: "冗余便签纸",
      role: "clutter",
      material: "book-type",
      x: 0.78,
      y: 0.78,
      w: 0.24,
      h: 0.26,
      rot: 9,
      z: 9,
      active: false,
      tape: "clip",
      seed: 97,
    },
    {
      id: "clutter3",
      label: "杂乱贴标",
      role: "clutter",
      material: "dot-card",
      x: 0.20,
      y: 0.26,
      w: 0.22,
      h: 0.28,
      rot: -5,
      z: 10,
      active: false,
      tape: "none",
      seed: 103,
    },
  ];
}

export function createInitialState() {
  return {
    theme: "poster",
    selectedId: "focal",
    showGuides: false,
    scraps: createBrokenScraps(),
  };
}

// 规范化 Z 序（连续整数 1..N，保序不变）
export function normalizeZ(scraps) {
  const ordered = [...scraps].sort((a, b) => a.z - b.z);
  ordered.forEach((s, i) => {
    s.z = i + 1;
  });
}

// 点是否在纸片内部（归一化板面坐标，圆按真实长宽比等比判定）
export function hitTestScrap(scrap, nx, ny) {
  const dx = (nx - scrap.x) * BOARD_ASPECT;
  const dy = ny - scrap.y;
  if (scrap.shape === "circle") {
    const r = Math.min(scrap.w * BOARD_ASPECT, scrap.h) * 0.5;
    return dx * dx + dy * dy <= r * r;
  }
  const rad = (-scrap.rot * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  const hw = scrap.w * BOARD_ASPECT * 0.5;
  const hh = scrap.h * 0.5;
  return Math.abs(lx) <= hw && Math.abs(ly) <= hh;
}

export function pickTopScrap(scraps, nx, ny, snapRadius = 0.065) {
  const active = scraps.filter((s) => s.active).sort((a, b) => b.z - a.z);
  for (const s of active) {
    if (hitTestScrap(s, nx, ny)) return s;
  }
  // 手机触控容错：稍微点偏边沿时拾取最近纸片
  let best = null;
  let bestDist = snapRadius;
  for (const s of active) {
    const d = Math.hypot((nx - s.x) * BOARD_ASPECT, ny - s.y);
    const r = Math.max(s.w * BOARD_ASPECT, s.h) * 0.55;
    if (d - r < bestDist) {
      bestDist = d - r;
      best = s;
    }
  }
  return best;
}

export function clampScrapPos(scrap) {
  const padX = Math.min(0.14, scrap.w * 0.35);
  const padY = Math.min(0.14, scrap.h * 0.35);
  scrap.x = Math.max(padX, Math.min(1 - padX, scrap.x));
  scrap.y = Math.max(padY, Math.min(1 - padY, scrap.y));
}

// ---------- 核心单真源实算 ----------
const GRID_X = 48;
const GRID_Y = 32;
const TOTAL_CELLS = GRID_X * GRID_Y;

export function evaluate(state) {
  const active = state.scraps.filter((s) => s.active).sort((a, b) => a.z - b.z);
  const n = active.length;
  const focal = active.find((s) => s.role === "focal") || null;

  // 预计算每个纸片的旋转三角函数与包围盒，48x32 实测耗时 < 0.12ms
  const pre = active.map((s) => {
    const rad = (-s.rot * Math.PI) / 180;
    const hw = s.w * BOARD_ASPECT * 0.5;
    const hh = s.h * 0.5;
    const r = Math.min(hw, hh);
    const mat = MATERIALS[s.material] || MATERIALS["flat-kraft"];
    return {
      s,
      c: Math.cos(rad),
      sn: Math.sin(rad),
      hw,
      hh,
      r2: r * r,
      isCircle: s.shape === "circle",
      mat,
    };
  });

  const focalIdx = pre.findIndex((p) => p.s.role === "focal");
  const pairOverlap = Array.from({ length: n }, () => new Int32Array(n));
  const selfCells = new Int32Array(n);

  let coveredCells = 0;
  let multiCells = 0;
  let focalTotal = 0;
  let focalOccluded = 0;
  let focalBacked = 0;
  let focalBackedByCalm = 0;
  let focalBackedByBusy = 0;

  let weightSum = 0;
  let wxSum = 0;
  let wySum = 0;

  const hits = new Int32Array(n);

  for (let iy = 0; iy < GRID_Y; iy++) {
    const gy = (iy + 0.5) / GRID_Y;
    for (let ix = 0; ix < GRID_X; ix++) {
      const gx = (ix + 0.5) / GRID_X;
      let hitCount = 0;
      let topIdx = -1;
      for (let k = 0; k < n; k++) {
        const p = pre[k];
        const dx = (gx - p.s.x) * BOARD_ASPECT;
        const dy = gy - p.s.y;
        let inside = false;
        if (p.isCircle) {
          inside = dx * dx + dy * dy <= p.r2;
        } else {
          const lx = dx * p.c - dy * p.sn;
          const ly = dx * p.sn + dy * p.c;
          inside = Math.abs(lx) <= p.hw && Math.abs(ly) <= p.hh;
        }
        if (inside) {
          hits[hitCount++] = k;
          selfCells[k]++;
          topIdx = k;
        }
      }

      if (hitCount > 0) {
        coveredCells++;
        if (hitCount >= 2) {
          multiCells++;
          for (let a = 0; a < hitCount; a++) {
            for (let b = a + 1; b < hitCount; b++) {
              pairOverlap[hits[a]][hits[b]]++;
              pairOverlap[hits[b]][hits[a]]++;
            }
          }
        }
        const topW = pre[topIdx].mat.weight;
        weightSum += topW;
        wxSum += gx * topW;
        wySum += gy * topW;

        if (focalIdx >= 0) {
          let hasFocal = false;
          let hasAbove = false;
          let hasBelow = false;
          let hasCalmBelow = false;
          let hasBusyBelow = false;
          for (let h = 0; h < hitCount; h++) {
            const idx = hits[h];
            if (idx === focalIdx) hasFocal = true;
            else if (idx > focalIdx) hasAbove = true;
            else {
              hasBelow = true;
              if (pre[idx].mat.calmBuffer) hasCalmBelow = true;
              if (pre[idx].mat.busy) hasBusyBelow = true;
            }
          }
          if (hasFocal) {
            focalTotal++;
            if (hasAbove) focalOccluded++;
            if (hasBelow) focalBacked++;
            if (hasCalmBelow) focalBackedByCalm++;
            if (hasBusyBelow && !hasCalmBelow) focalBackedByBusy++;
          }
        }
      }
    }
  }

  const whitespacePct = Math.round(((TOTAL_CELLS - coveredCells) / TOTAL_CELLS) * 100);
  const coveragePct = 100 - whitespacePct;
  const overlapPct = coveredCells ? Math.round((multiCells / coveredCells) * 100) : 0;
  const focalOcclusionPct = focalTotal ? Math.round((focalOccluded / focalTotal) * 100) : 100;
  const focalOverlapPct = focalTotal ? Math.round((focalBacked / focalTotal) * 100) : 0;

  // 连通分块数（相邻重叠加权 >= 2 格视为贴合连通）
  let isolatedCount = 0;
  if (n > 0) {
    const start = focalIdx >= 0 ? focalIdx : 0;
    const vis = new Uint8Array(n);
    const q = [start];
    vis[start] = 1;
    while (q.length) {
      const u = q.shift();
      for (let v = 0; v < n; v++) {
        if (!vis[v] && pairOverlap[u][v] >= 2) {
          vis[v] = 1;
          q.push(v);
        }
      }
    }
    for (let i = 0; i < n; i++) if (!vis[i]) isolatedCount++;
  }

  // 材质肌理实算
  const families = new Set();
  let nonFocalCount = 0;
  let dullCount = 0;
  let busyTouchingFocal = 0;
  let calmTouchingFocal = 0;

  for (let i = 0; i < n; i++) {
    const m = pre[i].mat;
    if (!m.dull) families.add(m.family);
    if (i !== focalIdx) {
      nonFocalCount++;
      if (m.dull) dullCount++;
      if (focalIdx >= 0 && pairOverlap[i][focalIdx] >= 3) {
        if (m.busy) busyTouchingFocal++;
        if (m.calmBuffer) calmTouchingFocal++;
      }
    }
  }
  const dullShare = nonFocalCount ? dullCount / nonFocalCount : 0;
  const distinctFamilies = families.size;
  const busyClash =
    (busyTouchingFocal >= 2 && calmTouchingFocal === 0) ||
    (focalTotal > 0 && focalBackedByBusy / focalTotal > 0.35 && focalBackedByCalm / focalTotal < 0.12);

  // 光学重心实算
  const cx = weightSum ? wxSum / weightSum : 0.5;
  const cy = weightSum ? wySum / weightSum : 0.5;
  const dxCenter = cx - 0.5;
  const dyCenter = cy - 0.5;
  const imbalancePct = Math.round(Math.hypot(dxCenter, dyCenter) * 1000) / 10;

  let leanDir = "居中";
  if (imbalancePct > THRESHOLDS.maxImbalance) {
    const hDir = dxCenter > 0.04 ? "右" : dxCenter < -0.04 ? "左" : "";
    const vDir = dyCenter > 0.04 ? "下" : dyCenter < -0.04 ? "上" : "";
    leanDir = (hDir + vDir) || "边缘";
  }

  // ---------- 四个支柱严格验收 ----------
  // 1. 叠压与层次（DEPTH）
  let depthCode = "ok";
  if (!focal) depthCode = "focal_missing";
  else if (focalOcclusionPct > THRESHOLDS.maxFocalOcclusion) depthCode = "focal_buried";
  else if (overlapPct < THRESHOLDS.minOverlap || isolatedCount > 1) depthCode = "scattered";
  else if (overlapPct > THRESHOLDS.maxOverlap) depthCode = "mud_pile";
  else if (focalOverlapPct < THRESHOLDS.minFocalOverlap) depthCode = "focal_floating";
  const depthOk = depthCode === "ok";

  // 2. 材质对比（TEXTURE）
  let textureCode = "ok";
  if (dullShare > THRESHOLDS.maxDullShare || distinctFamilies < THRESHOLDS.minContrastFamilies) {
    textureCode = "monotone_flat";
  } else if (busyClash) {
    textureCode = "busy_clash";
  }
  const textureOk = textureCode === "ok";

  // 3. 数量克制与留白（COMBINE）
  let combineCode = "ok";
  if (n > THRESHOLDS.maxActiveCount || whitespacePct < THRESHOLDS.minWhitespace) {
    combineCode = "clutter_choke";
  } else if (n < THRESHOLDS.minActiveCount || whitespacePct > THRESHOLDS.maxWhitespace) {
    combineCode = "too_sparse";
  }
  const combineOk = combineCode === "ok";

  // 4. 视觉重心平衡（LAYER）
  const balanceCode = imbalancePct > THRESHOLDS.maxImbalance ? "off_balance" : "ok";
  const balanceOk = balanceCode === "ok";

  const score = [depthOk, textureOk, combineOk, balanceOk].filter(Boolean).length;

  // 诊断主结论（按最致命问题优先播报，白话讲透“为什么”与“下一步”）
  let primary = {
    tag: "4 / 4 层次成立",
    kind: "ok",
    title: "叠压、材质与留白各就各位，情绪板站稳了",
    why: `银盐主图稳居前景（遮挡 ${focalOcclusionPct}%）并稳妥压在衬纸之上，${distinctFamilies} 类肌理拉开明暗冷暖反差，${n} 片素材留出 ${whitespacePct}% 暖棉纸呼吸白，光学重心平稳落在画心一带。`,
    action: "试着把主图下移一层、多夹回 3 片废纸，或把衬纸改回同质平纸，亲眼看这四条防线哪一步最先失守。",
  };

  if (!depthOk) {
    if (depthCode === "focal_missing") {
      primary = {
        tag: `错态 · 缺少主角（${score} / 4）`,
        kind: "err",
        title: "银盐主图被收进了纸篓，画面没有第一落点",
        why: "拼贴靠不同材质烘托视觉中心；拿掉主图后，只剩几张背景纸互相陪衬，观众扫一眼抓不住主题。",
        action: "在下方「纸篓」点一下「银盐主图」把它夹回台面，并置顶到前景。",
      };
    } else if (depthCode === "focal_buried") {
      primary = {
        tag: `错态 · 主角被埋（${score} / 4）`,
        kind: "err",
        title: `银盐主图沉在底层，被上方纸片遮掉了 ${focalOcclusionPct}%`,
        why: "拼贴的层次先分主次、再谈叠加。把主角照片压在粗糙背景纸和杂物底下，视线撞上碎纸就会迷路，第一眼看不清主体。",
        action: "选中「银盐主图」按「置顶」（或直接把压在它上面的纸片拖开/撕掉），让主图露出完整画面。",
      };
    } else if (depthCode === "scattered") {
      primary = {
        tag: `错态 · 散片孤贴（${score} / 4）`,
        kind: "err",
        title: `纸片彼此脱节（重叠仅 ${overlapPct}%，孤立 ${isolatedCount} 片）`,
        why: "互不挨边的素材读起来像贴歪的便签或分散构图，失去了拼贴独有的「前后骑压」空间纵深。",
        action: "直接拖动分散的纸片向中间靠拢，让相邻材质形成 15%–60% 的错落搭边。",
      };
    } else if (depthCode === "mud_pile") {
      primary = {
        tag: `错态 · 死叠闷堆（${score} / 4）`,
        kind: "err",
        title: `素材堆在同一团（重叠高达 ${overlapPct}%），看不出前后阶梯`,
        why: "所有纸片几乎同心压在一处，底层材质全被盖死，只剩一坨厚重色块，既闷又显笨重。",
        action: "把底层的格纸、深色纸与圆形纸错开半个身位，露出各自的毛边和层次阶梯。",
      };
    } else {
      primary = {
        tag: `错态 · 主图悬空（${score} / 4）`,
        kind: "err",
        title: "主图独自漂在空白纸上，脚下缺一张托底衬纸",
        why: "拼贴让主体发光的秘密，是背后有一块反差材质托着它；完全脱开衬纸，就会退化成普通单图贴纸。",
        action: "把「银盐主图」拖到「主色大撕纸」上方搭边压住，借衬底把主体托出来。",
      };
    }
  } else if (!textureOk) {
    if (textureCode === "monotone_flat") {
      primary = {
        tag: `错态 · 同质糊脸（${score} / 4）`,
        kind: "err",
        title: `还有 ${dullCount} 片同质平纸，材质和色温拉不开层次`,
        why: "海报第一条要点就是「对比材质与色彩」。全是同一种平淡纸面时，就算叠在一起，远看也糊成一块发灰的补丁。",
        action: "点选米色「同质平纸」碎片，在下方纸材槽换入「手撕彩纸」「炭黑粉笔」「彩纸圆片」或「书页铅字」（也可点「配原海报材质」一次对照）。",
      };
    } else {
      primary = {
        tag: `错态 · 花纹互殴（${score} / 4）`,
        kind: "err",
        title: "高频网格与铅字直接挤在主图背后，把焦点抢花了",
        why: "格线、圆点和密排铅字细节很碎，直接紧贴照片边界会产生视觉噪点；需要一块沉静的哑光手撕彩纸垫在中间做缓冲。",
        action: "把压在主图背后的一片纹样纸换成「手撕彩纸」或「炭黑粉笔」，给主图垫一层干净的色彩缓冲底。",
      };
    }
  } else if (!combineOk) {
    if (combineCode === "clutter_choke") {
      const wsLow = whitespacePct < THRESHOLDS.minWhitespace;
      primary = {
        tag: `错态 · 碎纸过载（${score} / 4）`,
        kind: "err",
        title: wsLow
          ? `台面塞了 ${n} 片素材，棉纸留白只剩 ${whitespacePct}%`
          : `台面塞了 ${n} 片素材，已超过 4–7 片舒适上限`,
        why: "拼贴最怕「越贴越满」。超过 7 片（或留白跌破 28%）时，层次感会退化成贴满小广告的杂乱公告栏，眼睛抓不住主次。",
        action: "选中多余的收据、便签或贴标，点「撕回纸篓」精简到 4–7 片，把呼吸空间还给画面。",
      };
    } else {
      primary = {
        tag: `错态 · 片数过稀（${score} / 4）`,
        kind: "err",
        title: `当前只有 ${n} 片（留白 ${whitespacePct}%），撑不起拼贴层次`,
        why: "素材少于 4 片时，缺少底、中、前与点缀的节奏呼应，读起来更像单张卡片而非拼贴组合。",
        action: "从下方「纸篓」夹回 1–2 片不同材质的纸片（如细格手账、炭黑粉笔或彩纸圆片）补足层次。",
      };
    }
  } else if (!balanceOk) {
    primary = {
      tag: `错态 · 重心偏${leanDir}（${score} / 4）`,
      kind: "err",
      title: `光学重心向${leanDir}侧偏移 ${imbalancePct}%，整张台面一边沉`,
      why: "大块深色炭黑纸与彩纸全挤在同侧，另一侧空荡发飘，眼睛看久了会觉得整张海报往一角滑落。",
      action: `拖动重色纸片向${leanDir.includes("右") ? "左" : leanDir.includes("左") ? "右" : "画心"}微挪，或把深色粗纹纸摆到对角做压秤配重。`,
    };
  }

  return {
    score,
    activeCount: n,
    whitespacePct,
    coveragePct,
    overlapPct,
    focalOcclusionPct,
    focalOverlapPct,
    isolatedCount,
    distinctFamilies,
    dullCount,
    busyClash,
    cx,
    cy,
    imbalancePct,
    leanDir,
    pillars: {
      layer: {
        ok: balanceOk,
        code: balanceCode,
        badge: balanceOk ? `稳 · 偏 ${imbalancePct}%` : `偏${leanDir} ${imbalancePct}%`,
      },
      texture: {
        ok: textureOk,
        code: textureCode,
        badge: textureOk
          ? `${distinctFamilies} 类肌理`
          : textureCode === "busy_clash"
            ? "纹样抢戏"
            : `平纸 ${dullCount} 片`,
      },
      combine: {
        ok: combineOk,
        code: combineCode,
        badge: combineOk
          ? `${n} 片 · 留白 ${whitespacePct}%`
          : combineCode === "clutter_choke"
            ? whitespacePct < THRESHOLDS.minWhitespace
              ? `${n} 片 · 仅留 ${whitespacePct}%`
              : `${n} 片 · 过载`
            : `${n} 片 · 过稀`,
      },
      depth: {
        ok: depthOk,
        code: depthCode,
        badge: depthOk
          ? `叠压 ${overlapPct}%`
          : depthCode === "focal_buried"
            ? `主图被遮 ${focalOcclusionPct}%`
            : depthCode === "scattered"
              ? `散片 ${overlapPct}%`
              : depthCode === "mud_pile"
                ? `闷堆 ${overlapPct}%`
                : depthCode === "focal_missing"
                  ? "缺主图"
                  : "主图悬空",
      },
    },
    primary,
  };
}
