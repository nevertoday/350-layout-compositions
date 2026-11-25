// 249 封面原语（COVER PRIMITIVE）单真源垂直弹性布局引擎与诊断模型
// 严格遵循 W3C CSS Flexible Box Layout Level 1 第 8.1 节 auto 外边距分配与 Every Layout Cover 原语规则。

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报 · 几何封面",
    shortName: "原海报封面",
    topLeft: "DESIGN FOUNDATION",
    topRight: "NO. 249",
    headline: ["封面不是装饰，", "而是结构的起点。"],
    subline: "好封面 = 明确目的 + 强烈层级 + 简洁表达",
    bottomText: "从封面开始，建立认知优势",
    bottomCue: "→",
    clutterBadge: "限时推荐 · 热榜",
    clutterCard: "6 条冗余参数 · 评分 9.8 · 浏览 12k · 专题合集",
    clutterActions: ["立即收藏", "查看全部", "分享好友"],
  },
  web: {
    id: "web",
    name: "网页首屏 · 专题入口",
    shortName: "网页首屏",
    topLeft: "ISSUE 09 · EDITORIAL",
    topRight: "INDEX / ARCHIVE",
    headline: ["先立清晰结构，", "再谈画面修饰。"],
    subline: "用最少三槽骨架，在一屏内讲清主题并引出正文",
    bottomText: "向下阅读完整专刊 · 6 分钟",
    bottomCue: "↓",
    clutterBadge: "NEW · 弹层公告",
    clutterCard: "作者履历 · 5 个关联标签 · 3 条往期摘要",
    clutterActions: ["订阅更新", "下载 PDF", "加入书签"],
  },
  card: {
    id: "card",
    name: "卡片封面 · 登录/课程",
    shortName: "卡片封面",
    topLeft: "MODULE 04 · COVER",
    topRight: "03 MIN",
    headline: ["进入第一步，", "只留一个主角。"],
    subline: "弹性容器在卡片与大屏间共用同一套居中规则",
    bottomText: "进入课程章节 · 无需前置配置",
    bottomCue: "→",
    clutterBadge: "促销倒计时",
    clutterCard: "前置须知 · 兼容列表 · 常见问答 · 历史版本",
    clutterActions: ["试看一节", "咨询客服", "对比方案"],
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    containerH: 292, // 初始较紧高度，配合 fixed height 立即产生真实底沿裁切
    heightMode: "fixed", // "fixed" | "min"
    centerMode: "start", // "start" | "auto" | "between"
    slotMode: "full", // "full" | "pair" | "solo" | "no-hero"
    padding: 0, // 0..96px，初始 0 触发贴边撞框
    titleRatio: 1.15, // 1.1..4.8，初始 1.15 触发层级塌陷
    clutter: {
      badge: true,
      card: true,
      actions: true,
    },
    xray: true,
    focusPillar: null, // null | "entry" | "hero" | "hierarchy"
  };
}

