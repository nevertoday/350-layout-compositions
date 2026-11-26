// 083 浅景深构图 — 单真源光学计算模型（36×24mm 全画幅薄透镜共轭成像与弥散圆）
// 所有取景画面、景深标尺、四要素徽章、诊断文、光路图与判卷练习全部读取同一份实算结果。

export const SENSOR_WIDTH_MM = 36;
export const COC_SHARP_LIMIT_MM = 0.03; // 35mm 全画幅经典清晰弥散圆上限（经验标准 ≈ d/1440）

export const APERTURE_STOPS = [1.2, 1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16];
export const FOCAL_OPTIONS = [28, 50, 85, 135];

export const SCENES = {
  poppy: {
    id: "poppy",
    name: "原海报·虞美人",
    en: "POSTER POPPY",
    subjectName: "橙红虞美人",
    subjectZ: 2.2,
    subjectDepth: 0.075, // 花冠前后厚度约 7.5 cm
    fgZ: 0.85,
    nearZ: 1.48,
    bgLabel: "后景花枝与光斑",
    fgLabel: "前景深青花苞",
    desc: "1:1 呼应 083 原海报：暖米底上盛开的橙红虞美人，前后漂浮青蓝与暖橙虚化光斑。",
  },
  portrait: {
    id: "portrait",
    name: "窗边人像·侧影",
    en: "WINDOW PROFILE",
    subjectName: "人物侧影",
    subjectZ: 2.2,
    subjectDepth: 0.12, // 侧脸到后肩纵深约 12 cm
    fgZ: 0.9,
    nearZ: 1.5,
    bgLabel: "窗棂与暖色吊灯",
    fgLabel: "前景窗台绿叶",
    desc: "咖啡馆窗边逆光侧影剪影（不绘五官细节），考验大光圈下人像厚度与暖灯散景的平衡。",
  },
  still: {
    id: "still",
    name: "长焦静物·茶器",
    en: "TELEPHOTO TEA",
    subjectName: "朱泥茶壶",
    subjectZ: 2.2,
    subjectDepth: 0.095, // 壶嘴到壶把纵深约 9.5 cm
    fgZ: 0.92,
    nearZ: 1.52,
    bgLabel: "后排茶罐与屏风灯",
    fgLabel: "前景深青品茗杯",
    desc: "桌面静物纵深场景：近处深青茶杯、中景朱泥茶壶、远景茶罐与格栅暖灯。",
  },
};

// 开场刻意停在复合错态（0/4 待校准）：
// 50mm + f/8.0 + 后跑焦到 5.8m + 背景紧贴主体 0.60m
// 实测：主体弥散圆 0.089mm（清晰度超标 3× 跑焦），而远背景反而锐利，近背景贴背杂乱。
export const INITIAL_STATE = {
  scene: "poppy",
  focalMm: 50,
  aperture: 8.0,
  focusM: 5.8,
  bgSepM: 0.6,
  fgBlocker: false,
};

