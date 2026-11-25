// 040 锯齿形构图 · 单真源几何模型
// 状态只存相对画框坐标 (u, v ∈ [0, 1]) 的折线顶点数组与主焦点坐标。
// 开场画布绘制、四项支柱实况、8 类双向错态诊单、标题错位律动全部由 evaluate() 实时核算。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 闪电",
    tag: "ZIGZAG BOLT",
    focalName: "星芒主焦点",
    note: "双刃黄青闪电斜穿曜石黑底，中央锐拐锁住双环九芒星。",
  },
  sport: {
    id: "sport",
    label: "运动赛事 · 冲刺",
    tag: "TRACK SPRINT",
    focalName: "冲刺剪影焦点",
    note: "把冲刺运动员与赛标卡在最锐拐点，用折线急转传递爆发速度。",
  },
  music: {
    id: "music",
    label: "音乐演出 · 脉冲",
    tag: "LIVE PULSE",
    focalName: "演出主标焦点",
    note: "长短锯齿模拟重拍与切分音，在拐点释放现场视觉声浪。",
  },
};

export const LIMITS = {
  minTurns: 3,
  maxTurns: 6,
  minAngle: 24,       // 小于此内夹角过锐刺死
  maxSharpAngle: 118, // 有效锐拐内夹角上限
  focalSnapDist: 0.085,
  focalLineDist: 0.062,
  focalCornerMaxAngle: 118,
  minLengthRatio: 1.35, // 长短段比下限（低于此接近机械等距）
  minSegShare: 0.08,    // 单段占总长下限（低于此成毛刺短节）
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const cloneNodes = (arr) => arr.map((p) => ({ u: p.u, v: p.v }));

// 开场默认 0/4 复合错态：7 个极浅等距钝折（任意屏幕宽比 0.85~2.0 下长短比均严格 < 1.24×、最锐角 ~167°）+ 焦点漂在左上黑空
export function createInitialState(scene = "poster") {
  const nodes = buildAxisPolyline(7, 0.008, false);
  return {
    scene,
    nodes,
    focal: { u: 0.24, v: 0.32 },
    pulsePlaying: true,
    activePreset: "broken",
  };
}

// 沿着左下 → 右上主斜轴生成指定折数的折线
export function buildAxisPolyline(turnCount, amp = 0.14, varied = true) {
  const n = clamp(Math.round(turnCount), 2, 8);
  const p0 = { u: 0.12, v: 0.88 };
  const p1 = { u: 0.88, v: 0.12 };
  const dx = p1.u - p0.u;
  const dy = p1.v - p0.v;
  const len = Math.hypot(dx, dy);
  // 垂直于主轴的单位法向量（朝左上为负，右下为正）
  const nx = -dy / len;
  const ny = dx / len;

  // 机械等距模式：相邻内部段在 Δu 与 Δv 绝对值上严格相等，任意画布宽高比下段长比恒近 1.0×
  if (!varied) {
    const pts = [];
    for (let i = 0; i <= n + 1; i++) {
      const t = i / (n + 1);
      const u = p0.u + dx * t;
      // 用垂直方向轻微对称摆动构建均匀锯齿，避免宽屏投影拉出虚假长短差
      const side = i === 0 || i === n + 1 ? 0 : (i % 2 === 1 ? -1 : 1);
      const v = clamp(p0.v + dy * t + side * amp * 1.15, 0.09, 0.91);
      pts.push({ u: +u.toFixed(4), v: +v.toFixed(4) });
    }
    return pts;
  }

  // varied=true 时制造长短跳跃
  const ts = [0];
  const patterns = {
    2: [0.32, 0.62],
    3: [0.34, 0.52, 0.72],
    4: [0.27, 0.43, 0.57, 0.76],
    5: [0.22, 0.35, 0.52, 0.65, 0.82],
    6: [0.18, 0.29, 0.44, 0.55, 0.70, 0.84],
    7: [0.15, 0.26, 0.36, 0.50, 0.61, 0.74, 0.86],
    8: [0.12, 0.22, 0.32, 0.43, 0.53, 0.64, 0.75, 0.87],
  };
  const pat = patterns[n] || Array.from({ length: n }, (_, i) => (i + 1) / (n + 1));
  ts.push(...pat, 1);

  const pts = [];
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    let u = p0.u + dx * t;
    let v = p0.v + dy * t;
    if (i > 0 && i < ts.length - 1) {
      const side = i % 2 === 1 ? -1 : 1;
      const envelope = 0.78 + 0.44 * Math.sin(Math.PI * t);
      const off = side * amp * envelope;
      u = clamp(u + nx * off, 0.08, 0.92);
      v = clamp(v + ny * off, 0.09, 0.91);
    }
    pts.push({ u: +u.toFixed(4), v: +v.toFixed(4) });
  }
  return pts;
}

