// 149 字母造型版式 · 单一几何真源模型
// 画布上的字母轮廓、字怀、横梁、底足、信息槽位与所有读数/诊断全部由此模块同源计算。

export const LETTERS = {
  A: {
    id: "A",
    char: "A",
    tab: "A · 建筑年展",
    posterTitle: "ARCH 26",
    posterSub: "城市空间双年展",
    posterDate: "OCT 18 — NOV 24",
    posterVenue: "美术馆东翼 · 免费预约",
    barBand: [0.54, 0.70],
    barIdeal: 0.63,
    spreadBand: [0.26, 0.39],
    spreadIdeal: 0.33,
    strokeBand: [0.15, 0.29],
    strokeIdeal: 0.22,
    counterBand: [11, 29],
    slopeBand: [17, 30],
    initial: { stroke: 0.42, spread: 0.205, barY: 0.34, infoMode: "flat" },
    flowLabel: "斜边引导",
    baseLabel: "三角底座",
  },
  H: {
    id: "H",
    char: "H",
    tab: "H · 都市爵士",
    posterTitle: "HARBOR",
    posterSub: "滨海夜间爵士季",
    posterDate: "JUL 04 — JUL 19",
    posterVenue: "旧港仓库 3 号厅",
    barBand: [0.42, 0.58],
    barIdeal: 0.50,
    spreadBand: [0.25, 0.38],
    spreadIdeal: 0.31,
    strokeBand: [0.15, 0.28],
    strokeIdeal: 0.21,
    counterBand: [24, 52],
    slopeBand: [68, 108], // 对 H 用展宽/字高比 (%) 衡量柱距
    initial: { stroke: 0.41, spread: 0.195, barY: 0.26, infoMode: "flat" },
    flowLabel: "双柱竖轴",
    baseLabel: "双足承柱",
  },
  S: {
    id: "S",
    char: "S",
    tab: "S · 海洋流体",
    posterTitle: "SURGE",
    posterSub: "潮汐与流体声音展",
    posterDate: "MAY 10 — JUN 08",
    posterVenue: "南岸当代艺术仓",
    barBand: [0.44, 0.58],
    barIdeal: 0.51,
    spreadBand: [0.24, 0.36],
    spreadIdeal: 0.30,
    strokeBand: [0.14, 0.27],
    strokeIdeal: 0.20,
    counterBand: [16, 40],
    slopeBand: [16, 36], // 中腰斜脊倾角
    initial: { stroke: 0.40, spread: 0.19, barY: 0.28, infoMode: "flat" },
    flowLabel: "回旋脊流",
    baseLabel: "底弧托稳",
  },
};

export const INFO_MODES = {
  flat: { id: "flat", label: "横排硬压" },
  skeleton: { id: "skeleton", label: "依骨架落位" },
  ornate: { id: "ornate", label: "花哨失认" },
};

export const STAGE_ASPECT = 16 / 11;

