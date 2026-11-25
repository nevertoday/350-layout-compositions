// 129 · 古腾堡图式 — 纯数据与单一数据源推导模块（零 DOM 依赖）

export const ARTICLES = {
  lead: {
    id: "lead",
    kicker: "本埠要闻",
    short: "本埠要闻",
    roleHint: "头版主稿",
    head: "旧城印务局今秋迁入新馆，百台铅字机原址保留",
    body: "建于一九五四年的南街印务局昨起分批搬迁，排字车间与铸字铜模完整留存，下月起开放铅印工坊与报史展厅，每日安排老排字工现场示排。",
    idealSlot: 0,
  },
  briefs: {
    id: "briefs",
    kicker: "本期提要",
    short: "本期提要",
    roleHint: "刊期索引",
    head: "二版城建简讯 · 三版书评 · 四版气象与渡轮时刻",
    body: "二版刊发跨江慢行桥通车安排与公交接驳；三版摘评秋季新书六种并附译者访谈；四版附本周潮汐表、夜班轮渡时刻与各区图书馆开放时间。",
    idealSlot: 1,
  },
  imprint: {
    id: "imprint",
    kicker: "刊务声明",
    short: "刊务声明",
    roleHint: "版权附注",
    head: "本报版面文字与图表均受著作权保护，转载须经许可",
    body: "邮发代号四二—〇八，双周三出版，定价一元。来稿恕不退还，地址变更、缺页调换与错印补发事宜，请于见报七日内函告南街发行科办理。",
    idealSlot: 2,
  },
  subscribe: {
    id: "subscribe",
    kicker: "全年订报",
    short: "全年订报",
    roleHint: "订阅回执",
    head: "填妥下方投递地址与份数，即刻办理下季晨报直投",
    body: "持本联至各邮局或扫码登记，下月一日起清晨六时前送达报箱。连订两季免收投递费，赠年度合订本检索目录一册，老订户续订另享折扣。",
    idealSlot: 3,
  },
};

export const INITIAL_SLOTS = ["imprint", "subscribe", "lead", "briefs"];
export const IDEAL_SLOTS = ["lead", "briefs", "imprint", "subscribe"];

const STATION_META = [
  { loc: "起点·左上", zone: "左上主光学区", dwellMs: 880 },
  { loc: "右上·强休耕", zone: "右上强休耕区", dwellMs: 460 },
  { loc: "左下·弱休耕", zone: "左下弱休耕区", dwellMs: 0 },
  { loc: "终点·右下", zone: "右下终端区域", dwellMs: 940 },
];

// In-slot short encounter verdict (never spoils target zone; reports what gaze hits right here)
const SLOT_ENCOUNTER = [
  {
    lead: { tag: "第一眼接住主稿", state: "caught" },
    briefs: { tag: "开篇先撞目录", state: "missed" },
    imprint: { tag: "入口白撞版权字", state: "skimmed" },
    subscribe: { tag: "未读先见催订", state: "missed" },
  },
  {
    briefs: { tag: "横扫顺带读提要", state: "caught" },
    lead: { tag: "主稿被横扫掠过", state: "skimmed" },
    imprint: { tag: "横扫空过版权字", state: "skimmed" },
    subscribe: { tag: "过早催订留不住", state: "skimmed" },
  },
  {
    imprint: { tag: "小字静置不抢戏", state: "quiet" },
    lead: { tag: "主稿沉底被掠过", state: "skimmed" },
    briefs: { tag: "目录沉角易漏扫", state: "skimmed" },
    subscribe: { tag: "回执藏进盲角", state: "skimmed" },
  },
  {
    subscribe: { tag: "收尾顺手接回执", state: "caught" },
    lead: { tag: "读到终点才见主稿", state: "missed" },
    briefs: { tag: "落点停在目录页", state: "missed" },
    imprint: { tag: "收尾撞见版权字", state: "skimmed" },
  },
];

export function getSlotVerdict(slotIdx, artId) {
  return SLOT_ENCOUNTER[slotIdx]?.[artId] || { tag: "", state: "skimmed" };
}

