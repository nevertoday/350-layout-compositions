// 108 图案组织 · 单一几何与诊断真源
// 画面绘制、跨缝拓扑检测、占空比核算、实时诊单全部读这份状态，无写死常量。
import { PALETTE } from "./palette.js";

export const GRID_COLS = 6;
export const GRID_ROWS = 4;
export const TOTAL_TILES = GRID_COLS * GRID_ROWS; // 24

// 象限顺序：0=左上(TL), 1=右上(TR), 2=左下(BL), 3=右下(BR)
export const QUAD_LABELS = ["左上", "右上", "左下", "右下"];

export const KINDS = {
  arc: { id: "arc", label: "弧", full: "四分之一弧", area: 0.62 },
  circle: { id: "circle", label: "圆", full: "琥珀金圆", area: 0.48 },
  square: { id: "square", label: "方", full: "琥珀金方", area: 0.80 },
  empty: { id: "empty", label: "空", full: "绿底留气", area: 0.0 },
};

export const RULES = {
  p1: {
    id: "p1",
    code: "p1",
    label: "纯平移",
    desc: "整砖按水平与垂直方向原样平移重复，最稳也最容易暴露网格沟槽。",
    defaultOffset: 0,
  },
  cm: {
    id: "cm",
    code: "cm",
    label: "错行滑移",
    desc: "奇数行水平错开半砖并左右镜像，把呆板竖缝化为连绵 S 形波流。",
    defaultOffset: 0.5,
  },
  pmm: {
    id: "pmm",
    code: "pmm",
    label: "四向镜像",
    desc: "隔列左右镜像、隔行上下镜像，单块弧砖在接缝处自动合出四角星芒与连拱。",
    defaultOffset: 0,
  },
  p4: {
    id: "p4",
    code: "p4",
    label: "四重旋转",
    desc: "相邻四砖按 0°/90°/180°/270° 依次旋转，像风车一样编出特鲁谢回环。",
    defaultOffset: 0,
  },
};

// 经验舒适带（页面上标明「经验参考」）
export const THRESHOLDS = {
  inkMin: 0.28,
  inkMax: 0.68,
  alignTol: 0.055,
  continuityMin: 0.72,
  minCrossLocks: 10,
  subMin: 2,
  subMax: 10,
};

// 开场 0/4 错态：
// 1) 母砖塞满 3 方 + 1 弧（覆墨 76% > 68%，过满发花）
// 2) 行错缝卡在 28%（歪斜阶梯，既不齐整也不落半砖）
// 3) 跨缝咬合 0%（弧口撞上死墙且行缝错剪）
// 4) 0 块局部密分（24 砖全等壁纸）
export function createBrokenState() {
  return {
    cells: [
      { kind: "arc", rot: 1 },
      { kind: "square", rot: 0 },
      { kind: "square", rot: 0 },
      { kind: "square", rot: 0 },
    ],
    activeQuad: 0,
    rule: "p1",
    rowOffset: 0.28,
    subdivided: [], // 存 "r,c" 字符串
    showSeams: true,
  };
}

// 预设对照态（供用户看懂两种典型错误或还原海报结构；注意开场不提供一键通关）
export const PRESETS = {
  broken: createBrokenState,
  glare: () => ({
    cells: [
      { kind: "square", rot: 0 },
      { kind: "square", rot: 0 },
      { kind: "square", rot: 0 },
      { kind: "square", rot: 0 },
    ],
    activeQuad: 0,
    rule: "p1",
    rowOffset: 0,
    subdivided: Array.from({ length: TOTAL_TILES }, (_, i) => `${Math.floor(i / GRID_COLS)},${i % GRID_COLS}`),
    showSeams: true,
  }),
  posterUpper: () => ({
    cells: [
      { kind: "arc", rot: 0 },
      { kind: "square", rot: 0 },
      { kind: "arc", rot: 3 },
      { kind: "circle", rot: 0 },
    ],
    activeQuad: 0,
    rule: "p1",
    rowOffset: 0,
    subdivided: ["2,4", "2,5", "3,4", "3,5"],
    showSeams: true,
  }),
  posterLower: () => ({
    cells: [
      { kind: "arc", rot: 0 },
      { kind: "arc", rot: 1 },
      { kind: "arc", rot: 3 },
      { kind: "circle", rot: 0 },
    ],
    activeQuad: 0,
    rule: "pmm",
    rowOffset: 0,
    subdivided: ["2,4", "2,5", "3,4", "3,5"],
    showSeams: true,
  }),
};

