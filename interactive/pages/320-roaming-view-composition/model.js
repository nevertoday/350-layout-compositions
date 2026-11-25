// 320 游观式构图 — 单真源几何、节奏与诊断模型
// 所有读数、游观步态、路径弯曲比、步距疏密与诊断结论全部从实绘几何坐标与权重实时计算。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报五景",
    en: "POSTER JOURNEY",
    scenes: {
      arch:   { id: "arch",   role: "entry",      name: "拱门入景", short: "拱门", en: "ARCH GATE",  act: "以强明暗拱门立起入口，把视线请进画内" },
      peak:   { id: "peak",   role: "shift",      name: "山林移步", short: "山林", en: "PEAK TURN",  act: "借山峰与粉树转折，从封闭门洞切换到开阔山野" },
      tower:  { id: "tower",  role: "pause",      name: "双拱楼阁", short: "楼阁", en: "PAVILION",   act: "细节最密的停留主节点，让视线缓下细读" },
      bridge: { id: "bridge", role: "transition", name: "弧桥过渡", short: "弧桥", en: "ARCH BRIDGE", act: "借桥弧与水面换拍，承接中景推向终点" },
      beacon: { id: "beacon", role: "arrival",    name: "灯塔抵达", short: "灯塔", en: "LIGHTHOUSE", act: "高处灯标收束全径，光束回望留下余韵" },
    },
  },
  bianhe: {
    id: "bianhe",
    label: "汴河长卷",
    en: "SONG HANDSCROLL",
    scenes: {
      arch:   { id: "arch",   role: "entry",      name: "郊外柳岸", short: "柳岸", en: "WILLOW BANK", act: "疏林薄雾与低桥轻启卷首，慢慢代入旅途" },
      peak:   { id: "peak",   role: "shift",      name: "汴河运舟", short: "运舟", en: "RIVER BOAT",  act: "河道弯折引出漕船风帆，画面节奏渐紧" },
      tower:  { id: "tower",  role: "pause",      name: "虹桥盛景", short: "虹桥", en: "RAINBOW BRIDGE", act: "全卷最密视觉高潮，视线自然放慢驻足" },
      bridge: { id: "bridge", role: "transition", name: "城门街市", short: "城门", en: "CITY GATE",   act: "跨过城楼由喧闹转入街巷纵深，舒缓节奏" },
      beacon: { id: "beacon", role: "arrival",    name: "远山烟水", short: "烟水", en: "DISTANT MIST", act: "余景放淡留白，像合卷前的一声长呼" },
    },
  },
  garden: {
    id: "garden",
    label: "江南园林",
    en: "CLASSICAL GARDEN",
    scenes: {
      arch:   { id: "arch",   role: "entry",      name: "月洞门",   short: "月洞", en: "MOON GATE",   act: "圆框截出第一眼梅竹，先藏后露勾起好奇" },
      peak:   { id: "peak",   role: "shift",      name: "叠石竹径", short: "竹径", en: "BAMBOO PATH", act: "太湖石障景转弯，脚下换向眼前换景" },
      tower:  { id: "tower",  role: "pause",      name: "临水轩亭", short: "水轩", en: "WATER PAVILION", act: "轩窗开阔临池，是全园最宜坐下久看的停顿点" },
      bridge: { id: "bridge", role: "transition", name: "九曲石桥", short: "曲桥", en: "ZIGZAG BRIDGE", act: "折步过池放慢脚步，每转一折水面角度便变" },
      beacon: { id: "beacon", role: "arrival",    name: "借景远塔", short: "远塔", en: "BORROWED PAGODA", act: "越过粉墙借来园外塔影，小园生出无尽余韵" },
    },
  },
};

