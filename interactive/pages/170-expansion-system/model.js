// 170 扩张系统 · 单真源几何与排印评估模型
// 画布绘制、体检列、右翼引线卡、底框原则灯、白话诊单全部共用本模块同一组实测值。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·同心扩张",
    shortLabel: "原海报",
    coreZh: "核心",
    coreEn: "CORE",
    rings: [
      { top: "扩散 · EXPAND", bottom: "从中心向外传递能量", tag: "第一环·扩散", en: "EXPAND" },
      { top: "外延 · OUTWARD", bottom: "突破边界延伸结构连接", tag: "第二环·外延", en: "OUTWARD" },
      { top: "层级增长 · GROWTH", bottom: "分层递进逐级放大强化", tag: "第三环·增长", en: "GROWTH" },
      { top: "覆盖范围 · RANGE", bottom: "扩大影响半径形成系统覆盖", tag: "第四环·覆盖", en: "RANGE" },
      { top: "生态外圈 · ECOSYSTEM", bottom: "开放连接协同持续延展", tag: "第五环·外圈", en: "ECO" },
      { top: "过密边界 · OVERFLOW", bottom: "过多圈层互相干扰难以聚焦", tag: "第六环·过载", en: "LIMIT" },
    ],
  },
  vinyl: {
    id: "vinyl",
    label: "品牌生态·黑胶标牌",
    shortLabel: "黑胶生态",
    coreZh: "声核",
    coreEn: "MONO LAB",
    rings: [
      { top: "母带厂牌 · MASTER", bottom: "独立声景发行核心", tag: "第一环·厂牌", en: "MASTER" },
      { top: "黑胶专辑 · VINYL 33", bottom: "十二寸限量压片系列", tag: "第二环·产品", en: "VINYL" },
      { top: "现场巡演 · LIVE TOUR", bottom: "八城小型声学空间演出", tag: "第三环·现场", en: "LIVE" },
      { top: "听众社群 · ARCHIVE", bottom: "开源采样库与联名电台", tag: "第四环·社群", en: "ARCHIVE" },
      { top: "衍生周边 · EDITION", bottom: "书册画报与便携唱机", tag: "第五环·周边", en: "EDITION" },
      { top: "冗余支线 · CLUTTER", bottom: "支线过杂冲淡厂牌识别", tag: "第六环·冗余", en: "CLUTTER" },
    ],
  },
  garden: {
    id: "garden",
    label: "城市圈层·田园都市",
    shortLabel: "田园都市",
    coreZh: "中园",
    coreEn: "CENTRAL PARK",
    rings: [
      { top: "市政公建 · CIVIC", bottom: "市政厅图书馆与音乐厅", tag: "第一环·公建", en: "CIVIC" },
      { top: "水晶拱廊 · ARCADE", bottom: "环形玻璃温室与商业长廊", tag: "第二环·拱廊", en: "ARCADE" },
      { top: "林荫住区 · AVENUE", bottom: "花园住宅与学校教堂林带", tag: "第三环·住区", en: "AVENUE" },
      { top: "铁道绿带 · GREENBELT", bottom: "环形货运铁道与永久农田", tag: "第四环·绿带", en: "BELT" },
      { top: "卫星城群 · CLUSTER", bottom: "轨道串联多座田园卫星城", tag: "第五环·城群", en: "CLUSTER" },
      { top: "无序蔓延 · SPRAWL", bottom: "突破绿带后通勤与边界失控", tag: "第六环·蔓延", en: "SPRAWL" },
    ],
  },
};

export const LAWS = {
  tight: { id: "tight", label: "倒缩失律(错)", short: "倒缩(错)" },
  linear: { id: "linear", label: "等差递进", short: "等差" },
  geo: { id: "geo", label: "等比扩张", short: "等比" },
  fib: { id: "fib", label: "斐波那契", short: "斐波那契" },
};

export const BRIDGES = {
  none: { id: "none", label: "断环孤岛(错)", count: 0 },
  quad: { id: "quad", label: "四向骨架", count: 4 },
  octa: { id: "octa", label: "原海报八向", count: 8 },
  dendrite: { id: "dendrite", label: "错位树突", count: 6 },
};

