// 217 纵 中 横 排 · 单真源几何与版式评估模型
// 画布渲染、原理探针、诊断白话与实时 CSS 全部只从 evaluate() 读数，绝不写死第二份数字。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·结构原理",
    spineChars: ["纵", "中", "横", "排"],
    spineFont: "sans",
    spineEn: ["CENTER-", "VERTICAL /", "HORIZONTAL", "LAYOUT"],
    bands: [
      {
        id: "axis",
        icon: "axis",
        zhTitle: "中央轴心",
        zhBody: "以垂直中轴为主导线，决定版面的稳定与重心。",
        enTitle: "CENTRAL AXIS",
        enBody: "确立视觉中心，统一上下，构建平衡的秩序感。",
      },
      {
        id: "bands",
        icon: "bands",
        zhTitle: "横向展开",
        zhBody: "信息以横向带状排布，向两侧延伸形成节奏。",
        enTitle: "HORIZONTAL BANDS",
        enBody: "横向信息带清晰可读，增强浏览效率与舒适度。",
      },
      {
        id: "cross",
        icon: "cross",
        zhTitle: "交叉结构",
        zhBody: "纵线与横线交汇，形成十字结构的版式骨架。",
        enTitle: "CROSS-STRUCTURE",
        enBody: "纵中为骨，横排为翼，强化结构，提升稳定性。",
      },
      {
        id: "emphasis",
        icon: "ring",
        zhTitle: "重点突出",
        zhBody: "核心信息沿中轴强调，横向内容围绕呈现。",
        enTitle: "EMPHASIS",
        enBody: "突出主次关系，引导视线，强化信息层级。",
      },
    ],
  },
  solar: {
    id: "solar",
    label: "节气年表·茶席",
    spineChars: ["四", "时", "茶", "录"],
    spineFont: "kai",
    spineEn: ["SOLAR TERMS", "SEASONAL", "TEA", "ALMANAC"],
    bands: [
      {
        id: "axis",
        icon: "axis",
        zhTitle: "清明 · 采明前",
        zhBody: "细雨初霁采头春嫩芽，茶气清扬鲜爽。",
        enTitle: "QINGMING · APR",
        enBody: "左记农时物候，右陈焙火与器皿择配。",
      },
      {
        id: "bands",
        icon: "bands",
        zhTitle: "谷雨 · 焙新青",
        zhBody: "叶脉渐厚宜文火轻焙，滋味醇和绵长。",
        enTitle: "GUYU · LATE APR",
        enBody: "以白瓷盖碗出汤，留住春末甘润余韵。",
      },
      {
        id: "cross",
        icon: "cross",
        zhTitle: "立夏 · 凉竹席",
        zhBody: "风入松棚移席北窗，改啜轻发酵白茶。",
        enTitle: "LIXIA · MAY",
        enBody: "中轴立定节气序次，双翼横展器味对照。",
      },
      {
        id: "emphasis",
        icon: "ring",
        zhTitle: "小满 · 试冷泡",
        zhBody: "山泉冷萃四时缓释，清苦化作回甘。",
        enTitle: "XIAOMAN · LATE MAY",
        enBody: "四带自上而下递进，一眼读完春夏茶事。",
      },
    ],
  },
  arch: {
    id: "arch",
    label: "建筑年鉴·索引",
    spineChars: ["筑", "境", "年", "鉴"],
    spineFont: "sans",
    spineEn: ["ARCHITECTURAL", "SPATIAL", "INDEX", "2026"],
    bands: [
      {
        id: "axis",
        icon: "axis",
        zhTitle: "轴线 · 空间纲领",
        zhBody: "一条南北通廊串联入口、中庭与后院。",
        enTitle: "AXIAL SEQUENCE",
        enBody: "人行流线沿中轴推进，空间层次自然展开。",
      },
      {
        id: "bands",
        icon: "bands",
        zhTitle: "立面 · 水平韵律",
        zhBody: "挑檐与长窗横向延展，拉宽建筑尺度感。",
        enTitle: "HORIZONTAL RHYTHM",
        enBody: "水平遮阳板切出明暗带，回应光照变化。",
      },
      {
        id: "cross",
        icon: "cross",
        zhTitle: "节点 · 梁柱交口",
        zhBody: "竖向立柱承重，水平桁架向两侧悬挑。",
        enTitle: "STRUCTURAL JOINT",
        enBody: "交口留出清晰工艺缝，结构逻辑一目了然。",
      },
      {
        id: "emphasis",
        icon: "ring",
        zhTitle: "尺度 · 入口重音",
        zhBody: "挑高门廊立于正中，统领左右辅房体量。",
        enTitle: "ENTRY EMPHASIS",
        enBody: "体量反差确立主入口，不必依赖繁杂标牌。",
      },
    ],
  },
};

