// 213 横排右起 · 单真源几何、视觉重心与阅读流解算模型
// 所有画面坐标、右缘散差、重心落点、阅读顺序、4 步流程灯、4 项设计要点与白话诊单全部由此唯一派生。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·臻选好物",
    shortLabel: "原海报",
    badge: "★ 新品上市",
    titleLines: ["臻选好物", "品质生活"],
    sub: "用心挑选，只为更好的你",
    aux: [
      { icon: "truck", zh: "高效配送", en: "EFFICIENT DELIVERY" },
      { icon: "shield", zh: "品质保障", en: "QUALITY ASSURANCE" },
      { icon: "headset", zh: "专业服务", en: "PROFESSIONAL SERVICE" },
    ],
  },
  gallery: {
    id: "gallery",
    label: "器物展·素陶茶境",
    shortLabel: "器物展",
    badge: "★ 秋季特展",
    titleLines: ["素陶茶境", "器物本色"],
    sub: "景德镇柴烧与当代器物联展",
    aux: [
      { icon: "calendar", zh: "展期安排", en: "OCT 12 — NOV 28" },
      { icon: "pin", zh: "展厅位置", en: "EAST HALL · 2F" },
      { icon: "book", zh: "预约导览", en: "GUIDED CURATION" },
    ],
  },
  tea: {
    id: "tea",
    label: "茶礼封·秋分白茶",
    shortLabel: "节气茶礼",
    badge: "★ 时令头采",
    titleLines: ["山场白茶", "慢焙留香"],
    sub: "高山荒野老树，日光自然萎凋",
    aux: [
      { icon: "mountain", zh: "海拔溯源", en: "800M ORIGIN" },
      { icon: "leaf", zh: "日光萎凋", en: "SUN WITHERED" },
      { icon: "box", zh: "礼盒定制", en: "BESPOKE GIFT" },
    ],
  },
};

export const PRESETS = {
  // 开场刻意停在多重复合错态（绝不先给答案）：
  // 主标偏左且左对齐 + 辅助信息抢占右侧原点 + 波点反向右推 + 权重拉平
  broken: {
    focalX: 0.42,
    auxX: 0.84,
    pullSpan: 0.34,
    align: "left",
    pullMode: "right",
    weightMode: "flat",
    selected: "focal",
  },
  // 多组合法解之一：忠实复刻 213 原海报经典比例
  classic: {
    focalX: 0.89,
    auxX: 0.14,
    pullSpan: 0.36,
    align: "right",
    pullMode: "left",
    weightMode: "strong",
    selected: "focal",
  },
  // 合法解之二：宽境展签大留白解（右锚微内收、波点拉长、节奏更舒缓）
  gallerySol: {
    focalX: 0.87,
    auxX: 0.12,
    pullSpan: 0.44,
    align: "right",
    pullMode: "left",
    weightMode: "strong",
    selected: "focal",
  },
  // 合法解之三：紧凑商品卡解（主次更贴近但不压叠，右锚清晰、波点短促）
  compactSol: {
    focalX: 0.91,
    auxX: 0.24,
    pullSpan: 0.24,
    align: "right",
    pullMode: "left",
    weightMode: "strong",
    selected: "focal",
  },
  // 试错：左重右轻（把横排右起排成了左起）
  errLeft: {
    focalX: 0.34,
    auxX: 0.82,
    pullSpan: 0.32,
    align: "left",
    pullMode: "right",
    weightMode: "strong",
    selected: "focal",
  },
  // 试错：居中平权（没有单侧起点，主次一般重）
  errCenter: {
    focalX: 0.62,
    auxX: 0.22,
    pullSpan: 0.30,
    align: "center",
    pullMode: "flat",
    weightMode: "flat",
    selected: "focal",
  },
  // 试错：紧贴右边界窒息
  errEdge: {
    focalX: 0.985,
    auxX: 0.15,
    pullSpan: 0.36,
    align: "right",
    pullMode: "left",
    weightMode: "strong",
    selected: "focal",
  },
};

