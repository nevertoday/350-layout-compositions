// 131 斑点扫描模式 · 单真源几何与信噪比认知模型
// Canvas 渲染、鼠标/触控命中、碰撞净距、五项核心原则体检、白话诊断全部源自本模块

export const PALETTE = {
  bg: "#06080B",
  cardBg: "#0D1014",
  cardBorder: "#2A313B",
  cyan: "#38DAF5",
  cyanBright: "#63E8FC",
  cyanPill: "#28C5E2",
  blue: "#0D3CFB",
  blueSoft: "#6C8EFF",
  violet: "#8449EF",
  violetPill: "#844DF6",
  violetSoft: "#B792FF",
  white: "#F4F7FA",
  muted: "#A6B1BE",
  dimText: "#5B6674",
  warn: "#FF6B5B",
  ok: "#38E8B0",
};

// 三套真实题材，各含 8 枚主体节点 + 2 枚可选空壳诱饵节点
// shape 决定 1:1 复刻原海报的图形母题：
//   ringDot(蓝白靶圆) | titleCard(青T细框卡) | dot2x2(2x2青点阵) | bangCircle(紫圆!) |
//   donutCard(三色饼环卡) | peakCard(双山视觉卡) | dot3x3(3x3紫点阵) | decoy(空壳假热点)
export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报 · 信息星图",
    shortName: "原海报星图",
    taskHint: "试着把全亮争宠的画面调出 3–5 枚疏朗热点，熄灭空壳点，再点任一节点当入口起跳。",
    nodes: [
      { id: "entry", kind: "hotspot", shape: "ringDot", pill: "入口点", en: "ENTRY POINT", desc: "从任意点开始，无需固定顺序。", short: "任意入口", hasValue: true, isExit: false },
      { id: "title", kind: "node", shape: "titleCard", pill: "标题信号", en: "TITLE SIGNAL", desc: "大号字体、色块、留白快速捕获注意力。", short: "大号标题 T", hasValue: true, isExit: false },
      { id: "hot2", kind: "hotspot", shape: "ringDot", pill: "热点 2", en: "HOTSPOT", desc: "色彩对比强烈，天然吸引视线。", short: "高对比色块", hasValue: true, isExit: false },
      { id: "hot3", kind: "hotspot", shape: "dot2x2", pill: "热点 3", en: "HOTSPOT", desc: "图形或图标组形成视觉吸引点。", short: "2×2 图标群", hasValue: true, isExit: false },
      { id: "strong", kind: "signal", shape: "bangCircle", pill: "强信号", en: "STRONG SIGNAL", desc: "高对比、独特形状触发注意力跳跃。", short: "强信号 !", hasValue: true, isExit: false },
      { id: "data", kind: "node", shape: "donutCard", pill: "数据节点", en: "DATA NODE", desc: "局部信息块，可独立理解。", short: "三色数据环", hasValue: true, isExit: false },
      { id: "visual", kind: "node", shape: "peakCard", pill: "视觉节点", en: "VISUAL NODE", desc: "图片、插图等提供快速线索。", short: "双峰图形卡", hasValue: true, isExit: false },
      { id: "exit", kind: "hotspot", shape: "dot3x3", pill: "收尾点", en: "EXIT POINT", desc: "信息回顾或行动指引，自然收束。", short: "3×3 收束", hasValue: true, isExit: true },
      { id: "decoy1", kind: "decoy", shape: "decoyRing", pill: "空壳高亮", en: "HOLLOW", desc: "纯装饰亮球，跳过去没有结论。", short: "空壳装饰 A", hasValue: false, isExit: false, isDecoy: true },
      { id: "decoy2", kind: "decoy", shape: "decoyBang", pill: "空泛口号", en: "HOLLOW", desc: "写着「不容错过」，不给任何信息。", short: "空壳装饰 B", hasValue: false, isExit: false, isDecoy: true },
    ],
  },
  magazine: {
    id: "magazine",
    name: "设计周刊导览",
    shortName: "设计周刊",
    taskHint: "读者翻开周刊导览不愿从头通读：请留出 3–5 枚真正带干货的入口，删掉空泛装饰标签。",
    nodes: [
      { id: "entry", kind: "hotspot", shape: "ringDot", pill: "本期卷首", en: "ISSUE 42", desc: "3 分钟速览暗夜排版五条规则。", short: "卷首导读", hasValue: true, isExit: false },
      { id: "title", kind: "node", shape: "titleCard", pill: "字距特辑", en: "TYPE SPEC", desc: "正文字距微调 0.02em 的可读性实测。", short: "字距特辑 T", hasValue: true, isExit: false },
      { id: "hot2", kind: "hotspot", shape: "ringDot", pill: "开源字库", en: "FONT DROP", desc: "新增 4 款可商用中文无衬线评测。", short: "开源字库", hasValue: true, isExit: false },
      { id: "hot3", kind: "hotspot", shape: "dot2x2", pill: "工具四件", en: "TOOLKIT", desc: "对比度检查、切图与网格标尺合集。", short: "效率工具组", hasValue: true, isExit: false },
      { id: "strong", kind: "signal", shape: "bangCircle", pill: "年度精选", en: "TOP 12", desc: "2026 年度 12 套获奖网页版式拆解。", short: "年度 12 佳", hasValue: true, isExit: false },
      { id: "data", kind: "node", shape: "donutCard", pill: "眼动数据", en: "SURVEY", desc: "79% 读者先扫热点再决定是否细读。", short: "眼动比例环", hasValue: true, isExit: false },
      { id: "visual", kind: "node", shape: "peakCard", pill: "画册案例", en: "CASE STUDY", desc: "柏林建筑展导视牌的高反差实拍。", short: "建筑展图档", hasValue: true, isExit: false },
      { id: "exit", kind: "hotspot", shape: "dot3x3", pill: "订阅季刊", en: "SUBSCRIBE", desc: "保存本期清单或订阅下周五推送。", short: "订阅收束", hasValue: true, isExit: true },
      { id: "decoy1", kind: "decoy", shape: "decoyRing", pill: "重磅来袭", en: "CLICKBAIT", desc: "只有大红大紫的感叹词，无实质主题。", short: "空泛标签 A", hasValue: false, isExit: false, isDecoy: true },
      { id: "decoy2", kind: "decoy", shape: "decoyBang", pill: "精彩继续", en: "FILLER", desc: "占着强光位置，点开却是空话过渡。", short: "空泛标签 B", hasValue: false, isExit: false, isDecoy: true },
    ],
  },
  launch: {
    id: "launch",
    name: "新品特性墙",
    shortName: "新品亮点墙",
    taskHint: "用户只想在 5 秒内挑最关心的硬件卖点：别把 10 项全拉成强光，让核心参数疏朗跃出。",
    nodes: [
      { id: "entry", kind: "hotspot", shape: "ringDot", pill: "182g 轻薄", en: "TITANIUM", desc: "五级钛金属中框，单手握持减重 19g。", short: "182g 钛框", hasValue: true, isExit: false },
      { id: "title", kind: "node", shape: "titleCard", pill: "全天候屏", en: "DISPLAY", desc: "2600 尼特户外峰值亮度，1–120Hz 刷新。", short: "2600 尼特", hasValue: true, isExit: false },
      { id: "hot2", kind: "hotspot", shape: "ringDot", pill: "48h 续航", en: "BATTERY", desc: "5800mAh 硅碳电池，重度使用两天一充。", short: "48h 续航", hasValue: true, isExit: false },
      { id: "hot3", kind: "hotspot", shape: "dot2x2", pill: "四重防护", en: "IP69", desc: "抗摔微晶玻璃与 2 米水深防尘防水。", short: "四重防护", hasValue: true, isExit: false },
      { id: "strong", kind: "signal", shape: "bangCircle", pill: "0.3s 抓拍", en: "SHUTTER", desc: "独立物理快门键，零延迟锁定动态瞬间。", short: "0.3s 抓拍", hasValue: true, isExit: false },
      { id: "data", kind: "node", shape: "donutCard", pill: "能效提升", en: "BENCHMARK", desc: "3nm 芯片图形性能 +32%，功耗降 24%。", short: "能效环形图", hasValue: true, isExit: false },
      { id: "visual", kind: "node", shape: "peakCard", pill: "潜望长焦", en: "5X OPTIC", desc: "120mm 光学长焦夜景实拍样张预览。", short: "5× 光学样张", hasValue: true, isExit: false },
      { id: "exit", kind: "hotspot", shape: "dot3x3", pill: "预约试机", en: "RESERVE", desc: "选择门店时段或查看完整配置对比表。", short: "预约收束", hasValue: true, isExit: true },
      { id: "decoy1", kind: "decoy", shape: "decoyRing", pill: "震撼进化", en: "BUZZWORD", desc: "空泛宣传词，不给任何可核对的规格。", short: "空话卖点 A", hasValue: false, isExit: false, isDecoy: true },
      { id: "decoy2", kind: "decoy", shape: "decoyBang", pill: "定义未来", en: "HYPE", desc: "占走强紫焦点，却没讲清强在哪里。", short: "空话卖点 B", hasValue: false, isExit: false, isDecoy: true },
    ],
  },
};

