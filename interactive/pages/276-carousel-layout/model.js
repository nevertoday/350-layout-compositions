// 276 轮播布局（CAROUSEL LAYOUT）单一真源模型
// 开场活体轮播与全部小节实验的几何参数、诊断结论与教学数据均从此模块派生。

export const HERO_SLIDES = [
  {
    id: 0,
    tag: "前一项内容",
    body: "左侧内容部分露出，提示可向左滑动。",
    chips: ["PREVIEW"],
    theme: "mint",
    art: "mint-hills",
  },
  {
    id: 1,
    tag: "核心内容",
    body: "当前卡片聚焦展示，承载最重要的信息，引导用户的主要注意力。",
    chips: ["FOCUS", "PRIMARY", "IMPORTANT"],
    theme: "teal",
    art: "teal-peak",
  },
  {
    id: 2,
    tag: "后一项内容",
    body: "右侧内容部分露出，提示可向右滑动。",
    chips: ["PREVIEW"],
    theme: "amber",
    art: "amber-dune",
  },
  {
    id: 3,
    tag: "连贯序列",
    body: "保持统一卡片骨架，连续滑动时视线无需重新适应版式。",
    chips: ["SEQUENCE"],
    theme: "slate",
    art: "slate-arch",
  },
  {
    id: 4,
    tag: "边界感知",
    body: "清晰标出总帧数与首尾边界，让探索始终有头有尾。",
    chips: ["BOUNDARY"],
    theme: "sage",
    art: "sage-terrace",
  },
];

export const FOCUS_MODES = {
  flat: { id: "flat", label: "1.00× 平权", scale: 1.0, sideOpacity: 1.0, shadow: 0 },
  mild: { id: "mild", label: "1.10× 轻抬", scale: 1.1, sideOpacity: 0.84, shadow: 1 },
  poster: { id: "poster", label: "1.18× 原海报", scale: 1.18, sideOpacity: 0.74, shadow: 2 },
  extreme: { id: "extreme", label: "1.38× 过猛", scale: 1.38, sideOpacity: 0.62, shadow: 3 },
};

export const CONTROL_MODES = {
  none: { id: "none", label: "全隐藏", arrows: false, dots: 0 },
  dots: { id: "dots", label: "仅圆点", arrows: false, dots: 5 },
  both: { id: "both", label: "箭+5点", arrows: true, dots: 5 },
  overload: { id: "overload", label: "12点过载", arrows: true, dots: 12 },
};

export const PACE_MODES = {
  fast: { id: "fast", label: "1.8s 狂飙自播", intervalMs: 1800, pauseOnHover: false, manual: false },
  slow: { id: "slow", label: "5s 悬停即停", intervalMs: 5000, pauseOnHover: true, manual: false },
  manual: { id: "manual", label: "手动掌控", intervalMs: 0, pauseOnHover: true, manual: true },
};

// 开场刻意停在 0/4 翻车错态：100% 占满无露边、平权无聚焦、隐藏导航、1.8s 强制自播
export const DEFAULT_WRONG_STATE = {
  index: 1,
  cardPct: 100,
  focusMode: "flat",
  controls: "none",
  pace: "fast",
  paused: false,
};

// 原海报推荐参考状态（仅在用户点击「看原海报参考」或自己调出时进入）
export const POSTER_GOOD_STATE = {
  index: 1,
  cardPct: 58,
  focusMode: "poster",
  controls: "both",
  pace: "manual",
  paused: false,
};

export const PEEK_COMFORT = { minPct: 6, maxPct: 23, minCardPct: 52, maxCardPct: 84 };
export const FOCUS_COMFORT = { minScale: 1.08, maxScale: 1.24 };

/**
 * 由真实视口像素宽度与当前状态，计算全部轮播几何参数与四柱原则诊断。
 * @param {object} state
 * @param {number} viewportWidth 实测视口像素宽
 */
