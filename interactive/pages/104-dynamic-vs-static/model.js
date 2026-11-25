// 104 动静对比 DYNAMIC VS STATIC —— 单一真源数据与判定模型
// 所有经验区间、画布逻辑坐标、读数文案与小节交互共用此文件，绝不双处写死。

export const EMPIRICAL = {
  minDynamic: 1,
  maxDynamic: 2, // 9 格中 1–2 块破格 => 静区占 78%–89%（经验稳态带 70%–90%）
  angleMin: 30,  // 经验斜角舒适带下限（度）
  angleMax: 60,  // 经验斜角舒适带上限（度）
  angleSoftLow: 26,
  angleSoftHigh: 68,
  reachMin: 0.48, // 脱离静格边界形成暗场空间张力的经验下限
  reachMax: 0.86, // 避免顶死画框截断前路的经验上限
  wcagSeconds: 5, // W3C WCAG 2.2 成功标准 2.2.2 阈值
};

// 开场刻意错态：「全动失锚」—— 6/9 块方格同时离格乱飞，主破格停在 16° 浅斜、冲距 40%
export function createInitialHeroState() {
  return {
    // 3×3 九宫格（0..8 按行优先）：true = 动（破格飞出），false = 静（稳锁正交格）
    tiles: [false, true, true, true, false, true, false, true, true],
    angle: 16,
    reach: 0.40,
    paused: false,
  };
}

// 纯全静对照态：9/9 全锁正交
export function createAllStaticState() {
  return {
    tiles: [false, false, false, false, false, false, false, false, false],
    angle: 48,
    reach: 0.72,
    paused: false,
  };
}

// 每个方格如果处于「动」态，对应的固有散飞偏移特征（用于多块同时破格时呈现冲突乱飞）
export const TILE_SHARDS = [
  { row: 0, col: 0, dAngle: -28, distMul: 0.56, spin: -24, color: "mint" },
  { row: 0, col: 1, dAngle: 22,  distMul: 0.68, spin: 31,  color: "ivory" },
  { row: 0, col: 2, dAngle: 6,   distMul: 0.82, spin: 14,  color: "mint" },
  { row: 1, col: 0, dAngle: -36, distMul: 0.62, spin: -38, color: "orange" },
  { row: 1, col: 1, dAngle: 15,  distMul: 0.52, spin: 22,  color: "mint" },
  { row: 1, col: 2, dAngle: -14, distMul: 0.78, spin: -19, color: "ivory" },
  { row: 2, col: 0, dAngle: -42, distMul: 0.48, spin: -32, color: "mint" },
  { row: 2, col: 1, dAngle: -19, distMul: 0.66, spin: 28,  color: "orange" },
  { row: 2, col: 2, dAngle: 0,   distMul: 0.74, spin: 12,  color: "mint" },
];

// 计算画布内的统一几何骨架（宽屏、平板、390 竖屏、844 横屏完全等比保正圆）
export function computeStageMetrics(W, H) {
  const wide = W / Math.max(1, H) >= 1.55 && W >= 720;
  const U = wide ? Math.min(H * 0.96, W * 0.48) : Math.min(W * 0.92, H * 0.88);
  const cx = wide ? W * 0.48 : W * 0.47;
  const cy = wide ? H * 0.56 : H * 0.55;

  const gridSize = U * 0.45;
  const gap = gridSize * 0.052;
  const cell = (gridSize - gap * 2) / 3;
  const gridX = cx - U * 0.41;
  const gridY = cy - U * 0.16;

  // 橘红发射支点：严格落在原海报 3×3 网格左下与中下格交界处
  const pivotX = gridX + cell * 1.02;
  const pivotY = gridY + gridSize * 0.96;
  const pivotR = U * 0.052;
  const orbR = U * 0.112;
  const rMax = U * 0.94;

  // 暗场虚线张力环（原海报中右下虚线圆）
  const ghostX = pivotX + U * 0.43;
  const ghostY = pivotY - U * 0.06;
  const ghostR = U * 0.132;

  return {
    W, H, wide, U, cx, cy,
    gridSize, gap, cell, gridX, gridY,
    pivotX, pivotY, pivotR, orbR, rMax,
    ghostX, ghostY, ghostR,
  };
}

