// 045 方形构图 · 单真源几何模型与 7 类双向错态研判引擎
// 所有视觉指标（实绘框比、四边实测边距、留白率、水平/垂直加权对称度、重心偏移、主次层级）
// 全部由同一份实绘几何坐标 computeGeometry() 算出，画布、读数、四引注、五关键词与底栏 TIPS 共享此单真源。

export const CELL_EMPTY = 0;
export const CELL_MODULE = 1; // 苔藓灰绿次级模块
export const CELL_CORE = 2;   // 深墨绿视觉主核
export const CELL_PIN = 3;    // 焦橙轴线定位点

export const CELL_LABELS = {
  [CELL_EMPTY]: "留白",
  [CELL_MODULE]: "次级模块",
  [CELL_CORE]: "视觉核心",
  [CELL_PIN]: "焦橙轴点",
};

export const SKIN_META = {
  poster: {
    id: "poster",
    name: "原海报结构",
    short: "原海报",
    desc: "1:1 承袭 045 原海报深墨绿厚方框、四角苔藓重复模块、中心主核与四枚焦橙定位钉。",
  },
  brand: {
    id: "brand",
    name: "品牌标识",
    short: "品牌标识",
    desc: "把方形网格转译为建筑事务所方印徽标：边界守住体量，中心印记一眼可辨。",
  },
  product: {
    id: "product",
    name: "产品展示",
    short: "产品展示",
    desc: "统一的 1:1 器物陈列方阵：主推器物稳坐中格，四周配件按模块对称陪衬。",
  },
  editorial: {
    id: "editorial",
    name: "海报版式",
    short: "海报版式",
    desc: "瑞士模块化展览海报：大标题核块居中镇场，日期、展厅与图符按方格对齐。",
  },
};

// 开场故意停在 0/4 复合错态：
// 1) 外框被拉扁成 1.34:1（失方）
// 2) 外框偏细且左侧边距仅 3%、右侧空出 15%（偏边贴框 + 边距不齐）
// 3) 9 格里塞入 7 块含 3 枚深绿重块，且中心格反为空白（满塞窒息 + 主次打架 + 重心左偏）
export const INITIAL_BROKEN_STATE = {
  aspect: 1.34,        // 宽/高比（1.00 为严格正方形）
  margin: 0.09,        // 基准内边距占画框边长比例（0.03–0.24）
  biasX: -0.06,        // 水平边距偏心（左偏导致左紧右松，0 为左右均等）
  borderW: 0.016,      // 深墨绿外框厚度占比（0–0.085）
  mirror: false,       // 四向对称镜像锁
  guides: true,        // 对角与中轴虚线辅助
  skin: "poster",
  brush: CELL_MODULE,  // 点击格位时使用的默认笔刷（为空格点成模块，点到同类型则清空）
  selectedCell: 4,
  highlightPillar: null,
  // 3×3 索引：0 1 2 / 3 4 5 / 6 7 8
  cells: [
    CELL_CORE, CELL_MODULE, CELL_MODULE,
    CELL_CORE, CELL_EMPTY,  CELL_MODULE,
    CELL_MODULE, CELL_CORE, CELL_EMPTY,
  ],
};

