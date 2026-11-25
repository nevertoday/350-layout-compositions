// 127 · F 型扫描模式：单真源布局几何、眼动轨迹与命中核算模型
// Canvas 绘制、右侧四条原海报红点边注、白话诊单与底沿 2×3 最佳实践清单全部读取同一份评估结果。

export const STAGE_W = 1000;
export const STAGE_H = 740;
export const TOTAL_SECONDS = 6.0;

export const INITIAL_STATE = {
  scene: "landing", // landing | policy | job
  headline: "vague", // vague | tail | front
  skim: "right", // right | front | empty
  anchor: "wall", // wall | bullets | center | allbold
  cta: "bottomRight", // bottomRight | bottomLeft | topSpam
  overlay: "poster", // poster | heat | clean
  rtl: false,
  progress: 1.0, // 0..1 对应 0.0s..6.0s，开场先走一遍完整 6 秒扫读并在 1.0 停住暴露 0/4 漏读
};

export const PRESETS = [
  {
    id: "bad-start",
    label: "复原错态",
    kind: "reset",
    patch: { headline: "vague", skim: "right", anchor: "wall", cta: "bottomRight", rtl: false },
  },
  {
    id: "poster-good",
    label: "原海报顺应解",
    kind: "good",
    patch: { headline: "front", skim: "front", anchor: "bullets", cta: "bottomLeft", rtl: false },
  },
  {
    id: "rtl-good",
    label: "RTL 镜像解",
    kind: "good",
    patch: { headline: "front", skim: "front", anchor: "bullets", cta: "bottomLeft", rtl: true },
  },
  {
    id: "err-center",
    label: "试错：居中失锚",
    kind: "warn",
    patch: { headline: "front", skim: "front", anchor: "center", cta: "bottomLeft", rtl: false },
  },
  {
    id: "err-bold",
    label: "试错：全篇加粗",
    kind: "warn",
    patch: { headline: "front", skim: "front", anchor: "allbold", cta: "bottomLeft", rtl: false },
  },
  {
    id: "err-hijack",
    label: "试错：多钮劫持",
    kind: "warn",
    patch: { headline: "front", skim: "front", anchor: "bullets", cta: "topSpam", rtl: false },
  },
];

