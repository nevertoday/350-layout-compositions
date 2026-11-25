// 322 一河两岸式构图 · 单真源几何与构图评测模型
// 所有画布坐标、河岸曲线、景物墨度、力矩平衡与文字诊断全部由此算出，绝不写死两套数。

export const V_TOP = 0.25;
export const V_BOT = 1.0;
export const V_TIERS = [0.42, 0.63, 0.84]; // 远岸、中岸、近岸在画布上的相对纵坐标
export const TIER_NAMES = ["远岸", "中岸", "近岸"];

export const MOTIF_ORDER = ["empty", "trees", "pavilion", "peak", "boat"];

export const MOTIFS = {
  empty: { id: "empty", label: "留白", short: "空", mass: 0, height: 0, spread: 0 },
  trees: { id: "trees", label: "古松疏树", short: "树", mass: 0.95, height: 1.0, spread: 1.05 },
  pavilion: { id: "pavilion", label: "临水亭阁", short: "亭", mass: 1.28, height: 1.08, spread: 0.9 },
  peak: { id: "peak", label: "青峰山体", short: "山", mass: 1.42, height: 1.18, spread: 1.25 },
  boat: { id: "boat", label: "扁舟渡客", short: "舟", mass: 0.56, height: 0.52, spread: 0.78 },
};

export const SCENES = {
  ink: { id: "ink", label: "水墨江岸", en: "INK RIVERBANK", desc: "忠于原海报烟雨江南水墨，深青河道夹暖砂双岸" },
  city: { id: "city", label: "城河夜航", en: "NIGHT WATERFRONT", desc: "现代航拍江景：左岸老城灯火呼应右岸天际线" },
  editorial: { id: "editorial", label: "双栏画册", en: "EDITORIAL SPREAD", desc: "平面与网页版式：中心留白中缝即是分隔河道" },
};

export const INITIAL_STATE = {
  scene: "ink",
  bend: 0.0,         // -0.28 .. +0.28，0 为死直水渠
  riverWidth: 0.22,  // 0.10 .. 0.44，前景河口占画宽比例
  taper: 0.08,       // 0.00 .. 0.88，近宽远窄收束度（初始几乎等宽）
  depthFade: 0.0,    // -0.50 .. 1.00，近实远虚（0 为远近同浓平涂，负数为倒挂）
  centerBlocker: true,
  left: ["peak", "pavilion", "trees"],
  right: ["empty", "empty", "empty"],
};

export const PRESETS = {
  poster: {
    label: "原海报解",
    patch: {
      bend: 0.13,
      riverWidth: 0.23,
      taper: 0.68,
      depthFade: 0.78,
      centerBlocker: false,
      left: ["peak", "pavilion", "trees"],
      right: ["peak", "trees", "boat"],
    },
  },
  echo: {
    label: "异形错落解",
    patch: {
      bend: -0.14,
      riverWidth: 0.21,
      taper: 0.74,
      depthFade: 0.84,
      centerBlocker: false,
      left: ["trees", "boat", "peak"],
      right: ["empty", "pavilion", "trees"],
    },
  },
  mirror: {
    label: "试错：机械镜像",
    patch: {
      bend: 0.12,
      riverWidth: 0.22,
      taper: 0.66,
      depthFade: 0.76,
      centerBlocker: false,
      left: ["peak", "pavilion", "trees"],
      right: ["peak", "pavilion", "trees"],
    },
  },
  reset: {
    label: "复原错态",
    patch: { ...INITIAL_STATE, left: [...INITIAL_STATE.left], right: [...INITIAL_STATE.right] },
  },
};

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// p ∈ [0, 1]：0 在远端水际，1 在画面底沿近景河口
export function riverAt(p, state) {
  const cp = clamp(p, 0, 1);
  const v = V_TOP + cp * (V_BOT - V_TOP);
  const env = 0.42 + 0.58 * Math.pow(cp, 0.92);
  const wave = Math.sin(cp * Math.PI * 2.15 - 0.35);
  const cx = 0.5 + state.bend * wave * env;

  const farRatio = 1 - clamp(state.taper, 0, 0.92) * 0.74;
  const baseHalf = state.riverWidth * 0.5 * (farRatio + (1 - farRatio) * Math.pow(cp, 1.18));
  // 开合呼吸：弯道带出细微宽窄节奏，直渠则毫无波澜
  const breathe = 1 + 0.13 * Math.sin(cp * Math.PI * 2.35 + 0.25) * clamp(Math.abs(state.bend) / 0.12, 0, 1);
  const hw = baseHalf * breathe;

  const sandPad = (0.032 + 0.068 * Math.pow(cp, 1.1)) * (0.62 + 0.38 * (state.riverWidth / 0.22));
  const leftWater = cx - hw;
  const rightWater = cx + hw;
  const leftSand = leftWater - sandPad;
  const rightSand = rightWater + sandPad;

  return { p: cp, v, cx, hw, leftWater, rightWater, leftSand, rightSand, sandPad };
}

