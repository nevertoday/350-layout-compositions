// 179 两端对齐 · 单真源活字排盘与河流检测引擎
// 所有画布排字、行宽、缝隙倍率、河流链条、末行占宽与四项诊断全部从同一套实绘几何数组算出。

export const SPECIMENS = {
  bilingual: {
    id: "bilingual",
    label: "中英混排·短栏",
    short: "中英混排",
    lang: "zh",
    fontFamily: '"Noto Sans SC", "IBM Plex Sans", sans-serif',
    idealCpl: [17, 34],
    unitLabel: "汉字当量/行",
    // 真实杂志常见中英混排段落：穿插长英文术语与中文标点，窄栏与未断词时极易撕出河流
    tokens: [
      "在", "杂", "志", "与", "书", "籍", "排", "版", "中", "，",
      { text: "Typography", parts: ["Ty", "pog", "ra", "phy"] },
      "的", "秩", "序", "首", "先", "来", "自", "稳", "定", "的",
      { text: "Justification", parts: ["Jus", "ti", "fi", "ca", "tion"] },
      "。", "当", "正", "文", "混", "入",
      { text: "Micro-typography", parts: ["Mi", "cro-", "ty", "pog", "ra", "phy"] },
      "与",
      { text: "Readability", parts: ["Read", "a", "bil", "i", "ty"] },
      "等", "长", "词", "时", "，", "若", "栏", "宽", "过", "窄", "或", "未", "启", "用", "标", "点", "挤", "压", "，",
      "行", "内", "空", "隙", "会", "被", "瞬", "间", "扯", "裂", "，", "连", "成", "纵", "向", "白", "色", "河", "流", "。",
      "只", "有", "栏", "宽", "、", "字", "号", "与", "段", "落", "均", "衡", "配", "合", "得", "当", "，",
      "版", "面", "才", "会", "沉", "静", "耐", "读", "。"
    ],
  },
  chinese: {
    id: "chinese",
    label: "原海报·纯中文",
    short: "原海报纯中文",
    lang: "zh",
    fontFamily: '"Noto Sans SC", sans-serif',
    idealCpl: [17, 34],
    unitLabel: "字/行",
    // 1:1 逐字取自 179 原海报示例文本
    tokens: [
      ..."设计是一种有目的的创造活动，它通过视觉元素传达信息、解决问题并影响受众。优秀的版式设计能够提升信息的可读性与理解效率，同时传递清晰的层级与秩序。两端对齐是一种常见且专业的排版方式，它通过调整字间距，使每一行文字的左右两端保持整齐，形成均匀的文字灰度与稳定的阅读节奏。合理的栏宽、行距与字距控制是实现高质量两端对齐的关键。"
    ],
  },
  english: {
    id: "english",
    label: "经典书页·英文",
    short: "英文书页",
    lang: "en",
    fontFamily: '"Libre Baskerville", Georgia, serif',
    idealCpl: [42, 75],
    unitLabel: "字符/行",
    // 经典书籍排版英文排样，配真实连字断词点
    words: [
      ["Good"], ["ju", "sti", "fi", "ca", "tion"], ["turns"], ["scat", "tered"], ["lines"], ["in", "to"], ["a"],
      ["cal", "mer"], ["ar", "chi", "tec", "tur", "al"], ["rect", "an", "gle,"], ["hold", "ing"], ["a"],
      ["qui", "et"], ["and"], ["u", "ni", "form"], ["grey"], ["a", "cross"], ["the"], ["page."],
      ["When"], ["the"], ["col", "umn"], ["mea", "sure"], ["grows"], ["too"], ["nar", "row"], ["with", "out"],
      ["hy", "phen", "a", "tion,"], ["word"], ["spac", "es"], ["stretch"], ["a", "part"], ["and"], ["con", "nect"],
      ["in", "to"], ["un", "sight", "ly"], ["ver", "ti", "cal"], ["riv", "ers"], ["that"], ["in", "ter", "rupt"],
      ["con", "tin", "u", "ous"], ["read", "ing."], ["A"], ["bal", "anced"], ["par", "a", "graph"],
      ["com", "pos", "er"], ["looks"], ["a", "head"], ["to"], ["keep"], ["ev", "ery"], ["line"], ["even."]
    ],
  },
};

const OPEN_PUNCT = new Set(["（", "《", "「", "『", "【", "“", "‘"]);
const CLOSE_PUNCT = new Set(["，", "。", "、", "；", "：", "！", "？", "）", "》", "」", "』", "】", "”", "’"]);

