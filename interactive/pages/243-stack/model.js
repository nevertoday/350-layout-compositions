// 243 堆栈 STACK · 单真源几何、间距归属与诊断引擎
// 开场活体堆栈、2D 游标尺画布、三支柱实况灯、生成 CSS 与白话诊单全部从此模块实算。

export const GAP_MIN = 0;
export const GAP_MAX = 48;
export const GAP_SWEET_MIN = 12; // 经验参考带下限（px）
export const GAP_SWEET_MAX = 32; // 经验参考带上限（px）

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报三段",
    badge: "POSTER",
    blocks: [
      {
        id: "head",
        rank: 1,
        tone: "cream",
        icon: "person",
        title: "头部",
        sub: "概括主题 · 吸引注意力",
        chip: "01 HEADER",
        height: 76,
        badMt: 18,
        badMb: 6,
      },
      {
        id: "body",
        rank: 2,
        tone: "pink",
        icon: "doc",
        title: "内容",
        sub: "层层递进 · 结构清晰",
        chip: "02 CONTENT",
        height: 76,
        badMt: 30,
        badMb: 4,
      },
      {
        id: "action",
        rank: 3,
        tone: "olive",
        icon: "gear",
        title: "操作区",
        sub: "执行操作 · 完成任务",
        chip: "03 ACTION",
        height: 76,
        badMt: 6,
        badMb: 26,
      },
    ],
    extras: [
      {
        id: "extra-note",
        rank: 2,
        tone: "cream",
        icon: "note",
        title: "补充说明",
        sub: "临时插入的提示或摘录",
        chip: "ADD-ON",
        height: 66,
        badMt: 22,
        badMb: 8,
      },
      {
        id: "extra-meta",
        rank: 2,
        tone: "pink",
        icon: "check",
        title: "校验摘要",
        sub: "新增模块自动继承父级节奏",
        chip: "ADD-ON",
        height: 66,
        badMt: 8,
        badMb: 20,
      },
    ],
    // 开场刻意打乱顺序：操作区跑顶、头部压底
    brokenOrder: ["action", "body", "head"],
  },
  form: {
    id: "form",
    label: "注册表单栈",
    badge: "FORM",
    blocks: [
      {
        id: "head",
        rank: 1,
        tone: "cream",
        icon: "person",
        title: "创建工作区账号",
        sub: "只需填写邮箱与口令，约 30 秒完成",
        chip: "01 TITLE",
        height: 76,
        badMt: 16,
        badMb: 6,
      },
      {
        id: "body",
        rank: 2,
        tone: "pink",
        icon: "doc",
        title: "邮箱与密码字段",
        sub: "输入区逐项垂直排列，减少眼球折返",
        chip: "02 FIELDS",
        height: 76,
        badMt: 28,
        badMb: 4,
      },
      {
        id: "action",
        rank: 3,
        tone: "olive",
        icon: "gear",
        title: "立即注册并进入",
        sub: "主提交按钮稳落流程终点",
        chip: "03 SUBMIT",
        height: 76,
        badMt: 6,
        badMb: 24,
      },
    ],
    extras: [
      {
        id: "extra-note",
        rank: 2,
        tone: "cream",
        icon: "note",
        title: "口令强度提示",
        sub: "动态插入校验条不挤乱下方按钮",
        chip: "VALIDATE",
        height: 66,
        badMt: 20,
        badMb: 8,
      },
      {
        id: "extra-meta",
        rank: 2,
        tone: "pink",
        icon: "check",
        title: "隐私与条款勾选",
        sub: "按序插在输入项与提交按钮之间",
        chip: "CONSENT",
        height: 66,
        badMt: 10,
        badMb: 18,
      },
    ],
    brokenOrder: ["action", "body", "head"],
  },
  article: {
    id: "article",
    label: "文章阅读流",
    badge: "ARTICLE",
    blocks: [
      {
        id: "head",
        rank: 1,
        tone: "cream",
        icon: "person",
        title: "为什么间距属于容器",
        sub: "刊头题名 · 作者与发布日期",
        chip: "01 HEADLINE",
        height: 76,
        badMt: 18,
        badMb: 6,
      },
      {
        id: "body",
        rank: 2,
        tone: "pink",
        icon: "doc",
        title: "正文论述段落",
        sub: "沿单一纵轴层层展开论据与案例",
        chip: "02 BODY",
        height: 76,
        badMt: 32,
        badMb: 4,
      },
      {
        id: "action",
        rank: 3,
        tone: "olive",
        icon: "gear",
        title: "收藏 · 转发 · 评论",
        sub: "读完后自然衔接的互动操作栏",
        chip: "03 ACTIONS",
        height: 76,
        badMt: 6,
        badMb: 26,
      },
    ],
    extras: [
      {
        id: "extra-note",
        rank: 2,
        tone: "cream",
        icon: "note",
        title: "编者按摘录",
        sub: "中途加插引文块，上下节拍不变",
        chip: "QUOTE",
        height: 66,
        badMt: 22,
        badMb: 6,
      },
      {
        id: "extra-meta",
        rank: 2,
        tone: "pink",
        icon: "check",
        title: "延伸阅读卡片",
        sub: "插入参考条目，操作区顺延下移",
        chip: "RELATED",
        height: 66,
        badMt: 8,
        badMb: 22,
      },
    ],
    brokenOrder: ["action", "body", "head"],
  },
};

