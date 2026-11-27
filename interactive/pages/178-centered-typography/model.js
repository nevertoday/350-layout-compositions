// 178 居中排版 CENTERED TYPOGRAPHY · 单真源排印与视觉中心计算引擎
// 所有画布坐标、折行宽度、墨色质心、回扫路径与诊断结论均由本模块统一算出。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 碑帖",
    shortLabel: "原海报",
    title: "居中排版",
    subtitle: "CENTERED TYPOGRAPHY",
    triad: [
      { zh: "中心", en: "CENTER" },
      { zh: "聚焦", en: "FOCUS" },
      { zh: "稳定", en: "BALANCE" },
    ],
    // 按不同目标行数准备自然递进的真实语料，避免硬截断半句，且默认栏宽下与目标行数贴合
    proseByLines: {
      2: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。",
      3: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。",
      4: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。",
      5: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。长文若照搬居中，每行起笔漂移。",
      6: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。一旦正文拉长，每行左端入口都会游移，回扫寻找起点便会吃力。",
      7: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。一旦正文拉长，每行左端入口游移，回扫寻找起笔很吃力，端庄气场会退化成锯齿石碑。",
      8: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。一旦正文拉长成段落，每行左端入口游移，回扫寻找起笔很吃力，端庄气场会退化成难读的锯齿石碑，书刊正文因此从不居中。",
      9: "将文字与元素在视觉中心对齐，建立清晰层级，强化信息焦点，传达稳定与秩序感。一旦正文拉长成段落，每行左端入口游移，回扫寻找起笔很吃力，端庄气场会退化成难读的锯齿石碑，这正是书刊正文从不居中、只留给扉页的原因。",
    },
    enFooter: "ALIGN TEXT AND ELEMENTS ON THE VISUAL CENTER",
  },
  exhibition: {
    id: "exhibition",
    label: "展册 · 扉页",
    shortLabel: "展册扉页",
    title: "静默与尺度",
    subtitle: "SILENCE & PROPORTION",
    triad: [
      { zh: "留白", en: "SPACE" },
      { zh: "轴线", en: "AXIS" },
      { zh: "庄重", en: "POISE" },
    ],
    proseByLines: {
      2: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。",
      3: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。",
      4: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。",
      5: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。扉页贵在短促致意，塞满说明便会失焦。",
      6: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。古典展板偏爱居中，因为只做简短声明；一旦把策展长文居中，阅读立刻受阻。",
      7: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。古典展板偏爱居中，因为只做简短声明；把策展长文整段居中，每行起点忽远忽近，仪式感变成阻力。",
      8: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。古典展板偏爱居中，因为只做简短声明；把策展长文整段居中，每行起点忽远忽近，读者回扫费力，不如拆成短扉页配左齐导言。",
      9: "观照纸面中心的引力，让字句如建筑立面般自立，于停顿之间留出回响。古典展板偏爱居中，因为只做简短声明；把策展长文整段居中，每行起点忽远忽近，读者回扫费力，不如拆成短扉页配左齐导言更清楚。",
    },
    enFooter: "AUTUMN ARCHITECTURE MONOGRAPH · GALLERY III",
  },
  invitation: {
    id: "invitation",
    label: "请柬 · 室乐",
    shortLabel: "室乐请柬",
    title: "暮色弦乐夜",
    subtitle: "CHAMBER QUARTET RECITAL",
    triad: [
      { zh: "拾壹月", en: "NOV 24" },
      { zh: "音乐厅", en: "HALL" },
      { zh: "烛光场", en: "RECITAL" },
    ],
    proseByLines: {
      2: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。",
      3: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。",
      4: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。",
      5: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。请柬贵在疏朗，塞进须知便显局促。",
      6: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。手修断行能排成优雅倒梯形；若把停车指引与退票须知一并居中，请柬便成了告示。",
      7: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。手修断行能排成优雅倒梯形；若把停车与入场细则全居中，眼睛来回搜寻起笔，诚意反被繁琐淹没。",
      8: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。手修断行能排成优雅倒梯形；若把停车与入场细则全居中，眼睛来回搜寻起笔，诚意反被淹没，细则应当移去背面左对齐。",
      9: "诚邀共赴秋末室内乐之夜，于对称穹顶与暖光之下，静听古典弦乐回声。手修断行能排成优雅倒梯形；若把停车与入场细则全居中，眼睛来回搜寻起笔，诚意反被淹没，细则应当移去背面左对齐排布。",
    },
    enFooter: "SYMPHONIC CHAMBER HALL · EIGHT O'CLOCK",
  },
};