export const PRESETS = {
  broken: {
    id: "broken",
    label: "开场错态",
    specimen: "bilingual",
    columnRatio: 0.39,
    fontSize: 18,
    hyphenCompress: false,
    lastLineJustify: true,
    composer: "greedy",
    alignMode: "justify",
    xray: false,
  },
  book: {
    id: "book",
    label: "书刊正栏解",
    specimen: "bilingual",
    columnRatio: 0.72,
    fontSize: 15,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    alignMode: "justify",
    xray: false,
  },
  magazine: {
    id: "magazine",
    label: "紧凑双栏解",
    specimen: "bilingual",
    columnRatio: 0.58,
    fontSize: 13,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    alignMode: "justify",
    xray: false,
  },
  posterZh: {
    id: "posterZh",
    label: "原海报纯中文解",
    specimen: "chinese",
    columnRatio: 0.68,
    fontSize: 15,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    alignMode: "justify",
    xray: false,
  },
  classicEn: {
    id: "classicEn",
    label: "英文书页解",
    specimen: "english",
    columnRatio: 0.80,
    fontSize: 14,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    alignMode: "justify",
    xray: false,
  },
  errNarrow: {
    id: "errNarrow",
    label: "窄栏河流",
    specimen: "bilingual",
    columnRatio: 0.39,
    fontSize: 18,
    hyphenCompress: false,
    lastLineJustify: false,
    composer: "greedy",
    alignMode: "justify",
    xray: true,
  },
  errWide: {
    id: "errWide",
    label: "超宽行迷路",
    specimen: "bilingual",
    columnRatio: 0.95,
    fontSize: 12,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    alignMode: "justify",
    xray: false,
  },
  errLast: {
    id: "errLast",
    label: "末行强撑 180",
    specimen: "bilingual",
    columnRatio: 0.65,
    fontSize: 15,
    hyphenCompress: true,
    lastLineJustify: true,
    composer: "balanced",
    alignMode: "justify",
    xray: false,
  },
  errRagged: {
    id: "errRagged",
    label: "左对齐 176",
    specimen: "bilingual",
    columnRatio: 0.72,
    fontSize: 15,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    alignMode: "left",
    xray: false,
  },
};

// 06 节专用四选一考题短段：结尾稳收短末行，单变量差异肉眼可辨
SPECIMENS.quiz = {
  id: "quiz",
  label: "练习排样",
  short: "练习",
  lang: "zh",
  fontFamily: '"Noto Sans SC", "IBM Plex Sans", sans-serif',
  idealCpl: [17, 34],
  unitLabel: "汉字当量/行",
  tokens: [
    "优", "秀", "的",
    { text: "Justification", parts: ["Jus", "ti", "fi", "ca", "tion"] },
    "能", "让", "版", "面", "像", "块", "稳", "定", "的", "灰", "调", "织", "物", "，",
    "读", "者", "在", "阅", "读",
    { text: "Micro-typography", parts: ["Mi", "cro-", "ty", "pog", "ra", "phy"] },
    "等", "术", "语", "时", "不", "会", "被", "突", "然", "扯", "开", "的", "白", "缝", "绊", "倒", "，",
    "能", "安", "心", "读", "完", "。"
  ],
};

