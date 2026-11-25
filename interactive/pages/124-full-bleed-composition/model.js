// 124 满幅构图 · 单真源几何与印前检校模型
// 所有画面比例、出血毫米值、刀偏露白量、视觉面积倍率、文字安全内距与错态诊单均从同一份成品/印张坐标实时核算。

export const SUBJECTS = {
  poster: {
    id: "poster",
    label: "原海报 · 几何满幅",
    shortLabel: "原海报几何",
    medium: "print",
    sheetW: 148,
    sheetH: 192,
    bleedTarget: 3.0,
    bleedMax: 9.0,
    safeMin: 5.0,
    safeMax: 15.0,
    driftX: 1.2,
    driftY: 1.0,
    title: "满幅构图",
    subtitle: "FULL-BLEED · A5 SPECIMEN",
    note: "1:1 承袭 124 原海报的朱橘大圆、深松绿斜域、樱粉深靛斜纹拱柱与暖沙角弧。",
  },
  spread: {
    id: "spread",
    label: "画册跨页 · 建筑实景",
    shortLabel: "画册跨页",
    medium: "print",
    sheetW: 224,
    sheetH: 156,
    bleedTarget: 3.0,
    bleedMax: 9.0,
    safeMin: 6.0,
    safeMax: 16.0,
    driftX: 1.2,
    driftY: 1.0,
    title: "光影长廊",
    subtitle: "ARCHITECTURAL SPREAD · 04–05",
    note: "建筑摄影画册跨页：色块与建筑立面直冲四边，标题退守内安全区且避开装订中缝。",
  },
  mobile: {
    id: "mobile",
    label: "全面屏 · 移动端出血",
    shortLabel: "全面屏出血",
    medium: "screen",
    sheetW: 108,
    sheetH: 196,
    bleedTarget: 0.0,
    bleedMax: 9.0,
    safeMin: 8.0,
    safeMax: 16.0,
    driftX: 0.0,
    driftY: 0.0,
    title: "无界视场",
    subtitle: "VIEWPORT-FIT: COVER",
    note: "全面屏手机没有裁纸刀，但有圆角、状态岛与手势条：视觉满屏，文字守住 safe-area-inset。",
  },
};

export const EDGE_NAMES = {
  top: "上边",
  right: "右边",
  bottom: "下边",
  left: "左边",
};

export const INITIAL_STATE = {
  subject: "poster",
  bleedMm: -14.0,
  edges: { top: true, right: true, bottom: false, left: false },
  textInsetMm: 1.5,
  bladeCut: false,
  showGuides: true,
};

