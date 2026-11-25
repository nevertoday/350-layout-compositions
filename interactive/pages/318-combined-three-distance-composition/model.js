// 318 三远综合构图 · 单一真相模型
// 开场 Three.js 3D 立体画布、2D 降级画布、底沿视觉等式分配尺、右上三圆点与白话诊单全部读取同一份几何计算结果。

export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报三远",
    sub: "暖宣 · 紫靛 · 朱橙",
    defaultMaster: "high",
    palette: {
      sky: "#F8EFE0",
      skyDeep: "#F2E4CE",
      sunFill: "#F6DFB8",
      sunDot: "#DFBF8E",
      highMain: "#64519E",
      highShadow: "#43307B",
      highHighlight: "#8370BC",
      coneFront: "#DFCBE2",
      deepOuterL: "#2C1966",
      deepOuterR: "#452F8D",
      deepInner: "#7763A7",
      deepFar: "#9D8AC4",
      deepOrb: "#EF6841",
      mistBand: "#E8DCF0",
      cloud: "#B5A1C7",
      waterTop: "#8674AE",
      waterMid: "#4A3784",
      waterBase: "#312068",
      ripple: "#F4ECF8",
      propOrb: "#EF6841",
      propSq: "#F6C34E",
      propRect: "#EE6A42",
      bird: "#2C1954",
      guide: "#2C1954",
      guideDeep: "#7763A7",
      guideLevel: "#ED6843",
    },
  },
  guoxi: {
    id: "guoxi",
    name: "郭熙早春",
    sub: "双拼古绢 · 墨青 · 卷云岚",
    defaultMaster: "high",
    palette: {
      sky: "#F3E9D6",
      skyDeep: "#E7DAC0",
      sunFill: "#E9D6B0",
      sunDot: "#CFB483",
      highMain: "#384654",
      highShadow: "#222E3A",
      highHighlight: "#5A6B7B",
      coneFront: "#D4D2C7",
      deepOuterL: "#24303B",
      deepOuterR: "#3F505E",
      deepInner: "#5E707D",
      deepFar: "#8C9AA3",
      deepOrb: "#C96A3B",
      mistBand: "#EAE4D6",
      cloud: "#B4B9B8",
      waterTop: "#7B8C95",
      waterMid: "#4A5C68",
      waterBase: "#2C3B47",
      ripple: "#F2ECE0",
      propOrb: "#C96A3B",
      propSq: "#D4A653",
      propRect: "#8C5132",
      bird: "#222E3A",
      guide: "#222E3A",
      guideDeep: "#4E6373",
      guideLevel: "#B55628",
    },
  },
  scroll: {
    id: "scroll",
    name: "青绿长卷",
    sub: "矿物石青 · 石绿 · 赭金",
    defaultMaster: "level",
    palette: {
      sky: "#F6EDD9",
      skyDeep: "#EBDDBB",
      sunFill: "#F2D59B",
      sunDot: "#D4AC67",
      highMain: "#245473",
      highShadow: "#173750",
      highHighlight: "#437E87",
      coneFront: "#C5DDD0",
      deepOuterL: "#1A4057",
      deepOuterR: "#2E6D68",
      deepInner: "#4E907C",
      deepFar: "#8BB5A3",
      deepOrb: "#DE6A3E",
      mistBand: "#E9E8D7",
      cloud: "#A8C3B9",
      waterTop: "#5C919B",
      waterMid: "#2B6075",
      waterBase: "#1B3F59",
      ripple: "#F2EFE4",
      propOrb: "#DE6A3E",
      propSq: "#E4B852",
      propRect: "#C8733B",
      bird: "#173750",
      guide: "#173750",
      guideDeep: "#2E6D68",
      guideLevel: "#C85A30",
    },
  },
};

