// 150 图文谜语版式 · 单一真源数据与状态计算模型
// 所有替换比、语义桥接、光学等重比、剧透状态与 8 类错态诊断均由此处实算。

export const SCALE_MIN = 0.94;
export const SCALE_MAX = 1.24;
export const SCALE_RANGE = { min: 0.42, max: 1.85 };

// 每枚图形的元信息：名称、默认含义、与文字的关系说明
export const ICON_META = {
  leaf: {
    id: "leaf",
    name: "翠绿树叶",
    short: "绿叶",
    literal: "树叶（叶）",
    accent: "#0C8A75",
  },
  heart: {
    id: "heart",
    name: "实心爱心",
    short: "爱心",
    literal: "心脏 / 爱",
    accent: "#0C8A75",
  },
  heartRed: {
    id: "heartRed",
    name: "朱红爱心",
    short: "红心",
    literal: "爱 / Love",
    accent: "#C23B2B",
  },
  maple: {
    id: "maple",
    name: "秋日枫叶",
    short: "枫叶",
    literal: "红枫（秋）",
    accent: "#C45B2A",
  },
  oneBar: {
    id: "oneBar",
    name: "单枝横节",
    short: "单节",
    literal: "一笔 / 唯一",
    accent: "#0C8A75",
  },
  halfMoon: {
    id: "halfMoon",
    name: "切半圆盘",
    short: "半圆",
    literal: "一半（半）",
    accent: "#0C8A75",
  },
  doubleX: {
    id: "doubleX",
    name: "双叠倍块",
    short: "双倍",
    literal: "加倍 / ×2",
    accent: "#0C8A75",
  },
  eye: {
    id: "eye",
    name: "双瞳之眼",
    short: "眼睛",
    literal: "Eye（谐音 I）",
    accent: "#0C8A75",
  },
  bulb: {
    id: "bulb",
    name: "灵光灯泡",
    short: "灯泡",
    literal: "顿悟 / 知晓",
    accent: "#0C8A75",
  },
  gear: {
    id: "gear",
    name: "机械齿轮",
    short: "齿轮",
    literal: "工业零件",
    accent: "#535E5A",
  },
  cloud: {
    id: "cloud",
    name: "无定云团",
    short: "云团",
    literal: "模糊云朵",
    accent: "#535E5A",
  },
  cup: {
    id: "cup",
    name: "咖啡热杯",
    short: "热杯",
    literal: "饮品杯子",
    accent: "#535E5A",
  },
  wave: {
    id: "wave",
    name: "抽象波纹",
    short: "波纹",
    literal: "无指向折线",
    accent: "#535E5A",
  },
};

