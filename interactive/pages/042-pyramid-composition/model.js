// 042 金字塔构图 · 单一事实源状态与立体阶梯力学核算
// 状态仅保存四层石阶的归一化宽度 (0..1)、层序角色、明暗重量模式、层间砌缝与题材场景。
// 开场主画布、左侧四圆徽探针、底部四步构建图与文字诊单全部从 evaluate(state) 同源读取。

export const ROLES = {
  apex: {
    id: "apex",
    idealSlot: 0,
    icon: "star",
    defaultColor: { front: "#B37612", side: "#784A08", top: "#CE932B", ink: "#FFF8EC", subInk: "#FCECC8" },
    darkness: 0.28,
  },
  secondary: {
    id: "secondary",
    idealSlot: 1,
    icon: "peak",
    defaultColor: { front: "#B68B55", side: "#845E32", top: "#CCA36E", ink: "#FFFBF3", subInk: "#F6E7CF" },
    darkness: 0.44,
  },
  support: {
    id: "support",
    idealSlot: 2,
    icon: "group",
    defaultColor: { front: "#82362B", side: "#5B261C", top: "#9A4A3D", ink: "#FFF7F1", subInk: "#F2D5CA" },
    darkness: 0.72,
  },
  base: {
    id: "base",
    idealSlot: 3,
    icon: "grid",
    defaultColor: { front: "#501215", side: "#3A0F10", top: "#6A1E21", ink: "#FFF6EE", subInk: "#E8CBC4" },
    darkness: 0.96,
  },
};

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报",
    badge: "海报四级模型",
    sunLabel: "焦点汇聚",
    tiers: {
      apex: { name: "顶点 / 重点", sub: "吸引注意力 · 传达核心信息" },
      secondary: { name: "次要层", sub: "补充说明 · 支撑核心内容" },
      support: { name: "支撑层", sub: "提供背景与细节 · 丰富层次" },
      base: { name: "基础层", sub: "构建场景与语境 · 奠定基调" },
    },
  },
  landscape: {
    id: "landscape",
    label: "风景摄影",
    badge: "自然纵深层级",
    sunLabel: "日照主峰",
    tiers: {
      apex: { name: "日照孤峰", sub: "光线最亮 · 锁定视觉最高点" },
      secondary: { name: "远山云带", sub: "舒展呼应 · 托举主峰轮廓" },
      support: { name: "中景林坡", sub: "斜坡收束 · 引视线逐级攀升" },
      base: { name: "前景暗岩", sub: "宽阔深沉 · 压稳整幅地平基座" },
    },
  },
  presentation: {
    id: "presentation",
    label: "演讲演示",
    badge: "明托逻辑阶梯",
    sunLabel: "核心主张",
    tiers: {
      apex: { name: "核心结论", sub: "一语定调 · 观众一眼记住" },
      secondary: { name: "关键论点", sub: "三条归类 · 承接顶层主张" },
      support: { name: "案例拆解", sub: "具体情境 · 佐证论点可信" },
      base: { name: "底层数据", sub: "调研与事实 · 奠定说服基石" },
    },
  },
  architecture: {
    id: "architecture",
    label: "建筑与空间",
    badge: "实体退台荷载",
    sunLabel: "采光穹顶",
    tiers: {
      apex: { name: "采光尖顶", sub: "轻盈收束 · 确立空间朝向" },
      secondary: { name: "退台柱廊", sub: "逐层减重 · 过渡内外尺度" },
      support: { name: "承重石墙", sub: "厚实竖向体量 · 传导荷载" },
      base: { name: "宽阔台基", sub: "深植大地 · 抵抗倾覆力矩" },
    },
  },
  team: {
    id: "team",
    label: "团队与组织",
    badge: "组织职能分层",
    sunLabel: "共同愿景",
    tiers: {
      apex: { name: "战略决策", sub: "凝聚方向 · 明确唯一优先级" },
      secondary: { name: "部门协同", sub: "拆解目标 · 连接上下链路" },
      support: { name: "专业执行", sub: "方法与研发 · 支撑业务推进" },
      base: { name: "一线运营", sub: "贴近用户 · 托起组织基本盘" },
    },
  },
};

