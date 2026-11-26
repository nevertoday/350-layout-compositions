// 301 单人构图 · 单真源镜头几何模型
// 画布绘制、五项原则灯、五条速记勾选、数值读数与白话诊单全部从此模块同一套实绘坐标算出。

export const SHOT_SCALES = [
  {
    id: "ls",
    index: 0,
    scale: 0.04,
    focal: 24,
    zh: "远景",
    en: "LONG SHOT",
    brief: "人物退为小剪影，环境与留白主宰情绪",
    targetCut: "全身留大空",
  },
  {
    id: "fs",
    index: 1,
    scale: 0.26,
    focal: 35,
    zh: "全景",
    en: "FULL SHOT",
    brief: "从头到脚完整入画，交待姿态与空间关系",
    targetCut: "完整全身",
  },
  {
    id: "ms",
    index: 2,
    scale: 0.52,
    focal: 50,
    zh: "中景",
    en: "MEDIUM SHOT",
    brief: "裁至腰臀或大腿中段，兼顾动作与神态",
    targetCut: "腰臀/大腿中段",
  },
  {
    id: "cs",
    index: 3,
    scale: 0.76,
    focal: 85,
    zh: "近景",
    en: "CLOSE SHOT",
    brief: "裁至胸口上下，背景退隐，存在感骤升",
    targetCut: "胸口以上",
  },
  {
    id: "ecu",
    index: 4,
    scale: 0.96,
    focal: 135,
    zh: "特写",
    en: "EXTREME CLOSE UP",
    brief: "轮廓紧迫充满画框，把全部张力押在神情",
    targetCut: "头颈紧裁",
  },
];

// 三套导演叙事意图（对应原海报孤峰望月、夜站独行侧影、窗畔情绪凝视）
export const SCENES = {
  cliff: {
    id: "cliff",
    name: "原海报 · 孤峰望月",
    short: "孤峰望月",
    intent: "表现独行者的渺小、孤寂与天地氛围",
    targetScales: ["ls", "fs"],
    targetLabel: "远景或全景",
    defaultFacing: "back",
    lightZone: { u: 0.64, v: 0.42, r: 0.255, shape: "moon", parallax: 0.22 },
    distractors: [
      {
        id: "beacon",
        label: "左缘航标亮灯",
        kind: "beacon",
        worldU: 0.30,
        worldV: 0.64,
        parallax: -0.20,
        w: 0.075,
        h: 0.23,
      },
      {
        id: "stranger",
        label: "崖边撑伞路人",
        kind: "stranger",
        worldU: 0.72,
        worldV: 0.64,
        parallax: 0.18,
        w: 0.088,
        h: 0.25,
      },
    ],
    // 开场刻意停在 0/5 复合坏态：贴左缘 + 离月暗黏 + 两干扰物入框 + 脚踝硬切 + 景别偏离
    opening: {
      subjU: 0.13,
      scale: 0.48,
      tilt: 0.22,
      facing: "back",
      cleared: { beacon: false, stranger: false },
    },
    posterSolve: {
      subjU: 0.67,
      scale: 0.26,
      tilt: 0.0,
      facing: "back",
      cleared: { beacon: true, stranger: true },
    },
  },
  station: {
    id: "station",
    name: "夜站 · 独行侧影",
    short: "夜站独行",
    intent: "交待人物状态与面向前方的去处",
    targetScales: ["fs", "ms"],
    targetLabel: "全景或中景",
    defaultFacing: "right",
    lightZone: { u: 0.46, v: 0.46, r: 0.28, shape: "arch", parallax: 0.30 },
    distractors: [
      {
        id: "neon",
        label: "亮色灯箱招牌",
        kind: "neon",
        worldU: 0.74,
        worldV: 0.28,
        parallax: -0.22,
        w: 0.13,
        h: 0.15,
      },
      {
        id: "scooter",
        label: "站台杂物推车",
        kind: "scooter",
        worldU: 0.28,
        worldV: 0.76,
        parallax: -0.15,
        w: 0.12,
        h: 0.14,
      },
    ],
    opening: {
      subjU: 0.80,
      scale: 0.48,
      tilt: 0.21,
      facing: "right",
      cleared: { neon: false, scooter: false },
    },
    posterSolve: {
      subjU: 0.35,
      scale: 0.50,
      tilt: -0.01,
      facing: "right",
      cleared: { neon: true, scooter: true },
    },
  },
  window: {
    id: "window",
    name: "窗畔 · 情绪凝视",
    short: "窗畔凝视",
    intent: "贴近轮廓放大内心波动与压迫存在感",
    targetScales: ["cs", "ecu"],
    targetLabel: "近景或特写",
    defaultFacing: "left",
    lightZone: { u: 0.52, v: 0.48, r: 0.33, shape: "window", parallax: 0.24 },
    distractors: [
      {
        id: "lamp",
        label: "抢光落地台灯",
        kind: "lamp",
        worldU: 0.26,
        worldV: 0.58,
        parallax: -0.18,
        w: 0.095,
        h: 0.24,
      },
      {
        id: "frameWall",
        label: "杂乱挂画相框",
        kind: "frameWall",
        worldU: 0.78,
        worldV: 0.34,
        parallax: 0.18,
        w: 0.13,
        h: 0.18,
      },
    ],
    opening: {
      subjU: 0.19,
      scale: 0.14,
      tilt: 0.16,
      facing: "left",
      cleared: { lamp: false, frameWall: false },
    },
    posterSolve: {
      subjU: 0.61,
      scale: 0.77,
      tilt: -0.01,
      facing: "left",
      cleared: { lamp: true, frameWall: true },
    },
  },
};