export function createInitialState() {
  return { ...PRESETS.broken };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function isCjkChar(ch) {
  return /[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/.test(ch);
}

// 将语料展平成统一排版单元序列（boxes + glue + optional hyphenation breaks）
function buildItems(specimenId, hyphenCompress, fontSize, measure) {
  const spec = SPECIMENS[specimenId] || SPECIMENS.bilingual;
  const items = [];
  const spaceW = measure(" ", spec.fontFamily, fontSize);
  const hyphenW = measure("-", spec.fontFamily, fontSize);
  const cjkLatinGap = fontSize * 0.24;

  if (spec.lang === "en") {
    for (let wi = 0; wi < spec.words.length; wi++) {
      const parts = spec.words[wi];
      const full = parts.join("");
      if (hyphenCompress && parts.length > 1) {
        for (let pi = 0; pi < parts.length; pi++) {
          const text = parts[pi];
          const isLastPart = pi === parts.length - 1;
          items.push({
            text,
            kind: "word-part",
            width: measure(text, spec.fontFamily, fontSize),
            cjkEq: text.length,
            canBreakAfter: !isLastPart || wi < spec.words.length - 1,
            hyphenBreak: !isLastPart,
            hyphenW,
            spaceAfter: isLastPart && wi < spec.words.length - 1 ? spaceW : 0,
            noStart: false,
            noEnd: false,
            flexScale: 1,
          });
        }
      } else {
        items.push({
          text: full,
          kind: "word",
          width: measure(full, spec.fontFamily, fontSize),
          cjkEq: full.length,
          canBreakAfter: wi < spec.words.length - 1,
          hyphenBreak: false,
          hyphenW: 0,
          spaceAfter: wi < spec.words.length - 1 ? spaceW : 0,
          noStart: false,
          noEnd: false,
          flexScale: 1,
        });
      }
    }
    return { items, spec, spaceW, hyphenW };
  }

  // 中文或中英混排
  const raw = spec.tokens;
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    const next = raw[i + 1];
    const nextIsLatin = next && typeof next === "object";
    if (typeof entry === "object") {
      const parts = entry.parts;
      const full = entry.text;
      const hasGapAfter = next !== undefined && !(typeof next === "string" && CLOSE_PUNCT.has(next));
      if (hyphenCompress && parts && parts.length > 1) {
        for (let pi = 0; pi < parts.length; pi++) {
          const text = parts[pi];
          const isLastPart = pi === parts.length - 1;
          const endsWithDash = text.endsWith("-");
          items.push({
            text,
            kind: "latin-part",
            width: measure(text, spec.fontFamily, fontSize),
            cjkEq: text.length * 0.54,
            canBreakAfter: true,
            hyphenBreak: !isLastPart && !endsWithDash,
            hyphenW: endsWithDash ? 0 : hyphenW,
            spaceAfter: isLastPart && hasGapAfter ? cjkLatinGap : 0,
            noStart: false,
            noEnd: false,
            flexScale: isLastPart ? 1.5 : 0.4,
          });
        }
      } else {
        items.push({
          text: full,
          kind: "latin",
          width: measure(full, spec.fontFamily, fontSize),
          cjkEq: full.length * 0.54,
          canBreakAfter: true,
          hyphenBreak: false,
          hyphenW: 0,
          spaceAfter: hasGapAfter ? cjkLatinGap : 0,
          noStart: false,
          noEnd: false,
          flexScale: 1.8,
        });
      }
    } else {
      const ch = entry;
      const isClose = CLOSE_PUNCT.has(ch);
      const isOpen = OPEN_PUNCT.has(ch);
      const rawW = measure(ch, spec.fontFamily, fontSize);
      // 启用标点挤压时，闭合标点实际占位收紧至 ~0.58em（留出半角视觉缓冲）
      const width = hyphenCompress && (isClose || isOpen) ? rawW * 0.58 : rawW;
      const gapAfter = nextIsLatin && !isOpen ? cjkLatinGap : 0;
      items.push({
        text: ch,
        kind: isClose ? "punct-close" : isOpen ? "punct-open" : isCjkChar(ch) ? "cjk" : "latin",
        width,
        rawW,
        cjkEq: isClose || isOpen ? (hyphenCompress ? 0.65 : 1) : 1,
        canBreakAfter: !isOpen,
        hyphenBreak: false,
        hyphenW: 0,
        spaceAfter: gapAfter,
        noStart: isClose,
        noEnd: isOpen,
        flexScale: isClose ? (hyphenCompress ? 1.35 : 0.9) : gapAfter > 0 ? 1.6 : 1,
      });
    }
  }
  return { items, spec, spaceW, hyphenW };
}

// 计算 [start, end) 作为一行的自然宽度与断行代价
function lineNaturalMetrics(items, start, end, colWidth, isLast, spec, hyphenCompress, fontSize) {
  let contentW = 0;
  let nominalGapSum = 0;
  let flexWeightSum = 0;
  let gapCount = 0;
  let cpl = 0;
  let kinsokuHit = false;

  if (hyphenCompress && items[start].noStart) kinsokuHit = true;
  if (hyphenCompress && items[end - 1].noEnd) kinsokuHit = true;

  for (let i = start; i < end; i++) {
    const it = items[i];
    contentW += it.width;
    cpl += it.cjkEq;
    if (i < end - 1) {
      nominalGapSum += it.spaceAfter;
      if (spec.lang === "en") {
        if (it.spaceAfter > 0) {
          gapCount++;
          flexWeightSum += 1;
        }
      } else {
        // 中英混排中，字间/词间都可吸纳弹性；但西文断词内部不拉散
        if (!(it.kind === "latin-part" && items[i + 1].kind === "latin-part" && it.spaceAfter === 0)) {
          gapCount++;
          flexWeightSum += it.flexScale;
        }
      }
    }
  }
  const endItem = items[end - 1];
  const needsHyphen = !isLast && endItem.hyphenBreak;
  const hypW = needsHyphen ? endItem.hyphenW : 0;
  const naturalW = contentW + nominalGapSum + hypW;
  const slack = colWidth - naturalW;

  // 若启用标点挤压且行末有闭合标点，允许半角微探出提升齐边观感
  let badness = 0;
  if (slack < -fontSize * 0.22) {
    return { valid: false, naturalW, slack, badness: 1e9, cpl, gapCount, flexWeightSum, needsHyphen, kinsokuHit };
  }
  if (isLast) {
    // 末行太孤单（仅 1–2 字）给温和惩罚，避免孤字掉行
    badness = cpl < 3 ? 28 : 0;
  } else if (slack < 0) {
    // 仅在全局均衡模式下允许轻微压紧（最多约 -4% 栏宽 / 仅压标点与词缝）
    const ratio = Math.abs(slack) / Math.max(fontSize * 0.6, nominalGapSum * 0.4 + fontSize * 0.35);
    badness = ratio > 1.05 ? 1e7 : 36 * ratio * ratio * ratio;
  } else {
    const baseStretch = spec.lang === "en"
      ? Math.max(fontSize * 0.5, gapCount * fontSize * 0.28)
      : Math.max(fontSize * 0.65, flexWeightSum * fontSize * 0.14);
    const ratio = slack / baseStretch;
    badness = 20 * ratio * ratio * ratio;
  }
  if (needsHyphen) badness += 12;
  if (kinsokuHit) badness += 180;
  return { valid: true, naturalW, slack, badness, cpl, gapCount, flexWeightSum, needsHyphen, kinsokuHit };
}

// 逐行贪心断行
function breakGreedy(items, colWidth, spec, hyphenCompress, fontSize) {
  const n = items.length;
  const breaks = [];
  let start = 0;
  while (start < n) {
    let bestEnd = start + 1;
    let curW = 0;
    for (let i = start; i < n; i++) {
      const it = items[i];
      const nextW = curW + it.width + (i > start ? items[i - 1].spaceAfter : 0);
      const hyp = i < n - 1 && it.hyphenBreak ? it.hyphenW : 0;
      if (i > start && nextW + hyp > colWidth) break;
      curW = nextW;
      // 合法断点检查
      const isEnd = i === n - 1;
      const canBreak = isEnd || it.canBreakAfter || it.hyphenBreak;
      if (canBreak) {
        // 如果开启禁则，尽量不要让下一行行首是闭合标点
        if (!isEnd && hyphenCompress && items[i + 1].noStart && i > start) {
          // 留待下一次循环看能否把标点带进来，若带不进则回退一字
        } else {
          bestEnd = i + 1;
        }
      }
    }
    // 处理极端长单词超出一栏宽度
    if (bestEnd <= start) bestEnd = start + 1;
    // 如果开启禁则且下一行首是闭合标点，退一字把上一字带到下一行（若可行）
    if (hyphenCompress && bestEnd < n && items[bestEnd].noStart && bestEnd - start > 2) {
      bestEnd -= 1;
    }
    breaks.push([start, bestEnd]);
    start = bestEnd;
  }
  return breaks;
}

// 段落全局均衡断行（Knuth-Plass 动态规划思路）
function breakBalanced(items, colWidth, spec, hyphenCompress, fontSize) {
  const n = items.length;
  const dp = new Float64Array(n + 1).fill(Infinity);
  const prev = new Int32Array(n + 1).fill(-1);
  const lineBad = new Float64Array(n + 1).fill(0);
  dp[0] = 0;

  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(dp[i])) continue;
    let curW = 0;
    let foundAny = false;
    for (let j = i + 1; j <= n; j++) {
      const it = items[j - 1];
      curW += it.width + (j - 1 > i ? items[j - 2].spaceAfter : 0);
      const isLast = j === n;
      const canBreak = isLast || it.canBreakAfter || it.hyphenBreak;
      if (!canBreak) continue;
      if (curW > colWidth + fontSize * 0.25 && foundAny) break;

      const m = lineNaturalMetrics(items, i, j, colWidth, isLast, spec, hyphenCompress, fontSize);
      if (!m.valid && foundAny) break;
      if (!m.valid && !foundAny && j > i + 1) continue;

      foundAny = true;
      // 加入相邻两行松紧跳变惩罚，让整段灰度更平滑
      const jump = i > 0 ? Math.abs(Math.min(m.badness, 400) - Math.min(lineBad[i], 400)) * 0.18 : 0;
      const cost = dp[i] + Math.min(m.badness, 8000) + jump + 4;
      if (cost < dp[j]) {
        dp[j] = cost;
        prev[j] = i;
        lineBad[j] = m.badness;
      }
      if (curW > colWidth + fontSize * 0.25) break;
    }
    // 兜底防死锁（极端窄栏塞不下超长词）
    if (!foundAny && i + 1 <= n) {
      const cost = dp[i] + 9000;
      if (cost < dp[i + 1]) {
        dp[i + 1] = cost;
        prev[i + 1] = i;
      }
    }
  }

  const breaks = [];
  let cur = n;
  while (cur > 0 && prev[cur] >= 0) {
    breaks.push([prev[cur], cur]);
    cur = prev[cur];
  }
  if (cur !== 0) return breakGreedy(items, colWidth, spec, hyphenCompress, fontSize);
  return breaks.reverse();
}

