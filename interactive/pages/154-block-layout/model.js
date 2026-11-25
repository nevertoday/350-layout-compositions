// 154 区块式版式 · 单真源几何计算与诊断模型
// 画布绘制、顶沿微缩色面图、左栏五原则账本、底沿白话诊单全部共用此模块。

export const PALETTE = {
  orange: {
    id: "orange",
    label: "信号橙",
    en: "ORANGE",
    fill: "#FB6204",
    ink: "#0A0B08",
    subInk: "#1B150E",
    barInk: "#0A0B08",
    isChroma: true,
    isOrange: true,
  },
  cyan: {
    id: "cyan",
    label: "电光青",
    en: "CYAN",
    fill: "#15B5D1",
    ink: "#0A0B08",
    subInk: "#052A32",
    barInk: "#0A0B08",
    isChroma: true,
    isOrange: false,
  },
  cream: {
    id: "cream",
    label: "暖骨纸",
    en: "PAPER",
    fill: "#F6E9D7",
    ink: "#0A0B08",
    subInk: "#3D3A34",
    barInk: "#0A0B08",
    isChroma: false,
    isOrange: false,
  },
  black: {
    id: "black",
    label: "炭墨黑",
    en: "CARBON",
    fill: "#121411",
    ink: "#F6E9D7",
    subInk: "#D8CEBE",
    barInk: "#F6E9D7",
    isChroma: false,
    isOrange: false,
  },
};

export const SURFACE_CYCLE = ["cream", "orange", "cyan", "black"];

export const SPECIMENS = {
  banner: {
    id: "banner",
    num: "Ⅰ",
    name: "顶通焦块",
    en: "TOP BANNER",
    summary: "顶部通栏先定视觉入口，下分左窄竖焦与右宽正文，底条收束。",
    presetSurfaces: { hero: "cyan", guide: "orange", body: "cream", meta: "orange" },
    altSurfaces: { hero: "orange", guide: "cyan", body: "cream", meta: "black" },
    // 归一化网格区间 [x0, y0, x1, y1] (0..1)
    zones: {
      hero: [0, 0, 1, 0.34],
      guide: [0, 0.34, 0.34, 1],
      body: [0.34, 0.34, 1, 0.82],
      meta: [0.34, 0.82, 1, 1],
    },
    decor: { guideStyle: "pillar", metaStyle: "strip" },
  },
  cards: {
    id: "cards",
    num: "Ⅱ",
    name: "上图三格",
    en: "HERO + 3 CELLS",
    summary: "左上图形焦块配右上标题段落，中段黑带横切，底沿三等分导览块。",
    presetSurfaces: { hero: "orange", body: "cream", meta: "black", guide: "cyan" },
    altSurfaces: { hero: "cyan", body: "cream", meta: "black", guide: "orange" },
    zones: {
      hero: [0, 0, 0.42, 0.50],
      body: [0.42, 0, 1, 0.50],
      meta: [0, 0.50, 1, 0.68],
      guide: [0, 0.68, 1, 1],
    },
    decor: { guideStyle: "triplets", metaStyle: "band" },
  },
  rail: {
    id: "rail",
    num: "Ⅲ",
    name: "左侧青轨",
    en: "INDEX RAIL",
    summary: "左缘窄轨放三点目录坐标，右主区上宽文、下分双色对比块。",
    presetSurfaces: { guide: "cyan", body: "cream", hero: "orange", meta: "cyan" },
    altSurfaces: { guide: "black", body: "cream", hero: "orange", meta: "cyan" },
    zones: {
      guide: [0, 0, 0.21, 1],
      body: [0.21, 0, 1, 0.58],
      hero: [0.21, 0.58, 0.64, 1],
      meta: [0.64, 0.58, 1, 1],
    },
    decor: { guideStyle: "dots3", metaStyle: "box" },
  },
  lblock: {
    id: "lblock",
    num: "Ⅳ",
    name: "橙面点阵",
    en: "DOMINANT FIELD",
    summary: "左大幅强色宣言块主导全局，右嵌点阵导览柱，底沿轻块承接正文与注脚。",
    presetSurfaces: { hero: "orange", guide: "cyan", body: "cream", meta: "black" },
    altSurfaces: { hero: "cyan", guide: "orange", body: "cream", meta: "black" },
    zones: {
      hero: [0, 0, 0.64, 0.64],
      guide: [0.64, 0, 1, 0.80],
      body: [0, 0.64, 0.64, 1],
      meta: [0.64, 0.80, 1, 1],
    },
    decor: { guideStyle: "dotgrid", metaStyle: "foot" },
  },
};

