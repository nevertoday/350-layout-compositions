// 单真源几何与诊断模型：200 非对称网格（Asymmetric Grid）
// 画布、顶眉状态、白话诊单、五要点实况徽章与 CSS 轨道读数全部从 computeLayout(state) 派生，无第二份写死数值。

export const POSTER_PALETTE = {
  bg: "#070707",
  surface: "#111317",
  yellow: "#EFE642",
  cyan: "#17B3D3",
  cyanBright: "#2AC8E8",
  bone: "#F0EBE2",
  inkLight: "#F4F2EC",
  mutedLight: "#A6ADB6",
  danger: "#FF6E6E",
  ok: "#3BE0B5",
};

export const SCENES = {
  blueprint: {
    id: "blueprint",
    label: "结构蓝图",
    en: "STRUCTURE DIAGRAM",
    caption: "复刻 200 号原海报白虚线 X 线框、青竖条、黄横条与青虚线视线流。",
    modules: [
      { id: "m0", tag: "01 主焦模块", title: "焦点视觉区", sub: "PRIMARY MASS", tone: "hero" },
      { id: "m1", tag: "02 导语模块", title: "原理说明", sub: "DESIGN BRIEF", tone: "lead" },
      { id: "m2", tag: "03 纵栏模块", title: "节奏延伸区", sub: "VERTICAL TRACK", tone: "tall" },
      { id: "m3", tag: "04 落款模块", title: "角注锚点", sub: "FOOTER NOTE", tone: "note" },
    ],
  },
  magazine: {
    id: "magazine",
    label: "杂志跨页",
    en: "EDITORIAL SPREAD",
    caption: "化用原海报《城市的另一种呼吸方式》跨页：大留白标题、黑白建筑摄影与跨缝明黄竖条。",
    modules: [
      { id: "m0", tag: "01 建筑主图", title: "城市立面摄影", sub: "ARCH PHOTO", tone: "hero" },
      { id: "m1", tag: "02 刊头大标", title: "城市的另一种呼吸方式", sub: "FEATURE", tone: "lead" },
      { id: "m2", tag: "03 紧凑正文", title: "以不等栏宽制造呼吸节奏，让建筑阴影与留白对话。", sub: "BODY COPY", tone: "tall" },
      { id: "m3", tag: "04 页码图注", title: "P.24 — 25 · 摄影 / 城市志", sub: "CAPTION", tone: "note" },
    ],
  },
  poster: {
    id: "poster",
    label: "SOUND LAB",
    en: "POSTER LAYOUT",
    caption: "化用原海报 SOUND LAB 暖骨纸演艺海报：顶出血黄块、右下粗黑标与斜向青黑连线。",
    modules: [
      { id: "m0", tag: "01 核心大标", title: "SOUND LAB", sub: "EXPERIMENTAL", tone: "hero" },
      { id: "m1", tag: "02 副标导语", title: "LISTEN BEYOND THE NOISE", sub: "MUSIC FESTIVAL", tone: "lead" },
      { id: "m2", tag: "03 声场色块", title: "明黄竖向锚带", sub: "ACCENT FIELD", tone: "tall" },
      { id: "m3", tag: "04 展期地点", title: "08.16 / SAT — HANGZHOU", sub: "SCHEDULE", tone: "note" },
    ],
  },
};

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    v1: 0.333,
    v2: 0.667,
    h1: 0.44,
    hierarchy: "equal",
    anchorX: 0.14,
    drifted: true,
  },
  classic: {
    label: "原海报经典解",
    v1: 0.21,
    v2: 0.65,
    h1: 0.28,
    hierarchy: "hero-left",
    anchorX: 0.84,
    drifted: false,
  },
  editorial: {
    label: "2:5:3 杂志解",
    v1: 0.20,
    v2: 0.70,
    h1: 0.26,
    hierarchy: "hero-left",
    anchorX: 0.87,
    drifted: false,
  },
  rightFocus: {
    label: "右焦反平衡解",
    v1: 0.32,
    v2: 0.54,
    h1: 0.30,
    hierarchy: "hero-right",
    anchorX: 0.14,
    drifted: false,
  },
  stressCrushed: {
    label: "压测：窄轨压碎",
    v1: 0.09,
    v2: 0.66,
    h1: 0.28,
    hierarchy: "hero-left",
    anchorX: 0.84,
    drifted: false,
  },
  stressMirror: {
    label: "压测：镜像伪平衡",
    v1: 0.333,
    v2: 0.667,
    h1: 0.36,
    hierarchy: "mirror",
    anchorX: 0.50,
    drifted: false,
  },
  stressStuffed: {
    label: "压测：塞满窒息",
    v1: 0.22,
    v2: 0.66,
    h1: 0.30,
    hierarchy: "stuffed",
    anchorX: 0.84,
    drifted: false,
  },
};