export function createInitialState(themeId = "poster") {
  const theme = THEMES[themeId] || THEMES.poster;
  const byId = Object.fromEntries(theme.blocks.map((b) => [b.id, b]));
  return {
    themeId: theme.id,
    blocks: theme.brokenOrder.map((id) => ({ ...byId[id] })),
    extraCursor: 0,
    gap: 4, // 0..48 px，开场刻意粘连
    owner: "child-margin", // "child-margin" | "owl" | "gap" | "negative"
    heightMode: "fixed", // "fixed" | "auto"
    splitLast: false, // 末项 margin-block-start: auto 推底
  };
}

export function createHealthyPreset(themeId = "poster", variant = "poster") {
  const theme = THEMES[themeId] || THEMES.poster;
  const base = theme.blocks.map((b) => ({ ...b }));
  if (variant === "compact") {
    return {
      themeId: theme.id,
      blocks: base,
      extraCursor: 0,
      gap: 16,
      owner: "owl",
      heightMode: "auto",
      splitLast: false,
    };
  }
  if (variant === "split") {
    return {
      themeId: theme.id,
      blocks: base,
      extraCursor: 0,
      gap: 20,
      owner: "gap",
      heightMode: "auto",
      splitLast: true,
    };
  }
  return {
    themeId: theme.id,
    blocks: base,
    extraCursor: 0,
    gap: 22,
    owner: "gap",
    heightMode: "auto",
    splitLast: false,
  };
}

