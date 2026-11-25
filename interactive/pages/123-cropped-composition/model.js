// 123 裁切构图 · 单真源几何与裁切评估模型
// 所有坐标均位于等比欧氏原稿平面 WORLD_W(1.28) × WORLD_H(1.00) 内，确保任何屏幕比例下圆永远是正圆。
// 右屏全幅取景刀口台、左屏深靛蓝成品显影窗、标题动态角标、底沿四符印章、白话诊单全部只读 evaluate(state)。

export const WORLD_W = 1.28;
export const WORLD_H = 1.0;

export const PALETTE = {
  paper: "#FCF9F3",
  paperBright: "#FFFDF9",
  sand: "#F3EDE2",
  ink: "#0D1014",
  orange: "#DA4807",
  orangeVivid: "#E94300",
  green: "#085C44",
  greenDark: "#072B21",
  navy: "#112E6D",
  navyDark: "#0B1A3B",
  pink: "#F290B1",
  alert: "#B91C1C",
  alertBright: "#FF7878",
  ok: "#065C43",
  okBright: "#6CE0B6",
};

export const RATIOS = {
  poster: { id: "poster", label: "原海报 4:3", aspect: 4 / 3 },
  cinema: { id: "cinema", label: "电影 16:9", aspect: 16 / 9 },
  vertical: { id: "vertical", label: "竖幅 3:4", aspect: 3 / 4 },
  free: { id: "free", label: "自由刀口", aspect: null },
};

// 点在多边形内判定（射线法）
function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInShape(px, py, s) {
  if (s.kind === "circle") {
    const dx = px - s.cx;
    const dy = py - s.cy;
    return dx * dx + dy * dy <= s.r * s.r;
  }
  if (s.kind === "rect") {
    return px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h;
  }
  if (s.kind === "poly") {
    return pointInPoly(px, py, s.pts);
  }
  if (s.kind === "capsule") {
    // 椭圆/胶囊用于无五官人体侧影平滑躯干
    const dx = (px - s.cx) / s.rx;
    const dy = (py - s.cy) / s.ry;
    return dx * dx + dy * dy <= 1;
  }
  return false;
}

