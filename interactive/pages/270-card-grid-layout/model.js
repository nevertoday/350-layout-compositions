// 270 卡片网格布局 · 单一真源数据模型与实测判定引擎

export const CARDS_DATA = [
  {
    id: 1,
    no: "01",
    category: "设计理论",
    title: "极简网格手册",
    desc: "拆解模数、栏缝与留白比例的基础入门册。",
    price: "¥68",
    action: "查看目录",
    tag: "",
    art: "quad"
  },
  {
    id: 2,
    no: "02",
    category: "展览图录",
    title: "瑞士平面排印与现代书装档案",
    desc: "收录四十二件馆藏出版物网格草图与活字样张，附双语编年索引与尺规注释。",
    price: "¥128",
    action: "预约展册",
    tag: "初版编号",
    art: "bars"
  },
  {
    id: 3,
    no: "03",
    category: "年度主推",
    title: "城市公共标识系统实地测绘",
    desc: "走读六座城市地铁与美术馆导视牌的远距扫读规律。",
    price: "¥96",
    action: "立即试读",
    tag: "主编推荐",
    art: "eye"
  },
  {
    id: 4,
    no: "04",
    category: "材料研究",
    title: "纸张肌理标本",
    desc: "按克重、纤维走向与吸墨表现归档的十六款印刷用纸对照卡。",
    price: "¥84",
    action: "查看目录",
    tag: "",
    art: "frame"
  },
  {
    id: 5,
    no: "05",
    category: "空间建筑",
    title: "模块家具与空间模数实验记录",
    desc: "从工业货架到展厅隔断，观察统一单元尺寸如何让空间随时重组扩展。",
    price: "¥112",
    action: "预约展册",
    tag: "附折页",
    art: "shapes"
  },
  {
    id: 6,
    no: "06",
    category: "排印工具",
    title: "字体排印问答",
    desc: "五十个界面字号与行距常见现场问题速查。",
    price: "¥52",
    action: "查看目录",
    tag: "",
    art: "stairs"
  },
  {
    id: 7,
    no: "07",
    category: "视觉传达",
    title: "信息图表结构与视觉编码",
    desc: "用分组、色阶与坐标网格把复杂数据拆成一眼可读的模块。",
    price: "¥92",
    action: "查看目录",
    tag: "新增展品",
    art: "extend"
  },
  {
    id: 8,
    no: "08",
    category: "纸艺工坊",
    title: "手工装帧工艺图解",
    desc: "线装、骑马钉与裸脊平摊装帧的开本比例实测。",
    price: "¥78",
    action: "预约展册",
    tag: "新增展品",
    art: "quad"
  },
  {
    id: 9,
    no: "09",
    category: "印刷工艺",
    title: "专色体系与网点叠印样本",
    desc: "钴蓝、暖黄与米白三色专印在不同纸底上的视觉明度对比。",
    price: "¥108",
    action: "查看目录",
    tag: "新增展品",
    art: "bars"
  }
];

export const MIN_GUTTER = 2;
export const MAX_GUTTER = 44;

export function getInitialState(viewportWidth) {
  const isCompact = viewportWidth <= 640;
  const isMedium = viewportWidth > 640 && viewportWidth <= 920;
  return {
    cols: isCompact ? 3 : isMedium ? 4 : 5,
    gutter: 4,
    alignMode: "raw", // "raw" | "stretch" | "subgrid"
    spotlights: new Set([1, 2, 3, 5]), // 故意 4/6 全员抢戏
    cardCount: 6,
    showGuides: true
  };
}

/**
 * 基于真实渲染出的 DOM 几何尺寸（measured）与当前状态，输出唯一真源的 4 项判定与诊断文案。
 * measured = { containerW, cardW, innerGap, rowCount, baselineJitter, actualGutter }
 */
