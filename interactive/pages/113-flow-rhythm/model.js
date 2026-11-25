// 113 流动节奏组织 · 单真源几何与诊断模型
// 所有曲线点列、弯曲比 L/D、最大折角、断口占比、五拍位置与终点切线夹角
// 都从此模块一次性算出，画布渲染、视线浮标物理与面板读数共用同一份数据。

export const MOON_CENTER = { u: 0.815, v: 0.195 };
export const ENTRY_POINT = { u: 0.015, v: 0.965 };

// 经验参考甜区（标明为经验参考带，非硬性教条）
export const SWEET_BAND = {
  sinuosityMin: 1.12,
  sinuosityMax: 1.68,
  maxSmoothBendDeg: 28,
};

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报丝带",
    sub: "深紫夜幕 · 珊瑚粉流势 · 象牙明月",
  },
  wave: {
    id: "wave",
    label: "浮世绘浪势",
    sub: "多重弧浪叠涌 · 汇聚远方山巅",
  },
  editorial: {
    id: "editorial",
    label: "长页叙事流",
    sub: "隐形 S 动线 · 卡片交错 · 行动落点",
  },
};

export const PRESETS = {
  // 开场 0/4 翻车错态：硬折拐角 + 中段断口 + 拍点扎堆 + 终点偏靶缩弱
  broken: {
    scene: "poster",
    smoothMode: "kink", // "kink" | "smooth"
    gapOpen: true,
    cadenceMode: "clumped", // "clumped" | "rigid" | "breathing"
    focusMode: "veer", // "veer" | "weak" | "moon"
    nodes: [
      { id: "n1", label: "入弯", u: 0.45, v: 0.86 },
      { id: "n2", label: "中腰", u: 0.25, v: 0.56 },
      { id: "n3", label: "收弯", u: 0.69, v: 0.62 },
    ],
    activeNode: 1,
  },
  // 原海报 113 经典 S 势解
  poster: {
    scene: "poster",
    smoothMode: "smooth",
    gapOpen: false,
    cadenceMode: "breathing",
    focusMode: "moon",
    nodes: [
      { id: "n1", label: "入弯", u: 0.38, v: 0.85 },
      { id: "n2", label: "中腰", u: 0.35, v: 0.56 },
      { id: "n3", label: "收弯", u: 0.77, v: 0.48 },
    ],
    activeNode: 1,
  },
  // 另一种合法解：宽摆舒缓流势（大开合、慢节奏）
  wideSweep: {
    scene: "poster",
    smoothMode: "smooth",
    gapOpen: false,
    cadenceMode: "breathing",
    focusMode: "moon",
    nodes: [
      { id: "n1", label: "入弯", u: 0.18, v: 0.65 },
      { id: "n2", label: "中腰", u: 0.58, v: 0.70 },
      { id: "n3", label: "收弯", u: 0.77, v: 0.38 },
    ],
    activeNode: 1,
  },
  // 压测错态：死水僵直（几乎拉成一条斜直线）
  flatTrap: {
    scene: "poster",
    smoothMode: "smooth",
    gapOpen: false,
    cadenceMode: "breathing",
    focusMode: "moon",
    nodes: [
      { id: "n1", label: "入弯", u: 0.23, v: 0.76 },
      { id: "n2", label: "中腰", u: 0.44, v: 0.56 },
      { id: "n3", label: "收弯", u: 0.63, v: 0.37 },
    ],
    activeNode: 1,
  },
  // 压测错态：过密蛇行（急弯来回甩动，弯曲比 > 1.85）
  spaghettiTrap: {
    scene: "poster",
    smoothMode: "smooth",
    gapOpen: false,
    cadenceMode: "breathing",
    focusMode: "moon",
    nodes: [
      { id: "n1", label: "入弯", u: 0.58, v: 0.88 },
      { id: "n2", label: "中腰", u: 0.14, v: 0.54 },
      { id: "n3", label: "收弯", u: 0.86, v: 0.53 },
    ],
    activeNode: 1,
  },
};

