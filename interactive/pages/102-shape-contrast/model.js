// 102 形状对比 · 原海报四组同台真实几何模型
// 每组存各自真实的归一化形变参数 t ∈ [0, 1]，各自停在不同错法上：
//   01 圆与方（round-square）：开场 0.78（过度倒圆撞形）→ 向外斜拉至 t ≤ 0.14 成立
//   02 尖与钝（sharp-blunt） ：开场 0.16（钝角低坡失势）→ 向上抬升至顶角 ≤ 50°（t ≥ 0.84）成立
//   03 实与空（solid-hollow）：开场 0.03（极细线框发虚）→ 拉入中段甜区（墨量 40%–70%）成立，太细太粗皆错
//   04 规则与自由（regular-free）：开场 0.08（双侧刻板无对比）→ 拉入中段甜区（0.38–0.72）成立，拉过头冲散左阵也错
// 所有读数严格来自真实几何计算或清晰档位，绝无凑数系数与静态错标签。

export const MODES = [
  {
    id: "round-square",
    index: "01",
    zh: "圆与方",
    en: "CIRCLE vs SQUARE",
    posterBody: "柔和与稳定的对话",
    defaultT: 0.78,
    posterT: 0.0,
    handleAria: "圆与方节点：斜向左上拖拉出 90° 直角拉开曲率差，向内拖大圆角半径",
    handleHint: "拖方块左上角，向外拉出直角",
    handleGlyph: "diag",
  },
  {
    id: "sharp-blunt",
    index: "02",
    zh: "尖与钝",
    en: "SHARP vs BLUNT",
    posterBody: "张力与舒缓的对比",
    defaultT: 0.16,
    posterT: 1.0,
    handleAria: "尖与钝节点：向上拖起三角顶角至 50° 以内建立锐峰张力，向下压扁则钝化失势",
    handleHint: "拖三角顶角，向上拔出锐峰",
    handleGlyph: "vert",
  },
  {
    id: "solid-hollow",
    index: "03",
    zh: "实与空",
    en: "SOLID vs HOLLOW",
    posterBody: "重量与通透的平衡",
    defaultT: 0.03,
    posterT: 0.287, // 对应原海报壁厚占比 16.5%（实测墨量 55%）
    handleAria: "实与空节点：水平拖动空心框内沿调壁厚，停在 40%–70% 墨量中段甜区，太细发虚太粗闷堵都不行",
    handleHint: "拖框内沿进中段壁厚，过细过粗都失衡",
    handleGlyph: "horiz",
  },
  {
    id: "regular-free",
    index: "04",
    zh: "规则与自由",
    en: "REGULAR vs IRREGULAR",
    posterBody: "秩序与灵动的碰撞",
    defaultT: 0.04,
    posterT: 0.55, // 左侧 5×5 点阵严格对齐，右侧舒展为完整有机自由群
    handleAria: "规则与自由节点：向右拖释放右侧有机形态，停在中段让秩序托住灵动；拖过头会冲散左侧点阵",
    handleHint: "向右释放有机形，过头会冲垮左阵",
    handleGlyph: "wave",
  },
];

export const MODE_MAP = Object.fromEntries(MODES.map((m) => [m.id, m]));

export function createInitialParams() {
  return Object.fromEntries(MODES.map((m) => [m.id, m.defaultT]));
}

export function createPosterParams() {
  return Object.fromEntries(MODES.map((m) => [m.id, m.posterT]));
}

export function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

// 靠近自然几何边界时轻微吸附（不强吸答案，只帮手停稳在 0 / 1 极端边）
export function snapParam(modeId, rawT) {
  const t = clamp(rawT, 0, 1);
  if (modeId === "round-square") {
    if (t < 0.035) return 0;
    if (t > 0.965) return 1;
    return t;
  }
  if (modeId === "sharp-blunt") {
    if (t > 0.965) return 1;
    if (t < 0.035) return 0;
    return t;
  }
  if (modeId === "solid-hollow") {
    if (t < 0.025) return 0;
    if (t > 0.975) return 1;
    return t;
  }
  // regular-free
  if (t < 0.03) return 0;
  if (t > 0.97) return 1;
  return t;
}

