// 327 计白当黑构图 · 单真源几何与诊断模型
// 所有画面绘制、反拓验形镜、实测读数、三步线框与错误诊断，全部只读这份几何状态。

export const PALETTE = {
  ink: "#000616",
  inkPanel: "#091126",
  inkWell: "#101B36",
  white: "#FEFEFC",
  gold: "#FBD212",
  goldSoft: "#EEC821",
  goldDeep: "#8A6500",
  silver: "#C4C7CE",
  muted: "#969DAC",
  errDark: "#FF7E75",
  errLight: "#B3261E",
  okDark: "#5CE0B8",
  okLight: "#0F6D52",
  paper: "#F8F7F2",
  stone: "#EFECE4",
  slate: "#ECEFF3",
};

export const SCENES = {
  arch: {
    id: "arch",
    label: "原海报 · 拱门光道",
    short: "拱门光道",
    caption: "横拖刻形厚薄 · 拖白门洞调层次 · 拖光道尖顶正视线 · 拖圆黑眼稳重心",
    labels: {
      primary: "主形（留白）",
      primarySub: "拱门形状的留白成为画面的主形体",
      secondary: "次形（留白）",
      secondarySub: "门洞形成层次与空间纵深感",
      guide: "引导（留白）",
      guideSub: "路径状留白引导视线与节奏",
      eye: "黑眼（反计）",
    },
    broken: {
      carve: 0.12,
      portalX: 0.148,
      portalY: -0.155,
      pathAim: 0.25,
      eyeX: 0.265,
      eyeY: 0.305,
      eyeOn: true,
    },
    presets: [
      {
        id: "classic",
        label: "原海报正拱解",
        kind: "ok",
        state: { carve: 0.54, portalX: 0.0, portalY: 0.01, pathAim: 0.0, eyeX: 0.0, eyeY: 0.27, eyeOn: true },
      },
      {
        id: "oblique",
        label: "偏势斜门解",
        kind: "ok",
        state: { carve: 0.46, portalX: -0.028, portalY: 0.015, pathAim: -0.045, eyeX: -0.022, eyeY: 0.275, eyeOn: true },
      },
      {
        id: "bold",
        label: "厚白强张力解",
        kind: "ok",
        state: { carve: 0.68, portalX: 0.0, portalY: 0.015, pathAim: 0.01, eyeX: 0.0, eyeY: 0.285, eyeOn: true },
      },
      {
        id: "flood",
        label: "试错：白漫吞黑",
        kind: "err",
        state: { carve: 0.97, portalX: 0.0, portalY: -0.05, pathAim: 0.0, eyeX: 0.0, eyeY: 0.28, eyeOn: true },
      },
      {
        id: "noeye",
        label: "试错：撤黑眼发闷",
        kind: "err",
        state: { carve: 0.54, portalX: 0.0, portalY: 0.01, pathAim: 0.0, eyeX: 0.0, eyeY: 0.27, eyeOn: false },
      },
    ],
  },
  seal: {
    id: "seal",
    label: "篆刻 · 朱白山门印",
    short: "朱白印章",
    caption: "横拖刀宽计白 · 拖中宫白庭调疏密 · 拖气口通廊正中轴 · 拖压脚实块稳印面",
    labels: {
      primary: "密处（不透风）",
      primarySub: "上半篆画紧收，蓄住黑量与边势",
      secondary: "疏处（可走马）",
      secondarySub: "中宫刻出完整白庭，呼吸豁然打开",
      guide: "气口（贯印轴）",
      guideSub: "下廊白道承接中宫，直贯印底",
      eye: "印石压脚（反计）",
    },
    broken: {
      carve: 0.09,
      portalX: 0.12,
      portalY: -0.145,
      pathAim: 0.23,
      eyeX: 0.265,
      eyeY: 0.29,
      eyeOn: true,
    },
    presets: [
      {
        id: "classic",
        label: "疏密平衡印解",
        kind: "ok",
        state: { carve: 0.54, portalX: 0.0, portalY: 0.01, pathAim: 0.0, eyeX: 0.0, eyeY: 0.25, eyeOn: true },
      },
      {
        id: "oblique",
        label: "左密右疏印解",
        kind: "ok",
        state: { carve: 0.49, portalX: 0.025, portalY: 0.02, pathAim: 0.035, eyeX: 0.02, eyeY: 0.255, eyeOn: true },
      },
      {
        id: "bold",
        label: "宽刀满白解",
        kind: "ok",
        state: { carve: 0.69, portalX: 0.0, portalY: 0.02, pathAim: 0.0, eyeX: 0.0, eyeY: 0.265, eyeOn: true },
      },
      {
        id: "flood",
        label: "试错：刀宽破边",
        kind: "err",
        state: { carve: 0.95, portalX: 0.0, portalY: -0.04, pathAim: 0.0, eyeX: 0.0, eyeY: 0.25, eyeOn: true },
      },
      {
        id: "noeye",
        label: "试错：下白虚浮",
        kind: "err",
        state: { carve: 0.54, portalX: 0.0, portalY: 0.01, pathAim: 0.0, eyeX: 0.0, eyeY: 0.25, eyeOn: false },
      },
    ],
  },
  mark: {
    id: "mark",
    label: "标识 · 负形箭字标",
    short: "负形字标",
    caption: "横拖字距咬合出箭 · 拖右字校正箭头中线 · 拖尾翼调入眼流向 · 拖左锚点平衡重心",
    labels: {
      primary: "正形字块",
      primarySub: "几何字母 E 与 X 围出清晰边界",
      secondary: "负形白箭（次形）",
      secondarySub: "字距咬合后，空白自然闭合为向右箭头",
      guide: "箭尾导流",
      guideSub: "底廊白带引视线汇入箭身",
      eye: "压衡墨点",
    },
    broken: {
      carve: 0.08,
      portalX: 0.12,
      portalY: -0.135,
      pathAim: 0.24,
      eyeX: 0.26,
      eyeY: 0.295,
      eyeOn: true,
    },
    presets: [
      {
        id: "classic",
        label: "咬合白箭解",
        kind: "ok",
        state: { carve: 0.55, portalX: 0.0, portalY: 0.01, pathAim: 0.0, eyeX: 0.0, eyeY: 0.255, eyeOn: true },
      },
      {
        id: "oblique",
        label: "紧凑锐箭解",
        kind: "ok",
        state: { carve: 0.45, portalX: -0.02, portalY: 0.015, pathAim: -0.03, eyeX: -0.015, eyeY: 0.255, eyeOn: true },
      },
      {
        id: "bold",
        label: "厚体海报标解",
        kind: "ok",
        state: { carve: 0.70, portalX: 0.0, portalY: 0.02, pathAim: 0.01, eyeX: 0.0, eyeY: 0.27, eyeOn: true },
      },
      {
        id: "flood",
        label: "试错：字散箭断",
        kind: "err",
        state: { carve: 0.96, portalX: 0.0, portalY: -0.05, pathAim: 0.0, eyeX: 0.0, eyeY: 0.255, eyeOn: true },
      },
      {
        id: "noeye",
        label: "试错：无锚右飘",
        kind: "err",
        state: { carve: 0.55, portalX: 0.0, portalY: 0.01, pathAim: 0.0, eyeX: 0.0, eyeY: 0.255, eyeOn: false },
      },
    ],
  },
};

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function createInitialState(scene = "arch") {
  const s = SCENES[scene] || SCENES.arch;
  return {
    scene: s.id,
    ...s.broken,
    inverted: false,
    showGuides: true,
  };
}

