// 193 水平文字排版 · 单一真源数据与光学排字引擎
// 开场眼动校样台、读数、诊断与第 01 / 02 / 07 节共享本模块常量与计算，杜绝硬编码与读数漂移。

export const PALETTE = {
  navy: "#061018",
  navyMid: "#0B1824",
  navySlate: "#182331",
  cream: "#E9DFD0",
  creamLight: "#EFE7DA",
  ivory: "#F7F3EC",
  ink: "#0A1622",
  inkMuted: "#3B4854",
  bone: "#EBE2D1",
  terra: "#DF6B52",
  terraBlock: "#B84430",
  terraDeep: "#962F1E",
  sage: "#3E9683",
  sageLight: "#68D0B9",
  sageDark: "#1B6B5A",
  ruleLight: "rgba(10, 22, 34, 0.16)",
  ruleDark: "rgba(235, 226, 209, 0.16)",
};

export const SCRIPTS = {
  zh: {
    id: "zh",
    label: "中文横排",
    unit: "字",
    minMeasure: 10,
    maxMeasure: 50,
    comfortMin: 20,
    comfortMax: 30,
    idealMeasure: 26,
    badMeasure: 44,
    emPerUnit: 1.0,
    spanLeft: 1,
    spanRight: 3,
    headline: "让信息清晰流动",
    subEn: "MAKE INFORMATION FLOW CLEARLY",
    paragraphs: [
      "眼睛顺着水平基线由左向右平稳推进，在单次注视里提前预读右侧两到三个字，句义因此连贯成流。每当视线抵达行尾，眼球必须斜向回扫到下一行的起点。",
      "行长一旦拉得过宽、行距又压得过紧，回扫的坡度会变得过于平缓，视线在折返途中极易串行或漏读；唯有稳住左缘锚线、留足行间与段间呼吸，长文才真正耐读。",
      "把每行字数收进二十到三十个汉字，再配以舒展行距与清晰的段落边界，读者无需刻意用力，信息就能像水流一样平顺进入大脑。",
    ],
  },
  en: {
    id: "en",
    label: "English LTR",
    unit: "ch",
    minMeasure: 24,
    maxMeasure: 100,
    comfortMin: 45,
    comfortMax: 75,
    idealMeasure: 64,
    badMeasure: 88,
    emPerUnit: 0.54,
    spanLeft: 3.5,
    spanRight: 14.5,
    headline: "Let Information Flow",
    subEn: "HORIZONTAL TYPE LAYOUT · LTR SPECIMEN",
    paragraphs: [
      "Horizontal lines match the eye's asymmetric rightward perceptual span, letting readers preview upcoming word shapes before each forward saccade along a steady baseline.",
      "When a line grows too wide or leading collapses too tight, the diagonal return sweep flattens out and the eye easily repeats the same line or misses the left anchor.",
      "Keeping single-column text within 45 to 75 characters with generous leading and a steady left edge turns dense prose into effortless visual flow.",
    ],
  },
  mix: {
    id: "mix",
    label: "中英混排",
    unit: "等效字",
    minMeasure: 12,
    maxMeasure: 50,
    comfortMin: 20,
    comfortMax: 32,
    idealMeasure: 26,
    badMeasure: 43,
    emPerUnit: 1.0,
    spanLeft: 1.5,
    spanRight: 4,
    headline: "横排兼容公式与西文",
    subEn: "CJK + LATIN · MIXED HORIZONTAL FLOW",
    paragraphs: [
      "现代屏幕与科技出版物天然混合汉字、Latin 术语与数字，例如 WCAG 2.1 建议单行不超过 40 个汉字或 80 个西文字符，水平基线让多语种共享一条轨道。",
      "在汉字与西文之间保留微弱字隙，把行距维持在 1.55 至 1.90 倍，并将正文稳稳锚定在左侧垂线上，无论纸页还是屏幕都能保持顺畅稳定的扫读节奏。",
      "从印刷书页到响应式界面，CSS writing-mode: horizontal-tb 让多语种文本沿着同一水平节拍平稳展开。",
    ],
  },
};

