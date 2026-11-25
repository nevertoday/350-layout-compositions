// 160 封面版式（COVER LAYOUT）单真源模型
// 封面使用 3:4 出版竖版归一化坐标系：u ∈ [0, 1]（左→右），v ∈ [0, 1]（上→下）。
// 画布渲染、远距验视镜、五要素状态徽标、审稿诊单与快捷纠错全部只读这一份实算结果。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 入口之门",
    seriesZh: "版式设计基础系列课程",
    seriesEn: "DESIGN LAYOUT FUNDAMENTALS",
    titleZh: "封面版式",
    titleEn: "COVER LAYOUT",
    subtitleZh: "视觉结构 · 层级与焦点",
    author: "NO. 160 · 第一入口",
    bg: "#14120E",
    bgRgb: [20, 18, 14],
    discRgb: [199, 149, 69],
    crimsonRgb: [95, 15, 12],
    ivoryRgb: [239, 227, 206],
    titleColor: "#EFE3CE",
    titleRgb: [239, 227, 206],
    accentColor: "#D9A44E",
    subColor: "#D2C9B8",
    titleFont: "sans",
  },
  journal: {
    id: "journal",
    label: "建筑季刊",
    seriesZh: "城市与空间季刊 · 第 14 辑",
    seriesEn: "ARCH & LIGHT QUARTERLY",
    titleZh: "光之门廊",
    titleEn: "THRESHOLDS OF LIGHT",
    subtitleZh: "当代美术馆入口空间实录",
    author: "ISSUE 14 · AUTUMN",
    bg: "#131618",
    bgRgb: [19, 22, 24],
    discRgb: [206, 160, 82],
    crimsonRgb: [110, 24, 20],
    ivoryRgb: [242, 232, 214],
    titleColor: "#F3E8D5",
    titleRgb: [243, 232, 213],
    accentColor: "#E0AE59",
    subColor: "#CDD1D3",
    titleFont: "serif",
  },
  book: {
    id: "book",
    label: "文学平装",
    seriesZh: "现代译文典藏 · 08",
    seriesEn: "MODERN FICTION SERIES",
    titleZh: "午夜回廊",
    titleEn: "THE MIDNIGHT GALLERY",
    subtitleZh: "八座冬日书店的纸页漫游",
    author: "林澄 著 · 平装初版",
    bg: "#191211",
    bgRgb: [25, 18, 17],
    discRgb: [194, 144, 68],
    crimsonRgb: [108, 19, 17],
    ivoryRgb: [241, 229, 209],
    titleColor: "#F2E5CF",
    titleRgb: [242, 229, 209],
    accentColor: "#DCA752",
    subColor: "#D4C6BA",
    titleFont: "xiaowei",
  },
};

export const CLUTTER_META = [
  { id: 0, label: "爆款红贴", text: "重磅热销!", short: "清掉红贴", u: 0.69, v: 0.64, w: 0.23, h: 0.125, kind: "sticker" },
  { id: 1, label: "过长腰封", text: "三大名师联袂作序·收录九十个案例与十二张拉页", short: "撤掉长腰封", u: 0.50, v: 0.805, w: 0.84, h: 0.084, kind: "belly" },
  { id: 2, label: "冗余卖点", text: "★ 限量刷边版附赠书签与明信片套装", short: "删冗余卖点", u: 0.34, v: 0.42, w: 0.54, h: 0.066, kind: "blurb" },
  { id: 3, label: "花哨角标", text: "NEW 2026", short: "去角标", u: 0.84, v: 0.13, w: 0.24, h: 0.064, kind: "ribbon" },
];

export const ID_POSITIONS = {
  "bottom-right": { label: "右下躲藏", note: "紧贴右下，书架叠放时会被前排邻书直接盖死" },
  bleed: { label: "顶边压切", note: "紧贴裁切边缘不足 3%，装订修边极易切掉字头" },
  "top-left": { label: "左上安全区", note: "报摊叠放时最不易被遮挡的黄金识别角" },
  masthead: { label: "顶栏通栏", note: "大刊经典刊头位，远距品牌识别最强" },
};

