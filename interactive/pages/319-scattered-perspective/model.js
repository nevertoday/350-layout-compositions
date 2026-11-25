// 319 散点透视 · 单一真相源（model.js）
// 全部坐标归一化在画布 0..1，画布绘制、左侧三环、白话诊单、顶部状态章全部只读本模块算出的结果。

export const TIERS = {
  primary: { id: "primary", label: "主锚", weight: 3.3, radius: 0.105 },
  secondary: { id: "secondary", label: "次点", weight: 1.9, radius: 0.074 },
  minor: { id: "minor", label: "微应", weight: 1.05, radius: 0.052 },
  micro: { id: "micro", label: "极微", weight: 0.55, radius: 0.036 },
};

export const ANGLES = {
  level: { id: "level", label: "平视", tag: "LEVEL" },
  bird: { id: "bird", label: "俯瞰", tag: "BIRD" },
  up: { id: "up", label: "仰观", tag: "UPWARD" },
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报星图",
    names: { A: "视点 A", B: "视点 B", C: "中枢 C", D: "视点 D", E: "视点 E" },
    subs: { A: "VIEW A", B: "VIEW B", C: "CENTER C", D: "VIEW D", E: "VIEW E" },
  },
  scroll: {
    id: "scroll",
    label: "汴河长卷",
    names: { A: "郊林 A", B: "渡口 B", C: "虹桥 C", D: "城门 D", E: "瓦肆 E" },
    subs: { A: "GROVE", B: "FERRY", C: "BRIDGE", D: "GATE", E: "MARKET" },
  },
  banquet: {
    id: "banquet",
    label: "夜宴五屏",
    names: { A: "听乐 A", B: "观舞 B", C: "暂歇 C", D: "清吹 D", E: "散宴 E" },
    subs: { A: "PIPA", B: "DANCE", C: "REST", D: "FLUTE", E: "FAREWELL" },
  },
};

export const LINK_MODES = {
  none: { id: "none", label: "断开孤岛" },
  curve: { id: "curve", label: "曲径串联" },
  hub: { id: "hub", label: "主辅呼应" },
  chaos: { id: "chaos", label: "全连蛛网" },
};

export const PRESETS = {
  // 开场 0/4 翻车错态：单灭点锁死 + 五点团挤偏左（C 卡在正中方便上手拖散，同时避免文字互相叠死）+ 平权均分 + 断开孤岛
  broken: {
    perspective: "single",
    linkMode: "none",
    selected: "C",
    nodes: [
      { id: "A", u: 0.31, v: 0.34, tier: "secondary", angle: "level" },
      { id: "B", u: 0.52, v: 0.32, tier: "secondary", angle: "level" },
      { id: "C", u: 0.50, v: 0.52, tier: "secondary", angle: "level" },
      { id: "D", u: 0.39, v: 0.67, tier: "secondary", angle: "level" },
      { id: "E", u: 0.23, v: 0.51, tier: "secondary", angle: "level" },
    ],
  },
  // 正当解 1：1:1 承袭 319 原海报五视点星座格局（左上视点 A 孤远留白，中枢 C 与 D 呼应成密）
  poster: {
    perspective: "scattered",
    linkMode: "curve",
    selected: "C",
    nodes: [
      { id: "A", u: 0.17, v: 0.16, tier: "secondary", angle: "bird" },
      { id: "B", u: 0.82, v: 0.24, tier: "secondary", angle: "up" },
      { id: "C", u: 0.49, v: 0.45, tier: "primary", angle: "level" },
      { id: "D", u: 0.67, v: 0.64, tier: "minor", angle: "bird" },
      { id: "E", u: 0.46, v: 0.85, tier: "minor", angle: "up" },
    ],
  },
  // 正当解 2：长卷 S 脉错落展开（右密左疏的节奏呼应）
  scroll: {
    perspective: "scattered",
    linkMode: "curve",
    selected: "C",
    nodes: [
      { id: "A", u: 0.14, v: 0.64, tier: "minor", angle: "level" },
      { id: "B", u: 0.35, v: 0.24, tier: "secondary", angle: "bird" },
      { id: "C", u: 0.56, v: 0.46, tier: "primary", angle: "bird" },
      { id: "D", u: 0.83, v: 0.30, tier: "secondary", angle: "up" },
      { id: "E", u: 0.72, v: 0.72, tier: "minor", angle: "level" },
    ],
  },
  // 正当解 3：主辅放射呼应解
  hub: {
    perspective: "scattered",
    linkMode: "hub",
    selected: "C",
    nodes: [
      { id: "A", u: 0.22, v: 0.24, tier: "secondary", angle: "bird" },
      { id: "B", u: 0.82, v: 0.20, tier: "minor", angle: "up" },
      { id: "C", u: 0.44, v: 0.50, tier: "primary", angle: "level" },
      { id: "D", u: 0.76, v: 0.69, tier: "secondary", angle: "bird" },
      { id: "E", u: 0.27, v: 0.74, tier: "minor", angle: "level" },
    ],
  },
  // 反面压测：机械等距五点网格（散开了但死板无疏密）
  gridTrap: {
    perspective: "scattered",
    linkMode: "curve",
    selected: "C",
    nodes: [
      { id: "A", u: 0.25, v: 0.25, tier: "secondary", angle: "level" },
      { id: "B", u: 0.75, v: 0.25, tier: "secondary", angle: "level" },
      { id: "C", u: 0.50, v: 0.50, tier: "primary", angle: "level" },
      { id: "D", u: 0.75, v: 0.75, tier: "minor", angle: "level" },
      { id: "E", u: 0.25, v: 0.75, tier: "minor", angle: "level" },
    ],
  },
};

