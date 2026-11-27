// 055 同心式构图 · 单真源几何与四维评测模型
// 所有画布坐标、读数、徽标状态、诊断文案都由本模块同一份几何数组算出。

export const PALETTE = {
  bg: "#080E13",
  bgDeep: "#070D10",
  cream: "#EAD7BD",
  creamTitle: "#DACBB3",
  coral: "#D38D8B",
  coralBright: "#E39B97",
  darkRing: "#1A1D1B",
  jade: "#44685E",
  jadeDeep: "#3A5A51",
  jadeGlare: "#A9E8CE",
  mint: "#8FBEA5",
  mintBar: "#7AAF9B",
  warn: "#F07268",
  ok: "#7BD9A8",
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报 · 环层",
    short: "原海报",
    coreTitle: "核心",
    coreSub: "FOCUS",
    ringLabels: ["暖米核", "珊瑚粉环", "深墨点纹环", "松石青绿环", "次外辅环", "外缘密环", "极外窄环"],
    arcTexts: {
      midTop: "突出主体，强化焦点",
      midBot: "形成包围，增强稳定感",
      outTop: "层层递进，引导视线",
      outBot: "外延扩展，建立节奏",
    },
    colors: {
      core: "#EAD7BD",
      coreInk: "#111A18",
      coreSub: "#44685E",
      bands: ["#D38D8B", "#1A1D1B", "#44685E", "#283935", "#3E5851", "#202A28"],
      glareBand: "#E8F6EC",
    },
  },
  altar: {
    id: "altar",
    name: "天坛 · 圜丘三坛",
    short: "圜丘坛",
    coreTitle: "天心石",
    coreSub: "CENTER STONE",
    ringLabels: ["天心石", "上层圆坛", "中层圆坛", "下层圆坛", "外壝圆墙", "外坛石道", "松柏界圈"],
    arcTexts: {
      midTop: "天心石为圆心，九重石板环抱",
      midBot: "三重汉白玉栏，由内而外递进",
      outTop: "四向棂星门轴线，锁定天地秩序",
      outBot: "明嘉靖九年（1530）圜丘同心制",
    },
    colors: {
      core: "#F0E5D1",
      coreInk: "#17201E",
      coreSub: "#45685F",
      bands: ["#C9B49A", "#222A28", "#4A6E63", "#314641", "#465F57", "#232F2C"],
      glareBand: "#F4EBD6",
    },
  },
  watch: {
    id: "watch",
    name: "腕表 · 同心表盘",
    short: "腕表盘",
    coreTitle: "枢轴",
    coreSub: "CHRONOGRAPH",
    ringLabels: ["指针枢轴", "中心日历盘", "拉丝暗刻环", "青绿时标外环", "测速刻度圈", "表圈外沿", "表壳外圈"],
    arcTexts: {
      midTop: "指针同轴咬合，目光直落中心",
      midBot: "哑面暗刻退让，托起读时主区",
      outTop: "60 分密刻归序，建立精密节奏",
      outBot: "四向主时标锚定，圆盘均衡呼吸",
    },
    colors: {
      core: "#E8D5BA",
      coreInk: "#0E1615",
      coreSub: "#3F6258",
      bands: ["#C98683", "#15191A", "#3D5F56", "#273A36", "#39524B", "#1E2827"],
      glareBand: "#E4F4EB",
    },
  },
};

// 开场刻意停在 0/4 四重错态：脱轴 22% + 外环夺焦 + 2.8× 步距乱拍 + 破边截圆
export const DEFAULT_BROKEN = {
  specimen: "poster",
  offsetX: 0.21,
  offsetY: -0.07,
  layerCount: 4, // 2..7（含核心）
  coreR: 0.215, // 0.08..0.36
  outerR: 1.02, // 0.48..1.12（>0.94 裁切外轨/外环）
  rhythmBias: -0.52, // -0.68..+0.68（负值导致内环膨大、中环受挤）
  ringNudges: [0, 0, 0, 0, 0, 0], // 单环手动微调
  outerGlare: true, // 外环高曝喧宾夺主
  showGuides: true,
};

