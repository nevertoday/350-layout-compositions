// 061 聚类构图 — 单一几何真源与实时聚类评估模型
// 所有坐标统一落在 800×600 逻辑画布内，绘制时按 min(w/800, h/600) 等比缩放，确保正圆绝不压扁。

export const WORLD = { w: 800, h: 600 };
export const CORE_CENTER = { x: 432, y: 298 };

// 9 枚直接取自 061 原海报的几何元件（5 枚默认核心组件 + 4 枚默认外围弱化件）
// weight 由视觉面积 × 明度反差确定，用于实算主簇视觉占比（不写死常量）。
export const INITIAL_ITEMS = [
  {
    id: "hero-sq",
    name: "主视觉大方块",
    short: "主块",
    shape: "square",
    r: 68, // 半边长，136×136
    role: "core",
    tone: "lavender-core",
    scatter: { x: 296, y: 286 },
    cluster: { x: 386, y: 256 },
    outerSlot: { x: 96, y: 274 },
    isAnchor: true,
  },
  {
    id: "cream-orb",
    name: "高反差亮眼圆",
    short: "亮圆",
    shape: "circle",
    r: 40,
    role: "core",
    tone: "cream-core",
    scatter: { x: 506, y: 128 },
    cluster: { x: 512, y: 224 },
    outerSlot: { x: 668, y: 145 },
    isAnchor: false,
  },
  {
    id: "lilac-orb",
    name: "中阶呼应圆",
    short: "中圆",
    shape: "circle",
    r: 32,
    role: "core",
    tone: "lilac-core",
    scatter: { x: 676, y: 300 },
    cluster: { x: 520, y: 318 },
    outerSlot: { x: 688, y: 324 },
    isAnchor: false,
  },
  {
    id: "core-dots",
    name: "核心九点阵",
    short: "点阵",
    shape: "dots",
    r: 34,
    role: "core",
    tone: "white-dots",
    scatter: { x: 382, y: 472 },
    cluster: { x: 416, y: 376 },
    outerSlot: { x: 254, y: 492 },
    isAnchor: false,
  },
  {
    id: "small-sq",
    name: "收尾小方块",
    short: "小块",
    shape: "square",
    r: 25,
    role: "core",
    tone: "lavender-core",
    scatter: { x: 492, y: 304 },
    cluster: { x: 500, y: 392 },
    outerSlot: { x: 586, y: 496 },
    isAnchor: false,
  },
  {
    id: "sat-indigo",
    name: "左上深紫卫星",
    short: "深星",
    shape: "circle",
    r: 34,
    role: "outer",
    tone: "indigo-sat",
    scatter: { x: 118, y: 132 },
    cluster: { x: 186, y: 132 },
    outerSlot: { x: 186, y: 132 },
    isAnchor: false,
  },
  {
    id: "sat-sq",
    name: "左下淡紫方块",
    short: "弱块",
    shape: "square",
    r: 42,
    role: "outer",
    tone: "pale-sat",
    scatter: { x: 132, y: 446 },
    cluster: { x: 134, y: 452 },
    outerSlot: { x: 134, y: 452 },
    isAnchor: false,
  },
  {
    id: "sat-orb",
    name: "右下淡紫圆",
    short: "弱圆",
    shape: "circle",
    r: 40,
    role: "outer",
    tone: "pale-sat",
    scatter: { x: 642, y: 468 },
    cluster: { x: 678, y: 468 },
    outerSlot: { x: 678, y: 468 },
    isAnchor: false,
  },
  {
    id: "sat-dots",
    name: "右上淡紫点阵",
    short: "弱点",
    shape: "dots",
    r: 26,
    role: "outer",
    tone: "pale-dots",
    scatter: { x: 696, y: 134 },
    cluster: { x: 696, y: 128 },
    outerSlot: { x: 696, y: 128 },
    isAnchor: false,
  },
];