export const POSTER_ACTS = [
  { num: "01", zh: "进入", sub: "引发好奇", body: "开场建立入口 用强对比吸引视线", en: "ENTRY ATTRACTION" },
  { num: "02", zh: "移步", sub: "转换视角", body: "视线转向新焦点 引导至下一场景", en: "SHIFT GUIDANCE" },
  { num: "03", zh: "停留", sub: "聚焦重点", body: "在视觉节点停留 传递关键信息", en: "PAUSE FOCUS" },
  { num: "04", zh: "过渡", sub: "节奏转换", body: "通过路径变化 调节视觉节奏", en: "TRANSITION RHYTHM" },
  { num: "05", zh: "抵达", sub: "余韵延续", body: "到达终点形成回望 留下完整印象", en: "ARRIVAL RESONANCE" },
];

export const WEIGHT_LEVELS = [
  { val: 0.78, label: "轻掠", tag: "轻" },
  { val: 1.0,  label: "次停", tag: "中" },
  { val: 1.46, label: "主停", tag: "主" },
];

// 开场默认：刻意停在 0/4 待编景错态
export function createBrokenState(theme = "poster") {
  return {
    theme,
    order: ["beacon", "peak", "arch", "bridge", "tower"], // 高潮灯塔错置第1站、拱门挤到中间
    monotone: false,
    pathMode: "straight",      // 1.00x 死直线一眼望穿
    spacingMode: "even",       // 机械等距 CV=0
    weights: [1.0, 1.0, 1.0, 1.0, 1.0], // 五站平权 1.0x
    revealMode: "exposed",     // 0% 遮蔽全敞 + 终点急刹
    roamT: 0.24,               // 视窗初落 24%
    selectedSlot: -1,
    playing: false,
  };
}

// 正当解 1：原海报 S 径经典解
export function createPosterSolution(theme = "poster") {
  return {
    theme,
    order: ["arch", "peak", "tower", "bridge", "beacon"],
    monotone: false,
    pathMode: "scurve",
    spacingMode: "balanced",
    weights: [1.0, 0.78, 1.46, 0.78, 1.46],
    revealMode: "veiledLookback",
    roamT: 0.54,
    selectedSlot: -1,
    playing: false,
  };
}

// 正当解 2：亭阁压轴 · 之字盘升解（验证存在多组合法解）
export function createZigzagSolution(theme = "poster") {
  return {
    theme,
    order: ["arch", "bridge", "peak", "beacon", "tower"],
    monotone: false,
    pathMode: "zigzag",
    spacingMode: "crescendo",
    weights: [1.0, 0.78, 1.0, 0.78, 1.46],
    revealMode: "mistResonance",
    roamT: 0.68,
    selectedSlot: -1,
    playing: false,
  };
}

// 间距模式定义 5 个景点沿路径的弧长比例（0..1）
const SPACING_FRACS = {
  even:      [0.14, 0.32, 0.50, 0.68, 0.86], // 间隔全为 0.18 -> CV = 0.00
  cluster:   [0.12, 0.21, 0.30, 0.68, 0.88], // 前三站挤在 30% 内撞景，后段空洞
  balanced:  [0.13, 0.30, 0.54, 0.71, 0.89], // 疏密错落，中段主停空间宽松
  crescendo: [0.11, 0.34, 0.55, 0.73, 0.87], // 前疏后渐密，收束推向终景高潮
};

export const REVEAL_PROFILES = {
  exposed:        { veilPct: 0,  ending: "abrupt",   label: "全敞急刹", short: "0% 敞露" },
  blocked:        { veilPct: 86, ending: "blocked",  label: "过度闷堵", short: "86% 闷堵" },
  veiledLookback: { veilPct: 44, ending: "lookback", label: "适度藏露·回望", short: "44% 藏露" },
  mistResonance:  { veilPct: 36, ending: "mist",     label: "清雅留白·余韵", short: "36% 留白" },
};

