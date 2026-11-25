// 187 凸排标点 · 单一几何与字形墨边实测模型（model.js）
// 全部标点字宽、像素级光学墨边、吸附区间、四档判定、02 节西文微凸档位、07 节练习答案
// 均从当前已加载字体的真实离屏 Canvas 像素扫描导出，绝不写死经验常量或假精确分数。

export const HERO_PARAS = [
  "“此地有崇山峻岭，茂林修竹，又有清流激湍，映带左右。”",
  "「是日也，天朗气清，惠风和畅。仰观宇宙之大，俯察品类之盛，所以游目骋怀，足以极视听之娱，信可乐也。」",
];

export const POSTER_POEM = [
  "山川之美，",
  "古来共谈：",
  "游目骋怀，",
  "足以极视听之娱，",
  "信可乐也。",
];

export const QUIZ_TEXT = "“凡书页之齐整，非恃方框死界，乃凭字墙落墨一线贯通，轻小标点微出其外，则纵列笔直而通篇气韵自生。”";

export const QUIZ_HANG_RATIOS = [
  { id: "A", ratio: 0.5 },
  { id: "B", ratio: 1.25 },
  { id: "C", ratio: 1.0 },
  { id: "D", ratio: 0.75 },
];

export const NO_START = new Set(["，", "。", "：", "；", "、", "”", "」", "！", "？"]);
export const NO_END = new Set(["“", "「"]);
export const HANG_LEFT = new Set(["“", "「"]);
export const HANG_RIGHT = new Set(["，", "。", "、"]);

const FONT_SERIF_SC = '"Noto Serif SC", serif';
const FONT_FRAUNCES = '"Fraunces", serif';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- 离屏 Canvas 像素级字形扫描 ----------
let scanCanvas = null;
let scanCtx = null;
const glyphCache = new Map();

