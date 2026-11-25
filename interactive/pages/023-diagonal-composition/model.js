// 023 对角线构图 · 单一几何与视觉力矩真源模块
// 画布渲染、右侧原海报四枚原则圆徽、所有数值读数与白话诊断均由此处实算输出，无写死常量。

export const EXP_BOUNDS = {
  minDeg: -72,
  maxDeg: 72,
  sweetMinDeg: 16,      // 经验下界：低于约 14°-16° 人眼易按水平基准纠错（伪水平）
  pseudoFlatDeg: 14,    // 严格伪水平错态门槛
  sweetMaxDeg: 62,      // 经验上界：高于约 62°-64° 趋近垂直柱列
  tooSteepDeg: 64,      // 严格过陡错态门槛
  deadDiagTolDeg: 2.2,  // 精准落入矩形死对角线容差
  cwClearDist: 0.115,   // 配重锚点距主斜轨最小安全垂直距离（防堵住主通道）
  balanceTol: 0.088,    // 归一化加权视觉质心允许偏移半径（经验值）
  targetCenter: { u: 0.50, v: 0.49 },
};

export const INITIAL_STATE = {
  angleDeg: 5,          // 开场刻意落在 +5° 伪水平溜斜态
  rhythm: "flat",       // 开场刻意锁在等大均分错态
  cwU: 0.22,            // 开场刻意堆在左侧下象限，与主车头同侧超载翻车
  cwV: 0.72,
  scene: "train",       // train | cyclist | poster
  showVectors: true,    // 是否叠加隐藏斜轨力线与质心标靶
};

export const SCENES = {
  train: {
    id: "train",
    label: "高速铁道",
    en: "EXPRESS RAIL",
    cwLabel: "远景城塔",
    subjectName: "高速动车",
  },
  cyclist: {
    id: "cyclist",
    label: "急弯骑行",
    en: "RACING SLOPE",
    cwLabel: "弯道标牌",
    subjectName: "冲刺车手",
  },
  poster: {
    id: "poster",
    label: "斜切海报",
    en: "SWISS POSTER",
    cwLabel: "辅文印块",
    subjectName: "主视觉斜块",
  },
};

