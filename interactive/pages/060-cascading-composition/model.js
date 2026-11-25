// 060 级联构图 · 单一几何真源与诊断模型
// 开场瀑布台、02 节步距矩阵画布、所有实时读数与达标灯全部共用这一套矩形与常量

export const EMPIRICAL = {
  overlapMin: 10,      // 经验最低有效咬合面积（%）——低于此值开始断链成孤卡
  overlapMax: 34,      // 经验最高安全咬合面积（%）——高于此值容易压挤正文
  titleOccLimit: 2,    // 阅读安全区允许遮挡上限（%）——超过即判压字/吞标
  slopeMinDeg: 18,     // 经验倾泻下限角（°）——低于此值退化成横排叠卡
  slopeMaxDeg: 50,     // 经验倾泻上限角（°）——高于此值挤成竖向手风琴
  cardRatio: 1.20,     // 单卡高宽比（贴近原海报竖矩形卡片比例）
};

// 原海报五幕叙事卡（严格采用 poster-text.json 原文与原海报色序：青→蓝→青→蓝→珊瑚橘）
export const CARDS = [
  {
    id: 0,
    num: "01",
    title: "引入",
    en: "INTRODUCE",
    body: "吸引注意，建立起点。",
    color: "#0D948F",
    textColor: "#076B68",
    soft: "#D5F0EE",
    waveDark: "#0B7E7A",
    waveLight: "#2AA9A4",
    role: "视觉入口，亮出开场问题或场景，给视线落脚点。",
  },
  {
    id: 1,
    num: "02",
    title: "展开",
    en: "EXPAND",
    body: "逐步展开，丰富内容。",
    color: "#114ECE",
    textColor: "#0D41B2",
    soft: "#DCE7FC",
    waveDark: "#0E42B4",
    waveLight: "#346BE2",
    role: "顺着 01 的尾角自然接力，把主干内容层层铺开。",
  },
  {
    id: 2,
    num: "03",
    title: "深化",
    en: "DEEPEN",
    body: "深入细节，加强理解。",
    color: "#0D948F",
    textColor: "#076B68",
    soft: "#D5F0EE",
    waveDark: "#0B7E7A",
    waveLight: "#2AA9A4",
    role: "位于整条瀑布中段，用案例或数据把论点扎稳。",
  },
  {
    id: 3,
    num: "04",
    title: "过渡",
    en: "TRANSITION",
    body: "自然过渡，承上启下。",
    color: "#114ECE",
    textColor: "#0D41B2",
    soft: "#DCE7FC",
    waveDark: "#0E42B4",
    waveLight: "#346BE2",
    role: "把前段细节收拢转向结论，替终点蓄满势能。",
  },
  {
    id: 4,
    num: "05",
    title: "总结",
    en: "CONCLUDE",
    body: "收束信息，留下印象。",
    color: "#F05E40",
    textColor: "#C1391E",
    soft: "#FDE7E1",
    waveDark: "#E34B2D",
    waveLight: "#F58268",
    role: "打破青蓝交替，用暖珊瑚橘稳稳接住整条视流。",
  },
];

// 每张卡的「阅读安全区」（编号、标题、英文副标与核心短句所在区域，归一化到单卡 [0..1]×[0..1]）
// 原海报刻意把信息放左上、把装饰波浪与圆点放右下，正是为了让后卡稳压右下角而不伤正文
export const SAFE_BOX = { x0: 0.08, y0: 0.07, x1: 0.62, y1: 0.56 };

// 三档倾泻坡度：用垂直/水平比例控制斜流走向
export const SLOPES = {
  flat: {
    key: "flat",
    label: "横平",
    degHint: "约 8°",
    // 在任意 spread 下，步距向量偏向水平
    ratioY: 0.14,
    xScale: 1.08,
  },
  cascade: {
    key: "cascade",
    label: "斜瀑",
    degHint: "约 34°",
    ratioY: 0.61,
    xScale: 1.0,
  },
  steep: {
    key: "steep",
    label: "陡叠",
    degHint: "约 62°",
    ratioY: 1.62,
    xScale: 0.46,
  },
};

// 开场初始错态（非答案）：
// 1. 序列打乱为 01 → 03 → 02 → 05 → 04（两处回头折返）
// 2. 叠向反置为 reverse（前卡压后卡，直接盖掉后卡左上编号与标题）
// 3. 步距收得过紧（spread 0.24，交叠偏深）
export const INITIAL_BROKEN = {
  order: [0, 2, 1, 4, 3],
  spread: 0.24,
  zDir: "reverse", // "forward" = 后卡压前卡（顺流），"reverse" = 前卡压后卡（反叠吞字）
  slope: "cascade",
};

