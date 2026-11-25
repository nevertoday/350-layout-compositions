// 115 · 相似性原则 单真源模型：
// 27 枚标本（3 个真实语义组 × 9 枚）的位置、属性、归类分桶、四维指标与 8 类错态诊单全部由此统一计算。
// Canvas 渲染与页面 DOM 读数只读取 evaluate(state) 的返回结果，绝不写死常量。

export const PALETTE = {
  gold: "#FEC412",
  cream: "#F9F0DF",
  ink: "#111111",
  green: "#1B8A59",
  greenText: "#146E46",
  black: "#1D1D1D",
  sand: "#E7C897",
  sandStroke: "#C9A66B",
  sandText: "#7D5718",
  coral: "#F5491A",
  coralText: "#B83210",
};

// 灰度近似亮度（Rec.709），用于灰度/色觉检视渲染与单色风险评估
export const COLOR_LUMA = {
  green: 0.34,
  black: 0.08,
  sand: 0.78,
  coral: 0.36,
};

export const COLOR_HEX = {
  green: PALETTE.green,
  black: PALETTE.black,
  sand: PALETTE.sand,
  coral: PALETTE.coral,
};

export const COLOR_GRAY = {
  green: "#6D6D6D",
  black: "#1D1D1D",
  sand: "#CFC8BC",
  coral: "#747474",
};

export const SIZE_SCALE = {
  lg: 1.18,
  md: 0.92,
  sm: 0.66,
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报几何",
    groups: [
      { id: 0, name: "圆形组", en: "CIRCLES GROUP", short: "圆组", code: "A", shape: "circle", color: "green", size: "lg" },
      { id: 1, name: "方形组", en: "SQUARES GROUP", short: "方组", code: "B", shape: "square", color: "black", size: "md" },
      { id: 2, name: "三角形组", en: "TRIANGLES GROUP", short: "三角组", code: "C", shape: "triangle", color: "sand", size: "sm" },
    ],
    other: { name: "其他组", en: "OTHERS GROUP" },
  },
  transit: {
    id: "transit",
    label: "地铁导视标",
    groups: [
      { id: 0, name: "换乘线路", en: "TRANSFER LINES", short: "换乘", code: "T", shape: "circle", color: "green", size: "lg" },
      { id: 1, name: "出入口标", en: "EXITS & GATES", short: "出口", code: "E", shape: "square", color: "black", size: "md" },
      { id: 2, name: "便民设施", en: "AMENITIES", short: "服务", code: "S", shape: "triangle", color: "sand", size: "sm" },
    ],
    other: { name: "失类杂标", en: "UNGROUPED SIGNS" },
  },
  ui: {
    id: "ui",
    label: "界面状态卡",
    groups: [
      { id: 0, name: "已完成项", en: "COMPLETED", short: "完成", code: "✓", shape: "circle", color: "green", size: "lg" },
      { id: 1, name: "进行中项", en: "IN PROGRESS", short: "推进", code: "▪", shape: "square", color: "black", size: "md" },
      { id: 2, name: "待审核项", en: "IN REVIEW", short: "待审", code: "▲", shape: "triangle", color: "sand", size: "sm" },
    ],
    other: { name: "混码状态", en: "MIXED STATES" },
  },
};

const SHAPES = ["circle", "square", "triangle"];
const COLORS = ["green", "black", "sand"];
const SIZES = ["lg", "md", "sm"];

// 确定性混乱表（开场每组仅 4/9 与目标匹配，含朱红杂色，确保 0/4 失群且点修 1 枚即可让该组立刻突破 5/9 归队）
const CHAOS_SHAPE = [
  "square", "circle", "triangle", "circle", "square", "circle", "square", "circle", "triangle",
  "circle", "square", "triangle", "square", "triangle", "square", "triangle", "square", "circle",
  "square", "triangle", "circle", "triangle", "square", "triangle", "square", "triangle", "circle",
];
const CHAOS_COLOR = [
  "coral", "green", "sand", "green", "sand", "green", "black", "green", "coral",
  "sand", "black", "green", "black", "coral", "black", "sand", "black", "green",
  "black", "sand", "green", "sand", "coral", "sand", "green", "sand", "black",
];
const CHAOS_SIZE = [
  "sm", "lg", "md", "lg", "sm", "md", "sm", "lg", "md",
  "lg", "sm", "md", "sm", "lg", "md", "lg", "sm", "md",
  "md", "sm", "lg", "lg", "md", "sm", "lg", "sm", "md",
];