// 经验阈值集中管理（读数、正文、判定共用同一来源）
export const THRESHOLDS = {
  sepRatioMin: 1.8,      // 簇外最近距 ÷ 簇内最大相邻距（经验甜区下限）
  minGapSafe: 8,         // 簇内最小边到边净隙（逻辑 px，约 1.3% 画高，避免黏连吞边）
  coreCountMin: 4,       // 主簇建议最少件数
  coreCountMax: 6,       // 主簇建议最多件数（保留外围弱化区）
  focusWeightMin: 0.56,  // 主簇视觉权重占比下限
  focusWeightMax: 0.84,  // 主簇视觉权重占比上限（过高说明失去反衬）
  scaleRatioMin: 2.6,    // 簇内最大与最小视觉面积比（确保主次层级）
  rivalTightMax: 52,     // 外围若 >=3 件以小于该净隙抱团，视为长出抢戏第二簇
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

export function createInitialState() {
  const membership = {};
  const manual = {};
  for (const it of INITIAL_ITEMS) {
    membership[it.id] = it.role === "core";
    manual[it.id] = null; // 未手拖时由 pull 驱动
  }
  return {
    pull: 0,               // 0 = 分散错态，68~78 = 经验甜区，88~100 = 过挤黏连错态
    selectedId: "hero-sq",
    showShell: true,       // 共同区域底圆显隐（Palmer 1992 实验开关）
    showMesh: true,        // 最小生成树实测距网显隐
    membership,
    manual,
  };
}

// 为动态增减进主簇的外围件安排绕核紧凑但不互撞的安全槽位
const EXTRA_CORE_SLOTS = [
  { x: 256, y: 214 },
  { x: 266, y: 374 },
  { x: 604, y: 372 },
  { x: 462, y: 124 },
];

export function computeItemPositions(state) {
  const tRaw = clamp(state.pull / 100, 0, 1);
  // 0..0.76 平滑归位到舒适簇形；0.76..1.0 继续向核心过度塌缩造成黏连碰撞
  const tGather = clamp(tRaw / 0.76, 0, 1);
  const smooth = tGather * tGather * (3 - 2 * tGather);
  const crush = clamp((tRaw - 0.78) / 0.22, 0, 1);

  let extraIdx = 0;
  return INITIAL_ITEMS.map((item) => {
    const inTargetCore = !!state.membership[item.id];
    let target;
    if (inTargetCore) {
      if (item.role === "core") {
        target = { ...item.cluster };
      } else {
        target = { ...EXTRA_CORE_SLOTS[extraIdx % EXTRA_CORE_SLOTS.length] };
        extraIdx++;
      }
      // 超过 78% 时向聚核中心过度收缩，形成真实碰撞与黏连
      if (crush > 0) {
        const shrink = 1 - crush * 0.56;
        target = {
          x: CORE_CENTER.x + (target.x - CORE_CENTER.x) * shrink,
          y: CORE_CENTER.y + (target.y - CORE_CENTER.y) * shrink,
        };
      }
    } else {
      target = { ...item.outerSlot };
    }

    const baseX = lerp(item.scatter.x, target.x, smooth);
    const baseY = lerp(item.scatter.y, target.y, smooth);
    const m = state.manual[item.id];
    const x = m ? clamp(m.x, item.r + 16, WORLD.w - item.r - 16) : baseX;
    const y = m ? clamp(m.y, item.r + 16, WORLD.h - item.r - 16) : baseY;

    // 视觉面积（圆 πr²，方块 4r²，点阵 9×小圆等效）
    const area =
      item.shape === "square"
        ? 4 * item.r * item.r
        : item.shape === "dots"
        ? 9 * Math.PI * (item.r * 0.21) ** 2 * 2.1
        : Math.PI * item.r * item.r;

    return {
      ...item,
      x,
      y,
      area,
      targetCore: inTargetCore,
    };
  });
}

// 精确近似边到边净隙（负值即真实重叠吞边）
export function edgeGap(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return -(a.r + b.r);

  // 方形在方向角 θ 上的支撑半径略大于内切半边长，使碰撞判定更忠实于视觉边界
  const radAlong = (it, ux, uy) => {
    if (it.shape === "circle") return it.r;
    const ax = Math.abs(ux);
    const ay = Math.abs(uy);
    const sqSupport = it.r / Math.max(ax, ay, 0.7071);
    return Math.min(sqSupport, it.r * 1.24);
  };
  const ux = dx / dist;
  const uy = dy / dist;
  return dist - (radAlong(a, ux, uy) + radAlong(b, ux, uy));
}

// 计算全部 9 枚元素的最小生成树（Prim 算法，以边到边净隙为边权）
export function buildMST(nodes) {
  const n = nodes.length;
  const used = new Array(n).fill(false);
  const edges = [];
  used[0] = true;
  for (let step = 1; step < n; step++) {
    let bestU = -1;
    let bestV = -1;
    let bestW = Infinity;
    for (let u = 0; u < n; u++) {
      if (!used[u]) continue;
      for (let v = 0; v < n; v++) {
        if (used[v]) continue;
        const g = edgeGap(nodes[u], nodes[v]);
        if (g < bestW) {
          bestW = g;
          bestU = u;
          bestV = v;
        }
      }
    }
    used[bestV] = true;
    edges.push({ u: bestU, v: bestV, gap: bestW });
  }
  return edges;
}

// 给定最大连边阈值，求单链连通分量
function componentsAt(n, mstEdges, maxGap) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of mstEdges) {
    if (e.gap <= maxGap) {
      adj[e.u].push(e.v);
      adj[e.v].push(e.u);
    }
  }
  const seen = new Array(n).fill(false);
  const comps = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const comp = [];
    const stack = [i];
    seen[i] = true;
    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      for (const nxt of adj[cur]) {
        if (!seen[nxt]) {
          seen[nxt] = true;
          stack.push(nxt);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}

// 主评估函数：完全从 9 枚元素当前坐标实算分簇、分离比、碰撞、重心与四原则达标状态
export function evaluateCluster(state) {
  const items = computeItemPositions(state);
  const n = items.length;
  const mst = buildMST(items);

  // 1. 找出所有成对边净隙，检测真实碰撞
  const collisions = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const g = edgeGap(items[i], items[j]);
      if (g < THRESHOLDS.minGapSafe) {
        collisions.push({ u: i, v: j, gap: g });
      }
    }
  }

  // 2. 通过 MST 断层自动寻找几何上最清晰的「主簇 vs 外围」切分
  // 若全部边都紧挨（<= 52），说明全员粘成一大坨；否则寻找最佳单链切分点
  const sortedEdges = [...mst].sort((a, b) => a.gap - b.gap);
  let bestSplit = null;

  // 情况 A：检查是否全员紧密抱成一团（最大 MST 边都 <= 54）
  if (sortedEdges[sortedEdges.length - 1].gap <= 54) {
    bestSplit = {
      comps: [items.map((_, i) => i)],
      coreIdx: items.map((_, i) => i),
      outerIdx: [],
      dInMax: Math.max(12, sortedEdges[sortedEdges.length - 1].gap),
      dOutMin: 0,
      sepRatio: 0,
    };
  } else {
    // 遍历每一个 MST 间隙作为分簇阈值，找分离比最高且至少存在 >=3 件成簇的切分（2 件不足以形成视觉簇）
    for (let k = 0; k < sortedEdges.length; k++) {
      const thr = sortedEdges[k].gap;
      if (thr > 64) break;
      const comps = componentsAt(n, mst, thr);
      // 仅在 >=3 件的真实群组中按视觉总面积选主簇（单个独立大块不是簇）
      const clusterComps = comps.filter((c) => c.length >= 3);
      if (!clusterComps.length) continue;
      clusterComps.sort((a, b) => {
        const wa = a.reduce((s, idx) => s + items[idx].area, 0);
        const wb = b.reduce((s, idx) => s + items[idx].area, 0);
        return wb - wa;
      });
      const core = clusterComps[0];
      const coreSet = new Set(core);
      const outer = [];
      for (let i = 0; i < n; i++) if (!coreSet.has(i)) outer.push(i);

      // 主簇内部 MST 最大净隙
      let dInMax = 0;
      for (const e of mst) {
        if (coreSet.has(e.u) && coreSet.has(e.v)) {
          dInMax = Math.max(dInMax, e.gap);
        }
      }
      // 主簇到所有外围元素的最近边到边净隙
      let dOutMin = Infinity;
      let nearestBridge = null;
      for (const ci of core) {
        for (const oi of outer) {
          const g = edgeGap(items[ci], items[oi]);
          if (g < dOutMin) {
            dOutMin = g;
            nearestBridge = { u: ci, v: oi, gap: g };
          }
        }
      }
      if (!outer.length) dOutMin = 0;
      const denom = Math.max(14, dInMax);
      const ratio = outer.length ? dOutMin / denom : 0;

      // 偏好分离比高、且成员数合理的自然聚类
      const score = ratio + (core.length >= 3 && core.length <= 6 ? 0.35 : 0);
      if (!bestSplit || score > bestSplit.score) {
        bestSplit = {
          comps,
          coreIdx: core,
          outerIdx: outer,
          dInMax: Math.max(0, dInMax),
          dOutMin: Number.isFinite(dOutMin) ? dOutMin : 0,
          sepRatio: ratio,
          nearestBridge,
          score,
        };
      }
    }
  }

  // 如果连任何 2 件净隙 <= 64 的簇都没形成，则为完全散落态
  if (!bestSplit) {
    const avgGap = sortedEdges.reduce((s, e) => s + Math.max(0, e.gap), 0) / sortedEdges.length;
    const minEdge = Math.max(1, sortedEdges[0].gap);
    const maxEdge = Math.max(1, sortedEdges[sortedEdges.length - 1].gap);
    bestSplit = {
      comps: items.map((_, i) => [i]),
      coreIdx: [],
      outerIdx: items.map((_, i) => i),
      dInMax: avgGap,
      dOutMin: avgGap,
      sepRatio: +(maxEdge / Math.max(minEdge, 1)).toFixed(2),
      nearestBridge: sortedEdges[0],
    };
  }

  const coreSet = new Set(bestSplit.coreIdx);
  const coreItems = bestSplit.coreIdx.map((i) => items[i]);
  const outerItems = bestSplit.outerIdx.map((i) => items[i]);

  // 3. 检测主簇内最小净隙（是否拥挤或碰撞）
  let minCoreGap = Infinity;
  for (let i = 0; i < coreItems.length; i++) {
    for (let j = i + 1; j < coreItems.length; j++) {
      const g = edgeGap(coreItems[i], coreItems[j]);
      if (g < minCoreGap) minCoreGap = g;
    }
  }
  if (!Number.isFinite(minCoreGap)) minCoreGap = bestSplit.dInMax;

  // 检测全局碰撞（含外围互撞）
  const minGlobalGap = collisions.length ? Math.min(...collisions.map((c) => c.gap)) : minCoreGap;

  // 4. 检测外围是否自行抱团形成抢戏的第二大簇（对所有外围件独立按 rivalTightMax 检测紧密子团）
  let hasRivalCluster = false;
  let rivalInfo = null;
  if (bestSplit.outerIdx.length >= 3 && coreItems.length >= 3) {
    const oIdx = bestSplit.outerIdx;
    const seenO = new Set();
    const outerGroups = [];
    for (const start of oIdx) {
      if (seenO.has(start)) continue;
      const grp = [];
      const stack = [start];
      seenO.add(start);
      while (stack.length) {
        const cur = stack.pop();
        grp.push(cur);
        for (const cand of oIdx) {
          if (!seenO.has(cand) && edgeGap(items[cur], items[cand]) <= THRESHOLDS.rivalTightMax) {
            seenO.add(cand);
            stack.push(cand);
          }
        }
      }
      outerGroups.push(grp);
    }
    outerGroups.sort((a, b) => b.length - a.length);
    const bigOuter = outerGroups[0];
    if (bigOuter && bigOuter.length >= 3) {
      const coreW = coreItems.reduce((s, it) => s + it.area, 0);
      const rivalW = bigOuter.reduce((s, idx) => s + items[idx].area, 0);
      if (rivalW / Math.max(coreW, 1) >= 0.36) {
        hasRivalCluster = true;
        rivalInfo = { count: bigOuter.length, weightRatio: rivalW / Math.max(coreW, 1) };
      }
    }
  }

  // 5. 计算视觉权重占比（考虑主簇底圆共同区域与外围低对比反差）
  const visualWeight = (it, inCore) => {
    const contrastBoost = inCore
      ? it.tone === "cream-core"
        ? 1.55
        : it.isAnchor
        ? 1.38
        : 1.18
      : it.tone === "indigo-sat"
      ? 1.05
      : 0.62;
    return it.area * contrastBoost;
  };
  let coreWeight = 0;
  let totalWeight = 0;
  for (let i = 0; i < n; i++) {
    const inC = coreSet.has(i);
    const w = visualWeight(items[i], inC);
    totalWeight += w;
    if (inC) coreWeight += w;
  }
  const focusShare = totalWeight > 0 ? coreWeight / totalWeight : 0;

  // 6. 计算主簇内部面积层级比（最大 ÷ 最小）
  let scaleRatio = 1;
  let anchorInCore = false;
  if (coreItems.length >= 2) {
    const areas = coreItems.map((it) => it.area);
    scaleRatio = Math.max(...areas) / Math.max(1, Math.min(...areas));
    anchorInCore = coreItems.some((it) => it.isAnchor);
  } else if (coreItems.length === 1) {
    anchorInCore = coreItems[0].isAnchor;
  }

  // 7. 计算主簇包围圆（供画布绘制 061 原海报的电光靛紫底圆，完全实时算！）
  let shell = { x: CORE_CENTER.x, y: CORE_CENTER.y, r: 174, formed: false };
  if (coreItems.length >= 3) {
    // 质心
    let sx = 0;
    let sy = 0;
    let sw = 0;
    for (const it of coreItems) {
      const w = it.r * it.r;
      sx += it.x * w;
      sy += it.y * w;
      sw += w;
    }
    const cx = sx / sw;
    const cy = sy / sw;
    let maxReach = 0;
    for (const it of coreItems) {
      const reach = Math.hypot(it.x - cx, it.y - cy) + (it.shape === "square" ? it.r * 1.28 : it.r);
      if (reach > maxReach) maxReach = reach;
    }
    shell = {
      x: cx,
      y: cy,
      r: clamp(maxReach + 30, 118, 224),
      formed: bestSplit.sepRatio >= 1.35 || coreItems.length >= 8,
    };
  }

  // 8. 四项原海报原则的真实达标判定
  const isCrowded = minGlobalGap < THRESHOLDS.minGapSafe;
  const isOverpacked = coreItems.length >= 8;
  const isTooFew = coreItems.length < 3;
  const isScattered = bestSplit.sepRatio < THRESHOLDS.sepRatioMin && !isOverpacked;

  const checks = {
    grouping:
      coreItems.length >= THRESHOLDS.coreCountMin &&
      coreItems.length <= THRESHOLDS.coreCountMax &&
      !hasRivalCluster &&
      !isScattered,
    proximity:
      bestSplit.sepRatio >= THRESHOLDS.sepRatioMin &&
      !isCrowded &&
      !isOverpacked &&
      !isTooFew,
    focus:
      focusShare >= THRESHOLDS.focusWeightMin &&
      focusShare <= THRESHOLDS.focusWeightMax &&
      !hasRivalCluster &&
      !isScattered,
    hierarchy:
      coreItems.length >= 3 &&
      anchorInCore &&
      scaleRatio >= THRESHOLDS.scaleRatioMin &&
      !isCrowded,
  };

  const passCount = Object.values(checks).filter(Boolean).length;

  // 9. 严格优先级诊错：每次只说清当前最关键的一条问题和视觉原因
  let status = "ok";
  let badge = "成立 · 清晰成簇";
  let headline = "主簇紧聚有主次，外围退让成护城河";
  let reason = `簇外最近距是簇内距的 ${bestSplit.sepRatio.toFixed(1)}×（经验 ≥1.8×），9 枚零散元素被打包成「1 个强聚焦主簇 + ${outerItems.length} 枚弱化卫星」。眼睛不再逐个清点，第一眼直落主角大方块，再顺势扫向辅元。`;
  let actionHint = state.showShell
    ? "试试点「底圆壳：隐」撤掉深紫背景圆——真正的聚类靠距离比本身就能一眼站住。"
    : "连深紫底圆都撤掉了，你的聚类依然一眼分明——这正是纯邻近律在独立起效。";

  if (isCrowded) {
    status = "error";
    badge = "错态 · 过挤黏连";
    headline =
      minGlobalGap < 0
        ? `元素互撞重叠 ${Math.abs(Math.round(minGlobalGap))} 单位，边界糊成一团`
        : "簇内净隙缩到窒息线以下，亲密变成了拥挤";
    reason =
      "聚类不是把东西硬压在一起。一旦元素边到边净隙跌破安全值，图形轮廓开始互相吞咬，人眼辨识单个形状的成本飙升，反而失去清晰感。";
    actionHint = "把引力拨轨稍微往左回调到甜区（约 68%–78%），或直接把撞在一起的元素稍微拉开。";
  } else if (isOverpacked) {
    status = "error";
    badge = "错态 · 全员成坨";
    headline = `${coreItems.length}/9 全部塞进主簇，画面失去弱化反衬`;
    reason =
      "把所有东西都圈成一团，等于没有任何轻重取舍。没有远离主簇的弱化区和大片留白作对照，主簇只会显得笨重发堵，反而失去了聚焦感。";
    actionHint = "选中 3–4 枚淡紫次要元素，点「移出弱化区」或把它们拖离核心，留出留白护城河。";
  } else if (isTooFew || isScattered) {
    status = "error";
    badge = "错态 · 分散平权";
    headline =
      isTooFew
        ? "9 枚元素均匀摊满画布，没有形成任何视觉主簇"
        : `分离比仅 ${bestSplit.sepRatio.toFixed(1)}×，簇内外距离拉不开（经验 ≥1.8×）`;
    reason =
      "这正是原海报左下角的「分散构图」错态：每两个元素隔得差不多远，格式塔邻近律无法触发，眼睛被迫做 9 次分散跳跃，关系模糊、找不到起点。";
    actionHint = "向右拖动底沿「邻近引力轨」，让核心 5 件彼此靠拢，同时把外围 4 件推离留出呼吸空隙。";
  } else if (hasRivalCluster) {
    status = "error";
    badge = "错态 · 双簇争锋";
    headline = `外围 ${rivalInfo.count} 件抱团过紧，长出了抢戏的第二主簇`;
    reason =
      "聚类的核心是「一个强聚焦区配低权重弱化区」。现在外围弱化件自己凑成另一坨高密度群组，与主簇分庭抗礼，读者视线在两团之间左右打架。";
    actionHint = "把外围抱团的几枚元素拖散到不同角落，拉开彼此距离，让它们真正退成轻量卫星。";
  } else if (!anchorInCore || scaleRatio < THRESHOLDS.scaleRatioMin) {
    status = "error";
    badge = "错态 · 簇内无主";
    headline = !anchorInCore
      ? "主视觉大方块掉出了主簇，聚拢后依然群龙无首"
      : `簇内体量比仅 ${scaleRatio.toFixed(1)}×，小零件平权看不出重点`;
    reason =
      "聚成一簇只是第一步，簇内还要分出「一大带多小」的主次层级。缺了最大体量的视觉锚点，读者目光进圈后仍会打转。";
    actionHint = "选中「主视觉大方块」，点「收进主簇」或直接把它拖回深紫核心圆内。";
  } else if (passCount < 4) {
    status = "warn";
    badge = "微调 · 接近成立";
    headline = `已达标 ${passCount}/4，再微调簇内成员或内外间距`;
    reason = `当前主簇包含 ${coreItems.length} 件、视觉占比 ${Math.round(focusShare * 100)}%（经验 56%–84%）、分离比 ${bestSplit.sepRatio.toFixed(1)}×。`;
    actionHint = "把主簇成员稳定在 4–6 件，并保持清晰的内紧外疏即可全部点亮。";
  }

  return {
    items,
    mst,
    collisions,
    coreSet,
    coreItems,
    outerItems,
    dInMax: bestSplit.dInMax,
    dOutMin: bestSplit.dOutMin,
    sepRatio: bestSplit.sepRatio,
    nearestBridge: bestSplit.nearestBridge,
    minCoreGap,
    minGlobalGap,
    focusShare,
    scaleRatio,
    anchorInCore,
    hasRivalCluster,
    shell,
    checks,
    passCount,
    status,
    badge,
    headline,
    reason,
    actionHint,
  };
}