export const SCENES = {
  landing: {
    id: "landing",
    name: "落地页 · 原海报结构",
    shortName: "落地页",
    taskPrompt: "读者 6 秒内想确认：它解决什么问题、免费额度、三项核心保障与试用入口。",
    headline: {
      vague: { text: "探索面向未来的协同新范式，让团队灵感自然流动", kw: "3 秒全端同步", kwFound: false },
      tail: { text: "历经三年底层引擎重写与多端联调之后，现可实现 3 秒全端同步", kw: "3 秒全端同步", kwFound: true, kwPos: "tail" },
      front: { text: "3 秒全端同步：离线照样改，连网自动合并", kw: "3 秒全端同步", kwFound: true, kwPos: "front" },
    },
    skim: {
      right: { text: "我们始终相信效率工具不应设门槛，因此提供免费版不限人数", kw: "免费版不限人数", kwFound: true, kwPos: "tail" },
      front: { text: "免费版不限人数 · 随时一键导出原稿，没有锁定期", kw: "免费版不限人数", kwFound: true, kwPos: "front" },
      empty: { text: "欢迎进一步了解我们的品牌故事与设计愿景", kw: "免费版不限人数", kwFound: false },
    },
    anchor: {
      wallLines: [
        "关于数据安全与日常协作体验，我们的工程团队在过去多个版本中持续优化",
        "跨设备写入机制，确保每一次编辑都能顺滑保存。同时系统默认开启全链路",
        "端到端加密以保护商业文档隐私，并在云端保留 10 秒级版本回溯记录，方便",
        "成员误删后即时恢复。即使处于高铁或航班无网环境，桌面与移动客户端亦",
        "支持完整离线编辑，待信号恢复后按段落差异自动静默同步，无需手工处理。",
      ],
      wallKeywords: [
        { text: "端到端加密", line: 2, startFrac: 0.0, endFrac: 0.24 },
        { text: "10 秒级版本回溯", line: 2, startFrac: 0.54, endFrac: 0.86 },
        { text: "完整离线编辑", line: 4, startFrac: 0.08, endFrac: 0.34 },
      ],
      bullets: [
        { lead: "端到端加密", rest: "：文档离开设备前即完成本地密钥加密" },
        { lead: "10 秒回溯", rest: "：任意误删可按时间点一键回到上一版" },
        { lead: "离线可编辑", rest: "：无网环境照常写作，联网后静默合并" },
      ],
    },
    cta: {
      label: "立即行动",
      weakLabel: "如需开始体验请点此进入工作台 →",
      spamLabels: ["马上抢购", "领取优惠", "立即预约"],
    },
  },
  policy: {
    id: "policy",
    name: "长文 · 退换货政策",
    shortName: "退换货长文",
    taskPrompt: "读者 6 秒内想确认：几天可退、运费谁出、多久退款以及退货入口在哪。",
    headline: {
      vague: { text: "以用户为中心的售后保障体系与服务承诺说明", kw: "7 天无理由退货", kwFound: false },
      tail: { text: "为保障您在选购后的消费体验，所有未拆封商品均享 7 天无理由退货", kw: "7 天无理由退货", kwFound: true, kwPos: "tail" },
      front: { text: "7 天无理由退货：签收次日起算，拆箱试穿也能退", kw: "7 天无理由退货", kwFound: true, kwPos: "front" },
    },
    skim: {
      right: { text: "只要保持商品吊牌完整且不影响二次销售，即可免首重退货运费", kw: "免首重退货运费", kwFound: true, kwPos: "tail" },
      front: { text: "免首重退货运费 · 快递上门取件，无需垫付寄回邮费", kw: "免首重退货运费", kwFound: true, kwPos: "front" },
      empty: { text: "感谢您长期以来对本旗舰店的信赖与支持", kw: "免首重退货运费", kwFound: false },
    },
    anchor: {
      wallLines: [
        "根据国家相关消费保障条例及平台最新服务细则，买家在收到包裹后若发现",
        "尺码不合或与预期不符，可在订单页面发起申请。仓库验收无误后系统将在",
        "24 小时内原路退回货款，银行卡渠道视发卡行处理周期顺延。定制刻字类",
        "商品与生鲜冷链不参与无理由退换；若因质量问题退回，平台将全额补贴",
        "双向快递费用并优先补发新件，您可凭订单编号联系在线客服核对进度。",
      ],
      wallKeywords: [
        { text: "24 小时原路退款", line: 2, startFrac: 0.0, endFrac: 0.34 },
        { text: "定制类不可退", line: 2, startFrac: 0.72, endFrac: 0.96 },
        { text: "质量问题全额补运费", line: 3, startFrac: 0.62, endFrac: 0.96 },
      ],
      bullets: [
        { lead: "24 小时退款", rest: "：仓库签收核验后原路退回支付账户" },
        { lead: "三类不适用", rest: "：定制刻字、生鲜冷链与已激活数字码" },
        { lead: "质损补全邮", rest: "：商品瑕疵退换由平台承担全部往返运费" },
      ],
    },
    cta: {
      label: "申请退货",
      weakLabel: "符合上述条件者可在此填写售后表单 →",
      spamLabels: ["联系客服", "查看订单", "申请发票"],
    },
  },
  job: {
    id: "job",
    name: "列表 · 职位说明",
    shortName: "职位说明",
    taskPrompt: "求职者 6 秒内想确认：岗位与薪资、办公方式、硬性门槛和投递入口。",
    headline: {
      vague: { text: "加入充满激情的创新团队，共同定义下一代体验", kw: "交互设计师 25–35K", kwFound: false },
      tail: { text: "设计中心面向全国持续招募产品体验人才，现开放 交互设计师 25–35K", kw: "交互设计师 25–35K", kwFound: true, kwPos: "tail" },
      front: { text: "交互设计师 25–35K · 15 薪｜上海 / 可远程", kw: "交互设计师 25–35K", kwFound: true, kwPos: "front" },
    },
    skim: {
      right: { text: "团队节奏务实、扁平沟通且不鼓励形式加班，实行弹性双休与远程", kw: "弹性双休与远程", kwFound: true, kwPos: "tail" },
      front: { text: "弹性双休 + 每周 2 天远程 · 独立负责核心工作台改版", kw: "弹性双休与远程", kwFound: true, kwPos: "front" },
      empty: { text: "我们期待与志同道合的伙伴一起成长共赢", kw: "弹性双休与远程", kwFound: false },
    },
    anchor: {
      wallLines: [
        "本岗位将深度参与多端效率产品的核心流程重构，需要与产品经理及前端",
        "工程师紧密协作，把复杂业务逻辑转化为清晰直观的界面方案。我们期待",
        "候选人具备 3 年以上复杂 B 端或工具交互经验，能够独立产出可测试原型",
        "并推动设计系统落地。若你熟悉眼动可用性测试或具备基础前端实现能力",
        "将获得额外加分，面试流程精简为两轮作品集深聊，一周内反馈最终结果。",
      ],
      wallKeywords: [
        { text: "3 年以上工具经验", line: 2, startFrac: 0.16, endFrac: 0.56 },
        { text: "独立产出原型", line: 2, startFrac: 0.62, endFrac: 0.94 },
        { text: "两轮面试一周出结果", line: 4, startFrac: 0.42, endFrac: 0.92 },
      ],
      bullets: [
        { lead: "3 年工具经验", rest: "：有复杂工作台或设计系统落地作品集" },
        { lead: "可测原型能力", rest: "：能用交互原型验证关键流程与边界态" },
        { lead: "两轮一周反馈", rest: "：作品集直面设计负责人，不做无偿试稿" },
      ],
    },
    cta: {
      label: "投递简历",
      weakLabel: "如感兴趣可将作品集链接发送至招聘信箱 →",
      spamLabels: ["转发好友", "收藏职位", "看公司主页"],
    },
  },
};

// 镜像辅助：RTL 时所有水平坐标以 STAGE_W 翻转
export function mirrorX(x, w, rtl) {
  return rtl ? STAGE_W - x - w : x;
}

export function mirrorPt(x, rtl) {
  return rtl ? STAGE_W - x : x;
}