export const SOLUTIONS = {
  posterClassic: {
    id: "posterClassic",
    label: "原海报典范",
    desc: "四层严格共轴，暖米核聚焦，珊瑚、深墨与松石绿阶梯包围。",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 4,
      coreR: 0.205,
      outerR: 0.84,
      rhythmBias: 0.14,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
  rippleExpand: {
    id: "rippleExpand",
    label: "水波外扩解",
    desc: "由内而外步距温和放大，如投入静水的涟漪，呼吸从容。",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 4,
      coreR: 0.165,
      outerR: 0.87,
      rhythmBias: 0.34,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
  triAltar: {
    id: "triAltar",
    label: "三坛礼制解",
    desc: "精简为三层大气环带，环幅饱满舒展，礼制与庄重感更强。",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 3,
      coreR: 0.225,
      outerR: 0.82,
      rhythmBias: 0.18,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
};

export const WRONG_PRESETS = {
  eccentric: {
    id: "eccentric",
    label: "偏心脱轴",
    patch: {
      offsetX: 0.24,
      offsetY: -0.09,
      layerCount: 4,
      coreR: 0.20,
      outerR: 0.84,
      rhythmBias: 0.14,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
  hypnotic: {
    id: "hypnotic",
    label: "7层眩晕",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 7,
      coreR: 0.13,
      outerR: 0.86,
      rhythmBias: 0.0,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
  glare: {
    id: "glare",
    label: "外环夺焦",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 4,
      coreR: 0.20,
      outerR: 0.84,
      rhythmBias: 0.14,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: true,
    },
  },
  giantCore: {
    id: "giantCore",
    label: "巨核吞环",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 4,
      coreR: 0.35,
      outerR: 0.84,
      rhythmBias: 0.05,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
  shrunk: {
    id: "shrunk",
    label: "缩核孤悬",
    patch: {
      offsetX: 0,
      offsetY: 0,
      layerCount: 4,
      coreR: 0.10,
      outerR: 0.50,
      rhythmBias: 0.12,
      ringNudges: [0, 0, 0, 0, 0, 0],
      outerGlare: false,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function hexToLum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}

// 从状态算出每层环带的精确几何（归一化坐标系 [-1, 1]，圆心默认 (0,0)）
export function computeGeometry(state) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const count = clamp(Math.round(state.layerCount), 2, 7);
  const bandCount = count - 1;
  const coreR = clamp(state.coreR, 0.08, 0.36);
  const outerR = clamp(state.outerR, 0.48, 1.12);
  const ox = clamp(state.offsetX, -0.34, 0.34);
  const oy = clamp(state.offsetY, -0.26, 0.26);
  const bias = clamp(state.rhythmBias, -0.68, 0.68);
  const nudges = state.ringNudges || [0, 0, 0, 0, 0, 0];

  // 核心与第一环之间的经典黑色静谧细缝（对应 055 原海报核心外黑圈）
  const coreGap = clamp(coreR * 0.19, 0.022, 0.048);
  const firstBandInner = coreR + coreGap;
  const availSpan = Math.max(0.14, outerR - firstBandInner);

  // 计算每层环带原始权重：bias>0 向外递增，bias<0 内环膨大挤压中间环
  const rawWeights = [];
  for (let i = 0; i < bandCount; i++) {
    const t = bandCount === 1 ? 0.5 : i / (bandCount - 1);
    let w;
    if (bias >= 0) {
      w = 1 + bias * (t - 0.35) * 1.45;
    } else {
      // 负值时首环膨胀、次环被大幅压缩，真实模拟「疏密乱拍」
      const absB = -bias;
      if (i === 0) w = 1 + absB * 1.65;
      else if (i === 1 && bandCount >= 3) w = Math.max(0.26, 1 - absB * 1.18);
      else w = 1 + absB * 0.35;
    }
    rawWeights.push(Math.max(0.22, w));
  }
  const sumW = rawWeights.reduce((a, b) => a + b, 0);

  // 先生成基准边界半径
  const radii = [firstBandInner];
  let acc = firstBandInner;
  for (let i = 0; i < bandCount; i++) {
    acc += (rawWeights[i] / sumW) * availSpan;
    radii.push(acc);
  }
  radii[radii.length - 1] = outerR;

  // 应用用户直接在画布上拖动某一层环缘带来的 nudges
  for (let i = 1; i < bandCount; i++) {
    const nudge = clamp(nudges[i - 1] || 0, -0.14, 0.14);
    const minAllow = radii[i - 1] + 0.022;
    const maxAllow = radii[i + 1] - 0.022;
    radii[i] = clamp(radii[i] + nudge, minAllow, maxAllow);
  }

  // 逐层偏移权重：最外环锚定画布中心 (0,0)，越往内核偏心越大，形成真实的错轴挤压感
  const layers = [];
  const coreLum = hexToLum(spec.colors.core);
  layers.push({
    index: 0,
    kind: "core",
    label: spec.ringLabels[0],
    cx: ox,
    cy: oy,
    rInner: 0,
    rOuter: coreR,
    width: coreR,
    fill: spec.colors.core,
    ink: spec.colors.coreInk,
    subInk: spec.colors.coreSub,
    lum: coreLum,
  });

  for (let i = 0; i < bandCount; i++) {
    const isOuter = i === bandCount - 1;
    // 最外层不动，中内层按递减权重跟随偏心
    const driftFrac = isOuter ? 0 : Math.pow(1 - (i + 1) / bandCount, 1.05) * 0.78;
    const cx = ox * driftFrac;
    const cy = oy * driftFrac;
    const rInner = radii[i];
    const rOuter = radii[i + 1];
    let fill;
    if (isOuter && state.outerGlare) {
      fill = spec.colors.glareBand;
    } else if (bandCount === 2) {
      // 3 层礼制解：珊瑚粉环 + 松石青绿外环
      fill = i === 0 ? spec.colors.bands[0] : spec.colors.bands[2];
    } else if (bandCount === 1) {
      fill = spec.colors.bands[2];
    } else {
      fill = spec.colors.bands[i % spec.colors.bands.length];
    }
    const isStippled = bandCount >= 3 && i === 1;
    layers.push({
      index: i + 1,
      kind: isOuter ? "outer" : isStippled ? "dark" : i === 0 ? "inner" : "extra",
      label: spec.ringLabels[i + 1] || `第 ${i + 2} 环`,
      cx,
      cy,
      rInner,
      rOuter,
      width: rOuter - rInner,
      fill,
      lum: hexToLum(fill),
      isStippled,
      isGlare: isOuter && state.outerGlare,
    });
  }

  // 外围细轨道半径（对应 055 原海报外圈双虚线轨，位于最外环外侧 +0.085）
  const orbitR = outerR + 0.082;

  return {
    spec,
    count,
    bandCount,
    coreGap,
    outerR,
    orbitR,
    layers,
  };
}

// 单真源评测：完全从 computeGeometry(state) 产出的真实几何与明度核算四维得分与全部错态
export function evaluate(state) {
  const geo = computeGeometry(state);
  const { layers, count, outerR, orbitR } = geo;
  const core = layers[0];
  const bands = layers.slice(1);
  const outerBand = layers[layers.length - 1];

  // 1. 同心偏轴度（内核圆心与外环圆心之距，占画布半宽百分比）
  const offsetDist = Math.hypot(core.cx - outerBand.cx, core.cy - outerBand.cy);
  const offsetPct = Math.round(offsetDist * 100);
  const corePct = Math.round(core.rOuter * 100);

  // 2. 紧侧有效环宽与环缘挤撞（真实圆-圆距离）
  let minTightClearance = 999;
  for (let i = 0; i < layers.length - 1; i++) {
    const a = layers[i];
    const b = layers[i + 1];
    const d = Math.hypot(b.cx - a.cx, b.cy - a.cy);
    // a 的外缘到 b 的外缘之间在最窄一侧剩多少实体宽度
    const tight = (b.rOuter - a.rOuter) - d;
    if (tight < minTightClearance) minTightClearance = tight;
  }
  const minClearancePct = Math.round(minTightClearance * 100);

  // 3. 环带步距比（最宽环带 / 最窄环带）
  const widths = bands.map((b) => b.width);
  const minW = Math.min(...widths);
  const maxW = Math.max(...widths);
  const bandRatio = widths.length > 1 ? maxW / Math.max(0.001, minW) : 1.0;

  // 4. 明度主次（外环是否喧宾夺主）
  const lumRatio = outerBand.lum / Math.max(0.05, core.lum);
  const glareFault = state.outerGlare || lumRatio >= 0.85;

  // 5. 四象限留白不均与破边裁切（按外环+轨道相对于 [-1, 1] 边界实测）
  // 中心核与外环的视觉重心偏移也会造成四向边距感失衡
  const outerExtent = outerR;
  const orbitExtent = orbitR;
  const clipAmt = Math.max(0, outerExtent - 0.94);
  const clipPct = Math.round(clipAmt * 100);
  const outerPct = Math.round(outerR * 100);

  // 实测内环最窄侧与最宽侧的左右/上下差值，作为四象限不均衡度
  const quadDiffX = Math.abs((outerBand.rOuter - (core.cx + core.rOuter)) - (outerBand.rOuter + (core.cx - core.rOuter)));
  const quadDiffY = Math.abs((outerBand.rOuter - (core.cy + core.rOuter)) - (outerBand.rOuter + (core.cy - core.rOuter)));
  const quadImbalancePct = Math.round(Math.max(quadDiffX, quadDiffY) * 50);

  // ---------- 四维判定（每一维均可双向判错） ----------
  // 维 1：中心 CENTER
  let centerFault = null;
  if (offsetDist > 0.045) {
    centerFault = {
      code: "eccentric",
      badge: `脱轴 ${offsetPct}%`,
      title: `内环与外环错心 ${offsetPct}%，视觉引力滑偏一侧`,
      reason: "同心式构图靠所有环带共用同一圆心来锁住目光。只要内核与内环一脱轴，环带就会一侧挤窄、一侧张开，整张画面立刻滑向倾斜的通道而不是稳固的聚焦。",
      action: "在画布中心区向左下方轻拖内核（或把「同心偏轴」拉回 0%），把四层环带对齐到同一个十字轴心上。",
    };
  } else if (core.rOuter < 0.115) {
    centerFault = {
      code: "tiny-core",
      badge: `核微 ${corePct}%`,
      title: `核心缩到仅 ${corePct}%，被外圈环带彻底吞没`,
      reason: "中心点不能小到像一粒误点的尘埃。核心面积过小时，外围层层色环的视觉体量会把视线截停在半路，核心撑不起全场主位。",
      action: "向外轻拖最内圈暖米核边缘，让核心半径回到 14%–26% 的稳固落眼区。",
    };
  } else if (core.rOuter > 0.305) {
    centerFault = {
      code: "giant-core",
      badge: `巨核 ${corePct}%`,
      title: `核心膨大到 ${corePct}%，外环被挤成贴边细箍`,
      reason: "核心太大时，层层包围的环带失去展开空间，同心结构退化成一张加了细边框的大圆贴纸，递进纵深消失。",
      action: "向内轻推核心边缘，把核心半径收回到 14%–26%，把环带呼吸留出来。",
    };
  }

  // 维 2：包围 ENCLOSURE
  let enclosureFault = null;
  if (glareFault) {
    enclosureFault = {
      code: "outer-glare",
      badge: "外环夺焦",
      title: "最外环高曝发亮，反客为主把眼睛拽向边缘",
      reason: "包围层的作用是托举和护送目光向内走，而不是跟核心抢亮度。现在外环的亮度超过核心，眼睛一进画面就被亮圈套住，反而看不见中心主角。",
      action: "直接单击画布上发亮的最外圈（或关闭左侧「外环高曝」），把它压回哑光松石绿，把最亮的位置还给核心。",
    };
  } else if (minTightClearance < 0.036) {
    enclosureFault = {
      code: "ring-collide",
      badge: `挤撞 ${minClearancePct}%`,
      title: `相邻环带在窄侧被压到仅 ${Math.max(0, minClearancePct)}%，层次粘连窒息`,
      reason: "每层环带都需要清晰可辨的边界与宽度。环缘一撞死，原本由内而外的阶梯就糊成一团，包围感变成压迫感。",
      action: "把脱轴圆心归正，或在画布上外拉受挤的环缘（把步距韵律调向温和递增）。",
    };
  }

  // 维 3：秩序 ORDER
  let orderFault = null;
  if (count >= 6) {
    orderFault = {
      code: "hypnotic",
      badge: `${count} 层眩晕`,
      title: `堆叠到 ${count} 层密集同心环，触发高频靶心眩晕`,
      reason: "同心不是环越多越高级。超过 5 层高对比密环后，人眼会陷入类似欧普艺术的条纹颤动与催眠感，反而分散对核心内容的阅读（经验值：3–5 层最从容）。",
      action: "把「同心层数」收回到 3–5 层，给每层环带留足从容的宽度与层次。",
    };
  } else if (count <= 2) {
    orderFault = {
      code: "single-ring",
      badge: "仅 2 层",
      title: "只剩核心加单道圆环，已经退化成「050 环形构图」",
      reason: "单环围核强调的是「一圈留白保焦点」，而同心式构图的核心魅力在于至少三层以上的递进包围与节奏变化。",
      action: "把「同心层数」调回 3–5 层，恢复层层嵌套的秩序感。",
    };
  } else if (bandRatio > 2.25) {
    orderFault = {
      code: "chaotic-step",
      badge: `乱拍 ${bandRatio.toFixed(1)}×`,
      title: `环带最宽与最窄相差 ${bandRatio.toFixed(1)}×，层层递进的节奏被打断`,
      reason: "海报写着「由内而外，秩序递进」：各层宽度要么近乎均拍，要么沿同一方向温和递变。现在内环过度膨胀、中环被压成细缝，节奏骤然失序。",
      action: "拖动画布上偏宽的粉环内收，或把「步距递进」滑轨拨向 0% 至 +40% 区间。",
    };
  }

  // 维 4：平衡 BALANCE
  let balanceFault = null;
  if (outerExtent > 0.945) {
    balanceFault = {
      code: "clipped",
      badge: `破边 ${Math.max(2, clipPct)}%`,
      title: "最外环越界触边，圆环被画框裁切失去圆满",
      reason: "同心圆一旦四边或单边被画框硬切平，闭合的包围感立刻泄气，画面显得逼仄喘不过气。",
      action: "向内轻拖最外环边缘（或把「外径尺度」收到 72%–90%），让外圈细轨与四向锚点完整呼吸。",
    };
  } else if (outerExtent < 0.56) {
    balanceFault = {
      code: "shrunk",
      badge: `缩孤 ${outerPct}%`,
      title: `外径仅占画幅 ${outerPct}%，整组同心环缩成孤立小靶`,
      reason: "画幅四周空出大片无呼应的黑地时，同心环失去了「以中心统摄全局」的包裹气场，看上去像贴在角落的徽章。",
      action: "向外轻拖最外环边缘，把外径撑到画幅的 72%–90%（经验值），建立统摄全场的包围场。",
    };
  } else if (quadImbalancePct > 12) {
    balanceFault = {
      code: "quad-unbalanced",
      badge: `偏沉 ${quadImbalancePct}%`,
      title: `四象限净距差达 ${quadImbalancePct}%，圆盘一侧偏沉失衡`,
      reason: "055 原海报在上下左右四个正交方位点出薄荷锚点，正是为了校核四向受力均衡。圆心不归位，四向呼吸就永远一边紧、一边松。",
      action: "把内核圆心拖回十字虚线交点，让上下左右四枚薄荷锚点对称落位。",
    };
  }

  const checks = [
    {
      key: "center",
      zh: "中心",
      en: "CENTER",
      ok: !centerFault,
      badge: centerFault ? centerFault.badge : `共轴 ${offsetPct}%`,
      fault: centerFault,
    },
    {
      key: "enclosure",
      zh: "包围",
      en: "ENCLOSURE",
      ok: !enclosureFault,
      badge: enclosureFault ? enclosureFault.badge : "暗环托核",
      fault: enclosureFault,
    },
    {
      key: "order",
      zh: "秩序",
      en: "ORDER",
      ok: !orderFault,
      badge: orderFault ? orderFault.badge : `${count} 层 · ${bandRatio.toFixed(1)}×`,
      fault: orderFault,
    },
    {
      key: "balance",
      zh: "平衡",
      en: "BALANCE",
      ok: !balanceFault,
      badge: balanceFault ? balanceFault.badge : `外径 ${outerPct}%`,
      fault: balanceFault,
    },
  ];

  const passCount = checks.filter((c) => c.ok).length;
  const activeFaults = checks.map((c) => c.fault).filter(Boolean);
  const primary = activeFaults[0] || null;

  // 定性聚势分档（不写假精确百分比！）
  let focusTier = "聚焦瓦解";
  if (passCount === 4) focusTier = "圆满归心";
  else if (passCount === 3) focusTier = "接近稳态";
  else if (passCount === 2) focusTier = "半稳偏散";
  else if (passCount === 1) focusTier = "层次失序";

  let headline, body, nextStep;
  if (passCount === 4) {
    // 区分当前属于哪种合法解气质
    let styleNote = "四层环带严格共轴、明度由内向外阶梯退让，既保住了暖米核心的唯一主权，又让四向锚点稳稳呼应。";
    if (count === 3) {
      styleNote = "三层疏朗同心结构（如天坛圜丘坛）同样完全成立：环幅宽厚、克制庄重，视线进场即直落核心。";
    } else if (state.rhythmBias >= 0.25) {
      styleNote = "这组外扩递进解同样成立：环带宽度如水波由内向外舒展放大，既有中心锁定又有从容呼吸。";
    }
    headline = "4/4 圆满归心：层层包围把视线稳稳送回核心";
    body = styleNote;
    nextStep = "按 Space 释放「回心波」检验逐层聚势，或点下方「多解 / 试错」对比不同层数与反向错态。";
  } else {
    headline = primary.title;
    body = primary.reason;
    nextStep = primary.action;
  }

  return {
    geo,
    passCount,
    total: 4,
    ok: passCount === 4,
    checks,
    primary,
    shortTag: passCount === 4 ? "4/4 · 圆满归心" : `${passCount}/4 · ${primary.badge}`,
    focusTier,
    headline,
    body,
    nextStep,
    metrics: {
      offsetPct,
      corePct,
      outerPct,
      bandRatio: +bandRatio.toFixed(2),
      minClearancePct: Math.max(0, minClearancePct),
      quadImbalancePct,
      layerCount: count,
      orbitClipped: orbitExtent > 1.02,
      glareFault,
    },
  };
}