export function shapeBounds(s) {
  if (s.kind === "circle") {
    return { x0: s.cx - s.r, y0: s.cy - s.r, x1: s.cx + s.r, y1: s.cy + s.r };
  }
  if (s.kind === "rect") {
    return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
  }
  if (s.kind === "capsule") {
    return { x0: s.cx - s.rx, y0: s.cy - s.ry, x1: s.cx + s.rx, y1: s.cy + s.ry };
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of s.pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}

// 三大实景题材定义（纯矢量，人物严格采用无五官侧影剪影）
export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报 · 几何破框",
    short: "原海报几何",
    subtitle: "朱橘大圆、深松绿 L 柱、深靛蓝基梁与樱粉方块",
    bg: PALETTE.paper,
    // 1:1 呼应 123 原海报四形体位置与叠压次序
    shapes: [
      {
        id: "green",
        label: "深松绿 L 柱",
        kind: "poly",
        color: PALETTE.green,
        dashColor: PALETTE.green,
        primary: false,
        pts: [
          [0.82, 0.16],
          [1.04, 0.16],
          [1.04, 0.68],
          [0.72, 0.68],
          [0.72, 0.48],
          [0.82, 0.48],
        ],
      },
      {
        id: "orange",
        label: "朱橘大圆",
        kind: "circle",
        color: PALETTE.orange,
        dashColor: PALETTE.orangeVivid,
        primary: true,
        cx: 0.44,
        cy: 0.43,
        r: 0.255,
      },
      {
        id: "navy",
        label: "深靛蓝横条",
        kind: "rect",
        color: PALETTE.navy,
        dashColor: PALETTE.navy,
        primary: false,
        x: 0.20,
        y: 0.72,
        w: 0.56,
        h: 0.165,
      },
      {
        id: "pink",
        label: "樱粉方块",
        kind: "rect",
        color: PALETTE.pink,
        dashColor: PALETTE.pink,
        primary: false,
        x: 0.76,
        y: 0.56,
        w: 0.28,
        h: 0.34,
      },
    ],
    anchors: [
      { id: "circle-core", label: "朱橘圆主体弧段", x: 0.46, y: 0.46, r: 0.08, required: true },
    ],
    joints: [],
    // 开场 0/4 胆怯全包 + 擦边发紧错态
    initial: { x: 0.172, y: 0.145, w: 0.90, h: 0.775 },
    presets: {
      classic: { label: "原海报经典解", ratio: "poster", frame: { x: 0.26, y: 0.30, w: 0.72, h: 0.54 } },
      bold: { label: "强张力特写解", ratio: "poster", frame: { x: 0.34, y: 0.33, w: 0.62, h: 0.465 } },
      cinema: { label: "16:9 电影解", ratio: "cinema", frame: { x: 0.25, y: 0.35, w: 0.74, h: 0.416 } },
      errFull: { label: "试错：全装框内", ratio: "free", frame: { x: 0.10, y: 0.08, w: 1.06, h: 0.87 } },
      errOver: { label: "试错：过切失认", ratio: "poster", frame: { x: 0.51, y: 0.35, w: 0.44, h: 0.33 } },
      errTangent: { label: "试错：擦边发紧", ratio: "free", frame: { x: 0.172, y: 0.145, w: 0.90, h: 0.775 } },
    },
  },

  portrait: {
    id: "portrait",
    name: "人物侧影 · 避关节",
    short: "人物侧影",
    subtitle: "无五官优雅侧影剪影，测试头顶擦边与关节误切禁忌",
    bg: PALETTE.paper,
    shapes: [
      {
        id: "sun",
        label: "背景朱橘光轮",
        kind: "circle",
        color: PALETTE.orange,
        dashColor: PALETTE.orangeVivid,
        primary: false,
        cx: 0.36,
        cy: 0.37,
        r: 0.24,
      },
      {
        id: "scarf",
        label: "樱粉披肩飘带",
        kind: "poly",
        color: PALETTE.pink,
        dashColor: PALETTE.pink,
        primary: false,
        pts: [
          [0.54, 0.44],
          [0.98, 0.50],
          [1.06, 0.65],
          [0.56, 0.60],
        ],
      },
      {
        id: "torso",
        label: "深靛蓝人物躯干",
        kind: "poly",
        color: PALETTE.navy,
        dashColor: PALETTE.navy,
        primary: true,
        // 纯轮廓侧身肩胸与自然垂臂，无任何五官
        pts: [
          [0.51, 0.37],
          [0.64, 0.37],
          [0.77, 0.45],
          [0.83, 0.68],
          [0.80, 0.92],
          [0.37, 0.92],
          [0.39, 0.66],
          [0.44, 0.45],
        ],
      },
      {
        id: "head",
        label: "深松绿侧影头部",
        kind: "circle",
        color: PALETTE.green,
        dashColor: PALETTE.green,
        primary: true,
        cx: 0.57,
        cy: 0.255,
        r: 0.112,
      },
      {
        id: "bun",
        label: "侧影发髻",
        kind: "circle",
        color: PALETTE.green,
        dashColor: PALETTE.green,
        primary: false,
        cx: 0.665,
        cy: 0.215,
        r: 0.052,
      },
    ],
    anchors: [
      { id: "profile-head", label: "侧影头部与朝向", x: 0.56, y: 0.26, r: 0.06, required: true },
    ],
    joints: [
      { id: "neck", axis: "h", edge: "bottom", min: 0.352, max: 0.402, label: "颈部咽喉线", note: "底框线正好压在颈部最细处，观感像被生硬截断；应上移到发际/下颌，或果断下移到胸口中段。" },
      { id: "elbow", axis: "h", edge: "bottom", min: 0.635, max: 0.690, label: "肘关节线", note: "底框线压在肘弯关节转折处，会让手臂显得僵硬断节；应切在大臂中段或小臂中段。" },
      { id: "crown", axis: "h", edge: "top", min: 0.135, max: 0.168, label: "头顶擦皮线", note: "顶框线只削掉发顶一丁点边皮，像不小心拍歪了；要么留出呼吸空间，要么干脆大胆切入发冠 18% 以上。" },
    ],
    // 开场 0/4 错态：底边精准切中肘关节 + 顶边擦头顶 + 整体未有效破框
    initial: { x: 0.115, y: 0.148, w: 0.98, h: 0.515 },
    presets: {
      classic: { label: "胸上近景经典解", ratio: "poster", frame: { x: 0.24, y: 0.06, w: 0.68, h: 0.49 } },
      bold: { label: "切发冠强特写解", ratio: "poster", frame: { x: 0.25, y: 0.195, w: 0.64, h: 0.435 } },
      cinema: { label: "16:9 侧望宽幅解", ratio: "cinema", frame: { x: 0.18, y: 0.08, w: 0.84, h: 0.472 } },
      errFull: { label: "试错：远景全框", ratio: "free", frame: { x: 0.08, y: 0.06, w: 1.08, h: 0.91 } },
      errOver: { label: "试错：切丢头部", ratio: "poster", frame: { x: 0.34, y: 0.37, w: 0.52, h: 0.39 } },
      errTangent: { label: "试错：切中肘关节", ratio: "free", frame: { x: 0.115, y: 0.148, w: 0.98, h: 0.515 } },
    },
  },

  arch: {
    id: "arch",
    name: "建筑拱廊 · 画外延展",
    short: "建筑拱廊",
    subtitle: "前景巨柱破顶与远景拱洞光影，测试顶天憋死与纵深张力",
    bg: PALETTE.paper,
    shapes: [
      {
        id: "sun",
        label: "远空朱橘高阳",
        kind: "circle",
        color: PALETTE.orange,
        dashColor: PALETTE.orangeVivid,
        primary: false,
        cx: 0.84,
        cy: 0.31,
        r: 0.165,
      },
      {
        id: "wall",
        label: "深靛蓝拱廊阴影壁",
        kind: "poly",
        color: PALETTE.navy,
        dashColor: PALETTE.navy,
        primary: true,
        pts: [
          [0.44, 0.24],
          [1.06, 0.24],
          [1.06, 0.82],
          [0.86, 0.82],
          [0.86, 0.52],
          [0.83, 0.43],
          [0.75, 0.38],
          [0.67, 0.43],
          [0.64, 0.52],
          [0.64, 0.82],
          [0.44, 0.82],
        ],
      },
      {
        id: "pillar",
        label: "深松绿前景巨柱",
        kind: "rect",
        color: PALETTE.green,
        dashColor: PALETTE.green,
        primary: true,
        x: 0.17,
        y: 0.11,
        w: 0.23,
        h: 0.81,
      },
      {
        id: "steps",
        label: "樱粉阶梯前景",
        kind: "poly",
        color: PALETTE.pink,
        dashColor: PALETTE.pink,
        primary: false,
        pts: [
          [0.32, 0.78],
          [1.08, 0.78],
          [1.08, 0.93],
          [0.24, 0.93],
        ],
      },
    ],
    anchors: [
      { id: "arch-opening", label: "拱门光洞特征", x: 0.75, y: 0.56, r: 0.07, required: true },
    ],
    joints: [
      { id: "arch-apex", axis: "h", edge: "top", min: 0.222, max: 0.258, label: "廊檐顶边压切线", note: "顶框线几乎压死在拱廊檐口边缘，会产生“顶天憋死”的局促感；应向上留天空，或果断切入柱身与廊壁。" },
    ],
    initial: { x: 0.155, y: 0.232, w: 0.94, h: 0.71 },
    presets: {
      classic: { label: "巨柱破顶经典解", ratio: "poster", frame: { x: 0.25, y: 0.19, w: 0.72, h: 0.54 } },
      bold: { label: "极窄纵深穿框解", ratio: "vertical", frame: { x: 0.32, y: 0.17, w: 0.51, h: 0.68 } },
      cinema: { label: "16:9 建筑宽银幕解", ratio: "cinema", frame: { x: 0.25, y: 0.30, w: 0.71, h: 0.40 } },
      errFull: { label: "试错：全盒装入", ratio: "free", frame: { x: 0.08, y: 0.05, w: 1.09, h: 0.92 } },
      errOver: { label: "试错：砍丢拱洞", ratio: "poster", frame: { x: 0.16, y: 0.30, w: 0.44, h: 0.33 } },
      errTangent: { label: "试错：顶边压廊檐", ratio: "free", frame: { x: 0.155, y: 0.232, w: 0.94, h: 0.71 } },
    },
  },
};

