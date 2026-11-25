// 063 分支构图 · 单一真源模型
// 全部 16 枚节点的拓扑父子关系、实绘坐标、45° 折线几何、线段交叉检测、成环检测、孤岛与四项验收全部同源计算。
import { PALETTE, LEVEL_META } from "./palette.js";

export const NODE_DEFS = [
  { id: "R",  nominalLevel: 0, slot: 0, labels: { abstract: "主干", coffee: "手冲风味", design: "设计系统" } },
  { id: "B1", nominalLevel: 1, slot: 0, labels: { abstract: "分支 A", coffee: "产区风土", design: "基础令牌" } },
  { id: "B2", nominalLevel: 1, slot: 1, labels: { abstract: "分支 B", coffee: "烘焙曲线", design: "核心组件" } },
  { id: "B3", nominalLevel: 1, slot: 2, labels: { abstract: "分支 C", coffee: "萃取参数", design: "页面模式" } },
  { id: "C1", nominalLevel: 2, slot: 0, labels: { abstract: "子枝 A1", coffee: "水洗处理", design: "色彩阶梯" } },
  { id: "C2", nominalLevel: 2, slot: 1, labels: { abstract: "子枝 A2", coffee: "日晒处理", design: "字阶比例" } },
  { id: "C3", nominalLevel: 2, slot: 2, labels: { abstract: "子枝 B1", coffee: "浅度烘焙", design: "表单控件" } },
  { id: "C4", nominalLevel: 2, slot: 3, labels: { abstract: "子枝 B2", coffee: "中深烘焙", design: "导航栏位" } },
  { id: "C5", nominalLevel: 2, slot: 4, labels: { abstract: "子枝 C1", coffee: "细度研磨", design: "列表页型" } },
  { id: "C6", nominalLevel: 2, slot: 5, labels: { abstract: "子枝 C2", coffee: "分段注水", design: "详情页型" } },
  { id: "L1", nominalLevel: 3, slot: 0, labels: { abstract: "末端 01", coffee: "柑橘花香", design: "对比度检" } },
  { id: "L2", nominalLevel: 3, slot: 1, labels: { abstract: "末端 02", coffee: "莓果甜感", design: "行高基准" } },
  { id: "L3", nominalLevel: 3, slot: 2, labels: { abstract: "末端 03", coffee: "茶感清透", design: "焦点环态" } },
  { id: "L4", nominalLevel: 3, slot: 3, labels: { abstract: "末端 04", coffee: "焦糖坚果", design: "面包屑径" } },
  { id: "L5", nominalLevel: 3, slot: 4, labels: { abstract: "末端 05", coffee: "高甜醇厚", design: "筛选排序" } },
  { id: "L6", nominalLevel: 3, slot: 5, labels: { abstract: "末端 06", coffee: "层次收尾", design: "双栏分流" } },
];

export const NODE_MAP = Object.fromEntries(NODE_DEFS.map((n) => [n.id, n]));

// 各级体量比例（基准 r = baseUnit）：均基于实绘半径
export const SCALE_MODES = {
  inverted: { label: "倒挂 0.6×", mult: [0.58, 0.72, 0.88, 1.04], desc: "末端反比主干大，眼睛先被边缘吸走" },
  equal:    { label: "平权 1.0×", mult: [0.76, 0.76, 0.76, 0.76], desc: "四级全等大小，找不出主干入口" },
  gentle:   { label: "缓降 1.5×", mult: [1.14, 0.90, 0.78, 0.70], desc: "主干明显领衔，逐级轻柔收束" },
  poster:   { label: "原海报级差", mult: [1.34, 0.92, 0.76, 0.66], desc: "忠实原海报体量梯级：大圆根→小方叶" },
};

// 合法标准父级映射（供参考与理顺辅助，不作一键通关按钮，只作错态构造与理顺参考）
export const CANONICAL_PARENTS = {
  R: null,
  B1: "R", B2: "R", B3: "R",
  C1: "B1", C2: "B1", C3: "B2", C4: "B2", C5: "B3", C6: "B3",
  L1: "C1", L2: "C2", L3: "C3", L4: "C4", L5: "C5", L6: "C6",
};

