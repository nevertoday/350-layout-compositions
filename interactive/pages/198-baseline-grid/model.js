// 198 基线网格 BASELINE GRID · 单真源几何与排印诊断模型
// 画布绘制、白话诊单、右侧微调条、顶部五线解剖全部共享这一份实算坐标与结论。

export const BODY_SIZE = 14; // 正文字号参照（pt）
export const RULER_MAX = 240; // 纵尺刻度上限（pt，原海报 0..168 延伸至 240）

export const SCENES = {
  poster: {
    id: "poster",
    label: "双栏原文",
    en: "POSTER SPREAD",
    leftHead: "城市更新的思考",
    leftSub: "让空间与人重新发生连接",
    leftP1: [
      "在快速发展的城市中，空间的意义",
      "正在被重新定义。我们需要关注人",
      "的真实需求，唤醒场所活力。",
    ],
    leftBoxTitle: "原海报引文框",
    leftBoxQuote: "好的设计不只是造型的表达，更是系统与价值的结合。",
    leftCaption: "图注：左栏底注应与右栏末行齐平",
    rightHead: "城市更新的思考",
    rightSub: "让空间与人重新发生连接",
    rightP1: [
      "在快速发展的城市中，空间的意义",
      "正在被重新定义。我们需要关注人",
      "的真实需求，唤醒场所活力。",
    ],
    rightP2: [
      "好的设计不只是造型的表达，",
      "更是系统、策略与价值的结合。",
      "从微观到宏观，持续发生。",
    ],
    smallNote: "注：10pt 细小脚注若强锁 24pt 粗网格，行间会裂出大豁口。",
  },
  magazine: {
    id: "magazine",
    label: "杂志内页",
    en: "MAGAZINE INNER",
    leftHead: "Design for a",
    leftSub: "Better Future",
    leftP1: [
      "真正的设计，是让复杂变得清晰，",
      "让价值被看见。多栏长文依靠同一",
      "条看不见的基线维系阅读呼吸。",
    ],
    leftBoxTitle: "建筑摄影配图",
    leftBoxQuote: "配图底边压线，消除半行尴尬零头",
    leftCaption: "Fig. 01 — 城市展厅中庭自然光影",
    rightHead: "杂志跨栏正文",
    rightSub: "EDITORIAL TYPOGRAPHY",
    rightP1: [
      "当左右两栏正文落在同一套基线上，",
      "读者的视线跨过中缝时不必重新对",
      "焦，页面呈现出安静的出版秩序。",
    ],
    rightP2: [
      "标题与引文可以打破正文尺寸，但",
      "总占高必须凑成基线整倍，好让下",
      "方正文稳稳踩回同一节拍。",
    ],
    smallNote: "图注 10pt：摄影 / 建筑档案馆 2025 收藏编号 B-198。",
  },
  exhibition: {
    id: "exhibition",
    label: "展讯海报",
    en: "POSTER DETAIL",
    leftHead: "EXHIBITION",
    leftSub: "未来 · 城市 · 人",
    leftP1: [
      "06.05 — 06.30  CITY GALLERY",
      "主办：城市文化研究中心",
      "协办：未来设计实验室 · 城市基金",
    ],
    leftBoxTitle: "展馆主视觉裁切",
    leftBoxQuote: "斜角建筑几何立面 · 灰调单色网点",
    leftCaption: "开放时间 10:00 — 18:00（周一闭馆）",
    rightHead: "策展前言",
    rightSub: "CURATORIAL NOTE",
    rightP1: [
      "城市不仅是钢筋与道路的集合，更",
      "是日常相遇的容器。本次展览回溯",
      "近三十年公共空间的重构脉络。",
    ],
    rightP2: [
      "从街角口袋公园到旧厂房新生，每",
      "一次微更新都遵循看不见的人本尺",
      "度，让秩序为生活留出余地。",
    ],
    smallNote: "票务说明 10pt：凭预约码入场，团体导览请提前三日登记。",
  },
};

