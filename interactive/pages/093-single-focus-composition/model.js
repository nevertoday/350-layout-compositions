// 093 单一焦点构图 · 单真源几何、亮度对比与显著性评估模型
// 画布绘制、四项圆徽探针、极黑引号诊单、三枚原海报联动方框图解与 0.5s 视线验真全部读取本模块算出的同一组数据。

export const SCENES = {
  lighthouse: {
    id: "lighthouse",
    label: "原海报 · 钴蓝灯塔",
    shortLabel: "钴蓝灯塔",
    subjectName: "钴蓝灯塔",
    rivalNames: ["赤红信号船", "强光风暴日"],
    leadLabel: "海岸浪弧",
    note: "1:1 转译 093 原海报：暖米弧幕天空、暗岩白浪海岬与唯一的电光钴蓝灯塔。",
  },
  product: {
    id: "product",
    label: "产品发布 · 单品舞台",
    shortLabel: "单品舞台",
    subjectName: "钴蓝相机主机",
    rivalNames: ["大红促销标", "亮橙参数卡"],
    leadLabel: "桌面光束",
    note: "新品主图语境：单品独占高饱和与轮廓反差，促销角标与参数杂讯退居幕后。",
  },
  sailboat: {
    id: "sailboat",
    label: "编辑海报 · 孤舟剧照",
    shortLabel: "孤舟剧照",
    subjectName: "钴蓝孤帆",
    rivalNames: ["橙红岸塔", "彩旗浮标"],
    leadLabel: "海面尾迹",
    note: "杂志跨页语境：压低海天杂色与装饰物，让孤帆在平静水面成为唯一读点。",
  },
};

export const INITIAL_STATE = {
  scene: "lighthouse",
  bgSuppress: 16,     // 0..100，次要背景压噪（过低喧宾，过高>92过度压黑吞没轮廓）
  subjectChroma: 18,  // 0..100，主体钴蓝强调度
  subjectScale: 22,   // 6..56，主体视觉面积参考尺度（%）
  rivals: ["rival", "rival"], // 每项 "rival" | "muted" | "removed"
  leadMode: "away",   // "away" | "focus"
  showGuides: true,
};

export const SOLUTIONS = {
  poster: {
    id: "poster",
    label: "原海报灯塔解",
    patch: { bgSuppress: 80, subjectChroma: 94, subjectScale: 24, rivals: ["muted", "muted"], leadMode: "focus" },
  },
  minimal: {
    id: "minimal",
    label: "极简独焦解",
    patch: { bgSuppress: 86, subjectChroma: 90, subjectScale: 20, rivals: ["removed", "removed"], leadMode: "focus" },
  },
  heroic: {
    id: "heroic",
    label: "宏伟特写解",
    patch: { bgSuppress: 70, subjectChroma: 86, subjectScale: 36, rivals: ["muted", "removed"], leadMode: "focus" },
  },
};

