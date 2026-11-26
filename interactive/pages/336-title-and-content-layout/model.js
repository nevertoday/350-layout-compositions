// 336 标题和内容 幻灯片版式 · 单真源几何与诊断模型
// 所有画布绘制坐标、逐字折行、留白率、图文比与四原则诊断都只从这里产出，保证画面与读数 100% 同源。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报·母版",
    tag: "BAUHAUS MASTER",
    titles: {
      vague: "关于幻灯片标题与内容版式的相关说明（一）",
      bloated: "本页重点介绍如何在一张十六比九演示幻灯片里同时兼顾标题区视觉锚点、要点文本梳理、图形互补关系与整体留白对齐规范",
      assertion: "一页一核心：标题先说结论，下方图文互补作证",
    },
    subhead: "在此输入小标题或要点",
    bulletsFull: [
      "使用简洁的文字，突出关键信息，避免把整段讲稿原封不动贴进幻灯片正文框里。",
      "每页聚焦一个核心主题，避免把背景、过程、预算与风险四件事混塞在同一屏。",
      "保持版式整齐，四周留出清晰外边距与中缝栏间距，留白有助于远距离阅读理解。",
      "文字与图形相互补充，用几何结构或数据图示解释左列观点，绝不重复复读文字。",
      "通过大小、粗细和颜色建立清晰的视觉秩序，引导观众自然顺着先标题后内容扫视。",
      "附注补充说明：若单页塞满六条长段落，观众会低头逐字默读而完全听不进演讲。",
    ],
    bulletsClean: [
      "使用简洁的文字，突出关键信息。",
      "每页聚焦一个核心主题，避免信息过载。",
      "保持版式整齐，留白有助于阅读和理解。",
      "文字与图形相互补充，增强表达效果。",
    ],
    bulletsLean: [
      "顶部标题先亮出本页唯一核心结论。",
      "左列只留三条精炼依据，省去多余修饰。",
      "右侧图形直接承担结构与比例证明。",
    ],
    bulletsSparse: [
      "这里写一点说明文字。",
    ],
    captionTitle: "图注 / 说明文字",
    captionBody: "用图形、图表或图片辅助说明要点，提升信息的理解与记忆。",
    tipText: "一页一核心，先说结论，再做解释，帮助观众快速抓住重点。",
    redundantCards: ["文字要简洁突出重点", "每页只讲一个核心", "对齐留白与图文互补"],
    chartKind: "bauhaus",
  },
  biz: {
    id: "biz",
    label: "季报·复盘页",
    tag: "BUSINESS REVIEW",
    titles: {
      vague: "第三季度会员复购与留存相关数据情况汇报",
      bloated: "针对本公司第三季度华东与华南渠道老客次月复购率变动趋势以及简化退换流程后的客户留存改善结果综合分析汇总页",
      assertion: "简化退换步骤后，老客次月复购率连升 14 个百分点",
    },
    subhead: "三项关键改动拉动留存回升",
    bulletsFull: [
      "七月起将退换货线上审批从原本四级人工复核压缩为系统自动触发，平均耗时大幅下降。",
      "退款到账周期由原先的七十二小时缩短至两小时内原路退回，显著缓解了首次下单顾虑。",
      "针对下单后十四天内未复购的高频会员，客服团队取消群发促销，改为按需回访答疑。",
      "华东与华南两大赛区同期客单价保持平稳，说明复购增长并非依赖大额补贴短期冲量。",
      "综合后台漏斗数据来看，售后体验已成为影响会员二次下单意愿的最核心决定因素。",
      "下季度计划将该自动退换机制复制至西北与西南新开站点，并持续追踪九十日留存率。",
    ],
    bulletsClean: [
      "退换审批从 4 步缩减为 1 步，耗时降 68%。",
      "退款 2 小时内自动原路到账，消除首单顾虑。",
      "客单价维持平稳，增长非大额补贴驱动。",
      "下季推广至全部区域，持续追踪 90 日留存。",
    ],
    bulletsLean: [
      "退换流程由 4 步减至 1 步，耗时降 68%。",
      "退款 2 小时原路到账，首单转化顾虑消除。",
      "客单价稳中有升，证实复购来自体验改善。",
    ],
    bulletsSparse: [
      "本季度复购数据整体向好。",
    ],
    captionTitle: "图注 · 6–9 月老客次月复购率（示意）",
    captionBody: "7 月上线自动退换后曲线连续抬升，与左列流程改动时间点一一吻合。",
    tipText: "数据页把判断写进标题，右图只突出拐点与基线，免去逐格念表。",
    redundantCards: ["退换审批减为一步", "两小时原路退款", "客单价保持平稳"],
    chartKind: "retention",
  },
  sci: {
    id: "sci",
    label: "科研·论断页",
    tag: "ASSERTION-EVIDENCE",
    titles: {
      vague: "新型双层涂膜隔热材料高温循环实验结果",
      bloated: "在连续五百小时八百摄氏度恒温热震循环测试条件下对比传统单层陶瓷涂层与新型双层梯度涂膜界面剥落率之实验总结",
      assertion: "双层梯度涂膜在 800℃ 循环下，剥落率降至单层的四分之一",
    },
    subhead: "界面应力分散抑制微裂纹扩展",
    bulletsFull: [
      "本次高温热震实验在八百摄氏度恒温炉中连续执行五百小时冷热交替，每十小时取样一次。",
      "传统单层氧化锆涂层在一百八十小时后出现明显热膨胀失配，表层迅速产生贯通性微裂纹。",
      "新型双层梯度结构在过渡层引入多孔缓冲相，将界面切应力峰值分散约百分之四十以上。",
      "扫描电镜断面观测证实，经过五百小时完整循环后双层样本表面仍保持连续致密无剥落。",
      "这一结构设计不需要更换基底合金，可直接兼容现有等离子喷涂产线，具备工程放大潜力。",
      "后续实验将进一步把测试温度上探至九百五十摄氏度，检验极端氧化环境下的长期稳定性。",
    ],
    bulletsClean: [
      "过渡缓冲层分散界面热应力，抑制裂纹贯通。",
      "单层对照组 180 小时后剥落率陡升至 28%。",
      "双层试样 500 小时循环后剥落率仅 6.8%。",
      "兼容现有喷涂工艺，无需更换合金基底。",
    ],
    bulletsLean: [
      "多孔过渡层分散热应力，阻断界面裂纹扩展。",
      "500 小时热震后剥落率 6.8%，较单层降 75%。",
      "直接适配现有喷涂线，具备量产可行性。",
    ],
    bulletsSparse: [
      "双层结构隔热效果更好。",
    ],
    captionTitle: "图注 · 800℃ 热震循环剥落率对照（示意）",
    captionBody: "横轴为循环时长，蓝线（双层）与黄线（单层）在 180h 后显著分化。",
    tipText: "学术汇报采用「论断-证据」结构：标题给结论句，右图给实验曲线。",
    redundantCards: ["缓冲层分散热应力", "单层对照易剥落", "双层结构更稳定"],
    chartKind: "curve",
  },
};