export const REFERENCE_IDEAL = {
  order: [0, 1, 2, 3, 4],
  spread: 0.48,
  zDir: "forward",
  slope: "cascade",
};

// 从同一几何模型算出当前坡度下，满足「零遮字 + 经验交叠甜区」的 spread 起止区间（用于渲染游标轨甜区色带）
export function sweetSpreadRange(slopeKey = "cascade") {
  let lo = null;
  let hi = null;
  for (let i = 0; i <= 100; i++) {
    const s = i / 100;
    const res = evaluateCascade({ order: [0, 1, 2, 3, 4], spread: s, zDir: "forward", slope: slopeKey });
    if (res.passes.continuity) {
      if (lo === null) lo = s;
      hi = s;
    }
  }
  return lo === null ? { lo: 0.36, hi: 0.62 } : { lo, hi };
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 把 spread (0..1) 与 slope 换算成单卡单位下的相邻步距 (stepX, stepY)
// stepX = 1 表示两卡左右刚好相切、零横向重叠；stepX = 0.68 表示横向咬合 32%
export function stepFromState(spread, slopeKey = "cascade") {
  const s = clamp(spread, 0, 1);
  const cfg = SLOPES[slopeKey] || SLOPES.cascade;
  // 横向基线从 0.34（极紧压死）平滑扫到 1.12（彻底断链）
  const base = 0.34 + s * 0.78;
  const stepX = base * cfg.xScale;
  const stepY = (base * cfg.ratioY) / EMPIRICAL.cardRatio;
  return { stepX, stepY };
}

// 两个轴对齐矩形的交集矩形与面积
export function rectIntersect(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  const w = Math.max(0, x1 - x0);
  const h = Math.max(0, y1 - y0);
  return { x: x0, y: y0, w, h, area: w * h };
}

// 核心单真源计算：传入状态（或直接传入自定义 stepX/stepY 供 02 节使用），返回全部卡片几何与诊断结果
export function evaluateCascade(input) {
  const order = input.order || [0, 1, 2, 3, 4];
  const zDir = input.zDir || "forward";
  const slope = input.slope || "cascade";
  const { stepX, stepY } =
    typeof input.stepX === "number" && typeof input.stepY === "number"
      ? { stepX: input.stepX, stepY: input.stepY }
      : stepFromState(input.spread ?? 0.6, slope);

  const cardW = 1.0;
  const cardH = EMPIRICAL.cardRatio;

  // 在单卡坐标系下生成 5 个槽位的真实矩形
  const slots = order.map((cardId, slotIndex) => {
    const x = slotIndex * stepX;
    const y = slotIndex * stepY * cardH;
    const z = zDir === "forward" ? slotIndex : 4 - slotIndex;
    const safe = {
      x: x + SAFE_BOX.x0 * cardW,
      y: y + SAFE_BOX.y0 * cardH,
      w: (SAFE_BOX.x1 - SAFE_BOX.x0) * cardW,
      h: (SAFE_BOX.y1 - SAFE_BOX.y0) * cardH,
    };
    return {
      slotIndex,
      cardId,
      card: CARDS[cardId],
      x,
      y,
      w: cardW,
      h: cardH,
      z,
      safe,
      cx: x + cardW * 0.5,
      cy: y + cardH * 0.5,
    };
  });

  const bounds = {
    x: 0,
    y: 0,
    w: cardW + 4 * stepX,
    h: cardH + 4 * stepY * cardH,
  };

  // 1. 相邻槽位交叠面积占比（%）
  const cardArea = cardW * cardH;
  const adjacentOverlaps = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const inter = rectIntersect(slots[i], slots[i + 1]);
    adjacentOverlaps.push({
      fromSlot: i,
      toSlot: i + 1,
      rect: inter,
      pct: (inter.area / cardArea) * 100,
    });
  }
  const overlapPct =
    adjacentOverlaps.reduce((acc, o) => acc + o.pct, 0) / adjacentOverlaps.length;

  // 2. 真实阅读安全区遮挡测量：检查所有 z 更高的卡是否盖住了低 z 卡的 safe box
  const safeArea = (SAFE_BOX.x1 - SAFE_BOX.x0) * cardW * (SAFE_BOX.y1 - SAFE_BOX.y0) * cardH;
  const occlusions = [];
  let maxTitleOccPct = 0;
  let totalTitleOccPct = 0;
  let occludedCardCount = 0;

  for (let i = 0; i < slots.length; i++) {
    const under = slots[i];
    let cardOccArea = 0;
    const boxes = [];
    for (let j = 0; j < slots.length; j++) {
      if (i === j || slots[j].z <= under.z) continue;
      const hit = rectIntersect(under.safe, slots[j]);
      if (hit.area > 1e-5) {
        cardOccArea = Math.min(safeArea, cardOccArea + hit.area);
        boxes.push(hit);
      }
    }
    const pct = (cardOccArea / safeArea) * 100;
    if (pct > 0.5) occludedCardCount++;
    if (pct > maxTitleOccPct) maxTitleOccPct = pct;
    totalTitleOccPct += pct;
    if (boxes.length) {
      occlusions.push({ slotIndex: i, cardId: under.cardId, pct, boxes });
    }
  }
  const avgTitleOccPct = totalTitleOccPct / slots.length;

  // 3. 叙事路径折返测量：按 01→02→03→04→05 逻辑顺位走一遍
  const byNarrative = [];
  for (let id = 0; id < 5; id++) {
    byNarrative.push(slots.find((s) => s.cardId === id));
  }
  const hops = [];
  let backtrackCount = 0;
  let skipJumpCount = 0;
  for (let id = 0; id < 4; id++) {
    const a = byNarrative[id];
    const b = byNarrative[id + 1];
    const deltaSlot = b.slotIndex - a.slotIndex;
    const isBack = deltaSlot < 0;
    const isSkip = deltaSlot > 1;
    if (isBack) backtrackCount++;
    if (isSkip) skipJumpCount++;
    hops.push({
      fromId: id,
      toId: id + 1,
      fromSlot: a.slotIndex,
      toSlot: b.slotIndex,
      from: a,
      to: b,
      isBack,
      isSkip,
    });
  }
  const orderCorrect = order.every((id, idx) => id === idx);

  // 4. 真实斜流倾角（°）
  const slopeDeg = (Math.atan2(stepY * cardH, Math.max(stepX, 1e-4)) * 180) / Math.PI;

  // 5. 四枚原海报关键词达标判定（全部来自真实几何计算）
  const passFlow = zDir === "forward" && maxTitleOccPct <= EMPIRICAL.titleOccLimit;
  const passSequence = orderCorrect && backtrackCount === 0;
  const passRhythm =
    slopeDeg >= EMPIRICAL.slopeMinDeg && slopeDeg <= EMPIRICAL.slopeMaxDeg;
  const passContinuity =
    overlapPct >= EMPIRICAL.overlapMin &&
    overlapPct <= EMPIRICAL.overlapMax &&
    maxTitleOccPct <= EMPIRICAL.titleOccLimit;

  const passedCount = [passFlow, passSequence, passRhythm, passContinuity].filter(Boolean).length;

  // 6. 严格优先级单报主错（一次讲清最根源的一条视觉问题和成因）
  let status = "ok";
  let badge = "4/4 顺流成立";
  let headline = "五幕卡顺流递进，标题零遮挡，视线直落珊瑚收束潭";
  let explain =
    `相邻压边约 ${Math.round(overlapPct)}%（经验甜区 ${EMPIRICAL.overlapMin}–${EMPIRICAL.overlapMax}%），倾泻角 ${Math.round(slopeDeg)}° 顺应阅读重力；每张新卡只咬住前卡右下波浪装饰角，01→05 一气呵成。`;

  if (zDir === "reverse" && maxTitleOccPct > EMPIRICAL.titleOccLimit) {
    status = "error";
    badge = "错态 · 反叠吞字";
    headline = `前卡反压后卡，吞掉了 ${occludedCardCount} 张卡的左上标题（最高遮挡 ${Math.round(maxTitleOccPct)}%）`;
    explain =
      "前一张卡的右下角直接压在下一幕的编号与标题上，读完上一步找不到下一步入口。先把叠压朝向切到「后卡压前卡」，让每张新卡从前卡尾角探出头。";
  } else if (!orderCorrect) {
    status = "error";
    badge = `错态 · 折返 ${backtrackCount} 处`;
    headline = `01→05 叙事路径与斜流打架，视线被迫回头折返 ${backtrackCount} 次`;
    explain =
      "级联构图靠位置顺流替读者省去「找下一条」的成本；编号乱序会让虚线路径打结。点击舞台上的两张卡互换位置，或在五幕槽里理顺成 01→02→03→04→05。";
  } else if (maxTitleOccPct > EMPIRICAL.titleOccLimit || overlapPct > EMPIRICAL.overlapMax) {
    status = "error";
    badge = "错态 · 过紧压文";
    headline = `相邻交叠达 ${Math.round(overlapPct)}%，后卡已压进前卡文字安全区（遮字 ${Math.round(maxTitleOccPct)}%）`;
    explain =
      `步距收得太紧时，下一张卡会吃掉前一张的正文边界，画面发堵。把步距轨往右推，把交叠压回经验甜区 ${EMPIRICAL.overlapMin}–${EMPIRICAL.overlapMax}%，只压装饰角、不碰文字区。`;
  } else if (overlapPct < EMPIRICAL.overlapMin) {
    status = "warn";
    badge = "错态 · 断链散卡";
    headline = `相邻交叠仅 ${Math.round(overlapPct)}%，瀑布咬合断开成五张孤立浮卡`;
    explain =
      `低于经验咬合下限 ${EMPIRICAL.overlapMin}% 时，卡片之间失去「谁接住谁」的视觉搭扣，视线在白缝里停顿。把步距轨往左收回，让后卡重新咬住前卡右下装饰角。`;
  } else if (slopeDeg < EMPIRICAL.slopeMinDeg) {
    status = "warn";
    badge = "错态 · 坡度过平";
    headline = `倾泻角仅 ${Math.round(slopeDeg)}°，退化成横向平排叠卡`;
    explain =
      `缺少自上而下的纵深落差，画面像一排并列书脊，失去了「瀑布自然落下」的流动势能。切到「斜瀑」坡度（经验 ${EMPIRICAL.slopeMinDeg}–${EMPIRICAL.slopeMaxDeg}°）。`;
  } else if (slopeDeg > EMPIRICAL.slopeMaxDeg) {
    status = "warn";
    badge = "错态 · 坡度过陡";
    headline = `倾泻角达 ${Math.round(slopeDeg)}°，挤成竖向手风琴堆叠`;
    explain =
      `横向展开几乎归零，五幕内容上下紧压，少了从左向右推进的叙事呼吸。把坡度放缓到「斜瀑」区间（经验 ${EMPIRICAL.slopeMinDeg}–${EMPIRICAL.slopeMaxDeg}°）。`;
  } else if (zDir === "reverse") {
    status = "warn";
    badge = "错态 · 叠向倒置";
    headline = "当前仍是前卡在最前，结尾 05 总结被压在最底层";
    explain =
      "即使暂时拉开了间距，前卡居前的 Z 序也会让视觉重心留在起点而非收束点。切到「后卡压前卡」，把最前端舞台留给 05 总结。";
  }

  return {
    slots,
    bounds,
    stepX,
    stepY,
    overlapPct,
    maxTitleOccPct,
    avgTitleOccPct,
    occludedCardCount,
    occlusions,
    adjacentOverlaps,
    hops,
    backtrackCount,
    skipJumpCount,
    orderCorrect,
    slopeDeg,
    zDir,
    passes: {
      flow: passFlow,
      sequence: passSequence,
      rhythm: passRhythm,
      continuity: passContinuity,
    },
    passedCount,
    status,
    badge,
    headline,
    explain,
  };
}