export const PRINCIPLES = [
  {
    id: "emphasize",
    zh: "突出主体",
    en: "EMPHASIZE",
    posterBody: "只保留一个核心主体，避免视觉干扰。",
  },
  {
    id: "focus",
    zh: "引导视线",
    en: "VISUAL FOCUS",
    posterBody: "利用位置、方向与留白，自然引导观者视线。",
  },
  {
    id: "balance",
    zh: "保持平衡",
    en: "BALANCE",
    posterBody: "通过构图与重心平衡，让画面稳定而舒适。",
  },
  {
    id: "space",
    zh: "善用留白",
    en: "NEGATIVE SPACE",
    posterBody: "留白不是空，而是为主体提供呼吸空间。",
  },
  {
    id: "scale",
    zh: "选择合适景别",
    en: "SHOT SCALE",
    posterBody: "根据表达需求，选择恰当的拍摄距离。",
  },
];

export const TAKEAWAYS = [
  { id: "single", text: "画面只有一个明确的主体" },
  { id: "gaze", text: "主体位置符合视线引导逻辑" },
  { id: "space", text: "留白面积大于或等于主体面积" },
  { id: "light", text: "光影与色彩服务于主体" },
  { id: "clean", text: "简洁，克制，信息聚焦" },
];

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// 连续 scale (0..1) → 真实人形高度（以取景框高度为 1）
export function bodyHeightFromScale(scale) {
  // 指数插值，保证从远景(0.15)到全景(0.35)到中景(0.75)到近景(1.50)到特写(2.75)手感平滑
  const s = clamp(scale, 0, 1);
  return 0.145 * Math.pow(19.2, s);
}

// 连续 scale (0..1) → 等效焦段示意值（18mm–135mm）
export function focalFromScale(scale) {
  const s = clamp(scale, 0, 1);
  return Math.round(18 * Math.pow(7.6, s));
}

// 由 scale 与 tilt 算出头顶默认落点，保证各景别处于自然片场基准线
export function baseHeadTop(scale) {
  const s = clamp(scale, 0, 1);
  if (s < 0.26) {
    // 远景到全景：脚落在下三分线上（约 0.65–0.73），头随景别升高
    const bh = bodyHeightFromScale(s);
    const footTarget = lerp(0.72, 0.67, s / 0.26);
    return footTarget - bh;
  }
  if (s < 0.56) {
    const t = (s - 0.26) / 0.30;
    return lerp(0.32, 0.16, t);
  }
  if (s < 0.82) {
    const t = (s - 0.56) / 0.26;
    return lerp(0.16, 0.10, t);
  }
  const t = (s - 0.82) / 0.18;
  return lerp(0.10, 0.04, t);
}

export function scaleBucket(scale) {
  if (scale < 0.15) return SHOT_SCALES[0]; // 远景
  if (scale < 0.37) return SHOT_SCALES[1]; // 全景
  if (scale < 0.65) return SHOT_SCALES[2]; // 中景
  if (scale < 0.88) return SHOT_SCALES[3]; // 近景
  return SHOT_SCALES[4]; // 特写
}