// 统一世界坐标系：x ∈ [-0.54, 0.54]，y ∈ [-0.52, 0.52]
// 无论哪种画幅比例，均使用等比缩放，圆永远是正圆。
export function buildGeometry(state) {
  const carve = clamp(state.carve, 0.06, 1.0);
  const portalX = clamp(state.portalX, -0.22, 0.22);
  const portalY = clamp(state.portalY, -0.20, 0.20);
  const pathAim = clamp(state.pathAim, -0.32, 0.32);
  const eyeX = clamp(state.eyeX, -0.28, 0.28);
  const eyeY = clamp(state.eyeY, 0.14, 0.38);

  // 1. 主形拱门几何（1:1 对应 327 原海报结构比例）
  const archCx = 0.0;
  const archCy = -0.145;
  const outerR = 0.215 + carve * 0.255; // 0.230 .. 0.470
  const wallT = 0.026 + carve * 0.215;  // 0.039 .. 0.241
  const innerR = Math.max(0.088, outerR - wallT);
  const legBottomOuter = 0.155 + carve * 0.175; // 拱脚外沿 y
  const legBottomInner = 0.095 + carve * 0.115; // 拱脚斜切内沿 y

  // 2. 次形门洞几何（嵌于黑腔内的白色竖门）
  const portalW = 0.044 + carve * 0.036;
  const portalHalfW = portalW / 2;
  const portalTopR = portalHalfW;
  const portalTopCy = portalY - 0.045;
  const portalBaseY = Math.max(portalY + 0.068, 0.095);

  // 3. 引导光道几何（下展曲底纯白三角通道）
  const apexX = pathAim;
  const apexY = 0.07 - carve * 0.075;
  const baseHalfW = 0.245 + carve * 0.375; // 底部展开半宽
  const baseY = 0.445;
  const baseCenterX = pathAim * 0.34;
  const leftFoot = { x: clamp(baseCenterX - baseHalfW, -0.535, -0.05), y: baseY - 0.025 };
  const rightFoot = { x: clamp(baseCenterX + baseHalfW, 0.05, 0.535), y: baseY - 0.005 };
  const bottomCtrl = { x: baseCenterX, y: baseY + 0.065 };

  // 4. 黑眼圆（白中有黑的反计平衡点）
  const eyeR = 0.056 + carve * 0.022;

  // 5. 篆刻与标识共享参数（由 buildGeometry 统一计算，isWhiteAt 与 drawComposition 共读）
  const sealOuter = 0.42;
  const sealRim = Math.max(0.0, 0.032 * (1 - carve * 1.15));
  const sealInner = sealOuter - sealRim;
  const sealBandW = 0.015 + carve * 0.105;
  const sealCourtHalfW = 0.062 + carve * 0.135;
  const sealCourtH = 0.12 + carve * 0.11;

  const markGap = 0.018 + carve * 0.115;
  const markUpperTop = -0.34 - carve * 0.06;
  const markUpperBot = 0.05 + carve * 0.06;

  return {
    scene: state.scene,
    carve,
    inverted: !!state.inverted,
    showGuides: !!state.showGuides,
    arch: {
      cx: archCx,
      cy: archCy,
      outerR,
      innerR,
      wallT,
      legBottomOuter,
      legBottomInner,
    },
    portal: {
      x: portalX,
      y: portalY,
      halfW: portalHalfW,
      topCy: portalTopCy,
      topR: portalTopR,
      baseY: portalBaseY,
    },
    path: {
      apex: { x: apexX, y: apexY },
      leftFoot,
      rightFoot,
      bottomCtrl,
      baseCenterX,
      baseY,
    },
    eye: {
      x: eyeX,
      y: eyeY,
      r: eyeR,
      on: !!state.eyeOn,
    },
    seal: {
      outer: sealOuter,
      inner: sealInner,
      bandW: sealBandW,
      courtHalfW: sealCourtHalfW,
      courtH: sealCourtH,
    },
    mark: {
      gap: markGap,
      upperTop: markUpperTop,
      upperBot: markUpperBot,
    },
  };
}

