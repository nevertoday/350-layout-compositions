// 122 简化构图原则 · 单真源几何与认知编码模型
// 左室（视觉输入）的图形坐标、规整度、杂件开关是唯一状态源；
// 画布绘制、右室「大脑简译」、顶部活体徽标、四维支柱与白话诊单全部从 analyze(state) 读取。

export const PALETTE = {
  paper: "#FCF8F2",
  paperLight: "#FFFDF9",
  sand: "#F2ECE2",
  ink: "#0E1110",
  inkMid: "#464C49",
  orange: "#E3540E",
  orangeText: "#B23B00",
  green: "#135936",
  greenDark: "#0B291B",
  navy: "#1A2962",
  navyDark: "#0E173B",
  pink: "#F78EAD",
  pinkText: "#9E1F4E",
  stone: "#D6CDC0",
  danger: "#B41C24",
  dangerBg: "#FDECEC",
  okBg: "#E6F4EC",
};

export const SUBJECTS = {
  poster: {
    id: "poster",
    label: "原海报几何塔",
    en: "POSTER PRIMITIVES",
    leftTitle: "复杂的图形（视觉输入）",
    rightTitle: "大脑的简化解读（最简形态）",
    coreNames: { circle: "朱橘圆", square: "松绿方", triangle: "樱粉三角" },
    coreRoles: { circle: "主体核心", square: "结构基座", triangle: "稳定指向" },
    clutterNames: { fork: "深蓝斜叉条", arc: "暖灰底弧", chips: "角部噪块" },
    note: "还原 122 号原海报：当橘圆、绿方、粉三角被深蓝斜叉与暖灰弧叠加遮挡时，大脑仍会试图拆解出最简三原形。",
  },
  logo: {
    id: "logo",
    label: "品牌徽标提炼",
    en: "BRAND MARK",
    leftTitle: "繁复初稿（饰件过载）",
    rightTitle: "小尺寸识别骨架",
    coreNames: { circle: "落日圆", square: "灯塔柱", triangle: "光束山" },
    coreRoles: { circle: "天际焦点", square: "灯塔本体", triangle: "光束方向" },
    clutterNames: { fork: "斜向装饰绶带", arc: "冗余外衬圈", chips: "浪花锯齿饰钉" },
    note: "徽标缩到 24px 图标时，多余的绶带与外圈会糊成一团；保留圆、柱、三角三骨架，缩再小也能一眼认出。",
  },
  card: {
    id: "card",
    label: "移动卡片减法",
    en: "MOBILE CARD",
    leftTitle: "杂乱促销卡（元素打架）",
    rightTitle: "一秒扫读骨架",
    coreNames: { circle: "视觉主徽", square: "内容主块", triangle: "行动角标" },
    coreRoles: { circle: "第一落点", square: "核心信息区", triangle: "点击指向" },
    clutterNames: { fork: "斜切角标带", arc: "花哨底纹块", chips: "漂浮彩屑签" },
    note: "移动端首屏停留常不到两秒：拿掉斜切飘带与装饰底纹、排顺主徽与内容块的轴线，视线才能顺滑落地。",
  },
};

export const REGULARITY_BAND = { min: 55, max: 88 }; // 经验参考甜点带：过低则锯齿杂乱，过高则三形趋同失义

