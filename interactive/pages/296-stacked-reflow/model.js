// 296 堆叠重排 · 单一数据源与几何/诊断模型
// 所有舞台读数、顺序判定、间距分类、小练习选项与评语均从本文件派生，不另写常量副本。

export const SPECIMENS = {
  features: {
    id: "features",
    label: "产品介绍页",
    context: "文档工具介绍页 · 375px 逻辑视口",
    task: "出差地铁断网急着改稿——按决策轻重落入单列，让最先要确认的核心能力排在 01。",
    goalShort: "地铁断网能不能立刻打开写稿",
    // 按宽屏 2×2 视觉位置乱序排列：左上角是次要项，主任务排在第二格（窄屏挤爆行中完整可见）
    modules: [
      {
        id: "m_perm",
        shape: "square",
        tier: 3,
        widePos: "左上",
        roleDesc: "多人团队才用得上的次要选配",
        title: "权限分级",
        tag: "团队管理",
        summary: "只读、批注与编辑按角色分档，适合多人审校。",
        wideMeta: "团队选配",
      },
      {
        id: "m_offline",
        shape: "circle",
        tier: 1,
        widePos: "右上",
        roleDesc: "决定用户装不装它的核心主任务",
        title: "离线即开",
        tag: "核心能力",
        summary: "文档存在本地，地铁断网照常打开编辑不丢稿。",
        wideMeta: "0 毫秒等待",
      },
      {
        id: "m_history",
        shape: "triangle",
        tier: 2,
        widePos: "左下",
        roleDesc: "紧随编辑流程的防丢保障",
        title: "版本回溯",
        tag: "防丢保障",
        summary: "每次改动自动快照，误删一键退回上一版本。",
        wideMeta: "保留 90 天",
      },
      {
        id: "m_sync",
        shape: "bars",
        tier: 3,
        widePos: "右下",
        roleDesc: "等恢复网络后才触发的补充能力",
        title: "多端续写",
        tag: "联网同步",
        summary: "恢复网络后再增量同步到桌面端继续收尾。",
        wideMeta: "连网后同步",
      },
    ],
  },
  specs: {
    id: "specs",
    label: "电纸书商品页",
    context: "硬件商品详情页 · 375px 逻辑视口",
    task: "挑一台户外强光下能看书又能记笔记的电纸书——按购买轻重排单列，把最关键的排在 01。",
    goalShort: "户外强光下屏幕清不清楚",
    modules: [
      {
        id: "s_case",
        shape: "bars",
        tier: 3,
        widePos: "左上",
        roleDesc: "额外选购的周边配件",
        title: "磁吸保护壳",
        tag: "选配配件",
        summary: "素皮折页支架，另购配色四款可选。",
        wideMeta: "配件选配",
      },
      {
        id: "s_screen",
        shape: "circle",
        tier: 1,
        widePos: "右上",
        roleDesc: "决定户外能不能看清的核心硬件",
        title: "雾面墨水屏",
        tag: "300 PPI",
        summary: "蚀刻防眩玻璃，阳光直射不反光、字迹锐利。",
        wideMeta: "10.3 英寸",
      },
      {
        id: "s_pen",
        shape: "triangle",
        tier: 2,
        widePos: "左下",
        roleDesc: "直接回应记笔记需求的次核心能力",
        title: "压感手写笔",
        tag: "4096 级",
        summary: "电磁笔免充电，落笔延迟压至 21 ms。",
        wideMeta: "倾角识别",
      },
      {
        id: "s_box",
        shape: "square",
        tier: 3,
        widePos: "右下",
        roleDesc: "下单前最后确认的随箱清单",
        title: "接口与包装",
        tag: "随箱清单",
        summary: "USB-C 数据线、替换笔尖三枚与保修卡。",
        wideMeta: "开箱清单",
      },
    ],
  },
};

