// 092 封闭式构图 — 单真源几何模型与双向围合审计
// 画布几何、读数、四探针与底部关键词标尺全部由本模块同一份数据算出。

export const PALETTE = {
  paper: "#F1E6D6",
  paperLight: "#F8F2E8",
  paperSoft: "#E9DCC7",
  bevelCream: "#EBDFC7",
  bevelGold: "#DFC8A0",
  bevelShade: "#CEB182",
  cypress: "#173426",
  cypressDeep: "#112C21",
  cypressDark: "#0D2118",
  gold: "#C4A670",
  goldBright: "#D6AF6D",
  goldDot: "#D6A354",
  goldEn: "#B48835",
  goldInk: "#7D5B1A",
  alert: "#B83227",
  alertFill: "rgba(184, 50, 39, 0.16)",
  alertDark: "#FF8373",
  ok: "#1E6B47",
  okDark: "#73D6A4",
};

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 叠院藏核",
    short: "原海报",
    caption: "1:1 转译 092 原海报：深柏外框、四向内楔、鎏金斜切壁、双金环、暖白菱庭与核心金珠。",
    coreTitle: "核心",
    coreSub: "FOCUS",
  },
  crest: {
    id: "crest",
    label: "徽章 · 品牌印记",
    short: "品牌徽章",
    caption: "标志与火漆印记靠外环与四向锚点收束成自足器物，在任何背景上都能站稳。",
    coreTitle: "印",
    coreSub: "SEAL",
  },
  cover: {
    id: "cover",
    label: "书封 · 框景珍藏",
    short: "精装书封",
    caption: "典藏书封与展讯海报以礼制框线和内庭留白托起书名与器物，传递秩序与可信度。",
    coreTitle: "藏",
    coreSub: "EDITION",
  },
};

export const PRESETS = {
  // 开场错态（绝不先给答案）
  broken: {
    label: "破门失核",
    kind: "bad",
    gates: { n: true, e: false, s: false, w: true },
    seal: 38,
    inwardBevels: false,
    strayIntruder: true,
    coreScale: 12,
    form: "square",
  },
  // 三组合法多解
  poster: {
    label: "原海报叠院",
    kind: "good",
    gates: { n: true, e: true, s: true, w: true },
    seal: 88,
    inwardBevels: true,
    strayIntruder: false,
    coreScale: 27,
    form: "square",
  },
  airy: {
    label: "疏朗细框",
    kind: "good",
    gates: { n: true, e: true, s: true, w: true },
    seal: 72,
    inwardBevels: true,
    strayIntruder: false,
    coreScale: 24,
    form: "square",
  },
  tondo: {
    label: "圆穹团扇",
    kind: "good",
    gates: { n: true, e: true, s: true, w: true },
    seal: 86,
    inwardBevels: true,
    strayIntruder: false,
    coreScale: 28,
    form: "tondo",
  },
  // 四组双向试错（含反向过封窒息）
  cage: {
    label: "过封窒息",
    kind: "bad",
    gates: { n: true, e: true, s: true, w: true },
    seal: 116,
    inwardBevels: true,
    strayIntruder: false,
    coreScale: 34,
    form: "square",
  },
  splay: {
    label: "死角外散",
    kind: "bad",
    gates: { n: true, e: true, s: true, w: true },
    seal: 84,
    inwardBevels: false,
    strayIntruder: false,
    coreScale: 26,
    form: "square",
  },
  drown: {
    label: "核弱沉底",
    kind: "bad",
    gates: { n: true, e: true, s: true, w: true },
    seal: 90,
    inwardBevels: true,
    strayIntruder: false,
    coreScale: 11,
    form: "square",
  },
  choke: {
    label: "核胖顶框",
    kind: "bad",
    gates: { n: true, e: true, s: true, w: true },
    seal: 90,
    inwardBevels: true,
    strayIntruder: false,
    coreScale: 54,
    form: "square",
  },
};

export const GATE_NAMES = { n: "北门", e: "东门", s: "南门", w: "西门" };
export const GATE_ORDER = ["n", "e", "s", "w"];

export function createInitialState() {
  const p = PRESETS.broken;
  return {
    scenario: "poster",
    gates: { ...p.gates },
    seal: p.seal,
    inwardBevels: p.inwardBevels,
    strayIntruder: p.strayIntruder,
    coreScale: p.coreScale,
    form: p.form,
    guides: true,
  };
}

