// 144 框架版式 · 单一真源数据与几何判定模型
// 所有读数、诊断、经验阈值、小节示例与练习均从此处统一导出

export const EXP = {
  bodyFontPx: 14,
  padMin: 2,
  padMax: 32,
  padComfortMin: 12, // 约 0.86× 正文字号（经验值）
  padComfortMax: 26, // 约 1.86× 正文字号（经验值）
  maxFramedZones: 3, // 4 个内部分区里至少留 1 处纯留白区，避免四宫格牢笼（经验值）
  maxHeavyZones: 1,
  maxBlockZones: 1,
};

export const OUTER_MODES = [
  { id: "none", label: "无外框", short: "无" },
  { id: "hairline", label: "细线外框", short: "细线" },
  { id: "anchored", label: "定锚外框", short: "定锚" },
];

export const ZONE_MODES = [
  { id: "none", label: "去框", note: "纯留白" },
  { id: "hairline", label: "细线框", note: "轻界定" },
  { id: "heavy", label: "重墨框", note: "强收束" },
  { id: "block", label: "赭橙色块", note: "强强调" },
];

export const ZONES = [
  { id: "art", label: "主展图", role: "视觉焦点（原海报日山图）" },
  { id: "brief", label: "展陈主旨", role: "核心说明段落" },
  { id: "list", label: "观展清单", role: "四条动线与时段" },
  { id: "callout", label: "预约提示", role: "必看行动信息" },
];

// 开场错版：无总外框 + 内部 4 区全套重墨框 + 清单子项逐条套框 + 窒息内距 4px
export function initialHeroState() {
  return {
    outer: "none",
    zones: {
      art: "heavy",
      brief: "heavy",
      list: "heavy",
      callout: "heavy",
    },
    itemBoxes: true,
    padding: 4,
    xray: false,
    selected: "list",
  };
}