export const INITIAL_STATE = {
  scene: "poster",
  split: 0.74,       // 左文占比（相对内容总宽减去栏间距）——开场故意左胖 74:26
  marginPct: 0.025,  // 四周外边距占画幅宽比例 —— 开场故意贴边 2.5%
  gutterPct: 0.014,  // 中缝栏间距占画幅宽比例 —— 开场故意塌缩 1.4%
  titleRatio: 1.18,  // 标题/正文字号比 —— 开场故意塌平
  aligned: false,    // 标题与内容左缘是否对齐 —— 开场故意错牙
  titleMode: "vague",        // vague | bloated | assertion
  bulletMode: "overload",    // overload | clean | lean | sparse
  visualMode: "redundant",   // redundant | decorative | complement
  captionOn: false,          // 是否显示图注
  guides: {
    margin: true,
    gutter: true,
    content: true,
  },
  focusPrinciple: null, // 0..3 或 null，点击底部原则卡高亮对应测绘层
};

// 多组合法解与典型试错预设（单真源）
export const PRESETS = {
  posterBalanced: {
    label: "原海报均衡解",
    kind: "good",
    patch: {
      split: 0.52,
      marginPct: 0.072,
      gutterPct: 0.052,
      titleRatio: 2.05,
      aligned: true,
      titleMode: "assertion",
      bulletMode: "clean",
      visualMode: "complement",
      captionOn: true,
    },
  },
  visualLead: {
    label: "图主证据解",
    kind: "good",
    patch: {
      split: 0.40,
      marginPct: 0.075,
      gutterPct: 0.055,
      titleRatio: 2.15,
      aligned: true,
      titleMode: "assertion",
      bulletMode: "lean",
      visualMode: "complement",
      captionOn: true,
    },
  },
  textLead: {
    label: "文主深讲解",
    kind: "good",
    patch: {
      split: 0.58,
      marginPct: 0.068,
      gutterPct: 0.048,
      titleRatio: 1.95,
      aligned: true,
      titleMode: "assertion",
      bulletMode: "clean",
      visualMode: "complement",
      captionOn: true,
    },
  },
  errWall: {
    label: "试错：字墙贴边",
    kind: "bad",
    patch: {
      split: 0.68,
      marginPct: 0.025,
      gutterPct: 0.02,
      titleRatio: 1.25,
      aligned: true,
      titleMode: "bloated",
      bulletMode: "overload",
      visualMode: "complement",
      captionOn: true,
    },
  },
  errRepeat: {
    label: "试错：图文复读",
    kind: "bad",
    patch: {
      split: 0.52,
      marginPct: 0.07,
      gutterPct: 0.05,
      titleRatio: 2.0,
      aligned: true,
      titleMode: "assertion",
      bulletMode: "clean",
      visualMode: "redundant",
      captionOn: false,
    },
  },
  errSplit: {
    label: "试错：右胖碎行",
    kind: "bad",
    patch: {
      split: 0.27,
      marginPct: 0.07,
      gutterPct: 0.125,
      titleRatio: 2.0,
      aligned: false,
      titleMode: "assertion",
      bulletMode: "clean",
      visualMode: "complement",
      captionOn: true,
    },
  },
  resetBad: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      split: INITIAL_STATE.split,
      marginPct: INITIAL_STATE.marginPct,
      gutterPct: INITIAL_STATE.gutterPct,
      titleRatio: INITIAL_STATE.titleRatio,
      aligned: INITIAL_STATE.aligned,
      titleMode: INITIAL_STATE.titleMode,
      bulletMode: INITIAL_STATE.bulletMode,
      visualMode: INITIAL_STATE.visualMode,
      captionOn: INITIAL_STATE.captionOn,
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 近似单字宽估算（中英文混合），供 Canvas 与 model.js 共用，保证画出的行与算出的行完全一致
function charUnits(ch) {
  if (ch === " ") return 0.34;
  if (/[A-Za-z0-9]/.test(ch)) return 0.58;
  if (/[.,:;!?\-·/]/.test(ch)) return 0.36;
  return 1.0;
}

export function wrapText(text, maxPx, fontPx) {
  const safeMax = Math.max(fontPx * 2.2, maxPx);
  const lines = [];
  let line = "";
  let w = 0;
  for (const ch of text) {
    const cw = charUnits(ch) * fontPx;
    if (line && w + cw > safeMax) {
      lines.push(line);
      line = ch === " " ? "" : ch;
      w = ch === " " ? 0 : cw;
    } else {
      line += ch;
      w += cw;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function getBullets(sceneData, bulletMode) {
  if (bulletMode === "overload") return sceneData.bulletsFull;
  if (bulletMode === "lean") return sceneData.bulletsLean;
  if (bulletMode === "sparse") return sceneData.bulletsSparse;
  return sceneData.bulletsClean;
}

// 从 state 和画布逻辑宽高算出整张幻灯片的全部实绘几何
export function computeLayout(state, W = 960, H = 540) {
  const sc = SCENES[state.scene] || SCENES.poster;
  const marginX = Math.round(W * state.marginPct);
  const marginY = Math.round(H * Math.max(0.032, state.marginPct * 0.92));
  const inner = {
    x: marginX,
    y: marginY,
    w: W - marginX * 2,
    h: H - marginY * 2,
  };

  // 基础正文字号随画布宽度等比缩放，对应 16:9 基准 960px 时 16.5px（约投影 18–20pt 档）
  const baseBodyPx = (W / 960) * 16.2;
  const bodyPx = state.bulletMode === "overload" ? baseBodyPx * 0.88 : baseBodyPx;
  const titlePx = clamp(baseBodyPx * state.titleRatio, baseBodyPx * 1.05, baseBodyPx * 3.5);

  const titleText = sc.titles[state.titleMode] || sc.titles.assertion;
  const titleOffsetX = state.aligned ? 0 : Math.round(W * 0.032);
  const contentOffsetX = state.aligned ? 0 : -Math.round(W * 0.012);

  const titleMaxW = Math.max(120, inner.w - titleOffsetX - W * 0.02);
  const titleLines = wrapText(titleText, titleMaxW, titlePx);
  const titleLineH = titlePx * 1.24;
  const headerPadBottom = Math.round(H * 0.038);
  const rawHeaderH = Math.round(titleLines.length * titleLineH + headerPadBottom + (H / 540) * 14);
  const headerH = clamp(rawHeaderH, Math.round(H * 0.115), Math.round(H * 0.34));

  const headerRect = {
    x: inner.x + titleOffsetX,
    y: inner.y,
    w: inner.w - titleOffsetX,
    h: headerH,
  };

  const contentTop = inner.y + headerH + Math.round(H * 0.052);
  const contentH = Math.max(120, inner.y + inner.h - contentTop);
  const gutterW = Math.round(W * state.gutterPct);
  const usableW = Math.max(120, inner.w - gutterW);
  const leftW = Math.round(usableW * state.split);
  const rightW = usableW - leftW;

  const textCol = {
    x: inner.x + contentOffsetX,
    y: contentTop,
    w: leftW,
    h: contentH,
  };

  const gutterRect = {
    x: inner.x + leftW,
    y: contentTop,
    w: gutterW,
    h: contentH,
  };

  const visualCol = {
    x: gutterRect.x + gutterW,
    y: contentTop,
    w: rightW,
    h: contentH,
  };

  // 左列文字实绘折行
  const bullets = getBullets(sc, state.bulletMode);
  const subheadPx = bodyPx * 1.18;
  const bulletIndent = Math.round((W / 960) * 18);
  const bulletTextMaxW = Math.max(60, textCol.w - bulletIndent - 8);
  const bulletLineH = state.bulletMode === "overload" ? bodyPx * 1.72 : bodyPx * 1.50;
  const bulletGap = state.bulletMode === "overload" ? bodyPx * 0.78 : bodyPx * 0.68;

  const subheadLines = wrapText(sc.subhead, Math.max(80, textCol.w - 4), subheadPx);
  const wrappedBullets = bullets.map((b) => wrapText(b, bulletTextMaxW, bodyPx));
  const totalBulletLines = wrappedBullets.reduce((acc, ls) => acc + ls.length, 0);
  const avgCharsPerLine = totalBulletLines
    ? wrappedBullets.flat().reduce((acc, l) => acc + l.length, 0) / totalBulletLines
    : 0;

  let textUsedH = subheadLines.length * (subheadPx * 1.28) + bodyPx * 0.85;
  for (const ls of wrappedBullets) {
    textUsedH += ls.length * bulletLineH + bulletGap;
  }

  // 底部原海报风格蓝星 TIP（仅在非字墙溢满时留有呼吸空间）
  const tipH = Math.round((H / 540) * 56);
  const showTipInSlide = textUsedH + tipH + 14 <= textCol.h && state.bulletMode !== "overload";
  const textOverflow = textUsedH > textCol.h - 4;

  // 右侧图注与图形框几何
  const captionH = state.captionOn ? Math.round((H / 540) * 58) : 0;
  const graphicH = Math.max(70, visualCol.h - captionH - (state.captionOn ? 12 : 0));
  const graphicRect = {
    x: visualCol.x,
    y: visualCol.y,
    w: visualCol.w,
    h: graphicH,
  };
  const captionRect = {
    x: visualCol.x,
    y: visualCol.y + graphicH + 10,
    w: visualCol.w,
    h: captionH,
  };

  // 实算页面有效视觉占用与留白率（基于实绘块包围盒面积单真源）
  const slideArea = W * H;
  const titleBlockW = Math.min(headerRect.w, Math.max(...titleLines.map((l) => l.length * titlePx * 0.96), 80));
  const titleBoxArea = titleBlockW * (titleLines.length * titleLineH + 14);
  const textBoxH = Math.min(textCol.h, textUsedH);
  const textFillDensity = state.bulletMode === "overload" ? 0.94 : state.bulletMode === "sparse" ? 0.45 : 0.72;
  const bulletBoxArea = textCol.w * textBoxH * textFillDensity;
  const tipBoxArea = showTipInSlide ? textCol.w * tipH * 0.58 : 0;
  const visualFillFactor = state.visualMode === "redundant" ? 0.95 : state.visualMode === "decorative" ? 0.65 : 0.74;
  const visualBoxArea = graphicRect.w * graphicRect.h * visualFillFactor + (state.captionOn ? captionRect.w * captionRect.h * 0.62 : 0);

  const occupiedRatio = clamp((titleBoxArea + bulletBoxArea + tipBoxArea + visualBoxArea) / slideArea, 0.14, 0.88);
  const whitespacePct = Math.round((1 - occupiedRatio) * 100);
  const leftRatioPct = Math.round(state.split * 100);
  const rightRatioPct = 100 - leftRatioPct;

  return {
    W,
    H,
    scene: sc,
    inner,
    headerRect,
    textCol,
    gutterRect,
    visualCol,
    graphicRect,
    captionRect,
    titlePx,
    bodyPx,
    subheadPx,
    titleText,
    titleLines,
    titleLineH,
    subheadLines,
    wrappedBullets,
    bulletLineH,
    bulletGap,
    bulletIndent,
    textUsedH,
    textOverflow,
    showTipInSlide,
    tipH,
    avgCharsPerLine: Number(avgCharsPerLine.toFixed(1)),
    leftRatioPct,
    rightRatioPct,
    marginPctInt: Number((state.marginPct * 100).toFixed(1)),
    gutterPctInt: Number((state.gutterPct * 100).toFixed(1)),
    titleRatioNum: Number(state.titleRatio.toFixed(2)),
    whitespacePct,
    leftGuideX: inner.x,
    alignDeltaPx: Math.abs(headerRect.x - textCol.x),
    // 四个直接点击热区（画布坐标）
    hitZones: {
      title: { ...headerRect },
      bullets: { ...textCol },
      visual: { ...visualCol },
      gutter: {
        x: gutterRect.x - 16,
        y: contentTop,
        w: gutterRect.w + 32,
        h: contentH,
      },
      alignBadge: !state.aligned
        ? { x: Math.max(8, inner.x), y: inner.y + headerH + 2, w: 178, h: 22 }
        : null,
    },
  };
}

// 从实绘几何单真源双向核算 8 类错态，并映射至原海报 4 项原则
export function audit(state, layout) {
  const issues = [];

  // 1. 图文关系（互补 vs 复读 / 装饰 / 缺图注）
  const visualRedundant = state.visualMode === "redundant";
  const visualDecor = state.visualMode === "decorative";
  const missingCaption = !state.captionOn;

  if (visualRedundant) {
    issues.push({
      id: "visualRedundant",
      principle: 0,
      severity: 100,
      short: "图文复读",
      headline: "右图把左列文字原样抄了一遍，双通道反而打架",
      why: "迈耶（Mayer, 2001）的冗余原则指出：当屏幕上同时出现重复文本和解说时，视觉通道被迫两头来回核对，观众既记不住图，也听不进你说话。",
      fix: "直接点击画布里的右侧图形区，把复读框换成能补充数据或结构的「互补证据图」，并配上一句简短图注。",
      actionLabel: "换成互补证据图 + 图注",
      action: "fixVisual",
    });
  } else if (visualDecor) {
    issues.push({
      id: "visualDecor",
      principle: 0,
      severity: 86,
      short: "无关装饰",
      headline: "右图只是凑版面的装饰贴图，没有证明任何论点",
      why: "占了整页近半面积却不携带信息，观众眼神扫过去扑个空，反而稀释了对左侧核心论点的记忆。",
      fix: "点一下画布右侧图形区，切换成直接呼应左列论点的真实证据图与图注。",
      actionLabel: "换成互补证据图 + 图注",
      action: "fixVisual",
    });
  } else if (missingCaption) {
    issues.push({
      id: "missingCaption",
      principle: 0,
      severity: 55,
      short: "缺少图注",
      headline: "右图有了证据，但少了图注说明「该看哪里」",
      why: "336 原海报专门在右图脚下留出「图注 / 说明文字」槽位：没有这一两句点拨，后排观众看到图形还要自己猜坐标轴和含义。",
      fix: "打开下方「图注说明」，用一句话点明右图要证明的关键拐点或关系。",
      actionLabel: "补上右侧图注说明",
      action: "fixCaption",
    });
  }

  // 2. 层级清晰（结论标题 + 字号反差 + 要点信息量）
  const titleVague = state.titleMode === "vague";
  const titleBloated = state.titleMode === "bloated";
  const titleFlat = state.titleRatio < 1.55;
  const titleGiant = state.titleRatio > 3.1;
  const bulletOverload = state.bulletMode === "overload";
  const bulletSparse = state.bulletMode === "sparse";

  if (titleVague) {
    issues.push({
      id: "titleVague",
      principle: 1,
      severity: 95,
      short: "目录空题",
      headline: "顶部标题只写了「目录标签」，观众 3 秒抓不到结论",
      why: "写「相关情况说明」等于把思考负担全扔给听众。336 原海报强调「先说结论，再做解释」——标题区是最贵的黄金广告位，应该直接放本页唯一论断。",
      fix: "直接点击画布顶部的标题区，把空洞目录词改成一句完整的结论句。",
      actionLabel: "改成结论先行标题",
      action: "fixTitle",
    });
  } else if (titleBloated) {
    issues.push({
      id: "titleBloated",
      principle: 1,
      severity: 84,
      short: "标题过长",
      headline: `标题一口气折了 ${layout.titleLines.length} 行，把下方内容区硬生生压矮了`,
      why: "结论句不等于把整段摘要搬进标题框。标题超过两行后，视觉锚点变笨重，观众还没扫完标题就已经分神。",
      fix: "点一下画布顶部标题区，把标题收束在 1–2 行内的一句精炼判断。",
      actionLabel: "精简为一句结论标题",
      action: "fixTitle",
    });
  }

  if (titleFlat) {
    issues.push({
      id: "titleFlat",
      principle: 1,
      severity: 90,
      short: `题文比 ${layout.titleRatioNum}×`,
      headline: `标题只比正文大 ${layout.titleRatioNum} 倍，一眼分不清主次层级`,
      why: "投影屏幕离观众数米远，标题和正文字号如果差不到 1.6 倍（经验值），整张页会糊成一块灰平的文本墙，眼睛找不到第一落点。",
      fix: "把「题文反差」滑轨推到 1.8×–2.4× 之间，让标题和正文拉开利落的阶级差。",
      actionLabel: "拉大题文比至 2.0×",
      action: "fixTitleRatio",
    });
  } else if (titleGiant) {
    issues.push({
      id: "titleGiant",
      principle: 1,
      severity: 76,
      short: `标题过巨 ${layout.titleRatioNum}×`,
      headline: `标题放大到正文的 ${layout.titleRatioNum} 倍，反客为主挤爆了内容区`,
      why: "主标题巨幅撑满只属于 335 封面页或 337 节标题页；在 336 工作页里，标题过大反而压榨掉下方论证空间。",
      fix: "把「题文反差」收回到 1.8×–2.5× 舒适区，给下方图文留足舞台。",
      actionLabel: "收回调和题文比",
      action: "fixTitleRatio",
    });
  }

  if (bulletOverload) {
    issues.push({
      id: "bulletOverload",
      principle: 1,
      severity: 92,
      short: "6 条字墙",
      headline: `左列硬塞了 6 条长段落（留白压到 ${layout.whitespacePct}%），变成 Word 贴屏`,
      why: "幻灯片不是讲稿打印件。一页塞满 6 条长句时，观众会低头默读屏幕而忽略你的口头讲解，且密集字行会彻底窒息整页呼吸感。",
      fix: "点击画布左下要点区，把冗长段落裁剪成 3–4 条一眼扫完的短句要点。",
      actionLabel: "精简为 4 条核心要点",
      action: "fixBullets",
    });
  } else if (bulletSparse) {
    issues.push({
      id: "bulletSparse",
      principle: 1,
      severity: 62,
      short: "论据单薄",
      headline: "左列只剩孤零零一句，撑不起右侧整块图形的解释任务",
      why: "336 是论证型工作页，左侧要点承担「拆解理由」的职责；如果只需要一句极简图说，其实更适合切去 342 或 343 图说版式。",
      fix: "点击画布左下要点区，补充到 3–4 条简明有力的支撑要点。",
      actionLabel: "补齐 3–4 条要点",
      action: "fixBullets",
    });
  }

  // 3. 对齐与留白（左缘错牙 + 外边距过窄/过宽 + 有效留白）
  const misaligned = !state.aligned;
  const marginTight = state.marginPct < 0.048;
  const marginWaste = state.marginPct > 0.135;
  const whitespaceCrush = layout.whitespacePct < 24;

  if (misaligned) {
    issues.push({
      id: "misaligned",
      principle: 2,
      severity: 88,
      short: `错牙 ${layout.alignDeltaPx}px`,
      headline: `标题和内容区左缘错开了 ${layout.alignDeltaPx}px，整页看着像没摆齐`,
      why: "人眼对垂直对齐线极其敏感。顶部标题和下方正文一旦不在同一条隐形左轴线上，哪怕字体再好看，版面也会立刻显得松散业余。",
      fix: "点击画布上标红的「错牙」提示或下方「左缘齐线」开关，把标题与内容锁回同一条垂线。",
      actionLabel: "一键对齐标题与内容左缘",
      action: "fixAlign",
    });
  }

  if (marginTight) {
    issues.push({
      id: "marginTight",
      principle: 2,
      severity: 87,
      short: `贴边 ${layout.marginPctInt}%`,
      headline: `四周外边距仅 ${layout.marginPctInt}%，文字紧贴边沿且投影极易裁切`,
      why: "会场投影仪和线上会议窗常会吃掉边缘 3%–4% 的像素；即便没被切掉，字贴边也会制造窒息压迫感（经验安全边距约 6%–10%）。",
      fix: "把「外边距 MARGIN」拉回 6%–10%，替整张幻灯片留出一圈呼吸边框。",
      actionLabel: "恢复 7.2% 安全外边距",
      action: "fixMargin",
    });
  } else if (marginWaste) {
    issues.push({
      id: "marginWaste",
      principle: 2,
      severity: 66,
      short: `边距过大 ${layout.marginPctInt}%`,
      headline: `外边距占了 ${layout.marginPctInt}%，把内容缩成了中间一小坨`,
      why: "留白不是把东西往中间硬挤。外边距超过 13% 会白白吞掉近一半版面面积，逼得正文和图表都被迫缩小字号。",
      fix: "把「外边距 MARGIN」收回到 6%–10% 区间，把空间还给图文主体。",
      actionLabel: "收回 7.2% 合理边距",
      action: "fixMargin",
    });
  }

  if (whitespaceCrush && !bulletOverload) {
    issues.push({
      id: "whitespaceCrush",
      principle: 2,
      severity: 72,
      short: `留白仅 ${layout.whitespacePct}%`,
      headline: `实测有效留白仅剩 ${layout.whitespacePct}%，版面几乎透不过气`,
      why: "内容过密时，观众视线没有停顿缓冲处。给幻灯片保留约 30%–48% 的留白（经验值），重点反而跳得更出来。",
      fix: "精简要点或适当收匀图文比例与边距，让留白回到 30% 以上。",
      actionLabel: "恢复舒展留白节奏",
      action: "fixBalance",
    });
  }

  // 4. 阅读顺序（左右宽比失衡 + 栏间距塌缩/裂谷）
  const gutterTight = state.gutterPct < 0.028;
  const gutterSplit = state.gutterPct > 0.105;
  const splitLeftHeavy = state.split > 0.64;
  const splitRightHeavy = state.split < 0.32;

  if (gutterTight) {
    issues.push({
      id: "gutterTight",
      principle: 3,
      severity: 89,
      short: `栏距 ${layout.gutterPctInt}% 挤粘`,
      headline: `中缝栏间距塌缩到 ${layout.gutterPctInt}%，左文行尾和右图贴死串读`,
      why: "按格式塔邻近原则，栏间距过窄会让左列行尾直接粘上右侧图形边界，破坏先左后右的分段节奏（经验中缝约 4%–8%）。",
      fix: "调宽「栏间距 GUTTER」到 4%–8%，在文字和图形之间划出清晰隔离带。",
      actionLabel: "拉开 5.2% 中缝栏间距",
      action: "fixGutter",
    });
  } else if (gutterSplit) {
    issues.push({
      id: "gutterSplit",
      principle: 3,
      severity: 74,
      short: `栏距 ${layout.gutterPctInt}% 裂谷`,
      headline: `栏间距拉宽到 ${layout.gutterPctInt}%，左右割裂成两张不相关的图`,
      why: "迈耶空间邻近原则指出，相互印证的文字和图形相隔太远时，眼睛必须来回长距跳跃，关联感立刻瓦解。",
      fix: "把「栏间距 GUTTER」收回到 4%–8% 区间，既清晰分隔又保持图文呼应。",
      actionLabel: "收匀至 5.2% 栏间距",
      action: "fixGutter",
    });
  }

  if (splitLeftHeavy) {
    issues.push({
      id: "splitLeftHeavy",
      principle: 3,
      severity: 85,
      short: `左胖 ${layout.leftRatioPct}:${layout.rightRatioPct}`,
      headline: `左文挤占了 ${layout.leftRatioPct}%，右图被压成窄条看不清细节`,
      why: "标题和内容页讲究图文均势或合理主辅（约 35:65 到 62:38）。左列过宽既拉长文字回扫距离，又让右侧图形沦为摆设。",
      fix: "直接向左横拖画布中央的蓝色虚线中缝，把右图空间还回到 38%–62%。",
      actionLabel: "推回 52:48 均衡配比",
      action: "fixSplit",
    });
  } else if (splitRightHeavy) {
    issues.push({
      id: "splitRightHeavy",
      principle: 3,
      severity: 83,
      short: `左窄仅 ${layout.avgCharsPerLine} 字/行`,
      headline: `左文被挤到只剩 ${layout.leftRatioPct}%（均行仅 ${layout.avgCharsPerLine} 字），句子碎得没法连读`,
      why: "单行中文被切到不足八九个字时，频繁换行会打碎语意连贯性，眼睛像爬窄梯一样上下乱跳。",
      fix: "向右横拖画布中央的虚线中缝，给左文至少留出 34% 以上列宽。",
      actionLabel: "推回 48:52 舒适配比",
      action: "fixSplit",
    });
  }

  // 排序取出首要诊断
  issues.sort((a, b) => b.severity - a.severity);

  // 汇总四项原海报核心原则状态
  const principleDefs = [
    { no: "01", title: "图文关系", en: "TEXT-IMAGE BALANCE", posterBody: "图文相互补充，避免重复，强化信息。" },
    { no: "02", title: "层级清晰", en: "VISUAL HIERARCHY", posterBody: "通过大小、粗细和颜色区分信息层级。" },
    { no: "03", title: "对齐与留白", en: "ALIGNMENT & WHITESPACE", posterBody: "保持对齐，合理留白，提升专业感与可读性。" },
    { no: "04", title: "阅读顺序", en: "READING ORDER", posterBody: "按照自然视线流动，引导观众高效阅读。" },
  ];

  const principles = principleDefs.map((p, idx) => {
    const pIssues = issues.filter((it) => it.principle === idx);
    const ok = pIssues.length === 0;
    let badge = "";
    if (ok) {
      if (idx === 0) badge = "图文互补";
      else if (idx === 1) badge = `题文 ${layout.titleRatioNum}×`;
      else if (idx === 2) badge = `留白 ${layout.whitespacePct}%`;
      else badge = `${layout.leftRatioPct}:${layout.rightRatioPct} 顺流`;
    } else {
      badge = pIssues[0].short;
    }
    return { ...p, ok, badge, issues: pIssues };
  });

  const passCount = principles.filter((p) => p.ok).length;
  const primary = issues[0] || null;

  // 若全部成立，判断属于哪种合法解气质
  let successTitle = "";
  let successWhy = "";
  let successTip = "";
  if (!primary) {
    if (layout.leftRatioPct <= 45) {
      successTitle = `4/4 成立 · 图主证据解（${layout.leftRatioPct}:${layout.rightRatioPct}）`;
      successWhy = `标题一句定调，左侧精简要点收口，右侧留出 ${layout.rightRatioPct}% 宽幅给证据图形与图注，非常适合数据曲线和科研「论断-证据」汇报。`;
      successTip = "可以继续横拖中缝，比较 40:60 图主版与 52:48 均衡版在节奏上的细微差别。";
    } else if (layout.leftRatioPct >= 55) {
      successTitle = `4/4 成立 · 文主深讲解（${layout.leftRatioPct}:${layout.rightRatioPct}）`;
      successWhy = `左文占 ${layout.leftRatioPct}%（均行约 ${layout.avgCharsPerLine} 字），兼顾条理拆解与右侧结构图示，留白 ${layout.whitespacePct}% 依然呼吸从容。`;
      successTip = "也可以试着把栏距拉过 11% 或切回「图文复读」，亲眼验证版式如何迅速垮塌。";
    } else {
      successTitle = `4/4 成立 · 原海报经典均衡解（${layout.leftRatioPct}:${layout.rightRatioPct}）`;
      successWhy = `顶部结论清晰（题文比 ${layout.titleRatioNum}×），左右图文均势互补，外边距 ${layout.marginPctInt}% 与栏距 ${layout.gutterPctInt}% 严丝合缝，视线自然完成「标题 → 要点 → 图形 → 图注」扫读。`;
      successTip = "点一下「演练阅读动线」或按空格键，看观众视线怎样顺滑走完这一页。";
    }
  }

  // 整体态势档位（遵循 BRIEF：不造假精确分数，给清楚档位 + 示意）
  const posture =
    passCount === 4
      ? "秩序成立"
      : passCount >= 2
      ? "局部失衡（示意）"
      : "多处失序（示意）";

  return {
    passCount,
    total: 4,
    allPass: passCount === 4,
    issues,
    primary,
    principles,
    posture,
    statusShort: primary ? `${passCount}/4 · ${primary.short}` : `4/4 · 版式成立`,
    headline: primary ? primary.headline : successTitle,
    why: primary ? primary.why : successWhy,
    fix: primary ? primary.fix : successTip,
    actionLabel: primary ? primary.actionLabel : "演练阅读动线",
    action: primary ? primary.action : "playScan",
  };
}

// 一键修当前最紧迫病灶的纯状态更新器
export function applyFixAction(state, action) {
  const next = { ...state };
  switch (action) {
    case "fixVisual":
      next.visualMode = "complement";
      next.captionOn = true;
      break;
    case "fixCaption":
      next.captionOn = true;
      break;
    case "fixTitle":
      next.titleMode = "assertion";
      if (next.titleRatio < 1.75) next.titleRatio = 2.05;
      break;
    case "fixTitleRatio":
      next.titleRatio = 2.05;
      break;
    case "fixBullets":
      next.bulletMode = "clean";
      break;
    case "fixAlign":
      next.aligned = true;
      break;
    case "fixMargin":
      next.marginPct = 0.072;
      break;
    case "fixGutter":
      next.gutterPct = 0.052;
      break;
    case "fixSplit":
      next.split = state.split < 0.35 ? 0.48 : 0.52;
      break;
    case "fixBalance":
      next.split = 0.52;
      next.marginPct = 0.072;
      next.gutterPct = 0.052;
      if (next.bulletMode === "overload") next.bulletMode = "clean";
      break;
    default:
      break;
  }
  return next;
}
