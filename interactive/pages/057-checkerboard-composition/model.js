// 057 棋盘构图 · 单一真实数据源（几何审计、合法多解、错态试错、三剧本与互动节数据）

export const COLS = 4;
export const ROWS = 5;
export const TITLE_INDICES = [5, 6]; // 第2行第2–3列（与原海报 057 2×1 跨格主标完全同位）

// 格子状态：-1 标题跨格（锁定），0 暖米留白/文本/轻图格，1 深森林绿实格，2 琥珀金破格焦点
export const CELL_TITLE = -1;
export const CELL_LIGHT = 0;
export const CELL_DARK = 1;
export const CELL_AMBER = 2;

export const COLORS = {
  paper: "#F8F3E7",
  cream: "#F1EDDC",
  sagePaper: "#EFF1E5",
  green: "#075031",
  greenDeep: "#062B1B",
  greenSoft: "#0D6A43",
  amber: "#E49B04",
  amberInk: "#8A5A00",
  ink: "#141715",
  inkMuted: "#47524B",
  warn: "#B92B1C",
  warnLight: "#FF7868",
  pass: "#075031",
  passLight: "#6AE0A8",
};

// 经验值阈值（单真源，正文、读数、按钮统一引用）
export const LIMITS = {
  phaseMax: 3,       // 正交对位允许误差 ±3%（经验值）
  altMin: 88,        // 交替边完整度下限 88%（经验值）
  densityMin: 38,    // 实格占比下限 38%（经验值，低于此滑向 062 分散）
  densityMax: 56,    // 实格占比上限 56%（经验值，高于此过满窒息）
  focalExact: 1,     // 唯一破格焦点数（经验值）
};

// 原海报 057 每个格位的几何母题与三套实景脚本内容
export const SCRIPTS = {
  poster: {
    id: "poster",
    name: "原海报 · 几何韵律",
    short: "原海报",
    titleZh: "棋盘构图",
    titleEn: "CHECKERBOARD",
    motifs: {
      0: { kind: "solid" },
      1: { kind: "copy", zh1: "以交替布局", zh2: "创造节奏与平衡", en: "Rhythm & Balance" },
      2: { kind: "dots5" },
      3: { kind: "dashedCircle" },
      4: { kind: "framedDiamond" },
      7: { kind: "solid" },
      8: { kind: "solid" },
      9: { kind: "copy", zh1: "交替分布", zh2: "强化画面秩序感", en: "Visual Order" },
      10: { kind: "focalCircle" },
      11: { kind: "hatch45" },
      12: { kind: "bigCircle" },
      13: { kind: "solid" },
      14: { kind: "miniChecker" },
      15: { kind: "copy", zh1: "模块清晰", zh2: "组合灵活多变", en: "Clear Modules" },
      16: { kind: "solid" },
      17: { kind: "concentric" },
      18: { kind: "solid" },
      19: { kind: "dots4" },
    },
  },
  editorial: {
    id: "editorial",
    name: "画册跨页 · 图文交替",
    short: "画册图文",
    titleZh: "建筑季刊",
    titleEn: "ISSUE 057 · GRID",
    motifs: {
      0: { kind: "archPlate", label: "图版 01" },
      1: { kind: "copy", zh1: "图版与文字", zh2: "隔格呼吸不压字", en: "Plate / Copy" },
      2: { kind: "dots5" },
      3: { kind: "copy", zh1: "目录索引", zh2: "P.04 — P.68", en: "Index · 1981" },
      4: { kind: "framedDiamond" },
      7: { kind: "archPlate", label: "立面 02" },
      8: { kind: "archPlate", label: "光影 03" },
      9: { kind: "copy", zh1: "留白方格", zh2: "替深色摄影缓冲", en: "Breathing Cell" },
      10: { kind: "focalCircle", label: "主推专题" },
      11: { kind: "hatch45" },
      12: { kind: "copy", zh1: "双轴对齐", zh2: "翻页视线不迷路", en: "Orthogonal Axis" },
      13: { kind: "archPlate", label: "模型 04" },
      14: { kind: "miniChecker" },
      15: { kind: "copy", zh1: "编者按语", zh2: "节制即力量", en: "Editorial Note" },
      16: { kind: "archPlate", label: "细部 05" },
      17: { kind: "concentric" },
      18: { kind: "archPlate", label: "展厅 06" },
      19: { kind: "dots4" },
    },
  },
  exhibition: {
    id: "exhibition",
    name: "品牌展墙 · 展品陈列",
    short: "展墙陈列",
    titleZh: "器物双年展",
    titleEn: "BIENNALE WALL",
    motifs: {
      0: { kind: "plinth", label: "A-01" },
      1: { kind: "copy", zh1: "深绿展龛", zh2: "托出淡色器物", en: "Display Niche" },
      2: { kind: "dots5" },
      3: { kind: "dashedCircle" },
      4: { kind: "copy", zh1: "导览铭牌", zh2: "东厅 · 三层", en: "East Wing 3F" },
      7: { kind: "plinth", label: "A-02" },
      8: { kind: "plinth", label: "B-01" },
      9: { kind: "copy", zh1: "隔龛留空", zh2: "观众驻足不拥挤", en: "Sight Pause" },
      10: { kind: "focalCircle", label: "镇馆主展" },
      11: { kind: "hatch45" },
      12: { kind: "bigCircle" },
      13: { kind: "plinth", label: "B-02" },
      14: { kind: "copy", zh1: "展品标尺", zh2: "60×60 CM", en: "Module Spec" },
      15: { kind: "plinth", label: "B-03" },
      16: { kind: "plinth", label: "C-01" },
      17: { kind: "concentric" },
      18: { kind: "plinth", label: "C-02" },
      19: { kind: "dots4" },
    },
  },
};