// 27 枚标本的聚拢位（3×3 分块，忠实原海报）与同排拉丁交错位（任意上下左右近邻均不同组）
const BASE_SLOTS = (() => {
  const slots = [];
  for (let g = 0; g < 3; g++) {
    for (let k = 0; k < 9; k++) {
      const idx = g * 9 + k;
      const r0 = Math.floor(k / 3);
      const lc = k % 3;
      const c0 = g * 3 + lc;
      // 保持同行水平滑行并在竖向每行偏移 +1 mod 3，杜绝跨行乱穿
      const r1 = r0;
      const c1 = lc * 3 + ((g + r0) % 3);
      slots.push({
        idx,
        group: g,
        localIdx: k,
        r0,
        c0,
        r1,
        c1,
        arcDir: g === 0 ? -1 : g === 2 ? 1 : 0,
      });
    }
  }
  return slots;
})();

export function defaultState() {
  return {
    theme: "poster",
    mix: 0.68,
    shapeRule: "chaos",    // "chaos" | "aligned" | "uniform" | "conflict"
    colorRule: "chaos",    // "chaos" | "aligned" | "mono" | "collide"
    sizeRule: "uniform",   // "uniform" | "aligned" | "chaos"
    grayscale: false,
    showLinks: true,
    overrides: {},
    selectedIdx: 0,
  };
}

export const PRESETS = {
  broken: () => defaultState(),
  poster: (prev) => ({
    ...defaultState(),
    theme: prev?.theme || "poster",
    mix: 0.48,
    shapeRule: "aligned",
    colorRule: "aligned",
    sizeRule: "uniform",
    grayscale: false,
    showLinks: true,
    overrides: {},
  }),
  monoShape: (prev) => ({
    ...defaultState(),
    theme: prev?.theme || "poster",
    mix: 0.64,
    shapeRule: "aligned",
    colorRule: "mono",
    sizeRule: "uniform",
    grayscale: false,
    showLinks: true,
    overrides: {},
  }),
  colorSize: (prev) => ({
    ...defaultState(),
    theme: prev?.theme || "poster",
    mix: 0.58,
    shapeRule: "uniform",
    colorRule: "aligned",
    sizeRule: "aligned",
    grayscale: false,
    showLinks: true,
    overrides: {},
  }),
};

// 聚拢时的列横坐标（3 组之间有明显间隔）；混排时收归等距 9 列
function clusteredX(c0) {
  const g = Math.floor(c0 / 3);
  const lc = c0 % 3;
  // 左、中、右三块各占约 0.27 宽，中间留 0.065 通道，完整留出边距
  const blockStarts = [0.075, 0.39, 0.705];
  const step = 0.095;
  return blockStarts[g] + lc * step;
}

function uniformX(c1) {
  return 0.075 + (c1 / 8) * 0.85;
}