// 多组合法解与试错预设
export const PRESETS = {
  poster: {
    id: "poster",
    label: "原海报斜冲解",
    kind: "good",
    make: () => ({
      nodes: [
        { u: 0.11, v: 0.90 },
        { u: 0.31, v: 0.50 },
        { u: 0.50, v: 0.66 },
        { u: 0.44, v: 0.38 },
        { u: 0.67, v: 0.49 },
        { u: 0.87, v: 0.11 },
      ],
      focal: { u: 0.44, v: 0.38 },
    }),
  },
  sprint: {
    id: "sprint",
    label: "竞速三折解",
    kind: "good",
    make: () => ({
      nodes: [
        { u: 0.11, v: 0.88 },
        { u: 0.46, v: 0.44 },
        { u: 0.36, v: 0.28 },
        { u: 0.66, v: 0.44 },
        { u: 0.88, v: 0.12 },
      ],
      focal: { u: 0.46, v: 0.44 },
    }),
  },
  pulse: {
    id: "pulse",
    label: "五折跃动解",
    kind: "good",
    make: () => ({
      nodes: [
        { u: 0.10, v: 0.89 },
        { u: 0.28, v: 0.48 },
        { u: 0.39, v: 0.62 },
        { u: 0.45, v: 0.32 },
        { u: 0.61, v: 0.47 },
        { u: 0.67, v: 0.29 },
        { u: 0.89, v: 0.11 },
      ],
      focal: { u: 0.45, v: 0.32 },
    }),
  },
  errEven: {
    id: "errEven",
    label: "试错：机械等齿",
    kind: "bad",
    make: () => {
      // 水平轴严格等步锯齿：任意宽高比下每段 |Δu|=0.1333、|Δv|=0.44 严格相等，段长比恒为 1.00×
      const nodes = [
        { u: 0.10, v: 0.72 },
        { u: 0.2333, v: 0.28 },
        { u: 0.3667, v: 0.72 },
        { u: 0.50, v: 0.28 },
        { u: 0.6333, v: 0.72 },
        { u: 0.7667, v: 0.28 },
        { u: 0.90, v: 0.72 },
      ];
      return { nodes, focal: { ...nodes[3] } };
    },
  },
  errSpike: {
    id: "errSpike",
    label: "试错：过锐刺团",
    kind: "bad",
    make: () => ({
      nodes: [
        { u: 0.12, v: 0.88 },
        { u: 0.56, v: 0.30 },
        { u: 0.35, v: 0.65 },
        { u: 0.68, v: 0.26 },
        { u: 0.42, v: 0.58 },
        { u: 0.87, v: 0.12 },
      ],
      focal: { u: 0.56, v: 0.30 },
    }),
  },
  errFew: {
    id: "errFew",
    label: "试错：退化单折",
    kind: "bad",
    make: () => ({
      nodes: [
        { u: 0.14, v: 0.86 },
        { u: 0.38, v: 0.34 },
        { u: 0.63, v: 0.62 },
        { u: 0.86, v: 0.14 },
      ],
      focal: { u: 0.38, v: 0.34 },
    }),
  },
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    kind: "reset",
    make: () => {
      const s = createInitialState();
      return { nodes: s.nodes, focal: s.focal };
    },
  },
};

export function applyPreset(state, presetId) {
  const p = PRESETS[presetId];
  if (!p) return state;
  const data = p.make();
  state.nodes = cloneNodes(data.nodes);
  state.focal = { ...data.focal };
  state.activePreset = presetId;
  return state;
}