// 计算任意状态下每一块卡片的真实几何位置、外边距泄漏、塌陷与裁切
export function evaluateStack(state) {
  const blocks = state.blocks;
  const n = blocks.length;
  const gap = Math.round(Math.max(GAP_MIN, Math.min(GAP_MAX, state.gap)));
  const owner = state.owner;
  const heightMode = state.heightMode;
  const splitLast = Boolean(state.splitLast);

  const FIXED_LIMIT = 216; // 写死高度模式下的裁剪上限（保证 3 张 76px 卡必被腰斩）
  const SPLIT_MIN_H = 340; // 开启末项推底时的容器最小高度示意

  let topLeak = 0;
  let bottomLeak = 0;
  let totalCollapse = 0;
  let totalOverlap = 0;

  const items = [];
  const seams = [];
  let cursorY = 0;

  for (let i = 0; i < n; i++) {
    const b = blocks[i];
    let gapBefore = 0;
    let seamKind = "clean";
    let seamDetail = "";
    let collapsed = 0;

    if (i === 0) {
      if (owner === "child-margin") {
        // 块级首子项 margin-top 与无阻隔父容器发生父子塌陷，直接顶漏到容器外
        topLeak = Math.max(8, Math.round(b.badMt + gap * 0.25));
      } else if (owner === "negative") {
        topLeak = 0;
      }
    } else {
      const prev = blocks[i - 1];
      if (owner === "child-margin") {
        // 相邻子项各写各的 margin，发生外边距塌陷 max(prev.mb, curr.mt)
        const prevMb = Math.round(prev.badMb + gap * 0.2);
        const currMt = Math.round(b.badMt + gap * 0.35);
        gapBefore = Math.max(prevMb, currMt);
        collapsed = Math.min(prevMb, currMt);
        totalCollapse += collapsed;
        seamKind = "collapse";
        seamDetail = `塌陷 max(${prevMb},${currMt})=${gapBefore}px`;
      } else if (owner === "negative") {
        gapBefore = -18;
        totalOverlap += 18;
        seamKind = "overlap";
        seamDetail = `负边距撞车 -18px`;
      } else if (owner === "owl") {
        gapBefore = gap;
        seamKind = gap < GAP_SWEET_MIN ? "tight" : gap > GAP_SWEET_MAX ? "loose" : "clean";
        seamDetail = `* + * · ${gap}px`;
      } else {
        gapBefore = gap;
        seamKind = gap < GAP_SWEET_MIN ? "tight" : gap > GAP_SWEET_MAX ? "loose" : "clean";
        seamDetail = `gap · ${gap}px`;
      }

      seams.push({
        index: i - 1,
        y: cursorY,
        size: gapBefore,
        kind: seamKind,
        detail: seamDetail,
        collapsed,
      });
      cursorY += gapBefore;
    }

    items.push({
      ...b,
      index: i,
      y: cursorY,
      gapBefore,
      seamKind,
      seamDetail,
      collapsed,
      splitPush: 0,
    });
    cursorY += b.height;
  }

  if (n > 0 && owner === "child-margin") {
    bottomLeak = Math.max(10, Math.round(blocks[n - 1].badMb + gap * 0.25));
  }

  const naturalHeight = Math.max(0, cursorY);
  let splitPushPx = 0;
  let containerHeight = naturalHeight;
  let clippedPx = 0;

  if (heightMode === "fixed") {
    containerHeight = FIXED_LIMIT;
    clippedPx = Math.max(0, naturalHeight - FIXED_LIMIT);
  } else if (splitLast && n >= 2 && (owner === "gap" || owner === "owl")) {
    const targetH = Math.max(naturalHeight + 44, SPLIT_MIN_H);
    splitPushPx = targetH - naturalHeight;
    containerHeight = targetH;
    const lastIdx = n - 1;
    items[lastIdx].y += splitPushPx;
    items[lastIdx].splitPush = splitPushPx;
    if (seams.length > 0) {
      const lastSeam = seams[seams.length - 1];
      lastSeam.size += splitPushPx;
      lastSeam.kind = "split";
      lastSeam.detail = `auto 推底 +${splitPushPx}px`;
    }
  }

  // 检查四项核心指标
  let orderInversions = 0;
  for (let i = 1; i < n; i++) {
    if (blocks[i].rank < blocks[i - 1].rank) orderInversions++;
  }
  const hasHead = blocks.some((b) => b.rank === 1);
  const hasAction = blocks.some((b) => b.rank === 3);
  const headAfterAction =
    hasHead &&
    hasAction &&
    blocks.findIndex((b) => b.rank === 1) > blocks.findIndex((b) => b.rank === 3);

  const orderOk = n >= 2 && orderInversions === 0;
  const ownerOk = owner === "owl" || owner === "gap";
  const seamValues = seams.map((s) => s.size);
  const minSeam = seamValues.length ? Math.min(...seamValues) : 0;
  const maxSeam = seamValues.length ? Math.max(...seamValues) : 0;
  const seamSpread = maxSeam - minSeam;

  const rhythmOk =
    n >= 2 &&
    ownerOk &&
    gap >= GAP_SWEET_MIN &&
    gap <= GAP_SWEET_MAX;

  const extendOk = heightMode === "auto" && n >= 2;

  const passedCount = [orderOk, ownerOk, rhythmOk, extendOk].filter(Boolean).length;

  // 生成单真源实时 CSS 代码
  let cssSnippet = "";
  if (owner === "child-margin") {
    cssSnippet = `.stack {\n  display: block;${heightMode === "fixed" ? `\n  height: ${FIXED_LIMIT}px; overflow: hidden;` : ""}\n}\n.card-1 { margin: ${blocks[0]?.badMt ?? 18}px 0 ${blocks[0]?.badMb ?? 6}px; }\n.card-2 { margin: ${blocks[1]?.badMt ?? 30}px 0 ${blocks[1]?.badMb ?? 4}px; } /* 各自乱写，易漏边塌陷 */`;
  } else if (owner === "negative") {
    cssSnippet = `.stack > * + * {\n  margin-block-start: -18px; /* 负边距强拉，互相盖字 */\n}${heightMode === "fixed" ? `\n.stack { height: ${FIXED_LIMIT}px; overflow: hidden; }` : ""}`;
  } else if (owner === "owl") {
    cssSnippet = `.stack {\n  display: flex;\n  flex-direction: column;${heightMode === "fixed" ? `\n  height: ${FIXED_LIMIT}px; overflow: hidden;` : ""}\n}\n.stack > * { margin-block: 0; }\n.stack > * + * { margin-block-start: ${gap}px; }${splitLast && heightMode === "auto" ? `\n.stack > :last-child { margin-block-start: auto; }` : ""}`;
  } else {
    cssSnippet = `.stack {\n  display: flex;\n  flex-direction: column;\n  gap: ${gap}px;${heightMode === "fixed" ? `\n  height: ${FIXED_LIMIT}px; overflow: hidden;` : ""}\n}\n.stack > * { margin: 0; }${splitLast && heightMode === "auto" ? `\n.stack > :last-child { margin-block-start: auto; }` : ""}`;
  }

  // 单真源诊断（按最要紧的结构问题优先提示）
  let diagCode = "healthy";
  let diagBadge = "达标 · 稳固堆栈";
  let diagTone = "ok";
  let diagTitle = "";
  let diagBody = "";
  let diagNext = "";

  if (n < 2) {
    diagCode = "too-few";
    diagBadge = "待补充模块";
    diagTone = "err";
    diagTitle = `只剩 ${n} 个模块，构不成「相邻间距」关系`;
    diagBody = "堆栈的核心在于管理兄弟元素之间的垂直节拍。只剩孤零零一块时，看不出顺序递进，也验证不了父级间距是否稳定。";
    diagNext = "点「+ 插入模块」加回至少 2 个模块，再观察父容器如何自动分配间距。";
  } else if (owner === "negative") {
    diagCode = "negative";
    diagBadge = "错态 · 负边距撞车";
    diagTone = "err";
    diagTitle = `相邻卡片互相压进 18px（累计叠撞 ${totalOverlap}px）`;
    diagBody = "用负外边距强行收紧垂直流时，后一块会直接盖住前一块的底边与副标题，点击热区也互相抢占，堆栈退化成了遮挡事故。";
    diagNext = "把「间距归属」切回「父容器 * + *」或「父容器 flex + gap」，立即解除碰撞。";
  } else if (!ownerOk) {
    diagCode = "child-margin";
    diagBadge = `错态 · 子项漏边 (${passedCount}/4)`;
    diagTone = "err";
    diagTitle = `外边距写死在子项里：顶漏 ${topLeak}px、底拖 ${bottomLeak}px、缝隙差 ${seamSpread}px`;
    diagBody = `每张卡片自己背着互不相等的 margin，顶块外边距漏出容器顶边，底块拖出死白尾巴，相邻块还触发了 ${totalCollapse}px 外边距塌陷。只要换序或删块，整列节奏立刻错位。`;
    diagNext = "先把「间距归属」改交给父容器（选「父容器 * + *」或「父容器 flex + gap」）。";
  } else if (!orderOk) {
    diagCode = "wrong-order";
    diagBadge = `错态 · 顺序倒错 (${passedCount}/4)`;
    diagTone = "err";
    diagTitle = headAfterAction
      ? "「操作区」跑到了「头部」上面，阅读与决策顺序翻车"
      : `当前存在 ${orderInversions} 处顺序逆转，视线来回折返`;
    diagBody = "垂直堆栈利用人眼从上到下的单轨扫视建立因果：先概括主题（头部），再层层说明（内容），最后才让人做决定（操作区）。顺序一倒，用户没看清背景就先撞上按钮。";
    diagNext = "直接点卡片右侧的 ↑ / ↓ 箭头，把模块理顺为「头部 → 内容 → 操作区」。";
  } else if (!extendOk) {
    diagCode = "fixed-clip";
    diagBadge = `错态 · 定高腰斩 (${passedCount}/4)`;
    diagTone = "err";
    diagTitle = `容器锁死 ${FIXED_LIMIT}px，底部被硬生生裁掉 ${clippedPx}px`;
    diagBody = "海报第三条原则写着「易于扩展：模块灵活增删」。一旦给堆栈写死 height 并隐藏溢出，新增一个提示条或正文多换两行，最底下的操作区就会直接消失。";
    diagNext = "把「容器高度」切为「自然流 auto」，让外框随内容数量自由伸缩。";
  } else if (gap < GAP_SWEET_MIN) {
    diagCode = "too-tight";
    diagBadge = `错态 · 过挤粘连 (${passedCount}/4)`;
    diagTone = "err";
    diagTitle = `间距压到 ${gap}px，卡片与偏移阴影撞成一堵墙`;
    diagBody = "垂直间距低于经验下限（约 12px）时，邻近性信号过强，相邻模块失去了停顿间隙。眼睛一眼扫下去分辨不出几块各自起止在哪。";
    diagNext = "向右拖动上方「间距游标尺」（或按 → 键），把间距调进 12px–32px 经验参考带。";
  } else if (gap > GAP_SWEET_MAX) {
    diagCode = "too-loose";
    diagBadge = `错态 · 过散断链 (${passedCount}/4)`;
    diagTone = "err";
    diagTitle = `间距拉到 ${gap}px，模块漂成互不相连的孤岛`;
    diagBody = "垂直空隙超出经验上限（约 32px）且远大于组内行距时，眼球跨越空白的成本骤增，读者会误以为下方内容已经属于另一块毫不相干的区域。";
    diagNext = "向左拉回「间距游标尺」（或按 ← 键），把间距收进 12px–32px 经验参考带。";
  } else {
    const methodLabel = owner === "owl" ? "猫头鹰选择器 * + *" : "Flexbox gap";
    const feel = gap <= 17 ? "紧凑信息密度" : gap <= 25 ? "标准呼吸节拍" : "舒展杂志留白";
    diagCode = "healthy";
    diagBadge = `4 / 4 堆栈成立 · ${feel}`;
    diagTone = "ok";
    diagTitle = `${methodLabel} 统一管住 ${gap}px 节拍，顶底零漏边、增删不乱序`;
    diagBody = splitLast
      ? `容器自然撑高并把操作区顺势推落底端（额外留白 +${splitPushPx}px）。试着再点「+ 插入模块」或「× 删块」，你会发现无论怎么变动，头部、内容与操作区的边缘都严丝合缝。`
      : `全部 ${n} 块模块沿纵轴按「头 → 容 → 操」顺序排布，上下边距归零、所有相邻缝隙严守 ${gap}px。试着点「+ 插入模块」或改用另一种父容器写法，同样稳固成立。`;
    diagNext = "可以继续测试「+ 插入模块」「末项推底」或切换「注册表单 / 文章阅读」题材验证复用性。";
  }

  // 三枚原海报支柱实况灯
  const pillars = {
    vertical: {
      ok: rhythmOk && ownerOk,
      tag: owner === "negative" ? "负距撞车" : !ownerOk ? "缝差 " + seamSpread + "px" : gap < GAP_SWEET_MIN ? `过挤 ${gap}px` : gap > GAP_SWEET_MAX ? `过散 ${gap}px` : `统一 ${gap}px`,
    },
    order: {
      ok: orderOk,
      tag: n < 2 ? `仅 ${n} 块` : orderOk ? "顺序清晰" : headAfterAction ? "头尾倒置" : `逆序 ${orderInversions} 处`,
    },
    spacing: {
      ok: ownerOk && extendOk,
      tag: !ownerOk ? `漏边 ${topLeak + bottomLeak}px` : !extendOk ? `裁切 ${clippedPx}px` : splitLast ? "可扩 + 推底" : `无损 ${n} 块`,
    },
  };

  return {
    gap,
    owner,
    heightMode,
    splitLast,
    blocks: items,
    seams,
    topLeak,
    bottomLeak,
    totalCollapse,
    totalOverlap,
    naturalHeight,
    containerHeight,
    clippedPx,
    splitPushPx,
    minSeam,
    maxSeam,
    seamSpread,
    orderOk,
    ownerOk,
    rhythmOk,
    extendOk,
    passedCount,
    allOk: passedCount === 4,
    cssSnippet,
    diag: {
      code: diagCode,
      badge: diagBadge,
      tone: diagTone,
      title: diagTitle,
      body: diagBody,
      next: diagNext,
    },
    pillars,
  };
}

