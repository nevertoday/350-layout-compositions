// 180 强制两端对齐 · 单一真源排印引擎（model.js）
// 所有字符坐标、字距（em）、步距比、标点挂边、4 项判据、双向错态诊断与多组合法解
// 均从同一份几何模型实时计算，画布与文字读数绝不脱节。

export const FULL_PUNCT = new Set(["，", "。", "、", "；", "：", "！", "？", "》", "」", "）", "】"]);
export const OPEN_PUNCT = new Set(["《", "「", "（", "【"]);

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·双行宣言",
    shortLabel: "原海报",
    caption: "1:1 转译 180 原海报双行排印示范：横拖蓝钳调框宽，点击字缝重分断行，验证张力视窗。",
    text: "设计中的文字排版不仅传递信息，更塑造视觉节奏与情感体验。",
    isLatin: false,
    fullWidthEm: 27.2,
    minMeasure: 0.42,
    maxMeasure: 1.0,
    bad: {
      mode: "forced",
      measure: 0.88,
      lineCount: 2,
      split1: 22,
      split2: 28,
      spaceMode: "char",
      opticalPunct: false,
    },
    presets: [
      {
        id: "classic",
        label: "原海报均张解",
        note: "15+13 语义均分 · 框宽 74% · 标点挂边",
        state: { mode: "forced", measure: 0.74, lineCount: 2, split1: 15, split2: 28, spaceMode: "char", opticalPunct: true },
      },
      {
        id: "stele",
        label: "三行碑文解",
        note: "10+9+9 紧凑立柱 · 框宽 55% · 等字如碑",
        state: { mode: "forced", measure: 0.55, lineCount: 3, split1: 10, split2: 19, spaceMode: "char", opticalPunct: true },
      },
      {
        id: "wide",
        label: "宽幅高张解",
        note: "15+13 宽幅铺满 · 框宽 87% · 高空气张力",
        state: { mode: "forced", measure: 0.87, lineCount: 2, split1: 15, split2: 28, spaceMode: "char", opticalPunct: true },
      },
    ],
  },
  exhibition: {
    id: "exhibition",
    label: "展墙·极简标题",
    shortLabel: "展墙标",
    caption: "美术馆主展墙短标题：字数更少，每一毫米框宽变化都会放大字距张力。",
    text: "当代平面设计：空间秩序与张力。",
    isLatin: false,
    fullWidthEm: 15.8,
    minMeasure: 0.44,
    maxMeasure: 1.0,
    bad: {
      mode: "forced",
      measure: 0.90,
      lineCount: 2,
      split1: 12,
      split2: 15,
      spaceMode: "char",
      opticalPunct: false,
    },
    presets: [
      {
        id: "classic",
        label: "双行展墙解",
        note: "7+8 语义切分 · 框宽 72%",
        state: { mode: "forced", measure: 0.72, lineCount: 2, split1: 7, split2: 15, spaceMode: "char", opticalPunct: true },
      },
      {
        id: "stele",
        label: "三行方碑解",
        note: "5+5+5 严格等字 · 框宽 52%",
        state: { mode: "forced", measure: 0.52, lineCount: 3, split1: 5, split2: 10, spaceMode: "char", opticalPunct: true },
      },
      {
        id: "wide",
        label: "通廊宽幅解",
        note: "7+8 强烈留白 · 框宽 86%",
        state: { mode: "forced", measure: 0.86, lineCount: 2, split1: 7, split2: 15, spaceMode: "char", opticalPunct: true },
      },
    ],
  },
  bilingual: {
    id: "bilingual",
    label: "双语·全大写封面",
    shortLabel: "英文封面",
    caption: "全大写拉丁海报块：对照「仅拉词空」生出白河/单词失灵与「按字均分」的建筑张力。",
    text: "GRID TENSION FORM AND RHYTHM",
    isLatin: true,
    fullWidthEm: 21.5,
    minMeasure: 0.48,
    maxMeasure: 1.0,
    bad: {
      mode: "forced",
      measure: 0.90,
      lineCount: 2,
      split1: 21,
      split2: 28,
      spaceMode: "word",
      opticalPunct: true,
    },
    presets: [
      {
        id: "classic",
        label: "瑞士双行解",
        note: "12+15 全大写按字均分 · 框宽 72%",
        state: { mode: "forced", measure: 0.72, lineCount: 2, split1: 12, split2: 28, spaceMode: "char", opticalPunct: true },
      },
      {
        id: "stele",
        label: "三行海报柱",
        note: "3 行紧凑全大写 · 框宽 56%",
        state: { mode: "forced", measure: 0.56, lineCount: 3, split1: 12, split2: 21, spaceMode: "char", opticalPunct: true },
      },
      {
        id: "wide",
        label: "宽幅展签解",
        note: "12+15 高张力宽距 · 框宽 85%",
        state: { mode: "forced", measure: 0.85, lineCount: 2, split1: 12, split2: 28, spaceMode: "char", opticalPunct: true },
      },
    ],
  },
};

