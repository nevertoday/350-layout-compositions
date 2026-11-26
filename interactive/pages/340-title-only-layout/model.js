// 单真源几何与诊断模型：所有留白比、边距、字阶体量、3 秒上屏估算（示意）均从实绘 16:9 幻灯片包围盒计算。
// 绝不写死常量结果；开场为 0/4 复合错态，支持双向判错与多组合法解。

export const SLIDE_W = 960;
export const SLIDE_H = 540;

export const CLUTTER_KEYS = ["subtitle", "bullets", "graphic", "footer"];

export const DECKS = {
  poster: {
    id: "poster",
    label: "原海报 · 演讲宣言",
    shortLabel: "原海报宣言",
    tag: "KEYNOTE 01 / 品牌方法论演讲",
    titles: [
      {
        tier: 0,
        badge: "31字公文",
        lines: [
          "关于在重要演示页面中尽量减少",
          "辅助说明文字并依靠留白来突出",
          "核心标题重点的排版方法总结",
        ],
        en: "SUMMARY OF REDUCING SECONDARY COPY IN KEYNOTE SLIDES",
        hollow: false,
      },
      {
        tier: 1,
        badge: "17字解释",
        lines: ["这一页只放核心标题，其余的细节", "留给演讲者现场口述展开"],
        en: "KEEP ONLY THE HEADLINE AND SPEAK THE DETAILS",
        hollow: false,
      },
      {
        tier: 2,
        badge: "8字主张",
        lines: ["仅标题", "让留白替你发声"],
        en: "TITLE-ONLY LAYOUT",
        hollow: false,
      },
      {
        tier: 3,
        badge: "2字空口号",
        lines: ["极简"],
        en: "MINIMAL",
        hollow: true,
      },
    ],
    clutter: {
      subtitle: {
        name: "副标解释",
        short: "副标",
        text: "只呈现核心标题，减少视觉干扰，帮助现场观众在三秒内快速理解演讲者想传达的主题方向。",
        spokenCue: "口播展开：为什么要把这段删掉？因为我正要亲口讲出它。",
      },
      bullets: {
        name: "三条要点",
        short: "要点",
        items: [
          "信息极简：砍掉所有和主旨无关的辅助说明",
          "重点突出：拉大字阶让后排一眼锁定核心句",
          "留白有力：四周空出来，视线才会自动回落",
        ],
        spokenCue: "口播展开：极简、聚焦、留白三步，拆到后面逐页口头推进。",
      },
      graphic: {
        name: "装饰配图",
        short: "配图",
        label: "DECOR ICON",
        spokenCue: "已移除装饰图：不抢标题的第一落点。",
      },
      footer: {
        name: "页脚注记",
        short: "页脚",
        text: "2026 年度设计规范内部评审会 · 第 14 页 / 共 48 页 · 机密请勿外传",
        spokenCue: "已移除页脚元数据：大屏宣言页不需要会议编号与免责声明。",
      },
    },
  },
  launch: {
    id: "launch",
    label: "产品发布 · 核心转向",
    shortLabel: "产品发布",
    tag: "KEYNOTE 02 / 年度产品发布会",
    titles: [
      {
        tier: 0,
        badge: "32字公文",
        lines: [
          "针对过去三年用户反馈的弱网同步",
          "延迟问题我们决定从今年第三季度",
          "起全线产品默认启用离线优先架构",
        ],
        en: "Q3 ROLLOUT PLAN FOR OFFLINE-FIRST ARCHITECTURE MIGRATION",
        hollow: false,
      },
      {
        tier: 1,
        badge: "16字解释",
        lines: ["为了解决弱网中断，今年起全线", "产品都将改为默认离线运行"],
        en: "SOLVING WEAK NETWORKS WITH DEFAULT OFFLINE MODE",
        hollow: false,
      },
      {
        tier: 2,
        badge: "9字主张",
        lines: ["今年起，", "全线产品默认离线"],
        en: "OFFLINE BY DEFAULT",
        hollow: false,
      },
      {
        tier: 3,
        badge: "2字空口号",
        lines: ["革新"],
        en: "REVOLUTION",
        hollow: true,
      },
    ],
    clutter: {
      subtitle: {
        name: "副标解释",
        short: "副标",
        text: "无论在高铁、航班还是地下车库，文档与项目都将本地实时落盘，联网后自动静默合并冲突。",
        spokenCue: "口播展开：高铁、航班、地库场景用你自己的声音带出画面感。",
      },
      bullets: {
        name: "三条要点",
        short: "要点",
        items: [
          "本地 SQLite 引擎响应低于 12ms，断网照常编辑",
          "CRDT 增量同步，重新连网后免手动解决版本冲突",
          "全端免费升级，现有云端空间数据自动双向镜像",
        ],
        spokenCue: "口播展开：技术指标留到下一页数据拆解，这一页只抛决定。",
      },
      graphic: {
        name: "装饰配图",
        short: "配图",
        label: "CLOUD BADGE",
        spokenCue: "已移除云端图标：少一个符号，文字气场翻倍。",
      },
      footer: {
        name: "页脚注记",
        short: "页脚",
        text: "产品战略发布会 · 架构升级章节 · 最终定稿版 v3.2",
        spokenCue: "已移除版本号页脚：发布会现场没人关心 v3.2。",
      },
    },
  },
  review: {
    id: "review",
    label: "季报复盘 · 破局关键",
    shortLabel: "复盘破局",
    tag: "KEYNOTE 03 / 管理层季度复盘",
    titles: [
      {
        tier: 0,
        badge: "30字公文",
        lines: [
          "综合本季度各渠道获客成本与老客",
          "流失数据来看当前增长放缓的首要",
          "瓶颈其实不在拉新而在首周激活率",
        ],
        en: "QUARTERLY FUNNEL BOTTLENECK ANALYSIS AND ACTIVATION REPORT",
        hollow: false,
      },
      {
        tier: 1,
        badge: "16字解释",
        lines: ["我们并不缺新流量，真正拖慢", "增长的是首周流失掉的七成用户"],
        en: "TRAFFIC IS NOT THE ISSUE FIRST-WEEK DROP-OFF IS",
        hollow: false,
      },
      {
        tier: 2,
        badge: "8字主张",
        lines: ["瓶颈不在拉新", "在首周留存"],
        en: "RETENTION OVER ACQUISITION",
        hollow: false,
      },
      {
        tier: 3,
        badge: "2字空口号",
        lines: ["增长"],
        en: "GROWTH",
        hollow: true,
      },
    ],
    clutter: {
      subtitle: {
        name: "副标解释",
        short: "副标",
        text: "过去两个季度投放预算上涨后，新增注册量达标，但第七日回访率持续走低，拉低整体回报。",
        spokenCue: "口播展开：前情数据刚刚讲完，这里用停顿让结论落地。",
      },
      bullets: {
        name: "三条要点",
        short: "要点",
        items: [
          "新客次日留存偏低，主要卡在首次配置步骤过长",
          "老客复购稳定，证明核心产品价值本身成立",
          "下季度暂停盲目扩投，集中火力改造新手引导",
        ],
        spokenCue: "口播展开：三项行动方案留给下一页的行动清单，别挤在同一屏。",
      },
      graphic: {
        name: "装饰配图",
        short: "配图",
        label: "CHART ICON",
        spokenCue: "已移除装饰折线小图：非真实数据的图标只会分散视线。",
      },
      footer: {
        name: "页脚注记",
        short: "页脚",
        text: "Q3 经营复盘会议 · 增长运营部 · 仅限内部讨论",
        spokenCue: "已移除部门落款：把四角清干净，让高管抬头看你。",
      },
    },
  },
};