export function evaluateGrid(state, measured) {
  const { cols, gutter, alignMode, spotlights, cardCount } = state;
  const activeSpots = [...spotlights].filter((id) => id <= cardCount);
  const spotCount = activeSpots.length;
  const maxSpot = Math.max(1, Math.floor(cardCount * 0.25)); // 6–7张最多1张，8–9张最多2张

  const containerW = Math.max(240, measured.containerW || 960);
  const innerGap = Math.max(8, Math.round(measured.innerGap || 12));
  const cardW = Math.max(60, Math.round(measured.cardW || (containerW - gutter * (cols - 1)) / cols));
  const jitter = Math.max(0, Math.round(measured.baselineJitter || 0));
  const ratio = gutter / innerGap;

  const isNarrowContainer = containerW < 520;
  const minCardW = isNarrowContainer ? 148 : 195;
  const maxCardW = isNarrowContainer ? 460 : 450;

  const widthTooNarrow = cardW < minCardW;
  const widthTooWide = !isNarrowContainer && (cols === 1 || cardW > maxCardW);
  const gutterTooTight = gutter < innerGap;
  const gutterTooWide = cols > 1 && gutter > (isNarrowContainer ? 26 : 32);

  // 对应原海报「布局要点」4 项
  const checkSizeGap = !widthTooNarrow && !widthTooWide && !gutterTooTight && !gutterTooWide;
  const checkHierarchy = spotCount >= 1 && spotCount <= maxSpot;
  const checkRelation = !gutterTooTight && !gutterTooWide;
  const checkScan =
    !widthTooNarrow &&
    !widthTooWide &&
    (cols === 1 ? isNarrowContainer : alignMode === "subgrid" && jitter <= 2);

  const checks = {
    sizeGap: checkSizeGap,
    hierarchy: checkHierarchy,
    relation: checkRelation,
    scan: checkScan
  };
  const passed = Object.values(checks).filter(Boolean).length;

  const remainder = cardCount % cols;
  const hasOrphan = cols > 1 && remainder === 1;

  // 按严重程度给出清晰、讲「为什么」的实时诊断
  let tone = "warn";
  let badge = "待校准";
  let title = "";
  let why = "";

  if (passed === 4) {
    tone = "ok";
    badge = "网格成立";
    if (hasOrphan) {
      title = `4 项要点全部成立（单卡 ${cardW}px · 末行留 1 张孤卡）`;
      why = `外距 ${gutter}px 清晰大于卡内距 ${innerGap}px（${ratio.toFixed(1)}×），仅 ${spotCount} 张亮黄卡稳住第一落眼点，Subgrid 把同行基线误差压到 ${jitter}px。顺带一提：${cardCount} 张排 ${cols} 列会在末行留下 1 张孤卡，再点虚线槽加卡或调列数能让收口更完整。`;
    } else {
      title = `4 项要点全部成立：单卡 ${cardW}px，基线偏差 ${jitter}px`;
      why = `外距 ${gutter}px（卡内距的 ${ratio.toFixed(1)}×）让每张卡形成清晰的格式塔「共同区域」，${spotCount}/${cardCount} 张亮黄卡建立明确第一落眼点，Subgrid 行轨让眼睛顺着同一水平线扫过每张卡的标题与按钮。`;
    }
  } else if (gutterTooTight && widthTooNarrow) {
    badge = "挤墙·过密";
    title = `${cols} 列把单卡压成 ${cardW}px，${gutter}px 卡距又小于卡内距 ${innerGap}px`;
    why = `两件事同时破功：外距比卡内行距还窄（${ratio.toFixed(1)}×），邻卡标题和配图互相粘连；列数过密又把文案挤成窄条。先减列数（${isNarrowContainer ? "试试 2 列或 1 列" : "试试 3 列或 4 列"}），再拖卡尺把外距拉过 ${innerGap}px。`;
  } else if (gutterTooTight) {
    badge = "外距过紧";
    title = `外距 ${gutter}px 小于卡内距 ${innerGap}px（${ratio.toFixed(1)}×），卡片粘成一片`;
    why = `格式塔接近律正在和边界打架：邻卡之间的缝隙比卡内元素还近，眼睛扫过时容易把左卡文字误归到右卡。把卡距标尺向右拖到 ${innerGap}–28px 区间，给卡片留出呼吸沟。`;
  } else if (widthTooNarrow) {
    badge = "列数过密";
    title = `${cols} 列把单卡压窄到 ${cardW}px（低于建议下限 ${minCardW}px）`;
    why = `单卡过窄时中文标题被迫折成三四行，行首频频回扫，网格从「高效比较」退化成「垂直字条墙」。减少一到两列，让单卡回到舒适阅读宽带。`;
  } else if (widthTooWide) {
    badge = "退化为列表";
    title = `宽屏排 ${cols} 列，单卡拉宽到 ${cardW}px，失去横向并排比较优势`;
    why = `卡片网格的价值是让多条并列内容同屏扫读；单卡过宽时眼睛只能单列上下滚动，变成通栏信息流。在当前宽度下改用 3 列或 4 列，能一眼同时比较整行卡片。`;
  } else if (gutterTooWide) {
    badge = "孤岛断联";
    title = `卡距拉到 ${gutter}px（卡内距的 ${ratio.toFixed(1)}×），卡片散成孤岛`;
    why = `沟壑过宽会切断卡片之间的群体关联，还白白吃掉卡片本身的有效排版宽度。把卡距收回 12–28px 经验带，既分清边界又保持整体队列感。`;
  } else if (spotCount > maxSpot) {
    badge = "焦点过载";
    title = `${spotCount}/${cardCount} 张卡都在亮黄喊重点，等于全员没有重点`;
    why = `亮黄色的吸引力全靠稀缺建立——就像 270 原海报 8 张里只点亮 03 号一张。点卡片右上角的「焦点」钮关掉多余高亮，只保留 1 张（或 ≤25%）真正的主推项。`;
  } else if (spotCount === 0) {
    badge = "缺少锚点";
    title = `0/${cardCount} 张焦点卡：版面整齐，但视线缺少第一落眼点`;
    why = `全员均质适合中性索引目录，但在推荐与导览页里，读者面对 6 张同等权重的卡片容易犹豫。点亮 1 张核心卡片的焦点标，就能建立清晰的信息层级。`;
  } else if (alignMode === "stretch" && jitter > 2) {
    badge = "外齐内乱";
    title = `卡片外框齐了，但同行内部基线实测仍错位 ${jitter}px`;
    why = `这是卡片网格最容易踩的坑：CSS 默认把外框拉到等高，可第 02、05 张的 2 行标题仍把正文和底栏顶了下去，视线横向扫读照样上下跳动。切到「Subgrid 锁齐」让同行共享内部行轨。`;
  } else {
    badge = "基线参差";
    title = `自由散排下，同行卡片内部基线实测错位 ${jitter}px`;
    why = `真实内容不可能每条字数一样长。各卡各自为政时，眼睛横向比较价格和按钮总得上下找齐。切到「Subgrid 锁齐」，看看共享行轨如何把误差压到 0px。`;
  }

  return {
    checks,
    passed,
    tone,
    badge,
    title,
    why,
    metrics: {
      cardW,
      gutter,
      innerGap,
      ratio,
      jitter,
      spotCount,
      maxSpot,
      cardCount,
      cols,
      hasOrphan
    }
  };
}

