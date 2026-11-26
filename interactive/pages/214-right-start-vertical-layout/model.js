// 214 直排右起 · 单真源几何与版式评判模型（Hero 活字理列台）
// 画布绘制、四圆实况带、左栏五项核心原则灯与白话诊单全部从此模块读取同一组实绘坐标。

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报·山居秋暝",
    shortName: "山居秋暝",
    title: "山居秋暝",
    meta: "王维",
    defaultChars: 12,
    idealChars: [10, 22],
    // 四列逻辑正文（语义顺序 c1 → c2 → c3 → c4，在直排右起中应从右往左排布）
    // 每列准备扩展续字，拖动列高标尺到 15–26 字/列时真实汉字流式延展
    columns: {
      c1: "空山新雨后，天气晚来秋。薄雾轻笼翠微岭，松风初入晚林秋。",
      c2: "明月松间照，清泉石上流。银辉透叶泻青苔，涧水鸣琴过石桥。",
      c3: "竹喧归浣女，莲动下渔舟。笑语穿林惊宿鸟，轻桡破浪入沧洲。",
      c4: "随意春芳歇，王孙自可留。莫叹韶华随水去，山中岁月静如诗。",
    },
    snippetLabel: {
      title: "题签",
      c1: "首联",
      c2: "颔联",
      c3: "颈联",
      c4: "尾联",
    },
  },
  exhibit: {
    id: "exhibit",
    name: "展讯·秋山茶器展",
    shortName: "秋山茶器展",
    title: "秋山茶器展",
    meta: "拾月",
    defaultChars: 16,
    idealChars: [12, 22],
    columns: {
      c1: "以泥为骨，借火成器，邀君共赏秋日窑变清韵。一盏温润见山川。",
      c2: "展期自寒露至立冬，每日辰时开馆，酉时闭门。逢周一休馆整器。",
      c3: "现场陈列手拉坯壶、柴烧茶杯与粗陶建水百件。皆取本土原矿泥。",
      c4: "席间备有武夷岩茶与凤凰单丛，请凭请柬入席。慢品秋光不负茶。",
    },
    snippetLabel: {
      title: "展名",
      c1: "导语",
      c2: "展期",
      c3: "展品",
      c4: "茶席",
    },
  },
  book: {
    id: "book",
    name: "书封·林泉清赏序",
    shortName: "林泉清赏序",
    title: "林泉清赏录",
    meta: "序言",
    defaultChars: 18,
    idealChars: [14, 22],
    columns: {
      c1: "凡观画者，先看气韵，次察笔墨，再辨章法疏密。留白处亦是山河。",
      c2: "昔人书于竹帛，自上而下，由右向左，顺手而成序。千年卷帙皆如此。",
      c3: "今日重拾直排，并非泥古，乃取其从容沉静之节律。让目光慢下来。",
      c4: "一列十余字，天头齐平，列缝通透，则通篇神完气足。观之如临秋水。",
    },
    snippetLabel: {
      title: "书名",
      c1: "卷首",
      c2: "溯源",
      c3: "本意",
      c4: "章法",
    },
  },
};

export const IDEAL_ORDER = ["c4", "c3", "c2", "c1", "title"]; // 左 → 右槽位；最右 slot 4 为题签
export const REVERSED_ORDER = ["title", "c1", "c2", "c3", "c4"]; // 错误：直排左起
export const OPENING_ORDER = ["title", "c3", "c1", "c4", "c2"]; // 开场复合错态：题签最左 + 诗列错乱

// 参差天头固定偏移比例（相对字号），仅在 align === "ragged" 时生效
export const RAGGED_OFFSETS = {
  title: 0.4,
  c1: 1.55,
  c2: 0.1,
  c3: 2.1,
  c4: 0.95,
};

export function createInitialState() {
  return {
    specimen: "poster",
    order: [...OPENING_ORDER],
    align: "ragged", // "top" | "ragged" | "center"
    pitch: 1.24, // 列中心距 / 字号（1.24 表示列缝仅 0.24 字宽，紧挤串行）
    charsPerCol: 12, // 每列字数 6–28
    punct: "horizontal", // "vertical" | "horizontal"
    titleScale: "strong", // "strong" | "flat"
    showGuides: true,
    selectedId: "title",
  };
}