export const PARTS = {
  rightLead: {
    key: "rightLead",
    label: "右栏行距",
    short: "行距",
    min: 14,
    max: 36,
    step: 1,
    hint: "拖至与基准步长相同（1×）",
  },
  titleBlock: {
    key: "titleBlock",
    label: "标题总高",
    short: "标题",
    min: 36,
    max: 112,
    step: 1,
    hint: "凑成基线的 2× / 3× / 4× 整倍",
  },
  paraGap: {
    key: "paraGap",
    label: "段间留白",
    short: "段距",
    min: 0,
    max: 56,
    step: 1,
    hint: "设为基线的 1× 或 2× 整倍",
  },
  boxHeight: {
    key: "boxHeight",
    label: "图框高度",
    short: "图框",
    min: 36,
    max: 120,
    step: 1,
    hint: "拉到 2× / 3× / 4× 让底边压线",
  },
  grid: {
    key: "grid",
    label: "基线步长",
    short: "步长",
    min: 16,
    max: 36,
    step: 1,
    hint: "原海报建议 24pt（舒适带 20–28pt）",
  },
};

export function createBrokenState(scene = "poster") {
  return {
    scene,
    grid: 24,
    rightLead: 21,   // 错态 1：与左栏 24pt 拉链错齿
    titleBlock: 63,  // 错态 2：非 24 整倍（余 +15 / -9pt）
    paraGap: 11,     // 错态 3：非 24 整倍（余 +11pt）
    boxHeight: 61,   // 错态 4：非 24 整倍（余 +13 / -11pt）
    activePart: "rightLead",
    showLines: true,
    lockSmallNote: false,
    scanX: 0.5,
  };
}

export function createPresetState(preset = "poster24", scene = "poster") {
  if (preset === "book20") {
    return {
      scene,
      grid: 20,
      rightLead: 20,
      titleBlock: 60, // 3x
      paraGap: 20,    // 1x
      boxHeight: 60,  // 3x
      activePart: "rightLead",
      showLines: true,
      lockSmallNote: false,
      scanX: 0.5,
    };
  }
  if (preset === "airy28") {
    return {
      scene,
      grid: 28,
      rightLead: 28,
      titleBlock: 56, // 2x
      paraGap: 28,    // 1x
      boxHeight: 56,  // 2x
      activePart: "rightLead",
      showLines: true,
      lockSmallNote: false,
      scanX: 0.5,
    };
  }
  // 原海报经典 24pt 解
  return {
    scene,
    grid: 24,
    rightLead: 24,
    titleBlock: 72, // 3x
    paraGap: 24,    // 1x
    boxHeight: 72,  // 3x
    activePart: "rightLead",
    showLines: true,
    lockSmallNote: false,
    scanX: 0.5,
  };
}

// 计算某坐标 y 距离最近基线格线的有符号误差（-g/2 .. +g/2）
export function signedOffset(y, g) {
  const nearest = Math.round(y / g) * g;
  return +(y - nearest).toFixed(1);
}

export function snapMultiple(val, g, minMult = 1, maxMult = 5) {
  const m = Math.max(minMult, Math.min(maxMult, Math.round(val / g)));
  return m * g;
}

export function fmtPt(v) {
  const n = Math.round(v * 10) / 10;
  return Number.isInteger(n) ? `${n}pt` : `${n.toFixed(1)}pt`;
}

export function fmtSigned(v) {
  const n = Math.round(v * 10) / 10;
  if (Math.abs(n) < 0.05) return "0pt";
  const s = Number.isInteger(n) ? `${Math.abs(n)}` : Math.abs(n).toFixed(1);
  return `${n > 0 ? "+" : "−"}${s}pt`;
}

export function fmtMult(val, g) {
  const r = val / g;
  if (Math.abs(r - Math.round(r)) < 0.015) return `${Math.round(r)}×`;
  return `${r.toFixed(2)}×`;
}

