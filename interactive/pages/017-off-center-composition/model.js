// 开场「偏心引力台」的唯一状态模型：画框内相对坐标 u (左→右)、v (上→下) 均为 0..1。
// 3D WebGL 与 SVG 降级版只读同一份状态，所有读数、力矩、吸附与诊断全在此处计算。

export const LIMITS = { uMin: 0.08, uMax: 0.92, vMin: 0.11, vMax: 0.89 };

// 原海报 017 的十字参考轴略偏右下，主圆稳稳落在右上象限之外
export const CROSSHAIR = { u: 0.56, v: 0.54 };

export const PRESETS = {
  center: { u: 0.5, v: 0.5, label: "居中（静态）" },
  offcenter: { u: 0.74, v: 0.36, label: "偏心（动态）" },
  extreme: { u: 0.9, v: 0.16, label: "过偏（失衡）" },
};

export const SUBJECTS = {
  orb: {
    label: "珊瑚红圆",
    en: "ORB",
    mass: 1.0,
    facing: 0, // 无方向
  },
  pointer: {
    label: "左向锐锥",
    en: "VECTOR",
    mass: 0.94,
    facing: -1, // 明确朝左
  },
  monolith: {
    label: "竖立柱块",
    en: "MONOLITH",
    mass: 1.08,
    facing: 0,
  },
};

export const COUNTERWEIGHTS = {
  arc: {
    label: "左下暗弧",
    en: "DARK ARC",
    // 深靛青大圆弧在左下象限，低对比大面积形成温和配重
    moment: 0.28,
    anchor: { u: 0.26, v: 0.76 },
  },
  dot: {
    label: "远端小印",
    en: "STAMP",
    // 远角一枚高对比小标，以力臂长度拉住主圆
    moment: 0.24,
    anchor: { u: 0.14, v: 0.84 },
  },
  none: {
    label: "无配重",
    en: "NONE",
    moment: 0,
    anchor: null,
  },
};

export function clampPos(u, v) {
  return {
    u: Math.min(LIMITS.uMax, Math.max(LIMITS.uMin, u)),
    v: Math.min(LIMITS.vMax, Math.max(LIMITS.vMin, v)),
  };
}

// 放开把手时，离「正中」或「海报偏心基准」很近就轻轻吸住，其他地方完全自由
export function snapPos(u, v) {
  const targets = [PRESETS.center, PRESETS.offcenter];
  for (const t of targets) {
    if (Math.hypot(u - t.u, v - t.v) < 0.036) return { u: t.u, v: t.v, snapped: t.label };
  }
  return { u, v, snapped: null };
}

