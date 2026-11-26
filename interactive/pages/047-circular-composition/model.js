// 047 圆形构图 · 单真源几何模型
// 所有读数、四项原则灯、四步建构进度与画布渲染都从同一份归一化圆轨坐标计算。
// 坐标系：星盘圆心为 (0, 0)，舞台基准半径为 1.0；卫星角度 0° 在正上方 12 点钟，顺时针递增。

export const TIER_RADIUS = {
  sm: 0.072,
  md: 0.132,
  lg: 0.206,
};

export const TIER_LABELS = {
  sm: "微星",
  md: "配角",
  lg: "巨星",
};

export const SKINS = {
  poster: {
    id: "poster",
    label: "原海报·星轨",
    centerZh: "焦点",
    centerEn: "FOCUS",
    centerSub: "主体置于圆心位置",
    sats: [
      { title: "吸引注意", sub: "聚焦视线", icon: "eye", color: "ivory" },
      { title: "视线流动", sub: "自然顺滑", icon: "wave", color: "blue" },
      { title: "形成包围", sub: "稳定安全", icon: "shield", color: "ivory" },
      { title: "元素环绕", sub: "组织有序", icon: "grid", color: "blue" },
    ],
  },
  tuanshan: {
    id: "tuanshan",
    label: "宋画·团扇",
    centerZh: "亭影",
    centerEn: "PAVILION",
    centerSub: "主景收束于扇心",
    sats: [
      { title: "悬月引目", sub: "天光起势", icon: "moon", color: "ivory" },
      { title: "虬梅顺弧", sub: "枝势合缘", icon: "branch", color: "blue" },
      { title: "孤石压底", sub: "重心落稳", icon: "rock", color: "ivory" },
      { title: "远岚围合", sub: "虚白呼吸", icon: "mist", color: "blue" },
    ],
  },
  emblem: {
    id: "emblem",
    label: "品牌·圆徽",
    centerZh: "徽核",
    centerEn: "EMBLEM",
    centerSub: "标识稳居视觉中心",
    sats: [
      { title: "刊名起笔", sub: "顶弧领读", icon: "star", color: "ivory" },
      { title: "工艺弧标", sub: "右轨承接", icon: "wave", color: "blue" },
      { title: "年份落款", sub: "底弧封口", icon: "shield", color: "ivory" },
      { title: "产区印记", sub: "左轨呼应", icon: "grid", color: "blue" },
    ],
  },
};

export const INITIAL_STATE = {
  skin: "poster",
  focusX: -0.175,
  focusY: 0.085,
  focusR: 0.215,
  orbitR: 0.68,
  arcMode: "none", // "dashed" | "solid" | "none"
  dotRing: false,
  flowDir: 1, // 1 顺时针 | -1 逆时针 | 0 对冲冲突
  highlight: null, // null | "center" | "unity" | "enclosure" | "flow"
  sats: [
    { id: 0, angle: 318, tier: "md" },
    { id: 1, angle: 356, tier: "lg" },
    { id: 2, angle: 30, tier: "md" },
    { id: 3, angle: 74, tier: "sm" },
  ],
};

