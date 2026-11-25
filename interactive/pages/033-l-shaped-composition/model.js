// 033 L形构图 · 单真源几何与力学模型
// 画布统一用规范左 L 坐标系：u ∈ [0,1] 从左到右，v ∈ [0,1] 从上到下。
// 镜像右反 L（flip === "right"）只在渲染与指针输入时做 u <-> 1 - u 对称转换，确保所有指标计算与绘制严格同源。

export const RANGES = {
  pillarW: { min: 0.10, max: 0.52, okMin: 0.17, okMax: 0.35 },
  baseH: { min: 0.08, max: 0.42, okMin: 0.11, okMax: 0.30 },
  baseSpan: { min: 0.34, max: 1.00, okMin: 0.72, okMax: 1.00 },
  minArmNet: 0.36,
  maxSolidArea: 0.56,
  minNetVoid: 0.42,
  focusR: 0.056,
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报角尺",
    pillarTag: "L 竖向支点",
    baseTag: "方向延展",
    focusTag: "视觉焦点",
    clutterLabels: ["冗余装饰 · 点清", "杂乱标签 · 点清"],
  },
  landscape: {
    id: "landscape",
    label: "山水孤松",
    pillarTag: "左侧松崖",
    baseTag: "溪岸横坪",
    focusTag: "远空孤月",
    clutterLabels: ["抢戏浮云 · 点清", "乱入飞雁 · 点清"],
  },
  stilllife: {
    id: "stilllife",
    label: "静物书瓶",
    pillarTag: "陶瓶书脊",
    baseTag: "原木托盘",
    focusTag: "单枝果影",
    clutterLabels: ["多余杯垫 · 点清", "散落卡片 · 点清"],
  },
};

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    state: {
      pillarW: 0.44,
      baseH: 0.16,
      baseSpan: 0.60,
      jointBroken: true,
      clutter: [true, true],
      focus: { u: 0.56, v: 0.62 },
      flip: "left",
    },
  },
  classic: {
    label: "原海报经典解",
    state: {
      pillarW: 0.24,
      baseH: 0.15,
      baseSpan: 0.96,
      jointBroken: false,
      clutter: [false, false],
      focus: { u: 0.80, v: 0.34 },
      flip: "left",
    },
  },
  song: {
    label: "一角大留白解",
    state: {
      pillarW: 0.19,
      baseH: 0.13,
      baseSpan: 0.84,
      jointBroken: false,
      clutter: [false, false],
      focus: { u: 0.77, v: 0.28 },
      flip: "left",
    },
  },
  heavy: {
    label: "重柱海报解",
    state: {
      pillarW: 0.32,
      baseH: 0.23,
      baseSpan: 0.94,
      jointBroken: false,
      clutter: [false, false],
      focus: { u: 0.78, v: 0.36 },
      flip: "left",
    },
  },
  testThin: {
    label: "试错：柱薄底飘",
    state: {
      pillarW: 0.11,
      baseH: 0.08,
      baseSpan: 0.88,
      jointBroken: false,
      clutter: [false, false],
      focus: { u: 0.78, v: 0.34 },
      flip: "left",
    },
  },
  testHeavyBase: {
    label: "试错：底厚压扁",
    state: {
      pillarW: 0.25,
      baseH: 0.38,
      baseSpan: 0.94,
      jointBroken: false,
      clutter: [false, false],
      focus: { u: 0.78, v: 0.30 },
      flip: "left",
    },
  },
};

