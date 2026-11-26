// 218 直排中西文转向 · 单真源状态与几何核算模型
// 画布绘制、诊单文案、四枚原则探针全部读取同一份 computeGeometry + auditState 结果。

export const SPECIMENS = {
  poster: {
    id: "poster",
    label: "原海报四列",
    sub: "POSTER SPECIMEN",
    col1: "探索排版的秩序与美学",
    col2: "Design is thinking made visual.",
    numLong: "2025",
    numShort: "90",
    numSuffix: "%",
    puncts: ["、", "。", "•", ":", ";", "(", ")", "「", "」"],
    colTitles: [
      ["中文", "直排"],
      ["西文", "转向"],
      ["数字", "转向"],
      ["标点", "居中"],
    ],
  },
  ticket: {
    id: "ticket",
    label: "展讯票签",
    sub: "EXHIBITION PASS",
    col1: "东亚活字秋季特展",
    col2: "East Asian Type Archive",
    numLong: "2025",
    numShort: "24",
    numSuffix: "日",
    puncts: ["「", "」", "(", ")", "、", "。", "：", "—"],
    colTitles: [
      ["展题", "直排"],
      ["英文", "转向"],
      ["展期", "数字"],
      ["竖排", "标点"],
    ],
  },
  book: {
    id: "book",
    label: "书籍内页",
    sub: "EDITORIAL FOLIO",
    col1: "直排书页的欧文韵律",
    col2: "CSS Writing Modes L3",
    numLong: "2019",
    numShort: "90",
    numSuffix: "°",
    puncts: ["「", "」", "、", "。", "；", "(", ")", "—"],
    colTitles: [
      ["正文", "直排"],
      ["术语", "转向"],
      ["纪年", "数值"],
      ["全角", "标点"],
    ],
  },
};

export const NUMERAL_MODES = {
  upright: { id: "upright", label: "直立叠排", short: "直立叠排" },
  cw90: { id: "cw90", label: "顺时针 90°", short: "顺转 90°" },
  tcy: { id: "tcy", label: "长数顺转·短数纵中横", short: "纵中横混用" },
  ccw90: { id: "ccw90", label: "逆时针 -90°", short: "逆转 -90°" },
};

export const PUNCT_MODES = {
  raw: { id: "raw", label: "横排原形未转", short: "原形未转" },
  center: { id: "center", label: "居中转形（港台/海报）", short: "居中转形" },
  topright: { id: "topright", label: "右上转形（大陆/日文）", short: "右上转形" },
};

// 开场刻意停在 0/4 复合错态：逆时针逆流 + 数字直立叠排 + 标点横形未转 + 基线偏左 + 西文过重
export const INITIAL_STATE = {
  specimen: "poster",
  latinAngle: -90,
  numeralMode: "upright",
  punctMode: "raw",
  baselineShift: -9,
  latinScale: 1.24,
  highlightProbe: null, // null | "flow" | "rotation" | "rhythm" | "hierarchy"
  flowPlaying: false,
  flowPhase: 0,
};

// 多组合法解（全部通过 4/4）
export const SOLUTIONS = {
  classic: {
    id: "classic",
    label: "原海报经典解",
    patch: { latinAngle: 90, numeralMode: "cw90", punctMode: "center", baselineShift: 0, latinScale: 0.94 },
  },
  publish: {
    id: "publish",
    label: "出版纵中横解",
    patch: { latinAngle: 90, numeralMode: "tcy", punctMode: "topright", baselineShift: 0, latinScale: 0.92 },
  },
  compact: {
    id: "compact",
    label: "港台精排解",
    patch: { latinAngle: 90, numeralMode: "tcy", punctMode: "center", baselineShift: 1, latinScale: 0.88 },
  },
};

// 反向试错标本（展示不同维度的真实翻车）
export const FAULTS = {
  ccw: {
    id: "ccw",
    label: "试错：逆转 -90°",
    patch: { latinAngle: -90, numeralMode: "ccw90", punctMode: "center", baselineShift: 0, latinScale: 0.94 },
  },
  stack: {
    id: "stack",
    label: "试错：硬直立栈",
    patch: { latinAngle: 0, numeralMode: "upright", punctMode: "center", baselineShift: 0, latinScale: 0.94 },
  },
  punct: {
    id: "punct",
    label: "试错：标点未转",
    patch: { latinAngle: 90, numeralMode: "cw90", punctMode: "raw", baselineShift: 0, latinScale: 0.94 },
  },
  axis: {
    id: "axis",
    label: "试错：偏轴撞缝",
    patch: { latinAngle: 90, numeralMode: "cw90", punctMode: "center", baselineShift: 10, latinScale: 1.28 },
  },
};