// 02 节：270 原海报八条原则完整原话 + 展开解读
export const POSTER_PRINCIPLES = [
  {
    no: "01",
    zh: "模块",
    en: "MODULE",
    quote: "卡片作为独立模块，承载单一信息单元。",
    explain: "一张卡只讲一件事：一件商品、一本书或一条路线。一旦把两个无关入口硬塞进同一张卡，点击预期立刻模糊，整张卡的「可组合性」也就没了。",
    goodNote: "单卡闭环：封面 + 书名 + 简介 + 价格只服务于同一展品",
    badNote: "破功反例：一张卡里塞进两条新闻 + 三个外链，读者不知道点哪里",
    art: "quad"
  },
  {
    no: "02",
    zh: "一致",
    en: "CONSISTENCY",
    quote: "保持尺寸、间距、样式的一致性。",
    explain: "网格之所以显得「省力」，是因为读者看懂第一张卡的结构后，后面五张都不必重新学习——图片永远在顶、标题永远在第二层、价格与按钮永远守在底沿。",
    goodNote: "统一圆角、内边距与字段顺位，扫过第一张就摸清全部节奏",
    badNote: "破功反例：相邻卡片圆角、图比例、字号各写各的，变成广告拼贴板",
    art: "consistent"
  },
  {
    no: "03",
    zh: "扫读",
    en: "SCAN",
    quote: "网格引导视线流动，快速捕捉关键信息。",
    caveat: "说多了一点",
    explain: "卡片网格确实适合带图视觉浏览和并行挑选，但 Nielsen Norman Group（Page Laubheimer, 2016）提醒：如果是纯文字条目或按顺序逐条快扫，多列网格反而让视线左右折返，不如单列列表或数据表格扫得快。",
    goodNote: "封面主导的选款场景：水平视线沿同高封面与标题快速筛选",
    badNote: "误用反例：纯文字报错日志拆成 4 列卡片，眼睛被迫 Z 字来回跳行",
    art: "eye",
    spotlight: true
  },
  {
    no: "04",
    zh: "组合",
    en: "COMBINE",
    quote: "卡片可灵活组合，适配不同内容需求。",
    explain: "模块化意味着你可以按业务需要重组卡片：桌面 4 列、平板 2 列、手机 1 列，或者按筛选标签把同类卡聚在一起，不必为每种屏幕重写整套版式。",
    goodNote: "同一套卡片原子，随容器宽度无缝切 4 列 → 2 列 → 1 列",
    badNote: "破功反例：不同卡片强行绑定跨行跨列死坐标，删掉一张整页塌陷",
    art: "shapes"
  },
  {
    no: "05",
    zh: "对齐",
    en: "ALIGN",
    quote: "基于网格对齐，建立秩序与平衡。",
    explain: "对齐分两层：外框贴齐纵横网格线只是及格，真正让网格看起来精致的，是跨卡片的内部对齐——用 CSS Subgrid 或固定媒体比例，让同行每张卡的标题底线与按钮落点处于同一水平线。",
    goodNote: "外框与内部字段双轨对齐，同行价格与按钮连成笔直水平线",
    badNote: "破功反例：只拉齐外框高度，内部标题与按钮参差错落",
    art: "align"
  },
  {
    no: "06",
    zh: "留白",
    en: "SPACE",
    quote: "合理留白，让内容呼吸与聚焦。",
    explain: "卡片网格里有两套留白要配比：卡内内边距保护文字不撞边框，卡外沟壑（gutter）把不同卡片彻底分开。经验上外距应大于或至少等于卡内元素间距，边界才不会失效。",
    goodNote: "卡内呼吸舒展、卡外沟壑分明，每张卡自带视觉静音区",
    badNote: "破功反例：文字紧贴边线且卡间只留 4px，整屏压成密不透风的砖墙",
    art: "frame"
  },
  {
    no: "07",
    zh: "层级",
    en: "HIERARCHY",
    quote: "通过大小、色彩、位置建立信息层级。",
    explain: "层级有卡内与卡间两层：卡内用字重、字号与留白分清主标题、摘要和次要标签；卡间则像 270 原海报的 03 号亮黄卡一样，用稀缺的色彩或微幅强调制造唯一焦点，切忌全员加亮。",
    goodNote: "卡内主次分明 + 整网仅 1 张亮黄焦点，先落眼再发散",
    badNote: "破功反例：每张卡都上亮黄底色加粗边框，全员喊话等于静音",
    art: "hierarchy"
  },
  {
    no: "08",
    zh: "延展",
    en: "EXTEND",
    quote: "网格系统具备延展性，支持内容生长。",
    explain: "今天有 6 件新品，下月扩到 18 件，卡片网格只要顺着同一套列轨往下续排即可，设计框架不必推翻重来；唯一需要留意的是分页数量尽量取 2、3、4 的公倍数（如 6、12），减少末行孤卡。",
    goodNote: "新内容顺着原海报虚线槽自然长入网格，规则零破坏",
    badNote: "破功反例：页面按固定 5 张手写死定位，第 6 张一进来就溢出叠字",
    art: "extend"
  }
];

