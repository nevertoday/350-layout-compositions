// 197 层级网格（HIERARCHICAL GRID）单真源数据与几何核算模型
// 所有画布坐标、面积百分比、右侧重要性轴连线、01-05 原则状态与白话诊单均由此模块同一组数派生

export const PALETTE = {
  forestDeep: "#021A11",
  forestCard: "#08251B",
  forestLift: "#0E3427",
  forestInk: "#052218",
  oatmeal: "#EFE5D6",
  oatmealFrame: "#EADCC8",
  oatmealBright: "#F7F1E7",
  coral: "#DE8E86",
  coralBright: "#F2A298",
  coralDeep: "#9E362E",
  ochre: "#C49C60",
  ochreBright: "#DFB878",
  ochreDeep: "#7A561D",
  sage: "#727C6D",
  sageDark: "#113328",
  sagePaper: "#E5E8E2",
  okDark: "#72D6B4",
  okLight: "#0F6349",
  errDark: "#FF8A7A",
  errLight: "#B52B22",
};

// 开场刻意停在 0/4 翻车态：权重倒挂（A 22% < C 30%、D 27%）、四区接近平权、D 脚注喧宾、0px 粘连、字阶同号 1.0×
export const INITIAL_STATE = {
  splitX: 0.30,
  splitBC: 0.41,
  splitD: 0.73,
  gapMode: "zero",      // "zero" | "comfort" | "wide"
  typeMode: "flat",     // "flat" | "clear" | "bold"
  swapAC: false,        // true 时把主区 A 与辅助区 C 的位置互换，制造主次错位实验
  scene: "anatomy",     // "anatomy" | "cover" | "editorial" | "data" | "article"
  activeHandle: "splitX",
};

// 原海报 197 及四类应用案例的参考正当解（接受范围远不止这五组）
export const SCENE_PRESETS = {
  anatomy: {
    id: "anatomy",
    label: "A/B/C/D 解剖",
    short: "原海报",
    solution: { splitX: 0.65, splitBC: 0.55, splitD: 0.88, gapMode: "comfort", typeMode: "clear", swapAC: false },
    note: "原海报标准四区：A 主视觉占左大壁，B 承接与 C 辅助列于右侧，D 退居底沿。",
    content: {
      A: { tag: "主视觉 / 核心信息区", title: "A", sub: "承载最重要的信息，占据最大视觉面积。", meta: "优先级 1 · 视觉入口" },
      B: { tag: "次要信息区", title: "B", sub: "用来承接与解释，面积小于 A。", meta: "优先级 2 · 信息承接" },
      C: { tag: "辅助信息区", title: "C", sub: "提供补充说明、数据或支持内容。", meta: "优先级 3 · 辅佐支撑" },
      D: { tag: "补充与细节区", title: "D", sub: "放置注释、出处、标签等低优先级信息。", meta: "优先级 4 · 安静退底" },
    },
  },
  cover: {
    id: "cover",
    label: "案例一 · 封面页",
    short: "封面页",
    solution: { splitX: 0.68, splitBC: 0.56, splitD: 0.89, gapMode: "comfort", typeMode: "bold", swapAC: false },
    note: "大面积主视觉 + 标题聚焦，底部留白与小元素平衡节奏。",
    content: {
      A: { tag: "封面主视觉", title: "大标题", sub: "空间建筑年展 · 2026 春季特辑", meta: "ISSUE 197" },
      B: { tag: "副标题导语", title: "秩序与留白", sub: "在不等比分区里建立自然呼吸感", meta: "04.12 – 06.30" },
      C: { tag: "策展亮点", title: "38 组作品", sub: "从瑞士铅字到当代屏幕的网格演进", meta: "东馆 2F" },
      D: { tag: "出版信息", title: "城市设计美术馆", sub: "策展部编印 · 免费取阅 · NO.197", meta: "EDITION" },
    },
  },
  editorial: {
    id: "editorial",
    label: "案例二 · 图文页",
    short: "图文页",
    solution: { splitX: 0.62, splitBC: 0.54, splitD: 0.88, gapMode: "comfort", typeMode: "clear", swapAC: false },
    note: "文字与图片按重要性分区，形成互补与节奏。",
    content: {
      A: { tag: "主图跨页视窗", title: "远岫微光", sub: "大幅山景视觉占据焦点，先定情绪基调", meta: "摄影 · 林野" },
      B: { tag: "标题与导言", title: "标题内容", sub: "副标题或引言承接画面情绪，带出阅读入口。", meta: "特稿正文" },
      C: { tag: "田野摘记", title: "行旅手记", sub: "海拔 1420 米处晨雾消散前的十分钟光线记录。", meta: "旁注 02" },
      D: { tag: "图注与出处", title: "图 04 · 胶片扫描", sub: "收录于《地理视觉志》第 18 辑，第 42 页。", meta: "SOURCE" },
    },
  },
  data: {
    id: "data",
    label: "案例三 · 数据页",
    short: "数据页",
    solution: { splitX: 0.60, splitBC: 0.52, splitD: 0.88, gapMode: "comfort", typeMode: "bold", swapAC: false },
    note: "核心数据放大强化，图表与说明分区辅助理解。",
    content: {
      A: { tag: "关键数据焦点", title: "72%", sub: "读者在 2 秒内先定位最大面积信息块", meta: "核心指标" },
      B: { tag: "趋势柱图区", title: "6 季对比", sub: "柱高阶差承接核心数字背后的走势变化", meta: "Q1 – Q6" },
      C: { tag: "解读要点", title: "口径说明", sub: "样本覆盖 4 类典型数字出版与导视版面。", meta: "方法摘要" },
      D: { tag: "数据出处", title: "内部版面测试集", sub: "示意数据仅作层级比例对照，非行业普查统计。", meta: "NOTE" },
    },
  },
  article: {
    id: "article",
    label: "案例四 · 长文页",
    short: "长文页",
    solution: { splitX: 0.61, splitBC: 0.56, splitD: 0.89, gapMode: "comfort", typeMode: "clear", swapAC: false },
    note: "标题、段落、引文与注释分层组织，提升阅读效率。",
    content: {
      A: { tag: "主文阅读区", title: "章节标题", sub: "宽阔稳定的正文主栏承载深度叙述，让视线匀速下行而不费力。", meta: "第三章 · 比例" },
      B: { tag: "重点引文框", title: "核心摘句", sub: "“先定内容权重，再定空间分配。”", meta: "PULL QUOTE" },
      C: { tag: "延伸词条", title: "背景术语", sub: "区分层级网格与模块化网格的关键在是否等分。", meta: "边栏释义" },
      D: { tag: "页脚注释", title: "注 [1][2]", sub: "引自蒂莫西·萨马拉《网格的构建与打破》（2002）。", meta: "FOOTNOTE" },
    },
  },
};

