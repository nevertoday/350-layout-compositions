// 088 晶体式平衡 — 单真源三维几何与光学核算引擎
// Three.js 实时 3D 舞台、关 WebGL 后的 2D 多面体降级引擎、四隅折线探针与底栏核心要点诊单全部读取同一份几何与光阶真源。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 六方雪晶",
    short: "六方雪晶",
    desc: "六方深钴晶核咬合四向主双锥与四斜向蓝紫柱晶，外端沿轴延展悬浮晶芽。",
    coreScale: 1.0,
    armStyle: "bipyramid",
    palette: {
      coreDark: [4, 55, 147],       // #043793
      coreMid: [53, 96, 184],       // #3560B8
      coreLight: [188, 212, 248],   // 冰白顶核
      primaryA: [67, 108, 208],     // #436CD0
      primaryB: [149, 182, 239],    // #95B6EF
      diagA: [113, 142, 205],       // #718ECD
      diagB: [139, 139, 222],       // #8B8BDE 薰衣草紫
      budA: [98, 128, 216],
      budB: [176, 198, 246],
      edge: [244, 248, 255],
    },
  },
  pavilion: {
    id: "pavilion",
    label: "冰川 · 棱面展馆",
    short: "棱面展馆",
    desc: "呼应 1914 科隆玻璃屋与建筑多面体穹顶，以厚重棱面折出清冽冷光层次。",
    coreScale: 1.14,
    armStyle: "prism",
    palette: {
      coreDark: [18, 46, 118],
      coreMid: [41, 99, 180],       // #2963B4
      coreLight: [204, 226, 252],
      primaryA: [48, 110, 196],
      primaryB: [142, 196, 244],
      diagA: [86, 130, 210],
      diagB: [130, 146, 228],
      budA: [68, 122, 208],
      budB: [182, 214, 250],
      edge: [242, 249, 255],
    },
  },
  mark: {
    id: "mark",
    label: "品牌 · 晶体标志",
    short: "晶体标志",
    desc: "精密科技与光学品牌的几何徽标骨架，以高对比冷钴与冰紫切面锁定识别度。",
    coreScale: 0.92,
    armStyle: "chevron",
    palette: {
      coreDark: [21, 32, 73],       // #152049
      coreMid: [62, 86, 184],
      coreLight: [198, 208, 248],
      primaryA: [58, 92, 204],
      primaryB: [139, 139, 222],
      diagA: [96, 112, 214],
      diagB: [158, 152, 236],
      budA: [82, 108, 212],
      budB: [188, 198, 248],
      edge: [246, 248, 255],
    },
  },
};

export const SYMMETRIES = {
  broken: { id: "broken", label: "断轴偏拼", code: "C1 失序", arms: 8, isPoster: true },
  d2: { id: "d2", label: "D2 双轴", code: "D2 双镜", arms: 6, isPoster: false },
  d4: { id: "d4", label: "D4 四方", code: "D4 四重", arms: 8, isPoster: false },
  d6: { id: "d6", label: "D6 六方", code: "D6 六重", arms: 12, isPoster: false },
  poster: { id: "poster", label: "原海报 · 八芒六核", code: "D2×六核", arms: 8, isPoster: true },
};

// 开场刻意设为 0/4 复合坏态（绝不是答案！）
export function createInitialState() {
  return {
    specimen: "poster",
    symmetry: "broken",
    gap: 0.28,          // +28% 脱节散架
    facetDepth: 0.12,   // 12% 切面压平无折射
    budRatio: 1.18,     // 1.18x 外延晶芽倒挂过重
    lightAngle: 88,     // 88° 正顶弱侧光
    viewYaw: 0.14,      // 轻微立体视角
    viewPitch: -0.10,
    dragMode: "light",  // "light" | "orbit"
    missingArms: [3, 4], // 左侧主棱晶(180°, 含大晶芽)与左上斜晶(125°)缺失，形成真实可测的重心右偏（且保留右侧 0° 主臂标注真实脱节缝）
    armSkew: 17,        // 17° 轴线偏扭
    highlightKey: "",   // "", "structure", "symmetry", "refraction", "growth", "balance"
    pulseT: -1,         // -1 未发射；0..1 偏振光脉行进中
    showGuides: true,
  };
}

