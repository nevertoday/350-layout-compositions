// 176 左对齐右参差 · 单真源排字、折行、河流检测与参差诊断模型
// 画面上的每一条红线、河道、字数读数、状态徽章与白话诊单，全部从同一份实绘 lines[] 算出。

export const LOGICAL_MAX_W = 580; // 统一逻辑排字满栏宽，保证 390–2560 六屏单真源折行一致

export const SPECIMENS = {
  bilingual: {
    id: "bilingual",
    label: "原海报 · 混排专栏",
    shortLabel: "混排专栏",
    script: "mixed",
    fontFamily: '"Noto Sans SC", "Archivo", sans-serif',
    fontSize: 16,
    // 理想中文等效字数（1 汉字 = 2 字符宽，18–35 汉字 ≈ 36–70 字符宽）
    idealCjk: [18, 35],
    minRagSpan: 0.045,
    text:
      "所有行以相同的起点对齐，右侧不刻意对齐，形成自然的参差边缘，让版面更轻松、易读。在 Flush Left 排法里，眼睛读完一行后做回扫 Return Sweep 时，下一行的落点永远钉在左侧同一条垂线上，不必每行重新摸索起点。同时因为词距与字距保持自然均匀，即便混入 Typographie、WCAG 1.4.8 这类英文术语或数字，栏内也不会被强行撕开刺眼的白色河流，整段读起来轻快透亮。",
  },
  english: {
    id: "english",
    label: "英文 · 书籍专栏",
    shortLabel: "英文专栏",
    script: "latin",
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 16.5,
    // Bringhurst 经验区间 45–75 字符，放宽 42–76 供多组合法解
    idealLatin: [42, 76],
    minRagSpan: 0.055,
    text:
      "Keep the left edge aligned. Let the right edge be uneven. This creates a natural rhythm and improves readability. When lines are set ragged right with uniform word spacing, the eye returns effortlessly to a constant vertical anchor, and varied line endings quietly help the reader keep track of each line without distracting typographic rivers.",
  },
  chinese: {
    id: "chinese",
    label: "纯中文 · 排印短论",
    shortLabel: "纯中文短论",
    script: "cjk",
    fontFamily: '"Noto Sans SC", sans-serif',
    fontSize: 16,
    idealCjk: [18, 35],
    minRagSpan: 0.03,
    text:
      "所有行以相同的起点对齐，右侧不刻意对齐，形成自然的参差边缘，让版面更轻松、易读。传统纯中文长文因为汉字天生等宽，大栏面常采用两端对齐；但到了手机屏幕、侧栏注释或短评导语里，栏宽一收窄，强行拉齐就会把整行汉字扯成稀疏散沙，不如松开右边线，把整齐留给左起线，把呼吸还给行尾，让视线一路顺畅推进。",
  },
};

export const INITIAL_STATE = {
  specimen: "bilingual",
  align: "justify", // 开场错态：窄栏强行两端对齐 → 撕裂词间白缝与河流
  measure: 0.45, // 0.34 .. 1.00（占逻辑满栏宽 620 的比例）
  leading: 1.24, // 1.15 .. 2.05（开场偏紧）
  pushes: {}, // { [lineIndex]: 0|1|2 } 手工行尾推词修边
  showOverlay: true, // 显示右侧参差包络线、河流与起线尺
  sweepActive: false, // 是否正在播放回扫眼动实测
};

export const VALID_PRESETS = {
  poster: {
    id: "poster",
    label: "原海报舒展解",
    align: "left",
    measure: 0.76,
    leading: 1.66,
    pushes: {},
  },
  magazine: {
    id: "magazine",
    label: "期刊紧凑解",
    align: "left",
    measure: 0.65,
    leading: 1.54,
    pushes: {},
  },
  book: {
    id: "book",
    label: "书籍从容解",
    align: "left",
    measure: 0.84,
    leading: 1.76,
    pushes: {},
  },
};

export const FAIL_PRESETS = {
  rivers: {
    id: "rivers",
    label: "窄栏河流",
    align: "justify",
    measure: 0.45,
    leading: 1.24,
    pushes: {},
  },
  jagged: {
    id: "jagged",
    label: "狗啃窄栏",
    align: "left",
    measure: 0.36,
    leading: 1.55,
    pushes: {},
  },
  centered: {
    id: "centered",
    label: "居中散轴",
    align: "center",
    measure: 0.76,
    leading: 1.62,
    pushes: {},
  },
  overwide: {
    id: "overwide",
    label: "超宽串行",
    align: "left",
    measure: 0.99,
    leading: 1.32,
    pushes: {},
  },
};