// 默认错态（绝不先给答案）：0/4 失焦杂封
export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    focal: { u: 0.48, v: 0.45, r: 0.34 },
    title: { u: 0.48, v: 0.33, scale: 1.18 },
    idPos: "bottom-right",
    clutter: [true, true, true, true],
    shelfMask: true,
  },
  poster_classic: {
    label: "原海报入口解",
    focal: { u: 0.80, v: 0.60, r: 0.38 },
    title: { u: 0.30, v: 0.23, scale: 2.85 },
    idPos: "top-left",
    clutter: [false, false, false, false],
    shelfMask: false,
  },
  concept_hero: {
    label: "观念单焦解",
    focal: { u: 0.50, v: 0.68, r: 0.35 },
    title: { u: 0.50, v: 0.21, scale: 3.10 },
    idPos: "masthead",
    clutter: [false, false, false, false],
    shelfMask: false,
  },
  newsstand_safe: {
    label: "报摊安全解",
    focal: { u: 0.74, v: 0.66, r: 0.34 },
    title: { u: 0.31, v: 0.23, scale: 2.65 },
    idPos: "top-left",
    clutter: [false, false, false, false],
    shelfMask: true,
  },
  try_oversize: {
    label: "试错：主标撞边",
    focal: { u: 0.78, v: 0.62, r: 0.36 },
    title: { u: 0.48, v: 0.24, scale: 4.65 },
    idPos: "top-left",
    clutter: [false, false, false, false],
    shelfMask: false,
  },
  try_weak: {
    label: "试错：焦点怯小",
    focal: { u: 0.80, v: 0.78, r: 0.14 },
    title: { u: 0.31, v: 0.23, scale: 2.75 },
    idPos: "top-left",
    clutter: [false, false, false, false],
    shelfMask: false,
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    focal: { ...PRESETS.broken.focal },
    title: { ...PRESETS.broken.title },
    idPos: PRESETS.broken.idPos,
    clutter: [...PRESETS.broken.clutter],
    shelfMask: PRESETS.broken.shelfMask,
  };
}

