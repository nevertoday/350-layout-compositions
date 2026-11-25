// 109 节奏组织 — 单一真源模型（状态、斜轴几何坐标、节奏四维验收与实测诊断）
// 开场舞台 2D Canvas、底沿调速轨、实时诊单、四词实况条、动态「疏→密→疏→强」谱句全部只读这份计算结果。

export const BEAT_COUNT = 16;

// 0=休止 Rest, 1=弱拍 Weak, 2=中拍 Mid, 3=重音 Accent
export const LEVEL_META = [
  { level: 0, label: "休止", short: "休", heightRatio: 0.0, dotRadius: 2.2 },
  { level: 1, label: "弱拍", short: "弱", heightRatio: 0.30, dotRadius: 4.0 },
  { level: 2, label: "中拍", short: "中", heightRatio: 0.52, dotRadius: 5.2 },
  { level: 3, label: "重音", short: "强", heightRatio: 1.00, dotRadius: 11.2 },
];

// 经验参考阈值（均在页面标明为「经验参考」，不伪装成物理定律）
export const RULES = {
  intervalMin: 1.45,        // 间隔跨比下限：低于此值人眼感到机械等距
  intervalMax: 3.15,        // 间隔跨比上限：高于此值易撕裂节奏连贯
  breakGapFactor: 2.45,     // 最大单隙 / 中位间距 超过此值判定「间隔断层」
  minGapFloor: 0.025,       // 归一化最小间距下限（低于此值柱体视觉粘连）
  accentRatioMin: 1.65,     // 重音柱高 / 常规柱中位高 最低落差
  accentCountMin: 2,        // 至少形成 2 处重音呼应
  accentShareMax: 0.36,     // 强拍占有效拍超过 36% 即「重音通胀」
  maxConsecAccents: 2,      // 连续 3 拍及以上全喊强音导致层次拉平
  maxConsecRests: 2,        // 连续 3 拍及以上休止形成黑洞断层
  tempoSpreadMin: 1.42,     // 视线速度比（最快段 / 最慢段）下限
};