// =========================================================================
// 第 01 节：三步维护动作对照（子项 margin-bottom vs 父容器 Stack gap）
// =========================================================================
export const MUTATION_ACTIONS = {
  baseline: {
    id: "baseline",
    label: "初始三块",
    leftTitle: "看起来差不多，但底部多出 20px 死白",
    leftItems: [
      { id: "a", name: "头部", tone: "cream", mb: 20 },
      { id: "b", name: "内容", tone: "pink", mb: 20 },
      { id: "c", name: "操作区", tone: "olive", mb: 20, tailLeak: true },
    ],
    rightTitle: "父容器 gap: 20px，只在相邻两块之间加空隙",
    rightItems: [
      { id: "a", name: "头部", tone: "cream" },
      { id: "b", name: "内容", tone: "pink" },
      { id: "c", name: "操作区", tone: "olive" },
    ],
    summary: "平时没人改动时，两者差距容易被忽略；只有最后一块屁股后面拖着一条 20px 的尾巴外边距，让卡片上下内边距看着一紧一松。",
  },
  "remove-last": {
    id: "remove-last",
    label: "删掉最后一块",
    leftTitle: "原本给末块写的 :last-child { margin: 0 } 失效或残留尾巴",
    leftItems: [
      { id: "a", name: "头部", tone: "cream", mb: 20 },
      { id: "b", name: "内容（带原 20px 尾距）", tone: "pink", mb: 20, tailLeak: true },
    ],
    rightTitle: "删掉后剩余两块自动收紧底边，零补丁",
    rightItems: [
      { id: "a", name: "头部", tone: "cream" },
      { id: "b", name: "内容", tone: "pink" },
    ],
    summary: "当产品临时下线「操作区」时，靠子项写死 .action { margin-bottom: 0 } 的旧代码立刻露馅——「内容」块带着它的 20px 外边距裸露在底边；而父容器 gap 天然只在两块之间生效。",
  },
  "insert-banner": {
    id: "insert-banner",
    label: "顶部插入公告条",
    leftTitle: "新组件忘写 margin，直接贴死在头部上面（0px 撞车）",
    leftItems: [
      { id: "n", name: "新公告条（无自带 margin）", tone: "olive", mb: 0, crash: true },
      { id: "a", name: "头部", tone: "cream", mb: 20 },
      { id: "b", name: "内容", tone: "pink", mb: 20 },
      { id: "c", name: "操作区", tone: "olive", mb: 20, tailLeak: true },
    ],
    rightTitle: "新组件零样式接入，自动拿到 20px 统一间距",
    rightItems: [
      { id: "n", name: "新公告条", tone: "olive" },
      { id: "a", name: "头部", tone: "cream" },
      { id: "b", name: "内容", tone: "pink" },
      { id: "c", name: "操作区", tone: "olive" },
    ],
    summary: "复用别人的干净组件时，它本身不该知道外面需要留多少像素。如果靠组件自带 margin，插进来就会贴死；交给父容器 Stack 后，放进什么都能即插即用。",
  },
  "swap-order": {
    id: "swap-order",
    label: "上下调换模块",
    leftTitle: "专给原末块写的零外边距跟着跑到顶上，前两块撞在一起",
    leftItems: [
      { id: "c", name: "提示区（原写 margin-bottom: 0）", tone: "olive", mb: 0, crash: true },
      { id: "a", name: "头部", tone: "cream", mb: 20 },
      { id: "b", name: "内容", tone: "pink", mb: 20, tailLeak: true },
    ],
    rightTitle: "任意重排，缝隙永远锁死 20px，头尾齐平",
    rightItems: [
      { id: "c", name: "提示区", tone: "olive" },
      { id: "a", name: "头部", tone: "cream" },
      { id: "b", name: "内容", tone: "pink" },
    ],
    summary: "只要间距绑在「谁是哪一个组件」上，一调顺序就会把特殊补丁一起带歪；父容器规则只认「相邻位置」，不认组件身份，这才是原海报「易于扩展 = SPACING」的真相。",
  },
};

