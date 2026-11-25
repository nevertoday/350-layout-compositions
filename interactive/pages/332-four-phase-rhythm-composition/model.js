// 332 起承转合构图 · 单真源几何与节奏评定模型
// 所有画布坐标、四折张力、S 形气韵丝带弯幅与研判读数均出自本模块同一份数据。

export const PHASES = [
  {
    key: "qi",
    num: "1",
    zh: "起",
    en: "start",
    posterTitle: "吸引注意，建立方向",
    posterBody: "用简洁的元素与留白，确定视觉焦点与进入点。",
    rightTitle: "聚焦视线",
    rightLines: ["少即是多", "建立视觉入口"],
    icon: "eye",
    idealRange: [0.08, 0.34],
  },
  {
    key: "cheng",
    num: "2",
    zh: "承",
    en: "develop",
    posterTitle: "展开内容，丰富信息",
    posterBody: "加入更多元素与细节，拓展画面信息与层次。",
    rightTitle: "丰富信息",
    rightLines: ["扩展内容", "增加层次与细节"],
    icon: "layers",
    idealRange: [0.36, 0.64],
  },
  {
    key: "zhuan",
    num: "3",
    zh: "转",
    en: "turn",
    posterTitle: "制造变化，产生张力",
    posterBody: "通过对比、方向或节奏的转折，形成视觉高潮与情绪转折。",
    rightTitle: "制造张力",
    rightLines: ["打破平衡", "引发情绪波动"],
    icon: "bolt",
    idealRange: [0.74, 1.0],
  },
  {
    key: "he",
    num: "4",
    zh: "合",
    en: "resolve",
    posterTitle: "回归平衡，留下余韵",
    posterBody: "元素收束，节奏放缓，让画面在平静中结束。",
    rightTitle: "回归平衡",
    rightLines: ["收束元素", "留下想象空间"],
    icon: "wave",
    idealRange: [0.10, 0.38],
  },
];

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·观澜四境",
    short: "观澜四境",
    caption: "孤月平波 → 叠山朝日 → 巨浪钩月 → 落日涟漪",
  },
  scroll: {
    id: "scroll",
    label: "长卷·富春行旅",
    short: "富春行旅",
    caption: "平坡疏林 → 溪桥重峦 → 危崖急峡 → 远汀归帆",
  },
  comic: {
    id: "comic",
    label: "分镜·四格画帖",
    short: "四格画帖",
    caption: "独院静坐 → 听雨烹茶 → 骤风折枝 → 雨歇残阳",
  },
};

export const PRESETS = {
  // 开场刻意停在「先炸后平 + 路径僵直」真错态
  brokenStart: {
    id: "brokenStart",
    label: "复原错态",
    energies: [0.86, 0.52, 0.26, 0.68],
    curve: 0.14,
    active: 0,
  },
  classic: {
    id: "classic",
    label: "原海报经典解",
    energies: [0.18, 0.50, 0.88, 0.24],
    curve: 0.62,
    active: 2,
  },
  lyrical: {
    id: "lyrical",
    label: "清幽小品解",
    energies: [0.14, 0.42, 0.78, 0.20],
    curve: 0.48,
    active: 2,
  },
  dramatic: {
    id: "dramatic",
    label: "戏剧强冲解",
    energies: [0.22, 0.58, 0.96, 0.26],
    curve: 0.78,
    active: 2,
  },
  flatMistake: {
    id: "flatMistake",
    label: "试错：四段平温",
    energies: [0.46, 0.50, 0.54, 0.48],
    curve: 0.56,
    active: 2,
  },
  noResolveMistake: {
    id: "noResolveMistake",
    label: "试错：有转无合",
    energies: [0.18, 0.50, 0.90, 0.82],
    curve: 0.62,
    active: 3,
  },
  knotMistake: {
    id: "knotMistake",
    label: "试错：路径打结",
    energies: [0.18, 0.50, 0.88, 0.24],
    curve: 0.97,
    active: 1,
  },
};

