// Single-source-of-truth geometric, typography & optical-balance engine for 338 Two-Content Slide Layout.
// Supports both wide desktop projection (1180x382 slide + 62px fulcrum) and tall mobile portrait projection (520x484 slide + 76px fulcrum)
// with one normalized state (0..1) and identical audit rules so metrics, canvas rulers, pillar probes, and diagnosis never drift.

export const LOGICAL_WIDE = { W: 1180, slideH: 382, stageH: 448, compact: false };
export const LOGICAL_COMPACT = { W: 520, slideH: 478, stageH: 558, compact: true };
export const REF_W = 960; // Canonical 960px slide width used for consistent px metrics across viewports
export const REF_H = 540;

export const DECKS = {
  poster: {
    id: "poster",
    label: "原海报 · 双模块",
    slideTitle: "两项内容幻灯片版式",
    slideSub: "TWO-CONTENT LAYOUT · 用两块内容，清晰表达两项关键信息",
    bracketLabel: "双模块结构",
    c1: {
      num: "01",
      title: "内容一",
      en: "CONTENT ONE",
      desc: "用于阐述第一项核心信息，突出重点，精炼表达，帮助观众快速理解。",
      keyLabel: "要点 / KEY POINTS",
      concise: ["关键内容概述", "支撑说明文字", "补充细节说明"],
      empty: ["核心信息占位"],
      wall: [
        "关键内容概述与背景说明文字，需要交代完整前情与范围界定",
        "第一项核心指标的统计口径、采样周期与环比基线核对",
        "支撑说明文字：逐条罗列历史沿革与跨部门协作流程细节",
        "补充细节说明：附带三项待确认风险项与阶段性复盘摘要",
        "延伸参考条目：将原本该拆到下一页的附录全数塞入本栏",
        "次级注释：小号密排导致后排观众在投影前难以一次扫清",
        "尾部补充：信息密度超载让观众只盯着字墙而错过演讲口述",
      ],
      visualKind: "posterLeft",
    },
    c2: {
      num: "02",
      title: "内容二",
      en: "CONTENT TWO",
      desc: "用于阐述第二项核心信息，形成对照或补充，信息独立，逻辑并行。",
      keyLabel: "要点 / KEY POINTS",
      concise: ["关键内容概述", "支撑说明文字", "补充细节说明"],
      empty: ["待补充要点"],
      wall: [
        "第二项核心信息的完整定义、适用边界与约束条件详述",
        "对照维度一：资源投入明细、人力排期与交付里程碑清单",
        "对照维度二：预期产出测算、敏感性分析与上下浮动区间",
        "补充说明一：与第一模块交叉引用的前置条件与依赖关系",
        "补充说明二：落地阶段的异常兜底方案与内部审批流转节点",
        "风险提示条：把备忘稿全文搬上幻灯片导致左右双满字墙",
        "结论附记：两栏同时塞满文字后视觉上失去主次与呼吸空间",
      ],
      visualKind: "posterRight",
    },
  },
  business: {
    id: "business",
    label: "季报 · 增长与提效",
    slideTitle: "Q3 增长拉新稳健，履约提效带动利润转正",
    slideSub: "Q3 OPERATING REVIEW · 获客与履约双轨并行",
    bracketLabel: "双模块结构",
    c1: {
      num: "01",
      title: "获客规模扩大",
      en: "ACQUISITION",
      desc: "自然渠道占比抬升，新客首单转化率连续三个月走高。",
      keyLabel: "核心数据 / METRICS",
      concise: ["月活净增 28%，自然流量占六成", "次月留存稳在 64% 高位", "单客获客成本同比回落 14%"],
      empty: ["Q3 新增数据稳步上升"],
      wall: [
        "七月华东与华南区暑期拉新活动共触达新访客四十二万人次",
        "八月自然搜索与老带新裂变占比抬升至百分之六十一并持续走高",
        "九月开学季内容专题带来首单转化率较二季度提高四个百分点",
        "渠道结构层面已将低效信息流预算压缩并转投高复购垂直社区",
        "次月留存口径按首次下单后三十日内再次活跃计算稳居高位",
        "单客获客成本回落主要得益于落地页加载耗时缩短与转化优化",
        "其余区域明细与分周趋势见附录第四十二页大表此处不再展开",
      ],
      visualKind: "bars",
    },
    c2: {
      num: "02",
      title: "履约成本下探",
      en: "FULFILLMENT",
      desc: "仓配并线与预测补货落地，推动单均毛利首次跨越盈亏线。",
      keyLabel: "关键动作 / ACTIONS",
      concise: ["华东三仓并线，干线降本 19%", "周度补货命中率提升至 91%", "单均履约毛利转正 +2.4 元"],
      empty: ["履约成本下降"],
      wall: [
        "华东三座前置仓完成合并调度后日均干线满载率提升至九成以上",
        "通过历史订单与天气因子构建周度补货模型显著压低滞销库存",
        "冷链包装耗材切换为标准化可循环箱体减少单票包材支出",
        "末梢配送改签区域承运商阶梯协议使高峰时段妥投率保持稳定",
        "售后工单自动分流上线后人工客服平均响应时长压缩近一半",
        "综合仓配与包材节流带动单均履约毛利首次实现正向结余",
        "下季度拟将该并线模板复制到西南大区并同步核算资本开支",
      ],
      visualKind: "ring",
    },
  },
  product: {
    id: "product",
    label: "方案 · 痛点与重构",
    slideTitle: "简化三步开户路径，预计释放三成流失用户",
    slideSub: "ONBOARDING REDESIGN · 问题诊断与架构解法",
    bracketLabel: "双模块结构",
    c1: {
      num: "01",
      title: "当前流失瓶颈",
      en: "BOTTLENECK",
      desc: "新用户首次进入即遭遇七项必填表与两次外跳验证，中途折损集中。",
      keyLabel: "诊断证据 / FINDINGS",
      concise: ["填表步骤达 7 项，首屏跳出 41%", "证件上传外跳后回流不足一半", "未先体验价值即索要高敏权限"],
      empty: ["开户流程步骤偏多"],
      wall: [
        "现行注册流程在首屏即要求填写企业税号、联系人与七项资质字段",
        "移动端实名核验需跳转第三方浏览器页面导致近半数用户中断退出",
        "表单校验仅在点击提交后整页报错且清空已选下拉项引发挫败感",
        "新访客尚未看到产品核心界面就被迫阅读长篇条款与授权弹窗",
        "客服工单统计显示开户受阻占首周咨询量近三分之一亟待梳理",
        "安卓低端机型在上传高清营业执照照片时频繁出现内存闪退现象",
        "综合漏斗埋点可见从点击注册到首日留存的折损主要集中在前两分钟",
      ],
      visualKind: "funnel",
    },
    c2: {
      num: "02",
      title: "渐进式重构方案",
      en: "NEW FLOW",
      desc: "拆分为「先体验沙箱 + 按需补全资质」，把首次可用时间压至 30 秒内。",
      keyLabel: "改造要点 / REDESIGN",
      concise: ["首步仅留手机号，立即进沙箱", "实名核验延后至首次发布前", "内置 OCR 识别，表单压至 2 步"],
      empty: ["改为渐进式注册"],
      wall: [
        "首步注册仅保留手机号验证码登录并在三秒内直接进入演示工作台",
        "内置三套行业模板数据让访客先亲手拖拽体验核心功能建立信任",
        "将企业实名与开票资质核验延后至首次对外发布或提现前再触发",
        "前端接入轻量 OCR 自动回填抬头与统一信用代码将手输压到两步",
        "所有字段改为失焦即时校验并本地草稿暂存确保意外退出不丢数据",
        "预计将首次可用耗时从四分钟压到三十秒内并显著抬升首日激活率",
        "一期灰度发布计划覆盖百分之二十新流量并于两周后复盘留存指标",
      ],
      visualKind: "steps",
    },
  },
};

