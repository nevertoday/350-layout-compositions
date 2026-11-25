// 252 横向卷轴 · 单真源数据、几何引擎与诊断模型
// 所有舞台绘制、读数指标、三栏要点灯与实时 CSS 代码均只读取本模块算出的结果。

export const PALETTE = {
  bg: "#000E27",
  bgDeep: "#000B20",
  card: "#081D41",
  cardActive: "#0D2959",
  cardBorder: "#233F6B",
  cyan: "#3DCADC",
  cyanMid: "#2BB7CC",
  cyanDim: "rgba(61, 202, 220, 0.24)",
  coral: "#F381A0",
  coralStrong: "#F585A4",
  cream: "#F1EBE4",
  ink: "#F5F8FC",
  inkSub: "#A9BCD6",
  ok: "#4BE0B8",
  warn: "#F5C056",
  err: "#FF6E7F",
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 流程卷",
    short: "原海报流程",
    cards: [
      {
        num: "00",
        zh: "引子",
        en: "PRELUDE",
        body: "轨道先于视窗存在，左缘半影提示流程有来处。",
        art: "prelude",
      },
      {
        num: "01",
        zh: "起点",
        en: "START",
        body: "流程从起点开始，建立上下文。",
        art: "start",
      },
      {
        num: "02",
        zh: "探索",
        en: "EXPLORE",
        body: "向右滑动查看更多内容，保持流程连贯。",
        art: "explore",
      },
      {
        num: "03",
        zh: "整合",
        en: "INTEGRATE",
        body: "信息逐步整合，形成完整认知。",
        art: "integrate",
      },
      {
        num: "04",
        zh: "完成",
        en: "COMPLETE",
        body: "到达终点，完成目标。",
        art: "complete",
      },
      {
        num: "05",
        zh: "余韵",
        en: "CONTINUUM",
        body: "回到起点或切入下一条内容轨，闭环而不突兀。",
        art: "continuum",
      },
    ],
  },
  cinema: {
    id: "cinema",
    label: "影展 · 胶片帧",
    short: "影展时间轴",
    cards: [
      {
        num: "00",
        zh: "手卷",
        en: "SCROLL",
        body: "双臂展幅即是纸上视窗，边展边收保持叙事不断。",
        art: "scroll",
      },
      {
        num: "01",
        zh: "胶片",
        en: "FILMSTRIP",
        body: "等宽画格串成定轨，片门只放行当前一帧。",
        art: "film",
      },
      {
        num: "02",
        zh: "翻牌",
        en: "COVER FLOW",
        body: "2006 年把封面横翻带进桌面，视觉直觉胜过纯文字表。",
        art: "coverflow",
      },
      {
        num: "03",
        zh: "惯性",
        en: "MOMENTUM",
        body: "触屏松手后带阻尼滑行，让手指动作像拨动实体纸卷。",
        art: "momentum",
      },
      {
        num: "04",
        zh: "吸附",
        en: "SCROLL SNAP",
        body: "W3C 规范落位规则，松手自动对齐整卡边缘。",
        art: "snap",
      },
      {
        num: "05",
        zh: "原语",
        en: "THE REEL",
        body: "以纯 CSS 溢出轨替代沉重脚本，收放自如。",
        art: "reel",
      },
    ],
  },
  shop: {
    id: "shop",
    label: "商城 · 商品轨",
    short: "商城货架",
    cards: [
      {
        num: "00",
        zh: "上新",
        en: "DROP 00",
        body: "同质商品横排入轨，为纵向页面省出整屏高度。",
        art: "drop",
      },
      {
        num: "01",
        zh: "声学耳机",
        en: "STUDIO CAN",
        body: "铝壳耳罩与折叠头梁，等比卡片横向速览。",
        art: "headphone",
      },
      {
        num: "02",
        zh: "旁轴机身",
        en: "RANGEFINDER",
        body: "右缘露出下一件机身，自然勾起继续翻看的念头。",
        art: "camera",
      },
      {
        num: "03",
        zh: "手冲壶",
        en: "POUR KETTLE",
        body: "同高卡片与统一基线，扫读参数不上下跳眼。",
        art: "kettle",
      },
      {
        num: "04",
        zh: "桌灯",
        en: "DESK LAMP",
        body: "桌端翻页箭与进度点，让鼠轮用户也能轻松直达。",
        art: "lamp",
      },
      {
        num: "05",
        zh: "墨水屏",
        en: "E-INK PAD",
        body: "滑到尽头给清晰收口，不再继续向左硬拽误触返回。",
        art: "tablet",
      },
    ],
  },
};