export function createInitialState() {
  const s = PRESETS.broken.state;
  return {
    pillarW: s.pillarW,
    baseH: s.baseH,
    baseSpan: s.baseSpan,
    jointBroken: s.jointBroken,
    clutter: [...s.clutter],
    focus: { ...s.focus },
    flip: s.flip,
    theme: "poster",
    flowOn: true,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const pct = (x) => `${Math.round(x * 100)}%`;

// 从当前状态算出所有实绘矩形与坐标（规范左 L 坐标系）
export function computeGeometry(state) {
  const pw = clamp(state.pillarW, RANGES.pillarW.min, RANGES.pillarW.max);
  const bh = clamp(state.baseH, RANGES.baseH.min, RANGES.baseH.max);
  const span = clamp(state.baseSpan, RANGES.baseSpan.min, RANGES.baseSpan.max);

  const pillar = { x: 0, y: 0, w: pw, h: 1 };
  const gapSize = state.jointBroken ? 0.062 : 0;

  let base;
  let extRect;
  let gapRect = null;
  let effectiveSpan;

  if (state.jointBroken) {
    const bx = Math.min(0.82, pw + gapSize);
    const minSpan = Math.min(1, bx + 0.095);
    effectiveSpan = clamp(Math.max(span, minSpan), minSpan, 1);
    const bw = Math.max(0.08, effectiveSpan - bx);
    base = { x: bx, y: 1 - bh, w: bw, h: bh };
    extRect = { ...base };
    gapRect = { x: pw, y: 1 - bh, w: Math.max(0.04, bx - pw), h: bh };
  } else {
    effectiveSpan = Math.max(pw, span);
    base = { x: 0, y: 1 - bh, w: effectiveSpan, h: bh };
    extRect = { x: pw, y: 1 - bh, w: Math.max(0, effectiveSpan - pw), h: bh };
  }

  const voidRect = {
    x: pw,
    y: 0,
    w: Math.max(0.05, 1 - pw),
    h: Math.max(0.05, 1 - bh),
  };

  // 两块冗余杂物：避开右上角实测角标（y >= 0.15）并彼此错位，绝不互相遮挡
  const cw1 = clamp(voidRect.w * 0.44, 0.16, 0.25);
  const ch1 = clamp(voidRect.h * 0.22, 0.11, 0.17);
  const cw2 = clamp(voidRect.w * 0.38, 0.15, 0.23);
  const ch2 = clamp(voidRect.h * 0.20, 0.10, 0.16);
  const clutterRects = [
    {
      idx: 0,
      active: Boolean(state.clutter[0]),
      x: clamp(voidRect.x + voidRect.w * 0.08, pw + 0.025, 1 - cw1 - 0.03),
      y: clamp(Math.max(0.155, voidRect.y + voidRect.h * 0.19), 0.155, Math.max(0.16, voidRect.h - ch1 - 0.04)),
      w: cw1,
      h: ch1,
    },
    {
      idx: 1,
      active: Boolean(state.clutter[1]),
      x: clamp(voidRect.x + voidRect.w * 0.52, pw + 0.03, 1 - cw2 - 0.03),
      y: clamp(voidRect.y + voidRect.h * 0.44, 0.24, Math.max(0.25, voidRect.h - ch2 - 0.04)),
      w: cw2,
      h: ch2,
    },
  ];

  // 内拐角把手位置（用于直拖竖柱宽与底梁厚）
  const elbow = { u: pw, v: 1 - bh };
  // 底梁右端箭尖把手位置（用于直拖横向延展）
  const armTip = { u: effectiveSpan, v: 1 - bh * 0.5 };
  // 灰橄榄视觉焦点位置
  const focus = {
    u: clamp(state.focus.u, 0.05, 0.95),
    v: clamp(state.focus.v, 0.06, 0.93),
    r: RANGES.focusR,
  };

  return {
    pillar,
    base,
    extRect,
    gapRect,
    voidRect,
    clutterRects,
    elbow,
    armTip,
    focus,
    effectiveSpan,
  };
}

// 统一计算全部实测读数、4 项通断状态、8 类具体失误诊断与白话建议
export function evaluate(state) {
  const geo = computeGeometry(state);
  const pw = geo.pillar.w;
  const bh = geo.base.h;
  const span = geo.effectiveSpan;
  const netArm = Math.max(0, span - pw);

  const pillarArea = geo.pillar.w * geo.pillar.h;
  const extArea = geo.extRect.w * geo.extRect.h;
  const solidArea = pillarArea + extArea;

  const voidGross = geo.voidRect.w * geo.voidRect.h;
  let clutterArea = 0;
  let clutterCount = 0;
  for (const c of geo.clutterRects) {
    if (c.active) {
      clutterCount += 1;
      clutterArea += c.w * c.h * 1.45; // 连带周围视觉干扰余白
    }
  }
  const netVoid = Math.max(0, voidGross - clutterArea);

  // L 实体的真实面积加权重心
  const cxP = geo.pillar.x + geo.pillar.w * 0.5;
  const cyP = geo.pillar.y + geo.pillar.h * 0.5;
  const cxE = geo.extRect.x + geo.extRect.w * 0.5;
  const cyE = geo.extRect.y + geo.extRect.h * 0.5;
  const massTotal = Math.max(0.001, pillarArea + extArea);
  const cxL = (cxP * pillarArea + cxE * extArea) / massTotal;
  const cyL = (cyP * pillarArea + cyE * extArea) / massTotal;

  // 焦点相对实块与边界的几何检测
  const fx = geo.focus.u;
  const fy = geo.focus.v;
  const fr = geo.focus.r;

  const inPillar = fx - fr * 0.45 < pw;
  const inBase = fy + fr * 0.45 > 1 - bh && fx > geo.base.x - fr * 0.3 && fx < geo.base.x + geo.base.w + fr * 0.3;
  const inSolid = inPillar || inBase;

  const dxPillar = fx - pw;
  const dyBase = (1 - bh) - fy;
  const nearPillar = !inSolid && dxPillar < 0.088;
  const nearBase = !inSolid && fx < span + 0.04 && dyBase < 0.088;
  const tooCloseSolid = nearPillar || nearBase;
  const tooCloseEdge = fx > 0.935 || fy < 0.075 || fx < 0.065 || fy > 0.92;

  // 焦点在开放留白中的相对位置（0..1）
  const relU = (fx - pw) / Math.max(0.01, 1 - pw);
  const relV = fy / Math.max(0.01, 1 - bh);

  // 示意杆秤力矩评估：
  // Arnheim 视知觉重力场：右侧和上方携带更高的视觉杠杆权重，因此右上远端一枚小焦即可与左下实块对衡。
  // 这里的杠杆读数明确标为「示意」档位，不假装精密物理测量。
  const armX = fx - 0.5;
  const armY = 0.5 - fy; // 上方为正
  const leftTorque = Math.max(0.01, (0.5 - cxL) * solidArea * 1.65);
  const rightTorque = inSolid ? 0 : Math.max(0, (armX + 0.14) * 0.46 + Math.max(0, armY + 0.12) * 0.24);
  const balanceRatio = rightTorque / leftTorque; // 接近 0.65..1.55 为顺畅对衡

  const focusBalanced =
    !inSolid &&
    !tooCloseSolid &&
    !tooCloseEdge &&
    relU >= 0.22 &&
    relU <= 0.88 &&
    relV >= 0.14 &&
    relV <= 0.78 &&
    fy <= 0.68 &&
    balanceRatio >= 0.52;

  // 四项结构维度判别（对应原海报四枚圆徽）
  const boundaryOk = pw >= RANGES.pillarW.okMin && pw <= RANGES.pillarW.okMax && solidArea <= RANGES.maxSolidArea;
  const directionOk = !state.jointBroken && span >= RANGES.baseSpan.okMin && netArm >= RANGES.minArmNet;
  const voidOk = clutterCount === 0 && netVoid >= RANGES.minNetVoid;
  const baseWeightOk = bh >= RANGES.baseH.okMin && bh <= RANGES.baseH.okMax;
  const stabilityOk = baseWeightOk && focusBalanced;

  const passed = [boundaryOk, directionOk, voidOk, stabilityOk].filter(Boolean).length;

  // 四项徽章短标签（直白报实测）
  let boundaryBadge = `立稳 ${pct(pw)}`;
  if (pw < RANGES.pillarW.okMin) boundaryBadge = `过细 ${pct(pw)}`;
  else if (pw > RANGES.pillarW.okMax) boundaryBadge = `过肥 ${pct(pw)}`;
  else if (solidArea > RANGES.maxSolidArea) boundaryBadge = `实块过满`;

  let directionBadge = `延展 ${pct(span)}`;
  if (state.jointBroken) directionBadge = "拐角断缝";
  else if (span < RANGES.baseSpan.okMin || netArm < RANGES.minArmNet) directionBadge = `短缩 ${pct(span)}`;

  let voidBadge = `净空 ${pct(netVoid)}`;
  if (clutterCount > 0) voidBadge = `杂块 ${clutterCount} 处`;
  else if (netVoid < RANGES.minNetVoid) voidBadge = `偏窄 ${pct(netVoid)}`;

  let stabilityBadge = "稳托对衡";
  if (bh < RANGES.baseH.okMin) stabilityBadge = `底薄 ${pct(bh)}`;
  else if (bh > RANGES.baseH.okMax) stabilityBadge = `底厚 ${pct(bh)}`;
  else if (inSolid) stabilityBadge = "焦陷实体";
  else if (tooCloseSolid) stabilityBadge = "焦贴墙根";
  else if (tooCloseEdge) stabilityBadge = "焦滑出框";
  else if (!focusBalanced) stabilityBadge = "杆秤偏沉";

  // 杆秤示意档位
  let balanceTier = "平顺对衡";
  if (inSolid) balanceTier = "被实体吞没";
  else if (tooCloseEdge) balanceTier = "边缘外滑";
  else if (tooCloseSolid) balanceTier = "贴墙发闷";
  else if (!focusBalanced) balanceTier = fy > 0.68 ? "下坠偏沉" : "左重右虚";

  // 8 类具体失误按诊断优先级输出白话主诊单
  const dirWord = state.flip === "right" ? "右" : "左";
  const oppWord = state.flip === "right" ? "左上" : "右上";
  const extDirWord = state.flip === "right" ? "向左" : "向右";

  let statusKind = "error";
  let tag = `错态 · 待校 (${passed}/4)`;
  let headline = "";
  let reason = "";
  let action = "";
  let solutionName = "";

  if (pw < RANGES.pillarW.okMin) {
    tag = `错态 · 柱薄失锚 (${passed}/4)`;
    headline = `${dirWord}竖柱只剩 ${pct(pw)}，立不住边界气势`;
    reason = "L 形构图先靠竖向支点把视线稳稳钉住。现在竖柱瘦成一条细边条，画面像没装门框的散页，眼睛找不到入口起点。";
    action = `向右横拖画布上的 L 内拐角（或调下方「边界建立」滑杆），把竖柱宽放进 17%–35% 经验参考带。`;
  } else if (pw > RANGES.pillarW.okMax) {
    tag = `错态 · 柱肥闷死 (${passed}/4)`;
    headline = `${dirWord}竖柱胖到 ${pct(pw)}，把${oppWord}挤得喘不过气`;
    reason = "竖向实体吃掉近半画幅时，强弱对比就塌成了左右对劈。留白失去呼吸感，L 形的「左强右空」变成了堵墙感。";
    action = `直接向左横拖画布上的 L 内拐角（或调下方「边界建立」滑杆），把竖柱收进 17%–35% 经验参考带。`;
  } else if (state.jointBroken) {
    tag = `错态 · 底断分家 (${passed}/4)`;
    headline = "拐角裂开断缝，竖柱和底梁各走各的";
    reason = "L 形最关键的是 90° 转角把垂直下坠的视线折成横向延展。拐角一断开，画面裂成一竖一横两个孤立色块，路径当场中断。";
    action = "直接点击画布左下带红虚线的「点此咬合」断口，或点下方「闭合转角」按钮把 L 接成一体。";
  } else if (span < RANGES.baseSpan.okMin || netArm < RANGES.minArmNet) {
    tag = `错态 · 底短失延 (${passed}/4)`;
    headline = `底梁只伸到 ${pct(span)}，视线拐弯后半路踩空`;
    reason = `底部横臂负责承托整幅重量并把目光${extDirWord}送出。横臂半截腰斩时，底部托力不足，画面更像一根笨重的直柱，叙事方向出不来。`;
    action = `拖动底梁末端的白色箭尖拉长至 72%–100%（或调下方「方向延展」滑杆）。`;
  } else if (clutterCount > 0) {
    tag = `错态 · 空区堵死 (${passed}/4)`;
    headline = `${oppWord}塞进 ${clutterCount} 块冗余杂物，留白对比塌了`;
    reason = `L 形把实重压在一角，就是为了换出${oppWord}一整片干净舞台。空地一旦被零碎装饰填满，净空跌到 ${pct(netVoid)}，视觉焦点立刻失去衬托。`;
    action = `直接点击画布${oppWord}带红虚框的冗余杂块逐个清掉，或点下方「清净留白」。`;
  } else if (bh < RANGES.baseH.okMin) {
    tag = `错态 · 底薄飘虚 (${passed}/4)`;
    headline = `底梁薄到 ${pct(bh)}，托不住整幅画面的重心`;
    reason = "底部横臂太细时，看起来像一根随时会折断的下划线，下盘发飘，失去了 L 形最迷人的安稳与地面感。";
    action = "向上轻拖画布内的 L 拐角把手（或调下方「稳定支撑」滑杆），把底梁厚度调到 11%–30% 经验带。";
  } else if (bh > RANGES.baseH.okMax) {
    tag = `错态 · 底厚压扁 (${passed}/4)`;
    headline = `底梁厚达 ${pct(bh)}，下盘过沉把画面压成平底锅`;
    reason = "底梁一旦超过三成高度，就会抢走竖柱的主导权，并把上方留白压扁，整幅构图失去「下稳上扬」的开阔呼吸。";
    action = "向下压低画布内的 L 拐角把手（或调下方「稳定支撑」滑杆），把底梁收进 11%–30% 经验带。";
  } else if (netVoid < RANGES.minNetVoid || solidArea > RANGES.maxSolidArea) {
    tag = `错态 · 实空失衡 (${passed}/4)`;
    headline = `实心 L 占满 ${pct(solidArea)}，${oppWord}净空只剩 ${pct(netVoid)}`;
    reason = "竖柱和底梁单看都在上限边沿，合在一起却吞掉了超过一半画幅。L 形讲究一实一空拉开反差，净空低于 42% 就会发堵。";
    action = "把竖柱再收窄一点，或把底梁略压薄，让净留白面积回到 42% 以上。";
  } else if (inSolid) {
    tag = `错态 · 焦陷实体 (${passed}/4)`;
    headline = "视觉焦点掉进了实心 L 里面，被背景吞没";
    reason = "灰橄榄焦点本该孤悬在净白空区里和红砖 L 遥相呼应。埋进实体内部后，实空对位完全失效，留白区空荡无物。";
    action = `直接把灰橄榄方块拖进${oppWord}宽阔的宣纸留白区。`;
  } else if (tooCloseSolid) {
    tag = `错态 · 焦贴墙根 (${passed}/4)`;
    headline = "焦点紧贴实块边缘，被吸住喘不开气";
    reason = "焦点离竖柱或底梁太近时，视觉上会和实心 L 粘连成一团，像墙角多长出的赘块，没法在空区里独立呼吸。";
    action = `把灰橄榄方块往${oppWord}空区中段挪远一些，留出清晰的呼吸间距。`;
  } else if (tooCloseEdge) {
    tag = `错态 · 焦滑出框 (${passed}/4)`;
    headline = "焦点贴着外画框边缘，视线快滑出画面";
    reason = "距离画框边界太近会产生边缘吸附与挤迫感，把本来被 L 形兜住的目光重新甩出画外。";
    action = `把灰橄榄方块往${oppWord}留白内部轻轻收回一点。`;
  } else if (!focusBalanced) {
    tag = `错态 · 杆秤偏沉 (${passed}/4)`;
    headline = `焦点落位偏低偏近，${oppWord}发空失衡`;
    reason = `左下实块很重，按杆秤原理需要把小焦点悬到${oppWord}较远的力臂位置才能把画面拉平。现在焦点缩在低处，整张画往左下角一头栽。`;
    action = `把灰橄榄方块斜拖向${oppWord}中偏高区域，让画面形成「下稳上扬」的对角平衡。`;
  } else {
    statusKind = "ok";
    if (state.flip === "right") solutionName = "镜像反 L 平衡解";
    else if (netVoid >= 0.67) solutionName = "南宋一角 · 大留白解";
    else if (pw >= 0.28 || bh >= 0.21) solutionName = "重柱稳基 · 强结构解";
    else solutionName = "原海报经典 · 左强右空解";

    tag = `成立 · ${solutionName} (4/4)`;
    headline = `竖柱 ${pct(pw)} 立稳边界，底梁延展 ${pct(span)}，净空 ${pct(netVoid)} 托住孤焦`;
    reason =
      state.flip === "right"
        ? "右侧竖柱与底梁形成镜像反 L，同样锁住了重心并向左送出视线，适合主体朝左看或从右往左回望的画面。"
        : netVoid >= 0.58
          ? "竖柱与底梁收得极克制，腾出近六成呼吸留白，类似南宋马远「一角」山水的空灵节奏，焦点虽小却格外醒目。"
          : pw >= 0.28 || bh >= 0.21
            ? "厚实的竖柱与底梁自带建筑量感，非常适合展讯海报与品牌主视觉，同时右上净空依然足以撑起清晰焦点。"
            : "左竖柱钉牢入口、90° 拐角折向底部延展、右上净空以杆秤力臂悬住灰橄榄孤焦——「左强右空 · 下稳上扬」完全成立。";
    action = "你可以继续拖动拐角或切「山水孤松 / 静物书瓶 / 镜像反 L」，看看不同比例下的多组合法解。";
  }

  return {
    geo,
    metrics: {
      pillarW: pw,
      baseH: bh,
      baseSpan: span,
      netArm,
      solidArea,
      netVoid,
      clutterCount,
      balanceRatio,
      balanceTier,
      cxL,
      cyL,
    },
    checks: {
      boundary: { ok: boundaryOk, badge: boundaryBadge },
      direction: { ok: directionOk, badge: directionBadge },
      voidSpace: { ok: voidOk, badge: voidBadge },
      stability: { ok: stabilityOk, badge: stabilityBadge },
    },
    passed,
    statusKind,
    solutionName,
    tag,
    headline,
    reason,
    action,
  };
}
