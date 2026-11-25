// 167 引语主导版式 · 单真源排印几何与诊断模型
// 所有画布坐标、留白率、左沿偏移、遮挡率、节拍停顿与诊断文字均由此模块实时核算。

export const PALETTE = {
  bg: "#10100F",
  bgDeep: "#0B0B0A",
  panel: "#181816",
  panelLift: "#21211E",
  rule: "#363829",
  lime: "#BEC819",
  limeBright: "#D4DF26",
  limeSoft: "rgba(190, 200, 25, 0.16)",
  limeMuted: "#8F9818",
  cream: "#EFE6D2",
  creamDim: "#C4BDA9",
  creamMuted: "#8E8A7C",
  warn: "#FF7A5C",
  warnBg: "rgba(255, 122, 92, 0.15)",
  ok: "#C8D422",
  okBg: "rgba(190, 200, 25, 0.14)",
  paperLight: "#F4EFE2",
  paperOlive: "#475206",
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 瑞士宣言",
    tag: "POSTER SPECIMEN",
    text: "排版不仅传递信息，也组织阅读。",
    // 不可劈开的词内部断点（在第 i 个字符之后换行会劈词或使标点落行首）
    // 0排 1版 2不 3仅 4传 5递 6信 7息 8， 9也 10组 11织 12阅 13读 14。
    badBreaks: [1, 3, 5, 7, 8, 11, 13, 14],
    punctBreaks: [8, 14],
    goodBreaks: [4, 9],
    altTwoBreaks: [9],
    // 初始错态断点：长行塞满并劈开「阅|读」吊出孤字「读。」
    initialBreaks: [13],
    // 关键词高亮区间（含起止字索引）
    keywordRange: [10, 14],
    author: "约瑟夫·米勒-布罗克曼",
    authorEn: "JOSEF MÜLLER-BROCKMANN",
    role: "瑞士平面设计师 / 《网格系统》作者",
    longBio:
      "约瑟夫·米勒-布罗克曼（1914–1996），瑞士平面设计师与教师，曾任教于苏黎世应用艺术学校，联合创办《新平面设计》期刊，1981 年由 Arthur Niggli 出版《平面设计中的网格系统》双语手册，长期推动国际主义排印与网格规范。",
    enQuote: "Layout not only conveys information, it organizes reading.",
  },
  magazine: {
    id: "magazine",
    label: "杂志跨页 · 建筑访谈",
    tag: "MAGAZINE SAMPLE",
    // 0房 1间 2不 3是 4容 5器 6， 7它 8是 9光 10影 11停 12下 13来 14呼 15吸 16的 17地 18方 19。
    text: "房间不是容器，它是光影停下来呼吸的地方。",
    badBreaks: [1, 3, 5, 6, 10, 12, 13, 15, 18, 19],
    punctBreaks: [6, 19],
    goodBreaks: [7, 14],
    altTwoBreaks: [7],
    initialBreaks: [18],
    keywordRange: [9, 16],
    author: "建筑评论访谈 · 教学样本",
    authorEn: "EDITORIAL INTERVIEW SAMPLE",
    role: "杂志特写引语示范（非真实人物原话）",
    longBio:
      "本段为杂志专访开篇示范样本，通常刊载于 12 页人物长文的第 3 跨页左侧，用于检验在密集双栏文字之间，访谈核心句是否能借由放大与气口停顿独立成章，而非用冗长编者按占满版底空间。",
    enQuote: "A room is not a container; it is where light pauses to breathe.",
  },
  book: {
    id: "book",
    label: "书封腰封 · 随笔样本",
    tag: "BOOK JACKET SAMPLE",
    // 0好 1问 2题 3不 4给 5答 6案 7， 8它 9把 10地 11图 12往 13前 14多 15铺 16一 17寸 18。
    text: "好问题不给答案，它把地图往前多铺一寸。",
    badBreaks: [2, 6, 7, 11, 13, 17, 18],
    punctBreaks: [7, 18],
    goodBreaks: [8, 14],
    altTwoBreaks: [8],
    initialBreaks: [17],
    keywordRange: [10, 18],
    author: "科学随笔集 · 教学样本",
    authorEn: "BOOK JACKET SAMPLE",
    role: "书封与章节题词示范（非名人语录）",
    longBio:
      "本段为书籍封底与腰封教学示范文本，展示当封面不配摄影或插画时，单靠一句精准切分的短引语与克制署名就能撑起书店陈列的远距识别度，切忌把整本内容提要和推荐名单全堆在句尾。",
    enQuote: "A good question offers no answer; it unfolds the map one inch further.",
  },
};

export function createInitialState(specimenId = "poster") {
  const sp = SPECIMENS[specimenId] || SPECIMENS.poster;
  return {
    specimen: sp.id,
    scale: 1.24, // 初始偏小，淹没在灰正文段落里
    breaks: [...sp.initialBreaks], // 初始故意劈词且吊出孤字
    quoteMark: "straight", // 机械直引号内缩啃左沿
    emphasis: "none", // 零强调平铺
    attribution: "rival", // 署名同号抢主
    lineHeight: 1.24,
  };
}

