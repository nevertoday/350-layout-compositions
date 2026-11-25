// 184 跨栏标题 · 纯数据与排版诊断模型
// 开场「全幅报刊活字跨栏台」的状态只存画框内归一化起止位置 u0..u1 (0..1)：
// 既支持单栏、左偏跨栏、右偏跨栏、中段跨栏、全通栏，也支持拖动中实时检出悬在栏间的错位状态。

export const SCENARIOS = {
  broadsheet: {
    label: "报刊特写",
    kicker: "示例稿 · 虚构 · 城市街景",
    headlines: {
      short: "街角慢下来",
      medium: "慢行街道正在把街角还给人",
      long: "拆掉护栏、拓宽树荫人行道之后，慢行街道如何把街角还给人",
    },
    deck: "收窄机动车道、拓宽树荫人行道之后，车流退回背景，街口重新成为行人愿意驻足交谈的日常客厅。",
    columns: [
      "清晨七点半，梧桐影刚铺过斑马线，街口面包房已支起折叠木桌。过去这里是一条车流匆匆的通勤快道，行人在窄护栏里快步穿过，很少有人愿意停下多看一眼。",
      "改造并没有大拆大建，只是把外侧车道收作慢行道，拉宽路口安全岛，再让底商外摆退回统一的建筑基线内。车声降下来之后，街头的步调跟着缓了下来。",
      "城市规划者常说，街道不是水管，而是客厅。把最宽的尺度让给行走与交谈，并不是反效率，而是把被车流切碎的日常重新缝成一块完整的公共空间。",
      "午后四点，放学的孩子沿着铺装界线滑过，老人在树池边读报。整条街像一页排得从容的版面：先有清晰的主线，再让不同节奏的生活各自落栏。",
    ],
    sideBriefs: [
      { tag: "编者按", title: "左首栏顶头", body: "主标从第 2 栏向右跨时，第 1 栏自然化作导读或提要通道。" },
      { tag: "街角速写", title: "慢行界面", body: "收窄车道并种下行道树后，街口长椅与外摆区成了邻里落脚处。" },
      { tag: "末栏简讯", title: "独立边栏", body: "主标未覆盖的末栏直接顶齐页眉，可放图注、提要或留白。" },
      { tag: "延伸阅读", title: "邻里观察", body: "沿街首层外摆退回统一基线后，步行通廊更连贯。" },
    ],
  },
  magazine: {
    label: "文化杂志",
    kicker: "示例稿 · 虚构 · 建筑与气候",
    headlines: {
      short: "风穿长廊",
      medium: "当一座建筑学会给风让路",
      long: "顺着季风开口与深挑檐，南方老屋的穿堂风智慧如何回到美术馆",
    },
    deck: "不必靠厚重幕墙硬抗暑热。顺着季风开口、借挑檐与中庭引流，南方老屋的自然通风智慧回到公共建筑里。",
    columns: [
      "走进这座美术馆前厅，空调并没有开，穿堂风却沿着南北向的高窗稳稳掠过水面。建筑师把体量切开一道宽廊，让室外气压差替机器干活。",
      "宽阔的深屋檐向外伸展，正午烈日被挡在廊柱之外，漫射天光则顺着浅灰石面折进展示厅。立面不再是一张封闭的玻璃皮，而是一层会呼吸的滤网。",
      "材料也跟着克制下来：粗凿花岗岩、清水混凝土与可开启木百叶，没有多余饰线。结构的每一次留缝，都同时服务于采光、通风与步行节奏。",
      "傍晚闭馆前，斜阳落进中庭阶梯，风穿过连廊带起一阵水汽。好空间和好版式一样，关键从不是堆满，而是知道在哪里打通、在哪里留空。",
    ],
    sideBriefs: [
      { tag: "导读提要", title: "前廊气候", body: "首栏留给风向注释，把主标题向右推移成非对称杂志跨页。" },
      { tag: "构造备注", title: "深檐遮阳", body: "宽大挑檐遮去正午直射光，让室内只留柔和漫射天光。" },
      { tag: "空间图注", title: "末栏呼吸", body: "右栏不入标题屋檐，用留白与细标反衬跨栏主标的份量。" },
      { tag: "材料清单", title: "本色饰面", body: "粗凿花岗岩与清水混凝土不抢视觉重心。" },
    ],
  },
  report: {
    label: "年度报告",
    kicker: "示例稿 · 虚构 · 公共阅读",
    headlines: {
      short: "静默回潮",
      medium: "公共图书馆里的静默回潮",
      long: "当屏幕推送不断切碎注意力，实体公共图书馆为何重新坐满长桌",
    },
    deck: "推开阅览室玻璃门，临窗长桌、翻页声与一排暖光台灯围出一处不被打断的专注场。人们来这里，不只是为了借书。",
    columns: [
      "工作日上午，阅览室临窗的长桌陆续坐下不少读者。有人摊开纸质笔记，有人对着屏幕改稿，彼此互不打扰，整片空间维持着低沉平稳的翻页声。",
      "馆方把原本密集排布的书库往内收，把采光最好的外圈改成开放式阅读席与小型研讨室。空间层级分明：先有开阔入口定调，再按静默程度分区分流。",
      "靠窗一侧摆着大开本艺术画册与社区地方志，读者常把几册摊开在宽桌面上对照查阅——大尺幅纸页带来的纵览感，在小屏幕上很难替代。",
      "夜里闭馆铃响起前，台灯一排排亮着。当手机推送不断切碎注意力，一座允许人安静坐上一整晚的公共屋檐，本身就成了稀缺的日常庇护。",
    ],
    sideBriefs: [
      { tag: "年度摘要", title: "首栏索引", body: "年报常把第 1 栏留作章节编号与要点提炼，主标跨右两栏。" },
      { tag: "空间分布", title: "静默动线", body: "外圈自然采光留给阅览长桌，内圈收纳密集书库。" },
      { tag: "口径说明", title: "右栏附注", body: "主标只跨前几栏时，末栏顺理成章承接注释与编排说明。" },
      { tag: "馆舍笔记", title: "专注长桌", body: "宽桌与独立台灯为摊开多册资料的深度阅读留出余地。" },
    ],
  },
};

