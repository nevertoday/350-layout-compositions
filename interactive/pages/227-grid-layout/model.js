// 227 网格布局 · 单真源数据模型（所有蓝图坐标、重叠检测、轨道比例与诊断结论共用）

export const COLS = 6;
export const ROWS = 4;
export const TOTAL_CELLS = COLS * ROWS;

// 经验值区间（正文与界面读数全部明确标注为「经验值」，并只从此处读取）
export const RULES = {
  splitMin: 0.18,
  splitMax: 0.56,
  splitUniform: 1 / 3,
  splitSnapRadius: 0.015,
  ratioMin: 0.65,     // 左翼单列 / 右翼单列 经验下限
  ratioMax: 1.45,     // 左翼单列 / 右翼单列 经验上限
  gapMin: 8,          // 沟槽经验下限 (px)
  gapMax: 20,         // 沟槽经验上限 (px)
  minCoverage: 20,    // 24 格中至少覆盖 20 格（约 83%）
  minHeroCells: 6,    // 主视觉区至少占 6 格以建立清晰主焦点
};

export const ZONE_META = {
  nav: { id: "nav", label: "01 导览栏", short: "01 导览", tiny: "01" },
  hero: { id: "hero", label: "02 主视觉", short: "02 主视觉", tiny: "02" },
  main: { id: "main", label: "03 正文栏", short: "03 正文", tiny: "03" },
  aside: { id: "aside", label: "04 侧注卡", short: "04 侧注", tiny: "04" },
};

export const ZONE_IDS = ["nav", "hero", "main", "aside"];

// 三套真实常见的二维网格错版（无一键通关按钮，切换皆为待修错态）
export const BROKEN_PRESETS = [
  {
    name: "错版 1 · 重叠撞车与零缝",
    trackSplit: 0.50,
    gap: 0,
    selected: "hero",
    zones: {
      nav: { c: 1, r: 4, cw: 1, rh: 1 },
      hero: { c: 1, r: 1, cw: 4, rh: 2 },
      main: { c: 3, r: 2, cw: 4, rh: 2 },
      aside: { c: 6, r: 4, cw: 1, rh: 1 },
    },
  },
  {
    name: "错版 2 · 孤洞散碎与左翼压扁",
    trackSplit: 0.20,
    gap: 28,
    selected: "main",
    zones: {
      nav: { c: 1, r: 1, cw: 1, rh: 2 },
      hero: { c: 2, r: 1, cw: 3, rh: 2 },
      main: { c: 2, r: 4, cw: 3, rh: 1 },
      aside: { c: 6, r: 2, cw: 1, rh: 2 },
    },
  },
  {
    name: "错版 3 · 主次倒置与局部碰撞",
    trackSplit: 1 / 3,
    gap: 16,
    selected: "aside",
    zones: {
      nav: { c: 1, r: 1, cw: 2, rh: 4 },
      hero: { c: 3, r: 1, cw: 2, rh: 2 },
      main: { c: 3, r: 3, cw: 3, rh: 2 },
      aside: { c: 4, r: 1, cw: 3, rh: 3 },
    },
  },
];

export function clonePreset(index) {
  const src = BROKEN_PRESETS[index % BROKEN_PRESETS.length];
  const zones = {};
  for (const id of ZONE_IDS) zones[id] = { ...src.zones[id] };
  return {
    presetIndex: index % BROKEN_PRESETS.length,
    trackSplit: src.trackSplit,
    gap: src.gap,
    selected: src.selected,
    invisible: false,
    zones,
  };
}

export function clampSplit(v) {
  return Math.max(RULES.splitMin, Math.min(RULES.splitMax, v));
}

export function splitToTracks(split) {
  const s = clampSplit(split);
  const colA = +(s * 3).toFixed(2);
  const colB = +((1 - s) * 1.5).toFixed(2);
  const ratio = colA / colB;
  return { split: s, colA, colB, ratio };
}

export function clampZone(z) {
  const cw = Math.max(1, Math.min(COLS, Math.round(z.cw)));
  const rh = Math.max(1, Math.min(ROWS, Math.round(z.rh)));
  const c = Math.max(1, Math.min(COLS - cw + 1, Math.round(z.c)));
  const r = Math.max(1, Math.min(ROWS - rh + 1, Math.round(z.r)));
  return { c, r, cw, rh };
}