// 4 步 F 轨迹关键点（基于 127 原海报通道几何，单真源）
export function getPathAnchors(state) {
  const rtl = !!state.rtl;
  const isCenter = state.anchor === "center";
  const isSpam = state.cta === "topSpam";

  // LTR 基准坐标，RTL 时统一水平镜像
  const raw = {
    // ① 首屏钩子横扫（长）
    bar1: { x: 46, y: 42, w: 908, h: 92 },
    // ② 次级横扫（短，向右只到约 66% 内容宽，原海报比例）
    bar2: { x: 204, y: 170, w: 694, h: 72 },
    // ③ 左侧垂直锚带
    bar3: { x: 64, y: 170, w: 112, h: 526 },
    // 主图占位区（复刻原海报山月占位框）
    heroMedia: { x: 204, y: 266, w: 694, h: 94 },
    // 正文区域
    bodyBox: { x: 204, y: 380, w: 694, h: 196 },
    // ④ 行动区（原海报左下实框）
    ctaLeftBox: { x: 204, y: 604, w: 694, h: 86 },
    // 右下冷灰盲区按钮位置
    ctaRightBox: { x: 540, y: 626, w: 358, h: 48 },
    // 顶部多按钮劫持位置
    ctaSpamBox: { x: 520, y: 58, w: 410, h: 60 },
  };

  // 路径分段点（用于 0..1 连续扫读进度采样）
  const waypoints = [
    // ① 长横扫：0.00 -> 0.30
    { p: 0.0, x: 112, y: 88, stage: 1 },
    { p: 0.14, x: isSpam ? 610 : 480, y: 88, stage: 1 },
    { p: 0.22, x: isSpam ? 430 : 710, y: isSpam ? 96 : 88, stage: 1 },
    { p: 0.30, x: isSpam ? 780 : 842, y: 88, stage: 1 },
    // 跳回左侧进入 ②：0.30 -> 0.34
    { p: 0.34, x: 238, y: 206, stage: 2 },
    // ② 短横扫（约 60% 处折返，体现第二横比第一横短）：0.34 -> 0.54
    { p: 0.45, x: 470, y: 206, stage: 2 },
    { p: 0.54, x: 635, y: 206, stage: 2 },
    // 折返左侧锚带进入 ③：0.54 -> 0.59
    { p: 0.59, x: isCenter ? 310 : 122, y: 270, stage: 3 },
    // ③ 沿左侧纵向扫描（若居中对齐则视线左右摆动寻找参差行首）：0.59 -> 0.84
    { p: 0.67, x: isCenter ? 410 : 122, y: 392, stage: 3 },
    { p: 0.72, x: isCenter ? 275 : 272, y: 440, stage: 3 },
    { p: 0.78, x: isCenter ? 440 : 122, y: 492, stage: 3 },
    { p: 0.84, x: isCenter ? 330 : 122, y: 566, stage: 3 },
    // ④ 寻找行动落点：0.84 -> 1.00
    { p: 0.90, x: 245, y: 646, stage: 4 },
    { p: 1.00, x: state.cta === "bottomLeft" ? 560 : 340, y: 646, stage: 4 },
  ];

  const mirrorRect = (r) => ({ ...r, x: mirrorX(r.x, r.w, rtl) });
  return {
    bar1: mirrorRect(raw.bar1),
    bar2: mirrorRect(raw.bar2),
    bar3: mirrorRect(raw.bar3),
    heroMedia: mirrorRect(raw.heroMedia),
    bodyBox: mirrorRect(raw.bodyBox),
    ctaLeftBox: mirrorRect(raw.ctaLeftBox),
    ctaRightBox: mirrorRect(raw.ctaRightBox),
    ctaSpamBox: mirrorRect(raw.ctaSpamBox),
    waypoints: waypoints.map((w) => ({ ...w, x: mirrorPt(w.x, rtl) })),
  };
}

// 按 progress (0..1) 采样当前眼球焦点 (x, y) 与当前阶段 (1..4)
export function sampleGazeAt(progress, anchors) {
  const p = Math.max(0, Math.min(1, progress));
  const pts = anchors.waypoints;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (p <= b.p || i === pts.length - 2) {
      const span = Math.max(1e-5, b.p - a.p);
      const u = Math.max(0, Math.min(1, (p - a.p) / span));
      // 轻缓平滑插值，让眼球眼跳自然利落
      const s = u * u * (3 - 2 * u);
      return {
        x: a.x + (b.x - a.x) * s,
        y: a.y + (b.y - a.y) * s,
        stage: u > 0.5 ? b.stage : a.stage,
      };
    }
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, stage: last.stage };
}

// 计算页面上任意点 (x, y) 在 F 扫读结束时的相对注视热度 (0..1)
// 基于 F-pattern 经验衰减场（左上最高，首横宽、次横短、左侧竖条向下递减，右下盲区极低）
export function sampleHeat(x, y, state) {
  const lx = state.rtl ? STAGE_W - x : x; // 统一折算到 LTR 逻辑横坐标
  const nx = lx / STAGE_W;
  const ny = y / STAGE_H;

  // 高斯核混合模拟 NN/g 经典 F 型三带注视密度
  const g1 = Math.exp(-Math.pow((ny - 0.12) / 0.085, 2)) * (0.98 - 0.52 * Math.pow(Math.max(0, nx - 0.14), 1.35));
  const g2 = Math.exp(-Math.pow((ny - 0.28) / 0.075, 2)) * Math.exp(-Math.pow(Math.max(0, nx - 0.34) / 0.30, 2)) * 0.88;
  const g3 = Math.exp(-Math.pow((nx - 0.18) / 0.15, 2)) * Math.exp(-Math.pow(Math.max(0, ny - 0.14) / 0.62, 1.8)) * 0.84;
  // 若左侧结构清晰（非文字墙、非居中），左锚线在正文行首向右延伸出一截探视热区
  const bonusAnchor = state.anchor === "bullets" ? Math.exp(-Math.pow((nx - 0.30) / 0.14, 2)) * Math.exp(-Math.pow((ny - 0.63) / 0.18, 2)) * 0.45 : 0;
  // 左下行动落点区（当有高对比左对齐按钮时）
  const g4 = state.cta === "bottomLeft"
    ? Math.exp(-Math.pow((ny - 0.87) / 0.07, 2)) * Math.exp(-Math.pow((nx - 0.36) / 0.28, 2)) * 0.78
    : Math.exp(-Math.pow((ny - 0.87) / 0.07, 2)) * Math.exp(-Math.pow((nx - 0.25) / 0.16, 2)) * 0.28;

  let h = Math.max(g1, g2, g3, bonusAnchor, g4);
  if (state.anchor === "allbold" && ny > 0.46 && ny < 0.80) h *= 0.62; // 全粗过载稀释信息气味
  if (state.anchor === "center" && ny > 0.46 && ny < 0.80) h *= 0.64; // 居中失锚分散落点
  return Math.max(0, Math.min(1, h));
}

