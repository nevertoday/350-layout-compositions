// 020 镜像构图 · 统一几何与判定模型（固定 800×600 精确 4:3 逻辑画布，开场工作台、第 02 节校准与第 07 节盲测共用同一数据源）

export const LOGICAL_W = 800;
export const LOGICAL_H = 600;
export const FRAME_PAD = 18;

// 原海报采样配色（严格三色系：曜石黑 / 浅银纸白 / 双阶玫红）
export const PALETTE = {
  bg: "#0D0D0D",
  charcoal: "#1A1A1C",
  box: "#262626",
  silver: "#E2E2E2",
  silverSoft: "#B8B6B4",
  paper: "#ECEAE8",
  ink: "#111111",
  magenta: "#D84582",
  magentaBright: "#E8649B",
  berry: "#BF2C6C",
  berryDeep: "#8E1D4E",
  good: "#E2E2E2",
};

// 经验值阈值（按 020 原海报实测校准：元素单侧离轴约画宽 1.5%–2.5%，左右轴缝约等于同侧层间距 1.0×）
export const SEAM_RULE = {
  minGood: 0.75,
  ideal: 1.0,
  maxGood: 1.6,
  maxLoose: 2.6,
  posterHalfGapPctMin: 1.5,
  posterHalfGapPctMax: 2.5,
};

