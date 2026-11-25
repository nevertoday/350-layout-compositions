// 201 方格网格（SQUARE GRID）单真源几何模型
// 所有 8×8 画布绘制、标题方框变形、右侧引线、左侧四要点章与诊断文案均从此模块实时算出。

export const GRID_N = 8;

export const GUTTER_MODES = {
  "0": { id: "0", label: "无缝 0", short: "0 格", gx: 0, gy: 0, ratioText: "0" },
  "0.25": { id: "0.25", label: "1/4 格等缝", short: "1/4u", gx: 0.25, gy: 0.25, ratioText: "1/4 u" },
  "0.5": { id: "0.5", label: "1/2 格宽缝", short: "1/2u", gx: 0.5, gy: 0.5, ratioText: "1/2 u" },
  uneven: { id: "uneven", label: "横松竖挤", short: "不等缝", gx: 0.36, gy: 0.06, ratioText: "0.36u / 0.06u" },
  tooWide: { id: "tooWide", label: "过宽散架", short: "0.72u", gx: 0.72, gy: 0.72, ratioText: "0.72 u" },
};

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报 8×8",
    tiles: {
      a: { title: "A", sub: "大字模块", role: "视觉锚" },
      b: { title: "模块 01", sub: "图块区", role: "次主区" },
      c: { title: "模块 02", sub: "说明区", role: "辅衡区" },
      d: { title: "单元", sub: "1×1 圆标", role: "基准尺" },
    },
  },
  event: {
    id: "event",
    name: "海报分区",
    tiles: {
      a: { title: "设计周", sub: "DESIGN WEEK", role: "主标题" },
      b: { title: "主视觉", sub: "陶土圆标", role: "焦图区" },
      c: { title: "06 JUNE", sub: "10–16 · 展厅", role: "展期块" },
      d: { title: "→", sub: "入口导引", role: "行动角" },
    },
  },
  ui: {
    id: "ui",
    name: "界面卡片",
    tiles: {
      a: { title: "1,280", sub: "数据概览", role: "核心卡" },
      b: { title: "68%", sub: "任务进度", role: "状态卡" },
      c: { title: "32 人", sub: "团队在线", role: "成员卡" },
      d: { title: "3 条", sub: "系统通知", role: "微徽标" },
    },
  },
};

export const PRESETS = {
  // 开场刻意停在 0/4 全错态：扁矩形单元 + 横竖缝不等 + 半格脱轨压叠 + 全 1×1 瓷砖平权
  broken: {
    name: "开场 0/4 错态",
    aspect: 1.42,
    gutterMode: "uneven",
    tiles: [
      { id: "a", kind: "glyph", x: 0.45, y: 5.35, w: 1, h: 1 },
      { id: "b", kind: "modTint", x: 1.0, y: 1.0, w: 1, h: 1 },
      { id: "c", kind: "modFrame", x: 4.35, y: 1.35, w: 1, h: 1 },
      { id: "d", kind: "unitDot", x: 4.8, y: 1.75, w: 1, h: 1 },
    ],
  },
  // 原海报 8×8 经典解
  poster: {
    name: "原海报解",
    aspect: 1.0,
    gutterMode: "0",
    tiles: [
      { id: "a", kind: "glyph", x: 0, y: 5, w: 3, h: 3 },
      { id: "b", kind: "modTint", x: 0, y: 0, w: 2, h: 2 },
      { id: "c", kind: "modFrame", x: 6, y: 3, w: 2, h: 2 },
      { id: "d", kind: "unitDot", x: 7, y: 0, w: 1, h: 1 },
    ],
  },
  // 1/4u 等缝平衡拼图解（另一组合法解）
  balanced: {
    name: "等缝拼图解",
    aspect: 1.0,
    gutterMode: "0.25",
    tiles: [
      { id: "a", kind: "glyph", x: 0, y: 0, w: 3, h: 3 },
      { id: "b", kind: "modTint", x: 4, y: 0, w: 3, h: 3 },
      { id: "c", kind: "modFrame", x: 0, y: 4, w: 4, h: 2 },
      { id: "d", kind: "unitDot", x: 5, y: 4, w: 2, h: 2 },
    ],
  },
  // 压测错态：全 1×1 瓷砖平权
  tileWall: {
    name: "压测：瓷砖平权",
    aspect: 1.0,
    gutterMode: "0.25",
    tiles: [
      { id: "a", kind: "glyph", x: 2, y: 2, w: 1, h: 1 },
      { id: "b", kind: "modTint", x: 5, y: 2, w: 1, h: 1 },
      { id: "c", kind: "modFrame", x: 2, y: 5, w: 1, h: 1 },
      { id: "d", kind: "unitDot", x: 5, y: 5, w: 1, h: 1 },
    ],
  },
  // 压测错态：全部堆左失衡
  lopsided: {
    name: "压测：单侧倾覆",
    aspect: 1.0,
    gutterMode: "0",
    tiles: [
      { id: "a", kind: "glyph", x: 0, y: 4, w: 3, h: 3 },
      { id: "b", kind: "modTint", x: 0, y: 0, w: 2, h: 2 },
      { id: "c", kind: "modFrame", x: 0, y: 2, w: 2, h: 2 },
      { id: "d", kind: "unitDot", x: 2, y: 0, w: 1, h: 1 },
    ],
  },
};