export function riverSample(state, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(riverAt(i / steps, state));
  return pts;
}

// 每一纵深层（0 远 / 1 中 / 2 近）的实绘缩放与实绘墨度（渲染与诊断共用）
export function tierMetrics(tierIndex, state) {
  const df = clamp(state.depthFade, -0.5, 1.0);
  const t = tierIndex / 2; // 0 远, 0.5 中, 1 近
  let scale;
  let alpha;
  if (df >= 0) {
    // df=0 远近几乎同大同浓；df=0.8 近大远小、近实远虚
    const farScale = 0.94 - 0.40 * df;
    const nearScale = 0.98 + 0.14 * df;
    scale = farScale + (nearScale - farScale) * t;
    const farAlpha = 0.92 - 0.58 * df;
    const nearAlpha = 0.96;
    alpha = farAlpha + (nearAlpha - farAlpha) * t;
  } else {
    // 倒挂：远岸反而比近岸更浓更大
    const inv = -df / 0.5; // 0..1
    const farScale = 0.96 + 0.22 * inv;
    const nearScale = 0.92 - 0.24 * inv;
    scale = farScale + (nearScale - farScale) * t;
    const farAlpha = 0.96;
    const nearAlpha = 0.92 - 0.48 * inv;
    alpha = farAlpha + (nearAlpha - farAlpha) * t;
  }
  return { scale, alpha };
}

// 计算左右两岸共 6 个槽位的精确屏幕归一化位置和实绘视觉分量
export function computeSlots(state) {
  const slots = [];
  for (const side of ["left", "right"]) {
    const arr = state[side];
    for (let i = 0; i < 3; i++) {
      const v = V_TIERS[i];
      const p = (v - V_TOP) / (V_BOT - V_TOP);
      const r = riverAt(p, state);
      const motif = MOTIFS[arr[i]] || MOTIFS.empty;
      const tm = tierMetrics(i, state);
      const shoreRoom = side === "left" ? r.leftSand : 1 - r.rightSand;
      const u =
        side === "left"
          ? clamp(r.leftSand * 0.52, 0.09, Math.max(0.10, r.leftWater - 0.055))
          : clamp(r.rightSand + (1 - r.rightSand) * 0.48, Math.min(0.90, r.rightWater + 0.055), 0.91);
      const lever = Math.abs(u - r.cx);
      // 视觉分量：由体量 × 实绘缩放 × 墨度显眼度 × 力臂权重得出
      const weight =
        motif.mass === 0
          ? 0
          : motif.mass * tm.scale * (0.42 + 0.58 * tm.alpha) * (0.72 + 0.85 * lever);
      slots.push({
        side,
        tier: i,
        tierName: TIER_NAMES[i],
        motifId: motif.id,
        motif,
        u,
        v,
        p,
        scale: tm.scale,
        alpha: tm.alpha,
        shoreRoom,
        weight,
      });
    }
  }
  return slots;
}