// 由极坐标 (angle, reach) 求破格大圆球圆心
export function polarToOrb(m, angleDeg, reach) {
  const rad = (angleDeg * Math.PI) / 180;
  const dist = reach * m.rMax;
  const rawX = m.pivotX + Math.cos(rad) * dist;
  const rawY = m.pivotY - Math.sin(rad) * dist;
  const pad = m.orbR + 10;
  return {
    x: Math.max(pad, Math.min(m.W - pad, rawX)),
    y: Math.max(pad, Math.min(m.H - pad, rawY)),
    rawX,
    rawY,
    rad,
    dist,
  };
}

// 由画布点击/拖拽点反推 (angle, reach)
export function pointToPolar(m, px, py) {
  const dx = px - m.pivotX;
  const dy = m.pivotY - py;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 8) angle = 8;
  if (angle > 84) angle = 84;
  let reach = Math.hypot(dx, dy) / m.rMax;
  if (reach < 0.22) reach = 0.22;
  if (reach > 0.96) reach = 0.96;
  return {
    angle: Math.round(angle),
    reach: Math.round(reach * 100) / 100,
  };
}

// 单一真源严格优先级诊断：一次只报最致命的一条主因，解释「人眼为什么这样看」
export function diagnoseHero(state) {
  const dynamicCount = state.tiles.filter(Boolean).length;
  const staticCount = 9 - dynamicCount;
  const staticPct = Math.round((staticCount / 9) * 100);
  const angleDeg = Math.round(state.angle);
  const reachPct = Math.round(state.reach * 100);

  const okRatio = dynamicCount >= EMPIRICAL.minDynamic && dynamicCount <= EMPIRICAL.maxDynamic;
  const okAngle = dynamicCount > 0 && angleDeg >= EMPIRICAL.angleMin && angleDeg <= EMPIRICAL.angleMax;
  const okReach = dynamicCount > 0 && state.reach >= EMPIRICAL.reachMin && state.reach <= EMPIRICAL.reachMax;
  const passCount = (okRatio ? 1 : 0) + (okAngle ? 1 : 0) + (okReach ? 1 : 0);

  let code = "balanced";
  let level = "good"; // "bad" | "warn" | "good"
  let badge = "动静成立 · 3/3";
  let headline = `静区 ${staticPct}% 稳住底盘，${angleDeg}° 单向破格锁定焦点`;
  let reason = `九宫格保留 ${staticCount}/9 块正交静格做稳定参照，极少数破格沿着 ${angleDeg}° 斜角冲出 ${reachPct}% 距离，在深蓝暗场里拉开明显空隙——眼睛先被稳格托住，再顺着斜向光束直钉右上圆球。`;

  if (dynamicCount === 0) {
    code = "all-static";
    level = "bad";
    badge = "全静无波 · 0/3";
    headline = "9/9 方格全锁在正交里，张力归零";
    reason = "秩序满分，却没有任何打破平衡的动作——画面像一张平整瓷砖墙，视线进来后找不到第一落点。点击任意 1–2 块方格让它破格而出。";
  } else if (dynamicCount >= 4) {
    code = "too-many";
    level = "bad";
    badge = `全动失锚 · ${passCount}/3`;
    headline = `${dynamicCount}/9 块同时乱飞，静格底盘已散架`;
    reason = `静态锚基只剩 ${staticPct}%（经验稳态线为 70%–90%）。当大部分元素都在斜飞，大脑失去了横竖参照，动块互相抢戏，反而谁都不显快。先把多余的动块点回方格，只留 1–2 块破格。`;
  } else if (dynamicCount === 3) {
    code = "split-focus";
    level = "warn";
    badge = `焦点分叉 · ${passCount}/3`;
    headline = "3 块同时破格，视线在多条路径间分散";
    reason = `静区退到 ${staticPct}%，三个破格点各自带出速度线，视觉能量被摊薄了。再点回 1–2 块静格，把冲势收束到少数主角身上。`;
  } else if (angleDeg < EMPIRICAL.angleMin) {
    code = "shallow";
    level = "warn";
    badge = `角度暧昧 · ${passCount}/3`;
    headline = `仰角只有 ${angleDeg}°，太近水平像没对齐`;
    reason = `静格比例已经很稳（${staticPct}%），但 ${angleDeg}° 太贴近水平网格边线。按阿恩海姆斜度知觉规律，微斜常被误读为失手排歪，而不是有意冲出。把圆球往斜上方拖入 ${EMPIRICAL.angleMin}°–${EMPIRICAL.angleMax}° 经验斜区。`;
  } else if (angleDeg > EMPIRICAL.angleMax) {
    code = "steep";
    level = "warn";
    badge = `过陡偏竖 · ${passCount}/3`;
    headline = `仰角陡到 ${angleDeg}°，冲势被竖线吸回`;
    reason = `静态比例已就位（${staticPct}%），可 ${angleDeg}° 过于逼近竖直边线，横冲破格的能量被竖向秩序中和了。往右下方把圆球拉回 ${EMPIRICAL.angleMin}°–${EMPIRICAL.angleMax}° 经验斜区。`;
  } else if (state.reach < EMPIRICAL.reachMin) {
    code = "trapped";
    level = "warn";
    badge = `未脱静格 · ${passCount}/3`;
    headline = `冲距只有 ${reachPct}%，圆球还粘在方格边上`;
    reason = `比例与 ${angleDeg}° 角度都对了，但圆球还没真正甩开 3×3 静格，中间拉不开暗场空隙，空间张力憋在格里放不出来。继续往右上方拉出方格边界（经验冲距 48%–86%）。`;
  } else if (state.reach > EMPIRICAL.reachMax) {
    code = "edge-crash";
    level = "warn";
    badge = `冲撞画框 · ${passCount}/3`;
    headline = `冲距达到 ${reachPct}%，圆球顶死画框边缘`;
    reason = "动体贴死边线后前路被截断，也和左下静格断了空间呼应，看着发紧发闷。往回微收到 48%–86% 区间，给动势留出画框呼吸边。";
  }

  return {
    code,
    level,
    badge,
    headline,
    reason,
    staticCount,
    dynamicCount,
    staticPct,
    angleDeg,
    reachPct,
    okRatio,
    okAngle,
    okReach,
    passCount,
    callouts: {
      structure: staticCount >= 6,
      breakout: okRatio && dynamicCount > 0,
      velocity: okAngle,
      tension: okRatio && okAngle && okReach,
    },
  };
}

