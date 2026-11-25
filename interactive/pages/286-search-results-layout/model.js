// 286 搜索结果布局 · 单真源数据与评估模型
// 所有读数、诊单、要点实况、画布刻度与卡片渲染均来自同一份计算结果

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 信息型",
    intent: "informational",
    intentLabel: "信息型查询",
    defaultQuery: "如何提高专注力",
    totalFound: "约 258,000,000 个结果",
    latency: "0.32 秒",
    optimalRange: [44, 94],
    adCard: {
      id: "ad-0",
      isAd: true,
      title: "【推广】2026 高端降噪耳机限量预售 · 买二赠一",
      url: "ad.soundmall.example/promo-2026",
      staticLead: "限时福利专场，全店满减直降并附赠收纳礼盒，点击立即查看门店折扣与会员分期详情。",
      body: "限时福利专场，全店满减直降并附赠收纳礼盒，点击立即查看门店折扣与会员分期详情，同时涵盖周边配件与线下体验活动信息。",
      tags: ["限时促销", "满减活动"],
      thumb: "shapes",
      dateScore: 5,
      baseRelevance: 18,
    },
    docs: [
      {
        id: "focus-guide",
        title: "如何提高专注力：科学方法与实用技巧",
        url: "www.focuslab.com/guide",
        staticLead: "欢迎阅读本栏目长期连载专题，我们在过去五年里采访了来自不同行业的职场人与在校学生，记录下大家在居家办公、图书馆自习、深夜赶稿与跨时区协作中的日常感受，整理出这份覆盖作息背景、个人体会与阅读书单的综合导读，供第一次访问本站的读者按章节慢慢翻阅并收藏备用。",
        body: "系统介绍专注力的原理与训练方法，包含环境管理、时间管理、注意力训练等实用技巧，帮助你在学习与工作中持续保持高效，并给出可追踪的每日自查表与干扰源清单。通过拆解工作记忆容量、任务切换恢复代价与环境减噪策略，让读者能够按周验证每一项训练习惯的实际收益。",
        tags: ["专注力原理", "环境优化", "时间管理", "训练方法"],
        extraNoiseTags: ["效率工具", "学习记录", "日常整理", "阅读指南"],
        thumb: "mountain",
        dateScore: 2,
        baseRelevance: 98,
      },
      {
        id: "ten-habits",
        title: "提升专注力的 10 个简单习惯",
        url: "www.dailyhabits.com/article/10-tips",
        staticLead: "现代生活节奏越来越快，手机弹窗、群聊消息与多任务切换每天都在悄悄消耗人的精力，很多人甚至还没打开早间待办清单就已经感到疲惫不堪。今天这篇文章先不谈复杂理论，让我们从清晨起床后的第一杯水、拉开窗帘的节律与书桌光线摆放这些生活细节慢慢聊起。",
        body: "从日常习惯出发，分享 10 个容易实践的方法，帮助你逐步改善注意力，包括关闭非必要通知、拆分单次任务时段、建立固定的桌面启动仪式与设定离线阅读窗口。每条习惯均附执行门槛、常见破功原因与一周打卡参考，适合零基础读者从今天立刻试行。",
        tags: ["日常习惯", "精力管理"],
        extraNoiseTags: ["作息", "早起", "清单一览", "生活方式"],
        thumb: "shapes",
        dateScore: 4,
        baseRelevance: 84,
      },
      {
        id: "why-distracted",
        title: "专注力差的原因有哪些？",
        url: "www.mindhelp.cn/why-distracted",
        staticLead: "许多人常常抱怨自己静不下心来做事，却很少停下来审视背后的生理与心理背景。在我们的后台读者来信中，每周都会收到大量关于状态起伏、拖延自责与周末补觉仍然乏力的倾诉，本期专栏将结合几位匿名访谈对象的真实日记，带大家回看那些容易被忽略的生活片断。",
        body: "解析影响专注力的常见因素，包括睡眠债、高频通知打断、血糖波动与任务目标模糊，并提供针对性的改善建议，帮助你先识别分心诱因再对症调整。文章进一步区分了「启动困难」「中途易断」与「尾声疲惫」三种分心类型，给出对应自测问题与优先处理顺序。",
        tags: ["分心诱因", "诊断建议"],
        extraNoiseTags: ["心理科普", "问答", "背景资料", "专题"],
        thumb: "profile",
        dateScore: 5,
        baseRelevance: 70,
      },
      {
        id: "pomodoro-tech",
        title: "番茄工作法：提高专注力的时间管理术",
        url: "www.tomatotimer.com/technique",
        staticLead: "早在二十世纪八十年代末，一位意大利大学生就曾用厨房计时器尝试安排每天的复习进度，后来这个带着红番茄造型的小闹钟逐渐从校园书桌流传到全球软件团队与自由职业者中间。在正式展开具体操作之前，我们先回顾一下这套轻量工具在过去三十年里的流行脉络。",
        body: "通过番茄工作法的原理与步骤，以 25 分钟单任务投入配 5 分钟短休，帮助你更高效地管理时间与注意力，并减少中途切换任务带来的恢复损耗。文中同时说明了内部中断与外部中断的记录技巧，以及如何根据写作、编程等不同脑力负载灵活调整单段时长。",
        tags: ["番茄工作法", "时间管理"],
        extraNoiseTags: ["计时器", "历史", "工作流", "工具"],
        thumb: "video",
        dateScore: 3,
        baseRelevance: 80,
      },
      {
        id: "attention-review",
        title: "专注力训练的科学研究综述",
        url: "www.researchhub.edu/attention-review",
        staticLead: "本期刊栏目定期汇编认知心理学与教育技术方向的开放获取文献，供高校师生、教研人员及对实证方法感兴趣的公众按年份检索查阅。所有收录条目均附带原始出版编号、同行评议日期与数据共享许可声明，读者可通过文末索引继续追踪延伸议题与历年勘误记录。",
        body: "学术视角综述专注力训练的研究进展与实证结果，对比正念冥想、工作记忆训练与环境减噪三类干预在不同样本中的持续效应与局限。综述重点讨论了近迁移与远迁移的争议边界，帮助读者分辨哪些训练结论具备跨任务复现价值、哪些仍需审慎看待。",
        tags: ["研究综述", "实证对比"],
        extraNoiseTags: ["期刊", "文献", "索引", "开放获取"],
        thumb: "doc",
        dateScore: 1,
        baseRelevance: 74,
      },
    ],
  },
  nav: {
    id: "nav",
    label: "导航型 · 找官网",
    intent: "navigational",
    intentLabel: "导航型查询",
    defaultQuery: "FocusLab 官网入口",
    totalFound: "约 142,000 个结果",
    latency: "0.18 秒",
    optimalRange: [16, 56],
    adCard: {
      id: "ad-nav",
      isAd: true,
      title: "【推广】极速效率套件官方旗舰下载站 · 免费试用",
      url: "ad.boostsuite.example/download",
      staticLead: "一站式效率软件合集，支持多端同步与团队模板库，新客注册享首月优惠，同时提供桌面小组件、团队共享日历与年度企业采购阶梯报价方案。",
      body: "一站式效率软件合集，支持多端同步与团队模板库，新客注册享首月优惠与企业版报价说明，含桌面小组件与云端模板库试用。",
      tags: ["广告赞助", "软件推广"],
      thumb: "shapes",
      dateScore: 5,
      baseRelevance: 14,
    },
    docs: [
      {
        id: "fl-home",
        title: "FocusLab 官方网站 — 专注力指南与工具入口",
        url: "www.focuslab.com",
        staticLead: "本站成立于 2021 年，致力于以开放文档形式记录认知科学与数字工作习惯相关的公开观察，过去几年陆续由社区编辑、高校研究者与热心读者共同维护。在这里你可以浏览更新日志、编委会说明、开源许可条款以及多语言翻译志愿者名单，了解项目背后的故事。",
        body: "FocusLab 官方主页入口，直达专注力训练手册、在线番茄计时器与开放实验记录，无需注册即可访问核心工具，并提供桌面端与移动端同步入口及最新公开指南目录。",
        tags: ["官网首页", "官方入口"],
        extraNoiseTags: ["品牌", "门户", "导航", "合集"],
        thumb: "mountain",
        dateScore: 2,
        baseRelevance: 99,
      },
      {
        id: "fl-login",
        title: "FocusLab 帮助中心与账号登录",
        url: "www.focuslab.com/help/login",
        staticLead: "如果您在使用浏览器访问本站时遇到缓存、代理切换或网络波动，可以先阅读页面顶部的常见连接排查清单，确认本地系统时间与浏览器扩展状态是否正常。我们的支持文档按季度修订，覆盖桌面端、平板与移动端各主流浏览器版本的兼容说明。",
        body: "FocusLab 官方帮助文档，提供账号登录入口、密码找回、数据导出与浏览器快捷键说明，支持邮箱验证码与通行密钥两种登录方式排查。",
        tags: ["账号登录", "帮助文档"],
        extraNoiseTags: ["客服", "FAQ", "账号", "设置"],
        thumb: "profile",
        dateScore: 4,
        baseRelevance: 82,
      },
      {
        id: "fl-review",
        title: "第三方测评：FocusLab 工具好用吗？",
        url: "www.toolbench.cn/reviews/focuslab",
        staticLead: "近期不少读者在评论区留言希望我们对比市面上几款热门专注工具，于是编辑部花了两周时间在 Mac、Windows 与 iPhone 上逐项试用，记录下界面观感、免费额度、离线体验与导出格式等细节，写成这篇不带厂商赞助的个人使用笔记供大家参考。",
        body: "独立编辑对 FocusLab 官网功能的实测体验，对比界面简洁度、移动端同步与离线可用性，并列出适合自习者与不适合重度项目管理团队的边界。",
        tags: ["第三方测评", "功能对比"],
        extraNoiseTags: ["体验", "专栏", "评分", "评论"],
        thumb: "shapes",
        dateScore: 5,
        baseRelevance: 64,
      },
      {
        id: "fl-paper",
        title: "FocusLab 2025 专注力实验白皮书（PDF）",
        url: "www.focuslab.com/reports/2025",
        staticLead: "本年度汇总报告由开放社区志愿者协同校对，所有原始表格均按知识共享协议公开，欢迎教育工作者与独立研究者自由引用。文档共分六个章节，涵盖样本招募背景、问卷设计修订记录与附录图表说明，文件体积约 4.2 MB。",
        body: "汇总 FocusLab 年度公开数据与实验观察，含环境干扰测试方法与可复现模板下载，支持在线目录跳转与原始 CSV 附表获取。",
        tags: ["白皮书", "开放数据"],
        extraNoiseTags: ["年度", "PDF", "下载", "资料"],
        thumb: "doc",
        dateScore: 3,
        baseRelevance: 72,
      },
      {
        id: "fl-video",
        title: "FocusLab 三分钟上手演示视频",
        url: "www.videohub.cn/watch/focuslab-tour",
        staticLead: "本期视频由社区创作者录制，带你从零体验新版本桌面端与手机端的协同设置，片尾还附带了作者自己常用的键盘快捷键清单与午休配色方案。视频提供中英双语字幕与章节时间轴，方便按需拖动跳转到对应画面。",
        body: "演示如何进入 FocusLab 官网并配置首次专注计时与周报回顾，适合初次接触的新手在三分钟内完成基础环境设置。",
        tags: ["入门视频", "操作演示"],
        extraNoiseTags: ["教程", "演示", "播单", "社区"],
        thumb: "video",
        dateScore: 1,
        baseRelevance: 60,
      },
    ],
  },
  academic: {
    id: "academic",
    label: "学术型 · 查实证",
    intent: "informational",
    intentLabel: "学术调研查询",
    defaultQuery: "番茄工作法 实证",
    totalFound: "约 3,840,000 个结果",
    latency: "0.41 秒",
    optimalRange: [48, 102],
    adCard: {
      id: "ad-acad",
      isAd: true,
      title: "【推广】智能桌面实体番茄钟 · 静音磁吸款",
      url: "ad.deskgear.example/timer",
      staticLead: "极简铝合金外壳配旋转刻度，适合书房与工位摆拍，下单即赠编织数据线与桌面硅胶垫，多色现货当日发出并支持七天无理由退换。",
      body: "极简铝合金外壳配旋转刻度，适合书房与工位摆拍，支持倒计时震动提醒与多色可选，含桌面磁吸支架配件。",
      tags: ["硬件推广", "桌面好物"],
      thumb: "shapes",
      dateScore: 5,
      baseRelevance: 15,
    },
    docs: [
      {
        id: "acad-study",
        title: "番茄工作法与自定节奏的实证对照研究",
        url: "www.researchhub.edu/papers/pomodoro-rct",
        staticLead: "高校学习支持中心在秋季学期招募了多所院系的本科生参与为期四周的观察项目，研究团队首先介绍了课程背景、伦理审批流程、参与者人口学分布与日常自习室环境记录方式，以便后续章节展开正式实验设计与数据讨论。",
        body: "通过随机分组实证检验番茄工作法对任务启动拖延与主观疲劳的影响：固定短休组在持续自习中的分心频次更低，但深度编码任务更适配弹性分段。文内提供效应量、置信区间与四周随访流失率对照。",
        tags: ["对照实验", "实证数据", "番茄工作法"],
        extraNoiseTags: ["论文", "样本", "统计", "附录"],
        thumb: "doc",
        dateScore: 2,
        baseRelevance: 97,
      },
      {
        id: "acad-switch",
        title: "任务中断与注意力残留的实证综述",
        url: "www.cogjournal.org/attention-residue",
        staticLead: "组织行为学长期关注办公室多任务协作环境下的认知负荷变化，自个人电脑与即时通讯软件普及以来，研究者从日程日志到实验室反应时测试积累了大量跨学科观察资料，本文开头先梳理相关术语在不同学派中的演变历程。",
        body: "综述任务切换引发的注意力残留效应实证研究，说明短周期番茄工作法若在心流高峰强制响铃，反而会制造额外切换成本。作者总结了不同任务复杂度下适合延长单段专注窗口的实证条件。",
        tags: ["注意力残留", "实证综述"],
        extraNoiseTags: ["心理学", "文献", "引用", "综述"],
        thumb: "mountain",
        dateScore: 4,
        baseRelevance: 86,
      },
      {
        id: "acad-guide",
        title: "番茄工作法：提高专注力的时间管理术",
        url: "www.tomatotimer.com/technique",
        staticLead: "很多入门读者第一次听说这个方法，都是从一枚红色厨房计时器开始的。在过去二十年里，它因为上手几乎零门槛而广受学生和自由职业者喜爱，本期入门专题先从创建纸笔清单与摆放书桌这些准备动作讲起。",
        body: "介绍番茄工作法的基础步骤与常见误区，帮助日常学习者建立 25 分钟单任务节奏，但未附临床或对照实证统计，更适合作为实操入门清单而非研究文献引用。",
        tags: ["入门方法", "步骤拆解"],
        extraNoiseTags: ["指南", "科普", "习惯", "工具"],
        thumb: "video",
        dateScore: 5,
        baseRelevance: 74,
      },
      {
        id: "acad-review",
        title: "专注力训练的科学研究综述",
        url: "www.researchhub.edu/attention-review",
        staticLead: "本综述面向教育与人机交互研究者，系统归档近十年公开发表的干预评估，前言部分详细列出了数据库检索策略、文献纳入与排除标准以及两位评审员之间的一致性检验流程，确保检索过程透明可查。",
        body: "从实证角度对比时间分段法、环境降噪与认知训练三类专注力方案的可复现效果，附样本量、干预周期与随访衰减汇总表，便于快速核查证据等级。",
        tags: ["研究综述", "效果对比"],
        extraNoiseTags: ["方法学", "开放获取", "目录", "期刊"],
        thumb: "profile",
        dateScore: 3,
        baseRelevance: 82,
      },
      {
        id: "acad-apps",
        title: "8 款极简番茄计时器功能横评",
        url: "www.appdigest.cn/pomodoro-timers",
        staticLead: "我们在桌面端与移动端分别安装了八款高评分计时应用，记录界面与提醒音表现，并对图标美感、深色主题支持度、订阅价格以及桌面小组件自定义程度进行了逐一打分，适合正准备挑一款顺手计时工具的读者。",
        body: "横向对比常见番茄计时器软件的跨平台同步、白噪音与统计图表功能，侧重工具选购而非实证机制，不涉及实验数据评估。",
        tags: ["工具清单", "软件横评"],
        extraNoiseTags: ["效率", "下载", "榜单", "测评"],
        thumb: "shapes",
        dateScore: 1,
        baseRelevance: 58,
      },
    ],
  },
};