// 点到线段距离与有向边距
function distPointToSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const l2 = vx * vx + vy * vy || 1e-9;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1);
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

// 判断点是否在拱门白壁内（严格与绘制路径一致）
function inArchWhite(x, y, a) {
  const dx = x - a.cx;
  const dy = y - a.cy;
  if (y <= a.cy) {
    const r = Math.hypot(dx, dy);
    return r <= a.outerR && r >= a.innerR;
  }
  const ax = Math.abs(dx);
  if (ax > a.outerR || ax < a.innerR) return false;
  // 拱脚底边从 (innerR, legBottomInner) 斜接到 (outerR, legBottomOuter)
  const frac = (ax - a.innerR) / Math.max(0.001, a.outerR - a.innerR);
  const bottomLimit = a.legBottomInner + frac * (a.legBottomOuter - a.legBottomInner);
  return y <= bottomLimit;
}

// 判断点是否在次形门洞白体内
function inPortalWhite(x, y, p) {
  const dx = x - p.x;
  if (Math.abs(dx) > p.halfW) return false;
  if (y >= p.topCy && y <= p.baseY) return true;
  if (y < p.topCy) {
    return Math.hypot(dx, y - p.topCy) <= p.topR;
  }
  return false;
}

// 底部曲边 y(x) 近似：二次贝塞尔曲线在 x 处高度
function pathBottomY(x, path) {
  const t = clamp((x - path.leftFoot.x) / Math.max(0.01, path.rightFoot.x - path.leftFoot.x), 0, 1);
  const omt = 1 - t;
  return omt * omt * path.leftFoot.y + 2 * omt * t * path.bottomCtrl.y + t * t * path.rightFoot.y;
}