// 开场刻意停在 0/4 复合错态：倒缩挤环 + 5 圈缩聚 + 下弧倒立 + 断环孤岛
export const INITIAL_STATE = {
  scene: "poster",
  law: "tight",
  ratio: 1.15,
  rings: 5,
  corePct: 0.23,
  bridges: "none",
  bottomFlip: false,
  arcOffsetDeg: 0,
  focusRing: -1,
  showGuides: true,
};

export const PRESETS = {
  initial: {
    id: "initial",
    label: "复原开场错态",
    kind: "reset",
    patch: { law: "tight", ratio: 1.15, rings: 5, corePct: 0.23, bridges: "none", bottomFlip: false, arcOffsetDeg: 0, focusRing: -1 },
  },
  posterOk: {
    id: "posterOk",
    label: "原海报四圈解",
    kind: "good",
    patch: { law: "linear", ratio: 1.42, rings: 4, corePct: 0.21, bridges: "octa", bottomFlip: true, arcOffsetDeg: 0, focusRing: -1 },
  },
  goldenOk: {
    id: "goldenOk",
    label: "黄金三圈解",
    kind: "good",
    patch: { law: "geo", ratio: 1.55, rings: 3, corePct: 0.22, bridges: "quad", bottomFlip: true, arcOffsetDeg: 0, focusRing: -1 },
  },
  dendriteOk: {
    id: "dendriteOk",
    label: "等比树突解",
    kind: "good",
    patch: { law: "geo", ratio: 1.43, rings: 4, corePct: 0.21, bridges: "dendrite", bottomFlip: true, arcOffsetDeg: 0, focusRing: -1 },
  },
  errOverflow: {
    id: "errOverflow",
    label: "试错：外环爆框",
    kind: "bad",
    patch: { law: "geo", ratio: 1.58, rings: 4, corePct: 0.24, bridges: "octa", bottomFlip: true, arcOffsetDeg: 0, focusRing: -1 },
  },
  errTinyCore: {
    id: "errTinyCore",
    label: "试错：内核萎缩",
    kind: "bad",
    patch: { law: "linear", ratio: 1.42, rings: 4, corePct: 0.10, bridges: "octa", bottomFlip: true, arcOffsetDeg: 0, focusRing: -1 },
  },
  errSixRings: {
    id: "errSixRings",
    label: "试错：六圈眩晕",
    kind: "bad",
    patch: { law: "linear", ratio: 1.30, rings: 6, corePct: 0.18, bridges: "octa", bottomFlip: true, arcOffsetDeg: 0, focusRing: -1 },
  },
};

export function clampState(s) {
  return {
    ...s,
    ratio: Math.max(1.08, Math.min(1.62, Number(s.ratio) || 1.15)),
    rings: Math.max(2, Math.min(6, Math.round(Number(s.rings) || 4))),
    corePct: Math.max(0.09, Math.min(0.40, Number(s.corePct) || 0.21)),
    arcOffsetDeg: Math.max(-90, Math.min(90, Math.round(Number(s.arcOffsetDeg) || 0))),
    focusRing: Number.isInteger(s.focusRing) && s.focusRing <= Math.round(s.rings) ? s.focusRing : -1,
  };
}

// 计算归一化半径序列 r[0..N]（相对 R_safe = 1.0）
export function computeRingRadii(state) {
  const { law, ratio, rings, corePct } = clampState(state);
  const radii = [corePct];
  if (law === "geo") {
    for (let i = 1; i <= rings; i++) {
      radii.push(corePct * Math.pow(ratio, i));
    }
  } else if (law === "linear") {
    const step = corePct * (ratio - 1) * 1.82;
    for (let i = 1; i <= rings; i++) {
      radii.push(corePct + i * step);
    }
  } else if (law === "fib") {
    const fib = [1, 1.15, 1.55, 2.25, 3.25, 4.6];
    const base = corePct * (ratio - 1) * 1.18;
    let acc = corePct;
    for (let i = 1; i <= rings; i++) {
      acc += base * fib[i - 1];
      radii.push(acc);
    }
  } else {
    // tight: 越往外环距反倒越窄（层级倒挂）
    const firstStep = corePct * (ratio - 1) * 2.15;
    let acc = corePct;
    for (let i = 1; i <= rings; i++) {
      acc += firstStep * Math.pow(0.74, i - 1);
      radii.push(acc);
    }
  }
  return radii;
}

