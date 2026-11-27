// 090 动态构图 · 单一真源物理与构图诊断模型
// 所有实绘几何坐标、角度、体量比、步距比与 9 类错态诊断均从同一组计算结果导出。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·动势",
    short: "原海报",
    caption: "1:1 转译 090 原海报：亮橙箭矢、深石油青闪电、大小圆球与斜向速度尾迹。",
    titleTag: "DYNAMIC 090",
  },
  sprint: {
    id: "sprint",
    label: "运动·冲刺海报",
    short: "冲刺海报",
    caption: "赛事海报语境：纯剪影跑者顺斜轴冲刺，依靠体量差与递增步距拉满起跑推力。",
    titleTag: "SPRINT 2026",
  },
  festival: {
    id: "festival",
    label: "音乐节·声浪",
    short: "声浪视觉",
    caption: "演出现场主视觉：斜切声波带与高反差聚焦光轮叠加，避免满屏乱斜成噪音。",
    titleTag: "PULSE LIVE",
  },
};

// 开场刻意停在 0/4 僵死静止错态：0° 水平锁死 + 1.1× 均权大小 + 0% 等拍步距 + 2 处逆势对冲 + 速度切线关闭
export const INITIAL_STATE = {
  scene: "poster",
  angle: 0,
  contrast: 1.1,
  rhythm: 0,
  conflicts: { bolt: true, dart: true },
  speedCue: false,
  highlightProbe: null,
};