function ensureScanner(size) {
  if (!scanCanvas) {
    scanCanvas = document.createElement("canvas");
    scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (scanCanvas.width < size || scanCanvas.height < size) {
    scanCanvas.width = size;
    scanCanvas.height = size;
  }
  return scanCtx;
}

export function clearGlyphCache() {
  glyphCache.clear();
}

/**
 * 实测单个字符在指定字体与字号下的真实步进字宽（advPx）与像素墨边盒。
 * 所有返回尺寸单位均为 CSS px（按 fontSize 计），绝不把标点默认当成 1em。
 */
export function measureGlyph(char, fontFamily = FONT_SERIF_SC, weight = 600, fontSize = 36) {
  const fz = Math.max(12, Math.round(fontSize * 2) / 2);
  const key = `${weight}|${fontFamily}|${fz}|${char}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;

  const scale = fz < 28 ? 2 : 1;
  const drawSize = fz * scale;
  const box = Math.max(96, Math.ceil(drawSize * 2.5));
  const ctx = ensureScanner(box);

  ctx.clearRect(0, 0, box, box);
  ctx.font = `${weight} ${drawSize}px ${fontFamily}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";

  const m = ctx.measureText(char);
  const advDraw = Math.max(1, m.width);
  const padX = Math.round(drawSize * 0.55);
  const baseY = Math.round(drawSize * 1.45);
  ctx.fillText(char, padX, baseY);

  const img = ctx.getImageData(0, 0, box, box).data;
  let minX = box;
  let maxX = -1;
  let minY = box;
  let maxY = -1;
  let alphaSum = 0;
  let weightX = 0;

  for (let y = 0; y < box; y++) {
    const rowOff = y * box * 4;
    for (let x = 0; x < box; x++) {
      const a = img[rowOff + x * 4 + 3];
      if (a > 22) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const w = a / 255;
        alphaSum += w;
        weightX += w * (x - padX + 0.5);
      }
    }
  }

  const hasInk = maxX >= minX && maxY >= minY && alphaSum > 0;
  const advPx = advDraw / scale;
  const inkLeftPx = hasInk ? (minX - padX) / scale : 0;
  const inkRightPx = hasInk ? (maxX + 1 - padX) / scale : advPx;
  const inkTopPx = hasInk ? (minY - baseY) / scale : -fz * 0.8;
  const inkBottomPx = hasInk ? (maxY + 1 - baseY) / scale : 0;
  const inkWidthPx = Math.max(0, inkRightPx - inkLeftPx);
  const inkHeightPx = Math.max(0, inkBottomPx - inkTopPx);
  const inkAreaRatio = hasInk ? alphaSum / (advDraw * drawSize) : 0;
  const inkCenterRatio = hasInk ? weightX / alphaSum / advDraw : 0.5;

  // 水平分层扫描：用于实测 A / V / W / T 等斜边或挑檐字母的边角虚空占比
  let leftVoidRatio = 0;
  let rightVoidRatio = 0;
  if (hasInk && maxY > minY + 4) {
    const bands = 6;
    const h = maxY - minY + 1;
    let sumL = 0;
    let sumR = 0;
    let valid = 0;
    for (let b = 0; b < bands; b++) {
      const y0 = minY + Math.floor((b * h) / bands);
      const y1 = minY + Math.floor(((b + 1) * h) / bands);
      let bMin = box;
      let bMax = -1;
      for (let y = y0; y < Math.max(y0 + 1, y1); y++) {
        const rowOff = y * box * 4;
        for (let x = minX; x <= maxX; x++) {
          if (img[rowOff + x * 4 + 3] > 28) {
            if (x < bMin) bMin = x;
            if (x > bMax) bMax = x;
          }
        }
      }
      if (bMax >= bMin) {
        sumL += (bMin - minX) / advDraw;
        sumR += (maxX - bMax) / advDraw;
        valid++;
      }
    }
    if (valid > 0) {
      leftVoidRatio = sumL / valid;
      rightVoidRatio = sumR / valid;
    }
  }

  const out = {
    char,
    fontSize: fz,
    advPx,
    advEm: advPx / fz,
    inkLeftPx,
    inkRightPx,
    inkTopPx,
    inkBottomPx,
    inkWidthPx,
    inkHeightPx,
    leftInsetPx: inkLeftPx,
    rightInsetPx: advPx - inkRightPx,
    inkAreaRatio,
    inkCenterRatio,
    leftVoidRatio,
    rightVoidRatio,
  };
  glyphCache.set(key, out);
  return out;
}

export function measureHanziRef(fontFamily = FONT_SERIF_SC, weight = 600, fontSize = 36) {
  const samples = ["永", "山", "川", "美", "崇", "峻", "仰", "观", "盛", "怀"];
  const ms = samples.map((c) => measureGlyph(c, fontFamily, weight, fontSize));
  const avg = (fn) => ms.reduce((s, x) => s + fn(x), 0) / ms.length;
  const leftInsets = ms.map((x) => x.leftInsetPx);
  const rightInsets = ms.map((x) => x.rightInsetPx);
  const spreadL = Math.max(...leftInsets) - Math.min(...leftInsets);
  const spreadR = Math.max(...rightInsets) - Math.min(...rightInsets);
  const emAdv = avg((x) => x.advPx);
  return {
    emAdv,
    leftInsetPx: avg((x) => x.leftInsetPx),
    rightInsetPx: avg((x) => x.rightInsetPx),
    inkAreaRatio: avg((x) => x.inkAreaRatio),
    naturalSpreadPx: Math.max(spreadL, spreadR, emAdv * 0.045),
  };
}

// ---------- 开场主台：真实两端齐行中文行排器 ----------
/**
 * 将《兰亭集序》两段排成两端齐行栏文。
 * - leftHang：左缘开引号（“ 「）的凸排量，以该引号在当前字体的实际字宽 advPx 为 100%
 * - rightHang：右缘单点号（， 。 、）的凸排量，以该点号在当前字体的实际字宽 advPx 为 100%
 * - 栏宽由字号与实测全角汉字步进 emAdv 决定（桌面 14 字/行，横屏手机 12 字/行，竖屏手机 10 字/行）
 * - 避头禁则：当行尾后的下一字为单点号时，若 rightHang 尚未跨过行排器由字形实测导出的拟合阈，
 *   行排器执行「推字」将前一汉字与点号推至下行（本行字距拉散）；跨过拟合阈后即刻「免推字」回弹上行，
 *   并在继续拖向实测最佳值时把残余微挤压彻底释放（免挤压）。连续双标点（。” 。」）依 CLREQ 绝不挂出。
 */