// 四种典型错态预设（开场默认为 broken，0/4 失序）
export const PRESETS = {
  broken: {
    name: "乱叉错态",
    span: 0.36,
    scaleMode: "equal",
    parents: {
      R: null,
      B1: "R", B2: "R", B3: "R",
      // C1 与 C2 跨级直挂主干（推高主干扇出至 5 枝），C3/C4 与 C5/C6 交叉错挂制造清晰枝线打结
      C1: "R", C2: "R", C3: "B3", C4: "B3", C5: "B2", C6: "B2",
      L1: "C1", L2: "C2", L3: "C3", L4: "C4", L5: "C5",
      // L6 断线成孤岛
      L6: null,
    },
    extraEdges: [],
  },
  flat: {
    name: "扁平爆棚",
    span: 0.68,
    scaleMode: "poster",
    parents: {
      R: null,
      B1: "R", B2: "R", B3: "R",
      C1: "R", C2: "R", C3: "R", C4: "R", C5: "B3", C6: "B3",
      L1: "C1", L2: "C2", L3: "C3", L4: "C4", L5: "C5", L6: "C6",
    },
    extraEdges: [],
  },
  cycle: {
    name: "成环变网",
    span: 0.74,
    scaleMode: "poster",
    parents: { ...CANONICAL_PARENTS },
    extraEdges: [
      { from: "L3", to: "B1" },
      { from: "C4", to: "C2" },
    ],
  },
  inverted: {
    name: "体量倒挂",
    span: 0.72,
    scaleMode: "inverted",
    parents: { ...CANONICAL_PARENTS },
    extraEdges: [],
  },
};

export function createInitialState() {
  return clonePreset("broken", "abstract");
}

export function clonePreset(key, theme = "abstract") {
  const p = PRESETS[key] || PRESETS.broken;
  return {
    preset: key,
    theme,
    span: p.span,
    scaleMode: p.scaleMode,
    parents: { ...p.parents },
    extraEdges: p.extraEdges.map((e) => ({ ...e })),
    selectedId: null,
    hoverId: null,
    showPulse: true,
    showGuides: true,
  };
}

// 改挂某节点的父节点（允许连出交叉、扁平或跨级，若连向自己或后代则转成回环边提示越界到 064！）
export function reparentNode(state, childId, targetParentId) {
  if (!childId || childId === "R" || childId === targetParentId) return { action: "noop" };
  // 检查 targetParentId 是否是 childId 的后代（若如此，形成真实闭环！）
  let cur = targetParentId;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    if (cur === childId) {
      // 不破坏原 parents 造成死循环，而是添为真实闭环边并立即可见
      const exists = state.extraEdges.some((e) => e.from === targetParentId && e.to === childId);
      if (!exists) state.extraEdges.push({ from: targetParentId, to: childId });
      return { action: "cycle" };
    }
    seen.add(cur);
    cur = state.parents[cur];
  }
  state.parents[childId] = targetParentId;
  state.preset = "custom";
  return { action: "reparent" };
}

// 断开节点使其成为孤岛
export function detachNode(state, nodeId) {
  if (!nodeId || nodeId === "R") return false;
  state.parents[nodeId] = null;
  state.preset = "custom";
  return true;
}

// 切掉或添加一条演示回环边
export function toggleCycleEdge(state) {
  if (state.extraEdges.length > 0) {
    state.extraEdges = [];
    state.preset = "custom";
    return false;
  }
  state.extraEdges = [{ from: "L3", to: "B1" }];
  state.preset = "custom";
  return true;
}

// 单步理顺拓扑：解开交叉与跨级（把交叉或跨级的 1~2 组关系顺回父层，但不改动展幅与体量差！）
export function untangleBranches(state) {
  // 先清回环
  state.extraEdges = [];
  // 恢复无交叉、无跨级的清晰四级归属（保底不碰 span 和 scaleMode，用户仍需靠自己调展幅和体量差！）
  for (const id of Object.keys(CANONICAL_PARENTS)) {
    state.parents[id] = CANONICAL_PARENTS[id];
  }
  state.preset = "custom";
}

