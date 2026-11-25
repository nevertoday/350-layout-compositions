// 184 跨栏标题 · 纯数据与排版诊断模型
// 开场「过梁拖拽台」的状态用画框内的归一化跨度 u (0..1) 表示：
// 无论 2 栏、3 栏还是 4 栏，都可以连续拖动，并在释放时轻吸附到栏外缘。

export const SCENARIOS = {
  broadsheet: {
    label: "报刊特写",
    kicker: "WEEKEND FEATURE · 城市观察",
    headline: "慢行街道正在把街角还给人",
    deck: "过去十年里，二十余座城市拆掉机动车道护栏、拓宽树荫人行道。当车速退到背景，街区的商业与邻里节奏反而活了过来。",
    columns: [
      "清晨七点半，梧桐影刚铺过斑马线，街口面包房已支起两张折叠木桌。过去这里是一条双向四车道的通勤快道，行人在窄护栏里快步穿过，很少有人愿意停下多看一眼。",
      "改造并没有大拆大建，只是把外侧车道缩减为慢行道，拉宽路口安全岛，再让底商外摆退回统一的建筑基线内。噪音降下来以后，停留时间几乎翻了一倍。",
      "城市规划者常说，街道不是水管，而是客厅。把最宽的尺度让给行走与交谈，并不是反效率，而是把被车流切碎的日常重新缝成一块完整的公共空间。",
      "午后四点，放学的孩子沿着铺装界线滑过，老人在树池边读报。整条街像一页排得从容的版面：先有清晰的主线，再让不同节奏的生活各自落栏。",
    ],
    byline: "特派记者 · 城建版",
  },
  magazine: {
    label: "文化杂志",
    kicker: "ISSUE 184 · 建筑与气候",
    headline: "当一座建筑学会给风让路",
    deck: "不必靠厚重幕墙硬抗暑热。顺着季风开口、借挑檐与中庭引流，南方老屋的被动降温智慧正回到当代公共建筑里。",
    columns: [
      "走进这座美术馆前厅，空调并没有开，穿堂风却沿着南北向的高窗稳稳掠过水面。建筑师把体量切开一道宽廊，让室外气压差替机器干活。",
      "屋檐挑出近三米，正午烈日被挡在廊柱之外，漫射天光则顺着浅灰石面折进展示厅。立面不再是一张封闭的玻璃皮，而是一层会呼吸的滤网。",
      "材料也跟着克制下来：粗凿花岗岩、清水混凝土与可开启木百叶，没有多余饰线。结构的每一次留缝，都同时服务于采光、通风与步行节奏。",
      "傍晚闭馆前，斜阳落进中庭阶梯，风穿过连廊带起一阵水汽。好空间和好版式一样，关键从不是堆满，而是知道在哪里打通、在哪里留空。",
    ],
    byline: "专题采写 · 空间栏目",
  },
  report: {
    label: "年度报告",
    kicker: "ANNUAL REVIEW · 公共阅读",
    headline: "公共图书馆里的静默回潮",
    deck: "屏幕阅读早已普及，但实体馆舍的到访人次与长时停留比例却在连续回升。读者寻找的不再只是借书架，而是一处不被打断的专注场。",
    columns: [
      "工作日上午九点，阅览室临窗的长桌已经坐满七成。有人带着纸质笔记，有人在电脑前改稿，很少有人交谈，整片空间维持着低沉而稳定的翻页声。",
      "馆方把原本密集排布的书库往内收，把采光最好的外圈改成开放式阅读席与小型研讨室。空间层级分明：先有开阔入口定调，再按静默程度分区分流。",
      "借阅结构也在变化。工具书与快餐读物转向线上，而长篇史料、艺术画册与社区地方志的馆内翻阅频次明显增加，纸本的纵览优势重新凸显。",
      "夜里九点半闭馆铃响起前，台灯一排排亮着。当手机推送不断切碎注意力，一座允许人安静坐满三小时的公共屋檐，本身就成了稀缺基础设施。",
    ],
    byline: "年度观察 · 公共文化组",
  },
};