export const THEMES = {
  exhibition: {
    id: "exhibition",
    name: "展讯海报",
    en: "EXHIBITION",
    blocks: {
      hero: {
        role: "主标焦区",
        tag: "01 主视觉 / 标题",
        title: "构筑与边界",
        sub: "2026 现代平面秩序年展",
      },
      guide: {
        role: "导引索引",
        tag: "02 展期与动线",
        title: "11.12 — 12.28",
        sub: "东馆 3F · 三大展厅导览",
      },
      body: {
        role: "正文解读",
        tag: "03 策展导读",
        title: "以几何边界重组阅读顺序",
        lines: [
          "汇集 42 件百年风格派与瑞士网格原作，",
          "拆解色块、留白与对齐如何缩减扫读阻力。",
        ],
      },
      meta: {
        role: "辅助注脚",
        tag: "04 票务与开放",
        title: "10:00–18:00 · 周一闭馆",
        sub: "早鸟票 ¥68 · 预约入场",
      },
    },
    misplaced: [
      { id: "m1", text: "早鸟票 ¥68 · 周一闭馆", wrongZone: "hero", rightZone: "meta", label: "票务错混入主标" },
      { id: "m2", text: "11.12–12.28 东馆 3F", wrongZone: "body", rightZone: "guide", label: "展期埋进正文" },
    ],
  },
  annual: {
    id: "annual",
    name: "建筑年鉴",
    en: "ANNUAL REPORT",
    blocks: {
      hero: {
        role: "主标焦区",
        tag: "01 年度封面",
        title: "城市公共空间",
        sub: "2026 华东更新实录",
      },
      guide: {
        role: "核心指标",
        tag: "02 关键目录",
        title: "18 座旧厂更新",
        sub: "交通 / 绿廊 / 社区三卷",
      },
      body: {
        role: "正文综述",
        tag: "03 编者按",
        title: "从零散改造转向片区协同",
        lines: [
          "收录 36 组建筑剖面与街道测绘样本，",
          "对照改造前后人行可达性与昼夜活力。",
        ],
      },
      meta: {
        role: "出版版权",
        tag: "04 卷期信息",
        title: "VOL.14 · 精装 288 页",
        sub: "建筑营造研究所编印",
      },
    },
    misplaced: [
      { id: "m1", text: "VOL.14 · 精装 288 页", wrongZone: "hero", rightZone: "meta", label: "版权错混入封面" },
      { id: "m2", text: "18 座旧厂更新目录", wrongZone: "body", rightZone: "guide", label: "目录埋进正文" },
    ],
  },
  guide: {
    id: "guide",
    name: "城市导览",
    en: "CITY GUIDE",
    blocks: {
      hero: {
        role: "主标焦区",
        tag: "01 片区标题",
        title: "老码头步行圈",
        sub: "半日慢行手绘地图",
      },
      guide: {
        role: "站点导引",
        tag: "02 三大打卡点",
        title: "钟楼 → 仓房 → 渡口",
        sub: "全程 2.4 公里 · 约 50 分钟",
      },
      body: {
        role: "街区介绍",
        tag: "03 行走提示",
        title: "沿红砖仓库看百年航运印记",
        lines: [
          "午后四点江风柔和，适合沿亲水栈道",
          "串游三座旧粮仓改建的书店与展亭。",
        ],
      },
      meta: {
        role: "交通贴士",
        tag: "04 出行注脚",
        title: "地铁 4 号线南口出",
        sub: "轮渡末班 21:30 · 免费开放",
      },
    },
    misplaced: [
      { id: "m1", text: "轮渡末班 21:30", wrongZone: "hero", rightZone: "meta", label: "交通注脚混入主标" },
      { id: "m2", text: "钟楼→仓房→渡口 2.4km", wrongZone: "body", rightZone: "guide", label: "路线埋进街区介绍" },
    ],
  },
};