// 判断点是否在底部引导白道内
function inPathWhite(x, y, path) {
  const { apex, leftFoot, rightFoot } = path;
  if (y < apex.y) return false;
  const botY = pathBottomY(x, path);
  if (y > botY) return false;
  // 左侧斜边 x_left(y)
  const tyL = (y - apex.y) / Math.max(0.001, leftFoot.y - apex.y);
  const xL = apex.x + tyL * (leftFoot.x - apex.x);
  // 右侧斜边 x_right(y)
  const tyR = (y - apex.y) / Math.max(0.001, rightFoot.y - apex.y);
  const xR = apex.x + tyR * (rightFoot.x - apex.x);
  return x >= xL && x <= xR;
}

// 统一像素白点查询：三个场景全部共用同一套严格单真源采样
export function isWhiteAt(x, y, geo) {
  const { arch, portal, path, eye, scene, carve } = geo;

  if (scene === "arch") {
    if (eye.on && Math.hypot(x - eye.x, y - eye.y) <= eye.r) return false;
    return inArchWhite(x, y, arch) || inPortalWhite(x, y, portal) || inPathWhite(x, y, path);
  }

  if (scene === "seal") {
    const { outer, inner: innerBound, bandW, courtHalfW, courtH } = geo.seal;
    if (Math.abs(x) > outer || Math.abs(y) > outer) return false;
    if (Math.abs(x) > innerBound || Math.abs(y) > innerBound) return false;
    if (eye.on && Math.abs(x - eye.x) <= eye.r * 0.85 && Math.abs(y - eye.y) <= eye.r * 0.76) return false;
    const topBarY = -0.27;
    const midBarY = -0.14;
    const inTopSlots =
      (Math.abs(y - topBarY) < bandW * 0.6 && Math.abs(x) < innerBound - 0.03) ||
      (Math.abs(x - -0.22) < bandW * 0.7 && y > -innerBound + 0.03 && y < 0.06) ||
      (Math.abs(x - 0.22) < bandW * 0.7 && y > -innerBound + 0.03 && y < 0.06) ||
      (Math.abs(y - midBarY) < bandW * 0.54 && Math.abs(x) < 0.22);
    const courtTop = portal.y - courtH * 0.48;
    const courtBot = portal.y + courtH * 0.52;
    const inCourt = Math.abs(x - portal.x) <= courtHalfW && y >= courtTop && y <= courtBot;
    const inCorridor = inPathWhite(x, y, {
      ...path,
      apex: { x: path.apex.x, y: 0.02 - carve * 0.08 },
      leftFoot: { x: clamp(path.baseCenterX - (0.2 + carve * 0.28), -innerBound + 0.005, -0.04), y: innerBound - 0.01 },
      rightFoot: { x: clamp(path.baseCenterX + (0.2 + carve * 0.28), 0.04, innerBound - 0.005), y: innerBound - 0.01 },
      bottomCtrl: { x: path.baseCenterX, y: innerBound },
    });
    return inTopSlots || inCourt || inCorridor;
  }

  // scene === "mark"（标识 · 负形箭字标）
  if (eye.on && Math.hypot(x - eye.x, y - eye.y) <= eye.r * 0.88) return false;
  const gap = geo.mark.gap;
  const inUpperWhite =
    y >= geo.mark.upperTop &&
    y <= geo.mark.upperBot &&
    x >= -0.40 &&
    x <= 0.40 &&
    (() => {
      const eRight = -gap * 0.5;
      const eLeft = -0.39;
      const barThick = 0.095 - carve * 0.04;
      const inEStem = x >= eLeft && x <= eLeft + (0.095 - carve * 0.035);
      const inETop = x >= eLeft && x <= eRight && y >= -0.32 && y <= -0.32 + barThick;
      const inEMid = x >= eLeft && x <= eRight - 0.03 && y >= -0.18 && y <= -0.18 + barThick * 0.82;
      const inEBot = x >= eLeft && x <= eRight && y >= 0.03 - barThick && y <= 0.03;
      if (inEStem || inETop || inEMid || inEBot) return false;
      const xLeft = gap * 0.5 + portal.x * 0.55;
      const xMidY = -0.145 + (portal.y - 0.01) * 0.8;
      if (x >= xLeft && x <= 0.39) {
        const dy = Math.abs(y - xMidY);
        const tipX = xLeft + 0.145 + carve * 0.065;
        const slope = 0.92;
        const inArrowNotch = x < tipX && dy < (tipX - x) * slope;
        if (!inArrowNotch) return false;
      }
      return y >= -0.29 - carve * 0.05 && y <= 0.01 + carve * 0.05 && x >= eLeft + 0.06 && x <= 0.34;
    })();
  const inLowerRibbon = inPathWhite(x, y, path);
  return inUpperWhite || inLowerRibbon;
}

