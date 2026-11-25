// 330 主宾关系构图 · 单一真源几何与显著度模型
// 所有画面绘制、读数、知识点徽章、微缩示意图与白话研判均从此模块实时计算，不写死常量。

export const PALETTE = {
  paper: "#E7E3E0",
  paperLight: "#F3F0EC",
  paperWhite: "#F9F7F4",
  sand: "#E2D8CC",
  ink: "#12233D",
  inkSoft: "#3E4D63",
  crimson: "#B31518",
  crimsonDeep: "#9D1410",
  navy: "#18273D",
  ochre: "#B99D76",
  ochreDeep: "#6E5632",
  stone: "#8F8880",
  ok: "#1A6347",
  warn: "#B82112",
};

export const INKS = {
  crimson: {
    id: "crimson",
    label: "朱砂红",
    hex: PALETTE.crimson,
    textOn: "#FFF9F6",
    salience: 1.44,
    isHostColor: true,
  },
  navy: {
    id: "navy",
    label: "深黛青",
    hex: PALETTE.navy,
    textOn: "#F5F3EF",
    salience: 1.0,
    isHostColor: false,
  },
  ochre: {
    id: "ochre",
    label: "古铜赭",
    hex: PALETTE.ochre,
    textOn: "#12233D",
    salience: 0.72,
    isHostColor: false,
  },
};

export const MEDIUMS = {
  poster: {
    id: "poster",
    label: "原海报三圆",
    short: "原海报",
    primaryTitle: "主 体",
    primaryEn: "PRIMARY FOCUS",
    primarySub: "吸引注意力 · 传达核心信息",
    secondaryTitle: "次要元素",
    secondaryEn: "SECONDARY SUPPORT",
    secondarySub: "辅助说明 · 丰富内容",
    detailTitle: "细节点缀",
    detailEn: "DETAIL ACCENT",
    detailSub: "补充信息 · 平衡画面",
  },
  song: {
    id: "song",
    label: "宋画群峰",
    short: "宋画",
    primaryTitle: "主 峰",
    primaryEn: "MONUMENTAL PEAK",
    primarySub: "大山堂堂 · 统领全幅",
    secondaryTitle: "辅岭朝揖",
    secondaryEn: "FLANKING RIDGE",
    secondarySub: "顺势拱向 · 衬托山势",
    detailTitle: "孤舟岸亭",
    detailEn: "SKIFF & PAVILION",
    detailSub: "点景定尺 · 气脉收尾",
  },
  exhibit: {
    id: "exhibit",
    label: "展讯海报",
    short: "展讯",
    primaryTitle: "秋日器物",
    primaryEn: "AUTUMN CERAMICS",
    primarySub: "核心主题 · 第一视觉锚",
    secondaryTitle: "10.18–11.30",
    secondaryEn: "EAST HALL · 03",
    secondarySub: "展期地点 · 次级导览",
    detailTitle: "免费预约",
    detailEn: "NO.330",
    detailSub: "印章落款 · 平衡边角",
  },
};

export const TIER_KEYS = ["primary", "secondary", "detail"];

export const TIER_META = {
  primary: { label: "主体", badge: "主", minR: 0.08, maxR: 0.44 },
  secondary: { label: "次要元素", badge: "宾", minR: 0.032, maxR: 0.28 },
  detail: { label: "细节点缀", badge: "点", minR: 0.016, maxR: 0.16 },
};

