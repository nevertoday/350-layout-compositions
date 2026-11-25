// 161 章节扉页（CHAPTER OPENING PAGE）单真源状态与几何核算引擎
// 所有画布坐标、墨水灰度覆率、跨页灰阶落差、天头沉降、字号比、中缝压字碰撞与五关键词实况均由此处同一份数据实时导出。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 拱门书卷",
    bookTitle: "版式建筑学笔记",
    prevChapter: "第一章 · 网格与秩序",
    chapterNum: "CHAPTER 02",
    chapterNumZh: "第二章",
    title: "章节扉页",
    subtitleEn: "CHAPTER OPENING PAGE",
    cue: "新章节，新视角，新启程。",
    openingPara:
      "推开一扇门之前，人会先停半步。纸页之间的扉页也是如此：它在上一章密密麻麻的字海之后切开一片安静的暖纸，让眼睛歇一口气，再把注意力稳稳接进新的叙事。",
    nextChapterTitle: "第二章正文 · 门扉与停顿",
    spoilerLines: [
      "① 本章先讲扉页在书里的 5 种分工，再拆 4 个历史流派。",
      "② 第 47 页会比较精装左空右启与平装另起页的印张成本。",
      "③ 第 63 页附有 8 个完整改版前后对比与 12 条避坑清单。",
      "④ 尾声总结电子书和年报如何迁移这套空间重置语法。",
    ],
    paper: "#EFDAC1",
    paperBright: "#F5E8D6",
    doorGlow: "#F7EBDC",
    arch: "#384435",
    doorLeaf: "#111316",
    accent: "#D7968F",
    accentDeep: "#9A3D31",
    ink: "#121417",
    mutedInk: "#3F473D",
  },
  novel: {
    id: "novel",
    label: "文学精装 · 沉降素扉",
    bookTitle: "海雾纪事",
    prevChapter: "第一章 · 港口旧钟",
    chapterNum: "CHAPTER II",
    chapterNumZh: "二",
    title: "潮汐之前的静默",
    subtitleEn: "SILENCE BEFORE THE TIDE",
    cue: "「所有远行，都从停下脚步的那一刻开始。」",
    openingPara:
      "十月第三周的清晨，灯塔守夜人合上记事簿，听见防波堤外退潮的水声慢了下来。窗台上积着一层细盐，风从东面吹过，把昨夜的雾气推向看不见的海平线。",
    nextChapterTitle: "二 · 潮汐之前的静默",
    spoilerLines: [
      "① 守夜人在防波堤捡到一封三十年前未寄出的航海日志。",
      "② 镇上修表匠认出信封火漆印记，揭开老船长失踪谜底。",
      "③ 暴风雨夜里两人乘小艇驶向礁石群，找回沉箱里的铜镜。",
      "④ 天亮后船队返港，主角决定留在北方小岛接管旧灯塔。",
    ],
    paper: "#F5EDE0",
    paperBright: "#FAF4EA",
    doorGlow: "#FFFDF8",
    arch: "#314137",
    doorLeaf: "#171A19",
    accent: "#C98276",
    accentDeep: "#8E352B",
    ink: "#151719",
    mutedInk: "#464C46",
  },
  report: {
    id: "report",
    label: "年报画册 · 板块扉页",
    bookTitle: "2026 城市阅读空间年鉴",
    prevChapter: "第一部分 · 街区书店普查",
    chapterNum: "SECTION 02",
    chapterNumZh: "02 板块",
    title: "公共阅读的尺规",
    subtitleEn: "MEASURE OF PUBLIC READING",
    cue: "从光照、动线到纸页静度，拆解六座新馆的空间语法。",
    openingPara:
      "把阅读空间放回城市尺规里观察，最先起作用的往往不是藏书量，而是入口处那段让脚步放缓的过渡廊道。我们用同一套测绘口径记录了六座新馆的进深与采光。",
    nextChapterTitle: "02 · 公共阅读的尺规",
    spoilerLines: [
      "① 收录六座场馆共 42 组照度实测、座席密度与噪音分贝表。",
      "② 详列 2024–2026 年度预算分配、能耗下降 18% 的改造细项。",
      "③ 专访三位馆长与两位照明顾问，摘录完整问答与平面草图。",
      "④ 文末附公共空间无障碍设计核对表与运营维护时间表。",
    ],
    paper: "#EFE5D4",
    paperBright: "#F7F0E3",
    doorGlow: "#FCF6EC",
    arch: "#2E3F34",
    doorLeaf: "#101414",
    accent: "#D38C7F",
    accentDeep: "#953A2E",
    ink: "#121518",
    mutedInk: "#3D4740",
  },
};

export const PLACEMENTS = [
  { id: "inline", label: "接排同页" },
  { id: "anypage", label: "另起新页" },
  { id: "recto", label: "左空右启" },
  { id: "spread", label: "跨页门扉" },
  { id: "gutter", label: "压脊试错" },
];

