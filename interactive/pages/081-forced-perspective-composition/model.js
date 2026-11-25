// 081 强制透视构图 · 单真源针孔透视数学与状态诊断引擎
// 画面渲染、顶视真距剖面、圆徽状态探针、45°切角诊单全部只读此模块的 analyze() 输出。

export const PERSON_H = 1.75; // 真实人物身高（米），前景与远景完全等高
export const CAM_EYE_Y = 1.48; // 相机眼平高度（米）
export const SENSOR_H = 24.0; // 35mm 全画幅等效垂直传感高度（mm）

export const SCENES = {
  corridor: {
    id: "corridor",
    label: "原海报 · 透视长廊",
    shortLabel: "透视长廊",
    en: "POSTER CORRIDOR",
    hint: "左右横拖画布推拉近景走近逼拍 · 直接拖红人/消失点/底沿平面图滑块 · 键盘 ←/→ 调纵深",
    nearRange: [1.1, 18.0],
    farRange: [8.0, 62.0],
    focalRange: [16, 135],
    defaultStart: {
      focal: 95,
      nearZ: 14.0,
      farZ: 23.0,
      nearX: -0.78,
      farX: 0.0,
      vpU: 0.57,
      vpV: 0.34,
      taperDeg: 0,
      camOffsetX: 0,
      clutter: true,
      aperture: "deep",
      xray: false,
      activeLayer: "all",
    },
  },
  align: {
    id: "align",
    label: "手托远塔 · 借位错觉",
    shortLabel: "手托远塔",
    en: "ALIGNMENT TRICK",
    hint: "左右横拖画布平移机位测试视差对位 · 切换光圈看浅景深如何拆穿距离差 · 键盘 ←/→ 微调机位",
    nearRange: [0.35, 1.3],
    farRange: [25.0, 60.0],
    focalRange: [20, 85],
    defaultStart: {
      focal: 35,
      nearZ: 0.56,
      farZ: 42.0,
      nearX: 0.0,
      farX: 0.0,
      vpU: 0.54,
      vpV: 0.52,
      taperDeg: 0,
      camOffsetX: 0.24,
      clutter: false,
      aperture: "shallow",
      xray: false,
      activeLayer: "all",
    },
  },
  spada: {
    id: "spada",
    label: "斯帕达宫 · 梯形假廊",
    shortLabel: "斯帕达假廊",
    en: "PALAZZO SPADA 1653",
    hint: "左右横拖画布侧移机位拆穿 8.6m 梯形机关 · 调物理收窄角看 60cm 小像如何冒充远方巨像",
    nearRange: [1.5, 4.0],
    farRange: [8.6, 8.6],
    focalRange: [24, 70],
    defaultStart: {
      focal: 34,
      nearZ: 2.2,
      farZ: 8.6,
      nearX: -0.55,
      farX: 0.0,
      vpU: 0.55,
      vpV: 0.40,
      taperDeg: 10.5,
      camOffsetX: 0.62,
      clutter: false,
      aperture: "deep",
      xray: false,
      activeLayer: "all",
    },
  },
};

