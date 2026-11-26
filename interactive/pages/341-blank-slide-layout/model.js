// 341 空白幻灯片版式 — 单真源空间几何模型
// 所有读数、4 维诊断、合法解判定与双向错态检测均从同一组 16:9 实绘包围盒算出。

export const SLIDE_ASPECT = 16 / 9;

// 原海报与三套演示剧本
export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 单点宣言",
    shortLabel: "原海报宣言",
    eyebrow: "BLANK SLIDE · 02 / 03",
    headline: "留白本身就是结构",
    subline: "撤掉边框与占位符，视线自然落向焦点。",
    focalTitle: "焦点",
    focalSub: "FOCUS",
    prevTitle: "2026 年度产品体验改版全量指标汇总（第 14 页）",
    prevBullets: [
      "首页跳出率 41.2% · 较上季波动 +1.8% · 需按渠道拆解",
      "核心漏斗第 3 步流失率 28.6% · 表单字段过多导致中断",
      "移动端首屏加载 2.9s · 图片体积占总流量 64%",
      "客服工单排名前三：找不到入口 / 字体偏小 / 按钮拥挤",
    ],
    nextTitle: "下一步：把 4 条原则落进三类高频页",
    nextSub: "接下来分三幕拆解转折页、单物页与数据页。",
    clutterLabels: {
      frame: "装饰双边框与页脚栏",
      badge: "抢戏副徽章 · 必看要点",
      notes: "边角补充备注 · 3 条冗余",
    },
    clutterShort: {
      frame: "装饰外框",
      badge: "抢戏徽章",
      notes: "边角备注",
    },
  },
  data: {
    id: "data",
    label: "数据转折 · 核心结论",
    shortLabel: "数据转折",
    eyebrow: "Q4 KEY FINDING · 02 / 03",
    headline: "复购率首次站上 78%",
    subline: "密集报表之后，用一整页安静承托拐点。",
    focalTitle: "78%",
    focalSub: "RETENTION",
    prevTitle: "Q1–Q4 分渠道留存与客单价明细表（12 项字段）",
    prevBullets: [
      "自然搜索 61.4% / 64.0% / 69.2% / 74.8% · 同比 +13.4pt",
      "老客推荐 70.1% / 72.5% / 76.9% / 81.2% · 同比 +11.1pt",
      "会员续费 68.3% / 71.0% / 74.5% / 79.0% · 客单价 ¥284",
      "综合加权留存 66.2% → 69.4% → 73.8% → 78.1%",
    ],
    nextTitle: "支撑 78% 的三个产品动作",
    nextSub: "后续页面按三列展开具体策略与负责团队。",
    clutterLabels: {
      frame: "汇报花哨底框与机密页脚",
      badge: "抢戏角标 · 环比 +4.3pt",
      notes: "口径说明小字 · 统计备注",
    },
    clutterShort: {
      frame: "模板底框",
      badge: "抢戏角标",
      notes: "口径备注",
    },
  },
  product: {
    id: "product",
    label: "产品切片 · 单物展示",
    shortLabel: "产品切片",
    eyebrow: "INDUSTRIAL EDITION · 02 / 03",
    headline: "轻至 118 克的无界机身",
    subline: "不堆参数清单，让暖白纸面托起轮廓。",
    focalTitle: "118g",
    focalSub: "MONO BODY",
    prevTitle: "三代硬件结构与物料成本对比清单（BOM 摘要）",
    prevBullets: [
      "中框材料：6061 铝 → 再生镁合金（减重 26g）",
      "电池密度：685 Wh/L → 740 Wh/L（厚度减 0.9mm）",
      "按键模组：4 枚机械键 → 一体式电容压感侧脊",
      "表面工艺：微弧喷砂哑光 · 耐指纹涂层升级",
    ],
    nextTitle: "单手握持的 14 毫米弧度细节",
    nextSub: "进入工业设计特写与材质实拍说明。",
    clutterLabels: {
      frame: "厚重产品参数外边框",
      badge: "抢戏卖点贴纸 · 新品首发",
      notes: "规格小字 · 6 项硬件参数",
    },
    clutterShort: {
      frame: "参数外框",
      badge: "卖点贴纸",
      notes: "规格备注",
    },
  },
};

export const CLUTTER_KEYS = ["frame", "badge", "notes"];

