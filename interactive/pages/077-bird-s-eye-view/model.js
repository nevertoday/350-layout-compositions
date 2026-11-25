// 077 鸟瞰构图 · 单真源三维建筑街区与视角研判模型
// 几何、投影、日影、视线遮挡与四项指标全部出自本模块，主沙盘、剖面图与测验共用。

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

// 逐像素采自 077 原海报的色板常量（供 Canvas 与 SVG 共享）
export const PALETTE = {
  paper: "#F4EDDF",
  paperLight: "#FAF6EE",
  road: "#EFE7D8",
  roadEdge: "#DDD4C2",
  stone: "#CFC7B3",
  wallLight: "#E5DEC9",
  wallMid: "#CFC6B2",
  wallDark: "#B2AA96",
  roofLight: "#85855C",
  roofMid: "#78784F",
  roofDeep: "#65673E",
  roofPlinth: "#CEC7B5",
  parapet: "#FAF7F0",
  treeTop: "#717448",
  treeRim: "#5A5D36",
  shadow: "rgba(92, 86, 68, 0.27)",
  shadowDeep: "rgba(68, 63, 48, 0.34)",
  orange: "#DC6F1B",
  orangeBright: "#E57519",
  orangeDeep: "#B34D08",
  orangeGlow: "rgba(220, 111, 27, 0.18)",
  ink: "#141610",
  inkMuted: "#494A3E",
  olive: "#676A3E",
  oliveDeep: "#484C29",
  warn: "#A6341E",
  ok: "#3C6635",
};

// 原海报 1:1 抽象的街区建筑体量（世界坐标：x 左右，z 南北，y 向上高度）
// sx/sz/srot 为「散乱无序」状态下的错位与偏转（对应原海报底栏左下散落图）
export const BUILDINGS = [
  // 西北 L 形与院落组团
  { id: "nw-west", name: "西侧长廊馆", x: -3.55, z: -1.65, w: 1.55, d: 2.95, h: 1.65, roof: "#74754D", sx: -2.95, sz: -1.25, srot: 16 },
  { id: "nw-top", name: "北门主展馆", x: -1.55, z: -3.95, w: 2.35, d: 1.45, h: 1.45, roof: "#818158", sx: -1.95, sz: -3.35, srot: -14 },
  { id: "nw-step", name: "北院连廊", x: -1.42, z: -2.65, w: 1.95, d: 1.05, h: 0.92, roof: "#6E7047", sx: -0.65, sz: -1.85, srot: 22 },
  { id: "mw-block", name: "西广场侧厅", x: -2.85, z: -0.35, w: 1.95, d: 1.32, h: 1.25, roof: "#7C7C53", sx: -2.05, sz: 0.15, srot: -19 },

  // 东北围合庭院（内嵌小橙圆庭院）
  { id: "ne-north", name: "东院北翼", x: 3.15, z: -4.45, w: 2.75, d: 0.92, h: 1.25, roof: "#7F7F56", sx: 2.55, sz: -3.65, srot: 13 },
  { id: "ne-east", name: "东院东翼", x: 4.18, z: -3.32, w: 0.72, d: 1.98, h: 1.32, roof: "#74754D", sx: 3.95, sz: -2.55, srot: -11 },
  { id: "ne-south", name: "东院南翼", x: 3.15, z: -2.38, w: 2.75, d: 0.70, h: 1.05, roof: "#6E7047", sx: 2.75, sz: -1.35, srot: 17 },
  { id: "ne-west", name: "东院西廓", x: 2.02, z: -3.40, w: 0.56, d: 1.54, h: 0.94, roof: "#78784F", sx: 1.55, sz: -2.55, srot: -24 },

  // 东侧阶梯核心主馆（最高体量，用以演示斜阳影长与绕飞视线遮挡）
  { id: "e-tall", name: "东区主塔楼", x: 3.72, z: 1.12, w: 2.48, d: 1.65, h: 2.45, roof: "#7B7B52", sx: 2.45, sz: 0.85, srot: -15 },
  { id: "e-north", name: "东馆北肩", x: 2.68, z: 0.08, w: 1.60, d: 0.88, h: 1.22, roof: "#6B6D44", sx: 1.65, sz: -0.55, srot: 18 },
  { id: "e-inner", name: "东馆内阶", x: 2.54, z: 1.55, w: 1.02, d: 1.24, h: 1.08, roof: "#63653C", sx: 1.55, sz: 1.55, srot: -26 },
  { id: "e-south", name: "东馆南翼", x: 3.72, z: 2.22, w: 2.15, d: 0.88, h: 1.30, roof: "#73744C", sx: 3.25, sz: 2.25, srot: 12 },

  // 西南方形院落与灰石基座
  { id: "sw-main", name: "西南美术馆", x: -2.78, z: 2.45, w: 2.22, d: 2.05, h: 1.68, roof: "#7A7B52", sx: -1.95, sz: 1.65, srot: 19 },
  { id: "sw-lip", name: "西南附楼", x: -1.42, z: 2.92, w: 0.82, d: 1.22, h: 1.02, roof: "#6D6F46", sx: -0.75, sz: 2.15, srot: -21 },
  { id: "sw-plinth", name: "西南石台", x: -2.68, z: 4.15, w: 1.95, d: 1.08, h: 0.44, roof: "#CEC7B5", sx: -2.95, sz: 4.15, srot: 8, isStone: true },

  // 南中低矮展亭（位于前方，低俯角时会明显遮挡后方中央广场！）
  { id: "s-pavilion", name: "南入口门楼", x: -0.15, z: 4.25, w: 1.85, d: 1.15, h: 1.58, roof: "#7E7F56", sx: 0.15, sz: 3.15, srot: -17 },

  // 东南大块体与采光天窗
  { id: "se-main", name: "东南会堂", x: 3.72, z: 3.85, w: 2.22, d: 2.48, h: 2.15, roof: "#76774E", sx: 3.25, sz: 3.65, srot: 14, skylight: true },
  { id: "se-west", name: "东南裙房", x: 2.35, z: 3.55, w: 1.12, d: 2.05, h: 1.28, roof: "#6D6F46", sx: 1.75, sz: 3.15, srot: -13 },
];

