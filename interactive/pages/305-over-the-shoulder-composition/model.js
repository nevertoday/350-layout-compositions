// 305 过肩构图 · 单真源光学与几何模型
// 所有的画面绘制、百分比读数、遮挡检测、薄透镜前景虚化与正反打轴线判定全部由此模块计算。

export const SCENES = {
  cafe: {
    id: "cafe",
    label: "原海报 · 百叶窗咖啡馆",
    short: "咖啡馆",
    wallBase: "#7B664C",
    wallDeep: "#4A3D2D",
    blindLit: "#DFC09B",
    blindShade: "#AE8F6A",
    backWallLit: "#BFA27D",
    backWallDeep: "#5B4A36",
    tableTop: "#2A241D",
    tableEdge: "#181511",
    fgFill: "#10110E",
    fgBackLit: "#25221C",
    subFill: "#141412",
    subRim: "#927A5A",
    accent: "#B0D229",
    accentBright: "#C2EC35",
    lampGlow: "rgba(235, 206, 152, 0.22)",
    prop: "cafe",
  },
  interrogation: {
    id: "interrogation",
    label: "律政对质 · 审讯室",
    short: "审讯室",
    wallBase: "#5A6258",
    wallDeep: "#2D332C",
    blindLit: "#B8C2B0",
    blindShade: "#758071",
    backWallLit: "#939E8E",
    backWallDeep: "#363D35",
    tableTop: "#262B26",
    tableEdge: "#141814",
    fgFill: "#0D0F0D",
    fgBackLit: "#1E221D",
    subFill: "#121512",
    subRim: "#7F8B79",
    accent: "#B0D229",
    accentBright: "#C2EC35",
    lampGlow: "rgba(205, 224, 192, 0.20)",
    prop: "interrogation",
  },
  rooftop: {
    id: "rooftop",
    label: "暮色天台 · 告别戏",
    short: "暮色天台",
    wallBase: "#6E5649",
    wallDeep: "#392C26",
    blindLit: "#E0AF82",
    blindShade: "#9C6E52",
    backWallLit: "#C28E6B",
    backWallDeep: "#48352C",
    tableTop: "#29201B",
    tableEdge: "#171210",
    fgFill: "#100E0D",
    fgBackLit: "#261E19",
    subFill: "#151211",
    subRim: "#A67C60",
    accent: "#B0D229",
    accentBright: "#C2EC35",
    lampGlow: "rgba(244, 186, 128, 0.22)",
    prop: "rooftop",
  },
};

export const POSTER_POINTS = [
  {
    id: "frame",
    title: "前景框定",
    en: "FOREGROUND FRAME",
    body: "利用肩部、后脑等作为前景遮挡，自然框住主体。",
    layer: "frame",
  },
  {
    id: "depth",
    title: "景深关系",
    en: "DEPTH",
    body: "前景虚化，主体清晰，强化空间层次。",
    layer: "depth",
  },
  {
    id: "conversation",
    title: "对话引导",
    en: "CONVERSATION",
    body: "通过前景人物与主体的关系，暗示交流或互动。",
    layer: "axis",
  },
  {
    id: "gaze",
    title: "视线方向",
    en: "GAZE DIRECTION",
    body: "引导观者视线从前景越过肩部，聚焦主体。",
    layer: "gaze",
  },
  {
    id: "immersion",
    title: "代入感",
    en: "IMMERSION",
    body: "让观者仿佛置身现场，增强情绪共鸣。",
    layer: "corners",
  },
];