// 四种合法解（1:1 对应原海报中栏「构图方法」）+ 典型试错预设
export const PRESETS = {
  broken: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      aspect: INITIAL_BROKEN_STATE.aspect,
      margin: INITIAL_BROKEN_STATE.margin,
      biasX: INITIAL_BROKEN_STATE.biasX,
      borderW: INITIAL_BROKEN_STATE.borderW,
      mirror: false,
      cells: [...INITIAL_BROKEN_STATE.cells],
    },
  },
  poster_classic: {
    label: "重复对称 · 原海报解",
    methodName: "重复对称式",
    kind: "valid",
    patch: {
      aspect: 1.0,
      margin: 0.11,
      biasX: 0,
      borderW: 0.052,
      mirror: true,
      cells: [
        CELL_MODULE, CELL_PIN,    CELL_MODULE,
        CELL_PIN,    CELL_CORE,   CELL_PIN,
        CELL_MODULE, CELL_PIN,    CELL_MODULE,
      ],
    },
  },
  center_focus: {
    label: "中心聚焦式",
    methodName: "中心聚焦式",
    kind: "valid",
    patch: {
      aspect: 1.0,
      margin: 0.13,
      biasX: 0,
      borderW: 0.048,
      mirror: true,
      cells: [
        CELL_EMPTY, CELL_PIN,   CELL_EMPTY,
        CELL_PIN,   CELL_CORE,  CELL_PIN,
        CELL_EMPTY, CELL_PIN,   CELL_EMPTY,
      ],
    },
  },
  nine_grid: {
    label: "九宫结构式",
    methodName: "九宫结构式",
    kind: "valid",
    patch: {
      aspect: 1.0,
      margin: 0.09,
      biasX: 0,
      borderW: 0.042,
      mirror: true,
      cells: [
        CELL_MODULE, CELL_EMPTY,  CELL_MODULE,
        CELL_EMPTY,  CELL_CORE,   CELL_EMPTY,
        CELL_MODULE, CELL_EMPTY,  CELL_MODULE,
      ],
    },
  },
  frame_wrap: {
    label: "边框包围式",
    methodName: "边框包围式",
    kind: "valid",
    patch: {
      aspect: 1.0,
      margin: 0.16,
      biasX: 0,
      borderW: 0.072,
      mirror: true,
      cells: [
        CELL_EMPTY, CELL_PIN,   CELL_EMPTY,
        CELL_EMPTY, CELL_CORE,  CELL_EMPTY,
        CELL_EMPTY, CELL_PIN,   CELL_EMPTY,
      ],
    },
  },
  err_crowded: {
    label: "试错：满塞窒息",
    kind: "bad",
    patch: {
      aspect: 1.0,
      margin: 0.04,
      biasX: 0,
      borderW: 0.045,
      mirror: false,
      cells: [
        CELL_MODULE, CELL_MODULE, CELL_MODULE,
        CELL_MODULE, CELL_CORE,   CELL_MODULE,
        CELL_MODULE, CELL_MODULE, CELL_MODULE,
      ],
    },
  },
  err_flat: {
    label: "试错：无框失焦",
    kind: "bad",
    patch: {
      aspect: 1.0,
      margin: 0.10,
      biasX: 0,
      borderW: 0.004,
      mirror: false,
      cells: [
        CELL_MODULE, CELL_EMPTY,  CELL_MODULE,
        CELL_EMPTY,  CELL_MODULE, CELL_EMPTY,
        CELL_MODULE, CELL_EMPTY,  CELL_MODULE,
      ],
    },
  },
  err_tall: {
    label: "试错：拉长偏竖",
    kind: "bad",
    patch: {
      aspect: 0.76,
      margin: 0.11,
      biasX: 0.05,
      borderW: 0.048,
      mirror: false,
      cells: [
        CELL_MODULE, CELL_EMPTY, CELL_EMPTY,
        CELL_EMPTY,  CELL_CORE,  CELL_MODULE,
        CELL_MODULE, CELL_EMPTY, CELL_MODULE,
      ],
    },
  },
};