export function evaluateHero(state, viewportWidth = 1000) {
  const vw = Math.max(260, viewportWidth || 1000);
  const gapPx = vw < 520 ? 12 : vw < 900 ? 18 : 24;
  const focus = FOCUS_MODES[state.focusMode] || FOCUS_MODES.flat;
  const ctrl = CONTROL_MODES[state.controls] || CONTROL_MODES.none;
  const pace = PACE_MODES[state.pace] || PACE_MODES.fast;

  const cardPct = Math.max(44, Math.min(100, Number(state.cardPct) || 100));
  const cardW = (vw * cardPct) / 100;
  const sideScale = 1 / focus.scale;
  const sideW = cardW * sideScale;
  const areaRatio = focus.scale * focus.scale;

  // 居中卡片边缘到视口边缘的剩余空间减去间距，即为真正露出的单侧卡片像素
  const sideMargin = (vw - cardW) / 2;
  const peekPx = Math.max(0, sideMargin - gapPx);
  const peekRatioPct = (peekPx / vw) * 100;
  const peekOfCardPct = sideW > 0 ? Math.min(100, (peekPx / sideW) * 100) : 0;

  // 中心距：保证居中卡和紧邻缩小侧卡之间恰留 gapPx 净空
  const stepPx = cardW * 0.5 + sideW * 0.5 + gapPx;

  // 1) 预览提示判定（双向检错：太小闷死 / 假边缘缝隙 / 太大碎成多列网格）
  let previewStatus = "ok";
  let previewBadge = `单侧露 ${Math.round(peekPx)}px`;
  if (peekPx < 2 && cardPct >= 95) {
    previewStatus = "hidden";
    previewBadge = "露边 0px · 闷死";
  } else if (peekPx <= 10 || peekRatioPct < PEEK_COMFORT.minPct) {
    previewStatus = peekPx <= 6 ? "false-edge" : "tight";
    previewBadge = peekPx <= 6 ? `仅露缝隙 ${Math.round(peekPx)}px` : `露边 ${peekRatioPct.toFixed(0)}% 过窄`;
  } else if (peekRatioPct > PEEK_COMFORT.maxPct) {
    previewStatus = "grid";
    previewBadge = `露边 ${peekRatioPct.toFixed(0)}% · 碎卡墙`;
  }
  const previewOk = previewStatus === "ok";

  // 2) 聚焦展示判定（双向检错：平权无主次 vs 过猛压扁侧卡）
  let focusStatus = "ok";
  let focusBadge = `${focus.scale.toFixed(2)}× · 面积 ${areaRatio.toFixed(2)}×`;
  if (focus.scale < FOCUS_COMFORT.minScale) {
    focusStatus = "flat";
    focusBadge = "1.00× 平权抢戏";
  } else if (focus.scale > FOCUS_COMFORT.maxScale) {
    focusStatus = "extreme";
    focusBadge = `${focus.scale.toFixed(2)}× 压扁侧卡`;
  }
  const focusOk = focusStatus === "ok";

  // 3) 导航控制判定
  let navStatus = "ok";
  let navBadge = "骑边箭 + 5 枚圆点";
  if (state.controls === "none") {
    navStatus = "none";
    navBadge = "无箭无点 · 盲翻";
  } else if (state.controls === "dots") {
    navStatus = "dots";
    navBadge = "仅圆点 · 缺方向键";
  } else if (state.controls === "overload") {
    navStatus = "overload";
    navBadge = "12 帧圆点过载";
  }
  const navOk = navStatus === "ok";

  // 4) 连续浏览（掌控节奏）判定
  let flowStatus = "ok";
  let flowBadge = state.pace === "manual" ? "手动掌控节奏" : "5s 慢播·悬停即停";
  if (state.pace === "fast") {
    flowStatus = "fast";
    flowBadge = "1.8s 抢读自播";
  }
  const flowOk = flowStatus === "ok";

  const pillars = {
    focus: { ok: focusOk, status: focusStatus, badge: focusBadge },
    flow: { ok: flowOk, status: flowStatus, badge: flowBadge },
    preview: { ok: previewOk, status: previewStatus, badge: previewBadge },
    nav: { ok: navOk, status: navStatus, badge: navBadge },
  };
  const score = [focusOk, flowOk, previewOk, navOk].filter(Boolean).length;

  // 生成白话诊单：按问题优先级精准讲清「怎么看、为什么、如何改」
  let diag;
  if (!previewOk) {
    if (previewStatus === "hidden") {
      diag = {
        level: "err",
        title: `主卡撑满 ${Math.round(cardPct)}%，两侧完全藏死在视口外`,
        why: `当前单侧露边只有 ${Math.round(peekPx)}px。用户进入页面只会把它当成一张孤立的静态大图，根本察觉不到左右还能滑出其余 4 张内容。`,
        action: `往左拉「主卡占宽」滑条到 54%–82%（经验参考带），让左右卡片各探出约 8%–22% 的图形与边角。`,
      };
    } else if (previewStatus === "false-edge") {
      diag = {
        level: "err",
        title: `落入「假边缘」陷阱：视口边沿只剩 ${Math.round(peekPx)}px 空白缝`,
        why: `主卡虽没撑满 100%，但边沿刚好停在卡片间的空白缝上，相邻卡片还没真正探头。视觉上像留了白边，依然暗示不了可横向滑动。`,
        action: `继续把「主卡占宽」收窄到 82% 以下，直到两侧卡片的色块和圆角明显露进视口。`,
      };
    } else if (previewStatus === "tight") {
      diag = {
        level: "err",
        title: `两侧只露了 ${Math.round(peekPx)}px（${peekRatioPct.toFixed(1)}%），太细容易被当成装饰边框`,
        why: `露出不足视口宽度的 6% 时，旁卡只能看到一条细色线，大脑无法把它识别成「另一张完整卡片」，滑动意愿会大打折扣。`,
        action: `把「主卡占宽」再往左调一点（54%–82% 之间），让单侧至少露出 6% 以上。`,
      };
    } else {
      diag = {
        level: "err",
        title: `主卡压窄到 ${Math.round(cardPct)}%，轮播碎成了三列并排卡片墙`,
        why: `单侧露边已经达到 ${peekRatioPct.toFixed(0)}%（露出侧卡 ${Math.round(peekOfCardPct)}%），视口里三张卡同时挤在一起、正文折行发紧，失去「居中单主角」的聚焦优势。`,
        action: `把「主卡占宽」往右拉回 54%–82%，让居中卡片坐稳主角，两侧只做适度预告。`,
      };
    }
  } else if (!focusOk) {
    if (focusStatus === "flat") {
      diag = {
        level: "err",
        title: `三张卡 1.00× 等大平权，视线进场先被侧边亮块扯走`,
        why: `现在露边有了，但当前卡片与两侧预览卡一样高、一样实。没有尺寸和对比度落差，用户一眼分不清谁才是当前主角。`,
        action: `把「居中聚焦」切到「1.10× 轻抬」或「1.18× 原海报」，抬大中心卡并让旁卡轻微退让。`,
      };
    } else {
      diag = {
        level: "err",
        title: `居中放大到 ${focus.scale.toFixed(2)}×（面积 ${areaRatio.toFixed(2)}×），侧卡被压成细条`,
        why: `过猛的缩放会让两侧预览卡缩得过小、文字发虚难辨，反而削弱了「预览下一张」的实用提示，中心卡也像弹窗般压迫上下边界。`,
        action: `把「居中聚焦」收回 1.08×–1.24× 经验舒适带，用温和级差锁定主焦点。`,
      };
    }
  } else if (!navOk) {
    if (navStatus === "none") {
      diag = {
        level: "err",
        title: `隐藏了左右箭头与分页指示，桌面与键盘用户找不到入口`,
        why: `纯手势滑动在触屏尚可碰运气，但在桌面端鼠标和键盘环境下，没有明显切换按钮与总帧数提示，大部分人会以为它不能交互，更不知道后面还有几张。`,
        action: `把「导航控制」切到「箭+5点」，在中心卡左右边沿挂出切换钮，并在底沿标出总帧数。`,
      };
    } else if (navStatus === "dots") {
      diag = {
        level: "err",
        title: `只剩底部微圆点，缺少明确的左右切换按钮`,
        why: `底部圆点能交代「共有 5 张、当前第几张」，但热区偏小且方向暗示偏弱；搭配骑在主卡边沿的左右箭头，能把点击切换成本降到最低。`,
        action: `把「导航控制」切到「箭+5点」，补齐左右切换按钮。`,
      };
    } else {
      diag = {
        level: "err",
        title: `强塞 12 帧小米点，用户看一眼进度条就想放弃`,
        why: `NN/g 的可用性研究建议将轮播控制在 5 帧以内。底部排满 12 颗密集圆点既难以精准点击，也会暴露出大量被藏在后面的低触达内容。`,
        action: `把「导航控制」收回到「箭+5点」，精简序列长度；超过 6 项更适合换成网格或画廊。`,
      };
    }
  } else if (!flowOk) {
    diag = {
      level: "err",
      title: `1.8 秒强制自动切页，字还没读完卡片就被抢走`,
      why: `自动快播不仅会粗暴打断阅读、让用户误点到下一张内容，还会触发「横幅盲视」（以为是广告直接跳过），也违背 WCAG 2.2.2 对可暂停控制的要求。`,
      action: `把「播放节奏」切回「手动掌控」（或至少用「5s 悬停即停」并保留显式暂停键）。`,
    };
  } else {
    diag = {
      level: "ok",
      title: `四柱齐备：单侧露 ${Math.round(peekPx)}px、主卡抬升 ${focus.scale.toFixed(2)}×、节奏归你掌控`,
      why: `此时视口一眼分明：居中卡片凭 ${areaRatio.toFixed(2)}× 视觉面积锁定主角，两侧各露 ${peekRatioPct.toFixed(1)}% 暗示可滑，骑边圆箭与 5 枚圆点交代方向与总数，翻页权牢牢握在用户手里。`,
      action: `现在直接在上方卡片轨道上左右拖拽、点击露出的侧卡，或按键盘 ← → 键体验连贯滑动；也可以故意拉偏参数测试反向翻车。`,
    };
  }

  return {
    vw,
    gapPx,
    cardPct,
    cardW,
    sideScale,
    sideW,
    stepPx,
    peekPx,
    peekRatioPct,
    peekOfCardPct,
    focusScale: focus.scale,
    sideOpacity: focus.sideOpacity,
    shadowLevel: focus.shadow,
    areaRatio,
    ctrl,
    pace,
    pillars,
    score,
    diag,
  };
}