export function analyzeHeroState(specimenId, stackedIds, overflowPx) {
  const spec = SPECIMENS[specimenId] || SPECIMENS.features;
  const mods = spec.modules;
  const total = mods.length;
  const stackedMods = stackedIds.map((id) => mods.find((m) => m.id === id)).filter(Boolean);
  const stackedCount = stackedMods.length;
  const remainingCount = total - stackedCount;
  const cleanOverflow = remainingCount === 0 ? 0 : Math.max(0, Math.round(overflowPx));
  // 横排里实际剩下的相邻跨列数（n 块横排需要 n-1 次跨列跳转，0 或 1 块为 0）
  const remainingCrossCols = Math.max(0, remainingCount - 1);

  const primary = mods.find((m) => m.tier === 1) || mods[0];
  const secondary = mods.find((m) => m.tier === 2) || mods[1];
  const primaryIdx = stackedIds.indexOf(primary.id); // -1 表示还在横排中
  const primaryPos = primaryIdx >= 0 ? primaryIdx + 1 : 0;
  const secondaryIdx = stackedIds.indexOf(secondary.id);
  const firstMod = stackedMods[0] || null;
  const secondMod = stackedMods[1] || null;

  let priorityText = "横排中";
  let prioritySeverity = "warn";
  if (primaryPos === 1) {
    priorityText = "01 位 · 领头";
    prioritySeverity = "ok";
  } else if (primaryPos > 1) {
    priorityText = `0${primaryPos} 位 · 未领头`;
    prioritySeverity = "warn";
  }

  // 1) 开场未动：0 块入列（绝不提前剧透哪块是主任务，引导用户对照场景任务自己判断）
  if (stackedCount === 0) {
    return {
      stackedCount,
      remainingCount,
      remainingCrossCols,
      overflowPx: cleanOverflow,
      primaryPos,
      priorityText,
      prioritySeverity,
      orderStatus: "idle",
      stateTag: "横向挤爆 · 待重排",
      severity: "warn",
      headline: `4 个模块全挤在一行，实测超出 375px 视口 +${cleanOverflow} px（${remainingCrossCols} 处横向跨列）`,
      why: "别机械从左到右硬堆——宽屏按视觉位置摆在最左的模块，未必是手机首屏最该先看的。先对照上方场景任务判断哪块最决定下一步，把它拖进 01（或点击 / 按 Enter 落位），落位后也能用 ↑ ↓ 或拖动随时调序。",
    };
  }

  // 2) 重排进行中：1–3 块入列
  if (stackedCount < total) {
    const overNote =
      cleanOverflow > 0
        ? `横排仍超出 +${cleanOverflow} px`
        : remainingCrossCols > 0
          ? `横排尚有 ${remainingCrossCols} 处跨列`
          : "余 1 块待归入单列";

    if (firstMod && firstMod.id !== primary.id) {
      const wherePrimary =
        primaryPos > 1
          ? `主任务「${primary.title}」被压在 0${primaryPos} 位`
          : `主任务「${primary.title}」还挤在上方横排里`;
      return {
        stackedCount,
        remainingCount,
        remainingCrossCols,
        overflowPx: cleanOverflow,
        primaryPos,
        priorityText,
        prioritySeverity: "warn",
        orderStatus: "misordered",
        stateTag: "顺序倒挂 · 主任务未领头",
        severity: "warn",
        headline: `01 位被「${firstMod.title}」占了，${wherePrimary}（${overNote}）`,
        why: `海报第一步是「确定信息优先级」。用户打开这页最先确认「${spec.goalShort}」，但「${firstMod.title}」只是${firstMod.roleDesc}，顶在首屏 01 会挡住主线。把「${primary.title}」拖进来并按 ↑ 提到 01，再把剩余模块落齐。`,
      };
    }

    return {
      stackedCount,
      remainingCount,
      remainingCrossCols,
      overflowPx: cleanOverflow,
      primaryPos,
      priorityText,
      prioritySeverity: "ok",
      orderStatus: "good-start",
      stateTag: `重排中 · 主任务已领头（${stackedCount}/4）`,
      severity: "progress",
      headline: `「${primary.title}」已稳坐 01，还剩 ${remainingCount} 块待入单列（${overNote}）`,
      why: `首屏第一眼已经对准「${spec.goalShort}」，落入单列的模块同步翻成标题优先。继续把剩余模块按轻重拖进下方单列——与当前任务紧扣的「${secondary.title}」更适合靠前。`,
    };
  }

  // 3) 4 块全部落入单列：严格检查实际顺序
  if (primaryPos !== 1) {
    return {
      stackedCount,
      remainingCount: 0,
      remainingCrossCols: 0,
      overflowPx: 0,
      primaryPos,
      priorityText,
      prioritySeverity: "warn",
      orderStatus: "misordered",
      stateTag: "溢出清零 · 但顺序倒挂",
      severity: "warn",
      headline: `横向溢出已归零，但主任务「${primary.title}」被压在第 0${primaryPos} 位`,
      why: `只把四块排成一列不算做好堆叠：宽屏按视觉位置摆在左上的「${firstMod.title}」只是${firstMod.roleDesc}，直接堆到手机 01 会让用户打开页面先撞上无关信息。点「${primary.title}」右侧的 ↑（或直接拖动）把它提到 01，让主线领头。`,
    };
  }

  if (secondaryIdx !== 1 && secondMod) {
    return {
      stackedCount,
      remainingCount: 0,
      remainingCrossCols: 0,
      overflowPx: 0,
      primaryPos,
      priorityText,
      prioritySeverity: "ok",
      orderStatus: "partial",
      stateTag: "主任务领头 · 次序可再顺",
      severity: "progress",
      headline: `「${primary.title}」已在 01 领头，但「${secondMod.title}」挡在了「${secondary.title}」前面`,
      why: `首屏已经抓住主任务且横向溢出归零！不过「${secondMod.title}」属于${secondMod.roleDesc}，把与任务直接相关的「${secondary.title}」按 ↑ 调到 02，整条阅读动线从主到次会更顺畅。`,
    };
  }

  return {
    stackedCount,
    remainingCount: 0,
    remainingCrossCols: 0,
    overflowPx: 0,
    primaryPos,
    priorityText,
    prioritySeverity: "ok",
    orderStatus: "clear",
    stateTag: "单列就位 · 顺序清晰",
    severity: "ok",
    headline: `主任务「${primary.title}」领头、次核心紧随，0 px 溢出且一路直落`,
    why: `四块信息一条未删，同时守住了「顺序清晰」与「去横向依赖」：核心任务「${primary.title}」坐镇 01、「${secondary.title}」紧接 02，选配与补充退到后段，视线在 375px 单列里沿一条纵轴顺滑读完。`,
  };
}