// 三套手性标本（全部使用 800×600 逻辑坐标，各端等比缩放保证读数一致）
export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报 · 错落三形",
    shortName: "原海报",
    orientation: "vertical",
    layerGap: 28,
    layerGapAnchor: { x: 354, y0: 366, y1: 394 },
    axisMin: 268,
    axisMax: 520,
    initialAxis: 346, // 刻意切穿错落偏内的浅银四分之一圆（重叠 26 单位）
    idealAxis: 386,   // halfGap = 14 (1.75% 画宽)，axisSeam = 28，ratio = 1.00×
    initialMode: "mirror",
    chiralNames: "「浅银四分之一圆」与「深莓斜切半圆」",
    axisLabel: "镜像轴",
    axisDirText: "竖向镜轴",
    elements: [
      {
        id: "top-circle",
        name: "亮玫红圆",
        short: "玫红圆",
        kind: "graphic",
        chiral: false,
        color: PALETTE.magenta,
        shape: "circleDot",
        // 原海报「镜像前」错落摆法：上圆偏外左，顶部留足光学柄安全区
        cx: 238, cy: 158, r: 58,
        dotX: 156, dotY: 158, dotR: 8,
        bbox: { x0: 148, y0: 100, x1: 296, y1: 216 },
        initialMirror: true,
      },
      {
        id: "mid-quarter",
        name: "浅银四分之一圆",
        short: "银四分圆",
        kind: "graphic",
        chiral: true,
        color: PALETTE.silver,
        shape: "quarterLeft",
        // 错落偏内右，直边朝镜轴、圆弧朝左，手性极鲜明
        cornerX: 372, cornerY: 366, r: 122,
        bbox: { x0: 250, y0: 244, x1: 372, y1: 366 },
        initialMirror: true,
      },
      {
        id: "bot-bevel",
        name: "深莓斜切半圆",
        short: "莓斜半圆",
        kind: "graphic",
        chiral: true,
        color: PALETTE.berry,
        shape: "bevelSemi",
        // 错落偏左下，右侧圆弧起拱、左侧 60° 利落斜切，手性极鲜明
        x0: 144, x1: 344, y0: 394, y1: 524, peakX: 214,
        bbox: { x0: 144, y0: 394, x1: 344, y1: 524 },
        initialMirror: true,
      },
      {
        id: "dir-badge",
        name: "文字签「映 020 →」",
        short: "文字签 →",
        kind: "text",
        chiral: true,
        color: PALETTE.magentaBright,
        shape: "textTag",
        text: "映 020 →",
        // 未改正向时落在中层左侧空位并被镜像出反字；改正向后独立居中正向排布
        x0: 112, y0: 280, x1: 230, y1: 326,
        uprightAnchor: { cx: "axis", cy: 556, w: 126, h: 36 },
        bbox: { x0: 112, y0: 280, x1: 230, y1: 326 },
        initialMirror: true, // 开场刻意设为参与镜像，造成反字错误
      },
    ],
  },

  water: {
    id: "water",
    name: "建筑水景 · 水平水面",
    shortName: "水景横轴",
    orientation: "horizontal",
    layerGap: 26,
    layerGapAnchor: { y: 248, x0: 446, x1: 472 },
    axisMin: 210,
    axisMax: 410,
    initialAxis: 248, // 刻意高于建筑底线切穿穹顶与阶梯廊台
    idealAxis: 289,   // halfGap = 13，axisSeam = 26，ratio = 1.00×
    initialMode: "mirror",
    chiralNames: "「浅银偏塔穹顶」与「深莓阶梯侧廊」",
    axisLabel: "水面轴",
    axisDirText: "水平镜轴",
    elements: [
      {
        id: "arch-tower",
        name: "浅银偏塔穹顶",
        short: "偏塔穹顶",
        kind: "graphic",
        chiral: true,
        color: PALETTE.silver,
        shape: "waterPavilion",
        x0: 212, y0: 110, x1: 446, y1: 276,
        bbox: { x0: 212, y0: 110, x1: 446, y1: 276 },
        initialMirror: true,
      },
      {
        id: "step-wing",
        name: "深莓阶梯侧廊",
        short: "阶梯侧廊",
        kind: "graphic",
        chiral: true,
        color: PALETTE.berry,
        shape: "stepWing",
        x0: 472, y0: 184, x1: 618, y1: 276,
        bbox: { x0: 472, y0: 184, x1: 618, y1: 276 },
        initialMirror: true,
      },
      {
        id: "moon-orb",
        name: "亮玫红孤灯",
        short: "玫红孤灯",
        kind: "graphic",
        chiral: false,
        color: PALETTE.magenta,
        shape: "orb",
        cx: 562, cy: 124, r: 34,
        bbox: { x0: 528, y0: 90, x1: 596, y1: 158 },
        initialMirror: true,
      },
      {
        id: "water-label",
        name: "岸标「北岸 ↗」",
        short: "岸标 ↗",
        kind: "text",
        chiral: true,
        color: PALETTE.magentaBright,
        shape: "textTag",
        text: "北岸 ↗",
        // 置于右侧清静区，彻底避开左侧水平轴柄
        x0: 638, y0: 168, x1: 740, y1: 210,
        uprightAnchor: { cx: 689, cy: 96, w: 106, h: 36 },
        bbox: { x0: 638, y0: 168, x1: 740, y1: 210 },
        initialMirror: true,
      },
    ],
  },

  logo: {
    id: "logo",
    name: "品牌徽标 · 对偶字标",
    shortName: "品牌字标",
    orientation: "vertical",
    layerGap: 26,
    layerGapAnchor: { x: 356, y0: 362, y1: 388 },
    axisMin: 276,
    axisMax: 520,
    initialAxis: 426, // 刻意在平移复制态下拉宽断联
    idealAxis: 387,   // halfGap = 13，axisSeam = 26，ratio = 1.00×
    initialMode: "copy",
    chiralNames: "「亮玫红折翼弧」与「浅银阶梯方柱」",
    axisLabel: "徽标轴",
    axisDirText: "竖向镜轴",
    elements: [
      {
        id: "wing-blade",
        name: "亮玫红折翼弧",
        short: "折翼弧",
        kind: "graphic",
        chiral: true,
        color: PALETTE.magenta,
        shape: "wingBlade",
        x0: 170, y0: 106, x1: 364, y1: 222,
        bbox: { x0: 170, y0: 106, x1: 364, y1: 222 },
        initialMirror: true,
      },
      {
        id: "notch-core",
        name: "浅银阶梯方柱",
        short: "阶梯方柱",
        kind: "graphic",
        chiral: true,
        color: PALETTE.silver,
        shape: "notchCore",
        x0: 236, y0: 248, x1: 374, y1: 362,
        bbox: { x0: 236, y0: 248, x1: 374, y1: 362 },
        initialMirror: true,
      },
      {
        id: "bevel-foot",
        name: "深莓斜切底座",
        short: "斜切底座",
        kind: "graphic",
        chiral: true,
        color: PALETTE.berry,
        shape: "bevelFoot",
        x0: 186, y0: 388, x1: 356, y1: 484,
        bbox: { x0: 186, y0: 388, x1: 356, y1: 484 },
        initialMirror: true,
      },
      {
        id: "brand-text",
        name: "品牌字标「ECHO」",
        short: "字标 ECHO",
        kind: "text",
        chiral: true,
        color: PALETTE.magentaBright,
        shape: "textTag",
        text: "ECHO",
        x0: 116, y0: 280, x1: 220, y1: 326,
        uprightAnchor: { cx: "axis", cy: 540, w: 120, h: 38 },
        bbox: { x0: 116, y0: 280, x1: 220, y1: 326 },
        initialMirror: true,
      },
    ],
  },
};