// 按「跨度可用宽 ÷ 字数」计算开场跨栏标题字号（1–2 行，窄栏自动折行）
export function computeHeadlineFontSize(innerW, chars, stageW) {
  const w = Math.max(96, innerW);
  const n = Math.max(1, chars);
  const isNarrow = stageW < 520;
  const maxSingle = Math.min(82, Math.max(32, stageW * (isNarrow ? 0.105 : 0.074)));
  const minSingle = isNarrow ? 26 : 35;

  const oneLine = (w * 0.90) / n;
  if (n <= 6) {
    // 短标单行随跨度放大，上限止于 maxSingle，全通 3/4 栏时右侧自然空悬
    return Math.max(20, Math.min(maxSingle, oneLine));
  }
  if (n <= 14) {
    if (oneLine >= minSingle) {
      return Math.min(maxSingle, oneLine);
    }
    const twoLine = (w * 0.88) / Math.ceil(n / 2);
    const cap2 = isNarrow ? Math.min(34, maxSingle) : minSingle;
    if (twoLine >= 18) {
      return Math.min(cap2, twoLine);
    }
    const threeLine = (w * 0.88) / Math.ceil(n / 3);
    return Math.max(15, Math.min(22, threeLine));
  }
  // 长标（15+ 字）：宽处 2 行均衡过梁，收窄后折 3–4 行
  const twoLine = (w * 0.88) / Math.ceil(n / 2);
  const maxLong = Math.min(58, Math.max(24, stageW * (isNarrow ? 0.072 : 0.052)));
  const minTwo = isNarrow ? 17 : 24;
  if (twoLine >= minTwo) {
    return Math.min(maxLong, twoLine);
  }
  const threeLine = (w * 0.88) / Math.ceil(n / 3);
  return Math.max(14, Math.min(minTwo, threeLine));
}

// 计算 n 栏网格下各栏的左缘、右缘（归一化 0..1，含栏缝占比）
export function gridMetrics(cols) {
  const gutter = cols === 2 ? 0.044 : cols === 3 ? 0.034 : 0.026;
  const colW = (1 - gutter * (cols - 1)) / cols;
  const edges = [];
  for (let i = 1; i <= cols; i++) {
    const left = (i - 1) * (colW + gutter);
    const right = left + colW;
    edges.push({ col: i, left, right });
  }
  return { cols, gutter, colW, edges };
}