// =========================================================================
// 第 02 节：嵌套堆栈比例尺计算
// =========================================================================
export function evaluateNesting(outerGap, innerGap) {
  const outer = Math.round(outerGap);
  const inner = Math.round(innerGap);
  const ratio = inner > 0 ? +(outer / inner).toFixed(2) : 9.99;

  let tone = "ok";
  let verdict = "外疏内紧 · 层级清晰";
  let detail = `外层区块距 ${outer}px 是内层组件距 ${inner}px 的 ${ratio.toFixed(1)} 倍（经验参考带约 1.8×–3.5×）。读者不用看分割线，一眼就能把每个标题和紧贴它的正文归成同一组。`;

  if (outer < inner) {
    tone = "err";
    verdict = "内外倒挂 · 归属错乱";
    detail = `内层距（${inner}px）反而大于外层距（${outer}px），比值仅 ${ratio.toFixed(2)}×。标题离上一组正文比离自己正文还近，邻近性信号完全反了。`;
  } else if (ratio < 1.5) {
    tone = "err";
    verdict = "内外趋同 · 糊成平墙";
    detail = `外层 ${outer}px 与内层 ${inner}px 比值只有 ${ratio.toFixed(2)}×，所有行距看起来差不多。哪怕外层是标准堆栈，因为没有嵌套拉出级差，版面依然显得平淡难扫。`;
  } else if (inner < 6) {
    tone = "warn";
    verdict = "内层过挤 · 字行相撞";
    detail = `外内比值虽达 ${ratio.toFixed(1)}×，但内层只有 ${inner}px，标题下缘和正文第一行贴得太紧，移动端读起来容易发闷。`;
  } else if (outer > 42 || ratio > 4.5) {
    tone = "warn";
    verdict = "外层过阔 · 上下脱节";
    detail = `外层拉到 ${outer}px（内层 ${ratio.toFixed(1)} 倍），大块空白让下方的操作区仿佛不属于这张卡片。`;
  }

  return { outer, inner, ratio, tone, verdict, detail };
}