// ---------- 01 节：多设备视口露边实验数据 ----------
export const PEEK_DEVICES = {
  phone: { id: "phone", label: "手机 390px", width: 390, gap: 12, recommended: 76 },
  tablet: { id: "tablet", label: "平板 768px", width: 768, gap: 18, recommended: 64 },
  desktop: { id: "desktop", label: "桌面 1280px", width: 1280, gap: 24, recommended: 56 },
};

export function evaluatePeekLab(deviceId, cardPct) {
  const dev = PEEK_DEVICES[deviceId] || PEEK_DEVICES.phone;
  const cardW = (dev.width * cardPct) / 100;
  const sideSpace = (dev.width - cardW) / 2;
  const peekPx = Math.max(0, sideSpace - dev.gap);
  const peekPct = (peekPx / dev.width) * 100;

  let verdict = "ok";
  let heading = "露边清晰：刚好勾出完形探索欲";
  let note = `在 ${dev.label} 视口里，主卡宽 ${Math.round(cardW)}px，单侧清晰探出 ${Math.round(peekPx)}px（占屏宽 ${peekPct.toFixed(1)}%）。既看得出旁边是另一张卡的色块与圆角，又不抢主卡的阅读版面。`;
  if (cardPct >= 96 || peekPx <= 0) {
    verdict = "err";
    heading = "全屏闷死：露边 0px，像一张死图";
    note = `相邻卡片完全落在 ${dev.width}px 视口之外。没有物理滚动条时，用户几乎不会凭空猜测这里还能横向滑动。`;
  } else if (peekPx <= 8 || peekPct < 5.5) {
    verdict = "warn";
    heading = `假边缘陷阱：只露出 ${Math.round(peekPx)}px 边缘细条`;
    note = `留白刚好切在卡片间距或极窄圆角边上（仅占屏宽 ${peekPct.toFixed(1)}%），容易被大脑误读成装饰外框而非「下一张内容」。`;
  } else if (peekPct > 23) {
    verdict = "warn";
    heading = `过度退让：单侧露出 ${peekPct.toFixed(0)}%，退化成三列窄卡`;
    note = `主卡被压到 ${Math.round(cardW)}px，每张卡都在抢占注意力，正文被迫频繁换行，不再是单主角聚焦轮播。`;
  }
  return { dev, cardW, peekPx, peekPct, verdict, heading, note };
}