// 估算单字符自然排版宽（单位 em），确保中文方块字与英文全大写比例真实
export function charWidthEm(ch) {
  if (ch === " ") return 0.34;
  if (/[I1|]/.test(ch)) return 0.34;
  if (/[JLTFP]/.test(ch)) return 0.58;
  if (/[MW]/.test(ch)) return 0.86;
  if (/[A-Z0-9]/.test(ch)) return 0.66;
  if (/[a-z]/.test(ch)) return 0.56;
  if (FULL_PUNCT.has(ch) || OPEN_PUNCT.has(ch)) return 1.0;
  return 1.0; // CJK 汉字默认 1.0 em
}

// 将原文按 split1 / split2 切成 2 行或 3 行（自动去除英文行首行尾多余空格）
export function splitLines(specimen, state) {
  const raw = specimen.text;
  const n = raw.length;
  const lc = state.lineCount === 3 ? 3 : 2;
  if (lc === 2) {
    const s1 = clamp(Math.round(state.split1), 2, n - 2);
    const a = raw.slice(0, s1).trimEnd();
    const b = raw.slice(s1).trimStart();
    return [
      { text: a || raw.slice(0, 2), startIdx: 0, endIdx: s1 },
      { text: b || raw.slice(-2), startIdx: s1, endIdx: n },
    ];
  }
  const s1 = clamp(Math.round(state.split1), 2, n - 4);
  const s2 = clamp(Math.round(state.split2), s1 + 2, n - 2);
  const a = raw.slice(0, s1).trimEnd();
  const b = raw.slice(s1, s2).trim();
  const c = raw.slice(s2).trimStart();
  return [
    { text: a || raw.slice(0, 2), startIdx: 0, endIdx: s1 },
    { text: b || raw.slice(s1, s1 + 2), startIdx: s1, endIdx: s2 },
    { text: c || raw.slice(-2), startIdx: s2, endIdx: n },
  ];
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 排布单行字符的精确几何位置（全以 em 为单位，左界 0，右界 boxEm）
export function layoutLine(lineText, boxEm, opts) {
  const { mode, isLast, spaceMode, opticalPunct, isLatin } = opts;
  const chars = [...lineText];
  const count = chars.length;
  const widths = chars.map(charWidthEm);
  const naturalSum = widths.reduce((a, b) => a + b, 0);

  const lastChar = chars[count - 1] || "";
  const hasTrailPunct = FULL_PUNCT.has(lastChar);
  // 全角句号/逗号右半格是内置空白：开启光学挂边时允许右半格（0.48 em）挂出视觉边界
  const punctHangEm = hasTrailPunct && opticalPunct ? 0.48 : 0;
  const effectiveBoxEm = boxEm + punctHangEm;

  // 自然基础字距（未对齐时）
  const baseCharGap = isLatin ? 0.04 : 0.04;
  const naturalRun = naturalSum + Math.max(0, count - 1) * baseCharGap;

  const shouldJustify =
    mode === "forced" || (mode === "normal" && !isLast);

  const spaceIndices = [];
  for (let i = 0; i < count; i++) {
    if (chars[i] === " ") spaceIndices.push(i);
  }

  let charGap = baseCharGap;
  let extraWordGap = 0;
  let unexpandable = false;
  let rightEdgeEm = naturalRun;
  let visualRightEdgeEm = naturalRun - (hasTrailPunct ? 0.48 : 0);

  if (shouldJustify) {
    if (spaceMode === "word") {
      // 仅拉伸词间空格
      if (spaceIndices.length === 0) {
        // W3C CSS Text 3 §6.4.3：无可伸展机会时无法铺满
        unexpandable = true;
        charGap = baseCharGap;
        rightEdgeEm = naturalRun;
        visualRightEdgeEm = naturalRun - (hasTrailPunct ? 0.48 : 0);
      } else {
        const deficit = effectiveBoxEm - naturalRun;
        extraWordGap = deficit / spaceIndices.length;
        charGap = baseCharGap;
        rightEdgeEm = effectiveBoxEm;
        visualRightEdgeEm = boxEm - (hasTrailPunct && !opticalPunct ? 0.48 : 0);
      }
    } else {
      // 按字均分拉伸（Forced Inter-Character）
      if (count <= 1) {
        unexpandable = true;
      } else {
        charGap = (effectiveBoxEm - naturalSum) / (count - 1);
        rightEdgeEm = effectiveBoxEm;
        visualRightEdgeEm = boxEm - (hasTrailPunct && !opticalPunct ? 0.48 : 0);
      }
    }
  }

  // 生成每个字符精确起止 x（em）
  const glyphs = [];
  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const ch = chars[i];
    const w = widths[i];
    const x = cursor;
    const isSpace = ch === " ";
    const advance = w + (isSpace ? extraWordGap : 0);
    glyphs.push({
      ch,
      x,
      w,
      center: x + w * 0.5,
      isSpace,
      isTrailPunct: i === count - 1 && hasTrailPunct,
      gapAfter: i < count - 1 ? (isSpace ? extraWordGap + w : charGap) : 0,
    });
    cursor += advance + (i < count - 1 ? charGap : 0);
  }

  // 计算该行代表性“可见缝宽”：按字均分取 charGap；按词均分取实际最大词空
  const maxWordGapEm = spaceIndices.length > 0 ? 0.34 + extraWordGap : 0;
  const effectiveGapEm =
    shouldJustify && spaceMode === "word" && spaceIndices.length > 0
      ? maxWordGapEm
      : charGap;

  // 视觉贴右比例（0..1）
  const flushRatio = clamp(visualRightEdgeEm / Math.max(0.01, boxEm), 0, 1.2);
  // 光学标点凹陷量（em）
  const opticalDentEm = shouldJustify && !unexpandable && hasTrailPunct && !opticalPunct ? 0.48 : 0;

  // 非空格有效字符数（用于步距与孤尾判断）
  const visibleChars = chars.filter((c) => c !== " ").length;

  return {
    text: lineText,
    count,
    visibleChars,
    naturalSum,
    naturalRun,
    shouldJustify,
    unexpandable,
    charGap,
    extraWordGap,
    maxWordGapEm,
    effectiveGapEm,
    hasTrailPunct,
    opticalDentEm,
    rightEdgeEm,
    visualRightEdgeEm,
    flushRatio,
    glyphs,
  };
}

