// 097 平衡 BALANCE · 单真源视觉力学模型
// 状态仅记录横梁坐标系 x ∈ [-0.88, +0.88]、支点 fulcrum ∈ [-0.30, +0.30] 与四枚配重块的材质/尺度。
// 画布绘制、力矩读数、顶栏自示范标题倾斜、底沿五栏原海报标尺与单真源诊单全部从此计算。

export const MATERIALS = {
  ink: {
    id: "ink",
    label: "墨黑实心",
    short: "墨黑",
    factor: 1.0,
    fill: "#1C1C1C",
    stroke: "#1C1C1C",
    note: "高明度反差，实心厚重（示意权重 1.00×）",
  },
  vermilion: {
    id: "vermilion",
    label: "朱砂高饱和",
    short: "朱砂",
    factor: 1.18,
    fill: "#CE4A22",
    stroke: "#CE4A22",
    note: "暖色高饱和，视觉吸睛更压秤（示意权重 1.18×）",
  },
  stone: {
    id: "stone",
    label: "暖石中灰",
    short: "暖灰",
    factor: 0.56,
    fill: "#B6A894",
    stroke: "#8C7F6C",
    note: "低对比暖灰，存在感退后变轻（示意权重 0.56×）",
  },
  hollow: {
    id: "hollow",
    label: "细线空心",
    short: "空心",
    factor: 0.24,
    fill: "transparent",
    stroke: "#1C1C1C",
    note: "只留轮廓线，内部透出纸底最轻（示意权重 0.24×）",
  },
};

export const MAT_ORDER = ["ink", "vermilion", "stone", "hollow"];

export const SCALES = [
  { id: "sm", label: "小", value: 0.72 },
  { id: "md", label: "中", value: 1.0 },
  { id: "lg", label: "大", value: 1.32 },
];

export const CONTEXTS = {
  poster: {
    id: "poster",
    label: "原海报·几何",
    sub: "1:1 承袭 097 原海报：朱砂大圆定锚，左方圆双件对右大方块。",
  },
  spread: {
    id: "spread",
    label: "杂志跨页",
    sub: "配重块同步映射跨页图文：左为侧影插图与朱砂页码，中为主标题，右为正文栏。",
  },
  exhibition: {
    id: "exhibition",
    label: "展陈色重",
    sub: "体验高饱和小朱砂色块如何借长力臂压住大片低对比文字墙。",
  },
};

export const BLOCK_DEFS = [
  {
    id: "leftSq",
    name: "左方块",
    spreadName: "左侧影图",
    exhibitName: "朱砂导视块",
    shape: "square",
    baseHalfW: 0.095,
    baseHeight: 0.19,
    baseArea: 0.46,
  },
  {
    id: "leftDot",
    name: "左小圆",
    spreadName: "页眉印章",
    exhibitName: "展期标点",
    shape: "circle",
    baseHalfW: 0.062,
    baseHeight: 0.124,
    baseArea: 0.24,
  },
  {
    id: "coreRed",
    name: "朱砂圆核",
    spreadName: "跨页主标",
    exhibitName: "展陈主圆",
    shape: "core",
    baseHalfW: 0.205,
    baseHeight: 0.41,
    baseArea: 1.55,
  },
  {
    id: "rightSq",
    name: "右大块",
    spreadName: "右侧正文栏",
    exhibitName: "灰调说明墙",
    shape: "tallSquare",
    baseHalfW: 0.132,
    baseHeight: 0.264,
    baseArea: 0.82,
  },
];