// 原海报底部 6 格「过肩角度参考」——每一组都是严格通过 4/4 检验的经典解
export const ANGLE_PRESETS = [
  {
    id: "left-close",
    zh: "左肩近景",
    en: "LEFT CLOSE",
    note: "紧贴左肩，拉近表情细节与秘密感",
    params: { cam: "A", side: "left", offset: 0.34, elev: 0.0, focalMm: 72, fStop: 2.0, axisValid: true },
  },
  {
    id: "right-close",
    zh: "右肩近景",
    en: "RIGHT CLOSE",
    note: "标准反打位，前景转右肩，视线回望左侧",
    params: { cam: "B", side: "right", offset: 0.34, elev: 0.0, focalMm: 72, fStop: 2.0, axisValid: true },
  },
  {
    id: "left-medium",
    zh: "左肩中景",
    en: "LEFT MEDIUM",
    note: "交代桌面、手势与二人社交距离",
    params: { cam: "A", side: "left", offset: 0.36, elev: 0.04, focalMm: 46, fStop: 2.4, axisValid: true },
  },
  {
    id: "right-medium",
    zh: "右肩中景",
    en: "RIGHT MEDIUM",
    note: "与左肩中景成对使用，景别尺度匹配",
    params: { cam: "B", side: "right", offset: 0.36, elev: 0.04, focalMm: 46, fStop: 2.4, axisValid: true },
  },
  {
    id: "high-angle",
    zh: "高位过肩",
    en: "HIGH ANGLE",
    note: "机位高过前景肩线俯看主体，压低对方气势",
    params: { cam: "A", side: "left", offset: 0.36, elev: 0.40, focalMm: 52, fStop: 2.2, axisValid: true },
  },
  {
    id: "low-angle",
    zh: "低位过肩",
    en: "LOW ANGLE",
    note: "机位压低沿肩仰拍主体，赋予对方压迫或威严",
    params: { cam: "B", side: "right", offset: 0.36, elev: -0.34, focalMm: 54, fStop: 2.2, axisValid: true },
  },
];

// 开场刻意停在 0/4 复合错态：前景遮脸 + 占比过大 + f/11 前景锐利 + 反打越轴
export const BAD_START = {
  cam: "A",
  side: "left",
  offset: -0.14,
  elev: 0.02,
  focalMm: 50,
  fStop: 11,
  axisValid: false,
  scene: "cafe",
};