// ---------- 02 节：四层解剖台判定 ----------
export function diagnoseAnatomy(layers) {
  const { grid, orb, streaks, space } = layers;
  const count = [grid, orb, streaks, space].filter(Boolean).length;
  if (count === 4) {
    return {
      status: "完整协同 · 4/4",
      kind: "good",
      text: "四层全部在位：3×3 方格托住秩序，破格圆球给出焦点，斜向速度线标明方向，暗场留白拉开动静之间的空间张力。",
    };
  }
  if (!grid && !orb) {
    return {
      status: "主体空缺",
      kind: "bad",
      text: "静格与破格主体同时拿掉了——只剩线条与底色，既没有参照基准，也没有停留落点。",
    };
  }
  if (!grid) {
    return {
      status: "失去静态参照",
      kind: "bad",
      text: "抽掉「稳定的结构」后，斜向圆球孤零零悬在空蓝里。没有正交方格作衬托，它不再像「冲破秩序」，只像一块随便斜放的几何图形。",
    };
  }
  if (!orb) {
    return {
      status: "失去破格焦点",
      kind: "bad",
      text: "拿掉「打破平衡」的圆球后，画面只剩方格和几道空划过夜空的线条——视线顺着线往右上飞，结果终点空无一物。",
    };
  }
  if (!streaks) {
    return {
      status: "失去方向与速度",
      kind: "warn",
      text: "关掉「方向与速度」光束与速度线后，圆球和方格之间断了因果关系——它看起来只是静止停在右上角的另一个圆，而不是从方格里冲出来的。",
    };
  }
  return {
    status: "空间张力憋闷",
    kind: "warn",
    text: "缩紧「空间张力」的暗场留白后，静格和动球贴得太死、无处呼吸，动静相斥相生的反差强度明显掉了一截。",
  };
}

