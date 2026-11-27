// 094 多重焦点构图 — 单真源几何状态、预设与九类错态双向诊断模型。
// 画布渲染、读数条、紫罗兰诊单与四列实时探针全部读取同一份 evaluate() 结果，零硬编码常量。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 四星漫游",
    shortLabel: "原海报",
    caption: "1:1 转译 094 原海报：A 雪山高反差起点 → B 夜空灯塔转向 → C 六角城影节奏 → D 紫纹细节落脚。",
    nodeNames: {
      A: { title: "视觉焦点 A", sub: "雪山 · 起点", hint: "高对比与独特色彩迅速吸引注意力" },
      B: { title: "视觉焦点 B", sub: "灯塔 · 指向", hint: "形状与方向形成指向性，引导视线移动" },
      C: { title: "视觉焦点 C", sub: "城影 · 节奏", hint: "六边形结构与节奏提供稳定感" },
      D: { title: "视觉焦点 D", sub: "紫纹 · 细读", hint: "细节与纹理吸引深入观察" },
      E: { title: "视觉焦点 E", sub: "星环 · 补位", hint: "次级节点延展边缘节奏" },
      F: { title: "视觉焦点 F", sub: "星尘 · 过载", hint: "过多节点会稀释主次结构" },
    },
  },
  infographic: {
    id: "infographic",
    label: "信息图 · 数据星图",
    shortLabel: "信息图",
    caption: "信息图表实景：核心 KPI 环形图（A）领头，趋势波纹（B）、区域六角矩阵（C）与注脚细节（D）顺轨承接。",
    nodeNames: {
      A: { title: "核心指标 A", sub: "68% 主环", hint: "第一眼锁定核心结论" },
      B: { title: "趋势曲线 B", sub: "12 月波峰", hint: "斜势走向把视线带向拆解区" },
      C: { title: "分项矩阵 C", sub: "六角对比", hint: "几何节奏承接结构化拆解" },
      D: { title: "方法注脚 D", sub: "口径细节", hint: "安静收尾，留给深入读者" },
      E: { title: "补充切片 E", sub: "同比标尺", hint: "辅助参照指标" },
      F: { title: "冗余卡片 F", sub: "信息过载", hint: "卡片过多时整页失去主线" },
    },
  },
  magazine: {
    id: "magazine",
    label: "杂志 · 跨页展板",
    shortLabel: "杂志跨页",
    caption: "杂志跨页实景：大图主视觉（A）吸睛，引语卡片（B）、异形建筑切图（C）与色样图注（D）构建跨页阅读律动。",
    nodeNames: {
      A: { title: "主图视觉 A", sub: "封面雪峰", hint: "面积与反差确立跨页入口" },
      B: { title: "导语摘录 B", sub: "斜体引文", hint: "短句与光束过渡到中段阅读" },
      C: { title: "异形插图 C", sub: "城景切角", hint: "六边形打破版面单调重复" },
      D: { title: "色样图注 D", sub: "纸纹细节", hint: "近景细节平衡对角重量" },
      E: { title: "专栏角标 E", sub: "编者按", hint: "边缘节奏小锚点" },
      F: { title: "浮窗广告 F", sub: "抢戏弹窗", hint: "强焦点过多时版面碎裂" },
    },
  },
};

export const SHAPES = [
  { id: "circle", label: "圆" },
  { id: "hex", label: "六边" },
  { id: "square", label: "方" },
  { id: "diamond", label: "菱" },
];

export const PATH_MODES = [
  { id: "broken", label: "孤岛断链" },
  { id: "ordered", label: "顺轨引导" },
  { id: "loop", label: "回环漫游" },
  { id: "crossed", label: "交叉死结" },
];

const SHAPE_BONUS = { circle: 1.0, hex: 1.1, square: 1.05, diamond: 1.12 };
const IDS = ["A", "B", "C", "D", "E", "F"];
const DEFAULT_BADGES = ["star", "dot", "hex", "square", "ring", "diamond"];

export function cloneNodes(list) {
  return list.map((n) => ({ ...n }));
}