// 多组合法解（全部通过单真源 evaluate 达 4/4）
export const SOLUTIONS = {
  posterClassic: {
    label: "原海报经典解",
    patch: {
      symmetry: "poster",
      gap: 0.0,
      facetDepth: 0.58,
      budRatio: 0.44,
      lightAngle: 34,
      viewYaw: 0.14,
      viewPitch: -0.12,
      missingArms: [],
      armSkew: 0,
    },
  },
  hexSnowflake: {
    label: "纯 D6 六方解",
    patch: {
      symmetry: "d6",
      gap: 0.02,
      facetDepth: 0.62,
      budRatio: 0.48,
      lightAngle: 42,
      viewYaw: 0.10,
      viewPitch: -0.10,
      missingArms: [],
      armSkew: 0,
    },
  },
  quadTower: {
    label: "D4 建筑晶塔解",
    patch: {
      symmetry: "d4",
      gap: -0.02,
      facetDepth: 0.68,
      budRatio: 0.36,
      lightAngle: 28,
      viewYaw: 0.18,
      viewPitch: -0.14,
      missingArms: [],
      armSkew: 0,
    },
  },
};

// 反向与边界试错预设（验证双向真错态）
export const FAILURE_MODES = {
  crushed: {
    label: "互穿挤爆",
    patch: { symmetry: "poster", gap: -0.14, facetDepth: 0.58, budRatio: 0.44, lightAngle: 34, missingArms: [], armSkew: 0 },
  },
  asymmetric: {
    label: "缺臂偏载",
    patch: { symmetry: "broken", gap: 0.01, facetDepth: 0.56, budRatio: 0.44, lightAngle: 34, missingArms: [1, 3, 5], armSkew: 14 },
  },
  flat: {
    label: "切面死平",
    patch: { symmetry: "poster", gap: 0.0, facetDepth: 0.10, budRatio: 0.44, lightAngle: 90, missingArms: [], armSkew: 0 },
  },
  glare: {
    label: "过刺眩碎",
    patch: { symmetry: "poster", gap: 0.0, facetDepth: 0.98, budRatio: 0.44, lightAngle: 12, missingArms: [], armSkew: 0 },
  },
  inverted: {
    label: "晶芽倒挂",
    patch: { symmetry: "poster", gap: 0.0, facetDepth: 0.58, budRatio: 1.22, lightAngle: 34, missingArms: [], armSkew: 0 },
  },
  withered: {
    label: "外延枯萎",
    patch: { symmetry: "poster", gap: 0.0, facetDepth: 0.58, budRatio: 0.04, lightAngle: 34, missingArms: [], armSkew: 0 },
  },
};

