// 037 S 形构图 · 单真源几何模型（model.js）
// 全部读数、曲率波形 κ(t)、拐点检测、留白率、错态诊断、荷加斯七线谱与眼动对照均从同一套实绘曲线方程实时算出。

export const SAMPLE_COUNT = 120;

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·山溪动线",
    shortLabel: "原海报",
    subtitle: "1:1 化用 037 原海报四枚节点圆徽与中央圆窗溪山",
    stations: [
      { id: "entry", name: "视线游走", en: "VISUAL FLOW", role: "入口起点", tone: "aqua", icon: "eye", defaultT: 0.08 },
      { id: "rhythm", name: "节奏起伏", en: "VISUAL RHYTHM", role: "上弯节奏核", tone: "lime", icon: "pulse", defaultT: 0.34 },
      { id: "flow", name: "柔和动势", en: "SOFT MOVEMENT", role: "下弯过渡核", tone: "aqua", icon: "wave", defaultT: 0.66 },
      { id: "hierarchy", name: "层级串联", en: "HIERARCHY LINK", role: "终点落位", tone: "lime", icon: "layers", defaultT: 0.90 },
    ],
    blocks: [
      { side: -1, v: 0.24, title: "起势引读", lines: 2 },
      { side: 1, v: 0.40, title: "缓弯留韵", lines: 2 },
      { side: -1, v: 0.68, title: "层级承接", lines: 2 },
      { side: 1, v: 0.80, title: "收束余白", lines: 2 },
    ],
  },
  tea: {
    id: "tea",
    label: "长幅·茶道展讯",
    shortLabel: "茶道展讯",
    subtitle: "竖版文化海报：题名起势 → 器物上弯 → 溪山主视觉 → 展期收尾",
    stations: [
      { id: "entry", name: "秋山茶集", en: "EXHIBITION", role: "主标题入口", tone: "aqua", icon: "eye", defaultT: 0.09 },
      { id: "rhythm", name: "松烟茶器", en: "TEA VESSEL", role: "上弯器物焦", tone: "lime", icon: "pulse", defaultT: 0.34 },
      { id: "flow", name: "曲水席位", en: "CURVED HALL", role: "下弯展厅导览", tone: "aqua", icon: "wave", defaultT: 0.67 },
      { id: "hierarchy", name: "预约入席", en: "RSVP · 10.18", role: "出口行动点", tone: "lime", icon: "layers", defaultT: 0.90 },
    ],
    blocks: [
      { side: -1, v: 0.24, title: "拾月十八日", lines: 2 },
      { side: 1, v: 0.40, title: "溪亭品茗", lines: 2 },
      { side: -1, v: 0.68, title: "三场雅集", lines: 2 },
      { side: 1, v: 0.80, title: "扫码领券", lines: 2 },
    ],
  },
  road: {
    id: "road",
    label: "风光·盘山溪谷",
    shortLabel: "溪谷风光",
    subtitle: "摄影引导线：前景溪道 → 远山松林 → 云光峰谷 → 尽头归途",
    stations: [
      { id: "entry", name: "近景石阶", en: "FOREGROUND", role: "画面入口", tone: "aqua", icon: "eye", defaultT: 0.08 },
      { id: "rhythm", name: "松林左弯", en: "PINE BEND", role: "中景纵深转折", tone: "lime", icon: "pulse", defaultT: 0.34 },
      { id: "flow", name: "溪桥右回", en: "BRIDGE TURN", role: "远景衔接", tone: "aqua", icon: "wave", defaultT: 0.66 },
      { id: "hierarchy", name: "山巅晨光", en: "SUMMIT EXIT", role: "远方落点", tone: "lime", icon: "layers", defaultT: 0.91 },
    ],
    blocks: [
      { side: -1, v: 0.24, title: "近景压暗", lines: 2 },
      { side: 1, v: 0.40, title: "云气留白", lines: 2 },
      { side: -1, v: 0.68, title: "山脊呼应", lines: 2 },
      { side: 1, v: 0.80, title: "收束远峰", lines: 2 },
    ],
  },
};