// 间隔波形：当 tension = 0 时全部归零为 1:1 等距；tension 增大时按对应模式拉开疏密
export const CURVES = {
  flat: {
    id: "flat",
    label: "等距 1:1",
    desc: "所有间距完全锁死一致",
    // 基础权重（全 1）
    weights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  breath: {
    id: "breath",
    label: "疏密呼吸",
    desc: "原海报「疏→密→疏→强」四拍收放",
    // 15 个间隔对应 4 个小节（每 4 拍一组，组内先疏后密，组间留换气空）
    weights: [1.22, 0.84, 0.80, 1.56, 1.18, 0.82, 0.80, 1.58, 1.20, 0.84, 0.80, 1.58, 1.18, 0.82, 0.84],
  },
  accel: {
    id: "accel",
    label: "渐密推进",
    desc: "前半舒展起势，后半步距收紧加速",
    weights: [1.48, 1.38, 1.28, 1.44, 1.18, 1.08, 0.96, 1.26, 0.94, 0.86, 0.80, 1.12, 0.80, 0.76, 0.74],
  },
  fractured: {
    id: "fractured",
    label: "断层撕裂",
    desc: "中段拉出巨幅空白，打断视线连贯",
    weights: [0.85, 0.80, 0.85, 0.88, 0.82, 3.60, 0.82, 0.80, 0.86, 3.45, 0.82, 0.80, 0.84, 0.82, 0.85],
  },
};

// 初始开场态：0/4 机械等距平拍（绝非答案）
export function createInitialState() {
  return {
    beats: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    curve: "breath",   // 用户一旦拉动底沿调速轨即可直接拉出疏密呼吸，但开场 tension=0 锁死等距！
    tension: 0.0,      // 0..1 连续控制（0=1:1 机械等距，0.45..0.72=呼吸甜区，>0.85=过密挤压或断层）
    selected: 3,       // 当前键盘/按钮选中的拍位索引 0..15
    playing: true,     // 光学视线扫拍光标是否行进
  };
}

// 预设教学错态 / 对比参考（注意：不放「一键过关」按钮，用户需要自己组合调校，或手点雕刻）
export const HERO_TRYOUTS = {
  flat: {
    label: "复原错态",
    beats: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    curve: "breath",
    tension: 0.0,
  },
  shout: {
    label: "试全员高呼",
    beats: [3, 3, 2, 3, 3, 3, 1, 3, 3, 3, 2, 3, 3, 2, 3, 3],
    curve: "breath",
    tension: 0.54,
  },
  fracture: {
    label: "试间隔断层",
    beats: [1, 2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 3],
    curve: "fractured",
    tension: 0.78,
  },
  chaos: {
    label: "试无序散乱",
    beats: [3, 0, 1, 2, 0, 0, 3, 2, 3, 1, 0, 2, 1, 3, 0, 2],
    curve: "fractured",
    tension: 0.62,
  },
};

// 拍位批量起手样式（仅调重音层，不自动调间隔，仍需用户配合间隔调速轨才能过关）
export const ACCENT_PATTERNS = {
  even: {
    id: "even",
    label: "全平无重",
    beats: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  },
  fourBeat: {
    id: "fourBeat",
    label: "四拍强落",
    beats: [1, 2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 3],
  },
  waltz: {
    id: "waltz",
    label: "三拍轻扬",
    beats: [3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1],
  },
  overload: {
    id: "overload",
    label: "重音过载",
    beats: [3, 3, 3, 2, 3, 3, 1, 3, 3, 3, 2, 3, 3, 3, 2, 3],
  },
};

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 从 state 严格计算出 16 拍的真实斜轴位置 u[0..15]、间距、视线速度与 4 项验收结论
export function evaluateRhythm(state) {
  const curve = CURVES[state.curve] || CURVES.breath;
  const t = clamp(state.tension, 0, 1);

  // 当曲线为 flat 时，即使拖拉调速轨也会保持微小扰动 ≤ 1.04×，直观暴露「选等距模式拉不出节奏」
  // 当曲线为 breath/accel/fractured 时，tension 将权重从 1.0 向曲线目标幂次展开：
  // tension=0 => 1.00× 死等距；tension=0.55 => ~2.1× 呼吸带；tension=1.0 => ~4.3× 过挤/撕裂
  const power = curve.id === "flat" ? 0.04 * t : t * 1.95;

  const rawWeights = curve.weights.map((w) => {
    if (curve.id === "flat") return 1 + (w - 1) * power;
    return Math.pow(w, power);
  });

  // 叠加极端高 tension (>0.82) 的边缘挤压效应，让拖到最右侧必定暴露过密粘连或断层
  const stressedWeights = rawWeights.map((w, idx) => {
    if (curve.id === "flat" || t <= 0.78) return w;
    const extra = (t - 0.78) / 0.22; // 0..1
    const isPhraseBreak = (idx + 1) % 4 === 0 || w > 1.5;
    return isPhraseBreak ? w * (1 + extra * 1.15) : w * (1 - extra * 0.42);
  });

  const sumW = stressedWeights.reduce((a, b) => a + b, 0) || 1;
  const gaps = stressedWeights.map((w) => w / sumW); // 15 个归一化间距，总和 = 1.0

  const positions = [0];
  let acc = 0;
  for (let i = 0; i < gaps.length; i++) {
    acc += gaps[i];
    positions.push(acc);
  }
  positions[positions.length - 1] = 1;

  // 有效间距统计（按物理柱距计）
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const medGap = median(gaps);
  const intervalRatio = minGap > 0 ? maxGap / minGap : 99;
  const breakRatio = medGap > 0 ? maxGap / medGap : 99;
  const maxGapIndex = gaps.indexOf(maxGap);
  const minGapIndex = gaps.indexOf(minGap);

  // 如果存在休止拍（level === 0），有效可视元素之间的真实视觉空隙会被拉大！
  const activeIndices = [];
  for (let i = 0; i < BEAT_COUNT; i++) {
    if (state.beats[i] > 0) activeIndices.push(i);
  }
  const activeCount = activeIndices.length;

  let maxVisualGap = maxGap;
  let maxVisualGapSpan = [maxGapIndex, maxGapIndex + 1];
  const visualGaps = [];
  for (let k = 0; k < activeIndices.length - 1; k++) {
    const a = activeIndices[k];
    const b = activeIndices[k + 1];
    const vg = positions[b] - positions[a];
    visualGaps.push(vg);
    if (vg > maxVisualGap) {
      maxVisualGap = vg;
      maxVisualGapSpan = [a, b];
    }
  }
  const medVisualGap = visualGaps.length ? median(visualGaps) : medGap;
  const visualBreakRatio = medVisualGap > 0 ? maxVisualGap / medVisualGap : 99;

  // 连续休止与连续强音统计
  let maxConsecRests = 0;
  let curRests = 0;
  let maxConsecAccents = 0;
  let curAccents = 0;
  const accentIndices = [];
  const heights = [];

  for (let i = 0; i < BEAT_COUNT; i++) {
    const lv = state.beats[i];
    const meta = LEVEL_META[lv] || LEVEL_META[1];
    heights.push(meta.heightRatio);
    if (lv === 0) {
      curRests++;
      if (curRests > maxConsecRests) maxConsecRests = curRests;
      curAccents = 0;
    } else {
      curRests = 0;
      if (lv === 3) {
        accentIndices.push(i);
        curAccents++;
        if (curAccents > maxConsecAccents) maxConsecAccents = curAccents;
      } else {
        curAccents = 0;
      }
    }
  }

  const accentCount = accentIndices.length;
  const accentShare = activeCount > 0 ? accentCount / activeCount : 0;

  // 重音高度落差：最高柱 / 非强音有效柱的中位高度
  const nonAccentHeights = state.beats
    .filter((lv) => lv === 1 || lv === 2)
    .map((lv) => LEVEL_META[lv].heightRatio);
  const maxActiveH = activeCount > 0 ? Math.max(...heights) : 0;
  const baseH = nonAccentHeights.length ? median(nonAccentHeights) : maxActiveH;
  const accentRatio = baseH > 0 ? maxActiveH / baseH : 1;

  // 周期/乐句有序性检测（区分「有序重复+变化」与「纯随机杂讯」）
  // 检查 4 拍小节或 3 拍小节的自相关相似度，或强音间距的一致度
  let phraseRegularity = 0;
  if (accentIndices.length >= 2) {
    const stepDiffs = [];
    for (let i = 1; i < accentIndices.length; i++) {
      stepDiffs.push(accentIndices[i] - accentIndices[i - 1]);
    }
    const avgStep = stepDiffs.reduce((a, b) => a + b, 0) / stepDiffs.length;
    const maxDev = Math.max(...stepDiffs.map((d) => Math.abs(d - avgStep)));
    // 步距落差在 1 拍内（如 4-4-4 或 3-4-3 或 4-3-4）均属于可感知的有序周期
    phraseRegularity = clamp(1 - maxDev / Math.max(2.5, avgStep), 0, 1);
  } else {
    // 没有强音时看弱中拍是否有周期重复（period 3 or 4）
    let match4 = 0;
    for (let i = 0; i < BEAT_COUNT - 4; i++) {
      if (state.beats[i] === state.beats[i + 4]) match4++;
    }
    phraseRegularity = match4 / (BEAT_COUNT - 4);
  }

  // 每段视线示意速度（间隔越密速度越快，间隔越宽或遇重音则停顿减速）
  const segmentSpeeds = gaps.map((g, i) => {
    const nextLv = state.beats[i + 1];
    const accentDrag = nextLv === 3 ? 0.62 : nextLv === 0 ? 0.45 : 1.0;
    const rawSpeed = (medGap / Math.max(0.008, g)) * accentDrag;
    return clamp(rawSpeed, 0.28, 2.8);
  });
  const minSpeed = Math.min(...segmentSpeeds);
  const maxSpeed = Math.max(...segmentSpeeds);
  const tempoSpread = minSpeed > 0 ? maxSpeed / minSpeed : 1;

  // 逐拍光学驻留权重（供 Playhead 真实按疏密与重音调速）
  const beatDurations = [];
  for (let i = 0; i < BEAT_COUNT; i++) {
    const gapBefore = i === 0 ? medGap : gaps[i - 1];
    const lv = state.beats[i];
    const accentPause = lv === 3 ? 1.75 : lv === 0 ? 1.55 : lv === 2 ? 0.95 : 0.72;
    const gapFactor = clamp(gapBefore / Math.max(0.015, medGap), 0.45, 2.4);
    beatDurations.push(0.24 * accentPause * gapFactor);
  }

  // --- 四大核心指标验收（来自原海报 4 关键词：间隔 / 重音 / 速度 / 连贯） ---
  const isCrowded = minGap < RULES.minGapFloor;
  const isFlatInterval = intervalRatio < RULES.intervalMin;
  const isOverWideInterval = intervalRatio > RULES.intervalMax;

  const intervalOk = !isFlatInterval && !isOverWideInterval && !isCrowded;

  const isTooFewAccents = accentCount < RULES.accentCountMin || accentRatio < RULES.accentRatioMin;
  const isAccentOverload = accentShare > RULES.accentShareMax || maxConsecAccents > RULES.maxConsecAccents;
  const isEmpty = activeCount < 6;
  const accentOk = !isEmpty && !isTooFewAccents && !isAccentOverload;

  const tempoOk = tempoSpread >= RULES.tempoSpreadMin && !isFlatInterval && !isEmpty;

  const isFractured =
    breakRatio > RULES.breakGapFactor ||
    visualBreakRatio > RULES.breakGapFactor + 0.35 ||
    maxConsecRests > RULES.maxConsecRests ||
    isEmpty;
  const isChaotic =
    !isEmpty &&
    accentCount >= 2 &&
    phraseRegularity < 0.38 &&
    (maxConsecRests >= 2 || breakRatio > 2.0);
  const isDeadFlat = isFlatInterval && isTooFewAccents;
  const continuityOk = !isFractured && !isChaotic && !isCrowded && !isDeadFlat;

  const passedCount = [intervalOk, accentOk, tempoOk, continuityOk].filter(Boolean).length;

  // 动态生成原海报左下角同款四字谱句（如「平 → 平 → 平 → 平」或「疏 → 密 → 疏 → 强」）
  const cadenceTokens = buildCadenceFormula(state, gaps, medGap, {
    isFlatInterval,
    isAccentOverload,
    isFractured,
    isEmpty,
  });

  // 优先级清晰的错态诊断（永远基于实测数说清「为什么」，绝不给空话）
  const diagnosis = buildDiagnosis({
    state,
    passedCount,
    intervalRatio,
    breakRatio,
    visualBreakRatio,
    minGap,
    accentCount,
    activeCount,
    accentShare,
    accentRatio,
    maxConsecAccents,
    maxConsecRests,
    tempoSpread,
    phraseRegularity,
    isEmpty,
    isCrowded,
    isFlatInterval,
    isOverWideInterval,
    isTooFewAccents,
    isAccentOverload,
    isFractured,
    isChaotic,
    intervalOk,
    accentOk,
    tempoOk,
    continuityOk,
    maxVisualGapSpan,
  });

  return {
    positions,
    gaps,
    heights,
    segmentSpeeds,
    beatDurations,
    minGap,
    maxGap,
    medGap,
    intervalRatio,
    breakRatio,
    visualBreakRatio,
    maxGapIndex,
    minGapIndex,
    maxVisualGapSpan,
    activeCount,
    accentCount,
    accentShare,
    accentRatio,
    accentIndices,
    maxConsecAccents,
    maxConsecRests,
    tempoSpread,
    phraseRegularity,
    cadenceTokens,
    flags: {
      isEmpty,
      isCrowded,
      isFlatInterval,
      isOverWideInterval,
      isTooFewAccents,
      isAccentOverload,
      isFractured,
      isChaotic,
    },
    pillars: {
      interval: {
        ok: intervalOk,
        status: isCrowded
          ? "过密粘连"
          : isFlatInterval
            ? `等距 ${intervalRatio.toFixed(2)}×`
            : isOverWideInterval
              ? `拉扯 ${intervalRatio.toFixed(1)}×`
              : `呼吸 ${intervalRatio.toFixed(2)}×`,
      },
      accent: {
        ok: accentOk,
        status: isEmpty
          ? "拍位过少"
          : isAccentOverload
            ? `过载 ${Math.round(accentShare * 100)}%`
            : isTooFewAccents
              ? accentCount === 0
                ? "0 处重音"
                : `仅 ${accentCount} 处`
              : `${accentCount} 处 · ${accentRatio.toFixed(1)}×`,
      },
      tempo: {
        ok: tempoOk,
        status: isFlatInterval
          ? "平速 1.0×"
          : tempoOk
            ? `起伏 ${tempoSpread.toFixed(2)}×`
            : `偏平 ${tempoSpread.toFixed(2)}×`,
      },
      continuity: {
        ok: continuityOk,
        status: isDeadFlat
          ? "僵直无句"
          : isFractured
            ? `断层 ${Math.max(breakRatio, visualBreakRatio).toFixed(1)}×`
            : isChaotic
              ? "无序散乱"
              : isCrowded
                ? "局部挤撞"
                : "连贯不断",
      },
    },
    passedCount,
    diagnosis,
  };
}

function buildCadenceFormula(state, gaps, medGap, flags) {
  if (flags.isEmpty) return ["空", "空", "缺", "拍"];
  if (flags.isFlatInterval && state.beats.every((b) => b === state.beats[0])) {
    return ["平", "平", "平", "平"];
  }
  if (flags.isAccentOverload) return ["强", "强", "强", "噪"];
  // 按 4 个小节总结每个小节的主导体感
  const tokens = [];
  for (let bar = 0; bar < 4; bar++) {
    const start = bar * 4;
    const sliceBeats = state.beats.slice(start, start + 4);
    const sliceGaps = gaps.slice(start, Math.min(start + 4, gaps.length));
    const hasAccent = sliceBeats.includes(3);
    const allRest = sliceBeats.every((b) => b === 0);
    const maxG = Math.max(...sliceGaps);
    const avgG = sliceGaps.reduce((a, b) => a + b, 0) / Math.max(1, sliceGaps.length);

    if (allRest) tokens.push("空");
    else if (maxG / Math.max(0.001, medGap) > RULES.breakGapFactor) tokens.push("断");
    else if (bar === 3 && hasAccent) tokens.push("强");
    else if (avgG > medGap * 1.16) tokens.push("疏");
    else if (avgG < medGap * 0.90) tokens.push("密");
    else if (hasAccent) tokens.push("强");
    else tokens.push("平");
  }
  // 当 4 小节符合经典疏密呼吸且有强落时，保留原海报标志性读法「疏 → 密 → 疏 → 强」
  if (
    !flags.isFlatInterval &&
    !flags.isFractured &&
    state.curve === "breath" &&
    state.beats.filter((b) => b === 3).length >= 2 &&
    state.beats.filter((b) => b === 3).length <= 5
  ) {
    return ["疏", "密", "疏", "强"];
  }
  return tokens;
}

function buildDiagnosis(m) {
  if (m.passedCount === 4) {
    return {
      tone: "ok",
      badge: "成立 · 节奏已立住 (4 / 4)",
      headline: `疏密 ${m.intervalRatio.toFixed(2)}× 配 ${m.accentCount} 处重音，视线有快有停`,
      body: `窄间距让相邻拍位快速连读，宽间距给出换气停顿，${m.accentCount} 处冰青/钴蓝高柱把主体从底拍里托了出来（高差 ${m.accentRatio.toFixed(1)}×），同时最大间隔停在中位距的 ${Math.max(m.breakRatio, m.visualBreakRatio).toFixed(2)}× 以内，乐句连贯不断裂。`,
      hint: "可以继续点击任意蓝柱改强弱，或把调速轨拉向最左/最右，亲自验证节奏怎样瞬间塌成「死板节拍器」或「断层碎裂」。",
    };
  }

  if (m.isEmpty) {
    return {
      tone: "error",
      badge: `错态 · 拍位过空 (${m.passedCount} / 4)`,
      headline: `只剩 ${m.activeCount} 拍亮着，连基本重复都尚未成立`,
      body: "节奏的前提是「有序的重复」。当大部分拍位被清空为休止，眼睛只能看到几枚孤立散点，无法形成可预期的节拍底盘。",
      hint: "在画布上点回至少 6 根以上竖柱（弱/中/重音），先建立重复底盘，再拉出疏密与重音。",
    };
  }

  if (m.isFlatInterval && m.isTooFewAccents) {
    return {
      tone: "error",
      badge: `错态 · 等距平拍 (${m.passedCount} / 4)`,
      headline: `16 拍齐平且间距 ${m.intervalRatio.toFixed(2)}× 等距，眼皮开始发钝`,
      body: "现在画面只有机械重复：每根柱高差几乎为零、相邻间距 1:1 锁死，视线以恒定速度平扫过去，既找不到该停下来的重音焦点，也没有快慢起伏。",
      hint: "先向右拖动舞台底沿的「间隔疏密调速轨」拉开疏密（经验参考 1.45×–3.15×），再在画布上点击 3–4 根柱拔高成冰青/钴蓝重音。",
    };
  }

  if (m.isAccentOverload) {
    return {
      tone: "error",
      badge: `错态 · 重音通胀 (${m.passedCount} / 4)`,
      headline:
        m.maxConsecAccents > RULES.maxConsecAccents
          ? `连续 ${m.maxConsecAccents} 拍齐喊重音，焦点互相抵消`
          : `强拍占了 ${Math.round(m.accentShare * 100)}%，全员高呼等于没有重音`,
      body: "重音之所以醒目，全靠旁边有足够多的弱拍与中拍衬托（经验参考强拍占比不超过 36%，避免 3 拍连喊）。现在满屏都在争最高点，层次重新塌平。",
      hint: "点击画布上多余的高亮柱把它们降回「弱拍」或「中拍」，只留 2–5 处真正要强调的落点。",
    };
  }

  if (m.isFractured) {
    const gapVal = Math.max(m.breakRatio, m.visualBreakRatio).toFixed(2);
    return {
      tone: "error",
      badge: `错态 · 间隔断层 (${m.passedCount} / 4)`,
      headline:
        m.maxConsecRests > RULES.maxConsecRests
          ? `连续 ${m.maxConsecRests} 拍空缺，乐句在半途掉空`
          : `最大空隙拉到中位距的 ${gapVal}×，连贯性被拦腰截断`,
      body: "按照格式塔邻近律，一旦某处空隙远超常规呼吸带（经验参考 ≤ 2.45× 中位距），大脑会把前后两段判定为互不相干的孤岛，视线流动当场熄火。",
      hint:
        m.state.curve === "fractured"
          ? "把间隔波形从「断层撕裂」切回「疏密呼吸」或「渐密推进」，再微调舞台底沿的调速轨收拢裂口。"
          : "把舞台底沿的「间隔疏密调速轨」往左收回至呼吸甜区，或补回连续休止处的过渡拍。",
    };
  }

  if (m.isCrowded) {
    return {
      tone: "error",
      badge: `错态 · 过密粘连 (${m.passedCount} / 4)`,
      headline: "局部步距压得太扁，相邻柱体糊成一团色块",
      body: "收紧间距确实能制造急促的视觉加速，但一旦最小间距跌破柱体辨识底线，单拍边界消失，眼睛分不清这里是几拍连奏还是单块宽色块。",
      hint: "把舞台底沿的「间隔疏密调速轨」稍微向左松开一点，给最密处的竖柱留出透气黑缝。",
    };
  }

  if (m.isFlatInterval) {
    return {
      tone: "error",
      badge: `错态 · 节拍器单调 (${m.passedCount} / 4)`,
      headline: `已有 ${m.accentCount} 处重音，但间距仍锁在 ${m.intervalRatio.toFixed(2)}× 等距`,
      body: "只变高度、不变间隔，就像节拍器在固定秒针上敲重槌——虽然有高低层次，却缺少原海报强调的「疏 → 密 → 疏」速度伸缩与换气停顿。",
      hint:
        m.state.curve === "flat"
          ? "当前波形锁在「等距 1:1」，先切到「疏密呼吸」或「渐密推进」，再拖动舞台底沿的调速轨拉开间距跨比。"
          : "向右拖动舞台底沿的「间隔疏密调速轨」，把间距跨比拉进 1.45×–3.15× 的呼吸带。",
    };
  }

  if (m.isTooFewAccents) {
    return {
      tone: "error",
      badge: `错态 · 重音哑火 (${m.passedCount} / 4)`,
      headline:
        m.accentCount === 0
          ? "间隔已有疏密，但全排没有 1 处拔尖重音"
          : `只有 ${m.accentCount} 处重音（高差 ${m.accentRatio.toFixed(2)}×），撑不起往复起伏`,
      body: "间距拉开了视线快慢，但缺少 2 处以上的强弱呼应（经验高差 ≥ 1.65×），读者的目光滑过去却抓不住明确的视觉锚点。",
      hint: "直接点击画布上的 3–4 根竖柱（比如每组第 4 拍），把它们拉高成冰青/钴蓝重音柱。",
    };
  }

  if (m.isOverWideInterval) {
    return {
      tone: "error",
      badge: `错态 · 疏密过激 (${m.passedCount} / 4)`,
      headline: `最宽与最窄间距相差 ${m.intervalRatio.toFixed(2)}×，轻重拉扯失衡`,
      body: "极端宽窄对比让紧密区挤成一束、松散区显得掉队，视觉速度从急刹直接跳到断档。",
      hint: "把舞台底沿的「间隔疏密调速轨」往回推一点，将间距跨比收敛回 1.45×–3.15× 经验参考带。",
    };
  }

  if (m.isChaotic) {
    return {
      tone: "error",
      badge: `错态 · 无序杂讯 (${m.passedCount} / 4)`,
      headline: "重音落点与空拍毫无呼应，大脑读不出重复骨架",
      body: "节奏的另一半是「有序的重复」。当强弱、空拍和宽窄间距彼此打架，眼睛预测不到下一拍什么时候来，页面就会滑向混乱噪点。",
      hint: "整理 2–4 处重音的跨拍步距，让它们按相对可预期的节拍呼吸，并补齐过宽空洞。",
    };
  }

  return {
    tone: "warn",
    badge: `微调中 (${m.passedCount} / 4)`,
    headline: "节奏骨架已现，还差最后一项平衡",
    body: "检查上方四词状态灯：把亮红的项调进经验呼吸带（间距跨比 1.45×–3.15×、强拍 2–5 处且不断层），整条斜轴乐谱就会活起来。",
    hint: "观察四词状态灯里标红的那一项，针对性微调柱高或底沿调速轨。",
  };
}

// ---------- Section 02：9 拍互动间隔切句板数据（数值严格等于实际渲染像素宽度，读数与画面 1:1 一致） ----------
export const GAP_SIZES = [
  { id: 0, label: "窄", px: 22, tag: "急连", speed: "快扫" },
  { id: 1, label: "中", px: 36, tag: "常规", speed: "平进" },
  { id: 2, label: "宽", px: 60, tag: "换气", speed: "停顿" },
  { id: 3, label: "断", px: 108, tag: "断层", speed: "脱节" },
];

export function evaluateGapBoard(gapLevels) {
  // 根据 8 个间距挡位划分格式塔视觉乐句
  const phrases = [];
  let cur = [0];
  let breaks = 0;
  let pauses = 0;
  for (let i = 0; i < gapLevels.length; i++) {
    const lv = gapLevels[i];
    if (lv >= 2) {
      phrases.push(cur);
      cur = [i + 1];
      if (lv === 3) breaks++;
      else pauses++;
    } else {
      cur.push(i + 1);
    }
  }
  phrases.push(cur);
  const pattern = phrases.map((p) => p.length).join(" + ");
  const pxList = gapLevels.map((l) => GAP_SIZES[l].px);
  const ratio = Math.max(...pxList) / Math.min(...pxList);

  let verdict = "";
  let tone = "ok";
  if (breaks > 0) {
    tone = "error";
    verdict = `出现 ${breaks} 处「断层」空隙（108px，跨比 ${ratio.toFixed(1)}×），格式塔邻近律断裂：9 拍被撕成 ${phrases.length} 段互不认账的孤块（${pattern}）。`;
  } else if (ratio < 1.45) {
    tone = "warn";
    verdict = `所有空隙几乎一样宽（跨比 ${ratio.toFixed(1)}×），视线只能平速滑过 9 个点，分不出乐句与停顿。`;
  } else if (phrases.length === 1) {
    tone = "warn";
    verdict = `全是窄/中缝（跨比 ${ratio.toFixed(1)}×），9 个模块抱成一整块（9），紧凑却喘不过气，缺少「疏」带来的换气停顿。`;
  } else {
    tone = "ok";
    verdict = `窄缝（22px）连读 + ${pauses} 处宽缝（60px）换气，9 拍自然切分成「${pattern}」的清晰乐句（实测跨比 ${ratio.toFixed(1)}×，落入呼吸甜区），流动与停顿并存。`;
  }
  return { phrases, pattern, ratio, breaks, pauses, verdict, tone };
}

// ---------- Section 03：四维重音与稀释定律 ----------
export const ACCENT_CHANNELS = {
  size: {
    id: "size",
    label: "高度体量",
    en: "SCALE",
    desc: "像 109 原海报一样把重音柱拉高 2×，最直观、无需依赖色觉。",
  },
  weight: {
    id: "weight",
    label: "粗细字重",
    en: "WEIGHT",
    desc: "保持等高与等位，仅靠加粗柱宽与深描边建立低噪层次，适合正文与列表。",
  },
  color: {
    id: "color",
    label: "高亮冰青",
    en: "COLOR",
    desc: "静拍压进深钴蓝，重音点亮高明度冰青色，视线瞬间锁定焦点。",
  },
  space: {
    id: "space",
    label: "留白孤立",
    en: "ISOLATION",
    desc: "不放大也不变色，仅在重音两侧腾出宽留白，靠安静反衬出重量。",
  },
};

export function evaluateAccentBudget(count, total = 12) {
  const share = count / total;
  if (count === 0) {
    return {
      tone: "error",
      status: "0% · 全平哑火",
      headline: "没有任何重音，视线找不到第一落脚点",
      detail: "12 个单元平分注意力，读者必须从头逐个扫读才能知道重点在哪里。",
    };
  }
  if (share <= 0.34) {
    return {
      tone: "ok",
      status: `${Math.round(share * 100)}% · 清晰层次（经验甜区）`,
      headline: `${count} 处重音被 ${total - count} 处静拍稳稳托起`,
      detail: "少数重点与多数底拍拉开鲜明反差，眼睛自动先读强点、再扫弱拍，节奏张弛有度。",
    };
  }
  return {
    tone: "error",
    status: `${Math.round(share * 100)}% · 重音通胀`,
    headline: `${count} / ${total} 个元素同时抢戏，重音反而消失了`,
    detail: "当超过一半的拍位都在放大、加粗或点亮，它们不再是「重点」，而是变成了新的背景噪音。",
  };
}

// ---------- Section 07：严格单变量 4 选 1 小练习数据 ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    // 与方案 B 完全相同的 3 处克制重音，仅破坏单一变量：11 个间隔全部锁死为 1:1 等距
    heights: [0.30, 0.46, 0.34, 0.96, 0.30, 0.44, 0.32, 0.98, 0.32, 0.46, 0.34, 1.00],
    accents: [3, 7, 11],
    gaps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    reason: "虽然有 3 处清晰重音，但 11 处间隔全部锁死为 1:1 绝对等距。只改高度、不控间隔，像固定秒针的机械节拍器，缺少「疏→密→疏」的速度伸缩。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    // 疏 → 密 → 疏 → 强，3 处克制重音，最大间隙约 2.1×
    heights: [0.30, 0.46, 0.34, 0.96, 0.30, 0.44, 0.32, 0.98, 0.32, 0.46, 0.34, 1.00],
    accents: [3, 7, 11],
    gaps: [1.32, 0.78, 0.74, 1.76, 1.28, 0.76, 0.74, 1.78, 1.26, 0.76, 0.74],
    reason: "正确。三处冰青重音占 25%（克制且周期呼应），组内密缝加速、组间约 2.1× 宽缝换气，同时满足间隔变化、重音层次与格式塔连贯。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    // 与方案 B 完全相同的疏密间距，仅破坏单一变量：8/12 拍同时拉成高柱（重音过载）
    heights: [0.94, 0.96, 0.42, 0.98, 0.92, 0.40, 0.96, 0.98, 0.44, 0.95, 0.98, 0.42],
    accents: [0, 1, 3, 4, 6, 7, 9, 10],
    gaps: [1.32, 0.78, 0.74, 1.76, 1.28, 0.76, 0.74, 1.78, 1.26, 0.76, 0.74],
    reason: "虽然保留了与正解一致的疏密间距，但 12 拍里有 8 拍都在高喊重音（67% 过载），主次对比被稀释殆尽，视线处处被拽住反而失去流动感。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    // 与方案 B 完全相同的 3 处重音，仅破坏单一变量：第 5–6 拍间 4.4× 空白断层
    heights: [0.30, 0.46, 0.34, 0.96, 0.30, 0.44, 0.32, 0.98, 0.32, 0.46, 0.34, 1.00],
    accents: [3, 7, 11],
    gaps: [0.84, 0.78, 0.78, 0.84, 3.85, 0.82, 0.78, 0.80, 0.84, 0.78, 0.78],
    reason: "重音比例虽与正解一样克制，但第 5 与第 6 拍之间拉出超过 4.4× 的空白断层，打破了格式塔邻近律，整条序列被撕成左右两截孤立碎片。",
  },
];
