// 095 视觉层级 · 单一真实数据源模型
// 画布绘制、眯眼验序、三阶折面层台、右上四石叠塔、底部四栏要点与陶红诊单全部读取本模块算出的同一份结果。

export const PALETTE = {
  cream: "#F9EDD5",
  ivory: "#FCF5E8",
  apricot: "#F8E3CC",
  stone: "#EDE5D3",
  gold: "#EFB231",
  goldDeep: "#D89A1E",
  goldText: "#7D5600",
  terra: "#E1643C",
  terraRibbon: "#DB5A36",
  terraFold: "#BB4C2D",
  terraText: "#9F3514",
  olive: "#686C64",
  oliveFold: "#52564E",
  oliveText: "#454942",
  charcoal: "#212526",
  charcoalFold: "#191B1D",
  darkBand: "#11120D",
  ink: "#1A1818",
  inkSoft: "#4B4944",
  pass: "#1E6B52",
  passLight: "#6CE0B6",
  warn: "#B8291E",
  warnLight: "#FF8A7A",
};

export const TIERS = {
  1: {
    id: 1,
    zh: "主要层级",
    en: "PRIMARY",
    short: "主层",
    role: "最重要的信息",
    posterDesc: "通过最大字号、最强对比、最显眼位置吸引注意力，建立视觉焦点，传达核心主题。",
    slabBg: PALETTE.charcoal,
    foldBg: PALETTE.charcoalFold,
    cardBg: "#F8EBD4",
  },
  2: {
    id: 2,
    zh: "次要层级",
    en: "SECONDARY",
    short: "次层",
    role: "支撑核心信息",
    posterDesc: "使用中等字号、适度对比、邻近核心，提供必要的补充与说明，帮助理解。",
    slabBg: PALETTE.terra,
    foldBg: PALETTE.terraFold,
    cardBg: PALETTE.apricot,
  },
  3: {
    id: 3,
    zh: "次要次要层级",
    en: "TERTIARY",
    short: "细层",
    role: "补充与细节信息",
    posterDesc: "使用较小字号、较低对比、排布在次要位置，提供支持性信息，不抢夺注意力。",
    slabBg: PALETTE.olive,
    foldBg: PALETTE.oliveFold,
    cardBg: PALETTE.stone,
  },
};