// 多组合法解与初始错态（均在 [0,1] 归一化坐标下定义）
export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    bendTop: -0.43,     // 过急发卡弯（绝对值 > 0.35）
    bendBot: 0.16,      // 上下弯严重失衡（2.69x）
    exitPull: -0.78,    // 出口向画外边角甩飞
    crowd: 0.84,        // 岸边文字与体块堵死留白（< 25%）
    nodes: [
      { t: 0.08, offU: 0.0, offV: 0.0 },
      { t: 0.34, offU: 0.33, offV: -0.05 }, // 第 2 站脱轨漂到右上空洞
      { t: 0.66, offU: 0.0, offV: 0.0 },
      { t: 0.90, offU: 0.0, offV: 0.0 },
    ],
  },
  classic: {
    id: "classic",
    label: "原海报正 S 解",
    bendTop: -0.24,
    bendBot: 0.24,
    exitPull: 0.56,
    crowd: 0.24,
    nodes: [
      { t: 0.08, offU: 0, offV: 0 },
      { t: 0.34, offU: 0, offV: 0 },
      { t: 0.66, offU: 0, offV: 0 },
      { t: 0.90, offU: 0, offV: 0 },
    ],
  },
  reverse: {
    id: "reverse",
    label: "反 S 舒展解",
    bendTop: 0.27,
    bendBot: -0.25,
    exitPull: 0.52,
    crowd: 0.20,
    nodes: [
      { t: 0.09, offU: 0, offV: 0 },
      { t: 0.35, offU: 0, offV: 0 },
      { t: 0.66, offU: 0, offV: 0 },
      { t: 0.89, offU: 0, offV: 0 },
    ],
  },
  gentle: {
    id: "gentle",
    label: "荷加斯 4 号轻弧解",
    bendTop: -0.18,
    bendBot: 0.19,
    exitPull: 0.44,
    crowd: 0.16,
    nodes: [
      { t: 0.10, offU: 0, offV: 0 },
      { t: 0.36, offU: 0, offV: 0 },
      { t: 0.65, offU: 0, offV: 0 },
      { t: 0.88, offU: 0, offV: 0 },
    ],
  },
  tryC: {
    id: "tryC",
    label: "试错：同侧成 C",
    bendTop: -0.26,
    bendBot: -0.25,
    exitPull: 0.50,
    crowd: 0.24,
    nodes: [
      { t: 0.09, offU: 0, offV: 0 },
      { t: 0.35, offU: 0, offV: 0 },
      { t: 0.65, offU: 0, offV: 0 },
      { t: 0.90, offU: 0, offV: 0 },
    ],
  },
  tryStraight: {
    id: "tryStraight",
    label: "试错：过直僵硬",
    bendTop: -0.05,
    bendBot: 0.05,
    exitPull: 0.35,
    crowd: 0.24,
    nodes: [
      { t: 0.09, offU: 0, offV: 0 },
      { t: 0.35, offU: 0, offV: 0 },
      { t: 0.65, offU: 0, offV: 0 },
      { t: 0.90, offU: 0, offV: 0 },
    ],
  },
};

export function createInitialState() {
  return {
    scene: "poster",
    highlightStep: 0,
    ...clonePreset(PRESETS.broken),
  };
}