export function evaluateHero(state) {
  const zoneIds = ZONES.map((z) => z.id);
  const modes = zoneIds.map((id) => state.zones[id]);
  const outerFramed = state.outer !== "none";
  const framedZones = modes.filter((m) => m !== "none").length;
  const lineZones = modes.filter((m) => m === "hairline" || m === "heavy").length;
  const heavyCount = modes.filter((m) => m === "heavy").length;
  const blockCount = modes.filter((m) => m === "block").length;

  // 嵌套层数：外框算 1 层；内部有框/色块分区算 1 层；清单子项再套框且外层或清单有框时叠成第 3 层
  const hasInnerLayer = framedZones > 0;
  let nestingDepth = (outerFramed ? 1 : 0) + (hasInnerLayer ? 1 : 0);
  if (state.itemBoxes) {
    nestingDepth = Math.max(nestingDepth, (outerFramed ? 1 : 0) + (state.zones.list !== "none" ? 2 : 1));
  }

  // 独立框总数：外框 + 内部有框分区 + 4 条清单子项框
  const totalBoxes = (outerFramed ? 1 : 0) + framedZones + (state.itemBoxes ? 4 : 0);

  // 1+1=3 冲突边数（估算紧贴的平行双边/套娃内边对数）
  let conflictEdges = 0;
  if (state.itemBoxes) conflictEdges += state.zones.list !== "none" ? 4 : 3;
  // 相邻分区同时戴框：左列 art-brief、右列 list-callout、横跨 art-list、brief-callout
  const pairs = [
    ["art", "brief"],
    ["list", "callout"],
    ["art", "list"],
    ["brief", "callout"],
  ];
  for (const [a, b] of pairs) {
    const ma = state.zones[a];
    const mb = state.zones[b];
    if ((ma === "heavy" || ma === "hairline") && (mb === "heavy" || mb === "hairline")) {
      if (ma === "heavy" || mb === "heavy") conflictEdges += 1;
      else if (framedZones === 4) conflictEdges += 1;
    }
  }

  const breathRatio = +(state.padding / EXP.bodyFontPx).toFixed(2);
  const padOk = state.padding >= EXP.padComfortMin && state.padding <= EXP.padComfortMax;
  const padTight = state.padding < EXP.padComfortMin;
  const padLoose = state.padding > EXP.padComfortMax;

  // 原海报四德体检（每项对应原海报底部 4 枚几何图标）
  const checks = {
    boundary: outerFramed && conflictEdges === 0 && nestingDepth <= 2,
    order: !state.itemBoxes && framedZones >= 1 && framedZones <= EXP.maxFramedZones && heavyCount <= EXP.maxHeavyZones,
    stability: outerFramed && padOk,
    emphasis: (blockCount === 1 && heavyCount <= 1) || (blockCount === 0 && heavyCount === 1 && framedZones >= 1),
  };

  const passCount = Object.values(checks).filter(Boolean).length;

  // 严格优先级单报一条主错，并讲清「为什么」与下一步动作
  let status = "error";
  let badge = "错态 · 满框套娃";
  let headline = "";
  let detail = "";
  let hint = "";

  if (state.itemBoxes || heavyCount >= 2) {
    badge = "错态 · 满框套娃";
    headline = `全页堆出 ${totalBoxes} 个框（${nestingDepth} 层嵌套），边框在抢内容的话语权`;
    detail =
      "当每个分区甚至每条清单都套上粗黑框，眼睛看到的不是秩序，而是相邻黑线夹出的 1+1=3 刺眼白缝——所有东西都在喊重点，等于没有重点。";
    hint = state.itemBoxes
      ? "先关闭「清单子项套框」，再把「展陈主旨」或「观展清单」改为「去框」或「细线框」。"
      : "当前有 " + heavyCount + " 处重墨框在互抢：至多保留 1 处重墨框（如主展图），其余改成去框或细线。";
  } else if (padTight) {
    badge = "错态 · 窒息贴边";
    headline = `框内留白仅 ${state.padding}px（${breathRatio}× 字号），边框成了压字的牢笼`;
    detail =
      "字行紧贴框壁时，边框线与文字笔画会粘连发闷，降低扫读速度。经验上框内留白至少要到正文字号的 0.85 倍（约 12px）以上，内容才能呼吸。";
    hint = "向右拖动下方「内距呼吸卡尺」到 12–26px 甜区，观察框内文字如何舒展开来。";
  } else if (padLoose) {
    badge = "错态 · 留白散架";
    headline = `框内留白拉到 ${state.padding}px（${breathRatio}× 字号），内容被挤碎折行`;
    detail =
      "内距超过正文字号约 1.85 倍（26px）后，边框退得太远，失去了收束归组的紧密度，文本列也被挤窄。";
    hint = "把「内距呼吸卡尺」往回推回 12–26px 经验舒适区。";
  } else if (!outerFramed) {
    badge = "错态 · 缺总外框";
    headline = framedZones === 0 ? "整页散落无界，缺少边界与稳定感" : "内部有散框，但整页缺少一道总外框收口";
    detail =
      "没有统一的外边界兜住四角时，说明页的四个模块像漂浮在纸面上的零碎零件，读者很难一眼看出整张单页从哪开始、在哪结束。";
    hint = "把「整页外框」切换为「细线外框」或原海报同款的「定锚外框」。";
  } else if (blockCount >= 2) {
    badge = "错态 · 色块滥用";
    headline = `同时涂亮了 ${blockCount} 处赭橙色块，第一眼焦点相互打架`;
    detail =
      "色块是框架版式里最重的视觉语气。一旦超过 1 处涂成高饱和实底，读者视线会在多个色块间来回弹跳，反而丢掉主次。";
    hint = "只留 1 处最需要行动或点题的区块用「赭橙色块」（如预约提示），其余退回细线或去框。";
  } else if (framedZones >= 4) {
    badge = "错态 · 四面满格";
    headline = "4 个内部分区全都有框，版面像紧绷的四宫格表格";
    detail =
      "总外框已经建立整页秩序，如果内部每个分区还各画一道框，框线与外框之间又会挤出多余夹缝。留出至少 1 处「去框」纯留白区，秩序才会透气。";
    hint = "点选「展陈主旨」或「观展清单」，将其改为「去框」，让留白和边框配合工作。";
  } else if (framedZones === 0) {
    badge = "错态 · 内无锚点";
    headline = "只有外框空壳，内部四个分区毫无层级区分";
    detail =
      "虽然整页有了外边界，但内部展图、主旨、清单与预约提示完全平铺，读者扫一眼分不出哪块最该先看。";
    hint = "为「主展图」加一道重墨框，或给「预约提示」加上 1 处赭橙色块。";
  } else if (!checks.emphasis) {
    badge = "差一步 · 缺强调";
    headline = "边界、收束与稳定都已到位，但缺少第一眼「强调」";
    detail =
      "当前内部都是同级细线框，整洁但语气全平。框架版式最后一步是用 1 处色块或唯一重墨框，把核心信息抬出水面。";
    hint = "把「预约提示」切为「赭橙色块」，或把「主展图」切为唯一「重墨框」，即可点亮全部 4 项。";
  } else {
    status = "ok";
    badge = "成立 · 秩序合拢";
    headline = `4/4 原则齐备：${totalBoxes} 框有序收束，内距 ${state.padding}px（${breathRatio}×）`;
    detail =
      "外框兜住整页稳定感，内部克制减框避免 1+1=3 噪点，呼吸留白落入经验舒适区，且仅用 1 处核心强调牵引视线——这正是框架版式在说明页与清单页里最稳的形态。";
    hint = "试试把不同分区换成「去框 / 细线 / 色块」，感受多种同样成立的有序组合。";
  }

  return {
    outerFramed,
    framedZones,
    lineZones,
    heavyCount,
    blockCount,
    nestingDepth,
    totalBoxes,
    conflictEdges,
    breathRatio,
    padOk,
    checks,
    passCount,
    status,
    badge,
    headline,
    detail,
    hint,
  };
}