// 根据当前状态计算双栏全部实绘行坐标（渲染与读数共用此唯一真源）
export function layoutPage(state) {
  const g = state.grid;
  const sc = SCENES[state.scene] || SCENES.poster;

  // 左栏（始终作为当前步长 g 的标准参照栏，但图框高度由用户控制）
  const leftTitleEnd = 3 * g; // 主标在 1g，副标在 2g，正文起于 3g
  const leftHeadY = 1 * g;
  const leftSubY = 2 * g;

  const leftP1 = sc.leftP1.map((text, i) => {
    const y = leftTitleEnd + i * g;
    return { text, y, err: signedOffset(y, g), col: "left", part: "grid" };
  });

  // 左栏配图 / 引文框：顶边齐第 3 行后下方 1 格线处（即 leftTitleEnd + 2*g 之后留 0.25g 视觉边距，底边应落在整倍基线上）
  // 简化且直观：插块逻辑占位从 boxTop = leftTitleEnd + 2 * g（即 5g，也就是第 3 行基线）往下延展 boxHeight，
  // 插块视觉顶边画在 boxTop + 6pt，视觉底边严格等于 boxTop + boxHeight！
  const boxTopAnchor = leftTitleEnd + 2 * g; // 5g（24pt 时 = 120pt）
  const boxBottomY = boxTopAnchor + state.boxHeight; // 24pt 时若 boxHeight=72 -> 192pt (8g)
  const boxErr = signedOffset(boxBottomY, g);

  // 图注基线落在插块底边下方 1 个基线单位（或若开启 lockSmallNote 则强锁 24pt 展示大豁口）
  const captionStep = state.lockSmallNote ? g : g;
  const captionY = boxBottomY + captionStep;
  const captionErr = signedOffset(captionY, g);

  // 右栏（用户实时调校栏）
  const rightTitleEnd = state.titleBlock;
  const rightHeadY = Math.max(16, Math.round(rightTitleEnd * 0.36));
  const rightSubY = Math.max(rightHeadY + 14, Math.round(rightTitleEnd * 0.68));
  const titleErr = signedOffset(rightTitleEnd, g);

  const rightP1 = sc.rightP1.map((text, i) => {
    const y = rightTitleEnd + i * state.rightLead;
    return { text, y, err: signedOffset(y, g), col: "right", part: i === 0 ? "titleBlock" : "rightLead" };
  });

  const lastP1Y = rightP1[rightP1.length - 1].y;
  const p2StartY = lastP1Y + state.rightLead + state.paraGap;
  const rightP2 = sc.rightP2.map((text, i) => {
    const y = p2StartY + i * state.rightLead;
    return { text, y, err: signedOffset(y, g), col: "right", part: "paraGap" };
  });

  // 若开启「小字强锁粗基线」压测：在右栏末段下排 2 行 10pt 细注，行距被迫锁成 g（24pt），行距比 2.4x 裂出豁口
  const smallNoteLines = [
    sc.smallNote.slice(0, 16),
    sc.smallNote.slice(16),
  ];
  const smallNoteLead = state.lockSmallNote ? g : Math.round(g * 0.625); // 24pt 强锁 vs 15pt 合理小字行距
  const noteStartY = rightP2[rightP2.length - 1].y + g;
  const smallNotes = smallNoteLines.map((text, i) => {
    const y = noteStartY + i * smallNoteLead;
    return { text, y, err: signedOffset(y, g), lead: smallNoteLead };
  });

  // 汇总全部需对行校验的基线
  const allRightLines = [...rightP1, ...rightP2];
  const maxRightErr = Math.max(...allRightLines.map((l) => Math.abs(l.err)));
  const maxAllErr = Math.max(maxRightErr, Math.abs(boxErr), Math.abs(captionErr));

  // 计算左栏首段与右栏首段的逐行跨栏错差（取 3 行最大）
  const crossDiffs = leftP1.map((l, i) => +(rightP1[i].y - l.y).toFixed(1));
  const maxCrossDrift = Math.max(
    ...crossDiffs.map((d) => Math.abs(signedOffset(d, g))),
    Math.abs(boxErr),
    Math.abs(signedOffset(rightP2[0].y - (leftTitleEnd + 3 * g), g))
  );

  // 动态确定画布总高度标尺上限（确保全部行都舒展在画布内不截断）
  const lowestY = Math.max(
    RULER_MAX,
    captionY + g * 0.8,
    rightP2[rightP2.length - 1].y + (state.lockSmallNote ? g * 2.5 : g * 0.9)
  );
  const rulerMax = Math.ceil(lowestY / g) * g;

  return {
    scene: sc,
    g,
    rulerMax,
    left: {
      titleEnd: leftTitleEnd,
      headY: leftHeadY,
      subY: leftSubY,
      p1: leftP1,
      boxTopAnchor,
      boxBottomY,
      boxErr,
      captionY,
      captionErr,
    },
    right: {
      titleEnd: rightTitleEnd,
      headY: rightHeadY,
      subY: rightSubY,
      titleErr,
      p1: rightP1,
      p2StartY,
      p2: rightP2,
      smallNotes,
      smallNoteLead,
    },
    metrics: {
      maxAllErr: +maxAllErr.toFixed(1),
      maxCrossDrift: +maxCrossDrift.toFixed(1),
      bodyRatio: +(g / BODY_SIZE).toFixed(2),
      leadDiff: +(state.rightLead - g).toFixed(1),
      gapErr: signedOffset(state.paraGap, g),
      titleErr,
      boxErr,
    },
  };
}