// 48×44 单真源掩码统计（每帧开销 < 0.15ms）：
// 按各题材真实画心区实测白面积占比、黑面积占比、黑白共边接触率
function sampleMask(geo) {
  const cols = 48;
  const rows = 44;
  const bx = geo.scene === "seal" ? geo.seal.outer : geo.scene === "mark" ? 0.44 : 0.48;
  const by = geo.scene === "seal" ? geo.seal.outer : geo.scene === "mark" ? 0.44 : 0.46;
  let whiteCount = 0;
  let edgeTransitions = 0;
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const y = -by + ((r + 0.5) / rows) * (by * 2);
    for (let c = 0; c < cols; c++) {
      const x = -bx + ((c + 0.5) / cols) * (bx * 2);
      const w = isWhiteAt(x, y, geo) ? 1 : 0;
      grid[r * cols + c] = w;
      if (w) whiteCount++;
      if (c > 0 && w !== grid[r * cols + c - 1]) edgeTransitions++;
      if (r > 0 && w !== grid[(r - 1) * cols + c]) edgeTransitions++;
    }
  }
  const total = cols * rows;
  const whiteRatio = whiteCount / total;
  const blackRatio = 1 - whiteRatio;
  const contourDensity = edgeTransitions / (cols * rows);
  return { whiteRatio, blackRatio, contourDensity };
}

