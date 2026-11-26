// 219 直排中西文直立 — 单真源几何模型与诊断引擎
// 画布绘制与诊单读数共用同一份实算包围盒与坐标，不写死展示常数。

export const PALETTE = {
  sage: "#A8B490",
  sageDeep: "#8E9C77",
  sageLine: "#566348",
  sageGrid: "rgba(25, 34, 24, 0.24)",
  sageRail: "rgba(17, 21, 18, 0.52)",
  cream: "#F7EACB",
  creamBright: "#FBF2DB",
  ink: "#111512",
  inkSub: "#262F23",
  pine: "#1B231B",
  pineCard: "#242E23",
  rustLight: "#9E2A20",
  rustDark: "#F28C78",
  rustFill: "rgba(158, 42, 32, 0.16)",
  mossLight: "#185A37",
  mossDark: "#8BD6A4",
  mossFill: "rgba(24, 90, 55, 0.14)",
};

// 真实字母相对宽窄系数（相对大写 M 的视觉宽），用来单真源计算偏轴锯齿与撞轨
const UPPER_WIDTH = {
  I: 0.32, J: 0.56, L: 0.62, T: 0.68, F: 0.62, E: 0.66, P: 0.68, R: 0.70,
  K: 0.72, S: 0.66, B: 0.70, C: 0.76, D: 0.76, U: 0.76, V: 0.74, A: 0.76,
  G: 0.78, H: 0.76, N: 0.76, O: 0.82, Q: 0.82, X: 0.74, Y: 0.72, Z: 0.68,
  M: 0.92, W: 1.00, "&": 0.78, "•": 0.28, ".": 0.26, "0": 0.70, "1": 0.44,
  "2": 0.66, "3": 0.66, "4": 0.68, "5": 0.66, "6": 0.68, "7": 0.62, "8": 0.68, "9": 0.68,
};

const LOWER_WIDTH = {
  i: 0.26, l: 0.26, j: 0.30, t: 0.38, r: 0.40, f: 0.38, c: 0.54, s: 0.50,
  a: 0.58, e: 0.58, g: 0.60, h: 0.60, k: 0.56, n: 0.60, o: 0.62, p: 0.62,
  q: 0.62, u: 0.60, v: 0.56, w: 0.84, x: 0.56, y: 0.56, z: 0.52, d: 0.62,
  b: 0.62, m: 0.88, "&": 0.74, "•": 0.28, ".": 0.26, "0": 0.66, "1": 0.42,
  "2": 0.62, "3": 0.62, "4": 0.64, "5": 0.62, "6": 0.64, "7": 0.58, "8": 0.64, "9": 0.64,
};

const ASCENDERS = new Set(["b", "d", "f", "h", "k", "l", "t"]);
const DESCENDERS = new Set(["g", "j", "p", "q", "y"]);

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·双轨碑",
    mode: "twin",
    cjk: ["直", "排", "中", "西", "文", "直", "立"],
    words: ["UPRIGHT", "VERTICAL", "CJK", "&", "LATIN"],
    bracketLabel: "字面保持直立",
    idealCapRatio: 0.245, // 相对单个中文字框 em 的标准大写高
    minScale: 0.78,
    maxScale: 1.24,
    idealStepMin: 1.24,
    idealStepMax: 1.56,
    defaultGood: { caseMode: "upper", axisOffset: 0, stepRatio: 1.38, dividerMode: "dot", latinScale: 1.0 },
  },
  spine: {
    id: "spine",
    label: "书脊·同列混排",
    mode: "single",
    // 同列单轨混排：中文与直立西文、数字共用同一纵向中轴
    segments: [
      { kind: "cjk", text: "建" },
      { kind: "cjk", text: "筑" },
      { kind: "break" },
      { kind: "latin", word: "TOKYO" },
      { kind: "break" },
      { kind: "latin", word: "2025" },
      { kind: "break" },
      { kind: "cjk", text: "卷" },
      { kind: "cjk", text: "一" },
    ],
    bracketLabel: "同列共用主轴",
    idealCapRatio: 0.72, // 同列混排时，西文大写高度约为汉字 em 的 70%–76%
    minScale: 0.80,
    maxScale: 1.20,
    idealStepMin: 1.18,
    idealStepMax: 1.54,
    defaultGood: { caseMode: "upper", axisOffset: 0, stepRatio: 1.34, dividerMode: "dot", latinScale: 1.0 },
  },
  signage: {
    id: "signage",
    label: "建筑·竖招牌",
    mode: "single",
    segments: [
      { kind: "cjk", text: "茶" },
      { kind: "cjk", text: "室" },
      { kind: "break" },
      { kind: "latin", word: "TEA" },
      { kind: "break" },
      { kind: "latin", word: "LAB" },
      { kind: "break" },
      { kind: "latin", word: "04" },
    ],
    bracketLabel: "立面远距直读",
    idealCapRatio: 0.76,
    minScale: 0.82,
    maxScale: 1.22,
    idealStepMin: 1.20,
    idealStepMax: 1.58,
    defaultGood: { caseMode: "upper", axisOffset: 0, stepRatio: 1.36, dividerMode: "space", latinScale: 1.04 },
  },
};

