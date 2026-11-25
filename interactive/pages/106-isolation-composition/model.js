// 106 隔离构图 · 单一几何真源（model.js）
// 所有画布渲染、清场排斥位置、净距、留白占比与五类错态诊断全部由此模块统一算出。
// 坐标系按画布高度归一化：y ∈ [0, 1]，x ∈ [0, aspect]，圆永远保持正圆。

export const SCALES = {
  xs: { id: "xs", label: "8% 极微", diameter: 0.082 },
  sm: { id: "sm", label: "18% 轻盈", diameter: 0.185 },
  md: { id: "md", label: "26% 稳重", diameter: 0.255 },
  xl: { id: "xl", label: "46% 巨幅", diameter: 0.455 },
};

// 经验参考阈值（界面和诊断中均明确标注为经验参考）
export const RULES = {
  minGapD: 1.15,        // 最近净距 ≥ 1.15 倍主体直径
  maxClutter: 3,        // 场内余噪 ≤ 3 件（超过会压迫边框）
  emptyMin: 78,         // 核心视野留白经验下限 %
  emptyMax: 96.8,       // 核心视野留白经验上限 %
  spanMin: 13,          // 主体占高比下限 %
  spanMax: 34,          // 主体占高比上限 %
  borderSafe: 0.042,    // 贴边压框判定阈值
};

// 13 件初始场内元素：2 枚同色朱赤抢戏体 + 11 件灰调几何杂物
// angle 决定排斥方向，baseDist 为未推开时的初始径向距，spreadX 控制宽画布下的横向自然展开
export const INITIAL_ITEMS = [
  // 2 枚同色抢戏干扰体（验证冯·雷斯托夫孤立效应：多焦互抢时孤立瓦解）
  { id: "r1", kind: "circle", rival: true, label: "抢戏红点 A", angle: -0.52, baseDist: 0.25, radius: 0.052, tone: "#E94B1A", spreadX: 1.08 },
  { id: "r2", kind: "ring", rival: true, label: "抢戏红环 B", angle: 2.52, baseDist: 0.27, radius: 0.048, tone: "#E94B1A", spreadX: 1.1 },

  // 11 件灰调杂物（开场紧贴主体形成视觉拥挤，各角度均匀错开确保触控易点）
  { id: "c1", kind: "rect", rival: false, label: "灰块", angle: -2.42, baseDist: 0.24, radius: 0.044, w: 0.084, h: 0.06, rot: 0.12, tone: "#9BA5AE", spreadX: 1.05 },
  { id: "c2", kind: "pill", rival: false, label: "标签条", angle: -1.62, baseDist: 0.24, radius: 0.04, w: 0.112, h: 0.04, rot: 0, tone: "#8B96A0", spreadX: 1.0 },
  { id: "c3", kind: "circle", rival: false, label: "灰圆", angle: -1.04, baseDist: 0.24, radius: 0.04, tone: "#A8B2BC", spreadX: 1.04 },
  { id: "c4", kind: "bar", rival: false, label: "细柱", angle: 0.14, baseDist: 0.25, radius: 0.04, w: 0.034, h: 0.106, rot: 0, tone: "#828E98", spreadX: 1.18 },
  { id: "c5", kind: "frame", rival: false, label: "线框", angle: 0.84, baseDist: 0.25, radius: 0.046, w: 0.09, h: 0.066, rot: -0.08, tone: "#7C8791", spreadX: 1.12 },
  { id: "c6", kind: "pill", rival: false, label: "底条", angle: 1.44, baseDist: 0.24, radius: 0.038, w: 0.116, h: 0.036, rot: 0, tone: "#97A1AB", spreadX: 1.0 },
  { id: "c7", kind: "rect", rival: false, label: "方片", angle: 2.04, baseDist: 0.25, radius: 0.044, w: 0.074, h: 0.074, rot: 0.18, tone: "#A3ADB7", spreadX: 1.08 },
  { id: "c8", kind: "cross", rival: false, label: "十字记号", angle: 3.04, baseDist: 0.25, radius: 0.04, tone: "#7A8690", spreadX: 1.16 },
  { id: "c9", kind: "rect", rival: false, label: "远块", angle: -2.80, baseDist: 0.35, radius: 0.042, w: 0.092, h: 0.054, rot: -0.05, tone: "#B0BAC3", spreadX: 1.42 },
  { id: "c10", kind: "circle", rival: false, label: "远圆", angle: 0.48, baseDist: 0.36, radius: 0.04, tone: "#AAB4BE", spreadX: 1.45 },
  { id: "c11", kind: "bar", rival: false, label: "远条", angle: -0.22, baseDist: 0.37, radius: 0.038, w: 0.102, h: 0.032, rot: 0, tone: "#909BA6", spreadX: 1.48 },
];