// 02 节：四种装框语气（严格对应原海报底部四个关键词）
export const GRAMMAR_MODES = [
  {
    id: "boundary",
    zh: "边界",
    en: "BOUNDARY",
    modeName: "单线界定 · 轻装框",
    inkLevel: "低（示意 ~18%）",
    scanOrder: "01 标题 → 02 产区参数 → 03 冲煮建议",
    why: "一道利落的 1.5px 深青细线划出阅读范围，不增加压迫感。适合信息密度中等、需要清爽分组的产品说明书。",
  },
  {
    id: "order",
    zh: "收束",
    en: "ORDER",
    modeName: "内外嵌套 · 框内定心",
    inkLevel: "中（示意 ~34%）",
    scanOrder: "01 核心风味框 → 02 外围参数 → 03 底注",
    why: "外框统一整张卡片，内部只给最核心的 1 组内容再加一道内收框，像原海报的「▣」图标——先兜住整体，再往中心收拢视线。",
  },
  {
    id: "stability",
    zh: "稳定",
    en: "STABILITY",
    modeName: "重墨承托 · 实体压重",
    inkLevel: "高（示意 ~58%）",
    scanOrder: "01 深青实体区 → 02 留白信息区",
    why: "用大面积深青墨色块稳稳压住版面一侧或底部（如同原海报的「■」），建立沉稳的建筑重心，适合展陈主标或权威规格单。",
  },
  {
    id: "emphasis",
    zh: "强调",
    en: "EMPHASIS",
    modeName: "色块聚焦 · 单点跳出",
    inkLevel: "中低（示意 ~28%）",
    scanOrder: "01 赭橙强调块 → 02 标题 → 03 常规参数",
    why: "大面积保持暖米留白与克制线框，只把最关键的「萃取比例 / 行动提示」装进一处赭橙色块（如同原海报的「◎」），一秒锁住视线。",
  },
];