// 计算 n 栏网格下各栏的左缘、右缘（归一化 0..1，含栏缝占比）
export function gridMetrics(cols) {
  const gutter = cols === 2 ? 0.055 : cols === 3 ? 0.042 : 0.032;
  const colW = (1 - gutter * (cols - 1)) / cols;
  const edges = [];
  for (let i = 1; i <= cols; i++) {
    const left = (i - 1) * (colW + gutter);
    const right = left + colW;
    edges.push({ col: i, left, right });
  }
  return { cols, gutter, colW, edges };
}

// 将跨度比例 u (0..1) 换算为「覆盖了几栏」以及是否对齐栏外缘
export function evaluateSpan(u, cols) {
  const { edges, colW, gutter } = gridMetrics(cols);
  const clamped = Math.max(colW * 0.85, Math.min(1, u));

  // 找到最近的栏右缘
  let nearest = edges[0];
  let minDiff = Infinity;
  for (const e of edges) {
    const d = Math.abs(clamped - e.right);
    if (d < minDiff) {
      minDiff = d;
      nearest = e;
    }
  }

  const aligned = minDiff <= 0.028;
  const approxCols = Math.min(cols, Math.max(1, (clamped + gutter) / (colW + gutter)));
  const spanCount = aligned ? nearest.col : null;

  let status = "partial";
  let badge = "";
  let verdict = "";
  let eyeNote = "";

  if (!aligned) {
    status = "drift";
    badge = "悬在栏间";
    verdict = `标题右缘停在约 ${approxCols.toFixed(1)} 栏处，既没收在栏线内，也没跨到下一栏外缘——栏网在这里松了扣，松手或用方向键可吸附到最近的栏线。`;
    eyeNote = "右缘落空：下方网格线与标题边界脱节";
  } else if (spanCount === 1) {
    status = "single";
    badge = `单栏锁死 · 1 / ${cols}`;
    verdict = `标题被压进第 1 栏，被迫折成多行窄条。右侧的 ${cols - 1} 栏直接顶到页眉，读者第一眼容易误以为右边是另一篇独立短讯。`;
    eyeNote = "视线碎裂：第 1 栏与右侧各栏失去统领关系";
  } else if (spanCount === cols) {
    status = "full";
    badge = `全通栏 · ${cols} / ${cols}`;
    verdict = `标题像一道过梁横跨全部 ${cols} 栏，左缘严齐首栏、右缘呼应末栏：眼睛先在顶部拿住核心命题，再顺势分流进下方各栏细读。`;
    eyeNote = `先横扫通栏建立重心，再自左向右进入 ${cols} 栏`;
  } else {
    status = "partial";
    badge = `偏栏跨栏 · ${spanCount} / ${cols}`;
    verdict = `标题横跨前 ${spanCount} 栏，把右侧 ${cols - spanCount} 栏空出作边栏、图注或呼吸区——既建立统领感，又带出清晰的非对称节奏。`;
    eyeNote = `前 ${spanCount} 栏由标题收束，末栏形成留白或边注通道`;
  }

  return {
    u: clamped,
    aligned,
    nearest,
    spanCount,
    approxCols,
    status,
    badge,
    verdict,
    eyeNote,
  };
}

// 磁吸：靠近某栏右缘（±0.055）时吸附到精准栏线
export function snapSpan(u, cols, threshold = 0.065) {
  const { edges } = gridMetrics(cols);
  let best = u;
  let minDiff = threshold;
  for (const e of edges) {
    const d = Math.abs(u - e.right);
    if (d < minDiff) {
      minDiff = d;
      best = e.right;
    }
  }
  return best;
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

// 第 03 节：「跨栏结构调音台」诊断
export const HEADLINE_LENGTHS = {
  short: { label: "短标（4 字）", text: "风穿长廊", chars: 4 },
  medium: { label: "中标（11 字）", text: "当一座建筑学会给风让路", chars: 11 },
  long: { label: "长标（20 字）", text: "南方老屋的穿堂风智慧如何回到当代公共建筑", chars: 20 },
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