export const PRESETS = {
  clutter_0: {
    label: "复原 0/4 错态",
    regularity: 18,
    clutter: { fork: true, arc: true, chips: true },
    cores: {
      circle: { u: 0.40, v: 0.44, r: 0.185, rot: -14, active: true },
      square: { u: 0.56, v: 0.45, r: 0.175, rot: 13, active: true },
      triangle: { u: 0.48, v: 0.58, r: 0.185, rot: -11, active: true },
    },
  },
  poster_tower: {
    label: "原海报竖塔解",
    regularity: 76,
    clutter: { fork: false, arc: false, chips: false },
    cores: {
      circle: { u: 0.50, v: 0.22, r: 0.135, rot: 0, active: true },
      square: { u: 0.50, v: 0.50, r: 0.132, rot: 0, active: true },
      triangle: { u: 0.50, v: 0.78, r: 0.140, rot: 0, active: true },
    },
  },
  bauhaus_row: {
    label: "横向等距解",
    regularity: 74,
    clutter: { fork: false, arc: false, chips: false },
    cores: {
      circle: { u: 0.22, v: 0.51, r: 0.125, rot: 0, active: true },
      square: { u: 0.50, v: 0.51, r: 0.122, rot: 0, active: true },
      triangle: { u: 0.78, v: 0.51, r: 0.132, rot: 0, active: true },
    },
  },
  triad_balance: {
    label: "品字均衡解",
    regularity: 72,
    clutter: { fork: false, arc: false, chips: false },
    cores: {
      circle: { u: 0.50, v: 0.27, r: 0.132, rot: 0, active: true },
      square: { u: 0.31, v: 0.69, r: 0.128, rot: 0, active: true },
      triangle: { u: 0.69, v: 0.69, r: 0.136, rot: 0, active: true },
    },
  },
  trap_over: {
    label: "试错：过度极简",
    regularity: 97,
    clutter: { fork: false, arc: false, chips: false },
    cores: {
      circle: { u: 0.34, v: 0.50, r: 0.132, rot: 0, active: true },
      square: { u: 0.66, v: 0.50, r: 0.132, rot: 0, active: true },
      triangle: { u: 0.50, v: 0.76, r: 0.132, rot: 0, active: false },
    },
  },
  trap_pile: {
    label: "试错：叠成一团",
    regularity: 74,
    clutter: { fork: false, arc: false, chips: false },
    cores: {
      circle: { u: 0.46, v: 0.47, r: 0.165, rot: -6, active: true },
      square: { u: 0.54, v: 0.50, r: 0.160, rot: 8, active: true },
      triangle: { u: 0.49, v: 0.55, r: 0.165, rot: -5, active: true },
    },
  },
};

export function createInitialState() {
  return clonePreset("clutter_0", "poster");
}