// 计算黑眼到白道边界的最小安全内距（> 0 表示完全包在白块内部；<= 0 表示破边漏气）
function computeEyeEnclosure(geo) {
  const { path, eye, scene, carve } = geo;
  if (!eye.on) return { inside: false, margin: -1, status: "missing" };

  let p = path;
  if (scene === "seal") {
    const outer = 0.41;
    const rim = 0.025 + (1 - carve) * 0.03;
    const innerBound = outer - Math.max(0.0, rim - Math.max(0, carve - 0.82) * 0.18);
    p = {
      ...path,
      apex: { x: path.apex.x, y: 0.04 },
      leftFoot: { x: clamp(path.baseCenterX - (0.19 + carve * 0.21), -innerBound + 0.01, -0.04), y: innerBound - 0.02 },
      rightFoot: { x: clamp(path.baseCenterX + (0.19 + carve * 0.21), 0.04, innerBound - 0.01), y: innerBound - 0.02 },
      bottomCtrl: { x: path.baseCenterX, y: innerBound - 0.01 },
    };
  }

  const inTri = inPathWhite(eye.x, eye.y, p);
  const dLeft = distPointToSeg(eye.x, eye.y, p.apex.x, p.apex.y, p.leftFoot.x, p.leftFoot.y);
  const dRight = distPointToSeg(eye.x, eye.y, p.apex.x, p.apex.y, p.rightFoot.x, p.rightFoot.y);
  const botY = pathBottomY(eye.x, p);
  const dBot = botY - eye.y;
  const minEdge = Math.min(dLeft, dRight, dBot);
  const effR = scene === "seal" ? eye.r * 0.84 : scene === "mark" ? eye.r * 0.88 : eye.r;
  const clearance = inTri ? minEdge - effR : -minEdge - effR;
  return {
    inside: inTri && clearance >= 0.012,
    margin: clearance,
    status: !inTri || clearance < 0.012 ? "breach" : "ok",
  };
}

// 计算次形门洞（或中宫/箭尖）与外拱（主形）的隔离净距
function computeLayerSeparation(geo) {
  const { arch, portal, scene } = geo;
  if (scene === "arch") {
    // 门洞顶圆心 (portal.x, portal.topCy) 到拱腔内圆壁的距离
    const topCenterDist = Math.hypot(portal.x - arch.cx, portal.topCy - arch.cy);
    const radialClearance = arch.innerR - (topCenterDist + portal.topR);
    // 门洞左右竖壁到拱腔内侧壁的水平净距
    const sideClearance = arch.innerR - (Math.abs(portal.x - arch.cx) + portal.halfW);
    const minBlackGap = Math.min(radialClearance, sideClearance);
    const detached = portal.y > 0.115;
    const collided = minBlackGap < 0.018;
    return {
      gap: Math.max(0, minBlackGap),
      collided,
      detached,
      ok: !collided && !detached,
    };
  }
  if (scene === "seal") {
    // 中宫白庭应稳落于密画下方、外框之内
    const collidedTop = portal.y < -0.055;
    const collidedSide = Math.abs(portal.x) > 0.085;
    const detached = portal.y > 0.105;
    const gap = collidedTop ? 0 : Math.max(0, 0.055 + portal.y);
    return {
      gap,
      collided: collidedTop || collidedSide,
      detached,
      ok: !collidedTop && !collidedSide && !detached,
    };
  }
  // mark: 检查 X 左尖角与 E 中横的垂直/水平咬合
  const yOff = Math.abs(portal.y - 0.01);
  const xOff = Math.abs(portal.x);
  const collided = yOff > 0.055 || xOff > 0.075;
  const gap = Math.max(0, 0.06 - Math.max(yOff, xOff));
  return {
    gap,
    collided,
    detached: false,
    ok: !collided,
  };
}

// 计算引导光道指向门洞/目标中心的偏转角度（度）
function computeGazeAngle(geo) {
  const { path, portal } = geo;
  const targetX = portal.x;
  const targetY = portal.y - 0.03;
  // 路径轴线：从底中 (baseCenterX, baseY) 指向上顶 (apex.x, apex.y)
  const ux = path.apex.x - path.baseCenterX;
  const uy = path.apex.y - path.baseY;
  // 目标方向：从底中指向门洞中心
  const tx = targetX - path.baseCenterX;
  const ty = targetY - path.baseY;
  const a1 = Math.atan2(ux, -uy);
  const a2 = Math.atan2(tx, -ty);
  const deg = ((a1 - a2) * 180) / Math.PI;
  const apexOffset = Math.abs(path.apex.x - portal.x);
  return {
    deg: Math.round(deg),
    absDeg: Math.abs(deg),
    apexOffset,
    ok: Math.abs(deg) <= 9.5 && apexOffset <= 0.075,
  };
}

