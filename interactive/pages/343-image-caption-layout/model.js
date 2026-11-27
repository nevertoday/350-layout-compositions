// 343 图片与标题说明 幻灯片版式 · 单真源几何、诊断与正文交互数据
// 所有读数、五项解剖引注、底沿设计要点对勾与 3 秒视线轨迹均由同一份实绘几何实时推演。

export const DECKS = {
  poster: {
    id: "poster",
    label: "原海报 · 几何观景",
    shortLabel: "原海报",
    prevTitle: "第 04 页 · 文字要点回顾",
    prevBullets: [
      "旧版演示把结论、案例与数据全挤在 7 条项目符号里",
      "观众忙着低头读字，耳朵同时漏掉讲者口述的关键转折",
      "接下来切到视觉页：用一张高对比主图配合精炼说明定调",
    ],
    titles: {
      empty: "图片展示与版面说明",
      describe: "蓝底白圆、黑峰与橙方块的几何图形",
      claim: "以图为主，讲清一个观点",
      wall: "关于如何在现代演示幻灯片中利用大面积高对比度视觉图片配合简明标题与辅助说明文字来提升信息传达效率的综合阐述",
    },
    captions: {
      wall: "在一页演示幻灯片里，主图通常占据核心视野并承担视觉吸引功能，同时页面下方往往还需要放置标题、图注、补充说明、背景脉络、执行细则与注意事项等多层文字信息；如果把演讲者原本应当口头展开的案例细节、来源解释与操作步骤全部印在屏幕上，文字块就会迅速膨胀并反客为主，导致观众在读字与看图之间反复拉扯，错失主图第一眼带来的记忆冲击。",
      balanced: "通过一张具有表现力的图片，配合精炼的标题与说明文字，让信息更直观、更易理解、更容易记住。",
      minimal: "主图抓第一眼，一句标题锁结论，其余留给口述。",
      none: "",
    },
    triPoints: [
      { icon: "target", title: "聚焦核心", body: "图片突出主题，减少干扰信息。" },
      { icon: "eye", title: "辅助理解", body: "图注与说明帮助观众快速抓住要点。" },
      { icon: "arrow", title: "引导视线", body: "合理的视觉引导，让信息层层递进。" },
    ],
    visualNote: "主图：克莱因蓝天、骨白圆日、玄黑山峰与朱橙焦点方阵",
  },
  architecture: {
    id: "architecture",
    label: "建筑 · 采光剖面",
    shortLabel: "建筑剖面",
    prevTitle: "第 07 页 · 南向直晒眩光问题",
    prevBullets: [
      "传统大玻璃幕墙午后眩光超标，展厅深处照度骤降",
      "人工补光能耗占展馆全年电耗 38%，观众观展易疲劳",
      "切换至剖面实景图：看北向高窗如何一次解决均匀采光",
    ],
    titles: {
      empty: "展厅建筑剖面示意图",
      describe: "蓝色方框里的白色圆形与倾斜黑色屋顶剖面",
      claim: "北向高窗让展厅照度更均匀",
      wall: "美术馆主展厅通过将传统南向直晒窗改造为高位北向锯齿形采光天窗并配合漫反射穹顶内壁从而显著改善室内照度分布的方案说明",
    },
    captions: {
      wall: "本建筑剖面图展示了美术馆主展厅在改造过程中的屋面几何变化，其中上方圆形结构象征北向高窗引入的天空散射光区，下方深色切面代表倾斜隔热混凝土屋脊，右侧横线代表不同标高的照度测量层；在实际施工中还需综合考虑冬季保温系数、夏季遮阳百叶角度、结构梁跨度、排水坡度以及防火分区规范等十二项工程指标，因此必须在现场汇报时逐项核对确认。",
      balanced: "避开南向直射眩光，借高位天窗与弧顶漫反射，将柔和天光均匀送入展厅深处。",
      minimal: "高位北窗引入柔和散射光，兼顾照度均匀与展品保护。",
      none: "",
    },
    triPoints: [
      { icon: "target", title: "无眩光区", body: "北向天窗截断午后直射强光。" },
      { icon: "eye", title: "漫反射穹", body: "弧顶把天光柔化洒满深处墙面。" },
      { icon: "arrow", title: "光路导向", body: "45° 进光角直达核心展墙高度。" },
    ],
    visualNote: "主图：北向弧形采光穹顶、玄黑屋脊剖面与朱橙天窗标位",
  },
  product: {
    id: "product",
    label: "产品 · 机身结构",
    shortLabel: "产品结构",
    prevTitle: "第 11 页 · 轻薄机身低频瓶颈",
    prevBullets: [
      "同类便携音箱厚度压到 38mm 后，低频下潜普遍发散",
      "传统独立音腔占用过多内部体积，与电池仓互相挤占",
      "翻页看结构剖面：核心声学模组如何借斜向导流破局",
    ],
    titles: {
      empty: "新品内部结构剖面图",
      describe: "蓝底白色圆环与下方深色三角腔体的结构图",
      claim: "斜向导流腔让小机身有深低频",
      wall: "新一代紧凑型桌面声学设备内部核心发声单元、环形悬边振膜以及底部斜向倒相声学腔体联合工作以拓宽低频响应范围的完整工程解析",
    },
    captions: {
      wall: "图中中央浅色圆盘对应大口径复合振膜单元，右上橙色模块为独立功放与 DSP 驱动芯片，下方黑色楔形区域则是重新设计的斜向倒相风道；研发团队在过去八个月内共迭代了十六版注塑模具与七种阻尼棉填充密度，在消声室环境下完成了三百余组频响曲线测试，同时兼顾了整机跌落可靠性、表面阳极氧化工艺以及装配线节拍控制等量产要求。",
      balanced: "把倒相腔压进底部楔形空间，让声波沿 45° 导向通道顺畅释放，兼得紧凑体积与厚实低频。",
      minimal: "楔形导流腔释放 45° 声学路径，小机身也能稳住低频。",
      none: "",
    },
    triPoints: [
      { icon: "target", title: "大径振膜", body: "骨白振膜占据声学核心辐射面。" },
      { icon: "eye", title: "独立驱控", body: "朱橙模组紧邻振膜缩短信号路径。" },
      { icon: "arrow", title: "45° 导流", body: "斜向风道顺势导出低频驻波。" },
    ],
    visualNote: "主图：大口径骨白振膜、玄黑楔形声腔与朱橙功放核",
  },
};