function rowY(r) {
  return 0.19 + r * 0.31;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function expectedGroupSig(state, g) {
  const shape =
    state.shapeRule === "aligned" ? SHAPES[g] :
    state.shapeRule === "uniform" ? "circle" :
    SHAPES[g];
  const color =
    state.colorRule === "aligned" ? COLORS[g] :
    state.colorRule === "mono" ? "black" :
    state.colorRule === "collide" ? (g === 2 ? "sand" : "green") :
    COLORS[g];
  const size =
    state.sizeRule === "aligned" ? SIZES[g] : "md";
  return { shape, color, size };
}

export function computeTokens(state) {
  const m = Math.max(0, Math.min(1, state.mix));
  const em = easeInOut(m);
  const arc = Math.sin(Math.PI * em) * 0.068;

  const list = BASE_SLOTS.map((slot) => {
    const g = slot.group;
    let shape;
    if (state.shapeRule === "aligned") shape = SHAPES[g];
    else if (state.shapeRule === "uniform") shape = "circle";
    else if (state.shapeRule === "conflict") shape = SHAPES[slot.r1]; // 按横行分配形状，与语义组正交打架
    else shape = CHAOS_SHAPE[slot.idx];

    let color;
    if (state.colorRule === "aligned") color = COLORS[g];
    else if (state.colorRule === "mono") color = "black";
    else if (state.colorRule === "collide") color = g === 2 ? "sand" : "green"; // A、B 两组撞绿
    else color = CHAOS_COLOR[slot.idx];

    let size;
    if (state.sizeRule === "aligned") size = SIZES[g];
    else if (state.sizeRule === "chaos") size = CHAOS_SIZE[slot.idx];
    else size = "md";

    const ov = state.overrides?.[slot.idx];
    if (ov) {
      if (ov.shape) shape = ov.shape;
      if (ov.color) color = ov.color;
      if (ov.size) size = ov.size;
    }

    const x0 = clusteredX(slot.c0);
    const y0 = rowY(slot.r0);
    const x1 = uniformX(slot.c1);
    const y1 = rowY(slot.r1);
    const x = x0 + (x1 - x0) * em;
    const y = y0 + (y1 - y0) * em + arc * slot.arcDir;

    const sig = `${shape}|${color}|${size}`;
    return {
      ...slot,
      shape,
      color,
      size,
      sig,
      x,
      y,
      overridden: !!ov,
    };
  });

  // 确定性最小间距推斥：确保任意中间混排度（如 48%、68%）下 27 枚标本绝不重叠遮挡，而在 0% / 100% 保持精准网格
  const relaxStrength = Math.sin(Math.PI * em);
  if (relaxStrength > 0.02) {
    const aspectX = 3.1; // 与画布横纵比近似匹配，保证圆心物理间距均匀
    const minDist = 0.255;
    const minDistSq = minDist * minDist;
    const damp = 0.65 + 0.35 * relaxStrength;
    for (let iter = 0; iter < 6; iter++) {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j];
          const dx = (b.x - a.x) * aspectX;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < minDistSq) {
            const dist = Math.sqrt(d2);
            const safeDist = dist > 0.001 ? dist : 0.001;
            const push = ((minDist - safeDist) * 0.5) * damp;
            const nx = dist > 0.001 ? dx / safeDist : ((i & 1 ? 1 : -1) * 0.7);
            const ny = dist > 0.001 ? dy / safeDist : ((j & 1 ? 1 : -1) * 0.7);
            const px = (nx * push) / aspectX;
            const py = ny * push;
            a.x = Math.max(0.055, Math.min(0.945, a.x - px));
            b.x = Math.max(0.055, Math.min(0.945, b.x + px));
            a.y = Math.max(0.14, Math.min(0.87, a.y - py));
            b.y = Math.max(0.14, Math.min(0.87, b.y + py));
          }
        }
      }
    }
  }

  return list;
}