export const PRESETS = {
  // 合法解（多个）
  poster: {
    label: "原海报 1:20 解",
    scene: "corridor",
    patch: { focal: 20, nearZ: 2.6, farZ: 52.0, nearX: -0.42, farX: 0.0, vpU: 0.57, vpV: 0.34, taperDeg: 0, camOffsetX: 0, clutter: false, aperture: "deep" },
  },
  epic: {
    label: "超广建筑解",
    scene: "corridor",
    patch: { focal: 18, nearZ: 2.25, farZ: 38.0, nearX: -0.56, farX: 0.0, vpU: 0.60, vpV: 0.31, taperDeg: 3.5, camOffsetX: 0, clutter: false, aperture: "deep" },
  },
  gentle: {
    label: "温和叙事 1:9 解",
    scene: "corridor",
    patch: { focal: 28, nearZ: 3.6, farZ: 32.5, nearX: -0.50, farX: 0.04, vpU: 0.56, vpV: 0.36, taperDeg: 0, camOffsetX: 0, clutter: false, aperture: "deep" },
  },
  // 双向试错预设
  errFlat: {
    label: "试错：长焦压扁",
    scene: "corridor",
    patch: { focal: 110, nearZ: 15.0, farZ: 22.0, nearX: -0.52, farX: 0.0, vpU: 0.57, vpV: 0.34, taperDeg: 0, camOffsetX: 0, clutter: false, aperture: "deep" },
  },
  errClip: {
    label: "试错：贴镜切框",
    scene: "corridor",
    patch: { focal: 26, nearZ: 1.08, farZ: 48.0, nearX: -0.45, farX: 0.0, vpU: 0.57, vpV: 0.34, taperDeg: 0, camOffsetX: 0, clutter: false, aperture: "deep" },
  },
  errBlock: {
    label: "试错：前景挡远",
    scene: "corridor",
    patch: { focal: 22, nearZ: 2.7, farZ: 50.0, nearX: 0.0, farX: 0.0, vpU: 0.57, vpV: 0.34, taperDeg: 0, camOffsetX: 0, clutter: false, aperture: "deep" },
  },
  // 另两个题材的标准解
  alignOk: {
    label: "掌托尖塔解",
    scene: "align",
    patch: { focal: 35, nearZ: 0.56, farZ: 42.0, camOffsetX: 0.0, vpU: 0.54, vpV: 0.52, aperture: "deep" },
  },
  spadaOk: {
    label: "斯帕达正中解",
    scene: "spada",
    patch: { focal: 34, nearZ: 2.2, farZ: 8.6, taperDeg: 10.5, camOffsetX: 0.0, vpU: 0.55, vpV: 0.40, xray: false },
  },
};