// 计算可达性、拓扑深度与扇出
export function analyzeTopology(state) {
  const childrenOf = Object.fromEntries(NODE_DEFS.map((n) => [n.id, []]));
  for (const n of NODE_DEFS) {
    const p = state.parents[n.id];
    if (p && childrenOf[p]) childrenOf[p].push(n.id);
  }
  // BFS from R
  const depth = { R: 0 };
  const queue = ["R"];
  while (queue.length) {
    const u = queue.shift();
    for (const v of childrenOf[u]) {
      if (depth[v] === undefined) {
        depth[v] = depth[u] + 1;
        queue.push(v);
      }
    }
  }
  const orphans = NODE_DEFS.filter((n) => depth[n.id] === undefined).map((n) => n.id);
  const reachedLeaves = NODE_DEFS.filter((n) => n.nominalLevel === 3 && depth[n.id] !== undefined).map((n) => n.id);

  // 检查是否包含跨级跳连（父节点与子节点的名义层级差 != 1）
  const skipEdges = [];
  for (const n of NODE_DEFS) {
    const p = state.parents[n.id];
    if (!p) continue;
    const pDef = NODE_MAP[p];
    if (n.nominalLevel - pDef.nominalLevel !== 1) {
      skipEdges.push({ from: p, to: n.id, jump: n.nominalLevel - pDef.nominalLevel });
    }
  }

  // 检查有向图是否含环（主树边 + extraEdges）
  const adj = Object.fromEntries(NODE_DEFS.map((n) => [n.id, [...childrenOf[n.id]]]));
  for (const e of state.extraEdges) {
    if (adj[e.from]) adj[e.from].push(e.to);
  }
  // 含任何 extraEdge 即视为非树网边（有闭环或跨支多父路径）
  let hasCycle = false;
  const color = {}; // 0 white, 1 gray, 2 black
  const dfs = (u) => {
    color[u] = 1;
    for (const v of adj[u] || []) {
      if (color[v] === 1) hasCycle = true;
      else if (!color[v]) dfs(v);
    }
    color[u] = 2;
  };
  for (const n of NODE_DEFS) if (!color[n.id]) dfs(n.id);
  const hasNetworkEdge = state.extraEdges.length > 0;

  // 扇出统计
  let maxFanout = 0;
  let maxFanoutId = "R";
  let branchingNodes = 0;
  for (const n of NODE_DEFS) {
    if (depth[n.id] === undefined) continue;
    const f = childrenOf[n.id].length;
    if (f > maxFanout) {
      maxFanout = f;
      maxFanoutId = n.id;
    }
    if (f >= 2) branchingNodes++;
  }
  const maxDepth = Math.max(...Object.values(depth));

  return {
    childrenOf,
    depth,
    orphans,
    reachedLeaves,
    skipEdges,
    hasCycle,
    hasNetworkEdge,
    maxFanout,
    maxFanoutId,
    branchingNodes,
    maxDepth,
  };
}

// 几何辅助：两线段 (p1-p2) 与 (p3-p4) 的严格相交点（忽略端点重合）
function segmentIntersection(p1, p2, p3, p4) {
  const eps = 1e-4;
  // 端点共享不计交叉
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 3;
  if (near(p1, p3) || near(p1, p4) || near(p2, p3) || near(p2, p4)) return null;

  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < eps) return null;

  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (t > 0.04 && t < 0.96 && u > 0.04 && u < 0.96) {
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
  }
  return null;
}