export const CUE_MODES = [
  { id: "flat", label: "平灰无号" },
  { id: "balanced", label: "精炼引语" },
  { id: "spoiler", label: "剧透长墙" },
  { id: "empty", label: "空壳无锚" },
];

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    state: {
      placement: "inline",
      sink: 4,
      runningHead: true,
      folio: "top",
      firstIndent: true,
      cueMode: "flat",
      scale: 1.15,
      flow: 0,
    },
  },
  posterOk: {
    label: "原海报门扉解",
    state: {
      placement: "spread",
      sink: 28,
      runningHead: false,
      folio: "hidden",
      firstIndent: false,
      cueMode: "balanced",
      scale: 3.1,
      flow: 0,
    },
  },
  rectoOk: {
    label: "精装右页解",
    state: {
      placement: "recto",
      sink: 32,
      runningHead: false,
      folio: "bottom",
      firstIndent: false,
      cueMode: "balanced",
      scale: 2.8,
      flow: 0,
    },
  },
  compactOk: {
    label: "平装另起解",
    state: {
      placement: "anypage",
      sink: 26,
      runningHead: false,
      folio: "bottom",
      firstIndent: false,
      cueMode: "balanced",
      scale: 2.6,
      flow: 0,
    },
  },
  errSpoiler: {
    label: "试错：剧透墙",
    state: {
      placement: "recto",
      sink: 24,
      runningHead: false,
      folio: "bottom",
      firstIndent: false,
      cueMode: "spoiler",
      scale: 2.6,
      flow: 0,
    },
  },
  errGutter: {
    label: "试错：压脊吞字",
    state: {
      placement: "gutter",
      sink: 28,
      runningHead: false,
      folio: "hidden",
      firstIndent: false,
      cueMode: "balanced",
      scale: 3.0,
      flow: 0,
    },
  },
  errOversink: {
    label: "试错：沉底挤爆",
    state: {
      placement: "recto",
      sink: 58,
      runningHead: false,
      folio: "bottom",
      firstIndent: false,
      cueMode: "balanced",
      scale: 2.9,
      flow: 0,
    },
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    ...PRESETS.broken.state,
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 单真源：按真实版心参数实算双页墨水密度、跨章灰度落差、沉降比、碰撞状态与九类错态
export function evaluate(rawState) {
  const s = {
    theme: rawState.theme || "poster",
    placement: rawState.placement || "inline",
    sink: clamp(Number(rawState.sink ?? 4), 0, 62),
    runningHead: Boolean(rawState.runningHead),
    folio: rawState.folio || "top",
    firstIndent: Boolean(rawState.firstIndent),
    cueMode: rawState.cueMode || "flat",
    scale: clamp(Number(rawState.scale ?? 1.15), 1.0, 4.2),
    flow: clamp(Number(rawState.flow ?? 0), -1, 1),
  };

  // 上一章正文灰度与下一章正文灰度（标准密排书页实测基准）
  const prevChapterInk = 46; // %
  const nextChapterInk = 44; // %

  // 计算左页（Verso）与右页（Recto）的实绘墨水覆盖率（%）
  let versoInk = 0;
  let rectoInk = 0;

  // 1) 左页内容贡献
  if (s.placement === "inline") {
    // 未另起新页：左页满排上一章正文
    versoInk = 46;
  } else if (s.placement === "anypage") {
    // 平装另起新页：左页承接上一章末尾半页（约 58% 高度）
    versoInk = 27;
  } else if (s.placement === "recto") {
    // 精装左空右启：左页留白，仅有微弱章序水印/空白呼吸
    versoInk = s.cueMode === "empty" ? 1 : 4;
  } else if (s.placement === "spread") {
    // 跨页门扉：左页排主标题 + 精炼导语 + 点丘装饰（大面积留白）
    versoInk = 11 + (s.cueMode === "spoiler" ? 20 : s.cueMode === "empty" ? -9 : 0) + (s.scale - 2.0) * 1.6;
  } else if (s.placement === "gutter") {
    // 压脊试错：标题跨中缝，左页留白但中缝撞字
    versoInk = 10 + (s.cueMode === "spoiler" ? 16 : 0);
  }

  // 2) 右页内容贡献
  if (s.placement === "inline") {
    // 同页接排：上半页还有上一章残段（22%），下半页紧贴新章密排正文（20%）
    rectoInk = 42;
  } else if (s.placement === "spread") {
    // 跨页门扉右页：深松绿拱门与推开黑门占比视觉体量，但属于大块氛围门洞而非碎密文字，净文字密度极低
    // 为了真实反映「文字灰度 vs 留白呼吸」，拱门视觉体量记作氛围锚点，纸面呼吸依然充分
    rectoInk = s.cueMode === "empty" ? 6 : 18;
  } else {
    // anypage / recto / gutter 右页：天头沉降越高，页面上方留白越足，正文行数相应收短
    const sinkRelief = clamp((s.sink - 4) * 0.42, 0, 18);
    const baseTextInk = s.cueMode === "empty" ? 3 : 33 - sinkRelief;
    const spoilerAdd = s.cueMode === "spoiler" ? 21 : 0;
    const scaleAdd = clamp((s.scale - 1.2) * 1.4, 0, 4.5);
    rectoInk = baseTextInk + spoilerAdd + scaleAdd;
  }

  // 书眉/顶角页码对呼吸感的微扰
  const headerNoise = (s.runningHead ? 2.5 : 0) + (s.folio === "top" ? 1 : 0);
  if (s.placement !== "recto") versoInk += s.runningHead && s.placement === "inline" ? 0 : 0;
  if (s.placement === "inline") {
    rectoInk = 41 + Math.round(headerNoise * 0.5);
    versoInk = 46;
  } else {
    rectoInk += headerNoise;
  }

  versoInk = clamp(Math.round(versoInk), 1, 58);
  rectoInk = clamp(Math.round(rectoInk), 2, 62);

  // 扉页核心视域的平均墨水灰度（单页起章重点看右页，跨页/左空右启综合双页）
  const openerInk =
    s.placement === "spread" || s.placement === "recto"
      ? Math.round((versoInk * 0.42 + rectoInk * 0.58))
      : s.placement === "anypage"
        ? Math.round(rectoInk)
        : Math.round((versoInk + rectoInk) / 2);

  // 净留白率（%）与跨章灰度落差（个百分点）
  const netWhite = clamp(100 - openerInk, 18, 98);
  const deltaInk = prevChapterInk - openerInk; // 正值表示比上章正文明显更空、更轻
  const dropPhrase =
    deltaInk <= 0
      ? `毫无降灰（反而密过上章 ${Math.abs(deltaInk)}%）`
      : `降灰只有 ${deltaInk}%`;

  // 检查天头沉降是否在合理带（经验参考 20%–44%）
  const sinkTooLow = s.sink < 18;
  const sinkTooDeep = s.sink > 48;
  const sinkOk = !sinkTooLow && !sinkTooDeep;

  // 检查新章分界与留白重置
  const isInline = s.placement === "inline";
  const isGutterCollision = s.placement === "gutter";
  const isEmptyShell = s.cueMode === "empty";
  const isSpoilerWall = s.cueMode === "spoiler";
  const isFlatHierarchy = s.cueMode === "flat" || s.scale < 1.9;
  const headerDirty = s.runningHead || s.folio === "top";
  const indentWarn = s.firstIndent && s.placement !== "spread";

  // 四项核心维度判定（多组合法解皆可 4/4 通关）
  // 1. 板块切分与落位（另起新页/左空右启/跨页门扉，且不压脊）
  const checkSection = !isInline && !isGutterCollision;
  // 2. 思维重置与天头沉降（沉降落在 18%–48%，且跨章灰度落差 ≥ 18 个百分点，且不是彻底空壳）
  const checkReset = sinkOk && deltaInk >= 18 && !isEmptyShell && !isSpoilerWall;
  // 3. 书页净场（隐去旧书眉且页码不留在顶角；若为带首段排印，首段顶格不缩进）
  const checkClean = !headerDirty && !indentWarn;
  // 4. 章节聚焦与内容提示（字号比 ≥ 2.0× 且为精炼引语，非平灰、非剧透墙、非无锚空壳）
  const checkFocus = !isFlatHierarchy && !isSpoilerWall && !isEmptyShell;

  const passedCount = [checkSection, checkReset, checkClean, checkFocus].filter(Boolean).length;

  // 九类错态诊断（按读者感知破坏力排序，绝不写死常量，全部嵌入当前实测数值）
  let code = "ok";
  let badge = "4/4 扉页成立";
  let headline = "";
  let reason = "";
  let nextStep = "";
  let severity = "pass"; // 'err' | 'warn' | 'pass'

  if (isInline) {
    code = "inline-seam";
    severity = "err";
    badge = `${passedCount}/4 · 接排粘连`;
    headline = `新章硬接在旧章尾段下，${dropPhrase}`;
    reason = `上章密排正文灰度 ${prevChapterInk}%，当前页仍在 ${openerInk}%，眼睛连停顿的机会都没有，直接把第二章当成上一章的普通小节扫过去，右页拱门也被旧正文死死堵在门外。`;
    nextStep = "先把「开章落位」切到「跨页门扉」「左空右启」或「另起新页」，或直接点击书页上的红色接排告警。";
  } else if (isGutterCollision) {
    code = "gutter-cut";
    severity = "err";
    badge = `${passedCount}/4 · 压脊吞字`;
    headline = "主标题横跨书脊装订沟，翻开后中间字形会被吞折";
    reason = "平装胶装或锁线精装在中缝处都会向内弯陷 8–14mm。把核心章名跨过中缝排布，读者必须使劲压平书脊才能拼全字形，仪式感瞬间破碎。";
    nextStep = "把「开章落位」改为「跨页门扉」（左字右门避开中缝）或「左空右启」，让文字完整留在单页版心内。";
  } else if (isEmptyShell) {
    code = "empty-shell";
    severity = "err";
    badge = `${passedCount}/4 · 空壳无锚`;
    headline = `净留白冲到 ${netWhite}%，但读者翻开不知身处第几章`;
    reason = "留白是为了衬托章节锚点，不是把书印成白纸。没有章号、标题与内容提示，读者会以为印厂漏印了一页，反而破坏信任感。";
    nextStep = "把「内容提示」切到「精炼引语」，重新立起章号、标题与一句氛围导语。";
  } else if (isSpoilerWall) {
    code = "spoiler-wall";
    severity = "err";
    badge = `${passedCount}/4 · 剧透过载`;
    headline = `扉页塞满提要清单，灰度飙到 ${openerInk}%（${dropPhrase}）`;
    reason = "扉页负责给预期，不是替目录和正文剧透。塞进四条长摘要后，净留白跌到 " + netWhite + "%，视觉重量直逼密排正文，读者的心理切换彻底失效。";
    nextStep = "把「内容提示」收回到「精炼引语」，只留一句定调短句，或点击书页上的红色摘要块清除。";
  } else if (sinkTooDeep) {
    code = "over-sink";
    severity = "err";
    badge = `${passedCount}/4 · 沉底挤爆`;
    headline = `天头沉降拉到 ${s.sink}%，章头被压向地脚边缘`;
    reason = "天头沉降的经验舒适带约在 22%–40%。压过 48% 后，上方空得像排版失误，章名与开篇正文全部挤在底部窄条里，版心失衡。";
    nextStep = "把「天头沉降」滑回 22%–40% 区间，让上方留白与下方字块形成稳当的承托比例。";
  } else if (sinkTooLow) {
    code = "no-sink";
    severity = "err";
    badge = `${passedCount}/4 · 零沉降顶头`;
    headline = `天头沉降只有 ${s.sink}%，章名死顶在版心最顶行`;
    reason = "传统书籍章头之所以要「沉下去」（Sink），就是为了让翻页后的第一眼先撞见一片宁静的天头白纸。顶在最上沿，看起来像普通二级小标题。";
    nextStep = "把「天头沉降」拉到 22%–38%（经验值），或在书页上点红色沉降标尺一键拉开。";
  } else if (headerDirty) {
    code = "dirty-header";
    severity = "err";
    badge = `${passedCount}/4 · 旧书眉窜章`;
    headline = s.runningHead
      ? "扉页顶上还挂着「第一章」书眉，像没换章一样"
      : "顶角页码仍停在普通正文位，削弱了扉页静气";
    reason = "《芝加哥手册》与布林赫斯特都强调：章节扉页应隐去顶部书眉（Running Head），页码下沉到底部居中或隐藏，避免旧章文字和顶角数字抢戏。";
    nextStep = "点击书页顶部的红色旧书眉将其抹掉，或把下方「书眉」切为「隐去」、「页码」切为「底心/隐藏」。";
  } else if (isFlatHierarchy) {
    code = "flat-hierarchy";
    severity = "err";
    badge = `${passedCount}/4 · 层级平灰`;
    headline = `章标只比正文大 ${s.scale.toFixed(1)}×，视觉焦点立不起来`;
    reason = "海报讲「章节聚焦 CHAPTER」：翻过新页的一瞬间，眼睛必须零犹豫锁定章号与章名。字号比低于 2.0× 时，章题和导语糊在一起。";
    nextStep = "拉高「章标字比」到 2.2× 以上，并确保「内容提示」为「精炼引语」。";
  } else if (indentWarn) {
    code = "first-indent";
    severity = "warn";
    badge = `${passedCount}/4 · 首段多缩`;
    headline = "新章首段仍留了首行缩进，缺口破坏左轴整齐";
    reason = "首行缩进的作用是区分「上一段和下一段」。章节开头前面没有上一段，再缩进两格反而显得像从半截插进来；改为顶格起笔更利落。";
    nextStep = "把「首段起笔」切为「顶格起笔」，四项排印规则即全部成立。";
  } else if (deltaInk < 18) {
    code = "low-drop";
    severity = "warn";
    badge = `${passedCount}/4 · 落差偏弱`;
    headline = `跨页灰度落差只有 ${deltaInk}%，呼吸感还差一口气`;
    reason = `上章正文灰度 ${prevChapterInk}%，当前扉页 ${openerInk}%。把沉降再拉开几分，或切到「左空右启 / 跨页门扉」，翻页刹那的节奏顿挫会立刻清晰起来。`;
    nextStep = "适度增大天头沉降（至 26%–38%）或切换到「左空右启」「跨页门扉」。";
  } else {
    code = "ok";
    severity = "pass";
    const styleName =
      s.placement === "spread"
        ? "原海报跨页门扉解"
        : s.placement === "recto"
          ? "精装左空右启解"
          : "平装另起沉降解";
    badge = `4/4 · ${styleName}`;
    headline = `跨页灰度直降 ${deltaInk}%，一翻页就能感到「进门换章」`;
    reason = `天头沉降 ${s.sink}%、净留白 ${netWhite}%、章标字比 ${s.scale.toFixed(1)}×，书眉已净且无压脊风险。试试左右横拖摊开的书页，亲手感受从上章密排正文（${prevChapterInk}% 灰）翻入本章扉页（${openerInk}% 灰）再接进正文的呼吸节奏。`;
    nextStep = "也可以试试「精装右页解」「平装另起解」对比不同出版物解法，或点「试错」观察反例。";
  }

  // 门扇物理推开进度（0.08 仅露微缝 → 1.0 完全敞开）——同时驱动主画布拱门与刊头微型门徽
  const doorOpen = clamp(
    0.12 + passedCount * 0.22 - (isGutterCollision || isSpoilerWall || isEmptyShell ? 0.14 : 0),
    0.08,
    1.0
  );

  // 原海报底带五枚关键词的实时状态（单真源同步）
  const keywords = [
    {
      id: "transition",
      zh: "过渡引导",
      en: "TRANSITION",
      ok: checkSection && !headerDirty,
      tag: isInline ? "接排粘连" : isGutterCollision ? "跨脊断裂" : headerDirty ? "旧眉拖尾" : "顺畅过渡",
    },
    {
      id: "chapter",
      zh: "章节聚焦",
      en: "CHAPTER",
      ok: checkFocus,
      tag: isEmptyShell ? "无锚空白" : isFlatHierarchy ? `仅 ${s.scale.toFixed(1)}×` : `焦点 ${s.scale.toFixed(1)}×`,
    },
    {
      id: "cue",
      zh: "内容提示",
      en: "CUE",
      ok: s.cueMode === "balanced" && !isInline,
      tag: isSpoilerWall ? "剧透过载" : isEmptyShell ? "提示缺失" : s.cueMode === "flat" ? "混入正文" : "一句定调",
    },
    {
      id: "reset",
      zh: "重置思维",
      en: "RESET",
      ok: checkReset,
      tag: sinkTooDeep ? `沉底 ${s.sink}%` : deltaInk <= 0 ? "零降灰" : deltaInk < 18 ? `仅降 ${deltaInk}%` : `降灰 ${deltaInk}%`,
    },
    {
      id: "section",
      zh: "板块划分",
      en: "SECTION",
      ok: checkSection && checkClean,
      tag: isInline ? "未断页" : indentWarn ? "首段多缩" : s.placement === "spread" ? "跨页成章" : s.placement === "recto" ? "右页起章" : "新页独立",
    },
  ];

  // 书页内可直点修复的红标清单（单真源供 renderer 绘制和 pointer 命中）
  const hotFixes = [];
  if (isInline) {
    hotFixes.push({ id: "fix-inline", label: "× 接排未断页 · 点另起新页", zone: "right-top-mid", patch: { placement: "spread" } });
  }
  if (isGutterCollision) {
    hotFixes.push({ id: "fix-gutter", label: "× 标题压脊 · 点避开中缝", zone: "spine-mid", patch: { placement: "spread" } });
  }
  if (s.runningHead) {
    hotFixes.push({ id: "fix-head", label: "× 旧书眉未清 · 点隐去", zone: "right-head", patch: { runningHead: false, folio: "bottom" } });
  } else if (s.folio === "top") {
    hotFixes.push({ id: "fix-folio", label: "× 顶角页码 · 点移底心", zone: "right-head", patch: { folio: "bottom" } });
  }
  if (sinkTooLow && !isInline) {
    hotFixes.push({ id: "fix-sink", label: `× 沉降仅 ${s.sink}% · 点拉至 30%`, zone: "right-sink", patch: { sink: 30 } });
  } else if (sinkTooDeep) {
    hotFixes.push({ id: "fix-oversink", label: `× 沉底 ${s.sink}% · 点回 30%`, zone: "right-bottom", patch: { sink: 30 } });
  }
  if (isSpoilerWall) {
    hotFixes.push({ id: "fix-spoiler", label: "× 剧透长墙 · 点收成一句", zone: "right-mid", patch: { cueMode: "balanced" } });
  } else if (isEmptyShell) {
    hotFixes.push({ id: "fix-empty", label: "× 空壳无锚 · 点补章标", zone: "right-mid", patch: { cueMode: "balanced", scale: 2.9 } });
  } else if (isFlatHierarchy && !isInline) {
    hotFixes.push({ id: "fix-scale", label: `× 字比仅 ${s.scale.toFixed(1)}× · 点拉阶`, zone: "right-title", patch: { cueMode: "balanced", scale: 3.0 } });
  }
  if (indentWarn && !isInline && !isGutterCollision && hotFixes.length < 3) {
    hotFixes.push({ id: "fix-indent", label: "× 首段多缩 · 点改顶格", zone: "right-para", patch: { firstIndent: false } });
  }

  // 根据当前翻页进度 flow 算出阅读位置文案
  let flowLabel = "正在编排 · 第二章扉页跨页";
  if (s.flow < -0.28) flowLabel = "向左回翻 · 对照第一章密排正文";
  else if (s.flow > 0.28) flowLabel = "向右掀进 · 检验第二章正文承接";

  return {
    state: s,
    theme: THEMES[s.theme] || THEMES.poster,
    prevChapterInk,
    nextChapterInk,
    versoInk,
    rectoInk,
    openerInk,
    netWhite,
    deltaInk,
    passedCount,
    checks: { checkSection, checkReset, checkClean, checkFocus },
    code,
    severity,
    badge,
    headline,
    reason,
    nextStep,
    doorOpen,
    keywords,
    hotFixes: hotFixes.slice(0, 3),
    flowLabel,
  };
}

// ---------- 第 01 节：五重功能剖视数据 ----------
export const ANATOMY_ROLES = [
  {
    id: "transition",
    no: "01",
    zh: "过渡引导",
    en: "TRANSITION",
    summary: "用视觉节奏把上一章的余韵收住，再把目光平顺牵进新章。",
    detail:
      "读完一章密排文字，大脑还停留在上一条论点或情节里。扉页就像书里的一小段走廊：先撤走书眉、拉开大块暖白，再用一条拱门光路或章号轴线把视线引向新起点。",
    zone: "corridor",
    metric: "灰阶从 46% 骤降至 ~15%",
  },
  {
    id: "chapter",
    no: "02",
    zh: "章节聚焦",
    en: "CHAPTER",
    summary: "把整页视觉重心收束到唯一的章号与章名，零竞争对手。",
    detail:
      "扉页最忌四面开花。章号定序、章名定意，二者字号比正文拉开 2.2×–3.8×（经验值），四周留白托住中心，读者 0.5 秒就能确认自己身在何处。",
    zone: "title",
    metric: "章标 / 正文字比 2.4×–3.6×",
  },
  {
    id: "cue",
    no: "03",
    zh: "内容提示",
    en: "CUE",
    summary: "点破本章气质与方向，吊起期待，但绝不提前剧透全文。",
    detail:
      "小说用一句短引语或一幅静谧插画定调，教材用三行提纲预告主线。给到「方向感」就停手，把真正的发现留给后面的正文页。",
    zone: "cue",
    metric: "导语控制在 1–3 行",
  },
  {
    id: "reset",
    no: "04",
    zh: "重置思维",
    en: "RESET",
    summary: "在视觉上制造一道「门框」，替工作记忆清空旧缓存。",
    detail:
      "认知心理学家拉德万斯基与科普兰（2006）发现，跨过一扇门会促使大脑归档旧情境模型。161 原海报把扉页直接画成一扇推开的门，精准点破了这份心理功用。",
    zone: "doorway",
    metric: "天头沉降 22%–40%（经验）",
  },
  {
    id: "section",
    no: "05",
    zh: "板块划分",
    en: "SECTION",
    summary: "让整本书的骨架在翻动书口时清晰可触，确立宏观结构。",
    detail:
      "当一本书有十余章时，统一的扉页模板就像建筑里的楼层平台：快速翻动书页时，几片规则出现的浅白页立刻标出全书的起承转合。",
    zone: "spread",
    metric: "全书同一沉降与章标体系",
  },
];

// ---------- 第 02 节：四时代历史标本数据 ----------
export const HISTORY_ERAS = [
  {
    id: "rubric",
    year: "中世纪手抄本",
    title: "朱笔红字与起首标语（Rubrication & Incipit）",
    tag: "约 12–15 世纪",
    desc: "早期羊皮纸手抄本没有独立扉页，抄写员改用朱砂红墨（拉丁文 ruber）写下起首语「Incipit」（此处开始），再配一枚绘金饰首字母，让读者在密排黑字里一眼认出新章起点。",
    spec: "红墨标界 · 饰首大字 · 无独立停顿页",
  },
  {
    id: "recto",
    year: "古典活字与书籍建筑",
    title: "右页起章与天头沉降（Recto & Sink）",
    tag: "16–20 世纪成型",
    desc: "铅字印刷成熟后，重要章节固定落在奇数右页（Recto），顶部留出数行到三分之一页高的天头沉降（Sink），省去书眉并把页码沉至底心。这一礼节被《芝加哥手册》与扬·契歇尔德（1975/1991）系统总结。",
    spec: "奇数右页 · 沉降 1/4–1/3 · 去书眉 · 首段顶格",
  },
  {
    id: "swiss",
    year: "现代主义网格扉页",
    title: "不对称比例与精确留白（Bringhurst 1992 / Hendel 1998）",
    tag: "20 世纪后期",
    desc: "罗伯特·布林赫斯特在《字体排印风格要素》（1992）中强调扉页沉降须与整本书的版心比例呼应；理查德·亨德尔在《论书籍设计》（1998）中指出，每本书的扉页都应服从文本气质与印张预算，没有放之四海皆准的死尺寸。",
    spec: "非对称轴线 · 严格对齐基线网格 · 服务文本气质",
  },
  {
    id: "threshold",
    year: "当代跨页与认知边界",
    title: "图像门扉与「门框效应」（Radvansky & Copeland 2006）",
    tag: "2006–至今",
    desc: "画册、年报与品牌书把整组对开双页打造成沉浸式门扉：左页留白立字，右页铺陈氛围视觉。认知研究（Radvansky & Copeland, 2006; Radvansky & Zacks, 2014）也为这种设计补上了心理学注解——明确的边界信号能帮大脑切换情境模型。",
    spec: "双页协同 · 灰阶断层重置 · 跨媒介延续",
  },
];

// ---------- 第 03 节：24 页书口速翻节律模型 ----------
export const THUMB_MODES = [
  {
    id: "none",
    label: "无扉页直连",
    openerInk: 45,
    versoBlank: false,
    note: "24 页全是 44%–46% 的密排灰块。快速翻书时，第 1、2、3 章毫无视觉停顿，想回找第二章只能逐页细看。",
  },
  {
    id: "light",
    label: "平装轻沉降",
    openerInk: 25,
    versoBlank: false,
    note: "每章起页拉开约 26% 天头沉降、撤除书眉。翻页时会出现一道清晰的浅亮闪切，兼顾纸张预算与分章识别。",
  },
  {
    id: "recto",
    label: "精装左空右启",
    openerInk: 14,
    versoBlank: true,
    note: "左页大片留白加右页深沉降，在书口节律里切出两页宽的明朗气口。手指一划就能稳稳停在新章门口。",
  },
  {
    id: "spread",
    label: "跨页视觉门扉",
    openerInk: 16,
    versoBlank: true,
    note: "双页协同营造完整氛围与主题色带，在连续阅读中不仅标出分界，更把情绪温度提前调到下一章的频率。",
  },
];

export function buildThumbBook(modeId) {
  const mode = THUMB_MODES.find((m) => m.id === modeId) || THUMB_MODES[0];
  // 24 页：Ch1 (p1-8), Ch2 (p9-16), Ch3 (p17-24)
  const pages = [];
  for (let p = 1; p <= 24; p++) {
    const ch = p <= 8 ? 1 : p <= 16 ? 2 : 3;
    const isOpener = p === 1 || p === 9 || p === 17;
    const isPrevBlank = mode.versoBlank && (p === 8 || p === 16);
    let ink = 44 + ((p * 7) % 5) - 2; // 42–46% 密排波动
    let kind = "body";
    if (isOpener) {
      ink = mode.openerInk;
      kind = mode.id === "none" ? "body" : "opener";
    } else if (isPrevBlank) {
      ink = 4;
      kind = "verso-rest";
    }
    pages.push({ page: p, chapter: ch, ink, kind });
  }
  const avgBody = 45;
  const maxContrast = Math.max(0, avgBody - mode.openerInk);
  return { mode, pages, maxContrast };
}

// ---------- 第 04 节：印张页耗与中缝风险模型 ----------
export function computeBudget(strategy, chapters) {
  const n = clamp(Number(chapters) || 12, 4, 24);
  // 经验概率：单章末尾落在奇数页和偶数页大致各占一半，强制右页起章平均每章多耗约 0.5 页空白左页（不含第 1 章固定右页）
  if (strategy === "recto") {
    const extraPages = Math.round((n - 1) * 0.5);
    return {
      strategy,
      title: "精装奇数右页起章（Recto）",
      extraPages,
      gutterRisk: "极低（文字与图形全落单页版心）",
      verdict: `全书 ${n} 章约增加 ${extraPages} 页空白偶数左页（按奇偶尾页各半估算）。仪式感最足，适合精装文学、传记与思想类专著。`,
    };
  }
  if (strategy === "anypage") {
    return {
      strategy,
      title: "平装任意新页起章（Any New Page）",
      extraPages: 0,
      gutterRisk: "低（需注意左右页装订内边距略宽于外切口）",
      verdict: `全书 ${n} 章零空白页开销，精准压住 16 页/32 页一印张的成本。靠 24%–32% 天头沉降与去书眉照样稳稳分章，是大印量平装书的首选。`,
    };
  }
  const extraPages = Math.round((n - 1) * 0.5) + n;
  return {
    strategy,
    title: "全跨页视觉门扉（Full Spread）",
    extraPages,
    gutterRisk: "中高（严禁把关键中文标题或人像细节压在书脊中缝）",
    verdict: `全书 ${n} 章需为每章独占整组双页，约多占 ${extraPages} 页印张。氛围最饱满，适合建筑画册、品牌年鉴与艺术图录，排版时须让文字完整落在一侧单页。`,
  };
}

// ---------- 第 05 节：五种出版物蓝图 ----------
export const CONTEXT_SPECS = [
  {
    id: "novel",
    label: "文学小说",
    en: "LITERARY FICTION",
    sink: "30%–38%",
    layout: "单右页素扉 · 极少插图",
    elements: "罗马/汉字章序 + 精炼章名 + 可选短引语 + 顶格正文",
    avoid: "避免塞入人物关系表或剧情预告，破坏沉浸感。",
    note: "呼吸感靠字体比例与大方天头沉降撑起，不必画繁复底纹。",
  },
  {
    id: "textbook",
    label: "教材与专著",
    en: "TEXTBOOK & MONOGRAPH",
    sink: "22%–28%",
    layout: "结构化右页 · 带 3 条导学提纲",
    elements: "醒目章号 + 章题 + 本章核心问题 3 条 + 关键词索引",
    avoid: "避免把整节正文搬进扉页，提纲超过 5 条就应交回目录。",
    note: "读者的核心诉求是「快速建立学习地图」，提示比诗意更重要。",
  },
  {
    id: "artbook",
    label: "艺术与建筑画册",
    en: "ART & ARCHITECTURE",
    sink: "26%–36%",
    layout: "左满版氛围图 × 右极简留白题字",
    elements: "左页情绪主图或材质色块 + 右页大留白章名与年份",
    avoid: "严禁把核心主图人物或标题文字横劈进胶装书脊沟。",
    note: "如果整本书以连续作品编目为主，则应转向图录版式而非逐章做重扉页。",
  },
  {
    id: "annual",
    label: "年报与商业提案",
    en: "ANNUAL REPORT / DECK",
    sink: "24%–32%",
    layout: "板块主题色切换 × 大号序号锚点",
    elements: "特大章节号 02 + 一句核心结论 + 板块色带切换",
    avoid: "避免把 KPI 报表直接堆在扉页，先让听众知道换了议题。",
    note: "商业演示里，扉页把「财务」「战略」「产品」切开，能显著减少听众串台。",
  },
  {
    id: "ebook",
    label: "电子书与长文网页",
    en: "E-BOOK & LONG-FORM WEB",
    sink: "14%–22% 视口高",
    layout: "自适应顶部留白 + 清晰章标细线",
    elements: "语义章标 + 细分隔线 + 简短导语 + 立即可见首段",
    avoid: "切忌在手机屏硬塞 100vh 空白页——读者只会以为网页没加载出来。",
    note: "屏幕没有物理翻页动作，靠明暗底色切换与克制留白完成心理换挡。",
  },
];

// ---------- 第 06 节：什么时候别用章节扉页（四场景对照） ----------
export const SKIP_SCENARIOS = [
  {
    id: "short-memo",
    label: "1 页短文 / 内部备忘录",
    badTitle: "硬加整页扉页：门比屋大",
    badDesc: "正文总共 800 字，却先放一页只写着「第二部分」的巨幅留白扉页，读者的期待被吊得老高，翻过去却只有两段话。",
    goodTitle: "改用：24px 段前留白 + 粗体二级标题",
    goodDesc: "用轻量的字号阶差和一条细线隔开段落即可，把篇幅留给内容本身。",
    frictionBad: "冗余翻页 +100%",
    frictionGood: "零打断 · 即扫即读",
  },
  {
    id: "dictionary",
    label: "词典 / 工具手册 / 索引表",
    badTitle: "硬加诗意扉页：拖慢检索",
    badDesc: "查工具书的人不是从头读到尾，而是直奔某个词条。满页留白与意境插图只会逼用户在翻找时多翻几十张废纸。",
    goodTitle: "改用：书口拇指缺口 + 紧凑字母栏眉",
    goodDesc: "工具查询应把空间交给索引版式与快速定位边标，而非情绪停顿页。",
    frictionBad: "检索耗时拉长",
    frictionGood: "直达条目 · 高效定位",
  },
  {
    id: "pocket-budget",
    label: "严控印张的口袋平装书",
    badTitle: "硬套左空右启：印张超标",
    badDesc: "一本 30 篇短散文的小开本若硬求每篇从奇数右页起，会平白多出约 15 页全白纸，直接推高一整个印张的纸价与定价。",
    goodTitle: "改用：连续新页起篇 + 22% 轻沉降",
    goodDesc: "不强制留白左页，但每篇另起新页、撤去书眉并保持统一轻沉降，节奏与成本两全。",
    frictionBad: "空白纸耗 +15 页",
    frictionGood: "零多余空白 · 节奏不乱",
  },
  {
    id: "mobile-feed",
    label: "手机短屏 / 极速阅读流",
    badTitle: "硬搬纸书全屏空扉：疑似白屏卡死",
    badDesc: "在 390px 手机屏上塞一个占满整屏高的大留白扉页，滑进来一片空纸，用户第一反应是图片挂了，随手就关掉页面。",
    goodTitle: "改用：紧凑色带章眉 + 首段同屏露出",
    goodDesc: "用一行深松绿章标带切出板块边界，同时保证首屏下方已经露出正文首句。",
    frictionBad: "误判卡顿跳出",
    frictionGood: "边界明确 + 内容即达",
  },
];

// ---------- 第 07 节：练一练（四份第二章扉页，严格单变量差错） ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    sink: 4,
    runningHead: true,
    spoiler: false,
    gutterCut: false,
    ink: 34,
    verdictTitle: "方案 A 差在「顶死天头 + 旧书眉未清」",
    verdictText:
      "它的字号层级、左页留白和位置都没有压脊，唯独忘了两件扉页铁律：顶部还挂着「第一章 · 边界」的旧书眉与顶角页码，而且新章标题只沉了 4% 死顶在常规版心最顶行。读者翻过来第一眼会把它误认成上一章的续页。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    sink: 26,
    runningHead: false,
    spoiler: true,
    gutterCut: false,
    ink: 41,
    verdictTitle: "方案 B 差在「剧透提要塞满，失去留白重置」",
    verdictText:
      "沉降、去书眉、右页起章、避开中缝全都做对了——但它为了显得「内容充实」，在章题下方硬塞了 6 条细碎摘要与两张小框，把整页墨水灰度推到了 41%，和密排正文几乎没有落差，彻底丢掉了「重置思维」的呼吸感。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: true,
    sink: 30,
    runningHead: false,
    spoiler: false,
    gutterCut: false,
    ink: 14,
    verdictTitle: "选对了！方案 C 四个排印变量全部到位",
    verdictText:
      "左页安静留白托气，右页拉开 30% 天头沉降，撤除旧书眉并将页码下沉至底心；章号、主标题与一句精炼导语阶次分明，开篇首段顶格起笔且完全避开书脊中缝——翻开瞬间灰度从正文 46% 跌到 14%，真正做到「清晰分界、重置思维」。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    sink: 30,
    runningHead: false,
    spoiler: false,
    gutterCut: true,
    ink: 15,
    verdictTitle: "方案 D 差在「主标题横跨书脊中缝，装订吞字」",
    verdictText:
      "留白、去书眉和 30% 天头沉降都很干净，但主标题「纸页间的停顿」恰好横跨在双页装订中缝上。纸书胶装或锁线装订后，书脊沟会向里弯折 8–14mm，「间」与「的」两字直接折进黑缝里，可读性与体面感一起受损。",
  },
];