export function createInitialState(specimenId = "poster") {
  const spec = SPECIMENS[specimenId] || SPECIMENS.poster;
  const mirrorFlags = {};
  for (const el of spec.elements) mirrorFlags[el.id] = el.initialMirror;
  return {
    specimenId: spec.id,
    axis: spec.initialAxis,
    mode: spec.initialMode, // "mirror" | "copy"
    mirrorFlags,
  };
}

export function createReferenceState(specimenId = "poster") {
  const spec = SPECIMENS[specimenId] || SPECIMENS.poster;
  const mirrorFlags = {};
  for (const el of spec.elements) mirrorFlags[el.id] = el.kind === "graphic";
  return {
    specimenId: spec.id,
    axis: spec.idealAxis,
    mode: "mirror",
    mirrorFlags,
  };
}

// 统一的轴缝/层间距比值判定（开场、第 02 节与第 07 节小练习全部调这一函数）
export function evaluateSeamRatio(ratio) {
  const r = Number(ratio);
  if (r < 0) {
    return {
      code: "cut_through",
      label: "切穿撞镜",
      tone: "danger",
      ok: false,
      shortRule: "轴缝为负，主体已越过镜轴",
      reason: "元素跨过镜像轴，原形与镜像在中缝重叠焊成连体怪形。",
    };
  }
  if (r < SEAM_RULE.minGood) {
    return {
      code: "seam_tight",
      label: "贴缝过紧",
      tone: "warn",
      ok: false,
      shortRule: `轴缝仅为层间距 ${r.toFixed(1)}×（低于 ${SEAM_RULE.minGood}× 经验下限）`,
      reason: `虽未相撞，但轴缝仅同侧层间距的 ${r.toFixed(1)} 倍，低于第 02 节 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验舒服带——两翼在中缝挤成闷重整团，透气节奏消失。`,
    };
  }
  if (r <= SEAM_RULE.maxGood) {
    return {
      code: "balanced",
      label: "呼应成立",
      tone: "good",
      ok: true,
      shortRule: `轴缝为层间距 ${r.toFixed(1)}×（落入 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验舒服带）`,
      reason: `轴缝约为同侧层间距的 ${r.toFixed(1)} 倍，贴合第 02 节按原海报校准的 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验区间——近轴面对面锁定紧致利落，内外留白节奏统一。`,
    };
  }
  if (r <= SEAM_RULE.maxLoose) {
    return {
      code: "seam_loose",
      label: "中缝偏松",
      tone: "warn",
      ok: false,
      shortRule: `轴缝为层间距 ${r.toFixed(1)}×（超出 ${SEAM_RULE.maxGood}× 经验舒服带）`,
      reason: `轴缝拉宽到同侧层间距的 ${r.toFixed(1)} 倍，超出了第 02 节 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验舒服带——中缝呼吸偏松，眼睛要先分别读两侧再回头核对呼应。`,
    };
  }
  return {
    code: "seam_far",
    label: "过宽疏离",
    tone: "danger",
    ok: false,
    shortRule: `轴缝达层间距 ${r.toFixed(1)}×（超过 ${SEAM_RULE.maxLoose}× 经验上限）`,
    reason: `轴缝拉到同侧层间距的 ${r.toFixed(1)} 倍，远超第 02 节 ${SEAM_RULE.maxLoose}× 经验上限——中央裂开过宽空沟，按接近律视觉已拆成各自孤立的两组图形。`,
  };
}