// 主评估函数：计算 4 大目标事实的真实矩形、命中态、左半屏注视比（示意）、6 条最佳实践清单实时状态与 7 类错态诊单
export function evaluateLayout(rawState) {
  const state = { ...INITIAL_STATE, ...rawState };
  const scene = SCENES[state.scene] || SCENES.landing;
  const anchors = getPathAnchors(state);
  const gaze = sampleGazeAt(state.progress, anchors);
  const rtl = !!state.rtl;

  // --- 1. 生成 4 个区块真实目标框（与 Canvas 绘制共用！） ---
  const targets = [];

  // T1: 首屏钩子
  const hData = scene.headline[state.headline];
  let t1Rect;
  if (!hData.kwFound) {
    t1Rect = { x: mirrorX(220, 320, rtl), y: 66, w: 320, h: 42 };
  } else if (hData.kwPos === "tail") {
    t1Rect = { x: mirrorX(690, 210, rtl), y: 66, w: 210, h: 42 };
  } else {
    t1Rect = { x: mirrorX(158, 230, rtl), y: 66, w: 230, h: 42 };
  }
  const t1Heat = hData.kwFound ? sampleHeat(t1Rect.x + t1Rect.w / 2, t1Rect.y + t1Rect.h / 2, state) : 0.08;
  const t1Hit = hData.kwFound && hData.kwPos === "front" && state.cta !== "topSpam";
  const t1HitAt = 0.14;
  targets.push({
    id: "T1",
    zone: 1,
    zoneName: "首屏钩子",
    kw: hData.kw,
    rect: t1Rect,
    heat: t1Heat,
    fullHit: t1Hit,
    hitNow: t1Hit && state.progress >= t1HitAt,
    hitAt: t1HitAt,
    reason: !hData.kwFound
      ? "首行只放了空泛口号，核心价值缺席"
      : state.cta === "topSpam"
        ? "首行塞满多个红按钮，劫持了标题第一眼"
        : hData.kwPos === "tail"
          ? "核心卖点压在首行最末端，第一横扫尾端注意衰减"
          : "首行前 6 字直给结论，0.8 秒内直接命中",
  });

  // T2: 次级横扫
  const sData = scene.skim[state.skim];
  let t2Rect;
  if (!sData.kwFound) {
    t2Rect = { x: mirrorX(230, 240, rtl), y: 186, w: 240, h: 38 };
  } else if (sData.kwPos === "tail") {
    t2Rect = { x: mirrorX(675, 200, rtl), y: 186, w: 200, h: 38 };
  } else {
    t2Rect = { x: mirrorX(230, 228, rtl), y: 186, w: 228, h: 38 };
  }
  const t2Heat = sData.kwFound ? sampleHeat(t2Rect.x + t2Rect.w / 2, t2Rect.y + t2Rect.h / 2, state) : 0.06;
  const t2Hit = sData.kwFound && sData.kwPos === "front";
  const t2HitAt = 0.42;
  targets.push({
    id: "T2",
    zone: 2,
    zoneName: "次级横扫",
    kw: sData.kw,
    rect: t2Rect,
    heat: t2Heat,
    fullHit: t2Hit,
    hitNow: t2Hit && state.progress >= t2HitAt,
    hitAt: t2HitAt,
    reason: !sData.kwFound
      ? "第二行放了寒暄废话，浪费了次级横扫黄金带"
      : sData.kwPos === "tail"
        ? "关键词藏在右侧 72% 以后，第二次短横扫提前折返漏读"
        : "关键规格前置到第二行左段，稳稳吃满次级横扫",
  });

  // T3: 左侧锚点正文要点（3 项合并计为关键锚点命中）
  const body = anchors.bodyBox;
  const anchorItems = [];
  if (state.anchor === "wall") {
    const lineH = 34;
    scene.anchor.wallKeywords.forEach((wk, i) => {
      const rx = 204 + wk.startFrac * 660;
      const rw = Math.max(110, (wk.endFrac - wk.startFrac) * 660);
      const ry = 392 + wk.line * lineH;
      const rect = { x: mirrorX(rx, rw, rtl), y: ry, w: rw, h: 26 };
      anchorItems.push({
        text: wk.text,
        rect,
        heat: sampleHeat(rect.x + rect.w / 2, rect.y + rect.h / 2, state),
        caught: false,
      });
    });
  } else {
    const rowH = 54;
    const centerOffsets = [150, 210, 128]; // 居中对齐时参差的左起点
    scene.anchor.bullets.forEach((b, i) => {
      const baseX = state.anchor === "center" ? 204 + centerOffsets[i] : 244;
      const rw = 166;
      const ry = 398 + i * rowH;
      const rect = { x: mirrorX(baseX, rw, rtl), y: ry, w: rw, h: 32 };
      anchorItems.push({
        text: b.lead,
        rect,
        heat: sampleHeat(rect.x + rect.w / 2, rect.y + rect.h / 2, state),
        caught: state.anchor === "bullets",
      });
    });
  }
  const t3Hit = state.anchor === "bullets";
  const t3HitAt = 0.72;
  const t3AvgHeat = anchorItems.reduce((s, it) => s + it.heat, 0) / anchorItems.length;
  targets.push({
    id: "T3",
    zone: 3,
    zoneName: "左侧锚点",
    kw: anchorItems.map((i) => i.text).join(" / "),
    rect: anchorItems[0].rect,
    items: anchorItems,
    heat: t3AvgHeat,
    fullHit: t3Hit,
    hitNow: t3Hit && state.progress >= t3HitAt,
    hitAt: t3HitAt,
    reason: state.anchor === "wall"
      ? "5 行连续文字墙没有项目符与小标题，关键参数全埋进盲区"
      : state.anchor === "center"
        ? "居中对齐让每行起点左右漂移，眼睛沿左缘下滑时找不到垂直锚线"
        : state.anchor === "allbold"
          ? "通篇加粗涂红导致所有词同等抢眼，视觉层级塌成一片噪声"
          : "三条要点沿左锚线垂直对齐、前 5 字亮出关键词，纵扫一次捕齐",
  });

  // T4: 行动位置
  const ctaRect = state.cta === "bottomLeft"
    ? anchors.ctaLeftBox
    : state.cta === "topSpam"
      ? anchors.ctaSpamBox
      : anchors.ctaRightBox;
  const t4Heat = sampleHeat(ctaRect.x + ctaRect.w / 2, ctaRect.y + ctaRect.h / 2, state);
  const t4Hit = state.cta === "bottomLeft";
  const t4HitAt = 0.90;
  targets.push({
    id: "T4",
    zone: 4,
    zoneName: "行动位置",
    kw: scene.cta.label,
    rect: ctaRect,
    heat: t4Heat,
    fullHit: t4Hit,
    hitNow: t4Hit && state.progress >= t4HitAt,
    hitAt: t4HitAt,
    reason: state.cta === "bottomRight"
      ? "行动入口缩在右下冷灰文字链，正中 F 扫描最低注视盲区"
      : state.cta === "topSpam"
        ? "首行并排塞进 3 个红按钮，用户还没搞懂价值就被催促点击"
        : "高对比主按钮稳落左下锚点线末端，顺接垂直扫描自然收口",
  });

  const fullHits = targets.filter((t) => t.fullHit).length;
  const currentHits = targets.filter((t) => t.hitNow).length;

  // 计算左/主锚侧关注占比（示意）：依据四区元素与热力场重心实时估算
  let anchorSidePct = 58;
  if (state.headline === "front") anchorSidePct += 7;
  if (state.skim === "front") anchorSidePct += 6;
  if (state.anchor === "bullets") anchorSidePct += 9;
  if (state.anchor === "center") anchorSidePct -= 16;
  if (state.anchor === "allbold") anchorSidePct -= 6;
  if (state.cta === "bottomLeft") anchorSidePct += 5;
  if (state.cta === "bottomRight") anchorSidePct -= 4;
  if (state.cta === "topSpam") anchorSidePct -= 11;
  anchorSidePct = Math.max(38, Math.min(84, anchorSidePct));

  // 左侧锚线稳定度（由实绘行首横坐标方差核算）
  const anchorVariance = state.anchor === "center" ? 56 : state.anchor === "wall" ? 18 : 0;

  // --- 2. 诊断 7 类真错态（按严重度排主诊断） ---
  const errors = [];
  if (state.cta === "topSpam") {
    errors.push({
      code: "cta_hijack",
      badge: "过早劫持",
      title: "首行硬塞 3 个红按钮，打断了第一横扫",
      why: "读者打开页面前 1.8 秒都在确认「这里解决什么问题」。在首行右侧并排堆砌三个高饱和行动按钮，会让视线在标题与按钮间来回跳跃，核心主张反而没被读进去。",
      fix: "把主行动按钮收束为唯一一个，挪到左下锚点线末端，让信息先建立信任再收口。",
      fixPatch: { cta: "bottomLeft" },
      fixLabel: "把按钮归位到左下锚点",
      focusZone: 4,
    });
  }
  if (state.anchor === "center") {
    errors.push({
      code: "center_drift",
      badge: "居中失锚",
      title: "正文居中排布，左侧垂直锚线断掉了",
      why: `第 3 步垂直扫读依赖一条笔直的${rtl ? "右" : "左"}侧起始线。居中对齐让三行起点左右错开 ${anchorVariance}px，眼睛每往下看一行都要重新找行首，扫读立刻变慢甚至跳过。`,
      fix: `改回${rtl ? "右" : "左"}对齐并配清晰项目符号，让每一条关键词垂直落在同一条线上。`,
      fixPatch: { anchor: "bullets" },
      fixLabel: "恢复左对齐锚点列表",
      focusZone: 3,
    });
  }
  if (state.anchor === "allbold") {
    errors.push({
      code: "bold_overload",
      badge: "全粗过载",
      title: "满屏文字全部加粗标红，等于没有重点",
      why: "当正文里的每个词都抢着举手，信息气味就会被噪声淹没。眼睛无法分辨哪 4 个字才是扫描停靠点，只能重新退回慢速逐字分辨或直接放弃。",
      fix: "只加粗每条最前面 4–5 个信息词，其余解释退回常规字重，立刻拉开扫读层级。",
      fixPatch: { anchor: "bullets" },
      fixLabel: "收敛为前 5 字关键词加粗",
      focusZone: 3,
    });
  }
  if (state.anchor === "wall") {
    errors.push({
      code: "wall_buried",
      badge: "文字墙埋词",
      title: "5 行连续文字墙，正文里的 3 项关键信息全掉进盲区",
      why: "面对没有小标题和列表符的一大块密排段落，眼睛不会逐行读到右侧，只会贴着边沿快速滑过去，把埋在中下与右侧的关键参数整块跳过。",
      fix: "拆成短要点并加上左侧项目符号，把每条的核心词提至行首。",
      fixPatch: { anchor: "bullets" },
      fixLabel: "拆成左侧锚点列表",
      focusZone: 3,
    });
  }
  if (state.headline !== "front") {
    errors.push({
      code: "headline_weak",
      badge: state.headline === "vague" ? "空话钩子" : "结论埋尾",
      title: state.headline === "vague"
        ? "首行只写空泛口号，第 1 笔长横扫白白浪费"
        : "首行核心卖点压在行尾，第一横扫尾端注意衰退",
      why: state.headline === "vague"
        ? "第一横扫是全页注视时间最长的黄金带。若首行只放放之四海而皆准的空话，读者 1 秒内判断信息气味太弱，还没看下面就已经关掉页面。"
        : "即使在第一行，人眼的注视热度也会从起点向行尾逐步衰减。把真正有用的结论留在前面冗长铺垫之后，很多人扫到一半就往下跳了。",
      fix: "把最核心的结论直接提至首行最前面，砍掉铺垫套话。",
      fixPatch: { headline: "front" },
      fixLabel: "首行直给核心结论",
      focusZone: 1,
    });
  }
  if (state.skim !== "front") {
    errors.push({
      code: "skim_right",
      badge: state.skim === "empty" ? "次行空转" : "行尾埋词",
      title: state.skim === "empty"
        ? "第二行没有硬信息，次级横扫扑了个空"
        : "次级要点藏在右侧 70% 之后，被短横扫直接跳过",
      why: state.skim === "empty"
        ? "读完首行后，眼睛会下移做第二次横向确认。这里若放品牌寒暄而不是硬规格，会打断读者的决策节奏。"
        : "F 型的第二横明显短于第一横，眼睛通常扫过前 55%–65% 就折返向左。把关键规格藏在长句末尾，恰好落进第二横的折返盲区。",
      fix: "把核心规格挪到第二行前 6 个字里，顺接第一次横扫的惯性。",
      fixPatch: { skim: "front" },
      fixLabel: "次行关键词前置",
      focusZone: 2,
    });
  }
  if (state.cta === "bottomRight") {
    errors.push({
      code: "cta_blind",
      badge: "右下盲区",
      title: "行动入口藏在右下角淡色文字链，F 扫读根本扫不到",
      why: "F 扫读末段视线沿着左侧锚线一路下滑，右下角是整张页面注视密度最低的死角。把关键按钮缩成右下淡灰小字，读者即使看懂了也很难立刻动手。",
      fix: "把主按钮放到左下锚点线正下方，并用清晰色块与箭头承接视线落点。",
      fixPatch: { cta: "bottomLeft" },
      fixLabel: "移至左下主行动区",
      focusZone: 4,
    });
  }

  // --- 3. 1:1 复刻原海报底部 6 条最佳实践清单实时状态 ---
  const checklist = [
    {
      id: "headline",
      icon: "H",
      title: "强有力的 headline",
      posterSub: "在首行抓住注意力",
      ok: state.headline === "front" && state.cta !== "topSpam",
      statusText: state.headline === "front"
        ? (state.cta === "topSpam" ? "被多钮打断" : "首行直给结论")
        : (state.headline === "vague" ? "空泛套话" : "结论埋行尾"),
      focusZone: 1,
    },
    {
      id: "frontload",
      icon: "key",
      title: "关键词前置",
      posterSub: "把关键放在前面",
      ok: state.headline === "front" && state.skim === "front" && state.anchor !== "wall",
      statusText: state.headline === "front" && state.skim === "front" && state.anchor !== "wall"
        ? "落于前 45% 热区"
        : "仍有词埋右侧",
      focusZone: 2,
    },
    {
      id: "hierarchy",
      icon: "list",
      title: "内容分层清晰",
      posterSub: "短段落、要点化呈现",
      ok: state.anchor === "bullets",
      statusText: state.anchor === "wall"
        ? "5 行连续文字墙"
        : state.anchor === "allbold"
          ? "全粗无层级"
          : state.anchor === "center"
            ? "居中无纵线"
            : "短要点分层清晰",
      focusZone: 3,
    },
    {
      id: "scannable",
      icon: "eye",
      title: "快速可略读",
      posterSub: "使用小标题与视觉符号",
      ok: state.anchor === "bullets" && state.skim === "front",
      statusText: state.anchor === "bullets" && state.skim === "front" ? "6 秒扫中 4/4" : `当前扫中 ${fullHits}/4`,
      focusZone: 3,
    },
    {
      id: "leftAnchor",
      icon: "bar",
      title: "左侧对齐优先",
      posterSub: "建立稳定的阅读锚点",
      ok: state.anchor !== "center",
      statusText: state.anchor === "center"
        ? `错位 ±${anchorVariance}px`
        : rtl ? "右缘锚线镜像齐" : "左缘锚线对齐",
      focusZone: 3,
    },
    {
      id: "cta",
      icon: "cursor",
      title: "CTA 明显可见",
      posterSub: "降低操作成本，引导行动",
      ok: state.cta === "bottomLeft",
      statusText: state.cta === "bottomLeft"
        ? "落于锚线末端"
        : state.cta === "topSpam"
          ? "首行 3 钮冲突"
          : "埋在右下盲区",
      focusZone: 4,
    },
  ];

  const checklistPass = checklist.filter((c) => c.ok).length;
  const isSolved = errors.length === 0 && fullHits === 4;

  const diagnosis = isSolved
    ? {
        ok: true,
        badge: rtl ? "4/4 · RTL 镜像成立" : "4/4 · F 通道全命中",
        title: rtl
          ? "书写方向翻转后，镜像反 F 照样 6 秒全命中"
          : "4 项核心信息全部落进 F 扫读热区，零盲区漏读",
        why: rtl
          ? "阿拉伯语等从右向左页面里，眼动路径会镜像为「反 F」。因为四区关键词和按钮也跟着对齐到了右侧锚线，6 秒扫读照样把核心信息一次抓齐。"
          : "首行 1 秒锁定核心价值，次行前段接住关键规格，左侧三条要点搭出清晰停靠点，最后顺着锚线直达左下行动框——读者不用逐字硬啃，也不会漏掉任何关键事实。",
        fix: "可以试着点「居中失锚」「全篇加粗」或切换「退换货长文 / 职位说明」，反向验证破坏任何一环会怎样丢掉命中。",
        fixPatch: null,
        fixLabel: "",
      }
    : {
        ok: false,
        badge: `${fullHits}/4 · ${errors[0].badge}`,
        title: errors[0].title,
        why: errors[0].why,
        fix: errors[0].fix,
        fixPatch: errors[0].fixPatch,
        fixLabel: errors[0].fixLabel,
        focusZone: errors[0].focusZone,
      };

  return {
    state,
    scene,
    anchors,
    gaze,
    targets,
    fullHits,
    currentHits,
    anchorSidePct,
    anchorVariance,
    errors,
    checklist,
    checklistPass,
    isSolved,
    diagnosis,
    timeSec: +(state.progress * TOTAL_SECONDS).toFixed(1),
  };
}