// 生成真实路径折线（归一化坐标 0..1 × 0..1）
// orientation: "horizontal" (桌面手卷，左下起点 -> 右上抵达) | "vertical" (竖屏原海报势，左下起点 -> 右上盘升)
function samplePathPoint(pathMode, orientation, u) {
  if (orientation === "vertical") {
    // 贴合 320 原海报竖向 S 盘升：左下 (0.14, 0.88) -> 右上 (0.86, 0.14)
    const xBase = 0.14 + 0.72 * u;
    const yBase = 0.88 - 0.74 * u;
    if (pathMode === "straight") {
      return { x: xBase, y: yBase };
    }
    if (pathMode === "broken") {
      const wave = Math.sin(u * Math.PI * 2.2) * 0.13;
      const slip = u > 0.52 ? 0.06 : 0;
      return { x: clamp(xBase + wave + slip, 0.08, 0.92), y: clamp(yBase - slip * 0.6, 0.10, 0.90) };
    }
    if (pathMode === "zigzag") {
      // 之字盘升：四折石阶势
      const segs = [
        [0.14, 0.88], [0.74, 0.76], [0.22, 0.56], [0.78, 0.36], [0.28, 0.20], [0.86, 0.14],
      ];
      return polyLerp(segs, u);
    }
    // scurve: 原海报经典优雅 S 蜿蜒
    const sx = 0.14 + 0.72 * u + Math.sin(u * Math.PI * 3.15 - 0.35) * 0.23 * Math.sin(u * Math.PI);
    const sy = 0.88 - 0.74 * u + Math.sin(u * Math.PI * 2.0) * 0.04;
    return { x: clamp(sx, 0.11, 0.90), y: clamp(sy, 0.12, 0.90) };
  }

  // 横向手卷模式：左下 (0.065, 0.76) -> 右上 (0.935, 0.24)
  const xBase = 0.065 + 0.87 * u;
  const yBase = 0.76 - 0.52 * u;
  if (pathMode === "straight") {
    return { x: xBase, y: yBase };
  }
  if (pathMode === "broken") {
    const wave = Math.sin(u * Math.PI * 2.2) * 0.15;
    const drop = u > 0.54 ? -0.09 : 0.04;
    return { x: xBase, y: clamp(yBase + wave + drop, 0.16, 0.84) };
  }
  if (pathMode === "zigzag") {
    // 之字折廊：五段刚柔折线
    const segs = [
      [0.065, 0.78], [0.22, 0.24], [0.41, 0.78], [0.60, 0.22], [0.79, 0.74], [0.935, 0.22],
    ];
    return polyLerp(segs, u);
  }
  // scurve: 复刻 320 原海报圆润双 S 丝带，横向展卷舒展推进
  const amp = 0.30 * (0.48 + 0.52 * Math.sin(u * Math.PI));
  const sy = 0.54 - 0.16 * (u - 0.5) + Math.sin(u * Math.PI * 3.25 + 0.45) * amp;
  const sx = 0.065 + 0.87 * u + Math.sin(u * Math.PI * 3.25) * 0.022;
  return { x: clamp(sx, 0.06, 0.94), y: clamp(sy, 0.14, 0.84) };
}

