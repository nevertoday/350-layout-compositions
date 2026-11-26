// 087 放射平衡 · 单真源极坐标几何与诊断引擎
// 画布绘制、四象限探针、深绛诊单与快捷校验全部只读这份 evaluate() 结果

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·星盘",
    short: "星盘花轮",
    note: "忠实承袭 087 原海报：珊瑚圆核、4 条十字主轴、4 条斜向菱脉与 8 条沙金副射线。",
  },
  rose: {
    id: "rose",
    label: "哥特·玫瑰窗",
    short: "玫瑰花窗",
    note: "致敬沙特尔主教座堂 13 世纪玫瑰窗：石棂辐射肋骨、双环彩璃瓣与向心圣光圆核。",
  },
  vinyl: {
    id: "vinyl",
    label: "唱片·封面轮",
    short: "封面字轮",
    note: "模拟音乐专辑封面排印：黑胶标签圆核配向外放射的曲目刻度线与强弱节拍点。",
  },
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mod360 = (deg) => ((deg % 360) + 360) % 360;

// 生成默认层阶模式：每 4 根一循环（主轴3 / 副点1 / 斜脉2 / 副点1）
export function defaultTiers(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    if (count === 8) {
      out.push(i % 2 === 0 ? 3 : 2);
    } else if (count === 12) {
      out.push(i % 3 === 0 ? 3 : i % 3 === 1 ? 1 : 2);
    } else if (count === 24) {
      out.push(i % 6 === 0 ? 3 : i % 3 === 0 ? 2 : 1);
    } else {
      // 16 臂（与原海报一致：4 十字主轴 + 4 45°斜脉 + 8 副射线）
      out.push(i % 4 === 0 ? 3 : i % 4 === 2 ? 2 : 1);
    }
  }
  return out;
}

// 开场刻意停在 0/4 四重错态：
// 1. 扇角蜷缩在右侧 155°，矢量重心拽偏 ΔG≈46%；
// 2. 中心圆核缩到 7% 且偏离射心 11%；
// 3. 长短对比 6%（近等长生硬辐条）；
// 4. 外延仅 48%，畏缩无张力。
export function createBrokenState(specimen = "poster") {
  const rayCount = 16;
  return {
    specimen,
    rayCount,
    spanDeg: 155,
    startDeg: -78,
    hubRatio: 0.07,
    hubOffset: { x: 0.09, y: -0.06 },
    rhythmContrast: 6,
    reach: 0.48,
    tiers: defaultTiers(rayCount),
    angleOffsets: new Array(rayCount).fill(0),
    selectedRay: -1,
    highlightMode: null,
    showGuides: true,
    pulseAt: -1,
  };
}

export function createPreset(name, specimen = "poster") {
  if (name === "broken") return createBrokenState(specimen);

  if (name === "posterClassic") {
    return {
      specimen,
      rayCount: 16,
      spanDeg: 360,
      startDeg: -90,
      hubRatio: 0.20,
      hubOffset: { x: 0, y: 0 },
      rhythmContrast: 68,
      reach: 0.86,
      tiers: defaultTiers(16),
      angleOffsets: new Array(16).fill(0),
      selectedRay: -1,
      highlightMode: null,
      showGuides: true,
      pulseAt: -1,
    };
  }

  if (name === "rose12") {
    return {
      specimen,
      rayCount: 12,
      spanDeg: 360,
      startDeg: -90,
      hubRatio: 0.22,
      hubOffset: { x: 0, y: 0 },
      rhythmContrast: 62,
      reach: 0.88,
      tiers: defaultTiers(12),
      angleOffsets: new Array(12).fill(0),
      selectedRay: -1,
      highlightMode: null,
      showGuides: true,
      pulseAt: -1,
    };
  }

  // 不等角动态力矩配平解：右侧 8 根细密轻臂（约 23° 步进）抗衡左侧 4 根稀疏重臂（最大夹角 56°），矢量合力偏移仅 1%，实测 4/4！
  if (name === "dynamicTorque") {
    const rayCount = 12;
    const targetAngles = [
      -82, -58, -34, -12, 12, 34, 58, 82,
      116, 152, 208, 244,
    ];
    const tiers = [1, 2, 1, 2, 1, 2, 1, 1, 2, 3, 2, 2];
    const startDeg = -90;
    const offsets = targetAngles.map((ang, i) => {
      const base = startDeg + (i / rayCount) * 360;
      let d = ang - base;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    });
    return {
      specimen,
      rayCount,
      spanDeg: 360,
      startDeg,
      hubRatio: 0.19,
      hubOffset: { x: 0, y: 0 },
      rhythmContrast: 58,
      reach: 0.86,
      tiers,
      angleOffsets: offsets,
      selectedRay: -1,
      highlightMode: null,
      showGuides: true,
      pulseAt: -1,
    };
  }

  // 反向试错 1：折扇展开过头 425°，射线叠压打架
  if (name === "overWrap") {
    return {
      ...createPreset("posterClassic", specimen),
      spanDeg: 425,
    };
  }

  // 反向试错 2：中心圆核撑到 40%，吞没射线
  if (name === "giantHub") {
    return {
      ...createPreset("posterClassic", specimen),
      hubRatio: 0.40,
    };
  }

  // 反向试错 3：全员等长等粗，单调机械车轮
  if (name === "flatWheel") {
    return {
      ...createPreset("posterClassic", specimen),
      rhythmContrast: 0,
      tiers: new Array(16).fill(3),
    };
  }

  // 反向试错 4：外延推过 104%，射线撞框削边
  if (name === "clippedOut") {
    return {
      ...createPreset("posterClassic", specimen),
      reach: 1.04,
    };
  }

  return createBrokenState(specimen);
}