export const THRESHOLDS = {
  marginMin: 0.08,       // < 8% 贴边窒息
  marginMax: 0.22,       // > 22% 过缩成邮票
  whitespaceMin: 0.62,   // < 62% 留白塌陷
  whitespaceMax: 0.92,   // > 92% 空洞失焦
  focalSizeMin: 0.11,    // < 11% 焦点太微弱
  focalSizeMax: 0.28,    // > 28% 巨块压迫
  gapMin: 0.05,          // < 5% 元素贴死/粘连
  gapMax: 0.28,          // > 28% 孤岛散架
  dominanceMin: 1.75,    // 主次视觉权重比下限
  eccentricityMax: 0.28, // 视觉重心偏心上限
};

export const PRESETS = {
  bad: {
    id: "bad",
    label: "开场坏态",
    margin: 0.032,
    focal: { x: 0.61, y: 0.54, size: 0.25 },
    copy: { x: 0.125, y: 0.36, align: "left" },
    clutter: { frame: true, badge: true, notes: true },
  },
  poster: {
    id: "poster",
    label: "原海报解",
    margin: 0.115,
    focal: { x: 0.69, y: 0.54, size: 0.175 },
    copy: { x: 0.135, y: 0.34, align: "left" },
    clutter: { frame: false, badge: false, notes: false },
  },
  centered: {
    id: "centered",
    label: "居中禅意解",
    margin: 0.13,
    focal: { x: 0.50, y: 0.38, size: 0.165 },
    copy: { x: 0.50, y: 0.64, align: "center" },
    clutter: { frame: false, badge: false, notes: false },
  },
  leftAnchor: {
    id: "leftAnchor",
    label: "左核右述解",
    margin: 0.11,
    focal: { x: 0.30, y: 0.51, size: 0.17 },
    copy: { x: 0.51, y: 0.36, align: "left" },
    clutter: { frame: false, badge: false, notes: false },
  },
  edgeCramp: {
    id: "edgeCramp",
    label: "试错：贴边",
    margin: 0.025,
    focal: { x: 0.87, y: 0.52, size: 0.19 },
    copy: { x: 0.03, y: 0.09, align: "left" },
    clutter: { frame: false, badge: false, notes: false },
  },
  tooEmpty: {
    id: "tooEmpty",
    label: "试错：过空",
    margin: 0.245,
    focal: { x: 0.69, y: 0.50, size: 0.062 },
    copy: { x: 0.25, y: 0.41, align: "left" },
    clutter: { frame: false, badge: false, notes: false },
  },
  drift: {
    id: "drift",
    label: "试错：散架",
    margin: 0.085,
    focal: { x: 0.82, y: 0.72, size: 0.15 },
    copy: { x: 0.09, y: 0.13, align: "left" },
    clutter: { frame: false, badge: false, notes: false },
  },
};

export function createInitialState(scenario = "poster") {
  const p = PRESETS.bad;
  return {
    scenario,
    margin: p.margin,
    focal: { ...p.focal },
    copy: { ...p.copy },
    clutter: { ...p.clutter },
    activeSlide: 1, // 0=前页密集 1=当前空白页 2=后续展开页
    showGuides: true,
  };
}