export function clonePreset(p) {
  return {
    bendTop: p.bendTop,
    bendBot: p.bendBot,
    exitPull: p.exitPull,
    crowd: p.crowd,
    nodes: p.nodes.map((n) => ({ ...n })),
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 两段 C¹ 连续三次贝塞尔控制点：统一支撑正 S、反 S、直线退化、C 形同侧退化与出口甩飞
export function getControlPoints(state) {
  const bt = clamp(state.bendTop, -0.46, 0.46);
  const bb = clamp(state.bendBot, -0.46, 0.46);
  const ep = clamp(state.exitPull, -1, 1);

  const midU = clamp(0.5 + (bt + bb) * 0.44, 0.2, 0.8);
  const midV = 0.5;
  // 中点切线水平分量：当 bt 与 bb 异号时斜穿中央形成拐点；同号时接近竖直形成平滑 C 腹
  const dxMid = (bb - bt) * 0.42;
  const dyMid = 0.135;

  const entryU = clamp(0.5 - bt * 0.56, 0.22, 0.78);
  const entryV = 0.11;

  // 出口：ep > 0 向画内回收成优雅 S 尾；ep < 0 向同侧外角直甩出框
  const signBot = bb === 0 ? (bt <= 0 ? 1 : -1) : Math.sign(bb);
  const inwardExitU = clamp(0.5 - signBot * (0.12 + Math.abs(bb) * 0.45), 0.22, 0.78);
  const bleedExitU = clamp(0.5 + signBot * (0.34 + Math.abs(bb) * 0.35), 0.04, 0.96);
  const exitU = ep >= 0
    ? 0.5 + (inwardExitU - 0.5) * (0.35 + 0.65 * ep)
    : inwardExitU + (bleedExitU - inwardExitU) * (-ep);
  const exitV = ep >= 0 ? 0.89 : 0.89 + (-ep) * 0.075;

  const a0 = { u: entryU, v: entryV };
  const a1 = { u: clamp(0.5 + bt * 1.32, 0.05, 0.95), v: 0.14 };
  const a2 = { u: clamp(midU - dxMid, 0.06, 0.94), v: midV - dyMid };
  const m = { u: midU, v: midV };

  const b0 = m;
  const b1 = { u: clamp(midU + dxMid, 0.06, 0.94), v: midV + dyMid };
  const b2 = {
    u: ep >= 0
      ? clamp(0.5 + bb * 1.32, 0.05, 0.95)
      : clamp(0.5 + bb * 1.15 + signBot * (-ep) * 0.12, 0.05, 0.95),
    v: ep >= 0 ? 0.86 : 0.80,
  };
  const b3 = { u: exitU, v: exitV };

  return { seg1: [a0, a1, a2, m], seg2: [b0, b1, b2, b3], mid: m };
}

function evalCubic(p0, p1, p2, p3, s) {
  const om = 1 - s;
  const u = om * om * om * p0.u + 3 * om * om * s * p1.u + 3 * om * s * s * p2.u + s * s * s * p3.u;
  const v = om * om * om * p0.v + 3 * om * om * s * p1.v + 3 * om * s * s * p2.v + s * s * s * p3.v;

  const du = 3 * om * om * (p1.u - p0.u) + 6 * om * s * (p2.u - p1.u) + 3 * s * s * (p3.u - p2.u);
  const dv = 3 * om * om * (p1.v - p0.v) + 6 * om * s * (p2.v - p1.v) + 3 * s * s * (p3.v - p2.v);

  const ddu = 6 * om * (p2.u - 2 * p1.u + p0.u) + 6 * s * (p3.u - 2 * p2.u + p1.u);
  const ddv = 6 * om * (p2.v - 2 * p1.v + p0.v) + 6 * s * (p3.v - 2 * p2.v + p1.v);

  const speed = Math.hypot(du, dv) || 1e-6;
  // 带符号曲率 κ = (x'y'' - y'x'') / (x'^2 + y'^2)^(3/2)
  const kappa = (du * ddv - dv * ddu) / (speed * speed * speed);
  return { u, v, du, dv, speed, kappa, tx: du / speed, ty: dv / speed };
}

export function pointAt(ctrl, t) {
  const tc = clamp(t, 0, 1);
  if (tc <= 0.5) {
    const pt = evalCubic(...ctrl.seg1, tc * 2);
    return { ...pt, t: tc };
  }
  const pt = evalCubic(...ctrl.seg2, (tc - 0.5) * 2);
  return { ...pt, t: tc };
}

export function sampleCurve(state, n = SAMPLE_COUNT) {
  const ctrl = getControlPoints(state);
  const pts = [];
  let arcLen = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = pointAt(ctrl, t);
    if (i > 0) arcLen += Math.hypot(p.u - pts[i - 1].u, p.v - pts[i - 1].v);
    pts.push({ ...p, sLen: arcLen });
  }
  return { ctrl, pts, arcLen };
}

// 寻找点 (u,v) 到已采样曲线的最短距离与对应参数 t
export function closestOnCurve(pts, u, v) {
  let best = { dist: Infinity, t: 0.5, idx: 0, pt: pts[0] };
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(u - pts[i].u, v - pts[i].v);
    if (d < best.dist) best = { dist: d, t: pts[i].t, idx: i, pt: pts[i] };
  }
  return best;
}

