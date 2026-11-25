// 039 波浪形构图 · 单真源波形模型
// 所有画布渲染、站点坐标、转向角、波峰承托、红标定位与白话诊单均从本文件实绘采样点计算。

export const SAMPLE_COUNT = 160;
export const REF_ASPECT = 1.85; // 统一评估长宽比，保证不同屏幕下读数与过关标准一致

export const LIMITS = {
  cycles: { min: 0.65, max: 5.4, sweetMin: 2.2, sweetMax: 3.35 },
  amplitude: { min: 0.03, max: 0.31, sweetMin: 0.085, sweetMax: 0.235 },
  sharpness: { min: 0, max: 1, sweetMax: 0.24 },
  phaseShift: { min: 0, max: 1, sweetMax: 0.26 },
  maxTurnSweet: 38,
  maxSlopeSweet: 50,
  stationSpacingRatioMax: 1.48,
  stationSpanMin: 0.44,
  stationCrestAvgMin: 0.50,
  stationCrestFloor: 0.12,
  focalCrestMin: 0.52,
  focalSafeMin: 0.16,
  focalSafeMax: 0.86,
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 冲浪海浪",
    shortLabel: "原海报冲浪",
    skyTop: "#CAEDE6",
    skyBot: "#D4F2EC",
    back1: "#8ED9D7",
    back2: "#58C8C9",
    front: "#08A7B4",
    frontDeep: "#03939E",
    focalName: "冲浪者与暖阳焦点",
    stations: [
      { id: "soft", zh: "柔和波动", en: "GENTLE UNDULATION", icon: "wave" },
      { id: "rhythm", zh: "重复韵律", en: "REPETITIVE RHYTHM", icon: "bars" },
      { id: "guide", zh: "连续引导", en: "CONTINUOUS GUIDANCE", icon: "arrow" },
    ],
  },
  music: {
    id: "music",
    label: "山岚音乐季",
    shortLabel: "山岚音乐季",
    skyTop: "#D2EFEA",
    skyBot: "#DFEFEF",
    back1: "#8BCFD4",
    back2: "#4CB3BD",
    front: "#0B8296",
    frontDeep: "#065C6E",
    focalName: "落日声浪主舞台",
    stations: [
      { id: "soft", zh: "前奏入耳", en: "OPENING SWELL", icon: "wave" },
      { id: "rhythm", zh: "副歌节拍", en: "CHORUS PULSE", icon: "bars" },
      { id: "guide", zh: "尾声余韵", en: "FINAL CADENCE", icon: "arrow" },
    ],
  },
  tea: {
    id: "tea",
    label: "茶山茶韵横幅",
    shortLabel: "茶山茶韵",
    skyTop: "#D8F0E5",
    skyBot: "#E6F4EC",
    back1: "#92D2BA",
    back2: "#4BB298",
    front: "#0D8A7B",
    frontDeep: "#076359",
    focalName: "晨光茶岭焦点",
    stations: [
      { id: "soft", zh: "采青舒展", en: "SOFT LEAF", icon: "wave" },
      { id: "rhythm", zh: "茶垄层叠", en: "TERRACE RHYTHM", icon: "bars" },
      { id: "guide", zh: "茶香延展", en: "FLOWING AROMA", icon: "arrow" },
    ],
  },
};

// 开场默认：0/4 复合错态（绝不先给答案；中心海域净空，便于任意屏幕横拖调波）
export const INITIAL_BROKEN = {
  theme: "poster",
  cycles: 4.8,
  amplitude: 0.175,
  sharpness: 0.64,
  phaseShift: 0.66,
  stations: [0.18, 0.30, 0.41],
  focalU: 0.83,
};