// 按栏号 [startCol, endCol] 得到精确归一化区间 [u0, u1]
export function rangeForCols(startCol, endCol, cols) {
  const { edges } = gridMetrics(cols);
  const s = Math.max(1, Math.min(cols, startCol));
  const e = Math.max(s, Math.min(cols, endCol));
  return { u0: edges[s - 1].left, u1: edges[e - 1].right };
}

// 磁吸：把起止坐标各自轻吸到最近的栏左缘 / 栏右缘
export function snapRange(u0, u1, cols, threshold = 0.08) {
  const { edges, colW } = gridMetrics(cols);
  let a = Math.max(0, Math.min(1 - colW * 0.78, u0));
  let b = Math.max(a + colW * 0.78, Math.min(1, u1));

  let bestA = a;
  let minA = threshold;
  for (const e of edges) {
    const d = Math.abs(a - e.left);
    if (d < minA) {
      minA = d;
      bestA = e.left;
    }
  }

  let bestB = b;
  let minB = threshold;
  for (const e of edges) {
    const d = Math.abs(b - e.right);
    if (d < minB) {
      minB = d;
      bestB = e.right;
    }
  }

  if (bestB - bestA < colW * 0.96) {
    // 宽度不足一整栏时，归位到最接近的一整栏，避免 2 栏下左拖到底卡在悬空态
    const mid = (a + b) / 2;
    let nearest = edges[0];
    let md = Infinity;
    for (const e of edges) {
      const d = Math.abs(mid - (e.left + e.right) / 2);
      if (d < md) {
        md = d;
        nearest = e;
      }
    }
    return { u0: nearest.left, u1: nearest.right };
  }
  return { u0: bestA, u1: bestB };
}