// 预设均用归一化坐标 (u, v ∈ 0..1) 与归一化半径 (r 相对 min(W, H))
export const PRESETS = {
  // 开场刻意停在「喧宾夺主 + 双红争眼 + 点缀偏大」复合错态（绝非答案）
  broken: {
    label: "复原开场错态",
    primary: { u: 0.60, v: 0.44, r: 0.168, ink: "crimson" },
    secondary: { u: 0.30, v: 0.52, r: 0.154, ink: "crimson" },
    detail: { u: 0.68, v: 0.72, r: 0.092, ink: "navy" },
  },
  // 1:1 承袭 330 原海报经典解
  poster: {
    label: "原海报经典解",
    primary: { u: 0.60, v: 0.43, r: 0.315, ink: "crimson" },
    secondary: { u: 0.25, v: 0.61, r: 0.092, ink: "navy" },
    detail: { u: 0.75, v: 0.79, r: 0.028, ink: "navy" },
  },
  // 宋画正峰朝揖解
  song: {
    label: "宋画正峰解",
    primary: { u: 0.51, v: 0.41, r: 0.275, ink: "crimson" },
    secondary: { u: 0.23, v: 0.69, r: 0.104, ink: "navy" },
    detail: { u: 0.80, v: 0.76, r: 0.034, ink: "ochre" },
  },
  // 留白孤主解（小体量高留白同样合法）
  minimal: {
    label: "留白孤主解",
    primary: { u: 0.56, v: 0.42, r: 0.215, ink: "crimson" },
    secondary: { u: 0.28, v: 0.64, r: 0.084, ink: "navy" },
    detail: { u: 0.73, v: 0.76, r: 0.028, ink: "ochre" },
  },
  // 双向试错：过度悬殊（宾体湮没）
  fault_dwarf: {
    label: "试错：宾体湮没",
    primary: { u: 0.58, v: 0.44, r: 0.335, ink: "crimson" },
    secondary: { u: 0.23, v: 0.63, r: 0.044, ink: "ochre" },
    detail: { u: 0.75, v: 0.79, r: 0.022, ink: "ochre" },
  },
  // 双向试错：满幅窒息（缺留白）
  fault_choke: {
    label: "试错：满幅窒息",
    primary: { u: 0.54, v: 0.47, r: 0.435, ink: "crimson" },
    secondary: { u: 0.22, v: 0.62, r: 0.112, ink: "navy" },
    detail: { u: 0.76, v: 0.80, r: 0.042, ink: "navy" },
  },
  // 双向试错：气脉断离
  fault_drift: {
    label: "试错：气脉断离",
    primary: { u: 0.80, v: 0.24, r: 0.235, ink: "crimson" },
    secondary: { u: 0.12, v: 0.83, r: 0.086, ink: "navy" },
    detail: { u: 0.92, v: 0.90, r: 0.028, ink: "navy" },
  },
};

export function createInitialState() {
  return clonePreset("broken", {
    medium: "poster",
    activeTier: "primary",
    showOrbit: true,
    showMoat: true,
  });
}

