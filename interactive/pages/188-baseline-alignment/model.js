// 188 · 基线对齐 — 单一实测真源引擎（model.js）
// 全页所有基线位置、外框（em-box / 行框）、字墨边界、汉字 ideo 偏移比例、
// 光学过冲比例、±0.04em 比例磁吸与五类错法诊断，全部由此模块从当前已加载字体实测算出。

export const SNAP_EM = 0.04;
export const FIRST_BASELINE_LINE_HEIGHT = 1.24;
export const SLIDER_MIN_EM = -1.5;
export const SLIDER_MAX_EM = 1.5;

export const HERO_BLOCKS = [
  {
    id: "title",
    col: 0,
    label: "视觉秩序",
    shortLabel: "视觉秩序",
    kind: "han",
    lines: ["视觉秩序"],
    family: '"Noto Sans SC", sans-serif',
    weight: 900,
    locked: true,
    role: "左端锚定 · 汉字字面底",
  },
  {
    id: "ag",
    col: 1,
    label: "Ag",
    shortLabel: "Ag",
    kind: "latin",
    lines: ["Ag"],
    family: '"Chivo", sans-serif',
    weight: 900,
    locked: false,
    role: "西文大字 · 字母基线（g 降部垂出）",
  },
  {
    id: "body",
    col: 2,
    label: "让信息自然呼吸",
    shortLabel: "让信息自然呼吸",
    kind: "han",
    lines: ["让信息自然呼吸"],
    family: '"Noto Sans SC", sans-serif',
    weight: 500,
    locked: false,
    role: "中号中文 · 汉字字面底",
  },
  {
    id: "dual",
    col: 3,
    label: "VISUAL / ORDER",
    shortLabel: "VISUAL / ORDER",
    kind: "latin-dual",
    lines: ["VISUAL", "ORDER"],
    family: '"Chivo", sans-serif',
    weight: 700,
    locked: false,
    role: "双行英文 · 末行基线（last baseline）",
  },
];

export const QUIZ_ITEMS = [
  {
    id: "q-title",
    label: "清晰表达",
    kind: "han",
    lines: ["清晰表达"],
    family: '"Noto Sans SC", sans-serif',
    weight: 900,
  },
  {
    id: "q-body",
    label: "从标题到正文",
    kind: "han",
    lines: ["从标题到正文"],
    family: '"Noto Sans SC", sans-serif',
    weight: 500,
  },
  {
    id: "q-dual",
    label: "Design / Typography",
    kind: "latin-dual",
    lines: ["Design", "Typography"],
    family: '"Chivo", sans-serif',
    weight: 700,
  },
];

