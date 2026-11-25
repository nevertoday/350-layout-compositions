// 194 手稿网格 · 单一真源数据与几何核算模型
// 所有版心坐标、边距百分比、每行字数、拇指遮挡、古典九分基准与五项原则判定均由此模块算出。

export const PALETTE = {
  paper: "#F8F4EA",
  paperLight: "#FBF8F1",
  gridFill: "#F3EBDC",
  gridLine: "#E2D9C6",
  sand: "#EFE7D6",
  borderWarm: "#9B8868",
  borderSoft: "#CBBCA2",
  cinnabar: "#902004",
  cinnabarBright: "#A82A0A",
  cinnabarSoft: "rgba(144, 32, 4, 0.12)",
  olive: "#645828",
  oliveDeep: "#49401A",
  olivePass: "#3C5426",
  olivePassSoft: "rgba(60, 84, 38, 0.13)",
  ink: "#1B1915",
  inkMuted: "#504B42",
  darkChamber: "#201C12",
  darkLine: "#473E29",
  darkPaper: "#F5EEE0",
  darkCinnabar: "#E87A5C",
  darkOlive: "#C2B16F",
  darkPass: "#A7C780",
};

export const FORMATS = {
  classic23: {
    id: "classic23",
    label: "2:3 经典开本",
    short: "2:3 经典",
    ratio: 2 / 3, // width / height
    fullChars: 46, // 满宽 100% 时可容纳的标准中文书体字数（以 148mm / 3.22mm 字宽计）
    note: "传统人文书常用的 2:3 比例，天头地脚与版心自成 2:3:4:6 秩序。",
  },
  isoA4: {
    id: "isoA4",
    label: "A4 国际开本",
    short: "A4 1:√2",
    ratio: 1 / Math.SQRT2,
    fullChars: 52, // 较宽的论文与报告纸幅
    note: "报告、论文常用的 1:√2 比例，纸面偏宽，更依赖左右边距收束行长。",
  },
  pocket: {
    id: "pocket",
    label: "口袋瘦长本",
    short: "口袋本",
    ratio: 0.618,
    fullChars: 41,
    note: "黄金比例近旁的便携开本，单手持握频繁，外缘与下缘留白尤为关键。",
  },
};

export const PRESETS = {
  broken: {
    view: "single",
    format: "classic23",
    top: 0.05,
    bottom: 0.05,
    inner: 0.05,
    outer: 0.05,
    leading: 1.18,
    clutter: true,
  },
  posterSingle: {
    view: "single",
    format: "classic23",
    top: 0.16,
    bottom: 0.22,
    inner: 0.17,
    outer: 0.17,
    leading: 1.72,
    clutter: false,
  },
  canonSpread: {
    view: "spread",
    format: "classic23",
    top: 1 / 9, // 11.1%
    bottom: 2 / 9, // 22.2%
    inner: 1 / 9, // 11.1%
    outer: 2 / 9, // 22.2%
    leading: 1.72,
    clutter: false,
  },
  islandTrap: {
    view: "single",
    format: "classic23",
    top: 0.30,
    bottom: 0.34,
    inner: 0.32,
    outer: 0.32,
    leading: 2.15,
    clutter: false,
  },
  invertedSpread: {
    view: "spread",
    format: "classic23",
    top: 0.22,
    bottom: 0.12,
    inner: 0.23,
    outer: 0.10,
    leading: 1.65,
    clutter: false,
  },
};

export const POSTER_PRINCIPLES = [
  {
    no: "01",
    key: "margins",
    title: "留白为先",
    posterBody: "边距留白创造呼吸感，让内容在空间中被看见。",
  },
  {
    no: "02",
    key: "reading",
    title: "阅读舒适",
    posterBody: "合理的行宽与行距，提升长文阅读的舒适度。",
  },
  {
    no: "03",
    key: "focus",
    title: "聚焦内容",
    posterBody: "明确的正文区，减少视觉干扰，强化专注。",
  },
  {
    no: "04",
    key: "unity",
    title: "视觉统一",
    posterBody: "网格建立稳定的秩序，使版面整洁、专业。",
  },
  {
    no: "05",
    key: "canon",
    title: "古典秩序",
    posterBody: "源自传统书写智慧，成就经得起时间考验的版面。",
  },
];