function polyLerp(pts, u) {
  const n = pts.length - 1;
  const scaled = clamp(u, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(scaled));
  const f = scaled - i;
  // 轻微圆角折过渡，保留之字筋骨而不僵死
  const s = f * f * (3 - 2 * f);
  return {
    x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * (0.72 * f + 0.28 * s),
    y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (0.72 * f + 0.28 * s),
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算实绘路径、5 站点真实坐标与全部单真源量化指标
export function computeLayout(state, orientation = "horizontal", aspect = 3.2) {
  // 在统一手卷比例尺（横向基准 1.65，竖向基准 1.0）下核算路径弧长与曲折比，
  // 保证 390 竖屏、1440 与 2560 宽屏下同一曲径的曲折比读数稳定一致、不因外框拉宽失真
  const metricAspect = orientation === "vertical" ? 1.0 : 1.65;
  const N = 84;
  const pathPts = [];
  const cumLen = [0];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = samplePathPoint(state.pathMode, orientation, u);
    pathPts.push({ ...p, u });
    if (i > 0) {
      const prev = pathPts[i - 1];
      const dx = (p.x - prev.x) * metricAspect;
      const dy = p.y - prev.y;
      cumLen.push(cumLen[i - 1] + Math.hypot(dx, dy));
    }
  }
  const totalArc = cumLen[N] || 1;
  const chord = Math.hypot((pathPts[N].x - pathPts[0].x) * metricAspect, pathPts[N].y - pathPts[0].y) || 1;
  const bendRatio = totalArc / chord;

  // 按弧长反查路径上任意比例 s ∈ [0..1] 的精确点与切向
  function pointAtArcFrac(s) {
    const target = clamp(s, 0, 1) * totalArc;
    let lo = 0;
    let hi = N;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumLen[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const idx = Math.max(1, lo);
    const segLen = cumLen[idx] - cumLen[idx - 1] || 1e-6;
    const f = clamp((target - cumLen[idx - 1]) / segLen, 0, 1);
    const a = pathPts[idx - 1];
    const b = pathPts[idx];
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    const angle = Math.atan2(b.y - a.y, (b.x - a.x) * aspect);
    return { x, y, angle, s };
  }

  const themeObj = THEMES[state.theme] || THEMES.poster;
  const fracs = SPACING_FRACS[state.spacingMode] || SPACING_FRACS.balanced;
  const stations = fracs.map((s, idx) => {
    const sceneKey = state.monotone ? "peak" : state.order[idx];
    const scene = themeObj.scenes[sceneKey] || themeObj.scenes.arch;
    const pt = pointAtArcFrac(s);
    const weight = state.weights[idx] ?? 1.0;
    // 景致放在丝带上下交替的舒展位置，避免被路径正中压住
    let offsetY = 0;
    let offsetX = 0;
    if (orientation === "vertical") {
      offsetX = idx % 2 === 0 ? -0.14 : 0.14;
      offsetY = -0.02;
    } else {
      // 横卷中景致自然坐落在丝带上方或紧贴弯肚
      offsetY = pt.y > 0.54 ? -0.12 : 0.08;
      if (state.pathMode === "straight") offsetY = -0.09;
    }
    const cx = clamp(pt.x + offsetX, 0.11, 0.89);
    const cy = clamp(pt.y + offsetY, 0.17, 0.81);
    return {
      slot: idx,
      actNum: POSTER_ACTS[idx].num,
      actZh: POSTER_ACTS[idx].zh,
      actSub: POSTER_ACTS[idx].sub,
      sceneKey,
      scene,
      s,
      pathX: pt.x,
      pathY: pt.y,
      x: cx,
      y: cy,
      weight,
      weightLabel: weight >= 1.3 ? "主停" : weight <= 0.85 ? "轻掠" : "次停",
      detached: state.pathMode === "broken" && idx === 2,
    };
  });

  // 里程碑圆点（4 枚落在 5 站之间的丝带上）
  const milestones = [0, 1, 2, 3].map((i) => {
    const midS = (fracs[i] + fracs[i + 1]) * 0.5;
    return { ...pointAtArcFrac(midS), hidden: state.pathMode === "broken" && midS > 0.42 && midS < 0.68 };
  });

  // 从实绘站距算步距变异系数 CV 与前半程扎堆度
  const gaps = [0, 1, 2, 3].map((i) => stations[i + 1].s - stations[i].s);
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((a, g) => a + (g - meanGap) ** 2, 0) / gaps.length;
  const paceCV = Math.sqrt(variance) / (meanGap || 1);
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const front3Span = stations[2].s - stations[0].s; // 前三站所占行程跨度

  // 停留权重跨比与主停数量
  const maxW = Math.max(...state.weights);
  const minW = Math.min(...state.weights);
  const dwellRatio = maxW / (minW || 1);
  const majorCount = state.weights.filter((w) => w >= 1.3).length;

  // 景致多样性
  const uniqueScenes = new Set(stations.map((st) => st.sceneKey)).size;

  // 遮蔽与余韵
  const revealProfile = REVEAL_PROFILES[state.revealMode] || REVEAL_PROFILES.exposed;
  const gapSpan = state.pathMode === "broken" ? [0.42, 0.68] : null;
  const gapPct = gapSpan ? Math.round((gapSpan[1] - gapSpan[0]) * 100) : 0;

  return {
    orientation,
    aspect,
    pathPts,
    totalArc,
    bendRatio,
    pointAtArcFrac,
    stations,
    milestones,
    gaps,
    paceCV,
    minGap,
    maxGap,
    front3Span,
    dwellRatio,
    majorCount,
    uniqueScenes,
    veilPct: revealProfile.veilPct,
    ending: revealProfile.ending,
    revealLabel: revealProfile.label,
    gapSpan,
    gapPct,
  };
}

// 按当前视窗进度 roamT 采样游观步态与眼下所见
export function sampleGaze(layout, roamT) {
  const t = clamp(roamT, 0, 1);
  const pt = layout.pointAtArcFrac(t);
  let nearest = layout.stations[0];
  let bestD = Infinity;
  for (const st of layout.stations) {
    const d = Math.abs(st.s - t);
    if (d < bestD) {
      bestD = d;
      nearest = st;
    }
  }
  const inGap = !!(layout.gapSpan && t >= layout.gapSpan[0] && t <= layout.gapSpan[1]);
  const nearStation = bestD < 0.085;

  let paceTier = "移步推进";
  let feeling = "";
  if (inGap) {
    paceTier = "断路迷失";
    feeling = "路径在此断裂，观者失去引导，眼神开始左右乱飘找下一站。";
  } else if (layout.veilPct >= 80) {
    paceTier = "雾墙受阻";
    feeling = "四周遮蔽过死，连前方弯道引子都被堵住，推着看也像摸黑。";
  } else if (layout.bendRatio < 1.06 && layout.veilPct < 10) {
    paceTier = "直穿失趣";
    feeling = `视线停在「${nearest.scene.name}」，但整条直道已把后续全亮光，几乎没有悬念。`;
  } else if (nearStation && nearest.weight >= 1.3) {
    paceTier = "驻足细观";
    feeling = `抵达主停节点「${nearest.scene.name}」：${nearest.scene.act}。`;
  } else if (nearStation) {
    paceTier = nearest.weight <= 0.85 ? "轻掠过渡" : "短停换景";
    feeling = `经过「${nearest.scene.name}」：${nearest.scene.act}。`;
  } else if (t < 0.09) {
    paceTier = "卷首入画";
    feeling = "从「起点 START」起眼，第一眼对比决定观者愿不愿意继续往里走。";
  } else if (t > 0.91) {
    paceTier = layout.ending === "abrupt" ? "画外急刹" : "终景回望";
    feeling =
      layout.ending === "abrupt"
        ? "刚到末端便被硬切出画外，缺乏回望整段旅途的余韵。"
        : "站上终景回头望见来路五幕，整幅画面在记忆里连成完整一程。";
  } else {
    paceTier = "曲径移步";
    feeling = `正沿路径移步前往「${nearest.scene.name}」，前景藏露吊起下一幕期待。`;
  }

  return { t, ...pt, nearest, nearStation, inGap, paceTier, feeling };
}

// 单真源四维诊断：检出全部 8 类游观失误，并接受多种合法解
export function diagnose(state, layout) {
  const firstKey = layout.stations[0].sceneKey;
  const lastKey = layout.stations[4].sceneKey;
  const climaxAtStart = !state.monotone && firstKey === "beacon";
  const archPushedEnd = !state.monotone && lastKey === "arch" && firstKey !== "arch";
  const isMonotone = layout.uniqueScenes <= 2;

  const sequenceOk = !isMonotone && !climaxAtStart && !archPushedEnd;
  const pathBroken = !!layout.gapSpan;
  const pathStraight = !pathBroken && layout.bendRatio < 1.15;
  const pathOk = !pathBroken && !pathStraight && layout.bendRatio <= 2.05;

  const isClustered = layout.front3Span < 0.22 || layout.minGap < 0.105 || layout.maxGap > 0.34;
  const isFlatEqual = layout.dwellRatio < 1.30 || layout.paceCV < 0.10 || layout.majorCount === 0;
  const isOverHeavy = layout.majorCount >= 4;
  const rhythmOk = !isClustered && !isFlatEqual && !isOverHeavy;

  const isExposed = layout.veilPct < 20 || layout.ending === "abrupt";
  const isBlocked = layout.veilPct > 72 || layout.ending === "blocked";
  const revealOk = !isExposed && !isBlocked;

  const score = [sequenceOk, pathOk, rhythmOk, revealOk].filter(Boolean).length;

  // 收集全部活跃错态，按教学优先级呈现首条主症
  const flaws = [];
  if (isMonotone) {
    flaws.push({
      code: "monotone",
      badge: "错态 · 景致雷同",
      title: `五站只剩 ${layout.uniqueScenes} 种景致，移步却未换景`,
      why: "游观的乐趣来自每走一步都能遇见新信息。五站反复出现同一山形母题，视线往前挪却得不到新鲜回报，很快就会放弃继续看下去。",
      action: "把「起承序列」切回「原海报序」或「亭阁压轴」，让五幕景致各有辨识。",
    });
  } else if (climaxAtStart) {
    flaws.push({
      code: "climaxFirst",
      badge: "错态 · 高潮泄底",
      title: `把最强的「${layout.stations[0].scene.name}」塞在开头第 1 站`,
      why: "入口的任务是设悬念、请人进门，而不是一上来就亮出整幅画的最强底牌。终景地标提前剧透后，后面四站越走越泄气，失去层层推进的期待。",
      action: "直接点击画布上的第 1 站与第 3 站对调站序，或在下方切到「原海报序 / 亭阁压轴」。",
    });
  } else if (archPushedEnd) {
    flaws.push({
      code: "reversedGate",
      badge: "错态 · 入口倒置",
      title: `入口景「${layout.stations[4].scene.name}」被挪到了全卷末尾`,
      why: "拱门与门洞天生承担「请人入画」的开场动作；把它放到终点会让人觉得旅程还没收尾，反而又要推开一扇新门。",
      action: "点画布把入口景换回前段，让高处地标或水阁承担收束回望。",
    });
  }

  if (pathBroken) {
    flaws.push({
      code: "broken",
      badge: "错态 · 断脉迷途",
      title: `中段路径断裂 ${layout.gapPct}%，观者半路失去引导`,
      why: "游观不是散落一地的孤立插画。中段一旦断路、节点脱轨，视线在两景之间找不到承接线索，连贯的观看体验当场腰斩。",
      action: "在「路径引导」里切到「曲径 S 游」或「之字盘升」，接通五站主脉。",
    });
  } else if (pathStraight) {
    flaws.push({
      code: "straight",
      badge: "错态 · 死直一眼穿",
      title: `路径曲折比仅 ${layout.bendRatio.toFixed(2)}×，从起点一眼穿到底`,
      why: "一条笔直的通天大道会把五处场景同时摊平在视线正前方。没有弯折和视角转换，观者两秒扫完就转身离开，根本不会「移步」细看。",
      action: "把「路径引导」切为「曲径 S 游」或「之字盘升」（经验曲折比 1.25×–1.70×）。",
    });
  }

  if (isClustered) {
    flaws.push({
      code: "clustered",
      badge: "错态 · 扎堆撞景",
      title: `前三站挤在 ${Math.round(layout.front3Span * 100)}% 行程里，后段骤然空洞`,
      why: "前密后空会让观者一进门就被三组景致同时抢戏、喘不过气，走过中段后又是一大片没着落的空白，节奏彻底失衡。",
      action: "把「节奏停留」切到「疏密主停」或「渐密收高潮」，拉开前半程呼吸感。",
    });
  } else if (isOverHeavy) {
    flaws.push({
      code: "overHeavy",
      badge: "错态 · 处处重笔",
      title: `${layout.majorCount} 处景致同时标成「主停」，等于没有重点`,
      why: "如果每一站都要观者停下来细看，大脑很快就会疲劳麻木。好游观总要有一两处主停锚点，其余节点轻掠过渡。",
      action: "点选画布中多余的重景调回「轻掠 / 次停」，只留 1–2 处核心停留。",
    });
  } else if (isFlatEqual) {
    flaws.push({
      code: "flatEqual",
      badge: "错态 · 平权等距",
      title: `五站体量 ${layout.dwellRatio.toFixed(1)}× 均平且间距齐整（CV ${layout.paceCV.toFixed(2)}）`,
      why: "五处景致一样大、隔得一样远，视窗滑过去像坐快车数电线杆——没有「03 停留」的重点驻足，也没有快慢呼吸，看完记不住重点在哪。",
      action: "点画布把中段或终景设为「主停」，并把「节奏停留」调出疏密变化。",
    });
  }

  if (isBlocked) {
    flaws.push({
      code: "blocked",
      badge: "错态 · 过度闷堵",
      title: `遮蔽拉高到 ${layout.veilPct}%，雾墙把下站引子也堵死了`,
      why: "藏露讲究「遮一半、露一角」。把未访区彻底封死后，视线既看不出路径走向，也感受不到前方的呼应，从含蓄变成了摸黑。",
      action: "把「藏露余韵」调回「适度藏露·回望」或「清雅留白·余韵」（经验遮蔽 30%–55%）。",
    });
  } else if (isExposed) {
    flaws.push({
      code: "exposed",
      badge: "错态 · 全敞急刹",
      title: "画面零遮蔽一览无余，终点又背向画外急刹",
      why: "毫无藏露就没有「转角遇见新景」的惊喜；终点如果直接滑出画框、不回望前路，整段游观会像被突然截断的句子，留不下余韵。",
      action: "把「藏露余韵」切到「适度藏露·回望」或「清雅留白·余韵」，再横拖视窗体验。",
    });
  }

  let primary;
  if (score === 4) {
    const styleName = state.pathMode === "zigzag" ? "之字盘升游观解" : "曲径 S 游观解";
    primary = {
      code: "ok",
      badge: `已成境 · ${styleName} (4/4)`,
      title: "五幕步移景异，视线在走与停之间连成完整旅程",
      why: `入口有序不泄底、路径曲折比 ${layout.bendRatio.toFixed(2)}×、${layout.majorCount} 处主停拉开 ${layout.dwellRatio.toFixed(2)}× 体量跨比、遮蔽 ${layout.veilPct}%（示意）恰到好处——现在拖动视窗从起点游到终点，感受快慢呼吸与终景回望。`,
      action: "继续横拖画布视窗或点「自动游走」亲历全程；也可以试试另一种合法路径或故意制造错态对比。",
    };
  } else {
    primary = flaws[0];
  }

  // 直接映射原海报底部的三枚核心要点实时状态
  const corePillars = [
    {
      id: "shift",
      zh: "移步换景",
      sub: "场景更替，保持新鲜感",
      ok: sequenceOk && revealOk,
      status: !sequenceOk ? (isMonotone ? "景致雷同" : "站序倒置") : !revealOk ? (isBlocked ? "遮蔽闷堵" : "零藏露") : "换景成趣",
    },
    {
      id: "path",
      zh: "路径引导",
      sub: "清晰路径，控制视线流向",
      ok: pathOk,
      status: pathBroken ? `断脉 ${layout.gapPct}%` : pathStraight ? `直穿 ${layout.bendRatio.toFixed(2)}×` : `曲径 ${layout.bendRatio.toFixed(2)}×`,
    },
    {
      id: "rhythm",
      zh: "节奏转换",
      sub: "快慢有序，丰富观看体验",
      ok: rhythmOk,
      status: isClustered ? "扎堆失衡" : isOverHeavy ? "处处重笔" : isFlatEqual ? `平权 ${layout.dwellRatio.toFixed(1)}×` : `疏密 CV ${layout.paceCV.toFixed(2)}`,
    },
  ];

  return {
    score,
    ok: score === 4,
    dims: { sequenceOk, pathOk, rhythmOk, revealOk },
    flaws,
    primary,
    corePillars,
  };
}
