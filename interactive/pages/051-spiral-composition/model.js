// 051 螺旋构图 · 单真源几何模型与双向诊断引擎
// 画布绘制、黄金分格蓝图、四维探针、底部四圆徽与灯泡诊单全部只读此模块的实测返回值。

export const PHI = (1 + Math.sqrt(5)) / 2; // 1.6180339887...

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 双带墨螺",
    shortLabel: "原海报",
    coreName: "珊瑚焦核",
    hint: "深蓝墨带由外卷入，珊瑚内带收锋归心",
  },
  wave: {
    id: "wave",
    label: "浮世绘 · 巨浪归峰",
    shortLabel: "巨浪归峰",
    coreName: "远山赤日",
    hint: "巨浪翻卷形成对数螺旋势能，视线收束于远方孤峰",
  },
  stair: {
    id: "stair",
    label: "建筑 · 旋梯天井",
    shortLabel: "旋梯天井",
    coreName: "底厅圆井",
    hint: "踏步沿对数曲线层层缩小，纵深自然下潜到底厅焦点",
  },
};

export const CURVE_TYPES = {
  log: { id: "log", label: "对数递缩" },
  arch: { id: "arch", label: "阿基米德等距" },
  kink: { id: "kink", label: "硬折拼弧" },
};

// 开场刻意停在 0/4 复合坏态：等距蚊香死缠 3.10 圈 + 无收锋 1.05× + 外缘内缩 58% + 焦核脱轨 34%
export const OPENING_STATE = Object.freeze({
  specimen: "poster",
  curveType: "arch",
  turns: 3.1,
  growth: 1.06,
  taper: 1.05,
  entrySpan: 0.58,
  dir: 1,
  entryAngle: 0.36 * Math.PI,
  eye: { u: 0.56, v: 0.52 },
  core: { u: 0.25, v: 0.30 },
  showGoldenGrid: false,
  activeLayer: null,
});

// 多组合法解（全部稳定 4/4）
export const SOLUTIONS = {
  poster: {
    id: "poster",
    label: "原海报 · 黄金螺",
    note: "k = 1.62，约 1.68 圈，宽外入细内收，焦核稳落右下黄金螺眼",
    patch: {
      curveType: "log",
      turns: 1.68,
      growth: 1.62,
      taper: 4.2,
      entrySpan: 0.88,
      dir: 1,
      entryAngle: 0.34 * Math.PI,
      eye: { u: 0.57, v: 0.52 },
      core: { u: 0.57, v: 0.52 },
    },
  },
  nautilus: {
    id: "nautilus",
    label: "鹦鹉螺 · 缓进深旋",
    note: "贴近真实鹦鹉螺壳实测扩张率（k ≈ 1.35），约 2.12 圈，层层递进更绵密",
    patch: {
      curveType: "log",
      turns: 2.12,
      growth: 1.35,
      taper: 3.5,
      entrySpan: 0.9,
      dir: 1,
      entryAngle: 0.2 * Math.PI,
      eye: { u: 0.54, v: 0.51 },
      core: { u: 0.54, v: 0.51 },
    },
  },
  sweep: {
    id: "sweep",
    label: "宽幅快旋 · 逆时针",
    note: "k = 1.88，约 1.28 圈，逆时针由右上大势切入左下焦眼，留白疏朗",
    patch: {
      curveType: "log",
      turns: 1.28,
      growth: 1.88,
      taper: 4.8,
      entrySpan: 0.92,
      dir: -1,
      entryAngle: -0.18 * Math.PI,
      eye: { u: 0.44, v: 0.55 },
      core: { u: 0.44, v: 0.55 },
    },
  },
};