// 广场锚点候选项（多组合法解 + 偏角/关闭错态）
export const PLAZA_NODES = {
  center: {
    id: "center",
    label: "中央枢纽广场",
    x: 0.18,
    z: 0.35,
    r: 0.84,
    apron: 1.24,
    valid: true,
    note: "位于四向路网交汇核心，视线自然聚拢并向四周展开。",
  },
  north: {
    id: "north",
    label: "北院偏心枢纽",
    x: 0.35,
    z: -0.92,
    r: 0.72,
    apron: 1.06,
    valid: true,
    note: "偏心轴线锚点，让北向入口更舒展，形成非对称格局平衡。",
  },
  corner: {
    id: "corner",
    label: "角落挤压位",
    x: -3.95,
    z: 4.55,
    r: 0.62,
    apron: 0.85,
    valid: false,
    note: "主广场被挤到画幅边缘角落，四向主路失去交汇重心。",
  },
  none: {
    id: "none",
    label: "关闭主锚点",
    x: 0.18,
    z: 0.35,
    r: 0,
    apron: 0,
    valid: false,
    note: "缺少醒目的色彩与几何锚点，高空街区退化成无重点的卫星碎图。",
  },
};

// 次级小型呼应节点（1:1 呼应原海报东北庭院小橙圆与南中段小橙圆）
export const SUB_PLAZAS = [
  { x: 3.12, z: -3.32, r: 0.35, ring: false },
  { x: 0.36, z: 3.05, r: 0.36, ring: true },
];

// 行道树列（1:1 呼应原海报北大道、中街、南街树列）
export const TREES = [
  { x: 0.25, z: -4.45, r: 0.26, h: 0.62 },
  { x: 0.25, z: -3.92, r: 0.25, h: 0.58 },
  { x: 0.25, z: -3.42, r: 0.26, h: 0.62 },
  { x: 0.25, z: -2.92, r: 0.24, h: 0.56 },
  { x: 0.25, z: -2.42, r: 0.25, h: 0.60 },
  { x: 0.18, z: -1.78, r: 0.30, h: 0.68 },
  { x: -1.55, z: -1.75, r: 0.24, h: 0.55 },
  { x: -1.12, z: -1.35, r: 0.21, h: 0.50 },
  { x: -2.35, z: -1.45, r: 0.32, h: 0.72 },
  { x: -3.05, z: 0.58, r: 0.22, h: 0.52 },
  { x: -2.48, z: 0.62, r: 0.23, h: 0.54 },
  { x: -1.88, z: 0.60, r: 0.25, h: 0.56 },
  { x: 1.38, z: 1.05, r: 0.29, h: 0.66 },
  { x: 0.05, z: 1.98, r: 0.25, h: 0.58 },
  { x: 0.05, z: 2.52, r: 0.24, h: 0.55 },
  { x: -0.45, z: 2.25, r: 0.27, h: 0.62 },
  { x: 0.65, z: 2.38, r: 0.30, h: 0.68 },
  { x: -1.42, z: 3.55, r: 0.23, h: 0.52 },
  { x: -1.42, z: 4.02, r: 0.22, h: 0.50 },
  { x: -1.42, z: 4.48, r: 0.24, h: 0.54 },
  { x: 4.15, z: -0.62, r: 0.24, h: 0.55 },
  { x: 4.62, z: -0.62, r: 0.25, h: 0.58 },
  { x: 2.02, z: 1.85, r: 0.20, h: 0.48 },
];