// 合法多解与双向试错预设
export const PRESETS = {
  // 合法多解（均可通过 4/4 单真源检核）
  poster: {
    label: "海报上扬 54°",
    kind: "valid",
    state: { angle: 54, contrast: 3.2, rhythm: 66, conflicts: { bolt: false, dart: false }, speedCue: true },
  },
  dive: {
    label: "极速俯冲 -34°",
    kind: "valid",
    state: { angle: -34, contrast: 2.9, rhythm: 58, conflicts: { bolt: false, dart: false }, speedCue: true },
  },
  surge: {
    label: "蓄势爆发 38°",
    kind: "valid",
    state: { angle: 38, contrast: 3.9, rhythm: 78, conflicts: { bolt: false, dart: false }, speedCue: true },
  },
  // 双向试错（刻意触发各类典型错误）
  errFlat: {
    label: "0° 水平僵死",
    kind: "error",
    state: { angle: 0, contrast: 1.1, rhythm: 0, conflicts: { bolt: true, dart: true }, speedCue: false },
  },
  errCollision: {
    label: "逆势对冲",
    kind: "error",
    state: { angle: 52, contrast: 3.0, rhythm: 62, conflicts: { bolt: true, dart: true }, speedCue: true },
  },
  errBloat: {
    label: "巨块窒息",
    kind: "error",
    state: { angle: 48, contrast: 5.5, rhythm: 60, conflicts: { bolt: false, dart: false }, speedCue: true },
  },
  errCram: {
    label: "挤角乱拍",
    kind: "error",
    state: { angle: 50, contrast: 2.8, rhythm: 98, conflicts: { bolt: false, dart: false }, speedCue: true },
  },
  errVertical: {
    label: "74° 近垂失势",
    kind: "error",
    state: { angle: 74, contrast: 3.0, rhythm: 60, conflicts: { bolt: false, dart: false }, speedCue: true },
  },
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function cloneState(s) {
  return {
    scene: s.scene,
    angle: s.angle,
    contrast: s.contrast,
    rhythm: s.rhythm,
    conflicts: { bolt: !!s.conflicts.bolt, dart: !!s.conflicts.dart },
    speedCue: !!s.speedCue,
    highlightProbe: s.highlightProbe || null,
  };
}

// 按节拍加速参数把基础线性参数 u ∈ [0, 1] 映射为「前蓄势、后爆发」的递增步距轨迹
// rhythm = 0 -> 严格等距；rhythm = 45..85 -> 起步紧凑蓄势、中后段大跨步冲向主焦点；rhythm > 91 -> 起点挤角碰撞
function warpTrack(u, rhythm) {
  const k = clamp(rhythm, 0, 100) / 100;
  const gamma = 1 + k * 1.15 + Math.max(0, k - 0.86) * 14;
  return clamp(Math.pow(clamp(u, 0, 1), gamma), 0, 1);
}

// 从状态计算单一真源几何：所有元素坐标都在像素空间 [0..W, 0..H] 内的归一化版面基准下导出
export function computeLayout(state, width = 800, height = 500) {
  const w = Math.max(200, width);
  const h = Math.max(160, height);
  const minDim = Math.min(w, h);
  const cx = w * 0.5;
  const cy = h * 0.52;

  const rad = (clamp(state.angle, -55, 75) * Math.PI) / 180;
  // 屏幕 Y 向下，正角度（如 +54°）从左下冲向右上，与 090 原海报一致
  const ux = Math.cos(rad);
  const uy = -Math.sin(rad);
  // 法线（指向轨迹左上方）
  const nx = -uy;
  const ny = ux;

  // 在矩形安全框内求沿 (ux, uy) 方向的最大可用半跨度，确保合法解（含 3.9× 蓄势爆发）都不把主焦点裁出画框
  const padX = w * 0.14;
  const padY = h * 0.185;
  const halfW = w * 0.5 - padX;
  const halfH = h * 0.5 - padY;
  const maxHalfX = Math.abs(ux) > 1e-4 ? halfW / Math.abs(ux) : 1e6;
  const maxHalfY = Math.abs(uy) > 1e-4 ? halfH / Math.abs(uy) : 1e6;
  const halfSpan = Math.min(maxHalfX, maxHalfY, Math.hypot(halfW, halfH) * 0.9);

  const along = (s, offset = 0) => ({
    x: cx + ux * (s * halfSpan) + nx * (offset * minDim),
    y: cy + uy * (s * halfSpan) + ny * (offset * minDim),
  });

  // 4 枚核心圆球沿主轨迹排布（对应 090 原海报的深青大圆、深青小圆、亮橙中圆、右上主橙大日）
  const baseU = [0.06, 0.37, 0.68, 0.99];
  const mappedU = baseU.map((u) => warpTrack(u, state.rhythm));
  const trackS = mappedU.map((u) => -0.82 + u * 1.62);

  // 体量差：contrast = 1.0 时 4 球近乎等大；contrast = 3.2~3.9 时大球清晰聚焦不撞边；>4.9 时巨球压框窒息
  const cVal = clamp(state.contrast, 1.0, 5.8);
  const smallR = minDim * (0.061 - clamp((cVal - 1.0) * 0.0052, 0, 0.02));
  const heroR = smallR * cVal;
  // 4 个球的半径递增曲线：底左锚球、中段小青球、中上橙球、终点主焦点大橙球
  const radii = [
    smallR * (1 + (cVal - 1) * 0.34), // orb 0: 下左深青稳锚球
    smallR,                            // orb 1: 中段深青小节奏球（最小参考球）
    smallR * (1 + (cVal - 1) * 0.24), // orb 2: 中上亮橙加速球
    heroR,                             // orb 3: 终点主爆发大橙球（最大聚焦球）
  ];

  // 与轨迹的微错位，呈现原海报非对称穿插感（0° 时贴在僵硬中线上）
  const tiltFactor = clamp(Math.abs(state.angle) / 36, 0, 1);
  const lateralOffsets = [
    0.045 * tiltFactor,
    0.065 * tiltFactor,
    0.045 * tiltFactor,
    -0.01 * tiltFactor,
  ];

  const orbs = trackS.map((s, i) => {
    const pt = along(s, lateralOffsets[i]);
    return {
      id: `orb-${i}`,
      index: i,
      s,
      u: mappedU[i],
      x: pt.x,
      y: pt.y,
      r: radii[i],
      tone: i === 0 || i === 1 ? "teal" : "orange",
      isHero: i === 3,
    };
  });

  // 额外小卫星青圆（原海报紧咬大橙球左下沿的深青小圆，用于制造碰撞张力）
  const satS = clamp(trackS[3] - (radii[3] / Math.max(1, halfSpan)) * 0.78, -0.7, 0.96);
  const satPt = along(satS, 0.035 * tiltFactor);
  const satelliteOrb = {
    x: satPt.x,
    y: satPt.y,
    r: clamp(smallR * 0.88, minDim * 0.032, minDim * 0.062),
  };

  // 主橙色冲锋箭（从起势端冲向中上）
  const arrowTail = along(-0.92, -0.08 * tiltFactor);
  const arrowHead = along(0.18, -0.05 * tiltFactor);

  // 两个可点击的「逆冲/顺势」演员：深青闪电（bolt）与辅助尖镖（dart）
  const boltAnchor = along(0.12, -0.175);
  const boltAngle = state.conflicts.bolt ? rad + Math.PI * 0.88 : rad;

  const dartAnchor = along(0.56, -0.16);
  const dartAngle = state.conflicts.dart ? rad - Math.PI * 0.86 : rad;

  // 起点波浪带（对应原海报左下橙色 S 弯弧）
  const waveAnchor = along(-0.76, 0.16);

  // 从实绘坐标反算全部物理指标（单一真源！）
  const startPt = orbs[0];
  const endPt = orbs[3];
  const dxPath = endPt.x - startPt.x;
  const dyPath = endPt.y - startPt.y;
  const measuredAngle = (Math.atan2(-dyPath, dxPath) * 180) / Math.PI;

  const minR = Math.min(...orbs.map((o) => o.r));
  const maxR = Math.max(...orbs.map((o) => o.r));
  const measuredScaleRatio = maxR / Math.max(1, minR);

  // 主球面积占画布比 & 是否裁出画布边
  const heroAreaShare = (Math.PI * endPt.r * endPt.r) / (w * h);
  const heroClipsEdge =
    endPt.x - endPt.r < 6 ||
    endPt.x + endPt.r > w - 6 ||
    endPt.y - endPt.r < 6 ||
    endPt.y + endPt.r > h - 6;

  // 相邻圆球沿轨迹的中心距与边到边净隙
  const centerGaps = [];
  const edgeClearances = [];
  for (let i = 0; i < orbs.length - 1; i++) {
    const a = orbs[i];
    const b = orbs[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    centerGaps.push(dist);
    edgeClearances.push((dist - a.r - b.r) / minDim);
  }
  const maxGap = Math.max(...centerGaps);
  const minGap = Math.min(...centerGaps);
  const measuredGapRatio = maxGap / Math.max(1, minGap);
  const measuredMinClearance = Math.min(...edgeClearances);

  // 方向向量一致性（5 个方向演员：主轴、主箭、波浪推进、闪电、尖镖）
  const conflictCount = (state.conflicts.bolt ? 1 : 0) + (state.conflicts.dart ? 1 : 0);
  const alignedPct = Math.round(((5 - conflictCount * 2) / 5) * 100);

  return {
    w,
    h,
    minDim,
    cx,
    cy,
    rad,
    ux,
    uy,
    nx,
    ny,
    halfSpan,
    along,
    orbs,
    satelliteOrb,
    arrowTail,
    arrowHead,
    bolt: {
      x: boltAnchor.x,
      y: boltAnchor.y,
      angle: boltAngle,
      conflict: !!state.conflicts.bolt,
      hitR: Math.max(36, minDim * 0.13),
    },
    dart: {
      x: dartAnchor.x,
      y: dartAnchor.y,
      angle: dartAngle,
      conflict: !!state.conflicts.dart,
      hitR: Math.max(32, minDim * 0.115),
    },
    waveAnchor,
    metrics: {
      angle: Math.round(measuredAngle),
      absAngle: Math.abs(measuredAngle),
      scaleRatio: +measuredScaleRatio.toFixed(1),
      gapRatio: +measuredGapRatio.toFixed(2),
      minClearance: +measuredMinClearance.toFixed(3),
      heroAreaShare: +heroAreaShare.toFixed(3),
      heroClipsEdge,
      conflictCount,
      alignedPct,
      speedCue: !!state.speedCue,
    },
  };
}

// 双向诊断引擎：从 computeLayout 的实绘指标单真源产出 4 项总检 + 5 枚原海报圆徽探针 + 白话诊单
export function evaluate(state, width = 800, height = 500) {
  const layout = computeLayout(state, width, height);
  const m = layout.metrics;

  const isFlat = m.absAngle < 14;
  const isTooSteep = m.absAngle > 68;
  const isDive = m.angle <= -14 && m.angle >= -68;
  const isOverBloat = m.heroAreaShare > 0.25 || m.heroClipsEdge || m.scaleRatio > 4.9;
  const isEqualMass = m.scaleRatio < 1.75;
  const isCrammed = state.rhythm > 91 || m.minClearance < -0.065;
  const isUniformBeat = m.gapRatio < 1.45;
  const hasConflict = m.conflictCount > 0;
  const noSpeed = !m.speedCue;

  // 4 项硬检核
  const passDirection = !isFlat && !isTooSteep && !hasConflict;
  const passTension = !isEqualMass && !isOverBloat;
  const passRhythm = !isUniformBeat && !isCrammed;
  const passEnergy = !noSpeed && !hasConflict && !isFlat && !isOverBloat;

  const passedCount = [passDirection, passTension, passRhythm, passEnergy].filter(Boolean).length;

  // 定性动能档位（严守 BRIEF #4：绝不用假精确百分数！）
  let energyTier = "僵死静止";
  if (passedCount === 4) {
    energyTier = isDive ? "强俯冲流" : "强上扬流";
  } else if (hasConflict && !isFlat) {
    energyTier = "逆冲内耗";
  } else if (isOverBloat || isCrammed) {
    energyTier = "拥堵滞流";
  } else if (passedCount >= 2) {
    energyTier = "初具势能";
  }

  // 9 类错态按教学优先级排序，确保每一步操作都给出最直白的「为什么 + 下一步」
  let code = "PASS";
  let badge = `${passedCount}/4 · 动势成立`;
  let headline = isDive
    ? `4/4 俯冲动势成立：${m.angle}° 下切斜轴配 ${m.scaleRatio}× 体量差，极具速度冲击`
    : `4/4 动态构图成立：+${m.angle}° 上扬斜轴配 ${m.scaleRatio}× 体量差与 ${m.gapRatio}× 递增节拍`;
  let why = isDive
    ? "左上至右下的负斜角制造强烈的俯冲与下坠惯性，大球稳住落点、前疏后密的步距与速度切线把视线一路推向终点，这是与原海报上扬势互补的另一组合法解。"
    : "所有方向线索统一指向右上，打破了水平对称的停滞；3 倍级大小落差与渐密节拍把视线从入口加速推向主焦点，既充满流动感又保持了动态平衡。";
  let action = "按 Space（或点「脉冲放流」）观察能量沿实绘轨迹一气呵成冲入主焦点，也可切不同场景或试一试「双向试错」。";

  if (isFlat) {
    code = "STATIC_FLAT";
    badge = `${passedCount}/4 · 水平锁死 ${m.angle}°`;
    headline = `主轴贴在 ${m.angle}° 水平基准上，画面彻底卡在静态格局`;
    why = "人眼对 0° 水平线和 90° 竖线有天然的重力基准感（斜线效应），整组图形横平排开时视线只觉得安稳呆板——这是相邻页 089 静态构图的领地，还谈不上流动。";
    action = "直接向右横拖画布（或拖动「动势倾角」），把主轴掰到 24°–60° 上扬斜势或 -20° 至 -48° 俯冲斜势。";
  } else if (isTooSteep) {
    code = "NEAR_VERTICAL";
    badge = `${passedCount}/4 · 近垂失势 ${m.angle}°`;
    headline = `倾角拉到了 ${m.angle}°，斜势反而退化成竖向立柱`;
    why = "动势不是越陡越强。超过 68° 以后，轨迹贴近 90° 垂线，大脑重新把它认成静止的柱子，横向推进的冲力消失了。";
    action = "把「动势倾角」回收到 25°–60° 的黄金斜势区间，重新拉出横向位移与上升合力。";
  } else if (hasConflict) {
    code = "COUNTER_COLLISION";
    badge = `${passedCount}/4 · 逆冲 ${m.conflictCount} 处`;
    headline = `画布里有 ${m.conflictCount} 处图形逆向顶牛，视觉动能原地抵消`;
    why = "动态构图最忌讳「多方向互撞」。主箭往右上冲，深青闪电或尖镖却反着刺回来，读者的视线在半路撞车折返，能量变成杂乱的摩擦。";
    action = "直接点击画布上标红的「逆冲·点扳顺」闪电或尖镖（或点下方「扳顺逆冲」键），让全部矢量汇入同一方向。";
  } else if (isOverBloat) {
    code = "OVER_BLOAT";
    badge = `${passedCount}/4 · 巨块窒息 ${m.scaleRatio}×`;
    headline = `主焦点球膨胀到 ${m.scaleRatio}× 并压垮画框，视觉通道被堵死`;
    why = "对比越大不代表越好。当主圆吞掉过大画幅甚至撞边裁切时，流动的跑道被巨石封住，动态构图只剩下沉重的压迫感。";
    action = "把「体量对比」回收到 2.0×–4.2×（或点主圆球微调），为主焦点和加速路径同时留出呼吸余地。";
  } else if (isEqualMass) {
    code = "EQUAL_MASS";
    badge = `${passedCount}/4 · 均权平铺 ${m.scaleRatio}×`;
    headline = `圆球大小几乎一样（仅 ${m.scaleRatio}×），有斜线却没有主次爆发`;
    why = "光把图形斜着放只是「倾斜的静物」。如果入口球和终点球差不多大，视线走到尽头没有高潮落点，张力立刻泄气。";
    action = "向右拉大「体量对比」（或直接点击画布上的圆球）到 2.2×–4.0×，拉开大—中—小的视觉落差。";
  } else if (isCrammed) {
    code = "CORNER_CRAM";
    badge = `${passedCount}/4 · 挤角叠撞`;
    headline = `节拍加速拉爆（${state.rhythm}%），前端元素挤成一团互相吞噬`;
    why = "疏密变化需要留出可辨识的间隙。过度把起势端元素堆成一团会让形状粘连糊成一块，原本清脆的加速节奏变成拥堵的死胡同。";
    action = "把「节拍加速」回退到 45%–82%，让前紧后展的步距保留清晰呼吸缝。";
  } else if (isUniformBeat) {
    code = "UNIFORM_BEAT";
    badge = `${passedCount}/4 · 等拍呆板 ${m.gapRatio}×`;
    headline = `元素间距像节拍器一样均匀（步距比 ${m.gapRatio}×），缺少加速推力`;
    why = "等距排列带来的是机械重复的静态秩序。把间距拉开成由疏到密的渐进变化，大脑才会读出「正在加速冲刺」的时间流动感。";
    action = "向右拉动「节拍加速」到 45%–80%，让圆球步距拉出 1.6× 以上的渐进节奏。";
  } else if (noSpeed) {
    code = "NO_SPEED_CUE";
    badge = `${passedCount}/4 · 缺速度切线`;
    headline = `骨架已斜，但少了速度切线与半调尾迹，画面还显迟缓`;
    why = "原海报用白色速度斜切和半调喷点在静态纸面上模拟「运动残影」。加上方向性拖影后，图形才真正产生掠过空气的速度感知。";
    action = "开启「速度尾迹」开关，给主箭和焦点叠上 090 原海报标志性的白切速线与喷点尾流。";
  }

  // 1:1 对应原海报右侧 5 枚圆徽的实时单真源探针
  const probes = [
    {
      key: "direction",
      title: "方向引导",
      tone: "teal",
      ok: passDirection,
      status: isFlat
        ? `锁死 ${m.angle}°`
        : isTooSteep
          ? `近垂 ${m.angle}°`
          : hasConflict
            ? `逆冲 ${m.conflictCount} 处`
            : m.angle > 0
              ? `上扬 +${m.angle}°`
              : `俯冲 ${m.angle}°`,
      body: "利用斜线、箭头、视线走向等元素，引导观者的视线自然流动。",
    },
    {
      key: "tension",
      title: "视觉张力",
      tone: "orange",
      ok: passTension,
      status: isOverBloat
        ? `窒息 ${m.scaleRatio}×`
        : isEqualMass
          ? `平铺 ${m.scaleRatio}×`
          : `落差 ${m.scaleRatio}×`,
      body: "通过大小对比、形状冲突与空间压缩，制造紧张感与吸引力。",
    },
    {
      key: "rhythm",
      title: "动感节奏",
      tone: "teal",
      ok: passRhythm,
      status: isCrammed
        ? "挤角叠撞"
        : isUniformBeat
          ? `等拍 ${m.gapRatio}×`
          : `递增 ${m.gapRatio}×`,
      body: "重复、渐变与疏密变化形成节奏，产生韵律与连续的视觉推动力。",
    },
    {
      key: "speed",
      title: "速度感知",
      tone: "orange",
      ok: !noSpeed && !isFlat,
      status: noSpeed ? "尾迹关闭" : isFlat ? "无斜无速" : "速线激活",
      body: "模糊、拖影、放射等效果增强运动感，让画面传达速度与时间流动。",
    },
    {
      key: "energy",
      title: "能量爆发",
      tone: "teal",
      ok: passedCount === 4,
      status: `${energyTier}（示意）`,
      body: "大面积色块、强对比与集中焦点，释放能量，传递情绪与力量。",
    },
  ];

  return {
    layout,
    metrics: m,
    passedCount,
    isPass: passedCount === 4,
    code,
    badge,
    headline,
    why,
    action,
    energyTier,
    probes,
  };
}