export const INITIAL_STATE = {
  theme: "poster",
  cardRatio: 1.0,     // 100% 严丝合缝塞满视窗 → 零露边假底边！
  snap: "off",        // 关闭吸附 → 停在两卡中缝腰斩！
  cues: "none",       // 关闭桌端翻页钮与进度点 → 桌面盲滑！
  edgePad: 0,         // 0px 贴死视窗边缘
  xray: true,         // 默认半透视轨（能看见窗外，也清楚看见窗内假底边）；可切纯黑真裁切
  physics: "inertia", // 阻尼惯性 | step 生硬步进
  scrollIndex: 1.48,  // 刻意停在 01 与 02 正中腰斩位
};

export const PRESETS = {
  broken: {
    label: "复原开场错态",
    kind: "reset",
    patch: {
      cardRatio: 1.0,
      snap: "off",
      cues: "none",
      edgePad: 0,
      physics: "inertia",
      scrollIndex: 1.48,
    },
  },
  posterSol: {
    label: "原海报单焦解",
    kind: "solution",
    patch: {
      cardRatio: 0.78,
      snap: "mandatory",
      cues: "full",
      edgePad: 20,
      physics: "inertia",
      scrollIndex: 2.0,
    },
  },
  shelfSol: {
    label: "双卡货架解",
    kind: "solution",
    patch: {
      cardRatio: 0.44,
      snap: "proximity",
      cues: "full",
      edgePad: 16,
      physics: "inertia",
      scrollIndex: 1.0,
    },
  },
  wideSol: {
    label: "多卡宽轨解",
    kind: "solution",
    patch: {
      cardRatio: 0.39,
      snap: "proximity",
      cues: "full",
      edgePad: 14,
      physics: "inertia",
      scrollIndex: 1.0,
    },
  },
  failLock: {
    label: "试错：超宽锁死",
    kind: "trap",
    patch: {
      cardRatio: 1.18,
      snap: "mandatory",
      cues: "full",
      edgePad: 16,
      physics: "inertia",
      scrollIndex: 2.0,
    },
  },
  failFloor: {
    label: "试错：双卡假底边",
    kind: "trap",
    patch: {
      cardRatio: 0.5,
      snap: "mandatory",
      cues: "peek",
      edgePad: 0,
      physics: "inertia",
      scrollIndex: 1.0,
    },
  },
  failHijack: {
    label: "试错：重遮挡劫持",
    kind: "trap",
    patch: {
      cardRatio: 0.78,
      snap: "mandatory",
      cues: "hijack",
      edgePad: 16,
      physics: "step",
      scrollIndex: 2.0,
    },
  },
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * 从当前舞台真实视窗尺寸（vpW, vpH）与状态算出一份单真源几何表。
 * 舞台绘制、露边测算、吸附槽位、体检读数全部共用此表。
 */
export function computeGeometry(state, vpW, vpH) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const count = theme.cards.length;
  const safeVpW = Math.max(220, vpW);
  const safeVpH = Math.max(180, vpH);

  // 边缘内距按当前视窗宽同比缩放，基准视窗 460px
  const padScale = clamp(safeVpW / 460, 0.72, 1.15);
  const pad = Math.round(state.edgePad * padScale);
  const gap = Math.round(clamp(safeVpW * 0.036, 10, 22));

  // 可用内宽：当 pad = 0 且 cardRatio = 1.0 时，卡宽正好严丝合缝撑满整个视窗！
  // 当 cardRatio = 0.50 且 pad = 0 时，2 张卡加 1 道缝正好齐平视窗右缘（双卡假底边）！
  const innerW = Math.max(140, safeVpW - pad * 2);
  let cardW;
  if (Math.abs(state.cardRatio - 0.5) < 0.008 && state.edgePad === 0) {
    cardW = (innerW - gap) / 2;
  } else {
    cardW = innerW * state.cardRatio;
  }

  const cardH = Math.round(clamp(safeVpH - 28, 150, safeVpH - 16));
  const step = cardW + gap;
  const contentW = pad * 2 + count * cardW + (count - 1) * gap;
  const maxScroll = Math.max(0, contentW - safeVpW);

  // 每张卡在吸附到视窗起点（pad）时的 scrollX
  const stops = [];
  for (let i = 0; i < count; i++) {
    const rawX = i * step;
    stops.push(clamp(rawX, 0, maxScroll));
  }

  const maxIndex = step > 0 ? maxScroll / step : 0;
  const clampedIdx = clamp(state.scrollIndex, 0, maxIndex);
  const scrollX = clampedIdx * step;

  // 逐卡计算在视窗 [0, safeVpW] 内的实绘可见区域
  const cards = theme.cards.map((meta, i) => {
    const x = pad + i * step - scrollX;
    const right = x + cardW;
    const visLeft = Math.max(0, x);
    const visRight = Math.min(safeVpW, right);
    const visW = Math.max(0, visRight - visLeft);
    const visRatio = cardW > 0 ? visW / cardW : 0;
    const cutLeft = Math.max(0, -x);
    const cutRight = Math.max(0, right - safeVpW);
    return {
      index: i,
      meta,
      x,
      right,
      w: cardW,
      h: cardH,
      visLeft,
      visRight,
      visW,
      visRatio,
      cutLeft,
      cutRight,
      inViewport: visW > 1,
    };
  });

  // 找出视窗内“最靠左的主聚焦卡”（可见面积最大，同值取靠左）
  let leadCard = cards[0];
  for (const c of cards) {
    if (c.visW > leadCard.visW + 1) leadCard = c;
  }

  // 右侧露边计算：寻找跨越视窗右缘（x < safeVpW && right > safeVpW）的卡片
  let peekCard = null;
  for (const c of cards) {
    if (c.x > 2 && c.x < safeVpW - 1 && c.right > safeVpW + 1) {
      peekCard = c;
      break;
    }
  }

  const atEnd = maxScroll - scrollX < 4;
  let peekPx = 0;
  let peekPct = 0;
  if (peekCard) {
    peekPx = Math.round(safeVpW - peekCard.x);
    peekPct = Math.round((peekPx / cardW) * 100);
  }

  // 左侧是否有已滑过且露出余尾的卡
  let leftPeekCard = null;
  for (const c of cards) {
    if (c.x < -1 && c.right > 2 && c.right < safeVpW - 1) {
      leftPeekCard = c;
      break;
    }
  }

  // 等效 390px 手机屏幕下的单卡像素宽（用于检验窄条挤碎）
  const phoneInner = 390 - 24 - state.edgePad * 2 * 0.75;
  const phoneCardW = Math.round(phoneInner * state.cardRatio);
  const fullCardsVisible = cards.filter((c) => c.visRatio >= 0.92).length;
  const progress = maxScroll > 0 ? clamp(scrollX / maxScroll, 0, 1) : 0;
  const railSpan = +(contentW / safeVpW).toFixed(2);

  // 计算如果按当前吸附模式停下时，是否离最近的合法槽位太远
  let nearestStopDist = Infinity;
  let nearestStopIdx = 0;
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(scrollX - stops[i]);
    if (d < nearestStopDist) {
      nearestStopDist = d;
      nearestStopIdx = i;
    }
  }

  return {
    vpW: safeVpW,
    vpH: safeVpH,
    pad,
    gap,
    cardW,
    cardH,
    step,
    contentW,
    maxScroll,
    maxIndex,
    scrollX,
    scrollIndex: clampedIdx,
    progress,
    railSpan,
    stops,
    cards,
    leadCard,
    peekCard,
    leftPeekCard,
    peekPx,
    peekPct,
    atEnd,
    fullCardsVisible,
    phoneCardW,
    focusIntegrity: Math.round(leadCard.visRatio * 100),
    nearestStopIdx,
    nearestStopDist,
  };
}