export const EVEN_BAND_Y = [0.145, 0.382, 0.618, 0.855];

export function createInitialState(specimen = "poster") {
  // 开场刻意停在 0/4 复合错态：轴偏左 17% + 交口 2px 吃字无引线 + 2/3 带挤撞且后两带压右失衡 + 中柱字号拉平
  return {
    specimen,
    axisX: 0.33,
    spineWidth: 0.155,
    clearance: 2,
    spineScale: 1.15,
    tethers: false,
    bandY: [0.145, 0.355, 0.542, 0.86],
    bandMode: ["both", "both", "right-heavy", "right-heavy"],
    sightline: false,
  };
}

export const PRESETS = {
  classic: {
    label: "标准海报对称解",
    kind: "pass",
    patch: {
      axisX: 0.50,
      spineWidth: 0.16,
      clearance: 24,
      spineScale: 2.55,
      tethers: true,
      bandY: [...EVEN_BAND_Y],
      bandMode: ["both", "both", "both", "both"],
    },
  },
  monument: {
    label: "宽柱纪念碑解",
    kind: "pass",
    patch: {
      axisX: 0.50,
      spineWidth: 0.215,
      clearance: 20,
      spineScale: 2.9,
      tethers: true,
      bandY: [0.15, 0.384, 0.616, 0.85],
      bandMode: ["both", "both", "both", "both"],
    },
  },
  airy: {
    label: "细脊长翼解",
    kind: "pass",
    patch: {
      axisX: 0.50,
      spineWidth: 0.125,
      clearance: 34,
      spineScale: 2.15,
      tethers: true,
      bandY: [0.14, 0.38, 0.62, 0.86],
      bandMode: ["both", "both", "both", "both"],
    },
  },
  errSkew: {
    label: "试错：偏轴失衡",
    kind: "fail",
    patch: {
      axisX: 0.70,
      spineWidth: 0.16,
      clearance: 24,
      spineScale: 2.5,
      tethers: true,
      bandY: [...EVEN_BAND_Y],
      bandMode: ["both", "both", "both", "both"],
    },
  },
  errChomp: {
    label: "试错：中柱吃字",
    kind: "fail",
    patch: {
      axisX: 0.50,
      spineWidth: 0.16,
      clearance: 0,
      spineScale: 2.5,
      tethers: false,
      bandY: [...EVEN_BAND_Y],
      bandMode: ["both", "both", "both", "both"],
    },
  },
  errFatSpine: {
    label: "试错：宽柱挤翼",
    kind: "fail",
    patch: {
      axisX: 0.50,
      spineWidth: 0.32,
      clearance: 20,
      spineScale: 2.6,
      tethers: true,
      bandY: [...EVEN_BAND_Y],
      bandMode: ["both", "both", "both", "both"],
    },
  },
  errDetached: {
    label: "试错：脱钩断联",
    kind: "fail",
    patch: {
      axisX: 0.50,
      spineWidth: 0.14,
      clearance: 60,
      spineScale: 2.3,
      tethers: false,
      bandY: [...EVEN_BAND_Y],
      bandMode: ["both", "both", "both", "both"],
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 依据真实字符宽度估算折行（供单真源几何与 Canvas 绘制共同使用，留出安全边防裁切）
export function wrapTextUnits(text, maxWidthPx, fontPx) {
  if (!text) return [];
  const limit = Math.max(18, maxWidthPx - 6);
  const lines = [];
  let cur = "";
  let w = 0;
  for (const ch of text) {
    const cw = /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? fontPx * 1.07 : fontPx * 0.60;
    if (cur && w + cw > limit) {
      lines.push(cur);
      cur = ch === " " ? "" : ch;
      w = ch === " " ? 0 : cw;
    } else {
      cur += ch;
      w += cw;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * 单真源几何与规则评估：给定当前 state 与画布逻辑尺寸 { W, H }
 * 返回实绘矩形、真实避柱净空、实测带缝、双翼力矩、字级反差与 4 项规则审计结果。
 */
export function evaluate(state, { W = 960, H = 450 } = {}) {
  const compact = W < 540;
  const lowH = H < 310;
  const padX = Math.round(clamp(W * (compact ? 0.032 : 0.04), 10, 48));
  const padY = Math.round(clamp(H * (lowH ? 0.08 : 0.086), 22, 42));
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  // 纵向中轴柱实绘几何
  const spineW = Math.round(innerW * clamp(state.spineWidth, 0.08, 0.34));
  const spineCenterX = padX + innerW * clamp(state.axisX, 0.24, 0.76);
  const spineX = Math.round(clamp(spineCenterX - spineW / 2, padX + 46, W - padX - 46 - spineW));
  const actualAxisRatio = (spineX + spineW / 2 - padX) / innerW;
  const spineTop = Math.round(Math.max(26, padY * 0.9));
  const spineH = Math.round(H - spineTop * 2);
  const spineRect = { x: spineX, y: spineTop, w: spineW, h: spineH, cx: spineX + spineW / 2 };

  // 横向信息带几何（四条带均穿过中轴，高度严控在 innerH*0.175 以内，确保 4 带均匀排布必有充裕呼吸缝）
  const bandH = Math.round(clamp(innerH * 0.175, lowH ? 38 : 48, 66));
  const bandTitlePx = Math.round(clamp(lowH ? 11 : compact ? 11.5 : W * 0.0155, 11, 16));
  const bandBodyPx = Math.round(clamp(lowH ? 9.5 : compact ? 10 : W * 0.0115, 9.5, 12.5));
  const spineFontPx = Math.round(clamp(bandTitlePx * state.spineScale, 14, Math.min(spineW * 0.72, (spineH * 0.60) / 4.1)));
  const actualHierarchyRatio = +(spineFontPx / bandTitlePx).toFixed(2);

  // 逻辑 clearance 按画布宽等比缩放，保证窄屏与宽屏评估同一物理语义
  const scaleRef = clamp(W / 960, 0.44, 1.15);
  const clearancePx = Math.round(state.clearance * scaleRef);
  // 真实文字止点相对于白柱边缘的净空（当 state.clearance < 6 时文字闯入柱缘阴影甚至被柱遮盖）
  const physicalClearanceLogical = state.clearance;
  const intrusionPx = state.clearance < 6 ? Math.round((6 - state.clearance) * 1.4 * scaleRef) : 0;

  const specimen = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const badgeR = lowH ? 11 : compact ? 13 : Math.round(clamp(bandH * 0.30, 15, 21));
  const bandPadX = compact ? 10 : 18;

  // 计算每条横带与左右两翼实绘矩形
  const bands = specimen.bands.map((b, i) => {
    const cy = padY + innerH * clamp(state.bandY[i], 0.10, 0.90);
    const y = Math.round(clamp(cy - bandH / 2, padY * 0.65, H - padY * 0.65 - bandH));
    const rect = { x: padX, y, w: innerW, h: bandH, cy: y + bandH / 2 };
    const mode = state.bandMode[i] || "both";

    const leftAvailRaw = spineRect.x - rect.x - bandPadX - (badgeR * 2 + (compact ? 8 : 14)) - clearancePx + intrusionPx;
    const rightAvailRaw = (rect.x + rect.w) - (spineRect.x + spineRect.w) - bandPadX - clearancePx + intrusionPx;
    const leftTextW = Math.max(24, leftAvailRaw);
    const rightTextW = Math.max(24, rightAvailRaw);

    const leftTextX = rect.x + bandPadX + badgeR * 2 + (compact ? 8 : 14);
    const rightTextX = spineRect.x + spineRect.w + clearancePx - intrusionPx;

    // 真实折行统计
    const leftLines = mode === "right-heavy" ? [] : wrapTextUnits(b.zhBody, leftTextW, bandBodyPx);
    const rightLines = mode === "left-heavy" ? [] : wrapTextUnits(b.enBody, rightTextW, bandBodyPx);

    // 视觉墨重面积估算（按实绘元素：圆徽 + 标题 + 折行文本）
    const leftInk = (mode === "right-heavy" ? 0.16 : 1.0) * (badgeR * badgeR * 2.2 + Math.min(leftTextW, 180) * bandTitlePx * 1.6);
    const rightInk = (mode === "left-heavy" ? 0.12 : 1.0) * (Math.min(rightTextW, 190) * bandTitlePx * 1.55 + (mode === "right-heavy" ? badgeR * badgeR * 1.8 : 0));

    return {
      index: i,
      data: b,
      mode,
      rect,
      badge: { cx: rect.x + bandPadX + badgeR, cy: rect.cy, r: badgeR },
      leftText: { x: leftTextX, w: leftTextW, lines: leftLines },
      rightText: { x: rightTextX, w: rightTextW, lines: rightLines },
      leftTether: { x1: leftTextX + Math.min(leftTextW, bandTitlePx * (compact ? 4.8 : 6.4)), x2: spineRect.x },
      rightTether: { x1: spineRect.x + spineRect.w, x2: rightTextX },
      leftInk,
      rightInk,
      leftCharsPerLine: Math.max(1, Math.floor(leftTextW / bandBodyPx)),
      rightCharsPerLine: Math.max(1, Math.floor(rightTextW / bandBodyPx)),
    };
  });

  // 按垂直坐标排序核算相邻横带间隙（归一化到 450px 参考画布高度）
  const hScale = clamp(innerH / 372, 0.56, 1.15);
  const sorted = [...bands].sort((a, b) => a.rect.y - b.rect.y);
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const g = sorted[i + 1].rect.y - (sorted[i].rect.y + sorted[i].rect.h);
    gaps.push({
      from: sorted[i].index,
      to: sorted[i + 1].index,
      y1: sorted[i].rect.y + sorted[i].rect.h,
      y2: sorted[i + 1].rect.y,
      px: Math.round(g),
      logicalPx: Math.round(g / hScale),
    });
  }
  const minGapLogical = Math.min(...gaps.map((g) => g.logicalPx));
  const maxGapLogical = Math.max(...gaps.map((g) => g.logicalPx));
  const gapSpreadLogical = maxGapLogical - minGapLogical;

  // 左右双翼总体视觉墨重比与最窄翼每行字数
  const totalLeftInk = bands.reduce((s, b) => s + b.leftInk, 0);
  const totalRightInk = bands.reduce((s, b) => s + b.rightInk, 0);
  const leftShare = totalLeftInk / Math.max(1, totalLeftInk + totalRightInk);
  const wingImbalancePct = Math.round(Math.abs(leftShare - 0.5) * 200); // 0 = 完美均等，100 = 全压一侧
  const wingHeavySide = leftShare > 0.5 ? "左翼" : "右翼";
  const singleSidedCount = bands.filter((b) => b.mode !== "both").length;

  const axisOffsetPct = Math.round(Math.abs(actualAxisRatio - 0.5) * 100);
  const axisDir = actualAxisRatio < 0.5 ? "左偏" : "右偏";
  const spineWidthPct = Math.round(state.spineWidth * 100);

  // 用参考宽度 960 计算客观可读每行字数（避免 390px 手机画布本身窄就误判合法方案失败）
  const refInnerW = 960 - 76;
  const refSpineW = refInnerW * state.spineWidth;
  const refSpineLeft = refInnerW * actualAxisRatio - refSpineW / 2;
  const refSpineRight = refSpineLeft + refSpineW;
  const refLeftWingW = Math.max(12, refSpineLeft - 18 - 44 - 14 - state.clearance);
  const refRightWingW = Math.max(12, refInnerW - refSpineRight - 18 - state.clearance);
  const minWingChars = Math.max(1, Math.floor(Math.min(refLeftWingW, refRightWingW) / 12.5));

  // ---------------- 4 大原理双向评估（8 类真错态） ----------------
  const faults = [];

  // 1. 中央轴心（轴偏 / 过细 / 过宽）
  let axisCheck = { ok: true, badge: `居中 50% · 柱 ${spineWidthPct}%`, tone: "ok" };
  if (axisOffsetPct > 5) {
    axisCheck = { ok: false, badge: `${axisDir} ${axisOffsetPct}%`, tone: "err" };
    faults.push({
      id: "axis-skew",
      pillar: "axis",
      priority: 1,
      short: `${axisDir} ${axisOffsetPct}%`,
      title: `纵向中轴${axisDir}了 ${axisOffsetPct}%，整个骨架重心歪掉了`,
      why: `纵中横排靠居中垂轴统一上下。现在中轴偏离圆晕中心 ${axisOffsetPct}%，${actualAxisRatio < 0.5 ? "左" : "右"}翼被挤成局促窄条，对侧却悬空过长，对称秩序立刻瓦解。`,
      how: "左右横拖画布上的纯白中柱，把它归正到 50% 圆晕中央（偏差 ≤ 5%）。",
      cta: "把中轴归正至 50%",
      fix: { axisX: 0.50 },
    });
  } else if (spineWidthPct < 10.5) {
    axisCheck = { ok: false, badge: `柱过细 ${spineWidthPct}%`, tone: "err" };
    faults.push({
      id: "spine-thin",
      pillar: "axis",
      priority: 2,
      short: `柱过细 ${spineWidthPct}%`,
      title: `中轴白柱仅占宽度的 ${spineWidthPct}%，太单薄立不住`,
      why: "竖向中柱是全页的脊梁。柱宽低于 11% 时，竖排主标被迫缩成细绳，压不住四条横向信息带的体量，纵中不再为骨。",
      how: "把「中柱宽度」调到 12%–24% 之间，给竖排标题留足气场。",
      cta: "加宽中柱至 16%",
      fix: { spineWidth: 0.16 },
    });
  } else if (spineWidthPct > 25) {
    axisCheck = { ok: false, badge: `柱过宽 ${spineWidthPct}%`, tone: "err" };
    faults.push({
      id: "spine-wide",
      pillar: "axis",
      priority: 2,
      short: `柱过宽 ${spineWidthPct}%`,
      title: `中轴白柱胖到 ${spineWidthPct}%，把左右两翼挤碎了`,
      why: `中柱吃掉超过四分之一的版宽后，最窄一翼只剩约 ${minWingChars} 字/行，横向信息带被迫频繁断行，彻底失去「横向展开」的扫读顺滑感。`,
      how: "把「中柱宽度」收回到 12%–23%，把呼吸感还给左右双翼。",
      cta: "收窄中柱至 16%",
      fix: { spineWidth: 0.16 },
    });
  }

  // 2. 交叉结构（吃字 / 断联 / 缺引连）
  let crossCheck = { ok: true, badge: `净空 ${physicalClearanceLogical}px · 虚线连`, tone: "ok" };
  if (physicalClearanceLogical < 10) {
    crossCheck = { ok: false, badge: `吃字 ${physicalClearanceLogical}px`, tone: "err" };
    faults.push({
      id: "cross-chomp",
      pillar: "cross",
      priority: 1.2,
      short: `交口仅 ${physicalClearanceLogical}px`,
      title: `横带交口只留了 ${physicalClearanceLogical}px，白柱直接压进横排文字`,
      why: "横向带穿过纵向白柱时，交界处必须留足避柱净空并用引点收束。净空低于 10px，中柱阴影和边线会切碎行尾汉字，视觉在十字路口硬生生撞车。",
      how: "把「避柱净空」拉到 16–36px，并开启原海报的「虚线引连」把左右两翼轻轻接通。",
      cta: "拉开净空至 24px 并开虚线",
      fix: { clearance: 24, tethers: true },
    });
  } else if (physicalClearanceLogical > 46 && !state.tethers) {
    crossCheck = { ok: false, badge: `脱钩 ${physicalClearanceLogical}px`, tone: "err" };
    faults.push({
      id: "cross-detached",
      pillar: "cross",
      priority: 2.3,
      short: `两翼脱钩 ${physicalClearanceLogical}px`,
      title: `避柱净空拉到 ${physicalClearanceLogical}px 且关了虚线，左右两翼彻底断联`,
      why: "避让不等于割裂。中柱两侧出现巨大白沟又没有任何引线或圆点桥接时，格式塔邻近性失效，读者会把左右看成两张毫无关系的分栏清单。",
      how: "把「避柱净空」收回 16–36px，或开启原海报的青绿/珊瑚「虚线引连」。",
      cta: "收回净空至 24px 并接通虚线",
      fix: { clearance: 24, tethers: true },
    });
  } else if (!state.tethers && physicalClearanceLogical > 32) {
    crossCheck = { ok: false, badge: `缺引连 · ${physicalClearanceLogical}px`, tone: "err" };
    faults.push({
      id: "cross-notether",
      pillar: "cross",
      priority: 3.1,
      short: `宽缝缺引连`,
      title: `净空已达 ${physicalClearanceLogical}px 却没有虚线引点，视线跨柱发虚`,
      why: "当横带文字退离中柱超过 32px，人眼跳过宽白柱寻找右翼对应项时容易串行。原海报用「青绿圆点---白柱---珊瑚圆点」把同一行牢牢锁住。",
      how: "打开「虚线引连」开关，或把净空适度收紧至 18–28px。",
      cta: "开启原海报虚线引连",
      fix: { tethers: true },
    });
  } else if (!state.tethers) {
    crossCheck = { ok: true, badge: `净空 ${physicalClearanceLogical}px · 纯白桥`, tone: "ok" };
  }

  // 3. 横向展开（挤撞 / 散乱 / 左右翼失衡）
  let bandsCheck = { ok: true, badge: `均缝 ${minGapLogical}px · 均衡`, tone: "ok" };
  if (minGapLogical < 9) {
    bandsCheck = { ok: false, badge: `挤撞 ${minGapLogical}px`, tone: "err" };
    faults.push({
      id: "bands-collide",
      pillar: "bands",
      priority: 1.5,
      short: `横带挤撞 ${minGapLogical}px`,
      title: `相邻横带只剩 ${minGapLogical}px 缝隙，两条信息粘成一团`,
      why: "横向展开靠等距留白切出清晰的阅读阶梯。两条纯白横带挤到一起后，左翼圆徽与正文边界糊成一片，扫读节奏立刻卡壳。",
      how: "上下拖动画布上标红的横带拉开呼吸缝，或点击下方「匀齐四带」。",
      cta: "匀齐四条横带间距",
      fix: { bandY: [...EVEN_BAND_Y] },
    });
  } else if (gapSpreadLogical > 26) {
    bandsCheck = { ok: false, badge: `间距散差 ${gapSpreadLogical}px`, tone: "err" };
    faults.push({
      id: "bands-uneven",
      pillar: "bands",
      priority: 2.5,
      short: `带距差 ${gapSpreadLogical}px`,
      title: `四条横带间距极差达 ${gapSpreadLogical}px，纵向节奏脱节`,
      why: `最窄带缝只有 ${minGapLogical}px，最宽处却空出 ${maxGapLogical}px。远近悬殊会让掉队的横带看起来像另一组脚注，破坏四段并列关系。`,
      how: "上下拖动偏离的横带，让三条带缝的落差收进 26px 以内。",
      cta: "匀齐四条横带间距",
      fix: { bandY: [...EVEN_BAND_Y] },
    });
  } else if (wingImbalancePct > 22 || singleSidedCount >= 2) {
    bandsCheck = { ok: false, badge: `${wingHeavySide}过重 ${wingImbalancePct}%`, tone: "err" };
    faults.push({
      id: "wings-lopsided",
      pillar: "bands",
      priority: 2.6,
      short: `${wingHeavySide}失重`,
      title: `有 ${singleSidedCount} 条横带单侧堆砌，${wingHeavySide}墨量失衡`,
      why: "纵中横排好比天平：中轴立在正中，左右双翼必须体量相称。把多条内容全压到同一边，另一侧大片空悬，页面会明显向重侧倾倒。",
      how: "直接点击画布上虚线空翼槽，把单侧堆砌的横带恢复为双翼展开。",
      cta: "一键配平左右双翼",
      fix: { bandMode: ["both", "both", "both", "both"] },
    });
  }

  // 4. 重点突出（主次拉平 / 翼宽过窄碎行）
  let emphasisCheck = { ok: true, badge: `字比 ${actualHierarchyRatio}× · 翼宽 ${minWingChars}字`, tone: "ok" };
  if (actualHierarchyRatio < 1.75) {
    emphasisCheck = { ok: false, badge: `字比平 ${actualHierarchyRatio}×`, tone: "err" };
    faults.push({
      id: "hierarchy-flat",
      pillar: "emphasis",
      priority: 1.8,
      short: `字比仅 ${actualHierarchyRatio}×`,
      title: `中柱竖标与横带字号比只有 ${actualHierarchyRatio}×，主轴镇不住全场`,
      why: "如果中央竖标只比两侧小标题大一点点，眼睛一进来会在四条横带里乱转，找不到第一落点，「纵中为骨」的统领感就消失了。",
      how: "把「主次字比」向右推到 1.9× 以上，让竖向主轴一眼成为绝对主角。",
      cta: "拉大中柱主标至 2.5×",
      fix: { spineScale: 2.55 },
    });
  } else if (minWingChars < 5) {
    emphasisCheck = { ok: false, badge: `翼窄 ${minWingChars}字/行`, tone: "err" };
    faults.push({
      id: "wing-cramped",
      pillar: "emphasis",
      priority: 2.4,
      short: `侧翼仅 ${minWingChars} 字/行`,
      title: `最窄侧翼只能排约 ${minWingChars} 个汉字，横向阅读被切碎`,
      why: "中柱过宽、轴偏或避柱净空过大叠加起来，把侧翼压成窄条，读者每看两三个字就要换行回扫，横向展开的优势完全丧失。",
      how: "把中轴居中并适当收窄中柱或避柱净空，让每翼至少容纳 6 个汉字以上。",
      cta: "舒展双翼宽度",
      fix: { axisX: 0.50, spineWidth: 0.16, clearance: 24 },
    });
  }

  faults.sort((a, b) => a.priority - b.priority);
  const checks = { axis: axisCheck, bands: bandsCheck, cross: crossCheck, emphasis: emphasisCheck };
  const passCount = Object.values(checks).filter((c) => c.ok).length;

  let verdict;
  if (passCount === 4) {
    let archetype = "自定义均衡解";
    if (spineWidthPct >= 19) archetype = "宽柱纪念碑解";
    else if (spineWidthPct <= 13.5 && physicalClearanceLogical >= 28) archetype = "细脊长翼解";
    else archetype = "标准海报对称解";

    verdict = {
      pass: true,
      short: `4/4 · ${archetype}`,
      title: `纵横贯通：${archetype}已成立`,
      why: `中轴稳居中央（偏离仅 ${axisOffsetPct}%），白柱宽 ${spineWidthPct}% 且字比达 ${actualHierarchyRatio}×，交口留足 ${physicalClearanceLogical}px 避柱净空，四带均缝、左右翼体量平衡——视线先沿中柱贯通主题，再顺横带平稳展开。`,
      how: "你可以继续拖动中柱、上下挪带，或点右侧「主动试错」亲自测试偏轴、吃字、宽柱和断联四种崩坏边界。",
      cta: "切换下一合法解",
      fix: spineWidthPct >= 19 ? PRESETS.airy.patch : spineWidthPct <= 13.5 ? PRESETS.classic.patch : PRESETS.monument.patch,
      statusMood: "纵中为骨 · 横排为翼（示意）",
    };
  } else {
    const top = faults[0];
    verdict = {
      pass: false,
      short: `${passCount}/4 · ${top.short}`,
      title: top.title,
      why: top.why,
      how: top.how,
      cta: top.cta,
      fix: top.fix,
      statusMood: passCount === 0 ? "四重失序（示意）" : passCount <= 2 ? "骨架松动（示意）" : "仅差一处收口（示意）",
    };
  }

  const leftFr = Math.round(actualAxisRatio * 100 - state.spineWidth * 50);
  const rightFr = Math.max(10, 100 - leftFr - spineWidthPct);
  const cssSnippet = `.axial-spread { display: grid; grid-template-columns: ${leftFr}fr ${spineWidthPct}fr ${rightFr}fr; column-gap: ${physicalClearanceLogical}px; } .spine { writing-mode: vertical-rl; font-size: ${actualHierarchyRatio}em; }`;

  return {
    W,
    H,
    compact,
    padX,
    padY,
    spineRect,
    spineFontPx,
    bandTitlePx,
    bandBodyPx,
    bands,
    gaps,
    checks,
    faults,
    passCount,
    verdict,
    metrics: {
      axisOffsetPct,
      axisDir,
      axisRatioPct: Math.round(actualAxisRatio * 100),
      spineWidthPct,
      clearancePx: physicalClearanceLogical,
      minGapLogical,
      gapSpreadLogical,
      wingImbalancePct,
      wingHeavySide,
      hierarchyRatio: actualHierarchyRatio,
      minWingChars,
      cssSnippet,
    },
  };
}