// 街道微缩行人路径（仅俯视点影，不画五官）
export const PEDESTRIANS = [
  { x0: -0.35, z0: -1.4, x1: -0.25, z1: -0.35, phase: 0.1, speed: 0.09 },
  { x0: 0.72, z0: -0.85, x1: 1.15, z1: 0.15, phase: 0.4, speed: 0.08 },
  { x0: -0.75, z0: 0.35, x1: -0.25, z1: 1.15, phase: 0.7, speed: 0.07 },
  { x0: 0.52, z0: 1.35, x1: 0.95, z1: 2.35, phase: 0.2, speed: 0.10 },
  { x0: 1.25, z0: -3.2, x1: 1.35, z1: -1.65, phase: 0.55, speed: 0.085 },
  { x0: 1.22, z0: 3.1, x1: 1.22, z1: 4.3, phase: 0.85, speed: 0.075 },
  { x0: -1.35, z0: 0.12, x1: -0.72, z1: 0.15, phase: 0.32, speed: 0.095 },
  { x0: 0.98, z0: -1.2, x1: 2.25, z1: -1.18, phase: 0.65, speed: 0.08 },
];

// 初始开场状态（故意不是答案：贴地低俯角 + 正午顶光 + 散乱街区 + 广场偏角）
export function createInitialState() {
  return {
    pitch: 14, // 俯角（度）：10° 贴地平视 → 90° 垂直顶视
    azimuth: -18, // 绕飞方位角（度）：0° 正南朝北
    sunElev: 84, // 太阳高度角（度）：15° 残阳 → 88° 正午顶光
    sunAz: -38, // 太阳方位角（度）：默认东南偏南照向西北，呼应原海报右上向左上/左下的柔和建筑长影
    order: "scattered", // "scattered" | "organized"
    plazaMode: "center", // 主广场锚点；开场先放 "corner"
    activeLens: null, // null | "overview" | "path" | "order" | "relation"
  };
}

export function createOpeningBrokenState() {
  return {
    ...createInitialState(),
    pitch: 14,
    azimuth: -10,
    sunElev: 84,
    sunAz: -38,
    order: "scattered",
    plazaMode: "center",
    activeLens: null,
  };
}

// ---------- 三维透视相机与投影 ----------

export function makeCamera(state, width, height) {
  const pitch = clamp(state.pitch, 8, 90) * DEG;
  const az = state.azimuth * DEG;
  // 随俯角平滑微调距离；74°→90° 渐进拉高长焦压平透视，直观呈现退化为 90° 垂直平面的效果
  const nadirT = clamp((clamp(state.pitch, 10, 90) - 72) / 18, 0, 1);
  const fovDeg = lerp(34, 8, nadirT * nadirT);
  const fov = fovDeg * DEG;
  const baseDist = lerp(14.8, 17.6, (clamp(state.pitch, 10, 90) - 10) / 80);
  const dist = baseDist * (Math.tan(17 * DEG) / Math.tan(fov * 0.5));
  const target = { x: 0.2, y: 0.25, z: 0.25 };

  // 相机位置（绕 Y 轴旋 azimuth，抬升 pitch；pitch=90° 时留极小偏移防奇异）
  const cosP = Math.max(0.0005, Math.cos(pitch));
  const sinP = Math.sin(pitch);
  const eye = {
    x: target.x + dist * cosP * Math.sin(az),
    y: target.y + dist * sinP,
    z: target.z + dist * cosP * Math.cos(az),
  };

  // LookAt 正交基 (right, up, forward)
  let fx = target.x - eye.x;
  let fy = target.y - eye.y;
  let fz = target.z - eye.z;
  const fLen = Math.hypot(fx, fy, fz) || 1;
  fx /= fLen; fy /= fLen; fz /= fLen;

  // 世界向上矢量（接近 90° 时保持朝北一致）
  const upRef = Math.abs(fy) > 0.999 ? { x: -Math.sin(az), y: 0, z: -Math.cos(az) } : { x: 0, y: 1, z: 0 };
  let rx = fy * upRef.z - fz * upRef.y;
  let ry = fz * upRef.x - fx * upRef.z;
  let rz = fx * upRef.y - fy * upRef.x;
  const rLen = Math.hypot(rx, ry, rz) || 1;
  rx /= rLen; ry /= rLen; rz /= rLen;

  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  const fit = Math.min(width * 0.72, height);
  const scale = (fit * 0.5) / Math.tan(fov * 0.5) * 1.12;
  const cx = width * 0.5;
  const cy = height * (pitch < 0.42 ? 0.57 : 0.51);

  return { eye, target, r: [rx, ry, rz], u: [ux, uy, uz], f: [fx, fy, fz], scale, cx, cy, width, height, pitch, az };
}