// 给定绘制视口 (w, h) 与留白，把归一化单卡坐标系映射到像素坐标（保持卡片等比，永不裁边）
export function projectSlotsToCanvas(evalRes, viewW, viewH, pad = { l: 28, r: 28, t: 28, b: 28 }) {
  const innerW = Math.max(80, viewW - pad.l - pad.r);
  const innerH = Math.max(80, viewH - pad.t - pad.b);

  // 基准尺寸锚定在标准斜瀑跨度上，防止收紧步距时卡片反向暴涨
  const baseCardW = Math.min(innerW / 3.85, innerH / 2.95);
  const rawW = evalRes.bounds.w * baseCardW;
  const rawH = evalRes.bounds.h * baseCardW;
  const fit = Math.min(1, innerW / Math.max(rawW, 1), innerH / Math.max(rawH, 1));
  const scale = baseCardW * fit;

  const chainW = evalRes.bounds.w * scale;
  const chainH = evalRes.bounds.h * scale;
  const originX = pad.l + (innerW - chainW) * 0.5;
  const originY = pad.t + (innerH - chainH) * 0.5;

  const mapRect = (r) => ({
    x: originX + r.x * scale,
    y: originY + r.y * scale,
    w: r.w * scale,
    h: r.h * scale,
  });

  const pxSlots = evalRes.slots.map((s) => ({
    ...s,
    px: mapRect(s),
    safePx: mapRect(s.safe),
    cxPx: originX + s.cx * scale,
    cyPx: originY + s.cy * scale,
  }));

  const pxOcclusions = evalRes.occlusions.map((o) => ({
    ...o,
    boxesPx: o.boxes.map(mapRect),
  }));

  const pxOverlaps = evalRes.adjacentOverlaps.map((o) => ({
    ...o,
    rectPx: mapRect(o.rect),
  }));

  return {
    scale,
    originX,
    originY,
    chainW,
    chainH,
    pxSlots,
    pxOcclusions,
    pxOverlaps,
  };
}
