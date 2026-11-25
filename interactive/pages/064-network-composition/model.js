// 064 网络构图 — 单一真源数据与拓扑几何分析引擎
// 所有节点坐标以画布归一化比例 u∈[0,1], v∈[0,1] 存储；
// 实绘像素坐标、线段交点、连通分量、去中心化存活率、外环闭环、体量级差全部由此同算。

export const THEMES = {
  poster: {
    label: "原海报生态",
    coreTitle: ["网络", "构图"],
    coreEn: "NETWORK COMPOSITION",
    nodes: {
      source:   { label: "信息源", sub: "数据/内容/观点" },
      user:     { label: "用户",   sub: "接收/参与/反馈" },
      platform: { label: "平台",   sub: "发布/交互/支撑" },
      feedback: { label: "反馈",   sub: "评价/优化/迭代" },
      data:     { label: "数据",   sub: "采集/分析/洞察" },
      channel:  { label: "渠道",   sub: "传播/分发/扩散" },
      content:  { label: "内容",   sub: "结构化/可读/价值" },
    },
  },
  metro: {
    label: "地铁换乘网",
    coreTitle: ["环线", "枢纽"],
    coreEn: "TRANSIT NETWORK",
    nodes: {
      source:   { label: "北客站", sub: "高铁/城际/换乘" },
      user:     { label: "金融街", sub: "办公/高峰/集散" },
      platform: { label: "东环站", sub: "三线/接驳/过街" },
      feedback: { label: "空港线", sub: "航站/快轨/返程" },
      data:     { label: "南枢纽", sub: "客流/调度/缓冲" },
      channel:  { label: "大学城", sub: "通勤/支线/潮汐" },
      content:  { label: "老城区", sub: "商圈/慢行/接驳" },
    },
  },
  collab: {
    label: "协作知识图",
    coreTitle: ["开源", "生态"],
    coreEn: "OPEN COLLABORATION",
    nodes: {
      source:   { label: "提案库", sub: "议题/草案/评审" },
      user:     { label: "开发者", sub: "提交/复核/维护" },
      platform: { label: "代码仓", sub: "分支/合并/发布" },
      feedback: { label: "复盘池", sub: "缺陷/回归/迭代" },
      data:     { label: "指标库", sub: "测试/基准/追踪" },
      channel:  { label: "社区网", sub: "文档/镜像/传播" },
      content:  { label: "规范集", sub: "协议/样例/共识" },
    },
  },
};

export const NODE_DEFS = [
  { id: "core",     role: "core",    fixed: true,  posterPos: { u: 0.50, v: 0.50 } },
  { id: "source",   role: "key",     fixed: false, posterPos: { u: 0.26, v: 0.16 }, perfTarget: true },
  { id: "user",     role: "core",    fixed: false, posterPos: { u: 0.64, v: 0.14 } },
  { id: "platform", role: "key",     fixed: false, posterPos: { u: 0.86, v: 0.39 } },
  { id: "feedback", role: "key",     fixed: false, posterPos: { u: 0.78, v: 0.78 } },
  { id: "data",     role: "support", fixed: false, posterPos: { u: 0.50, v: 0.90 } },
  { id: "channel",  role: "core",    fixed: false, posterPos: { u: 0.22, v: 0.79 } },
  { id: "content",  role: "support", fixed: false, posterPos: { u: 0.13, v: 0.47 } },
];

export const SATELLITE_IDS = NODE_DEFS.filter((n) => !n.fixed).map((n) => n.id);