// 双向试错标本
export const FAILURE_PRESETS = {
  coil: {
    id: "coil",
    label: "蚊香死缠",
    patch: {
      curveType: "arch",
      turns: 3.1,
      growth: 1.06,
      taper: 1.1,
      entrySpan: 0.62,
      dir: 1,
      eye: { u: 0.55, v: 0.52 },
      core: { u: 0.55, v: 0.52 },
    },
  },
  arc: {
    id: "arc",
    label: "退化成短弧",
    patch: {
      curveType: "log",
      turns: 0.62,
      growth: 1.55,
      taper: 3.4,
      entrySpan: 0.84,
      dir: 1,
      eye: { u: 0.57, v: 0.52 },
      core: { u: 0.57, v: 0.52 },
    },
  },
  whip: {
    id: "whip",
    label: "甩鞭外逃",
    patch: {
      curveType: "log",
      turns: 1.45,
      growth: 2.42,
      taper: 3.8,
      entrySpan: 0.9,
      dir: 1,
      eye: { u: 0.57, v: 0.52 },
      core: { u: 0.57, v: 0.52 },
    },
  },
  offcore: {
    id: "offcore",
    label: "螺眼落空",
    patch: {
      curveType: "log",
      turns: 1.68,
      growth: 1.62,
      taper: 4.2,
      entrySpan: 0.88,
      dir: 1,
      eye: { u: 0.57, v: 0.52 },
      core: { u: 0.24, v: 0.28 },
    },
  },
  kink: {
    id: "kink",
    label: "硬折断流",
    patch: {
      curveType: "kink",
      turns: 1.68,
      growth: 1.62,
      taper: 3.6,
      entrySpan: 0.86,
      dir: 1,
      eye: { u: 0.57, v: 0.52 },
      core: { u: 0.57, v: 0.52 },
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createInitialState() {
  return {
    ...OPENING_STATE,
    eye: { ...OPENING_STATE.eye },
    core: { ...OPENING_STATE.core },
  };
}

// 计算归一化径向比例：true logarithmic spiral r(s) = maxR * k^(-4 * turns * s) 保证每转 90° 实测倍比精确等于 k
export function radialFraction(s, curveType, turns, growth) {
  const u = clamp(1 - s, 0, 1); // 1 at outer entry, 0 at inner eye
  if (curveType === "arch") return u;
  const k = clamp(growth, 1.01, 2.6);
  if (k <= 1.03) return u;
  const quarterTurns = clamp(s, 0, 1) * Math.max(0.4, turns) * 4;
  return Math.pow(k, -quarterTurns);
}

// 采样真实画布坐标系里的主螺线、内珊瑚副螺带与外围虚线轨
export function sampleSpiral(state, width, height) {
  const minDim = Math.max(120, Math.min(width, height));
  const eyeX = state.eye.u * width;
  const eyeY = state.eye.v * height;
  const coreX = state.core.u * width;
  const coreY = state.core.v * height;

  const maxR = minDim * 0.455 * clamp(state.entrySpan, 0.42, 0.98);
  const minR = Math.max(13, minDim * 0.062);
  const coreR = Math.max(11, minDim * 0.055);

  const turns = clamp(state.turns, 0.45, 3.4);
  const thetaTotal = turns * Math.PI * 2;
  const dir = state.dir < 0 ? -1 : 1;
  const baseAngle = state.entryAngle;

  // 硬折模式用少数顶点折线直连；平滑模式用 96 采样点（视觉全顺滑且软件渲染零卡顿）
  const isKink = state.curveType === "kink";
  const count = isKink ? Math.max(6, Math.round(turns * 4.4)) : 96;

  const outerHalfW = minDim * 0.068;
  const innerHalfW = outerHalfW / clamp(state.taper, 1.0, 5.5);

  const pts = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const archTurnGap = (maxR - minR) / Math.max(0.75, turns);
  const kEff = clamp(state.growth, 1.02, 2.6);
  const kTurnDrop = Math.max(0.18, 1 - Math.pow(kEff, -4));

  for (let i = 0; i <= count; i++) {
    const s = i / count; // 0 = outer entry, 1 = inner eye
    const angle = baseAngle + dir * s * thetaTotal;
    let r;
    if (state.curveType === "arch") {
      r = minR + (maxR - minR) * (1 - s);
    } else {
      const frac = radialFraction(s, "log", turns, state.growth);
      r = Math.max(minR * 0.85, maxR * frac);
      if (isKink && i > 0 && i < count) {
        r = clamp(r * (i % 2 === 0 ? 1.14 : 0.88), minR * 0.85, maxR * 1.06);
      }
    }
    const x = eyeX + Math.cos(angle) * r;
    const y = eyeY + Math.sin(angle) * r;

    // 防止紧缠时螺带相互吞并，同时保留阿基米德等距螺线「全程均匀粗细」的真实几何特征
    const localGap = state.curveType === "arch" ? archTurnGap : Math.max(10, r * kTurnDrop);
    const rawHalfW = innerHalfW + (outerHalfW - innerHalfW) * Math.pow(1 - s, 1.2);
    const maxSafeHalfW = state.curveType === "arch" ? archTurnGap * 0.27 : localGap * 0.36;
    const halfW = Math.max(2.0, Math.min(rawHalfW, maxSafeHalfW));

    pts.push({ s, angle, r, x, y, halfW, localGap });
    if (x - halfW < minX) minX = x - halfW;
    if (x + halfW > maxX) maxX = x + halfW;
    if (y - halfW < minY) minY = y - halfW;
    if (y + halfW > maxY) maxY = y + halfW;
  }

  // 计算每点切向量与法向量（用于双带多边形与墨珠运动）
  let cumulativeAngle = 0;
  let maxBendDeg = 0;
  let prevDirX = 0, prevDirY = 0;

  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy) || 1;
    pts[i].tx = dx / len;
    pts[i].ty = dy / len;
    pts[i].nx = -pts[i].ty;
    pts[i].ny = pts[i].tx;

    if (i > 0) {
      const segDx = pts[i].x - pts[i - 1].x;
      const segDy = pts[i].y - pts[i - 1].y;
      const segLen = Math.hypot(segDx, segDy) || 1;
      const ux = segDx / segLen;
      const uy = segDy / segLen;
      if (i > 1) {
        const dot = clamp(prevDirX * ux + prevDirY * uy, -1, 1);
        const bend = (Math.acos(dot) * 180) / Math.PI;
        if (bend > maxBendDeg) maxBendDeg = bend;
      }
      prevDirX = ux;
      prevDirY = uy;
      cumulativeAngle += Math.abs(pts[i].angle - pts[i - 1].angle);
    }
  }

  // 采样外圈 90° 间隔的真实半径比（单真源实测扩张倍比，避开触底夹紧段）
  const quarterStep = Math.PI / 2;
  const ratios = [];
  for (let i = 0; i < pts.length; i++) {
    const targetAng = Math.abs(pts[i].angle - baseAngle) + quarterStep;
    if (targetAng > cumulativeAngle * 0.85) break;
    const j = Math.round((targetAng / Math.max(0.01, cumulativeAngle)) * (pts.length - 1));
    if (j > i && j < pts.length && pts[j].r > minR * 0.96) {
      ratios.push(pts[i].r / pts[j].r);
    }
  }
  ratios.sort((a, b) => a - b);
  const measuredQuarterRatio = ratios.length
    ? ratios[Math.floor(ratios.length * 0.5)]
    : state.curveType === "arch"
      ? 1.08
      : state.growth;

  // 外围虚线轨（承袭 051 原海报带两颗海蓝小珠的虚线外轨）
  const orbitR = maxR * 1.11;
  const entryBeadAngle = baseAngle;
  const bead1 = {
    x: eyeX + Math.cos(entryBeadAngle) * orbitR,
    y: eyeY + Math.sin(entryBeadAngle) * orbitR,
    angle: entryBeadAngle,
  };
  const bead2Angle = baseAngle + dir * 0.88 * Math.PI;
  const bead2 = {
    x: eyeX + Math.cos(bead2Angle) * orbitR,
    y: eyeY + Math.sin(bead2Angle) * orbitR,
    angle: bead2Angle,
  };

  // 内层陶土珊瑚双臂螺带（与深蓝外带呈约 0.92π 对向交织，1:1 复刻 051 原海报右下淡桃入红的优雅收束）
  const coralCount = isKink ? Math.max(5, Math.round(count * 0.7)) : 72;
  const coralPts = [];
  const coralMaxR = state.curveType === "arch" ? maxR * 0.56 : maxR * 0.82;
  const coralPhase = baseAngle + dir * (state.curveType === "arch" ? 0.52 * Math.PI : 0.94 * Math.PI);
  const coralTurns = state.curveType === "arch" ? Math.min(1.4, turns * 0.45) : Math.max(0.65, turns * 0.88);
  const coralTheta = coralTurns * Math.PI * 2;
  for (let i = 0; i <= coralCount; i++) {
    const tLocal = i / coralCount;
    const angleC = coralPhase + dir * tLocal * coralTheta;
    let rC;
    if (state.curveType === "arch") {
      rC = minR * 0.88 + (coralMaxR - minR * 0.88) * (1 - tLocal);
    } else {
      const fracC = radialFraction(tLocal, "log", coralTurns, state.growth);
      rC = Math.max(minR * 0.84, coralMaxR * fracC);
    }
    const localGapC = state.curveType === "arch" ? archTurnGap : Math.max(10, rC * kTurnDrop);
    const rawHalfWC = (innerHalfW + (outerHalfW - innerHalfW) * Math.pow(1 - tLocal, 1.15)) * 0.78;
    const maxSafeCoralW = state.curveType === "arch" ? archTurnGap * 0.22 : localGapC * 0.30;
    coralPts.push({
      s: tLocal,
      angle: angleC,
      r: rC,
      x: eyeX + Math.cos(angleC) * rC,
      y: eyeY + Math.sin(angleC) * rC,
      halfW: Math.max(2.0, Math.min(rawHalfWC, maxSafeCoralW)),
    });
  }
  for (let i = 0; i < coralPts.length; i++) {
    const c0 = coralPts[Math.max(0, i - 1)];
    const c1 = coralPts[Math.min(coralPts.length - 1, i + 1)];
    const dx = c1.x - c0.x;
    const dy = c1.y - c0.y;
    const len = Math.hypot(dx, dy) || 1;
    coralPts[i].nx = -dy / len;
    coralPts[i].ny = dx / len;
  }

  // 实测各项无量纲指标（全部直接从实绘 pts 阵列计算）
  const bboxW = Math.max(0, maxX - minX);
  const bboxH = Math.max(0, maxY - minY);
  const maxOuterReach = Math.max(...pts.map((p) => p.r + p.halfW));
  const measuredSpanPct = Math.round((maxOuterReach / (minDim * 0.5)) * 100);
  const coreDist = Math.hypot(coreX - eyeX, coreY - eyeY);
  const measuredCoreOffsetPct = Math.round((coreDist / minDim) * 100);
  const eyeEdgeDist = Math.min(eyeX, width - eyeX, eyeY, height - eyeY);
  const measuredEyeMarginPct = Math.round((eyeEdgeDist / minDim) * 100);
  const idxOuter = Math.min(pts.length - 1, Math.floor(pts.length * 0.05));
  const idxInner = Math.max(idxOuter + 1, Math.floor(pts.length * 0.88));
  const measuredTaperRatio = +(pts[idxOuter].halfW / Math.max(1, pts[idxInner].halfW)).toFixed(2);
  const measuredTurns = +(cumulativeAngle / (Math.PI * 2)).toFixed(2);

  return {
    width,
    height,
    minDim,
    eye: { x: eyeX, y: eyeY },
    core: { x: coreX, y: coreY, r: coreR },
    maxR,
    minR,
    orbitR,
    bead1,
    bead2,
    pts,
    coralPts,
    bbox: { minX, maxX, minY, maxY, w: bboxW, h: bboxH },
    metrics: {
      turns: measuredTurns,
      quarterRatio: +measuredQuarterRatio.toFixed(2),
      spanPct: measuredSpanPct,
      coreOffsetPct: measuredCoreOffsetPct,
      eyeMarginPct: measuredEyeMarginPct,
      taperRatio: measuredTaperRatio,
      maxBendDeg: Math.round(maxBendDeg),
      curveType: state.curveType,
      dir,
    },
  };
}

// 双向单真源诊断：完全从 sampleSpiral 实测结果推导
export function auditSpiral(state, width = 800, height = 560) {
  const geom = sampleSpiral(state, width, height);
  const m = geom.metrics;
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

  // 1. 引导视线（曲线连续顺滑 + 外缘有效跨幅）
  let guidance = { ok: true, code: "ok", badge: `跨幅 ${m.spanPct}%`, short: `跨幅 ${m.spanPct}%` };
  if (m.maxBendDeg > 20 || state.curveType === "kink") {
    guidance = { ok: false, code: "kink", badge: `硬折 ${m.maxBendDeg}°`, short: `折角 ${m.maxBendDeg}°` };
  } else if (m.spanPct < 74) {
    guidance = { ok: false, code: "cramped", badge: `内缩 ${m.spanPct}%`, short: `内缩 ${m.spanPct}%` };
  } else if (m.spanPct > 112) {
    guidance = { ok: false, code: "overflow", badge: `溢框 ${m.spanPct}%`, short: `溢框 ${m.spanPct}%` };
  }

  // 2. 层层深入（对数渐缩比 + 由宽入窄收锋）
  let rhythm = { ok: true, code: "ok", badge: `递缩 ${m.quarterRatio.toFixed(2)}×`, short: `k ${m.quarterRatio.toFixed(2)}×` };
  if (state.curveType === "arch" || m.quarterRatio < 1.24) {
    rhythm = { ok: false, code: "flat", badge: `等距 ${m.quarterRatio.toFixed(2)}×`, short: `等距 ${m.quarterRatio.toFixed(2)}×` };
  } else if (m.quarterRatio > 2.2) {
    rhythm = { ok: false, code: "whip", badge: `过陡 ${m.quarterRatio.toFixed(2)}×`, short: `甩鞭 ${m.quarterRatio.toFixed(2)}×` };
  } else if (m.taperRatio < 1.85) {
    rhythm = { ok: false, code: "notaper", badge: `无收锋 ${m.taperRatio.toFixed(1)}×`, short: `均粗 ${m.taperRatio.toFixed(1)}×` };
  }

  // 3. 聚焦核心（主体落在螺眼 + 螺眼不贴死边缘）
  let focus = { ok: true, code: "ok", badge: "锁入螺眼", short: `偏 ${m.coreOffsetPct}%` };
  if (m.coreOffsetPct > 7) {
    focus = { ok: false, code: "offcore", badge: `脱轨 ${m.coreOffsetPct}%`, short: `脱轨 ${m.coreOffsetPct}%` };
  } else if (m.eyeMarginPct < 14) {
    focus = { ok: false, code: "edge", badge: `贴边 ${m.eyeMarginPct}%`, short: `贴边 ${m.eyeMarginPct}%` };
  }

  // 4. 动态延伸（圈数区间：过短退弧，过长成眩晕蚊香）
  let movement = { ok: true, code: "ok", badge: `盘旋 ${m.turns.toFixed(2)} 圈`, short: `${m.turns.toFixed(2)} 圈` };
  if (m.turns > 2.35) {
    movement = { ok: false, code: "overwound", badge: `死缠 ${m.turns.toFixed(2)} 圈`, short: `死缠 ${m.turns.toFixed(2)} 圈` };
  } else if (m.turns < 1.05) {
    movement = { ok: false, code: "underwound", badge: `退弧 ${m.turns.toFixed(2)} 圈`, short: `退弧 ${m.turns.toFixed(2)} 圈` };
  }

  const checks = { guidance, rhythm, focus, movement };
  const score = [guidance, rhythm, focus, movement].filter((c) => c.ok).length;

  // 决定最核心的优先诊断文案（按视觉破坏力排序）
  let headline = "";
  let body = "";
  let action = "";
  let gazeOutcome = "lock";
  let statusTag = "";

  if (!guidance.ok && guidance.code === "kink") {
    headline = `螺线中途硬折 ${m.maxBendDeg}°，视线当场卡顿`;
    body = "人眼视觉皮层沿平滑曲率自动接续轮廓（Field 等，1993）；一旦曲线出现尖锐折角，连续路径立刻碎成几段不相关的折线，旋转动势荡然无存。";
    action = "点击下方「对数递缩」把折线还原为平滑螺线，再按空格滴墨检验。";
    gazeOutcome = "snag";
    statusTag = `硬折 ${m.maxBendDeg}°`;
  } else if (!movement.ok && movement.code === "overwound") {
    headline = `盘旋 ${m.turns.toFixed(2)} 圈且等距紧缠，退化成眩晕蚊香`;
    body = `当前螺线绕得过密，${!rhythm.ok && rhythm.code === "flat" ? "再加上圈距几乎均等（" + m.quarterRatio.toFixed(2) + "×），" : ""}眼睛绕两圈就会疲惫发晕，还没看到${spec.coreName}就已经想移开视线。`;
    action = "在画布上向左横拖把圈数舒展到 1.2–2.2 圈，并切到「对数递缩」拉开层层递进的步距。";
    gazeOutcome = "dizzy";
    statusTag = `死缠 ${m.turns.toFixed(2)} 圈`;
  } else if (!movement.ok && movement.code === "underwound") {
    headline = `只绕了 ${m.turns.toFixed(2)} 圈，退化成单段弧线`;
    body = "旋转不足一整圈时，画面只有单向滑过的弧势，没有「层层包抄、螺旋下沉」的向心纵深——那是 049 弧形构图的领域，撑不起螺旋的节奏感。";
    action = "在画布上向右横拖增加盘旋圈数到 1.2–2.2 圈，让外带绕过至少一整周再收束进核心。";
    gazeOutcome = "escape";
    statusTag = `退弧 ${m.turns.toFixed(2)} 圈`;
  } else if (!rhythm.ok && rhythm.code === "flat") {
    headline = `每转 90° 仅缩 ${m.quarterRatio.toFixed(2)}×，缺少层层深入的加速感`;
    body = "阿基米德等距螺线像卷尺或蚊香，外圈与内圈步幅一致，显得机械呆板；换成对数螺线后，每一圈按固定倍率递缩，眼睛才会感到空间越走越深。";
    action = "切换「对数递缩」并在画布上纵拖，把 90° 扩张倍比调至 1.30×–2.05×（黄金螺约为 1.62×）。";
    gazeOutcome = "dizzy";
    statusTag = `等距 ${m.quarterRatio.toFixed(2)}×`;
  } else if (!rhythm.ok && rhythm.code === "whip") {
    headline = `外扩过陡（${m.quarterRatio.toFixed(2)}×），像甩鞭一样把视线甩出画外`;
    body = "扩张倍比超过约 2.2× 后，外圈半径瞬间暴涨，入口曲线几乎拉直，目光来不及随曲率内折，直接顺切线冲出画框边缘。";
    action = "向下纵拖或拉低「扩张倍比 k」回到 1.30×–2.05×，重新兜住入画的视线。";
    gazeOutcome = "escape";
    statusTag = `甩鞭 ${m.quarterRatio.toFixed(2)}×`;
  } else if (!focus.ok && focus.code === "offcore") {
    headline = `${spec.coreName}偏离螺眼 ${m.coreOffsetPct}%，螺旋把视线带进空洞`;
    body = "螺旋构图整条路径都在为终点蓄势。现在螺线收束的螺眼里空无一物，真正的主体反被晾在旁边，眼睛绕完一圈扑个空，构图意图立刻散架。";
    action = `直接按住画布上的${spec.coreName}，把它拖进深蓝虚圈标出的螺眼中心（靠近会自动轻吸附）。`;
    gazeOutcome = "miss";
    statusTag = `脱轨 ${m.coreOffsetPct}%`;
  } else if (!rhythm.ok && rhythm.code === "notaper") {
    headline = `墨带首尾均粗（${m.taperRatio.toFixed(1)}×），分不清入口和终点`;
    body = "051 原海报特意把外圈画成宽阔渐散的深蓝墨带、内圈收成纤细鲜活的珊瑚带。从头到尾一样粗，视线就没有「由远及近、由宽入精」的加速提示。";
    action = "把「收锋渐细比」拉到 2.0× 以上，让外缘宽阔接住目光、近核处轻巧收尖。";
    gazeOutcome = "dizzy";
    statusTag = `无收锋 ${m.taperRatio.toFixed(1)}×`;
  } else if (!guidance.ok && guidance.code === "cramped") {
    headline = `外缘内缩在画中（仅占 ${m.spanPct}%），入口接不住目光`;
    body = "螺旋外尾离画框太远，周围留出大片无引导的空地，观众进画时找不到自然的起跑入口，整团螺线像贴在纸面中央的一枚小徽章。";
    action = "向外拖动外圈海蓝珠（或拉高外缘跨幅），让外螺带舒展到占画幅 76%–98%。";
    gazeOutcome = "miss";
    statusTag = `内缩 ${m.spanPct}%`;
  } else if (!focus.ok && focus.code === "edge") {
    headline = `螺眼挤在边沿（距边仅 ${m.eyeMarginPct}%），收尾透不过气`;
    body = "螺眼太贴近画框会截断内圈完整的包裹感，主体像要跌出画面外，缺少原海报中四面舒展的呼吸余地。";
    action = "把螺眼和核心往画面中腹（约偏离正中 5%–15% 的黄金眼一带）挪回一些。";
    gazeOutcome = "escape";
    statusTag = `贴边 ${m.eyeMarginPct}%`;
  } else {
    // 4/4 全部成立！按具体扩张率给出细腻反馈
    const styleDesc =
      Math.abs(m.quarterRatio - PHI) < 0.08
        ? "贴近经典黄金对数节奏"
        : m.quarterRatio < 1.48
          ? "贴近真实鹦鹉螺壳的绵密缓旋"
          : "舒展大气的宽幅快旋";
    headline = `4/4 成立 · ${styleDesc}，视线顺流归心`;
    body = `外螺带以 ${m.spanPct}% 跨幅在画缘接住目光，经 ${m.turns.toFixed(2)} 圈、每转 90° 约 ${m.quarterRatio.toFixed(2)}× 递增收窄（收锋 ${m.taperRatio.toFixed(1)}×），最终把全部视觉能量稳稳交付给螺眼中的${spec.coreName}。`;
    action = "按空格滴墨实测全路径加速感，或切上方标本 / 尝试其他合法解与反向试错。";
    gazeOutcome = "lock";
    statusTag = `黄金流畅 · ${m.turns.toFixed(2)} 圈`;
  }

  const tierLabel =
    score === 4
      ? "顺畅归心（示意）"
      : score >= 2
        ? "局部失衡（示意）"
        : "多重失序（示意）";

  return {
    geom,
    score,
    checks,
    statusTag,
    tierLabel,
    gazeOutcome,
    diagnosis: { headline, body, action },
  };
}