function describeEncounter(slotIdx, artId) {
  if (slotIdx === 0) {
    if (artId === "lead") return "第一眼落进左上起点直接抓到「本埠要闻」头版主稿";
    if (artId === "briefs") return "第一眼落进左上起点先看到的是二至四版目录，主稿被让出入口";
    if (artId === "imprint") return "第一眼落进左上起点白白撞见「刊务声明」版权小字";
    return "第一眼落进左上起点还没看清内容，就被「全年订报」催着下单";
  }
  if (slotIdx === 1) {
    if (artId === "briefs") return "向右横扫右上强休耕区顺手带过「本期提要」";
    if (artId === "lead") return "向右扫过右上强休耕区才撞见「本埠要闻」，主稿退居次位";
    if (artId === "imprint") return "向右扫过右上强休耕区白白经过「刊务声明」";
    return "右上强休耕区过早挂着「全年订报」回执，视线还停不住";
  }
  if (slotIdx === 2) {
    if (artId === "imprint") return "最易被掠过的左下弱休耕区安放「刊务声明」，不抢主线";
    if (artId === "lead") return "「本埠要闻」头版主稿掉进左下弱休耕死角，极易被扫漏";
    if (artId === "briefs") return "「本期提要」沉进左下弱休耕区，容易在斜扫中被直接跳过";
    return "「全年订报」行动回执藏进左下弱休耕区，读者读完容易漏看";
  }
  if (artId === "subscribe") return "最终停在右下终端区的「全年订报」，读完顺手收口。";
  if (artId === "lead") return "直到右下终端区才终于见到「本埠要闻」，开头已失去锚点。";
  if (artId === "briefs") return "视线滑到右下终端却落在「本期提要」上，没有顺手的收尾动作。";
  return "视线走完对角停在右下「刊务声明」上，行动入口落了空。";
}

export function evaluateProof(slots) {
  const stationMatch = slots.map((id, i) => id === IDEAL_SLOTS[i]);
  const matches = stationMatch.filter(Boolean).length;
  const tlRight = slots[0] === "lead";
  const brRight = slots[3] === "subscribe";

  let tierKey = "wrong";
  let tierLabel = "错位 · 逆重力";
  if (matches === 4) {
    tierKey = "good";
    tierLabel = "顺重力 · 四区就位";
  } else if (tlRight && brRight) {
    tierKey = "mid";
    tierLabel = "起止就位 · 中段颠倒";
  } else if (tlRight || brRight) {
    tierKey = "half";
    tierLabel = "半顺 · 端点未闭环";
  }

  const stations = slots.map((id, i) => {
    const verdict = getSlotVerdict(i, id);
    return {
      loc: STATION_META[i].loc,
      dwellMs: STATION_META[i].dwellMs,
      article: ARTICLES[id],
      matched: stationMatch[i],
      shortTag: verdict.tag,
      visualState: verdict.state,
    };
  });

  const why = [
    describeEncounter(0, slots[0]),
    describeEncounter(1, slots[1]),
    describeEncounter(2, slots[2]),
    describeEncounter(3, slots[3]),
  ].join("；");

  const isInitial = slots.every((id, i) => id === INITIAL_SLOTS[i]);
  return { matches, stationMatch, tierKey, tierLabel, stations, why, isInitial };
}