export function createInitialState() {
  return {
    scene: "blueprint",
    v1: PRESETS.broken.v1,
    v2: PRESETS.broken.v2,
    h1: PRESETS.broken.h1,
    hierarchy: PRESETS.broken.hierarchy,
    anchorX: PRESETS.broken.anchorX,
    drifted: PRESETS.broken.drifted,
    highlightKey: null, // "tension" | "balance" | "movement" | "surprise" | "order" | null
  };
}

export function clampState(s) {
  const v1 = Math.max(0.08, Math.min(0.68, s.v1));
  const v2 = Math.max(v1 + 0.08, Math.min(0.92, s.v2));
  const h1 = Math.max(0.16, Math.min(0.56, s.h1));
  const anchorX = Math.max(0.06, Math.min(0.94, s.anchorX));
  return { ...s, v1, v2, h1, anchorX };
}

function buildModuleSlots(hierarchy, cols, rows) {
  // cols = [0, v1, v2, 1], rows = [0, h1, h2, 1]
  // 每项返回 { col: [cStart, cEnd], row: [rStart, rEnd], weightFactor, roleRank }
  if (hierarchy === "equal") {
    return [
      { col: [0, 1], row: [0, 1], weightFactor: 1.05, roleRank: 1 },
      { col: [0, 1], row: [1, 2], weightFactor: 1.0, roleRank: 2 },
      { col: [1, 2], row: [0, 1], weightFactor: 0.95, roleRank: 3 },
      { col: [1, 2], row: [1, 2], weightFactor: 0.9, roleRank: 4 },
    ];
  }
  if (hierarchy === "mirror") {
    // 刻意构造左右镜像对称的两大块 + 两小块
    return [
      { col: [0, 1], row: [0, 2], weightFactor: 1.15, roleRank: 1 },
      { col: [2, 3], row: [0, 2], weightFactor: 1.15, roleRank: 2 },
      { col: [0, 1], row: [2, 3], weightFactor: 0.75, roleRank: 3 },
      { col: [2, 3], row: [2, 3], weightFactor: 0.75, roleRank: 4 },
    ];
  }
  if (hierarchy === "stuffed") {
    // 四块几乎把整张版心塞到 92%+，消灭留白呼吸空间
    return [
      { col: [0, 2], row: [1, 3], weightFactor: 1.35, roleRank: 1 },
      { col: [0, 2], row: [0, 1], weightFactor: 0.95, roleRank: 2 },
      { col: [2, 3], row: [0, 2], weightFactor: 0.95, roleRank: 3 },
      { col: [2, 3], row: [2, 3], weightFactor: 0.85, roleRank: 4 },
    ];
  }
  if (hierarchy === "hero-right") {
    // 右侧大主焦，左侧靠远处轻锚配平
    return [
      { col: [1, 3], row: [1, 2], weightFactor: 1.38, roleRank: 1 },
      { col: [1, 2], row: [0, 1], weightFactor: 0.72, roleRank: 2 },
      { col: [0, 1], row: [1, 2], weightFactor: 0.68, roleRank: 3 },
      { col: [0, 1], row: [2, 3], weightFactor: 0.58, roleRank: 4 },
    ];
  }
  // 默认 "hero-left"：忠实呼应 200 原海报「结构示意」的呼吸布局（左上与左下留白，左中大主焦 + 上中导语 + 右纵块 + 右下小块）
  return [
    { col: [0, 2], row: [1, 2], weightFactor: 1.38, roleRank: 1 },
    { col: [1, 2], row: [0, 1], weightFactor: 0.72, roleRank: 2 },
    { col: [2, 3], row: [1, 2], weightFactor: 0.68, roleRank: 3 },
    { col: [2, 3], row: [2, 3], weightFactor: 0.58, roleRank: 4 },
  ];
}

// 漂移向量（仅 drifted === true 时生效，用统一几何坐标表示，画布和诊断同一出处）
const DRIFT_OFFSETS = [
  { dx: 0, dy: 0 },
  { dx: 0.052, dy: -0.044 },
  { dx: 0, dy: 0 },
  { dx: -0.048, dy: 0.046 },
];