export const PRESETS = {
  // 三组合法解（均 4/4）
  poster: {
    label: "原海报四极解",
    kind: "good",
    patch: {
      focusX: 0,
      focusY: 0,
      focusR: 0.31,
      orbitR: 0.68,
      arcMode: "dashed",
      dotRing: true,
      flowDir: 1,
      sats: [
        { id: 0, angle: 0, tier: "md" },
        { id: 1, angle: 90, tier: "md" },
        { id: 2, angle: 180, tier: "md" },
        { id: 3, angle: 270, tier: "md" },
      ],
    },
  },
  rhythm: {
    label: "非对称韵律解",
    kind: "good",
    patch: {
      focusX: 0.025,
      focusY: -0.02,
      focusR: 0.295,
      orbitR: 0.69,
      arcMode: "dashed",
      dotRing: true,
      flowDir: 1,
      sats: [
        { id: 0, angle: 352, tier: "md" },
        { id: 1, angle: 96, tier: "sm" },
        { id: 2, angle: 196, tier: "md" },
        { id: 3, angle: 282, tier: "sm" },
      ],
    },
  },
  airy: {
    label: "疏朗逆流解",
    kind: "good",
    patch: {
      focusX: 0,
      focusY: 0,
      focusR: 0.265,
      orbitR: 0.74,
      arcMode: "solid",
      dotRing: false,
      flowDir: -1,
      sats: [
        { id: 0, angle: 36, tier: "md" },
        { id: 1, angle: 128, tier: "sm" },
        { id: 2, angle: 220, tier: "md" },
        { id: 3, angle: 312, tier: "sm" },
      ],
    },
  },
  // 四组试错态
  breach: {
    label: "试错：缺口逃逸",
    kind: "bad",
    patch: {
      focusX: 0,
      focusY: 0,
      focusR: 0.30,
      orbitR: 0.68,
      arcMode: "dashed",
      dotRing: true,
      flowDir: 1,
      sats: [
        { id: 0, angle: 325, tier: "md" },
        { id: 1, angle: 10, tier: "md" },
        { id: 2, angle: 55, tier: "md" },
        { id: 3, angle: 98, tier: "md" },
      ],
    },
  },
  hijack: {
    label: "试错：配角夺权",
    kind: "bad",
    patch: {
      focusX: 0,
      focusY: 0,
      focusR: 0.21,
      orbitR: 0.68,
      arcMode: "dashed",
      dotRing: true,
      flowDir: 1,
      sats: [
        { id: 0, angle: 0, tier: "lg" },
        { id: 1, angle: 90, tier: "lg" },
        { id: 2, angle: 180, tier: "md" },
        { id: 3, angle: 270, tier: "md" },
      ],
    },
  },
  choke: {
    label: "试错：核心撑爆",
    kind: "bad",
    patch: {
      focusX: 0,
      focusY: 0,
      focusR: 0.43,
      orbitR: 0.54,
      arcMode: "dashed",
      dotRing: true,
      flowDir: 1,
      sats: [
        { id: 0, angle: 0, tier: "md" },
        { id: 1, angle: 90, tier: "md" },
        { id: 2, angle: 180, tier: "md" },
        { id: 3, angle: 270, tier: "md" },
      ],
    },
  },
  clash: {
    label: "试错：微星逆流",
    kind: "bad",
    patch: {
      focusX: 0.16,
      focusY: -0.08,
      focusR: 0.33,
      orbitR: 0.72,
      arcMode: "none",
      dotRing: false,
      flowDir: 0,
      sats: [
        { id: 0, angle: 0, tier: "sm" },
        { id: 1, angle: 90, tier: "sm" },
        { id: 2, angle: 180, tier: "sm" },
        { id: 3, angle: 270, tier: "sm" },
      ],
    },
  },
};

export function cloneState(src = INITIAL_STATE) {
  return {
    ...src,
    sats: src.sats.map((s) => ({ ...s })),
  };
}

export function normDeg(d) {
  return ((d % 360) + 360) % 360;
}

export function degToRad(d) {
  // 0° 在正上方 12 点，顺时针
  return ((d - 90) * Math.PI) / 180;
}

export function radToDeg(rad) {
  return normDeg((rad * 180) / Math.PI + 90);
}

export function satXY(angleDeg, orbitR) {
  const rad = degToRad(angleDeg);
  return {
    x: Math.cos(rad) * orbitR,
    y: Math.sin(rad) * orbitR,
  };
}

export function nextTier(tier) {
  if (tier === "sm") return "md";
  if (tier === "md") return "lg";
  return "sm";
}

function dirWord(deg) {
  const a = normDeg(deg);
  if (a >= 337.5 || a < 22.5) return "上方";
  if (a < 67.5) return "右上";
  if (a < 112.5) return "右侧";
  if (a < 157.5) return "右下";
  if (a < 202.5) return "下方";
  if (a < 247.5) return "左下";
  if (a < 292.5) return "左侧";
  return "左上";
}