// 02 节：WCAG 2.1 SC 1.4.10 Reflow 400% 缩放阶梯
export const ZOOM_LEVELS = [
  {
    zoom: 100,
    cssWidth: 1280,
    cols: 4,
    note: "标准桌面宽度：四栏横向并列充裕，每栏有足够字符宽度。",
  },
  {
    zoom: 200,
    cssWidth: 640,
    cols: 2,
    note: "放大到 200% 时可用宽度减半：若锁死四栏，每栏被压窄或触发横滚；重排先折为两栏。",
  },
  {
    zoom: 300,
    cssWidth: 427,
    cols: 1,
    note: "放大到 300% 已接近手机宽度：两栏也开始挤字，单列堆叠最稳。",
  },
  {
    zoom: 400,
    cssWidth: 320,
    cols: 1,
    note: "WCAG 2.1 SC 1.4.10 基准线（1280px 放大 400% = 320 CSS px）：必须完成单列堆叠且无横向滚动、不丢失内容。",
  },
];

// 03 节：块内层级（三类真实组件 × 三种块内排法，严格按 375px 逻辑视口排版）
export const ANATOMY_SPECS = {
  card: {
    id: "card",
    label: "图文卡片",
    modes: {
      squeeze: {
        label: "横向硬挤",
        badge: "字栏被图标压碎",
        why: "宽屏的「左大图 + 右正文」直接照搬进 375px，图占去近半宽，右侧正文每行只剩七八个字，频繁折行且卡片被拉成细长条。",
      },
      buried: {
        label: "次要项抢跑",
        badge: "标题埋在下面",
        why: "虽然改成了纵向堆叠，却把装饰大图和分类标签堆在最顶上，用户滑进这一块先看到占屏装饰，滚半天还不知道这一块讲什么。",
      },
      titleFirst: {
        label: "标题优先堆叠",
        badge: "标题领头 · 信息跟随",
        why: "把块号与标题推到最顶端，让读者在 0.5 秒内确认「这是什么」，再顺势决定要不要细看下方的缩略图与说明文字。",
      },
    },
  },
  form: {
    id: "form",
    label: "表单输入行",
    modes: {
      squeeze: {
        label: "横向硬挤",
        badge: "标签与输入框互抢宽度",
        why: "桌面端常见的「左标签 + 右输入框」在 375px 里两头受挤：标签被迫断成两行，输入框也缩得看不全自己刚打的邮箱地址。",
      },
      buried: {
        label: "次要项抢跑",
        badge: "提示语压过字段名",
        why: "把辅助说明或隐私提示塞在输入框与标签之间，或者只用浅灰占位符顶替标签，一旦开始输入，用户就忘了这一栏要填什么。",
      },
      titleFirst: {
        label: "标题优先堆叠",
        badge: "字段名在上 · 全宽输入",
        why: "标签独占一行顶在输入框正上方，输入框拿满整条 375px 宽度；手指点按面积翻倍，填表视线沿左缘一条直线往下走。",
      },
    },
  },
  pricing: {
    id: "pricing",
    label: "价格参数条",
    modes: {
      squeeze: {
        label: "横向硬挤",
        badge: "名称、参数、按钮挤撞",
        why: "宽屏一行排开「方案名 + 配额 + 价格 + 按钮」，进 375px 窄屏后文字折成竖条、按钮被挤到角落，核心价格反而淹没在折行里。",
      },
      buried: {
        label: "次要项抢跑",
        badge: "附注先占第一眼",
        why: "把促销小字、计费细则堆在方案标题前面，价格和动作按钮沉到底部，用户扫过两块依然分不清哪一档最适合自己。",
      },
      titleFirst: {
        label: "标题优先堆叠",
        badge: "方案名与价格先定锚",
        why: "第一行直接亮出方案标题与月费定锚，中段单列列出关键配额，底部通栏放操作按钮——主次一眼判清，点按也不误触。",
      },
    },
  },
};