export const POSTURES = {
  asymmetric: {
    id: "asymmetric",
    label: "左齐非对称",
    desc: "承袭 340 原海报：左侧稳锚，右上留出呼吸口袋与 45° 红线引视。",
    align: "left",
    xNorm: 0.1,
    yNorm: 0.49,
  },
  center: {
    id: "center",
    label: "光学居中",
    desc: "标题居中且光学上提约 4%，四面均衡留白，适合发布会庄重宣言。",
    align: "center",
    xNorm: 0.5,
    yNorm: 0.46,
  },
  takahashi: {
    id: "takahashi",
    label: "高桥冲屏",
    desc: "极简超大字号贴近中轴推进，配合快节奏演讲一页一拍。",
    align: "center",
    xNorm: 0.5,
    yNorm: 0.48,
  },
  edge: {
    id: "edge",
    label: "贴边反例",
    desc: "把标题顶到画框左上边缘，边距坍塌，既失稳又易被投影仪裁字。",
    align: "left",
    xNorm: 0.025,
    yNorm: 0.12,
  },
};

export const PRESETS = {
  broken: {
    label: "开场臃肿态",
    wordTier: 0,
    fontSize: 24,
    posture: "asymmetric",
    clutter: { subtitle: true, bullets: true, graphic: true, footer: true },
    noisyBg: false,
  },
  classic: {
    label: "原海报经典解",
    wordTier: 2,
    fontSize: 66,
    posture: "asymmetric",
    clutter: { subtitle: false, bullets: false, graphic: false, footer: false },
    noisyBg: false,
  },
  centered: {
    label: "光学居中解",
    wordTier: 2,
    fontSize: 62,
    posture: "center",
    clutter: { subtitle: false, bullets: false, graphic: false, footer: false },
    noisyBg: false,
  },
  takahashi: {
    label: "高桥冲屏解",
    wordTier: 2,
    fontSize: 82,
    posture: "takahashi",
    clutter: { subtitle: false, bullets: false, graphic: false, footer: false },
    noisyBg: false,
  },
};