// 预设盘面（含开场 0/4 破局态、3 套 4/4 合法解、5 套双向试错态）
export const PRESETS = {
  // 开场 0/4 复合错态：错缝 +24% + 7 处深绿结团 + 2 枚金焦内讧 + 67% 过满
  opening: {
    label: "复原开场错态",
    phaseOffset: 24,
    gutter: 2,
    cells: [
      1, 1, 2, 0,
      1, -1, -1, 1,
      1, 1, 0, 0,
      0, 1, 2, 1,
      1, 1, 0, 0,
    ],
  },
  // 合法解 1：原海报经典棋盘解（100% 交替、50% 实格、1 枚琥珀金焦、0% 正交）
  classic: {
    label: "原海报解",
    phaseOffset: 0,
    gutter: 0,
    cells: [
      1, 0, 1, 0,
      0, -1, -1, 1,
      1, 0, 2, 0,
      0, 1, 0, 1,
      1, 0, 1, 0,
    ],
  },
  // 合法解 2：反相棋盘解（奇偶互换、1 枚金焦落在 R2C1，同样 4/4！）
  inverted: {
    label: "反相解",
    phaseOffset: 0,
    gutter: 3,
    cells: [
      0, 1, 0, 1,
      1, -1, -1, 0,
      0, 2, 0, 1,
      1, 0, 1, 0,
      0, 1, 0, 1,
    ],
  },
  // 合法解 3：大留白疏棋解（左下卸下一格，实格 44%，交替 92%，1 金焦，同样 4/4！）
  airy: {
    label: "疏棋解",
    phaseOffset: 0,
    gutter: 5,
    cells: [
      1, 0, 1, 0,
      0, -1, -1, 1,
      1, 0, 2, 0,
      0, 1, 0, 1,
      0, 0, 1, 0,
    ],
  },
  // 试错 1：纯棋盘眩晕（0 枚金焦，100% 均等交替但无入口）
  errNoFocal: {
    label: "纯棋眩晕",
    phaseOffset: 0,
    gutter: 0,
    cells: [
      1, 0, 1, 0,
      0, -1, -1, 1,
      1, 0, 1, 0,
      0, 1, 0, 1,
      1, 0, 1, 0,
    ],
  },
  // 试错 2：多焦互抢（3 枚琥珀金焦块分散争夺第一眼）
  errMultiFocal: {
    label: "多焦互抢",
    phaseOffset: 0,
    gutter: 2,
    cells: [
      2, 0, 1, 0,
      0, -1, -1, 1,
      1, 0, 2, 0,
      0, 1, 0, 2,
      1, 0, 1, 0,
    ],
  },
  // 试错 3：同色结块（左半区大片深绿粘连成坨）
  errClump: {
    label: "同色结块",
    phaseOffset: 0,
    gutter: 0,
    cells: [
      1, 1, 0, 0,
      1, -1, -1, 0,
      1, 1, 2, 0,
      1, 1, 0, 0,
      1, 1, 0, 0,
    ],
  },
  // 试错 4：砖墙错缝（偶数行横滑 +46%，纵轴彻底解体）
  errBrick: {
    label: "砖墙错缝",
    phaseOffset: 46,
    gutter: 2,
    cells: [
      1, 0, 1, 0,
      0, -1, -1, 1,
      1, 0, 2, 0,
      0, 1, 0, 1,
      1, 0, 1, 0,
    ],
  },
  // 试错 5：过空散架（实格仅 22%，滑向 062 分散构图）
  errSparse: {
    label: "过空散架",
    phaseOffset: 0,
    gutter: 4,
    cells: [
      1, 0, 0, 0,
      0, -1, -1, 0,
      0, 0, 2, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ],
  },
};