// 04 节：格式塔内外间距诊断（单一数据源，经验舒适区 1.5×–2.5×）
export function analyzeSpacing(innerPad, outerGap) {
  const ratio = outerGap / innerPad;
  const ratioText = `${ratio.toFixed(2)}×`;

  if (ratio <= 1.0) {
    return {
      innerPad,
      outerGap,
      ratio,
      ratioText,
      zone: "sticky",
      label: "边界粘连（外距 ≤ 内距）",
      why: `模块外距（${outerGap}px）小于或等于块内距（${innerPad}px），按韦特海默邻近律，上一块的正文离下一块标题反而更近或一样近，视觉归属立刻串块。`,
    };
  }
  if (ratio < 1.5) {
    return {
      innerPad,
      outerGap,
      ratio,
      ratioText,
      zone: "tight",
      label: "边界偏紧（< 1.5×）",
      why: `外距（${outerGap}px）虽然比内距（${innerPad}px）略大，但落差不够拉开层次；快速下滑时块与块容易连成一片灰墙。`,
    };
  }
  if (ratio <= 2.5) {
    return {
      innerPad,
      outerGap,
      ratio,
      ratioText,
      zone: "comfort",
      label: "节奏清晰（经验值 1.5×–2.5×）",
      why: `外距（${outerGap}px）是块内距（${innerPad}px）的 ${ratioText}，落在常用的 1.5×–2.5× 经验舒适区内：每块内部紧聚成组，块与块之间呼吸利落且不割裂。`,
    };
  }
  return {
    innerPad,
    outerGap,
    ratio,
    ratioText,
    zone: "falseFloor",
    label: "留白过大 · 假底风险（> 2.5×）",
    why: `外距拉到了 ${outerGap}px（内距的 ${ratioText}），模块之间空出大片空白带；手机小屏里下一块很难露头，读者容易误以为页面已经到底。`,
  };
}

// 05 节：原海报 ①→②→③→④ 四步实践要点
export const PIPELINE_STEPS = [
  {
    id: 1,
    num: "①",
    title: "确定信息优先级",
    sub: "先主后次，明确顺序",
    detail: "把决定用户下一步的核心内容排到 01，辅助公告与次要链接退后到 03–04。",
    css: "/* ① HTML 源顺序先主后次 */\n<article> 01 核心概览 → 02 关键指标 → 03 细则 → 04 帮助 </article>",
  },
  {
    id: 2,
    num: "②",
    title: "模块化拆分内容",
    sub: "单元独立，便于重排",
    detail: "把混在一起的标题、摘要与操作包成彼此独立的卡片单元，不依赖跨栏共享背景。",
    css: ".module {\n  display: grid;\n  gap: 8px;\n  padding: 14px;\n}",
  },
  {
    id: 3,
    num: "③",
    title: "垂直堆叠重排",
    sub: "去横向，向下延展",
    detail: "在窄容器里撤销多列并排，让每个模块独占一行、拿满可用宽度并保持标题优先。",
    css: ".stack {\n  display: flex;\n  flex-direction: column;\n}",
  },
  {
    id: 4,
    num: "④",
    title: "检查节奏与间距",
    sub: "间距一致，阅读舒适",
    detail: "统一用容器 gap 控制相邻模块间距（外距明显大于内距且处处等距），守住一条流畅的纵向节奏。",
    css: ".stack {\n  gap: 24px; /* 块间等距，清晰大于块内 12px */\n}",
  },
];