// 计算四枚信息站的真实画布坐标及距曲线偏移
export function resolveStations(state, sample) {
  const scene = SCENES[state.scene] || SCENES.poster;
  return state.nodes.map((node, idx) => {
    const base = pointAt(sample.ctrl, node.t);
    const u = clamp(base.u + node.offU, 0.08, 0.92);
    const v = clamp(base.v + node.offV, 0.08, 0.92);
    const nearest = closestOnCurve(sample.pts, u, v);
    const meta = scene.stations[idx];
    return {
      idx,
      ...meta,
      t: node.t,
      offU: node.offU,
      offV: node.offV,
      u,
      v,
      nearestT: nearest.t,
      nearestPt: nearest.pt,
      distToCurve: nearest.dist,
      attached: nearest.dist <= 0.082,
    };
  });
}

// 侧岸信息块与留白面积实算（单真源：画布画多大，就按多大算占空比）
export function computeShoreBlocks(state, sample) {
  const scene = SCENES[state.scene] || SCENES.poster;
  const crowd = clamp(state.crowd, 0, 1);
  const bw = 0.14 + crowd * 0.22;
  const bh = 0.072 + crowd * 0.105;
  return scene.blocks.map((b, i) => {
    // 避让或逼近河道边缘
    const atV = sample.pts.reduce((best, p) => (Math.abs(p.v - b.v) < Math.abs(best.v - b.v) ? p : best), sample.pts[0]);
    const rawU = b.side < 0 ? 0.045 : 0.955 - bw;
    // 随着 crowd 增高，块体向河道贴拢挤压呼吸缝
    const pull = crowd * 0.085;
    const u = b.side < 0 ? clamp(rawU + pull, 0.035, 0.54 - bw * 0.35) : clamp(rawU - pull, 0.46 - bw * 0.65, 0.965 - bw);
    const v = clamp(b.v - bh * 0.5, 0.10, 0.88 - bh);
    const edgeGap = b.side < 0 ? atV.u - (u + bw) : u - atV.u;
    return { ...b, idx: i, u, v, w: bw, h: bh, edgeGap };
  });
}

