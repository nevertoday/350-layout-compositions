// 133 双栏版式 · 单真源几何与可读性核算模型
// 画布绘制、左侧四枚原海报图标探针、白话诊单与控件读数共用同一份输出。

export const INITIAL_STATE = {
  specimen: "poster", // "poster" | "article" | "compare"
  leftRatio: 0.74,    // 左栏占两栏净宽比例 (0.22..0.78)
  gutterRatio: 0.011, // 中央栏距占版芯总宽比例 (0.008..0.22)
  baselineDrift: 10,  // 右栏相对左栏基线错牙 (-14..14 px)
  entryClash: true,   // 顶部双头抢焦冲突
  ruleStyle: "dashed",// "dashed" | "none" | "heavy"
  showGuides: true,   // 显示蓝图刻度与跨栏检测弧
  flowPlaying: false, // 演播阅读路径光珠
  flowProgress: 0,    // 0..1
};

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报·图文双栏",
    en: "POSTER EDITORIAL",
    validRange: [0.34, 0.64],
    idealSplit: 0.46,
    idealGutter: 0.072,
    leftTitle: "为什么分成两栏",
    leftLead: "宽页排成一通到底的长行，眼睛读完行尾往回扫时容易串行。沿中缝把版芯拆成左右两栏，行宽立刻落回舒适区。",
    leftBody: "左栏安放文字主脉，右栏承接图形与对照模块，两者隔着清晰的蓝图栏距彼此呼应，既建立对照，又替视线指明先后顺序。",
    leftFoot: "左文右图 · 双虚线栏距引导",
    clashTag: "顶部强色抢焦块",
    rightCaptions: [
      "半调色块与正文区隔，先确立右侧视觉重心。",
      "圆角与几何图形对照，文字紧贴右侧补充说明。",
      "实心方与斜线框并置，一实一虚建立直接对照。",
    ],
  },
  article: {
    id: "article",
    label: "书刊连读·双栏专稿",
    en: "BOOK CONTINUOUS",
    validRange: [0.42, 0.58],
    idealSplit: 0.5,
    idealGutter: 0.068,
    title: "从古登堡圣经到瑞士网格",
    paragraphs: [
      "约一四五五年，古登堡在美因茨印制四十二行圣经时，将宽大的对开羊皮纸分成左右两栏，每栏排满四十二行。这并非出于装饰，而是因为整页通排会让单行过长，读者回扫下一行时极易跳行。",
      "到了二十世纪，瑞士平面设计师米勒-布罗克曼把栏间留白正式写进网格法则：中央栏距必须大于正文行距，否则左右两栏会在格式塔亲密性上彼此粘连，视线还没读完左栏就横向串进了右栏。",
      "当两栏宽度均衡、基线齐平、栏距呼吸得当时，眼睛顺着左栏自上而下读完，再轻巧地斜向抬眼接住右栏顶行，整页呈现出稳定的银灰色排印节奏。",
    ],
  },
  compare: {
    id: "compare",
    label: "左右对照·方案对比",
    en: "A / B COMPARISON",
    validRange: [0.45, 0.55],
    idealSplit: 0.5,
    idealGutter: 0.078,
    leftHead: "单栏通排",
    leftSub: "SINGLE COLUMN",
    rightHead: "双栏对照",
    rightSub: "TWO-COLUMN",
    rows: [
      { key: "行宽测度", left: "宽屏下易超 45 字，回扫距离拉长", right: "每栏 14–22 字，眼动折返更稳", lVal: 0.88, rVal: 0.46 },
      { key: "对照效率", left: "前后内容上下相隔，需要来回翻滚", right: "同类参数左右并排，横向一眼比出", lVal: 0.34, rVal: 0.92 },
      { key: "图文关系", left: "插图只能插在段间，割断长文流", right: "左文右图同屏互注，视线自然衔接", lVal: 0.52, rVal: 0.86 },
      { key: "窄屏适应", left: "手机竖屏天然贴合，无需折栏", right: "窄于 600px 必须响应式退回单栏", lVal: 0.94, rVal: 0.42 },
    ],
  },
};