// 三套明暗阶梯色板：正常「底重顶轻」、拉平「均灰粘连」、倒置「顶重底轻」
const TONE_PALETTES = {
  bottomHeavy: [
    { front: "#B37612", side: "#784A08", top: "#CE932B", ink: "#FFF8EC", subInk: "#FCECC8", darkness: 0.28 },
    { front: "#B68B55", side: "#845E32", top: "#CCA36E", ink: "#FFFBF3", subInk: "#F6E7CF", darkness: 0.44 },
    { front: "#82362B", side: "#5B261C", top: "#9A4A3D", ink: "#FFF7F1", subInk: "#F2D5CA", darkness: 0.72 },
    { front: "#501215", side: "#3A0F10", top: "#6A1E21", ink: "#FFF6EE", subInk: "#E8CBC4", darkness: 0.96 },
  ],
  flat: [
    { front: "#9E846C", side: "#7D6652", top: "#B39B83", ink: "#FFFBF5", subInk: "#EFE4D6", darkness: 0.56 },
    { front: "#9A7F68", side: "#78624E", top: "#AE957E", ink: "#FFFBF5", subInk: "#EFE4D6", darkness: 0.58 },
    { front: "#957A64", side: "#745D4B", top: "#AA9079", ink: "#FFFBF5", subInk: "#EFE4D6", darkness: 0.60 },
    { front: "#907660", side: "#6E5847", top: "#A58C75", ink: "#FFFBF5", subInk: "#EFE4D6", darkness: 0.62 },
  ],
  topHeavy: [
    { front: "#501215", side: "#3A0F10", top: "#6A1E21", ink: "#FFF6EE", subInk: "#E8CBC4", darkness: 0.96 },
    { front: "#82362B", side: "#5B261C", top: "#9A4A3D", ink: "#FFF7F1", subInk: "#F2D5CA", darkness: 0.72 },
    { front: "#B68B55", side: "#845E32", top: "#CCA36E", ink: "#FFFBF3", subInk: "#F6E7CF", darkness: 0.44 },
    { front: "#C99F57", side: "#9B7534", top: "#DCB774", ink: "#2E0B0A", subInk: "#5C3515", darkness: 0.24 },
  ],
};

export const GAP_MODES = {
  tight: { id: "tight", label: "贴合砌筑", gapNorm: 0.008 },
  breath: { id: "breath", label: "微缝分层", gapNorm: 0.032 },
  broken: { id: "broken", label: "断裂飘散", gapNorm: 0.086 },
};

export const TONE_MODES = {
  bottomHeavy: { id: "bottomHeavy", label: "底重顶轻" },
  flat: { id: "flat", label: "明暗拉平" },
  topHeavy: { id: "topHeavy", label: "顶重底轻" },
};

// 开场刻意停在 0/4 复合错态：悬挑倒扣 + 顶重底轻 + 顶点沉底 + 基础悬空
export const INITIAL_STATE = {
  widths: [0.60, 0.46, 0.68, 0.44],
  order: ["support", "base", "apex", "secondary"],
  toneMode: "topHeavy",
  gapMode: "tight",
  scenario: "poster",
  showSightline: true,
  selectedSlot: -1,
};

