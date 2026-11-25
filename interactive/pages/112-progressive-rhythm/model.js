// 112 渐进节奏组织 · 单真源数学模型与几何测算
// 画布渲染、点击命中、四维检核柱与白话诊单全部从此模块读取同一组数据。

export const PALETTE = {
  cobalt: "#0033BC",
  cobaltDeep: "#002285",
  cobaltNight: "#051647",
  cobaltInk: "#002B9E",
  ink: "#0A1638",
  gold: "#FEC613",
  goldTextLight: "#8A5D00",
  cream: "#F6E8CD",
  chalk: "#FAF7F0",
  sand: "#F4EBDA",
  ice: "#EAF0FB",
  white: "#F8F7F1",
  coralDark: "#FF8E72",
  coralFill: "#C82E1C",
  coralLight: "#B52617",
  mintDark: "#6CF2CE",
  mintLight: "#0B6B56",
};

export const DIM_META = [
  { id: "size", zh: "大小递增", en: "SIZE GROWS" },
  { id: "spacing", zh: "间距递增", en: "SPACING EXPANDS" },
  { id: "thickness", zh: "粗细递增", en: "THICKNESS INCREASES" },
  { id: "density", zh: "密度递增", en: "DENSITY INCREASES" },
];

export const CURVE_META = {
  linear: { zh: "等差步进", short: "等差", formula: "+Δ 等量累加" },
  geometric: { zh: "等比渐进", short: "等比", formula: "×r 等比放大" },
  fibonacci: { zh: "斐波那契", short: "斐波那契", formula: "前两拍之和趋近 φ" },
  cliff: { zh: "尾端急冲", short: "急冲", formula: "t³ 前僵后爆" },
};

export const INITIAL_STATE = {
  span: 1.4,
  beats: 9,
  curve: "linear",
  dipIndex: 4, // 0-based -> 第 5 拍逆序凹陷
  barDir: "reverse", // 下轨柱阵反向递减，与上方圆列对冲
  dims: {
    size: true,
    spacing: true,
    thickness: true,
    density: false,
  },
};

export const PRESETS = {
  broken: () => ({
    ...INITIAL_STATE,
    dims: { ...INITIAL_STATE.dims },
  }),
  poster: () => ({
    span: 5.8,
    beats: 9,
    curve: "geometric",
    dipIndex: -1,
    barDir: "aligned",
    dims: { size: true, spacing: true, thickness: true, density: false },
  }),
  fibonacci: () => ({
    span: 6.4,
    beats: 8,
    curve: "fibonacci",
    dipIndex: -1,
    barDir: "aligned",
    dims: { size: true, spacing: true, thickness: false, density: true },
  }),
  editorial: () => ({
    span: 3.6,
    beats: 7,
    curve: "geometric",
    dipIndex: -1,
    barDir: "aligned",
    dims: { size: true, spacing: false, thickness: true, density: false },
  }),
  explode: () => ({
    span: 10.8,
    beats: 9,
    curve: "geometric",
    dipIndex: -1,
    barDir: "aligned",
    dims: { size: true, spacing: true, thickness: true, density: false },
  }),
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 生成严格递增的斐波那契基底：1, 2, 3, 5, 8, 13, 21, ...
function fibBase(n) {
  const arr = [];
  let a = 1;
  let b = 2;
  for (let i = 0; i < n; i++) {
    arr.push(a);
    const next = a + b;
    a = b;
    b = next;
  }
  return arr;
}

// 计算未破序前的理论曲线序列（首项为 1.0，末项为 span）
export function computeBaseSeries(beats, span, curve) {
  const n = clamp(Math.round(beats), 3, 15);
  const s = clamp(span, 1.0, 11.5);
  if (n === 1) return [1];
  const fib = curve === "fibonacci" ? fibBase(n) : null;
  const logFibMax = fib ? Math.log(fib[n - 1]) : 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    let val = 1;
    if (curve === "linear") {
      val = 1 + (s - 1) * u;
    } else if (curve === "geometric") {
      val = Math.pow(s, u);
    } else if (curve === "fibonacci") {
      const p = logFibMax > 0 ? Math.log(fib[i]) / logFibMax : u;
      val = Math.pow(s, p);
    } else if (curve === "cliff") {
      val = 1 + (s - 1) * Math.pow(u, 3.2);
    }
    out.push(val);
  }
  return out;
}