// ---------- 几何变换 ----------
// arc.rot: 0=圆心在左上(直边: top,left), 1=右上(top,right), 2=右下(right,bottom), 3=左下(bottom,left)
const FLIP_X_ROT = [1, 0, 3, 2];
const FLIP_Y_ROT = [3, 2, 1, 0];

function cloneCell(c) {
  return { kind: c.kind, rot: ((c.rot || 0) % 4 + 4) % 4 };
}

export function flipTileX(cells) {
  const c = cells.map(cloneCell);
  return [
    { ...c[1], rot: FLIP_X_ROT[c[1].rot] },
    { ...c[0], rot: FLIP_X_ROT[c[0].rot] },
    { ...c[3], rot: FLIP_X_ROT[c[3].rot] },
    { ...c[2], rot: FLIP_X_ROT[c[2].rot] },
  ];
}

export function flipTileY(cells) {
  const c = cells.map(cloneCell);
  return [
    { ...c[2], rot: FLIP_Y_ROT[c[2].rot] },
    { ...c[3], rot: FLIP_Y_ROT[c[3].rot] },
    { ...c[0], rot: FLIP_Y_ROT[c[0].rot] },
    { ...c[1], rot: FLIP_Y_ROT[c[1].rot] },
  ];
}

export function rotateTileCW(cells, steps = 1) {
  let cur = cells.map(cloneCell);
  const n = ((steps % 4) + 4) % 4;
  for (let i = 0; i < n; i++) {
    // 顺时针转 90°: 新 TL <- 旧 BL(2), 新 TR <- 旧 TL(0), 新 BL <- 旧 BR(3), 新 BR <- 旧 TR(1)
    cur = [
      { ...cur[2], rot: (cur[2].rot + 1) % 4 },
      { ...cur[0], rot: (cur[0].rot + 1) % 4 },
      { ...cur[3], rot: (cur[3].rot + 1) % 4 },
      { ...cur[1], rot: (cur[1].rot + 1) % 4 },
    ];
  }
  return cur;
}

export function getEffectiveTile(cells, rule, r, c) {
  let out = cells.map(cloneCell);
  if (rule === "cm") {
    if (Math.abs(r) % 2 === 1) out = flipTileX(out);
  } else if (rule === "pmm") {
    if (Math.abs(c) % 2 === 1) out = flipTileX(out);
    if (Math.abs(r) % 2 === 1) out = flipTileY(out);
  } else if (rule === "p4") {
    const r2 = ((r % 2) + 2) % 2;
    const c2 = ((c % 2) + 2) % 2;
    const steps = r2 === 0 ? (c2 === 0 ? 0 : 1) : (c2 === 0 ? 3 : 2);
    out = rotateTileCW(out, steps);
  }
  return out;
}

// 每个象限的直边接口（仅 arc 向边缘伸出贴缝直边；start/end 表示圆心靠近该边起点还是终点）
export function arcPorts(cell) {
  if (!cell || cell.kind !== "arc") return { top: null, right: null, bottom: null, left: null };
  switch (((cell.rot % 4) + 4) % 4) {
    case 0: return { top: "start", right: null, bottom: null, left: "start" };
    case 1: return { top: "end", right: "start", bottom: null, left: null };
    case 2: return { top: null, right: "end", bottom: "end", left: null };
    case 3: return { top: null, right: null, bottom: "start", left: "end" };
    default: return { top: null, right: null, bottom: null, left: null };
  }
}