// 多组合法解与明确试错态
export const PRESETS = {
  initial: {
    id: "initial",
    label: "复原错态",
    kind: "reset",
    patch: {
      widths: [0.60, 0.46, 0.68, 0.44],
      order: ["support", "base", "apex", "secondary"],
      toneMode: "topHeavy",
      gapMode: "tight",
    },
  },
  classic: {
    id: "classic",
    label: "原海报经典解",
    kind: "solve",
    patch: {
      widths: [0.30, 0.50, 0.68, 0.86],
      order: ["apex", "secondary", "support", "base"],
      toneMode: "bottomHeavy",
      gapMode: "tight",
    },
  },
  monument: {
    id: "monument",
    label: "高耸纪念碑解",
    kind: "solve",
    patch: {
      widths: [0.22, 0.39, 0.55, 0.72],
      order: ["apex", "secondary", "support", "base"],
      toneMode: "bottomHeavy",
      gapMode: "tight",
    },
  },
  terrace: {
    id: "terrace",
    label: "宽坛微缝解",
    kind: "solve",
    patch: {
      widths: [0.32, 0.52, 0.72, 0.92],
      order: ["apex", "secondary", "support", "base"],
      toneMode: "bottomHeavy",
      gapMode: "breath",
    },
  },
  tryPillar: {
    id: "tryPillar",
    label: "试错：直筒平柱",
    kind: "fail",
    patch: {
      widths: [0.58, 0.60, 0.62, 0.64],
      order: ["apex", "secondary", "support", "base"],
      toneMode: "bottomHeavy",
      gapMode: "tight",
    },
  },
  tryInverted: {
    id: "tryInverted",
    label: "试错：悬挑倒扣",
    kind: "fail",
    patch: {
      widths: [0.80, 0.64, 0.48, 0.32],
      order: ["apex", "secondary", "support", "base"],
      toneMode: "topHeavy",
      gapMode: "tight",
    },
  },
  tryFlatTone: {
    id: "tryFlatTone",
    label: "试错：明暗拉平",
    kind: "fail",
    patch: {
      widths: [0.30, 0.50, 0.68, 0.86],
      order: ["apex", "secondary", "support", "base"],
      toneMode: "flat",
      gapMode: "tight",
    },
  },
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function cloneState(src = INITIAL_STATE) {
  return {
    widths: [...src.widths],
    order: [...src.order],
    toneMode: src.toneMode,
    gapMode: src.gapMode,
    scenario: src.scenario,
    showSightline: src.showSightline,
    selectedSlot: src.selectedSlot ?? -1,
  };
}

// 供开放区横拖 (data-perf-drag) 连续推拉整塔坡度：
// 向右拖扩大底基、收紧顶峰（推向稳定金字塔）；向左拖收紧底基、撑宽顶峰（推向直筒或倒扣）
export function applySlopeDelta(state, delta) {
  const weights = [-0.55, -0.18, 0.22, 0.62];
  for (let i = 0; i < 4; i++) {
    state.widths[i] = clamp(+(state.widths[i] + delta * weights[i]).toFixed(3), 0.18, 0.94);
  }
}

export function setSlotWidth(state, slot, widthNorm) {
  state.widths[slot] = clamp(+widthNorm.toFixed(3), 0.18, 0.94);
}

export function swapSlots(state, a, b) {
  if (a === b || a < 0 || b < 0 || a > 3 || b > 3) return;
  const tmp = state.order[a];
  state.order[a] = state.order[b];
  state.order[b] = tmp;
  state.selectedSlot = -1;
}

// 计算某一层当帧实际渲染用的石色与明度重量：
// - bottomHeavy: 按语义角色色或槽位顺延（当层序排对时正好与原海报 1:1 吻合；层序错位时跟角色走，方便用户一眼看出「深绛基座跑到上面去了」！）
// - flat: 四层强制拉平为相近暖灰褐
// - topHeavy: 刻意将深重暗色压在顶部、浅亮金色放在底部，实测「轮廓对了也会头重脚轻」
export function slotAppearance(state, slot) {
  const roleId = state.order[slot];
  if (state.toneMode === "flat") {
    return TONE_PALETTES.flat[slot];
  }
  if (state.toneMode === "topHeavy") {
    return TONE_PALETTES.topHeavy[slot];
  }
  const role = ROLES[roleId];
  return {
    ...role.defaultColor,
    darkness: role.darkness,
  };
}

// 单真源几何 + 视觉重力 + 四要点 + 四步构建评测
export function evaluate(state) {
  const widths = state.widths;
  const gapCfg = GAP_MODES[state.gapMode] || GAP_MODES.tight;
  const gapNorm = gapCfg.gapNorm;
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;

  // 在归一化坐标系里构建 4 层截锥的真实几何（y=0 为塔顶太阳下方起算，y=1 为地面基线）
  const totalHeight = 0.72;
  const topOrigin = 0.22;
  const totalGaps = gapNorm * 3;
  const tierH = (totalHeight - totalGaps) / 4;

  const tiers = [];
  let sumVisualMass = 0;
  let sumMassYFromBase = 0; // 距地面的高度加权
  const baseLineY = topOrigin + totalHeight;

  for (let i = 0; i < 4; i++) {
    const yTop = topOrigin + i * (tierH + gapNorm);
    const yBot = yTop + tierH;
    const roleId = state.order[i];
    const roleText = sc.tiers[roleId];
    const app = slotAppearance(state, i);

    const botW = widths[i];
    // 截锥斜切：为了既真实呈现 3D 石阶梯面、又保留相邻层宽差，每块自身顶部按温和比例向内收 12%（若已比上层还窄则收 6%）
    const taperFactor = i === 0 ? 0.74 : 0.87;
    const topW = clamp(botW * taperFactor, 0.12, 0.94);

    const avgW = (topW + botW) * 0.5;
    const area = avgW * tierH;
    // 阿恩海姆视觉重量示意模型：面积 × (基础存在感 0.35 + 明暗深重系数 0.95 × darkness)
    const visualMass = area * (0.35 + 0.95 * app.darkness);
    const centerYFromBase = (baseLineY - (yTop + yBot) * 0.5) / totalHeight; // 0=底边, 1=顶边

    sumVisualMass += visualMass;
    sumMassYFromBase += visualMass * centerYFromBase;

    const overhangsBelow = i < 3 && widths[i] > widths[i + 1] + 0.015;
    const overhangAmount = i < 3 ? Math.max(0, widths[i] - widths[i + 1]) : 0;

    tiers.push({
      slot: i,
      roleId,
      idealSlot: ROLES[roleId].idealSlot,
      icon: ROLES[roleId].icon,
      name: roleText.name,
      sub: roleText.sub,
      width: botW,
      widthPct: Math.round(botW * 100),
      topW,
      botW,
      yTop,
      yBot,
      tierH,
      color: app,
      darkness: app.darkness,
      area,
      visualMass,
      overhangsBelow,
      overhangPct: Math.round(overhangAmount * 100),
      misplaced: ROLES[roleId].idealSlot !== i,
    });
  }

  const baseW = widths[3];
  const topW = widths[0];
  const baseWidthPct = Math.round(baseW * 100);
  const topWidthPct = Math.round(topW * 100);
  const taperRatio = +(baseW / Math.max(0.08, topW)).toFixed(2);

  // 相邻阶差与悬挑统计
  const stepDrops = [
    widths[1] - widths[0],
    widths[2] - widths[1],
    widths[3] - widths[2],
  ];
  const minStepDrop = Math.min(...stepDrops);
  const minStepDropPct = Math.round(minStepDrop * 100);
  const overhangTiers = tiers.filter((t) => t.overhangsBelow);
  const maxOverhangPct = overhangTiers.reduce((m, t) => Math.max(m, t.overhangPct), 0);

  // 视觉重心高度（0% 地面，50% 正中，<=43% 稳落下半区，>=50% 头重脚轻）
  const visualCogPct = Math.round((sumMassYFromBase / Math.max(1e-5, sumVisualMass)) * 100);

  // 外轮廓平均收束倾角（相对水平面，0°=平摊，90°=垂直方柱，>90°=倒扣悬挑）
  const halfRun = (baseW - topW) * 0.5;
  const slopeRad = Math.atan2(totalHeight, halfRun);
  const slopeDeg = Math.round((slopeRad * 180) / Math.PI);

  // 明暗重底差：最底层暗度 − 最顶层暗度
  const toneDrop = +(tiers[3].darkness - tiers[0].darkness).toFixed(2);

  // 语义层序校验
  const apexOnTop = state.order[0] === "apex";
  const baseOnBottom = state.order[3] === "base";
  const exactOrder =
    apexOnTop &&
    baseOnBottom &&
    state.order[1] === "secondary" &&
    state.order[2] === "support";

  // 4 项原海报核心原理单真源判定
  const hierarchyOk =
    overhangTiers.length === 0 &&
    minStepDrop >= 0.06 &&
    state.toneMode !== "flat" &&
    state.gapMode !== "broken" &&
    exactOrder;

  const stabilityOk =
    baseW >= 0.62 &&
    overhangTiers.length === 0 &&
    visualCogPct <= 43 &&
    toneDrop >= 0.25 &&
    baseOnBottom;

  const focusOk =
    topW <= 0.42 &&
    taperRatio >= 1.8 &&
    apexOnTop &&
    overhangTiers.length === 0;

  const ascentOk =
    overhangTiers.length === 0 &&
    state.gapMode !== "broken" &&
    minStepDrop >= 0.05 &&
    taperRatio >= 1.75 &&
    slopeDeg >= 44 &&
    slopeDeg <= 78;

  const passedCount = [hierarchyOk, stabilityOk, focusOk, ascentOk].filter(Boolean).length;

  // 底部 4 步构建进度（1:1 承袭原海报 ① 确定底部基础 → ② 逐层向上收窄 → ③ 突出核心重点 → ④ 完善细节与平衡）
  const steps = [
    {
      num: 1,
      title: "确定底部基础",
      sub: "建立宽阔的基础层，奠定稳定结构",
      done: baseW >= 0.62 && baseOnBottom && tiers[3].darkness >= 0.65,
    },
    {
      num: 2,
      title: "逐层向上收窄",
      sub: "添加中间层，逐步缩窄形成层级",
      done: overhangTiers.length === 0 && minStepDrop >= 0.06 && state.order[1] === "secondary" && state.order[2] === "support",
    },
    {
      num: 3,
      title: "突出核心重点",
      sub: "在顶点放置核心元素，强化聚焦",
      done: apexOnTop && topW <= 0.42 && taperRatio >= 1.8,
    },
    {
      num: 4,
      title: "完善细节与平衡",
      sub: "调整明暗与间距，保持底重顶轻",
      done: state.toneMode === "bottomHeavy" && state.gapMode !== "broken" && visualCogPct <= 43 && passedCount === 4,
    },
  ];

  // 8 类双向真错态优先级研判 + 多组合法解识别
  let code = "pass";
  let severity = "pass"; // "fail" | "warn" | "pass"
  let shortTag = "四维稳固";
  let headline = "";
  let body = "";
  let actionHint = "";
  let quickFix = null; // 仅提供单步物理纠偏建议，用户可手动或点击单步验证

  if (overhangTiers.length > 0) {
    const worst = overhangTiers.reduce((a, b) => (a.overhangPct >= b.overhangPct ? a : b));
    code = "overhang";
    severity = "fail";
    shortTag = `悬挑 +${worst.overhangPct}%`;
    headline = `第 ${worst.slot + 1} 层比下层宽出 ${worst.overhangPct}%，石阶悬挑随时倾覆`;
    body = `上面宽、下面窄让重力支撑线落到基座外侧，当前视觉重心浮在 ${visualCogPct}% 处。观者视线沿右侧斜坡爬升到悬挑处会被硬生生向外折断，结构已偏向倒三角的险峻失衡。`;
    actionHint = `把第 ${worst.slot + 1} 层左右把手往里收窄，或拉宽下方石阶；也可以直接向右横拖整座塔身。`;
    quickFix = { id: "fixTaper", label: "收束为下宽上窄" };
  } else if (state.toneMode === "topHeavy" || toneDrop < -0.05) {
    code = "topHeavy";
    severity = "fail";
    shortTag = `顶重底轻 · 重心 ${visualCogPct}%`;
    headline = `明暗倒置成「顶重底轻」，视觉重心被拉高到 ${visualCogPct}%`;
    body = `哪怕几何宽度已经下宽上窄，顶部深绛重色仍像一块巨石压在浅亮底座上。观者第一眼会觉得上方沉坠发闷，违背金字塔构图「底重顶轻」的心理稳定律。`;
    actionHint = `把明暗权重切回「底重顶轻」，让深重石色下沉托底、轻亮金色上浮领航。`;
    quickFix = { id: "fixTone", label: "恢复底重顶轻" };
  } else if (!exactOrder) {
    code = "misordered";
    severity = "fail";
    const apexSlot = state.order.indexOf("apex") + 1;
    const baseSlot = state.order.indexOf("base") + 1;
    shortTag = !apexOnTop ? `重点沉在第 ${apexSlot} 层` : !baseOnBottom ? `基座悬在第 ${baseSlot} 层` : "中层错序";
    headline = !apexOnTop
      ? `「${sc.tiers.apex.name}」埋在第 ${apexSlot} 层，塔尖空缺核心`
      : !baseOnBottom
        ? `「${sc.tiers.base.name}」悬在第 ${baseSlot} 层，底座没有压实`
        : `中间「${sc.tiers.secondary.name}」与「${sc.tiers.support.name}」顺序颠倒`;
    body = `金字塔构图的力量在于「空间收窄方向」与「信息层级逻辑」严丝合缝。现在几何指向塔尖，最重要的内容却不在最高处，读者沿斜边爬到顶只会扑空。`;
    actionHint = `依次点按画布上需要调换的两层石阶（或用每层右侧 ↑ / ↓ 按钮），按「基础 → 支撑 → 次要 → 顶点」排好。`;
    quickFix = { id: "fixOrder", label: "排正四级层序" };
  } else if (state.gapMode === "broken") {
    code = "brokenGap";
    severity = "fail";
    shortTag = "层缝断裂";
    headline = "层间空隙过大，四块石阶散成互不相干的横条";
    body = "金字塔需要连续的斜坡轮廓把四层粘合为一个整体。当层距拉开到断裂级别时，格式塔邻近性瓦解，视线无法顺畅攀升，只剩四根各自漂浮的色带。";
    actionHint = "把砌缝模式切回「贴合砌筑」或「微缝分层」，让四层重新咬合成连续坡面。";
    quickFix = { id: "fixGap", label: "收拢层间砌缝" };
  } else if (state.toneMode === "flat") {
    code = "flatTone";
    severity = "fail";
    shortTag = "色阶拉平";
    headline = "四层明暗拉成均灰，阶梯层次糊成一整块";
    body = "金字塔构图与平面三角构图最大的区别在于「可见的分级递进」。现在四层色值几乎没有明暗落差，底层显得不够沉稳，顶峰也缺少提亮聚焦的锋芒。";
    actionHint = "切回「底重顶轻」，拉开从深绛基座到炽金顶峰的明暗阶差。";
    quickFix = { id: "fixTone", label: "拉开底重顶轻色阶" };
  } else if (baseW < 0.62) {
    code = "narrowBase";
    severity = "fail";
    shortTag = `底基仅 ${baseWidthPct}%`;
    headline = `底层宽仅 ${baseWidthPct}%，底座过窄像细长石柱`;
    body = `基础层没有横向铺开（建议 ≥ 62%），整个塔身显得局促摇晃，难以承载上方三层的视觉分量，安定感大打折扣。`;
    actionHint = "拖宽最下方「基础层」左右把手，或向右横拖塔身把地基铺开。";
    quickFix = { id: "fixBase", label: "展宽底部基础层" };
  } else if (taperRatio < 1.8 || minStepDrop < 0.06) {
    code = "pillar";
    severity = "fail";
    shortTag = `宽比 ${taperRatio.toFixed(1)}× 过平`;
    headline = `底顶宽比仅 ${taperRatio.toFixed(2)}×，退化成直筒矩形堆叠`;
    body = `相邻层收窄幅度太小（最小阶差仅 ${minStepDropPct}%，外坡倾角 ${slopeDeg}° 接近竖直）。左右斜边缺少向内聚拢的趋势，视线在平直立面上下滑走，聚不到顶峰。`;
    actionHint = "拉宽底层、逐级收窄上面两层，让底顶宽比达到 1.85× 以上。";
    quickFix = { id: "fixTaper", label: "拉出逐层收窄坡度" };
  } else if (topW > 0.42) {
    code = "wideTop";
    severity = "fail";
    shortTag = `顶层 ${topWidthPct}% 偏宽`;
    headline = `顶层宽达 ${topWidthPct}%，塔尖变成宽平台稀释焦点`;
    body = `顶端区域铺得太宽，读者目光爬升到顶后仍要左右扫视，失去了金字塔顶端「一点收口」的锐利聚焦感。`;
    actionHint = "把最上层左右把手往里收至 22%–38% 区间，让核心信息稳聚塔尖。";
    quickFix = { id: "fixApex", label: "收尖顶峰核心层" };
  } else {
    // 全部 4 维成立！根据实际比例识别多组合法解风格
    code = "pass";
    severity = "pass";
    if (baseW >= 0.86 && state.gapMode === "breath") {
      shortTag = "宽坛微缝 · 成立";
      headline = "宽坛舒展型金字塔成立：厚基稳托、呼吸通透";
      body = `底宽 ${baseWidthPct}%、底顶宽比 ${taperRatio.toFixed(2)}×、视觉重心稳压在 ${visualCogPct}%。微缝保留了建筑退台的轻盈透气，深绛基座与炽金顶点构成清晰的自下而上视线通道。`;
    } else if (topW <= 0.26 && baseW <= 0.78) {
      shortTag = "纪念碑陡峰 · 成立";
      headline = "高耸纪念碑型金字塔成立：收束凌厉、升势强劲";
      body = `外坡倾角 ${slopeDeg}°、顶层收窄至 ${topWidthPct}%，视觉重心仅 ${visualCogPct}%。较陡的斜边显著加快了视线攀登速度，特别适合建筑仰视、山峰与强调权威感的主视觉。`;
    } else {
      shortTag = "经典四级 · 成立";
      headline = "经典平衡金字塔成立：底重顶轻、逐级聚顶";
      body = `四层按 ${baseWidthPct}% → ${Math.round(widths[2] * 100)}% → ${Math.round(widths[1] * 100)}% → ${topWidthPct}% 清晰退台（底顶宽比 ${taperRatio.toFixed(2)}×），视觉重心稳落 ${visualCogPct}%，观者目光沿右侧斜坡顺滑收束到金色顶峰。`;
    }
    actionHint = "你也可以继续微调各层宽幅、切「微缝分层」或点击「试错」按钮对比失衡原因。";
  }

  // 左侧 4 枚原海报圆徽的实时短签（单真源！）
  const probes = [
    {
      id: "hierarchy",
      title: "层级",
      en: "HIERARCHY",
      posterBody: "由宽到窄，自下而上，建立清晰的视觉层次。",
      ok: hierarchyOk,
      status: hierarchyOk
        ? `逐级递减 · 最小阶差 ${minStepDropPct}%`
        : overhangTiers.length
          ? `悬挑倒扣 +${maxOverhangPct}%`
          : !exactOrder
            ? "四级语义错序"
            : state.toneMode === "flat"
              ? "色阶拉平无别"
              : state.gapMode === "broken"
                ? "层距断裂散架"
                : `阶差仅 ${minStepDropPct}%`,
    },
    {
      id: "stability",
      title: "稳定",
      en: "STABILITY",
      posterBody: "宽大的底部支撑整体，带来稳固与安全感。",
      ok: stabilityOk,
      status: stabilityOk
        ? `底宽 ${baseWidthPct}% · 重心 ${visualCogPct}%`
        : !baseOnBottom
          ? "基础层未落底"
          : overhangTiers.length
            ? "上宽下窄失稳"
            : visualCogPct > 43 || toneDrop < 0.25
              ? `重心偏高 ${visualCogPct}%`
              : `底基仅 ${baseWidthPct}%`,
    },
    {
      id: "focus",
      title: "聚焦",
      en: "FOCUS",
      posterBody: "顶部汇聚视线焦点，突出核心信息或主体。",
      ok: focusOk,
      status: focusOk
        ? `顶宽 ${topWidthPct}% · 宽比 ${taperRatio.toFixed(1)}×`
        : !apexOnTop
          ? `重点落第 ${state.order.indexOf("apex") + 1} 层`
          : topW > 0.42
            ? `顶面过宽 ${topWidthPct}%`
            : `收束仅 ${taperRatio.toFixed(1)}×`,
    },
    {
      id: "ascent",
      title: "引导",
      en: "ASCENT",
      posterBody: "视线沿层级自然上升，强化信息的传达路径。",
      ok: ascentOk,
      status: ascentOk
        ? `斜坡 ${slopeDeg}° · 直贯顶峰`
        : overhangTiers.length
          ? "悬挑折断视线"
          : state.gapMode === "broken"
            ? "空隙截断路径"
            : `斜坡 ${slopeDeg}° 趋直`,
    },
  ];

  // 稳态示意档位（绝不用假精确百分比！）
  const stabilityGrade =
    passedCount === 4
      ? "稳固聚顶（示意）"
      : overhangTiers.length > 0 || visualCogPct >= 50
        ? "悬倾失稳（示意）"
        : passedCount >= 2
          ? "初具雏形（示意）"
          : "松散失序（示意）";

  return {
    tiers,
    gapNorm,
    baseLineY,
    topOrigin,
    totalHeight,
    baseWidthPct,
    topWidthPct,
    taperRatio,
    minStepDropPct,
    maxOverhangPct,
    overhangCount: overhangTiers.length,
    visualCogPct,
    slopeDeg,
    toneDrop,
    apexOnTop,
    baseOnBottom,
    exactOrder,
    passedCount,
    probes,
    steps,
    code,
    severity,
    shortTag,
    headline,
    body,
    actionHint,
    quickFix,
    stabilityGrade,
    scenario: sc,
  };
}

// 执行单步纠偏（点击诊单上的单步建议按钮，只修当前最紧迫的一项错态，不一键偷渡全部答案）
export function applySingleFix(state, fixId) {
  if (fixId === "fixTaper") {
    state.widths = [0.30, 0.50, 0.68, 0.86];
  } else if (fixId === "fixTone") {
    state.toneMode = "bottomHeavy";
  } else if (fixId === "fixOrder") {
    state.order = ["apex", "secondary", "support", "base"];
    state.selectedSlot = -1;
  } else if (fixId === "fixGap") {
    state.gapMode = "tight";
  } else if (fixId === "fixBase") {
    state.widths[3] = Math.max(state.widths[3], 0.84);
    state.widths[2] = Math.min(Math.max(state.widths[2], 0.64), state.widths[3] - 0.14);
  } else if (fixId === "fixApex") {
    state.widths[0] = 0.30;
    if (state.widths[1] - state.widths[0] < 0.12) state.widths[1] = 0.48;
  }
}