export const INITIAL_STATE = {
  scenarioId: "poster",
  query: SCENARIOS.poster.defaultQuery,
  priority: "date",        // "date" | "relevance" | "ad-hijack" | "all-featured"
  hierarchy: "flat",       // "flat" | "poster" | "breadcrumb"
  match: "none",           // "none" | "kwic" | "kwic-tags" | "over"
  rhythm: "chaotic",       // "chaotic" | "featured-uniform" | "compact-text"
  snippetChars: 148,       // 0..155, dragged by 2D Canvas scrubber
  pinnedId: null,          // user can pin any doc to #1 to test priority!
  lastClickedId: null,
};

export const PRESETS = {
  broken: {
    priority: "date",
    hierarchy: "flat",
    match: "none",
    rhythm: "chaotic",
    snippetChars: 148,
    pinnedId: null,
  },
  posterSolution: {
    priority: "relevance",
    hierarchy: "poster",
    match: "kwic-tags",
    rhythm: "featured-uniform",
    snippetChars: 68,
    pinnedId: null,
  },
  breadcrumbSolution: {
    priority: "relevance",
    hierarchy: "breadcrumb",
    match: "kwic",
    rhythm: "featured-uniform",
    snippetChars: 60,
    pinnedId: null,
  },
  navCompactSolution: {
    priority: "relevance",
    hierarchy: "breadcrumb",
    match: "kwic",
    rhythm: "compact-text",
    snippetChars: 34,
    pinnedId: null,
  },
};