// 四套真实图文谜语题组（含原海报题 + 经典中英谜面）
export const DECKS = {
  yixin: {
    id: "yixin",
    label: "原海报·一心一意",
    kicker: "看图猜成语",
    answer: "一心一意",
    posterNote: "用“叶”替代“一”，图像补全语义。",
    isLatin: false,
    slots: [
      {
        char: "一",
        candidates: [
          { icon: "oneBar", bridge: "direct", explain: "单节横画直接呼应「一」的字形与数量。" },
          { icon: "leaf", bridge: "context", explain: "「叶」与「一」音义较远，须靠其余三字语境兜底。" },
          { icon: "wave", bridge: "broken", explain: "抽象波纹与「一」既不象形也不谐音，联想断桥。" },
        ],
      },
      {
        char: "心",
        candidates: [
          { icon: "heart", bridge: "direct", explain: "心形直指「心」，跨文化零门槛一步解出。" },
          { icon: "cloud", bridge: "context", explain: "云团偏意象化，单看难定词，全靠「一_一意」补完。" },
          { icon: "gear", bridge: "broken", explain: "机械齿轮与「心」毫无关联，强行替代只会卡死读者。" },
        ],
      },
      {
        char: "一",
        candidates: [
          { icon: "leaf", bridge: "context", explain: "原海报同款：用「叶」替「一」，依赖「一心_意」高语境完形。" },
          { icon: "oneBar", bridge: "direct", explain: "单横竹节贴合「一」的笔画形态，单看也易辨认。" },
          { icon: "cup", bridge: "broken", explain: "热杯与「一」毫无语义或谐音桥梁。" },
        ],
      },
      {
        char: "意",
        candidates: [
          { icon: "bulb", bridge: "direct", explain: "亮起灯泡借代「意念、想法」，一步导向「意」。" },
          { icon: "cloud", bridge: "context", explain: "云团过于泛指，需前三字「一心一_」强力收束。" },
          { icon: "gear", bridge: "broken", explain: "齿轮与「意」缺乏直觉关联。" },
        ],
      },
    ],
    // 刻意设在 0/4 翻车态：3/4 过度替代 + 离题齿轮/波纹 + 1.72× 巨图压字 + 同号剧透
    broken: {
      replaced: [true, true, true, false],
      icons: ["wave", "gear", "leaf", "bulb"],
      activeSlot: 1,
      iconScale: 1.72,
      revealMode: "spoiler",
    },
    posterPreset: {
      replaced: [false, false, true, false],
      icons: ["oneBar", "heart", "leaf", "bulb"],
      activeSlot: 2,
      iconScale: 1.12,
      revealMode: "subtle",
    },
  },

  yiye: {
    id: "yiye",
    label: "一叶知秋",
    kicker: "看图猜成语",
    answer: "一叶知秋",
    posterNote: "用绿叶直替「叶」字，或再配枫叶呼应「秋」。",
    isLatin: false,
    slots: [
      {
        char: "一",
        candidates: [
          { icon: "oneBar", bridge: "direct", explain: "单横笔画直观对应「一」。" },
          { icon: "wave", bridge: "broken", explain: "波纹与「一」无关，容易误读为「水」或「川」。" },
          { icon: "cup", bridge: "broken", explain: "咖啡杯与「一」无关联。" },
        ],
      },
      {
        char: "叶",
        candidates: [
          { icon: "leaf", bridge: "direct", explain: "翠绿树叶直替「叶」字，象形一步到位。" },
          { icon: "cloud", bridge: "context", explain: "云朵需靠「一_知秋」硬猜，削弱直觉快感。" },
          { icon: "cup", bridge: "broken", explain: "热杯与「叶」断桥，读者会在第二格卡住。" },
        ],
      },
      {
        char: "知",
        candidates: [
          { icon: "bulb", bridge: "direct", explain: "灯泡借代「知晓、明白」，与上下文顺畅衔接。" },
          { icon: "eye", bridge: "context", explain: "眼睛偏向「看/见」，推到「知」多绕一弯。" },
          { icon: "gear", bridge: "broken", explain: "齿轮与「知」没有语义连接。" },
        ],
      },
      {
        char: "秋",
        candidates: [
          { icon: "maple", bridge: "direct", explain: "红枫借代「秋」，季节识别度极高。" },
          { icon: "cloud", bridge: "context", explain: "云团四季皆有，单看难锁「秋」。" },
          { icon: "gear", bridge: "broken", explain: "齿轮与季节「秋」完全脱节。" },
        ],
      },
    ],
    broken: {
      replaced: [true, true, true, false],
      icons: ["wave", "cup", "gear", "maple"],
      activeSlot: 1,
      iconScale: 1.66,
      revealMode: "spoiler",
    },
    posterPreset: {
      replaced: [false, true, false, false],
      icons: ["oneBar", "leaf", "bulb", "maple"],
      activeSlot: 1,
      iconScale: 1.10,
      revealMode: "subtle",
    },
  },

  shiban: {
    id: "shiban",
    label: "事半功倍",
    kicker: "几何谜面",
    answer: "事半功倍",
    posterNote: "半圆切分直指「半」，双叠块呼应「倍」。",
    isLatin: false,
    slots: [
      {
        char: "事",
        candidates: [
          { icon: "bulb", bridge: "context", explain: "灯泡偏向想法，推到「事」不够直接。" },
          { icon: "cup", bridge: "broken", explain: "热杯与「事」缺少公共语义。" },
          { icon: "wave", bridge: "broken", explain: "抽象折线无法指向「事」。" },
        ],
      },
      {
        char: "半",
        candidates: [
          { icon: "halfMoon", bridge: "direct", explain: "实半圆配虚线另半，几何直译「半」字。" },
          { icon: "wave", bridge: "context", explain: "波纹缺乏等分视觉线索，只能靠成语硬补。" },
          { icon: "gear", bridge: "broken", explain: "齿轮无法表达「一半」的比例关系。" },
        ],
      },
      {
        char: "功",
        candidates: [
          { icon: "bulb", bridge: "context", explain: "灯泡勉强联想成果，不如留作文字锚点。" },
          { icon: "cloud", bridge: "broken", explain: "云朵与「功」断桥。" },
          { icon: "cup", bridge: "broken", explain: "热杯与「功」无关。" },
        ],
      },
      {
        char: "倍",
        candidates: [
          { icon: "doubleX", bridge: "direct", explain: "双块叠加带倍增节奏，直接点题「倍」。" },
          { icon: "leaf", bridge: "broken", explain: "绿叶与「倍」没有任何音义联系。" },
          { icon: "cloud", bridge: "broken", explain: "云朵无法传达「加倍」概念。" },
        ],
      },
    ],
    broken: {
      replaced: [true, true, false, true],
      icons: ["cup", "gear", "bulb", "leaf"],
      activeSlot: 1,
      iconScale: 0.50,
      revealMode: "spoiler",
    },
    posterPreset: {
      replaced: [false, true, false, true],
      icons: ["bulb", "halfMoon", "bulb", "doubleX"],
      activeSlot: 1,
      iconScale: 1.08,
      revealMode: "subtle",
    },
  },

  iloveny: {
    id: "iloveny",
    label: "经典 · I ♥ NY",
    kicker: "CLASSIC REBUS · 1976",
    answer: "I LOVE NY",
    posterNote: "Milton Glaser 1976 年草图用红心直替动词 Love，保留字母锚点 I 与 NY。",
    isLatin: true,
    slots: [
      {
        char: "I",
        candidates: [
          { icon: "eye", bridge: "direct", explain: "Eye 与 I 英文同音，是最经典的英语谐音画谜。" },
          { icon: "oneBar", bridge: "context", explain: "竖条易与数字 1 混淆，靠后续词组才能定音。" },
          { icon: "cup", bridge: "broken", explain: "杯子与 I 既不同音也不象形。" },
        ],
      },
      {
        char: "LOVE",
        candidates: [
          { icon: "heartRed", bridge: "direct", explain: "朱红爱心直接替代动词 LOVE，全球通读无需翻译。" },
          { icon: "leaf", bridge: "broken", explain: "树叶无法代表 LOVE，会瞬间改写整句语义。" },
          { icon: "gear", bridge: "broken", explain: "机械齿轮完全背离情感词 LOVE。" },
        ],
      },
      {
        char: "N",
        candidates: [
          { icon: "wave", bridge: "broken", explain: "折线难以辨认为地名缩写字母 N。" },
          { icon: "cloud", bridge: "broken", explain: "云团会摧毁 NY 地名锚点。" },
          { icon: "gear", bridge: "broken", explain: "齿轮与字母 N 无关。" },
        ],
      },
      {
        char: "Y",
        candidates: [
          { icon: "leaf", bridge: "broken", explain: "用树叶替掉 Y 会让 NY 地名彻底不可辨。" },
          { icon: "cup", bridge: "broken", explain: "热杯与字母 Y 无关。" },
          { icon: "cloud", bridge: "broken", explain: "云朵破坏地名缩写。" },
        ],
      },
    ],
    broken: {
      replaced: [true, true, true, false],
      icons: ["cup", "gear", "wave", "cloud"],
      activeSlot: 1,
      iconScale: 1.70,
      revealMode: "spoiler",
    },
    posterPreset: {
      replaced: [false, true, false, false],
      icons: ["eye", "heartRed", "wave", "cloud"],
      activeSlot: 1,
      iconScale: 1.12,
      revealMode: "subtle",
    },
  },
};