// 线段相交检测（用于抓出自交打结错态）
function segmentsIntersect(a, b, c, d) {
  const ccw = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = ccw(a, b, c);
  const d2 = ccw(a, b, d);
  const d3 = ccw(c, d, a);
  const d4 = ccw(c, d, b);
  return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) &&
    ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
}

function pointToSegDist(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy;
  if (l2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / l2, 0, 1);
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
}

// 单真源几何核算：根据实绘顶点与焦点坐标计算全部物理指标与诊单
export function evaluate(state, aspect = 1.45) {
  const pts = state.nodes.map((p) => ({ u: p.u, v: p.v, x: p.u * aspect, y: p.v }));
  const fp = { u: state.focal.u, v: state.focal.v, x: state.focal.u * aspect, y: state.focal.v };
  const turnCount = pts.length - 2;

  // 1. 段长统计
  const segLens = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segLens.push(l);
    totalLen += l;
  }
  const minLen = Math.min(...segLens);
  const maxLen = Math.max(...segLens);
  const lengthRatio = minLen > 1e-5 ? maxLen / minLen : 99;
  const minSegShare = totalLen > 1e-5 ? minLen / totalLen : 0;

  // 2. 每个内部拐点的精确夹角与转向符号
  const corners = [];
  let minAngle = 180;
  let maxAngle = 0;
  let sharpCornerCount = 0;
  let altSignCount = 0;
  let prevSign = 0;
  let sharpestIdx = 1;

  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const l1 = Math.hypot(v1x, v1y) || 1e-6;
    const l2 = Math.hypot(v2x, v2y) || 1e-6;
    const dot = clamp((v1x * v2x + v1y * v2y) / (l1 * l2), -1, 1);
    const innerAngle = (Math.acos(dot) * 180) / Math.PI;
    const turnAngle = 180 - innerAngle;
    // 沿前进方向的转向叉积
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const sign = Math.abs(cross) > 1e-4 ? Math.sign(cross) : 0;
    if (sign !== 0) {
      if (prevSign !== 0 && sign !== prevSign) altSignCount++;
      prevSign = sign;
    }
    if (innerAngle < minAngle) {
      minAngle = innerAngle;
      sharpestIdx = i;
    }
    if (innerAngle > maxAngle) maxAngle = innerAngle;
    if (innerAngle <= LIMITS.maxSharpAngle && innerAngle >= LIMITS.minAngle) {
      sharpCornerCount++;
    }
    corners.push({ index: i, u: b.u, v: b.v, innerAngle, turnAngle, sign });
  }

  // 3. 自交检测
  let selfIntersect = false;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = i + 2; j < pts.length - 1; j++) {
      if (segmentsIntersect(pts[i], pts[i + 1], pts[j], pts[j + 1])) {
        selfIntersect = true;
        break;
      }
    }
    if (selfIntersect) break;
  }

  // 4. 焦点位置与最近拐点/线段距离
  let nearestCorner = corners[0];
  let dCorner = Infinity;
  for (const c of corners) {
    const d = Math.hypot(fp.x - c.u * aspect, fp.y - c.v);
    if (d < dCorner) {
      dCorner = d;
      nearestCorner = c;
    }
  }
  let dLine = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    dLine = Math.min(dLine, pointToSegDist(fp, pts[i], pts[i + 1]));
  }
  // 最佳推荐强拐点（优先中央最锐拐点）
  const bestTargetCorner = corners.reduce((best, c) => {
    const centerBias = 1 - Math.abs(c.u - 0.5) * 0.9 - Math.abs(c.v - 0.5) * 0.7;
    const sharpScore = (180 - c.innerAngle) * 0.01 + centerBias;
    return !best || sharpScore > best.s ? { c, s: sharpScore } : best;
  }, null).c;

  const focalOnCorner = dCorner <= LIMITS.focalSnapDist;
  const focalOnStrongCorner = focalOnCorner && nearestCorner.innerAngle <= LIMITS.focalCornerMaxAngle && nearestCorner.innerAngle >= LIMITS.minAngle;
  const focalOnSegment = !focalOnCorner && dLine <= LIMITS.focalLineDist;

  // 5. 四支柱判定（与原海报四大支柱对应）
  const reqSharp = Math.max(2, Math.ceil(turnCount * 0.6));
  const okAdvance = turnCount >= LIMITS.minTurns && turnCount <= LIMITS.maxTurns && !selfIntersect && altSignCount >= 2;
  const okSharpness = !selfIntersect && minAngle >= LIMITS.minAngle && minAngle <= LIMITS.maxSharpAngle && sharpCornerCount >= reqSharp;
  const okRhythm = lengthRatio >= LIMITS.minLengthRatio && minSegShare >= LIMITS.minSegShare;
  const okFocus = focalOnStrongCorner && !selfIntersect;

  const checks = { advance: okAdvance, sharpness: okSharpness, rhythm: okRhythm, focus: okFocus };
  const score = [okAdvance, okSharpness, okRhythm, okFocus].filter(Boolean).length;

  // 6. 双向错态列表与首要诊断
  const issues = [];
  if (selfIntersect) {
    issues.push({
      code: "self_intersect",
      badge: "折线自交打结",
      title: "折段互相穿插打结，视线在半路卡死",
      body: "锯齿形构图靠连续折返推动视线向前；一旦折角拉过头导致前后线段交叉，方向感立刻坍塌成乱线团，观者看不清该往哪边走。",
      action: "把交叉的拐点往外拖开，或向左横拖画布收窄振幅，解开自交后再留出锐利折角。",
      fixLabel: "解开折线自交",
      fixType: "unfold",
    });
  } else if (minAngle < LIMITS.minAngle) {
    issues.push({
      code: "too_sharp",
      badge: `过锐 ${Math.round(minAngle)}°`,
      title: `拐点夹角压窄到 ${Math.round(minAngle)}°，变成针刺噪点`,
      body: "锐角确实能提高警觉与动感，但夹角低于 24° 时两条折线几乎重叠反折，视觉变成反复原地拉锯，不再向前推进。",
      action: "把最尖的拐点往外稍微拉开，让主折角回到 40°–95° 的有力锐角区间。",
      fixLabel: "放宽过锐尖角",
      fixType: "softenSpike",
    });
  }

  if (minAngle > LIMITS.maxSharpAngle) {
    issues.push({
      code: "too_flat",
      badge: `钝折 ${Math.round(minAngle)}°`,
      title: `折线过于平缓（最锐内角 ${Math.round(minAngle)}°），失去急转冲击`,
      body: "原海报讲「通过连续的折线变化与方向转折，增强画面的张力与冲击力」。现在每处转弯都太浅，视线几乎直直滑过，和普通斜线没有区别。",
      action: "在画布空白处向右横拖（或直接拉动拐点），把折线拉尖至 45°–95° 锐角区间。",
      fixLabel: "拉尖折线锐度",
      fixType: "sharpen",
    });
  } else if (!selfIntersect && minAngle >= LIMITS.minAngle && sharpCornerCount < reqSharp) {
    issues.push({
      code: "too_flat",
      badge: `钝拐过多 ${Math.round(maxAngle)}°`,
      title: `仅有 ${sharpCornerCount}/${turnCount} 处锐拐，其余拐点偏平（最大 ${Math.round(maxAngle)}°）`,
      body: "局部虽有一两处急弯，但多数转折接近拉直，整条路径仍显松散，撑不起连续的折线冲击节奏。",
      action: "向右横拖画布或拉尖平缓拐点，让多数转折内角落入 118° 以内。",
      fixLabel: "补足整体折角锐度",
      fixType: "sharpen",
    });
  }

  if (turnCount > LIMITS.maxTurns) {
    issues.push({
      code: "too_dense",
      badge: `${turnCount} 折过密`,
      title: `连续挤入 ${turnCount} 个拐点，画面被切成锯条噪点`,
      body: "锯齿不是折得越多越有力量。超过 6 个高频拐点时，每段来不及建立速度就被迫折返，退化成边缘锯齿花边，干扰主体阅读。",
      action: "点下方「− 减折点」把拐点精简到 3–5 处，让每一段斜线都有冲刺空间。",
      fixLabel: "精简至 4 处主拐点",
      fixType: "trimTurns",
    });
  } else if (turnCount < LIMITS.minTurns) {
    issues.push({
      code: "too_few",
      badge: `仅 ${turnCount} 折退化`,
      title: `只有 ${turnCount} 处转折，已退化成单折构图`,
      body: "1–2 个折点只能构成 034 V 形或 035 Z 形的一次扫读，还撑不起锯齿形构图「连续折线、层层推进」的反复跳跃节奏。",
      action: "点下方「+ 增折点」补到 3–5 个交替拐点，让视线形成连续推力。",
      fixLabel: "增加至 4 处主拐点",
      fixType: "addTurns",
    });
  } else if (altSignCount < 2) {
    issues.push({
      code: "same_side",
      badge: "未左右交替折返",
      title: "拐点朝同一侧弯折，滑向弧形包围而非锯齿",
      body: "锯齿形的关键在于相邻折角正反交替、来回切换方向；若连续朝同一侧弯，视线会绕成半圆（靠近 036 C 形构图），冲刺动感骤减。",
      action: "把相邻两个拐点一左一右错开，恢复来回折返的锯齿骨架。",
      fixLabel: "恢复左右交替折返",
      fixType: "alternate",
    });
  }

  if (minSegShare < LIMITS.minSegShare) {
    issues.push({
      code: "micro_stub",
      badge: "毛刺短节",
      title: `最短折段仅占总长 ${Math.round(minSegShare * 100)}%，出现碎颤毛刺`,
      body: "极短的折段会让视线突然卡顿一下却撑不起独立节奏，看起来像描点失误而不是有意编排的短拍停顿。",
      action: "把挨得过近的两个拐点拉开间距，让最短段落至少占总路径 10% 以上。",
      fixLabel: "拉开过密短段",
      fixType: "fixRhythm",
    });
  } else if (lengthRatio < LIMITS.minLengthRatio) {
    issues.push({
      code: "mono_rhythm",
      badge: `等距 ${lengthRatio.toFixed(2)}×`,
      title: `各段长度几乎齐平（长短比 ${lengthRatio.toFixed(2)}×），节奏像机械锯条`,
      body: "原海报「节奏跳跃」明确要求「通过长短不同的折线段落，制造节奏快慢变化」。现在每段等长等距，呆板得像工地警示边框。",
      action: "拖开其中一个拐点拉长冲刺段、收短蓄力段，使最长/最短段比拉开到 1.4× 以上。",
      fixLabel: "拉开长短节奏跳跃",
      fixType: "fixRhythm",
    });
  }

  if (!focalOnCorner) {
    issues.push({
      code: focalOnSegment ? "focal_segment" : "focal_off",
      badge: focalOnSegment ? "焦点滑在直段" : "焦点脱轨黑空",
      title: focalOnSegment
        ? "星芒落在直段中途，视线冲过不住脚"
        : `星芒偏离最近拐点 ${Math.round(dCorner * 100)}%，完全脱轨`,
      body: "原海报「视觉焦点」强调把最重要元素放在折线的转折处。视觉科学研究（Persike & Meinhardt, 2017）也表明，尖锐折角需要清晰角点锚定，才能把两端视线能量锁在同一处。",
      action: "直接把双环星芒拖到中央锐拐上（或点一下任意拐点让焦点卡扣过去）。",
      fixLabel: "把焦点锚定到主拐点",
      fixType: "snapFocal",
    });
  } else if (!focalOnStrongCorner) {
    issues.push({
      code: "focal_weak",
      badge: `弱拐 ${Math.round(nearestCorner.innerAngle)}°`,
      title: `焦点落在了平钝弱拐（${Math.round(nearestCorner.innerAngle)}°），聚能不足`,
      body: "虽然贴在折线上，但这个顶点几乎没有发生急转，两条线段指向接近一致，形不成多方向能量对撞的焦点效应。",
      action: "把这个拐点往外拉尖到 110° 以内，或把星芒移到更锐利的主转折点上。",
      fixLabel: "拉尖当前焦点拐点",
      fixType: "sharpenFocalCorner",
    });
  }

  // 主诊单与档位（严格用档位 + 示意，不写假精确百分比）
  let primary;
  let impulseGrade;
  if (score === 4) {
    const styleName =
      turnCount === 3 ? "竞速三折爆发解" :
      turnCount >= 5 ? "高能多折脉冲解" :
      "原海报斜冲四折解";
    impulseGrade = minAngle <= 68 ? "高压爆发（示意）" : "刚劲跃动（示意）";
    primary = {
      ok: true,
      badge: `4/4 · ${styleName}`,
      title: `${turnCount} 处锐拐与 ${lengthRatio.toFixed(1)}× 长短跳跃咬合，焦点在拐点引爆`,
      body: `最锐内角 ${Math.round(minAngle)}° 打破静止平衡，${lengthRatio.toFixed(1)}× 的长短段落差让视线先加速冲入、再于拐点急刹聚焦双环星芒，随后顺着下一段长刺冲出画面。你也可以继续拖拽拐点试出别组节奏，或点试错看反向失误。`,
      action: "继续微调任意拐点，感受不同折数与角度下的节奏差异；或切换运动/音乐题材看实景适配。",
      fixLabel: "",
      fixType: "",
    };
  } else {
    const first = issues[0];
    impulseGrade =
      selfIntersect || minAngle < LIMITS.minAngle ? "刺团卡死（示意）" :
      minAngle > LIMITS.maxSharpAngle ? "平缓乏力（示意）" :
      turnCount > LIMITS.maxTurns ? "碎齿噪杂（示意）" :
      lengthRatio < LIMITS.minLengthRatio ? "机械平板（示意）" :
      "蓄势待聚（示意）";
    primary = {
      ok: false,
      badge: `${score}/4 · ${first.badge}`,
      title: first.title,
      body: first.body,
      action: first.action,
      fixLabel: first.fixLabel,
      fixType: first.fixType,
      code: first.code,
    };
  }

  // 供标题自示范使用的锐度强度 [0..1]
  const titleZigIntensity = selfIntersect
    ? 1
    : clamp((165 - minAngle) / 115, 0.06, 1);

  return {
    pts,
    fp,
    turnCount,
    segLens,
    totalLen,
    lengthRatio,
    minSegShare,
    corners,
    minAngle,
    maxAngle,
    sharpestIdx,
    sharpCornerCount,
    altSignCount,
    selfIntersect,
    nearestCorner,
    bestTargetCorner,
    dCorner,
    dLine,
    focalOnCorner,
    focalOnStrongCorner,
    focalOnSegment,
    checks,
    score,
    issues,
    primary,
    impulseGrade,
    titleZigIntensity,
  };
}