// ---------- 单源实测与诊断 ----------
export function analyzePattern(state, rows = GRID_ROWS, cols = GRID_COLS) {
  const { cells, rule, rowOffset, subdivided = [] } = state;

  // 1. 母砖构成与覆墨占空比
  const inkRatio = cells.reduce((sum, c) => sum + (KINDS[c.kind]?.area || 0), 0) / 4;
  const inkPct = Math.round(inkRatio * 100);
  const activeKinds = new Set(cells.filter((c) => c.kind !== "empty").map((c) => c.kind));
  const arcCountInMaster = cells.filter((c) => c.kind === "arc").length;
  const nonEmptyCount = cells.filter((c) => c.kind !== "empty").length;

  let moduleOk = true;
  let moduleState = "均衡";
  let moduleFault = "";
  if (nonEmptyCount === 0 || inkRatio < THRESHOLDS.inkMin) {
    moduleOk = false;
    moduleState = `过空 ${inkPct}%`;
    moduleFault = "sparse";
  } else if (inkRatio > THRESHOLDS.inkMax) {
    moduleOk = false;
    moduleState = `过满 ${inkPct}%`;
    moduleFault = "overpacked";
  } else if (activeKinds.size < 2 && arcCountInMaster < 4) {
    moduleOk = false;
    moduleState = "单形退化";
    moduleFault = "monotone";
  }

  // 2. 平铺行缝规整度
  const off = ((rowOffset % 1) + 1) % 1;
  const d0 = Math.min(off, 1 - off);
  const d50 = Math.abs(off - 0.5);
  const isAligned = d0 <= THRESHOLDS.alignTol;
  const isHalfDrop = d50 <= THRESHOLDS.alignTol;
  const rowSheared = !isAligned && !isHalfDrop;
  const offsetPct = Math.round(off * 100);

  // pmm / p4 本身依赖 0% 对齐才锁住四向对称，但若用户用 50% 半砖错缝也能视实际接口检验
  const tileOk = !rowSheared;
  let tileState = isAligned ? "对齐 0%" : isHalfDrop ? "半砖 50%" : `歪斜 ${offsetPct}%`;

  // 3. 跨缝拓扑连通实测（按 2×2 子格构建完整平面）
  const subRows = rows * 2;
  const subCols = cols * 2;
  const subGrid = Array.from({ length: subRows }, () => Array(subCols).fill(null));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const eff = getEffectiveTile(cells, rule, r, c);
      subGrid[r * 2][c * 2] = eff[0];
      subGrid[r * 2][c * 2 + 1] = eff[1];
      subGrid[r * 2 + 1][c * 2] = eff[2];
      subGrid[r * 2 + 1][c * 2 + 1] = eff[3];
    }
  }

  let totalArcs = 0;
  let linkedArcs = 0;
  let crossTileLocks = 0;
  const lockPoints = [];
  const breakPoints = [];

  for (let sr = 0; sr < subRows; sr++) {
    const macroR = Math.floor(sr / 2);
    const isOddRow = macroR % 2 === 1;
    const rowShiftSub = isOddRow ? off * 2 : 0;

    for (let sc = 0; sc < subCols; sc++) {
      const cell = subGrid[sr][sc];
      if (!cell || cell.kind !== "arc") continue;
      totalArcs++;
      const p = arcPorts(cell);
      let linked = false;

      // 检查 4 个方向邻居
      // RIGHT
      if (p.right) {
        const nsc = (sc + 1) % subCols;
        const np = arcPorts(subGrid[sr][nsc]);
        const isMacroSeam = sc % 2 === 1;
        if (np.left) {
          linked = true;
          if (isMacroSeam) crossTileLocks++;
          if (sc < subCols - 1) {
            lockPoints.push({
              x: (sc + 1 + rowShiftSub) % subCols,
              y: sr + 0.5,
              dir: "v",
              smooth: p.right === np.left,
            });
          }
        }
      }
      // LEFT
      if (p.left) {
        const nsc = (sc - 1 + subCols) % subCols;
        const np = arcPorts(subGrid[sr][nsc]);
        const isMacroSeam = sc % 2 === 0;
        if (np.right) {
          linked = true;
          if (isMacroSeam) crossTileLocks++;
        }
      }
      // BOTTOM
      if (p.bottom) {
        const isMacroSeam = sr % 2 === 1;
        const nsr = (sr + 1) % subRows;
        if (!isMacroSeam) {
          const np = arcPorts(subGrid[nsr][sc]);
          if (np.top) {
            linked = true;
            lockPoints.push({
              x: (sc + 0.5 + rowShiftSub) % subCols,
              y: sr + 1,
              dir: "h",
              smooth: p.bottom === np.top,
            });
          }
        } else if (rowSheared) {
          if (sr < subRows - 1) {
            breakPoints.push({
              x: (sc + 0.5 + rowShiftSub) % subCols,
              y: sr + 1,
              dir: "h",
            });
          }
        } else {
          // 对齐或 50% 半砖错缝下的跨行邻居
          const delta = isHalfDrop ? (isOddRow ? 1 : -1) : 0;
          const nsc = (sc + delta + subCols) % subCols;
          const np = arcPorts(subGrid[nsr][nsc]);
          if (np.top) {
            linked = true;
            crossTileLocks++;
            if (sr < subRows - 1) {
              lockPoints.push({
                x: (sc + 0.5 + rowShiftSub) % subCols,
                y: sr + 1,
                dir: "h",
                smooth: p.bottom === np.top,
              });
            }
          } else if (sr < subRows - 1) {
            breakPoints.push({
              x: (sc + 0.5 + rowShiftSub) % subCols,
              y: sr + 1,
              dir: "h",
            });
          }
        }
      }
      // TOP
      if (p.top) {
        const isMacroSeam = sr % 2 === 0;
        const nsr = (sr - 1 + subRows) % subRows;
        if (!isMacroSeam) {
          const np = arcPorts(subGrid[nsr][sc]);
          if (np.bottom) linked = true;
        } else if (!rowSheared) {
          const delta = isHalfDrop ? (isOddRow ? 1 : -1) : 0;
          const nsc = (sc + delta + subCols) % subCols;
          const np = arcPorts(subGrid[nsr][nsc]);
          if (np.bottom) {
            linked = true;
            crossTileLocks++;
          }
        }
      }

      if (linked) {
        linkedArcs++;
      } else {
        // 孤立无任何咬合的弧，在其出口标一处断茬
        if (p.right && sc < subCols - 1) {
          breakPoints.push({ x: (sc + 1 + rowShiftSub) % subCols, y: sr + 0.5, dir: "v" });
        } else if (p.bottom && sr < subRows - 1) {
          breakPoints.push({ x: (sc + 0.5 + rowShiftSub) % subCols, y: sr + 1, dir: "h" });
        } else if (p.top && sr > 0) {
          breakPoints.push({ x: (sc + 0.5 + rowShiftSub) % subCols, y: sr, dir: "h" });
        } else if (p.left && sc > 0) {
          breakPoints.push({ x: (sc + rowShiftSub) % subCols, y: sr + 0.5, dir: "v" });
        }
      }
    }
  }

  // 每条跨砖咬合被两端各计一次，除以 2 得实际跨砖接点
  const crossSeamCount = Math.round(crossTileLocks / 2);
  const continuityRatio = totalArcs === 0 ? 0 : linkedArcs / totalArcs;
  const continuityPct = Math.round(continuityRatio * 100);
  const continuityOk =
    totalArcs >= rows * cols &&
    !rowSheared &&
    crossSeamCount >= THRESHOLDS.minCrossLocks &&
    continuityRatio >= THRESHOLDS.continuityMin;

  let continuityState = `${continuityPct}%`;
  if (totalArcs === 0) continuityState = "缺弧接口";
  else if (rowSheared) continuityState = "错缝剪断";
  else if (crossSeamCount === 0) continuityState = "孤砖自转";
  else if (!continuityOk) continuityState = `断茬 ${continuityPct}%`;
  else continuityState = `咬合 ${continuityPct}%`;

  // 4. 延展与局部密分节奏（避免死板壁纸，也防过半切碎发花）
  const validSub = subdivided.filter((k) => {
    const [rr, cc] = k.split(",").map(Number);
    return rr >= 0 && rr < rows && cc >= 0 && cc < cols;
  });
  const subCount = validSub.length;
  const subPct = Math.round((subCount / (rows * cols)) * 100);
  const expansionOk = subCount >= THRESHOLDS.subMin && subCount <= THRESHOLDS.subMax;
  let expansionState = `${subCount} 块密分`;
  if (subCount === 0) expansionState = "全等墙纸";
  else if (subCount < THRESHOLDS.subMin) expansionState = `偏少 ${subCount} 块`;
  else if (subCount > THRESHOLDS.subMax) expansionState = `碎密 ${subPct}%`;
  else expansionState = `密分 ${subPct}%`;

  const passed = [moduleOk, tileOk, continuityOk, expansionOk].filter(Boolean).length;

  // 白话诊单：按最关键失误优先级输出，说清「为什么会这样看」+「怎么调」
  let badge = "4 / 4 秩序成立";
  let headline = "母砖虚实稳妥，跨缝咬合出大图形，密分区拉开层次";
  let detail = `当前母砖覆墨 ${inkPct}%、采用 ${RULES[rule].code} ${RULES[rule].label}（行偏 ${offsetPct}%），跨砖咬合 ${crossSeamCount} 处（连贯 ${continuityPct}%），局部 2× 密分占 ${subPct}%。既能在边线外无限延展，又有清晰视觉重心。`;
  let hint = "你可以继续改母砖象限或点布面切换密分区，试试把同一套元件织出截然不同的视觉系统。";
  let level = "ok";

  if (!moduleOk) {
    level = "fault";
    badge = `错态 · 母砖失衡（${passed}/4）`;
    if (moduleFault === "overpacked") {
      headline = `母砖填满到 ${inkPct}%，深绿底色喘不过气`;
      detail = "图案组织需要图与底互相托举（经验覆墨参考带 28%–68%）。现在高占比实心块把 2×2 母砖挤死，平铺开后整面墙会闷成一片发花的亮黄块。";
      hint = "在 2×2 母砖雕刻格里点选一块「方」，换成「绿底留气」或「弧 / 圆」，立刻让底色透出骨架。";
    } else if (moduleFault === "sparse") {
      headline = `母砖覆墨仅 ${inkPct}%，铺开只剩零星散点`;
      detail = "母砖留空太多时，相邻砖块之间碰不到边缘，人眼只看到稀疏圆点，组织不出连续的图案结构。";
      hint = "在 2×2 母砖里至少补入两枚四分之一弧并搭配一枚圆或方，让覆墨回到 28%–68% 经验参考带。";
    } else {
      headline = "母砖只有单一形状，退化成普通元素重复";
      detail = "全砖用同一种孤立形状平铺，讲的是单元素重复（那是 107 重复原则的范畴），还缺少圆、方、弧复合而成的母砖结构。";
      hint = "在 2×2 母砖里混入「四分之一弧」与「圆或方」，让边缘接口和中心点缀分工合作。";
    }
  } else if (!tileOk) {
    level = "fault";
    badge = `错态 · 行缝歪斜（${passed}/4）`;
    headline = `奇数行卡在 ${offsetPct}% 歪斜位，砖墙出现阶梯错茬`;
    detail = "平铺重复可以齐缝（0%），也可以做经典半砖错缝（50%），但卡在中间的非整数偏位会让上下行的弧口彼此错开，整幅织锦像滑丝的布料。";
    hint = "拖动织锦底部的「错缝推移轨」，把它推回 0% 齐缝或 50% 半砖错缝（靠近刻度会自动轻吸）。";
  } else if (!continuityOk) {
    level = "fault";
    badge = `错态 · 接缝失连（${passed}/4）`;
    if (totalArcs === 0) {
      headline = "母砖缺少贴边弧口，砖与砖之间搭不上桥";
      detail = "圆和方都悬浮在砖格中央，跨过砖缝彼此碰不着边，只能看见一排孤立印章，长不出跨越砖缝的次级图形。";
      hint = "在 2×2 母砖里放进 1–2 枚「四分之一弧」，再配合「四向镜像 pmm」或「四重旋转 p4」让弧线跨缝相接。";
    } else if (crossSeamCount === 0) {
      headline = "弧线全缩在单砖内部，跨砖缝零咬合";
      detail = "虽然砖内有弧线，但所有弧口都背对砖边，每块母砖依然是一座孤岛，没能借平铺规则涌现出更大的连拱或星芒。";
      hint = "点按 2×2 母砖里的弧格旋转朝向，或切到「四向镜像 pmm / 错行滑移 cm」，让弧口跨过砖缝牵手。";
    } else {
      headline = `跨缝连贯率仅 ${continuityPct}%，多处弧口撞上死墙`;
      detail = `织锦上有 ${breakPoints.length} 处珊瑚红断茬标记：弧线冲到砖边却没有对位接口承接，视觉动势在砖缝处不断被打断。`;
      hint = "点选 2×2 母砖中的弧格旋转 90° 对齐接口，或把平铺规则切为「四向镜像 pmm」一键合出连续星芒。";
    }
  } else if (!expansionOk) {
    level = "fault";
    badge = `错态 · 尺度失衡（${passed}/4）`;
    if (subCount === 0) {
      headline = "24 块砖全等平铺，画面退化成单调墙纸";
      detail = "原海报特意把右下角切细成 2× 密分砖——完全均等的图案只有秩序没有主次，眼睛在整幅面上找不到停留节奏。";
      hint = "直接点击织锦画布上的 3–6 块砖格（例如右下角），把它们切分为 2× 密分子砖，拉开疏密层级。";
    } else if (subCount < THRESHOLDS.subMin) {
      headline = `仅有 ${subCount} 块密分砖，局部节奏还撑不起来`;
      detail = "单零星一块小砖容易像排版失误；成片组织 2–10 块（经验占比 8%–42%）才能形成有意的视觉重心区。";
      hint = "在相邻位置再点 1–3 块砖格，连成一片 2× 密分节奏区。";
    } else {
      headline = `超过一半区域被切碎（${subPct}%），高频纹理开始发花`;
      detail = "局部密分之所以奏效，是靠大面积标准尺度作对照。当密分面积超过 45%，细腻纹理铺满视线，反而失去主次并引发视觉疲劳。";
      hint = "点按多余的 2× 密分砖还原回标准尺度，把密分区收拢到 2–10 块（8%–42%）经验舒适带。";
    }
  }

  return {
    passed,
    level,
    badge,
    headline,
    detail,
    hint,
    inkPct,
    offsetPct,
    continuityPct,
    crossSeamCount,
    breakCount: breakPoints.length,
    subCount,
    subPct,
    lockPoints,
    breakPoints,
    checks: {
      module: { ok: moduleOk, state: moduleState },
      tile: { ok: tileOk, state: tileState },
      continuity: { ok: continuityOk, state: continuityState },
      expansion: { ok: expansionOk, state: expansionState },
    },
  };
}