// 默认坐标与多套预设（全部使用归一化坐标 0..1）
// 1:1 对照 131 原海报的空间格局：
// 上排：entry(0.14,0.23)  title(0.47,0.20)  hot2(0.84,0.22)
// 中排：hot3(0.18,0.53)   strong(0.49,0.48) data(0.82,0.52)
// 下排：visual(0.16,0.82)                   exit(0.83,0.81)
// (原海报还有居中下方的热点4，这里由 8 枚核心节点+2枚空壳构成疏朗可控的交互星图)
export const PRESETS = {
  // 开场复合错态：1:1 保留原海报标志图形（compound），停在全亮争宠(8 亮+3 强紫核) + 2 枚空壳诱饵 + 2 处清晰可读的热区贴挤
  broken: {
    label: "复原错态",
    contrast: 86,
    signalMode: "compound",
    hollowTrap: true,
    entryId: "entry",
    selectedId: "strong",
    nodes: {
      entry:  { x: 0.12, y: 0.25, tier: 1 },
      title:  { x: 0.45, y: 0.22, tier: 2 }, // 与 strong 偏近制造贴挤警示，但不遮字
      hot2:   { x: 0.86, y: 0.22, tier: 2 },
      hot3:   { x: 0.13, y: 0.54, tier: 1 },
      strong: { x: 0.51, y: 0.52, tier: 2 },
      data:   { x: 0.82, y: 0.52, tier: 1 }, // 与 exit 偏近制造贴挤警示
      visual: { x: 0.18, y: 0.81, tier: 1 },
      exit:   { x: 0.84, y: 0.78, tier: 1 },
      decoy1: { x: 0.30, y: 0.46, tier: 2 }, // 空壳高光抢眼
      decoy2: { x: 0.65, y: 0.78, tier: 1 }, // 空壳高光抢眼
    },
  },
  // 合法解 1：忠实复刻 131 原海报平衡解（5 热点疏朗分布 + 1 枚紫强核 + 3 枚辅助节点退隐作次级背景）
  posterBalanced: {
    label: "原海报平衡解",
    contrast: 72,
    signalMode: "compound",
    hollowTrap: false,
    entryId: "entry",
    selectedId: "strong",
    nodes: {
      entry:  { x: 0.14, y: 0.24, tier: 1 },
      title:  { x: 0.50, y: 0.17, tier: 1 },
      hot2:   { x: 0.85, y: 0.18, tier: 0 },
      hot3:   { x: 0.15, y: 0.58, tier: 0 },
      strong: { x: 0.36, y: 0.66, tier: 2 },
      data:   { x: 0.82, y: 0.45, tier: 1 },
      visual: { x: 0.18, y: 0.82, tier: 0 },
      exit:   { x: 0.82, y: 0.83, tier: 1 },
      decoy1: { x: 0.30, y: 0.46, tier: 0 },
      decoy2: { x: 0.65, y: 0.78, tier: 0 },
    },
  },
  // 合法解 2：极简三锚大留白解（3 热点跨 3 象限，极高信噪比）
  minimalThree: {
    label: "极简三锚解",
    contrast: 68,
    signalMode: "compound",
    hollowTrap: false,
    entryId: "title",
    selectedId: "title",
    nodes: {
      entry:  { x: 0.14, y: 0.22, tier: 0 },
      title:  { x: 0.23, y: 0.20, tier: 1 }, // Q0 左上
      hot2:   { x: 0.82, y: 0.20, tier: 0 },
      hot3:   { x: 0.17, y: 0.56, tier: 0 },
      strong: { x: 0.43, y: 0.64, tier: 2 }, // Q2 左下
      data:   { x: 0.82, y: 0.46, tier: 0 },
      visual: { x: 0.19, y: 0.81, tier: 0 },
      exit:   { x: 0.82, y: 0.76, tier: 1 }, // Q3 右下
      decoy1: { x: 0.30, y: 0.46, tier: 0 },
      decoy2: { x: 0.65, y: 0.78, tier: 0 },
    },
  },
  // 合法解 3：双核对照解（两强核分踞对角 + 两辅热点呼应，从数据节点起跳）
  dualCore: {
    label: "双核星图解",
    contrast: 74,
    signalMode: "compound",
    hollowTrap: false,
    entryId: "data",
    selectedId: "data",
    nodes: {
      entry:  { x: 0.14, y: 0.22, tier: 0 },
      title:  { x: 0.24, y: 0.20, tier: 2 },
      hot2:   { x: 0.82, y: 0.20, tier: 0 },
      hot3:   { x: 0.15, y: 0.52, tier: 0 },
      strong: { x: 0.52, y: 0.52, tier: 1 },
      data:   { x: 0.80, y: 0.24, tier: 2 },
      visual: { x: 0.22, y: 0.81, tier: 1 },
      exit:   { x: 0.83, y: 0.82, tier: 1 },
      decoy1: { x: 0.30, y: 0.46, tier: 0 },
      decoy2: { x: 0.65, y: 0.78, tier: 0 },
    },
  },
  // 试错 A：平灰无信号（反差过低，退化盲区）
  errFlat: {
    label: "试错：平灰隐身",
    contrast: 16,
    signalMode: "none",
    hollowTrap: false,
    entryId: "entry",
    selectedId: "entry",
    nodes: {
      entry:  { x: 0.14, y: 0.22, tier: 1 },
      title:  { x: 0.48, y: 0.20, tier: 1 },
      hot2:   { x: 0.84, y: 0.22, tier: 0 },
      hot3:   { x: 0.17, y: 0.54, tier: 0 },
      strong: { x: 0.49, y: 0.50, tier: 2 },
      data:   { x: 0.82, y: 0.52, tier: 1 },
      visual: { x: 0.17, y: 0.82, tier: 0 },
      exit:   { x: 0.82, y: 0.82, tier: 1 },
      decoy1: { x: 0.34, y: 0.38, tier: 0 },
      decoy2: { x: 0.66, y: 0.72, tier: 0 },
    },
  },
  // 试错 B：退化成左缘单列线性扫描
  errLinear: {
    label: "试错：退成单列",
    contrast: 72,
    signalMode: "compound",
    hollowTrap: false,
    entryId: "entry",
    selectedId: "strong",
    nodes: {
      entry:  { x: 0.19, y: 0.18, tier: 1 },
      title:  { x: 0.21, y: 0.40, tier: 1 },
      hot2:   { x: 0.82, y: 0.22, tier: 0 },
      hot3:   { x: 0.80, y: 0.50, tier: 0 },
      strong: { x: 0.20, y: 0.62, tier: 2 },
      data:   { x: 0.80, y: 0.78, tier: 0 },
      visual: { x: 0.55, y: 0.50, tier: 0 },
      exit:   { x: 0.21, y: 0.84, tier: 1 },
      decoy1: { x: 0.45, y: 0.36, tier: 0 },
      decoy2: { x: 0.65, y: 0.72, tier: 0 },
    },
  },
  // 试错 C：热区全部扎堆挤在中央
  errCluster: {
    label: "试错：热区扎堆",
    contrast: 74,
    signalMode: "compound",
    hollowTrap: false,
    entryId: "entry",
    selectedId: "strong",
    nodes: {
      entry:  { x: 0.42, y: 0.42, tier: 1 },
      title:  { x: 0.55, y: 0.38, tier: 1 },
      hot2:   { x: 0.84, y: 0.20, tier: 0 },
      hot3:   { x: 0.15, y: 0.54, tier: 0 },
      strong: { x: 0.48, y: 0.52, tier: 2 },
      data:   { x: 0.58, y: 0.56, tier: 1 },
      visual: { x: 0.16, y: 0.82, tier: 0 },
      exit:   { x: 0.46, y: 0.63, tier: 1 },
      decoy1: { x: 0.34, y: 0.38, tier: 0 },
      decoy2: { x: 0.66, y: 0.72, tier: 0 },
    },
  },
};