export function clampFrame(f) {
  const minW = 0.24;
  const minH = 0.20;
  const w = Math.max(minW, Math.min(WORLD_W - 0.04, f.w));
  const h = Math.max(minH, Math.min(WORLD_H - 0.04, f.h));
  const x = Math.max(0.02, Math.min(WORLD_W - 0.02 - w, f.x));
  const y = Math.max(0.02, Math.min(WORLD_H - 0.02 - h, f.y));
  return { x, y, w, h };
}

export function createInitialState(sceneId = "poster") {
  const sc = SCENES[sceneId] || SCENES.poster;
  return {
    scene: sc.id,
    ratio: "free",
    frame: clampFrame({ ...sc.initial }),
    showXray: false,
  };
}

// 用中心锚定方式按画幅比例调整取景框
export function applyRatio(frame, ratioId) {
  const r = RATIOS[ratioId];
  if (!r || !r.aspect) return clampFrame(frame);
  const cx = frame.x + frame.w / 2;
  const cy = frame.y + frame.h / 2;
  const area = frame.w * frame.h;
  let w = Math.sqrt(area * r.aspect);
  let h = w / r.aspect;
  if (w > WORLD_W - 0.08) {
    w = WORLD_W - 0.08;
    h = w / r.aspect;
  }
  if (h > WORLD_H - 0.08) {
    h = WORLD_H - 0.08;
    w = h * r.aspect;
  }
  return clampFrame({ x: cx - w / 2, y: cy - h / 2, w, h });
}