export const PRESETS = {
  print3: {
    id: "print3",
    label: "标准印刷 3mm 解",
    kind: "good",
    patch: {
      subject: "poster",
      bleedMm: 3.5,
      edges: { top: true, right: true, bottom: true, left: true },
      textInsetMm: 8.5,
      bladeCut: true,
    },
  },
  spread5: {
    id: "spread5",
    label: "大幅画册 5mm 解",
    kind: "good",
    patch: {
      subject: "spread",
      bleedMm: 5.0,
      edges: { top: true, right: true, bottom: true, left: true },
      textInsetMm: 11.0,
      bladeCut: true,
    },
  },
  mobileSafe: {
    id: "mobileSafe",
    label: "全面屏安全解",
    kind: "good",
    patch: {
      subject: "mobile",
      bleedMm: 2.0,
      edges: { top: true, right: true, bottom: true, left: true },
      textInsetMm: 11.0,
      bladeCut: true,
    },
  },
  errZeroBleed: {
    id: "errZeroBleed",
    label: "试错：0mm 漏白",
    kind: "bad",
    patch: {
      subject: "poster",
      bleedMm: 0.0,
      edges: { top: true, right: true, bottom: true, left: true },
      textInsetMm: 8.5,
      bladeCut: true,
    },
  },
  errTextCut: {
    id: "errTextCut",
    label: "试错：文字贴边",
    kind: "bad",
    patch: {
      subject: "poster",
      bleedMm: 4.0,
      edges: { top: true, right: true, bottom: true, left: true },
      textInsetMm: 1.0,
      bladeCut: true,
    },
  },
  reset: {
    id: "reset",
    label: "复原 0/4 错态",
    kind: "reset",
    patch: {
      subject: "poster",
      bleedMm: -14.0,
      edges: { top: true, right: true, bottom: false, left: false },
      textInsetMm: 1.5,
      bladeCut: false,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const round1 = (v) => Math.round(v * 10) / 10;

export function cloneState(s = INITIAL_STATE) {
  return {
    subject: s.subject,
    bleedMm: s.bleedMm,
    edges: { ...s.edges },
    textInsetMm: s.textInsetMm,
    bladeCut: s.bladeCut,
    showGuides: s.showGuides,
  };
}

// 从当前状态计算唯一的几何坐标与印前检校结论
export function evaluate(state) {
  const spec = SUBJECTS[state.subject] || SUBJECTS.poster;
  const { sheetW, sheetH, medium, bleedTarget, bleedMax, safeMin, safeMax, driftX, driftY } = spec;

  // 若某一边通边开关未开，该边最多推到 -11mm 留白处，演示残边半出血问题
  const lockedBackMm = -11.0;
  const edgeExt = {
    top: state.edges.top ? state.bleedMm : Math.min(state.bleedMm, lockedBackMm),
    right: state.edges.right ? state.bleedMm : Math.min(state.bleedMm, lockedBackMm),
    bottom: state.edges.bottom ? state.bleedMm : Math.min(state.bleedMm, lockedBackMm),
    left: state.edges.left ? state.bleedMm : Math.min(state.bleedMm, lockedBackMm),
  };

  // 成品净框为 [0..sheetW] × [0..sheetH]，单位 mm
  const artRect = {
    left: -edgeExt.left,
    top: -edgeExt.top,
    right: sheetW + edgeExt.right,
    bottom: sheetH + edgeExt.bottom,
  };

  // 成品框内实绘有效画面面积
  const visL = clamp(artRect.left, 0, sheetW);
  const visR = clamp(artRect.right, 0, sheetW);
  const visT = clamp(artRect.top, 0, sheetH);
  const visB = clamp(artRect.bottom, 0, sheetH);
  const inkArea = Math.max(0, visR - visL) * Math.max(0, visB - visT);
  const trimArea = sheetW * sheetH;
  const fillPct = (inkArea / trimArea) * 100;

  // 对照组：同幅面普通版面（四周 11.5% 留白，1:1 对齐 124 原海报右侧普通版面比例）
  const regMargin = Math.min(sheetW, sheetH) * 0.115;
  const regArea = (sheetW - 2 * regMargin) * (sheetH - 2 * regMargin);
  const regFillPct = (regArea / trimArea) * 100;
  const areaRatio = inkArea / regArea;

  // 机械裁刀偏移后（左移 driftX、上移 driftY）实际落刀窗口
  const cutRect = {
    left: -driftX,
    top: -driftY,
    right: sheetW - driftX,
    bottom: sheetH - driftY,
  };

  // 四边在落刀偏移下的露白宽（mm）
  const sliver = {
    left: Math.max(0, artRect.left - cutRect.left),
    top: Math.max(0, artRect.top - cutRect.top),
    right: Math.max(0, cutRect.right - artRect.right),
    bottom: Math.max(0, cutRect.bottom - artRect.bottom),
  };
  const maxSliver = Math.max(sliver.left, sliver.top, sliver.right, sliver.bottom);

  const extVals = [edgeExt.top, edgeExt.right, edgeExt.bottom, edgeExt.left];
  const minExt = Math.min(...extVals);
  const maxExt = Math.max(...extVals);
  const reachedSides = Object.entries(edgeExt).filter(([, v]) => v >= 0).map(([k]) => k);
  const missingSides = Object.entries(edgeExt).filter(([, v]) => v < 0).map(([k]) => k);
  const reachedCount = reachedSides.length;

  // 文字框外沿到成品裁切线的真实距离（单位 mm）
  const textInset = state.textInsetMm;
  // 若印刷刀偏切进来，右侧和底侧偏移可能进一步吞吃内距
  const effectiveTextClearance = medium === "print" ? round1(textInset - Math.max(driftX, driftY)) : round1(textInset);

  // 4 项单真源达标判定
  const c1_edges = reachedCount === 4 && maxExt <= bleedMax;
  const c2_bleed = medium === "print"
    ? minExt >= bleedTarget && maxExt <= bleedMax
    : minExt >= 0 && maxExt <= bleedMax;
  const c3_text = textInset >= safeMin && textInset <= safeMax;
  const c4_enclosure = c1_edges && c2_bleed && c3_text && fillPct >= 99.5;

  const passedCount = [c1_edges, c2_bleed, c3_text, c4_enclosure].filter(Boolean).length;

  // 诊断主错态（按严重度与因果顺序排列，确保 7 类双向错态全部说清「为什么」）
  let code = "pass";
  let badge = "4/4 · 满幅成立";
  let headline = "";
  let body = "";
  let actionHint = "";
  let quickFix = null; // 点击「修正这一项」或画布红标时执行的单步修复
  let impactTier = "强 · 四边包裹（示意）";
  let immersionState = "无界沉浸";

  if (reachedCount === 0) {
    code = "margin_trapped";
    const shrinkPct = Math.round(100 - fillPct);
    badge = `${passedCount}/4 · 留白退缩`;
    headline = `四周退缩 ${Math.abs(round1(maxExt))} mm，有效画面缩水 ${shrinkPct}%`;
    body = `现在四条边都没碰到成品边沿，白边把色块关成「普通版面」。同尺幅下画面比四边满幅小了 ${shrinkPct}%，眼睛先看到纸框，再隔着框往里看，包裹感还没启动。`;
    actionHint = "向右横拖画布（或把控制台里的「画面扩张 / 出血」滑轨推到 +3 mm 以上），同时点亮「下边」「左边」开关让四边全部冲出成品线。";
    quickFix = { label: "推至四边 +3.5 mm 出血", patch: { bleedMm: 3.5, edges: { top: true, right: true, bottom: true, left: true } } };
    impactTier = "弱 · 盒装感（示意）";
    immersionState = "框外旁观";
  } else if (reachedCount < 4) {
    code = "partial_bleed";
    const missText = missingSides.map((k) => EDGE_NAMES[k]).join("、");
    badge = `${passedCount}/4 · 残边半出血`;
    headline = `仅 ${reachedCount}/4 边铺满，${missText}仍拖着白边`;
    body = `满幅构图靠四边同时向外延伸形成四周包裹感。眼下${missText}被锁在留白里，画面一侧冲出去了、另一侧还挂着白边，整张版面像没贴平的贴纸一样漏气。`;
    actionHint = `点亮未通边的「${missText}」开关，让色块在四条边上一起抵达边界。`;
    quickFix = { label: `补全${missText}通边`, patch: { edges: { top: true, right: true, bottom: true, left: true } } };
    impactTier = "偏弱 · 漏气（示意）";
    immersionState = "局部受限";
  } else if (maxExt > bleedMax) {
    code = "over_bleed";
    badge = `${passedCount}/4 · 过扩失焦`;
    headline = `外扩飙到 +${round1(maxExt)} mm，核心主体被过度切损`;
    body = `出血不是把画面无限放大。超过 +${bleedMax} mm 后，色块和主体的关键交点被甩到裁切线外面，留下的只剩单调的大块平涂，构图比例反而散架。`;
    actionHint = `向左轻轻拖回画布，把出血量收回到 +${bleedTarget} mm 到 +6 mm 的标准印刷甜点区。`;
    quickFix = { label: "收回 +3.5 mm 甜点", patch: { bleedMm: 3.5 } };
    impactTier = "过载 · 主体残缺（示意）";
    immersionState = "比例失衡";
  } else if (medium === "print" && minExt < bleedTarget) {
    code = "zero_bleed_sliver";
    const shownSliver = round1(Math.max(maxSliver, driftX - minExt));
    badge = `${passedCount}/4 · 漏白陷阱`;
    headline = `出血仅 +${round1(minExt)} mm，刀偏 ${driftX} mm 立刻露白 ${shownSliver} mm`;
    body = `这是初学者最常踩的满幅暗坑：屏幕上看着严丝合缝，可印厂裁纸刀存在 ±${driftX} mm 左右的机械公差。没有向外多延 3 mm 出血位，一落刀成品边沿就会切出刺眼的白毛边。`;
    actionHint = "把「画面扩张 / 出血」继续向右推过粉色虚线（≥ +3.0 mm），再点「落刀试裁」检验切口是否全落在纯墨区。";
    quickFix = { label: "外延至 +3.5 mm 安全出血", patch: { bleedMm: 3.5 } };
    impactTier = "受损 · 毛边露白（示意）";
    immersionState = "白缝破功";
  } else if (textInset < safeMin) {
    code = "text_sliced";
    badge = `${passedCount}/4 · 文字切边`;
    headline = medium === "mobile"
      ? `标题距边仅 ${round1(textInset)} mm，撞上圆角与刘海禁区`
      : `标题距裁切线仅 ${round1(textInset)} mm，裁刀贴字切过`;
    body = medium === "mobile"
      ? `色块应该直达屏幕四边，但标题和交互信息必须留在 safe-area-inset 安全区（建议 ≥ ${safeMin} mm）内，否则会被全面屏圆角或顶部状态岛裁挡。`
      : `原海报说「不留内边距」，指的是视觉色块与图像直达四边——文字绝不能贴着裁切线！内距小于 ${safeMin} mm 时，刀偏 ${driftX} mm 后实剩仅 ${Math.max(0, effectiveTextClearance)} mm，轻则贴边窒息、重则直接切掉字脚。`;
    actionHint = `把「文字安全内距」向右拉到 ${safeMin} mm – ${safeMax} mm 之间，让色块出血、文字有呼吸。`;
    quickFix = { label: `文字退回 ${safeMin + 3.5} mm 安全区`, patch: { textInsetMm: safeMin + 3.5 } };
    impactTier = "紧绷 · 切字风险（示意）";
    immersionState = "阅读受阻";
  } else if (textInset > safeMax) {
    code = "text_crowded";
    badge = `${passedCount}/4 · 文字内陷`;
    headline = `文字内距拉到 ${round1(textInset)} mm，标题退进画面中央撞主体`;
    body = `安全区不是越缩越深越好。把文字往里推进超过 ${safeMax} mm，标题会直接盖住中央视觉重心，既打断色块通透感，也让四周边缘显得空洞脱节。`;
    actionHint = `把「文字安全内距」收回到 ${safeMin} mm – ${safeMax} mm 之间，既安全避刀，又把中央舞台还给画面。`;
    quickFix = { label: `文字收至 ${safeMin + 4} mm`, patch: { textInsetMm: safeMin + 4 } };
    impactTier = "失衡 · 压挡主体（示意）";
    immersionState = "重心干扰";
  } else {
    code = "pass";
    badge = "4/4 · 满幅成立";
    headline = medium === "mobile"
      ? `四边满屏直达，视觉面积达留白版的 ${areaRatio.toFixed(2)}×，文字稳守安全区`
      : `四边出血 +${round1(minExt)} mm 零露白，视觉面积放大至留白版的 ${areaRatio.toFixed(2)}×`;
    body = medium === "mobile"
      ? `底层几何色块通过 viewport-fit=cover 铺满整个全面屏视口，而标题与标签稳稳退守 ${round1(textInset)} mm 安全内距，避开了圆角与顶部状态岛。`
      : `色块均已跨过裁切十字线进入粉色出血位，即使裁纸刀机械偏移 ±${driftX} mm 仍切在纯色墨域内；同时标题留在 ${round1(textInset)} mm 安全内距中，画面有包裹感，阅读也有呼吸。`;
    actionHint = state.bladeCut
      ? "你也可以切到「画册跨页」或「全面屏出血」，或点击「试错：0mm 漏白」对比一刀下去的真实差别。"
      : "现在点一下「落刀试裁」，亲眼验收带 ±1.2 mm 刀偏后的干净满幅成品！";
    impactTier = "强 · 四边包裹（示意）";
    immersionState = "无界沉浸";
  }

  return {
    spec,
    edgeExt,
    artRect,
    cutRect,
    sliver,
    maxSliver: round1(maxSliver),
    minExt: round1(minExt),
    maxExt: round1(maxExt),
    reachedCount,
    missingSides,
    fillPct: round1(fillPct),
    regFillPct: round1(regFillPct),
    regMargin: round1(regMargin),
    areaRatio: Number(areaRatio.toFixed(2)),
    textInset: round1(textInset),
    effectiveTextClearance,
    checks: { c1_edges, c2_bleed, c3_text, c4_enclosure },
    passedCount,
    code,
    badge,
    headline,
    body,
    actionHint,
    quickFix,
    impactTier,
    immersionState,
  };
}
