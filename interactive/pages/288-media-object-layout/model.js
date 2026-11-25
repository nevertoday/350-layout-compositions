// 288 媒体对象布局 · 单一数据源状态与几何诊断模型
// 画布绘制、右侧三节点引注、诊单白话、四项原则实况、底沿五相月蚀圆与 CSS 代码全部由此处同源导出。

export const SCENES = {
  alpine: {
    id: "alpine",
    label: "原海报 · 阿尔卑斯晨光",
    shortLabel: "阿尔卑斯晨光",
    badgeLeft: "02:45",
    badgeRight: "HD",
    durationSec: 165,
    title: "山脉在清晨的光线下呈现层次与对比",
    caption: "光源位置决定了画面的情绪与焦点。",
    en: "Mountains reveal depth and contrast in morning light; light direction shapes mood and focus.",
    meta: [
      { icon: "user", label: "摄影师 / Ellie Chen" },
      { icon: "pin", label: "阿尔卑斯山脉" },
      { icon: "cal", label: "2024.04.12" },
      { icon: "tag", label: "风光摄影" },
    ],
    overloadTags: ["ISO 100", "24mm f/8", "14-bit RAW", "5400K", "三脚架", "HDR-03", "精选归档"],
  },
  sonar: {
    id: "sonar",
    label: "纪录片 · 深海声呐片单",
    shortLabel: "深海声呐",
    badgeLeft: "04:18",
    badgeRight: "4K",
    durationSec: 258,
    title: "热液喷口三米内聚集着盲虾群落",
    caption: "声呐波束先标出海底地形起伏，再由紧邻说明交代温度与生态边界。",
    en: "Multibeam sonar reveals the ridge first; paired notes anchor depth and thermal boundary.",
    meta: [
      { icon: "user", label: "潜航录 / 林砚深" },
      { icon: "pin", label: "马里亚纳西缘" },
      { icon: "cal", label: "2025.09.18" },
      { icon: "tag", label: "深海纪实" },
    ],
    overloadTags: ["3840m", "312℃", "ROV-09", "400kHz", "盐度 35‰", "未剪辑", "原始轨"],
  },
  comment: {
    id: "comment",
    label: "社区 · 嵌套讨论流",
    shortLabel: "嵌套评论流",
    badgeLeft: "OOCSS",
    badgeRight: "2 级",
    durationSec: 90,
    title: "固定左侧媒体块，让正文独立成栏不绕底",
    caption: "哪怕回复写到五行，正文始终守住一条笔直左轴，不会钻到头像下面。",
    en: "Fixed media beside an independent text block—the classic 2010 OOCSS blueprint.",
    meta: [
      { icon: "user", label: "回复 / 周明远" },
      { icon: "pin", label: "界面架构组" },
      { icon: "cal", label: "12 分钟前" },
      { icon: "tag", label: "3 条嵌套回复" },
    ],
    overloadTags: ["LV.9", "勋章×4", "IP 杭州", "v4.2", "已编辑", "热评 #1", "楼中楼"],
  },
};

export const ARRANGEMENTS = {
  stacked: { id: "stacked", label: "上图下文", desc: "影院展示型（288 原海报）" },
  "media-left": { id: "media-left", label: "左图右文", desc: "经典 OOCSS 横排" },
  "media-right": { id: "media-right", label: "右图左文", desc: "MDN media-flip 反转" },
};

// 开场刻意停在 0/4 失配错态：画面缩角失权 + 说明漂移断联 + 层级平灰 + 上下文空缺
export const INITIAL_STATE = {
  scene: "alpine",
  arrangement: "stacked",
  mediaShare: 0.22,
  gapPx: 68,
  hierarchy: "flat", // "clear" | "flat" | "inverted"
  contextMode: "missing", // "balanced" | "missing" | "overload"
  wrapUnder: false, // 经典 2010 float 忘建 BFC 绕排错态（横排模式触发）
  playing: false,
  progress: 0.36,
};