// 原创文学示范段（用于稿纸画布实时重排，贴合原海报「山川与风物」书卷气质，字数足够在错版密排时铺满全版）
export const SAMPLE_PARAGRAPHS = [
  "好书的页面并不急着把字塞满。四围安静的纸边先替眼睛挡住桌面的杂音，再把视线轻轻引回中间那一块方正的版心。",
  "行宽收在二三十字之间，眼珠从行尾折返到下一行起点，不必费力寻路；行距留出透气缝，墨色便化成均匀柔和的纸灰。",
  "托在底部的地脚比天头略厚，整块文字才不致往下坠落。翻开对开书页时，两页订口合成一道缝，外缘便宽出来承托双手的拇指。",
  "几百年来，无论是羊皮纸手抄卷、威尼斯袖珍印本，还是今天屏幕上的长文阅读页，单栏手稿始终是最耐看也最省力的容器。",
  "它从不靠花哨装饰抢走作者的声音，只借着恰到好处的留白与比例，让思绪随着墨行缓缓推进。",
  "有界之中，自成章法。当你几乎察觉不到网格存在，却不知不觉读完二十页，手稿网格才算真正完成了它的工作。",
  "若是贪心把正文一路推到纸边，再把行距压得密不透风，字行便挤成一整面发暗的灰墙；手掌刚捧住书脊，拇指就遮去半行文意。",
  "页码安静退守地脚中线，书眉轻托在天头之上，章节开篇再留出三分之一的下沉空白，全书即便只有单一版心，翻阅时仍有起伏的呼吸。",
  "好的留白从不是印完字后剩下的废纸，而是替文字撑开回音的静室：进门先慢下来，句子才听得清轻重缓急。",
  "从针孔压线的羊皮纸到锁住行宽的现代网页，载体几经更迭，而人眼一次扫视的跨度从未改变，手稿网格便一直在那里守着分寸。",
];

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createInitialState() {
  return {
    ...PRESETS.broken,
    showCanon: false,
    showThumbs: false,
    focusPrinciple: 0, // 0=无特写, 1..5 对应五条原则
    activeEdge: "outer",
  };
}

// 拖拽时的柔和磁吸（仅在接近经典目标时轻微吸附）
export function snapMargin(edge, value, view) {
  const targets =
    view === "spread"
      ? {
          inner: [1 / 9],
          top: [1 / 9, 0.14],
          outer: [2 / 9],
          bottom: [2 / 9, 0.25],
        }
      : {
          inner: [0.17],
          outer: [0.17],
          top: [0.16],
          bottom: [0.22],
        };
  const tol = 0.011;
  for (const t of targets[edge] || []) {
    if (Math.abs(value - t) <= tol) return { value: t, snapped: true };
  }
  return { value, snapped: false };
}

// 约束边距范围，保证版心始终至少保留 18% 宽与 20% 高
export function constrainMargins(state) {
  state.top = clamp(state.top, 0.03, 0.38);
  state.bottom = clamp(state.bottom, 0.03, 0.40);
  if (state.top + state.bottom > 0.76) {
    const excess = state.top + state.bottom - 0.76;
    state.top -= excess * 0.5;
    state.bottom -= excess * 0.5;
  }
  state.inner = clamp(state.inner, 0.03, 0.38);
  state.outer = clamp(state.outer, 0.03, 0.38);
  if (state.inner + state.outer > 0.74) {
    const excess = state.inner + state.outer - 0.74;
    state.inner -= excess * 0.5;
    state.outer -= excess * 0.5;
  }
  state.leading = clamp(state.leading, 1.15, 2.25);
  return state;
}