// 从用户输入中提取有意义的检索词（中英兼容，不依赖外部库）
const STOP_WORDS = new Set(["如何", "怎么", "什么", "哪些", "的", "了", "吗", "与", "和", "及", "在", "是", "对", "the", "and", "for", "how", "to"]);
const NOISE_WORDS = ["的", "与", "和", "在", "你", "中", "方法", "时间", "管理", "帮助", "系统", "日常", "工具", "研究", "官网", "功能", "提供", "包括", "常见", "通过", "支持"];

export function tokenizeQuery(raw) {
  const clean = (raw || "").trim();
  if (!clean) return [];
  const pieces = clean.split(/[\s,，。？?！!：:、/+]+/).filter(Boolean);
  const tokens = [];
  const knownTerms = [
    "专注力", "注意力", "番茄工作法", "番茄", "时间管理", "环境管理", "训练", "习惯",
    "原因", "分心", "科学", "综述", "实证", "提高", "提升", "技巧", "方法",
    "focuslab", "官网", "入口", "登录", "帮助", "测评", "白皮书", "视频",
    "对照", "心流", "残留", "计时器", "中断",
  ];
  const lower = clean.toLowerCase();
  for (const term of knownTerms) {
    if (lower.includes(term) && !tokens.includes(term)) tokens.push(term);
  }
  for (const p of pieces) {
    const lp = p.toLowerCase();
    if (lp.length >= 2 && !STOP_WORDS.has(lp) && !tokens.includes(lp)) {
      if (lp.length <= 6) tokens.push(lp);
      else if (tokens.length === 0) {
        for (let i = 0; i <= lp.length - 2; i += 2) {
          const sub = lp.slice(i, i + 2);
          if (!STOP_WORDS.has(sub) && !tokens.includes(sub)) tokens.push(sub);
        }
      }
    }
  }
  if (!tokens.length && clean.length >= 1) tokens.push(clean.toLowerCase());
  return tokens.slice(0, 6);
}

export function scoreDoc(doc, tokens) {
  if (!tokens.length) return { score: doc.baseRelevance, hits: 0 };
  const tLow = doc.title.toLowerCase();
  const bLow = doc.body.toLowerCase();
  const uLow = doc.url.toLowerCase();
  const tagLow = doc.tags.join(" ").toLowerCase();
  let matchPoints = 0;
  let hits = 0;
  for (const tok of tokens) {
    if (tLow.includes(tok)) { matchPoints += 24; hits += 2; }
    if (bLow.includes(tok)) { matchPoints += 12; hits += 1; }
    if (uLow.includes(tok)) { matchPoints += 14; hits += 1; }
    if (tagLow.includes(tok)) { matchPoints += 8; hits += 1; }
  }
  // 结合基础语义权重与实时词法匹配
  const score = Math.min(99, Math.round(doc.baseRelevance * 0.42 + Math.min(58, matchPoints)));
  return { score, hits };
}

// 统一摘句与高亮切分（供 DOM 卡片与 2D Canvas 游标尺共同消费）
export function buildSnippet(doc, tokens, snippetChars, matchMode) {
  const maxC = Math.max(0, Math.min(155, Math.round(snippetChars)));
  const source = matchMode === "none" ? doc.staticLead : doc.body;
  if (maxC <= 0) {
    return { text: "", segments: [], hitCount: 0, highlightedChars: 0, highlightRatio: 0, isDynamic: matchMode !== "none" };
  }
  let text = source;
  if (matchMode !== "none" && tokens.length && source.length > maxC) {
    // 找首个查询词命中位置，把摘句窗口居中覆盖到命中点
    const low = source.toLowerCase();
    let bestIdx = -1;
    for (const tok of tokens) {
      const idx = low.indexOf(tok);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx;
    }
    if (bestIdx > Math.floor(maxC * 0.45)) {
      const start = Math.max(0, bestIdx - Math.floor(maxC * 0.25));
      const slice = source.slice(start, start + maxC);
      text = (start > 0 ? "…" : "") + slice + (start + maxC < source.length ? "…" : "");
    } else {
      text = source.slice(0, maxC) + (source.length > maxC ? "…" : "");
    }
  } else {
    text = source.slice(0, maxC) + (source.length > maxC ? "…" : "");
  }

  if (matchMode === "none" || !text) {
    return {
      text,
      segments: text ? [{ text, mark: false }] : [],
      hitCount: 0,
      highlightedChars: 0,
      highlightRatio: 0,
      isDynamic: false,
    };
  }

  const markTerms = matchMode === "over" ? [...tokens, ...NOISE_WORDS] : tokens;
  const escaped = markTerms
    .filter((w) => w.length >= 1)
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) {
    return { text, segments: [{ text, mark: false }], hitCount: 0, highlightedChars: 0, highlightRatio: 0, isDynamic: true };
  }
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const rawParts = text.split(re).filter(Boolean);
  let hitCount = 0;
  let highlightedChars = 0;
  const segments = rawParts.map((part) => {
    const low = part.toLowerCase();
    const isQueryHit = tokens.some((t) => t === low);
    const isNoiseHit = matchMode === "over" && NOISE_WORDS.some((w) => w === low);
    const mark = isQueryHit || isNoiseHit;
    if (isQueryHit) hitCount++;
    if (mark) highlightedChars += part.length;
    return { text: part, mark, kind: isQueryHit ? "query" : isNoiseHit ? "noise" : "plain" };
  });
  const plainLen = Math.max(1, text.replace(/[…\s]/g, "").length);
  return {
    text,
    segments,
    hitCount,
    highlightedChars,
    highlightRatio: highlightedChars / plainLen,
    isDynamic: true,
  };
}