// =====================================================================
// 第 02 节：4 把排版手术刀（软件年费自动续订声明，单真源重算 3 秒命中率）
// =====================================================================
export function evaluateSurgery(knobs) {
  const { pyramid, frontload, chunk, bullets, overbold } = knobs;

  // 4 条读者最关心的核心条款
  const facts = [
    {
      id: "date",
      label: "扣费日期：12 月 1 日",
      hit: pyramid || (chunk && frontload && !overbold),
      why: pyramid ? "结论置顶第 1 句即露面" : chunk && frontload && !overbold ? "拆段且前字亮出后被左侧纵扫抓住" : "埋在长段中后部，3 秒略读漏过",
    },
    {
      id: "price",
      label: "续费金额：298 元/年",
      hit: (pyramid || frontload) && !overbold,
      why: overbold ? "全篇乱加粗稀释了数字突出度" : pyramid || frontload ? "紧跟首行或行首前 5 字，横扫直击" : "压在长句末尾右侧，扫读提前折返",
    },
    {
      id: "cancel",
      label: "取消时限：扣款前 24 小时",
      hit: bullets && frontload && !overbold,
      why: overbold ? "满屏粗体噪声淹没了时限条款" : bullets && frontload ? "独立列表项 + 关键词前置，左锚一次扫中" : "混在连续文字墙里，未停驻",
    },
    {
      id: "path",
      label: "关闭路径：设置 → 订阅管理",
      hit: (chunk || bullets) && !overbold,
      why: overbold ? "操作路径与废话同粗，难以分辨" : chunk || bullets ? "独立短条收尾，视线沿左缘滑到底部直达" : "藏在文末右下角，被跳过",
    },
  ];

  const hitCount = facts.filter((f) => f.hit).length;
  const activeTools = [pyramid, frontload, chunk, bullets].filter(Boolean).length;
  let grade = "文字墙高漏读";
  let note = "四项核心条款全埋在密排长句里，读者 3 秒扫读极易忽略扣款日期与取消窗口。";
  if (overbold) {
    grade = "全篇加粗噪声过载";
    note = "打开了「全篇乱加粗」反例：当整段文字都加粗时，重点与废话失去视觉落差，3 秒抓词反而掉回低谷。";
  } else if (hitCount === 4) {
    grade = "3 秒四项全中（已升级为可扫读结构）";
    note = "你其实已经把盲目的 F 扫读升级成了清晰的「标题+要点」扫读：读者不再靠运气碰关键词，而是沿着前 4 字和项目符稳准取信息。";
  } else if (hitCount >= 2) {
    grade = `部分可见（命中 ${hitCount}/4）`;
    note = "已有核心信息露到前两横或左锚区，再把剩余条款拆成短要点并前置关键词，即可消除右下漏读。";
  } else if (activeTools > 0) {
    grade = `仍有盲区（命中 ${hitCount}/4）`;
    note = "单靠一处改动还不足以拆散整块文字墙，试试叠加「关键词前置」与「项目符号」。";
  }

  return { facts, hitCount, grade, note };
}

