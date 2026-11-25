// 032 T形构图 · 单一真源几何模型与诊断引擎
// 画布坐标统一归一化至 u ∈ [0, 1]（左→右）、v ∈ [0, 1]（上→下）。
// 所有绘制几何、悬臂力矩示意、四维评分、8 类失误诊断与读数全部由此文件计算。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报结构",
    barLeftText: "横向承载",
    barRightText: "信息主区",
    barSub: "水平宽度建立视觉气势",
    relays: ["视线起点", "引导聚焦", "视觉落点"],
    anchorTitle: "聚焦核心信息",
    anchorSub: "信息落点，强化记忆",
    clutterTitle: "侧翼抢戏块",
    clutterSub: "点击清退干扰",
  },
  launch: {
    id: "launch",
    label: "新品发布海报",
    barLeftText: "声学旗舰",
    barRightText: "秋季发布",
    barSub: "2026 ARCHITECTURAL AUDIO",
    relays: ["顶部大标", "单品纵轴", "参数收束"],
    anchorTitle: "10.24 深圳首发",
    anchorSub: "扫码预约线下试听",
    clutterTitle: "促销角标团",
    clutterSub: "点击清退杂块",
  },
  dashboard: {
    id: "dashboard",
    label: "数据决策大屏",
    barLeftText: "季度总览",
    barRightText: "三项指标",
    barSub: "营收 · 留存 · 净增",
    relays: ["流量入口", "漏斗转化", "核心归因"],
    anchorTitle: "达成率 118%",
    anchorSub: "聚焦关键业务结论",
    clutterTitle: "冗余浮窗",
    clutterSub: "点击移出中轴",
  },
};

export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    barSpan: 0.44,
    barH: 0.19,
    stemX: 0.24,
    stemGap: 0.22,
    anchorX: 0.76,
    anchorW: 0.23,
    anchorStrength: 0.55,
    clutter: 1,
  },
  classic: {
    id: "classic",
    label: "经典正 T 解",
    barSpan: 0.86,
    barH: 0.2,
    stemX: 0.5,
    stemGap: 0,
    anchorX: 0.5,
    anchorW: 0.36,
    anchorStrength: 1,
    clutter: 0,
  },
  asymmetric: {
    id: "asymmetric",
    label: "偏轴张力解",
    barSpan: 0.9,
    barH: 0.17,
    stemX: 0.38,
    stemGap: 0,
    anchorX: 0.38,
    anchorW: 0.34,
    anchorStrength: 1,
    clutter: 0,
  },
  heavy: {
    id: "heavy",
    label: "重顶海报解",
    barSpan: 0.92,
    barH: 0.27,
    stemX: 0.5,
    stemGap: 0,
    anchorX: 0.5,
    anchorW: 0.32,
    anchorStrength: 1,
    clutter: 0,
  },
  failTopHeavy: {
    id: "failTopHeavy",
    label: "试错：重顶压垮",
    barSpan: 0.9,
    barH: 0.34,
    stemX: 0.5,
    stemGap: 0,
    anchorX: 0.5,
    anchorW: 0.34,
    anchorStrength: 1,
    clutter: 0,
  },
  failInvertT: {
    id: "failInvertT",
    label: "试错：底重倒 T",
    barSpan: 0.76,
    barH: 0.18,
    stemX: 0.5,
    stemGap: 0,
    anchorX: 0.5,
    anchorW: 0.58,
    anchorStrength: 1,
    clutter: 0,
  },
};