// 将归一化跨栏区间 [u0, u1] 换算为排版诊断、覆盖栏位与未覆盖栏位
export function evaluateRange(u0, u1, cols, opts = {}) {
  const { hlen = "medium", chars = 11, deck = true } = opts;
  const { edges, colW, gutter } = gridMetrics(cols);
  const minW = colW * 0.78;
  let a = Math.max(0, Math.min(1 - minW, u0));
  let b = Math.max(a + minW, Math.min(1, u1));
  const width = b - a;

  let nearLeft = edges[0];
  let diffLeft = Infinity;
  let nearRight = edges[cols - 1];
  let diffRight = Infinity;

  for (const e of edges) {
    const dl = Math.abs(a - e.left);
    if (dl < diffLeft) {
      diffLeft = dl;
      nearLeft = e;
    }
    const dr = Math.abs(b - e.right);
    if (dr < diffRight) {
      diffRight = dr;
      nearRight = e;
    }
  }

  const leftAligned = diffLeft <= 0.032;
  const rightAligned = diffRight <= 0.032;
  const aligned = leftAligned && rightAligned && nearLeft.col <= nearRight.col;

  const startCol = aligned ? nearLeft.col : null;
  const endCol = aligned ? nearRight.col : null;
  const spanCount = aligned ? endCol - startCol + 1 : null;
  const approxCols = Math.min(cols, Math.max(1, (width + gutter) / (colW + gutter)));

  // 哪些栏被标题实际压住（中心点或超 35% 落在区间内）
  const covered = [];
  for (const e of edges) {
    const overlap = Math.max(0, Math.min(b, e.right) - Math.max(a, e.left));
    if (overlap >= colW * 0.32) covered.push(e.col);
  }
  if (covered.length === 0) covered.push(nearLeft.col);

  const firstCov = covered[0];
  const lastCov = covered[covered.length - 1];
  const leftFree = [];
  const rightFree = [];
  for (let c = 1; c <= cols; c++) {
    if (c < firstCov) leftFree.push(c);
    else if (c > lastCov) rightFree.push(c);
  }

  let status = "partial";
  let badge = "";
  let rangeLabel = aligned
    ? startCol === endCol
      ? `C${startCol}`
      : `C${startCol}–C${endCol}`
    : `${approxCols.toFixed(1)} 栏`;
  let verdict = "";
  let eyeNote = "";

  const shortOverstretched = aligned && hlen === "short" && spanCount >= 3;

  if (!aligned) {
    status = "drift";
    badge = `悬在栏间 · ${approxCols.toFixed(1)} / ${cols}`;
    const which = !leftAligned && !rightAligned ? "左右两缘都" : !leftAligned ? "左缘" : "右缘";
    verdict = `标题${which}停在栏身中间，没有落回网格栏线——下方分栏与标题边界松了扣；松手或用方向键即可吸附回栏线。`;
    eyeNote = "边界落空：活字过梁没压在网格栏线上";
  } else if (spanCount === 1) {
    status = "single";
    badge = `单栏锁死 · C${startCol} / ${cols}`;
    verdict = `标题被压进第 ${startCol} 栏里折成窄条，其余 ${cols - 1} 栏直接顶齐页眉——整页像拼贴了几则无关短讯，失去了通栏的统领力。`;
    eyeNote = `视线碎裂：仅第 ${startCol} 栏有帽，其余栏各自顶头`;
  } else if (shortOverstretched && !deck) {
    status = "sparse";
    badge = `短标空悬 · ${rangeLabel}`;
    verdict = `只有 ${chars} 字的短标硬撑满 ${spanCount} 栏，右边空一大片、显得头轻脚重——该打开「导语」接住屋檐，或改跨 2 栏留出边栏（见第 03 节）。`;
    eyeNote = "右边空一大片：短标撑宽栏时，该加导语或改跨 2 栏";
  } else if (shortOverstretched && deck) {
    status = spanCount === cols ? "full" : "partial";
    badge = `${spanCount === cols ? "全通栏" : "跨 " + spanCount + " 栏"} · ${rangeLabel}（短标）`;
    verdict = `短标只有 ${chars} 字，撑满 ${spanCount} 栏后主标右边空一大片；此刻靠「导语」接住屋檐——关掉导语或改跨 2 栏，立刻看出第 03 节说的差别。`;
    eyeNote = "主标右边空一大片，当前靠下方导语补齐通栏跨度";
  } else if (spanCount === cols) {
    status = "full";
    badge = `全通栏 · C1–C${cols}`;
    verdict = `标题像一道通天过梁横跨全部 ${cols} 栏，左缘严齐首栏、右缘呼应末栏：先一眼拿住核心命题，再顺势分流进齐平起跑的下方各栏。`;
    eyeNote = `先横扫全幅建立重心，再自左向右落入 ${cols} 栏`;
  } else if (startCol === 1) {
    status = "partial";
    badge = `左偏跨栏 · C1–C${endCol}`;
    verdict = `标题横跨前 ${spanCount} 栏统领主文，把右侧 ${cols - endCol} 栏直接让给顶头边栏或留白——稳住重心之余，带出利落的非对称呼吸感。`;
    eyeNote = `前 ${spanCount} 栏齐平下沉，末栏顶头承接边注或留白`;
  } else if (endCol === cols) {
    status = "partial";
    badge = `右偏跨栏 · C${startCol}–C${cols}`;
    verdict = `经典杂志跨页手法：左侧前 ${startCol - 1} 栏直接顶齐页眉放导读或提要，标题向右跨越 C${startCol}–C${cols}，把主文稳稳罩住。`;
    eyeNote = `左首栏顶头引路，右 ${spanCount} 栏在跨栏标题下齐平展开`;
  } else {
    status = "partial";
    badge = `中段跨栏 · C${startCol}–C${endCol}`;
    verdict = `标题居中跨越 C${startCol}–C${endCol}，左右两侧外栏各自顶头夹持——适合宽幅画报专题，但两侧外栏内容要克制，别抢主标风头。`;
    eyeNote = `中段 ${spanCount} 栏合归标题之下，左右外栏退居边注`;
  }

  return {
    u0: a,
    u1: b,
    width,
    pct: Math.round(width * 100),
    aligned,
    leftAligned,
    rightAligned,
    startCol,
    endCol,
    spanCount,
    approxCols,
    covered,
    leftFree,
    rightFree,
    status,
    badge,
    rangeLabel,
    verdict,
    eyeNote,
  };
}