export const PRESETS = {
  // 开场错态：0/5 右倾塌陷 + 左块空心缩臂 + 朱砂圆偏右 + 支点偏左
  initial: {
    label: "开场失衡",
    fulcrum: -0.16,
    selected: "rightSq",
    blocks: {
      leftSq: { x: -0.46, mat: "hollow", scale: 1.0 },
      leftDot: { x: -0.28, mat: "stone", scale: 0.72 },
      coreRed: { x: 0.12, mat: "vermilion", scale: 1.0 },
      rightSq: { x: 0.72, mat: "ink", scale: 1.32 },
    },
  },
  // 合法解 1：1:1 原海报经典非对称动态均衡（0.0° 精确配平）
  posterBalanced: {
    label: "原海报·非对称",
    fulcrum: 0.0,
    selected: "coreRed",
    blocks: {
      leftSq: { x: -0.68, mat: "ink", scale: 1.0 },
      leftDot: { x: -0.44, mat: "ink", scale: 1.0 },
      coreRed: { x: 0.0, mat: "vermilion", scale: 1.0 },
      rightSq: { x: 0.51, mat: "ink", scale: 1.0 },
    },
  },
  // 合法解 2：庄重镜像对称解（0.0°）
  symmetricBalanced: {
    label: "镜像对称秩序",
    fulcrum: 0.0,
    selected: "coreRed",
    blocks: {
      leftSq: { x: -0.58, mat: "ink", scale: 1.32 },
      leftDot: { x: -0.35, mat: "hollow", scale: 0.72 },
      coreRed: { x: 0.0, mat: "vermilion", scale: 1.0 },
      rightSq: { x: 0.55, mat: "ink", scale: 1.0 },
    },
  },
  // 合法解 3：小朱砂长力臂巧衡大暖灰（色彩重量平衡，0.0°）
  colorCantilever: {
    label: "朱砂悬臂巧衡",
    fulcrum: 0.0,
    selected: "leftSq",
    blocks: {
      leftSq: { x: -0.74, mat: "vermilion", scale: 0.72 },
      leftDot: { x: -0.53, mat: "vermilion", scale: 0.72 },
      coreRed: { x: 0.0, mat: "ink", scale: 1.0 },
      rightSq: { x: 0.44, mat: "stone", scale: 1.32 },
    },
  },
  // 双向试错 1：死堆中轴（0.1° 水平且不叠压，但全缩在中间失去空间张力与呼应）
  errHuddled: {
    label: "死堆中轴",
    fulcrum: 0.0,
    selected: "leftSq",
    blocks: {
      leftSq: { x: -0.445, mat: "stone", scale: 0.72 },
      leftDot: { x: -0.27, mat: "stone", scale: 0.72 },
      coreRed: { x: 0.0, mat: "vermilion", scale: 0.72 },
      rightSq: { x: 0.34, mat: "stone", scale: 0.72 },
    },
  },
  // 双向试错 2：两端贴边撕裂（0.1° 水平，但重物贴死左右极端边缘、中间脱节）
  errSplit: {
    label: "两端撕裂",
    fulcrum: 0.0,
    selected: "coreRed",
    blocks: {
      leftSq: { x: -0.82, mat: "ink", scale: 1.0 },
      leftDot: { x: -0.64, mat: "ink", scale: 1.0 },
      coreRed: { x: 0.0, mat: "stone", scale: 0.72 },
      rightSq: { x: 0.76, mat: "stone", scale: 1.32 },
    },
  },
  // 双向试错 3：支点硬偏塌作弊凑平
  errFulcrumEdge: {
    label: "支点偏塌",
    fulcrum: 0.24,
    selected: "rightSq",
    blocks: {
      leftSq: { x: -0.44, mat: "stone", scale: 0.72 },
      leftDot: { x: -0.22, mat: "stone", scale: 0.72 },
      coreRed: { x: 0.24, mat: "vermilion", scale: 1.0 },
      rightSq: { x: 0.64, mat: "ink", scale: 0.72 },
    },
  },
  // 双向试错 4：全盘空心失重
  errWeightless: {
    label: "全盘失重",
    fulcrum: 0.0,
    selected: "coreRed",
    blocks: {
      leftSq: { x: -0.66, mat: "hollow", scale: 1.0 },
      leftDot: { x: -0.42, mat: "hollow", scale: 1.0 },
      coreRed: { x: 0.0, mat: "hollow", scale: 1.0 },
      rightSq: { x: 0.52, mat: "hollow", scale: 1.0 },
    },
  },
};

export const BEAM_LIMIT = 0.88;
export const FULCRUM_LIMIT = 0.28;