export const PRESETS = {
  classic: {
    id: "classic",
    label: "原海报三峰解",
    kind: "good",
    values: { cycles: 2.85, amplitude: 0.145, sharpness: 0.04, phaseShift: 0.06, stations: [0.15, 0.50, 0.85], focalU: 0.72 },
  },
  serene: {
    id: "serene",
    label: "舒缓宽浪解",
    kind: "good",
    values: { cycles: 2.38, amplitude: 0.115, sharpness: 0.0, phaseShift: 0.02, stations: [0.11, 0.50, 0.89], focalU: 0.72 },
  },
  lively: {
    id: "lively",
    label: "轻快活波解",
    kind: "good",
    values: { cycles: 3.08, amplitude: 0.175, sharpness: 0.08, phaseShift: 0.12, stations: [0.175, 0.50, 0.825], focalU: 0.72 },
  },
  flatFail: {
    id: "flatFail",
    label: "试错：单弧过扁",
    kind: "bad",
    values: { cycles: 0.95, amplitude: 0.055, sharpness: 0.02, phaseShift: 0.08, stations: [0.22, 0.50, 0.78], focalU: 0.72 },
  },
  zigzagFail: {
    id: "zigzagFail",
    label: "试错：尖峰锯齿",
    kind: "bad",
    values: { cycles: 2.85, amplitude: 0.275, sharpness: 0.88, phaseShift: 0.58, stations: [0.15, 0.50, 0.85], focalU: 0.72 },
  },
  reset: {
    id: "reset",
    label: "复原 0/4 错态",
    kind: "reset",
    values: { ...INITIAL_BROKEN, stations: [...INITIAL_BROKEN.stations] },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 纯正弦与等周期三角波混合：+1 为波峰（画面偏上），-1 为波谷（画面偏下）
export function waveShape(theta, sharpness = 0) {
  const s = Math.cos(theta);
  const t = 1 - (2 / Math.PI) * Math.acos(clamp(s, -1, 1));
  return (1 - sharpness) * s + sharpness * t;
}

// 前景白色主韵律浪脊（居中对称，u=0.5 必为中峰，三峰自然分布于 0.5 ± 1/cycles）
export function frontWaveUnit(u, state) {
  const theta = 2 * Math.PI * state.cycles * (u - 0.5);
  return waveShape(theta, state.sharpness);
}

// 上层大海浪脊（承载冲浪者暖阳焦点，以 u=0.72 为原海报右侧主浪峰锚点）
export function upperWaveUnit(u, state) {
  const upperCycles = state.cycles * 0.68;
  const theta = 2 * Math.PI * upperCycles * (u - 0.72);
  return waveShape(theta, state.sharpness * 0.85);
}

// 中远层海浪（当 phaseShift 较大时与主浪反向错相斜切，制造视觉干扰）
export function backWaveUnit(u, state, layerIndex) {
  const freqScale = layerIndex === 0 ? 0.64 : 0.78;
  const clashRad = state.phaseShift * Math.PI * (layerIndex === 0 ? 1.15 : -0.92);
  const drift = layerIndex === 0 ? -0.14 : 0.08;
  const theta = 2 * Math.PI * (state.cycles * freqScale) * (u - 0.5 + drift) + clashRad;
  return waveShape(theta, state.sharpness * 0.7);
}

// 根据当前波数算出画布内最靠近 3 个节奏位的波峰 u 坐标
export function idealCrestStations(cycles) {
  const step = 1 / Math.max(1.2, cycles);
  const left = clamp(0.5 - step, 0.11, 0.34);
  const right = clamp(0.5 + step, 0.66, 0.89);
  return [left, 0.5, right];
}

// 找上层大海浪最靠近某 u 的波峰位置（优先安全区内）
export function nearestUpperCrest(u, cycles) {
  const upperCycles = Math.max(0.5, cycles * 0.68);
  const candidates = [];
  for (let k = -4; k <= 4; k++) {
    const cu = 0.72 + k / upperCycles;
    if (cu >= LIMITS.focalSafeMin && cu <= LIMITS.focalSafeMax) candidates.push(cu);
  }
  if (!candidates.length) return 0.72;
  candidates.sort((a, b) => Math.abs(a - u) - Math.abs(b - u));
  return candidates[0];
}

// 统一计算前景波浪在画布归一化坐标系中的 y 值（0 在顶，1 在底）
export const FRONT_BASE_Y = 0.73;
export const UPPER_BASE_Y = 0.43;

export function frontY(u, state) {
  return FRONT_BASE_Y - state.amplitude * 0.56 * frontWaveUnit(u, state);
}

export function upperY(u, state) {
  return UPPER_BASE_Y - state.amplitude * 0.68 * upperWaveUnit(u, state);
}

export function upperSlopeAngle(u, state) {
  const eps = 0.004;
  const dy = upperY(u + eps, state) - upperY(u - eps, state);
  const dx = 2 * eps * REF_ASPECT;
  return Math.atan2(dy, dx);
}

// 从 160 个真实采样点计算全部构图指标、四支柱达标状态、错误优先级与白话诊单
export function evaluate(state) {
  const pts = [];
  const upperPts = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const u = i / (SAMPLE_COUNT - 1);
    pts.push({ u, y: frontY(u, state), w: frontWaveUnit(u, state) });
    upperPts.push({ u, y: upperY(u, state), w: upperWaveUnit(u, state) });
  }

  // 1. 实算局部最大转向角（跨 3 步弦长 ≈ 1.9% 画宽，对应视觉关联场的局部朝向变化）
  let maxTurnDeg = 0;
  let maxSlopeDeg = 0;
  const stride = 3;
  for (let i = stride; i < pts.length - stride; i++) {
    const a = pts[i - stride];
    const b = pts[i];
    const c = pts[i + stride];
    const v1x = (b.u - a.u) * REF_ASPECT;
    const v1y = b.y - a.y;
    const v2x = (c.u - b.u) * REF_ASPECT;
    const v2y = c.y - b.y;
    const m1 = Math.hypot(v1x, v1y);
    const m2 = Math.hypot(v2x, v2y);
    if (m1 > 1e-6 && m2 > 1e-6) {
      const cosA = clamp((v1x * v2x + v1y * v2y) / (m1 * m2), -1, 1);
      const deg = (Math.acos(cosA) * 180) / Math.PI;
      if (deg > maxTurnDeg) maxTurnDeg = deg;
    }
    const slope = (Math.atan2(Math.abs(v1y), Math.abs(v1x)) * 180) / Math.PI;
    if (slope > maxSlopeDeg) maxSlopeDeg = slope;
  }

  // 2. 实数前景画布可见波峰数量
  const crests = [];
  const troughs = [];
  for (let i = 1; i < pts.length - 1; i++) {
    if (pts[i].w >= pts[i - 1].w && pts[i].w > pts[i + 1].w && pts[i].w > 0.35) crests.push(pts[i]);
    if (pts[i].w <= pts[i - 1].w && pts[i].w < pts[i + 1].w && pts[i].w < -0.35) troughs.push(pts[i]);
  }

  // 3. 实测三枚白色站点在当前波形上的落峰高度与步距节奏
  const stRaw = state.stations.map((u, idx) => ({
    idx,
    u,
    y: frontY(u, state),
    w: frontWaveUnit(u, state),
  }));
  const stSorted = [...stRaw].sort((a, b) => a.u - b.u);
  const gap1 = stSorted[1].u - stSorted[0].u;
  const gap2 = stSorted[2].u - stSorted[1].u;
  const minGap = Math.min(gap1, gap2);
  const maxGap = Math.max(gap1, gap2);
  const spacingRatio = maxGap / Math.max(0.02, minGap);
  const stationSpan = stSorted[2].u - stSorted[0].u;
  const stationCrestAvg = stRaw.reduce((acc, s) => acc + s.w, 0) / stRaw.length;
  const stationCrestMin = Math.min(...stRaw.map((s) => s.w));

  // 4. 实测暖阳焦点在主海浪上的落峰高度与边呼吸
  const focalW = upperWaveUnit(state.focalU, state);
  const focalY = upperY(state.focalU, state);
  const focalSlopeRad = upperSlopeAngle(state.focalU, state);
  const focalClipped = state.focalU < LIMITS.focalSafeMin || state.focalU > LIMITS.focalSafeMax;
  const focalSunk = focalW < LIMITS.focalCrestMin;

  // 5. 四支柱独立达标核算（每项只由对应维度独立决定，避免高频错态锁死圆度修复）
  const freqTooLow = state.cycles < LIMITS.cycles.sweetMin;
  const freqTooHigh = state.cycles > LIMITS.cycles.sweetMax;
  const rhythmOk = !freqTooLow && !freqTooHigh;

  const ampTooFlat = state.amplitude < LIMITS.amplitude.sweetMin;
  const ampTooSteep = state.amplitude > LIMITS.amplitude.sweetMax || (!freqTooHigh && maxSlopeDeg > LIMITS.maxSlopeSweet);
  const tooSharp = state.sharpness > LIMITS.sharpness.sweetMax || (!freqTooHigh && !ampTooSteep && maxTurnDeg > LIMITS.maxTurnSweet);
  const softOk = !ampTooFlat && !ampTooSteep && !tooSharp;

  const spacingBad = spacingRatio > LIMITS.stationSpacingRatioMax || stationSpan < LIMITS.stationSpanMin || minGap < 0.16;
  const stationsOffCrest = stationCrestAvg < LIMITS.stationCrestAvgMin || stationCrestMin < LIMITS.stationCrestFloor;
  const phaseClash = state.phaseShift > LIMITS.phaseShift.sweetMax;
  const continuityOk = !spacingBad && !stationsOffCrest && !phaseClash;

  const guidanceOk = !focalClipped && !focalSunk;

  const passedCount = [softOk, rhythmOk, continuityOk, guidanceOk].filter(Boolean).length;

  // 6. 8 类双向失误诊断（按最直观破坏顺序排优先级）
  const faults = [];
  if (tooSharp) {
    faults.push({
      id: "sharp",
      pillar: "soft",
      short: "波峰尖折",
      badge: `尖折 ${Math.round(maxTurnDeg)}°`,
      headline: `峰顶起尖折（局部转角 ${Math.round(maxTurnDeg)}°），滑向锯齿的紧绷感`,
      why: "波浪形构图靠圆润转折维持亲和力。局部转向角超过 38° 时，视知觉关联场在峰顶被迫急刹，柔和流动立刻变成 040 锯齿形构图的尖锐冲撞。",
      action: "把「峰顶尖折」滑轨拉回 20% 以内，或点画布上的红标一键抚圆波峰。",
      fix: (s) => ({ ...s, sharpness: 0.04 }),
    });
  }
  if (freqTooHigh) {
    faults.push({
      id: "freqHigh",
      pillar: "rhythm",
      short: "频率过密",
      badge: `${state.cycles.toFixed(1)} 波过密`,
      headline: `画幅里挤进 ${state.cycles.toFixed(1)} 个碎浪，视觉开始发颤`,
      why: "波浪不是波峰越多越有韵律。当重复频率过高、波峰挤成密纹，视皮层容易产生条纹视觉不适（Wilkins 1984），视线失去从容停顿的节拍。",
      action: "在画布上向左横拖（或按 ← 键），把周期波数舒展到 2.2–3.3 个完整起伏。",
      fix: (s) => ({ ...s, cycles: 2.85 }),
    });
  }
  if (freqTooLow) {
    faults.push({
      id: "freqLow",
      pillar: "rhythm",
      short: "退化单弧",
      badge: `仅 ${state.cycles.toFixed(1)} 波`,
      headline: `全幅不到 2.2 个起伏，建不起「重复韵律」`,
      why: "波浪形构图区别于 036 C 形与 037 S 形的核心，在于波形至少出现重复的峰谷节拍。周期太少时只剩一条孤立弯弧，节奏延续无从谈起。",
      action: "在画布上向右横拖（或按 → 键），把周期波数拉升到 2.3–3.2 区间。",
      fix: (s) => ({ ...s, cycles: 2.65 }),
    });
  }
  if (ampTooFlat) {
    faults.push({
      id: "ampFlat",
      pillar: "soft",
      short: "起伏过扁",
      badge: `波幅 ${Math.round(state.amplitude * 100)}%`,
      headline: `波幅压到 ${Math.round(state.amplitude * 100)}%，几乎退化成僵直横线`,
      why: "起伏太浅时，波峰和波谷拉不开高低势差，视线就像沿着一条死板横杠平推过去，丢失了波浪的呼吸与活力。",
      action: "把「起伏波幅」滑轨推到 10%–22% 的柔和舒适带。",
      fix: (s) => ({ ...s, amplitude: 0.145 }),
    });
  }
  if (ampTooSteep) {
    faults.push({
      id: "ampSteep",
      pillar: "soft",
      short: "波坡过陡",
      badge: `斜坡 ${Math.round(maxSlopeDeg)}°`,
      headline: `起伏飙到 ${Math.round(state.amplitude * 100)}%（坡角 ${Math.round(maxSlopeDeg)}°），像过山车一样急坠`,
      why: "波幅过大时，波壁陡立、留白被上下挤碎，眼睛每翻一个浪都要剧烈跳动，失去了原海报强调的「舒适、轻松」的水平导流体验。",
      action: "把「起伏波幅」收回 10%–22% 区间，让浪势重新变得宽缓。",
      fix: (s) => ({ ...s, amplitude: 0.155 }),
    });
  }
  if (spacingBad || stationsOffCrest) {
    const reasonText = spacingBad
      ? `三枚站点跨幅仅 ${Math.round(stationSpan * 100)}%（步距比 ${spacingRatio.toFixed(1)}×），挤成一团`
      : "三枚信息站点滑落波谷或斜坡，没有稳稳坐上波峰";
    faults.push({
      id: "stations",
      pillar: "continuity",
      short: spacingBad ? "节拍扎堆" : "站点脱峰",
      badge: spacingBad ? `步距 ${spacingRatio.toFixed(1)}×` : "偏离波峰",
      headline: reasonText,
      why: "原海报把「柔和波动 / 重复韵律 / 连续引导」三枚圆徽稳稳托在三座波峰上，用等拍波峰充当视觉落脚点。一旦站点挤偏或沉谷，视线扫过波峰却扑空，连续引导就断拍了。",
      action: "直接在画布上左右拖动三枚白色圆徽落到三座波峰（或点画布红标自动落峰）。",
      fix: (s) => ({ ...s, stations: idealCrestStations(s.cycles) }),
    });
  }
  if (phaseClash) {
    faults.push({
      id: "phase",
      pillar: "continuity",
      short: "浪层逆切",
      badge: `错相 ${Math.round(state.phaseShift * 100)}%`,
      headline: `后景海浪与主浪错相 ${Math.round(state.phaseShift * 100)}%，前后斜切互相打架`,
      why: "多条波浪层叠时，远近浪势需要同向共频地烘托主路径。一旦远浪逆相斜切主浪脊，交叉点会抢走注意力，让版面显得嘈杂慌乱。",
      action: "把「浪层错相」滑轨降到 25% 以内，让三层松石青浪带同频共振。",
      fix: (s) => ({ ...s, phaseShift: 0.06 }),
    });
  }
  if (focalClipped || focalSunk) {
    faults.push({
      id: "focal",
      pillar: "guidance",
      short: focalClipped ? "焦点贴边" : "焦点沉谷",
      badge: focalClipped ? "贴边滑出" : "沉入波谷",
      headline: focalClipped
        ? "暖阳主焦点贴近画框边缘，视线被浪直接甩出画面"
        : "暖阳主焦点沉在浪谷深处，波浪没有把它托举出来",
      why: "波浪形构图里，波峰是天然的托举台。原海报把冲浪者与暖阳圆放在右侧高耸主峰上，才让整条波动视线在终点有一个明朗的落焦高潮。",
      action: "直接在画布上拖动金色太阳圆（或点红标），让它稳稳乘在主海浪的波峰上。",
      fix: (s) => ({ ...s, focalU: nearestUpperCrest(0.72, s.cycles) }),
    });
  }

  // 7. 视觉流态档位（示意，绝不写假精确百分比）
  let flowGrade = "杂乱失拍（示意）";
  if (passedCount === 4) {
    flowGrade = state.amplitude <= 0.13 ? "宽缓静谧（示意）" : state.cycles >= 3.0 ? "轻快明朗（示意）" : "舒朗流畅（示意）";
  } else if (passedCount === 3) {
    flowGrade = "基本成势（示意）";
  } else if (passedCount === 2) {
    flowGrade = "半顺半阻（示意）";
  }

  // 8. 构造顶层白话诊单
  const primaryFault = faults[0] || null;
  let diagnosis;
  if (!primaryFault) {
    const modeDesc =
      state.cycles < 2.55
        ? "偏舒缓的宽浪节奏，留白通透，适合旅游宣传与慢生活品牌横幅。"
        : state.cycles > 3.0
          ? "偏轻快的活波节拍，律动鲜明，适合音乐节、运动主题与年轻活动。"
          : "接近原海报的黄金三峰节拍，起伏柔和、站点等拍落峰、冲浪焦点高托于右峰。";
    diagnosis = {
      ok: true,
      badge: "4/4 · 韵律贯通",
      headline: "波形柔和、节拍匀称，视线一路乘浪流向暖阳焦点",
      why: `当前实测 ${state.cycles.toFixed(2)} 周期、波幅 ${Math.round(state.amplitude * 100)}%、最大局部转向角仅 ${Math.round(maxTurnDeg)}°。${modeDesc}`,
      action: "可以继续拖画布探索更宽或更轻快的合法解，或点「沿浪巡游」观察完整眼动流线，也可点「试错」体验边界失衡。",
    };
  } else {
    diagnosis = {
      ok: false,
      badge: `${passedCount}/4 · ${primaryFault.short}`,
      headline: primaryFault.headline,
      why: primaryFault.why,
      action: primaryFault.action,
      faultId: primaryFault.id,
    };
  }

  // 9. 三枚原海报黄金胶囊支柱状态（1:1 呼应原海报：柔和波动 / 重复韵律 / 连续引导）
  const pillars = {
    soft: {
      ok: softOk,
      tag: softOk ? `柔弧 ${Math.round(maxTurnDeg)}°` : tooSharp ? `尖折 ${Math.round(maxTurnDeg)}°` : ampTooFlat ? "过扁僵直" : "过陡急坠",
      dots: softOk ? 5 : tooSharp ? 1 : 2,
    },
    rhythm: {
      ok: rhythmOk && !phaseClash,
      tag:
        rhythmOk && !phaseClash
          ? `${state.cycles.toFixed(1)} 周期匀拍`
          : freqTooHigh
            ? `${state.cycles.toFixed(1)} 波过密`
            : freqTooLow
              ? `${state.cycles.toFixed(1)} 波不足`
              : "浪层逆切",
      dots: rhythmOk && !phaseClash ? 5 : rhythmOk || !phaseClash ? 3 : 1,
    },
    guidance: {
      ok: continuityOk && guidanceOk,
      tag:
        continuityOk && guidanceOk
          ? "三站落峰 · 焦点乘浪"
          : spacingBad || stationsOffCrest
            ? spacingBad
              ? `步距 ${spacingRatio.toFixed(1)}×`
              : "站点脱峰"
            : focalClipped
              ? "焦点贴边"
              : "焦点沉谷",
      dots: continuityOk && guidanceOk ? 5 : continuityOk || guidanceOk ? 3 : 1,
    },
  };

  return {
    pts,
    upperPts,
    crests,
    troughs,
    stations: stRaw,
    focal: { u: state.focalU, y: focalY, w: focalW, slopeRad: focalSlopeRad, ok: guidanceOk, clipped: focalClipped, sunk: focalSunk },
    metrics: {
      cycles: state.cycles,
      amplitudePct: Math.round(state.amplitude * 100),
      maxTurnDeg: Math.round(maxTurnDeg),
      maxSlopeDeg: Math.round(maxSlopeDeg),
      spacingRatio: Number(spacingRatio.toFixed(2)),
      stationCrestPct: Math.round(clamp((stationCrestAvg + 1) * 50, 0, 100)),
      phaseClashPct: Math.round(state.phaseShift * 100),
      crestCount: crests.length,
      flowGrade,
    },
    checks: { softOk, rhythmOk, continuityOk, guidanceOk },
    passedCount,
    faults,
    diagnosis,
    pillars,
  };
}