// 基准拓扑与四种典型错态（开场停在 0/4 翻车错态）
export const PRESETS = {
  broken: {
    name: "乱叉孤岛",
    positions: {
      core:     { u: 0.50, v: 0.50 },
      source:   { u: 0.62, v: 0.17 }, // 与 user 左右交错，居中偏右便于触控与 perf 横拖
      user:     { u: 0.27, v: 0.18 },
      platform: { u: 0.80, v: 0.77 }, // 与 feedback 上下交叉
      feedback: { u: 0.86, v: 0.34 },
      data:     { u: 0.50, v: 0.85 }, // 孤岛：0 条连线
      channel:  { u: 0.22, v: 0.78 },
      content:  { u: 0.14, v: 0.48 },
    },
    edges: [
      { a: "core", b: "source", kind: "solid" },
      { a: "core", b: "user", kind: "solid" },
      { a: "core", b: "platform", kind: "solid" },
      { a: "core", b: "feedback", kind: "solid" },
      { a: "core", b: "channel", kind: "solid" },
      { a: "core", b: "content", kind: "solid" },
      { a: "content", b: "source", kind: "solid" },   // 开放白地里与 core-user 清晰交叉
      { a: "user", b: "feedback", kind: "solid" },    // 开放白地里与 core-source、content-source 清晰交叉
      { a: "source", b: "platform", kind: "solid" },  // 开放白地里与 core-feedback、user-feedback 清晰交叉
    ],
    scaleMode: "flat",
    flowOn: true,
    hubOutage: false,
  },
  star: {
    name: "中心星形",
    positions: {
      core:     { u: 0.50, v: 0.50 },
      source:   { u: 0.26, v: 0.16 },
      user:     { u: 0.64, v: 0.14 },
      platform: { u: 0.86, v: 0.39 },
      feedback: { u: 0.78, v: 0.78 },
      data:     { u: 0.50, v: 0.90 },
      channel:  { u: 0.22, v: 0.79 },
      content:  { u: 0.13, v: 0.47 },
    },
    edges: [
      { a: "core", b: "source", kind: "solid" },
      { a: "core", b: "user", kind: "solid" },
      { a: "core", b: "platform", kind: "solid" },
      { a: "core", b: "feedback", kind: "dashed" },
      { a: "core", b: "data", kind: "dashed" },
      { a: "core", b: "channel", kind: "solid" },
      { a: "core", b: "content", kind: "dashed" },
    ],
    scaleMode: "tiered",
    flowOn: true,
    hubOutage: true,
  },
  hairball: {
    name: "铁丝网过载",
    positions: {
      core:     { u: 0.50, v: 0.50 },
      source:   { u: 0.26, v: 0.16 },
      user:     { u: 0.64, v: 0.14 },
      platform: { u: 0.86, v: 0.39 },
      feedback: { u: 0.78, v: 0.78 },
      data:     { u: 0.50, v: 0.90 },
      channel:  { u: 0.22, v: 0.79 },
      content:  { u: 0.13, v: 0.47 },
    },
    edges: [
      { a: "core", b: "source", kind: "solid" },
      { a: "core", b: "user", kind: "solid" },
      { a: "core", b: "platform", kind: "solid" },
      { a: "core", b: "feedback", kind: "solid" },
      { a: "core", b: "data", kind: "solid" },
      { a: "core", b: "channel", kind: "solid" },
      { a: "core", b: "content", kind: "solid" },
      { a: "source", b: "user", kind: "solid" },
      { a: "user", b: "platform", kind: "solid" },
      { a: "platform", b: "feedback", kind: "solid" },
      { a: "feedback", b: "data", kind: "solid" },
      { a: "data", b: "channel", kind: "solid" },
      { a: "channel", b: "content", kind: "solid" },
      { a: "content", b: "source", kind: "solid" },
      { a: "source", b: "feedback", kind: "solid" },
      { a: "user", b: "channel", kind: "solid" },
      { a: "platform", b: "content", kind: "solid" },
      { a: "source", b: "platform", kind: "solid" },
      { a: "user", b: "data", kind: "solid" },
    ],
    scaleMode: "flat",
    flowOn: true,
    hubOutage: false,
  },
  inverted: {
    name: "体量倒挂",
    positions: {
      core:     { u: 0.50, v: 0.50 },
      source:   { u: 0.26, v: 0.16 },
      user:     { u: 0.64, v: 0.14 },
      platform: { u: 0.86, v: 0.39 },
      feedback: { u: 0.78, v: 0.78 },
      data:     { u: 0.50, v: 0.90 },
      channel:  { u: 0.22, v: 0.79 },
      content:  { u: 0.13, v: 0.47 },
    },
    edges: [
      { a: "core", b: "source", kind: "solid" },
      { a: "core", b: "user", kind: "solid" },
      { a: "core", b: "platform", kind: "solid" },
      { a: "core", b: "feedback", kind: "dashed" },
      { a: "core", b: "data", kind: "dashed" },
      { a: "core", b: "channel", kind: "solid" },
      { a: "core", b: "content", kind: "solid" },
      { a: "source", b: "user", kind: "dashed" },
      { a: "user", b: "platform", kind: "dashed" },
      { a: "platform", b: "feedback", kind: "solid" },
      { a: "feedback", b: "data", kind: "dashed" },
      { a: "data", b: "channel", kind: "solid" },
      { a: "channel", b: "content", kind: "dashed" },
      { a: "content", b: "source", kind: "dashed" },
    ],
    scaleMode: "inverted",
    flowOn: true,
    hubOutage: false,
  },
};

