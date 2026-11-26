// 141 文字主导版式 — 单真源排印几何与诊断模型
// 所有画布渲染、右侧四原则探针、紫色波形线、诊单文案与读数数字均严格派生自本模块的实测几何数组。

export const CONTEXTS = {
  poster: {
    id: "poster",
    label: "原海报校样",
    shortLabel: "原海报",
    kicker: "NO. 141 / EDITORIAL SPECIMEN",
    titleCn: "文字主导 版式",
    titleEn: "TYPE-LED LAYOUT",
    quote: "“好的版式，让文字自己说话。”",
    quoteEn: "GOOD LAYOUT MAKES THE WORDS SPEAK.",
    body: "文字主导版式强调以文字信息为核心，通过字体的大小、粗细、行距与对齐方式，建立清晰的视觉层级与阅读路径，帮助观者快速理解重点，提升信息传达效率。",
    points: [
      { title: "层级", en: "HIERARCHY", desc: "明确主次关系，重要信息更突出" },
      { title: "行距", en: "LEADING", desc: "控制行间呼吸感，引导阅读节奏" },
      { title: "字号", en: "FONT SIZE", desc: "区分信息等级，强化信息权重" },
    ],
    meta: ["CLEAR", "ORGANIZED", "EFFICIENT"],
    imgCaption: "静音配图位",
  },
  expo: {
    id: "expo",
    label: "建筑展讯",
    shortLabel: "建筑展讯",
    kicker: "2026 AUTUMN BIENNALE / HALL B",
    titleCn: "城市尺度 展讯",
    titleEn: "URBAN SCALE",
    quote: "“少一张效果图，多一层空间秩序。”",
    quoteEn: "STRUCTURE SPEAKS BEFORE ORNAMENT.",
    body: "本届建筑双年展共收录三十六组公共街区更新档案，展厅不设巨幅渲染图，改以比例尺、动线文本与立面笔记构成导览墙，让参观者在三分钟内读清每座街区的改造脉络。",
    points: [
      { title: "展期", en: "DATES", desc: "十月十二日至十二月八日 周二至周日" },
      { title: "主馆", en: "VENUE", desc: "滨江当代艺术馆二层东厅与阅读廊" },
      { title: "导览", en: "TOURS", desc: "每日十四时整点开讲 无需提前预约" },
    ],
    meta: ["FREE ENTRY", "HALL B2", "AUDIO GUIDE"],
    imgCaption: "场馆平面略图",
  },
  journal: {
    id: "journal",
    label: "学术长文",
    shortLabel: "学术导读",
    kicker: "TYPOGRAPHY MONOGRAPH / ISSUE 09",
    titleCn: "排印节奏 笔记",
    titleEn: "READING RHYTHM",
    quote: "“行间留出的空白，才是眼睛歇脚的台阶。”",
    quoteEn: "WHITESPACE SETS THE PACE OF READING.",
    body: "中文长文排版里，每个方块字天然占满字身，缺少西文上下伸部带来的水平缝隙。若行距压缩到一点二倍以下，视线在换行回扫时极易串行；拉出字身一半以上的行间白带，段落才会透亮耐读。",
    points: [
      { title: "字阶", en: "SCALE", desc: "主标与正文拉开二倍以上清晰落差" },
      { title: "行宽", en: "MEASURE", desc: "单行控制于二十至三十五字区间" },
      { title: "亲密", en: "GROUPING", desc: "段距大于行距，小标紧贴所属正文" },
    ],
    meta: ["CLREQ NOTE", "WCAG 1.4.8", "TYPE SYSTEM"],
    imgCaption: "版心示意块",
  },
};

// 开场故意停在 0/4 四重坏态：平权字号、无字重差、撞行密距、混杂对齐、配图喧宾
export const INITIAL_STATE = {
  context: "poster",
  scaleRatio: 1.06,      // 五级字阶倍率（1.00..1.62）
  bodySize: 15,          // 正文基准字号（px，12..18）
  leading: 1.06,         // 正文行距倍数（0.95..2.55）
  weightDiff: 0,         // 主标与正文字重差：0 (500/500), 300 (700/400), 500 (900/400)
  align: "mixed",        // "mixed" | "left" | "center" | "grid"
  imageShare: 34,        // 配图块占版面比例（0..44%）
  paraGapRatio: 0.78,    // 段距相对行高的倍率（0.65..1.85）
  selectedLayer: "title",// 当前选中查看层
  showGuides: true,      // 标尺与紫线透视
};