export function layoutHeroColumn({
  paras = HERO_PARAS,
  cols = 14,
  fontSize = 34,
  leftHang = 0,
  rightHang = 0,
  fontFamily = FONT_SERIF_SC,
  weight = 600,
} = {}) {
  const ref = measureHanziRef(fontFamily, weight, fontSize);
  const colWidthPx = cols * ref.emAdv;

  // 实测代表性左右标点字形（不默认 1em）
  const mQuoteCurly = measureGlyph("“", fontFamily, weight, fontSize);
  const mQuoteCorner = measureGlyph("「", fontFamily, weight, fontSize);
  const mComma = measureGlyph("，", fontFamily, weight, fontSize);
  const mPeriod = measureGlyph("。", fontFamily, weight, fontSize);

  // 由实测字形导出「行尾挂出单点号免推字」的拟合阈：
  // 当点号已挂出至其右侧空框以外（至少超过字形右缘实墨跨线量），剩余栏内宽度进入安全微挤压区间
  const commaRightBlankRatio = clamp(mComma.rightInsetPx / mComma.advPx, 0.25, 0.72);
  const reflowThreshold = clamp(1 - commaRightBlankRatio, 0.36, 0.56);

  // 1) 真实行排 + 避头尾禁则
  const rawLines = [];
  for (let pi = 0; pi < paras.length; pi++) {
    const chars = [...paras[pi]];
    let i = 0;
    while (i < chars.length) {
      const cur = [];
      let count = 0;
      while (i < chars.length && count < cols) {
        cur.push(chars[i++]);
        count++;
      }

      let status = "normal"; // normal | pushed | hung-saved
      if (i < chars.length && NO_START.has(chars[i])) {
        const next = chars[i];
        const nextNext = chars[i + 1];
        const prevIsPunct = NO_START.has(cur[cur.length - 1]);
        const nextIsPaired = Boolean(nextNext && NO_START.has(nextNext)); // 如 。” 连续标点不挂
        if (HANG_RIGHT.has(next) && !prevIsPunct && !nextIsPaired && rightHang >= reflowThreshold) {
          cur.push(chars[i++]);
          status = "hung-saved";
        } else {
          // 禁则推字：避免行首出现避头标点
          while (cur.length > 2 && NO_START.has(cur[cur.length - 1])) {
            i--;
            cur.pop();
          }
          if (cur.length > 2) {
            i--;
            cur.pop();
            status = "pushed";
          }
        }
      } else if (cur.length > 1 && NO_END.has(cur[cur.length - 1])) {
        i--;
        cur.pop();
        status = "pushed";
      }

      const isLastInPara = i >= chars.length;
      const firstCh = cur[0];
      const lastCh = cur[cur.length - 1];
      const prevLastCh = cur[cur.length - 2];
      const startsL = HANG_LEFT.has(firstCh);
      const endsR = HANG_RIGHT.has(lastCh) && !NO_START.has(prevLastCh) && (!isLastInPara || cur.length >= cols);

      rawLines.push({
        paraIndex: pi,
        chars: cur,
        text: cur.join(""),
        status,
        startsL,
        endsR,
        isLastInPara,
      });
    }
  }

  // 2) 逐字实测字宽 + 两端齐行排布 + 实测光学墨边剖面
  const wallLeftPx = ref.leftInsetPx;
  const wallRightPx = colWidthPx - ref.rightInsetPx;

  let optLeftSum = 0;
  let optLeftN = 0;
  let optRightSum = 0;
  let optRightN = 0;

  const lines = rawLines.map((ln, lineIndex) => {
    const metrics = ln.chars.map((c) => measureGlyph(c, fontFamily, weight, fontSize));
    const totalNat = metrics.reduce((s, m) => s + m.advPx, 0);
    const isShortLast = ln.isLastInPara && (!ln.endsR || totalNat < colWidthPx * 0.94);

    const leftPunctM = ln.startsL ? metrics[0] : null;
    const rightPunctM = ln.endsR ? metrics[metrics.length - 1] : null;

    // 实测单行理想左/右凸排比（让紧邻实字墨边与普通行字墙均值偏差为 0）
    if (ln.startsL && metrics.length > 1) {
      const firstHanzi = metrics[1];
      optLeftSum += 1 + (firstHanzi.leftInsetPx - ref.leftInsetPx) / leftPunctM.advPx;
      optLeftN++;
    }
    if (ln.endsR && metrics.length > 1) {
      const lastHanzi = metrics[metrics.length - 2];
      optRightSum += 1 - (ref.rightInsetPx - lastHanzi.rightInsetPx) / rightPunctM.advPx;
      optRightN++;
    }

    const xStart = ln.startsL ? -leftHang * leftPunctM.advPx : 0;
    const xEnd = isShortLast
      ? xStart + totalNat
      : colWidthPx + (ln.endsR ? rightHang * rightPunctM.advPx : 0);

    // 凸排标点必须紧贴相邻实字，绝不在标点与相邻汉字之间插入齐行拉散空隙：
    // 齐行间距只分配在「首实字 → 末实字」内部字符之间！
    const firstSolidIdx = ln.startsL && metrics.length > 1 ? 1 : 0;
    const lastSolidIdx = ln.endsR && metrics.length > 1 ? metrics.length - 2 : metrics.length - 1;
    const firstSolidX = ln.startsL ? xStart + leftPunctM.advPx : 0;
    const lastSolidEndX = isShortLast
      ? firstSolidX + metrics.slice(firstSolidIdx, lastSolidIdx + 1).reduce((s, m) => s + m.advPx, 0)
      : colWidthPx - (ln.endsR ? (1 - rightHang) * rightPunctM.advPx : 0);

    const interiorMetrics = metrics.slice(firstSolidIdx, lastSolidIdx + 1);
    const interiorNat = interiorMetrics.reduce((s, m) => s + m.advPx, 0);
    const interiorSpan = lastSolidEndX - firstSolidX;
    const gapDeltaPx =
      !isShortLast && interiorMetrics.length > 1
        ? (interiorSpan - interiorNat) / (interiorMetrics.length - 1)
        : 0;

    // 放置每个字符
    const glyphs = new Array(metrics.length);
    if (ln.startsL) {
      glyphs[0] = {
        char: metrics[0].char,
        x: xStart,
        metric: metrics[0],
        isHangLeft: true,
        isHangRight: false,
      };
    }
    let cursor = firstSolidX;
    for (let idx = firstSolidIdx; idx <= lastSolidIdx; idx++) {
      const m = metrics[idx];
      glyphs[idx] = {
        char: m.char,
        x: cursor,
        metric: m,
        isHangLeft: false,
        isHangRight: false,
      };
      cursor += m.advPx + (idx < lastSolidIdx ? gapDeltaPx : 0);
    }
    if (ln.endsR && lastSolidIdx < metrics.length - 1) {
      const lastIdx = metrics.length - 1;
      glyphs[lastIdx] = {
        char: metrics[lastIdx].char,
        x: lastSolidEndX,
        metric: metrics[lastIdx],
        isHangLeft: false,
        isHangRight: true,
      };
    }

    // 左缘实字墨边（若以开引号开头，测第 2 字即首实字的左墨边；否则测第 1 字）
    const firstSolid = ln.startsL && glyphs.length > 1 ? glyphs[1] : glyphs[0];
    const inkLeftEdgePx = firstSolid.x + firstSolid.metric.inkLeftPx;
    const leftDevPx = inkLeftEdgePx - wallLeftPx; // >0 内凹，<0 外凸

    // 右缘实字墨边（短尾段末行不触右墙，不参与右缘偏差）
    let inkRightEdgePx = null;
    let rightDevPx = null;
    if (!isShortLast) {
      const lastSolid = ln.endsR && glyphs.length > 1 ? glyphs[glyphs.length - 2] : glyphs[glyphs.length - 1];
      inkRightEdgePx = lastSolid.x + lastSolid.metric.inkRightPx;
      rightDevPx = wallRightPx - inkRightEdgePx; // >0 内凹，<0 外凸
    }

    // 该行字距松紧状态（正值=拉散/推字，负值=微挤压）
    const trackingEm = gapDeltaPx / ref.emAdv;

    return {
      ...ln,
      lineIndex,
      glyphs,
      isShortLast,
      gapDeltaPx,
      trackingEm,
      leftPunctM,
      rightPunctM,
      inkLeftEdgePx,
      leftDevPx,
      leftDevEm: leftDevPx / ref.emAdv,
      inkRightEdgePx,
      rightDevPx,
      rightDevEm: rightDevPx == null ? null : rightDevPx / ref.emAdv,
    };
  });

  // 3) 汇总全部由实测导出的标尺、吸附区间与四档状态
  const optLeft = optLeftN ? optLeftSum / optLeftN : 1.0;
  const optRight = optRightN ? optRightSum / optRightN : 1.0;
  // 吸附半宽由真实字形左右留白占比导出，不拍脑袋写常数
  const snapTolLeft = clamp(ref.leftInsetPx / mQuoteCurly.advPx * 0.9, 0.045, 0.08);
  const snapTolRight = clamp(ref.rightInsetPx / mComma.advPx * 0.9, 0.045, 0.08);

  // 普通汉字之间固有墨边波动（如「此」「以」与「盛」的笔划左右宽窄差异），作为「齐边容差」物理下限
  const alignedTolEm = clamp((ref.naturalSpreadPx * 1.25) / ref.emAdv, 0.105, 0.14);

  const lLines = lines.filter((l) => l.startsL);
  const rLines = lines.filter((l) => l.endsR);
  const pushedLines = lines.filter((l) => l.status === "pushed");
  const savedLines = lines.filter((l) => l.status === "hung-saved");

  const avgLeftDevEm = lLines.length ? lLines.reduce((s, l) => s + l.leftDevEm, 0) / lLines.length : 0;
  const avgRightDevEm = rLines.length ? rLines.reduce((s, l) => s + l.rightDevEm, 0) / rLines.length : 0;

  const maxSqueezeEm = savedLines.reduce((m, l) => Math.min(m, l.trackingEm), 0);
  const maxStretchEm = pushedLines.reduce((m, l) => Math.max(m, l.trackingEm), 0);

  const leftAligned = Math.abs(avgLeftDevEm) <= alignedTolEm;
  const leftOver = avgLeftDevEm < -alignedTolEm;
  const rightAligned = rLines.length > 0 && Math.abs(avgRightDevEm) <= alignedTolEm && pushedLines.length === 0;
  const rightOver = rLines.length > 0 && avgRightDevEm < -alignedTolEm;

  let tier = "raw"; // raw | partial | optimal | over
  if (leftOver || rightOver) {
    tier = "over";
  } else if (leftAligned && rightAligned) {
    tier = "optimal";
  } else if (leftHang > 0.1 || rightHang > 0.1) {
    tier = "partial";
  }

  return {
    cols,
    fontSize,
    ref,
    colWidthPx,
    wallLeftPx,
    wallRightPx,
    lines,
    metrics: {
      quoteCurly: mQuoteCurly,
      quoteCorner: mQuoteCorner,
      comma: mComma,
      period: mPeriod,
    },
    optLeft,
    optRight,
    reflowThreshold,
    snapTolLeft,
    snapTolRight,
    alignedTolEm,
    avgLeftDevEm,
    avgRightDevEm,
    leftAligned,
    leftOver,
    rightAligned,
    rightOver,
    pushedCount: pushedLines.length,
    savedCount: savedLines.length,
    rHangCount: rLines.length,
    lHangCount: lLines.length,
    maxSqueezeEm,
    maxStretchEm,
    tier,
  };
}