export const PRESETS = {
  posterClassic: {
    label: "原海报经典解",
    kind: "good",
    patch: { specimen: "poster", leftRatio: 0.46, gutterRatio: 0.072, baselineDrift: 0, entryClash: false, ruleStyle: "dashed" },
  },
  goldenSplit: {
    label: "黄金主副解",
    kind: "good",
    patch: { leftRatio: 0.38, gutterRatio: 0.068, baselineDrift: 0, entryClash: false, ruleStyle: "dashed" },
  },
  equalSpread: {
    label: "等宽对照解",
    kind: "good",
    patch: { leftRatio: 0.50, gutterRatio: 0.074, baselineDrift: 0, entryClash: false, ruleStyle: "none" },
  },
  errCollapse: {
    label: "试错：栏距串读",
    kind: "bad",
    patch: { leftRatio: 0.50, gutterRatio: 0.011, baselineDrift: 0, entryClash: false, ruleStyle: "dashed" },
  },
  errChasm: {
    label: "试错：栏距裂谷",
    kind: "bad",
    patch: { leftRatio: 0.50, gutterRatio: 0.19, baselineDrift: 0, entryClash: false, ruleStyle: "none" },
  },
  errCrushed: {
    label: "试错：左胖右碎",
    kind: "bad",
    patch: { leftRatio: 0.76, gutterRatio: 0.065, baselineDrift: 0, entryClash: false, ruleStyle: "dashed" },
  },
  resetBroken: {
    label: "复原开场错态",
    kind: "reset",
    patch: { ...INITIAL_STATE },
  },
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 确定性中文/混排折行（单真源：画布与模型使用完全一致的每行结果）
export function wrapText(text, maxWidthPx, fontSize) {
  const lines = [];
  let line = "";
  let w = 0;
  const limit = Math.max(fontSize * 3.2, maxWidthPx);
  for (const ch of text) {
    if (ch === "\n") {
      if (line) lines.push(line);
      line = "";
      w = 0;
      continue;
    }
    const cw = ch.charCodeAt(0) > 0x2e80 ? fontSize * 1.01 : ch === " " ? fontSize * 0.34 : fontSize * 0.58;
    if (w + cw > limit && line.length > 0) {
      lines.push(line);
      line = ch;
      w = cw;
    } else {
      line += ch;
      w += cw;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function avgChars(lines) {
  if (!lines.length) return 0;
  const full = lines.length > 1 ? lines.slice(0, -1) : lines;
  const sum = full.reduce((acc, s) => acc + s.length, 0);
  return Math.round(sum / full.length);
}

// 统一计算画布几何与四项核心体检
export function evaluate(state, viewW = 740, viewH = 490) {
  const W = Math.max(300, viewW);
  const H = Math.max(240, viewH);
  const compact = W < 480;
  const padX = Math.round(W * (compact ? 0.045 : 0.055));
  const padTop = Math.round(H * (compact ? 0.11 : 0.105));
  const padBot = Math.round(H * (compact ? 0.095 : 0.088));

  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;

  const leftRatio = clamp(state.leftRatio, 0.22, 0.78);
  const gutterRatio = clamp(state.gutterRatio, 0.008, 0.22);
  const gutterPx = Math.round(innerW * gutterRatio);
  const usableW = Math.max(120, innerW - gutterPx);
  const leftW = Math.round(usableW * leftRatio);
  const rightW = Math.max(60, usableW - leftW);

  const leftX = padX;
  const gutterX = leftX + leftW;
  const rightX = gutterX + gutterPx;
  const gutterCenterX = gutterX + gutterPx / 2;

  // 正文字号与行距（按画幅等比自适应，保证手机与桌面同样真实可读）
  const fontSize = clamp(Math.round(W * (compact ? 0.032 : 0.0205)), 11, 15.5);
  const leadingPx = Math.round(fontSize * 1.68);
  const gutterToLeading = +(gutterPx / leadingPx).toFixed(2);
  const gutterPct = +(gutterRatio * 100).toFixed(1);
  const leftPct = Math.round(leftRatio * 100);
  const rightPct = 100 - leftPct;
  const driftPx = Math.round(clamp(state.baselineDrift, -14, 14));

  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

  // 真实折行核算
  let leftLines = [];
  let rightLines = [];
  let leftChars = 0;
  let rightChars = 0;

  if (state.specimen === "poster") {
    const padIn = compact ? 6 : 10;
    const textW = Math.max(48, leftW - padIn * 2);
    leftLines = [
      ...wrapText(spec.leftLead, textW, fontSize),
      "",
      ...wrapText(spec.leftBody, textW, fontSize),
    ];
    leftChars = avgChars(leftLines.filter(Boolean));
    // 右栏文字在圆形右侧大约占右栏宽 52%
    const rTextW = Math.max(42, rightW * 0.54);
    rightLines = wrapText(spec.rightCaptions[1], rTextW, fontSize * 0.92);
    rightChars = Math.max(4, Math.round(rightW / (fontSize * 1.05)));
  } else if (state.specimen === "article") {
    const padIn = compact ? 5 : 8;
    const lW = Math.max(48, leftW - padIn * 2);
    const rW = Math.max(48, rightW - padIn * 2);
    const maxLinesPerCol = Math.max(6, Math.floor((innerH - (compact ? 42 : 52)) / leadingPx));
    const allText = spec.paragraphs.join("\n");
    // 先按左栏宽填满左栏，再把剩余文字按右栏宽真实折行！
    const lAll = [];
    let consumed = 0;
    let cursor = 0;
    const chars = [...allText];
    while (cursor < chars.length && lAll.length < maxLinesPerCol) {
      let line = "";
      let w = 0;
      const limit = Math.max(fontSize * 3.2, lW);
      while (cursor < chars.length) {
        const ch = chars[cursor];
        if (ch === "\n") {
          cursor++;
          break;
        }
        const cw = ch.charCodeAt(0) > 0x2e80 ? fontSize * 1.01 : ch === " " ? fontSize * 0.34 : fontSize * 0.58;
        if (w + cw > limit && line.length > 0) break;
        line += ch;
        w += cw;
        cursor++;
      }
      lAll.push(line);
      consumed = cursor;
    }
    const restText = chars.slice(consumed).join("").replace(/^\n+/, "");
    leftLines = lAll;
    rightLines = wrapText(restText, rW, fontSize).slice(0, maxLinesPerCol);
    leftChars = avgChars(leftLines.filter(Boolean));
    rightChars = avgChars(rightLines.filter(Boolean));
  } else {
    // compare
    const padIn = compact ? 6 : 10;
    const lW = Math.max(48, leftW - padIn * 2);
    const rW = Math.max(48, rightW - padIn * 2);
    leftLines = spec.rows.flatMap((r) => wrapText(r.left, lW, fontSize * 0.94));
    rightLines = spec.rows.flatMap((r) => wrapText(r.right, rW, fontSize * 0.94));
    leftChars = avgChars(leftLines);
    rightChars = avgChars(rightLines);
  }

  // ---- 四项单真源核算（对应 133 原海报四大核心概念） ----
  const [minL, maxL] = spec.validRange;
  const minTextChars = compact ? 6 : 8;

  // 1. 分栏 COLUMN
  let colCode = "ok";
  let colTag = `${leftPct}:${rightPct} 均衡`;
  let colOk = true;
  if (leftRatio > maxL) {
    colOk = false;
    colCode = state.specimen === "compare" ? "col_compare_unequal" : "col_left_fat";
    colTag = state.specimen === "compare" ? `失衡 ${leftPct}:${rightPct}` : `左胖 ${leftPct}:${rightPct}`;
  } else if (leftRatio < minL) {
    colOk = false;
    colCode = state.specimen === "compare" ? "col_compare_unequal" : "col_right_fat";
    colTag = state.specimen === "compare" ? `失衡 ${leftPct}:${rightPct}` : `右胖 ${leftPct}:${rightPct}`;
  } else if (leftChars > 0 && leftChars < minTextChars) {
    colOk = false;
    colCode = "col_jagged";
    colTag = `左栏碎 ${leftChars}字`;
  } else if (state.specimen !== "poster" && rightChars > 0 && rightChars < minTextChars) {
    colOk = false;
    colCode = "col_jagged";
    colTag = `右栏碎 ${rightChars}字`;
  }

  // 2. 栏距 GUTTER
  let gutCode = "ok";
  let gutTag = `${gutterPx}px · ${gutterToLeading.toFixed(1)}×`;
  let gutOk = true;
  if (gutterToLeading < 0.95) {
    gutOk = false;
    gutCode = "gutter_collapse";
    gutTag = `串读 ${gutterToLeading.toFixed(2)}×`;
  } else if (gutterToLeading > 3.6 || gutterRatio > 0.145) {
    gutOk = false;
    gutCode = "gutter_chasm";
    gutTag = `裂谷 ${gutterPct}%`;
  } else if (state.ruleStyle === "heavy") {
    gutOk = false;
    gutCode = "rule_wall";
    gutTag = "粗栏线硬劈";
  }

  // 3. 对照 COMPARISON
  let cmpCode = "ok";
  let cmpTag = "基线齐平";
  let cmpOk = true;
  if (Math.abs(driftPx) > 2) {
    cmpOk = false;
    cmpCode = "baseline_drift";
    cmpTag = `错牙 ${driftPx > 0 ? "+" : ""}${driftPx}px`;
  } else if (state.ruleStyle === "heavy") {
    cmpOk = false;
    cmpCode = "rule_wall";
    cmpTag = "硬线断联";
  } else if (!colOk) {
    cmpOk = false;
    cmpCode = colCode;
    cmpTag = "权重失衡";
  }

  // 4. 阅读路径 READING PATH
  let pathCode = "ok";
  let pathTag = state.specimen === "article" ? "N形顺流" : state.specimen === "compare" ? "横向对照" : "先左后右";
  let pathOk = true;
  if (state.entryClash) {
    pathOk = false;
    pathCode = "entry_clash";
    pathTag = "双头抢焦";
  } else if (gutCode === "gutter_collapse") {
    pathOk = false;
    pathCode = "path_bleed";
    pathTag = "跨栏跳行";
  } else if (state.ruleStyle === "heavy") {
    pathOk = false;
    pathCode = "rule_wall";
    pathTag = "路径受阻";
  }

  const probes = {
    column: { ok: colOk, code: colCode, tag: colTag },
    gutter: { ok: gutOk, code: gutCode, tag: gutTag },
    comparison: { ok: cmpOk, code: cmpCode, tag: cmpTag },
    path: { ok: pathOk, code: pathCode, tag: pathTag },
  };

  const score = [colOk, gutOk, cmpOk, pathOk].filter(Boolean).length;

  // ---- 单真源白话诊断（讲清「为什么」与下一步怎么改） ----
  let diagnosis;
  if (gutCode === "gutter_collapse") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 跨栏串读`,
      title: `中央栏距仅 ${gutterPx}px（行距的 ${gutterToLeading.toFixed(2)} 倍），眼睛会直接串进右栏`,
      why: `当前正文行距 ${leadingPx}px，两栏间隙比上下行距还窄。按格式塔亲密性原则，大脑把横向更近的两行当成同一句，视线读到左栏行尾会顺势跨过中缝串读右栏。`,
      hint: `拖动画布中央双虚线栏距边轨，或把「中央栏距」拉到行距的 1.1–3.0 倍（≥ ${Math.ceil(leadingPx * 1.1)}px）。`,
      fixLabel: `把栏距拉开到 ${Math.round(innerW * spec.idealGutter)}px`,
      fixPatch: { gutterRatio: spec.idealGutter },
    };
  } else if (!colOk && colCode === "col_left_fat") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 左胖右碎`,
      title: `左右栏宽 ${leftPct}% : ${rightPct}%，左栏偏胖把右栏挤成窄条`,
      why: `双栏不是「主屏加一条边角料」。左栏占到 ${leftPct}%（约 ${leftChars} 字/行）后，右栏仅剩 ${rightPct}% 净宽，图形与辅助信息被压扁，两侧无法形成势均力敌的对照关系。`,
      hint: `直接向左拖动中央双虚线走廊，把左右配比调到 ${Math.round(minL * 100)}%–${Math.round(maxL * 100)}% 区间。`,
      fixLabel: `归位到 ${Math.round(spec.idealSplit * 100)} : ${100 - Math.round(spec.idealSplit * 100)} 配比`,
      fixPatch: { leftRatio: spec.idealSplit },
    };
  } else if (!colOk && colCode === "col_right_fat") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 左栏挤碎`,
      title: `左右栏宽 ${leftPct}% : ${rightPct}%，左栏被挤得只剩约 ${leftChars} 字/行`,
      why: `文字栏过窄时，完整词组会被频繁切碎换行，右缘拉出剧烈锯齿，眼睛像打字机一样来回折腾，阅读效率反而比单栏更低。`,
      hint: `向右拖动中央双虚线走廊，还给左栏舒适的阅读宽度。`,
      fixLabel: `归位到 ${Math.round(spec.idealSplit * 100)} : ${100 - Math.round(spec.idealSplit * 100)} 配比`,
      fixPatch: { leftRatio: spec.idealSplit },
    };
  } else if (!colOk && colCode === "col_compare_unequal") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 对照失权`,
      title: `对照标本栏宽 ${leftPct}% : ${rightPct}%，两栏视觉分量不对等`,
      why: `左右对照型双栏（甲/乙方案、新/旧对比）的核心是公平并置。一旦一侧明显更宽，读者会潜意识把窄栏当成附注，同行折行数也不一致，横向速览立刻受阻。`,
      hint: `拖动中央双虚线至接近 50 : 50（45%–55%），让两栏获得同等比重。`,
      fixLabel: "调回 50 : 50 等宽对照",
      fixPatch: { leftRatio: 0.5 },
    };
  } else if (!colOk && colCode === "col_jagged") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 碎栏锯齿`,
      title: `文字栏平均不足 ${minTextChars} 字/行，句子被切得支离破碎`,
      why: `栏距过宽或分栏失衡吞掉了文字净宽，眼睛每读三五个字就被迫换行回扫，思考节奏被不断打断。`,
      hint: `适当收窄栏距或拉平左右栏宽，让文字栏保有足够字宽。`,
      fixLabel: "恢复均衡栏宽与栏距",
      fixPatch: { leftRatio: spec.idealSplit, gutterRatio: spec.idealGutter },
    };
  } else if (pathCode === "entry_clash") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 双头抢焦`,
      title: "左右两栏顶部同时抛出强色块，视线找不到第一落脚点",
      why: `双栏要「引导阅读」，必须先分清主次入口。现在左栏顶部多出一块与右栏同量级的琥珀强色块，眼睛刚进版面就在左右之间反复横跳，阅读路径断在起跑线。`,
      hint: "直接点击画布左上标红的「顶部强色抢焦块」将其撤掉，或点击下方一键纠偏。",
      fixLabel: "撤掉抢焦块，确立左起入口",
      fixPatch: { entryClash: false },
    };
  } else if (cmpCode === "baseline_drift") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 基线错牙`,
      title: `右栏比左栏垂直错开 ${driftPx > 0 ? "+" : ""}${driftPx}px，跨栏水平线上下跳动`,
      why: `人在浏览双栏时，眼睛会下意识拿左右两栏的文字底线当参照尺。错开 ${Math.abs(driftPx)}px 虽不算巨大，却足以让整个版面显得像两张没对齐的贴纸，横向对照非常吃力。`,
      hint: "点击画布里的基线错牙标尺，或把「基线对齐偏移」拉回 0px。",
      fixLabel: "一键锁定跨栏基线（0px）",
      fixPatch: { baselineDrift: 0 },
    };
  } else if (gutCode === "gutter_chasm") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 栏距裂谷`,
      title: `中央栏距撑宽到 ${gutterPx}px（占版宽 ${gutterPct}%，行距的 ${gutterToLeading.toFixed(1)} 倍）`,
      why: `栏距过宽同样致命：中间留出一道白色（此处深蓝）大裂谷后，左右两栏被彻底割裂成两张孤立页面，图文呼应与横向对照关系瞬间瓦解，同时白白挤压了两栏正文宽度。`,
      hint: `收紧中央栏距至版宽的 5%–12%（行距的 1.1–3.2 倍），让两栏既分明又成对。`,
      fixLabel: `收紧栏距至 ${Math.round(innerW * spec.idealGutter)}px`,
      fixPatch: { gutterRatio: spec.idealGutter },
    };
  } else if (gutCode === "rule_wall") {
    diagnosis = {
      level: "error",
      badge: `${score}/4 · 粗线劈断`,
      title: "粗实栏线像一堵硬墙把版面生硬劈成两半",
      why: `双栏的界线本来靠留白栏距本身就足够清晰。用高对比粗实线填满中缝，会强行截断左文右图的跨栏视线联系，让版面变得沉重呆板。`,
      hint: "把中缝栏线切回「细蓝虚线」或「纯留白无栏线」。",
      fixLabel: "改用原海报细蓝虚线",
      fixPatch: { ruleStyle: "dashed" },
    };
  } else {
    const modeNote =
      Math.abs(leftRatio - 0.5) <= 0.03
        ? "等宽对称双栏，左右分量均等"
        : leftRatio < 0.45
          ? "左窄右宽主副双栏，右侧图版主导"
          : "左文右图经典配比，叙事与图示呼应";
    diagnosis = {
      level: "ok",
      badge: "4/4 · 双栏成立",
      title: `${modeNote}（${leftPct}:${rightPct} · 栏距 ${gutterToLeading.toFixed(1)}× 行距）`,
      why: `栏距 ${gutterPx}px 明显宽过行距 ${leadingPx}px，彻底封死跨栏串读；跨栏基线锁定 0px，左右视觉权重各安其位，视线沿清晰路径从左栏顺滑过渡到右栏。`,
      hint: "试着切换上方另外两套标本，或点击「演播视线」看阅读光珠如何穿过两栏；也可以故意把栏距推窄或推宽验证双向失误。",
      fixLabel: "",
      fixPatch: null,
    };
  }

  // 视线扫描评价档位（避免假精确，只给语义档位 + 示意）
  const bleedRisk =
    gutCode === "gutter_collapse"
      ? "高·极易串栏（示意）"
      : gutCode === "gutter_chasm"
        ? "断联·过疏（示意）"
        : gutCode === "rule_wall"
          ? "受阻·硬线隔断（示意）"
          : "稳·清晰分栏（示意）";

  return {
    W,
    H,
    compact,
    padX,
    padTop,
    padBot,
    innerW,
    innerH,
    leftX,
    leftW,
    gutterX,
    gutterPx,
    gutterCenterX,
    rightX,
    rightW,
    fontSize,
    leadingPx,
    gutterToLeading,
    gutterPct,
    leftPct,
    rightPct,
    driftPx,
    leftLines,
    rightLines,
    leftChars,
    rightChars,
    probes,
    score,
    diagnosis,
    bleedRisk,
  };
}