// ---------- 03 节：八拍节奏谱与线束密率 ----------
export function diagnoseRhythm(beats, density) {
  const dyn = beats.filter(Boolean).length;
  const stat = beats.length - dyn;
  const statPct = Math.round((stat / beats.length) * 100);
  // 最长连续静拍
  let maxRun = 0, run = 0;
  for (const b of beats) {
    if (!b) { run++; if (run > maxRun) maxRun = run; }
    else run = 0;
  }
  const speedTier = density < 34 ? "舒缓慢拍" : density <= 72 ? "中速推进" : "高速急促";

  if (dyn === 0) {
    return {
      tier: "单调均速",
      kind: "warn",
      statPct, maxRun, speedTier,
      text: "八拍全是等宽静块，像节拍器敲在同一音量上——稳，但缺少重音起伏，眼睛一路平扫过去不会停顿。",
    };
  }
  if (dyn >= 6) {
    return {
      tier: "满拍失律",
      kind: "bad",
      statPct, maxRun, speedTier,
      text: `8 拍里塞了 ${dyn} 拍斜向急冲，静区只剩 ${statPct}%。每一拍都在喊重音，结果整条节奏扁成一片噪音。`,
    };
  }
  if (dyn <= 2 && maxRun >= 3) {
    return {
      tier: "蓄势爆发",
      kind: "good",
      statPct, maxRun, speedTier,
      text: `先用连续 ${maxRun} 拍静块铺出稳定韵律（静拍占 ${statPct}%），再由 ${dyn} 拍斜冲打断——配合${speedTier}线束，形成清晰的节奏高潮与视觉落点。`,
    };
  }
  return {
    tier: "交替律动",
    kind: "good",
    statPct, maxRun, speedTier,
    text: `${stat} 拍静块与 ${dyn} 拍动斜交替出现（静拍 ${statPct}%），配合${speedTier}线条密率，适合需要持续推进感的专题导视，而非单一重音焦点。`,
  };
}

// ---------- 05 节：网页动效预算与 WCAG 2.2.2 ----------
export function diagnoseUiBudget(flags) {
  const continuous = (flags.carousel ? 1 : 0) + (flags.badge ? 1 : 0) + (flags.ticker ? 1 : 0);
  const hoverOnly = flags.ctaHover ? 1 : 0;
  const calmPct = Math.max(18, 100 - continuous * 26 - (hoverOnly ? 6 : 0));

  if (continuous === 0 && hoverOnly) {
    return {
      wcag: "符合 WCAG 2.2.2 · 单一有主次",
      kind: "good",
      calmPct,
      text: "正文、卡片与导航全部保持静止，只在读者悬停主操作按钮时触发一次轻快反馈：既守住阅读专注，又让关键入口有明快动势。",
    };
  }
  if (continuous === 0 && !hoverOnly) {
    return {
      wcag: "全静稳定 · 零干扰",
      kind: "good",
      calmPct: 100,
      text: "页面 100% 保持静态，阅读合同、数据报告或长文时这是最省心的方案；若需要强化某一个按钮，可以单独开启「仅主按钮微动」。",
    };
  }
  if (continuous === 1) {
    return {
      wcag: "需配暂停键（WCAG 2.2.2）",
      kind: "warn",
      calmPct,
      text: `当前有 1 处持续自动动画与正文并排呈现。按 W3C WCAG 2.2 成功标准 2.2.2，自动运动超过 ${EMPIRICAL.wcagSeconds} 秒必须提供暂停、停止或隐藏控制，否则会持续分走阅读注意力。`,
    };
  }
  return {
    wcag: `动效过载 · ${continuous} 处同时抢戏`,
    kind: "bad",
    calmPct,
    text: `页面上 ${continuous} 个区域在同时移动、闪烁或滚动，安静可读区被压到约 ${calmPct}%（示意）。按 Franconeri & Simons（2003）的注意捕获规律，多个持续动体轮番劫持视线，读者根本读不进中间正文。`,
  };
}

// ---------- 06 节：小练习（单一变量：动静关系） ----------
export const QUIZ_ITEMS = {
  A: {
    correct: false,
    title: "A：秩序极稳，但全静无动势",
    text: "信息格、跑道标线与奔跑箭头全都横平竖直锁死在正交格里。虽然整齐易读，但整张夜跑海报像物业公告，缺少冲刺方向与第一眼焦点。",
  },
  B: {
    correct: true,
    title: "B 选对了：静格托信息，单笔斜动锁焦点",
    text: "约七成半版面保持工整的正交方格，稳稳交代时间、里程与地点；唯一一条 45° 橘红冲刺光带携领跑圆点冲进右上暗场留白。稳与动各自各司其职，一眼看清主题与速度感。",
  },
  C: {
    correct: false,
    title: "C：全员斜飞，静态参照彻底消失",
    text: "把标题、日期网格和背景线条统统倾斜 35° 左右。满版都在动时，大脑找不到横竖基准，结果不仅文字歪斜难读，冲刺光带本身的冲击力也被淹没了。",
  },
  D: {
    correct: false,
    title: "D：微斜 9° 且缩在格内，像排歪又憋闷",
    text: "虽然保住了静格，但冲刺光带只斜了 9°（太贴近水平线，容易被看成没对齐），而且长度卡死在信息格里，没有在暗场拉开空间张力，动静糊成一团。",
  },
};