// 03 节：Tufte 四步减框剥离
export const STRIP_STEPS = [
  {
    id: "doubleOuter",
    label: "拆掉多余外双框",
    desc: "消除最外圈两条并行粗线之间白白多出来的第三条亮槽（1+1=3）。",
    inkCost: 26,
  },
  {
    id: "cellGrid",
    label: "拆掉全单元格竖线",
    desc: "对齐本身就能串起纵列，竖直牢笼线只会反复斩断横向扫读视线。",
    inkCost: 30,
  },
  {
    id: "tagBorders",
    label: "拆掉状态胶囊黑边",
    desc: "把每个标签周围的粗黑框换成柔和浅底，文字立刻清晰透气。",
    inkCost: 18,
  },
  {
    id: "keepAnchor",
    label: "仅留一道细底线 + 1 处色块",
    desc: "用「最小有效差异」保留清晰行序，并把唯一赭橙色块留给「主旨讲座」。",
    inkCost: 12,
  },
];

// 05 节：从古籍边栏到现代版框（核实过的史料）
export const ERAS = [
  {
    id: "song",
    year: "868 — 1279",
    title: "唐刻扉画与宋版边栏",
    en: "WOODBLOCK BIANLAN",
    source: "大英图书馆 Or.8210/P.2（唐咸通九年《金刚经》）与宋代刻本",
    summary:
      "868 年刻印的敦煌《金刚经》扉画四周已刻出清晰矩形单边版框；至宋代雕版印刷定型出「四周单边 / 左右双边 / 四周双边（文武边）」与纵向「界行」，先稳版面边界、再隔行距，使读者翻页时眼睛总有准绳。",
    frameRole: "保护刻版墨边、统一书页天头地脚与行格秩序。",
  },
  {
    id: "kelmscott",
    year: "1896",
    title: "凯尔姆斯特《乔叟全集》",
    en: "KELMSCOTT CHAUCER",
    source: "William Morris, The Works of Geoffrey Chaucer (Kelmscott Press, V&A 馆藏)",
    summary:
      "威廉·莫里斯把对开双页视作一整座微型建筑，亲手绘制繁复的藤蔓木刻宽边栏，将爱德华·伯恩-琼斯的 87 幅木刻插图与哥特体文字紧紧框合在同一视觉框架中，把装饰性边框推向工艺美术顶峰。",
    frameRole: "以宽厚花边将插画与文字锻造成华丽统一的书页壁画。",
  },
  {
    id: "tschichold",
    year: "1928",
    title: "新字体排印学拆掉花边",
    en: "DIE NEUE TYPOGRAPHIE",
    source: "Jan Tschichold, Die neue Typographie (1928)",
    summary:
      "扬·奇肖尔德在 1928 年宣言中果断废除装饰性花边与对称框饰，主张线条、色块与边框不再用来填满空白，而只作为建立非对称秩序、分隔信息组与引导视线的理性功能部件。",
    frameRole: "从装饰转向功能：只在字号与留白不足以分清层级时才动用线框。",
  },
  {
    id: "cognitive",
    year: "1982 — 1997",
    title: "感知科学与减法边界",
    en: "PERCEPTION & MINIMAL INK",
    source: "Arnheim (1982) · Palmer (1992) · Tufte (1990 / 1997)",
    summary:
      "阿恩海姆（1982）揭示边框在画内建起力场与重心；帕尔默（1992）在《Cognitive Psychology》证明「共同区域律」可压过距离分组；塔夫特（1990/1997）则以「1+1=3」与「最小有效差异」划清了有序框架与多余框灾的红线。",
    frameRole: "用最少、最准的边界换取最大的归组清晰度与稳定感。",
  },
];