// 画布空白处横拖（data-perf-drag 绑定）：连续伸缩所有内部拐点沿法向的偏移量
export function applyAmplitudeDrag(state, deltaU) {
  const pts = state.nodes;
  const p0 = pts[0];
  const p1 = pts[pts.length - 1];
  const dx = p1.u - p0.u;
  const dy = p1.v - p0.v;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // 若焦点本来粘在某个拐点上，记录下来一起跟随移动
  const preEv = evaluate(state, 1.45);
  const lockedCornerIdx = preEv.focalOnCorner ? preEv.nearestCorner.index : -1;

  for (let i = 1; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    const baseU = p0.u + dx * t;
    const baseV = p0.v + dy * t;
    const curOff = (pts[i].u - baseU) * nx + (pts[i].v - baseV) * ny;
    const side = Math.abs(curOff) > 0.005 ? Math.sign(curOff) : (i % 2 === 1 ? -1 : 1);
    // 向右拖（deltaU > 0）拉大锯齿振幅，向左拖收窄甚至反折
    const nextMag = clamp(Math.abs(curOff) + deltaU * 0.55, 0.004, 0.36);
    const nextOff = side * nextMag;
    // 保留原有沿轴位置投影，只调法向振幅
    const curAlong = ((pts[i].u - p0.u) * dx + (pts[i].v - p0.v) * dy) / (len * len);
    const along = clamp(curAlong, 0.08, 0.92);
    pts[i].u = clamp(p0.u + dx * along + nx * nextOff, 0.07, 0.93);
    pts[i].v = clamp(p0.v + dy * along + ny * nextOff, 0.08, 0.92);
  }
  if (lockedCornerIdx > 0) {
    state.focal.u = pts[lockedCornerIdx].u;
    state.focal.v = pts[lockedCornerIdx].v;
  }
  state.activePreset = "custom";
}