export function createInitialState() {
  const p = PRESETS.broken;
  return {
    theme: "poster",
    positions: Object.fromEntries(Object.entries(p.positions).map(([k, v]) => [k, { ...v }])),
    edges: p.edges.map((e) => ({ ...e })),
    scaleMode: p.scaleMode,       // "flat" | "inverted" | "tiered"
    brush: "dashed",              // "solid" | "dashed" | "cut"
    flowOn: p.flowOn,
    hubOutage: p.hubOutage,
    selectedNode: null,
    activePreset: "broken",
    pulseBoost: 0,
  };
}

export function applyPreset(state, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  state.positions = Object.fromEntries(Object.entries(p.positions).map(([k, v]) => [k, { ...v }]));
  state.edges = p.edges.map((e) => ({ ...e }));
  state.scaleMode = p.scaleMode;
  state.flowOn = p.flowOn;
  state.hubOutage = p.hubOutage;
  state.selectedNode = null;
  state.activePreset = presetKey;
}

export function edgeKey(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

export function findEdgeIndex(edges, a, b) {
  const k = edgeKey(a, b);
  return edges.findIndex((e) => edgeKey(e.a, e.b) === k);
}

export function toggleEdgeByBrush(state, a, b) {
  if (a === b) return "none";
  const idx = findEdgeIndex(state.edges, a, b);
  state.activePreset = "custom";
  if (state.brush === "cut") {
    if (idx >= 0) {
      state.edges.splice(idx, 1);
      return "removed";
    }
    return "none";
  }
  if (idx >= 0) {
    if (state.edges[idx].kind === state.brush) {
      state.edges.splice(idx, 1);
      return "removed";
    }
    state.edges[idx].kind = state.brush;
    return "updated";
  }
  state.edges.push({ a, b, kind: state.brush });
  return "added";
}

export function cycleEdgeKind(state, idx) {
  if (idx < 0 || idx >= state.edges.length) return "none";
  state.activePreset = "custom";
  const cur = state.edges[idx].kind;
  if (cur === "solid") {
    state.edges[idx].kind = "dashed";
    return "dashed";
  }
  if (cur === "dashed") {
    state.edges.splice(idx, 1);
    return "removed";
  }
  state.edges[idx].kind = "solid";
  return "solid";
}

// 依据当前画布像素宽高、节点角色与体量模式，算出等比正圆半径与实绘坐标
export function computeLayout(state, width, height) {
  const minDim = Math.min(width, height);
  const compact = width < 520;
  // 中心圆半径与卫星基准半径严格按短边等比缩放，保证所有圆都是正圆且与底节点留有充裕净隙
  const coreBase = Math.max(compact ? 46 : 64, Math.min(compact ? 60 : 80, minDim * (compact ? 0.158 : 0.175)));
  const satBase = Math.max(compact ? 25 : 32, Math.min(compact ? 35 : 44, minDim * (compact ? 0.088 : 0.098)));

  // 统计每个节点的度
  const degrees = Object.fromEntries(NODE_DEFS.map((n) => [n.id, 0]));
  for (const e of state.edges) {
    if (degrees[e.a] !== undefined) degrees[e.a]++;
    if (degrees[e.b] !== undefined) degrees[e.b]++;
  }

  const padX = compact ? Math.max(36, satBase + 10) : Math.max(58, satBase + 16);
  const padY = compact ? Math.max(34, satBase + 8) : Math.max(44, satBase + 8);

  const nodes = NODE_DEFS.map((def) => {
    const pos = state.positions[def.id] || def.posterPos;
    let r;
    if (def.fixed) {
      r = state.scaleMode === "flat" ? satBase * 1.16 : state.scaleMode === "inverted" ? satBase * 0.98 : coreBase;
    } else if (state.scaleMode === "flat") {
      r = satBase * 0.96;
    } else if (state.scaleMode === "inverted") {
      // 倒挂：支持节点变巨大、核心与关键节点缩瘪
      r = def.role === "support" ? satBase * 1.32 : def.role === "key" ? satBase * 0.78 : satBase * 0.74;
    } else {
      // 三级体量差：贴合 064 原海报（核心/关键圆饱满、支持圆克制，并随度数略增强）
      const degBoost = Math.min(4, Math.max(0, degrees[def.id] - 2)) * 1.1;
      r = def.role === "support" ? satBase * 0.85 : def.role === "key" ? satBase * 1.07 + degBoost : satBase * 1.0 + degBoost;
    }

    const x = padX + pos.u * (width - padX * 2);
    const y = padY + pos.v * (height - padY * 2);
    return {
      ...def,
      u: pos.u,
      v: pos.v,
      x,
      y,
      r,
      degree: degrees[def.id],
    };
  });

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return { nodes, byId, padX, padY, coreBase, satBase };
}

// 精确线段相交检测（不含共享端点）
function orient(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

export function segmentIntersection(a, b, c, d) {
  const o1 = orient(a.x, a.y, b.x, b.y, c.x, c.y);
  const o2 = orient(a.x, a.y, b.x, b.y, d.x, d.y);
  const o3 = orient(c.x, c.y, d.x, d.y, a.x, a.y);
  const o4 = orient(c.x, c.y, d.x, d.y, b.x, b.y);
  const eps = 1e-4;
  if (((o1 > eps && o2 < -eps) || (o1 < -eps && o2 > eps)) && ((o3 > eps && o4 < -eps) || (o3 < -eps && o4 > eps))) {
    const denom = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (Math.abs(denom) < 1e-6) return null;
    const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denom;
    return {
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y),
    };
  }
  return null;
}

function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// BFS 连通分量分析
function analyzeComponents(nodeIds, edges) {
  const adj = Object.fromEntries(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (adj[e.a] && adj[e.b]) {
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
  }
  const visited = new Set();
  const components = [];
  for (const id of nodeIds) {
    if (visited.has(id)) continue;
    const comp = [];
    const q = [id];
    visited.add(id);
    while (q.length) {
      const cur = q.shift();
      comp.push(cur);
      for (const nxt of adj[cur]) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          q.push(nxt);
        }
      }
    }
    components.push(comp);
  }
  return { adj, components };
}