// 06 节：场景试纸（何时用、何时别用）
export const SCENARIOS = [
  {
    id: "spec",
    title: "博物馆器物展签 / 产品说明页",
    verdict: "强烈推荐用框架",
    recommend: true,
    why: "展签同时包含器物图、年代参数、材质清单与参观提示，异构信息极多；一道定锚外框加 1 处色块锚点，能让观众在三秒内定位所需条目。",
    framedNote: "外框稳住卡片边界，参数与展图分区明确，站远半米仍一眼分清层级。",
    unframedNote: "没有边界兜底时，零碎的年代、尺寸与提示容易散成一摊，贴在展墙上显得发虚。",
  },
  {
    id: "checklist",
    title: "活动流程清单 / 参数对照页",
    verdict: "适合克制线框",
    recommend: true,
    why: "清单页追求逐项核对的稳定感与完整性。用外框圈定任务范围、内部用细横线替代满格粗框，既清爽又防跳行。",
    framedNote: "整张清单像一张可打勾的工作单，起止明确、重点时段一眼跳出。",
    unframedNote: "缺少起止边界与状态锚点时，读者容易在长清单里迷失当前进度。",
  },
  {
    id: "essay",
    title: "三千字深度特稿 / 沉浸长文",
    verdict: "不要套硬框",
    recommend: false,
    why: "连续阅读依赖流畅的视线换行和宽裕的页边呼吸。硬把正文装进四周实线框里，每一行视线折返都会撞到框壁，产生局促感——长文更适合依靠页边距与文字本身建立秩序（可看 141 文字主导版式）。",
    framedNote: "四周黑框把长段落锁成公告栏，眼睛每读完一行都被右侧竖线挡一下，读几段就累。",
    unframedNote: "拿掉硬框后，靠舒适行宽、页边留白与段距呼吸，注意力自然沉进字句里。",
  },
  {
    id: "photo",
    title: "满幅情绪摄影 / 风光画册跨页",
    verdict: "不要加封闭框",
    recommend: false,
    why: "大气的摄影画面靠出血延伸制造临场感与开阔度；如果在画面四周套上粗边框，反而会把空间感锁死在相框里（这类题材更适合 140 图片主导版式，或只局部裁景的 143 图片窗口版式）。",
    framedNote: "粗边框把海天与远山强行关进小盒子里，空间延展感被一刀截断。",
    unframedNote: "拆掉外框让画面直抵纸边，情绪和纵深瞬间释放开来。",
  },
];

// 07 节：单变量小练习（仅差「装框策略」一个变量，标签绝对中性）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    correct: false,
    verdict: "满框套娃且缺总外框",
    reason:
      "A 版删掉了整页外框，却给内部四个区块全都套上了粗重实线框：四角缺少整体收束，两条相邻重框之间还撞出刺眼的 1+1=3 夹缝，而且四块语气一样重，分不出主次。",
  },
  {
    id: "B",
    correct: false,
    verdict: "整洁但平权无强调",
    reason:
      "B 版有定锚外框、内距也舒展，但内部四个区块全用完全相同的细线框——「边界」「收束」「稳定」都有了，唯独缺少「强调」，读者第一眼不知道最该盯住哪一块。",
  },
  {
    id: "C",
    correct: true,
    verdict: "四项原则同时成立",
    reason:
      "C 版用定锚外框兜住整张说明页（边界与稳定），把主旨与日程正文改为去框留白消除多余线条（收束），内距舒展不压字，并把唯一的赭橙实色块留给「预约时间」（强调）。",
  },
  {
    id: "D",
    correct: false,
    verdict: "色块滥用导致重点互抢",
    reason:
      "D 版虽有外框，但同时把主标、主旨与预约三处全都涂成了高饱和赭橙色块——强调面铺满全页后，视线四处跳动，反而丢掉了框架版式最看重的稳定与清晰层级。",
  },
];
