// 309 脏单人镜头 · 共享光学与 2.39:1 归一化几何模型
// 开场监视器、俯拍走位轨道、第 07 节小练习与第 05 节焦段台共用同一套物理推导。

export const ASPECT = 2.39; // 全端锁定 2.39:1 宽银幕画幅，只做等比缩放

// 俯拍片场房间参数（单位：米，原点在主角座椅中心，+Z 朝向摄影机轨道，-X 朝主角目光左方）
export const ROOM = {
  protagonist: { x: 0.0, z: 0.0, facing: -1 }, // 主角朝左（-X），忠实承袭 309 原海报
  cup: { x: -0.44, z: 0.0 },
  companion: { x: -0.10, z: 1.34 },
  windowZ: -1.65,
  defaultTrackZ: 2.48,
  aimTarget: { x: -0.22, z: 0.0 },
  trackMinX: -1.25,
  trackMaxX: 1.25,
};

// 归一化 2.39:1 画框中的中景主角与视线空间（与画布像素尺寸无关，各端完全一致）
export const FRAME_REGIONS = {
  protagonistX: 0.618,
  cupX: 0.453,
  cupY: 0.678,
  tableY: 0.722,
  // 主角面部边界框（侧脸朝左，无五官）
  face: { u0: 0.562, u1: 0.654, v0: 0.195, v1: 0.445 },
  // 视线空间走廊：从主角鼻尖/眼神朝左延伸，完整涵盖桌面咖啡杯前方区域
  sightline: { u0: 0.345, u1: 0.562, v0: 0.20, v1: 0.735 },
  eyeOrigin: { u: 0.576, v: 0.288 },
};

export const APERTURE_STOPS = [1.8, 2.8, 5.6, 11];

// 默认开场态：刻意停在原海报同款的「主角朝左、同伴在右侧背后」机位 + f/5.6 略硬边缘
export const HERO_INITIAL = {
  dollyX: -0.66,
  dollyZ: ROOM.defaultTrackZ,
  aperture: 5.6,
  focalMm: 50,
  showGuides: false,
};

// 前景同伴剪影基础轮廓（对称背影：头顶 → 后脑/颞部 → 颈肩拐点 → 斜肩 → 下身）
// 在 companion 局部坐标系中以 (0, 0) 为画框顶部中心对齐点，scale = 1 对应标准机位 z = 2.48m
const HALF_SILHOUETTE = [
  [0.0, 0.055],
  [0.044, 0.064],
  [0.076, 0.105],
  [0.091, 0.175],
  [0.089, 0.265],
  [0.078, 0.355],
  [0.068, 0.448], // 后脑/颈肩拐点（关键辨认标志）
  [0.084, 0.502],
  [0.146, 0.548], // 肩线斜坡上段
  [0.202, 0.618], // 肩线外肩峰
  [0.232, 0.722],
  [0.258, 0.865],
  [0.286, 1.12],
  [0.295, 1.55],
];

// 生成归一化画框坐标下的前景同伴完整闭合多边形
export function buildCompanionPolygon({ uFg, scale = 1, vOffset = 0 }) {
  const rightPts = HALF_SILHOUETTE.map(([du, dv]) => [
    uFg + du * scale,
    dv * scale + vOffset,
  ]);
  const leftPts = [...HALF_SILHOUETTE]
    .reverse()
    .map(([du, dv]) => [uFg - du * scale, dv * scale + vOffset]);
  return [...rightPts, ...leftPts];
}

// Sutherland-Hodgman 将任意多边形裁进 [0, 1] × [0, 1] 画框内，精确计算覆盖面积占比
function clipEdge(pts, inside, intersect) {
  if (!pts.length) return [];
  const out = [];
  let prev = pts[pts.length - 1];
  let prevIn = inside(prev);
  for (const cur of pts) {
    const curIn = inside(cur);
    if (curIn) {
      if (!prevIn) out.push(intersect(prev, cur));
      out.push(cur);
    } else if (prevIn) {
      out.push(intersect(prev, cur));
    }
    prev = cur;
    prevIn = curIn;
  }
  return out;
}