export function clonePreset(name = "broken", theme = "poster") {
  const p = PRESETS[name] || PRESETS.broken;
  return {
    theme,
    perspective: p.perspective,
    linkMode: p.linkMode,
    selected: p.selected,
    guides: true,
    nodes: p.nodes.map((n) => ({ ...n })),
  };
}

export function clampNodePos(u, v) {
  return {
    u: Math.max(0.05, Math.min(0.95, u)),
    v: Math.max(0.06, Math.min(0.94, v)),
  };
}

// 计算曲线串联的拓扑序（尽量贴合原海报星图连脉，避免无意义的折返打结）
export function computeLinkPairs(state) {
  const { nodes, linkMode } = state;
  if (linkMode === "none") return [];
  if (linkMode === "chaos") {
    const pairs = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) pairs.push([nodes[i], nodes[j]]);
    }
    return pairs;
  }
  if (linkMode === "hub") {
    // 找权重最高者作主锚
    let hub = nodes[0];
    for (const n of nodes) {
      if (TIERS[n.tier].weight > TIERS[hub.tier].weight) hub = n;
    }
    return nodes.filter((n) => n.id !== hub.id).map((n) => [hub, n]);
  }
  // curve：按最近邻贪心链（从最左上节点起手）串出顺畅折径，不走回头乱结
  const remaining = [...nodes];
  remaining.sort((a, b) => a.u + a.v * 1.15 - (b.u + b.v * 1.15));
  const chain = [remaining.shift()];
  while (remaining.length) {
    const cur = chain[chain.length - 1];
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].u - cur.u, remaining[i].v - cur.v);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    chain.push(remaining.splice(bestIdx, 1)[0]);
  }
  const pairs = [];
  for (let i = 0; i < chain.length - 1; i++) pairs.push([chain[i], chain[i + 1]]);
  return pairs;
}