// =====================================================================
// 第 03 节：1997–2020 眼动实证档案（全部核实）
// =====================================================================
export const HISTORY_CARDS = [
  {
    year: "1997",
    who: "Jakob Nielsen & John Morkes",
    title: "79% 扫读，仅 16% 逐字读",
    summary: "在《How Users Read on the Web》中首次系统实测指出：网页用户几乎不逐字通读，79% 始终扫读新页面，只有 16% 逐字阅读；提出倒金字塔、小标题与列表化写作。",
    metric: "79% vs 16%",
    metricNote: "扫读与逐字通读比例",
  },
  {
    year: "1999",
    who: "Peter Pirolli & Stuart K. Card",
    title: "信息觅食理论与信息气味",
    summary: "发表于《Psychological Review》106(4) 的经典论文（2007 年由牛津大学出版社扩写成专著）：人脑像动物觅食一样，在信息斑块中追随「信息气味」，用最小眼跳成本换取最大收益——这是 F 型省力扫读的认知根源。",
    metric: "Info Scent",
    metricNote: "单位时间的线索收益",
  },
  {
    year: "2006",
    who: "Jakob Nielsen · NN/g",
    title: "232 名用户眼动热图定名 F 型",
    summary: "4 月 16 日发表《F-Shaped Pattern For Reading Web Content》，追踪 232 名用户浏览数千网页，热力图清晰呈现「上长横、中短横、左竖条」的 F 字形分布。",
    metric: "232 位受试者",
    metricNote: "数千张网页眼动热图",
  },
  {
    year: "2010→2017",
    who: "Jakob Nielsen → Therese Fessenden",
    title: "左半屏注视占比从 69% 升至 80%",
    summary: "2010 年研究显示 69% 的观看时间落在屏幕左半侧（右半 30%）；2017 年在 1920×1080 宽屏下复测，左半侧注视时间进一步升至约 80%，右半侧仅约 20%。",
    metric: "69% → 80%",
    metricNote: "左半屏注视时间占比",
  },
  {
    year: "2017",
    who: "Kara Pernice · NN/g",
    title: "11 年复验：被误解的不是模板",
    summary: "11 月 12 日发文指出：F 型并非设计师要硬凑的版式模具，而是面对密排无格式文字时的默认退守；它在手机窄屏仍成立，而在阿拉伯语等从右到左页面里会水平镜像为「反 F」。",
    metric: "LTR ↔ RTL",
    metricNote: "手机与镜像语言均成立",
  },
  {
    year: "2020",
    who: "Kate Moran · NN/g",
    title: "13 年眼动总览：多模式并存",
    summary: "4 月 5 日《How People Read Online》回顾 2006–2019 年多轮研究：人眼仍以非线性扫读为主，排版良好时会从盲目 F 型转为更高效的层蛋糕、斑点或弹球扫读。",
    metric: "13 年纵贯",
    metricNote: "好排版可转化 F 扫读",
  },
];