export const INITIAL_BROKEN_STATE = {
  scene: "poster",
  // 双游标切点：cut1 = 高远占比，cut2 = 高远 + 深远；开场刻意 34 / 33 / 33 三权均分打架
  cut1: 34,
  cut2: 67,
  // 轴向状态：开场三轴撕裂（主峰左偏、深远谷右甩、平远水岸歪斜）
  axisMode: "split",
  peakOffset: -0.16,
  valleyOffset: 0.18,
  waterTiltDeg: 7,
  // 烟岚衔脉：0% 硬切断层
  mist: 0,
  // 留白与前景退让：choked = 前景大块居中堵口且画面挤顶
  clearance: "choked",
  // 视角：false = 正视成画，true = 三维剖轴（Y↑ / Z→ / X↔）
  view3d: false,
  // 原海报三角外框与三向虚线标尺
  showGuides: true,
};

export const PRESET_SOLUTIONS = {
  broken: { ...INITIAL_BROKEN_STATE },
  highMaster: {
    scene: "poster",
    cut1: 52,
    cut2: 76,
    axisMode: "center",
    peakOffset: 0,
    valleyOffset: 0,
    waterTiltDeg: 0,
    mist: 46,
    clearance: "balanced",
  },
  deepMaster: {
    scene: "guoxi",
    cut1: 25,
    cut2: 77,
    axisMode: "scurve",
    peakOffset: 0.04,
    valleyOffset: -0.05,
    waterTiltDeg: 0,
    mist: 54,
    clearance: "balanced",
  },
  levelMaster: {
    scene: "scroll",
    cut1: 23,
    cut2: 46,
    axisMode: "center",
    peakOffset: 0,
    valleyOffset: 0,
    waterTiltDeg: 0,
    mist: 42,
    clearance: "balanced",
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function getWeights(state) {
  const c1 = Math.round(clamp(state.cut1, 6, 88));
  const c2 = Math.round(clamp(state.cut2, c1 + 6, 94));
  const high = c1;
  const deep = c2 - c1;
  const level = 100 - c2;
  return { high, deep, level, cut1: c1, cut2: c2 };
}

// 从当前状态直接算出一套可供 3D 与 2D 画布共同绘制的真实几何参数（归一化 0..1 画幅坐标）
export function computeGeometry(state) {
  const w = getWeights(state);
  const hNorm = w.high / 100; // 0.06..0.88
  const dNorm = w.deep / 100; // 0.06..0.88
  const lNorm = w.level / 100; // 0.06..0.88

  const isChoked = state.clearance === "choked";
  const isSparse = state.clearance === "sparse";

  // 1. 高远几何：主峰顶高、天头余气与峰腰线
  // 开场 34% + choked 时，构图整体被塞满顶到上缘（天头仅 ~4%）
  const crowdLift = isChoked ? 0.245 : isSparse ? -0.07 : 0;
  const peakTopRaw = 0.44 - hNorm * 0.45 - crowdLift;
  const peakY = clamp(peakTopRaw, 0.028, 0.56);
  const headroomPct = Math.round(peakY * 100);
  const peakX = clamp(0.5 + state.peakOffset, 0.24, 0.76);
  const peakBaseY = clamp(0.50 - (hNorm - 0.33) * 0.14 + (isChoked ? -0.02 : 0), 0.34, 0.58);
  const peakHalfW = clamp(0.11 + hNorm * 0.13 + (isChoked ? 0.04 : 0), 0.09, 0.28);

  // 2. 深远几何：层数、纵深推进量、谷心远日位置
  const deepLayers = dNorm < 0.14 ? 2 : dNorm < 0.24 ? 3 : dNorm < 0.42 ? 4 : 5;
  const valleyX = clamp(0.5 + state.valleyOffset, 0.24, 0.76);
  const valleyTopY = clamp(peakBaseY - 0.04, 0.30, 0.55);
  const valleyY = clamp(0.61 - (dNorm - 0.28) * 0.08, 0.48, 0.68);
  const depthReach = clamp(0.25 + dNorm * 1.45, 0.28, 1.55); // 3D Z 轴真实纵深跨距

  // 3. 平远几何：阔水基台跨宽、水岸高度、倾角、前景定标块
  const baseSpan = clamp(0.36 + lNorm * 0.92 + (isChoked ? 0.08 : isSparse ? -0.14 : 0), 0.34, 0.94);
  const waterY = clamp(0.76 - (lNorm - 0.25) * 0.09, 0.64, 0.81);
  const baseBottomY = clamp(isChoked ? 0.95 : 0.89, 0.85, 0.96);
  const waterTiltRad = (state.waterTiltDeg * Math.PI) / 180;

  // 前景圆块与矩形：choked 时硕大居中堵死谷口；balanced 时退让两侧成定标；sparse 时微弱发飘
  const orbR = isChoked ? 0.095 : isSparse ? 0.026 : 0.056;
  const orbX = isChoked ? valleyX - 0.035 : clamp(0.5 - baseSpan * 0.27, 0.16, 0.42);
  const orbY = isChoked ? valleyY + 0.09 : waterY + 0.045;

  const rectW = isChoked ? 0.17 : isSparse ? 0.045 : 0.096;
  const rectH = isChoked ? 0.105 : isSparse ? 0.028 : 0.052;
  const rectX = isChoked ? valleyX + 0.055 : clamp(0.5 + baseSpan * 0.28, 0.58, 0.84);
  const rectY = isChoked ? valleyY + 0.11 : waterY + 0.05;

  const sqSize = isChoked ? 0.072 : isSparse ? 0.022 : 0.044;
  const sqX = isChoked ? valleyX + 0.015 : clamp(0.5 + baseSpan * 0.18, 0.56, 0.78);
  const sqY = isChoked ? valleyY + 0.035 : waterY - 0.008;

  // 实算前景对深远谷口通道（以 valleyX 为中心宽 0.22 的视线走廊）的遮挡比例
  const corridorHalf = 0.11;
  const overlap1D = (c, half) => {
    const lo = Math.max(valleyX - corridorHalf, c - half);
    const hi = Math.min(valleyX + corridorHalf, c + half);
    return Math.max(0, hi - lo);
  };
  const blockSpan =
    overlap1D(orbX, orbR * 0.95) +
    overlap1D(rectX, rectW * 0.5) * 0.85 +
    overlap1D(sqX, sqSize * 0.5) * 0.75;
  const throatBlockPct = Math.round(clamp((blockSpan / (corridorHalf * 2)) * 100, 0, 100));
  const throatOpenPct = 100 - throatBlockPct;

  // 4. 三轴错位实算：峰尖相对谷心的偏移 + 峰谷整体离心 + 水岸倾角换算
  const axisSpread = Math.abs(peakX - valleyX);
  const axisDeviationPct = Math.round(
    clamp(
      (state.axisMode === "scurve"
        ? Math.max(0, Math.abs(peakX - 0.54) + Math.abs(valleyX - 0.45) - 0.02)
        : axisSpread) * 100 +
        Math.abs(state.waterTiltDeg) * 1.4,
      0,
      65
    )
  );

  // 5. 烟岚与硬切缝参数
  const mistNorm = clamp(state.mist / 100, 0, 1);
  const seamHardness = clamp(1 - mistNorm / 0.28, 0, 1); // <28% 显出硬切缝
  const fogObscure = clamp((mistNorm - 0.68) / 0.32, 0, 1); // >68% 开始白雾吞山

  // 6. 大三角外轮廓包络顶点（原海报标志性三角虚线）
  const triTopX = state.axisMode === "split" ? 0.5 + state.peakOffset * 0.5 : 0.5;
  const triTopY = clamp(peakY - 0.03, 0.015, 0.42);
  const triLeftX = clamp(0.5 - baseSpan * 0.52, 0.04, 0.34);
  const triRightX = clamp(0.5 + baseSpan * 0.52, 0.66, 0.96);
  const triBottomY = baseBottomY;

  return {
    weights: w,
    peakX,
    peakY,
    peakBaseY,
    peakHalfW,
    headroomPct,
    deepLayers,
    valleyX,
    valleyTopY,
    valleyY,
    depthReach,
    baseSpan,
    baseSpanPct: Math.round(baseSpan * 100),
    waterY,
    baseBottomY,
    waterTiltDeg: state.waterTiltDeg,
    waterTiltRad,
    orb: { x: orbX, y: orbY, r: orbR },
    rect: { x: rectX, y: rectY, w: rectW, h: rectH },
    sq: { x: sqX, y: sqY, s: sqSize },
    throatBlockPct,
    throatOpenPct,
    axisSpread,
    axisDeviationPct,
    mist: Math.round(state.mist),
    mistNorm,
    seamHardness,
    fogObscure,
    triangle: {
      topX: triTopX,
      topY: triTopY,
      leftX: triLeftX,
      rightX: triRightX,
      bottomY: triBottomY,
    },
  };
}

const AXIS_LABELS = {
  high: "高远",
  deep: "深远",
  level: "平远",
};

const AXIS_PAGE_HINT = {
  high: "315 高远法",
  deep: "316 深远法",
  level: "317 平远法",
};

// 单真源诊断：8 类失误 + 4 项统筹验收 + 多合法解
export function evaluate(state) {
  const geom = computeGeometry(state);
  const { high, deep, level } = geom.weights;
  const entries = [
    { key: "high", val: high },
    { key: "deep", val: deep },
    { key: "level", val: level },
  ].sort((a, b) => b.val - a.val);

  const top = entries[0];
  const mid = entries[1];
  const low = entries[2];

  // 检查 1：一主二辅（主远 44%–72%，两辅远各 ≥ 14%，且主远领先第二名 ≥ 12 个百分点）
  const isEqualFight = top.val < 44 || top.val - mid.val < 10;
  const isSingleCollapse = low.val < 14 || top.val > 72;
  const hierarchyOk = !isEqualFight && !isSingleCollapse;

  // 原海报右上三枚圆点状态：达标呈「● ○ ○ 一主二辅」，均分呈「● ● ● 抢戏」，退化呈「● · · 单远」
  const pips = isEqualFight
    ? ["warn", "warn", "warn"]
    : isSingleCollapse
    ? ["solid", "dead", "dead"]
    : ["solid", "hollow", "hollow"];

  // 检查 2：三轴统合（中轴三角或北宋 S 脉均可，不能峰谷水岸各跑各的）
  const axisOk =
    state.axisMode === "scurve"
      ? Math.abs(state.waterTiltDeg) <= 2 && geom.axisDeviationPct <= 10
      : geom.axisSpread <= 0.08 && Math.abs(state.waterTiltDeg) <= 2;

  // 检查 3：烟岚通脉（24%–72% 经验参考带，过低硬切，过高吞山）
  const isHardSeam = geom.mist < 24;
  const isFogSwallow = geom.mist > 72;
  const seamOk = !isHardSeam && !isFogSwallow;

  // 检查 4：留白让口（非堵口塞爆、非散碎空壳、天头 ≥ 8%、深远通道通畅 ≥ 62%）
  const isChokedEntry = state.clearance === "choked" || geom.throatOpenPct < 62;
  const isHeadroomCramp = geom.headroomPct < 8;
  const isOverSparse = state.clearance === "sparse";
  const spaceOk = !isChokedEntry && !isHeadroomCramp && !isOverSparse;

  const checks = {
    hierarchy: hierarchyOk,
    axis: axisOk,
    seam: seamOk,
    space: spaceOk,
  };
  const score = Number(hierarchyOk) + Number(axisOk) + Number(seamOk) + Number(spaceOk);

  // 决定首要错态（8 类之一）或统筹达标态
  let fault = "ok";
  let badge = "";
  let title = "";
  let body = "";
  let action = "";

  if (!hierarchyOk) {
    if (isSingleCollapse) {
      fault = "single_collapse";
      badge = `错态 · 单远孤立退化 (${score} / 4)`;
      title = `${AXIS_LABELS[top.key]}独占 ${top.val}%，${AXIS_LABELS[low.key]}只剩 ${low.val}%`;
      body = `三远综合的前提是三种空间都真实在场。现在${AXIS_LABELS[low.key]}被压到 ${low.val}%，画面已经退化成单一的「${AXIS_PAGE_HINT[top.key]}」，失去多维纵横的复合气度。`;
      action = `拖动底沿等式条里的双游标，把主远收在 44%–72%，并给另外两远各留出 14% 以上份额。`;
    } else {
      fault = "equal_fight";
      badge = `错态 · 三权均分打架 (${score} / 4)`;
      title = `高远 ${high}%、深远 ${deep}%、平远 ${level}%，三个方向互相拔河`;
      body = `右上三枚圆点已亮成三实点——仰望、穿入与横展势均力敌，视线刚想向上冲就被两侧扯横、又被中谷拽回，整幅画反而失去统领骨架。`;
      action = `横向拖动底沿公式里的双游标，先挑定一种主远拉到 45%–68%（形成「一主二辅」）。`;
    }
  } else if (!axisOk) {
    fault = "axis_split";
    badge = `错态 · 三轴错位撕裂 (${score} / 4)`;
    title = `主峰偏 ${Math.round(state.peakOffset * 100)}%、谷口偏 ${Math.round(state.valleyOffset * 100)}%、水岸歪 ${state.waterTiltDeg > 0 ? "+" : ""}${state.waterTiltDeg}°`;
    body = `高远、深远、平远本来就是三种不同视点，若峰脊、山坳与水岸再各自跑偏，画面就会裂成三套互不相干的透视，观者立刻觉得「歪了」。`;
    action = `直接点击画布上的红色错轴标记，或切换「中轴三角 / 北宋 S 脉」，把三套轴线收拢进统一脉络。`;
  } else if (!seamOk) {
    if (isHardSeam) {
      fault = "hard_seam";
      badge = `错态 · 三截硬切拼贴 (${score} / 4)`;
      title = `烟岚接缝只有 ${geom.mist}%，三层空间像剪贴画硬粘在一起`;
      body = `高远主峰、深远重峦与平远水岸之间没有云岚留白缓冲，生硬的横切线直接暴露了多视点的拼合痕迹，空间气脉在这里断了。`;
      action = `把「烟岚衔脉」滑块推入经验参考带 24%–72%，用半透轻岚自然渡过视点接缝。`;
    } else {
      fault = "fog_swallow";
      badge = `错态 · 浓雾吞山失骨 (${score} / 4)`;
      title = `烟岚推到 ${geom.mist}%，中景深远重峦被白雾全吞没了`;
      body = `烟岚是用来「断腰通气」的，不是把画抹白。雾气过重时，深远那几重递进的山坳与明暗层次全化成一片白板，纵深感当场消失。`;
      action = `把「烟岚衔脉」往回调回 24%–72% 之间，让山骨与烟岚互相透出来。`;
    }
  } else if (!spaceOk) {
    if (isChokedEntry) {
      fault = "choked_entry";
      badge = `错态 · 前景堵口截道 (${score} / 4)`;
      title = `前景色块居中压住谷口，深远入口只剩 ${geom.throatOpenPct}% 通路`;
      body = `前景原本用来锚定尺度、引出平远阔度；现在圆块与方体过大又堵在谷口正中，直接拦断进入深远山坳的视线，天头也只剩 ${geom.headroomPct}%。`;
      action = `把「留白与前景」切到「疏密让口」，让前景色块退让到两侧，同时给峰顶留足天头余气。`;
    } else if (isHeadroomCramp) {
      fault = "headroom_cramp";
      badge = `错态 · 主峰顶天窒息 (${score} / 4)`;
      title = `主峰顶到画框上沿，天头余气只剩 ${geom.headroomPct}%`;
      body = `高远讲究「视线向上延伸」，峰尖一旦紧贴上边框，向上的势头立刻被画框撞折，整幅画显得局促压抑。`;
      action = `稍微收一点高远占比或保持「疏密让口」，让峰顶上方留出至少 8% 的天头余气。`;
    } else {
      fault = "over_sparse";
      badge = `错态 · 散碎空壳无势 (${score} / 4)`;
      title = `前景与尺度定标过弱，整组三远骨架发飘撑不住`;
      body = `过度清减让底部的阔水基台与前景定标体缩得太薄，眼睛找不到落脚的参照物，高远的雄势与平远的安定感同时泄了气。`;
      action = `把「留白与前景」切回「疏密让口」，保留适度错落的前景锚点。`;
    }
  } else {
    fault = "ok";
    const spineLabel = state.axisMode === "scurve" ? "北宋 S 脉" : "中轴三角";
    const masterTitle =
      top.key === "high"
        ? "高远领势 · 深平相济"
        : top.key === "deep"
        ? "深远藏幽 · 高平护持"
        : "平远开阔 · 高深起伏";
    badge = `已成统筹 · ${AXIS_LABELS[top.key]}主统 (4 / 4)`;
    title = `${masterTitle}（${high}% / ${deep}% / ${level}%）`;
    body = `以${AXIS_LABELS[top.key]}为视觉主帅，用${spineLabel}把三套视点收束成同一空间逻辑，${geom.mist}% 轻岚柔和渡过接缝，深远通道通畅 ${geom.throatOpenPct}%、天头留气 ${geom.headroomPct}%。你也可以改拖双游标，试试以另外两远为主的合法解。`;
    action = `已通过四项统筹校验：试试点「三维剖轴」看 XYZ 三向立体结构，或切换题材体验不同气韵。`;
  }

  // 三翼单轴简评
  const axisNotes = {
    high: {
      role: hierarchyOk && top.key === "high" ? "主远统领" : high < 14 ? "退化偏弱" : isEqualFight ? "均权互抢" : "辅远拔势",
      ok: hierarchyOk && geom.headroomPct >= 8 && axisOk,
      metric: `${high}% · 天头 ${geom.headroomPct}%`,
    },
    deep: {
      role: hierarchyOk && top.key === "deep" ? "主远藏幽" : deep < 14 ? "纵深偏薄" : isEqualFight ? "均权互抢" : "辅远穿深",
      ok: hierarchyOk && seamOk && geom.throatOpenPct >= 62,
      metric: `${deep}% · ${geom.deepLayers} 重峦`,
    },
    level: {
      role: hierarchyOk && top.key === "level" ? "主远开阔" : level < 14 ? "基台偏窄" : isEqualFight ? "均权互抢" : "辅远稳底",
      ok: hierarchyOk && Math.abs(state.waterTiltDeg) <= 2 && !isChokedEntry && !isOverSparse,
      metric: `${level}% · 阔度 ${geom.baseSpanPct}%`,
    },
  };

  return {
    geom,
    weights: geom.weights,
    dominant: hierarchyOk ? top.key : null,
    topKey: top.key,
    pips,
    checks,
    score,
    fault,
    badge,
    title,
    body,
    action,
    axisNotes,
    metrics: [
      { label: "三远配比", value: `${high} : ${deep} : ${level}`, bad: !hierarchyOk },
      { label: "轴向偏差", value: axisOk ? (state.axisMode === "scurve" ? "S 脉贯通" : "0% 对齐") : `${geom.axisDeviationPct}% 错位`, bad: !axisOk },
      { label: "烟岚衔脉", value: `${geom.mist}%${isHardSeam ? " 硬切" : isFogSwallow ? " 吞山" : " 通脉"}`, bad: !seamOk },
      { label: "通道 / 天头", value: `${geom.throatOpenPct}% · ${geom.headroomPct}%`, bad: !spaceOk },
    ],
  };
}
