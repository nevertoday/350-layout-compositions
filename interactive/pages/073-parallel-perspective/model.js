// 073 平行透视构图 · 单一 3D 针孔与移轴投影引擎
// 全局状态只存 { yawDeg, shiftNorm }，开场画布、三项实时读数、任务判定与诊断文案全部出自同一次投影。

export const YAW_MIN = -24;
export const YAW_MAX = 24;

// 开场故意停在 +15° 偏转且门楼偏中右，题字已明显变形、右墙局促，绝不先给答案。
export const INITIAL_STATE = Object.freeze({
  yawDeg: 15,
  shiftNorm: 0.22,
});

// 世界坐标建筑参数（单位：米，Y 向上，Z 向前，视平线固定在 Y = 0）
export const WORLD = Object.freeze({
  roadHalfW: 3.35,
  sidewalkW: 0.72,
  yGround: -1.78,
  yRoof: 3.35,
  zNear: 1.05,
  zGate: 7.95,
  gateArchHalfW: 1.38,
  gateArchTopY: 0.50,
  gateTopY: 3.25,
  // 门楼题字匾额（位于门洞正上方、视平线以上，390px 窄屏也能一眼辨清斜直）
  plaqueZ: 7.86,
  plaqueHalfW: 2.60,
  plaqueBotY: 0.76,
  plaqueTopY: 2.90,
  // 两侧建筑立面分段深度（从近到远）
  bayZs: [1.05, 1.98, 3.05, 4.25, 5.55, 6.85, 7.95],
  // 每段楼顶微小高低错落（保持正面横檐水平、增加真实街道层次）
  leftRoofYs: [3.55, 3.28, 3.44, 3.16, 3.34, 3.08],
  rightRoofYs: [3.52, 3.32, 3.46, 3.20, 3.36, 3.12],
});

// 目标任务阈值（仅用于结果判定，画布绝不加 0° 刻度或磁吸）
export const MISSION = Object.freeze({
  maxParallelYaw: 1.35,
  gateTargetMinU: 0.24,
  gateTargetMaxU: 0.40,
  minRightWallPct: 24,
});

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一焦距策略：
// 1440 下 ~2.4:1 宽画布由 H*0.96 主导，保证楼群高耸、门楼饱满不压扁；
// 390 窄屏由 W*0.56 主导，保证左右建筑立面与门楼匾额同时清楚落入画幅。
export function focalLength(W, H) {
  return Math.min(W * 0.56, H * 0.96);
}

// 限制 shiftNorm，使橙点（主消失点）始终位于画框可触控区内
export function clampShiftForYaw(shiftNorm, yawDeg, W, H) {
  const f = focalLength(W, H);
  const tanY = Math.tan((yawDeg * Math.PI) / 180);
  const vpOffsetNorm = (f * tanY) / Math.max(1, W);
  // vp1U = 0.5 + shiftNorm - vpOffsetNorm ∈ [0.14, 0.86]
  const lo = 0.14 - 0.5 + vpOffsetNorm;
  const hi = 0.86 - 0.5 + vpOffsetNorm;
  return clamp(shiftNorm, lo, hi);
}

// Sutherland-Hodgman 视口矩形裁切，精确计算右墙在画框内的可见投影面积
function clipPolyToRect(pts, W, H) {
  const edges = [
    {
      inside: (p) => p.x >= 0,
      intersect: (a, b) => {
        const t = (0 - a.x) / (b.x - a.x || 1e-9);
        return { x: 0, y: a.y + (b.y - a.y) * t };
      },
    },
    {
      inside: (p) => p.x <= W,
      intersect: (a, b) => {
        const t = (W - a.x) / (b.x - a.x || 1e-9);
        return { x: W, y: a.y + (b.y - a.y) * t };
      },
    },
    {
      inside: (p) => p.y >= 0,
      intersect: (a, b) => {
        const t = (0 - a.y) / (b.y - a.y || 1e-9);
        return { x: a.x + (b.x - a.x) * t, y: 0 };
      },
    },
    {
      inside: (p) => p.y <= H,
      intersect: (a, b) => {
        const t = (H - a.y) / (b.y - a.y || 1e-9);
        return { x: a.x + (b.x - a.x) * t, y: H };
      },
    },
  ];
  let out = pts.slice();
  for (const edge of edges) {
    if (out.length < 3) return [];
    const next = [];
    for (let i = 0; i < out.length; i++) {
      const prev = out[(i + out.length - 1) % out.length];
      const curr = out[i];
      const inPrev = edge.inside(prev);
      const inCurr = edge.inside(curr);
      if (inCurr) {
        if (!inPrev) next.push(edge.intersect(prev, curr));
        next.push(curr);
      } else if (inPrev) {
        next.push(edge.intersect(prev, curr));
      }
    }
    out = next;
  }
  return out;
}

