// 212 横排左起 · 单真源排字与回扫几何模型
// 所有画布坐标、左缘散差、每行实排字数、回扫轨迹与顶部阅读动线状态，均从此模块单真源算出。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报文案",
    tag: "POSTER SPECIMEN",
    heading: "高效沟通，始于清晰的排版",
    body: "所有文字以左侧为起点，边缘整齐，阅读路径明确，让信息传递更轻松、更专业。当每行都在同一条左侧基准轴起步，视线完成换行回扫时不必反复试探落点。",
    caption: "All text starts from the left, edges align neatly, and the reading path is clear.",
  },
  manual: {
    id: "manual",
    label: "产品说明书",
    tag: "QUICK-START GUIDE",
    heading: "安装前请先核对左侧定位销",
    body: "将模块平放于绝缘工作台面，先对齐左侧定位销再轻压卡扣。接通电源后观察指示灯是否由琥珀色转为常亮青色，若持续闪烁请立即断电并复查排线接口。",
    caption: "Align the left locator pin first before pressing the locking clip into place.",
  },
  exhibit: {
    id: "exhibit",
    label: "双语展签",
    tag: "EXHIBITION LABEL",
    heading: "近代中文横排印本 · 1915",
    body: "中国科学社《科学》创刊号采用自左向右的横排格式与西式标点，正文行内可直接穿插公式 F = ma 与外文专名，使读者视线无需在横竖之间频繁折返。",
    caption: "Science Vol. 1 No. 1 (Shanghai, 1915) — Early horizontal LTR Chinese layout.",
  },
};

// 开场错态（忠实复刻 212 原海报右侧「错误示例」：起行参差、栏宽偏宽、视线回扫混乱）
export const INITIAL_SCATTER_FRACS = [0.16, 0.05, 0.21, 0.03, 0.13, 0.09, 0.18, 0.06];

export const LEADING_OPTIONS = [
  { value: 1.18, label: "紧 1.18×", key: "tight" },
  { value: 1.65, label: "适中 1.65×", key: "balanced" },
  { value: 2.48, label: "过松 2.48×", key: "loose" },
];

export const ALIGN_OPTIONS = [
  { value: "scattered", label: "散乱错起" },
  { value: "left", label: "左起齐左" },
  { value: "center", label: "居中排" },
  { value: "right", label: "右起齐右" },
];

export const PRESETS = {
  poor: {
    label: "原海报错例",
    align: "scattered",
    measureChars: 28,
    leading: 1.65,
    offsets: [...INITIAL_SCATTER_FRACS],
  },
  posterGood: {
    label: "海报标准解",
    align: "left",
    measureChars: 24,
    leading: 1.65,
    offsets: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  narrowGood: {
    label: "窄栏速读解",
    align: "left",
    measureChars: 17,
    leading: 1.65,
    offsets: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  errWide: {
    label: "试错：超宽串行",
    align: "left",
    measureChars: 42,
    leading: 1.18,
    offsets: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  errCenter: {
    label: "试错：居中锯齿",
    align: "center",
    measureChars: 24,
    leading: 1.65,
    offsets: [0, 0, 0, 0, 0, 0, 0, 0],
  },
};

export function createInitialState() {
  return {
    specimen: "poster",
    align: "scattered",
    measureChars: 28,
    leading: 1.65,
    showFlow: true,
    activeLine: 0,
    // 每行相对左侧基准轴的水平偏移（以画布可用排版宽度的比例 0..0.38 表示）
    offsets: [...INITIAL_SCATTER_FRACS],
  };
}

// 估算单个字符的等宽汉字单位（全角汉字/标点 = 1，ASCII 字母数字空格 ≈ 0.54）
export function charUnits(ch) {
  const cp = ch.codePointAt(0);
  if (cp <= 0x007f) return ch === " " ? 0.34 : 0.54;
  return 1.0;
}

export function stringUnits(str) {
  let u = 0;
  for (const ch of str) u += charUnits(ch);
  return u;
}

// 避头标点（简易 CLREQ 行首禁则：避免句号逗号顿号落到新行行首）
const NO_LINE_START = new Set(["，", "。", "、", "；", "：", "？", "！", "）", "》", "」", "』", ",", ".", ";", ":", "?", "!"]);

// 按目标每行全角汉字数对中文/西文混排串执行真实换行
export function wrapTextUnits(text, maxUnits, maxLines = 6) {
  const limit = Math.max(8, maxUnits);
  const lines = [];
  let cur = "";
  let curU = 0;
  const chars = [...text];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    // 西文单词尽量不硬拆
    if (/[A-Za-z0-9]/.test(ch)) {
      let j = i;
      let word = "";
      let wu = 0;
      while (j < chars.length && /[A-Za-z0-9.,\-=/]/.test(chars[j])) {
        word += chars[j];
        wu += charUnits(chars[j]);
        j++;
      }
      if (cur && curU + wu > limit) {
        lines.push(cur.trimEnd());
        cur = word;
        curU = wu;
      } else {
        cur += word;
        curU += wu;
      }
      i = j - 1;
      continue;
    }

    const u = charUnits(ch);
    if (cur && curU + u > limit && !NO_LINE_START.has(ch)) {
      lines.push(cur.trimEnd());
      cur = ch === " " ? "" : ch;
      curU = ch === " " ? 0 : u;
    } else {
      cur += ch;
      curU += u;
    }
  }
  if (cur.trim()) lines.push(cur.trimEnd());

  // 合并超出上限的尾行并截断加省略，保证画布内不垂直溢出
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].slice(0, Math.max(4, kept[maxLines - 1].length - 1)) + "…";
    return kept;
  }
  return lines;
}