// =====================================================================
// 第 04 节：同小类五式分工（严格不重讲他页重点，一句话 + 外链）
// =====================================================================
export const READING_FAMILY = [
  {
    id: "127",
    name: "F 型扫描模式",
    en: "F-PATTERN",
    current: true,
    trigger: "文字密集、段落偏长、急于抓重点的资讯/文章/政策/列表页",
    oneLine: "顺应「先长横、再短横、后左纵」的省力习惯，用关键词前置与左锚点兜住核心信息，再靠结构化把盲扫变精扫。",
    url: "https://layout.xiaoxiaodong.ai/127/play/",
  },
  {
    id: "128",
    name: "Z 型扫描模式",
    en: "Z-PATTERN",
    current: false,
    trigger: "文字极少、视觉元素主导、需要快速收口行动的品牌首屏或海报",
    oneLine: "适合少字、开阔的视觉落地页，视线沿对角折返直达右下行动点。",
    url: "https://layout.xiaoxiaodong.ai/128/play/",
  },
  {
    id: "129",
    name: "古腾堡图式",
    en: "GUTENBERG DIAGRAM",
    current: false,
    trigger: "密度均匀、无强烈局部视觉重心的均质报刊与纯文字大版面",
    oneLine: "描述均质信息版面中视线受阅读重力牵引从左上滑向右下终点的自然倾向。",
    url: "https://layout.xiaoxiaodong.ai/129/play/",
  },
  {
    id: "130",
    name: "层蛋糕扫描模式",
    en: "LAYER-CAKE",
    current: false,
    trigger: "小标题层级清晰、段落分明的长文档与说明页（F 型的健康升级形态）",
    oneLine: "当小标题足够清晰时，读者不再盲扫左缘，而是只横扫各层标题直奔目标章节。",
    url: "https://layout.xiaoxiaodong.ai/130/play/",
  },
  {
    id: "131",
    name: "斑点扫描模式",
    en: "SPOTTED PATTERN",
    current: false,
    trigger: "含明确数字、徽标、加粗术语、链接等跳色锚点的检索型页面",
    oneLine: "读者跳过大段文字，视线像跳跃的斑点一样直接锁定数字、加粗词或特定视觉符号。",
    url: "https://layout.xiaoxiaodong.ai/131/play/",
  },
];

