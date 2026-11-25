// 单一真源：开场活体画廊策展墙的全部状态、几何面积核算与诊断规则。
// 任何读数、四栏原则灯、白话展签诊单、比例尺提示都只读这份核算结果。

export const SWEET_RATIO_MIN = 4.2; // 经验舒适带下限：低于 4.2× 易退化为卡片网格
export const SWEET_RATIO_MAX = 14.5; // 经验舒适带上限：高于 14.5× 缩略图易过小失明
export const MIN_THUMB_PX = 36; // 触控与扫视下限（经验值）
export const SNAP_SCALE = 0.64; // 原海报黄金比例位

export const INITIAL_STATE = {
  active: 0, // 当前展品 0..7
  scale: 0.14, // 0..1 横向比例尺：开场刻意落在一侧平权错态
  preview: "truncate", // "truncate" | "dots" | "grid4x2" | "strip"
  sync: false, // false = 脱节无标，true = 珊瑚焦框联动
  mood: "clash", // "clash" | "washed" | "plum" | "stone"
};

export const PRESET_SOLVED = {
  active: 0,
  scale: SNAP_SCALE,
  preview: "grid4x2",
  sync: true,
  mood: "plum",
};

export const PREVIEW_MODES = [
  { id: "truncate", label: "隐蔽截断", short: "截断4格" },
  { id: "dots", label: "仅圆点盲翻", short: "圆点盲翻" },
  { id: "grid4x2", label: "4×2 全览", short: "4×2全览" },
  { id: "strip", label: "余量胶片带", short: "余量胶带" },
];

export const MOOD_MODES = [
  { id: "clash", label: "杂色无框", short: "杂色无框" },
  { id: "washed", label: "惨白融边", short: "惨白融边" },
  { id: "plum", label: "深梅卡纸", short: "深梅卡纸" },
  { id: "stone", label: "暖石细框", short: "暖石细框" },
];

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 根据真实展墙宽高（CSS 像素）和当前 state，算出主图和单枚缩略图的精确像素尺寸与面积比
export function computeGeometry(state, wallW = 780, wallH = 520) {
  const s = clamp(state.scale, 0, 1);
  const w = Math.max(240, wallW);
  const h = Math.max(220, wallH);

  // 中缝横向比例尺把展墙纵向分成「主画区」与「缩略区」
  // s=0 -> 主画高度占比 30%；s=1 -> 主画高度占比 86%
  const heroHeightFrac = 0.30 + s * 0.56;
  const railH = 42;
  const availH = Math.max(170, h - railH);

  const heroBoxH = Math.round(availH * heroHeightFrac);
  const trayBoxH = Math.max(26, availH - heroBoxH);

  // 主视觉区允许的画框尺寸（在主画区内居中、随 scale 同时适度舒展横向存在感）
  const heroMaxW = w * (0.44 + s * 0.54);
  const heroW = Math.round(Math.min(heroMaxW, heroBoxH * 1.55));
  const heroH = Math.round(Math.min(heroBoxH, heroW * 0.95));

  // 卡纸厚度（px）：错态无卡纸 0px，达标态有呼吸留白
  const matPx = state.mood === "plum" ? Math.round(clamp(w * 0.022, 8, 18)) : state.mood === "stone" ? Math.round(clamp(w * 0.018, 7, 14)) : 0;
  const gapPx = state.mood === "clash" ? 2 : state.mood === "washed" ? 3 : Math.round(clamp(w * 0.014, 6, 12));

  // 单枚缩略图的真实显示尺寸（与 CSS Grid / Strip 列宽 1:1 对应），随 preview 模式与 trayBoxH 联动
  let cols = 4;
  let rows = 2;
  let visibleThumbs = 8;
  let hiddenCount = 0;

  if (state.preview === "truncate") {
    cols = 4;
    rows = 1;
    visibleThumbs = 4;
    hiddenCount = 4;
  } else if (state.preview === "dots") {
    cols = 8;
    rows = 1;
    visibleThumbs = 0;
    hiddenCount = 8;
  } else if (state.preview === "strip") {
    cols = 4.4;
    rows = 1;
    visibleThumbs = 5;
    hiddenCount = 3; // 有明确 +3 与渐隐提示
  } else {
    cols = 4;
    rows = 2;
    visibleThumbs = 8;
    hiddenCount = 0;
  }

  let thumbW = 0;
  let thumbH = 0;
  if (state.preview === "dots") {
    thumbW = 10;
    thumbH = 10;
  } else {
    const cellW = (w - gapPx * (Math.ceil(cols) - 1)) / cols;
    const cellH = (trayBoxH - gapPx * (rows - 1)) / rows;
    const singleRowCap = rows === 1 ? Math.round(h * 0.34) : cellH;
    thumbH = Math.max(16, Math.round(Math.min(cellH, cellW * 0.92, singleRowCap)));
    thumbW = Math.round(cellW);
  }

  const heroArea = Math.max(1, heroW * heroH);
  const thumbArea = Math.max(1, thumbW * thumbH);
  const areaRatio = state.preview === "dots" ? 0 : +(heroArea / thumbArea).toFixed(1);
  const heroSharePct = Math.round(heroHeightFrac * 100);
  const thumbMinSide = Math.min(thumbW, thumbH);

  return {
    heroBoxH,
    trayBoxH,
    heroW,
    heroH,
    thumbW,
    thumbH,
    thumbMinSide,
    matPx,
    gapPx,
    cols,
    rows,
    visibleThumbs,
    hiddenCount,
    areaRatio,
    heroSharePct,
  };
}