export const LEADING_PRESETS = [
  { val: 1.12, label: "1.12× 压扁" },
  { val: 1.38, label: "1.38× 偏紧" },
  { val: 1.68, label: "1.68× 舒展" },
  { val: 1.88, label: "1.88× 宽裕" },
  { val: 2.32, label: "2.32× 散架" },
];

export const ALIGN_MODES = [
  { id: "center", label: "居中散边" },
  { id: "right", label: "右齐反锚" },
  { id: "left", label: "左齐稳锚" },
];

export const PARAGAP_PRESETS = [
  { val: 0.0, label: "0em 粘连" },
  { val: 0.9, label: "0.9em 呼吸" },
  { val: 2.6, label: "2.6em 割裂" },
];

export function initialState(script = "zh") {
  const cfg = SCRIPTS[script] || SCRIPTS.zh;
  return {
    script: cfg.id,
    measure: cfg.badMeasure,
    leading: 1.12,
    align: "center",
    paraGap: 0.0,
    showGaze: true,
    focusLine: -1,
  };
}

// 估算单个字符的等效 em 宽（汉字全角 1.0，西文与数字约 0.54，空格 0.30）
export function charEmWidth(ch) {
  const code = ch.charCodeAt(0);
  if (ch === " ") return 0.3;
  if (code <= 0x007f) {
    if ("ilI1.,;:'!|".includes(ch)) return 0.34;
    if ("mwMW".includes(ch)) return 0.78;
    return 0.54;
  }
  if (code >= 0x3000 && code <= 0x303f) return 0.95;
  if (code >= 0xff00 && code <= 0xffef) return 0.95;
  return 1.0;
}

const NO_START = new Set([..."，。！？；：、）】》」』.,!?;:"]);
const NO_END = new Set([..."（【《「『"]);

// 按目标行宽（以脚本单位 measure 计）执行真实水平断行（兼顾西文按词换行与中文避头尾禁则）
export function wrapParagraph(text, scriptId, measure) {
  const cfg = SCRIPTS[scriptId];
  const maxUnits = Math.max(cfg.minMeasure, Math.min(cfg.maxMeasure, measure));
  const lines = [];

  if (scriptId === "en") {
    const words = text.split(" ");
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > maxUnits && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
  } else {
    // 中文或中英混排：把连续 ASCII 单词视作原子团，避免腰斩英文单词
    const tokens = text.match(/[A-Za-z0-9.]+|\s+|./gu) || [];
    let cur = "";
    let curEm = 0;
    const tokenEm = (tok) => {
      let s = 0;
      for (const c of tok) s += charEmWidth(c);
      return s;
    };
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const w = tokenEm(tok);
      if (cur && curEm + w > maxUnits + 0.08) {
        if (tok.length === 1 && NO_START.has(tok)) {
          cur += tok;
          curEm += w;
          lines.push(cur.trim());
          cur = "";
          curEm = 0;
          continue;
        }
        // 避尾标点顺推到下一行
        const lastCh = cur[cur.length - 1];
        if (lastCh && NO_END.has(lastCh) && cur.length > 2) {
          lines.push(cur.slice(0, -1).trim());
          cur = lastCh + tok.trimStart();
          curEm = tokenEm(cur);
        } else {
          lines.push(cur.trim());
          cur = tok.trimStart();
          curEm = tokenEm(cur);
        }
      } else {
        cur += tok;
        curEm += w;
      }
    }
    if (cur.trim()) lines.push(cur.trim());
  }

  return lines.map((str) => {
    let em = 0;
    for (const c of str) em += charEmWidth(c);
    const units = scriptId === "en" ? str.length : em;
    return { text: str, em, units };
  });
}

// 行长与行距耦合所需的最低安全行距（经验模型：行越宽，人眼回扫需要更厚行间净空）
export function minSafeLeading(measure, scriptId) {
  const cfg = SCRIPTS[scriptId];
  if (scriptId === "en") {
    return +(1.38 + Math.max(0, (measure - 45) * 0.0075)).toFixed(2);
  }
  return +(1.45 + Math.max(0, (measure - cfg.comfortMin) * 0.015)).toFixed(2);
}

export function maxSafeLeading(scriptId) {
  return scriptId === "en" ? 2.05 : 2.15;
}