// ---------- 03 节：2013 圣母大学实证点击分配（Erik Runyon） ----------
// 依据 Erik Runyon (2013) 对 nd.edu 首页的实测统计：约 1% 访问者点击轮播，
// 点击中约 84% 落在第 1 帧，第 2–5 帧每帧仅约 2%–4%（此处将 5 帧占比按实证结构归一演示）。
export const RUNYON_WEIGHTS = [84, 5, 4, 4, 3];

export const DECAY_ITEMS = [
  { id: "launch", title: "春季核心新品发布", role: "最高商业目标", value: 100 },
  { id: "member", title: "年度会员限时权益", role: "次核心转化", value: 78 },
  { id: "story", title: "设计工作室幕后访谈", role: "品牌内容沉淀", value: 52 },
  { id: "event", title: "周末线下体验预约", role: "区域活动通知", value: 40 },
  { id: "notice", title: "系统维护与物流公告", role: "兜底运营信息", value: 26 },
];

// ---------- 04 节：限时阅读卡片 ----------
export const AUTOPLAY_CARDS = [
  {
    badge: "01 / 04 · 真实阅读测试",
    title: "陶瓷滤杯升级双导流肋骨，萃取速度比旧款快 18%",
    body: "细螺旋导流槽减少纸壁贴合，水流更稳，新手也能冲出干净花香。点下方按钮领取首月试喝装。",
    cta: "领取试喝装（点对本卡）",
    target: true,
  },
  {
    badge: "02 / 04 · 下一帧促销卡",
    title: "企业大宗采购满二十件享阶梯九折",
    body: "支持开具增值税专票，工作日四十八小时内直发全国仓。",
    cta: "进入企业采购页",
    target: false,
  },
  {
    badge: "03 / 04 · 第三帧联名卡",
    title: "限定浅薄荷配色随行保温杯开启预售",
    body: "三百五十毫升轻量化杯身，磨砂哑光漆面，预计下月初发货。",
    cta: "查看限定配色",
    target: false,
  },
  {
    badge: "04 / 04 · 第四帧活动卡",
    title: "周末城市手冲品鉴课开放二十个席位",
    body: "现场对比三支水洗耶加雪菲，附赠两百克烘焙豆带回家。",
    cta: "报名周末品鉴",
    target: false,
  },
];