export const PRESETS = {
  poster: {
    label: "原海报影院解",
    patch: {
      arrangement: "stacked",
      mediaShare: 0.64,
      gapPx: 14,
      hierarchy: "clear",
      contextMode: "balanced",
      wrapUnder: false,
    },
  },
  oocss: {
    label: "OOCSS 左图右文解",
    patch: {
      arrangement: "media-left",
      mediaShare: 0.40,
      gapPx: 18,
      hierarchy: "clear",
      contextMode: "balanced",
      wrapUnder: false,
    },
  },
  flip: {
    label: "右图左文编辑解",
    patch: {
      arrangement: "media-right",
      mediaShare: 0.42,
      gapPx: 16,
      hierarchy: "clear",
      contextMode: "balanced",
      wrapUnder: false,
    },
  },
  errWrap: {
    label: "试错：绕排+喧宾",
    patch: {
      arrangement: "media-left",
      mediaShare: 0.44,
      gapPx: 46,
      hierarchy: "inverted",
      contextMode: "overload",
      wrapUnder: true,
    },
  },
  broken: {
    label: "复原 0/4 错态",
    patch: { ...INITIAL_STATE },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function formatTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * 依据实绘容器尺寸 (stageW × stageH) 与当前 state 计算全部几何框、面积占比、
 * 眼跳距离、可读性档位与 4 项原则 / 10 类错态诊断。
 */
export function evaluate(state, stageW = 720, stageH = 490) {
  const scene = SCENES[state.scene] || SCENES.alpine;
  const share = clamp(state.mediaShare, 0.16, 0.84);
  const gap = Math.round(clamp(state.gapPx, 0, 84));
  const isStacked = state.arrangement === "stacked";

  const padX = Math.max(16, Math.round(stageW * 0.04));
  const padTop = Math.max(38, Math.round(stageH * 0.088));
  const padBot = Math.max(16, Math.round(stageH * 0.04));
  const innerW = Math.max(240, stageW - padX * 2);
  const innerH = Math.max(200, stageH - padTop - padBot);

  let mediaBox;
  let captionBox;
  let caretAttached = false;

  if (isStacked) {
    // 竖排影院配对：mediaShare 控制媒体框的高度与宽度主权
    const minMediaH = Math.round(innerH * 0.24);
    const maxMediaH = Math.round(innerH * 0.72);
    const mediaH = Math.round(minMediaH + ((share - 0.16) / (0.84 - 0.16)) * (maxMediaH - minMediaH));
    // 画面过小时不仅矮，还缩窄显得寒酸；进入主导带后铺满全宽
    const widthFactor = share < 0.42 ? 0.44 + ((share - 0.16) / 0.26) * 0.56 : 1;
    const mediaW = Math.round(innerW * clamp(widthFactor, 0.44, 1));
    const mediaX = Math.round(padX + (innerW - mediaW) / 2);
    const mediaY = padTop;

    const rawCapY = mediaY + mediaH + gap;
    const availCapH = Math.max(72, stageH - padBot - rawCapY);
    const desiredCapH = state.contextMode === "overload" ? Math.min(182, Math.round(innerH * 0.42)) : Math.min(144, Math.round(innerH * 0.34));
    const capH = Math.min(availCapH, Math.max(82, desiredCapH));
    const capY = Math.min(rawCapY, stageH - padBot - capH);

    mediaBox = { x: mediaX, y: mediaY, w: mediaW, h: mediaH };
    captionBox = { x: padX, y: capY, w: innerW, h: capH };
    caretAttached = gap >= 8 && gap <= 24 && Math.abs(mediaW - innerW) < 12;
  } else {
    // 横排（左图右文 / 右图左文）
    const availW = Math.max(200, innerW - gap);
    const mediaW = Math.round(availW * share);
    const capW = Math.max(96, availW - mediaW);
    const blockH = Math.round(innerH * 0.76);
    const blockY = Math.round(padTop + (innerH - blockH) * 0.42);
    // 媒体高度保持合理画幅，不超过 blockH
    const mediaH = Math.round(Math.min(blockH, Math.max(86, mediaW * 0.78)));
    const capH = state.wrapUnder ? blockH : Math.round(Math.min(blockH, Math.max(mediaH, 180)));

    if (state.arrangement === "media-left") {
      mediaBox = { x: padX, y: blockY, w: mediaW, h: mediaH };
      captionBox = { x: padX + mediaW + gap, y: blockY, w: capW, h: capH };
    } else {
      captionBox = { x: padX, y: blockY, w: capW, h: capH };
      mediaBox = { x: padX + capW + gap, y: blockY, w: mediaW, h: mediaH };
    }
    caretAttached = gap >= 8 && gap <= 24 && !state.wrapUnder;
  }

  // 实绘几何指标（单一真源）
  const mediaArea = mediaBox.w * mediaBox.h;
  const captionArea = captionBox.w * captionBox.h;
  const actualAreaPct = Math.round((mediaArea / Math.max(1, mediaArea + captionArea)) * 100);
  const sharePct = Math.round(share * 100);
  const actualGap = isStacked
    ? Math.max(0, Math.round(captionBox.y - (mediaBox.y + mediaBox.h)))
    : state.arrangement === "media-left"
      ? Math.max(0, Math.round(captionBox.x - (mediaBox.x + mediaBox.w)))
      : Math.max(0, Math.round(mediaBox.x - (captionBox.x + captionBox.w)));

  // 估算说明区单行可容纳中文字符数（按 13.5px 均宽估算）
  const textColW = isStacked && state.contextMode !== "missing"
    ? Math.round(captionBox.w * (state.contextMode === "overload" ? 0.46 : 0.62)) - 26
    : captionBox.w - 28;
  const charsPerLine = Math.max(4, Math.floor(textColW / 13.5));

  // 层级字号比
  const hierarchyRatio = state.hierarchy === "clear" ? 1.48 : state.hierarchy === "flat" ? 1.0 : 0.82;

  // 4 项规则独立判定（支持多组合法解）
  const visualBand = isStacked ? [46, 76] : [28, 56];
  const visualTooSmall = sharePct < visualBand[0];
  const visualTooLarge = sharePct > visualBand[1] || (!isStacked && charsPerLine < 10);
  const visualOk = !visualTooSmall && !visualTooLarge;

  const gapTooFar = gap > 24;
  const gapTooClose = gap < 8;
  const wrapBug = !isStacked && state.wrapUnder;
  const edgeMisaligned = isStacked && mediaBox.w < captionBox.w - 20;
  const proximityOk = !gapTooFar && !gapTooClose && !wrapBug && !edgeMisaligned;

  const hierarchyOk = state.hierarchy === "clear";
  const contextOk = state.contextMode === "balanced";

  // 收集全部命中的失误（最多可检出 10 类）
  const faults = [];
  if (visualTooSmall) {
    faults.push({
      code: "media-starved",
      pillar: "visual",
      short: `画面仅 ${sharePct}% 失权`,
      title: `画面占比只有 ${sharePct}%，文字先声夺人抢了视觉入口`,
      detail: `原海报第一条讲「图像优先：以视觉为核心，先抓注意力，再传递信息」。${isStacked ? "影院竖排" : "横排列表"}里画面降到 ${visualBand[0]}% 以下时，读者第一眼撞进密密麻麻的字块，根本来不及先感知画面情绪。`,
      next: `在画布上向右横拖（或按 → 键），把画面占比推回 ${visualBand[0]}%–${visualBand[1]}% 经验参考带。`,
    });
  } else if (visualTooLarge) {
    faults.push({
      code: "media-bloated",
      pillar: "visual",
      short: `画面 ${sharePct}% 压垮说明`,
      title: `画面膨胀到 ${sharePct}%，把配对说明挤成窄条`,
      detail: `视觉主导不等于把说明挤出舞台。此刻说明栏单行只剩约 ${charsPerLine} 字，标题与解释被切碎折行，画面虽大却失去了「读得懂」的另一半。`,
      next: `在画布上向左横拖（或按 ← 键），把画面占比收回 ${visualBand[0]}%–${visualBand[1]}% 区间。`,
    });
  }

  if (gapTooFar) {
    faults.push({
      code: "gap-detached",
      pillar: "proximity",
      short: `间距 ${gap}px 断联`,
      title: `图文拉开了 ${gap}px 空洞，说明与画面失去归属感`,
      detail: `Richard Mayer 的空间邻近原则指出：图文一旦分开，视线要在画面与文字间反复跳跃搜寻。超过 24px 时，上指尖角脱落，说明卡像漂浮在页底的孤立引用。`,
      next: `把间距滑轨拉回 8–24px（或点画布上的红色间距标尺），让尖角重新锁回媒体边沿。`,
    });
  } else if (gapTooClose) {
    faults.push({
      code: "gap-collided",
      pillar: "proximity",
      short: `间距 ${gap}px 撞边`,
      title: `图文只隔 ${gap}px，边框几乎顶在一起显得窒息`,
      detail: `紧邻不是贴死。小于 8px 时，媒体框的描边与说明卡的边界粘成一团，信息分组的呼吸缝消失。`,
      next: `把间距微调到 10–22px，让边界彼此清晰又能一眼看出配对。`,
    });
  }

  if (wrapBug) {
    faults.push({
      code: "flow-wrap",
      pillar: "proximity",
      short: "浮动绕排折轴",
      title: "正文绕到图片底下折成 L 形，左对齐扫读轴断了",
      detail: "这是 2010 年早期写 CSS float 媒体对象最经典的翻车：忘了给文字块建立独立排版上下文（overflow: hidden / flex / grid），长说明钻到图底后，扫读起点忽左忽右。",
      next: "关掉下方「浮动绕排试错」（切回 BFC / Grid 独立栏），把说明重新收成笔直竖轴。",
    });
  } else if (edgeMisaligned && !visualTooSmall) {
    faults.push({
      code: "edge-misaligned",
      pillar: "proximity",
      short: "边线脱齐",
      title: "媒体框与说明卡左右边线没有对齐",
      detail: "竖排媒体对象靠同宽的左右边线把画面与说明收拢成一个整体；一旦宽度错开，视觉轮廓发散。",
      next: "继续拉宽画面，让媒体框与下方说明卡左右对齐。",
    });
  }

  if (state.hierarchy === "flat") {
    faults.push({
      code: "hierarchy-flat",
      pillar: "hierarchy",
      short: "1.0× 平灰无序",
      title: "标题、说明、细节字号比 1.0×，平铺成一块灰墙",
      detail: "原海报讲「标题 > 说明 > 细节，引导阅读顺序」。现在三层文字字重与明度几乎一样，眼睛从画面移过来后，找不到第一句该先读哪里。",
      next: "把「信息层级」切到「标题 > 说明 > 细节」（或点画布上平灰提示标）。",
    });
  } else if (state.hierarchy === "inverted") {
    faults.push({
      code: "hierarchy-inverted",
      pillar: "hierarchy",
      short: "标签喧宾倒挂",
      title: "元数据与标签比主说明更亮更大，阅读顺序倒挂",
      detail: "拍摄日期和标签本来是辅助验证的第三层，一旦用高饱和色块和更大字号抢走风头，读者先看见琐碎参数，核心句子反而被埋没。",
      next: "把「信息层级」切回「标题 > 说明 > 细节」，压低元数据视觉权重。",
    });
  }

  if (state.contextMode === "missing") {
    faults.push({
      code: "context-missing",
      pillar: "context",
      short: "上下文空缺",
      title: "缺少作者、地点、时间与分类，画面停在「孤图」",
      detail: "原海报第三条讲「上下文：补充背景与要点，帮助建立理解框架」。没有出处与拍摄条件，读者只能看个热闹，很难把画面放进真实语境里记住。",
      next: "把「上下文栏」切到「精准四元」，补上摄影师、地点、日期与分类锚点。",
    });
  } else if (state.contextMode === "overload") {
    faults.push({
      code: "context-overload",
      pillar: "context",
      short: "11 项标签堆砌",
      title: "塞进 11 枚参数标签占满半张卡，稀释了核心说明",
      detail: "补充上下文讲求克制——保留 3–4 项能解释画面的关键事实就够了。把相机型号、RAW 编号和档案码全堆上来，会让说明卡变成后台日志。",
      next: "把「上下文栏」收回「精准四元」，只留 4 项最帮助理解画面的信息。",
    });
  }

  const passedCount = [visualOk, proximityOk, hierarchyOk, contextOk].filter(Boolean).length;
  const allGood = passedCount === 4;

  // 汇总顶部单真源白话诊单
  let summaryBadge;
  let summaryTitle;
  let summaryDetail;
  let summaryNext;

  if (allGood) {
    const modeNote = isStacked
      ? "影院竖排配对成立：大画幅先立第一印象，尖角把说明锁在近旁。"
      : state.arrangement === "media-left"
        ? "经典 OOCSS 左图右文成立：固定媒体块与独立文字栏并肩齐边，适合连续扫读。"
        : "右图左文反转解成立：先抛出核心导语再以右侧画面收束，适合编辑专题。";
    summaryBadge = "4/4 配对成立";
    summaryTitle = `${ARRANGEMENTS[state.arrangement].label}达成「看得见、读得懂、记得住」`;
    summaryDetail = `${modeNote} 当前画面占比 ${sharePct}%（实绘面积 ${actualAreaPct}%），图文间距 ${gap}px，标题/正文比 ${hierarchyRatio.toFixed(2)}×，上下文保持 4 项精准锚点。`;
    summaryNext = "试着切到「左图右文」或「右图左文」，或者故意打开「浮动绕排」看看传统写法的坑。";
  } else {
    const top = faults[0];
    summaryBadge = `${passedCount}/4 · ${top.short}`;
    summaryTitle = top.title;
    summaryDetail = top.detail;
    summaryNext = top.next;
  }

  // 眼跳负荷档位（明确标注示意）
  const scanLoad =
    !proximityOk && gapTooFar
      ? "偏高（示意）"
      : !hierarchyOk || !visualOk
        ? "中等（示意）"
        : "顺滑（示意）";

  // 生成对应的实时现代 CSS（同源参数）
  const cssSnippet = isStacked
    ? `.media-object {\n  display: grid;\n  grid-template-rows: auto auto;\n  gap: ${gap}px; /* ${proximityOk ? "空间邻近带 8–24px" : gap > 24 ? "⚠ 超过 24px 易断联" : "⚠ 小于 8px 易撞边"} */\n}\n.media-frame { width: ${Math.round((mediaBox.w / innerW) * 100)}%; aspect-ratio: 16 / 10; }\n.media-caption { display: grid; grid-template-columns: ${state.contextMode === "missing" ? "1fr" : state.contextMode === "overload" ? "1fr 1.1fr" : "1.55fr 1fr"}; }`
    : `.media-object {\n  display: ${state.wrapUnder ? "block /* ⚠ float 缺 BFC */" : "grid"};\n  grid-template-columns: ${state.arrangement === "media-left" ? `${sharePct}% 1fr` : `1fr ${sharePct}%`};\n  gap: ${gap}px;\n  align-items: start;\n}`;

  return {
    scene,
    mediaBox,
    captionBox,
    caretAttached,
    sharePct,
    actualAreaPct,
    gap,
    actualGap,
    charsPerLine,
    hierarchyRatio,
    visualBand,
    scanLoad,
    checks: {
      visual: {
        ok: visualOk,
        badge: visualOk ? `${sharePct}% 主导` : visualTooSmall ? `${sharePct}% 偏弱` : `${sharePct}% 过胀`,
      },
      proximity: {
        ok: proximityOk,
        badge: proximityOk ? `${gap}px 锁扣` : wrapBug ? "绕排断轴" : gapTooFar ? `${gap}px 断联` : gapTooClose ? `${gap}px 撞边` : "边线脱齐",
      },
      hierarchy: {
        ok: hierarchyOk,
        badge: hierarchyOk ? `${hierarchyRatio.toFixed(2)}× 清晰` : state.hierarchy === "flat" ? "1.0× 平灰" : "标签喧宾",
      },
      context: {
        ok: contextOk,
        badge: contextOk ? "4 项精准" : state.contextMode === "missing" ? "缺锚 0 项" : "11 项过载",
      },
    },
    passedCount,
    allGood,
    faults,
    summaryBadge,
    summaryTitle,
    summaryDetail,
    summaryNext,
    cssSnippet,
  };
}