// 核心单真源评审：全部从实绘圆心、轨道半径、卫星极坐标与半径推导
export function evaluate(state) {
  const orbitR = state.orbitR;
  const focusR = state.focusR;
  const focusDist = Math.hypot(state.focusX, state.focusY);
  const focusOffsetPct = Math.round((focusDist / orbitR) * 100);

  const satItems = state.sats.map((s) => {
    const r = TIER_RADIUS[s.tier] || TIER_RADIUS.md;
    const pos = satXY(s.angle, orbitR);
    const distToFocus = Math.hypot(pos.x - state.focusX, pos.y - state.focusY);
    const clearance = distToFocus - focusR - r;
    return {
      ...s,
      r,
      x: pos.x,
      y: pos.y,
      distToFocus,
      clearance,
    };
  });

  // 最小核-星净空（相对舞台半径）
  let minClearance = Infinity;
  let maxSatR = 0;
  let sumSatR = 0;
  let sumW = 0;
  let comX = 0;
  let comY = 0;
  for (const s of satItems) {
    if (s.clearance < minClearance) minClearance = s.clearance;
    if (s.r > maxSatR) maxSatR = s.r;
    sumSatR += s.r;
    const w = s.r * s.r;
    sumW += w;
    comX += s.x * w;
    comY += s.y * w;
  }
  comX /= sumW || 1;
  comY /= sumW || 1;
  const torqueDist = Math.hypot(comX, comY);
  const torquePct = Math.round((torqueDist / orbitR) * 100);
  const torqueAngleDeg = radToDeg(Math.atan2(comY, comX));

  const avgSatR = sumSatR / satItems.length;
  const hierarchyRatio = focusR / (maxSatR || 0.01);
  const satToFocusPct = Math.round((avgSatR / (focusR || 0.01)) * 100);
  const maxSatToFocusPct = Math.round((maxSatR / (focusR || 0.01)) * 100);
  const clearancePct = Math.round((minClearance / orbitR) * 100);

  // 相邻卫星圆周角距
  const ordered = [...satItems].sort((a, b) => normDeg(a.angle) - normDeg(b.angle));
  let maxGapDeg = 0;
  let minGapDeg = 360;
  let gapStartDeg = 0;
  let gapEndDeg = 0;
  let collidePair = null;

  for (let i = 0; i < ordered.length; i++) {
    const cur = ordered[i];
    const nxt = ordered[(i + 1) % ordered.length];
    const a1 = normDeg(cur.angle);
    const a2 = normDeg(nxt.angle);
    const gap = i === ordered.length - 1 ? 360 - a1 + a2 : a2 - a1;
    if (gap > maxGapDeg) {
      maxGapDeg = gap;
      gapStartDeg = a1;
      gapEndDeg = a1 + gap;
    }
    if (gap < minGapDeg) {
      minGapDeg = gap;
      collidePair = [cur.id, nxt.id];
    }
  }
  maxGapDeg = Math.round(maxGapDeg);
  minGapDeg = Math.round(minGapDeg);

  // 8 类双向真错态判定
  const faults = [];
  if (focusOffsetPct > 12) {
    faults.push({
      code: "off_center",
      pillar: "center",
      badge: `偏心 ${focusOffsetPct}%`,
      headline: `核心主体偏离圆心 ${focusOffsetPct}%，向心引力散掉了`,
      body: `「焦点」现在漂在圆心${dirWord(radToDeg(Math.atan2(state.focusY, state.focusX)))}，和外围轨道不再同心。视线顺着外环转进来，却找不到稳固的落脚锚点，整个圆形像重心歪掉的陀螺。`,
      action: "把中央朱橙圆拖回中心十字环内（偏心 ≤ 12%），或点击「把核心拉回圆心」一键校准。",
      fixLabel: "把核心拉回圆心",
      fixType: "center",
    });
  }
  if (minClearance < 0.045) {
    faults.push({
      code: "focus_choke",
      pillar: "center",
      badge: `净空 ${clearancePct}%`,
      headline: `核心撑爆轨道，与卫星净空只剩 ${clearancePct}%`,
      body: `圆形构图靠核心与外环之间的「呼吸带」建立层次。现在焦点圆胀得太大或轨道收得太紧，中心与环绕元素快撞成一团，包围感变成互相挤压。`,
      action: "调小「焦点尺径」或拉宽「环绕轨径」，让内圈蓝点环重新透出呼吸缝。",
      fixLabel: "拉开核心与环轨呼吸缝",
      fixType: "choke",
    });
  }
  if (hierarchyRatio < 1.38) {
    faults.push({
      code: "sat_hijack",
      pillar: "center",
      badge: `配角 ${maxSatToFocusPct}%`,
      headline: `外围卫星涨到核心的 ${maxSatToFocusPct}%，配角正在抢主位`,
      body: `当前核心与最大卫星半径比只有 ${hierarchyRatio.toFixed(2)}×。眼睛同时被两个差不多大的圆拉扯，来回跳动，原海报「主体领衔、元素环绕」的主次秩序瞬间瓦解。`,
      action: "直接轻点画布上最大的那枚卫星把它缩回「配角」或「微星」，或把焦点调大至配角的 1.4 倍以上。",
      fixLabel: "把抢戏卫星收小",
      fixType: "hijack",
    });
  } else if (focusR < 0.21) {
    faults.push({
      code: "focus_tiny",
      pillar: "center",
      badge: `核心偏小`,
      headline: `核心半径缩到轨径的 ${Math.round((focusR / orbitR) * 100)}%，撑不起圆心分量`,
      body: `外环虽然围起来了，但中心主角太轻太小，视觉能量全被外圈吸走，整张画面像一只空洞的圆环（那更接近 050 环形构图），不再是聚焦中心的圆形构图。`,
      action: "把「焦点尺径」推到 0.25–0.34，让朱橙日轮真正压住阵脚。",
      fixLabel: "放大核心主体",
      fixType: "focus_tiny",
    });
  }

  if (maxGapDeg > 138) {
    const breachMid = normDeg((gapStartDeg + gapEndDeg) / 2);
    faults.push({
      code: "arc_breach",
      pillar: "unity",
      badge: `缺口 ${maxGapDeg}°`,
      headline: `外环在${dirWord(breachMid)}裂出 ${maxGapDeg}° 大缺口，视线正从这里逃走`,
      body: `格式塔闭合律能替人脑自动补全较小的断口，但缺口超过约 135°–140° 时，大脑就不再把它认作一个完整的圆。眼睛绕到断口处会顺着切线直接滑出画面。`,
      action: `沿圆轨拖开挤在一起的卫星，把${dirWord(breachMid)}那片空弧填上，让任意相邻角距 ≤ 135°。`,
      fixLabel: "沿圆轨铺匀四枚卫星",
      fixType: "spread",
    });
  }
  if (minGapDeg < 36) {
    faults.push({
      code: "sat_collide",
      pillar: "unity",
      badge: `挤撞 ${minGapDeg}°`,
      headline: `相邻卫星只隔 ${minGapDeg}°，外环局部黏成一团`,
      body: `两枚卫星贴得太近时，视觉上会合并成一块笨重的色团，既打断顺滑的圆弧节奏，也让同一轨道上其余段落显得空荡失衡。`,
      action: "按住挨得最近的那枚卫星沿圆周拉开，至少留出 40° 以上角距。",
      fixLabel: "拉开挤撞卫星",
      fixType: "spread",
    });
  }

  if (torquePct > 28) {
    faults.push({
      code: "torque_tilt",
      pillar: "enclosure",
      badge: `偏坠 ${torquePct}%`,
      headline: `环绕重心向${dirWord(torqueAngleDeg)}偏坠 ${torquePct}%，包围圈一边沉`,
      body: `就像天平或摩天轮的座舱全挂在一侧，四枚卫星合成的视觉重心严重偏离圆心。画面的稳定感被单侧拉力拖垮，读者总觉得整个圆要往${dirWord(torqueAngleDeg)}滚下去。`,
      action: `把至少一枚卫星拖到对侧（${dirWord(torqueAngleDeg + 180)}方向），让重心偏矩回到 25% 以内。`,
      fixLabel: "对侧配平重心",
      fixType: "spread",
    });
  }
  if (satToFocusPct < 24) {
    faults.push({
      code: "sat_too_small",
      pillar: "enclosure",
      badge: `包围过弱`,
      headline: `外围卫星均值只剩焦点的 ${satToFocusPct}%，围不住中心`,
      body: `四枚外围元素全缩成细碎微点时，它们像浮在空中的星尘而不是「包围圈」。中心显得孤零零，缺少环绕衬托与安全感。`,
      action: "轻点其中 2–4 枚卫星把它们切回「配角」尺度，建立清晰的主次配对。",
      fixLabel: "恢复配角包围尺度",
      fixType: "sat_grow",
    });
  }

  if (state.flowDir === 0) {
    faults.push({
      code: "flow_clash",
      pillar: "flow",
      badge: "流向对冲",
      headline: "圆弧箭头一半顺时针、一半逆时针，视线在半路相撞",
      body: `圆形构图的动感来自一致的旋转势能。方向彼此顶牛时，眼睛刚顺着上弧向右滑，又被下弧往回推，顺滑流动立刻变成原地打转。`,
      action: "把「弧流方向」切回统一的顺时针或逆时针，让整圈动势朝同一方向接力。",
      fixLabel: "统一顺时针弧流",
      fixType: "flow",
    });
  } else if (state.arcMode === "none" && !state.dotRing) {
    faults.push({
      code: "flow_broken",
      pillar: "flow",
      badge: "弧流中断",
      headline: "外环引导弧与内圈点阵全部关闭，圆势缺了一口气",
      body: `在散点间距较大时，一条轻盈的虚线圆弧或细密点环能帮眼睛立刻接通圆形轨迹。现在引导线彻底消失，四枚卫星容易被读成彼此孤立的方块四角。`,
      action: "打开「朱橙虚弧」或「钴蓝点环」，并按空格演播一遍视线环流。",
      fixLabel: "点亮朱橙引导虚弧",
      fixType: "flow",
    });
  }

  // 四大原海报原则实时状态
  const centerFault = faults.find((f) => f.pillar === "center");
  const unityFault = faults.find((f) => f.pillar === "unity");
  const enclosureFault = faults.find((f) => f.pillar === "enclosure");
  const flowFault =
    faults.find((f) => f.pillar === "flow") ||
    (maxGapDeg > 138 ? { badge: "切线逃逸" } : null);

  const pillars = {
    center: {
      ok: !centerFault,
      tag: centerFault ? centerFault.badge : `偏心 ${focusOffsetPct}% · ${hierarchyRatio.toFixed(1)}×`,
    },
    unity: {
      ok: !unityFault,
      tag: unityFault ? unityFault.badge : `最大距 ${maxGapDeg}°`,
    },
    enclosure: {
      ok: !enclosureFault && minClearance >= 0.045,
      tag: enclosureFault
        ? enclosureFault.badge
        : minClearance < 0.045
          ? `净空 ${clearancePct}%`
          : `重心稳 ${100 - torquePct}%`,
    },
    flow: {
      ok: !flowFault,
      tag: flowFault
        ? flowFault.badge
        : state.flowDir > 0
          ? "顺时针闭环"
          : "逆时针闭环",
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 对应原海报底部 TIPS 4 个步骤的完成度
  const steps = [
    focusOffsetPct <= 12 && focusR >= 0.21 && minClearance >= 0.045, // 1. 确定中心主体
    maxGapDeg <= 138 && minGapDeg >= 36 && torquePct <= 28,          // 2. 环绕布置元素
    hierarchyRatio >= 1.38 && satToFocusPct >= 24 && minClearance >= 0.045, // 3. 调整节奏与层次
    passCount === 4,                                                  // 4. 增强统一与完整
  ];

  // 判定合法解的形态称呼
  let solutionName = "";
  if (passCount === 4) {
    const allSameTier = satItems.every((s) => s.tier === satItems[0].tier);
    const nearlyCardinal = maxGapDeg <= 100 && minGapDeg >= 80;
    if (nearlyCardinal && allSameTier && state.flowDir > 0 && state.arcMode === "dashed") {
      solutionName = "经典四极闭环解";
    } else if (!allSameTier || !nearlyCardinal) {
      solutionName = "韵律动态平衡解";
    } else {
      solutionName = "完整环绕聚焦解";
    }
  }

  let statusChip = "";
  let headline = "";
  let body = "";
  let action = "";
  let fixLabel = "";
  let fixType = "";
  let posture = "";

  if (passCount === 4) {
    statusChip = `4/4 · ${solutionName}`;
    headline = `圆心稳、环轨闭、主次明——这是一版成立的${solutionName}`;
    body = `当前核心偏心仅 ${focusOffsetPct}%、与最大卫星尺度比达 ${hierarchyRatio.toFixed(2)}×，四枚卫星最大角距 ${maxGapDeg}°、重心偏矩 ${torquePct}%。眼睛顺着${state.flowDir > 0 ? "顺时针" : "逆时针"}弧线巡游一圈后，自然收束回朱橙核心，既完整安定又流畅灵动。`;
    action = "可以继续拖动任意卫星检验「非对称韵律平衡」，或点击试错按钮故意打破闭环观察视线如何逃逸。";
    fixLabel = "演播视线闭环";
    fixType = "pulse";
    posture = "闭环收束（示意）";
  } else {
    const primary = faults[0];
    statusChip = `${passCount}/4 · ${primary.badge}`;
    headline = primary.headline;
    body = primary.body;
    action = primary.action;
    fixLabel = primary.fixLabel;
    fixType = primary.fixType;
    posture = passCount === 0 ? "四重失序（示意）" : passCount <= 2 ? "局部断裂（示意）" : "临近闭环（示意）";
  }

  return {
    passCount,
    statusChip,
    headline,
    body,
    action,
    fixLabel,
    fixType,
    posture,
    solutionName,
    faults,
    pillars,
    steps,
    satItems,
    metrics: {
      focusOffsetPct,
      maxGapDeg,
      minGapDeg,
      gapStartDeg,
      gapEndDeg,
      torquePct,
      torqueAngleDeg,
      comX,
      comY,
      hierarchyRatio,
      satToFocusPct,
      maxSatToFocusPct,
      clearancePct,
      minClearance,
    },
  };
}

// 一步针对性纠偏（修好当前首要错态，而不是直接一键剧透全部，留给用户继续探索）
export function applyQuickFix(state, fixType) {
  const next = cloneState(state);
  if (fixType === "center") {
    next.focusX = 0;
    next.focusY = 0;
  } else if (fixType === "choke") {
    next.focusR = Math.min(next.focusR, 0.30);
    next.orbitR = Math.max(next.orbitR, 0.68);
  } else if (fixType === "hijack") {
    next.sats.forEach((s) => {
      if (s.tier === "lg") s.tier = "md";
    });
    next.focusR = Math.max(next.focusR, 0.29);
  } else if (fixType === "focus_tiny") {
    next.focusR = 0.30;
  } else if (fixType === "spread") {
    const base = normDeg(next.sats[0].angle);
    next.sats.forEach((s, i) => {
      s.angle = normDeg(base + i * 90);
    });
  } else if (fixType === "sat_grow") {
    next.sats.forEach((s, i) => {
      s.tier = i % 2 === 0 ? "md" : "sm";
    });
  } else if (fixType === "flow") {
    if (next.flowDir === 0) next.flowDir = 1;
    if (next.arcMode === "none") next.arcMode = "dashed";
    next.dotRing = true;
  }
  return next;
}