// 三套真实语境，每套包含 5 块职责分明的信息模块
export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "海报 · 秋季展演",
    shortLabel: "展演海报",
    canvasTag: "EXHIBITION POSTER",
    blocks: [
      {
        id: "title",
        name: "核心主题",
        role: "core",
        expectedTier: 1,
        slotOrder: 0,
        text: "器物与泥土",
        sub: "AUTUMN CERAMICS",
        kind: "headline",
      },
      {
        id: "meta",
        name: "时间与地点",
        role: "support",
        expectedTier: 2,
        slotOrder: 1,
        text: "10.18 — 11.24 · 南岸美术馆三层展厅",
        sub: "每周二至周日 10:00–18:00 开放",
        kind: "subhead",
      },
      {
        id: "anchor",
        name: "主视觉焦点",
        role: "support",
        expectedTier: 2,
        slotOrder: 2,
        text: "年度器物展",
        sub: "32 位手作匠人原作",
        kind: "visual",
      },
      {
        id: "body",
        name: "策展导语",
        role: "detail",
        expectedTier: 3,
        slotOrder: 3,
        text: "精选近三年烧制的日常陶皿与建筑陶板，呈现从粗泥塑形到高温窑变的器物肌理。",
        sub: "",
        kind: "paragraph",
      },
      {
        id: "footnote",
        name: "票务注脚",
        role: "detail",
        expectedTier: 3,
        slotOrder: 4,
        text: "注：免费预约入场 · 禁止使用闪光灯 · 编号 EX-095",
        sub: "",
        kind: "footnote",
      },
    ],
  },
  ui: {
    id: "ui",
    label: "界面 · 课程卡片",
    shortLabel: "课程界面",
    canvasTag: "COURSE INTERFACE",
    blocks: [
      {
        id: "title",
        name: "课程主标",
        role: "core",
        expectedTier: 1,
        slotOrder: 0,
        text: "版式秩序实战课",
        sub: "VISUAL STRUCTURE LAB",
        kind: "headline",
      },
      {
        id: "meta",
        name: "核心卖点",
        role: "support",
        expectedTier: 2,
        slotOrder: 1,
        text: "6 周直播拆解 · 18 份真实改稿案例",
        sub: "适合平面、产品与内容排版新手",
        kind: "subhead",
      },
      {
        id: "anchor",
        name: "报名入口",
        role: "support",
        expectedTier: 2,
        slotOrder: 2,
        text: "立即预约试听",
        sub: "本周六 20:00 开课",
        kind: "visual",
      },
      {
        id: "body",
        name: "课程说明",
        role: "detail",
        expectedTier: 3,
        slotOrder: 3,
        text: "从信息分组、三级字阶到留白呼吸，每节配可复用的页面自查清单与课后批改。",
        sub: "",
        kind: "paragraph",
      },
      {
        id: "footnote",
        name: "细则条款",
        role: "detail",
        expectedTier: 3,
        slotOrder: 4,
        text: "开课前 24 小时支持全额退费 · 含 180 天回放权限",
        sub: "",
        kind: "footnote",
      },
    ],
  },
  news: {
    id: "news",
    label: "资讯 · 简报头版",
    shortLabel: "简报头版",
    canvasTag: "CITY BRIEFING",
    blocks: [
      {
        id: "title",
        name: "头版头条",
        role: "core",
        expectedTier: 1,
        slotOrder: 0,
        text: "旧电厂改造为公共书屋",
        sub: "URBAN RENEWAL REPORT",
        kind: "headline",
      },
      {
        id: "meta",
        name: "提要导语",
        role: "support",
        expectedTier: 2,
        slotOrder: 1,
        text: "保留原有砖拱与天窗，新增 420 个免费阅读席位",
        sub: "城市更新专题 · 本报讯",
        kind: "subhead",
      },
      {
        id: "anchor",
        name: "核心数据卡",
        role: "support",
        expectedTier: 2,
        slotOrder: 2,
        text: "3,600 m²",
        sub: "河岸步行 5 分钟可达",
        kind: "visual",
      },
      {
        id: "body",
        name: "背景报道",
        role: "detail",
        expectedTier: 3,
        slotOrder: 3,
        text: "设计团队未拆除外立面红砖结构，而是通过错层书架与自然采光天井重塑阅读动线。",
        sub: "",
        kind: "paragraph",
      },
      {
        id: "footnote",
        name: "版面索引",
        role: "detail",
        expectedTier: 3,
        slotOrder: 4,
        text: "详见第 04 版平面图 · 摄影供图：城建档案馆 · 第 218 期",
        sub: "",
        kind: "footnote",
      },
    ],
  },
};

// 开场坏态 + 多组预设（含合法多解与双向试错）
export const PRESETS = {
  opening: {
    label: "开场坏态",
    kind: "bad",
    desc: "票务注脚错升主层抢戏，导语与日期也套满高光，核心标题反而被压扁",
    tiers: { title: 2, meta: 2, anchor: 3, body: 2, footnote: 1 },
    accents: { title: false, meta: true, anchor: false, body: true, footnote: true },
    scaleStep: 1.24,
    contrastGap: 0.34,
    squint: 0.42,
  },
  classic: {
    label: "经典三阶解",
    kind: "good",
    desc: "主标独坐主要层级，时间与焦点居中支撑，正文与注脚退守第三层",
    tiers: { title: 1, meta: 2, anchor: 2, body: 3, footnote: 3 },
    accents: { title: true, meta: false, anchor: false, body: false, footnote: false },
    scaleStep: 2.02,
    contrastGap: 0.86,
    squint: 0.36,
  },
  visualLead: {
    label: "主焦双锚解",
    kind: "good",
    desc: "顶栏炭黑主标与中段暖金视觉焦点双锚领读，呼应原海报主层线框",
    tiers: { title: 1, meta: 2, anchor: 1, body: 3, footnote: 3 },
    accents: { title: true, meta: false, anchor: false, body: false, footnote: false },
    scaleStep: 1.92,
    contrastGap: 0.84,
    squint: 0.36,
  },
  minimal: {
    label: "黑白克制解",
    kind: "good",
    desc: "不用彩色底块，仅凭字号断层、字重与灰阶对比照样立住清晰三阶",
    tiers: { title: 1, meta: 2, anchor: 2, body: 3, footnote: 3 },
    accents: { title: false, meta: false, anchor: false, body: false, footnote: false },
    scaleStep: 2.18,
    contrastGap: 0.90,
    squint: 0.36,
  },
  allShout: {
    label: "全员高光",
    kind: "bad",
    desc: "四组信息全部塞进主层并加醒目色块——每个人都在大喊，结果没人被听见",
    tiers: { title: 1, meta: 1, anchor: 1, body: 2, footnote: 1 },
    accents: { title: true, meta: true, anchor: true, body: false, footnote: true },
    scaleStep: 1.32,
    contrastGap: 0.40,
    squint: 0.48,
  },
  flatGrey: {
    label: "等大灰墙",
    kind: "bad",
    desc: "所有内容字号接近、明暗相同，退后眯眼只剩一块均匀灰布",
    tiers: { title: 2, meta: 2, anchor: 2, body: 2, footnote: 2 },
    accents: { title: false, meta: false, anchor: false, body: false, footnote: false },
    scaleStep: 1.12,
    contrastGap: 0.18,
    squint: 0.52,
  },
};