// 估算单张结果卡在桌面首屏中的视觉像素高度（用于统一计算「首屏可见条数」与画布截断线）
export function estimateCardHeight(card, state, isFirst) {
  const charsPerLine = state.rhythm === "compact-text" ? 42 : 30;
  const snipLines = state.snippetChars <= 0 ? 0 : Math.max(1, Math.ceil(Math.min(card.snippet.text.length, state.snippetChars) / charsPerLine));
  const titleH = state.hierarchy === "flat" ? 20 : (isFirst && state.rhythm === "featured-uniform" ? 26 : 23);
  const urlH = 18;
  const snipH = snipLines * 20;
  const hasTags = (state.match === "kwic-tags" || state.match === "over") && (isFirst || state.match === "over" || state.priority === "all-featured");
  const tagH = hasTags ? (state.match === "over" ? 50 : 28) : 0;
  const pad = isFirst && state.rhythm === "featured-uniform" ? 30 : 22;
  const chaosBump = state.rhythm === "chaotic" ? (card.chaosExtra || 16) : 0;
  return titleH + urlH + snipH + tagH + pad + chaosBump;
}

export function evaluate(state) {
  const sc = SCENARIOS[state.scenarioId] || SCENARIOS.poster;
  const tokens = tokenizeQuery(state.query);
  const scored = sc.docs.map((d, idx) => {
    const { score, hits } = scoreDoc(d, tokens);
    return { ...d, relevanceScore: score, tokenHits: hits, chaosExtra: (idx % 2 === 0 ? 22 : 10) };
  });

  // 真实最佳匹配文档（忽略广告与乱序）
  const byRelevance = [...scored].sort((a, b) => b.relevanceScore - a.relevanceScore || b.baseRelevance - a.baseRelevance);
  const bestDoc = byRelevance[0];
  const zeroMatch = tokens.length > 0 && byRelevance.every((d) => d.tokenHits === 0);

  let ordered;
  if (state.priority === "date") {
    ordered = [...scored].sort((a, b) => b.dateScore - a.dateScore);
  } else {
    ordered = [...byRelevance];
  }

  // 用户主动点了某卡的「↑ 置顶」
  if (state.pinnedId) {
    const idx = ordered.findIndex((d) => d.id === state.pinnedId);
    if (idx > 0) {
      const [picked] = ordered.splice(idx, 1);
      ordered.unshift(picked);
    }
  }

  // 广告劫持首位模式
  if (state.priority === "ad-hijack") {
    const ad = { ...sc.adCard, relevanceScore: sc.adCard.baseRelevance, tokenHits: 0, chaosExtra: 14 };
    ordered = [ad, ...ordered.slice(0, 4)];
  }

  // 为每张卡生成单真源摘要与高度
  const cards = ordered.map((d, i) => {
    const snippet = buildSnippet(d, tokens, state.snippetChars, state.match);
    const featured =
      state.priority === "all-featured" ||
      (i === 0 && (state.priority === "relevance" || state.priority === "ad-hijack") && state.rhythm !== "chaotic");
    const c = { ...d, rank: i + 1, featured, snippet };
    c.estHeight = estimateCardHeight(c, state, i === 0);
    return c;
  });

  const bestIndex = cards.findIndex((c) => c.id === bestDoc.id);
  const bestRank = bestIndex >= 0 ? bestIndex + 1 : 99;

  // 计算首屏（~510px 结果可见区）可容纳条数
  const VIEWPORT_LIST_H = 510;
  let accH = 0;
  let foldCount = 0;
  const cardTops = [];
  for (const c of cards) {
    cardTops.push(accH);
    const h = c.estHeight + 12;
    if (accH + h <= VIEWPORT_LIST_H) {
      foldCount += 1;
    } else if (accH < VIEWPORT_LIST_H) {
      foldCount += (VIEWPORT_LIST_H - accH) / h;
    }
    accH += h;
  }
  foldCount = Math.round(foldCount * 10) / 10;

  // 视觉层级比（标题字号 / 摘要字号）
  const titleRatio = state.hierarchy === "flat" ? 1.03 : 1.43;
  // 首位区分比（首位与次位的视觉权重差）
  const topContrast =
    state.priority === "all-featured"
      ? 1.0
      : state.rhythm === "chaotic"
      ? 1.04
      : state.rhythm === "compact-text"
      ? 1.24
      : 1.48;

  // 平均高亮比例与前三名查询词可见命中数
  const top3 = cards.slice(0, 3);
  const avgHighlightRatio =
    top3.reduce((s, c) => s + c.snippet.highlightRatio, 0) / Math.max(1, top3.length);
  const visibleScentHits = top3.reduce((s, c) => s + c.snippet.hitCount, 0);

  // 10 类精确诊断规则
  const [optMin, optMax] = sc.optimalRange;
  const issues = [];

  if (state.priority === "ad-hijack") {
    issues.push({
      code: "ad_hijack",
      pillar: "priority",
      severity: 100,
      badge: "首位劫持",
      headline: "低相关推广占了首位红框，真答案被挤下去",
      why: "眼动研究（Granka 等, 2004）表明搜索者把大部分首屏注视留在前两条。给无关推广套上首位红框和星标，会直接透支整页排序公信力。",
      fixHint: "把「排序策略」切到「相关性排位」，把首位视觉权重留给匹配度最高的结果。",
    });
  } else if (bestRank > 1) {
    issues.push({
      code: "relevance_buried",
      pillar: "priority",
      severity: 95,
      badge: `首位埋没 · 第 ${bestRank} 位`,
      headline: `最相关结果掉在第 ${bestRank} 位，开头被弱匹配占满`,
      why: `当前查询「${state.query || sc.defaultQuery}」的最高相关文档《${bestDoc.title.slice(0, 12)}…》没排在第 1 位。用户扫过前两条没看到直接答案，往往会误判站内搜不到而提前离开。`,
      fixHint: "把「排序策略」切到「相关性排位」，或直接点目标卡片上的「↑ 置顶」。",
    });
  } else if (state.priority === "all-featured") {
    issues.push({
      code: "everyone_featured",
      pillar: "priority",
      severity: 86,
      badge: "全员红框 · 1.0×",
      headline: "五条结果全都套红框加星标，反而谁也不突出",
      why: "视觉突出依赖稀缺差值。当所有卡片都用同款焦陶红框与星标时，主次权重比跌回 1.0×，扫描入口消失。",
      fixHint: "把「排序策略」切回「相关性排位」，只强化第 1 条最相关结果。",
    });
  }

  if (state.hierarchy === "flat") {
    issues.push({
      code: "flat_hierarchy",
      pillar: "hierarchy",
      severity: 90,
      badge: "层级拉平 · 1.03×",
      headline: "标题、网址与摘要挤成一片灰字，眼睛抓不住入口",
      why: "标题与摘要字号比仅 1.03× 且失去钴蓝/网址绿的语义色差。扫描者必须逐行精读，才能辨认哪一行能点、指向哪家来源。",
      fixHint: "把「层级顺序」切到「标题 > 链接 > 摘要（原海报）」或「链接面包屑置顶」。",
    });
  }

  if (state.match === "none") {
    issues.push({
      code: "no_query_scent",
      pillar: "scent",
      severity: 84,
      badge: "信息气味缺失",
      headline: "摘要放的是静态开头废话，看不出为什么匹配",
      why: "Tombros 与 Sanderson（1998）实证：固定首段摘要不包含查询词上下文，用户无法在点击前判断相关性，只能盲点试错。",
      fixHint: "把「匹配反馈」切到「关键词高亮」或「高亮 + 标签」，让查询词上下文直接浮现。",
    });
  } else if (state.match === "over") {
    issues.push({
      code: "over_highlighted",
      pillar: "scent",
      severity: 82,
      badge: `过度涂亮 · ${Math.round(avgHighlightRatio * 100)}%`,
      headline: `超过 ${Math.round(avgHighlightRatio * 100)}% 的字被标亮，焦点被噪点淹没`,
      why: "把泛词和过多无关标签一起上色后，高亮失去了「指向查询命中」的筛选价值，视线在色块间反复受阻。",
      fixHint: "把「匹配反馈」改回「关键词高亮」或「高亮 + 标签」，只突出与当前搜索词相关的词。",
    });
  }

  if (state.snippetChars < optMin) {
    issues.push({
      code: "snippet_starved",
      pillar: "scent",
      severity: 80,
      badge: `摘要过空 · ${state.snippetChars} 字`,
      headline: `摘要被压到 ${state.snippetChars} 字，几乎只剩孤立标题`,
      why: sc.intent === "navigational"
        ? "哪怕是导航型查询，保留约 20–50 字来源说明仍能帮助核对是不是官方入口，完全清空容易误点仿站。"
        : "信息型查询需要约 44–94 字的查询上下文来建立「信息气味」（Pirolli & Card, 1999），太短会让每条结果看起来都差不多。",
      fixHint: `向右拖动摘要游标尺到 ${optMin}–${optMax} 字经验舒适带。`,
    });
  } else if (state.snippetChars > optMax) {
    if (sc.intent === "navigational") {
      issues.push({
        code: "nav_overloaded",
        pillar: "scent",
        severity: 83,
        badge: `导航冗长 · ${state.snippetChars} 字`,
        headline: `找官网时铺 ${state.snippetChars} 字长摘要，反而拖慢直达速度`,
        why: "Cutrell 与 Guan（CHI 2007）眼动实验证实：导航型搜索的目标是迅速核对域名并点击，拉长摘要会显著延长扫视耗时。",
        fixHint: `当前是导航型查询，把摘要游标尺向左拉回 ${optMin}–${optMax} 字，并可试试「纯文紧凑」卡片。`,
      });
    } else {
      issues.push({
        code: "snippet_bloated",
        pillar: "scent",
        severity: 81,
        badge: `首屏挤爆 · 仅 ${foldCount} 条`,
        headline: `摘要撑到 ${state.snippetChars} 字，首屏只能挤下约 ${foldCount} 条`,
        why: "单条结果一旦膨胀成四五行段落墙，第 2、3 条候选立刻被挤出首屏，读者失去同屏横向比较的视野。",
        fixHint: `向左拖动摘要游标尺到 ${optMin}–${optMax} 字，让首屏稳稳露出 3–4 条结果。`,
      });
    }
  }

  if (state.rhythm === "chaotic") {
    issues.push({
      code: "inconsistent_cards",
      pillar: "rhythm",
      severity: 76,
      badge: "卡片节奏乱跳",
      headline: "缩略图忽左忽右、高度参差，垂直扫描线被扯断",
      why: "搜索列表靠一致的左侧对齐基准线支撑高速纵扫。图文左右跳位迫使眼睛每条重新找标题起点，认知负荷大增。",
      fixHint: "把「卡片节奏」切到「首位强化 + 统一结构」或「纯文紧凑」，拉直标题左基准线。",
    });
  }

  // 四项原海报底座状态
  const pillarMap = {
    priority: !issues.some((x) => x.pillar === "priority"),
    hierarchy: !issues.some((x) => x.pillar === "hierarchy"),
    scent: !issues.some((x) => x.pillar === "scent"),
    rhythm: !issues.some((x) => x.pillar === "rhythm"),
  };
  const passedCount = Object.values(pillarMap).filter(Boolean).length;

  issues.sort((a, b) => b.severity - a.severity);
  const topIssue = issues[0] || null;

  // 多组合法解判定
  let solutionLabel = "";
  if (passedCount === 4) {
    if (sc.intent === "navigational" && state.rhythm === "compact-text") {
      solutionLabel = "导航紧凑直达解";
    } else if (state.hierarchy === "breadcrumb") {
      solutionLabel = "现代面包屑优先解";
    } else if (state.hierarchy === "poster" && state.match === "kwic-tags" && state.rhythm === "featured-uniform") {
      solutionLabel = "原海报经典解";
    } else {
      solutionLabel = "清晰高找寻解";
    }
  }

  // 注意力权重分配示意（供 2D Canvas 柱图与扫描轨共用，显式标「示意」）
  const attentionShares = cards.map((c, i) => {
    const base = [42, 24, 15, 11, 8][i] || 6;
    const flatMod = state.priority === "all-featured" || state.rhythm === "chaotic" ? 0.72 : 1;
    const foldMod = cardTops[i] < VIEWPORT_LIST_H ? 1 : 0.35;
    const raw = base * (i === 0 ? flatMod : 1 + (1 - flatMod) * 0.4) * foldMod;
    return Math.round(raw);
  });
  const sumAtt = attentionShares.reduce((a, b) => a + b, 0) || 1;
  const attentionPct = attentionShares.map((v) => Math.round((v / sumAtt) * 100));

  return {
    scenario: sc,
    tokens,
    cards,
    bestDoc,
    bestRank,
    zeroMatch,
    foldCount,
    titleRatio,
    topContrast,
    avgHighlightRatio,
    visibleScentHits,
    optimalRange: sc.optimalRange,
    cardTops,
    viewportListHeight: VIEWPORT_LIST_H,
    attentionPct,
    pillarMap,
    passedCount,
    issues,
    topIssue,
    solutionLabel,
  };
}

