// 086 深空间构图 · 单一真源空间几何与光学核算引擎
// Three.js 3D 舞台、2D 透视降级引擎、Z 轴纵剖标尺、四圆徽探针与诊单全部共用此模型。

export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报·青门长廊",
    shortName: "青门长廊",
    en: "TEAL PORTAL CORRIDOR",
    archShape: "rect",
    bgHex: "#F4E6CF",
    skyTop: "#F6EBDA",
    skyHorizon: "#EFE2CE",
    fogHex: "#EAE1D1",
    floorLight: "#F7DFC3",
    floorTile: "#E5C9A8",
    stairDark: "#122B2B",
    stairMid: "#234947",
    portalPalette: ["#1E3F3D", "#2E5653", "#50706B", "#7B8E86", "#9AA59D"],
    portalBevel: ["#C7BDAA", "#A9B0A4", "#BFC3B8", "#D0D2C8", "#DCDCD2"],
    foliageHex: "#0E2221",
    foliageAccent: "#1B3B38",
    mountainPalette: ["#A3ACA3", "#BDC3B8", "#D4D7CC"],
    sunHex: "#DE532B",
    figureHex: "#D1360B",
    guideHex: "#D24322",
    note: "忠实复刻 086 原海报：暖米宣纸光口、深松青嵌套门框、前景暗色叶影与远端红人赤日。",
  },
  garden: {
    id: "garden",
    name: "园林·月洞框景",
    shortName: "月洞园林",
    en: "MOON-GATE GARDEN",
    archShape: "moon",
    bgHex: "#F2E9D8",
    skyTop: "#F5EFE0",
    skyHorizon: "#E4E8DF",
    fogHex: "#E3E7DE",
    floorLight: "#E8DFCE",
    floorTile: "#CFC4B0",
    stairDark: "#1C3533",
    stairMid: "#35534F",
    portalPalette: ["#213D3A", "#395B55", "#5E7B73", "#889E94", "#A6B4AA"],
    portalBevel: ["#DDD3BE", "#CFC6B2", "#D8D2C2", "#E2DDD0", "#EAE6DC"],
    foliageHex: "#122822",
    foliageAccent: "#22463A",
    mountainPalette: ["#8B9F96", "#AEC0B6", "#CBD6CE"],
    sunHex: "#D94A28",
    figureHex: "#C73514",
    guideHex: "#C73514",
    note: "取材计成《园冶》框景借景：月洞粉墙层层套叠，竹影入框，将园外远山请入画中。",
  },
  cinema: {
    id: "cinema",
    name: "影院·深焦柱廊",
    shortName: "影院柱廊",
    en: "DEEP-STAGE COLONNADE",
    archShape: "arch",
    bgHex: "#EFE3CE",
    skyTop: "#F5E9D3",
    skyHorizon: "#E3D2B6",
    fogHex: "#DDD0BA",
    floorLight: "#EBD5B7",
    floorTile: "#B89F82",
    stairDark: "#141D20",
    stairMid: "#26373B",
    portalPalette: ["#182B2E", "#2A4447", "#486163", "#708382", "#93A09D"],
    portalBevel: ["#C4B297", "#B8A88E", "#C6B9A3", "#D4C9B6", "#DFD7C8"],
    foliageHex: "#0D1719",
    foliageAccent: "#1D2F33",
    mountainPalette: ["#8E8D82", "#ADA99B", "#CBC6B8"],
    sunHex: "#D4421E",
    figureHex: "#C92E0D",
    guideHex: "#D4421E",
    note: "呼应《宫娥》与《公民凯恩》纵深场面调度：暗前景柱廊框出深处亮门与孤影人物。",
  },
};

// 开场刻意停在 0/4 四重坍塌坏态，绝不预先给答案
// 4 重门框被压扁在 4.0m 薄片里——向右一拖舞台立刻像立体折纸一样拉展开来！
export const INITIAL_STATE = {
  scene: "poster",
  depthSpread: 0.04,   // 0..1 -> 四重门框压扁仅 4.0m
  portalCount: 4,      // 1..5 -> 4 重门压成薄纸片，横拖即刻层层拉开
  fgOverlap: 0.0,      // 0..0.56 -> 前景叶影全撤出画外
  figureDepth: 0.14,   // 0.12..0.95 -> 红人站在最前阶，近大远小全失
  fov: 24,             // 22..76° -> 偏长焦压平透视
  guideLine: false,    // 未铺朱红阶梯引导线
  cutaway: false,      // 透视实景 vs 52° 3D 侧剖 X-Ray
  showRuler: true,     // Z 轴标尺标注
  highlightCue: null,  // null | "layering" | "overlap" | "scale" | "depth"
};