/**
 * 单真源诊断：根据几何实算与交互参数，识别全部 7 类双向真错态与多组合法解。
 */
export function evaluate(state, geom, { moving = false } = {}) {
  const issues = [];

  // 1. 超宽强吸锁死
  if (state.cardRatio > 1.01) {
    issues.push({
      id: "oversize_lock",
      severity: "err",
      short: "超宽截断",
      headline: `单卡宽达视窗 ${Math.round(state.cardRatio * 100)}%，右端内容被硬生生锁在窗外`,
      body:
        state.snap === "mandatory"
          ? "卡片比可视窗口还宽，又开了 mandatory 强吸附：每次松手浏览器都会把它拉回卡头对齐，超出右边界的画面与正文永远停不进视野。"
          : "单张卡片已经超过整个视窗宽度，读者读完一行字就得左右来回拉扯，失去了横向卷轴「一卡一完整单元」的节奏。",
      action: {
        label: "把卡宽缩至 78% 留出露边",
        patch: { cardRatio: 0.78, edgePad: Math.max(16, state.edgePad) },
      },
    });
  }

  // 2. 半卡腰斩停驻（静止时主卡可见度不足 84%）
  if (!moving && geom.focusIntegrity < 84) {
    const cutPct = 100 - geom.focusIntegrity;
    issues.push({
      id: "mid_cut",
      severity: "err",
      short: `腰斩 ${cutPct}%`,
      headline: `卡 ${geom.leadCard.meta.num} 被视窗刀口裁掉 ${cutPct}%，停在两卡中缝`,
      body:
        state.snap === "off"
          ? "关闭 CSS Scroll Snap 后，松手停在哪全凭运气。当前视窗正好劈在两张卡之间，标题和图形都被切开，眼睛不知该读左边还是右边。"
          : "当前停留位置偏离整卡对齐点，开启强吸附或轻推一格即可让主卡完整落进视窗。",
      action: {
        label: "开启强吸附并落位整卡",
        patch: {
          snap: "mandatory",
          scrollIndex: Math.round(geom.scrollIndex),
        },
      },
    });
  }

  // 3. 零露边假底边（非轨道最末、且非超宽态时，窗内右缘露边不足 8%）
  if (!geom.atEnd && state.cardRatio <= 1.01 && geom.peekPct < 8) {
    issues.push({
      id: "false_floor",
      severity: "err",
      short: "零露边盲区",
      headline: `视窗右缘严丝合缝（下卡仅露 ${geom.peekPct}%），造出了「假底边」`,
      body:
        state.cardRatio >= 0.96
          ? "单卡 100% 占满可视窗口时，下一张卡片被彻底藏在窗外。关闭透视后它看上去就是一张普通静态图，读者根本想不到可以向左拖。"
          : `当前卡宽刚好在视窗里排成整张（露出仅 ${geom.peekPx}px），右缘齐平形成虚假终点。把下卡左缘露出 12%–34%，眼睛不用文字提醒就会往右探。`,
      action: {
        label: "调至 78% 卡宽露出下卡",
        patch: { cardRatio: 0.78, edgePad: Math.max(16, state.edgePad) },
      },
    });
  }

  // 4. 窄条挤碎（等效 390px 手机端单卡宽 < 130px）
  if (geom.phoneCardW < 130) {
    issues.push({
      id: "too_narrow",
      severity: "err",
      short: `窄条 ${geom.phoneCardW}px`,
      headline: `卡宽占比仅 ${Math.round(state.cardRatio * 100)}%，手机端单卡被压成 ${geom.phoneCardW}px 碎条`,
      body: "横向卷轴的本意是不牺牲单卡宽度的前提下容纳更多项目。如果为了同屏塞进太多张而把卡片压太窄，标题折成三四行，还不如用普通标签簇群。",
      action: {
        label: "放宽至 43% 双卡露边",
        patch: { cardRatio: 0.43, edgePad: 16 },
      },
    });
  }

  // 5. 重遮罩吃字与滚轮劫持
  if (state.cues === "hijack") {
    issues.push({
      id: "hijack_mask",
      severity: "err",
      short: "遮字且劫持",
      headline: "重黑暗角盖住卡片两翼文字，且强行劫持垂直滚轮",
      body: "为了提示左右可滑而在视窗两边盖上厚重黑幕，反而吃掉卡片近五分之一内容；更糟的是拦截页面纵向滚动去绑架成横滑，会让只想往下看正文的读者被困在轨道里。",
      action: {
        label: "换成轻露边 + 实体翻页钮",
        patch: { cues: "full", physics: "inertia" },
      },
    });
  }

  // 6. 桌端盲滑无抓手
  if (state.cues === "none") {
    issues.push({
      id: "no_cues",
      severity: "warn",
      short: "缺桌端线索",
      headline: "翻页按钮与进度轨全关，桌面鼠轮用户找不到横滑入口",
      body: "触屏手指天生会横划，但桌面端滚轮默认只走垂直轴。按 NN/g 可用性观察，横向区域如果不给显式前后箭头或进度标尺，桌面访客大概率直接错过屏外卡片。",
      action: {
        label: "补齐桌端翻页箭与进度点",
        patch: { cues: "full" },
      },
    });
  }

  // 7. 边缘呼吸距异常（贴死 0px 或 过胖 >= 60px）
  if (state.edgePad === 0) {
    issues.push({
      id: "pad_zero",
      severity: "warn",
      short: "0px 贴边",
      headline: "视窗内边距为 0px，首卡紧贴框线缺少呼吸与焦点余地",
      body: "给轨道两端加上 16–24px 的内边距和对应的 scroll-padding-inline，既能避免卡片边框与视窗线打架，也能在键盘 Tab 聚焦时不把高亮外框切掉。",
      action: {
        label: "加上 20px 呼吸安全距",
        patch: { edgePad: 20 },
      },
    });
  } else if (state.edgePad >= 60) {
    issues.push({
      id: "pad_huge",
      severity: "warn",
      short: `留边 ${state.edgePad}px 过宽`,
      headline: `视窗两侧留边 ${state.edgePad}px 过胖，白白吃掉近三成视窗宽`,
      body: "边缘安全距只需 16–24px 让卡片和焦点框喘口气；留得太大不仅压缩内容面积，还会让小屏卷轴显得局促空洞。",
      action: {
        label: "收敛安全距至 20px",
        patch: { edgePad: 20 },
      },
    });
  }

  // 8. 露边虽然存在但过宽（超过 46% 显得像切碎的半张卡）只作温和提示，不判死错
  const errCount = issues.filter((x) => x.severity === "err").length;
  const warnCount = issues.filter((x) => x.severity === "warn").length;
  const totalBad = issues.length;

  let status = "ok";
  let badge = "秩序成立";
  let headline = "";
  let body = "";
  let action = null;
  let solutionName = "";

  if (totalBad > 0) {
    const top = issues[0];
    status = errCount > 0 ? "err" : "warn";
    badge = `${totalBad} 项待修 · ${top.short}`;
    headline = top.headline;
    body = top.body;
    action = top.action;
  } else {
    // 辨别属于哪一种合法解
    if (state.cardRatio >= 0.66) {
      solutionName = "单卡主焦 + 露边解";
      headline = `主卡完整居中，右缘自然露出下卡 ${geom.atEnd ? "（已抵终点）" : `${geom.peekPct}%（${geom.peekPx}px）`}`;
      body =
        "这是 252 原海报与移动端故事卷最稳的配比：视窗一次只聚焦一张完整内容，右缘一截未闭合的邻卡天然替你指向下一站，桌端按钮与吸附双保险兜底。";
    } else if (state.cardRatio >= 0.4) {
      solutionName = "双卡货架 + 露边解";
      headline = `同屏并览 2 张卡，右缘仍留出 ${geom.atEnd ? "终点余白" : `${geom.peekPct}% 延续切面`}`;
      body =
        "常见于电商货架与影视剧集横轨：比单卡效率更高，同时靠打破整数等分避免了 50% 平分造成的假底边，兼顾扫读速度与横向提示。";
    } else {
      solutionName = "三卡宽轨导览解";
      headline = `宽轨多卡并进，仍守住 ${geom.phoneCardW}px 最小可读底线`;
      body =
        "适合图集、精简步骤卡或工具卡片轨：一屏能看到连贯上下文，配合轻吸附与桌端翻页箭，甩动顺滑且不会压碎单卡信息。";
    }
    badge = `${solutionName} · 成立`;
  }

  // 对应原海报三栏（FLOW / WINDOW / CONTINUITY）的单真源实况灯
  const flowBad = issues.find((i) => i.id === "too_narrow" || i.id === "oversize_lock");
  const windowBad = issues.find((i) => i.id === "mid_cut" || i.id === "pad_zero" || i.id === "pad_huge");
  const cueBad = issues.find((i) => i.id === "false_floor" || i.id === "no_cues" || i.id === "hijack_mask");

  const pillars = {
    flow: {
      state: flowBad ? flowBad.severity : "ok",
      tag: flowBad
        ? flowBad.short
        : `${Math.round(state.cardRatio * 100)}% 宽 · ${geom.railSpan}× 轨长`,
    },
    window: {
      state: windowBad ? windowBad.severity : "ok",
      tag: windowBad
        ? windowBad.short
        : `完整度 ${geom.focusIntegrity}% · 距 ${state.edgePad}px`,
    },
    continuity: {
      state: cueBad ? cueBad.severity : "ok",
      tag: cueBad
        ? cueBad.short
        : geom.atEnd
          ? "已达终点 · 线索齐备"
          : `露边 ${geom.peekPct}% · 键鼠可达`,
    },
  };

  const cssCode = buildLiveCss(state, geom, issues);

  return {
    status,
    badge,
    solutionName,
    headline,
    body,
    action,
    issues,
    pillars,
    cssCode,
  };
}