// 开场默认：0/4 复合错态（四王均权 + 左偏塌方 + 真·X交叉死结 + 四同圆扁平；手机端亦留清净隙不意外粘连）
export const PRESETS = {
  brokenStart: {
    label: "复原开场错态",
    pathMode: "crossed",
    nodes: [
      { id: "A", u: 0.19, v: 0.25, size: 0.104, contrast: 0.62, shape: "circle", badge: "star" },
      { id: "B", u: 0.50, v: 0.66, size: 0.103, contrast: 0.60, shape: "circle", badge: "dot" },
      { id: "C", u: 0.50, v: 0.25, size: 0.102, contrast: 0.59, shape: "circle", badge: "hex" },
      { id: "D", u: 0.19, v: 0.66, size: 0.101, contrast: 0.58, shape: "circle", badge: "square" },
    ],
  },
  posterSolution: {
    label: "原海报四星解",
    pathMode: "loop",
    nodes: [
      { id: "A", u: 0.66, v: 0.27, size: 0.156, contrast: 0.96, shape: "circle", badge: "star" },
      { id: "B", u: 0.28, v: 0.43, size: 0.122, contrast: 0.80, shape: "circle", badge: "dot" },
      { id: "C", u: 0.68, v: 0.72, size: 0.114, contrast: 0.74, shape: "hex", badge: "hex" },
      { id: "D", u: 0.27, v: 0.78, size: 0.092, contrast: 0.56, shape: "circle", badge: "square" },
    ],
  },
  triangleSolution: {
    label: "三角主从解",
    pathMode: "loop",
    nodes: [
      { id: "A", u: 0.64, v: 0.31, size: 0.158, contrast: 0.95, shape: "circle", badge: "star" },
      { id: "B", u: 0.27, v: 0.52, size: 0.122, contrast: 0.78, shape: "hex", badge: "dot" },
      { id: "C", u: 0.59, v: 0.75, size: 0.098, contrast: 0.60, shape: "diamond", badge: "hex" },
    ],
  },
  scrollSolution: {
    label: "长卷五焦解",
    pathMode: "ordered",
    nodes: [
      { id: "A", u: 0.21, v: 0.34, size: 0.146, contrast: 0.95, shape: "circle", badge: "star" },
      { id: "B", u: 0.40, v: 0.66, size: 0.118, contrast: 0.80, shape: "hex", badge: "dot" },
      { id: "C", u: 0.58, v: 0.31, size: 0.106, contrast: 0.72, shape: "circle", badge: "hex" },
      { id: "D", u: 0.74, v: 0.68, size: 0.096, contrast: 0.64, shape: "diamond", badge: "square" },
      { id: "E", u: 0.86, v: 0.38, size: 0.080, contrast: 0.52, shape: "circle", badge: "ring" },
    ],
  },
  // 双向试错预设：一键体验 5 种典型失败构图
  errEqual: {
    label: "四王均权",
    pathMode: "ordered",
    nodes: [
      { id: "A", u: 0.66, v: 0.27, size: 0.126, contrast: 0.78, shape: "circle", badge: "star" },
      { id: "B", u: 0.28, v: 0.43, size: 0.124, contrast: 0.77, shape: "circle", badge: "dot" },
      { id: "C", u: 0.68, v: 0.72, size: 0.125, contrast: 0.76, shape: "hex", badge: "hex" },
      { id: "D", u: 0.27, v: 0.77, size: 0.123, contrast: 0.76, shape: "circle", badge: "square" },
    ],
  },
  errSingle: {
    label: "退回单焦",
    pathMode: "ordered",
    nodes: [
      { id: "A", u: 0.52, v: 0.47, size: 0.175, contrast: 1.0, shape: "circle", badge: "star" },
      { id: "B", u: 0.20, v: 0.30, size: 0.060, contrast: 0.38, shape: "circle", badge: "dot" },
      { id: "C", u: 0.80, v: 0.72, size: 0.058, contrast: 0.36, shape: "hex", badge: "hex" },
      { id: "D", u: 0.24, v: 0.76, size: 0.056, contrast: 0.35, shape: "circle", badge: "square" },
    ],
  },
  errTilt: {
    label: "左偏塌方",
    pathMode: "ordered",
    nodes: [
      { id: "A", u: 0.23, v: 0.28, size: 0.152, contrast: 0.95, shape: "circle", badge: "star" },
      { id: "B", u: 0.42, v: 0.45, size: 0.120, contrast: 0.78, shape: "hex", badge: "dot" },
      { id: "C", u: 0.24, v: 0.69, size: 0.106, contrast: 0.70, shape: "circle", badge: "hex" },
      { id: "D", u: 0.44, v: 0.79, size: 0.088, contrast: 0.55, shape: "circle", badge: "square" },
    ],
  },
  errCross: {
    label: "路径死结",
    pathMode: "crossed",
    nodes: [
      { id: "A", u: 0.67, v: 0.27, size: 0.154, contrast: 0.95, shape: "circle", badge: "star" },
      { id: "B", u: 0.28, v: 0.41, size: 0.122, contrast: 0.80, shape: "circle", badge: "dot" },
      { id: "C", u: 0.68, v: 0.74, size: 0.112, contrast: 0.72, shape: "hex", badge: "hex" },
      { id: "D", u: 0.28, v: 0.78, size: 0.092, contrast: 0.56, shape: "circle", badge: "square" },
    ],
  },
  errOverload: {
    label: "六焦过载",
    pathMode: "ordered",
    nodes: [
      { id: "A", u: 0.22, v: 0.27, size: 0.132, contrast: 0.92, shape: "circle", badge: "star" },
      { id: "B", u: 0.50, v: 0.25, size: 0.128, contrast: 0.88, shape: "hex", badge: "dot" },
      { id: "C", u: 0.78, v: 0.28, size: 0.124, contrast: 0.86, shape: "diamond", badge: "hex" },
      { id: "D", u: 0.23, v: 0.72, size: 0.122, contrast: 0.84, shape: "square", badge: "square" },
      { id: "E", u: 0.51, v: 0.74, size: 0.120, contrast: 0.82, shape: "circle", badge: "ring" },
      { id: "F", u: 0.79, v: 0.71, size: 0.118, contrast: 0.80, shape: "hex", badge: "diamond" },
    ],
  },
};