// ---------- Section 01: 四层解剖数据 ----------
export const ANATOMY_LAYERS = [
  {
    id: "title",
    no: "01",
    name: "标题 Title",
    en: "PRIMARY ANCHOR",
    ratio: "字号 1.4× · 深钴蓝 #1E3E78",
    timing: "第 1 落眼点（~0.2 秒）",
    rule: "标题是搜索结果里唯一的视觉主锚。用深钴蓝与粗字重把它从正文里提出来，让眼睛沿着左缘垂直掠过时，只扫标题就能刷掉一半无关项。",
    pitfall: "忌把标题和摘要做成同号灰字，或放超过 32 字的营销长句导致换行截断核心词。",
  },
  {
    id: "url",
    no: "02",
    name: "链接 / 面包屑 URL",
    en: "TRUST & SOURCE",
    ratio: "等宽小字 · 植物绿 #275A3A",
    timing: "第 2 核验点（~0.4 秒）",
    rule: "域名与路径承担「来源可信度」和「页面类型判断」：.edu 代表学术机构，/guide 提示完整教程。用植物绿或低饱和等宽字独立成行，不和蓝色标题抢焦点。",
    pitfall: "忌把一长串带随机参数（?utm_source=...）的生原始网址直接吐给用户，应裁成清晰面包屑。",
  },
  {
    id: "snippet",
    no: "03",
    name: "动态摘要 Snippet",
    en: "QUERY-BIASED SCENT",
    ratio: "44–94 字 · 2 行经验带",
    timing: "第 3 判别点（~0.8 秒）",
    rule: "摘要不是文章开头导语，而是围绕查询词动态裁出来的「相关性证据」。命中词局部加粗着色后，用户不用点进正文就知道这篇是否回答了自己的问题。",
    pitfall: "信息型太短（<20 字）缺依据；超过 3 行（>115 字）则把后续候选挤出首屏。",
  },
  {
    id: "meta",
    no: "04",
    name: "标签与缩略图 Meta",
    en: "SCANNABLE CUES",
    ratio: "2–4 枚淡蓝签 · 右置缩略图",
    timing: "第 4 辅助点（可选扫视）",
    rule: "辅助标签压缩子主题，右侧缩略图承担内容形态提示（图文、视频播放键、学术文档）。把图固定在右侧，是为了绝不打断左侧标题的垂直对齐基准线。",
    pitfall: "忌堆 6 枚以上高饱和彩签，或左右交替放缩略图把左对齐线切碎。",
  },
];