// 估算一段弧形排字的几何展角（弧度）与每字转角（度）
export function measureArcString(str, radiusPx, fontSizePx) {
  let units = 0;
  for (const ch of str) {
    units += ch.charCodeAt(0) > 127 ? 1.06 : ch === " " ? 0.42 : 0.64;
  }
  const charCount = Math.max(1, [...str].length);
  const tracking = fontSizePx * 0.14;
  const arcLenPx = units * fontSizePx + Math.max(0, charCount - 1) * tracking;
  const safeR = Math.max(12, radiusPx);
  const spanRad = arcLenPx / safeR;
  const spanDeg = (spanRad * 180) / Math.PI;
  const degPerChar = spanDeg / charCount;
  return { arcLenPx, spanRad, spanDeg, degPerChar, charCount };
}

// 单真源全面评估：同时输出几何体（供 Canvas 直接绘制）与全部诊断/状态灯/白话建议
export function evaluateExpansion(rawState, stageW = 620, stageH = 560) {
  const state = clampState(rawState);
  const scene = SCENES[state.scene] || SCENES.poster;
  const cx = stageW * 0.5;
  const cy = stageH * 0.5;
  const rCanvas = Math.min(stageW, stageH) * 0.5;
  const rSafe = rCanvas * 0.885;

  const normRadii = computeRingRadii(state);
  const coreR = normRadii[0] * rSafe;
  const outerNorm = normRadii[normRadii.length - 1];
  const outerR = outerNorm * rSafe;

  // 各环详细信息
  const rings = [];
  let minGapNorm = Infinity;
  let maxGapNorm = 0;
  let worstDegPerChar = 0;
  let worstSpanPct = 0;
  let tightestRingIndex = 1;

  for (let i = 1; i <= state.rings; i++) {
    const rNorm = normRadii[i];
    const prevNorm = normRadii[i - 1];
    const gapNorm = rNorm - prevNorm;
    const rPx = rNorm * rSafe;
    const prevPx = prevNorm * rSafe;
    const gapPx = rPx - prevPx;
    // 文字轨道位于本圈与内圈之间的偏外侧，避免撞到节点圈
    const textRadiusPx = prevPx + gapPx * 0.54;
    const fontSize = Math.max(10.5, Math.min(14.5, rSafe * 0.044 + (i - 1) * 0.45));
    const item = scene.rings[i - 1];
    const topArc = measureArcString(item.top, textRadiusPx, fontSize);
    const botArc = measureArcString(item.bottom, textRadiusPx, fontSize * 0.88);
    const spanPct = Math.max(topArc.spanDeg, botArc.spanDeg) / 180;

    if (gapNorm < minGapNorm) {
      minGapNorm = gapNorm;
      tightestRingIndex = i;
    }
    if (gapNorm > maxGapNorm) maxGapNorm = gapNorm;
    if (topArc.degPerChar > worstDegPerChar) worstDegPerChar = topArc.degPerChar;
    if (spanPct > worstSpanPct) worstSpanPct = spanPct;

    // 该圈节点个数（随层级自然递增，复刻原海报由内而外加密的节奏）
    const nodeCount = state.bridges === "quad" ? 4 * (i <= 2 ? 1 : 2) : i === 1 ? 8 : i === 2 ? 12 : i === 3 ? 16 : 20;
    const ringArea = Math.PI * (rNorm * rNorm - prevNorm * prevNorm);
    const coreArea = Math.PI * normRadii[0] * normRadii[0];

    rings.push({
      index: i,
      rNorm,
      prevNorm,
      gapNorm,
      rPx,
      prevPx,
      gapPx,
      textRadiusPx,
      fontSize,
      topText: item.top,
      bottomText: item.bottom,
      tag: item.tag,
      en: item.en,
      topArc,
      botArc,
      spanPct,
      nodeCount,
      areaVsCore: ringArea / Math.max(0.001, coreArea),
      crushed: gapNorm < 0.084,
      overflowed: rNorm > 1.02,
      steepArc: topArc.degPerChar > 19.5 || spanPct > 0.86,
    });
  }

  const firstGap = rings[0]?.gapNorm || 0;
  const lastGap = rings[rings.length - 1]?.gapNorm || 0;
  const growthSlope = firstGap > 0 ? lastGap / firstGap : 1;

  // 外缘安全留白占画布半径百分比（负数表示已冲出安全边界）
  const outerMarginPct = Math.round(((1.02 - outerNorm) / 1.02) * 100);
  const minGapPx = Math.round(minGapNorm * rSafe);

  // 7 类双向真实错态检测
  const errors = [];
  if (outerNorm > 1.02) {
    errors.push({
      id: "overflow",
      severity: 100,
      badge: `溢边 +${Math.round((outerNorm - 1.0) * 100)}%`,
      title: `最外第 ${state.rings} 环冲出画框边界（半径达安全界 ${Math.round(outerNorm * 100)}%）`,
      why: `当前扩张倍率 ${state.ratio.toFixed(2)}× 配 ${state.rings} 圈层，外环已经撞破画幅外缘。扩张系统讲究「扩展边界但留出系统覆盖余地」，一旦最外环被画框生硬切断，扩张感就变成了窒息的胀满。`,
      action: "向左横拖画布收小扩张倍率，或把圈层数减至 3–4 圈。",
      fixLabel: "收进安全边界",
      fixPatch: { ratio: Math.max(1.32, +(state.ratio - 0.16).toFixed(2)), rings: Math.min(state.rings, 4) },
    });
  }
  if (state.corePct < 0.14) {
    errors.push({
      id: "tinyCore",
      severity: 95,
      badge: `内核偏弱 ${Math.round(state.corePct * 100)}%`,
      title: `中心内核缩至 ${Math.round(state.corePct * 100)}%，外环反客为主压垮起点`,
      why: "扩张系统的第一条原则是「由内而外」：眼睛必须先稳稳落进中心核心，再往外一圈圈扩散。现在内核只剩一个小点，周围大环的重量完全盖过了起点，读者不知道该从哪看起。",
      action: "把内核占比调回 18%–26%，让中心酸柠核盘重新压住阵脚。",
      fixLabel: "恢复内核至 21%",
      fixPatch: { corePct: 0.21 },
    });
  } else if (state.corePct > 0.33) {
    errors.push({
      id: "bloatedCore",
      severity: 92,
      badge: `内核过胖 ${Math.round(state.corePct * 100)}%`,
      title: `内核膨胀至 ${Math.round(state.corePct * 100)}%，把外圈生长空间全挤没了`,
      why: "中心圆盘占掉了三分之一以上的半径，留给外扩圈层的走廊变得极其逼仄。扩张不是把中心吹成大气球，而是让中心把能量一层层交接给外环。",
      action: "把内核占比收回 18%–26%，腾出清晰的环带梯度。",
      fixLabel: "收紧内核至 21%",
      fixPatch: { corePct: 0.21 },
    });
  }
  if (minGapNorm < 0.084 || state.law === "tight") {
    errors.push({
      id: "ringCrush",
      severity: 90,
      badge: state.law === "tight" ? "层级倒缩" : `挤环 ${minGapPx}px`,
      title:
        state.law === "tight"
          ? `扩张律呈倒缩态（外环步距仅内环的 ${Math.round(growthSlope * 100)}%），第 ${tightestRingIndex} 环挤撞成团`
          : `第 ${tightestRingIndex} 环净空仅 ${minGapPx}px，弧形文字与节点互相贴撞`,
      why: "越往外圈，周长增大、承载信息更多，环间净空至少应保持平稳或逐级舒展。现在环带越扩越瘪，上下两圈的弧字贴在一起，眼睛根本分不清哪句属于哪一层。",
      action: "把扩张律切为「等差递进」或「等比扩张」，并向右横拖画布拉开环距。",
      fixLabel: "切等差递进并拉开",
      fixPatch: { law: "linear", ratio: 1.42, rings: Math.min(state.rings, 4) },
    });
  }
  if (!state.bottomFlip) {
    errors.push({
      id: "bottomUpsideDown",
      severity: 85,
      badge: "下弧倒立",
      title: "下半圈弧形文字头朝下倒立，阅读被迫逆向拧脖子",
      why: "圆环排字最容易踩的坑，就是让整圈文字沿顺时针一路绕到底部——上半圈从左到右顺读，下半圈却变成了从右往左倒挂。读者看下半圈必须歪头，体验瞬间打断。",
      action: "开启「下弧翻正」，让下半圈文字基线翻转、保持从左向右顺读。",
      fixLabel: "一键翻正下弧",
      fixPatch: { bottomFlip: true },
    });
  }
  if (state.bridges === "none") {
    errors.push({
      id: "disconnected",
      severity: 80,
      badge: "断环孤岛",
      title: "同心环之间缺少跨环连接，各圈退化成彼此孤立的靶环",
      why: "点击中央核心释放脉冲就能看到：没有跨环节点连线时，能量波撞到第一圈边界就会反弹回来。真正的扩张系统靠跨层连线把孤立圆圈编织成协同网络。",
      action: "开启「四向骨架」「原海报八向」或「错位树突」任意一种跨环连线。",
      fixLabel: "接入原海报八向网",
      fixPatch: { bridges: "octa" },
    });
  }
  if (state.rings >= 6) {
    errors.push({
      id: "overRings",
      severity: 76,
      badge: `${state.rings} 圈眩晕`,
      title: `叠加到 ${state.rings} 圈过密靶环，层级节奏被密集圆线淹没`,
      why: "同心圆数量一旦超过 5 圈，人眼会产生明显的靶心光学眩晕，且最内圈太窄、最外圈被挤到画框边角。实用设计里 3–4 圈是清晰层级与视觉张力的黄金区。",
      action: "把圈层数收敛到 3–4 圈，给每一层留足呼吸和辨识度。",
      fixLabel: "收敛至 4 圈层级",
      fixPatch: { rings: 4 },
    });
  } else if (state.rings <= 2) {
    errors.push({
      id: "tooFewRings",
      severity: 72,
      badge: "仅 2 圈单薄",
      title: "只有 2 层外环，尚未建立「循序递进」的扩张阶梯",
      why: "两圈结构更像普通的「中心+描边」，看不出逐级放大与层次演进的趋势。至少需要 3 圈才能让读者感知由内而外的层级步调。",
      action: "将圈层数增至 3–4 圈，建立清晰的内→中→外层级。",
      fixLabel: "扩至 3 圈阶梯",
      fixPatch: { rings: 3 },
    });
  }
  if (outerNorm < 0.64) {
    errors.push({
      id: "underExpanded",
      severity: 70,
      badge: `覆盖仅 ${Math.round(outerNorm * 100)}%`,
      title: `整体缩在中央（外环仅占安全半径 ${Math.round(outerNorm * 100)}%），扩张势能没打开`,
      why: "画面外围大片留空，所有圈层缩在靶心附近，失去了扩张系统「覆盖更大范围、形成系统影响力」的空间张力。",
      action: "向右横拖画布推高扩张倍率，把最外圈舒展到画幅的 72%–94%。",
      fixLabel: "舒展外环至 82%",
      fixPatch: { ratio: state.law === "geo" ? 1.44 : 1.42 },
    });
  }
  if (worstDegPerChar > 19.8 || worstSpanPct > 0.88) {
    errors.push({
      id: "steepArc",
      severity: 68,
      badge: `曲率 ${worstDegPerChar.toFixed(1)}°/字`,
      title: `内圈单字偏转达 ${worstDegPerChar.toFixed(1)}°/字，弧形文字弯折过急`,
      why: "圆环半径越小，每个字之间张开的扇形缝隙就越大，文字顶边裂开、底边挤压，辨认速度大幅下降。增大内核半径或拉开首圈步距才能让弧字舒展开。",
      action: "适当加大内核或推高扩张倍率，把单字转角压到 18° 以内。",
      fixLabel: "舒展首环曲率",
      fixPatch: { corePct: Math.max(0.20, state.corePct), ratio: Math.max(1.40, state.ratio) },
    });
  }

  errors.sort((a, b) => b.severity - a.severity);

  // 四项原则与四项特质单真源状态
  const passCore = state.corePct >= 0.14 && state.corePct <= 0.33 && outerNorm >= 0.64 && outerNorm <= 1.02;
  const passGrowth =
    state.rings >= 3 &&
    state.rings <= 5 &&
    minGapNorm >= 0.084 &&
    state.law !== "tight" &&
    growthSlope >= 0.90;
  const passBridge = state.bridges !== "none";
  const passArc = state.bottomFlip && worstDegPerChar <= 19.8 && worstSpanPct <= 0.88;

  const passedCount = [passCore, passGrowth, passBridge, passArc].filter(Boolean).length;
  const isSolved = passedCount === 4 && errors.length === 0;

  // 解法命名（支持多种合法解！）
  let solutionName = "待校准";
  if (isSolved) {
    if (state.law === "linear" && state.rings === 4 && state.bridges === "octa") {
      solutionName = "原海报均衡解";
    } else if (state.law === "geo" && state.rings === 3) {
      solutionName = "疏朗等比三圈解";
    } else if (state.bridges === "dendrite") {
      solutionName = "生态树突扩张解";
    } else if (state.law === "fib") {
      solutionName = "斐波那契加速解";
    } else {
      solutionName = `${state.rings} 圈平衡解`;
    }
  }

  const primaryIssue = errors[0] || null;
  const verdict = isSolved
    ? {
        ok: true,
        badge: `4/4 · ${solutionName}`,
        title: `系统成立：${solutionName}（外扩 ${Math.round(outerNorm * 100)}%，最小净空 ${minGapPx}px）`,
        why: `内核占比 ${Math.round(state.corePct * 100)}% 稳住视觉锚点，${state.rings} 圈环带按「${LAWS[state.law].short}」清晰递进、无撞环也无溢边；下半环弧字已翻正（最急 ${worstDegPerChar.toFixed(1)}°/字），跨环「${BRIDGES[state.bridges].label}」让点击核心释放的脉冲顺畅传遍最外环。`,
        action: "可以点击中央核圆放一轮脉冲验证传导，或换一套扩张律与题材探索其它合法解。",
        fixLabel: "释放核心脉冲",
        fixPatch: null,
      }
    : {
        ok: false,
        badge: `${passedCount}/4 · ${primaryIssue.badge}`,
        title: primaryIssue.title,
        why: primaryIssue.why,
        action: primaryIssue.action,
        fixLabel: primaryIssue.fixLabel,
        fixPatch: primaryIssue.fixPatch,
      };

  // 左侧原海报 4 项特质实时体检（EXPAND / OUTWARD / GROWTH / RANGE）
  const traits = [
    {
      id: "expand",
      zh: "扩散",
      en: "EXPAND",
      body: "从中心向外扩散，传递能量与价值。",
      ok: state.corePct >= 0.14 && state.corePct <= 0.33 && state.bridges !== "none",
      status:
        state.corePct < 0.14
          ? `核弱 ${Math.round(state.corePct * 100)}%`
          : state.corePct > 0.33
            ? `核肿 ${Math.round(state.corePct * 100)}%`
            : state.bridges === "none"
              ? "脉冲阻断"
              : `核稳 ${Math.round(state.corePct * 100)}%`,
      ringTarget: 0,
    },
    {
      id: "outward",
      zh: "外延",
      en: "OUTWARD",
      body: "突破边界，延伸结构与连接。",
      ok: passBridge && passArc,
      status: !passBridge ? "断环孤岛" : !state.bottomFlip ? "下弧倒立" : worstDegPerChar > 19.8 ? `曲率 ${worstDegPerChar.toFixed(0)}°` : `${BRIDGES[state.bridges].count}向连通`,
      ringTarget: Math.min(2, state.rings),
    },
    {
      id: "growth",
      zh: "层级增长",
      en: "GROWTH",
      body: "分层递进，逐级放大与强化。",
      ok: passGrowth,
      status:
        state.law === "tight"
          ? "倒缩挤环"
          : state.rings >= 6
            ? `${state.rings}圈过密`
            : state.rings <= 2
              ? "仅2圈单薄"
              : minGapNorm < 0.084
                ? `挤环 ${minGapPx}px`
                : `${state.rings}层 · ${minGapPx}px`,
      ringTarget: Math.min(3, state.rings),
    },
    {
      id: "range",
      zh: "覆盖范围",
      en: "RANGE",
      body: "覆盖更大范围，形成系统影响力。",
      ok: outerNorm >= 0.64 && outerNorm <= 1.02,
      status: outerNorm > 1.02 ? `溢边 +${Math.round((outerNorm - 1) * 100)}%` : outerNorm < 0.64 ? `缩聚 ${Math.round(outerNorm * 100)}%` : `覆盖 ${Math.round(outerNorm * 100)}%`,
      ringTarget: state.rings,
    },
  ];

  // 右翼原海报 3 枚错落引线卡实时状态
  const sideNotes = [
    {
      id: "break",
      title: "突破边界",
      body: "打破固有限制，创造新的连接。",
      ok: passBridge,
      chip: passBridge ? `${BRIDGES[state.bridges].label}` : "未建连接",
      ringTarget: Math.min(2, state.rings),
    },
    {
      id: "compound",
      title: "持续扩展",
      body: "不断延伸结构，形成复利增长。",
      ok: passGrowth,
      chip: passGrowth ? `${LAWS[state.law].short} ${state.ratio.toFixed(2)}×` : state.law === "tight" ? "外环倒缩" : `净空 ${minGapPx}px`,
      ringTarget: Math.min(3, state.rings),
    },
    {
      id: "coverage",
      title: "系统覆盖",
      body: "扩大影响半径，实现全面覆盖。",
      ok: outerNorm >= 0.64 && outerNorm <= 1.02 && passArc,
      chip: outerNorm > 1.02 ? "画框裁切" : !state.bottomFlip ? "下弧倒立" : `半径 ${Math.round(outerNorm * 100)}%`,
      ringTarget: state.rings,
    },
  ];

  // 底框原海报 4 条扩张原则（由内而外 / 循序递进 / 连接协同 / 扩展生态）
  const principles = [
    {
      id: "insideOut",
      title: "由内而外",
      body: "以核心为起点，有序向外扩展。",
      ok: passCore,
      metric: `核 ${Math.round(state.corePct * 100)}% · 扩 ${Math.round(outerNorm * 100)}%`,
    },
    {
      id: "stepwise",
      title: "循序递进",
      body: "分层分级推进，确保稳定增长。",
      ok: passGrowth,
      metric: `${state.rings} 圈 · 净空 ${minGapPx}px`,
    },
    {
      id: "connect",
      title: "连接协同",
      body: "建立节点连接，增强整体效能。",
      ok: passBridge,
      metric: passBridge ? `${BRIDGES[state.bridges].count} 条跨环轨` : "0 条断连",
    },
    {
      id: "ecosystem",
      title: "扩展生态",
      body: "形成开放系统，实现长期发展。",
      ok: passArc && outerNorm <= 1.02,
      metric: !state.bottomFlip ? "下弧倒立" : outerNorm > 1.02 ? "边界过载" : `最急 ${worstDegPerChar.toFixed(1)}°/字`,
    },
  ];

  // 节奏势态定性档位（明确标注示意）
  const rhythmTier = isSolved
    ? "清晰递进（示意）"
    : outerNorm > 1.02
      ? "胀满溢框（示意）"
      : minGapNorm < 0.084 || state.law === "tight"
        ? "挤环压迫（示意）"
        : !passBridge
          ? "断层孤岛（示意）"
          : "局部失衡（示意）";

  return {
    state,
    scene,
    cx,
    cy,
    rCanvas,
    rSafe,
    coreR,
    outerR,
    outerNorm,
    outerMarginPct,
    minGapNorm,
    minGapPx,
    tightestRingIndex,
    worstDegPerChar,
    worstSpanPct,
    growthSlope,
    rings,
    passedCount,
    isSolved,
    solutionName,
    errors,
    verdict,
    traits,
    sideNotes,
    principles,
    rhythmTier,
  };
}