// 核心评估器：从实绘 120 点采样、4 站坐标、出口切线与岸块面积单一真源产出全部指标与白话诊断
export function evaluate(state) {
  const sample = sampleCurve(state);
  const { pts, ctrl } = sample;
  const stations = resolveStations(state, sample);
  const blocks = computeShoreBlocks(state, sample);

  // 1. 曲率 κ(t) 分析：上下半段极值与真实拐点（跳过首尾极短切线端加速段）
  const inner = pts.slice(10, pts.length - 10);
  let upperKappaPeak = 0;
  let lowerKappaPeak = 0;
  let upperSignSum = 0;
  let lowerSignSum = 0;
  let maxAbsKappa = 0;
  let minU = 1, maxU = 0;
  let topBellyPt = pts[30], botBellyPt = pts[90];
  let topEx = 0, botEx = 0;

  for (const p of inner) {
    if (p.u < minU) minU = p.u;
    if (p.u > maxU) maxU = p.u;
    const ak = Math.abs(p.kappa);
    if (ak > maxAbsKappa) maxAbsKappa = ak;
    if (p.t < 0.47) {
      upperSignSum += p.kappa;
      if (ak > Math.abs(upperKappaPeak)) upperKappaPeak = p.kappa;
      const dev = Math.abs(p.u - ctrl.mid.u);
      if (dev > topEx) { topEx = dev; topBellyPt = p; }
    } else if (p.t > 0.53) {
      lowerSignSum += p.kappa;
      if (ak > Math.abs(lowerKappaPeak)) lowerKappaPeak = p.kappa;
      const dev = Math.abs(p.u - ctrl.mid.u);
      if (dev > botEx) { botEx = dev; botBellyPt = p; }
    }
  }

  // 检测真实拐点（跳过首尾极短端，并要求两侧曲率幅度都超过噪声阈 0.45）
  let inflections = 0;
  let inflectionPt = ctrl.mid;
  let prevSign = 0;
  for (let i = 10; i < pts.length - 10; i++) {
    const k = pts[i].kappa;
    if (Math.abs(k) < 0.45) continue;
    const s = Math.sign(k);
    if (prevSign !== 0 && s !== prevSign) {
      inflections++;
      inflectionPt = pts[i];
    }
    prevSign = s;
  }

  const oppositeSigns = upperSignSum * lowerSignSum < -0.5 && Math.abs(upperKappaPeak) >= 0.65 && Math.abs(lowerKappaPeak) >= 0.65;
  const hasSingleInflection = oppositeSigns && inflections >= 1;

  // 水平总跨幅 & 上下摆幅（以画面宽度百分比表示）
  const spanPct = Math.round((maxU - minU) * 100);
  const topSwingPct = Math.round(Math.abs(state.bendTop) * 100);
  const botSwingPct = Math.round(Math.abs(state.bendBot) * 100);
  const avgSwingPct = Math.round((topSwingPct + botSwingPct) * 0.5);
  const maxSwingPct = Math.max(topSwingPct, botSwingPct);
  const minSwingPct = Math.min(topSwingPct, botSwingPct);
  const balanceRatio = minSwingPct > 1 ? +(maxSwingPct / minSwingPct).toFixed(2) : 9.9;

  // 2. 曲率状态分类
  let curveIssue = null;
  if (Math.max(topSwingPct, botSwingPct) < 12 || spanPct < 14) {
    curveIssue = "straight";
  } else if (!hasSingleInflection || state.bendTop * state.bendBot >= -0.002) {
    curveIssue = "c-collapse";
  } else if (maxSwingPct > 35 || maxAbsKappa > 13.2) {
    curveIssue = "hairpin";
  } else if (minSwingPct < 12 || balanceRatio > 2.15) {
    curveIssue = "unbalanced";
  }
  const curveOk = curveIssue === null;

  // 3. 四站贴脊与秩序检查
  const detached = stations.filter((s) => !s.attached);
  let orderInverted = false;
  let minGapT = 1;
  for (let i = 1; i < stations.length; i++) {
    const dt = stations[i].nearestT - stations[i - 1].nearestT;
    if (dt < 0) orderInverted = true;
    if (Math.abs(dt) < minGapT) minGapT = Math.abs(dt);
  }
  let nodesIssue = null;
  if (detached.length > 0) nodesIssue = "off-spine";
  else if (orderInverted || minGapT < 0.14) nodesIssue = "bunched";
  const nodesOk = nodesIssue === null;

  // 4. 出口收敛检查：从终点沿出口切线射出 0.16 长度的视线延伸，是否留在画内
  const exitPt = pts[pts.length - 1];
  const rayU = exitPt.u + exitPt.tx * 0.16;
  const rayV = exitPt.v + exitPt.ty * 0.16;
  const exitInsideMargin = exitPt.u >= 0.16 && exitPt.u <= 0.84 && exitPt.v <= 0.935;
  const rayStaysIn = rayU >= 0.08 && rayU <= 0.92 && rayV <= 0.99;
  const exitOk = exitInsideMargin && rayStaysIn && state.exitPull >= 0.08;

  // 5. 留白呼吸率实算（1 - 已占视觉面积比：实绘双色流带含外虚线呼吸包络 + 圆窗 + 四站圆徽及标签 + 四个岸块）
  const riverArea = sample.arcLen * (0.095 + state.crowd * 0.055);
  const medallionArea = Math.PI * 0.145 * 0.145;
  const badgesAndLabelsArea = 4 * 0.036;
  const blocksArea = blocks.reduce((sum, b) => sum + b.w * b.h, 0);
  const occupied = clamp(riverArea + medallionArea * 0.85 + badgesAndLabelsArea + blocksArea * 1.95, 0.24, 0.88);
  const whitespacePct = Math.round((1 - occupied) * 100);
  const breathOk = whitespacePct >= 30;

  // 综合通过数（0–4）
  const checks = { exitOk, curveOk, nodesOk, breathOk };
  const passedCount = [exitOk, curveOk, nodesOk, breathOk].filter(Boolean).length;

  // 映射荷加斯 1–7 号弧度档位（单真源估算，标「示意」）
  const hogarthLevel = !hasSingleInflection
    ? "退化为单弧"
    : avgSwingPct < 10 ? "约 1 号（过直）"
    : avgSwingPct < 15 ? "约 2 号（偏缓）"
    : avgSwingPct < 21 ? "约 3 号（舒展轻弧）"
    : avgSwingPct < 28 ? "约 4 号（荷加斯标准）"
    : avgSwingPct < 34 ? "约 5 号（饱满强弧）"
    : avgSwingPct < 40 ? "约 6 号（过急发卡）"
    : "约 7 号（失控肿胀）";

  // 流动节奏档位（绝不报假精确百分比）
  let flowGrade = "顺滑匀速（示意）";
  if (curveIssue === "c-collapse") flowGrade = "单边回绕（示意）";
  else if (curveIssue === "straight") flowGrade = "直滑乏味（示意）";
  else if (curveIssue === "hairpin") flowGrade = "急弯急刹（示意）";
  else if (curveIssue === "unbalanced") flowGrade = "节奏跛脚（示意）";
  else if (!nodesOk) flowGrade = "视线分叉（示意）";
  else if (!exitOk) flowGrade = "尾端甩飞（示意）";
  else if (!breathOk) flowGrade = "呼吸淤塞（示意）";

  // 诊断主文案（按最紧迫的视觉失误优先提示）
  let issueCode = "pass";
  let badge = "4/4 动线贯通";
  let headline = "";
  let body = "";
  let nextStep = "";

  if (curveIssue === "c-collapse") {
    issueCode = "c-collapse";
    badge = `错态 · 退化为 C 形 (${passedCount}/4)`;
    headline = "上下两弯倒向同一侧，曲率全程没翻号";
    body = "S 形构图的灵魂在于中央拐点让曲率由正翻负，给眼睛一松一紧的换向节拍。现在上下弧同朝一侧，整条河道退化成了单向包裹的 C 形弧，失去了双弯对冲的摇曳韵律。";
    nextStep = "拖动画布里的「下弯绿柄」跨过中线拉到另一侧，让曲率波形穿过零线翻号。";
  } else if (curveIssue === "straight") {
    issueCode = "straight";
    badge = `错态 · 过直僵硬 (${passedCount}/4)`;
    headline = `横向摆幅只剩 ${spanPct}%，S 动线塌成了斜直线`;
    body = "弧度过缓时，上下两弯几乎看不出起伏，视线从入口一滑到底，连起承转合都来不及发生——这正是原海报提醒「弧度不宜过缓」的原因。";
    nextStep = "在画布河道上左右横拖（或拉大下方「弧度摆幅」滑杆），把弯幅拉到 15%–32% 经验舒适带。";
  } else if (curveIssue === "hairpin") {
    issueCode = "hairpin";
    badge = `错态 · 过急发卡弯 (${passedCount}/4)`;
    headline = `弯幅甩到 ${maxSwingPct}%，急转发卡弯把视线憋停`;
    body = `当前最大摆幅超过 35% 经验上限（${hogarthLevel}），河道逼近画框左右边沿，水流光粒在弯峰被迫急刹拐弯，文字与主视觉也被挤向狭角，优雅动势荡然无存。`;
    nextStep = "直接在画布上向内轻拖河道弯脊，或把「弧度摆幅」收回到 18%–30% 区间。";
  } else if (curveIssue === "unbalanced") {
    issueCode = "unbalanced";
    badge = `错态 · 上下弯失衡 (${passedCount}/4)`;
    headline = `上弯 ${topSwingPct}% 与下弯 ${botSwingPct}% 相差 ${balanceRatio} 倍，节奏头重脚轻`;
    body = "S 形的两道弧线不必机械镜像，但相差超过两倍时，重弯一侧会吸死视线，轻弯一侧近乎拉直，下半段信息被草草带过。";
    nextStep = "拖动画布上偏扁的那一只弯柄，让上下两弯的摆幅落在 1:1 到 1.8:1 的协调比例内。";
  } else if (nodesIssue === "off-spine") {
    const worst = detached.reduce((a, b) => (a.distToCurve > b.distToCurve ? a : b));
    const offPct = Math.round(worst.distToCurve * 100);
    issueCode = "off-spine";
    badge = `错态 · 节点脱轨 (${passedCount}/4)`;
    headline = `「${worst.name}」漂离 S 河道 ${offPct}%，视线被迫分叉`;
    body = "原海报第三条应用要点明确要求「将核心信息放在曲线关键节点上」。现在这枚主节点悬在河道之外，观众眼睛在曲线和孤立圆徽之间来回拉扯，层级串联当场断档。";
    nextStep = `把画布上虚线标红的「${worst.name}」拖回 S 河道弯脊（靠近即自动轻吸），或直接点击该红标归位。`;
  } else if (nodesIssue === "bunched") {
    issueCode = "bunched";
    badge = `错态 · 节点扎堆 (${passedCount}/4)`;
    headline = orderInverted ? "四站先后顺序倒置，阅读流向撞车" : "信息站全挤在一段弯道上，前后半程空转";
    body = "S 形构图靠上弯、中央拐点、下弯与尾端四处节点接力推进层级。站位叠在一起或顺序倒挂，读者无法顺着曲线由主到次自然过渡。";
    nextStep = "把挤在一起的圆徽沿河道错开，让入口、上弯、下弯、出口四站匀称分布。";
  } else if (!exitOk) {
    issueCode = "bleed-exit";
    badge = `错态 · 出口甩飞 (${passedCount}/4)`;
    headline = "河道尾端直冲画角，把视线甩出了画框";
    body = "原海报第一条要点讲「确定起点与终点」：终点不是随便冲出底边，而是像原海报底部那枚青柠箭头一样微微向画内回收，让视线落在核心收尾信息上并留有余味。";
    nextStep = "点击画布底端红色「收束出口」标签，或把出口弯势拨回画内方向。";
  } else if (!breathOk) {
    issueCode = "crowded";
    badge = `错态 · 留白堵死 (${passedCount}/4)`;
    headline = `有效留白仅剩 ${whitespacePct}%，河道被两侧元素夹死`;
    body = "原海报第四条要点强调「保持留白呼吸」。当河道两侧铺满过大的文字块和装饰时，留白跌破 30% 经验底线，曲线轮廓淹没在拥堵色块里，节奏和空间感同时消失。";
    nextStep = "向左收窄「岸边拥挤度」滑杆（或点击应用要点第 4 项），把呼吸留白还回到 32% 以上。";
  } else {
    // 全部 4/4 通过：根据用户实际雕塑的几何形态辨识不同合法解！
    const isReverse = state.bendTop > 0 && state.bendBot < 0;
    const styleName = avgSwingPct < 21 ? "轻盈微弧解" : avgSwingPct > 28 ? "丰满强韵解" : "均衡经典解";
    const dirName = isReverse ? "反 S" : "正 S";
    badge = `4/4 贯通 · ${dirName} ${styleName}`;
    headline = `${dirName}动线畅通无阻：双弯对冲、拐点顺滑、留白 ${whitespacePct}%`;
    body = `上下弯分别摆出 ${topSwingPct}% 与 ${botSwingPct}%（${hogarthLevel}），曲率在中央溪山拐点处平滑翻号；四枚核心节点紧贴河道接力串联，出口箭柔和收归画内，水流与视线匀速贯通全幅。`;
    nextStep = "可以继续拖动弯柄测试反 S 翻转，切换上方「茶道展讯 / 溪谷风光」实景，或故意拖出 C 形与过急错态观察曲率波形怎么报警。";
  }

  // 每条原海报应用要点的实时短标签
  const tipStates = [
    {
      id: "tip-exit",
      ok: exitOk,
      tag: exitOk ? "画内收束" : "尾端甩飞",
      actionText: exitOk ? "出口稳收" : "点此收束",
    },
    {
      id: "tip-curve",
      ok: curveOk,
      tag: curveOk ? `摆幅 ${avgSwingPct}%` : curveIssue === "c-collapse" ? "退化成 C" : curveIssue === "straight" ? "过直僵硬" : curveIssue === "hairpin" ? "过急发卡" : "上下失衡",
      actionText: curveOk ? "弧度合度" : "点此修曲",
    },
    {
      id: "tip-nodes",
      ok: nodesOk,
      tag: nodesOk ? "四站贴脊" : detached.length ? `脱轨 ${detached.length} 站` : "站位拥挤",
      actionText: nodesOk ? "层级顺畅" : "点此归脊",
    },
    {
      id: "tip-breath",
      ok: breathOk,
      tag: breathOk ? `留白 ${whitespacePct}%` : `淤塞 ${whitespacePct}%`,
      actionText: breathOk ? "呼吸充沛" : "点此留白",
    },
  ];

  return {
    sample,
    stations,
    blocks,
    checks,
    passedCount,
    issueCode,
    badge,
    headline,
    body,
    nextStep,
    tipStates,
    metrics: {
      spanPct,
      topSwingPct,
      botSwingPct,
      avgSwingPct,
      balanceRatio,
      inflections: hasSingleInflection ? 1 : 0,
      maxAbsKappa: +maxAbsKappa.toFixed(1),
      whitespacePct,
      hogarthLevel,
      flowGrade,
      detachedCount: detached.length,
    },
    anchors: {
      topHandle: topBellyPt,
      botHandle: botBellyPt,
      inflectionPt,
      exitPt,
      rayEnd: { u: rayU, v: rayV },
    },
  };
}