// 开场刻意停在 0/4 四重真坏态：小写叠排 + 左缘硬齐偏轴 -28% + 纵向步距挤撞 0.94× 且无分隔 + 西文过小失衡
export const INITIAL_STATE = {
  specimen: "poster",
  caseMode: "lower",     // "upper" | "lower" | "sideways"
  axisOffset: -28,       // -40 .. +40 (% of rail half-width, 0 = centered plumb)
  stepRatio: 0.94,       // 0.82 .. 2.05 (vertical pitch relative to Latin cap height)
  dividerMode: "none",   // "dot" | "space" | "none"
  latinScale: 0.74,      // 0.60 .. 1.45 (relative to specimen's ideal optical scale)
  showGuides: true,
  highlightPrinciple: null, // null | "alignment" | "rhythm" | "integration"
};

export const PRESETS = {
  classic: {
    label: "原海报经典解",
    kind: "good",
    patch: { specimen: "poster", caseMode: "upper", axisOffset: 0, stepRatio: 1.38, dividerMode: "dot", latinScale: 1.0 },
  },
  airy: {
    label: "气口留白解",
    kind: "good",
    patch: { specimen: "poster", caseMode: "upper", axisOffset: 0, stepRatio: 1.35, dividerMode: "space", latinScale: 1.02 },
  },
  compact: {
    label: "紧凑碑刻解",
    kind: "good",
    patch: { specimen: "poster", caseMode: "upper", axisOffset: 0, stepRatio: 1.26, dividerMode: "dot", latinScale: 1.08 },
  },
  spineGood: {
    label: "书脊同列解",
    kind: "good",
    patch: { specimen: "spine", caseMode: "upper", axisOffset: 0, stepRatio: 1.34, dividerMode: "dot", latinScale: 1.0 },
  },
  errLower: {
    label: "试错：小写叠排",
    kind: "bad",
    patch: { caseMode: "lower", axisOffset: 0, stepRatio: 1.34, dividerMode: "dot", latinScale: 1.0 },
  },
  errSideways: {
    label: "试错：侧转 90°",
    kind: "bad",
    patch: { caseMode: "sideways", axisOffset: 0, stepRatio: 1.36, dividerMode: "dot", latinScale: 1.0 },
  },
  errLoose: {
    label: "试错：散裂溢锚",
    kind: "bad",
    patch: { caseMode: "upper", axisOffset: 0, stepRatio: 1.92, dividerMode: "dot", latinScale: 1.0 },
  },
  errFat: {
    label: "试错：右偏撞轨",
    kind: "bad",
    patch: { caseMode: "upper", axisOffset: 34, stepRatio: 1.38, dividerMode: "dot", latinScale: 1.38 },
  },
  reset: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function buildTwinTokens(spec, state) {
  const out = [];
  const words = spec.words;
  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const raw = words[wIdx];
    const isAmp = raw === "&";
    if (wIdx > 0 && !isAmp && words[wIdx - 1] !== "&") {
      if (state.dividerMode === "dot") {
        out.push({ kind: "dot", ch: "•", wordIdx: wIdx });
      } else if (state.dividerMode === "space") {
        out.push({ kind: "space", ch: " ", wordIdx: wIdx });
      }
    } else if (isAmp && state.dividerMode === "space") {
      out.push({ kind: "space", ch: " ", wordIdx: wIdx, minor: true });
    }
    for (const c of raw) {
      const ch = state.caseMode === "lower" ? c.toLowerCase() : c.toUpperCase();
      out.push({ kind: "latin", ch, wordIdx: wIdx });
    }
    if (isAmp && state.dividerMode === "space") {
      out.push({ kind: "space", ch: " ", wordIdx: wIdx, minor: true });
    }
  }
  return out;
}

function buildSingleTokens(spec, state) {
  const out = [];
  for (let i = 0; i < spec.segments.length; i++) {
    const seg = spec.segments[i];
    if (seg.kind === "cjk") {
      out.push({ kind: "cjk", ch: seg.text });
    } else if (seg.kind === "break") {
      if (state.dividerMode === "dot") out.push({ kind: "dot", ch: "•" });
      else if (state.dividerMode === "space") out.push({ kind: "space", ch: " " });
    } else if (seg.kind === "latin") {
      for (const c of seg.word) {
        const ch = state.caseMode === "lower" ? c.toLowerCase() : c.toUpperCase();
        out.push({ kind: "latin", ch });
      }
    }
  }
  return out;
}