export const PRESETS = {
  opening: {
    label: "复原开场错态",
    kind: "reset",
    apply: (s) => ({
      ...s,
      order: [...OPENING_ORDER],
      align: "ragged",
      pitch: 1.24,
      charsPerCol: SPECIMENS[s.specimen].defaultChars,
      punct: "horizontal",
      titleScale: "strong",
      selectedId: "title",
    }),
  },
  classic: {
    label: "古籍疏朗解",
    kind: "good",
    apply: (s) => ({
      ...s,
      order: [...IDEAL_ORDER],
      align: "top",
      pitch: 2.02,
      charsPerCol: SPECIMENS[s.specimen].defaultChars,
      punct: "vertical",
      titleScale: "strong",
      selectedId: "title",
    }),
  },
  modern: {
    label: "现代海报解",
    kind: "good",
    apply: (s) => ({
      ...s,
      order: [...IDEAL_ORDER],
      align: "top",
      pitch: 1.68,
      charsPerCol: Math.min(18, Math.max(12, SPECIMENS[s.specimen].defaultChars + 2)),
      punct: "vertical",
      titleScale: "strong",
      selectedId: "title",
    }),
  },
  longBook: {
    label: "长列书卷解",
    kind: "good",
    apply: (s) => ({
      ...s,
      order: [...IDEAL_ORDER],
      align: "top",
      pitch: 1.92,
      charsPerCol: 20,
      punct: "vertical",
      titleScale: "strong",
      selectedId: "title",
    }),
  },
  errLeftStart: {
    label: "试错：排成左起",
    kind: "bad",
    apply: (s) => ({
      ...s,
      order: [...REVERSED_ORDER],
      align: "top",
      pitch: 1.95,
      charsPerCol: SPECIMENS[s.specimen].defaultChars,
      punct: "vertical",
      titleScale: "strong",
      selectedId: "title",
    }),
  },
  errCramped: {
    label: "试错：列缝挤粘",
    kind: "bad",
    apply: (s) => ({
      ...s,
      order: [...IDEAL_ORDER],
      align: "top",
      pitch: 1.18,
      charsPerCol: SPECIMENS[s.specimen].defaultChars,
      punct: "vertical",
      titleScale: "strong",
      selectedId: "c1",
    }),
  },
  errChoppy: {
    label: "试错：六字碎列",
    kind: "bad",
    apply: (s) => ({
      ...s,
      order: [...IDEAL_ORDER],
      align: "top",
      pitch: 1.95,
      charsPerCol: 6,
      punct: "vertical",
      titleScale: "strong",
      selectedId: "c1",
    }),
  },
  errFlatTitle: {
    label: "试错：无层级",
    kind: "bad",
    apply: (s) => ({
      ...s,
      order: [...IDEAL_ORDER],
      align: "center",
      pitch: 1.95,
      charsPerCol: 26,
      punct: "horizontal",
      titleScale: "flat",
      selectedId: "title",
    }),
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算单真源画布布局：所有坐标、边界框、字号、列缝比、天头极差、留白比
export function computeLayout(state, W, H, drag = null) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const compact = W < 440;
  const hasSidePanel = W >= 580;
  const padX = compact ? 14 : Math.round(clamp(W * 0.04, 18, 34));
  const topBarH = compact ? 30 : 34;
  const botBarH = compact ? 32 : 36;

  const sheet = {
    x: padX,
    y: topBarH,
    w: Math.max(200, W - padX * 2),
    h: Math.max(220, H - topBarH - botBarH),
  };

  const inset = compact ? 7 : 10;
  const sideW = hasSidePanel ? Math.round(clamp(sheet.w * 0.27, 152, 210)) : 0;
  const poemBox = {
    x: sheet.x + inset,
    y: sheet.y + inset,
    w: sheet.w - inset * 2 - (hasSidePanel ? sideW + 10 : 0),
    h: sheet.h - inset * 2,
  };
  const sidePanel = hasSidePanel
    ? {
        x: poemBox.x + poemBox.w + 10,
        y: poemBox.y,
        w: sideW,
        h: poemBox.h,
      }
    : null;

  const innerPadX = compact ? 16 : Math.round(clamp(poemBox.w * 0.065, 20, 42));
  const innerPadTop = compact ? 28 : 30;
  const innerPadBot = compact ? 48 : 50;

  const availW = poemBox.w - innerPadX * 2;
  const availH = poemBox.h - innerPadTop - innerPadBot;

  const nCols = state.order.length; // 5
  const pitch = clamp(state.pitch, 1.15, 3.1);
  const charsPerCol = Math.round(clamp(state.charsPerCol, 6, 28));
  const titleMult = state.titleScale === "strong" ? 1.32 : 1.0;

  // 根据可用宽与可用高反推清晰字号（保证绝不溢出边框）
  const extraRagged = state.align === "ragged" ? 2.15 : 0;
  const lineStepRatio = 1.12;
  const maxFontByH = availH / ((charsPerCol + extraRagged) * lineStepRatio + 0.5);
  // 5 列的水平总跨度 = 4 * pitch * fs + titleMult * fs
  const totalSpanUnits = (nCols - 1) * pitch + Math.max(titleMult, 1.15) + 0.45;
  const maxFontByW = availW / totalSpanUnits;
  const fontSize = clamp(Math.min(maxFontByH, maxFontByW, compact ? 20 : 24), 10.5, 24);
  const titleFontSize = fontSize * titleMult;
  const charStep = fontSize * lineStepRatio;
  const pitchPx = fontSize * pitch;

  // 整体列群居中于诗卷内框
  const groupW = (nCols - 1) * pitchPx + titleFontSize;
  const leftEdge = poemBox.x + (poemBox.w - groupW) / 2 + fontSize * 0.5;
  const headY = poemBox.y + innerPadTop;
  const footBarY = poemBox.y + poemBox.h - 16;

  // 构建 5 条实绘竖列（slot 0 最左 .. slot 4 最右）
  const slotCenters = Array.from({ length: nCols }, (_, i) => leftEdge + i * pitchPx);
  const cols = state.order.map((id, slotIndex) => {
    const isTitle = id === "title";
    const fs = isTitle ? titleFontSize : fontSize;
    const step = fs * (isTitle ? 1.16 : lineStepRatio);

    let chars = [];
    let metaChars = [];
    if (isTitle) {
      chars = [...spec.title];
      metaChars = [...spec.meta];
    } else {
      const raw = [...spec.columns[id]];
      chars = raw.slice(0, Math.min(raw.length, charsPerCol));
    }

    const colTextH = isTitle
      ? (1.05 + chars.length) * step + 10 + metaChars.length * (fontSize * 0.9)
      : chars.length * step;

    let topOffset = 0;
    if (state.align === "ragged") {
      topOffset = (RAGGED_OFFSETS[id] || 0) * fontSize;
    } else if (state.align === "center") {
      const visualH = isTitle ? colTextH : id === "c4" ? colTextH * 0.78 : id === "c2" ? colTextH * 0.9 : colTextH;
      topOffset = Math.max(0, (availH - visualH) * 0.5);
    }

    const colY = headY + topOffset;
    const maxColH = Math.max(44, footBarY - 26 - colY);
    const desiredH = isTitle
      ? colTextH
      : state.align === "center" && id === "c4"
        ? Math.max(4, chars.length - 2) * step
        : state.align === "center" && id === "c2"
          ? Math.max(5, chars.length - 1) * step
          : colTextH;
    const colH = Math.min(desiredH, maxColH);

    const renderedChars = isTitle
      ? chars
      : chars.slice(0, Math.max(3, Math.floor(colH / step + 0.15)));

    let cx = slotCenters[slotIndex];
    const isDragging = !!(drag && drag.mode === "slip" && drag.activeId === id);
    if (isDragging) {
      cx = clamp(drag.currentX, poemBox.x + fontSize, poemBox.x + poemBox.w - fontSize);
    }

    const colW = fs * 1.1;
    const semanticRank = isTitle ? 1 : Number(id.slice(1)) + 1;
    const actualRightIndex = nCols - slotIndex;

    return {
      id,
      slotIndex,
      actualRightIndex,
      semanticRank,
      isTitle,
      label: spec.snippetLabel[id] || id,
      fs,
      step,
      cx,
      x: cx - colW * 0.5,
      y: colY,
      w: colW,
      h: colH,
      topOffset,
      chars: renderedChars,
      metaChars,
      isDragging,
    };
  });

  // 按视觉从左到右排序用于核算真实相邻缝隙
  const sortedByX = [...cols].sort((a, b) => a.cx - b.cx);
  let minGapPx = Infinity;
  let sumGapPx = 0;
  for (let i = 0; i < sortedByX.length - 1; i++) {
    const a = sortedByX[i];
    const b = sortedByX[i + 1];
    const gap = b.x - (a.x + a.w);
    if (gap < minGapPx) minGapPx = gap;
    sumGapPx += gap;
  }
  const avgGapPx = sumGapPx / Math.max(1, sortedByX.length - 1);
  const gapRatio = avgGapPx / fontSize;

  const ys = cols.map((c) => c.y);
  const topVariancePx = Math.round(Math.max(...ys) - Math.min(...ys));

  const inkArea = cols.reduce((acc, c) => acc + c.w * c.h, 0);
  const sheetArea = Math.max(1, poemBox.w * poemBox.h);
  const whitespacePct = Math.round(clamp((1 - inkArea / sheetArea) * 100, 12, 92));

  const bodyCols = cols.filter((c) => !c.isTitle);
  const footY = clamp(
    Math.max(...bodyCols.map((c) => c.y + c.h)),
    headY + 56,
    footBarY - 22
  );

  const bySemantic = [...cols].sort((a, b) => a.semanticRank - b.semanticRank);
  const semanticPath = [];
  for (let i = 0; i < bySemantic.length; i++) {
    const c = bySemantic[i];
    semanticPath.push({
      id: c.id,
      rank: c.semanticRank,
      x: c.cx,
      y0: c.y,
      y1: c.y + c.h,
      next: bySemantic[i + 1]
        ? { x: bySemantic[i + 1].cx, y: bySemantic[i + 1].y }
        : null,
    });
  }

  return {
    W,
    H,
    compact,
    spec,
    sheet,
    inset,
    poemBox,
    sidePanel,
    headY,
    footY,
    footBarY,
    availW,
    availH,
    fontSize,
    titleFontSize,
    charStep,
    pitchPx,
    slotCenters,
    cols,
    avgGapPx,
    minGapPx,
    gapRatio,
    topVariancePx,
    whitespacePct,
    charsPerCol,
    semanticPath,
  };
}

// 从实绘几何与状态单真源核算 8 类双向失误、4 项支柱灯、5 项核心原则灯与白话诊单
export function evaluate(state, layout) {
  const { cols, gapRatio, topVariancePx, whitespacePct, charsPerCol, spec } = layout;
  const order = state.order;
  const titleSlot = order.indexOf("title"); // 4 = 最右（正确）
  const bodyOrder = order.filter((id) => id !== "title"); // 正确应为 ["c4", "c3", "c2", "c1"]

  const isExactIdealOrder = order.every((id, i) => id === IDEAL_ORDER[i]);
  const isExactLeftStart = order.every((id, i) => id === REVERSED_ORDER[i]);
  const isTitleRightmost = titleSlot === 4;
  const isBodyRightToLeft =
    bodyOrder[0] === "c4" &&
    bodyOrder[1] === "c3" &&
    bodyOrder[2] === "c2" &&
    bodyOrder[3] === "c1";

  const issues = [];

  // 1. 题签未坐最右 / 排成左起 / 列序错乱
  if (isExactLeftStart) {
    issues.push({
      code: "left_start_reversed",
      pillar: "order",
      severity: 10,
      short: "排成了左起",
      title: "整篇列序反了：这排成了「直排左起」",
      detail:
        "题签和首列掉到了最左边，正文往右推进——这是 215「直排左起」的读序。读者打开直排右起版面时视线先落在右上角，反而一头撞上结尾末句。",
      hint: "把最左边的题签拖到最右槽位，再将四列正文自右向左依次排成 1→2→3→4。",
      fixLabel: "一键归右理顺五列",
      fix: (s) => ({ ...s, order: [...IDEAL_ORDER] }),
    });
  } else if (!isTitleRightmost) {
    const rightPos = 5 - titleSlot;
    issues.push({
      code: "title_not_right",
      pillar: "order",
      severity: 9,
      short: "题签偏左",
      title: `题签「${spec.title}」掉在右起第 ${rightPos} 列，入口被正文抢占`,
      detail:
        "「以右为始」意味着最右一列必须坐镇视觉起点。现在题签缩在左侧，读者目光按习惯从右上角入画，先撞上正文半截句子，还得回头满版找标题。",
      hint: `直接向右拖动「${spec.title}」这一整条竖列，把它送回最右端（标 1 的原点槽）。`,
      fixLabel: "把题签拖回最右原点",
      fix: (s) => {
        const next = s.order.filter((id) => id !== "title");
        next.push("title");
        return { ...s, order: next, selectedId: "title" };
      },
    });
  } else if (!isBodyRightToLeft) {
    const rightFirstBody = cols.find((c) => c.slotIndex === 3);
    issues.push({
      code: "order_scrambled",
      pillar: "order",
      severity: 8,
      short: "诗列错序",
      title: `正文列序错位：题签左侧紧接着是「${rightFirstBody?.label || ""}」`,
      detail:
        "直排右起的每一列都按从右向左递进。当前正文四列次序打乱，视线沿竖列到底后向左跳列，接上的不是下一句而是跨段句子，语义节拍立刻折断。",
      hint: "左右拖动正文竖列，使从右向左依次为：题签 → 第 1 列 → 第 2 列 → 第 3 列 → 第 4 列。",
      fixLabel: "一键理顺正文四列",
      fix: (s) => ({ ...s, order: [...IDEAL_ORDER] }),
    });
  }

  // 2. 列缝挤粘 / 过散（双向检查）
  if (gapRatio < 0.42) {
    issues.push({
      code: "gap_cramped",
      pillar: "space",
      severity: 7,
      short: `列缝过挤 ${gapRatio.toFixed(2)}×`,
      title: `列缝仅 ${gapRatio.toFixed(2)}× 字宽，相邻竖列紧贴串行`,
      detail:
        "直排里列与列之间的空白就是横向防串行屏障。当列缝窄于半个字宽，余光不断扫进隔壁列的笔画，眼睛往下读时极易横跳读串列。",
      hint: "在列间空白处向右横拖，或调宽「列距」滑轨，让列缝落在 0.55×–1.45× 字宽之间。",
      fixLabel: "拉开列缝至舒适呼吸",
      fix: (s) => ({ ...s, pitch: 1.92 }),
    });
  } else if (gapRatio > 1.65) {
    issues.push({
      code: "gap_scattered",
      pillar: "space",
      severity: 6,
      short: `列缝过散 ${gapRatio.toFixed(2)}×`,
      title: `列缝拉宽到 ${gapRatio.toFixed(2)}× 字宽，各列散成孤岛`,
      detail:
        "留白过度同样会打断气韵。列间距超过 1.65 倍字宽后，读完一列底端再向左上方寻找下一列时视线跨度太大，整首诗拆成了互不相干的几条竖幅。",
      hint: "收紧「列距」至 0.55×–1.45× 净列缝区间，让各列重新抱团成章。",
      fixLabel: "收紧列缝重建整体感",
      fix: (s) => ({ ...s, pitch: 1.88 }),
    });
  }

  // 3. 天头参差 / 居中悬空
  if (state.align === "ragged" && topVariancePx > 4) {
    issues.push({
      code: "top_ragged",
      pillar: "align",
      severity: 7,
      short: `天头落差 ${topVariancePx}px`,
      title: `各列天头高低参差 ${topVariancePx}px，换列找不到起读落点`,
      detail:
        "直排阅读每换一列都要从底端向上左回扫到新列顶端。天头线不齐时，眼睛每次回扫都得重新上下摸索首字位置，稳定感瞬间瓦解。",
      hint: "把对齐切为「天头齐平」，让五条竖列共挂一条水平天头基线。",
      fixLabel: "对齐天头基准线",
      fix: (s) => ({ ...s, align: "top" }),
    });
  } else if (state.align === "center") {
    issues.push({
      code: "center_floating",
      pillar: "align",
      severity: 6,
      short: "竖列悬空居中",
      title: "竖列上下居中悬空，长短列把天头扯成阶梯",
      detail:
        "偶尔两三字招牌可以居中，但多列正文一居中，每列字数稍有不同，顶端起点就忽高忽低。直排秩序靠的是稳固的「天头线」而非竖向中轴。",
      hint: "切回「天头齐平」，让每一列都从同一水平高度稳稳下落。",
      fixLabel: "改回天头齐平",
      fix: (s) => ({ ...s, align: "top" }),
    });
  }

  // 4. 横排标点未转直排
  if (state.punct === "horizontal") {
    issues.push({
      code: "punct_horizontal",
      pillar: "flow",
      severity: 5,
      short: "横排标点错位",
      title: "逗号句号停在左下角：横排标点硬塞进了直排",
      detail:
        "按 W3C《中文排版需求》，直排标点应落在字格右上（或字格居中），引号也需转为竖向。把横排左下角的逗号直接竖排，标点会紧贴左邻列，造成视觉误连。",
      hint: "把标点切换为「直排标点」，观察逗号与句号归位到字格右上角的呼吸变化。",
      fixLabel: "启用直排标点规范",
      fix: (s) => ({ ...s, punct: "vertical" }),
    });
  }

  // 5. 单列字数过碎 / 过长（双向）
  if (charsPerCol < 8) {
    issues.push({
      code: "col_too_short",
      pillar: "flow",
      severity: 6,
      short: `单列仅 ${charsPerCol} 字`,
      title: `每列只有 ${charsPerCol} 字，诗句与语意被切碎`,
      detail:
        "每列字数过少时，一句话刚起头就被迫折列，眼球来回往左上猛跳，完全发挥不出直排「纵向为流、长文稳定」的顺畅惯性。",
      hint: "向下拖动列底标尺，或把每列字数调到 10–22 字区间。",
      fixLabel: `拉长列高至 ${spec.defaultChars} 字/列`,
      fix: (s) => ({ ...s, charsPerCol: spec.defaultChars }),
    });
  } else if (charsPerCol > 24) {
    issues.push({
      code: "col_too_long",
      pillar: "flow",
      severity: 5,
      short: `单列达 ${charsPerCol} 字`,
      title: `单列塞进 ${charsPerCol} 字，纵扫过长且压瘪天地留白`,
      detail:
        "原海报经验值建议正文每列 15–22 字（古诗可按句 10–14 字）。列过长后，眼珠一路向下扫完再猛地折返到上一排顶角，极易找错下一列，天头地脚也被挤得喘不过气。",
      hint: "向上收短列底标尺，将单列字数控制在 10–22 字以内。",
      fixLabel: `收短至 ${spec.defaultChars} 字/列`,
      fix: (s) => ({ ...s, charsPerCol: spec.defaultChars }),
    });
  }

  // 6. 题签层级拉平
  if (state.titleScale === "flat") {
    issues.push({
      code: "hierarchy_flat",
      pillar: "align",
      severity: 4,
      short: "题签无层级",
      title: "题签与正文字号完全拉平，看不出入口焦点",
      detail:
        "原海报第一条小贴士点明「标题更大更重，建立视觉焦点」。直排右起里，最右列的题签既是读序起点也是层级锚点，拉平字号会让右侧入口淹没在正文里。",
      hint: "开启「题签加重」，拉大最右列字号并点亮粉点与分界细线。",
      fixLabel: "恢复题签视觉重心",
      fix: (s) => ({ ...s, titleScale: "strong" }),
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  const pillars = {
    order: isExactIdealOrder,
    flow: charsPerCol >= 8 && charsPerCol <= 24 && state.punct === "vertical",
    align: state.align === "top" && topVariancePx <= 4 && state.titleScale === "strong",
    space: gapRatio >= 0.42 && gapRatio <= 1.65,
  };

  const passedCount = Object.values(pillars).filter(Boolean).length;
  const allGood = passedCount === 4 && issues.length === 0;

  // 多组合法解识别（绝不锁死唯一参数）
  let solutionName = "";
  let solutionDesc = "";
  if (allGood) {
    if (gapRatio >= 1.28) {
      solutionName = "宽韵展陈解";
      solutionDesc = `列缝舒展到 ${gapRatio.toFixed(2)}× 字宽，版面留白 ${whitespacePct}%，适合美术馆题签与清雅诗卷。`;
    } else if (gapRatio < 0.72) {
      solutionName = "现代紧致海报解";
      solutionDesc = `列缝精炼在 ${gapRatio.toFixed(2)}× 字宽、每列 ${charsPerCol} 字，版面紧凑有力，适合当代展讯与书封副栏。`;
    } else if (charsPerCol >= 17) {
      solutionName = "长列书卷叙事解";
      solutionDesc = `每列 ${charsPerCol} 字落入海报推荐的 15–22 字书卷区间，天头齐平、右起有序，长文阅读极稳。`;
    } else {
      solutionName = "经典古籍疏朗解";
      solutionDesc = `题签坐镇最右原点、四列自右向左展开、列缝 ${gapRatio.toFixed(2)}× 且留白 ${whitespacePct}%，复现了原海报的端正气韵。`;
    }
  }

  // 原海报左栏五项「核心原则」实况映射
  const principles = [
    {
      key: "column",
      ok: pillars.align && state.align === "top",
      tag: pillars.align ? `天头齐平 · 差 ${topVariancePx}px` : state.align === "center" ? "居中悬空" : `天头差 ${topVariancePx}px`,
    },
    {
      key: "flow",
      ok: pillars.flow,
      tag: pillars.flow
        ? `${charsPerCol} 字/列 · 直排标点`
        : state.punct === "horizontal"
          ? "横排标点错位"
          : `${charsPerCol} 字/列失衡`,
    },
    {
      key: "rightStart",
      ok: pillars.order,
      tag: pillars.order ? "右起有序 1←5" : isExactLeftStart ? "反成左起" : isTitleRightmost ? "正文错序" : `题签在左`,
    },
    {
      key: "rhythm",
      ok: pillars.space,
      tag: pillars.space
        ? `列缝 ${gapRatio.toFixed(2)}× · 留白 ${whitespacePct}%`
        : gapRatio < 0.42
          ? `挤粘 ${gapRatio.toFixed(2)}×`
          : `过散 ${gapRatio.toFixed(2)}×`,
    },
    {
      key: "hierarchy",
      ok: isTitleRightmost && state.titleScale === "strong",
      tag:
        isTitleRightmost && state.titleScale === "strong"
          ? "右锚 1.32× 焦点"
          : !isTitleRightmost
            ? "焦点偏左"
            : "字号拉平",
    },
  ];

  // 四枚原海报顶部圆徽（一 右起、二 纵流、三 对齐、四 留白）
  const fourCircles = [
    {
      num: "一",
      title: "右起为序",
      ok: pillars.order,
      readout: pillars.order ? "右锚有序" : isExactLeftStart ? "反排左起" : "列序待理",
    },
    {
      num: "二",
      title: "纵向为流",
      ok: pillars.flow,
      readout: pillars.flow ? `${charsPerCol}字·直标` : state.punct === "horizontal" ? "标点错位" : `${charsPerCol}字失当`,
    },
    {
      num: "三",
      title: "对齐有度",
      ok: pillars.align,
      readout: pillars.align ? "天头齐平" : topVariancePx > 4 ? `落差${topVariancePx}px` : state.titleScale === "flat" ? "层级拉平" : "悬空失锚",
    },
    {
      num: "四",
      title: "留白呼吸",
      ok: pillars.space,
      readout: pillars.space ? `留白 ${whitespacePct}%` : gapRatio < 0.42 ? "列缝挤粘" : "列缝过散",
    },
  ];

  return {
    passedCount,
    allGood,
    issues,
    topIssue: issues[0] || null,
    pillars,
    principles,
    fourCircles,
    solutionName,
    solutionDesc,
    metrics: {
      gapRatio: +gapRatio.toFixed(2),
      topVariancePx,
      whitespacePct,
      charsPerCol,
      titleRightPos: 5 - titleSlot,
    },
    badgeText: allGood ? `4/4 · ${solutionName}` : `${passedCount}/4 · ${issues[0]?.short || "待调整"}`,
    cssSnippet: `writing-mode: vertical-rl; line-height: ${state.pitch.toFixed(2)}; font-feature-settings: "${state.punct === "vertical" ? "vert" : "normal"}";`,
  };
}