// 04 节：可核实的卡片网格演进史
export const HISTORY_ERAS = [
  {
    year: "1987",
    title: "Apple HyperCard",
    who: "Bill Atkinson · Apple",
    summary: "比尔·阿特金森在 Macintosh 上推出 HyperCard，把现实里的索引卡片盒搬进图形界面——每张「卡片」自带文字、图像和可点击按钮，多张卡叠成「卡片叠（Stack）」，成了数字界面卡片隐喻的源头。",
    artifact: "hypercard"
  },
  {
    year: "1992",
    title: "格式塔「共同区域律」",
    who: "Stephen E. Palmer · Cognitive Psychology",
    summary: "视觉心理学家史蒂芬·帕尔默正式提出 Common Region 原则：被放进同一个封闭边界内的元素，会被大脑优先判为同一组，其效力甚至强过「距离更近」——这为卡片框的认知效率提供了实验依据。",
    artifact: "palmer"
  },
  {
    year: "2012–13",
    title: "移动卡片浪潮与宣言",
    who: "Google Now (2012) · Paul Adams (2013)",
    summary: "Pinterest（2010）、Trello（2011）与 Google Now（2012）把卡片带进日常信息消费；2013 年 9 月，Intercom 产品设计负责人 Paul Adams 撰文《Why Cards Are the Future of the Web》，指出网页正从「静态页面」转向可跨屏重组、吞吐异构信息的原子卡片。",
    artifact: "mobilecards"
  },
  {
    year: "2014",
    title: "Material Design 规范化",
    who: "Google I/O · 2014 年 6 月 25 日",
    summary: "Google 发布 Material Design，首次在大型设计系统里给「Card」立下明确规矩：一张卡片只对应单一主题，充当通往详情页的轻量入口，并提供投影（Elevated）、填色（Filled）与描边（Outlined）三种容器形态。",
    artifact: "material"
  },
  {
    year: "2017–23",
    title: "CSS Grid 与 Subgrid 落地",
    who: "W3C · 主流浏览器全线支持",
    summary: "2017 年 3 月 Firefox 52、Chrome 57、Safari 10.1 同步上线原生 CSS Grid，彻底终结浮动手算列宽的时代；2023 年 9 月 CSS Subgrid 达成全浏览器基线支持，卡片网格跨列对齐内部标题与按钮的老难题终于迎刃而解。",
    artifact: "subgrid"
  }
];