// ---------- Section 03: 动态摘句 KWIC 对比数据 ----------
export const KWIC_CORPUS = {
  sourceTitle: "如何提高专注力：科学方法与实用技巧（原文节选）",
  fullParagraph:
    "欢迎阅读 FocusLab 认知效率专栏。我们在过去三年跟踪记录了多类学习与办公环境中的注意力波动。关于专注力原理，工作记忆容量有限，频繁切换任务会产生注意力残留；在环境优化上，关闭手机锁屏弹窗并清理桌面杂物能明显降低分心频次。若你想用番茄工作法建立起步节奏，建议以 25 分钟单任务投入搭配 5 分钟离座休息。需要核对账号与工具入口时，请直接访问 FocusLab 官网登录页进入个人仪表盘。对于希望查阅实证综述的读者，文末附有近十年对照实验与样本局限汇总表。",
  queries: [
    {
      id: "principle",
      label: "专注力原理",
      intent: "informational",
      tokens: ["专注力原理", "工作记忆", "注意力"],
      staticText: "欢迎阅读 FocusLab 认知效率专栏。我们在过去三年跟踪记录了多类学习与办公环境中的注意力波动。",
      kwicText: "…关于专注力原理，工作记忆容量有限，频繁切换任务会产生注意力残留；在环境优化上，关闭弹窗可降分心…",
      note: "信息型查询下，动态摘句直接跳到原文第 3 句，把「专注力原理」「工作记忆」端到眼前，静态首段却还在寒暄。",
    },
    {
      id: "pomodoro",
      label: "番茄工作法 节奏",
      intent: "informational",
      tokens: ["番茄工作法", "节奏", "25 分钟"],
      staticText: "欢迎阅读 FocusLab 认知效率专栏。我们在过去三年跟踪记录了多类学习与办公环境中的注意力波动。",
      kwicText: "…若你想用番茄工作法建立起步节奏，建议以 25 分钟单任务投入搭配 5 分钟离座休息…",
      note: "同一篇长文，换了搜索词，摘要就应该跟着换片段——这正是 Tombros & Sanderson（1998）证明的核心价值。",
    },
    {
      id: "login",
      label: "官网登录 入口",
      intent: "navigational",
      tokens: ["官网登录", "入口", "FocusLab"],
      staticText: "欢迎阅读 FocusLab 认知效率专栏。我们在过去三年跟踪记录了多类学习与办公环境中的注意力波动。",
      kwicText: "…请直接访问 FocusLab 官网登录页进入个人仪表盘。",
      note: "导航型查询（Cutrell & Guan, 2007）：用户只想知道「是不是这个入口」，24 字短摘句比 90 字长摘要更快完成点击。",
    },
    {
      id: "review",
      label: "实证综述 对照实验",
      intent: "informational",
      tokens: ["实证综述", "对照实验", "样本"],
      staticText: "欢迎阅读 FocusLab 认知效率专栏。我们在过去三年跟踪记录了多类学习与办公环境中的注意力波动。",
      kwicText: "…对于希望查阅实证综述的读者，文末附有近十年对照实验与样本局限汇总表。",
      note: "专业用户靠摘要确认文内是否真有「对照实验与样本表」，省去点开 5 篇泛泛科普的时间。",
    },
  ],
};

