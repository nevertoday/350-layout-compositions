// 052 放射式构图 — 单一真源数据模型与几何核算
// 所有画布绘制、五要点探针、四栏金标读数与实时诊单全部由本模块同一组射线几何导出。

export const PALETTE = {
  bg: "#190D2C",
  bgDeep: "#130922",
  bgCard: "#22143B",
  bgFooter: "#0E071B",
  coreBright: "#FBE387",
  coreMid: "#F8DA62",
  gold: "#F0C632",
  goldLine: "#C9AD4B",
  goldCapsule: "#AA9F73",
  cream: "#EFE5CD",
  paper: "#F8F4EA",
  paperMist: "#F2EEF7",
  ink: "#140B26",
  inkSub: "#473D5C",
  err: "#FF7A70",
  errPaper: "#B3261E",
  ok: "#58E0A8",
  okPaper: "#146B48",
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报 · 星尘光爆",
    shortLabel: "原海报光爆",
    titleTop: "放射式",
    titleBottom: "构图",
    subEn1: "RADIATING",
    subEn2: "COMPOSITION",
    badge: "POSTER SPECIMEN",
  },
  manga: {
    id: "manga",
    label: "漫画 · 集中线冲击",
    shortLabel: "漫画集中线",
    titleTop: "刹那",
    titleBottom: "破阵",
    subEn1: "SHUCHUSEN",
    subEn2: "IMPACT FRAME",
    badge: "MANGA FOCUS",
  },
  launch: {
    id: "launch",
    label: "发布 · 舞台光柱",
    shortLabel: "舞台光柱",
    titleTop: "星穹",
    titleBottom: "声场 01",
    subEn1: "KEYNOTE BEAM",
    subEn2: "STAGE LAUNCH",
    badge: "STAGE LAUNCH",
  },
};

export const RAY_COUNT = 36;
export const TITLE_SAFE_R = 0.19; // 主标外接安全半径（相对半幅）