// 四选一盲测选项配置（单变量：仅对齐方式不同）
export const QUIZ_OPTIONS = [
  { key: "A", mode: "box-bottom", label: "A", correct: false },
  { key: "B", mode: "first-baseline", label: "B", correct: false },
  { key: "C", mode: "baseline", label: "C", correct: true },
  { key: "D", mode: "ink-bottom", label: "D", correct: false },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = (v) => Math.round(v * 100) / 100;

function makeMeasureCtx() {
  const c = document.createElement("canvas");
  c.width = 400;
  c.height = 200;
  return c.getContext("2d");
}

function measureSample(ctx, fontSpec, text) {
  ctx.font = fontSpec;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const m = ctx.measureText(text);
  return {
    width: m.width,
    fontAsc: m.fontBoundingBoxAscent ?? 90,
    fontDesc: m.fontBoundingBoxDescent ?? 25,
    inkAsc: m.actualBoundingBoxAscent ?? 72,
    inkDesc: Math.max(0, m.actualBoundingBoxDescent ?? 0),
    ideoBase: typeof m.ideographicBaseline === "number" ? m.ideographicBaseline : null,
  };
}

/**
 * 实测当前已加载字体（Noto Sans SC / Chivo / EB Garamond）的精确比例。
 * 汉字 ideo 相对拉丁 romn 的下沉比例、各字降部与圆弧过冲全部由此一次实测得到，
 * 供开场校对台、01 节单字解剖、03 节中英混排滑块及 07 节盲测共同读取。
 */
export function measureFontSystem() {
  const ctx = makeMeasureCtx();
  const S = 100;

  const sc900 = measureSample(ctx, `900 ${S}px "Noto Sans SC", sans-serif`, "视觉秩序");
  const sc500 = measureSample(ctx, `500 ${S}px "Noto Sans SC", sans-serif`, "让信息自然呼吸");
  const scYong = measureSample(ctx, `700 ${S}px "Noto Sans SC", sans-serif`, "永");
  const scGuo = measureSample(ctx, `700 ${S}px "Noto Sans SC", sans-serif`, "国");

  const ch900Ag = measureSample(ctx, `900 ${S}px "Chivo", sans-serif`, "Ag");
  const ch900H = measureSample(ctx, `900 ${S}px "Chivo", sans-serif`, "H");
  const ch900O = measureSample(ctx, `900 ${S}px "Chivo", sans-serif`, "O");
  const ch900o = measureSample(ctx, `900 ${S}px "Chivo", sans-serif`, "o");
  const ch900g = measureSample(ctx, `900 ${S}px "Chivo", sans-serif`, "g");
  const ch900x = measureSample(ctx, `900 ${S}px "Chivo", sans-serif`, "x");
  const ch700V = measureSample(ctx, `700 ${S}px "Chivo", sans-serif`, "VISUAL");
  const ch700O = measureSample(ctx, `700 ${S}px "Chivo", sans-serif`, "ORDER");
  const ch700D = measureSample(ctx, `700 ${S}px "Chivo", sans-serif`, "Design");
  const ch700T = measureSample(ctx, `700 ${S}px "Chivo", sans-serif`, "Typography");

  const eg600H = measureSample(ctx, `600 ${S}px "EB Garamond", serif`, "H");
  const eg600O = measureSample(ctx, `600 ${S}px "EB Garamond", serif`, "O");
  const eg600o = measureSample(ctx, `600 ${S}px "EB Garamond", serif`, "o");
  const eg600g = measureSample(ctx, `600 ${S}px "EB Garamond", serif`, "g");
  const eg600x = measureSample(ctx, `600 ${S}px "EB Garamond", serif`, "x");

  // 汉字方块底（ideo）相对拉丁字母基线（romn / alphabetic）的下沉比例：
  // 优先取 TextMetrics.ideographicBaseline；若浏览器返回 0 或缺失，按实测字面高度在 1em 方块中的对称衬空推导。
  const hanFaceDescRatio = clamp(((sc900.inkDesc + scYong.inkDesc + scGuo.inkDesc) / 3) / S, 0.04, 0.14);
  const hanFaceAscRatio = clamp(((sc900.inkAsc + scYong.inkAsc + scGuo.inkAsc) / 3) / S, 0.72, 0.92);
  let ideoDropRatio = 0;
  if (scYong.ideoBase !== null && Math.abs(scYong.ideoBase) >= 4 && Math.abs(scYong.ideoBase) <= 22) {
    ideoDropRatio = Math.abs(scYong.ideoBase) / S;
  } else {
    const faceSpan = hanFaceAscRatio + hanFaceDescRatio;
    const padEach = Math.max(0.02, (1 - faceSpan) * 0.5);
    ideoDropRatio = clamp(hanFaceDescRatio + padEach, 0.08, 0.16);
  }
  const ideoDropPct = Math.round(ideoDropRatio * 1000) / 10; // 如 12.0

  // 03 节中英混排滑块范围，直接由实测 ideoDropPct 衍生
  const cjkSliderMin = -Math.max(18, Math.round(ideoDropPct * 1.6));
  const cjkSliderMax = Math.max(8, Math.round(ideoDropPct * 0.7));

  const chOvershootO = Math.max(0, (ch900O.inkDesc - ch900H.inkDesc) / Math.max(1, ch900H.inkAsc));
  const chOvershooto = Math.max(0, (ch900o.inkDesc - ch900x.inkDesc) / Math.max(1, ch900x.inkAsc));
  const egOvershootO = Math.max(0, (eg600O.inkDesc - eg600H.inkDesc) / Math.max(1, eg600H.inkAsc));
  const egOvershooto = Math.max(0, (eg600o.inkDesc - eg600x.inkDesc) / Math.max(1, eg600x.inkAsc));

  return {
    ideoDropRatio,
    ideoDropPct,
    hanFaceDescRatio,
    hanFaceAscRatio,
    cjkSliderMin,
    cjkSliderMax,
    fonts: {
      han900: {
        fontAsc: sc900.fontAsc / S,
        fontDesc: sc900.fontDesc / S,
        inkAsc: sc900.inkAsc / S,
        inkDesc: sc900.inkDesc / S,
        faceDesc: sc900.inkDesc / S,
        widthPerEm: sc900.width / S,
      },
      han500: {
        fontAsc: sc500.fontAsc / S,
        fontDesc: sc500.fontDesc / S,
        inkAsc: sc500.inkAsc / S,
        inkDesc: sc500.inkDesc / S,
        faceDesc: sc500.inkDesc / S,
        widthPerEm: sc500.width / S,
      },
      chivo900: {
        fontAsc: ch900Ag.fontAsc / S,
        fontDesc: ch900Ag.fontDesc / S,
        inkAsc: ch900Ag.inkAsc / S,
        inkDesc: ch900Ag.inkDesc / S,
        capHeight: ch900H.inkAsc / S,
        xHeight: ch900x.inkAsc / S,
        gDesc: ch900g.inkDesc / S,
        overshootOPct: +(chOvershootO * 100).toFixed(1),
        overshootoPct: +(chOvershooto * 100).toFixed(1),
        widthAgPerEm: ch900Ag.width / S,
      },
      chivo700: {
        fontAsc: ch700V.fontAsc / S,
        fontDesc: ch700V.fontDesc / S,
        line1InkAsc: ch700V.inkAsc / S,
        line2InkDesc: ch700O.inkDesc / S,
        quizLine1InkAsc: ch700D.inkAsc / S,
        quizLine2InkDesc: ch700T.inkDesc / S,
        widthVisualPerEm: ch700V.width / S,
        widthOrderPerEm: ch700O.width / S,
      },
      garamond600: {
        fontAsc: eg600H.fontAsc / S,
        fontDesc: eg600H.fontDesc / S,
        capHeight: eg600H.inkAsc / S,
        xHeight: eg600x.inkAsc / S,
        gDesc: eg600g.inkDesc / S,
        overshootOPct: +(egOvershootO * 100).toFixed(1),
        overshootoPct: +(egOvershooto * 100).toFixed(1),
      },
    },
  };
}

/**
 * 按块类型获取对应字体的实测比例参数
 */
export function getBlockMetricRatios(block, metrics) {
  if (block.kind === "han") {
    const f = block.weight >= 700 ? metrics.fonts.han900 : metrics.fonts.han500;
    return {
      fontAsc: f.fontAsc,
      fontDesc: f.fontDesc,
      inkAsc: f.inkAsc,
      inkDesc: f.inkDesc,
      faceDesc: f.faceDesc,
      ideoDrop: metrics.ideoDropRatio,
    };
  }
  if (block.kind === "latin") {
    const f = metrics.fonts.chivo900;
    return {
      fontAsc: f.fontAsc,
      fontDesc: f.fontDesc,
      inkAsc: f.inkAsc,
      inkDesc: f.inkDesc,
      faceDesc: 0,
      ideoDrop: 0,
    };
  }
  const f = metrics.fonts.chivo700;
  const isQuiz = block.lines && block.lines[1] === "Typography";
  return {
    fontAsc: f.fontAsc,
    fontDesc: f.fontDesc,
    inkAsc: isQuiz ? f.quizLine1InkAsc : f.line1InkAsc,
    inkDesc: isQuiz ? f.quizLine2InkDesc : f.line2InkDesc,
    faceDesc: 0,
    ideoDrop: 0,
  };
}

/**
 * 计算单个字块在指定 fontSize、baselineY 和 offsetEm 下的精确垂直几何。
 * 约定：offsetEm > 0 表示真基线在主基线上方（偏高），offsetEm < 0 表示在下方（偏低）。
 */
export function computeBlockGeometry(block, fontSize, baselineY, offsetEm, metrics) {
  const r = getBlockMetricRatios(block, metrics);
  const deltaPx = offsetEm * fontSize; // >0 偏高，画面上 y 更小
  const trueBaselineY = baselineY - deltaPx;

  if (block.kind === "han") {
    // 汉字真基线定死为实测字面底（faceDesc 处），故 alphabetic 绘制 y 在其上方 faceDesc*fontSize
    const drawAlphaY = trueBaselineY - fontSize * r.faceDesc;
    const boxTop = drawAlphaY - fontSize * r.fontAsc;
    const boxBottom = drawAlphaY + fontSize * r.fontDesc;
    const ideoY = drawAlphaY + fontSize * r.ideoDrop;
    const inkTop = drawAlphaY - fontSize * r.inkAsc;
    const inkBottom = drawAlphaY + fontSize * r.inkDesc;
    return {
      fontSize,
      offsetEm,
      deltaPx,
      trueBaselineY,
      drawYs: [drawAlphaY],
      firstBaselineY: trueBaselineY,
      boxTop,
      boxBottom,
      boxMid: (boxTop + boxBottom) / 2,
      boxHeight: boxBottom - boxTop,
      inkTop,
      inkBottom,
      ideoY,
      lineHeight: fontSize * 1.2,
    };
  }

  if (block.kind === "latin") {
    const drawAlphaY = trueBaselineY;
    const boxTop = drawAlphaY - fontSize * r.fontAsc;
    const boxBottom = drawAlphaY + fontSize * r.fontDesc;
    const inkTop = drawAlphaY - fontSize * r.inkAsc;
    const inkBottom = drawAlphaY + fontSize * r.inkDesc;
    return {
      fontSize,
      offsetEm,
      deltaPx,
      trueBaselineY,
      drawYs: [drawAlphaY],
      firstBaselineY: trueBaselineY,
      boxTop,
      boxBottom,
      boxMid: (boxTop + boxBottom) / 2,
      boxHeight: boxBottom - boxTop,
      inkTop,
      inkBottom,
      ideoY: null,
      lineHeight: fontSize * 1.2,
    };
  }

  // latin-dual：真基线为末行（第 2 行）字母基线
  const lineHeight = fontSize * FIRST_BASELINE_LINE_HEIGHT;
  const line2Y = trueBaselineY;
  const line1Y = line2Y - lineHeight;
  const boxTop = line1Y - fontSize * r.fontAsc;
  const boxBottom = line2Y + fontSize * r.fontDesc;
  const inkTop = line1Y - fontSize * r.inkAsc;
  const inkBottom = line2Y + fontSize * r.inkDesc;
  return {
    fontSize,
    offsetEm,
    deltaPx,
    trueBaselineY,
    drawYs: [line1Y, line2Y],
    firstBaselineY: line1Y,
    boxTop,
    boxBottom,
    boxMid: (boxTop + boxBottom) / 2,
    boxHeight: boxBottom - boxTop,
    inkTop,
    inkBottom,
    ideoY: null,
    lineHeight,
  };
}

/**
 * 计算某块在不同错法模式下相对锚定基线（baselineY）应有的精确 offsetEm。
 * 锚块 anchor 永远落在 offsetEm = 0。
 */
export function computePresetOffsets(blocks, sizes, mode, metrics) {
  const baselineY = 0;
  const anchorGeom = computeBlockGeometry(blocks[0], sizes[0], baselineY, 0, metrics);
  const out = {};
  blocks.forEach((b, idx) => {
    if (idx === 0) {
      out[b.id] = 0;
      return;
    }
    const g0 = computeBlockGeometry(b, sizes[idx], baselineY, 0, metrics);
    if (mode === "baseline") {
      out[b.id] = 0;
    } else if (mode === "box-top") {
      const shiftDown = anchorGeom.boxTop - g0.boxTop;
      out[b.id] = round2(-shiftDown / sizes[idx]);
    } else if (mode === "box-center") {
      const shiftDown = anchorGeom.boxMid - g0.boxMid;
      out[b.id] = round2(-shiftDown / sizes[idx]);
    } else if (mode === "box-bottom") {
      const shiftDown = anchorGeom.boxBottom - g0.boxBottom;
      out[b.id] = round2(-shiftDown / sizes[idx]);
    } else if (mode === "ink-bottom") {
      // 强行把实际最底端墨迹贴齐主基线
      const shiftDown = baselineY - g0.inkBottom;
      out[b.id] = round2(-shiftDown / sizes[idx]);
    } else if (mode === "first-baseline") {
      if (b.kind === "latin-dual") {
        // 让首行基线落到主基线上（末行掉出下方 1 × lineHeight）
        out[b.id] = round2(-FIRST_BASELINE_LINE_HEIGHT);
      } else {
        out[b.id] = 0;
      }
    }
  });
  return out;
}

/**
 * 计算首屏五栏在不同画布宽度下的精确字号与列边界（保证 390px 下不挤、不换行且开场最大错位 ≥8px）。
 */
export function computeHeroLayout(width, height) {
  const narrow = width < 460;
  const compact = width >= 460 && width < 820;

  let leftGutter, sizes, colFractions;
  if (narrow) {
    // 390px 手机上画布宽约 366px：左端行标压在基线上方不另占宽列，五栏齐铺，Ag 64px 保开场错位 ≥ 9px
    leftGutter = 6;
    sizes = [23, 64, 12.5, 10.5, 0];
    colFractions = [0.275, 0.225, 0.255, 0.14, 0.105];
  } else if (compact) {
    leftGutter = 32;
    sizes = width < 640 ? [26, 66, 13.5, 11, 0] : [36, 84, 18, 13, 0];
    colFractions = [0.26, 0.21, 0.235, 0.155, 0.14];
  } else {
    const scale = clamp(width / 1280, 0.86, 1.32);
    leftGutter = Math.round(52 * Math.min(scale, 1.15));
    sizes = [
      Math.round(58 * scale),
      Math.round(118 * scale),
      Math.round(25 * scale),
      Math.round(16 * scale),
      0,
    ];
    colFractions = [0.255, 0.195, 0.23, 0.165, 0.155];
  }

  const usableW = width - leftGutter - (narrow ? 6 : 16);
  const cols = [];
  let cursor = leftGutter;
  for (let i = 0; i < 5; i++) {
    const cw = usableW * colFractions[i];
    cols.push({
      x: cursor,
      w: cw,
      cx: cursor + cw / 2,
      right: cursor + cw,
    });
    cursor += cw;
  }

  // 主基线位置：留足上方大字上升部与下方 Ag 降部 + 双行误落首基线的空间
  const baselineY = Math.round(height * (narrow ? 0.65 : compact ? 0.66 : 0.65));

  return {
    width,
    height,
    narrow,
    compact,
    leftGutter,
    sizes,
    cols,
    dividers: [cols[1].x, cols[2].x, cols[3].x, cols[4].x],
    baselineY,
  };
}

/**
 * 格式化同一口径读数：主口径 em + 附带实测像素
 */
export function formatDelta(offsetEm, fontSize) {
  const px = Math.round(offsetEm * fontSize);
  if (Math.abs(offsetEm) <= 0.005) return "0.00 em (0 px)";
  const sign = offsetEm > 0 ? "+" : "−";
  const absEm = Math.abs(offsetEm).toFixed(2);
  const absPx = Math.abs(px);
  return `${sign}${absEm} em (${sign}${absPx} px)`;
}

/**
 * 根据当前三块可调字块的 offsetEm，结合实测预设特征，输出确定性诊断与定性档位。
 */
export function evaluateHeroState(offsets, layout, metrics) {
  const sizes = layout.sizes;
  const adjustable = HERO_BLOCKS.slice(1); // ag, body, dual

  const items = HERO_BLOCKS.map((b, i) => {
    const em = b.locked ? 0 : (offsets[b.id] ?? 0);
    const geom = computeBlockGeometry(b, sizes[i], layout.baselineY, em, metrics);
    const aligned = b.locked || Math.abs(em) <= SNAP_EM;
    return { block: b, index: i, offsetEm: em, geom, aligned };
  });

  const alignedCount = items.slice(1).filter((it) => it.aligned).length;
  const maxAbsPx = Math.max(...items.slice(1).map((it) => Math.abs(it.geom.deltaPx)));
  const maxAbsEm = Math.max(...items.slice(1).map((it) => Math.abs(it.offsetEm)));

  // 计算与四种经典错法预设的距离（均按 em 统一口径判断）
  const presetMatch = (mode, tol = 0.09) => {
    const ref = computePresetOffsets(HERO_BLOCKS, sizes, mode, metrics);
    return adjustable.every((b) => Math.abs((offsets[b.id] ?? 0) - ref[b.id]) <= tol);
  };

  // 1. 过关态：全部落入 ±0.04em 磁吸区
  if (alignedCount === 3) {
    return {
      tierKey: "aligned",
      badge: "五栏共线 · 秩序成立",
      headline: "字号相差逾 5 倍，五栏仍稳踩同一条水平地平线",
      why: `「视觉秩序」字面底、Ag 的字母基线（g 降部自然垂出蓝线下方）、中号正文与双行标末行 ORDER，连同右端红黑柱与钴蓝三角底边共线（全部落入 ±${SNAP_EM.toFixed(2)} em 内），扫读视线匀速平直滑过。`,
      alignedCount,
      maxAbsPx,
      maxAbsEm,
      items,
    };
  }

  // 2. 双行误落首基线（VISUAL 落线、ORDER 掉穿底线）
  const dualItem = items[3];
  if (Math.abs(dualItem.offsetEm + FIRST_BASELINE_LINE_HEIGHT) <= 0.22) {
    const othersAligned = items[1].aligned && items[2].aligned;
    return {
      tierKey: "first-baseline",
      badge: "误落首基线 · 末行漏底",
      headline: "你把第一行 VISUAL 压上了蓝线，第二行 ORDER 整行掉穿底界",
      why: othersAligned
        ? `前面三栏已经站稳，但双行英文标实测偏低 ${formatDelta(dualItem.offsetEm, dualItem.geom.fontSize)}：对首行基线（first baseline）适合多栏顶齐，与大标并排齐底时应往上拉，让末行 ORDER（last baseline）落在线上。`
        : `双行英文标当前误踩首行基线（末行实测 ${formatDelta(dualItem.offsetEm, dualItem.geom.fontSize)}），把 ORDER 拖到了底线下方；请把它上移至末行落线，并同步校准其余未落线字块。`,
      alignedCount,
      maxAbsPx,
      maxAbsEm,
      items,
    };
  }

  // 3. 框底对齐（外框下降线齐平：大字下降部深→基线被抬高，小字沉低）
  if (presetMatch("box-bottom", 0.08)) {
    const agIt = items[1];
    const bodyIt = items[2];
    return {
      tierKey: "box-bottom",
      badge: "框底齐平 · 大字基线抬高",
      headline: "淡蓝外框底边笔直，可大字基线被越深的下降线顶高了",
      why: `框底对齐让各块外框的下降线齐平——下降部深度随字号等比放大，最大字号 Ag 框底最深、基线反被抬高 ${formatDelta(agIt.offsetEm, agIt.geom.fontSize)}，而字号小的正文与双行标下降部浅，基线沉低 ${formatDelta(bodyIt.offsetEm, bodyIt.geom.fontSize)}，字脚呈阶梯错落。`,
      alignedCount,
      maxAbsPx,
      maxAbsEm,
      items,
    };
  }

  // 4. 字墨底对齐（把 g 的尾巴尖端强按上蓝线，顶起字母躯干）
  if (presetMatch("ink-bottom", 0.08)) {
    const agIt = items[1];
    return {
      tierKey: "ink-bottom",
      badge: "字墨底齐 · 降部顶翘",
      headline: "g 的尾巴尖端硬踩在蓝线上，把 A 与 g 的圆腹顶浮到了半空",
      why: `字墨底对齐把最底端笔画当成基线：汉字与大写 ORDER 没有降部看似落线，但含降部的 Ag 被 g 的尾巴顶高了 ${formatDelta(agIt.offsetEm, agIt.geom.fontSize)}。降部天生就该垂出基线下方，往下拉让 A 的平脚坐回蓝线。`,
      alignedCount,
      maxAbsPx,
      maxAbsEm,
      items,
    };
  }

  // 5. 框顶对齐（天花板悬挂）
  if (presetMatch("box-top", 0.12)) {
    const bodyIt = items[2];
    return {
      tierKey: "box-top",
      badge: "外框顶齐 · 阶梯下坠",
      headline: "小字被吊在天花板高度，扫读像一路踩空下台阶",
      why: `所有外框上沿齐平时，字号越小的块基线悬得越高——中号正文实测偏高 ${formatDelta(bodyIt.offsetEm, bodyIt.geom.fontSize)}，视线从大标横扫到小字时上下落差剧烈，整行层级立刻散架。`,
      alignedCount,
      maxAbsPx,
      maxAbsEm,
      items,
    };
  }

  // 6. 框体居中（开场默认态）
  if (presetMatch("box-center", 0.09)) {
    const agIt = items[1];
    const bodyIt = items[2];
    return {
      tierKey: "box-center",
      badge: "框体居中 · 字脚飘浮",
      headline: "外框中轴齐平，可眼睛踩的字脚一沉一浮（align-items: center 陷阱）",
      why: `设计软件的垂直居中只对齐淡蓝外框的中心：大字 Ag 基线沉在蓝线下 ${formatDelta(agIt.offsetEm, agIt.geom.fontSize)}，中号正文飘在蓝线上 ${formatDelta(bodyIt.offsetEm, bodyIt.geom.fontSize)}。上下拖动三块文字或滑动下方游标，把朱红折线拉直合入钴蓝主线。`,
      alignedCount,
      maxAbsPx,
      maxAbsEm,
      items,
    };
  }

  // 7. 局部错位态（逐块实报统一口径 Δy）
  const offList = items
    .slice(1)
    .filter((it) => !it.aligned)
    .map((it) => {
      const dir = it.offsetEm > 0 ? "偏高" : "偏低";
      return `${it.block.shortLabel} ${dir} ${formatDelta(it.offsetEm, it.geom.fontSize)}`;
    });

  return {
    tierKey: "partial",
    badge: `校准中 · ${alignedCount} / 3 块落线`,
    headline: alignedCount > 0 ? `已有 ${alignedCount} 块站稳基线，继续调平剩余字块` : "朱红折线仍在起伏，三块尚未落进 ±0.04 em 磁吸区",
    why: `当前未落线：${offList.join("；")}。把每块真基线移入 ±${SNAP_EM.toFixed(2)} em 区间即可自动轻吸落稳（注意让 Ag 的 g 降部垂出蓝线下方、双行标以末行 ORDER 落线）。`,
    alignedCount,
    maxAbsPx,
    maxAbsEm,
    items,
  };
}

/**
 * 计算 07 节四选一盲测各选项的几何与最大实测落差
 */
export function evaluateQuizOption(mode, sizes, baselineY, metrics) {
  const offsets = computePresetOffsets(QUIZ_ITEMS, sizes, mode, metrics);
  const items = QUIZ_ITEMS.map((b, i) => {
    const em = offsets[b.id] ?? 0;
    const geom = computeBlockGeometry(b, sizes[i], baselineY, em, metrics);
    return { block: b, offsetEm: em, geom };
  });
  const maxAbsEm = Math.max(...items.map((it) => Math.abs(it.offsetEm)));
  const maxAbsPx = Math.max(...items.map((it) => Math.abs(it.geom.deltaPx)));
  return { mode, offsets, items, maxAbsEm, maxAbsPx };
}