export function normalizeBreaks(breaks, textLen) {
  const uniq = [...new Set(breaks.map((n) => Math.round(n)).filter((n) => n >= 1 && n < textLen))];
  uniq.sort((a, b) => a - b);
  return uniq;
}

export function toggleBreak(state, idx) {
  const sp = SPECIMENS[state.specimen];
  const clean = normalizeBreaks(state.breaks, sp.text.length);
  const pos = clean.indexOf(idx);
  if (pos >= 0) clean.splice(pos, 1);
  else clean.push(idx);
  return { ...state, breaks: normalizeBreaks(clean, sp.text.length) };
}

export function splitLines(text, breaks) {
  const clean = normalizeBreaks(breaks, text.length);
  const lines = [];
  let start = 0;
  for (const b of clean) {
    lines.push({ text: text.slice(start, b), start, end: b });
    start = b;
  }
  lines.push({ text: text.slice(start), start, end: text.length });
  return lines;
}

const PUNCT_RE = /^[，。、；：！？,.!?;:]$/;
const isPunct = (ch) => PUNCT_RE.test(ch);

function countHanChars(str) {
  let n = 0;
  for (const ch of str) if (!isPunct(ch) && ch.trim()) n++;
  return n;
}

// 估算字符渲染宽（相对 fontSize），避免离屏依赖同时保持与 Noto Sans SC 900 极高吻合度
export function charWidthRatio(ch) {
  if (isPunct(ch)) return 0.54;
  if (/[A-Za-z0-9]/.test(ch)) return 0.62;
  if (ch === " ") return 0.34;
  return 1.02;
}

export function measureLinePx(str, fontSize, letterSpacing = 0) {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    w += charWidthRatio(str[i]) * fontSize;
    if (i < str.length - 1) w += letterSpacing;
  }
  return w;
}

/**
 * 单真源几何计算：返回画布上每一个元素的真实像素矩形、留白率、遮挡率、左沿缩进和节拍表。
 */
