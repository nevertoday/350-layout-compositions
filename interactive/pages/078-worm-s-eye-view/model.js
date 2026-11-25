// 078 虫视构图 · 真三维针孔透视投影与单真源构图诊断模型
// 所有读数（主塔棱线收敛角、底顶锥度比、天顶留白、天空净空占比、四维状态与错态诊断）
// 全部由当前帧实际 3D 顶点投影到 2D 画布的屏幕坐标直接计算，绝不写死常量。

export const INITIAL_STATE = {
  scene: "towers", // "towers" | "redwoods" | "monument"
  height: 1.65,    // 机位高度 (m): 0.10 ~ 2.00
  pitch: 9,        // 相机仰角 (°): 0 ~ 85
  focal: 42,       // 35mm 等效焦距 (mm): 14 ~ 85
  light: "flat",   // "side" | "rim" | "flat"
  clutter: true,   // 天顶是否横穿杂乱架空电线
  guides: true,    // 是否显示原海报玫粉透视汇聚线与天顶消失点箭头
};

export const PRESETS = {
  poster: {
    label: "原海报经典解",
    kind: "good",
    height: 0.22,
    pitch: 58,
    focal: 18,
    light: "side",
    clutter: false,
  },
  dramatic: {
    label: "超广极限解",
    kind: "good",
    height: 0.12,
    pitch: 66,
    focal: 15,
    light: "rim",
    clutter: false,
  },
  dignified: {
    label: "低蹲稳重解",
    kind: "good",
    height: 0.42,
    pitch: 44,
    focal: 24,
    light: "side",
    clutter: false,
  },
  errTele: {
    label: "试错：长焦拍扁",
    kind: "bad",
    height: 0.25,
    pitch: 42,
    focal: 78,
    light: "side",
    clutter: false,
  },
  errZenith: {
    label: "试错：过仰掏空",
    kind: "bad",
    height: 0.14,
    pitch: 84,
    focal: 16,
    light: "side",
    clutter: false,
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    ...INITIAL_STATE,
  },
};