// 计算偏离中心的距离、视觉力矩、倾斜度以及白话诊断
export function analyze(state) {
  const { u, v } = state.pos;
  const sub = SUBJECTS[state.subject] || SUBJECTS.orb;
  const cw = COUNTERWEIGHTS[state.counterweight] || COUNTERWEIGHTS.arc;

  const dx = u - 0.5;
  const dy = v - 0.5;
  const ecc = Math.hypot(dx, dy); // 0 .. ~0.58
  const edgeDist = Math.min(u, 1 - u, v, 1 - v);

  // 合成视觉重心向量（经验类比模型：主质量 × 偏离向量 + 配重 × 对侧力臂向量）
  let netX = dx * sub.mass;
  let netY = dy * sub.mass;

  // 若开启配重，配重放在主体的反象限（默认左下，或跟随主圆镜像到对侧象限）
  let cwPos = null;
  if (cw.anchor) {
    const flipX = dx < -0.06 ? 1 - cw.anchor.u : cw.anchor.u;
    const flipY = dy > 0.08 ? 1 - cw.anchor.v : cw.anchor.v;
    cwPos = { u: flipX, v: flipY };
    const cwDx = cwPos.u - 0.5;
    const cwDy = cwPos.v - 0.5;
    const cwWeight = cw.moment / Math.max(0.25, Math.hypot(cwDx, cwDy));
    netX += cwDx * cwWeight;
    netY += cwDy * cwWeight;
  }

  // 未被抵消的净拉力矩（0 = 静态归零；0.06~0.24 = 有张力且稳得住；>0.27 = 倾倒感明显）
  const netTorque = Math.hypot(netX, netY);
  // 用于 3D/SVG 舞台视觉微倾的角度（克制的 -7°..+7°）
  const tiltX = Math.max(-1, Math.min(1, netX * 2.5));
  const tiltY = Math.max(-1, Math.min(1, netY * 2.5));

  // 主体一侧腾出的空白占比（水平主导）
  const openSide = u >= 0.5 ? u : 1 - u;
  const openPct = Math.round(Math.max(42, Math.min(88, openSide * 100 - 4)));

  // 方向性判断（针对左向锐锥）
  let dirNote = "";
  let dirWarn = false;
  if (sub.facing === -1) {
    if (u >= 0.58) {
      dirNote = "锐锥朝左，正好面向左侧大片空白——视线顺着尖端滑过画心，既有冲势又留有余地。";
    } else if (u <= 0.36) {
      dirWarn = true;
      dirNote = "锐锥被压到左侧却仍朝左顶住画框，身后大片空白被晾在一边——前方憋屈，像要撞出画面。";
    } else {
      dirNote = "锐锥靠近中线，左右空间差不多，朝向带来的冲力还没完全打开。";
    }
  } else if (state.subject === "monolith") {
    dirNote =
      ecc >= 0.16 && edgeDist > 0.12
        ? "竖立柱块偏置一侧，对面自然让出一整块干净区域，适合排主标题与导语。"
        : "竖立柱块偏得不够或太贴边，另一侧还没腾出舒服的阅读留白。";
  } else {
    dirNote =
      cw.anchor && ecc >= 0.15
        ? `对侧「${cw.label}」像隐形秤砣，在斜对角拉住主圆——偏而不倒。`
        : !cw.anchor && ecc >= 0.25
          ? "此刻关掉了对角配重，可以明显感觉到画面开始往主体一侧下沉。"
          : "纯圆没有朝向，纯粹靠离中心的距离制造视线拉力。";
  }

  // 分区诊断
  let zone = "sweet";
  let badge = "偏心 · 动态稳定";
  let headline = "离轴生拉力，对角接得住";
  let body = "重心明确离开画面正中，视线先被珊瑚红吸过去，再沿着对角回到空白区——打破呆板，又有落点。";

  if (ecc < 0.045) {
    zone = "center";
    badge = "居中 · 静态";
    headline = "四向拉力归零，画面静止";
    body = "就像海报右下第一格「居中（静态）」：稳重端正，但视线一进画框就停住，没有方向和流动感。";
  } else if (ecc < 0.13) {
    zone = "awkward";
    badge = "轻偏 · 犹疑";
    headline = "偏得不够果断，像没对齐";
    body = `只离中心约 ${Math.round(ecc * 100)}%：既失去了居中的庄重，又拉不出偏心的张力。要么回正中，要么狠心推过 15%。`;
  } else if (edgeDist < 0.135 || (!cw.anchor && ecc > 0.34)) {
    zone = "over";
    badge = "过偏 · 失衡";
    headline = "贴边欲坠，重心快滑出画框";
    body = !cw.anchor
      ? "主体压得太靠边，且对侧没有任何配重——像海报第三格「过偏（失衡）」，整张画面往一侧倾斜。"
      : "虽然对侧有配重，但主体已经紧贴画框边缘，压迫感压过了动感，稍微往内收回一点更耐看。";
  } else if (ecc >= 0.30) {
    zone = "bold";
    badge = "强偏 · 边缘张力";
    headline = "推过三分线，张力翻倍";
    body = cw.anchor
      ? `离中心 ${Math.round(ecc * 100)}%，比常规三分法更大胆；靠「${cw.label}」在远端拉住，换来极强现代海报气质。`
      : `离中心 ${Math.round(ecc * 100)}%，已经站在失衡边缘；打开对侧配重，看看画面怎样瞬间稳下来。`;
  } else {
    zone = "sweet";
    badge = "偏心 · 动态稳定";
    headline = "有控制的失衡，张力恰好";
    body = cw.anchor
      ? `离中心 ${Math.round(ecc * 100)}%，正好落在海报示例的偏心甜区；对侧「${cw.label}」把拉力收进平衡里。`
      : `离中心 ${Math.round(ecc * 100)}%，张力鲜明；如果觉得空白一侧略轻，可以开启对角配重试一试。`;
  }

  if (dirWarn && zone !== "over") {
    headline = "偏心没错，但朝向顶住了近边";
    body = "把有方向的主体推向一侧时，空白要留给它朝向的那一面，而不是留在它背后。";
  }

  return {
    ecc,
    eccPct: Math.round(ecc * 100),
    netTorque,
    torquePct: Math.round(Math.min(99, netTorque * 210)),
    openPct,
    tiltX,
    tiltY,
    cwPos,
    zone,
    badge,
    headline,
    body,
    dirNote,
    dirWarn,
  };
}