export function computeLayout(state, width = 900, height = 580) {
  const sp = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const W = Math.max(320, width);
  const H = Math.max(240, height);
  const scaleNorm = W / 900; // 画布缩放基准

  // 原海报式版心安全边界（顶部留给微缩标尺，左侧留给悬挂引号走廊）
  const padTop = Math.round(44 * scaleNorm);
  const padBottom = Math.round(32 * scaleNorm);
  const padLeft = Math.round(92 * scaleNorm);
  const padRight = Math.round(78 * scaleNorm);
  const safeRect = {
    x: padLeft,
    y: padTop,
    w: W - padLeft - padRight,
    h: H - padTop - padBottom,
  };

  // 基础字号：1.0× ≈ 28px (at W=900)，3.0× ≈ 84px (at W=900)
  // 原海报三拍在 2.25×–2.55× 时最雄浑大气（约 63–72px）
  const baseFontPx = 28 * scaleNorm;
  const fontSize = Math.max(13, baseFontPx * state.scale);
  const letterSpacing = fontSize * 0.02;
  const lineH = fontSize * state.lineHeight;

  const rawLines = splitLines(sp.text, state.breaks);
  const lineCount = rawLines.length;

  // 光学左沿偏移：仅在机械直引号内缩时，第一行首字被迫右移
  const straightQuoteW = state.quoteMark === "straight" ? fontSize * 0.64 : 0;
  const opticalIndentPx = Math.round(straightQuoteW);

  // 估算文字块总高
  const quoteBlockH = lineCount * lineH;

  // 笔刷高度（位于最后一行下方）
  const brushH = state.emphasis === "brush" ? Math.max(9 * scaleNorm, fontSize * 0.22) : 0;
  const brushGap = state.emphasis === "brush" ? Math.max(6 * scaleNorm, fontSize * 0.14) : 0;

  // 出处区高度计算
  let attrFontPx = 0;
  let attrBlockH = 0;
  let attrGap = Math.max(16 * scaleNorm, fontSize * 0.34);
  if (state.attribution === "rival") {
    attrFontPx = Math.max(14 * scaleNorm, fontSize * 0.88);
    attrBlockH = attrFontPx * 1.35 + 16 * scaleNorm;
    attrGap = Math.max(12 * scaleNorm, fontSize * 0.24);
  } else if (state.attribution === "quiet") {
    attrFontPx = Math.max(11.5 * scaleNorm, Math.min(20 * scaleNorm, fontSize * 0.30));
    attrBlockH = attrFontPx * 1.4 + 28 * scaleNorm;
  } else if (state.attribution === "bio") {
    attrFontPx = Math.max(11 * scaleNorm, 13.5 * scaleNorm);
    attrBlockH = 98 * scaleNorm;
    attrGap = 14 * scaleNorm;
  } else {
    attrGap = 0;
  }

  // 上方巨引号需要预留空间（hanging 模式）
  const openQuoteSize =
    state.quoteMark === "hanging"
      ? Math.max(40 * scaleNorm, Math.min(92 * scaleNorm, fontSize * 1.18))
      : state.quoteMark === "giant"
        ? Math.max(120 * scaleNorm, Math.min(235 * scaleNorm, H * 0.44))
        : 0;

  const topQuoteClearance = state.quoteMark === "hanging" ? openQuoteSize * 0.68 : 0;
  const totalStackH = topQuoteClearance + quoteBlockH + brushGap + brushH + attrGap + attrBlockH;

  // 垂直居中于安全区，偏上 4% 贴合视觉中心
  const idealTop = safeRect.y + (safeRect.h - totalStackH) * 0.46;
  const stackTop = Math.max(safeRect.y + 8 * scaleNorm, idealTop);
  const textStartY = stackTop + topQuoteClearance;

  // 计算每一行的真实像素框与字间气口刀命中盒
  const lines = [];
  const cuts = []; // 每个可点击字间断行锚点（包含已断行和未断行）
  let maxLineW = 0;
  let totalTextArea = 0;
  let overflowRightPx = 0;

  for (let li = 0; li < rawLines.length; li++) {
    const rl = rawLines[li];
    const xStart = safeRect.x + (li === 0 ? straightQuoteW : 0);
    const yTop = textStartY + li * lineH;
    const wLine = measureLinePx(rl.text, fontSize, letterSpacing);
    const extraTailQuote = li === rawLines.length - 1 && state.quoteMark === "straight" ? straightQuoteW : 0;
    const rightEdge = xStart + wLine + extraTailQuote;
    maxLineW = Math.max(maxLineW, rightEdge - safeRect.x);
    const over = Math.max(0, rightEdge - (safeRect.x + safeRect.w));
    overflowRightPx = Math.max(overflowRightPx, over);

    // 逐字坐标（用于画布渲染关键词高亮、节拍光束和点击气口刀）
    const chars = [];
    let cx = xStart;
    for (let ci = 0; ci < rl.text.length; ci++) {
      const ch = rl.text[ci];
      const cw = charWidthRatio(ch) * fontSize;
      const globalIdx = rl.start + ci;
      chars.push({
        ch,
        globalIdx,
        x: cx,
        y: yTop,
        w: cw,
        h: fontSize,
        isKeyword: globalIdx >= sp.keywordRange[0] && globalIdx <= sp.keywordRange[1],
        isPunct: isPunct(ch),
      });
      cx += cw + letterSpacing;

      // 在每个字符之后记录气口刀（最后一个字符除外）
      const cutIndex = globalIdx + 1;
      if (cutIndex < sp.text.length) {
        const active = state.breaks.includes(cutIndex);
        const isBad = sp.badBreaks.includes(cutIndex);
        const isGood = sp.goodBreaks.includes(cutIndex);
        cuts.push({
          cutIndex,
          active,
          isBad,
          isGood,
          lineIndex: li,
          x: cx - letterSpacing * 0.5,
          y: yTop + fontSize * 0.52,
          hitR: Math.max(12 * scaleNorm, fontSize * 0.28),
        });
      }
    }

    const hanCount = countHanChars(rl.text);
    const startsWithPunct = rl.text.length > 0 && isPunct(rl.text[0]);
    const rect = { x: xStart, y: yTop, w: wLine, h: fontSize * 1.04 };
    totalTextArea += rect.w * rect.h;

    lines.push({
      index: li,
      text: rl.text,
      start: rl.start,
      end: rl.end,
      hanCount,
      startsWithPunct,
      rect,
      baselineY: yTop + fontSize * 0.86,
      chars,
      overPx: over,
    });
  }

  // 垂直溢出检验
  const stackBottom = textStartY + quoteBlockH + brushGap + brushH + attrGap + attrBlockH;
  const overflowBottomPx = Math.max(0, stackBottom - (H - padBottom * 0.5));

  // 斜对角引号几何盒（严格单真源计算，供绘制与遮挡检测共用）
  let openQuoteRect = null;
  let closeQuoteRect = null;
  if (state.quoteMark === "hanging") {
    const qw = openQuoteSize * 1.02;
    const qh = openQuoteSize * 0.78;
    // 左上悬挂：略超出文字左沿，位于第一行上方（忠实复刻 167 原海报）
    openQuoteRect = {
      x: safeRect.x - qw * 0.14,
      y: Math.max(padTop * 0.72, textStartY - qh - fontSize * 0.20),
      w: qw,
      h: qh,
    };
    const lastLine = lines[lines.length - 1];
    const anchorRight = Math.min(safeRect.x + safeRect.w + 18 * scaleNorm, Math.max(safeRect.x + maxLineW * 0.88, lastLine.rect.x + lastLine.rect.w - qw * 0.15));
    closeQuoteRect = {
      x: anchorRight - qw * 0.65,
      y: textStartY + quoteBlockH + brushGap + brushH + 6 * scaleNorm,
      w: qw,
      h: qh,
    };
  } else if (state.quoteMark === "giant") {
    const qw = openQuoteSize * 1.05;
    const qh = openQuoteSize * 0.84;
    // 故意失控膨胀压在文字上方
    openQuoteRect = {
      x: safeRect.x + maxLineW * 0.04,
      y: textStartY - qh * 0.15,
      w: qw,
      h: qh,
    };
    closeQuoteRect = {
      x: safeRect.x + Math.max(maxLineW * 0.42, 120 * scaleNorm),
      y: textStartY + quoteBlockH * 0.32,
      w: qw,
      h: qh,
    };
  }

  // 计算引号与文字行盒的真实像素重叠率
  function rectOverlap(a, b) {
    if (!a || !b) return 0;
    const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return ox * oy;
  }
  let quoteOverlapArea = 0;
  for (const ln of lines) {
    quoteOverlapArea += rectOverlap(openQuoteRect, ln.rect);
    quoteOverlapArea += rectOverlap(closeQuoteRect, ln.rect);
  }
  const quoteOverlapPct = totalTextArea > 0 ? Math.min(100, Math.round((quoteOverlapArea / totalTextArea) * 100)) : 0;

  // 干笔荧光刷线几何盒（位于最后一行收束句下方）
  const lastLine = lines[lines.length - 1];
  const brushRect =
    state.emphasis === "brush"
      ? {
          x: safeRect.x - 6 * scaleNorm,
          y: lastLine.rect.y + lastLine.rect.h + brushGap * 0.4,
          w: Math.max(120 * scaleNorm, Math.min(safeRect.w + 16 * scaleNorm, lastLine.rect.w * 1.08)),
          h: brushH,
        }
      : null;

  // 出处署名几何盒
  const attrRect =
    state.attribution === "missing"
      ? null
      : {
          x: safeRect.x,
          y: textStartY + quoteBlockH + brushGap + brushH + attrGap,
          w: state.attribution === "bio" ? Math.min(safeRect.w, 600 * scaleNorm) : Math.min(safeRect.w * 0.72, 430 * scaleNorm),
          h: attrBlockH,
          fontPx: attrFontPx,
        };

  // 计算实测留白率（画布总面积减去文字、引号、笔刷、出处实际占用面积）
  const canvasArea = W * H;
  const quoteArea =
    (openQuoteRect ? openQuoteRect.w * openQuoteRect.h * 0.62 : 0) +
    (closeQuoteRect ? closeQuoteRect.w * closeQuoteRect.h * 0.62 : 0);
  const brushArea = brushRect ? brushRect.w * brushRect.h : 0;
  const attrArea = attrRect ? attrRect.w * attrRect.h * (state.attribution === "bio" ? 0.85 : 0.45) : 0;
  const emphasisFloodExtra = state.emphasis === "flood" ? totalTextArea * 0.36 : 0;
  const usedArea = Math.min(canvasArea * 0.96, totalTextArea * 1.18 + quoteArea + brushArea + attrArea + emphasisFloodExtra);
  const whitespacePct = Math.max(4, Math.min(94, Math.round(((canvasArea - usedArea) / canvasArea) * 100)));

  // 强调高光覆盖率（占文字总字数比例）
  let emphasisCoveragePct = 0;
  if (state.emphasis === "flood") {
    emphasisCoveragePct = 100;
  } else if (state.emphasis === "brush") {
    emphasisCoveragePct = Math.round((lastLine.text.length / sp.text.length) * 100);
  } else if (state.emphasis === "keyword") {
    const kwLen = sp.keywordRange[1] - sp.keywordRange[0] + 1;
    emphasisCoveragePct = Math.round((kwLen / sp.text.length) * 100);
  }

  // 出处与引语字号比
  const attrScaleRatio = state.attribution === "missing" ? 0 : +(attrFontPx / fontSize).toFixed(2);

  // 检查词界与断行健康度
  const splitWords = [];
  let punctAtLineStart = false;
  for (let i = 0; i < state.breaks.length; i++) {
    const b = state.breaks[i];
    if (sp.punctBreaks.includes(b)) punctAtLineStart = true;
    else if (sp.badBreaks.includes(b)) {
      splitWords.push(sp.text.slice(Math.max(0, b - 1), Math.min(sp.text.length, b + 1)));
    }
  }
  const lastHan = lastLine.hanCount;
  const hasOrphanTail = lineCount >= 2 && lastHan <= 1;
  const hasSingleCharLine = lines.some((ln) => ln.hanCount <= 1);
  const avgHanPerLine = countHanChars(sp.text) / lineCount;
  const isChoppyColumn = lineCount >= 5 || (lineCount >= 4 && avgHanPerLine <= 3.3);
  const isSingleWall = lineCount === 1 && countHanChars(sp.text) >= 12;
  const measurePct = Math.round((maxLineW / safeRect.w) * 100);

  // 生成阅读节拍表（与画布扫描光束严格同源）
  const beats = [];
  let tCursor = 0;
  for (let li = 0; li < lines.length; li++) {
    const ln = lines[li];
    const readDur = Math.max(0.42, ln.text.length * 0.145);
    // 句尾逗号、句号、换行赋予不同气口停顿；劈词处会标出卡顿
    const breakAfter = li < lines.length - 1 ? ln.end : -1;
    const isStutter = breakAfter > 0 && sp.badBreaks.includes(breakAfter);
    const hasPunctEnd = ln.text.endsWith("，") || ln.text.endsWith("。");
    const pauseDur = li === lines.length - 1 ? 0.55 : isStutter ? 0.42 : hasPunctEnd ? 0.36 : 0.22;
    beats.push({
      lineIndex: li,
      text: ln.text,
      startT: +tCursor.toFixed(2),
      endT: +(tCursor + readDur).toFixed(2),
      pauseEndT: +(tCursor + readDur + pauseDur).toFixed(2),
      isStutter,
      hasPunctEnd,
    });
    tCursor += readDur + pauseDur;
  }

  return {
    W,
    H,
    scaleNorm,
    safeRect,
    fontSize,
    lineH,
    lines,
    cuts,
    openQuoteRect,
    closeQuoteRect,
    brushRect,
    attrRect,
    maxLineW,
    measurePct,
    overflowRightPx: Math.round(overflowRightPx),
    overflowBottomPx: Math.round(overflowBottomPx),
    opticalIndentPx,
    quoteOverlapPct,
    whitespacePct,
    emphasisCoveragePct,
    attrScaleRatio,
    splitWords,
    punctAtLineStart,
    hasOrphanTail,
    hasSingleCharLine,
    isChoppyColumn,
    isSingleWall,
    lineCount,
    beats,
    totalBeatSec: +tCursor.toFixed(2),
  };
}