export function clipPolygonToRect(pts, u0 = 0, u1 = 1, v0 = 0, v1 = 1) {
  let p = pts;
  p = clipEdge(p, (a) => a[0] >= u0, (a, b) => {
    const t = (u0 - a[0]) / (b[0] - a[0] || 1e-9);
    return [u0, a[1] + t * (b[1] - a[1])];
  });
  p = clipEdge(p, (a) => a[0] <= u1, (a, b) => {
    const t = (u1 - a[0]) / (b[0] - a[0] || 1e-9);
    return [u1, a[1] + t * (b[1] - a[1])];
  });
  p = clipEdge(p, (a) => a[1] >= v0, (a, b) => {
    const t = (v0 - a[1]) / (b[1] - a[1] || 1e-9);
    return [a[0] + t * (b[0] - a[0]), v0];
  });
  p = clipEdge(p, (a) => a[1] <= v1, (a, b) => {
    const t = (v1 - a[1]) / (b[1] - a[1] || 1e-9);
    return [a[0] + t * (b[0] - a[0]), v1];
  });
  return p;
}

export function polygonArea(pts) {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) * 0.5;
}

// 计算薄透镜前景弥散圆模糊半径（以 2.39:1 画框高度为基准的归一化比例）
// 主角对焦在 u_focus = dollyZ，前景位于 companion.z
export function computeOpticalBlur({ focalMm = 50, aperture = 2.8, dollyZ = ROOM.defaultTrackZ, fgDistFromSubject = ROOM.companion.z }) {
  const fM = focalMm / 1000;
  const focusDist = Math.max(1.2, dollyZ);
  const fgDist = Math.max(0.45, focusDist - fgDistFromSubject);
  // 真实薄透镜弥散圆直径 c = (f^2 / (N * (s - f))) * |s - d| / d
  const cocM = ((fM * fM) / (aperture * Math.max(0.1, focusDist - fM))) * (Math.abs(focusDist - fgDist) / fgDist);
  // 35mm 全画幅 2.39:1 传感器高度约 15.06mm
  const cocNorm = cocM / 0.01506;
  // 适度视觉映射，保持 f/1.8 明显柔化、f/11 边缘锐利硬朗
  const blurNorm = Math.min(0.068, Math.max(0.0018, cocNorm * 0.42));
  let hardness = "soft";
  let opticalLabel = "柔焦暗框";
  let opticalNote = `f/${aperture} 浅景深把前景边缘化成柔和暗框，压住画框边角而不与清晰主角争抢视线。`;
  if (aperture >= 8) {
    hardness = "hard";
    opticalLabel = "硬边抢戏";
    opticalNote = `f/${aperture} 收小光圈拉长景深，前景轮廓变得锐利生硬，黑块边线像贴纸一样把注意力从主角脸上拽走。`;
  } else if (aperture >= 4.5) {
    hardness = "medium";
    opticalLabel = "边缘偏实";
    opticalNote = `f/${aperture} 前景轮廓仍然偏实，暗块边缘带有明显硬度；开大到 f/2.8 或 f/1.8，前景会更顺滑地退让给主角。`;
  }
  return { cocMm: cocM * 1000, blurNorm, hardness, opticalLabel, opticalNote };
}