// 检测外围子图是否存在长度 ≥ 3 的闭环（反馈回路）
function detectCycle(nodeIds, edges) {
  const adj = Object.fromEntries(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (adj[e.a] && adj[e.b]) {
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    }
  }
  const visited = new Set();
  let hasCycle = false;
  const dfs = (u, parent) => {
    visited.add(u);
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        dfs(v, u);
      } else if (v !== parent) {
        hasCycle = true;
      }
    }
  };
  for (const id of nodeIds) {
    if (!visited.has(id)) dfs(id, null);
  }
  return hasCycle;
}

// 核心真源评估：返回几何指标、四项验收、与白话诊断
export function evaluateNetwork(state, width = 1000, height = 460) {
  const layout = computeLayout(state, width, height);
  const { nodes, byId } = layout;
  const allIds = nodes.map((n) => n.id);

  // 1. 完整网络连通性
  const full = analyzeComponents(allIds, state.edges);
  const isolatedIds = nodes.filter((n) => !n.fixed && n.degree === 0).map((n) => n.id);
  const componentCount = full.components.length;

  // 2. 拔除中心枢纽后的外围存活率（去中心化验真）
  const outerEdges = state.edges.filter((e) => e.a !== "core" && e.b !== "core");
  const outer = analyzeComponents(SATELLITE_IDS, outerEdges);
  const largestOuter = Math.max(0, ...outer.components.map((c) => c.length));
  const outerReachPct = largestOuter / SATELLITE_IDS.length;
  const hasOuterCycle = detectCycle(SATELLITE_IDS, outerEdges);

  // 如果处于「模拟中心断电」状态，标记当前存活的主分量
  const activeOuterComp = outer.components.reduce((best, c) => (c.length > best.length ? c : best), []);
  const poweredSet = new Set(
    state.hubOutage
      ? activeOuterComp
      : full.components.find((c) => c.includes("core")) || []
  );

  // 3. 几何交叉检测（含连线直穿中心圆盘）
  const crossings = [];
  for (let i = 0; i < state.edges.length; i++) {
    const e1 = state.edges[i];
    for (let j = i + 1; j < state.edges.length; j++) {
      const e2 = state.edges[j];
      if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
      const hit = segmentIntersection(byId[e1.a], byId[e1.b], byId[e2.a], byId[e2.b]);
      if (hit) crossings.push({ ...hit, i, j });
    }
  }
  const corePierced = [];
  const coreNode = byId.core;
  state.edges.forEach((e, idx) => {
    if (e.a === "core" || e.b === "core") return;
    const d = pointToSegmentDist(coreNode.x, coreNode.y, byId[e.a].x, byId[e.a].y, byId[e.b].x, byId[e.b].y);
    if (d < coreNode.r * 0.88) corePierced.push(idx);
  });

  // 4. 节点重叠与留白测算
  const overlaps = [];
  let minClearance = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r);
      if (gap < minClearance) minClearance = gap;
      if (gap < 6) overlaps.push([a.id, b.id]);
    }
  }
  const totalCircleArea = nodes.reduce((s, n) => s + Math.PI * n.r * n.r, 0);
  const whitespacePct = Math.max(0, Math.min(95, Math.round((1 - totalCircleArea / (width * height)) * 100)));

  // 5. 边数与实虚线分级
  const edgeCount = state.edges.length;
  const solidCount = state.edges.filter((e) => e.kind === "solid").length;
  const dashedCount = state.edges.filter((e) => e.kind === "dashed").length;
  const solidRatio = edgeCount > 0 ? solidCount / edgeCount : 0;
  const hairball = edgeCount > 16;

  // 6. 实测体量比（核心圆直径 / 支持圆直径）
  const supportR = byId.data.r;
  const scaleRatio = +(coreNode.r / Math.max(1, supportR)).toFixed(2);

  // 7. 四大核心柱验收（与 064 原海报四关键词一一对应）
  const checks = {
    conn: isolatedIds.length === 0 && componentCount === 1 && !hairball && edgeCount >= 7,
    link: crossings.length <= 1 && corePierced.length === 0 && overlaps.length === 0 && solidCount >= 3 && dashedCount >= 3 && solidRatio >= 0.25 && solidRatio <= 0.75,
    sys: state.scaleMode === "tiered" && outerReachPct >= 6 / 7 && !hairball,
    flow: state.flowOn && hasOuterCycle && isolatedIds.length === 0 && outerReachPct >= 6 / 7,
  };
  const score = Object.values(checks).filter(Boolean).length;

  // 8. 优先级诊断（七类真实网络失误 + 校准通过）
  const themeNodes = THEMES[state.theme].nodes;
  const labelOf = (id) => (id === "core" ? "中心枢纽" : themeNodes[id]?.label || id);

  let code = "pass";
  let badge = "4 / 4 拓扑成网";
  let headline = "主次清晰、零乱叉、拔掉中心照样成网";
  let body = "核心枢纽体量醒目，实虚线把主干与次级反馈拆开，外围形成完整闭环。就算点下「模拟中心断电」，外环依然连通流动，这才是真正的网络构图。";
  let action = "试试点击「模拟中心断电」验收抗毁性，或切到其他题材观察同一套拓扑如何复用。";

  if (isolatedIds.length > 0) {
    const names = isolatedIds.map(labelOf).join("、");
    code = "isolate";
    badge = `错态 · 断链孤岛`;
    headline = `「${names}」断链落单，视线走不到它身上`;
    body = `当前有 ${isolatedIds.length} 枚节点连线数为 0。网络构图的意义在「关系线」，节点一旦断链就会退化成飘浮的散点（062 分散构图的语言），读者不知道它在系统里起什么作用。`;
    action = `先点「${labelOf(isolatedIds[0])}」，再点相邻的「${labelOf("channel")}」或「${labelOf("feedback")}」把它织回网络。`;
  } else if (overlaps.length > 0) {
    const [a, b] = overlaps[0];
    code = "overlap";
    badge = `错态 · 节点压叠`;
    headline = `「${labelOf(a)}」与「${labelOf(b)}」撞在一起，文字挤糊了`;
    body = `两枚节点圆缘净隙不足 6px，视觉边界粘连，人眼无法分清节点标签与连线起止点。网络图需保留充足的节点呼吸留白（经验参考 ≥ 40% 画面空白）。`;
    action = `直接拖开「${labelOf(a)}」或「${labelOf(b)}」，给圆周留出干净间隙。`;
  } else if (hairball) {
    code = "hairball";
    badge = `错态 · 铁丝网过载`;
    headline = `连了 ${edgeCount} 条线，整张网糊成了「铁丝网」`;
    body = `节点间几乎两两全连（超过 16 条经验上限），连线互相遮挡，所有关系都显得同等重要——结果就是没有一条路径能被快速读出。`;
    action = `在图例盘选「剪断」或直接点多余斜线删除，只保留骨干主连与必要外环（经验参考 10–14 条）。`;
  } else if (crossings.length > 1 || corePierced.length > 0) {
    code = "crossing";
    badge = `错态 · 线条乱叉`;
    headline =
      corePierced.length > 0
        ? `有 ${corePierced.length} 条斜线直穿中心圆盘，且交错 ${crossings.length} 处`
        : `画面出现 ${crossings.length} 处连线交叉，眼睛在交点频频脱轨`;
    body = `Helen C. Purchase（1997）的图阅读实验证实：减少连线交叉是对人眼理解关系图影响最大的单一视觉规则。标红 × 处越多，读者追踪路径越慢、越容易串线。`;
    action = `直接在画布拖动打结的圆（先拖「${labelOf("source")}」到左上方、把「${labelOf("platform")}」拖回右侧）解开乱叉，或点击多余斜穿线剪断。`;
  } else if (outerReachPct < 6 / 7 || !hasOuterCycle) {
    code = "star";
    badge = `错态 · 中心独裁`;
    headline = `外围缺少互连闭环，拔掉中心整张网就碎了`;
    body = `当前去掉中心后外围最大连通仅 ${Math.round(outerReachPct * 100)}%（${largestOuter}/7 枚），还停留在「单中心星形辐射」。这只能表达一对多广播，无法呈现原海报强调的「多点互联」与「动态反馈闭环」。`;
    action = `依次点击相邻外围节点（如「${labelOf("source")}」↔「${labelOf("user")}」、「${labelOf("feedback")}」↔「${labelOf("data")}」）织出外圈闭环，再点「模拟中心断电」验真。`;
  } else if (solidCount < 3 || dashedCount < 3 || solidRatio < 0.25 || solidRatio > 0.75) {
    code = "flatEdge";
    badge = `错态 · 线型平权`;
    headline =
      dashedCount < 3
        ? `全是实线（实 ${solidCount} / 虚 ${dashedCount}），主干与次连混成一团`
        : `虚线过多（实 ${solidCount} / 虚 ${dashedCount}），整张网没了主心骨`;
    body = `064 原海报用粗实线画核心主干（主要连接）、用细虚线画外围协同与反馈（次要连接）。所有线长成一样，读者只能逐条细看，分不出主次路径。`;
    action = `直接点击几条外围或次级连线，把它们切换为「次要连接（虚线）」（保持主实线与次虚线各 ≥ 3 条）。`;
  } else if (state.scaleMode !== "tiered") {
    code = state.scaleMode === "inverted" ? "invertedScale" : "flatScale";
    badge = state.scaleMode === "inverted" ? `错态 · 体量倒挂` : `错态 · 体量平权`;
    headline =
      state.scaleMode === "inverted"
        ? `边缘支持节点比枢纽还大（中心/支持仅 ${scaleRatio}×），重点反了`
        : `7 枚节点几乎一样大（中心/支持仅 ${scaleRatio}×），眼睛找不到入口`;
    body = `当所有节点体量拉平或本末倒置时，视线进入画面没有第一落脚点。把高连接的核心与关键枢纽放大、支持节点缩灰，复杂网络立刻有了抓手。`;
    action = `点击图例说明里的「节点体量」项，切换到「三级体量差」。`;
  } else if (!state.flowOn) {
    code = "noFlow";
    badge = `待补 · 脉流静止`;
    headline = `结构已通，但信息流向还没点亮`;
    body = `静态连线只告诉读者「谁挨着谁」，点亮线上流向小圆点（原海报图例「信息流向 FLOW」）后，闭环反馈与再生路径才真正活起来。`;
    action = `点击图例里的「信息流向 FLOW」打开流动脉冲。`;
  }

  return {
    layout,
    isolatedIds,
    componentCount,
    largestOuter,
    outerReachPct,
    hasOuterCycle,
    poweredSet,
    crossings,
    corePierced,
    overlaps,
    minClearance: Number.isFinite(minClearance) ? Math.round(minClearance) : 0,
    whitespacePct,
    edgeCount,
    solidCount,
    dashedCount,
    solidRatio,
    hairball,
    scaleRatio,
    checks,
    score,
    diagnosis: { code, badge, headline, body, action },
  };
}

