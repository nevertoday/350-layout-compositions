// 076 轴测构图 — 单真源三维正轴测投影与装配诊断模型
// 全部读数、三轴夹角、缩短系数 p:q:r、前后棱比与错态判定均从同一套投影矩阵与实绘顶点坐标核算。

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export const INITIAL_STATE = {
  scene: "poster",   // "poster" | "arch" | "optics"
  yaw: 14,           // 方位角 θ (度)，开场故意停在近正面塌面退化角
  pitch: 9,          // 俯角 φ (度)，开场过低导致顶面压成窄缝
  explode: 0,        // 爆炸层距 0..100%，开场 0% 压死遮挡内件
  persp: 44,         // 透视渗入 0..60%，开场 44% 破坏平行投影等长性
  misalign: 0.72,    // 连接件脱轴偏移量 (世界单位)，开场偏出 Z 轴
  guides: false,     // 装配导轨与隐藏虚线，开场关闭
  selectedPart: null // 当前高亮剖析的零件 id
};

// 三组经过 ISO 5456-3 与解析几何核算的标准正轴测合法解
export const PRESETS = {
  isometric: {
    id: "isometric",
    label: "等轴测",
    en: "ISOMETRIC",
    yaw: 45,
    pitch: 35.26,
    explode: 56,
    persp: 0,
    misalign: 0,
    guides: true,
    note: "三轴互成 120°，三轴等比缩短 0.816（1 : 1 : 1），三面权重完全均等。"
  },
  dimetric: {
    id: "dimetric",
    label: "二轴测",
    en: "DIMETRIC",
    yaw: 20.7,
    pitch: 19.47,
    explode: 54,
    persp: 0,
    misalign: 0,
    guides: true,
    note: "ISO 5456-3 经典 7°/42° 二轴测：前主面与竖轴保持 1 : 1，侧深减半为 0.5，主展示面更舒展。"
  },
  trimetric: {
    id: "trimetric",
    label: "三轴测",
    en: "TRIMETRIC",
    yaw: 26,
    pitch: 38,
    explode: 58,
    persp: 0,
    misalign: 0,
    guides: true,
    note: "三轴夹角与缩短率各不相同，按需要自由分配顶面、主面与侧面的视觉比重，减少对称重影。"
  },
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    en: "RESET ERRORS",
    ...INITIAL_STATE
  }
};

// 三套装配体题材与四层组件定义（与 076 原海报四层标注一一对应）
export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 机械装配",
    shortLabel: "原海报机械",
    parts: [
      { id: "plate", name: "顶板", en: "TOP PLATE", role: "水平面要素 · 定义顶部轮廓", zBase: 1.24, explodeScale: 2.65 },
      { id: "body", name: "主体", en: "MAIN BODY", role: "核心体量 · 决定整体形态", zBase: 0.62, explodeScale: 1.65 },
      { id: "connector", name: "连接件", en: "CONNECTOR", role: "过渡与连接 · 增强结构关系", zBase: 0.08, explodeScale: 0.65 },
      { id: "base", name: "底座", en: "BASE", role: "承载与稳定 · 建立空间基准", zBase: -0.48, explodeScale: -0.58 }
    ]
  },
  arch: {
    id: "arch",
    label: "现代主义 · 建筑剖析",
    shortLabel: "建筑剖析",
    parts: [
      { id: "plate", name: "采光顶棚", en: "ROOF CANOPY", role: "格栅屋盖 · 限定顶部边界", zBase: 1.26, explodeScale: 2.65 },
      { id: "body", name: "悬挑主层", en: "MAIN HALL", role: "蓝体悬挑 · 组织核心空间", zBase: 0.62, explodeScale: 1.65 },
      { id: "connector", name: "核心筒柱网", en: "STRUCTURAL CORE", role: "承重连接 · 贯通上下动线", zBase: 0.06, explodeScale: 0.65 },
      { id: "base", name: "阶梯基座", en: "PLINTH BASE", role: "场地锚定 · 建立标高基准", zBase: -0.48, explodeScale: -0.58 }
    ]
  },
  optics: {
    id: "optics",
    label: "精密光学 · 镜组拆解",
    shortLabel: "光学镜组",
    parts: [
      { id: "plate", name: "前压环", en: "FRONT RING", role: "前端锁圈 · 界定入射口径", zBase: 1.24, explodeScale: 2.65 },
      { id: "body", name: "蓝膜镜筒", en: "OPTICAL BARREL", role: "主体腔壳 · 包裹主镜片组", zBase: 0.62, explodeScale: 1.65 },
      { id: "connector", name: "调焦销键", en: "FOCUS HELICOID", role: "同轴传动 · 精准对位滑槽", zBase: 0.08, explodeScale: 0.65 },
      { id: "base", name: "卡口底座", en: "MOUNT BASE", role: "机身基准 · 承托同轴光路", zBase: -0.48, explodeScale: -0.58 }
    ]
  }
};

