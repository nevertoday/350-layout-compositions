// 068 尺度递减构图 · 单一真源几何与诊断模型
// 开场对角画布、奶黄 8 级比例参考尺、四关键词状态徽、三联技巧卡与白话诊单全部从此模块读取同一组实绘坐标与半径。

export const POSTER_FRACTIONS = [
  { label: "1", value: 1 },
  { label: "3/4", value: 3 / 4 },
  { label: "1/2", value: 1 / 2 },
  { label: "1/3", value: 1 / 3 },
  { label: "1/4", value: 1 / 4 },
  { label: "1/6", value: 1 / 6 },
  { label: "1/8", value: 1 / 8 },
  { label: "1/12", value: 1 / 12 },
  { label: "1/16", value: 1 / 16 },
  { label: "1/20", value: 1 / 20 },
  { label: "1/26", value: 1 / 26 },
];

export const THEMES = {
  poster: { id: "poster", label: "原海报圆列", unit: "橄榄圆" },
  avenue: { id: "avenue", label: "林荫树道", unit: "行道树" },
  spada: { id: "spada", label: "斯帕达柱廊", unit: "立柱" },
};

export const LAWS = {
  poster: { id: "poster", label: "原海报分数", desc: "1 · 3/4 · 1/2 · 1/3 · 1/4 · 1/6 · 1/8 · 1/12 阶梯" },
  geometric: { id: "geometric", label: "严格等比", desc: "每步按固定公比 r 连续缩小，节奏最匀称" },
  harmonic: { id: "harmonic", label: "透视调和", desc: "等距物理阵列在单灭点下的 1/(1+c·k) 成像律" },
  linear: { id: "linear", label: "等差阶梯", desc: "每步减掉固定尺寸，前缓后骤、末端易断崖" },
};

// 开场刻意停在 0/4 待理序翻车错态：扁平无深 + 第4枚反弹 + 间距等距 + 首圆失锚 + 动线脱轨
export function createInitialState() {
  return {
    theme: "poster",
    law: "geometric",
    ratio: 0.94,
    spacingMode: "even",      // "even" | "perspective" | "wide"
    pathMode: "derailed",     // "derailed" | "diagonal" | "arc"
    headAnchor: "floating",   // "floating" | "bleed"
    count: 9,
    overrides: { 3: 1.38 },   // 第 4 枚（0-based index 3）反弹破序
    selected: 3,
    showCone: false,
  };
}