// 底部裁切解剖位分类（基于 7.5 头身比例：0 冠顶 → 1 脚底）
export function classifyCut(cutFrac, footV) {
  if (footV <= 1.005) {
    return { kind: "full", label: "完整入画（未裁身体）", bad: false };
  }
  if (cutFrac >= 0.88 && cutFrac <= 0.975) {
    return {
      kind: "ankle",
      label: "脚踝切脚禁区",
      bad: true,
      detail: "底框刚好切在脚踝，像把双脚硬生生截断在画外。",
    };
  }
  if (cutFrac >= 0.67 && cutFrac <= 0.785) {
    return {
      kind: "knee",
      label: "膝关节硬切",
      bad: true,
      detail: "底框正压在膝盖关节上，视觉重心显得局促又截肢感强。",
    };
  }
  if (cutFrac >= 0.135 && cutFrac <= 0.18) {
    return {
      kind: "neck",
      label: "颈部下巴硬切",
      bad: true,
      detail: "底框切在脖子处会让头部显得悬空孤立，应留出肩线或推进至面部轮廓。",
    };
  }
  if (cutFrac < 0.135) {
    return { kind: "ecu", label: "头部特写紧裁", bad: false };
  }
  if (cutFrac <= 0.36) {
    return { kind: "chest", label: "胸口安全切位（近景）", bad: false };
  }
  if (cutFrac <= 0.66) {
    return { kind: "thigh", label: "腰臀/大腿中段安全切位（中景）", bad: false };
  }
  return { kind: "shin", label: "小腿中段（略显局促）", bad: false };
}

export function createInitialState(sceneId = "cliff") {
  const sc = SCENES[sceneId] || SCENES.cliff;
  return {
    sceneId: sc.id,
    subjU: sc.opening.subjU,
    scale: sc.opening.scale,
    tilt: sc.opening.tilt,
    facing: sc.opening.facing,
    cleared: { ...sc.opening.cleared },
    showGuides: true,
    activePrinciple: null, // 点击左侧 5 徽时高亮对应诊断层
  };
}