export function createDeckState(deckId = "yixin", usePreset = false) {
  const deck = DECKS[deckId] || DECKS.yixin;
  const src = usePreset ? deck.posterPreset : deck.broken;
  return {
    deckId: deck.id,
    replaced: [...src.replaced],
    icons: [...src.icons],
    activeSlot: src.activeSlot,
    iconScale: src.iconScale,
    revealMode: src.revealMode, // "spoiler" | "subtle" | "hidden"
    peekAnswer: false,
  };
}

export function clampScale(v) {
  return Math.max(SCALE_RANGE.min, Math.min(SCALE_RANGE.max, Math.round(v * 100) / 100));
}

// 统一计算画布上四个槽位的真实几何布局（Canvas 渲染与点击命中、读数共享同一坐标！）
export function computeTileGeometry(state, width, height) {
  const deck = DECKS[state.deckId];
  const n = deck.slots.length;
  const padX = Math.max(18, width * 0.075);
  const usableW = Math.max(120, width - padX * 2);
  const slotPitch = usableW / n;
  const isSpoiler = state.revealMode === "spoiler";
  // 基准字面框 emBox 高度按画布宽与高共同约束，确保即使在 1.72× 错态下也不会与顶部剧透条撞车
  const emSize = Math.min(slotPitch * 0.62, height * (isSpoiler ? 0.34 : 0.42));
  const centerY = height * (isSpoiler ? 0.56 : 0.48);
  const capY = centerY - emSize * 0.5;
  const baseY = centerY + emSize * 0.5;

  const tiles = deck.slots.map((slot, idx) => {
    const cx = padX + slotPitch * (idx + 0.5);
    const isIcon = state.replaced[idx];
    const visualSize = isIcon ? emSize * state.iconScale : emSize;
    const hitW = Math.max(slotPitch * 0.86, visualSize);
    const hitH = Math.max(emSize * 1.18, visualSize);
    return {
      idx,
      char: slot.char,
      isIcon,
      iconId: state.icons[idx],
      cx,
      cy: centerY,
      emSize,
      visualSize,
      slotPitch,
      box: {
        x: cx - visualSize / 2,
        y: centerY - visualSize / 2,
        w: visualSize,
        h: visualSize,
      },
      hit: {
        x: cx - hitW / 2,
        y: centerY - hitH / 2,
        w: hitW,
        h: hitH,
      },
    };
  });

  // 实测最小相邻字隙（像素）和相对 emSize 的碰撞比
  let minGapPx = Infinity;
  for (let i = 0; i < tiles.length - 1; i++) {
    const a = tiles[i];
    const b = tiles[i + 1];
    const gap = b.box.x - (a.box.x + a.box.w);
    if (gap < minGapPx) minGapPx = gap;
  }
  const maxOverflowRatio = state.replaced.some(Boolean)
    ? Math.max(0, (state.iconScale - 1.24) * 100)
    : 0;

  return {
    width,
    height,
    emSize,
    centerY,
    capY,
    baseY,
    slotPitch,
    tiles,
    minGapPx: Number.isFinite(minGapPx) ? Math.round(minGapPx) : 0,
    colliding: minGapPx < 4,
    maxOverflowRatio: Math.round(maxOverflowRatio),
  };
}