// ---------- 05 节：场景分诊数据 ----------
export const TRIAGE_CASES = [
  {
    id: "product-angles",
    label: "商品多角度实拍",
    need: "一款无线耳机有外观、佩戴、充电盒与接口 4 张实拍图，用户只想顺手横划细看细节。",
    verdict: "适合轮播",
    tone: "ok",
    reason: "同一产品的连续视角天然是一组同级序列；配清脆露边与清晰 1/4 进度，手机单手横划成本极低。若图片超过 6 张且需任意跳选，可升级为 275 画廊布局。",
    links: [{ num: "275", name: "275 画廊布局" }],
  },
  {
    id: "dept-banners",
    label: "首页 5 部门公告",
    need: "五个业务部门都想上网站首页首屏，于是塞进自动轮播横幅，每人分一帧。",
    verdict: "强烈不建议",
    tone: "err",
    reason: "这是最典型的「组织政治轮播」。Erik Runyon 2013 年实测显示，第 2–5 帧往往只分走个位数点击；重要业务藏进后帧几乎等于隐藏。应只留唯一主推作 Hero，其余降级进分栏网格。",
    links: [
      { num: "289", name: "289 Hero 主视觉布局" },
      { num: "272", name: "272 便当盒布局" },
    ],
  },
  {
    id: "pricing-compare",
    label: "4 档会员资费对比",
    need: "用户要在基础版、专业版、团队版、企业版之间逐项核对价格、存储额度与权限差异。",
    verdict: "别用轮播",
    tone: "err",
    reason: "原海报把「多项对比」列进适用场景，但前提只能是「逐个感受风格差异」；一旦需要并排核对精确参数，轮播强迫用户靠短期记忆来回翻页，体验远不如同屏对齐的表格或并列卡片。",
    links: [
      { num: "274", name: "274 数据表格布局" },
      { num: "270", name: "270 卡片网格布局" },
    ],
  },
  {
    id: "playlist-rail",
    label: "首页横向精选推荐",
    need: "播客或书店首页要在有限竖向高度内，放出一组 4–5 张「本周编辑精选」专题卡。",
    verdict: "适合轮播",
    tone: "ok",
    reason: "横向轻滑轨能压缩页面纵向长度，把主视觉留给精选首推，靠右侧露边引导有兴趣的读者顺手多翻几张；前提是手动滑动、不自动翻页，且把最重要的内容放在第 1 帧。",
    links: [
      { num: "269", name: "269 信息流布局" },
      { num: "271", name: "271 瀑布流页面" },
    ],
  },
];