// 统一计算画布坐标、所有实绘包围盒与 5 项单人构图诊断
export function evaluateFrame(state, aspect = 1.45) {
  const scene = SCENES[state.sceneId] || SCENES.cliff;
  const s = clamp(state.scale, 0, 1);
  const subjU = clamp(state.subjU, 0.05, 0.95);
  const tilt = clamp(state.tilt, -0.24, 0.24);
  const shot = scaleBucket(s);
  const focal = focalFromScale(s);
  const bodyH = bodyHeightFromScale(s);
  const headTopV = baseHeadTop(s) + tilt;
  const footV = headTopV + bodyH;
  const bodyW = (bodyH * 0.285) / Math.max(0.7, aspect);

  // 人物主体裁剪后实绘边界
  const visTop = clamp(headTopV, 0, 1);
  const visBot = clamp(footV, 0, 1);
  const visLeft = clamp(subjU - bodyW * 0.5, 0, 1);
  const visRight = clamp(subjU + bodyW * 0.5, 0, 1);
  const visH = Math.max(0, visBot - visTop);
  const visW = Math.max(0, visRight - visLeft);

  // 解剖切位
  const cutFrac = bodyH > 0.001 ? clamp((1.0 - headTopV) / bodyH, 0, 1) : 1;
  const cutInfo = classifyCut(cutFrac, footV);

  // 背景亮区（暖月 / 拱窗 / 落地窗）随摇镜与推拉轻度视差运动
  const zoomFactor = bodyH / bodyHeightFromScale(0.26); // 以全景为 1.0 倍参考
  const lz = scene.lightZone;
  const panDelta = subjU - scene.posterSolve.subjU;
  const lightU = lz.u + panDelta * lz.parallax;
  const lightV = lz.v + tilt * 0.45 - (s - 0.26) * 0.08;
  const lightR = lz.r * clamp(Math.pow(zoomFactor, 0.34), 0.72, 1.55);

  // 悬崖 / 地面基线（仅在 cliff 场景中充当前景引导斜块）
  const cliffTopV = clamp(footV - bodyH * 0.02, 0.52, 1.06);

  // 干扰物投影（基于世界坐标与焦段缩放：推近特写时远侧杂物会自动滑出取景框外）
  const zoomScale = clamp(Math.pow(zoomFactor, 0.46), 0.72, 2.65);
  const distractors = scene.distractors.map((d) => {
    const cleared = !!state.cleared[d.id];
    const u = 0.5 + (d.worldU - 0.5 + panDelta * d.parallax) * zoomScale;
    const v = 0.5 + (d.worldV - 0.5) * clamp(Math.pow(zoomFactor, 0.36), 0.75, 1.85) + tilt * 0.55;
    const w = (d.w * clamp(Math.pow(zoomFactor, 0.44), 0.72, 1.85)) / Math.max(0.75, aspect / 1.45);
    const h = d.h * clamp(Math.pow(zoomFactor, 0.44), 0.72, 1.85);
    const x0 = u - w * 0.5;
    const x1 = u + w * 0.5;
    const y0 = v - h * 0.5;
    const y1 = v + h * 0.5;
    const ovW = Math.max(0, Math.min(0.985, x1) - Math.max(0.015, x0));
    const ovH = Math.max(0, Math.min(0.985, y1) - Math.max(0.015, y0));
    const inFrame = !cleared && ovW > 0.02 && ovH > 0.03;
    return {
      ...d,
      cleared,
      u,
      v,
      w,
      h,
      x0,
      y0,
      x1,
      y1,
      inFrame,
      visArea: inFrame ? ovW * ovH : 0,
    };
  });
  const visibleDistractors = distractors.filter((d) => d.inFrame);

  // 图底分离度：检测人物头肩轮廓中心与暖米亮区的重合距离
  const headCenterU = subjU;
  const headCenterV = clamp(headTopV + bodyH * 0.16, 0.06, 0.94);
  const dxL = (headCenterU - lightU) * Math.min(aspect, 1.45);
  const dyL = headCenterV - lightV;
  const distToLight = Math.hypot(dxL, dyL);
  const lightRadiusNorm = lightR * 1.04;
  const separation = clamp(1.18 - distToLight / Math.max(0.08, lightRadiusNorm), 0, 1);

  // 实绘面积与留白占比（人物主体 + 可见杂物 + 前景遮挡暗块）
  // 人物轮廓有效填充系数（人不是实心矩形，特写头肩更饱满）
  const fillCoef = lerp(0.58, 0.78, s);
  const subjectArea = clamp(visW * visH * fillCoef, 0.004, 0.78);
  const distractorArea = visibleDistractors.reduce((acc, d) => acc + d.visArea * 0.85, 0);
  // 前景悬崖/地台在远/全景时作为结构配重，取实际露出面积的 0.5 计入视觉占重
  const fgMassArea =
    scene.id === "cliff" && cliffTopV < 0.99
      ? clamp((1 - cliffTopV) * clamp(1 - subjU + 0.18, 0.15, 0.65) * 0.55, 0, 0.24)
      : 0.06;
  const quietRatio = clamp(1 - subjectArea - distractorArea - fgMassArea * 0.55, 0.12, 0.96);

  // 视线前方空间（朝左/朝右按朝向算，背影按较宽一侧与留白舒展度算）
  const lookRoom =
    state.facing === "right"
      ? clamp(1 - subjU, 0, 1)
      : state.facing === "left"
      ? clamp(subjU, 0, 1)
      : clamp(Math.max(subjU, 1 - subjU), 0, 1);

  // 视觉重心（主体 + 明月反差 + 干扰物）
  const totalW = subjectArea * 3.4 + 0.14 + distractorArea * 2.8;
  const cgU = clamp(
    (subjU * subjectArea * 3.4 + lightU * 0.14 + visibleDistractors.reduce((a, d) => a + d.u * d.visArea * 2.8, 0)) /
      Math.max(0.001, totalW),
    0,
    1
  );

  // ---------- 7 类双向几何错态判定 ----------
  const isECU = shot.id === "ecu";
  const isWide = shot.id === "ls" || shot.id === "fs";
  const headroom = headTopV; // 0 = 顶边，负值 = 削顶

  const edgeCramp = subjU < 0.16 || subjU > 0.84;
  const lookBlocked = state.facing !== "back" && lookRoom < 0.38;
  const headClipped = isECU ? headroom < -0.09 : headroom < 0.045;
  const headSunk = isWide
    ? headroom > 0.64
    : shot.id === "ms"
    ? headroom > 0.36
    : shot.id === "cs"
    ? headroom > 0.32
    : headroom > 0.26;
  const jointCut = cutInfo.bad;
  const lowSeparation = separation < 0.36;
  const hasDistractor = visibleDistractors.length > 0;
  const spaceCramped = isECU ? quietRatio < 0.22 : quietRatio < 0.50;
  const subjectTooTiny = visH < 0.08;
  const scaleMismatch = !scene.targetScales.includes(shot.id);
  const weightUnbalanced = Math.abs(cgU - 0.5) > 0.33 || edgeCramp;

  // 五项原则单真源状态
  const principleStatus = {
    emphasize: {
      ok: !hasDistractor && !lowSeparation,
      state: hasDistractor ? "bad" : lowSeparation ? "warn" : "ok",
      tag: hasDistractor
        ? `干扰 ${visibleDistractors.length} 处`
        : lowSeparation
        ? "图底黏连"
        : "单一清晰",
    },
    focus: {
      ok: !edgeCramp && !lookBlocked,
      state: edgeCramp || lookBlocked ? "bad" : "ok",
      tag: edgeCramp
        ? subjU < 0.5
          ? "贴左挤压"
          : "贴右挤压"
        : lookBlocked
        ? `前方仅 ${Math.round(lookRoom * 100)}%`
        : state.facing === "back"
        ? `主位 ${Math.round(subjU * 100)}%`
        : `视线 ${Math.round(lookRoom * 100)}%`,
    },
    balance: {
      ok: !headClipped && !headSunk && !jointCut && !weightUnbalanced,
      state: headClipped || headSunk || jointCut ? "bad" : weightUnbalanced ? "warn" : "ok",
      tag: jointCut
        ? cutInfo.label.slice(0, 4)
        : headClipped
        ? "削顶压迫"
        : headSunk
        ? "空顶下沉"
        : weightUnbalanced
        ? "重心偏坠"
        : `留顶 ${Math.round(headroom * 100)}%`,
    },
    space: {
      ok: !spaceCramped && !subjectTooTiny,
      state: spaceCramped || subjectTooTiny ? "bad" : "ok",
      tag: subjectTooTiny
        ? "主体淹没"
        : spaceCramped
        ? `静空 ${Math.round(quietRatio * 100)}%`
        : isECU
        ? `紧裁留息 ${Math.round(quietRatio * 100)}%`
        : `留白 ${Math.round(quietRatio * 100)}%`,
    },
    scale: {
      ok: !scaleMismatch && !jointCut,
      state: scaleMismatch ? "bad" : jointCut ? "warn" : "ok",
      tag: scaleMismatch ? `${shot.zh}·失配` : `${shot.zh} ${focal}mm`,
    },
  };

  const passCount = Object.values(principleStatus).filter((p) => p.ok).length;

  // 原海报底左五条「构图要点速记」实时勾选
  const takeawayChecks = {
    single: !hasDistractor,
    gaze: !edgeCramp && !lookBlocked,
    space: isECU ? quietRatio >= 0.22 && !hasDistractor : quietRatio >= 0.50 && !subjectTooTiny,
    light: !lowSeparation,
    clean: passCount === 5,
  };

  // 按严重优先级输出当前最需要修的第一条白话诊断 + 一键单步建议
  let diag = null;
  if (hasDistractor) {
    const names = visibleDistractors.map((d) => `「${d.label}」`).join("与");
    diag = {
      code: "MULTI_SUBJECT",
      severity: "bad",
      badge: `${passCount}/5 · 多主体抢戏`,
      headline: `${names}闯进了画面，把唯一主角的注意力拆散了`,
      body: `单人构图最怕画框里冒出第二个亮斑或人影。现在框内仍有 ${visibleDistractors.length} 处视觉干扰，观者目光会在主体和杂物之间来回跳动。`,
      hint: "直接点击取景框里标红的干扰物清场，或推近景别把它们裁出框外。",
      fixLabel: "一键片场清场",
      fixAction: "clearDistractors",
    };
  } else if (edgeCramp) {
    const side = subjU < 0.5 ? "左" : "右";
    diag = {
      code: "EDGE_CRAMP",
      severity: "bad",
      badge: `${passCount}/5 · 贴${side}挤压`,
      headline: `主体被挤到${side}边缘（${Math.round(subjU * 100)}% 处），画面像要倾倒`,
      body: `当唯一的主体紧贴画框边线时，边框会对轮廓产生强烈的挤压感，另一侧的大片空白也随之失去呼应，重心明显偏斜。`,
      hint: `向${side === "左" ? "右" : "左"}横向拖动取景画布，让主体回到三分线或明月主光区内。`,
      fixLabel: "摇镜回稳落位",
      fixAction: "recenterSubject",
    };
  } else if (lowSeparation) {
    diag = {
      code: "LOW_SEPARATION",
      severity: "bad",
      badge: `${passCount}/5 · 图底黏连`,
      headline: "人物滑出了暖光背底，暗影黏在深松青背景里",
      body: "单人剪影靠明暗反差立住轮廓。现在主体偏离了身后的亮区，剪影边缘和暗背景几乎融在一起，第一眼很难立刻锁住主角。",
      hint: "横向摇动取景画布，把人物剪影移回暖米亮月或亮窗前方。",
      fixLabel: "对齐暖光背底",
      fixAction: "alignLight",
    };
  } else if (lookBlocked) {
    const dirZh = state.facing === "right" ? "右" : "左";
    diag = {
      code: "LOOK_BLOCKED",
      severity: "bad",
      badge: `${passCount}/5 · 视线堵墙`,
      headline: `人物朝${dirZh}看，前方只剩 ${Math.round(lookRoom * 100)}% 画面——迎面撞墙`,
      body: `目光和行走方向自带隐形延长线。现在人物面朝${dirZh}边却靠得太近，视线刚离开脸就撞上画框边线，整幅画面显得憋闷局促。`,
      hint: `向${dirZh === "右" ? "左" : "右"}摇镜给视线留出 ≥ 40% 的前方呼吸空间，或切换人物朝向。`,
      fixLabel: "留出视线空间",
      fixAction: "fixLookRoom",
    };
  } else if (jointCut) {
    diag = {
      code: "JOINT_CUT",
      severity: "bad",
      badge: `${passCount}/5 · ${cutInfo.label}`,
      headline: `下画框正切在${cutInfo.label}，人物肢体像被硬截断`,
      body: `${cutInfo.detail}影视片场构图讲究避开脚踝、膝盖与颈部三处关节线，宁可再退半步露全脚，或再推半步切到安全肌肉中段。`,
      hint: "点下方五格暖米「景别参考」切到完整全景或安全中/近景，或调「俯仰留顶」。",
      fixLabel: "切至安全景别",
      fixAction: "fixScale",
    };
  } else if (headClipped) {
    diag = {
      code: "HEAD_CLIPPED",
      severity: "bad",
      badge: `${passCount}/5 · 削顶压迫`,
      headline: `头顶留白只剩 ${Math.round(headroom * 100)}%，上画框死死压住了脑袋`,
      body: "除了极紧的特写有意切额头来制造压迫，普通单人镜头如果把头顶顶到上框边，观众会本能觉得画面天花板压下来、人物直不起腰。",
      hint: "向下调一点「俯仰留顶」（键盘 ↓），给头顶留出 6%–22% 舒适空间。",
      fixLabel: "恢复头顶留白",
      fixAction: "fixTilt",
    };
  } else if (headSunk) {
    diag = {
      code: "HEAD_SUNK",
      severity: "bad",
      badge: `${passCount}/5 · 空顶下沉`,
      headline: `头顶上方空出 ${Math.round(headroom * 100)}% 死空，人物往下沉坠`,
      body: "在中近景里，头顶上方留出大片毫无信息的空白不会显得「高级」，反而像摄影师端歪了机器，把人物压到了画面底端。",
      hint: "向上微调「俯仰留顶」（键盘 ↑），把人物头眼拉回上三分线附近。",
      fixLabel: "上提画面构图",
      fixAction: "fixTilt",
    };
  } else if (scaleMismatch) {
    diag = {
      code: "SCALE_MISMATCH",
      severity: "bad",
      badge: `${passCount}/5 · 景别失配`,
      headline: `当前是「${shot.zh}」，与本场「${scene.intent}」的需求背离`,
      body: `原海报提示「更近的景别能增强情绪与存在感，更远的景别能强化环境与氛围」。当前场景更需要${scene.targetLabel}来兑现叙事目的。`,
      hint: `点击下方「景别参考」里的${scene.targetLabel}，或拖动景别焦距推杆。`,
      fixLabel: `切到${scene.targetLabel.slice(0, 2)}`,
      fixAction: "fixScale",
    };
  } else if (spaceCramped) {
    diag = {
      code: "SPACE_CRAMPED",
      severity: "bad",
      badge: `${passCount}/5 · 留白不足`,
      headline: `静空留白仅 ${Math.round(quietRatio * 100)}%，主体喘不过气`,
      body: "在非特写景别下，如果主体与杂物塞满过半画幅，单人构图最迷人的呼吸感就会消失，观众视线无处停顿。",
      hint: "往远景方向略微拉远焦距，把安静的留白放大到 50% 以上。",
      fixLabel: "拉远留出呼吸",
      fixAction: "fixScale",
    };
  } else if (subjectTooTiny) {
    diag = {
      code: "SUBJECT_TINY",
      severity: "bad",
      badge: `${passCount}/5 · 主体淹没`,
      headline: "人物缩得太小，已经快在画面里辨认不出是主体",
      body: "留白服务于主体，而不是把主体吞没。现在人物高度不足画框 8%，容易被误当成背景噪点。",
      hint: "向前推近焦距，让主体在辽阔环境里仍保持清晰可辨的轮廓。",
      fixLabel: "推近锁定轮廓",
      fixAction: "fixScale",
    };
  } else {
    const styleNote =
      shot.id === "ls"
        ? "辽阔远景解 · 环境氛围拉满"
        : shot.id === "ecu"
        ? "紧迫特写解 · 情绪张力满格"
        : Math.abs(subjU - 0.5) < 0.08
        ? "居中仪式解 · 端稳凝视"
        : subjU < 0.45
        ? "左偏留白解 · 视线舒展"
        : "右偏平衡解 · 承袭原海报气韵";
    diag = {
      code: "OK",
      severity: "ok",
      badge: `5/5 · ${styleNote}`,
      headline: `单人构图成立：唯一主体在「${shot.zh}」里稳稳接住了整幅画面`,
      body: isECU
        ? `画框清净无杂物，${shot.zh}紧锁人物轮廓，背景留息 ${Math.round(quietRatio * 100)}% 干净不抢戏——此时不必机械套用「留白 ≥ 50%」，情绪和存在感就是第一主角。`
        : `画框内只剩一个高反差剪影，静空留白占 ${Math.round(quietRatio * 100)}%，头顶留白 ${Math.round(headroom * 100)}%，避开了所有关节禁切带，视线一进画面就直接落在主角身上。`,
      hint: "你可以继续换景别、切换场景或试错按钮，体会不同边界如何破坏这份平衡。",
      fixLabel: null,
      fixAction: null,
    };
  }

  return {
    scene,
    shot,
    focal,
    subjU,
    scale: s,
    tilt,
    bodyH,
    bodyW,
    headTopV,
    footV,
    cliffTopV,
    cutFrac,
    cutInfo,
    lightU,
    lightV,
    lightR,
    distractors,
    visibleDistractors,
    separation,
    subjectArea,
    quietRatio,
    lookRoom,
    headroom,
    cgU,
    principleStatus,
    takeawayChecks,
    passCount,
    diag,
    statusLabel: passCount === 5 ? "单人聚焦（示意）" : passCount >= 3 ? "局部失衡（示意）" : "焦点涣散（示意）",
  };
}