export function createState(presetKey = "broken") {
  const p = PRESETS[presetKey] || PRESETS.broken;
  return {
    aspect: p.aspect,
    gutterMode: p.gutterMode,
    snapEnabled: true,
    theme: "poster",
    selectedId: "a",
    highlightRule: null,
    tiles: p.tiles.map((t) => ({ ...t })),
  };
}

export function applyPreset(state, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  state.aspect = p.aspect;
  state.gutterMode = p.gutterMode;
  state.tiles = p.tiles.map((t) => ({ ...t }));
}

export function clampAspect(val) {
  return Math.max(0.6, Math.min(1.6, Math.round(val * 100) / 100));
}

export function snapCoord(val, maxVal, enabled) {
  const clamped = Math.max(0, Math.min(maxVal, val));
  if (!enabled) return Math.round(clamped * 20) / 20;
  const nearest = Math.round(clamped);
  if (Math.abs(clamped - nearest) <= 0.18) return nearest;
  return Math.round(clamped * 20) / 20;
}

// 计算任意网格坐标下模块在画布矩形 (ox, oy, cellW, cellH, gapX, gapY) 内的像素包围盒
export function tilePixelRect(tile, geom) {
  const { ox, oy, cellW, cellH, gapX, gapY } = geom;
  const stepX = cellW + gapX;
  const stepY = cellH + gapY;
  const px = ox + tile.x * stepX;
  const py = oy + tile.y * stepY;
  const pw = tile.w * cellW + Math.max(0, tile.w - 1) * gapX;
  const ph = tile.h * cellH + Math.max(0, tile.h - 1) * gapY;
  return { x: px, y: py, w: pw, h: ph };
}

// 视觉实重（墨量密度权重，按图形种类计算重心，避免大号镂空字 A 与淡色块被算成实心砖块）
function visualWeight(tile) {
  const area = tile.w * tile.h;
  if (tile.kind === "glyph") return area * 0.48;
  if (tile.kind === "unitDot") return Math.max(1.6, area * 0.85);
  if (tile.kind === "modFrame") return area * 0.68;
  return area * 0.6;
}