// 多组合法解（全部通过 4/4）与主动试错反向案例
export const PRESETS = {
  posterClassic: {
    label: "原海报经典解",
    kind: "valid",
    patch: { depthSpread: 0.72, portalCount: 4, fgOverlap: 0.21, figureDepth: 0.76, fov: 48, guideLine: true },
  },
  airyGarden: {
    label: "疏朗三门解",
    kind: "valid",
    patch: { depthSpread: 0.56, portalCount: 3, fgOverlap: 0.14, figureDepth: 0.64, fov: 42, guideLine: true },
  },
  dramaticHall: {
    label: "强纵深宽角解",
    kind: "valid",
    patch: { depthSpread: 0.92, portalCount: 4, fgOverlap: 0.27, figureDepth: 0.84, fov: 58, guideLine: true },
  },
  trapBlocked: {
    label: "试错：前景堵死",
    kind: "trap",
    patch: { depthSpread: 0.72, portalCount: 4, fgOverlap: 0.52, figureDepth: 0.74, fov: 48, guideLine: true },
  },
  trapDistorted: {
    label: "试错：超广失锚",
    kind: "trap",
    patch: { depthSpread: 0.96, portalCount: 4, fgOverlap: 0.18, figureDepth: 0.94, fov: 74, guideLine: true },
  },
  trapTunnel: {
    label: "试错：密框黑洞",
    kind: "trap",
    patch: { depthSpread: 0.34, portalCount: 5, fgOverlap: 0.20, figureDepth: 0.68, fov: 46, guideLine: true },
  },
  resetBroken: {
    label: "复原坍塌态",
    kind: "reset",
    patch: {
      depthSpread: INITIAL_STATE.depthSpread,
      portalCount: INITIAL_STATE.portalCount,
      fgOverlap: INITIAL_STATE.fgOverlap,
      figureDepth: INITIAL_STATE.figureDepth,
      fov: INITIAL_STATE.fov,
      guideLine: INITIAL_STATE.guideLine,
    },
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 3D 向量运算（不依赖 Three.js，保证 2D 降级与单真源核算离线独立）
function vSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function vCross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function vDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function vNorm(a) {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function makeCameraBasis(cam) {
  const forward = vNorm(vSub(cam.target, cam.pos));
  const upRef = [0, 1, 0];
  const right = vNorm(vCross(forward, upRef));
  const up = vCross(right, forward);
  const f = 1 / Math.tan((cam.fov * Math.PI) / 360);
  return { pos: cam.pos, forward, right, up, f, aspect: cam.aspect };
}

export function projectPoint(pt, basis, W = 1, H = 1) {
  const d = vSub(pt, basis.pos);
  const z = vDot(d, basis.forward);
  if (z <= 0.12) return null;
  const x = vDot(d, basis.right);
  const y = vDot(d, basis.up);
  const ndcX = (x * basis.f) / (z * basis.aspect);
  const ndcY = (y * basis.f) / z;
  return {
    x: (ndcX * 0.5 + 0.5) * W,
    y: (0.5 - ndcY * 0.5) * H,
    ndcX,
    ndcY,
    z,
  };
}

// 计算当前状态下的完整 3D 建筑空间模型（所有单位：米）
export function computeLayout(state, cutawayBlend = 0, aspect = 4 / 3) {
  const spread = clamp(state.depthSpread, 0, 1);
  const count = Math.round(clamp(state.portalCount, 1, 5));
  const fgOverlap = clamp(state.fgOverlap, 0, 0.56);
  const figDepth = clamp(state.figureDepth, 0.12, 0.95);
  const fov = clamp(state.fov, 22, 76);

  // 走廊基准 Z 坐标：第一道门框固定在 zFirst = -3.6m，
  // 相机按视角 FOV 保持第一道门洞高度恒占画面约 68%（同现实摄影师换焦段前后移步构图），
  // 让 24° 长焦压平与 74° 超广畸变都能完整看见深松青外门框，同时真实改变后方重门与红人的透视收束！
  const zFirst = -3.6;
  const halfTan = Math.tan((fov * Math.PI) / 360);
  const d0 = 2.08 / Math.max(0.16, halfTan); // 保证 Portal 0 处可见画高恒约 4.16m
  const camZ = zFirst + d0;

  const maxCorridorLen = 2.4 + spread * 28.6; // 2.4m .. 31.0m
  const stepZ = count > 1 ? maxCorridorLen / (count - 1) : 0;

  const portals = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const z = zFirst - i * stepZ;
    // 门洞逐重收束，外墙宽阔覆盖画幅边缘（忠实还原 086 原海报的满幅建筑包围感）
    const openW = lerp(3.15, 2.25, t);
    const openH = lerp(2.95, 2.35, t);
    const framePadX = i === 0 ? 4.2 : lerp(1.35, 0.95, t);
    const framePadTop = i === 0 ? 3.2 : lerp(0.95, 0.72, t);
    const depthThick = lerp(0.88, 0.52, t);
    portals.push({
      index: i,
      z,
      openW,
      openH,
      outerW: openW + framePadX * 2,
      outerH: openH + framePadTop,
      thickness: depthThick,
      t,
    });
  }

  const lastPortal = portals[portals.length - 1];
  const floorEndZ = lastPortal.z - (1.4 + spread * 5.4);
  const floorStartZ = camZ - 1.2;
  const totalCorridorZ = Math.abs(floorEndZ - zFirst) + 1.2; // 实测 Z 跨度（米）

  // 人物 Z 坐标：位于第一门前沿到最内门光口之间
  const figMinZ = zFirst + 0.25;
  const figMaxZ = floorEndZ + 0.85;
  const figureZ = lerp(figMinZ, figMaxZ, figDepth);
  const figureX = 0.22 * (1 - figDepth * 0.35);
  const figureHeightM = 1.56;

  // 远山与红日位置（赤日悬于两峰垭口上方的亮空处，呼应 086 原海报）
  const mountainBaseZ = floorEndZ - (4.5 + spread * 12.0);
  const sunZ = mountainBaseZ - 6.5;
  const sunPos = [-0.26, 2.38 + spread * 0.24, sunZ];
  const sunRadius = 0.56 + spread * 0.42;

  // 前景遮挡层位置（贴近相机前方 2.15m 处）
  const fgDist = Math.min(2.15, d0 * 0.52);
  const fgZ = camZ - fgDist;
  const halfViewAtFg = fgDist * halfTan * aspect;
  const rightIntrudeM = fgOverlap * halfViewAtFg * 1.48;
  const leftIntrudeM = fgOverlap * halfViewAtFg * 0.96;

  // 阶梯与朱红引导线三维关键点（呼应原海报从左下沿台阶折转深入）
  const guidePoints = [
    [-1.18, 0.04, zFirst + 1.45],
    [-0.78, 0.04, zFirst + 0.65],
    [-0.18, 0.04, zFirst - 0.15],
    [0.06, 0.04, lerp(zFirst - 0.3, figureZ, 0.36)],
    [figureX * 0.82, 0.04, lerp(zFirst - 0.3, figureZ, 0.72)],
    [figureX, 0.04, figureZ + 0.38],
  ];

  // 主机位 vs 52° 侧剖 X-Ray 机位平滑插值
  const midZ = (zFirst + floorEndZ) * 0.5;
  const camStraightPos = [0, 1.56, camZ];
  const camStraightTarget = [0, 1.54, zFirst - 12.0];

  const orbitDist = Math.max(15.0, totalCorridorZ * 0.88 + 7.2);
  const angle = 0.90;
  const camCutPos = [
    Math.sin(angle) * orbitDist,
    5.2 + spread * 2.2,
    midZ + Math.cos(angle) * orbitDist * 0.75,
  ];
  const camCutTarget = [0, 1.48, midZ - 0.8];

  const k = cutawayBlend * cutawayBlend * (3 - 2 * cutawayBlend); // smoothstep
  const camera = {
    pos: [
      lerp(camStraightPos[0], camCutPos[0], k),
      lerp(camStraightPos[1], camCutPos[1], k),
      lerp(camStraightPos[2], camCutPos[2], k),
    ],
    target: [
      lerp(camStraightTarget[0], camCutTarget[0], k),
      lerp(camStraightTarget[1], camCutTarget[1], k),
      lerp(camStraightTarget[2], camCutTarget[2], k),
    ],
    fov: lerp(fov, 44, k),
    aspect,
  };

  // 始终用正视机位核算构图指标，保证切到 3D 侧剖 X-Ray 观察时诊单不会乱跳
  const straightCamera = {
    pos: camStraightPos,
    target: camStraightTarget,
    fov,
    aspect,
  };

  return {
    portals,
    zFirst,
    camZ,
    d0,
    stepZ,
    floorStartZ,
    floorEndZ,
    totalCorridorZ,
    figure: { x: figureX, y: 0, z: figureZ, h: figureHeightM, w: 0.42 },
    fg: {
      z: fgZ,
      overlap: fgOverlap,
      halfViewX: halfViewAtFg,
      rightIntrudeM,
      leftIntrudeM,
    },
    mountainBaseZ,
    sunPos,
    sunRadius,
    guidePoints,
    camera,
    straightCamera,
    cutawayBlend: k,
  };
}

// 从实绘 3D 投影包围盒单真源核算四重指标与双向真错态
export function auditState(state, aspect = 4 / 3) {
  const layout = computeLayout(state, 0, aspect);
  const basis = makeCameraBasis(layout.straightCamera);

  // 1. 投影第一道门洞与最深门洞（归一化 0..1 画幅坐标）
  const p0 = layout.portals[0];
  const pLast = layout.portals[layout.portals.length - 1];
  const p0Top = projectPoint([0, p0.openH, p0.z], basis, 1, 1);
  const p0Bot = projectPoint([0, 0, p0.z], basis, 1, 1);
  const p0Left = projectPoint([-p0.openW / 2, p0.openH * 0.5, p0.z], basis, 1, 1);
  const p0Right = projectPoint([p0.openW / 2, p0.openH * 0.5, p0.z], basis, 1, 1);

  const pLastLeft = projectPoint([-pLast.openW / 2, pLast.openH * 0.5, pLast.z], basis, 1, 1);
  const pLastRight = projectPoint([pLast.openW / 2, pLast.openH * 0.5, pLast.z], basis, 1, 1);

  const p0OpenH = p0Top && p0Bot ? Math.abs(p0Bot.y - p0Top.y) : 0.72;
  const p0OpenW = p0Left && p0Right ? Math.abs(p0Right.x - p0Left.x) : 0.62;
  const pLastOpenW = pLastLeft && pLastRight ? Math.abs(pLastRight.x - pLastLeft.x) : p0OpenW;

  // 2. 投影红人实际屏高与相对第一门洞的尺度比
  const figHead = projectPoint([layout.figure.x, layout.figure.h, layout.figure.z], basis, 1, 1);
  const figFeet = projectPoint([layout.figure.x, 0, layout.figure.z], basis, 1, 1);
  const figScreenH = figHead && figFeet ? Math.abs(figFeet.y - figHead.y) : 0.2;
  const figHeightRatioOfPortal = figScreenH / Math.max(0.08, p0OpenH);
  const figHeightPct = Math.round(figHeightRatioOfPortal * 100);
  const scaleRatio = p0OpenH / Math.max(0.008, figScreenH); // 例如 1 : 5.4

  // 3. 前景遮挡实绘屏占比 & 中心入口被遮挡比例
  const fgNorm = layout.fg.overlap;
  // 右侧垂枝（高度约占 78%）+ 左侧低枝（高度约占 42%）的有效不透明叶簇占比
  const fgCoveragePct = Math.round(fgNorm * 82);
  // 计算伸入第一门洞净宽里的遮挡比例
  const rightLeafInnerX = 1 - fgNorm * 1.15;
  const leftLeafInnerX = fgNorm * 0.68;
  const openL = p0Left ? clamp(p0Left.x, 0, 1) : 0.2;
  const openR = p0Right ? clamp(p0Right.x, 0, 1) : 0.8;
  const openSpan = Math.max(0.15, openR - openL);
  const blockedRight = Math.max(0, openR - rightLeafInnerX);
  const blockedLeft = Math.max(0, leftLeafInnerX - openL);
  const openingBlockedPct = Math.round(clamp(((blockedRight + blockedLeft * 0.65) / openSpan) * 100, 0, 100));

  // 4. 透视汇聚角（地板右边线从前沿到深处的屏幕收敛角）
  const flNear = projectPoint([p0.openW * 0.48, 0, p0.z], basis, 1, 1);
  const flFar = projectPoint([pLast.openW * 0.48, 0, layout.floorEndZ], basis, 1, 1);
  const dx = flNear && flFar ? Math.abs(flNear.x - flFar.x) : 0.04;
  const dy = flNear && flFar ? Math.abs(flNear.y - flFar.y) : 0.04;
  const convergenceDeg = Math.round((Math.atan2(dy, Math.max(0.001, dx)) * 180) / Math.PI);

  const portalCount = layout.portals.length;
  const spanM = +layout.totalCorridorZ.toFixed(1);
  const gapM = portalCount > 1 ? +layout.stepZ.toFixed(1) : 0;
  const nestedShrinkPct = Math.round((1 - pLastOpenW / Math.max(0.05, p0OpenW)) * 100);

  // ---- 四重柱石双向判定 ----
  // A. 层叠 LAYERING（先检 5 重过密黑洞，再检不足坍塌）
  let layering;
  if (portalCount >= 5 && gapM < 3.4) {
    layering = {
      ok: false,
      dir: "over",
      tag: `密挤 ${gapM}m`,
      metric: `${portalCount}重 · 净距 ${gapM}m`,
      issueKey: "layer_tunnel",
    };
  } else if (portalCount < 3 || spanM < 13.0) {
    layering = {
      ok: false,
      dir: "under",
      tag: portalCount < 3 ? `${portalCount}重坍塌` : `仅深 ${spanM}m`,
      metric: `${portalCount}重 · ${spanM}m`,
      issueKey: "layer_flat",
    };
  } else {
    layering = {
      ok: true,
      dir: "ok",
      tag: `${portalCount}重 · ${spanM}m`,
      metric: `${portalCount}重 · ${spanM}m`,
      issueKey: null,
    };
  }

  // B. 遮挡 OVERLAP
  let overlap;
  if (fgCoveragePct < 6) {
    overlap = {
      ok: false,
      dir: "under",
      tag: "无前景遮挡",
      metric: `前景 ${fgCoveragePct}%`,
      issueKey: "overlap_none",
    };
  } else if (openingBlockedPct > 36) {
    overlap = {
      ok: false,
      dir: "over",
      tag: `堵口 ${openingBlockedPct}%`,
      metric: `遮口 ${openingBlockedPct}%`,
      issueKey: "overlap_block",
    };
  } else {
    overlap = {
      ok: true,
      dir: "ok",
      tag: `轻遮 ${fgCoveragePct}%`,
      metric: `前景 ${fgCoveragePct}%`,
      issueKey: null,
    };
  }

  // C. 尺度 SCALE
  let scale;
  if (figHeightPct > 34) {
    scale = {
      ok: false,
      dir: "under",
      tag: `人近占 ${figHeightPct}%`,
      metric: `1 : ${scaleRatio.toFixed(1)}`,
      issueKey: "scale_near",
    };
  } else if (figHeightPct < 4.5 || figScreenH < 0.028) {
    scale = {
      ok: false,
      dir: "over",
      tag: `远人失踪 ${figHeightPct}%`,
      metric: `1 : ${scaleRatio.toFixed(1)}`,
      issueKey: "scale_tiny",
    };
  } else {
    scale = {
      ok: true,
      dir: "ok",
      tag: `尺比 1:${scaleRatio.toFixed(1)}`,
      metric: `1 : ${scaleRatio.toFixed(1)}`,
      issueKey: null,
    };
  }

  // D. 纵深 DEPTH
  let depth;
  if (state.fov > 68) {
    depth = {
      ok: false,
      dir: "over",
      tag: `超广 ${state.fov}°`,
      metric: `${state.fov}° · 畸变`,
      issueKey: "depth_wide",
    };
  } else if (!state.guideLine) {
    depth = {
      ok: false,
      dir: "under",
      tag: "缺引导线",
      metric: `${state.fov}° · 无引线`,
      issueKey: "depth_noguide",
    };
  } else if (state.fov < 34) {
    depth = {
      ok: false,
      dir: "under",
      tag: `长焦 ${state.fov}°压平`,
      metric: `${state.fov}° · 压平`,
      issueKey: "depth_flatfov",
    };
  } else {
    depth = {
      ok: true,
      dir: "ok",
      tag: `${state.fov}° · 引线通`,
      metric: `${state.fov}° · 收束 ${nestedShrinkPct}%`,
      issueKey: null,
    };
  }

  const cues = { layering, overlap, scale, depth };
  const passed = [layering, overlap, scale, depth].filter((c) => c.ok).length;

  // 最高优先级单真源诊断（给出「错在哪 + 为什么 + 怎么调 + 一键修补」）
  let diagnosis;
  let pulseStopT = 1.0;

  if (!overlap.ok && overlap.dir === "over") {
    pulseStopT = 0.22;
    diagnosis = {
      badge: `${passed}/4 · 前景堵死`,
      headline: `前景暗叶吞掉了 ${openingBlockedPct}% 的门洞净口`,
      why: "前景遮挡的作用是给眼睛立一根「离镜头最近」的坐标桩；一旦遮挡面积冲过三成半，前景就从配角反客为主，把走廊入口和远方主体一起闷死在树影里。",
      action: "把「前景遮挡」往回收到 10%–28%（经验区间），让枝叶只轻咬画框边缘，把中轴光口留干净。",
      fixLabel: "把前景叶影收至边缘 18%",
      fixPatch: { fgOverlap: 0.21 },
    };
  } else if (!layering.ok && layering.dir === "over") {
    pulseStopT = 0.44;
    diagnosis = {
      badge: `${passed}/4 · 密框黑洞`,
      headline: `${portalCount} 重门框挤在 ${spanM}m 里，每重净距只剩 ${gapM}m`,
      why: "嵌套框架靠门与门之间的光线留白显出步阶；框架太密、间距太窄，光进不到门洞之间，原本通透的纵深会立刻塌成一条发闷的黑条纹隧道。",
      action: "直接向右横拖走廊拉大 Z 轴间距，或把框架重数减到 3–4 重，让每一重门之间透出明亮石阶。",
      fixLabel: "拉开间距至 4 重通透长廊",
      fixPatch: { portalCount: 4, depthSpread: 0.72 },
    };
  } else if (!depth.ok && depth.dir === "over") {
    pulseStopT = 0.78;
    diagnosis = {
      badge: `${passed}/4 · 超广失锚`,
      headline: `视角拉到 ${state.fov}° 超广角，走廊被扯成尖锥、远端红人缩成噪点`,
      why: "透视并不是越广越好。超过 68° 以后，前景门框边缘剧烈扩张，深处的红人被压缩到门高的 " + figHeightPct + "%，人眼再也抓不住尽头的尺度参照物。",
      action: "把「透视视角」回收到 40°–60° 自然宽角区间，必要时把红人略往前挪半步。",
      fixLabel: "回收镜头视角至 48°",
      fixPatch: { fov: 48, figureDepth: Math.min(state.figureDepth, 0.78) },
    };
  } else if (!layering.ok) {
    pulseStopT = 0.30;
    diagnosis = {
      badge: `${passed}/4 · 层叠坍塌`,
      headline: portalCount < 3
        ? `画面只有 ${portalCount} 重门框，缺了前中后递进的步阶`
        : `走廊 Z 轴只展开了 ${spanM}m，四重门贴成了薄纸片`,
      why: "眼睛靠逐层缩小的门洞轮廓去量「有多远」。只有一重门或所有门贴在几米之内时，视线撞在第一堵墙上就停住，画布瞬间退回平面明信片。",
      action: "在舞台上直接向右横拖拉展 Z 轴（或点「切 3D 侧剖」看纸片如何展开），并把门框加到 3–4 重。",
      fixLabel: "拉开 4 重门框至 24m 纵深",
      fixPatch: { portalCount: 4, depthSpread: 0.72 },
    };
  } else if (!overlap.ok) {
    pulseStopT = 0.42;
    diagnosis = {
      badge: `${passed}/4 · 无前景遮挡`,
      headline: "画面最前面光秃秃的，缺少近景遮挡锚点",
      why: "心理学家吉布森指出，遮挡（occlusion）是最不容置疑的前后序线索。没有前景枝叶或暗柱轻压第一道门边，整条走廊就像漂在半空的舞台布景，观者觉得自己「站在画外」而不是「步入画中」。",
      action: "轻点画布右侧暗墙或把「前景遮挡」推到 12%–26%，让暗色枝叶探入画框边缘。",
      fixLabel: "引入 18% 前景暗叶遮挡",
      fixPatch: { fgOverlap: 0.21 },
    };
  } else if (!scale.ok && scale.dir === "under") {
    pulseStopT = 0.56;
    diagnosis = {
      badge: `${passed}/4 · 人近失尺`,
      headline: `红人站在最前阶，身高占了入口门洞的 ${figHeightPct}%`,
      why: "人物是画面里最诚实的比例尺。当红人紧贴镜头前排、和门框差不多大时，眼睛感受不到「近大远小」的巨大落差，再长的走廊也显得短促。",
      action: "在下方 Z 轴剖面标尺里把「红人节点」往深处拖，让红人退到后半段光口，身高缩到门洞的 10%–26%。",
      fixLabel: "把红人送入深处光口",
      fixPatch: { figureDepth: 0.76 },
    };
  } else if (!scale.ok && scale.dir === "over") {
    pulseStopT = 0.84;
    diagnosis = {
      badge: `${passed}/4 · 远人过小`,
      headline: `红人退得太深且受广角挤压，屏高只剩入口的 ${figHeightPct}%`,
      why: "虽然距离拉得很远，但作为视觉落脚点的红人已经小到接近像素噪点，视线穿过重门后抓不到清楚的终点，层次反而显得空洞。",
      action: "把红人往前拉回中后段光口，或收窄一点镜头视角，让尺比落在 1:3.5 到 1:12 之间。",
      fixLabel: "把红人调回清晰尺度锚点",
      fixPatch: { figureDepth: 0.74, fov: Math.min(state.fov, 54) },
    };
  } else if (!depth.ok) {
    pulseStopT = 0.64;
    diagnosis = {
      badge: `${passed}/4 · ${!state.guideLine ? "缺引导线" : "长焦压平"}`,
      headline: !state.guideLine
        ? "阶梯地面空滑，缺少把视线拖入深处的引导线"
        : `镜头视角压窄到 ${state.fov}°，透视收敛感被长焦压平`,
      why: !state.guideLine
        ? "门框定出了前后层次，但没有顺着台阶和地砖延伸的引导路径时，观众的目光会在门框表面上下打转，不容易一气贯通地走进最深处。"
        : "偏长焦视角（< 34°）会让前后门框的透视收缩变弱，空间显得像被压缩的舞台景片，缺乏步入感。",
      action: !state.guideLine
        ? "直接点击走廊石阶或开启「朱红引导线」，再按空格观看视线如何顺线穿门而入。"
        : "把「透视视角」放宽到 40°–58°（接近人眼自然透视到轻广角），拉开门框的透视收缩梯度。",
      fixLabel: !state.guideLine ? "开启朱红阶梯引导线" : "放宽视角至 48° 自然透视",
      fixPatch: !state.guideLine ? { guideLine: true, fov: Math.max(state.fov, 44) } : { fov: 48 },
    };
  } else {
    pulseStopT = 1.0;
    const styleName =
      state.fov >= 54 ? "强纵深宽角构图"
      : portalCount === 3 ? "疏朗三门框景"
      : "经典深空间构图";
    diagnosis = {
      badge: `4/4 · 纵深成立`,
      headline: `四重线索咬合：${styleName}已把平面凿穿成 ${spanM}m 长廊`,
      why: `前景 ${fgCoveragePct}% 暗叶立住近景锚点，${portalCount} 重门框逐级收束 ${nestedShrinkPct}%，远端红人以 1:${scaleRatio.toFixed(1)} 尺比稳住光口，朱红引导线把目光一气送抵赤日。点「切 3D 侧剖」可从侧面验看物理 Z 轴排布。`,
      action: "试试主动把前景拉过 40% 或把视角拉到 74°，亲眼看深空间怎样因为「过头」而反向崩坏。",
      fixLabel: "演播视线穿透（Space）",
      fixPatch: null,
    };
  }

  const gradeLabel =
    passed === 4 ? "四重咬合（示意）"
    : passed >= 2 ? "半深未透（示意）"
    : "纸面坍塌（示意）";

  return {
    passed,
    cues,
    spanM,
    gapM,
    fgCoveragePct,
    openingBlockedPct,
    figHeightPct,
    scaleRatio: +scaleRatio.toFixed(1),
    convergenceDeg,
    nestedShrinkPct,
    gradeLabel,
    diagnosis,
    pulseStopT,
    layout,
  };
}