// 计算 45° 折转枝干路径点（忠实 063 原海报深墨绿折线）
function buildOctilinearPath(fromNode, toNode) {
  const sx = fromNode.x + fromNode.r * 0.85;
  const sy = fromNode.y;
  const ex = toNode.x - toNode.r * 0.85;
  const ey = toNode.y;
  const dx = ex - sx;
  const dy = ey - sy;

  // 若目标在父节点左侧或几乎同列（例如异常回指），走圆滑绕线折段
  if (dx <= 10) {
    const midY = (sy + ey) / 2 + (sy <= ey ? -22 : 22);
    return [
      { x: fromNode.x, y: fromNode.y },
      { x: fromNode.x + 18, y: midY },
      { x: toNode.x - 18, y: midY },
      { x: toNode.x, y: toNode.y },
    ];
  }
  if (Math.abs(dy) < 2) {
    return [{ x: sx, y: sy }, { x: ex, y: ey }];
  }
  // 原海报风格：短水平出干 -> 45°（或按空间自适应斜角）转折 -> 水平进子节点
  const stub = Math.max(8, Math.min(dx * 0.22, 28));
  const availX = Math.max(12, dx - stub - Math.max(8, dx * 0.14));
  const diagX = Math.min(availX, Math.abs(dy) * 0.82);
  const x1 = sx + stub;
  const x2 = x1 + diagX;
  return [
    { x: sx, y: sy },
    { x: x1, y: sy },
    { x: x2, y: ey },
    { x: ex, y: ey },
  ];
}