// 02 节：纯距离律（Kubovy, Holcombe, & Wagemans 1998 指数衰减示意）
export function evaluateLattice(dx, dy) {
  const ratio = dy / dx;
  // 偏向度：ln(ratio) 的双曲正切映射，严格标注「示意倾向」
  const diff = Math.abs(Math.log(ratio));
  const bias = Math.min(0.99, Math.tanh(diff * 2.2));
  let mode = "ambiguous";
  let title = "双稳态临界点（1 : 1）";
  let detail =
    "横向距与纵向距几乎相等，大脑在「看成 5 行横排」和「看成 5 列竖排」之间反复摇摆——这也是等距网格缺乏阅读方向感的原因。";
  if (ratio > 1.14) {
    mode = "rows";
    title = `锁定为横向成行（纵/横 = ${ratio.toFixed(2)}×）`;
    detail =
      "点与点左右更近、上下更远。依据 Kubovy 等人 (1998) 的纯距离律，只要把行距拉大到列距的 1.2 倍以上，横排归属就会迅速压倒竖排。";
  } else if (ratio < 0.88) {
    mode = "cols";
    title = `翻转为纵向成列（横/纵 = ${(1 / ratio).toFixed(2)}×）`;
    detail =
      "点与点上下更近、左右更远。没有任何连线或颜色改变，仅仅翻转相对距离比，整张点阵就在眼前瞬间拧成了 5 条竖柱。";
  }
  return { ratio, bias, mode, title, detail };
}