/**
 * 双向四支柱单真源诊断引擎
 */
export function evaluateLayout(state, layout) {
  const sp = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const issues = [];

  // 1. 节奏 RHYTHM（尺度 + 断行气口 + 留白）
  let rhythmStatus = { ok: true, badge: `${layout.lineCount} 拍 · 留白 ${layout.whitespacePct}%`, code: "ok" };
  if (layout.punctAtLineStart) {
    rhythmStatus = { ok: false, badge: "标点落行首", code: "punct_start" };
    issues.push({
      pillar: "rhythm",
      severity: 100,
      code: "punct_start",
      headline: "逗号或句号掉到行首，阅读气口瞬间撞墙",
      why: "中文排印避头尾规则最忌标点独占行首。标点是上一句的收气，把它切到下一行开头会让眼睛停在半空，破坏整句的流畅声调。",
      action: "把标点前的气口刀撤掉，改在标点后面落刀换行。",
      fixLabel: "一键整理三拍气口",
      fixPatch: { breaks: [...sp.goodBreaks] },
      canvasTag: "× 标点落行首 · 点此归位气口",
    });
  } else if (layout.splitWords.length > 0) {
    const sample = layout.splitWords[0];
    rhythmStatus = { ok: false, badge: `劈词「${sample}」`, code: "split_word" };
    issues.push({
      pillar: "rhythm",
      severity: 95,
      code: "split_word",
      headline: `「${sample}」从词中间硬劈开，默读像被卡住喉咙`,
      why: "人眼读大字引语时是按词组整块抓取的。把一个双字词劈在两行首尾，眼睛刚扫到上半个词就得折返找下半个词，节奏感立刻碎裂。",
      action: "点按画布上标红的断行刀撤回劈词，改在词组与逗号后的自然停顿处换行。",
      fixLabel: "一键修整断行气口",
      fixPatch: { breaks: [...sp.goodBreaks] },
      canvasTag: `× 劈词「${sample}」· 点此归位气口`,
    });
  } else if (layout.hasOrphanTail || layout.hasSingleCharLine) {
    rhythmStatus = { ok: false, badge: "孤字吊尾", code: "orphan_tail" };
    issues.push({
      pillar: "rhythm",
      severity: 90,
      code: "orphan_tail",
      headline: "行末掉出孤零零一个字，尾拍泄气失重",
      why: "引语收尾最需要笃定收束。如果只剩一个孤字孤悬在末行，读者的视觉落点就会突然一空，整句宣言的份量被直接削薄一半。",
      action: "点按句中字间气口刀重新分配断行，让每行至少托住 3–6 个实词。",
      fixLabel: "重排自然三拍气口",
      fixPatch: { breaks: [...sp.goodBreaks] },
      canvasTag: "× 孤字吊尾 · 点此重排气口",
    });
  } else if (layout.overflowRightPx > 6 || layout.overflowBottomPx > 8 || layout.whitespacePct < 24) {
    rhythmStatus = { ok: false, badge: `留白仅 ${layout.whitespacePct}%`, code: "overflow_choke" };
    issues.push({
      pillar: "rhythm",
      severity: 92,
      code: "overflow_choke",
      headline: `字号撑爆版心、留白跌到 ${layout.whitespacePct}%，画面窒息无处落眼`,
      why: "引语放大不是越大越好。一旦文字撞出边距或把留白挤到 24% 以下，四周没了呼吸缓冲，大字反而像堵在眼前的广告墙，失去出版物的从容气度。",
      action: "向左横拖印张把字号收回到 2.1×–2.5×，或在句中多落一刀换行释放行宽。",
      fixLabel: "收回到舒适尺度与留白",
      fixPatch: { scale: 2.35, breaks: [...sp.goodBreaks], lineHeight: 1.18 },
      canvasTag: `× 留白 ${layout.whitespacePct}% 爆框 · 点此收尺`,
    });
  } else if (state.scale < 1.62) {
    rhythmStatus = { ok: false, badge: `尺度 ${state.scale.toFixed(2)}× 偏弱`, code: "too_small" };
    issues.push({
      pillar: "rhythm",
      severity: 86,
      code: "too_small",
      headline: `字号只有 ${state.scale.toFixed(2)}×，引语淹没成普通段落`,
      why: "引语主导版式靠的就是尺度反差让句子取代配图成为第一焦点。字号只比正文大一点时，读者滑过页面根本不会停下脚步。",
      action: "向右横拖海报印张（或推尺度轨）到 1.85× 以上，让这句话真正立起来。",
      fixLabel: "放大到原海报主角尺度",
      fixPatch: { scale: 2.35 },
      canvasTag: `× 仅 ${state.scale.toFixed(2)}× 淹没失焦 · 右拖放大`,
    });
  } else if (layout.isChoppyColumn) {
    rhythmStatus = { ok: false, badge: `${layout.lineCount} 行过碎`, code: "choppy_column" };
    issues.push({
      pillar: "rhythm",
      severity: 82,
      code: "choppy_column",
      headline: `切成 ${layout.lineCount} 行超碎窄柱，视线被迫高频来回跳`,
      why: "每行只剩两三个字时，读者刚读半个意群就得换行折返，原本连贯的观点被剁成零散词签，流畅的节奏感变成了结巴感。",
      action: "点掉多余的气口刀，把整句收拢为 2–3 拍自然停顿。",
      fixLabel: "收拢为三拍节奏",
      fixPatch: { breaks: [...sp.goodBreaks] },
      canvasTag: `× ${layout.lineCount} 行过碎 · 点此收拢`,
    });
  } else if (layout.isSingleWall) {
    rhythmStatus = { ok: false, badge: "长行无气口", code: "single_wall" };
    issues.push({
      pillar: "rhythm",
      severity: 78,
      code: "single_wall",
      headline: "整句摊成一整行，没有断行气口就没有轻重停顿",
      why: "把十几个字平铺成一条横条时，每个字权重一样，读者一口气扫到底记不住重点。主动切出 2–3 行气口，才能决定读者在哪一拍停下来回味。",
      action: "直接点按画布里句中词缝，在逗号或转折前落下一两刀气口。",
      fixLabel: "切出原海报三拍停顿",
      fixPatch: { breaks: [...sp.goodBreaks] },
      canvasTag: "× 无断行气口 · 点句中落刀",
    });
  } else if (state.lineHeight < 1.04 || state.lineHeight > 1.54) {
    const tight = state.lineHeight < 1.04;
    rhythmStatus = { ok: false, badge: tight ? "行距粘连" : "行距散架", code: "bad_leading" };
    issues.push({
      pillar: "rhythm",
      severity: 74,
      code: "bad_leading",
      headline: tight ? `行距压到 ${state.lineHeight.toFixed(2)}×，上下行笔画几乎相撞` : `行距拉散到 ${state.lineHeight.toFixed(2)}×，一句话裂成几行孤立标语`,
      why: tight
        ? "特粗展示黑体在紧凑行距下虽然有力，但低于 1.05× 会让上一行底脚贴到下一行顶沿，读起来发紧发闷。"
        : "引语行距拉得过宽会让各行失去聚合力，读者不再把它们当成同一句完整的话来读。",
      action: "将行距调回 1.12×–1.34× 区间，既保持块面聚合，又留出视线折返通道。",
      fixLabel: "归回 1.18× 紧凑行距",
      fixPatch: { lineHeight: 1.18 },
      canvasTag: tight ? "× 行距粘连 · 点此放松" : "× 行距散架 · 点此收紧",
    });
  }

  // 2. 引用 QUOTE（引号形制与光学对齐）
  let quoteStatus = {
    ok: true,
    badge: state.quoteMark === "hanging" ? "斜角挂引号 · 0px 缩进" : "极简省引号 · 0px 缩进",
    code: "ok",
  };
  if (state.quoteMark === "straight") {
    quoteStatus = { ok: false, badge: `直引号啃边 +${layout.opticalIndentPx}px`, code: "straight_indent" };
    issues.push({
      pillar: "quote",
      severity: 88,
      code: "straight_indent",
      headline: `机械直引号挤进第一行，把左沿啃凹了 ${layout.opticalIndentPx}px`,
      why: "直引号是打字机时代的权宜妥协；更糟的是把它排在正文行内，会让第一行汉字被迫右退半格，整个文字块的左垂线立刻显得参差业余。",
      action: "切换为「斜角悬挂巨引号」（挂出基准线外），或在足够大的尺度下「独立省去引号」。",
      fixLabel: "换原海报斜角挂引号",
      fixPatch: { quoteMark: "hanging" },
      canvasTag: `× 直引号内缩 +${layout.opticalIndentPx}px · 点此改悬挂`,
    });
  } else if (state.quoteMark === "giant" || layout.quoteOverlapPct > 12) {
    quoteStatus = { ok: false, badge: `引号压字 ${layout.quoteOverlapPct}%`, code: "quote_overlap" };
    issues.push({
      pillar: "quote",
      severity: 93,
      code: "quote_overlap",
      headline: `装饰巨引号压住正文 ${layout.quoteOverlapPct}% 面积，反客为主`,
      why: "引号是替观点拉开帷幕的配角。把它放得过大并直接盖在汉字上，读者第一眼全被色块吸引，反而要费力辨认句子本身。",
      action: "把引号退回到句首上方与句尾右下斜角（零遮挡），让文字成为绝对主角。",
      fixLabel: "退回斜角零遮挡挂引号",
      fixPatch: { quoteMark: "hanging" },
      canvasTag: `× 引号压字 ${layout.quoteOverlapPct}% · 点此退位`,
    });
  } else if (state.quoteMark === "none" && (state.scale < 1.95 || layout.whitespacePct < 36)) {
    quoteStatus = { ok: false, badge: "素排信号偏弱", code: "bare_weak" };
    issues.push({
      pillar: "quote",
      severity: 76,
      code: "bare_weak",
      headline: "省去引号时尺度与留白不够足，句子少了“摘录感”",
      why: "正如 Matthew Butterick 指出，独立成段的引语可以省去多余引号，但前提是靠足够大的尺度反差、36%+ 留白和明确署名，让版式自己宣告「这是一句引语」。",
      action: "把字号推到 2.0× 以上并保留充裕留白，或补上斜角挂引号强化引语身份。",
      fixLabel: "补足尺度成立无引号解",
      fixPatch: { scale: 2.25, breaks: [...sp.goodBreaks] },
      canvasTag: "× 无引号且气场不足 · 点此补尺",
    });
  }

  // 3. 强调 EMPHASIS（视觉抓手与克制）
  let emphasisStatus = {
    ok: true,
    badge: state.emphasis === "brush" ? `干笔刷线 · 覆 ${layout.emphasisCoveragePct}%` : `关键词亮色 · 覆 ${layout.emphasisCoveragePct}%`,
    code: "ok",
  };
  if (state.emphasis === "none") {
    emphasisStatus = { ok: false, badge: "零强调平铺", code: "no_emphasis" };
    issues.push({
      pillar: "emphasis",
      severity: 80,
      code: "no_emphasis",
      headline: "全句平铺零视觉重音，读完记不住“句眼”在哪",
      why: "引语放大后如果全句一律同色同重、毫无视觉锚点，读者仍会一眼滑过。给收束句刷上一笔干笔划痕，或点亮核心词，就能替视线定住最后的重拍。",
      action: "开启「尾句干笔刷线」（原海报做法）或「关键词亮色」，只强调全句 25%–45% 的精华。",
      fixLabel: "刷上原海报干笔强调线",
      fixPatch: { emphasis: "brush" },
      canvasTag: "× 全句零强调 · 点此加干笔刷线",
    });
  } else if (state.emphasis === "flood") {
    emphasisStatus = { ok: false, badge: "100% 涂满失焦", code: "over_emphasis" };
    issues.push({
      pillar: "emphasis",
      severity: 89,
      code: "over_emphasis",
      headline: "整句 100% 糊满亮黄荧光，处处强调等于全无强调",
      why: "强调的本质是稀缺对比。当每一个字都被涂上高饱和底色，亮色与底色的稀缺张力就彻底蒸发，只剩刺眼喧闹。",
      action: "把强调收回到单一核心句的干笔底线，或仅点亮 4–7 个关键词。",
      fixLabel: "收回到克制干笔刷线",
      fixPatch: { emphasis: "brush" },
      canvasTag: "× 100% 满涂失焦 · 点此克制",
    });
  }

  // 4. 出处 ATTRIBUTION（主从退让）
  let attrStatus = { ok: true, badge: `退让 ${layout.attrScaleRatio}×`, code: "ok" };
  if (state.attribution === "rival") {
    attrStatus = { ok: false, badge: `同号抢主 ${layout.attrScaleRatio}×`, code: "attr_rival" };
    issues.push({
      pillar: "attribution",
      severity: 84,
      code: "attr_rival",
      headline: `出处署名放大到引语的 ${Math.round(layout.attrScaleRatio * 100)}%，和观点抢第一眼`,
      why: "在引语主导版式里，核心思想必须绝对领跑，人物署名应当是紧随其后的第二落点。两者字号接近时，视线会在引语和人名之间来回拉锯。",
      action: "把出处切回「破折号退让署名」，字号退至引语的 25%–35%，既留人声又不抢主。",
      fixLabel: "切回破折号退让署名",
      fixPatch: { attribution: "quiet" },
      canvasTag: "× 署名同号抢主 · 点此退让",
    });
  } else if (state.attribution === "missing") {
    attrStatus = { ok: false, badge: "缺失出处", code: "attr_missing" };
    issues.push({
      pillar: "attribution",
      severity: 77,
      code: "attr_missing",
      headline: "去掉了说话人出处，引语退化成来历不明的口号",
      why: "引语之所以比大标题更有温度和说服力，正因为背后有真实的人声与语境。抹掉署名后，读者无从判断这是谁说的、凭什么可信。",
      action: "恢复破折号退让署名，用克制字号交代人物与作品来源。",
      fixLabel: "补回破折号退让署名",
      fixPatch: { attribution: "quiet" },
      canvasTag: "× 无出处无来源 · 点此补署名",
    });
  } else if (state.attribution === "bio") {
    attrStatus = { ok: false, badge: "长传记压底", code: "attr_bio" };
    issues.push({
      pillar: "attribution",
      severity: 81,
      code: "attr_bio",
      headline: "底部塞入一整段生平履历，把引语的呼吸余韵全吃掉了",
      why: "引语下方需要一片安静的“回声区”让读者品完这句话。在署名处堆砌大段履历，既拖慢节奏，又把版底塞成杂乱尾注。",
      action: "精简为「破折号 + 姓名 + 一行身份」三要素，其余背景交回正文或图注。",
      fixLabel: "精简为一行退让署名",
      fixPatch: { attribution: "quiet" },
      canvasTag: "× 履历过长压底 · 点此精简",
    });
  }

  issues.sort((a, b) => b.severity - a.severity);
  const pillars = {
    quote: quoteStatus,
    emphasis: emphasisStatus,
    rhythm: rhythmStatus,
    attribution: attrStatus,
  };
  const passedCount = Object.values(pillars).filter((p) => p.ok).length;
  const allOk = passedCount === 4;

  // 识别多组合法解（绝不锁死单一答案）
  let solutionName = "";
  let solutionSummary = "";
  if (allOk) {
    if (state.quoteMark === "hanging" && state.emphasis === "brush") {
      solutionName = "成立 · 原海报斜角巨引号三拍解";
      solutionSummary = `字号 ${state.scale.toFixed(2)}× 配 ${layout.whitespacePct}% 留白，斜对角巨引号零遮挡包夹，干笔刷线锁住尾句重拍，署名安静退让——一句纯文字自己撑起了整张海报。`;
    } else if (state.quoteMark === "hanging" && state.emphasis === "keyword") {
      solutionName = "成立 · 杂志跨页亮词悬挂解";
      solutionSummary = `不靠手刷装饰线，改用关键词酸黄绿点亮全句 ${layout.emphasisCoveragePct}% 句眼，引号左挂 0px 缩进、气口顺畅——更适合现代期刊与长篇人物专访。`;
    } else if (state.quoteMark === "none") {
      solutionName = "成立 · 极简展墙无引号解";
      solutionSummary = `呼应 Matthew Butterick「独立成段可省去冗余引号」的思路：靠 ${state.scale.toFixed(2)}× 尺度反差、${layout.whitespacePct}% 留白与清晰气口，无需引号也能一眼认出引语身份。`;
    } else {
      solutionName = "成立 · 平衡引语排印解";
      solutionSummary = `四大支柱全部通过检定：${layout.lineCount} 拍断行无劈词孤字、左沿零缩进、留白 ${layout.whitespacePct}%、主从分明。`;
    }
  }

  // 节奏档位（定性档位而非伪精确百分数）
  let cadenceTier = "失序停滞";
  if (allOk) cadenceTier = layout.lineCount === 3 ? "三拍笃定" : layout.lineCount === 2 ? "两拍舒朗" : "四拍阶梯";
  else if (passedCount >= 2) cadenceTier = "半通待修";

  return {
    pillars,
    passedCount,
    allOk,
    issues,
    primary: issues[0] || null,
    solutionName,
    solutionSummary,
    cadenceTier,
  };
}