export function createState() {
  return {
    script: "poster",
    brush: "cycle", // cycle | dark | amber | light
    phaseOffset: PRESETS.opening.phaseOffset,
    gutter: PRESETS.opening.gutter,
    cells: [...PRESETS.opening.cells],
    selectedIdx: 10,
    showAxes: true,
    scanActive: false,
    scanProgress: 0,
  };
}

// 辅助：判断两个格子是否属于同一极性（0=浅，1/2=实；但绿与金之间属异色破格对比，不算同色粘连）
function samePolarity(a, b) {
  if (a === CELL_LIGHT && b === CELL_LIGHT) return "light";
  if (a === CELL_DARK && b === CELL_DARK) return "dark";
  if (a === CELL_AMBER && b === CELL_AMBER) return "amber";
  if ((a === CELL_DARK && b === CELL_AMBER) || (a === CELL_AMBER && b === CELL_DARK)) return "solidPair";
  return null;
}

// 单一真源几何审计：直接读取实绘 cells[20] 与 phaseOffset，产出全部数值与白话诊断
export function evaluateBoard(state) {
  const { cells, phaseOffset } = state;
  const editableIndices = [];
  let darkCount = 0;
  let amberCount = 0;
  let lightCount = 0;
  const amberIndices = [];

  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === CELL_TITLE) continue;
    editableIndices.push(i);
    if (cells[i] === CELL_DARK) darkCount++;
    else if (cells[i] === CELL_AMBER) {
      amberCount++;
      amberIndices.push(i);
    } else lightCount++;
  }

  const totalEditable = editableIndices.length; // 18
  const solidCount = darkCount + amberCount;
  const solidRatio = Math.round((solidCount / totalEditable) * 100);

  // 遍历所有正交相邻的可编辑格对（共 24 条内部共享边）
  let totalPairs = 0;
  let alternatingPairs = 0;
  const darkClumpEdges = [];   // 绿-绿 或 金-金 同色粘连边
  const solidTouchEdges = [];  // 绿-金 相贴边
  const lightClumpEdges = [];  // 浅-浅 连片边

  const checkPair = (aIdx, bIdx, dir) => {
    const a = cells[aIdx];
    const b = cells[bIdx];
    if (a === CELL_TITLE || b === CELL_TITLE) return;
    totalPairs++;
    const rel = samePolarity(a, b);
    if (!rel) {
      alternatingPairs++;
    } else if (rel === "dark" || rel === "amber") {
      darkClumpEdges.push({ a: aIdx, b: bIdx, dir, kind: rel });
    } else if (rel === "solidPair") {
      solidTouchEdges.push({ a: aIdx, b: bIdx, dir, kind: rel });
    } else {
      lightClumpEdges.push({ a: aIdx, b: bIdx, dir, kind: rel });
    }
  };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (c + 1 < COLS) checkPair(idx, idx + 1, "v");
      if (r + 1 < ROWS) checkPair(idx, idx + COLS, "h");
    }
  }

  const altPct = Math.round((alternatingPairs / Math.max(1, totalPairs)) * 100);
  const absPhase = Math.abs(Math.round(phaseOffset));
  const totalSolidClumps = darkClumpEdges.length + solidTouchEdges.length;

  // 四条原海报对应几何判据
  const passPhase = absPhase <= LIMITS.phaseMax;
  const passAlt = darkClumpEdges.length === 0 && solidTouchEdges.length === 0 && altPct >= LIMITS.altMin;
  const passDensity = solidRatio >= LIMITS.densityMin && solidRatio <= LIMITS.densityMax;
  const passFocal = amberCount === LIMITS.focalExact;

  const score = [passPhase, passAlt, passDensity, passFocal].filter(Boolean).length;

  // 生成视线演播路径（优先经过实格节拍，终结在唯一琥珀金焦点；错态时呈现异常路径）
  const scanPath = buildScanPath(cells, amberIndices, darkClumpEdges);

  // 严格按优先级报出最主要的一条错因（或 4/4 解法类别）
  let code = "pass";
  let badge = "4/4 · 棋盘成立";
  let headline = "";
  let body = "";
  let action = "";
  let rhythmLevel = "稳态交替（示意）";

  if (score === 4) {
    const isClassic = cells.every((v, i) => v === PRESETS.classic.cells[i]);
    const isInverted = cells.every((v, i) => v === PRESETS.inverted.cells[i]);
    if (isClassic) {
      headline = "原海报经典棋盘成立：交替完整且单焦落定";
      body = `纵横正交偏差仅 ${absPhase}%，实格占 ${solidRatio}%，${totalPairs} 条内部邻边 ${altPct}% 严密交替，唯一琥珀金格稳稳接住第一眼视线。`;
    } else if (isInverted) {
      headline = "反相棋盘解同样成立：黑白互换不失秩序";
      body = `奇偶格位全部反转后，实格占比仍稳在 ${solidRatio}%、交替完整度 ${altPct}%，唯一琥珀金块打破均等——棋盘构图认的是交替规律，不是死模板。`;
    } else if (solidRatio <= 46) {
      headline = "大留白疏棋解成立：呼吸更轻，秩序未散";
      body = `实格收轻到 ${solidRatio}%，交替率保持 ${altPct}% 且零实块粘连，唯一琥珀金焦块在舒朗纸面上辨识度更高。`;
    } else {
      headline = "自定义合法棋盘解成立：节拍与焦点兼得";
      body = `你落出的阵型满足全部 4 项结构律（错缝 ${absPhase}%、交替 ${altPct}%、实格 ${solidRatio}%、单金焦 1 枚），视线能沿方格节拍自然停在破格焦点上。`;
    }
    action = "按 Space（或点「节拍演播」）看视线如何沿实格跳扫并停驻在唯一琥珀金块上，或试着点「纯棋眩晕」反证为何不能没有破格焦点。";
    rhythmLevel = altPct === 100 ? "严密交替（示意）" : "舒朗交替（示意）";
  } else if (!passPhase) {
    code = "phase_shift";
    const sign = phaseOffset > 0 ? `+${Math.round(phaseOffset)}%` : `${Math.round(phaseOffset)}%`;
    badge = `${score}/4 · 错缝 ${sign}`;
    if (absPhase >= 32) {
      headline = `偶数行横向滑移 ${sign}，棋盘已蜕变成砖墙阵列`;
      body = `棋盘构图靠横纵双轴同时对齐建立「模块秩序」；偶数行错开接近半格后，所有垂直纵线断开，视线只剩横向锯齿游走。`;
    } else {
      headline = `偶数行错位 ${sign}，垂直网格轴线已经断裂`;
      body = `上下相邻方格的竖边不再咬合，画面边缘出现不稳定的错牙，观众一眼感到模块松动，失去棋盘特有的建筑稳固感。`;
    }
    action = "在画布上向左/右横拖（或把「偶数行错缝相位」拉回 0%），把竖向网格轴重新咔哒锁正。";
    rhythmLevel = "纵轴断链（示意）";
  } else if (totalSolidClumps > 0) {
    code = "clump_dark";
    badge = `${score}/4 · 结块 ${totalSolidClumps} 处`;
    headline = `${totalSolidClumps} 处实格直接贴边粘连，交替节拍被打断`;
    body = `画布上标出红色锯齿的 ${totalSolidClumps} 条共享边两侧同为重色实块，它们会立刻在人眼格式塔知觉里融合成一块笨重大色块，棋盘的「一实一空」律动消失。`;
    action = "直接点击画布上红锯齿边旁多余的实格，把它们点回浅米留白格（或选「留空格」笔刷清出间隔）。";
    rhythmLevel = "局部粘连（示意）";
  } else if (!passFocal) {
    if (amberCount === 0) {
      code = "focal_none";
      badge = `${score}/4 · 无焦点眩晕`;
      headline = "纯 1:1 均等棋盘没有破格点，容易看成瓷砖墙";
      body = `交替率虽达 ${altPct}%，但所有实块权重完全一样，眼睛在深绿与米白之间反复跳弹找不到唯一入口——这正是 057 原海报特意把一格染成琥珀金的原因。`;
      action = "点击任意一块深绿实格（切到琥珀金焦点），全盘只留 1 枚金色破格块作为视线落脚点。";
      rhythmLevel = "均质眩晕（示意）";
    } else {
      code = "focal_multi";
      badge = `${score}/4 · ${amberCount} 焦互抢`;
      headline = `同时亮起 ${amberCount} 枚琥珀金格，视觉焦点互相打架`;
      body = `破格焦点靠「稀缺」才成立。当画布出现 ${amberCount} 块同样刺眼的暖金模块时，观众的目光在它们之间来回拉扯，反而失去主次停顿。`;
      action = `点击画布上多余的 ${amberCount - 1} 枚琥珀金格把它们点回深绿或留白，全盘只保留 1 枚金色焦点。`;
      rhythmLevel = "多焦撕扯（示意）";
    }
  } else if (!passDensity) {
    if (solidRatio > LIMITS.densityMax) {
      code = "too_dense";
      badge = `${score}/4 · 过满 ${solidRatio}%`;
      headline = `实格占到 ${solidRatio}%，留白被挤垮失去疏密呼吸`;
      body = `棋盘的舒适实格比例通常在 ${LIMITS.densityMin}%–${LIMITS.densityMax}%（经验值）。实块过多会让画面发闷沉重，文字与轻图形没有透气空间。`;
      action = "点击几块深绿实格改回暖米留白，把实格占比降回 38%–56% 区间。";
      rhythmLevel = "过满压闷（示意）";
    } else {
      code = "too_sparse";
      badge = `${score}/4 · 过空 ${solidRatio}%`;
      headline = `实格只剩 ${solidRatio}%，棋盘骨架散成孤立散点`;
      body = `实格少于 ${LIMITS.densityMin}% 时，方格之间的相邻交替关系断裂，画面不再呈现棋盘韵律，而是滑向松散无序的 062 分散构图。`;
      action = "按隔一格落一格的节奏，在空白处点亮深绿实格，把实格占比补到 38%–56%。";
      rhythmLevel = "稀疏散架（示意）";
    }
  } else {
    code = "clump_light";
    badge = `${score}/4 · 交替 ${altPct}%`;
    headline = `留白格连片出现（交替仅 ${altPct}%），节拍出现空洞`;
    body = `虽然没有深色结块，但有 ${lightClumpEdges.length} 条共享边两侧都是浅米空格，局部出现大片断拍，交替节拍不够干脆。`;
    action = "在连片的浅米空区隔格补落 1–2 枚深绿实格，把交替完整度拉到 88% 以上。";
    rhythmLevel = "节拍断空（示意）";
  }

  // 四条原海报要点实时探针（严格与 poster-text.json 057 一致）
  const probes = [
    {
      id: "rhythm",
      title: "以交替布局",
      body: "创造节奏与平衡",
      en: "RHYTHM & BALANCE",
      pass: passAlt,
      tag: passAlt ? `交替 ${altPct}%` : totalSolidClumps > 0 ? `粘连 ${totalSolidClumps} 边` : `交替 ${altPct}%`,
    },
    {
      id: "order",
      title: "交替分布",
      body: "强化画面秩序感",
      en: "VISUAL ORDER",
      pass: passPhase,
      tag: passPhase ? "正交 0° 锁正" : `错缝 ${phaseOffset > 0 ? "+" : ""}${Math.round(phaseOffset)}%`,
    },
    {
      id: "contrast",
      title: "疏密对比",
      body: "引导视觉停留",
      en: "DENSITY & FOCUS",
      pass: passDensity && passFocal,
      tag: !passFocal
        ? amberCount === 0 ? "0 焦眩晕" : `${amberCount} 焦互抢`
        : !passDensity
          ? solidRatio > LIMITS.densityMax ? `过满 ${solidRatio}%` : `过空 ${solidRatio}%`
          : `实格 ${solidRatio}% · 单焦`,
    },
    {
      id: "module",
      title: "模块清晰",
      body: "组合灵活多变",
      en: "CLEAR MODULES",
      pass: passPhase && passDensity,
      tag: passPhase && passDensity ? `18 格 · ${state.gutter}px 缝` : !passPhase ? "纵轴失齐" : `占比 ${solidRatio}%`,
    },
  ];

  return {
    score,
    code,
    badge,
    headline,
    body,
    action,
    rhythmLevel,
    phaseOffset: Math.round(phaseOffset),
    absPhase,
    altPct,
    solidRatio,
    darkCount,
    amberCount,
    lightCount,
    totalPairs,
    alternatingPairs,
    darkClumpEdges,
    solidTouchEdges,
    lightClumpEdges,
    passPhase,
    passAlt,
    passDensity,
    passFocal,
    probes,
    scanPath,
  };
}