// 给定画布逻辑尺寸 (W, H) 与当前 state，计算每一行的真实坐标框与回扫向量
export function computeGalley(state, W, H, measureTextFn) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const compact = W < 560;
  const padL = compact ? Math.round(W * 0.085) : Math.round(W * 0.08);
  const padR = compact ? Math.round(W * 0.07) : Math.round(W * 0.075);
  const topY = compact ? 54 : 62;
  const bottomPad = compact ? 38 : 44;

  const usableW = Math.max(220, W - padL - padR);
  const spineX = padL;

  // 依据画布宽度动态计算基准字号，确保 10..44 字都能清晰排入且绝不触碰画布右缘
  const baseBodySize = compact
    ? Math.max(11.5, Math.min(14, usableW / 26))
    : Math.max(15.5, Math.min(20, usableW / 44));
  const headingSize = Math.round(baseBodySize * (compact ? 1.28 : 1.44));
  const captionSize = Math.max(10.5, Math.round(baseBodySize * 0.78));

  // 行宽对应的真实像素栏宽（按 measureChars 与可用宽度线性映射）
  const minMeasure = 10;
  const maxMeasure = 44;
  const normM = (Math.max(minMeasure, Math.min(maxMeasure, state.measureChars)) - minMeasure) / (maxMeasure - minMeasure);
  const minColW = Math.max(118, usableW * 0.28);
  const maxColW = usableW * 0.96;
  const colW = minColW + normM * (maxColW - minColW);
  const rightRailX = spineX + colW;

  // 实际用于折行的字号严格受限于 colW / measureChars，保证任何字宽都不会冲出右缘
  const bodyFontPx = Math.min(baseBodySize, Math.max(10.5, (colW / Math.max(10, state.measureChars)) * 0.92));
  const headFontPx = Math.min(headingSize, Math.max(bodyFontPx * 1.15, Math.min(headingSize, (usableW * 0.76) / 13)));
  const capFontPx = Math.max(10.5, Math.min(captionSize, bodyFontPx * 0.84));

  const bodyLinesText = wrapTextUnits(spec.body, state.measureChars, compact ? 4 : 4);
  const capLimit = Math.max(14, Math.round(state.measureChars * 1.25));
  const capLinesText = wrapTextUnits(spec.caption, capLimit, 2);

  // 组装全部待排文字行
  const rawRows = [
    { kind: "heading", text: spec.heading, fontSize: headFontPx, weight: 800, family: '"Noto Sans SC", sans-serif' },
    ...bodyLinesText.map((t) => ({ kind: "body", text: t, fontSize: bodyFontPx, weight: 400, family: '"Noto Sans SC", sans-serif' })),
    ...capLinesText.map((t) => ({ kind: "caption", text: t, fontSize: capFontPx, weight: 400, family: '"Outfit", "Noto Sans SC", sans-serif' })),
  ];

  // 估算或实测每行文字像素宽度
  const measureRow = (row) => {
    if (measureTextFn) {
      const m = measureTextFn(row.text, row.fontSize, row.weight, row.family);
      if (m > 0) return m;
    }
    return stringUnits(row.text) * row.fontSize * 0.98;
  };

  // 如果窄屏某一行实测宽度超过可用宽度的 92%，整体等比收束字号防止贴边裁切
  const rawWidths = rawRows.map(measureRow);
  const maxRawW = Math.max(...rawWidths, 1);
  const maxAllowedW = usableW * 0.94;
  if (maxRawW > maxAllowedW) {
    const fScale = maxAllowedW / maxRawW;
    for (const row of rawRows) {
      row.fontSize = Math.max(10.2, row.fontSize * fScale);
    }
  }

  // 垂直排版：计算行距并确保画布纵向舒展不截断
  const bodyStepBase = bodyFontPx * state.leading;
  const headGap = Math.max(14, bodyFontPx * 0.95);
  const capGap = Math.max(10, bodyFontPx * 0.65);
  const capStepBase = capFontPx * Math.min(1.55, Math.max(1.25, state.leading * 0.85));

  const naturalH =
    headFontPx +
    headGap +
    bodyLinesText.length * bodyStepBase +
    capGap +
    capLinesText.length * capStepBase;
  const availH = Math.max(140, H - topY - bottomPad);
  const vScale = naturalH > availH ? availH / naturalH : 1;

  const bodyStep = bodyStepBase * vScale;
  const capStep = capStepBase * vScale;
  const effHeadGap = headGap * vScale;
  const effCapGap = capGap * vScale;

  // 垂直居中略偏上放置整段标本
  const blockH =
    headFontPx * vScale +
    effHeadGap +
    bodyLinesText.length * bodyStep +
    effCapGap +
    capLinesText.length * capStep;
  let yCursor = topY + Math.max(0, (availH - blockH) * 0.38);

  const lines = rawRows.map((row, idx) => {
    const textW = measureRow(row);
    const maxSlide = Math.max(0, usableW - textW - 4);
    let startX = spineX;
    let offsetPx = 0;

    if (state.align === "left") {
      startX = spineX;
      offsetPx = 0;
    } else if (state.align === "center") {
      startX = spineX + Math.max(0, (colW - textW) / 2);
      offsetPx = startX - spineX;
    } else if (state.align === "right") {
      startX = spineX + Math.max(0, colW - textW);
      offsetPx = startX - spineX;
    } else {
      // scattered / custom per-line drag mode，严格限制不越出画布右缘
      const frac = state.offsets[idx] ?? 0;
      const desiredPx = frac * usableW;
      offsetPx = Math.max(0, Math.min(maxSlide, desiredPx));
      startX = spineX + offsetPx;
    }

    const lineH = row.fontSize;
    const y = yCursor;
    if (row.kind === "heading") {
      yCursor += row.fontSize * vScale + effHeadGap;
    } else if (row.kind === "body") {
      yCursor += bodyStep;
      if (idx === bodyLinesText.length) yCursor += effCapGap - (bodyStep - row.fontSize * vScale) * 0.3;
    } else {
      yCursor += capStep;
    }

    return {
      index: idx,
      kind: row.kind,
      text: row.text,
      units: stringUnits(row.text),
      fontSize: row.fontSize,
      weight: row.weight,
      family: row.family,
      x: startX,
      y,
      w: textW,
      h: lineH,
      endX: startX + textW,
      midY: y + lineH * 0.52,
      offsetPx: Math.round(offsetPx),
      maxSlide,
    };
  });

  // 计算每两行之间的真实「换行回扫 Return Sweep」几何向量
  const sweeps = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    const spanPx = Math.max(0, a.endX - b.x);
    const deltaStartPx = Math.abs(b.x - a.x);
    const targetOffsetPx = Math.abs(b.x - spineX);
    const verticalGapPx = b.y - (a.y + a.h);
    const isBodyPair = a.kind === "body" && b.kind === "body";
    const lineSkipRisk = isBodyPair && (state.leading < 1.32 || state.measureChars > 37);
    const huntErrPx =
      state.align === "left"
        ? 0
        : Math.round(Math.max(deltaStartPx, targetOffsetPx * 0.7));

    sweeps.push({
      fromLine: i,
      toLine: i + 1,
      fromX: a.endX,
      fromY: a.midY,
      toX: b.x,
      toY: b.midY,
      spanPx: Math.round(spanPx),
      deltaStartPx: Math.round(deltaStartPx),
      huntErrPx,
      verticalGapPx: Math.round(verticalGapPx),
      lineSkipRisk,
    });
  }

  return {
    W,
    H,
    compact,
    spineX,
    rightRailX,
    colW,
    usableW,
    topY,
    bottomY: H - bottomPad + 8,
    minColW,
    maxColW,
    lines,
    sweeps,
    headingRuleY: lines[0] ? lines[0].y + lines[0].h + Math.max(6, effHeadGap * 0.42) : topY + 32,
  };
}