// 核心单真源布局与实测评估
export function computeModel(state, width, height) {
  const w = Math.max(300, width);
  const h = Math.max(220, height);
  const compact = w < 520;
  const topo = analyzeTopology(state);

  // 垂直槽位 Y 坐标（留出顶部级标与底部余白，6 枚节点保持三组微成对同时确保纵隙充裕）
  const padT = compact ? 22 : 30;
  const padB = compact ? 18 : 22;
  const usableH = Math.max(110, h - padT - padB);

  // 基础节点尺寸：以较短边和 6 槽纵高共同约束，确保节点始终等比且同列留足呼吸净隙
  const baseUnit = Math.max(8.5, Math.min(w * 0.032, usableH * 0.082, compact ? 15 : 24));
  const scale = SCALE_MODES[state.scaleMode] || SCALE_MODES.poster;

  // 横向分布完全由 state.span 决定（范围 0.28..0.96）
  const padL = Math.max(compact ? 24 : 52, baseUnit * 1.9);
  const padR = Math.max(compact ? 22 : 48, baseUnit * 1.6);
  const usableW = Math.max(120, w - padL - padR);
  const spanClamped = Math.max(0.28, Math.min(0.98, state.span));
  const colSpan = usableW * spanClamped;

  // 4 个层级纵列 X 坐标（遵循原海报 1 : 1.32 : 0.92 : 0.72 的主干舒展节奏）
  const colFracs = [0, 0.42, 0.75, 1.0];
  const colX = colFracs.map((f) => padL + f * colSpan);

  const slotY = (level, slot) => {
    if (level === 0) return padT + usableH * 0.5;
    if (level === 1) {
      const fracs = [0.17, 0.50, 0.83];
      return padT + usableH * fracs[slot];
    }
    // 6 个节点：三组微成对呼应原海报，同时保证最小槽距 16% 防止矮画布同列粘连
    const fracs = [0.08, 0.25, 0.42, 0.58, 0.75, 0.92];
    return padT + usableH * fracs[slot];
  };

  // 生成全部 16 枚节点的真实屏幕几何
  const nodes = NODE_DEFS.map((def) => {
    const meta = LEVEL_META[def.nominalLevel];
    const r = baseUnit * scale.mult[def.nominalLevel];
    const isOrphan = topo.orphans.includes(def.id);
    // 孤岛微微偏移并下沉一点，让用户一眼看出它掉队了
    const x = colX[def.nominalLevel] + (isOrphan ? Math.min(18, usableW * 0.04) : 0);
    const y = slotY(def.nominalLevel, def.slot) + (isOrphan ? Math.min(10, usableH * 0.03) : 0);
    return {
      id: def.id,
      nominalLevel: def.nominalLevel,
      topoDepth: topo.depth[def.id],
      slot: def.slot,
      label: def.labels[state.theme] || def.labels.abstract,
      shape: meta.shape,
      fill: meta.fill,
      textOnLight: meta.textOnLight,
      x,
      y,
      r,
      isOrphan,
      parentId: state.parents[def.id],
      fanout: topo.childrenOf[def.id].length,
    };
  });
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // 生成所有主树枝干路径
  const edges = [];
  for (const n of nodes) {
    if (!n.parentId || !nodeById[n.parentId]) continue;
    const p = nodeById[n.parentId];
    const isSkip = n.nominalLevel - p.nominalLevel !== 1;
    const pts = buildOctilinearPath(p, n);
    edges.push({
      id: `${p.id}->${n.id}`,
      from: p.id,
      to: n.id,
      pts,
      isSkip,
      isExtra: false,
      reachable: topo.depth[n.id] !== undefined,
    });
  }

  // 额外网边/回环边
  const extraEdges = state.extraEdges
    .filter((e) => nodeById[e.from] && nodeById[e.to])
    .map((e) => {
      const a = nodeById[e.from];
      const b = nodeById[e.to];
      const ctrlY = Math.min(a.y, b.y) - Math.min(54, usableH * 0.22);
      return {
        id: `extra:${e.from}->${e.to}`,
        from: e.from,
        to: e.to,
        a,
        b,
        ctrl: { x: (a.x + b.x) / 2, y: Math.max(16, ctrlY) },
        isExtra: true,
      };
    });

  // 真实线段相交检测（对所有主树枝干段逐对求交）
  const crossings = [];
  const segList = [];
  for (const edge of edges) {
    for (let i = 0; i < edge.pts.length - 1; i++) {
      segList.push({ edgeId: edge.id, from: edge.from, to: edge.to, a: edge.pts[i], b: edge.pts[i + 1] });
    }
  }
  for (let i = 0; i < segList.length; i++) {
    for (let j = i + 1; j < segList.length; j++) {
      const s1 = segList[i], s2 = segList[j];
      if (s1.edgeId === s2.edgeId) continue;
      // 共享父或子节点时不视作边交叉
      if (s1.from === s2.from || s1.to === s2.to || s1.from === s2.to || s1.to === s2.from) continue;
      const pt = segmentIntersection(s1.a, s1.b, s2.a, s2.b);
      if (pt) {
        // 去重邻近交点
        if (!crossings.some((c) => Math.hypot(c.x - pt.x, c.y - pt.y) < 8)) {
          crossings.push({ ...pt, edgeA: s1.edgeId, edgeB: s2.edgeId });
        }
      }
    }
  }

  // 实测节点净隙与重叠
  let minGapPx = Infinity;
  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r);
      if (gap < minGapPx) minGapPx = gap;
      if (gap < 1.5) overlaps++;
    }
  }
  if (!Number.isFinite(minGapPx)) minGapPx = 0;

  // 实测图幅外缘展幅占比（从实绘最左外缘到最右外缘 / 画布宽度）
  const minX = Math.min(...nodes.map((n) => n.x - n.r));
  const maxX = Math.max(...nodes.map((n) => n.x + n.r));
  const actualSpanPct = Math.round(((maxX - minX) / w) * 100);
  const edgeBleed = minX < 6 || maxX > w - 6;

  // 实测主干/末端半径比与面积比（从真实绘出半径算）
  const rootR = nodeById.R.r;
  const leafR = nodeById.L1.r;
  const radiusRatio = +(rootR / Math.max(1, leafR)).toFixed(2);
  const areaRatio = +((rootR * rootR) / Math.max(1, leafR * leafR)).toFixed(2);

  // 构图四项单真源验收（严格对应原海报底部四个关键词：主干 / 分叉 / 层级 / 延伸）
  const checks = {
    trunk: {
      ok: topo.orphans.length === 0 && radiusRatio >= 1.4 && !topo.hasCycle && !topo.hasNetworkEdge,
      metric: topo.orphans.length > 0
        ? `${topo.orphans.length} 处孤岛`
        : radiusRatio < 1
          ? `倒挂 ${radiusRatio}×`
          : radiusRatio < 1.4
            ? `平权 ${radiusRatio}×`
            : `领衔 ${radiusRatio}×`,
    },
    branching: {
      ok: crossings.length === 0 && !topo.hasCycle && !topo.hasNetworkEdge && topo.maxFanout >= 2 && topo.maxFanout <= 4 && topo.branchingNodes >= 2,
      metric: topo.hasCycle || topo.hasNetworkEdge
        ? `成环变网`
        : crossings.length > 0
          ? `交叉 ${crossings.length} 处`
          : topo.maxFanout > 4
            ? `爆出 ${topo.maxFanout} 枝`
            : topo.branchingNodes < 2
              ? `退化单链`
              : `0 叉 · 扇出 ${topo.maxFanout}`,
    },
    hierarchy: {
      ok: topo.maxDepth >= 3 && topo.skipEdges.length === 0 && overlaps === 0 && minGapPx >= 4,
      metric: topo.skipEdges.length > 0
        ? `跨级 ${topo.skipEdges.length} 处`
        : overlaps > 0 || minGapPx < 4
          ? `挤撞 ${Math.round(minGapPx)}px`
          : `${topo.maxDepth + 1} 级齐列`,
    },
    extension: {
      ok: actualSpanPct >= 56 && actualSpanPct <= 88 && topo.reachedLeaves.length === 6 && !edgeBleed,
      metric: topo.reachedLeaves.length < 6
        ? `抵达 ${topo.reachedLeaves.length}/6`
        : edgeBleed || actualSpanPct > 88
          ? `贴边 ${actualSpanPct}%`
          : actualSpanPct < 56
            ? `缩挤 ${actualSpanPct}%`
            : `展幅 ${actualSpanPct}%`,
    },
  };

  const passCount = Object.values(checks).filter((c) => c.ok).length;

  // 按严重程度排序的第一诊断（永远讲清「为什么」与「怎么调」）
  let diagnosis;
  if (topo.hasCycle || topo.hasNetworkEdge) {
    diagnosis = {
      status: "err",
      tag: "错态 · 成环变网",
      headline: "枝干绕成了闭环，它已经不再是分支构图",
      body: "分支构图依靠「唯一父级、绝不回头」建立清晰归属。一旦出现回环或跨支互连，视线就在环里打转，这属于 064 网络构图的语法。",
      hint: "点「移除回环边」或「理顺分叉槽位」，恢复从根部向外单向延展的树结构。",
    };
  } else if (topo.orphans.length > 0) {
    diagnosis = {
      status: "err",
      tag: "错态 · 断枝孤岛",
      headline: `有 ${topo.orphans.length} 枚节点脱离主干，视线根本走不到它`,
      body: `节点 ${topo.orphans.join("、")} 没有父级连线，游离在树外。读者扫完主干分支后，不知道它归属于哪一类，信息链当场断档。`,
      hint: `先点击孤岛节点 ${topo.orphans[0]}，再点任意三级粉圆把它重新嫁接回树上。`,
    };
  } else if (crossings.length > 0) {
    diagnosis = {
      status: "err",
      tag: "错态 · 枝线缠结",
      headline: `画布里出现 ${crossings.length} 处枝线交叉，视线被迫中途刹车`,
      body: "交叉连线会把相邻两支的归属搅在一起，大脑不得不顺着线条来回核对「这条绿线到底连去哪」，直接拖垮阅读流畅度。",
      hint: "在画布上点选错挂的粉圆改挂给同侧墨绿方，或点「理顺分叉槽位」解开交叉。",
    };
  } else if (topo.maxFanout > 4) {
    diagnosis = {
      status: "err",
      tag: "错态 · 扁平爆棚",
      headline: `单节点一口气炸出 ${topo.maxFanout} 条直枝，失去「逐级」承接`,
      body: `节点 ${topo.maxFanoutId} 直接挂了太多下级，主干分叉退化成烟花放射状（经验舒适单层扇出约 2–4 枝），眼睛瞬间面对过多平级选项。`,
      hint: "把跨级挂在主干上的粉圆或藏青方改挂回对应的上一级节点，让层级逐段展开。",
    };
  } else if (topo.skipEdges.length > 0) {
    diagnosis = {
      status: "err",
      tag: "错态 · 跨级直插",
      headline: `有 ${topo.skipEdges.length} 条连线跳过了中间层，列序被打穿`,
      body: "子节点越过相邻父层直接插进更上游节点，破坏了同级纵列对齐的节奏，读者会误以为它和二级节点平起平坐。",
      hint: "选中跨级节点并重新挂回紧邻左侧的上一级节点，让四级纵列各归其位。",
    };
  } else if (radiusRatio < 1.4) {
    diagnosis = {
      status: "err",
      tag: radiusRatio < 1 ? "错态 · 体量倒挂" : "错态 · 主干平权",
      headline: radiusRatio < 1
        ? `末端反比主干更大（根/叶半径比 ${radiusRatio}×），读者倒着看图`
        : `四级节点同样大小（根/叶半径比 ${radiusRatio}×），主干立不住入口`,
      body: "分支构图必须先稳稳钉住「起点」。当根部视觉分量弱于或等于末端，眼睛会被右侧成群的末端色块吸走，反向逆读整棵树。",
      hint: "把下方「体量级差」切换到「缓降 1.5×」或「原海报级差」，让主干大圆领衔全图。",
    };
  } else if (actualSpanPct < 56 || overlaps > 0 || minGapPx < 4) {
    diagnosis = {
      status: "err",
      tag: "错态 · 层级挤压",
      headline: `展幅只占画布 ${actualSpanPct}%，四级节点挤在一起喘不过气`,
      body: `当前最小净隙仅 ${Math.round(minGapPx)}px（经验舒适展幅约 56%–88%），45° 分叉折角被压成陡峭折线，视线无法舒展地向右延伸。`,
      hint: "向右拖动画布底沿的「延伸展幅拉尺」，把四级纵列舒展进 56%–88% 舒适带。",
    };
  } else if (edgeBleed || actualSpanPct > 88) {
    diagnosis = {
      status: "err",
      tag: "错态 · 贴边截断",
      headline: `展幅拉到 ${actualSpanPct}%，末端快顶破右边界了`,
      body: "整棵树撑得过满会吃掉四周留白，让末端节点紧贴边缘、失去向外延展的呼吸空间。",
      hint: "把底沿「延伸展幅拉尺」略微往左收回到 56%–88% 区间内。",
    };
  } else if (topo.branchingNodes < 2) {
    diagnosis = {
      status: "err",
      tag: "错态 · 退化单链",
      headline: "只有纵向延伸、几乎没有分叉展开",
      body: "如果大多数节点都只接一个下级，画面就退化成单一线性链条（060 级联），失去了分支构图整理多路信息的威力。",
      hint: "把子节点分别挂到不同二级/三级分支下，形成逐级分叉的树冠。",
    };
  } else {
    diagnosis = {
      status: "ok",
      tag: "4 / 4 · 清晰成树",
      headline: "主干领衔、逐级分叉、零交叉舒展",
      body: `根/叶半径比 ${radiusRatio}×（面积比 ${areaRatio}×），${topo.maxDepth + 1} 级纵列对齐、0 处交叉、展幅 ${actualSpanPct}%，视线正顺着 45° 绿枝从橘红主干流向全部 6 枚末端。`,
      hint: "你可以继续点选画布任意节点做嫁接试验，或切「成环变网」「扁平爆棚」反推边界。",
    };
  }

  return {
    w,
    h,
    compact,
    colX,
    nodes,
    nodeById,
    edges,
    extraEdges,
    crossings,
    topo,
    minGapPx,
    overlaps,
    actualSpanPct,
    edgeBleed,
    radiusRatio,
    areaRatio,
    checks,
    passCount,
    diagnosis,
  };
}

// 沿着折线段按比例 0..1 采样坐标（用于真实视线脉冲流）
export function samplePolyline(pts, t) {
  if (!pts || pts.length < 2) return pts?.[0] || { x: 0, y: 0 };
  let total = 0;
  const lens = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    lens.push(l);
    total += l;
  }
  if (total < 1e-3) return pts[0];
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] > 1e-4 ? d / lens[i] : 0;
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
      };
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}