// 正交轴测相机基底：R（右）、U（上）、V（指向观察者）
// 当 yaw=45°, pitch=35.264° 时，Z 竖直朝上，X 朝左下 30°，Y 朝右下 30°，三轴互成 120°
export function makeBasis(yawDeg, pitchDeg) {
  const th = yawDeg * DEG;
  const ph = pitchDeg * DEG;
  const ct = Math.cos(th), st = Math.sin(th);
  const cp = Math.cos(ph), sp = Math.sin(ph);

  const R = [-ct, st, 0];
  const U = [-sp * st, -sp * ct, cp];
  const V = [cp * st, cp * ct, sp];

  // 三个世界坐标单位轴在屏幕平面 (u 右, yUp 上) 上的投影矢量
  const ax = { x: R[0], y: U[0] };
  const ay = { x: R[1], y: U[1] };
  const az = { x: R[2], y: U[2] };

  const p = Math.hypot(ax.x, ax.y);
  const q = Math.hypot(ay.x, ay.y);
  const r = Math.hypot(az.x, az.y);

  // 屏幕夹角（度，X-Y、Y-Z、Z-X 之和恒为 360°）
  const angX = Math.atan2(ax.y, ax.x) * RAD;
  const angY = Math.atan2(ay.y, ay.x) * RAD;
  const angZ = Math.atan2(az.y, az.x) * RAD; // 恒为 90°

  const normDiff = (a, b) => {
    let d = (b - a) % 360;
    if (d < 0) d += 360;
    return d;
  };
  // 按顺时针顺序：Z(90°) -> Y(右下) -> X(左下) -> Z(90°)
  const aZY = normDiff(angY, angZ);
  const aYX = normDiff(angX, angY);
  const aXZ = normDiff(angZ, angX);

  // 单位立方体三个基准面的投影面积（平行四边形叉积）
  const areaTop = Math.abs(ax.x * ay.y - ax.y * ay.x);
  const areaLeft = Math.abs(ax.x * az.y - ax.y * az.x);
  const areaRight = Math.abs(ay.x * az.y - ay.y * az.x);
  const areaSum = Math.max(1e-5, areaTop + areaLeft + areaRight);

  return {
    R, U, V, ax, ay, az,
    p, q, r,
    sumSq: p * p + q * q + r * r,
    angles: { xy: aYX, yz: aZY, zx: aXZ },
    faceShare: {
      top: areaTop / areaSum,
      left: areaLeft / areaSum,
      right: areaRight / areaSum
    }
  };
}

// 投影三维点 (x, y, z) 到画布坐标 (px, py) 和深度 depth (越大越靠前)
export function projectPoint(pt, basis, cx, cy, scale, perspPct = 0) {
  const [x, y, z] = pt;
  const { R, U, V } = basis;
  const rx = x * R[0] + y * R[1] + z * R[2];
  const ry = x * U[0] + y * U[1] + z * U[2];
  const rz = x * V[0] + y * V[1] + z * V[2];

  let k = 1;
  if (perspPct > 0.05) {
    const D = 6.2 / (perspPct / 100);
    k = D / Math.max(2.1, D - rz);
  }
  return {
    x: cx + rx * scale * k,
    y: cy - ry * scale * k,
    depth: rz,
    k
  };
}