export const CLASSIC_GOOD = {
  cam: "A",
  side: "left",
  offset: 0.36,
  elev: 0.02,
  focalMm: 56,
  fStop: 2.0,
  axisValid: true,
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// 由当前机位 A / B 与 180° 轴线状态决定前景肩实际出现在哪一侧
// 正常守轴：机位 A（男肩在左看女）、机位 B（女肩在右看男）
// 越轴时：机位 B 跨到轴线另一侧，女肩也跑到了左侧，两位说话者朝同一侧看，空间关系断裂！
export function effectiveSide(state) {
  if (state.side && state.cam === "CUSTOM") return state.side;
  if (state.cam === "A") return "left";
  return state.axisValid ? "right" : "left";
}

// 计算薄透镜弥散圆（Circle of Confusion），全画幅 36mm 传感器基准
// 返回归一化模糊比（相对画幅宽度的比例）与物理弥散圆毫米数
export function computeOpticalBlur(focalMm, fStop) {
  const f = clamp(focalMm, 24, 105);
  const N = clamp(fStop, 1.4, 16);
  // 电影摄影实拍规律：拉长焦段时，为保持相似景别，机位会随焦段成比例后退，
  // 但双人间距（约 1.35m）固定，前景距离 D_fg 与主体距离 D_s = D_fg + 1.35m 随之变化
  const dFg = 0.42 + (f / 50) * 0.56; // 28mm -> ~0.73m, 50mm -> ~0.98m, 85mm -> ~1.37m
  const dSub = dFg + 1.38;
  const fMeters = f / 1000;
  // 标准薄透镜 CoC 公式：c = (f^2 / (N * (D_s - f))) * |D_s - D_fg| / D_fg  (单位 mm)
  const cocMm = ((f * f) / (N * (dSub * 1000 - f))) * (Math.abs(dSub - dFg) / dFg);
  const blurNorm = cocMm / 36; // 占 36mm 画幅宽度的比例
  return {
    cocMm,
    blurNorm,
    dFg,
    dSub,
    // 背景主体始终在焦平面上；背景墙离主体约 1.4m
    bgWallCocMm: ((f * f) / (N * (dSub * 1000 - f))) * (1.45 / (dSub + 1.45)),
  };
}

// 将点沿水平镜像（当有效前景在右侧时，把左肩坐标系镜像到右侧）
const mirrorX = (u, rightSide) => (rightSide ? 1 - u : u);

// 三次贝塞尔采样工具，确保前景头颈肩轮廓顺滑自然如真实电影侧背影
function sampleCubic(p0, p1, p2, p3, steps, includeStart = false) {
  const out = [];
  for (let i = includeStart ? 0 : 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
    const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
    out.push([x, y]);
  }
  return out;
}

// 构建归一化画幅 [0..1]×[0..1] 内的全套实绘几何：
// 所有轮廓点、包围盒、视线、桌面、灯具均基于各向同性比例，宽窄屏都不会压扁圆头或扭曲人物。
export function computeFrameGeometry(state, aspect = 1.35) {
  const rightSide = effectiveSide(state) === "right";
  const offset = clamp(state.offset, -0.22, 0.98);
  const elev = clamp(state.elev, -0.48, 0.52);
  const focalMm = clamp(state.focalMm, 24, 105);
  const fStop = clamp(state.fStop, 1.4, 16);

  // 焦段缩放因子：50mm = 1.0；广角缩小远端主体、放大近端前景；长焦拉大远端主体、压缩空间
  const focalNorm = (focalMm - 50) / 50; // -0.52 .. +1.10
  const subScale = clamp(1.0 + focalNorm * 0.34, 0.72, 1.36);
  const fgScale = clamp(1.0 - focalNorm * 0.12, 0.84, 1.16);

  // 纵横比补偿：在较宽画幅上限制水平跨度，使人物比例保持真实电影感
  const aspectComp = clamp(1.12 / Math.max(0.85, aspect), 0.72, 1.12);

  // 相机横移（offset）：
  // 真实视差规律：机位越往前景人物背后切（offset 减小），前景头肩沿横轴滑进画面中央并与远端主体视线重合、直接遮挡面部；
  // offset = -0.12（开场错态）：前景后脑与肩沿直接遮住对方左侧面颊（遮挡 30%+，实绘占比 > 40%），呈 0/4 坏态；
  // offset = 0.36（经典过肩）：前景稳占左侧 22%–29%，主体面部完整清晰、视线净空充足；
  // offset >= 0.88（净单人）：前景完全退出画框（0% 残留）。
  const fgShiftX = (0.36 - offset) * 0.82;
  const subBaseU = clamp(0.68 + (offset - 0.36) * 0.12, 0.60, 0.72);

  // 高低机位（elev）：
  const subHeadV = clamp(0.41 + elev * 0.20, 0.25, 0.62);
  const fgHeadV = clamp(0.24 + elev * 0.16, 0.14, 0.44);

  // ---------- 1. 前景人物（完整自然头颅 + 两侧脖颈与双肩斜弧，哪怕拖进画面中央也绝无断层矩形） ----------
  const isFemaleFg = state.cam === "B";
  const headR = 0.132 * fgScale * aspectComp;
  const headRx = headR * 0.84;
  const headRy = headR * 1.16 * (aspect / 1.15);
  const fgHeadCx = 0.13 + fgShiftX;
  const fgHeadCy = fgHeadV;

  const rawFg = [];
  const leftShoulderEdge = fgHeadCx - headRx * 2.55;
  const topCrownY = fgHeadCy - headRy * 1.05;
  const backHeadMid = [fgHeadCx - headRx * 0.94, fgHeadCy - headRy * 0.08];
  const backNeck = [fgHeadCx - headRx * 0.62, fgHeadCy + headRy * 0.98];
  const sideBrow = [fgHeadCx + headRx * 0.88, fgHeadCy - headRy * 0.22];
  const cheekJaw = [fgHeadCx + headRx * 0.66, fgHeadCy + headRy * 0.68];
  const neckU = fgHeadCx + headRx * 0.38;
  const neckV = fgHeadCy + headRy * 1.08;

  // 左下身底角 -> 左侧外肩线顺滑上升至后颈凹（拖进画面中间时也呈现自然双肩剪影）
  rawFg.push([Math.min(-0.18, leftShoulderEdge), 1.22]);
  rawFg.push(
    ...sampleCubic(
      [leftShoulderEdge, 1.14],
      [fgHeadCx - headRx * 2.18, neckV + 0.14],
      [fgHeadCx - headRx * 1.48, neckV + 0.04],
      backNeck,
      8,
      true
    )
  );

  // 后颈曲线上绕后脑至发顶（平滑无棱角）
  rawFg.push(
    ...sampleCubic(
      backNeck,
      [fgHeadCx - headRx * 0.84, fgHeadCy + headRy * 0.56],
      [fgHeadCx - headRx * 0.98, fgHeadCy + headRy * 0.22],
      backHeadMid,
      6
    )
  );
  rawFg.push(
    ...sampleCubic(
      backHeadMid,
      [fgHeadCx - headRx * 0.90, topCrownY - headRy * 0.04],
      [fgHeadCx + headRx * 0.50, topCrownY - headRy * 0.06],
      sideBrow,
      10
    )
  );

  // 侧后脑 / 发廓平滑收束至颈凹（无五官轮廓）
  if (isFemaleFg) {
    rawFg.push(
      ...sampleCubic(
        sideBrow,
        [fgHeadCx + headRx * 1.02, fgHeadCy + headRy * 0.22],
        [fgHeadCx + headRx * 0.92, fgHeadCy + headRy * 0.82],
        [neckU + headRx * 0.12, neckV],
        8
      )
    );
  } else {
    rawFg.push(
      ...sampleCubic(
        sideBrow,
        [fgHeadCx + headRx * 0.95, fgHeadCy + headRy * 0.12],
        [fgHeadCx + headRx * 0.80, fgHeadCy + headRy * 0.48],
        cheekJaw,
        6
      )
    );
    rawFg.push(
      ...sampleCubic(
        cheekJaw,
        [fgHeadCx + headRx * 0.52, fgHeadCy + headRy * 0.86],
        [fgHeadCx + headRx * 0.40, fgHeadCy + headRy * 0.98],
        [neckU, neckV],
        5
      )
    );
  }

  // 标志性过肩大斜弧（1:1 承袭 305 原海报由颈窝垂落右下角的青柠光弧）
  const shMidU = fgHeadCx + headRx * (isFemaleFg ? 1.48 : 1.72);
  const shMidV = clamp(neckV + 0.09 + elev * 0.05, neckV + 0.06, 0.82);
  const shOuterU = fgHeadCx + headRx * (isFemaleFg ? 2.18 : 2.46);
  const shOuterV = clamp(shMidV + 0.16, shMidV + 0.09, 1.0);
  const shBotU = shOuterU + headRx * 0.28;

  const shoulderCurve = sampleCubic(
    [neckU, neckV],
    [shMidU, shMidV - 0.015],
    [shOuterU, shOuterV],
    [shBotU, 1.14],
    14,
    true
  );
  rawFg.push(...shoulderCurve.slice(1));
  rawFg.push([shBotU, 1.22]);

  const fgPoly = rawFg.map(([u, v]) => [mirrorX(u, rightSide), v]);
  const fgShoulderRim = shoulderCurve.map(([u, v]) => [mirrorX(u, rightSide), v]);

  // ---------- 2. 远端主体人物（无五官剪影：头廓、颈肩、上身坐姿） ----------
  const isFemaleSub = state.cam === "A"; // 机位 A 看女主体（原海报齐肩剪影），机位 B 看男主体
  const sHeadR = 0.056 * subScale * aspectComp;
  const sHeadRx = sHeadR * 0.88;
  const sHeadRy = sHeadR * 1.16 * (aspect / 1.15);
  const subCxRaw = subBaseU;
  const subCx = mirrorX(subCxRaw, rightSide);
  const subCy = subHeadV;

  // 主体面对前景人物（朝前景侧微偏）
  const faceDir = rightSide ? 1 : -1;
  // 对焦点位于主体侧脸剪影上（原海报青柠小圆点位置，不含五官细节）
  const focusPt = {
    u: subCx + faceDir * sHeadRx * 0.36,
    v: subCy - sHeadRy * 0.04,
  };

  // 主体面部与关键信息区包围盒（用于精确核算前景肩/后脑是否遮挡了说话者）
  const subFaceBox = {
    u0: subCx - sHeadRx * 1.02,
    u1: subCx + sHeadRx * 1.02,
    v0: subCy - sHeadRy * 1.02,
    v1: subCy + sHeadRy * 0.96,
  };

  // 视线虚线起点（从前景人物侧后脑位置越过肩部射向主体对焦点）
  const gazeFrom = {
    u: mirrorX(fgHeadCx + headRx * 0.82, rightSide),
    v: clamp(lerp(fgHeadCy + headRy * 0.25, focusPt.v, 0.45), 0.18, 0.82),
  };

  // 桌面高度与吊灯坐标（随俯仰与焦段联动）
  const tableY = clamp(subCy + sHeadRy * 3.15 - elev * 0.14, 0.56, 0.92);
  const horizonY = clamp(0.46 + elev * 0.24, 0.22, 0.76);
  const lampPt = {
    u: mirrorX(clamp(subCxRaw + 0.015, 0.56, 0.86), rightSide),
    v: clamp(0.18 + elev * 0.16 - focalNorm * 0.04, 0.07, 0.34),
    scale: clamp(0.88 + focalNorm * 0.22, 0.72, 1.18),
  };

  // 构造主体头部与上身路径（纯轮廓剪影）
  const subShoulderW = sHeadRx * (isFemaleSub ? 2.45 : 2.85);
  const subNeckV = subCy + sHeadRy * 1.02;
  const subBodyBottom = Math.min(1.04, tableY + 0.05);

  const optics = computeOpticalBlur(focalMm, fStop);

  return {
    rightSide,
    isFemaleFg,
    isFemaleSub,
    aspect,
    offset,
    elev,
    focalMm,
    fStop,
    fgPoly,
    fgShoulderRim,
    fgHead: { u: mirrorX(fgHeadCx, rightSide), v: fgHeadCy, rx: headRx, ry: headRy },
    subHead: { u: subCx, v: subCy, rx: sHeadRx, ry: sHeadRy },
    subBody: {
      cx: subCx,
      neckV: subNeckV,
      shoulderW: subShoulderW,
      shoulderV: subNeckV + sHeadRy * 0.56,
      bottomV: subBodyBottom,
    },
    subFaceBox,
    focusPt,
    gazeFrom,
    faceDir,
    tableY,
    horizonY,
    lampPt,
    optics,
  };
}

// 射线法判断点是否在闭合多边形内
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// 单真源评估：全部数值、诊断标题、白话原因、动作建议均从同一份实绘几何实时算得
export function evaluateShot(state, aspect = 1.35) {
  const geom = computeFrameGeometry(state, aspect);
  const { fgPoly, subFaceBox, subHead, optics, rightSide, focalMm, fStop, elev } = geom;

  // 1. 实绘前景肩占比（40×32 网格点采样，约 1280 次，精度 ±0.2%，耗时 < 0.08ms）
  const NX = 40, NY = 32;
  let fgHits = 0;
  for (let iy = 0; iy < NY; iy++) {
    const v = (iy + 0.5) / NY;
    for (let ix = 0; ix < NX; ix++) {
      const u = (ix + 0.5) / NX;
      if (pointInPoly(u, v, fgPoly)) fgHits++;
    }
  }
  const shoulderPct = Math.round((fgHits / (NX * NY)) * 100);

  // 2. 实绘前景与主体面部包围盒重叠占比（16×16 精细网格采样）
  const FN = 16;
  let faceHits = 0;
  for (let iy = 0; iy < FN; iy++) {
    const v = lerp(subFaceBox.v0, subFaceBox.v1, (iy + 0.5) / FN);
    for (let ix = 0; ix < FN; ix++) {
      const u = lerp(subFaceBox.u0, subFaceBox.u1, (ix + 0.5) / FN);
      if (pointInPoly(u, v, fgPoly)) faceHits++;
    }
  }
  const faceOverlapPct = Math.round((faceHits / (FN * FN)) * 100);

  // 3. 主体眼平线处与前景内沿的净空距离（归一化 %）
  let fgInnerAtEye = rightSide ? 1 : 0;
  for (let ix = 0; ix < 100; ix++) {
    const u = (ix + 0.5) / 100;
    if (pointInPoly(u, subHead.v, fgPoly)) {
      if (rightSide) fgInnerAtEye = Math.min(fgInnerAtEye, u);
      else fgInnerAtEye = Math.max(fgInnerAtEye, u);
    }
  }
  const faceNearEdge = rightSide ? subFaceBox.u1 : subFaceBox.u0;
  const lookGapPct = Math.round((rightSide ? fgInnerAtEye - faceNearEdge : faceNearEdge - fgInnerAtEye) * 100);

  // 4. 主体头顶与画框边缘净空
  const headroomPct = Math.round((subHead.v - subHead.ry) * 100);
  const farEdgePct = Math.round((rightSide ? subFaceBox.u0 : 1 - subFaceBox.u1) * 100);

  // 5. 四项核心判定（全部基于真实几何与薄透镜公式）
  const frameTooSmall = shoulderPct < 10;
  const frameTooLarge = shoulderPct > 36;
  const fgDetachedFromEdge = rightSide ? geom.fgHead.u < 0.64 : geom.fgHead.u > 0.36;
  const frameOk = !frameTooSmall && !frameTooLarge && !fgDetachedFromEdge;

  const faceBlocked = faceOverlapPct > 1;
  const edgeClipped = headroomPct < 3 || farEdgePct < 4;
  const clearanceOk = !faceBlocked && !edgeClipped;

  const wideDistort = focalMm <= 28 && shoulderPct > 33;
  const fgTooSharp = optics.blurNorm < 0.0085;
  const depthOk = !fgTooSharp && !wideDistort;

  const axisOk = state.axisValid !== false;

  const passCount = [frameOk, clearanceOk, depthOk, axisOk].filter(Boolean).length;

  // 6. 决定当前主诊断（按视觉破坏优先级，绝不写死模板）
  let code = "ok";
  let badge = "4/4 · 过肩成立";
  let headline = "";
  let reason = "";
  let action = "";
  let tone = "ok"; // "ok" | "bad"

  if (faceBlocked) {
    code = "blocked";
    tone = "bad";
    badge = `${passCount}/4 · 肩部遮脸 ${faceOverlapPct}%`;
    headline = `前景肩部切进了对方脸部 ${faceOverlapPct}%，关键表情被挡死`;
    reason = "过肩构图的前景是「画框」不是「屏障」。现在前景后脑与肩线直接盖在说话者面部上，视线还没跨过肩头就先撞墙，违反了原海报第一条实用建议「避免遮挡关键信息」。";
    action = rightSide
      ? "在画布上向左横拖把机位挪开（或把前景横移滑块往右拉），让肩线退回右缘 14%–32%。"
      : "在画布上向右横拖把机位挪开（或把前景横移滑块往右拉），让肩线退回左缘 14%–32%。";
  } else if (frameTooSmall) {
    code = "missing";
    tone = "bad";
    badge = `${passCount}/4 · 肩部脱框 ${shoulderPct}%`;
    headline = `前景肩只剩 ${shoulderPct}%，画面已退化成孤立单人镜头`;
    reason = "机位甩得太开，前景人物的肩部轮廓几乎掉出画框。没有足够的前景肩形作为空间锚点，观众就失去「坐在听话者身旁」的对话代入感。";
    action = "把画布往回拖一点（调小前景横移），把前景肩重新带回画面 14%–32% 的框定区。";
  } else if (frameTooLarge || fgDetachedFromEdge) {
    code = "crowded";
    tone = "bad";
    badge = `${passCount}/4 · 前景偏中 ${shoulderPct}%`;
    headline = `前景人物滑进画面中部（占 ${shoulderPct}%），背影成了抢戏主体`;
    reason = "过肩构图的前景人物必须贴靠画框一侧作为「天然画框」；一旦人物整个飘进画面中间，暗色背影就会把视觉重心抢走，远端说话者反而被挤到角落。";
    action = "把画布往外侧横拖（调大前景横移），把前景肩收回到画框一侧边缘 14%–32%。";
  } else if (edgeClipped) {
    code = "clipped";
    tone = "bad";
    badge = `${passCount}/4 · 主体贴边`;
    headline = headroomPct < 3 ? "主体头顶被画框上沿压紧，缺少呼吸空间" : "主体靠画框边缘太近，视线方向被截断";
    reason = "过肩镜头既要给前景留位，也要给远端主体留足头顶余量与视线前方空间；主体一旦撞边，画面立刻变得窒息失衡。";
    action = "上下或左右微调机位，把主体头部带回画面舒适的内框区域。";
  } else if (fgTooSharp) {
    code = "sharp";
    tone = "bad";
    badge = `${passCount}/4 · f/${fStop.toFixed(1)} 过锐`;
    headline = `光圈收到 f/${fStop.toFixed(1)}，前景肩缘太锐利在和主体抢戏`;
    reason = `当前焦段 ${Math.round(focalMm)}mm 搭配 f/${fStop.toFixed(1)}，前景虚化弥散仅 ${optics.cocMm.toFixed(2)}mm。前景发际线和衣领和远端主体一样清楚，前后景糊成一块平面，失去了原海报强调的「前景虚化，主体清晰」。`;
    action = "把光圈开大到 f/2.8 或 f/2.0（或者换用 50mm–85mm 焦段），立刻把前景肩化软。";
  } else if (wideDistort) {
    code = "wide";
    tone = "bad";
    badge = `${passCount}/4 · ${Math.round(focalMm)}mm 贴背膨大`;
    headline = `${Math.round(focalMm)}mm 超广角紧贴肩背，前景膨胀变形`;
    reason = "短焦镜头离前景太近会把肩头拉大，同时把对话者推到远处缩成小点，削弱了双人交流的亲密连结。";
    action = "把焦段推到 40mm–85mm 之间，或略拉开前景切入量。";
  } else if (!axisOk) {
    code = "axis";
    tone = "bad";
    badge = `${passCount}/4 · 正反打越轴`;
    headline = "单看这一帧没问题，但反打机位 B 已跨过 180° 轴线";
    reason = "过肩构图几乎总是成对出现在正反打里。现在机位 B 越过了双人视线轴线，按空格切镜到反打后，两位人物都会挤在画面同一侧朝同方向看，观众的空间感瞬间错乱。";
    action = "按空格试切一次感受跳戏，再点击「守 180° 轴线」把机位 B 归回同侧半区。";
  } else {
    // 全部 4/4 成立！根据真实俯仰角与焦段命名当下建立的叙事效果
    const angleTag = elev > 0.2 ? "高位俯压过肩" : elev < -0.18 ? "低位仰视过肩" : "平视对等过肩";
    const sizeTag = focalMm >= 64 ? "近景私密交谈" : focalMm <= 44 ? "中景关系交代" : "标准对话景别";
    badge = `4/4 · ${angleTag}`;
    headline = `过肩成立：${angleTag} × ${sizeTag}`;
    reason = `前景肩以 ${shoulderPct}% 柔和框住画侧（光圈 f/${fStop.toFixed(1)} 柔焦虚化），主体面部零遮挡且前方留出 ${Math.max(0, lookGapPct)}% 视线净空，A/B 正反打同守 180° 轴线。`;
    action = "可以按空格在正打 A 与反打 B 之间切换，或试着故意拉过头看看「肩部脱框 / 越轴」如何毁掉这一场戏。";
  }

  // 7. 原海报 5 枚原则探针各自的单真源状态
  const probes = {
    frame: {
      ok: frameOk && !faceBlocked,
      tag: faceBlocked
        ? `遮脸 ${faceOverlapPct}%`
        : frameTooSmall
        ? `脱框 ${shoulderPct}%`
        : frameTooLarge
        ? `过满 ${shoulderPct}%`
        : `占画 ${shoulderPct}%`,
    },
    depth: {
      ok: depthOk,
      tag: fgTooSharp
        ? `f/${fStop.toFixed(1)} 过锐`
        : wideDistort
        ? `${Math.round(focalMm)}mm 畸变`
        : `f/${fStop.toFixed(1)} 柔焦`,
    },
    conversation: {
      ok: axisOk && !frameTooSmall,
      tag: !axisOk ? "反打越轴" : frameTooSmall ? "失联单人" : "双人同轴",
    },
    gaze: {
      ok: clearanceOk && !frameTooSmall,
      tag: faceBlocked
        ? "视线受阻"
        : edgeClipped
        ? "边缘截断"
        : `净空 ${Math.max(0, lookGapPct)}%`,
    },
    immersion: {
      ok: passCount === 4,
      tag:
        passCount === 4
          ? elev > 0.2
            ? "高位压迫"
            : elev < -0.18
            ? "低位敬畏"
            : "临场共鸣"
          : `${passCount}/4 未达标`,
    },
  };

  // 心理距离档位（不报假精确百分比，用明确摄影档位）
  const intimacyTier =
    focalMm >= 68
      ? "紧贴亲密（长焦压近）"
      : focalMm >= 48
      ? "自然交谈（中焦平实）"
      : "疏离环境（广角拉开）";

  const angleTier =
    elev > 0.2
      ? "高位俯看（前主后弱）"
      : elev < -0.18
      ? "低位仰看（后主前弱）"
      : "平视对等（势均力敌）";

  return {
    geom,
    shoulderPct,
    faceOverlapPct,
    lookGapPct,
    headroomPct,
    farEdgePct,
    cocMm: optics.cocMm,
    blurNorm: optics.blurNorm,
    checks: { frameOk, clearanceOk, depthOk, axisOk },
    passCount,
    code,
    tone,
    badge,
    headline,
    reason,
    action,
    probes,
    intimacyTier,
    angleTier,
  };
}

// 辅助判断当前状态是否匹配某一个原海报预设（用于高亮底部 6 格胶片条）
export function matchPresetId(state) {
  for (const p of ANGLE_PRESETS) {
    const q = p.params;
    if (
      state.cam === q.cam &&
      state.axisValid === q.axisValid &&
      Math.abs(state.offset - q.offset) < 0.06 &&
      Math.abs(state.elev - q.elev) < 0.08 &&
      Math.abs(state.focalMm - q.focalMm) < 8 &&
      Math.abs(state.fStop - q.fStop) < 0.8
    ) {
      return p.id;
    }
  }
  return null;
}