function buildScanPath(cells, amberIndices, darkClumpEdges) {
  const path = [];
  // 标题块始终是语义入口之一，随后沿实格节拍扫读，最后落回唯一琥珀金焦点
  const solids = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === CELL_DARK) solids.push(i);
  }
  if (amberIndices.length === 1) {
    // 先沿 3-4 个深绿实格建立节拍，最后稳稳停在唯一琥珀金焦块
    const stepPick = solids.filter((_, idx) => idx % 2 === 0).slice(0, 4);
    for (const idx of stepPick) path.push({ idx, dwell: 0.55 });
    path.push({ idx: amberIndices[0], dwell: 1.5, focal: true });
  } else if (amberIndices.length >= 2) {
    // 多焦互抢：在多个金块间来回震荡，直观呈现视线撕扯
    for (let k = 0; k < 5; k++) {
      path.push({ idx: amberIndices[k % amberIndices.length], dwell: 0.45, conflict: true });
    }
  } else {
    // 0 焦眩晕：在所有实格间漫无目的打转不落停
    const loop = solids.length ? solids.slice(0, 6) : [0, 2, 8, 10, 16, 18];
    for (const idx of loop) path.push({ idx, dwell: 0.35, dizzy: true });
  }
  return path;
}

// ---------- 03 节 · 历史切片数据（已联网核实） ----------
export const HISTORY_ITEMS = [
  {
    id: "1741",
    year: "1741",
    place: "江户 · 中村座",
    title: "佐野川市松与市松模様",
    en: "ICHIMATSU MOYO · EDO",
    summary: "宽保元年（1741），歌舞伎演员初代佐野川市松（1722–1762）从京都赴江户中村座登台，身穿两色交替方格袴装引发全城效仿。原本叫作「石畳（铺石纹）」的棋盘纹样由此定名「市松模様」，因方格向四面八方无缝延展，被视为繁荣与秩序的象征。",
    note: "特征：严格的 1:1 两色正交方格，在织物与建筑界面上建立无限延展的稳定韵律。",
  },
  {
    id: "1919",
    year: "1919",
    place: "海牙 · 蒙德里安",
    title: "《网格构图 8 号：暗色棋盘》",
    en: "PIET MONDRIAN · GRID 8 & 9",
    summary: "1919 年，皮特·蒙德里安创作《网格构图 8 号：暗色棋盘构图》（84 × 102 cm）与《9 号：亮色棋盘构图》（现藏海牙市立美术馆 Kunstmuseum Den Haag）。他在 16×16 等分网格里故意打破机械 1:1 黑白重复，用明暗与色块的非均等节奏证明：棋盘框架里完全可以生长出动态张力。",
    note: "特征：固定等分网格作为纪律底座，靠色值疏密变化打破墙纸感。",
  },
  {
    id: "1981",
    year: "1981",
    place: "瑞士 · Niggli 出版",
    title: "《平面设计中的网格系统》",
    en: "JOSEF MULLER-BROCKMANN · 1981",
    summary: "瑞士设计大师约瑟夫·米勒-布罗克曼于 1981 年由 Niggli Verlag 出版 176 页双语手册《平面设计中的网格系统》（Rastersysteme für die visuelle Gestaltung），系统推演了 8 格、20 格、32 格模块化网格如何在文字、摄影与实色块间达成客观清晰的跨页秩序。",
    note: "特征：跨格合并（如 2×1 标题槽）+ 统一缝宽，让模块化棋盘真正服务信息阅读。",
  },
  {
    id: "1995",
    year: "1995",
    place: "麻省理工 · 视觉科学",
    title: "棋盘阴影错觉实验",
    en: "EDWARD H. ADELSON · 1995",
    summary: "麻省理工学院视觉科学教授爱德华·阿德尔森于 1995 年发表著名的「棋盘阴影错觉」：在棋盘交替环境中，阴影里的浅格 B 与亮处的深格 A 物理灰度完全相同，人眼却坚信 B 更亮。这从知觉机制证明，棋盘的局部邻格明暗对比拥有极强的上下文锚定力量。",
    note: "特征：人眼不孤立读取单格，而是借四周交替邻格判断每一格的分量。",
  },
];