export function createInitialState(deckId = "poster") {
  return {
    deckId,
    wordTier: PRESETS.broken.wordTier,
    fontSize: PRESETS.broken.fontSize,
    posture: PRESETS.broken.posture,
    clutter: { ...PRESETS.broken.clutter },
    noisyBg: false,
    // 3 秒暗场上屏实测状态
    flashActive: false,
    flashStart: 0,
    flashElapsed: 0,
    // 当前悬停或刚剥离的视觉反馈
    hoveredId: null,
    lastPeeled: null,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 精确估算字符宽度（支持传入真实 Canvas measureText，也支持纯算术降级，确保读数与实绘同源）
function measureLineWidth(text, fontSize, measureFn) {
  if (typeof measureFn === "function") {
    return measureFn(text, fontSize);
  }
  let w = 0;
  for (const ch of text) {
    w += ch.charCodeAt(0) > 0x2e80 ? fontSize * 1.0 : fontSize * 0.56;
  }
  return w;
}

// 按最大行宽对单行文字进行真实折行（用于探测大字号把长句压爆成多行的真实现象）
function wrapLines(rawLines, fontSize, maxW, measureFn) {
  const out = [];
  for (const raw of rawLines) {
    if (measureLineWidth(raw, fontSize, measureFn) <= maxW) {
      out.push(raw);
      continue;
    }
    let cur = "";
    for (const ch of raw) {
      const next = cur + ch;
      if (cur && measureLineWidth(next, fontSize, measureFn) > maxW) {
        out.push(cur);
        cur = ch;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

// 核心单真源几何解算：输入状态，输出 960×540 逻辑画框内全部实绘矩形与真实指标
export function computeSlideGeometry(state, measureFn = null) {
  const deck = DECKS[state.deckId] || DECKS.poster;
  const titleObj = deck.titles[state.wordTier] || deck.titles[2];
  const posture = POSTURES[state.posture] || POSTURES.asymmetric;
  const fs = clamp(Math.round(state.fontSize), 18, 112);

  const activeClutter = CLUTTER_KEYS.filter((k) => state.clutter[k]);
  const hasClutter = activeClutter.length > 0;
  const hasGraphic = state.clutter.graphic;

  // 允许的最大文字宽度：贴边反例靠近左沿，存在右侧装饰配图时须避让
  const safeLeft = state.posture === "edge" ? SLIDE_W * 0.025 : SLIDE_W * 0.095;
  const rightBound = hasGraphic ? SLIDE_W * 0.68 : SLIDE_W * 0.905;
  const maxTextW =
    posture.align === "center"
      ? SLIDE_W * (hasGraphic ? 0.66 : 0.84)
      : Math.max(240, rightBound - safeLeft);

  // 如果字号极大超过合理行宽，让文字真实向外溢出或折行，以便模型真实检出「爆框/贴边」
  const naturalWidths = titleObj.lines.map((l) => measureLineWidth(l, fs, measureFn));
  const longestNatural = Math.max(...naturalWidths, 1);

  // 高桥或居中大字允许单行突破 84% 去撞击安全区，展现「拉太大挤死留白/裁边」
  const hardWrapLimit =
    titleObj.lines.length <= 2 && fs >= 72
      ? SLIDE_W * 0.95
      : maxTextW;

  const lines = wrapLines(titleObj.lines, fs, hardWrapLimit, measureFn);
  const lineWidths = lines.map((l) => measureLineWidth(l, fs, measureFn));
  const titleW = Math.max(...lineWidths, fs * 2);
  const lineH = Math.round(fs * 1.18);
  const titleH = lines.length * lineH;

  // 英文副标与短红杠（紧随标题下方，是 340 原海报标题组的一部分）
  const enFont = clamp(Math.round(fs * 0.24), 11, 17);
  const enW = measureLineWidth(titleObj.en, enFont, measureFn) * 1.18; // letter-spacing
  const enH = enFont + 18; // 包含短红杠与呼吸缝

  const groupW = Math.max(titleW, Math.min(enW, SLIDE_W * 0.86));
  const groupH = titleH + enH;

  // 计算标题组实绘锚点
  let tx;
  let ty;
  if (state.posture === "edge") {
    tx = SLIDE_W * 0.024;
    ty = SLIDE_H * 0.04;
  } else if (posture.align === "center") {
    const centerBaseX = hasGraphic ? SLIDE_W * 0.42 : SLIDE_W * 0.5;
    tx = centerBaseX - groupW / 2;
    const targetMidY = hasClutter ? SLIDE_H * 0.27 : SLIDE_H * posture.yNorm;
    ty = targetMidY - groupH / 2;
  } else {
    tx = safeLeft;
    // 有冗余块时标题被迫挤到上部；清空后标题自然沉落到 340 原海报黄金气场区
    const targetMidY = hasClutter ? SLIDE_H * 0.26 : SLIDE_H * posture.yNorm;
    ty = targetMidY - groupH / 2;
  }

  // 防止完全跑出画布顶部，但保留贴边检测的真实性
  if (state.posture !== "edge") {
    ty = Math.max(SLIDE_H * 0.035, Math.min(SLIDE_H - groupH - SLIDE_H * 0.04, ty));
  }

  const titleBox = {
    x: Math.round(tx),
    y: Math.round(ty),
    w: Math.round(groupW),
    h: Math.round(groupH),
    textW: Math.round(titleW),
    textH: Math.round(titleH),
    align: posture.align,
    fontSize: fs,
    lineH,
    enFont,
    lines,
    en: titleObj.en,
  };

  // 计算 4 个冗余块的真实矩形（仅在开启时占据面积与命中热区）
  const clutterBoxes = {};
  let cursorY = Math.max(titleBox.y + titleBox.h + 14, SLIDE_H * 0.37);

  if (state.clutter.subtitle) {
    const subX = safeLeft;
    const subW = hasGraphic ? SLIDE_W * 0.58 : SLIDE_W * 0.76;
    const subH = 74;
    clutterBoxes.subtitle = {
      id: "subtitle",
      x: Math.round(subX),
      y: Math.round(cursorY),
      w: Math.round(subW),
      h: subH,
      data: deck.clutter.subtitle,
    };
    cursorY += subH + 12;
  }

  if (state.clutter.bullets) {
    const bulX = safeLeft;
    const bulW = hasGraphic ? SLIDE_W * 0.58 : SLIDE_W * 0.78;
    const bulH = 136;
    const bulY = Math.min(cursorY, SLIDE_H - (state.clutter.footer ? 194 : 150));
    clutterBoxes.bullets = {
      id: "bullets",
      x: Math.round(bulX),
      y: Math.round(bulY),
      w: Math.round(bulW),
      h: bulH,
      data: deck.clutter.bullets,
    };
  }

  if (state.clutter.graphic) {
    const gx = SLIDE_W * 0.7;
    const gy = SLIDE_H * 0.16;
    const gw = SLIDE_W * 0.24;
    const gh = SLIDE_H * 0.62;
    clutterBoxes.graphic = {
      id: "graphic",
      x: Math.round(gx),
      y: Math.round(gy),
      w: Math.round(gw),
      h: Math.round(gh),
      data: deck.clutter.graphic,
    };
  }

  if (state.clutter.footer) {
    clutterBoxes.footer = {
      id: "footer",
      x: Math.round(SLIDE_W * 0.045),
      y: Math.round(SLIDE_H - 48),
      w: Math.round(SLIDE_W * 0.91),
      h: 36,
      data: deck.clutter.footer,
    };
  }

  // 计算实绘占空面积：标题在视觉上按整体格式塔矩形体量感知（融合逐行墨迹与整块包围盒）
  const slideArea = SLIDE_W * SLIDE_H;
  const lineAreaSum = lineWidths.reduce((acc, w) => acc + Math.min(w, SLIDE_W) * lineH, 0);
  const enArea = Math.min(enW, SLIDE_W * 0.8) * enH;
  const bboxArea = Math.min(titleBox.w, SLIDE_W) * Math.min(titleBox.h, SLIDE_H);
  const titleInkArea = (lineAreaSum + enArea) * 0.45 + bboxArea * 0.85;
  const titleAreaPct = Math.round((titleInkArea / slideArea) * 1000) / 10;

  let clutterArea = 0;
  for (const key of activeClutter) {
    const b = clutterBoxes[key];
    // 每个冗余块在版面上形成 12px 视觉排斥缓冲区
    if (b) clutterArea += (b.w + 24) * (b.h + 24);
  }

  // 干扰底纹相当于视觉底噪占用有效留白
  const bgNoisePenalty = state.noisyBg ? 0.34 : 0;
  const rawOccupied = Math.min(0.92, (titleInkArea + clutterArea) / slideArea + bgNoisePenalty);
  const whitespacePct = Math.round((1 - rawOccupied) * 100);

  // 计算标题到四条画框边的真实最小安全距（占短边或对应边比例）
  const leftMarginPct = (titleBox.x / SLIDE_W) * 100;
  const rightMarginPct = ((SLIDE_W - (titleBox.x + titleBox.w)) / SLIDE_W) * 100;
  const topMarginPct = (titleBox.y / SLIDE_H) * 100;
  const bottomMarginPct = ((SLIDE_H - (titleBox.y + titleBox.h)) / SLIDE_H) * 100;
  const minMarginPct = Math.round(
    Math.min(leftMarginPct, rightMarginPct, topMarginPct, bottomMarginPct) * 10
  ) / 10;

  const overflows =
    titleBox.x < 12 ||
    titleBox.x + titleBox.w > SLIDE_W - 12 ||
    titleBox.y < 12 ||
    titleBox.y + titleBox.h > SLIDE_H - 12;

  // 实际有效字数（去除标点空格）
  const charCount = titleObj.lines.join("").replace(/[\s，。、：；！？,.!?:;·]/g, "").length;
  const totalClutterChars =
    (state.clutter.subtitle ? deck.clutter.subtitle.text.length : 0) +
    (state.clutter.bullets ? deck.clutter.bullets.items.join("").length : 0) +
    (state.clutter.footer ? deck.clutter.footer.text.length : 0);

  // 模拟 3 秒上屏阅读耗时（示意模型：与总字数、分块数、字号可读性挂钩）
  const baseRead = charCount * 0.11 + totalClutterChars * 0.048 + activeClutter.length * 0.55;
  const legibilityPenalty = fs < 32 ? (32 - fs) * 0.07 : fs > 98 ? 0.6 : 0;
  const noisePenalty = state.noisyBg ? 0.9 : 0;
  const glanceSec = Math.round(Math.max(0.7, baseRead + legibilityPenalty + noisePenalty) * 10) / 10;

  // 340 原海报招牌 45° 红圆斜线锚点（右上呼吸口袋内）
  const pocketX =
    posture.align === "left"
      ? Math.min(SLIDE_W - 68, Math.max(titleBox.x + (lineWidths[0] || 200) + 120, SLIDE_W * 0.78))
      : SLIDE_W * 0.83;
  const pocketY = Math.max(66, Math.min(titleBox.y - 16, SLIDE_H * 0.25));

  return {
    deck,
    titleObj,
    posture,
    titleBox,
    clutterBoxes,
    activeClutter,
    charCount,
    totalClutterChars,
    lineCount: lines.length,
    fontSize: fs,
    longestNatural,
    titleAreaPct,
    whitespacePct,
    minMarginPct,
    overflows,
    glanceSec,
    redAnchor: {
      dotX: Math.round(pocketX),
      dotY: Math.round(pocketY),
      tailX: Math.round(pocketX - 96),
      tailY: Math.round(pocketY + 96),
    },
  };
}

// 双向核算四项海报关键词探针与白话诊断
export function evaluateSlide(state, geom) {
  const nClutter = geom.activeClutter.length;
  const isHollow = geom.titleObj.hollow;
  const fs = geom.fontSize;
  const ws = geom.whitespacePct;
  const margin = geom.minMarginPct;

  // 1. 极简 MINIMAL：零冗余 + 无干扰底纹
  const minimalOk = nClutter === 0 && !state.noisyBg;
  const minimalTag = state.noisyBg
    ? "底噪破静"
    : nClutter > 0
      ? `余 ${nClutter} 处冗余`
      : "已归纯净";

  // 2. 聚焦 FOCUS：字数精炼（4–14字、1–2行）且非空洞口号
  const tooLong = geom.charCount > 14 || geom.lineCount > 2;
  const focusOk = !tooLong && !isHollow;
  const focusTag = isHollow
    ? "2字空口号"
    : tooLong
      ? `${geom.charCount}字过长`
      : `${geom.charCount}字直击`;

  // 3. 留白 WHITESPACE：双向约束！太挤(<58%或边距<7%)不行，过空怯场(>87%)也不行
  const tooCramped = ws < 58 || margin < 7 || geom.overflows;
  const tooEmpty = ws > 87;
  const whitespaceOk = !tooCramped && !tooEmpty;
  const whitespaceTag =
    margin < 7 || geom.overflows
      ? `边距 ${Math.max(0, margin).toFixed(0)}%`
      : ws < 58
        ? `逼仄 ${ws}%`
        : ws > 87
          ? `过空 ${ws}%`
          : `呼吸 ${ws}%`;

  // 4. 气场 PRESENCE：双向约束！字号怯弱(<46px或占空<7%)不行，爆框/贴边(>94px或edge)也不行
  const timid = fs < 46 || geom.titleAreaPct < 7;
  const overblown = fs > 94 || geom.titleAreaPct > 36 || geom.overflows;
  const edgeBroken = state.posture === "edge" || margin < 6;
  const presenceOk = !timid && !overblown && !edgeBroken;
  const presenceTag = edgeBroken
    ? "贴边失衡"
    : timid
      ? `怯弱 ${fs}px`
      : overblown
        ? `爆框 ${fs}px`
        : `稳重 ${fs}px`;

  const checks = {
    minimal: { ok: minimalOk, tag: minimalTag, zh: "极简", en: "MINIMAL" },
    focus: { ok: focusOk, tag: focusTag, zh: "聚焦", en: "FOCUS" },
    whitespace: { ok: whitespaceOk, tag: whitespaceTag, zh: "留白", en: "WHITESPACE" },
    presence: { ok: presenceOk, tag: presenceTag, zh: "气场", en: "PRESENCE" },
  };

  const score = [minimalOk, focusOk, whitespaceOk, presenceOk].filter(Boolean).length;
  const passed = score === 4;

  // 按视觉因果顺序产出最首要的白话诊断（讲清「观众会怎么看」）
  let verdictTitle = "";
  let verdictBody = "";
  let actionHint = "";
  let primaryIssue = "ok";

  if (state.noisyBg) {
    primaryIssue = "noise";
    verdictTitle = "花哨底纹抢走了留白的安静场域";
    verdictBody =
      "仅标题页靠字与底的高反差立住全场。加上几何底纹后，眼睛必须费力把笔画从背景噪声里剥离出来，极简气场立刻失效。";
    actionHint = "关闭「花纹底噪」，恢复纯色画廊纸面。";
  } else if (nClutter > 0) {
    primaryIssue = "clutter";
    const names = geom.activeClutter.map((k) => geom.deck.clutter[k].short).join("、");
    verdictTitle = `页面还挂着 ${nClutter} 处冗余（${names}），观众忙着低头读字`;
    verdictBody =
      "屏幕上的副标、要点和演讲者的口播同走语言通道。眼睛刚看两行，耳朵就漏掉了你说的话——这仍是「伪仅标题」页。";
    actionHint = "直接点击画布上的虚线冗余块，把它们逐一剥离进「归口述区」。";
  } else if (isHollow) {
    primaryIssue = "hollow";
    verdictTitle = `只剩「${geom.titleBox.lines[0]}」两个字，极简滑向了空洞口号`;
    verdictBody =
      "少字不等于没主张。删到连主语和判断都消失时，观众虽能 1 秒读完，却抓不住你要宣布的具体立场，留白只剩装腔作势。";
    actionHint = "点击标题块，切回有主语与判断的 8–9 字核心主张。";
  } else if (tooLong) {
    primaryIssue = "wordy";
    verdictTitle = `冗余清干净了，但标题仍有 ${geom.charCount} 字（折成 ${geom.lineCount} 行）`;
    verdictBody =
      "把整段公文塞进标题框，观众仍要逐字默读超过 3 秒。仅标题页要求的是「一眼吞下」的短句锚点，细节请交给口述。";
    actionHint = "点击画布标题块（或下方提纯阶），把文案压到 14 字以内、1–2 行。";
  } else if (edgeBroken) {
    primaryIssue = "edge";
    verdictTitle = `标题贴到了画框边缘（最小边距仅 ${Math.max(0, margin).toFixed(1)}%）`;
    verdictBody =
      "文字紧贴画框会截断四周留白的呼吸感，且会议室投影仪稍有缩放偏移，就会把首尾笔画直接裁掉。";
    actionHint = "切回「左齐非对称」或「光学居中」，为四边留出 ≥7% 安全呼吸带。";
  } else if (overblown) {
    primaryIssue = "overblown";
    verdictTitle = `字号拉到了 ${fs}px，把留白压得只剩 ${ws}%`;
    verdictBody =
      "大字确实醒目，但撑到快撞框时，四周的留白消失，画面的「从容气场」瞬间退化成迎面压来的广告牌压迫感。";
    actionHint = "在画布上向左横拖，把字号收回 52–86px 区间，留出 ≥58% 留白。";
  } else if (timid || tooEmpty) {
    primaryIssue = "timid";
    verdictTitle = `字号仅 ${fs}px（占屏 ${geom.titleAreaPct}%），空荡得像漏排了正文`;
    verdictBody =
      "留白本身不会自动变有力。当标题体量过小，后排观众看清都很吃力，大片空白非但没有气场，反而显得寒酸、没做完。";
    actionHint = "在画布上向右横拖拉大字阶（约 54–82px），用体量镇住整张画布。";
  } else {
    primaryIssue = "ok";
    const styleName =
      state.posture === "center"
        ? "光学居中宣言解"
        : state.posture === "takahashi"
          ? "高桥流冲屏解"
          : "原海报非对称解";
    verdictTitle = `4/4 成立 · ${styleName}（留白 ${ws}%）`;
    verdictBody = `全页只保留 ${geom.charCount} 字核心主张与 ${fs}px 稳重字阶，观众约 ${geom.glanceSec} 秒（示意）便能扫清主题，随即抬头听你展开已剥离的口播细节。`;
    actionHint = "按空格键（或点 3 秒上屏）体验 15m 后排实测，也可换另外两种构图或剧本对照。";
  }

  const glanceTier =
    geom.glanceSec <= 1.8
      ? "瞬间锁焦"
      : geom.glanceSec <= 3.0
        ? "3秒可读"
        : geom.glanceSec <= 4.5
          ? "视线滞留"
          : "严重超载";

  return {
    score,
    max: 4,
    passed,
    checks,
    primaryIssue,
    verdictTitle,
    verdictBody,
    actionHint,
    glanceSec: geom.glanceSec,
    glanceTier,
  };
}