export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// WCAG 2.1 相对亮度与对比度
function relLum([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(rgbA, rgbB) {
  const l1 = relLum(rgbA);
  const l2 = relLum(rgbB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function rectOverlap(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}

// 统一计算封面全部实绘边界盒（画布与诊断共享同一真源）
export function computeGeometry(state) {
  const f = state.focal;
  const t = state.title;
  const aspect = 3 / 4; // W / H = 0.75

  // 1. 识别带矩形
  let idRect;
  if (state.idPos === "top-left") {
    idRect = { x: 0.075, y: 0.052, w: 0.44, h: 0.052 };
  } else if (state.idPos === "masthead") {
    idRect = { x: 0.14, y: 0.052, w: 0.72, h: 0.056 };
  } else if (state.idPos === "bleed") {
    idRect = { x: 0.02, y: 0.006, w: 0.48, h: 0.048 };
  } else {
    // bottom-right 躲在书架前排阴影里
    idRect = { x: 0.64, y: 0.895, w: 0.31, h: 0.052 };
  }

  // 2. 主标题+副标矩形（尺寸与实绘 4 汉字主标宽度精准对齐）
  const titleW = clamp(0.16 + t.scale * 0.105, 0.25, 0.90);
  const titleH = clamp(0.062 + t.scale * 0.028, 0.090, 0.205);
  const tx = clamp(t.u - titleW / 2, 0.015, 0.985 - titleW);
  const ty = clamp(t.v - titleH / 2, 0.06, 0.86 - titleH);
  const titleRect = { x: tx, y: ty, w: titleW, h: titleH };

  // 3. 箔金日轮与入口门洞（圆心在 f.u, f.v，水平半径 f.r，垂直半径 f.r * aspect）
  const rx = f.r;
  const ry = f.r * aspect;
  const disc = { cx: f.u, cy: f.v, rx, ry };

  // 酒红次月（位于箔金日轮左上方）
  const crimson = {
    cx: f.u - rx * 0.22,
    cy: f.v - ry * 0.86,
    rx: rx * 0.44,
    ry: ry * 0.44,
  };

  // 入口门洞矩形（坐落在日轮中下部）
  const doorW = rx * 0.76;
  const doorH = ry * 1.12;
  const doorRect = {
    x: f.u - doorW * 0.56,
    y: f.v - doorH * 0.26,
    w: doorW,
    h: doorH,
  };

  // 焦点核心包围盒（用于图字冲突与遮头实算）
  const focalCoreRect = {
    x: f.u - rx * 0.74,
    y: f.v - ry * 0.74,
    w: rx * 1.48,
    h: ry * 1.48,
  };

  // 4. 杂讯条实绘矩形
  const clutterRects = CLUTTER_META.map((c, idx) => ({
    ...c,
    active: !!state.clutter[idx],
    x: c.u - c.w / 2,
    y: c.v - c.h / 2,
  }));

  // 5. 书架/报摊前排叠放遮蔽带（右侧 22% 与 底部 13%）
  const shelfRight = { x: 0.78, y: 0, w: 0.22, h: 1 };
  const shelfBottom = { x: 0, y: 0.87, w: 1, h: 0.13 };

  return { idRect, titleRect, disc, crimson, doorRect, focalCoreRect, clutterRects, shelfRight, shelfBottom };
}

// 采样某个归一化点 (u, v) 在封面底图上的真实 RGB（用于计算标题实测对比度）
function sampleBackdropRgb(u, v, geo, theme) {
  const { disc, crimson, doorRect } = geo;
  // 若落在门扉象牙白区域（左半门板）
  const leafRect = { x: doorRect.x + doorRect.w * 0.08, y: doorRect.y + doorRect.h * 0.12, w: doorRect.w * 0.46, h: doorRect.h * 0.78 };
  if (u >= leafRect.x && u <= leafRect.x + leafRect.w && v >= leafRect.y && v <= leafRect.y + leafRect.h) {
    return theme.ivoryRgb;
  }
  // 若落在门洞深黑区（右半门洞）
  if (u >= doorRect.x + doorRect.w * 0.54 && u <= doorRect.x + doorRect.w && v >= doorRect.y && v <= doorRect.y + doorRect.h) {
    return theme.bgRgb;
  }
  // 若落在箔金日轮圆内
  const dx = (u - disc.cx) / Math.max(0.01, disc.rx);
  const dy = (v - disc.cy) / Math.max(0.01, disc.ry);
  if (dx * dx + dy * dy <= 1.0) {
    return theme.discRgb;
  }
  // 若落在酒红次月内
  const cx = (u - crimson.cx) / Math.max(0.01, crimson.rx);
  const cy = (v - crimson.cy) / Math.max(0.01, crimson.ry);
  if (cx * cx + cy * cy <= 1.0) {
    return theme.crimsonRgb;
  }
  return theme.bgRgb;
}

export function evaluateCover(state) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const geo = computeGeometry(state);
  const { idRect, titleRect, disc, focalCoreRect, clutterRects, shelfRight, shelfBottom } = geo;

  // 1. 实测标题区平均背景对比度（在标题矩形内做 5×3 网格真实采样，取最差 40% 均值以反映真实压字风险）
  const ratios = [];
  for (let iy = 0; iy < 3; iy++) {
    for (let ix = 0; ix < 5; ix++) {
      const su = titleRect.x + titleRect.w * (0.12 + 0.76 * (ix / 4));
      const sv = titleRect.y + titleRect.h * (0.2 + 0.6 * (iy / 2));
      const bg = sampleBackdropRgb(su, sv, geo, theme);
      ratios.push(contrastRatio(theme.titleRgb, bg));
    }
  }
  ratios.sort((a, b) => a - b);
  const worstN = Math.max(1, Math.floor(ratios.length * 0.4));
  const contrast = ratios.slice(0, worstN).reduce((s, x) => s + x, 0) / worstN;

  // 2. 图字冲突百分比（标题矩形与焦点核心区重叠）
  const titleArea = Math.max(1e-4, titleRect.w * titleRect.h);
  const clashPct = Math.round((rectOverlap(titleRect, focalCoreRect) / titleArea) * 100);

  // 3. 标题安全边距（距离四边最小边距）
  const titleMargin = Math.min(
    titleRect.x,
    1 - (titleRect.x + titleRect.w),
    titleRect.y,
    1 - (titleRect.y + titleRect.h)
  );
  const titleBleedRisk = state.title.scale > 4.25 || titleMargin < 0.04;

  // 4. 识别带露出率与遮头检测
  const idArea = Math.max(1e-4, idRect.w * idRect.h);
  const hiddenRight = rectOverlap(idRect, shelfRight);
  const hiddenBottom = rectOverlap(idRect, shelfBottom);
  const hiddenCorner = rectOverlap(idRect, { x: shelfRight.x, y: shelfBottom.y, w: shelfRight.w, h: shelfBottom.h });
  const shelfHidden = hiddenRight + hiddenBottom - hiddenCorner;
  const focalCoverId = rectOverlap(idRect, focalCoreRect);
  const mastheadCoverPct = Math.round((focalCoverId / idArea) * 100);
  const idMargin = Math.min(idRect.x, 1 - (idRect.x + idRect.w), idRect.y);
  const idBleedRisk = idMargin < 0.032;
  const idExposure = Math.round(clamp(1 - Math.max(shelfHidden, focalCoverId) / idArea, 0, 1) * 100);

  // 5. 视觉焦点有效覆盖面积占比（画幅内可见的日轮面积）
  const visU0 = clamp(disc.cx - disc.rx, 0, 1);
  const visU1 = clamp(disc.cx + disc.rx, 0, 1);
  const visV0 = clamp(disc.cy - disc.ry, 0, 1);
  const visV1 = clamp(disc.cy + disc.ry, 0, 1);
  const focalVisPct = Math.round(Math.max(0, visU1 - visU0) * Math.max(0, visV1 - visV0) * 0.785 * 100);
  const focalWeak = state.focal.r < 0.23 || focalVisPct < 14;

  // 6. 杂讯堵门计数
  const activeClutter = clutterRects.filter((c) => c.active);
  const clutterCount = activeClutter.length;
  const stickerBlocking = !!state.clutter[0];

  // 四大硬指标判定（对应原海报核心要素）
  const titleRatio = +state.title.scale.toFixed(2);
  const okIdentity = idExposure >= 72 && !idBleedRisk && mastheadCoverPct <= 45;
  const okTitle = titleRatio >= 1.9 && !titleBleedRisk && contrast >= 4.5;
  const okFocal = !focalWeak && clashPct <= 26 && mastheadCoverPct <= 45;
  const okEntry = clutterCount === 0 || (clutterCount === 1 && !stickerBlocking);

  const score = [okIdentity, okTitle, okFocal, okEntry].filter(Boolean).length;

  // 门扉开启度（随过关数与清杂讯程度动态推开）
  const clutterRelief = (4 - clutterCount) / 4;
  const doorOpen = clamp(0.14 + score * 0.17 + clutterRelief * 0.18, 0.14, 1.0);

  // 诊断 8 类错态（按对 2 米第一印象的破坏力排序）
  let fault = null;
  if (clutterCount >= 2 || stickerBlocking) {
    fault = {
      code: "clutter",
      badge: `杂讯堵门 · ${clutterCount} 处抢戏`,
      headline: `封面上堆了 ${clutterCount} 处促销贴与冗余卖点，入口被堵死`,
      why: "封面不是内容提要页。眼下「重磅热销!」红贴和长腰封直接压在视觉门洞上，读者 2 米外只能看到一堆抢话的色块，不知道先看书名还是先看图。",
      next: "直接在封面上点掉红色的「重磅热销!」贴纸与多余卖点条，看象牙白入口门一点点推开。",
      fixAction: "clear_clutter",
      fixLabel: "清掉堵门杂讯",
    };
  } else if (titleRatio < 1.9) {
    fault = {
      code: "title_flat",
      badge: `层级平权 · 仅 ${titleRatio.toFixed(2)}×`,
      headline: `主标只比副标大 ${titleRatio.toFixed(2)} 倍，2.5 米外糊成灰字`,
      why: "经验上封面主标与副标字号比拉到 2.0×–3.8×，远看才能一眼读出书名。现在主副字号几乎平级，看旁边的 2.5 米远距验视镜就会发现书名已经辨认不出。",
      next: "把「主副字号比」滑块向右推到 2.4×–3.4×，把主标题的骨架立起来。",
      fixAction: "fix_title_scale",
      fixLabel: "拉开主标层级",
    };
  } else if (titleBleedRisk) {
    fault = {
      code: "title_bleed",
      badge: `主标撞边 · ${titleRatio.toFixed(2)}×`,
      headline: "主标题撑得太满，贴近切口随时会被裁掉笔画",
      why: `当前主标离版边只剩 ${Math.round(titleMargin * 100)}%，远低于出版装帧 5%–8% 的安全留白经验线。印刷切纸只要偏 1–2 毫米就会咬字，视觉上也憋得喘不过气。`,
      next: "把「主副字号比」回调到 2.4×–3.6×，或把标题框向内拖离版边。",
      fixAction: "fix_title_scale",
      fixLabel: "收回安全边距",
    };
  } else if (contrast < 4.5) {
    fault = {
      code: "contrast",
      badge: `对比融底 · ${contrast.toFixed(1)}:1`,
      headline: `主标题压进亮色高光区，对比度跌到 ${contrast.toFixed(1)}:1`,
      why: "象牙白标题必须坐落在深暗负空间上才能远距成形；一旦被箔金日轮或象牙白门扉托在背后，笔画轮廓立刻融化，3 秒扫视直接失效。",
      next: "直接横向拖移画布里的箔金日轮向右下方让道，或把标题框挪回深黑留白区。",
      fixAction: "separate_focal",
      fixLabel: "图字分离避让",
    };
  } else if (clashPct > 26) {
    fault = {
      code: "clash",
      badge: `图字互殴 · 重叠 ${clashPct}%`,
      headline: `标题和视觉焦点重叠了 ${clashPct}%，两个主角在打架`,
      why: "好封面需要焦点与标题互相借力、各自占稳一块场域。重叠超过约四分之一时，视线在文字和图形之间来回绊脚，入口感被撕裂。",
      next: "在画布上拖移箔金日轮（或标题框），让文字和日轮各自拥有清晰领地。",
      fixAction: "separate_focal",
      fixLabel: "拉开图字领地",
    };
  } else if (mastheadCoverPct > 45) {
    fault = {
      code: "masthead_covered",
      badge: `焦点遮头 · 盖住 ${mastheadCoverPct}%`,
      headline: `主视觉把刊头识别区盖住了 ${mastheadCoverPct}%`,
      why: "大刊偶尔让主体边缘轻擦 1–2 个字母制造景深，但遮盖超过四成就会直接毁掉系列识别——书架上一排书摆在一起，老读者都认不出这是哪家出品。",
      next: "把箔金日轮向下拖离顶栏，让识别带完整呼吸。",
      fixAction: "separate_focal",
      fixLabel: "下移焦点让出刊头",
    };
  } else if (!okIdentity) {
    fault = {
      code: "id_hidden",
      badge: idBleedRisk ? "识别贴边" : `露出仅 ${idExposure}%`,
      headline: idBleedRisk
        ? "品牌识别紧贴裁切边缘，装订修边极易切坏"
        : `识别标躲在右下角，书架叠放时露出仅 ${idExposure}%`,
      why: "实体书店与报摊习惯从左向右叠放陈列，右侧和底边常常被前排邻书盖住。把刊头与系列名放进左上角或顶栏安全带，才能在露出一角时就被认出。",
      next: "把「识别带位置」切到「左上安全区」或「顶栏通栏」。",
      fixAction: "fix_identity",
      fixLabel: "移回左上安全区",
    };
  } else if (focalWeak) {
    fault = {
      code: "focal_weak",
      badge: `焦点怯小 · 仅占 ${focalVisPct}%`,
      headline: `视觉焦点只占画幅 ${focalVisPct}%，封面退化成一张字条`,
      why: "缺少体量够稳的核心图形，封面在 2 米外就只剩几行干巴巴的文字，既抓不住第一印象，也没有「推门进去」的吸引力。",
      next: "把「焦点体量」滑块推到 32%–44%，让箔金入口真正撑起封面重心。",
      fixAction: "fix_focal_size",
      fixLabel: "放大视觉焦点",
    };
  }

  // 第一印象（2.5 米远距验视）档位（拒绝假精确百分比，用明确语义档位）
  let impressionRank = "混沌难辨";
  let impressionTag = "待整理";
  if (score === 4) {
    impressionRank = "2.5 米一眼识别";
    impressionTag = "门扉敞开";
  } else if (score === 3) {
    impressionRank = "轮廓初现 · 差一口气";
    impressionTag = "差 1 项";
  } else if (score === 2) {
    impressionRank = "远看半糊 · 主次打架";
    impressionTag = "2/4";
  } else {
    impressionRank = "远看一团 · 入口封死";
    impressionTag = `${score}/4`;
  }

  // 五要素实时状态（1:1 映射 160 原海报左栏五枚金环）
  const pillars = [
    {
      key: "identity",
      zh: "建立识别",
      en: "IDENTITY",
      ok: okIdentity,
      stat: okIdentity ? `露出 ${idExposure}%` : idBleedRisk ? "贴边险区" : `被挡 ${100 - idExposure}%`,
    },
    {
      key: "entry",
      zh: "清晰入口",
      en: "ENTRY",
      ok: okEntry,
      stat: okEntry ? "门径通畅" : `${clutterCount} 处堵门`,
    },
    {
      key: "title",
      zh: "明确标题",
      en: "TITLE",
      ok: okTitle,
      stat: okTitle ? `${titleRatio.toFixed(1)}× · ${contrast.toFixed(1)}:1` : titleRatio < 1.9 ? `仅 ${titleRatio.toFixed(1)}×` : titleBleedRisk ? "贴边过胀" : `对比 ${contrast.toFixed(1)}:1`,
    },
    {
      key: "focal",
      zh: "视觉焦点",
      en: "FOCAL POINT",
      ok: okFocal,
      stat: okFocal ? `占幅 ${focalVisPct}%` : focalWeak ? `怯小 ${focalVisPct}%` : `撞字 ${clashPct}%`,
    },
    {
      key: "impression",
      zh: "第一印象",
      en: "FIRST IMPRESSION",
      ok: score === 4,
      stat: impressionTag,
    },
  ];

  const passSummary = {
    headline:
      state.idPos === "masthead" && Math.abs(state.focal.u - 0.5) < 0.1
        ? "观念单焦格局成立，入口之门完全敞开"
        : state.shelfMask
          ? "报摊叠放验视通过，露出一角也能秒认"
          : "四级视觉漏斗打通，远看一眼入戏",
    why: `实测主副字号比 ${titleRatio.toFixed(2)}×、标题对比度 ${contrast.toFixed(1)}:1、识别带安全露出 ${idExposure}%、冗余杂讯清零。此刻看旁边的 2.5 米缩略验视镜：不用凑近，书名、品牌与入口焦点已经一气呵成。`,
    next: "试着切换「建筑季刊 / 文学平装」题材，或故意把焦点往标题上拖，亲自验证好封面的边界在哪。",
  };

  return {
    theme,
    geo,
    score,
    doorOpen,
    metrics: {
      titleRatio,
      contrast: +contrast.toFixed(1),
      clashPct,
      idExposure,
      focalVisPct,
      clutterCount,
      impressionRank,
    },
    checks: { okIdentity, okTitle, okFocal, okEntry },
    pillars,
    fault,
    passSummary,
  };
}