// 计算某一元素在当前镜像轴下的对偶包围盒（真镜像 vs 平移复制）
export function getCounterpartBox(el, axis, orientation, mode, groupShift = 0) {
  const b = el.bbox;
  if (orientation === "vertical") {
    const w = b.x1 - b.x0;
    if (mode === "mirror") {
      return { x0: 2 * axis - b.x1, y0: b.y0, x1: 2 * axis - b.x0, y1: b.y1 };
    }
    // 平移复制：整体按组位移移过镜轴，保持原朝向不翻
    return { x0: b.x0 + groupShift, y0: b.y0, x1: b.x1 + groupShift, y1: b.y1 };
  }
  const h = b.y1 - b.y0;
  if (mode === "mirror") {
    return { x0: b.x0, y0: 2 * axis - b.y1, x1: b.x1, y1: 2 * axis - b.y0 };
  }
  return { x0: b.x0, y0: b.y0 + groupShift, x1: b.x1, y1: b.y1 + groupShift };
}

// 计算当前整幅画布的统一几何与语义诊断
export function evaluateScene(state, customSpec = null) {
  const spec = customSpec || SPECIMENS[state.specimenId] || SPECIMENS.poster;
  const { axis, mode, mirrorFlags } = state;
  const isV = spec.orientation === "vertical";
  const graphics = spec.elements.filter((e) => e.kind === "graphic");
  const texts = spec.elements.filter((e) => e.kind === "text");

  // 计算主图形整体前沿与后沿（用于平移复制位移与轴缝计算）
  const activeGraphics = graphics.filter((e) => mirrorFlags[e.id]);
  const unmirroredGraphics = graphics.filter((e) => !mirrorFlags[e.id]);
  const mirroredTexts = texts.filter((e) => mirrorFlags[e.id]);

  // 所有参与镜像图形的最小离轴有符号距离
  const measurePool = activeGraphics.length ? activeGraphics : graphics;
  let minSignedDist = Infinity;
  let minDistEl = measurePool[0];
  let outerSpanMin = Infinity;
  let innerSpanMax = -Infinity;
  const collidingEls = [];

  for (const el of graphics) {
    const nearEdge = isV ? el.bbox.x1 : el.bbox.y1;
    const farEdge = isV ? el.bbox.x0 : el.bbox.y0;
    if (farEdge < outerSpanMin) outerSpanMin = farEdge;
    if (nearEdge > innerSpanMax) innerSpanMax = nearEdge;

    if (mirrorFlags[el.id]) {
      const d = axis - nearEdge;
      if (d < minSignedDist) {
        minSignedDist = d;
        minDistEl = el;
      }
      if (d < 0) collidingEls.push(el);
    }
  }
  if (!Number.isFinite(minSignedDist)) {
    minSignedDist = axis - innerSpanMax;
  }

  // 组宽 + 轴缝 = 平移复制的水平/垂直总步距（确保平移复制和真镜像拥有完全相同的外廓宽度与中缝宽度，负缝时亦平滑跟随）
  const groupExtent = innerSpanMax - outerSpanMin;
  const axisSeam = minSignedDist * 2;
  const copyShift = groupExtent + axisSeam;

  // 检查反射体是否越出 800×600 画框
  const clippedEls = [];
  for (const el of activeGraphics) {
    const cb = getCounterpartBox(el, axis, spec.orientation, mode, copyShift);
    if (cb.x0 < FRAME_PAD || cb.x1 > LOGICAL_W - FRAME_PAD || cb.y0 < FRAME_PAD || cb.y1 > LOGICAL_H - FRAME_PAD) {
      clippedEls.push(el);
    }
  }

  const ratio = axisSeam / spec.layerGap;
  const halfGapPct = (minSignedDist / (isV ? LOGICAL_W : LOGICAL_H)) * 100;
  const seamEval = evaluateSeamRatio(ratio);

  const axisPct = Math.round((axis / (isV ? LOGICAL_W : LOGICAL_H)) * 100);
  const copyModeOn = mode === "copy";
  const hasCollision = collidingEls.length > 0;
  const hasClip = clippedEls.length > 0;
  const missingGraphics = unmirroredGraphics.length > 0;
  const textReversed = mirroredTexts.length > 0;

  // 四条原海报「教学要点」实时实检（每项直接连到真实几何条件）
  const checks = {
    axisClear: !hasCollision && !hasClip,
    chiralEcho: !copyModeOn && !missingGraphics,
    weightBalance: !hasCollision && !hasClip && !missingGraphics && !textReversed,
    seamRhythm: !hasCollision && !hasClip && seamEval.ok,
  };

  // 决定主诊断态与白话「为什么」
  let code = seamEval.code;
  let badge = seamEval.label;
  let tone = seamEval.tone;
  let headline = "";
  let why = "";
  let leftNoteTitle = "对称不等于呆板";
  let leftNoteBody = "";
  let rightNoteTitle = "镜像让视觉互相呼应";
  let rightNoteBody = "";

  if (copyModeOn) {
    code = "copy_mode";
    badge = "平移复制 · 非镜像";
    tone = "danger";
    headline = `${spec.chiralNames}没有跨轴翻转`;
    why = isV
      ? `右侧只是原样平移过去，${spec.chiralNames}的圆弧与斜切朝向仍和左侧同向——两半只是排队重复，锁不成面对面的镜像呼应。切回「真镜像翻转」再看手性反转。`
      : `水下图形只是向下平移了一份，${spec.chiralNames}仍朝上正立、没有上下翻转——真水面倒影必须跨水平轴上下反向。`;
    leftNoteTitle = "平移不是镜像";
    leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（经验值）· 朝向未翻转，手性破绽已标出。`;
    rightNoteTitle = "缺少面对面呼应";
    rightNoteBody = `点名破绽：${spec.chiralNames}同向滑移，没有跨轴反向锁定。`;
  } else if (hasCollision) {
    code = "cut_through";
    badge = "切穿主体 · 撞镜";
    tone = "danger";
    const names = collidingEls.map((e) => `「${e.name}」`).join("、");
    headline = `镜轴压进了${names}内部`;
    why = `${names}越过${spec.axisLabel}，原形与镜像在中缝重叠焊成连体怪形（斜纹区）。把${spec.axisLabel}往外拉开，让所有图形退回镜面同一侧。`;
    leftNoteTitle = "轴缝为负 · 空间挤破";
    leftNoteBody = `重叠 ${Math.abs(Math.round(minSignedDist))} 单位 · 留白消失，先拖开「▼ ${spec.axisLabel}」。`;
    rightNoteTitle = "轮廓粘连 · 秩序中断";
    rightNoteBody = textReversed
      ? `${names}撞镜粘连，同时${mirroredTexts[0].name}也在出反字。`
      : `${names}撞进镜面，失去独立形体与清晰镜缝。`;
  } else if (hasClip) {
    code = "out_of_bounds";
    badge = "镜像出框 · 截断";
    tone = "danger";
    const names = clippedEls.map((e) => `「${e.name}」`).join("、");
    headline = `${names}的镜像已被画框裁掉`;
    why = `${spec.axisLabel}拖得太偏，${names}反射后超出 4:3 画框边界（虚线裁切警示），两侧视觉重量立刻失衡。把镜轴往画心收回来。`;
    leftNoteTitle = "越界失衡 · 裁边警示";
    leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（经验值）· 镜轴太靠边缘，反射体装不下。`;
    rightNoteTitle = "左右失重 · 呼应残缺";
    rightNoteBody = `${names}在对称侧被硬切一刀，对称秩序与平衡感同时瓦解。`;
  } else if (missingGraphics) {
    code = "graphic_unmirrored";
    badge = "主形缺席 · 未镜像";
    tone = "warn";
    const names = unmirroredGraphics.map((e) => `「${e.name}」`).join("、");
    headline = `${names}被关掉了镜像`;
    why = `你把主图形${names}设成了「保持正向」，另一侧少了对应形体，画面重量瞬间偏向一侧。主图形要参与镜像，只有文字与方向符号才独立正向排布。`;
    leftNoteTitle = "主图形需参与镜像";
    leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（经验值）· 已关闭 ${unmirroredGraphics.length} 块主形镜像。`;
    rightNoteTitle = "单翼缺位 · 重量失衡";
    rightNoteBody = `再点一下${names}切回「参与镜像」，让图形重新成对呼应。`;
  } else if (!seamEval.ok) {
    code = seamEval.code;
    badge = seamEval.label;
    tone = seamEval.tone;
    if (seamEval.code === "seam_tight") {
      headline = `轴缝仅层间距 ${ratio.toFixed(1)}×，两翼挤在中缝`;
      why = `虽然没切穿，但左右轴缝比同侧层间距还窄（低于 ${SEAM_RULE.minGood}× 经验下限），中缝缺少透气感。把镜轴再往外轻拉一点，让轴缝接近层间距（${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验值）${textReversed ? `；别忘了点${mirroredTexts[0].name}改「保持正向」` : ""}。`;
      leftNoteTitle = "轴缝偏紧 · 缺呼吸";
      leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（经验区间 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}×），离轴 ${halfGapPct.toFixed(1)}%。`;
      rightNoteTitle = textReversed ? "挤缝叠加反字破绽" : "留白被赶向外缘";
      rightNoteBody = textReversed
        ? `中缝偏挤，且${mirroredTexts[0].name}跟着镜像出了反字。`
        : `两翼在中缝焊得太近，节奏发闷，轻拉镜轴透出呼吸缝。`;
    } else if (seamEval.code === "seam_loose") {
      headline = `轴缝达层间距 ${ratio.toFixed(1)}×，呼应开始发散`;
      why = `轴缝已经超过同侧层间距的 ${SEAM_RULE.maxGood} 倍（经验舒服带上限），眼睛需要先读完一侧再跨过宽黑缝核对另一侧。把镜轴往内微收一点${textReversed ? `，并把${mirroredTexts[0].name}切为「保持正向」` : ""}。`;
      leftNoteTitle = "中缝偏松 · 节奏发散";
      leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（经验区间 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}×），离轴 ${halfGapPct.toFixed(1)}%。`;
      rightNoteTitle = textReversed ? "松散叠加反字破绽" : "近轴锁定减弱";
      rightNoteBody = textReversed
        ? `中缝略松，且${mirroredTexts[0].name}仍被镜像成了反字。`
        : `向图形方向轻收镜轴，让轴缝与层间距重新呼应。`;
    } else {
      headline = `轴缝拉到层间距 ${ratio.toFixed(1)}×，左右断成两堆`;
      why = `两翼虽然都在框内，但中央裂出比同侧层间距宽 ${ratio.toFixed(1)} 倍的黑沟（超过 ${SEAM_RULE.maxLoose}× 经验上限）。按格式塔接近律，眼睛会先把各自一侧看成孤立团块，近轴呼应瓦解。`;
      leftNoteTitle = "过宽疏离 · 呼应断联";
      leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（超过 ${SEAM_RULE.maxLoose}× 经验上限），离轴 ${halfGapPct.toFixed(1)}%。`;
      rightNoteTitle = "中缝过大 · 整体感拆散";
      rightNoteBody = `往图形一侧收回镜轴，把中央空沟收拢回层间距尺度。`;
    }
  } else if (textReversed) {
    code = "text_mirrored";
    badge = "文字反字 · 误镜像";
    tone = "danger";
    const tName = mirroredTexts[0].name;
    headline = `图形节奏对了，但${tName}镜像出了反字`;
    why = `主图形轴缝已落入 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验舒服带，但${tName}跟着做了镜像翻转，另一侧出现反字与反向箭头。直接点画布里的${tName}（或旁侧元素切签）改为「保持正向」：图形镜像，文字与方向符号独立正向排布。`;
    leftNoteTitle = "节奏已入舒服带";
    leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（单侧离轴 ${halfGapPct.toFixed(1)}%，贴近原海报 1.5%–2.5%）。`;
    rightNoteTitle = "反字破绽 · 立刻可见";
    rightNoteBody = `${tName}被照翻成镜像反字——点它切为「保持正向」即刻修复。`;
  } else {
    code = "balanced";
    badge = "呼应成立 · 秩序平衡";
    tone = "good";
    headline = "图形手性镜像，文字独立正向，节奏成立";
    why = `主图形跨${spec.axisDirText}完成手性翻转，轴缝为同侧层间距的 ${ratio.toFixed(1)}×（单侧离轴 ${halfGapPct.toFixed(1)}%，落入原海报校准的 ${SEAM_RULE.minGood}×–${SEAM_RULE.maxGood}× 经验带），文字与方向符号独立正向排布——两侧一眼对位又有呼吸感。`;
    leftNoteTitle = "对称不等于呆板";
    leftNoteBody = `轴缝 / 层距 ${ratio.toFixed(1)}×（经验值）· 留白与层距同频，和谐又有节奏。`;
    rightNoteTitle = "镜像让视觉互相呼应";
    rightNoteBody = `手性反转锁定中轴，图形镜像与文字正向各守其位，强化稳定与整体感。`;
  }

  return {
    spec,
    axis,
    axisPct,
    mode,
    minSignedDist,
    minDistEl,
    axisSeam,
    layerGap: spec.layerGap,
    ratio,
    halfGapPct,
    copyShift,
    collidingEls,
    clippedEls,
    unmirroredGraphics,
    mirroredTexts,
    checks,
    code,
    badge,
    tone,
    headline,
    why,
    leftNoteTitle,
    leftNoteBody,
    rightNoteTitle,
    rightNoteBody,
    allGood: code === "balanced",
  };
}

// 第 07 节小练习四版选项（全部不相交、全在 4:3 框内、图形与正向文字完全相同，只差轴缝/层间距比值）
export const QUIZ_RATIOS = [
  { id: "A", ratio: 2.0 },
  { id: "B", ratio: 1.0 },
  { id: "C", ratio: 0.4 },
  { id: "D", ratio: 3.5 },
];

export function buildQuizOptionModel(optionId) {
  const item = QUIZ_RATIOS.find((q) => q.id === optionId) || QUIZ_RATIOS[0];
  const base = SPECIMENS.poster;
  const axis = 400; // 四版全部居中正竖轴
  const halfGap = (item.ratio * base.layerGap) / 2;
  // 原图形内缘在 372，整体平移 dx 使内缘正好停在 axis - halfGap
  const dx = (axis - halfGap) - 372;

  const shiftedElements = base.elements.map((el) => {
    const clone = {
      ...el,
      bbox: {
        x0: el.bbox.x0 + dx,
        y0: el.bbox.y0,
        x1: el.bbox.x1 + dx,
        y1: el.bbox.y1,
      },
    };
    if (el.shape === "circleDot") {
      clone.cx = el.cx + dx;
      clone.dotX = el.dotX + dx;
    } else if (el.shape === "quarterLeft") {
      clone.cornerX = el.cornerX + dx;
    } else if (el.shape === "bevelSemi") {
      clone.x0 = el.x0 + dx;
      clone.x1 = el.x1 + dx;
      clone.peakX = el.peakX + dx;
    } else if (el.shape === "textTag") {
      clone.x0 = el.x0 + dx;
      clone.x1 = el.x1 + dx;
    }
    return clone;
  });

  const customSpec = {
    ...base,
    elements: shiftedElements,
  };
  const mirrorFlags = {};
  for (const el of shiftedElements) mirrorFlags[el.id] = el.kind === "graphic";
  const state = {
    specimenId: "poster",
    axis,
    mode: "mirror",
    mirrorFlags,
  };
  const evalResult = evaluateScene(state, customSpec);
  const seamVerdict = evaluateSeamRatio(evalResult.ratio);

  return {
    id: item.id,
    targetRatio: item.ratio,
    state,
    spec: customSpec,
    eval: evalResult,
    verdict: seamVerdict,
    isCorrect: seamVerdict.code === "balanced",
    heroAxisForTry: 372 + halfGap,
  };
}