// 计算含手动凹陷后的实际节拍序列
export function computeActualSeries(state) {
  const base = computeBaseSeries(state.beats, state.span, state.curve);
  const actual = base.slice();
  const n = actual.length;
  const dip = state.dipIndex >= 1 && state.dipIndex <= n - 2 ? state.dipIndex : -1;
  if (dip >= 0) {
    // 明确跌破前一拍，制造可一眼辨认的逆序踩空
    actual[dip] = Math.max(0.65, actual[dip - 1] * 0.72);
  }
  return { base, actual, dip };
}

// 依据实际画布宽高算出一组与像素直接对应的双轨几何坐标
export function computeStageGeometry(state, width, height, compact = false) {
  const w = Math.max(240, width);
  const h = Math.max(200, height);
  const { base, actual, dip } = computeActualSeries(state);
  const n = actual.length;
  const dims = state.dims;

  // 斜向推进主轴：桌面为左上留出纯蓝诊单三角，右侧为「强化 EMPHASIS」留出纯净蓝天
  const x0 = compact ? w * 0.085 : w * 0.075;
  const y0 = compact ? h * 0.845 : h * 0.86;
  const x1 = compact ? w * 0.775 : w * 0.868;
  const y1 = compact ? h * 0.235 : h * 0.175;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const diagLen = Math.hypot(dx, dy);

  // 最大安全圆半径（绝不拉伸为椭圆，按短边比例控制）
  const rCap = Math.min(h * (compact ? 0.125 : 0.145), w * (compact ? 0.105 : 0.068));

  // 圆半径：大小递增开启时严格按 actual/span 比例映射；跨度超 9.5× 时刻意让大圆膨胀并压细首拍
  const span = clamp(state.span, 1.0, 11.5);
  const tailScale = span <= 2.4
    ? 0.44 + (span - 1) * 0.12
    : span <= 9.5
      ? 0.62 + ((span - 2.4) / 7.1) * 0.34
      : 0.96 + Math.min(0.24, (span - 9.5) * 0.11);

  const radii = actual.map((v) => {
    if (!dims.size) {
      return rCap * 0.38;
    }
    const r = (v / span) * rCap * tailScale;
    return clamp(r, 2.2, rCap * 1.24);
  });

  // 沿斜轴的步进位置 t[i] ∈ [0, 1]
  // 若间距递增开启：步距随序列拉开；关闭则等距排布（大圆会开始挤贴）
  const tPos = [0];
  if (n > 1) {
    const weights = [];
    for (let i = 0; i < n - 1; i++) {
      const midNorm = (base[i] + base[i + 1]) / (2 * Math.max(1, span));
      if (dims.spacing) {
        // 用真实半径和递增间距系数共同决定视觉净距
        const minSpanStep = (radii[i] + radii[i + 1]) / Math.max(1, diagLen);
        const expandFactor = 0.36 + 1.55 * Math.pow(midNorm, 0.95);
        weights.push(Math.max(minSpanStep * 0.92, expandFactor * 0.095));
      } else {
        weights.push(1);
      }
    }
    const sumW = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i] / sumW;
      tPos.push(acc);
    }
  }

  // 圆心坐标（破拍时若大小递增被关掉，仍令圆心下沉以便视觉直察）
  const orbs = [];
  for (let i = 0; i < n; i++) {
    const t = tPos[i];
    const isDip = i === dip;
    const dropOffset = isDip && !dims.size ? rCap * 0.55 : isDip ? rCap * 0.28 : 0;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t + dropOffset;
    const r = radii[i];
    const color = i === 0 ? PALETTE.white : i % 2 === 1 ? PALETTE.cream : PALETTE.gold;
    orbs.push({
      index: i,
      beatNo: i + 1,
      x: cx,
      y: cy,
      r,
      t,
      val: actual[i],
      baseVal: base[i],
      isDip,
      color,
    });
  }

  // 实线主斜箭（圆列下方，忠实还原 112 原海报）
  const arrowOffsetY = compact ? h * 0.085 : h * 0.095;
  const solidArrow = {
    x0: x0 + w * 0.015,
    y0: y0 + arrowOffsetY * 0.45,
    x1: x1 + w * 0.045,
    y1: y1 + arrowOffsetY * 1.45,
  };

  // 虚线柱顶坡面线
  const baseLineY = compact ? h * 0.915 : h * 0.92;
  const barXStart = compact ? w * 0.14 : w * 0.165;
  const barXEnd = compact ? w * 0.945 : w * 0.955;
  const dashedArrow = {
    x0: barXStart,
    y0: baseLineY - h * 0.055,
    x1: barXEnd + w * 0.01,
    y1: y1 + h * (compact ? 0.30 : 0.285),
  };

  // 下方斜切阶梯柱阵（与原海报一致：宽度与间距按进度递进，柱顶随坡面斜切）
  const barSpanW = barXEnd - barXStart;
  const barRawWidths = [];
  const barRawGaps = [];
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 1;
    const refVal = state.barDir === "reverse" ? base[n - 1 - i] : base[i];
    const norm = (refVal - 1) / Math.max(0.01, span - 1);
    const wWeight = dims.thickness
      ? 0.28 + (span > 1.05 ? 1.55 * Math.pow(clamp(norm, 0, 1), 0.9) : 0.35 * u)
      : 0.72;
    barRawWidths.push(wWeight);
    if (i < n - 1) {
      const gWeight = dims.spacing
        ? 0.32 + 1.05 * Math.pow(u, 0.95)
        : 0.58;
      barRawGaps.push(gWeight);
    }
  }
  const totalUnit = barRawWidths.reduce((a, b) => a + b, 0) + barRawGaps.reduce((a, b) => a + b, 0);
  const unitPx = barSpanW / Math.max(0.01, totalUnit);

  const bars = [];
  let cursorX = barXStart;
  const baseMaxH = baseLineY - (dashedArrow.y1 + h * 0.04);
  // 桌面端反向对冲时限制左柱最高顶缘，避免顶进左上角诊单框底边
  const maxBarH = !compact && state.barDir === "reverse" ? Math.min(baseMaxH, h * 0.37) : baseMaxH;
  for (let i = 0; i < n; i++) {
    const bw = Math.max(3, barRawWidths[i] * unitPx);
    const left = cursorX;
    const right = left + bw;
    const cx = (left + right) / 2;
    const isDip = i === dip;

    // 高度由 actual 或反向序列决定
    const srcVal = state.barDir === "reverse" ? actual[n - 1 - i] : actual[i];
    const heightRatio = dims.size || dims.thickness
      ? clamp(srcVal / Math.max(1.2, span), 0.06, 1.05)
      : 0.42;

    // 计算柱顶斜切（同向时向右攀升，反向时向右下滑）
    const slopeSign = state.barDir === "reverse" ? -1 : 1;
    const hCenter = Math.max(10, maxBarH * (0.12 + 0.88 * heightRatio) * (isDip && state.barDir === "aligned" ? 0.86 : 1));
    const bevel = Math.min(bw * 0.32, hCenter * 0.22) * slopeSign;
    const hLeft = Math.max(6, hCenter - bevel * 0.5);
    const hRight = Math.max(6, hCenter + bevel * 0.5);

    // 密度微点数量（1 → 12 递进点阵）
    const dotCount = dims.density
      ? Math.max(1, Math.round(1 + ((actual[i] - 1) / Math.max(0.01, span - 1)) * 11))
      : 0;

    bars.push({
      index: i,
      beatNo: i + 1,
      x: left,
      cx,
      w: bw,
      baseY: baseLineY,
      topLeftY: baseLineY - hLeft,
      topRightY: baseLineY - hRight,
      hCenter,
      isDip,
      dotCount,
      color: i % 2 === 0 ? PALETTE.cream : PALETTE.gold,
    });

    cursorX = right + (i < barRawGaps.length ? barRawGaps[i] * unitPx : 0);
  }

  // 计算相邻圆的最小像素净距（检测粘连）
  let minOrbGapPx = Infinity;
  for (let i = 0; i < orbs.length - 1; i++) {
    const dist = Math.hypot(orbs[i + 1].x - orbs[i].x, orbs[i + 1].y - orbs[i].y);
    const gap = dist - orbs[i].r - orbs[i + 1].r;
    if (gap < minOrbGapPx) minOrbGapPx = gap;
  }

  return {
    w,
    h,
    compact,
    orbs,
    bars,
    solidArrow,
    dashedArrow,
    baseLineY,
    firstOrbPx: orbs[0]?.r * 2 || 0,
    lastOrbPx: orbs[orbs.length - 1]?.r * 2 || 0,
    minOrbGapPx: Number.isFinite(minOrbGapPx) ? minOrbGapPx : 0,
    dip,
  };
}