const NO_LINE_START = /^[，。、；：！？）》」』”’.,;:!?\])]/;
const NO_LINE_END = /^[（《「『“‘(\[]$/;
const IS_CJK = /[\u2e80-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/;

// 把文本拆成不可内部截断的排版 token（保留拉丁完整单词、数字编号、以及中文避头尾绑定）
export function tokenize(text) {
  const raw = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === " ") {
      raw.push({ text: " ", kind: "space" });
      i++;
      continue;
    }
    if (/[A-Za-z0-9]/.test(ch)) {
      let j = i + 1;
      while (j < text.length && /[A-Za-z0-9.\-']/.test(text[j])) j++;
      // 若末尾带英文句逗号，单独留给后续绑定逻辑
      const word = text.slice(i, j);
      raw.push({ text: word, kind: "word" });
      i = j;
      continue;
    }
    raw.push({ text: ch, kind: IS_CJK.test(ch) ? "cjk" : "punct" });
    i++;
  }
  // 中文/英文避头尾绑定：行首禁则标点附着到前一 token，行尾禁则开引号附着到后一 token
  const tokens = [];
  for (let k = 0; k < raw.length; k++) {
    const t = raw[k];
    if (t.kind !== "space" && NO_LINE_START.test(t.text) && tokens.length && tokens[tokens.length - 1].kind !== "space") {
      tokens[tokens.length - 1] = {
        text: tokens[tokens.length - 1].text + t.text,
        kind: tokens[tokens.length - 1].kind,
      };
    } else if (NO_LINE_END.test(t.text) && k + 1 < raw.length && raw[k + 1].kind !== "space") {
      raw[k + 1] = {
        text: t.text + raw[k + 1].text,
        kind: raw[k + 1].kind,
      };
    } else {
      tokens.push(t);
    }
  }
  return tokens;
}

// 统计一个文本串的等效拉丁字符宽（汉字/全角计 2，半角计 1）
export function charUnits(str) {
  let u = 0;
  for (const ch of str) u += IS_CJK.test(ch) ? 2 : 1;
  return u;
}

// 精确折行与词距/河流/参差核算引擎
// measureText(str) 由 Canvas 2D ctx.measureText 提供；在无 canvas 环境下自动降级估算
export function layoutTypeset(state, maxMeasurePx, measureTextFn) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.bilingual;
  const measurePx = Math.max(150, Math.round(maxMeasurePx * state.measure));
  const measure = measureTextFn || ((s) => charUnits(s) * spec.fontSize * 0.52);
  const spaceW = Math.max(3.6, measure(" "));
  const tokens = tokenize(spec.text);

  // 预测量所有 token 宽
  const measured = tokens.map((t) => ({
    ...t,
    w: t.kind === "space" ? spaceW : measure(t.text),
  }));

  // 贪心折行 + 支持用户手工推词 pushes[lineIdx]
  const rawLines = [];
  let idx = 0;
  let safety = 0;
  while (idx < measured.length && safety < 40) {
    safety++;
    // 跳过行首空格
    while (idx < measured.length && measured[idx].kind === "space") idx++;
    if (idx >= measured.length) break;

    const lineIdx = rawLines.length;
    const lineTokens = [];
    let curW = 0;

    while (idx < measured.length) {
      const tk = measured[idx];
      const nextW = curW + tk.w;
      // 空格不单独撑破行尾
      if (tk.kind === "space") {
        lineTokens.push(tk);
        curW = nextW;
        idx++;
        continue;
      }
      if (lineTokens.length > 0 && nextW > measurePx) {
        break;
      }
      lineTokens.push(tk);
      curW = nextW;
      idx++;
    }

    // 去掉行尾尾随空格
    while (lineTokens.length && lineTokens[lineTokens.length - 1].kind === "space") {
      lineTokens.pop();
    }

    // 应用用户手工行尾推词（仅对非最后一行且至少留 2 个非空 token 的行生效）
    const pushCount = Math.min(2, Math.max(0, Number(state.pushes?.[lineIdx] || 0)));
    if (pushCount > 0 && idx < measured.length) {
      let pushed = 0;
      let nonSpaceCount = lineTokens.filter((t) => t.kind !== "space").length;
      while (pushed < pushCount && nonSpaceCount > 2) {
        const popped = lineTokens.pop();
        idx--;
        if (popped && popped.kind !== "space") {
          pushed++;
          nonSpaceCount--;
        }
        while (lineTokens.length && lineTokens[lineTokens.length - 1].kind === "space") {
          lineTokens.pop();
          idx--;
        }
      }
    }

    rawLines.push(lineTokens);
  }

  // 计算每一行的逐词坐标、自然宽、对齐后起止点、拉伸比与空隙列表
  const lines = rawLines.map((lineTokens, lineIdx) => {
    const isLast = lineIdx === rawLines.length - 1;
    const naturalW = lineTokens.reduce((s, t) => s + t.w, 0);
    const fullText = lineTokens.map((t) => t.text).join("");
    const units = charUnits(fullText);
    const nonSpaceTokens = lineTokens.filter((t) => t.kind !== "space");
    const spaceIndices = [];
    lineTokens.forEach((t, ti) => {
      if (t.kind === "space") spaceIndices.push(ti);
    });

    let x0 = 0;
    let drawW = naturalW;
    let stretchRatio = 1;
    let maxGapPx = spaceW;
    const positioned = [];
    const stretchedGaps = [];

    if (state.align === "left" || (state.align === "justify" && isLast)) {
      x0 = 0;
      let cx = x0;
      for (const t of lineTokens) {
        if (t.kind !== "space") positioned.push({ text: t.text, x: cx, w: t.w, kind: t.kind });
        cx += t.w;
      }
      drawW = naturalW;
    } else if (state.align === "center") {
      x0 = Math.max(0, (measurePx - naturalW) / 2);
      let cx = x0;
      for (const t of lineTokens) {
        if (t.kind !== "space") positioned.push({ text: t.text, x: cx, w: t.w, kind: t.kind });
        cx += t.w;
      }
      drawW = naturalW;
    } else if (state.align === "right") {
      x0 = Math.max(0, measurePx - naturalW);
      let cx = x0;
      for (const t of lineTokens) {
        if (t.kind !== "space") positioned.push({ text: t.text, x: cx, w: t.w, kind: t.kind });
        cx += t.w;
      }
      drawW = naturalW;
    } else if (state.align === "justify") {
      x0 = 0;
      const extra = Math.max(0, measurePx - naturalW);
      // 优先摊分到空格；若空格极少（例如纯中文行，空格数 < 2），则把剩余空间摊分到非空字符之间（模拟中文强行两端对齐撕裂字距）
      const useWordSpaces = spaceIndices.length >= 2 && (spec.script === "latin" || spaceIndices.length >= 3);
      if (useWordSpaces) {
        const addPerSpace = extra / spaceIndices.length;
        const actualGap = spaceW + addPerSpace;
        stretchRatio = actualGap / spaceW;
        maxGapPx = actualGap;
        let cx = 0;
        for (const t of lineTokens) {
          if (t.kind === "space") {
            const gw = spaceW + addPerSpace;
            if (gw > spaceW * 1.45) {
              stretchedGaps.push({ x1: cx, x2: cx + gw, cx: cx + gw / 2, w: gw, ratio: gw / spaceW });
            }
            cx += gw;
          } else {
            positioned.push({ text: t.text, x: cx, w: t.w, kind: t.kind });
            cx += t.w;
          }
        }
      } else {
        // 混合/纯中文：同时摊到空格（权重 2.6）与字间（权重 1）
        const slots = Math.max(1, lineTokens.length - 1);
        const weights = [];
        let totalWeight = 0;
        for (let k = 0; k < lineTokens.length - 1; k++) {
          const isSp = lineTokens[k].kind === "space" || lineTokens[k + 1].kind === "space";
          const wt = isSp ? 2.4 : 1;
          weights.push(wt);
          totalWeight += wt;
        }
        let cx = 0;
        let maxG = spaceW;
        for (let k = 0; k < lineTokens.length; k++) {
          const t = lineTokens[k];
          if (t.kind !== "space") {
            positioned.push({ text: t.text, x: cx, w: t.w, kind: t.kind });
          }
          const add = k < weights.length ? (extra * weights[k]) / Math.max(1, totalWeight) : 0;
          const baseW = t.kind === "space" ? spaceW : 0;
          const gapW = baseW + add;
          if (t.kind === "space" && gapW > spaceW * 1.45) {
            stretchedGaps.push({ x1: cx, x2: cx + gapW, cx: cx + gapW / 2, w: gapW, ratio: gapW / spaceW });
          } else if (t.kind !== "space" && add > spec.fontSize * 0.17) {
            stretchedGaps.push({ x1: cx + t.w, x2: cx + t.w + add, cx: cx + t.w + add / 2, w: add, ratio: 1 + add / spaceW });
          }
          if (gapW > maxG) maxG = gapW;
          cx += t.w + add;
        }
        maxGapPx = maxG;
        stretchRatio = Math.max(1, maxG / spaceW);
      }
      drawW = measurePx;
    }

    return {
      index: lineIdx,
      isLast,
      text: fullText,
      units,
      tokenCount: nonSpaceTokens.length,
      naturalW,
      drawW,
      x0,
      x1: x0 + drawW,
      ratio: drawW / measurePx,
      naturalRatio: naturalW / measurePx,
      stretchRatio,
      maxGapPx,
      positioned,
      stretchedGaps,
      pushed: Number(state.pushes?.[lineIdx] || 0),
    };
  });

  // 检测白色河流（Rivers）：相邻行之间水平接近的拉伸白缝连成纵向走廊
  const rivers = [];
  if (state.align === "justify") {
    const used = new Set();
    for (let li = 0; li < lines.length - 1; li++) {
      for (let gi = 0; gi < lines[li].stretchedGaps.length; gi++) {
        const key = `${li}:${gi}`;
        if (used.has(key)) continue;
        const startGap = lines[li].stretchedGaps[gi];
        const chain = [{ line: li, ...startGap }];
        used.add(key);
        let curLine = li;
        let curGap = startGap;
        while (curLine + 1 < lines.length - 1) {
          const nextGaps = lines[curLine + 1].stretchedGaps;
          let bestIdx = -1;
          let bestDist = Infinity;
          for (let ng = 0; ng < nextGaps.length; ng++) {
            const nk = `${curLine + 1}:${ng}`;
            if (used.has(nk)) continue;
            const d = Math.abs(nextGaps[ng].cx - curGap.cx);
            const tol = Math.max(22, (nextGaps[ng].w + curGap.w) * 0.85);
            if (d <= tol && d < bestDist) {
              bestDist = d;
              bestIdx = ng;
            }
          }
          if (bestIdx >= 0) {
            used.add(`${curLine + 1}:${bestIdx}`);
            curGap = nextGaps[bestIdx];
            curLine++;
            chain.push({ line: curLine, ...curGap });
          } else {
            break;
          }
        }
        // 至少贯通 2 行、或单行存在极度刺眼大裂口（>2.45×）时都视为严重白缝/河流
        if (chain.length >= 2) {
          rivers.push(chain);
        }
      }
    }
  }

  const audit = auditLayout(lines, rivers, state, spec, measurePx);
  return { spec, measurePx, maxMeasurePx, spaceW, lines, rivers, audit };
}

function auditLayout(lines, rivers, state, spec, measurePx) {
  const bodyLines = lines.length > 1 ? lines.slice(0, -1) : lines;
  const lastLine = lines[lines.length - 1];

  // 1. 起线统一
  const xs = lines.map((l) => l.x0);
  const startJitterPx = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const startOk = state.align === "left" && startJitterPx < 0.5;
  const startJustifyNote = state.align === "justify";

  // 2. 词距均匀 / 无河流
  const maxStretch = bodyLines.reduce((m, l) => Math.max(m, l.stretchRatio), 1);
  const bigGapCount = bodyLines.reduce((n, l) => n + l.stretchedGaps.filter((g) => g.ratio >= 1.65).length, 0);
  const spacingOk = state.align !== "justify" && maxStretch <= 1.12;

  // 3. 适读行长与行距
  const avgUnits = bodyLines.length
    ? bodyLines.reduce((s, l) => s + l.units, 0) / bodyLines.length
    : lines[0]?.units || 0;
  const avgCjk = avgUnits / 2;
  const isLatin = spec.script === "latin";
  const [minLen, maxLen] = isLatin ? spec.idealLatin : spec.idealCjk;
  const currentLen = isLatin ? avgUnits : avgCjk;
  const tooNarrow = currentLen < minLen;
  const tooWide = currentLen > maxLen;
  const leadingTight = state.leading < 1.44;
  const leadingLoose = state.leading > 2.02;
  const measureOk = !tooNarrow && !tooWide && !leadingTight && !leadingLoose;

  // 4. 右缘参差形态体检（仅左对齐下核算自然参差）
  const ratios = bodyLines.map((l) => l.naturalRatio);
  const minR = ratios.length ? Math.min(...ratios) : 1;
  const maxR = ratios.length ? Math.max(...ratios) : 1;
  const ragSpan = maxR - minR;

  let maxStepDrop = 0;
  let holeLine = -1;
  for (let i = 0; i < bodyLines.length - 1; i++) {
    const diff = Math.abs(bodyLines[i].naturalRatio - bodyLines[i + 1].naturalRatio);
    if (diff > maxStepDrop) {
      maxStepDrop = diff;
      holeLine = bodyLines[i].naturalRatio < bodyLines[i + 1].naturalRatio ? i : i + 1;
    }
  }
  const hasDeepHole = maxStepDrop > 0.27 || ragSpan > 0.30;

  // 检出连续 4 行及以上单调递增或递减楼梯斜坡
  let incRun = 1;
  let decRun = 1;
  let staircaseStart = -1;
  let staircaseLen = 0;
  for (let i = 1; i < bodyLines.length; i++) {
    const d = bodyLines[i].naturalRatio - bodyLines[i - 1].naturalRatio;
    if (d >= 0.022) {
      incRun++;
      decRun = 1;
      if (incRun >= 4 && incRun > staircaseLen) {
        staircaseLen = incRun;
        staircaseStart = i - incRun + 1;
      }
    } else if (d <= -0.022) {
      decRun++;
      incRun = 1;
      if (decRun >= 4 && decRun > staircaseLen) {
        staircaseLen = decRun;
        staircaseStart = i - decRun + 1;
      }
    } else {
      incRun = 1;
      decRun = 1;
    }
  }
  const hasStaircase = staircaseLen >= 4;

  // 检出末行孤词短尾（宽 < 18% 且仅剩极少字符）
  const hasWidow =
    lines.length >= 3 &&
    lastLine &&
    lastLine.naturalRatio < 0.19 &&
    lastLine.units <= (isLatin ? 11 : 7);

  // 检出右缘僵死（假对齐：仅针对不等宽拉丁文；纯中文与中英混排因汉字天生等宽，自然平齐属于正常特性）
  const tooFlat = isLatin && bodyLines.length >= 3 && ragSpan < spec.minRagSpan && minR > 0.93;

  const ragOk =
    state.align === "left" &&
    !hasDeepHole &&
    !hasStaircase &&
    !hasWidow &&
    !tooFlat;

  // 四项检查（起线统一、词距均匀、行长行距、自然参差）
  const checks = {
    start: startOk,
    spacing: spacingOk,
    measure: measureOk,
    rag: ragOk,
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 生成单真源白话诊单（明确说清错在哪、为什么眼睛累、动手怎么改）
  const lenText = isLatin ? `约 ${Math.round(currentLen)} 字符/行` : `约 ${Math.round(currentLen)} 字/行`;
  const ragPct = Math.round(ragSpan * 100);
  const dropPct = Math.round(maxStepDrop * 100);
  const jitterPx = Math.round(startJitterPx);

  let statusTag = "4/4 · 参差成立";
  let headline = "左起线钉稳，右侧长短交错，整栏读起来轻快透气";
  let body = `当前 ${lenText}、行距 ${state.leading.toFixed(2)}，右缘自然起伏 ${ragPct}%，词距保持 1.00× 均匀无白缝。读完每一行向左回扫时，落点始终在同一条垂线上，而每行不同的尾形帮眼睛认准行次、不串行。`;
  let hint = "按 Space 键（或点「回扫实测」）看视点如何沿着左起线流畅换行；也可切换英文/纯中文标本继续试验。";
  let severity = "pass";
  let issueKind = "ok";

  if (state.align === "justify") {
    severity = "error";
    issueKind = "rivers";
    statusTag = `${passCount}/4 · ${rivers.length > 0 ? `河流 ${rivers.length} 条` : `词距拉宽 ${maxStretch.toFixed(1)}×`}`;
    headline =
      rivers.length > 0
        ? `窄栏强行两端对齐，栏内裂出 ${rivers.length} 条白色河流`
        : `强行拉齐右边线，词距被硬撑至 ${maxStretch.toFixed(1)}×`;
    body = `为了把右边线拉直，排版引擎把多出来的空隙硬塞进词与字之间（当前最宽白缝拉至 ${maxStretch.toFixed(1)}×，产生 ${bigGapCount} 处刺眼空洞）。读者的视线会被这些纵向贯通的亮白通道钩走，阅读节奏碎成一截一截。`;
    hint = "先把对齐切到「左对齐」释放右侧参差，再向右拖动红标尺把栏宽放宽到适读区间。";
  } else if (state.align === "center") {
    severity = "error";
    issueKind = "center";
    statusTag = `${passCount}/4 · 起线飘移 ${jitterPx}px`;
    headline = `居中排版让左起线左右跳动 ${jitterPx}px，眼睛每行都要重找起点`;
    body = "读完一行向左回扫（Return Sweep）时，大脑原本靠固定左边界盲降落点。现在每一行的开头位置都不一样，眼睛几乎每行都要多做一次找起点的纠正眼跳，读上五六行就明显发累。";
    hint = "切回「左对齐」，把所有行的起笔钉回同一条左侧垂线上。";
  } else if (state.align === "right") {
    severity = "error";
    issueKind = "right";
    statusTag = `${passCount}/4 · 左缘参差 ${jitterPx}px`;
    headline = `右对齐把参差留在左侧，下一行起点忽远忽近（差 ${jitterPx}px）`;
    body = "横排阅读是从左向右推进的，左起线是最宝贵的定位锚点。把整齐留给行尾、把参差丢给行首，正好和回扫眼动的生理习惯反着来。";
    hint = "切回「左对齐」，让左起线笔直、把参差还给行尾。";
  } else if (tooNarrow) {
    severity = "error";
    issueKind = "narrow";
    statusTag = `${passCount}/4 · 栏窄 ${isLatin ? Math.round(currentLen) + "ch" : Math.round(currentLen) + "字"}`;
    headline = `栏宽过窄（${lenText}），右缘被扯成狗啃锯齿`;
    body = `单行装不下几个完整词组，长词或标点一折行就留出大块空洞（当前右缘最大落差达 ${ragPct}%）。眼睛还没进入阅读节拍就被迫频繁折返，节奏支离破碎。`;
    hint = `在画布上向右拖动朱红右边标尺，把行长放宽到 ${isLatin ? "42–75 字符" : "18–35 字"} 区间。`;
  } else if (tooWide) {
    severity = "error";
    issueKind = "wide";
    statusTag = `${passCount}/4 · 栏宽 ${isLatin ? Math.round(currentLen) + "ch" : Math.round(currentLen) + "字"}`;
    headline = `单行过长（${lenText}），回扫眼跳距离太长容易串行`;
    body = `从行尾斜着甩回下一行左起线的路程越长，眼球落点偏差（undershoot）就越大。WCAG 1.4.8 建议单行不超过 ${isLatin ? "80 字符" : "40 汉字"}，Bringhurst 建议拉丁文落在 45–75 字符，超过后极易读重同一行或漏跳一行。`;
    hint = `在画布上向左拖动朱红右边标尺，收束到 ${isLatin ? "42–75 字符" : "18–35 字"} 区间。`;
  } else if (leadingTight) {
    severity = "warn";
    issueKind = "tight";
    statusTag = `${passCount}/4 · 行距紧 ${state.leading.toFixed(2)}`;
    headline = `行距压到 ${state.leading.toFixed(2)}，上下行字脚几乎粘连`;
    body = "即使左起线对齐、栏宽合适，过紧的行距也会让相邻两行在回扫途中互相抢眼。WCAG 1.4.8 建议正文行距不低于 1.5 倍，给左右扫视留出清晰的水平航道。";
    hint = "向右推「行距」滑轨到 1.48–1.85 之间，立刻让整段透出呼吸感。";
  } else if (leadingLoose) {
    severity = "warn";
    issueKind = "loose";
    statusTag = `${passCount}/4 · 行距散 ${state.leading.toFixed(2)}`;
    headline = `行距撑到 ${state.leading.toFixed(2)}，整段被拆成互不相干的散行`;
    body = "行间白带比字高还宽得多，眼睛不再把它们当成一个连续段落，每读完一行都要重新确认下一行是不是接续正文。";
    hint = "把「行距」收回到 1.50–1.85 的舒适区间。";
  } else if (hasDeepHole) {
    severity = "warn";
    issueKind = "hole";
    statusTag = `${passCount}/4 · 断崖落差 ${dropPct}%`;
    headline = `第 ${holeLine + 1} 行附近出现深凹缺口（落差 ${dropPct}%），右缘断层`;
    body = "左对齐右参差不是「放任不管」。某一行突然短进一大截，会在栏右侧啃出一个扎眼的白坑，把原本平缓的波浪轮廓打断。";
    hint = `微调右边标尺，或直接点击第 ${Math.max(1, holeLine)} 行尾部把末尾词轻推到下一行修平凹坑。`;
  } else if (hasStaircase) {
    severity = "warn";
    issueKind = "staircase";
    statusTag = `${passCount}/4 · ${staircaseLen} 行楼梯坡`;
    headline = `第 ${staircaseStart + 1}–${staircaseStart + staircaseLen} 行连成单调斜坡，右缘像切了一刀`;
    body = "好的参差应该「长—略短—长—略短」自然交错。连续四行以上顺着同一方向阶梯增减，会在右边形成一根明显的斜线，把整栏重心拉歪。";
    hint = `微调栏宽标尺，或直接点击第 ${staircaseStart + 2} 行尾部推词打断单调阶梯。`;
  } else if (hasWidow) {
    severity = "warn";
    issueKind = "widow";
    statusTag = `${passCount}/4 · 末行孤词`;
    headline = `末行只剩一个孤零零的短尾（仅占栏宽 ${Math.round(lastLine.naturalRatio * 100)}%）`;
    body = "段落最后一行如果只掉下来一两个字，视觉上像多出一截断尾，让段落收口显得匆忙松垮。";
    hint = `轻轻微调栏宽标尺，或点倒数第 2 行尾部多推一个词下来陪末行。`;
  } else if (tooFlat) {
    severity = "warn";
    issueKind = "flat";
    statusTag = `${passCount}/4 · 参差过平 ${ragPct}%`;
    headline = `右缘落差仅 ${ragPct}%，看起来像「没对齐干净的两端对齐」`;
    body = "如果每一行都几乎顶死右边线、只差半个字，读者反而会误以为排版失误没对齐。参差要干脆自然，让右侧留出轻快的变化。";
    hint = "微调栏宽或轻点某行行尾，让右侧呈现 8%–22% 的轻快起伏。";
  }

  // 原海报三枚朱红圆徽的实时单真源探针状态
  const badges = {
    start: {
      ok: startOk,
      tag: startOk
        ? "0px 严齐"
        : startJustifyNote
        ? "左齐·右硬拉"
        : `偏 ${jitterPx}px`,
    },
    reading: {
      ok: spacingOk && measureOk,
      tag: !spacingOk
        ? rivers.length > 0
          ? `河流 ${rivers.length} 条`
          : `拉宽 ${maxStretch.toFixed(1)}×`
        : tooNarrow
        ? `过窄 ${isLatin ? Math.round(currentLen) + "ch" : Math.round(currentLen) + "字"}`
        : tooWide
        ? `过宽 ${isLatin ? Math.round(currentLen) + "ch" : Math.round(currentLen) + "字"}`
        : leadingTight
        ? `行紧 ${state.leading.toFixed(2)}`
        : leadingLoose
        ? `行散 ${state.leading.toFixed(2)}`
        : `${isLatin ? Math.round(currentLen) + "ch" : Math.round(currentLen) + "字"} · 1.0×`,
    },
    rhythm: {
      ok: ragOk,
      tag:
        state.align === "justify"
          ? "右缘拉死"
          : state.align !== "left"
          ? "失参差"
          : hasDeepHole
          ? `凹坑 ${dropPct}%`
          : hasStaircase
          ? `${staircaseLen} 行斜坡`
          : hasWidow
          ? "末行孤词"
          : tooFlat
          ? `过平 ${ragPct}%`
          : `起伏 ${ragPct}%`,
    },
  };

  return {
    checks,
    passCount,
    statusTag,
    headline,
    body,
    hint,
    severity,
    issueKind,
    avgUnits,
    avgCjk,
    lenText,
    ragSpan,
    ragPct,
    maxStepDrop,
    holeLine,
    hasDeepHole,
    hasStaircase,
    staircaseStart,
    staircaseLen,
    hasWidow,
    tooFlat,
    maxStretch,
    startJitterPx,
    riverCount: rivers.length,
    badges,
    lineCount: lines.length,
    measurePx,
  };
}