export function swapSlots(slots, a, b) {
  if (a === b || a < 0 || b < 0 || a > 3 || b > 3) return slots.slice();
  const next = slots.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

// Section 01: Quadrant inspector data
export const QUADRANT_INFO = {
  poa: {
    title: "主光学区",
    en: "PRIMARY OPTICAL AREA",
    weight: "高关注（强势）· 第一入口",
    desc: "左上角是左起横排读者打开均匀版面后的第一落点。海报写它「第一落点，最先被看到，承载核心信息」——如果这里放了无关紧要的声明，整张页的第一秒就被浪费了。",
    place: "适合放：报头标识、核心主标题、开篇主旨或决定读者要不要继续看下去的钩子。",
  },
  sfa: {
    title: "强休耕区",
    en: "STRONG FALLOW AREA",
    weight: "中关注（次级）· 横扫带过",
    desc: "视线从左上自然往右横扫会经过这里，但不会久留。英文里叫 Strong Fallow（休耕区）：相比左下角它更容易被扫到，却仍弱于左上与右下两端。",
    place: "适合放：期号、日期、简短目录提要或辅助索引；不宜单独扛起最终转化。",
  },
  wfa: {
    title: "弱休耕区",
    en: "WEAK FALLOW AREA",
    weight: "低关注（弱势）· 视线盲角",
    desc: "对角阅读重力从左上滑向右下时，左下角落在主路径之外，是四个象限里停留最少的一块。把核心标题或主按钮塞进这里，最容易被读者直接掠过。",
    place: "适合放：版权声明、免责条款、页码注记等「必须有但无需抢戏」的低优先级内容。",
  },
  ta: {
    title: "终端区域",
    en: "TERMINAL AREA",
    weight: "高关注（强势）· 自然收口",
    desc: "阅读重力最终把视线带到右下角停下。海报称之为「阅读的最终落点，适合放置总结或行动引导」——读者刚把前文信息收齐，此时顺手接上行动指令阻力最小。",
    place: "适合放：结论摘要、订阅回执、确认按钮、二维码或「下一页」入口。",
  },
};

// Section 02: Homogeneity override model (single source of truth)
const ANCHOR_NAMES = {
  tl: "左上主光学区",
  tr: "右上强休耕区",
  bl: "左下弱休耕区",
  br: "右下终端区域",
};

export function evaluateOverride(contrastPct, anchor) {
  const pct = Math.max(0, Math.min(100, Math.round(contrastPct)));
  const disruptorOn = pct >= 20;
  let tierKey = "gravity";
  let tierLabel = "均质版面 · 重力主导";
  let verdict = "";

  if (pct < 25) {
    tierKey = "gravity";
    tierLabel = "均质版面 · 重力主导";
    verdict = `当前主图反差占比仅 ${pct}%，整页仍接近灰白均匀的铅字密度。没有视觉重心抢戏时，阅读重力稳稳把第一眼放在左上起点，顺对角流向右下终点（模型示意）。`;
  } else if (pct < 60) {
    tierKey = "compete";
    tierLabel = "拉扯过渡 · 入口竞争";
    verdict = `放进${ANCHOR_NAMES[anchor]}的主图反差升到 ${pct}%，版面开始失去同质性：读者在左上习惯起点与${ANCHOR_NAMES[anchor]}的高对比块之间来回拉扯，对角重力线明显弯折（模型示意）。`;
  } else {
    tierKey = "override";
    tierLabel = "层级接管 · 非同质";
    if (anchor === "tl") {
      verdict = `主图反差达到 ${pct}% 且正好落在左上主光学区：视觉层级与习惯起点叠在一起，第一落点被进一步放大，随后由视觉体量而非均质重力决定下一站（模型示意）。`;
    } else {
      verdict = `主图反差达到 ${pct}%，强对比图形直接截走了第一眼——即便它落在${ANCHOR_NAMES[anchor]}，读者仍先看主图再寻标题与正文，古腾堡均质重力已被层级接管（模型示意）。`;
    }
  }
  return { pct, disruptorOn, tierKey, tierLabel, verdict, anchorName: ANCHOR_NAMES[anchor] };
}

// Section 03: Historical milestones (strictly verified facts)
export const TIMELINE = [
  {
    year: "c. 1455",
    place: "美因茨 · 活字书页惯例",
    title: "古腾堡《四十二行圣经》确立均质活字版面",
    text: "Johannes Gutenberg 于约 1455 年在美因茨印成拉丁文《四十二行圣经》（Biblia Latina），双栏每页四十二行、字密齐整。这种左起横排、栏密均匀的活字版面成了西方印刷页的基本底色；后世图式借他的名字致敬均质印刷页，并非古腾堡本人绘制过该图。",
    source: "核实来源：美国国会图书馆 The Gutenberg Bible 展陈档案",
    visual: "gutenberg",
  },
  {
    year: "1956",
    place: "美国报刊 · 功能化排版",
    title: "Edmund C. Arnold 提出「阅读重力」与报刊四区规律",
    text: "被称作「现代报刊设计之父」的 Edmund C. Arnold（1913–2007）在《Functional Newspaper Design》（1956）、《Modern Newspaper Design》（1969）及《Designing the Total Newspaper》（1981）中，反复阐述左起横排读者从左上主光学区滑向右下终端区域的「阅读重力（reading gravity）」；「古腾堡图式」这一名称与框架通常归于 Arnold 的报刊排版体系。",
    source: "核实来源：Internet Archive 原书馆藏（1981）与 Open Library（1956 / 1969）书目记录",
    visual: "arnold",
  },
  {
    year: "1991",
    place: "Poynter 研究所 · 印刷眼动研究",
    title: "《Eyes on the News》追踪印刷报纸读者视线",
    text: "Mario R. García 与 Pegie Stark（Stark Adam）在 Poynter 研究所发表《Eyes on the News》，对印刷报纸开展大规模眼动追踪。研究观察到，面对有照片与大标题的现代报纸，读者常从主图或大标题进入版面，而不是机械地每次都停在左上角。",
    source: "核实来源：Poynter 官网 EyeTrack 回顾档案与 Open Library 书目记录",
    visual: "poynter",
  },
  {
    year: "2003",
    place: "Rockport 出版社 · 设计词典收录",
    title: "《Universal Principles of Design》正式收录词条",
    text: "William Lidwell、Kritina Holden 与 Jill Butler 在《Universal Principles of Design》（2003 首版，2010 修订版）中收录了「Gutenberg Diagram」词条，清晰列出主光学区、强休耕区、弱休耕区与终端区域四块名称，并明文将其适用前提限定在「分布均匀、同质的信息」。",
    source: "核实来源：O'Reilly 书目页（2010 修订版）与 Open Library（2003 首版）记录",
    visual: "lidwell",
  },
  {
    year: "2006",
    place: "Nielsen Norman Group · 网页眼动",
    title: "网页长文测出「F 型扫描」，从此常与古腾堡被混谈",
    text: "Jakob Nielsen 公布追踪 232 位网页用户的眼动研究，概括出网页文字页常见的「F 型扫描」：先横扫两行，再贴着左侧竖向找词头。此后不少中文转述把 F 型扫描的眼动结论嫁接到了古腾堡图式上——其实两者出身不同、轨迹也不同。",
    source: "核实来源：Nielsen Norman Group 网页阅读研究报告（2006 / 2017 / 2020）",
    visual: "nng",
  },
];

// Section 04: Script direction (explicitly marks RTL & TTB-RL as inferred schematics)
export const SCRIPT_MODES = {
  ltr: {
    modeTag: "LTR HORIZONTAL",
    badge: "经典模型 · 左起横排",
    note: "左起横排（现代中文横排、英文与拉丁语系）：视线从左上入行、自左向右逐行推进，阅读重力从左上起点斜向滑落至右下终点。",
  },
  rtl: {
    modeTag: "RTL HORIZONTAL · INFERRED",
    badge: "推论示意 · 按右起横排镜像",
    note: "按书写方向作出的推论示意（非跨语种等量实测数据）：在阿拉伯文、希伯来文等右起横排文字中，每一行自右向左起笔，习惯落点按镜像推论由右上主入口转向左下终端。",
  },
  ttb: {
    modeTag: "TTB-RL VERTICAL · INFERRED",
    badge: "推论示意 · 按右起竖排镜像",
    note: "按书写方向作出的推论示意（非现代眼动实测数据）：传统东亚古籍竖排自右上起行、由上而下直读并向左换列，版面起止习惯按镜像推论从右上题首收束到左下尾款。",
  },
};

// Section 07: Practice quiz — single variable (corner placement of RSVP seal on a traditional TTB-RL vertical sheet)
export const QUIZ_CORRECT = "B";

export const QUIZ_FEEDBACK = {
  A: {
    correct: false,
    flag: "右下角 · 错套横排习惯",
    title: "这是左起横排的终点，在右起竖排里才刚读完第一列。",
    body: "四张请柬的正文排向与字密完全相同，唯一变量是「预约留席」印章落在哪一角。方案 A 把它留在右下角——在自右向左的竖排页里，右下角只是最右首列的底端，读者刚看清展名、还没往左读完日期与须知就被催着留席。按第 04 节的书写方向推论，传统右起竖排的自然收尾在左下角（方案 B）。",
  },
  B: {
    correct: true,
    flag: "左下角 · 顺应竖排尾款",
    title: "选对了！方案 B 把回执印章安在右起竖排的自然终点。",
    body: "阅读重力不是写死的「左上到右下」，而是跟着文字行向走。传统右起竖排自右上起首、直行下读并逐列向左推进，按第 04 节的书写方向推论，读者读完全部四列正文后，视线正好收束在左下尾款处——此时顺手接上「预约留席」印章最自然，也呼应了古籍题跋与落款多置左下的传统。",
  },
  C: {
    correct: false,
    flag: "左上角 · 截在末列起笔",
    title: "方向翻了一半：方案 C 放在了末列顶端，还没读完最后一列。",
    body: "方案 C 注意到了右起竖排会向左推进，却把印章留在左上角（天头左端）。竖排每一列都是自上而下直读的，视线刚换到最左一列顶端，还没往下扫完入场须知就提前撞见回执，收口早了半拍。顺着末列向下读完，真正的尾款终端落在左下角（方案 B）。",
  },
  D: {
    correct: false,
    flag: "右上角 · 堵在第一眼入口",
    title: "这里正好是右起竖排的第一落点，还没读文先见回执。",
    body: "在自右向左的竖排请柬里，右上角相当于左起横排里的左上主光学区，是读者第一眼切入的起点。方案 D 把「预约留席」压在右上天头，读者尚未看清展名、时间与内容就被推去预约。待正文由右向左直读完毕，自然收尾在左下角（方案 B）。",
  },
};