// ---------- 第 03 节：人体关节裁切标尺台 ----------
export function evaluateBodyCrop(cutFrac) {
  const c = clamp(cutFrac, 0.14, 1.08);
  if (c >= 1.0) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[1],
      safe: true,
      zone: "完整全身（脚下留地）",
      emotion: "完整交待人物站姿与周围空间的关系，情绪克制客观。",
      ratioText: "留白约 72% · 主体与环境共叙",
    };
  }
  if (c >= 0.88) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[1],
      safe: false,
      zone: "禁切带 · 脚踝削脚",
      emotion: "最容易犯的随手拍失误：只差一寸没把鞋拍全，看着像被边框误截。",
      ratioText: "建议退半步露全脚，或果断推到大腿中段",
    };
  }
  if (c >= 0.785) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[2],
      safe: true,
      zone: "小腿中段（七分身）",
      emotion: "比全景贴近一些，避开了脚踝和膝盖，常用于走动中的跟拍。",
      ratioText: "留白约 64% · 行动感增强",
    };
  }
  if (c >= 0.67) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[2],
      safe: false,
      zone: "禁切带 · 正切膝关节",
      emotion: "关节处恰好贴底边会制造强烈的停顿与截断感，削弱人物站立的稳定。",
      ratioText: "向上挪至大腿中段（中景），或向下让出小腿",
    };
  }
  if (c >= 0.45) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[2],
      safe: true,
      zone: "安全线 · 大腿中段至腰臀（经典中景）",
      emotion: "影视里最常用的叙事距离：能看清手势与姿态，也开始读到神态。",
      ratioText: "留白约 58% · 人物与环境均衡",
    };
  }
  if (c >= 0.24) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[3],
      safe: true,
      zone: "安全线 · 胸口至锁骨（标准近景）",
      emotion: "环境迅速退到幕后，观众进入人物的个人情绪距离，存在感大幅提升。",
      ratioText: "留白约 44% · 情绪开始主导画面",
    };
  }
  if (c >= 0.165) {
    return {
      cutFrac: c,
      shot: SHOT_SCALES[3],
      safe: false,
      zone: "禁切带 · 正切颈部下巴",
      emotion: "底框把脖子和肩线切掉，头部会像浮在画框底部，缺少支撑。",
      ratioText: "略退一点带出双肩，或干脆推入头部特写",
    };
  }
  return {
    cutFrac: c,
    shot: SHOT_SCALES[4],
    safe: true,
    zone: "安全线 · 头部轮廓紧裁（特写）",
    emotion: "退无可退的亲密与压迫感，哪怕是无五官侧影也能传递极强张力。",
    ratioText: "主体占画超半数 · 此时重背景纯净而非留白面积",
  };
}