export function applyPreset(state, presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return state;
  state.margin = p.margin;
  state.focal = { ...p.focal };
  state.copy = { ...p.copy };
  state.clutter = { ...p.clutter };
  state.activeSlide = 1;
  return state;
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 把文字和图形都换算成 16:9 幻灯片上的真实归一化矩形（0..1）
export function computeGeometry(state) {
  const marginX = clamp(state.margin, 0.02, 0.26);
  const marginY = clamp(state.margin * 1.12, 0.024, 0.28);
  const safeRect = {
    x0: marginX,
    y0: marginY,
    x1: 1 - marginX,
    y1: 1 - marginY,
  };

  // 主视觉焦点（圆形 / 产品廓形 / 数据高亮场）
  const fSize = clamp(state.focal.size, 0.055, 0.36);
  const fRx = fSize * 0.5;
  const fRy = fRx * SLIDE_ASPECT;
  const fx = clamp(state.focal.x, fRx + 0.008, 1 - fRx - 0.008);
  const fy = clamp(state.focal.y, fRy + 0.012, 1 - fRy - 0.012);
  const focalBox = {
    x0: fx - fRx,
    y0: fy - fRy,
    x1: fx + fRx,
    y1: fy + fRy,
    cx: fx,
    cy: fy,
    rx: fRx,
    ry: fRy,
    size: fSize,
  };

  // 说明文案块（随安全区宽略有响应，保持固定清晰阅读体量）
  const isCentered = state.copy.align === "center";
  const copyW = isCentered ? 0.44 : 0.34;
  const copyH = isCentered ? 0.19 : 0.22;
  let cx0 = isCentered ? state.copy.x - copyW * 0.5 : state.copy.x;
  let cy0 = state.copy.y;
  cx0 = clamp(cx0, 0.014, 1 - copyW - 0.014);
  cy0 = clamp(cy0, 0.02, 1 - copyH - 0.02);
  const copyBox = {
    x0: cx0,
    y0: cy0,
    x1: cx0 + copyW,
    y1: cy0 + copyH,
    cx: cx0 + copyW * 0.5,
    cy: cy0 + copyH * 0.5,
    w: copyW,
    h: copyH,
    align: state.copy.align,
  };

  // 3 处「填满焦虑」杂物块的实绘几何（与 stage.js 严格同源）
  const clutterBoxes = {};
  if (state.clutter.frame) {
    // 厚重模板装饰顶条 + 底条 + 外框（占去上下与四周可视区域）
    clutterBoxes.frameTop = {
      key: "frame",
      x0: 0.024,
      y0: 0.028,
      x1: 0.976,
      y1: 0.145,
      weight: 0.55,
      label: "装饰顶栏",
    };
    clutterBoxes.frameBottom = {
      key: "frame",
      x0: 0.024,
      y0: 0.875,
      x1: 0.976,
      y1: 0.972,
      weight: 0.45,
      label: "模板页脚栏",
    };
  }
  if (state.clutter.badge) {
    // 抢戏副徽章（等饱和度高亮块，制造多焦打架）
    clutterBoxes.badge = {
      key: "badge",
      x0: 0.72,
      y0: 0.165,
      x1: 0.955,
      y1: 0.355,
      cx: 0.8375,
      cy: 0.26,
      weight: 0.92,
      label: "抢戏副徽章",
    };
  }
  if (state.clutter.notes) {
    // 边角塞满的补充小字框
    clutterBoxes.notes = {
      key: "notes",
      x0: 0.045,
      y0: 0.70,
      x1: 0.49,
      y1: 0.86,
      cx: 0.2675,
      cy: 0.78,
      weight: 0.62,
      label: "边角补充小字",
    };
  }

  return { marginX, marginY, safeRect, focalBox, copyBox, clutterBoxes };
}

// 两个矩形的最短边间距（以幻灯片宽度为 1.0 归一化，纵轴按 1/SLIDE_ASPECT 换算成真实视觉欧氏距离）
function rectGapVisual(a, b) {
  const dx = Math.max(0, Math.max(a.x0 - b.x1, b.x0 - a.x1));
  const dy = Math.max(0, Math.max(a.y0 - b.y1, b.y0 - a.y1)) / SLIDE_ASPECT;
  const overlapX = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const overlapY = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const overlapping = overlapX > 0.001 && overlapY > 0.001;
  return {
    gap: overlapping ? -Math.min(overlapX, overlapY / SLIDE_ASPECT) : Math.hypot(dx, dy),
    dx,
    dy,
    overlapping,
    overlapArea: overlapX * overlapY,
  };
}

// 64×36 精网格实算总视觉占用率（天然处理重叠，不重复计算，无假常量）
function measureCoverage(geom, state) {
  const NX = 64;
  const NY = 36;
  let covered = 0;
  let sumX = 0;
  let sumY = 0;
  let totalW = 0;

  const { focalBox, copyBox, clutterBoxes } = geom;
  // 稍微加一点光学扩张（文字行间与图形视觉气场）让覆盖率贴合真实视觉观感
  const padX = 0.012;
  const padY = 0.018;

  const cList = Object.values(clutterBoxes);
  for (let j = 0; j < NY; j++) {
    const py = (j + 0.5) / NY;
    for (let i = 0; i < NX; i++) {
      const px = (i + 0.5) / NX;
      let hit = 0;
      // 1. 焦点圆（椭圆归一化距离 <= 1.06）
      const nd = Math.hypot((px - focalBox.cx) / (focalBox.rx + padX), (py - focalBox.cy) / (focalBox.ry + padY));
      if (nd <= 1.04) hit = Math.max(hit, 1.0);
      // 2. 说明文字块
      if (px >= copyBox.x0 - padX && px <= copyBox.x1 + padX && py >= copyBox.y0 - padY && py <= copyBox.y1 + padY) {
        hit = Math.max(hit, 0.85);
      }
      // 3. 杂物块
      for (const cb of cList) {
        if (px >= cb.x0 && px <= cb.x1 && py >= cb.y0 && py <= cb.y1) {
          hit = Math.max(hit, 0.95);
        }
      }
      // 4. 装饰外框四周边条（frame 开启时左右也有重框线）
      if (state.clutter.frame && (px < 0.042 || px > 0.958)) {
        hit = Math.max(hit, 0.8);
      }
      if (hit > 0) {
        covered += 1;
        sumX += px * hit;
        sumY += py * hit;
        totalW += hit;
      }
    }
  }
  const coverage = covered / (NX * NY);
  const whitespace = 1 - coverage;
  const centroid = totalW > 0 ? { x: sumX / totalW, y: sumY / totalW } : { x: 0.5, y: 0.5 };
  const eccentricity = Math.hypot(centroid.x - 0.5, (centroid.y - 0.5) / SLIDE_ASPECT);
  return { coverage, whitespace, centroid, eccentricity };
}

export function evaluate(state) {
  const geom = computeGeometry(state);
  const { marginX, marginY, safeRect, focalBox, copyBox, clutterBoxes } = geom;
  const { coverage, whitespace, centroid, eccentricity } = measureCoverage(geom, state);

  // 所有内容块对画布四边的真实最小净距
  const activeBoxes = [focalBox, copyBox, ...Object.values(clutterBoxes)];
  let minEdgeX = 1;
  let minEdgeY = 1;
  let breachSafe = false;
  for (const b of activeBoxes) {
    minEdgeX = Math.min(minEdgeX, b.x0, 1 - b.x1);
    minEdgeY = Math.min(minEdgeY, b.y0, 1 - b.y1);
  }
  // 主体与说明是否越出用户设定的虚线安全框
  const focalBreach =
    focalBox.x0 < safeRect.x0 - 0.004 ||
    focalBox.x1 > safeRect.x1 + 0.004 ||
    focalBox.y0 < safeRect.y0 - 0.004 ||
    focalBox.y1 > safeRect.y1 + 0.004;
  const copyBreach =
    copyBox.x0 < safeRect.x0 - 0.004 ||
    copyBox.x1 > safeRect.x1 + 0.004 ||
    copyBox.y0 < safeRect.y0 - 0.004 ||
    copyBox.y1 > safeRect.y1 + 0.004;
  breachSafe = focalBreach || copyBreach;

  const minEdge = Math.min(minEdgeX, minEdgeY / 1.12);

  // 呼吸距（主视觉与说明文字之间真实视觉间距）
  const gapInfo = rectGapVisual(focalBox, copyBox);
  const gap = gapInfo.gap;

  // 焦点数量与主次视觉权重比
  const clutterCount = CLUTTER_KEYS.filter((k) => state.clutter[k]).length;
  // 焦点圆饱和天蓝视觉权重大约按面积×色度系数算；文字块视觉权重较克制
  const focalArea = Math.PI * focalBox.rx * focalBox.ry;
  const focalWeight = focalArea * 4.8;
  const copyWeight = copyBox.w * copyBox.h * 0.92;
  const badgeWeight = state.clutter.badge ? 0.235 * 0.19 * 4.4 : 0;
  const rivalWeight = Math.max(copyWeight, badgeWeight);
  const dominance = rivalWeight > 0 ? focalWeight / rivalWeight : 1;
  const focusCount = 1 + (state.clutter.badge ? 1 : 0) + (state.clutter.notes ? 1 : 0);

  // 四维检测（与海报 4 要点一一对应：边距 / 留白 / 焦点 / 呼吸感）
  const checks = {
    margin: {
      ok: false,
      code: "ok",
      badge: "",
      metric: `${(minEdge * 100).toFixed(1)}%`,
    },
    whitespace: {
      ok: false,
      code: "ok",
      badge: "",
      metric: `${Math.round(whitespace * 100)}%`,
    },
    focus: {
      ok: false,
      code: "ok",
      badge: "",
      metric: "",
    },
    breathing: {
      ok: false,
      code: "ok",
      badge: "",
      metric: gapInfo.overlapping ? "叠压" : `${(gap * 100).toFixed(1)}%`,
    },
  };

  // 1. 边距检测（双向：贴边 vs 过缩邮票 + 越出安全线）
  if (marginX < THRESHOLDS.marginMin || minEdge < THRESHOLDS.marginMin - 0.005) {
    checks.margin.code = "cramped";
    checks.margin.badge = `贴边 ${(minEdge * 100).toFixed(1)}%`;
  } else if (breachSafe) {
    checks.margin.code = "breach";
    checks.margin.badge = "越出安全框";
  } else if (marginX > THRESHOLDS.marginMax) {
    checks.margin.code = "postage";
    checks.margin.badge = `过缩 ${(marginX * 100).toFixed(0)}%`;
  } else {
    checks.margin.ok = true;
    checks.margin.code = "ok";
    checks.margin.badge = `舒适 ${(marginX * 100).toFixed(1)}%`;
  }

  // 2. 留白检测（双向：留白塌陷 vs 过空失焦）
  if (whitespace < THRESHOLDS.whitespaceMin || clutterCount >= 2) {
    checks.whitespace.code = "crowded";
    checks.whitespace.badge = `过满 ${Math.round(whitespace * 100)}%`;
  } else if (clutterCount === 1) {
    checks.whitespace.code = "noise";
    checks.whitespace.badge = `余 1 处杂物`;
  } else if (whitespace > THRESHOLDS.whitespaceMax || focalBox.size < THRESHOLDS.focalSizeMin) {
    checks.whitespace.code = "void";
    checks.whitespace.badge = `空洞 ${Math.round(whitespace * 100)}%`;
  } else {
    checks.whitespace.ok = true;
    checks.whitespace.code = "ok";
    checks.whitespace.badge = `通透 ${Math.round(whitespace * 100)}%`;
  }

  // 3. 焦点检测（多焦抢戏 / 焦点过弱 / 焦点过大 / 偏沉失衡）
  if (state.clutter.badge || state.clutter.notes) {
    checks.focus.code = "split";
    checks.focus.badge = `${focusCount} 处抢戏`;
    checks.focus.metric = `${focusCount} 焦`;
  } else if (focalBox.size < THRESHOLDS.focalSizeMin || dominance < THRESHOLDS.dominanceMin) {
    checks.focus.code = "weak";
    checks.focus.badge = `主焦偏弱`;
    checks.focus.metric = `${dominance.toFixed(1)}×`;
  } else if (focalBox.size > THRESHOLDS.focalSizeMax) {
    checks.focus.code = "bloated";
    checks.focus.badge = `色块压迫`;
    checks.focus.metric = `${Math.round(focalBox.size * 100)}%宽`;
  } else if (eccentricity > THRESHOLDS.eccentricityMax) {
    checks.focus.code = "offbalance";
    checks.focus.badge = `偏沉一角`;
    checks.focus.metric = `偏心 ${Math.round(eccentricity * 100)}%`;
  } else {
    checks.focus.ok = true;
    checks.focus.code = "ok";
    checks.focus.badge = `单焦 ${dominance.toFixed(1)}×`;
    checks.focus.metric = `${dominance.toFixed(1)}×`;
  }

  // 4. 呼吸感检测（双向：贴死叠压 vs 孤岛散架）
  if (gapInfo.overlapping) {
    checks.breathing.code = "overlap";
    checks.breathing.badge = "图字叠压";
  } else if (gap < THRESHOLDS.gapMin) {
    checks.breathing.code = "tight";
    checks.breathing.badge = `粘连 ${(gap * 100).toFixed(1)}%`;
  } else if (gap > THRESHOLDS.gapMax) {
    checks.breathing.code = "drift";
    checks.breathing.badge = `散架 ${(gap * 100).toFixed(0)}%`;
  } else {
    checks.breathing.ok = true;
    checks.breathing.code = "ok";
    checks.breathing.badge = `顺畅 ${(gap * 100).toFixed(1)}%`;
  }

  const passed = Object.values(checks).filter((c) => c.ok).length;

  // 生成单真源白话诊断（讲清「为什么」与「下一步怎么做」）
  const diagnosis = buildDiagnosis({
    passed,
    checks,
    whitespace,
    marginX,
    minEdge,
    gap,
    gapInfo,
    clutterCount,
    focusCount,
    dominance,
    focalBox,
    eccentricity,
    state,
  });

  // 判定是否接近常见经典构型（仅供参考，任意满足 4/4 都算合法解）
  let arrangement = "自定义构图";
  if (passed === 4) {
    if (Math.abs(focalBox.cx - 0.5) < 0.06 && state.copy.align === "center") {
      arrangement = "居中禅意解";
    } else if (focalBox.cx > 0.56 && copyBox.cx < 0.46) {
      arrangement = "原海报右焦解";
    } else if (focalBox.cx < 0.44 && copyBox.cx > 0.54) {
      arrangement = "左核右述解";
    } else {
      arrangement = "自定义留白解";
    }
  }

  // 示意视觉落眼档位（不标假精确毫秒，用诚实档位）
  let scanTier = "一眼锁焦（示意）";
  if (passed <= 1) scanTier = "视线迷航（示意）";
  else if (passed === 2) scanTier = "两次折返（示意）";
  else if (passed === 3) scanTier = "略有滞留（示意）";

  return {
    geom,
    coverage,
    whitespace,
    centroid,
    eccentricity,
    minEdge,
    gap,
    gapInfo,
    clutterCount,
    focusCount,
    dominance,
    checks,
    passed,
    arrangement,
    scanTier,
    diagnosis,
  };
}

function buildDiagnosis(ctx) {
  const {
    passed,
    checks,
    whitespace,
    marginX,
    minEdge,
    gap,
    gapInfo,
    clutterCount,
    focusCount,
    dominance,
    focalBox,
    state,
  } = ctx;
  const wsPct = Math.round(whitespace * 100);

  if (passed === 4) {
    return {
      severity: "pass",
      shortTag: `4/4 · 留白成立`,
      title: `有效留白 ${wsPct}%，单一视觉焦点自然浮出纸面`,
      body: `外边距保持 ${(marginX * 100).toFixed(1)}%，天蓝焦点与说明文案之间有 ${(gap * 100).toFixed(1)}% 的空气走廊，主次视觉权重比达到 ${dominance.toFixed(1)}×。大面积暖白纸面退成安静的「底」，观众一眼就能停在核心内容上。`,
      action: `按空格或点「翻页实测」，亲眼看从高密度前页切进这一页时的视觉解压感；也可以继续拖动尝试居中或左核构图。`,
    };
  }

  // 优先级按最致命破坏排序
  if (clutterCount >= 2 && checks.whitespace.code === "crowded") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 填满焦虑`,
      title: `页上还挂着 ${clutterCount} 处多余杂物，有效留白被压到 ${wsPct}%`,
      body: `很多人面对空白幻灯片时会下意识加边框、贴角标、补备注。结果实心块吃掉 ${100 - wsPct}% 的画布，留白退化成夹缝，眼睛同时被 ${focusCount} 处元素拉扯，空白版式彻底失效。`,
      action: `直接点击画布上红色虚线标出的杂物块把它们扫出画面，再在空纸面向右横拖撑开安全边距。`,
    };
  }

  if (checks.focus.code === "split") {
    const names = [state.clutter.badge && "抢戏副徽章", state.clutter.notes && "边角补充小字"].filter(Boolean).join("、");
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 多焦抢戏`,
      title: `画面里还有「${names}」，焦点被拆成了 ${focusCount} 处`,
      body: `空白版式依赖「单一视觉焦点」建立秩序。当次要徽章和主视觉有相近的面积或饱和度时，人眼会在两者间反复横跳，反而比满页排版更显杂乱。`,
      action: `点掉画布上的「${names}」，让天蓝焦点独占画面最高视觉权重。`,
    };
  }

  if (checks.whitespace.code === "void" || checks.focus.code === "weak") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 空洞失焦`,
      title: `有效留白高达 ${wsPct}%、主焦点过弱，退化成了「真·空页」`,
      body: `留白不是越空越高级。当安全边距缩过头（${(marginX * 100).toFixed(1)}%）或主视觉宽度跌破 11%（现 ${(focalBox.size * 100).toFixed(1)}%），图—底关系失去锚点，后排观众会怀疑放映机卡在了空白母版。`,
      action: `把安全边距收回到 9%–18%，并把主焦点尺度拉回 14%–22%，让留白重新围绕主体组织视线。`,
    };
  }

  if (checks.margin.code === "cramped" || checks.margin.code === "breach") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 边距失守`,
      title:
        checks.margin.code === "breach"
          ? `元素越出了虚线安全边距框，边缘开始发紧`
          : `安全边距只有 ${(minEdge * 100).toFixed(1)}%，内容快顶到幕布边缘`,
      body: `投影幕布四边常有轻微裁切或眩光，元素一旦贴进 8% 以内，整张幻灯片会显得局促逼仄，即便中间空出一大片，页面依然没有松弛感。`,
      action: `在画布空纸处向右横拖把虚线边距框撑到 9%–16%，或把越界的元素往内轻轻拉回安全区。`,
    };
  }

  if (checks.margin.code === "postage") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 邮票内缩`,
      title: `外边距缩到了 ${(marginX * 100).toFixed(1)}%，内容被挤成中间一张小邮票`,
      body: `过厚的外边框会把中间活动区压得太窄，图文被迫在狭小盒子里打挤，四周留下的只是僵硬的被动边角料，而不是流动的呼吸感。`,
      action: `向左横拖空纸面，把安全边距放回 9%–18% 的舒适区间。`,
    };
  }

  if (checks.breathing.code === "overlap" || checks.breathing.code === "tight") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 呼吸粘连`,
      title: gapInfo.overlapping
        ? `天蓝焦点与说明文案直接叠压，视线读不通`
        : `主焦点与说明文案净距只有 ${(gap * 100).toFixed(1)}%，紧贴发闷`,
      body: `即便整页留白够大，如果关键元素之间没有留出清晰的空气通道（至少 5% 净距），大脑会把图形和文字粘成一块噪音，信息反而不易被理解。`,
      action: `直接拖动天蓝焦点圆或说明文字块，把两者的净距拉开到 7%–24% 之间。`,
    };
  }

  if (checks.breathing.code === "drift") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 孤岛散架`,
      title: `主焦点与说明文案隔开了 ${(gap * 100).toFixed(0)}%，彼此失去视觉联系`,
      body: `把元素甩到对角看似留白很大，实则打破了格式塔接近原则——观众看完天蓝焦点后，视线要跨越大片真空才能找到文字，形成「空散」而非「呼吸感」。`,
      action: `把说明文案和天蓝焦点稍微拉近到 8%–24% 的呼应距离，让留白在外围包裹整体。`,
    };
  }

  if (checks.focus.code === "bloated") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 色块压迫`,
      title: `主视觉涨到占宽 ${Math.round(focalBox.size * 100)}%，把主动留白压扁了`,
      body: `主体过大时，剩余空间只能贴边喘息，原本用来托起焦点的暖白画纸消失了，页面从「留白版式」退化成「满幅海报」。`,
      action: `调节「主焦点尺度」滑轨（或按键盘上下方向键）把主焦点收回到 14%–22%，把呼吸空间还给画纸。`,
    };
  }

  if (checks.focus.code === "offbalance") {
    return {
      severity: "fail",
      shortTag: `${passed}/4 · 偏沉一角`,
      title: `图文全部挤向画面一侧，整页视觉重心失衡`,
      body: `非对称构图依然讲究重心平衡：单侧过沉会让另一半大面积空白显得像忘了排版的空洞。`,
      action: `把说明文案与主焦点分置两侧形成轻重呼应，或双双移回光学居中区。`,
    };
  }

  // 余 1 处框线杂物
  return {
    severity: "fail",
    shortTag: `${passed}/4 · 仍有噪音`,
    title: `还剩「装饰外框与页脚栏」在抢走画面的安静感`,
    body: `空白版式最容易残留的就是模板自带的上下色条与装饰边框。把这最后一层壳剥掉，纸面和焦点的图—底对比才会彻底干净。`,
    action: `点掉画布顶部/底部的虚线装饰条，即可达成 4/4。`,
  };
}