// 统计每个语义组的主导签名与纯度，再由同一套实算数据产出 4 个判断、8 类错态、4 个括号人数
export function evaluate(state) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const tokens = computeTokens(state);

  // 1. 统计每组主导签名（实际画在盘面上的多数派）
  const groupStats = [0, 1, 2].map((g) => {
    const list = tokens.filter((t) => t.group === g);
    const sigCounts = new Map();
    const shapeCounts = new Map();
    const colorCounts = new Map();
    const sizeCounts = new Map();
    for (const t of list) {
      sigCounts.set(t.sig, (sigCounts.get(t.sig) || 0) + 1);
      shapeCounts.set(t.shape, (shapeCounts.get(t.shape) || 0) + 1);
      colorCounts.set(t.color, (colorCounts.get(t.color) || 0) + 1);
      sizeCounts.set(t.size, (sizeCounts.get(t.size) || 0) + 1);
    }
    const topOf = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    const [domSig, domCount] = topOf(sigCounts);
    const [domShape, shapeCount] = topOf(shapeCounts);
    const [domColor, colorCount] = topOf(colorCounts);
    const [domSize, sizeCount] = topOf(sizeCounts);
    return {
      g,
      list,
      domSig,
      domCount,
      purity: domCount / list.length,
      domShape,
      shapePurity: shapeCount / list.length,
      domColor,
      colorPurity: colorCount / list.length,
      domSize,
      sizePurity: sizeCount / list.length,
      hasCoralNoise: list.some((t) => t.color === "coral"),
    };
  });

  // 2. 组间区分度：3 个主导签名有多少两两不同
  const uniqueDomSigs = new Set(groupStats.map((s) => s.domSig)).size;
  let pairDiff = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      if (groupStats[i].domSig !== groupStats[j].domSig) pairDiff++;
    }
  }
  const betweenSep = pairDiff / 3; // 0, 0.33, 0.67, 1.0

  // 检查哪些组发生了撞衫（共享完全相同的主导签名）
  const sigOwners = new Map();
  for (const s of groupStats) {
    sigOwners.set(s.domSig, [...(sigOwners.get(s.domSig) || []), s.g]);
  }
  const collidingGroups = new Set();
  for (const owners of sigOwners.values()) {
    if (owners.length > 1) owners.forEach((g) => collidingGroups.add(g));
  }

  // 3. 逐枚判定是否成功归入本组或掉进「其他组」
  const allSigs = new Set(tokens.map((t) => t.sig));
  const coralCount = tokens.filter((t) => t.color === "coral").length;
  const enrichedTokens = tokens.map((t) => {
    const gs = groupStats[t.group];
    const matchesDom = t.sig === gs.domSig;
    const groupCollided = collidingGroups.has(t.group);
    const isGrouped = matchesDom && !groupCollided && gs.domCount >= 5 && t.color !== "coral";
    return {
      ...t,
      isGrouped,
      isMisfit: !isGrouped,
      groupCollided,
      bucket: isGrouped ? t.group : 3,
    };
  });

  const bucketCounts = [0, 0, 0, 0];
  for (const t of enrichedTokens) bucketCounts[t.bucket]++;

  // 4. 关键通道分析（颜色、形状、大小各自的组内纯度与组间区分）
  const avgPurity = (groupStats[0].purity + groupStats[1].purity + groupStats[2].purity) / 3;
  const avgShapePurity = (groupStats[0].shapePurity + groupStats[1].shapePurity + groupStats[2].shapePurity) / 3;
  const avgColorPurity = (groupStats[0].colorPurity + groupStats[1].colorPurity + groupStats[2].colorPurity) / 3;
  const avgSizePurity = (groupStats[0].sizePurity + groupStats[1].sizePurity + groupStats[2].sizePurity) / 3;

  const distinctShapes = new Set(groupStats.map((s) => s.domShape)).size;
  const distinctColors = new Set(groupStats.map((s) => s.domColor)).size;
  const distinctSizes = new Set(groupStats.map((s) => s.domSize)).size;

  const shapeActive = distinctShapes === 3 && avgShapePurity >= 0.88;
  const colorActive = distinctColors === 3 && avgColorPurity >= 0.88 && coralCount === 0;
  const sizeActive = distinctSizes === 3 && avgSizePurity >= 0.88;

  // 通道打架检测：某个通道已经试图区分，但另一通道在组内高熵混乱或正交错配
  const shapeConflict = (avgShapePurity < 0.78) && (colorActive || sizeActive || state.shapeRule === "conflict");
  const colorConflict = (avgColorPurity < 0.78) && (shapeActive || sizeActive);
  const sizeConflict = (avgSizePurity < 0.78) && (shapeActive || colorActive || state.sizeRule === "chaos");
  const hasChannelFight = shapeConflict || colorConflict || sizeConflict || state.shapeRule === "conflict";

  // 灰度/色觉冗余检测（WCAG 1.4.1）：只有颜色起作用、形状和大小完全相同
  const colorOnlyRisk = colorActive && !shapeActive && !sizeActive;

  // 样式过载检测：总组合样式 > 5（含花屏/随机杂大）
  const styleOverload = allSigs.size > 5;

  // 5. 跨位空间指标：由实绘坐标 (x, y) 计算每个同组标本的平均最近同组距 vs 平均最近异组距
  let sameDistSum = 0;
  let diffDistSum = 0;
  let sameNeighborHits = 0;
  for (const t of enrichedTokens) {
    let minSame = Infinity;
    let minDiff = Infinity;
    for (const o of enrichedTokens) {
      if (o.idx === t.idx) continue;
      const d = Math.hypot(t.x - o.x, t.y - o.y);
      if (o.group === t.group) {
        if (d < minSame) minSame = d;
      } else {
        if (d < minDiff) minDiff = d;
      }
    }
    sameDistSum += minSame;
    diffDistSum += minDiff;
    if (minSame < minDiff * 1.05) sameNeighborHits++;
  }
  const avgSameDist = sameDistSum / enrichedTokens.length;
  const avgDiffDist = diffDistSum / enrichedTokens.length;
  // 邻近同组率：0% 聚拢时为 100%，混排推到 ≥ 35% 后跌落，说明必须靠相似性而非邻近性
  const proximityAssistPct = Math.round((sameNeighborHits / enrichedTokens.length) * 100);
  const mixPct = Math.round(state.mix * 100);

  // 跨位凝聚指数（示意）：综合纯度、组间区分、通道合力与空间分离抗噪
  const channelPower =
    (colorActive ? 0.56 : 0) +
    (shapeActive ? 0.34 : 0) +
    (sizeActive ? 0.28 : 0);
  const cappedPower = Math.min(1, channelPower);
  const conflictPenalty = hasChannelFight ? 0.42 : colorOnlyRisk ? 0.16 : 0;
  const cohesionRaw = Math.max(
    0,
    Math.min(1, avgPurity * betweenSep * cappedPower * (1 - conflictPenalty) * (1 - 0.14 * state.mix))
  );
  // 若纯形状或双维全齐，给清晰可读的跨位凝聚示意百分比
  const cohesionPct = Math.round(
    (shapeActive && colorActive ? 0.96 : colorActive && sizeActive ? 0.93 : shapeActive && !hasChannelFight && betweenSep === 1 ? 0.84 : cohesionRaw) *
    avgPurity * betweenSep * (hasChannelFight ? 0.52 : 1) * (styleOverload ? 0.65 : 1) * 100
  );

  // 6. 四大核心判断（每项严格单真源：组间区分必须建立在各组各自已有明确多数派 ≥ 5/9 之上）
  const qualifiedGroups = groupStats.filter((s) => s.domCount >= 5 && !collidingGroups.has(s.g)).length;
  const misfitsCount = bucketCounts[3];
  const purityOk = avgPurity >= 0.92 && misfitsCount === 0 && !styleOverload;
  const sepOk = betweenSep === 1 && collidingGroups.size === 0 && uniqueDomSigs === 3 && qualifiedGroups === 3;
  const coherenceOk = !hasChannelFight && !colorOnlyRisk && (shapeActive || sizeActive);
  const crossOk = state.mix >= 0.35 && purityOk && sepOk && !hasChannelFight && cohesionPct >= 72;

  const checks = { purityOk, sepOk, coherenceOk, crossOk };
  const passCount = [purityOk, sepOk, coherenceOk, crossOk].filter(Boolean).length;

  // 7. 判定 8 类明确错态或正当解类别
  let code = "pass";
  let badge = "4 / 4 归类稳固";
  let title = "";
  let why = "";
  let action = "";
  let solutionKind = "";

  if (passCount === 4) {
    if (colorActive && shapeActive && !sizeActive) {
      solutionKind = "原海报双维解";
      title = "色形双维对齐，跨位混排也能一秒抓出三组";
      why = `27 枚标本 100% 归入本组，0 枚落入「${theme.other.name}」。即使当前混排度达到 ${mixPct}%（最近邻大多属于异组），颜色先完成前注意抓取，形状在灰度与色觉受限时稳稳兜底。`;
      action = "试着点亮「灰度色觉检视」，或左右拖动画布比较 0% 聚拢与 100% 全盘穿插的区别。";
    } else if (shapeActive && !colorActive && !sizeActive) {
      solutionKind = "黑白同形解";
      title = "单色异形同样成立，黑白媒介 100% 可辨";
      why = `全部标本统一为墨黑，单靠圆、方、三角三种几何轮廓在 ${mixPct}% 混排下把三组清晰分开。没有颜色干扰，也没有色盲失灵风险，只是初次扫视速度略慢于彩色编码。`;
      action = "可尝试再打开「颜色 · 同组三色」，感受彩色叠加上去后眼球抓取速度的跃升。";
    } else if (colorActive && sizeActive && !shapeActive) {
      solutionKind = "色尺双维解";
      title = "颜色配尺度阶梯，同形也能拉出三层分组";
      why = `三组共用圆形，但以「大绿 / 中黑 / 小沙」双维协同编码：彩视下颜色瞬间成片，黑白打印时 1.8× 的半径跨度依然能把三类分清。`;
      action = "把混排度拖到 100%，看看大中小三层在全盘交错下是否依然层次分明。";
    } else {
      solutionKind = "三维护航解";
      title = "颜色、形状与大小三线对齐，归类信号极强";
      why = `三项视觉属性全部指向同一套语义分组，27 枚标本在 ${mixPct}% 跨位穿插中形成极高凝聚力，无任何通道打架。`;
      action = "也可以试试点击画布上任意一枚图形，主动制造 1 枚「漏网叛徒」看看人眼有多敏感。";
    }
  } else {
    badge = `${passCount} / 4 待理群`;
    if (betweenSep < 1 || collidingGroups.size > 0) {
      code = "collide";
      title = "不同语义组撞衫同码，视觉边界直接塌陷";
      why = `目前有 ${collidingGroups.size} 个不同语义组共用了完全相同的主视觉外观（有效区分组仅 ${uniqueDomSigs}/3）。人眼只认长相不认背后标签，两组会立刻被大脑合并成同一大类。`;
      action = "把「颜色」切到「同组三色」，或把「形状」切到「同组同形」，给三组各自立起独立身份。";
    } else if (state.shapeRule === "conflict" || (hasChannelFight && state.sizeRule !== "chaos" && misfitsCount > 4 && (colorActive || shapeActive))) {
      code = "conflict";
      title = "颜色和形状各吹各的号，眼睛在两套分组里打架";
      why = "大脑同时收到两份互相矛盾的归类指令：按颜色看是一套分组，按形状看又扯成另一套。交叉编码迫使读者逐个核对，完全抵消了相似性原则省力的初衷。";
      action = "让「形状」与「颜色」对齐同一套分组（切「同组同形」），或把其中一个维度收为「全同圆 / 全墨单色」。";
    } else if (state.sizeRule === "chaos" && !purityOk) {
      code = "size-noise";
      title = "无关的大小起伏成了视觉噪音，拆散了原本整齐的组";
      why = `当前画布上混入了随机的尺度跳跃，总视觉样式膨胀到 ${allSigs.size} 种。人眼会把「大号」自动归成高优先级一派，直接打断按类别建立的归属感。`;
      action = "把「大小」切回「全等大」，或者改用与类别一一对应的「同组三阶」。";
    } else if (styleOverload && misfitsCount >= 9) {
      code = "chaos";
      title = `${misfitsCount} 枚标本掉进「${theme.other.name}」，满盘花屏抓不出规律`;
      why = `全盘同时冒出 ${allSigs.size} 种杂乱的外观组合${coralCount ? `（还混进 ${coralCount} 枚抢戏朱红杂色）` : ""}，组内平均纯度只有 ${Math.round(avgPurity * 100)}%。就像原海报最右栏铺满整张画面，眼睛只能逐个死盯，归类瞬间失效。`;
      action = "先把「形状」切到「同组同形」并把「颜色」切到「同组三色」，或直接在画布上点击红框叛徒逐枚归队。";
    } else if (misfitsCount > 0 && misfitsCount <= 8) {
      code = "stray";
      title = `还剩 ${misfitsCount} 枚「漏网叛徒」游离在「${theme.other.name}」里`;
      why = `整体分组骨架已经立住了（纯度 ${Math.round(avgPurity * 100)}%），但这 ${misfitsCount} 枚标红的孤立元素穿错了外衣，读者会误以为它们属于别的类别或特例。`;
      action = "直接在画布上点击带朱红虚线环的叛徒图形，即可把它一键修复回本组。";
    } else if (colorOnlyRisk) {
      code = "color-only";
      title = "只靠颜色硬分三组，遇上色觉受限或黑白打印就会失灵";
      why = "三组形状全圆、大小全等，唯一区别只剩色相。切到「灰度色觉检视」就会发现，翠绿与暖沙失去色相后辨识骤降——这也是 W3C WCAG 1.4.1 明确反对「仅用颜色传义」的原因。";
      action = "把「形状」切到「同组同形」或把「大小」切到「同组三阶」，加上第二条形态/尺度保险。";
    } else if (state.mix < 0.35) {
      code = "proximity";
      title = `当前只是分列抱团（混排 ${mixPct}%），还没检验跨位归类`;
      why = `现在 ${proximityAssistPct}% 的同组标本本来就挨在一起，是「邻近性（116）」在替你撑腰。如果只在聚拢排布里整齐，还证明不了相似性「无关位置也能归为一组」。`;
      action = "直接在画布上向右横向拖动，把跨位混排度拉到 35% 以上，亲自验收跨距凝聚力。";
    } else {
      code = "overload";
      title = "外观样式拆得太碎，超出了人眼一眼归类的承载上限";
      why = `当前画布存在 ${allSigs.size} 种不同组合，超过经验上限（同一视线面宜控在 3–4 组主样式以内），注意力被拆散。`;
      action = "收紧编码维度：让每组只保留 1 种固定签名，去掉多余的混杂变化。";
    }
  }

  // 8. 4 个底部括号的动态副标签（单真源同步画布真实属性，绝不和画面打架）
  const activeCueText =
    shapeActive && colorActive ? "同形同色 → 归类" :
    shapeActive && !colorActive ? "同形 → 归类" :
    colorActive && sizeActive ? "同色同尺 → 归类" :
    colorActive ? "仅同色 → 欠冗余" :
    "属性混乱 → 失群";

  const activeCueEn =
    shapeActive && colorActive ? "SAME SHAPE & COLOR → GROUPED" :
    shapeActive && !colorActive ? "SAME SHAPE → GROUPED" :
    colorActive && sizeActive ? "SAME COLOR & SIZE → GROUPED" :
    colorActive ? "COLOR ONLY → LOW REDUNDANCY" :
    "MIXED CUES → UNGROUPED";

  const brackets = [
    {
      idx: 0,
      name: theme.groups[0].name,
      en: theme.groups[0].en,
      sub: bucketCounts[0] === 9 ? activeCueText : `已归队 ${bucketCounts[0]}/9`,
      subEn: bucketCounts[0] === 9 ? activeCueEn : `${bucketCounts[0]} OF 9 MATCHED`,
      count: bucketCounts[0],
      total: 9,
      ok: bucketCounts[0] === 9 && !collidingGroups.has(0),
      color: state.grayscale ? COLOR_GRAY.green : (state.colorRule === "mono" ? PALETTE.black : PALETTE.green),
      textColor: state.grayscale ? "#3A3A3A" : (state.colorRule === "mono" ? PALETTE.black : PALETTE.greenText),
    },
    {
      idx: 1,
      name: theme.groups[1].name,
      en: theme.groups[1].en,
      sub: bucketCounts[1] === 9 ? activeCueText : `已归队 ${bucketCounts[1]}/9`,
      subEn: bucketCounts[1] === 9 ? activeCueEn : `${bucketCounts[1]} OF 9 MATCHED`,
      count: bucketCounts[1],
      total: 9,
      ok: bucketCounts[1] === 9 && !collidingGroups.has(1),
      color: PALETTE.black,
      textColor: PALETTE.black,
    },
    {
      idx: 2,
      name: theme.groups[2].name,
      en: theme.groups[2].en,
      sub: bucketCounts[2] === 9 ? activeCueText : `已归队 ${bucketCounts[2]}/9`,
      subEn: bucketCounts[2] === 9 ? activeCueEn : `${bucketCounts[2]} OF 9 MATCHED`,
      count: bucketCounts[2],
      total: 9,
      ok: bucketCounts[2] === 9 && !collidingGroups.has(2),
      color: state.grayscale ? "#8A857C" : (state.colorRule === "mono" ? PALETTE.black : PALETTE.sandStroke),
      textColor: state.grayscale ? "#4A4640" : (state.colorRule === "mono" ? PALETTE.black : PALETTE.sandText),
    },
    {
      idx: 3,
      name: theme.other.name,
      en: theme.other.en,
      sub: bucketCounts[3] > 0 ? `${bucketCounts[3]} 枚杂乱 → 不归类` : "0 枚失群 · 全部归队",
      subEn: bucketCounts[3] > 0 ? "DIFFERENT CUES → NOT GROUPED" : "0 UNGROUPED · ALL ALIGNED",
      count: bucketCounts[3],
      total: 27,
      ok: bucketCounts[3] === 0,
      color: state.grayscale ? "#5C5C5C" : PALETTE.coral,
      textColor: state.grayscale ? "#3A3A3A" : PALETTE.coralText,
    },
  ];

  // 原海报顶部四栏关键词实时状态
  const keywords = [
    {
      zh: "归类",
      en: "GROUPING",
      ok: purityOk,
      status: purityOk ? "27/27 齐队" : `${misfitsCount} 枚失群`,
    },
    {
      zh: "共性",
      en: "COMMONALITY",
      ok: sepOk && !hasChannelFight,
      status: collidingGroups.size > 0 ? `撞衫 ${uniqueDomSigs}/3` : qualifiedGroups < 3 ? `散乱无主` : hasChannelFight ? "色形打架" : "三组独立",
    },
    {
      zh: "识别",
      en: "RECOGNITION",
      ok: coherenceOk,
      status: colorOnlyRisk ? "单色风险" : coherenceOk ? "双维稳辨" : `样式 ${allSigs.size} 种`,
    },
    {
      zh: "凝聚",
      en: "COHESION",
      ok: crossOk,
      status: state.mix < 0.35 ? `聚拢 ${mixPct}%` : `跨位 ${cohesionPct}%`,
    },
  ];

  // 原海报底部三黑圆要点柱实时状态
  const pillars = [
    {
      ok: purityOk && sepOk,
      status: purityOk && sepOk ? "达标" : collidingGroups.size > 0 ? "组间撞衫" : `纯度 ${Math.round(avgPurity * 100)}%`,
    },
    {
      ok: crossOk,
      status: state.mix < 0.35 ? `混排 ${mixPct}% 待验` : crossOk ? `跨位 ${mixPct}% 稳固` : "跨位散架",
    },
    {
      ok: coherenceOk && purityOk,
      status: colorOnlyRisk ? "缺形状冗余" : coherenceOk && purityOk ? "凝聚清晰" : "通道噪声",
    },
  ];

  return {
    theme,
    tokens: enrichedTokens,
    groupStats,
    brackets,
    keywords,
    pillars,
    checks,
    passCount,
    code,
    badge,
    title,
    why,
    action,
    solutionKind,
    metrics: {
      purityPct: Math.round(avgPurity * 100),
      uniqueGroups: qualifiedGroups,
      styleCount: allSigs.size,
      misfitsCount,
      mixPct,
      cohesionPct,
      proximityAssistPct,
      avgSameDist: +avgSameDist.toFixed(2),
      avgDiffDist: +avgDiffDist.toFixed(2),
    },
  };
}