export const RHYTHMS = {
  flat: {
    id: "flat",
    label: "等大均分",
    desc: "沿线节点大小相同、间距均等",
    // 归一化沿轨位置 s ∈ [-0.38, +0.38]，半径与视觉权重
    samples: [
      { s: -0.34, r: 0.044, w: 0.24 },
      { s: -0.11, r: 0.044, w: 0.24 },
      { s: 0.12, r: 0.044, w: 0.24 },
      { s: 0.35, r: 0.044, w: 0.24 },
    ],
  },
  reverse: {
    id: "reverse",
    label: "前小后大",
    desc: "起点小而远、终点大而堵，节奏逆向卡顿",
    samples: [
      { s: -0.36, r: 0.024, w: 0.12 },
      { s: -0.14, r: 0.036, w: 0.20 },
      { s: 0.12, r: 0.052, w: 0.34 },
      { s: 0.38, r: 0.068, w: 0.50 },
    ],
  },
  graded: {
    id: "graded",
    label: "近大远小",
    desc: "前大后小、前疏后密，拉出纵深加速度",
    samples: [
      { s: -0.34, r: 0.066, w: 0.44 },
      { s: -0.05, r: 0.048, w: 0.28 },
      { s: 0.18, r: 0.034, w: 0.17 },
      { s: 0.34, r: 0.023, w: 0.10 },
    ],
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算过中心 (0.5, 0.52)、倾角 angleDeg（数学正角：左低右高）的直线与单位画框 [0,1]×[0,1] 的精确交点
// 在屏幕坐标系中 u 向右增大，v 向下增大；上冲 angleDeg > 0 时，方向向量 dx = cos(rad), dy = -sin(rad)
export function trackSegment(angleDeg, aspect = 1.6) {
  const rad = (angleDeg * Math.PI) / 180;
  // 真实几何空间（宽=aspect, 高=1）中的单位方向向量
  const ux = Math.cos(rad);
  const uy = -Math.sin(rad);
  // 转回归一化坐标增量
  const du = ux / aspect;
  const dv = uy;

  const cu = 0.50;
  const cv = 0.54; // 略低于几何正中，呼应原海报底左起势并留出左上呼吸域

  // 求与 [0,1]×[0,1] 四边的交点参数 t
  const ts = [];
  if (Math.abs(du) > 1e-6) {
    ts.push((0 - cu) / du, (1 - cu) / du);
  }
  if (Math.abs(dv) > 1e-6) {
    ts.push((0 - cv) / dv, (1 - cv) / dv);
  }
  const valid = ts.filter((t) => {
    const u = cu + t * du;
    const v = cv + t * dv;
    return u >= -1e-4 && u <= 1 + 1e-4 && v >= -1e-4 && v <= 1 + 1e-4;
  });
  const tMin = valid.length ? Math.min(...valid) : -0.5;
  const tMax = valid.length ? Math.max(...valid) : 0.5;

  const p0 = { u: clamp(cu + tMin * du, 0, 1), v: clamp(cv + tMin * dv, 0, 1) };
  const p1 = { u: clamp(cu + tMax * du, 0, 1), v: clamp(cv + tMax * dv, 0, 1) };

  // 真实欧氏长度（以画框短边 = 1 为基准，以及相对宽度的倍长）
  const segLenH = Math.hypot((p1.u - p0.u) * aspect, p1.v - p0.v);
  const segLenRatioW = segLenH / aspect; // 相对画框宽度的倍率
  const diagCornerDeg = (Math.atan2(1, aspect) * 180) / Math.PI;

  return {
    rad,
    cu,
    cv,
    ux,
    uy,
    du,
    dv,
    p0,
    p1,
    tMin,
    tMax,
    segLenH,
    segLenRatioW,
    diagCornerDeg,
  };
}

// 点 (u,v) 到主斜轨中心线的真实几何垂直距离（归一化到画框短边 = 1）及有符号侧向（正 = 轨线上方/左上方，负 = 轨线下方/右下方）
export function pointToTrack(u, v, seg, aspect = 1.6) {
  const dx = (u - seg.cu) * aspect;
  const dy = v - seg.cv;
  // 法向量（指向轨线上侧：screen 坐标系中 (-uy, ux) 当 angle=0 时为 (0,1)向下，故取 (uy, -ux) 向上）
  const nx = seg.uy;
  const ny = -seg.ux;
  const signedDist = dx * nx + dy * ny;
  const along = dx * seg.ux + dy * seg.uy;
  return {
    signedDist,
    absDist: Math.abs(signedDist),
    along,
  };
}

// 给出建议的理想对侧配重落点（用于说明与力矩视觉参照，不自动瞬移作弊）
export function suggestedCounterweightZone(angleDeg) {
  // 主车体/斜轨视觉重心偏向下段与起势端，理想配重在斜轨另一侧空域
  if (angleDeg >= 0) {
    // 左低右高上冲：主车偏中下、右下深绿稳底，左上为最大开放空域；配重放左上（或中左偏上）可有效对冲
    return { u: 0.24, v: 0.28, zoneName: "左上开放空域" };
  }
  // 左高右下俯冲：主车由左上冲向右下，右上为最大开放空域
  return { u: 0.76, v: 0.28, zoneName: "右上开放空域" };
}

export function evaluate(state, aspect = 1.6) {
  const angleDeg = clamp(Math.round(state.angleDeg), EXP_BOUNDS.minDeg, EXP_BOUNDS.maxDeg);
  const absDeg = Math.abs(angleDeg);
  const isAscending = angleDeg >= 0; // true: 左下→右上上冲 ↗ ; false: 左上→右下俯冲 ↘
  const seg = trackSegment(angleDeg, aspect);
  const rhythmDef = RHYTHMS[state.rhythm] || RHYTHMS.flat;

  // 1. 计算沿线渲染节点实际位置与级差
  const span = seg.tMax - seg.tMin;
  const nodes = rhythmDef.samples.map((sp, idx) => {
    // s ∈ [-0.38, +0.38] 映射到线段内
    const t = seg.tMin + (0.5 + sp.s) * span;
    const u = clamp(seg.cu + t * seg.du, 0.05, 0.95);
    const v = clamp(seg.cv + t * seg.dv, 0.08, 0.92);
    return { idx, u, v, r: sp.r, w: sp.w };
  });

  const maxR = Math.max(...nodes.map((n) => n.r));
  const minR = Math.min(...nodes.map((n) => n.r));
  const scaleRatio = +(maxR / minR).toFixed(1);

  // 间距比例（首段间距 / 末段间距）
  const dFirst = Math.hypot((nodes[1].u - nodes[0].u) * aspect, nodes[1].v - nodes[0].v);
  const dLast = Math.hypot((nodes[3].u - nodes[2].u) * aspect, nodes[3].v - nodes[2].v);
  const spacingRatio = +(dFirst / Math.max(1e-4, dLast)).toFixed(2);

  // 2. 主车体 / 主视觉焦点沿轨位置（略偏中后至中前，制造冲刺动能）
  const mainT = seg.tMin + 0.44 * span;
  const mainPos = {
    u: clamp(seg.cu + mainT * seg.du, 0.14, 0.86),
    v: clamp(seg.cv + mainT * seg.dv, 0.16, 0.84),
  };

  // 3. 真实二维视觉力矩合成：主车体 + 信号黄轨带重心 + 节点群 + 右下/左下深绿楔形背景底重 + 用户可控配重锚点
  const cwU = clamp(state.cwU, 0.08, 0.92);
  const cwV = clamp(state.cwV, 0.10, 0.88);
  const cwRel = pointToTrack(cwU, cwV, seg, aspect);

  // 背景斜切深绿块天然压在下侧角落（随倾角联动），让画面有一个真实的单侧视觉重量需要配重去平衡
  const wedgeAnchor = isAscending
    ? { u: 0.72, v: 0.72, w: 0.46 }
    : { u: 0.28, v: 0.72, w: 0.46 };

  // 主体视觉权重
  const masses = [
    { u: mainPos.u, v: mainPos.v, w: 1.00 },
    { u: (seg.p0.u + seg.p1.u) * 0.5, v: (seg.p0.v + seg.p1.v) * 0.5 + 0.03, w: 0.35 },
    wedgeAnchor,
    ...nodes.map((n) => ({ u: n.u, v: n.v, w: n.w * 0.45 })),
    { u: cwU, v: cwV, w: 0.86 }, // 配重锚点具备显著可调视觉力矩
  ];

  let sumW = 0;
  let sumU = 0;
  let sumV = 0;
  for (const m of masses) {
    sumW += m.w;
    sumU += m.u * m.w;
    sumV += m.v * m.w;
  }
  const com = { u: sumU / sumW, v: sumV / sumW };
  const dU = com.u - EXP_BOUNDS.targetCenter.u;
  const dV = com.v - EXP_BOUNDS.targetCenter.v;
  const comOffset = Math.hypot(dU, dV);
  const comOffsetPct = Math.round(comOffset * 100);

  // 4. 判定四项核心原则（一一对应原海报 4 枚图标：动势、方向、张力、速度）
  const isPseudoFlat = absDeg < EXP_BOUNDS.pseudoFlatDeg;
  const isBorderFlat = absDeg >= EXP_BOUNDS.pseudoFlatDeg && absDeg < EXP_BOUNDS.sweetMinDeg;
  const isTooSteep = absDeg > EXP_BOUNDS.tooSteepDeg;
  const isBorderSteep = absDeg > EXP_BOUNDS.sweetMaxDeg && absDeg <= EXP_BOUNDS.tooSteepDeg;
  const isDeadBisect = Math.abs(absDeg - seg.diagCornerDeg) < EXP_BOUNDS.deadDiagTolDeg && state.rhythm === "flat";

  // 原则 1：动势（角度进入有效对角区间，摆脱伪水平与近垂直）
  const movementOk = absDeg >= EXP_BOUNDS.sweetMinDeg && absDeg <= EXP_BOUNDS.sweetMaxDeg && !isDeadBisect;
  let angleBand = "伪水平歪斜";
  if (absDeg === 0) angleBand = "0° 静止水平";
  else if (isPseudoFlat) angleBand = "伪水平溜斜";
  else if (isBorderFlat) angleBand = "临界偏缓";
  else if (absDeg <= 30) angleBand = isAscending ? "缓坡延展 ↗" : "缓降滑行 ↘";
  else if (absDeg <= 48) angleBand = isAscending ? "冲刺强动 ↗" : "急坠俯冲 ↘";
  else if (absDeg <= EXP_BOUNDS.sweetMaxDeg) angleBand = isAscending ? "陡坡爆发 ↗" : "险峻下压 ↘";
  else if (isBorderSteep) angleBand = "临界过陡";
  else angleBand = "趋近垂直倒塌";

  // 原则 2：方向（斜向通道贯通且配重不骑线堵路）
  const cwBlocking = cwRel.absDist < EXP_BOUNDS.cwClearDist;
  const directionOk = absDeg >= EXP_BOUNDS.sweetMinDeg && absDeg <= EXP_BOUNDS.sweetMaxDeg && !cwBlocking;

  // 原则 3：张力（大小与疏密有明确梯度，且角度处于有效区间）
  const tensionOk = state.rhythm === "graded" && movementOk;

  // 原则 4：速度与平衡（二维视觉力矩落在甜区、配重不堵路、有推进节奏）
  const balanceOk = !cwBlocking && comOffset <= EXP_BOUNDS.balanceTol;
  const speedOk = balanceOk && state.rhythm === "graded" && movementOk;

  const principles = [
    {
      id: "movement",
      zh: "动势",
      en: "MOVEMENT",
      ok: movementOk,
      reading: `${angleDeg > 0 ? "+" : ""}${angleDeg}° · ${angleBand}`,
    },
    {
      id: "direction",
      zh: "方向",
      en: "DIRECTION",
      ok: directionOk,
      reading: cwBlocking
        ? "配重骑线堵路"
        : movementOk
          ? `${isAscending ? "左下→右上" : "左上→右下"} · 轨长 ${seg.segLenRatioW.toFixed(2)}×`
          : "未成斜向通道",
    },
    {
      id: "tension",
      zh: "张力",
      en: "TENSION",
      ok: tensionOk,
      reading: state.rhythm === "graded"
        ? `级差 ${scaleRatio.toFixed(1)}× · 前疏后密`
        : state.rhythm === "reverse"
          ? "逆向堵头 · 失速"
          : `等大 ${scaleRatio.toFixed(1)}× · 平滞`,
    },
    {
      id: "speed",
      zh: "速度",
      en: "SPEED",
      ok: speedOk,
      reading: cwBlocking
        ? "配重压轨"
        : balanceOk
          ? `质心偏 ${comOffsetPct}% · 稳态`
          : `质心偏 ${comOffsetPct}% · 偏倾`,
    },
  ];

  const passCount = principles.filter((p) => p.ok).length;

  // 偏重方向白话说明
  let leanDir = "";
  if (Math.abs(dU) >= Math.abs(dV)) {
    leanDir = dU < 0 ? "左重右轻" : "右重左轻";
  } else {
    leanDir = dV > 0 ? "下坠偏沉" : "上飘头重";
  }

  // 严格优先级单一主错诊断（绝不一次堆四条矛盾话）
  const idealZone = suggestedCounterweightZone(angleDeg);
  let diag;
  if (absDeg < EXP_BOUNDS.sweetMinDeg) {
    diag = {
      level: "error",
      tag: `倾角 ${angleDeg > 0 ? "+" : ""}${angleDeg}° · 伪水平歪斜`,
      headline: absDeg === 0
        ? "0° 水平平放，画面完全静止"
        : `倾角仅 ${angleDeg > 0 ? "+" : ""}${angleDeg}°，看着像手抖拍歪了`,
      body: `人眼对 0° 水平基准极敏感，倾角落在 ±14° 内时大脑会下意识纠错，觉得地平线歪了而不是画面在奔跑。拖动下方斜角罗盘轨或画布黄箭，把斜轨扫进 ±16°–62° 经验区间。`,
      nextTip: "先转动「斜角罗盘拨轨」至 25°–48°（上冲 ↗）或 -25°–-48°（俯冲 ↘）。",
    };
  } else if (absDeg > EXP_BOUNDS.sweetMaxDeg) {
    diag = {
      level: "error",
      tag: `倾角 ${angleDeg > 0 ? "+" : ""}${angleDeg}° · 过陡失稳`,
      headline: `斜角拉到 ${absDeg}°，轨道快变成倾倒的高塔`,
      body: `超过 62° 后线条贴近垂直轴，动势不再横贯整幅画框，反而带来快要翻倒的局促感（此时应交回垂直构图）。把倾角往回收至 ±16°–62° 之间，重新拉长对角跑道。`,
      nextTip: "把斜轨倾角回调到 ±20°–55° 区间，感受画面瞬间贯通。",
    };
  } else if (isDeadBisect) {
    diag = {
      level: "error",
      tag: "死对角均分 · 画面剖裂",
      headline: `正好压在 ${Math.round(seg.diagCornerDeg)}° 矩形死角线且全员等大`,
      body: "一条均分无变化的直对角会把画框生硬剖成两个等大死三角。把节奏切到「近大远小」拉开前疏后密层次，或微调几度破开死板对分。",
      nextTip: "切换沿线节奏为「近大远小」，用大小和疏密压出纵深加速度。",
    };
  } else if (state.rhythm !== "graded") {
    diag = {
      level: "warn",
      tag: state.rhythm === "reverse" ? "逆向堵头 · 失速" : "等大均分 · 缺少纵深",
      headline: state.rhythm === "reverse"
        ? "前小后大把终点堵死了，速度瞬间刹车"
        : `沿线节点全是 ${scaleRatio.toFixed(1)}× 等大均分，像挂歪的串珠`,
      body: state.rhythm === "reverse"
        ? "终点处的大色块挡住了斜线冲出去的势能，眼睛走到一半就撞墙停住。切到「近大远小」，让起点厚实、远端渐细加密，速度感才会冲出来。"
        : "只有斜角度、没有大小和疏密变化，视线只是匀速滑过而不是加速冲刺。切换为「近大远小」，用 2.9× 级差和前疏后密拉出真正纵深。",
      nextTip: "点选「近大远小」梯度，观察轨道节点如何瞬间拉出透视加速度。",
    };
  } else if (cwBlocking) {
    diag = {
      level: "error",
      tag: "配重压轨 · 堵住通道",
      headline: `「${SCENES[state.scene].cwLabel}」直接骑在主斜轨上挡道了`,
      body: "配重块和主冲刺轨道重叠在一起，既打断了清晰动线，也没能平衡另一侧的空洞。直接拖动画布上的配重圆锚，挪到主斜轨以外的空域。",
      nextTip: `将配重锚点拖向「${idealZone.zoneName}」，让出主斜轨通道。`,
    };
  } else if (!balanceOk) {
    diag = {
      level: "warn",
      tag: `力矩失衡 · ${leanDir}（偏 ${comOffsetPct}%）`,
      headline: `视觉重量全堆向一端，整幅画面正在${leanDir}翻车`,
      body: `斜线天生把势能推向一侧；此刻全画加权质心偏移 ${comOffsetPct}%（超过 8.8% 经验稳态圈）。把「${SCENES[state.scene].cwLabel}」拖往斜轨对侧的「${idealZone.zoneName}」，用一块克制配重兜住整张画面的天平。`,
      nextTip: `拖动配重锚点移至「${idealZone.zoneName}」，把虚线质心标靶拉回绿圈内。`,
    };
  } else {
    const moodText = isAscending
      ? (absDeg <= 30
          ? "左下→右上缓坡延展：视线轻盈流畅地向前推开，既有方向又不焦躁。"
          : absDeg <= 48
            ? "左下→右上黄金冲刺：动势强劲、通道拉长至宽度的 " + seg.segLenRatioW.toFixed(2) + " 倍，兼具攀升感与现代速度力量。"
            : "左下→右上陡坡爆发：张力绷紧、冲击力十足，适合极限运动或强预告封面。")
      : (absDeg <= 30
          ? "左上→右下顺势滑降：顺着中文与西方阅读习惯一路滑进右下焦点，轻快利落。"
          : absDeg <= 48
            ? "左上→右下高速俯冲：重力叠加斜势，形成强烈的下冲加速度与戏剧冲击。"
            : "左上→右下急陡压迫：险峻凌厉、紧张感拉满，适合悬疑对抗或极限冲降。");
    diag = {
      level: "ok",
      tag: `4/4 成立 · ${angleBand}`,
      headline: `${isAscending ? "升势" : "俯冲"}对角通道已锁稳，动势与平衡兼得`,
      body: `${moodText}「${SCENES[state.scene].cwLabel}」在对侧空域稳稳托住视觉天平（质心偏移仅 ${comOffsetPct}%）。试着把斜角切到相反方向（${isAscending ? "负角俯冲 ↘" : "正角上冲 ↗"}），体会同一构图的情绪翻转。`,
      nextTip: `当前轨道有效长度约为画框宽度的 ${seg.segLenRatioW.toFixed(2)}×（相对短边 ${seg.segLenH.toFixed(2)}×）。`,
    };
  }

  return {
    angleDeg,
    absDeg,
    isAscending,
    angleBand,
    seg,
    nodes,
    scaleRatio,
    spacingRatio,
    mainPos,
    cwPos: { u: cwU, v: cwV },
    cwRel,
    cwBlocking,
    com,
    dU,
    dV,
    comOffset,
    comOffsetPct,
    balanceOk,
    principles,
    passCount,
    diag,
    idealZone,
  };
}