// 增减拐点数（保留当前大概振幅感与焦点关系）
export function setTurnCount(state, targetCount) {
  const n = clamp(targetCount, 2, 8);
  const ev = evaluate(state, 1.45);
  const isFlat = ev.minAngle > 125;
  const isVaried = ev.lengthRatio >= 1.32;
  const amp = isFlat ? 0.03 : clamp((145 - ev.minAngle) / 520, 0.11, 0.17);
  const locked = ev.focalOnCorner;
  state.nodes = buildAxisPolyline(n, amp, isVaried);
  if (locked) {
    const mid = Math.max(1, Math.floor(state.nodes.length / 2));
    state.focal = { ...state.nodes[mid] };
  }
  state.activePreset = "custom";
}

// 单步修正（只修当前首要失误的一项，让用户一步步体验构图如何成立）
export function applySingleStepFix(state, aspect = 1.45) {
  const ev = evaluate(state, aspect);
  if (ev.score === 4) return state;
  const fix = ev.primary.fixType;
  const locked = ev.focalOnCorner;
  const midIdx = () => Math.max(1, Math.min(state.nodes.length - 2, Math.floor(state.nodes.length / 2)));

  if (fix === "unfold" || fix === "softenSpike") {
    const n = clamp(ev.turnCount, 3, 5);
    const keepRhythm = ev.lengthRatio >= 1.35;
    state.nodes = buildAxisPolyline(n, 0.135, keepRhythm);
    if (locked) state.focal = { ...state.nodes[midIdx()] };
  } else if (fix === "sharpen") {
    // 保持当前折数与等距/错落特征，仅拉尖振幅
    const keepVaried = ev.lengthRatio >= 1.35;
    state.nodes = buildAxisPolyline(ev.turnCount, 0.145, keepVaried);
    if (locked) state.focal = { ...state.nodes[midIdx()] };
  } else if (fix === "trimTurns" || fix === "addTurns") {
    const keepFlat = ev.minAngle > LIMITS.maxSharpAngle;
    const keepVaried = ev.lengthRatio >= 1.35;
    state.nodes = buildAxisPolyline(4, keepFlat ? 0.032 : 0.145, keepVaried);
    if (locked) state.focal = { ...state.nodes[2] };
  } else if (fix === "alternate") {
    state.nodes = buildAxisPolyline(clamp(ev.turnCount, 3, 5), 0.14, ev.lengthRatio >= 1.35);
    if (locked) state.focal = { ...state.nodes[midIdx()] };
  } else if (fix === "fixRhythm") {
    const keepFlat = ev.minAngle > LIMITS.maxSharpAngle;
    state.nodes = buildAxisPolyline(ev.turnCount, keepFlat ? 0.032 : 0.145, true);
    if (locked) state.focal = { ...state.nodes[midIdx()] };
  } else if (fix === "snapFocal") {
    const target = ev.bestTargetCorner;
    state.focal = { u: target.u, v: target.v };
  } else if (fix === "sharpenFocalCorner") {
    const idx = ev.nearestCorner.index;
    const p0 = state.nodes[0];
    const p1 = state.nodes[state.nodes.length - 1];
    const dx = p1.u - p0.u;
    const dy = p1.v - p0.v;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const side = idx % 2 === 1 ? -1 : 1;
    state.nodes[idx].u = clamp(state.nodes[idx].u + nx * side * 0.12, 0.10, 0.90);
    state.nodes[idx].v = clamp(state.nodes[idx].v + ny * side * 0.12, 0.10, 0.90);
    state.focal = { ...state.nodes[idx] };
  }
  state.activePreset = "custom";
  return state;
}
