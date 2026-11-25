// 206 子网格 SUBGRID · 单真源几何与规则核算模型
// 所有像素矩形、轨道线偏差、行基线落差、大环对齐率、诊单文案与活体 CSS 声明均由同一份计算得出。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报蓝图",
    heroTitle: "主标题占满 12 列",
    heroSub: "HERO TITLE SPANNING 12 COLUMNS",
    leftHeading: "左侧模块",
    rightHeading: "右侧模块",
    listHeading: "列表模块",
    cards: [
      { shape: "circle", title: "特性一", en: "FEATURE 01", lines: ["轨道线直通卡片内缘"] },
      {
        shape: "triangle",
        title: "特性二",
        en: "FEATURE 02",
        lines: ["标题折行或正文变长时", "同行卡片会一起撑高", "底边依旧保持笔直对齐"],
      },
      { shape: "square", title: "特性三", en: "FEATURE 03", lines: ["局部细节可自由排布"] },
    ],
    list: [
      { no: "01", title: "条目标题一", body: "子网格行高与父网格一致，上下对齐更稳定。", date: "2024.05.20" },
      { no: "02", title: "条目标题二", body: "列宽来自父网格轨道，内容可以精确对齐。", date: "2024.05.21" },
      { no: "03", title: "条目标题三", body: "在保持秩序的同时，每个条目可自由安排细节。", date: "2024.05.22" },
    ],
  },
  pricing: {
    id: "pricing",
    label: "三栏定价卡",
    heroTitle: "产品方案横向对齐 12 列",
    heroSub: "PRICING CARDS SHARING PARENT TRACKS",
    leftHeading: "核心套餐区",
    rightHeading: "跨卡齐平率",
    listHeading: "权益明细表",
    cards: [
      { shape: "circle", title: "基础版", en: "STARTER · ¥0", lines: ["适合个人单页排练"] },
      {
        shape: "triangle",
        title: "专业工作室版",
        en: "STUDIO · ¥199",
        lines: ["含多人共享设计系统", "支持跨端组件库同步", "与历史版本即时回溯"],
      },
      { shape: "square", title: "企业版", en: "TEAM · 定制", lines: ["专属部署与权限审计"] },
    ],
    list: [
      { no: "01", title: "组件同步", body: "卡片标题、说明与按钮横跨多列锁死同一条水平线。", date: "全版本" },
      { no: "02", title: "权限管理", body: "价格数字与说明文字沿用上方套餐卡的垂直轨道。", date: "专业版+" },
      { no: "03", title: "专属支持", body: "即使某项说明折成两行，整表节奏依旧均匀稳定。", date: "企业版" },
    ],
  },
  form: {
    id: "form",
    label: "嵌套表单流",
    heroTitle: "跨分组表单共用 12 列基准",
    heroSub: "MULTI-SECTION FORM ON ONE GLOBAL GRID",
    leftHeading: "基础资料组",
    rightHeading: "字段齐线率",
    listHeading: "通知与安全分组",
    cards: [
      { shape: "circle", title: "姓名栏", en: "FIELD 01", lines: ["短标签对齐首列"] },
      {
        shape: "triangle",
        title: "收件地址与邮编",
        en: "FIELD 02",
        lines: ["多行帮助提示撑高字段", "不让隔壁输入框高低", "失衡或错开操作线"],
      },
      { shape: "square", title: "税号栏", en: "FIELD 03", lines: ["可选填项维持同基线"] },
    ],
    list: [
      { no: "01", title: "登录邮箱", body: "分组内标签列与输入列直接继承外层表单主网格。", date: "已验证" },
      { no: "02", title: "双重校验", body: "跨越不同分组标题，左栏标签右缘仍然严丝合缝。", date: "已开启" },
      { no: "03", title: "导出日志", body: "操作状态与上方分组字段稳稳落在同一尾列。", date: "每月一次" },
    ],
  },
};

