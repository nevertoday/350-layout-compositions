// 025 汇聚线构图 · 单一透视投影与诊断真源
// 画面里绘制的每一条汇聚线、每一根 1/z 递进立柱、每一个夹角与读数，都从本模块算出。

export const PALETTE = {
  navy: "#041F40",
  navyDeep: "#02142B",
  navyMid: "#0A2B54",
  navyLine: "#23446B",
  paper: "#EFE2D2",
  vellum: "#F8F2E8",
  sand: "#E4D5C2",
  vermilion: "#EA582F",
  vermilionInk: "#B53411",
  vermilionBright: "#FF7E57",
  vermilionBtn: "#C83E18",
  slate: "#55606E",
  concrete: "#B5B0AC",
  concreteDark: "#84807C",
  okLight: "#0F6B5C",
  okDark: "#5CE0C8",
  cream: "#F2E6D8",
};

export const SCENES = {
  corridor: {
    id: "corridor",
    label: "建筑廊道",
    en: "ARCHITECTURE / DEPTH",
    targetName: "朱红光门与远行剪影",
    shortTarget: "光门",
    summary: "复刻原海报左壁、右窗列与朱红通途，体验柱列沿纵深收束的建筑力量。",
  },
  road: {
    id: "road",
    label: "远景公路",
    en: "ROAD / DISTANCE",
    targetName: "地平线朱红落日",
    shortTarget: "落日",
    summary: "还原原海报公路示例：路面车道与路标沿远山收束至一点，牵引视线直达地平线。",
  },
  light: {
    id: "light",
    label: "光影射线",
    en: "LIGHT & SHADOW / FOCUS",
    targetName: "高空聚光圆核",
    shortTarget: "光源",
    summary: "还原原海报光影示例：即便没有实体墙面，明暗光束本身就能充当最强汇聚线。",
  },
};

export const FOCAL_OPTIONS = [
  { mm: 14, tag: "14mm", note: "超广畸变" },
  { mm: 28, tag: "28mm", note: "建筑纵深" },
  { mm: 50, tag: "50mm", note: "人眼自然" },
  { mm: 135, tag: "135mm", note: "长焦压平" },
];

export const INITIAL_STATE = {
  scene: "corridor",
  vp: { u: 0.58, v: 0.36 },
  dispersion: 0.68, // 0 = 单点锁汇，>0 = 左/中/右三束射线汇点撕裂
  focalMm: 135,     // 开场故意长焦压平，夹角仅约 14°
  spacing: "uniform", // 开场故意平面等距假透视
  target: "empty",    // 开场故意汇点留空
  showGuides: true,
};

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// 计算给定焦段（mm）下的近远深度比与透视张开系数
// 物理模型：固定远端主体取景宽度，焦段越长相机退得越远（D ∝ f），走廊/道路前后深度压缩越弱
export function opticalParams(focalMm) {
  const f = clamp(Number(focalMm) || 35, 12, 160);
  const corridorLen = 9.0;
  const zFar = Math.max(5.4, f * 0.36);
  const zNear = Math.max(2.1, zFar - corridorLen);
  const zRatio = zFar / zNear; // 真实物理近远景深比
  // 以画布高度为基准的底边道路半宽比（保证跨横竖屏的光学主夹角一致）：
  // 135mm → ~14°（压平），50mm → ~36°（自然），28mm → ~61°（纵深），14mm → ~99°（畸变）
  const roadHalfH = clamp(10.5 / f, 0.055, 0.96);
  // 建筑走廊近端边界扩幅
  const wallHalfW = clamp(15.2 / f, 0.14, 0.96);
  return { f, zNear, zFar, zRatio, roadHalfH, wallHalfW };
}

// 三组引导束的实际汇点坐标（左翼墙/车道左沿、中央主通途、右翼窗列/车道右沿）
export function bundleVanishingPoints(vp, dispersion) {
  const d = clamp(dispersion, 0, 1);
  const left = {
    u: clamp(vp.u - 0.22 * d, 0.04, 0.96),
    v: clamp(vp.v - 0.13 * d, 0.06, 0.92),
  };
  const center = {
    u: clamp(vp.u + 0.03 * d, 0.04, 0.96),
    v: clamp(vp.v + 0.16 * d, 0.06, 0.92),
  };
  const right = {
    u: clamp(vp.u + 0.24 * d, 0.04, 0.96),
    v: clamp(vp.v - 0.08 * d, 0.06, 0.92),
  };
  return { left, center, right };
}