// 统一版面计算：算出每一行的归一化几何、真实行长统计、回扫倾角 θ 与左缘抖动 ΔX
export function computeLayout(state) {
  const cfg = SCRIPTS[state.script] || SCRIPTS.zh;
  const colEm = state.measure * cfg.emPerUnit;
  const allLines = [];

  cfg.paragraphs.forEach((para, pIdx) => {
    const wrapped = wrapParagraph(para, state.script, state.measure);
    wrapped.forEach((line, lIdx) => {
      const remEm = Math.max(0, colEm - line.em);
      const xStartEm =
        state.align === "left"
          ? 0
          : state.align === "center"
          ? remEm * 0.5
          : remEm;
      allLines.push({
        paraIndex: pIdx,
        lineInPara: lIdx,
        isParaEnd: lIdx === wrapped.length - 1,
        text: line.text,
        em: line.em,
        units: line.units,
        xStartEm,
        xEndEm: xStartEm + line.em,
      });
    });
  });

  // 计算每行纵坐标（单位 em）
  let yCursor = 0;
  allLines.forEach((ln, idx) => {
    ln.index = idx;
    ln.yEm = yCursor;
    yCursor += state.leading + (ln.isParaEnd && idx < allLines.length - 1 ? state.paraGap : 0);
  });
  const totalHeightEm = Math.max(1, yCursor);

  // 非末行平均行宽（用于真实计算行尾回扫倾角）
  const bodyLines = allLines.filter((l) => !l.isParaEnd);
  const sampleLines = bodyLines.length ? bodyLines : allLines;
  const meanUnits =
    sampleLines.reduce((s, l) => s + l.units, 0) / Math.max(1, sampleLines.length);
  const meanEm =
    sampleLines.reduce((s, l) => s + l.em, 0) / Math.max(1, sampleLines.length);

  // 真实回扫对角倾角 θ = atan2(leading, meanEm)
  const returnSweepDeg = (Math.atan2(state.leading, Math.max(4, meanEm)) * 180) / Math.PI;

  // 实测左缘抖动（所有行起点的最大偏差，单位 em）
  const xs = allLines.map((l) => l.xStartEm);
  const leftJitterEm = Math.max(...xs) - Math.min(...xs);

  return {
    cfg,
    colEm,
    lines: allLines,
    lineCount: allLines.length,
    totalHeightEm,
    meanUnits,
    meanEm,
    returnSweepDeg,
    leftJitterEm,
  };
}