// 按 052 原海报 360° 真实疏密节奏编排的 36 槽先天骨架：
// beam(粗金/白主束) · hair(细实长针) · spark(星尘点轨) · void(暗空呼吸通道)
const BASE_SLOTS = [
  { role: "hair",  color: "gold",  len: 0.94, w: 1.8, jit:  0.00 }, // 0  正上中轴细金针（原海报 12 点）
  { role: "beam",  color: "gold",  len: 0.86, w: 7.4, jit:  0.01 }, // 1
  { role: "spark", color: "gold",  len: 0.82, w: 1.9, jit:  0.02 }, // 2
  { role: "beam",  color: "cream", len: 1.06, w: 5.2, jit: -0.01 }, // 3  右上长白束
  { role: "spark", color: "cream", len: 0.90, w: 2.2, jit:  0.01 }, // 4
  { role: "beam",  color: "gold",  len: 0.96, w: 11.4, jit: 0.00 }, // 5  右上招牌粗金束
  { role: "void",  color: "gold",  len: 0.56, w: 1.4, jit:  0.00 }, // 6  右上呼吸暗隙
  { role: "hair",  color: "cream", len: 0.92, w: 1.7, jit: -0.02 }, // 7
  { role: "spark", color: "cream", len: 1.02, w: 2.5, jit:  0.01 }, // 8  右偏上星尘点轨
  { role: "beam",  color: "gold",  len: 0.80, w: 6.4, jit:  0.00 }, // 9
  { role: "spark", color: "gold",  len: 0.72, w: 1.6, jit:  0.02 }, // 10
  { role: "hair",  color: "gold",  len: 0.88, w: 2.0, jit: -0.01 }, // 11
  { role: "beam",  color: "gold",  len: 1.08, w: 10.2, jit: 0.01 }, // 12 正右偏下超长粗金束
  { role: "void",  color: "gold",  len: 0.52, w: 1.2, jit:  0.00 }, // 13 呼吸暗隙
  { role: "spark", color: "gold",  len: 0.76, w: 1.8, jit: -0.01 }, // 14
  { role: "hair",  color: "cream", len: 0.84, w: 2.1, jit:  0.01 }, // 15
  { role: "beam",  color: "gold",  len: 0.90, w: 6.8, jit: -0.02 }, // 16 右下金束
  { role: "spark", color: "cream", len: 0.96, w: 2.3, jit:  0.01 }, // 17 右下点轨
  { role: "beam",  color: "gold",  len: 0.88, w: 8.4, jit:  0.00 }, // 18
  { role: "void",  color: "gold",  len: 0.54, w: 1.3, jit:  0.00 }, // 19 下右呼吸暗隙
  { role: "spark", color: "gold",  len: 0.78, w: 1.7, jit:  0.02 }, // 20
  { role: "hair",  color: "cream", len: 0.92, w: 2.2, jit: -0.01 }, // 21 正下白细针
  { role: "spark", color: "gold",  len: 0.84, w: 1.9, jit:  0.01 }, // 22
  { role: "beam",  color: "gold",  len: 0.88, w: 7.2, jit:  0.02 }, // 23 左下粗金束
  { role: "hair",  color: "cream", len: 0.96, w: 2.6, jit: -0.01 }, // 24 左下长白束
  { role: "spark", color: "cream", len: 1.04, w: 2.4, jit:  0.00 }, // 25 左下远射星尘
  { role: "void",  color: "gold",  len: 0.50, w: 1.2, jit:  0.00 }, // 26 左下呼吸暗隙
  { role: "hair",  color: "gold",  len: 0.84, w: 1.8, jit:  0.01 }, // 27
  { role: "beam",  color: "gold",  len: 0.74, w: 5.8, jit: -0.01 }, // 28
  { role: "spark", color: "cream", len: 0.98, w: 2.2, jit:  0.02 }, // 29 正左偏下星尘
  { role: "beam",  color: "cream", len: 1.06, w: 4.8, jit:  0.00 }, // 30 正左超长白束
  { role: "beam",  color: "gold",  len: 0.78, w: 6.2, jit: -0.02 }, // 31
  { role: "void",  color: "gold",  len: 0.52, w: 1.3, jit:  0.00 }, // 32 左上呼吸暗隙
  { role: "spark", color: "cream", len: 0.94, w: 2.3, jit:  0.01 }, // 33 左上斜点轨
  { role: "beam",  color: "gold",  len: 0.82, w: 7.8, jit: -0.01 }, // 34 左上金束
  { role: "hair",  color: "cream", len: 0.98, w: 2.4, jit:  0.01 }, // 35 顶左白针
];

// 原海报外圈卫星实心点与空心环（相对极坐标）
export const SATELLITES = [
  { angleDeg: -50, dist: 0.95, r: 9.5, kind: "solid", color: "gold" },
  { angleDeg: -16, dist: 1.00, r: 9.2, kind: "ring",  color: "cream" },
  { angleDeg:  20, dist: 0.82, r: 4.2, kind: "solid", color: "gold" },
  { angleDeg:  52, dist: 0.88, r: 10.0, kind: "ring", color: "gold" },
  { angleDeg: 106, dist: 0.84, r: 4.6, kind: "solid", color: "gold" },
  { angleDeg: 168, dist: 0.92, r: 6.5, kind: "ring",  color: "gold" },
  { angleDeg: -146, dist: 0.95, r: 6.2, kind: "solid", color: "cream" },
  { angleDeg: -130, dist: 0.76, r: 9.8, kind: "solid", color: "gold" },
];

export const INITIAL_STATE = Object.freeze({
  specimen: "poster",
  rhythm: 0.06,       // 0.00–1.00：开场仅 0.06，陷入均纹车轮眩晕
  coreRadius: 0.05,   // 0.00–0.56：开场仅 0.05，射线直穿主标刺字
  reach: 0.52,        // 0.36–1.12：开场仅 0.52，短促齐边硬堵
  convergence: 0.56,  // 0.00–1.00：开场仅 0.56，发散源漂移断核
  originX: 0.50,      // 0.24–0.76
  originY: 0.49,      // 0.28–0.70
  splitHub: false,
});

export function createInitialState() {
  return {
    ...INITIAL_STATE,
    overrides: new Array(RAY_COUNT).fill(null),
  };
}