export function createInitialState() {
  return {
    clearance: 0.24,       // 0..1 清场半径游标：开场落在拥挤区，同时左右均有充足可拖行程
    scaleId: "xl",         // 开场主体撑满 46%，故意破坏留白比例
    showPosterRef: false,  // 是否叠看 106 原海报实测圆位与比例
    removed: new Set(),    // 已被用户清出展墙的元素 id
    seedOffset: 0,         // 随机换一局时的角度偏移
  };
}

export function subjectRadius(state) {
  return SCALES[state.scaleId].diameter / 2;
}

export function subjectCenter(aspect) {
  return { x: aspect * 0.5, y: 0.475 };
}

// 计算当前状态下每个活跃元素的真实几何坐标、净距与贴边状态
export function computeLayout(state, aspect = 2.2) {
  const safeAspect = Math.max(0.75, aspect);
  const center = subjectCenter(safeAspect);
  const sD = SCALES[state.scaleId].diameter;
  const sR = sD / 2;

  // 清场圈半径（画布高度单位）：clearance 0 -> 贴紧主体，1 -> 推至外围
  const moatGapNorm = 0.015 + state.clearance * 0.345;
  const moatR = sR + moatGapNorm;

  const padX = 0.042;
  const padY = 0.052;
  const maxXScale = safeAspect > 1.25 ? Math.min(1.65, 1 + (safeAspect - 1.2) * 0.36) : 0.94;

  const items = INITIAL_ITEMS.map((spec) => {
    const active = !state.removed.has(spec.id);
    const angle = spec.angle + state.seedOffset;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);

    // 原始落点（按画布宽适度展开外围元素，中心附近仍保持真实欧氏距离）
    const sx = 1 + (spec.spreadX - 1) * Math.max(0, maxXScale - 1) * 1.45;
    let dx = ux * spec.baseDist * sx;
    let dy = uy * spec.baseDist;
    const rawDist = Math.hypot(dx, dy) || 0.001;

    // 径向物理排斥：凡是落入清场圈（主体 + 净距 + 自身半径）内的元素，沿径向推开
    const requiredCenterDist = moatR + spec.radius + 0.008;
    let pushed = false;
    if (rawDist < requiredCenterDist) {
      const ratio = requiredCenterDist / rawDist;
      dx *= ratio;
      dy *= ratio;
      pushed = true;
    }

    // 约束在展墙边界内，观察推过头时的「外缘挤框」现象
    const minX = padX + spec.radius;
    const maxX = safeAspect - padX - spec.radius;
    const minY = padY + spec.radius;
    const maxY = 1 - padY - spec.radius;

    let x = center.x + dx;
    let y = center.y + dy;
    let clamped = false;
    if (x < minX) { x = minX; clamped = true; }
    if (x > maxX) { x = maxX; clamped = true; }
    if (y < minY) { y = minY; clamped = true; }
    if (y > maxY) { y = maxY; clamped = true; }

    const centerDist = Math.hypot(x - center.x, y - center.y);
    const edgeGap = Math.max(0, centerDist - sR - spec.radius);
    const gapD = edgeGap / sD;
    const crowding = active && gapD < RULES.minGapD;

    const wallDist = Math.min(x - spec.radius, safeAspect - x - spec.radius, y - spec.radius, 1 - y - spec.radius);
    const borderJammed = active && clamped && wallDist <= RULES.borderSafe + 0.012;

    return {
      ...spec,
      active,
      x,
      y,
      centerDist,
      edgeGap,
      gapD,
      crowding,
      pushed,
      clamped,
      borderJammed,
    };
  });

  const activeItems = items.filter((it) => it.active);
  const activeRivals = activeItems.filter((it) => it.rival);
  const activeClutter = activeItems.filter((it) => !it.rival);
  const crowdingItems = activeItems.filter((it) => it.crowding);
  const borderJammedItems = activeItems.filter((it) => it.borderJammed);

  // 最近净距（单位：主体直径倍数 D）。若场内已清空，则按主体外缘至最近展墙边界算
  const frameEdgeGap = Math.min(
    center.y - sR,
    1 - center.y - sR,
    center.x - sR,
    safeAspect - center.x - sR
  );
  const minEdgeGap = activeItems.length
    ? Math.min(...activeItems.map((it) => it.edgeGap))
    : Math.max(0, frameEdgeGap);
  const minGapD = minEdgeGap / sD;

  // 核心视野（1.0 × 1.0 居中方形视域）有效留白率：跨所有宽高比保持一致真源
  const sqLeft = center.x - 0.5;
  const sqRight = center.x + 0.5;
  const subjectArea = Math.PI * sR * sR;
  let extraArea = 0;
  for (const it of activeItems) {
    const itemArea = it.w && it.h ? it.w * it.h : Math.PI * it.radius * it.radius;
    // 在核心视域内的计全额，在左右远翼的按 0.35 计入视觉余噪占位
    const inCore = it.x + it.radius > sqLeft && it.x - it.radius < sqRight;
    extraArea += itemArea * (inCore ? 1.55 : 0.38);
  }
  const occupiedPct = Math.min(92, (subjectArea + extraArea) * 100);
  const emptyPct = Math.max(8, +(100 - occupiedPct).toFixed(1));
  const spanPct = Math.round(sD * 100);

  // 四项隔离体检条件（与原海报六语与实测几何严格对应）
  const checks = {
    singular: activeRivals.length === 0,
    clearMoat: crowdingItems.length === 0 && activeClutter.length <= RULES.maxClutter && borderJammedItems.length === 0,
    whitespace: emptyPct >= RULES.emptyMin && emptyPct <= RULES.emptyMax,
    scaleOk: spanPct >= RULES.spanMin && spanPct <= RULES.spanMax,
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 六档主诊断（五类明确错态 + 一类成立态），所有文案直接引用本帧实算数值
  let status = "pass";
  let tier = "纯粹聚焦";
  let badge = `孤立成立 · 4/4`;
  let headline = `唯一朱赤独立浮起，净距 ${minGapD.toFixed(2)} D、核心留白 ${Math.round(emptyPct)}%`;
  let detail = `周围不再有同色争抢或贴身杂物，大面积冷瓷灰白墙把视觉重量全部集中到中心朱赤圆上——这正是 106 原海报「一眼即中」的结构。`;

  if (spanPct < RULES.spanMin) {
    status = "tiny";
    tier = "主体溺空";
    badge = `错态 · 主体溺空 · ${passCount}/4`;
    headline = `主体只占画高 ${spanPct}%（经验参考 ${RULES.spanMin}%–${RULES.spanMax}%），大片留白反而吞掉了它`;
    detail = `留白是为主体服务的放大镜，不是把主体缩成尘点。主体过微时，眼睛扫过空墙只觉得「没画完」；请把主体体量切回 18% 或 26%。`;
  } else if (spanPct > RULES.spanMax) {
    status = "oversized";
    tier = "撑满窒息";
    badge = `错态 · 主体撑满 · ${passCount}/4`;
    headline = `主体占去画高 ${spanPct}%、核心留白仅 ${Math.round(emptyPct)}%，退化成了满幅特写`;
    detail = `朱赤圆几乎顶到上下画框，四周失去了能托起它的静默空间。先把「主体体量」调回 18% 或 26%，再清理周围干扰。`;
  } else if (activeRivals.length > 0) {
    status = "rivals";
    tier = "多焦互抢";
    badge = `错态 · 多焦互抢 · ${passCount}/4`;
    headline = `场内还有 ${activeRivals.length} 枚同色朱赤抢戏，孤立效应正在瓦解`;
    detail = `冯·雷斯托夫与亨特（1995）指出：孤立成立的前提是周围一致且安静。两个以上同色亮点并存时，视线会在它们之间来回弹跳。直接点击画布上的小红点或小红环将它们移出。`;
  } else if (crowdingItems.length > 0) {
    status = "crowded";
    tier = "邻近拥挤";
    badge = `错态 · 邻近拥挤 · ${passCount}/4`;
    headline = `有 ${crowdingItems.length} 件杂物闯入净空带，最近仅隔 ${minGapD.toFixed(2)} D（经验 ≥ ${RULES.minGapD} D）`;
    detail = `按博马（1970）的视觉拥挤律，紧贴侧翼的杂物会干扰外周识别、吞掉主体的完整轮廓。向右拖动「清场半径游标」推开杂物，或点击画布删去贴身干扰。`;
  } else if (activeClutter.length > RULES.maxClutter || borderJammedItems.length > 0) {
    status = "edge";
    tier = "外缘挤框";
    badge = `错态 · 外缘挤框 · ${passCount}/4`;
    headline = `中央已推开，但仍有 ${activeClutter.length} 件余噪挤在画框边沿（${borderJammedItems.length} 件贴框压死）`;
    detail = `只把杂物硬推到墙边并不是真留白——堆在四角的杂件会产生外缘张力，把目光从主角拉向边框。点击画布里的灰块或按「清减杂物」删到 3 件以内。`;
  } else if (!checks.whitespace) {
    status = "whitespace";
    tier = emptyPct < RULES.emptyMin ? "留白不足" : "空过头";
    badge = `错态 · 留白失衡 · ${passCount}/4`;
    headline = `核心视野留白 ${Math.round(emptyPct)}% 超出经验呼吸带（${RULES.emptyMin}%–96%）`;
    detail = emptyPct < RULES.emptyMin
      ? `场内占用面积依然偏高，再清掉几件周边杂物，让安静的冷瓷底面真正占据主导。`
      : `画面空得过头，主体分量显得偏单薄，适当调高主体体量或保留 1–2 件极轻的角标参照。`;
  }

  // 与 106 原海报的 6 项要点联动状态
  const posterPoints = [
    { key: "def", title: "定义", ok: checks.singular && checks.clearMoat },
    { key: "space", title: "留白", ok: checks.whitespace && checks.scaleOk },
    { key: "focus", title: "聚焦", ok: checks.singular && checks.scaleOk },
    { key: "dist", title: "距离", ok: crowdingItems.length === 0 && borderJammedItems.length === 0 },
    { key: "indep", title: "独立", ok: crowdingItems.length === 0 && checks.singular },
    { key: "emph", title: "强调", ok: passCount === 4 },
  ];

  return {
    aspect: safeAspect,
    center,
    sD,
    sR,
    moatR,
    moatGapD: +(moatGapNorm / sD).toFixed(2),
    items,
    activeCount: activeItems.length,
    activeRivalsCount: activeRivals.length,
    activeClutterCount: activeClutter.length,
    crowdingCount: crowdingItems.length,
    borderJammedCount: borderJammedItems.length,
    minGapD: +minGapD.toFixed(2),
    emptyPct,
    spanPct,
    checks,
    passCount,
    status,
    tier,
    badge,
    headline,
    detail,
    posterPoints,
  };
}
