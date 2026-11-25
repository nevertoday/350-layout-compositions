// 203 放射网格 RADIAL GRID · 单真源几何与诊断模型
// 所有坐标均以星盘外圈半径 R = 1 的归一化极坐标 / 笛卡尔坐标计算；
// 2D 画布、点击命中、六大要点实况、核心比徽标与白话诊单全部读取同一份 computeModel(state) 结果。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报星盘",
    en: "POSTER DIAL",
    coreLabel: "",
    coreSub: "",
    items: [
      { icon: "asterisk", label: "焦点" },
      { icon: "bars", label: "序列" },
      { icon: "frame", label: "模块" },
      { icon: "triangle", label: "动势" },
      { icon: "chevron", label: "导向" },
      { icon: "dots9", label: "群组" },
      { icon: "half", label: "对比" },
      { icon: "typeT", label: "标题" },
      { icon: "diamond", label: "节点" },
      { icon: "ring", label: "环层" },
      { icon: "cross", label: "轴心" },
      { icon: "waves", label: "节奏" },
      { icon: "grid4", label: "归类" },
      { icon: "spark", label: "发散" },
      { icon: "arc", label: "弧轨" },
      { icon: "dot1", label: "末梢" },
    ],
  },
  userhub: {
    id: "userhub",
    label: "用户中心图谱",
    en: "USER HUB MAP",
    coreLabel: "用户",
    coreSub: "USER",
    items: [
      { icon: "spark", label: "核心主题" },
      { icon: "bars", label: "关键数据" },
      { icon: "heart", label: "用户需求" },
      { icon: "check", label: "解决方案" },
      { icon: "list", label: "执行步骤" },
      { icon: "bulb", label: "相关概念" },
      { icon: "ring", label: "使用场景" },
      { icon: "frame", label: "触点入口" },
      { icon: "dots9", label: "功能模块" },
      { icon: "chevron", label: "反馈流" },
      { icon: "triangle", label: "增长杠杆" },
      { icon: "half", label: "体验对比" },
      { icon: "diamond", label: "留存锚点" },
      { icon: "cross", label: "协作角色" },
      { icon: "arc", label: "服务半径" },
      { icon: "dot1", label: "衍生指标" },
    ],
  },
  piemenu: {
    id: "piemenu",
    label: "环形快捷轮盘",
    en: "RADIAL PIE MENU",
    coreLabel: "起点",
    coreSub: "ORIGIN",
    items: [
      { icon: "spark", label: "新建" },
      { icon: "frame", label: "对齐" },
      { icon: "bars", label: "图层" },
      { icon: "triangle", label: "缩放" },
      { icon: "chevron", label: "导出" },
      { icon: "dots9", label: "网格" },
      { icon: "half", label: "反色" },
      { icon: "typeT", label: "文字" },
      { icon: "diamond", label: "锚点" },
      { icon: "ring", label: "旋转" },
      { icon: "cross", label: "裁剪" },
      { icon: "waves", label: "路径" },
      { icon: "grid4", label: "编组" },
      { icon: "arc", label: "圆角" },
      { icon: "check", label: "锁定" },
      { icon: "dot1", label: "撤销" },
    ],
  },
};

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    coreR: 0.12,
    spokes: 14,
    distribution: "skewed",
    decay: "inverted",
    flow: "chords",
    driftIds: [1, 4],
  },
  poster8: {
    label: "原海报八射线解",
    coreR: 0.25,
    spokes: 8,
    distribution: "equal",
    decay: "gradual",
    flow: "spokes-rings",
    driftIds: [],
  },
  hub6: {
    label: "六射线用户图解",
    coreR: 0.27,
    spokes: 6,
    distribution: "equal",
    decay: "gradual",
    flow: "spokes",
    driftIds: [],
  },
  rhythm12: {
    label: "十二射线韵律解",
    coreR: 0.23,
    spokes: 12,
    distribution: "rhythm",
    decay: "gradual",
    flow: "spokes-rings",
    driftIds: [],
  },
  bloat: {
    label: "试错：圆心胀满",
    coreR: 0.39,
    spokes: 8,
    distribution: "equal",
    decay: "gradual",
    flow: "spokes-rings",
    driftIds: [],
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    coreR: PRESETS.broken.coreR,
    spokes: PRESETS.broken.spokes,
    distribution: PRESETS.broken.distribution,
    decay: PRESETS.broken.decay,
    flow: PRESETS.broken.flow,
    driftIds: [...PRESETS.broken.driftIds],
    activeNode: -1,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算归一化角度（-π/2 从 12 点钟顺时针起算）
function buildAngles(spokes, distribution) {
  const start = -Math.PI / 2;
  const angles = [];
  if (distribution === "skewed") {
    // 严重偏聚到右半圆约 196° 扇区内，左侧留下大片塌空
    const span = (196 * Math.PI) / 180;
    const base = -Math.PI / 2 + 0.08;
    for (let i = 0; i < spokes; i++) {
      const t = spokes === 1 ? 0 : i / (spokes - 1);
      // 轻微非线性挤压，使右中段格外拥挤
      const eased = Math.pow(t, 1.18);
      angles.push(base + eased * span);
    }
    return angles;
  }
  if (distribution === "rhythm") {
    // 偶/奇配对的对称韵律节拍：仍绕整圆 360° 平衡，但相邻扇区呈 0.82 / 1.18 轻韵律交替
    const step = (Math.PI * 2) / spokes;
    const amp = spokes % 2 === 0 ? 0.14 : 0;
    for (let i = 0; i < spokes; i++) {
      const shift = i % 2 === 1 ? -amp * step : amp * step * 0.35;
      angles.push(start + i * step + shift);
    }
    return angles;
  }
  const step = (Math.PI * 2) / spokes;
  for (let i = 0; i < spokes; i++) {
    angles.push(start + i * step);
  }
  return angles;
}

// 计算两个扇区序列的最小/最大夹角（度）
function sectorStats(angles) {
  if (angles.length < 2) return { minDeg: 360, maxDeg: 360, ratio: 1 };
  const norm = angles.map((a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
  let minGap = Infinity;
  let maxGap = 0;
  for (let i = 0; i < norm.length; i++) {
    const next = i === norm.length - 1 ? norm[0] + Math.PI * 2 : norm[i + 1];
    const gap = next - norm[i];
    if (gap < minGap) minGap = gap;
    if (gap > maxGap) maxGap = gap;
  }
  const minDeg = (minGap * 180) / Math.PI;
  const maxDeg = (maxGap * 180) / Math.PI;
  return {
    minDeg,
    maxDeg,
    ratio: maxDeg / Math.max(1, minDeg),
  };
}

// 生成跨心弦线对，并按解析几何实算线段相交次数
function buildChords(nodes) {
  const n = nodes.length;
  const chords = [];
  if (n < 3) return { chords, crossings: 0 };
  const strideA = Math.max(2, Math.floor(n * 0.38));
  const strideB = Math.max(3, Math.floor(n * 0.56));
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    for (const s of [strideA, strideB]) {
      const j = (i + s) % n;
      if (i === j) continue;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        chords.push([i, j]);
      }
    }
  }
  // 严格二维线段相交判定（不含共享端点）
  const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  const cross = (a1, a2, b1, b2) => ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
  let crossings = 0;
  for (let p = 0; p < chords.length; p++) {
    const [i1, j1] = chords[p];
    for (let q = p + 1; q < chords.length; q++) {
      const [i2, j2] = chords[q];
      if (i1 === i2 || i1 === j2 || j1 === i2 || j1 === j2) continue;
      if (cross(nodes[i1], nodes[j1], nodes[i2], nodes[j2])) crossings++;
    }
  }
  return { chords, crossings };
}

export function computeModel(state) {
  const coreR = clamp(Number(state.coreR) || 0.25, 0.1, 0.42);
  const spokes = clamp(Math.round(Number(state.spokes) || 8), 3, 16);
  const distribution = state.distribution || "equal";
  const decay = state.decay || "gradual";
  const flow = state.flow || "spokes-rings";
  const theme = THEMES[state.theme] ? state.theme : "poster";
  const driftSet = new Set((state.driftIds || []).filter((id) => id >= 0 && id < spokes));

  // 三道同心环半径（归一化）
  const outerRingR = 0.87;
  const midRingR = distribution === "rhythm" ? 0.63 : 0.68;
  const innerRingR = 0.47;

  // 外环模块基准半径随层级衰减模式实算
  const countScale = spokes <= 6 ? 1.04 : spokes <= 8 ? 1.0 : spokes <= 12 ? 0.86 : 0.78;
  let outerNodeR;
  let innerTierR;
  if (decay === "inverted") {
    outerNodeR = 0.142 * Math.min(1, countScale + 0.08);
    innerTierR = 0.082;
  } else if (decay === "flat") {
    outerNodeR = 0.122 * countScale;
    innerTierR = outerNodeR;
  } else {
    // 渐进衰减：严格显著小于合理核心圆盘，且在韵律双环下内环略大、外环更轻
    outerNodeR = 0.102 * countScale;
    innerTierR = distribution === "rhythm" ? 0.112 * countScale : 0.024;
  }

  const angles = buildAngles(spokes, distribution);
  const items = THEMES[theme].items;

  const nodes = angles.map((ang, i) => {
    const isInnerTier = distribution === "rhythm" && i % 2 === 1;
    const baseRingR = isInnerTier ? midRingR : outerRingR;
    let nodeR = isInnerTier ? innerTierR : outerNodeR;
    // 在韵律双环的 inverted 模式下，外环反而更大，凸显倒挂
    if (distribution === "rhythm" && decay === "inverted") {
      nodeR = isInnerTier ? 0.084 : 0.136;
    }

    const drifted = driftSet.has(i);
    let r = baseRingR;
    let a = ang;
    let driftKind = "";
    if (drifted) {
      // 奇数索引被推向圆心挤压撞线，偶数索引甩到外环外侧偏角漂浮
      if (i % 2 === 1) {
        r = Math.max(coreR + nodeR * 0.72, 0.34);
        a = ang + 0.21;
        driftKind = "挤近圆心";
      } else {
        r = 0.99;
        a = ang - 0.19;
        driftKind = "飞出外环";
      }
    }
    return {
      index: i,
      tier: isInnerTier ? 1 : 2,
      baseRingR,
      baseAngle: ang,
      r,
      angle: a,
      nodeR,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      drifted,
      driftKind,
      icon: items[i % items.length].icon,
      label: items[i % items.length].label,
    };
  });

  // 实测最近邻模块表面净距（相对节点直径的比值）
  let minEdgeGap = Infinity;
  let minPair = [-1, -1];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) - (nodes[i].nodeR + nodes[j].nodeR);
      if (d < minEdgeGap) {
        minEdgeGap = d;
        minPair = [i, j];
      }
    }
  }
  const avgNodeR = nodes.reduce((s, n) => s + n.nodeR, 0) / Math.max(1, nodes.length);
  const minGapRatio = minEdgeGap / Math.max(0.01, avgNodeR * 2);

  // 实测核心与外环模块的面积比 & 直径比
  const outerNodes = nodes.filter((n) => n.tier === 2);
  const refOuterR = outerNodes.length ? outerNodes[0].nodeR : avgNodeR;
  const diaRatio = coreR / Math.max(0.01, refOuterR);
  const areaRatio = diaRatio * diaRatio;
  const innerClearance = innerRingR - coreR;
  const hubCollision = nodes.some((n) => Math.hypot(n.x, n.y) - (coreR + n.nodeR) < 0.025);

  const sectors = sectorStats(angles);
  const chordData = flow === "chords" ? buildChords(nodes) : { chords: [], crossings: 0 };
  const offTrackNodes = nodes.filter((n) => n.drifted);

  // 10 类几何失误单真源判定
  const errors = [];
  if (coreR < 0.2 || areaRatio < 2.2) {
    errors.push({
      id: "core_weak",
      pillar: "core",
      badge: `圆心失权 · 面积 ${areaRatio.toFixed(1)}×`,
      title: `中心圆盘太弱（仅外环模块的 ${areaRatio.toFixed(1)} 倍面积）`,
      why: "海报第一条强调「中心最为突出，越向外层级越弱」。现在圆心甚至压不住外圈模块，观众进场会先被一圈外围大圆拉走，整张版面失去阅读原点。",
      next: "在星盘中央向右横拖（或拉大「核心半径」滑杆），把中心半径扩到 22%–30% 区间。",
    });
  } else if (coreR > 0.32 || innerClearance < 0.08 || hubCollision) {
    errors.push({
      id: "core_bloat",
      pillar: "core",
      badge: `圆心胀满 · ${Math.round(coreR * 100)}%`,
      title: `中心胀到 ${Math.round(coreR * 100)}%，把内环与射线挤成短须`,
      why: "圆心不是越大越好。中心过胖会吞掉内环呼吸带，射线只剩短短一截，版面退化成一只孤立大圆饼，向外扩散的动势瞬间消失。",
      next: "在星盘中央向左横拖（或调小「核心半径」），给中心与内环留出清晰呼吸环带。",
    });
  }

  if (flow === "chords") {
    errors.push({
      id: "chord_tangle",
      pillar: "flow",
      badge: `弦线打结 · ${chordData.crossings} 处交叉`,
      title: `连线跨心乱穿产生 ${chordData.crossings} 处交叉，放射方向彻底失效`,
      why: "放射网格依靠从圆心发出的径向射线引导视线；一旦改成模块之间横穿圆心的网状弦线，视线会被网眼缠死在中央，分不清主次与流向。",
      next: "直接点击星盘中央的赤红「弦线交叉」标牌（或在下方把连线切换为「径向射线」或「射线 + 双环」）。",
    });
  }

  if (distribution === "skewed" || sectors.ratio > 1.65) {
    errors.push({
      id: "angle_skew",
      pillar: "spokes",
      badge: `扇区偏聚 · 空弧 ${Math.round(sectors.maxDeg)}°`,
      title: `模块全挤向右半圆，左侧塌出 ${Math.round(sectors.maxDeg)}° 大空洞`,
      why: `最小扇角只有 ${Math.round(sectors.minDeg)}°、最大空弧却达 ${Math.round(sectors.maxDeg)}°。视觉重量完全倾倒在一边，整张星盘像失衡的车轮向右侧坠落。`,
      next: "在下方把「扇区分布」切回「等分对称」或「韵律交替」，让射线围绕圆心均匀展开。",
    });
  }

  if (spokes < 4) {
    errors.push({
      id: "spokes_sparse",
      pillar: "spokes",
      badge: `射线过疏 · ${spokes} 路`,
      title: `只有 ${spokes} 路射线，撑不起完整的放射圆环秩序`,
      why: "少于 4 路射线时，外围节点难以在心理上闭合成同心环，版面更像简单的三叉线或直线分段，缺少放射网格的聚合张力。",
      next: "把「主射线数」增至 6 路或 8 路（经验常用 4–8 路，双环韵律可至 12 路）。",
    });
  } else if (minEdgeGap < 0.035 || minGapRatio < 0.24 || spokes > 12) {
    errors.push({
      id: "spokes_crowded",
      pillar: "spokes",
      badge: `射线过密 · ${spokes} 路撞车`,
      title: `${spokes} 路模块挤在同一圆环上，相邻净距已缩到临界`,
      why: minEdgeGap < 0
        ? "相邻模块边界已经互相压叠撞车，圆心附近射线也挤成黑压压的辐条团，既无法归纳分组，又难以快速定位单个模块。"
        : "同一圆环塞进过多射线会让扇区过窄、留白消失；若确实要排 12 路模块，需用「韵律交替」错开到内外两环。",
      next: spokes >= 12
        ? "把主射线减到 6 或 8 路，或选 12 路并切换到「韵律交替」双环错层。"
        : "减少射线数或收小外环模块层级，让相邻节点之间留出喘息弧距。",
    });
  }

  if (offTrackNodes.length > 0) {
    errors.push({
      id: "off_track",
      pillar: "ring",
      badge: `偏轨漂浮 · ${offTrackNodes.length} 处`,
      title: `有 ${offTrackNodes.length} 枚模块脱离同心环与射线交点`,
      why: "放射网格之所以「秩序自然而生」，前提是模块稳稳落在同心环与射线的交点上。元素随意飘在环外或贴心乱挤，分组归属立刻瓦解。",
      next: "直接点击画布上带赤红虚线圈的偏轨模块，把它吸回所属射线与同心环交点。",
    });
  }

  if (decay === "inverted") {
    errors.push({
      id: "tier_inverted",
      pillar: "ring",
      badge: `外强倒挂 · 外环过重`,
      title: "外环模块反比内层更粗重，层级顺序首尾倒置",
      why: "越远离圆心的模块越应该收轻收小，让视线顺着「强中心 → 次环层 → 轻末梢」自然衰减；外圈做得又大又重，会把圆心架空。",
      next: "把「层级衰减」切为「逐级递减」，恢复由内向外清晰收轻的视觉坡度。",
    });
  } else if (decay === "flat") {
    errors.push({
      id: "tier_flat",
      pillar: "ring",
      badge: `层级平权 · 缺少衰减`,
      title: "外环模块尺寸偏大平权，内外层次拉不开差距",
      why: "当外圈模块体量逼近圆心，视觉上会退化成平权卡片圈，失去了放射网格先定主轴、再逐层展开的层级效率。",
      next: "把「层级衰减」切为「逐级递减」，拉开核心与外环模块的比例落差。",
    });
  }

  // 四大支柱单真源验收
  const pillars = {
    core: !errors.some((e) => e.pillar === "core"),
    spokes: !errors.some((e) => e.pillar === "spokes"),
    ring: !errors.some((e) => e.pillar === "ring"),
    flow: !errors.some((e) => e.pillar === "flow"),
  };
  const passedCount = Object.values(pillars).filter(Boolean).length;
  const allOk = passedCount === 4;

  // 识别当前最匹配的合法解流派
  let solutionName = "自定义合理解";
  if (allOk) {
    if (spokes === 8 && distribution === "equal" && flow === "spokes-rings") solutionName = "原海报八射线双环解";
    else if (spokes === 6 && distribution === "equal") solutionName = "六射线疏朗图谱解";
    else if (distribution === "rhythm") solutionName = `${spokes} 射线韵律双环解`;
    else solutionName = `${spokes} 射线均衡放射解`;
  }

  // 原海报六大要点（左三 + 右三）的实时状态标签
  const sixPoints = {
    hierarchy: {
      ok: pillars.core && decay === "gradual",
      tag: !pillars.core
        ? coreR > 0.32 ? "圆心过胀" : `心比 ${areaRatio.toFixed(1)}×`
        : decay !== "gradual" ? (decay === "inverted" ? "外强倒挂" : "平权偏重") : `心比 ${areaRatio.toFixed(1)}×`,
    },
    direction: {
      ok: pillars.flow,
      tag: flow === "chords" ? `交叉 ${chordData.crossings} 处` : flow === "spokes-rings" ? "双阶导引" : "径向清晰",
    },
    motion: {
      ok: pillars.flow && pillars.spokes && coreR <= 0.32,
      tag: flow === "chords"
        ? "视线受阻"
        : coreR > 0.32
          ? "向外受挤压"
          : distribution === "skewed"
            ? "单侧倾倒"
            : distribution === "rhythm"
              ? "韵律扩散"
              : "外扩顺畅",
    },
    center: {
      ok: pillars.core,
      tag: coreR < 0.2 || areaRatio < 2.2
        ? `${Math.round(coreR * 100)}% 失权`
        : coreR > 0.32 || innerClearance < 0.08
          ? `${Math.round(coreR * 100)}% 吞环`
          : `${Math.round(coreR * 100)}% 稳核`,
    },
    radiation: {
      ok: pillars.spokes && pillars.flow,
      tag: distribution === "skewed"
        ? `偏聚 ${Math.round(sectors.minDeg)}°`
        : spokes < 4
          ? `${spokes} 路过疏`
          : minEdgeGap < 0.035 || spokes > 12
            ? `${spokes} 路过密`
            : `${spokes} 路·${Math.round(360 / spokes)}°`,
    },
    modules: {
      ok: pillars.ring && minEdgeGap >= 0.035,
      tag: offTrackNodes.length > 0
        ? `偏轨 ${offTrackNodes.length} 处`
        : minEdgeGap < 0.035
          ? "外环贴撞"
          : decay !== "gradual"
            ? "尺码失序"
            : distribution === "rhythm"
              ? "双环归位"
              : "同环归位",
    },
  };

  // 顶部拱形大标自示范形变系数（错态时微斜/微扁，达标时归正成端庄星拱）
  const archTiltDeg = distribution === "skewed" ? 3.2 : 0;
  const archLift = allOk ? 1 : coreR < 0.2 ? 0.55 : coreR > 0.32 ? 1.25 : 0.78;

  const primaryError = errors[0] || null;

  return {
    theme,
    coreR,
    spokes,
    distribution,
    decay,
    flow,
    outerRingR,
    midRingR,
    innerRingR,
    nodes,
    chords: chordData.chords,
    crossings: chordData.crossings,
    areaRatio,
    diaRatio,
    innerClearance,
    minEdgeGap,
    minGapRatio,
    minPair,
    sectors,
    offTrackCount: offTrackNodes.length,
    errors,
    primaryError,
    pillars,
    passedCount,
    allOk,
    solutionName,
    sixPoints,
    archTiltDeg,
    archLift,
  };
}