// 06 节：什么时候别硬套堆叠（四场景反例；对比表字段与正文 100% 同源）
export const COMPARE_MODELS = [
  { name: "轻薄款 Air", short: "轻薄 Air", weight: "1.18 kg", battery: "14 小时", screen: "13.6 英寸", ram: "16 GB" },
  { name: "标准款 Base", short: "标准 Base", weight: "1.42 kg", battery: "18 小时", screen: "14.2 英寸", ram: "24 GB" },
  { name: "工作站 Pro", short: "工作站 Pro", weight: "1.85 kg", battery: "20 小时", screen: "16.0 英寸", ram: "32 GB" },
];

export const COMPARE_FIELDS = [
  { key: "weight", label: "重量" },
  { key: "battery", label: "续航" },
  { key: "screen", label: "屏幕" },
  { key: "ram", label: "内存" },
];

export const COUNTER_SCENARIOS = {
  table: {
    id: "table",
    label: "多列参数对比表",
    short: "纵横对照被拆碎",
    badLabel: "硬套堆叠：拆成纵向条目",
    goodLabel: "更稳替代：冻结首列 + 横滑",
    badWhy: "把三款机型的重量、续航、屏幕、内存硬拆成三张纵向卡片后，即便只放 4 项参数，总高也接近手机一整屏；读者想比「Air 和 Pro 谁更轻、屏幕差多少」，视线得跨过中间整张 Base 卡片的 5 行文字上下往返核对（真实商品页若放十几项参数更会拉成好几屏）。正如 Amy Schade（NN/g，2017-09-17）指出的，多维对比表的意义就在同行横比。",
    goodWhy: "遵循 WCAG 2.1 SC 1.4.10 对二维数据表的豁免：用 position: sticky; left: 0 把左侧「参数名」列钉在视口左缘，右侧三款机型列只在表格框内横向滑动并配滑向提示。这样无论滑到哪一款，重量、续航、屏幕、内存四行始终锁在同一条水平线上，视线沿横行一眼就能比完。",
  },
  map: {
    id: "map",
    label: "地图与空间画布",
    short: "空间位置感蒸发",
    badLabel: "硬套堆叠：全拆成文字列表",
    goodLabel: "更稳替代：二维画布 + 底部卡片",
    badWhy: "找地铁口附近的咖啡馆，若把地图压扁拆成一列地址卡片，读者立刻丢失「谁在马路对面、谁绕远路」的二维方位关系。",
    goodWhy: "地图、平面图与白板工具属于天然二维结构：保持可缩放平移的二维画布占主屏，只把单个地点的详情收进底部上拉卡片按需查看。",
  },
  filters: {
    id: "filters",
    label: "长筛选栏堵顶",
    short: "首屏全被筛选吃光",
    badLabel: "硬套堆叠：筛选组全摊在顶部",
    goodLabel: "更稳替代：收进画布外抽屉",
    badWhy: "桌面左侧筛选栏若有价格、品牌、尺寸、配送等十余项，直接堆到手机顶部会把真正要看的商品列表顶到两屏之外，打开页面满眼都是勾选项。",
    goodWhy: "把低频多维筛选收进边界之外的抽屉面板（详见 295 画布外模式），首屏顶部只留一行精简触发条与已选标签，商品列表第一时间露面。",
  },
  split: {
    id: "split",
    label: "对照双栏工作区",
    short: "编辑与预览来回滚断手",
    badLabel: "硬套堆叠：源稿与预览上下长排",
    goodLabel: "更稳替代：折叠双窗格切屏",
    badWhy: "Markdown 写作或代码对比需要频繁对照两处位置；硬堆成上下两段长内容，每改一行都要往下滚半页看预览，再滚回来找光标。",
    goodWhy: "窄屏采用双窗格折叠切换（详见 298 折叠双窗格）或小窗浮层，宽屏再自动展开并排——按任务保持即时对照，而不是机械拼长条。",
  },
};