// 生成沿纵深的 N 个剖面归一化进度 t ∈ [0..1]（0=最近前景，1=远端终点）
// progressive 按真实 1/z 透视投影分布；uniform 按平面等距分布
export function computeDepthSlices(focalMm, spacing, count = 9) {
  const { zNear, zFar } = opticalParams(focalMm);
  const invNear = 1 / zNear;
  const invFar = 1 / zFar;
  const span = Math.max(1e-5, invNear - invFar);
  const slices = [];
  for (let i = 0; i < count; i++) {
    const frac = i / (count - 1);
    let t;
    if (spacing === "progressive") {
      const z = zNear + frac * (zFar - zNear);
      t = (invNear - 1 / z) / span; // 0 在前景，迅速逼近 1 在消失点
    } else {
      t = frac * 0.92; // 平面等距贴图，留 8% 末端便于肉眼辨识未渐密
    }
    slices.push(t);
  }
  const firstGap = slices[1] - slices[0];
  const lastGap = slices[count - 1] - slices[count - 2];
  const depthRatio = lastGap > 1e-5 ? firstGap / lastGap : 1;
  return { slices, firstGap, lastGap, depthRatio };
}

// 统一计算场景几何、实测角度、实测离散度、4 项原海报要点与白话诊单
export function evaluate(state, aspect = 1.8) {
  const vp = {
    u: clamp(state.vp.u, 0.06, 0.94),
    v: clamp(state.vp.v, 0.08, 0.90),
  };
  const disp = clamp(state.dispersion, 0, 1);
  const opt = opticalParams(state.focalMm);
  const vps = bundleVanishingPoints(vp, disp);

  // 实测三束汇点间的最大画幅距离（以画宽百分比计）
  const dist2 = (a, b) => Math.hypot(a.u - b.u, (a.v - b.v) / Math.max(0.7, aspect));
  const maxSpread = Math.max(
    dist2(vps.left, vps.center),
    dist2(vps.right, vps.center),
    dist2(vps.left, vps.right)
  );
  const maxSpreadPct = +(maxSpread * 100).toFixed(1);

  // 主朱红汇聚道路 / 光束底端左右落点（按画布高宽比等比换算，跨横竖屏真源测角完全一致）
  const safeAspect = Math.max(0.75, aspect);
  const roadHalfU = opt.roadHalfH / safeAspect;
  const baseY = 1.0;
  const roadL = { u: vp.u - roadHalfU, v: baseY };
  const roadR = { u: vp.u + roadHalfU, v: baseY };
  // 射线向量（在像素等比坐标系下，u 乘 safeAspect）
  const vL = { x: (roadL.u - vps.center.u) * safeAspect, y: roadL.v - vps.center.v };
  const vR = { x: (roadR.u - vps.center.u) * safeAspect, y: roadR.v - vps.center.v };
  const lenL = Math.hypot(vL.x, vL.y) || 1;
  const lenR = Math.hypot(vR.x, vR.y) || 1;
  const dot = clamp((vL.x * vR.x + vL.y * vR.y) / (lenL * lenR), -1, 1);
  const apexAngleDeg = +(Math.acos(dot) * (180 / Math.PI)).toFixed(1);

  // 沿线柱列/标段的真实 1/z 递进比
  const sliceInfo = computeDepthSlices(state.focalMm, state.spacing, 9);
  const depthRatio = +sliceInfo.depthRatio.toFixed(2);

  // 消失点区域判定
  const nearEdge = vp.u < 0.14 || vp.u > 0.86 || vp.v < 0.14 || vp.v > 0.84;
  let vpZone = "asymmetric";
  let vpZoneLabel = "偏心建筑动势";
  if (nearEdge) {
    vpZone = "edge";
    vpZoneLabel = "贴边险区";
  } else if (Math.hypot(vp.u - 0.5, vp.v - 0.45) < 0.085) {
    vpZone = "center";
    vpZoneLabel = "正中对称隧道";
  } else if (vp.v < 0.27) {
    vpZone = "high";
    vpZoneLabel = "高视平俯瞰";
  } else if (vp.v > 0.64) {
    vpZone = "low";
    vpZoneLabel = "低视平仰望";
  }

  // 主体目标位置与偏离度
  let targetPos = null;
  let targetOffsetPct = 0;
  if (state.target === "locked") {
    targetPos = { u: vp.u, v: vp.v };
    targetOffsetPct = 0;
  } else if (state.target === "offset") {
    const offU = vp.u >= 0.48 ? clamp(vp.u - 0.30, 0.14, 0.36) : clamp(vp.u + 0.30, 0.64, 0.86);
    const offV = vp.v >= 0.48 ? clamp(vp.v - 0.22, 0.20, 0.36) : clamp(vp.v + 0.26, 0.58, 0.78);
    targetPos = { u: offU, v: offV };
    targetOffsetPct = +(Math.hypot(offU - vp.u, offV - vp.v) * 100).toFixed(0);
  }

  // 四大几何阈值（经验参考带）
  const converged = maxSpreadPct <= 3.5;
  const angleTooFlat = apexAngleDeg < 22;
  const angleTooWide = apexAngleDeg > 92;
  const angleOk = !angleTooFlat && !angleTooWide;
  const depthOk = state.spacing === "progressive" && depthRatio >= 2.0;
  const targetLocked = state.target === "locked";
  const inSafeZone = !nearEdge;

  // 对应原海报四大核心要点
  const pillars = {
    focus: {
      key: "focus",
      zh: "焦点明确",
      en: "FOCUS",
      ok: converged && targetLocked && inSafeZone,
      badge: !converged
        ? `离散 ${maxSpreadPct}%`
        : !inSafeZone
        ? "汇点贴边"
        : state.target === "empty"
        ? "终点留空"
        : state.target === "offset"
        ? `脱轨 ${targetOffsetPct}%`
        : "唯一锁定",
    },
    perspective: {
      key: "perspective",
      zh: "透视构建",
      en: "PERSPECTIVE",
      ok: converged && angleOk,
      badge: !converged
        ? "三束分叉"
        : angleTooFlat
        ? `${apexAngleDeg}° 压平`
        : angleTooWide
        ? `${apexAngleDeg}° 畸变`
        : `${apexAngleDeg}° 稳健`,
    },
    depth: {
      key: "depth",
      zh: "层次增强",
      en: "DEPTH",
      ok: depthOk,
      badge:
        state.spacing === "uniform"
          ? "等距 1.00×"
          : depthRatio < 2.0
          ? `仅 ${depthRatio.toFixed(1)}×`
          : `递进 ${depthRatio.toFixed(1)}×`,
    },
    guidance: {
      key: "guidance",
      zh: "视线引导",
      en: "GUIDANCE",
      ok: converged && inSafeZone && angleOk && state.target !== "offset",
      badge: !converged
        ? "半途打架"
        : !inSafeZone
        ? "引出画外"
        : state.target === "offset"
        ? "指东打西"
        : !angleOk
        ? angleTooFlat
          ? "牵引乏力"
          : "吸入过猛"
        : vpZoneLabel,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 优先级诊断（解释“为什么”与明确下一步）
  let statusTag = "待校准";
  let statusTone = "warn";
  let headline = "";
  let detail = "";
  let nextStep = "";

  if (!converged) {
    statusTag = `错态 · 汇点离散 ${maxSpreadPct}%`;
    headline = "左墙、路面与右廊各指一处，视线在半路打架";
    detail = `三束引导线的虚拟交点彼此错开了 ${maxSpreadPct}% 画幅宽（经验收拢带 ≤ 3.5%）。人眼同时追踪多套假消失点，既立不起真实空间，也找不到唯一落脚处。`;
    nextStep = "向右推动舞台底沿的「汇点收拢尺」，把散开的射线合并到朱红圆钉一点（靠近 0% 会轻轻吸附）。";
  } else if (!inSafeZone) {
    statusTag = "错态 · 汇点贴边";
    headline = `消失点挤到画框外缘（X ${Math.round(vp.u * 100)}% · Y ${Math.round(vp.v * 100)}%），把眼睛推出了画外`;
    detail = "当消失点贴死画框边线时，原本向内聚焦的引导线会反过来变成滑梯，读者顺着斜线一眼滑出画面，留不下视觉余韵。";
    nextStep = "直接在画布上把朱红消失点钉针拖回内侧安全区（正中对称或偏心三分位置皆可）。";
  } else if (angleTooFlat) {
    statusTag = `错态 · ${opt.f}mm 长焦压平`;
    headline = `汇聚主夹角仅 ${apexAngleDeg}°，空间纵深塌成了平淡平行带`;
    detail = `长焦镜头会大幅压缩前后景距离，两侧线条趋近平行（主夹角低于经验带 22°–92°），构图气质已滑向安静扁平的「024 平行线构图」，失去了冲进深处的拉扯力。`;
    nextStep = "把下方镜头焦段切到「28mm 建筑纵深」或「50mm 人眼自然」，拉开清晰的汇聚张角。";
  } else if (angleTooWide) {
    statusTag = `错态 · ${opt.f}mm 超广畸变`;
    headline = `汇聚夹角冲到 ${apexAngleDeg}°，边缘拉伸像被吸入漩涡`;
    detail = "极端广角让近端线条猛烈向外炸开（超过经验舒适带 92°），前景建筑与路面产生剧烈放射畸变，视觉舒适度下降，容易盖过主体本身。";
    nextStep = "将镜头焦段收回到「28mm」或「50mm」，让汇聚张角回到自然稳健区间。";
  } else if (!depthOk) {
    statusTag = state.spacing === "uniform" ? "错态 · 平面等距贴图" : "错态 · 纵深递进不足";
    headline =
      state.spacing === "uniform"
        ? "外框虽在汇聚，内部立柱却按 1.00× 等距平铺，像二维贴纸"
        : `纵深近远跨度比只有 ${depthRatio.toFixed(2)}×，前后层次仍偏扁`;
    detail = "真正让大脑信服“这是一条通向远方的空间”的，不只是外围斜线，还有沿线重复构件按 1/z 规律由疏变密、由粗变细的递进压缩（经验比 ≥ 2.0×）。";
    nextStep =
      state.spacing === "uniform"
        ? "把沿线节奏切到「1/z 透视递进」，立刻观察右侧窗柱与路面横标如何长出立体层次。"
        : "换用更宽的「28mm」或「50mm」视角以拉开前后透视压缩比。";
  } else if (state.target === "empty") {
    statusTag = "错态 · 汇点放空";
    headline = "所有线条铆足劲冲向一点，尽头却空无一物";
    detail = "汇聚线是最霸道的视线箭头——它把全部注意力都送进了消失点；如果终点什么也没放，读者顺着长廊一路看进去只会扑个空，力量瞬间泄掉。";
    nextStep = `把焦点主体切到「坐镇汇点」，让「${SCENES[state.scene].targetName}」正好接住整幅画面的视线终点。`;
  } else if (state.target === "offset") {
    statusTag = `错态 · 目标脱轨 ${targetOffsetPct}%`;
    headline = `线条全部指向消失点，主角却躲在旁边 ${targetOffsetPct}% 处`;
    detail = "背景建筑的汇聚方向与主体落点彼此背离，线条变成了“替无关空白敲锣打鼓”的干扰源，画面在两条视觉路线之间分裂。";
    nextStep = "把焦点主体切到「坐镇汇点」，让线条指引与视觉主角同心合拍。";
  } else {
    statusTone = "ok";
    statusTag = `已成立 · ${vpZoneLabel}`;
    if (vpZone === "center") {
      headline = `4/4 校准完成：正中对称汇聚（夹角 ${apexAngleDeg}° · 递进 ${depthRatio.toFixed(1)}×）`;
      detail = `所有引导线严丝合缝汇于画面正中，「${SCENES[state.scene].targetName}」坐镇尽头，呈现出纪念碑般的庄严与仪式感。试着把朱红钉针拖偏到右侧三分处，感受原海报同款的偏心建筑动势。`;
    } else if (vpZone === "high") {
      headline = `4/4 校准完成：高视平俯瞰汇聚（夹角 ${apexAngleDeg}° · 递进 ${depthRatio.toFixed(1)}×）`;
      detail = `消失点抬高至画面上方 ${Math.round(vp.v * 100)}%，前景朱红路面与空间延展面积大幅铺开，视线如登高远眺般一路滑向远方焦点。`;
    } else if (vpZone === "low") {
      headline = `4/4 校准完成：低视平仰望汇聚（夹角 ${apexAngleDeg}° · 递进 ${depthRatio.toFixed(1)}×）`;
      detail = `消失点压低至下方 ${Math.round(vp.v * 100)}%，上方建筑顶梁与穹顶被急剧拉高，产生强烈的巍峨感与仰视张力。`;
    } else {
      headline = `4/4 校准完成：偏心建筑汇聚（夹角 ${apexAngleDeg}° · 递进 ${depthRatio.toFixed(1)}×）`;
      detail = `与 025 原海报异曲同工：消失点偏置在（${Math.round(vp.u * 100)}%, ${Math.round(vp.v * 100)}%），左翼厚重壁面与右翼 1/z 递进柱列形成不对称平衡，既聚住焦点又不显僵硬。`;
    }
    nextStep = "你也可以继续拖移朱红钉针到正中、高处、低处或切 14mm / 135mm，亲自检验哪些位置同样成立、哪些会破功。";
  }

  return {
    vp,
    vps,
    opt,
    roadL,
    roadR,
    slices: sliceInfo.slices,
    depthRatio,
    maxSpreadPct,
    apexAngleDeg,
    vpZone,
    vpZoneLabel,
    targetPos,
    targetOffsetPct,
    pillars,
    passCount,
    statusTone,
    statusTag,
    headline,
    detail,
    nextStep,
    converged,
    inSafeZone,
    angleOk,
    depthOk,
  };
}