export function cloneState(preset) {
  return {
    scene: preset.scene,
    smoothMode: preset.smoothMode,
    gapOpen: preset.gapOpen,
    cadenceMode: preset.cadenceMode,
    focusMode: preset.focusMode,
    activeNode: preset.activeNode ?? 1,
    nodes: preset.nodes.map((n) => ({ ...n })),
  };
}

export function clampNode(index, u, v) {
  const bounds = [
    { uMin: 0.14, uMax: 0.64, vMin: 0.62, vMax: 0.91 }, // 入弯
    { uMin: 0.12, uMax: 0.78, vMin: 0.36, vMax: 0.76 }, // 中腰
    { uMin: 0.38, uMax: 0.90, vMin: 0.26, vMax: 0.68 }, // 收弯
  ][index];
  return {
    u: Math.max(bounds.uMin, Math.min(bounds.uMax, u)),
    v: Math.max(bounds.vMin, Math.min(bounds.vMax, v)),
  };
}

// 离心 Catmull-Rom（alpha = 0.5）避免自交尖点
function catmullRomPoint(p0, p1, p2, p3, t) {
  const alpha = 0.5;
  const distPow = (a, b) => Math.max(1e-4, Math.hypot(b.u - a.u, b.v - a.v)) ** alpha;
  const t0 = 0;
  const t1 = t0 + distPow(p0, p1);
  const t2 = t1 + distPow(p1, p2);
  const t3 = t2 + distPow(p2, p3);
  const tt = t1 + (t2 - t1) * t;
  const lerp = (a, b, ta, tb) => {
    const f = (tt - ta) / Math.max(1e-5, tb - ta);
    return { u: a.u + (b.u - a.u) * f, v: a.v + (b.v - a.v) * f };
  };
  const A1 = lerp(p0, p1, t0, t1);
  const A2 = lerp(p1, p2, t1, t2);
  const A3 = lerp(p2, p3, t2, t3);
  const B1 = lerp(A1, A2, t0, t2);
  const B2 = lerp(A2, A3, t1, t3);
  return lerp(B1, B2, t1, t2);
}

function getEndAnchor(focusMode) {
  if (focusMode === "veer") {
    // 偏靶滑向顶边，远离右上明月
    return { u: 0.44, v: 0.06 };
  }
  // 顺着西南边缘稳稳切入象牙明月
  return { u: MOON_CENTER.u - 0.035, v: MOON_CENTER.v + 0.045 };
}

function getEndApproach(focusMode) {
  if (focusMode === "veer") {
    return { u: 0.56, v: 0.22 };
  }
  return { u: 0.72, v: 0.30 };
}

function angleDeg(ax, ay, bx, by) {
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  if (la < 1e-6 || lb < 1e-6) return 0;
  const cos = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// 按归一化弧长 s ∈ [0, 1] 取曲线坐标、切线与法线
export function sampleAtS(pts, cum, totalLen, s) {
  const clamped = Math.max(0, Math.min(1, s));
  const target = clamped * totalLen;
  let lo = 0;
  let hi = cum.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid;
    else hi = mid;
  }
  const segLen = Math.max(1e-6, cum[hi] - cum[lo]);
  const f = (target - cum[lo]) / segLen;
  const a = pts[lo];
  const b = pts[hi];
  const u = a.u + (b.u - a.u) * f;
  const v = a.v + (b.v - a.v) * f;
  const prev = pts[Math.max(0, lo - 1)];
  const next = pts[Math.min(pts.length - 1, hi + 1)];
  const tx = next.u - prev.u;
  const ty = next.v - prev.v;
  const tl = Math.max(1e-6, Math.hypot(tx, ty));
  const tu = tx / tl;
  const tv = ty / tl;
  return { u, v, tu, tv, nu: -tv, nv: tu };
}