function polygonArea(pts) {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) * 0.5;
}

// 核心单源投影：所有绘制点与三项实测读数均由此函数一次产出
export function projectScene(state, W, H) {
  const safeW = Math.max(120, W);
  const safeH = Math.max(120, H);
  const yawDeg = clamp(state.yawDeg, YAW_MIN, YAW_MAX);
  const shiftNorm = clampShiftForYaw(state.shiftNorm, yawDeg, safeW, safeH);
  const yawRad = (yawDeg * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const tanY = Math.tan(yawRad);

  const f = focalLength(safeW, safeH);
  const cx = (0.5 + shiftNorm) * safeW; // 移轴光学中心 X
  const cy = 0.50 * safeH;              // 固定中视平线

  // 世界坐标 → 2D 像素坐标（严格针孔 + 移轴平移，Pitch 恒为 0）
  function project(x, y, z) {
    const xc = x * cosY - z * sinY;
    const zc = x * sinY + z * cosY;
    const safeZ = Math.max(0.18, zc);
    return {
      x: cx + f * (xc / safeZ),
      y: cy - f * (y / safeZ),
      z: zc,
    };
  }

  // 主消失点 VP1（Z 轴平行线无穷远点）
  const vp1 = {
    x: cx - f * tanY,
    y: cy,
    u: (cx - f * tanY) / safeW,
  };

  // 第二消失点 VP2（X 轴平行线无穷远点，按 f / tan(yaw) 精确计算）
  const absYaw = Math.abs(yawDeg);
  const isExactZero = absYaw < 0.05;
  const vp2OffsetPx = isExactZero ? Infinity : f / tanY; // 相对光学中心 cx 的偏移
  const vp2 = {
    x: isExactZero ? Infinity : cx + vp2OffsetPx,
    y: cy,
    isInfinity: isExactZero,
    // 距画心几倍画宽（严格按 |f / tan(yaw)| / W 实算）
    distMultW: isExactZero ? Infinity : Math.abs(vp2OffsetPx) / safeW,
    side: yawDeg > 0 ? "right" : yawDeg < 0 ? "left" : "none",
  };

  // 尽头门楼主体与题字牌匾四顶点
  const { roadHalfW, yGround, zGate, gateArchHalfW, gateArchTopY, gateTopY } = WORLD;
  const { plaqueZ, plaqueHalfW, plaqueBotY, plaqueTopY } = WORLD;

  const plaque = {
    tl: project(-plaqueHalfW, plaqueTopY, plaqueZ),
    tr: project(plaqueHalfW, plaqueTopY, plaqueZ),
    bl: project(-plaqueHalfW, plaqueBotY, plaqueZ),
    br: project(plaqueHalfW, plaqueBotY, plaqueZ),
  };

  // 读数 1：题字左右边高比与上沿倾角（由同一组四顶点实算，转正前后变化幅度大且直观）
  const topLenPx = Math.hypot(plaque.tr.x - plaque.tl.x, plaque.tr.y - plaque.tl.y);
  const botLenPx = Math.hypot(plaque.br.x - plaque.bl.x, plaque.br.y - plaque.bl.y);
  const edgeLengthRatio = botLenPx > 1e-4 ? topLenPx / botLenPx : 1;
  const leftEdgeH = Math.abs(plaque.bl.y - plaque.tl.y);
  const rightEdgeH = Math.abs(plaque.br.y - plaque.tr.y);
  const sideHeightRatio = rightEdgeH > 1e-4 ? leftEdgeH / rightEdgeH : 1;
  const sideHeightDiffPct =
    leftEdgeH > 1e-4 && rightEdgeH > 1e-4
      ? Math.round((Math.max(leftEdgeH / rightEdgeH, rightEdgeH / leftEdgeH) - 1) * 100)
      : 0;
  const topTiltDeg = (Math.atan2(plaque.tr.y - plaque.tl.y, plaque.tr.x - plaque.tl.x) * 180) / Math.PI;

  const gateCenterX = 0.5 * (plaque.tl.x + plaque.tr.x);
  const gateCenterU = gateCenterX / safeW;

  // 门楼立面结构
  const gateFrame = {
    tl: project(-roadHalfW, gateTopY, zGate),
    tr: project(roadHalfW, gateTopY, zGate),
    bl: project(-roadHalfW, yGround, zGate),
    br: project(roadHalfW, yGround, zGate),
    archTL: project(-gateArchHalfW, gateArchTopY, zGate),
    archTR: project(gateArchHalfW, gateArchTopY, zGate),
    archBL: project(-gateArchHalfW, yGround, zGate),
    archBR: project(gateArchHalfW, yGround, zGate),
    // 门洞纵深厚度（透出后方晴空）
    archBackTL: project(-gateArchHalfW, gateArchTopY, zGate + 1.35),
    archBackTR: project(gateArchHalfW, gateArchTopY, zGate + 1.35),
    archBackBL: project(-gateArchHalfW, yGround, zGate + 1.35),
    archBackBR: project(gateArchHalfW, yGround, zGate + 1.35),
  };

  // 左右两侧楼群分跨面片（近到远）
  const leftBays = [];
  const rightBays = [];
  const zs = WORLD.bayZs;
  for (let i = 0; i < zs.length - 1; i++) {
    const z0 = zs[i];
    const z1 = zs[i + 1];
    const ly = WORLD.leftRoofYs[i];
    const ry = WORLD.rightRoofYs[i];
    leftBays.push({
      i,
      z0,
      z1,
      roofY: ly,
      ntl: project(-roadHalfW, ly, z0),
      ntr: project(-roadHalfW, ly, z1),
      nbl: project(-roadHalfW, yGround, z0),
      nbr: project(-roadHalfW, yGround, z1),
    });
    rightBays.push({
      i,
      z0,
      z1,
      roofY: ry,
      ntl: project(roadHalfW, ry, z0),
      ntr: project(roadHalfW, ry, z1),
      nbl: project(roadHalfW, yGround, z0),
      nbr: project(roadHalfW, yGround, z1),
    });
  }

  // 读数 3：右墙可排字面积（右侧连续建筑立面经视口精确裁切后的投影面积占整幅画布百分比）
  // 使用近到远每一段真实立面合并求面积（因单调沿 Z 排列互不重叠，可直接累加）
  let rightWallClippedArea = 0;
  for (const bay of rightBays) {
    const clipped = clipPolyToRect([bay.ntl, bay.ntr, bay.nbr, bay.nbl], safeW, safeH);
    rightWallClippedArea += polygonArea(clipped);
  }
  const rightWallAreaPct = (rightWallClippedArea / (safeW * safeH)) * 100;

  // 右墙示范排字区（用于达标后在右墙实景展示可排字版位）
  const rightCopyZone = {
    tl: project(roadHalfW, 2.55, 2.05),
    tr: project(roadHalfW, 2.55, 5.45),
    bl: project(roadHalfW, -0.55, 2.05),
    br: project(roadHalfW, -0.55, 5.45),
  };

  // 路面、人行道与前景信号橙引导箭头（严格按 3D 路面投影）
  const road = {
    nearL: project(-roadHalfW, yGround, 0.75),
    nearR: project(roadHalfW, yGround, 0.75),
    farL: project(-roadHalfW, yGround, zGate + 1.35),
    farR: project(roadHalfW, yGround, zGate + 1.35),
    curbNearL: project(-(roadHalfW - WORLD.sidewalkW), yGround, 0.75),
    curbNearR: project(roadHalfW - WORLD.sidewalkW, yGround, 0.75),
    curbFarL: project(-(roadHalfW - WORLD.sidewalkW), yGround, zGate),
    curbFarR: project(roadHalfW - WORLD.sidewalkW, yGround, zGate),
    // 路面中央透视白虚线
    dashes: [
      [1.35, 1.92],
      [2.28, 2.86],
      [3.28, 3.88],
      [4.35, 4.98],
      [5.52, 6.18],
      [6.68, 7.30],
    ].map(([za, zb]) => ({
      tl: project(-0.075, yGround, zb),
      tr: project(0.075, yGround, zb),
      bl: project(-0.075, yGround, za),
      br: project(0.075, yGround, za),
    })),
    // 原海报同款前景信号橙引导三角（1440 与 390 全尺寸完整可见）
    arrow: {
      tip: project(0, yGround, 4.35),
      left: project(-0.74, yGround, 2.95),
      right: project(0.74, yGround, 2.95),
    },
  };

  // 任务状态评估（无任何 0° 刻度或吸附，纯几何实判）
  const isParallel = absYaw <= MISSION.maxParallelYaw;
  const isGateLeftThird =
    gateCenterU >= MISSION.gateTargetMinU && gateCenterU <= MISSION.gateTargetMaxU;
  const isRightWallOpen = rightWallAreaPct >= MISSION.minRightWallPct;
  const missionDone = isParallel && isGateLeftThird && isRightWallOpen;

  const diagnosis = buildDiagnosis({
    yawDeg,
    sideHeightDiffPct,
    gateCenterU,
    isParallel,
    isGateLeftThird,
    isRightWallOpen,
    missionDone,
  });

  return {
    W: safeW,
    H: safeH,
    f,
    cx,
    cy,
    yawDeg,
    shiftNorm,
    project,
    vp1,
    vp2,
    plaque,
    gateFrame,
    leftBays,
    rightBays,
    rightCopyZone,
    road,
    metrics: {
      edgeLengthRatio,
      sideHeightRatio,
      sideHeightDiffPct,
      topTiltDeg,
      vp2DistMultW: vp2.distMultW,
      vp2IsInfinity: vp2.isInfinity,
      rightWallAreaPct,
      gateCenterU,
    },
    status: {
      isParallel,
      isGateLeftThird,
      isRightWallOpen,
      missionDone,
    },
    diagnosis,
  };
}

function buildDiagnosis({
  yawDeg,
  sideHeightDiffPct,
  gateCenterU,
  isParallel,
  isGateLeftThird,
  isRightWallOpen,
  missionDone,
}) {
  const nearSide = yawDeg >= 0 ? "左边" : "右边";
  const farSide = yawDeg >= 0 ? "右边" : "左边";
  const diffPct = Math.max(1, sideHeightDiffPct);

  if (missionDone) {
    return {
      code: "done",
      badge: "任务达成 · 平行移轴展墙",
      headline: "门楼左右等距方正，右侧建筑墙面已完全腾出",
      body: "正立面与画框平行，门楼左右两端离镜头一样远，所以四边方正、不再产生第二消失点；再靠移轴（镜头平移）把主点与门楼一并让到左侧 1/3，右墙自然大片敞开——平行透视不必死守居中。",
    };
  }

  if (!isParallel && isGateLeftThird && isRightWallOpen) {
    return {
      code: "shifted-skew",
      badge: "位置对了 · 机头仍歪",
      headline: "门楼已到左 1/3，但正面仍在斜向变梯形",
      body: `移轴（镜头平移）只移动成像框、不改机身朝向——现在门楼${nearSide}比${farSide}近，所以${nearSide}高出 ${diffPct}%、正面成了梯形。按住画框左右缘把机头转正即可。`,
    };
  }

  if (isParallel && (!isGateLeftThird || !isRightWallOpen)) {
    const dir = gateCenterU > MISSION.gateTargetMaxU ? "往左" : "往右";
    return {
      code: "parallel-misplaced",
      badge: "题字已方正 · 待移轴让位",
      headline: `门楼左右已等距拉平，再拖橙点${dir}移轴展开右墙`,
      body: `正立面已经平行画框，门楼左右离镜头等远，题字四角回到方正、第二消失点退散到无穷远；只是门楼还没落到左侧 1/3，右墙偏窄。直接拖住橙点${dir}移轴（镜头平移），不转头就能把右墙让出来。`,
    };
  }

  // 默认 / 既偏斜又未到位
  const turnHint = yawDeg > 0 ? "向左拖画框边缘转正" : "向右拖画框边缘转正";
  return {
    code: "skewed",
    badge: "机头偏斜 · 滑向两点透视",
    headline: "门楼正面成了梯形，右侧墙面也被挤窄",
    body: `机头一偏，门楼${nearSide}比${farSide}近，所以${nearSide}高出 ${diffPct}%、正面成了梯形，第二消失点也闯进画外；同时门楼偏在一侧挤窄了右墙。先${turnHint}，再拖橙点移轴（镜头平移）到左 1/3。`,
  };
}