// 03 节：共同区域（Palmer 1992）与邻近、相似的三力拔河
export function evaluateTugOfWar({ proximity, region, similarity }) {
  // 6 个点索引 0..5：
  // proximity: (0,1)(2,3)(4,5) 靠近；region: (1,2)(3,4) 跨界套底框；similarity: (0,1)(2,3)(4,5) 同色
  if (region && !proximity && !similarity) {
    return {
      winner: "共同区域主导",
      grouping: "1 · [2–3] · [4–5] · 6",
      text: "元素彼此等距、颜色相同，但两枚电光靛紫底框直接把 2–3 与 4–5 圈成两组——这就是 Stephen Palmer (1992) 提出的「共同区域原则」：边界容器能凭空造出归属。",
    };
  }
  if (proximity && region && !similarity) {
    return {
      winner: "底框反杀邻近",
      grouping: "距离说 (1–2)(3–4)(5–6)，底框强改 [2–3][4–5]",
      text: "即使 1 和 2 贴得更近，套在 2–3 外面的封闭底框依然能强行改写人的第一眼分组！这也是界面设计里「框线和间距打架」时最常见的视觉噪音源。",
    };
  }
  if (proximity && region && similarity) {
    return {
      winner: "三力拉锯 · 视觉冲突",
      grouping: "邻近+同色指向 (1–2)(3–4)(5–6)，底框硬拆 [2–3][4–5]",
      text: "距离与颜色在拉一边，底框却往反方向劈开它们。大脑必须费力仲裁该听谁的——真正高级的聚类构图（如 061 原海报）一定让底圆、距离与色调站在同一战线。",
    };
  }
  if (proximity && !region && similarity) {
    return {
      winner: "邻近 + 相似同盟（无框最清朗）",
      grouping: "(1–2) · (3–4) · (5–6)",
      text: "去掉多余底框，距离和色相合力指向同一套分组，既清楚又轻盈。很多页面本来靠留白就能分清，硬加卡片边框反而平添噪音。",
    };
  }
  if (proximity && !region && !similarity) {
    return {
      winner: "纯邻近独立成组",
      grouping: "(1–2) · (3–4) · (5–6)",
      text: "没有底框、没有色差，仅仅靠「组内紧、组间疏」的距离差，6 枚一模一样的圆立刻被读成三对。邻近是成本最低、干扰最少的分组手段。",
    };
  }
  if (!proximity && !region && similarity) {
    return {
      winner: "纯色相相似分组",
      grouping: "(1–2) · (3–4) · (5–6)",
      text: "间距完全相等时，人眼退而求其次按颜色归类；但比起拉近距离，眼睛仍要跨越同样宽的空隙，整体感弱于邻近。",
    };
  }
  if (!proximity && region && similarity) {
    return {
      winner: "底框与色相冲突",
      grouping: "颜色配对 (1–2)(3–4)(5–6)，底框强圈 [2–3][4–5]",
      text: "封闭底框的边界信号通常压过弱色差：读者会先按底框读成 [2–3] 和 [4–5]，再困惑为什么同框里的两个点颜色不一样。",
    };
  }
  return {
    winner: "均等无组（平权队列）",
    grouping: "1 · 2 · 3 · 4 · 5 · 6",
    text: "距离相等、无底框、无色差：6 枚圆彼此平权，没有任何成簇线索。打开下方任意开关，看看不同分组力量怎么接管你的眼睛。",
  };
}
