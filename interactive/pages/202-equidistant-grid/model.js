// 202 等距网格 · 单真源几何与诊断模型
// 所有坐标、沟道宽、整倍校验、内外距层级、跨缝误差与诊断文案都从这里算出来。

export const COLS = 4;
export const ROWS = 3;
export const REF_BOARD_W = 620; // 参照 620px 桌面标本栏宽核算真实像素占比
export const REF_BOARD_H = 420;

export const BASE_UNITS = [4, 8, 12, 16];

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 12 图形",
    en: "POSTER SPECIMEN",
    note: "还原 202 号海报 4×3 瑞士几何矩阵",
  },
  exhibit: {
    id: "exhibit",
    label: "展讯卡片墙",
    en: "EXHIBITION CARDS",
    note: "图文卡片墙：检验行距、列距与卡内距层级",
  },
  mobile: {
    id: "mobile",
    label: "移动应用看板",
    en: "MOBILE DASHBOARD",
    note: "多指标看板：检验 8px 倍率与跨列补缝对齐",
  },
};

export const MODULES = [
  { id: 1, zh: "模块一", en: "MODULE 01", shape: "square", exTitle: "网格秩序", exTag: "A01", mobVal: "98%", mobLbl: "对齐率" },
  { id: 2, zh: "模块二", en: "MODULE 02", shape: "circle", exTitle: "视觉节奏", exTag: "A02", mobVal: "16px", mobLbl: "主沟道" },
  { id: 3, zh: "模块三", en: "MODULE 03", shape: "triangle", exTitle: "比例基准", exTag: "A03", mobVal: "2.0×", mobLbl: "倍率阶" },
  { id: 4, zh: "模块四", en: "MODULE 04", shape: "semi", exTitle: "呼吸留白", exTag: "A04", mobVal: "12块", mobLbl: "同构卡" },
  { id: 5, zh: "模块五", en: "MODULE 05", shape: "diamond", exTitle: "轴线对齐", exTag: "B01", mobVal: "0px", mobLbl: "偏格差" },
  { id: 6, zh: "模块六", en: "MODULE 06", shape: "bars2", exTitle: "双轴同步", exTag: "B02", mobVal: "1:1", mobLbl: "横竖比" },
  { id: 7, zh: "模块七", en: "MODULE 07", shape: "dots9", exTitle: "点阵模数", exTag: "B03", mobVal: "8dp", mobLbl: "基础步" },
  { id: 8, zh: "模块八", en: "MODULE 08", shape: "grid4", exTitle: "模块拆合", exTag: "B04", mobVal: "4列", mobLbl: "网格轨" },
  { id: 9, zh: "模块九", en: "MODULE 09", shape: "dots4", exTitle: "跨列专题", exTag: "C01", mobVal: "2W+X", mobLbl: "跨缝式" },
  { id: 10, zh: "模块十", en: "MODULE 10", shape: "quarter", exTitle: "象限均衡", exTag: "C02", mobVal: "3层", mobLbl: "空间阶" },
  { id: 11, zh: "模块十一", en: "MODULE 11", shape: "bars3", exTitle: "韵律竖条", exTag: "C03", mobVal: "8px", mobLbl: "卡内距" },
  { id: 12, zh: "模块十二", en: "MODULE 12", shape: "ring", exTitle: "闭环收口", exTag: "C04", mobVal: "100%", mobLbl: "系统度" },
];

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    baseX: 8,
    gx: 34,
    gy: 10,
    innerPad: 20,
    lockXY: false,
    driftedSlot: 5,
    spanMode: "bug",
  },
  poster: {
    label: "原海报 16px 解",
    baseX: 8,
    gx: 16,
    gy: 16,
    innerPad: 8,
    lockXY: true,
    driftedSlot: -1,
    spanMode: "none",
  },
  compact: {
    label: "紧凑 12px 解",
    baseX: 4,
    gx: 12,
    gy: 12,
    innerPad: 8,
    lockXY: true,
    driftedSlot: -1,
    spanMode: "valid",
  },
  airy: {
    label: "舒展 24px 解",
    baseX: 8,
    gx: 24,
    gy: 24,
    innerPad: 12,
    lockXY: true,
    driftedSlot: -1,
    spanMode: "valid",
  },
  test_zero: {
    label: "试错：零缝粘连",
    baseX: 8,
    gx: 0,
    gy: 0,
    innerPad: 10,
    lockXY: true,
    driftedSlot: -1,
    spanMode: "none",
  },
  test_sparse: {
    label: "试错：过疏孤岛",
    baseX: 8,
    gx: 44,
    gy: 44,
    innerPad: 8,
    lockXY: true,
    driftedSlot: -1,
    spanMode: "none",
  },
  test_invert: {
    label: "试错：内外倒挂",
    baseX: 8,
    gx: 16,
    gy: 16,
    innerPad: 22,
    lockXY: true,
    driftedSlot: -1,
    spanMode: "none",
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    baseX: PRESETS.broken.baseX,
    gx: PRESETS.broken.gx,
    gy: PRESETS.broken.gy,
    innerPad: PRESETS.broken.innerPad,
    lockXY: PRESETS.broken.lockXY,
    driftedSlot: PRESETS.broken.driftedSlot,
    spanMode: PRESETS.broken.spanMode,
    showGuides: true,
  };
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function snapGutter(val, baseX, otherAxis) {
  let out = Math.round(clamp(val, 0, 48));
  // 靠近另一轴间距时轻轻吸附，便于凭手感对齐横竖等距
  if (typeof otherAxis === "number" && Math.abs(out - otherAxis) <= 1.6) {
    return Math.round(otherAxis);
  }
  const nearestMult = Math.round(out / baseX) * baseX;
  if (Math.abs(out - nearestMult) <= 1.2) {
    return clamp(nearestMult, 0, 48);
  }
  return out;
}