// =========================================================================
// 第 03 节：外边距塌陷暗室（4 种 CSS 写法精确盒模型计算）
// =========================================================================
export const COLLAPSE_MODES = {
  "block-margin": {
    id: "block-margin",
    label: "块级双写 margin",
    badge: "触发塌陷与顶漏",
    tone: "err",
    topLeak: 20,
    seam1: 24,
    seam1Formula: "max(24px, 16px) = 24px（16px 被吞掉）",
    seam2: 24,
    seam2Formula: "max(24px, 12px) = 24px（12px 被吞掉）",
    bottomLeak: 20,
    splitPush: 0,
    code: `.box { display: block; }\n.item-a { margin: 20px 0 24px; }\n.item-b { margin: 16px 0 24px; }\n.item-c { margin: 12px 0 20px; }`,
    explain: "普通文档流里，相邻块级元素的上下 margin 不会相加，而是取较大值合并（塌陷）；更棘手的是，当父容器没有 border 或 padding 阻隔时，首尾子项的外边距会直接穿透父框，把整个卡片莫名往下推 20px。",
  },
  owl: {
    id: "owl",
    label: "猫头鹰 * + *",
    badge: "单向流 · 零漏边",
    tone: "ok",
    topLeak: 0,
    seam1: 20,
    seam1Formula: "仅第 2 块加 margin-block-start: 20px",
    seam2: 20,
    seam2Formula: "仅第 3 块加 margin-block-start: 20px",
    bottomLeak: 0,
    splitPush: 0,
    code: `.stack > * { margin-block: 0; }\n.stack > * + * {\n  margin-block-start: 20px;\n}`,
    explain: "Heydon Pickering 2014 年提出的「猫头鹰选择器」：先清零子项上下外边距，再只给「前面紧挨着兄弟的元素」加上方外边距。第一块永远顶齐、最后一块永远贴底，彻底绕开双边相加与首尾漏边。",
  },
  "flex-gap": {
    id: "flex-gap",
    label: "Flex + gap",
    badge: "现代首选 · 无塌陷",
    tone: "ok",
    topLeak: 0,
    seam1: 20,
    seam1Formula: "父容器 gap 统一插入 20px 轨道",
    seam2: 20,
    seam2Formula: "父容器 gap 统一插入 20px 轨道",
    bottomLeak: 0,
    splitPush: 0,
    code: `.stack {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}`,
    explain: "Flex 容器天然建立独立格式化上下文，彻底终结外边距塌陷；gap 只存在于子项之间的缝隙，不会碰触任何子元素的 margin 属性。2021 年 4 月起现代浏览器全线支持，是今天实现堆栈最干净的一行写法。",
  },
  "flex-split": {
    id: "flex-split",
    label: "Flex + 末项推底",
    badge: "Every Layout · Split",
    tone: "ok",
    topLeak: 0,
    seam1: 20,
    seam1Formula: "头与内容紧守 20px 节奏",
    seam2: 68,
    seam2Formula: "gap 20px + auto 推底 48px",
    bottomLeak: 0,
    splitPush: 48,
    code: `.stack {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n  min-height: 280px;\n}\n.stack > :last-child {\n  margin-block-start: auto;\n}`,
    explain: "当卡片需要对齐等高网格（例如三张并排定价卡），把最后一块「操作区」设上 margin-block-start: auto，就能在保留上方统一 gap 的同时，把按钮稳稳推到卡片最底沿，绝不破坏扩展性。",
  },
};