// 单真源诊断器：结合实排几何给出 4 项验收状态与明确的白话「为什么」
export function evaluate(state, layout = computeLayout(state)) {
  const { cfg, meanUnits, returnSweepDeg, leftJitterEm } = layout;
  const minLead = minSafeLeading(state.measure, state.script);
  const maxLead = maxSafeLeading(state.script);

  const measureLow = state.measure < cfg.comfortMin;
  const measureHigh = state.measure > cfg.comfortMax;
  const measureOk = !measureLow && !measureHigh;

  const leadLow = state.leading < minLead - 0.01;
  const leadHigh = state.leading > maxLead + 0.01;
  const leadingOk = !leadLow && !leadHigh;

  const alignOk = state.align === "left";

  const paraLow = state.paraGap < 0.45;
  const paraHigh = state.paraGap > 1.75;
  const paraOk = !paraLow && !paraHigh;

  // 判定是否会触发真实画布上的「回扫错行/迷航」视觉演示
  const sweepRisk = measureHigh || leadLow || !alignOk;
  const checks = [
    {
      id: "measure",
      keyword: "清晰的层级",
      label: "行长控制",
      ok: measureOk,
      status: measureOk
        ? `${Math.round(meanUnits)} ${cfg.unit} · 舒适`
        : measureHigh
        ? `${Math.round(meanUnits)} ${cfg.unit} · 过长`
        : `${Math.round(meanUnits)} ${cfg.unit} · 碎片`,
    },
    {
      id: "align",
      keyword: "有序的阅读",
      label: "左缘锚线",
      ok: alignOk,
      status: alignOk
        ? "左齐稳锚 · 0em"
        : state.align === "center"
        ? `居中漂移 ±${(leftJitterEm * 0.5).toFixed(1)}em`
        : `右齐反锚 ±${(leftJitterEm * 0.5).toFixed(1)}em`,
    },
    {
      id: "leading",
      keyword: "高效的传达",
      label: "行距耦合",
      ok: leadingOk,
      status: leadingOk
        ? `${state.leading.toFixed(2)}× · 坡度 ${returnSweepDeg.toFixed(1)}°`
        : leadLow
        ? `${state.leading.toFixed(2)}× · 偏挤（需≥${minLead.toFixed(2)}×）`
        : `${state.leading.toFixed(2)}× · 散架`,
    },
    {
      id: "paraGap",
      keyword: "专业的表达",
      label: "段距节奏",
      ok: paraOk,
      status: paraOk
        ? `${state.paraGap.toFixed(1)}em · 呼吸清晰`
        : paraLow
        ? "0em · 灰墙粘连"
        : `${state.paraGap.toFixed(1)}em · 过度割裂`,
    },
  ];

  const passCount = checks.filter((c) => c.ok).length;

  // 优先级诊断：说清「错在哪」「眼睛会怎样」「怎么调」
  let tag = "4 / 4 · 流畅成流";
  let severity = "pass";
  let title = "视线沿水平轨道平稳推进，回扫精准落回左锚";
  let reason = `当前实排每行约 ${Math.round(meanUnits)} ${cfg.unit}（落入 ${cfg.comfortMin}–${cfg.comfortMax} ${cfg.unit} 经验舒适带），行距 ${state.leading.toFixed(2)}× 让回扫倾角保持在 ${returnSweepDeg.toFixed(1)}°，固定左缘与 ${state.paraGap.toFixed(1)}em 段距让扫描毫不费力。`;
  let hint = "你可以试着继续往右拖过 34 字或把行距压低，亲眼看流畅的回扫怎么突然串行。";

  if (passCount < 4) {
    severity = "error";
    if (measureHigh) {
      tag = `错版 · 回扫迷航 · ${passCount} / 4`;
      title = `单行拉到 ${Math.round(meanUnits)} ${cfg.unit}，行尾回扫坡度太浅`;
      reason = `水平跨度远超 ${cfg.comfortMin}–${cfg.comfortMax} ${cfg.unit} 经验舒适带，回扫倾角跌到 ${returnSweepDeg.toFixed(1)}°。眼睛从行尾长距离折返时极易重复读同一行或跳过下一行。`;
      hint = `直接在校样纸面上向左拖窄行长，把每行收进 ${cfg.comfortMin}–${cfg.comfortMax} ${cfg.unit} 绿色舒适带内。`;
    } else if (measureLow) {
      tag = `错版 · 碎片折行 · ${passCount} / 4`;
      title = `单行缩成 ${Math.round(meanUnits)} ${cfg.unit}，眼睛刚起速就被打断`;
      reason = `每行不到 ${cfg.comfortMin} ${cfg.unit}，一个完整语块反复被硬切换行，眼球频繁回扫消耗精力，连贯句义被拆成短截碎片。`;
      hint = `向右拖宽校样行长到 ${cfg.comfortMin}–${cfg.comfortMax} ${cfg.unit}，让单次水平扫视能读完完整短语。`;
    } else if (leadLow) {
      tag = `错版 · 行距压扁 · ${passCount} / 4`;
      title = `行距 ${state.leading.toFixed(2)}× 撑不起当前行宽的回扫通道`;
      reason = `按当前 ${state.measure} ${cfg.unit} 的行宽，经验安全行距至少需 ${minLead.toFixed(2)}×。上下行字符几乎贴背，回扫途中视线容易被邻行笔画吸走串行。`;
      hint = `在下方操控带把「行距」调高到 1.68× 或 1.88×（行越宽，需要的行距越厚）。`;
    } else if (leadHigh) {
      tag = `错版 · 行间散架 · ${passCount} / 4`;
      title = `行距拉到 ${state.leading.toFixed(2)}×，段落裂成了孤立横条`;
      reason = `行间留白过大且接近甚至超过段落间距时，格式塔邻近律失效，眼睛会把每一行误当成各自独立的标题条，阅读节律被拉断。`;
      hint = `把「行距」收回到 1.55×–1.95× 经验舒展带，让多行重新凝成稳固段落。`;
    } else if (!alignOk) {
      tag = `错版 · 左缘失锚 · ${passCount} / 4`;
      title =
        state.align === "center"
          ? `正文居中让每行起点漂移 ±${(leftJitterEm * 0.5).toFixed(1)}em`
          : `正文右齐让行尾回扫失去固定左起点`;
      reason = `水平阅读靠左缘同一条垂线实现「盲落」：眼睛折返时凭肌肉记忆就能落到新行首字。左缘参差不齐时，每一行都要重新搜寻起点，速度大打折扣。`;
      hint = `把「起行锚线」切回「左齐稳锚」，为回扫立起笔直的左垂直基准线。`;
    } else if (paraLow) {
      tag = `错版 · 灰墙粘连 · ${passCount} / 4`;
      title = "段落间距归零，两段文字黏成一整块密墙";
      reason = "段距小于行间净空时，读者在扫读页面时找不到语义停顿口与重新切入的视觉台阶，长文瞬间产生压迫感。";
      hint = "把「段距节奏」切到 0.9em 呼吸档，让段距清晰大于行间净空。";
    } else if (paraHigh) {
      tag = `错版 · 段落割裂 · ${passCount} / 4`;
      title = `段距拉到 ${state.paraGap.toFixed(1)}em，上下文被扯断成孤岛`;
      reason = "段落之间留白过宽，眼睛读完上段后难以自然衔接到下段，容易误以为整篇文章已经结束。";
      hint = "把「段距节奏」收回到 0.9em 呼吸档，保持段落独立又藕断丝连。";
    }
  }

  return {
    checks,
    passCount,
    severity,
    sweepRisk,
    tag,
    title,
    reason,
    hint,
    minLead,
    maxLead,
    meanUnits,
    returnSweepDeg,
    leftJitterEm,
  };
}