export function createInitialState() {
  return {
    sceneId: "poster",
    ...PRESETS.broken,
    showGuides: true,
    showFlow: true,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 估算字符单元宽（中文全角 ≈ 1.0，英文/数字/符号 ≈ 0.56），保证在脱离 DOM 时仍与实绘像素严格对齐
function visualUnits(str) {
  let u = 0;
  for (const ch of str) {
    u += ch.charCodeAt(0) > 0x2e80 ? 1.0 : 0.56;
  }
  return u;
}

/**
 * 根据真实画布宽高与当前状态，单真源解算所有矩形、右缘散差、视觉重心、交叠率、阅读流节点与诊单。
 */
export function computeLayout(state, width, height) {
  const W = Math.max(300, width);
  const H = Math.max(190, height);
  const scene = SCENES[state.sceneId] || SCENES.poster;
  const compact = W < 540;

  // 1. 字体尺度：随权重模式与画布尺寸等比缩放（绝不变形）
  const baseUnit = clamp(W * (compact ? 0.095 : 0.056), 24, 58);
  let titleSize, subSize, badgeSize, auxTitleSize, auxSubSize;
  if (state.weightMode === "strong") {
    titleSize = Math.round(baseUnit * 0.96);
    subSize = Math.round(clamp(titleSize * 0.34, 11.5, 17));
    badgeSize = Math.round(clamp(titleSize * 0.32, 11, 16));
    auxTitleSize = Math.round(clamp(titleSize * 0.30, 11, 15));
    auxSubSize = Math.round(clamp(auxTitleSize * 0.68, 9.5, 11));
  } else if (state.weightMode === "flat") {
    titleSize = Math.round(baseUnit * 0.64);
    subSize = Math.round(clamp(titleSize * 0.44, 11.5, 15));
    badgeSize = Math.round(clamp(titleSize * 0.42, 11, 14.5));
    auxTitleSize = Math.round(clamp(titleSize * 0.54, 13, 18.5));
    auxSubSize = Math.round(clamp(auxTitleSize * 0.62, 9.5, 11.5));
  } else {
    // inverted：辅助比主标还重
    titleSize = Math.round(baseUnit * 0.56);
    subSize = Math.round(clamp(titleSize * 0.44, 11, 14));
    badgeSize = Math.round(clamp(titleSize * 0.42, 10.5, 13.5));
    auxTitleSize = Math.round(clamp(titleSize * 0.68, 15, 22));
    auxSubSize = Math.round(clamp(auxTitleSize * 0.58, 9.5, 12));
  }

  // 2. 焦点主标块（① + ②）的真实各行宽度与高度
  const titleLineWidths = scene.titleLines.map((t) => Math.round(visualUnits(t) * titleSize * 1.04));
  const badgeW = Math.round(visualUnits(scene.badge) * badgeSize * 1.06);
  const subW = Math.round(visualUnits(scene.sub) * subSize * 1.02);
  const barW = Math.round(clamp(titleSize * 1.25, 34, 62));

  const focalW = Math.max(...titleLineWidths, badgeW, subW, 120);
  const lineGap = Math.round(titleSize * 1.18);
  const badgeH = Math.round(badgeSize * 1.35);
  const barH = 4;
  const subH = Math.round(subSize * 1.45);
  const padGap1 = Math.round(titleSize * 0.26);
  const padGap2 = Math.round(titleSize * 0.24);
  const padGap3 = Math.round(titleSize * 0.24);
  const focalH = badgeH + padGap1 + lineGap * 2 + padGap2 + barH + padGap3 + subH;

  // focalX 表示焦点块的右缘位置（0–1）；受限于画布左右内界
  const minFocalRight = focalW + 12;
  const maxFocalRight = W - 4;
  const rawFocalRight = clamp(state.focalX * W, minFocalRight, maxFocalRight);
  const focalLeft = rawFocalRight - focalW;
  const usableTop = 30;
  const usableH = H - usableTop - 26;
  const focalTop = Math.round(usableTop + Math.max(4, (usableH - focalH) * 0.5));

  // 各行在 focalBox 内的水平落点（由 align 严格决定）
  const scatterOffsets = [0, -Math.round(focalW * 0.16), -Math.round(focalW * 0.08), -Math.round(focalW * 0.22)];
  const placeLine = (lineW, idx) => {
    if (state.align === "right") return rawFocalRight - lineW;
    if (state.align === "left") return focalLeft;
    if (state.align === "center") return focalLeft + (focalW - lineW) * 0.5;
    // scatter：每行起止故意参差错落
    return clamp(rawFocalRight - lineW + scatterOffsets[idx % scatterOffsets.length], 8, W - lineW - 4);
  };

  const badgeRect = {
    x: placeLine(badgeW, 0),
    y: focalTop,
    w: badgeW,
    h: badgeH,
    text: scene.badge,
  };
  const titleRects = scene.titleLines.map((text, i) => ({
    x: placeLine(titleLineWidths[i], i + 1),
    y: focalTop + badgeH + padGap1 + i * lineGap,
    w: titleLineWidths[i],
    h: titleSize * 1.06,
    text,
  }));
  const barRect = {
    x: placeLine(barW, 2),
    y: focalTop + badgeH + padGap1 + lineGap * 2 + padGap2 * 0.4,
    w: barW,
    h: barH,
  };
  const subRect = {
    x: placeLine(subW, 3),
    y: barRect.y + barH + padGap3,
    w: subW,
    h: subH,
    text: scene.sub,
  };

  // 实测右缘散差：以焦点块名义右轴（各行最靠右的右缘）为基准，测量全部文本行右缘的最大差值
  const rightEdges = [
    badgeRect.x + badgeRect.w,
    titleRects[0].x + titleRects[0].w,
    titleRects[1].x + titleRects[1].w,
    subRect.x + subRect.w,
  ];
  const anchorRightX = Math.max(...rightEdges);
  const minRightEdge = Math.min(...rightEdges);
  const rightEdgeSpreadPx = Math.round(anchorRightX - minRightEdge);

  const focalBox = {
    x: Math.min(badgeRect.x, titleRects[0].x, titleRects[1].x, subRect.x),
    y: focalTop,
    w: anchorRightX - Math.min(badgeRect.x, titleRects[0].x, titleRects[1].x, subRect.x),
    h: focalH,
    right: anchorRightX,
    centerX: (Math.min(badgeRect.x, titleRects[0].x, titleRects[1].x, subRect.x) + anchorRightX) * 0.5,
    centerY: focalTop + focalH * 0.5,
  };

  // 3. 辅助信息列（④：三组图标+说明）
  const iconBoxSize = Math.round(clamp(auxTitleSize * 1.75, 22, 34));
  const auxTextW = Math.max(
    ...scene.aux.map((a) => Math.max(visualUnits(a.zh) * auxTitleSize * 1.05, visualUnits(a.en) * auxSubSize * 0.92))
  );
  const auxW = Math.round(iconBoxSize + 10 + auxTextW + 8);
  const auxRowH = Math.round(clamp(iconBoxSize + 12, 34, 48));
  const auxGap = Math.round(clamp(H * 0.045, 8, 16));
  const auxH = auxRowH * 3 + auxGap * 2;
  const auxCenterX = clamp(state.auxX * W, auxW * 0.5 + 10, W - auxW * 0.5 - 10);
  const auxLeft = Math.round(auxCenterX - auxW * 0.5);
  const auxTop = Math.round(usableTop + Math.max(4, (usableH - auxH) * 0.5));
  const auxBox = {
    x: auxLeft,
    y: auxTop,
    w: auxW,
    h: auxH,
    right: auxLeft + auxW,
    centerX: auxCenterX,
    centerY: auxTop + auxH * 0.5,
    iconSize: iconBoxSize,
    rowH: auxRowH,
    rowGap: auxGap,
  };

  // 4. 中段半调波点牵引带（③）：位于两模块之间或按用户拖定的跨度锚在焦点左侧
  const spanPx = clamp(state.pullSpan * W, W * 0.16, W * 0.52);
  let pullRight, pullLeft;
  if (focalBox.centerX >= auxBox.centerX) {
    // 主标在右、辅助在左：波点自然衔接在主标左侧并向左铺展
    pullRight = clamp(focalBox.x - 10, W * 0.25, W - 18);
    pullLeft = clamp(pullRight - spanPx, Math.max(14, auxBox.right - 22), pullRight - 70);
  } else {
    // 坏态（辅助跑到了右边）：波点夹在主标右缘与辅助之间，避免盖住辅助文字
    pullLeft = clamp(focalBox.right + 10, 18, W * 0.70);
    const maxSafeRight = Math.max(pullLeft + 42, auxBox.x - 10);
    pullRight = clamp(pullLeft + spanPx, pullLeft + 42, Math.min(maxSafeRight, W - 16));
  }
  const pullTop = Math.max(38, Math.round(H * 0.19));
  const pullH = Math.round(H * 0.55);
  const pullBox = {
    x: pullLeft,
    y: pullTop,
    w: Math.max(56, pullRight - pullLeft),
    h: pullH,
    right: Math.max(pullLeft + 56, pullRight),
    centerX: (pullLeft + Math.max(pullLeft + 56, pullRight)) * 0.5,
    centerY: pullTop + pullH * 0.5,
  };

  // 5. 实测碰撞交叠面积（主标与辅助列）
  const ovX = Math.max(0, Math.min(focalBox.right, auxBox.right) - Math.max(focalBox.x, auxBox.x));
  const ovY = Math.max(0, Math.min(focalBox.y + focalBox.h, auxBox.y + auxBox.h) - Math.max(focalBox.y, auxBox.y));
  const overlapArea = ovX * ovY;
  const minArea = Math.min(focalBox.w * focalBox.h, auxBox.w * auxBox.h);
  const overlapPct = minArea > 0 ? Math.round((overlapArea / minArea) * 100) : 0;
  const overlapRect = overlapArea > 0
    ? {
        x: Math.max(focalBox.x, auxBox.x),
        y: Math.max(focalBox.y, auxBox.y),
        w: ovX,
        h: ovY,
      }
    : null;

  // 6. 实测视觉权重与版面视觉重心（面积 × 墨度密度加权示意）
  const focalInkMass =
    (titleLineWidths[0] + titleLineWidths[1]) * titleSize * 0.58 +
    badgeW * badgeSize * 0.36 +
    subW * subSize * 0.24;
  const auxInkMass =
    auxBox.w * (auxTitleSize * 0.42 + auxSubSize * 0.22) * 3 * (state.weightMode === "inverted" ? 1.45 : state.weightMode === "flat" ? 1.18 : 0.72);
  const pullInkMass = state.pullMode === "none" ? 0 : pullBox.w * pullBox.h * 0.032;
  const pullBiasX =
    state.pullMode === "left"
      ? pullBox.x + pullBox.w * 0.68
      : state.pullMode === "right"
        ? pullBox.x + pullBox.w * 0.32
        : pullBox.centerX;

  const totalMass = focalInkMass + auxInkMass + pullInkMass;
  const gravityX = (focalBox.centerX * focalInkMass + auxBox.centerX * auxInkMass + pullBiasX * pullInkMass) / totalMass;
  const gravityPct = Math.round((gravityX / W) * 100);
  const weightRatio = +(focalInkMass / Math.max(1, auxInkMass)).toFixed(2);
  const rightMarginPct = +(((W - focalBox.right) / W) * 100).toFixed(1);
  const focalCenterPct = Math.round((focalBox.centerX / W) * 100);
  const auxCenterPct = Math.round((auxBox.centerX / W) * 100);

  // 7. 核算 7 类双向真错态
  const issues = [];
  const auxStoleRight = auxBox.centerX > focalBox.centerX - 10;
  const focalTooLeft = focalCenterPct < 60;
  const focalSqueezedRight = rightMarginPct < 3.6;
  const edgeNotAligned = rightEdgeSpreadPx > 6;
  const hasOverlap = overlapPct >= 6;
  const pullWrong = state.pullMode === "right" || state.pullMode === "flat";
  const pullMissingOnWide = state.pullMode === "none" && (focalBox.x - auxBox.right) > W * 0.28;
  const weightWeak = weightRatio < 1.55;

  if (hasOverlap) {
    issues.push({
      id: "overlap",
      severity: 100,
      badge: `压叠 ${overlapPct}%`,
      title: `主标与辅助信息撞车，遮挡达 ${overlapPct}%`,
      why: "横排右起靠「右锚—过渡—左辅」拉开节奏。两个模块一旦撞在一起，焦点字形被图标和说明切碎，眼睛分不清哪一层在前面。",
      action: "把辅助信息往左拖开，或把主标题推回画幅右侧区域。",
      fixLabel: "拉开模块归位右锚",
      fixPreset: "classic",
    });
  }
  if (auxStoleRight) {
    issues.push({
      id: "auxStoleRight",
      severity: 95,
      badge: "次要抢右",
      title: `辅助信息（${auxCenterPct}% 处）反客为主，抢占了右侧原点`,
      why: "213「横排右起」要求最先阅读的焦点信息坐镇最右端。现在三条服务说明跑到了大标题右边，读者视线被迫在右侧先读次要项，再往左折返找主题，层级完全倒挂。",
      action: "把主标题拖向右侧（70%–90% 处），同时把左侧服务说明拖回画幅左缘。",
      fixLabel: "归位右侧焦点原点",
      fixPreset: "classic",
    });
  }
  if (focalTooLeft && !auxStoleRight) {
    issues.push({
      id: "focalLeft",
      severity: 90,
      badge: `原点偏左 ${focalCenterPct}%`,
      title: `主标题中心滑到了 ${focalCenterPct}%，右侧原点落空`,
      why: "横排右起的视觉支点必须在画幅右半侧。现在大标题停在中偏左位置，右侧空荡荡地悬着，版面实际上退化成了普通的横排左起或居中构图。",
      action: "直接向右拖动主标题块（或按方向键 →），让它的右缘稳稳落在画幅右侧。",
      fixLabel: "推回右侧原点",
      fixPreset: "classic",
    });
  }
  if (focalSqueezedRight) {
    issues.push({
      id: "squeezedRight",
      severity: 82,
      badge: `贴边窒息 ${rightMarginPct}%`,
      title: `主标题右缘距边框只剩 ${rightMarginPct}%，右侧留白被挤死`,
      why: "把原点锚在右侧，不等于把字硬贴在右边框上。缺少 5%–12% 的外侧留白呼吸区，大字会产生撞墙压迫感，焦点反而显得局促。",
      action: "把主标题轻轻向左退回一点，在右侧留出干净的呼吸边界。",
      fixLabel: "退留右侧呼吸边",
      fixPreset: "classic",
    });
  }
  if (edgeNotAligned) {
    const alignName = state.align === "left" ? "左对齐" : state.align === "center" ? "居中对齐" : "错散排布";
    issues.push({
      id: "edgeScatter",
      severity: 78,
      badge: `右缘散差 ${rightEdgeSpreadPx}px`,
      title: `焦点块用了「${alignName}」，右侧基准线散差达 ${rightEdgeSpreadPx}px`,
      why: "横排右起靠右侧一条干净整齐的垂线建立起读基准。眉标、主标、副标右缘凹凸不齐时，右侧锚点立刻松散漏气，视线在右边找不到稳固的靠山。",
      action: "在对齐栏切回「右对齐」，让所有焦点行严丝合缝贴紧右侧基准线。",
      fixLabel: "切换焦点块为右对齐",
      fixPatch: { align: "right" },
    });
  }
  if (pullWrong) {
    issues.push({
      id: "pullWrong",
      severity: 70,
      badge: state.pullMode === "right" ? "波点逆拉" : "点阵无向",
      title: state.pullMode === "right"
        ? "中段波点阵左浓右淡，把视线硬生生往反方向拉"
        : "中段波点阵平铺均布，成了没有方向感的背景噪点",
      why: "213 原海报中段那片粉红波点不是装饰花纹，而是一道「向右密、向左淡」的梯度牵引桥——眼睛落到右标后，顺着渐淡的圆点自然向左滑向辅助信息。方向装反就会顶回视线。",
      action: "把波点牵引切为「向左渐散」，让圆点从主标左侧由密渐疏地引向左端。",
      fixLabel: "改为向左渐散波点",
      fixPatch: { pullMode: "left" },
    });
  } else if (pullMissingOnWide) {
    issues.push({
      id: "pullGap",
      severity: 62,
      badge: "中段断桥",
      title: "主标与辅助相距过远，中段缺少向左延展的视觉过渡",
      why: "横幅左右拉得很开却关掉了中段波点桥，右侧主标与左侧三行服务之间留出大片空白鸿沟，容易被看成两块毫不相干的贴纸。",
      action: "开启「向左渐散」波点桥，或把辅助信息略微往中间靠拢。",
      fixLabel: "开启向左渐散波点桥",
      fixPatch: { pullMode: "left" },
    });
  }
  if (weightWeak) {
    issues.push({
      id: "weightWeak",
      severity: 65,
      badge: `权重比 ${weightRatio}×`,
      title: state.weightMode === "inverted"
        ? `左侧辅助比主标还重（权重比 ${weightRatio}×），主次彻底倒置`
        : `主标与辅助权重过近（${weightRatio}×），缺少右侧焦点反差`,
      why: "在习惯左起阅读的中文环境里，只有让右侧焦点在体量与墨重上明显压住左侧辅助（经验比 ≥ 1.6×），眼睛才会乖乖先落向右端。",
      action: "把层级权重调回「右重左轻」，让主标题稳稳压住全场。",
      fixLabel: "恢复右重左轻层级",
      fixPatch: { weightMode: "strong" },
    });
  }

  // 8. 计算真实视线流经序列与折返次数（用于画布视线轨迹与上方 ①②③④ 活体流程带）
  const firstLand = state.weightMode === "inverted" || auxStoleRight ? (auxStoleRight ? "aux" : "aux") : "focal";
  const pathPoints = [];
  if (firstLand === "focal") {
    pathPoints.push({ step: 1, x: focalBox.right - Math.min(28, focalBox.w * 0.14), y: titleRects[0].y + titleSize * 0.5, label: "首落焦点" });
    pathPoints.push({ step: 2, x: subRect.x + subRect.w * 0.5, y: subRect.y + subRect.h * 0.5, label: "副标承接" });
    if (state.pullMode !== "none") {
      pathPoints.push({ step: 3, x: pullBox.centerX, y: pullBox.centerY, label: "中段牵引" });
    }
    pathPoints.push({ step: 4, x: auxBox.centerX, y: auxBox.centerY, label: "辅助收束" });
  } else {
    // 权重倒置或次要抢右：视线被迫先撞辅助，再折返找主标
    pathPoints.push({ step: 1, x: auxBox.centerX, y: auxBox.centerY, label: "误落辅助" });
    pathPoints.push({ step: 2, x: focalBox.centerX, y: focalBox.centerY, label: "折返主标" });
    pathPoints.push({ step: 3, x: pullBox.centerX, y: pullBox.centerY, label: "中段摇摆" });
    pathPoints.push({ step: 4, x: auxBox.x + 20, y: auxBox.y + auxBox.h - 14, label: "再回辅助" });
  }

  // 计算水平方向折返次数（理想横排右起应单调向左：每一步 dx <= +12px）
  let reversals = 0;
  for (let i = 1; i < pathPoints.length; i++) {
    if (pathPoints[i].x > pathPoints[i - 1].x + 14) reversals++;
  }
  if (state.pullMode === "right") reversals++;

  // 9. 上方 1:1 复刻原海报的 4 步阅读流程节点状态（从右到左：① ← ② ← ③ ← ④）
  const flowNodes = [
    {
      num: 1,
      role: "最先阅读",
      sub: "焦点信息",
      status: !auxStoleRight && !focalTooLeft && !focalSqueezedRight && !weightWeak ? "ok" : "err",
      note: auxStoleRight
        ? "被辅助抢位"
        : focalTooLeft
          ? `偏左 ${focalCenterPct}%`
          : focalSqueezedRight
            ? "紧贴右框"
            : weightWeak
              ? "权重不足"
              : `右锚 ${focalCenterPct}%`,
    },
    {
      num: 2,
      role: "核心内容",
      sub: "主体信息",
      status: !edgeNotAligned && !hasOverlap ? "ok" : "err",
      note: hasOverlap ? `撞框 ${overlapPct}%` : edgeNotAligned ? `右散 ${rightEdgeSpreadPx}px` : "右齐 0px",
    },
    {
      num: 3,
      role: "次要信息",
      sub: "过渡牵引",
      status: !pullWrong && !pullMissingOnWide ? "ok" : "err",
      note: state.pullMode === "right" ? "波点逆拉" : state.pullMode === "flat" ? "点阵无向" : pullMissingOnWide ? "中段断桥" : "向左渐散",
    },
    {
      num: 4,
      role: "最后阅读",
      sub: "辅助信息",
      status: !auxStoleRight && !hasOverlap && !weightWeak ? "ok" : "err",
      note: auxStoleRight ? "越界到右" : hasOverlap ? "压盖主标" : weightWeak ? "反客为主" : `左端 ${auxCenterPct}%`,
    },
  ];

  // 10. 底部 1:1 复刻原海报 4 项「设计要点」实时指示状态
  const principles = [
    {
      id: "origin",
      title: "右侧锚点",
      body: "在右侧建立视觉锚点，明确信息起点。",
      ok: !auxStoleRight && !focalTooLeft && !focalSqueezedRight,
      tag: auxStoleRight ? "被辅助抢右" : focalTooLeft ? `重心偏左 ${focalCenterPct}%` : focalSqueezedRight ? `贴边 ${rightMarginPct}%` : `稳锚 ${focalCenterPct}%`,
    },
    {
      id: "align",
      title: "右对齐为主",
      body: "文字与元素以右对齐建立整齐边缘。",
      ok: !edgeNotAligned,
      tag: edgeNotAligned ? `右缘散差 ${rightEdgeSpreadPx}px` : "右缘齐平 0px",
    },
    {
      id: "pull",
      title: "向左延展",
      body: "内容按重要性向左层级展开。",
      ok: !pullWrong && !pullMissingOnWide && !auxStoleRight && !hasOverlap,
      tag: pullWrong ? (state.pullMode === "right" ? "波点反向" : "点阵均布") : auxStoleRight ? "顺序倒置" : hasOverlap ? "压叠堵路" : "单向流畅",
    },
    {
      id: "emphasis",
      title: "强调焦点",
      body: "通过大小、颜色、留白突出右侧重点。",
      ok: !weightWeak && !focalSqueezedRight,
      tag: weightWeak ? `权重仅 ${weightRatio}×` : focalSqueezedRight ? "缺右侧留白" : `主次 ${weightRatio}×`,
    },
  ];

  const passCount = principles.filter((p) => p.ok).length;
  const isSolved = issues.length === 0;

  // 多组合法解名称辨识
  let solutionVariant = "";
  if (isSolved) {
    if (state.pullSpan >= 0.41 && auxCenterPct <= 16) solutionVariant = "宽境展签留白解";
    else if (auxCenterPct >= 20 && state.pullSpan <= 0.28) solutionVariant = "紧凑商品卡解";
    else solutionVariant = "原海报标准右锚解";
  }

  const primaryIssue = issues[0] || null;
  const diagnosis = isSolved
    ? {
        ok: true,
        badge: `4/4 成立 · ${solutionVariant}`,
        title: `右锚稳立于 ${focalCenterPct}%，视线自右向左一次贯通`,
        why: `主标与副标在右侧严齐（散差 ${rightEdgeSpreadPx}px）、留出 ${rightMarginPct}% 呼吸边，权重达辅助列的 ${weightRatio}×；眼睛进画先锁住右侧大字，再顺着向左渐淡的绯红波点自然滑向左端三项辅助，全程零折返。`,
        action: "你还可以继续试着换一套场景文案，或故意拖动模块/反向波点观察秩序如何崩塌。",
        fixLabel: "复原开场错态再试",
        fixPreset: "broken",
      }
    : {
        ok: false,
        badge: `${passCount}/4 · ${primaryIssue.badge}`,
        title: primaryIssue.title,
        why: primaryIssue.why,
        action: primaryIssue.action,
        fixLabel: primaryIssue.fixLabel,
        fixPreset: primaryIssue.fixPreset || null,
        fixPatch: primaryIssue.fixPatch || null,
      };

  // 视线流畅度档位（绝不用假精确百分数！）
  const flowGrade = isSolved
    ? "顺滑左展（示意）"
    : reversals >= 2 || hasOverlap || auxStoleRight
      ? "严重折返（示意）"
      : "右锚松散（示意）";

  return {
    W,
    H,
    scene,
    sizes: { titleSize, subSize, badgeSize, auxTitleSize, auxSubSize },
    badgeRect,
    titleRects,
    barRect,
    subRect,
    focalBox,
    auxBox,
    pullBox,
    anchorRightX,
    overlapRect,
    metrics: {
      gravityPct,
      focalCenterPct,
      auxCenterPct,
      rightEdgeSpreadPx,
      rightMarginPct,
      overlapPct,
      weightRatio,
      reversals,
      flowGrade,
      passCount,
      issueCount: issues.length,
    },
    pathPoints,
    flowNodes,
    principles,
    issues,
    diagnosis,
    isSolved,
  };
}