// 供 06 节小练习复用的四组同构单变量拓扑数据
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    reason: "节点排位整齐、无乱叉也有外环，但全部圆体量完全平权且 12 条线全是等粗实线——眼睛抓不出核心枢纽，也分不清骨干主线和外围反馈。",
    scaleMode: "flat",
    edges: [
      ["core", "source", "solid"], ["core", "user", "solid"], ["core", "platform", "solid"],
      ["core", "feedback", "solid"], ["core", "channel", "solid"],
      ["source", "user", "solid"], ["user", "platform", "solid"], ["platform", "feedback", "solid"],
      ["feedback", "data", "solid"], ["data", "channel", "solid"], ["channel", "content", "solid"], ["content", "source", "solid"],
    ],
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    reason: "正确。三档节点体量（核心 > 关键 > 支持）一眼定出视觉入口，实线标明骨干通路、虚线画出协同与反馈闭环，零交叉且拔除中心后外环仍完整连通。",
    scaleMode: "tiered",
    edges: [
      ["core", "source", "solid"], ["core", "user", "solid"], ["core", "platform", "solid"],
      ["core", "feedback", "dashed"], ["core", "data", "dashed"], ["core", "channel", "solid"], ["core", "content", "solid"],
      ["source", "user", "dashed"], ["user", "platform", "dashed"], ["platform", "feedback", "solid"],
      ["feedback", "data", "dashed"], ["data", "channel", "solid"], ["channel", "content", "dashed"], ["content", "source", "dashed"],
    ],
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    reason: "体量分级与实虚线都有，但外围节点之间零连线，只剩中心向外辐射的 6 条单向分支——退化成了中心化星形，看不出跨组协作与反馈回环。",
    scaleMode: "tiered",
    edges: [
      ["core", "source", "solid"], ["core", "user", "solid"], ["core", "platform", "solid"],
      ["core", "feedback", "dashed"], ["core", "data", "dashed"], ["core", "channel", "solid"], ["core", "content", "dashed"],
    ],
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    reason: "虽然体量分级与外环都齐备，但 21 条过密交叉连线在空白区织出密网乱叉——正如 Purchase（1997）所证，密集交叉直接摧毁路径追踪效率。",
    scaleMode: "tiered",
    edges: [
      ["core", "source", "solid"], ["core", "user", "solid"], ["core", "platform", "solid"],
      ["core", "feedback", "dashed"], ["core", "data", "dashed"], ["core", "channel", "solid"], ["core", "content", "solid"],
      ["source", "user", "solid"], ["user", "platform", "solid"], ["platform", "feedback", "solid"],
      ["feedback", "data", "solid"], ["data", "channel", "solid"], ["channel", "content", "solid"], ["content", "source", "solid"],
      ["source", "platform", "solid"], ["user", "feedback", "solid"], ["platform", "data", "solid"],
      ["feedback", "channel", "solid"], ["data", "content", "solid"], ["channel", "source", "solid"], ["content", "user", "solid"],
    ],
  },
];