// ---------- 第 04 节：四维图底分离灯棚 ----------
export function evaluateLightingStudio({ luma, blur, color, clean }) {
  // luma: "flat" | "backlight" | "spotlight"
  // blur: false (f/11) | true (f/2.0)
  // color: false (同色混融) | true (冷暖分离)
  // clean: false (背景杂乱) | true (几何极简)
  let score = 0;
  const reasons = [];
  if (luma === "backlight") {
    score += 2;
    reasons.push("逆光暖月把深色剪影整圈托起，轮廓一眼成立");
  } else if (luma === "spotlight") {
    score += 2;
    reasons.push("单束主光照亮人物、压暗四周，天然形成视线漏斗");
  } else {
    reasons.push("人物与背景明度接近，轮廓边缘黏连");
  }
  if (blur) {
    score += 1;
    reasons.push("f/2.0 浅景深把后景化开，细节不再抢夺焦点");
  }
  if (color) {
    score += 1;
    reasons.push("冷松青环境与暖米光形成色温隔离");
  }
  if (clean) {
    score += 1;
    reasons.push("背景做完减法后，不再有多余线条打断视线");
  }

  let level = "图底塌陷（示意）";
  let verdict = "人物几乎隐没在背景里";
  let advice = "先拉出明暗反差（开逆光或聚光），或做背景减法，哪怕只开两项，主角也会立刻跳出来。";
  let state = "bad";

  if (score >= 4) {
    level = "一眼锁焦（示意）";
    verdict = "主角与背景彻底分离，注意力零损耗";
    advice = "这正是单人构图最省力的状态：光影、色温与简洁背景共同替你喊出「看这里」。";
    state = "ok";
  } else if (score >= 2) {
    level = "基本可辨（示意）";
    verdict = "主体已经立住，但还能再干脆一点";
    advice = !clean
      ? "轮廓已有反差，不过背后杂物仍会分走余光；打开「环境减法」或「f/2.0 虚化」会立刻清静。"
      : luma === "flat"
      ? "背景虽然干净，但明度太接近；补上逆光或主光反差，剪影会更有力度。"
      : "只需再加一项色温隔离或景深虚化，画面质感就会跃升一档。";
    state = "warn";
  }

  return { score, max: 5, level, verdict, advice, reasons, state };
}