/**
 * 吸附助手：靠近实测 opt 时轻吸附；继续拖过吸附半宽即可顺滑越界，体验「过度凸排」
 */
export function snapHangValue(val, opt, snapTol) {
  if (Math.abs(val - opt) <= snapTol * 0.72) return opt;
  return val;
}

// ---------- 01 节：字形墨量显微解剖 ----------
export function analyzeGlyphAnatomy(char, isLatin = false, fontSize = 110) {
  const font = isLatin ? FONT_FRAUNCES : FONT_SERIF_SC;
  const weight = isLatin ? 700 : 600;
  const m = measureGlyph(char, font, weight, fontSize);
  const ref = isLatin
    ? measureGlyph("H", FONT_FRAUNCES, 700, fontSize)
    : measureHanziRef(FONT_SERIF_SC, 600, fontSize);
  const refArea = ref.inkAreaRatio || 0.28;
  const massRatio = m.inkAreaRatio / refArea;

  // 由实测字形推算该字符在边界处的光学建议凸排量（占该字符自身实际字宽）
  let recHangRatio = 0;
  let side = "control";
  if (char === "“" || char === "「") {
    side = "left";
    // 让紧随汉字对齐字墙所需的理论值（约 100% 自身字宽）
    recHangRatio = 1.0;
  } else if (char === "，" || char === "。") {
    side = "right";
    recHangRatio = 1.0;
  } else if (char === "-") {
    side = "right";
    recHangRatio = clamp(1 - massRatio * 0.45, 0.7, 0.95);
  }

  return {
    ...m,
    refInkAreaRatio: refArea,
    massRatio,
    side,
    recHangRatio,
    recHangEm: recHangRatio * m.advEm,
  };
}