export const POSTER_PRINCIPLES = [
  { id: "grouping", title: "信息分组", en: "GROUPING", body: "将相关内容归为一组，形成清晰的内容单元。" },
  { id: "zoning", title: "区域划分", en: "ZONING", body: "用区块界定不同区域，明确内容的功能与边界。" },
  { id: "hierarchy", title: "层级建立", en: "HIERARCHY", body: "通过大小、位置与色彩，建立主次关系与阅读顺序。" },
  { id: "contrast", title: "对比强化", en: "CONTRAST", body: "借助色彩、尺寸与留白，突出重点，吸引注意力。" },
  { id: "structure", title: "结构清晰", en: "STRUCTURE", body: "以稳定的结构组织内容，提升整体秩序与可识别性。" },
];

export const FLAT_ZONES = {
  hero: [0, 0, 0.51, 0.50],
  guide: [0.51, 0, 1, 0.50],
  body: [0, 0.50, 0.49, 1],
  meta: [0.49, 0.50, 1, 1],
};

// 错位散架态的确定性偏移（按像素，单真源记录）
const JITTER_OFFSETS = {
  hero: { dx: -8, dy: 5, dw: -10, dh: -6 },
  guide: { dx: 11, dy: -7, dw: -8, dh: 6 },
  body: { dx: 13, dy: 9, dw: -12, dh: -8 },
  meta: { dx: -9, dy: -6, dw: 14, dh: -4 },
};

export function createBrokenState() {
  return {
    specimen: "banner",
    theme: "exhibition",
    gutter: 0,
    hierarchyMode: "flat",
    structureMode: "jitter",
    grouped: false,
    surfaces: {
      hero: "cream",
      guide: "cream",
      body: "cream",
      meta: "cream",
    },
    squint: false,
    xray: false,
    highlightPrinciple: null,
  };
}

export function createSolvedState(specimen = "banner", alt = false) {
  const spec = SPECIMENS[specimen] || SPECIMENS.banner;
  return {
    specimen: spec.id,
    theme: "exhibition",
    gutter: 14,
    hierarchyMode: "hierarchical",
    structureMode: "aligned",
    grouped: true,
    surfaces: { ...(alt ? spec.altSurfaces : spec.presetSurfaces) },
    squint: false,
    xray: false,
    highlightPrinciple: null,
  };
}

export const clampGutter = (v) => Math.max(0, Math.min(40, Math.round(v)));