// 07 节：小练习（严格单变量考「节奏一致」——仅变 02-03 中缝：32 / 24 / 40 / 16）
export const QUIZ_CONFIG = {
  innerPad: 12,
  gapTop: 24,
  gapBot: 24,
  correctGap: 24,
  modules: [
    { num: "01", shape: "circle", title: "需求梳理", sub: "明确页面首要任务" },
    { num: "02", shape: "triangle", title: "内容拆分", sub: "划分独立功能区块" },
    { num: "03", shape: "square", title: "纵向堆叠", sub: "取消窄屏横向依赖" },
    { num: "04", shape: "bars", title: "间距校准", sub: "统一上下呼吸节拍" },
  ],
};

export const QUIZ_OPTIONS = [
  {
    id: "A",
    midGap: 32,
    correct: false,
    groupNote: "自成两组（01+02 ｜ 03+04）",
    reason: "A 版的 02–03 间距悄悄拉大到了 32px（比上下 24px 多 8px）。按韦特海默（Wertheimer）邻近律，距离更近的元素会被大脑自动归为一组，于是四个同级模块在没有任何标题分隔的情况下，默默裂成了「01+02」和「03+04」两组。",
  },
  {
    id: "B",
    midGap: 24,
    correct: true,
    groupNote: "四块等距（24 / 24 / 24 px）",
    reason: "选对了！B 版三道模块缝都是 24px（同时明显大于 12px 的块内距）。四个同级模块拥有完全一致的呼吸节拍，既不会粘连串块，也不会凭空制造误导性的上下分组。",
  },
  {
    id: "C",
    midGap: 40,
    correct: false,
    groupNote: "明显断层（01+02 ‖ 03+04）",
    reason: "C 版的 02–03 间距宽达 40px，在四块正中劈开一道大豁口。按邻近律，读者几乎一定会以为 01–02 是上半章、03–04 是另起一段的新章节，破坏了原海报强调的「节奏一致」。",
  },
  {
    id: "D",
    midGap: 16,
    correct: false,
    groupNote: "中段粘连（01 ｜ 02+03 ｜ 04）",
    reason: "D 版的 02–03 间距收紧到了 16px，反而比上下两缝（24px）更窄。按邻近律，02 和 03 会先粘成更亲近的一对，把 01 和 04 甩在首尾两头，节奏同样失衡。",
  },
];

export function describeQuizOption(opt) {
  const gaps = [QUIZ_CONFIG.gapTop, opt.midGap, QUIZ_CONFIG.gapBot];
  const delta = opt.midGap - QUIZ_CONFIG.correctGap;
  const deltaText = delta === 0 ? "三缝完全一致" : delta > 0 ? `中缝多出 +${delta}px` : `中缝缩窄 ${delta}px`;
  return {
    ...opt,
    gaps,
    gapSeqText: `${gaps[0]} / ${gaps[1]} / ${gaps[2]} px`,
    deltaText,
  };
}

// 同小类 291–300 其余九页速览
export const SIBLINGS = [
  { id: "291", name: "大体流动模式", note: "大屏居中留白，小屏才顺次堆成单列。" },
  { id: "292", name: "列下落模式", note: "随宽度一步步把外侧列掉到下方，而非一次全堆。" },
  { id: "293", name: "布局切换模式", note: "跨断点直接重组整页骨架，改动比堆叠更大。" },
  { id: "294", name: "微调模式", note: "骨架不变，只调字号、留白与边距微幅适配。" },
  { id: "295", name: "画布外模式", note: "把导航或长筛选收进屏幕边界外，按需拉入。" },
  { id: "297", name: "顺序重排", note: "不仅堆成单列，还主动改写各模块之间的出场先后。" },
  { id: "298", name: "折叠双窗格", note: "宽屏双栏对照、窄屏折叠切换，适合工具型界面。" },
  { id: "299", name: "自适应网格", note: "按卡片最小宽度自动增减列数，不必逐断点手写。" },
  { id: "300", name: "组件级响应布局", note: "让单个组件看自身容器宽度重排，而非盯整屏尺寸。" },
];