function buildLiveCss(state, geom, issues) {
  const snapLine =
    state.snap === "off"
      ? "  scroll-snap-type: none; /* 关闭吸附：松手易停在两卡中缝 */"
      : `  scroll-snap-type: x ${state.snap};`;
  const overscrollLine =
    state.cues === "hijack"
      ? "  /* 警告：强行劫持垂直 wheel 事件会困住访客 */"
      : "  overscroll-behavior-x: contain; /* 防左滑尽头误触返回 */";
  const ratioPct = Math.round(state.cardRatio * 100);
  const ratioNote =
    state.cardRatio > 1
      ? " /* 超出视窗宽，配合强吸会锁死溢出区 */"
      : !geom.atEnd && geom.peekPct < 8
        ? " /* 整除视窗 → 零露边假底边 */"
        : ` /* 窗内右缘露边约 ${geom.peekPct}% */`;
  const padLine = `  padding-inline: ${state.edgePad}px;\n  scroll-padding-inline: ${state.edgePad}px;`;
  const comment = issues.length ? `/* 当前检出 ${issues.length} 处体验隐患 */` : `/* 合法横卷原语：单真源实时生成 */`;

  return `${comment}
.reel {
  display: flex;
  gap: ${geom.gap}px;
  overflow-x: auto;
${padLine}
${snapLine}
${overscrollLine}
}
.reel > .card {
  flex: 0 0 ${ratioPct}%;${ratioNote}
  scroll-snap-align: start;
}`;
}