export function createInitialState(sceneId = "corridor") {
  const s = SCENES[sceneId] || SCENES.corridor;
  return {
    scene: s.id,
    ...s.defaultStart,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 统一针孔透视投影：等比缩放（fx === fy），确保任何宽屏/手机屏都不会拉扁人物或椭圆化圆头
export function makeProjector(state, W, H) {
  const fy = (state.focal / SENSOR_H) * H;
  const fx = fy;
  const vpX = state.vpU * W;
  const vpY = state.vpV * H;
  const camX = state.camOffsetX || 0;
  const camY = CAM_EYE_Y;

  function project(X, Y, Z) {
    const safeZ = Math.max(0.18, Z);
    return {
      x: vpX + ((X - camX) / safeZ) * fx,
      y: vpY - ((Y - camY) / safeZ) * fy,
      scale: fy / safeZ,
      z: safeZ,
    };
  }

  return { W, H, fx, fy, vpX, vpY, camX, camY, project };
}

// 走廊横截面在不同物理深度 Z 处的几何（兼容正常平直走廊与斯帕达梯形加速假廊）
export function corridorSection(state, Z) {
  if (state.scene === "spada") {
    // 1653 罗马斯帕达宫真实比例：长 8.6m，地板向上抬升、顶棚下压、宽由 3.2m 收至 1.0m
    const t = clamp(Z / 8.6, 0, 1);
    const k = clamp(state.taperDeg / 10.5, 0, 1.25);
    const leftX = -1.6 + 1.08 * t * k;
    const rightX = 1.6 - 1.08 * t * k;
    const floorY = 0 + 1.12 * t * k;
    const ceilY = 4.6 - 1.95 * t * k;
    return { leftX, rightX, floorY, ceilY };
  }
  // 原海报透视长廊：可微调物理收窄角 taperDeg (0..12°)
  const rad = (state.taperDeg * Math.PI) / 180;
  const shrink = Math.min(1.55, Math.tan(rad) * Math.min(Z, 26) * 0.45);
  const leftX = -2.25 + shrink * 0.55;
  const rightX = 2.35 - shrink * 0.65;
  const floorY = shrink * 0.14;
  const ceilY = Math.max(2.6, 4.9 - shrink * 0.35);
  return { leftX, rightX, floorY, ceilY };
}

// 估算实绘物体在屏幕上的边界框（供画布绘制与诊断共享，彻底单真源）
export function computeMetrics(state, W = 900, H = 560) {
  const proj = makeProjector(state, W, H);
  const { project, fy, vpX, vpY } = proj;
  const vFovDeg = (2 * Math.atan(SENSOR_H / (2 * state.focal)) * 180) / Math.PI;
  const hFovDeg = (2 * Math.atan(((SENSOR_H * (W / H)) / (2 * state.focal))) * 180) / Math.PI;

  if (state.scene === "align") {
    // 借位错觉：前景剪影手掌（高 0.24m，宽 0.16m，掌心位于 Y = 1.24m）vs 远处 42m 尖塔（真实高 18m，底宽 3.6m）
    const handBaseY = 1.18;
    const handTopY = 1.46;
    const handW = 0.17;
    const hBot = project(0, handBaseY, state.nearZ);
    const hTop = project(0, handTopY, state.nearZ);
    const hLeft = project(-handW / 2, handBaseY, state.nearZ);
    const hRight = project(handW / 2, handBaseY, state.nearZ);
    const handPxH = Math.abs(hBot.y - hTop.y);
    const handPxW = Math.abs(hRight.x - hLeft.x);

    // 尖塔底部故意落在与手掌顶缘相同的视觉高度上（利用视线几何计算塔底世界高度）
    const towerBaseY = CAM_EYE_Y + ((handTopY - 0.02 - CAM_EYE_Y) * state.farZ) / state.nearZ;
    const towerH = 11.5;
    const tBot = project(0, towerBaseY, state.farZ);
    const tTop = project(0, towerBaseY + towerH, state.farZ);
    const towerPxH = Math.abs(tBot.y - tTop.y);

    const alignErrPx = Math.abs(hTop.x - tBot.x);
    const alignErrPct = (alignErrPx / W) * 100;
    const distRatio = state.farZ / state.nearZ;
    const shallowFail = state.aperture === "shallow";
    const clippedTop = hTop.y < H * 0.04 || tTop.y < H * 0.02;

    const issues = [];
    if (alignErrPx > 14) {
      issues.push({
        code: "parallax",
        title: `机位偏离中轴 ${Math.abs(state.camOffsetX * 100).toFixed(0)}cm，手掌与远塔错开 ${Math.round(alignErrPx)}px`,
        why: `前景手掌离镜头只有 ${state.nearZ.toFixed(2)}m，相机横移几厘米就产生剧烈视差；而 ${state.farZ.toFixed(0)}m 外的尖塔几乎纹丝不动，借位错觉当场穿帮。`,
        action: "把机位往回横拖到 0cm 对准中轴，让尖塔底座稳稳落进掌心。",
        fixLabel: "一键对齐唯一视点",
        fixPatch: { camOffsetX: 0 },
      });
    }
    if (shallowFail) {
      issues.push({
        code: "shallow",
        title: "f/1.8 浅景深把远塔虚化成光斑，距离差立刻露馅",
        why: "强制透视借位要让大脑相信「手掌和尖塔在同一个平面上」。一旦远塔比手掌模糊，景深线索就会直接拆穿它们相隔四十多米。",
        action: "收小光圈切到「f/16 深焦双清」，让近手与远塔同时锐利清晰。",
        fixLabel: "切至 f/16 深焦双清",
        fixPatch: { aperture: "deep" },
      });
    }
    if (clippedTop) {
      issues.push({
        code: "clip",
        title: "尖塔顶部或手掌冲出画框边缘",
        why: "焦段太长或手掌贴得过近，主视觉元素被画框边缘切掉，失去了完整的趣味关系。",
        action: "调宽焦段到 28–38mm 或微调手掌距离，留出头顶呼吸空间。",
        fixLabel: "恢复 35mm 完整取景",
        fixPatch: { focal: 35, nearZ: 0.56 },
      });
    }

    const ok = issues.length === 0;
    return {
      scene: "align",
      proj,
      vFovDeg,
      hFovDeg,
      ratio: distRatio,
      ratioDisplay: `${distRatio.toFixed(0)} : 1`,
      nearPxH: handPxH,
      farPxH: towerPxH,
      nearFrac: handPxH / H,
      farFrac: towerPxH / H,
      alignErrPx,
      alignErrPct,
      handBox: { cx: hTop.x, topY: hTop.y, botY: hBot.y, w: handPxW, h: handPxH },
      towerBox: { cx: tBot.x, topY: tTop.y, botY: tBot.y, h: towerPxH },
      convergeDeg: hFovDeg * 0.72,
      tensionTier: ok ? "极强（示意）" : shallowFail ? "穿帮 · 景深割裂" : "穿帮 · 视差错位",
      clutterCount: 0,
      issues,
      primaryIssue: issues[0] || null,
      ok,
      badge: ok ? "借位成立 · 0px 错位" : `${issues.length} 处穿帮 · ${issues[0].code === "parallax" ? `错开 ${Math.round(alignErrPx)}px` : "浅景深露馅"}`,
      pillars: {
        vp: { ok: alignErrPx <= 14, text: alignErrPx <= 14 ? "对准 0px" : `偏 ${Math.round(alignErrPx)}px` },
        depth: { ok: !shallowFail, text: shallowFail ? "f/1.8 虚化" : "f/16 双清" },
        scale: { ok: distRatio >= 40, text: `距比 ${distRatio.toFixed(0)}×` },
        tension: { ok, text: ok ? "魔术生效" : "视差露馅" },
      },
      keyPoints: [
        { ok: alignErrPx <= 14, status: alignErrPx <= 14 ? "视线锁准" : `偏轴 ${Math.round(alignErrPx)}px` },
        { ok: distRatio >= 40, status: `物距 ${state.nearZ.toFixed(2)}m / ${state.farZ.toFixed(0)}m` },
        { ok: !shallowFail, status: shallowFail ? "远景糊掉" : "前后双清" },
        { ok: !clippedTop && alignErrPx <= 14, status: ok ? "掌塔一体" : "尚未咬合" },
      ],
    };
  }

  if (state.scene === "spada") {
    // 1653 罗马斯帕达宫：实长 8.6m，尽头雕像高仅 0.60m
    const secNear = corridorSection(state, 1.2);
    const secFar = corridorSection(state, 8.6);
    const statueH = 0.60;
    const sBot = project(0, secFar.floorY, 8.6);
    const sTop = project(0, secFar.floorY + statueH, 8.6);
    const statuePxH = Math.abs(sBot.y - sTop.y);

    // 入口柱高与远端柱高（实测投影）
    const pNearBot = project(secNear.rightX, secNear.floorY, 1.2);
    const pNearTop = project(secNear.rightX, secNear.ceilY, 1.2);
    const pFarBot = project(secFar.rightX, secFar.floorY, 8.6);
    const pFarTop = project(secFar.rightX, secFar.ceilY, 8.6);
    const nearColPx = Math.abs(pNearBot.y - pNearTop.y);
    const farColPx = Math.abs(pFarBot.y - pFarTop.y);
    const colRatio = nearColPx / Math.max(1, farColPx);
    // 正常平直廊要达到同样柱高比需要的等效深度
    const apparentLen = 1.2 * colRatio;

    // 墙面收敛角
    const topSlope = Math.abs(Math.atan2(pFarTop.y - pNearTop.y, pNearTop.x - pFarTop.x) * (180 / Math.PI));
    const offAxis = Math.abs(state.camOffsetX);
    const lowTaper = state.taperDeg < 6.5;

    const issues = [];
    if (offAxis > 0.16) {
      issues.push({
        code: "offaxis",
        title: `机位偏离中心轴 ${Math.round(offAxis * 100)}cm，梯形墙与斜地板当场暴露`,
        why: "博罗米尼长廊的假纵深只对正中入口处的一双眼有效。偏到侧面后，两侧立柱的收拢不对称、地板向上爬坡立刻被看穿。",
        action: "把画布往中心横拖回 0cm 轴心，重新体验 8.6 米如何变出 30 多米纵深。",
        fixLabel: "回到正中窥视点",
        fixPatch: { camOffsetX: 0 },
      });
    }
    if (lowTaper) {
      issues.push({
        code: "taper",
        title: `墙体物理收窄仅 ${state.taperDeg.toFixed(1)}°，8.6m 短廊变不出深邃错觉`,
        why: "现实通道只有 8.6 米长，若不把墙面收窄、地板抬升、拱顶压低，观众一眼就会看出它只是条普通短过道。",
        action: "把「物理收窄」拉高到 9°–11°，加速透视线汇聚。",
        fixLabel: "恢复斯帕达 10.5° 收窄",
        fixPatch: { taperDeg: 10.5 },
      });
    }

    const ok = issues.length === 0;
    return {
      scene: "spada",
      proj,
      vFovDeg,
      hFovDeg,
      ratio: colRatio,
      ratioDisplay: `${apparentLen.toFixed(0)}m 视感`,
      apparentLen,
      realLen: 8.6,
      nearPxH: nearColPx,
      farPxH: statuePxH,
      nearFrac: nearColPx / H,
      farFrac: statuePxH / H,
      statueBox: { cx: sBot.x, topY: sTop.y, botY: sBot.y, h: statuePxH },
      convergeDeg: topSlope,
      tensionTier: ok ? "建筑魔术（示意）" : "机关已拆穿",
      clutterCount: 0,
      issues,
      primaryIssue: issues[0] || null,
      ok,
      badge: ok ? `8.6m 伪装成 ${apparentLen.toFixed(0)}m` : `${issues.length} 处穿帮 · ${offAxis > 0.16 ? "偏轴露馅" : "收窄不足"}`,
      pillars: {
        vp: { ok: offAxis <= 0.16, text: offAxis <= 0.16 ? "轴心锁定" : `偏 ${Math.round(offAxis * 100)}cm` },
        depth: { ok: apparentLen >= 22, text: `视感 ${apparentLen.toFixed(0)}m` },
        scale: { ok: !lowTaper, text: `柱比 ${colRatio.toFixed(1)}×` },
        tension: { ok, text: ok ? "60cm 像真人" : "机关拆穿" },
      },
      keyPoints: [
        { ok: offAxis <= 0.16, status: offAxis <= 0.16 ? "单点汇聚" : "轴心偏离" },
        { ok: !lowTaper, status: `物理收窄 ${state.taperDeg.toFixed(1)}°` },
        { ok: !state.xray, status: state.xray ? "剖面显形" : "外观无破绽" },
        { ok, status: ok ? `8.6m→${apparentLen.toFixed(0)}m` : "纵深破功" },
      ],
    };
  }

  // 默认题材 1：原海报 · 透视长廊（单真源 3D 投影核算）
  const secNear = corridorSection(state, state.nearZ);
  const secFar = corridorSection(state, state.farZ);
  const nFoot = project(state.nearX, secNear.floorY, state.nearZ);
  const nHead = project(state.nearX, secNear.floorY + PERSON_H, state.nearZ);
  const fFoot = project(state.farX, secFar.floorY, state.farZ);
  const fHead = project(state.farX, secFar.floorY + PERSON_H, state.farZ);

  const nearPxH = Math.abs(nFoot.y - nHead.y);
  const farPxH = Math.abs(fFoot.y - fHead.y);
  const nearW = nearPxH * 0.30;
  const farW = Math.max(4, farPxH * 0.30);

  const ratio = nearPxH / Math.max(0.5, farPxH);
  const nearFrac = nearPxH / H;
  const farFrac = farPxH / H;

  // 右侧深松青巨墙顶沿收敛斜率（实绘 3D 顶点算出）
  const wallNear = corridorSection(state, 1.8);
  const wallFar = corridorSection(state, 46.0);
  const wNearTop = project(wallNear.rightX, wallNear.ceilY, 1.8);
  const wFarTop = project(wallFar.rightX, wallFar.ceilY, 46.0);
  const wNearBot = project(wallNear.rightX, wallNear.floorY, 1.8);
  const wFarBot = project(wallFar.rightX, wallFar.floorY, 46.0);
  const topAngle = Math.abs(Math.atan2(wFarTop.y - wNearTop.y, wNearTop.x - wFarTop.x) * (180 / Math.PI));
  const botAngle = Math.abs(Math.atan2(wNearBot.y - wFarBot.y, wNearBot.x - wFarBot.x) * (180 / Math.PI));
  const convergeDeg = topAngle + botAngle;

  // 各类双向实测检测
  const clippedTop = nHead.y < H * 0.035;
  const clippedBot = nFoot.y > H * 0.985;
  const clippedFrame = clippedTop || clippedBot || nearFrac > 0.90;
  const tooSmallNear = nearFrac < 0.24;
  const weakRatio = ratio < 5.5;
  const longLensFlat = state.focal >= 70 && convergeDeg < 40;
  const vpOutOfSafe = state.vpU < 0.22 || state.vpU > 0.84 || state.vpV < 0.14 || state.vpV > 0.66;
  const offAxis = Math.abs(state.camOffsetX) > 1.1;

  // 检测前景红人是否横向挡住远景红人
  const nL = nFoot.x - nearW * 0.52;
  const nR = nFoot.x + nearW * 0.52;
  const fL = fFoot.x - farW * 0.52;
  const fR = fFoot.x + farW * 0.52;
  const interW = Math.max(0, Math.min(nR, fR) - Math.max(nL, fL));
  const interH = Math.max(0, Math.min(nFoot.y, fFoot.y) - Math.max(nHead.y, fHead.y));
  const overlapRatio = (interW * interH) / Math.max(1, farW * farPxH);
  const occluded = overlapRatio > 0.35;

  const clutterCount = state.clutter ? 3 : 0;

  const issues = [];
  if (clippedFrame) {
    issues.push({
      code: "clip",
      title: `前景贴得太近（${state.nearZ.toFixed(2)}m），近景红人被画框刀切出界`,
      why: `近人实绘占画高 ${Math.round(nearFrac * 100)}%，轮廓已冲出画框边界。强制透视追求近大远小，但把前景主体切碎变形反而会破坏可读性。`,
      action: "向左轻轻回拖画布（或把近景距离拉回 2.2m–3.6m），保住完整头肩与落地斜影。",
      fixLabel: "退到 2.6m 保全前景",
      fixPatch: { nearZ: 2.6, focal: Math.min(state.focal, 24) },
    });
  }
  if (weakRatio) {
    const onlyFocal = state.focal <= 32 && state.nearZ > 6.0;
    issues.push({
      code: "weak",
      title: onlyFocal
        ? `只换 ${state.focal}mm 广角没挪近，前后比例仍只有 ${ratio.toFixed(1)} : 1`
        : `近远身高比仅 ${ratio.toFixed(1)} : 1，近大远小反差远未拉开`,
      why: onlyFocal
        ? `焦段已经够广，但前景仍站在 ${state.nearZ.toFixed(1)}m 外、远景在 ${state.farZ.toFixed(1)}m，物距比只有 ${(state.farZ / state.nearZ).toFixed(1)} 倍。广角本身不改变前后比例，走近前景才能把近大远小引爆。`
        : `前景距镜头 ${state.nearZ.toFixed(1)}m、远景 ${state.farZ.toFixed(1)}m，两人真实身高都是 1.75m，物距相差太小，镜头里几乎一般高，纵深戏剧感无从谈起。`,
      action: "向右横拖画布让近人逼近镜头（2.2–3.5m），同时把焦段放宽到 18–28mm、远景推远至 30m 以上。",
      fixLabel: "一键拉开 1:20 原海报纵深",
      fixPatch: { focal: 20, nearZ: 2.6, farZ: 52.0, clutter: false },
    });
  } else if (tooSmallNear) {
    issues.push({
      code: "tiny",
      title: `前景只占画面高度 ${Math.round(nearFrac * 100)}%，视觉锚点太弱`,
      why: "虽然前后有比例差，但近景红人离镜头还不够近，空廊吞掉了主体分量，缺乏一进画面就抓住眼球的巨型锚点。",
      action: "把近景往镜头前再推近至 2.2–3.6m，让近景占到画高 35%–62%。",
      fixLabel: "推近前景至 2.6m",
      fixPatch: { nearZ: 2.6 },
    });
  }
  if (longLensFlat && !weakRatio) {
    issues.push({
      code: "flat",
      title: `${state.focal}mm 长焦把走廊拍平，墙面汇聚张角仅 ${Math.round(convergeDeg)}°`,
      why: "长焦镜头的窄视角会压缩空间进深，窗洞与地砖透视线趋于平缓，失去将视线高速吸入消失点的冲力。",
      action: "将焦段切回 18–28mm 广角，同时走近前景保持构图饱满。",
      fixLabel: "换回 20mm 广角",
      fixPatch: { focal: 20, nearZ: 2.6 },
    });
  }
  if (clutterCount > 0) {
    issues.push({
      code: "clutter",
      title: `通道里 3 处立牌杂物截断了透视汇聚线`,
      why: "原海报特别强调「简化场景元素」：杂物挡在走廊中段后，眼睛沿地砖和墙檐冲向消失点的路径在中途被打断，纵深感掉了一半。",
      action: "点击关闭「通道杂物」，清出一条直通消失点的净空跑道。",
      fixLabel: "清空通道杂物",
      fixPatch: { clutter: false },
    });
  }
  if (occluded) {
    issues.push({
      code: "occlude",
      title: "前景红人正好挡住了远景红人，对比参照消失",
      why: "强制透视的震撼靠「近大」与「远小」同框互证。近景横向遮住远景后，观者根本看不到远端那个缩小 20 倍的参照人物。",
      action: "把近景红人稍微往左或往右错开（或拖动近人），让远景红人干净地露在消失点圆环里。",
      fixLabel: "错开近景露出远人",
      fixPatch: { nearX: -0.42, farX: 0 },
    });
  }
  if (vpOutOfSafe) {
    issues.push({
      code: "vp",
      title: "消失点漂到画框极边缘，视线顺势滑出画面",
      why: `当前消失点位于画幅 (${Math.round(state.vpU * 100)}%, ${Math.round(state.vpV * 100)}%)，所有建筑斜线都把目光往画外甩。`,
      action: "把红点消失点拖回画幅内侧三分至中右区域，收束整条长廊的能量。",
      fixLabel: "归位消失点",
      fixPatch: { vpU: 0.57, vpV: 0.34 },
    });
  }
  if (offAxis) {
    issues.push({
      code: "axis",
      title: "相机横向贴墙过紧，一侧走廊边界失衡",
      why: "离轴偏移太大时，单侧墙体几乎贴到镜头前，另一侧栏杆的收敛呼应消失。",
      action: "把机位侧移归回廊道中段。",
      fixLabel: "机位回中",
      fixPatch: { camOffsetX: 0 },
    });
  }

  const ok = issues.length === 0;
  let tensionTier = "弱 · 空间扁平（示意）";
  if (ok) {
    if (ratio >= 16) tensionTier = "极强 · 戏剧纵深（示意）";
    else if (ratio >= 8.5) tensionTier = "强 · 叙事纵深（示意）";
    else tensionTier = "中 · 温和透视（示意）";
  } else if (clippedFrame) {
    tensionTier = "过载 · 贴镜裁切（示意）";
  }

  const ratioInt = Math.max(1, Math.round(ratio));
  const badge = ok
    ? `透视成立 · 约 1:${ratioInt}`
    : `${issues.length} 处待调 · ${issues[0].code === "clip" ? "贴镜切框" : issues[0].code === "clutter" ? "杂物挡线" : issues[0].code === "occlude" ? "前景遮远" : `仅 ${ratio.toFixed(1)}:1`}`;

  return {
    scene: "corridor",
    proj,
    vFovDeg,
    hFovDeg,
    ratio,
    ratioDisplay: ratio >= 10 ? `1 : ${Math.round(ratio)}` : `1 : ${ratio.toFixed(1)}`,
    nearPxH,
    farPxH,
    nearFrac,
    farFrac,
    nearBox: { cx: nFoot.x, topY: nHead.y, botY: nFoot.y, w: nearW, h: nearPxH },
    farBox: { cx: fFoot.x, topY: fHead.y, botY: fFoot.y, w: farW, h: farPxH },
    convergeDeg,
    tensionTier,
    clutterCount,
    occluded,
    clippedTop: clippedFrame,
    clippedBot,
    issues,
    primaryIssue: issues[0] || null,
    ok,
    badge,
    pillars: {
      vp: { ok: !vpOutOfSafe, text: vpOutOfSafe ? "偏出安全域" : `${Math.round(state.vpU * 100)}% · ${Math.round(state.vpV * 100)}%` },
      depth: { ok: !longLensFlat && clutterCount === 0, text: clutterCount > 0 ? `被遮 ${clutterCount} 处` : `张角 ${Math.round(convergeDeg)}°` },
      scale: { ok: !weakRatio && !clippedFrame && !tooSmallNear, text: clippedFrame ? "贴镜切框" : `1 : ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}` },
      tension: { ok, text: ok ? (ratio >= 15 ? "戏剧张力" : "平衡纵深") : `${issues.length} 处失衡` },
    },
    keyPoints: [
      { ok: !vpOutOfSafe && !longLensFlat, status: vpOutOfSafe ? "落点偏边" : `唯一收敛 ${Math.round(convergeDeg)}°` },
      { ok: !weakRatio && !clippedFrame && !tooSmallNear, status: clippedFrame ? "贴镜切框" : `约 1/${ratioInt} 反差` },
      { ok: clutterCount === 0, status: clutterCount === 0 ? "净空无扰" : `${clutterCount} 处杂物截线` },
      { ok: !occluded && !weakRatio && !clippedFrame && clutterCount === 0, status: occluded ? "远景被遮" : ok ? "直抵远人" : "引导偏弱" },
    ],
  };
}