// 根据机位 (dollyX, dollyZ) 与可选微调计算前景同伴在归一化 2.39:1 画框中的投影与三条几何判定
export function evaluateShot(params = {}) {
  const dollyX = params.dollyX ?? HERO_INITIAL.dollyX;
  const dollyZ = params.dollyZ ?? ROOM.defaultTrackZ;
  const aperture = params.aperture ?? HERO_INITIAL.aperture;
  const focalMm = params.focalMm ?? 50;
  const fgDistFromSubject = params.fgDistFromSubject ?? ROOM.companion.z;

  // 透视投影：摄影机在 (dollyX, dollyZ) 望向 aimTarget，前景同伴位于 (companion.x, fgDistFromSubject)
  const camToSubjZ = dollyZ - ROOM.aimTarget.z;
  const camToFgZ = Math.max(0.45, dollyZ - fgDistFromSubject);
  const t = camToFgZ / camToSubjZ;
  const centerRayX = dollyX + t * (ROOM.aimTarget.x - dollyX);
  const dxFg = ROOM.companion.x - centerRayX;

  // 水平视野半宽（36mm 传感器）
  const halfTan = 18 / focalMm;
  const halfWAtFg = camToFgZ * halfTan;
  // uFg：同伴头肩中轴在归一化 2.39:1 画框中的 X 位置
  const uFg = params.uFgOverride ?? (0.5 + dxFg / (2 * halfWAtFg));

  // 标准距离（dollyZ = 2.48, fgDist = 1.34 -> camToFgZ = 1.14, 50mm）下 scale = 1.0
  const baseHalfW = (ROOM.defaultTrackZ - ROOM.companion.z) * (18 / 50);
  const scale = params.scaleOverride ?? (baseHalfW / halfWAtFg);
  const vOffset = params.vOffset ?? 0;

  const polygon = buildCompanionPolygon({ uFg, scale, vOffset });
  const visiblePoly = clipPolygonToRect(polygon, 0, 1, 0, 1);
  const coverage = polygonArea(visiblePoly); // 0..1，只作示意读数，不当过关门槛

  // 前景是否真的留在画框里（低于 1.5% 视为滑出画框、退回净单人）
  const hasForeground = coverage >= 0.015;

  // 关键解剖辨认点（靠近画框内侧那一边的后脑/颈肩拐点与肩线点）
  const onLeftSide = uFg <= 0.5;
  const sideSign = onLeftSide ? 1 : -1; // 指向画面内侧的方向
  const headCrownPt = [uFg + sideSign * 0.089 * scale, 0.22 * scale + vOffset];
  const neckInflectPt = [uFg + sideSign * 0.068 * scale, 0.448 * scale + vOffset];
  const shoulderSlopePt = [uFg + sideSign * 0.175 * scale, 0.58 * scale + vOffset];
  const shoulderOuterPt = [uFg + sideSign * 0.228 * scale, 0.715 * scale + vOffset];

  const inFrame = ([u, v], mU = 0.025, mV = 0.02) =>
    u >= mU && u <= 1 - mU && v >= mV && v <= 1 - mV;

  // 条件 1：前景认得出是人 —— 肩线斜坡与后脑/颈肩拐点同时在画框有效范围内
  const neckVisible = inFrame(neckInflectPt, 0.032, 0.03);
  const headVisible = inFrame(headCrownPt, 0.035, 0.02);
  const shoulderVisible = inFrame(shoulderSlopePt, 0.04, 0.04);
  const condRecognizable = hasForeground && neckVisible && headVisible && shoulderVisible;

  // 条件 2：不压主角的脸和视线空间 —— 前景多边形与脸部框、视线走廊框的交集面积近乎为零
  const faceOverlap = polygonArea(
    clipPolygonToRect(
      polygon,
      FRAME_REGIONS.face.u0,
      FRAME_REGIONS.face.u1,
      FRAME_REGIONS.face.v0,
      FRAME_REGIONS.face.v1
    )
  );
  const sightOverlap = polygonArea(
    clipPolygonToRect(
      polygon,
      FRAME_REGIONS.sightline.u0,
      FRAME_REGIONS.sightline.u1,
      FRAME_REGIONS.sightline.v0,
      FRAME_REGIONS.sightline.v1
    )
  );
  const cupOverlap = polygonArea(
    clipPolygonToRect(polygon, 0.415, 0.49, 0.60, 0.73)
  );
  const faceBlocked = faceOverlap > 0.0018;
  const sightlineBlocked = sightOverlap > 0.0032 || cupOverlap > 0.0006;
  const condClearSpace = !faceBlocked && !sightlineBlocked;

  // 条件 3：同伴在主角视线朝向一侧 —— 主角朝左（-X），同伴可见重心须在主角左侧（且有前景入画）
  // 计算可见前景的水平重心 uCentroid
  let uCentroid = uFg;
  if (visiblePoly.length >= 3) {
    let sx = 0;
    for (const [u] of visiblePoly) sx += u;
    uCentroid = sx / visiblePoly.length;
  }
  const companionOnGazeSide = hasForeground && uCentroid < FRAME_REGIONS.face.u0;
  const companionBehindBack = hasForeground && uCentroid > FRAME_REGIONS.face.u1 - 0.02;
  const condGazeSide = companionOnGazeSide;

  const passedCount = (condRecognizable ? 1 : 0) + (condClearSpace ? 1 : 0) + (condGazeSide ? 1 : 0);
  const allPassed = passedCount === 3;

  // 诊断分类与白话「为什么」
  let code = "dirty-ok";
  let badge = "脏单人成立 · 3/3";
  let headline = "同伴在视线一侧、轮廓可辨，主角脸与视线走廊全敞开";
  let why = "前景同伴的肩线与后脑拐点落在画面左缘——正好迎向主角朝左的目光；咖啡杯与视线走廊毫无遮挡，前—中—后三层自然把观众的眼引导到主角侧影上，一眼读出「对面有人在听」。";

  if (!hasForeground) {
    code = "clean-single";
    badge = "前景滑出 · 退回净单人";
    headline = "前景同伴已滑出画框，退回 308 净单人镜头";
    why = "画面只剩孤身一人：主体干脆清晰，但前景遮挡层与「对面有人在场」的关系线索全部消失。把摄影机推回轨道右段，让同伴肩头与后脑稳稳切进左缘。";
  } else if (faceBlocked) {
    code = "face-blocked";
    badge = "压住主角面部";
    headline = "摄影机正压在视线轴上，前景直接挡住了主角的脸";
    why = "机位躲在同伴正后方，失焦黑影盖住了主角侧脸——原海报提醒「遮挡不是遮住」，此时前景夺走了全部信息。继续向右推过轴线，把前景让到画面左缘。";
  } else if (sightlineBlocked) {
    code = "sightline-blocked";
    badge = "切进视线空间";
    headline = "同伴肩背切进了视线空间，压到咖啡杯前方";
    why = "虽然同伴已到主角视线一侧，但机位离中轴还是太近：暗黑肩缘探进主角目光去路与咖啡杯前方，把呼吸空间堵死。再向右移一点，给视线走廊让出空位。";
  } else if (companionBehindBack && condRecognizable) {
    code = "wrong-side";
    badge = "同伴落在背后 · 2/3";
    headline = "主角朝左看、同伴肩在右侧背后，看不出两人在说话";
    why = "309 原海报画的正是这种「主角朝左、肩在右」的机位——轮廓可辨也不挡脸，但同伴留在主角背后一侧，视觉上像两位背对而坐的陌生人。沿轨道向右推过视线轴，让同伴改从左缘迎面入画。";
  } else if (!condRecognizable && condGazeSide) {
    code = "sliver-only";
    badge = "只露肩角 · 认不出人";
    headline = "后脑与颈肩拐点已滑出左框，只剩一角认不出是人";
    why = "同伴虽在视线朝向的左侧且不挡主角，但机位绕得太开，画框里只剩一块无特征的左下斜角黑块，观众第一眼认不出是另一人的背影，反像没避干净的穿帮杂物。往回微收半步，把后脑拐点留回框内。";
  } else if (!condRecognizable && !condGazeSide) {
    code = "wrong-side-sliver";
    badge = "背后残边 · 1/3";
    headline = "只剩右侧背后一条黑边，既认不出人又背对主角";
    why = "不仅落在主角背后一侧，连肩头与后脑拐点都已滑出右缘。把摄影机向右推过视线轴，让同伴从左缘完整带出肩线与后脑拐点。";
  }

  const optics = computeOpticalBlur({ focalMm, aperture, dollyZ, fgDistFromSubject });

  // 背景双格窗随机位横移产生微弱真实视差
  const bgParallaxU = Math.max(-0.075, Math.min(0.075, dollyX * 0.042));

  return {
    dollyX,
    dollyZ,
    aperture,
    focalMm,
    uFg,
    scale,
    vOffset,
    bgParallaxU,
    polygon,
    visiblePoly,
    coverage,
    coveragePct: Math.round(coverage * 100),
    hasForeground,
    side: onLeftSide ? "left" : "right",
    landmarks: {
      headCrownPt,
      neckInflectPt,
      shoulderSlopePt,
      shoulderOuterPt,
    },
    conditions: {
      recognizable: condRecognizable,
      clearSpace: condClearSpace,
      gazeSide: condGazeSide,
    },
    details: {
      faceBlocked,
      sightlineBlocked,
      cupBlocked: cupOverlap > 0.0006,
      companionBehindBack,
      neckVisible,
      headVisible,
    },
    passedCount,
    allPassed,
    code,
    badge,
    headline,
    why,
    optics,
  };
}

