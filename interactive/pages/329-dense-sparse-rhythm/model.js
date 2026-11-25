// 329 疏密相间构图 — 单真源核心模型
// 所有坐标均采用 0..1 归一化画幅空间；画布绘制、节奏波形、三圆徽状态与文字点评全部读取此模块实时计算结果。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 墨点蓝圆",
    short: "原海报",
    caption: "承袭 329 原海报：纯黑渐变点阵由密入疏，克莱因蓝圆在疏朗处独成焦点，底沿蓝色曲线随实际墨量起伏。",
  },
  scroll: {
    id: "scroll",
    label: "宋人长卷 · 疏林孤舟",
    short: "宋人长卷",
    caption: "借南宋夏圭长卷节奏：浓墨苔点与峰峦结密成阵，烟波留白处以一叶青蓝孤舟定神。",
  },
  editorial: {
    id: "editorial",
    label: "现代版面 · 报刊图文",
    short: "现代版面",
    caption: "转译为当代页面：次要图文与注释聚拢成紧凑密块，核心主视觉与行动焦点退进大疏空里。",
  },
};

export const PRESETS = {
  // 开场刻意停在「匀铺无律 + 焦点被吞」双错态，绝不先给答案
  opening: {
    label: "复原开场",
    gather: 0.05,
    ink: 0.56,
    mode: "single",
    evenSplit: false,
    focus: { u: 0.36, v: 0.46 },
    eye: { u: 0.88, v: 0.65 },
  },
  posterGrad: {
    label: "原海报渐散",
    gather: 0.66,
    ink: 0.54,
    mode: "single",
    evenSplit: false,
    focus: { u: 0.84, v: 0.36 },
    eye: { u: 0.88, v: 0.66 },
  },
  doubleRhythm: {
    label: "双峰相间",
    gather: 0.72,
    ink: 0.56,
    mode: "double",
    evenSplit: false,
    focus: { u: 0.56, v: 0.37 },
    eye: { u: 0.58, v: 0.70 },
  },
  cornerHorse: {
    label: "边角走马",
    gather: 0.70,
    ink: 0.52,
    mode: "corner",
    evenSplit: false,
    focus: { u: 0.78, v: 0.32 },
    eye: { u: 0.82, v: 0.64 },
  },
  errCliff: {
    label: "试错：断崖",
    gather: 0.98,
    ink: 0.58,
    mode: "single",
    evenSplit: false,
    focus: { u: 0.84, v: 0.38 },
    eye: { u: 0.88, v: 0.66 },
  },
  errCrowded: {
    label: "试错：迫塞",
    gather: 0.38,
    ink: 0.96,
    mode: "single",
    evenSplit: false,
    focus: { u: 0.52, v: 0.45 },
    eye: { u: 0.88, v: 0.66 },
  },
  errEmpty: {
    label: "试错：空松",
    gather: 0.62,
    ink: 0.16,
    mode: "single",
    evenSplit: false,
    focus: { u: 0.82, v: 0.38 },
    eye: { u: 0.88, v: 0.66 },
  },
  errEqual: {
    label: "试错：等宽",
    gather: 0.76,
    ink: 0.58,
    mode: "double",
    evenSplit: true,
    focus: { u: 0.50, v: 0.42 },
    eye: { u: 0.50, v: 0.72 },
  },
};

export const FOCUS_RADIUS = 0.088; // 蓝圆基准半径（按画布短边比例）
export const PAD_X = 0.055;
export const PAD_Y = 0.08;

const COLS = 22;
const ROWS = 15;
const SLICE_COUNT = 16;
const GRID_COLS = 10;
const GRID_ROWS = 6;