// 计算单页或双页在指定画布像素空间中的精确几何坐标
export function computeStageLayout(state, W, H) {
  const fmt = FORMATS[state.format] || FORMATS.classic23;
  const padTop = state.view === "spread" ? Math.max(46, H * 0.11) : Math.max(44, H * 0.105);
  const padBot = state.view === "spread" ? Math.max(46, H * 0.115) : Math.max(46, H * 0.11);
  const padSide = state.view === "spread" ? Math.max(44, W * 0.085) : Math.max(58, W * 0.145);

  const availW = Math.max(120, W - padSide * 2);
  const availH = Math.max(120, H - padTop - padBot);

  let pageW, pageH, pages;
  if (state.view === "spread") {
    const spreadRatio = fmt.ratio * 2;
    if (availW / availH > spreadRatio) {
      pageH = availH;
      pageW = pageH * fmt.ratio;
    } else {
      pageW = availW / 2;
      pageH = pageW / fmt.ratio;
    }
    const leftX = (W - pageW * 2) / 2;
    const topY = padTop + (availH - pageH) / 2;
    const rightX = leftX + pageW;

    const makeTextRect = (px, side) => {
      const mL = side === "left" ? state.outer * pageW : state.inner * pageW;
      const mR = side === "left" ? state.inner * pageW : state.outer * pageW;
      const mT = state.top * pageH;
      const mB = state.bottom * pageH;
      return {
        x: px + mL,
        y: topY + mT,
        w: Math.max(12, pageW - mL - mR),
        h: Math.max(12, pageH - mT - mB),
      };
    };

    const makeCanonRect = (px, side) => {
      const mL = side === "left" ? (2 / 9) * pageW : (1 / 9) * pageW;
      const mR = side === "left" ? (1 / 9) * pageW : (2 / 9) * pageW;
      return {
        x: px + mL,
        y: topY + (1 / 9) * pageH,
        w: (6 / 9) * pageW,
        h: (6 / 9) * pageH,
      };
    };

    pages = [
      {
        side: "left",
        folio: "028",
        x: leftX,
        y: topY,
        w: pageW,
        h: pageH,
        text: makeTextRect(leftX, "left"),
        canon: makeCanonRect(leftX, "left"),
      },
      {
        side: "right",
        folio: "029",
        x: rightX,
        y: topY,
        w: pageW,
        h: pageH,
        text: makeTextRect(rightX, "right"),
        canon: makeCanonRect(rightX, "right"),
      },
    ];
    return {
      view: "spread",
      fmt,
      pageW,
      pageH,
      spineX: rightX,
      bounds: { x: leftX, y: topY, w: pageW * 2, h: pageH },
      pages,
      primary: pages[1], // 右页为主控标注页
    };
  } else {
    if (availW / availH > fmt.ratio) {
      pageH = availH;
      pageW = pageH * fmt.ratio;
    } else {
      pageW = availW;
      pageH = pageW / fmt.ratio;
    }
    const px = (W - pageW) / 2;
    const py = padTop + (availH - pageH) / 2;
    const text = {
      x: px + state.inner * pageW,
      y: py + state.top * pageH,
      w: Math.max(12, (1 - state.inner - state.outer) * pageW),
      h: Math.max(12, (1 - state.top - state.bottom) * pageH),
    };
    // 单页古典推荐对照框（16% 上 / 22% 下 / 17% 左右，贴合原海报单页标尺）
    const canon = {
      x: px + 0.17 * pageW,
      y: py + 0.16 * pageH,
      w: 0.66 * pageW,
      h: 0.62 * pageH,
    };
    const p = { side: "single", folio: "029", x: px, y: py, w: pageW, h: pageH, text, canon };
    return {
      view: "single",
      fmt,
      pageW,
      pageH,
      spineX: null,
      bounds: { x: px, y: py, w: pageW, h: pageH },
      pages: [p],
      primary: p,
    };
  }
}

// 真实折行函数（供画布与模型共用，确保单真源）
export function wrapChineseParagraphs(paragraphs, charsPerLine) {
  const cpl = Math.max(8, Math.round(charsPerLine));
  const lines = [];
  const noLineStart = new Set(["，", "。", "、", "；", "：", "？", "！", "”", "」", "）"]);
  paragraphs.forEach((para, pi) => {
    const chars = [...para];
    let i = 0;
    let first = true;
    while (i < chars.length) {
      const cap = first ? Math.max(6, cpl - 2) : cpl;
      let take = Math.min(cap, chars.length - i);
      // 简单避头点处理：避免标点单独落行首
      if (i + take < chars.length && noLineStart.has(chars[i + take]) && take > 6) {
        take += 1;
      }
      lines.push({ text: chars.slice(i, i + take).join(""), indent: first, para: pi });
      i += take;
      first = false;
    }
    if (pi < paragraphs.length - 1) {
      lines.push({ text: "", indent: false, para: pi, gap: true });
    }
  });
  return lines;
}

// 估算拇指握持区（外缘与底缘）侵入正文区的比例（0 = 完全避开，>0 = 遮字）
export function computeThumbIntrusion(state) {
  // 真实捧书时，右手拇指搭在外侧边缘，侵入页面约 12.5% 宽、位于页面中下部 58%–84% 高处；
  // 底部托手侵入页面底部约 11.5% 高。
  const outerNeed = 0.125;
  const bottomNeed = 0.115;
  const sideOverlap = Math.max(0, outerNeed - state.outer);
  const leftOverlap = state.view === "single" ? Math.max(0, outerNeed - state.inner) : 0;
  const bottomOverlap = Math.max(0, bottomNeed - state.bottom);
  const maxOverlap = Math.max(sideOverlap, leftOverlap, bottomOverlap);
  const covered = maxOverlap > 0.005;
  const charsHit = covered ? Math.max(1, Math.round(maxOverlap * 42)) : 0;
  return { covered, sideOverlap, leftOverlap, bottomOverlap, charsHit };
}