// 向量数学小工具
const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vCross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vLen = (a) => Math.hypot(a[0], a[1], a[2]) || 1e-6;
const vNorm = (a) => {
  const l = vLen(a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mixRgb = (c1, c2, t) => [
  lerp(c1[0], c2[0], t),
  lerp(c1[1], c2[1], t),
  lerp(c1[2], c2[2], t),
];

// 旋转点（先绕 X 轴 pitch，再绕 Y 轴 yaw）
export function rotatePoint(p, yaw, pitch) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y1 = p[1] * cp - p[2] * sp;
  const z1 = p[1] * sp + p[2] * cp;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x2 = p[0] * cy + z1 * sy;
  const z2 = -p[0] * sy + z1 * cy;
  return [x2, y1, z2];
}

// 绕 Z 轴在平面内旋转并平移
function placeLocal(pt, angleRad, radialOffset) {
  const c = Math.cos(angleRad), s = Math.sin(angleRad);
  const x = pt[0] + radialOffset;
  const y = pt[1];
  return [x * c - y * s, x * s + y * c, pt[2]];
}

// 生成单真源 3D 晶体多面体数据
// 返回: { faces: [{ verts, normal, baseColor, shadeColor, lum, part, armIndex, area }], edges: [[a,b,part]], sockets: [{ index, angle, pos3, missing, isPrimary }], lightDir, coreRadius }
export function buildCrystalMesh(state) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const pal = spec.palette;
  const faces = [];
  const edges = [];

  // 入射平行光方向（由 lightAngle 连续决定，含轻微俯角 z 以便照亮棱面）
  const lRad = (state.lightAngle * Math.PI) / 180;
  // 当 facetDepth 很低时，棱面几乎摊平；同时接近 90° 光源正顶照射时侧向明暗差极弱
  const elev = lerp(0.55, 0.28, clamp(state.facetDepth, 0, 1));
  const lightDir = vNorm([Math.cos(lRad) * Math.cos(elev), Math.sin(lRad) * Math.cos(elev), Math.sin(elev) + 0.35]);
  const viewDir = [0, 0, 1];

  const ridgeZ = lerp(0.03, 0.56, clamp(state.facetDepth, 0.08, 1.0));
  const coreR = 0.50 * spec.coreScale;
  const coreInnerR = coreR * 0.52;
  const coreTopZ = ridgeZ * 0.88;
  const coreMidZ = ridgeZ * 0.26;

  const pushTri = (a, b, c, baseColor, part, armIndex = -1, specBoost = 1.0) => {
    const e1 = vSub(b, a);
    const e2 = vSub(c, a);
    const cross = vCross(e1, e2);
    const area = 0.5 * vLen(cross);
    const n = vNorm(cross);
    // 真实光照计算：结合切面法线与入射光，同时反映画布上真实明暗韵律
    const ndotl = Math.max(0, vDot(n, lightDir));
    const halfVec = vNorm([lightDir[0] + viewDir[0], lightDir[1] + viewDir[1], lightDir[2] + viewDir[2]]);
    const specPow = state.facetDepth > 0.84 ? 14 : 24;
    const specular = Math.pow(Math.max(0, vDot(n, halfVec)), specPow) * (0.28 + state.facetDepth * 0.55) * specBoost;
    // 过平（facetDepth < 0.25）时法线趋近 (0,0,1)，所有面受光几乎相同；过锐时反差爆刺
    const ambient = lerp(0.58, 0.24, clamp(state.facetDepth, 0, 1));
    const diffuse = ndotl * lerp(0.24, 0.82, clamp(state.facetDepth, 0, 1));
    // 菲涅尔边棱冷蓝光泽
    const fresnel = Math.pow(1 - Math.abs(vDot(n, viewDir)), 2.2) * 0.22 * state.facetDepth;
    const rawIntensity = ambient + diffuse + specular + fresnel;
    const lum = clamp(rawIntensity, 0.12, 1.0);

    // 根据光照调制面片颜色（暗面偏深钴靛，亮面偏冰白/薰衣草高光）
    const deepTint = [10, 32, 108];
    const highTint = [234, 243, 255];
    let col;
    if (rawIntensity < 0.55) {
      const k = clamp(rawIntensity / 0.55, 0, 1);
      col = mixRgb(deepTint, baseColor, 0.35 + k * 0.65);
    } else {
      const k = clamp((rawIntensity - 0.55) / 0.55, 0, 1);
      col = mixRgb(baseColor, highTint, k * (0.58 + state.facetDepth * 0.32));
    }

    faces.push({
      verts: [a, b, c],
      normal: n,
      baseColor,
      shadeColor: col.map((v) => Math.round(clamp(v, 0, 255))),
      lum,
      spec: specular,
      part,
      armIndex,
      area,
      centroid: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3],
    });
  };

  const pushEdge = (a, b, part) => edges.push([a, b, part]);

  // 1) 中央正六边形双截锥晶核（1:1 呼应原海报中心深蓝星尘六方核 + 亮冰六角顶）
  const hexOuter = [];
  const hexInner = [];
  const coreSides = state.symmetry === "d4" ? 4 : 6;
  const startAngle = coreSides === 4 ? Math.PI / 4 : Math.PI / 6; // 让六边形尖角朝上/下，贴合 088 原海报
  for (let i = 0; i < coreSides; i++) {
    const a = startAngle + (i * Math.PI * 2) / coreSides;
    hexOuter.push([Math.cos(a) * coreR, Math.sin(a) * coreR, coreMidZ]);
    hexInner.push([Math.cos(a) * coreInnerR, Math.sin(a) * coreInnerR, coreTopZ]);
  }
  const coreApex = [0, 0, coreTopZ + ridgeZ * 0.22];
  const coreBack = [0, 0, -coreTopZ * 0.72];

  for (let i = 0; i < coreSides; i++) {
    const j = (i + 1) % coreSides;
    const oA = hexOuter[i], oB = hexOuter[j];
    const iA = hexInner[i], iB = hexInner[j];
    // 顶部中心小六角切面（冰蓝亮核）
    pushTri(coreApex, iA, iB, i % 2 === 0 ? pal.coreLight : pal.primaryB, "core", -1, 1.15);
    // 周围梯形深钴棱面
    const slopeCol = i % 2 === 0 ? pal.coreDark : pal.coreMid;
    pushTri(iA, oA, oB, slopeCol, "core", -1, 1.05);
    pushTri(iA, oB, iB, mixRgb(slopeCol, pal.primaryA, 0.35), "core", -1, 1.05);
    // 背面封底（供 3D 旋看晶簇时不穿帮）
    pushTri(coreBack, oB, oA, pal.coreDark, "core", -1, 0.6);

    pushEdge(iA, iB, "core");
    pushEdge(oA, oB, "core");
    pushEdge(iA, oA, "core");
    pushEdge(coreApex, iA, "coreSoft");
  }

  // 2) 确定外围棱晶臂拓扑（依据 symmetry 晶系）
  const armSpecs = [];
  if (state.symmetry === "d6") {
    // 严格的 60° 六重对称：6 支主双锥 + 6 支斜柱
    for (let i = 0; i < 6; i++) {
      armSpecs.push({ index: i * 2, angleDeg: 90 + i * 60, isPrimary: true, len: 0.74, wid: 0.24, hasBud: true });
      armSpecs.push({ index: i * 2 + 1, angleDeg: 120 + i * 60, isPrimary: false, len: 0.58, wid: 0.19, hasBud: false });
    }
  } else if (state.symmetry === "d4") {
    // 四方 D4 对称：4 支厚重主棱 + 4 支 45° 斜晶
    for (let i = 0; i < 4; i++) {
      armSpecs.push({ index: i * 2, angleDeg: 90 + i * 90, isPrimary: true, len: 0.76, wid: 0.27, hasBud: true });
      armSpecs.push({ index: i * 2 + 1, angleDeg: 45 + i * 90, isPrimary: false, len: 0.60, wid: 0.22, hasBud: false });
    }
  } else if (state.symmetry === "d2") {
    // 双轴 D2：左右宽大主翼 + 上下瘦长主锥 + 四角对称小斜晶
    armSpecs.push(
      { index: 0, angleDeg: 0, isPrimary: true, len: 0.88, wid: 0.29, hasBud: true },
      { index: 1, angleDeg: 48, isPrimary: false, len: 0.56, wid: 0.18, hasBud: false },
      { index: 2, angleDeg: 90, isPrimary: true, len: 0.66, wid: 0.22, hasBud: true },
      { index: 3, angleDeg: 132, isPrimary: false, len: 0.56, wid: 0.18, hasBud: false },
      { index: 4, angleDeg: 180, isPrimary: true, len: 0.88, wid: 0.29, hasBud: true },
      { index: 5, angleDeg: 228, isPrimary: false, len: 0.56, wid: 0.18, hasBud: false },
      { index: 6, angleDeg: 270, isPrimary: true, len: 0.66, wid: 0.22, hasBud: true },
      { index: 7, angleDeg: 312, isPrimary: false, len: 0.56, wid: 0.18, hasBud: false },
    );
  } else {
    // 原海报经典八芒六核构型（poster 或 broken 基础）
    // 0° & 180° 左右宽大双锥主棱；90° & 270° 上下清峻双锥主棱；±54° / ±126° 四支蓝紫斜切柱晶（1:1 贴合 088 原海报！）
    armSpecs.push(
      { index: 0, angleDeg: 0, isPrimary: true, len: 0.82, wid: 0.27, hasBud: true },
      { index: 1, angleDeg: 55, isPrimary: false, len: 0.72, wid: 0.22, hasBud: false },
      { index: 2, angleDeg: 90, isPrimary: true, len: 0.68, wid: 0.22, hasBud: true },
      { index: 3, angleDeg: 125, isPrimary: false, len: 0.72, wid: 0.22, hasBud: false },
      { index: 4, angleDeg: 180, isPrimary: true, len: 0.82, wid: 0.27, hasBud: true },
      { index: 5, angleDeg: 235, isPrimary: false, len: 0.72, wid: 0.22, hasBud: false },
      { index: 6, angleDeg: 270, isPrimary: true, len: 0.68, wid: 0.22, hasBud: true },
      { index: 7, angleDeg: 305, isPrimary: false, len: 0.72, wid: 0.22, hasBud: false },
    );
  }

  const missingSet = new Set(state.missingArms || []);
  const sockets = [];

  // 咬合基准偏移：gap = 0 时棱晶根部刚好紧扣六方晶核外边
  const radialBase = coreR * 0.90 + state.gap * 1.05;

  for (const arm of armSpecs) {
    // 断轴错偏只作用于 broken 或有 armSkew 时对特定臂加错角
    const skewSign = arm.index % 2 === 1 ? (arm.index % 4 === 1 ? 1 : -1) : 0;
    const effectiveSkew = state.armSkew * (arm.isPrimary ? (arm.index === 0 ? 0.35 : 0) : skewSign);
    const angleRad = ((arm.angleDeg + effectiveSkew) * Math.PI) / 180;
    const isMissing = missingSet.has(arm.index);

    // 晶位锁点（供画布点击补全或拆开）
    const socketDist = coreR * 0.92 + arm.len * 0.55 + Math.max(0, state.gap * 0.8);
    sockets.push({
      index: arm.index,
      angleRad,
      angleDeg: arm.angleDeg,
      isPrimary: arm.isPrimary,
      missing: isMissing,
      pos3: [Math.cos(angleRad) * socketDist, Math.sin(angleRad) * socketDist, ridgeZ * 0.3],
    });

    if (isMissing) continue;

    // 构造每支棱晶的真实 3D 多面体（正面 4 切面 + 背面 4 切面）
    const L = arm.len;
    const W = arm.wid;
    const zRidge = ridgeZ * (arm.isPrimary ? 0.92 : 0.74);
    const zBack = -zRidge * 0.58;

    let pRoot, pLeft, pRight, pTip, pTop, pBot;
    if (arm.isPrimary) {
      // 菱形双锥主棱晶（呼应原海报上下左右四支锐利菱形切面棱晶）
      const midX = spec.armStyle === "chevron" ? L * 0.34 : L * 0.38;
      pRoot = [0, 0, coreMidZ * 0.65];
      pLeft = [midX, W, 0];
      pRight = [midX, -W, 0];
      pTip = [L, 0, 0];
      pTop = [midX * 1.06, 0, zRidge];
      pBot = [midX * 1.06, 0, zBack];
    } else {
      // 斜向六面切面柱晶（呼应原海报四支蓝紫渐变斜晶柱，略带偏棱切角）
      const midX = L * 0.58;
      pRoot = [0.02, 0, coreMidZ * 0.55];
      pLeft = [midX * 0.85, W * 0.86, 0.02];
      pRight = [midX, -W * 0.92, -0.02];
      pTip = [L, -W * 0.12, 0];
      pTop = [midX * 0.74, 0.02, zRidge * 0.92];
      pBot = [midX * 0.74, 0.02, zBack];
    }

    const rOff = radialBase * (arm.isPrimary ? 1.0 : 0.94);
    const A = placeLocal(pRoot, angleRad, rOff);
    const B = placeLocal(pLeft, angleRad, rOff);
    const C = placeLocal(pRight, angleRad, rOff);
    const D = placeLocal(pTip, angleRad, rOff);
    const T = placeLocal(pTop, angleRad, rOff);
    const K = placeLocal(pBot, angleRad, rOff);

    const colA = arm.isPrimary ? pal.primaryA : pal.diagA;
    const colB = arm.isPrimary ? pal.primaryB : pal.diagB;
    const colDeep = mixRgb(colA, pal.coreDark, 0.42);
    const colTint = mixRgb(colB, pal.diagB, arm.isPrimary ? 0.22 : 0.68);
    const partName = arm.isPrimary ? "primary" : "diag";

    // 正面 4 块真实折面
    pushTri(T, A, B, colB, partName, arm.index, 1.1);
    pushTri(T, B, D, colTint, partName, arm.index, 1.2);
    pushTri(T, D, C, colA, partName, arm.index, 0.95);
    pushTri(T, C, A, colDeep, partName, arm.index, 0.85);

    // 背面 4 块封底
    pushTri(K, B, A, colDeep, partName, arm.index, 0.5);
    pushTri(K, D, B, colA, partName, arm.index, 0.5);
    pushTri(K, C, D, colDeep, partName, arm.index, 0.5);
    pushTri(K, A, C, colA, partName, arm.index, 0.5);

    // 清晰晶棱
    pushEdge(A, B, partName);
    pushEdge(B, D, partName);
    pushEdge(D, C, partName);
    pushEdge(C, A, partName);
    pushEdge(T, A, partName);
    pushEdge(T, B, partName);
    pushEdge(T, C, partName);
    pushEdge(T, D, partName);

    // 3) 外延有序生长晶芽（沿主轴向外延展，受 budRatio 控制）
    if (arm.hasBud && state.budRatio > 0.02) {
      const bScale = clamp(state.budRatio, 0.02, 1.35);
      const bLen = L * 0.48 * bScale;
      const bWid = W * 0.52 * bScale;
      const bStart = rOff + L + 0.14 + Math.max(0, state.gap * 0.45);
      const bz = ridgeZ * 0.62 * clamp(bScale, 0.4, 1.1);

      const bRoot = placeLocal([0, 0, 0], angleRad, bStart);
      const bLeft = placeLocal([bLen * 0.45, bWid, 0], angleRad, bStart);
      const bRight = placeLocal([bLen * 0.45, -bWid, 0], angleRad, bStart);
      const bTip = placeLocal([bLen, 0, 0], angleRad, bStart);
      const bTop = placeLocal([bLen * 0.48, 0, bz], angleRad, bStart);
      const bBot = placeLocal([bLen * 0.48, 0, -bz * 0.6], angleRad, bStart);

      pushTri(bTop, bRoot, bLeft, pal.budB, "bud", arm.index, 1.25);
      pushTri(bTop, bLeft, bTip, pal.diagB, "bud", arm.index, 1.15);
      pushTri(bTop, bTip, bRight, pal.budA, "bud", arm.index, 1.0);
      pushTri(bTop, bRight, bRoot, pal.coreMid, "bud", arm.index, 0.9);

      pushTri(bBot, bLeft, bRoot, pal.coreDark, "bud", arm.index, 0.5);
      pushTri(bBot, bTip, bLeft, pal.budA, "bud", arm.index, 0.5);
      pushTri(bBot, bRight, bTip, pal.coreDark, "bud", arm.index, 0.5);
      pushTri(bBot, bRoot, bRight, pal.budA, "bud", arm.index, 0.5);

      pushEdge(bRoot, bLeft, "bud");
      pushEdge(bLeft, bTip, "bud");
      pushEdge(bTip, bRight, "bud");
      pushEdge(bRight, bRoot, "bud");
      pushEdge(bTop, bRoot, "bud");
      pushEdge(bTop, bTip, "bud");
    }
  }

  return {
    faces,
    edges,
    sockets,
    lightDir,
    coreRadius: coreR,
    totalArmSlots: armSpecs.length,
    activeArmCount: armSpecs.length - missingSet.size,
  };
}