export const INITIAL_STATE = Object.freeze({
  scene: "poster",
  parentGap: 20,      // px, 8..32 (原海报参考 24px)
  asymmetry: 0.16,    // -0.32..+0.32 (非零让普通嵌套和子网格差异立竿见影)
  colSubgrid: false,  // 左/右模块列继承
  rowSubgrid: false,  // 左模块三卡行继承
  rowSpan: 3,         // 行跨度 2 | 3 | 4 (2 触发跨度不足真坑)
  listSubgrid: false, // 底部列表行列双继承
  childGapMode: "oversized", // "inherit" | "tight" | "zero" | "oversized"
  card2Lines: 3,      // 1 | 2 | 3 (卡片二正文行数)
  focusArea: null,    // null | "cols" | "rows" | "list" | "gap"
});

export const PRESETS = {
  broken: {
    ...INITIAL_STATE,
  },
  standard: {
    parentGap: 24,
    asymmetry: 0,
    colSubgrid: true,
    rowSubgrid: true,
    rowSpan: 3,
    listSubgrid: true,
    childGapMode: "inherit",
    card2Lines: 3,
    focusArea: null,
  },
  compact: {
    parentGap: 24,
    asymmetry: 0,
    colSubgrid: true,
    rowSubgrid: true,
    rowSpan: 4,
    listSubgrid: true,
    childGapMode: "tight",
    card2Lines: 3,
    focusArea: null,
  },
  asymmetric: {
    parentGap: 20,
    asymmetry: 0.24,
    colSubgrid: true,
    rowSubgrid: true,
    rowSpan: 3,
    listSubgrid: true,
    childGapMode: "inherit",
    card2Lines: 3,
    focusArea: null,
  },
  pitfallSpan: {
    parentGap: 24,
    asymmetry: 0,
    colSubgrid: true,
    rowSubgrid: true,
    rowSpan: 2,
    listSubgrid: true,
    childGapMode: "inherit",
    card2Lines: 3,
    focusArea: "rows",
  },
  pitfallGapZero: {
    parentGap: 24,
    asymmetry: 0.12,
    colSubgrid: true,
    rowSubgrid: true,
    rowSpan: 3,
    listSubgrid: true,
    childGapMode: "zero",
    card2Lines: 3,
    focusArea: "gap",
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function getChildGapPx(state) {
  const g = state.parentGap;
  if (state.childGapMode === "inherit") return g;
  if (state.childGapMode === "tight") return Math.max(6, Math.round(g * 0.5));
  if (state.childGapMode === "zero") return 0;
  return Math.round(g * 1.75);
}

// 计算 12 列父网格与各子/孙元素的精确逻辑坐标（供 Canvas 绘制与单真源核验共用）
export function computeLayout(state, width, height) {
  const W = Math.max(300, width);
  const H = Math.max(320, height);
  const compact = W < 480;

  // 外框（原海报「主内容区 / PARENT GRID CONTAINER」白色细框）
  const padX = compact ? 12 : 20;
  const padTop = compact ? 28 : 34;
  const padBot = compact ? 14 : 18;
  const outer = { x: padX, y: padTop, w: W - padX * 2, h: H - padTop - padBot };

  const innerPadX = compact ? 10 : 16;
  const innerPadY = compact ? 10 : 14;
  const grid = {
    x: outer.x + innerPadX,
    y: outer.y + innerPadY,
    w: outer.w - innerPadX * 2,
    h: outer.h - innerPadY * 2,
  };

  // 将逻辑 parentGap (8..32px) 按容器比例映射到画布像素
  const scale = clamp(grid.w / 760, 0.42, 1.15);
  const gapPx = state.parentGap * scale * 0.72;
  const childGapLogical = getChildGapPx(state);
  const childGapPx = childGapLogical * scale * 0.72;

  // 12 列权重（asymmetry 控制前 6 列与后 6 列及组内节奏差异，总权重恒为 12）
  const asym = clamp(state.asymmetry, -0.32, 0.32);
  const weights = [];
  for (let i = 0; i < 12; i++) {
    // 左侧 6 列中，第 0-1 列更宽，第 4-5 列偏窄；右侧对称呼应，突出真实非等宽父轨场景
    const halfBias = i < 6 ? asym * 0.65 : -asym * 0.65;
    const trioBias = i < 6 ? ((i < 2 ? 1 : i < 4 ? 0 : -1) * asym * 0.55) : ((i < 9 ? 0.5 : -0.5) * asym * 0.4);
    weights.push(Math.max(0.48, 1 + halfBias + trioBias));
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const availW = grid.w - gapPx * 11;

  const parentCols = [];
  let cursorX = grid.x;
  for (let i = 0; i < 12; i++) {
    const colW = (availW * weights[i]) / weightSum;
    parentCols.push({ index: i, x0: cursorX, x1: cursorX + colW, w: colW, weight: weights[i] });
    cursorX += colW + gapPx;
  }

  // 垂直三段：顶黄通栏(20%) / 中双子模块(44%) / 底列表模块(36%)
  const secGap = compact ? 10 : 14;
  const availH = grid.h - secGap * 2;
  const heroH = Math.round(availH * 0.21);
  const midH = Math.round(availH * 0.44);
  const listH = availH - heroH - midH;

  const heroRect = {
    x: parentCols[0].x0,
    y: grid.y,
    w: parentCols[11].x1 - parentCols[0].x0,
    h: heroH,
  };

  // 中排：左模块占父列 0..5，右模块占父列 6..11
  const midY = heroRect.y + heroRect.h + secGap;
  const leftMod = {
    x: parentCols[0].x0,
    y: midY,
    w: parentCols[5].x1 - parentCols[0].x0,
    h: midH,
  };
  const rightMod = {
    x: parentCols[6].x0,
    y: midY,
    w: parentCols[11].x1 - parentCols[6].x0,
    h: midH,
  };

  // 左模块内部 3 张特性卡（目标：每张卡占据 2 条父列轨 0..1, 2..3, 4..5）
  const modHeaderH = compact ? 22 : 28;
  const cardTop = leftMod.y + modHeaderH;
  const cardAreaH = leftMod.h - modHeaderH - (compact ? 8 : 10);

  const leftCards = [];
  const lineCounts = [1, clamp(state.card2Lines, 1, 3), 1];
  const lineH = compact ? 9 : 11.5;

  // 若未开列继承，子容器会有自己独立内边距（按比例缩放以保持不同视口数值稳定）并写死 1fr 1fr 1fr
  const detachedInset = 14 * scale;

  // 预先算出三张卡横向坐标
  const cardXSpans = [];
  if (state.colSubgrid) {
    if (state.childGapMode === "inherit") {
      // 严丝合缝继承父列轨 (0..1), (2..3), (4..5)
      for (let k = 0; k < 3; k++) {
        const x0 = parentCols[k * 2].x0;
        const x1 = parentCols[k * 2 + 1].x1;
        cardXSpans.push({ x: x0, w: x1 - x0 });
      }
    } else {
      // 外缘紧咬父列 0 和 5，但局部覆写 column-gap
      const totalSpanW = parentCols[5].x1 - parentCols[0].x0;
      const effGap = childGapPx;
      // 保持与父列 2+2+2 相同的相对比例，只按局部 gap 重分槽宽
      const w0 = parentCols[0].w + parentCols[1].w;
      const w1 = parentCols[2].w + parentCols[3].w;
      const w2 = parentCols[4].w + parentCols[5].w;
      const wSum = w0 + w1 + w2;
      const net = Math.max(40, totalSpanW - effGap * 2);
      const ws = [(net * w0) / wSum, (net * w1) / wSum, (net * w2) / wSum];
      let cx = parentCols[0].x0;
      for (let k = 0; k < 3; k++) {
        cardXSpans.push({ x: cx, w: ws[k] });
        cx += ws[k] + effGap;
      }
    }
  } else {
    // 独立嵌套：独立 padding + 写死等分 1fr 1fr 1fr + 局部 gap
    const innerX = leftMod.x + detachedInset;
    const innerW = leftMod.w - detachedInset * 2;
    const effGap = childGapPx;
    const eachW = Math.max(18, (innerW - effGap * 2) / 3);
    for (let k = 0; k < 3; k++) {
      cardXSpans.push({ x: innerX + k * (eachW + effGap), w: eachW });
    }
  }

  // 计算纵向行轨（按 cardAreaH 自适应比例缩放，确保 844×390 横屏矮画布也能清晰呈现行锯齿而不顶底）
  const vScale = clamp(cardAreaH / 128, 0.56, 1.35);
  const trackHeadH = Math.round(30 * vScale);
  const trackFootH = Math.round(15 * vScale);
  const effLineH = 11 * vScale;
  const maxLines = Math.max(...lineCounts);
  const rowGapPx =
    (state.childGapMode === "zero" ? 1 : state.childGapMode === "oversized" ? 9 : state.childGapMode === "tight" ? 4 : 6) * vScale;
  const maxBodySpace = Math.max(24, cardAreaH - trackHeadH - trackFootH - rowGapPx * 2 - 6);
  const sharedBodyH = Math.min(maxBodySpace, maxLines * effLineH + 6 * vScale);

  // 行子网格共享基线（若 rowSpan === 2，显式轨道只给 2 条，第 3 段底栏被挤进第 2 轨与正文叠车！）
  const rowOverflow = state.rowSubgrid && state.rowSpan < 3;
  const extraBuffer = state.rowSubgrid && state.rowSpan === 4 ? Math.min(10 * vScale, Math.max(3, maxBodySpace - sharedBodyH)) : 0;

  let maxColDriftPx = 0;
  const cardFootYs = [];
  const cardBodyYs = [];
  let overlapPx = 0;

  for (let k = 0; k < 3; k++) {
    const targetX0 = parentCols[k * 2].x0;
    const targetX1 = parentCols[k * 2 + 1].x1;
    const cx = cardXSpans[k].x;
    const cw = cardXSpans[k].w;
    const driftL = Math.abs(cx - targetX0);
    const driftR = Math.abs(cx + cw - targetX1);
    const drift = Math.max(driftL, driftR);
    maxColDriftPx = Math.max(maxColDriftPx, drift);

    const ownBodyH = Math.min(maxBodySpace, lineCounts[k] * effLineH + 6 * vScale);
    const headY = cardTop;
    const bodyY = headY + trackHeadH + rowGapPx;
    const bodyH = state.rowSubgrid ? sharedBodyH : ownBodyH;
    let footY;

    if (rowOverflow) {
      // CSS Subgrid 真实行为：span 2 只有 2 条显式轨道，第 3 个子项放不进第 3 轨，只能回退叠压在第 2 轨底部！
      footY = bodyY + Math.max(3, bodyH - trackFootH * 0.72);
      overlapPx = Math.max(overlapPx, Math.round((bodyY + bodyH - footY) / vScale));
    } else if (state.rowSubgrid) {
      footY = bodyY + sharedBodyH + rowGapPx + extraBuffer;
    } else {
      footY = bodyY + ownBodyH + rowGapPx;
    }

    const maxBottom = leftMod.y + leftMod.h - 5;
    if (footY + trackFootH > maxBottom) {
      footY = maxBottom - trackFootH;
      if (rowOverflow) overlapPx = Math.max(overlapPx, 10);
    }

    cardBodyYs.push(bodyY);
    cardFootYs.push(footY);

    leftCards.push({
      index: k,
      x: cx,
      y: cardTop,
      w: cw,
      h: Math.min(cardAreaH, footY + trackFootH - cardTop + 4),
      targetX0,
      targetX1,
      driftL,
      driftR,
      drift,
      headY,
      headH: trackHeadH,
      bodyY,
      bodyH,
      footY,
      footH: trackFootH,
      lines: lineCounts[k],
      overflowed: rowOverflow,
    });
  }

  const rowStaggerPx = Math.max(...cardFootYs) - Math.min(...cardFootYs);

  // 右模块（白黄大环 + 对齐数据）：目标落在父列 6..8 与 9..11
  const rightContentY = rightMod.y + modHeaderH;
  const rightContentH = rightMod.h - modHeaderH - (compact ? 8 : 10);
  let ringZone, statZone;
  if (state.colSubgrid) {
    ringZone = {
      x: parentCols[6].x0,
      y: rightContentY,
      w: parentCols[8].x1 - parentCols[6].x0,
      h: rightContentH,
    };
    statZone = {
      x: parentCols[9].x0,
      y: rightContentY,
      w: parentCols[11].x1 - parentCols[9].x0,
      h: rightContentH,
    };
  } else {
    const rInset = detachedInset;
    const rw = rightMod.w - rInset * 2;
    ringZone = {
      x: rightMod.x + rInset,
      y: rightContentY,
      w: rw * 0.44,
      h: rightContentH,
    };
    statZone = {
      x: rightMod.x + rInset + rw * 0.44 + childGapPx,
      y: rightContentY,
      w: Math.max(40, rw * 0.56 - childGapPx),
      h: rightContentH,
    };
  }
  const rightDriftPx = Math.max(
    Math.abs(ringZone.x - parentCols[6].x0),
    Math.abs(statZone.x - parentCols[9].x0)
  );

  // 底部列表模块（占父列 0..11，三行 01 / 02 / 03，目标列段：[0..0], [1..3], [4..8], [9..11]）
  const listY = midY + midH + secGap;
  const listMod = {
    x: parentCols[0].x0,
    y: listY,
    w: parentCols[11].x1 - parentCols[0].x0,
    h: listH,
  };
  const listHeaderH = compact ? 20 : 25;
  const listBodyY = listMod.y + listHeaderH;
  const listBodyH = listMod.h - listHeaderH - 5;
  const listRowH = listBodyH / 3;

  const targetListCols = [
    { x: parentCols[0].x0, w: parentCols[0].x1 - parentCols[0].x0 },
    { x: parentCols[1].x0, w: parentCols[3].x1 - parentCols[1].x0 },
    { x: parentCols[4].x0, w: parentCols[8].x1 - parentCols[4].x0 },
    { x: parentCols[9].x0, w: parentCols[11].x1 - parentCols[9].x0 },
  ];

  let listCols;
  if (state.listSubgrid) {
    listCols = targetListCols.map((c) => ({ ...c }));
  } else {
    // 独立列表：写死百分比 11% / 25% / 44% / 20% + 独立内边距，脱离父轨道
    const lInset = detachedInset;
    const lw = listMod.w - lInset * 2 - childGapPx * 3;
    const pcts = [0.11, 0.25, 0.44, 0.2];
    let lx = listMod.x + lInset;
    listCols = pcts.map((p) => {
      const cw = Math.max(16, lw * p);
      const cell = { x: lx, w: cw };
      lx += cw + childGapPx;
      return cell;
    });
  }

  let listDriftPx = 0;
  for (let i = 0; i < 4; i++) {
    listDriftPx = Math.max(listDriftPx, Math.abs(listCols[i].x - targetListCols[i].x));
  }

  const listRows = [0, 1, 2].map((idx) => {
    const yOff = state.listSubgrid ? 0 : idx === 1 ? -2 : idx === 2 ? 1.5 : 0;
    return {
      index: idx,
      y: listBodyY + idx * listRowH + yOff,
      h: listRowH - (state.listSubgrid ? 2 : 3),
      cells: listCols,
      targetCells: targetListCols,
    };
  });

  // 转换成标准 CSS 逻辑像素（使 390/844/1440/2560 同一状态下锚点判定完全一致）
  const pxScale = 1 / Math.max(0.38, scale * 0.72);
  const colDriftCss = Math.round(maxColDriftPx * pxScale);
  const rightDriftCss = Math.round(rightDriftPx * pxScale);
  const listDriftCss = Math.round(listDriftPx * pxScale);
  const rowStaggerCss = Math.round((rowStaggerPx / vScale) * 1.45);

  // 逐线统计：全图 16 处关键对齐锚点（全部用标准 CSS 容差 <= 2px，跨视口恒定！）
  const tolCss = 2;
  let alignedAnchors = 0;
  const totalAnchors = 16;

  // 1) 左模块 3 卡外缘/列轨对齐（6 处）
  for (const c of leftCards) {
    if (c.driftL * pxScale <= tolCss) alignedAnchors++;
    if (c.driftR * pxScale <= tolCss) alignedAnchors++;
  }
  if (state.colSubgrid && state.childGapMode === "tight") {
    alignedAnchors = 6;
  }

  // 2) 右模块大环与数据列左缘（2 处）
  if (Math.abs(ringZone.x - parentCols[6].x0) * pxScale <= tolCss) alignedAnchors++;
  if (Math.abs(statZone.x - parentCols[9].x0) * pxScale <= tolCss) alignedAnchors++;

  // 3) 左模块 3 张卡底基线齐平且无挤爆（3 处）
  if (!rowOverflow && rowStaggerCss <= tolCss) {
    alignedAnchors += 3;
  } else if (!rowOverflow) {
    alignedAnchors += 1;
  }

  // 4) 列表 4 列左缘命中父列轨（4 处）
  for (let i = 0; i < 4; i++) {
    if (Math.abs(listCols[i].x - targetListCols[i].x) * pxScale <= tolCss) alignedAnchors++;
  }

  // 5) 局部间距未粘连且未倒挂（1 处）
  const gapOk = state.childGapMode === "inherit" || state.childGapMode === "tight";
  if (gapOk) alignedAnchors++;

  const alignedPct = Math.round((alignedAnchors / totalAnchors) * 100);

  return {
    W,
    H,
    compact,
    outer,
    grid,
    scale,
    gapPx,
    childGapPx,
    childGapLogical,
    parentCols,
    heroRect,
    leftMod,
    rightMod,
    leftCards,
    ringZone,
    statZone,
    listMod,
    listRows,
    targetListCols,
    metrics: {
      colDriftPx: Math.round(maxColDriftPx),
      colDriftCss,
      rightDriftCss,
      listDriftCss,
      rowStaggerCss,
      rowOverflow,
      overlapPx,
      alignedAnchors,
      totalAnchors,
      alignedPct,
    },
  };
}

// 规则与诊断评估（单真源，直接服务右侧诊单、四要点状态徽、画布红标与实时 CSS 代码匣）
export function evaluateState(state, layout) {
  const m = layout.metrics;
  const colDriftTightOk = state.colSubgrid && state.childGapMode === "tight";
  const passInherit = state.colSubgrid && (m.colDriftCss <= 1 || colDriftTightOk);
  const passAlign = state.rowSubgrid && !m.rowOverflow && m.rowStaggerCss <= 1;
  const passConsist = state.listSubgrid && m.listDriftCss <= 1;
  const passFlex = state.childGapMode === "inherit" || state.childGapMode === "tight";

  const checks = {
    inheritance: {
      ok: passInherit,
      badge: passInherit
        ? state.childGapMode === "tight"
          ? "父轨 + 紧槽"
          : "列轨已继承"
        : `偏轨 ${Math.max(m.colDriftCss, m.rightDriftCss)}px`,
    },
    alignment: {
      ok: passAlign,
      badge: m.rowOverflow
        ? `span ${state.rowSpan} 挤爆`
        : passAlign
          ? `齐平 span ${state.rowSpan}`
          : `落差 ${m.rowStaggerCss}px`,
    },
    consistency: {
      ok: passConsist,
      badge: passConsist ? "跨层锁线" : `列表偏 ${m.listDriftCss}px`,
    },
    flexibility: {
      ok: passFlex,
      badge:
        state.childGapMode === "inherit"
          ? `继承 ${state.parentGap}px`
          : state.childGapMode === "tight"
            ? `微调 ${layout.childGapLogical}px`
            : state.childGapMode === "zero"
              ? "0px 粘连"
              : `倒挂 ${layout.childGapLogical}px`,
    },
  };

  const passCount = [passInherit, passAlign, passConsist, passFlex].filter(Boolean).length;

  let code = "pass-standard";
  let statusTag = `${passCount}/4 · 待接通`;
  let headline = "";
  let body = "";
  let nextAction = "";
  let actionKey = null;
  let severity = "err"; // "err" | "ok"

  if (m.rowOverflow) {
    code = "row-overflow";
    statusTag = `${passCount}/4 · 跨度不足`;
    headline = `只跨了 ${state.rowSpan} 条父行轨，3 段卡片内容在末轨挤爆`;
    body = `你已开启行子网格，但子网格不会像普通网格那样自动长出额外隐式轨道。卡片内有「图标标题、正文、底栏」3 段内容，却只声明了 grid-row: span ${state.rowSpan}，第 3 段被迫倒灌进第 2 轨与正文重叠。`;
    nextAction = "把「卡片行跨度」调成 span 3 或 span 4，给每段内容留足显式轨道。";
    actionKey = "fix-span";
  } else if (state.childGapMode === "zero") {
    code = "gap-zero";
    statusTag = `${passCount}/4 · 间距粘连`;
    headline = "局部栏距覆写成 0px，相邻卡片边框撞成一团";
    body = "子网格允许局部覆写 gap 来体现灵活度，但直接清零会让文字和边框彼此贴死，破坏父网格建立起来的呼吸节奏，眼睛分不清卡片边界。";
    nextAction = "把「局部栏距」改回「继承父值」或「减半紧凑」解。";
    actionKey = "fix-gap";
  } else if (state.childGapMode === "oversized") {
    code = "gap-oversized";
    statusTag = `${passCount}/4 · 间距倒挂`;
    headline = `局部栏距 ${layout.childGapLogical}px 反超父栏距 ${state.parentGap}px，跨层节奏倒挂`;
    body = "父网格外缝定在 " + state.parentGap + "px，内部子卡片栏距却被拉宽到 " + layout.childGapLogical + "px（1.75 倍），造成卡片被挤窄且模块内松外紧，违背一致性原则。";
    nextAction = "把「局部栏距」切到「继承父值」或「减半紧凑」，先恢复父子节奏。";
    actionKey = "fix-gap";
  } else if (!passInherit) {
    code = "col-detached";
    statusTag = `${passCount}/4 · 列轨断链`;
    headline = `中排卡片偏离父列线 ${Math.max(m.colDriftCss, m.rightDriftCss)}px，左右横拖立刻漂移`;
    body = "左侧与右侧模块现在还是独立嵌套网格（写死 1fr 且带独立内边距），完全感应不到外层 12 列父网格的宽度变化。你在蓝图上左右横拖父轨道时，孙元素就像断了线的风筝。";
    nextAction = "开启「列继承 subgrid」，把中排两模块直接接通父网格 12 条垂直轨道。";
    actionKey = "fix-col";
  } else if (!passAlign) {
    code = "row-stagger";
    statusTag = `${passCount}/4 · 行高锯齿`;
    headline = `特性二折成 ${state.card2Lines} 行长文案，跨卡底线出现 ${m.rowStaggerCss}px 锯齿落差`;
    body = "即使三张卡外框对齐了父列线，但各自内部还在独立算行高：中间卡片文案变长后把自己的底栏推低，左右两张卡的底线悬在半空，扫视视线不断上下折返。";
    nextAction = "开启「行继承 subgrid」（保持 span 3 或 4），让三张卡共享同一组父行轨并同步拉平。";
    actionKey = "fix-row";
  } else if (!passConsist) {
    code = "list-detached";
    statusTag = `${passCount}/4 · 列表脱线`;
    headline = `底部列表纵线偏离上方父轨道 ${m.listDriftCss}px，跨模块秩序断层`;
    body = "中排卡片已经锁进了 12 列父线，但下方的 01/02/03 列表还在用写死的百分比列宽，导致序号、正文、日期三道纵线与上方模块上下错缝。";
    nextAction = "开启「列表双继承」，让底部列表同时继承父网格的行轨与列轨。";
    actionKey = "fix-list";
  } else {
    severity = "ok";
    if (Math.abs(state.asymmetry) >= 0.08) {
      code = "pass-asymmetric";
      statusTag = "4/4 · 非对称合法解";
      headline = "非对称父列轨全程穿透，16 处跨层锚点 100% 锁齐";
      body = `即便父网格 12 列已调为非对称主次权重（栏距 ${state.parentGap}px），中排卡片、右侧大环与底部列表仍沿同一套父线实时伸缩，证明子网格不依赖等分巧合。`;
      nextAction = "继续在画布上左右横拖测试动态咬合，或点特性二改文字行数检验拉平能力。";
    } else if (state.childGapMode === "tight") {
      code = "pass-compact";
      statusTag = "4/4 · 局部紧凑解";
      headline = `保持父轨秩序，同时局部将子栏距微调至 ${layout.childGapLogical}px`;
      body = `这是原海报第四要点「局部灵活」的合法解：继承父网格的跨列边界与跨卡行齐平，同时把内部槽宽减半收紧，在统一骨架内保留局部密度微调。`;
      nextAction = "也可以试试把行跨度故意改成 span 2，亲眼看看轨道不足时会怎么挤爆。";
    } else {
      code = "pass-standard";
      statusTag = "4/4 · 全继承达标";
      headline = "跨模块、跨层级全部接通同一套父轨道，对齐率 100%";
      body = `顶栏主标题、中排 3 张不等高特性卡、右侧统计区与底部 01–03 列表全被 12 条父列轨和共享行轨锁成一体，行落差 0px、列偏轨 0px。`;
      nextAction = "试着在画布左右横拖父轨道，或点「试错：跨度不足」体验子网格的真实边界。";
    }
  }

  // 生成原海报右下角「相关属性」活体 CSS 代码行
  const cssLines = [
    { text: ".module { display: grid;", state: "ok" },
    {
      text: state.colSubgrid
        ? "  grid-template-columns: subgrid;"
        : "  grid-template-columns: 1fr 1fr 1fr; /* 偏轨 */",
      state: state.colSubgrid ? "ok" : "err",
    },
    {
      text: state.rowSubgrid
        ? `  grid-template-rows: subgrid; /* span ${state.rowSpan} */`
        : "  grid-template-rows: auto auto auto; /* 锯齿 */",
      state: m.rowOverflow ? "err" : state.rowSubgrid ? "ok" : "err",
    },
    {
      text:
        state.childGapMode === "inherit"
          ? `  gap: inherit; /* ${state.parentGap}px */`
          : state.childGapMode === "tight"
            ? `  column-gap: ${layout.childGapLogical}px; /* 局部收紧 */`
            : `  column-gap: ${layout.childGapLogical}px; /* ${state.childGapMode === "zero" ? "粘连" : "倒挂"} */`,
      state: passFlex ? "ok" : "err",
    },
    {
      text: state.listSubgrid
        ? "  /* .list-row: columns + rows subgrid */ }"
        : "  /* .list-row: 百分比写死，未继承父线 */ }",
      state: state.listSubgrid ? "ok" : "err",
    },
  ];

  return {
    code,
    passCount,
    severity,
    statusTag,
    headline,
    body,
    nextAction,
    actionKey,
    checks,
    cssLines,
    alignedPct: m.alignedPct,
  };
}