// 核心单真源评估函数
export function evaluateManuscript(state) {
  const fmt = FORMATS[state.format] || FORMATS.classic23;
  const textWFrac = Math.max(0.1, 1 - state.inner - state.outer);
  const textHFrac = Math.max(0.1, 1 - state.top - state.bottom);
  const textAreaFrac = textWFrac * textHFrac;
  const whitespaceFrac = 1 - textAreaFrac;

  // 干扰插块会挤占正文区约 28% 的有效宽度，也会破坏纯净单栏流
  const effectiveWFrac = state.clutter ? textWFrac * 0.72 : textWFrac;
  const charsPerLine = Math.max(8, Math.round(fmt.fullChars * textWFrac));
  const clutteredChars = Math.max(8, Math.round(fmt.fullChars * effectiveWFrac));

  // 物理长度比例（以页面宽度 = 1，页面高度 = 1 / fmt.ratio 折算）
  const hScale = 1 / fmt.ratio;
  const innerPhys = state.inner;
  const outerPhys = state.outer;
  const topPhys = state.top * hScale;
  const bottomPhys = state.bottom * hScale;
  const minPhys = Math.max(0.01, Math.min(innerPhys, outerPhys, topPhys, bottomPhys));
  const ratioTuple = [
    +(innerPhys / minPhys).toFixed(1),
    +(topPhys / minPhys).toFixed(1),
    +(outerPhys / minPhys).toFixed(1),
    +(bottomPhys / minPhys).toFixed(1),
  ];

  // 版心垂直光学重心偏移（正值代表版心高于几何中心，视觉更稳）
  const centerLiftPct = ((state.bottom - state.top) * 0.5) * 100;
  const textAspect = (textWFrac * fmt.ratio) / textHFrac;
  const aspectDrift = Math.abs(textAspect - fmt.ratio) / fmt.ratio;
  const thumb = computeThumbIntrusion(state);
  const spineSum = state.inner * 2; // 双页对开时两页内边距拼出的中缝总宽（按单页宽计）

  // --- 五项原则实测判定 ---
  // 01 留白为先
  let p1Ok = false;
  let p1Short = "";
  const minMargin = Math.min(state.top, state.bottom, state.inner, state.outer);
  const maxMargin = Math.max(state.top, state.bottom, state.inner, state.outer);
  if (state.view === "spread") {
    const boundsOk =
      state.inner >= 0.085 && state.inner <= 0.185 &&
      state.top >= 0.095 && state.top <= 0.22 &&
      state.outer >= 0.16 && state.outer <= 0.29 &&
      state.bottom >= 0.175 && state.bottom <= 0.31;
    p1Ok = boundsOk && whitespaceFrac >= 0.42 && whitespaceFrac <= 0.68;
  } else {
    const boundsOk =
      state.top >= 0.12 && state.top <= 0.235 &&
      state.bottom >= 0.165 && state.bottom <= 0.295 &&
      state.inner >= 0.125 && state.inner <= 0.255 &&
      state.outer >= 0.125 && state.outer <= 0.255;
    p1Ok = boundsOk && whitespaceFrac >= 0.42 && whitespaceFrac <= 0.68;
  }
  if (p1Ok) {
    p1Short = `留白 ${Math.round(whitespaceFrac * 100)}% · 舒展`;
  } else if (minMargin < 0.10 || whitespaceFrac < 0.42) {
    p1Short = `留白 ${Math.round(whitespaceFrac * 100)}% · 窒息`;
  } else if (whitespaceFrac > 0.68 || maxMargin > 0.31) {
    p1Short = `留白 ${Math.round(whitespaceFrac * 100)}% · 过空`;
  } else {
    p1Short = `某侧失衡 · 需微调`;
  }

  // 02 阅读舒适（行宽 22-34 字 且 行距 1.50-1.98× 且宽行须配较松行距）
  const minLeadingForMeasure = charsPerLine >= 31 ? 1.56 : 1.50;
  const measureOk = charsPerLine >= 22 && charsPerLine <= 34;
  const leadingOk = state.leading >= minLeadingForMeasure && state.leading <= 1.98;
  const p2Ok = measureOk && leadingOk;
  let p2Short = "";
  if (p2Ok) {
    p2Short = `${charsPerLine} 字/行 · ${state.leading.toFixed(2)}×`;
  } else if (charsPerLine > 34) {
    p2Short = `${charsPerLine} 字 · 过长`;
  } else if (charsPerLine < 22) {
    p2Short = `${charsPerLine} 字 · 过碎`;
  } else if (state.leading < minLeadingForMeasure) {
    p2Short = `行距 ${state.leading.toFixed(2)}× · 偏紧`;
  } else {
    p2Short = `行距 ${state.leading.toFixed(2)}× · 散行`;
  }

  // 03 聚焦内容（无干扰插块，单栏纯净，页码未撞底行）
  const folioClear = state.bottom >= 0.12;
  const p3Ok = !state.clutter && folioClear;
  const p3Short = state.clutter
    ? "插块抢戏 · 断流"
    : !folioClear
      ? "页码逼近正文"
      : "单栏纯净专注";

  // 04 视觉统一（下边距明显大于上边距以稳重心；单页左右对称 / 对开内窄外宽）
  const verticalGrounded = state.bottom >= state.top + 0.025;
  const horizHarmonious =
    state.view === "spread"
      ? state.outer >= state.inner + 0.04 && state.inner <= state.outer * 0.78
      : Math.abs(state.inner - state.outer) <= 0.04;
  const p4Ok = verticalGrounded && horizHarmonious;
  let p4Short = "";
  if (p4Ok) {
    p4Short = state.view === "spread" ? "内窄外宽 · 地托天" : "左右齐平 · 地托天";
  } else if (!horizHarmonious) {
    p4Short = state.view === "spread" ? "订口过宽 · 中缝裂" : "左右偏斜失衡";
  } else {
    p4Short = "地脚偏浅 · 下坠";
  }

  // 05 古典秩序（版心面积 32%-58%、长宽比贴近纸幅 ±24%、拇指不遮字）
  const areaOrderOk = textAreaFrac >= 0.32 && textAreaFrac <= 0.58;
  const propOk = aspectDrift <= 0.24;
  const p5Ok = areaOrderOk && propOk && !thumb.covered && p4Ok;
  let p5Short = "";
  if (p5Ok) {
    p5Short = `版心 ${Math.round(textAreaFrac * 100)}% · 似纸形`;
  } else if (thumb.covered) {
    p5Short = `拇指遮字 · 缺握持`;
  } else if (!areaOrderOk) {
    p5Short = textAreaFrac > 0.58 ? `版心 ${Math.round(textAreaFrac * 100)}% 过满` : `版心 ${Math.round(textAreaFrac * 100)}% 缩岛`;
  } else if (!propOk) {
    p5Short = "版心与纸幅失比例";
  } else {
    p5Short = "待稳重心与内外比";
  }

  const checks = [
    { ...POSTER_PRINCIPLES[0], ok: p1Ok, short: p1Short },
    { ...POSTER_PRINCIPLES[1], ok: p2Ok, short: p2Short },
    { ...POSTER_PRINCIPLES[2], ok: p3Ok, short: p3Short },
    { ...POSTER_PRINCIPLES[3], ok: p4Ok, short: p4Short },
    { ...POSTER_PRINCIPLES[4], ok: p5Ok, short: p5Short },
  ];
  const score = checks.filter((c) => c.ok).length;

  // --- 最高优先级白话诊断（讲清「为什么」和下一步动作） ---
  let verdictTag = "错版";
  let headline = "";
  let reason = "";
  let action = "";

  if (score === 5) {
    verdictTag = "校版通过 · 5 / 5";
    headline = state.view === "spread"
      ? "订口合缝、外地承托，这是一册耐读的对开手稿"
      : "留白托起版心，视线安稳落在连续行流里";
    reason = state.view === "spread"
      ? `内距 ${pct(state.inner)} 两页合缝为 ${pct(spineSum)}，与外距 ${pct(state.outer)} 遥相呼应；地脚 ${pct(state.bottom)} 稳稳托住天头 ${pct(state.top)}，单行 ${charsPerLine} 字配 ${state.leading.toFixed(2)}× 行距，拇指握纸不挡一字。`
      : `四周留白占整页 ${Math.round(whitespaceFrac * 100)}%，把单行稳收在 ${charsPerLine} 字、行距 ${state.leading.toFixed(2)}×；地脚 ${pct(state.bottom)} 比天头 ${pct(state.top)} 更厚，整块正文视觉上浮、不坠底。`;
    action = state.view === "single"
      ? "试试上方切换到「双页对开」，观察单页等距边距摊开成一本书后为什么会裂出中缝。"
      : "可以打开「古典九分线」或切换「A4 / 口袋本」，看看不同纸幅如何微调边距。";
  } else if (minMargin < 0.10 || whitespaceFrac < 0.42) {
    verdictTag = "错态 · 满版窒息";
    headline = `留白只剩 ${Math.round(whitespaceFrac * 100)}%，文字紧贴纸边喘不过气`;
    reason = `当前最窄边距仅 ${pct(minMargin)}，正文撑满页面 ${Math.round(textAreaFrac * 100)}%。单行被拖长到 ${charsPerLine} 字，眼睛回扫容易串行；手一捧书，拇指还会直接盖住外侧和底行的字。`;
    action = state.view === "spread"
      ? "直接向内拖拉稿纸四边：把外边距与地脚拉到 20%–25%，内边距与天头留 11%–15%。"
      : "直接在稿纸上向内拖拉四条边线（或在版心内左右拖动），让左右与上边距达到 15%–20%、下边距达到 20%–25%。";
  } else if (whitespaceFrac > 0.68 || charsPerLine < 22) {
    verdictTag = "错态 · 孤岛缩水";
    headline = `版心被压到只剩 ${Math.round(textAreaFrac * 100)}%，正文碎成窄条`;
    reason = `留白并非越多越好。现在每行只容得下 ${charsPerLine} 个汉字，句子每读两三秒就被迫折行，阅读节奏被切得支离破碎。`;
    action = "把左右边界向外拖宽一点，让单行恢复到 24–32 字的舒适宽度。";
  } else if (state.view === "spread" && state.outer < state.inner + 0.04) {
    verdictTag = "错态 · 订口反装";
    headline = `双页内距叠成 ${pct(spineSum)} 白河，外缘反倒只剩 ${pct(state.outer)}`;
    reason = "摊开一本书时，左右两页的内边距（订口）会拼成整道中缝。内边距做得和外边距一样宽甚至更宽，会把跨页从中劈成两半，外侧却窄得放不下大拇指。";
    action = "向左拖窄右侧书页的「内边距」到 11%–14%，再向内拖宽「外边距」到 20%–24%。";
  } else if (state.view === "single" && Math.abs(state.inner - state.outer) > 0.04) {
    verdictTag = "错态 · 左右偏斜";
    headline = `左边距 ${pct(state.inner)} 与右边距 ${pct(state.outer)} 拉开明显偏心`;
    reason = "单页手稿（如论文、散文单页）没有装订中缝，左右边距偏差过大时，整块版心会向一侧倾斜，读者总觉得页面没放正。";
    action = "拖齐左右两条边界，让两者落到接近的 15%–20% 区间。";
  } else if (!verticalGrounded) {
    verdictTag = "错态 · 重心下坠";
    headline = `地脚（${pct(state.bottom)}）没厚过天头（${pct(state.top)}），版心显下沉`;
    reason = "人眼的视觉中心比几何正中略偏上。当上下边距一样大或上大下小时，整块正文会像沉到纸底一样失去托举，页码也容易挤进底行。";
    action = "把下边距向上拖到 20%–25%，使其明显厚于上边距（12%–18%）。";
  } else if (state.clutter) {
    verdictTag = "错态 · 干扰破界";
    headline = "正文区插进了抢戏的装饰旁栏，打断唯一阅读流";
    reason = `手稿网格的立身之本是「聚焦内容」：用一整块完整安静的正文区换取深度沉浸。插入花哨色块后，正文被生生挤成 ${clutteredChars} 字窄栏，视线来回跳脱。`;
    action = "在稿纸下方把「干扰插块」关掉，让正文重归纯净单栏。";
  } else if (!leadingOk) {
    verdictTag = state.leading < minLeadingForMeasure ? "错态 · 行距粘连" : "错态 · 散行割裂";
    headline = state.leading < minLeadingForMeasure
      ? `行距压在 ${state.leading.toFixed(2)}×，段落板结成灰墙`
      : `行距扯到 ${state.leading.toFixed(2)}×，每行像孤立的横条`;
    reason = state.leading < minLeadingForMeasure
      ? `当前单行 ${charsPerLine} 字，较长的横扫需要足够的行间白带才能准确定位下一行起点，行距低于 ${minLeadingForMeasure.toFixed(2)}× 极易串行。`
      : "行距超过 2.0× 后，行间缝隙反客为主，段落整体感瓦解，眼睛每换行都要跨越一道宽白带。";
    action = "把稿纸下方「行距」调进 1.58×–1.85× 经验舒适带。";
  } else if (!measureOk) {
    verdictTag = "错态 · 行宽失度";
    headline = charsPerLine > 34 ? `每行 ${charsPerLine} 字仍偏长，扫视易疲` : `每行 ${charsPerLine} 字略窄，折行频繁`;
    reason = "长文单栏的中文经验舒适行长大约在 22–34 字（西文约 45–75 字符），超出这个区间，眼动回扫的精度或句子连贯性就会下降。";
    action = charsPerLine > 34 ? "略微收紧左右边距，让每行落在 24–32 字。" : "略微放宽左右边距，让每行舒展到 24–32 字。";
  } else if (thumb.covered) {
    verdictTag = "错态 · 拇指遮字";
    headline = "边缘留白还差一口气，捧书时拇指会压到文字";
    reason = "真实阅读时，手掌和拇指需要落在纸页外缘与下缘的空白里。边距不足约 12.5% 时，读者不得不不断挪手避让正文。";
    action = "打开「拇指握持区」看红色撞字区，把外边距和下边距再向外留足一点。";
  } else {
    verdictTag = "待微调 · 比例失谐";
    headline = "版心长宽比与纸张开本脱节，整体秩序不够稳";
    reason = "古典手稿网格讲究「版心像一张缩小的纸页」：当版心压得过扁或拉得过瘦时，四周边距失去呼应，页面就会显得生硬。";
    action = "微调上下或左右边距，让版心占比落在 35%–56% 且比例呼应纸幅（可开「古典九分线」对照）。";
  }

  return {
    fmt,
    textWFrac,
    textHFrac,
    textAreaFrac,
    whitespaceFrac,
    charsPerLine,
    clutteredChars,
    ratioTuple,
    centerLiftPct,
    aspectDrift,
    spineSum,
    thumb,
    checks,
    score,
    verdictTag,
    headline,
    reason,
    action,
  };
}