// 多组正当解预置
export const PRESETS = {
  poster: {
    label: "原海报解",
    state: {
      theme: "poster",
      law: "poster",
      ratio: 0.72,
      spacingMode: "perspective",
      pathMode: "arc",
      headAnchor: "bleed",
      count: 9,
      overrides: {},
      selected: 0,
      showCone: false,
    },
  },
  harmonic: {
    label: "透视调和解",
    state: {
      law: "harmonic",
      ratio: 0.74,
      spacingMode: "perspective",
      pathMode: "diagonal",
      headAnchor: "bleed",
      count: 9,
      overrides: {},
      selected: 0,
    },
  },
  geometric: {
    label: "等比韵律解",
    state: {
      law: "geometric",
      ratio: 0.76,
      spacingMode: "perspective",
      pathMode: "arc",
      headAnchor: "bleed",
      count: 8,
      overrides: {},
      selected: 0,
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 将归一化比例转成便于阅读的分数/比例读数（仅原海报模式给经典分数，连续律给精准两位小数避免重复分数标签）
export function formatScaleTag(s, law, index) {
  if (law === "poster" && index < POSTER_FRACTIONS.length && Math.abs(s - POSTER_FRACTIONS[index].value) < 0.015) {
    return POSTER_FRACTIONS[index].label;
  }
  if (index === 0 && Math.abs(s - 1) < 0.015) return "1";
  if (s >= 1.01) return `${s.toFixed(2)}×`;
  return s.toFixed(2);
}

// 计算单枚元素的相对尺度序列（相对首枚 = 1.0，叠加 overrides）
export function computeRawScales(state) {
  const n = clamp(Math.round(state.count), 3, 11);
  const r = clamp(state.ratio, 0.42, 0.97);
  const base = [];
  for (let i = 0; i < n; i++) {
    let s = 1;
    if (state.law === "poster") {
      // 原海报分数序列基准，随 ratio 相对 0.72 的偏移可微调保持顺滑响应
      const pf = i < POSTER_FRACTIONS.length
        ? POSTER_FRACTIONS[i].value
        : POSTER_FRACTIONS[POSTER_FRACTIONS.length - 1].value * Math.pow(0.76, i - POSTER_FRACTIONS.length + 1);
      const power = Math.log(r) / Math.log(0.72);
      s = Math.pow(pf, clamp(power, 0.22, 2.2));
    } else if (state.law === "harmonic") {
      // 1 / (1 + c * i)：让第 2 枚（i=1）恰好落在 r 处 => c = (1/r) - 1
      const c = (1 / r) - 1;
      s = 1 / (1 + c * i);
    } else if (state.law === "linear") {
      // 等差递减：每步减固定量 step = 1 - r，触底保留极小可见值避免负半径
      const step = (1 - r) * 0.56;
      s = Math.max(0.028, 1 - step * i);
    } else {
      // 严格等比
      s = Math.pow(r, i);
    }
    const mult = state.overrides?.[i] ?? 1;
    base.push(clamp(s * mult, 0.022, 1.55));
  }
  return base;
}

// 计算在归一化画布 [0..1] x [0..1] 内的实绘几何（u:左→右, v:上→下；半径按画布短边归一化）
export function computeLayout(state, aspect = 1.35) {
  const scales = computeRawScales(state);
  const n = scales.length;
  const bleed = state.headAnchor === "bleed";

  // 首枚圆半径（按短边归一化）：出血破框时沉稳压阵；缩框漂浮时偏小无压阵感，且保证扁平错态下各圆仍清晰可辨
  const baseR = bleed ? 0.245 : 0.112;
  const radii = scales.map((s) => baseR * s);

  // 起点与终点（原海报从左下出血一路伸向右上远点）
  const p0 = bleed ? { u: 0.095, v: 0.865 } : { u: 0.155, v: 0.76 };
  const pEnd = state.pathMode === "derailed"
    ? { u: 0.90, v: 0.25 }
    : { u: 0.935, v: 0.105 };

  // 根据 spacingMode 决定沿着路径参数 t[0..1] 的步进权重
  const weights = [];
  for (let i = 0; i < n - 1; i++) {
    const avgR = (radii[i] + radii[i + 1]) * 0.5;
    if (state.spacingMode === "perspective") {
      // 间距随两圆尺度和深度自然收紧（透视近疏远密）
      weights.push(Math.pow(avgR, 0.96) + 0.008);
    } else if (state.spacingMode === "wide") {
      // 反向拉宽：越远越稀疏
      weights.push(0.42 + (i / Math.max(1, n - 1)) * 0.85);
    } else {
      // 僵硬等距：不管圆多小都占同样步长
      weights.push(1);
    }
  }
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const ts = [0];
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / totalW;
    ts.push(acc);
  }

  // 路径形状：原海报微上凸柔弧 / 直线收束 / 脱轨折拐
  function samplePath(t, idx) {
    let u = p0.u + (pEnd.u - p0.u) * t;
    let v = p0.v + (pEnd.v - p0.v) * t;
    if (state.pathMode === "arc") {
      // 原海报圆列呈极柔和的向左上方微拱弧线（像天际升弧）
      const arch = Math.sin(t * Math.PI);
      u -= arch * 0.055;
      v -= arch * 0.078;
    } else if (state.pathMode === "derailed") {
      // 脱轨错态：中后段上下抖折、末段垂头泄气
      const zig = Math.sin(t * Math.PI * 2.4) * 0.095;
      u += Math.sin(t * Math.PI) * 0.03;
      v += zig + (idx >= n - 2 ? 0.07 * (idx - (n - 3)) : 0);
    }
    return { u: clamp(u, 0.04, 0.965), v: clamp(v, 0.06, 0.94) };
  }

  const items = [];
  for (let i = 0; i < n; i++) {
    const pt = samplePath(ts[i], i);
    const hasOverride = state.overrides?.[i] != null && Math.abs(state.overrides[i] - 1) > 0.02;
    items.push({
      index: i,
      t: ts[i],
      u: pt.u,
      v: pt.v,
      scale: scales[i],
      r: radii[i],
      label: formatScaleTag(scales[i], state.law, i),
      depth: 1 / Math.max(0.03, scales[i]), // 反推相对视距（首枚=1.0）
      hasOverride,
    });
  }

  // 计算真实几何指标（按 aspect 换算成等比距离）
  const stepRatios = [];
  const gaps = [];
  const overlaps = [];
  const reversals = [];
  for (let i = 0; i < n - 1; i++) {
    const a = items[i];
    const b = items[i + 1];
    const ratioStep = b.r / Math.max(1e-5, a.r);
    stepRatios.push(ratioStep);
    if (b.r > a.r * 1.015) {
      reversals.push({ index: i + 1, jumpPct: Math.round((ratioStep - 1) * 100) });
    }
    const dist = Math.hypot((b.u - a.u) * aspect, b.v - a.v);
    gaps.push(dist);
    const sumR = a.r + b.r;
    const overlapFrac = sumR > 0 ? Math.max(0, (sumR - dist) / Math.min(a.r, b.r)) : 0;
    overlaps.push(overlapFrac);
  }

  // 首尾实测跨比（取首枚与末枚半径比）
  const spanRatio = items[0].r / Math.max(1e-5, items[n - 1].r);
  const avgStepRatio = stepRatios.length
    ? Math.pow(items[n - 1].r / Math.max(1e-5, items[0].r), 1 / stepRatios.length)
    : 1;
  const minStepRatio = stepRatios.length ? Math.min(...stepRatios) : 1;

  // 间距收敛比：后半段平均中心距 / 前半段平均中心距（< 0.62 才算近疏远密）
  const half = Math.max(1, Math.floor(gaps.length / 2));
  const frontGap = gaps.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const backGap = gaps.slice(-half).reduce((a, b) => a + b, 0) / half;
  const gapConvergence = frontGap > 1e-5 ? backGap / frontGap : 1;

  // 最大重叠比例
  const maxOverlap = overlaps.length ? Math.max(...overlaps) : 0;

  // 过小看不见的尘点数量（在 480px 短边上半径 < 3px，即 r < 0.0068）
  const vanishedCount = items.filter((it) => it.r < 0.0075).length;

  // 路径平滑度（相邻线段夹角偏转最大值，度）
  let maxBendDeg = 0;
  for (let i = 1; i < n - 1; i++) {
    const v1x = (items[i].u - items[i - 1].u) * aspect;
    const v1y = items[i].v - items[i - 1].v;
    const v2x = (items[i + 1].u - items[i].u) * aspect;
    const v2y = items[i + 1].v - items[i].v;
    const m1 = Math.hypot(v1x, v1y);
    const m2 = Math.hypot(v2x, v2y);
    if (m1 > 1e-4 && m2 > 1e-4) {
      const cos = clamp((v1x * v2x + v1y * v2y) / (m1 * m2), -1, 1);
      maxBendDeg = Math.max(maxBendDeg, (Math.acos(cos) * 180) / Math.PI);
    }
  }

  return {
    items,
    aspect,
    stepRatios,
    gaps,
    overlaps,
    reversals,
    metrics: {
      spanRatio,
      avgStepRatio,
      minStepRatio,
      gapConvergence,
      maxOverlap,
      vanishedCount,
      maxBendDeg,
      count: n,
      bleed,
      endDistRatio: items[n - 1].depth,
    },
  };
}

// 单真源四维检核与 8 类失误白话诊单
export function evaluate(state, aspect = 1.35) {
  const layout = computeLayout(state, aspect);
  const { metrics, reversals, items } = layout;
  const issues = [];

  // 8 类失误按严重程度采集
  if (reversals.length > 0) {
    const rev = reversals[0];
    issues.push({
      code: "REVERSAL",
      dim: "gradation",
      tag: "中段反弹",
      headline: `第 ${rev.index + 1} 枚反而胀大了 +${rev.jumpPct}%，纵深秩序当场断层`,
      why: "大脑靠「每一级都比前一级更小」来推断元素在持续远去。只要中间有一枚突然鼓回大尺寸，眼睛立刻被拽回近景，纵深通道瞬间裂成两截。",
      fix: `直接点击画布上带赤赭虚环的第 ${rev.index + 1} 枚（或点下方「修补反弹」），恢复严格单调递减。`,
    });
  }

  if (metrics.count < 5) {
    issues.push({
      code: "TOO_FEW",
      dim: "gradation",
      tag: "级数单薄",
      headline: `当前只有 ${metrics.count} 级元素，只剩大小对比，构不成递减序列`,
      why: "「递减」需要连续的中间过渡级让大脑捕捉规律。少于 5 级时，观者看到的只是几个孤立的大小块，很难形成绵延向远方的动势。",
      fix: "在下方「③ 控制节奏」把元素级数增加到 6–10 级，铺出连续台阶。",
    });
  }

  if (metrics.spanRatio < 2.8 || metrics.avgStepRatio > 0.89) {
    issues.push({
      code: "FLAT",
      dim: "scale",
      tag: "扁平无深",
      headline: `首尾跨比只有 ${metrics.spanRatio.toFixed(1)}×，整排元素像贴在墙上的波点`,
      why: "每级仅缩减不到 10% 时，视网膜上的尺寸落差太弱，大脑默认它们处在同一个平面上，不会把它们解读为「近处到远处」。",
      fix: "向左拖动奶黄「比例参考尺」的衰减滑块到 0.66–0.82 甜区，把首尾跨比拉到 3.5× 以上。",
    });
  }

  if (metrics.vanishedCount >= 3 || (metrics.minStepRatio < 0.45 && state.law !== "linear") || (state.law === "linear" && metrics.minStepRatio < 0.42)) {
    issues.push({
      code: "CLIFF",
      dim: "scale",
      tag: "断崖塌缩",
      headline: `衰减过猛，后段已有 ${Math.max(metrics.vanishedCount, 2)} 枚缩成尘点或出现断崖跌落`,
      why: "相邻步幅骤缩过半时，前两枚会霸占整个画面，后段元素过早失去可读形态，动线走到半路就断了气。",
      fix: "向右回拉奶黄比例尺至 0.66–0.82（或避开等差末段骤跌，改用等比 / 原海报分数 / 透视调和）。",
    });
  }

  if (!metrics.bleed) {
    issues.push({
      code: "FLOATING_HEAD",
      dim: "scale",
      tag: "前景失锚",
      headline: "前景首圆缩进画框漂浮，缺了「近在眼前」的压阵起点",
      why: "看 068 原海报最左下的特大橄榄圆——它故意切出画框边缘。破框出血会让大脑立刻把第一枚当成紧贴眼前的近景锚点，后面的缩减才顺理成章。",
      fix: "在下方「② 增强深度」开启「前景左下出血」，让第一枚稳稳压住左下入口。",
    });
  }

  if (metrics.gapConvergence > 0.68 || state.spacingMode !== "perspective") {
    issues.push({
      code: "EVEN_GAP",
      dim: "depth",
      tag: state.spacingMode === "wide" ? "远端发散" : "僵硬等距",
      headline: state.spacingMode === "wide"
        ? `远端间距反而是近端的 ${metrics.gapConvergence.toFixed(2)}×，透视关系完全倒挂`
        : `后半段中心距仍是前半段的 ${Math.round(metrics.gapConvergence * 100)}%，远景越看越松散`,
      why: "吉布森质地梯度指出：真实纵深里，物体变小的同时，相邻间距也必须按透视同步收紧。只缩大小、不收间距，小圆之间反而露出大片白缝，立体感当场穿帮。",
      fix: "在下方「② 增强深度」把间距规律切到「透视收紧」，让大小与间距同频收敛。",
    });
  }

  if (metrics.maxOverlap > 0.48) {
    issues.push({
      code: "CROWD_OVERLAP",
      dim: "depth",
      tag: "过密糊团",
      headline: `前中段重叠吃进 ${Math.round(metrics.maxOverlap * 100)}%，退化成了遮挡堆叠`,
      why: "重叠空间靠的是前后遮挡（见 067），而尺度递减靠的是每枚形体清晰独立、间隔有呼吸。互相咬死成一团后，阶梯节奏就被吞掉了。",
      fix: "适当调小衰减比或减少元素级数，让相邻圆各自留出清晰轮廓与呼吸缝。",
    });
  }

  if (state.pathMode === "derailed" || metrics.maxBendDeg > 24) {
    issues.push({
      code: "MISALIGNED_LINE",
      dim: "rhythm",
      tag: "动线脱轨",
      headline: `队列中段折角达到 ${Math.round(metrics.maxBendDeg)}°，视线中途拐弯泄气`,
      why: "尺度递减的核心作用之一是建立明确方向。排布轴线左右摇摆、末段垂头时，好不容易攒起来的视线推力会被硬拐角打散。",
      fix: "在下方「① 建立方向」把路径切回「原海报柔弧」或「直线收束」，让大小变化顺着同一条动线指向远方。",
    });
  }

  // 四维独立判定（一一对应原海报四组关键词：尺度 / 渐变 / 深度 / 节奏）
  const scaleOk = !issues.some((x) => x.code === "FLAT" || x.code === "CLIFF" || x.code === "FLOATING_HEAD");
  const gradationOk = !issues.some((x) => x.code === "REVERSAL" || x.code === "TOO_FEW");
  const depthOk = !issues.some((x) => x.code === "EVEN_GAP" || x.code === "CROWD_OVERLAP");
  const rhythmOk = !issues.some((x) => x.code === "MISALIGNED_LINE" || x.code === "CLIFF") && state.law !== "linear";

  // 等差阶梯即便没完全归零，也会出现步比前后失衡，单独给出精准提示
  if (state.law === "linear" && !issues.some((x) => x.code === "CLIFF")) {
    issues.push({
      code: "CLIFF",
      dim: "rhythm",
      tag: "等差失速",
      headline: `等差递减步幅前缓后骤（末步骤缩至 ${Math.round(metrics.minStepRatio * 100)}%），韵律发僵`,
      why: "每级减同样像素时，大圆看起来几乎没变，小圆却一口气缩掉一大半。人眼按比例而非像素差感知大小，所以等差序列总在尾段失衡。",
      fix: "在下方「③ 控制节奏」把递减律换为「原海报分数」「严格等比」或「透视调和」。",
    });
  }

  const passedCount = [scaleOk, gradationOk, depthOk, rhythmOk].filter(Boolean).length;
  const allOk = passedCount === 4;

  // 为原海报四关键词生成精准实况微标
  const keywords = {
    scale: {
      ok: scaleOk,
      badge: !metrics.bleed
        ? "首圆漂浮"
        : metrics.spanRatio < 2.8
          ? `扁平 ${metrics.spanRatio.toFixed(1)}×`
          : metrics.vanishedCount >= 3
            ? "后段尘灭"
            : `跨比 ${metrics.spanRatio.toFixed(1)}×`,
    },
    gradation: {
      ok: gradationOk,
      badge: reversals.length
        ? `第${reversals[0].index + 1}枚反弹`
        : metrics.count < 5
          ? `仅 ${metrics.count} 级`
          : `均比 ${metrics.avgStepRatio.toFixed(2)}×`,
    },
    depth: {
      ok: depthOk,
      badge: state.spacingMode === "wide"
        ? "远端发散"
        : state.spacingMode !== "perspective"
          ? "等距穿帮"
          : metrics.maxOverlap > 0.48
            ? "过密粘连"
            : `收敛 ${Math.round(metrics.gapConvergence * 100)}%`,
    },
    rhythm: {
      ok: rhythmOk,
      badge: state.pathMode === "derailed"
        ? `折角 ${Math.round(metrics.maxBendDeg)}°`
        : state.law === "linear"
          ? "等差骤跌"
          : state.pathMode === "arc"
            ? "柔弧顺畅"
            : "直指远点",
    },
  };

  let primary;
  if (allOk) {
    const solveName = state.law === "poster"
      ? "原海报分数秩序成立"
      : state.law === "harmonic"
        ? "透视调和纵深成立"
        : "等比韵律秩序成立";
    primary = {
      ok: true,
      tag: "达标 · 4/4",
      headline: `${solveName}：首尾跨比 ${metrics.spanRatio.toFixed(1)}×，视线顺势入远`,
      why: `首枚左下出血压住近景，${metrics.count} 级元素以约 ${metrics.avgStepRatio.toFixed(2)} 的步比单调递减，间距同步收敛至近端的 ${Math.round(metrics.gapConvergence * 100)}%，大脑无需透视网格就能直接读出约 ${metrics.endDistRatio.toFixed(1)} 倍纵深（示意）。`,
      fix: "可以点亮「视线锥透视」查看上下包络切线，或切到「林荫树道 / 斯帕达柱廊」验证同一套参数在实景里的纵深效果。",
    };
  } else {
    const top = issues[0];
    primary = {
      ok: false,
      tag: `错态 · ${top.tag} (${passedCount}/4)`,
      headline: top.headline,
      why: top.why,
      fix: top.fix,
    };
  }

  return {
    layout,
    items,
    metrics,
    issues,
    keywords,
    checks: { scaleOk, gradationOk, depthOk, rhythmOk },
    passedCount,
    allOk,
    primary,
  };
}

// 为 02 节「三种缩减律对比」提供统一公式计算
export function computeDecayComparison(law, count = 9, distanceScale = 0.55) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    let s = 1;
    let pos = 0;
    if (law === "linear") {
      // 等差：线性缩减，第 i 步减固定量
      const step = clamp(0.115 * (0.65 + distanceScale * 0.7), 0.06, 0.125);
      s = Math.max(0.03, 1 - step * i);
      pos = i / (count - 1);
    } else if (law === "geometric") {
      const r = clamp(0.84 - distanceScale * 0.22, 0.62, 0.84);
      s = Math.pow(r, i);
      // 对应等比收敛位置
      const num = 1 - Math.pow(r, i);
      const den = 1 - Math.pow(r, count - 1);
      pos = den > 1e-5 ? num / den : i / (count - 1);
    } else {
      // 透视调和：真实等距阵列 d_i = d0 + i * step，透视投影高度 s_i = d0 / d_i
      const k = 0.18 + distanceScale * 0.55;
      s = 1 / (1 + k * i);
      // 在透视投影下，沿地面的位置投影也满足 (1 - s) / (1 - s_last)
      const sLast = 1 / (1 + k * (count - 1));
      pos = (1 - s) / Math.max(1e-5, 1 - sLast);
    }
    arr.push({ index: i, scale: s, pos });
  }
  const ratios = [];
  for (let i = 0; i < arr.length - 1; i++) {
    ratios.push(arr[i + 1].scale / Math.max(1e-5, arr[i].scale));
  }
  return { items: arr, ratios };
}