export const INITIAL_STATE = {
  specimen: "poster",
  align: "center",
  measure: 0.50,
  centerY: 0.56,      // 几何偏下沉（> 49.5%）
  axisOffset: 0.075,  // 明显偏右脱轴
  scaleRatio: 1.18,   // 主次层级塌平（< 1.7×）
  targetLines: 7,     // 长文过载（> 4 行）
  opticalPunct: false,// 关闭标点光学悬出
  lineNudge: 0,       // 手修断行偏移（点行循环微调每行容量，破除孤字）
  orphanForce: true,  // 开场初始态保留真实 1–2 字孤尾以便直观识别，用户一调栏宽或点行即刻脱离
  showGuides: true,
};

export const SOLUTIONS = {
  poster_classic: {
    id: "poster_classic",
    label: "原海报碑帖解",
    note: "2 行舒展倒梯形 · 视觉中心 44% · 2.35× 清晰层级",
    patch: {
      align: "center",
      measure: 0.72,
      centerY: 0.44,
      axisOffset: 0,
      scaleRatio: 2.35,
      targetLines: 2,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
  classical_funnel: {
    id: "classical_funnel",
    label: "古典漏斗解",
    note: "3 行倒金字塔收束 · 视觉中心 43% · 典雅书卷气",
    patch: {
      align: "center",
      measure: 0.54,
      centerY: 0.43,
      axisOffset: 0,
      scaleRatio: 2.15,
      targetLines: 3,
      opticalPunct: true,
      lineNudge: 1,
      orphanForce: false,
    },
  },
  diamond_card: {
    id: "diamond_card",
    label: "菱形请柬解",
    note: "4 行紧凑平衡轮廓 · 视觉中心 46% · 适合请柬卡",
    patch: {
      align: "center",
      measure: 0.44,
      centerY: 0.46,
      axisOffset: 0,
      scaleRatio: 2.0,
      targetLines: 4,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
};

export const FAIL_PRESETS = {
  err_orphan: {
    id: "err_orphan",
    label: "孤字吊尾",
    patch: {
      align: "center",
      measure: 0.66,
      centerY: 0.44,
      axisOffset: 0,
      scaleRatio: 2.25,
      targetLines: 2,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: true,
    },
  },
  err_long: {
    id: "err_long",
    label: "8行长文",
    patch: {
      align: "center",
      measure: 0.64,
      centerY: 0.45,
      axisOffset: 0,
      scaleRatio: 2.2,
      targetLines: 8,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
  err_sink: {
    id: "err_sink",
    label: "几何下坠",
    patch: {
      align: "center",
      measure: 0.70,
      centerY: 0.58,
      axisOffset: 0,
      scaleRatio: 2.2,
      targetLines: 2,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
  err_top: {
    id: "err_top",
    label: "顶压窒息",
    patch: {
      align: "center",
      measure: 0.70,
      centerY: 0.33,
      axisOffset: 0,
      scaleRatio: 2.95,
      targetLines: 2,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
  err_flat: {
    id: "err_flat",
    label: "层级塌平",
    patch: {
      align: "center",
      measure: 0.70,
      centerY: 0.44,
      axisOffset: 0,
      scaleRatio: 1.15,
      targetLines: 3,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
  err_left: {
    id: "err_left",
    label: "误切左齐",
    patch: {
      align: "left",
      measure: 0.68,
      centerY: 0.44,
      axisOffset: 0,
      scaleRatio: 2.25,
      targetLines: 3,
      opticalPunct: true,
      lineNudge: 0,
      orphanForce: false,
    },
  },
};

export function createState() {
  return { ...INITIAL_STATE };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

const TRAILING_PUNCT_RE = /[。，、；：！？》」』）】\.!,;:]$/;
const NO_START_PUNCT = new Set(["。", "，", "、", "；", "：", "！", "？", "》", "」", "』", "）", "】", ".", ",", "!", "?"]);

// 根据真实字宽测量器排布每一行（供 Canvas 与单测共用）
export function wrapProse(text, maxWidthPx, bodyPx, measureText, opts = {}) {
  const { targetLines = 2, lineNudge = 0, orphanForce = false } = opts;
  const chars = [...text];
  if (!chars.length) return [];

  // 如果需要构造真实的经典孤尾错态（比如自动折行刚好卡出 1–2 字尾行）
  if (orphanForce && chars.length > 10) {
    const tailLen = 2; // 例如「感。」或「响。」
    const headStr = chars.slice(0, chars.length - tailLen).join("");
    const tailStr = chars.slice(chars.length - tailLen).join("");
    const headLines = wrapGreedy(headStr, Math.max(maxWidthPx * 0.94, bodyPx * 6), measureText);
    return [...headLines, tailStr];
  }

  // 根据 lineNudge 微调每行宽度目标，允许用户点击单行手动平衡孤字或换轮廓
  const adjustedMax = Math.max(bodyPx * 5.2, maxWidthPx + lineNudge * bodyPx * 1.45);
  let lines = wrapGreedy(text, adjustedMax, measureText);

  // 如果用户将 targetLines 设为 2–4 且自动折行刚好产生与目标不一致的多余行，按实际栏宽保留真实折行，
  // 只在开启「古典漏斗」等手动 nudge 时按语意逗号做自然断行优化
  if (lineNudge === 1 && targetLines === 3 && lines.length >= 2) {
    // 按中文逗号自然分成 3 句倒梯形
    const clauses = text.split(/(?<=[，。])/).filter(Boolean);
    if (clauses.length >= 3) {
      const a = clauses.slice(0, 2).join("");
      const b = clauses.slice(2, 3).join("");
      const c = clauses.slice(3).join("");
      if (c) lines = [a, b, c];
    }
  }
  return lines;
}

function wrapGreedy(text, maxW, measureText) {
  const chars = [...text];
  const lines = [];
  let cur = "";
  let curW = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cw = measureText(ch);
    if (cur.length > 0 && curW + cw > maxW) {
      // 避头标点：标点不落行首，回收到本行末尾
      if (NO_START_PUNCT.has(ch)) {
        lines.push(cur + ch);
        cur = "";
        curW = 0;
      } else {
        lines.push(cur);
        cur = ch;
        curW = cw;
      }
    } else {
      cur += ch;
      curW += cw;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// 计算全角尾标点带来的视觉白边宽度（真实中文字体中 `。` `，` 右半格为空白）
export function trailingPunctOpticalShift(line, bodyPx, measureText) {
  if (!TRAILING_PUNCT_RE.test(line)) return 0;
  const last = line[line.length - 1];
  const chW = measureText(last);
  // 全角中文标点视觉重心偏左约 52%，右半约 48% 是内置留白；拉丁句点约 35%
  const isFullWidth = last.charCodeAt(0) > 0x2e80;
  return chW * (isFullWidth ? 0.52 : 0.35);
}

// 单真源几何排布：输入状态 + 画布尺寸 + 真实字宽函数 → 输出所有元素坐标 + 所有实测指标 + 4 项诊断
export function computeLayout(state, width, height, measureFn) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const compact = width < 520;
  const padX = Math.max(20, width * (compact ? 0.06 : 0.065));
  const innerW = width - padX * 2;
  const trueMidX = width * 0.5;
  const axisX = trueMidX + state.axisOffset * innerW;

  // 正文字号随画布与行数稳健缩放，保证 2–9 行与圆盘完整入画且绝不裁底
  const lineTarget = clamp(Math.round(state.targetLines), 2, 9);
  const dense = lineTarget >= 5;
  const shortH = height < 340;
  const baseBody = clamp(
    Math.round(Math.min(width * (compact ? 0.034 : 0.0175), height * (dense ? (shortH ? 0.035 : 0.036) : 0.041))),
    shortH ? 11 : 12,
    width >= 900 ? 17 : 16
  );
  const bodyPx = baseBody;
  const titlePx = clamp(bodyPx * state.scaleRatio, bodyPx * 1.08, Math.min(width * 0.13, height * (dense ? (shortH ? 0.098 : 0.118) : 0.155)));
  const subPx = clamp(Math.round(Math.max(10.5, titlePx * 0.34)), 10.5, 15);
  // 真实排印栏宽上限按字号（约 30 个汉字）锚定，既保证宽屏轮廓端庄，也让多行坏态在所有屏幕稳定超过 4 行
  const typographicMaxW = Math.min(innerW * 0.88, bodyPx * 31);
  const measurePx = clamp(state.measure, 0.32, 0.90) * typographicMaxW;

  const measureBody = (s) => measureFn(s, bodyPx, "body");
  const measureTitle = (s) => measureFn(s, titlePx, "title");
  const measureSub = (s) => measureFn(s, subPx, "sub");

  const prose = spec.proseByLines[lineTarget] || spec.proseByLines[2];
  const rawLines = wrapProse(prose, measurePx, bodyPx, measureBody, {
    targetLines: lineTarget,
    lineNudge: state.lineNudge,
    orphanForce: state.orphanForce,
  });

  // 蜜桃圆盘严格正圆，在多行长文或扁横屏状态下优雅收束尺寸，确保整组碑帖永远完整可见
  const discScale = rawLines.length >= 6 ? (shortH ? 0.056 : 0.074) : rawLines.length >= 4 ? 0.095 : 0.118;
  const discR = clamp(Math.min(width * (compact ? 0.108 : 0.086), height * discScale), shortH ? 17 : 21, width >= 900 ? 52 : 46);
  const ring1R = discR * 1.34;
  const ring2R = discR * 1.66;

  const titleW = measureTitle(spec.title);
  const subW = measureSub(spec.subtitle);
  const bodyLeading = Math.round(bodyPx * (rawLines.length >= 6 ? (shortH ? 1.24 : 1.38) : 1.64));
  const bodyBlockH = rawLines.length > 0 ? (rawLines.length - 1) * bodyLeading + bodyPx : 0;

  // 整组碑帖垂直结构（标题 → 英文副标 → 横线 → 蜜桃圆盘双环 → 居中正文）围绕视觉中心 anchorY 整体浮沉
  const gapTitleSub = Math.round(titlePx * 0.56 + subPx * 0.58 + (shortH ? 2 : 4));
  const gapSubRule = Math.round(subPx * 0.52 + (shortH ? 4 : 6));
  const gapRuleDisc = Math.round(ring2R + (dense ? (shortH ? 5 : 8) : 13));
  const gapDiscBody = Math.round(ring2R + (dense ? (shortH ? 8 : 12) : 18));

  const aboveDiscH = titlePx * 0.5 + gapTitleSub + gapSubRule + gapRuleDisc;
  const belowDiscH = gapDiscBody + bodyBlockH;
  const totalStackH = aboveDiscH + belowDiscH;

  // 顶部给 HUD 与脱轴标尺留出净空，绝不互相撞字，且底部绝不裁切末行孤尾
  const rawMidY = clamp(state.centerY, 0.30, 0.64) * height;
  const topBound = state.centerY < 0.37 ? 30 : shortH ? 34 : 46;
  const botBound = height - (shortH ? 12 : 14);
  const idealTop = rawMidY - totalStackH * 0.5;
  const stackTop = clamp(idealTop, topBound, Math.max(topBound, botBound - totalStackH));

  const titleY = stackTop + titlePx * 0.5;
  const subY = titleY + gapTitleSub;
  const dividerY = subY + gapSubRule;
  const discY = dividerY + gapRuleDisc;
  const discX = axisX;
  const bodyStartY = discY + gapDiscBody + bodyPx * 0.45;

  // 为每一行算出真实的 startX / endX / inkCenterX
  const colLeft = axisX - measurePx / 2;
  const colRight = axisX + measurePx / 2;
  const lines = rawLines.map((text, idx) => {
    const rawW = measureBody(text);
    const punctShift = trailingPunctOpticalShift(text, bodyPx, measureBody);
    const inkW = Math.max(4, rawW - punctShift);

    let startX;
    if (state.align === "left") {
      startX = colLeft;
    } else if (state.align === "right") {
      startX = colRight - rawW + (state.opticalPunct ? punctShift : 0);
    } else if (state.align === "justify") {
      startX = colLeft;
    } else {
      // center: 关闭标点光学悬出时按机械框居中（墨色重心偏左 punctShift/2）；开启后向右补偿使墨色居中
      const comp = state.opticalPunct ? punctShift * 0.5 : 0;
      startX = axisX - rawW * 0.5 + comp;
    }

    const drawnW = state.align === "justify" && idx < rawLines.length - 1 ? measurePx : rawW;
    const endX = startX + drawnW;
    const inkCenterX = startX + inkW * 0.5;
    const y = bodyStartY + idx * bodyLeading;
    const nonPunctChars = [...text.replace(/[。，、；：！？》」』）】\s.,!?:;]/g, "")].length;
    const bodyPart = punctShift > 0 ? text.slice(0, -1) : text;
    const punctPart = punctShift > 0 ? text.slice(-1) : "";
    const bodyPartW = punctShift > 0 ? measureBody(bodyPart) : rawW;

    return {
      index: idx,
      text,
      bodyPart,
      punctPart,
      bodyPartW,
      rawW,
      inkW,
      drawnW,
      punctShift,
      startX,
      endX,
      inkCenterX,
      y,
      nonPunctChars,
    };
  });

  // 实测指标（全部从 lines 与几何直接算出）
  const lineCount = lines.length;
  const widths = lines.map((l) => l.drawnW);
  const maxLineW = Math.max(1, ...widths);
  const minLineW = Math.min(...widths);
  const lastLine = lines[lineCount - 1];
  const lastLineRatio = lastLine ? lastLine.rawW / maxLineW : 1;
  const hasOrphan = lineCount >= 2 && lastLine && (lastLine.nonPunctChars <= 2 || lastLineRatio < 0.30);

  const startXs = lines.map((l) => l.startX);
  const startXSpread = lineCount >= 2 ? Math.max(...startXs) - Math.min(...startXs) : 0;

  // 回扫跳转差异（相邻两行起笔 X 差值均值）
  let sweepJitterSum = 0;
  for (let i = 1; i < lines.length; i++) {
    sweepJitterSum += Math.abs(lines[i].startX - lines[i - 1].startX);
  }
  const avgSweepJitter = lineCount >= 2 ? sweepJitterSum / (lineCount - 1) : 0;

  // 标点拉偏：找全段中最大的单行未补偿标点偏移
  const maxPunctShift = lines.reduce((m, l) => Math.max(m, l.punctShift), 0);
  const punctPullPx = state.opticalPunct ? 0 : maxPunctShift * 0.5;

  // 实际墨心相对页面真正中线的偏差
  const avgInkCenterX = lines.length
    ? lines.reduce((s, l) => s + l.inkCenterX, 0) / lines.length
    : axisX;
  const inkDeviationPx = avgInkCenterX - trueMidX;

  // 判断当前标题或正文是否越界/顶撞画布
  const titleTop = titleY - titlePx * 0.65;
  const bodyBottom = lines.length ? lines[lines.length - 1].y + bodyPx * 0.5 : discY + ring2R;
  const titleTooBig = state.scaleRatio > 2.85 || titleW > innerW * 0.96;
  const topCrushed = state.centerY < 0.37 || titleTop < 14;

  // 轮廓剪影分类（供读数与面板显示）
  let silhouetteLabel = "均衡双行";
  if (state.align !== "center") {
    silhouetteLabel = state.align === "left" ? "左齐右参差" : state.align === "right" ? "右齐左参差" : "硬拉两端齐";
  } else if (hasOrphan) {
    silhouetteLabel = "孤字吊尾";
  } else if (lineCount > 4) {
    silhouetteLabel = "长段锯齿";
  } else if (state.measure < 0.40) {
    silhouetteLabel = "窄柱碎行";
  } else if (lineCount === 2) {
    silhouetteLabel = widths[0] >= widths[1] * 1.08 ? "倒梯形收束" : "均衡双行";
  } else if (lineCount === 3) {
    if (widths[0] >= widths[1] && widths[1] >= widths[2]) silhouetteLabel = "古典倒金字塔";
    else if (widths[1] >= widths[0] && widths[1] >= widths[2]) silhouetteLabel = "饱满菱形";
    else silhouetteLabel = "舒展三行";
  } else if (lineCount === 4) {
    const midAvg = (widths[1] + widths[2]) * 0.5;
    const edgeAvg = (widths[0] + widths[3]) * 0.5;
    silhouetteLabel = midAvg >= edgeAvg * 1.04 ? "花瓶菱形" : "四行阶梯";
  }

  return {
    spec,
    width,
    height,
    compact,
    padX,
    innerW,
    typographicMaxW,
    trueMidX,
    axisX,
    colLeft,
    colRight,
    measurePx,
    bodyPx,
    titlePx,
    subPx,
    titleW,
    subW,
    titleY,
    subY,
    dividerY,
    discX,
    discY,
    discR,
    ring1R,
    ring2R,
    bodyStartY,
    bodyLeading,
    bodyBottom,
    lines,
    metrics: {
      lineCount,
      maxLineW,
      minLineW,
      lastLineRatio,
      lastLineText: lastLine ? lastLine.text : "",
      lastLineChars: lastLine ? lastLine.nonPunctChars : 0,
      hasOrphan,
      startXSpread,
      avgSweepJitter,
      punctPullPx,
      inkDeviationPx,
      axisOffsetPct: Math.round(state.axisOffset * 100),
      centerYPct: Math.round(state.centerY * 100),
      liftPct: Math.round((0.5 - state.centerY) * 100),
      scaleRatio: +state.scaleRatio.toFixed(2),
      measurePct: Math.round(state.measure * 100),
      titleTooBig,
      topCrushed,
      silhouetteLabel,
    },
  };
}

// 双向 10 类错态 + 4 柱单真源审计
export function auditLayout(layout, state) {
  const m = layout.metrics;
  const issues = [];

  // 柱 1：中心（中轴偏离 / 几何下坠 / 顶压窒息 / 标点拉偏）
  let axisOk = true;
  let axisTag = `上提 ${m.liftPct >= 0 ? "+" : ""}${m.liftPct}%`;
  if (Math.abs(state.axisOffset) > 0.032) {
    axisOk = false;
    const dir = state.axisOffset > 0 ? "偏右" : "偏左";
    axisTag = `脱轴 ${dir} ${Math.abs(m.axisOffsetPct)}%`;
    issues.push({
      pillar: "axis",
      code: "off_axis",
      short: `脱轴 ${Math.abs(m.axisOffsetPct)}%`,
      title: `整组居中轴线${dir}了 ${Math.abs(m.axisOffsetPct)}%，左右留白一紧一松`,
      why: `居中排版靠两侧等宽留白制造静止感；一旦垂直铅垂轴偏移画幅中心，眼睛会立刻察觉两侧失衡，仪式感随之倾斜。`,
      fix: `水平拖回中央蜜桃圆盘（或按 ← / → 键），把中轴重新咬死在 50% 铅垂线上。`,
    });
  } else if (state.centerY > 0.495) {
    axisOk = false;
    axisTag = `下坠 ${m.centerYPct}%`;
    issues.push({
      pillar: "axis",
      code: "geo_sink",
      short: `几何下坠 ${m.centerYPct}%`,
      title: `焦点沉在画面 ${m.centerYPct}% 处，视觉明显往下坠`,
      why: `由于人眼的视觉重力效应，严格摆在几何 50% 或更低位置的圆与文字会显得下沉拖沓；经典扉页通常把视觉中心上提至约 42%–48%（经验值）。`,
      fix: `向上拖动中央蜜桃圆盘，或把「视觉中心 Y」调到 42%–48% 区间。`,
    });
  } else if (m.topCrushed) {
    axisOk = false;
    axisTag = `顶压 ${m.centerYPct}%`;
    issues.push({
      pillar: "axis",
      code: "top_crush",
      short: `顶压 ${m.centerYPct}%`,
      title: `焦点抬得太高（${m.centerYPct}%），主标题快顶穿天头`,
      why: `视觉中心需要微幅上提，但过度上提会挤光上方呼吸空间，让整张碑帖失去端庄悬停的气度。`,
      fix: `稍微向下拉动蜜桃圆盘，把视觉中心回到 42%–48% 的从容区间。`,
    });
  } else if (m.punctPullPx >= 2.8 && state.align === "center") {
    axisOk = false;
    axisTag = `标点拉偏 ${m.punctPullPx.toFixed(1)}px`;
    issues.push({
      pillar: "axis",
      code: "punct_pull",
      short: `标点拉偏`,
      title: `句末全角标点把视觉墨心悄悄拽偏了 ${m.punctPullPx.toFixed(1)}px`,
      why: `中文全角句号「。」右侧自带半格空白，机械框居中会把这段隐形空白算进文字宽度，导致真正的笔画重心偏左。`,
      fix: `打开下方「标点光学悬出」开关，把全角标点微幅探出框外，让墨色重心锁回中轴。`,
    });
  }

  // 柱 2：聚焦 / 剪影（非居中 / 孤字吊尾 / 过窄碎行 / 过宽撞边）
  let contourOk = true;
  let contourTag = m.silhouetteLabel;
  if (state.align !== "center") {
    contourOk = false;
    const alignName = state.align === "left" ? "左对齐" : state.align === "right" ? "右对齐" : "两端对齐";
    contourTag = `误用${alignName}`;
    issues.push({
      pillar: "contour",
      code: "not_center",
      short: `误切${alignName}`,
      title: `当前处于「${alignName}」，中轴对称结构已经解体`,
      why: `文字一脱离中轴，蜜桃圆盘和上下铅垂线就变成孤悬的装饰，不再和文字共同锁住视觉焦点。`,
      fix: `把对齐方式切回「居中」，让每一行的中点重新归位到铅垂线上。`,
    });
  } else if (m.hasOrphan) {
    contourOk = false;
    contourTag = `孤尾「${m.lastLineText}」`;
    issues.push({
      pillar: "contour",
      code: "orphan",
      short: `孤字吊尾`,
      title: `末行只孤零零吊着「${m.lastLineText}」，双翼剪影收尾塌陷`,
      why: `居中排版没有统一左边线，读者靠整块文字的外部轮廓感知秩序；末尾突然掉出一两个孤字，会让对称形状像断了脚的碑铭。`,
      fix: `直接点击画布里的末行文字手修断行，或左右横拖画布微调栏宽，把孤字收进舒展的轮廓里。`,
    });
  } else if (state.measure < 0.40) {
    contourOk = false;
    contourTag = `栏宽过窄 ${m.measurePct}%`;
    issues.push({
      pillar: "contour",
      code: "too_narrow",
      short: `过窄碎行`,
      title: `栏宽缩到 ${m.measurePct}%，短句被切得零碎局促`,
      why: `过窄的居中栏宽把完整词组硬生生折断，读者刚起眼就被迫频繁折返下一行。`,
      fix: `向右横拖画布或拉宽「栏宽塑形」至 45%–80%，让每行承载自然语意。`,
    });
  } else if (state.measure > 0.84) {
    contourOk = false;
    contourTag = `逼近版边 ${m.measurePct}%`;
    issues.push({
      pillar: "contour",
      code: "too_wide",
      short: `贴边失气`,
      title: `栏宽撑到 ${m.measurePct}%，两侧几乎失去衬托留白`,
      why: `居中排版需要左右对称的安静留白来托起中心焦点；行宽一顶到画幅边缘，居中感就会退化成普通通栏。`,
      fix: `向左微收栏宽至 45%–80%，给双翼留出匀称的呼吸边距。`,
    });
  }

  // 柱 3：层级（塌平 / 巨标压溃）
  let hierOk = true;
  let hierTag = `字号比 ${m.scaleRatio.toFixed(2)}×`;
  if (state.scaleRatio < 1.70) {
    hierOk = false;
    hierTag = `塌平 ${m.scaleRatio.toFixed(2)}×`;
    issues.push({
      pillar: "hierarchy",
      code: "flat_hier",
      short: `层级塌平`,
      title: `主标题与正文仅差 ${m.scaleRatio.toFixed(2)}×，整版平得看不出焦点`,
      why: `失去左齐边线的引导后，居中版面更依赖主次字号与疏密阶梯来建立阅读顺位；比例不足 1.7× 时，第一眼无处落脚。`,
      fix: `把「主次字号比」推到 1.8×–2.6×，让主标题先声夺人、副标与正文顺势退后。`,
    });
  } else if (m.titleTooBig) {
    hierOk = false;
    hierTag = `过巨 ${m.scaleRatio.toFixed(2)}×`;
    issues.push({
      pillar: "hierarchy",
      code: "over_scale",
      short: `巨标压溃`,
      title: `主标题比例拉到 ${m.scaleRatio.toFixed(2)}×，压挤副标与圆环`,
      why: `标题过大挤压上下气口，破坏居中版面赖以成立的从容秩序与留白节奏。`,
      fix: `把「主次字号比」收回到 1.8×–2.6× 之间。`,
    });
  }

  // 柱 4：稳定 / 行数闸门（长文回扫失锚）
  let lengthOk = true;
  let lengthTag = `${m.lineCount} 行 · 稳读`;
  if (m.lineCount > 4) {
    lengthOk = false;
    lengthTag = `${m.lineCount} 行 · 过载`;
    issues.push({
      pillar: "length",
      code: "too_long",
      short: `${m.lineCount} 行过载`,
      title: `居中正文堆到 ${m.lineCount} 行，起笔左右离散 ${Math.round(m.startXSpread)}px`,
      why: `每行居中文字的左端起点都在变化。短于 4 行时大脑把文字当一枚整体徽章来读；超过 4 行后，视线每读完一行回扫都得重新找起点，速度与耐性直线下降。`,
      fix: `把「正文行数」压回到 2–4 行（按 Space 可放飞视线光束，对比 ${m.lineCount} 行与 2 行的回扫差异）。`,
    });
  }

  const passedCount = [axisOk, contourOk, hierOk, lengthOk].filter(Boolean).length;
  const ok = passedCount === 4;

  // 确定当前最优先提示（按影响视觉最直观的顺序）
  const priorityOrder = ["not_center", "too_long", "orphan", "off_axis", "geo_sink", "top_crush", "flat_hier", "over_scale", "too_narrow", "too_wide", "punct_pull"];
  issues.sort((a, b) => priorityOrder.indexOf(a.code) - priorityOrder.indexOf(b.code));
  const primary = issues[0] || null;

  // 秩序档位（不报假精确百分比，用定性档位 + 标「示意」）
  let poiseGrade = "失锚散架（示意）";
  if (ok) poiseGrade = m.lineCount <= 2 ? "碑铭稳立（示意）" : "扉页端庄（示意）";
  else if (passedCount === 3) poiseGrade = "差临门一脚（示意）";
  else if (passedCount === 2) poiseGrade = "半稳半斜（示意）";

  const badge = ok ? `4/4 · ${m.silhouetteLabel}` : `${passedCount}/4 · ${primary.short}`;
  const headline = ok
    ? `中轴咬稳：${m.silhouetteLabel}（${m.lineCount} 行 · 视觉中心 ${m.centerYPct}%）`
    : primary.title;
  const detail = ok
    ? `垂直视觉中心微幅上提 ${m.liftPct}% 抵消下坠感，${m.lineCount} 行短句形成干净的「${m.silhouetteLabel}」双翼轮廓，主次 ${m.scaleRatio.toFixed(2)}× 层次分明，按 Space 可看视线从容落位。`
    : primary.why;
  const action = ok
    ? `还可以切换上方「古典漏斗解 / 菱形请柬解」或改换展册、请柬标本，体会多组合法解。`
    : primary.fix;

  return {
    ok,
    passedCount,
    poiseGrade,
    badge,
    headline,
    detail,
    action,
    issues,
    pillars: {
      axis: { ok: axisOk, tag: axisTag },
      contour: { ok: contourOk, tag: contourTag },
      hierarchy: { ok: hierOk, tag: hierTag },
      length: { ok: lengthOk, tag: lengthTag },
    },
  };
}

// ---------- 第 04 节：手修断行剪刀塑形器模型 ----------
export const SCULPT_TOKENS = [
  "秋季",
  "器物",
  "雕塑",
  "年展",
  "·",
  "以",
  "静默",
  "中轴",
  "回应",
  "空间",
  "与",
  "秩序",
];

// 默认故意设成一个不理想的分断（尾行留孤词「秩序」），让用户自己点剪口修整
export const SCULPT_INIT_BREAKS = new Set([10]);

export function evaluateSculpt(breaksSet) {
  const lines = [];
  let buf = "";
  for (let i = 0; i < SCULPT_TOKENS.length; i++) {
    buf += SCULPT_TOKENS[i];
    if (breaksSet.has(i) && i < SCULPT_TOKENS.length - 1) {
      lines.push(buf);
      buf = "";
    }
  }
  if (buf) lines.push(buf);

  const lens = lines.map((s) => [...s].length);
  const maxL = Math.max(...lens);
  const lastL = lens[lens.length - 1];
  const n = lines.length;

  let kind = "均衡轮廓";
  let ok = true;
  let note = "行长过渡自然，左右留白相互呼应。";

  if (n === 1) {
    kind = "单行通条";
    ok = false;
    note = `全挤在一条线上（${lens[0]} 字），缺少居中块面的停顿与层次；试着在「·」后点开一刀。`;
  } else if (lastL <= 2 || lastL / maxL < 0.25) {
    kind = "孤字吊尾";
    ok = false;
    note = `末行仅剩「${lines[n - 1]}」（${lastL} 字），在居中轮廓底部显得孤立悬空；把上一刀往前挪两词试试。`;
  } else if (n >= 5) {
    kind = "过碎长柱";
    ok = false;
    note = `被切成了 ${n} 条碎行，读完一句短副标要折返 ${n - 1} 次，反而失去凝练感。`;
  } else if (n === 2) {
    if (lens[0] >= lens[1] * 1.15 && lens[1] >= 5) {
      kind = "倒梯形 · 经典稳重";
      note = `上宽（${lens[0]} 字）下收（${lens[1]} 字），视线自然向中心下方汇拢，是最耐看的碑帖轮廓。`;
    } else if (lens[1] > lens[0] * 1.35) {
      kind = "上尖下宽 · 略显底沉";
      ok = false;
      note = `首行过短（${lens[0]} 字）而底行过长（${lens[1]} 字），视觉像压扁的三角锥，调匀两行更稳。`;
    } else {
      kind = "均衡双行 · 利落";
      note = `两行长度相近（${lens[0]} / ${lens[1]} 字），干净利落，接近现代 CSS text-wrap: balance 的效果。`;
    }
  } else if (n === 3) {
    if (lens[0] > lens[1] && lens[1] >= lens[2]) {
      kind = "古典倒金字塔 · 漏斗式";
      note = `逐行收束（${lens.join(" → ")} 字），源自文艺复兴雕版尾题的经典居中造型。`;
    } else if (lens[1] >= lens[0] && lens[1] >= lens[2]) {
      kind = "菱形花瓶 · 饱满端庄";
      note = `中腹舒展、两头微收（${lens.join(" / ")} 字），非常适合请柬与诗歌扉页。`;
    } else {
      kind = "三行韵律 · 清晰";
      note = `三行按语义自然分段（${lens.join(" / ")} 字），节奏从容、没有孤字。`;
    }
  } else {
    kind = "四行请柬 · 疏朗";
    note = `四行长短错落有致（${lens.join(" / ")} 字），仍处在居中易读的安全阈值内。`;
  }

  return { lines, lens, kind, ok, note };
}