// 完整 8 类失误诊断（单真源，绝不写死）
export function evaluate(state) {
  const layout = layoutPage(state);
  const g = state.grid;
  const m = layout.metrics;

  const gridTight = g < 19;
  const gridLoose = g > 29;
  const gridOk = !gridTight && !gridLoose;

  const leadSync = Math.abs(state.rightLead - g) < 0.4;
  const leadOk = leadSync && gridOk;
  const titleOk = Math.abs(m.titleErr) < 0.4 && state.titleBlock >= g * 2 - 0.4;
  const gapOk = state.paraGap >= g - 0.4 && Math.abs(m.gapErr) < 0.4;
  const boxOk = Math.abs(m.boxErr) < 0.4 && state.boxHeight >= g * 2 - 0.4;

  const passed = [leadOk, titleOk, gapOk, boxOk].filter(Boolean).length;

  // 检查是否踩中「半倍错拍」（例如偏离刚好卡在 g/2 附近）
  const nearHalf = (err) => Math.abs(Math.abs(err) - g * 0.5) <= 1.5;
  const hasHalfStep = leadSync && gridOk && (nearHalf(m.titleErr) || nearHalf(m.gapErr) || nearHalf(m.boxErr));

  let code = "ok";
  let tone = "ok"; // "error" | "warn" | "ok"
  let badge = "4 / 4 跨栏齐平";
  let headline = "";
  let why = "";
  let action = "";

  if (gridTight) {
    code = "tight-crash";
    tone = "error";
    badge = `错态 · 撞顶挤爆 (${passed}/4)`;
    headline = `步长压到 ${g}pt，14pt 正文上下行快贴成一坨`;
    why = `当前行距比只有 ${m.bodyRatio.toFixed(2)}×（经验舒适带约 1.4×–2.0×）。汉字和西文升降部之间几乎没有呼吸白缝，读者扫完一行回跳时极易串回同一行。`;
    action = "把下方「网格步长」调回 20pt–28pt（如原海报 24pt），再同步右栏行距。";
  } else if (gridLoose) {
    code = "loose-gap";
    tone = "error";
    badge = `错态 · 步长散行 (${passed}/4)`;
    headline = `步长拉到 ${g}pt，正文散成几道互不相连的横条`;
    why = `行距比高达 ${m.bodyRatio.toFixed(2)}×，行间白缝比字身还宽一倍多。大脑不再把它们视为一个整体段落，阅读连贯性被打断。`;
    action = "把「网格步长」收回到 20pt–28pt 舒适带，让字行重新聚成稳定的灰带。";
  } else if (state.lockSmallNote) {
    code = "small-note-locked";
    tone = "warn";
    badge = `警示 · 小字豁口 (${passed}/4)`;
    headline = `10pt 脚注强锁 ${g}pt 粗基线，行距撑出 ${Math.round((g / 10) * 100)}% 豁口`;
    why = `大字正文踩 ${g}pt 很舒服，但 10pt 小字硬锁同一网格后每行之间空出大半截，像断线的电报——这就是为什么要懂得「小字块只锁首尾，或改用半格/4px 子基线」。`;
    action = "点关「压测：小字强锁」释放 10pt 脚注（只让大块底边回轨），恢复清脆排印。";
  } else if (!leadSync) {
    code = "zipper-drift";
    tone = "error";
    badge = `错态 · 拉链错齿 (${passed}/4)`;
    headline = `右栏行距 ${state.rightLead}pt ≠ 左栏 ${g}pt，往下走越偏越远`;
    why = `两栏每往下一行就累计差出 ${Math.abs(m.leadDiff)}pt。余光扫过中缝时，左右文字像拉不拢的拉链锯齿，哪怕单看一栏没毛病，摆在一起就立刻发飘。`;
    action = `选中「右栏行距」，在画布左右拖到 ${g}pt（1× 同步左栏），它会轻轻吸住。`;
  } else if (hasHalfStep) {
    code = "half-step";
    tone = "error";
    badge = `错态 · 半倍错拍 (${passed}/4)`;
    headline = `文字卡在两根基线正中间（偏 ${fmtSigned(nearHalf(m.titleErr) ? m.titleErr : nearHalf(m.gapErr) ? m.gapErr : m.boxErr)}），跨栏成锯齿`;
    why = `单看右栏自己很齐，但它正好落在了左栏两行之间的白缝里。这种「半拍错位」比乱排更具欺骗性——跨栏一对照，两栏始终差半个身位。`;
    action = `把带红框的模块再拖半格（${Math.round(g / 2)}pt）凑成 ${g}pt 的整倍数，让双栏正面合拍。`;
  } else if (!titleOk) {
    code = "title-off";
    tone = "error";
    badge = `错态 · 标题破倍 (${passed}/4)`;
    headline = `标题块总高 ${state.titleBlock}pt（${fmtMult(state.titleBlock, g)}），把整栏正文推偏了 ${fmtSigned(m.titleErr)}`;
    why = `标题字号可以大于正文，但「标题 + 副标 + 上下留白」的总高度一旦带零头，下面整栏正文从第一行起就全员浮在两根基线之间。`;
    action = `点选「标题总高」并在画布横拖至 ${snapMultiple(state.titleBlock, g, 2, 4)}pt（${Math.round(snapMultiple(state.titleBlock, g, 2, 4) / g)}× 基线整倍）。`;
  } else if (!gapOk) {
    code = "gap-off";
    tone = "error";
    badge = `错态 · 段距悬空 (${passed}/4)`;
    headline = state.paraGap < g - 0.4 && state.paraGap === 0
      ? "段间留白 0pt，两段文字粘在一起分不出起承"
      : `段间留白 ${state.paraGap}pt 不是 ${g}pt 整倍，第二段起全员脱轨`;
    why = state.paraGap === 0
      ? "没有首行缩进又把段距压到 0pt 时，段落边界消失；留出整倍 1×（空一行）既能一眼分段，又不打断基线节拍。"
      : `第一段明明对得很齐，只因段间随手塞了 ${state.paraGap}pt 零头（偏 ${fmtSigned(m.gapErr)}），从第二段第一行开始，整段又飘离了基线。`;
    action = `选中「段间留白」并拖到 ${g}pt（1× 空一行）或 ${g * 2}pt（2× 疏朗分节）。`;
  } else if (!boxOk) {
    code = "box-off";
    tone = "error";
    badge = `错态 · 图框悬空 (${passed}/4)`;
    headline = `配图/引文框高 ${state.boxHeight}pt（偏 ${fmtSigned(m.boxErr)}），底边悬在半空`;
    why = `插图或引文框高度没取基线整倍时，框底会卡在两根线之间留下半行尴尬零头，紧跟在框下的图注也顺势脱线，与右栏末行对不齐。`;
    action = `点选左栏「图框高度」并拖至 ${snapMultiple(state.boxHeight, g, 2, 4)}pt（${Math.round(snapMultiple(state.boxHeight, g, 2, 4) / g)}× 整倍），让底边严丝合缝压线。`;
  } else {
    // 全部 4/4 齐平！区分不同正当解
    code = "ok";
    tone = "ok";
    badge = "4 / 4 跨栏齐平";
    const flavor =
      g <= 21
        ? `紧凑书刊解（${g}pt · 行距比 ${m.bodyRatio.toFixed(2)}×）`
        : g >= 27
          ? `舒展画册解（${g}pt · 行距比 ${m.bodyRatio.toFixed(2)}×）`
          : `经典出版解（${g}pt · 行距比 ${m.bodyRatio.toFixed(2)}×）`;
    headline = `整页合拍：${flavor}`;
    why = `左栏正文、右栏两段正文、标题总高（${fmtMult(state.titleBlock, g)}）、段间留白（${fmtMult(state.paraGap, g)}）与左栏图框底边（${fmtMult(state.boxHeight, g)}）全部严丝合缝踩在同一套 ${g}pt 基线上，跨栏最大偏离 0pt。`;
    action = "可以试试把步长切到 20pt 或 28pt 验证其他正当解，或打开「压测：小字强锁」看它什么时候会反噬。";
  }

  const comfortLabel =
    g < 19 ? "过紧撞顶" : g > 29 ? "过疏散行" : g <= 21 ? "紧凑清晰" : g >= 27 ? "舒展松弛" : "黄金舒适";

  return {
    layout,
    passed,
    checks: { leadOk, titleOk, gapOk, boxOk, gridOk },
    code,
    tone,
    badge,
    headline,
    why,
    action,
    comfortLabel,
  };
}