export const PRESETS = {
  posterClassic: {
    label: "原海报三槽解",
    patch: {
      containerH: 480,
      heightMode: "min",
      centerMode: "auto",
      slotMode: "full",
      padding: 28,
      titleRatio: 2.55,
      clutter: { badge: false, card: false, actions: false },
    },
  },
  minimalPair: {
    label: "双槽极简解",
    patch: {
      containerH: 450,
      heightMode: "min",
      centerMode: "auto",
      slotMode: "pair",
      padding: 32,
      titleRatio: 2.8,
      clutter: { badge: false, card: false, actions: false },
    },
  },
  soloCenter: {
    label: "单核宣言解",
    patch: {
      containerH: 430,
      heightMode: "min",
      centerMode: "auto",
      slotMode: "solo",
      padding: 36,
      titleRatio: 3.1,
      clutter: { badge: false, card: false, actions: false },
    },
  },
  compactCard: {
    label: "紧凑卡片解",
    patch: {
      containerH: 360,
      heightMode: "min",
      centerMode: "auto",
      slotMode: "full",
      padding: 18,
      titleRatio: 2.15,
      clutter: { badge: false, card: false, actions: false },
    },
  },
  trapPadChoke: {
    label: "试错：厚边挤碎",
    patch: {
      containerH: 360,
      heightMode: "min",
      centerMode: "auto",
      slotMode: "full",
      padding: 86,
      titleRatio: 2.4,
      clutter: { badge: false, card: false, actions: false },
    },
  },
  trapGiantTitle: {
    label: "试错：标题爆框",
    patch: {
      containerH: 370,
      heightMode: "fixed",
      centerMode: "auto",
      slotMode: "full",
      padding: 20,
      titleRatio: 4.5,
      clutter: { badge: false, card: false, actions: false },
    },
  },
  resetBroken: {
    label: "复原 0/4 错态",
    patch: null,
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function applyPatch(state, patch) {
  if (!patch) {
    const fresh = createInitialState();
    fresh.theme = state.theme;
    return fresh;
  }
  return {
    ...state,
    ...patch,
    clutter: patch.clutter ? { ...patch.clutter } : { ...state.clutter },
  };
}

/**
 * 单真源垂直 Flexbox 封面解算器
 * 返回：所有块级像素坐标、弹簧吸收量、溢出裁切量、元素数、四维校验与 9 类错态诊断。
 */
export function solveCover(state) {
  const containerH = Math.round(clamp(state.containerH, 260, 760));
  const padding = Math.round(clamp(state.padding, 0, 96));
  const titleRatio = +clamp(state.titleRatio, 1.1, 4.8).toFixed(2);
  const clutter = state.clutter || { badge: false, card: false, actions: false };
  const clutterList = [];
  if (clutter.badge) clutterList.push("badge");
  if (clutter.card) clutterList.push("card");
  if (clutter.actions) clutterList.push("actions");
  const clutterCount = clutterList.length;

  const hasTop = state.slotMode === "full" || state.slotMode === "no-hero";
  const hasHero = state.slotMode !== "no-hero";
  const hasBottom = state.slotMode === "full" || state.slotMode === "pair" || state.slotMode === "no-hero";

  // 基准字号与内容块固有高度（与画布绘制 1:1 严格一致）
  const bodySize = 13;
  const titleSize = Math.round(bodySize * titleRatio);
  const titleLines = titleRatio >= 4.1 ? 4 : titleRatio >= 3.3 ? 3 : 2;

  const topH = hasTop ? 28 : 0;
  // 主槽高度：核心几何图形高度由主标题和剩余空间协调，但在固有高度里预留清晰视觉区
  const titleBlockH = hasHero ? Math.round(titleLines * titleSize * 1.18 + 14 + bodySize * 1.65) : 0;
  const heroH = hasHero ? Math.max(108, titleBlockH) : 0;
  const clutterCardH = clutter.card ? 52 : 0;
  const clutterActionsH = clutter.actions ? 44 : 0;
  const bottomH = hasBottom ? 34 : 0;

  const minGap = 14;
  // 按真实文档流组装所有垂直子项
  const items = [];
  if (hasTop) items.push({ kind: "top", h: topH });
  if (hasHero) items.push({ kind: "hero", h: heroH });
  if (clutter.card) items.push({ kind: "clutter-card", h: clutterCardH });
  if (clutter.actions) items.push({ kind: "clutter-actions", h: clutterActionsH });
  if (hasBottom) items.push({ kind: "bottom", h: bottomH });

  const sumItemH = items.reduce((s, it) => s + it.h, 0);
  const baseGapsH = items.length > 1 ? (items.length - 1) * minGap : 0;
  const neededInnerH = sumItemH + baseGapsH;
  const availableInnerH = Math.max(0, containerH - 2 * padding);

  // 固定高度 vs min-block-size 弹性生长
  const isFixed = state.heightMode === "fixed";
  const renderedH = isFixed ? containerH : Math.max(containerH, neededInnerH + 2 * padding);
  const actualInnerH = Math.max(0, renderedH - 2 * padding);
  const overflowPx = isFixed && neededInnerH > availableInnerH ? Math.round(neededInnerH - availableInnerH) : 0;
  const expandedPx = !isFixed && renderedH > containerH ? Math.round(renderedH - containerH) : 0;
  const freeSpace = Math.max(0, actualInnerH - neededInnerH);

  // W3C Flexbox 第 8.1 节：auto 外边距吸收所有正向自由空间
  let springTop = 0;
  let springBottom = 0;
  let deadBottomVoid = 0;
  let betweenExtraGap = 0;

  const heroIdx = items.findIndex((it) => it.kind === "hero");

  if (state.centerMode === "auto" && heroIdx >= 0) {
    springTop = Math.round(freeSpace / 2);
    springBottom = Math.round(freeSpace - springTop);
  } else if (state.centerMode === "between") {
    if (items.length > 1) {
      betweenExtraGap = freeSpace / (items.length - 1);
    } else {
      deadBottomVoid = freeSpace;
    }
  } else {
    deadBottomVoid = freeSpace;
  }

  // 计算每一项精确纵坐标 y..y+h（相对于 Cover 容器顶部 0..renderedH）
  const rects = {};
  let cursor = padding;
  items.forEach((it, idx) => {
    if (idx > 0) {
      cursor += minGap + betweenExtraGap;
    }
    if (state.centerMode === "auto" && idx === heroIdx) {
      cursor += springTop;
    }
    rects[it.kind] = { y: Math.round(cursor), h: it.h };
    cursor += it.h;
    if (state.centerMode === "auto" && idx === heroIdx) {
      cursor += springBottom;
    }
  });

  // 计算主元素相对容器几何中心的偏移量
  const containerMid = renderedH / 2;
  const heroRect = rects.hero || null;
  const heroCenterOffsetPx = heroRect
    ? Math.round(heroRect.y + heroRect.h / 2 - containerMid)
    : 0;

  // 计算内边距占比与有效槽位数
  const padRatio = +(2 * padding / Math.max(1, renderedH)).toFixed(3);
  const activeSlots = (hasTop ? 1 : 0) + (hasHero ? 1 : 0) + (hasBottom ? 1 : 0);
  const totalElements = activeSlots + clutterCount;

  // 四项单真源硬校验
  const checkClean = clutterCount === 0 && hasHero;
  const checkCenter = state.centerMode === "auto" && hasHero;
  const checkSafe = !isFixed && overflowPx === 0 && padding >= 14 && padRatio <= 0.34;
  const checkHierarchy = hasHero && titleRatio >= 1.85 && titleRatio <= 4.0;

  const checks = {
    clean: checkClean,
    center: checkCenter,
    safe: checkSafe,
    hierarchy: checkHierarchy,
  };
  const score =
    (checkClean ? 1 : 0) +
    (checkCenter ? 1 : 0) +
    (checkSafe ? 1 : 0) +
    (checkHierarchy ? 1 : 0);

  // 原海报三柱实况（ENTRY / HERO / HIERARCHY）
  const pillars = {
    entry: {
      ok: checkClean && padding >= 14 && padRatio <= 0.34 && overflowPx === 0,
      tag: !hasHero
        ? "主角缺失"
        : clutterCount > 0
          ? `冗余 ${clutterCount} 件`
          : padding < 14
            ? "零边距贴框"
            : padRatio > 0.34
              ? "厚边过挤"
              : overflowPx > 0
                ? `裁切 -${overflowPx}px`
                : "清爽入眼",
    },
    hero: {
      ok: checkHeroPillar(hasHero, titleRatio, state.centerMode),
      tag: !hasHero
        ? "无主标题"
        : state.centerMode === "start"
          ? "顶堆失中"
          : state.centerMode === "between"
            ? "重心偏移"
            : titleRatio < 1.85
              ? `字比 ${titleRatio.toFixed(2)}×`
              : titleRatio > 4.0
                ? "标题爆框"
                : `${titleRatio.toFixed(1)}× 主导`,
    },
    hierarchy: {
      ok: !isFixed && overflowPx === 0 && checkClean && hasHero,
      tag: !hasHero
        ? "结构断档"
        : isFixed && overflowPx > 0
          ? `裁切 -${overflowPx}px`
          : isFixed
            ? "高度锁死"
            : clutterCount > 0
              ? "杂件抢戏"
              : state.slotMode === "solo"
                ? "单核极净"
                : state.slotMode === "pair"
                  ? "双槽预告"
                  : "三槽贯通",
    },
  };

  // 原海报底部三条检查清单（与单真源严格同步）
  const checklist = [
    {
      text: "我的一眼就能看懂主题吗？",
      ok: checkClean && checkHierarchy,
    },
    {
      text: "标题是否足够突出和清晰？",
      ok: checkHierarchy && checkCenter && padding >= 14 && padRatio <= 0.34,
    },
    {
      text: "是否激发了继续阅读的期待？",
      ok: !isFixed && overflowPx === 0 && clutterCount === 0 && hasHero,
    },
  ];

  // 9 类单真源错态诊断（按结构破坏优先级排序）
  const diag = diagnose({
    state,
    score,
    hasHero,
    hasTop,
    hasBottom,
    isFixed,
    overflowPx,
    expandedPx,
    padding,
    padRatio,
    clutterCount,
    titleRatio,
    freeSpace,
    springTop,
    springBottom,
    deadBottomVoid,
    heroCenterOffsetPx,
    containerH,
    renderedH,
  });

  // 实时生成真实 CSS 代码（与当前控件状态 100% 同步）
  const cssLines = buildCssSnippet(state, containerH, padding, titleRatio, overflowPx);

  return {
    containerH,
    renderedH,
    padding,
    padRatio,
    titleRatio,
    titleSize,
    bodySize,
    titleLines,
    neededInnerH,
    availableInnerH,
    overflowPx,
    expandedPx,
    freeSpace,
    springTop,
    springBottom,
    deadBottomVoid,
    heroCenterOffsetPx,
    activeSlots,
    clutterCount,
    totalElements,
    hasTop,
    hasHero,
    hasBottom,
    items,
    rects,
    checks,
    score,
    pillars,
    checklist,
    diag,
    cssLines,
  };
}

function checkHeroPillar(hasHero, titleRatio, centerMode) {
  return hasHero && titleRatio >= 1.85 && titleRatio <= 4.0 && centerMode === "auto";
}

function diagnose(m) {
  const {
    state,
    score,
    hasHero,
    isFixed,
    overflowPx,
    padding,
    padRatio,
    clutterCount,
    titleRatio,
    springTop,
    springBottom,
    deadBottomVoid,
    heroCenterOffsetPx,
    containerH,
    renderedH,
  } = m;

  if (!hasHero) {
    return {
      code: "missing-hero",
      severity: "error",
      badge: `${score}/4 · 主角空壳`,
      title: "把主标题删空了，封面只剩头尾外壳",
      body: "极简不等于把主角也删掉。封面原语最少要保留一个核心主元素；现在顶栏与底沿之间完全空白，观者一眼找不到这份内容的主题。",
      hint: "在槽位组合里把结构切回「三槽完整」「双槽极简」或「单核宣言」，先立住主标题。",
      quickFix: { label: "恢复主标题", patch: { slotMode: "full" } },
    };
  }

  if (isFixed && overflowPx > 0) {
    return {
      code: "fixed-clip",
      severity: "error",
      badge: `${score}/4 · 固定裁切`,
      title: `固定 height 锁死在 ${containerH}px，底沿被截断 ${overflowPx}px`,
      body: `写死 height: ${containerH}px 后，一旦容器变矮或文字多一行，底部信息预告就会直接撞出黑框被裁掉。封面原语用 min-block-size 给容器托底：屏高够就撑满，内容高就顺势长高，绝不截字。`,
      hint: "把高度策略切到「min-block-size 弹性」，或直接点击画布底部的红色裁切警告条。",
      quickFix: { label: "改用 min-block-size", patch: { heightMode: "min" } },
    };
  }

  if (clutterCount > 0) {
    return {
      code: "clutter-bloat",
      severity: "error",
      badge: `${score}/4 · 冗余 ${clutterCount} 件`,
      title: `封面塞进 ${clutterCount} 处冗余杂件，视觉重心被打散`,
      body: `原海报写着「用最少的元素，建立清晰的封面结构」。眼下画布里还堆着 ${clutterCount} 个装饰角标、参数副卡或抢戏按钮，读者要先穿过杂讯才看得到主标题。`,
      hint: "直接点击暖米画布上带红框的冗余块逐一剥离，把封面减回到 1–3 个核心结构槽。",
      quickFix: {
        label: "剥离全部冗余杂件",
        patch: { clutter: { badge: false, card: false, actions: false } },
      },
    };
  }

  if (padding < 14) {
    return {
      code: "zero-pad",
      severity: "error",
      badge: `${score}/4 · 零边贴框`,
      title: `内边距仅 ${padding}px，内容直接撞在封面边界上`,
      body: "把 padding 归零（noPad 且外层无留白）后，顶槽标题与底沿预告紧贴 1.5px 黑框内壁，封面立刻失去呼吸气口，像被截了一刀的半成品。",
      hint: "把护边内边距推到 16px–40px，让文字和图形与边框之间保持统一气口。",
      quickFix: { label: "补足 28px 护边", patch: { padding: 28 } },
    };
  }

  if (padRatio > 0.34) {
    return {
      code: "pad-choke",
      severity: "error",
      badge: `${score}/4 · 厚边挤碎`,
      title: `上下内边距吃掉 ${Math.round(padRatio * 100)}% 高度，反而把主角挤扁`,
      body: `当前 padding 高达 ${padding}px（上下合计 ${padding * 2}px），在 ${renderedH}px 高的容器里抢走超过三分之一纵深，内容区只剩一道窄缝。留白护边不是越厚越好。`,
      hint: "把内边距收回到 18px–40px，把纵深还给居中弹簧和主标题。",
      quickFix: { label: "收回 28px 护边", patch: { padding: 28 } },
    };
  }

  if (state.centerMode === "start") {
    return {
      code: "no-auto-start",
      severity: "error",
      badge: `${score}/4 · 顶堆留空`,
      title: `主元素未设 margin-block: auto，下方白白空出 ${deadBottomVoid}px`,
      body: "现在所有元素按普通文档流紧贴顶部堆叠。容器拉高后，上方挤成一团、下方空出一大截死白——没有利用 Flexbox 自动外边距把主标题托举到视觉重心。",
      hint: "把主元素分配切到「margin-block: auto」，再左右横拖画布高度看上下黄金弹簧同步伸缩。",
      quickFix: { label: "开启 margin-block: auto", patch: { centerMode: "auto" } },
    };
  }

  if (state.centerMode === "between") {
    const offAbs = Math.abs(heroCenterOffsetPx);
    return {
      code: "space-between-drift",
      severity: "error",
      badge: `${score}/4 · 均分失中`,
      title:
        state.slotMode === "solo"
          ? "只剩单核元素时，space-between 会把它粘回顶部"
          : `space-between 机械均分缝隙，主标题重心偏离 ${offAbs}px`,
      body:
        state.slotMode === "solo"
          ? "当顶槽和底槽都去掉、封面只剩一个核心标题时，justify-content: space-between 找不到第二个停靠点，标题立刻弹回顶边；而 margin-block: auto 无论 1 槽、2 槽还是 3 槽都能稳稳居中。"
          : "justify-content: space-between 只管把块间缝隙拉成一样，不管顶栏和底栏本身高矮是否相同；一旦改用 margin-block: auto 作用在唯一主角上，弹性自由空间就会围绕主角对称分布。",
      hint: "把主元素分配切到「margin-block: auto」，感受封面原语真正的弹性核心。",
      quickFix: { label: "换回 margin-block: auto", patch: { centerMode: "auto" } },
    };
  }

  if (titleRatio < 1.85) {
    return {
      code: "flat-hierarchy",
      severity: "error",
      badge: `${score}/4 · 层级塌陷`,
      title: `主副字号比仅 ${titleRatio.toFixed(2)}×，看不出谁是第一主角`,
      body: "原海报第二条核心是「标题主导 · 用主标题传达核心」。现在主标题和底下说明字号几乎一样大，第一眼扫过去分不清先读哪一句。",
      hint: "把主副字号比提高到 2.0×–3.4×，让主标题瞬间统领整个封面。",
      quickFix: { label: "拉升字比至 2.6×", patch: { titleRatio: 2.6 } },
    };
  }

  if (titleRatio > 4.0) {
    return {
      code: "giant-bloat",
      severity: "error",
      badge: `${score}/4 · 标题失控`,
      title: `主副字号比飙到 ${titleRatio.toFixed(2)}×，大字折成 4 行反压呼吸感`,
      body: "字号越大并非越好。主标题超过 4× 后被迫断成四行，吃光原本用来衬托它的弹性留白，把整个封面撑成密不透风的字墙。",
      hint: "把主副字号比回调到 2.0×–3.6× 经验甜点区，既醒目又不挤压弹簧空间。",
      quickFix: { label: "回调字比至 2.6×", patch: { titleRatio: 2.6 } },
    };
  }

  if (isFixed) {
    return {
      code: "fixed-fragile",
      severity: "error",
      badge: `${score}/4 · 高度锁死`,
      title: `虽然眼下 ${containerH}px 勉强塞下，但固定 height 依然脆弱`,
      body: "目前没有溢出只是因为容器碰巧够高。只要用户把字号调大或切到较矮的横屏窗口，写死的 height 立刻就会裁切底沿预告；封面原语必须用 min-block-size 托底。",
      hint: "把高度策略切到「min-block-size 弹性」，再试着向左拖矮画布验证它不会裁字。",
      quickFix: { label: "改用 min-block-size", patch: { heightMode: "min" } },
    };
  }

  // 4/4 多组合法解精准识别
  let solutionName = "原海报三槽经典解";
  let solutionDesc = `顶槽入口贴顶、主标题借上下各 ${springTop}px / ${springBottom}px 的 auto 弹簧居中、底槽预告贴底，且 min-block-size 托底绝不裁字。`;

  if (state.slotMode === "solo") {
    solutionName = "极净单核宣言解";
    solutionDesc = `去掉顶底附属，全幅只留 1 个居中主角，上下弹簧各吸住 ${springTop}px 自由空间——这是 Every Layout 封面原语最精简的 1 槽合法形态。`;
  } else if (state.slotMode === "pair") {
    solutionName = "双槽极简封面解";
    solutionDesc = `省去顶栏，仅用居中主标题（${titleRatio.toFixed(1)}×）配底沿信息预告，上下弹簧各 ${springTop}px / ${springBottom}px，简洁直给。`;
  } else if (containerH <= 385) {
    solutionName = "紧凑卡片封面解";
    solutionDesc = `即便把最小高度压到 ${containerH}px 卡片尺寸，${padding}px 护边与 min-block-size 依然保住三槽清晰层级——封面原语不局限于全屏 100vh。`;
  }

  return {
    code: "ok",
    severity: "ok",
    badge: `4/4 · ${solutionName}`,
    title: `结构成立：${solutionName}`,
    body: solutionDesc + " 左右横拖画布拉伸容器高度，看看三槽骨架如何在任意纵深下自洽。",
    hint: "你也可以试试「双槽极简解」「单核宣言解」「紧凑卡片解」，或故意点「试错」观察崩坏边界。",
    quickFix: null,
  };
}

function buildCssSnippet(state, containerH, padding, titleRatio, overflowPx) {
  const hProp =
    state.heightMode === "fixed"
      ? `height: ${containerH}px; overflow: hidden; /* ${overflowPx > 0 ? `裁切 -${overflowPx}px` : "锁死风险"} */`
      : `min-block-size: ${containerH}px;`;

  const justifyLine =
    state.centerMode === "between"
      ? "  justify-content: space-between; /* 均分缝隙 */"
      : null;

  const principalRule =
    state.slotMode === "no-hero"
      ? "/* ! 缺少核心主元素 .principal */"
      : state.centerMode === "auto"
        ? `.cover > .principal { margin-block: auto; /* 字比 ${titleRatio.toFixed(2)}× */ }`
        : `.cover > .principal { margin-block: 0; /* 未用 auto 居中 */ }`;

  const lines = [
    ".cover {",
    "  display: flex;",
    "  flex-direction: column;",
    `  ${hProp}`,
    `  padding: ${padding}px;`,
  ];
  if (justifyLine) lines.push(justifyLine);
  lines.push("}");
  lines.push(principalRule);
  return lines;
}