// 从实绘行框与回扫向量单真源核算全部指标与 7 类双向错态
export function analyzeGalley(layout, state) {
  const { lines, sweeps, spineX } = layout;
  const starts = lines.map((l) => l.x);
  const minStart = Math.min(...starts);
  const maxStart = Math.max(...starts);
  const spreadPx = Math.round(maxStart - minStart);
  const maxFromSpinePx = Math.round(Math.max(...lines.map((l) => Math.abs(l.x - spineX))));
  const scatterPx = state.align === "left" ? 0 : Math.max(spreadPx, maxFromSpinePx);

  const bodyLines = lines.filter((l) => l.kind === "body");
  // 用非尾行正文的平均字符单位反映真实行宽（末行通常不满）
  const fullBody = bodyLines.length > 1 ? bodyLines.slice(0, -1) : bodyLines;
  const measuredChars = Math.round(
    fullBody.reduce((s, l) => s + l.units, 0) / Math.max(1, fullBody.length)
  );
  // 与设定行宽保持一致单真源
  const effectiveChars = state.measureChars;
  const maxSweepPx = sweeps.length ? Math.max(...sweeps.map((s) => s.spanPx)) : 0;
  const misalignedLines = lines.filter((l) => Math.abs(l.x - spineX) > 4);

  const issues = [];

  if (state.align === "scattered" && maxFromSpinePx > 4) {
    issues.push({
      id: "scattered",
      severity: 3,
      badge: `左缘散差 ${maxFromSpinePx}px`,
      headline: `有 ${misalignedLines.length} 行脱离左起基准轴，最大偏出 ${maxFromSpinePx}px`,
      reason:
        "原海报「错误示例」的核心毛病就在这里：每一行的起读位置都不在同一条竖线上。眼睛读完行尾往回扫时没有固定靶点，每换一行都要停顿半拍左右找开头。",
      actionHint: "直接向左拖动错位的文字行，吸回金色虚线左轴；或点「一键全部推齐至左轴」。",
      actionLabel: "一键全部推齐至左轴",
      actionKind: "snapLeft",
    });
  } else if (state.align === "center") {
    issues.push({
      id: "center",
      severity: 3,
      badge: `居中左缘差 ${spreadPx}px`,
      headline: `多行居中使左起边缘锯齿跳动 ${spreadPx}px`,
      reason:
        "居中对齐让每一行的起点跟着字数长短左右漂移。1–2 行海报主标可以居中求对称，但超过 3 行正文时，眼睛每次回扫都要重新测算下一行开头在哪，节奏立刻破碎。",
      actionHint: "将对齐方式切回「左起齐左」，把变动留在行尾、把稳定留给起点。",
      actionLabel: "切换为左起齐左",
      actionKind: "snapLeft",
    });
  } else if (state.align === "right") {
    issues.push({
      id: "right",
      severity: 3,
      badge: `起读端锯齿 ${spreadPx}px`,
      headline: `右对齐把齐边留给了行尾，起读端反而参差 ${spreadPx}px`,
      reason:
        "中文与英文横排都是自左向右阅读，最需要对齐锚定的是「起点」而不是「终点」。右对齐只对齐了读完离开的那一侧，却让每次回扫最依赖的左侧边沿坑洼不平。",
      actionHint: "切回「左起齐左」，让视觉基准回到起读一侧（阿语等右起文字除外）。",
      actionLabel: "切换为左起齐左",
      actionKind: "snapLeft",
    });
  }

  if (effectiveChars > 36) {
    issues.push({
      id: "tooWide",
      severity: 2,
      badge: `单行过宽 ${effectiveChars} 字`,
      headline: `单行拉宽到约 ${effectiveChars} 字（回扫 ${maxSweepPx}px），长距回扫易串行`,
      reason:
        "即使左侧完全对齐，行宽过长也会把换行回扫拉成一次超长眼跳。眼动研究表明回扫距离越长，落点偏短或错跳到上下行的概率越明显，眼睛很快发酸。",
      actionHint: "向左拖动金色右缘行宽尺，或将行宽调回 16–34 字区间。",
      actionLabel: "收窄至 24 字舒适行宽",
      actionKind: "fixMeasure",
    });
  } else if (effectiveChars < 14) {
    issues.push({
      id: "tooNarrow",
      severity: 2,
      badge: `单行过窄 ${effectiveChars} 字`,
      headline: `单行仅容约 ${effectiveChars} 字，刚起势就被迫频繁折行`,
      reason:
        "栏宽被捏得太窄时，完整词组不断被拦腰截断，视线几乎每读两三个词就得回扫一次，水平阅读的连贯节奏被切成了碎步。",
      actionHint: "向右拉宽金色右缘行宽尺，给语句留出舒展的横向通道（16–34 字）。",
      actionLabel: "拉宽至 24 字舒适行宽",
      actionKind: "fixMeasure",
    });
  }

  if (state.leading < 1.32) {
    issues.push({
      id: "tooTight",
      severity: 2,
      badge: `行距过挤 ${state.leading.toFixed(2)}×`,
      headline: `行距压到 ${state.leading.toFixed(2)}×，上下行贴紧容易回扫串行`,
      reason:
        "横向排版的行距要充当「回扫走廊」。行间空气被压扁后，视线从上一行右端斜扫回左端时，极易误落到刚才读过的那一行或跳过一行。",
      actionHint: "把行距调到「适中 1.65×」，为回扫留出清晰的行间通道。",
      actionLabel: "调回 1.65× 适中行距",
      actionKind: "fixLeading",
    });
  } else if (state.leading > 2.25) {
    issues.push({
      id: "tooLoose",
      severity: 1,
      badge: `行距过松 ${state.leading.toFixed(2)}×`,
      headline: `行距拉散到 ${state.leading.toFixed(2)}×，段落裂成孤立横条`,
      reason:
        "行距远大于字高时，邻近两行的视觉归属感被拉断，读者不再把它们当成连贯的一段话，而像在逐条扫读毫无关联的标语。",
      actionHint: "把行距收回到「适中 1.65×」，恢复段落内部的亲密节奏。",
      actionLabel: "收回 1.65× 适中行距",
      actionKind: "fixLeading",
    });
  }

  // 计算顶部「阅读动线」4 阶段达成度
  let flowStage = 4;
  if (issues.some((i) => i.severity === 3)) {
    flowStage = 1;
  } else if (issues.length >= 2) {
    flowStage = 2;
  } else if (issues.length === 1) {
    flowStage = 3;
  }

  // 多组合法解判别
  let solutionTag = "";
  let loadTier = "";
  let primary = issues[0] || null;

  if (!primary) {
    if (effectiveChars <= 20) {
      solutionTag = "窄栏速读解";
    } else if (effectiveChars <= 30) {
      solutionTag = "原海报标准解";
    } else {
      solutionTag = "宽栏精读解";
    }
    loadTier = "低负荷 · 稳回扫(示意)";
    primary = {
      id: "ok",
      severity: 0,
      badge: `已对齐 · ${solutionTag}`,
      headline: `全部 ${lines.length} 行锚定左起轴，回扫路径笔直清晰`,
      reason:
        effectiveChars <= 20
          ? `当前每行约 ${effectiveChars} 字、行距 ${state.leading.toFixed(2)}×，贴合手机窄屏或侧栏速读节奏：起读轴零散差，短距回扫几乎不会串行。`
          : effectiveChars <= 30
            ? `当前每行约 ${effectiveChars} 字、行距 ${state.leading.toFixed(2)}×，正落在中文屏幕与印刷正文最从容的舒适区：左起锚定、右缘自然呼吸、四阶阅读动线全线贯通。`
            : `当前每行约 ${effectiveChars} 字、行距 ${state.leading.toFixed(2)}×，适合桌面大屏精读文档：靠严格左起轴与充足行距稳住较长回扫，再宽就会开始吃力。`,
      actionHint: "试试故意拖歪某一行、切到「居中排」或拉宽到 42 字，亲眼观察回扫路径怎样崩坏。",
      actionLabel: "还原原海报错例对照",
      actionKind: "resetPoor",
    };
  } else {
    loadTier =
      primary.severity === 3
        ? "高负荷 · 需找行(示意)"
        : primary.id === "tooWide" || primary.id === "tooTight"
          ? "中高负荷 · 易串行(示意)"
          : "中负荷 · 易断续(示意)";
  }

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    issues,
    primary,
    solutionTag,
    flowStage,
    scatterPx,
    maxFromSpinePx,
    spreadPx,
    effectiveChars,
    measuredChars,
    leading: state.leading,
    maxSweepPx,
    loadTier,
    alignedCount: lines.length - misalignedLines.length,
    totalLines: lines.length,
  };
}