// 核心诊断引擎：四项原则逐一判定，并给出最高优先级的白话因果诊单
export function evaluate(state, wallW = 780, wallH = 520) {
  const g = computeGeometry(state, wallW, wallH);

  // 1. 预览 PREVIEW：不能盲翻，也不能悄悄截断
  const previewOk = state.preview === "grid4x2" || state.preview === "strip";
  const previewTag =
    state.preview === "dots"
      ? "圆点盲翻"
      : state.preview === "truncate"
      ? "暗藏 4 幅"
      : state.preview === "strip"
      ? "余量明示"
      : "8 幅全览";

  // 2. 浏览 BROWSE：必须有缩略画面且能与主视觉高亮联动
  const browseOk = state.sync && state.preview !== "dots";
  const browseTag =
    state.preview === "dots"
      ? "无图可扫"
      : !state.sync
      ? "选中脱节"
      : `0${state.active + 1}/08 联动`;

  // 3. 选择 SELECT：主次面积比落入经验舒适带且单枚缩略图足够可辨/可点
  const ratioTooLow = state.preview !== "dots" && g.areaRatio < SWEET_RATIO_MIN;
  const ratioTooHigh = state.preview !== "dots" && (g.areaRatio > SWEET_RATIO_MAX || g.thumbMinSide < MIN_THUMB_PX);
  const selectOk = state.preview !== "dots" && !ratioTooLow && !ratioTooHigh;
  const selectTag =
    state.preview === "dots"
      ? "失去参照"
      : ratioTooLow
      ? `平权 ${g.areaRatio}×`
      : ratioTooHigh
      ? `吞噬 ${g.areaRatio}×`
      : `聚焦 ${g.areaRatio}×`;

  // 4. 氛围 MOOD：统一色温 + 有卡纸气口
  const moodOk = state.mood === "plum" || state.mood === "stone";
  const moodTag =
    state.mood === "clash"
      ? "杂色贴撞"
      : state.mood === "washed"
      ? "白墙融边"
      : state.mood === "stone"
      ? "暖石统一"
      : "深梅卡纸";

  const pillars = {
    preview: { ok: previewOk, tag: previewTag },
    browse: { ok: browseOk, tag: browseTag },
    select: { ok: selectOk, tag: selectTag },
    mood: { ok: moodOk, tag: moodTag },
  };

  const passed = [previewOk, browseOk, selectOk, moodOk].filter(Boolean).length;

  // 白话诊单：每次直指最影响观看的一处问题，并说明「为什么人眼会受挫」
  let badge = `${passed} / 4 待校准`;
  let severity = passed === 4 ? "pass" : passed === 0 ? "error" : "partial";
  let headline = "";
  let body = "";
  let hint = "";

  if (passed === 4) {
    badge = "4 / 4 画廊成立";
    headline = `主画约为单枚缩略图 ${g.areaRatio} 倍，全览与聚焦同时到位`;
    body =
      state.preview === "strip"
        ? `展墙以 ${g.heroSharePct}% 高度托住主角，下方胶片带露出局部并标清剩余张数，珊瑚框实时锚定第 0${state.active + 1} 幅；统一卡纸与墙面色温稳住了整面展墙的情绪。`
        : `展墙以 ${g.heroSharePct}% 高度托住主角，下方 4×2 缩略阵一次交代全部 8 幅馆藏，珊瑚框实时锚定第 0${state.active + 1} 幅；${g.matPx}px 卡纸留白让邻画互不干扰。`;
    hint = "可点缩略图或按 ← → 键逛完整墙，点主画「灯箱精看」细看，或把比例尺继续往右拖试试「主画吞噬」错态。";
  } else if (state.preview === "dots") {
    headline = "只留圆点，观众只能盲点猜下一张";
    body = "圆点只告诉你「一共 8 张」，却隐藏了每张画的内容。想找某一幅特定细节时，观众被迫从头一路点下去，画廊退化成了盲翻轮播。";
    hint = "把「预览形式」切到「4×2 全览」或「余量胶片带」，让缩略画面回到墙上。";
  } else if (ratioTooHigh) {
    headline = `主画占到 ${g.heroSharePct}%，缩略图被压成 ${g.thumbMinSide}px 窄片`;
    body = `此时主图与单枚缩略图面积比冲到 ${g.areaRatio}×（超过 ${SWEET_RATIO_MAX}× 经验上限），缩略图既辨不清构图又难用手指点准，预览区名存实亡。`;
    hint = `把展墙顶沿的「主次比例尺」往左拉回舒适带（${SWEET_RATIO_MIN}×–${SWEET_RATIO_MAX}×），给缩略图留出可辨识尺寸。`;
  } else if (ratioTooLow) {
    headline =
      g.areaRatio < 1
        ? `主画只剩单枚缩略图的 ${g.areaRatio} 倍，主次彻底倒置`
        : `主画仅为单枚缩略图的 ${g.areaRatio} 倍，退化成了平权网格`;
    body = `当前主图只占展墙 ${g.heroSharePct}% 高度，和下方缩略图体量过于接近（低于 ${SWEET_RATIO_MIN}× 经验门槛）。视线进来后分不出谁是当前展品，失去画廊的聚焦锚点。`;
    hint = `向右拖动展墙顶沿的「主次比例尺」，把主画拉大到舒适带（${SWEET_RATIO_MIN}×–${SWEET_RATIO_MAX}×）。`;
  } else if (!previewOk) {
    headline = "只露出 4 幅缩略图，后 4 幅馆藏被悄悄切掉了";
    body = "边缘齐平截断、没有任何余量提示时，观众会直觉以为全馆只有眼前这 4 张。电商和作品集里，尺寸图与细节图往往就这样被直接漏掉。";
    hint = "把「预览形式」切到「4×2 全览」摊开全部 8 幅，或切「余量胶片带」标出剩余数量。";
  } else if (!browseOk) {
    headline = "大画换了，下方缩略图却没有高亮回应";
    body = "缺少清晰的选中框时，观众切过两张就会迷路：记不清当前放大的究竟是第几幅，也不知道哪几幅还没看过。";
    hint = "打开「选中联动：珊瑚焦框」，让当前作品在缩略阵中一眼可见。";
  } else if (state.mood === "washed") {
    headline = "惨白墙面吞掉浅色画边，整墙发虚无层次";
    body = "纯白墙底叠加 0px 零卡纸时，浅米色画面边缘直接溶进背景，画框边界消失，反而产生刺眼眩光。";
    hint = "把「展墙氛围」切到「深梅卡纸」或「暖石细框」，用墙面反差和卡纸留白托出画心。";
  } else {
    headline = "杂色互撞且 0px 贴死，画廊变成了广告贴纸墙";
    body = "8 幅画各自顶着高饱和冲突底色，又撤掉暖米卡纸和挂画缝隙，相邻画面彼此抢戏，观众很难静下来细看单幅主画。";
    hint = "把「展墙氛围」切到「深梅卡纸」或「暖石细框」，统一色温并恢复卡纸气口。";
  }

  return {
    g,
    pillars,
    passed,
    severity,
    badge,
    headline,
    body,
    hint,
  };
}