// ---------- 07 节：客观单变量练习题解析 ----------
export const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "方案 A 不够好：100% 占宽把其余 3 款壶彻底藏死了",
    body: "四版唯一的变量是主卡占宽与边缘露法。方案 A 让单张卡撑满整块 390px 屏幕，左右露边为 0px，在没有常驻滚动条的手机界面上，用户极易以为整页只推荐这一款壶而直接划走。",
  },
  B: {
    ok: true,
    title: "选对了！方案 B（76% 占宽 + 两侧各露约 10%）最均衡",
    body: "在 390px 竖屏上，76% 宽（约 296px）给居中主卡留出从容的配图与单行标题空间，左右各露出的 ~35px 恰好探出邻卡色块与圆角，既不需要写「左右滑动」的赘文提示，也不会像方案 C 那样挤碎主焦点。",
  },
  C: {
    ok: false,
    title: "方案 C 太挤：48% 占宽让三张窄卡同时抢戏",
    body: "390px 屏宽里把主卡压到 48%（不足 190px），手机上卡片正文被迫折成四五行，同时两侧卡片各自露出大半，三张卡并排打架，失去了轮播「居中单主焦点」的阅读优势。",
  },
  D: {
    ok: false,
    title: "方案 D 掉进了「假边缘」陷阱：90% 占宽只露出一道白缝",
    body: "这是最隐蔽的移动端失误：主卡占 90% 时，左右各剩约 19px，减去卡片间距后视口边缘几乎完全停在空白缝隙上，邻卡内容根本没露进画面，看起来只是加了边距的单图，起不到可滑暗示作用。",
  },
};