export function createInitialState(letter = "A") {
  const cfg = LETTERS[letter] || LETTERS.A;
  return {
    letter: cfg.id,
    stroke: cfg.initial.stroke,
    spread: cfg.initial.spread,
    barY: cfg.initial.barY,
    infoMode: cfg.initial.infoMode,
    showGuides: true,
    focusStep: 0, // 0=无特定高光, 1..4=四步思维流程高光
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 靠近参考解中段时给轻柔磁吸（但仍可轻松拖离到错区）
export function softSnap(val, target, radius = 0.012) {
  return Math.abs(val - target) <= radius ? target : val;
}

// 从 state 算出归一化画布坐标 (u: 0..1, v: 0..1) 下的全部真实几何结构与指标
export function computeGeometry(state, aspect = STAGE_ASPECT) {
  const cfg = LETTERS[state.letter] || LETTERS.A;
  const cx = 0.515;
  const topY = 0.115;
  const botY = 0.865;
  const H = botY - topY; // 0.75
  const stroke = clamp(state.stroke, 0.07, 0.45);
  const spread = clamp(state.spread, 0.17, 0.46);
  const barY = clamp(state.barY, 0.22, 0.82);

  const barYNorm = topY + barY * H;
  const legW = stroke * 0.43; // u 坐标系下的水平笔画宽
  const barH = clamp(legW * aspect * 0.78, 0.032, 0.19); // v 坐标系下横梁厚度，保证横竖视觉接近等粗

  let geom = null;
  let counterPct = 0;
  let slopeDeg = 0;
  let baseWidthRatioPct = 0;
  let strokePct = Math.round(stroke * 100);

  if (cfg.id === "A") {
    const baseHalf = spread;
    const topHalf = clamp(stroke * 0.42, 0.042, Math.min(0.135, baseHalf - 0.032));
    const outerL = (y) => cx - (topHalf + ((y - topY) / H) * (baseHalf - topHalf));
    const outerR = (y) => cx + (topHalf + ((y - topY) / H) * (baseHalf - topHalf));
    const innerL = (y) => outerL(y) + legW;
    const innerR = (y) => outerR(y) - legW;

    // 真实视觉斜边倾角（考虑画布宽高比）
    slopeDeg = (Math.atan2((baseHalf - topHalf) * aspect, H) * 180) / Math.PI;
    baseWidthRatioPct = Math.round(((baseHalf * 2 * aspect) / H) * 100);

    // 封闭三角字怀精确顶点（innerL(y) = innerR(y)）
    const denom = Math.max(0.001, baseHalf - topHalf);
    const tApex = (legW - topHalf) / denom;
    const counterTopY = topY + Math.max(0.04, tApex) * H;
    const counterBotY = barYNorm - barH * 0.5;
    const cLeft = innerL(counterBotY);
    const cRight = innerR(counterBotY);

    let counterArea = 0;
    let counterTri = null;
    if (counterBotY > counterTopY + 0.005 && cRight > cLeft + 0.005) {
      counterArea = 0.5 * (cRight - cLeft) * (counterBotY - counterTopY);
      counterTri = [
        [cx, counterTopY],
        [cLeft, counterBotY],
        [cRight, counterBotY],
      ];
    }
    const outerArea = (topHalf + baseHalf) * H;
    counterPct = Math.max(0, (counterArea / outerArea) * 100);

    // 下拱（横梁以下两腿之间的开放负形）
    const lowerTopY = barYNorm + barH * 0.5;
    const lTopL = innerL(lowerTopY);
    const lTopR = innerR(lowerTopY);
    const lBotL = innerL(botY);
    const lBotR = innerR(botY);

    geom = {
      type: "A",
      cx, topY, botY, H, baseHalf, topHalf, legW, barH, barYNorm,
      outerPoly: [
        [cx - topHalf, topY],
        [cx + topHalf, topY],
        [cx + baseHalf, botY],
        [cx - baseHalf, botY],
      ],
      leftLeg: [
        [cx - topHalf, topY],
        [cx - topHalf + legW, topY],
        [cx - baseHalf + legW, botY],
        [cx - baseHalf, botY],
      ],
      rightLeg: [
        [cx + topHalf - legW, topY],
        [cx + topHalf, topY],
        [cx + baseHalf, botY],
        [cx + baseHalf - legW, botY],
      ],
      barPoly: [
        [outerL(barYNorm - barH * 0.5), barYNorm - barH * 0.5],
        [outerR(barYNorm - barH * 0.5), barYNorm - barH * 0.5],
        [outerR(barYNorm + barH * 0.5), barYNorm + barH * 0.5],
        [outerL(barYNorm + barH * 0.5), barYNorm + barH * 0.5],
      ],
      counterTri,
      lowerArch: lBotR > lBotL ? [
        [Math.min(lTopL, cx), lowerTopY],
        [Math.max(lTopR, cx), lowerTopY],
        [lBotR, botY],
        [lBotL, botY],
      ] : null,
      leftFootX0: cx - baseHalf,
      leftFootX1: Math.min(cx - 0.005, cx - baseHalf + legW),
      rightFootX0: Math.max(cx + 0.005, cx + baseHalf - legW),
      rightFootX1: cx + baseHalf,
      barLeftX: outerL(barYNorm),
      barRightX: outerR(barYNorm),
      limeCircle: {
        x: cx + topHalf + 0.045,
        y: topY - 0.012,
        r: 0.088,
      },
      handleBar: { x: Math.max(0.08, outerL(barYNorm) - 0.03), y: barYNorm },
      handleFoot: { x: cx + baseHalf, y: botY - 0.04 },
    };
  } else if (cfg.id === "H") {
    const baseHalf = spread;
    const innerW = Math.max(0, baseHalf * 2 - legW * 2);
    const upperH = Math.max(0, barYNorm - barH * 0.5 - topY);
    const lowerH = Math.max(0, botY - (barYNorm + barH * 0.5));
    const outerArea = baseHalf * 2 * H;
    const counterArea = innerW * (upperH + lowerH);
    counterPct = Math.max(0, (counterArea / outerArea) * 100);
    baseWidthRatioPct = Math.round(((baseHalf * 2 * aspect) / H) * 100);
    slopeDeg = baseWidthRatioPct; // H 使用展幅比衡量双柱间距

    geom = {
      type: "H",
      cx, topY, botY, H, baseHalf, legW, barH, barYNorm,
      leftPillar: { x: cx - baseHalf, y: topY, w: Math.min(legW, baseHalf), h: H },
      rightPillar: { x: cx + baseHalf - Math.min(legW, baseHalf), y: topY, w: Math.min(legW, baseHalf), h: H },
      barRect: { x: cx - baseHalf, y: barYNorm - barH * 0.5, w: baseHalf * 2, h: barH },
      upperCounter: innerW > 0.01 && upperH > 0.01 ? { x: cx - baseHalf + legW, y: topY, w: innerW, h: upperH } : null,
      lowerCounter: innerW > 0.01 && lowerH > 0.01 ? { x: cx - baseHalf + legW, y: barYNorm + barH * 0.5, w: innerW, h: lowerH } : null,
      leftFootX0: cx - baseHalf,
      leftFootX1: cx - baseHalf + Math.min(legW, baseHalf),
      rightFootX0: cx + baseHalf - Math.min(legW, baseHalf),
      rightFootX1: cx + baseHalf,
      barLeftX: cx - baseHalf,
      barRightX: cx + baseHalf,
      limeCircle: { x: cx + baseHalf - 0.01, y: topY + 0.015, r: 0.082 },
      handleBar: { x: Math.max(0.08, cx - baseHalf - 0.03), y: barYNorm },
      handleFoot: { x: cx + baseHalf, y: botY - 0.04 },
    };
  } else {
    // S 字母：上下双建筑箱弧 + 斜向中脊
    const baseHalf = spread;
    const innerW = Math.max(0, baseHalf * 2 - legW * 1.9);
    const upperBayH = Math.max(0, barYNorm - barH * 0.5 - (topY + barH));
    const lowerBayH = Math.max(0, (botY - barH) - (barYNorm + barH * 0.5));
    const outerArea = baseHalf * 2 * H;
    const counterArea = innerW * (upperBayH + lowerBayH);
    counterPct = Math.max(0, (counterArea / outerArea) * 100);
    baseWidthRatioPct = Math.round(((baseHalf * 2 * aspect) / H) * 100);
    // 中腰斜脊相对水平的倾斜张角
    slopeDeg = (Math.atan2(baseHalf * aspect * 0.72, H * 0.7) * 180) / Math.PI;

    geom = {
      type: "S",
      cx, topY, botY, H, baseHalf, legW, barH, barYNorm,
      upperBay: innerW > 0.01 && upperBayH > 0.01 ? { x: cx - baseHalf + legW, y: topY + barH, w: innerW, h: upperBayH } : null,
      lowerBay: innerW > 0.01 && lowerBayH > 0.01 ? { x: cx - baseHalf + legW * 0.9, y: barYNorm + barH * 0.5, w: innerW, h: lowerBayH } : null,
      leftFootX0: cx - baseHalf,
      leftFootX1: cx - baseHalf + legW * 1.25,
      rightFootX0: cx + baseHalf - legW * 1.25,
      rightFootX1: cx + baseHalf,
      barLeftX: cx - baseHalf,
      barRightX: cx + baseHalf,
      limeCircle: { x: cx + baseHalf - 0.02, y: topY + 0.015, r: 0.08 },
      handleBar: { x: Math.max(0.08, cx - baseHalf - 0.03), y: barYNorm },
      handleFoot: { x: cx + baseHalf, y: botY - 0.04 },
    };
  }

  return {
    cfg,
    geom,
    metrics: {
      strokePct,
      counterPct: Number(counterPct.toFixed(1)),
      slopeDeg: Number(slopeDeg.toFixed(1)),
      barPct: Math.round(barY * 100),
      baseWidthRatioPct,
    },
  };
}

// 严格单一真源诊断：根据几何指标逐柱判定，按优先级报出最急需修的问题
export function evaluate(state, aspect = STAGE_ASPECT) {
  const geo = computeGeometry(state, aspect);
  const { cfg, metrics } = geo;

  // 1. 留白空间（字怀 / 字形 FORM）
  let counterState = "ok";
  let counterTag = `字怀 ${metrics.counterPct.toFixed(0)}%`;
  if (state.stroke < cfg.strokeBand[0]) {
    counterState = "thin";
    counterTag = `细丝散架 ${metrics.strokePct}%`;
  } else if (state.stroke > cfg.strokeBand[1]) {
    counterState = "choked";
    counterTag = metrics.counterPct < 1 ? "字怀堵死 0%" : `字怀挤扁 ${metrics.counterPct.toFixed(0)}%`;
  } else if (metrics.counterPct < cfg.counterBand[0]) {
    // 笔画本身已合适，但被过高的横梁或过窄的底座掐扁了字怀
    counterState = "pinched";
    counterTag = `受挤 ${metrics.counterPct.toFixed(0)}%`;
  } else if (metrics.counterPct > cfg.counterBand[1]) {
    counterState = "thin";
    counterTag = `字怀过空 ${metrics.counterPct.toFixed(0)}%`;
  }

  // 2. 倾斜引导 & 稳定支撑（底座 / 骨架 STRUCTURE）
  let baseState = "ok";
  let baseTag = cfg.id === "H" ? `展幅 ${metrics.baseWidthRatioPct}%` : `倾角 ${metrics.slopeDeg.toFixed(0)}°`;
  if (state.spread < cfg.spreadBand[0]) {
    baseState = "narrow";
    baseTag = cfg.id === "H" ? `过窄 ${metrics.baseWidthRatioPct}%` : `窄缩 ${metrics.slopeDeg.toFixed(0)}°`;
  } else if (state.spread > cfg.spreadBand[1]) {
    baseState = "wide";
    baseTag = cfg.id === "H" ? `劈裂 ${metrics.baseWidthRatioPct}%` : `摊扁 ${metrics.slopeDeg.toFixed(0)}°`;
  }

  // 3. 横向连接（横梁 / 联想 ASSOCIATION）
  let barState = "ok";
  let barTag = `横梁 ${metrics.barPct}%`;
  if (state.barY < cfg.barBand[0]) {
    barState = "high";
    barTag = `压顶 ${metrics.barPct}%`;
  } else if (state.barY > cfg.barBand[1]) {
    barState = "low";
    barTag = `塌底 ${metrics.barPct}%`;
  }

  // 4. 信息与视觉装配（创意 CREATIVITY）
  let infoState = "ok";
  let infoTag = "依骨架共生";
  if (state.infoMode === "flat") {
    infoState = "flat";
    infoTag = "横排硬压";
  } else if (state.infoMode === "ornate") {
    infoState = "ornate";
    infoTag = "花哨失认";
  }

  const pillars = {
    form: { ok: counterState === "ok", state: counterState, tag: counterTag },
    structure: { ok: baseState === "ok", state: baseState, tag: baseTag },
    association: { ok: barState === "ok", state: barState, tag: barTag },
    creativity: { ok: infoState === "ok", state: infoState, tag: infoTag },
  };
  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 诊断说明：按视觉灾难与物理因果单报 1 条最核心问题，说清为什么 + 怎么调
  let diag = null;
  if (infoState === "ornate") {
    diag = {
      severity: "err",
      badge: "错态 · 过度变形失认",
      title: "装饰和扭曲淹没了字母本体",
      why: "字母造型版式的底线是「三秒先认出字母」。当碎块和偏斜干扰压过轮廓，读者连这是哪个字都辨认不出，视觉记忆反而不如普通海报。",
      action: "把下方信息装配切回「依骨架落位」，让清晰字形本身当主角。",
    };
  } else if (counterState === "choked") {
    diag = {
      severity: "err",
      badge: "错态 · 字怀窒息",
      title: `笔画占到 ${metrics.strokePct}%，内部字怀被挤成 ${metrics.counterPct.toFixed(1)}%`,
      why: `巨型「${cfg.char}」快糊成一块实心紫砖，原海报强调的「留白空间」彻底闷死。没有透气的内部负形，大脑很难把外轮廓读成一个有呼吸感的字母骨架。`,
      action: `把底沿「笔画体量推杆」往左拉进经验参考带（${Math.round(cfg.strokeBand[0] * 100)}%–${Math.round(cfg.strokeBand[1] * 100)}%），让字怀留白自然透出来。`,
    };
  } else if (counterState === "thin") {
    diag = {
      severity: "err",
      badge: "错态 · 细丝散架",
      title: `笔画瘦到 ${metrics.strokePct}%，撑不起版面骨架`,
      why: "笔画过细会退化成普通线框插画，既托不住横梁上的文字，也无法在整张海报里形成强识别的色彩体量。",
      action: `把底沿「笔画体量推杆」往右推到 ${Math.round(cfg.strokeBand[0] * 100)}%–${Math.round(cfg.strokeBand[1] * 100)}% 经验带，立住建筑体量。`,
    };
  } else if (baseState === "narrow") {
    diag = {
      severity: "err",
      badge: "错态 · 底座针脚摇晃",
      title: cfg.id === "H"
        ? `双柱展幅仅 ${metrics.baseWidthRatioPct}%，挤成一根细竖条`
        : `斜边倾角只有 ${metrics.slopeDeg.toFixed(1)}°，底座窄缩不稳`,
      why: "底足收得太紧，字母重心发飘、底下兜不住日期与场馆信息，斜边也拉不出向上牵引视线的动势。",
      action: "在画布上向右拖底部青柠足标（或拖「底座张角」滑块），拉开底部稳定支撑。",
    };
  } else if (baseState === "wide") {
    diag = {
      severity: "err",
      badge: "错态 · 摊扁失导",
      title: cfg.id === "H"
        ? `双柱拉到 ${metrics.baseWidthRatioPct}%，左右劈成两面孤墙`
        : `斜边摊平到 ${metrics.slopeDeg.toFixed(1)}°，字母垮成矮棚`,
      why: "张角过大让字母向上的挺拔感散掉，中横梁也被扯得过长，整体变得松垮笨重。",
      action: "把底部青柠足标往里收回舒适带，重新拉起向上聚拢的引导张力。",
    };
  } else if (barState === "high") {
    diag = {
      severity: "err",
      badge: "错态 · 横梁压顶",
      title: `横梁顶到字高 ${metrics.barPct}%，掐碎了上部字怀`,
      why: "横向连接放得太高，顶部留白被挤成扁缝、下半截空荡失锚，整座字母显得头重脚轻。",
      action: `直接在画布上向下拖横梁手柄，落入 ${Math.round(cfg.barBand[0] * 100)}%–${Math.round(cfg.barBand[1] * 100)}% 经验承重带。`,
    };
  } else if (barState === "low") {
    diag = {
      severity: "err",
      badge: "错态 · 横梁塌底",
      title: `横梁掉到字高 ${metrics.barPct}%，失去中腰串联`,
      why: "连接横梁滑到近底边，上半部留白空洞过大，文字重心跌落底部，字母的两侧结构也失掉了腰际拉结。",
      action: `向上拖回横梁手柄至 ${Math.round(cfg.barBand[0] * 100)}%–${Math.round(cfg.barBand[1] * 100)}% 经验带，稳住视觉腰线。`,
    };
  } else if (counterState === "pinched") {
    diag = {
      severity: "err",
      badge: "错态 · 字怀仍偏紧",
      title: `当前字怀留白只有 ${metrics.counterPct.toFixed(1)}%，还差一点透气度`,
      why: `笔画与横梁共同决定了字怀净面积。当前虽接近目标，但内部负形仍略低于 ${cfg.counterBand[0]}% 经验参考下限。`,
      action: "把底沿「笔画体量推杆」再向左轻退 2%–4%，让字怀空间彻底透亮。",
    };
  } else if (infoState === "flat") {
    diag = {
      severity: "err",
      badge: "错态 · 信息硬压骨架",
      title: "文字强行居中横跨，直接截断了字母轮廓",
      why: "把大字母当成背景底纹、把标题和展期死板平铺在正中间，既挡住字怀留白，又砍断左右斜边的视线流——字母造型白做了。",
      action: "点击下方「依骨架落位」（或直接点击画布文字块），把信息分别嵌进横梁、字怀与双足槽位。",
    };
  } else {
    diag = {
      severity: "ok",
      badge: "成立 · 4 / 4 骨架共生",
      title: `「${cfg.char}」字骨架稳固，形态与信息同步成记忆`,
      why: `笔画 ${metrics.strokePct}% 留出 ${metrics.counterPct.toFixed(1)}% 透气字怀，横梁稳坐 ${metrics.barPct}% 承托副标，底座撑起稳定重心，青柠圆点轻咬顶角收束视线。`,
      action: "可以试试切到 H / S 体验不同字母骨架，或故意把笔画推过头观察字怀何时塌陷。",
    };
  }

  return {
    ...geo,
    pillars,
    passCount,
    diag,
    allOk: passCount === 4,
  };
}