// 总诊断函数：单一真相来源，输出 4 项硬检测、总分、主错态、白话解释、下一步指引与读数
export function evaluate(state) {
  const geo = buildGeometry(state);
  const mask = sampleMask(geo);
  const layer = computeLayerSeparation(geo);
  const gaze = computeGazeAngle(geo);
  const eye = computeEyeEnclosure(geo);

  const whitePct = Math.round(mask.whiteRatio * 100);
  const blackPct = 100 - whitePct;

  // 1. 留白即形（白占面积与形体扎实度：经验参考 24%–60%）
  const formTooThin = whitePct < 24;
  const formFlooded = whitePct > 60;
  const formOk = !formTooThin && !formFlooded;

  // 2. 层次嵌套（主形—黑腔—次形分离）
  const layerOk = layer.ok;

  // 3. 视线引导（路径对准次形门洞）
  const guideOk = gaze.ok;

  // 4. 黑白反计（黑眼稳居白道内，不破边、不缺席）
  const balanceOk = eye.status === "ok";

  const checks = [formOk, layerOk, guideOk, balanceOk];
  const score = checks.filter(Boolean).length;

  // 按严重优先级判定主诊断
  let code = "ok";
  let badge = `${score}/4 · 计白成形`;
  let headline = "";
  let body = "";
  let nextStep = "";
  let tensionLabel = "黑白相生（示意）";

  if (formFlooded) {
    code = "flood";
    badge = `${score}/4 · 白漫吞黑`;
    headline = `白块胀到 ${whitePct}%，黑地退化成边角碎屑`;
    body =
      "原海报强调「黑与白相互依存，产生张力」。当白体膨胀占去六成以上画幅，玄墨底被挤到边角，白形失去清晰的黑色托底与轮廓约束，整幅图反而发虚发散。";
    nextStep = "在画布空白处向左横拖（或按 ← 键），把白形收回到 28%–56% 经验参考带，让黑腔重新立住。";
    tensionLabel = "白漫失骨（示意）";
  } else if (formTooThin) {
    code = "thin";
    badge = `${score}/4 · 黑压白碎`;
    headline = `白体只占 ${whitePct}%，细得像线框而不是形体`;
    body =
      "原海报第一条写着「留白即形：空白是形体，不是背景」。现在白块被黑地压成窄缝，在「反拓验形镜」里也只剩几根细骨，撑不起画面的主导力量。";
    nextStep = "在画布上向右横拖（或按 → 键），把白色形体刻厚到 28%–56% 区间，让白块长出实心体量。";
    tensionLabel = "黑压窒息（示意）";
  } else if (!layerOk) {
    code = layer.detached ? "detached" : "merged";
    badge = `${score}/4 · ${layer.detached ? "次形脱节" : "主次粘连"}`;
    headline = layer.detached
      ? "次形白门洞滑出黑腔，与主拱断成两截"
      : geo.scene === "mark"
        ? "左右字母上下错位，负形箭头被折断"
        : "次形白门洞撞进外拱白壁，黑腔被挤破并块";
    body = layer.detached
      ? "次形脱离了主拱黑腔的怀抱，上下两段白块失去嵌套包抄，空间纵深感一下变平。"
      : geo.scene === "mark"
        ? "负形箭依赖左右笔画共享一条干净的闭合轮廓。一旦错位，中间空白就从锐利箭头散成无意义梯形。"
        : "「主形—黑腔—次形」必须靠一圈连续的黑缝隔开层次。现在白门洞紧贴甚至融进外拱壁，双层拱门塌成一坨白块。";
    nextStep = "直接拖动次形白门洞（或右字）回到黑腔中段，让周围留出均匀黑缝，再看反拓镜里的独立轮廓。";
    tensionLabel = "层次塌陷（示意）";
  } else if (!guideOk) {
    code = "skew";
    badge = `${score}/4 · 视线跑偏`;
    headline = `引导白道偏轴 ${Math.abs(gaze.deg)}°，视线被甩向暗角`;
    body =
      "原海报第三条讲「利用留白的形状组织视觉流向」。现在底部白色光道斜指向外，读者沿着最亮的白块往上走，却撞进黑暗边缘，进不了拱门门洞。";
    nextStep = "拖动白道顶端的金色菱点，把光道尖顶正对次形门洞中心（偏角收进 ±9° 内）。";
    tensionLabel = "导向分叉（示意）";
  } else if (!balanceOk) {
    code = eye.status === "missing" ? "flat" : "breach";
    badge = `${score}/4 · ${eye.status === "missing" ? "下白发闷" : "黑眼破边"}`;
    headline =
      eye.status === "missing"
        ? "整片下白缺少黑眼反计，底部发沉发闷"
        : "圆黑眼压破了白道边沿，形体轮廓漏气";
    body =
      eye.status === "missing"
        ? "大片纯白通道里如果没有一枚黑色圆眼「白中有黑」地压住节奏，视觉重量会整块往下坠，黑白互嵌的灵气会弱掉一大截。"
        : "黑眼越界切开了白道的斜边轮廓，在「反拓验形镜」里能一眼看到白形侧面缺了一大口，完整的引导三角被咬破。";
    nextStep =
      eye.status === "missing"
        ? "点击下方「黑眼反计：开」放回圆黑眼，并让它稳稳落在白道内部。"
        : "把圆黑眼向白道腹地拖回，让四周留出清晰的白边包裹，修补漏气的轮廓。";
    tensionLabel = eye.status === "missing" ? "大片平板（示意）" : "轮廓破口（示意）";
  } else {
    code = "ok";
    const isOblique = Math.abs(geo.portal.x) > 0.012 || Math.abs(geo.path.apex.x) > 0.015;
    badge = `4/4 · ${isOblique ? "偏势成形" : "计白成形"}`;
    headline = isOblique
      ? `黑白 ${blackPct}:${whitePct} 偏势平衡，白形独立且通路贯通`
      : `黑白 ${blackPct}:${whitePct} 相生，每一块白都立成了实心形体`;
    body =
      "现在点击右上角「翻转黑白」或细看反拓验形镜：即使黑底变白纸、白形变黑墨，拱门主形、内腔次形、下展光道与白中黑眼依然干净完整，没有任何多余边角料。";
    nextStep = "试试点击「翻转黑白」亲自验形，或切换到「篆刻朱白印 / 负形箭字标」检验同一套法则。";
    tensionLabel = whitePct >= 46 ? "厚白强张力（示意）" : "黑白相生（示意）";
  }

  // 三枚原海报知识点状态（直接映射左栏三枚明黄几何线标）
  const pillarStates = {
    form: formOk ? { ok: true, tag: `白占 ${whitePct}%` } : { ok: false, tag: formFlooded ? `过满 ${whitePct}%` : `偏瘦 ${whitePct}%` },
    balance:
      balanceOk && layerOk
        ? { ok: true, tag: `${blackPct}:${whitePct} 相生` }
        : { ok: false, tag: !layerOk ? (layer.detached ? "次形脱节" : "主次粘连") : eye.status === "missing" ? "缺黑反计" : "黑眼破边" },
    guide: guideOk ? { ok: true, tag: `偏角 ${Math.abs(gaze.deg)}°` } : { ok: false, tag: `偏轴 ${Math.abs(gaze.deg)}°` },
  };

  // 原海报「构图步骤 1→2→3」完成进度
  const steps = {
    s1: formOk,
    s2: formOk && layerOk,
    s3: score === 4,
  };

  return {
    geo,
    mask,
    layer,
    gaze,
    eye,
    whitePct,
    blackPct,
    score,
    checks: { formOk, layerOk, guideOk, balanceOk },
    code,
    badge,
    headline,
    body,
    nextStep,
    tensionLabel,
    pillarStates,
    steps,
  };
}