// =========================================================================
// 03 节：威廉·荷加斯 1753《美的分析》图版 I 七条蛇形线实算模型
// =========================================================================
export const HOGARTH_CURVES = [
  {
    no: 1,
    bend: 0.045,
    tag: "过直 · 僵硬",
    verdict: "接近绷紧的直线，视觉缺乏起伏与停留，容易一滑到底。",
    use: "只适合强调冷峻秩序，不构成 S 形韵律。",
  },
  {
    no: 2,
    bend: 0.095,
    tag: "微弧 · 略怯",
    verdict: "刚开始脱离直线，但左右错位太小，上下节点几乎落在同一纵列。",
    use: "仅作极窄竖条书签或微弱装饰线。",
  },
  {
    no: 3,
    bend: 0.16,
    tag: "轻盈 · 克制",
    verdict: "拐点温和舒展，左右留出大面积安静空白，气质清雅克制。",
    use: "适合高留白文化展讯、书籍扉页、长文导读。",
  },
  {
    no: 4,
    bend: 0.23,
    tag: "荷加斯 4 号 · 标准美之线",
    verdict: "荷加斯在 1753 年原著中明确指认的最佳蛇形线：既给足起承转合的摇曳节奏，又不拖累视线的顺滑延续。",
    use: "海报主视觉、摄影引导线、品牌叙事首屏的黄金参考带。",
    isIdeal: true,
  },
  {
    no: 5,
    bend: 0.30,
    tag: "丰腴 · 强韵",
    verdict: "弯腹饱满、动势充沛，信息左右错落感明显增强，但需收紧单栏文字宽度。",
    use: "适合香氛、饮品、演出海报等强氛围叙事画面。",
  },
  {
    no: 6,
    bend: 0.38,
    tag: "过急 · 挤岸",
    verdict: "弯脊大幅逼近左右画框，单侧文字安全区被压窄，眼睛在弯腹处出现明显顿挫。",
    use: "容易滑入失衡与拥挤，非特异装饰不建议采用。",
  },
  {
    no: 7,
    bend: 0.45,
    tag: "肿胀 · 失控",
    verdict: "荷加斯批评的「过度膨胀与扭曲」：曲率急刹、弯口近乎折返，显得黏滞焦躁。",
    use: "典型反面教材——印证原海报「弧度不宜过急」。",
  },
];

export function evaluateHogarthCurve(no) {
  const item = HOGARTH_CURVES.find((c) => c.no === no) || HOGARTH_CURVES[3];
  const st = {
    bendTop: -item.bend,
    bendBot: item.bend,
    exitPull: 0.48,
    crowd: 0.2,
    nodes: PRESETS.classic.nodes,
  };
  const s = sampleCurve(st, 80);
  let maxK = 0, minU = 1, maxU = 0;
  for (const p of s.pts.slice(10, -10)) {
    if (Math.abs(p.kappa) > maxK) maxK = Math.abs(p.kappa);
    if (p.u < minU) minU = p.u;
    if (p.u > maxU) maxU = p.u;
  }
  const swingPct = Math.round((maxU - minU) * 100);
  // 留给侧栏排字的安全宽度占比（由弯脊最外缘距画框边距算出）
  const sideSafePct = Math.max(12, Math.round((1 - maxU - 0.04) * 100));
  return {
    ...item,
    sample: s,
    maxKappa: +maxK.toFixed(1),
    swingPct,
    sideSafePct,
  };
}