export function normalizeAngle(deg) {
  let a = ((deg + 180) % 360 + 360) % 360 - 180;
  if (a === -180) a = 180;
  return Math.round(a);
}

export function snapAngle(deg, threshold = 5) {
  const a = normalizeAngle(deg);
  for (const target of [90, 0, -90, 180]) {
    if (Math.abs(a - target) <= threshold) return target;
  }
  return a;
}

// 计算画布上所有元素的单一真实几何坐标（所有渲染与诊单数值共享此输出）
export function computeGeometry(state, w, h) {
  const compact = h > w * 0.92;
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;

  // 左侧朱红分度盘区域 + 右侧四列校样区域（宽屏/横屏左右排，窄竖屏上下微错保持四列饱满清晰）
  const padX = compact ? 14 : Math.round(w * 0.032);
  const padY = compact ? 14 : Math.round(h * 0.045);

  let dial, galley;
  if (compact) {
    // 390 窄屏：上方 61% 四列饱满直排样张，下方完整朱红分度盘 + 操作指引
    const galleyH = Math.round(h * 0.61);
    galley = {
      x: padX + 18,
      y: padY,
      w: w - padX * 2 - 22,
      h: galleyH,
    };
    const dialR = Math.min(Math.round((h - galleyH - padY * 2) * 0.34), Math.round(w * 0.13), 40);
    dial = {
      cx: padX + dialR + 30,
      cy: h - padY - dialR - 8,
      r: dialR,
    };
  } else {
    const shortH = h < 340;
    const leftW = Math.round(w * 0.32);
    const dialR = Math.min(Math.round(leftW * 0.32), Math.round(h * (shortH ? 0.24 : 0.235)), 104);
    dial = {
      cx: Math.round(padX + Math.max(dialR * 1.48 + 20, leftW * 0.50)),
      cy: Math.round(h * (shortH ? 0.50 : 0.54)),
      r: dialR,
    };
    const galleyX = Math.max(padX + leftW + 14, dial.cx + dialR * 1.48 + 30);
    galley = {
      x: galleyX,
      y: padY,
      w: Math.max(200, w - galleyX - padX),
      h: h - padY * 2,
    };
  }

  const shortH = !compact && h < 340;
  const headerH = compact ? 52 : shortH ? 50 : 68;
  const bodyTop = galley.y + headerH + (compact ? 6 : shortH ? 6 : 10);
  const bodyBottom = galley.y + galley.h - (compact ? 8 : shortH ? 10 : 18);
  const pillReserve = 28;
  const contentBottom = bodyBottom - pillReserve;
  const bodyH = Math.max(96, contentBottom - bodyTop);
  const colW = galley.w / 4;

  const cols = [0, 1, 2, 3].map((i) => ({
    index: i,
    x: galley.x + i * colW,
    cx: galley.x + (i + 0.5) * colW,
    w: colW,
    top: bodyTop,
    bottom: contentBottom,
    pillY: bodyBottom - 11,
    h: bodyH,
    title: spec.colTitles[i],
  }));

  // CJK 字号与字框（严格约束在 [bodyTop, contentBottom] 内不碰列头与底签）
  const cjkLen = spec.col1.length;
  const cjkEm = Math.min(colW * 0.52, (bodyH * 0.88) / Math.max(1, cjkLen), compact ? 20 : shortH ? 17 : 28);
  const cjkStep = bodyH / Math.max(1, cjkLen);

  // 西文真实视觉尺寸与旋转包围盒核算（按可用高度合理封顶，防止长句冲出上下边界）
  const rawLatinPx = cjkEm * 0.78 * state.latinScale;
  const maxFitPx = (bodyH - 12) / Math.max(1, spec.col2.length * 0.56);
  const latinBasePx = Math.min(rawLatinPx, maxFitPx * Math.min(1.06, Math.max(0.82, state.latinScale / 1.15)));
  const angleRad = (state.latinAngle * Math.PI) / 180;
  const isStacked = Math.abs(state.latinAngle) <= 10;
  const estStrLen = Math.min(bodyH - 10, spec.col2.length * latinBasePx * 0.54);
  const lineThick = latinBasePx * 1.18;

  let latinBoxW, latinBoxH;
  if (isStacked) {
    latinBoxW = latinBasePx * 0.95;
    latinBoxH = Math.min(bodyH * 1.35, spec.col2.replace(/\s+/g, "").length * latinBasePx * 0.96);
  } else {
    const absCos = Math.abs(Math.cos(angleRad));
    const absSin = Math.abs(Math.sin(angleRad));
    latinBoxW = estStrLen * absCos + lineThick * absSin;
    latinBoxH = estStrLen * absSin + lineThick * absCos;
  }

  // 将逻辑基线偏距（-12..+12）按比例映射到当前列宽，确保宽窄屏一致
  const shiftScale = colW / 120;
  const shiftPx = state.baselineShift * shiftScale;
  const latinCenterX = cols[1].cx + shiftPx;
  const leftEdge = latinCenterX - latinBoxW / 2;
  const rightEdge = latinCenterX + latinBoxW / 2;
  const gutterLeftGap = leftEdge - cols[1].x;
  const gutterRightGap = cols[1].x + cols[1].w - rightEdge;
  const minGutterGap = Math.round(Math.min(gutterLeftGap, gutterRightGap));

  // 判断西文阅读向量在竖直方向（向下为正）的投影
  // angle = +90° -> sin(+90°) = +1 (完全顺流向下)
  // angle = -90° -> sin(-90°) = -1 (完全逆流向上)
  // angle = 0°   -> 逐字直立（英文词形拆散）
  const flowProjection = isStacked ? 0 : Math.sin(angleRad);

  return {
    w,
    h,
    compact,
    spec,
    dial,
    galley,
    headerH,
    bodyTop,
    bodyBottom,
    contentBottom,
    bodyH,
    shortH,
    colW,
    cols,
    cjkEm,
    cjkStep,
    latinBasePx,
    latinBoxW,
    latinBoxH,
    latinCenterX,
    shiftPx,
    isStacked,
    minGutterGap,
    flowProjection,
    overflowsHeight: isStacked && latinBoxH > bodyH * 1.02,
  };
}