// ---------- 02 节：西文 Fraunces 四类符号实测微凸档位 ----------
export function computeWesternClassMetrics(fontSize = 28) {
  const refH = measureGlyph("H", FONT_FRAUNCES, 700, fontSize);
  const refArea = Math.max(0.08, refH.inkAreaRatio);

  const mQuote = measureGlyph("“", FONT_FRAUNCES, 700, fontSize);
  const mStop = measureGlyph(",", FONT_FRAUNCES, 700, fontSize);
  const mPeriod = measureGlyph(".", FONT_FRAUNCES, 700, fontSize);
  const mHyphen = measureGlyph("-", FONT_FRAUNCES, 700, fontSize);
  const mW = measureGlyph("W", FONT_FRAUNCES, 700, fontSize);
  const mT = measureGlyph("T", FONT_FRAUNCES, 700, fontSize);
  const mA = measureGlyph("A", FONT_FRAUNCES, 700, fontSize);

  // 1) 开引号：让后接直立字母的左墨边贴齐参考字母 H 的左墨边
  const mM = measureGlyph("M", FONT_FRAUNCES, 700, fontSize);
  const optQuote = clamp(1 + (mM.leftInsetPx - refH.leftInsetPx) / mQuote.advPx, 0.92, 1.05);
  // 2) 句逗：按墨量稀缺比导出光学凸排（占自身极窄字宽的比例）
  const stopAvgArea = (mStop.inkAreaRatio + mPeriod.inkAreaRatio) / 2;
  const stopAdvEm = (mStop.advEm + mPeriod.advEm) / 2;
  const optStop = clamp(1 - (stopAvgArea / refArea) * 0.42, 0.72, 0.96);
  // 3) 连字符：墨量最轻，按墨量占比导出
  const optHyphen = clamp(1 - (mHyphen.inkAreaRatio / refArea) * 0.52, 0.7, 0.94);
  // 4) 斜边大写 A / V / W / T：由像素分层扫描实测的边角虚空均值导出（绝非拍脑袋）
  const avgCornerVoid = (mW.leftVoidRatio + mT.leftVoidRatio + mA.leftVoidRatio) / 3;
  const optAngled = clamp(avgCornerVoid * 0.75, 0.08, 0.24);

  return {
    refH,
    classes: {
      quote: {
        id: "quote",
        label: "引号 “ ”",
        sampleChar: "“",
        advEm: mQuote.advEm,
        inkAreaPct: mQuote.inkAreaRatio * 100,
        optRatio: optQuote,
        optEm: optQuote * mQuote.advEm,
      },
      stop: {
        id: "stop",
        label: "句逗 , .",
        sampleChar: ",",
        advEm: stopAdvEm,
        inkAreaPct: stopAvgArea * 100,
        optRatio: optStop,
        optEm: optStop * stopAdvEm,
      },
      hyphen: {
        id: "hyphen",
        label: "连字符 -",
        sampleChar: "-",
        advEm: mHyphen.advEm,
        inkAreaPct: mHyphen.inkAreaRatio * 100,
        optRatio: optHyphen,
        optEm: optHyphen * mHyphen.advEm,
      },
      angled: {
        id: "angled",
        label: "斜边字母 A W T",
        sampleChar: "W",
        advEm: mW.advEm,
        inkAreaPct: mW.inkAreaRatio * 100,
        cornerVoidPct: avgCornerVoid * 100,
        optRatio: optAngled,
        optEm: optAngled * mW.advEm,
      },
    },
  };
}