export const LIMITS = {
  barSpan: [0.36, 0.96],
  barH: [0.1, 0.36],
  stemX: [0.18, 0.82],
  anchorX: [0.18, 0.82],
  anchorW: [0.2, 0.64],
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function createInitialState() {
  return {
    scene: "poster",
    barSpan: PRESETS.broken.barSpan,
    barH: PRESETS.broken.barH,
    stemX: PRESETS.broken.stemX,
    stemGap: PRESETS.broken.stemGap,
    anchorX: PRESETS.broken.anchorX,
    anchorW: PRESETS.broken.anchorW,
    anchorStrength: PRESETS.broken.anchorStrength,
    clutter: PRESETS.broken.clutter,
    showFlow: true,
    activeHandle: null,
  };
}

// 从状态计算实绘几何（与画布 1:1 共用，零常量写死）
export function computeGeometry(s) {
  const barSpan = clamp(s.barSpan, ...LIMITS.barSpan);
  const barH = clamp(s.barH, ...LIMITS.barH);
  const stemX = clamp(s.stemX, ...LIMITS.stemX);
  const anchorX = clamp(s.anchorX, ...LIMITS.anchorX);
  const anchorW = clamp(s.anchorW, ...LIMITS.anchorW);
  const stemGap = s.stemGap > 0.04 ? 0.22 : 0;
  const anchorStrength = clamp(s.anchorStrength, 0.45, 1);

  const barTop = 0.065;
  const barLeft = 0.5 - barSpan / 2;
  const barRight = 0.5 + barSpan / 2;
  const barBottom = barTop + barH;
  const barMidY = barTop + barH / 2;

  const stemW = 0.135;
  const stemTop = barBottom;
  const stemTipY = 0.745;
  const stemLen = Math.max(0.18, stemTipY - stemTop);

  // 若垂轴中段断节，拆分为上下两段
  const gapCenterY = stemTop + stemLen * 0.46;
  const gapHalf = stemGap > 0 ? stemLen * 0.17 : 0;

  // 悬臂左翼与右翼净伸出长度（衡量 T 梁是否偏成 L 形或悬空）
  const leftArm = Math.max(0, stemX - barLeft);
  const rightArm = Math.max(0, barRight - stemX);
  const stemConnectedToBar = stemX >= barLeft + 0.03 && stemX <= barRight - 0.03;
  const minArm = stemConnectedToBar ? Math.min(leftArm, rightArm) : 0;
  const overhangDiff = Math.abs(leftArm - rightArm);
  const cantileverRatio = barSpan > 0 ? overhangDiff / barSpan : 1;

  // 示意倾角：垂轴脱梁或极端偏边时，横梁呈现轻微力学倾斜反馈（仅作感知提示）
  let tiltDeg = 0;
  if (!stemConnectedToBar) {
    tiltDeg = stemX < barLeft ? 4.2 : -4.2;
  } else if (cantileverRatio > 0.36) {
    const dir = leftArm > rightArm ? -1 : 1;
    tiltDeg = dir * Math.min(3.8, (cantileverRatio - 0.36) * 7.5);
  }

  const anchorY = 0.855;
  const anchorH = 0.115 * (0.78 + 0.22 * anchorStrength);
  const anchorOffset = Math.abs(anchorX - stemX);
  const anchorRatioToBar = anchorW / Math.max(0.01, barSpan);

  // 侧翼干扰块位置：落在较空一侧翼区且与垂轴断节框保持安全间距，绝不遮字
  const clutterX = stemX <= 0.5 ? clamp(Math.max(0.68, stemX + 0.36), 0.64, 0.80) : clamp(Math.min(0.32, stemX - 0.36), 0.20, 0.36);
  const clutterY = stemTop + stemLen * 0.42;
  const clutterW = 0.22;
  const clutterH = 0.145;

  return {
    barTop,
    barLeft,
    barRight,
    barBottom,
    barMidY,
    barSpan,
    barH,
    stemX,
    stemW,
    stemTop,
    stemTipY,
    stemLen,
    stemGap,
    gapCenterY,
    gapHalf,
    leftArm,
    rightArm,
    minArm,
    stemConnectedToBar,
    cantileverRatio,
    tiltDeg,
    anchorX,
    anchorY,
    anchorW,
    anchorH,
    anchorStrength,
    anchorOffset,
    anchorRatioToBar,
    clutter: s.clutter ? 1 : 0,
    clutterX,
    clutterY,
    clutterW,
    clutterH,
  };
}

// 4 项独立检核 + 8 类实测失误 + 多种正当解判定
export function evaluate(s) {
  const g = computeGeometry(s);

  // ① 顶部承载：展宽 ≥ 68%，厚重比在 13%–29% 经验舒适带，且底焦不反超顶梁
  const barTooNarrow = g.barSpan < 0.68;
  const barTooHeavy = g.barH > 0.295;
  const barTooThin = g.barH < 0.125;
  const beamOk = !barTooNarrow && !barTooHeavy && !barTooThin;

  // ② 轴线引导：中轴不断节、牢固接在顶梁下且双翼均有有效悬臂（避免退化成 L 形）
  const stemBroken = g.stemGap > 0.04;
  const stemDetached = !g.stemConnectedToBar;
  const stemLikeL = !stemDetached && (g.stemX < 0.32 || g.stemX > 0.68 || g.minArm < 0.1);
  const stemOk = !stemBroken && !stemDetached && !stemLikeL;

  // ③ 稳定聚焦：落点对准垂轴（≤ 6.5%）、明度与体量够强、且不反客为主成倒 T
  const anchorMissed = g.anchorOffset > 0.065;
  const anchorTooWide = g.anchorRatioToBar > 0.6;
  const anchorTooWeak = g.anchorStrength < 0.8;
  const anchorOk = !anchorMissed && !anchorTooWide && !anchorTooWeak;

  // ④ 双翼净空：负形翼区干净，无越界杂块切断垂轴呼吸感
  const pocketCluttered = g.clutter > 0;
  const pocketOk = !pocketCluttered;

  const pillars = {
    beam: {
      ok: beamOk,
      status: barTooNarrow
        ? `塌缩 ${Math.round(g.barSpan * 100)}%`
        : barTooHeavy
        ? `压顶 ${Math.round(g.barH * 100)}%`
        : barTooThin
        ? `过薄 ${Math.round(g.barH * 100)}%`
        : `展宽 ${Math.round(g.barSpan * 100)}%`,
    },
    stem: {
      ok: stemOk,
      status: stemDetached
        ? "脱梁悬空"
        : stemLikeL
        ? `偏轴 ${Math.round(g.stemX * 100)}%`
        : stemBroken
        ? "中段断节"
        : Math.abs(g.stemX - 0.5) <= 0.045
        ? "居中贯通"
        : `偏轴张力 ${Math.round(g.stemX * 100)}%`,
    },
    anchor: {
      ok: anchorOk,
      status: anchorTooWide
        ? "底重倒 T"
        : anchorMissed
        ? `脱靶 ${Math.round(g.anchorOffset * 100)}%`
        : anchorTooWeak
        ? "焦块过弱"
        : "稳接轴尖",
    },
    pocket: {
      ok: pocketOk,
      status: pocketCluttered ? "翼侧侵轴" : "双翼净空",
    },
  };

  const passCount = [beamOk, stemOk, anchorOk, pocketOk].filter(Boolean).length;

  // 按严重优先级检出当前最需修复的失误（覆盖 8 类典型翻车）
  let code = "ok";
  let badge = "稳固达标";
  let headline = "";
  let explain = "";
  let hint = "";
  let solutionKind = null;

  if (barTooNarrow) {
    code = "narrow_beam";
    badge = `错态 · 横梁塌缩 (${passCount}/4)`;
    headline = `顶梁只有 ${Math.round(g.barSpan * 100)}% 宽，架不起 T 形气势`;
    explain = "T 形构图靠上方宽横带先兜住全幅视野。现在顶梁缩成一小条，左右留白泄散，整张画面更像一根孤立的竖签。";
    hint = "拖动金黄顶梁左右端帽（或调旁侧「顶梁展宽」），拉开到 72%–94% 经验带。";
  } else if (barTooHeavy) {
    code = "top_heavy";
    badge = `错态 · 重顶压垮 (${passCount}/4)`;
    headline = `顶梁厚到 ${Math.round(g.barH * 100)}%，把下半场压喘不过气`;
    explain = "海报提醒横带要「形成视觉重量」，但重量过头会挤扁垂直导流通道，让视线堵在上半屏下不来。";
    hint = "向上微提顶梁下沿（或把「横梁厚度」收回 14%–28%），给中轴留出下沉加速距离。";
  } else if (barTooThin) {
    code = "thin_beam";
    badge = `错态 · 顶梁过薄 (${passCount}/4)`;
    headline = `顶梁仅厚 ${Math.round(g.barH * 100)}%，像一条细页眉压不住阵脚`;
    explain = "顶部横带太单薄，承担不起主信息区的视觉重量，读者扫一眼就跳过顶部直接看散乱的下半区。";
    hint = "向下拉厚顶梁到 14%–26%，让横带成为真正的信息母舰。";
  } else if (stemDetached || stemLikeL) {
    code = "l_slip";
    badge = `错态 · 垂轴溜边 (${passCount}/4)`;
    headline = stemDetached
      ? `垂轴滑到 ${Math.round(g.stemX * 100)}%，已经脱离顶梁悬空`
      : `垂轴偏到 ${Math.round(g.stemX * 100)}%，T 形正在滑变成 L 形`;
    explain = "T 形的双翼悬臂提供左右平衡感。当竖轴逼近画框边缘时，单侧悬臂过长产生倾覆错觉，结构滑向 033 的 L 形构图。";
    hint = "在画布中段左右拖动绿色垂轴（或按 ← / →），拉回 34%–66% 平衡带内。";
  } else if (stemBroken) {
    code = "broken_stem";
    badge = `错态 · 中轴断节 (${passCount}/4)`;
    headline = "垂轴中段裂开 22% 断口，视线半路泄散";
    explain = "水平扫视在顶梁中央被收进竖向通道后，必须一气呵成送到落点；中途出现大片空白断层，眼睛立刻偏离去扫空荡的左右翼。";
    hint = "直接点击画布上标红的「中轴断节」区域，或点旁侧「接通中轴」弥合通道。";
  } else if (anchorTooWide) {
    code = "inverted_t";
    badge = `错态 · 底重倒 T (${passCount}/4)`;
    headline = `底部胶囊宽达顶梁的 ${Math.round(g.anchorRatioToBar * 100)}%，重心反客为主`;
    explain = "正 T 讲究「上宽承面、下收成点」。如果底部落点拉得快和顶梁一样宽，结构翻转成底座式的倒 T（⊥），失去收束聚焦感。";
    hint = "把「落点宽度」收窄到顶梁宽度的 55% 以内，让核心信息凝成紧凑焦块。";
  } else if (anchorMissed) {
    code = "missed_anchor";
    badge = `错态 · 落点脱靶 (${passCount}/4)`;
    headline = `核心落点偏离垂轴 ${Math.round(g.anchorOffset * 100)}%，箭头指了个空`;
    explain = "垂轴积攒了一整屏向下的阅读惯性，箭头尖正下方却是一片深蓝空地，真正的核心胶囊被甩在侧面，记忆点当场打折。";
    hint = "直接拖动画布底部的金星胶囊（或点「落点归轴」），稳稳扣在垂轴箭头正下方。";
  } else if (anchorTooWeak) {
    code = "weak_anchor";
    badge = `错态 · 焦点弱化 (${passCount}/4)`;
    headline = "落点胶囊明度与体量太弱，兜不住下冲视线";
    explain = "垂轴一路把视线引到底部，如果终点没有足够鲜明的色块或徽章承接，读者目光会直接滑出画框底边。";
    hint = "点画布上的金星胶囊或「强化落点」，恢复饱满金黄高对比锚点。";
  } else if (pocketCluttered) {
    code = "pocket_clutter";
    badge = `错态 · 翼侧侵轴 (${passCount}/4)`;
    headline = "侧翼杂块挤进负形通道，T 形轮廓被糊住";
    explain = "T 形左右两翼的留白不是浪费，而是衬出中央垂轴的负形走廊。把多余浮窗或装饰块塞进中轴边缘，视线就被扯偏。";
    hint = "直接点击画布上的红框干扰块（或点「清退侧翼杂块」），把负形还给垂轴。";
  } else {
    // 4/4 全部达标，区分三类正当解并给出准确肯定
    if (Math.abs(g.stemX - 0.5) > 0.045) {
      solutionKind = "asymmetric";
      badge = "达标 · 偏轴张力 T (4/4)";
      headline = `偏轴 ${Math.round(g.stemX * 100)}% 同样成立：宽梁配双翼留白，秩序带张力`;
      explain = "T 形不一定要死板对称。只要左右两侧仍留出足够悬臂且落点紧锁轴尖，偏轴 T 能让杂志与专题页在稳定中多出一份灵动。";
      hint = "可以切换上方「新品发布海报 / 数据决策大屏」，或故意试错感受临界崩塌点。";
    } else if (g.barH >= 0.24) {
      solutionKind = "heavy";
      badge = "达标 · 重顶海报 T (4/4)";
      headline = `厚梁 ${Math.round(g.barH * 100)}% 强压开场，垂轴顺势收束到金星落点`;
      explain = "顶梁厚实有压场气势，同时没有挤压掉垂轴的导流高度，适合主视觉大标题页、品牌官宣与发布会首屏。";
      hint = "试着再把横梁拉厚超过 30%，观察「稳重」怎样跨线变成「压顶」。";
    } else {
      solutionKind = "classic";
      badge = "达标 · 经典居中正 T (4/4)";
      headline = "上宽下收、轴畅落稳：经典 T 形构图完全立住";
      explain = `顶部横梁占幅 ${Math.round(g.barSpan * 100)}% 建立气势，中央垂轴无断层引导视线，底部金星胶囊稳稳接住下沉流，双翼留白干净利落。`;
      hint = "拖动垂轴试试「偏轴张力 T」，或点「试错：底重倒 T / 重顶压垮」验证结构边界。";
    }
  }

  // 悬臂平衡读数（标明示意/实算）
  const balanceText = !g.stemConnectedToBar
    ? "脱梁失稳"
    : g.cantileverRatio <= 0.1
    ? "双翼对称"
    : g.cantileverRatio <= 0.36
    ? `偏轴 ${Math.round(g.cantileverRatio * 100)}%`
    : `单边过重 ${Math.round(g.cantileverRatio * 100)}%`;

  return {
    g,
    pillars,
    passCount,
    isSolved: passCount === 4,
    code,
    badge,
    headline,
    explain,
    hint,
    solutionKind,
    metrics: {
      spanPct: `${Math.round(g.barSpan * 100)}%`,
      thicknessPct: `${Math.round(g.barH * 100)}%`,
      stemPosPct: `${Math.round(g.stemX * 100)}%`,
      offsetPct: `${Math.round(g.anchorOffset * 100)}%`,
      balanceText,
    },
  };
}