// 多组合法解（全部严格实测达 4/4）
export const VALID_PRESETS = {
  classic: {
    id: "classic",
    label: "原海报校样解",
    note: "字阶 1.38× · 重差 500 · 行距 1.66× · 单轴左齐 · 配图 11%",
    patch: { scaleRatio: 1.38, bodySize: 13.5, leading: 1.66, weightDiff: 500, align: "left", imageShare: 11, paraGapRatio: 1.45 },
  },
  editorial: {
    id: "editorial",
    label: "纯字社论解",
    note: "字阶 1.28× · 重差 300 · 行距 1.82× · 单轴左齐 · 0% 纯字",
    patch: { scaleRatio: 1.28, bodySize: 13.5, leading: 1.82, weightDiff: 300, align: "left", imageShare: 0, paraGapRatio: 1.55 },
  },
  posterHigh: {
    id: "posterHigh",
    label: "展讯高反差解",
    note: "字阶 1.50× · 重差 500 · 行距 1.54× · 双栏齐 · 配图 14%",
    patch: { scaleRatio: 1.50, bodySize: 13, leading: 1.54, weightDiff: 500, align: "grid", imageShare: 14, paraGapRatio: 1.38 },
  },
};

// 双向试错对照（一键进入真实错态验真）
export const FAIL_PRESETS = {
  flat: {
    id: "flat",
    label: "平权水泥墙",
    patch: { scaleRatio: 1.05, bodySize: 15, leading: 1.48, weightDiff: 0, align: "left", imageShare: 10, paraGapRatio: 1.35 },
  },
  crush: {
    id: "crush",
    label: "撞行压死",
    patch: { scaleRatio: 1.38, bodySize: 14, leading: 1.02, weightDiff: 500, align: "left", imageShare: 10, paraGapRatio: 0.72 },
  },
  scatter: {
    id: "scatter",
    label: "散行断流",
    patch: { scaleRatio: 1.36, bodySize: 13.5, leading: 2.46, weightDiff: 500, align: "left", imageShare: 8, paraGapRatio: 0.95 },
  },
  hijack: {
    id: "hijack",
    label: "配图抢戏",
    patch: { scaleRatio: 1.34, bodySize: 13.5, leading: 1.62, weightDiff: 500, align: "left", imageShare: 36, paraGapRatio: 1.4 },
  },
  chaos: {
    id: "chaos",
    label: "乱轴折返",
    patch: { scaleRatio: 1.36, bodySize: 13.5, leading: 1.64, weightDiff: 500, align: "mixed", imageShare: 10, paraGapRatio: 1.4 },
  },
};