// 主排字函数：返回逐行、逐字词、逐空隙的精确几何坐标与完整诊断
export function layoutParagraph(state, colWidth, measure) {
  const { items, spec, spaceW } = buildItems(state.specimen, state.hyphenCompress, state.fontSize, measure);
  const rawBreaks = state.composer === "balanced"
    ? breakBalanced(items, colWidth, spec, state.hyphenCompress, state.fontSize)
    : breakGreedy(items, colWidth, spec, state.hyphenCompress, state.fontSize);

  const lines = [];
  const baseGap = spec.lang === "en" ? Math.max(3, spaceW) : state.fontSize * 0.28;
  // 判定“刺眼空洞”阈值
  const holeThreshold = spec.lang === "en"
    ? Math.max(spaceW * 1.68, state.fontSize * 0.44)
    : state.fontSize * 0.34;
  const severeHoleThreshold = spec.lang === "en"
    ? Math.max(spaceW * 2.35, state.fontSize * 0.64)
    : state.fontSize * 0.56;

  let totalCpl = 0;
  let bodyLineCount = 0;
  let maxGapRatio = 1;
  let minGapPx = 0;
  let maxEdgeErr = 0;
  let kinsokuViolations = 0;
  let looseLineCount = 0;
  let overflowLineCount = 0;

  for (let li = 0; li < rawBreaks.length; li++) {
    const [start, end] = rawBreaks[li];
    const isLast = li === rawBreaks.length - 1;
    const m = lineNaturalMetrics(items, start, end, colWidth, isLast, spec, state.hyphenCompress, state.fontSize);
    const shouldJustify = state.alignMode === "justify" && (!isLast || state.lastLineJustify);

    if (items[start].noStart) kinsokuViolations++;

    const positioned = [];
    const gaps = [];

    // 计算可拉伸缝隙权重
    let flexSlots = [];
    for (let i = start; i < end - 1; i++) {
      const it = items[i];
      const next = items[i + 1];
      let wgt = 0;
      if (spec.lang === "en") {
        wgt = it.spaceAfter > 0 ? 1 : 0;
      } else {
        if (it.kind === "latin-part" && next.kind === "latin-part" && it.spaceAfter === 0) {
          wgt = 0;
        } else {
          wgt = it.flexScale;
        }
      }
      flexSlots.push(wgt);
    }
    const sumWgt = flexSlots.reduce((a, b) => a + b, 0);
    const extraTotal = shouldJustify && sumWgt > 0 ? (colWidth - m.naturalW) : 0;

    let x = 0;
    let lineMaxGap = 0;
    let lineAvgGap = 0;
    let countedGaps = 0;

    for (let i = start; i < end; i++) {
      const it = items[i];
      const isLineEnd = i === end - 1;
      const drawText = isLineEnd && m.needsHyphen ? it.text + "-" : it.text;
      const drawW = it.width + (isLineEnd && m.needsHyphen ? it.hyphenW : 0);
      positioned.push({
        text: drawText,
        x,
        width: drawW,
        kind: it.kind,
        isHyphen: isLineEnd && m.needsHyphen,
      });
      x += drawW;

      if (!isLineEnd) {
        const wgt = flexSlots[i - start];
        const add = shouldJustify && sumWgt > 0 ? (extraTotal * (wgt / sumWgt)) : 0;
        const gapW = it.spaceAfter + add;
        if (gapW < minGapPx) minGapPx = gapW;
        if (wgt > 0) {
          const ratio = spec.lang === "en"
            ? gapW / Math.max(2, spaceW)
            : 1 + Math.max(0, gapW - it.spaceAfter) / Math.max(2, state.fontSize * 0.25);
          const isHole = gapW >= holeThreshold;
          const isSevere = gapW >= severeHoleThreshold;
          gaps.push({
            x,
            width: gapW,
            ratio,
            isHole,
            isSevere,
            midX: x + gapW * 0.5,
          });
          if (gapW > lineMaxGap) lineMaxGap = gapW;
          lineAvgGap += gapW;
          countedGaps++;
          if (!isLast && ratio > maxGapRatio) maxGapRatio = ratio;
        }
        x += gapW;
      }
    }

    const renderedWidth = x;
    const fillRatio = clamp(m.naturalW / colWidth, 0, 1.4);
    const edgeErr = Math.abs(colWidth - renderedWidth);

    if (!isLast) {
      totalCpl += m.cpl;
      bodyLineCount++;
      if (edgeErr > maxEdgeErr) maxEdgeErr = edgeErr;
      if (renderedWidth > colWidth + 3) overflowLineCount++;
      if (lineMaxGap >= severeHoleThreshold) looseLineCount++;
    }

    lines.push({
      index: li,
      isLast,
      items: positioned,
      gaps,
      cpl: m.cpl,
      naturalW: m.naturalW,
      renderedWidth,
      fillRatio,
      edgeErr,
      lineMaxGap,
      lineAvgGap: countedGaps ? lineAvgGap / countedGaps : 0,
      hasSevereHole: !isLast && lineMaxGap >= severeHoleThreshold,
      hasHole: !isLast && lineMaxGap >= holeThreshold,
      lastStretched: isLast && state.alignMode === "justify" && state.lastLineJustify && fillRatio < 0.74,
    });
  }

  // 真实几何河流检测：在连续两行（或更多行）之间，查找水平位置接近或重叠的显著空隙链
  const rivers = [];
  const usedPairs = new Set();
  const bodyLines = lines.filter((l) => !l.isLast);
  const lateralTol = state.fontSize * 0.68;

  // 构建邻接链
  const adj = new Map();
  for (let li = 0; li < bodyLines.length - 1; li++) {
    const curGaps = bodyLines[li].gaps.filter((g) => g.isHole);
    const nxtGaps = bodyLines[li + 1].gaps.filter((g) => g.isHole);
    for (let a = 0; a < curGaps.length; a++) {
      const g1 = curGaps[a];
      let best = null;
      let bestDist = Infinity;
      for (let b = 0; b < nxtGaps.length; b++) {
        const g2 = nxtGaps[b];
        const dist = Math.abs(g1.midX - g2.midX);
        const overlap = Math.min(g1.x + g1.width, g2.x + g2.width) - Math.max(g1.x, g2.x);
        if ((overlap > -lateralTol * 0.55 || dist <= lateralTol) && dist < bestDist) {
          bestDist = dist;
          best = { li: li + 1, gi: b, gap: g2 };
        }
      }
      if (best) {
        const k1 = `${li}:${a}`;
        const k2 = `${best.li}:${best.gi}`;
        adj.set(k1, k2);
        usedPairs.add(k2);
      }
    }
  }

  // 从链头追踪完整河流通道
  for (let li = 0; li < bodyLines.length - 1; li++) {
    const curGaps = bodyLines[li].gaps.filter((g) => g.isHole);
    for (let a = 0; a < curGaps.length; a++) {
      const startKey = `${li}:${a}`;
      if (usedPairs.has(startKey) || !adj.has(startKey)) continue;
      const chain = [];
      let k = startKey;
      while (k) {
        const [rIdx, gIdx] = k.split(":").map(Number);
        const g = bodyLines[rIdx].gaps.filter((x) => x.isHole)[gIdx];
        chain.push({ lineIndex: rIdx, x: g.midX, left: g.x, width: g.width, ratio: g.ratio, isSevere: g.isSevere });
        k = adj.get(k);
      }
      // 3 行连贯，或 2 行重度空洞叠压，计为一条可见白色河流
      const maxR = Math.max(...chain.map((c) => c.ratio));
      if (chain.length >= 3 || (chain.length === 2 && (maxR >= 1.95 || chain.some((c) => c.isSevere)))) {
        rivers.push({
          nodes: chain,
          length: chain.length,
          maxRatio: maxR,
        });
      }
    }
  }

  // 行间空隙离散度（衡量整段灰阶均匀性）
  const avgGaps = bodyLines.map((l) => l.lineAvgGap);
  const meanGap = avgGaps.length ? avgGaps.reduce((a, b) => a + b, 0) / avgGaps.length : 0;
  const gapVar = avgGaps.length
    ? Math.sqrt(avgGaps.reduce((s, v) => s + (v - meanGap) ** 2, 0) / avgGaps.length)
    : 0;
  const gapSpreadRatio = gapVar / Math.max(2, state.fontSize * 0.25);

  const avgCpl = bodyLineCount ? totalCpl / bodyLineCount : (lines[0]?.cpl || 0);
  const lastLine = lines[lines.length - 1];
  const lastFillRatio = lastLine ? lastLine.fillRatio : 1;
  const lastLineForcedError = !!(lastLine && lastLine.lastStretched);

  const metrics = {
    spec,
    colWidth,
    lineCount: lines.length,
    bodyLineCount,
    avgCpl,
    maxGapRatio,
    minGapPx,
    riverCount: rivers.length,
    looseLineCount,
    overflowLineCount,
    kinsokuViolations,
    maxEdgeErr,
    gapSpreadRatio,
    lastFillRatio,
    lastLineForcedError,
    holeThreshold,
    severeHoleThreshold,
    baseGap,
  };

  const audit = evaluateLayout(metrics, state);
  return { lines, rivers, metrics, audit };
}