export function setRayCount(state, count) {
  state.rayCount = count;
  state.tiers = defaultTiers(count);
  state.angleOffsets = new Array(count).fill(0);
  state.selectedRay = -1;
}

// 计算单真源极坐标几何与四维评估
export function evaluate(state) {
  const n = state.rayCount;
  const hubR = clamp(state.hubRatio, 0.05, 0.44);
  const hx = clamp(state.hubOffset.x, -0.22, 0.22);
  const hy = clamp(state.hubOffset.y, -0.22, 0.22);
  const hubOffsetDist = Math.hypot(hx, hy);
  const cNorm = clamp(state.rhythmContrast, 0, 100) / 100; // 0 = 等长，0.68 = 经典，1 = 断层
  const reach = clamp(state.reach, 0.42, 1.08);
  const span = clamp(state.spanDeg, 80, 440);

  // 各层阶的实际半径系数：cNorm = 0 时全部归 1；cNorm = 1 时副臂压到 0.34
  const tierFactor = (tier) => {
    if (tier === 3) return 1.0;
    if (tier === 2) return 1.0 - cNorm * 0.24; // 0.68 -> 0.84
    return 1.0 - cNorm * 0.64;                // 0.68 -> 0.56; 1.0 -> 0.36
  };

  const rays = [];
  for (let i = 0; i < n; i++) {
    const tier = state.tiers[i] ?? 1;
    const active = tier > 0;
    const frac = span < 359.5 ? (n > 1 ? i / (n - 1) : 0) : i / n;
    const rawDeg = state.startDeg + frac * span + (state.angleOffsets[i] || 0);
    const angleDeg = mod360(rawDeg);
    const angleRad = (rawDeg * Math.PI) / 180;
    const tf = tierFactor(tier);
    const innerR = hubR + 0.045;
    const outerR = Math.max(innerR + 0.05, reach * tf);
    const tipR = tier === 3 ? 0.048 : tier === 2 ? 0.036 : 0.025;
    const clipped = active && (outerR + tipR * 0.85 > 0.99);

    // 真实光学权重：端珠面积 + 臂长 × 粗细
    const baseThick = tier === 3 ? 1.0 : tier === 2 ? 0.72 : 0.44;
    const effThick = 1.0 - cNorm * (1.0 - baseThick);
    const armLen = Math.max(0.02, outerR - innerR);
    const weight = active ? (armLen * effThick + tipR * tipR * 120 * effThick) : 0;

    rays.push({
      index: i,
      tier,
      active,
      rawDeg,
      angleDeg,
      angleRad,
      innerR,
      outerR,
      tipR,
      clipped,
      weight,
      armLen,
      effThick,
      tipX: Math.cos(angleRad) * outerR,
      tipY: Math.sin(angleRad) * outerR,
    });
  }

  const activeRays = rays.filter((r) => r.active);
  const activeCount = activeRays.length;

  // 1. 矢量重心偏移 ΔG
  let sumX = 0;
  let sumY = 0;
  let sumW = 0;
  for (const r of activeRays) {
    const lever = (r.innerR + r.outerR) * 0.52;
    sumX += r.weight * lever * Math.cos(r.angleRad);
    sumY += r.weight * lever * Math.sin(r.angleRad);
    sumW += r.weight * lever;
  }
  const vecX = sumW > 0 ? sumX / sumW : 0;
  const vecY = sumW > 0 ? sumY / sumW : 0;
  const vectorDrift = Math.hypot(vecX, vecY);
  const driftDeg = mod360((Math.atan2(vecY, vecX) * 180) / Math.PI);

  // 2. 角度分布：最大空扇角与最小相邻夹角
  let maxGapDeg = 360;
  let minGapDeg = 360;
  let overlapPairs = 0;
  if (activeCount >= 2) {
    const sorted = activeRays.map((r) => r.angleDeg).sort((a, b) => a - b);
    maxGapDeg = 0;
    minGapDeg = 360;
    for (let i = 0; i < sorted.length; i++) {
      const next = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360;
      const gap = next - sorted[i];
      if (gap > maxGapDeg) maxGapDeg = gap;
      if (gap < minGapDeg) minGapDeg = gap;
      if (gap < 8.5) overlapPairs++;
    }
  }
  const overWrapped = span > 372 || overlapPairs > 0;

  // 3. 长短节奏阶差
  let maxOut = 0;
  let minOut = 10;
  const tierSet = new Set();
  for (const r of activeRays) {
    if (r.outerR > maxOut) maxOut = r.outerR;
    if (r.outerR < minOut) minOut = r.outerR;
    tierSet.add(r.tier);
  }
  const tierRatio = activeCount >= 2 && minOut > 0 ? maxOut / minOut : 1.0;
  const tierVariety = tierSet.size;
  const minClearArm = activeRays.length ? Math.min(...activeRays.map((r) => r.outerR - r.innerR)) : 0;

  // 4. 外延与切边
  const clippedCount = activeRays.filter((r) => r.clipped).length;
  const reachPct = Math.round(maxOut * 100);
  const hubPct = Math.round(hubR * 100);
  const hubOffsetPct = Math.round(hubOffsetDist * 100);
  const driftPct = Math.round(vectorDrift * 100);

  // 四维判据（全部双向把关）
  const passBalance = activeCount >= 6 && vectorDrift <= 0.11 && maxGapDeg <= 68 && !overWrapped;
  const passCenter = hubR >= 0.13 && hubR <= 0.30 && hubOffsetDist <= 0.05 && minClearArm >= 0.14;
  const passRhythm = tierVariety >= 2 && tierRatio >= 1.20 && tierRatio <= 2.42;
  const passExtend = maxOut >= 0.70 && maxOut <= 0.96 && clippedCount === 0;

  const passedCount = [passBalance, passCenter, passRhythm, passExtend].filter(Boolean).length;

  // 偏移象限白话
  const dirLabel = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return "正右";
    if (deg < 67.5) return "右下";
    if (deg < 112.5) return "正下";
    if (deg < 157.5) return "左下";
    if (deg < 202.5) return "正左";
    if (deg < 247.5) return "左上";
    if (deg < 292.5) return "正上";
    return "右上";
  };

  // 单真源诊断（按最直观病灶排优先）
  let tag = "4/4 · 放射成立";
  let headline = "核点稳住，四面发散又拉回平衡";
  let why = "各方向射线力矩相互抵消，中心珊瑚核明确聚拢视线，长短三阶节奏清晰，外沿也留出了继续延伸的呼吸空间。";
  let action = "试试点击单根射线或拖动扇角，故意破坏某一维，看看视觉重心怎么瞬间失衡。";
  let fixLabel = "演播脉冲波";
  let fixAction = "pulse";
  let isOk = passedCount === 4;

  if (!passBalance) {
    if (overWrapped) {
      tag = `${passedCount}/4 · 叠臂 ${Math.round(minGapDeg)}°`;
      headline = `扇面展开到 ${Math.round(span)}°，射线首尾撞成一团`;
      why = `放射平衡不是铺得越多越稳。扇角越过 360° 后，多余的射线叠压在已有射线之上（最小夹角仅 ${Math.round(minGapDeg)}°），局部发黑堵死，圆周反而重新失重。`;
      action = "向左拖回扇面开合，把展开角收回到 360° 整圈，让每根射线各自透气。";
      fixLabel = "收齐至 360° 整圈";
      fixAction = "fixBalance";
    } else if (activeCount < 6) {
      tag = `${passedCount}/4 · 仅剩 ${activeCount} 臂`;
      headline = `只剩 ${activeCount} 根射线，撑不起 360° 放射场`;
      why = "元素过少时，画面退化成几条零散短棍，眼睛无法把它们读成绕中心向外扩散的整体结构。";
      action = "点击灰色的空槽位补回射线，至少保留 6 根以上并在圆周配平。";
      fixLabel = "补全平衡星盘";
      fixAction = "fixBalance";
    } else if (vectorDrift > 0.11) {
      tag = `${passedCount}/4 · 偏载 ${driftPct}%`;
      headline = `射线挤向${dirLabel(driftDeg)}，视觉重心被拽飞 ${driftPct}%`;
      why = `当前最大空扇角裂开 ${Math.round(maxGapDeg)}°，所有视觉重量压向一侧。没有对侧射线拉住力矩，整个圆盘像要往${dirLabel(driftDeg)}翻倒。`;
      action = "在星盘空白处向右横拖展开折扇至 360°，或拖单根射线到空缺象限把红箭拉回圆心。";
      fixLabel = "展开 360° 平衡星盘";
      fixAction = "fixAll";
    } else {
      tag = `${passedCount}/4 · 缺口 ${Math.round(maxGapDeg)}°`;
      headline = `虽然合力接近归零，但圆周裂开 ${Math.round(maxGapDeg)}° 大口`;
      why = "只靠两团对撞把重心勉强拉平，会变成双翼夹心而不是四面辐射。四周最大空扇角最好控制在 68° 以内，圆周才读得出连续扩散。";
      action = "拖动几根射线填进空缺象限，或者直接切到原海报 16 臂星盘对比。";
      fixLabel = "匀开空缺扇区";
      fixAction = "fixBalance";
    }
  } else if (!passCenter) {
    if (hubOffsetDist > 0.05) {
      tag = `${passedCount}/4 · 核偏 ${hubOffsetPct}%`;
      headline = `中心圆核偏离射线交汇点 ${hubOffsetPct}%`;
      why = "所有射线都在指向圆心，可核心圆盘却躲到一旁。视线顺着射线聚回来时落了空，中心聚合感立刻瓦解。";
      action = "直接拖动珊瑚圆盘回到虚线测角环的正中央（靠近圆心会轻轻吸住）。";
      fixLabel = "归正中心圆核";
      fixAction = "fixCenter";
    } else if (hubR < 0.13) {
      tag = `${passedCount}/4 · 失核 ${hubPct}%`;
      headline = `中心圆核缩到 ${hubPct}%，放射失去了引力锚点`;
      why = "核点太小，压不住外围十多根射线的拉扯。视线一进画面就被散碎的端珠扯走，找不到整幅图的出发点。";
      action = "把「核径占比」推到 16%–26%，给发散立住一块一眼锚定的珊瑚核。";
      fixLabel = "放大中心核至 20%";
      fixAction = "fixCenter";
    } else {
      tag = `${passedCount}/4 · 大核 ${hubPct}%`;
      headline = `中心圆核膨到 ${hubPct}%，把射线吞成了短毛刺`;
      why = "核心压倒性过大会直接吃掉放射线的生长空间，画面退化成一个孤零零的大圆饼，失去向外扩散的纵深与轻盈。";
      action = "把「核径占比」收回到 16%–28%，把舞台还给向四周延展的射线。";
      fixLabel = "收核至 20% 留出臂长";
      fixAction = "fixCenter";
    }
  } else if (!passRhythm) {
    if (tierRatio < 1.20 || tierVariety < 2) {
      tag = `${passedCount}/4 · 等长 ${tierRatio.toFixed(2)}×`;
      headline = `长短阶差仅 ${tierRatio.toFixed(2)}×，僵成了铁丝自行车轮`;
      why = "每根射线一样长、一样粗、同样重，确实对称，却毫无主次与呼吸。原海报用长十字主轴、中斜脉与短沙金点错落出三层节拍，动态才活起来。";
      action = "把「长短阶差」调到 55%–80%，或点击隔根射线切成短阶副臂。";
      fixLabel = "拉开三阶长短韵律";
      fixAction = "fixRhythm";
    } else {
      tag = `${passedCount}/4 · 断层 ${tierRatio.toFixed(2)}×`;
      headline = `主副长短差拉到 ${tierRatio.toFixed(2)}×，次级点碎成噪点`;
      why = "副射线缩得太短太轻，紧贴在中心圆核周围像没擦干净的碎屑，反而割裂了内环与外环的节奏过渡。";
      action = "把「长短阶差」略收回至 55%–80%，让副射线稳稳托住主轴之间的空档。";
      fixLabel = "回调三阶节奏";
      fixAction = "fixRhythm";
    }
  } else if (!passExtend) {
    if (clippedCount > 0 || maxOut > 0.96) {
      tag = `${passedCount}/4 · 切边 ${clippedCount} 臂`;
      headline = `射线外延冲到 ${reachPct}%，${clippedCount} 根主臂顶破画框被削断`;
      why = "向外发散要靠边缘呼吸留白来托住余韵。端珠一旦撞在框边被截平，视线顺着射线冲出去就会猛然撞墙。";
      action = "把「外延深度」往回调到 78%–90%，给最外圈酒红端珠留出一圈舒展宣纸。";
      fixLabel = "收回外延留出呼吸边";
      fixAction = "fixExtend";
    } else {
      tag = `${passedCount}/4 · 畏缩 ${reachPct}%`;
      headline = `外延只伸到 ${reachPct}%，畏缩在纸中央放不开`;
      why = "射线缩成小小一团，四周留下大片空荡死白，放射平衡该有的向外张力与空间延展感根本撑不起来。";
      action = "把「外延深度」推到 78%–90%，让四面射线真正把版面撑开。";
      fixLabel = "舒展射线外延至 86%";
      fixAction = "fixExtend";
    }
  }

  // 四象限实时探针徽标（单真源输出）
  const probes = {
    balance: {
      pass: passBalance,
      badge: passBalance
        ? `偏移 ${driftPct}%`
        : overWrapped
          ? `叠臂 ${Math.round(minGapDeg)}°`
          : vectorDrift > 0.11
            ? `偏载 ${driftPct}%`
            : `缺口 ${Math.round(maxGapDeg)}°`,
      metric: `ΔG ${driftPct}% · 最大空扇 ${Math.round(maxGapDeg)}°`,
    },
    center: {
      pass: passCenter,
      badge: passCenter
        ? `核径 ${hubPct}%`
        : hubOffsetDist > 0.05
          ? `核偏 ${hubOffsetPct}%`
          : hubR < 0.13
            ? `失核 ${hubPct}%`
            : `大核 ${hubPct}%`,
      metric: `核径 ${hubPct}% · 偏心 ${hubOffsetPct}%`,
    },
    rhythm: {
      pass: passRhythm,
      badge: passRhythm
        ? `阶差 ${tierRatio.toFixed(2)}×`
        : tierRatio < 1.20 || tierVariety < 2
          ? `等长 ${tierRatio.toFixed(2)}×`
          : `断层 ${tierRatio.toFixed(2)}×`,
      metric: `${tierVariety} 层 · 主副比 ${tierRatio.toFixed(2)}×`,
    },
    extend: {
      pass: passExtend,
      badge: passExtend
        ? `外延 ${reachPct}%`
        : clippedCount > 0 || maxOut > 0.96
          ? `切边 ${clippedCount} 臂`
          : `畏缩 ${reachPct}%`,
      metric: `外延 ${reachPct}% · 切边 ${clippedCount} 处`,
    },
  };

  return {
    rays,
    activeCount,
    hubR,
    hx,
    hy,
    hubPct,
    hubOffsetDist,
    hubOffsetPct,
    vecX,
    vecY,
    vectorDrift,
    driftPct,
    driftDeg,
    maxGapDeg,
    minGapDeg,
    overWrapped,
    tierRatio,
    tierVariety,
    reachPct,
    clippedCount,
    passedCount,
    isOk,
    passBalance,
    passCenter,
    passRhythm,
    passExtend,
    tag,
    headline,
    why,
    action,
    fixLabel,
    fixAction,
    probes,
    summaryLevel: isOk ? "四维成立（示意）" : passedCount >= 2 ? "局部失衡（示意）" : "多重失序（示意）",
  };
}