// 经验阈值常量（单一来源，供诊断、标尺、读数共用）
export const RULES = {
  titleToBodyMin: 1.95,      // 主标/正文实测字号比最低值（经验值 ≥ 2.0×）
  titleToBodyMax: 5.2,       // 极端失衡上限
  leadToBodyMin: 1.16,       // 导语/正文清晰二级梯度
  weightDiffMin: 250,        // 主/正字重差最低值（如 700 vs 400）
  leadingMin: 1.42,          // 中文正文行距舒适下限（对应 CLReq 约 42%–100% 字身空隙，经验值）
  leadingMax: 2.15,          // 超过 2.15× 段落易散架
  paraToLineMin: 1.18,       // 段距相对行高比例下限（避免亲密性倒置）
  imageShareMax: 22,         // 文字主导版式中配图上限（超 22% 开始向图片主导倾斜）
  maxAxes: 2,                // 允许的最大主对齐轴数
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 文本折行（按字元真实测宽，保证中文与混排标点不断裂出界）
export function wrapText(text, maxWidth, fontPx, weight, family, measureFn) {
  const chars = [...text];
  const lines = [];
  let line = "";
  const measure = (s) =>
    measureFn
      ? measureFn(s, fontPx, weight, family)
      : [...s].reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? fontPx : fontPx * 0.56), 0);

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = line + ch;
    if (line && measure(next) > maxWidth) {
      // 避头标点尽量跟在上一行末尾
      if ("，。、；：！？）》”".includes(ch) && measure(next) <= maxWidth + fontPx * 0.65) {
        lines.push(next);
        line = "";
        continue;
      }
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 核心：计算活体校样页的完整实绘布局几何（单真源，严格非重叠垂直预算）
export function computeProofLayout(state, width, height, measureFn) {
  const ctxData = CONTEXTS[state.context] || CONTEXTS.poster;
  const W = Math.max(300, width);
  const H = Math.max(240, height);
  const scaleK = clamp(Math.min(W / 760, H / 510), 0.44, 1.18);
  const compactH = H < 335;

  const padX = Math.round(W * 0.058);
  const padTop = Math.round(H * 0.048);
  const padBot = Math.round(H * 0.052);
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;

  const r = clamp(state.scaleRatio, 1.0, 1.62);
  const baseBody = clamp(state.bodySize, 12, 18) * scaleK;

  // 五级实测字号严格由基准与音阶比 r 派生
  const metaSize = clamp(baseBody * Math.pow(r, -0.35), 9.5 * Math.max(scaleK, 0.72), 12.5 * scaleK);
  const pointDescSize = clamp(baseBody * Math.pow(r, -0.15), 9.5 * Math.max(scaleK, 0.75), 13.5 * scaleK);
  const pointTitleSize = clamp(baseBody * Math.pow(r, 0.45), baseBody * 0.98, 21 * scaleK);
  const leadSize = clamp(baseBody * Math.pow(r, 0.95), baseBody * 1.02, 25 * scaleK);
  const titleSize = clamp(baseBody * Math.pow(r, 3.05), baseBody * 1.08, 60 * scaleK);
  const titleEnSize = clamp(titleSize * 0.84, 14 * scaleK, 50 * scaleK);

  const bodyWeight = state.weightDiff === 0 ? 500 : 400;
  const titleWeight = state.weightDiff === 0 ? 500 : state.weightDiff === 300 ? 700 : 900;
  const leadWeight = state.weightDiff === 0 ? 500 : 700;
  const pointWeight = state.weightDiff === 0 ? 500 : 700;

  // 对齐策略决定各层水平起线与轴数
  const alignMap = {
    left: { title: "left", lead: "left", body: "left", points: "left", meta: "left", axes: 1, label: "单轴左齐" },
    grid: { title: "left", lead: "left", body: "left", points: "left", meta: "left", axes: 2, label: "双栏锚轴" },
    center: { title: "center", lead: "center", body: "center", points: "center", meta: "center", axes: 1, label: "全页居中" },
    mixed: { title: "center", lead: "right", body: "left", points: "center", meta: "right", axes: 3, label: "混杂乱轴" },
  };
  const alignCfg = alignMap[state.align] || alignMap.left;

  // 行高与段距
  const leadingRatio = clamp(state.leading, 0.95, 2.55);
  const bodyLineH = baseBody * leadingRatio;
  const paraGap = Math.max(4.5 * scaleK, bodyLineH * clamp(state.paraGapRatio, 0.65, 1.85) - bodyLineH * 0.55);
  const titleLineH = titleSize * 1.05;

  // 先预留底部 L4 三列要点与 L5 红点条的安全高度（保证中间区绝不与底部叠字）
  const metaH = Math.max(15, metaSize * 1.6);
  const metaY = H - padBot - metaH;
  const pointsH = compactH
    ? Math.max(24, pointTitleSize * 1.5 + 10)
    : Math.max(44 * scaleK, pointTitleSize * 1.35 + pointDescSize * 2.5 + 12 * scaleK);
  const pointsGapToMeta = Math.max(6, 9 * scaleK);
  const pointsY = metaY - pointsH - pointsGapToMeta;

  // 顶部顺序排布 L0、L1、L2
  let cursorY = padTop;

  // L0: 微标眉
  const kickerRect = { x: padX, y: cursorY, w: innerW, h: Math.max(13, metaSize * 1.35) };
  cursorY += kickerRect.h + Math.max(3, paraGap * 0.35);

  // L1: 主标 + 窄高压缩英标
  const titleX = padX;
  const titleW = state.align === "grid" ? innerW * 0.62 : innerW;
  const titleBlockH = titleLineH + titleEnSize * 0.9 + 5 * scaleK;
  const titleRect = {
    id: "title",
    label: "L1 主标",
    x: titleX,
    y: cursorY,
    w: titleW,
    h: titleBlockH,
    fontSize: titleSize,
    enSize: titleEnSize,
    weight: titleWeight,
    align: alignCfg.title,
  };

  // L2: 导语 / 金句
  let leadRect;
  const leadLines = wrapText(ctxData.quote, state.align === "grid" ? innerW * 0.33 : innerW * 0.86, leadSize, leadWeight, "Noto Sans SC", measureFn);
  const leadLineH = leadSize * 1.32;
  if (state.align === "grid") {
    const lx = padX + innerW * 0.65;
    const lw = innerW * 0.35;
    const lh = leadLines.length * leadLineH + metaSize * 1.45 + 6 * scaleK;
    leadRect = {
      id: "lead",
      label: "L2 导语",
      x: lx,
      y: cursorY + Math.max(0, (titleBlockH - lh) * 0.42),
      w: lw,
      h: lh,
      fontSize: leadSize,
      weight: leadWeight,
      align: "left",
      lines: leadLines,
      lineH: leadLineH,
    };
    cursorY += Math.max(titleBlockH, lh) + Math.max(6 * scaleK, paraGap * 0.72);
  } else {
    cursorY += titleBlockH + Math.max(4 * scaleK, paraGap * 0.65);
    const lh = leadLines.length * leadLineH + metaSize * 1.35 + 4 * scaleK;
    leadRect = {
      id: "lead",
      label: "L2 导语",
      x: padX,
      y: cursorY,
      w: innerW,
      h: lh,
      fontSize: leadSize,
      weight: leadWeight,
      align: alignCfg.lead,
      lines: leadLines,
      lineH: leadLineH,
    };
    cursorY += lh + Math.max(6 * scaleK, paraGap * 0.72);
  }

  // 电光紫主分隔横杠位置
  const ruleY = cursorY - Math.max(3, paraGap * 0.3);

  // 中间可用区高度（严格卡在 ruleY+6 到 pointsY-10 之间，永不越界重叠！）
  const midTop = ruleY + Math.max(6, 9 * scaleK);
  const midBot = pointsY - Math.max(8, 12 * scaleK);
  const middleAvail = Math.max(38, midBot - midTop);
  cursorY = midTop;

  // 静音配图块几何（在 middleAvail 内严格非重叠分配，并尽量逼近目标面积占比）
  const imgShare = clamp(state.imageShare, 0, 44);
  const pageArea = innerW * innerH;
  const targetImgArea = pageArea * (imgShare / 100);
  let imgRect = null;
  let bodyX = padX;
  let bodyW = innerW;

  if (imgShare >= 2) {
    if (imgShare > 22) {
      // 喧宾夺主态：占据中区上半幅宽画框，但强制为下方正文保留安全净高（永不撞到底部要点）
      const minBodyReserve = Math.min(middleAvail * 0.38, Math.max(bodyLineH * 2.05, 32));
      const maxImgH = Math.max(30, middleAvail - minBodyReserve - Math.max(6, 9 * scaleK));
      let imgH = clamp(Math.sqrt(targetImgArea / 1.75), 30, maxImgH);
      let imgW = clamp(targetImgArea / imgH, innerW * 0.38, innerW * 0.94);
      imgRect = {
        x: padX + (innerW - imgW) * 0.5,
        y: cursorY,
        w: imgW,
        h: imgH,
        actualShare: ((imgW * imgH) / pageArea) * 100,
      };
      cursorY += imgH + Math.max(6, 9 * scaleK);
      bodyX = padX;
      bodyW = innerW;
    } else {
      // 静音配角态：退居左中角，不抢正文主通道
      const maxImgH = Math.max(28, middleAvail * 0.88);
      let imgH = clamp(Math.sqrt(targetImgArea / 1.22), 26, maxImgH);
      let imgW = clamp(targetImgArea / imgH, innerW * 0.14, innerW * 0.36);
      imgRect = {
        x: padX,
        y: cursorY + 1,
        w: imgW,
        h: imgH,
        actualShare: ((imgW * imgH) / pageArea) * 100,
      };
      const gutter = Math.round(14 * scaleK);
      bodyX = padX + imgW + gutter;
      bodyW = Math.max(innerW * 0.48, innerW - imgW - gutter);
    }
  }
  const actualImgShare = imgRect ? imgRect.actualShare : 0;

  // L3 真实折行正文（严格限制在 cursorY .. midBot 之间，杜绝任何叠字）
  const bodyLines = wrapText(ctxData.body, bodyW, baseBody, bodyWeight, "Noto Sans SC", measureFn);
  const availBodyH = Math.max(bodyLineH, midBot - cursorY);
  const maxLinesFit = Math.max(1, Math.floor((availBodyH + (bodyLineH - baseBody) * 0.45) / bodyLineH));
  const visibleBodyLines = bodyLines.slice(0, maxLinesFit);
  const bodyClipped = visibleBodyLines.length < bodyLines.length;
  const bodyH = Math.min(availBodyH, visibleBodyLines.length * bodyLineH);

  const bodyRect = {
    id: "body",
    label: "L3 正文",
    x: bodyX,
    y: cursorY,
    w: bodyW,
    h: Math.max(bodyH, baseBody),
    fontSize: baseBody,
    weight: bodyWeight,
    leading: leadingRatio,
    lineH: bodyLineH,
    lines: visibleBodyLines,
    allLinesCount: bodyLines.length,
    clipped: bodyClipped,
    align: alignCfg.body,
  };

  // 每行平均中文字数（近似 measure）
  const charsPerLine =
    bodyLines.length > 0
      ? bodyLines.slice(0, Math.max(1, bodyLines.length - 1)).reduce((s, l) => s + [...l].length, 0) /
        Math.max(1, bodyLines.length - 1)
      : 0;

  // L4 三列紫色直角取景框要点（安全固定在 midBot 下方）
  const colGap = Math.round(11 * scaleK);
  const colW = (innerW - colGap * 2) / 3;
  const pointRects = ctxData.points.map((pt, idx) => ({
    ...pt,
    x: padX + idx * (colW + colGap),
    y: pointsY,
    w: colW,
    h: pointsH,
  }));
  const pointsGroupRect = {
    id: "points",
    label: "L4 要点",
    x: padX,
    y: pointsY,
    w: innerW,
    h: pointsH,
    fontSize: pointTitleSize,
    descSize: pointDescSize,
    weight: pointWeight,
    align: alignCfg.points,
    compact: compactH,
    items: pointRects,
  };

  // L5 底部红点分隔元信息条
  const metaRect = {
    id: "meta",
    label: "L5 脚注",
    x: padX,
    y: metaY,
    w: innerW,
    h: metaH,
    fontSize: metaSize,
    weight: 700,
    align: alignCfg.meta,
    items: ctxData.meta,
  };

  // 计算实测视觉权重分数（基于真实面积、字号、字重与颜色抢眼度）→ 决定真实扫读落眼次序
  const weights = [
    {
      id: "title",
      label: "主标",
      rect: titleRect,
      score: (titleSize / Math.max(1, baseBody)) * 26 + (titleWeight / 400) * 18 + (state.align === "mixed" ? -4 : 6),
    },
    {
      id: "lead",
      label: "导语",
      rect: leadRect,
      score: (leadSize / Math.max(1, baseBody)) * 21 + (leadWeight / 400) * 12 + 8, // 紫括号/紫引号提供适度次级牵引
    },
    {
      id: "body",
      label: "正文",
      rect: bodyRect,
      score: 18 + (bodyWeight / 400) * 10 + (leadingRatio < 1.2 ? 9 : 0), // 过密黑块产生沉重压迫感
    },
    {
      id: "points",
      label: "要点",
      rect: pointsGroupRect,
      score: (pointTitleSize / Math.max(1, baseBody)) * 14 + (pointWeight / 400) * 7 + 4,
    },
  ];
  if (imgRect && actualImgShare >= 4) {
    weights.push({
      id: "image",
      label: "配图块",
      rect: imgRect,
      score: actualImgShare * 2.45, // 配图 > 22% 时权重飙升并抢走第一眼
    });
  }
  const scanOrder = [...weights].sort((a, b) => b.score - a.score);

  const titleToBody = titleSize / Math.max(1, baseBody);
  const leadToBody = leadSize / Math.max(1, baseBody);
  const paraToLine = (paraGap + bodyLineH * 0.55) / Math.max(1, bodyLineH);

  return {
    W,
    H,
    scaleK,
    padX,
    padTop,
    padBot,
    innerW,
    innerH,
    ruleY,
    kickerRect,
    titleRect,
    leadRect,
    bodyRect,
    imgRect,
    pointsGroupRect,
    metaRect,
    metrics: {
      titleSizePx: Math.round(titleSize / scaleK),
      leadSizePx: Math.round(leadSize / scaleK),
      bodySizePx: +(baseBody / scaleK).toFixed(1),
      metaSizePx: +(metaSize / scaleK).toFixed(1),
      titleToBody: +titleToBody.toFixed(2),
      leadToBody: +leadToBody.toFixed(2),
      weightDiff: state.weightDiff,
      titleWeight,
      bodyWeight,
      leading: +leadingRatio.toFixed(2),
      lineGapPct: Math.round((leadingRatio - 1) * 100),
      paraToLine: +paraToLine.toFixed(2),
      imageShare: Math.round(actualImgShare),
      axesCount: alignCfg.axes,
      alignLabel: alignCfg.label,
      charsPerLine: Math.round(charsPerLine),
      bodyLinesCount: bodyLines.length,
      bodyClipped,
    },
    scanOrder,
  };
}

// 单真源诊断：检出 9 类真实错态，生成 4 项原海报核心探针、紫色波形特征与白话诊单
export function evaluateProof(layout, state) {
  const m = layout.metrics;
  const issues = [];

  if (m.imageShare > RULES.imageShareMax) {
    issues.push({
      id: "image_hijack",
      severity: 100,
      probe: "hierarchy",
      shortTag: `配图占 ${m.imageShare}%`,
      title: `配图膨胀到 ${m.imageShare}%，文字退成了配角`,
      why: `文字主导版式里配图应静音退居 20% 以下（或完全留白）。现在这块灰图比主标更先吸走第一眼，页面已经滑向「140 图片主导版式」，文字失去统领权。`,
      action: "直接点击画布里的灰色配图块（或把「配图静音比」拉到 15% 以下 / 0% 纯文字）。",
    });
  }

  if (m.titleToBody < RULES.titleToBodyMin) {
    issues.push({
      id: "scale_flat",
      severity: 95,
      probe: "size",
      shortTag: `仅 ${m.titleToBody}× 平权`,
      title: `主标只比正文大 ${m.titleToBody} 倍，整页成了平权水泥墙`,
      why: `当主标（${m.titleSizePx}px）和正文（${m.bodySizePx}px）字号差不到 2 倍，前注意视觉抓不到入口，读者只能逐行硬啃，三秒内读不出主题。`,
      action: "在画布上向右横拖（或推大「字阶音阶比」到 1.28× 以上），把主/正落差拉到 2.2× 以上。",
    });
  } else if (m.titleToBody > RULES.titleToBodyMax) {
    issues.push({
      id: "scale_extreme",
      severity: 76,
      probe: "size",
      shortTag: `过夸 ${m.titleToBody}×`,
      title: `主标膨大到正文的 ${m.titleToBody} 倍，压垮了中层导语与正文`,
      why: `字号极差过大时，正文和要点被挤到画幅底角，阅读在第一眼之后断崖跌落，只剩一句大标题在吼（那是「142 大标题版式」的做法）。`,
      action: "略微向左收拢字阶音阶比到 1.25×–1.52×，让导语与正文有呼吸空间。",
    });
  }

  if (m.weightDiff < RULES.weightDiffMin) {
    issues.push({
      id: "weight_flat",
      severity: 86,
      probe: "hierarchy",
      shortTag: `字重同权 ${m.titleWeight}/${m.bodyWeight}`,
      title: `主标与正文都是 ${m.titleWeight} 字重，墨色拉不开主次`,
      why: `中文方块字墨量均匀，只靠微调字号不拉开粗细（主标 700–900 / 正文 400），眯眼远看整页灰度一致，标题缺乏「定海神针」分量。`,
      action: "把「字重落差」切到「700/400（书刊）」或「900/400（海报）」。",
    });
  }

  if (m.leading < RULES.leadingMin) {
    issues.push({
      id: "leading_crush",
      severity: 92,
      probe: "leading",
      shortTag: `撞行 ${m.leading}×`,
      title: `正文行距压死在 ${m.leading}×（行间白带仅 ${m.lineGapPct}%），上下行黏连串行`,
      why: `W3C 中文排版需求指出中文行间空白宜占字身 50%–100%（行高约 1.5×–2.0×）。现在上下行笔画紧贴，眼球换行回扫时频频错行。`,
      action: "在正文区向下纵拖（或把「正文行距」拉到 1.50×–1.88× 舒适呼吸区）。",
    });
  } else if (m.leading > RULES.leadingMax) {
    issues.push({
      id: "leading_scatter",
      severity: 84,
      probe: "leading",
      shortTag: `散行 ${m.leading}×`,
      title: `正文行距松到 ${m.leading}×，段落散成一条条孤立横线`,
      why: `行间空白超过字身 115% 后，上下两行的视觉距离甚至超过段距，大脑不再把它们当成同一段话，阅读节拍频频断气。`,
      action: "把「正文行距」收回到 1.50×–1.95× 区间，让段落重新凝成一个呼吸整体。",
    });
  }

  if (state.align === "mixed") {
    issues.push({
      id: "axis_chaos",
      severity: 88,
      probe: "rhythm",
      shortTag: `混用 3 轴`,
      title: `主标居中、导语右齐、正文左齐，眼睛每换一层都在跳轴`,
      why: `文字主导版式靠对齐线搭起隐形钢筋。现在整页出现 ${m.axesCount} 条互不咬合的起线，视线被迫左右折返，版面显得拼凑散乱。`,
      action: "将对齐切回「单轴左齐」或「双栏锚轴」，把五层文字钉在同一套隐形垂线上。",
    });
  } else if (state.align === "center" && m.bodyLinesCount >= 3) {
    issues.push({
      id: "center_body",
      severity: 72,
      probe: "rhythm",
      shortTag: `长段居中`,
      title: `多行正文居中排布，每行起点都在漂移`,
      why: `居中对齐适合 1–2 行短标题或碑铭；多行说明文字每行左端参差不齐，眼睛每次回扫都要重新找起点，阅读节奏被拖慢。`,
      action: "把对齐切到「单轴左齐」或「双栏锚轴」，让正文拥有齐整的左起线。",
    });
  }

  if (m.paraToLine < RULES.paraToLineMin) {
    issues.push({
      id: "proximity_invert",
      severity: 70,
      probe: "rhythm",
      shortTag: `段距偏紧`,
      title: `层间空隙（${m.paraToLine}× 行高）不够，主标、导语与正文粘成一坨`,
      why: `按完形接近律，不同信息层级之间的间隔必须明显大于段内行距；否则读完一层没有休止符，读者分不清信息在哪切段。`,
      action: "适当拉大层间段距或换用任一合法解预设，建立「密内疏外」的呼吸停顿。",
    });
  }

  // 检查是否发生扫读顺序倒挂（第一眼不是主标）
  const firstHit = layout.scanOrder[0];
  if (firstHit && firstHit.id !== "title" && m.imageShare <= RULES.imageShareMax) {
    issues.push({
      id: "order_invert",
      severity: 82,
      probe: "hierarchy",
      shortTag: `${firstHit.label}抢首眼`,
      title: `视觉权重倒挂：「${firstHit.label}」比主标更抢第一眼`,
      why: `按实测墨量与字号计算，眼睛进场最先落在了「${firstHit.label}」而不是主标上，读者先看到细节才回头找主题，路径反了。`,
      action: "加大字阶倍率并拉开主/正字重差，让主标成为绝对第一落点。",
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  // 计算四枚原海报核心探针（层级 / 行距 / 字号 / 阅读节奏）
  const has = (ids) => issues.find((it) => ids.includes(it.id));

  const hierarchyIssue = has(["image_hijack", "weight_flat", "order_invert"]);
  const leadingIssue = has(["leading_crush", "leading_scatter"]);
  const sizeIssue = has(["scale_flat", "scale_extreme"]);
  const rhythmIssue = has(["axis_chaos", "center_body", "proximity_invert", "leading_crush", "leading_scatter"]);

  const probes = {
    hierarchy: {
      ok: !hierarchyIssue,
      tag: hierarchyIssue
        ? hierarchyIssue.shortTag
        : `主标首眼 · 重差 ${m.weightDiff}`,
      status: hierarchyIssue ? "fail" : "ok",
    },
    leading: {
      ok: !leadingIssue,
      tag: leadingIssue ? leadingIssue.shortTag : `呼吸 ${m.leading}×`,
      status: leadingIssue ? "fail" : "ok",
    },
    size: {
      ok: !sizeIssue,
      tag: sizeIssue ? sizeIssue.shortTag : `主/正 ${m.titleToBody}×`,
      status: sizeIssue ? "fail" : "ok",
    },
    rhythm: {
      ok: !rhythmIssue,
      tag: rhythmIssue ? rhythmIssue.shortTag : `${m.alignLabel} · 节奏匀`,
      status: rhythmIssue ? "fail" : "ok",
    },
  };

  const passedCount = Object.values(probes).filter((p) => p.ok).length;
  const topIssue = issues[0] || null;

  // 紫色波形线形态特征（直接驱动原海报同款紫色波浪线）
  let waveMode = "harmonic"; // 舒缓周期正弦波
  if (m.titleToBody < RULES.titleToBodyMin && m.weightDiff === 0) waveMode = "flatline"; // 平权死直线
  else if (state.align === "mixed" || m.imageShare > RULES.imageShareMax) waveMode = "jagged"; // 乱轴/抢戏锯齿噪波
  else if (m.leading < RULES.leadingMin) waveMode = "cramped"; // 高频挤死波
  else if (m.leading > RULES.leadingMax) waveMode = "broken"; // 断气虚散波

  const verdict = topIssue
    ? {
        ok: false,
        badge: `${passedCount}/4 · ${topIssue.shortTag}`,
        title: topIssue.title,
        why: topIssue.why,
        action: topIssue.action,
        count: issues.length,
      }
    : {
        ok: true,
        badge: `4/4 · 文字主导成立`,
        title: `层级、字号、行距与节奏全线贯通，文字正在自己说话`,
        why: `主标以 ${m.titleToBody}× 字号差与 ${m.titleWeight}/${m.bodyWeight} 字重落差稳占第一落点，正文行距 ${m.leading}× 留出 ${m.lineGapPct}% 呼吸白带，${m.alignLabel}串联全页，配图克制静音在 ${m.imageShare}%。按 Space 实测视线将沿 ①→②→③→④ 一次走顺。`,
        action: "试试切换另外两组「多组合法解」，或点右侧「试错对照」破坏单一变量看波形如何崩塌。",
        count: 0,
      };

  return { probes, passedCount, issues, topIssue, verdict, waveMode };
}

// 03 节暗室「版面节拍编排器」单真源模块定义与密度评估
export const RHYTHM_BLOCKS = [
  { id: "heroHead", name: "巨标强拍", en: "DISPLAY", density: 0.86, height: 1.15, pause: 0.35, role: "peak", lines: 2 },
  { id: "pullQuote", name: "紫引停顿", en: "QUOTE", density: 0.42, height: 0.9, pause: 0.72, role: "rest", lines: 2 },
  { id: "denseWall", name: "通栏密段", en: "DENSE BODY", density: 0.78, height: 1.35, pause: 0.14, role: "wall", lines: 6 },
  { id: "twoCol", name: "双栏舒读", en: "SPLIT TEXT", density: 0.50, height: 1.1, pause: 0.48, role: "flow", lines: 4 },
  { id: "airBand", name: "留白休止", en: "SILENCE", density: 0.12, height: 0.72, pause: 0.95, role: "rest", lines: 1 },
];

export function evaluateRhythmSequence(seqIds) {
  const blocks = seqIds.map((id) => RHYTHM_BLOCKS.find((b) => b.id === id)).filter(Boolean);
  let wallStreak = 0;
  let maxWallStreak = 0;
  let restCount = 0;
  let peakFirst = blocks[0]?.role === "peak";
  const densities = blocks.map((b) => b.density);

  for (const b of blocks) {
    if (b.density >= 0.72) {
      wallStreak++;
      maxWallStreak = Math.max(maxWallStreak, wallStreak);
    } else {
      wallStreak = 0;
    }
    if (b.pause >= 0.65) restCount++;
  }

  const spread = Math.max(...densities) - Math.min(...densities);
  let status = "ok";
  let headline = "强拍领起、密疏交替，版面有呼吸有停顿";
  let detail = "眼睛从强拍大标进场，经由短段或休止带换气，再落进正文细读；灰度直方图呈错落山谷，读者不易中途弃读。";

  if (maxWallStreak >= 3) {
    status = "fail";
    headline = `连续 ${maxWallStreak} 块高密度黑字紧贴，形成视觉疲劳壁`;
    detail = "整片页面只剩浓重灰块没有换气口，眼睛扫完两行便想跳过。把「紫引停顿」或「留白休止」插进密段之间，立刻切出呼吸谷。";
  } else if (restCount === 0) {
    status = "fail";
    headline = "缺少留白休止或引语换气口，节奏从头绷到尾";
    detail = "通篇全是实心字块，即便字号有差，读久了依然窒息。文字主导版式里，空出来的地方和字一样重要。";
  } else if (!peakFirst) {
    status = "warn";
    headline = "开篇不是强拍入口，第一眼重心偏弱";
    detail = `目前最先出现的是「${blocks[0]?.name}」，读者要往下找才碰见主标题；将「巨标强拍」调回首位或紧随轻眉，阅读路径会更利落。`;
  } else if (spread < 0.35) {
    status = "warn";
    headline = "各块黑度过于接近，起伏偏平";
    detail = "灰度变化幅差只有 " + Math.round(spread * 100) + "%，整页像单调的节拍器。拉大强拍与休止带的反差，扫读效率更高。";
  }

  return { blocks, status, headline, detail, spread: Math.round(spread * 100), maxWallStreak, restCount };
}