export const INITIAL_STATE = {
  deck: "poster",
  split: 0.66,        // 66:34 bloated left, narrow right
  gutter: 0.0045,     // ~4px glued seam (in canonical 960px slide coordinates)
  offsetY: 0.052,     // +28px dropped right card
  polarity: "bare",   // borderless flat mud
  alignMode: "mixed", // left vs centered clash
  density1: "wall",   // 7-line dense wall
  density2: "empty",  // 1 sparse line
  visual1: false,
  visual2: false,
  showGuides: true,
  focusLayer: null,
};

export const SOLUTIONS = [
  {
    id: "classic",
    label: "原海报明暗解",
    note: "50:50 · 左浅米 01 × 右深酒红 02",
    patch: {
      split: 0.50,
      gutter: 0.038,
      offsetY: 0,
      polarity: "classic",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: true,
      visual2: true,
    },
  },
  {
    id: "chartRight",
    label: "左图右结 56:44",
    note: "56:44 · 左含图解 × 右酒红精炼结论",
    patch: {
      split: 0.56,
      gutter: 0.036,
      offsetY: 0,
      polarity: "classic",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: true,
      visual2: false,
    },
  },
  {
    id: "leftAnchor",
    label: "左深主轴 46:54",
    note: "46:54 · 左深酒红锚定 × 右浅米配图补充",
    patch: {
      split: 0.46,
      gutter: 0.038,
      offsetY: 0,
      polarity: "leftDark",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: false,
      visual2: true,
    },
  },
  {
    id: "softPair",
    label: "双浅主副 58:42",
    note: "58:42 · 双浅底借宽窄与酒红顶条分主次",
    patch: {
      split: 0.58,
      gutter: 0.036,
      offsetY: 0,
      polarity: "softTint",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: true,
      visual2: true,
    },
  },
];