export function createInitialState() {
  return applyPreset({ sceneId: "poster", legendFilter: "all" }, "broken");
}

export function applyPreset(prevState, presetKey) {
  const p = PRESETS[presetKey] || PRESETS.broken;
  const nodes = {};
  for (const [id, v] of Object.entries(p.nodes)) {
    nodes[id] = { x: v.x, y: v.y, tier: v.tier };
  }
  return {
    sceneId: prevState.sceneId || "poster",
    contrast: p.contrast,
    signalMode: p.signalMode,
    hollowTrap: p.hollowTrap,
    entryId: p.entryId,
    selectedId: p.selectedId,
    legendFilter: "all",
    nodes,
  };
}

// 取得当前题材的全部节点（合并模板文案 + 状态坐标与层级）
export function getVisibleNodes(state) {
  const scene = SCENES[state.sceneId] || SCENES.poster;
  return scene.nodes
    .filter((n) => !n.isDecoy || state.hollowTrap)
    .map((meta) => {
      const pos = state.nodes[meta.id] || { x: 0.5, y: 0.5, tier: 0 };
      return {
        ...meta,
        x: pos.x,
        y: pos.y,
        tier: pos.tier,
      };
    });
}

// 归一化半宽/半高（相对画布宽 W 与高 H），供绘制与碰撞净距单真源共用
export function getNodeHalfSize(node, w, h, signalMode = "compound") {
  const unit = Math.min(w, h);
  const compact = w < 540;
  const scale = node.tier === 2 ? 1.07 : node.tier === 1 ? 0.96 : 0.84;
  const isCard = (node.shape === "titleCard" || node.shape === "donutCard" || node.shape === "peakCard") && signalMode !== "color";
  if (isCard) {
    const hw = Math.min(w * (compact ? 0.138 : 0.106), unit * (compact ? 0.18 : 0.215)) * scale;
    const hh = Math.min(h * (compact ? 0.108 : 0.125), unit * (compact ? 0.124 : 0.138)) * scale;
    return { hw, hh, radius: Math.min(hw, hh), isCard: true };
  }
  const r = Math.min(w * (compact ? 0.082 : 0.062), unit * (compact ? 0.10 : 0.106)) * scale;
  return { hw: r * 1.12, hh: r * 1.14, radius: r, isCard: false };
}