// 核心单真源诊断：不写死任何结论，直接基于真实几何与相对步进实算
export function evaluate(state, geom) {
  const { base, actual } = computeActualSeries(state);
  const n = actual.length;
  const span = clamp(state.span, 1.0, 11.5);

  // 计算未破序理论序列的每步相对增幅 (%)
  const baseRelSteps = [];
  for (let i = 1; i < n; i++) {
    baseRelSteps.push(((base[i] / Math.max(0.001, base[i - 1])) - 1) * 100);
  }
  const headStepPct = baseRelSteps[0] || 0;
  const tailStepPct = baseRelSteps[baseRelSteps.length - 1] || 0;
  const avgStepPct = baseRelSteps.reduce((a, b) => a + b, 0) / Math.max(1, baseRelSteps.length);
  const geomStepRatio = n > 1 ? Math.pow(span, 1 / (n - 1)) : 1;
  const stepSpread = tailStepPct > 0.1 ? headStepPct / tailStepPct : 99;

  // 检查实际序列的单调破拍
  const inversions = [];
  for (let i = 1; i < n; i++) {
    if (actual[i] < actual[i - 1] * 0.995) {
      const dropPct = Math.round((1 - actual[i] / actual[i - 1]) * 100);
      inversions.push({ index: i, beatNo: i + 1, dropPct });
    }
  }

  const activeDims = DIM_META.filter((d) => state.dims[d.id]);
  const activeDimCount = activeDims.length;

  // 四大检核柱（严格对应 112 原海报：递增 / 推进 / 序列 / 强化）
  // 1. 递增 INCREASE：首尾跨度倍率
  let increaseOk = true;
  let increaseCode = "ok";
  let increaseBadge = `${span.toFixed(1)}× 清晰`;
  if (span < 2.5) {
    increaseOk = false;
    increaseCode = "flat";
    increaseBadge = `${span.toFixed(1)}× 扁平`;
  } else if (span > 9.5) {
    increaseOk = false;
    increaseCode = "explode";
    increaseBadge = `${span.toFixed(1)}× 爆冲`;
  }

  // 2. 推进 MOMENTUM：拍数区间 + 增长规律不失速
  let momentumOk = true;
  let momentumCode = "ok";
  let momentumBadge = `尾步 +${Math.round(tailStepPct)}%`;
  if (n <= 3) {
    momentumOk = false;
    momentumCode = "tooFew";
    momentumBadge = `${n} 拍过短`;
  } else if (n >= 15) {
    momentumOk = false;
    momentumCode = "tooDense";
    momentumBadge = `${n} 拍过密`;
  } else if (state.curve === "linear") {
    momentumOk = false;
    momentumCode = "linearStall";
    momentumBadge = `等差尾步 +${Math.round(tailStepPct)}%`;
  } else if (state.curve === "cliff") {
    momentumOk = false;
    momentumCode = "cliffJump";
    momentumBadge = `前僵后爆`;
  }

  // 3. 序列 SEQUENCE：严格单调无逆序凹坑
  const sequenceOk = inversions.length === 0;
  const sequenceCode = sequenceOk ? "ok" : "dip";
  const sequenceBadge = sequenceOk
    ? `${n} 拍单调`
    : `第 ${inversions[0].beatNo} 拍凹陷`;

  // 4. 强化 EMPHASIS：双轨同向 + 至少激活 1 条递增维度
  let emphasisOk = true;
  let emphasisCode = "ok";
  let emphasisBadge = `${activeDimCount} 维协同`;
  if (state.barDir === "reverse") {
    emphasisOk = false;
    emphasisCode = "reverse";
    emphasisBadge = "双轨反向";
  } else if (activeDimCount === 0) {
    emphasisOk = false;
    emphasisCode = "noDim";
    emphasisBadge = "维度全关";
  }

  const pillars = {
    increase: { ok: increaseOk, code: increaseCode, badge: increaseBadge, zh: "递增", en: "INCREASE" },
    momentum: { ok: momentumOk, code: momentumCode, badge: momentumBadge, zh: "推进", en: "MOMENTUM" },
    sequence: { ok: sequenceOk, code: sequenceCode, badge: sequenceBadge, zh: "序列", en: "SEQUENCE" },
    emphasis: { ok: emphasisOk, code: emphasisCode, badge: emphasisBadge, zh: "强化", en: "EMPHASIS" },
  };

  const score = [increaseOk, momentumOk, sequenceOk, emphasisOk].filter(Boolean).length;

  // 按最致命问题优先级生成白话诊单
  let diagnosis;
  if (!sequenceOk) {
    const inv = inversions[0];
    diagnosis = {
      ok: false,
      code: "dip",
      tag: `错态 · 逆序踩空（${score} / 4）`,
      headline: `第 ${inv.beatNo} 拍突然回跌了 ${inv.dropPct}%，视线半路绊住`,
      why: "渐进节奏靠的是大脑自动预测「下一拍会更强」。只要中间有一拍反向缩水，期待回路立刻打断，整条阶梯会裂成两截。",
      action: `直接点击画布上带赤色虚圈的第 ${inv.beatNo} 拍（或按下方「补齐破拍」），恢复严格单调递增。`,
    };
  } else if (!emphasisOk && emphasisCode === "reverse") {
    diagnosis = {
      ok: false,
      code: "reverse",
      tag: `错态 · 双轨反向对冲（${score} / 4）`,
      headline: "上圆向右变强、下柱向右变弱，两股动势互相抵消",
      why: "渐进节奏必须把所有视觉重量汇向同一个终点焦点。现在上下两轨朝相反方向拉扯，眼睛在左右两端来回犹豫，推进感被当场拆散。",
      action: "把「下轨柱阵」切回「同向递增」，让圆列与柱阵一起把视线推向右上终点。",
    };
  } else if (!emphasisOk && emphasisCode === "noDim") {
    diagnosis = {
      ok: false,
      code: "noDim",
      tag: `错态 · 递增维度全关（${score} / 4）`,
      headline: "四条递增把手全部熄火，画面退化成静态均分",
      why: "大小、间距、粗细、密度里至少要打开一条通道承载变化，渐进节奏才有物理载体。",
      action: "在四维标牌里点亮「大小递增」或「间距递增」至少一项。",
    };
  } else if (!increaseOk && increaseCode === "flat") {
    diagnosis = {
      ok: false,
      code: "flat",
      tag: `错态 · 重复退化（${score} / 4）`,
      headline: `首尾跨度只有 ${span.toFixed(1)}×，肉眼看成了一排相同圆点`,
      why: `当前每拍平均只放大 ${Math.round(avgStepPct)}%，低于人眼能一眼察觉动势的经验参考带（约 2.5×–9.0× 总跨度），画面落回了静态重复。`,
      action: "直接在钴蓝画布上向右横向拖动（或按方向键 →），把跨度拉到 2.8× 以上。",
    };
  } else if (!increaseOk && increaseCode === "explode") {
    const startPx = Math.round(geom?.firstOrbPx || 4);
    diagnosis = {
      ok: false,
      code: "explode",
      tag: `错态 · 头隐尾爆（${score} / 4）`,
      headline: `跨度拉到 ${span.toFixed(1)}×，起点缩成 ${startPx}px 微尘、尾端胀破画面`,
      why: "倍率过猛时，前两拍细到几乎看不清，最后两拍又陡然膨胀挤占相邻空隙，整条节奏变成失控的「陡崖」而非从容推进。",
      action: "向左横拖画布，把总跨度收回 2.8×–9.0× 的稳健区间。",
    };
  } else if (!momentumOk && momentumCode === "tooFew") {
    diagnosis = {
      ok: false,
      code: "tooFew",
      tag: `错态 · 拍数不足（${score} / 4）`,
      headline: `只有 ${n} 拍，只看得见「大小对比」，凑不成「渐进节奏」`,
      why: "大脑至少需要看到 4 拍以上的连续变化，才能归纳出步进规律并对下一拍产生期待。3 拍以内只是孤立对比。",
      action: "把拍数加到 6–11 拍，让规律有足够长度展开。",
    };
  } else if (!momentumOk && momentumCode === "tooDense") {
    diagnosis = {
      ok: false,
      code: "tooDense",
      tag: `错态 · 过密糊团（${score} / 4）`,
      headline: `塞进 ${n} 拍后空隙被挤塌，单拍轮廓糊成一片`,
      why: "拍数过多时每步增量被切得太碎，且大圆之间留白被吞没，渐进的「可数节拍感」会被高频噪点淹没。",
      action: "把拍数收回到 6–12 拍，让每一拍都有清晰的呼吸间隔。",
    };
  } else if (!momentumOk && momentumCode === "linearStall") {
    diagnosis = {
      ok: false,
      code: "linearStall",
      tag: `错态 · 等差尾端失速（${score} / 4）`,
      headline: `首步跳涨 +${Math.round(headStepPct)}%，尾步却只剩 +${Math.round(tailStepPct)}%`,
      why: "人眼对面积和尺度的感知接近对数规律（韦伯-费希纳定律）：每次加同样像素，开头显得剧烈、接近终点时反而像停滞不前，期待感半路熄火。",
      action: "把「递增规律」切到「等比渐进」或「斐波那契」，让尾段仍保持干脆的推进力。",
    };
  } else if (!momentumOk && momentumCode === "cliffJump") {
    diagnosis = {
      ok: false,
      code: "cliffJump",
      tag: `错态 · 前僵后爆（${score} / 4）`,
      headline: `前段几乎原地踏步（+${Math.round(headStepPct)}%），临近终点骤然猛冲 +${Math.round(tailStepPct)}%`,
      why: "三次方急冲曲线把变化全压在最后两拍，前半程死寂无声、后半程突兀炸开，失去了「由弱到强」的平滑预告。",
      action: "把「递增规律」切到「等比渐进」或「斐波那契」，让整条斜坡匀称发力。",
    };
  } else {
    // 4 / 4 达标：识别用户达成了哪一类正当解法
    let solutionName = "经典等比渐进解";
    if (state.curve === "fibonacci") solutionName = "斐波那契建筑阶梯解";
    else if (span <= 4.2) solutionName = "轻雅版式字号阶梯解";
    else if (activeDimCount === 4) solutionName = "四维满载高强推进解";

    const extraTip = activeDimCount === 4
      ? "四条维度同时开足冲击力极强，适合大海报；落到日常 UI 里通常挑 1–2 条协同更耐看。"
      : `当前由「${activeDims.map((d) => d.zh.slice(0, 2)).join(" + ")}」同向协同，视线自然落到右上终点焦点。`;

    diagnosis = {
      ok: true,
      code: "ok",
      tag: `已校准 · ${solutionName}（4 / 4）`,
      headline: `${n} 拍以约 ${geomStepRatio.toFixed(2)}× 步比稳健攀升，终点焦点自然立住`,
      why: `从第 1 拍到第 ${n} 拍跨度 ${span.toFixed(1)}×，尾步仍保持 +${Math.round(tailStepPct)}% 的清晰增量，既不退化成平面重复，也不压碎起点。${extraTip}`,
      action: "你仍可继续横拖压测 10× 爆冲、点任意拍故意制造破序，或切换其他正当解体验不同节奏性格。",
    };
  }

  return {
    score,
    pillars,
    diagnosis,
    metrics: {
      span,
      beats: n,
      geomStepRatio,
      headStepPct,
      tailStepPct,
      avgStepPct,
      stepSpread,
      activeDimCount,
      inversionCount: inversions.length,
    },
  };
}

// 命中检测：判断点按是否落在了某一枚圆点或竖柱上
export function hitTestBeat(geom, px, py) {
  if (!geom) return -1;
  // 优先检测上方圆列（扩大一点触控容差）
  for (let i = geom.orbs.length - 1; i >= 0; i--) {
    const o = geom.orbs[i];
    const hitR = Math.max(20, o.r + 10);
    if (Math.hypot(px - o.x, py - o.y) <= hitR) {
      return i;
    }
  }
  // 再检测下方柱阵
  for (let i = geom.bars.length - 1; i >= 0; i--) {
    const b = geom.bars[i];
    const topY = Math.min(b.topLeftY, b.topRightY) - 10;
    if (px >= b.x - 6 && px <= b.x + b.w + 6 && py >= topY && py <= b.baseY + 8) {
      return i;
    }
  }
  return -1;
}