export function evaluateBlueprint(state) {
  const { colA, colB, ratio } = splitToTracks(state.trackSplit);

  // 统计 6×4 单元格占用矩阵
  const occ = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => []));
  for (const id of ZONE_IDS) {
    const z = clampZone(state.zones[id]);
    for (let r = z.r - 1; r < z.r - 1 + z.rh; r++) {
      for (let c = z.c - 1; c < z.c - 1 + z.cw; c++) {
        occ[r][c].push(id);
      }
    }
  }

  const overlapCells = [];
  const overlapPairs = new Set();
  const emptyCells = [];
  let coveredCells = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const owners = occ[r][c];
      if (owners.length > 0) coveredCells++;
      else emptyCells.push({ c: c + 1, r: r + 1 });
      if (owners.length > 1) {
        overlapCells.push({ c: c + 1, r: r + 1, owners });
        for (let i = 0; i < owners.length; i++) {
          for (let j = i + 1; j < owners.length; j++) {
            overlapPairs.add(`${ZONE_META[owners[i]].short}与${ZONE_META[owners[j]].short}`);
          }
        }
      }
    }
  }

  const areas = {};
  for (const id of ZONE_IDS) areas[id] = state.zones[id].cw * state.zones[id].rh;

  // 四项独立规则核验
  const tracksOk = ratio >= RULES.ratioMin && ratio <= RULES.ratioMax;
  const hierarchyOk = areas.hero > areas.aside && areas.hero >= RULES.minHeroCells;
  const zonesOk = overlapCells.length === 0 && hierarchyOk;
  const modulesOk = coveredCells >= RULES.minCoverage;
  const spacingOk = state.gap >= RULES.gapMin && state.gap <= RULES.gapMax;
  const orderOk = tracksOk && zonesOk && modulesOk && spacingOk;
  const passedCount = [tracksOk, zonesOk, modulesOk, spacingOk].filter(Boolean).length;

  // 严格按优先级只报一条当前最致命的主错，并说清人眼为什么觉得不对
  let status = "err";
  let badge = "错态";
  let verdict = "";
  let why = "";

  if (overlapCells.length > 0) {
    const pairs = [...overlapPairs].slice(0, 2).join("、");
    badge = "错态 · 区域重叠";
    verdict = `${pairs}重叠 ${overlapCells.length} 格，内容互压`;
    why = "CSS Grid 允许显式坐标重叠，但非刻意叠图时文字与主视觉会互相遮挡。选中带红斜纹的区域，拖动移位或用坐标钮缩减跨格先把重叠清零。";
  } else if (!spacingOk) {
    if (state.gap < RULES.gapMin) {
      badge = "错态 · 零缝粘连";
      verdict = `沟槽 ${state.gap}px 过窄，四块区域粘成一堵墙`;
      why = `没有沟槽隔开，左右两栏文字与色块边缘会直接贴死，视线容易跨区串读。把 gap 调入 ${RULES.gapMin}–${RULES.gapMax}px 经验呼吸带（推荐 16px）。`;
    } else {
      badge = "错态 · 沟壑切碎";
      verdict = `沟槽 ${state.gap}px 过宽，版面散成孤岛`;
      why = `外沟槽超过 ${RULES.gapMax}px（经验上限）后，空白把各个区块切得彼此疏离，整体版面感被冲散。收回到 8–16px 让模块重新呼应。`;
    }
  } else if (!tracksOk) {
    if (ratio < RULES.ratioMin) {
      badge = "错态 · 左翼挤扁";
      verdict = `左两列宽度仅右翼 ${ratio.toFixed(2)}×，导览轨道被压扁`;
      why = `列宽比跌破 ${RULES.ratioMin}×（经验下限）后，左侧轨道文字极易折碎。向右拖动顶部鹅黄第 3 轨线滑柄，把轨道比拉回 ${RULES.ratioMin}×–${RULES.ratioMax}× 稳区。`;
    } else {
      badge = "错态 · 左翼过肥";
      verdict = `左两列占宽达右翼 ${ratio.toFixed(2)}×，挤压右侧主内容`;
      why = `前两列吃掉近半幅宽（高于 ${RULES.ratioMax}× 经验上限），主区反而变窄。向左拖动顶部鹅黄第 3 轨线滑柄，靠近 1.00× 匀步轨道。`;
    }
  } else if (!hierarchyOk) {
    if (areas.aside >= areas.hero) {
      badge = "错态 · 主次倒置";
      verdict = `04 侧注（${areas.aside} 格）反压 02 主视觉（${areas.hero} 格）`;
      why = "网格区域面积直接决定了读者第一眼落在哪。把 02 主视觉拉大并收小 04 侧注，让视觉重心回到主角身上。";
    } else {
      badge = "错态 · 主区偏弱";
      verdict = `02 主视觉仅占 ${areas.hero} 格，撑不起版面第一焦点`;
      why = `主视觉少于 ${RULES.minHeroCells} 格（经验值）时，四块区域体量过于平均，页面像平铺清单。给 02 主视觉多跨一列或一行。`;
    }
  } else if (!modulesOk) {
    badge = "错态 · 孤洞散碎";
    verdict = `仅覆盖 ${coveredCells}/${TOTAL_CELLS} 格，版面留出 ${TOTAL_CELLS - coveredCells} 格散洞`;
    why = `网格被大块无意空洞切碎后，区块间失去了对齐呼应。扩展 01 导览、03 正文或 04 侧注的跨度，让覆满度达到 ${RULES.minCoverage}/${TOTAL_CELLS} 格以上（经验值）。`;
  } else {
    status = "ok";
    badge = "秩序成立 · 4/4";
    verdict = "轨道匀称、区域零冲突，隐去线框依然严丝合缝";
    why = `覆盖 ${coveredCells}/${TOTAL_CELLS} 格、轨比 ${ratio.toFixed(2)}×、沟槽 ${state.gap}px 全部达标。现在点「隐形秩序」藏起辅助线，验证原海报那句「源于看不见的秩序」。`;
  }

  const pillarLabels = {
    tracks: tracksOk ? `${ratio.toFixed(2)}×` : ratio < RULES.ratioMin ? "挤扁" : "过肥",
    zones: zonesOk ? "清晰" : overlapCells.length > 0 ? `叠 ${overlapCells.length} 格` : "倒置",
    modules: modulesOk ? `${coveredCells}/${TOTAL_CELLS}` : `缺 ${RULES.minCoverage - coveredCells} 格`,
    spacing: spacingOk ? `${state.gap}px` : state.gap < RULES.gapMin ? "粘连" : "过宽",
    order: orderOk ? "成立" : `${passedCount}/4`,
  };

  const cssLine = `grid-template-columns: repeat(2, ${colA.toFixed(2)}fr) repeat(4, ${colB.toFixed(2)}fr); gap: ${state.gap}px;`;

  return {
    colA,
    colB,
    ratio,
    overlapCells,
    emptyCells,
    coveredCells,
    areas,
    tracksOk,
    zonesOk,
    modulesOk,
    spacingOk,
    orderOk,
    passedCount,
    status,
    badge,
    verdict,
    why,
    pillarLabels,
    cssLine,
  };
}

// Section 04：严格按 W3C CSS Grid Level 1 矩形规则校验 3×3 grid-template-areas
export function validateAreasMatrix(matrix) {
  const byName = new Map();
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const name = matrix[r][c];
      if (name === ".") continue;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push([r, c]);
    }
  }

  const invalidNames = [];
  const badCellKeys = new Set();

  for (const [name, coords] of byName.entries()) {
    let minR = 9, maxR = -1, minC = 9, maxC = -1;
    for (const [r, c] of coords) {
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    const expected = (maxR - minR + 1) * (maxC - minC + 1);
    if (coords.length !== expected) {
      invalidNames.push(name);
      for (const [r, c] of coords) badCellKeys.add(`${r}-${c}`);
    }
  }

  const presentNames = [...byName.keys()];
  const valid = invalidNames.length === 0 && presentNames.length > 0;
  const rowsCss = matrix.map((row) => `"${row.join(" ")}"`);

  return {
    valid,
    invalidNames,
    badCellKeys,
    presentNames,
    rowsCss,
  };
}