export const MISTAKES = {
  split: {
    id: "split",
    label: "双焦抢戏",
    patch: { bgSuppress: 64, subjectChroma: 88, subjectScale: 23, rivals: ["rival", "rival"], leadMode: "focus" },
  },
  faded: {
    id: "faded",
    label: "主体隐没",
    patch: { bgSuppress: 74, subjectChroma: 12, subjectScale: 22, rivals: ["muted", "removed"], leadMode: "focus" },
  },
  crushed: {
    id: "crushed",
    label: "过度压黑",
    patch: { bgSuppress: 99, subjectChroma: 86, subjectScale: 24, rivals: ["removed", "removed"], leadMode: "focus" },
  },
  bloated: {
    id: "bloated",
    label: "巨物窒息",
    patch: { bgSuppress: 78, subjectChroma: 92, subjectScale: 52, rivals: ["removed", "removed"], leadMode: "focus" },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function mixRgb(a, b, t) {
  const k = clamp(t, 0, 1);
  return [
    Math.round(lerp(a[0], b[0], k)),
    Math.round(lerp(a[1], b[1], k)),
    Math.round(lerp(a[2], b[2], k)),
  ];
}

export const rgbCss = ([r, g, b], alpha = 1) =>
  alpha >= 0.999 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha.toFixed(3)})`;

// WCAG 2.1 相对亮度与对比度（单真源，直接用实绘 RGB 计算）
export function relLuminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1);
  const l2 = relLuminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function hsvSaturation([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

// 依据 state 实时计算背景天幕色、主角实绘钴蓝色、竞争焦实绘色与所有演员几何
export function computePalette(state) {
  const sup = clamp(state.bgSuppress, 0, 100);
  const chr = clamp(state.subjectChroma, 0, 100);

  // 背景天幕：低压噪(<55)偏杂暖橙灰，适中(55..90)接近 093 原海报暖米 #F4ECDA，过度压黑(>92)塌成死暗灰黑
  let skyTop, skyBot, hillNear, hillFar, rockDark, waveLight;
  if (sup <= 85) {
    const t = sup / 85;
    skyTop = mixRgb([214, 198, 178], [244, 236, 218], t);
    skyBot = mixRgb([232, 186, 152], [239, 230, 208], t);
    hillFar = mixRgb([145, 114, 128], [218, 211, 196], t);
    hillNear = mixRgb([124, 92, 76], [192, 186, 172], t);
    rockDark = mixRgb([76, 56, 46], [14, 15, 18], t);
    waveLight = mixRgb([244, 216, 176], [246, 241, 230], t);
  } else {
    const over = (sup - 85) / 15; // 0..1，>0.47(>92)明显死黑吞没
    const crush = Math.pow(over, 1.85);
    skyTop = mixRgb([244, 236, 218], [18, 20, 26], crush);
    skyBot = mixRgb([239, 230, 208], [12, 14, 18], crush);
    hillFar = mixRgb([218, 211, 196], [15, 17, 22], crush);
    hillNear = mixRgb([192, 186, 172], [11, 13, 17], crush);
    rockDark = mixRgb([14, 15, 18], [6, 7, 9], crush);
    waveLight = mixRgb([246, 241, 230], [52, 56, 66], crush);
  }

  // 主角实绘色：chr=0 为沉闷浅灰蓝（易融于背景），chr=100 为 093 原海报饱满电光钴蓝 #0744E8 / #01259B
  const ct = chr / 100;
  const heroCore = mixRgb([148, 150, 154], [6, 62, 224], ct);
  const heroLit = mixRgb([172, 173, 176], [24, 96, 250], ct);
  const heroShade = mixRgb([118, 120, 126], [1, 28, 128], ct);

  // 竞争焦色（抢戏 vs 弱化配角）
  const rival1Vivid = [226, 54, 38];   // 刺眼朱红
  const rival2Vivid = [238, 118, 24];  // 强光亮橙
  const mutedTone = mixRgb([142, 138, 132], [166, 160, 148], clamp(sup / 85, 0, 1));

  // 背景杂讯强度（云斑、海鸥、波纹高反差）
  const clutterLevel = clamp(1 - sup / 76, 0, 1);

  return {
    skyTop,
    skyBot,
    hillFar,
    hillNear,
    rockDark,
    waveLight,
    heroCore,
    heroLit,
    heroShade,
    rival1Vivid,
    rival2Vivid,
    mutedTone,
    clutterLevel,
  };
}

// 构造实绘演员几何（归一化坐标 0..1），绘制与评估共用
export function buildSceneGeometry(state) {
  const pal = computePalette(state);
  const sceneMeta = SCENES[state.scene] || SCENES.lighthouse;

  // 主角尺寸直接由 subjectScale（6..56）驱动，确保视觉面积与读数一一对应
  const scaleNorm = clamp(state.subjectScale, 6, 56);
  const linearScale = Math.sqrt(scaleNorm / 24); // 24% 为原海报标准基准

  const heroCx = state.scene === "product" ? 0.56 : 0.61;
  const heroCy = state.scene === "product" ? 0.54 : 0.52;
  const heroRw = clamp(0.14 * linearScale, 0.06, 0.34);
  const heroRh = clamp(0.46 * linearScale, 0.19, 0.84);

  // 真实占幅面积比（近似等效视觉包围面积，直接对应 subjectScale）
  const heroAreaPct = Math.round(clamp(heroRw * heroRh * 380, 4, 68));

  const heroActor = {
    id: "hero",
    role: "hero",
    name: sceneMeta.subjectName,
    cx: heroCx,
    cy: heroCy,
    rw: heroRw,
    rh: heroRh,
    rgb: pal.heroCore,
    backdropRgb: mixRgb(pal.skyTop, pal.skyBot, 0.55),
    areaPct: heroAreaPct,
    status: "hero",
  };

  // 两个竞争焦的位置（刻意避开画布正中心 0.50,0.50，既符合画面构图又保证 data-perf-drag 中心畅通）
  const rivalConfigs = [
    {
      id: "rival-0",
      idx: 0,
      name: sceneMeta.rivalNames[0],
      cx: state.scene === "product" ? 0.24 : 0.23,
      cy: state.scene === "product" ? 0.64 : 0.66,
      vividRgb: pal.rival1Vivid,
      rivalRw: 0.17,
      rivalRh: 0.23,
      mutedRw: 0.065,
      mutedRh: 0.085,
    },
    {
      id: "rival-1",
      idx: 1,
      name: sceneMeta.rivalNames[1],
      cx: state.scene === "product" ? 0.82 : 0.27,
      cy: state.scene === "product" ? 0.26 : 0.24,
      vividRgb: pal.rival2Vivid,
      rivalRw: 0.16,
      rivalRh: 0.22,
      mutedRw: 0.06,
      mutedRh: 0.08,
    },
  ];

  const rivalActors = rivalConfigs.map((cfg) => {
    const status = state.rivals[cfg.idx] || "removed";
    const isRival = status === "rival";
    const isMuted = status === "muted";
    const rw = isRival ? cfg.rivalRw : isMuted ? cfg.mutedRw : 0;
    const rh = isRival ? cfg.rivalRh : isMuted ? cfg.mutedRh : 0;
    const rgb = isRival ? cfg.vividRgb : pal.mutedTone;
    const backdropRgb = cfg.cy < 0.45 ? pal.skyTop : pal.skyBot;
    return {
      id: cfg.id,
      idx: cfg.idx,
      role: "rival",
      name: cfg.name,
      cx: cfg.cx,
      cy: cfg.cy,
      rw,
      rh,
      rgb,
      backdropRgb,
      areaPct: isRival ? 14 : isMuted ? 2 : 0,
      status,
    };
  });

  // 背景环境层等效显著竞争项（背景越吵闹，环境杂讯本身就能抢走注视）
  const bgClutterActor = {
    id: "bg-clutter",
    role: "bg",
    name: "杂噪背景层",
    cx: 0.83,
    cy: 0.36,
    rw: 0.18,
    rh: 0.18,
    rgb: pal.hillNear,
    backdropRgb: pal.skyTop,
    areaPct: Math.round(pal.clutterLevel * 28),
    status: pal.clutterLevel > 0.28 ? "noisy" : "quiet",
  };

  // 引导线热区（海岸浪弧 / 桌面光束 / 海面尾迹）
  const leadHitbox = {
    id: "lead",
    cx: 0.41,
    cy: 0.84,
    rw: 0.44,
    rh: 0.22,
    mode: state.leadMode,
  };

  return {
    pal,
    sceneMeta,
    hero: heroActor,
    rivals: rivalActors,
    bgClutter: bgClutterActor,
    leadHitbox,
  };
}

// 依据 Itti-Koch-Niebur 特征凸显思路，从实绘色彩饱和、WCAG 亮度对比、视觉面积与引导线汇聚计算每个演员的相对显著值（示意）
function actorSaliency(actor, { leadBoost = 1, clutterBoost = 0, crushPenalty = 1 } = {}) {
  if (actor.status === "removed") return 0;
  const lumRatio = contrastRatio(actor.rgb, actor.backdropRgb); // 1..21
  const lumNorm = clamp((lumRatio - 1) / 9.5, 0, 1.35);
  const sat = hsvSaturation(actor.rgb); // 0..1
  const areaNorm = clamp(Math.sqrt(actor.areaPct / 24), 0.18, 1.35);

  if (actor.role === "bg") {
    return clamp(clutterBoost * (0.45 + 0.55 * lumNorm) * 58, 4, 72);
  }
  const raw = (sat * 46 + lumNorm * 38 + areaNorm * 18) * leadBoost * crushPenalty;
  return clamp(raw, 4, 100);
}

// 单真源全面审计：返回 4 项探针状态、8 类双向错态、主次显著比 S1/S2、前 3 跳 WTA 注视路径与白话诊单
export function evaluate(state) {
  const geom = buildSceneGeometry(state);
  const { hero, rivals, bgClutter, pal, sceneMeta } = geom;

  const sup = clamp(state.bgSuppress, 0, 100);
  const chr = clamp(state.subjectChroma, 0, 100);
  const area = hero.areaPct;

  const heroContrast = contrastRatio(hero.rgb, hero.backdropRgb);
  const isCrushed = sup > 92;
  const isNoisy = sup < 56;
  const isTiny = area < 10;
  const isBloated = area > 44;
  const isFaded = chr < 64 || heroContrast < 2.6;
  const leadAway = state.leadMode !== "focus";

  // 过度压黑时灯塔黑顶棚与暗岩融成一团，轮廓分离度骤降
  const crushPenalty = isCrushed ? clamp(1 - (sup - 92) * 0.08, 0.36, 0.92) : 1;
  const heroLeadBoost = leadAway ? 0.9 : 1.14;
  const heroSal = actorSaliency(hero, { leadBoost: heroLeadBoost, crushPenalty });

  const scoredRivals = rivals.map((r) => {
    const s = r.status === "removed"
      ? 0
      : r.status === "rival"
        ? actorSaliency(r, { leadBoost: leadAway && r.idx === 0 ? 1.18 : 1.04 })
        : actorSaliency(r) * 0.42;
    return { ...r, saliency: Math.round(s), contrast: contrastRatio(r.rgb, r.backdropRgb) };
  });

  const bgSal = Math.round(actorSaliency(bgClutter, { clutterBoost: pal.clutterLevel }));
  const activeRivalCount = rivals.filter((r) => r.status === "rival").length;
  const mutedRivalCount = rivals.filter((r) => r.status === "muted").length;

  // 所有参与注视竞争的候选节点按显著值降序排布 → Winner-Take-All 注视路径 #1 → #2 → #3
  const allCandidates = [
    { ...hero, saliency: Math.round(heroSal), contrast: heroContrast },
    ...scoredRivals.filter((r) => r.status !== "removed"),
    ...(bgSal >= 14 ? [{ ...bgClutter, saliency: bgSal, contrast: contrastRatio(bgClutter.rgb, bgClutter.backdropRgb) }] : []),
  ].sort((a, b) => b.saliency - a.saliency);

  const strongestSecondary = Math.max(
    12,
    ...scoredRivals.map((r) => r.saliency),
    bgSal,
  );
  const dominanceRatio = +(heroSal / strongestSecondary).toFixed(2);
  const firstFixationIsHero = allCandidates[0]?.id === "hero" && dominanceRatio >= 1.35;

  // 4 项海报原话探针各自独立判真
  const anchorOk = activeRivalCount === 0 && !isTiny && !isBloated && dominanceRatio >= 2.0;
  const emphasisOk = !isFaded && !isCrushed && heroContrast >= 2.9;
  const contrastOk = !isNoisy && !isCrushed && strongestSecondary <= heroSal * 0.5;
  const leadingOk = !leadAway && !isBloated;

  const passedCount = [anchorOk, emphasisOk, contrastOk, leadingOk].filter(Boolean).length;

  // 按严重优先级收集错态（支持双向纠错）
  const faults = [];
  if (activeRivalCount > 0) faults.push("rival-split");
  if (isCrushed) faults.push("bg-crushed");
  if (isFaded) faults.push("subject-faded");
  if (isNoisy) faults.push("bg-noisy");
  if (isBloated) faults.push("subject-bloated");
  if (isTiny) faults.push("subject-tiny");
  if (leadAway) faults.push("lead-away");
  if (!faults.length && dominanceRatio < 2.0) faults.push("saliency-thin");

  const primaryFault = faults[0] || "pass";

  // 档位描述（避免假精确，只用真实比例+定性档位）
  const tier = passedCount === 4
    ? dominanceRatio >= 2.8 ? "绝对独焦" : "清晰单焦"
    : primaryFault === "rival-split"
      ? "多焦分裂"
      : primaryFault === "bg-crushed"
        ? "过黑吞廓"
        : primaryFault === "subject-bloated"
          ? "巨物窒息"
          : "层级模糊";

  // 单真源白话诊单（讲清「为什么」+ 下一步可做动作）
  const DIAG = {
    "rival-split": {
      badge: `${passedCount}/4 · ${activeRivalCount === 2 ? "双焦抢戏" : "余焦争锋"}`,
      headline: `${activeRivalCount} 处高饱和配角正在抢走第一眼`,
      body: `眼下「${allCandidates[0].name}」与「${sceneMeta.subjectName}」的显著优势比只有 ${dominanceRatio.toFixed(2)}×。人眼面对两个同样刺眼的色块时无法前注意秒锁，会被迫来回跳视——这已经滑向了 094 多重焦点构图。`,
      action: `直接点击画布上标红的「${scoredRivals.find((r) => r.status === "rival")?.name || "竞争元素"}」把它降级成低饱和配角或移除。`,
    },
    "bg-crushed": {
      badge: `${passedCount}/4 · 过度压黑 ${sup}%`,
      headline: `背景压噪拉过头（${sup}%），天空塌成死黑吞没轮廓`,
      body: `次要弱化不是把背景涂成一片漆黑。现在天幕与暗岩的亮度差几乎归零，${sceneMeta.subjectName}的顶部暗轮廓和背景黏在一起，对比度反而跌到 ${heroContrast.toFixed(1)}:1。`,
      action: `向左微拖画布（或把「次要背景压噪」退回 62%–88%），让暖米天幕重新托住主角清晰剪影。`,
    },
    "subject-faded": {
      badge: `${passedCount}/4 · 主体发灰 ${chr}%`,
      headline: `主角饱和度只有 ${chr}%，融在背景里跳不出来`,
      body: `即使周围安静了，主角自己若缺乏清晰的色彩或明暗制高点（当前与背景对比仅 ${heroContrast.toFixed(1)}:1），大脑仍不会把它当成唯一中心。`,
      action: `直接点击画布上的「${sceneMeta.subjectName}」（或拉高「主体钴蓝强调」到 75% 以上），把唯一高饱和预算押给主角。`,
    },
    "bg-noisy": {
      badge: `${passedCount}/4 · 背景喧宾 ${sup}%`,
      headline: `次要背景压噪仅 ${sup}%，云浪与群鸥吵成一片`,
      body: `当天空、远山与零碎景物都保持高饱和与强明暗对比时，画面像同时开了五个音箱——主角被淹没在背景纹路里，图底关系模糊。`,
      action: `在画布上向右横拖推拉压噪滤镜（调到 60%–88%），让次要元素退回低饱和、低对比的暖米与炭墨。`,
    },
    "subject-bloated": {
      badge: `${passedCount}/4 · 巨物窒息 ${area}%`,
      headline: `主角膨胀到占幅 ${area}%，把留白与引导空间挤光了`,
      body: `把主体无限放大并不等于更强聚焦。主角顶撞边缘后，观者失去「大小对比」的参照背景，连引导视线也无处起笔，画面变得沉闷窒息。`,
      action: `把「主体占比尺度」收回到 14%–38% 之间，留出足够的干净暖米空场来衬托主角。`,
    },
    "subject-tiny": {
      badge: `${passedCount}/4 · 主体过小 ${area}%`,
      headline: `主角缩到仅占 ${area}%，弱得像海面上的噪点`,
      body: `过小的面积难以支撑单一焦点的视觉重量，观者第一眼会先在大片空白里迷失，需要刻意搜寻才能找到核心信息。`,
      action: `把「主体占比尺度」拉回 18%–32%，让主角稳稳立住视觉重心。`,
    },
    "lead-away": {
      badge: `${passedCount}/4 · 引导外拉`,
      headline: `${sceneMeta.leadLabel}朝边缘反拉，把刚聚起的视线拖出画外`,
      body: `主角和背景的对比已经拉开，但底部的方向势能正把观者目光甩向左下角空白处，形成与主角背道而驰的视觉分流。`,
      action: `点击画布下方标红的「${sceneMeta.leadLabel}」（或切换「视线引导」），让曲线顺势指向${sceneMeta.subjectName}。`,
    },
    "saliency-thin": {
      badge: `${passedCount}/4 · 优势偏薄 ${dominanceRatio.toFixed(2)}×`,
      headline: `主角领先幅度只有 ${dominanceRatio.toFixed(2)}×，还不够干脆`,
      body: `单靠某一项微弱优势还不足以半秒定焦。把色彩强调再提一格，或继续压低次要背景，就能拉开清晰的主次代差。`,
      action: `再提高一点「主体钴蓝强调」或微调「次要背景压噪」，让主次显著比跨过 2.0×。`,
    },
    pass: {
      badge: `4/4 · 单焦锁定 ${dominanceRatio.toFixed(1)}×`,
      headline:
        activeRivalCount === 0 && mutedRivalCount === 0
          ? "极简独焦成立：零干扰，半秒直抵核心"
          : area >= 32
            ? "宏伟特写独焦成立：大尺度主角统领全场"
            : "单焦层级成立：少即是多，焦点即力量",
      body: `${sceneMeta.subjectName}以 ${heroContrast.toFixed(1)}:1 明暗反差与独占钴蓝拿下 ${dominanceRatio.toFixed(1)}× 显著优势；次要背景压噪 ${sup}%、${sceneMeta.leadLabel}顺势收束，第一眼注视毫无犹豫地落在唯一主角上。`,
      action: `按 Space 运行「0.5s 视线验真」观察胜者通吃注视路径，或试试右上方的反向试错键故意打破它。`,
    },
  };

  const d = DIAG[primaryFault];

  // 四枚原海报圆徽实时状态
  const probes = [
    {
      key: "anchor",
      title: "焦点明确",
      posterBody: "唯一的视觉中心，通过大小、色彩和位置建立主导。",
      ok: anchorOk,
      tag: activeRivalCount > 0
        ? `抢戏 ${activeRivalCount} 处`
        : isBloated
          ? `过满 ${area}%`
          : isTiny
            ? `过小 ${area}%`
            : dominanceRatio < 2.0
              ? `焦比 ${dominanceRatio.toFixed(1)}×`
              : `独焦 ${dominanceRatio.toFixed(1)}×`,
    },
    {
      key: "emphasis",
      title: "强化强调",
      posterBody: "高对比的色彩与清晰的形体突出主体的重要性。",
      ok: emphasisOk,
      tag: isCrushed
        ? `轮廓粘黑`
        : isFaded
          ? `发灰 ${chr}%`
          : `钴蓝 ${chr}%`,
    },
    {
      key: "contrast",
      title: "对比突出",
      posterBody: "明暗、大小、色彩的强烈对比，强化主次关系。",
      ok: contrastOk,
      tag: isCrushed
        ? `压黑 ${sup}%`
        : isNoisy
          ? `噪杂 ${sup}%`
          : `对比 ${heroContrast.toFixed(1)}:1`,
    },
    {
      key: "leading",
      title: "引导视线",
      posterBody: "利用方向、留白与线条，引导视线自然指向焦点。",
      ok: leadingOk,
      tag: leadAway ? "外拉分流" : isBloated ? "留白挤爆" : "顺势聚焦",
    },
  ];

  // 前 3 跳注视路径（供 Space 0.5s 视线验真直接渲染）
  const scanpath = allCandidates.slice(0, 3).map((c, i) => ({
    rank: i + 1,
    id: c.id,
    name: c.name,
    cx: c.cx,
    cy: c.cy,
    saliency: c.saliency,
    timeSec: (0.12 + i * 0.19).toFixed(2),
    isHero: c.id === "hero",
  }));

  return {
    geom,
    passedCount,
    primaryFault,
    faults,
    tier,
    dominanceRatio,
    heroContrast: +heroContrast.toFixed(1),
    heroAreaPct: area,
    heroSaliency: Math.round(heroSal),
    strongestSecondary: Math.round(strongestSecondary),
    activeRivalCount,
    mutedRivalCount,
    firstFixationIsHero,
    diagnosis: d,
    probes,
    scanpath,
    flags: { isCrushed, isNoisy, isTiny, isBloated, isFaded, leadAway },
  };
}