// =========================================================================
// 第 04 节：可核实的历史脉络
// =========================================================================
export const TIMELINE = [
  {
    year: "1998",
    title: "CSS2 确立块级流与外边距塌陷",
    who: "W3C CSS Level 2",
    body: "早期网页以长文章为主，W3C 规定相邻段落的上下 margin 合并取大值，让标题与段落自然融合。这套机制对纯文章很聪明，却为日后的组件化 UI 埋下了外边距穿出容器与状态耦连的难题。",
    tag: "文档流起点",
  },
  {
    year: "2014",
    title: "《公理化 CSS 与猫头鹰选择器》",
    who: "Heydon Pickering · A List Apart（2014-10-21）",
    body: "Heydon Pickering 用形似猫头鹰眼睛的 * + * 选择器提出：间距不应写死在具体组件类上，而应是一条作用于相邻关系的上下文公理。这是现代堆栈原语最直接的思想源头。",
    tag: "* + * 诞生",
  },
  {
    year: "2015",
    title: "iOS 9 推出 UIStackView",
    who: "Apple · UIKit",
    body: "原生客户端同样饱受手写坐标与约束之苦。Apple 引入非渲染容器 UIStackView，把分布、对齐和固定间距收拢进一层声明式堆栈，成为移动端垂直编排的标准构件。",
    tag: "原生客户端汇聚",
  },
  {
    year: "2019",
    title: "Every Layout、SwiftUI VStack 与 Figma Auto Layout",
    who: "Heydon Pickering & Andy Bell · Apple · Figma · SEEK Braid",
    body: "2019 年成为「堆栈原语」跨越设计稿与代码的合流之年：Every Layout 正式命名并算法化「The Stack」；Apple 发布 SwiftUI 并以 VStack 作为最核心纵轴容器；SEEK 开源 Braid 设计系统推广 &lt;Stack space&gt; 组件；年底 Figma 上线 Auto Layout，让设计师与工程师共享同一套纵轴间距心智。",
    tag: "全行业定名",
  },
  {
    year: "2020",
    title: "《外边距有害论》推动组件去 margin 化",
    who: "Max Stoiber（2020-03）",
    body: "styled-components 作者 Max Stoiber 发表《Margin considered harmful》，明确指出外边距破坏组件封装性——组件不该决定自己以外的空间，所有外部距离都应交给 Stack 等布局原语统一调度。",
    tag: "封装共识",
  },
  {
    year: "2021",
    title: "Safari 14.1 补齐最后拼图，Flexbox gap 全面落地",
    who: "W3C CSS Box Alignment Level 3 · 现代浏览器（2021-04）",
    body: "随着 Safari 14.1 与 iOS Safari 14.5 正式实装 Flexbox gap，网页堆栈不再必须靠 * + * 模拟缝隙。display: flex; flex-direction: column; gap 成为一行即可落地的原生原语。",
    tag: "原生一行落地",
  },
];