export const pct = (x) => `${Math.round(x * 100)}%`;

// 供第 07 节小练习与第 01 节共用：生成精准按比例绘制的双页对开 SVG 字符串
export function buildSpreadSvg(margins, { showThumbs = false, showSpineCallout = false, showLabels = false } = {}) {
  const pw = 100;
  const ph = 150; // 2:3 经典开本
  const padX = 16;
  const padY = 14;
  const W = pw * 2 + padX * 2;
  const H = ph + padY * 2;
  const lx = padX;
  const rx = padX + pw;
  const ty = padY;

  const { inner, outer, top, bottom } = margins;
  const lBox = {
    x: lx + outer * pw,
    y: ty + top * ph,
    w: (1 - inner - outer) * pw,
    h: (1 - top - bottom) * ph,
  };
  const rBox = {
    x: rx + inner * pw,
    y: ty + top * ph,
    w: (1 - inner - outer) * pw,
    h: (1 - top - bottom) * ph,
  };

  const makeLines = (box) => {
    const lineStep = 6.2;
    const count = Math.max(4, Math.floor((box.h - 6) / lineStep));
    const lines = [];
    for (let i = 0; i < count; i++) {
      const y = box.y + 4.5 + i * lineStep;
      const indent = i === 0 || i === 6 ? 7 : 0;
      const shorten = i === 5 || i === count - 1 ? box.w * 0.28 : 0;
      lines.push(
        `<line x1="${(box.x + indent).toFixed(1)}" y1="${y.toFixed(1)}" x2="${Math.max(box.x + indent + 4, box.x + box.w - shorten).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#5A5246" stroke-width="1.5" stroke-linecap="round"/>`
      );
    }
    return lines.join("");
  };

  // 拇指握持轮廓（无五官/无人像细节，纯几何柔弧）
  const thumbOverlap = outer < 0.125 || bottom < 0.115;
  const thumbFill = thumbOverlap ? "rgba(144,32,4,0.28)" : "rgba(100,88,40,0.22)";
  const thumbStroke = thumbOverlap ? "#902004" : "#645828";
  const thumbsMarkup = showThumbs
    ? `
      <ellipse cx="${(lx + 7).toFixed(1)}" cy="${(ty + ph * 0.72).toFixed(1)}" rx="12" ry="20" transform="rotate(-14 ${(lx + 7).toFixed(1)} ${(ty + ph * 0.72).toFixed(1)})" fill="${thumbFill}" stroke="${thumbStroke}" stroke-width="1.2" stroke-dasharray="3 2"/>
      <ellipse cx="${(rx + pw - 7).toFixed(1)}" cy="${(ty + ph * 0.72).toFixed(1)}" rx="12" ry="20" transform="rotate(14 ${(rx + pw - 7).toFixed(1)} ${(ty + ph * 0.72).toFixed(1)})" fill="${thumbFill}" stroke="${thumbStroke}" stroke-width="1.2" stroke-dasharray="3 2"/>
    `
    : "";

  const spineSum = inner * 2;
  const spineAlert = spineSum > outer * 1.35;
  const spineMarkup = showSpineCallout
    ? `
      <rect x="${(rx - inner * pw).toFixed(1)}" y="${ty}" width="${(inner * 2 * pw).toFixed(1)}" height="${ph}" fill="${spineAlert ? "rgba(144,32,4,0.13)" : "rgba(60,84,38,0.10)"}"/>
      <line x1="${(rx - inner * pw).toFixed(1)}" y1="${ty + ph + 7}" x2="${(rx + inner * pw).toFixed(1)}" y2="${ty + ph + 7}" stroke="${spineAlert ? "#902004" : "#3C5426"}" stroke-width="1.4"/>
    `
    : "";

  const labelMarkup = showLabels
    ? `
      <text x="${(rx + inner * pw * 0.5).toFixed(1)}" y="${(ty + ph * 0.5).toFixed(1)}" font-size="7.5" fill="#902004" text-anchor="middle" font-family="Space Mono, monospace">${Math.round(inner * 100)}%</text>
      <text x="${(rx + pw - outer * pw * 0.5).toFixed(1)}" y="${(ty + ph * 0.5).toFixed(1)}" font-size="7.5" fill="#902004" text-anchor="middle" font-family="Space Mono, monospace">${Math.round(outer * 100)}%</text>
      <text x="${(rBox.x + rBox.w * 0.5).toFixed(1)}" y="${(ty + top * ph * 0.62).toFixed(1)}" font-size="7.5" fill="#902004" text-anchor="middle" font-family="Space Mono, monospace">${Math.round(top * 100)}%</text>
      <text x="${(rBox.x + rBox.w * 0.5).toFixed(1)}" y="${(ty + ph - bottom * ph * 0.38).toFixed(1)}" font-size="7.5" fill="#902004" text-anchor="middle" font-family="Space Mono, monospace">${Math.round(bottom * 100)}%</text>
    `
    : "";

  return `<svg viewBox="0 0 ${W} ${H}" class="spread-svg" role="img" aria-label="双页对开手稿边距示意">
    <rect x="${lx + 2}" y="${ty + 3}" width="${pw * 2}" height="${ph}" fill="rgba(27,25,21,0.08)"/>
    <rect x="${lx}" y="${ty}" width="${pw}" height="${ph}" fill="#FBF8F1" stroke="#9B8868" stroke-width="1.2"/>
    <rect x="${rx}" y="${ty}" width="${pw}" height="${ph}" fill="#FBF8F1" stroke="#9B8868" stroke-width="1.2"/>
    ${spineMarkup}
    <rect x="${lBox.x.toFixed(1)}" y="${lBox.y.toFixed(1)}" width="${lBox.w.toFixed(1)}" height="${lBox.h.toFixed(1)}" fill="#F3EBDC" stroke="#B6A486" stroke-width="0.9"/>
    <rect x="${rBox.x.toFixed(1)}" y="${rBox.y.toFixed(1)}" width="${rBox.w.toFixed(1)}" height="${rBox.h.toFixed(1)}" fill="#F3EBDC" stroke="#B6A486" stroke-width="0.9"/>
    ${makeLines(lBox)}
    ${makeLines(rBox)}
    <line x1="${rx}" y1="${ty}" x2="${rx}" y2="${ty + ph}" stroke="#7B6B4F" stroke-width="1.4"/>
    <line x1="${rx - 2}" y1="${ty + 1}" x2="${rx - 2}" y2="${ty + ph - 1}" stroke="rgba(27,25,21,0.08)" stroke-width="2.5"/>
    <line x1="${rx + 2}" y1="${ty + 1}" x2="${rx + 2}" y2="${ty + ph - 1}" stroke="rgba(27,25,21,0.08)" stroke-width="2.5"/>
    ${thumbsMarkup}
    ${labelMarkup}
  </svg>`;
}