export function getNodeRect(node, w, h, signalMode = "compound") {
  const cx = node.x * w;
  const cy = node.y * h;
  const { hw, hh, radius, isCard } = getNodeHalfSize(node, w, h, signalMode);
  return { cx, cy, hw, hh, radius, isCard, x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
}

// 计算任意两矩形外框的最小欧氏净距（像素；负值代表重叠）
function boxDistance(a, b) {
  const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0);
  const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0);
  if (dx === 0 && dy === 0) {
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return -Math.min(ox, oy);
  }
  return Math.hypot(dx, dy);
}

// 节点显著度（仅作内部引力模型与档位判定，绝不伪造精确眼动概率）
function nodeSaliency(node, state) {
  const cFactor = state.contrast / 100;
  const modeGain = state.signalMode === "compound" ? 1.0 : state.signalMode === "color" ? 0.68 : 0.18;
  const tierWeight = node.tier === 2 ? 1.45 : node.tier === 1 ? 0.92 : 0.14;
  return tierWeight * (0.2 + 0.8 * cFactor) * modeGain;
}

// 从任意入口点出发，按显著度 / 距离引力生成非线性跃迁路径
export function computeJumpPath(nodes, state) {
  const active = nodes.filter((n) => n.tier >= 1);
  if (active.length === 0 || state.contrast < 22 || state.signalMode === "none") {
    return [];
  }
  // 找到当前起跳入口：若用户选中的入口在活跃热点数里，直接从它起跳；否则挑显著度最高者
  let current = active.find((n) => n.id === state.entryId);
  if (!current) {
    current = [...active].sort((a, b) => nodeSaliency(b, state) - nodeSaliency(a, state))[0];
  }
  const visited = [current];
  const remaining = active.filter((n) => n.id !== current.id);

  // 每次按「显著度 / 距离^1.2」吸引下一跳；收尾点若不是唯一剩余，略降前期引力以便自然压轴
  while (remaining.length > 0 && visited.length < 7) {
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const dist = Math.hypot(cand.x - current.x, cand.y - current.y);
      let sal = nodeSaliency(cand, state);
      if (cand.isExit && remaining.length > 1) sal *= 0.58;
      if (cand.isDecoy) sal *= 1.15; // 亮起的空壳假热点特别容易误吸视线
      const score = sal / Math.pow(dist + 0.12, 1.18);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    current = remaining.splice(bestIdx, 1)[0];
    visited.push(current);
  }
  return visited;
}