// 针对 2 / 3 / 4 栏生成有代表性的真实编辑部版型预设
export function presetsForCols(cols) {
  if (cols === 2) {
    return [
      { id: "c1", label: "单栏 C1", start: 1, end: 1 },
      { id: "c1-2", label: "全通 C1–2", start: 1, end: 2 },
    ];
  }
  if (cols === 3) {
    return [
      { id: "c1", label: "单栏 C1", start: 1, end: 1 },
      { id: "c1-2", label: "左跨 C1–2", start: 1, end: 2 },
      { id: "c2-3", label: "右跨 C2–3", start: 2, end: 3 },
      { id: "c1-3", label: "全通 C1–3", start: 1, end: 3 },
    ];
  }
  return [
    { id: "c1", label: "单栏 C1", start: 1, end: 1 },
    { id: "c1-2", label: "左跨 C1–2", start: 1, end: 2 },
    { id: "c2-4", label: "右跨 C2–4", start: 2, end: 4 },
    { id: "c1-4", label: "全通 C1–4", start: 1, end: 4 },
  ];
}

// 第 01 节：「统领 vs 割裂」三态对比
export const GROUPING_MODES = {
  trapped: {
    label: "锁在首栏",
    tag: "割裂",
    tone: "warn",
    text: "标题缩进第一栏，折行局促；第 2、3 栏顶齐页面上沿，像贴在旁边的两篇无关短文，版面缺少统一的视觉起点。",
  },
  spanning: {
    label: "通栏统领",
    tag: "秩序",
    tone: "good",
    text: "通栏标题先声夺人，把三栏罩在同一道「屋檐」底下：分栏缩短了行长却没有割裂整体，眼睛先抓主旨再顺势落栏。",
  },
  split: {
    label: "三栏各自起标",
    tag: "竞争",
    tone: "warn",
    text: "每一栏各顶一个小标题且体量接近，三个焦点互相抢戏——读者不知从哪一栏进门，适合并列目录，却压不住一篇深度长文。",
  },
};

// 第 03 节：「跨栏结构调音台」诊断 + 四条设计要点联动预设
export const HEADLINE_LENGTHS = {
  short: { label: "短标（4 字）", text: "风穿长廊", chars: 4 },
  medium: { label: "中标（11 字）", text: "当一座建筑学会给风让路", chars: 11 },
  long: { label: "长标（20 字）", text: "南方老屋的穿堂风智慧如何回到当代公共建筑", chars: 20 },
};

export const CAL_PRESETS = {
  r1: {
    no: "01",
    title: "先通栏，后分栏",
    note: "中标 2.8× 配导语全通 3 栏，搭稳总—分骨架",
    state: { ratio: 2.8, gap: 20, lengthKey: "medium", spanCols: 3, hasDeck: true, hasRule: true },
  },
  r2: {
    no: "02",
    title: "对齐与留白",
    note: "4 字短标收成跨 2 栏、下留 24px，末栏空作呼吸区",
    state: { ratio: 3.0, gap: 24, lengthKey: "short", spanCols: 2, hasDeck: false, hasRule: true },
  },
  r3: {
    no: "03",
    title: "统一与变化",
    note: "20 字长标降到 2.2× 借细线立节拍，避免顶部发沉",
    state: { ratio: 2.2, gap: 18, lengthKey: "long", spanCols: 3, hasDeck: false, hasRule: true },
  },
  r4: {
    no: "04",
    title: "反例：空撑脱节",
    note: "4 字硬撑 3 栏且间距 44px，立刻触发失衡警报",
    state: { ratio: 3.4, gap: 44, lengthKey: "short", spanCols: 3, hasDeck: false, hasRule: false },
  },
};

export function diagnoseCalibrator({ ratio, gap, lengthKey, hasDeck, spanCols }) {
  const issues = [];
  const goods = [];

  if (ratio < 1.8) {
    issues.push(`字号比仅 ${ratio.toFixed(1)}×，标题和正文拉不开档次，通栏的「视觉抓手」发虚`);
  } else if (ratio > 3.6 && lengthKey === "long") {
    issues.push(`20 字长标叠上 ${ratio.toFixed(1)}× 超大字号，被迫折成三四行，顶部变得笨重`);
  } else {
    goods.push(`字号比 ${ratio.toFixed(1)}×，层级清楚`);
  }

  if (gap < 10) {
    issues.push(`标题与分栏只隔 ${gap}px，字脚几乎压到正文顶行，总分边界发闷`);
  } else if (gap > 38) {
    issues.push(`间距拉到 ${gap}px，标题和下面三栏开始脱节，像浮在半空的孤岛`);
  } else {
    goods.push(`标题下方留白 ${gap}px，隔断利落`);
  }

  if (lengthKey === "short" && spanCols === 3 && !hasDeck) {
    issues.push("只有 4 个字却要撑满三栏，右侧大片空悬——试着打开「跨栏导语」接住屋檐，或改跨 2 栏留出边栏");
  } else if (lengthKey === "short" && hasDeck) {
    goods.push("短主标配两行通栏导语，把三栏跨度稳稳接住");
  } else if (lengthKey === "short" && spanCols === 2) {
    goods.push("短标只跨 2 栏，留出第 3 栏当呼吸区，反而精悍");
  }

  if (issues.length === 0) {
    return {
      tone: "good",
      tag: "尺度稳当",
      text: `${goods.join("；")}。先吸引注意、再引导阅读的「总—分」节奏已经立住。`,
    };
  }
  return {
    tone: "warn",
    tag: `发现 ${issues.length} 处失衡`,
    text: `${issues.join("；")}。`,
  };
}