// 单真源诊断：完全从 state 与 geom 推导 4 项规则与 8 类双向错态
export function auditState(state, geom) {
  const a = normalizeAngle(state.latinAngle);
  const absErrFromCw90 = Math.abs(a - 90);
  const isCw90 = absErrFromCw90 <= 5;
  const isCcw = a < -15 && a >= -135;
  const isUpsideDown = Math.abs(a) > 135;
  const isStacked = Math.abs(a) <= 10;
  const isOblique = !isCw90 && !isCcw && !isUpsideDown && !isStacked;

  const numOk = state.numeralMode === "cw90" || state.numeralMode === "tcy";
  const punctOk = state.punctMode === "center" || state.punctMode === "topright";
  const axisOk = Math.abs(state.baselineShift) <= 3.5;
  const scaleTooBig = state.latinScale > 1.08;
  const scaleTooSmall = state.latinScale < 0.82;
  const scaleOk = !scaleTooBig && !scaleTooSmall;
  const gutterOk = geom.minGutterGap >= 5;

  // 4 项原海报核心原则判定
  const flowPass = isCw90 && numOk;
  const rotationPass = isCw90 && numOk && punctOk;
  const rhythmPass = axisOk && gutterOk && punctOk && !isStacked;
  const hierarchyPass = scaleOk && gutterOk;

  const passed = [flowPass, rotationPass, rhythmPass, hierarchyPass].filter(Boolean).length;

  // 8 类双向真错态检测（按视觉严重程度排序）
  const faults = [];

  if (isCcw) {
    faults.push({
      code: "ccw",
      short: `逆转 ${a}°`,
      headline: `西文逆时针转了 ${Math.abs(a)}°，和中文迎面撞车`,
      why: "中文从上往下读，逆时针转向却逼着眼睛先跳到英文底端、再自下而上倒爬回去。每经过一处中英交界，视线就要急刹车折返一次。",
      how: "向右拖动画布或拨转朱红分度盘，把西文顺时针转到 +90°，让英文也顺着中文一路向下流。",
      fixLabel: "顺时针归位到 +90°",
      fixPatch: { latinAngle: 90, numeralMode: state.numeralMode === "ccw90" ? "cw90" : state.numeralMode },
    });
  } else if (isUpsideDown) {
    faults.push({
      code: "upside",
      short: `倒置 ${a}°`,
      headline: `西文倒转到 ${a}°，字母头脚颠倒`,
      why: "超过 135° 的倒转已经不是直排顺流，而是直接把整行西文翻了个底朝天，读者根本无法沿着纵列连续辨认。",
      how: "把朱红分度盘指针拨回右下方 +90° 顺时针刻度。",
      fixLabel: "归位到 +90°",
      fixPatch: { latinAngle: 90 },
    });
  } else if (isStacked) {
    faults.push({
      code: "stacked",
      short: "长句硬直立",
      headline: "整句英文逐字直立叠排，词形碎成字母柱",
      why: "人眼读英文靠的是单词整体轮廓，而不是逐个拼字母。把一串英文短语硬立成单字母塔，不仅高度暴涨溢出列尾，阅读速度也会骤降（直立只留给 1–3 字母缩写或牌匾装饰）。",
      how: "横拖画布或拨动朱红分度盘，将西文顺时针转至 +90°，保留完整英文词形。",
      fixLabel: "顺转英文到 +90°",
      fixPatch: { latinAngle: 90 },
    });
  } else if (isOblique) {
    faults.push({
      code: "oblique",
      short: `斜角 ${a > 0 ? "+" : ""}${a}°`,
      headline: `西文停在 ${a > 0 ? "+" : ""}${a}° 斜角，直接切破虚线列缝`,
      why: "半斜不直的字串既对不齐竖列骨架，又像斜刺一样扎进相邻列空间，把东亚直排最宝贵的纵行秩序彻底破坏。",
      how: "继续拖动转角直到吸附在 +90° 顺时针基准线上。",
      fixLabel: "吸附到 +90°",
      fixPatch: { latinAngle: 90 },
    });
  }

  if (!numOk) {
    const isNumCcw = state.numeralMode === "ccw90";
    faults.push({
      code: "numeral",
      short: isNumCcw ? "数字逆转" : "数字未转",
      headline: isNumCcw
        ? "第 3 列数字逆时针倒排，年份要从下往上读"
        : "第 3 列数字仍直立叠排，四位年份被拆成散码",
      why: isNumCcw
        ? "「2025」和「90%」逆转后与第 1 列中文下行方向相反，扫读数值时视线被迫逆向折返。"
        : "「2025」这类四位年份与百分比直立叠排时，数字节奏和顺转西文脱节；长数字顺时针转 90°（或短数配纵中横），整组数值才能一眼读通。",
      how: "直接点按画布第 3 列，或切到「顺时针 90° / 长数顺转·短数纵中横」。",
      fixLabel: "修正第 3 列数字",
      fixPatch: { numeralMode: "cw90" },
    });
  }

  if (!punctOk) {
    faults.push({
      code: "punct",
      short: "标点未转",
      headline: "第 4 列标点仍套用横排原形，括号歪躺、句号沉底",
      why: "横排的括号 ( ) 和引号「」开口朝左右，放进直排后抱不住上下汉字；顿号、句号留在左下角，也会把一列字的垂直中轴扯歪。",
      how: "点按画布第 4 列，把标点转为竖排专用字形（居中转形或大陆/日文右上转形均成立）。",
      fixLabel: "切换竖排标点字形",
      fixPatch: { punctMode: "center" },
    });
  }

  if (!axisOk) {
    const dir = state.baselineShift < 0 ? "偏左" : "偏右";
    faults.push({
      code: "axis",
      short: `偏轴 ${state.baselineShift > 0 ? "+" : ""}${state.baselineShift}px`,
      headline: `西文基线${dir} ${Math.abs(state.baselineShift)}px，脱离汉字中轴线`,
      why: "中文汉字以全身方框的中心为轴，若把西文字母基线直接套上去而没对齐 x-height 视觉中心，整串英文就会明显贴向一侧虚线，纵列视觉重心跟着歪斜。",
      how: "把「光学基线偏距」滑回 -3px 到 +3px 之间，让英文中轴咬住汉字中脊。",
      fixLabel: "光学基线归中",
      fixPatch: { baselineShift: 0 },
    });
  }

  if (scaleTooBig || !gutterOk) {
    faults.push({
      code: "scale_big",
      short: `西文过重 ${Math.round(state.latinScale * 100)}%`,
      headline: `西文字号拉到 ${Math.round(state.latinScale * 100)}%，列缝净空仅剩 ${geom.minGutterGap}px`,
      why: "西文比例偏大时，视觉黑度压过一旁的中文主行，还挤占了列间呼吸缝；直排混排通常要把西文视觉高度略收在汉字全身的 85%–100% 区间。",
      how: "将「中西视觉比例」回收到 88%–98%，恢复汉字主位与清晰列缝。",
      fixLabel: "收平衡比例至 94%",
      fixPatch: { latinScale: 0.94 },
    });
  } else if (scaleTooSmall) {
    faults.push({
      code: "scale_small",
      short: `西文过弱 ${Math.round(state.latinScale * 100)}%`,
      headline: `西文缩到 ${Math.round(state.latinScale * 100)}%，行内视觉分量塌陷`,
      why: "西文小写字母的 x-height 本就比汉字全身矮，再把字号压到 82% 以下，英文串会细得像脚注，整行灰度突然断层。",
      how: "把「中西视觉比例」抬回 88%–100%，让中英文灰度衔接自然。",
      fixLabel: "补回比例至 94%",
      fixPatch: { latinScale: 0.94 },
    });
  }

  // 4 枚原海报底栏探针状态
  const probes = {
    flow: {
      pass: flowPass,
      badge: flowPass
        ? "顺流统一"
        : isCcw
        ? `逆流 ${a}°`
        : isStacked
        ? "逐字中断"
        : !isCw90
        ? `偏流 ${a}°`
        : "数字断流",
    },
    rotation: {
      pass: rotationPass,
      badge: rotationPass
        ? "+90° 完整"
        : !isCw90
        ? `${a > 0 ? "+" : ""}${a}° 未归位`
        : !numOk
        ? NUMERAL_MODES[state.numeralMode].short
        : "标点未转",
    },
    rhythm: {
      pass: rhythmPass,
      badge: rhythmPass
        ? state.punctMode === "topright"
          ? "中轴·右上"
          : "中轴·居中"
        : !axisOk
        ? `偏轴 ${state.baselineShift > 0 ? "+" : ""}${state.baselineShift}px`
        : !punctOk
        ? "标点歪轴"
        : !gutterOk
        ? `净空 ${geom.minGutterGap}px`
        : "词形碎裂",
    },
    hierarchy: {
      pass: hierarchyPass,
      badge: hierarchyPass
        ? `比例 ${Math.round(state.latinScale * 100)}%`
        : scaleTooBig
        ? `西文抢重 ${Math.round(state.latinScale * 100)}%`
        : scaleTooSmall
        ? `西文偏弱 ${Math.round(state.latinScale * 100)}%`
        : `撞缝 ${geom.minGutterGap}px`,
    },
  };

  let headline, why, how, fixLabel, fixPatch, postureLabel;
  if (passed === 4) {
    const schemeName =
      state.numeralMode === "tcy" && state.punctMode === "topright"
        ? "出版纵中横 · 大陆/日文规范解"
        : state.numeralMode === "tcy"
        ? "短数纵中横 · 居中标点解"
        : state.punctMode === "topright"
        ? "顺转 90° · 右上标点解"
        : "原海报经典顺流解";
    headline = `四项全部成立：${schemeName}`;
    why =
      "中文保持直立，西文与长数字顺时针转 90° 咬住垂直中轴，标点切换竖排字形——从第一列扫到第四列，眼睛始终保持同一条自上而下的顺滑节奏。";
    how = "按空格键演播朱红视线流，或切到另外两套标本与合法解法对比差异。";
    fixLabel = "再演播一次视线流";
    fixPatch = null;
    postureLabel = "四维统一（示意）";
  } else {
    const top = faults[0];
    headline = top.headline;
    why = top.why;
    how = top.how;
    fixLabel = faults.length > 1 ? `一键校准全部（剩 ${faults.length} 处）` : top.fixLabel;
    fixPatch =
      faults.length > 1
        ? { ...SOLUTIONS.classic.patch }
        : top.fixPatch;
    postureLabel =
      faults.length >= 3 ? "多重失序（示意）" : faults.length === 2 ? "两处脱节（示意）" : "仅差一步（示意）";
  }

  return {
    passed,
    total: 4,
    angle: a,
    isCw90,
    isCcw,
    isStacked,
    isOblique,
    isUpsideDown,
    faults,
    probes,
    statusStamp: passed === 4 ? "4/4 · 动线统一" : `${passed}/4 · ${faults[0]?.short || "待校准"}`,
    headline,
    why,
    how,
    fixLabel,
    fixPatch,
    metrics: {
      angleText: `${a > 0 ? "+" : ""}${a}°`,
      axisText: state.baselineShift === 0 ? "归中 0px" : `${state.baselineShift < 0 ? "左偏" : "右偏"} ${Math.abs(state.baselineShift)}px`,
      gutterText: `${geom.minGutterGap}px`,
      scaleText: `${Math.round(state.latinScale * 100)}%`,
      postureLabel,
    },
  };
}