export function computeLayout(rawState) {
  const s = clampState(rawState);
  const c1 = s.v1;
  const c2 = s.v2 - s.v1;
  const c3 = 1 - s.v2;
  const cols = [0, s.v1, s.v2, 1];
  const h2 = Math.min(0.86, s.h1 + Math.max(0.36, (1 - s.h1) * 0.72));
  const r1 = s.h1;
  const r2 = h2 - s.h1;
  const r3 = 1 - h2;
  const rows = [0, s.h1, h2, 1];

  const colWidths = [c1, c2, c3];
  const rowHeights = [r1, r2, r3];
  const minCol = Math.min(...colWidths);
  const maxCol = Math.max(...colWidths);
  const colRatio = maxCol / Math.max(0.001, minCol);

  const minRow = Math.min(...rowHeights);
  const maxRow = Math.max(...rowHeights);
  const rowRatio = maxRow / Math.max(0.001, minRow);

  // 归一化 fr 比例表达（以最窄栏为 1 计，保留 1 位小数）
  const frValues = colWidths.map((w) => +(w / Math.max(0.01, minCol)).toFixed(1));
  const pctValues = [
    Math.round(c1 * 100),
    Math.round(c2 * 100),
    100 - Math.round(c1 * 100) - Math.round(c2 * 100),
  ];
  const cssColumns = `${frValues[0]}fr ${frValues[1]}fr ${frValues[2]}fr`;
  const rowFr = rowHeights.map((h) => +(h / Math.max(0.01, minRow)).toFixed(1));
  const cssRows = `${rowFr[0]}fr ${rowFr[1]}fr ${rowFr[2]}fr`;

  const slots = buildModuleSlots(s.hierarchy, cols, rows);
  const sceneInfo = SCENES[s.scene] || SCENES.blueprint;
  const padX = 0.014;
  const padY = 0.018;

  let coveredArea = 0;
  let totalWeight = 0;
  let weightedX = 0;
  let driftedCount = 0;

  const blocks = slots.map((slot, idx) => {
    const gx0 = cols[slot.col[0]] + padX;
    const gx1 = cols[slot.col[1]] - padX;
    const gy0 = rows[slot.row[0]] + padY;
    const gy1 = rows[slot.row[1]] - padY;

    const drift = s.drifted ? DRIFT_OFFSETS[idx] : { dx: 0, dy: 0 };
    const isDrifted = Math.abs(drift.dx) > 0.001 || Math.abs(drift.dy) > 0.001;
    if (isDrifted) driftedCount++;

    const x = Math.max(0.01, Math.min(0.95, gx0 + drift.dx));
    const y = Math.max(0.01, Math.min(0.95, gy0 + drift.dy));
    const w = Math.max(0.04, gx1 - gx0);
    const h = Math.max(0.04, gy1 - gy0);
    const area = w * h;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const visualMass = area * slot.weightFactor;

    coveredArea += area;
    totalWeight += visualMass;
    weightedX += visualMass * (cx - 0.5);

    const meta = sceneInfo.modules[idx];
    return {
      ...meta,
      idx,
      col: slot.col,
      row: slot.row,
      gridRect: { x: gx0, y: gy0, w, h },
      x,
      y,
      w,
      h,
      cx,
      cy,
      area,
      visualMass,
      isDrifted,
      driftPxApprox: isDrifted ? Math.round(Math.hypot(drift.dx * 720, drift.dy * 460)) : 0,
      roleRank: slot.roleRank,
    };
  });

  // 高饱和包豪斯配重锚点（青竖条 + 明黄小条/圆点：小面积但高饱和，杠杆臂效明显，符合阿恩海姆色彩分量规律）
  const anchorMass = 0.135;
  const anchorTorque = anchorMass * (s.anchorX - 0.5);
  totalWeight += anchorMass;
  weightedX += anchorTorque;

  // 归一化视觉重心偏移（示意）：范围大约 [-0.30, +0.30]，换算为百分比偏差与杠杆倾角
  const torqueNorm = totalWeight > 0 ? weightedX / totalWeight : 0;
  const torquePct = Math.round(torqueNorm * 100);
  const beamAngleDeg = Math.max(-14, Math.min(14, +(torqueNorm * 58).toFixed(1)));

  // 面积层级比：主焦块与次大块之比
  const sortedAreas = [...blocks].map((b) => b.area).sort((a, b) => b - a);
  const scaleRatio = sortedAreas[0] / Math.max(0.001, sortedAreas[1]);
  const whitespace = Math.max(0, 1 - coveredArea);

  // 视线动线顺序：按视觉权重（面积 × 权重因子）从大到小，或按结构主次连接 4 个模块中心
  const pathOrder = [...blocks]
    .sort((a, b) => b.visualMass - a.visualMass)
    .map((b) => ({ id: b.id, x: b.cx, y: b.cy, tag: b.tag }));

  // 4 项硬指标判定（全部由实绘几何单真源导出）
  const trackCrushed = minCol < 0.125 || maxCol > 0.64 || minRow < 0.135;
  const isMirror = s.hierarchy === "mirror";
  const isDeadSymmetry = colRatio < 1.38;
  const passTension = !trackCrushed && !isMirror && !isDeadSymmetry && colRatio <= 4.2;

  const passBalance = Math.abs(torqueNorm) <= 0.085 && !isMirror;

  const passMovement = scaleRatio >= 1.45 && !isMirror;

  const isStuffed = whitespace < 0.175;
  const passOrder = driftedCount === 0 && !isStuffed && !trackCrushed;

  const score = [passTension, passBalance, passMovement, passOrder].filter(Boolean).length;

  // 8 类精确失误诊断（按最致命的优先呈现，讲清“为什么会这样看”以及“下一步改哪”）
  let faultId = "ok";
  let statusBadge = `4 / 4 秩序成立`;
  let headline = "张力、杠杆与隐性轨道全部咬合";
  let why = `三栏拉开 ${pctValues.join("% : ")}%（跨比 ${colRatio.toFixed(1)}×），大焦块靠远处高饱和青黄锚点配平，视觉杠杆偏差仅 ${Math.abs(torquePct)}%（示意），留白 ${Math.round(whitespace * 100)}% 透气且 0 处脱轨。`;
  let hint = "试着再把 V1 拖到极端窄边，或切到顶部压测按钮，看看非对称会在哪一寸崩坏。";
  let severity = "ok";

  if (trackCrushed) {
    faultId = "crushed-track";
    statusBadge = `${score} / 4 窄轨压碎`;
    severity = "error";
    headline = `最窄栏缩到 ${Math.round(minCol * 100)}%，栏内内容被压碎`;
    why = "非对称不是越极端越高级。当某一栏宽度跌破 13%（经验参考下限），文字被迫断成碎字、图片缩成细条，网格从骨架变成牢笼。";
    hint = "把画布上的黄色分栏线 V1 或 V2 往回拉，让每条轨道都守在 14%–62% 之间。";
  } else if (isMirror) {
    faultId = "mirror-balance";
    statusBadge = `${score} / 4 镜像伪平衡`;
    severity = "error";
    headline = "左右完全镜像，稳是稳了却零张力";
    why = "杠杆读数虽停在 0%，但它靠的是“左一模一样、右一模一样”的对称复制，眼睛一眼看透全部布局，失去非对称带来的流动与惊喜。";
    hint = "把分栏线 V1 拖离 33% 均分点，再点击画布模块切换成“左大右纵”或“右焦反平衡”。";
  } else if (isDeadSymmetry) {
    faultId = "dead-symmetry";
    statusBadge = `${score} / 4 均分死对称`;
    severity = "error";
    headline = `三栏接近均分（${pctValues.join("% : ")}%），版面像静止表格`;
    why = `最大栏与最小栏比值仅 ${colRatio.toFixed(2)}×（经验建议 ≥ 1.4×）。当轨道宽窄几乎相等，版面天然往中心轴滑去，拉不出视觉拉扯感。`;
    hint = "直接左右拖动主画布上的「V1 分栏轨」（或按 ← / → 键），把比例拉开到类似 21% : 44% : 35%。";
  } else if (driftedCount > 0) {
    faultId = "off-grid-chaos";
    statusBadge = `${score} / 4 脱轨真乱`;
    severity = "error";
    headline = `${driftedCount} 块模块脱离网格线，滑向无序杂乱`;
    why = "非对称最容易被误解成“随便乱摆”。当模块边界偏离隐性栏线十几像素，人眼不会觉得随性，只会立刻察觉“没对齐”的廉价感。";
    hint = "直接点击画布上带红虚线框的脱轨模块，或按下「锁回网格线」，把它们磁吸归轨。";
  } else if (isStuffed) {
    faultId = "overstuffed-choke";
    statusBadge = `${score} / 4 塞满窒息`;
    severity = "error";
    headline = `留白只剩 ${Math.round(whitespace * 100)}%，非对称失去呼吸余地`;
    why = "留白本身就是非对称网格里的“轻量配重”。当版心塞满超过 83%，大小块挤成铁板一块，张力瞬间塌成拥堵。";
    hint = "点击画布切换主次跨度，让左上与下缘腾出至少 18%–35% 的透气负空间。";
  } else if (!passMovement) {
    faultId = "equal-weight-fight";
    statusBadge = `${score} / 4 平权打架`;
    severity = "error";
    headline = `最大块与次块仅差 ${scaleRatio.toFixed(2)}×，眼睛找不到入口`;
    why = "轨道虽已拉偏，但内容块面积过于接近，四处都在抢第一眼。没有明确的“主焦大块”，视线动线就会在版心里打转。";
    hint = "直接点击画布中的主模块（或下方切到「左主焦 / 右主焦」），把主次面积比拉开到 1.5× 以上。";
  } else if (torqueNorm < -0.085) {
    faultId = "left-capsize";
    statusBadge = `${score} / 4 左倾翻船`;
    severity = "error";
    headline = `重心偏左 ${Math.abs(torquePct)}%（示意），右侧空悬失稳`;
    why = "主焦大块与高饱和青黄锚点全堆在左半边，像翘翘板一头坐了两个人、另一头空着，整张版面有往左滑落的坠落感。";
    hint = "直接把画布里的「青色配重竖条」向右拖到右侧轻轨（距离支点越远，小块越压秤）。";
  } else if (torqueNorm > 0.085) {
    faultId = "right-capsize";
    statusBadge = `${score} / 4 右倾翻船`;
    severity = "error";
    headline = `重心偏右 +${torquePct}%（示意），左侧失重发飘`;
    why = "主焦体量与亮色锚点同时挤在右侧，杠杆向右倾斜，左侧留白从“呼吸空间”退化成了“忘填内容的空洞”。";
    hint = "把「青色配重竖条」拖向左轨远处，用小面积高饱和色块做远臂配平。";
  }

  // 五枚原海报核心要点实时灯状态（与 200.webp 五条完全对应）
  const keyPoints = [
    {
      key: "tension",
      title: "张力",
      en: "TENSION",
      color: "yellow",
      ok: passTension,
      pill: trackCrushed
        ? `窄轨 ${Math.round(minCol * 100)}%`
        : isMirror
          ? "镜像 0张力"
          : isDeadSymmetry
            ? `均分 ${colRatio.toFixed(1)}×`
            : `跨比 ${colRatio.toFixed(1)}×`,
    },
    {
      key: "balance",
      title: "平衡",
      en: "BALANCE",
      color: "cyan",
      ok: passBalance,
      pill: isMirror
        ? "镜像假平"
        : Math.abs(torquePct) <= 8
          ? `稳态 ${torquePct > 0 ? "+" : ""}${torquePct}%`
          : torquePct < 0
            ? `左倾 ${torquePct}%`
            : `右倾 +${torquePct}%`,
    },
    {
      key: "movement",
      title: "动线",
      en: "MOVEMENT",
      color: "yellow",
      ok: passMovement,
      pill: passMovement ? `主次 ${scaleRatio.toFixed(1)}×` : `平权 ${scaleRatio.toFixed(1)}×`,
    },
    {
      key: "surprise",
      title: "惊喜",
      en: "SURPRISE",
      color: "cyan",
      ok: passTension && passMovement && !isStuffed,
      pill: isStuffed
        ? `留白 ${Math.round(whitespace * 100)}%`
        : passTension && passMovement
          ? "偏轴焦点"
          : "焦点未立",
    },
    {
      key: "order",
      title: "可控的无序",
      en: "CONTROLLED DISORDER",
      color: "yellow",
      ok: passOrder,
      pill: driftedCount > 0 ? `脱轨 ${driftedCount} 块` : isStuffed ? "拥堵失序" : "锁轨 0px",
    },
  ];

  return {
    state: s,
    cols,
    rows,
    h2,
    colWidths,
    rowHeights,
    pctValues,
    frValues,
    cssColumns,
    cssRows,
    colRatio,
    rowRatio,
    scaleRatio,
    whitespace,
    blocks,
    anchorX: s.anchorX,
    torqueNorm,
    torquePct,
    beamAngleDeg,
    pathOrder,
    driftedCount,
    checks: { passTension, passBalance, passMovement, passOrder },
    score,
    faultId,
    severity,
    statusBadge,
    headline,
    why,
    hint,
    keyPoints,
  };
}