export function clonePreset(presetKey, subject = "poster") {
  const p = PRESETS[presetKey] || PRESETS.clutter_0;
  return {
    subject,
    regularity: p.regularity,
    clutter: { ...p.clutter },
    cores: {
      circle: { ...p.cores.circle },
      square: { ...p.cores.square },
      triangle: { ...p.cores.triangle },
    },
    selectedCore: null,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 计算当前规整度下的锯齿度 (0..1) 与过度均质化度 (0..1)
export function shapeFactors(regularity) {
  const jagged = regularity < REGULARITY_BAND.min
    ? (REGULARITY_BAND.min - regularity) / REGULARITY_BAND.min
    : 0;
  const homogenize = regularity > REGULARITY_BAND.max
    ? (regularity - REGULARITY_BAND.max) / (100 - REGULARITY_BAND.max)
    : 0;
  return { jagged, homogenize };
}

// 生成任意核心基本形在局部坐标系中的真实多边形轮廓（半径 1）
// 用于 Canvas 实绘，同时用于单真源拐点数统计与点内测试！
export function buildCoreLocalPoints(kind, regularity, subject = "poster") {
  const { jagged, homogenize } = shapeFactors(regularity);
  const N = 36;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    let bx, by;
    if (kind === "circle") {
      bx = Math.cos(a);
      by = Math.sin(a);
    } else if (kind === "square") {
      // 超椭圆 / 方形：随 homogenize 趋近圆
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const sqx = Math.sign(ca) * Math.min(1, Math.abs(ca) / Math.max(Math.abs(ca), Math.abs(sa), 1e-4));
      const sqy = Math.sign(sa) * Math.min(1, Math.abs(sa) / Math.max(Math.abs(ca), Math.abs(sa), 1e-4));
      // 灯塔题材方块略呈直立柱体比例
      const rx = subject === "logo" ? 0.72 : 0.94;
      const ry = subject === "logo" ? 1.10 : 0.94;
      const sx = sqx * rx;
      const sy = sqy * ry;
      bx = sx * (1 - homogenize) + Math.cos(a) * homogenize;
      by = sy * (1 - homogenize) + Math.sin(a) * homogenize;
    } else {
      // 等边三角形（顶点朝上），随 homogenize 磨圆成无差别圆
      const verts = [
        [0, -1.08],
        [1.04, 0.84],
        [-1.04, 0.84],
      ];
      // 将角度映射到三条边上
      const seg = (i / N) * 3;
      const idx = Math.floor(seg) % 3;
      const t = seg - Math.floor(seg);
      const v0 = verts[idx];
      const v1 = verts[(idx + 1) % 3];
      const tx = v0[0] + (v1[0] - v0[0]) * t;
      const ty = v0[1] + (v1[1] - v0[1]) * t;
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      bx = tx * (1 - homogenize) + cx * homogenize;
      by = ty * (1 - homogenize) + cy * homogenize;
    }

    // 欠规整时的确定性毛刺折角（保证画面清晰、可复现，不随帧随机乱抖）
    if (jagged > 0.005) {
      const seed = kind === "circle" ? 1.3 : kind === "square" ? 2.7 : 4.1;
      const wobble =
        Math.sin(i * 1.9 + seed) * 0.16 +
        Math.cos(i * 3.3 - seed * 0.7) * 0.11 +
        ((i % 3 === 0 ? 1 : -0.6) * 0.08);
      const scale = 1 + wobble * jagged;
      bx *= scale;
      by *= scale;
    }
    pts.push([bx, by]);
  }
  return pts;
}

// 将局部多边形变换到规范化腔室坐标 [0..1]×[0..1]
export function coreWorldPoly(kind, core, regularity, subject = "poster") {
  const local = buildCoreLocalPoints(kind, regularity, subject);
  const { jagged } = shapeFactors(regularity);
  // 当规整度进入甜点带时，轻微摆正固有歪斜角（用户手动拖离轴另算）
  const effRot = (core.rot * Math.PI) / 180 * (0.2 + 0.8 * jagged);
  const cr = Math.cos(effRot);
  const sr = Math.sin(effRot);
  return local.map(([lx, ly]) => [
    core.u + (lx * cr - ly * sr) * core.r,
    core.v + (lx * sr + ly * cr) * core.r,
  ]);
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// 3 枚原海报干扰杂件的规范化几何判定（与 canvas 实绘一致）
export function clutterHitTest(key, u, v) {
  if (key === "fork") {
    // 原海报深靛蓝斜叉条 + 左侧三横杠
    const dx = u - 0.45, dy = v - 0.52;
    const rx = dx * Math.cos(0.74) - dy * Math.sin(0.74);
    const ry = dx * Math.sin(0.74) + dy * Math.cos(0.74);
    const onDiag = Math.abs(rx) < 0.25 && Math.abs(ry) < 0.055;
    const onBars = u >= 0.15 && u <= 0.36 && v >= 0.56 && v <= 0.74;
    return onDiag || onBars;
  }
  if (key === "arc") {
    // 原海报右下暖灰底弧
    const d = Math.hypot(u - 0.56, v - 0.67);
    return d <= 0.21 && u >= 0.52 && v >= 0.56;
  }
  if (key === "chips") {
    // 三处角部零碎饰块
    return (
      Math.hypot(u - 0.20, v - 0.24) < 0.085 ||
      Math.hypot(u - 0.81, v - 0.24) < 0.085 ||
      Math.hypot(u - 0.80, v - 0.78) < 0.085
    );
  }
  return false;
}

// 单真源几何分析：计算实绘拐点数、真实像素占比遮挡率、对齐解型、四支柱与唯一首要诊单
export function analyze(state) {
  const subj = SUBJECTS[state.subject] || SUBJECTS.poster;
  const { jagged, homogenize } = shapeFactors(state.regularity);
  const coreKeys = ["circle", "square", "triangle"];
  const activeCores = coreKeys.filter((k) => state.cores[k].active);
  const activeClutter = Object.keys(state.clutter).filter((k) => state.clutter[k]);

  // 1. 生成每个存活核心形的实绘世界多边形
  const polys = {};
  for (const k of activeCores) {
    polys[k] = coreWorldPoly(k, state.cores[k], state.regularity, state.subject);
  }

  // 2. 用 26×26 精细采样网单真源实算面积、核心互叠率与杂件遮挡率
  const GRID = 26;
  let coreUnionCells = 0;
  let coreOverlapCells = 0;
  let clutterCoverCells = 0;
  for (let iy = 0; iy < GRID; iy++) {
    const v = (iy + 0.5) / GRID;
    for (let ix = 0; ix < GRID; ix++) {
      const u = (ix + 0.5) / GRID;
      let coreHits = 0;
      for (const k of activeCores) {
        if (pointInPoly(u, v, polys[k])) coreHits++;
      }
      if (coreHits > 0) {
        coreUnionCells++;
        if (coreHits >= 2) coreOverlapCells++;
        let clutterHit = false;
        for (const ck of activeClutter) {
          if (clutterHitTest(ck, u, v)) {
            clutterHit = true;
            break;
          }
        }
        if (clutterHit) clutterCoverCells++;
      }
    }
  }

  const coreOverlapPct = coreUnionCells ? Math.round((coreOverlapCells / coreUnionCells) * 100) : 0;
  const clutterCoverPct = coreUnionCells ? Math.round((clutterCoverCells / coreUnionCells) * 100) : 0;
  const totalOcclusionPct = Math.min(100, Math.round(((coreOverlapCells + clutterCoverCells * 0.85) / Math.max(1, coreUnionCells)) * 100));

  // 3. 边界贴边检测（核心形外框不得顶穿画框）
  let edgeClipped = false;
  let minMargin = 1;
  for (const k of activeCores) {
    const c = state.cores[k];
    const m = Math.min(c.u - c.r, 1 - c.u - c.r, c.v - c.r, 1 - c.v - c.r);
    if (m < minMargin) minMargin = m;
    if (m < 0.025) edgeClipped = true;
  }

  // 4. 秩序与解型识别（接受竖塔、横排、品字或均衡分离多解！）
  let layoutPattern = "散乱失序";
  let axisAligned = false;
  if (activeCores.length === 3) {
    const list = activeCores.map((k) => state.cores[k]);
    const us = list.map((c) => c.u);
    const vs = list.map((c) => c.v);
    const uSpread = Math.max(...us) - Math.min(...us);
    const vSpread = Math.max(...vs) - Math.min(...vs);
    // 最小中心距，避免贴死
    const d01 = Math.hypot(list[0].u - list[1].u, list[0].v - list[1].v);
    const d12 = Math.hypot(list[1].u - list[2].u, list[1].v - list[2].v);
    const d02 = Math.hypot(list[0].u - list[2].u, list[0].v - list[2].v);
    const minDist = Math.min(d01, d12, d02);
    const cx = (us[0] + us[1] + us[2]) / 3;
    const cy = (vs[0] + vs[1] + vs[2]) / 3;
    const balancedCenter = Math.abs(cx - 0.5) < 0.16 && Math.abs(cy - 0.5) < 0.16;

    if (uSpread <= 0.13 && vSpread >= 0.34 && minDist >= 0.21) {
      axisAligned = true;
      layoutPattern = "原海报竖塔解";
    } else if (vSpread <= 0.13 && uSpread >= 0.34 && minDist >= 0.21) {
      axisAligned = true;
      layoutPattern = "横向等距解";
    } else if (balancedCenter && minDist >= 0.24 && coreOverlapPct <= 10) {
      axisAligned = true;
      // 判断是否呈品字/三角对称
      const sortedY = [...list].sort((a, b) => a.v - b.v);
      const bottomLevel = Math.abs(sortedY[1].v - sortedY[2].v) < 0.12;
      layoutPattern = bottomLevel ? "品字均衡解" : "均衡分散解";
    } else if (coreOverlapPct > 14) {
      layoutPattern = "重叠咬死";
    } else {
      layoutPattern = "偏轴散落";
    }
  } else {
    layoutPattern = `骨架残缺(${activeCores.length}/3)`;
  }

  // 5. 结构编码负荷估算（基于真实规则数：核心拐点 + 杂件规则 + 遮挡解包惩罚）
  const baseBends =
    (state.cores.circle.active ? 1 : 0) +
    (state.cores.square.active ? 4 : 0) +
    (state.cores.triangle.active ? 3 : 0);
  const jaggedBends = Math.round(jagged * 18 * (activeCores.length / 3));
  const clutterBends =
    (state.clutter.fork ? 10 : 0) +
    (state.clutter.arc ? 3 : 0) +
    (state.clutter.chips ? 9 : 0);
  const contourBends = Math.max(1, Math.round(baseBends * (1 - homogenize * 0.65) + jaggedBends + clutterBends));

  // 辨识区分度（满 100%，删核或过度均质都会暴跌）
  const distinctiveness = Math.round(
    (activeCores.length / 3) * (1 - homogenize * 0.72) * (1 - Math.min(0.45, clutterCoverPct / 140)) * 100
  );

  // 认知编码档位（按 BRIEF.md 规范用档位/示意，不做假精确百分比）
  let loadTier = "轻快直读";
  const rawLoad = contourBends + Math.round(coreOverlapPct * 0.25) + (axisAligned ? 0 : 4);
  if (activeCores.length < 3 || homogenize > 0.2) loadTier = "信息失真";
  else if (rawLoad >= 24) loadTier = "严重过载";
  else if (rawLoad >= 15) loadTier = "仍需减负";
  else if (rawLoad >= 11) loadTier = "接近最简";
  else loadTier = "最简直读";

  // 6. 四根支柱独立判定（完全对应原海报底栏四词）
  const pillars = {
    simplicity: {
      ok: activeClutter.length === 0 && activeCores.length === 3,
      badge:
        activeCores.length < 3
          ? `缺核 ${activeCores.length}/3`
          : activeClutter.length > 0
            ? `杂件 ${activeClutter.length} 处`
            : "零杂件 · 3/3",
    },
    rule: {
      ok: state.regularity >= REGULARITY_BAND.min && state.regularity <= REGULARITY_BAND.max,
      badge:
        state.regularity < REGULARITY_BAND.min
          ? `锯齿 ${contourBends} 折`
          : state.regularity > REGULARITY_BAND.max
            ? `趋同 ${state.regularity}%`
            : `甜点 ${state.regularity}%`,
    },
    order: {
      ok: activeCores.length === 3 && coreOverlapPct <= 14 && !edgeClipped && axisAligned,
      badge:
        edgeClipped
          ? "贴边失稳"
          : coreOverlapPct > 14
            ? `遮挡 ${coreOverlapPct}%`
            : axisAligned
              ? layoutPattern
              : "偏轴散乱",
    },
    readability: {
      ok:
        activeCores.length === 3 &&
        activeClutter.length === 0 &&
        homogenize === 0 &&
        jagged === 0 &&
        coreOverlapPct <= 14 &&
        distinctiveness >= 80,
      badge:
        activeCores.length < 3
          ? "丢语义"
          : homogenize > 0
            ? "撞形难辨"
            : distinctiveness >= 85 && coreOverlapPct <= 14 && activeClutter.length === 0 && jagged === 0
              ? "一眼直读"
              : loadTier,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 7. 单真源首要诊断（区分过度简化 vs 欠简化，明确说明「为什么」与「下一步」）
  let status = "optimal";
  let tag = `4/4 · ${layoutPattern}`;
  let headline = `三基本形清晰解包，大脑以 ${contourBends} 处关键折点一眼直读`;
  let detail = `左室已剥离全部干扰杂件、轮廓落在 ${REGULARITY_BAND.min}%–${REGULARITY_BAND.max}% 规整甜点带内，且「${subj.coreNames.circle} / ${subj.coreNames.square} / ${subj.coreNames.triangle}」以${layoutPattern}排开、互叠仅 ${coreOverlapPct}%。大脑无需费力补全被遮挡的边界，直接锁定稳定结构。`;
  let action = "试试把规整度拉到 95% 以上，或点击删掉一块核心图形——体验「过度简化」如何让画面反过来失去辨识度。";
  let canvasFix = null; // 画布内红警签一键纠错信息

  if (activeCores.length < 3) {
    status = "missing_core";
    const missing = coreKeys.filter((k) => !state.cores[k].active).map((k) => subj.coreNames[k]).join("、");
    tag = `${passCount}/4 · 过度简化`;
    headline = `删掉了核心骨架「${missing}」，简化过度导致丢语义`;
    detail = `视觉负荷确实降到了最低，但「${subj.coreNames.circle} / ${subj.coreNames.square} / ${subj.coreNames.triangle}」三块各司其职；把主体本身也削掉后，大脑虽然省力，却读不出原本想表达的结构含义。`;
    action = "点击左室虚线残影（或点击上方恢复按钮），把误删的核心基本形补回画布。";
    canvasFix = { id: "restore_cores", label: `× 骨架残缺 ${activeCores.length}/3 · 点此补回` };
  } else if (state.regularity > REGULARITY_BAND.max) {
    status = "homogenized";
    tag = `${passCount}/4 · 过度均质`;
    headline = `规整度拉满到 ${state.regularity}%，方与三角被磨成了无差异圆饼`;
    detail = `简化不是「全部削圆」。超过 ${REGULARITY_BAND.max}% 后，${subj.coreNames.square}的直角稳重感与${subj.coreNames.triangle}的方向尖角被强行抹平，三块形状趋同、辨识区分度跌至 ${distinctiveness}%（示意），读者反而要靠死记颜色才能分辨。`;
    action = `在画布向左轻拖（或回拉「轮廓规整度」滑杆），退回 ${REGULARITY_BAND.min}%–${REGULARITY_BAND.max}% 甜点带恢复棱角。`;
    canvasFix = { id: "fix_homogenize", label: `× 过度趋同 ${state.regularity}% · 点此退回甜点` };
  } else if (activeClutter.length > 0) {
    status = "cluttered";
    const names = activeClutter.map((k) => subj.clutterNames[k]).join("、");
    tag = `${passCount}/4 · 杂件遮挡`;
    headline = `仍有 ${activeClutter.length} 处干扰杂件（${names}）压住主体轮廓`;
    detail = `当前左室轮廓折点高达 ${contourBends} 处，杂件横切核心图形造成 ${clutterCoverPct}% 表面遮挡。视觉系统被迫在右室先花算力剥离蓝叉与底弧、再做无形态补全，第一眼看不清真正的主角。`;
    action = "直接在左室点击深蓝斜叉、暖灰底弧或角部噪块逐一剥离（或点画布上的红标一次清掉）。";
    canvasFix = { id: "strip_clutter", label: `× 杂件 ${activeClutter.length} 处 · 点此剥离` };
  } else if (state.regularity < REGULARITY_BAND.min) {
    status = "jagged";
    tag = `${passCount}/4 · 轮廓过碎`;
    headline = `轮廓规整度仅 ${state.regularity}%，多余锯齿把编码推高到 ${contourBends} 处`;
    detail = `杂件虽然拿掉了，但三块基本形边缘还带着大量毛刺折角，大脑在记忆时会不断试着把它们「拉平」成标准圆、方、三角，平白增加视觉噪声与扫描耗时。`;
    action = `在画布空白处向右横拖（或拖下方滑杆），将规整度调入 ${REGULARITY_BAND.min}%–${REGULARITY_BAND.max}% 甜点带，但别拉爆到 90% 以上。`;
    canvasFix = { id: "fix_jagged", label: `× 轮廓过碎 ${state.regularity}% · 点此归整` };
  } else if (edgeClipped) {
    status = "edge_clipped";
    tag = `${passCount}/4 · 贴边失稳`;
    headline = "核心图形紧贴画框边缘，稳定形态被边框切出紧张感";
    detail = "简化构图需要足够的外部呼吸余量来托住几何轮廓。图形紧顶边界时，大脑会分心去判断它是不是被截断了，削弱整体稳定度。";
    action = "把靠边的图形往画布内侧轻拖，或点选下方「原海报竖塔解 / 横向等距解 / 品字均衡解」重排秩序。";
    canvasFix = { id: "fix_order", label: "× 贴边失稳 · 点此归位" };
  } else if (coreOverlapPct > 14) {
    status = "occluded";
    tag = `${passCount}/4 · 重叠咬死`;
    headline = `三基本形互相重叠达 ${coreOverlapPct}%，交界处制造出多余的凹角碎片`;
    detail = "重叠越深，画面物理边界上冒出的虚假交角越多，大脑必须耗费额外步骤判断「谁在前、谁在后、被挡住的部分是什么形状」。把它们拉开到 14% 叠压以内，秩序立刻清晰。";
    action = "在左室直接拖开重叠的橘圆、绿方或粉三角，或切换下方的「原海报竖塔解 / 横向等距解 / 品字均衡解」。";
    canvasFix = { id: "fix_order", label: `× 叠压 ${coreOverlapPct}% · 点此拆开` };
  } else if (!axisAligned) {
    status = "scattered";
    tag = `${passCount}/4 · 偏轴散落`;
    headline = "三块图形虽无遮挡，但彼此失去对齐轴线，像随手散放的积木";
    detail = "简化构图不只靠少画几笔，更靠可一眼概括的「规则与秩序」。把三基本形对齐到一条竖轴、横轴或对称品字结构，大脑只需记住 1 条排列规则就能打包全部三块。";
    action = "把三块图形沿中心竖线或水平线拖齐（靠近中线会自动亮起绿准线），或任选一种合法排布解。";
    canvasFix = { id: "fix_order", label: "× 偏轴散落 · 点此对齐" };
  }

  return {
    subject: subj,
    jagged,
    homogenize,
    activeCoreCount: activeCores.length,
    activeClutterCount: activeClutter.length,
    contourBends,
    coreOverlapPct,
    clutterCoverPct,
    totalOcclusionPct,
    distinctiveness,
    edgeClipped,
    axisAligned,
    layoutPattern,
    loadTier,
    pillars,
    passCount,
    status,
    isOptimal: passCount === 4,
    tag,
    headline,
    detail,
    action,
    canvasFix,
  };
}

// 01 节双解编码天平数据（单真源）
export const PUZZLES_S01 = {
  olympic: {
    id: "olympic",
    title: "五环交叠",
    simpleCount: "5 个等径圆环",
    simpleRules: 5,
    fragmentCount: "9 块不规则月牙与交叉环段",
    fragmentRules: 28,
    summary: "把五个交叠圆环当成「5 个完整圆」只需记住 1 种半径和 5 个圆心；若按物理线条交点硬拆成 9 块不相连的弯钩碎片，规则暴涨五倍以上，大脑几乎不可能那样看。",
  },
  trio: {
    id: "trio",
    title: "三形叠加（122 原海报原型）",
    simpleCount: "圆 + 方 + 三角（3 个基本形）",
    simpleRules: 8,
    fragmentCount: "11 块锯齿凹多边形与残片",
    fragmentRules: 34,
    summary: "这正是 122 号原海报的视觉起点：尽管圆、方、三角互相压住，视觉系统仍把隐藏在后方的边线补完整，解码成 3 个熟知的基本几何体，而非 11 块拼图残片。",
  },
  cross: {
    id: "cross",
    title: "十字交叠长条",
    simpleCount: "2 条正交矩形",
    simpleRules: 4,
    fragmentCount: "1 个 12 边凹多边形 / 5 块碎方",
    fragmentRules: 18,
    summary: "一个实心十字在物理轮廓上是 12 条线段围成的凹多边形；但大脑更愿把它编码为「一横一竖两条等宽长条」，因为它用对称和重复把描述长度压缩了一大半。",
  },
};