// =====================================================================
// 第 05 节：什么时候别用（4 张误用诊疗卡）
// =====================================================================
export const ANTI_CASES = [
  {
    id: "mold",
    tag: "误区 01",
    title: "把 F 型当成固定模板硬塞元素",
    surface: "刻意把页面排成左上厚重、右下空洞的「大 F 形框」，甚至牺牲右侧全部功能区。",
    failure: "NN/g 明确指出 F 型是面对糟糕文字墙时的默认退守，而非理想审美模板。故意照着 F 挖空右下，反而主动制造了死角与失衡。",
    instead: "顺应「重要词靠前靠左」，同时用清晰小标题和短列表把页面升级成层蛋糕或模块化扫读。",
  },
  {
    id: "visual",
    tag: "误区 02",
    title: "少字品牌主视觉、海报与作品集画廊",
    surface: "总共只有一句话和一张主图，却硬套左对齐三段横条加左下长条按钮。",
    failure: "文字极少时人眼并不会启动文字墙省力扫读，而是直接被构图重心或对角路径牵引，硬套 F 骨架只会显得呆板局促。",
    instead: "让主图与留白建立单一视觉落点，或参考同小类的 Z 型扫描（128）分配首屏四角重心。",
  },
  {
    id: "deep",
    tag: "误区 03",
    title: "需要逐字精读的深度长文、契约与小说",
    surface: "在文学长文或严肃法律条文里频繁塞入夸张行首标红和营销钩子，逼人跳读。",
    failure: "精读场景要的是平稳连贯的行长、舒适行距与沉静节奏，人为制造强烈的左缘跳读刺激反而打断理解。",
    instead: "保留舒朗的版心与稳定行宽，仅用克制的章节小标题方便读者定位，不强迫压缩成碎片口号。",
  },
  {
    id: "compare",
    tag: "误区 04",
    title: "多列价格对比表、数据仪表盘与网格目录",
    surface: "在三列套餐对比或数据看板中把所有关键指标都挤到最左列，右侧列弱化留白。",
    failure: "表格和看板依赖跨列横向对齐比较，读者本来就需要按列对比每一项数值，强行左重右轻会破坏对照效率。",
    instead: "用对齐基线、清晰列头和单一推荐列高对比来服务横向比较，而不是套用长文 F 规则。",
  },
];

// =====================================================================
// 第 06 节：单变量小练习（机场快线退票规则）
// =====================================================================
export const QUIZ_DATA = {
  prompt: "赶时间的旅客打开「机场快线退票规则」，只想在 4 秒内确认：起飞前 2 小时内退票要扣 20% 手续费，并立刻找到「提交退票」入口。以下 4 版字数与事实完全相同，哪一版最不容易被 F 型扫读漏掉？",
  answer: "B",
  options: [
    {
      id: "A",
      label: "方案 A",
      neutralTag: "版式样本 01",
      meta: "左对齐 · 套话开头 · 右下文字链",
      verdict: "漏读核心费率与按钮",
      reason: "虽然左对齐，但首行和每条开头都是「根据机场快线运营管理规定…」等无信息套话，真正的「2 小时内」「20%」压在行尾右侧，按钮又缩在右下盲区，4 秒扫读几乎全漏。",
    },
    {
      id: "B",
      label: "方案 B",
      neutralTag: "版式样本 02",
      meta: "左对齐 · 关键词前置 · 左下主钮",
      verdict: "正确：4 秒一次抓齐",
      reason: "首行直给「2 小时内退票扣 20%」，次行前 5 字交代「2 小时外全额退」，左侧三条要点垂直对齐且行首亮词，主按钮稳落左下锚点线末端——四步 F 路径每一步都精准命中目标信息。",
    },
    {
      id: "C",
      label: "方案 C",
      neutralTag: "版式样本 03",
      meta: "居中对齐 · 全篇加粗 · 居中悬浮钮",
      verdict: "失锚且视觉过载",
      reason: "虽把关键词放到了前面，但整页居中对齐导致每行起点左右错落、左侧垂直锚线消失；同时四行全部加粗放大，重点和普通解释没有反差，眼睛扫读时失去停靠层级。",
    },
    {
      id: "D",
      label: "方案 D",
      neutralTag: "版式样本 04",
      meta: "顶部欢迎语 · 长段文字墙 · 左下主钮",
      verdict: "文字墙吞没核心数字",
      reason: "尽管左下放了醒目按钮，但首行浪费在装饰欢迎语上，真正决定旅客要不要退票的「2 小时内扣 20%」埋在中间 6 行连续长段的右下角，很容易点下去之前根本没看见扣费标准。",
    },
  ],
};