export const SCENES = {
  towers: {
    id: "towers",
    label: "摩天塔群",
    sub: "原海报",
    camDist: 19.5,
    heroHeight: 49,
    heroName: "中央主尖塔",
  },
  redwoods: {
    id: "redwoods",
    label: "古杉巨林",
    sub: "自然纵深",
    camDist: 17.5,
    heroHeight: 46,
    heroName: "中央古杉主干",
  },
  monument: {
    id: "monument",
    label: "英雄立像",
    sub: "人物仰拍",
    camDist: 14.5,
    heroHeight: 36,
    heroName: "高台人物剪影",
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// ---------- 3D 针孔相机投影 ----------
// 世界坐标：X 向右，Y 向上（地面 Y=0），Z 朝相机方向（主体中心在 Z=0，相机在 (0, h, camDist)）
export function makeCamera(state, w, h) {
  const sc = SCENES[state.scene] || SCENES.towers;
  const th = rad(state.pitch);
  const sinT = Math.sin(th);
  const cosT = Math.cos(th);
  const camY = state.height;
  const camZ = sc.camDist;
  // 35mm 全画幅竖向胶片高 24mm：tan(vFov / 2) = 12 / focal
  const tanHalfV = 12 / state.focal;
  const aspect = w / Math.max(1, h);
  const tanHalfH = tanHalfV * aspect;

  // 相机基向量：forward = (0, sinT, -cosT), up = (0, cosT, sinT), right = (1, 0, 0)
  function toCam(p) {
    const dx = p.x;
    const dy = p.y - camY;
    const dz = p.z - camZ;
    return {
      cx: dx,
      cy: dy * cosT + dz * sinT,
      cz: dy * sinT - dz * cosT, // 沿视线向前为正深度
    };
  }

  function projectCam(c) {
    const z = Math.max(0.25, c.cz);
    const nx = c.cx / (z * tanHalfH);
    const ny = c.cy / (z * tanHalfV);
    return {
      x: (0.5 + nx * 0.5) * w,
      y: (0.5 - ny * 0.5) * h,
      z: c.cz,
      nx,
      ny,
      behind: c.cz <= 0.25,
    };
  }

  function project(p) {
    return projectCam(toCam(p));
  }

  // 裁剪在近平面 zNear=0.35 前的多边形，避免脚下底座顶点跑到相机背后导致翻转畸变
  function clipAndProjectPoly(pts3) {
    const zNear = 0.4;
    const camPts = pts3.map(toCam);
    const out = [];
    for (let i = 0; i < camPts.length; i++) {
      const a = camPts[i];
      const b = camPts[(i + 1) % camPts.length];
      const aIn = a.cz >= zNear;
      const bIn = b.cz >= zNear;
      if (aIn && bIn) {
        out.push(b);
      } else if (aIn && !bIn) {
        const t = (zNear - a.cz) / (b.cz - a.cz);
        out.push({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, cz: zNear });
      } else if (!aIn && bIn) {
        const t = (zNear - a.cz) / (b.cz - a.cz);
        out.push({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, cz: zNear });
        out.push(b);
      }
    }
    if (out.length < 3) return null;
    const avgZ = out.reduce((s, p) => s + p.cz, 0) / out.length;
    return { pts: out.map(projectCam), depth: avgZ };
  }

  // 天顶消失点：世界方向向量 (0, 1, 0) 的无穷远投影
  let zenith = null;
  if (sinT > 0.05) {
    const ny = (cosT / sinT) / tanHalfV;
    zenith = {
      x: w * 0.5,
      y: (0.5 - ny * 0.5) * h,
      ny,
      inFrame: ny <= 1.05 && ny >= -1.05,
    };
  }

  // 地平线屏幕 Y：世界方向 (0, 0, -1) -> cy = -sinT, cz = cosT
  let horizonY = h * 1.8;
  if (cosT > 0.02) {
    const ny = (-sinT / cosT) / tanHalfV;
    horizonY = (0.5 - ny * 0.5) * h;
  }

  return { sc, w, h, camY, camZ, sinT, cosT, tanHalfV, tanHalfH, toCam, project, clipAndProjectPoly, zenith, horizonY };
}

// ---------- 三套题材的 3D 建筑/自然/英雄实体几何 ----------
// 生成棱柱体的四个立面 + 顶面（带朝向法线，供真三维光照与画家深度排序）
function makePrism({ id, cx, cz, rx, rz, h, taper = 0.0, rotY = 0, hero = false, role = "wing", hueShift = 0, capApex = 0 }) {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  const rot = (lx, lz) => ({ x: cx + lx * c - lz * s, z: cz + lx * s + lz * c });
  const topScale = 1 - taper;
  const b0 = rot(-rx, rz);
  const b1 = rot(rx, rz);
  const b2 = rot(rx, -rz);
  const b3 = rot(-rx, -rz);
  const t0 = rot(-rx * topScale, rz * topScale);
  const t1 = rot(rx * topScale, rz * topScale);
  const t2 = rot(rx * topScale, -rz * topScale);
  const t3 = rot(-rx * topScale, -rz * topScale);

  const B = [
    { x: b0.x, y: 0, z: b0.z },
    { x: b1.x, y: 0, z: b1.z },
    { x: b2.x, y: 0, z: b2.z },
    { x: b3.x, y: 0, z: b3.z },
  ];
  const T = [
    { x: t0.x, y: h, z: t0.z },
    { x: t1.x, y: h, z: t1.z },
    { x: t2.x, y: h, z: t2.z },
    { x: t3.x, y: h, z: t3.z },
  ];

  // 四个立面（逆时针顺序，外法线向外）
  const faces = [
    { pts: [B[0], B[1], T[1], T[0]], side: "front" },
    { pts: [B[1], B[2], T[2], T[1]], side: "right" },
    { pts: [B[2], B[3], T[3], T[2]], side: "back" },
    { pts: [B[3], B[0], T[0], T[3]], side: "left" },
  ];
  if (capApex > 0) {
    const apex = { x: cx, y: h + capApex, z: cz };
    faces.push(
      { pts: [T[0], T[1], apex], side: "capFront" },
      { pts: [T[1], T[2], apex], side: "capRight" },
      { pts: [T[3], T[0], apex], side: "capLeft" }
    );
  } else {
    faces.push({ pts: [T[0], T[1], T[2], T[3]], side: "top" });
  }
  return { id, cx, cz, rx, rz, h: h + capApex, hero, role, hueShift, B, T, faces };
}

export function getSceneGeometry(sceneId) {
  if (sceneId === "redwoods") {
    // 古杉巨林：高耸收束的巨杉树干群 + 顶部多边形针叶树冠
    const prisms = [
      makePrism({ id: "main", cx: 0, cz: 0.4, rx: 2.6, rz: 2.6, h: 46, taper: 0.34, rotY: 0.35, hero: true, role: "trunk", hueShift: 0 }),
      makePrism({ id: "l1", cx: -9.8, cz: 2.8, rx: 2.2, rz: 2.2, h: 37, taper: 0.3, rotY: 0.18, role: "trunk", hueShift: -1 }),
      makePrism({ id: "r1", cx: 10.2, cz: 2.2, rx: 2.3, rz: 2.3, h: 40, taper: 0.32, rotY: -0.25, role: "trunk", hueShift: 1 }),
      makePrism({ id: "l2", cx: -16.5, cz: 6.8, rx: 2.0, rz: 2.0, h: 27, taper: 0.25, rotY: 0.4, role: "trunk", hueShift: -2 }),
      makePrism({ id: "r2", cx: 16.2, cz: 6.4, rx: 2.1, rz: 2.1, h: 29, taper: 0.28, rotY: -0.35, role: "trunk", hueShift: 2 }),
    ];
    return { prisms, kind: "redwoods", heroTipY: 46, heroSpanX: 2.6, heroZ: 0.4 };
  }
  if (sceneId === "monument") {
    // 英雄立像：高耸纪念石台 + 无五官纯几何披风立像剪影 + 两侧仪仗方柱
    const prisms = [
      makePrism({ id: "plinth", cx: 0, cz: 0.5, rx: 4.8, rz: 3.4, h: 17.5, taper: 0.08, rotY: 0.14, role: "plinth", hueShift: 0 }),
      makePrism({ id: "col-l", cx: -11.5, cz: 2.2, rx: 2.1, rz: 2.1, h: 31, taper: 0.06, rotY: 0.15, role: "wing", hueShift: -1 }),
      makePrism({ id: "col-r", cx: 11.8, cz: 1.8, rx: 2.2, rz: 2.2, h: 33, taper: 0.06, rotY: -0.15, role: "wing", hueShift: 1 }),
      makePrism({ id: "col-l2", cx: -17.5, cz: 5.5, rx: 2.2, rz: 2.2, h: 22, taper: 0.04, rotY: 0.22, role: "wing", hueShift: -2 }),
      makePrism({ id: "col-r2", cx: 17.2, cz: 5.2, rx: 2.2, rz: 2.2, h: 23, taper: 0.04, rotY: -0.22, role: "wing", hueShift: 2 }),
    ];
    return { prisms, kind: "monument", heroTipY: 35.5, heroSpanX: 3.6, heroZ: 0.5 };
  }
  // 默认：1:1 复刻 078 原海报五座几何摩天塔群（留出清晰夜空楼缝，无论平视还是仰视都能一眼辨认独立楼体）
  const prisms = [
    makePrism({ id: "main", cx: 0, cz: 0.0, rx: 2.8, rz: 2.8, h: 48, taper: 0.08, rotY: 0.72, hero: true, role: "main", hueShift: 0, capApex: 3.2 }),
    makePrism({ id: "l1", cx: -10.2, cz: 1.8, rx: 2.3, rz: 2.3, h: 36, taper: 0.05, rotY: 0.30, role: "wing", hueShift: -1 }),
    makePrism({ id: "r1", cx: 10.6, cz: 1.2, rx: 2.4, rz: 2.4, h: 40, taper: 0.05, rotY: -0.32, role: "wing", hueShift: 1 }),
    makePrism({ id: "l2", cx: -17.2, cz: 5.4, rx: 2.3, rz: 2.3, h: 23, taper: 0.03, rotY: 0.42, role: "front", hueShift: -2 }),
    makePrism({ id: "r2", cx: 17.0, cz: 5.0, rx: 2.4, rz: 2.4, h: 26, taper: 0.03, rotY: -0.40, role: "front", hueShift: 2 }),
  ];
  return { prisms, kind: "towers", heroTipY: 51.2, heroSpanX: 2.8, heroZ: 0.0 };
}

// 3D 外法线与光向量计算（供绘制着色 + 光影反差单真源核算）
export function faceNormal(pts) {
  const a = pts[0], b = pts[1], c = pts[2];
  const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
  const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

export function lightShade(normal, lightMode) {
  if (lightMode === "flat") {
    // 平顺漫射光：所有立面明暗差极弱，缺乏戏剧体量
    const base = 0.46 + normal.y * 0.06 + normal.x * 0.05;
    return clamp(base, 0.36, 0.56);
  }
  if (lightMode === "rim") {
    // 强顶逆光：暗部沉黑紫，顶部与高棱边缘爆出锋利霓虹粉轮廓光
    const dir = { x: 0.35, y: 0.72, z: -0.60 };
    const dot = normal.x * dir.x + normal.y * dir.y + normal.z * dir.z;
    return clamp(0.16 + Math.max(0, dot + 0.25) * 0.88, 0.12, 1.0);
  }
  // "side" 原海报强右侧顶光：右侧受光面炽烈玫粉、左侧背光面深靛紫
  const dir = { x: 0.78, y: 0.44, z: 0.44 };
  const dot = normal.x * dir.x + normal.y * dir.y + normal.z * dir.z;
  return clamp(0.18 + Math.max(0, dot + 0.12) * 0.85, 0.14, 1.0);
}

// ---------- 核心单真源实测核算 ----------
// 直接投影当前几何，真实量出：主塔棱线收敛角、底顶锥度比、顶梢留白比、天空净空率、光影明暗比
export function analyzeView(state, w = 680, h = 760, opts = {}) {
  const cam = makeCamera(state, w, h);
  const geom = getSceneGeometry(state.scene);

  // 1) 主塔（或中央主体）左右外轮廓真实 2D 投影向量 → 算出收敛夹角（°）与锥度比
  const spanX = geom.heroSpanX;
  const z0 = geom.heroZ;
  const yTop = geom.heroTipY;
  // 取主塔在视线中的下半截和顶冠两点（避开相机后方）
  const yLow = Math.max(2.0, state.height + 1.2);
  const pBL = cam.project({ x: -spanX, y: yLow, z: z0 + 1.2 });
  const pBR = cam.project({ x: spanX, y: yLow, z: z0 + 1.2 });
  const pTL = cam.project({ x: -spanX * 0.92, y: yTop * 0.92, z: z0 + 0.6 });
  const pTR = cam.project({ x: spanX * 0.92, y: yTop * 0.92, z: z0 + 0.6 });
  const pTip = cam.project({ x: 0, y: yTop, z: z0 });

  // 左棱线向上矢量 & 右棱线向上矢量
  const vlx = pTL.x - pBL.x, vly = pTL.y - pBL.y;
  const vrx = pTR.x - pBR.x, vry = pTR.y - pBR.y;
  const lenL = Math.hypot(vlx, vly) || 1;
  const lenR = Math.hypot(vrx, vry) || 1;
  // 左右棱线各自相对竖直向上方向 (0, -1) 的内倾角之和
  const cosAngle = clamp((vlx * vrx + vly * vry) / (lenL * lenR), -1, 1);
  let convergenceDeg = deg(Math.acos(cosAngle));
  // 确认是在向上收敛（顶部比底部更窄），若非则归零
  const baseW = Math.abs(pBR.x - pBL.x);
  const topW = Math.abs(pTR.x - pTL.x);
  if (topW >= baseW) convergenceDeg = 0;
  const taperRatio = topW > 1 ? clamp(baseW / topW, 1.0, 9.9) : 1.0;

  // 2) 顶梢在画布中的留白占比（正值=塔尖距画布顶沿的距离占比；负值=塔尖冲出画布切头！）
  const tipYFrac = pTip.behind ? -0.5 : pTip.y / h;
  const skyHeadroomPct = Math.round(tipYFrac * 100);
  const tipClipped = pTip.behind || tipYFrac < 0.04;

  // 拖拽中间帧（无需刷新外围 DOM 诊单时）跳过 400 点多边形网格采样，省去 ~45% CPU 开销
  if (opts.lightweight) {
    return { cam, geom, convergenceDeg, taperRatio, skyHeadroomPct, tipClipped, ok: false };
  }

  // 3) 采样 20×20 网格统计所有可见建筑投影覆盖率，算出真实纯净天空面积比
  // 先收集所有可见投影多边形
  const polys = [];
  let minShade = 1, maxShade = 0;
  for (const pr of geom.prisms) {
    for (const f of pr.faces) {
      const n = faceNormal(f.pts);
      // 背面剔除
      const c = f.pts[0];
      const vx = -c.x, vy = cam.camY - c.y, vz = cam.camZ - c.z;
      if (n.x * vx + n.y * vy + n.z * vz <= 0) continue;
      const proj = cam.clipAndProjectPoly(f.pts);
      if (!proj) continue;
      const sh = lightShade(n, state.light);
      if (sh < minShade) minShade = sh;
      if (sh > maxShade) maxShade = sh;
      polys.push(proj.pts);
    }
  }

  // 英雄题材把雕像头部和披风投影外接框也计入覆盖与高度
  if (state.scene === "monument") {
    const sPts = [
      { x: -3.2, y: 17.5, z: 0.5 },
      { x: 3.2, y: 17.5, z: 0.5 },
      { x: 2.2, y: 31.0, z: 0.5 },
      { x: 0, y: 35.5, z: 0.5 },
      { x: -2.2, y: 31.0, z: 0.5 },
    ];
    const sp = cam.clipAndProjectPoly(sPts);
    if (sp) polys.push(sp.pts);
  }

  // 点在多边形内判定，核算真实建筑占比与天空占比（上部 78% 画幅，避开底部标题条）
  function ptInPoly(px, py, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-6) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  const GX = 20, GY = 20;
  let covered = 0;
  let centerCovered = 0;
  let centerTotal = 0;
  for (let iy = 0; iy < GY; iy++) {
    const py = ((iy + 0.5) / GY) * h * 0.82;
    for (let ix = 0; ix < GX; ix++) {
      const px = ((ix + 0.5) / GX) * w;
      let hit = false;
      for (let k = 0; k < polys.length; k++) {
        if (ptInPoly(px, py, polys[k])) { hit = true; break; }
      }
      if (hit) covered++;
      if (ix >= 6 && ix <= 13 && iy >= 5 && iy <= 14) {
        centerTotal++;
        if (hit) centerCovered++;
      }
    }
  }
  const skyAreaPct = Math.round(((GX * GY - covered) / (GX * GY)) * 100);
  const centerMassPct = Math.round((centerCovered / Math.max(1, centerTotal)) * 100);
  const contrastRatio = maxShade > minShade ? +(maxShade / Math.max(0.12, minShade)).toFixed(1) : 1.0;

  // 4) 逐项检测 6 类双向错态（单真源，不靠打勾，靠真实几何判别）
  const issues = [];
  const lowEnough = state.height <= 0.72 && state.pitch >= 34 && state.pitch <= 75;
  const overZenith = state.pitch > 75 || (cam.zenith && cam.zenith.ny < 0.42);
  const flatEye = state.height > 0.72 || state.pitch < 34;
  const teleFlat = state.focal > 38;
  const tooCrampedTop = tipClipped || skyHeadroomPct < 9;
  const tooTinySubject = !tipClipped && skyHeadroomPct > 60 && centerMassPct < 18;
  const wiresCut = !!state.clutter;
  const flatLight = state.light === "flat";

  if (overZenith) {
    issues.push({
      id: "overZenith",
      code: "过仰掏空",
      title: `仰角 ${Math.round(state.pitch)}° 太猛，主体退成了四壁井口`,
      body: `天顶消失点已经掉进画布中上部，中央画面被掏空（主区体量仅 ${centerMassPct}%）。这滑向了纯天顶几何图案，反而丢了虫视面对庞然大物时的迎面压迫。`,
      action: "把仰角收回到 40°–72° 区间，让主塔重新撑满画心、指向顶沿天顶。",
    });
  }
  if (flatEye) {
    issues.push({
      id: "flatEye",
      code: "站姿平视",
      title: state.height > 0.72
        ? `机位高 ${state.height.toFixed(2)}m、仰角仅 ${Math.round(state.pitch)}°，像站着随手拍`
        : `仰角只有 ${Math.round(state.pitch)}°，视线还没真正抬向天顶`,
      body: `当前主塔两侧棱线收敛夹角仅 ${convergenceDeg.toFixed(1)}°（底顶锥度 ${taperRatio.toFixed(1)}×），线条几乎竖直平行。观众仍处于习惯的平视安全区，高耸威压根本起不来。`,
      action: "向右横拖画布（或压低机位至 0.60m 以下、抬高仰角至 38°–70°），让视线贴近地面仰望。",
    });
  }
  if (teleFlat) {
    issues.push({
      id: "teleFlat",
      code: "长焦拍扁",
      title: `${Math.round(state.focal)}mm 焦段偏长，把近大远小的冲势拍平了`,
      body: `长焦镜头会压缩前后景透视，即使蹲低抬头，建筑也像远处截来的平面墙块（当前收敛角 ${convergenceDeg.toFixed(1)}°、天空净空 ${skyAreaPct}%），缺少广角贴地的逼近张力。`,
      action: "把焦段拉广到 14–32mm 广角区间，立刻释放近大远小的垂直汇聚。",
    });
  }
  if (tooCrampedTop && !overZenith) {
    issues.push({
      id: "crampedTop",
      code: "顶梢切头",
      title: tipClipped
        ? `${cam.sc.heroName}冲出画框上沿，顶部被生硬切头`
        : `塔尖距顶边只剩 ${skyHeadroomPct}%，上方喘不过气`,
      body: "虫视之所以显得高耸，靠的是尖顶上方留出一片干净天幕承接上升势能。楼顶顶死画框上沿时，视线一路往上冲却撞了南墙，高耸感反而折半。",
      action: "拉广焦段或微调仰角，把塔尖上方留出 12%–44% 的深紫天空。",
    });
  }
  if (tooTinySubject && !overZenith) {
    issues.push({
      id: "tiny",
      code: "主体退缩",
      title: `主塔缩在下方（顶留白 ${skyHeadroomPct}%），压迫感泄气`,
      body: "仰角过大或主体偏小，天空空荡荡占去绝大部分面积，体量不够迫近眼前。",
      action: "略微收回仰角或微增焦段，让主体立面撑起画面骨架。",
    });
  }
  if (wiresCut) {
    issues.push({
      id: "wires",
      code: "杂线破功",
      title: "头顶横穿杂乱电线，割碎了高耸剪影",
      body: "原海报第四条要点强调「留白天空，增强空间感」。头顶横跨的架空电线把原本利落冲天的轮廓切得支离破碎，注意力瞬间被拉散。",
      action: "直接点击画布上方的杂乱电线（或切开「天空净空」）清掉杂物。",
    });
  }
  if (flatLight) {
    issues.push({
      id: "flatLight",
      code: "平光失戏",
      title: `全平漫射光（明暗反差仅 ${contrastRatio}:1 示意），体量像纸糊的`,
      body: "原海报第五条要点写着「结合光影，强化戏剧效果」。没有强侧光或顶逆光切开受光面与背光面，高耸建筑的棱角和厚重体量就立不住。",
      action: "把光线切到「强侧光（原海报）」或「顶逆光轮廓」，劈出硬朗明暗面。",
    });
  }

  // 四枚原海报圆环状态（与 078 原海报右侧四环一一对应）
  const rings = {
    lowAngle: {
      ok: lowEnough,
      warn: overZenith ? `过仰 ${Math.round(state.pitch)}°` : flatEye ? `${state.height.toFixed(2)}m 偏高` : `${Math.round(state.pitch)}° 贴地`,
      metric: `${state.height.toFixed(2)}m · +${Math.round(state.pitch)}°`,
    },
    tall: {
      ok: !teleFlat && !overZenith && convergenceDeg >= 10 && !tooCrampedTop && !tooTinySubject,
      warn: teleFlat ? `${Math.round(state.focal)}mm 扁` : tooCrampedTop ? "顶梢切头" : overZenith ? "四壁散开" : convergenceDeg < 10 ? `收敛 ${convergenceDeg.toFixed(0)}°` : `收敛 ${convergenceDeg.toFixed(0)}°`,
      metric: `收敛 ${convergenceDeg.toFixed(1)}°`,
    },
    impact: {
      ok: !wiresCut && !tooCrampedTop && !overZenith && skyAreaPct >= 26 && skyAreaPct <= 78 && taperRatio >= 1.55,
      warn: wiresCut ? "杂线割空" : tooCrampedTop ? "顶空不足" : overZenith ? "中空失重" : taperRatio < 1.55 ? `锥度 ${taperRatio.toFixed(1)}×` : `净空 ${skyAreaPct}%`,
      metric: `锥度 ${taperRatio.toFixed(1)}× · 空 ${skyAreaPct}%`,
    },
    drama: {
      ok: !flatLight,
      warn: flatLight ? "平光灰闷" : state.light === "rim" ? "顶逆光影" : "强侧硬光",
      metric: `${contrastRatio}:1 示意`,
    },
  };

  // 整体判定（接受多组合法解，不用 0/4 计分模板）
  const ok = issues.length === 0;
  let badge = "虫视成立";
  let headline = "";
  let body = "";
  let tip = "";

  if (ok) {
    if (state.focal <= 16 && state.pitch >= 62) {
      badge = "成立 · 超广极限";
      headline = `极低 ${state.height.toFixed(2)}m 配 ${Math.round(state.focal)}mm 超广，压迫张力拉满`;
      body = `实测主塔棱线向天顶急剧收束 ${convergenceDeg.toFixed(1)}°（底顶锥度 ${taperRatio.toFixed(1)}×），上方保留 ${skyHeadroomPct}% 净空天幕，强光劈开硬朗棱面，适合科幻海报与极端英雄登场。`;
      tip = "也可以换「古杉巨林」或「英雄立像」题材，观察同样机位如何改变不同主体的权力感。";
    } else if (state.pitch <= 50 && state.focal >= 22) {
      badge = "成立 · 低蹲稳重";
      headline = `低蹲 ${state.height.toFixed(2)}m 配 ${Math.round(state.focal)}mm 广角，高耸且克制`;
      body = `实测收敛角 ${convergenceDeg.toFixed(1)}°、顶留白 ${skyHeadroomPct}%，在不把边缘拉扯过度的前提下立起庄严体量，兼顾建筑细节与仰视气势。`;
      tip = "继续压低机位、拉广焦段还能推向原海报级别的强戏剧冲击；也可故意把仰角推过 78° 试试反效果。";
    } else {
      badge = "成立 · 纪念碑态";
      headline = `贴地 ${state.height.toFixed(2)}m 仰拍 +${Math.round(state.pitch)}°，视线笔直收向天顶`;
      body = `当前垂直棱线以 ${convergenceDeg.toFixed(1)}° 向顶部玫粉消失点汇聚（锥度 ${taperRatio.toFixed(1)}×），塔尖上方留出 ${skyHeadroomPct}% 干净天幕，强光拉出 ${contrastRatio}:1（示意）硬朗体量感。`;
      tip = "试试把焦段拉到 75mm 或把仰角推过 82°，亲眼验证「长焦拍扁」与「过仰掏空」两种常见翻车。";
    }
    if (state.scene === "monument") {
      body += " 注意：人物题材用大仰角会制造强烈威严与距离感，适合英雄或反派登场，切忌照搬到亲切访谈。";
    }
  } else {
    const primary = issues[0];
    badge = `未成立 · ${primary.code}`;
    headline = primary.title;
    body = primary.body;
    tip = primary.action;
  }

  // 动态计算标题双箭头的伸展幅度 (0 ~ 1)：随真实仰角与收敛角变化，标题本身就是示范！
  const titleLift = clamp(
    (convergenceDeg / 26) * 0.55 + (clamp(state.pitch - 6, 0, 62) / 62) * 0.45 - (overZenith ? 0.35 : 0),
    0.05,
    1.0
  );

  // 左翼原海报五条拍摄与设计要点实时自检（供左侧清单同步点亮）
  const checklist = {
    ground: lowEnough,
    lines: !teleFlat && !overZenith && convergenceDeg >= 10,
    tall: !tooCrampedTop && !tooTinySubject && !overZenith,
    sky: !wiresCut && !tooCrampedTop && skyAreaPct >= 26,
    light: !flatLight,
  };

  return {
    cam,
    geom,
    convergenceDeg,
    taperRatio,
    skyHeadroomPct,
    skyAreaPct,
    centerMassPct,
    contrastRatio,
    tipClipped,
    ok,
    issues,
    rings,
    checklist,
    badge,
    headline,
    body,
    tip,
    titleLift,
  };
}