// =========================================================================
// 第 05 节：场景判定卡（什么时候别用堆栈 + 兄弟原语导览）
// =========================================================================
export const SCENARIOS = [
  {
    id: "tags",
    title: "文章底部的 12 个筛选标签",
    clue: "每个词宽窄不一，一行放不下时要自动折到下一行。",
    useStack: false,
    verdict: "别硬塞进纵轴堆栈",
    why: "把短标签竖排成 12 行会拉出巨长空洞，浪费右侧 80% 宽度；这里需要沿横轴自然聚拢并按需换行的水平群组。",
    linkId: "246",
    linkName: "246 簇群",
  },
  {
    id: "settings",
    title: "手机端表单与账号设置页",
    clue: "标题、说明、输入框、开关、保存按钮按先后步骤推进。",
    useStack: true,
    verdict: "最适合垂直堆栈",
    why: "单一纵轴流贴合拇指下滑与因果阅读顺序；用外层大堆栈隔开分组，内层小堆栈绑定标签与输入项，增删字段零成本。",
    linkId: "245",
    linkName: "搭配 245 居中器限宽",
  },
  {
    id: "gallery",
    title: "桌面端的 18 张商品图卡画廊",
    clue: "卡片信息同等重要，用户需要一眼横向对比多件商品。",
    useStack: false,
    verdict: "别在宽屏只堆单列",
    why: "一列竖排 18 张卡会让用户滚到手酸且无法同屏对比价格与外观；应改用随容器自动算列数的二维网格，或可左右翻阅的卷轴。",
    linkId: "250",
    linkName: "250 自适应网格原语",
  },
  {
    id: "doc-sidebar",
    title: "宽屏文档目录 + 正文双区",
    clue: "桌面端目录常驻一侧、正文占大头，窄屏时再上下回落。",
    useStack: false,
    verdict: "外框别只用堆栈",
    why: "正文本身内部该用堆栈管理段落，但「目录与正文」的整体关系需要宽屏并行、窄屏折落，交给专门的双区原语更干净。",
    linkId: "247",
    linkName: "247 侧栏原语",
  },
];

// =========================================================================
// 第 06 节：单变量四选一小练习（中性标签 A/B/C/D）
// =========================================================================
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    meta: "子项自带 margin-bottom: 24px",
    correct: false,
    // 迷你预览几何描述（只差间距归属与嵌套层级）
    preview: { mode: "child-mb", outer: 24, inner: 24, tail: 24 },
    explain: "最后一块「确认按钮」自己带着 24px 底部外边距，导致卡片底部凭空多出一条死白（比顶部内边距多出一倍）；同时标题与正文之间也隔了 24px，看不出亲疏层次。",
  },
  {
    id: "B",
    label: "方案 B",
    meta: "外层 gap 24px · 标题正文内嵌 gap 8px",
    correct: true,
    preview: { mode: "nested", outer: 24, inner: 8, tail: 0 },
    explain: "正确！所有子项 margin 归零，卡片上下边缘严格贴合外框 20px 内边距；外层堆栈用 24px 分隔「文本组」与「按钮」，内层堆栈用 8px 把标题和两段说明聚成一体，以后增删段落或调整顺序都稳如磐石。",
  },
  {
    id: "C",
    label: "方案 C",
    meta: "单层父容器统一 gap: 24px",
    correct: false,
    preview: { mode: "flat", outer: 24, inner: 24, tail: 0 },
    explain: "它确实把间距交给了父容器、避免了底部漏边，但因为把标题、两段正文和按钮全都丢在同一个 24px 平层里，标题和它自己的说明隔得跟底部按钮一样远，视觉归属松散。",
  },
  {
    id: "D",
    label: "方案 D",
    meta: "单层父容器统一 gap: 6px",
    correct: false,
    preview: { mode: "flat", outer: 6, inner: 6, tail: 0 },
    explain: "上下边缘虽然齐平，但 6px 把标题、正文与操作按钮全部压粘在一起，既没有组内组外的层级差，也没有足够的视觉停顿，移动端手指还容易误触。",
  },
];