// 线段相交检测（用来实算是否打结成乱麻）
function segmentsIntersect(a, b, c, d) {
  const ccw = (p1, p2, p3) => (p3.v - p1.v) * (p2.u - p1.u) > (p2.v - p1.v) * (p3.u - p1.u);
  if (a.id === c.id || a.id === d.id || b.id === c.id || b.id === d.id) return false;
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

// 单真源几何诊断引擎
export function evaluate(state) {
  const { nodes, perspective, linkMode } = state;

  // 1. 间距、跨度与最近邻分布
  let minDist = Infinity;
  let closestPair = [nodes[0], nodes[1]];
  const allDists = [];
  const nnDists = [];
  let minU = 1, maxU = 0, minV = 1, maxV = 0;

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    if (a.u < minU) minU = a.u;
    if (a.u > maxU) maxU = a.u;
    if (a.v < minV) minV = a.v;
    if (a.v > maxV) maxV = a.v;
    let nearest = Infinity;
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(a.u - nodes[j].u, a.v - nodes[j].v);
      if (d < nearest) nearest = d;
      if (j > i) {
        allDists.push(d);
        if (d < minDist) {
          minDist = d;
          closestPair = [a, nodes[j]];
        }
      }
    }
    nnDists.push(nearest);
  }

  const spanW = maxU - minU;
  const spanH = maxV - minV;
  const spreadArea = spanW * spanH; // 0..1 包围盒面积

  // 疏密节奏变异系数（结合最近邻 CV 与整体间距 CV）
  const meanNN = nnDists.reduce((s, x) => s + x, 0) / nnDists.length;
  const stdNN = Math.sqrt(nnDists.reduce((s, x) => s + (x - meanNN) ** 2, 0) / nnDists.length);
  const nnCV = meanNN > 1e-4 ? stdNN / meanNN : 0;

  // 检测共线或规则对称矩阵：若 5 点落进极窄长带，或四个外点距离画心几乎相等且最近邻极均匀
  const radialDists = nodes.map((n) => Math.hypot(n.u - 0.5, n.v - 0.5)).sort((a, b) => a - b);
  const outerRadials = radialDists.slice(1); // 除最靠近中心的 1 个外
  const meanOuter = outerRadials.reduce((s, x) => s + x, 0) / outerRadials.length;
  const stdOuter = Math.sqrt(outerRadials.reduce((s, x) => s + (x - meanOuter) ** 2, 0) / outerRadials.length);
  const outerRadialCV = meanOuter > 1e-4 ? stdOuter / meanOuter : 0;

  const isCollinear = (spanW > 0.35 && spanH < 0.14) || (spanH > 0.35 && spanW < 0.14);
  const isSymmetricGrid = nnCV < 0.13 && outerRadialCV < 0.08 && spreadArea >= 0.20;
  const rhythmCV = Number(nnCV.toFixed(2));

  // 2. 贴边检测
  const edgeNodes = nodes.filter((n) => n.u < 0.095 || n.u > 0.905 || n.v < 0.105 || n.v > 0.895);

  // 3. 加权视觉重心与权重主次
  let sumW = 0, sumWU = 0, sumWV = 0;
  let maxW = 0, minW = Infinity;
  let primaryNode = nodes[0];
  for (const n of nodes) {
    const w = TIERS[n.tier].weight;
    sumW += w;
    sumWU += w * n.u;
    sumWV += w * n.v;
    if (w > maxW) {
      maxW = w;
      primaryNode = n;
    }
    if (w < minW) minW = w;
  }
  const centroid = { u: sumWU / sumW, v: sumWV / sumW };
  const balanceOffset = Math.hypot(centroid.u - 0.5, centroid.v - 0.5);
  const weightRatio = maxW / Math.max(0.1, minW);
  const maxShare = maxW / sumW;

  // 4. 连脉与交叉统计
  const pairs = computeLinkPairs(state);
  let crossings = 0;
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      if (segmentsIntersect(pairs[i][0], pairs[i][1], pairs[j][0], pairs[j][1])) crossings++;
    }
  }

  // 5. 四项核心检核
  const clumped = minDist < 0.165 || spreadArea < 0.24;
  const edgeClip = edgeNodes.length > 0;
  const gridRigid = !clumped && (isCollinear || isSymmetricGrid || nnCV < 0.11);
  const lopsided = balanceOffset > 0.145;

  const flatWeights = weightRatio < 1.48;
  const monopoly = maxShare > 0.50;

  const okPerspective = perspective === "scattered";
  const okDistribution = !clumped && !edgeClip && !gridRigid && !lopsided;
  const okHierarchy = !flatWeights && !monopoly;
  const okLinks = linkMode === "curve" || linkMode === "hub";

  const passed = [okPerspective, okDistribution, okHierarchy, okLinks].filter(Boolean).length;

  // 6. 最高优先级错态诊断（按构图因果顺序，始终给出可验证的「为什么」与操作指引）
  let diag;
  if (!okPerspective) {
    diag = {
      ok: false,
      code: "locked_single",
      badge: "错态 · 单点锁死",
      headline: "五处视点被单一灭点拉扯压扁，信息挤作一团",
      why: "强行用单一定点透视统摄多处景物，离灭点越远的视点透视压缩越剧烈，边缘形态歪斜看不清细节——散点透视的第一步，是撤销唯一消失点的垄断。",
      action: "点画布上方「多视点独立」，先解放 5 个视点的各自视角，再拖开挤在画心的视点环。",
    };
  } else if (clumped) {
    const pctArea = Math.round(spreadArea * 100);
    diag = {
      ok: false,
      code: "clumped",
      badge: "错态 · 团挤塌心",
      headline: `视点${closestPair[0].id}与${closestPair[1].id}相距仅 ${Math.round(minDist * 100)}%，五点覆盖仅 ${pctArea}%`,
      why: "五个视觉中心挤在同一块区域里互相打架，画布其余空间大面积死黑空转，视线没有起伏游走的余地。",
      action: `直接拖开画布中央的视点 ${closestPair[0].id} 或 ${closestPair[1].id}，让五点覆盖跨度拉开到 25% 以上、两两间距不小于 17%。`,
    };
  } else if (edgeClip) {
    const names = edgeNodes.map((n) => `视点 ${n.id}`).join("、");
    diag = {
      ok: false,
      code: "edge_clip",
      badge: "错态 · 贴边掉框",
      headline: `${names}太贴近画框边缘，外环视线滑出画面`,
      why: "散点透视讲究「外放而不散逸」：节点一旦逼近边距 10% 以内，同心视点环会被画框硬生生切掉，观者目光会顺势滑出页面。",
      action: `把${names}往画内轻拉回安全区（距四边至少留出 10% 呼吸余白）。`,
    };
  } else if (gridRigid) {
    diag = {
      ok: false,
      code: "grid_rigid",
      badge: "错态 · 等距僵死",
      headline: isCollinear ? "五处视点排成一条直线，失去面状空间感" : `间距疏密差 CV 仅 ${rhythmCV}，退化成机械等距网格`,
      why: "「散开」不等于「平均洒胡椒面」。间距过于规整或对称，大脑立刻把它当成表格图标阵，看不到中国画讲的聚散疏密与呼吸节奏。",
      action: "试着把任意两个视点拖成一组近邻呼应，同时把另一处拉远留出大片留白，让疏密差 CV 超过 0.12。",
    };
  } else if (lopsided) {
    const dirX = centroid.u < 0.44 ? "偏左" : centroid.u > 0.56 ? "偏右" : "";
    const dirY = centroid.v < 0.44 ? "偏上" : centroid.v > 0.56 ? "偏下" : "";
    diag = {
      ok: false,
      code: "lopsided",
      badge: "错态 · 重心偏沉",
      headline: `加权视觉重心${dirX}${dirY}偏移 ${Math.round(balanceOffset * 100)}%，画布半边发空`,
      why: "散点构图可以不对称，但整体视觉重量必须守恒。当前重块与多点扎堆在一侧，另一侧只剩空洞背景，整张画面像秤杆失衡。",
      action: "把一处视点往空阔对角挪移，或提升对侧视点的权重档位来配平总重心（经验带 ≤ 14%）。",
    };
  } else if (flatWeights) {
    diag = {
      ok: false,
      code: "flat_weights",
      badge: "错态 · 平权抢戏",
      headline: `最强与最弱视点跨比仅 ${weightRatio.toFixed(2)}×，五处同时喊你来看`,
      why: "多个视点并不意味着「人人平权」。当五个中心一样大、一样亮，眼睛刚落到 A 就被 B 和 C 拉走，最后谁也记不住。",
      action: "点选一个核心视点（如中枢 C）设为「主锚」，把另外两处降为「微应」，拉出 1.5× 以上的主次层级。",
    };
  } else if (monopoly) {
    diag = {
      ok: false,
      code: "monopoly",
      badge: "错态 · 孤点霸屏",
      headline: `视点 ${primaryNode.id} 独占 ${Math.round(maxShare * 100)}% 视觉权重，退回单中心`,
      why: "主锚过胖而其余四点缩成微弱噪点，画面只剩一个孤立中心，散点透视「多点共同构成」的优势完全失效。",
      action: "把一到两个辅点升回「次点」，让最强单点占比回落到 50% 以下，形成「一主多辅」的协同网络。",
    };
  } else if (linkMode === "none") {
    diag = {
      ok: false,
      code: "disconnected",
      badge: "错态 · 散而不联",
      headline: "五个视点已摆开位置，但彼此断开成了五座孤岛",
      why: "没有隐形动线、朝向呼应或节奏纽带，观者看完一处不知道下一眼该去哪里，画面碎成几张互不相干的贴纸。",
      action: "在下方「关系连脉」切换「曲径串联」或「主辅呼应」，用克制的虚线路径把五点织成整体。",
    };
  } else if (linkMode === "chaos") {
    diag = {
      ok: false,
      code: "web_chaos",
      badge: "错态 · 乱网遮白",
      headline: `10 条连线两两硬连、产生 ${crossings} 处交叉，糊死了留白呼吸`,
      why: "关系连接贵在「隐而不繁、点到为止」。把每两个点都硬连成蛛网，线条本身抢走了主体风头，画面反而变得焦躁杂乱。",
      action: "把「关系连脉」切回「曲径串联」或「主辅呼应」，只保留引导视线顺序的主脉络。",
    };
  } else {
    const modeLabel = linkMode === "hub" ? "主辅放射呼应" : "曲径串联通脉";
    diag = {
      ok: true,
      code: "balanced",
      badge: "已成脉 · 4 / 4",
      headline: `五视点各自独立，以视点 ${primaryNode.id} 领衔、${modeLabel}`,
      why: `视点跨度 ${Math.round(spreadArea * 100)}%、疏密差 CV ${rhythmCV}、主次跨比 ${weightRatio.toFixed(1)}×、总重心偏移仅 ${Math.round(balanceOffset * 100)}%。眼睛可由主锚起笔，顺着虚线从容切换每一处独立视角。`,
      action: "试试换用「长卷 S 脉解」「汴河长卷 / 夜宴五屏」，或故意切回「全连蛛网 / 等距僵死」压测边界。",
    };
  }

  // 给左侧三枚原海报圆环的实时短签（单真源同步）
  const rings = {
    views: {
      ok: okPerspective,
      tag: okPerspective ? "5 视点独立" : "单灭点锁死",
    },
    dist: {
      ok: okDistribution,
      tag: clumped
        ? `团挤 ${Math.round(spreadArea * 100)}%`
        : edgeClip
          ? "贴边掉框"
          : gridRigid
            ? `等距 CV ${rhythmCV}`
            : lopsided
              ? `偏心 ${Math.round(balanceOffset * 100)}%`
              : `疏密 CV ${rhythmCV}`,
    },
    rhythm: {
      ok: okHierarchy && okLinks,
      tag: flatWeights
        ? `平权 ${weightRatio.toFixed(1)}×`
        : monopoly
          ? `独大 ${Math.round(maxShare * 100)}%`
          : linkMode === "none"
            ? "断脉孤岛"
            : linkMode === "chaos"
              ? `乱网 ${crossings} 交`
              : `主次 ${weightRatio.toFixed(1)}× · 通脉`,
    },
  };

  return {
    passed,
    total: 4,
    okPerspective,
    okDistribution,
    okHierarchy,
    okLinks,
    clumped,
    edgeClip,
    edgeNodes,
    gridRigid,
    lopsided,
    flatWeights,
    monopoly,
    minDist,
    closestPair,
    spreadArea,
    rhythmCV,
    centroid,
    balanceOffset,
    weightRatio,
    maxShare,
    primaryNode,
    pairs,
    crossings,
    diag,
    rings,
  };
}