// 第 04 节：「四种翻车与修复」
export const FLAWS = {
  offset: {
    label: "左缘错位",
    brokenTag: "失序：左缘没锁首栏线",
    fixedTag: "修复：左缘严齐首栏线",
    brokenText: "标题比第一栏左缘缩进或探出一截，眼睛从标题落进首栏时要额外拐一次弯，网格对齐感立刻破功。",
    fixedText: "让标题左缘严丝合缝贴齐第 1 栏左线，视觉纵轴一竿到底；下方各栏像挂在同一把标尺之下。",
  },
  chopped: {
    label: "拦腰斩碎",
    brokenTag: "失序：中途连插多道通栏",
    fixedTag: "修复：主标通栏，小标留栏内",
    brokenText: "短版面里一连插入两三道跨栏小标，把三栏水流横切成了九个小豆腐块，读者不断迟疑该往下读还是往右读。",
    fixedText: "一页只留顶部主标题通栏定锚，文中二级小标老老实实留在各自栏内，既清晰又不截断纵向阅读流。",
  },
  widow: {
    label: "孤字吊尾",
    brokenTag: "失序：末行吊着单个孤字",
    fixedTag: "修复：按语意断行，两行均衡",
    brokenText: "通栏宽度很宽，第二行只掉下来一两个孤字贴在最左侧，横跨三栏的底下拖着一条长长的空白缺口。",
    fixedText: "微调措辞或字号，让两行标题按词组自然断句、长度呼应，跨栏的体块才稳得住。",
  },
  baseline: {
    label: "栏顶不齐",
    brokenTag: "失序：三栏起始高度错落",
    fixedTag: "修复：三栏踩在同一条起跑线",
    brokenText: "通栏下方第 1 栏带导语、第 2 栏多塞了空行、第 3 栏顶着卡片，三条栏顶高低参差，跨栏建立的秩序瞬间散掉。",
    fixedText: "把三栏正文的第一行锁死在同一条水平基线上，辅助标签统一收纳到上方通栏区，分栏整齐利落。",
  },
};

// 第 06 节：小练习四选一
export const QUIZ = {
  A: {
    ok: false,
    title: "A · 标题被关进第一栏了",
    text: "「老城电车百年记」缩在左侧窄栏里折成三行，右边的第 2、3 栏直接顶到页头。读者很难第一眼确认这三栏属于同一篇文章，缺少通栏带来的统领力。",
  },
  B: {
    ok: true,
    title: "B · 这一版最稳（推荐）",
    text: "主标题左缘严齐首栏、横跨全部三栏，字号与正文拉开约 3 倍对比；下方用两行跨栏导语和一道钴蓝细线接住屋檐，三栏正文从同一条水平线齐平起步。先抓焦点，再分栏细读。",
  },
  C: {
    ok: false,
    title: "C · 中途跨栏把文章切碎了",
    text: "页顶勉强通栏，却在版面中段又连插两道跨栏小标，把三栏正文拦腰斩成上下几段，打断了读者顺着单栏往下读的习惯；而且顶部居中大标与下方左齐正文轴线打架。",
  },
  D: {
    ok: false,
    title: "D · 没对齐栏线，右缘悬在半空",
    text: "标题左缘比第一栏偏右，右缘停在第 3 栏正中间——既不是完整的 2 栏偏跨，也不是 3 栏全通；加上底下三栏起始高度不齐，整个网格秩序全松了。",
  },
};
