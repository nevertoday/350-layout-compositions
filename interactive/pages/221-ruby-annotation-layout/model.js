// 221 旁注（Ruby）排版 · 单真源几何与审计引擎
// 所有画面坐标、字距撕裂、跨行归属比、对比度与诊断文案全部从同一套实绘包围盒算出。

export const PALETTE = {
  paper: "#FEFAF5",
  paperPure: "#FFFFFF",
  peach: "#FDF4EC",
  peachMist: "#F9EDE5",
  darkRoom: "#121414",
  darkCard: "#1A1D1D",
  footer: "#0B0D0D",
  sunRed: "#F46158",
  titleRed: "#F55D55",
  kanaRed: "#F25952",
  safeRed: "#C4302B",
  darkRed: "#FF766E",
  frameRose: "#E7A4A0",
  divider: "#E9DDD5",
  ink: "#070B0A",
  subInk: "#585C5D",
  dots: "#656565",
  passGreen: "#196B52",
  passGreenDark: "#5DD4AC",
  warnAmber: "#A65300",
};

export const INK_MODES = {
  heavy: {
    id: "heavy",
    label: "同黑同粗",
    short: "同黑",
    color: "#070B0A",
    weight: 900,
    note: "旁注与主文同色同重，两行黑字互相抢夺入口",
  },
  vermilion: {
    id: "vermilion",
    label: "朱红轻注",
    short: "朱红",
    color: "#C4302B",
    canvasColor: "#E0423B",
    weight: 500,
    note: "原海报朱红轻注，色相与字重同时让位于黑体主文",
  },
  slate: {
    id: "slate",
    label: "素墨雅灰",
    short: "素墨",
    color: "#4B5052",
    canvasColor: "#4B5052",
    weight: 400,
    note: "黑白印刷文库本做法：靠减重减墨拉开层级",
  },
  faint: {
    id: "faint",
    label: "浅灰失对比",
    short: "过淡",
    color: "#D4C9C2",
    canvasColor: "#D4C9C2",
    weight: 400,
    note: "墨色过浅，对比度跌破 3:1，想查读音反倒看不清",
  },
};

export const ALIGN_MODES = {
  drift: { id: "drift", label: "偏右错位", short: "错位" },
  mono: { id: "mono", label: "逐字居中", short: "单字" },
  jukugo: { id: "jukugo", label: "熟语均分", short: "熟语" },
  group: { id: "group", label: "词组通排", short: "词组" },
};

export const SPECIMENS = {
  "poster-ja": {
    id: "poster-ja",
    name: "原海报 · 日语振假名",
    shortName: "原海报日语",
    lang: "ja",
    prevLine: "昨日を越えて",
    prevSub: "上邻行参考",
    items: [
      { base: "希", ruby: "き", kind: "kanji", jukugoGroup: 0 },
      { base: "望", ruby: "ぼう", kind: "kanji", jukugoGroup: 0 },
      { base: "の", ruby: "の", kind: "kana", redundant: true, jukugoGroup: 1 },
      { base: "未", ruby: "み", kind: "kanji", jukugoGroup: 2 },
      { base: "来", ruby: "らい", kind: "kanji", jukugoGroup: 2 },
    ],
    groupRuby: "きぼうのみらい",
    side: { base: "山", ruby: ["や", "ま"], label: "右侧旁注示例", en: "SIDE RUBY EXAMPLE" },
    verticalSample: [
      { base: "希", ruby: "き" },
      { base: "望", ruby: "ぼう" },
      { base: "の", ruby: "の", redundant: true },
      { base: "未", ruby: "み" },
      { base: "来", ruby: "らい" },
    ],
    desc: "1:1 复刻原海报「希望の未来」与右侧「山 やま」；点击「の」头顶可开关多余助词注音。",
  },
  "pinyin-zh": {
    id: "pinyin-zh",
    name: "汉语拼音 · 宽窄音节",
    shortName: "汉语拼音",
    lang: "zh",
    prevLine: "秋色连波起",
    prevSub: "上邻行参考",
    items: [
      { base: "参", ruby: "cēn", kind: "hanzi", jukugoGroup: 0 },
      { base: "差", ruby: "cī", kind: "hanzi", jukugoGroup: 0 },
      { base: "霜", ruby: "shuāng", kind: "hanzi", jukugoGroup: 1 },
      { base: "叶", ruby: "yè", kind: "hanzi", jukugoGroup: 1 },
    ],
    groupRuby: "cēn cī shuāng yè",
    side: { base: "山", ruby: ["shān"], isLatinSide: true, label: "直排注音对照", en: "SIDE RUBY EXAMPLE" },
    verticalSample: [
      { base: "参", ruby: "cēn" },
      { base: "差", ruby: "cī" },
      { base: "霜", ruby: "shuāng" },
      { base: "叶", ruby: "yè" },
    ],
    desc: "演示多音字「参差」与超宽音节「shuāng」——比例过大或关闭悬挑会直接撑裂汉字行距。",
  },
  "term-book": {
    id: "term-book",
    name: "术语与古籍 · 释义注",
    shortName: "术语古籍",
    lang: "zh",
    prevLine: "刻本疏朗有度",
    prevSub: "上邻行参考",
    items: [
      { base: "版", ruby: "图文", kind: "hanzi", jukugoGroup: 0 },
      { base: "心", ruby: "边界", kind: "hanzi", jukugoGroup: 0 },
      { base: "界", ruby: "分栏", kind: "hanzi", jukugoGroup: 1 },
      { base: "栏", ruby: "墨线", kind: "hanzi", jukugoGroup: 1 },
    ],
    groupRuby: "页内有效排字区与行间墨线",
    side: { base: "经", ruby: ["典", "籍"], label: "古籍右旁训", en: "CLASSICAL GLOSS" },
    verticalSample: [
      { base: "版", ruby: "图文" },
      { base: "心", ruby: "边界" },
      { base: "界", ruby: "分栏" },
      { base: "栏", ruby: "墨线" },
    ],
    desc: "演示双字微注与古籍右侧旁训；一旦字号超标或未按词组收束，注音就会盖过主词。",
  },
};