// ---------- 第 06 节：两道单变量选镜练习 ----------
export const QUIZ_ROUNDS = [
  {
    id: "q1",
    num: "01 / 02",
    prompt: "海堤上的独行者正面向右侧远方。四张全景的焦段、光影与头顶留白完全相同，只改变了人物的水平位置——哪一镜最舒展？",
    variable: "单一变量：主体水平落位（其余全同）",
    options: [
      {
        key: "A",
        label: "镜头 A",
        subjU: 0.82,
        facing: "right",
        cutMode: "full",
        correct: false,
        explain: "镜头 A 把朝右看的人物压到了右侧 82% 处，目光刚离开轮廓就撞上右框边线，前方窒息、身后却空出一大块无关背景。",
      },
      {
        key: "B",
        label: "镜头 B",
        subjU: 0.50,
        facing: "right",
        cutMode: "full",
        correct: false,
        explain: "镜头 B 居中摆得工整，但人物明确朝右张望，正中位置把前方的视线空间平分掉了一半，方向势能变弱。",
      },
      {
        key: "C",
        label: "镜头 C",
        subjU: 0.34,
        facing: "right",
        cutMode: "full",
        correct: true,
        explain: "镜头 C 把朝右的人物落在左三分线附近（约 34%），右侧留出约三分之二开阔空间接住视线，重心与方向感同时成立。",
      },
      {
        key: "D",
        label: "镜头 D",
        subjU: 0.11,
        facing: "right",
        cutMode: "full",
        correct: false,
        explain: "镜头 D 虽然前方空间极大，但人物紧贴左边缘（11%），后背几乎粘在画框上，整幅画面像向左倾倒。",
      },
    ],
  },
  {
    id: "q2",
    num: "02 / 02",
    prompt: "室内静候的一镜，需要从环境过渡到人物近况（中近景）。四镜的水平落位、明暗与背景完全一致，只改变了相机垂直裁切——哪一镜最稳？",
    variable: "单一变量：垂直裁切与头顶留白（其余全同）",
    options: [
      {
        key: "A",
        label: "镜头 A",
        subjU: 0.56,
        facing: "left",
        cutMode: "knee",
        correct: false,
        explain: "镜头 A 的下框线恰好硬切在膝盖关节上，是片场构图大忌「关节硬切」，视觉上显得仓促又截肢感强。",
      },
      {
        key: "B",
        label: "镜头 B",
        subjU: 0.56,
        facing: "left",
        cutMode: "clipHead",
        correct: false,
        explain: "镜头 B 虽切在胸口，但头顶紧顶画框上沿（留顶不足 2%），非特写镜头里的削顶会让观者产生强烈压迫感。",
      },
      {
        key: "C",
        label: "镜头 C",
        subjU: 0.56,
        facing: "left",
        cutMode: "chestSafe",
        correct: true,
        explain: "镜头 C 底框稳稳落在胸口安全区、完整保留肩线支撑，同时头顶留出约 12% 舒适空间，既避开所有关节又顺滑拉近了情绪距离。",
      },
      {
        key: "D",
        label: "镜头 D",
        subjU: 0.56,
        facing: "left",
        cutMode: "sunkHead",
        correct: false,
        explain: "镜头 D 头顶上方留出超过 44% 的无信息死空，人物被压沉在画框下半截，显得像机位俯仰没端平。",
      },
    ],
  },
];