// 01 节单真源：扩张指数 p 决定的同心环面积与周长增长模型
// 半径分布：r_i = r0 + (1 - r0) * (i / N)^p
export function computeGrowthExponent(p, ringCount = 4, coreRatio = 0.20) {
  const rings = [];
  const totalArea = Math.PI * 1.0;
  const coreArea = Math.PI * coreRatio * coreRatio;
  let prevR = coreRatio;
  for (let i = 1; i <= ringCount; i++) {
    const t = i / ringCount;
    const r = coreRatio + (1 - coreRatio) * Math.pow(t, p);
    const width = r - prevR;
    const area = Math.PI * (r * r - prevR * prevR);
    const areaShare = (area / (totalArea - coreArea)) * 100;
    const circumferenceRatio = r / coreRatio;
    rings.push({
      index: i,
      r,
      prevR,
      width,
      areaShare,
      circumferenceRatio,
    });
    prevR = r;
  }
  const outerToInnerArea = rings[rings.length - 1].areaShare / Math.max(0.1, rings[0].areaShare);
  let verdict;
  if (p < 0.72) {
    verdict = `指数 ${p.toFixed(2)}（前宽后挤）：最内环占去宽厚空间，最外环被迫压扁，面积差距虽缩小至 ${outerToInnerArea.toFixed(1)}×，但视觉上失去向外生长的势头。`;
  } else if (p <= 1.12) {
    verdict = `指数 ${p.toFixed(2)}（等差线性）：每环宽度相等，但受圆面积 r² 影响，最外环面积仍是第 1 环的 ${outerToInnerArea.toFixed(1)}×——若外环颜色过实，会直接压垮中心核。`;
  } else if (p <= 1.55) {
    verdict = `指数 ${p.toFixed(2)}（渐进扩张）：环宽由紧到疏自然舒展，加速感强；此时最外环面积达第 1 环的 ${outerToInnerArea.toFixed(1)}×，务必改用细线或点阵降轻外环视觉重量。`;
  } else {
    verdict = `指数 ${p.toFixed(2)}（过度加速）：内圈被压得极窄、外圈空荡巨大（面积差 ${outerToInnerArea.toFixed(1)}×），内环已经塞不下可读文字。`;
  }
  return { p, coreRatio, rings, outerToInnerArea, verdict };
}