// 开场故意给四重复合坏态（0/4）：绝不预先给出答案，同时保持画布层次清晰不乱糊
export const INITIAL_STATE = {
  specimen: "poster-ja",
  rubyRatio: 0.78,      // 78%：巨注喧宾夺主 + 撑裂字距
  gapEm: 0.36,          // 0.36em：浮高远离主字，贴近上一行底脚造成归属倒挂
  lineHeight: 1.80,     // 刚好让浮高巨注紧逼上邻行底脚而不穿字糊成一团
  alignMode: "drift",   // 偏右错位 +26%
  inkMode: "heavy",     // 主客同黑同粗
  overhang: false,      // 关闭悬挑：强迫撑裂主字距
  stripRedundantNo: false, // 原海报默认先展示原样（带 の 上多余注），可点除
  verticalMain: false,  // 主盘横排；点右区可切换直排试印
  highlightDim: null,   // "baseFirst" | "alignment" | "spacing" | "legibility" | null
  selectedIdx: -1,
};

// 多组合法解（全部真实通过 4/4）
export const VALID_SOLUTIONS = {
  poster: {
    id: "poster",
    label: "原海报朱红解",
    patch: {
      rubyRatio: 0.50,
      gapEm: 0.14,
      lineHeight: 2.02,
      alignMode: "mono",
      inkMode: "vermilion",
      overhang: true,
      stripRedundantNo: true,
    },
  },
  bunko: {
    id: "bunko",
    label: "文库素墨解",
    patch: {
      rubyRatio: 0.46,
      gapEm: 0.11,
      lineHeight: 1.96,
      alignMode: "jukugo",
      inkMode: "slate",
      overhang: true,
      stripRedundantNo: true,
    },
  },
  primer: {
    id: "primer",
    label: "启蒙疏朗解",
    patch: {
      rubyRatio: 0.54,
      gapEm: 0.17,
      lineHeight: 2.20,
      alignMode: "mono",
      inkMode: "vermilion",
      overhang: true,
      stripRedundantNo: true,
    },
  },
};