function glyphMetrics(ch, capH, caseMode) {
  const isLower = caseMode === "lower" && /[a-z]/.test(ch);
  const wFactor = isLower ? (LOWER_WIDTH[ch] ?? 0.56) : (UPPER_WIDTH[ch] ?? 0.72);
  const w = capH * wFactor;
  if (!isLower) {
    return { w, topExt: 0, botExt: 0, visH: capH, asc: false, desc: false };
  }
  // 小写 x-height 约 0.70 capH，上伸部到 1.04，下伸部探出 -0.32
  const asc = ASCENDERS.has(ch);
  const desc = DESCENDERS.has(ch);
  const topExt = asc ? capH * 0.04 : capH * 0.30; // 距大写顶线的空缺
  const botExt = desc ? capH * 0.32 : 0;          // 向下伸出基线的量
  const visH = (capH - topExt) + botExt;
  return { w, topExt, botExt, visH, asc, desc };
}

// 单真源几何计算：输出所有绘制坐标与测量指标
export function computeLayout(state, width, height) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const padTop = height < 360 ? 44 : Math.max(40, Math.round(height * 0.088));
  const padBot = height < 360 ? 34 : Math.max(42, Math.round(height * 0.092));
  const colH = Math.max(190, height - padTop - padBot);
  const topY = padTop;
  const botY = topY + colH;
  const isTwin = spec.mode === "twin";

  // 水平三区布局（还原 219 原海报：左括号 | 主列 | 暖奶油纵向主轴+锚点）
  const centerX = width * 0.50;
  const unit = Math.min(width / 8.8, colH / 8.1);

  // 暖奶油纵向主轴与底部视觉锚点（原海报最右招牌图形）
  const pillarW = clamp(unit * 0.96, 26, 58);
  const anchorSize = pillarW;
  const anchorGap = Math.max(10, Math.round(unit * 0.34));
  const pillarH = Math.max(100, colH - anchorSize - anchorGap);

  const cjkBoxes = [];
  const latinBoxes = [];
  const allBoxes = [];

  let cjkRail, latinRail, pillarRect, pillarAnchorRect, cjkAnchorRect, bracket;
  let em, capH, stepPx, latinStartY, latinEndY;
  let railCenterX, plumbX;

  if (isTwin) {
    em = colH / 8.28; // 7 个汉字 + 底部方锚区
    const cjkW = em * 1.18;
    const latinW = Math.max(em * 0.74, 34);
    const gapToPillar = Math.max(18, unit * 0.82);
    const totalGroupW = cjkW + latinW + gapToPillar + pillarW;
    const startX = Math.max(46, centerX - totalGroupW * 0.5 + 10);

    cjkRail = { left: startX, right: startX + cjkW, cx: startX + cjkW * 0.5, top: topY, bottom: botY };
    latinRail = { left: cjkRail.right, right: cjkRail.right + latinW, cx: cjkRail.right + latinW * 0.5, top: topY, bottom: botY };
    const pillarX = latinRail.right + gapToPillar;
    pillarRect = { x: pillarX, y: topY, w: pillarW, h: pillarH };
    pillarAnchorRect = { x: pillarX, y: topY + pillarH + anchorGap, w: anchorSize, h: anchorSize };

    // 7 个大汉字方格
    const cjkPitch = em * 1.02;
    for (let i = 0; i < spec.cjk.length; i++) {
      const cy = topY + i * cjkPitch + cjkPitch * 0.5;
      const box = {
        kind: "cjk",
        ch: spec.cjk[i],
        x: cjkRail.cx - em * 0.48,
        y: cy - em * 0.48,
        w: em * 0.96,
        h: em * 0.96,
        cx: cjkRail.cx,
        cy,
        cellTop: topY + i * cjkPitch,
        cellBottom: topY + (i + 1) * cjkPitch,
      };
      cjkBoxes.push(box);
      allBoxes.push(box);
    }
    const cjkBottomY = topY + spec.cjk.length * cjkPitch;
    const midAncSize = Math.min(em * 0.54, (botY - cjkBottomY) * 0.62);
    cjkAnchorRect = {
      x: cjkRail.cx - midAncSize * 0.5,
      y: cjkBottomY + (botY - cjkBottomY - midAncSize) * 0.5,
      w: midAncSize,
      h: midAncSize,
    };

    bracket = {
      x: cjkRail.left - Math.max(12, em * 0.28),
      tick: Math.max(7, em * 0.16),
      top: topY + cjkPitch * 0.95,
      bottom: cjkBottomY - cjkPitch * 0.45,
      label: spec.bracketLabel,
    };

    // 右侧直立西文列
    capH = em * spec.idealCapRatio * state.latinScale;
    stepPx = capH * state.stepRatio;
    railCenterX = latinRail.cx;
    const maxShift = latinW * 0.44;
    plumbX = railCenterX + (state.axisOffset / 40) * maxShift;

    const tokens = buildTwinTokens(spec, state);
    latinStartY = topY + capH * 0.25;
    let cursorY = latinStartY;

    if (state.caseMode === "sideways") {
      // 90° 侧转成一条横倒英文字符串（反例展示，提示去 218）
      const fullStr = spec.words.join(state.dividerMode === "dot" ? " • " : state.dividerMode === "space" ? "   " : "");
      const runLen = Math.min(colH * 0.94, fullStr.length * capH * 0.68 * (state.stepRatio / 1.38));
      const box = {
        kind: "sideways",
        ch: fullStr,
        x: plumbX - capH * 0.55,
        y: topY + 6,
        w: capH * 1.1,
        h: runLen,
        cx: plumbX,
        cy: topY + 6 + runLen * 0.5,
        overflowRail: 0,
      };
      latinBoxes.push(box);
      allBoxes.push(box);
      latinEndY = box.y + box.h;
    } else {
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
        if (tk.kind === "space") {
          cursorY += stepPx * (tk.minor ? 0.55 : 0.85);
          continue;
        }
        if (tk.kind === "dot") {
          const r = Math.max(1.8, capH * 0.15);
          const cy = cursorY + stepPx * 0.36;
          const box = {
            kind: "dot",
            ch: "•",
            x: plumbX - r,
            y: cy - r,
            w: r * 2,
            h: r * 2,
            cx: plumbX,
            cy,
            visualTop: cy - r,
            visualBottom: cy + r,
            overflowRail: 0,
          };
          latinBoxes.push(box);
          allBoxes.push(box);
          cursorY += stepPx * 0.72;
          continue;
        }
        const m = glyphMetrics(tk.ch, capH, state.caseMode);
        // 当偏轴时，按硬左齐 / 硬右齐的方式产生真实宽窄锯齿！
        // axisOffset = 0 时完全以 plumbX 居中；偏左越多越趋向左缘硬齐，偏右越多越趋向右缘硬齐
        const flushFactor = clamp(Math.abs(state.axisOffset) / 22, 0, 1);
        const dir = Math.sign(state.axisOffset);
        const centeredX = plumbX - m.w * 0.5;
        const leftFlushX = latinRail.left + 5 + (1 - flushFactor) * (centeredX - (latinRail.left + 5));
        const rightFlushX = latinRail.right - 5 - m.w - (1 - flushFactor) * ((latinRail.right - 5 - m.w) - centeredX);
        const drawX = dir < 0 ? leftFlushX : dir > 0 ? rightFlushX : centeredX;
        const glyphCx = drawX + m.w * 0.5;

        const visualTop = cursorY + m.topExt;
        const visualBottom = cursorY + capH + m.botExt;
        const overflowLeft = Math.max(0, latinRail.left + 2 - drawX);
        const overflowRight = Math.max(0, drawX + m.w - (latinRail.right - 2));

        const box = {
          kind: "latin",
          ch: tk.ch,
          wordIdx: tk.wordIdx,
          x: drawX,
          y: cursorY,
          w: m.w,
          h: capH,
          cx: glyphCx,
          cy: cursorY + capH * 0.5,
          visualTop,
          visualBottom,
          asc: m.asc,
          desc: m.desc,
          overflowRail: Math.max(overflowLeft, overflowRight),
        };
        latinBoxes.push(box);
        allBoxes.push(box);
        cursorY += stepPx;
      }
      latinEndY = latinBoxes.length ? latinBoxes[latinBoxes.length - 1].visualBottom : topY;
    }
  } else {
    // 单列同轨混排（书脊 / 建筑竖招牌）：中文与直立西文在同一竖轨中共用纵向主轴
    const tokens = buildSingleTokens(spec, state);
    const cjkCount = tokens.filter((t) => t.kind === "cjk").length;
    const latinCount = tokens.filter((t) => t.kind === "latin").length;
    const sepCount = tokens.filter((t) => t.kind === "dot" || t.kind === "space").length;
    // 以标准态填满 colH 的 ~88% + 底部锚点估算 em
    const estUnits = cjkCount * 1.12 + latinCount * (spec.idealCapRatio * 1.35) + sepCount * 0.55 + 1.15;
    em = colH / Math.max(8, estUnits);
    const colW = Math.max(em * 1.48, 52);
    const gapToPillar = Math.max(22, unit * 0.92);
    const totalGroupW = colW + gapToPillar + pillarW;
    const startX = Math.max(48, centerX - totalGroupW * 0.5 + 8);

    cjkRail = { left: startX, right: startX + colW, cx: startX + colW * 0.5, top: topY, bottom: botY };
    latinRail = cjkRail;
    const pillarX = cjkRail.right + gapToPillar;
    pillarRect = { x: pillarX, y: topY, w: pillarW, h: pillarH };
    pillarAnchorRect = { x: pillarX, y: topY + pillarH + anchorGap, w: anchorSize, h: anchorSize };

    capH = em * spec.idealCapRatio * state.latinScale;
    stepPx = capH * state.stepRatio;
    railCenterX = cjkRail.cx;
    const maxShift = colW * 0.40;
    plumbX = railCenterX + (state.axisOffset / 40) * maxShift;

    let cursorY = topY + 6;
    latinStartY = null;

    if (state.caseMode === "sideways") {
      // 同列中中文直立，但西文段顺转 90°（混合错态）
      for (const seg of spec.segments) {
        if (seg.kind === "cjk") {
          const box = {
            kind: "cjk",
            ch: seg.text,
            x: railCenterX - em * 0.48,
            y: cursorY,
            w: em * 0.96,
            h: em * 0.96,
            cx: railCenterX,
            cy: cursorY + em * 0.48,
            cellTop: cursorY - 3,
            cellBottom: cursorY + em * 1.04,
          };
          cjkBoxes.push(box);
          allBoxes.push(box);
          cursorY += em * 1.10;
        } else if (seg.kind === "break") {
          cursorY += em * 0.36;
        } else if (seg.kind === "latin") {
          const runLen = seg.word.length * capH * 0.66;
          if (latinStartY === null) latinStartY = cursorY;
          const box = {
            kind: "sideways",
            ch: seg.word,
            x: plumbX - capH * 0.55,
            y: cursorY,
            w: capH * 1.1,
            h: runLen,
            cx: plumbX,
            cy: cursorY + runLen * 0.5,
            overflowRail: 0,
          };
          latinBoxes.push(box);
          allBoxes.push(box);
          cursorY += runLen + em * 0.25;
        }
      }
      latinEndY = cursorY;
    } else {
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
        if (tk.kind === "cjk") {
          const box = {
            kind: "cjk",
            ch: tk.ch,
            x: railCenterX - em * 0.48,
            y: cursorY,
            w: em * 0.96,
            h: em * 0.96,
            cx: railCenterX,
            cy: cursorY + em * 0.48,
            cellTop: cursorY - 3,
            cellBottom: cursorY + em * 1.04,
          };
          cjkBoxes.push(box);
          allBoxes.push(box);
          cursorY += em * 1.10;
        } else if (tk.kind === "space") {
          cursorY += Math.max(8, em * 0.46);
        } else if (tk.kind === "dot") {
          const r = Math.max(2.2, capH * 0.13);
          const cy = cursorY + em * 0.26;
          const box = {
            kind: "dot",
            ch: "•",
            x: railCenterX - r,
            y: cy - r,
            w: r * 2,
            h: r * 2,
            cx: railCenterX,
            cy,
            visualTop: cy - r,
            visualBottom: cy + r,
            overflowRail: 0,
          };
          latinBoxes.push(box);
          allBoxes.push(box);
          cursorY += em * 0.52;
        } else {
          if (latinStartY === null) latinStartY = cursorY;
          const m = glyphMetrics(tk.ch, capH, state.caseMode);
          const flushFactor = clamp(Math.abs(state.axisOffset) / 22, 0, 1);
          const dir = Math.sign(state.axisOffset);
          const centeredX = plumbX - m.w * 0.5;
          const leftFlushX = latinRail.left + 6 + (1 - flushFactor) * (centeredX - (latinRail.left + 6));
          const rightFlushX = latinRail.right - 6 - m.w - (1 - flushFactor) * ((latinRail.right - 6 - m.w) - centeredX);
          const drawX = dir < 0 ? leftFlushX : dir > 0 ? rightFlushX : centeredX;
          const glyphCx = drawX + m.w * 0.5;

          const visualTop = cursorY + m.topExt;
          const visualBottom = cursorY + capH + m.botExt;
          const overflowLeft = Math.max(0, latinRail.left + 3 - drawX);
          const overflowRight = Math.max(0, drawX + m.w - (latinRail.right - 3));

          const box = {
            kind: "latin",
            ch: tk.ch,
            x: drawX,
            y: cursorY,
            w: m.w,
            h: capH,
            cx: glyphCx,
            cy: cursorY + capH * 0.5,
            visualTop,
            visualBottom,
            asc: m.asc,
            desc: m.desc,
            overflowRail: Math.max(overflowLeft, overflowRight),
          };
          latinBoxes.push(box);
          allBoxes.push(box);
          cursorY += stepPx;
        }
      }
      latinEndY = cursorY;
    }

    const midAncSize = Math.min(em * 0.56, 28);
    cjkAnchorRect = {
      x: railCenterX - midAncSize * 0.5,
      y: botY - midAncSize,
      w: midAncSize,
      h: midAncSize,
    };

    bracket = {
      x: cjkRail.left - Math.max(12, em * 0.34),
      tick: Math.max(7, em * 0.18),
      top: topY + em * 0.4,
      bottom: Math.min(botY - midAncSize - 12, Math.max(topY + colH * 0.65, latinEndY - 8)),
      label: spec.bracketLabel,
    };
  }

  // 从实绘西文字框计算真实相邻净距、碰撞对、中轴锯齿度与底脚偏差
  const pureLatin = latinBoxes.filter((b) => b.kind === "latin");
  let minClearGapPx = Infinity;
  let maxClearGapPx = -Infinity;
  const collisions = [];
  for (let i = 0; i < latinBoxes.length - 1; i++) {
    const a = latinBoxes[i];
    const b = latinBoxes[i + 1];
    if (a.kind !== "latin" || b.kind !== "latin") continue;
    const gap = b.visualTop - a.visualBottom;
    if (gap < minClearGapPx) minClearGapPx = gap;
    if (gap > maxClearGapPx) maxClearGapPx = gap;
    if (gap < 2.2) collisions.push({ a, b, gap });
  }
  if (!Number.isFinite(minClearGapPx)) minClearGapPx = stepPx - capH;
  if (!Number.isFinite(maxClearGapPx)) maxClearGapPx = stepPx - capH;

  // 实测锯齿度：所有直立西文字中心相对主轴（railCenterX）的最大偏离与相互参差极差
  let maxAxisDevPx = 0;
  let minCx = Infinity;
  let maxCx = -Infinity;
  let maxRailOverflowPx = 0;
  for (const b of pureLatin) {
    const dev = Math.abs(b.cx - railCenterX);
    if (dev > maxAxisDevPx) maxAxisDevPx = dev;
    if (b.cx < minCx) minCx = b.cx;
    if (b.cx > maxCx) maxCx = b.cx;
    if (b.overflowRail > maxRailOverflowPx) maxRailOverflowPx = b.overflowRail;
  }
  const jaggedSpreadPx = pureLatin.length > 1 ? maxCx - minCx : 0;

  // 尾脚与底部锚点底线的偏差（正值 = 溢出底锚，负值 = 悬空短一截）
  const targetFootY = isTwin ? botY - 2 : cjkAnchorRect.y - 10;
  const footDeltaPx = latinEndY - targetFootY;

  return {
    width,
    height,
    spec,
    isTwin,
    topY,
    botY,
    colH,
    em,
    capH,
    stepPx,
    cjkRail,
    latinRail,
    railCenterX,
    plumbX,
    pillarRect,
    pillarAnchorRect,
    cjkAnchorRect,
    bracket,
    cjkBoxes,
    latinBoxes,
    allBoxes,
    collisions,
    metrics: {
      minClearGapPx,
      maxClearGapPx,
      maxAxisDevPx,
      jaggedSpreadPx,
      maxRailOverflowPx,
      footDeltaPx,
      latinEndY,
      targetFootY,
      gapVariancePx: Math.max(0, maxClearGapPx - minClearGapPx),
    },
  };
}