export function evaluate(state) {
  const samples = riverSample(state, 36);
  const slots = computeSlots(state);
  const leftSlots = slots.filter((s) => s.side === "left");
  const rightSlots = slots.filter((s) => s.side === "right");

  const leftWeight = leftSlots.reduce((sum, s) => sum + s.weight, 0);
  const rightWeight = rightSlots.reduce((sum, s) => sum + s.weight, 0);
  const leftCount = leftSlots.filter((s) => s.motifId !== "empty").length;
  const rightCount = rightSlots.filter((s) => s.motifId !== "empty").length;
  const totalWeight = leftWeight + rightWeight;
  const balanceDiff = totalWeight > 0.05 ? (leftWeight - rightWeight) / totalWeight : 0; // -1..+1

  // 最小岸宽余量（判断是否弯得过急挤压某一岸）
  let minShoreMargin = 1;
  for (const s of samples) {
    minShoreMargin = Math.min(minShoreMargin, s.leftWater, 1 - s.rightWater);
  }

  // 河道曲折率（实绘中线弧长 / 垂直高度）
  let arcLen = 0;
  for (let i = 1; i < samples.length; i++) {
    arcLen += Math.hypot(samples[i].cx - samples[i - 1].cx, samples[i].v - samples[i - 1].v);
  }
  const verticalSpan = V_BOT - V_TOP;
  const sinuosity = arcLen / verticalSpan; // 1.00 为笔直

  // 远近实绘墨度差
  const farM = tierMetrics(0, state);
  const nearM = tierMetrics(2, state);
  const depthDrop = nearM.alpha - farM.alpha; // 正数=近实远虚，接近0=平涂，负数=倒挂

  // 机械镜像度（逐层对比左右同高是否同物）
  let mirrorHits = 0;
  let activeTiers = 0;
  for (let i = 0; i < 3; i++) {
    const l = state.left[i];
    const r = state.right[i];
    if (l !== "empty" || r !== "empty") {
      activeTiers++;
      if (l === r) mirrorHits++;
    }
  }
  const mirrorRatio = activeTiers > 0 ? mirrorHits / activeTiers : 0;
  const isMirrorClone = leftCount >= 2 && rightCount >= 2 && mirrorRatio >= 0.99;

  // 河口与远端宽度实测比
  const mouthWidth = samples[samples.length - 1].hw * 2;
  const farWidth = samples[0].hw * 2;
  const widthRatio = farWidth > 0.001 ? mouthWidth / farWidth : 1;

  // 四条核心构图检核
  const channelIssues = [];
  if (state.centerBlocker) channelIssues.push("blocked");
  if (state.riverWidth < 0.15) channelIssues.push("tooNarrow");
  if (state.riverWidth > 0.35) channelIssues.push("tooWide");
  if (minShoreMargin < 0.13) channelIssues.push("shoreCrushed");

  const flowIssues = [];
  if (Math.abs(state.bend) < 0.055) flowIssues.push("tooStraight");
  if (Math.abs(state.bend) > 0.225) flowIssues.push("tooBent");
  if (state.taper < 0.30) flowIssues.push("flatTaper");

  const echoIssues = [];
  if (leftCount === 0 && rightCount === 0) echoIssues.push("bothEmpty");
  else if (leftCount === 0 || rightCount === 0) echoIssues.push("oneSideEmpty");
  else if (Math.abs(balanceDiff) > 0.24) echoIssues.push("tilted");
  if (isMirrorClone) echoIssues.push("mirrorClone");

  const depthIssues = [];
  if (state.depthFade < -0.05 || depthDrop < -0.04) depthIssues.push("invertedDepth");
  else if (depthDrop < 0.30) depthIssues.push("flatDepth");

  const channelOk = channelIssues.length === 0;
  const flowOk = flowIssues.length === 0;
  const echoOk = echoIssues.length === 0;
  const depthOk = depthIssues.length === 0;
  const passedCount = [channelOk, flowOk, echoOk, depthOk].filter(Boolean).length;
  const allOk = passedCount === 4;

  // 优先级最高的一条白话诊断（讲清「为什么」与「下一步怎么做」）
  let faultId = "ok";
  let badge = "两岸成章";
  let headline = "水脉清通、两岸异形呼应，目光顺河自然深入";
  let reason =
    "河心无阻挡且近宽远窄，眼睛顺着微弯水脉缓缓进入远山；左右两岸虽景物不同，但在体量、高低与墨色上彼此照应，稳而不板。";
  let hint = "你可以换一个弯曲方向、改配两岸景物，或切到「城河夜航」「双栏画册」看同一骨架如何在不同媒介里成立。";

  if (state.centerBlocker) {
    faultId = "blocked";
    badge = "主体堵心";
    headline = "重阁压在河道正中，把「分隔线」堵死了";
    reason =
      "海报第一条要点就是「避免将主体置于画面正中心」。河心一旦塞进体量最重的建筑，水流和视线刚进画面就迎面撞停，左右两岸也失去对话的通道。";
    hint = "直接点击画布河心带虚线框的楼阁，把它移去岸边，先把中间水脉让出来。";
  } else if (echoIssues.includes("bothEmpty")) {
    faultId = "bothEmpty";
    badge = "双岸皆空";
    headline = "只剩一条光河，左右两岸没有东西可呼应";
    reason =
      "河流负责分隔和带路，真正让画面立住的是两岸的景物。两边全空时，河道就像一根孤零零的色带，视线走进去却无处停靠。";
    hint = "点击画布左右岸位（或两侧岸景按钮），给左岸与右岸各摆上高低错落的山、树、亭或舟。";
  } else if (echoIssues.includes("oneSideEmpty")) {
    const emptySide = leftCount === 0 ? "左岸" : "右岸";
    const heavySide = leftCount === 0 ? "右岸" : "左岸";
    faultId = "oneSideEmpty";
    badge = `${heavySide}独沉`;
    headline = `${heavySide}堆满重景，${emptySide}一片空白，画面明显歪了`;
    reason =
      `视觉重心像天平：全部山石亭树都压在${heavySide}时，整张画会往一侧坠落，河道不再是「两翼呼应的轴」，反而成了把画面推向边角的斜坡。`;
    hint = `在${emptySide}点选 2 处不同高低的景物（比如中岸配疏树、近岸配扁舟），接住${heavySide}的分量。`;
  } else if (flowIssues.includes("tooStraight")) {
    faultId = "tooStraight";
    badge = "死直劈裂";
    headline = "河道几乎笔直，像拿尺子把画面硬劈成两半";
    reason =
      `当前中线曲折率只有 ${sinuosity.toFixed(2)}×。垂直笔直的河道让视线一眼直冲出顶边，没有回环停顿，左右两岸也显得割裂、生硬。`;
    hint = "按住画布上的河道向左或向右横向拨动（或按键盘 ← → 键），拉出柔和的 S 形微弯。";
  } else if (flowIssues.includes("tooBent") || channelIssues.includes("shoreCrushed")) {
    faultId = "tooBent";
    badge = "急弯挤岸";
    headline = "河道弯得太急，把内侧河岸挤扁了";
    reason =
      `过度蛇行让最窄一侧岸宽缩到只剩画面宽度的 ${Math.round(minShoreMargin * 100)}%，岸上景物被迫贴边堆挤，水势也从舒缓引流变成了急折梗阻。`;
    hint = "把河道往中间轻轻拨回一些，留出舒展的左右岸幅，让弯度回到「开合有度」的节奏。";
  } else if (channelIssues.includes("tooNarrow")) {
    faultId = "tooNarrow";
    badge = "河缝挤塞";
    headline = `河口窄到只占 ${Math.round(state.riverWidth * 100)}%，两岸快粘成一团了`;
    reason =
      "河道太细时，它承担不起「自然分隔线」的呼吸感，左右景物隔着一条细缝互相抢戏，画面重新退回拥挤的一整块。";
    hint = "把「河口宽幅」调宽到 16%–34% 经验带，让中间水脉真正成为舒朗的留白通道。";
  } else if (channelIssues.includes("tooWide")) {
    faultId = "tooWide";
    badge = "宽峡割裂";
    headline = `河口占去 ${Math.round(state.riverWidth * 100)}%，两岸被推到边角各过各的`;
    reason =
      "水面过宽时，左右岸相距太远，眼睛难以在两岸之间自然往返呼应，中间的大片空水反而像一道把构图拆散的裂谷。";
    hint = "收窄「河口宽幅」到 16%–34% 经验带，让左右两岸重新隔水相望。";
  } else if (flowIssues.includes("flatTaper")) {
    faultId = "flatTaper";
    badge = "平直无深";
    headline = `河口与远水几乎同宽（仅 ${widthRatio.toFixed(1)}×），视线推不进远处`;
    reason =
      "河道从近到远如果上下一般宽，就像画在平面上的等宽色带，缺少近大远小的透视收束，眼睛感受不到空间纵深。";
    hint = "拉大「纵深收束」或「近实远虚」，让近处河口放开、远端收拢进烟岚里。";
  } else if (echoIssues.includes("mirrorClone")) {
    faultId = "mirrorClone";
    badge = "机械镜像";
    headline = "左右岸像对折剪纸一样完全复刻，稳却呆板";
    reason =
      "两岸在相同高度摆了完全一样的景物。虽说原海报英文写着 SYMMETRY，但实战里真正高级的呼应是「异形等重」——比如左岸亭阁配右岸疏林，而不是左右复制粘贴。";
    hint = "点改任意一岸的 1–2 个景物，或错开它们所在的远中近层次，立刻就能活起来。";
  } else if (echoIssues.includes("tilted")) {
    const heavy = balanceDiff > 0 ? "左岸" : "右岸";
    const light = balanceDiff > 0 ? "右岸" : "左岸";
    faultId = "tilted";
    badge = `${heavy}偏沉`;
    headline = `${heavy}分量明显重过${light}，视觉天平向一侧倾倒`;
    reason =
      `${heavy}聚集了更高大或更靠前景的景物，${light}接不住这份重量。一河两岸讲究「均衡分布」，不求两边长得一样，但视觉总量要大体拉平。`;
    hint = `给${light}补一处中等体量的山石或亭树，或把${heavy}一处重景换成较轻的扁舟/留白。`;
  } else if (depthIssues.includes("invertedDepth")) {
    faultId = "invertedDepth";
    badge = "远实近虚";
    headline = "远岸墨色比近岸还浓重，前后空间彻底倒挂";
    reason =
      "真实空气里有水汽散射，越远越淡、越近越实。现在远处山树又大又黑，反而往前蹦，近景却发虚退后，纵深感瞬间瓦解。";
    hint = "把「近实远虚」往右拉回正值，恢复近浓远淡的自然层次。";
  } else if (depthIssues.includes("flatDepth")) {
    faultId = "flatDepth";
    badge = "远近平涂";
    headline = "远景与近景墨色几乎一样深，画面扁成一堵墙";
    reason =
      `近岸与远岸的实绘墨度差只有 ${Math.round(depthDrop * 100)}%，缺少大气透视与尺度递减，眼睛读不出「由近及远、由实到虚」的空气距离。`;
    hint = "调高「近实远虚」，让远山远树退进清浅雾岚，近岸笔墨沉实下来。";
  }

  // 三大海报关键词的实时状态短签
  const symmetryTag = echoIssues.includes("mirrorClone")
    ? "照镜呆板"
    : echoIssues.includes("oneSideEmpty") || echoIssues.includes("bothEmpty")
      ? "单岸失应"
      : echoIssues.includes("tilted")
        ? balanceDiff > 0
          ? "左沉右轻"
          : "右沉左轻"
        : "异形呼应";

  const balanceTag = state.centerBlocker
    ? "河心受阻"
    : channelIssues.includes("tooNarrow")
      ? "河缝过窄"
      : channelIssues.includes("tooWide")
        ? "宽峡割裂"
        : channelIssues.includes("shoreCrushed")
          ? "岸幅受挤"
          : "分合均衡";

  const guidanceTag = flowIssues.includes("tooStraight")
    ? "死直劈裂"
    : flowIssues.includes("tooBent")
      ? "急弯梗阻"
      : flowIssues.includes("flatTaper")
        ? "等宽平直"
        : depthIssues.includes("invertedDepth")
          ? "远近倒挂"
          : depthIssues.includes("flatDepth")
            ? "远近平涂"
            : "曲水引深";

  // 岸侧分量档位（不用伪精确小数，给出诚实档位）
  const weightTier = (w) => (w < 0.05 ? "空岸" : w < 0.9 ? "轻" : w < 1.8 ? "中" : w < 2.8 ? "厚" : "满重");

  return {
    samples,
    slots,
    leftWeight,
    rightWeight,
    leftTier: weightTier(leftWeight),
    rightTier: weightTier(rightWeight),
    leftCount,
    rightCount,
    balanceDiff,
    sinuosity,
    widthRatio,
    depthDrop,
    minShoreMargin,
    mirrorRatio,
    isMirrorClone,
    checks: { channelOk, flowOk, echoOk, depthOk },
    passedCount,
    allOk,
    faultId,
    badge,
    headline,
    reason,
    hint,
    keywordTags: {
      symmetry: { text: symmetryTag, ok: echoOk },
      balance: { text: balanceTag, ok: channelOk && !echoIssues.includes("tilted") },
      guidance: { text: guidanceTag, ok: flowOk && depthOk },
    },
    usageChecks: [
      { ok: channelOk, text: "河流作为自然分隔线，避免将主体置于画面正中心。" },
      { ok: echoOk, text: "两岸元素在大小、疏密、明暗上保持呼应与平衡。" },
      { ok: flowOk && depthOk, text: "利用近大远小、虚实变化，增强空间感与引导力。" },
    ],
  };
}