// 四项单真源评分与 9 类双向错态白话诊断
function evaluateLayout(m, state) {
  const [minCpl, maxCpl] = m.spec.idealCpl;
  const isEn = m.spec.lang === "en";

  const narrowFail = m.avgCpl < minCpl;
  const wideFail = m.avgCpl > maxCpl;
  const measureOk = !narrowFail && !wideFail;

  const stretchLimit = isEn ? 2.15 : 2.35;
  const crushFail = m.minGapPx < -state.fontSize * 0.08;
  const textureOk = m.riverCount === 0 && m.maxGapRatio <= stretchLimit && m.looseLineCount === 0 && !crushFail;

  const raggedFail = state.alignMode !== "justify";
  const edgeOk = !raggedFail && !m.lastLineForcedError && m.maxEdgeErr < 2.2 && m.overflowLineCount === 0;

  const disciplineOk = m.kinsokuViolations === 0 && m.looseLineCount === 0 && m.gapSpreadRatio < (isEn ? 0.62 : 0.72);

  const checks = [
    {
      id: "edge",
      title: "整齐",
      en: "UNIFORM EDGE",
      ok: edgeOk,
      badge: raggedFail
        ? "右缘参差"
        : m.lastLineForcedError
          ? "末行强撑"
          : m.overflowLineCount > 0
            ? "长词溢栏"
            : "双边齐整",
    },
    {
      id: "texture",
      title: "密度",
      en: "TEXTURE",
      ok: textureOk,
      badge: m.riverCount > 0
        ? `河流 ${m.riverCount} 条`
        : crushFail
          ? "字距过紧"
          : m.maxGapRatio > stretchLimit
            ? `裂隙 ${m.maxGapRatio.toFixed(1)}×`
            : "灰阶均匀",
    },
    {
      id: "measure",
      title: "栏宽",
      en: "COLUMN WIDTH",
      ok: measureOk,
      badge: narrowFail
        ? `过窄 ${Math.round(m.avgCpl)}${isEn ? "符" : "字"}`
        : wideFail
          ? `过宽 ${Math.round(m.avgCpl)}${isEn ? "符" : "字"}`
          : `合宜 ${Math.round(m.avgCpl)}${isEn ? "符" : "字"}`,
    },
    {
      id: "discipline",
      title: "微排",
      en: "MICRO-FIT",
      ok: disciplineOk,
      badge: m.kinsokuViolations > 0
        ? `禁则 ${m.kinsokuViolations} 处`
        : m.looseLineCount > 0
          ? `疏行 ${m.looseLineCount} 行`
          : "均衡顺滑",
    },
  ];

  const score = checks.filter((c) => c.ok).length;

  // 灰阶档位（诚实标明示意，绝不编造假精确百分数）
  const grayGrade = score === 4
    ? "灰阶均匀（示意）"
    : m.riverCount > 0 || m.maxGapRatio > stretchLimit + 0.5
      ? "撕裂起河（示意）"
      : raggedFail
        ? "单边参差（示意）"
        : wideFail
          ? "过长疲劳（示意）"
          : "局部失衡（示意）";

  // 9 类正反双向诊断（按阅读伤害优先级排出当前最急问题）
  let code = "pass";
  let shortBadge = `${score}/4 · 稳态成立`;
  let headline = "左右双边齐整，整段呈均匀平静的阅读灰阶";
  let why = `当前每行约 ${m.avgCpl.toFixed(1)} ${m.spec.unitLabel}，无纵向白色河流，最大缝隙控制在 ${m.maxGapRatio.toFixed(1)}× 以内，末行自然收于左侧。视线扫过整栏时不会被空洞绊倒，双边矩形轮廓稳稳托住版面秩序。`;
  let action = "试试切换「英文书页」或「原海报纯中文」，或故意往左拉窄栏宽、点开「末行强撑」，看看好排样是怎么一步步变坏的。";

  if (raggedFail) {
    code = "ragged";
    shortBadge = `${score}/4 · 退回左对齐`;
    headline = "右缘已经参差不齐，此刻不再是两端对齐";
    why = "关闭两端对齐后，行尾余白全部留在右侧，间距虽然松弛自然，却失去了四边齐整的矩形边界——这已经切到了 176「左对齐右参差」的领地。";
    action = "把对齐模式切回「两端对齐」，再调好栏宽与断词，找回安静的双边轮廓。";
  } else if (m.overflowLineCount > 0) {
    code = "overflow";
    shortBadge = `${score}/4 · 长词撑破栏边`;
    headline = "单个长词已经宽过整栏，右缘直接被顶穿";
    why = `栏宽实在太窄（每行仅约 ${m.avgCpl.toFixed(1)} ${m.spec.unitLabel}），连未断开的英文术语都塞不进去，两端对齐的边界彻底失效。`;
    action = "向右横拖金黄栏边标尺放宽栏宽，或者点开「断词与标点挤压」让长词合理折行。";
  } else if (m.riverCount > 0 && narrowFail) {
    code = "narrow_river";
    shortBadge = `${score}/4 · 窄栏起河 ${m.riverCount} 条`;
    headline = `栏宽仅容 ${Math.round(m.avgCpl)} ${isEn ? "字符" : "字"}/行，行间已裂出 ${m.riverCount} 条白色河流`;
    why = `每行容纳单元太少，只要一两个长词掉到下一行，当前行剩出的余白就只能硬摊到寥寥几处缝隙里（最大拉到 ${m.maxGapRatio.toFixed(1)}×）。上下行的空洞连成竖向白道，眼球会顺着白缝往下滑，打断横向阅读。`;
    action = "向右横拖画布放宽栏宽（或调小字号），再直点标红裂隙打开「断词与标点挤压」与「段落全局均衡」。";
  } else if (m.riverCount > 0) {
    code = "river";
    shortBadge = `${score}/4 · 河流 ${m.riverCount} 条`;
    headline = `栏宽尚可，但行间仍有 ${m.riverCount} 条纵向白色河流`;
    why = `逐行贪心断行或未开启断词挤压，导致局部几行被突然拉松（最大缝隙 ${m.maxGapRatio.toFixed(1)}×），恰好在垂直方向首尾相连。按 Space 眯眼透视，白道比黑字更抢眼。`;
    action = "直接点击画布上标红的裂隙，开启「断词与标点挤压」或切到「段落全局均衡」把多余空隙分摊给整段。";
  } else if (wideFail) {
    code = "too_wide";
    shortBadge = `${score}/4 · 栏过宽 ${Math.round(m.avgCpl)}${isEn ? "符" : "字"}`;
    headline = `单行拉长到约 ${Math.round(m.avgCpl)} ${isEn ? "字符" : "字"}，扫完一行后眼动容易迷路`;
    why = `把栏拉到最宽虽能消灭空隙，却会跌入另一侧的坑：行距不变时行长过长，视线从右端长途回扫到左端时容易串行或重读同一行（经验上单栏中文宜在 17–34 字、西文约 45–75 字符）。`;
    action = "向左轻拖金黄栏边标尺收窄栏宽，或者稍微加大字号，把每行字数拉回舒适区间。";
  } else if (m.lastLineForcedError) {
    code = "last_forced";
    shortBadge = `${score}/4 · 末行强撑`;
    headline = `末行只占栏宽 ${Math.round(m.lastFillRatio * 100)}%，却被强行扯满整行`;
    why = "正统的 179「两端对齐」只对齐前面满行，末行应当自然左对齐收尾。把只剩寥寥数词的末行硬撑到右缘，字间距会瞬间炸裂——那是 180「强制两端对齐」才该慎用于短标题的手法。";
    action = "直接点击画布最底部的标红末行（或关闭「末行强撑」），让段落自然收口。";
  } else if (m.maxGapRatio > stretchLimit || m.looseLineCount > 0) {
    code = "loose_holes";
    shortBadge = `${score}/4 · 局部裂隙 ${m.maxGapRatio.toFixed(1)}×`;
    headline = `个别行缝隙被拉大到 ${m.maxGapRatio.toFixed(1)}×，版面灰阶出现明显断层`;
    why = "虽然还没连成贯通三行的河流，但这一行明显比上下行苍白一截，整块文字不再像一块均匀的织物，读者余光会被亮洞牵走。";
    action = "点击标红空洞开启「断词与标点挤压」或切到「段落全局均衡」，或微调栏宽与字号。";
  } else if (narrowFail) {
    code = "narrow_only";
    shortBadge = `${score}/4 · 栏偏窄 ${Math.round(m.avgCpl)}${isEn ? "符" : "字"}`;
    headline = `每行仅约 ${Math.round(m.avgCpl)} ${isEn ? "字符" : "字"}，换行过于频繁`;
    why = "眼睛刚读完半句就要折返左端，阅读节奏碎成短促的顿挫；而且一旦换上稍长的句子或术语，窄栏随时会再次崩出大空洞。";
    action = "向右横拖放宽栏宽，或把字号调小 1–2px，让每行稳稳容纳更从容的词组。";
  } else if (m.kinsokuViolations > 0) {
    code = "kinsoku";
    shortBadge = `${score}/4 · 行首标点禁则`;
    headline = `出现 ${m.kinsokuViolations} 处行首闭合标点，破坏了左缘齐整`;
    why = "逗号、句号或顿号落在新行开头，会让左对齐基线视觉上凹进一截，违反中文排版避头尾规则（W3C CLREQ）。";
    action = "开启「断词与标点挤压」，把闭合标点温和收回前一行或挤压收整。";
  } else if (crushFail) {
    code = "crush";
    shortBadge = `${score}/4 · 字距过紧`;
    headline = "行内被过度压紧，相邻字词几乎粘在一起";
    why = "两端对齐既怕拉太松起白河，也怕压太死丢呼吸；字形一旦贴紧，词组边界消失，辨认速度反而下降。";
    action = "微调栏宽或切回段落均衡模式，恢复舒朗间距。";
  } else if (!disciplineOk) {
    code = "uneven";
    shortBadge = `${score}/4 · 行间松紧跳变`;
    headline = "上一行密、下一行疏，段落灰度仍在波动";
    why = "逐行贪心算法只顾眼前这一行塞满，容易造成相邻两行密度落差过大，远看仍带横条斑马感。";
    action = "切换到「段落全局均衡」，或微调栏宽让各行松紧更一致。";
  }

  return { score, total: 4, pass: score === 4, code, shortBadge, grayGrade, headline, why, action, checks };
}