// 识别当前视向所属的正轴测流派（完全基于实算 p, q, r 与面积比）
export function classifyAxonometry(basis, pitchDeg, yawDeg) {
  const { p, q, r, angles, faceShare } = basis;
  const minFace = Math.min(faceShare.top, faceShare.left, faceShare.right);
  const minAng = Math.min(angles.xy, angles.yz, angles.zx);
  const maxAng = Math.max(angles.xy, angles.yz, angles.zx);

  // 俯角过小(塌顶面)、俯角过大(塌立面)、或方位贴近0°/90°(塌侧面)
  const modYaw = ((yawDeg % 90) + 90) % 90;
  if (pitchDeg < 14 || pitchDeg > 66 || modYaw < 13 || modYaw > 77 || minFace < 0.095 || minAng < 88 || maxAng > 168) {
    let reason = "某一个维度被压成细缝";
    if (pitchDeg < 14) reason = "俯角过低，顶面与圆孔压扁成一条缝";
    else if (pitchDeg > 66) reason = "俯角过陡，侧面高度严重压缩";
    else reason = "方位角贴近正立面，一侧立体面几乎消失";
    return { kind: "degenerate", label: "退化平视", en: "DEGENERATE", valid: false, reason };
  }

  const maxD = Math.max(p, q, r);
  const dpq = Math.abs(p - q) / maxD;
  const dqr = Math.abs(q - r) / maxD;
  const drp = Math.abs(r - p) / maxD;

  if (dpq < 0.045 && dqr < 0.045 && drp < 0.045) {
    return { kind: "isometric", label: "等轴测", en: "ISOMETRIC", valid: true, reason: "三轴等比、三面权重均等" };
  }
  if (dpq < 0.055 || dqr < 0.055 || drp < 0.055) {
    return { kind: "dimetric", label: "二轴测", en: "DIMETRIC", valid: true, reason: "两轴等比、主展面更宽阔" };
  }
  return { kind: "trimetric", label: "三轴测", en: "TRIMETRIC", valid: true, reason: "三轴不等比、主次三面自由分级" };
}

// 实算零件沿 Z 轴爆炸偏移后的中心 Z
export function partZ(part, explodePct) {
  const t = explodePct / 100;
  return part.zBase + part.explodeScale * t * 1.12;
}

// 生成单个长方体的 8 顶点与 6 面（世界空间，逆时针外法线）
export function makeBox(x0, x1, y0, y1, z0, z1, palette, opts = {}) {
  const verts = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // 底 0..3
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]  // 顶 4..7
  ];
  const faces = [
    { idx: [4, 5, 6, 7], n: [0, 0, 1], shade: "top" },
    { idx: [0, 3, 2, 1], n: [0, 0, -1], shade: "bottom" },
    { idx: [1, 2, 6, 5], n: [1, 0, 0], shade: "left" },
    { idx: [0, 4, 7, 3], n: [-1, 0, 0], shade: "backL" },
    { idx: [2, 3, 7, 6], n: [0, 1, 0], shade: "right" },
    { idx: [0, 1, 5, 4], n: [0, -1, 0], shade: "backR" }
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
  return { kind: "box", verts, faces, edges, palette, ...opts };
}

// 生成竖直圆柱体（用于连接件圆柱销与光学镜筒）
export function makeCylinder(cx, cy, r, z0, z1, segs, palette, opts = {}) {
  const verts = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    verts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0]);
  }
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    verts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z1]);
  }
  const faces = [];
  const topIdx = [];
  const botIdx = [];
  for (let i = 0; i < segs; i++) {
    topIdx.push(segs + i);
    botIdx.push(segs - 1 - i);
    const j = (i + 1) % segs;
    const am = ((i + 0.5) / segs) * Math.PI * 2;
    faces.push({
      idx: [i, j, segs + j, segs + i],
      n: [Math.cos(am), Math.sin(am), 0],
      shade: "side",
      smooth: true
    });
  }
  faces.push({ idx: topIdx, n: [0, 0, 1], shade: "top" });
  faces.push({ idx: botIdx, n: [0, 0, -1], shade: "bottom" });
  return { kind: "cyl", verts, faces, segs, r, cx, cy, z0, z1, palette, ...opts };
}