export function createInitialState() {
  return {
    energies: [...PRESETS.brokenStart.energies],
    curve: PRESETS.brokenStart.curve,
    active: 0,
    scene: "poster",
    cursor: 0.16,
    playing: false,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const pct = (v) => `${Math.round(clamp(v, 0, 1) * 100)}%`;

// 根据画布逻辑尺寸计算四枚圆镜中心、半径及 S 形丝带控制点（单真源）
export function computeLayout(state, width, height) {
  const compact = width < 520;
  const shortH = height < 310;
  const padX = compact ? width * 0.06 : width * 0.055;
  const topSafe = shortH ? 42 : 48; // 给顶部胶囊留足绝对净空
  const waveZoneH = shortH ? 58 : compact ? 70 : 78; // 底沿节奏波形谱带
  const stageH = Math.max(136, height - topSafe - waveZoneH - 10);
  const stageW = Math.max(240, width - padX * 2);

  // 基础圆镜半径：严格使用同一标量，确保 100% 真圆，且水平四列绝不互相重叠
  const maxRByW = (stageW / 4) * (compact ? 0.34 : 0.36);
  const maxRByH = stageH * (shortH ? 0.23 : 0.24);
  const baseR = clamp(Math.min(maxRByW, maxRByH), 22, 54);

  // 四枚圆镜分占四列（水平间隔 ≥ 0.24*stageW，永不互撞），纵向带微倾步进 + S 形上下蜿蜒摆幅
  const colUs = [0.125, 0.375, 0.625, 0.875];
  const baseVs = [0.36, 0.46, 0.54, 0.64];
  // curve=0 时接近平直斜线；curve=0.62 时优雅 S 弯；curve>0.90 时上下急折打结
  const knotBoost = state.curve > 0.88 ? (state.curve - 0.88) / 0.12 : 0;
  const vertAmp = stageH * (shortH ? 0.24 : 0.28) * state.curve;
  const sYOffsets = [-0.55, 0.68, -0.78 - knotBoost * 0.45, 0.46 + knotBoost * 0.35];
  // 水平微摆只占极小比例，保证列间永不碰撞
  const horizAmp = stageW * 0.025 * state.curve;
  const sXOffsets = [-0.4, 0.5, -0.5, 0.35];

  const circles = state.energies.map((energy, i) => {
    const r = baseR * (0.90 + energy * 0.18);
    const labelBand = shortH ? 34 : 44; // 给圆上/下方的文字标牌留出净空
    const minY = topSafe + r + (i % 2 === 1 ? labelBand : 6);
    const maxY = topSafe + stageH - r - (i % 2 === 0 ? labelBand : 6);
    const rawY = topSafe + baseVs[i] * stageH + sYOffsets[i] * vertAmp;
    const cy = minY < maxY ? clamp(rawY, minY, maxY) : (minY + maxY) / 2;

    const minX = padX + r + 4;
    const maxX = width - padX - r - 4;
    const cx = clamp(padX + colUs[i] * stageW + sXOffsets[i] * horizAmp, minX, maxX);

    // 丝带节点锚珠（扣在每枚圆镜面向流向的边缘）
    const beadAngle = i === 0 ? Math.PI * 0.18 : i === 1 ? Math.PI * 0.85 : i === 2 ? Math.PI * 0.18 : Math.PI * 0.88;
    const bx = cx + Math.cos(beadAngle) * r;
    const by = cy + Math.sin(beadAngle) * r;
    // 偶数折（1起、3转）圆偏上，标牌放圆正下方；奇数折（2承、4合）圆偏下，标牌放圆正上方
    const labelPos = i % 2 === 0 ? "below" : "above";
    return {
      index: i,
      cx,
      cy,
      r,
      energy,
      bx,
      by,
      labelPos,
      phase: PHASES[i],
    };
  });

  // 三段平滑三次贝塞尔 S 形气韵丝带（从 0→1→2→3 串连四颗锚珠）
  const segments = [];
  for (let i = 0; i < 3; i++) {
    const a = circles[i];
    const b = circles[i + 1];
    const dx = b.bx - a.bx;
    const dy = b.by - a.by;
    const arch = (i % 2 === 0 ? 1 : -1) * (0.18 + state.curve * 0.65) * Math.min(stageH * 0.45, Math.abs(dx) * 0.55);
    const cp1x = a.bx + dx * 0.42;
    const cp1y = a.by + dy * 0.18 + arch;
    const cp2x = b.bx - dx * 0.42;
    const cp2y = b.by - dy * 0.18 - arch * 0.72;
    segments.push({ p0: { x: a.bx, y: a.by }, cp1: { x: cp1x, y: cp1y }, cp2: { x: cp2x, y: cp2y }, p1: { x: b.bx, y: b.by } });
  }

  // 从实绘四圆中心反向核算真实几何弯幅（弦离偏度）
  const start = circles[0];
  const end = circles[3];
  const chordLen = Math.hypot(end.cx - start.cx, end.cy - start.cy) || 1;
  const perpDist = (pt) =>
    Math.abs((end.cy - start.cy) * pt.cx - (end.cx - start.cx) * pt.cy + end.cx * start.cy - end.cy * start.cx) /
    chordLen;
  const d1 = perpDist(circles[1]);
  const d2 = perpDist(circles[2]);
  const signedSide = (pt) =>
    (end.cx - start.cx) * (pt.cy - start.cy) - (end.cy - start.cy) * (pt.cx - start.cx);
  const oppositeSides = signedSide(circles[1]) * signedSide(circles[2]) < 0;
  const bendRatio = clamp((d1 + d2) / chordLen, 0, 1.5);

  const waveBox = {
    x: padX,
    y: height - waveZoneH + 4,
    w: stageW,
    h: waveZoneH - 12,
  };

  return { circles, segments, bendRatio, oppositeSides, waveBox, baseR };
}

// 沿 S 丝带采样位置 (t in [0, 1])
export function sampleRibbon(segments, t) {
  const clamped = clamp(t, 0, 1);
  const scaled = clamped * 3;
  const idx = Math.min(2, Math.floor(scaled));
  const u = scaled - idx;
  const s = segments[idx];
  const mu = 1 - u;
  const x =
    mu * mu * mu * s.p0.x +
    3 * mu * mu * u * s.cp1.x +
    3 * mu * u * u * s.cp2.x +
    u * u * u * s.p1.x;
  const y =
    mu * mu * mu * s.p0.y +
    3 * mu * mu * u * s.cp1.y +
    3 * mu * u * u * s.cp2.y +
    u * u * u * s.p1.y;
  return { x, y, phaseIdx: Math.min(3, Math.round(clamped * 3)) };
}

// 根据当前四折张力算出视线游标在该处的移动速率（慢入 → 铺陈 → 疾转 → 缓收）
export function cursorSpeedAt(energies, t) {
  const scaled = clamp(t, 0, 1) * 3;
  const i = Math.min(2, Math.floor(scaled));
  const f = scaled - i;
  const e = energies[i] * (1 - f) + energies[i + 1] * f;
  // 张力高时视线流转更急促，张力低时缓缓呼吸
  return 0.08 + e * 0.28;
}

// 单真源全面诊断：核算 7 类双向真错态、4 折分检、4 条 TIPS 状态与白话研判
export function evaluate(state, layoutWidth = 760, layoutHeight = 520) {
  const [e0, e1, e2, e3] = state.energies;
  const layout = computeLayout(state, layoutWidth, layoutHeight);

  const maxE = Math.max(e0, e1, e2, e3);
  const minE = Math.min(e0, e1, e2, e3);
  const span = maxE - minE;
  // 转折跃差：第 3 拍相对前两拍铺陈的突破高度（若末拍塞满导致收不住，交由「合」的校验精准归因「有转无合」）
  const turnLeap = e2 - Math.max(e0, e1);
  const resolveDrop = e2 - e3;
  const entryAir = 1 - e0; // 起笔留白呼吸度

  // 分折核验（每折双向皆可错）
  const qiOk = e0 >= 0.08 && e0 <= 0.34;
  const qiTag =
    e0 > 0.34
      ? `起躁 ${pct(e0)}`
      : e0 < 0.08
      ? `空虚 ${pct(e0)}`
      : `静入 ${pct(e0)}`;
  const qiReason =
    e0 > 0.34
      ? "开篇过满过躁，一进画就喧闹抢戏"
      : e0 < 0.08
      ? "开篇近乎空白，找不到视觉进入点"
      : "留白充裕，视觉入口清晰克制";

  const chengOk = e1 >= 0.36 && e1 <= 0.66 && e1 >= e0 + 0.12 && e1 <= e2 - 0.14;
  const chengTag =
    e1 < e0 + 0.12
      ? `偏平 ${pct(e1)}`
      : e1 > 0.66
      ? `抢峰 ${pct(e1)}`
      : e1 > e2 - 0.14
      ? `压转 ${pct(e1)}`
      : `铺陈 ${pct(e1)}`;
  const chengReason =
    e1 < e0 + 0.12
      ? "未能比「起」更丰富，信息展开断气"
      : e1 > 0.66 || e1 > e2 - 0.14
      ? "第二拍提前把情绪推满，透支了后面的转折"
      : "层次较起笔丰盈，又为转折留出抬升空间";

  const zhuanOk = e2 >= 0.72 && turnLeap >= 0.16 && e2 >= e3;
  const zhuanTag =
    e2 < 0.72
      ? `塌陷 ${pct(e2)}`
      : turnLeap < 0.16 || e2 < e3
      ? `不独 ${pct(e2)}`
      : `高潮 ${pct(e2)}`;
  const zhuanReason =
    e2 < 0.72
      ? "第三拍力度太弱，打不破前两段惯性"
      : turnLeap < 0.16 || e2 < e3
      ? "其他段落同样躁动，「转」立不起唯一高潮"
      : "骤起强烈反差，情绪与视线瞬间聚拢到最高点";

  const heOk = e3 >= 0.10 && e3 <= 0.38 && resolveDrop >= 0.34;
  const heTag =
    e3 > 0.38
      ? `塞满 ${pct(e3)}`
      : e3 < 0.10
      ? `死寂 ${pct(e3)}`
      : resolveDrop < 0.34
      ? `落弱 ${pct(e3)}`
      : `余韵 ${pct(e3)}`;
  const heReason =
    e3 > 0.38
      ? "高潮之后收不住，结尾依旧喧闹拥挤"
      : e3 < 0.10
      ? "末段彻底归零断稿，缺少首尾回响"
      : resolveDrop < 0.34
      ? "前段未起高潮，末段也就无从谈收束"
      : "重浪收归平水，留白托出长久余韵";

  const pathTooStraight = state.curve < 0.28 || layout.bendRatio < 0.11;
  const pathTooKnot = state.curve > 0.90;
  const pathOk = !pathTooStraight && !pathTooKnot;

  const phaseChecks = [
    { ok: qiOk, tag: qiTag, reason: qiReason },
    { ok: chengOk, tag: chengTag, reason: chengReason },
    { ok: zhuanOk, tag: zhuanTag, reason: zhuanReason },
    { ok: heOk, tag: heTag, reason: heReason },
  ];
  const passCount = phaseChecks.filter((p) => p.ok).length;

  // 原海报左下角 TIPS 四条对勾实测绑定
  const tipsChecks = [
    // 1. 节奏由慢到快，再由快到慢
    e0 < e1 && e1 < e2 && e2 > e3 && span >= 0.42,
    // 2. 对比与统一并存
    zhuanOk && pathOk && span >= 0.46,
    // 3. 主次分明，层级清晰
    qiOk && chengOk && turnLeap >= 0.16,
    // 4. 留白是呼吸，也是力量
    e0 <= 0.34 && e3 <= 0.38 && e3 >= 0.10,
  ];

  // 7 类优先级最高的诊断归因（单真源文字）
  let kind = "solved";
  let badge = "";
  let headline = "";
  let body = "";
  let hint = "";
  let fixAction = null;

  if (span < 0.34) {
    kind = "flat";
    badge = `四段平温 · ${passCount}/4`;
    headline = `四拍张力挤在 ${pct(minE)}–${pct(maxE)} 之间，画面像报菜名`;
    body =
      "起承转合最怕四段一个音量。当前最高与最低张力只差 " +
      `${Math.round(span * 100)} 个百分点，眼睛扫过去既没有轻声引入，也没有突然转折，一眼就看穿了。`;
    hint = "先把第 1 折「起」压低到 25% 以下留出呼吸，再把第 3 折「转」推上 80% 掀起浪势。";
    fixAction = {
      label: "拉开起静与转峰反差",
      apply: (s) => {
        s.energies[0] = 0.18;
        s.energies[2] = 0.88;
        s.active = 2;
      },
    };
  } else if (e0 > 0.36 && e2 < 0.60) {
    kind = "inverted";
    badge = `先炸后平 · ${passCount}/4`;
    headline = `起笔就炸到 ${pct(e0)}，该转折的第 3 拍反倒塌到 ${pct(e2)}`;
    body =
      "这出戏演反了：观众刚入画就被巨浪迎面撞满，没有留白接住视线；等走到真正该起高潮的第 3 折「转」，画面却泄了气。先炸后平会让人越看越乏味。";
    hint = "点击「互换起⇄转」把高潮还给第 3 拍，或者选中「起」向左拖回安静留白。";
    fixAction = {
      label: "互换「起」与「转」",
      apply: (s) => {
        const tmp = s.energies[0];
        s.energies[0] = s.energies[2];
        s.energies[2] = tmp;
        s.active = 2;
      },
    };
  } else if (e0 > 0.34) {
    kind = "noisyStart";
    badge = `起笔过躁 · ${passCount}/4`;
    headline = `第 1 拍「起」密度高达 ${pct(e0)}，入口太吵留不住人`;
    body =
      "原海报说「起」要「少即是多，建立视觉入口」。现在开篇留白只剩 " +
      `${pct(entryAir)}，元素还没铺陈就抢先喧哗，后面的「承」与「转」都被它抢去了声势。`;
    hint = "选中第 1 枚圆镜「起」，向左横拖或拉低滑轨至 12%–30%，让孤月静丘透出留白。";
    fixAction = {
      label: "收静第 1 拍「起」",
      apply: (s) => {
        s.energies[0] = 0.18;
        s.active = 0;
      },
    };
  } else if (e0 < 0.08) {
    kind = "emptyStart";
    badge = `起笔空虚 · ${passCount}/4`;
    headline = `第 1 拍「起」仅 ${pct(e0)}，画面找不到落眼锚点`;
    body =
      "留白不是完全没有东西。开篇过空时，眼睛扫过第一圆镜无处落脚，故事就少了一颗引路的起音。";
    hint = "把「起」轻轻推回 15%–26%，留出孤月与一抹远丘作为入口焦点。";
    fixAction = {
      label: "点亮第 1 拍视觉入口",
      apply: (s) => {
        s.energies[0] = 0.18;
        s.active = 0;
      },
    };
  } else if (!zhuanOk) {
    kind = "weakTurn";
    badge = `转折塌陷 · ${passCount}/4`;
    headline = `第 3 拍「转」仅 ${pct(e2)}，整幅画缺一口骤起的高潮`;
    body =
      e2 < 0.72
        ? "元代诗论讲「转要变化」。第 3 拍没有用更强的动势、方向与对比打破前两段的平滑惯性，观众的情绪就停在半山腰。"
        : `第 3 拍虽到 ${pct(e2)}，但只比相邻段落高 ${Math.round(turnLeap * 100)}%，高潮不够独一无二。`;
    hint = "选中第 3 枚圆镜「转」，向右横拖推上 78%–95%，让巨浪与钩月猛然翻卷。";
    fixAction = {
      label: "推高第 3 拍「转」成高潮",
      apply: (s) => {
        s.energies[2] = 0.88;
        s.active = 2;
      },
    };
  } else if (!heOk) {
    kind = e3 > 0.38 ? "crowdedEnd" : "deadEnd";
    badge = e3 > 0.38 ? `有转无合 · ${passCount}/4` : `结尾断稿 · ${passCount}/4`;
    headline =
      e3 > 0.38
        ? `第 4 拍「合」仍塞到 ${pct(e3)}，高潮后收不回来、没有余韵`
        : `第 4 拍「合」掉到 ${pct(e3)}，末尾彻底空白像半截断稿`;
    body =
      e3 > 0.38
        ? "「转」掀起了怒涛，但「合」还在翻浪，情绪没处安放。好的结尾要让元素收束、节奏放缓，留出平水落日与想象空间。"
        : "结尾需要平静呼应，而不是删成一张白纸。保留落日与一两道水面涟漪，才叫「渊永有余韵」。";
    hint =
      e3 > 0.38
        ? "选中第 4 枚圆镜「合」，向左拖回 16%–32%，把怒涛收成平波倒影。"
        : "把第 4 拍「合」轻推回 20%–30%，让平静落日收住尾韵。";
    fixAction = {
      label: "收稳第 4 拍「合」出余韵",
      apply: (s) => {
        s.energies[3] = 0.24;
        s.active = 3;
      },
    };
  } else if (!chengOk) {
    kind = "badDevelop";
    badge = e1 < e0 + 0.12 ? `承接断气 · ${passCount}/4` : `承接抢戏 · ${passCount}/4`;
    headline =
      e1 < e0 + 0.12
        ? `第 2 拍「承」仅 ${pct(e1)}，还没铺开就直接跳去转折`
        : `第 2 拍「承」冲到 ${pct(e1)}，提前把高潮力气用光了`;
    body =
      e1 < e0 + 0.12
        ? "从「起」到「承」应该从容丰满地叠出层次（春容）；现在第二拍太单薄，视线像踩空一级台阶，后面的转折也显得突兀。"
        : "第二拍负责铺陈细节、托起期待；若它比肩甚至压过第 3 拍，高潮就失了层次感。";
    hint = "把第 2 拍「承」调至 42%–58% 的中景叠山层次，稳稳接住「起」、托起「转」。";
    fixAction = {
      label: "校稳第 2 拍「承」的层次",
      apply: (s) => {
        s.energies[1] = 0.50;
        s.active = 1;
      },
    };
  } else if (pathTooStraight) {
    kind = "straightPath";
    badge = `路径僵直 · 4/4`;
    headline = "四拍力度都对，但 S 气韵丝带拉得过直，视线滑得太快";
    body =
      `四枚圆镜此刻几乎排成一根直线（弯幅仅 ${Math.round(state.curve * 100)}%）。没有曲折绕转的导引，视线一眼就滑到底，少了东方长卷「峰回路转」的呼吸感。`;
    hint = "把下方「S 丝带曲度」推到 40%–82%，让气韵线条蜿蜒串联四境。";
    fixAction = {
      label: "拉出 S 形蜿蜒气韵",
      apply: (s) => {
        s.curve = 0.62;
      },
    };
  } else if (pathTooKnot) {
    kind = "knotPath";
    badge = `路径打结 · 4/4`;
    headline = `S 丝带曲度飙到 ${Math.round(state.curve * 100)}%，弯道折返太急让视线迷路`;
    body =
      "曲线不是越弯越好。当相邻两折左右大幅来回猛折，视线在画框里频繁折返掉头，节奏从从容流转变成晕头转向。";
    hint = "把「S 丝带曲度」收回到 45%–78%，让四境既曲折灵动又顺势而下。";
    fixAction = {
      label: "理顺 S 丝带曲度",
      apply: (s) => {
        s.curve = 0.62;
      },
    };
  } else {
    // 全部达标！区分多种合法解气质
    let styleName = "经典原海报解";
    if (e2 >= 0.92 && state.curve >= 0.68) styleName = "戏剧强冲解";
    else if (e2 <= 0.82 && e1 <= 0.46) styleName = "清幽小品解";

    kind = "solved";
    badge = `四拍贯通 · ${styleName}`;
    headline = `${styleName}成立：慢起 ${pct(e0)} → 丰承 ${pct(e1)} → 骤转 ${pct(e2)} → 静合 ${pct(e3)}`;
    body =
      `入口留白 ${pct(entryAir)} 稳稳吸住第一眼，经由中景铺陈蓄势，在第 3 折骤然拉出 +${Math.round(
        turnLeap * 100
      )}% 峰差，末段回落 ${Math.round(resolveDrop * 100)}% 归于平波。慢—快—高潮—慢的完整故事呼吸已经成形。`;
    hint = "现在可以横拖画布扫演视线光珠，或切换「富春行旅 / 四格画帖」验证同一套节奏在别的题材上照样灵验。";
    fixAction = null;
  }

  // 节奏势态档位（明确标注「示意」）
  let rhythmGrade = "平缓失峰（示意）";
  if (kind === "solved") rhythmGrade = e2 >= 0.92 ? "大开大合（示意）" : e2 <= 0.82 ? "清雅舒卷（示意）" : "波澜合度（示意）";
  else if (kind === "inverted" || kind === "noisyStart") rhythmGrade = "前重后塌（示意）";
  else if (kind === "crowdedEnd") rhythmGrade = "尾满失韵（示意）";
  else if (kind === "straightPath") rhythmGrade = "直落少韵（示意）";
  else if (kind === "knotPath") rhythmGrade = "弯折过急（示意）";
  else if (kind === "flat") rhythmGrade = "匀速发木（示意）";
  else if (kind === "weakTurn") rhythmGrade = "峰势偏弱（示意）";

  return {
    layout,
    kind,
    isSolved: kind === "solved",
    passCount,
    pathOk,
    badge,
    headline,
    body,
    hint,
    fixAction,
    phaseChecks,
    tipsChecks,
    metrics: {
      entryAir: pct(entryAir),
      turnLeap: `${turnLeap >= 0 ? "+" : ""}${Math.round(turnLeap * 100)}%`,
      resolveDrop: `${resolveDrop >= 0 ? "-" : "+"}${Math.abs(Math.round(resolveDrop * 100))}%`,
      curvePct: `${Math.round(state.curve * 100)}%`,
      rhythmGrade,
    },
  };
}