export const GAP_CONFIG = {
  zero: { id: "zero", label: "0px 粘连", ratio: 0.0, pxLabel: "0px", ok: false },
  comfort: { id: "comfort", label: "适度留白", ratio: 0.022, pxLabel: "14px", ok: true },
  wide: { id: "wide", label: "过宽散架", ratio: 0.068, pxLabel: "44px", ok: false },
};

export const TYPE_CONFIG = {
  flat: { id: "flat", label: "平权同号", scale: 1.0, ratioLabel: "1.0× 同号", ok: false },
  clear: { id: "clear", label: "清晰阶梯", scale: 1.65, ratioLabel: "1.65× 清晰", ok: true },
  bold: { id: "bold", label: "强海报对比", scale: 2.15, ratioLabel: "2.15× 强对比", ok: true },
};

export const CLAMP = {
  splitX: [0.16, 0.84],
  splitBC: [0.16, 0.84],
  splitD: [0.54, 0.94],
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function normalizeState(raw) {
  return {
    splitX: clamp(Number(raw.splitX ?? INITIAL_STATE.splitX), CLAMP.splitX[0], CLAMP.splitX[1]),
    splitBC: clamp(Number(raw.splitBC ?? INITIAL_STATE.splitBC), CLAMP.splitBC[0], CLAMP.splitBC[1]),
    splitD: clamp(Number(raw.splitD ?? INITIAL_STATE.splitD), CLAMP.splitD[0], CLAMP.splitD[1]),
    gapMode: GAP_CONFIG[raw.gapMode] ? raw.gapMode : INITIAL_STATE.gapMode,
    typeMode: TYPE_CONFIG[raw.typeMode] ? raw.typeMode : INITIAL_STATE.typeMode,
    swapAC: Boolean(raw.swapAC),
    scene: SCENE_PRESETS[raw.scene] ? raw.scene : INITIAL_STATE.scene,
    activeHandle: ["splitX", "splitBC", "splitD"].includes(raw.activeHandle) ? raw.activeHandle : "splitX",
  };
}

// 最大余数法把 4 个浮点面积比例转成严格加和为 100 的整数百分比
function toPercents100(rawMap) {
  const keys = ["A", "B", "C", "D"];
  const exact = keys.map((k) => ({ k, v: rawMap[k] * 100 }));
  const floored = exact.map((e) => ({ k: e.k, n: Math.floor(e.v), r: e.v - Math.floor(e.v) }));
  let rem = 100 - floored.reduce((s, e) => s + e.n, 0);
  const byRem = [...floored].sort((a, b) => b.r - a.r);
  for (let i = 0; i < rem; i++) byRem[i % keys.length].n += 1;
  const out = {};
  for (const e of floored) out[e.k] = e.n;
  return out;
}

// 核心单真源几何与诊断函数
export function evaluate(rawState) {
  const s = normalizeState(rawState);
  const gap = GAP_CONFIG[s.gapMode].ratio;
  const topH = s.splitD;
  const botH = 1 - s.splitD;
  const leftW = s.splitX;
  const rightW = 1 - s.splitX;

  // 槽位几何（归一化 0..1，已扣除缝隙用于视觉绘制）
  const gX = gap;
  const gY = gap * 1.15;
  const usableTopH = Math.max(0.08, topH - gY * 0.5);
  const usableBotY = Math.min(0.96, topH + gY * 0.5);
  const usableBotH = Math.max(0.04, 1 - usableBotY);

  const leftRect = { x: 0, y: 0, w: Math.max(0.06, leftW - gX * 0.5), h: usableTopH };
  const rightX = Math.min(0.94, leftW + gX * 0.5);
  const rightUsableW = Math.max(0.06, 1 - rightX);
  const bcSplitY = usableTopH * s.splitBC;
  const topRightRect = { x: rightX, y: 0, w: rightUsableW, h: Math.max(0.04, bcSplitY - gY * 0.5) };
  const midRightRect = {
    x: rightX,
    y: Math.min(usableTopH - 0.04, bcSplitY + gY * 0.5),
    w: rightUsableW,
    h: Math.max(0.04, usableTopH - Math.min(usableTopH - 0.04, bcSplitY + gY * 0.5)),
  };
  const bottomRect = { x: 0, y: usableBotY, w: 1, h: usableBotH };

  // 真实网格占比（不含装饰缝隙，保持四区加和 = 1.0）
  const slotAreas = {
    left: leftW * topH,
    topRight: rightW * topH * s.splitBC,
    midRight: rightW * topH * (1 - s.splitBC),
    bottom: botH,
  };

  // 若用户打开了「A/C 角色互换」，则主区 A 落在右中格、辅助区 C 跑到左大格
  const rects = s.swapAC
    ? { A: midRightRect, B: topRightRect, C: leftRect, D: bottomRect }
    : { A: leftRect, B: topRightRect, C: midRightRect, D: bottomRect };

  const areas = s.swapAC
    ? { A: slotAreas.midRight, B: slotAreas.topRight, C: slotAreas.left, D: slotAreas.bottom }
    : { A: slotAreas.left, B: slotAreas.topRight, C: slotAreas.midRight, D: slotAreas.bottom };

  const pct = toPercents100(areas);

  // 排序与右侧「重要性 高->低」连线交叉核算
  // 理想重要性顺位：A (0) > B (1) > C (2) > D (3)
  const idealOrder = ["A", "B", "C", "D"];
  const actualOrder = [...idealOrder].sort((a, b) => areas[b] - areas[a]);
  const rankOf = {};
  actualOrder.forEach((k, i) => { rankOf[k] = i; });

  // 检查成对倒挂（容忍 0.8% 以内肉眼几乎相等的 B/C 边缘，避免死卡 1px）
  const eps = 0.008;
  const inversions = [];
  const pairs = [["A", "B"], ["A", "C"], ["A", "D"], ["B", "C"], ["B", "D"], ["C", "D"]];
  for (const [hi, lo] of pairs) {
    if (areas[hi] + eps < areas[lo]) {
      inversions.push([hi, lo]);
    }
  }

  const maxOther = Math.max(areas.B, areas.C, areas.D);
  const heroRatio = areas.A / Math.max(0.01, maxOther);
  const top1 = areas[actualOrder[0]];
  const top2 = areas[actualOrder[1]];
  const leadSpread = top1 / Math.max(0.01, top2);

  // 四条核心判据（单真源）
  const orderOk = inversions.length === 0;
  const heroAreaOk = areas.A >= 0.44 && areas.A <= 0.68;
  const heroDominanceOk = heroRatio >= 1.65;
  const supportRoomOk = areas.B >= 0.095 && areas.C >= 0.095;
  const heroOk = heroAreaOk && heroDominanceOk && supportRoomOk;
  const detailAreaOk = areas.D >= 0.07 && areas.D <= 0.175;
  const gapOk = GAP_CONFIG[s.gapMode].ok;
  const detailOk = detailAreaOk && gapOk;
  const contrastOk = TYPE_CONFIG[s.typeMode].ok;

  const checks = { orderOk, heroOk, detailOk, contrastOk };
  const passedCount = [orderOk, heroOk, detailOk, contrastOk].filter(Boolean).length;

  // 8 类精确错态诊断（按视觉病根严重度排定主诊断）
  let diag;
  if (!orderOk) {
    const [hi, lo] = inversions[0];
    const swapHint = s.swapAC
      ? "你当前把「主视觉 A」和「辅助区 C」换了槽位，请先点「归位 A/C 角色」，或拉大 A 所在区域。"
      : hi === "A"
        ? `向右拖动中间的虚线主纵墙（并下压底沿 D 墙），让 A 稳稳大过 ${lo} 并占到 44%–68%。`
        : `微调右侧横墙与底墙，让 B 略高于 C、D 安静退回 7%–17%，把右侧交叉红线解开。`;
    diag = {
      code: "inversion",
      badge: `错态 · 权重倒挂 (${passedCount}/4)`,
      title: `更重要的 ${hi} 区（${pct[hi]}%）反而比 ${lo} 区（${pct[lo]}%）还小`,
      why: `大脑默认「面积越大越重要」。当 ${lo} 的地盘盖过 ${hi}，右侧重要性连线立刻交叉打结——内容本意和视觉重力打起架来，读者第一眼就被带偏。`,
      action: swapHint,
    };
  } else if (!heroDominanceOk) {
    diag = {
      code: "flat_equality",
      badge: `错态 · 四区平权 (${passedCount}/4)`,
      title: `A 区只比次大区大 ${heroRatio.toFixed(2)}×，版面退化成平均豆腐块`,
      why: "层级网格靠的是悬殊比例拉开主次。当最大区与第二大区差距不到 1.65 倍时，四块区域在视线里互相抢戏，读者要逐块细读才知道重点在哪。",
      action: "继续向右拖动主纵墙，把 A 区拉开到 44%–68% 经验带，让主次面积比冲过 1.65×。",
    };
  } else if (areas.A < 0.44) {
    diag = {
      code: "hero_weak",
      badge: `错态 · 主区气短 (${passedCount}/4)`,
      title: `主视觉 A 区只占 ${pct.A}%，镇不住整张版面`,
      why: "虽然顺位没乱，但核心信息没拿到足够大的画布面积，和周边次要信息拉不开足够张力，视觉重心发虚。",
      action: "向右拖宽主纵墙（或把底部 D 带收窄），把 A 区放大到 44%–68% 区间。",
    };
  } else if (areas.A > 0.68 || !supportRoomOk) {
    const tight = areas.B < areas.C ? `B（${pct.B}%）` : `C（${pct.C}%）`;
    diag = {
      code: "hero_swallow",
      badge: `错态 · 主区吞并 (${passedCount}/4)`,
      title: `主视觉 A 占到 ${pct.A}%，把辅区 ${tight} 挤成了细窄边角料`,
      why: "主区大胆不等于独占全屏。一旦 B 或 C 跌破 10%，次要标题与辅助说明就会频繁断行、喘不过气，承接链条在第二步直接断掉。",
      action: "稍微向左退回主纵墙，并调匀 B/C 横墙，让 A 留在 44%–68%，B 和 C 各自保留 ≥10% 空间。",
    };
  } else if (areas.D > 0.175) {
    diag = {
      code: "detail_bloat",
      badge: `错态 · 脚注喧宾 (${passedCount}/4)`,
      title: `底部细节区 D 占了 ${pct.D}%，低优先级注释抢了黄金版面`,
      why: "D 区只放出处、标签与页脚注释，它应该安静退底。如今 D 区胖成宽大黑带，反倒把上方真正重要的内容顶憋了。",
      action: "向下拖动底部的水平虚线墙，把 D 区收束回 7%–17% 经验底带。",
    };
  } else if (areas.D < 0.07) {
    diag = {
      code: "detail_crushed",
      badge: `错态 · 底栏挤扁 (${passedCount}/4)`,
      title: `底部细节区 D 被压到只剩 ${pct.D}%，注释文字难以安放`,
      why: "退底不等于消失。把底栏压进不足 7% 的细缝里，出处、页码与版权字号被迫缩小到失读，底部也失去了压舱锚点。",
      action: "向上轻抬底部虚线墙，给 D 区留出 7%–17% 的从容退底带。",
    };
  } else if (!gapOk) {
    diag = {
      code: "gap_bad",
      badge: `错态 · ${s.gapMode === "zero" ? "零缝粘连" : "过宽散架"} (${passedCount}/4)`,
      title: s.gapMode === "zero" ? "四块区域 0px 贴死，边界互相串色发闷" : "区际缝隙拉到 44px，四块内容漂散失联",
      why: s.gapMode === "zero"
        ? "陶粉、暖燕麦、古铜金直接零缝紧贴，没有留白过渡区，眼球在跨区扫视时容易粘连打架。"
        : "留白过宽会把完整的层级网格切成四张互不相干的孤岛卡片，视觉引导在半路掉空。",
      action: "把下方「区缝留白」切到「适度留白」，既隔清分区又保住整体骨架。",
    };
  } else if (!contrastOk) {
    diag = {
      code: "type_flat",
      badge: `错态 · 同号平权 (${passedCount}/4)`,
      title: "分区面积拉开了，但四区字号锁在 1.0× 同一档",
      why: "层级网格靠的是「空间比例 + 字体/对比度」双通道配合。若 A 区的核心标题和 D 区脚注一样大小，眼睛进场后依然要多花一步辨认轻重。",
      action: "把下方「字阶对比」切到「清晰阶梯」或「强海报对比」，完成最后一步立序。",
    };
  } else {
    const styleDesc =
      areas.A >= 0.58
        ? "大主区海报型"
        : Math.abs(areas.B - areas.C) <= 0.025
          ? "均辅双翼型"
          : "经典阶梯型";
    diag = {
      code: "pass",
      badge: `层级成立 · ${styleDesc} (4/4)`,
      title: `A ${pct.A}% → B ${pct.B}% → C ${pct.C}% → D ${pct.D}%，主次一眼锁定`,
      why: `主区是次大区的 ${heroRatio.toFixed(1)} 倍，右侧四根重要性连线平行无交叉，配以${TYPE_CONFIG[s.typeMode].label}与适度留白，视线顺着 A→B→C→D 自然流过。你还可以继续拖动界墙，探索其他同样成立的比例解。`,
      action: "试试切到上方「封面页 / 图文页 / 数据页 / 长文页」，看同一套层级骨架如何驱动不同真实版面。",
    };
  }

  // 映射到原海报左翼 01–05 五条原则的实时核验小签
  const principles = [
    {
      num: "01",
      title: "内容优先",
      body: "根据内容重要性分配空间，主次清晰，服务于信息价值。",
      ok: orderOk,
      tag: orderOk ? `顺位 ${actualOrder.join(">")}` : `倒挂 ${inversions[0][0]}<${inversions[0][1]}`,
      focus: "splitX",
    },
    {
      num: "02",
      title: "突出重点",
      body: "放大核心信息的视觉面积，通过对比强化关注度。",
      ok: heroOk,
      tag: heroOk ? `主区 ${pct.A}% · ${heroRatio.toFixed(1)}×` : areas.A > 0.68 ? `吞并 ${pct.A}%` : `主区 ${pct.A}%`,
      focus: "splitX",
    },
    {
      num: "03",
      title: "引导浏览",
      body: "设计从强到弱的视觉路径，让视线自然流动。",
      ok: orderOk && heroDominanceOk,
      tag: orderOk && heroDominanceOk ? "路径 A→B→C→D" : !orderOk ? "连线交叉" : `平权 ${heroRatio.toFixed(1)}×`,
      focus: "splitBC",
    },
    {
      num: "04",
      title: "灵活结构",
      body: "打破均分的限制，使用合并、留白与跨区，适应内容变化。",
      ok: detailOk && heroDominanceOk,
      tag: !detailAreaOk ? `D区 ${pct.D}%` : !gapOk ? GAP_CONFIG[s.gapMode].label : `D退底 ${pct.D}%`,
      focus: "splitD",
    },
    {
      num: "05",
      title: "层级丰富",
      body: "通过大小、位置、留白、色彩与字体建立多层次信息结构。",
      ok: contrastOk && gapOk,
      tag: contrastOk ? TYPE_CONFIG[s.typeMode].ratioLabel : "同号 1.0×",
      focus: "splitX",
    },
  ];

  return {
    state: s,
    rects,
    areas,
    pct,
    actualOrder,
    rankOf,
    inversions,
    heroRatio,
    leadSpread,
    checks,
    passedCount,
    diag,
    principles,
    handles: {
      splitX: { x: leftW, y0: 0, y1: topH },
      splitBC: { x0: leftW, x1: 1, y: topH * s.splitBC },
      splitD: { x0: 0, x1: 1, y: topH },
    },
  };
}

// =============================================================================
// 02 节：视线路径 4 种拓扑数据（路径节点与示意跳程）
// =============================================================================
export const PATH_TOPOLOGIES = {
  classic: {
    id: "classic",
    label: "左主右辅（原海报）",
    desc: "左侧大 A 块先抓牢眼球，视线再自然右移落到 B，下扫至 C，最后在 D 处轻收——全程无折返。",
    good: true,
    hopsLabel: "0 次折返（示意）",
    speedLabel: "首落点明确（示意）",
    zones: [
      { id: "A", x: 0.04, y: 0.06, w: 0.56, h: 0.72, color: PALETTE.coral, ink: PALETTE.forestInk, label: "A 主视觉 56%", weight: 1.0 },
      { id: "B", x: 0.63, y: 0.06, w: 0.33, h: 0.39, color: PALETTE.oatmealFrame, ink: PALETTE.forestInk, label: "B 次要 17%", weight: 0.65 },
      { id: "C", x: 0.63, y: 0.48, w: 0.33, h: 0.30, color: PALETTE.ochre, ink: PALETTE.forestInk, label: "C 辅助 14%", weight: 0.45 },
      { id: "D", x: 0.04, y: 0.81, w: 0.92, h: 0.13, color: PALETTE.forestDeep, ink: PALETTE.oatmeal, label: "D 细节 13%", weight: 0.25 },
    ],
    path: [
      { x: 0.32, y: 0.40, step: "①", tag: "先入主区" },
      { x: 0.79, y: 0.25, step: "②", tag: "承接解释" },
      { x: 0.79, y: 0.63, step: "③", tag: "补充佐证" },
      { x: 0.48, y: 0.875, step: "④", tag: "轻落注释" },
    ],
  },
  crown: {
    id: "crown",
    label: "顶冠通栏（门户 / 专题）",
    desc: "首屏顶部 A 块横贯全宽先抛出主旨，下方左宽右窄承接正文与侧注，底部轻收页脚，符合纵向滑读习惯。",
    good: true,
    hopsLabel: "0 次折返（示意）",
    speedLabel: "纵贯顺读（示意）",
    zones: [
      { id: "A", x: 0.04, y: 0.06, w: 0.92, h: 0.42, color: PALETTE.coral, ink: PALETTE.forestInk, label: "A 顶冠主区 48%", weight: 1.0 },
      { id: "B", x: 0.04, y: 0.51, w: 0.56, h: 0.31, color: PALETTE.oatmealFrame, ink: PALETTE.forestInk, label: "B 正文区 24%", weight: 0.65 },
      { id: "C", x: 0.63, y: 0.51, w: 0.33, h: 0.31, color: PALETTE.ochre, ink: PALETTE.forestInk, label: "C 侧栏 16%", weight: 0.45 },
      { id: "D", x: 0.04, y: 0.85, w: 0.92, h: 0.09, color: PALETTE.forestDeep, ink: PALETTE.oatmeal, label: "D 脚注 12%", weight: 0.25 },
    ],
    path: [
      { x: 0.45, y: 0.27, step: "①", tag: "顶冠立意" },
      { x: 0.31, y: 0.66, step: "②", tag: "顺入正文" },
      { x: 0.79, y: 0.66, step: "③", tag: "右扫侧注" },
      { x: 0.50, y: 0.895, step: "④", tag: "底栏收尾" },
    ],
  },
  focal: {
    id: "focal",
    label: "数据核心（仪表 / 展板）",
    desc: "左上核心指标大块镇住视点，下配宽幅趋势图，右侧列明口径与说明——先看结论，再查证据。",
    good: true,
    hopsLabel: "0 次折返（示意）",
    speedLabel: "先结论后证据（示意）",
    zones: [
      { id: "A", x: 0.04, y: 0.06, w: 0.62, h: 0.46, color: PALETTE.coral, ink: PALETTE.forestInk, label: "A 核心数 72%", weight: 1.0 },
      { id: "B", x: 0.04, y: 0.55, w: 0.62, h: 0.26, color: PALETTE.oatmealFrame, ink: PALETTE.forestInk, label: "B 走势图 21%", weight: 0.65 },
      { id: "C", x: 0.69, y: 0.06, w: 0.27, h: 0.75, color: PALETTE.ochre, ink: PALETTE.forestInk, label: "C 口径 19%", weight: 0.45 },
      { id: "D", x: 0.04, y: 0.84, w: 0.92, h: 0.10, color: PALETTE.forestDeep, ink: PALETTE.oatmeal, label: "D 来源 10%", weight: 0.25 },
    ],
    path: [
      { x: 0.34, y: 0.28, step: "①", tag: "核心结论" },
      { x: 0.34, y: 0.68, step: "②", tag: "图表验证" },
      { x: 0.82, y: 0.42, step: "③", tag: "查看口径" },
      { x: 0.48, y: 0.89, step: "④", tag: "核对出处" },
    ],
  },
  broken: {
    id: "broken",
    label: "碎块跳线（错例）",
    desc: "四个等大色块穿插错位，主标题挤在右下角、注释放大在左上——视线像迷宫里打弹珠一样来回折返。",
    good: false,
    hopsLabel: "3 次折返打结（示意）",
    speedLabel: "入口迷失（示意）",
    zones: [
      { id: "D", x: 0.04, y: 0.06, w: 0.44, h: 0.42, color: PALETTE.forestDeep, ink: PALETTE.oatmeal, label: "D 注释 26%（误放大）", weight: 0.8 },
      { id: "C", x: 0.51, y: 0.06, w: 0.45, h: 0.42, color: PALETTE.ochre, ink: PALETTE.forestInk, label: "C 辅助 26%", weight: 0.8 },
      { id: "B", x: 0.04, y: 0.51, w: 0.44, h: 0.43, color: PALETTE.oatmealFrame, ink: PALETTE.forestInk, label: "B 次要 24%", weight: 0.8 },
      { id: "A", x: 0.51, y: 0.51, w: 0.45, h: 0.43, color: PALETTE.coral, ink: PALETTE.forestInk, label: "A 主区 24%（沉右下）", weight: 0.8 },
    ],
    path: [
      { x: 0.26, y: 0.27, step: "?", tag: "误撞大脚注" },
      { x: 0.73, y: 0.72, step: "①", tag: "折返找主区" },
      { x: 0.26, y: 0.72, step: "②", tag: "回跳看次要" },
      { x: 0.73, y: 0.27, step: "③", tag: "再跨右上" },
    ],
  },
};

// =============================================================================
// 03 节：五把尺层级通道实验（面积 / 字号 / 留白 / 色彩 / 位置）
// =============================================================================
export const FIVE_LEVERS = [
  { id: "area", label: "① 面积跨区", sub: "给主内容 2.5× 空间", impact: "最底层骨架：先定地盘大小" },
  { id: "scale", label: "② 字号阶差", sub: "标题与正文拉开倍率", impact: "最直接文字锚点：一眼锁定入口" },
  { id: "space", label: "③ 留白孤立", sub: "用四周呼吸白托出重点", impact: "安静却高级：空白本身就是聚光灯" },
  { id: "color", label: "④ 色彩焦点", sub: "高饱和陶粉只给第一主角", impact: "强情绪抓手：克制使用才显贵" },
  { id: "pos", label: "⑤ 位置顶置", sub: "把主角摆进左上方首落区", impact: "顺应读写惯性：零阻力进场" },
];

export function evaluateLevers(activeSet) {
  const n = activeSet.size;
  if (n === 0) {
    return {
      status: "flat",
      badge: "0 / 5 通道 · 一片平权",
      title: "五把尺全关，四段信息挤成无主次灰块",
      detail: "面积相同、字号相同、颜色相同、间距相同——眼睛落进去找不到任何抓手，只能从第一行硬啃到最后一行。",
    };
  }
  if (n === 1) {
    return {
      status: "thin",
      badge: "1 / 5 通道 · 单腿站立",
      title: "已有初步区分，但单靠一维撑不住复杂信息",
      detail: "只打开一把尺能分出「主角与配角」，可一旦内容扩成三四层，单一维度的微差很容易被手机缩屏或环境光抹平。再叠 1–2 把尺会稳得多。",
    };
  }
  if (n === 2 || n === 3) {
    return {
      status: "sweet",
      badge: `${n} / 5 通道 · 清晰舒适带`,
      title: "2–3 把尺协同发力，主次利落又不喧闹",
      detail: "最稳的层级组合往往只需要「空间面积 + 字号/留白或色彩」两到三个维度。彼此印证但不互相打架，其余维度保持统一安静。",
    };
  }
  if (n === 4) {
    return {
      status: "heavy",
      badge: "4 / 5 通道 · 对比偏强",
      title: "四把尺全开，适合远距海报或大促首屏",
      detail: "冲击力极强，适合需要一秒抢眼的展板封面；若用于长文阅读页或日常工具界面，长时间看会略显紧绷。",
    };
  }
  return {
    status: "overload",
    badge: "5 / 5 通道 · 堆料过载",
    title: "五把尺全部拉满：每个块都在大声喊「看我」",
    detail: "全员加粗、全员换色、全员特大字号再配夸张留白，结果反而制造出视觉噪音。层级讲究克制，不是把所有特效一次打光。",
  };
}

// =============================================================================
// 05 节：同小类兄弟网格对照（一句话 + 官方在线版链接）
// =============================================================================
export const NEIGHBOR_GRIDS = [
  { id: "194", name: "手稿网格", diff: "通栏单区服务连续长文，不按权重切多区", url: "https://layout.xiaoxiaodong.ai/194/play/" },
  { id: "195", name: "分栏网格", diff: "用多条垂直栏线均匀分流文本，侧重行长节奏", url: "https://layout.xiaoxiaodong.ai/195/play/" },
  { id: "196", name: "模块化网格", diff: "以等大 X×X 方格横纵拼装，单元规格完全统一", url: "https://layout.xiaoxiaodong.ai/196/play/" },
  { id: "198", name: "基线网格", diff: "用等距水平基线锁住跨栏文字行脚，管的是纵向节奏", url: "https://layout.xiaoxiaodong.ai/198/play/" },
  { id: "199", name: "复合网格", diff: "把两套不同列数（如 2 栏叠 3 栏）叠合出一张网", url: "https://layout.xiaoxiaodong.ai/199/play/" },
  { id: "200", name: "非对称网格", diff: "以失衡比重造张力，重在视觉动势而不一定按四级信息分层", url: "https://layout.xiaoxiaodong.ai/200/play/" },
  { id: "209", name: "响应式网格", diff: "关心网页随屏幕宽度在不同断点自动重构轨道", url: "https://layout.xiaoxiaodong.ai/209/play/" },
  { id: "210", name: "破格网格", diff: "先立严谨格线再刻意越界冲破，制造叛逆焦点", url: "https://layout.xiaoxiaodong.ai/210/play/" },
];

// =============================================================================
// 06 节：什么时候别用层级网格（4 组反例对照）
// =============================================================================
export const ANTI_CASES = [
  {
    id: "catalog",
    tab: "平权商品目录",
    badTitle: "硬套层级网格 → 读者怀疑「放大的是广告」",
    badDesc: "在电商货架、作品集索引、员工名录里，每张卡片天然平等。强行把某几项拉大成 3 倍 A 区，会破坏横向比较的公平预期。",
    betterName: "196 模块化网格",
    betterUrl: "https://layout.xiaoxiaodong.ai/196/play/",
    betterDesc: "改用等大重复的模块化方格，让每件商品站在同一起跑线上，靠筛选和排序而非面积偏心。",
    badBlocks: [
      { x: 4, y: 8, w: 58, h: 66, accent: true, label: "被硬放大的单品？" },
      { x: 66, y: 8, w: 30, h: 31, accent: false, label: "商品 B" },
      { x: 66, y: 43, w: 30, h: 31, accent: false, label: "商品 C" },
      { x: 4, y: 78, w: 92, h: 14, accent: false, label: "其余 12 件被压成细条" },
    ],
    goodBlocks: [
      { x: 4, y: 8, w: 29, h: 40, label: "商品 01" },
      { x: 36, y: 8, w: 29, h: 40, label: "商品 02" },
      { x: 68, y: 8, w: 28, h: 40, label: "商品 03" },
      { x: 4, y: 52, w: 29, h: 40, label: "商品 04" },
      { x: 36, y: 52, w: 29, h: 40, label: "商品 05" },
      { x: 68, y: 52, w: 28, h: 40, label: "商品 06" },
    ],
  },
  {
    id: "novel",
    tab: "沉浸长篇阅读",
    badTitle: "硬套层级网格 → 大起大落打断阅读心流",
    badDesc: "小说、法律条文、学术论文要求读者连续匀速推进，每翻一页如果都在换大块比例和跳跃侧栏，注意力会被反复撕碎。",
    betterName: "194 手稿网格",
    betterUrl: "https://layout.xiaoxiaodong.ai/194/play/",
    betterDesc: "改用安静克制的手稿单栏网格，把舞台全部交还给稳定的字距、行长与宽阔天地留白。",
    badBlocks: [
      { x: 4, y: 8, w: 54, h: 52, accent: true, label: "突兀放大段落" },
      { x: 62, y: 8, w: 34, h: 52, accent: false, label: "抢戏侧栏" },
      { x: 4, y: 64, w: 92, h: 28, accent: false, label: "被截断的下半段" },
    ],
    goodBlocks: [
      { x: 16, y: 10, w: 68, h: 80, label: "通栏连续手稿正文" },
    ],
  },
  {
    id: "table",
    tab: "财务报表对照",
    badTitle: "硬套层级网格 → 列位错开没法竖向比数",
    badDesc: "资产负债表、参数对比表依赖严格的纵向坐标对齐。一旦为了突出某一指标去跨区缩放单元格，肉眼扫列对数立刻失灵。",
    betterName: "195 分栏 / 198 基线",
    betterUrl: "https://layout.xiaoxiaodong.ai/195/play/",
    betterDesc: "数据表应守住等齐分栏与统一基线，若要标红重点行，用浅底色或加粗数字，不要破坏列对齐。",
    badBlocks: [
      { x: 4, y: 8, w: 60, h: 48, accent: true, label: "跨列放大数" },
      { x: 68, y: 8, w: 28, h: 22, accent: false, label: "错位项" },
      { x: 68, y: 34, w: 28, h: 22, accent: false, label: "错位项" },
      { x: 4, y: 62, w: 92, h: 30, accent: false, label: "列头对不上数值" },
    ],
    goodBlocks: [
      { x: 4, y: 10, w: 22, h: 80, label: "项目列" },
      { x: 28, y: 10, w: 22, h: 80, label: "Q1 对齐" },
      { x: 52, y: 10, w: 22, h: 80, label: "Q2 对齐" },
      { x: 76, y: 10, w: 20, h: 80, label: "同比" },
    ],
  },
  {
    id: "ugc",
    tab: "高频动态信息流",
    badTitle: "硬套层级网格 → 权重漂移导致版面常翻车",
    badDesc: "社交动态、实时告警流里，每一分钟进来的内容长短与重要度完全不可预知。写死的四区层级模板很容易出现「一条废话占大块、急报挤在角落」。",
    betterName: "209 响应式网格",
    betterUrl: "https://layout.xiaoxiaodong.ai/209/play/",
    betterDesc: "改用弹性流式卡片或响应式规则列表，仅在顶部保留一个可控置顶位，其余按时间或算法均序排列。",
    badBlocks: [
      { x: 4, y: 8, w: 62, h: 62, accent: true, label: "刚刷出的随手短句？" },
      { x: 70, y: 8, w: 26, h: 62, accent: false, label: "长图截断" },
      { x: 4, y: 74, w: 92, h: 18, accent: false, label: "重要通知压在最底" },
    ],
    goodBlocks: [
      { x: 10, y: 8, w: 80, h: 24, label: "动态流卡片 #1" },
      { x: 10, y: 36, w: 80, h: 24, label: "动态流卡片 #2" },
      { x: 10, y: 64, w: 80, h: 24, label: "动态流卡片 #3" },
    ],
  },
];

// =============================================================================
// 07 节：挑一挑小练习（四选项完全同色同字族，仅变四区空间比例）
// =============================================================================
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    split: { splitX: 0.50, splitBC: 0.50, splitD: 0.76 },
    pctText: "A 38% · B 19% · C 19% · D 24%",
    rects: [
      { k: "A", x: 0, y: 0, w: 0.49, h: 0.73, pct: "38%", name: "展名主视觉" },
      { k: "B", x: 0.51, y: 0, w: 0.49, h: 0.355, pct: "19%", name: "展期导语" },
      { k: "C", x: 0.51, y: 0.375, w: 0.49, h: 0.355, pct: "19%", name: "策展导览" },
      { k: "D", x: 0, y: 0.755, w: 1, h: 0.245, pct: "24%", name: "票务版权" },
    ],
    feedback: "不对：主区（38%）不够果断，反而是低优先级的「票务版权 D（24%）」比「展期导语 B（19%）」和「策展导览 C（19%）」都大，出现了轻重倒挂与接近平权。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    split: { splitX: 0.61, splitBC: 0.58, splitD: 0.89 },
    pctText: "A 54% · B 20% · C 15% · D 11%",
    rects: [
      { k: "A", x: 0, y: 0, w: 0.60, h: 0.865, pct: "54%", name: "展名主视觉" },
      { k: "B", x: 0.62, y: 0, w: 0.38, h: 0.49, pct: "20%", name: "展期导语" },
      { k: "C", x: 0.62, y: 0.51, w: 0.38, h: 0.355, pct: "15%", name: "策展导览" },
      { k: "D", x: 0, y: 0.89, w: 1, h: 0.11, pct: "11%", name: "票务版权" },
    ],
    feedback: "选对了！四区严格按 A 54% > B 20% > C 15% > D 11% 递减：主区够大（次大区的 2.7 倍）一秒抓住入口，导语与导览有序承接，票务与版权安静退在底沿 11%。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    split: { splitX: 0.45, splitBC: 0.52, splitD: 0.66 },
    pctText: "A 30% · B 19% · C 17% · D 34%",
    rects: [
      { k: "A", x: 0, y: 0, w: 0.44, h: 0.635, pct: "30%", name: "展名主视觉" },
      { k: "B", x: 0.46, y: 0, w: 0.54, h: 0.32, pct: "19%", name: "展期导语" },
      { k: "C", x: 0.46, y: 0.34, w: 0.54, h: 0.295, pct: "17%", name: "策展导览" },
      { k: "D", x: 0, y: 0.66, w: 1, h: 0.34, pct: "34%", name: "票务版权" },
    ],
    feedback: "不对：底部「票务版权 D（34%）」竟然比「展名主视觉 A（30%）」还大！这是典型的脚注喧宾夺主，把整张首页的重心拖沉在底端。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    split: { splitX: 0.84, splitBC: 0.52, splitD: 0.94 },
    pctText: "A 79% · B 8% · C 7% · D 6%",
    rects: [
      { k: "A", x: 0, y: 0, w: 0.83, h: 0.915, pct: "79%", name: "展名主视觉" },
      { k: "B", x: 0.85, y: 0, w: 0.15, h: 0.46, pct: "8%", name: "导语" },
      { k: "C", x: 0.85, y: 0.48, w: 0.15, h: 0.435, pct: "7%", name: "导览" },
      { k: "D", x: 0, y: 0.94, w: 1, h: 0.06, pct: "6%", name: "版权" },
    ],
    feedback: "不对：主区贪大吞掉 79%，把导语（8%）和策展时间（7%）挤进极窄细缝里频繁断字，底栏也压扁成 6%，属于「主区吞并过度、辅区失去承接能力」。",
  },
];