// ---------- 06 节 · 实战眼力小练习（中性标签，单一变量） ----------
export const QUIZ_ITEMS = [
  {
    id: "q1",
    prompt: "题 01 / 02 · 为一场设计双年展挑选 4×4 棋盘主视觉海报（四版字号、色板与 2×1 跨格标题槽完全一致，只差一个构图变量）：",
    answer: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "4×4 排布",
        grid: [
          1, 0, 1, 0,
          0, -1, -1, 1,
          1, 0, 1, 0,
          0, 1, 0, 1,
        ],
        phase: 0,
        reason: "方案 A 虽有 100% 严密交替和跨格主标，但全盘 0 枚破格色块焦点，所有墨绿实块权重均等，远看容易滑向无停顿的「瓷砖墙纸眩晕」。",
      },
      {
        key: "B",
        label: "方案 B",
        meta: "4×4 排布",
        grid: [
          1, 0, 1, 0,
          0, -1, -1, 1,
          1, 0, 2, 0,
          0, 1, 0, 1,
        ],
        phase: 0,
        reason: "正确！方案 B 同时守住正交交替、中段 2×1 跨格标题呼吸与唯一 1 枚琥珀金破格焦点——先有秩序节拍，再有一眼落脚点。",
      },
      {
        key: "C",
        label: "方案 C",
        meta: "4×4 排布",
        grid: [
          2, 0, 1, 0,
          0, -1, -1, 1,
          1, 0, 2, 0,
          0, 1, 0, 2,
        ],
        phase: 0,
        reason: "方案 C 同时点亮了 3 枚琥珀金块，破格焦点不再稀缺，观众视线会在左上、中右、右下三点间反复撕扯，失去主次停留。",
      },
      {
        key: "D",
        label: "方案 D",
        meta: "4×4 排布",
        grid: [
          1, 0, 1, 0,
          0, -1, -1, 1,
          1, 1, 2, 0,
          1, 1, 0, 1,
        ],
        phase: 0,
        reason: "方案 D 虽然只放了 1 枚琥珀金块，但左下角 4 块墨绿直接贴边拼成 2×2 实心大坨并与金块粘连，交替节拍被打断，整版重心向左下塌陷。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "题 02 / 02 · 为作品集首页挑选 4×4 模块化棋盘网格（四版都含 1 枚琥珀金主打项，只差正交对齐与疏密占比）：",
    answer: "D",
    options: [
      {
        key: "A",
        label: "方案 A",
        meta: "4×4 排布",
        grid: [
          1, 0, 1, 0,
          0, 1, 0, 1,
          1, 0, 2, 0,
          0, 1, 0, 1,
        ],
        phase: 42,
        reason: "方案 A 偶数行错开 42%，竖向纵轴完全断开，已经从棋盘正交秩序滑成了交错砖墙，上下阅读失去了纵向参照。",
      },
      {
        key: "B",
        label: "方案 B",
        meta: "4×4 排布",
        grid: [
          1, 1, 1, 0,
          1, 1, 2, 1,
          1, 0, 1, 1,
          1, 1, 1, 0,
        ],
        phase: 0,
        reason: "方案 B 实格高达 81%，浅米呼吸格被挤得支离破碎，图文失去了「有与无、疏与密」的对比节奏。",
      },
      {
        key: "C",
        label: "方案 C",
        meta: "4×4 排布",
        grid: [
          1, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 2, 0,
          0, 1, 0, 0,
        ],
        phase: 0,
        reason: "方案 C 实格只占 19%，彼此缺少相邻交替牵引，已经退化成孤立散点（滑向 062 分散构图），撑不起棋盘秩序。",
      },
      {
        key: "D",
        label: "方案 D",
        meta: "4×4 排布",
        grid: [
          0, 1, 0, 1,
          1, 0, 2, 0,
          0, 1, 0, 1,
          1, 0, 1, 0,
        ],
        phase: 0,
        reason: "正确！方案 D 保持 0% 正交对齐、50% 均衡实空占比与唯一琥珀金主打项（反相棋盘同样完全合法），秩序清晰且重点突出。",
      },
    ],
  },
];