// 单真源全面评测：使用标准参考幅面 (1000×520) 核算真实外框净距，并可传入实绘幅面
export function evaluate(state, refW = 1000, refH = 520) {
  const nodes = getVisibleNodes(state);
  const activeNodes = nodes.filter((n) => n.tier >= 1);
  const strongNodes = nodes.filter((n) => n.tier === 2);
  const decoyActive = activeNodes.filter((n) => n.isDecoy);
  const valueActive = activeNodes.filter((n) => !n.isDecoy);
  const activeCount = activeNodes.length;
  const strongCount = strongNodes.length;

  // 1. 实测活跃热点之间的最小边界净距
  const unit = Math.min(refW, refH);
  const rects = new Map();
  for (const n of nodes) rects.set(n.id, getNodeRect(n, refW, refH, state.signalMode));

  let minGapPx = Infinity;
  let closestPair = null;
  const crowdedPairs = [];
  for (let i = 0; i < activeNodes.length; i++) {
    for (let j = i + 1; j < activeNodes.length; j++) {
      const a = activeNodes[i];
      const b = activeNodes[j];
      const d = boxDistance(rects.get(a.id), rects.get(b.id));
      if (d < minGapPx) {
        minGapPx = d;
        closestPair = [a, b];
      }
      if (d / unit < 0.068) {
        crowdedPairs.push({ a, b, gapPct: Math.round((d / unit) * 100) });
      }
    }
  }
  const minGapPct = activeNodes.length >= 2 ? Math.round((minGapPx / unit) * 100) : 100;

  // 2. 空间离散度与象限覆盖（检查是否塌缩成单列线性扫描）
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  const quadrants = new Set();
  for (const n of activeNodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
    const q = (n.x >= 0.5 ? 1 : 0) + (n.y >= 0.5 ? 2 : 0);
    quadrants.add(q);
  }
  const spanX = activeCount >= 2 ? maxX - minX : 0;
  const spanY = activeCount >= 2 ? maxY - minY : 0;
  const quadrantCount = quadrants.size;

  // 3. 计算非线性跳跃路径
  const jumpPath = computeJumpPath(nodes, state);
  const entryNode = nodes.find((n) => n.id === state.entryId) || nodes[0];
  const hasExitActive = valueActive.some((n) => n.isExit);

  // 4. 判定 7 类双向错态（按严重度排序）
  const issues = [];
  const tooDim = state.contrast < 30 || state.signalMode === "none" || activeCount === 0;
  const overload = activeCount >= 6 || strongCount >= 3 || (state.contrast > 88 && activeCount >= 5);
  const hollowHit = decoyActive.length > 0;
  const crowded = crowdedPairs.length > 0;
  const linearCollapse = activeCount >= 3 && (spanX < 0.30 || spanY < 0.24 || quadrantCount < 3);
  const weakChannel = state.signalMode === "color";
  const tooSparse = activeCount > 0 && activeCount < 3;
  const noStrongAnchor = activeCount >= 3 && strongCount === 0;

  if (tooDim) {
    issues.push({
      code: "tooDim",
      tag: "平灰隐身",
      title: state.signalMode === "none" ? "关闭了视觉信号，版面退化成平灰文字海" : `信号反差仅 ${state.contrast}%，视线找不到入口`,
      why: "斑点扫描依赖 200 毫秒内的前注意弹出。当所有节点的亮度、形状与字号被压平时，眼睛根本跳不起来，只能退回耗力的逐行盲扫。",
      actionHint: "向右横拖画布把信号反差拉到 50%–82%，并开启「颜色 + 形状 + 留白」复合信号。",
      fixType: "raiseContrast",
      fixLabel: "拉升反差并开复合信号",
    });
  }
  if (hollowHit) {
    issues.push({
      code: "hollowHit",
      tag: `空壳陷阱 ${decoyActive.length} 枚`,
      title: `有 ${decoyActive.length} 枚空壳装饰点抢占强光，读者一跳就扑空`,
      why: "原海报底栏提醒「每个热点都应具备独立的吸引力与价值」。把纯装饰亮球或「震撼」「重磅」这类空话做成强热点，读者被骗过去两回，就会对整页所有热点失去信任。",
      actionHint: "点击画布上带虚红圈的空壳点将其熄灭，或关闭下方「空壳诱饵」开关。",
      fixType: "clearDecoys",
      fixLabel: "清除空壳装饰点",
    });
  }
  if (overload) {
    issues.push({
      code: "overload",
      tag: `过载争宠 · ${activeCount} 亮`,
      title: `同时点亮 ${activeCount} 处（含 ${strongCount} 枚强核），全是重点等于没重点`,
      why: "斑点扫描靠的是「少数亮信号」与「多数暗背景」的信噪比差。当超过 5 处节点或 3 枚强紫核同时高光尖叫，前注意通道瞬间饱和，眼睛在画面里来回打转找不到第一落点。",
      actionHint: "点击画布上多余的节点让它退暗为次级背景，把亮起热点收束到 3–5 枚、强核留 1–2 枚。",
      fixType: "trimOverload",
      fixLabel: "收束为 4–5 枚疏朗热点",
    });
  }
  if (crowded) {
    const pair = crowdedPairs[0];
    const gapText = pair.gapPct <= 0 ? `重叠 ${Math.abs(pair.gapPct)}%` : `仅 ${pair.gapPct}%`;
    issues.push({
      code: "crowded",
      tag: `热区粘连 · ${crowdedPairs.length} 对`,
      title: `「${pair.a.pill}」与「${pair.b.pill}」净距${gapText}，粘成一团难分辨`,
      why: "孤立热点需要周围一圈安静留白充当缓冲区。两枚亮节点贴得过近时，外周视野会把它们糊成一块噪斑，削弱各自作为独立入口的辨识度。",
      actionHint: "直接在画布上拖动贴紧的节点，把任意两枚活跃热点的边界净距拉开到 7% 以上。",
      fixType: "spreadNodes",
      fixLabel: "自动拉开热点呼吸间距",
    });
  }
  if (linearCollapse) {
    issues.push({
      code: "linearCollapse",
      tag: "退化单列",
      title: `热点只覆盖 ${quadrantCount}/4 象限，退化成线性单列扫描`,
      why: "所有热点挤在左缘或同一窄带里，页面又变回「自上而下依次读」的线性结构，失去了斑点扫描多点分散、按兴趣自由跳跃的优势。",
      actionHint: "把其中一两枚热点拖到右侧或对角空白象限，让焦点至少跨 3 个象限分布。",
      fixType: "spreadNodes",
      fixLabel: "分散到多象限星图",
    });
  }
  if (weakChannel) {
    issues.push({
      code: "weakChannel",
      tag: "仅靠单色",
      title: "只靠颜色区分热点，缺形状与留白的双重保险",
      why: "原海报明确写出「用对比、形状、留白建立信号」。如果只改颜色而不拉开轮廓形状与体量，强光屏幕下或色弱读者眼里，节点层级会瞬间塌陷。",
      actionHint: "将信号通道切换为「色 + 形 + 留白」，给每类节点加上独立几何轮廓。",
      fixType: "setCompound",
      fixLabel: "启用色 + 形 + 留白信号",
    });
  }
  if (tooSparse) {
    issues.push({
      code: "tooSparse",
      tag: `热点偏少 · ${activeCount} 枚`,
      title: `目前只亮起 ${activeCount} 处热点，还撑不起自由跳跃网络`,
      why: "只有 1–2 个亮点时，读者没有多余的兴趣分支可以跳转，更像单焦海报而非多点探索的斑点页面。",
      actionHint: "再点亮 1–2 枚有独立信息价值的节点（总数 3–5 枚最佳）。",
      fixType: "posterBalanced",
      fixLabel: "补足至 4 枚平衡热点",
    });
  }
  if (noStrongAnchor) {
    issues.push({
      code: "noStrongAnchor",
      tag: "缺少主核",
      title: "亮起节点全是同等权重，缺少 1 枚破局强信号",
      why: "虽然斑点模式允许从任意点进入，但保留 1–2 枚更高对比的主核（如原海报中央紫圆「强信号」），能帮助漫无目的的读者瞬间抓住第一根抓手。",
      actionHint: "点击任意核心节点切到「强信号（紫核）」层级。",
      fixType: "boostOne",
      fixLabel: "设立 1 枚中央强信号核",
    });
  }

  // 5. 对应原海报底部 5 枚「核心原则」实时体检状态
  const principles = [
    {
      id: "multiEntry",
      title: "多点入口",
      sub: "设置信息入口，降低阅读门槛",
      ok: !tooDim && valueActive.length >= 3 && !hollowHit,
      metric: hollowHit ? `含 ${decoyActive.length} 空壳` : `${valueActive.length} 处真入口`,
    },
    {
      id: "jumpBrowse",
      title: "跳跃浏览",
      sub: "不需线性跟随，按兴趣自由跳转",
      ok: !tooDim && !linearCollapse && jumpPath.length >= 3,
      metric: tooDim ? "视线停滞" : linearCollapse ? "退回单列" : `${jumpPath.length} 跳非线`,
    },
    {
      id: "dispersed",
      title: "焦点分散",
      sub: "信息分布在多个独立节点",
      ok: !crowded && !linearCollapse && !overload && activeCount >= 3,
      metric: crowded ? `净距 ${minGapPct}%` : overload ? `${activeCount} 亮拥挤` : `${quadrantCount}/4 象限`,
    },
    {
      id: "signalBoost",
      title: "信号强化",
      sub: "用对比、形状、留白建立信号",
      ok: !tooDim && !weakChannel && !overload && !noStrongAnchor,
      metric: state.signalMode === "compound" ? `复合 ${state.contrast}%` : state.signalMode === "color" ? "仅色缺形" : "无信号",
    },
    {
      id: "freeRhythm",
      title: "节奏自由",
      sub: "阅读节奏由观者自己掌控",
      ok: !tooDim && !overload && !hollowHit && valueActive.length >= 3 && hasExitActive,
      metric: !hasExitActive && valueActive.length >= 3 ? "缺收尾点" : overload ? "被迫追光" : `从「${entryNode.pill}」起跳`,
    },
  ];

  const passedCount = principles.filter((p) => p.ok).length;
  const isBalanced = issues.length === 0 && passedCount >= 4;

  // 6. 示意档位（绝不使用虚假精确百分比！）
  let grade = "斑点成立";
  let gradeTone = "ok";
  if (tooDim) { grade = "平灰盲区"; gradeTone = "warn"; }
  else if (hollowHit && overload) { grade = "过载失信"; gradeTone = "warn"; }
  else if (overload) { grade = "过载争宠"; gradeTone = "warn"; }
  else if (hollowHit) { grade = "空壳误导"; gradeTone = "warn"; }
  else if (crowded) { grade = "热区粘连"; gradeTone = "warn"; }
  else if (linearCollapse) { grade = "单列退化"; gradeTone = "warn"; }
  else if (issues.length > 0) { grade = "待补信号"; gradeTone = "warn"; }
  else if (!hasExitActive) { grade = "成立·无收束"; gradeTone = "ok"; }

  const primary = issues[0] || {
    code: "ok",
    tag: `${passedCount}/5 · ${grade}`,
    title: `清晰斑点成立：${valueActive.length} 枚独立真热点疏朗分布，从「${entryNode.pill}」自由跃迁`,
    why: hasExitActive
      ? "当前信噪比适中（背景退暗、1–2 枚强核领衔、复合形状加充足留白），且没有空壳假热点。你可以再试着点画布上任意另一枚热点当入口，体验无需固定顺序的自由浏览。"
      : "当前多点跃迁与信噪比已达标；你还可以点亮右下「收尾点」，在读者自由逛完后给一个自然收束的行动出口。",
    actionHint: "已通过当前平衡检定：试试点按其他节点切换起跳入口，或按下方「试错」观察失效边界。",
    fixType: "nextEntry",
    fixLabel: "换个入口再跳一遍",
  };

  // 预计视觉捕获档位（示意）
  const captureTier = tooDim
    ? "慢速逐行搜寻（示意）"
    : overload || crowded
      ? "视线反复折返（示意）"
      : hollowHit
        ? "被空壳劫持（示意）"
        : "前注意瞬时跳捕（示意）";

  return {
    nodes,
    activeNodes,
    valueActive,
    strongNodes,
    decoyActive,
    activeCount,
    strongCount,
    minGapPct,
    closestPair,
    crowdedPairs,
    quadrantCount,
    spanX,
    spanY,
    jumpPath,
    entryNode,
    hasExitActive,
    issues,
    principles,
    passedCount,
    isBalanced,
    grade,
    gradeTone,
    primary,
    captureTier,
  };
}