export function evaluateFlow(state) {
  const endPt = getEndAnchor(state.focusMode);
  const approachPt = getEndApproach(state.focusMode);
  const controlPts = [
    ENTRY_POINT,
    state.nodes[0],
    state.nodes[1],
    state.nodes[2],
    approachPt,
    endPt,
  ];

  const pts = [];
  const segCount = controlPts.length - 1;
  const stepsPerSeg = 26;

  if (state.smoothMode === "kink") {
    // 折线硬拐模式：直接按控制点连成锯齿折段
    for (let i = 0; i < segCount; i++) {
      const a = controlPts[i];
      const b = controlPts[i + 1];
      const steps = i === segCount - 1 ? stepsPerSeg : stepsPerSeg;
      for (let j = 0; j < steps; j++) {
        const f = j / steps;
        pts.push({ u: a.u + (b.u - a.u) * f, v: a.v + (b.v - a.v) * f });
      }
    }
    pts.push({ ...endPt });
  } else {
    // 平滑 C1/G1 离心 Catmull-Rom 样条
    const padded = [
      { u: ENTRY_POINT.u - 0.08, v: ENTRY_POINT.v + 0.06 },
      ...controlPts,
      {
        u: endPt.u + (endPt.u - approachPt.u) * 0.8,
        v: endPt.v + (endPt.v - approachPt.v) * 0.8,
      },
    ];
    for (let i = 1; i <= segCount; i++) {
      const p0 = padded[i - 1];
      const p1 = padded[i];
      const p2 = padded[i + 1];
      const p3 = padded[i + 2];
      for (let j = 0; j < stepsPerSeg; j++) {
        pts.push(catmullRomPoint(p0, p1, p2, p3, j / stepsPerSeg));
      }
    }
    pts.push({ ...endPt });
  }

  // 累计弧长
  const cum = [0];
  let totalLen = 0;
  for (let i = 1; i < pts.length; i++) {
    totalLen += Math.hypot(pts[i].u - pts[i - 1].u, pts[i].v - pts[i - 1].v);
    cum.push(totalLen);
  }

  const chordLen = Math.hypot(endPt.u - ENTRY_POINT.u, endPt.v - ENTRY_POINT.v);
  const sinuosity = totalLen / Math.max(0.05, chordLen);

  // 计算最大折角（折线模式取控制顶点真实外角；平滑模式取局部跨步最大急弯角）
  let maxTurnDeg = 0;
  let worstTurnPoint = pts[Math.floor(pts.length * 0.5)];
  let worstTurnS = 0.5;

  if (state.smoothMode === "kink") {
    for (let i = 1; i < controlPts.length - 1; i++) {
      const prev = controlPts[i - 1];
      const cur = controlPts[i];
      const next = controlPts[i + 1];
      const ang = angleDeg(cur.u - prev.u, cur.v - prev.v, next.u - cur.u, next.v - cur.v);
      if (ang > maxTurnDeg) {
        maxTurnDeg = ang;
        worstTurnPoint = cur;
        worstTurnS = cum[Math.min(cum.length - 1, i * stepsPerSeg)] / Math.max(1e-5, totalLen);
      }
    }
  } else {
    const span = 2;
    for (let i = span; i < pts.length - span; i++) {
      const a = pts[i - span];
      const b = pts[i];
      const c = pts[i + span];
      const ang = angleDeg(b.u - a.u, b.v - a.v, c.u - b.u, c.v - b.v);
      if (ang > maxTurnDeg) {
        maxTurnDeg = ang;
        worstTurnPoint = b;
        worstTurnS = cum[i] / Math.max(1e-5, totalLen);
      }
    }
  }

  // 断口区间（真实弧长比例）
  const gapRange = state.gapOpen ? [0.42, 0.64] : null;
  const gapPct = state.gapOpen ? Math.round((gapRange[1] - gapRange[0]) * 100) : 0;
  const gapCenter = sampleAtS(pts, cum, totalLen, 0.53);

  // 五枚拍点圆（完全遵循实绘曲线法线偏移，与 113 原海报一致）
  const orbSpecs =
    state.cadenceMode === "clumped"
      ? [
          { s: 0.14, side: -1, r: 0.022 },
          { s: 0.185, side: -1, r: 0.024 },
          { s: 0.23, side: -1, r: 0.021 },
          { s: 0.275, side: -1, r: 0.023 },
          { s: 0.32, side: -1, r: 0.020 },
        ]
      : state.cadenceMode === "rigid"
        ? [
            { s: 0.18, side: -1, r: 0.023 },
            { s: 0.34, side: -1, r: 0.023 },
            { s: 0.50, side: -1, r: 0.023 },
            { s: 0.66, side: -1, r: 0.023 },
            { s: 0.82, side: -1, r: 0.023 },
          ]
        : [
            // 原海报 113 的呼吸分布：错落于曲线内外弯，大小微张弛
            { s: 0.14, side: -1, r: 0.026 },
            { s: 0.34, side: -1, r: 0.021 },
            { s: 0.52, side: -1, r: 0.025 },
            { s: 0.72, side: -1, r: 0.020 },
            { s: 0.88, side: -1, r: 0.017 },
          ];

  // 让“张弛有度”的 5 枚圆按真实弯道外/内侧优雅交替（与原海报一致：左下弯上、中左弯左、中桥上、右上弯内、顶弯左）
  const breathingSides = [1, 1, 1, 1, 1];
  const orbs = orbSpecs.map((spec, idx) => {
    const sample = sampleAtS(pts, cum, totalLen, spec.s);
    const offset = state.cadenceMode === "clumped" ? 0.045 : 0.056;
    // 在原海报中，五枚粉圆顺着主曲线的左侧外沿与内怀游走，用屏幕坐标朝左上/左内微偏
    const dir = state.cadenceMode === "breathing" ? breathingSides[idx] : spec.side;
    const ou = sample.u + sample.nu * offset * dir;
    const ov = sample.v + sample.nv * offset * dir;
    return { ...spec, u: ou, v: ov, spineU: sample.u, spineV: sample.v };
  });

  // 出口切线与象牙明月中心夹角
  const tailA = pts[Math.max(0, pts.length - 6)];
  const tailB = pts[pts.length - 1];
  const toMoonX = MOON_CENTER.u - tailB.u;
  const toMoonY = MOON_CENTER.v - tailB.v;
  const exitAngleDiffDeg = Math.round(angleDeg(tailB.u - tailA.u, tailB.v - tailA.v, toMoonX, toMoonY));
  const moonScale = state.focusMode === "moon" ? 1.0 : state.focusMode === "weak" ? 0.42 : 0.48;
  const moonDist = Math.hypot(endPt.u - MOON_CENTER.u, endPt.v - MOON_CENTER.v);

  // 四维过关判定
  const isKink = state.smoothMode === "kink" || maxTurnDeg > SWEET_BAND.maxSmoothBendDeg;
  const isFlat = sinuosity < SWEET_BAND.sinuosityMin;
  const isTangled = sinuosity > SWEET_BAND.sinuosityMax;

  const curveOk = !isKink && !isFlat && !isTangled;
  const continuityOk = !state.gapOpen;
  const cadenceOk = state.cadenceMode === "breathing";
  const focusOk = state.focusMode === "moon" && moonDist < 0.14 && exitAngleDiffDeg <= 24;

  const passedCount = [curveOk, continuityOk, cadenceOk, focusOk].filter(Boolean).length;

  // 8 类失误单真源诊断（按对视觉流动破坏优先级排序）
  let code = "pass";
  let badge = "流势贯通 · 4 / 4 达标";
  let headline = "视线沿柔弯一气滑入右上明月";
  let why = "";
  let action = "可以继续拖动弯道体验不同摆幅，或切换「浮世绘浪势 / 长页叙事流」看同一原理如何落进真实作品。";

  if (state.smoothMode === "kink") {
    code = "kink";
    badge = `错态 · 硬折断流（${passedCount} / 4）`;
    headline = `中段出现 ${Math.round(maxTurnDeg)}° 硬折角，视线撞角急刹`;
    why = "人眼依赖完形「良好延续」顺着切线滑行。遇到生硬折角时，眼球必须停下来重新判断方向，原本积累的流动惯性当场归零。";
    action = "按下控台里的「柔弯贯通」消除硬折，再横向拖动画布上的弯道节点塑出顺滑 S 弧。";
  } else if (!continuityOk) {
    code = "gap";
    badge = `错态 · 半路断桥（${passedCount} / 4）`;
    headline = `丝带中段裂开 ${gapPct}% 空缺，流势半路掉线`;
    why = "流动节奏讲究「连绵不断」。中段突然失去实体承接，视线走到一半会掉进空洞里四处寻路，还没到终点就提前流失。";
    action = "直接点击画布中段标有红色虚线的断口（或点「连绵贯通」），重新把主河道接通。";
  } else if (isFlat) {
    code = "flat";
    badge = `错态 · 死水僵直（${passedCount} / 4）`;
    headline = `弯曲比仅 ${sinuosity.toFixed(2)}×，拉直成了硬尺斜线`;
    why = "直线只给出最快方向，却抽走了曲线的起伏呼吸。弯曲比低于 1.12× 经验带时，版面退化成生硬对角线，失去流动节奏的生命力。";
    action = "横向拖动「入弯 / 中腰 / 收弯」节点拉出明显 S 弧，把弯曲比调入 1.12×–1.68× 经验参考带。";
  } else if (isTangled) {
    code = "tangled";
    badge = `错态 · 过密蛇行（${passedCount} / 4）`;
    headline = `弯曲比飙到 ${sinuosity.toFixed(2)}×，来回急甩让人发晕`;
    why = "曲线不是越弯越好。振幅甩得过猛时，视线在画面中部反复折返兜圈，向前推进的动势被内耗掉，读者反而找不到终点。";
    action = "把甩出边缘的弯道节点往中轴轻轻收拢，让弯曲比回到 1.12×–1.68× 经验参考带。";
  } else if (isKink) {
    code = "kink";
    badge = `错态 · 急弯卡顿（${passedCount} / 4）`;
    headline = `弯道被拽出 ${Math.round(maxTurnDeg)}° 急拐，流畅度骤降`;
    why = "即使开启平滑样条，把相邻节点拉得过近或反折过猛，曲率依然会骤增成发卡弯，视线被迫在拐点减速。";
    action = "把拉得太急的弯道节点往回拖缓一点，让局部转角降到 28° 以下。";
  } else if (state.cadenceMode === "clumped") {
    code = "clumped";
    badge = `错态 · 拍点扎堆（${passedCount} / 4）`;
    headline = "5 枚拍点圆全挤在起步弯，中后段空荡失衡";
    why = "流动节奏不等于一整根滑梯，而是「张弛有度」的连奏。全部拍点扎堆在一角，前半段拥挤吵闹，后半段空洞无物。";
    action = "把「拍点呼吸」切到「张弛有度」，让五枚圆顺着主弯道舒展分布、呼吸渐进。";
  } else if (state.cadenceMode === "rigid") {
    code = "rigid";
    badge = `错态 · 机械等距（${passedCount} / 4）`;
    headline = "拍点死板等距同号，退化成机械节拍器";
    why = "等距、同大、同侧排列更接近「重复原则」或机械网格，压死了曲线原本的快慢张弛与有机呼吸感。";
    action = "把「拍点呼吸」切到「张弛有度」，恢复大小微变、随弯舒展的有机节奏。";
  } else if (state.focusMode === "veer") {
    code = "veer";
    badge = `错态 · 终点溜边（${passedCount} / 4）`;
    headline = `末端切线偏离明月 ${exitAngleDiffDeg}°，视线直接滑出画框`;
    why = "花了整条河道把视线带上高处，最后收口却把方向甩向空白边框，右上象牙明月孤立在旁，读者看完记不住落点。";
    action = "把「终点落点」切到「明月收束」，让末端切线与气流虚线稳稳交汇到象牙明月。";
  } else if (state.focusMode === "weak") {
    code = "weakFocus";
    badge = `错态 · 失焦过弱（${passedCount} / 4）`;
    headline = "终点明月缩到 0.42×，河道尽头兜不住视线";
    why = "流动必须有归宿。如果终点体量过轻、明度过暗，视线滑到尽头后无处停泊，整条引导路径就像有始无终。";
    action = "把「终点落点」切到「明月收束」，恢复足够体量的象牙明月稳稳接住视线。";
  } else {
    // 多解识别：根据弯曲比和摆幅给出不同正当解评价
    if (sinuosity < 1.28) {
      headline = `宽摆舒缓流势达标（弯曲比 ${sinuosity.toFixed(2)}×）`;
      why = "大开合、低曲率的宽幅 S 曲线让视线从容舒展，适合静谧叙事页与留白充沛的展览主视觉，末端切线稳稳落入明月。";
    } else if (sinuosity > 1.48) {
      headline = `灵动紧凑流势达标（弯曲比 ${sinuosity.toFixed(2)}×）`;
      why = "更饱满的 S 弯加快了视线的摆动韵律，在失速与发晕的边界内压出鲜活张力，五拍呼吸与明月收束协同成立。";
    } else {
      headline = `原海报经典流势达标（弯曲比 ${sinuosity.toFixed(2)}×）`;
      why = "平滑切线让完形延续全程顺滑，无断口丝带托起连绵动势，五枚拍点张弛有度，末端切线顺势把视线送进象牙明月。";
    }
  }

  // 四枚原海报关键词实时检核状态
  const keywords = [
    {
      zh: "曲线",
      en: "CURVE",
      ok: curveOk,
      tag: isKink ? `折角 ${Math.round(maxTurnDeg)}°` : isFlat ? `${sinuosity.toFixed(2)}× 僵直` : isTangled ? `${sinuosity.toFixed(2)}× 过密` : `${sinuosity.toFixed(2)}× 柔弯`,
    },
    {
      zh: "引导",
      en: "GUIDE",
      ok: focusOk,
      tag: state.focusMode === "veer" ? `偏靶 ${exitAngleDiffDeg}°` : state.focusMode === "weak" ? "终点 0.42×" : "切线入月",
    },
    {
      zh: "连绵",
      en: "CONTINUITY",
      ok: continuityOk,
      tag: continuityOk ? "0% 断口" : `断流 ${gapPct}%`,
    },
    {
      zh: "动势",
      en: "MOVEMENT",
      ok: cadenceOk,
      tag: state.cadenceMode === "clumped" ? "扎堆撞拍" : state.cadenceMode === "rigid" ? "机械等距" : "张弛有度",
    },
  ];

  // 原海报五段要点在画布上的实时状态
  const stages = [
    { id: 1, zh: "起点引入", body: "开启路径", ok: !isFlat, s: 0.14 },
    { id: 2, zh: "曲线引导", body: "视线流动", ok: !isKink && !isTangled, s: 0.34 },
    { id: 3, zh: "连绵不断", body: "形成动势", ok: continuityOk, s: 0.53 },
    { id: 4, zh: "节奏渐进", body: "张弛有度", ok: cadenceOk, s: 0.73 },
    { id: 5, zh: "终点聚焦", body: "自然落点", ok: focusOk, s: 0.96 },
  ];

  return {
    pts,
    cum,
    totalLen,
    chordLen,
    sinuosity,
    maxTurnDeg,
    worstTurnPoint,
    worstTurnS,
    gapRange,
    gapPct,
    gapCenter,
    orbs,
    endPt,
    moonScale,
    exitAngleDiffDeg,
    curveOk,
    continuityOk,
    cadenceOk,
    focusOk,
    passedCount,
    code,
    badge,
    headline,
    why,
    action,
    keywords,
    stages,
  };
}