// 单真源双向诊断核算：完全从 buildCrystalMesh 的实绘几何与切面亮度得出
export function evaluateCrystal(state, meshInput) {
  const mesh = meshInput || buildCrystalMesh(state);
  const frontFaces = mesh.faces.filter((f) => f.normal[2] > 0.02);

  // 1) 实绘重心偏移（由每个可见多面体切面的真实面积 × 质心向量求和算出）
  let sumArea = 0;
  let cx = 0;
  let cy = 0;
  let maxR = 0.01;
  for (const f of frontFaces) {
    sumArea += f.area;
    cx += f.centroid[0] * f.area;
    cy += f.centroid[1] * f.area;
    const r = Math.hypot(f.centroid[0], f.centroid[1]);
    if (r > maxR) maxR = r;
  }
  const comX = sumArea > 0 ? cx / sumArea : 0;
  const comY = sumArea > 0 ? cy / sumArea : 0;
  // 归一化重心偏移（映射到 0–100% 直观标尺）
  const comDist = Math.hypot(comX, comY);
  const comOffsetPct = Math.round(clamp((comDist / (maxR * 0.48)) * 100, 0, 99));

  // 2) 切面折射明度动态差（由所有可见切面的实算 lum 统计 P90 - P10）
  const lums = frontFaces.map((f) => f.lum).sort((a, b) => a - b);
  const p10 = lums.length ? lums[Math.floor(lums.length * 0.10)] : 0.5;
  const p90 = lums.length ? lums[Math.min(lums.length - 1, Math.floor(lums.length * 0.90))] : 0.5;
  const contrastPct = Math.round(clamp((p90 - p10) * 100, 0, 99));
  const blownCount = frontFaces.filter((f) => f.lum > 0.92).length;
  const blowoutPct = frontFaces.length ? Math.round((blownCount / frontFaces.length) * 100) : 0;

  // 3) 晶核咬合间隙与生长比例（单真源读数）
  const gapPct = Math.round(state.gap * 100);
  const facetPct = Math.round(state.facetDepth * 100);
  const budRatioVal = +state.budRatio.toFixed(2);
  const budPct = Math.round(state.budRatio * 100);
  const missingCount = (state.missingArms || []).length;
  const skewDeg = Math.round(Math.abs(state.armSkew));

  // --- 四项独立维度判定（严格双向校验，可玩错！）---

  // 维度 1：多面结构（咬合度）
  let structureOk = true;
  let structureTag = `咬合 ${gapPct >= 0 ? "+" : ""}${gapPct}%`;
  let structureCode = "ok";
  if (gapPct > 9) {
    structureOk = false;
    structureCode = "loose";
    structureTag = `脱节 +${gapPct}%`;
  } else if (gapPct < -7) {
    structureOk = false;
    structureCode = "crushed";
    structureTag = `挤爆 ${gapPct}%`;
  }

  // 维度 2：模块对称（晶臂完整性 + 轴线偏扭 + 实测重心）
  let symmetryOk = true;
  let symmetryTag = `${SYMMETRIES[state.symmetry]?.code || "对称"} · ΔG ${comOffsetPct}%`;
  let symmetryCode = "ok";
  if (missingCount > 0) {
    symmetryOk = false;
    symmetryCode = "missing";
    symmetryTag = `缺 ${missingCount} 臂 · ΔG ${comOffsetPct}%`;
  } else if (skewDeg > 3 || state.symmetry === "broken") {
    symmetryOk = false;
    symmetryCode = "skewed";
    symmetryTag = `偏轴 ${skewDeg}°`;
  } else if (comOffsetPct > 7) {
    symmetryOk = false;
    symmetryCode = "offcenter";
    symmetryTag = `偏载 ΔG ${comOffsetPct}%`;
  }

  // 维度 3：折射韵律（切面棱高 + 实测明暗动态差 + 防过刺眩碎）
  let refractionOk = true;
  let refractionTag = `光差 ${contrastPct}%`;
  let refractionCode = "ok";
  if (facetPct < 30 || contrastPct < 24) {
    refractionOk = false;
    refractionCode = "flat";
    refractionTag = `死平 ${contrastPct}%`;
  } else if (facetPct > 86 || blowoutPct > 42) {
    refractionOk = false;
    refractionCode = "glare";
    refractionTag = `过刺眩碎`;
  }

  // 维度 4：有序生长（晶芽外延比例：不可倒挂、不可枯萎）
  let growthOk = true;
  let growthTag = `递减 ${budRatioVal.toFixed(2)}×`;
  let growthCode = "ok";
  if (budPct > 68) {
    growthOk = false;
    growthCode = "inverted";
    growthTag = `倒挂 ${budRatioVal.toFixed(2)}×`;
  } else if (budPct < 22) {
    growthOk = false;
    growthCode = "withered";
    growthTag = `枯萎 ${budPct}%`;
  }

  const passedCount = [structureOk, symmetryOk, refractionOk, growthOk].filter(Boolean).length;

  // 生成白话诊断（讲清「为什么」与「怎么办」，绝不只报冷冰冰的数字）
  let badge = "";
  let headline = "";
  let reason = "";
  let action = "";
  let tierLabel = "";

  if (passedCount === 4) {
    badge = `4/4 · 晶体平衡成立`;
    tierLabel = "结构结晶稳定（示意）";
    headline = "多面咬合、轴线对称、折光有韵，整座晶簇自己站稳了";
    reason = `中心晶核与外围棱晶严丝咬合（缝 ${gapPct >= 0 ? "+" : ""}${gapPct}%），实测重心偏离仅 ${comOffsetPct}%；${state.lightAngle}° 平行光打在 ${facetPct}% 切面棱脊上折出 ${contrastPct}% 的明暗节奏，外延晶芽以 ${budRatioVal.toFixed(2)}× 有序收束，理性与灵动同时成立。`;
    action = "继续横拖舞台转动光源，或按 Space 发射偏振光脉，观察光线如何顺着咬合切面逐级折射；也可点击「双向试错」按钮观察反例。";
  } else if (!structureOk && structureCode === "loose") {
    badge = `${passedCount}/4 · 晶核脱节 +${gapPct}%`;
    tierLabel = passedCount === 0 ? "四重散架（示意）" : "结构失衡（示意）";
    headline = `外围棱晶与中心核脱开 +${gapPct}% 空缝，整座晶体散架了`;
    reason = "晶体式平衡靠多面体棱边彼此咬合来传递视觉支撑力。现在外围棱镜悬空漂在半路，眼睛看到的是一盘零散碎片而不是一个整体晶体，坚固感立刻瓦解。";
    action = "向左拉回「晶核咬合缝」滑杆到 0% 附近（-6% 到 +8%），让棱晶根部重新扣进中心六方晶核。";
  } else if (!structureOk && structureCode === "crushed") {
    badge = `${passedCount}/4 · 互穿挤爆 ${gapPct}%`;
    tierLabel = "过度挤压（示意）";
    headline = `棱晶往晶核深插 ${Math.abs(gapPct)}%，多面轮廓互相撞碎了`;
    reason = "咬合不是把图形硬塞进一团。当外围棱晶过度侵入晶核内部，原本干净的六角边界被尖刺切得支离破碎，晶体秩序退化成一团杂乱尖刺。";
    action = "向右放宽「晶核咬合缝」滑杆回到 0% 附近，留出清晰的六方晶核边界。";
  } else if (!symmetryOk) {
    badge = `${passedCount}/4 · ${missingCount > 0 ? `缺臂 ΔG ${comOffsetPct}%` : `偏轴 ${skewDeg}°`}`;
    tierLabel = "轴线破缺（示意）";
    headline = missingCount > 0
      ? `画布上少了 ${missingCount} 支对称晶臂，视觉重心被拽偏 ${comOffsetPct}%`
      : `晶臂相对骨架轴线偏扭了 ${skewDeg}°，镜像与旋转秩序断了`;
    reason = "人眼对晶格轴线的误差极其敏感。哪怕只缺掉斜向的一两支棱晶，或者轴线歪出十来度，对称配平的力矩就会立刻倾向另一侧，稳定感荡然无存。";
    action = missingCount > 0
      ? "直接在舞台上点击红色虚线「+ 补晶臂」锁点，或切换 D6 / D4 / 八芒完整晶系。"
      : "切换完整晶系（原海报八芒 / D6 六方 / D4 四方），把歪斜的晶臂归回对称轴线。";
  } else if (!refractionOk && refractionCode === "flat") {
    badge = `${passedCount}/4 · 切面死平 ${contrastPct}%`;
    tierLabel = "扁平呆板（示意）";
    headline = `切面棱高被压平到 ${facetPct}%，明暗光差只剩 ${contrastPct}%`;
    reason = "光靠轮廓对称只会得到一枚死板的剪纸印章。当多面体切面几乎摊平或光线死顶照射时，所有晶面亮度撞成一片灰蓝，晶体独有的折射韵律与空间层次全部消失。";
    action = "推高「切面棱高」到 40%–75%，再横拖舞台把入射光转到 25°–55° 侧斜角，拉出清脆的冷亮与深钴明暗梯级。";
  } else if (!refractionOk && refractionCode === "glare") {
    badge = `${passedCount}/4 · 过刺眩碎`;
    tierLabel = "光比过曝（示意）";
    headline = `切面棱高拉到 ${facetPct}% 且高光爆白 ${blowoutPct}%，画面碎成噪点`;
    reason = "折射韵律讲究冷亮、中钴与深靛三阶有序衔接，而不是全盘爆白刺眼。过度尖锐的棱面配上强掠射光，会让整座晶体像碎玻璃一样刺眼且难以聚焦。";
    action = "把「切面棱高」回落到 45%–75%，并微横拖光源避开刺眼死角。";
  } else if (!growthOk && growthCode === "inverted") {
    badge = `${passedCount}/4 · 晶芽倒挂 ${budRatioVal.toFixed(2)}×`;
    tierLabel = "比例倒挂（示意）";
    headline = `外延晶芽胀大到主棱晶的 ${budRatioVal.toFixed(2)}×，外重内轻失序了`;
    reason = "自然界与排版中的有序生长都遵循“由核心向外逐级递减延展”。现在最外圈的晶芽比主棱晶还沉重，把视线往画框四角硬拽，彻底压垮了中心晶核的主导权。";
    action = "把「晶芽生长比」收回到 0.30×–0.60×，让中心核 → 主棱晶 → 外延晶芽排成清晰的三级递减阶梯。";
  } else {
    badge = `${passedCount}/4 · 外延枯萎 ${budPct}%`;
    tierLabel = "生长停滞（示意）";
    headline = `外延晶芽缩减到 ${budPct}%，晶簇失去向外生长的延展气势`;
    reason = "晶体式平衡不只靠中心团块稳住画面，还需要沿轴线向外生长的小尺度晶芽作为视线延伸的触角。没有外延递减呼应，整块图形会闷缩在画心显得局促。";
    action = "拉高「晶芽生长比」到 0.35×–0.58×，恢复从中心向外和谐生长的延展韵律。";
  }

  return {
    passedCount,
    isBalanced: passedCount === 4,
    badge,
    tierLabel,
    headline,
    reason,
    action,
    metrics: {
      gapPct,
      comOffsetPct,
      comX,
      comY,
      contrastPct,
      blowoutPct,
      facetPct,
      budRatioVal,
      budPct,
      missingCount,
      skewDeg,
      activeArmCount: mesh.activeArmCount,
      totalArmSlots: mesh.totalArmSlots,
      lightAngle: Math.round(state.lightAngle),
    },
    dims: {
      structure: { ok: structureOk, code: structureCode, tag: structureTag },
      symmetry: { ok: symmetryOk, code: symmetryCode, tag: symmetryTag },
      refraction: { ok: refractionOk, code: refractionCode, tag: refractionTag },
      growth: { ok: growthOk, code: growthCode, tag: growthTag },
      balance: {
        ok: passedCount === 4,
        code: passedCount === 4 ? "ok" : "warn",
        tag: passedCount === 4 ? "4/4 成立" : `${passedCount}/4 失序`,
      },
    },
  };
}