// ---------- Section 04: 历史演进五代标本 ----------
export const ERAS = [
  {
    id: "1995",
    year: "1995",
    title: "纯文本全文索引",
    ref: "AltaVista 等早期引擎",
    summary: "从人工分类目录（如 1994 年 Yahoo!）跨入全文索引，页面几乎只有密集的编号、蓝色超链接和文件字节数，没有查询词动态摘句。",
    layoutNote: "单列纯文本 · 静态前两行 · 无缩略图与主次区分",
    items: [
      { title: "1. FocusLab - Guide to Concentration", url: "http://www.focuslab.com/guide.htm", desc: "Last modified 12-Nov-95 - page size 14K - in English", meta: "静态文档头" },
      { title: "2. Ten Daily Habits for Work", url: "http://www.dailyhabits.com/10.htm", desc: "Welcome to our personal homepage. Updated weekly.", meta: "无查询高亮" },
      { title: "3. Attention Research Archive", url: "http://www.researchhub.edu/idx.htm", desc: "Index of /attention - parent directory...", meta: "信息气味弱" },
    ],
  },
  {
    id: "1998",
    year: "1998",
    title: "十条蓝链与动态摘句",
    ref: "Brin & Page (WWW7) · Tombros & Sanderson (SIGIR '98)",
    summary: "PageRank 让相关度大幅跃升，极简「蓝标题 + 绿网址 + 黑灰动态摘句」确立了延续二十余年的四层黄金语法，命中词加粗成为标配。",
    layoutNote: "严格左对齐 · 经典蓝绿灰三色层级 · KWIC 加粗",
    items: [
      { title: "如何提高专注力：科学方法与实用技巧", url: "www.focuslab.com/guide", desc: "系统介绍专注力的原理与训练方法，包含环境管理与注意力训练…", meta: "命中词加粗" },
      { title: "提升专注力的 10 个简单习惯", url: "www.dailyhabits.com/article/10-tips", desc: "从日常习惯出发，分享 10 个容易实践的专注力改善方法…", meta: "线性 F 型纵扫" },
      { title: "番茄工作法：提高专注力的时间管理术", url: "www.tomatotimer.com/technique", desc: "通过番茄工作法的原理与步骤，管理时间与注意力…", meta: "一致行节奏" },
    ],
  },
  {
    id: "2007",
    year: "2007",
    title: "通用混排（Universal Search）",
    ref: "Google Searchology（2007 年 5 月）· Cutrell & Guan (CHI '07)",
    summary: "网页、图片、视频、地图与新闻不再被关在各自标签页里，而是按用户意图混排进同一张结果页，视觉异质性第一次打破纯文字均匀列表。",
    layoutNote: "跨媒体混排 · 视频/图集横向插入 · 需按意图控制摘要密度",
    items: [
      { title: "如何提高专注力：科学方法与实用技巧", url: "www.focuslab.com/guide", desc: "系统介绍专注力的原理与训练方法，包含环境管理与时间管理…", meta: "网页指南" },
      { title: "▶ 视频：番茄工作法 25 分钟实战演示（04:18）", url: "video.tomatotimer.com/demo", desc: "【缩略图混排】图文与视频按相关性直接穿插主列表", meta: "视频结果" },
      { title: "专注力训练的科学研究综述 [PDF]", url: "www.researchhub.edu/attention-review", desc: "学术文献标识 [PDF] 帮助用户在点击前预判格式", meta: "学术文档" },
    ],
  },
  {
    id: "2014",
    year: "2014+",
    title: "首位精选卡与面包屑",
    ref: "Rich Snippets & Featured Card",
    summary: "移动端崛起后，整条卡片成为点击区，首位最相关答案被提拔为精选摘要卡（如 286 原海报的红框星标首位），结构化标签与面包屑替代生硬 URL。",
    layoutNote: "首位视觉提权 · 标签化关键词 · 统一卡片容器",
    items: [
      { title: "★ 如何提高专注力：科学方法与实用技巧", url: "focuslab.com › 指南 › 专注力", desc: "系统介绍专注力的原理与训练方法…… [专注力原理] [环境优化] [时间管理]", meta: "首位精选卡", featured: true },
      { title: "提升专注力的 10 个简单习惯", url: "dailyhabits.com › 专栏 › 习惯", desc: "从日常习惯出发，分享 10 个容易实践的改善方法。", meta: "统一标准卡" },
      { title: "专注力差的原因有哪些？", url: "mindhelp.cn › 问答 › 分心", desc: "解析影响专注力的常见因素，并提供针对性建议。", meta: "统一标准卡" },
    ],
  },
  {
    id: "2019",
    year: "2019+",
    title: "多维筛选与弹球扫描时代",
    ref: "NN/g Pinball Pattern (2019) · Faceted SERP",
    summary: "当结果页叠加精选直答、相关追问、右侧实体框与筛选芯片时，NN/g 眼动研究发现视线不再线性下扫，而是在强信号卡片间来回弹跳；节制视觉噪点变得比堆功能更难。",
    layoutNote: "筛选条 + 精选卡 + 节制侧栏 · 防弹球失焦",
    items: [
      { title: "筛选：[全部] [科学指南] [视频] [学术 PDF] · 排序：相关性", url: "分面过滤栏（缩小集合，降低翻页成本）", desc: "把筛选前置到结果列表顶部，让用户先收窄范围再精细扫读。", meta: "分面导航" },
      { title: "★ 如何提高专注力：科学方法与实用技巧", url: "focuslab.com › 指南 › 专注力", desc: "系统介绍专注力的原理与训练方法，含环境与时间管理清单。", meta: "克制焦点", featured: true },
      { title: "大家还在搜：番茄钟适合编程吗？ / 午后犯困怎么办？", url: "相关查询折叠条", desc: "提供零门槛二次改写查询的阶梯，但不压过主结果层级。", meta: "改写阶梯" },
    ],
  },
];

// ---------- Section 05: 场景分诊器 ----------
export const TRIAGE_CASES = [
  {
    id: "docs",
    tag: "知识库 / 医学文档",
    brief: "医生输入症状与药名，需要在数百份临床指南里核对配伍禁忌并溯源到具体条文。",
    verdict: "强烈推荐：标准搜索结果布局",
    verdictKind: "use",
    why: "用户带着明确查询意图，需要高信息气味的查询词动态摘句（KWIC）、清晰来源网址/发布年份以及高相关首位置顶，便于快速交叉核对多个权威出处。",
    alt: "配左侧分面筛选（科室、年份、证据等级），禁用瀑布流或无摘要纯标题。",
  },
  {
    id: "photos",
    tag: "无版权摄影素材库",
    brief: "平面设计师搜「秋日松林 晨雾」，靠第一眼构图与色调挑一张配图，不看长摘要。",
    verdict: "改用：画廊布局 / 瀑布流页面",
    verdictKind: "avoid",
    why: "图片挑选是并行视觉比较，文字标题和两行摘要反而浪费屏效。强行用横向文字列表卡，一次只能看三四张缩略图，效率远低于高密度图像网格。",
    alt: "保留顶部搜索框与色相/方向筛选条，结果区改用 275 画廊布局或 271 瀑布流页面。",
  },
  {
    id: "orders",
    tag: "客服后台订单核账",
    brief: "运营人员查一批异常订单，要同时横比订单号、实付金额、退款状态、下单时间并批量导出。",
    verdict: "改用：数据表格布局",
    verdictKind: "avoid",
    why: "任务核心是多维字段的精准列对齐横比与排序汇总，而不是阅读自然语言摘要。搜索结果卡片会把可比较的数值拆散在不同视觉位置。",
    alt: "改用 274 数据表格布局，让列头对齐、数字等宽并支持多列排序与批量勾选。",
  },
  {
    id: "nearby",
    tag: "找 1 公里内营业咖啡馆",
    brief: "用户正在陌生街区步行，最关心步行距离、方位路线与此刻是否打烊。",
    verdict: "改用：地图主导布局（配精简列表）",
    verdictKind: "avoid",
    why: "纯纵向搜索列表无法传达东南西北的真实空间邻近度。把空间关系折叠成纯文字距离「650m」，会让人反复在列表和地图间来回切屏。",
    alt: "改用 282 地图主导布局，地图标点与紧凑侧栏卡片双向联动。",
  },
];

// ---------- Section 06: 极端工程压测 ----------
export const EDGE_CASES = {
  normal: {
    id: "normal",
    label: "正常数据",
    mode: "normal",
    query: "如何提高专注力",
    countText: "约 258,000,000 个结果 (0.32 秒)",
    cssTitle: "标准四层卡片样式",
    cssCode: `.serp-card {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 112px;\n  gap: 14px;\n}\n.serp-title { font-size: 1.125rem; color: #1E3E78; }\n.serp-url   { font-family: "JetBrains Mono"; color: #275A3A; }`,
    explanation: "桌面端用 minmax(0, 1fr) 保护文字主列，右侧固定缩略图槽位，让 5 条结果的标题左缘严丝合缝。",
  },
  zero: {
    id: "zero",
    label: "零结果兜底",
    mode: "zero",
    query: "如合提告砖注力",
    countText: "0 个精确结果 (0.09 秒)",
    cssTitle: "零结果不可成死胡同",
    cssCode: `/* 屏幕阅读器实时播报结果变化 */\n<p role="status" aria-live="polite">\n  未找到「如合提告砖注力」，已提供纠错建议\n</p>\n/* 可点击一键纠错与放宽筛选芯片 */`,
    explanation: "糟糕的搜索页只甩一句「暂无结果」。好的空态必须给出拼写纠错直达、去掉过严筛选条件的按钮，以及热门相近主题入口。",
  },
  overflow: {
    id: "overflow",
    label: "超长 URL 与标题",
    mode: "overflow",
    query: "专注力训练实验数据",
    countText: "找到 12 个技术文档 (0.14 秒)",
    cssTitle: "防爆框截断与折行守则",
    cssCode: `.serp-url {\n  overflow-wrap: anywhere;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.serp-snippet {\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}`,
    explanation: "没有空格的长 URL 和 50 字学术标题最容易撑破 Flex/Grid 容器。父列必须写 minmax(0, 1fr)，URL 单行省略或转为可读面包屑，摘要用两行截断保节奏。",
  },
  mobile: {
    id: "mobile",
    label: "390px 手机窄卡",
    mode: "mobile",
    query: "如何提高专注力",
    countText: "约 2.58 亿条 · 移动端紧凑态",
    cssTitle: "窄屏保左缘、缩图不挤字",
    cssCode: `@media (max-width: 520px) {\n  .serp-card {\n    grid-template-columns: minmax(0, 1fr) 72px;\n    padding: 12px 14px;\n  }\n  .serp-thumb { width: 72px; height: 56px; }\n  .serp-meta  { font-variant-numeric: tabular-nums; }\n}`,
    explanation: "390px 竖屏上，如果把大图仍留 120px 宽，正文列就被压成每行 9 个字。缩略图退缩到 68–76px 方形或只在首位保留，把宽度让给可扫读的标题与两行摘要。",
  },
};