// 第 01 节：不对称感知广度演示数据（依据 Rayner 1998 与 Inhoff & Liu 1998）
export const GAZE_DEMOS = {
  zh: {
    id: "zh",
    label: "中文横排（LTR）",
    dir: "ltr",
    tokens: [..."水平文字顺着视线平稳向右流动，单次注视提前预读三字。"],
    leftSpan: 1,
    rightSpan: 3,
    defaultIdx: 5,
    note: "Inhoff & Liu（1998）眼动实验测得：中文横排阅读的感知广度向注视点左侧延展约 1 个汉字、向右侧延展约 3 个汉字——因单个汉字信息密度极高，向右预视 3 字就足以规划下一次眼跳。",
  },
  en: {
    id: "en",
    label: "English（LTR）",
    dir: "ltr",
    tokens: [..."Horizontal lines carry the eye smoothly from left to right."],
    leftSpan: 4,
    rightSpan: 14,
    defaultIdx: 12,
    note: "Rayner（1998）综述指出：英文等拉丁横排的感知广度高度不对称，向左仅约 3–4 个字母，向右可达 14–15 个字母空间——读者靠右侧粗略词形与空格预判下一个落点。",
  },
  rtl: {
    id: "rtl",
    label: "镜像横排（RTL 示意）",
    dir: "rtl",
    tokens: [
      "词 01", "词 02", "词 03", "词 04", "词 05", "词 06",
      "词 07", "词 08", "词 09", "词 10", "词 11", "词 12",
    ],
    leftSpan: 3,
    rightSpan: 1,
    defaultIdx: 4,
    note: "原海报写「从左到右」略微说多了一点：阿拉伯语、希伯来语同样采用水平排版（horizontal-tb），但行内方向自右向左（RTL）。Rayner（1998）同时指出，希伯来语读者的感知广度会镜像反转，改为向左侧大幅延伸——这说明不对称预视窗源于阅读方向与注意力投射，而非眼球天生只偏右。",
  },
};

// 第 02 节：4×4 行长 × 行距耦合矩阵（中文正文）
export const MATRIX_MEASURES = [13, 22, 30, 44];
export const MATRIX_LEADINGS = [1.15, 1.48, 1.72, 2.28];