// 统一缩放取景框（scale = 1 对应基准大小，越大取景越紧、裁切越深）
export function scaleFrameToZoom(frame, zoomPct, ratioId) {
  // zoomPct: 0（最大框，约 1.12×0.88）到 100（最紧框，约 0.36×0.27）
  const t = Math.max(0, Math.min(1, zoomPct / 100));
  const cx = frame.x + frame.w / 2;
  const cy = frame.y + frame.h / 2;
  const aspect = RATIOS[ratioId]?.aspect || frame.w / frame.h;
  const maxDiag = 1.38;
  const minDiag = 0.44;
  const diag = maxDiag - t * (maxDiag - minDiag);
  const h = diag / Math.hypot(aspect, 1);
  const w = h * aspect;
  return clampFrame({ x: cx - w / 2, y: cy - h / 2, w, h });
}

export function getZoomPct(frame) {
  const diag = Math.hypot(frame.w, frame.h);
  const maxDiag = 1.38;
  const minDiag = 0.44;
  return Math.round(Math.max(0, Math.min(100, ((maxDiag - diag) / (maxDiag - minDiag)) * 100)));
}

// 解析单形状与取景框的真实面积交集、切边和擦边状态
function analyzeShape(s, f) {
  const b = shapeBounds(s);
  const bw = b.x1 - b.x0;
  const bh = b.y1 - b.y0;
  const gx = 16;
  const gy = 16;
  let totalPts = 0;
  let insidePts = 0;
  let sumX = 0;
  let sumY = 0;
  const cellArea = (bw / gx) * (bh / gy);

  for (let iy = 0; iy < gy; iy++) {
    const py = b.y0 + ((iy + 0.5) / gy) * bh;
    for (let ix = 0; ix < gx; ix++) {
      const px = b.x0 + ((ix + 0.5) / gx) * bw;
      if (!pointInShape(px, py, s)) continue;
      totalPts++;
      if (px >= f.x && px <= f.x + f.w && py >= f.y && py <= f.y + f.h) {
        insidePts++;
        sumX += px;
        sumY += py;
      }
    }
  }

  const totalArea = totalPts * cellArea;
  const insideArea = insidePts * cellArea;
  const visibleRatio = totalPts ? insidePts / totalPts : 0;
  const croppedRatio = 1 - visibleRatio;

  // 仅当形状确实与框有交集时，检查四条边是「干脆切穿」还是「擦边/削薄皮」
  const fx0 = f.x, fy0 = f.y, fx1 = f.x + f.w, fy1 = f.y + f.h;
  const overlapsX = b.x1 > fx0 && b.x0 < fx1;
  const overlapsY = b.y1 > fy0 && b.y0 < fy1;

  const cutEdges = [];
  let tangent = null;

  // 距离阈值：内侧紧贴 < 3.6% 框尺寸，或外侧削薄皮 < 6.5% 形体跨度
  const innerGapTolX = f.w * 0.038;
  const innerGapTolY = f.h * 0.040;
  const skimRatio = 0.072;

  const checkEdge = (edgeName, shapeEdge, frameEdge, span, innerTol, isLowEdge, orthoOverlap) => {
    if (!orthoOverlap || visibleRatio < 0.04) return;
    // isLowEdge: left/top 时，shapeEdge < frameEdge 表示破框裁出；shapeEdge > frameEdge 表示留在框内
    const outsideDepth = isLowEdge ? frameEdge - shapeEdge : shapeEdge - frameEdge;
    if (outsideDepth > 0) {
      const frac = outsideDepth / span;
      if (frac >= skimRatio) {
        cutEdges.push(edgeName);
      } else if (frac >= 0.005) {
        // 削薄皮擦边
        const pctDist = Math.round(frac * 100);
        if (!tangent || pctDist < tangent.distPct) {
          tangent = {
            kind: "skim",
            edge: edgeName,
            shapeId: s.id,
            shapeLabel: s.label,
            distPct: Math.max(1, pctDist),
            pos: edgePoint(edgeName, b, f),
          };
        }
      }
    } else {
      const gap = -outsideDepth;
      if (gap > 0.0005 && gap <= innerTol) {
        const refDim = edgeName === "left" || edgeName === "right" ? f.w : f.h;
        const distPct = Math.max(1, Math.round((gap / refDim) * 100));
        if (!tangent || distPct < tangent.distPct) {
          tangent = {
            kind: "kiss",
            edge: edgeName,
            shapeId: s.id,
            shapeLabel: s.label,
            distPct,
            pos: edgePoint(edgeName, b, f),
          };
        }
      }
    }
  };

  checkEdge("left", b.x0, fx0, bw, innerGapTolX, true, overlapsY);
  checkEdge("right", b.x1, fx1, bw, innerGapTolX, false, overlapsY);
  checkEdge("top", b.y0, fy0, bh, innerGapTolY, true, overlapsX);
  checkEdge("bottom", b.y1, fy1, bh, innerGapTolY, false, overlapsX);

  return {
    id: s.id,
    label: s.label,
    primary: !!s.primary,
    totalArea,
    insideArea,
    visibleRatio,
    croppedRatio,
    cutEdges,
    tangent,
    centroid: insidePts ? { x: sumX / insidePts, y: sumY / insidePts } : null,
  };
}