// ---------- Section 07: 中性四选一小练习（两题可切换） ----------
export const QUIZ_ROUNDS = [
  {
    id: "q1",
    label: "第 1 题 · 信息型摘要",
    prompt: "用户搜索「咖啡萃取 过萃 原因」，想快速从多篇文章中挑出真正拆解过萃成因的一篇。以下四张结果卡标题、网址与缩略图完全相同，只改变摘要与匹配呈现方式——哪一版最便于扫读判别？",
    query: "咖啡萃取 过萃 原因",
    correct: "A",
    options: [
      {
        id: "A",
        label: "方案 A",
        title: "手冲咖啡过萃与萃不足：风味偏差排查指南",
        url: "www.brewlab.cn/guide/extraction",
        snippetHtml: "导致<mark>过萃</mark>的三大常见<mark>原因</mark>是研磨过细、水温偏高与浸泡超时，苦涩杂味通常在尾段集中析出，可通过调粗刻度修正。",
        tags: ["过萃排查", "萃取参数"],
        longMode: false,
        reason: "正确。方案 A 用查询词动态摘句（约 62 字两行）直接亮出「过萃」「原因」的上下文证据，且仅对命中词局部着色，信息气味强、不占首屏高度。",
      },
      {
        id: "B",
        label: "方案 B",
        title: "手冲咖啡过萃与萃不足：风味偏差排查指南",
        url: "www.brewlab.cn/guide/extraction",
        snippetHtml: "手冲咖啡的迷人之处在于每一次注水都能带来微妙的风味变化，从埃塞俄比亚产区豆到滤杯材质，都值得细细体会。",
        tags: ["手冲专栏", "风味笔记"],
        longMode: false,
        reason: "方案 B 字数与版式同样工整，但它截取的是文章静态开头导语，通篇未出现「过萃」或「原因」，用户无法判断正文是否真讲排查成因，只能盲点验证。",
      },
      {
        id: "C",
        label: "方案 C",
        title: "手冲咖啡过萃与萃不足：风味偏差排查指南",
        url: "www.brewlab.cn/guide/extraction",
        snippetHtml: "导致<mark>过萃</mark>的三大常见<mark>原因</mark>是研磨过细、水温偏高与浸泡超时，苦涩杂味通常在尾段集中析出。我们在实验中分别测试了 88℃、92℃、96℃ 三组水温与 1:14 至 1:17 粉水比，记录下每 15 秒的浓度读数与口感评分，并对比了锥形滤杯与平底滤杯在不同注水流速下的萃取率曲线变化……",
        tags: ["过萃排查", "萃取参数"],
        longMode: true,
        reason: "方案 C 虽然包含命中词，但把摘要拉长到了约 140 字的五整行段落墙。单卡过高会把第 2、3 条候选挤出首屏，显著增加翻屏对比成本。",
      },
      {
        id: "D",
        label: "方案 D",
        title: "手冲咖啡过萃与萃不足：风味偏差排查指南",
        url: "www.brewlab.cn/guide/extraction",
        snippetHtml: "<mark>导致</mark><mark>过萃</mark>的<mark>三大</mark><mark>常见</mark><mark>原因</mark>是<mark>研磨</mark><mark>过细</mark>、<mark>水温</mark><mark>偏高</mark>与<mark>浸泡</mark><mark>超时</mark>，<mark>苦涩</mark>杂味常在<mark>尾段</mark>析出。",
        tags: ["过萃排查", "手冲", "水温", "研磨", "风味"],
        longMode: false,
        reason: "方案 D 把近半数词都铺上了高亮底色，又叠加了过多标签。全员涂亮制造了强烈视觉噪点，真正要核对的「过萃」「原因」反而失去突出优势。",
      },
    ],
  },
  {
    id: "q2",
    label: "第 2 题 · 导航型密度",
    prompt: "用户搜索「Figma 价格页」，意图是立刻找到官方定价页面并点进去核对套餐。四版结果都在第 1 位且网址一致，只改变排版层级与摘要密度——哪一版最贴合导航型查询？",
    query: "Figma 价格页",
    correct: "C",
    options: [
      {
        id: "A",
        label: "方案 A",
        title: "Figma 定价与套餐方案 — 官方页面",
        url: "www.figma.com/pricing",
        snippetHtml: "Figma 为个人创作者、设计团队与大型组织提供 Starter、Professional、Organization 与 Enterprise 四档订阅，包含无限云端草稿、设计系统组件库、分支合并、单点登录 SSO、企业级权限审计日志以及年度按席位计费细则与教育版免费申请入口说明……",
        tags: ["订阅说明", "团队席位", "企业版", "教育优惠"],
        longMode: true,
        reason: "方案 A 是典型的信息型长摘要搬到导航型查询里。Cutrell & Guan（CHI 2007）证实：用户已明确知道要进哪页时，过长摘要反而拖慢识别与点击速度。",
      },
      {
        id: "B",
        label: "方案 B",
        title: "Figma 定价与套餐方案 — 官方页面",
        url: "www.figma.com/pricing",
        snippetHtml: "查看个人免费版与团队订阅方案对比。",
        tags: [],
        flatMode: true,
        reason: "方案 B 摘要长度合适，但把标题、网址与摘要压成了几乎同字号、同灰度的平级文本，缺少一眼可点击的标题主锚与清晰来源域名辨识。",
      },
      {
        id: "C",
        label: "方案 C",
        title: "Figma 定价与套餐方案 — 官方页面",
        url: "www.figma.com/pricing",
        snippetHtml: "官方<mark>价格</mark>与订阅对比：免费起步版、专业版与企业席位直达。",
        tags: ["官方定价"],
        longMode: false,
        reason: "正确。导航型查询下，醒目钴蓝标题 + 清晰官方域名 + 30 字以内精炼确认句，能让搜索者在不到半秒内确认是真官网并直接点击。",
      },
      {
        id: "D",
        label: "方案 D",
        title: "Figma 定价与套餐方案 — 官方页面",
        url: "www.figma.com/pricing",
        snippetHtml: "",
        tags: [],
        longMode: false,
        reason: "方案 D 完全砍掉了摘要与任何副信息，面对同名第三方比价站或仿站时缺少最低限度的核验上下文，容易引发犹豫或误点。",
      },
    ],
  },
];