// 由当前状态与画布逻辑尺寸算出全部区块实绘矩形（唯一几何真源）
export function computeLayout(state, width, height) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.banner;
  const g = clampGutter(state.gutter);
  // 外边框随沟槽缩放，保证 0px 时真正粘连成平铺堆叠纸墙
  const outerPad = g === 0 ? 10 : Math.min(28, Math.max(10, Math.round(g * 0.95 + 4)));
  const innerX = outerPad;
  const innerY = outerPad;
  const innerW = Math.max(120, width - outerPad * 2);
  const innerH = Math.max(120, height - outerPad * 2);

  const zoneMap = state.hierarchyMode === "flat" ? FLAT_ZONES : spec.zones;
  const order = ["hero", "guide", "body", "meta"];
  const blocks = [];
  let maxEdgeDrift = 0;

  for (const id of order) {
    const [u0, v0, u1, v1] = zoneMap[id];
    const halfL = u0 > 0.001 ? g / 2 : 0;
    const halfR = u1 < 0.999 ? g / 2 : 0;
    const halfT = v0 > 0.001 ? g / 2 : 0;
    const halfB = v1 < 0.999 ? g / 2 : 0;

    let x = innerX + u0 * innerW + halfL;
    let y = innerY + v0 * innerH + halfT;
    let w = Math.max(24, (u1 - u0) * innerW - halfL - halfR);
    let h = Math.max(24, (v1 - v0) * innerH - halfT - halfB);

    let drift = 0;
    if (state.structureMode === "jitter") {
      const j = JITTER_OFFSETS[id];
      const scale = Math.min(1, width / 560);
      const dx = Math.round(j.dx * scale);
      const dy = Math.round(j.dy * scale);
      const dw = Math.round(j.dw * scale);
      const dh = Math.round(j.dh * scale);
      x = Math.max(4, x + dx);
      y = Math.max(4, y + dy);
      w = Math.max(28, Math.min(width - x - 4, w + dw));
      h = Math.max(28, Math.min(height - y - 4, h + dh));
      drift = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dw), Math.abs(dh));
      maxEdgeDrift = Math.max(maxEdgeDrift, drift);
    }

    const surface = state.surfaces[id] || "cream";
    const area = w * h;

    if (state.structureMode === "shattered") {
      // 过碎压测：把每块硬拆成 2 块，形成 8 碎块（超出工作记忆 3–5 块速扫带）
      const splitVert = w >= h;
      const sg = Math.max(4, Math.min(12, g || 6));
      if (splitVert) {
        const w1 = Math.max(16, (w - sg) * 0.52);
        const w2 = Math.max(16, w - sg - w1);
        blocks.push({ id, subIndex: 0, primary: true, x, y, w: w1, h, area: w1 * h, surface, drift: 0 });
        blocks.push({ id: `${id}_frag`, parentId: id, subIndex: 1, primary: false, x: x + w1 + sg, y, w: w2, h, area: w2 * h, surface, drift: 0 });
      } else {
        const h1 = Math.max(16, (h - sg) * 0.52);
        const h2 = Math.max(16, h - sg - h1);
        blocks.push({ id, subIndex: 0, primary: true, x, y, w, h: h1, area: w * h1, surface, drift: 0 });
        blocks.push({ id: `${id}_frag`, parentId: id, subIndex: 1, primary: false, x, y: y + h1 + sg, w, h: h2, area: w * h2, surface, drift: 0 });
      }
    } else {
      blocks.push({ id, subIndex: 0, primary: true, x, y, w, h, area, surface, drift });
    }
  }

  const totalBlockArea = blocks.reduce((s, b) => s + b.area, 0) || 1;
  const frameArea = innerW * innerH || 1;
  const gutterAreaRatio = Math.max(0, Math.min(0.65, 1 - totalBlockArea / frameArea));

  // 主区域合并面积（shattered 态下仍能统计单块与角色占比）
  const roleArea = { hero: 0, guide: 0, body: 0, meta: 0 };
  const surfaceArea = { orange: 0, cyan: 0, cream: 0, black: 0 };
  for (const b of blocks) {
    const key = b.parentId || b.id;
    if (roleArea[key] !== undefined) roleArea[key] += b.area;
    surfaceArea[b.surface] = (surfaceArea[b.surface] || 0) + b.area;
    b.areaPct = Math.round((b.area / totalBlockArea) * 100);
  }

  const areas = blocks.map((b) => b.area);
  const maxArea = Math.max(...areas);
  const minArea = Math.max(1, Math.min(...areas));
  const dominanceRatio = maxArea / minArea;

  const surfacePct = {
    orange: Math.round((surfaceArea.orange / totalBlockArea) * 100),
    cyan: Math.round((surfaceArea.cyan / totalBlockArea) * 100),
    cream: Math.round((surfaceArea.cream / totalBlockArea) * 100),
    black: Math.round((surfaceArea.black / totalBlockArea) * 100),
  };

  return {
    width,
    height,
    outerPad,
    innerRect: { x: innerX, y: innerY, w: innerW, h: innerH },
    gutter: g,
    gutterAreaPct: Math.round(gutterAreaRatio * 100),
    blocks,
    chunkCount: blocks.length,
    dominanceRatio,
    heroAreaPct: Math.round((roleArea.hero / totalBlockArea) * 100),
    bodyAreaPct: Math.round((roleArea.body / totalBlockArea) * 100),
    maxEdgeDrift,
    surfacePct,
    chromaPct: surfacePct.orange + surfacePct.cyan,
    calmPct: surfacePct.cream + surfacePct.black,
    spec,
  };
}