// 04 节「整倍回轨计算器」单真源算法
export function calcRecovery({ grid = 24, headingLead = 32, headingLines = 2, marginTop = 18, marginBottom = 10 }) {
  const rawHeading = headingLead * headingLines;
  const total = marginTop + rawHeading + marginBottom;
  const rem = total % grid;
  const aligned = rem === 0;
  const nextMult = Math.ceil(total / grid);
  const targetTotal = nextMult * grid;
  const needAdd = aligned ? 0 : targetTotal - total;

  // 两种补齐策略：
  // 1) 亲密性优先（段前 > 段后，通常按 2:1 或全补到段前，让标题紧贴它统领的下文）
  const proximityTop = marginTop + Math.ceil(needAdd * 0.75);
  const proximityBottom = marginBottom + (needAdd - Math.ceil(needAdd * 0.75));
  // 2) 上下均分（仅做对比：若段前段后相等，标题会浮在两段正中间丧失归属感）
  const evenTop = marginTop + Math.floor(needAdd / 2);
  const evenBottom = marginBottom + (needAdd - Math.floor(needAdd / 2));

  const proximityWarning = marginBottom >= marginTop && marginTop > 0;

  return {
    grid,
    rawHeading,
    total,
    rem,
    aligned,
    mult: +(total / grid).toFixed(2),
    nextMult,
    targetTotal,
    needAdd,
    proximity: { top: proximityTop, bottom: proximityBottom },
    even: { top: evenTop, bottom: evenBottom },
    proximityWarning,
  };
}