// 查找某槽位当前所选图形的桥接等级
export function getSlotCandidate(state, slotIdx) {
  const deck = DECKS[state.deckId];
  const slot = deck.slots[slotIdx];
  const iconId = state.icons[slotIdx];
  return (
    slot.candidates.find((c) => c.icon === iconId) || {
      icon: iconId,
      bridge: "broken",
      explain: "该图形与原字无明显语义或谐音桥梁。",
    }
  );
}

// 核心单真源诊断函数：输出四原则状态、首要错因、解码体验档位与可操作指引
export function evaluateState(state, geomW = 840, geomH = 330) {
  const deck = DECKS[state.deckId];
  const geom = computeTileGeometry(state, geomW, geomH);
  const total = deck.slots.length;
  const replacedIndices = [];
  for (let i = 0; i < total; i++) if (state.replaced[i]) replacedIndices.push(i);
  const replacedCount = replacedIndices.length;
  const replacePct = Math.round((replacedCount / total) * 100);
  const anchorPct = 100 - replacePct;

  const activeBridges = replacedIndices.map((i) => ({
    idx: i,
    char: deck.slots[i].char,
    ...getSlotCandidate(state, i),
  }));
  const brokenSlots = activeBridges.filter((b) => b.bridge === "broken");
  const weakSlots = activeBridges.filter((b) => b.bridge === "context");
  const directSlots = activeBridges.filter((b) => b.bridge === "direct");

  // 四条核心原则判定（严格独立、可各自玩错）
  // 1. 替代 REPLACE：1–2 格（25%–50%）才兼顾谜感与文字锚点
  const replaceOk = replacedCount >= 1 && replacedCount <= 2;

  // 2. 双关 PUN：所有被替图形都不能断桥；若用弱桥（如原海报「叶替一」），必须有 ≥75% 文字锚点（即仅替 1 字）才托得住
  const weakSupported = weakSlots.length === 0 || (replacedCount === 1 && anchorPct >= 75);
  const punOk = replacedCount > 0 && brokenSlots.length === 0 && weakSupported;

  // 3. 联想/同流 ASSOCIATION：有替图且视觉比例落在经验参考带 0.94×–1.24×，且不撞压邻字
  const scaleOk =
    replacedCount > 0 &&
    state.iconScale >= SCALE_MIN &&
    state.iconScale <= SCALE_MAX &&
    !geom.colliding;

  // 4. 记忆 MEMORY：不能同号抢答剧透（须留出解谜停顿）
  const memoryOk = state.revealMode !== "spoiler";

  const checks = { pun: punOk, replace: replaceOk, flow: scaleOk, memory: memoryOk };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 8 类精确错态分级诊断（按读者实际受阻优先级排序）
  let faultCode = "ok";
  let badge = "4 / 4 谜面成立";
  let headline = "";
  let body = "";
  let action = "";
  let decodeTier = "约 1–2 秒顿悟（示意）";
  let tone = "ok"; // "error" | "warn" | "ok"

  if (replacedCount === 0) {
    faultCode = "zero_replace";
    tone = "error";
    badge = `错态 · 零替代纯字（${passCount} / 4）`;
    headline = "四个字全没换图，退回成了普通纯字标题";
    body = "图文谜语的核心是留出一处视觉缺口让大脑补全。现在 0% 替换，眼睛直接把字滑过去，互动记忆优势随之消失。";
    action = `点击画布上任意一个汉字（例如「${deck.slots[1].char}」），把它切换成图像替代槽。`;
    decodeTier = "0.3 秒直读 · 无解谜停顿";
  } else if (replacedCount >= 3) {
    faultCode = "overload";
    tone = "error";
    badge = `错态 · 过度替代（${passCount} / 4）`;
    headline = `替掉了 ${replacedCount} / ${total} 格（${replacePct}%），文字锚点只剩 ${anchorPct}%`;
    body = "图像替得太满，句式骨架被彻底拆散。读者面对一排孤立图标猜不到出处，会在 3 秒内放弃解码——谜面变成了天书。";
    action = "直接点击画布里多余的图像槽把它们切回汉字，把替代率收束到 1–2 格（25%–50%）。";
    decodeTier = "卡壳 > 5 秒 · 易弃读";
  } else if (brokenSlots.length > 0) {
    faultCode = "broken_bridge";
    tone = "error";
    const first = brokenSlots[0];
    const iconName = ICON_META[first.icon]?.name || "当前图形";
    badge = `错态 · 联想断桥（${passCount} / 4）`;
    headline = `用「${iconName}」替代「${first.char}」，读者找不到联想路径`;
    body = `${first.explain} 图像替代文字必须借象形、谐音或强借代搭桥；桥一断，哪怕只替一格也会打断阅读。`;
    action = `先点选第 ${first.idx + 1} 格「${first.char}」，再在下方选图区换成象形或谐音贴合的图形。`;
    decodeTier = "联想中断 · 猜不出来";
  } else if (!weakSupported) {
    faultCode = "weak_under_low_context";
    tone = "error";
    const first = weakSlots[0];
    badge = `错态 · 语境撑不住弱桥（${passCount} / 4）`;
    headline = `只剩 ${anchorPct}% 文字锚点，托不住弱关联图形`;
    body = `「${ICON_META[first.icon]?.short}」替「${first.char}」属于弱联想桥（${first.explain}）。同时替换 2 格时，剩余文字锁不住句式，读者容易猜偏。`;
    action = "把另一格切回汉字留出 75% 文字锚点，或将弱关联图形换成直觉象形图标。";
    decodeTier = "犹豫 3–5 秒 · 易猜偏";
  } else if (state.iconScale > SCALE_MAX || geom.colliding) {
    faultCode = "oversized";
    tone = "error";
    badge = `错态 · 巨图压垮字流（${passCount} / 4）`;
    headline = `图标放大到字面框的 ${state.iconScale.toFixed(2)}×，彻底脱离了字行`;
    body = `图标撑破上下字头与基线，最小字隙被挤到 ${geom.minGapPx}px。人眼不再把它当成「句子里的一个字」，而会看成背景大插画把前后文字劈成两半。`;
    action = `把底沿「图文等重调校尺」向左拖进 ${SCALE_MIN.toFixed(2)}×–${SCALE_MAX.toFixed(2)}× 经验甜区（或按 ← 键微调）。`;
    decodeTier = "字流断裂 · 视线跳脱";
  } else if (state.iconScale < SCALE_MIN) {
    faultCode = "undersized";
    tone = "error";
    badge = `错态 · 缩微失认（${passCount} / 4）`;
    headline = `图标缩到字面框的 ${state.iconScale.toFixed(2)}×，在粗黑字间糊成噪点`;
    body = "图形轮廓与叶脉等内部特征严重收缩，视觉体量远弱于左右黑体汉字，眼睛扫过时容易误判成标点或污渍而直接跳过。";
    action = `向右推「图文等重调校尺」到 ${SCALE_MIN.toFixed(2)}×–${SCALE_MAX.toFixed(2)}×，让图形与汉字视觉等重。`;
    decodeTier = "轮廓模糊 · 易被略过";
  } else if (!memoryOk) {
    faultCode = "spoiler";
    tone = "error";
    badge = `错态 · 同号剧透（${passCount} / 4）`;
    headline = "谜底用同号大字贴脸印出，解谜还没开始就结束了";
    body = "根据 Slamecka & Graf（1978）的生成效应，记忆增益来自读者自己把空缺补出来的那一秒。直接把答案甩在眼前，大脑只会读字、不再看图。";
    action = "将谜底方式切到「轻注谜底（原海报做法）」或「盲猜隐藏」，留出 1–2 秒停顿。";
    decodeTier = "抢答跳过 · 失生成效应";
  } else {
    // 全部 4 / 4 成立！区分「直觉象形/谐音解」与「原海报语境托底解」
    faultCode = "ok";
    tone = "ok";
    const usedContextOnly = weakSlots.length > 0;
    badge = usedContextOnly ? "4 / 4 成立 · 语境托底" : "4 / 4 成立 · 图文共振";
    if (usedContextOnly) {
      const w = weakSlots[0];
      headline = `保留 ${anchorPct}% 文字锚点，用语境完形托住了「${ICON_META[w.icon]?.short}替${w.char}」`;
      body = `这正是 150 号原海报的真实结构：单看「${ICON_META[w.icon]?.short}」未必直连「${w.char}」，但其余三字把成语锁死，加上 ${state.iconScale.toFixed(2)}× 视觉等重与克制谜底，眼睛 1–2 秒就能笑着接上。`;
      action = "试试把第 2 格换成「爱心」对比直觉象形解，或切换上方其他谜题继续实测。";
      decodeTier = "约 1.5–2.5 秒 · 语境顿悟";
    } else {
      const names = directSlots.map((d) => `「${ICON_META[d.icon]?.short}→${d.char}」`).join("、");
      headline = `替代 ${replacePct}%、等重 ${state.iconScale.toFixed(2)}×，达成一秒图文共振`;
      body = `${names} 的图形与语义直连，左右文字锚点牢牢稳住句式，图形光学重心与黑体字面齐平，谜底退居次席——大脑主动补全语义，触发完整生成效应。`;
      action = "你可以故意把缩放拉极端，或切换「一叶知秋 / 事半功倍 / I ♥ NY」体验不同替代路径。";
      decodeTier = "约 1–2 秒 · 顿悟记忆峰值";
    }
  }

  // 四枚原海报底部图标的实时短标签
  const indicators = [
    {
      key: "pun",
      zh: "双关",
      en: "PUN",
      ok: punOk,
      status:
        replacedCount === 0
          ? "未启用"
          : brokenSlots.length > 0
            ? `断桥 ${brokenSlots.length} 处`
            : !weakSupported
              ? "弱桥吃紧"
              : weakSlots.length > 0
                ? "语境托底"
                : "直连畅通",
    },
    {
      key: "replace",
      zh: "替代",
      en: "REPLACE",
      ok: replaceOk,
      status:
        replacedCount === 0
          ? "0% 纯字"
          : replacedCount >= 3
            ? `${replacePct}% 过载`
            : `${replacePct}% 适中`,
    },
    {
      key: "flow",
      zh: "联想",
      en: "ASSOCIATION",
      ok: scaleOk,
      status:
        replacedCount === 0
          ? "待替字"
          : state.iconScale > SCALE_MAX || geom.colliding
            ? `${state.iconScale.toFixed(2)}× 压字`
            : state.iconScale < SCALE_MIN
              ? `${state.iconScale.toFixed(2)}× 过小`
              : `${state.iconScale.toFixed(2)}× 等重`,
    },
    {
      key: "memory",
      zh: "记忆",
      en: "MEMORY",
      ok: memoryOk,
      status:
        state.revealMode === "spoiler"
          ? "同号剧透"
          : state.revealMode === "hidden"
            ? "盲猜留白"
            : "轻注悬念",
    },
  ];

  // 动态谜底小注（忠实呼应原海报「谜底：一心一意 / 用“叶”替代“一”，图像补全语义。」）
  let dynamicExplain = deck.posterNote;
  if (replacedCount === 0) {
    dynamicExplain = "当前未做图像替代，整句以纯文字直出。";
  } else {
    const parts = activeBridges.map((b) => `用「${ICON_META[b.icon]?.short}」替「${b.char}」`);
    dynamicExplain = `${parts.join("，")}，${punOk ? "图像参与语义补全。" : "当前联想桥尚未打通。"}`;
  }

  return {
    deck,
    geom,
    replacedCount,
    total,
    replacePct,
    anchorPct,
    checks,
    passCount,
    faultCode,
    tone,
    badge,
    headline,
    body,
    action,
    decodeTier,
    indicators,
    dynamicExplain,
  };
}