// 单真源诊断器：9 类双向真错态 + 4 维度实时评分 + 多组合法解认可
export function evaluate(state, layout) {
  const { spec, metrics, capH, isTwin } = layout;
  const issues = [];

  // 维度 1：字面保持直立（姿态 + 大写等高）
  const isSideways = state.caseMode === "sideways";
  const isLower = state.caseMode === "lower";
  const uprightOk = !isSideways && !isLower;

  if (isSideways) {
    issues.push({
      code: "sideways-90",
      severity: 100,
      badge: "侧转 90°",
      title: "西文躺倒成了 90°，破坏了直立统一感",
      body: "现在中文站着、西文侧躺，读者视线刚习惯垂直方块，立刻被迫歪头横读。这种顺转 90° 的做法属于 218 号「直排中西文转向」，不适用于强调建筑稳重感的直立碑柱。",
      hint: "直接点击画布里的西文列，或按下下方「大写直立」按钮，让所有字母站直成 0°。",
      fixLabel: "改回大写直立 0°",
      fixPatch: { caseMode: "upper" },
    });
  } else if (isLower) {
    issues.push({
      code: "lowercase-jagged",
      severity: 95,
      badge: "小写破形",
      title: "小写字母竖着叠排，升降部把节奏撞碎了",
      body: `小写字母里有 h/t/l 向上探头、p/g/j 向下拖尾，竖排直立时相邻字间最大与最小空隙相差 ${Math.round(metrics.gapVariancePx)}px，列形忽宽忽窄，完全撑不起中文方块那样的稳定碑感。`,
      hint: "点击画布西文列或切换「大写直立」，用齐顶齐底的大写字面建立均匀块感。",
      fixLabel: "切为全大写直立",
      fixPatch: { caseMode: "upper" },
    });
  }

  // 维度 2：纵向中轴与底线对准（偏左锯齿 / 偏右悬空）
  const axisAbs = Math.abs(state.axisOffset);
  const axisOk = axisAbs <= 7 && metrics.jaggedSpreadPx <= 2.5;
  if (!axisOk) {
    const dirZh = state.axisOffset < 0 ? "左" : "右";
    issues.push({
      code: state.axisOffset < 0 ? "axis-left" : "axis-right",
      severity: 88,
      badge: `${dirZh}偏 ${axisAbs}%`,
      title: `西文偏${dirZh} ${axisAbs}%（锯齿落差 ${Math.round(metrics.jaggedSpreadPx)}px），纵向中轴歪了`,
      body: `窄字母 I、L 和宽字母 W、M 宽度相差近三倍。一往${dirZh}边硬靠，窄字母就缩到轨道一侧，宽字母凸向另一侧，整个竖列瞬间长出锯齿脊线。`,
      hint: `在画布上向${state.axisOffset < 0 ? "右" : "左"}横拖西文列，把铅垂中轴归回 0%（靠近中线会轻轻吸附）。`,
      fixLabel: "中轴归正 0%",
      fixPatch: { axisOffset: 0 },
    });
  }

  // 维度 3：纵向字步与词间断句节奏（过挤撞字 / 过疏散裂 / 无分隔连黏）
  const crushed = state.stepRatio < spec.idealStepMin || metrics.minClearGapPx < 2.4;
  const shattered = state.stepRatio > spec.idealStepMax;
  const noBreak = state.dividerMode === "none";
  const rhythmOk = !crushed && !shattered && !noBreak;

  if (crushed) {
    issues.push({
      code: "step-crushed",
      severity: 84,
      badge: `挤撞 ${state.stepRatio.toFixed(2)}×`,
      title: `纵向字步只有 ${state.stepRatio.toFixed(2)}×（净距仅 ${Math.round(metrics.minClearGapPx)}px），上下字母贴撞`,
      body: "直立西文只能逐字向下扫读，字步压得太紧会让上下笔画粘成一根黑条，眼睛根本切不开相邻字母，也读不出清晰的竖向节拍。",
      hint: "向下拖动底部锚点或把「纵向字步」推到 1.26×–1.52×，留出清晰呼吸缝。",
      fixLabel: "拉开均衡字步",
      fixPatch: { stepRatio: spec.defaultGood.stepRatio },
    });
  } else if (shattered) {
    issues.push({
      code: "step-shattered",
      severity: 82,
      badge: `散裂 ${state.stepRatio.toFixed(2)}×`,
      title: `纵向字步拉到 ${state.stepRatio.toFixed(2)}×，单词已经碎成孤立散点`,
      body: `字间空隙比字母本身还宽，眼睛没法把相邻字母拼成一个词，西文列也直接冲出底部锚点 ${Math.max(0, Math.round(metrics.footDeltaPx))}px，整列结构散架了。`,
      hint: "向上拖回底部锚点，把「纵向字步」收回 1.26×–1.52× 之间。",
      fixLabel: "收紧回均衡字步",
      fixPatch: { stepRatio: spec.defaultGood.stepRatio },
    });
  }

  if (noBreak) {
    issues.push({
      code: "no-word-break",
      severity: 76,
      badge: "无断词",
      title: "多个英文词黏成一根长串，缺少词间停顿",
      body: "直立西文没有横排的词形轮廓，如果连圆点 • 或气口留白都拿掉，读者会把连续大写误读成一串晦涩的型号代码。",
      hint: "把「词间分隔」切为「圆点 •」或「气口留白」，给每个词清晰边界。",
      fixLabel: "加上圆点 • 分隔",
      fixPatch: { dividerMode: "dot" },
    });
  }

  // 维度 4：信息整合（中西量级平衡 + 不撞轨 + 底脚呼应视觉锚点）
  const scaleSmall = state.latinScale < spec.minScale;
  const scaleLarge = state.latinScale > spec.maxScale || metrics.maxRailOverflowPx > 1;
  const footTolerance = isTwin ? Math.max(38, layout.colH * 0.14) : Math.max(54, layout.colH * 0.22);
  const footBad = !isSideways && Math.abs(metrics.footDeltaPx) > footTolerance;
  const integrationOk = !scaleSmall && !scaleLarge && !footBad;

  if (scaleSmall) {
    issues.push({
      code: "scale-small",
      severity: 72,
      badge: `字面偏小 ${Math.round(state.latinScale * 100)}%`,
      title: `西文字面缩到 ${Math.round(state.latinScale * 100)}%，撑不住中文大字量级`,
      body: "原海报里西文虽然窄于汉字，但视觉分量与中文碑柱相互咬合。把西文压得太小，整列会退成无力的小字备注，尾脚也远远挂在视觉锚点之上。",
      hint: "把「西文字面比」调回 90%–112%，让中西文形成统一的视觉密度。",
      fixLabel: "平衡西文字面比",
      fixPatch: { latinScale: spec.defaultGood.latinScale },
    });
  } else if (scaleLarge) {
    issues.push({
      code: "scale-large",
      severity: 74,
      badge: metrics.maxRailOverflowPx > 1 ? `撞轨 ${Math.round(metrics.maxRailOverflowPx)}px` : `偏肥 ${Math.round(state.latinScale * 100)}%`,
      title: metrics.maxRailOverflowPx > 1
        ? `西文过肥撑出竖轨 ${Math.round(metrics.maxRailOverflowPx)}px，列边界破掉了`
        : `西文字面放大到 ${Math.round(state.latinScale * 100)}%，反客为主抢走了主次`,
      body: "直立西文一旦在宽度上撞出竖向栏线，或者体积压过中文方格，原本清爽的垂直网格秩序立刻变得拥挤噪杂。",
      hint: "把「西文字面比」收回到 90%–112%，让宽字母 W/M 稳稳留在竖轨内。",
      fixLabel: "收回西文字面比",
      fixPatch: { latinScale: spec.defaultGood.latinScale },
    });
  } else if (footBad) {
    const over = metrics.footDeltaPx > 0;
    issues.push({
      code: "foot-mismatch",
      severity: 66,
      badge: over ? `溢锚 +${Math.round(metrics.footDeltaPx)}px` : `悬空 ${Math.round(metrics.footDeltaPx)}px`,
      title: over
        ? `西文尾脚冲出视觉锚点 +${Math.round(metrics.footDeltaPx)}px，底部收不住`
        : `西文尾脚悬在锚点上方 ${Math.abs(Math.round(metrics.footDeltaPx))}px，双列一长一短`,
      body: "原海报用底部的暖奶油方块把中文列、西文列与纵向主轴钉在同一底线上。西文列过早收尾或向下溢出，都会破坏整个竖块的建筑完整性。",
      hint: `微调「纵向字步」或「西文字面比」，让末字母落在底锚基线附近（当前差 ${Math.round(metrics.footDeltaPx)}px）。`,
      fixLabel: "齐平底部视觉锚点",
      fixPatch: { stepRatio: spec.defaultGood.stepRatio, latinScale: spec.defaultGood.latinScale },
    });
  }

  issues.sort((a, b) => b.severity - a.severity);
  const score = [uprightOk, axisOk, rhythmOk, integrationOk].filter(Boolean).length;
  const allGood = score === 4;

  // 一键归正：优先修最严重的单项，或一键全校准（在按钮上标明剩余几处）
  const fullFixPatch = { ...spec.defaultGood };
  const worst = issues[0] || null;

  const caseZh = isSideways ? "侧转 90°" : isLower ? "小写直立" : "大写直立 0°";
  const axisZh = axisAbs === 0 ? "居中 0%" : `${state.axisOffset < 0 ? "左" : "右"}偏 ${axisAbs}%`;
  const footZh = Math.abs(metrics.footDeltaPx) <= 10
    ? "齐平锚点"
    : `${metrics.footDeltaPx > 0 ? "溢锚 +" : "悬空 "}${Math.round(metrics.footDeltaPx)}px`;

  const probes = {
    upright: {
      ok: uprightOk,
      chip: uprightOk ? "大写 0°" : (isSideways ? "侧转 90°" : "小写破形"),
    },
    alignment: {
      ok: axisOk && !footBad,
      chip: !axisOk ? axisZh : (footBad ? footZh : "中轴归正"),
    },
    rhythm: {
      ok: rhythmOk,
      chip: crushed ? `过挤 ${state.stepRatio.toFixed(2)}×`
        : shattered ? `过疏 ${state.stepRatio.toFixed(2)}×`
        : noBreak ? "无断词"
        : `均衡 ${state.stepRatio.toFixed(2)}×`,
    },
    integration: {
      ok: integrationOk,
      chip: scaleSmall ? "偏小弱化"
        : scaleLarge ? "过肥撞轨"
        : footBad ? footZh
        : `统合 ${Math.round(state.latinScale * 100)}%`,
    },
  };

  let headline, body, hint, statusPill;
  if (allGood) {
    statusPill = `4/4 · 直立成碑`;
    headline = state.dividerMode === "space"
      ? "气口留白解成立：直立中西文稳稳站进同一纵向系统"
      : isTwin
        ? "双轨成碑：中西文各守直立，顶底齐平暖奶油视觉锚点"
        : "同列统合：中文方格与大写西文稳稳串在同一根铅垂轴上";
    body = `当前全部西文字母保持 0° 大写等高，中轴偏距 ${axisAbs}%，纵向字步 ${state.stepRatio.toFixed(2)}×（最小字间净距 ${Math.round(metrics.minClearGapPx)}px），尾脚与底部锚点仅差 ${Math.abs(Math.round(metrics.footDeltaPx))}px。你可以继续故意改坏任意一项，或按空格体验视线如何一口气直落到底。`;
    hint = "按 Space 演播纵读视线光带，或点击下方「试错」看反向崩坏。";
  } else {
    statusPill = `${score}/4 · ${worst.badge}`;
    headline = worst.title;
    body = worst.body;
    hint = worst.hint;
  }

  return {
    score,
    allGood,
    statusPill,
    headline,
    body,
    hint,
    worst,
    issues,
    fullFixPatch,
    probes,
    readouts: {
      form: caseZh,
      axis: axisZh,
      step: `${state.stepRatio.toFixed(2)}×`,
      foot: footZh,
      capPx: `${Math.round(capH)}px`,
      gapPx: `${Math.round(metrics.minClearGapPx)}px`,
    },
  };
}