// 9 类失误与五原则实时诊断（完全基于实绘 layout 计算）
export function evaluate(state, layout) {
  const theme = THEMES[state.theme] || THEMES.exhibition;
  const g = layout.gutter;
  const shattered = layout.chunkCount > 5;
  const misplacedCount = state.grouped ? 0 : theme.misplaced.length;

  // 1. 信息分组 GROUPING
  const groupingOk = state.grouped && !shattered;
  const groupingStatus = !state.grouped
    ? `错组 ${misplacedCount} 项`
    : shattered
    ? `过碎 ${layout.chunkCount} 块`
    : `${layout.chunkCount} 组清晰`;

  // 2. 区域划分 ZONING
  const zoningTooTight = g < 8;
  const zoningTooWide = g > 24;
  const zoningOk = !zoningTooTight && !zoningTooWide;
  const zoningStatus = zoningTooTight
    ? `${g}px 粘连`
    : zoningTooWide
    ? `${g}px 过厚`
    : `${g}px 清晰`;

  // 3. 层级建立 HIERARCHY
  const dom = layout.dominanceRatio;
  const hierarchyOk = dom >= 1.65 && state.hierarchyMode === "hierarchical";
  const hierarchyStatus = hierarchyOk ? `${dom.toFixed(1)}× 分明` : `${dom.toFixed(1)}× 平权`;

  // 4. 对比强化 CONTRAST
  const bodySurface = state.surfaces.body;
  const bodyGlare = bodySurface === "orange" || bodySurface === "cyan";
  const largeOrangeBlocks = layout.blocks.filter((b) => b.primary && b.surface === "orange" && b.areaPct >= 20).length;
  const noFocus = layout.chromaPct < 12;
  const multiClash = largeOrangeBlocks >= 2 || layout.calmPct < 18;
  const contrastOk = !noFocus && !bodyGlare && !multiClash;
  const contrastStatus = noFocus
    ? "缺焦色"
    : bodyGlare
    ? "正文过刺"
    : multiClash
    ? "多焦互抢"
    : `焦色 ${layout.chromaPct}%`;

  // 5. 结构清晰 STRUCTURE
  const drift = layout.maxEdgeDrift;
  const structureOk = drift <= 2 && !shattered;
  const structureStatus = drift > 2
    ? `错边 ${drift}px`
    : shattered
    ? `${layout.chunkCount} 块散碎`
    : "齐边咬合";

  const principles = {
    grouping: { ok: groupingOk, status: groupingStatus },
    zoning: { ok: zoningOk, status: zoningStatus },
    hierarchy: { ok: hierarchyOk, status: hierarchyStatus },
    contrast: { ok: contrastOk, status: contrastStatus },
    structure: { ok: structureOk, status: structureStatus },
  };

  const passCount = Object.values(principles).filter((p) => p.ok).length;

  // 按视觉破坏力优先级输出单条主诊断（白话讲清「是什么 + 为什么 + 怎么调」）
  let diagnosis;
  if (zoningTooTight) {
    diagnosis = {
      code: "boundary_fused",
      ok: false,
      badge: `错态 · 无界堆叠 (${passCount}/5)`,
      headline: `区块沟槽仅 ${g}px，四组信息糊成一堵文字墙`,
      reason: "格式塔「共同区域」需要足够宽的界线或留白把内容隔开。沟槽缩到 8px 以下时，相邻文字与图块彼此粘连，人眼分不清哪里结束、哪里开始。",
      nextStep: "在画布上向右横向拖动，把炭黑边界沟槽撬开到 10–22px 经验参考带。",
    };
  } else if (zoningTooWide) {
    diagnosis = {
      code: "boundary_prison",
      ok: false,
      badge: `错态 · 过厚割裂 (${passCount}/5)`,
      headline: `沟槽涨到 ${g}px，黑框吃掉 ${layout.gutterAreaPct}% 版面反客为主`,
      reason: "边界太厚会把区块切成彼此孤立的铁笼，信息之间的整体关联被强行斩断，内部正文也被挤成短碎残行。",
      nextStep: "在画布上向左轻轻拖回，将边界沟槽收回 10–22px 清晰带。",
    };
  } else if (shattered) {
    diagnosis = {
      code: "over_shattered",
      ok: false,
      badge: `错态 · 切块过碎 (${passCount}/5)`,
      headline: `版面被硬拆成 ${layout.chunkCount} 块碎片，超出速扫负荷`,
      reason: "工作记忆在单次注视里大约只能稳定把握 3–5 个视觉组块（Cowan 2001）。强行切出 8 块碎框，读者反而得像扫表格一样逐格搜寻。",
      nextStep: "在结构控钮中切回「齐边咬合」，把碎片合并回 4 个核心功能区块。",
    };
  } else if (!state.grouped) {
    diagnosis = {
      code: "misgrouped",
      ok: false,
      badge: `错态 · 错组混装 (${passCount}/5)`,
      headline: `仍有 ${misplacedCount} 项信息错塞在无关区块里`,
      reason: "区块的闭合边界比文字意思更先被大脑读取。票务或展期被框进错误的区域，读者会本能以为它们和标题是一回事，扫读立刻走岔。",
      nextStep: "直接点击画布里带红框虚线的错位标签将其归位，或按下「语义归组」。",
    };
  } else if (!hierarchyOk) {
    diagnosis = {
      code: "flat_equal",
      ok: false,
      badge: `错态 · 平权均分 (${passCount}/5)`,
      headline: `四块面积跨比仅 ${dom.toFixed(1)}×，没有第一落眼处`,
      reason: "四块几乎一样大时，大脑无法立刻判断谁是主信息、谁是补充说明，视线会在四个方块之间来回犹豫。",
      nextStep: "按下「拉开层级」或在顶沿切换原海报四款非对称骨架，让主块与辅块面积跨比达到 1.7× 以上。",
    };
  } else if (bodyGlare) {
    diagnosis = {
      code: "body_glare",
      ok: false,
      badge: `错态 · 正文过刺 (${passCount}/5)`,
      headline: `长文阅读区涂成了${PALETTE[bodySurface].label}，视线发累且丢了主焦`,
      reason: "高饱和信号橙与电光青适合承载短标题、导引轨或重点标记；把多行正文铺在高饱和实色块上会放大视觉疲劳，并抢走主标题的风头。",
      nextStep: "直接点击画布里的正文块，把它切回「暖骨纸」或「炭墨黑」安静阅读面。",
    };
  } else if (noFocus) {
    diagnosis = {
      code: "no_focus",
      ok: false,
      badge: `错态 · 全淡无焦 (${passCount}/5)`,
      headline: "全幅缺少高对比焦块，眯眼 3 秒只剩一片平淡灰面",
      reason: "区块式版式不只靠线框切分，更靠色彩极性拉开主次。全用浅纸底时，所有区块视觉重量趋同，读者找不到入口。",
      nextStep: "直接点击画布里的主标区或导引区，涂上一块信号橙或电光青建立焦色锚点。",
    };
  } else if (multiClash) {
    diagnosis = {
      code: "multi_clash",
      ok: false,
      badge: `错态 · 多焦互抢 (${passCount}/5)`,
      headline: `大面积强色过满（留给静底仅 ${layout.calmPct}%），区块彼此抢戏`,
      reason: "当两块以上大面积同涂炙橙、或四块塞满强色几乎不留浅纸缓冲时，对比反而互相抵消，画面变得噪杂窒息。",
      nextStep: "点击其中一块强色区块改回「暖骨纸」或「炭墨黑」，保留 1 处主焦与足够浅底呼吸区。",
    };
  } else if (drift > 2) {
    diagnosis = {
      code: "unaligned_drift",
      ok: false,
      badge: `错态 · 错位散架 (${passCount}/5)`,
      headline: `外框与内缝存在 ${drift}px 错边，失去建筑咬合感`,
      reason: "人眼极擅长捕捉外沿直线与齐缝延长线。区块各自偏移几像素，整体就会从稳重的区块式退化成歪斜的贴纸墙。",
      nextStep: "按下「齐边咬合」把四块的外缘与内缝锁回同一套隐形结构轴。",
    };
  } else {
    const orangePct = layout.surfacePct.orange;
    const cyanPct = layout.surfacePct.cyan;
    const schemeNote =
      orangePct > 0 && cyanPct > 0
        ? `橙焦 ${orangePct}% + 青导 ${cyanPct}% + 静底 ${layout.calmPct}%`
        : orangePct > 0
        ? `单橙主焦 ${orangePct}% 配静底 ${layout.calmPct}%`
        : `单青主焦 ${cyanPct}% 配静底 ${layout.calmPct}%`;
    diagnosis = {
      code: "solved",
      ok: true,
      badge: `成序 · ${layout.spec.num} ${layout.spec.name} (5/5)`,
      headline: `五项全达标：${g}px 清晰沟槽、${dom.toFixed(1)}× 层级跨比、${schemeNote}`,
      reason: "相关内容已收束进 4 个对齐的共同区域，单一主焦先抓视线、暖纸承接正文，开启「眯眼 3 秒实测」仍能一眼分辨轻重顺序。",
      nextStep: "试试切换另外三款原海报骨架、或点任意区块改配色组合，验证多组正当解（也可故意拖到 34px 压测过厚割裂）。",
    };
  }

  return {
    passCount,
    total: 5,
    ok: passCount === 5,
    principles,
    diagnosis,
  };
}