// 第 07 节小练习四帧配置：全部固定 50mm · f/2.0，且前景覆盖面积均严格约 20%（示意）
// 唯一差别是机位横移与进退造成的同伴入画位置与裁切关系
export const PRACTICE_FRAMES = [
  {
    id: "A",
    label: "帧 A",
    // 视线一侧（左），但贴近偏外只露大片斜肩角，后脑与颈肩拐点出框，面积 ≈ 20%
    params: { dollyX: 0.90, dollyZ: 1.90, aperture: 2.0, focalMm: 50, uFgOverride: -0.13, scaleOverride: 1.76, vOffset: -0.67 },
    correct: false,
    shortVerdict: "只露肩角，后脑拐点出框",
    explain: "面积同样约 20%、也在视线一侧且没挡主角，但后脑与颈肩拐点滑出了左框，只剩左下角一块斜黑块，第一眼认不出是另一人的背影。",
  },
  {
    id: "B",
    label: "帧 B",
    // 同面积落在主角背后一侧（右侧），与原海报机位一致，面积 ≈ 21%
    params: { dollyX: -0.66, dollyZ: 2.48, aperture: 2.0, focalMm: 50 },
    correct: false,
    shortVerdict: "同伴落在主角背后一侧",
    explain: "面积约 21%、轮廓可辨也没压脸，但主角朝左看、同伴却留在右侧背后——两人像背对而坐，看不出在对话（与原海报同位）。",
  },
  {
    id: "C",
    label: "帧 C",
    // 正确答案：视线一侧（左侧）、肩线与后脑拐点完整在框内、视线走廊与咖啡杯全敞开，面积 ≈ 21%
    params: { dollyX: 0.66, dollyZ: 2.48, aperture: 2.0, focalMm: 50 },
    correct: true,
    shortVerdict: "三条几何条件全部成立",
    explain: "面积同样约 21%，但同伴稳稳落在主角视线朝向的左侧，肩线与后脑拐点一眼可辨，且边缘收在咖啡杯与视线走廊之外——既有对面在场感，又完全不堵眼。",
  },
  {
    id: "D",
    label: "帧 D",
    // 视线一侧（左侧）且形状完整，但肩膀切进视线空间、压到咖啡杯前方，面积 ≈ 21%
    params: { dollyX: 0.34, dollyZ: 2.88, aperture: 2.0, focalMm: 50, uFgOverride: 0.256, scaleOverride: 0.81, vOffset: 0.15 },
    correct: false,
    shortVerdict: "肩膀切进视线空间挡到杯前",
    explain: "面积仍是约 21%、同伴也在左侧且认得出是人，但机位离中轴太近，暗影肩背探进视线走廊、压在咖啡杯前方，截断了主角朝左的呼吸与目光去路。",
  },
];