// 调色板预设（全部实采自 076 原海报）
export const PART_PALETTES = {
  plate: {
    top: "#9BA7B3", left: "#697888", right: "#495869", bottom: "#293645",
    stroke: "#E2ECF5", hidden: "rgba(182, 212, 236, 0.35)", hole: "#07182B"
  },
  body: {
    top: "#2275CC", left: "#0C59A8", right: "#053F7D", bottom: "#03264F",
    stroke: "#8ADAF5", hidden: "rgba(122, 214, 246, 0.42)", hole: "#021833"
  },
  connector: {
    top: "#CDD5DF", left: "#9BA6B2", right: "#6D7B89", bottom: "#3D4B5A",
    stroke: "#F0F5FA", hidden: "rgba(216, 228, 240, 0.42)", hole: "#132233"
  },
  base: {
    top: "#3A4D62", left: "#223447", right: "#142334", bottom: "#0B1624",
    stroke: "#9AB8D4", hidden: "rgba(130, 178, 214, 0.36)", hole: "#061221"
  }
};

// 按题材构建 4 件装配体全部 3D 构件
export function buildAssembly(state) {
  const sceneMeta = SCENES[state.scene] || SCENES.poster;
  const ex = state.explode;
  const dxConn = state.misalign;
  const byId = Object.fromEntries(sceneMeta.parts.map((p) => [p.id, p]));

  const zPlate = partZ(byId.plate, ex);
  const zBody = partZ(byId.body, ex);
  const zConn = partZ(byId.connector, ex);
  const zBase = partZ(byId.base, ex);

  const items = [];

  if (state.scene === "poster") {
    // 1. 底座 BASE（空腔四壁 + 左右圆孔）
    const bw = 1.05, bh = 0.88, wt = 0.22;
    items.push({
      partId: "base",
      zAnchor: zBase + bh * 0.5,
      solids: [
        makeBox(-bw, bw, -bw, bw, zBase, zBase + 0.16, PART_PALETTES.base, {
          holes: [{ plane: "Z+", center: [0, 0, zBase + 0.164], r: 0.34 }]
        }), // 底板（圆孔随底板按深度绘，永不穿透前壁）
        makeBox(-bw, bw, -bw, -bw + wt, zBase + 0.16, zBase + bh, PART_PALETTES.base), // 后右壁
        makeBox(-bw, -bw + wt, -bw + wt, bw, zBase + 0.16, zBase + bh, PART_PALETTES.base), // 后左壁
        makeBox(bw - wt, bw, -bw + wt, bw, zBase + 0.16, zBase + bh, PART_PALETTES.base, {
          holes: [{ plane: "X+", center: [bw + 0.004, 0.04, zBase + 0.48], r: 0.21 }]
        }), // 左前壁
        makeBox(-bw + wt, bw - wt, bw - wt, bw, zBase + 0.16, zBase + bh, PART_PALETTES.base, {
          holes: [{ plane: "Y+", center: [0.05, bw + 0.004, zBase + 0.48], r: 0.21 }]
        }) // 右前壁
      ],
      holes: []
    });

    // 2. 连接件 CONNECTOR（金属基块 + 向下 L 形折臂 + 居中圆柱销）
    items.push({
      partId: "connector",
      zAnchor: zConn + 0.42,
      misaligned: Math.abs(dxConn) > 0.03,
      solids: [
        makeBox(-0.62 + dxConn, 0.62 + dxConn, -0.58, 0.58, zConn + 0.06, zConn + 0.34, PART_PALETTES.connector),
        makeBox(-0.18 + dxConn, 0.22 + dxConn, 0.30, 0.62, zConn - 0.50, zConn + 0.06, PART_PALETTES.connector),
        makeCylinder(dxConn, 0, 0.24, zConn + 0.34, zConn + 0.94, 16, PART_PALETTES.connector)
      ],
      holes: []
    });

    // 3. 主体 MAIN BODY（076 原海报标志性工业蓝 U 形开槽主体）
    const uw = 1.04, uh = 0.56, arm = 0.38;
    items.push({
      partId: "body",
      zAnchor: zBody + uh * 0.5,
      solids: [
        makeBox(-uw, -uw + arm, -uw, uw, zBody, zBody + uh, PART_PALETTES.body),       // 后脊
        makeBox(-uw + arm, uw, -uw, -uw + arm, zBody, zBody + uh, PART_PALETTES.body), // 左翼
        makeBox(-uw + arm, uw, uw - arm, uw, zBody, zBody + uh, PART_PALETTES.body)    // 右翼（前向开口）
      ],
      holes: []
    });

    // 4. 顶板 TOP PLATE（冷银灰盖板 + 中央圆孔）
    const pw = 1.04, ph = 0.18;
    items.push({
      partId: "plate",
      zAnchor: zPlate + ph * 0.5,
      solids: [
        makeBox(-pw, pw, -pw, pw, zPlate, zPlate + ph, PART_PALETTES.plate)
      ],
      holes: [
        { plane: "Z+", center: [0, 0, zPlate + ph + 0.004], r: 0.30 }
      ]
    });
  } else if (state.scene === "arch") {
    // 现代主义三层建筑剖析
    items.push({
      partId: "base",
      zAnchor: zBase + 0.35,
      solids: [
        makeBox(-1.12, 1.12, -1.08, 1.08, zBase, zBase + 0.28, PART_PALETTES.base),
        makeBox(-0.84, 0.94, -0.82, 0.88, zBase + 0.28, zBase + 0.54, PART_PALETTES.base),
        makeBox(0.50, 1.06, -0.26, 0.44, zBase + 0.28, zBase + 0.40, PART_PALETTES.base)
      ],
      holes: []
    });
    items.push({
      partId: "connector",
      zAnchor: zConn + 0.45,
      misaligned: Math.abs(dxConn) > 0.03,
      solids: [
        makeBox(-0.34 + dxConn, 0.28 + dxConn, -0.34, 0.26, zConn - 0.06, zConn + 0.82, PART_PALETTES.connector),
        makeBox(0.56 + dxConn, 0.72 + dxConn, 0.56, 0.72, zConn - 0.06, zConn + 0.72, PART_PALETTES.connector),
        makeBox(-0.72 + dxConn, -0.56 + dxConn, 0.56, 0.72, zConn - 0.06, zConn + 0.72, PART_PALETTES.connector),
        makeBox(0.56 + dxConn, 0.72 + dxConn, -0.72, -0.56, zConn - 0.06, zConn + 0.72, PART_PALETTES.connector)
      ],
      holes: []
    });
    items.push({
      partId: "body",
      zAnchor: zBody + 0.34,
      solids: [
        makeBox(-1.02, 0.98, -0.96, 0.16, zBody, zBody + 0.58, PART_PALETTES.body),
        makeBox(-1.02, 0.24, 0.16, 0.96, zBody, zBody + 0.58, PART_PALETTES.body),
        makeBox(0.24, 1.12, 0.30, 0.96, zBody + 0.22, zBody + 0.54, PART_PALETTES.body)
      ],
      holes: [
        { plane: "X+", center: [0.984, -0.40, zBody + 0.30], r: 0.16 }
      ]
    });
    items.push({
      partId: "plate",
      zAnchor: zPlate + 0.10,
      solids: [
        makeBox(-1.08, 1.08, -1.02, -0.54, zPlate, zPlate + 0.15, PART_PALETTES.plate),
        makeBox(-1.08, 1.08, 0.54, 1.02, zPlate, zPlate + 0.15, PART_PALETTES.plate),
        makeBox(-1.08, -0.52, -0.54, 0.54, zPlate, zPlate + 0.15, PART_PALETTES.plate),
        makeBox(0.52, 1.08, -0.54, 0.54, zPlate, zPlate + 0.15, PART_PALETTES.plate)
      ],
      holes: []
    });
  } else {
    // 精密光学镜组拆解
    items.push({
      partId: "base",
      zAnchor: zBase + 0.35,
      solids: [
        makeCylinder(0, 0, 1.04, zBase, zBase + 0.34, 18, PART_PALETTES.base),
        makeCylinder(0, 0, 0.78, zBase + 0.34, zBase + 0.62, 18, PART_PALETTES.base)
      ],
      holes: [
        { plane: "Z+", center: [0, 0, zBase + 0.624], r: 0.44 }
      ]
    });
    items.push({
      partId: "connector",
      zAnchor: zConn + 0.35,
      misaligned: Math.abs(dxConn) > 0.03,
      solids: [
        makeCylinder(dxConn, 0, 0.64, zConn, zConn + 0.42, 18, PART_PALETTES.connector),
        makeBox(0.56 + dxConn, 0.94 + dxConn, -0.14, 0.14, zConn + 0.08, zConn + 0.34, PART_PALETTES.connector),
        makeCylinder(dxConn, 0, 0.28, zConn + 0.42, zConn + 0.78, 14, PART_PALETTES.connector)
      ],
      holes: []
    });
    items.push({
      partId: "body",
      zAnchor: zBody + 0.34,
      solids: [
        makeCylinder(0, 0, 0.96, zBody, zBody + 0.62, 18, PART_PALETTES.body)
      ],
      holes: [
        { plane: "Z+", center: [0, 0, zBody + 0.624], r: 0.62 }
      ]
    });
    items.push({
      partId: "plate",
      zAnchor: zPlate + 0.10,
      solids: [
        makeCylinder(0, 0, 1.00, zPlate, zPlate + 0.18, 18, PART_PALETTES.plate)
      ],
      holes: [
        { plane: "Z+", center: [0, 0, zPlate + 0.184], r: 0.66 }
      ]
    });
  }

  return { sceneMeta, items, anchors: { plate: zPlate, body: zBody, connector: zConn, base: zBase } };
}