export function evalMatrixCell(measure, leading) {
  const angle = (Math.atan2(leading, measure) * 180) / Math.PI;
  const minL = minSafeLeading(measure, "zh");
  const maxL = maxSafeLeading("zh");
  let zone = "sweet";
  let badge = "舒适甜区";
  let summary = `每行 ${measure} 字配 ${leading.toFixed(2)}× 行距，回扫倾角 ${angle.toFixed(1)}°。行长落在 20–30 汉字经验带，行间通道清晰，长时间阅读眼肌负担最低。`;

  if (measure < 18) {
    zone = leading < minL ? "bad" : "warn";
    badge = leading < minL ? "碎片且压挤" : "过短碎片";
    summary = `每行仅 ${measure} 字，虽回扫倾角陡峭（${angle.toFixed(1)}°），但句子被高频切断，眼球每读三四眼跳就被迫折返，阅读节奏支离破碎。`;
  } else if (measure > 33) {
    zone = leading >= 1.7 ? "warn" : "bad";
    badge = leading >= 1.7 ? "超宽勉强撑住" : "长行串行高危";
    summary =
      leading >= 1.7
        ? `每行 ${measure} 字已超 30 字舒适带，虽用 ${leading.toFixed(2)}× 宽行距勉强拉高回扫通道，但倾角仍仅 ${angle.toFixed(1)}°，长读仍易疲劳（适合改用分栏）。`
        : `每行高达 ${measure} 字且行距仅 ${leading.toFixed(2)}×，回扫倾角跌至 ${angle.toFixed(1)}°！眼睛跨过超宽行幅返回左侧时极易落错行，是最典型的横排翻车组合。`;
  } else if (leading < minL) {
    zone = "bad";
    badge = "行距压扁";
    summary = `行长 ${measure} 字本身合适，但 ${leading.toFixed(2)}× 行距低于该行宽所需的 ${minL.toFixed(2)}× 下限，上下行字框过于逼近，视线容易在水平扫读时误跳邻行。`;
  } else if (leading > maxL) {
    zone = "warn";
    badge = "行间散架";
    summary = `行距 ${leading.toFixed(2)}× 过松，白带比字身还宽，原本连贯的段落拆散成彼此孤立的横条，眼球向下换行的距离徒增。`;
  }

  return { measure, leading, angle, minL, zone, badge, summary };
}

// 第 07 节：四选一单变量盲测（仅差一个变量，标签严守中性 A/B/C/D）
export const PRACTICE_OPTIONS = {
  A: {
    id: "A",
    correct: true,
    measure: 26,
    leading: 1.72,
    align: "left",
    paraGap: 0.9,
    title: "选对了：A 版四项横排参数均衡落位",
    detail:
      "A 版把每行收在约 26 个汉字（落入 20–30 经验带）、行距 1.72×、左缘笔直稳锚、段距 0.9em 清晰大于行间净空。眼睛既能一次扫完完整意群，行尾回扫也有充裕坡度与固定落点。",
  },
  B: {
    id: "B",
    correct: false,
    measure: 42,
    leading: 1.65,
    align: "left",
    paraGap: 0.9,
    title: "差在「行长过长」：B 版把每行拉宽到了约 42 字",
    detail:
      "B 版的左对齐、行距和段距都正常，唯独缩小字号把单行塞进约 42 个汉字（远超 20–30 字舒适带）。单行跨度过长会压平回扫坡度，读完三四行后眼睛很容易重读或跳行。",
  },
  C: {
    id: "C",
    correct: false,
    measure: 26,
    leading: 1.16,
    align: "left",
    paraGap: 0.9,
    title: "差在「行距过紧」：C 版行距被压扁到 1.16×",
    detail:
      "C 版每行同样是舒适的 26 字且左齐，但行距压紧到 1.16×。汉字属于满格方块字，行间净空几乎消失后，上下两行笔画互相干扰，回扫通道被掐断。",
  },
  D: {
    id: "D",
    correct: false,
    measure: 26,
    leading: 1.72,
    align: "center",
    paraGap: 0.9,
    title: "差在「左缘失锚」：D 版把多行正文改成了居中",
    detail:
      "D 版的行长、行距、段距和最优解 A 完全一致，唯独改用了居中对齐。每行左侧起点都在左右漂移，眼睛每次行尾回扫都得重新找起点，长段阅读效率明显下降（居中适合短标题或诗行，详见 178 居中排版）。",
  },
};