// 单真源诊断：实算 4 条核心规则与 9 类具体错态
export function evaluate(state) {
  const gm = GUTTER_MODES[state.gutterMode] || GUTTER_MODES["0"];
  const aspect = state.aspect;
  const aspectDev = Math.abs(aspect - 1.0);

  // 1. 统一单位（严格 1:1 正方形）
  const unitOk = aspectDev <= 0.045;
  const unitIssue = aspect > 1.045 ? "flat" : aspect < 0.955 ? "tall" : null;

  // 2. 间距可控（横竖等倍且在 0–0.55u 健康带内）
  const gutterUneven = Math.abs(gm.gx - gm.gy) > 0.01;
  const gutterTooWide = gm.gx > 0.55 || gm.gy > 0.55;
  const gutterOk = !gutterUneven && !gutterTooWide;

  // 3. 对齐交点与无压叠（脱轨、越界、重叠）
  const offGridIds = [];
  const outOfBoundsIds = [];
  for (const t of state.tiles) {
    const dx = Math.abs(t.x - Math.round(t.x));
    const dy = Math.abs(t.y - Math.round(t.y));
    if (dx > 0.03 || dy > 0.03) offGridIds.push(t.id);
    if (t.x < -0.02 || t.y < -0.02 || t.x + t.w > GRID_N + 0.02 || t.y + t.h > GRID_N + 0.02) {
      outOfBoundsIds.push(t.id);
    }
  }
  const overlapPairs = [];
  const overlapIds = new Set();
  for (let i = 0; i < state.tiles.length; i++) {
    for (let j = i + 1; j < state.tiles.length; j++) {
      const a = state.tiles[i];
      const b = state.tiles[j];
      const eps = 0.04;
      const hitX = a.x < b.x + b.w - eps && a.x + a.w > b.x + eps;
      const hitY = a.y < b.y + b.h - eps && a.y + a.h > b.y + eps;
      if (hitX && hitY) {
        overlapPairs.push([a.id, b.id]);
        overlapIds.add(a.id);
        overlapIds.add(b.id);
      }
    }
  }
  const alignOk = offGridIds.length === 0 && overlapPairs.length === 0 && outOfBoundsIds.length === 0;

  // 4. 模块平衡与跨格层级（防瓷砖墙、防过满/过空、防重心倾覆）
  const areas = state.tiles.map((t) => t.w * t.h);
  const maxArea = Math.max(...areas);
  const minArea = Math.min(...areas);
  const scaleRatio = maxArea / Math.max(1, minArea);
  const totalCells = areas.reduce((s, a) => s + a, 0);
  const coverage = totalCells / (GRID_N * GRID_N);
  const whitespace = Math.max(0, 1 - coverage);

  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  for (const t of state.tiles) {
    const w = visualWeight(t);
    sumW += w;
    sumWX += w * (t.x + t.w / 2);
    sumWY += w * (t.y + t.h / 2);
  }
  const comX = sumW > 0 ? sumWX / sumW : GRID_N / 2;
  const comY = sumW > 0 ? sumWY / sumW : GRID_N / 2;
  const offsetNormX = (comX - GRID_N / 2) / (GRID_N / 2);
  const offsetNormY = (comY - GRID_N / 2) / (GRID_N / 2);
  const balanceOffset = Math.hypot(offsetNormX, offsetNormY); // 0 = 居中，1 = 顶到边缘

  const isTileWall = scaleRatio < 1.8 || maxArea < 4;
  const isOverpacked = coverage > 0.76;
  const isTooSparse = coverage < 0.2;
  const isLopsided = balanceOffset > 0.28;
  const balanceOk = !isTileWall && !isOverpacked && !isTooSparse && !isLopsided;

  const passedCount = [unitOk, balanceOk, gutterOk, alignOk].filter(Boolean).length;

  // 按严重优先级定位当前主诊单（9 类真实错态 + 达标）
  let statusCode = "ok";
  let badge = `${passedCount} / 4 待校准`;
  let headline = "";
  let why = "";
  let nextHint = "";

  if (!unitOk && unitIssue === "flat") {
    statusCode = "flat";
    badge = `错态 · 扁格 ${aspect.toFixed(2)}:1（${passedCount}/4）`;
    headline = `单元格被拉扁成 ${aspect.toFixed(2)} : 1，双轴通用尺失效`;
    why = `方格网格的底线是宽高 1:1。现在横边比竖边宽出 ${Math.round((aspect - 1) * 100)}%，圆标被压成扁椭圆，横向跨 2 格与纵向跨 2 格不再等长，版面失去几何同步感。`;
    nextHint = "在 8×8 画布空白处向左横拖（或拖画布下方的「单元」滑杆），把单格拉回 1.00 : 1 正方形。";
  } else if (!unitOk && unitIssue === "tall") {
    statusCode = "tall";
    badge = `错态 · 瘦格 ${aspect.toFixed(2)}:1（${passedCount}/4）`;
    headline = `单元格被挤瘦成 ${aspect.toFixed(2)} : 1，退化成竖栏切片`;
    why = `单格高度明显大于宽度，横竖刻度不再通用。图标和模块在竖向被拉长，失去了方格网格特有的平稳与无方向偏向。`;
    nextHint = "在画布空白处向右横拖（或点「归正 1:1」），把单元格拉回 1.00 : 1。";
  } else if (!gutterOk && gutterUneven) {
    statusCode = "gutterUneven";
    badge = `错态 · 横竖缝不等（${passedCount}/4）`;
    headline = `列缝 ${gm.gx}u、行缝 ${gm.gy}u 不相等，跨格模块底边错台`;
    why = "方格网格靠横竖等缝维持双轴节奏。横向宽、纵向挤时，一块 2×2 模块实际宽出两条不同的缝，放进页面就会显得横松竖堵，视觉秩序立刻散掉。";
    nextHint = "在画布下方图例控条里把「间距」切到「无缝 0」、「1/4 格等缝」或「1/2 格宽缝」。";
  } else if (!gutterOk && gutterTooWide) {
    statusCode = "gutterWide";
    badge = `错态 · 缝宽散架（${passedCount}/4）`;
    headline = `缝隙宽达 ${gm.gx} 倍单元，网格被撕成零散孤岛`;
    why = "缝隙超过半个单元格时，空白通道的视觉存在感反而压过内容块本身，相邻模块失去了「同属一套网格」的呼吸连接。";
    nextHint = "把「间距」收回「1/4 格等缝」、「1/2 格宽缝」或「无缝 0」。";
  } else if (overlapPairs.length > 0) {
    statusCode = "overlap";
    badge = `错态 · 模块压叠（${passedCount}/4）`;
    headline = `有 ${overlapPairs.length} 处模块互相压叠，网格边界被撞破`;
    why = "方格网格的核心价值是边界互不侵犯。两块内容叠在同一批单元里时，信息层级打架，网格也就形同虚设。";
    nextHint = "直接拖开红框高亮的压叠模块，让每块独占自己的完整方格区域。";
  } else if (offGridIds.length > 0 || outOfBoundsIds.length > 0) {
    statusCode = "offGrid";
    badge = `错态 · 脱轨 ${offGridIds.length + outOfBoundsIds.length} 块（${passedCount}/4）`;
    headline = `有 ${offGridIds.length + outOfBoundsIds.length} 块元素飘在半格上，没咬住绿色交点`;
    why = "元素差半格不贴齐网格线，人眼会立刻察觉边缘发虚、排不齐——就像贴瓷砖贴歪了半指，越规整的方格底网，越放大那一点脱轨。";
    nextHint = "拖住带红框虚线的模块，靠近整格绿交点松手即可自动吸附归位（或点「一键齐交点」）。";
  } else if (isTileWall) {
    statusCode = "tileWall";
    badge = `错态 · 瓷砖平权（${passedCount}/4）`;
    headline = `所有模块尺度太接近（最大/最小仅 ${scaleRatio.toFixed(1)}×），像均质瓷砖墙`;
    why = "规整的 1×1 方格只是骨架，不是终点。若所有内容都挤在同样大小的格子里，眼睛找不到第一落点，画面立刻变得呆板无主次。";
    nextHint = "拖住任意模块右下角的橘红角标拉大到 2×2 或 3×3，拉出至少 2× 以上的面积差。";
  } else if (isOverpacked) {
    statusCode = "overpacked";
    badge = `错态 · 过满窒息（${passedCount}/4）`;
    headline = `模块塞满了 ${Math.round(coverage * 100)}% 画布，留白不足失去节奏`;
    why = "方格网格需要空置的单元做呼吸留白，才能凸显大块与小块的轮廓关系。填得太满时，格线和模块全糊成一堵墙。";
    nextHint = "拖小其中一两块模块的右下角角标，让留白回到 24% 以上。";
  } else if (isTooSparse) {
    statusCode = "tooSparse";
    badge = `错态 · 空旷失格（${passedCount}/4）`;
    headline = `模块仅占 ${Math.round(coverage * 100)}% 画布，撑不起 8×8 网格秩序`;
    why = "画面里只有几枚零星小块，彼此距离过远，观众看不出它们共享同一套坐标尺度。";
    nextHint = "拉大一两块核心模块的跨格尺寸，让模块面积占到画布的 22%–74%。";
  } else if (isLopsided) {
    statusCode = "lopsided";
    badge = `错态 · 重心偏斜（${passedCount}/4）`;
    headline = `视觉重心偏离网格中心 ${Math.round(balanceOffset * 100)}%（示意），版面一边倒`;
    why = "所有大块都挤在同一侧，另一侧大片空悬。方格网格靠等分和跨格配重维持平稳感，重心偏过头会让页面像要翻船。";
    nextHint = "把其中一块 2×2 或 1×1 模块拖向空白的一侧做对角配重。";
  } else {
    statusCode = "ok";
    badge = `秩序成立 · 4 / 4 达标`;
    headline = `1:1 正方、等倍缝隙、全齐交点且主次分明`;
    why = `单元严格 1.00:1，缝隙统一为 ${gm.short}，4 块模块全部咬死交点无压叠，最大/最小面积比 ${scaleRatio.toFixed(1)}×，留白 ${Math.round(whitespace * 100)}%，重心稳定。任何满足这四条规律的摆法都是正当解。`;
    nextHint = "你可以继续拖动模块试出另一套组合，或切换「海报分区 / 界面卡片」看同一骨架如何复用。";
  }

  // 四枚原海报要点徽标的实时短签
  const pointBadges = {
    unit: unitOk ? "1:1 正方" : unitIssue === "flat" ? `偏扁 ${aspect.toFixed(2)}` : `偏瘦 ${aspect.toFixed(2)}`,
    balance: balanceOk
      ? `稳 · ${scaleRatio.toFixed(1)}×`
      : isTileWall
        ? `平权 ${scaleRatio.toFixed(1)}×`
        : isLopsided
          ? `偏心 ${Math.round(balanceOffset * 100)}%`
          : isOverpacked
            ? `过满 ${Math.round(coverage * 100)}%`
            : `偏空 ${Math.round(coverage * 100)}%`,
    gutter: gutterOk ? `等缝 ${gm.short}` : gutterUneven ? "横竖不等" : `过宽 ${gm.short}`,
    align: alignOk ? "全齐 4 块" : overlapPairs.length ? `压叠 ${overlapPairs.length} 处` : `脱轨 ${offGridIds.length} 块`,
  };

  const balanceLabel =
    balanceOffset <= 0.14 ? "居中稳健" : balanceOffset <= 0.28 ? "轻偏平衡" : `偏斜 ${Math.round(balanceOffset * 100)}%`;

  return {
    aspect,
    gutter: gm,
    unitOk,
    balanceOk,
    gutterOk,
    alignOk,
    passedCount,
    statusCode,
    isOk: passedCount === 4,
    badge,
    headline,
    why,
    nextHint,
    offGridIds,
    outOfBoundsIds,
    overlapIds: [...overlapIds],
    overlapPairs,
    scaleRatio,
    coverage,
    whitespace,
    comX,
    comY,
    balanceOffset,
    balanceLabel,
    pointBadges,
  };
}