// 06 节眼力小考单变量数据：同一「城市声景展」方形海报，4 方案仅差 1 个扩张变量
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    config: { rings: [0.22, 0.30, 0.39, 0.49], bottomFlip: true, coreWeak: false, bridges: true },
    explain: "环径步进太挤（仅约 1.12× 挤压在中央），三圈弧形文字紧贴相撞，外围留下大片空白却没扩开，层级糊成一团。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    config: { rings: [0.22, 0.40, 0.62, 0.87], bottomFlip: true, coreWeak: false, bridges: true },
    explain: "答对了。中心核圆稳占 22% 锚定视线，三圈环径按递进律舒朗展开（净空充足、不顶边），下半环文字已翻正从左向右顺读，跨环细线把各层串成一体。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    config: { rings: [0.22, 0.40, 0.62, 0.87], bottomFlip: false, coreWeak: false, bridges: true },
    explain: "环距和留白都站得住，但下半圈弧形文字没有翻正——整句头朝下倒挂且从右往左排，读者必须歪头辨认，犯了弧字排印最常见的大忌。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    config: { rings: [0.09, 0.36, 0.61, 0.88], bottomFlip: true, coreWeak: true, bridges: true },
    explain: "环距和下弧朝向都正常，但中心核心萎缩成一个弱小空心点，最外圈又压了厚重实色环带，视觉重心倒吸向外圈，违背了「由内而外」的锚定原则。",
  },
];