export function applyPreset(state, key) {
  const p = PRESETS[key];
  if (!p) return state;
  state.gates = { ...p.gates };
  state.seal = p.seal;
  state.inwardBevels = p.inwardBevels;
  state.strayIntruder = p.strayIntruder;
  state.coreScale = p.coreScale;
  state.form = p.form;
  return state;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 根据状态计算画布内 [0..1]×[0..1] 的全部真实几何，
 * 供渲染和审计共同读取，杜绝两套口径。
 */
export function computeGeometry(state) {
  const seal = clamp(state.seal, 20, 120);
  const coreScale = clamp(state.coreScale, 10, 60);
  const t = (seal - 20) / 100; // 0 .. 1.0

  // 外墙实绘厚度（占画布边长比例）：20% 时薄弱 0.036，88% 时 0.106，116% 时压迫 0.146
  const wallT = 0.036 + t * 0.108;
  // 内庭边界
  const innerMin = wallT;
  const innerMax = 1 - wallT;
  const cavitySpan = innerMax - innerMin; // 约 0.928 .. 0.712

  // 鎏金斜切内壁宽度：合围越紧斜壁越深；过封（>105%）会进一步吞吃内庭
  const overCage = Math.max(0, (seal - 104) / 16);
  const bevelD = cavitySpan * (0.068 + t * 0.088 + overCage * 0.085);

  // 内方框边界（斜切金壁之后）
  const courtMin = innerMin + bevelD;
  const courtMax = innerMax - bevelD;
  const courtSpan = Math.max(0.18, courtMax - courtMin);

  // 深柏大圆环外径与细金内径（严格内切于内方框）
  const ringOuterR = courtSpan * 0.5;
  const ringThickness = ringOuterR * (0.24 + overCage * 0.14);
  const ringInnerR = Math.max(0.08, ringOuterR - ringThickness);

  // 内庭暖白菱形半对角线（严格内切细金内环）
  const diamondR = ringInnerR * 0.955;

  // 核心鎏金方座半边长（由 coreScale 直接映射，允许过胖顶撞甚至压过菱形/金环）
  const coreHalf = (cavitySpan * 0.5) * (coreScale / 100);
  const coreCircleR = coreHalf * 0.58;
  const coreDotR = coreCircleR * 0.42;

  // 真实框核呼吸余量：细金内环到核心外缘的距离占整幅比例
  const cushionRaw = ringInnerR - coreHalf;
  const cushionPct = Math.round(clamp(cushionRaw * 200, -18, 52));

  // 四门缺口几何（当门闸打开时，在对应边中段凿开物理缺口）
  const breachHalf = cavitySpan * 0.255;
  const gateZones = {
    n: { x: 0.5 - breachHalf, y: 0, w: breachHalf * 2, h: wallT + 0.035, cx: 0.5, cy: wallT * 0.52 },
    s: { x: 0.5 - breachHalf, y: 1 - wallT - 0.035, w: breachHalf * 2, h: wallT + 0.035, cx: 0.5, cy: 1 - wallT * 0.52 },
    w: { x: 0, y: 0.5 - breachHalf, w: wallT + 0.035, h: breachHalf * 2, cx: wallT * 0.52, cy: 0.5 },
    e: { x: 1 - wallT - 0.035, y: 0.5 - breachHalf, w: wallT + 0.035, h: breachHalf * 2, cx: 1 - wallT * 0.52, cy: 0.5 },
  };

  // 四角斜切导引点击区（用于直点翻转内收/外散）
  const cornerDist = innerMin + bevelD * 0.52;
  const cornerZones = [
    { id: "nw", x: cornerDist, y: cornerDist, dx: 1, dy: 1 },
    { id: "ne", x: 1 - cornerDist, y: cornerDist, dx: -1, dy: 1 },
    { id: "se", x: 1 - cornerDist, y: 1 - cornerDist, dx: -1, dy: -1 },
    { id: "sw", x: cornerDist, y: 1 - cornerDist, dx: 1, dy: -1 },
  ];

  // 闯边逃逸杂块实绘位置（紧压东侧边界与斜壁，完整留在画布视野内不裁字，且与东门中点错开）
  const intruder = {
    x: state.gates.e ? 1 - wallT - 0.145 : 0.795,
    y: 0.235,
    w: 0.165,
    h: 0.095,
  };

  const openGates = GATE_ORDER.filter((k) => !state.gates[k]);
  const closedCount = 4 - openGates.length;

  // 实测边界闭环率（4 门贡献 × 合围紧度折算）
  const cornerSealFactor = clamp((seal - 18) / 56, 0.25, 1);
  const perimeterPct = Math.round((closedCount / 4) * cornerSealFactor * 100);

  return {
    seal,
    coreScale,
    wallT,
    innerMin,
    innerMax,
    cavitySpan,
    bevelD,
    courtMin,
    courtMax,
    courtSpan,
    ringOuterR,
    ringInnerR,
    diamondR,
    coreHalf,
    coreCircleR,
    coreDotR,
    cushionRaw,
    cushionPct,
    breachHalf,
    gateZones,
    cornerZones,
    intruder,
    openGates,
    closedCount,
    perimeterPct,
    overCage,
  };
}

/**
 * 单真源审计：返回四项探针状态、总评档位（不伪造假精确得分）、
 * 白话主诊断、下一步行动指引及标题角框动态张合参数。
 */
export function audit(state) {
  const g = computeGeometry(state);
  const openNames = g.openGates.map((k) => GATE_NAMES[k]).join("、");

  const tooTight = g.seal > 105;
  const tooThin = g.seal < 68;
  const coreTooSmall = g.coreScale < 18;
  const coreTooBig = g.coreScale > 42 || g.cushionPct < 12;

  const boundaryOk = g.closedCount === 4 && !tooThin && !tooTight;
  const guidanceOk = state.inwardBevels && g.closedCount >= 3;
  const focusOk = !coreTooSmall && !coreTooBig;
  const unityOk = !state.strayIntruder && !tooTight && g.cushionPct >= 12;

  const passed = [boundaryOk, guidanceOk, focusOk, unityOk].filter(Boolean).length;

  let code = "pass";
  let stamp = `${passed}/4`;
  let tier = "秩序自足（示意）";
  let headline = "";
  let why = "";
  let hint = "";

  if (g.closedCount < 4) {
    code = "open_breach";
    stamp = `${passed}/4 · 缺口 ${g.openGates.length} 处`;
    tier = g.closedCount <= 1 ? "完全敞开（示意）" : "边界泄气（示意）";
    headline = `${openNames}敞开缺口，视线正顺着破口滑出画外`;
    why = `当前仅有 ${g.closedCount}/4 面围墙闭合（周界闭环 ${g.perimeterPct}%）。人眼遇到断墙会自动把画内路径延续到画框之外，结构立刻滑向 091 开放式构图，核心留不住气场。`;
    hint = `直接点击画布上带红框虚线的「${openNames}」把缺口合上（或向右横拖画布推进合围度至 72%–96%）。`;
  } else if (tooTight) {
    code = "cage_suffocation";
    stamp = `${passed}/4 · 过封窒息`;
    tier = "牢笼压迫（示意）";
    headline = `合围度拉爆至 ${g.seal}%，厚重框壁反把中心闷成了牢笼`;
    why = `封闭不是越厚越好。外墙与斜壁吃掉了过多内庭空间，框核呼吸余量跌到 ${g.cushionPct}%，观众先感到逼仄和压抑，而不是稳定与信任。`;
    hint = `向左横拖画布（或把「四向合围度」退回 72%–96% 区间），给内庭留出约 15%–28% 的喘息缓冲。`;
  } else if (tooThin) {
    code = "weak_boundary";
    stamp = `${passed}/4 · 框壁偏薄`;
    tier = "围合偏松（示意）";
    headline = `四门已闭，但框壁合围度仅 ${g.seal}%，挡不住视线外漂`;
    why = `四周虽连成一圈，边界分量却太弱，墙角尚未形成清晰包裹感；内庭能量容易贴边溢散，整体缺乏沉稳的建筑骨架。`;
    hint = `在画布上向右横拖（或把「四向合围度」推至 72%–96%），让外框建立足够的包裹重量。`;
  } else if (!state.inwardBevels) {
    code = "outward_splay";
    stamp = `${passed}/4 · 导引外散`;
    tier = "四角分心（示意）";
    headline = `四角斜切导引向外翻转，视线被生生拽进四个死角`;
    why = `光有外框还不够——若框内线条与楔形朝外张开，观者的目光就会不断撞向画框四角来回打转，迟迟回不到中心主角身上。`;
    hint = `直接点击画布四角标红的斜切导引楔（或点击「扳回向内导引」），让四面倾角顺势把目光折向内环。`;
  } else if (state.strayIntruder) {
    code = "edge_leak_intruder";
    stamp = `${passed}/4 · 闯边抢戏`;
    tier = "整体破损（示意）";
    headline = `东侧边缘卡着一枚压边逸出块，整体统一被撕开一角`;
    why = `封闭式构图讲究框内所有元素彼此依存。任何贴死在边框上甚至半截探出墙外的孤立色块，都会在边缘制造「次焦点」，分散中心凝聚力。`;
    hint = `直接点击画布右侧标红的「闯边杂块」将其收回内庭，让画面重归完整。`;
  } else if (coreTooSmall) {
    code = "core_drowned";
    stamp = `${passed}/4 · 核心萎缩`;
    tier = "中空失焦（示意）";
    headline = `核心尺度仅占 ${g.coreScale}%，沉没在宽阔围墙里失了重心`;
    why = `围合的目的是托起主角，而不是喧宾夺主。当外框气势庞大、核心却缩成微弱小点时，观众只看到一个空荡的画框，找不到可停留的信息重心。`;
    hint = `把「核心尺度」调到 20%–36% 左右，让中央金座既稳住视觉重量，又与内环保持舒适呼吸。`;
  } else if (coreTooBig) {
    code = "core_choked";
    stamp = `${passed}/4 · 核心顶框`;
    tier = "核框互挤（示意）";
    headline = `核心膨胀至 ${g.coreScale}%（留气仅 ${g.cushionPct}%），主角直接顶撞内环`;
    why = `主角和围合边界必须隔出清晰的过渡空间。核心紧贴甚至压过内环金线时，边界从「护城河」变成「紧箍咒」，画面显得局促发紧。`;
    hint = `把「核心尺度」收回到 22%–36% 区间，恢复 14% 以上的框核呼吸余量。`;
  } else {
    code = "pass";
    if (state.form === "tondo") {
      stamp = "4/4 · 圆穹合围";
      tier = "圆满自足（示意）";
      headline = "圆穹环封成立：不必画硬方框，圆弧照样把视线拢回中心";
      why = `四向闭环无缺口、斜切矢向内收束、核心占比 ${g.coreScale}% 配 ${g.cushionPct}% 呼吸余量——正如拉斐尔圆形画与中式月洞门，曲面边界自然消除死角，把注意力柔和推向圆心。`;
      hint = "按 Space 放飞金砂视线验真，也可切换「徽章 / 书封」或故意试探「过封窒息」看看边界在哪。";
    } else if (g.seal <= 79) {
      stamp = "4/4 · 疏朗细框";
      tier = "清雅稳重（示意）";
      headline = "疏朗细框成立：轻边框配宽呼吸，稳而不闷";
      why = `合围度 ${g.seal}% 守住四边，又留出 ${g.cushionPct}% 的舒朗内庭与向内导引——这是精装书封与现代海报最常用的封闭解法：秩序清晰，却毫不沉重。`;
      hint = "按 Space 放飞视线验真，或试试把合围度推过 106% 亲手体验「过封成笼」的反作用。";
    } else {
      stamp = "4/4 · 叠院合围";
      tier = "沉稳专注（示意）";
      headline = "四重层阶全部落锁：方框围界、斜壁收束、金核稳居正中";
      why = `四门全闭（合围 ${g.seal}%）、斜切内引、核心占比 ${g.coreScale}% 且框核留气 ${g.cushionPct}%。每道目光触到外墙都会被层层折返核心，呈现原海报所讲的稳定、专注与可信度。`;
      hint = "按 Space 放飞 16 枚金砂流光实测轨迹，或切到「圆穹团扇 / 徽章 / 书封」验证多解。";
    }
  }

  // 四枚原海报圆徽与底部关键词的统一短签
  const probes = {
    boundary: {
      ok: boundaryOk,
      tag: g.closedCount < 4 ? `缺口 ${g.openGates.length} 处` : tooTight ? `过厚 ${g.seal}%` : tooThin ? `偏薄 ${g.seal}%` : `合围 ${g.seal}%`,
      kw: g.closedCount < 4 ? `缺 ${g.openGates.length} 门` : tooTight ? "过封窒息" : tooThin ? `偏松 ${g.seal}%` : `闭环 ${g.seal}%`,
    },
    guidance: {
      ok: guidanceOk,
      tag: !state.inwardBevels ? "外翻挂角" : g.closedCount < 3 ? "断壁失引" : "四向内收",
      kw: !state.inwardBevels ? "外散" : g.closedCount < 3 ? "漏引" : "向心收束",
    },
    focus: {
      ok: focusOk,
      tag: coreTooSmall ? `萎缩 ${g.coreScale}%` : coreTooBig ? `顶框 ${g.coreScale}%` : `核心 ${g.coreScale}%`,
      kw: coreTooSmall ? `过小 ${g.coreScale}%` : coreTooBig ? `挤环 ${g.cushionPct}%` : `稳核 ${g.coreScale}%`,
    },
    unity: {
      ok: unityOk,
      tag: state.strayIntruder ? "闯边 1 处" : tooTight ? "压迫失和" : g.cushionPct < 12 ? `留气 ${g.cushionPct}%` : `留气 ${g.cushionPct}%`,
      kw: state.strayIntruder ? "边缘破损" : tooTight ? "发闷" : `和谐 ${g.cushionPct}%`,
    },
  };

  // 自示范标题角框张合量：0 = 完美收紧护住标题，1 = 破开散离，-0.3 = 过封逼近挤压
  const titleBracketSpread = tooTight ? -0.35 : clamp(1 - g.perimeterPct / 100, 0, 1);

  return {
    g,
    passed,
    ok: passed === 4,
    code,
    stamp,
    tier,
    headline,
    why,
    hint,
    probes,
    titleBracketSpread,
  };
}