// 05 节：场景分诊台（对比卡片网格与同小类兄弟编号）
export const TRIAGE_SCENARIOS = [
  {
    id: "shop",
    label: "独立书店 / 电商选款",
    verdict: "适合卡片网格",
    tone: "good",
    altName: "270 卡片网格布局（本页）",
    altHref: "",
    costGrid: "低 · 封面与标题同排扫读，视觉决策一步到位",
    costAlt: "对照：改成纯表格反而失去封面吸引力",
    reason: "每件商品都包含「封面图 + 标题 + 价格 + 动作」多种异构字段，且读者靠看图挑款而非逐格比对数字，卡片网格正好发挥所长。",
    previewType: "grid-win"
  },
  {
    id: "flights",
    label: "航班票价与准点率比价",
    verdict: "别用卡片网格",
    tone: "avoid",
    altName: "274 数据表格布局",
    altHref: "https://layout.xiaoxiaodong.ai/274/play/",
    costGrid: "高 · 眼睛要在每张卡里反复找起飞时间、中转与票价位置",
    costAlt: "低 · 同列纵向对齐，0.5 秒扫出最低价与最早班次",
    reason: "用户需要对 5 个以上的同维数值做精确比较。把它们拆进独立圆角卡只会制造多余边框与视线跳跃，直接换用数据表格更高效。",
    previewType: "table"
  },
  {
    id: "feed",
    label: "实时团队动态与通知",
    verdict: "别用卡片网格",
    tone: "avoid",
    altName: "269 信息流布局",
    altHref: "https://layout.xiaoxiaodong.ai/269/play/",
    costGrid: "高 · 多列折行破坏先后时间感，新消息插入会导致整网跳位",
    costAlt: "低 · 单轴连续向下，时间先后一目了然",
    reason: "时间顺序是信息流的第一秩序。一旦摊成 3 列网格，读者搞不清「右下角那条」和「第二行左边那条」谁更新，应改用单轴信息流或时间线。",
    previewType: "feed"
  },
  {
    id: "photo",
    label: "横竖比例悬殊的摄影集",
    verdict: "别硬套等高卡片",
    tone: "avoid",
    altName: "271 瀑布流页面",
    altHref: "https://layout.xiaoxiaodong.ai/271/play/",
    costGrid: "高 · 强制等高框会把竖构图裁掉头脚，或留出大块尴尬白边",
    costAlt: "低 · 顺应每张照片的原始纵横比自然嵌合",
    reason: "标准卡片网格依赖相近的媒体比例。当作品里混着 16:9 横幅与 2:3 竖片时，改用瀑布流或画廊布局才能保住画面完整。",
    previewType: "masonry"
  },
  {
    id: "bento",
    label: "产品核心卖点总览墙",
    verdict: "换成主次拼块更好",
    tone: "avoid",
    altName: "272 便当盒布局",
    altHref: "https://layout.xiaoxiaodong.ai/272/play/",
    costGrid: "中 · 均等卡片把重磅卖点和次要参数摊成一样大",
    costAlt: "低 · 大卡托住核心卖点，小格承接参数，节奏张弛分明",
    reason: "当页面只有 5–7 个固定卖点且主次体量悬殊时，便当盒布局用 2×2 大格与 1×1 小格制造强烈主次，比等大卡片更有视觉张力。",
    previewType: "bento"
  }
];