// 计算物理坐标系下的完整 4×3 布局，供 Canvas 绘制、点击命中测试和单真源诊断共用
export function computeLayout(state, width, height) {
  const padX = Math.max(18, Math.round(width * 0.048));
  const padY = Math.max(20, Math.round(height * 0.062));
  const boardX = padX;
  const boardY = padY;
  const boardW = Math.max(120, width - padX * 2);
  const boardH = Math.max(120, height - padY * 2);

  // 用统一比例把逻辑像素映射到当前画布，保证横竖视觉严格等比
  const scale = boardW / REF_BOARD_W;
  const gxPx = state.gx * scale;
  const gyPx = state.gy * scale;
  const innerPx = state.innerPad * scale;

  const cellW = Math.max(24, (boardW - (COLS - 1) * gxPx) / COLS);
  const cellH = Math.max(24, (boardH - (ROWS - 1) * gyPx) / ROWS);

  // 参照标准 620px 宽板下的理论单卡宽与高，让读数在不同视口保持客观稳定
  const refCellW = (REF_BOARD_W - (COLS - 1) * state.gx) / COLS;
  const refCellH = (REF_BOARD_H - (ROWS - 1) * state.gy) / ROWS;

  const colEdges = [];
  for (let c = 0; c < COLS; c++) {
    const x = boardX + c * (cellW + gxPx);
    colEdges.push({ x, right: x + cellW });
  }
  const rowEdges = [];
  for (let r = 0; r < ROWS; r++) {
    const y = boardY + r * (cellH + gyPx);
    rowEdges.push({ y, bottom: y + cellH });
  }

  // 所有垂直与水平沟道矩形（用于标尺渲染与拖拽命中）
  const vGutters = [];
  for (let c = 0; c < COLS - 1; c++) {
    vGutters.push({
      index: c,
      x: colEdges[c].right,
      y: boardY,
      w: gxPx,
      h: boardH,
      cx: colEdges[c].right + gxPx / 2,
    });
  }
  const hGutters = [];
  for (let r = 0; r < ROWS - 1; r++) {
    hGutters.push({
      index: r,
      x: boardX,
      y: rowEdges[r].bottom,
      w: boardW,
      h: gyPx,
      cy: rowEdges[r].bottom + gyPx / 2,
    });
  }

  // 20 个网格角点红方锚点（复刻 202 原海报四边与内交叉红方）
  const anchors = [];
  const xs = [boardX];
  for (let c = 0; c < COLS - 1; c++) xs.push(colEdges[c].right + gxPx / 2);
  xs.push(boardX + boardW);
  const ys = [boardY];
  for (let r = 0; r < ROWS - 1; r++) ys.push(rowEdges[r].bottom + gyPx / 2);
  ys.push(boardY + boardH);

  for (let r = 0; r < ys.length; r++) {
    for (let c = 0; c < xs.length; c++) {
      anchors.push({
        x: xs[c],
        y: ys[r],
        inner: c > 0 && c < xs.length - 1 && r > 0 && r < ys.length - 1,
      });
    }
  }

  // 生成各模块实体盒
  const cards = [];
  for (let i = 0; i < 12; i++) {
    // 跨列模式下，模块 10（index 9）合并进模块 9（index 8）
    if (i === 9 && state.spanMode !== "none") continue;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const idealX = colEdges[col].x;
    const idealY = rowEdges[row].y;
    let idealW = cellW;
    let w = cellW;
    let spanCols = 1;
    let spanDeficitPx = 0;
    let spanBug = false;

    if (i === 8 && state.spanMode !== "none") {
      spanCols = 2;
      idealW = cellW * 2 + gxPx;
      if (state.spanMode === "bug") {
        w = cellW * 2; // 经典错误：按 2W 计算，漏加中间 1 个 gx
        spanDeficitPx = gxPx;
        spanBug = true;
      } else {
        w = idealW;
      }
    }

    const drifted = i === state.driftedSlot;
    const driftDx = drifted ? 10 * scale : 0;
    const driftDy = drifted ? -6 * scale : 0;

    cards.push({
      slot: i,
      mod: MODULES[i],
      col,
      row,
      spanCols,
      idealX,
      idealY,
      idealW,
      idealH: cellH,
      x: idealX + driftDx,
      y: idealY + driftDy,
      w,
      h: cellH,
      drifted,
      spanBug,
      spanDeficitPx,
    });
  }

  return {
    width,
    height,
    scale,
    board: { x: boardX, y: boardY, w: boardW, h: boardH },
    cellW,
    cellH,
    refCellW,
    refCellH,
    gxPx,
    gyPx,
    innerPx,
    colEdges,
    rowEdges,
    vGutters,
    hGutters,
    anchors,
    cards,
  };
}