export function projectPoint(cam, p) {
  const dx = p.x - cam.eye.x;
  const dy = p.y - cam.eye.y;
  const dz = p.z - cam.eye.z;
  const vx = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
  const vy = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
  const vz = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
  const zSafe = Math.max(0.4, vz);
  const k = cam.scale / zSafe;
  return { x: cam.cx + vx * k, y: cam.cy - vy * k, depth: vz };
}

// 取得当前阶（含动画插值 orderMix ∈ [0,1]）下的建筑姿态
export function resolvedBuildings(orderMix) {
  return BUILDINGS.map((b) => {
    const x = lerp(b.sx, b.x, orderMix);
    const z = lerp(b.sz, b.z, orderMix);
    const rot = lerp(b.srot, 0, orderMix) * DEG;
    const hw = b.w * 0.5;
    const hd = b.d * 0.5;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const local = [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ];
    const base = local.map(([lx, lz]) => ({
      x: x + lx * c - lz * s,
      y: 0,
      z: z + lx * s + lz * c,
    }));
    const top = base.map((p) => ({ x: p.x, y: b.h, z: p.z }));
    return { ...b, cx: x, cz: z, rot, base, top };
  });
}

// 2D 凸包（Andrew 单调链，用来算精确投射阴影多边形）
export function convexHull2D(pts) {
  const arr = pts.slice().sort((a, b) => (a.x - b.x) || (a.z - b.z));
  if (arr.length <= 2) return arr;
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [];
  for (const p of arr) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// 由太阳高度角与方位角算地面投射阴影向量（单位楼高对应的地面偏移 dx, dz）
export function sunShadowVector(sunElevDeg, sunAzDeg) {
  const elev = clamp(sunElevDeg, 10, 89) * DEG;
  const az = sunAzDeg * DEG;
  const factor = Math.min(4.6, 1 / Math.tan(elev));
  // 太阳从 (sin az, cos az) 照来，影向反方向伸展
  return {
    factor,
    dx: -Math.sin(az) * factor,
    dz: -Math.cos(az) * factor,
    lightDir: [Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)],
  };
}

export function buildingShadowFootprint(b, sunVec) {
  const projectedTop = b.base.map((p) => ({
    x: p.x + sunVec.dx * b.h,
    y: 0,
    z: p.z + sunVec.dz * b.h,
  }));
  return convexHull2D([...b.base, ...projectedTop]);
}

// 四条原海报标志性橙色虚线流线（世界坐标曲线点列）
export function getFlowPaths(plazaNode) {
  const px = plazaNode.r > 0 ? plazaNode.x : 0.18;
  const pz = plazaNode.r > 0 ? plazaNode.z : 0.35;
  const r = Math.max(0.84, plazaNode.r) + 0.44;
  return [
    {
      id: "north",
      name: "北向主干道",
      pts: [
        { x: px - r * 0.72, y: 0.03, z: pz + 0.05 },
        { x: Math.max(-0.2, px - r * 0.65), y: 0.03, z: Math.max(-1.85, pz - r * 0.8) },
        { x: 0.92, y: 0.03, z: -1.55 },
        { x: 1.32, y: 0.03, z: -2.45 },
        { x: 1.32, y: 0.03, z: -5.15 },
      ],
    },
    {
      id: "east",
      name: "东向横轴道",
      pts: [
        { x: px + 0.12, y: 0.03, z: pz - r * 0.82 },
        { x: 1.25, y: 0.03, z: -1.52 },
        { x: 3.05, y: 0.03, z: -1.52 },
        { x: 5.25, y: 0.03, z: -1.52 },
      ],
    },
    {
      id: "west",
      name: "西向入场道",
      pts: [
        { x: px - r * 0.85, y: 0.03, z: pz + r * 0.42 },
        { x: -1.25, y: 0.03, z: 0.62 },
        { x: -3.25, y: 0.03, z: 0.62 },
        { x: -5.15, y: 0.03, z: 0.62 },
      ],
    },
    {
      id: "south",
      name: "南向轴线道",
      pts: [
        { x: px - r * 0.72, y: 0.03, z: pz + r * 0.72 },
        { x: px + 0.25, y: 0.03, z: pz + r * 1.05 },
        { x: 1.28, y: 0.03, z: 2.18 },
        { x: 1.32, y: 0.03, z: 3.65 },
        { x: 1.32, y: 0.03, z: 5.55 },
      ],
    },
  ];
}