export const SOLUTIONS = {
  classic: {
    id: "classic",
    label: "原海报星爆",
    desc: "正中点阵金核 + 三阶参差射线 + 暗空呼吸通道",
    patch: { specimen: "poster", rhythm: 0.74, coreRadius: 0.29, reach: 0.95, convergence: 0.98, originX: 0.50, originY: 0.49, splitHub: false },
  },
  offcenter: {
    id: "offcenter",
    label: "偏心定向爆",
    desc: "黄金左偏源心 + 右向长尾爆发，适合新品/封面主视觉",
    patch: { specimen: "launch", rhythm: 0.78, coreRadius: 0.25, reach: 1.04, convergence: 0.97, originX: 0.37, originY: 0.44, splitHub: false },
  },
  mangaFocus: {
    id: "mangaFocus",
    label: "漫画集中线",
    desc: "宽阔留白聚焦场 + 锐利密疏交替集中线",
    patch: { specimen: "manga", rhythm: 0.68, coreRadius: 0.33, reach: 1.00, convergence: 1.00, originX: 0.50, originY: 0.49, splitHub: false },
  },
};

export const FAIL_CASES = {
  uniform: {
    id: "uniform",
    label: "均纹车轮",
    patch: { rhythm: 0.03, coreRadius: 0.28, reach: 0.88, convergence: 0.98, originX: 0.50, originY: 0.49, splitHub: false },
  },
  pierce: {
    id: "pierce",
    label: "射线刺字",
    patch: { rhythm: 0.74, coreRadius: 0.04, reach: 0.94, convergence: 0.98, originX: 0.50, originY: 0.49, splitHub: false },
  },
  bloat: {
    id: "bloat",
    label: "巨核吞光",
    patch: { rhythm: 0.72, coreRadius: 0.51, reach: 0.88, convergence: 0.98, originX: 0.50, originY: 0.49, splitHub: false },
  },
  split: {
    id: "split",
    label: "双核撕裂",
    patch: { rhythm: 0.74, coreRadius: 0.27, reach: 0.93, convergence: 0.46, originX: 0.50, originY: 0.49, splitHub: true },
  },
  sparse: {
    id: "sparse",
    label: "稀散怯懦",
    patch: { rhythm: 0.98, coreRadius: 0.28, reach: 0.46, convergence: 0.96, originX: 0.50, originY: 0.49, splitHub: false },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 由 state 生成 36 束实绘射线对象（画布与诊断共用这同一份数组）
export function buildRays(state) {
  const r = clamp(state.rhythm, 0, 1);
  const core = clamp(state.coreRadius, 0, 0.58);
  const reach = clamp(state.reach, 0.34, 1.15);
  const conv = clamp(state.convergence, 0, 1);
  const scatterAmt = 1 - conv; // 0 = 单源汇聚，1 = 极度散裂
  const overrides = state.overrides || [];

  // 当 rhythm > 0.88 时，过激离散会吞掉更多辅助线，模拟「过度抽空导致稀散断流」
  const overSparse = r > 0.88 ? (r - 0.88) / 0.12 : 0;

  const rays = [];
  for (let i = 0; i < RAY_COUNT; i++) {
    const slot = BASE_SLOTS[i];
    const ov = overrides[i];
    const baseAngle = (i / RAY_COUNT) * Math.PI * 2 - Math.PI / 2;

    // 确定该槽位的当前角色
    let role = slot.role;
    if (ov) {
      role = ov;
    } else if (r < 0.18) {
      // 低节奏极差时，暗空和星尘退化成整齐等宽硬条
      role = "beam";
    } else if (overSparse > 0.25 && (slot.role === "hair" || (overSparse > 0.6 && slot.role === "spark" && i % 2 === 0))) {
      role = "void";
    }

    const active = role !== "void";
    const angle = baseAngle + slot.jit * Math.PI * 2 * clamp(r * 1.15, 0, 1);

    // 真实源心偏移（归一化相对半幅坐标）
    let ox = 0;
    let oy = 0;
    if (state.splitHub) {
      // 双核撕裂：左右半场各自指向相距很远的两个竞争中心
      const isRight = Math.cos(angle) >= 0;
      ox = isRight ? 0.185 : -0.165;
      oy = isRight ? -0.075 : 0.085;
    } else if (scatterAmt > 0.005) {
      // 确定性伪随机漂移方向，稳定不抖
      const ph = ((i * 73 + 19) % 360) * (Math.PI / 180);
      const mag = scatterAmt * (0.14 + 0.14 * ((i * 37) % 10) / 10);
      ox = Math.cos(ph) * mag;
      oy = Math.sin(ph) * mag;
    }

    // 起点半径：核小则刺入主标内部，核适中则从金光边缘发散
    const innerJitter = role === "beam" ? 0.84 : role === "hair" ? 0.78 : 0.92;
    const innerR = core * lerp(1.0, innerJitter, r);

    // 终点半径：低节奏时整齐硬切在同一圆周，高节奏时按三阶长短自然舒展
    const roleLenFactor =
      ov === "beam" ? 1.02 :
      ov === "spark" ? 0.90 :
      ov === "hair" ? 0.86 :
      slot.len;
    const uniformReach = reach;
    const modulatedReach = reach * lerp(0.52, 1.16, (roleLenFactor - 0.5) / 0.6);
    const outerR = Math.max(innerR + 0.03, lerp(uniformReach, modulatedReach, r));

    // 宽度：低节奏时统一 5.6px 僵直铁条，高节奏时分化出粗金束 / 细针 / 星尘点
    const targetW =
      ov === "beam" ? 9.8 :
      ov === "spark" ? 2.2 :
      ov === "hair" ? 1.9 :
      slot.w;
    const width = active ? lerp(5.6, targetW, r) : 0;

    // 颜色归属
    let colorKey = slot.color;
    if (ov === "beam") colorKey = "gold";
    if (ov === "spark") colorKey = "cream";
    if (state.specimen === "manga" && role !== "beam") colorKey = "cream";
    if (state.specimen === "launch" && i % 3 === 0) colorKey = "gold";

    // 外端渐隐柔软度
    const taper = clamp(r * 0.85 + (reach - 0.5) * 0.45, 0, 1);

    const visibleLen = active ? Math.max(0, outerR - innerR) : 0;
    const pierceDepth = active ? Math.max(0, TITLE_SAFE_R - innerR) : 0;
    const originDist = Math.hypot(ox, oy);

    rays.push({
      index: i,
      angle,
      role,
      active,
      colorKey,
      ox,
      oy,
      originDist,
      innerR,
      outerR,
      visibleLen,
      width,
      taper,
      pierceDepth,
      visualWeight: active ? width * Math.max(0.08, visibleLen) : 0,
    });
  }
  return rays;
}

// 从实绘射线数组进行单真源四维核算与白话诊断
export function evaluate(state) {
  const rays = buildRays(state);
  const active = rays.filter((x) => x.active && x.visibleLen > 0.05);
  const activeCount = active.length;
  const voidCount = RAY_COUNT - activeCount;

  // 1. 节奏极差（粗细 × 可见长度的真实最大/最小视觉权重比）
  const weights = active.map((x) => x.visualWeight).sort((a, b) => a - b);
  const p10W = weights.length ? weights[Math.floor(weights.length * 0.1)] : 1;
  const p90W = weights.length ? weights[Math.min(weights.length - 1, Math.floor(weights.length * 0.9))] : 1;
  const rhythmRatio = active.length >= 2 ? +(p90W / Math.max(0.15, p10W)).toFixed(2) : 1.0;

  // 2. 长度落差与最远触达（基于实绘 outerR 统计）
  const outers = active.map((x) => x.outerR).sort((a, b) => a - b);
  const p90Reach = outers.length ? outers[Math.min(outers.length - 1, Math.floor(outers.length * 0.9))] : 0;
  const minOuter = outers.length ? outers[0] : 0;
  const maxOuter = outers.length ? outers[outers.length - 1] : 0;
  const reachPct = Math.round(p90Reach * 100);
  const lengthSpreadPct = maxOuter > 0 ? Math.round(((maxOuter - minOuter) / maxOuter) * 100) : 0;

  // 3. 暗空最大夹角（基于实绘 active 角度）
  let maxGapDeg = 360;
  if (active.length >= 2) {
    const angs = active.map((x) => ((x.angle * 180) / Math.PI + 720) % 360).sort((a, b) => a - b);
    maxGapDeg = 0;
    for (let i = 0; i < angs.length; i++) {
      const next = i + 1 < angs.length ? angs[i + 1] : angs[0] + 360;
      maxGapDeg = Math.max(maxGapDeg, next - angs[i]);
    }
    maxGapDeg = Math.round(maxGapDeg);
  }

  // 4. 核心留白与刺字计数
  const corePct = Math.round(state.coreRadius * 100);
  const pierceCount = active.filter((x) => x.pierceDepth > 0.02).length;

  // 5. 发散源汇聚误差（真实源心偏移均值 %）
  const meanOffset = active.length
    ? active.reduce((s, x) => s + x.originDist, 0) / active.length
    : 0;
  const scatterPct = Math.round(meanOffset * 100 * 2.1); // 映射至直观 0–55% 区间
  const edgeMarginPct = Math.round(
    Math.min(state.originX, 1 - state.originX, state.originY, 1 - state.originY) * 100
  );

  // 6. 可见射线净长占比（检查巨核吞光）
  const meanVisibleLen = active.length
    ? active.reduce((s, x) => s + x.visibleLen, 0) / active.length
    : 0;

  // --- 四大核心准则判定（双向越界均判定失败） ---
  // ① 聚焦核心（FOCUS）
  let focusErr = "";
  if (state.splitHub) focusErr = "双核撕裂";
  else if (scatterPct > 11) focusErr = `散源 ${scatterPct}%`;
  else if (pierceCount > 2 || corePct < 19) focusErr = `刺字 ${pierceCount} 束`;
  else if (corePct > 41) focusErr = `巨核 ${corePct}%`;
  else if (edgeMarginPct < 22) focusErr = `贴边 ${edgeMarginPct}%`;
  const focusOk = !focusErr;

  // ② 节奏变化（RHYTHM / ENERGY）
  let rhythmErr = "";
  if (activeCount < 16 || maxGapDeg > 98) rhythmErr = `断流 ${maxGapDeg}°`;
  else if (rhythmRatio < 1.85) rhythmErr = `均纹 ${rhythmRatio.toFixed(2)}×`;
  else if (activeCount > 34 || voidCount < 2) rhythmErr = "堵光无隙";
  const rhythmOk = !rhythmErr;

  // ③ 向外扩散（EXPANSION）
  let expandErr = "";
  if (reachPct < 72) expandErr = `短促 ${reachPct}%`;
  else if (lengthSpreadPct < 20) expandErr = `齐边硬堵`;
  const expandOk = !expandErr;

  // ④ 强调方向（DIRECTION）
  let dirErr = "";
  if (state.splitHub) dirErr = "双极拉扯";
  else if (scatterPct > 11) dirErr = "矢量散乱";
  else if (activeCount < 16 || maxGapDeg > 98) dirErr = "动势中断";
  else if (reachPct < 72 || rhythmRatio < 1.85) dirErr = "动势呆滞";
  const dirOk = !dirErr;

  const score = [focusOk, rhythmOk, expandOk, dirOk].filter(Boolean).length;

  // 张力档位（诚实定性，绝不用假精确百分比）
  let energyTier = "僵滞";
  if (score === 4) {
    energyTier = Math.hypot(state.originX - 0.5, state.originY - 0.49) > 0.08 ? "定向爆冲" : "饱满放射";
  } else if (state.splitHub || scatterPct > 11) {
    energyTier = "失源散裂";
  } else if (rhythmRatio < 1.85) {
    energyTier = "均纹刺眼";
  } else if (corePct > 41) {
    energyTier = "圆盘泄力";
  } else if (reachPct < 72) {
    energyTier = "内缩怯懦";
  } else {
    energyTier = "局部受阻";
  }

  // 主诊单（按视觉致命程度排序，告诉用户「眼睛会怎么看」与「改哪里」）
  let diag;
  if (score === 4) {
    const isOffCenter = Math.hypot(state.originX - 0.5, state.originY - 0.49) > 0.07;
    const hasCustom = (state.overrides || []).some(Boolean);
    const modeName = hasCustom
      ? "手雕定制星爆成立"
      : isOffCenter
      ? "偏心定向爆冲成立"
      : state.specimen === "manga"
      ? "集中线聚焦场成立"
      : "原海报三阶星爆成立";
    diag = {
      ok: true,
      badge: `4/4 · ${energyTier}`,
      headline: `${modeName}：一秒锁核，四面破空`,
      why: `实绘 ${activeCount} 束射线全数归源（偏散仅 ${scatterPct}%），核心留白 ${corePct}% 稳稳托住主标，粗金束与星尘细线拉开 ${rhythmRatio.toFixed(1)}× 节奏极差并保留 ${voidCount} 道暗空呼吸隙，视线既被死死吸进核芯，又顺着长束向外爆开。`,
      fix: "可以继续点击外圈任意扇区单束手雕、拖动源心试偏心构图，或按 Space 激发脉冲验证视线动势。",
    };
  } else if (state.splitHub) {
    diag = {
      ok: false,
      badge: `${score}/4 · 双核撕裂`,
      headline: "两个发散源互相抢戏，视线在中间左右撕裂",
      why: "左右半场的射线各自指向相距甚远的两个竞争核，眼睛无法在第一秒决定该停在哪里。放射式构图天生是「单核统治」，一旦拆出双核，张力立刻内耗成混乱背景。",
      fix: "关闭「双核撕裂」或把「源心汇聚」拉到 90% 以上，让所有射线死死锁回同一个发光中心。",
    };
  } else if (pierceCount > 2 || corePct < 19) {
    diag = {
      ok: false,
      badge: `${score}/4 · 刺字 ${pierceCount} 束`,
      headline: `${pierceCount} 束射线直接刺穿主标，焦点糊成一团`,
      why: `当前核心光晕留白只有 ${corePct}%，锐利亮黄射线直接劈过文字笔画。眼睛还没读清标题，就被高频交叉笔画割断注意力；这也是新手做放射海报最常踩的第一个坑。`,
      fix: "在画布上向上拖开核心虚线环（或把「核心光晕」调到 22%–36%），为主标腾出一片发光呼吸核。",
    };
  } else if (rhythmRatio < 1.85) {
    diag = {
      ok: false,
      badge: `${score}/4 · 均纹 ${rhythmRatio.toFixed(2)}×`,
      headline: `36 根射线几乎一样粗长（${rhythmRatio.toFixed(2)}×），退化成眩晕电风扇`,
      why: "等宽等距的高对比射线会触发神经视觉里的「纹眩效应」（Wilkins, 1984）：画面看起来像廉价促销贴纸或旋转车轮，眼睛只觉刺眼发晃，完全没有 052 原海报那种星尘炸裂的呼吸与层次。",
      fix: "在画布上向右横拖（或把「节奏极差」拉到 55%–85%），拉开粗金束、细白针、星尘点轨与暗空隙的差距。",
    };
  } else if (scatterPct > 11) {
    diag = {
      ok: false,
      badge: `${score}/4 · 散源 ${scatterPct}%`,
      headline: `射线起点偏离中心 ${scatterPct}%，能量发散断了源头`,
      why: "放射式之所以比普通斜线更有冲击力，是因为大脑会自动把所有射线反向延长，在交点处合成一个高压核心。一旦起点散落漂移，隐形交点瓦解，射线立刻退化成杂乱划痕。",
      fix: "把「源心汇聚」滑轨推到 90%–100%，把散落的起点重新收束回发光核芯。",
    };
  } else if (corePct > 41) {
    diag = {
      ok: false,
      badge: `${score}/4 · 巨核吞光`,
      headline: `核心膨胀到 ${corePct}%，吞掉了射线变成大黄圆`,
      why: "中心圆盘占掉大半个画幅后，外圈射线只剩一圈短毛刺。此时画面不再往四周爆发能量，而是退化成静态的「圆形构图」（见 047 圆形构图）。",
      fix: "向下收拢「核心光晕」回到 22%–36%，让射线重新拥有足够长的奔跑轨道。",
    };
  } else if (activeCount < 16 || maxGapDeg > 98) {
    diag = {
      ok: false,
      badge: `${score}/4 · 断流 ${maxGapDeg}°`,
      headline: `暗空缺口裂到 ${maxGapDeg}°，放射场稀散断流了`,
      why: `当前有效射线只剩 ${activeCount} 束，大块死黑空洞切断了向四周扩散的场域连续性。眼睛看到的只是几根孤立斜线，撑不起放射式应有的爆发能量。`,
      fix: "把「节奏极差」回调到 55%–85%，或点击暗空扇区补回主金光束与星尘点轨。",
    };
  } else if (reachPct < 72 || lengthSpreadPct < 20) {
    diag = {
      ok: false,
      badge: `${score}/4 · ${reachPct < 72 ? `短促 ${reachPct}%` : "齐边硬堵"}`,
      headline: reachPct < 72
        ? `外扩只到 ${reachPct}%，射线缩在画中怯懦打不开`
        : "所有射线齐刷刷截在同一圆周上，爆发被生生堵死",
      why: reachPct < 72
        ? "射线刚出核心就戛然而止，外圈留出大片僵死黑边，视线还没加速就熄火，完全感受不到「向四周扩散」的动势。"
        : `射线长短落差仅 ${lengthSpreadPct}%，像用圆规硬切出来的齿轮轮廓，缺了由内向外自由穿透画框的速度感。`,
      fix: "在画布上向右横拖拉满「外扩冲量」至 80%–104%，并保持足够节奏极差让主束冲破外缘。",
    };
  } else if (activeCount > 34 || voidCount < 2) {
    diag = {
      ok: false,
      badge: `${score}/4 · 堵光无隙`,
      headline: "36 扇区塞得水泄不通，缺了暗空呼吸通道",
      why: "没有深蓝紫暗空衬托，高亮金线会彼此粘连糊成白茫茫的眩光。原海报的厉害之处，在于故意留出几道深空缝隙，让粗金光束显得更锋利。",
      fix: "点击外圈一两处拥挤射线切出暗空留白，或调整「节奏极差」打开自然暗隙。",
    };
  } else {
    diag = {
      ok: false,
      badge: `${score}/4 · 贴边失核`,
      headline: `发散核贴近边缘（余量 ${edgeMarginPct}%），半边射线被画框切碎`,
      why: "偏心放射可以制造强烈方向感，但如果核芯紧贴四边，一侧射线还没展开就被边界截死，主体标题也失去立足空间。",
      fix: "把发散源稍微拉回画框内侧（离四边 ≥24%），留出完整的爆发展开区。",
    };
  }

  // 原海报 5 条环绕要点的实时探针状态（100% 源自同一份计算）
  const fivePoints = {
    focus: {
      ok: focusOk,
      tag: focusOk ? `核晕 ${corePct}% · 汇聚` : focusErr,
    },
    expand: {
      ok: expandOk,
      tag: expandOk ? `外扩 ${reachPct}%` : expandErr,
    },
    direction: {
      ok: dirOk,
      tag: dirOk ? `偏散 ${scatterPct}%` : dirErr,
    },
    energy: {
      ok: focusOk && expandOk && rhythmOk,
      tag: score === 4 ? `${energyTier}（示意）` : `${energyTier}（示意）`,
    },
    rhythm: {
      ok: rhythmOk,
      tag: rhythmOk ? `极差 ${rhythmRatio.toFixed(1)}× · ${voidCount} 隙` : rhythmErr,
    },
  };

  // 原海报底沿 4 枚金标实时读数
  const fourFooter = {
    expansion: { ok: expandOk, val: expandOk ? `外扩 ${reachPct}%` : expandErr },
    energy:    { ok: score === 4, val: `${energyTier}（示意）` },
    focus:     { ok: focusOk, val: focusOk ? `留白 ${corePct}%` : focusErr },
    direction: { ok: dirOk, val: dirOk ? `${activeCount} 束同源` : dirErr },
  };

  return {
    rays,
    activeCount,
    voidCount,
    rhythmRatio,
    reachPct,
    lengthSpreadPct,
    maxGapDeg,
    corePct,
    pierceCount,
    scatterPct,
    edgeMarginPct,
    energyTier,
    score,
    focusOk,
    rhythmOk,
    expandOk,
    dirOk,
    diag,
    fivePoints,
    fourFooter,
  };
}