export function clonePreset(key) {
  const p = PRESETS[key] || PRESETS.initial;
  const blocks = {};
  for (const def of BLOCK_DEFS) {
    blocks[def.id] = { ...p.blocks[def.id] };
  }
  return {
    fulcrum: p.fulcrum,
    selected: p.selected,
    blocks,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function blockMetrics(def, b) {
  const mat = MATERIALS[b.mat] || MATERIALS.ink;
  const halfW = def.baseHalfW * (0.76 + 0.24 * b.scale);
  const height = def.baseHeight * (0.76 + 0.24 * b.scale);
  // 面积按尺度近似二次方增长，再乘材质对比权重（示意视觉重量）
  const weight = def.baseArea * Math.pow(b.scale, 1.55) * mat.factor;
  return {
    ...def,
    ...b,
    matInfo: mat,
    halfW,
    height,
    weight,
  };
}

// 单真源评估：所有画布图形、力矩仪表、五栏标尺与诊单文案只读此处结果
export function evaluate(state) {
  const fulcrum = clamp(state.fulcrum, -FULCRUM_LIMIT, FULCRUM_LIMIT);
  const items = BLOCK_DEFS.map((def) => {
    const b = state.blocks[def.id];
    const m = blockMetrics(def, b);
    const x = clamp(b.x, -BEAM_LIMIT + m.halfW * 0.5, BEAM_LIMIT - m.halfW * 0.5);
    const arm = x - fulcrum;
    const torque = m.weight * arm;
    return { ...m, x, arm, torque };
  });

  const byId = Object.fromEntries(items.map((it) => [it.id, it]));

  let leftTorque = 0;
  let rightTorque = 0;
  let totalWeight = 0;
  let weightedX = 0;

  for (const it of items) {
    totalWeight += it.weight;
    weightedX += it.weight * it.x;
    if (it.torque < 0) leftTorque += -it.torque;
    else rightTorque += it.torque;
  }

  const netTorque = rightTorque - leftTorque;
  const comX = totalWeight > 0.001 ? weightedX / totalWeight : 0;
  const normTorque = netTorque / Math.max(0.52, totalWeight);
  const targetAngleDeg = clamp(normTorque * 44, -19.5, 19.5);
  const absAngle = Math.abs(targetAngleDeg);

  // 1. 叠压检测（排序后检查相邻块边缘）
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const overlapIds = new Set();
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const minDist = a.halfW + b.halfW + 0.012;
    if (b.x - a.x < minDist) {
      overlapIds.add(a.id);
      overlapIds.add(b.id);
    }
  }
  const hasOverlap = overlapIds.size > 0;

  // 2. 失重检测
  const isWeightless = totalWeight < 1.25;

  // 3. 支点偏塌（安全区间 [-0.14, +0.14]，对应 43%–57% 画幅宽）
  const fulcrumEdge = Math.abs(fulcrum) > 0.14;

  // 4. 重心主核是否定锚
  const core = byId.coreRed;
  const coreOffset = core.x - fulcrum;
  const coreWeak = core.mat === "hollow";
  const coreDrift = Math.abs(coreOffset) > 0.11 || coreWeak;

  // 5. 左右两翼分布与呼应跨度
  const wings = items.filter((it) => it.id !== "coreRed");
  const leftWings = wings.filter((it) => it.x < fulcrum - 0.14);
  const rightWings = wings.filter((it) => it.x > fulcrum + 0.14);
  const minX = Math.min(...items.map((it) => it.x));
  const maxX = Math.max(...items.map((it) => it.x));
  const span = maxX - minX;
  const maxArm = Math.max(...wings.map((it) => Math.abs(it.x - fulcrum)));
  const isHuddled = span < 0.84 || maxArm < 0.45;

  // 两端贴边撕裂：外侧块贴死边缘且中央脱节
  const extremeEdges = wings.filter((it) => Math.abs(it.x) > 0.74).length;
  const minCoreGap = Math.min(
    ...wings.map((it) => Math.abs(it.x - core.x) - it.halfW - core.halfW)
  );
  const isSplit =
    (extremeEdges >= 2 && (coreWeak || core.scale < 0.85 || minCoreGap > 0.32)) ||
    (leftWings.length === 0 || rightWings.length === 0);

  const fmtDeg = (d) => {
    const v = Math.abs(d) < 0.05 ? 0 : d;
    return `${v > 0 ? "+" : ""}${v.toFixed(1)}°`;
  };

  // 6. 平衡判据（单真源 5 项，直连原海报底沿 5 列！）
  const eqOk = absAngle <= 2.2 && !isWeightless;
  const focalOk = !coreDrift && Math.abs(comX - fulcrum) <= 0.085;
  const stabOk = !fulcrumEdge && !hasOverlap && !isWeightless && absAngle <= 2.2;
  const resOk =
    !isHuddled &&
    !isSplit &&
    !hasOverlap &&
    leftWings.length >= 1 &&
    rightWings.length >= 1;

  // 判断是对称秩序还是非对称动态均衡
  const leftHeavyWing = leftWings.reduce((a, b) => (a && a.weight > b.weight ? a : b), null);
  const rightHeavyWing = rightWings.reduce((a, b) => (a && a.weight > b.weight ? a : b), null);
  const isMirror =
    eqOk &&
    leftHeavyWing &&
    rightHeavyWing &&
    Math.abs(Math.abs(leftHeavyWing.x - fulcrum) - Math.abs(rightHeavyWing.x - fulcrum)) < 0.08 &&
    Math.abs(leftHeavyWing.weight - rightHeavyWing.weight) < 0.18;

  const symOk = eqOk && stabOk && resOk;

  const checks = [
    {
      id: "symmetry",
      title: "对称",
      en: "SYMMETRY",
      posterBody: "镜像对应 形成稳定秩序",
      ok: symOk,
      tag: symOk
        ? isMirror
          ? "镜像秩序"
          : "动态均衡"
        : hasOverlap
          ? "块面粘连"
          : targetAngleDeg > 2.2
            ? "右倾失序"
            : targetAngleDeg < -2.2
              ? "左倾失序"
              : "秩序待调",
    },
    {
      id: "equilibrium",
      title: "均衡",
      en: "EQUILIBRIUM",
      posterBody: "视觉重量相当 达到动态平衡",
      ok: eqOk,
      tag: isWeightless
        ? "全盘失重"
        : eqOk
          ? `平 ${fmtDeg(targetAngleDeg)}`
          : `${targetAngleDeg > 0 ? "右重 " : "左重 "}${fmtDeg(targetAngleDeg)}`,
    },
    {
      id: "focal",
      title: "重心",
      en: "FOCAL POINT",
      posterBody: "明确视觉中心 引导视线停留",
      ok: focalOk,
      tag: coreWeak
        ? "主核虚弱"
        : Math.abs(coreOffset) > 0.11
          ? `核偏 ${coreOffset > 0 ? "右" : "左"} ${Math.round(Math.abs(coreOffset) * 50)}%`
          : focalOk
            ? "锚核稳坐"
            : "质心跑偏",
    },
    {
      id: "stability",
      title: "稳定",
      en: "STABILITY",
      posterBody: "结构可靠 给人安全感",
      ok: stabOk,
      tag: fulcrumEdge
        ? `支点偏 ${Math.round(50 + fulcrum * 50)}%`
        : hasOverlap
          ? "边缘叠压"
          : isWeightless
            ? "缺乏分量"
            : stabOk
              ? "支点稳固"
              : "横梁倾坠",
    },
    {
      id: "resonance",
      title: "呼应",
      en: "RESONANCE",
      posterBody: "元素相互关联 形成整体感",
      ok: resOk,
      tag: isHuddled
        ? "死堆中轴"
        : isSplit
          ? "两端撕裂"
          : hasOverlap
            ? "粘连无隙"
            : resOk
              ? "两翼呼应"
              : "单翼空置",
    },
  ];

  const passCount = checks.filter((c) => c.ok).length;

  // 8 类错态优先级诊断（白话讲清「为什么」与「怎么改」）
  let fault = "balanced";
  let badge = `${passCount}/5 · 稳衡成立`;
  let headline = isMirror
    ? "镜像秩序落定，天平稳锁在水平中轴"
    : "非对称动态均衡成立，画面稳重又有张力";
  let body = isMirror
    ? "左右主块体量与力臂彼此镜像对应，中央朱砂圆牢牢定住视觉重心。整座构图显得庄重、权威、极具仪典感。"
    : "左右形状与数量并不相同，但「视觉重量 × 距支点距离」在横梁上恰好抵消。视线先落进中央朱砂圆，再在两翼之间往复呼应。";
  let tip = "按 Space 放手施加微扰称重验真；也可把左块改成浅灰或挪动支点，观察天平如何立刻失稳。";
  let statusGrade = "稳衡成立（示意）";

  if (isWeightless) {
    fault = "weightless";
    badge = `${passCount}/5 · 全盘失重`;
    headline = "所有块面都过轻或空心，画面撑不起分量";
    body = `当前总视觉重量仅 ${totalWeight.toFixed(2)}（示意）。即使横梁勉强水平，没有实心暗块或高饱和色核压秤，观者只会觉得轻飘虚浮、抓不住重点。`;
    tip = "选中「朱砂圆核」或两侧块面，在控制盘把材质切回「朱砂高饱和」或「墨黑实心」。";
    statusGrade = "轻飘失重（示意）";
  } else if (hasOverlap) {
    fault = "overlap";
    badge = `${passCount}/5 · 块面叠压`;
    headline = "画布上有配重块撞在一起，轮廓边界糊成一团";
    body = "平衡需要清朗的间距让视线呼吸。相邻几何块发生叠压时，轮廓互相吞并，观者分不清各自归属，结构稳定感随之瓦解。";
    tip = "直接拖开画布上带红虚线警示的叠压块体，给相邻元素留出干净的纸面缝隙。";
    statusGrade = "轮廓粘连（示意）";
  } else if (absAngle > 2.2) {
    const rightHeavy = targetAngleDeg > 0;
    fault = rightHeavy ? "right_heavy" : "left_heavy";
    badge = `${passCount}/5 · ${rightHeavy ? "右倾" : "左倾"} ${fmtDeg(targetAngleDeg)}`;
    headline = rightHeavy
      ? `右侧视觉力矩过重，横梁向右倾坠 ${fmtDeg(targetAngleDeg)}`
      : `左侧视觉力矩过重，横梁向左倾坠 ${fmtDeg(targetAngleDeg)}`;
    body = rightHeavy
      ? `右臂示意力矩 ${rightTorque.toFixed(2)} 远大于左臂 ${leftTorque.toFixed(2)}。人眼会顺着下沉的右端滑出画框，左半幅显得空虚托不住。`
      : `左臂示意力矩 ${leftTorque.toFixed(2)} 压过了右臂 ${rightTorque.toFixed(2)}。整幅画的重心向左塌陷，右侧元素拉不住下坠趋势。`;
    tip = rightHeavy
      ? "把右大块往中轴收近、把左方块往左拉远并切回「墨黑实心」，同时让朱砂圆核与三角支点归回中轴。"
      : "把左侧过重的块体往中轴收近一点，或换轻一档材质（如暖石中灰），也可以把右侧块体略微外拉。";
    statusGrade = rightHeavy ? "右沉失衡（示意）" : "左沉失衡（示意）";
  } else if (fulcrumEdge) {
    fault = "fulcrum_edge";
    badge = `${passCount}/5 · 支点偏塌`;
    headline = `三角支点滑到了 ${Math.round(50 + fulcrum * 50)}% 偏位，整座结构显得摇摇欲坠`;
    body = "硬把支点移向单侧虽然能临时凑出 0° 水平，但画框本身的中轴引力仍在 50% 处。视觉支点偏离中轴过远，会让人觉得整张版面即将侧翻。";
    tip = "直接拖动横梁底部的黑色三角支点（或拉动下方支点滑轨），把它归回 44%–56% 稳定区。";
    statusGrade = "支点失位（示意）";
  } else if (coreDrift) {
    fault = "core_drift";
    badge = `${passCount}/5 · 重心失锚`;
    headline = coreWeak
      ? "中央朱砂主核太虚弱，画面失去视觉落脚点"
      : `朱砂主核向${coreOffset > 0 ? "右" : "左"}跑偏，视线定不住轴心`;
    body = coreWeak
      ? "虽然横梁眼下勉强水平，但中央主圆沦为空心或过小，观者进画面后不知道第一眼该停在哪里，缺少「稳定而有力量」的主心骨。"
      : "朱砂大圆是全画的视觉焦点。它偏离支点过远时，不仅拉扯额外力矩，还会让观者在几何中心与红圆之间来回迟疑。";
    tip = coreWeak
      ? "点选中央圆核，把材质设为「朱砂高饱和」或「墨黑实心」、尺度调到「中」或「大」。"
      : "把中央朱砂圆拖回三角支点正上方（中轴虚线处），再微调两翼配重保持水平。";
    statusGrade = "主核失锚（示意）";
  } else if (isHuddled) {
    fault = "huddled";
    badge = `${passCount}/5 · 死堆中轴`;
    headline = "虽然横梁是平的，但元素全缩在中间挤成一团";
    body = "把所有东西都抱团堆在中轴附近，力臂几乎为零，的确不会歪——但它换来的是呆板与局促，两侧大面积宣纸变成无人照应的死白。";
    tip = "把左右两翼的方块和圆向外拉开力臂，让视觉重量在画幅的左右空间里真正对话呼应。";
    statusGrade = "抱团无张力（示意）";
  } else if (isSplit) {
    fault = "split_edge";
    badge = `${passCount}/5 · 两端撕裂`;
    headline = "重物贴死两端边缘，把画面从中间撕成两半";
    body = "横梁读数虽近水平，但左右重块被拽到极外缘且与中核脱节。视线在最左和最右之间被迫大幅跳跃，画面丧失整体呼应感。";
    tip = "把贴死外缘的块体往内收拢少许，并确保中央圆核实体饱满，把左右两翼重新串联起来。";
    statusGrade = "两极拉裂（示意）";
  }

  return {
    fulcrum,
    fulcrumPct: Math.round(50 + fulcrum * 50),
    items,
    byId,
    leftTorque,
    rightTorque,
    netTorque,
    totalWeight,
    comX,
    comPct: Math.round(50 + comX * 50),
    targetAngleDeg,
    overlapIds,
    isMirror,
    checks,
    passCount,
    isBalanced: passCount === 5,
    fault,
    badge,
    headline,
    body,
    tip,
    statusGrade,
  };
}