function edgePoint(edge, b, f) {
  const cx = Math.max(f.x + 0.05, Math.min(f.x + f.w - 0.05, (b.x0 + b.x1) / 2));
  const cy = Math.max(f.y + 0.05, Math.min(f.y + f.h - 0.05, (b.y0 + b.y1) / 2));
  if (edge === "left") return { x: f.x, y: cy };
  if (edge === "right") return { x: f.x + f.w, y: cy };
  if (edge === "top") return { x: cx, y: f.y };
  return { x: cx, y: f.y + f.h };
}

const EDGE_ZH = { left: "左框边", right: "右框边", top: "上框边", bottom: "下框边" };

// 核心单真源评估函数
export function evaluate(state) {
  const sc = SCENES[state.scene] || SCENES.poster;
  const f = clampFrame(state.frame);
  const frameArea = f.w * f.h;

  // 1. 分析每个形状
  const shapes = sc.shapes.map((s) => analyzeShape(s, f));

  // 2. 实算画框内总覆盖率（避免重叠形状重复计数）与画面视觉重心
  const fxGrid = 24;
  const fyGrid = 18;
  let filledCells = 0;
  let massX = 0;
  let massY = 0;
  for (let iy = 0; iy < fyGrid; iy++) {
    const py = f.y + ((iy + 0.5) / fyGrid) * f.h;
    for (let ix = 0; ix < fxGrid; ix++) {
      const px = f.x + ((ix + 0.5) / fxGrid) * f.w;
      let hit = false;
      for (let k = 0; k < sc.shapes.length; k++) {
        if (pointInShape(px, py, sc.shapes[k])) {
          hit = true;
          break;
        }
      }
      if (hit) {
        filledCells++;
        massX += (px - f.x) / f.w;
        massY += (py - f.y) / f.h;
      }
    }
  }
  const fillRatio = filledCells / (fxGrid * fyGrid);
  const centroid = filledCells ? { u: massX / filledCells, v: massY / filledCells } : { u: 0.5, v: 0.5 };
  const centerDist = Math.hypot(centroid.u - 0.5, centroid.v - 0.5);

  // 3. 汇总破框边、核心主角指标、画外延伸总比
  const brokenEdgeSet = new Set();
  let primaryTotal = 0;
  let primaryInside = 0;
  let primaryCutCount = 0;
  let allTotal = 0;
  let allCropped = 0;
  const tangents = [];

  for (const sh of shapes) {
    for (const e of sh.cutEdges) brokenEdgeSet.add(e);
    allTotal += sh.totalArea;
    if (sh.visibleRatio > 0.05) {
      allCropped += sh.totalArea - sh.insideArea;
    }
    if (sh.primary) {
      primaryTotal += sh.totalArea;
      primaryInside += sh.insideArea;
      primaryCutCount += sh.cutEdges.length;
    }
    if (sh.tangent) tangents.push(sh.tangent);
  }

  const brokenEdges = [...brokenEdgeSet];
  const primaryVisibleRatio = primaryTotal > 0 ? primaryInside / primaryTotal : 0;
  const primaryFrameShare = frameArea > 0 ? primaryInside / frameArea : 0;
  const offCanvasRatio = allTotal > 0 ? allCropped / allTotal : 0;

  // 4. 检查识别锚点是否仍在画框内部保留
  let anchorLost = null;
  for (const a of sc.anchors) {
    const inside = a.x >= f.x + 0.015 && a.x <= f.x + f.w - 0.015 && a.y >= f.y + 0.015 && a.y <= f.y + f.h - 0.015;
    if (a.required && !inside) {
      anchorLost = a;
      break;
    }
  }

  // 5. 检查人物关节或建筑结构死穴误切
  let jointHit = null;
  for (const j of sc.joints) {
    const edgeVal = j.edge === "bottom" ? f.y + f.h : j.edge === "top" ? f.y : j.edge === "left" ? f.x : f.x + f.w;
    if (edgeVal >= j.min && edgeVal <= j.max) {
      // 确认横向上确实穿过主体
      if (f.x < 0.72 && f.x + f.w > 0.42) {
        jointHit = { ...j, edgeVal };
        break;
      }
    }
  }

  // 6. 最优先擦边（优先报核心主角的擦边）
  tangents.sort((a, b) => {
    const ap = sc.shapes.find((s) => s.id === a.shapeId)?.primary ? 0 : 1;
    const bp = sc.shapes.find((s) => s.id === b.shapeId)?.primary ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.distPct - b.distPct;
  });
  const worstTangent = tangents[0] || null;

  // 7. 分类双向错态与四项达标
  const isEmpty = fillRatio < 0.24 || primaryVisibleRatio < 0.14;
  const isSuffocated = fillRatio > 0.91;
  const isOvercrop = !isEmpty && (primaryVisibleRatio < 0.36 || !!anchorLost);
  const isNoCrop = brokenEdges.length === 0;
  const isSingleWeak = !isNoCrop && (brokenEdges.length < 2 || primaryFrameShare < 0.16 || primaryVisibleRatio > 0.93);

  const checks = {
    framing: !isEmpty && !isSuffocated && !jointHit && !worstTangent && brokenEdges.length >= 2,
    truncation: !isEmpty && !isOvercrop && !worstTangent && primaryVisibleRatio >= 0.36 && primaryVisibleRatio <= 0.86 && (primaryCutCount >= 1 || brokenEdges.length >= 2),
    tension: !isEmpty && !isSuffocated && !isOvercrop && fillRatio >= 0.34 && fillRatio <= 0.89 && primaryFrameShare >= 0.17 && brokenEdges.length >= 2,
    offCanvas: !isEmpty && !isOvercrop && !isNoCrop && offCanvasRatio >= 0.14 && brokenEdges.length >= 2,
  };

  const passCount = Object.values(checks).filter(Boolean).length;

  let code = "ok";
  let badge = "4/4 · 裁切成立";
  let headline = "破框果断，画外空间被顺势点亮";
  let body = "";
  let tip = "可以继续拖动取景框四边或切到 16:9 / 人物侧影，探索另一组合法裁切解。";
  let tensionTier = "强劲破框（示意）";

  if (isEmpty) {
    code = "empty_frame";
    badge = `${passCount}/4 · 取景跑偏`;
    headline = `主体落到画框外，框内实形仅占 ${Math.round(fillRatio * 100)}%`;
    body = "裁切构图的前提是把主角拉近放大，而不是把主角整个丢出画面。眼下画框大片空置，观者找不到视觉锚点，也无从补完画外空间。";
    tip = "直接按住取景框内部把它拖回主体群上，让核心主体回到框内 40%–75% 留存区。";
    tensionTier = "空窗失焦（示意）";
  } else if (isSuffocated) {
    code = "suffocated";
    badge = `${passCount}/4 · 四边闷死`;
    headline = `实形塞满 ${Math.round(fillRatio * 100)}%，画面喘不过气`;
    body = "取景框缩得太死，连一点图底反差和留白呼吸口都没留下。此刻已经越过「裁切构图」进入纯色块肌理，失去轮廓对比与画外延展方向。";
    tip = "向外拉宽任意两条取景框边，或向左轻拖裁切倍率，把覆盖率退回 40%–84% 之间。";
    tensionTier = "过满窒息（示意）";
  } else if (isOvercrop) {
    code = "overcrop";
    badge = `${passCount}/4 · 过切失认`;
    headline = anchorLost
      ? `关键特征「${anchorLost.label}」被切丢，左侧成片难以辨认`
      : `核心主体只剩 ${Math.round(primaryVisibleRatio * 100)}%，大脑补不回原形`;
    body = "裁切靠的是格式塔闭合律——必须在框内留住足够一眼认出物象的特征锚点与弧段。切掉超过六成后，左侧成品窗只剩陌生色块，观者不再想象画外，只会疑惑这是什么。";
    tip = "向外拉松被切过头的框边，把核心主体留存率拉回 38%–78% 之间并守住特征锚点。";
    tensionTier = "过切失认（示意）";
  } else if (jointHit) {
    code = "joint_cut";
    badge = `${passCount}/4 · 误切死穴`;
    headline = `${EDGE_ZH[jointHit.edge]}压中「${jointHit.label}」`;
    body = jointHit.note;
    tip = `上下微调${EDGE_ZH[jointHit.edge]}避开红色禁忌线，再确认至少有两条框边干脆破框。`;
    tensionTier = "刀口别扭（示意）";
  } else if (isNoCrop && worstTangent) {
    code = "none";
    badge = `${passCount}/4 · 全包擦边`;
    headline = `0 条边破框，且「${worstTangent.shapeLabel}」距${EDGE_ZH[worstTangent.edge]}仅擦边 ${worstTangent.distPct}%`;
    body = "这是初学构图最常见的双重败笔：一方面胆怯地把所有形体全关在画框盒子内，画外延伸归零；另一方面形体边缘紧贴框线，在左侧成品窗里显得局促、像没对齐。";
    tip = "向右横拖画布（或直接往里拽取景框的左上 L 形角标），干脆地切掉朱橘大圆与松绿柱的一截。";
    tensionTier = "封闭发紧（示意）";
  } else if (isNoCrop) {
    code = "none";
    badge = `${passCount}/4 · 胆怯全包`;
    headline = "0 条边切出画外，画面像关在盒子里的标本";
    body = "四个形体全完整缩在取景框里，框外一条虚线都没有。画框此刻只起到「装东西的边框」作用，视距被拉远，左侧成品窗平淡安静，缺乏裁切构图特有的张力。";
    tip = "向右横拖画布推进取景倍率，或直接向内拉动取景框的边角，果断切开至少两条画框边。";
    tensionTier = "平淡封闭（示意）";
  } else if (worstTangent) {
    code = "tangent";
    badge = `${passCount}/4 · 擦边陷阱`;
    headline = worstTangent.kind === "skim"
      ? `${EDGE_ZH[worstTangent.edge]}只削掉「${worstTangent.shapeLabel}」约 ${worstTangent.distPct}% 薄皮`
      : `「${worstTangent.shapeLabel}」离${EDGE_ZH[worstTangent.edge]}仅剩 ${worstTangent.distPct}% 尴尬细缝`;
    body = worstTangent.kind === "skim"
      ? "只切掉极薄的一层边皮，在观者眼里不像有意裁切，倒像排版时不小心溢出了画布。裁切铁律是：要么干脆留足呼吸距，要么大胆切掉至少 10% 以上。"
      : "边缘差一点点就要碰到画框却没切下去，会制造强烈的视觉相切（Tangent）刺眼感，把人的目光死死黏在尴尬缝隙上。";
    tip = `拉动${EDGE_ZH[worstTangent.edge]}：往里推进切过 10%，或往外退开留足安全呼吸距。`;
    tensionTier = "擦边发紧（示意）";
  } else if (isSingleWeak || passCount < 4) {
    code = "weak_tension";
    badge = `${passCount}/4 · 张力偏弱`;
    headline = brokenEdges.length < 2
      ? `仅切开 ${brokenEdges.length} 条框边，画外空间还没撑开`
      : `画外延伸仅 ${Math.round(offCanvasRatio * 100)}%，主角体量还不够逼近`;
    body = "单边浅浅擦过一刀时，画面依然偏保守，主体离镜头还是太远。把取景框再推进一些、让至少两条框边果断切穿主体，左侧成品窗的体量压迫感与画外想象会立刻跃升。";
    tip = "向右轻拖裁切倍率，或拉紧一条相邻的取景框边，让画外延伸升过 16%、破框边数达到 2 条以上。";
    tensionTier = "蓄势偏弱（示意）";
  } else {
    code = "ok";
    badge = "4/4 · 裁切成立";
    const cutList = brokenEdges.map((e) => EDGE_ZH[e].replace("框边", "")).join(" / ");
    headline = `果断破框 ${brokenEdges.length} 条边（${cutList}），画外空间自然延展`;
    body = `核心主体在框内保留 ${Math.round(primaryVisibleRatio * 100)}%，既留住了完整识别线索，又把 ${Math.round(offCanvasRatio * 100)}% 的体量交给了框外虚线世界。看旁边的暗房成品窗：去掉虚线后，大脑仍会自动把被截断的形体往画外补全。`;
    tip = "试着点成品窗右上角的「透视画外」，或切换其他题材与 16:9 电影画幅体验多组合法解。";
    tensionTier = primaryVisibleRatio < 0.56 ? "强张力特写（示意）" : "均衡破框（示意）";
  }

  return {
    scene: sc,
    frame: f,
    shapes,
    fillRatio,
    centroid,
    centerDist,
    brokenEdges,
    primaryVisibleRatio,
    primaryFrameShare,
    offCanvasRatio,
    anchorLost,
    jointHit,
    worstTangent,
    tangents,
    checks,
    passCount,
    ok: code === "ok",
    code,
    badge,
    headline,
    body,
    tip,
    tensionTier,
    zoomPct: getZoomPct(f),
  };
}