// 双向试错案例：确保反方向玩错也能被单真源捉出
export const FAIL_CASES = {
  oversize: {
    id: "oversize",
    label: "巨注抢戏",
    patch: { rubyRatio: 0.86, gapEm: 0.14, lineHeight: 2.02, alignMode: "mono", inkMode: "vermilion", overhang: false },
  },
  tiny: {
    id: "tiny",
    label: "蚂蚁糊死",
    patch: { rubyRatio: 0.26, gapEm: 0.12, lineHeight: 2.02, alignMode: "mono", inkMode: "vermilion", overhang: true },
  },
  crush: {
    id: "crush",
    label: "压顶粘连",
    patch: { rubyRatio: 0.50, gapEm: -0.02, lineHeight: 2.02, alignMode: "mono", inkMode: "vermilion", overhang: true },
  },
  invert: {
    id: "invert",
    label: "浮高倒挂",
    patch: { rubyRatio: 0.50, gapEm: 0.44, lineHeight: 1.58, alignMode: "mono", inkMode: "vermilion", overhang: true },
  },
  faint: {
    id: "faint",
    label: "过淡失对比",
    patch: { rubyRatio: 0.50, gapEm: 0.14, lineHeight: 2.02, alignMode: "mono", inkMode: "faint", overhang: true },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relLum([r, g, b]) {
  const f = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(hexA, hexB) {
  const l1 = relLum(hexToRgb(hexA));
  const l2 = relLum(hexToRgb(hexB));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 确定性字符宽估算（当外部传入 Canvas measureText 时优先用实测宽）
export function estimateTextWidth(str, fontPx) {
  let units = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (ch === " ") units += 0.34;
    else if (code > 0x2e80) units += 0.98; // CJK / 假名
    else if (/[mwMW]/.test(ch)) units += 0.82;
    else if (/[il1tfrjīíǐì]/.test(ch)) units += 0.38;
    else units += 0.58;
  }
  return units * fontPx;
}

/**
 * 单真源排版计算：同时供 Canvas 绘制与审计读数使用
 * @param {object} state
 * @param {object} viewport { w, h, measureFn? }
 */
export function computeGalleyLayout(state, viewport) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS["poster-ja"];
  const w = Math.max(300, viewport.w || 960);
  const h = Math.max(260, viewport.h || 370);
  const compact = w < 640;

  // 右侧留出原海报的「右侧旁注示例」栏（窄屏下置底条）
  const sideW = compact ? 0 : Math.round(clamp(w * 0.215, 165, 240));
  const mainLeft = compact ? 18 : Math.round(clamp(w * 0.145, 118, 178));
  const mainRight = compact ? w - 18 : w - sideW - 22;
  const mainAreaW = Math.max(200, mainRight - mainLeft);
  const mainAreaH = compact ? Math.round(h * 0.74) : h;

  const items = spec.items.map((it, idx) => ({
    ...it,
    idx,
    activeRuby: it.redundant && state.stripRedundantNo ? "" : it.ruby,
  }));

  // 基准主文字号（大而饱满，兼顾 390 与 1600）
  const count = items.length;
  const maxBaseByW = mainAreaW / (count * 1.48);
  const maxBaseByH = mainAreaH * (compact ? 0.255 : 0.255);
  const basePx = Math.round(clamp(Math.min(maxBaseByW, maxBaseByH), compact ? 38 : 54, 88));
  const rubyPx = +(basePx * state.rubyRatio).toFixed(1);
  const gapPx = +(basePx * state.gapEm).toFixed(1);
  const lineStepPx = +(basePx * state.lineHeight).toFixed(1);

  const measure = (text, px, isBase = false) => {
    if (!text) return 0;
    if (viewport.measureFn) return viewport.measureFn(text, px, isBase);
    return estimateTextWidth(text, px);
  };

  // 计算每个主字与旁注的实际宽度和撑开量
  const baseTrackPx = Math.round(basePx * 0.12); // 默认自然字距
  const cellWidths = [];
  const rubyWidths = [];
  const rawOverflows = [];

  for (let i = 0; i < count; i++) {
    const it = items[i];
    const bw = basePx; // 等宽方格汉字基宽
    const rw = it.activeRuby ? measure(it.activeRuby, rubyPx, false) : 0;
    rubyWidths.push(rw);
    const excess = Math.max(0, rw - bw);
    rawOverflows.push(excess);

    if (state.alignMode === "group") {
      cellWidths.push(bw + baseTrackPx);
    } else if (state.alignMode === "jukugo") {
      // 熟语均分：词组内可借邻字空位（最多借半个主字宽）
      const allowBorrow = state.overhang ? basePx * 0.42 : basePx * 0.22;
      const crack = Math.max(0, excess - allowBorrow);
      cellWidths.push(bw + baseTrackPx + crack);
    } else {
      // mono 或 drift：若不允许悬挑，超宽旁注会强行把主字格撑裂
      const prevHasRuby = i > 0 && !!items[i - 1].activeRuby;
      const nextHasRuby = i < count - 1 && !!items[i + 1].activeRuby;
      const freeSides = (!prevHasRuby ? 0.5 : 0.15) + (!nextHasRuby ? 0.5 : 0.15);
      const allowOver = state.overhang ? basePx * Math.min(0.5, freeSides * 0.48) : 0;
      const crack = Math.max(0, excess - allowOver);
      cellWidths.push(bw + baseTrackPx + crack);
    }
  }

  // 整体缩放保护：绝不溢出 mainAreaW（但保留真实撑裂比例供审计！）
  const rawTotalW = cellWidths.reduce((a, b) => a + b, 0) - baseTrackPx;
  const fitScale = rawTotalW > mainAreaW - 12 ? (mainAreaW - 12) / rawTotalW : 1;
  const effBasePx = +(basePx * fitScale).toFixed(1);
  const effRubyPx = +(rubyPx * fitScale).toFixed(1);
  const effGapPx = +(gapPx * fitScale).toFixed(1);
  const effLineStepPx = +(lineStepPx * fitScale).toFixed(1);

  // 纵坐标定位：主文行落在黄金中位，上方留出清晰上邻行 + 旁注带，下方留足注释距离括尺与游标尺
  const baseTopY = Math.round(mainAreaH * (compact ? 0.49 : 0.44));
  const baseBottomY = baseTopY + effBasePx;
  const rubyBottomY = baseTopY - effGapPx;
  const rubyTopY = rubyBottomY - effRubyPx;

  // 上邻行底线（真实多行几何：上行基线 = 本行基线 - lineStepPx）
  const prevBaseBottomY = Math.round(baseBottomY - effLineStepPx);
  const prevBaseTopY = prevBaseBottomY - effBasePx * 0.72;
  const clearanceToPrevPx = +(rubyTopY - prevBaseBottomY).toFixed(1);

  // 逐格生成实绘包围盒
  const scaledTotalW = rawTotalW * fitScale;
  let cursorX = mainLeft + (mainAreaW - scaledTotalW) / 2;

  const cells = [];
  let maxCrackEm = 0;

  for (let i = 0; i < count; i++) {
    const cw = cellWidths[i] * fitScale;
    const bw = effBasePx;
    const bx = cursorX + (cw - baseTrackPx * fitScale - bw) / 2;
    const bCx = bx + bw / 2;
    const crackEm = Math.max(0, (cellWidths[i] - basePx - baseTrackPx) / basePx);
    if (crackEm > maxCrackEm) maxCrackEm = crackEm;

    const rw = rubyWidths[i] * fitScale;
    let rCx = bCx;
    if (state.alignMode === "drift") {
      rCx = bCx + effBasePx * 0.26; // 偏右错位 26% 字宽
    } else if (state.alignMode === "jukugo") {
      // 熟语组内微幅向邻字借心，避免组内互相碰撞
      const it = items[i];
      const leftSame = i > 0 && items[i - 1].jukugoGroup === it.jukugoGroup;
      const rightSame = i < count - 1 && items[i + 1].jukugoGroup === it.jukugoGroup;
      if (rw > bw && leftSame && rubyWidths[i - 1] * fitScale < bw * 0.72) {
        rCx -= Math.min(effBasePx * 0.14, (rw - bw) * 0.35);
      } else if (rw > bw && rightSame && rubyWidths[i + 1] * fitScale < bw * 0.72) {
        rCx += Math.min(effBasePx * 0.14, (rw - bw) * 0.35);
      }
    }

    cells.push({
      idx: i,
      base: items[i].base,
      ruby: items[i].activeRuby,
      redundant: !!items[i].redundant,
      baseBox: { x: bx, y: baseTopY, w: bw, h: effBasePx, cx: bCx },
      rubyBox: {
        x: rCx - rw / 2,
        y: rubyTopY,
        w: rw,
        h: effRubyPx,
        cx: rCx,
      },
      driftRatio: items[i].activeRuby ? Math.abs(rCx - bCx) / effBasePx : 0,
      crackEm,
    });

    cursorX += cw;
  }

  // 词组通排（Group-ruby）整串包围盒
  let groupRubyBox = null;
  if (state.alignMode === "group") {
    const first = cells[0].baseBox;
    const last = cells[cells.length - 1].baseBox;
    const gCx = (first.x + last.x + last.w) / 2;
    const gW = measure(spec.groupRuby, effRubyPx, false);
    groupRubyBox = {
      text: spec.groupRuby,
      x: gCx - gW / 2,
      y: rubyTopY,
      w: gW,
      h: effRubyPx,
      cx: gCx,
    };
  }

  // 检测相邻旁注是否真实重叠碰撞
  let rubyCollisions = 0;
  let maxOverlapPx = 0;
  if (state.alignMode !== "group") {
    for (let i = 0; i < cells.length - 1; i++) {
      const a = cells[i].rubyBox;
      const b = cells[i + 1].rubyBox;
      if (a.w > 0 && b.w > 0) {
        const overlap = a.x + a.w - b.x + 2;
        if (overlap > 0) {
          rubyCollisions++;
          if (overlap > maxOverlapPx) maxOverlapPx = overlap;
        }
      }
    }
  }

  // 右侧旁注小窗包围盒（桌面在右，手机在底且在底部游标尺上方留足空隙）
  const sideRect = compact
    ? { x: 16, y: mainAreaH - 2, w: w - 32, h: Math.max(44, h - mainAreaH - 38), compact: true }
    : { x: w - sideW, y: 18, w: sideW - 14, h: h - 36, compact: false };

  return {
    w,
    h,
    compact,
    spec,
    mainLeft,
    mainRight,
    mainAreaW,
    mainAreaH,
    basePx: effBasePx,
    rubyPx: effRubyPx,
    gapPx: effGapPx,
    lineStepPx: effLineStepPx,
    baseTopY,
    baseBottomY,
    rubyTopY,
    rubyBottomY,
    prevBaseTopY,
    prevBaseBottomY,
    clearanceToPrevPx,
    cells,
    groupRubyBox,
    maxCrackEm: +maxCrackEm.toFixed(2),
    rubyCollisions,
    maxOverlapPx: +maxOverlapPx.toFixed(1),
    sideRect,
    redundantActive: items.some((it) => it.redundant && it.activeRuby),
  };
}

/**
 * 单真源审计：完全由实绘 layout 与 state 推导 4 项硬指标 + 8 类双向错态
 */
export function evaluateRuby(state, layout) {
  const ink = INK_MODES[state.inkMode] || INK_MODES.vermilion;
  const ratioPct = Math.round(state.rubyRatio * 100);
  const rubyContrast = +contrastRatio(ink.color, PALETTE.paper).toFixed(1);
  const gapPx = Math.round(layout.gapPx);
  const clearancePx = Math.round(layout.clearanceToPrevPx);

  // 1. 主文优先（BASE FIRST）：字号比 38%–58% 且实绘字号 ≥ 13px（在标准基准下防蚂蚁糊死），且不能撑裂或撞字
  const ratioTooBig = state.rubyRatio > 0.60;
  const ratioTooSmall = state.rubyRatio < 0.36;
  const severeCrack = layout.maxCrackEm > 0.34 || layout.rubyCollisions > 0;
  const baseFirstOk = !ratioTooBig && !ratioTooSmall && !severeCrack;
  let baseFirstBadge = `${ratioPct}% 适中`;
  if (ratioTooBig) baseFirstBadge = `${ratioPct}% 抢戏`;
  else if (ratioTooSmall) baseFirstBadge = `${ratioPct}% 糊死`;
  else if (layout.rubyCollisions > 0) baseFirstBadge = `相撞 ${layout.rubyCollisions} 处`;
  else if (severeCrack) baseFirstBadge = `撑裂 ${Math.round(layout.maxCrackEm * 100)}%`;

  // 2. 紧密对应（CLOSE ALIGNMENT）：不偏移，且汉字/拼音场景不把单字音节糊成无分界长串
  const isDrift = state.alignMode === "drift";
  const isGroupMisfit = state.alignMode === "group" && state.specimen === "pinyin-zh";
  const alignmentOk = !isDrift && !isGroupMisfit;
  let alignBadge = ALIGN_MODES[state.alignMode]?.short || "居中";
  if (isDrift) alignBadge = "偏右 +26%";
  else if (isGroupMisfit) alignBadge = "失单字位";
  else if (state.alignMode === "mono") alignBadge = "逐字中轴";
  else if (state.alignMode === "jukugo") alignBadge = "熟语均分";
  else alignBadge = "词组居中";

  // 3. 合理间距（APPROPRIATE SPACING）：不压顶粘连（≥ 0.06em）且不浮高倒挂（距上邻行 ≥ 注距×1.45 且 ≥ 12px）
  const tooTight = state.gapEm < 0.06;
  const invertedProximity = layout.clearanceToPrevPx < Math.max(12, layout.gapPx * 1.35) || state.gapEm > 0.28;
  const spacingOk = !tooTight && !invertedProximity;
  let spacingBadge = `注距 ${gapPx}px`;
  if (tooTight) spacingBadge = `压顶 ${gapPx}px`;
  else if (invertedProximity) spacingBadge = clearancePx <= 0 ? "撞上邻行" : `贴上行 ${clearancePx}px`;

  // 4. 提升可读性（LEGIBILITY）：既不能同黑等重抢戏，也不能过淡对比度 < 3.0
  const isHeavy = state.inkMode === "heavy";
  const isFaint = rubyContrast < 3.2;
  const legibilityOk = !isHeavy && !isFaint;
  let legibilityBadge = `${ink.short} ${rubyContrast}:1`;
  if (isHeavy) legibilityBadge = "同黑糊连";
  else if (isFaint) legibilityBadge = `仅 ${rubyContrast}:1`;

  const checks = {
    baseFirst: { ok: baseFirstOk, badge: baseFirstBadge, label: "主文优先", en: "BASE FIRST" },
    alignment: { ok: alignmentOk, badge: alignBadge, label: "紧密对应", en: "CLOSE ALIGNMENT" },
    spacing: { ok: spacingOk, badge: spacingBadge, label: "合理间距", en: "APPROPRIATE SPACING" },
    legibility: { ok: legibilityOk, badge: legibilityBadge, label: "提升可读性", en: "LEGIBILITY" },
  };

  const passedCount = Object.values(checks).filter((c) => c.ok).length;

  // 按严重优先级输出唯一主诊断（讲清「为什么眼睛会看错」+「怎么动手改」）
  let faultId = "pass";
  let statusShort = "经典平衡";
  let headline = "主次分明，旁注像轻声提词器一样稳贴主文";
  let why = `当前旁注占主文 ${ratioPct}%（接近活字 5.5pt / 10.5pt 的 1:2 传统），注距 ${gapPx}px 明显小于距上邻行的 ${clearancePx}px 净空，视线先扫黑体主文，遇难字再轻跳一眼即回落。`;
  let action = "可以继续切「汉语拼音 / 术语古籍」检验宽音节悬挑，或按 Space 演播扫读视线流。";
  let focusDim = null;

  if (ratioTooBig) {
    faultId = "oversize";
    statusShort = `巨注 ${ratioPct}%`;
    headline = `旁注放大到主文的 ${ratioPct}%，反客为主把主文挤碎了`;
    why = `主文应该是视觉入口。当旁注超过 60% 时，像「ぼう / らい / shuāng」这类多字符注音宽于单个汉字，不仅和主字抢视线，还把相邻旁注顶撞在一起或把主文字距硬生生撑裂。`;
    action = "直接在画布上向左横拖（或调低字号比滑轨），把旁注压回 44%–55% 半字区间。";
    focusDim = "baseFirst";
  } else if (ratioTooSmall) {
    faultId = "tiny";
    statusShort = `过小 ${ratioPct}%`;
    headline = `旁注缩到 ${ratioPct}%（实绘仅 ${Math.round(layout.rubyPx)}px），假名浊点与声调糊成一团`;
    why = "旁注虽要退居次席，但绝不能小到辨认吃力。低于约 36% 时，平假名的浊点（゛/゜）与汉语拼音的四声调号在普通视距下会糊死，失去提示读音的意义。";
    action = "在画布上向右横拖，把旁注放大到 44%–55% 清晰区间。";
    focusDim = "baseFirst";
  } else if (tooTight) {
    faultId = "crush";
    statusShort = `压顶 ${gapPx}px`;
    headline = `注距只剩 ${gapPx}px，旁注底缘压进了主字顶横`;
    why = "旁注和主字之间没有呼吸缝时，汉字顶部的横画与假名/拼音底脚会粘连成错觉新笔画，远看整行字头顶长满毛刺。";
    action = "向上拖动画布左侧「旁注 RUBY」红圆点（或拉高注距），留出 0.10–0.20em 的清晰间隙。";
    focusDim = "spacing";
  } else if (invertedProximity) {
    faultId = "invert";
    statusShort = clearancePx <= 0 ? "撞上邻行" : "浮高倒挂";
    headline = clearancePx <= 0
      ? `旁注向上飘起 ${gapPx}px，直接撞进了上一行底脚`
      : `旁注距上邻行仅 ${clearancePx}px，比离自己主字（${gapPx}px）还近`;
    why = "人眼按格式塔接近律把离得近的东西归成一组。一旦旁注浮得太高或行距太窄，读者会把这一行的读音误认成上一行的下注，段落一长立刻串行。";
    action = "向下拖回红圆点缩小注距到 0.10–0.18em，或把行距放宽到 1.9× 以上。";
    focusDim = "spacing";
  } else if (isDrift) {
    faultId = "drift";
    statusShort = "偏右错位";
    headline = "旁注向右滑偏了 +26% 字宽，落进了两字夹缝里";
    why = "旁注靠严格的垂直中轴建立「谁注谁」的对应。向右偏滑后，读者一瞬间分不清「ぼう」属于「希」还是「望」，每次核对都要停顿。";
    action = "把挂接对齐切到「逐字居中」或「熟语均分」，让每枚注音锁回汉字中轴。";
    focusDim = "alignment";
  } else if (isGroupMisfit) {
    faultId = "group-misfit";
    statusShort = "拼音粘连";
    headline = "汉语拼音整句合并成词组通排，失去了逐字对位";
    why = "像「cēn cī shuāng yè」这样音节长短悬殊的拼音，合并成一长串居中后，中间字不再对准各自音节；教学与识字场景必须逐字居中挂接。";
    action = "切回「逐字居中」并开启悬挑借位，让每个拼音稳稳落在对应汉字正上方。";
    focusDim = "alignment";
  } else if (isHeavy) {
    faultId = "heavy";
    statusShort = "同黑糊连";
    headline = "旁注和主文同黑同粗，页面变成两条互相抢戏的黑带";
    why = "即使字号缩小了一半，如果旁注仍用 900 粗黑，密集的细笔画会形成高墨量黑条，把视线从主文行上强行拉走。";
    action = "把旁注墨色切到「朱红轻注」或「素墨雅灰」，用轻字重与色阶退居辅助音轨。";
    focusDim = "legibility";
  } else if (isFaint) {
    faultId = "faint";
    statusShort = `过淡 ${rubyContrast}:1`;
    headline = `旁注浅灰对比度仅 ${rubyContrast}:1，真想查读音时看不清`;
    why = "退让层级不是把字做隐形。对比度跌破 3:1 后，弱光屏幕或投影下细小旁注会直接融进暖白纸面里。";
    action = "把旁注切回「朱红轻注」或「素墨雅灰」（对比度 ≥ 5:1）。";
    focusDim = "legibility";
  } else if (severeCrack) {
    faultId = "crack";
    statusShort = layout.rubyCollisions > 0 ? "旁注相撞" : "字距撑裂";
    headline = layout.rubyCollisions > 0
      ? `宽音节旁注在行间发生 ${layout.rubyCollisions} 处横向顶撞`
      : `宽音节关闭悬挑后，把主文字距硬撑裂了 ${Math.round(layout.maxCrackEm * 100)}%`;
    why = "像「shuāng」或双假名宽于单个汉字时，如果既不开启悬挑借位，又不用熟语均分，主文流就会被扯出一个个突兀的白洞。";
    action = "开启「悬挑借位」或把字号比微调到 44%–50%，消除主文字距豁口。";
    focusDim = "baseFirst";
  } else if (layout.redundantActive && state.specimen === "poster-ja") {
    // 4/4 已达标，但温馨提示一个进阶专业彩蛋
    why = `四项核心指标全部达标（字号比 ${ratioPct}%，注距 ${gapPx}px，距上邻行 ${clearancePx}px，对比度 ${rubyContrast}:1）。进阶小彩蛋：原海报连平假名「の」也注了「の」，点一下画布里「の」头顶可删掉这份多余注音。`;
  }

  return {
    checks,
    passedCount,
    isPass: passedCount === 4,
    faultId,
    statusLabel: `${passedCount}/4 · ${statusShort}`,
    statusShort,
    headline,
    why,
    action,
    focusDim,
    metrics: {
      ratioPct,
      basePx: Math.round(layout.basePx),
      rubyPx: Math.round(layout.rubyPx),
      gapPx,
      clearancePx,
      contrast: rubyContrast,
      crackPct: Math.round(layout.maxCrackEm * 100),
      collisions: layout.rubyCollisions,
    },
  };
}

/**
 * 第 03 节暗室：多行段落红外防撞测绘单真源模型
 */
export const DARK_PARAGRAPH_LINES = [
  [
    { b: "東", r: "とう", hard: true },
    { b: "京", r: "きょう", hard: true },
    { b: "の", r: "", hard: false },
    { b: "図", r: "と", hard: true },
    { b: "書", r: "しょ", hard: true },
    { b: "館", r: "かん", hard: true },
    { b: "で", r: "", hard: false },
    { b: "古", r: "こ", hard: false },
    { b: "書", r: "しょ", hard: false },
    { b: "を", r: "", hard: false },
    { b: "開", r: "ひら", hard: true },
    { b: "く", r: "", hard: false },
  ],
  [
    { b: "春", r: "chūn", hard: false },
    { b: "风", r: "fēng", hard: false },
    { b: "拂", r: "fú", hard: true },
    { b: "过", r: "guò", hard: false },
    { b: "参", r: "cēn", hard: true },
    { b: "差", r: "cī", hard: true },
    { b: "霜", r: "shuāng", hard: true },
    { b: "叶", r: "yè", hard: false },
    { b: "满", r: "mǎn", hard: false },
    { b: "庭", r: "tíng", hard: false },
    { b: "阶", r: "jiē", hard: true },
    { b: "。", r: "", hard: false },
  ],
  [
    { b: "微", r: "wēi", hard: false },
    { b: "注", r: "zhù", hard: false },
    { b: "悬", r: "xuán", hard: true },
    { b: "挑", r: "tiǎo", hard: true },
    { b: "借", r: "jiè", hard: false },
    { b: "位", r: "wèi", hard: false },
    { b: "不", r: "bù", hard: false },
    { b: "裂", r: "liè", hard: true },
    { b: "行", r: "háng", hard: true },
    { b: "间", r: "jiān", hard: false },
    { b: "气", r: "qì", hard: false },
    { b: "。", r: "", hard: false },
  ],
];

export function computeDarkCollision(params, w, h) {
  const { lineHeight, gapEm, overhang, mode } = params;
  // mode: "full" (总注音) | "para" (只注生僻/难字)
  const padX = w < 520 ? 18 : 36;
  const cols = 12;
  const usableW = Math.max(240, w - padX * 2);
  const basePx = clamp(Math.floor(Math.min(usableW / (cols * 1.24), h / 6.8)), 17, 32);
  const rubyPx = +(basePx * 0.50).toFixed(1);
  const gapPx = +(basePx * gapEm).toFixed(1);
  const stepY = +(basePx * lineHeight).toFixed(1);

  const startY = Math.max(46, Math.round((h - stepY * 2 - basePx) / 2) + rubyPx + gapPx);
  const lines = [];
  let verticalHits = 0;
  let horizontalCracks = 0;
  let activeRubyCount = 0;

  for (let li = 0; li < DARK_PARAGRAPH_LINES.length; li++) {
    const src = DARK_PARAGRAPH_LINES[li];
    const baseY = startY + li * stepY;
    const prevBottom = li > 0 ? startY + (li - 1) * stepY + basePx : -999;
    const rubyTop = baseY - gapPx - rubyPx;
    const clearance = li > 0 ? +(rubyTop - prevBottom).toFixed(1) : 99;
    const vHit = li > 0 && clearance < Math.max(6, gapPx * 1.15);

    const row = [];
    let cx = padX;
    for (let ci = 0; ci < src.length; ci++) {
      const item = src[ci];
      const showRuby = !!item.r && (mode === "full" || item.hard);
      if (showRuby) activeRubyCount++;
      const rw = showRuby ? estimateTextWidth(item.r, rubyPx) : 0;
      const excess = Math.max(0, rw - basePx);
      // 检查左右邻居是否无注音可借位
      const leftFree = ci > 0 && !(src[ci - 1].r && (mode === "full" || src[ci - 1].hard));
      const rightFree = ci < src.length - 1 && !(src[ci + 1].r && (mode === "full" || src[ci + 1].hard));
      const borrowMax = overhang ? (leftFree ? basePx * 0.42 : 0) + (rightFree ? basePx * 0.42 : 0) + basePx * 0.14 : 0;
      const crackPx = Math.max(0, excess - borrowMax);
      const isCrack = crackPx > basePx * 0.18;
      if (isCrack) horizontalCracks++;

      const cellW = basePx + 4 + crackPx;
      const bx = cx + crackPx / 2;
      if (vHit && showRuby) verticalHits++;

      row.push({
        b: item.b,
        r: showRuby ? item.r : "",
        bx,
        by: baseY,
        bw: basePx,
        rx: bx + basePx / 2,
        ry: baseY - gapPx,
        rw,
        rubyTop,
        crackPx,
        isCrack,
        vHit: vHit && showRuby,
        clearance,
      });
      cx += cellW;
    }
    // 居中整行
    const rowW = cx - padX;
    const shiftX = Math.max(0, (usableW - rowW) / 2);
    for (const c of row) {
      c.bx += shiftX;
      c.rx += shiftX;
    }
    lines.push({ baseY, prevBottom, rubyTop, clearance, vHit, cells: row });
  }

  let verdict = "段落清透 · 归属清晰";
  let level = "pass";
  if (verticalHits > 0 && horizontalCracks > 0) {
    verdict = `上下串行 ${verticalHits} 处 + 横向撕裂 ${horizontalCracks} 处`;
    level = "fail";
  } else if (verticalHits > 0) {
    verdict = `垂直倒挂 ${verticalHits} 处（上行净空 ${Math.round(lines[1].clearance)}px）`;
    level = "fail";
  } else if (horizontalCracks > 0) {
    verdict = `主文字流出现 ${horizontalCracks} 处宽拼音豁口`;
    level = "warn";
  }

  return {
    basePx,
    rubyPx,
    gapPx: Math.round(gapPx),
    stepY: Math.round(stepY),
    clearancePx: Math.round(lines[1].clearance),
    lines,
    verticalHits,
    horizontalCracks,
    activeRubyCount,
    verdict,
    level,
  };
}