function hash2(c, r, salt = 0) {
  const n = Math.sin(c * 127.1 + r * 311.7 + salt * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function createInitialState() {
  const p = PRESETS.opening;
  return {
    theme: "poster",
    gather: p.gather,
    ink: p.ink,
    mode: p.mode,
    evenSplit: p.evenSplit,
    focus: { ...p.focus },
    eye: { ...p.eye },
  };
}

// 生成实绘墨点阵列：
// r 以有效画布面积基准 sqrt(w * fieldH) 归一化，因此单颗点在画幅上的真实覆盖面积恒为 π * r²，
// 不随 1440 / 2560 / 390 / 844 屏幕长宽比漂移，同时绘制时保持严格正圆。
export function generateField(state) {
  const { gather, ink, mode, evenSplit, eye } = state;
  const g = clamp(gather, 0, 1);
  const k = clamp(ink, 0.12, 1);
  const pts = [];

  const spanX = 1 - PAD_X * 2;
  const spanY = 1 - PAD_Y * 2;

  for (let r = 0; r < ROWS; r++) {
    const vn = r / (ROWS - 1);
    const baseV = PAD_Y + vn * spanY;
    const vertBell = 0.52 + 0.48 * Math.sin(vn * Math.PI);

    for (let c = 0; c < COLS; c++) {
      const un = c / (COLS - 1);
      const j1 = hash2(c, r, 1);
      const j2 = hash2(c, r, 2);
      const j3 = hash2(c, r, 3);

      let u = PAD_X + un * spanX;
      let v = baseV;
      let localStrength = 0.72;

      if (mode === "single") {
        const cliffPow = g > 0.82 ? 1 + (g - 0.82) * 14 : 1;
        const expCurve = 1 + g * 2.15 * cliffPow;
        const compressedU = Math.pow(un, expCurve);
        const scatterGate = g > 0.86 ? Math.max(0, 1 - (g - 0.86) / 0.10) : 1;
        const jitterU = (j1 - 0.5) * 0.10 * g * Math.pow(un, 0.75) * scatterGate;
        const jitterV = (j2 - 0.5) * 0.075 * g * Math.pow(un, 0.9) * scatterGate;
        // 忠实 329 原海报：g=0.66 时渐散带于右约 74% 处消散，让出右侧净黄走马海托蓝圆；g>0.86 硬锁成黑墙
        const naturalReach = 1 - g * 0.38;
        const wallCap = g > 0.86 ? naturalReach * (1 - ((g - 0.86) / 0.14) * 0.70) : naturalReach;
        const shapedU = compressedU * wallCap;

        u = PAD_X + clamp(shapedU * spanX + jitterU, 0, spanX);
        v = PAD_Y + clamp(vn * spanY + jitterV, 0, spanY);

        const horizDecay = Math.exp(-Math.pow(un / Math.max(0.24, 0.82 - g * 0.42), 1.72));
        localStrength = (1 - g) * 0.72 + g * (0.10 + 0.90 * horizDecay * (0.58 + 0.42 * vertBell));
      } else if (mode === "double") {
        const splitIdx = evenSplit ? 0.5 : 0.65;
        const isLeft = un < splitIdx;
        const tLocal = isLeft ? un / splitIdx : (un - splitIdx) / (1 - splitIdx);

        const leftCenter = evenSplit ? 0.20 : 0.17;
        const rightCenter = evenSplit ? 0.80 : 0.86;
        const leftSpread = evenSplit ? 0.13 : 0.16;
        const rightSpread = evenSplit ? 0.13 : 0.095;

        const targetU = isLeft
          ? leftCenter + (tLocal - 0.5) * 2 * leftSpread * (1.22 - g * 0.34)
          : rightCenter + (tLocal - 0.5) * 2 * rightSpread * (1.22 - g * 0.34);

        const scatter = (j1 - 0.5) * 0.075 * g * (evenSplit ? 0.15 : 1);
        const rawU = (1 - g) * (PAD_X + un * spanX) + g * clamp(targetU + scatter, PAD_X, 1 - PAD_X);
        u = clamp(rawU, PAD_X, 1 - PAD_X);
        v = PAD_Y + clamp(vn * spanY + (j2 - 0.5) * 0.045 * g, 0, spanY);

        const distPeak = isLeft ? Math.abs(tLocal - 0.42) * 2 : Math.abs(tLocal - 0.52) * 2;
        const peakGain = isLeft ? 1.0 : evenSplit ? 1.0 : 0.72;
        const falloff = Math.exp(-distPeak * distPeak * 1.45);
        localStrength = (1 - g) * 0.72 + g * (0.14 + 0.86 * falloff * peakGain * (0.62 + 0.38 * vertBell));
      } else {
        const diag = un * 0.72 + (1 - vn) * 0.65;
        const pull = Math.pow(clamp(diag / 1.37, 0, 1), 1 + g * 1.85);
        const cornerU = PAD_X + clamp(un * (1 - g * 0.66) + (j1 - 0.5) * 0.07 * g * un, 0, 1) * spanX;
        const cornerV = PAD_Y + clamp(1 - (1 - vn) * (1 - g * 0.56) + (j2 - 0.5) * 0.06 * g * (1 - vn), 0, 1) * spanY;
        u = (1 - g) * (PAD_X + un * spanX) + g * cornerU;
        v = (1 - g) * baseV + g * cornerV;

        const cornerDecay = Math.exp(-pull * pull * 3.2);
        localStrength = (1 - g) * 0.72 + g * (0.10 + 0.90 * cornerDecay);
      }

      // 气眼 "+" 周围柔和呼吸排斥
      const dEye = Math.hypot(u - eye.u, v - eye.v);
      if (dEye < 0.105 && g > 0.25 && localStrength < 0.42) {
        const push = (0.105 - dEye) * 0.45 * g;
        const ang = Math.atan2(v - eye.v, u - eye.u);
        u = clamp(u + Math.cos(ang) * push, PAD_X, 1 - PAD_X);
        v = clamp(v + Math.sin(ang) * push, PAD_Y, 1 - PAD_Y);
      }

      // 根据总墨量 ink 控制点阵留存（低 ink 显著变空，高 ink 全数留存并膨大）
      const keepProb = k < 0.26
        ? clamp((localStrength * 0.55 + 0.2) * (k * 1.65), 0, 1)
        : clamp((localStrength * 0.72 + 0.28) * (k * 1.52), 0, 1.25);
      if (j3 > keepProb && !(g < 0.15 && k > 0.42)) {
        continue;
      }

      // 半径基准：饱满贴近 329 原海报，且匀铺时全幅覆盖率稳在 ~21–24%
      const baseR = 0.0052 + k * 0.0155;
      const sizeContrast = (1 - g) * 0.88 + g * (0.16 + 1.24 * Math.pow(localStrength, 1.12));
      const crowdBoost = k > 0.74 ? 1 + (k - 0.74) * 2.15 : 1;
      const emptyShrink = k < 0.26 ? 0.58 + (k / 0.26) * 0.42 : 1;
      const radius = clamp(baseR * sizeContrast * crowdBoost * emptyShrink, 0.0024, 0.036);

      if (radius < 0.0034 && g > 0.35 && j1 > 0.45) continue;

      pts.push({
        u,
        v,
        r: radius,
        strength: localStrength,
        seed: j1,
        col: c,
        row: r,
      });
    }
  }

  return pts;
}

// 单真源评估：只在有效画心 [PAD_X, 1-PAD_X] × [PAD_Y, 1-PAD_Y] 上分 24 切片与 12×8 网格实算
export function evaluate(state, pts, aspect = 1.45) {
  const spanX = 1 - PAD_X * 2;
  const spanY = 1 - PAD_Y * 2;
  const innerArea = spanX * spanY;
  const sliceArea = innerArea / SLICE_COUNT;
  const cellArea = innerArea / (GRID_COLS * GRID_ROWS);

  const sliceInk = new Float64Array(SLICE_COUNT);
  const gridInk = new Float64Array(GRID_COLS * GRID_ROWS);

  let totalDotArea = 0;
  let focusIntruders = 0;
  let focusHaloInk = 0;

  // 在等效面积空间中换算蓝圆护城河与点距（与屏幕比例无关，且和画布实绘完全一致）
  const safeAspect = clamp(aspect || 1.45, 0.75, 2.5);
  const shortNorm = 1 / Math.sqrt(safeAspect); // shortSide / sqrt(w*h)
  const focusRGeo = FOCUS_RADIUS * shortNorm;
  const moatR = focusRGeo * 1.65;
  const moatArea = Math.PI * moatR * moatR;

  const sxFactor = Math.sqrt(safeAspect);
  const syFactor = 1 / sxFactor;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    // 严格真实的归一化面积占用 π * r²
    const area = Math.PI * p.r * p.r;
    totalDotArea += area;

    // 映射到有效画心 16 切片（加轻量三点平滑核，消除 22 列投进切片的鸽巢混叠）
    const relU = clamp((p.u - PAD_X) / spanX, 0, 0.9999);
    const relV = clamp((p.v - PAD_Y) / spanY, 0, 0.9999);
    const sx = Math.floor(relU * SLICE_COUNT);
    if (sx > 0 && sx < SLICE_COUNT - 1) {
      sliceInk[sx - 1] += area * 0.22;
      sliceInk[sx] += area * 0.56;
      sliceInk[sx + 1] += area * 0.22;
    } else if (sx === 0) {
      sliceInk[0] += area * 0.78;
      sliceInk[1] += area * 0.22;
    } else {
      sliceInk[SLICE_COUNT - 2] += area * 0.22;
      sliceInk[SLICE_COUNT - 1] += area * 0.78;
    }

    const gx = Math.floor(relU * GRID_COLS);
    const gy = Math.floor(relV * GRID_ROWS);
    gridInk[gy * GRID_COLS + gx] += area;

    // 真实欧氏距离（统一在 sqrt(w*h)=1 坐标系下，严格对应画布像素距离）
    const dx = (p.u - state.focus.u) * sxFactor;
    const dy = (p.v - state.focus.v) * syFactor;
    const dist = Math.hypot(dx, dy);
    if (dist < moatR + p.r) {
      const overlap = clamp((moatR + p.r - dist) / Math.max(0.01, moatR), 0, 1);
      focusHaloInk += area * (0.45 + 0.55 * overlap);
      // 仅将具备实质视觉分量的粗密墨点计入侵扰（极疏的细星点不吞主角）
      if (p.r >= 0.0085 || dist < focusRGeo * 1.18) focusIntruders++;
    }
  }

  // 每条切片在有效画心内的真实覆盖率 0..100
  const profile = Array.from(sliceInk, (a) => clamp((a / sliceArea) * 100, 0, 100));
  const gridPct = Array.from(gridInk, (a) => clamp((a / cellArea) * 100, 0, 100));

  const sortedSlices = [...profile].sort((a, b) => a - b);
  const valleyDensity = (sortedSlices[0] + sortedSlices[1] + sortedSlices[2]) / 3;
  const peakDensity =
    (sortedSlices[SLICE_COUNT - 1] + sortedSlices[SLICE_COUNT - 2] + sortedSlices[SLICE_COUNT - 3]) / 3;
  const contrastRatio = peakDensity / Math.max(valleyDensity, 2.0);

  const totalCoverage = clamp((totalDotArea / innerArea) * 100, 0, 100);

  let sparseCells = 0;
  let transitionCells = 0;
  let denseCells = 0;
  let chokedCells = 0;

  for (let i = 0; i < gridPct.length; i++) {
    const d = gridPct[i];
    if (d < 10) sparseCells++;
    else if (d < 34) transitionCells++;
    else denseCells++;
    if (d > 78) chokedCells++;
  }

  const totalCells = GRID_COLS * GRID_ROWS;
  const sparseAreaPct = Math.round((sparseCells / totalCells) * 100);
  const transitionPct = Math.round((transitionCells / totalCells) * 100);
  const denseAreaPct = Math.round((denseCells / totalCells) * 100);
  const chokedPct = Math.round((chokedCells / totalCells) * 100);

  // 波形动态波动度
  let diffSum = 0;
  for (let i = 1; i < profile.length; i++) diffSum += Math.abs(profile[i] - profile[i - 1]);
  const waveRoughness = diffSum / (profile.length - 1);

  const focusClearPct = Math.round(clamp(100 - (focusHaloInk / Math.max(0.0005, moatArea)) * 185, 0, 100));
  const edgeX = Math.min(state.focus.u, 1 - state.focus.u);
  const edgeY = Math.min(state.focus.v, 1 - state.focus.v);
  const focusEdgePct = Math.round(Math.min(edgeX * safeAspect, edgeY) * 100);

  const leftHalfSum = profile.slice(0, SLICE_COUNT / 2).reduce((a, b) => a + b, 0);
  const rightHalfSum = profile.slice(SLICE_COUNT / 2).reduce((a, b) => a + b, 0);
  const dualRatio = Math.max(leftHalfSum, rightHalfSum) / Math.max(1, Math.min(leftHalfSum, rightHalfSum));

  const contrastOk = peakDensity >= 28 && contrastRatio >= 3.0 && totalCoverage >= 7 && totalCoverage <= 45;
  const isCliff = state.mode === "single" && transitionPct < 8 && state.gather > 0.85 && peakDensity >= 26;
  const isEqualSplit = state.mode === "double" && state.evenSplit && dualRatio < 1.18 && contrastRatio >= 2.2;
  const rhythmOk = contrastOk && !isCliff && !isEqualSplit && waveRoughness >= 1.8 && sparseAreaPct >= 24;
  const breathOk = sparseAreaPct >= 25 && chokedPct < 24 && focusIntruders <= 2 && focusClearPct >= 82 && focusEdgePct >= 9;

  let status = "rhythm_grad";
  let ok = false;
  let badge = "疏密成韵";
  let headline = "";
  let reason = "";
  let hint = "";
  let quickAction = null;

  if (totalCoverage < 6.5 || peakDensity < 18) {
    status = "empty";
    badge = "疏而空松";
    headline = `全幅总墨量仅 ${Math.round(totalCoverage)}%，最密处也只剩 ${Math.round(peakDensity)}%`;
    reason = "画面只剩零星散点，没有聚拢起足够分量的密区做反衬。沈宗骞讲「疏不嫌空松」——没有密，疏就变成空荡。";
    hint = "把「总墨量」往右拉回 45%–65%，先在局部立住一块沉实的密群。";
    quickAction = { label: "补足密区墨量", patch: { ink: 0.54, gather: 0.66 } };
  } else if (totalCoverage > 44 || chokedPct >= 28) {
    status = "crowded";
    badge = "密而迫塞";
    headline = `画心铺墨高达 ${Math.round(totalCoverage)}%，可供呼吸的疏朗空域只剩 ${sparseAreaPct}%`;
    reason = "黑点胀大并塞满绝大部分画幅，视线找不到停顿喘息的空当。古论称「密不嫌迫塞」——密也要留得出气口。";
    hint = "把「总墨量」调低或继续向右拖大「聚散势」，让出至少三分之一的明黄呼吸空域。";
    quickAction = { label: "减负并拉开疏域", patch: { ink: 0.54, gather: 0.66, focus: { u: 0.84, v: 0.36 } } };
  } else if (contrastRatio < 2.6) {
    status = "flat";
    badge = "匀铺无律";
    headline = `密处 ${Math.round(peakDensity)}% 与疏处 ${Math.round(valleyDensity)}% 几乎一样密，底沿波形拉成了直线`;
    reason = "所有墨点像墙纸一样均匀铺开，没有重拍也没有停顿。眼睛扫过整幅画速度毫无起伏，根本读不出节奏。";
    hint = "在画布上向右横拖，把散落的墨点聚成密群、腾出疏朗空域，再把蓝圆拖进空白处。";
    quickAction = { label: "示范：拉开疏密渐变", patch: { gather: 0.66, ink: 0.54, mode: "single", evenSplit: false } };
  } else if (isCliff) {
    status = "cliff";
    badge = "硬劈断崖";
    headline = `过渡缓冲带只剩 ${transitionPct}%，墨点被死挤成左侧一堵黑墙`;
    reason = "疏密相间不是把画面生硬劈成「全黑条 + 全黄板」。看 329 原海报中段，粗点向右渐细渐散的坡度，才是把疏和密连成一气的桥。";
    hint = "在画布上稍微向左回拉聚散势（回到约 58%–76%），放出由密入疏的过渡散点。";
    quickAction = { label: "放缓坡度留过渡", patch: { gather: 0.66 } };
  } else if (isEqualSplit) {
    status = "equalSplit";
    badge = "等宽呆板";
    headline = `左右两簇密群墨量比仅 ${dualRatio.toFixed(2)}×，对称平分成了机械条纹`;
    reason = "两块密区一模一样重、距离完全等宽，就像等拍的节拍器——齐整，却没有一重一轻的呼吸感。";
    hint = "切回主次有别的「双峰相间」或「原海报渐散」，让一块主密峰配一块轻次峰。";
    quickAction = { label: "改为一重一轻双峰", patch: { evenSplit: false, focus: { u: 0.56, v: 0.37 } } };
  } else if (sparseAreaPct < 22) {
    status = "crowded";
    badge = "密而迫塞";
    headline = `疏朗空域只剩 ${sparseAreaPct}%，画面仍偏堵闷`;
    reason = "虽然分出了轻重，但可供视线休止的空白仍不到四分之一，画面显得局促紧绷。";
    hint = "把「聚散势」再往右推一点，或略降「总墨量」，腾出开阔的走马疏域。";
    quickAction = { label: "腾出疏朗空域", patch: { ink: 0.52, gather: 0.68 } };
  } else if (focusIntruders > 2 || focusClearPct < 82) {
    status = "focusBuried";
    badge = "焦点被吞";
    headline = `克莱因蓝圆周围挤进了 ${focusIntruders} 颗黑点，净空呼吸圈只剩 ${focusClearPct}%`;
    reason = "密区已经聚出了声势，但主角还陷在黑点丛里和背景打架。原海报写着「留白创造空间与焦点」——要把最重的一笔请到最疏朗处。";
    hint = "直接按住画布上的蓝色圆点，把它拖进右侧（或中段）开阔干净的明黄疏朗区。";
    quickAction = {
      label: "请蓝圆入疏朗处",
      patch: {
        focus: state.mode === "double" ? { u: 0.56, v: 0.37 } : { u: 0.84, v: 0.36 },
      },
    };
  } else if (focusEdgePct < 9) {
    status = "focusEdge";
    badge = "焦点挤边";
    headline = `蓝圆距画框边沿仅剩 ${focusEdgePct}%，视觉重量要滑出画外`;
    reason = "太贴边会让焦点被画框夹紧，原本开阔的疏朗区反而显得局促。往内收一点，让四面都有明黄托住它。";
    hint = "把蓝色圆点往画布内侧轻拖几步，留足四周喘息边距。";
    quickAction = {
      label: "收回疏域腹地",
      patch: {
        focus: state.mode === "double" ? { u: 0.56, v: 0.38 } : { u: 0.82, v: 0.38 },
      },
    };
  } else {
    ok = true;
    if (state.mode === "double") {
      status = "rhythm_double";
      badge = "双峰相间";
      headline = `左重右轻双密峰夹出 ${sparseAreaPct}% 疏朗气道，蓝圆稳落中疏处`;
      reason = `密处达 ${Math.round(peakDensity)}%、疏谷低至 ${Math.round(valleyDensity)}%，左右峰势比 ${dualRatio.toFixed(1)}×，视线走过「重拍—喘息—轻拍」一气贯通。`;
      hint = "可以继续试试「原海报渐散」或「边角走马」，比较不同章法的呼吸感。";
    } else if (state.mode === "corner") {
      status = "rhythm_corner";
      badge = "边角走马";
      headline = `墨群沉聚左下角，右上敞开 ${sparseAreaPct}% 走马疏域遥托蓝圆`;
      reason = `一角结密、大面疏朗（密 ${Math.round(peakDensity)}% 对疏 ${Math.round(valleyDensity)}%），蓝圆净空 ${focusClearPct}%，如宋人边角山水般以小见大。`;
      hint = "试着再把蓝圆拖回墨群里，感受一下主角瞬间失去呼吸圈的反差。";
    } else {
      status = "rhythm_grad";
      badge = "疏密成韵";
      headline = `密区 ${Math.round(peakDensity)}% 经 ${transitionPct}% 坡度渐散至疏谷 ${Math.round(valleyDensity)}%，蓝圆独得净空`;
      reason = `左密厚重、中段颗粒渐稀过渡自然、右侧 ${sparseAreaPct}% 疏朗留白托起蓝圆（周遭 ${focusIntruders} 颗侵入），正是 329 原海报的呼吸节律。`;
      hint = "也可以切换「双峰相间」或试试上方的「宋人长卷」「现代版面」，看同一套法则如何换衣不换骨。";
    }
  }

  const pillars = {
    contrast: {
      ok: contrastOk,
      tag: contrastOk ? `反差 ${contrastRatio.toFixed(1)}×` : totalCoverage < 6.5 ? "缺密区" : totalCoverage > 44 ? "全幅满" : `仅 ${contrastRatio.toFixed(1)}×`,
      detail: contrastOk
        ? `密区 ${Math.round(peakDensity)}% 对疏谷 ${Math.round(valleyDensity)}%，强弱分明`
        : totalCoverage < 6.5
          ? "密区太虚，留白失去了参照物"
          : totalCoverage > 44
            ? "通篇偏满，看不出哪松哪紧"
            : "密疏落差不足，通篇接近匀铺",
    },
    rhythm: {
      ok: rhythmOk,
      tag: rhythmOk ? "起伏流畅" : isCliff ? "硬劈断崖" : isEqualSplit ? "机械平分" : "波形平直",
      detail: rhythmOk
        ? `经 ${transitionPct}% 散点坡度交替起伏，成韵`
        : isCliff
          ? "缺过渡散点，像黑墙硬贴黄纸"
          : isEqualSplit
            ? "两峰等大等距，缺轻重变化"
            : "底沿波形几乎走平，缺少停顿拍",
    },
    breath: {
      ok: breathOk,
      tag: breathOk ? `净空 ${focusClearPct}%` : focusIntruders > 2 ? `侵扰 ${focusIntruders} 点` : focusEdgePct < 9 ? "焦贴画边" : `疏空 ${sparseAreaPct}%`,
      detail: breathOk
        ? `疏域占 ${sparseAreaPct}%，蓝圆稳享干净呼吸圈`
        : focusIntruders > 2
          ? `蓝圆陷在密点里，周边 ${focusIntruders} 点紧逼`
          : focusEdgePct < 9
            ? "焦点太靠边沿，四周透气不足"
            : "整幅疏朗余地偏窄，视觉偏闷",
    },
  };

  return {
    ok,
    status,
    badge,
    headline,
    reason,
    hint,
    quickAction,
    profile,
    totalCoverage: Math.round(totalCoverage),
    peakDensity: Math.round(peakDensity),
    valleyDensity: Math.round(valleyDensity),
    contrastRatio,
    sparseAreaPct,
    transitionPct,
    denseAreaPct,
    focusIntruders,
    focusClearPct,
    focusEdgePct,
    dualRatio,
    pillars,
    rhythmTier: ok ? (state.mode === "double" ? "交替成韵（示意）" : "渐散成韵（示意）") : `${badge}（示意）`,
  };
}