// 03 节深翡翠暗室：相图双因子扫描模型（X=替代密度 0..100%，Y=桥接清晰度 0..100%）
export function evaluatePhasePoint(densityPct, clarityPct) {
  const d = Math.max(0, Math.min(100, densityPct));
  const c = Math.max(0, Math.min(100, clarityPct));
  // 估算替换格数（0..4）供迷你预览联动
  const slots = d < 12 ? 0 : d < 38 ? 1 : d < 63 ? 2 : d < 88 ? 3 : 4;

  let zone = "sweet";
  let title = "共振甜区 · 1–2 秒顿悟";
  let detail = "替代率克制在 25%–50%，且图形桥接清晰，文字锚点与视觉联想协同发力，最易触发生成效应。";
  let tone = "ok";

  if (d < 14) {
    zone = "plain";
    title = "纯字平读区 · 无谜感";
    detail = "图像几乎没有承担文字槽位，退回普通文字标题（见 141 文字主导版式），记忆停顿偏弱。";
    tone = "warn";
  } else if (d > 62) {
    zone = "cryptic";
    title = "天书弃读区 · 锚点崩塌";
    detail = "超过六成文字被图标吞没，句式失去定海神针；即便每张图标画得再精致，路人也难在 3 秒内拼出原句。";
    tone = "error";
  } else if (c < 38) {
    zone = "断桥";
    title = "隐喻断桥区 · 猜不透";
    detail = "替字比例虽然克制，但图形与目标字之间缺象形或谐音捷径，读者的视线卡在图槽里反复试错。";
    tone = "error";
  } else if (c < 62) {
    zone = "context";
    title = "语境险区 · 靠熟语托底";
    detail = "图形本身偏绕弯（类似原海报用「叶」替「一」），只有放在家喻户晓的成语或短口号里，靠高语境才能托住。";
    tone = "warn";
  }

  // 倒 U 型共振曲线高度（仅作示意曲线绘制，界面标注「示意」不伪装实测百分比）
  const dOpt = Math.exp(-Math.pow((d - 34) / 24, 2));
  const cOpt = Math.max(0, Math.min(1, (c - 22) / 68));
  const resonanceLevel = d < 10 ? 0.16 : Math.min(1, dOpt * (0.28 + 0.72 * cOpt));
  const tierLabel =
    zone === "sweet"
      ? "峰值共振（示意）"
      : zone === "context"
        ? "中等共振（依赖熟语）"
        : zone === "plain"
          ? "低互动（平读）"
          : "阻力过载（易弃读）";

  return { densityPct: Math.round(d), clarityPct: Math.round(c), slots, zone, title, detail, tone, resonanceLevel, tierLabel };
}