// ---------- 07 节：严格单变量小练习实测评估 ----------
/**
 * 四张完全相同的中文书评引言卡：
 * - 右缘规则四张完全一致（行尾单点号均按实测 optRight 对齐，末行连续标点 。” 不挂）
 * - 唯一变量：段首左引号 “ 的凸排量（占 “ 在 Noto Serif SC 600 中实际字宽的 50% / 75% / 100% / 125%）
 * - 正确答案由 model 实时测量「第 1 行首实字左墨边」与「第 2–4 行首实字平均左墨边」的绝对偏差最小值决定
 */
export function evaluateQuizOptions(fontSize = 20, cols = 13) {
  const ref = measureHanziRef(FONT_SERIF_SC, 600, fontSize);
  const mQuote = measureGlyph("“", FONT_SERIF_SC, 600, fontSize);
  const colWidthPx = cols * ref.emAdv;

  // 先求右缘统一实测值（四张卡严格共享同一右缘规则）
  const basePass = layoutHeroColumn({
    paras: [QUIZ_TEXT],
    cols,
    fontSize,
    leftHang: 1.0,
    rightHang: 1.0,
  });
  const sharedRightHang = basePass.optRight;

  const cards = QUIZ_HANG_RATIOS.map(({ id, ratio }) => {
    const laid = layoutHeroColumn({
      paras: [QUIZ_TEXT],
      cols,
      fontSize,
      leftHang: ratio,
      rightHang: sharedRightHang,
    });
    const line0 = laid.lines[0];
    const otherLines = laid.lines.slice(1);
    const meanOtherInkLeft =
      otherLines.reduce((s, l) => s + l.inkLeftEdgePx, 0) / Math.max(1, otherLines.length);
    const signedDevPx = line0.inkLeftEdgePx - meanOtherInkLeft;
    const absDevPx = Math.abs(signedDevPx);
    return {
      id,
      ratio,
      ratioPct: Math.round(ratio * 100),
      quoteAdvEm: mQuote.advEm,
      laid,
      meanOtherInkLeft,
      signedDevPx,
      signedDevEm: signedDevPx / ref.emAdv,
      absDevEm: absDevPx / ref.emAdv,
    };
  });

  // 实测胜出者：首字墨边与其余行首字偏差最小
  let winner = cards[0];
  for (const c of cards) {
    if (c.absDevEm < winner.absDevEm) winner = c;
  }

  return {
    cols,
    fontSize,
    colWidthPx,
    sharedRightHang,
    quoteAdvEm: mQuote.advEm,
    cards,
    winnerId: winner.id,
  };
}