export const PRESETS = {
  posterClassic: {
    id: "posterClassic",
    label: "原海报解 · 85mm f/2",
    kind: "valid",
    state: { focalMm: 85, aperture: 2.0, focusM: 2.2, bgSepM: 3.4, fgBlocker: false },
  },
  fastStandard: {
    id: "fastStandard",
    label: "标头大光圈 · 50mm f/1.4",
    kind: "valid",
    state: { focalMm: 50, aperture: 1.4, focusM: 2.2, bgSepM: 3.8, fgBlocker: false },
  },
  teleCompress: {
    id: "teleCompress",
    label: "长焦压缩 · 135mm f/4",
    kind: "valid",
    state: { focalMm: 135, aperture: 4.0, focusM: 2.2, bgSepM: 3.4, fgBlocker: false },
  },
  errRazor: {
    id: "errRazor",
    label: "试错：过薄削主体",
    kind: "error",
    state: { focalMm: 135, aperture: 1.2, focusM: 2.2, bgSepM: 3.2, fgBlocker: false },
  },
  errWall: {
    id: "errWall",
    label: "试错：背景贴墙",
    kind: "error",
    state: { focalMm: 85, aperture: 2.0, focusM: 2.2, bgSepM: 0.4, fgBlocker: false },
  },
  errFront: {
    id: "errFront",
    label: "试错：前跑焦",
    kind: "error",
    state: { focalMm: 85, aperture: 2.0, focusM: 0.9, bgSepM: 3.2, fgBlocker: false },
  },
  resetBroken: {
    id: "resetBroken",
    label: "复原开场错态",
    kind: "reset",
    state: { ...INITIAL_STATE },
  },
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 薄透镜核心计算：给定焦距(mm)、光圈F值、对焦距离(m)、任意物距s(m)，返回36mm传感器上的弥散圆直径(mm)
export function circleOfConfusionMm(focalMm, aperture, focusM, objectM) {
  const f = focalMm / 1000;
  const u = Math.max(focusM, f + 0.08);
  const s = Math.max(objectM, f + 0.05);
  const cocM = ((f * f) / (aperture * (u - f))) * (Math.abs(s - u) / s);
  return cocM * 1000;
}

// 计算景深带（近清晰界 Dn、远清晰界 Df、超焦距 H、总景深 dofM、入瞳直径 pupilMm）
export function computeDepthOfField(focalMm, aperture, focusM, cocLimitMm = COC_SHARP_LIMIT_MM) {
  const f = focalMm / 1000;
  const c = cocLimitMm / 1000;
  const u = Math.max(focusM, f + 0.08);
  const H = (f * f) / (aperture * c) + f;
  const nearM = (u * (H - f)) / (H + u - 2 * f);
  const farM = u < H ? (u * (H - f)) / (H - u) : Infinity;
  const dofM = Number.isFinite(farM) ? Math.max(0, farM - nearM) : Infinity;
  const pupilMm = focalMm / aperture;
  const magnification = f / (u - f);
  return {
    hyperfocalM: H,
    nearM,
    farM,
    dofM,
    pupilMm,
    magnification,
  };
}

// 将弥散圆(mm)换算成画布相对虚化半径（按 36mm 传感器宽折算到参考画幅像素，保证画与数严格同步）
export function cocToCanvasBlurPx(cocMm, refWidthPx = 640) {
  const raw = (cocMm / SENSOR_WIDTH_MM) * refWidthPx;
  return clamp(raw, 0, 44);
}

// 格式化长度：极浅景深用 cm，一般用 m，无穷远用 ∞
export function formatDist(m) {
  if (!Number.isFinite(m) || m > 99) return "∞";
  if (m < 0.5) return `${(m * 100).toFixed(1)} cm`;
  if (m < 10) return `${m.toFixed(2)} m`;
  return `${m.toFixed(1)} m`;
}

export function formatDof(dofM) {
  if (!Number.isFinite(dofM) || dofM > 40) return "全景 ∞";
  if (dofM < 1.0) return `${(dofM * 100).toFixed(1)} cm`;
  return `${dofM.toFixed(2)} m`;
}

export function formatAperture(n) {
  return Number.isInteger(n) ? `f/${n}` : `f/${n.toFixed(1)}`;
}

// 焦段相对 50mm 的视角压缩系数（用于保持主体近等大构图时背景的光学倍率变化）
export function bgCompressionScale(focalMm) {
  // 28mm -> 0.78x 广角拉开；50mm -> 1.00x；85mm -> 1.24x；135mm -> 1.56x 长焦拉近压缩
  return clamp(0.62 + (focalMm / 50) * 0.36, 0.74, 1.62);
}

// 单真源全面评估：根据当前镜头状态算出5层物理距离、每层CoC、四要素达标度、具体错因与下一步纠偏动作
export function evaluateOptics(rawState) {
  const sceneCfg = SCENES[rawState.scene] || SCENES.poppy;
  const focalMm = clamp(Number(rawState.focalMm) || 50, 24, 200);
  const aperture = clamp(Number(rawState.aperture) || 8, 1.2, 16);
  const focusM = clamp(Number(rawState.focusM) || 2.2, 0.55, 10.0);
  const bgSepM = clamp(Number(rawState.bgSepM) || 0.6, 0.3, 5.5);
  const fgBlocker = Boolean(rawState.fgBlocker);

  const dof = computeDepthOfField(focalMm, aperture, focusM);

  const zFg = fgBlocker ? 0.58 : sceneCfg.fgZ;
  const zNear = sceneCfg.nearZ;
  const zSubject = sceneCfg.subjectZ;
  const zSubjectBack = zSubject + sceneCfg.subjectDepth * 0.72;
  const zMidBg = zSubject + bgSepM;
  const zFarBg = zSubject + bgSepM * 2.15 + 1.25;

  const planes = [
    { id: "fg", label: sceneCfg.fgLabel, z: zFg },
    { id: "near", label: "近景配枝", z: zNear },
    { id: "subject", label: sceneCfg.subjectName, z: zSubject },
    { id: "subjectBack", label: "主体背缘", z: zSubjectBack },
    { id: "midBg", label: sceneCfg.bgLabel, z: zMidBg },
    { id: "farBg", label: "远景光斑", z: zFarBg },
  ].map((p) => {
    const cocMm = circleOfConfusionMm(focalMm, aperture, focusM, p.z);
    const inSharpZone = cocMm <= COC_SHARP_LIMIT_MM * 1.15;
    return {
      ...p,
      cocMm,
      inSharpZone,
      blurPx: cocToCanvasBlurPx(cocMm, 720),
    };
  });

  const byId = Object.fromEntries(planes.map((p) => [p.id, p]));
  const subjCoC = byId.subject.cocMm;
  const subjBackCoC = byId.subjectBack.cocMm;
  const midBgCoC = byId.midBg.cocMm;
  const farBgCoC = byId.farBg.cocMm;
  const fgCoC = byId.fg.cocMm;

  const focusDeltaM = focusM - zSubject;
  const isSubjectSharp = subjCoC <= 0.036;
  const isFrontFocused = !isSubjectSharp && focusDeltaM < 0;
  const isBackFocused = !isSubjectSharp && focusDeltaM > 0;

  // 主体纵深覆盖率：景深过薄时连主体自己的后半段都会溶糊
  const subjectCoverage = Number.isFinite(dof.dofM)
    ? clamp(dof.dofM / sceneCfg.subjectDepth, 0, 2)
    : 2;
  const isRazorThin = isSubjectSharp && dof.dofM < sceneCfg.subjectDepth * 0.48 && subjBackCoC > 0.052;

  // 背景虚化强度（以中后景为主，远景为辅；36mm 全画幅上弥散圆 ≥ 0.32 mm 才开始融化杂乱硬边）
  const effectiveBgCoC = midBgCoC * 0.72 + farBgCoC * 0.28;
  const isBgMelted = effectiveBgCoC >= 0.36 && midBgCoC >= 0.32;
  const isBgWallTrap = isSubjectSharp && !isBgMelted && bgSepM < 0.85 && aperture <= 2.8 && focalMm >= 50;
  const isDeepClutter = isSubjectSharp && !isBgMelted && !isBgWallTrap;
  const isFgVeil = fgBlocker && fgCoC >= 0.75;

  // 四要素（对应原海报核心要点：主体 / 焦点 / 虚化 / 视觉引导）实时状态
  const subjectOk = isSubjectSharp && !isRazorThin && !isFgVeil;
  const focusOk = isSubjectSharp;
  const blurOk = isBgMelted && !isFgVeil;
  const guidanceOk = subjectOk && focusOk && blurOk;

  const passedCount = [subjectOk, focusOk, blurOk, guidanceOk].filter(Boolean).length;

  // 判定主错态（严格 7 类双向光学诊断）
  let code = "valid";
  let badge = "4/4 · 浅景深成立";
  let headline = `焦点锁稳 ${sceneCfg.subjectName}，背景化成柔滑散景`;
  let explanation = `当前合焦在 ${focusM.toFixed(2)} m，景深 ${formatDof(dof.dofM)} 稳稳包住主体完整纵深（主体弥散圆 ${subjCoC.toFixed(3)} mm），而 ${zMidBg.toFixed(1)} m 处的背景弥散圆已扩至 ${midBgCoC.toFixed(2)} mm。背景高频轮廓退成低频色斑，视线进画第一步就直落主体。`;
  let actionHint = "可继续切换焦段（50 / 85 / 135mm）或场景，体会多组合法解的不同空间压缩感。";
  let fixLabel = "体验长焦压缩解";
  let fixPatch = { focalMm: 135, aperture: 4.0, focusM: zSubject, bgSepM: 3.4, fgBlocker: false };

  if ((isFrontFocused || isBackFocused) && !isBgMelted) {
    code = "compound-broken";
    const dir = isBackFocused ? "后跑焦" : "前跑焦";
    badge = `0/4 · ${dir}且背景过实`;
    headline = `焦点跑偏 ${Math.abs(focusDeltaM).toFixed(2)} m，主体糊而背景仍杂乱`;
    explanation = `合焦面现在停在 ${focusM.toFixed(2)} m，远离位于 ${zSubject.toFixed(2)} m 的${sceneCfg.subjectName}（主体弥散圆 ${subjCoC.toFixed(3)} mm，超过清晰上限 0.030 mm）；同时 ${formatAperture(aperture)} 光圈偏小且背景只隔了 ${bgSepM.toFixed(2)} m，杂乱边缘没有化开，整张画面主次全散。`;
    actionHint = `先在取景画布上横向拖焦把清晰面拉回 ${zSubject.toFixed(2)} m，再开大光圈（如 f/2.0）并拉开背景距离。`;
    fixLabel = "先拉回焦点到主体";
    fixPatch = { focusM: zSubject };
  } else if (isBackFocused) {
    code = "back-focus";
    badge = `${passedCount}/4 · 后跑焦`;
    headline = `焦点后移 ${Math.abs(focusDeltaM).toFixed(2)} m，落到了背景上`;
    explanation = `虽然光圈和距离已经能制造虚化，但合焦平面停在 ${focusM.toFixed(2)} m 的背景层上，位于 ${zSubject.toFixed(2)} m 的${sceneCfg.subjectName}弥散圆扩大到 ${subjCoC.toFixed(3)} mm，眼睛会本能掠过模糊的主体去看清晰的背景。`;
    actionHint = `向左横拖画布或点击画中的${sceneCfg.subjectName}，把对焦距离收回到 ${zSubject.toFixed(2)} m。`;
    fixLabel = "合焦锁定主体";
    fixPatch = { focusM: zSubject };
  } else if (isFrontFocused) {
    code = "front-focus";
    badge = `${passedCount}/4 · 前跑焦`;
    headline = `焦点前移 ${Math.abs(focusDeltaM).toFixed(2)} m，锁住了前景杂枝`;
    explanation = `清晰带停在 ${focusM.toFixed(2)} m 的前景处，前景花苞锐利抢眼，真正的主体（${zSubject.toFixed(2)} m）反而落进 ${subjCoC.toFixed(3)} mm 的焦外模糊区——有大片虚化不等于浅景深成立，主体必须是唯一锐利点。`;
    actionHint = `向右横拖画布或直接点选${sceneCfg.subjectName}，将合焦面推回 ${zSubject.toFixed(2)} m。`;
    fixLabel = "把焦点推回主体";
    fixPatch = { focusM: zSubject };
  } else if (isFgVeil) {
    code = "fg-veil";
    badge = `${passedCount}/4 · 前景糊墙遮挡`;
    headline = `前景杂物贴镜头仅 ${zFg.toFixed(2)} m，爆成巨团色雾挡住主体`;
    explanation = `浅景深不仅虚化背景，也会把离镜头极近的前景急剧放大成弥散圆（当前前景弥散圆高达 ${fgCoC.toFixed(2)} mm）。前景元素闯进主体正前方时，反而会像一层脏雾把核心遮灰。`;
    actionHint = "移开正前方的遮挡杂物，只把虚化前景留在画面边角作框景。";
    fixLabel = "清开前景遮挡";
    fixPatch = { fgBlocker: false };
  } else if (isRazorThin) {
    code = "razor-thin";
    badge = `${passedCount}/4 · 景深过薄削主体`;
    headline = `景深缩到仅 ${formatDof(dof.dofM)}，连主体自身后半都被削糊`;
    explanation = `${focalMm}mm 叠加 ${formatAperture(aperture)} 在 ${focusM.toFixed(2)} m 处只留出 ${formatDof(dof.dofM)} 清晰带，比${sceneCfg.subjectName}自身厚度（${(sceneCfg.subjectDepth * 100).toFixed(1)} cm）还要薄一半以上。主体前沿虽锐，后缘弥散圆已达 ${subjBackCoC.toFixed(3)} mm，结构发软——光圈并非越大越好。`;
    actionHint = "稍微收小一两档光圈（例如收至 f/2.8–f/4），或换用 85mm 焦段，先保住主体完整清晰。";
    fixLabel = "收光圈保主体厚度";
    fixPatch = { aperture: focalMm >= 135 ? 4.0 : 2.0 };
  } else if (isBgWallTrap) {
    code = "bg-wall";
    badge = `${passedCount}/4 · 背景贴墙难虚`;
    headline = `已开到 ${formatAperture(aperture)}，但背景贴背仅 ${bgSepM.toFixed(2)} m 拉不开虚化`;
    explanation = `薄透镜弥散圆与「背景到主体的距离比 |s−u|/s」直接成正比。现在背景紧贴主体后方仅 ${bgSepM.toFixed(2)} m，即便用 ${focalMm}mm ${formatAperture(aperture)}，背景弥散圆也只有 ${midBgCoC.toFixed(2)} mm，轮廓依旧清晰可见。`;
    actionHint = "把底部「主体与背景距离」推到 2.0 m 以上——让主体往前走两步，比砸钱换超大光圈更管用。";
    fixLabel = "拉开主背距到 3.4 m";
    fixPatch = { bgSepM: 3.4 };
  } else if (isDeepClutter) {
    code = "deep-clutter";
    badge = `${passedCount}/4 · 景深过深抢戏`;
    headline = `主体已合焦，但景深达 ${formatDof(dof.dofM)}，背景轮廓仍在抢戏`;
    explanation = `你已经把焦点对准了 ${sceneCfg.subjectName}，但当前 ${focalMm}mm + ${formatAperture(aperture)} 入瞳口径仅 ${dof.pupilMm.toFixed(1)} mm，${zMidBg.toFixed(1)} m 处背景弥散圆只有 ${midBgCoC.toFixed(2)} mm。背景与主体清晰度差距太小，眼睛仍会被后方杂乱线条分流。`;
    actionHint = "把底部光圈开大到 f/2.0–f/2.8、或切到 85mm / 135mm 长焦并拉开主背距，扩大入瞳与背景弥散圆。";
    fixLabel = "切到 85mm f/2.0 原海报解";
    fixPatch = { focalMm: 85, aperture: 2.0, bgSepM: Math.max(bgSepM, 3.0) };
  }

  // 分离度档位（遵守 BRIEF：示意指标用档位，不伪装成精密百分数）
  let separationTier = "背景粘连（示意）";
  if (isRazorThin) separationTier = "过度削薄（示意）";
  else if (!isSubjectSharp) separationTier = "主体失焦（示意）";
  else if (isBgMelted && midBgCoC >= 0.42) separationTier = "奶油级分离（示意）";
  else if (isBgMelted) separationTier = "清晰分离（示意）";
  else if (midBgCoC >= 0.1) separationTier = "轻度柔化（示意）";

  const keypoints = [
    {
      id: "subject",
      zh: "主体",
      en: "SUBJECT",
      ok: subjectOk,
      status: isFgVeil ? "被前景挡" : isRazorThin ? "背缘失焦" : isSubjectSharp ? "清晰独立" : "主体发糊",
    },
    {
      id: "focus",
      zh: "焦点",
      en: "FOCUS",
      ok: focusOk,
      status: isSubjectSharp
        ? `锁定 ${focusM.toFixed(1)}m`
        : `${focusDeltaM > 0 ? "后偏" : "前偏"} ${Math.abs(focusDeltaM).toFixed(1)}m`,
    },
    {
      id: "blur",
      zh: "虚化",
      en: "BLUR",
      ok: blurOk,
      status: isFgVeil ? "前景过糊" : isBgMelted ? `散景 ${midBgCoC.toFixed(2)}mm` : `背景过实`,
    },
    {
      id: "guidance",
      zh: "视觉引导",
      en: "GUIDANCE",
      ok: guidanceOk,
      status: guidanceOk ? "直达焦点" : "视线分流",
    },
  ];

  return {
    state: { scene: sceneCfg.id, focalMm, aperture, focusM, bgSepM, fgBlocker },
    sceneCfg,
    dof,
    planes,
    byId,
    metrics: {
      subjCoC,
      subjBackCoC,
      midBgCoC,
      farBgCoC,
      fgCoC,
      pupilMm: dof.pupilMm,
      subjectCoverage,
      compression: bgCompressionScale(focalMm),
      separationTier,
    },
    diagnosis: {
      code,
      valid: code === "valid",
      passedCount,
      badge,
      headline,
      explanation,
      actionHint,
      fixLabel,
      fixPatch,
    },
    keypoints,
  };
}

// 02 节「等放大率光学对照」：锁住主体在传感器上同一高度（同一成像倍率 m0），计算不同焦段所需物距与景深
export function computeEqualMagOptics(focalMm, aperture, bgSepM, lockMagnification) {
  // 基准：50mm 在 2.0m 处的放大率 m0 = 0.05 / (2.0 - 0.05) = 0.02564
  const baseM0 = 0.05 / (2.0 - 0.05);
  const f = focalMm / 1000;
  const focusM = lockMagnification ? f * (1 + 1 / baseM0) : 2.0;
  const bgM = focusM + bgSepM;
  const dof = computeDepthOfField(focalMm, aperture, focusM);
  const bgCoC = circleOfConfusionMm(focalMm, aperture, focusM, bgM);
  const infCoC = circleOfConfusionMm(focalMm, aperture, focusM, 1000);
  // 水平视角（度）
  const fovDeg = 2 * Math.atan(SENSOR_WIDTH_MM / (2 * focalMm)) * (180 / Math.PI);
  return {
    focalMm,
    aperture,
    bgSepM,
    lockMagnification,
    focusM,
    bgM,
    dof,
    bgCoC,
    infCoC,
    fovDeg,
  };
}

// 06 节两道单变量实战考题（完全由 model.js 实时参数驱动，绝不泄露好坏标签）
export const QUIZ_ROUNDS = [
  {
    id: "round-aperture",
    title: "第一题 · 固定 85mm 与 2.2m 机位，只改「光圈」",
    prompt: "窗边人物侧影停在 2.20 m（自身纵深约 12 cm），背后 5.8 m 有杂乱窗框与吊灯。四张样张机位、焦段与对焦距离完全一致，仅改变光圈档位。哪一张既保住人物完整轮廓、又让背景干净退后？",
    variableName: "光圈档位",
    scene: "portrait",
    correctIndex: 1,
    options: [
      {
        tag: "方案 A",
        sub: "f/1.2 · 85mm · 2.2m",
        params: { scene: "portrait", focalMm: 85, aperture: 1.2, focusM: 2.2, bgSepM: 3.6, fgBlocker: false },
        reason: "虽然背景极度奶油，但在 2.2m 处 85mm f/1.2 的总景深只有约 4.6 cm，连人物 12 cm 的侧影厚度都罩不住——前景帽檐清晰，肩背和后脑边缘已经发虚。",
      },
      {
        tag: "方案 B",
        sub: "f/2.8 · 85mm · 2.2m",
        params: { scene: "portrait", focalMm: 85, aperture: 2.8, focusM: 2.2, bgSepM: 3.6, fgBlocker: false },
        reason: "正确答案。85mm f/2.8 在 2.2m 处给出约 10.8 cm 景深，稳稳托住人物侧影完整轮廓，同时 5.8m 处背景弥散圆仍达 0.76 mm，窗框与吊灯化为柔滑光斑。",
      },
      {
        tag: "方案 C",
        sub: "f/8 · 85mm · 2.2m",
        params: { scene: "portrait", focalMm: 85, aperture: 8.0, focusM: 2.2, bgSepM: 3.6, fgBlocker: false },
        reason: "人物完全清晰，但景深放宽到 31 cm，5.8m 处背景弥散圆缩到 0.27 mm，背后杂乱的书架与灯线依然硬朗可见，削弱了视觉集中度。",
      },
      {
        tag: "方案 D",
        sub: "f/16 · 85mm · 2.2m",
        params: { scene: "portrait", focalMm: 85, aperture: 16, focusM: 2.2, bgSepM: 3.6, fgBlocker: false },
        reason: "小光圈接近深焦，前景绿叶、人物侧影与背景窗框几乎同等清晰，主体被杂乱环境线条吞没，完全没有形成浅景深主次。",
      },
    ],
  },
  {
    id: "round-focus",
    title: "第二题 · 固定 85mm f/2.0，只改「对焦距离」",
    prompt: "回到原海报同款虞美人（位于 2.20 m）。四张样张使用完全相同的 85mm f/2.0 与主背距，都有大片柔和虚化，唯一区别是合焦距离不同。哪一张真正把视觉重心锁在了虞美人花芯上？",
    variableName: "对焦距离",
    scene: "poppy",
    correctIndex: 2,
    options: [
      {
        tag: "方案 A",
        sub: "对焦 0.90 m",
        params: { scene: "poppy", focalMm: 85, aperture: 2.0, focusM: 0.9, bgSepM: 3.4, fgBlocker: false },
        reason: "属于典型的「前跑焦」：合焦面锁在了左下角的前景花苞上，中央的虞美人花瓣完全软糊，观众视线被拖到了画角边缘。",
      },
      {
        tag: "方案 B",
        sub: "对焦 1.50 m",
        params: { scene: "poppy", focalMm: 85, aperture: 2.0, focusM: 1.5, bgSepM: 3.4, fgBlocker: false },
        reason: "焦点落在前景与主体之间的配枝上，离虞美人还差 0.70 m。大光圈下 70 cm 偏差足以让花蕊弥散圆飙升至 0.8 mm 以上，主体完全失焦。",
      },
      {
        tag: "方案 C",
        sub: "对焦 2.20 m",
        params: { scene: "poppy", focalMm: 85, aperture: 2.0, focusM: 2.2, bgSepM: 3.4, fgBlocker: false },
        reason: "正确答案。合焦面精准切入 2.20 m 处的虞美人花芯与花瓣，前后花苞与远景自然退成柔和青橙光斑，视线进画即锁中央。",
      },
      {
        tag: "方案 D",
        sub: "对焦 5.60 m",
        params: { scene: "poppy", focalMm: 85, aperture: 2.0, focusM: 5.6, bgSepM: 3.4, fgBlocker: false },
        reason: "属于「后跑焦」：远处的杂乱背景花枝反而清清楚楚，离镜头更近的主角虞美人变成了一团模糊橙影，本末倒置。",
      },
    ],
  },
];