// ---------- 共享 2D Canvas 砖面绘法（开场与各节共源） ----------
export function drawSubCell(ctx, cell, x, y, size, opts = {}) {
  const {
    bg = PALETTE.emerald,
    arcColor = PALETTE.cream,
    goldColor = PALETTE.gold,
    grout = 0.04,
  } = opts;
  const g = size * grout;
  const ix = x + g;
  const iy = y + g;
  const isz = size - g * 2;

  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, size, size);
  }
  if (!cell || cell.kind === "empty") return;

  if (cell.kind === "arc") {
    const rot = ((cell.rot || 0) % 4 + 4) % 4;
    ctx.fillStyle = arcColor;
    ctx.beginPath();
    // 让弧的直边贴紧子格内缘（留极细砖缝保持手工砖感）
    const r = isz;
    if (rot === 0) {
      ctx.moveTo(ix, iy);
      ctx.arc(ix, iy, r, 0, Math.PI * 0.5);
    } else if (rot === 1) {
      ctx.moveTo(ix + isz, iy);
      ctx.arc(ix + isz, iy, r, Math.PI * 0.5, Math.PI);
    } else if (rot === 2) {
      ctx.moveTo(ix + isz, iy + isz);
      ctx.arc(ix + isz, iy + isz, r, Math.PI, Math.PI * 1.5);
    } else {
      ctx.moveTo(ix, iy + isz);
      ctx.arc(ix, iy + isz, r, Math.PI * 1.5, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
  } else if (cell.kind === "square") {
    const pad = size * 0.11;
    ctx.fillStyle = goldColor;
    ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
  } else if (cell.kind === "circle") {
    const rad = size * 0.39;
    ctx.fillStyle = goldColor;
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.5, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawMacroTile(ctx, cells, x, y, tileSize, opts = {}) {
  const half = tileSize / 2;
  drawSubCell(ctx, cells[0], x, y, half, opts);
  drawSubCell(ctx, cells[1], x + half, y, half, opts);
  drawSubCell(ctx, cells[2], x, y + half, half, opts);
  drawSubCell(ctx, cells[3], x + half, y + half, half, opts);
}

// 2× 密分子砖：在一块宏观砖位内铺入 2×2 四块缩小子砖（可按当前对称规则递归）
export function drawSubdividedMacroTile(ctx, masterCells, rule, r, c, x, y, tileSize, opts = {}) {
  const mini = tileSize / 2;
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      const subEff = getEffectiveTile(masterCells, rule, r * 2 + dr, c * 2 + dc);
      drawMacroTile(ctx, subEff, x + dc * mini, y + dr * mini, mini, {
        ...opts,
        grout: (opts.grout ?? 0.04) * 0.85,
      });
    }
  }
}

// 绘制完整织锦（支持左右半砖出血延展 + 错缝平滑滑移 + 局部 2× 密分 + 断茬/咬合标记）
export function renderTapestry(ctx, w, h, state, analysis, opts = {}) {
  const {
    rows = GRID_ROWS,
    cols = GRID_COLS,
    bleed = 0.42, // 左右出血半砖，直呼原海报 Col 1 延展感
    progress = 1, // 开场入场动画 0..1
    highlightTile = null, // { r, c } 悬停或焦点砖
    showSubGrid = true,
  } = opts;

  ctx.save();
  ctx.fillStyle = PALETTE.emeraldDeep;
  ctx.fillRect(0, 0, w, h);

  // 等比方形砖：绝不拉扁！居中满铺
  const tileSize = Math.min(w / (cols + bleed * 2), h / rows);
  const gridW = tileSize * cols;
  const gridH = tileSize * rows;
  const originX = (w - gridW) / 2;
  const originY = (h - gridH) / 2;

  const subSet = new Set(state.subdivided || []);
  const off = ((state.rowOffset % 1) + 1) % 1;

  // 裁剪在画布内（出血砖自然延伸到画布边缘）
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

  // 绘制包含左右出血列 (-1 .. cols)
  for (let r = 0; r < rows; r++) {
    const isOdd = r % 2 === 1;
    const shiftPx = isOdd ? off * tileSize : 0;
    for (let c = -2; c <= cols + 1; c++) {
      const tx = originX + c * tileSize + shiftPx;
      const ty = originY + r * tileSize;
      if (tx + tileSize < -2 || tx > w + 2) continue;

      const wrapC = ((c % cols) + cols) % cols;
      const isCore = c >= 0 && c < cols;
      const key = `${r},${wrapC}`;
      const isSub = isCore && subSet.has(key);

      // 开场波浪渐显（每一帧都完整饱满，不出现空白帧）
      const wave = (r * 0.1 + (c + 2) * 0.04);
      const localP = progress >= 1 ? 1 : Math.max(0.22, Math.min(1, (progress - wave * 0.35) / 0.65));

      ctx.save();
      if (!isCore) ctx.globalAlpha = 0.56 * localP;
      else ctx.globalAlpha = localP;

      if (isSub) {
        drawSubdividedMacroTile(ctx, state.cells, state.rule, r, wrapC, tx, ty, tileSize, {
          bg: PALETTE.emeraldTile,
        });
        if (showSubGrid) {
          ctx.strokeStyle = "rgba(243, 187, 45, 0.55)";
          ctx.lineWidth = 1.25;
          ctx.strokeRect(tx + 0.75, ty + 0.75, tileSize - 1.5, tileSize - 1.5);
        }
      } else {
        const eff = getEffectiveTile(state.cells, state.rule, r, wrapC);
        drawMacroTile(ctx, eff, tx, ty, tileSize, { bg: PALETTE.emerald });
      }
      ctx.restore();
    }
  }

  // 核心 6×4 主区极细外框与出血分界线
  ctx.strokeStyle = "rgba(243, 187, 45, 0.32)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(originX + 0.5, originY + 0.5, gridW - 1, gridH - 1);
  ctx.setLineDash([]);

  // 悬停/键盘选中的宏观砖高亮框
  if (highlightTile) {
    const { r, c } = highlightTile;
    const shiftPx = r % 2 === 1 ? off * tileSize : 0;
    const hx = originX + c * tileSize + shiftPx;
    const hy = originY + r * tileSize;
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(hx + 1.5, hy + 1.5, tileSize - 3, tileSize - 3);
  }

  // 接缝诊断叠加层（断茬标珊瑚红短杠，咬合标柔金微菱）
  if (state.showSeams && analysis) {
    const subSize = tileSize / 2;
    // 咬合点（细小金菱，克制不抢图）
    if (analysis.lockPoints.length) {
      ctx.fillStyle = PALETTE.gold;
      for (const lp of analysis.lockPoints) {
        const px = originX + lp.x * subSize;
        const py = originY + lp.y * subSize;
        if (px < originX + 2 || px > originX + gridW - 2) continue;
        const d = Math.max(2.6, tileSize * 0.055);
        ctx.beginPath();
        ctx.moveTo(px, py - d);
        ctx.lineTo(px + d, py);
        ctx.lineTo(px, py + d);
        ctx.lineTo(px - d, py);
        ctx.closePath();
        ctx.fill();
      }
    }
    // 断茬点（清晰珊瑚红短横/短竖警报）
    if (analysis.breakPoints.length) {
      ctx.strokeStyle = PALETTE.faultDark;
      ctx.lineWidth = Math.max(2, tileSize * 0.04);
      ctx.lineCap = "square";
      const len = Math.max(5, tileSize * 0.14);
      for (const bp of analysis.breakPoints) {
        const px = originX + bp.x * subSize;
        const py = originY + bp.y * subSize;
        if (px < originX + 2 || px > originX + gridW - 2) continue;
        ctx.beginPath();
        if (bp.dir === "h") {
          ctx.moveTo(px - len, py);
          ctx.lineTo(px + len, py);
        } else {
          ctx.moveTo(px, py - len);
          ctx.lineTo(px, py + len);
        }
        ctx.stroke();
      }
    }
  }

  ctx.restore();
  return { originX, originY, tileSize, gridW, gridH };
}