// 06 节眼力小测数据（4 个版本只差 1 个排印变量，绝不泄露好坏）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "版本 A",
    spec: "24pt 基线 · 标题块 50pt · 正文行距 24pt · 段距 24pt",
    grid: 24,
    titleBlock: 50, // 错因：50 % 24 = +2pt，微偏但整栏错位
    rightLead: 24,
    paraGap: 24,
    correct: false,
    reason: "右栏标题行高 30pt + 段前 12pt + 段后 8pt = 50pt，比 2×（48pt）多出 2pt 零头。虽然只有 2pt，但下面整栏每一行都被往下推了 2pt，跨栏拉一条横线立刻露馅。",
  },
  {
    id: "B",
    label: "版本 B",
    spec: "24pt 基线 · 标题块 48pt · 正文行距 24pt · 段距 24pt",
    grid: 24,
    titleBlock: 48, // 2x 精准回轨
    rightLead: 24,
    paraGap: 24,
    correct: true,
    reason: "正解。右栏标题行高 28pt + 段前 14pt + 段后 6pt = 48pt（精准 2× 基线，且段前大于段后保住了归属感），正文行距 24pt（1×）、段间留白 24pt（1×），两栏从头到尾稳稳踩在同一套基线上。",
  },
  {
    id: "C",
    label: "版本 C",
    spec: "24pt 基线 · 标题块 48pt · 正文行距 24pt · 段距 16pt",
    grid: 24,
    titleBlock: 48,
    rightLead: 24,
    paraGap: 16, // 错因：第一段齐，第二段脱轨 -8pt
    correct: false,
    reason: "第一段完全齐平极具迷惑性，但段间留白设成了 16pt（非 24pt 整倍）。一换到第二段，所有行立刻整体上浮 8pt，下半栏与左栏彻底脱节。",
  },
  {
    id: "D",
    label: "版本 D",
    spec: "24pt 基线 · 标题块 48pt · 正文行距 23pt · 段距 24pt",
    grid: 24,
    titleBlock: 48,
    rightLead: 23, // 错因：每行差 1pt，滚到第 6 行差 5pt
    paraGap: 24,
    correct: false,
    reason: "前两行几乎看不出破绽，但右栏正文行距比左栏窄了 1pt（23pt vs 24pt）。随着行数往下走，误差逐行累加，到第 6 行时已经向上爬偏了 5pt。",
  },
];