// 单真源诊断：实算 4 项核心指标与 9 类具体失误，接受任意多组合法解
export function diagnose(state) {
  const { baseX, gx, gy, innerPad, driftedSlot, spanMode } = state;
  const refCellW = (REF_BOARD_W - (COLS - 1) * gx) / COLS;
  const refCellH = (REF_BOARD_H - (ROWS - 1) * gy) / ROWS;

  const minG = Math.min(gx, gy);
  const maxG = Math.max(gx, gy);
  const diffG = Math.abs(gx - gy);
  const ratioXY = minG > 0 ? maxG / minG : maxG > 0 ? Infinity : 1;
  const gutterShare = refCellW > 0 ? gx / refCellW : 0;

  const gxMult = gx / baseX;
  const gyMult = gy / baseX;
  const gxOnScale = gx > 0 && gx % baseX === 0;
  const gyOnScale = gy > 0 && gy % baseX === 0;
  const innerOnHalf = innerPad % (baseX / 2) === 0;

  const zeroGap = gx === 0 || gy === 0;
  const cramped = !zeroGap && (minG < 8 || gutterShare < 0.055);
  const sparse = maxG > 36 || gutterShare > 0.30;
  const coarseBase = baseX >= 16 && innerPad >= 16 && minG <= 16;

  // 四条核心几何不变量
  const checkAxis = !zeroGap && diffG <= 1;
  const checkScale = !zeroGap && !cramped && !sparse && gxOnScale && gyOnScale;
  const checkHierarchy = !zeroGap && innerPad >= 4 && innerPad < minG && !coarseBase;
  const checkTrack = driftedSlot === -1 && spanMode !== "bug";

  const checks = {
    axis: checkAxis,
    scale: checkScale,
    hierarchy: checkHierarchy,
    track: checkTrack,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;

  // 汇总具体错因（按视觉破坏力排序，每次清楚说出最要紧的一条及「为什么」）
  const issues = [];

  if (zeroGap) {
    issues.push({
      code: "zero_gap",
      badge: "错态 · 零缝粘连",
      headline: "沟道被压成 0px，十二张模块直接糊成一堵墙",
      why: "没有相等的呼吸沟道，相邻模块的边框和图形紧贴相撞。眼睛无法迅速切出单块信息边界，等距秩序荡然无存。",
      action: "在画布上向右横拖列缝（或调大控制条里的「列距 / 行距」滑杆），把横竖缝隙拉开到 12px–24px（如 2X = 16px）。",
    });
  }

  if (!zeroGap && diffG > 1) {
    const wider = gx > gy ? "列距" : "行距";
    const splitDir = gx > gy ? "四条各自孤立的竖长带" : "三条被切开的横长条";
    issues.push({
      code: "axis_mismatch",
      badge: `错态 · 横竖 ${ratioXY.toFixed(2)}×`,
      headline: `列距 ${gx}px ≠ 行距 ${gy}px，矩阵裂成了${splitDir}`,
      why: `海报核心原理要求「水平与垂直方向使用相同的间距单位」。现在${wider}明显更宽，视线顺着窄缝先连成条，12 块整体感被生生劈开；旁边「间距单位 = X」红块也压成了扁长方。`,
      action: `在画布上左右拖动中间列缝（或打开「X=Y 同步锁」），把列距与行距对齐到同一个 ${baseX}px 整数倍（例如 ${baseX * 2}px）。`,
    });
  }

  if (!zeroGap && sparse) {
    issues.push({
      code: "sparse",
      badge: `错态 · 过疏 ${Math.round(gutterShare * 100)}%`,
      headline: `缝隙撑到 ${maxG}px（占卡宽 ${Math.round(gutterShare * 100)}%），模块散成孤岛`,
      why: "空白一旦宽过体验参考带（约卡宽的 6%–28%），卡片之间的群组关系就被空白切断，读者看到的不是一张完整网格，而是零散飘浮的碎块。",
      action: `把列距与行距收回到 12px–28px 区间（例如 2X = ${baseX * 2}px 或 3X = ${Math.min(24, baseX * 3)}px）。`,
    });
  }

  if (!zeroGap && cramped) {
    issues.push({
      code: "cramped",
      badge: `错态 · 过密 ${minG}px`,
      headline: `沟道窄到 ${minG}px，模块边缘互相挤压发闷`,
      why: "虽然留出了一点缝，但不足卡宽的 6% 时，密集的图形和标题会在视觉上互相串扰，海报最后一条「适度留白，避免拥挤」正好防的是这件事。",
      action: "向右拉开沟道，把横竖间距至少提升到 12px–16px 的舒适呼吸带。",
    });
  }

  if (!zeroGap && (!gxOnScale || !gyOnScale)) {
    issues.push({
      code: "off_scale",
      badge: `错态 · 非 ${baseX}px 整倍`,
      headline: `当前 ${gx}px / ${gy}px 不是基数 X=${baseX}px 的整数倍`,
      why: "手调出的零散像素（如 34px、10px）意味着每个设计师都在凭眼缘猜数值，团队协作时无法复用同一把标尺，决策与验收成本成倍上升。",
      action: `把列距与行距落到基数 X=${baseX}px 的整数倍（如 ${baseX * 2}px = 2X），或切换基数 X 适配目标节奏。`,
    });
  }

  if (!zeroGap && innerPad >= minG) {
    issues.push({
      code: "inner_outer_invert",
      badge: "错态 · 内松外紧倒挂",
      headline: `卡内距 ${innerPad}px ≥ 外部沟道 ${minG}px，卡片边界开始串味`,
      why: "视觉分组遵循「内紧于外」：同一卡片里的图形和标题，距离必须小于它到隔壁卡片的距离。一旦内边距反超外沟道，上面的标题看起来会更像属于下一行卡片。",
      action: `把控制条里的「卡内距」调小到严格小于 ${minG}px（例如 1X = ${Math.min(8, Math.max(4, minG - 4))}px），立刻恢复内外层级。`,
    });
  }

  if (coarseBase) {
    issues.push({
      code: "coarse_base",
      badge: "错态 · 基数过粗",
      headline: `基数 X=${baseX}px 太大，内部留白找不到更细的台阶`,
      why: "当基础单位定到 16px 且卡内距也是 16px 时，微小的内部层次无法用 1X 容纳，高密度卡片信息会迅速失控。常见界面系统常取 4px 或 8px 作基数 X。",
      action: "把基数 X 换回 4px 或 8px，让内边距取 1X、主沟道取 2X 或 3X。",
    });
  }

  if (driftedSlot !== -1) {
    const mod = MODULES[driftedSlot];
    issues.push({
      code: "drifted_module",
      badge: `错态 · ${mod.zh}偏格`,
      headline: `${mod.zh}手动偏离轨道 +10px，一整条列轴被拉断`,
      why: "等距网格最忌「这里看着空，顺手挪几像素」。只要有一块脱轨，人眼沿着红方交点建立的隐形直线就会在此突然卡顿。",
      action: `直接点击画布中红框标出的「${mod.zh}」（或点「一键归轨补缝」按钮），让它吸回共享网格线。`,
    });
  }

  if (spanMode === "bug") {
    issues.push({
      code: "span_deficit",
      badge: "错态 · 跨列漏算 1X",
      headline: `底排跨 2 列主卡只给了 2W，右缘凭空短进 ${gx}px`,
      why: "跨过两列时，中间吞掉的那一条沟道必须算进总宽（正确宽度 = 2W + 1×列距）。漏算这一条缝，整张表的右对齐边线立刻塌出一个缺口。",
      action: "点击画布底排带红斜纹缺口的跨列主卡，把它修成规范的 2W + gx（或拆回 12 张单卡）。",
    });
  }

  const ok = passedCount === 4;
  let primary;
  if (ok) {
    const multText = gxMult === Math.round(gxMult) ? `${gxMult}X` : `${gxMult.toFixed(1)}X`;
    const styleName = gx <= 12 ? "紧凑界面解" : gx >= 24 ? "舒展画册解" : "原海报标准解";
    primary = {
      code: "pass",
      badge: `已校准 · ${styleName} (4/4)`,
      headline: `横竖锁定 ${gx}px（${multText}），12 块视觉秩序一次归位`,
      why: `列距与行距严格等于 ${gx}px（基数 ${baseX}px × ${multText}），交叉点红块归正为正方形；卡内距 ${innerPad}px 严守内紧于外；${spanMode === "valid" ? "跨列卡精准补齐中间 1 条沟道，" : ""}横扫纵览都稳、齐、轻。`,
      action: "你已调出一组正当等距解；还可以换「紧凑 12px 解」「舒展 24px 解」或故意点一张卡制造偏格，感受失序瞬间。",
    };
  } else {
    primary = issues[0];
  }

  // 生成实时等效 CSS 代码片段
  const cssLine = spanMode === "valid"
    ? `gap: ${gy}px ${gx}px; /* X=${baseX}px · 跨2列 span 2 自动含 ${gx}px 缝 */`
    : spanMode === "bug"
      ? `column-gap: ${gx}px; row-gap: ${gy}px; /* 警告：跨列漏算 ${gx}px */`
      : gx === gy
        ? `gap: ${gx}px; /* ${gxOnScale ? `${gxMult}X` : "非整倍"} · X=${baseX}px */`
        : `row-gap: ${gy}px; column-gap: ${gx}px; /* 横竖不等 */`;

  // 对应原海报四枚特点的实时实况标签
  const traitBadges = [
    {
      key: "rhythm",
      ok: checkAxis && !cramped && !sparse,
      text: checkAxis && !cramped && !sparse ? `横竖 ${gx}px` : zeroGap ? "零缝粘连" : diffG > 1 ? `失衡 ${ratioXY.toFixed(1)}×` : sparse ? "过疏孤岛" : "过密发闷",
    },
    {
      key: "align",
      ok: checkTrack,
      text: checkTrack ? "全轨严齐" : driftedSlot !== -1 && spanMode === "bug" ? "偏格+漏缝" : driftedSlot !== -1 ? "1 处偏格" : "跨列缺缝",
    },
    {
      key: "scale",
      ok: checkScale && checkHierarchy,
      text: checkScale && checkHierarchy ? `基数 ${baseX}px` : !checkHierarchy ? "内外倒挂" : "非整数倍",
    },
    {
      key: "cost",
      ok: ok,
      text: ok ? "一尺复用" : `待修 ${4 - passedCount} 项`,
    },
  ];

  return {
    ok,
    passedCount,
    checks,
    issues,
    primary,
    metrics: {
      baseX,
      gx,
      gy,
      innerPad,
      refCellW: Math.round(refCellW),
      refCellH: Math.round(refCellH),
      ratioXY: Number.isFinite(ratioXY) ? ratioXY : 0,
      gutterSharePct: Math.round(gutterShare * 100),
      gxMultText: gxOnScale ? `${gxMult}X` : `${(gx / baseX).toFixed(1)}X`,
      gyMultText: gyOnScale ? `${gyMult}X` : `${(gy / baseX).toFixed(1)}X`,
      cssLine,
    },
    traitBadges,
  };
}