export function createInitialState() {
  return {
    scenario: "poster",
    nodes: cloneNodes(PRESETS.brokenStart.nodes),
    selected: 0,
    pathMode: PRESETS.brokenStart.pathMode,
    showGuides: true,
    scanActive: false,
    scanProgress: 0,
    sweepPhase: 0,
  };
}

export function applyPreset(state, key) {
  const p = PRESETS[key];
  if (!p) return;
  state.nodes = cloneNodes(p.nodes);
  state.pathMode = p.pathMode;
  state.selected = Math.min(state.selected, state.nodes.length - 1);
  state.sweepPhase = 0;
}

export function setFocalCount(state, count) {
  const target = Math.max(2, Math.min(6, Math.round(count)));
  while (state.nodes.length > target) state.nodes.pop();
  const spawnSlots = [
    { u: 0.66, v: 0.27, size: 0.152, contrast: 0.95, shape: "circle" },
    { u: 0.28, v: 0.43, size: 0.122, contrast: 0.80, shape: "circle" },
    { u: 0.68, v: 0.72, size: 0.112, contrast: 0.72, shape: "hex" },
    { u: 0.27, v: 0.78, size: 0.092, contrast: 0.56, shape: "circle" },
    { u: 0.84, v: 0.44, size: 0.088, contrast: 0.62, shape: "diamond" },
    { u: 0.50, v: 0.82, size: 0.112, contrast: 0.80, shape: "square" },
  ];
  while (state.nodes.length < target) {
    const idx = state.nodes.length;
    const slot = spawnSlots[idx] || { u: 0.5, v: 0.5, size: 0.1, contrast: 0.7, shape: "circle" };
    state.nodes.push({
      id: IDS[idx],
      u: slot.u,
      v: slot.v,
      size: slot.size,
      contrast: slot.contrast,
      shape: slot.shape,
      badge: DEFAULT_BADGES[idx] || "dot",
    });
  }
  state.selected = Math.min(state.selected, state.nodes.length - 1);
}

// 2D 严格线段相交测试（用于单真源检测路径交叉死结）
function orient(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentIntersection(p1, p2, p3, p4) {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  if (((d1 > 1e-5 && d2 < -1e-5) || (d1 < -1e-5 && d2 > 1e-5)) &&
      ((d3 > 1e-5 && d4 < -1e-5) || (d3 < -1e-5 && d4 > 1e-5))) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 1e-6) return null;
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  }
  return null;
}