export function createInitialState(scenario = "poster") {
  const p = PRESETS.opening;
  return {
    scenario,
    tiers: { ...p.tiers },
    accents: { ...p.accents },
    scaleStep: p.scaleStep,
    contrastGap: p.contrastGap,
    squint: p.squint,
    selectedId: "footnote",
    scanActive: false,
    scanTime: 0,
  };
}

export function applyPreset(state, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  state.tiers = { ...p.tiers };
  state.accents = { ...p.accents };
  state.scaleStep = p.scaleStep;
  state.contrastGap = p.contrastGap;
  if (typeof p.squint === "number") state.squint = p.squint;
  state.selectedId = presetKey === "opening" ? "footnote" : "title";
}

// ---------- WCAG 相对亮度计算（用于真实明暗对比度） ----------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function relLum([r, g, b]) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrastRatio(hexA, hexB) {
  const l1 = relLum(hexToRgb(hexA));
  const l2 = relLum(hexToRgb(hexB));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const m = [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], clamp(t, 0, 1))));
  return "#" + m.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// ---------- 核心单真源排版与显著性计算 ----------
// 输入：状态与逻辑画布尺寸 W × H（标准逻辑坐标 600 × 520）
// 输出：每个块的实绘矩形、字号、字重、填色、真实对比度、显著性权重、实际初看顺位与四项规则诊断
export function evaluateLayout(state, W = 600, H = 444) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const padX = Math.round(W * 0.064);
  const padTop = Math.round(H * 0.095);
  const padBot = Math.round(H * 0.074);
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;

  const step = clamp(state.scaleStep, 1.08, 2.5);
  const gap = clamp(state.contrastGap, 0.1, 1.0);

  // 由 step 单真源决定三级基准字号（px，在 600×520 逻辑坐标系中）
  // 第三层保持可读基准，第二层和第一层按步距拉升
  const baseT3 = clamp(12.5 - (step - 1.5) * 0.9, 10.5, 13.5);
  const t2Factor = 1 + (step - 1) * 0.56;
  const baseT2 = baseT3 * t2Factor;
  const baseT1 = baseT2 * step;

  const tierFontSize = {
    1: clamp(baseT1, 16, 48),
    2: clamp(baseT2, 13, 27),
    3: clamp(baseT3, 10.5, 15.5),
  };

  // 由 contrastGap 单真源决定各级墨色与底块明暗对比
  const paperBg = PALETTE.ivory;
  const tierInk = {
    1: PALETTE.ink,
    2: mixHex("#5D584F", "#2D2926", 0.35 + gap * 0.55),
    3: mixHex("#3B3935", "#7B776D", 0.15 + gap * 0.85),
  };
  const tierWeight = {
    1: gap > 0.45 ? 900 : 700,
    2: gap > 0.55 ? 700 : 500,
    3: 400,
  };

  // 为 5 块信息分配垂直流空间：位置保持原版式语义槽位，高矮由所属层级实时驱动
  const rawItems = sc.blocks.map((b) => {
    const tier = state.tiers[b.id] || 2;
    const emphasized = !!state.accents[b.id];
    const fs = tierFontSize[tier] * (b.kind === "paragraph" ? 0.84 : b.kind === "footnote" ? 0.86 : 1);
    const weight = tierWeight[tier];

    // 卡片底色：开启强调色块时使用原海报高对比炭黑/暖金/陶红块，否则仅微弱纸层区分
    let boxBg = paperBg;
    let inkColor = tierInk[tier];
    let accentBoost = 0;
    let hasFill = false;

    if (emphasized) {
      hasFill = true;
      if (tier === 1) {
        boxBg = b.role === "detail" ? PALETTE.terra : PALETTE.charcoal;
        inkColor = PALETTE.cream;
        accentBoost = b.role === "detail" ? 0.52 : 0.46;
      } else if (tier === 2) {
        boxBg = PALETTE.gold;
        inkColor = PALETTE.ink;
        accentBoost = 0.34;
      } else {
        boxBg = PALETTE.terra;
        inkColor = PALETTE.cream;
        accentBoost = 0.38;
      }
    } else if (b.kind === "visual") {
      // 主视觉块自带柔和暖金或浅杏承托面，层级越高越醒目
      hasFill = true;
      if (tier === 1) {
        boxBg = PALETTE.gold;
        inkColor = PALETTE.ink;
        accentBoost = 0.36;
      } else if (tier === 2) {
        boxBg = mixHex("#EFE6D4", PALETTE.gold, 0.25 + gap * 0.42);
        inkColor = PALETTE.ink;
        accentBoost = 0.18;
      } else {
        boxBg = PALETTE.stone;
        inkColor = PALETTE.oliveText;
        accentBoost = 0.03;
      }
    } else if (tier === 1) {
      // 无彩色底块的主层仍有微妙的纸面呼吸留白和左侧炭黑粗竖线
      boxBg = paperBg;
      inkColor = PALETTE.ink;
      accentBoost = 0.14 * gap;
    }

    // 估算需要高度（依据层级与内容行数）
    const baseHeight =
      tier === 1
        ? b.kind === "visual" ? 96 : 94
        : tier === 2
          ? b.kind === "visual" ? 72 : 64
          : b.kind === "paragraph" ? 56 : 44;

    return {
      ...b,
      tier,
      emphasized,
      hasFill,
      fontSize: Number(fs.toFixed(1)),
      fontWeight: weight,
      boxBg,
      inkColor,
      accentBoost,
      rawH: baseHeight + (emphasized ? 10 : 0),
    };
  });

  // 按垂直槽位排布：上方放 title / meta，中段把 anchor 与 body 做轻量结构组合或竖向阶梯，底端放 footnote
  // 为保持单真源清晰与易点选，使用清晰的 5 块纸页网格：
  // Row 0: title（通栏）
  // Row 1: meta（通栏）
  // Row 2: anchor（左 42%）+ body（右 55%）并列双格，如海报中段卡片骨架！
  // Row 3: footnote（底栏通栏）
  const rowGap = Math.round(lerp(8, 16, gap));
  const r0Raw = rawItems[0].rawH;
  const r1Raw = rawItems[1].rawH;
  const r2Raw = Math.max(rawItems[2].rawH, rawItems[3].rawH) + 12;
  const r3Raw = rawItems[4].rawH;
  const totalRaw = r0Raw + r1Raw + r2Raw + r3Raw + rowGap * 3;
  const k = Math.min(1.08, innerH / totalRaw);

  const r0H = Math.round(r0Raw * k);
  const r1H = Math.round(r1Raw * k);
  const r2H = Math.round(r2Raw * k);
  const r3H = Math.round(r3Raw * k);
  const usedH = r0H + r1H + r2H + r3H + rowGap * 3;
  let curY = padTop + Math.max(0, Math.round((innerH - usedH) * 0.42));

  const rects = [
    { x: padX, y: curY, w: innerW, h: r0H },
    { x: padX, y: (curY += r0H + rowGap), w: innerW, h: r1H },
    { x: padX, y: (curY += r1H + rowGap), w: Math.round(innerW * 0.43), h: r2H },
    { x: padX + Math.round(innerW * 0.46), y: curY, w: innerW - Math.round(innerW * 0.46), h: r2H },
    { x: padX, y: (curY += r2H + rowGap), w: innerW, h: r3H },
  ];

  const canvasArea = innerW * innerH;

  // 逐块计算真实视觉显著性（只用刚算出的实绘几何 + 字号 + 字重 + 真实亮度对比 + 强调色块 + 入口位置）
  const items = rawItems.map((it, i) => {
    const r = rects[i];
    const areaPct = (r.w * r.h) / canvasArea;
    // 文字或填色块相对暖象牙底色的真实亮度反差
    const textContrast = contrastRatio(it.inkColor, it.boxBg);
    const blockContrast = it.hasFill ? contrastRatio(it.boxBg, paperBg) : 1.0;
    const effectiveContrast = it.hasFill
      ? Math.max(textContrast * 0.45 + blockContrast * 0.95, 2.2)
      : textContrast * 0.65;

    // 位置权重：页面上部略有阅读起点优势，但强色块/超大字号照样能反客为主把眼睛拽去底部
    const yNorm = (r.y + r.h * 0.5 - padTop) / innerH; // 0(top) .. 1(bottom)
    const posFactor = 1.12 - yNorm * 0.22;

    const sizeFactor = (it.fontSize / 14) ** 1.38;
    const weightFactor = 0.72 + (it.fontWeight / 900) * 0.52;
    const areaFactor = 0.78 + Math.sqrt(areaPct) * 0.9;
    const contrastFactor = clamp(effectiveContrast / 6.5, 0.38, 1.85);
    const chromaFactor = 1 + it.accentBoost * 1.45;

    const saliency = Number((sizeFactor * weightFactor * areaFactor * contrastFactor * chromaFactor * posFactor).toFixed(3));
    return {
      ...it,
      rect: r,
      areaPct,
      textContrast: Number(textContrast.toFixed(1)),
      blockContrast: Number(blockContrast.toFixed(1)),
      saliency,
      yNorm: Number(yNorm.toFixed(2)),
    };
  });

  // 依实绘显著性从高到低排出观者真实初看顺位 1..5
  const ranked = [...items].sort((a, b) => b.saliency - a.saliency || a.yNorm - b.yNorm);
  ranked.forEach((it, idx) => {
    it.glanceRank = idx + 1;
  });

  // 按层级分组统计真实指标
  const byTier = { 1: [], 2: [], 3: [] };
  for (const it of items) byTier[it.tier].push(it);

  const avg = (arr, fn) => (arr.length ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : 0);
  const t1Sal = avg(byTier[1], (x) => x.saliency);
  const t2Sal = avg(byTier[2], (x) => x.saliency);
  const t3Sal = avg(byTier[3], (x) => x.saliency);

  const t1Fs = avg(byTier[1], (x) => x.fontSize);
  const t2Fs = avg(byTier[2], (x) => x.fontSize);
  const t3Fs = avg(byTier[3], (x) => x.fontSize);

  const sizeRatio12 = t1Fs && t2Fs ? Number((t1Fs / t2Fs).toFixed(2)) : 1.0;
  const sizeRatio23 = t2Fs && t3Fs ? Number((t2Fs / t3Fs).toFixed(2)) : 1.0;
  const salRatio12 = t1Sal && t2Sal ? Number((t1Sal / t2Sal).toFixed(2)) : 1.0;
  const salRatio23 = t2Sal && t3Sal ? Number((t2Sal / t3Sal).toFixed(2)) : 1.0;

  // 强强调面积占比（统计所有主动加高光色块或高饱和主层色块的面积）
  const emphasisAreaPct = Math.round(
    items
      .filter((x) => x.emphasized || (x.tier === 1 && x.kind === "visual"))
      .reduce((s, x) => s + x.areaPct, 0) * 100
  );
  const emphasizedCount = items.filter((x) => x.emphasized).length;

  const titleItem = items.find((x) => x.id === "title");
  const footnoteItem = items.find((x) => x.id === "footnote");
  const bodyItem = items.find((x) => x.id === "body");
  const firstGlance = ranked[0];
  const secondGlance = ranked[1];

  // ---------- 四项设计要点（1:1 对应 095 原海报底部四栏，全部单真源检出） ----------
  const hasAll3Tiers = byTier[1].length >= 1 && byTier[2].length >= 1 && byTier[3].length >= 1;
  const invertedDetail =
    (footnoteItem.glanceRank === 1 || bodyItem.glanceRank === 1) ||
    (footnoteItem.tier < titleItem.tier) ||
    (bodyItem.tier < titleItem.tier);
  const titleLeads = firstGlance.id === "title" || (firstGlance.id === "anchor" && secondGlance.id === "title" && titleItem.tier === 1);

  // 1. 阅读顺序：核心主题（或主题+视觉锚）稳居首眼，注脚与正文退后，且首眼不在底栏倒跳
  const orderOk = titleLeads && !invertedDetail && footnoteItem.glanceRank >= 4 && bodyItem.glanceRank >= 3;
  let orderBadge = "顺畅有序";
  let orderNote = `第 1 眼先落「${firstGlance.name}」，随后顺流读到「${secondGlance.name}」，注脚安静托底。`;
  if (byTier[1].length === 0) {
    orderBadge = "主层空缺";
    orderNote = "主要层级一块都没有，眼睛进版面找不到第一落脚点。";
  } else if (invertedDetail) {
    orderBadge = "重点倒挂";
    orderNote = `「${firstGlance.name}」抢走了第 1 眼，核心主题反而排在第 ${titleItem.glanceRank} 眼，阅读顺序倒转。`;
  } else if (!titleLeads) {
    orderBadge = "入口偏离";
    orderNote = `首眼落在「${firstGlance.name}」，核心主题被排在第 ${titleItem.glanceRank} 眼，读者一时看不清这张版面在说什么。`;
  } else if (footnoteItem.glanceRank <= 3) {
    orderBadge = "细则前冲";
    orderNote = `注脚排进了前 ${footnoteItem.glanceRank} 眼，容易把补充细节误当成核心信息。`;
  }

  // 2. 视觉显著性：三级齐全且主/次、次/细拉出清晰断层（不平权打架）
  const gap12Ok = salRatio12 >= 1.45 && sizeRatio12 >= 1.45;
  const gap23Ok = salRatio23 >= 1.25;
  const saliencyOk = hasAll3Tiers && gap12Ok && gap23Ok;
  let saliencyBadge = `主/次 ${sizeRatio12.toFixed(1)}×`;
  let saliencyNote = `三阶字号比 ${sizeRatio12.toFixed(1)}× / ${sizeRatio23.toFixed(1)}×，眯眼看也能一眼辨出强、中、弱三档团块。`;
  if (!hasAll3Tiers) {
    const emptyNames = [1, 2, 3].filter((t) => byTier[t].length === 0).map((t) => TIERS[t].short).join("、");
    saliencyBadge = "三级塌缩";
    saliencyNote = `目前「${emptyNames}」空置，信息被压成不到三档，缺少完整的强中弱缓冲阶梯。`;
  } else if (!gap12Ok) {
    saliencyBadge = `平权 ${sizeRatio12.toFixed(1)}×`;
    saliencyNote = `主层与次层字号比仅 ${sizeRatio12.toFixed(1)}×（经验上宜拉开至 1.5× 以上），眯眼后一二级粘成一块。`;
  } else if (!gap23Ok) {
    saliencyBadge = "次细粘连";
    saliencyNote = `次层与第三层级对比拉开不足（显著比 ${salRatio23.toFixed(1)}×），正文细节容易与支撑信息混在一起。`;
  }

  // 3. 扫视路径：前三眼落点沿着自上而下或上→中→下顺势流动，不发生「先看底栏再折返顶部」的大逆跳
  const top3Y = ranked.slice(0, 3).map((x) => x.yNorm);
  const badBottomFirst = firstGlance.yNorm > 0.72;
  const zigzagBack = top3Y[0] > top3Y[1] + 0.34;
  const scanOk = !badBottomFirst && !zigzagBack && firstGlance.yNorm <= 0.62;
  let scanBadge = "上中下顺扫";
  let scanNote = `前三眼依次落位「${ranked[0].name} → ${ranked[1].name} → ${ranked[2].name}」，符合自然扫视流向。`;
  if (badBottomFirst) {
    scanBadge = "底栏劫持";
    scanNote = `最刺眼的团块沉在画底（${firstGlance.name}），视线被迫先扎向底边再折返找标题，路径折断。`;
  } else if (zigzagBack) {
    scanBadge = "逆向折返";
    scanNote = `第 1 眼在下方「${ranked[0].name}」，第 2 眼又倒跳回上方「${ranked[1].name}」，眼睛来回拉扯。`;
  }

  // 4. 适度强调：主要层级 ≤ 2 块，高光色块 ≤ 2 处，且强强调面积 ≤ 42%（经验上限）
  const tooManyPrimary = byTier[1].length >= 3;
  const tooManyAccents = emphasizedCount >= 3 || emphasisAreaPct > 42;
  const restraintOk = !tooManyPrimary && !tooManyAccents;
  let restraintBadge = emphasizedCount === 0 ? "素雅克制" : `高光 ${emphasisAreaPct}%`;
  let restraintNote =
    emphasizedCount === 0
      ? "零色块纯靠字号与灰阶分出层次，安静耐看，没有多余装饰。"
      : `强强调区占画芯约 ${emphasisAreaPct}%（${emphasizedCount} 处），克制聚焦，重点一目了然。`;
  if (tooManyPrimary) {
    restraintBadge = `主层 ${byTier[1].length} 块`;
    restraintNote = `主要层级塞进 ${byTier[1].length} 组信息，等于「全员第一」——重点一多，反而一个都记不住。`;
  } else if (tooManyAccents) {
    restraintBadge = `高光超载 ${emphasisAreaPct}%`;
    restraintNote = `${emphasizedCount} 处高饱和色块占去约 ${emphasisAreaPct}% 画面，色块彼此抢戏，版面发噪。`;
  }

  const checks = {
    order: { ok: orderOk, badge: orderBadge, text: orderNote },
    saliency: { ok: saliencyOk, badge: saliencyBadge, text: saliencyNote },
    scan: { ok: scanOk, badge: scanBadge, text: scanNote },
    restraint: { ok: restraintOk, badge: restraintBadge, text: restraintNote },
  };
  const passCount = Object.values(checks).filter((c) => c.ok).length;

  // ---------- 单真源白话诊断（按严重程度给出唯一最关键的诊断与下一步动作） ----------
  let verdictTitle = "";
  let verdictBody = "";
  let verdictAction = "";
  let gradeLabel = "";

  if (passCount === 4) {
    gradeLabel = emphasizedCount === 0 ? "克制三阶（示意）" : byTier[1].length === 2 ? "双锚三阶（示意）" : "三阶清晰（示意）";
    verdictTitle = "三阶秩序成立：第一眼稳锁核心，次细信息自然退让";
    verdictBody = `「好的层级设计，让信息主动被看到、被理解、被记住。」当前主/次字号比 ${sizeRatio12.toFixed(1)}×，前三眼顺着「${ranked[0].name} → ${ranked[1].name} → ${ranked[2].name}」流畅展开。`;
    verdictAction = "把画布上的眯眼滑幕拉到最右试试：即使文字全糊成色团，三档轻重依然一眼分明。";
  } else if (byTier[1].length === 0) {
    gradeLabel = "无主层入口（示意）";
    verdictTitle = "主要层级空着，画面里谁都不敢先开口";
    verdictBody = "整张版面缺少第一落脚点，观者扫一眼看不到核心主题，只能从头逐行硬啃。";
    verdictAction = `在三阶层台里，把「${titleItem.name}」升到炭黑【主要层级】，先立住全页第一主角。`;
  } else if (invertedDetail) {
    gradeLabel = "重点倒挂（示意）";
    verdictTitle = `「${firstGlance.name}」反客为主，把核心主题压到第 ${titleItem.glanceRank} 眼`;
    verdictBody = `这正是新手最常踩的层级倒挂：细则或配角套上大字号与高饱和红块后，前注意视觉立刻被它劫走，真正该先看的「${titleItem.name}」反而被淹没。`;
    verdictAction = `在三阶层台把「${firstGlance.name}」降回橄榄灰【次要次要层级】并关掉多余高光，再把「${titleItem.name}」升进炭黑【主要层级】。`;
  } else if (tooManyPrimary || tooManyAccents) {
    gradeLabel = "过度强调（示意）";
    verdictTitle = `强调区膨胀到 ${emphasisAreaPct}%，全员大喊等于全员静音`;
    verdictBody = `当 ${Math.max(byTier[1].length, emphasizedCount)} 组信息同时抢着戴高帽，视觉显著性彼此抵消——眯眼一看整页发噪，分不出先后顺序。`;
    verdictAction = "只留 1–2 组真正核心的内容留在【主要层级】或保留高光，其余果断降格退让。";
  } else if (!hasAll3Tiers) {
    gradeLabel = "三级塌缩（示意）";
    verdictTitle = "三阶梯塌成了一两档，信息缺少缓冲层次";
    verdictBody = "主要、次要、第三层级各司其职：缺了次层会显得突兀断层，缺了细层则会让补充细节挤进核心区抢戏。";
    verdictAction = "让三个折面层台都各有所属：核心入主层、支撑入次层、细节入第三层。";
  } else if (!gap12Ok || !gap23Ok) {
    gradeLabel = "主次打架（示意）";
    verdictTitle = `字号级差仅 ${sizeRatio12.toFixed(1)}×，眯眼后一二级糊成一片`;
    verdictBody = "字号只差两三像素、明暗又相近时，人眼无法在前注意阶段瞬间区分轻重，不得不放慢速度逐条辨认。";
    verdictAction = "向右拉大「字号级差」到 1.7× 以上，并提高「明暗跨度」，让强中弱三档拉开明确断层。";
  } else if (!scanOk) {
    gradeLabel = "扫视折返（示意）";
    verdictTitle = `第一眼被拉去下方「${firstGlance.name}」，视线被迫折返`;
    verdictBody = "自然阅读习惯由上而下展开；底部元素如果视觉重量压过顶部主标，视线就会先沉底再回头找标题。";
    verdictAction = `减弱「${firstGlance.name}」的色块强调，让顶部「${titleItem.name}」稳稳接住第一眼。`;
  } else {
    gradeLabel = "还差临门一脚（示意）";
    verdictTitle = `还差 ${4 - passCount} 项要点未对齐，细微秩序仍在互相拉扯`;
    verdictBody = "对照下方深炭「设计要点」带里标红的那一项，再微调层级分配或级差即可达标。";
    verdictAction = "可微调层台升降或把「字号级差 / 明暗跨度」略微拉大，观察眯眼团块变化。";
  }

  // ---------- 右上 095 招牌四石叠塔物理状态（完全单真源驱动） ----------
  // 原海报从下到上 4 块石：黑底大扁石（支撑稳基） → 金黄中石（核心张力） → 暖白次石（留白过渡） → 顶陶红小圆石（一眼点睛）
  // 层级清晰时：下宽上收呈稳固金字塔，倾角 0°；
  // 重点倒挂或过度强调时：顶石或中石发胖膨胀，重心上移产生倾斜摇晃！
  const tiltDeg =
    passCount === 4
      ? 0
      : invertedDetail
        ? -12.5
        : tooManyPrimary || tooManyAccents
          ? 10.5
          : !gap12Ok
            ? 6.5
            : -5.5;

  const cairn = {
    tiltDeg,
    stable: passCount === 4,
    // 4 石宽度比（下→上）：正常时 1.00 / 0.68 / 0.56 / 0.24；错态时比例失调
    widths:
      passCount === 4
        ? [1.0, 0.68, 0.54, 0.24]
        : invertedDetail
          ? [0.68, 0.64, 0.72, 0.58] // 顶石膨胀压顶
          : tooManyPrimary || tooManyAccents
            ? [0.84, 0.86, 0.84, 0.62] // 上下一样粗，失衡
            : [0.76, 0.74, 0.72, 0.36], // 扁平无级差
  };

  return {
    scenario: sc,
    W,
    H,
    padX,
    padTop,
    innerW,
    innerH,
    items,
    ranked,
    byTier,
    sizeRatio12,
    sizeRatio23,
    salRatio12,
    salRatio23,
    emphasisAreaPct,
    emphasizedCount,
    checks,
    passCount,
    gradeLabel,
    verdictTitle,
    verdictBody,
    verdictAction,
    cairn,
    firstGlance,
    secondGlance,
  };
}