// 预设（含 3 组合法解 + 3 组试错态 + 复原初态）
export function getPresets(specimenId = "poster") {
  const sp = SPECIMENS[specimenId] || SPECIMENS.poster;
  return {
    posterSol: {
      label: "原海报三拍解",
      kind: "good",
      patch: { scale: 2.38, breaks: [...sp.goodBreaks], quoteMark: "hanging", emphasis: "brush", attribution: "quiet", lineHeight: 1.18 },
    },
    magSol: {
      label: "杂志亮词解",
      kind: "good",
      patch: { scale: 2.08, breaks: [...sp.altTwoBreaks], quoteMark: "hanging", emphasis: "keyword", attribution: "quiet", lineHeight: 1.24 },
    },
    minimalSol: {
      label: "极简无引号解",
      kind: "good",
      patch: { scale: 2.26, breaks: [...sp.goodBreaks], quoteMark: "none", emphasis: "brush", attribution: "quiet", lineHeight: 1.20 },
    },
    errFlood: {
      label: "试错：全句涂满",
      kind: "bad",
      patch: { scale: 2.20, breaks: [...sp.goodBreaks], quoteMark: "hanging", emphasis: "flood", attribution: "quiet", lineHeight: 1.18 },
    },
    errOverflow: {
      label: "试错：爆字压框",
      kind: "bad",
      patch: { scale: 2.95, breaks: [...sp.altTwoBreaks], quoteMark: "giant", emphasis: "brush", attribution: "bio", lineHeight: 1.02 },
    },
    errSplit: {
      label: "试错：劈词碎行",
      kind: "bad",
      patch: { scale: 1.88, breaks: [1, 4, 7, 10, 13], quoteMark: "straight", emphasis: "none", attribution: "missing", lineHeight: 1.20 },
    },
  };
}