// 统一评估整个校样状态：返回所有实测指标、4 项判据、错态列表与白话诊单
export function evaluate(specimenId, state) {
  const spec = SPECIMENS[specimenId] || SPECIMENS.poster;
  const measure = clamp(state.measure, spec.minMeasure, spec.maxMeasure);
  const boxEm = spec.fullWidthEm * measure;
  const rawLines = splitLines(spec, state);

  const lines = rawLines.map((rl, idx) => ({
    ...rl,
    ...layoutLine(rl.text, boxEm, {
      mode: state.mode,
      isLast: idx === rawLines.length - 1,
      spaceMode: state.spaceMode,
      opticalPunct: state.opticalPunct,
      isLatin: spec.isLatin,
    }),
  }));

  // 聚合实测指标
  const gaps = lines.map((l) => l.effectiveGapEm);
  const charGaps = lines.map((l) => l.charGap);
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const minCharGap = Math.min(...charGaps);

  // 步距比（中心到中心：拉丁均宽 0.66，中文 1.0）
  const baseUnit = spec.isLatin ? 0.66 : 1.0;
  const pitches = lines.map((l) => Math.max(0.15, baseUnit + l.effectiveGapEm));
  const pitchRatio = Math.max(...pitches) / Math.min(...pitches);

  const anyUnexpandable = lines.some((l) => l.unexpandable);
  const anyCollision = minCharGap < 0.01 || (state.spaceMode === "word" && lines.some((l) => l.shouldJustify && l.extraWordGap < -0.2));
  const anyWordRiver = state.spaceMode === "word" && lines.some((l) => l.shouldJustify && l.maxWordGapEm > 1.05);
  const anyOpticalDent = lines.some((l) => l.opticalDentEm > 0.25);

  const flushLines = lines.filter((l) => l.shouldJustify && !l.unexpandable && l.flushRatio >= 0.96).length;
  const lastLine = lines[lines.length - 1];
  const avgVisible = lines.reduce((s, l) => s + l.visibleChars, 0) / lines.length;
  const minVisible = Math.min(...lines.map((l) => l.visibleChars));
  const orphanRatio = minVisible / Math.max(1, avgVisible);

  // 阈值（均为排印经验视窗）
  const TENSION_MIN = spec.isLatin ? 0.14 : 0.16;
  const TENSION_MAX = spec.isLatin ? 1.05 : 1.15;
  const PITCH_MAX = 1.48;
  const ORPHAN_MIN = 0.62;

  // 4 项单真源判据
  const c1_flush = state.mode === "forced" && !anyUnexpandable && flushLines === lines.length && !anyOpticalDent;
  const c2_tension = !anyCollision && minGap >= TENSION_MIN && maxGap <= TENSION_MAX && !anyWordRiver;
  const c3_rhythm = !anyUnexpandable && pitchRatio <= PITCH_MAX && !anyCollision;
  const c4_shape =
    state.mode === "forced" &&
    !anyUnexpandable &&
    !anyWordRiver &&
    orphanRatio >= ORPHAN_MIN &&
    (spec.isLatin ? state.spaceMode === "char" || maxGap <= 0.95 : state.spaceMode === "char");

  const passCount = [c1_flush, c2_tension, c3_rhythm, c4_shape].filter(Boolean).length;

  // 双向 8 类正反错态检出（按主次严重度排序）
  const faults = [];
  if (state.mode === "natural") {
    faults.push({
      code: "natural",
      tag: "自然散尾",
      headline: "当前处于未对齐状态，右侧边缘参差下垂",
      body: "每行只按字身自然排完，右端空着一大截——这是 176 左对齐右参差的放松语态，没有形成左右绷紧的横梁感。",
      action: "先切到「强制两端 180」，把每一行（含末行）真实拉到右钳边缘。",
    });
  } else if (state.mode === "normal") {
    faults.push({
      code: "normal179",
      tag: "末行塌缩",
      headline: "普通两端对齐放走了末行，块状矩形被削掉一角",
      body: "首行虽已贴紧左右边，但最后一行自动退回左对齐（仅占框宽 " + Math.round(lastLine.flushRatio * 100) + "%）——这仍是 179 两端对齐的正文逻辑，海报标题最怕这种右下角泄气。",
      action: "切到「强制两端 180」，让末行一并锁死右边界，感受两者的分水岭。",
    });
  }

  if (anyUnexpandable) {
    faults.push({
      code: "unexpandable",
      tag: "词空失灵",
      headline: state.spaceMode === "word"
        ? (spec.isLatin ? "末行只剩单个词，仅拉词空彻底失灵" : "中文没有词间空格，仅拉词空根本撑不开")
        : "单字成行，找不到可拉伸的字缝",
      body: spec.isLatin
        ? "按 W3C CSS Text 3 规范，行内没有空格时 inter-word 无法分配额外空白，该行只能僵在原处，上面却扯出巨大词洞。"
        : "西文两端对齐常靠拉伸单词空格，但中文方块字之间没有空格；强制两端对齐必须把空白均分进每个字缝（按字均分）。",
      action: "把间距机制切回「按字均分」，再点行内字缝让各行字数接近。",
    });
  }

  if (anyCollision) {
    faults.push({
      code: "collision",
      tag: "字身撞车",
      headline: "框宽挤得比字串还窄，最小字距压成 " + fmtEm(minCharGap),
      body: "外框收得太死，文字不仅没有向外扩张的张力，反而在框内互相挤压黏连，笔画糊成一条黑带。",
      action: "向右横拖画布上的蓝钳放宽框宽（或切到 3 行分担字数），给字缝留出 0.25–0.85 em 的呼吸。",
    });
  }

  if (anyWordRiver && !anyUnexpandable) {
    faults.push({
      code: "wordriver",
      tag: "词间白河",
      headline: "所有余白全灌进少数空格，扯出 " + fmtEm(maxGap) + " 的刺眼白洞",
      body: "短标题只有两三个词空，强行只拉词空会把词组拆成漂浮孤岛，上下错位形成扎眼的白色通道。",
      action: "全大写海报短句应改用「按字均分」，把张力平摊给每一个字母缝。",
    });
  }

  if (!anyCollision && maxGap > TENSION_MAX && !anyUnexpandable) {
    faults.push({
      code: "rupture",
      tag: "孤岛撕裂",
      headline: "最疏一行字距飙到 " + fmtEm(maxGap) + "，文字拆散成孤立圆点",
      body: orphanRatio < ORPHAN_MIN
        ? "上下行字数太悬殊（最疏行仅 " + minVisible + " 字），末行被迫承担整框余白，步距比拉裂到 " + pitchRatio.toFixed(1) + "×，完形接近律解体。"
        : "虽然各行字数已差不多，但框宽拉得过宽，所有字缝同时越过约 " + TENSION_MAX.toFixed(2) + " em 的阅读连贯上限，读起来像逐字蹦跳。",
      action: orphanRatio < ORPHAN_MIN
        ? "直接点击第 1 行中间的字缝移动断行切点，把上下行字数分匀（或向左收窄框宽）。"
        : "向左横拖画布蓝钳适当收紧框宽，把最大字距收回 " + TENSION_MAX.toFixed(2) + " em 以内。",
    });
  }

  if (!anyCollision && !anyUnexpandable && pitchRatio > PITCH_MAX && maxGap <= TENSION_MAX) {
    faults.push({
      code: "cliff",
      tag: "灰度断崖",
      headline: "上下行步距比达到 " + pitchRatio.toFixed(2) + "×，节奏一密一疏",
      body: "强制两端对齐靠「全篇一致的紧绷感」立住。上一行密得像墙砖、下一行疏得像篱笆，视觉形态立刻断层。",
      action: "点行内字缝（或用下方「断行切点」微调），让每行字数差距压到 2 字以内。",
    });
  }

  if (!anyCollision && state.mode === "forced" && !anyUnexpandable && minGap < TENSION_MIN && maxGap <= TENSION_MAX) {
    faults.push({
      code: "tight",
      tag: "张力偏闷",
      headline: "最小行字距仅 " + fmtEm(minGap) + "，几乎看不出向外绷紧的空气感",
      body: "这一行虽然勉强贴住左右边，但字符挤得像普通密集正文，失去了 180 强制两端对齐特有的呼吸与横梁张力。",
      action: "向右微拉画布蓝钳放宽框宽（或把这行多分 1–2 个字给下一行），让字距落在 0.25–0.85 em。",
    });
  }

  if (state.mode === "forced" && !anyUnexpandable && anyOpticalDent) {
    faults.push({
      code: "punct",
      tag: "标点虚陷",
      headline: "行尾全角标点自带半格空，右缘视觉凹进一截",
      body: "全角句号「。」或逗号「，」墨点只占左半格，机械对齐字框反而让肉眼觉得右侧缺了一口——这正是 187 凸排标点要解决的光学错觉。",
      action: "打开「标点光学挂边」，让行尾全角标点的多余空白轻微挂出边界，使黑墨右缘真正如刀切齐平。",
    });
  }

  // 张力档位（诚实标「示意」，不造假精确百分比）
  let tensionTier = "松弛未齐";
  if (anyCollision) tensionTier = "过挤撞字";
  else if (state.mode !== "forced" || anyUnexpandable) tensionTier = "边缘未锁";
  else if (maxGap > TENSION_MAX || anyWordRiver) tensionTier = "孤岛撕裂";
  else if (pitchRatio > PITCH_MAX) tensionTier = "疏密断层";
  else if (minGap < TENSION_MIN) tensionTier = "偏紧闷实";
  else if (maxGap >= 0.72) tensionTier = "高张紧绷";
  else tensionTier = "稳健铺满";

  // 生成统一白话诊单
  let primary;
  if (passCount === 4) {
    primary = {
      ok: true,
      tag: "4/4 · 强张铺满",
      headline: maxGap >= 0.72
        ? "高张力横梁立住了——每行绷紧贴边却不断词"
        : "双缘锁死、节拍匀称，文字已凝成稳定的几何块",
      body: "各行字距落在 " + fmtEm(minGap) + " 至 " + fmtEm(maxGap) + " 之间，上下步距比仅 " + pitchRatio.toFixed(2) + "×，黑墨左右边界与蓝钳齐平。可以继续向右推到撕裂边缘，或切其他合法解对照手感。",
      action: "按 Space 发射张力扫描验证每道字缝，或切换「三行碑文解 / 宽幅高张解」比较不同情绪。",
    };
  } else {
    const f = faults[0] || {
      tag: "待校准",
      headline: "继续平衡框宽与断行，让四项指标同时达标",
      body: "观察右侧/下方节拍仪的黑点分布，尽量让上下两行的竖向蓝虚线疏密接近。",
      action: "横拖画布蓝钳调框宽，或点击字缝调整断行位置。",
    };
    primary = {
      ok: false,
      tag: `${passCount}/4 · ${f.tag}`,
      headline: f.headline,
      body: f.body,
      action: f.action,
    };
  }

  // 3 个实时探针读数（对应海报三关键词：图标由前端 SVG 绘制）
  const probes = [
    {
      id: "tension",
      icon: "TENSION",
      zh: "张力",
      en: "TENSION",
      pass: c2_tension,
      metric: anyCollision
        ? `撞字 ${fmtEm(minCharGap)}`
        : maxGap > TENSION_MAX
          ? `裂 ${fmtEm(maxGap)}`
          : minGap < TENSION_MIN
            ? `闷 ${fmtEm(minGap)}`
            : `${fmtEm(minGap)}–${fmtEm(maxGap)}`,
      desc: "字距落在约 0.16–1.15 em 经验视窗，绷紧而不断词。",
    },
    {
      id: "fullwidth",
      icon: "FULL",
      zh: "铺满",
      en: "FULL WIDTH",
      pass: c1_flush,
      metric:
        state.mode === "natural"
          ? "未对齐"
          : state.mode === "normal"
            ? "末行塌缩"
            : anyUnexpandable
              ? "词空失灵"
              : anyOpticalDent
                ? "标点虚陷"
                : `${flushLines}/${lines.length} 行满幅`,
      desc: "含末行在内全部锁死左右双钳，且行尾标点不内凹。",
    },
    {
      id: "shape",
      icon: "T",
      zh: "形态化",
      en: "TEXT SHAPE",
      pass: c4_shape && c3_rhythm,
      metric: anyCollision
        ? "黏连变形"
        : pitchRatio > PITCH_MAX
          ? `断崖 ${pitchRatio.toFixed(1)}×`
          : orphanRatio < ORPHAN_MIN
            ? `孤尾 ${minVisible} 字`
            : `步距比 ${pitchRatio.toFixed(2)}×`,
      desc: "上下行字数与灰度匀称，文字整块硬化为几何矩形。",
    },
  ];

  return {
    spec,
    measure,
    boxEm,
    lines,
    minGap,
    maxGap,
    minCharGap,
    pitchRatio,
    orphanRatio,
    minVisible,
    flushLines,
    anyUnexpandable,
    anyCollision,
    anyWordRiver,
    anyOpticalDent,
    tensionTier,
    passCount,
    criteria: { c1_flush, c2_tension, c3_rhythm, c4_shape },
    faults,
    primary,
    probes,
    thresholds: { TENSION_MIN, TENSION_MAX, PITCH_MAX },
  };
}

export function fmtEm(v) {
  const sign = v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(2)}em`;
}

// Section 03 专用物理公式计算：固定 20 em 框宽，当末行字数从 2 变到 14 时的精确字距曲线
export function ruptureCurve(boxEm = 18.0, minN = 2, maxN = 14) {
  const pts = [];
  for (let n = minN; n <= maxN; n++) {
    const gap = (boxEm - n) / (n - 1);
    let zone = "ok";
    if (gap < 0.05) zone = "cramp";
    else if (gap > 1.15) zone = "rupture";
    else if (gap > 0.75) zone = "high";
    pts.push({ n, gap, zone });
  }
  return pts;
}