export const INITIAL_STATE = {
  deck: "poster",
  orientation: "top-bottom", // "top-bottom" | "left-right" | "full-bleed"
  imageRatio: 0.30, // 0.24 .. 0.82（开场刻意压成 30% 邮票小图）
  visualMode: "cluttered", // "cluttered" | "focused" | "flat"
  titleMode: "empty", // "empty" | "describe" | "claim" | "wall"
  captionMode: "wall", // "wall" | "balanced" | "minimal" | "none"
  guideMode: "misaligned", // "misaligned" | "aligned" | "overloaded"
  scrim: true, // 满屏叠字暗罩
  focusSlot: null, // "hero" | "title" | "caption" | "explain" | "guide" | null
};

export const PRESETS = {
  // 开场错态
  broken: { ...INITIAL_STATE },
  // 三组合法多解
  poster: {
    orientation: "top-bottom",
    imageRatio: 0.63,
    visualMode: "focused",
    titleMode: "claim",
    captionMode: "balanced",
    guideMode: "aligned",
    scrim: true,
    focusSlot: null,
  },
  fullbleed: {
    orientation: "full-bleed",
    imageRatio: 0.76,
    visualMode: "focused",
    titleMode: "claim",
    captionMode: "minimal",
    guideMode: "aligned",
    scrim: true,
    focusSlot: null,
  },
  split: {
    orientation: "left-right",
    imageRatio: 0.60,
    visualMode: "focused",
    titleMode: "claim",
    captionMode: "balanced",
    guideMode: "aligned",
    scrim: true,
    focusSlot: null,
  },
  // 反向试错预设（证明不是单向点满就过关）
  errOversize: {
    orientation: "top-bottom",
    imageRatio: 0.82,
    visualMode: "focused",
    titleMode: "claim",
    captionMode: "balanced",
    guideMode: "aligned",
    scrim: true,
    focusSlot: "hero",
  },
  errRepeat: {
    orientation: "top-bottom",
    imageRatio: 0.63,
    visualMode: "focused",
    titleMode: "describe",
    captionMode: "balanced",
    guideMode: "aligned",
    scrim: true,
    focusSlot: "title",
  },
  errNoCaption: {
    orientation: "top-bottom",
    imageRatio: 0.68,
    visualMode: "focused",
    titleMode: "empty",
    captionMode: "none",
    guideMode: "aligned",
    scrim: true,
    focusSlot: "caption",
  },
  errNoScrim: {
    orientation: "full-bleed",
    imageRatio: 0.78,
    visualMode: "focused",
    titleMode: "claim",
    captionMode: "minimal",
    guideMode: "aligned",
    scrim: false,
    focusSlot: "explain",
  },
  errOverGuide: {
    orientation: "top-bottom",
    imageRatio: 0.63,
    visualMode: "focused",
    titleMode: "claim",
    captionMode: "balanced",
    guideMode: "overloaded",
    scrim: true,
    focusSlot: "guide",
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 单真源几何计算：返回所有归一化（0..1）画布内元素矩形与重心，供 2D Canvas 绘制与诊断共同读取
export function computeLayout(state) {
  const deck = DECKS[state.deck] || DECKS.poster;
  const r = clamp(state.imageRatio, 0.24, 0.82);
  const ori = state.orientation;
  const titleText = deck.titles[state.titleMode] || "";
  const captionText = deck.captions[state.captionMode] || "";

  let imageRect;
  let captionRect;
  let divider; // { axis: "y"|"x", pos: 0..1 }

  if (ori === "left-right") {
    imageRect = { x: 0, y: 0, w: r, h: 1 };
    captionRect = { x: r, y: 0, w: 1 - r, h: 1 };
    divider = { axis: "x", pos: r };
  } else if (ori === "full-bleed") {
    imageRect = { x: 0, y: 0, w: 1, h: 1 };
    const deckH = clamp(1 - r, 0.16, 0.56);
    captionRect = { x: 0, y: 1 - deckH, w: 1, h: deckH };
    divider = { axis: "y", pos: 1 - deckH };
  } else {
    // top-bottom (原海报格局)
    imageRect = { x: 0, y: 0, w: 1, h: r };
    captionRect = { x: 0, y: r, w: 1, h: 1 - r };
    divider = { axis: "y", pos: r };
  }

  // 若主图处于杂框邮票态，有效主图只占图区内部的 56% 面积
  const innerVisualRect =
    state.visualMode === "cluttered"
      ? {
          x: imageRect.x + imageRect.w * 0.08,
          y: imageRect.y + imageRect.h * 0.14,
          w: imageRect.w * 0.54,
          h: imageRect.h * 0.72,
        }
      : { ...imageRect };

  const effectiveImageShare =
    ori === "full-bleed"
      ? state.visualMode === "cluttered"
        ? 0.42
        : clamp(r, 0.52, 0.86)
      : innerVisualRect.w * innerVisualRect.h;

  const slotImageShare = ori === "full-bleed" ? clamp(r, 0.52, 0.86) : r;
  const clutterWasteShare = Math.max(0, slotImageShare - effectiveImageShare);

  // 主图焦点位置（骨白圆日与玄黑山峰交汇处，忠实原海报比例）
  const focusPt = {
    x: innerVisualRect.x + innerVisualRect.w * 0.55,
    y: innerVisualRect.y + innerVisualRect.h * 0.48,
  };

  // 视觉引导箭头起终点（归一化）
  let guideArrow;
  if (state.guideMode === "aligned") {
    guideArrow = {
      x1: innerVisualRect.x + innerVisualRect.w * 0.08,
      y1: innerVisualRect.y + innerVisualRect.h * 0.88,
      x2: innerVisualRect.x + innerVisualRect.w * 0.31,
      y2: innerVisualRect.y + innerVisualRect.h * 0.60,
    };
  } else if (state.guideMode === "misaligned") {
    // 背离焦点指往左上角落
    guideArrow = {
      x1: innerVisualRect.x + innerVisualRect.w * 0.34,
      y1: innerVisualRect.y + innerVisualRect.h * 0.66,
      x2: innerVisualRect.x + innerVisualRect.w * 0.10,
      y2: innerVisualRect.y + innerVisualRect.h * 0.22,
    };
  } else {
    guideArrow = {
      x1: innerVisualRect.x + innerVisualRect.w * 0.08,
      y1: innerVisualRect.y + innerVisualRect.h * 0.88,
      x2: innerVisualRect.x + innerVisualRect.w * 0.32,
      y2: innerVisualRect.y + innerVisualRect.h * 0.58,
    };
  }

  // 说明区内部：标题框、正文框、三要点条
  const padX = captionRect.w * 0.065;
  const padY = captionRect.h * 0.11;
  const headlineBox = {
    x: captionRect.x + padX,
    y: captionRect.y + padY,
    w: captionRect.w - padX * 2,
    h: Math.max(0.08, captionRect.h * (state.titleMode === "wall" ? 0.34 : 0.24)),
  };

  const showTriCards =
    state.captionMode === "balanced" &&
    ori !== "full-bleed" &&
    captionRect.h >= 0.27 &&
    captionRect.w >= 0.36;

  const bodyBox = {
    x: captionRect.x + padX,
    y: headlineBox.y + headlineBox.h + captionRect.h * 0.04,
    w: captionRect.w - padX * 2,
    h: showTriCards ? captionRect.h * 0.28 : Math.max(0.06, captionRect.h - headlineBox.h - padY * 2.2),
  };

  const triCardsRect = showTriCards
    ? {
        x: captionRect.x + padX,
        y: captionRect.y + captionRect.h * 0.66,
        w: captionRect.w - padX * 2,
        h: captionRect.h * 0.27,
      }
    : null;

  const titleChars = titleText.length;
  const captionChars = captionText.length;
  const totalTextChars = titleChars + captionChars + (showTriCards ? 36 : 0);

  // 说明舱是否过扁（被主图挤碎）
  const captionSpace = ori === "left-right" ? captionRect.w : captionRect.h;
  const minCaptionNeeded =
    ori === "full-bleed"
      ? state.captionMode === "minimal"
        ? 0.19
        : 0.26
      : ori === "left-right"
        ? 0.30
        : state.captionMode === "minimal"
          ? 0.21
          : 0.29;

  const captionSqueezed = captionSpace < minCaptionNeeded && state.captionMode !== "none";
  const scrimReadable = ori !== "full-bleed" || state.scrim;

  // 3 秒眼动锚定路径（直接从实绘焦点、箭头与标题坐标生成）
  const headlineCenter = {
    x: headlineBox.x + headlineBox.w * 0.35,
    y: headlineBox.y + headlineBox.h * 0.5,
  };
  const bodyCenter = {
    x: bodyBox.x + bodyBox.w * 0.48,
    y: bodyBox.y + Math.min(bodyBox.h * 0.5, 0.1),
  };

  let gazePath;
  if (state.visualMode === "cluttered" || effectiveImageShare < 0.44) {
    // 图弱字满：目光先掉进密字墙，再迷失在杂框里来回折返
    gazePath = [
      { x: bodyCenter.x, y: bodyCenter.y, t: 0, label: "被密字拖住" },
      { x: headlineCenter.x + 0.12, y: headlineCenter.y, t: 0.28, label: "抬头找重点" },
      { x: imageRect.x + imageRect.w * 0.78, y: imageRect.y + imageRect.h * 0.5, t: 0.56, label: "杂框分散" },
      { x: focusPt.x, y: focusPt.y, t: 0.80, label: "迟疑落图" },
      { x: bodyCenter.x - 0.1, y: bodyCenter.y + 0.04, t: 1.0, label: "3秒未读完" },
    ];
  } else if (state.guideMode === "misaligned") {
    // 引导箭指偏：视线从焦点被错误箭拽向空白角落
    gazePath = [
      { x: focusPt.x, y: focusPt.y, t: 0, label: "第一眼主图" },
      { x: guideArrow.x2, y: guideArrow.y2, t: 0.42, label: "被错箭拽偏" },
      { x: headlineCenter.x, y: headlineCenter.y, t: 0.78, label: "折返找标题" },
      { x: bodyCenter.x, y: bodyCenter.y, t: 1.0, label: "路径断链" },
    ];
  } else if (state.captionMode === "none") {
    // 无图注失锚：眼睛在图里打转，找不到观点结论
    gazePath = [
      { x: focusPt.x, y: focusPt.y, t: 0, label: "第一眼主图" },
      { x: innerVisualRect.x + innerVisualRect.w * 0.76, y: innerVisualRect.y + innerVisualRect.h * 0.34, t: 0.35, label: "猜测含义？" },
      { x: innerVisualRect.x + innerVisualRect.w * 0.28, y: innerVisualRect.y + innerVisualRect.h * 0.68, t: 0.7, label: "仍在找字" },
      { x: focusPt.x, y: focusPt.y, t: 1.0, label: "多义失锚" },
    ];
  } else {
    // 清晰递进：主图焦点 → 引导势能 → 观点标题 → 精炼说明/三要点
    gazePath = [
      { x: focusPt.x, y: focusPt.y, t: 0, label: "0.4s 锁定主图" },
      { x: (focusPt.x + headlineCenter.x) * 0.5, y: (focusPt.y + headlineCenter.y) * 0.52, t: 0.36, label: "1.1s 顺势下引" },
      { x: headlineCenter.x, y: headlineCenter.y, t: 0.66, label: "1.8s 锚定观点" },
      { x: triCardsRect ? triCardsRect.x + triCardsRect.w * 0.5 : bodyCenter.x, y: triCardsRect ? triCardsRect.y + triCardsRect.h * 0.48 : bodyCenter.y, t: 1.0, label: "2.8s 带走要点" },
    ];
  }

  return {
    deck,
    imageRect,
    innerVisualRect,
    captionRect,
    divider,
    focusPt,
    guideArrow,
    headlineBox,
    bodyBox,
    triCardsRect,
    showTriCards,
    effectiveImageShare,
    clutterWasteShare,
    rawRatio: r,
    titleText,
    captionText,
    titleChars,
    captionChars,
    totalTextChars,
    captionSqueezed,
    scrimReadable,
    gazePath,
  };
}

// 单真源双向诊断：五项检查（对应原海报左侧 5 根引注 + 底沿 5 条设计要点）
export function evaluate(state) {
  const layout = computeLayout(state);
  const sharePct = Math.round(layout.effectiveImageShare * 100);
  const rawPct = Math.round(layout.rawRatio * 100);
  const clutterPct = Math.max(0, rawPct - sharePct);

  // 1. 主图（清晰有力 & 占比得当）
  let heroCheck;
  if (state.visualMode === "cluttered") {
    heroCheck = {
      ok: false,
      code: "stamp_weak",
      shortTag: `杂框缩图 ${sharePct}%`,
      headline: `主图被杂框挤成 ${sharePct}% 邮票块，第一眼毫无冲击力`,
      reason: `图片与标题说明版式的第一职责是「以图为主」。当前画面只给主图留出约 ${sharePct}% 有效面积，旁边又堆着灰框与装饰噪音，观众进页先被大片文字与边框拖走注意力，图片优势效应完全失效。`,
      action: "直接点击画布里的蓝色小图把杂框撤掉，再向右横拖画布（或拖分界滑梁）把主图占比拉进 55%–75%。",
    };
  } else if (state.visualMode === "flat") {
    heroCheck = {
      ok: false,
      code: "flat_no_focus",
      shortTag: "灰平无焦",
      headline: "主图面积够大，却缺乏鲜明焦点与明暗反差",
      reason: "版面给足了大图空间，但图像本身发灰发平、没有明确主体轮廓，观众依然要花力气去猜「该看哪里」。好图不是越大越好，而是要能一眼认出主角。",
      action: "点击画布中的主图区，恢复高对比聚焦主体。",
    };
  } else if (sharePct < 48) {
    heroCheck = {
      ok: false,
      code: "stamp_weak",
      shortTag: `主图偏小 ${sharePct}%`,
      headline: `主图只占 ${sharePct}%，整页退化成「配小图的文字页」`,
      reason: `经验上，图文版式的主图占到 55%–75% 才稳得住「图主文辅」的权重关系。现在图区仅占 ${sharePct}%，视觉引力弱于下方文字，页面变成带插图的普通文档。`,
      action: "在画布上向右横拖（或调高主图占比滑尺）到 58%–72%。",
    };
  } else if (layout.captionSqueezed) {
    heroCheck = {
      ok: false,
      code: "image_crowds_caption",
      shortTag: `图满压字 ${rawPct}%`,
      headline: `主图拉到 ${rawPct}% 过满，把说明舱挤成了窄缝`,
      reason: "「以图为主」不等于挤死文字。把主图推过界后，标题和图注只剩狭窄一条，字号被迫缩水、行距发紧，后排观众根本看不清你要锚定的观点。",
      action: "向左横拖画布略收主图占比（上图下说留出 30%–42% 给说明区，或切到「满屏暗罩」并配单行精简图注）。",
    };
  } else {
    heroCheck = {
      ok: true,
      code: "ok",
      shortTag: `占幅 ${sharePct}%`,
    };
  }

  // 2. 标题（简明有力、锚定观点）
  let titleCheck;
  if (state.titleMode === "empty") {
    titleCheck = {
      ok: false,
      code: "empty_title",
      shortTag: "空洞主题词",
      headline: `标题只写了「${layout.titleText}」，没告诉观众该看懂什么`,
      reason: "图片本身天生多义（罗兰·巴特称之为多义性）。如果标题只贴一个文件名或题材标签，观众看完图仍不知道你站哪一边、想证明什么观点。",
      action: "直接点击画布下方琥珀角标 ┌ ┘ 里的标题区，把它改成一句直给结论的观点标题。",
    };
  } else if (state.titleMode === "describe") {
    titleCheck = {
      ok: false,
      code: "repeat_picture",
      shortTag: "复述画面",
      headline: "标题在逐字复述画面外观，白白浪费文字通道",
      reason: "观众眼睛 0.3 秒就能认出蓝底、白圆与黑峰，标题再去描写画面长什么样属于「无效冗余」。标题应该说图片本身说不出口的判断与意义。",
      action: "点击画布里的标题区，切换为「一句观点锚定」。",
    };
  } else if (state.titleMode === "wall") {
    titleCheck = {
      ok: false,
      code: "long_title_wall",
      shortTag: `过长 ${layout.titleChars}字`,
      headline: `标题膨胀到 ${layout.titleChars} 字，把标题写成了小作文`,
      reason: "演讲现场的标题最好一眼扫完（经验上控制在 8–16 个汉字以内）。标题堆成三四行后，字号级差塌平，观众还没读完标题，主图的第一眼张力已经散了。",
      action: "点击画布标题区，压回一句精炼断言标题。",
    };
  } else {
    titleCheck = {
      ok: true,
      code: "ok",
      shortTag: `观点 ${layout.titleChars}字`,
    };
  }

  // 3. 图注（简明扼要、不可完全缺失）
  let captionCheck;
  if (state.captionMode === "none") {
    captionCheck = {
      ok: false,
      code: "no_caption_drift",
      shortTag: "无注失锚",
      headline: "删光了图注与说明，观众看不出画面里的关键证据",
      reason: "没有精炼图注和补充说明托底时，脱离口述上下文的观众（或课后回看讲义的人）容易把图片解读跑偏。哪怕只留一句短图注，也能帮观众把图和结论焊在一起。",
      action: "点击画布下方的说明区，补回「精炼说明」或「极简单行图注」。",
    };
  } else if (state.captionMode === "wall") {
    captionCheck = {
      ok: false,
      code: "caption_overload",
      shortTag: `密字 ${layout.captionChars}字`,
      headline: `说明区塞了 ${layout.captionChars} 字密文，幻灯片退化成文档投影`,
      reason: "按梅耶的冗余原则，屏幕上铺满和讲稿一样长的文字会与视觉图像抢占同一条阅读通道——观众忙着低头逐字读完说明，既看不好图也听不清你说话。",
      action: "点击画布下方的密字说明区，裁减到 2 行以内精炼短句（或切单行极简图注）。",
    };
  } else {
    captionCheck = {
      ok: true,
      code: "ok",
      shortTag: state.captionMode === "minimal" ? `极简 ${layout.captionChars}字` : `精炼 ${layout.captionChars}字`,
    };
  }

  // 4. 说明与可读性（突出重点 + 空间邻近 + 叠字暗罩对比度）
  let explainCheck;
  if (!layout.scrimReadable) {
    explainCheck = {
      ok: false,
      code: "scrim_unreadable",
      shortTag: "叠字失读",
      headline: "满屏叠字关掉了底部暗罩，浅字直接撞上亮部看不清",
      reason: "满屏图片下方如果直接盖浅色文字，一旦遇到骨白圆日或高亮背景，文字对比度立刻跌穿可读底线。后排观众看到的是一团残影，说明彻底失效。",
      action: "开启「底部暗罩」给文字垫出深玄渐层底衬，或切回「上图下说 / 左图右说」独立说明区。",
    };
  } else if (state.captionMode === "wall") {
    explainCheck = {
      ok: false,
      code: "caption_overload",
      shortTag: "重点被淹没",
      headline: "所有解释挤成一整坨正文，没有任何视觉抓手",
      reason: "缺乏留白与要点分层时，核心信息被埋在长句中间。把说明压缩成一句主说明，或像原海报那样拆成 3 枚极短图标要点，观众一眼就能扫出重点。",
      action: "点击画布说明区精简文字，恢复清晰重点分层。",
    };
  } else if (state.captionMode === "none") {
    explainCheck = {
      ok: false,
      code: "no_caption_drift",
      shortTag: "缺少补注",
      headline: "页面缺少解释性补充，只剩纯图展示",
      reason: "如果这页确实不需要任何文字解释，应直接用纯图空白页（341）；既选了 343 图文说明版式，就需要用一句短说明补齐图片背后的逻辑。",
      action: "点击画布说明区，开启精炼说明或单行短注。",
    };
  } else if (layout.captionSqueezed) {
    explainCheck = {
      ok: false,
      code: "image_crowds_caption",
      shortTag: "说明区过窄",
      headline: "说明区空间不足，要点栏被迫折叠消失",
      reason: "主图比例挤占过多后，说明舱高度不够，文字贴近底边喘不过气，图文之间的呼吸缓冲区消失。",
      action: "向左横拖画布，把主图占比调回舒展区间。",
    };
  } else {
    explainCheck = {
      ok: true,
      code: "ok",
      shortTag: layout.showTriCards ? "三要点分层" : "短注直达",
    };
  }

  // 5. 视觉引导（顺势指向焦点、克制不抢戏）
  let guideCheck;
  if (state.guideMode === "misaligned") {
    guideCheck = {
      ok: false,
      code: "guide_mislead",
      shortTag: "箭头背离",
      headline: "引导箭头指离画面焦点，把观众目光拽向空角",
      reason: "线条与箭头天生带有强方向指令。如果引导线背离主图核心或胡乱斜插，眼睛会被迫先走弯路再折返，反而破坏主图到标题的自然递进。",
      action: "直接点击主图左下角的白色箭头（或点左侧「视觉引导」），校准到顺势指向焦点。",
    };
  } else if (state.guideMode === "overloaded") {
    guideCheck = {
      ok: false,
      code: "guide_clutter",
      shortTag: "多箭污染",
      headline: "画布塞满 5 条杂乱标注箭，视觉引导反客为主",
      reason: "视觉引导像路标，一条就能指明方向；一旦到处画箭、画圈、拉虚线，高表达力的主图就被碎线条切得支离破碎，违背梅耶的一致性原则。",
      action: "点击主图里的箭头，收回到克制的单向顺势引导。",
    };
  } else {
    guideCheck = {
      ok: true,
      code: "ok",
      shortTag: "顺势指焦",
    };
  }

  const checks = {
    hero: heroCheck,
    title: titleCheck,
    caption: captionCheck,
    explain: explainCheck,
    guide: guideCheck,
  };

  const orderedKeys = ["hero", "title", "caption", "explain", "guide"];
  const passed = orderedKeys.filter((k) => checks[k].ok).length;

  // 选出最紧要的当前诊断（如果用户刚聚焦某槽且它未过，优先诊断它）
  const firstFailKey =
    (state.focusSlot && checks[state.focusSlot] && !checks[state.focusSlot].ok
      ? state.focusSlot
      : orderedKeys.find((k) => !checks[k].ok)) || null;

  let solutionKind = null;
  let statusPill = "";
  let tierLabel = "";
  let headline = "";
  let reason = "";
  let nextAction = "";

  if (passed === 5) {
    if (state.orientation === "full-bleed") {
      solutionKind = "fullbleed";
      statusPill = "5/5 · 满屏暗罩解";
      headline = "满屏主图配深玄暗罩，单句观点一击定调";
      reason = `主图占满画幅并留出 ${100 - rawPct}% 深墨渐层暗罩托住「${layout.titleText}」与精短图注，既有全幅视觉沉浸感，又能保证远排观众一眼读清结论。`;
      nextAction = "按 Space 试跑 3 秒投屏眼动轨迹，或切换「上图下说」「左图右说」对比另两种合法构图。";
    } else if (state.orientation === "left-right") {
      solutionKind = "split";
      statusPill = "5/5 · 宽屏双栏解";
      headline = `左图 ${sharePct}% 对望右栏说明，横向视线流畅交接`;
      reason = `在 16:9 宽屏演示里，左大右小（${rawPct}:${100 - rawPct}）既保住了主图的统治面积，又把标题与说明贴紧图侧（符合空间邻近原则），适合剖析结构剖面与产品细节。`;
      nextAction = "按 Space 观察横向 3 秒扫视路线，或试试故意关掉图注、拉爆图比，看看反向翻车长什么样。";
    } else {
      solutionKind = "poster";
      statusPill = "5/5 · 原海报典范解";
      headline = `主图占 ${sharePct}% 稳居上场，琥珀角标标题稳稳接住视线`;
      reason = `这正是 343 原海报的经典结构：高对比克莱因蓝主图先抢第一眼，45° 白色引导箭顺势收敛焦点，下方深玄说明舱用精炼标题与要点把画面精准锚定到唯一观点。`;
      nextAction = "按 Space 实测 3 秒投屏锚定效果，也可以切换「建筑剖面 / 产品结构」剧本检验泛化能力。";
    }
    tierLabel = "3 秒稳锚（示意）";
  } else {
    const fail = checks[firstFailKey];
    statusPill = `${passed}/5 · ${fail.shortTag}`;
    tierLabel = passed <= 1 ? "视线卡滞（示意）" : passed <= 3 ? "锚定偏弱（示意）" : "仅差一处（示意）";
    headline = fail.headline;
    reason = fail.reason;
    nextAction = fail.action;
  }

  return {
    layout,
    checks,
    passed,
    total: 5,
    firstFailKey,
    solutionKind,
    statusPill,
    tierLabel,
    headline,
    reason,
    nextAction,
    sharePct,
    clutterPct,
    rawPct,
  };
}

// ---------- 正文各节数据（全部核实，不编数字、不编语录） ----------

// 01 节：五件套逐层剥离矩阵
export const LAYERS_01 = [
  {
    id: "hero",
    name: "主图",
    en: "HERO VISUAL",
    posterQuote: "占据视觉中心，快速传达核心概念。",
    role: "负责第一眼捕获注意力并开启图像记忆通道（佩维奥双重编码），让复杂情景在 1 秒内具象化。",
    whenMissing: "撤掉主图后，页面立刻退化成纯文字要点页（请看 336 标题和内容版式），失去直观画面锚点。",
  },
  {
    id: "title",
    name: "标题",
    en: "ANCHOR HEADLINE",
    posterQuote: "简明有力，概括主题，与主图建立关联。",
    role: "承担罗兰·巴特所说的「锚定」职责：从图片的众多可能解读里钉死唯一观点，而不是贴文件名。",
    whenMissing: "没有标题定调时，观众各自脑补画面含义——有人看成风景、有人看成几何、有人看成建筑。",
  },
  {
    id: "caption",
    name: "图注",
    en: "CONCISE CAPTION",
    posterQuote: "对主图进行简要解释或补充说明。",
    role: "紧挨图片点出肉眼看不见的背景（时间、地点、拍的什么部位），遵循梅耶的空间邻近原则。",
    whenMissing: "少了图注交代语境，图片变成脱离事实来源的装饰画，听众会怀疑「这张图跟结论有什么关系」。",
  },
  {
    id: "explain",
    name: "说明",
    en: "KEY TAKEAWAYS",
    posterQuote: "补充关键信息，帮助观众理解要点。",
    role: "提炼 1–3 条极短结论或要点（原海报以「聚焦核心 / 辅助理解 / 引导视线」三栏呈现），辅助听众记忆。",
    whenMissing: "缺了精炼要点承接，脱离演讲者口述后（例如会后传阅 PDF），关键推理容易断档。",
  },
  {
    id: "guide",
    name: "视觉引导",
    en: "VISUAL GUIDANCE",
    posterQuote: "用线条、形状等元素引导视线，强化逻辑。",
    role: "用一根克制的 45° 白色引导箭、琥珀色角标 ┌ ┘ 或点阵留白，把视线从主图焦点自然推向结论。",
    whenMissing: "没有引导与边界收束时，主图和下方文字各唱各调，眼球不得不在上下区块间盲扫。",
  },
];

// 02 节：一图四锚（罗兰·巴特锚定作用演示）
export const ANCHORS_02 = [
  {
    id: "claimA",
    tab: "锚定 A · 讲极简构图",
    verdict: "精准锚定",
    verdictTone: "pass",
    headline: "四枚基础几何，就能稳住整页视觉重心",
    caption: "克莱因蓝底托起骨白圆日与玄黑山峰，右上朱橙方块一笔拉出非对称张力。",
    focus: { x: 0.68, y: 0.36, r: 0.16, tag: "视线锁在圆日与朱橙方块交界" },
    takeaway: "观众 3 秒记住：「极简几何+强对比就能立住焦点」——标题成功把画面锚定到构图论断。",
    barthesNote: "属于有效的「锚定（ancrage）」：用一句话收束图像多义性，又不复述显而易见的外观。",
  },
  {
    id: "claimB",
    tab: "锚定 B · 讲色彩主次",
    verdict: "精准锚定",
    verdictTone: "pass",
    headline: "全页只留 6% 朱橙点睛，反比满屏彩色更醒目",
    caption: "深玄暗底与克莱因蓝承担 90% 面积，让唯一高饱和暖色方块瞬间成为视觉灯塔。",
    focus: { x: 0.75, y: 0.34, r: 0.12, tag: "视线瞬间收束到唯一朱橙方块" },
    takeaway: "同一张图换一句标题，观众带走的结论完全切换成「小面积高饱和强调色原则」。",
    barthesNote: "同样合法的「锚定」：证明图片本身并不自带唯一答案，真正拍板观点的是标题。",
  },
  {
    id: "describe",
    tab: "反例 · 复述画面",
    verdict: "无效冗余",
    verdictTone: "warn",
    headline: "蓝底上的白色圆圈、黑色三角形与橙色方块",
    caption: "画面中央有一个白色大圆，下方有一个黑色三角形，右上方叠放着一个橙色矩形，左侧是白色箭头。",
    focus: { x: 0.50, y: 0.52, r: 0.34, tag: "目光漫无目的扫遍全图" },
    takeaway: "观众心里冒出问号：「这些我一眼就看见了，所以你想表达什么？」",
    barthesNote: "违背多媒体互补分工：文字沦为看图说话的冗余复读机，既没增加信息，也没锚定论点。",
  },
  {
    id: "empty",
    tab: "反例 · 空洞文件名",
    verdict: "多义漂移",
    verdictTone: "fail",
    headline: "视觉参考方案 03",
    caption: "本页展示核心视觉图形样例，供现场汇报交流使用。",
    focus: { x: 0.52, y: 0.48, r: 0.42, tag: "焦点发散，各自猜测含义" },
    takeaway: "有人以为在讲日出摄影，有人以为在讲品牌 Logo，还有人以为只是过渡封面。",
    barthesNote: "放弃锚定职责：图像保持完全开放的多义状态，演讲一旦停顿，整页信息即刻失焦。",
  },
];

// 04 节：可核实历史脉络
export const TIMELINE_04 = [
  {
    year: "1964",
    short: "巴特 · 图像锚定",
    person: "Roland Barthes（罗兰·巴特）",
    work: "《图像修辞》（Rhétorique de l'image），载《Communications》第 4 期",
    fact: "法国符号学家巴特在分析广告与新闻照片时提出：任何图像天生都是「多义的」（polysemous），而配在图旁的标题与图注起到「锚定（ancrage）」作用——替观者从无数联想里钉住唯一所指。",
    slideLesson: "这正是 343 版式不能只有大图的原因：没有精准标题锚定，好图也会被不同观众读出截然相反的结论。",
    specimen: "barthes",
  },
  {
    year: "1971",
    short: "佩维奥 · 双重编码",
    person: "Allan Paivio（艾伦·佩维奥）",
    work: "《Imagery and Verbal Processes》（Holt, Rinehart and Winston，1971）",
    fact: "加拿大心理学家佩维奥提出双重编码理论（Dual Coding Theory），指出大脑分别以「非语言表象通道」与「语言符号通道」加工画面和文字；图文协同建立两条记忆检索路径，解释了为何带图信息远比纯字更易回忆（图片优势效应）。",
    slideLesson: "用高表现力主图激活表象通道，再用短标题锁住语言通道，记忆效率远高于一整页纯文字列表。",
    specimen: "paivio",
  },
  {
    year: "2001",
    short: "梅耶 · 多媒体学习",
    person: "Richard E. Mayer（理查德·梅耶）",
    work: "《Multimedia Learning》（Cambridge University Press，2001 初版 / 2020 第三版）",
    fact: "梅耶将工作记忆的双通道有限容量模型落地成多媒体设计原则：空间邻近原则要求说明文字紧挨对应画面；一致性原则要求删去无关装饰；冗余原则指出别把口述长文原样印在图旁抢占视觉通道。",
    slideLesson: "直接划定了 343 版式的三条红线：图注贴图、主图去杂框、说明绝不写成百字长稿。",
    specimen: "mayer",
  },
  {
    year: "2003–06",
    short: "塔夫特与断言-证据",
    person: "Edward Tufte / Michael Alley",
    work: "《The Cognitive Style of PowerPoint》（2003）/《The Craft of Scientific Presentations》（2003）与断言-证据模型（2006 起广传）",
    fact: "2003 年信息设计学者爱德华·塔夫特痛批默认项目符号模板削弱逻辑；同年起宾夕法尼亚州立大学迈克尔·阿莱提出并推广「断言-证据（Assertion-Evidence）」结构：顶部用一句完整结论取代名词标题，主体用图表、照片等视觉证据取代条目堆砌。",
    slideLesson: "把「标题 + 主图」升级为「论断 + 证据」，彻底打破了演讲幻灯片等于提纲文档的惯性。",
    specimen: "alley",
  },
  {
    year: "2007–08",
    short: "标准版式与视觉转向",
    person: "Microsoft PowerPoint 2007 / Garr Reynolds / Nancy Duarte",
    work: "PowerPoint 2007 九大标准版式 /《Presentation Zen》（2008）/《slide:ology》（2008）",
    fact: "微软在 PowerPoint 2007 的 9 种内置标准版式中正式收录「Picture with Caption（图片与标题说明）」；2008 年加尔·雷诺兹《Presentation Zen》（New Riders）与南希·杜阿尔特《slide:ology》（O'Reilly Media）同年面世，将大图少字的现代演示美学推向大众。",
    slideLesson: "「图片与标题说明」从此不再是设计师特权，而成为每套演示软件开箱即用的基础版式。",
    specimen: "modern",
  },
];

// 05 节：什么时候别用（附同小类兄弟页精准分流）
export const TRIAGE_05 = [
  {
    id: "compare",
    tab: "两套方案或前后对比",
    verdict: "别硬塞进单图说明页",
    whyNot: "343 的结构围绕「单一主图 + 单一观点」运转。把两张图硬拼进一个图框再共用一条底部说明，观众无法逐项对照两者的同维差异，视线在左右图与底注之间频繁折返。",
    switchTo: [
      { id: "339", name: "339 比较幻灯片版式", desc: "自带双栏独立小标，专做同维硬核对比" },
      { id: "338", name: "338 两项内容幻灯片版式", desc: "并列呈现两组独立素材或图文双轨" },
    ],
  },
  {
    id: "stock",
    tab: "手里没有真图，只能找素材凑数",
    verdict: "宁可不用图，也别放假大空装饰图",
    whyNot: "用「握手剪影」「霓虹齿轮」「模糊办公室」填满 65% 画幅，只满足了形式却违背梅耶一致性原则——装饰性图片不仅不帮理解，还会分走工作记忆并稀释专业感。",
    switchTo: [
      { id: "342", name: "342 内容与标题说明幻灯片版式", desc: "无强视觉图时，用三步结构链讲清解释逻辑" },
      { id: "336", name: "336 标题和内容幻灯片版式", desc: "稳健承接数据表、流程图与精炼要点" },
    ],
  },
  {
    id: "pacing",
    tab: "开场封面、转场换气或单句宣言",
    verdict: "别多此一举加图注和说明栏",
    whyNot: "当你只需要开篇立名、章节切场或留白十秒让听众消化一句重磅结论时，额外塞进主图和说明栏反而会打散仪式感、分散听觉注意力。",
    switchTo: [
      { id: "335", name: "335 标题幻灯片版式", desc: "整场演示的开篇门面与主副题定调" },
      { id: "337", name: "337 节标题幻灯片版式", desc: "章节之间的节奏换气与目录转场" },
      { id: "340", name: "340 仅标题幻灯片版式", desc: "一句核心宣言直接冲屏，其余交给口述" },
      { id: "341", name: "341 空白幻灯片版式", desc: "极致留白清空视觉噪音，把全场还给讲者" },
    ],
  },
  {
    id: "slideument",
    tab: "要发给别人独立离线阅读的详尽文档",
    verdict: "别把图文幻灯片改造成 Word 文档",
    whyNot: "图文说明版式天生为「现场口述 + 大屏投影」服务，说明文字只放 1–2 行钩子。如果非要把 400 字政策条款或财务附注塞进底部说明栏，大屏投影字小看不清，离线阅读又被大图打断版面。",
    switchTo: [
      { id: "336", name: "336 标题和内容幻灯片版式", desc: "需要展示结构化摘要与清单时更从容；完整长文则应回归文档排版" },
    ],
  },
];

// 06 节：严格单一变量四选一盲测
export const QUIZ_06 = {
  prompt: "你要在 30 秒内用这张建筑采光剖面图讲清一个观点：「北向高窗让展厅照度更均匀」。下面四页幻灯片的主图构图、配色、图文占比完全一致，只差「标题与图注的图文关系」这一个变量——选出传达最清晰的一页。",
  options: [
    {
      key: "A",
      correct: false,
      title: "建筑采光剖面图",
      body: "蓝色矩形里有一个白色大圆、一块黑色三角切面与右上角的橙色小方块。",
      hasArrow: true,
      mode: "describe",
      feedback: "偏弱：标题只给了一个空洞题材名，下方图注在逐字复述肉眼一眼就能看见的几何外形，既没点出「北向高窗」也没锚定「照度更均匀」的核心结论。",
    },
    {
      key: "B",
      correct: true,
      title: "北向高窗让展厅照度更均匀",
      body: "避开南向直射眩光，借高位天窗与弧顶漫反射把柔光送入深处。",
      hasArrow: true,
      mode: "ideal",
      feedback: "判断准确！大面积高对比剖面图先抓第一眼，一句话断言标题把多义画面牢牢锚定在核心观点上，一行精炼图注补足肉眼看不出的采光机理，白色短箭顺势把视线引入天窗焦点。",
    },
    {
      key: "C",
      correct: false,
      title: "北向高窗让展厅照度更均匀",
      body: "本项目依据建筑采光设计标准第 4.2 条对主展厅屋面进行整体改造，经十二个月实测冬季采光系数维持在 2.4% 以上，同时结合屋面保温层、防水卷材坡度、钢桁架跨度以及室内恒温恒湿新风管路排布方案综合优化实施。",
      hasArrow: true,
      mode: "overload",
      feedback: "文字过载：虽然标题锚定了观点，但下方塞进整段规范细则后，观众在 30 秒内忙着低头逐字读完说明，既看不好剖面图又听漏讲者口述，触发了梅耶指出的视觉通道竞争。",
    },
    {
      key: "D",
      correct: false,
      title: "",
      body: "",
      hasArrow: true,
      mode: "nocaption",
      feedback: "图像失锚：剖面图本身画得再清晰，也天生具有多义性。少了标题与短注锚定，后排观众猜不出你这页到底想夸造型极简、结构抗震还是采光均匀。",
    },
  ],
};

// 同小类 9 页完整索引（07 节使用）
export const SIBLINGS = [
  { id: "335", title: "标题幻灯片幻灯片版式", note: "整场演示的开篇门面" },
  { id: "336", title: "标题和内容幻灯片版式", note: "最通用的主标题配正文区" },
  { id: "337", title: "节标题幻灯片版式", note: "章节之间的过渡与换气" },
  { id: "338", title: "两项内容幻灯片版式", note: "双栏并列呈现两组素材" },
  { id: "339", title: "比较幻灯片版式", note: "带独立小标的双栏硬核对比" },
  { id: "340", title: "仅标题幻灯片版式", note: "一句断言冲屏、其余交口述" },
  { id: "341", title: "空白幻灯片版式", note: "极简留白把焦点还给讲者" },
  { id: "342", title: "内容与标题说明幻灯片版式", note: "三步推理与证据解释架构" },
  { id: "343", title: "图片与标题说明 幻灯片版式", note: "当前页 · 大主图配精炼锚定说明", current: true },
];