// ---------- 单真源几何评测（完全从实绘投影多边形计算） ----------

function polyArea2D(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) * 0.5;
}

function pointInPoly2D(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInXZPoly(px, pz, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    const intersect = (zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// 缓存仅随 (sunElev, sunAz, orderMix) 变化的世界空间阴影凸包与道路阴影率，绕飞方位角时零重复计算
let cachedShadowKey = "";
let cachedShadows = null;
let cachedRoadShadowPct = 0;

function getWorldShadows(bldgs, sun, sunElev, sunAz, orderMix) {
  const key = `${sunElev.toFixed(1)}|${sunAz.toFixed(1)}|${orderMix.toFixed(2)}`;
  if (key === cachedShadowKey && cachedShadows) {
    return { shadows: cachedShadows, roadShadowPct: cachedRoadShadowPct };
  }
  const shadows = bldgs.map((b) => buildingShadowFootprint(b, sun));
  const roadSamples = [
    [0.18, 0.35], [1.28, -3.5], [1.28, -2.0], [1.28, -1.1], [2.4, -1.52], [3.8, -1.52],
    [-1.2, 0.62], [-2.5, 0.62], [-3.9, 0.62], [1.28, 2.0], [1.28, 3.2], [1.28, 4.4],
    [-0.4, -0.8], [0.8, 1.3], [-0.9, 1.4], [0.2, 2.6], [1.3, 0.2], [-1.5, -1.2], [0.2, -1.9], [1.3, -4.6],
  ];
  let shadowedRoad = 0;
  for (const [rx, rz] of roadSamples) {
    if (shadows.some((sw) => pointInXZPoly(rx, rz, sw))) shadowedRoad++;
  }
  cachedShadowKey = key;
  cachedShadows = shadows;
  cachedRoadShadowPct = Math.round((shadowedRoad / roadSamples.length) * 100);
  return { shadows, roadShadowPct: cachedRoadShadowPct };
}

// 为每一栋建筑构建当前帧的所有可见三维投影面（供渲染器与评测共用！）
export function buildProjectedScene(state, width, height, orderMixOverride) {
  const orderMix = orderMixOverride ?? (state.order === "organized" ? 1 : 0);
  const cam = makeCamera(state, width, height);
  const sun = sunShadowVector(state.sunElev, state.sunAz);
  const bldgs = resolvedBuildings(orderMix);
  const plaza = PLAZA_NODES[state.plazaMode] || PLAZA_NODES.center;
  const { shadows, roadShadowPct } = getWorldShadows(bldgs, sun, state.sunElev, state.sunAz, orderMix);

  const projectedBuildings = bldgs.map((b, idx) => {
    const base2 = b.base.map((p) => projectPoint(cam, p));
    const top2 = b.top.map((p) => projectPoint(cam, p));
    const centerDepth = projectPoint(cam, { x: b.cx, y: b.h * 0.45, z: b.cz }).depth;
    let minDepth = Infinity, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let k = 0; k < 4; k++) {
      const bp = base2[k], tp = top2[k];
      if (bp.depth < minDepth) minDepth = bp.depth;
      if (tp.depth < minDepth) minDepth = tp.depth;
      if (bp.x < minX) minX = bp.x; if (bp.x > maxX) maxX = bp.x;
      if (tp.x < minX) minX = tp.x; if (tp.x > maxX) maxX = tp.x;
      if (bp.y < minY) minY = bp.y; if (bp.y > maxY) maxY = bp.y;
      if (tp.y < minY) minY = tp.y; if (tp.y > maxY) maxY = tp.y;
    }

    // 四个侧面（只保留朝向相机的面）
    const faces = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const p0 = b.base[i], p1 = b.base[j], p2 = b.top[j], p3 = b.top[i];
      const ex = p1.x - p0.x, ez = p1.z - p0.z;
      const len = Math.hypot(ex, ez) || 1;
      const nx = ez / len, nz = -ex / len;
      const midX = (p0.x + p1.x) * 0.5, midZ = (p0.z + p1.z) * 0.5;
      const toCamX = cam.eye.x - midX, toCamZ = cam.eye.z - midZ;
      if (nx * toCamX + nz * toCamZ > 0.001) {
        const lightDot = nx * sun.lightDir[0] + nz * sun.lightDir[2];
        const shade = lightDot > 0.25 ? PALETTE.wallLight : lightDot > -0.25 ? PALETTE.wallMid : PALETTE.wallDark;
        const pts2 = [base2[i], base2[j], top2[j], top2[i]];
        const fDepth = (pts2[0].depth + pts2[1].depth + pts2[2].depth + pts2[3].depth) * 0.25;
        faces.push({ pts2, shade, depth: fDepth, area: polyArea2D(pts2) });
      }
    }

    const roofArea = polyArea2D(top2);
    const roofDepth = (top2[0].depth + top2[1].depth + top2[2].depth + top2[3].depth) * 0.25;
    const shadowWorld = shadows[idx];
    const shadow2 = shadowWorld.map((p) => projectPoint(cam, p));

    return {
      ...b,
      base2,
      top2,
      faces,
      roofArea,
      roofDepth,
      centerDepth,
      minDepth,
      bbox: [minX, maxX, minY, maxY],
      shadowWorld,
      shadow2,
    };
  });

  projectedBuildings.sort((a, b) => b.centerDepth - a.centerDepth);

  return { cam, sun, orderMix, plaza, buildings: projectedBuildings, roadShadowPct };
}

// 判断某个三维地面点 (x,0,z) 在当前投影中是否被更近的建筑遮挡（带 2D 包围盒快筛）
function isPointOccludedByCloserBuilding(cam, buildings, wp) {
  const sp = projectPoint(cam, wp);
  const sx = sp.x, sy = sp.y;
  for (const b of buildings) {
    if (b.minDepth >= sp.depth - 0.15) continue;
    const [minX, maxX, minY, maxY] = b.bbox;
    if (sx < minX || sx > maxX || sy < minY || sy > maxY) continue;
    if (b.roofDepth < sp.depth - 0.1 && pointInPoly2D(sx, sy, b.top2)) return b;
    for (const f of b.faces) {
      if (f.depth < sp.depth - 0.08 && pointInPoly2D(sx, sy, f.pts2)) return b;
    }
  }
  return null;
}

export function evaluateView(state, width = 760, height = 560, orderMixOverride) {
  const scene = buildProjectedScene(state, width, height, orderMixOverride);
  const { cam, sun, orderMix, plaza, buildings, roadShadowPct } = scene;

  // 1. 实算立面占总建筑投影面积比（90° 顶视时为 0%，斜俯时 14%–44%）
  let wallAreaSum = 0;
  let roofAreaSum = 0;
  for (const b of buildings) {
    roofAreaSum += b.roofArea;
    for (const f of b.faces) wallAreaSum += f.area;
  }
  const facadeRatio = (wallAreaSum + roofAreaSum) > 1 ? wallAreaSum / (wallAreaSum + roofAreaSum) : 0;
  const facadePct = Math.round(facadeRatio * 100);

  // 2. 实算主广场多点可见率（17 个圆盘采样点做真实多边形深度遮挡检测）
  let plazaVisibleRatio = 0;
  let blockerName = "";
  if (plaza.r > 0) {
    const samples = [{ x: plaza.x, y: 0.04, z: plaza.z }];
    for (let ring = 1; ring <= 2; ring++) {
      const rr = plaza.r * (ring === 1 ? 0.45 : 0.84);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        samples.push({ x: plaza.x + Math.cos(a) * rr, y: 0.04, z: plaza.z + Math.sin(a) * rr });
      }
    }
    let visible = 0;
    const blockers = new Map();
    for (const pt of samples) {
      const hit = isPointOccludedByCloserBuilding(cam, buildings, pt);
      if (!hit) visible++;
      else blockers.set(hit.name, (blockers.get(hit.name) || 0) + 1);
    }
    plazaVisibleRatio = visible / samples.length;
    if (blockers.size) {
      blockerName = [...blockers.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  const plazaVisiblePct = Math.round(plazaVisibleRatio * 100);

  // 3. 实算四向路径可见且未遭建筑错位堵断的数量
  const paths = getFlowPaths(plaza);
  let openPaths = 0;
  const pathStatus = paths.map((route) => {
    let blockedPhysically = false;
    let occludedCount = 0;
    const checkPts = route.pts.slice(1); // 跳过广场边起点
    for (const pt of checkPts) {
      // 物理占道检测（建筑底脚落到流线上）
      for (const b of buildings) {
        if (pointInXZPoly(pt.x, pt.z, b.base)) {
          blockedPhysically = true;
          break;
        }
      }
      if (isPointOccludedByCloserBuilding(cam, buildings, pt)) occludedCount++;
    }
    const ok = !blockedPhysically && occludedCount <= 1 && orderMix > 0.72 && plaza.valid;
    if (ok) openPaths++;
    return { id: route.id, name: route.name, ok, blockedPhysically, occluded: occludedCount > 1 };
  });

  // 4. 道路阴影覆盖度直接复用 getWorldShadows 缓存单真源结果
  // 5. 逐条评定四大原海报维度与总体研判（高/低俯角、顶光/残阳、格局、锚点、绕飞遮挡全部有独立解释）
  const pitch = state.pitch;
  const sunElev = state.sunElev;
  const shadowLen = sun.factor;
  const pitchOk = pitch >= 32 && pitch <= 74 && plazaVisiblePct >= 82;
  const pitchLow = pitch < 32;
  const pitchNadir = pitch > 74;
  const sunNoon = sunElev > 66;
  const sunDusk = sunElev < 20;
  const sunOk = !sunNoon && !sunDusk;
  const orderOk = orderMix > 0.85;
  const anchorOk = plaza.valid;
  const azimuthBlocked = !pitchLow && !pitchNadir && plaza.r > 0 && plazaVisiblePct < 82;

  let code = "balanced";
  let badge = "斜俯鸟瞰成立";
  let tone = "ok";
  let headline = "";
  let body = "";
  let hint = "";

  if (pitchLow) {
    code = "low-pitch";
    badge = `俯角 ${Math.round(pitch)}° · 前景遮挡`;
    tone = "warn";
    headline = `视点贴地太低，${blockerName || "前景建筑"}挡住了全局格局`;
    body = `当前俯角仅 ${Math.round(pitch)}°（立面占比 ${facadePct}%），视线困在街巷内部，中央广场仅露出 ${plazaVisiblePct}%，四向路网只有 ${openPaths}/4 条读得通。这更接近平视街景，观众看见的是眼前墙面，读不懂整片街区的关系。`;
    hint = "把「机位俯角」向上拉到 36°–70° 区间，先掀开前景楼顶的遮挡。";
  } else if (pitchNadir) {
    code = "nadir-flat";
    badge = `俯角 ${Math.round(pitch)}° · 退化顶视`;
    tone = "warn";
    headline = `机位压到近垂直 ${Math.round(pitch)}°，建筑立面完全消失`;
    body = `此时立面投影占比跌到 ${facadePct}%，整个街区被压扁成一张二维屋顶平面图。垂直 90° 更适合纯平面图案或地图测绘（079 顶视构图的强项），但若要同时交代高低体量与空间纵深，鸟瞰需要保留斜俯角。`;
    hint = "把「机位俯角」稍降回 36°–70° 之间，让建筑立面重新露出来。";
  } else if (!orderOk) {
    code = "scattered";
    badge = "格局散乱 · 流线截断";
    tone = "warn";
    headline = "视点抬高了，但下方街区散乱，高空只是把无序看得更清楚";
    body = `俯角 ${Math.round(pitch)}° 已经能俯视全场，可错位歪斜的建筑体块直接挤占通道，四向橙色流线仅剩 ${openPaths}/4 条畅通。鸟瞰构图不是「飞高就自动变整齐」，必须先统筹主体、道路与留白的秩序。`;
    hint = "点一下「规整统筹」把散乱街区归回轴网，再看四向路径如何豁然贯通。";
  } else if (!anchorOk) {
    code = plaza.id === "none" ? "no-anchor" : "corner-anchor";
    badge = plaza.id === "none" ? "缺少焦点锚点" : "主锚点挤边";
    tone = "warn";
    headline = plaza.id === "none"
      ? "失去色彩与几何锚点，画面散成了没有重心的卫星底图"
      : "橙色主广场被挤到边缘死角，四向轴线失去聚散中心";
    body = plaza.id === "none"
      ? "俯视画面元素众多，没有一个清晰的视觉枢纽来承接视线，眼睛会在一堆橄榄绿方框里四处漂移。原海报正是用一轮醒目的橙色圆形广场，把整座街区钉住。"
      : "把主广场推到角落后，四条主要流线无法在中心交汇，画面重心严重偏斜，边缘紧绷而中心空洞。";
    hint = "直接在沙盘点击「中央枢纽」或「北院节点」，把橙色锚点立回视线核心。";
  } else if (azimuthBlocked) {
    code = "azimuth-blocked";
    badge = "绕飞盲区 · 塔楼遮挡";
    tone = "warn";
    headline = `航向正好绕到「${blockerName || "高楼"}」背后，广场被挡掉 ${100 - plazaVisiblePct}%`;
    body = `哪怕俯角在 ${Math.round(pitch)}° 经验区间内，如果机位正好落在最高体量的正背侧，高耸楼体仍会挡住核心广场的出入口。鸟瞰取景不止看多高，还要选能把主入口和路网一起摊开的航向。`;
    hint = "在沙盘上左右横拖绕飞换个方位，或点指北针「归北 0°」清开视线。";
  } else if (sunNoon) {
    code = "noon-flat";
    badge = `正午 ${Math.round(sunElev)}° · 高度晒扁`;
    tone = "warn";
    headline = `太阳压在头顶 ${Math.round(sunElev)}°，投射影长仅 ${shadowLen.toFixed(2)}× 楼高`;
    body = "从高空往下看时，缺少斜向长影就会失去最重要的高度标尺——东区 2.5 倍高的主塔楼和旁边一层连廊几乎融成同样扁平的色块。";
    hint = "把「太阳高度」降到 24°–58° 区间，拉出清爽斜影把建筑体量立起来。";
  } else if (sunDusk) {
    code = "dusk-drown";
    badge = `残阳 ${Math.round(sunElev)}° · 长影吞路`;
    tone = "warn";
    headline = `光线低到 ${Math.round(sunElev)}°，超长阴影淹没了 ${roadShadowPct}% 街道路面`;
    body = `影长拉到楼高的 ${shadowLen.toFixed(1)} 倍，大片交叉黑影压住斑马线与橙色流线，反而削弱了鸟瞰构图最看重的「结构清晰」与路径可读性。`;
    hint = "把「太阳高度」略抬回 24°–58° 的清朗斜阳区间。";
  } else {
    const isHighOblique = pitch >= 54;
    code = isHighOblique ? "balanced-high-oblique" : "balanced-low-oblique";
    badge = isHighOblique ? `高斜俯 ${Math.round(pitch)}° · 总图格局` : `低斜俯 ${Math.round(pitch)}° · 纵深俯瞰`;
    tone = "ok";
    headline = isHighOblique
      ? `高斜俯 ${Math.round(pitch)}° 格局通透：平面秩序与立体高低同时在线`
      : `低斜俯 ${Math.round(pitch)}° 纵深饱满：既看清四向路网，又保有建筑气势`;
    body = isHighOblique
      ? `主广场完整露出 ${plazaVisiblePct}%，四向路径 ${openPaths}/4 条贯通，立面保留 ${facadePct}% 且斜阳影长 ${shadowLen.toFixed(1)}× 楼高——这正是 077 原海报所属的高斜俯建筑总图区间，最适合梳理复杂空间关系。`
      : `主广场清晰露出 ${plazaVisiblePct}%，建筑立面占到 ${facadePct}%、影长 ${shadowLen.toFixed(1)}× 楼高，更有无人机掠过街区上空的临场纵深感。继续微调俯角或绕飞方位，还能得到更多合法取景解。`;
    hint = "继续在沙盘左右横拖体验 360° 绕飞，或试试把俯角推到 90° 感受它何时跨界成顶视构图。";
  }

  // 四枚原海报圆徽的实时单真源读数
  const pillars = {
    overview: {
      ok: pitchOk && !azimuthBlocked,
      tag: pitchLow ? `${Math.round(pitch)}° 过低` : pitchNadir ? `${Math.round(pitch)}° 过陡` : azimuthBlocked ? `遮挡 ${100 - plazaVisiblePct}%` : `${Math.round(pitch)}° 清晰`,
    },
    path: {
      ok: openPaths === 4,
      tag: openPaths === 4 ? "4/4 贯通" : `${openPaths}/4 受阻`,
    },
    order: {
      ok: orderOk && anchorOk,
      tag: !orderOk ? "散乱错位" : !anchorOk ? "锚点失位" : plaza.id === "north" ? "偏心有序" : "核心统筹",
    },
    relation: {
      ok: sunOk && facadePct >= 10 && facadePct <= 48,
      tag: sunNoon ? `影 ${shadowLen.toFixed(1)}× 扁平` : sunDusk ? `影 ${shadowLen.toFixed(1)}× 过重` : facadePct < 10 ? "立面消失" : `影 ${shadowLen.toFixed(1)}× 分明`,
    },
  };

  const tier = tone === "ok"
    ? (pitch >= 54 ? "高斜俯成立" : "低斜俯成立")
    : (pitchLow || pitchNadir ? "视点越界" : "秩序待调");

  return {
    scene,
    metrics: {
      pitch: Math.round(pitch),
      azimuth: ((Math.round(state.azimuth) % 360) + 360) % 360,
      sunElev: Math.round(sunElev),
      plazaVisiblePct,
      facadePct,
      shadowLen,
      openPaths,
      roadShadowPct,
      tier,
    },
    pathStatus,
    pillars,
    verdict: { code, badge, tone, headline, body, hint },
  };
}