// 精确计算尖与钝三角形顶角度数（t=0 低平钝坡，t=1 原海报 37° 锐峰）
export function computeTriangleApexDeg(t) {
  const u = 1 - clamp(t, 0, 1); // u=0 为锐峰，u=1 为钝坡
  const ax = u * 0.5;
  const ay = -(1.32 - 1.04 * u);
  const ux = -ax;
  const uy = -ay;
  const vx = 1 - ax;
  const vy = -ay;
  const dot = ux * vx + uy * vy;
  const mag = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  const cos = clamp(dot / Math.max(1e-6, mag), -1, 1);
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

/**
 * 评估单组对话的真实几何读数、动态左右标签、成立与否和「为什么」解释
 */
export function evaluateMode(modeId, rawT, geom = {}, mono = false) {
  const t = clamp(rawT, 0, 1);
  const monoNote = mono ? "当前已抽成纯黑白，层次完全靠轮廓与墨量撑住。" : "";

  if (modeId === "round-square") {
    const sidePx = geom.sidePx || 130;
    const maxR = sidePx * 0.5;
    const rPx = t * maxR;
    const rDisplay = Math.round(rPx);
    const maxDisplay = Math.round(maxR);
    const roundPct = Math.round(t * 100);
    // 左圆半径 r_c = side / sqrt(π) => 精确面积 side²；右方削去四角圆角后精确面积 side²(1 - (1 - π/4)t²)
    const areaRightOverLeft = 1 - (1 - Math.PI / 4) * t * t;
    const lostPct = Math.round((1 - areaRightOverLeft) * 100);

    const leftLabel = mono ? "实心正圆" : "蓝正圆";
    let rightLabel;
    if (t <= 0.04) rightLabel = mono ? "直角正方" : "黑直角方";
    else if (t <= 0.14) rightLabel = mono ? "微倒角方" : "黑微倒角方";
    else if (t < 0.45) rightLabel = mono ? "圆角方块" : "黑圆角方";
    else if (t < 0.75) rightLabel = mono ? "大圆角块" : "黑大圆角块";
    else if (t < 0.94) rightLabel = mono ? "近圆块" : "近圆黑块";
    else rightLabel = mono ? "第二颗圆" : "第二颗黑圆";

    let passed, level, firstSide, firstTag, shortBadge, verdict, detail;
    if (t <= 0.14) {
      passed = true;
      level = "clear";
      firstSide = "left";
      firstTag = "先看左正圆";
      shortBadge = rDisplay === 0 ? "R 0 px · 直角成立" : `R ${rDisplay} px · 成立`;
      verdict = `圆角压回 ${rDisplay} px（占满圆半径 ${roundPct}%），圆弧与直角分属不同曲率通道`;
      detail = `两侧面积近乎相等（1.00 : ${areaRightOverLeft.toFixed(2)}），谁都不靠大块头占便宜；闭合圆弧先抓视线，硬朗直角在旁稳住秩序，对话成立。${monoNote}`;
    } else if (t < 0.45) {
      passed = false;
      level = "mid";
      firstSide = "split";
      firstTag = "曲率偏软";
      shortBadge = `R ${rDisplay} px · 偏软`;
      verdict = `方角倒圆至 ${rDisplay} px（满圆半径的 ${roundPct}%），直角锋芒已开始发软`;
      detail = `方块的 90° 转折一旦磨圆到 ${roundPct}%，视觉上便滑向左侧圆弧；继续把左上角往外拉直，才能让「圆」和「方」真正分工。${monoNote}`;
    } else if (t < 0.75) {
      passed = false;
      level = "mid";
      firstSide = "split";
      firstTag = "主次发糊";
      shortBadge = `R ${rDisplay} px · 趋同`;
      verdict = `圆角拉到 ${rDisplay} px（满圆半径的 ${roundPct}%），右侧已成大圆角块，曲率差大幅缩水`;
      detail = `两侧轮廓都在弯转，眼睛进画面后会在两边多犹豫半拍；把方块左上角向外拉出干脆的直角，左圆才会真正跳出来。${monoNote}`;
    } else {
      passed = false;
      level = "weak";
      firstSide = "left-size";
      firstTag = "双圆撞形";
      shortBadge = `R ${rDisplay} px · 撞形`;
      verdict = `圆角高达 ${rDisplay} px（满圆半径的 ${roundPct}%），右侧已被磨成近圆，形状对比归零`;
      detail = `削去四角让右侧面积少了 ${lostPct}%，但两边轮廓撞成同族圆形；此刻左圆略占先手靠的只是体积稍大，而不是形状差异。${monoNote}`;
    }

    return {
      id: modeId,
      passed,
      level,
      leftLabel,
      rightLabel,
      shortMetric: `R ${rDisplay} px`,
      shortBadge,
      m1Label: "方角半径（实测）",
      m1Val: `${rDisplay} px`,
      m1Sub: `占满圆半径 ${roundPct}%（0 → ${maxDisplay} px）`,
      m2Label: "实测面积比（圆 : 方）",
      m2Val: `1.00 : ${areaRightOverLeft.toFixed(2)}`,
      m2Sub: lostPct > 0 ? `倒圆削去右侧 ${lostPct}% 面积` : "等面积并置，全靠曲率分主次",
      firstSide,
      firstTag,
      verdict,
      detail,
      radiusRatio: t,
      roundPct,
      areaRightOverLeft,
    };
  }

  if (modeId === "sharp-blunt") {
    const u = 1 - t;
    const apexDeg = computeTriangleApexDeg(t);
    const triHeightRatio = 1.32 - 1.04 * u;
    // 精确解析面积：左三角 = 0.5 * W * H(u)；右圆拱 = (0.5 + π/8) * 1.04^2 * W^2
    const triAreaUnit = 0.5 * triHeightRatio;
    const archAreaUnit = (0.5 + Math.PI / 8) * 1.04 * 1.04;
    const triToArch = triAreaUnit / archAreaUnit;

    let leftLabel;
    if (apexDeg <= 50) leftLabel = mono ? "锐角三角" : "黑锐角三角";
    else if (apexDeg <= 86) leftLabel = mono ? "中角三角" : "黑中角三角";
    else leftLabel = mono ? "钝角低坡" : "黑钝角低坡";
    const rightLabel = mono ? "圆顶拱门" : "蓝圆顶拱门";

    let passed, level, firstSide, firstTag, shortBadge, verdict, detail;
    if (apexDeg <= 50) {
      passed = true;
      level = "clear";
      firstSide = "left";
      firstTag = "先看左锐峰";
      shortBadge = `${apexDeg}° · 锐峰成立`;
      verdict = `面积只有拱门的 ${Math.round(triToArch * 100)}%，仍靠 ${apexDeg}° 锐峰率先抓住视线`;
      detail = `尖锐顶角自带强烈的方向指向与警觉张力，眼睛先被尖顶钩住，再顺斜边滑入右侧饱满圆拱得到缓冲——一尖一钝的对话成立。${monoNote}`;
    } else if (apexDeg <= 86) {
      passed = false;
      level = "mid";
      firstSide = "split";
      firstTag = "锋芒偏钝";
      shortBadge = `${apexDeg}° · 偏钝`;
      verdict = `顶角 ${apexDeg}° 仍偏宽，左侧指向张力压不住右侧圆拱的体量`;
      detail = `斜边变缓后尖角先手优势迅速消退（面积比 ${triToArch.toFixed(2)} : 1.00）；继续把顶点往上拔高，把顶角收进 50° 以内。${monoNote}`;
    } else {
      passed = false;
      level = "weak";
      firstSide = "right";
      firstTag = "钝坡失势";
      shortBadge = `${apexDeg}° · 钝化`;
      verdict = `顶角钝化到 ${apexDeg}°，左侧塌成低平屋脊，主导权全交给了右拱门`;
      detail = `当左侧只剩圆拱 ${Math.round(triToArch * 100)}% 面积又没有锐角锋芒时，眼睛会直接绕过它落到高大的圆拱上；把三角顶点向上拉起试试。${monoNote}`;
    }

    return {
      id: modeId,
      passed,
      level,
      leftLabel,
      rightLabel,
      shortMetric: `${apexDeg}°`,
      shortBadge,
      m1Label: "三角顶角（实测）",
      m1Val: `${apexDeg}°`,
      m1Sub: "收至 ≤ 50° 才立住尖锐锋芒",
      m2Label: "实测面积比（三角 : 拱）",
      m2Val: `${triToArch.toFixed(2)} : 1.00`,
      m2Sub: "右拱门保持 180° 圆顶基准",
      firstSide,
      firstTag,
      verdict,
      detail,
      apexDeg,
      triHeightRatio,
      triToArch,
    };
  }

  if (modeId === "solid-hollow") {
    // 精确解析壁厚占比 w ∈ [0.03, 0.50]（0.50 = 100% 实心）
    const wallFrac = 0.03 + t * 0.47;
    const innerFrac = Math.max(0, 1 - 2 * wallFrac);
    const leftInkFrac = 1 - innerFrac * innerFrac; // 精确油墨面积占比 11.6% ~ 100%
    const leftInkPct = Math.round(leftInkFrac * 100);
    const wallPct = Math.round(wallFrac * 100);
    const rightInkUnit = Math.PI / 4; // 同边长内切圆精确墨量 78.54%
    const inkRatio = leftInkFrac / rightInkUnit; // 精确油墨面积比
    // 仅用于画布天平视觉示意的温和偏转弧度（绝不在文字里谎报具体度数！）
    const visualTiltRad = clamp((rightInkUnit - leftInkFrac) * 0.25, -0.16, 0.16);

    let leftLabel;
    if (leftInkFrac < 0.40) leftLabel = mono ? "极细线框" : "极细蓝线框";
    else if (leftInkFrac <= 0.70) leftLabel = mono ? "空心方框" : "蓝空心方框";
    else if (leftInkFrac <= 0.88) leftLabel = mono ? "厚壁方框" : "厚壁蓝方框";
    else leftLabel = mono ? "近实心方" : "近实心蓝方";
    const rightLabel = mono ? "实心圆" : "黑实心圆";

    let passed, level, firstSide, firstTag, balanceTier, shortBadge, verdict, detail;
    if (leftInkFrac < 0.40) {
      passed = false;
      level = "weak";
      firstSide = "right";
      firstTag = "左框过虚";
      balanceTier = "右重左虚（过细）";
      shortBadge = `墨量 ${leftInkPct}% · 过细`;
      verdict = `左框墨量仅 ${leftInkPct}%（单边壁厚 ${wallPct}%），线条太虚撑不住左盘体量`;
      detail = `实心圆先抢眼没错，但左框细到像辅助参考线，油墨不到右圆一半（${inkRatio.toFixed(2)} : 1.00），天平明显向右偏沉；往内加厚到中段（40%–70% 墨量）才能既通透又托住另一边。${monoNote}`;
    } else if (leftInkFrac <= 0.70) {
      passed = true;
      level = "clear";
      firstSide = "right";
      firstTag = "实圆先眼 · 空框撑场";
      balanceTier = "右沉左撑（甜区）";
      shortBadge = `墨量 ${leftInkPct}% · 成立`;
      verdict = `左框墨量 ${leftInkPct}% 落在中段甜区：实心圆先抓眼，粗空框以轮廓与留白稳住左盘`;
      detail = `按油墨面积算左框仍轻于右圆（${inkRatio.toFixed(2)} : 1.00），主次分明；同时方框有足够壁厚与外廓张力撑起视觉体量，不虚也不闷——这正是「重量与通透的平衡」。${monoNote}`;
    } else if (leftInkFrac <= 0.88) {
      passed = false;
      level = "mid";
      firstSide = "split";
      firstTag = "两头抢重";
      balanceTier = "两头拉锯（偏粗）";
      shortBadge = `墨量 ${leftInkPct}% · 偏粗`;
      verdict = `左框墨量涨到 ${leftInkPct}%（墨量比 ${inkRatio.toFixed(2)} : 1.00），透气口缩窄后主次发黏`;
      detail = `空心窗口越缩越小，左框开始和实心圆平起平坐抢视线；把内沿往外拉薄一点，回到 40%–70% 墨量区间。${monoNote}`;
    } else {
      passed = false;
      level = "weak";
      firstSide = "left";
      firstTag = "双实闷堵";
      balanceTier = "左反超 · 闷堵";
      shortBadge = `墨量 ${leftInkPct}% · 闷堵`;
      verdict = `空心几乎被填死（墨量 ${leftInkPct}%），整组变成两块实心重物互堵`;
      detail = `填实后的方块墨量反超同宽圆（${inkRatio.toFixed(2)} : 1.00），画面彻底失去透气窗口；往右把方框重新挖空。${monoNote}`;
    }

    return {
      id: modeId,
      passed,
      level,
      leftLabel,
      rightLabel,
      shortMetric: `墨量 ${leftInkPct}%`,
      shortBadge,
      m1Label: "左框实测墨量",
      m1Val: `${leftInkPct}%`,
      m1Sub: `单边壁厚占比 ${wallPct}%（甜区 40%–70%）`,
      m2Label: "墨量比与天平档位",
      m2Val: `${inkRatio.toFixed(2)} : 1.00`,
      m2Sub: `天平示意：${balanceTier}`,
      firstSide,
      firstTag,
      balanceTier,
      verdict,
      detail,
      wallFrac,
      leftInkFrac,
      inkRatio,
      visualTiltRad,
    };
  }

  // 04 regular-free：中段甜区（t ∈ [0.38, 0.72]）
  // organicBlend ∈ [0, 1] 控制右侧从死板方正几何舒展为原海报有机自由群
  // gridBreak ∈ [0, 1] 在 t > 0.72 时把「自由」溢出到左侧，冲散 5×5 点阵
  const organicBlend = clamp(t / 0.55, 0, 1);
  const gridBreak = clamp((t - 0.72) / 0.28, 0, 1);
  const stepPx = geom.stepPx || 26;
  const maxScatterPx = Math.max(16, Math.round(stepPx * 0.95));
  const scatterPx = Math.round(gridBreak * maxScatterPx);
  const pitchPct = Math.round((scatterPx / Math.max(1, stepPx)) * 100);

  let leftLabel;
  if (gridBreak <= 0.02) leftLabel = mono ? "5×5 齐整点阵" : "5×5 蓝点阵";
  else if (gridBreak <= 0.38) leftLabel = mono ? "松动点阵" : "微偏蓝点阵";
  else leftLabel = mono ? "散乱点群" : "散乱蓝点群";

  let rightLabel;
  if (t < 0.22) rightLabel = mono ? "刻板几何块" : "刻板黑几何";
  else if (t < 0.38) rightLabel = mono ? "半收几何群" : "半收黑形群";
  else if (t <= 0.72) rightLabel = mono ? "有机自由群" : "黑有机自由群";
  else rightLabel = mono ? "越界散落群" : "越界散落群";

  let passed, level, firstSide, firstTag, freeTier, shortBadge, verdict, detail;
  if (t < 0.38) {
    passed = false;
    level = "weak";
    firstSide = "split";
    firstTag = "双侧刻板";
    freeTier = t < 0.22 ? "几何锁死" : "舒展不足";
    shortBadge = t < 0.22 ? "双侧刻板" : "灵动不足";
    verdict = `右侧形态仍处于「${freeTier}」档位，和左侧 5×5 点阵一样规矩死板`;
    detail = `网格点阵很齐，但右侧墨块被拉成了规整方块、波浪也绷成直线——两边同走几何秩序通道，少了「自由形」破局的灵动；把节点向右拖开释放有机轮廓。${monoNote}`;
  } else if (t <= 0.72) {
    passed = true;
    level = "clear";
    firstSide = "right";
    firstTag = "先看右有机群";
    freeTier = "有机舒展（甜区）";
    shortBadge = "0 px 偏 · 成立";
    verdict = "左阵 0 px 严格对齐作秩序标尺，右侧舒展的有机墨团与波浪一眼跳成主角";
    detail = `大脑瞬间把 25 颗等距圆点归成安静背景，右侧不规则曲线、斜置方块与圆点借着这把标尺显得鲜活而不散乱——秩序与灵动的碰撞成立。${monoNote}`;
  } else {
    passed = false;
    level = "weak";
    firstSide = "split";
    firstTag = "参照瓦解";
    freeTier = "越界冲垮网格";
    shortBadge = `偏 ${scatterPx} px · 散架`;
    verdict = `自由度拉过头，连左侧 5×5 点阵也被冲散 ${scatterPx} px（格距的 ${pitchPct}%）`;
    detail = `一旦左边的秩序标尺自己散架，右侧自由形就失去了被规矩衬托的前提，整组滑向没有重点的视觉噪音；把节点稍微往左收回中段，保住 0 px 网格。${monoNote}`;
  }

  return {
    id: modeId,
    passed,
    level,
    leftLabel,
    rightLabel,
    shortMetric: gridBreak > 0.02 ? `格偏 ${scatterPx} px` : freeTier.slice(0, 4),
    shortBadge,
    m1Label: "右群自由度档位",
    m1Val: freeTier,
    m1Sub: "需舒展成有机形，且不冲散左阵",
    m2Label: "左阵网格偏差（实测）",
    m2Val: `${scatterPx} px`,
    m2Sub: scatterPx === 0 ? "25 颗圆点严格对齐 5×5 网格" : `点阵已偏离格距 ${pitchPct}%，秩序瓦解`,
    firstSide,
    firstTag,
    freeTier,
    verdict,
    detail,
    organicBlend,
    gridBreak,
    scatterPx,
    maxScatterPx,
    pitchPct,
  };
}

export function evaluateBoard(params, geomMap = {}, mono = false) {
  const results = {};
  let passedCount = 0;
  for (const m of MODES) {
    const res = evaluateMode(m.id, params[m.id], geomMap[m.id] || {}, mono);
    results[m.id] = res;
    if (res.passed) passedCount += 1;
  }
  return {
    passedCount,
    total: MODES.length,
    allPassed: passedCount === MODES.length,
    results,
  };
}