export const REVERSE_FAULTS = [
  {
    id: "bothDark",
    label: "试错：双深互抢",
    patch: {
      split: 0.50,
      gutter: 0.038,
      offsetY: 0,
      polarity: "bothDark",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: true,
      visual2: true,
    },
  },
  {
    id: "wideChasm",
    label: "试错：裂谷脱节",
    patch: {
      split: 0.50,
      gutter: 0.115,
      offsetY: 0,
      polarity: "classic",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: true,
      visual2: true,
    },
  },
  {
    id: "dualWall",
    label: "试错：双满字墙",
    patch: {
      split: 0.50,
      gutter: 0.038,
      offsetY: 0,
      polarity: "classic",
      alignMode: "left",
      density1: "wall",
      density2: "wall",
      visual1: false,
      visual2: false,
    },
  },
  {
    id: "crushedRight",
    label: "试错：窄栏挤碎",
    patch: {
      split: 0.72,
      gutter: 0.036,
      offsetY: 0,
      polarity: "classic",
      alignMode: "left",
      density1: "concise",
      density2: "concise",
      visual1: true,
      visual2: true,
    },
  },
];

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function wrapTextLogical(text, maxWidthPx, fontSizePx) {
  const lines = [];
  const noLineStart = /^[，。、：；！？）》」』,.!?;:]/;
  let cur = "";
  let w = 0;
  for (const ch of text) {
    const cw = ch.charCodeAt(0) > 0x2e80 ? fontSizePx * 1.0 : ch === " " ? fontSizePx * 0.34 : fontSizePx * 0.58;
    if (w + cw > maxWidthPx && cur.length > 0 && !noLineStart.test(ch)) {
      lines.push(cur);
      cur = ch;
      w = cw;
    } else {
      cur += ch;
      w += cw;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function surfaceWeight(tone) {
  if (tone === "dark") return 1.38;
  if (tone === "cream") return 0.78;
  if (tone === "tint") return 0.84;
  return 0.44;
}

export function cardTones(polarity) {
  switch (polarity) {
    case "classic":
      return { left: "cream", right: "dark" };
    case "leftDark":
      return { left: "dark", right: "cream" };
    case "bothDark":
      return { left: "dark", right: "dark" };
    case "softTint":
      return { left: "cream", right: "tint" };
    default:
      return { left: "bare", right: "bare" };
  }
}

export function evaluateSlide(state, dims = LOGICAL_WIDE) {
  const deck = DECKS[state.deck] || DECKS.poster;
  const { W, slideH, stageH, compact } = dims;

  // Canonical 960x540 audit values so metrics never fluctuate when resizing browser window
  const split = clamp(state.split, 0.26, 0.74);
  const gutterNorm = clamp(state.gutter, 0.004, 0.13);
  const offsetNorm = clamp(state.offsetY, -0.075, 0.075);

  const gutterPx = Math.round(gutterNorm * REF_W);
  const deltaYPx = Math.round(offsetNorm * REF_H);

  const padX = compact ? 16 : 36;
  const bracketY = compact ? 86 : 80;
  const cardTopBase = compact ? 106 : 98;
  const cardH = compact ? 350 : 268;
  const contentW = W - padX * 2;

  const drawGutter = Math.max(3, Math.round(gutterNorm * (compact ? W * 0.92 : W * 0.88)));
  const availW = contentW - drawGutter;
  const w1 = Math.round(availW * split);
  const w2 = availW - w1;

  const drawDeltaY = Math.round(offsetNorm * (compact ? 420 : 350));
  const y1 = cardTopBase;
  const y2 = clamp(cardTopBase + drawDeltaY, bracketY - 6, slideH - cardH - 4);

  const card1 = { x: padX, y: y1, w: w1, h: cardH };
  const card2 = { x: padX + w1 + drawGutter, y: y2, w: w2, h: cardH };
  const seamX = card1.x + card1.w + drawGutter / 2;
  const plusCenter = { x: seamX, y: cardTopBase + cardH * 0.48 };

  const tones = cardTones(state.polarity);
  const items1 = deck.c1[state.density1] || deck.c1.concise;
  const items2 = deck.c2[state.density2] || deck.c2.concise;

  // Compute canonical wraps on 960px slide scale for single-source line counts & chars/line
  const refAvailW = 864 - gutterPx;
  const refW1 = refAvailW * split;
  const refW2 = refAvailW - refW1;
  const refTextW1 = Math.max(84, refW1 - 44);
  const refTextW2 = Math.max(84, refW2 - 44);

  const refDesc1 = wrapTextLogical(deck.c1.desc, refTextW1, 13.5);
  const refDesc2 = wrapTextLogical(deck.c2.desc, refTextW2, 13.5);
  const refBul1 = items1.map((t) => wrapTextLogical(t, refTextW1 - 14, 12.5));
  const refBul2 = items2.map((t) => wrapTextLogical(t, refTextW2 - 14, 12.5));

  const totalTextLines1 = refDesc1.length + refBul1.reduce((s, a) => s + a.length, 0);
  const totalTextLines2 = refDesc2.length + refBul2.reduce((s, a) => s + a.length, 0);
  const totalLines = totalTextLines1 + totalTextLines2;

  const cpl1 = Math.max(4, Math.floor(refTextW1 / 13.5));
  const cpl2 = Math.max(4, Math.floor(refTextW2 / 13.5));

  // Draw wraps matched to current canvas logical card widths
  const innerPad = compact ? 12 : 20;
  const descSize = compact ? 11.5 : 13;
  const bulletSize = compact ? 11 : 12.5;
  const drawTextW1 = Math.max(64, card1.w - innerPad * 2);
  const drawTextW2 = Math.max(64, card2.w - innerPad * 2);
  const descLines1 = wrapTextLogical(deck.c1.desc, drawTextW1, descSize);
  const descLines2 = wrapTextLogical(deck.c2.desc, drawTextW2, descSize);
  const bulletLines1 = items1.map((t) => wrapTextLogical(t, drawTextW1 - 12, bulletSize));
  const bulletLines2 = items2.map((t) => wrapTextLogical(t, drawTextW2 - 12, bulletSize));

  // Optical mass (single source for fulcrum tilt & balance audit)
  const areaShare1 = split;
  const areaShare2 = 1 - split;
  const visualMass1 = state.visual1 ? 24 : 0;
  const visualMass2 = state.visual2 ? 24 : 0;
  const textMass1 = Math.min(totalTextLines1, 16) * 5.2;
  const textMass2 = Math.min(totalTextLines2, 16) * 5.2;

  const mass1 = areaShare1 * 54 * surfaceWeight(tones.left) + textMass1 + visualMass1;
  const mass2 = areaShare2 * 54 * surfaceWeight(tones.right) + textMass2 + visualMass2;
  const tiltPct = Math.round(clamp(((mass2 - mass1) / Math.max(mass1 + mass2, 1)) * 115, -48, 48));

  const splitPct1 = Math.round(split * 100);
  const splitPct2 = 100 - splitPct1;

  const faults = [];

  // 1. 双模块
  let modulesPass = true;
  let modulesTag = `独立双区 · ${gutterPx}px`;
  if (gutterPx < 16) {
    modulesPass = false;
    modulesTag = `贴缝 ${gutterPx}px`;
    faults.push({
      pillar: "modules",
      code: "tooTight",
      severity: 100,
      headline: `中缝仅剩 ${gutterPx}px，两块内容黏成一团`,
      why: "两项内容版式靠清晰中缝建立格式塔分离边界。当中缝窄于正文行距（<16px）时，观众横扫视线会直接跳行跨进隔壁模块，『双模块』退化成互相干扰的乱墙。",
      fixHint: "把「中缝宽度」拉开到 28–48px，或点击下方按钮一键校准呼吸走廊。",
      cta: "拉开清晰中缝（36px）",
      ctaPatch: { gutter: 0.038, polarity: state.polarity === "bare" ? "classic" : state.polarity },
    });
  } else if (gutterPx > 86) {
    modulesPass = false;
    modulesTag = `裂谷 ${gutterPx}px`;
    faults.push({
      pillar: "modules",
      code: "tooWide",
      severity: 85,
      headline: `中缝裂开 ${gutterPx}px，一页被劈成两张孤岛`,
      why: "中缝并不是越宽越好。过宽的空白割裂了中央 + 号承接的逻辑呼应，不仅浪费左右宝贵的排版宽度，也让观众怀疑两块内容是否根本不该放同一页。",
      fixHint: "把「中缝宽度」收回 24–56px 区间，既独立成区又保住对话感。",
      cta: "收回中缝至 36px",
      ctaPatch: { gutter: 0.038 },
    });
  } else if (Math.min(splitPct1, splitPct2) < 35) {
    modulesPass = false;
    modulesTag = `窄栏 ${Math.min(splitPct1, splitPct2)}%`;
    const narrowSide = splitPct1 < splitPct2 ? "左卡 01" : "右卡 02";
    const narrowCpl = splitPct1 < splitPct2 ? cpl1 : cpl2;
    faults.push({
      pillar: "modules",
      code: "crushed",
      severity: 92,
      headline: `${narrowSide}被挤到只剩 ${Math.min(splitPct1, splitPct2)}%（约 ${narrowCpl} 字/行）`,
      why: "两项内容允许为了图宽文收而微调宽比（经验上 40:60 至 60:40 较舒适），一旦某一栏被压到 35% 以下，中文要点被迫频繁断行成竖条，模块体量彻底失衡。",
      fixHint: "横拖画布中央的香槟沙 + 把手，把左右宽比拉回 42:58–58:42 之间。",
      cta: "把宽比调回 50:50",
      ctaPatch: { split: 0.50 },
    });
  } else if (state.polarity === "bare") {
    modulesPass = false;
    modulesTag = "无界裸排";
    faults.push({
      pillar: "modules",
      code: "bareNoBoundary",
      severity: 80,
      headline: "两块内容全无边界衬底，区域感模糊",
      why: "完全裸排在统一浅底上时，标题、正文与要点缺少容器锚定，后排观众很难第一眼分辨『内容一』在哪结束、『内容二』从哪开始。",
      fixHint: "点击卡片上的 01/02 圆徽，切出原海报「左浅米 + 右深酒红」或双浅轻框边界。",
      cta: "切回原海报明暗双卡",
      ctaPatch: { polarity: "classic" },
    });
  }

  // 2. 对齐
  let alignPass = true;
  let alignTag = "齐顶 · 左齐基准";
  if (Math.abs(deltaYPx) > 4) {
    alignPass = false;
    alignTag = `顶差 ${deltaYPx > 0 ? "+" : ""}${deltaYPx}px`;
    faults.push({
      pillar: "alignment",
      code: "topOffset",
      severity: 95,
      headline: `右卡顶线比左卡${deltaYPx > 0 ? "掉低" : "抬高"}了 ${Math.abs(deltaYPx)}px`,
      why: "观众读完内容一抬头扫向内容二时，眼睛默认寻找同一条水平起跑线。哪怕只有二十多像素的错牙，也会在脑中制造『是不是层级不同』的误读噪声（Kosslyn 信息变化原则）。",
      fixHint: "上下拖动右卡 02 顶边抓手，让它吸附回虚线齐顶基准（ΔY = 0px）。",
      cta: "齐平双卡顶线（ΔY 0px）",
      ctaPatch: { offsetY: 0, alignMode: state.alignMode === "mixed" ? "left" : state.alignMode },
    });
  } else if (state.alignMode === "mixed") {
    alignPass = false;
    alignTag = "对齐打架";
    faults.push({
      pillar: "alignment",
      code: "mixedAlign",
      severity: 88,
      headline: "左卡左对齐、右卡居中排，块内基准线打架",
      why: "原海报的『对齐』图标画着一根清晰的竖向虚线——每行文字共用同一根起笔锚线。左右混用两种对齐方式，会瞬间破坏双模块的平行秩序。",
      fixHint: "把「块内对齐」统一为「双卡左齐基准」。",
      cta: "统一为双卡左齐",
      ctaPatch: { alignMode: "left" },
    });
  } else if (state.alignMode === "center" && (totalTextLines1 >= 5 || totalTextLines2 >= 5)) {
    alignPass = false;
    alignTag = "居中散边";
    faults.push({
      pillar: "alignment",
      code: "centerBullets",
      severity: 76,
      headline: "多行要点全部居中，每行起点左右漂移",
      why: "短标题偶尔可以居中，但 3 条以上的多行要点一旦居中排版，左侧不再形成整齐的垂直扫描线，观众每换行都要重新寻找起笔位置。",
      fixHint: "把「块内对齐」切回「双卡左齐基准」。",
      cta: "切回双卡左齐",
      ctaPatch: { alignMode: "left" },
    });
  }

  // 3. 主次
  let priorityPass = true;
  let priorityTag =
    state.polarity === "classic"
      ? "左浅右深酒红"
      : state.polarity === "leftDark"
        ? "左深酒红右浅"
        : "宽窄图主区分";
  if (state.polarity === "bothDark") {
    priorityPass = false;
    priorityTag = "双深互抢";
    faults.push({
      pillar: "priority",
      code: "bothDarkClash",
      severity: 89,
      headline: "左右两卡全铺深酒红，双双抢戏反而没重点",
      why: "深色实底是最强的视觉强调手段，当两块内容同时用满高饱和深色时，正如『整页划重点等于没重点』，不仅视觉发闷，也抹平了主次层次。",
      fixHint: "保留一侧深酒红作为锚点，另一侧退回暖米浅底（原海报经典解或左深主轴解）。",
      cta: "改为左浅右深明暗对映",
      ctaPatch: { polarity: "classic" },
    });
  } else if (state.polarity === "bare") {
    priorityPass = false;
    priorityTag = "平铺无锚";
    faults.push({
      pillar: "priority",
      code: "flatBare",
      severity: 78,
      headline: "双块完全裸排平铺，缺少第一落脚点",
      why: "两项内容并不意味着两张毫无区分的白纸条。借助明暗衬底反差、或一侧配图一侧收口，观众才能在半秒内分辨阅读先后与重心所在。",
      fixHint: "点击卡片 02 切出深酒红重点衬底，或启用轻框并搭配图解锚点。",
      cta: "启用原海报明暗对比",
      ctaPatch: { polarity: "classic" },
    });
  } else if (
    state.polarity === "softTint" &&
    Math.abs(splitPct1 - 50) <= 4 &&
    state.visual1 === state.visual2 &&
    state.density1 === state.density2
  ) {
    priorityPass = false;
    priorityTag = "同平无主次";
    faults.push({
      pillar: "priority",
      code: "flatSoft",
      severity: 74,
      headline: "双浅底 + 50:50 + 同构内容，全页完全拉平",
      why: "Nancy Duarte 指出双栏最常见的陷阱是『机械均等』：当两块在明暗、宽度和内容形式上毫无差异时，视线会在两栏之间来回犹豫，不知该先看哪一侧。",
      fixHint: "三种合法改法任选其一：①切『左浅右深』明暗主次；②拉宽主栏至 56:44；③一侧配图解、一侧留精炼结论。",
      cta: "用左浅右深建立主次",
      ctaPatch: { polarity: "classic" },
    });
  }

  // 4. 信息平衡
  let balancePass = true;
  let balanceTag = `均衡 ${tiltPct >= 0 ? "+" : ""}${tiltPct}%`;
  if (state.density1 === "wall" && state.density2 === "wall") {
    balancePass = false;
    balanceTag = `双满字墙 ${totalLines}行`;
    faults.push({
      pillar: "balance",
      code: "bothWallOverload",
      severity: 93,
      headline: `左右同塞满字墙（合计 ${totalLines} 行），对称不等于平衡`,
      why: "即使天平指针停在中间，把两页的讲稿全挤进同一张幻灯片也会瞬间击穿观众的工作记忆（Kosslyn 容量限制原则），演讲变成低头念稿大会。",
      fixHint: "把两侧要点都精炼回 3 条关键短句，并搭配一侧几何/数据图解分担文字压力。",
      cta: "精炼两侧为 3 条要点",
      ctaPatch: { density1: "concise", density2: "concise", visual1: true },
    });
  } else if (state.density1 === "empty" && state.density2 === "empty" && !state.visual1 && !state.visual2) {
    balancePass = false;
    balanceTag = "双空失料";
    faults.push({
      pillar: "balance",
      code: "bothEmpty",
      severity: 72,
      headline: "双卡只有两句短占位，浪费了双模块骨架",
      why: "如果两块都只剩一句话且没有图解支撑，硬套两项内容版式只会显得空洞松散——不如退回『仅标题』或『标题和内容』单模块版式。",
      fixHint: "把两侧恢复为 3 条精炼要点，或为其中一侧补上核心图解。",
      cta: "补齐双侧核心要点",
      ctaPatch: { density1: "concise", density2: "concise", visual1: true, visual2: true },
    });
  } else if (tiltPct < -18) {
    balancePass = false;
    balanceTag = `左坠 ${tiltPct}%`;
    faults.push({
      pillar: "balance",
      code: "leftHeavy",
      severity: 90,
      headline: `左侧视觉重量过沉（天平左倾 ${Math.abs(tiltPct)}% 示意），右卡像没写完`,
      why: "左侧塞入过多文字或体量远超右侧，导致整张幻灯片视觉重心左坠，右侧留出尴尬的空白洞，观众会下意识觉得右半页无关紧要。",
      fixHint: "精简左卡 01 的冗长字墙至 3 条要点，同时充实右卡 02 或用深酒红衬底托起右侧重量。",
      cta: "精简左卡并配平右卡",
      ctaPatch: { density1: "concise", density2: "concise", visual1: true, visual2: true, polarity: state.polarity === "bare" ? "classic" : state.polarity },
    });
  } else if (tiltPct > 18) {
    balancePass = false;
    balanceTag = `右坠 +${tiltPct}%`;
    faults.push({
      pillar: "balance",
      code: "rightHeavy",
      severity: 86,
      headline: `右侧视觉过重（天平右倾 +${tiltPct}% 示意），左卡被压成陪衬`,
      why: "深色实底本身就比浅底更具光学分量；若右侧同时叠满长字墙与图解、或宽度过肥，视觉天平会剧烈右倾，破坏两项内容的并列对话感。",
      fixHint: "适度精简右卡文字，或给左卡补上图解与微调宽比（如 54:46）来平衡深酒红的光学重量。",
      cta: "配平左右光学重量",
      ctaPatch: { density1: "concise", density2: "concise", split: state.polarity === "classic" ? 0.52 : 0.50, visual1: true },
    });
  }

  faults.sort((a, b) => b.severity - a.severity);

  const pillars = {
    modules: { pass: modulesPass, tag: modulesTag },
    alignment: { pass: alignPass, tag: alignTag },
    priority: { pass: priorityPass, tag: priorityTag },
    balance: { pass: balancePass, tag: balanceTag },
  };
  const score = [modulesPass, alignPass, priorityPass, balancePass].filter(Boolean).length;

  let verdict;
  if (score === 4) {
    const modeName =
      state.polarity === "classic" && Math.abs(splitPct1 - 50) <= 3
        ? "原海报经典明暗解"
        : state.polarity === "leftDark"
          ? "左深主轴反拍解"
          : state.polarity === "softTint"
            ? "双浅宽窄主副解"
            : "图文互补均衡解";
    verdict = {
      pass: true,
      badge: `4/4 · ${modeName}`,
      headline: `两块独立齐平、明暗有主次，光学配重稳落支点（${modeName}）`,
      why: `当前宽比 ${splitPct1}:${splitPct2}、中缝 ${gutterPx}px、顶线差 0px，左右合计 ${totalLines} 行精炼表达且视觉重心偏差仅 ${Math.abs(tiltPct)}%（示意）。观众抬头 3 秒内就能看清『各自独立，逻辑并行』的双重信息。`,
      fixHint: "试试点击「反向试错」体验双深互抢、裂谷脱节或双满字墙，或按空格运行 3 秒视线演练。",
      cta: "运行 3 秒视线演练",
      ctaAction: "gaze",
    };
  } else {
    const top = faults[0];
    verdict = {
      pass: false,
      badge: `${score}/4 · ${top.pillar === "modules" ? modulesTag : top.pillar === "alignment" ? alignTag : top.pillar === "priority" ? priorityTag : balanceTag}`,
      headline: top.headline,
      why: top.why,
      fixHint: top.fixHint,
      cta: score === 0 ? "一键校准为原海报经典解" : top.cta,
      ctaPatch: score === 0 ? SOLUTIONS[0].patch : top.ctaPatch,
      ctaAction: "patch",
    };
  }

  const estScanSec = +(
    1.5 +
    totalLines * 0.24 +
    (modulesPass ? 0 : 0.9) +
    (alignPass ? 0 : 0.7) +
    (priorityPass ? 0 : 0.6)
  ).toFixed(1);

  return {
    W,
    slideH,
    stageH,
    compact,
    deck,
    padX,
    bracketY,
    cardTopBase,
    card1,
    card2,
    drawGutter,
    gutterPx,
    deltaYPx,
    seamX,
    plusCenter,
    tones,
    splitPct1,
    splitPct2,
    items1,
    items2,
    descLines1,
    descLines2,
    bulletLines1,
    bulletLines2,
    totalTextLines1,
    totalTextLines2,
    totalLines,
    cpl1,
    cpl2,
    mass1,
    mass2,
    tiltPct,
    estScanSec,
    pillars,
    faults,
    score,
    verdict,
  };
}