export function clonePreset(name, extra = {}) {
  const p = PRESETS[name] || PRESETS.broken;
  return {
    medium: extra.medium ?? "poster",
    activeTier: extra.activeTier ?? "primary",
    showOrbit: extra.showOrbit ?? true,
    showMoat: extra.showMoat ?? true,
    primary: { ...p.primary },
    secondary: { ...p.secondary },
    detail: { ...p.detail },
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 水平拖动画布空白处时，连续调节主宾体量反差（保证拖动时画面、比例、弧线连续重绘）
export function applyContrastDrag(state, deltaNorm) {
  // deltaNorm > 0 拉大主宾差距；deltaNorm < 0 收窄甚至反客为主
  const p = state.primary;
  const s = state.secondary;
  const d = state.detail;
  p.r = clamp(p.r + deltaNorm * 0.26, TIER_META.primary.minR, TIER_META.primary.maxR);
  s.r = clamp(s.r - deltaNorm * 0.12, TIER_META.secondary.minR, TIER_META.secondary.maxR);
  d.r = clamp(d.r - deltaNorm * 0.08, TIER_META.detail.minR, TIER_META.detail.maxR);
}

// 一键主宾易位：交换主体与次要元素的体量、位置与色彩，让用户直观感受主权转移
export function swapHostGuest(state) {
  const p = { ...state.primary };
  const s = { ...state.secondary };
  state.primary = {
    u: s.u,
    v: s.v,
    r: clamp(s.r, TIER_META.primary.minR, TIER_META.primary.maxR),
    ink: s.ink,
  };
  state.secondary = {
    u: p.u,
    v: p.v,
    r: clamp(p.r, TIER_META.secondary.minR, TIER_META.secondary.maxR),
    ink: p.ink,
  };
}

// 一步纠偏：仅修复当前最首要的那一项错态（让用户逐步看懂因果）
export function fixTopIssue(state, report) {
  const top = report.issues[0];
  if (!top) return;
  switch (top.code) {
    case "color_clash":
      state.secondary.ink = "navy";
      if (state.detail.ink === "crimson") state.detail.ink = "navy";
      if (state.primary.ink !== "crimson") state.primary.ink = "crimson";
      break;
    case "guest_usurp":
    case "rival_size":
      state.primary.r = Math.max(state.primary.r, 0.295);
      state.secondary.r = Math.min(state.secondary.r, 0.095);
      break;
    case "tier_inverted":
    case "detail_bloat":
      state.detail.r = Math.min(state.detail.r, Math.max(0.026, state.secondary.r * 0.34));
      break;
    case "over_dwarf":
      state.secondary.r = Math.max(state.secondary.r, Math.min(0.11, state.primary.r * 0.32));
      if (state.secondary.ink === "ochre") state.secondary.ink = "navy";
      break;
    case "host_choked":
      state.primary.r = Math.min(state.primary.r, 0.31);
      state.primary.u = clamp(state.primary.u, 0.38, 0.65);
      state.primary.v = clamp(state.primary.v, 0.36, 0.50);
      break;
    case "crowded_collide":
      state.secondary.u = 0.25;
      state.secondary.v = 0.61;
      state.detail.u = 0.75;
      state.detail.v = 0.79;
      break;
    case "arc_broken":
      state.primary.u = clamp(state.primary.u, 0.44, 0.64);
      state.primary.v = clamp(state.primary.v, 0.36, 0.50);
      state.secondary.u = 0.25;
      state.secondary.v = 0.61;
      state.detail.u = 0.75;
      state.detail.v = 0.79;
      break;
    default:
      Object.assign(state, clonePreset("poster", {
        medium: state.medium,
        activeTier: state.activeTier,
        showOrbit: state.showOrbit,
        showMoat: state.showMoat,
      }));
  }
}

// 计算经过主侧翼 → 次要元素 → 主体下方 → 细节点缀的顺滑视线引导弧（贝塞尔控制点）
function buildOrbitPath(nodes, w, h, minDim) {
  const { primary: P, secondary: S, detail: D } = nodes;
  // 弧线从主体左上/左外缘起笔，穿过次要元素，沿主体下方扫向细节点缀并略作延展
  const vxPS = S.x - P.x;
  const vyPS = S.y - P.y;
  const distPS = Math.hypot(vxPS, vyPS) || 1;
  // 起笔点在次要元素往主体侧上方再顺时针偏转 ~42°
  const angS = Math.atan2(S.y - P.y, S.x - P.x);
  const startR = Math.max(distPS, P.R + S.R * 0.9 + minDim * 0.04);
  const angStart = angS + (S.x <= P.x ? 0.42 : -0.42);
  const start = {
    x: clamp(P.x + Math.cos(angStart) * startR * 0.94, w * 0.05, w * 0.95),
    y: clamp(P.y + Math.sin(angStart) * startR * 0.94, h * 0.08, h * 0.92),
  };

  // 中段弧底控制点：把二次曲线优雅托在 S 和 D 之间并微包主体下缘
  const midX = (S.x + D.x) * 0.5;
  const midY = (S.y + D.y) * 0.5;
  const pullY = Math.max(P.y + P.R + minDim * 0.11, midY + minDim * 0.14);
  const ctrl = {
    x: clamp(midX + (P.x - midX) * 0.12, w * 0.06, w * 0.94),
    y: clamp(pullY, h * 0.14, h * 0.94),
  };

  // 末梢顺切线轻轻延展一点
  const tx = D.x - ctrl.x;
  const ty = D.y - ctrl.y;
  const tLen = Math.hypot(tx, ty) || 1;
  const tail = {
    x: clamp(D.x + (tx / tLen) * minDim * 0.08, w * 0.04, w * 0.96),
    y: clamp(D.y + (ty / tLen) * minDim * 0.08, h * 0.06, h * 0.94),
  };

  return { start, ctrl, tail };
}

// 主核算入口：给定画布真实 CSS 尺寸 (w, h)，算出全部像素几何、显著度、错态与白话点评
export function evaluate(state, w = 780, h = 480) {
  const minDim = Math.min(w, h);
  const frameArea = Math.max(1, w * h);

  const nodes = {};
  for (const key of TIER_KEYS) {
    const src = state[key];
    const R = src.r * minDim;
    const x = src.u * w;
    const y = src.v * h;
    const area = Math.PI * R * R;
    const coverage = area / frameArea;
    const edgeMin = Math.min(x - R, w - (x + R), y - R, h - (y + R)) / minDim;
    const ink = INKS[src.ink] || INKS.navy;
    nodes[key] = { key, u: src.u, v: src.v, r: src.r, x, y, R, area, coverage, edgeMin, ink };
  }

  const P = nodes.primary;
  const S = nodes.secondary;
  const D = nodes.detail;

  // 真实面积比
  const ratioPS = P.area / Math.max(1, S.area);
  const ratioSD = S.area / Math.max(1, D.area);
  const ratioPD = P.area / Math.max(1, D.area);

  // 真实边界间距（负数代表重叠）
  const distPS = Math.hypot(P.x - S.x, P.y - S.y);
  const distPD = Math.hypot(P.x - D.x, P.y - D.y);
  const distSD = Math.hypot(S.x - D.x, S.y - D.y);

  const gapPS = (distPS - P.R - S.R) / minDim;
  const gapPD = (distPD - P.R - D.R) / minDim;
  const gapSD = (distSD - S.R - D.R) / minDim;
  const minGuestGap = Math.min(gapPS, gapPD);

  // 占据面积总和与留白估算（减去重叠近似）
  const rawTotalCov = P.coverage + S.coverage + D.coverage;
  const whitespaceRatio = clamp(1 - rawTotalCov, 0, 1);

  // 位置与留白对显著度的影响（示意算法，基于同一实绘几何）
  for (const key of TIER_KEYS) {
    const n = nodes[key];
    // 贴边切角会削弱视觉稳定性
    const edgeFactor = n.edgeMin < 0 ? clamp(1 + n.edgeMin * 2.2, 0.55, 1) : 1;
    // 靠近黄金居中带的主体更易聚眼
    const dc = Math.hypot((n.u - 0.54) * 1.1, n.v - 0.45);
    const posFactor = clamp(1.06 - dc * 0.28, 0.78, 1.06);
    // 综合视觉权重（示意）：面积的 0.56 次幂 × 色彩显著系数 × 位置系数 × 边界系数
    n.salience = Math.pow(n.coverage * 100, 0.56) * n.ink.salience * posFactor * edgeFactor;
  }

  const ranked = [P, S, D].slice().sort((a, b) => b.salience - a.salience);
  const salRatio12 = ranked[0].salience / Math.max(0.001, ranked[1].salience);
  const salRatioPS = P.salience / Math.max(0.001, S.salience);
  const salRatioSD = S.salience / Math.max(0.001, D.salience);

  // 视线落点顺位字符串
  const tiedTop = salRatio12 < 1.28;
  let gazeOrder = "主 → 宾 → 点";
  if (tiedTop) {
    const a = TIER_META[ranked[0].key].badge;
    const b = TIER_META[ranked[1].key].badge;
    gazeOrder = `${a}? ⇄ ${b}? 争焦`;
  } else {
    gazeOrder = ranked.map((n) => TIER_META[n.key].badge).join(" → ");
  }

  // 检查 8 类双向错态
  const issues = [];

  // 1. 色彩争主（次要或点缀同用朱砂红）
  const colorClash =
    (P.ink.id === "crimson" && (S.ink.id === "crimson" || D.ink.id === "crimson")) ||
    (P.ink.id !== "crimson" && (S.ink.id === "crimson" || D.ink.id === "crimson"));
  if (colorClash) {
    const culprit = S.ink.id === "crimson" ? "次要元素" : "细节点缀";
    issues.push({
      code: "color_clash",
      badge: "双红争主",
      severity: 100,
      target: S.ink.id === "crimson" ? "secondary" : "detail",
      tag: "× 抢色争主 · 点此褪红",
      headline: `${culprit}也披上朱砂红，和主体在色彩频道抢第一眼`,
      body: `原海报把高饱和朱砂红专留给「主体」，次要与点缀全部退回深黛青。现在${culprit}与主体同色，即使缩小体量，眼睛仍会在两块红色之间来回跳动。`,
      action: `把${culprit}改回「深黛青」或「古铜赭」（也可直接点画布上的红标褪色）。`,
      cta: `褪去${culprit}朱砂色`,
    });
  }

  // 2. 宾大于主（倒置）或平分秋色（差异不足）
  if (ratioPS < 1.0) {
    issues.push({
      code: "guest_usurp",
      badge: "喧宾夺主",
      severity: 95,
      target: "secondary",
      tag: `× 宾大于主 (${ratioPS.toFixed(1)}×)`,
      headline: `次要元素面积反超主体（主/次仅 ${ratioPS.toFixed(1)}×），彻底喧宾夺主`,
      body: `读者进画面第一眼先被次要元素吸走，本该传达核心信息的主体沦为配角。主宾关系首要铁律是让主体拥有不可动摇的第一视觉重量。`,
      action: `向右横拖画布空白处拉大主宾体量反差，把主/次面积比推到 3× 以上。`,
      cta: "拉大主宾体量反差",
    });
  } else if (ratioPS < 2.6 || salRatioPS < 1.62) {
    issues.push({
      code: "rival_size",
      badge: "平分秋色",
      severity: 88,
      target: "secondary",
      tag: `× 主/次仅 ${ratioPS.toFixed(1)}× · 拉开差距`,
      headline: `主次面积比只有 ${ratioPS.toFixed(1)}×，两团重量接近，眼睛在犹豫`,
      body: `原海报提醒「保持足够的视觉差异」。当主体和次要元素只差一两成，读者得花额外时间判断先看谁，视觉引导在起点就卡住了。`,
      action: `向右横拖画布（或把主体拉大、次要收小），让主/次面积比跨过 3× 门槛。`,
      cta: "拉开主次面积差距",
    });
  }

  // 3. 满幅窒息（主体直径逼近画高、占幅过大或留白不足）
  if (P.r > 0.39 || P.coverage > 0.42 || whitespaceRatio < 0.36 || P.edgeMin < 0.015) {
    issues.push({
      code: "host_choked",
      badge: "满幅窒息",
      severity: 84,
      target: "primary",
      tag: `× 主径 ${Math.round(P.r * 200)}% 画高 · 留白不足`,
      headline: `主体膨胀到画高的 ${Math.round(P.r * 200)}%（占幅 ${Math.round(P.coverage * 100)}%），把画面撑闷了`,
      body: `原海报第三条注意事项强调「留白有助于突出主体」。主体不是越大越好——一旦上下逼近画框、压碎四周暖麻底纸，对比参照物消失，大圆反而显得局促沉重。`,
      action: `向左微收主体半径，并把主体往画内挪稳，让主体外缘与画框留出呼吸空间。`,
      cta: "收束主体并腾出留白",
    });
  }

  // 4. 过度悬殊（宾体湮没）
  if (ratioPS > 32 || S.coverage < 0.0065) {
    issues.push({
      code: "over_dwarf",
      badge: "宾体湮没",
      severity: 78,
      target: "secondary",
      tag: `× 悬殊 ${Math.round(ratioPS)}× · 宾体过微`,
      headline: `主/次悬殊达 ${Math.round(ratioPS)}×，次要元素小到几乎消失`,
      body: `主宾关系是「主宾相从」，不是「唯主独存」。次要元素缩成针尖后，读者看完主体没有可承接的第二落点，辅助说明失去存在感。`,
      action: `选中「次要元素」适度放大半径，把主/次面积比收回 3×–24× 的健康区间。`,
      cta: "扶起次要元素体量",
    });
  }

  // 5. 层级倒挂或点缀膨胀
  if (ratioSD < 1.1 || D.salience > S.salience * 0.96) {
    issues.push({
      code: "tier_inverted",
      badge: "层级倒挂",
      severity: 80,
      target: "detail",
      tag: "× 点缀反超次要元素",
      headline: `细节点缀反超次要元素，阅读顺位倒挂成「${gazeOrder}」`,
      body: `第三阶的点缀本该在最后轻声收尾、平衡画面。现在它比第二阶还抢眼，原本顺畅的三步阶梯被拧乱了。`,
      action: `选中「细节点缀」把直径压小到次要元素的四成以下。`,
      cta: "压低细节点缀体量",
    });
  } else if (ratioSD < 2.2 || D.coverage > 0.042) {
    issues.push({
      code: "detail_bloat",
      badge: "点缀偏重",
      severity: 70,
      target: "detail",
      tag: `× 次/点仅 ${ratioSD.toFixed(1)}×`,
      headline: `细节点缀偏大（次/点仅 ${ratioSD.toFixed(1)}×），三阶梯队塌成两阶`,
      body: `点缀元素和次要元素拉开得不够明显，读者在第二、第三层级之间分不清轻重。把点缀收小成精致句号，全幅才会轻灵利落。`,
      action: `把细节点缀半径再收轻一些，让次/点面积比达到 2.5× 以上。`,
      cta: "收轻细节点缀",
    });
  }

  // 6. 贴身互挤（核心区重叠）
  const tooCrowded = gapPS < -0.055 || gapPD < -0.035 || gapSD < -0.015;
  if (tooCrowded) {
    issues.push({
      code: "crowded_collide",
      badge: "贴身互挤",
      severity: 76,
      target: gapPS < gapPD ? "secondary" : "detail",
      tag: "× 侵入主体边界",
      headline: "次要或点缀深陷主体内部，边界糊成一团",
      body: `原海报里次要圆与主体只隔着一道极克制的浅缝呼吸。元素叠压太深会破坏轮廓识别，让主次边界变得含混。`,
      action: "直接拖动次要元素或点缀往外缘挪开一点，给主体留出清晰轮廓缝。",
      cta: "拉开边界呼吸缝",
    });
  }

  // 7. 气脉断离 / 贴角切边
  const normSpanPS = distPS / minDim;
  const normSpanPD = distPD / minDim;
  const edgeCrushed = P.edgeMin < 0.01 || S.edgeMin < 0.005 || D.edgeMin < 0.005;
  const tooFar = normSpanPS > 0.92 || normSpanPD > 0.95;
  if (edgeCrushed || tooFar) {
    issues.push({
      code: "arc_broken",
      badge: edgeCrushed ? "切边失势" : "气脉断离",
      severity: 72,
      target: P.edgeMin < 0.01 ? "primary" : S.edgeMin < 0.005 || normSpanPS > 0.92 ? "secondary" : "detail",
      tag: edgeCrushed ? "× 紧贴画框边缘" : "× 主宾过远失联",
      headline: edgeCrushed ? "元素贴死画框边缘，呼吸空间被切破" : "主宾拉得过远，视线引导弧失去呼应",
      body: edgeCrushed
        ? "主体或陪体紧顶边缘会显得局促，视线刚落上去就滑出画框之外。"
        : "陪体逃到遥远对角后，眼睛看完主体接不住下一拍，画面断成互不相干的孤岛。",
      action: "拖动边缘或孤立的圆往中段回拢，让虚线引导弧自然托住三者。",
      cta: "归拢主宾气脉",
    });
  }

  issues.sort((a, b) => b.severity - a.severity);
  const ok = issues.length === 0;

  // 判断成立时的风格流派（按不随宽高比畸变的相对半径 P.r 与位置判断，接受多组合法解）
  let regime = "待校准";
  if (ok) {
    if (P.u > 0.54 && S.u < 0.36 && D.u > 0.64 && P.r >= 0.27) {
      regime = "原海报经典势";
    } else if (Math.abs(P.u - 0.5) < 0.09 && S.v > P.v + 0.14 && D.v > P.v + 0.14) {
      regime = "宋画正峰势";
    } else if (P.r < 0.24) {
      regime = "留白孤主势";
    } else {
      regime = "三阶平衡势";
    }
  } else {
    regime = issues[0].badge;
  }

  // 三大核心知识点实时状态（直接映射原海报三枚圆徽）
  const contrastOk = !issues.some((i) => ["color_clash", "guest_usurp", "rival_size", "over_dwarf"].includes(i.code));
  const guidanceOk = !tiedTop && !colorClash && !issues.some((i) => ["crowded_collide", "arc_broken"].includes(i.code));
  const hierarchyOk = !issues.some((i) => ["tier_inverted", "detail_bloat", "host_choked", "guest_usurp", "rival_size"].includes(i.code));

  // 原海报底部三条「注意事项」实时验真
  const notices = [
    {
      text: "避免主次元素竞争焦点",
      ok: !issues.some((i) => ["color_clash", "guest_usurp", "rival_size"].includes(i.code)),
    },
    {
      text: "保持足够的视觉差异",
      ok: !issues.some((i) => ["rival_size", "detail_bloat", "tier_inverted", "over_dwarf"].includes(i.code)),
    },
    {
      text: "留白有助于突出主体",
      ok: !issues.some((i) => ["host_choked", "crowded_collide", "arc_broken"].includes(i.code)),
    },
  ];

  // 白话总诊断文案
  let diagnosis;
  if (ok) {
    diagnosis = {
      status: "pass",
      badge: `秩序成立 · ${regime}`,
      headline: `第一眼稳稳落向「主体」，再顺势滑过「次要元素」收束于「细节点缀」`,
      body: `此刻主/次面积比 ${ratioPS.toFixed(1)}×、次/点面积比 ${ratioSD.toFixed(1)}×，四周保留 ${Math.round(whitespaceRatio * 100)}% 暖麻留白。朱砂红只归主体独享，虚线引导弧把三阶串成一条毫不犹豫的阅读路径。`,
      action: `可继续换题材看这套权重在「宋画群峰」与「展讯海报」里如何生效，或点「试错」亲手检验反向失衡。`,
      cta: null,
    };
  } else {
    const top = issues[0];
    diagnosis = {
      status: "fail",
      badge: `${issues.length} 处失衡 · ${top.badge}`,
      headline: top.headline,
      body: top.body,
      action: top.action,
      cta: top.cta,
    };
  }

  return {
    w,
    h,
    minDim,
    nodes,
    orbit: buildOrbitPath(nodes, w, h, minDim),
    ratioPS,
    ratioSD,
    ratioPD,
    salRatioPS,
    salRatioSD,
    whitespaceRatio,
    gazeOrder,
    tiedTop,
    ok,
    regime,
    issues,
    pillars: {
      contrast: {
        ok: contrastOk,
        metric: `${ratioPS.toFixed(1)}×`,
        note: colorClash ? "双红撞色" : ratioPS < 2.6 ? "主次过近" : ratioPS > 32 ? "宾体湮没" : "主强宾弱",
      },
      guidance: {
        ok: guidanceOk,
        metric: gazeOrder,
        note: guidanceOk
          ? "弧线贯通"
          : tiedTop || colorClash
          ? "视线拉锯"
          : issues.some((i) => i.code === "crowded_collide")
          ? "边界粘连"
          : "气脉受阻",
      },
      hierarchy: {
        ok: hierarchyOk,
        metric: `白 ${Math.round(whitespaceRatio * 100)}%`,
        note: hierarchyOk ? `${regime}（示意）` : P.coverage > 0.46 ? "满幅闷塞" : "阶梯未分",
      },
    },
    notices,
    diagnosis,
  };
}