export function createInitialState() {
  return {
    ...INITIAL_BROKEN_STATE,
    cells: [...INITIAL_BROKEN_STATE.cells],
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 对称镜像格组：四角 (0,2,6,8)、四中点 (1,3,5,7)、中心 (4)
export function mirrorGroup(idx) {
  if (idx === 4) return [4];
  if (idx === 0 || idx === 2 || idx === 6 || idx === 8) return [0, 2, 6, 8];
  return [1, 3, 5, 7];
}

// 规范化坐标下的视觉权重与实体覆盖面积比例
const CELL_WEIGHT = {
  [CELL_EMPTY]: 0,
  [CELL_MODULE]: 1.45,
  [CELL_CORE]: 3.2,
  [CELL_PIN]: 0.55,
};

// 单格在单元格面积中实际占用的色块覆盖系数
const CELL_FILL_RATIO = {
  [CELL_EMPTY]: 0,
  [CELL_MODULE]: 0.72,
  [CELL_CORE]: 0.90,
  [CELL_PIN]: 0.14,
};

/**
 * 单真源几何计算：给定画布宽高 (W, H) 与状态 state，
 * 算出实际绘制的外框、内框、四边边距、3×3 九宫格坐标、模块填充矩形，
 * 并基于这些实绘矩形反推出全部测量读数。
 */
export function computeGeometry(state, W = 520, H = 520) {
  const padTop = Math.max(36, H * 0.09);
  const padBottom = Math.max(34, H * 0.085);
  const padSide = Math.max(32, W * 0.08);
  const availW = Math.max(120, W - padSide * 2);
  const availH = Math.max(120, H - padTop - padBottom);

  // 最大基准正方形边长（保证 aspect=1 时端正大方，拉宽或拉窄时平滑缩放且绝不溢出）
  const baseSide = Math.min(availW * 0.88, availH * 0.90);
  const aspect = clamp(state.aspect, 0.72, 1.42);
  let frameW, frameH;
  if (aspect >= 1) {
    // 适度以面积守恒微缩高度，避免拉宽撞出边界
    const rawW = baseSide * Math.sqrt(aspect);
    const rawH = baseSide / Math.sqrt(aspect);
    const scale = Math.min(1, availW / rawW, availH / rawH);
    frameW = rawW * scale;
    frameH = rawH * scale;
  } else {
    const rawW = baseSide * Math.sqrt(aspect);
    const rawH = baseSide / Math.sqrt(aspect);
    const scale = Math.min(1, availW / rawW, availH / rawH);
    frameW = rawW * scale;
    frameH = rawH * scale;
  }

  const fx = (W - frameW) * 0.5;
  const fy = padTop + (availH - frameH) * 0.5;
  const minSide = Math.min(frameW, frameH);
  const borderPx = Math.round(minSide * clamp(state.borderW, 0, 0.095));

  // 内框（扣除深墨绿边框后的可排版画芯）
  const innerX = fx + borderPx;
  const innerY = fy + borderPx;
  const innerW = Math.max(40, frameW - borderPx * 2);
  const innerH = Math.max(40, frameH - borderPx * 2);

  // 四边实测内边距（受 margin 与 biasX 影响）
  const mBase = clamp(state.margin, 0.025, 0.24);
  const maxBias = Math.max(0, mBase - 0.02);
  const biasX = clamp(state.biasX, -0.09, 0.09);
  const mLeft = clamp(mBase + biasX, 0.018, 0.30);
  const mRight = clamp(mBase - biasX, 0.018, 0.30);
  const mTop = mBase;
  const mBottom = mBase;

  const leftPx = innerW * mLeft;
  const rightPx = innerW * mRight;
  const topPx = innerH * mTop;
  const bottomPx = innerH * mBottom;

  const gridX = innerX + leftPx;
  const gridY = innerY + topPx;
  const gridW = Math.max(24, innerW - leftPx - rightPx);
  const gridH = Math.max(24, innerH - topPx - bottomPx);

  // 3×3 九宫格实绘格子（保留清晰统一的格间沟槽 gutter）
  const gutter = Math.max(4, Math.min(gridW, gridH) * 0.042);
  const cellW = (gridW - gutter * 2) / 3;
  const cellH = (gridH - gutter * 2) / 3;

  const cellRects = [];
  let filledArea = 0;
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  let coreCount = 0;
  let moduleCount = 0;
  let pinCount = 0;
  let activeCount = 0;

  const innerCx = innerX + innerW * 0.5;
  const innerCy = innerY + innerH * 0.5;

  for (let i = 0; i < 9; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = gridX + col * (cellW + gutter);
    const y = gridY + row * (cellH + gutter);
    const type = state.cells[i];

    // 实绘块大小：CORE 饱满镇中、MODULE 方正充实、PIN 为精致小焦橙方点
    let bw = 0;
    let bh = 0;
    if (type === CELL_CORE) {
      bw = cellW * 0.98;
      bh = cellH * 0.98;
      coreCount++;
      activeCount++;
    } else if (type === CELL_MODULE) {
      bw = cellW * 0.94;
      bh = cellH * 0.94;
      moduleCount++;
      activeCount++;
    } else if (type === CELL_PIN) {
      const s = Math.max(10, Math.min(cellW, cellH) * 0.28);
      bw = s;
      bh = s;
      pinCount++;
      activeCount++;
    }
    const bx = x + (cellW - bw) * 0.5;
    const by = y + (cellH - bh) * 0.5;
    const cx = x + cellW * 0.5;
    const cy = y + cellH * 0.5;

    const area = bw * bh;
    filledArea += area;

    const wgt = CELL_WEIGHT[type] || 0;
    totalWeight += wgt;
    weightedX += ((cx - innerCx) / (innerW * 0.5)) * wgt;
    weightedY += ((cy - innerCy) / (innerH * 0.5)) * wgt;

    cellRects.push({
      index: i,
      row,
      col,
      type,
      x,
      y,
      w: cellW,
      h: cellH,
      cx,
      cy,
      bx,
      by,
      bw,
      bh,
      weight: wgt,
    });
  }

  // 实测内画芯留白占比（画芯净面积减去实绘色块面积）与九宫格实体密度（色块占九宫格区面积）
  const innerArea = innerW * innerH;
  const gridArea = gridW * gridH;
  const fillRatio = clamp(filledArea / Math.max(1, innerArea), 0, 1);
  const gridFillPct = Math.round(clamp(filledArea / Math.max(1, gridArea), 0, 1) * 100);
  const whitespacePct = Math.round((1 - fillRatio) * 100);

  // 实测水平/垂直对称度：比较对称格对的视觉权重差 + 偏边差惩罚
  const hPairs = [
    [0, 2],
    [3, 5],
    [6, 8],
  ];
  const vPairs = [
    [0, 6],
    [1, 7],
    [2, 8],
  ];
  let hDiff = 0;
  let hSum = 0;
  for (const [a, b] of hPairs) {
    const wa = CELL_WEIGHT[state.cells[a]];
    const wb = CELL_WEIGHT[state.cells[b]];
    hDiff += Math.abs(wa - wb);
    hSum += Math.max(wa, wb);
  }
  let vDiff = 0;
  let vSum = 0;
  for (const [a, b] of vPairs) {
    const wa = CELL_WEIGHT[state.cells[a]];
    const wb = CELL_WEIGHT[state.cells[b]];
    vDiff += Math.abs(wa - wb);
    vSum += Math.max(wa, wb);
  }

  // 边距偏心也会直接拉低水平对称度
  const marginLeftPct = Math.round(mLeft * 100);
  const marginRightPct = Math.round(mRight * 100);
  const marginTopPct = Math.round(mTop * 100);
  const marginBottomPct = Math.round(mBottom * 100);
  const marginSpreadPct = Math.max(
    Math.abs(marginLeftPct - marginRightPct),
    Math.abs(marginLeftPct - marginTopPct),
    Math.abs(marginRightPct - marginTopPct)
  );

  const rawSymH = hSum > 0 ? 1 - hDiff / hSum : 1;
  const rawSymV = vSum > 0 ? 1 - vDiff / vSum : 1;
  const biasPenalty = clamp(marginSpreadPct / 28, 0, 0.55);
  const symH = Math.round(clamp(rawSymH * (1 - biasPenalty), 0, 1) * 100);
  const symV = Math.round(clamp(rawSymV, 0, 1) * 100);
  const symScore = activeCount === 0 ? 0 : Math.round((symH * 0.58 + symV * 0.42));

  // 归一化视觉重心偏移（-1..1，0 为正中心）
  const cogX = totalWeight > 0 ? weightedX / totalWeight : 0;
  const cogY = totalWeight > 0 ? weightedY / totalWeight : 0;
  const cogDist = Math.hypot(cogX, cogY);

  // 实绘外框长宽比（真实像素值）
  const measuredAspect = +(frameW / frameH).toFixed(2);
  const borderPct = +(borderPx / minSide * 100).toFixed(1);

  return {
    W,
    H,
    frame: { x: fx, y: fy, w: frameW, h: frameH, borderPx, borderPct },
    inner: { x: innerX, y: innerY, w: innerW, h: innerH, cx: innerCx, cy: innerCy },
    grid: { x: gridX, y: gridY, w: gridW, h: gridH, gutter, cellW, cellH },
    margins: {
      left: marginLeftPct,
      right: marginRightPct,
      top: marginTopPct,
      bottom: marginBottomPct,
      spread: marginSpreadPct,
      basePct: Math.round(mBase * 100),
      leftPx,
      rightPx,
      topPx,
      bottomPx,
    },
    cells: cellRects,
    counts: {
      core: coreCount,
      module: moduleCount,
      pin: pinCount,
      active: activeCount,
      empty: 9 - activeCount,
    },
    measuredAspect,
    whitespacePct,
    gridFillPct,
    symH,
    symV,
    symScore,
    cog: { x: cogX, y: cogY, dist: cogDist, pct: Math.round(cogDist * 100) },
    // 4 条原海报标注锚点坐标（画布内，供右侧引注或画布指示线使用）
    anchors: {
      frame: { x: fx + frameW - borderPx * 0.5, y: fy + frameH * 0.08 },
      focus: { x: cellRects[4].cx + cellRects[4].bw * 0.35, y: cellRects[4].cy },
      symmetry: { x: innerX + innerW * 0.72, y: innerY + innerH * 0.68 },
      module: { x: cellRects[8].cx, y: cellRects[8].cy + cellRects[8].h * 0.25 },
    },
  };
}

/**
 * 单真源诊断：严格基于 computeGeometry 的实测值判定 4 支柱、7 类双向错态、
 * 5 枚原海报核心关键词、4 条原海报 TIPS，以及当前匹配到的合法构图方法。
 */
export function evaluate(state, geom) {
  const { measuredAspect, margins, whitespacePct, gridFillPct, symScore, symH, symV, cog, counts, frame } = geom;

  // 各项核心阈值（全部源于实绘几何单真源，兼容原海报 4 种合法构图方法）
  const isSquare = Math.abs(measuredAspect - 1) <= 0.06;
  const isWide = measuredAspect > 1.06;
  const isTall = measuredAspect < 0.94;
  const borderTooThin = frame.borderPct < 2.2;
  const borderTooHeavy = frame.borderPct > 8.6;
  const marginUneven = margins.spread > 3;
  const marginTooTight = Math.min(margins.left, margins.right, margins.top) < 5;

  // 空荡失锚：完全空框，或连一枚主体块（核心/模块）都没有；中心聚焦式(1核+4橙钉)与边框包围式(1核+厚框)均合法！
  const isEmpty = counts.active === 0 || (counts.core === 0 && counts.module === 0);
  // 满塞窒息：九宫格塞进 >= 7 块实体，或九宫格实体密度 >= 66%，或整芯留白跌破 42%
  const isCrowded = counts.core + counts.module >= 7 || gridFillPct >= 66 || whitespacePct < 42;
  const centerIsCore = state.cells[4] === CELL_CORE;
  const multiCore = counts.core > 1;
  const noCore = counts.core === 0;
  const flatModules = noCore && counts.module >= 3;

  // 边框包围式允许仅有中核+厚框+少许点缀，故判断「秩序节奏」时兼容 4 种原海报构图法
  const hasGoodCenterFocus = centerIsCore && !multiCore;
  const symOk = !isEmpty && symScore >= 84 && cog.pct <= 10;
  const frameOk = isSquare && !borderTooThin && !borderTooHeavy && !marginUneven && !marginTooTight;
  const rhythmOk = !isEmpty && !isCrowded && (counts.module >= 2 || counts.pin >= 2 || frame.borderPct >= 5.8);

  const pillars = {
    frame: {
      id: "frame",
      ok: frameOk,
      tag: !isSquare
        ? (isWide ? `扁框 ${measuredAspect.toFixed(2)}:1` : `竖框 ${measuredAspect.toFixed(2)}:1`)
        : borderTooThin
          ? "外框过弱"
          : borderTooHeavy
            ? "外框过厚"
            : marginUneven
              ? `边距差 ${margins.spread}%`
              : marginTooTight
                ? `贴边 ${Math.min(margins.left, margins.right, margins.top)}%`
                : `1:1 · 均距 ${margins.basePct}%`,
    },
    focus: {
      id: "focus",
      ok: hasGoodCenterFocus,
      tag: multiCore
        ? `${counts.core} 核抢戏`
        : noCore
          ? (flatModules ? "平权无主" : "缺中心核")
          : !centerIsCore
            ? "主核偏格"
            : "中心锁定",
    },
    symmetry: {
      id: "symmetry",
      ok: symOk,
      tag: isEmpty
        ? "空框无重"
        : symOk
          ? `对称 ${symScore}%`
          : symH < symV
            ? `左右失衡 ${symH}%`
            : `上下失衡 ${symV}%`,
    },
    module: {
      id: "module",
      ok: rhythmOk,
      tag: isEmpty
        ? "空荡失锚"
        : isCrowded
          ? `满塞 · 格占 ${gridFillPct}%`
          : !rhythmOk
            ? "缺模块节奏"
            : `留白 ${whitespacePct}%`,
    },
  };

  const passedCount = Object.values(pillars).filter((p) => p.ok).length;

  // 收集当前激活的所有双向错态（按视觉破坏优先级排列）
  const issues = [];

  if (isWide) {
    issues.push({
      code: "aspect_wide",
      short: `失方扁框 ${measuredAspect.toFixed(2)}:1`,
      headline: `外框拉扁到 ${measuredAspect.toFixed(2)}:1，方形安定感已被横向动势冲散`,
      body: "正方形四边等长才能把视线稳稳收在框内。现在水平边明显长于垂直边，眼睛会顺着横轴左右扫动——这已经滑进矩形构图的领地，不再是方正中立的框架。",
      hint: "向左横拖画布，把宽窄比收回到 1.00:1，看到四角亮起焦橙定位钉即锁正。",
      actionLabel: "校准回 1:1 正方形",
      actionType: "fix_aspect",
    });
  } else if (isTall) {
    issues.push({
      code: "aspect_tall",
      short: `失方竖框 ${measuredAspect.toFixed(2)}:1`,
      headline: `外框拉瘦到 ${measuredAspect.toFixed(2)}:1，纵向纵深压过了四向均衡`,
      body: "竖长边框会迫使眼睛上下往返浏览，原本四边均等的包裹感被打破。想传达秩序与方正，需要先把画框回到 1:1 等边比例。",
      hint: "向右横拖画布，把竖框拉回 1.00:1 等边正方形。",
      actionLabel: "校准回 1:1 正方形",
      actionType: "fix_aspect",
    });
  }

  if (marginUneven) {
    const tightSide = margins.left < margins.right ? "左" : "右";
    issues.push({
      code: "margin_uneven",
      short: `偏边差 ${margins.spread}%`,
      headline: `左右边距差达 ${margins.spread}%（左 ${margins.left}% / 右 ${margins.right}%），网格偏向${tightSide}沿`,
      body: "方形构图最怕「外框正、内芯偏」。左右留白不均时，整组模块像没贴准的邮票一样滑向纸边，一眼就露出仓促感。",
      hint: "把「水平偏边」拨回 0%，或拖平四边留白让内外两层同轴。",
      actionLabel: "对齐四边均等边距",
      actionType: "fix_margin",
    });
  } else if (marginTooTight) {
    issues.push({
      code: "margin_tight",
      short: `贴边仅 ${Math.min(margins.left, margins.right, margins.top)}%`,
      headline: `内边距仅剩 ${Math.min(margins.left, margins.right, margins.top)}%，模块紧勒边框喘不过气`,
      body: "元素几乎顶在厚框内壁上，框与内容黏成一团，失去「容器托住内容」的呼吸缓冲。",
      hint: "把「内留白」拉到 9%–16% 区间，给方块周围留出匀称空气。",
      actionLabel: "拉开呼吸边距至 11%",
      actionType: "fix_margin",
    });
  }

  if (borderTooThin) {
    issues.push({
      code: "border_weak",
      short: "外框失守",
      headline: `边框厚度仅 ${frame.borderPct}%，四周元素缺少「边缘框定」的束缚力`,
      body: "没有清晰的边界把模块兜住，零散方块容易向纸面外侧逸散。方形构图靠外框先立住容器，内部秩序才立得住。",
      hint: "把「边框厚薄」推高到 3.5%–7%，重立深墨绿边界。",
      actionLabel: "加厚深墨绿外框",
      actionType: "fix_border",
    });
  } else if (borderTooHeavy) {
    issues.push({
      code: "border_heavy",
      short: "粗框压芯",
      headline: `边框过厚（${frame.borderPct}%），重框反客为主压扁了内部舞台`,
      body: "边框的作用是保护和聚拢，而不是吞掉画芯面积。框厚超过 8.5% 后，九宫格被挤得发紧，视线全被黑绿外框吸走。",
      hint: "把「边框厚薄」退回 4%–7% 区间。",
      actionLabel: "收细外框至适中",
      actionType: "fix_border",
    });
  }

  if (isEmpty) {
    issues.push({
      code: "empty",
      short: "空荡失锚",
      headline: `画芯留白高达 ${whitespacePct}%，只剩空方框没有视觉落点`,
      body: "留白不是越空越好。框内缺少中心主核与模块对照，视线滑过空框抓不到任何信息锚点。",
      hint: "点击九宫格中心落下一枚深绿主核，再对称点缀几枚次级模块。",
      actionLabel: "落印原海报均衡阵",
      actionType: "fix_cells",
    });
  } else if (isCrowded) {
    issues.push({
      code: "crowded",
      short: `满塞 · 格占 ${gridFillPct}%`,
      headline: `九宫格塞入 ${counts.core + counts.module} 块实体（格内占 ${gridFillPct}%），画面发闷窒息`,
      body: `虽然四周边距留着空气，但内容九宫格已被实体方块挤占了 ${gridFillPct}%，格与格之间几乎没有停顿空隙，方框退化成密不透风的瓷砖墙。`,
      hint: "直接点击画布里多余的深色或苔藓模块将其清空，让九宫格保留清晰呼吸空位。",
      actionLabel: "清简冗余腾出留白",
      actionType: "fix_cells",
    });
  }

  if (!hasGoodCenterFocus && !isEmpty) {
    if (multiCore) {
      issues.push({
        code: "multi_core",
        short: `${counts.core} 核争宠`,
        headline: `同时放了 ${counts.core} 枚深绿主核，视觉焦点彼此打架`,
        body: "方框里如果多处都是最深最重的体量，眼睛会在几个重块间反复横跳，中心聚焦荡然无存。",
        hint: "保留正中 1 枚深绿主核，把其余重块点成浅苔藓模块或留白。",
        actionLabel: "收敛为单一中心核",
        actionType: "fix_focus",
      });
    } else if (noCore) {
      issues.push({
        code: "no_core",
        short: "主次平权",
        headline: "全图都是同等浅重的模块，找不到第一眼该看的核心",
        body: "没有明确深浅或体量主次时，所有格子平均用力，秩序会迅速流于平淡乏味。",
        hint: "选中「视觉核心」笔刷并点击正中格，立刻建立聚焦中心。",
        actionLabel: "点亮中心视觉主核",
        actionType: "fix_focus",
      });
    } else if (!centerIsCore) {
      issues.push({
        code: "off_center_core",
        short: "主核偏格",
        headline: "深绿主核离开了正中格，把整幅正方形的重心拽歪了",
        body: "在对称型方形框架中，主核偏离中央会产生强烈的倾斜拉力；除非刻意做非对称平衡，否则会让结构显得摇晃。",
        hint: "把深绿主核挪回正中格，或点击右侧修正按钮归心。",
        actionLabel: "主核归入正中格",
        actionType: "fix_focus",
      });
    }
  }

  if (!symOk && !isEmpty) {
    const dir = cog.x < -0.08 ? "偏左" : cog.x > 0.08 ? "偏右" : cog.y < -0.08 ? "偏上" : "偏下";
    issues.push({
      code: "asymmetric",
      short: `对称 ${symScore}% · ${dir}`,
      headline: `视觉权重${dir}，综合对称度仅 ${symScore}%（左右 ${symH}% / 上下 ${symV}%）`,
      body: "正方形的安定感很大程度来自四向力矩相互抵消。现在一侧压满重块、对侧空悬，画面像没配平的天平向一边歪斜。",
      hint: "开启「四向镜像锁」再点四角或四中点，让左右上下重量自动配平。",
      actionLabel: "配平四向对称模块",
      actionType: "fix_symmetry",
    });
  }

  if (!rhythmOk && !isEmpty && !isCrowded) {
    issues.push({
      code: "weak_rhythm",
      short: "缺模块呼应",
      headline: "仅有孤立主核，外框厚度和四周模块都没撑起节奏",
      body: "单一小块孤零零悬在细框里，既没有「边框包围式」的厚重保护，也缺少「模块重复」的网格节拍。",
      hint: "在四角添上 4 枚苔藓模块或 4 枚焦橙轴点，或者加厚深墨绿外框形成包围感。",
      actionLabel: "补齐四角对称节奏",
      actionType: "fix_rhythm",
    });
  }

  // 判断成立时的具体构图方法归属（接受原海报 4 种全部合法解！）
  let matchedMethod = null;
  if (passedCount === 4) {
    if (frame.borderPct >= 6.0 && counts.module === 0) {
      matchedMethod = {
        name: "边框包围式",
        headline: "秩序成立 · 边框包围式：厚框稳稳兜住留白与中心",
        body: `1:1 正方配 ${frame.borderPct}% 厚墨绿框与 ${margins.basePct}% 均等内距，把视线牢牢聚拢在中心主核，安全感与完整度拉满。`,
      };
    } else if (counts.module >= 4 && counts.pin >= 4) {
      matchedMethod = {
        name: "重复对称式（原海报经典解）",
        headline: "秩序成立 · 重复对称式：完美复现 045 原海报方阵",
        body: `外框 1:1 等边、四边均距 ${margins.basePct}%、对称度 ${symScore}%、留白 ${whitespacePct}%。四角苔藓模块与四枚焦橙轴点围合中央深绿核，理性又呼吸从容。`,
      };
    } else if (counts.module >= 4 && counts.pin === 0) {
      matchedMethod = {
        name: "九宫结构式",
        headline: "秩序成立 · 九宫结构式：格位清晰、主次与留白兼得",
        body: `3×3 等分网格里以 1 核带 ${counts.module} 块次级模块，留白占 ${whitespacePct}%，既不呆板满塞，又有严谨的模块秩序。`,
      };
    } else {
      matchedMethod = {
        name: "中心聚焦式",
        headline: "秩序成立 · 中心聚焦式：单一强核稳镇正方中央",
        body: `以 ${whitespacePct}% 充沛留白托起中央主核，辅以对称轻点缀（对称度 ${symScore}%），第一眼焦点毫无干扰。`,
      };
    }
  }

  // 秩序态势档位（按 BRIEF.md 规则不报假精确「秩序指数 94.3%」，改报清晰档位 + 标注示意）
  const posture = passedCount === 4
    ? "稳定成序（示意）"
    : passedCount === 3
      ? "差一步定型（示意）"
      : passedCount >= 1
        ? "结构偏斜（示意）"
        : "多处失序（示意）";

  // 5 枚原海报核心关键词（单真源）
  const keywords = {
    order: { zh: "秩序", en: "ORDER", ok: passedCount >= 3 && hasGoodCenterFocus },
    balance: { zh: "均衡", en: "BALANCE", ok: symOk },
    frame: { zh: "框架", en: "FRAME", ok: isSquare && !borderTooThin && !borderTooHeavy },
    stability: { zh: "稳定", en: "STABILITY", ok: isSquare && symOk && !marginUneven },
    space: { zh: "留白", en: "SPACE", ok: !isEmpty && !isCrowded && !marginTooTight },
  };

  // 4 条原海报 TIPS 实况对勾（单真源）
  const tips = [
    {
      text: "保持边距一致，增强整体感。",
      ok: !marginUneven && !marginTooTight && isSquare,
      note: marginUneven ? `当前差 ${margins.spread}%` : marginTooTight ? "贴边过紧" : !isSquare ? "先校准 1:1" : `均距 ${margins.basePct}%`,
    },
    {
      text: "控制元素数量，避免拥挤。",
      ok: !isCrowded && !isEmpty,
      note: isCrowded ? `实体 ${counts.core + counts.module} 块过满` : isEmpty ? "画芯偏空" : `有效 ${counts.active} 格`,
    },
    {
      text: "突出主次关系，强化焦点。",
      ok: hasGoodCenterFocus,
      note: hasGoodCenterFocus ? "单核清晰" : multiCore ? `${counts.core} 核冲突` : "缺中心主核",
    },
    {
      text: "善用留白，让画面更呼吸。",
      ok: !isCrowded && !isEmpty && !marginTooTight,
      note: isCrowded ? `格占 ${gridFillPct}% 过挤` : isEmpty ? "空荡缺核" : `画芯留白 ${whitespacePct}%`,
    },
  ];

  const primary = issues[0] || null;
  const badgeText = passedCount === 4
    ? `4/4 · ${matchedMethod.name.split("（")[0]}`
    : `${passedCount}/4 · ${primary ? primary.short : "待校准"}`;

  return {
    passedCount,
    isPass: passedCount === 4,
    badgeText,
    posture,
    pillars,
    issues,
    primary,
    matchedMethod,
    keywords,
    tips,
  };
}

// 按当前最高优先级诊断执行一步精准修正（而不是一上来直接剧透全满答案，当然也支持连续点逐步修完）
export function applyFixStep(state, actionType) {
  switch (actionType) {
    case "fix_aspect":
      state.aspect = 1.0;
      break;
    case "fix_margin":
      state.biasX = 0;
      state.margin = clamp(state.margin < 0.08 ? 0.11 : state.margin, 0.09, 0.16);
      break;
    case "fix_border":
      state.borderW = 0.052;
      break;
    case "fix_focus": {
      // 清掉非中心的其他主核为次级模块，并把中心设为深绿主核
      for (let i = 0; i < 9; i++) {
        if (i !== 4 && state.cells[i] === CELL_CORE) state.cells[i] = CELL_MODULE;
      }
      state.cells[4] = CELL_CORE;
      break;
    }
    case "fix_cells": {
      state.cells = [
        CELL_MODULE, CELL_PIN, CELL_MODULE,
        CELL_PIN, CELL_CORE, CELL_PIN,
        CELL_MODULE, CELL_PIN, CELL_MODULE,
      ];
      state.mirror = true;
      break;
    }
    case "fix_symmetry": {
      // 以当前四角/四边配平对称
      const cornerHas = [0, 2, 6, 8].some((i) => state.cells[i] === CELL_MODULE);
      const midHasPin = [1, 3, 5, 7].some((i) => state.cells[i] === CELL_PIN || state.cells[i] === CELL_MODULE);
      const cornerVal = cornerHas ? CELL_MODULE : CELL_EMPTY;
      const midVal = midHasPin ? CELL_PIN : (cornerVal === CELL_EMPTY ? CELL_PIN : CELL_EMPTY);
      state.cells = [
        cornerVal, midVal, cornerVal,
        midVal, CELL_CORE, midVal,
        cornerVal, midVal, cornerVal,
      ];
      state.biasX = 0;
      state.mirror = true;
      break;
    }
    case "fix_rhythm": {
      state.cells = [
        CELL_MODULE, CELL_PIN, CELL_MODULE,
        CELL_PIN, CELL_CORE, CELL_PIN,
        CELL_MODULE, CELL_PIN, CELL_MODULE,
      ];
      state.mirror = true;
      break;
    }
    default:
      Object.assign(state, PRESETS.poster_classic.patch, { cells: [...PRESETS.poster_classic.patch.cells] });
  }
}