// 单真源评估：直接从实绘投影矩阵、前后棱屏幕像素长、各层屏幕垂直包围盒核算全部指标
export function evaluateState(state) {
  const basis = makeBasis(state.yaw, state.pitch);
  const cls = classifyAxonometry(basis, state.pitch, state.yaw);

  // 1. 实算底座最前端棱与最后端棱在当前投影下的真实屏幕像素长比（以 scale=100 基准）
  const S = 100;
  const pFrontA = projectPoint([1, -1, 0], basis, 0, 0, S, state.persp);
  const pFrontB = projectPoint([1, 1, 0], basis, 0, 0, S, state.persp);
  const pBackA = projectPoint([-1, -1, 0], basis, 0, 0, S, state.persp);
  const pBackB = projectPoint([-1, 1, 0], basis, 0, 0, S, state.persp);
  // 也比竖直前棱与后棱，确保任何 yaw 下都能稳定量出近远缩放差
  const vFront0 = projectPoint([1, 1, 0], basis, 0, 0, S, state.persp);
  const vFront1 = projectPoint([1, 1, 1], basis, 0, 0, S, state.persp);
  const vBack0 = projectPoint([-1, -1, 0], basis, 0, 0, S, state.persp);
  const vBack1 = projectPoint([-1, -1, 1], basis, 0, 0, S, state.persp);

  const lenFront = Math.hypot(vFront1.x - vFront0.x, vFront1.y - vFront0.y);
  const lenBack = Math.max(1e-3, Math.hypot(vBack1.x - vBack0.x, vBack1.y - vBack0.y));
  const lenEdgeF = Math.hypot(pFrontB.x - pFrontA.x, pFrontB.y - pFrontA.y);
  const lenEdgeB = Math.max(1e-3, Math.hypot(pBackB.x - pBackA.x, pBackB.y - pBackA.y));
  const frontBackRatio = Math.max(lenFront / lenBack, lenEdgeF / lenEdgeB);

  // 2. 实算四层零件投影后的垂直包围盒与遮挡重叠度
  const assembly = buildAssembly(state);
  const bands = assembly.items.map((item) => {
    let minY = Infinity, maxY = -Infinity;
    for (const solid of item.solids) {
      for (const v of solid.verts) {
        const pr = projectPoint(v, basis, 0, 0, S, state.persp);
        if (pr.y < minY) minY = pr.y;
        if (pr.y > maxY) maxY = pr.y;
      }
    }
    return { id: item.partId, minY, maxY, h: Math.max(1, maxY - minY) };
  });
  // 从上到下排：plate, body, connector, base（screen y 越小越靠上）
  const ordered = ["plate", "body", "connector", "base"].map((id) => bands.find((b) => b.id === id));
  let overlapSum = 0;
  let pairSpanSum = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const up = ordered[i], dn = ordered[i + 1];
    const ov = Math.max(0, up.maxY - dn.minY);
    overlapSum += ov;
    pairSpanSum += Math.min(up.h, dn.h);
  }
  const overlapRate = Math.min(100, Math.round((overlapSum / Math.max(1, pairSpanSum)) * 100));

  // 3. 四项轴测核心判据
  const parallelOk = state.persp <= 1 && frontBackRatio <= 1.015;
  const viewOk = cls.valid;
  const explodeCrushed = state.explode < 30;
  const explodeScattered = state.explode > 86;
  const explodeOk = !explodeCrushed && !explodeScattered;
  const misaligned = Math.abs(state.misalign) > 0.04;
  const alignOk = !misaligned && state.guides;

  const score = [parallelOk, viewOk, explodeOk, alignOk].filter(Boolean).length;

  // 4. 标准化三轴比（以最大轴为 1.00，便于人眼直读）
  const maxAxis = Math.max(basis.p, basis.q, basis.r, 1e-4);
  const ratioText = `${(basis.p / maxAxis).toFixed(2)} : ${(basis.q / maxAxis).toFixed(2)} : ${(basis.r / maxAxis).toFixed(2)}`;

  // 5. 白话诊断：讲清「现在为什么不行」+ 明确下一步
  let badge = `${score}/4 待校`;
  let tone = "err";
  let headline = "";
  let why = "";
  let nextStep = "";

  if (score === 4) {
    badge = `4/4 清晰 · ${cls.label}`;
    tone = "ok";
    headline = `${cls.label}已校准：平行不缩，四层构造一目了然`;
    why = `当前三轴缩短系数 ${basis.p.toFixed(2)} / ${basis.q.toFixed(2)} / ${basis.r.toFixed(2)}（平方和 ${basis.sumSq.toFixed(2)}），前后同长棱严格 1.00×，四件组件沿 Z 轴导轨清楚分离，可见轮廓与隐藏虚线层次分明。试试切换二轴测或三轴测，观察三面面积权重的不同。`;
    nextStep = "已达标。你可以横拖画布在等轴测、二轴测、三轴测之间自由漫游，或点击任意零件查看构造职责。";
  } else if (!parallelOk) {
    badge = `${score}/4 错态 · 透视渗入`;
    headline = `前后同长棱差了 ${frontBackRatio.toFixed(2)} 倍，平行投影失效`;
    why = `透视渗入开到了 ${Math.round(state.persp)}%，前端棱明显比后端大，平行边正向远处收拢。轴测构图的核心价值是「无消失点、同轴等量」，一旦混入透视，图纸就失去直接量测和跨层对位的可靠性。`;
    nextStep = "先把「透视渗入」滑轨拉回到 0%，让前后棱回归严格平行 1.00×。";
  } else if (!viewOk) {
    badge = `${score}/4 错态 · 视角塌面`;
    headline = `${cls.reason}，三维体积被压扁`;
    why = `当前方位 ${Math.round(state.yaw)}°、俯角 ${Math.round(state.pitch)}°，顶/左/右三个面的可视占比失衡（顶 ${Math.round(basis.faceShare.top * 100)}% · 左 ${Math.round(basis.faceShare.left * 100)}% · 右 ${Math.round(basis.faceShare.right * 100)}%）。轴测要一次交代三个空间维度，任意一面被挤成细缝就会退回平面正视图。`;
    nextStep = "在画布左右横拖旋转方位，或点击「等轴测 / 二轴测 / 三轴测」卡片切入清晰三维视向。";
  } else if (explodeCrushed) {
    badge = `${score}/4 错态 · 层间闷死`;
    headline = `四件组件压叠在一起（重叠约 ${overlapRate}%），内部销轴被遮没`;
    why = `爆炸层距目前只有 ${Math.round(state.explode)}%，顶板与蓝色 U 形主体直接盖住了中间的连接件与空腔底座。原海报「结构分析」强调由整体到局部地分解形体，不开层距就看不出咬合关系。`;
    nextStep = "把「爆炸层距」滑轨推到 40%–75% 之间，沿 Z 轴顺滑拆开四层零件。";
  } else if (explodeScattered) {
    badge = `${score}/4 错态 · 炸散失联`;
    headline = `爆炸层距拉到 ${Math.round(state.explode)}%，组件飞散成孤岛`;
    why = `拆解不是越远越好。层间空隙过大时，顶板与底座之间距离过长，人眼来回扫视会丢失「它们原属同一个装配体」的整体咬合感。`;
    nextStep = "把「爆炸层距」滑轨往回收至 35%–80% 舒适带，让零件分而不散。";
  } else if (misaligned) {
    badge = `${score}/4 错态 · 连接件脱轴`;
    headline = `连接件偏出主轴 ${state.misalign.toFixed(2)} 格，轴向统一被打破`;
    why = `原海报设计要点第一条就是「保持轴向一致，避免倾斜」。中间的销轴连接件水平偏出后，圆柱销不再对准顶板圆孔，读者会误以为它装在侧面而不是同轴插接。`;
    nextStep = "直接点击画布上红框标出的「连接件」（或点「归位偏轴件」按钮），让它吸回 Z 轴导轨。";
  } else {
    badge = `${score}/4 错态 · 缺少导轨隐线`;
    headline = `少了装配导轨与隐藏虚线，看不出咬合顺序`;
    why = `组件虽然分开了，但没有竖直虚线导轨把顶板、主体、连接件和底座串成同一条装配轴，也缺少背面隐藏虚线交代中空内腔，空间层级会显得松散漂浮。`;
    nextStep = "点开「导轨与隐线」按钮，用实线定外轮廓、虚线交代隐蔽结构与对齐路径。";
  }

  // 映射到原海报底沿 01..05 绘制步骤实况
  const steps = [
    { num: "01", title: "确定轴向", en: "SET AXES", ok: viewOk && parallelOk },
    { num: "02", title: "构建基体", en: "BUILD VOLUME", ok: viewOk },
    { num: "03", title: "添加细节", en: "ADD DETAILS", ok: !explodeCrushed },
    { num: "04", title: "完善结构", en: "REFINE STRUCTURE", ok: explodeOk && !misaligned },
    { num: "05", title: "强化表达", en: "ENHANCE CLARITY", ok: score === 4 }
  ];

  // 左沿原海报四枚要点实况徽
  const pillars = [
    {
      id: "axes",
      title: "三轴关系",
      en: "AXES",
      body: "三轴夹角与比例决定三个面的可读权重",
      ok: viewOk,
      tag: viewOk ? `${cls.label} · ${Math.round(basis.angles.xy)}°/${Math.round(basis.angles.yz)}°` : "视角塌面"
    },
    {
      id: "analysis",
      title: "技术表达",
      en: "ANALYSIS",
      body: "平行投影，无透视收缩，真实反映形体结构",
      ok: parallelOk,
      tag: parallelOk ? "平行 1.00×" : `近大 ${frontBackRatio.toFixed(2)}×`
    },
    {
      id: "structure",
      title: "结构分析",
      en: "STRUCTURE",
      body: "沿轴分解形体，由整体到局部看清构造",
      ok: explodeOk,
      tag: explodeOk ? `展开 ${Math.round(state.explode)}%` : (explodeCrushed ? `压死 ${overlapRate}%` : "过散失联")
    },
    {
      id: "clarity",
      title: "空间清晰",
      en: "CLARITY",
      body: "轴向一致、导轨隐线分明，层级一目了然",
      ok: alignOk,
      tag: alignOk ? "同轴 · 虚实清" : (misaligned ? "连接件脱轴" : "缺导轨隐线")
    }
  ];

  return {
    basis,
    cls,
    frontBackRatio,
    overlapRate,
    ratioText,
    checks: { parallelOk, viewOk, explodeOk, alignOk },
    score,
    badge,
    tone,
    headline,
    why,
    nextStep,
    steps,
    pillars,
    assembly
  };
}