export function buildRouteIndices(count, pathMode, pts = null) {
  if (pathMode === "broken" || count < 2) return [];
  if (pathMode === "crossed") {
    if (count === 4 && pts && pts.length === 4) {
      // 自动挑选让当前 4 个点真正产生 2D 交叉死结的连线序
      const candidates = [
        [0, 1, 2, 3],
        [0, 3, 1, 2],
        [0, 2, 1, 3],
        [0, 2, 3, 1],
      ];
      for (const cand of candidates) {
        if (segmentIntersection(pts[cand[0]], pts[cand[1]], pts[cand[2]], pts[cand[3]])) return cand;
      }
      return [0, 3, 1, 2];
    }
    if (count === 4) return [0, 1, 2, 3];
    if (count === 5) return [0, 3, 1, 4, 2];
    if (count === 6) return [0, 4, 1, 5, 2, 3];
    if (count === 3) return [0, 2, 1];
    return [0, 1];
  }
  const seq = Array.from({ length: count }, (_, i) => i);
  if (pathMode === "loop" && count >= 3) seq.push(0);
  return seq;
}

// 核心单真源评估函数：一切 UI 文案、徽章、支点坐标与扫描轨迹均由此派生
export function evaluate(state, aspect = 1.65) {
  const nodes = state.nodes;
  const n = nodes.length;
  const effAspect = Math.max(0.85, Math.min(2.3, aspect || 1.65));

  // 1. 视觉重量：面积 × 明暗反差 × 异形显著度
  const weights = nodes.map((nd) => {
    const areaFactor = (nd.size / 0.10) ** 2;
    const contrastFactor = 0.42 + 0.98 * nd.contrast;
    const shapeFactor = SHAPE_BONUS[nd.shape] || 1.0;
    return areaFactor * contrastFactor * shapeFactor;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const shares = weights.map((w) => w / totalWeight);

  const ranked = nodes
    .map((nd, idx) => ({ idx, id: nd.id, weight: weights[idx], share: shares[idx], size: nd.size, contrast: nd.contrast }))
    .sort((a, b) => b.weight - a.weight);

  const top = ranked[0];
  const second = ranked[1] || ranked[0];
  const last = ranked[ranked.length - 1];
  const ladderRatio = second.weight > 0 ? top.weight / second.weight : 1;
  const spanRatio = last.weight > 0 ? top.weight / last.weight : 1;
  const topShare = top.share;

  // 2. 总面积占比（归一化到宽×高平面）
  const areaCoverage = nodes.reduce((sum, nd) => sum + (Math.PI * nd.size * nd.size) / effAspect, 0);

  // 3. 真实物理重心（Visual Fulcrum）
  let gu = 0;
  let gv = 0;
  for (let i = 0; i < n; i++) {
    gu += nodes[i].u * weights[i];
    gv += nodes[i].v * weights[i];
  }
  gu /= totalWeight;
  gv /= totalWeight;
  const fulcrumOffset = Math.hypot((gu - 0.5) * 1.15, gv - 0.5); // 距离画幅中心的百分比偏移
  const fulcrumDir =
    Math.abs(gu - 0.5) < 0.04 && Math.abs(gv - 0.5) < 0.04
      ? "居中"
      : `${gu < 0.46 ? "偏左" : gu > 0.54 ? "偏右" : ""}${gv < 0.46 ? "偏上" : gv > 0.54 ? "偏下" : ""}` || "微偏";

  // 4. 真实碰撞重叠 & 边缘裁切检出（在统一等比坐标系下，单位为画布短边 = 1）
  const shortScaleX = effAspect >= 1 ? effAspect : 1;
  const shortScaleY = effAspect >= 1 ? 1 : 1 / effAspect;
  const pts = nodes.map((nd) => ({ x: nd.u * shortScaleX, y: nd.v * shortScaleY, r: nd.size }));

  const overlaps = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      const minGap = pts[i].r + pts[j].r + 0.025;
      if (dist < minGap) {
        overlaps.push({ a: i, b: j, ids: `${nodes[i].id}·${nodes[j].id}`, gap: dist - (pts[i].r + pts[j].r) });
      }
    }
  }

  const edgeClips = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const margin = 0.025;
    if (p.x - p.r < margin || p.x + p.r > shortScaleX - margin || p.y - p.r < margin || p.y + p.r > shortScaleY - margin) {
      edgeClips.push({ idx: i, id: nodes[i].id });
    }
  }

  // 5. 路径序列与真实二维线段相交检测
  const route = buildRouteIndices(n, state.pathMode, pts);
  const segments = [];
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];
    segments.push({
      from,
      to,
      p1: pts[from],
      p2: pts[to],
      len: Math.hypot(pts[from].x - pts[to].x, pts[from].y - pts[to].y),
    });
  }

  const crossings = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i];
      const s2 = segments[j];
      // 回环模式里最后一条从外圈轻轻兜回的柔弧不按直线折算交叉
      if (state.pathMode === "loop" && (i === segments.length - 1 || j === segments.length - 1)) continue;
      // 共享端点的相邻边不算交叉
      if (s1.from === s2.from || s1.from === s2.to || s1.to === s2.from || s1.to === s2.to) continue;
      const hit = segmentIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
      if (hit) {
        crossings.push({
          s1: i,
          s2: j,
          u: hit.x / shortScaleX,
          v: hit.y / shortScaleY,
        });
      }
    }
  }

  const maxHop = segments.reduce((m, s) => Math.max(m, s.len), 0);
  const diag = Math.hypot(shortScaleX, shortScaleY);
  const maxHopNorm = diag > 0 ? maxHop / diag : 0;

  // 6. 形态与对比反差
  const uniqueShapes = new Set(nodes.map((nd) => nd.shape)).size;
  const maxC = Math.max(...nodes.map((nd) => nd.contrast));
  const minC = Math.min(...nodes.map((nd) => nd.contrast));
  const contrastSpread = maxC - minC;
  const maxR = Math.max(...nodes.map((nd) => nd.size));
  const minR = Math.min(...nodes.map((nd) => nd.size));
  const sizeRatio = minR > 0 ? maxR / minR : 1;

  // 7. 九类双向错态判定
  const errors = [];
  if (n > 5 || areaCoverage > 0.46) {
    errors.push({
      code: "OVER_CROWDED",
      tag: `${n} 焦过载`,
      title: `画面塞入 ${n} 个强焦点（占面 ${Math.round(areaCoverage * 100)}%），版面退化成噪点墙`,
      reason: "多重焦点不是越多越好。当超过 5 个强吸引点同时喊叫、留白被挤干时，人眼失去停顿与呼吸，整幅画反而像失焦的拼贴。",
      action: "把焦点数减到 3–5 枚（或缩小次级焦点尺寸），留出连接路径所需的暗空留白。",
    });
  }
  if (overlaps.length > 0) {
    errors.push({
      code: "NODE_OVERLAP",
      tag: `粘连 ${overlaps.length} 处`,
      title: `焦点 ${overlaps[0].ids} 外环互相粘连挤压，独立身份被吞噬`,
      reason: "原海报「核心要点」强调焦点之间必须「既各自独立，又相互关联」。两个焦块贴死或叠压时，大脑会误判为一个畸形大块。",
      action: `直接拖开 ${overlaps[0].ids} 焦点，让两枚外圈虚线环之间留出呼吸净隙。`,
    });
  }
  if (topShare > 0.56) {
    errors.push({
      code: "SINGLE_TYRANT",
      tag: `单焦垄断 ${Math.round(topShare * 100)}%`,
      title: `焦点 ${top.id} 独占 ${Math.round(topShare * 100)}% 视觉重量，已退回「单一焦点构图」`,
      reason: "当一个巨型焦点吃掉过半重量、其余节点灰暗缩小时，观众看完主角就想离开，不再沿着路径继续探索（那属于 093 单一焦点构图）。",
      action: `适当收小焦点 ${top.id}，同时把次级焦点 ${second.id} 的尺寸或明暗对比提上来。`,
    });
  }
  if (ladderRatio < 1.24 || (n >= 3 && spanRatio < 1.58)) {
    errors.push({
      code: "EQUAL_FIGHT",
      tag: `均权 ${ladderRatio.toFixed(2)}×`,
      title: `多个焦点几乎等重（主次比仅 ${ladderRatio.toFixed(2)}×），观众不知从哪看起`,
      reason: "四个差不多大、差不多亮的焦点同时争夺第一眼，会引发来回抽搐的跳视疲劳——这是多焦点构图最常踩的「四王争霸」坑。",
      action: `选中焦点 ${top.id} 调大尺寸与对比做领头起点，再压轻末级焦点 ${last.id}，把主次比拉开到 1.35× 以上。`,
    });
  }
  if (state.pathMode === "broken") {
    errors.push({
      code: "PATH_BROKEN",
      tag: "孤岛断链",
      title: "焦点之间没有视觉路径牵引，沦为四座互不搭理的孤岛",
      reason: "没有方向弧线、视线暗示或疏密节奏做桥接时，观众看完一个点只能凭运气乱跳，容易漏掉次要信息。",
      action: "把路径模式切到「顺轨引导」或「回环漫游」，为焦点接上弯曲虚线与方向箭头。",
    });
  }
  if (crossings.length > 0) {
    errors.push({
      code: "PATH_CROSS",
      tag: `路径交叉 ${crossings.length} 处`,
      title: `引导路径在画布中段交叉打结（${crossings.length} 处），视线被迫折返打架`,
      reason: "当引导线像打结的绳子一样横穿彼此，眼睛刚建立的方向惯性在交点处瞬间卡顿，阅读秩序立刻瓦解。",
      action: "把路径切回「顺轨引导 / 回环漫游」，或直接拖动交错的焦点，把路径理顺成不交叉的流畅弧线。",
    });
  }
  if (fulcrumOffset > 0.135) {
    errors.push({
      code: "FULCRUM_TILT",
      tag: `重心${fulcrumDir} ${Math.round(fulcrumOffset * 100)}%`,
      title: `视觉重心${fulcrumDir}偏移 ${Math.round(fulcrumOffset * 100)}%，另一侧大片塌空`,
      reason: "阿恩海姆指出，多中心画面靠围绕隐形支点的力矩互衡。此刻重量扎堆在同一侧，中央平衡球被拉偏，整张画随时要倾翻。",
      action: `把靠得太近的焦点拖向画布空阔的另一侧（或在中心星场横拖扫动星轨），把平衡球拉回中央安全环内。`,
    });
  }
  if (edgeClips.length > 0) {
    errors.push({
      code: "EDGE_CLIP",
      tag: `挤边 ${edgeClips[0].id}`,
      title: `焦点 ${edgeClips[0].id} 贴死画框边缘，视线容易被直接吸出画外`,
      reason: "多重焦点要让视线留在画框内循环游览。一旦焦点外环顶到画框，边缘张力会把注意力扯离画面。",
      action: `把贴边的焦点 ${edgeClips[0].id} 往画布内侧轻轻拖回一些。`,
    });
  }
  if (uniqueShapes < 2 && contrastSpread < 0.24) {
    errors.push({
      code: "FLAT_CONTRAST",
      tag: "造型对比扁平",
      title: `全部焦点同为「${SHAPES.find((s) => s.id === nodes[0].shape)?.label || "圆"}」且明暗跨度仅 ${Math.round(contrastSpread * 100)}%`,
      reason: "094 原海报特意在三个圆中嵌进一个六边形（焦点 C）并拉开明暗差，就是为了避免单调重复；造型和明暗全同会让节点面目模糊。",
      action: "选中任意次级焦点把形状切成「六边」或「菱」，或拉大主焦与末焦的对比度差。",
    });
  }

  // 8. 对应原海报底栏四列实时探针的通过状态
  const pillars = {
    distribution: {
      ok: n >= 2 && n <= 5 && areaCoverage <= 0.46 && topShare <= 0.56 && ladderRatio >= 1.24 && (n < 3 || spanRatio >= 1.58),
      badge: n > 5 || areaCoverage > 0.46
        ? `${n} 焦过载`
        : topShare > 0.56
          ? `单焦 ${Math.round(topShare * 100)}%`
          : ladderRatio < 1.24
            ? `均权 ${ladderRatio.toFixed(2)}×`
            : `主次 ${ladderRatio.toFixed(2)}×`,
    },
    pathway: {
      ok: state.pathMode !== "broken" && crossings.length === 0 && maxHopNorm <= 0.88,
      badge: state.pathMode === "broken"
        ? "孤岛断链"
        : crossings.length > 0
          ? `交叉 ${crossings.length} 处`
          : state.pathMode === "loop"
            ? "回环顺畅"
            : "顺轨贯通",
    },
    contrast: {
      ok: (uniqueShapes >= 2 || contrastSpread >= 0.24) && sizeRatio >= 1.24,
      badge: uniqueShapes < 2 && contrastSpread < 0.24
        ? "同形扁平"
        : sizeRatio < 1.24
          ? `尺比 ${sizeRatio.toFixed(2)}×`
          : `${uniqueShapes} 形 · 差 ${Math.round(contrastSpread * 100)}%`,
    },
    balance: {
      ok: fulcrumOffset <= 0.135 && overlaps.length === 0 && edgeClips.length === 0,
      badge: overlaps.length > 0
        ? `粘连 ${overlaps.length} 处`
        : edgeClips.length > 0
          ? `挤边 ${edgeClips[0].id}`
          : fulcrumOffset > 0.135
            ? `${fulcrumDir} ${Math.round(fulcrumOffset * 100)}%`
            : `偏移 ${Math.round(fulcrumOffset * 100)}%`,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;
  const allPass = passCount === 4 && errors.length === 0;

  let diagnosis;
  if (allPass) {
    diagnosis = {
      code: "BALANCED",
      ok: true,
      badge: "4/4 · 星图成立",
      tier: "张力档位：有序漫游（示意）",
      title: `主焦 ${top.id} 领头（${ladderRatio.toFixed(2)}×），重心偏移仅 ${Math.round(fulcrumOffset * 100)}%`,
      reason: `四个维度全部过关：视觉重量在 ${n} 枚焦点间拉出清晰梯阶，${uniqueShapes} 种形态与明暗差制造节奏，非交叉路径把视线顺滑带过整幅星图，中央支点球稳稳落在平衡环内。`,
      action: "按 Space 放飞视线巡航验真；也可以试着点下方「双向试错」或手动把焦点拖乱，观察读数如何第一时间揪出毛病。",
    };
  } else {
    const primary = errors[0] || {
      code: "IMBALANCE",
      tag: "待微调",
      title: "仍有细节未对齐，请按探针红标逐项微调",
      reason: "多重焦点需要权重、路径、对比与平衡四项同时成立。",
      action: "参考下方四列实时探针中的红色提示逐项修正。",
    };
    const tier =
      passCount === 0
        ? "张力档位：秩序瓦解（示意）"
        : passCount === 1
          ? "张力档位：局部松散（示意）"
          : passCount === 2
            ? "张力档位：半程拉扯（示意）"
            : "张力档位：临门一脚（示意）";
    diagnosis = {
      code: primary.code,
      ok: false,
      badge: `${passCount}/4 · ${primary.tag}`,
      tier,
      title: primary.title,
      reason: primary.reason,
      action: primary.action,
    };
  }

  // 9. 基于单真源算出的真实扫描路径（按视觉重量入口 + 拓扑走势，失败态展现真实迷路/抽搐）
  let scanOrder;
  if (diagnosis.code === "EQUAL_FIGHT") {
    // 四王均权：眼动在前两枚强竞争者间反复来回抽搐
    scanOrder = [ranked[0].idx, ranked[1].idx, ranked[0].idx, ranked[2]?.idx ?? ranked[1].idx, ranked[1].idx];
  } else if (diagnosis.code === "SINGLE_TYRANT") {
    // 退回单焦：视线死锁在主焦上几乎不走远
    scanOrder = [top.idx, top.idx, second.idx, top.idx];
  } else if (route.length >= 2) {
    // 从最重焦点切入路径
    const startPos = route.indexOf(top.idx);
    if (startPos > 0 && state.pathMode === "loop") {
      const base = route.slice(0, -1);
      scanOrder = [...base.slice(startPos), ...base.slice(0, startPos), top.idx];
    } else {
      scanOrder = [...route];
    }
  } else {
    scanOrder = ranked.map((r) => r.idx);
  }

  return {
    count: n,
    weights,
    shares,
    ranked,
    top,
    second,
    last,
    ladderRatio,
    spanRatio,
    topShare,
    areaCoverage,
    fulcrum: { u: gu, v: gv, offset: fulcrumOffset, dir: fulcrumDir },
    overlaps,
    edgeClips,
    route,
    segments,
    crossings,
    uniqueShapes,
    contrastSpread,
    sizeRatio,
    pillars,
    passCount,
    allPass,
    errors,
    diagnosis,
    scanOrder,
  };
}
