// 247 侧栏原语 · 单真源 Flexbox 量子布局引擎与诊断模型
// 所有宽度、占比、临界折行线 W_wrap 与诊断文案都从这里实时算出，画布、读数、代码区与练习共用同一组公式。

export const MIN_CONTAINER = 280;
export const MAX_CONTAINER = 920;
export const WIDE_REF = 780;
export const NARROW_REF = 360;

export const SCENES = {
  docs: {
    id: "docs",
    label: "原海报文档站",
    shortLabel: "文档站",
    sideName: "目录侧栏",
    mainName: "正文主区",
    basisRange: [155, 265],
    defaultBasis: 204,
    defaultMinMain: 55,
    defaultGap: 0,
    maxSideShareWide: 0.35,
    minSafeMain: 220,
    maxWrapThreshold: 680,
    minWrapThreshold: 380,
    navGroups: [
      {
        zone: "导航锚点",
        sub: "固定位置，提供全局方向与定位",
        items: [
          { id: 0, title: "01 架构总览", heading: "用侧栏建立秩序，让内容自由呼吸", tag: "ANCHOR · 全局定位", cards: ["基准宽 B", "弹性比 1:999", "底线 P%"] },
          { id: 1, title: "02 弹性原则", heading: "宽处安静守边，窄处整行让位", tag: "FLEX · 无断点", cards: ["容器自感知", "零媒体查询", "满宽堆叠"] },
          { id: 2, title: "03 临界折行", heading: "临界线 W_wrap = (B + G) / (1 - P)", tag: "QUANTUM · 相变", cards: ["触发阈值", "防主区挤扁", "防永久竖叠"] },
          { id: 3, title: "04 主次层级", heading: "侧栏承载结构，主区聚焦核心", tag: "HIERARCHY · 主次", cards: ["信息索引", "视觉静默", "内容呼吸"] },
        ],
      },
      {
        zone: "元数据区",
        sub: "辅助信息，建立情境与状态",
        items: [
          { id: 4, title: "05 版本状态", heading: "原语组件可嵌套进卡片与面板", tag: "META · 上下文", cards: ["文档目录", "表单检索", "媒体条目"] },
          { id: 5, title: "06 规范附录", heading: "保持侧栏简洁、稳定、可预测", tag: "SPEC · 边界", cards: ["勿超三成宽", "勿作等宽栏", "分组可扫读"] },
        ],
      },
    ],
  },
  search: {
    id: "search",
    label: "搜索框 + 按钮",
    shortLabel: "搜索栏",
    sideName: "提交按钮",
    mainName: "文本输入框",
    basisRange: [96, 170],
    defaultBasis: 124,
    defaultMinMain: 62,
    defaultGap: 12,
    maxSideShareWide: 0.28,
    minSafeMain: 200,
    maxWrapThreshold: 620,
    minWrapThreshold: 320,
    navGroups: [
      {
        zone: "操作锚点",
        sub: "窄按钮守基准宽，折行后变通栏主钮",
        items: [
          { id: 0, title: "立即检索", heading: "输入关键词：布局原语 / Sidebar Primitive", tag: "SEARCH · 表单微件", cards: ["flex-basis: 124px", "min-inline-size: 62%", "窄屏自动满宽按钮"] },
        ],
      },
    ],
  },
  media: {
    id: "media",
    label: "头像 + 简介条",
    shortLabel: "媒体条",
    sideName: "方形头像框",
    mainName: "人物简介区",
    basisRange: [116, 200],
    defaultBasis: 148,
    defaultMinMain: 55,
    defaultGap: 20,
    maxSideShareWide: 0.32,
    minSafeMain: 200,
    maxWrapThreshold: 640,
    minWrapThreshold: 340,
    navGroups: [
      {
        zone: "形象锚点",
        sub: "头像与文字在窄卡内自动转竖排资料卡",
        items: [
          { id: 0, title: "设计师名片", heading: "侧栏原语 · 媒体图文条", tag: "MEDIA · 嵌套卡片", cards: ["左侧定比图框", "右侧弹性正文", "窄卡自动转竖排"] },
        ],
      },
    ],
  },
};

export function createInitialState() {
  return {
    scene: "docs",
    containerW: 780,
    basis: 310,
    gap: 16,
    minMainPct: 24,
    wrap: false,
    sideGrow: 0,
    mainGrow: 1,
    sidePos: "left",
    navStructure: "flat",
    activeNav: 0,
    showCallouts: true,
    everWrapped: false,
  };
}

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    kind: "reset",
    patch: () => ({
      scene: "docs",
      containerW: 780,
      basis: 310,
      gap: 16,
      minMainPct: 24,
      wrap: false,
      sideGrow: 0,
      mainGrow: 1,
      sidePos: "left",
      navStructure: "flat",
    }),
  },
  poster: {
    label: "原海报经典解",
    kind: "good",
    patch: (s) => {
      const sc = SCENES[s.scene] || SCENES.docs;
      return {
        basis: sc.defaultBasis,
        gap: sc.defaultGap,
        minMainPct: sc.defaultMinMain,
        wrap: true,
        sideGrow: 1,
        mainGrow: 999,
        sidePos: "left",
        navStructure: "grouped",
      };
    },
  },
  compact: {
    label: "紧凑右置解",
    kind: "good",
    patch: (s) => {
      const sc = SCENES[s.scene] || SCENES.docs;
      return {
        basis: Math.round(sc.basisRange[0] + 18),
        gap: 16,
        minMainPct: 60,
        wrap: true,
        sideGrow: 1,
        mainGrow: 999,
        sidePos: "right",
        navStructure: "grouped",
      };
    },
  },
  trapStack: {
    label: "试错：永久竖叠",
    kind: "trap",
    patch: () => ({
      containerW: 780,
      basis: 260,
      gap: 20,
      minMainPct: 76,
      wrap: true,
      sideGrow: 1,
      mainGrow: 999,
      navStructure: "grouped",
    }),
  },
  trapBloat: {
    label: "试错：1:1 抢宽",
    kind: "trap",
    patch: () => ({
      containerW: 780,
      basis: 204,
      gap: 16,
      minMainPct: 55,
      wrap: true,
      sideGrow: 1,
      mainGrow: 1,
      navStructure: "grouped",
    }),
  },
};

/**
 * 严格按 W3C CSS Flexible Box Layout Module Level 1 (§9.2–§9.7) 计算两子项实际宽度与换行态：
 * - sidebar: flex-basis = B, flex-grow = sideGrow, flex-shrink = 1
 * - main:    flex-basis = 0, flex-grow = mainGrow, min-inline-size = P% (相对容器内宽 W)
 * 折行条件 (flex-wrap: wrap): B + W * (P/100) + G > W  <=>  W < (B + G) / (1 - P/100)
 */
export function solveAtWidth(state, width) {
  const W = Math.max(MIN_CONTAINER, Math.round(width));
  const B = state.basis;
  const G = state.gap;
  const P = state.minMainPct / 100;
  const minMainPx = W * P;

  const wrapThreshold =
    state.wrap && P < 0.99 ? Math.round((B + G) / (1 - P)) : Infinity;

  // 严格按假想主轴尺寸求和判断是否触发换行
  const wrapped = state.wrap && B + minMainPx + G > W + 0.5;

  let sideW = 0;
  let mainW = 0;
  let deadVoid = 0;

  if (wrapped) {
    sideW = state.sideGrow > 0 ? W : Math.min(B, W);
    deadVoid = Math.max(0, W - sideW);
    mainW = state.mainGrow > 0 ? W : Math.max(minMainPx, W * 0.5);
  } else {
    const avail = Math.max(0, W - G);
    const free = avail - B; // 因为 main 的 flex-basis 是 0
    if (free >= 0) {
      const sumGrow = state.sideGrow + state.mainGrow;
      if (sumGrow > 0) {
        let rawSide = B + (free * state.sideGrow) / sumGrow;
        let rawMain = (free * state.mainGrow) / sumGrow;
        if (rawMain < minMainPx) {
          mainW = Math.min(avail, minMainPx);
          sideW = Math.max(0, avail - mainW);
        } else {
          sideW = rawSide;
          mainW = rawMain;
        }
      } else {
        sideW = Math.min(B, avail);
        mainW = Math.min(avail - sideW, minMainPx);
      }
    } else {
      // 不换行且 B + G > W：main 至少占 minMainPx（或残余空间），sidebar 收缩
      mainW = Math.min(avail * 0.72, Math.max(minMainPx, 48));
      sideW = Math.max(48, avail - mainW);
    }
  }

  sideW = Math.round(sideW);
  mainW = Math.round(mainW);
  deadVoid = Math.round(deadVoid);

  const sideShare = W > 0 ? sideW / W : 0;
  const mainShare = W > 0 ? mainW / W : 0;

  return {
    W,
    B,
    G,
    P,
    minMainPx: Math.round(minMainPx),
    wrapThreshold,
    wrapped,
    sideW,
    mainW,
    deadVoid,
    sideShare,
    mainShare,
  };
}

export function evaluate(state) {
  const sc = SCENES[state.scene] || SCENES.docs;
  const live = solveAtWidth(state, state.containerW);
  const wide = solveAtWidth(state, WIDE_REF);
  const narrow = solveAtWidth(state, NARROW_REF);

  // 如果把 sideGrow 设为 1 但在宽屏仍用当前 mainGrow，会不会膨胀？
  const wideIfGrow1 = solveAtWidth({ ...state, sideGrow: 1 }, WIDE_REF);

  const basisTooWide = state.basis > sc.basisRange[1];
  const basisTooNarrow = state.basis < sc.basisRange[0];
  const needGrouping = state.scene === "docs" && state.navStructure !== "grouped";

  // 1. 主次霸权（宽屏下主区占绝对主导，且 mainGrow 压制 sideGrow）
  const mainGrowTooSmall = state.mainGrow < 50;
  const wideBloated = !wide.wrapped && wide.sideShare > sc.maxSideShareWide;
  const hierarchyOk = !mainGrowTooSmall && !wideBloated && !wide.wrapped;

  // 2. 无断点量子折行（宽屏能并排 + 窄屏在挤压主区前自动折行）
  const permanentlyStacked = state.wrap && live.wrapThreshold > WIDE_REF - 36;
  const neverWraps = !state.wrap;
  const minFloorTooLow = state.wrap && (!narrow.wrapped || state.minMainPct < 45);
  const narrowCrushed = !narrow.wrapped && narrow.mainW < sc.minSafeMain;
  const quantumWrapOk =
    state.wrap &&
    !permanentlyStacked &&
    !minFloorTooLow &&
    narrow.wrapped &&
    !wide.wrapped;

  // 3. 折行满宽（sidebar flex-grow >= 1，叠后不留死空）
  const fullWidthStackOk = state.sideGrow >= 1;

  // 4. 锚点与索引秩序（基准宽落在合理区间 + 文档场景保持清晰分组）
  const anchorOrderOk = !basisTooWide && !basisTooNarrow && !needGrouping;

  const checks = {
    hierarchy: {
      ok: hierarchyOk,
      label: "主次区分",
      badge: hierarchyOk
        ? `主区 ${Math.round(wide.mainShare * 100)}%`
        : wide.wrapped
          ? "宽屏未并排"
          : mainGrowTooSmall
            ? `成长 1:${state.mainGrow}`
            : `侧栏占 ${Math.round(wide.sideShare * 100)}%`,
    },
    quantumWrap: {
      ok: quantumWrapOk,
      label: "无断点折行",
      badge: quantumWrapOk
        ? `临界 ${live.wrapThreshold}px`
        : neverWraps
          ? "禁止换行"
          : permanentlyStacked
            ? `临界 ${live.wrapThreshold}px 过高`
            : `底线 ${state.minMainPct}% 过低`,
    },
    fullWidthStack: {
      ok: fullWidthStackOk,
      label: "折行满宽",
      badge: fullWidthStackOk
        ? "满宽 100%"
        : `折后留空 ${Math.max(0, NARROW_REF - Math.min(state.basis, NARROW_REF))}px`,
    },
    anchorOrder: {
      ok: anchorOrderOk,
      label: "锚点秩序",
      badge: anchorOrderOk
        ? `基准 ${state.basis}px`
        : basisTooWide
          ? `过肥 ${state.basis}px`
          : basisTooNarrow
            ? `过窄 ${state.basis}px`
            : "平铺无分组",
    },
  };

  const score = Object.values(checks).filter((c) => c.ok).length;

  // 选出最紧迫、最有教学价值的首要诊断
  let primaryIssue;
  if (score === 4) {
    const modeText = live.wrapped
      ? `当前容器 ${live.W}px 已低于临界线 ${live.wrapThreshold}px，自动翻折为上下 100% 满宽堆叠。`
      : `当前容器 ${live.W}px 宽于临界线 ${live.wrapThreshold}px，${sc.sideName}安静守住 ${live.sideW}px（${Math.round(live.sideShare * 100)}%），${sc.mainName}独享 ${live.mainW}px（${Math.round(live.mainShare * 100)}%）。`;
    primaryIssue = {
      code: "ok",
      severity: "ok",
      badge: `4/4 · 量子秩序成立`,
      title: `侧栏守序、主区呼吸，临界线 ${live.wrapThreshold}px 自然翻折`,
      why: `${modeText} 这套规则只看父容器宽度、不问屏幕尺寸，放进整页或窄卡片里都同样成立。`,
      nextStep: live.wrapped
        ? `试着把画布金色右壁向右拖过 ${live.wrapThreshold}px，看它原地弹回双栏并排；也可切换顶部题材或右置侧栏。`
        : `试着把画布金色右壁向左拖过 ${live.wrapThreshold}px，亲眼感受不靠 @media 的无断点相变。`,
    };
  } else if (neverWraps) {
    primaryIssue = {
      code: "nowrap",
      severity: "err",
      badge: `${score}/4 · 禁止换行`,
      title: `flex-wrap 关着，容器一窄就把${sc.mainName}挤扁`,
      why: `在 ${NARROW_REF}px 窄容器里，${sc.sideName}死守宽幅不肯退让，${sc.mainName}被压成 ${narrow.mainW}px 窄条（仅占 ${Math.round(narrow.mainShare * 100)}%）。侧栏原语的第一条前提就是允许容器在空间不够时自动换行。`,
      nextStep: `先在装调面板把 flex-wrap 切到「wrap 允许折行」，再把主区底线 min-inline-size 提到 50%–65%。`,
    };
  } else if (permanentlyStacked) {
    primaryIssue = {
      code: "permStack",
      severity: "err",
      badge: `${score}/4 · 永久竖叠`,
      title: `临界线飙到 ${live.wrapThreshold}px，连 ${WIDE_REF}px 宽屏都被迫上下堆叠`,
      why: `按公式 W_wrap = (B + G) / (1 - P) = (${state.basis} + ${state.gap}) / (1 - ${state.minMainPct}%) = ${live.wrapThreshold}px。临界线高于桌面容器宽 ${WIDE_REF}px，侧栏永远找不到和主区并排的机会。`,
      nextStep: `把主区底线 P 降回 50%–62%，或把侧栏基准宽 B 收紧到 ${sc.basisRange[0]}–${sc.basisRange[1]}px，让临界线落回 420–620px。`,
    };
  } else if (!fullWidthStackOk && live.wrapped && live.deadVoid > 8) {
    primaryIssue = {
      code: "deadVoid",
      severity: "err",
      badge: `${score}/4 · 折后死空`,
      title: `折行后侧栏停在 ${live.sideW}px，右侧空出 ${live.deadVoid}px 死白`,
      why: `你把侧栏的 flex-grow 设为 0。一旦翻折成上下两行，侧栏独自占第一行却不会伸展填满，右侧立刻漏出一大块缺口，破坏整体对齐。`,
      nextStep: `把侧栏 flex-grow 切到「1（折后满宽）」，注意看：切完后若主区仍是 flex-grow: 1，宽屏下侧栏会立刻抢空间！`,
    };
  } else if (mainGrowTooSmall && state.sideGrow >= 1 && !live.wrapped) {
    primaryIssue = {
      code: "equalGrow",
      severity: "err",
      badge: `${score}/4 · 1:1 抢宽`,
      title: `主区 flex-grow 只有 1，${sc.sideName}趁机暴涨到 ${live.sideW}px（${Math.round(live.sideShare * 100)}%）`,
      why: `当侧栏和主区都是 flex-grow: 1 时，浏览器把剩余自由空间 1:1 对半分！结果侧栏从设定好的 ${state.basis}px 膨胀到 ${live.sideW}px，直接反客为主吞掉半个版面。`,
      nextStep: `这就是 Every Layout 发明 flex-grow: 999 的原因——把主区 flex-grow 切到「999（吸收余量）」，看侧栏瞬间退回 ${state.basis}px！`,
    };
  } else if (minFloorTooLow) {
    primaryIssue = {
      code: "lowFloor",
      severity: "err",
      badge: `${score}/4 · 底线过低`,
      title: `主区 min-inline-size 仅 ${state.minMainPct}%，窄到 ${NARROW_REF}px 仍拒绝让位`,
      why: `折行临界线 W_wrap 只有 ${live.wrapThreshold}px。容器缩到 ${NARROW_REF}px 时，${sc.mainName}已被挤剩 ${narrow.mainW}px 却还没触发换行，文字断成碎块。经验上主区底线应守在 50%–65%。`,
      nextStep: `把「主区底线 min-inline-size」滑到 50%–65% 之间，再左拖画布金色右壁跨越新的临界线。`,
    };
  } else if (!fullWidthStackOk) {
    primaryIssue = {
      code: "deadVoidHidden",
      severity: "err",
      badge: `${score}/4 · 暗藏死空`,
      title: `宽屏看似正常，但一拖过 ${live.wrapThreshold}px 侧栏右侧就会留死空`,
      why: `侧栏 flex-grow 当前为 0。宽屏并排时它守着 ${state.basis}px 看不出异样；一旦容器缩窄折行，它拒绝拉满整行，露出 ${Math.max(0, NARROW_REF - Math.min(state.basis, NARROW_REF))}px 残缺空洞。`,
      nextStep: `先把画布右壁向左拖过 ${live.wrapThreshold}px 亲眼看看空洞，再把侧栏 flex-grow 切到「1」。`,
    };
  } else if (mainGrowTooSmall) {
    primaryIssue = {
      code: "mainGrowWeak",
      severity: "err",
      badge: `${score}/4 · 主区失权`,
      title: `主区 flex-grow 只有 1，压不住侧栏的弹性扩张`,
      why: `在 ${WIDE_REF}px 宽屏下若侧栏开启 flex-grow: 1，剩余空间对分后侧栏会飙到 ${wideIfGrow1.sideW}px（${Math.round(wideIfGrow1.sideShare * 100)}%）。必须给主区一个压倒性的放大权重（999），让它独吞 99.9% 的剩余空间。`,
      nextStep: `把「主区 flex-grow」切到「999（吸收余量）」，确立「侧栏守基准、主区吃余量」的铁律。`,
    };
  } else if (basisTooWide) {
    primaryIssue = {
      code: "basisWide",
      severity: "err",
      badge: `${score}/4 · 侧栏过胖`,
      title: `侧栏基准宽 ${state.basis}px 偏胖，压迫了主内容呼吸区`,
      why: `在 ${WIDE_REF}px 宽容器中，${sc.sideName}拿走 ${Math.round(wide.sideShare * 100)}% 宽度，同时把临界线推高到 ${live.wrapThreshold}px。侧栏是参照锚点，不是第二个主区。`,
      nextStep: `拖动画布里的侧栏中缝（或调「侧栏基准宽」滑块）收窄到 ${sc.basisRange[0]}–${sc.basisRange[1]}px 经验区间。`,
    };
  } else if (basisTooNarrow) {
    primaryIssue = {
      code: "basisNarrow",
      severity: "err",
      badge: `${score}/4 · 侧栏过窄`,
      title: `侧栏基准宽仅 ${state.basis}px，索引标签挤断难扫读`,
      why: `宽度低于 ${sc.basisRange[0]}px 时，导航条目或按钮文字频繁截断、失去扫描节奏，侧栏反而变成干扰用户的窄缝。`,
      nextStep: `把画布里的侧栏中缝向右拖（或用装调面板「侧栏基准宽」滑块）调到 ${sc.basisRange[0]}–${sc.basisRange[1]}px 区间。`,
    };
  } else {
    primaryIssue = {
      code: "flatNav",
      severity: "err",
      badge: `${score}/4 · 平铺无序`,
      title: `结构算对了，但 6 条导航平铺成墙、缺少分组锚点`,
      why: `原海报第二条设计要点写明「通过分组、间距与图标，构建可扫描的索引结构」。把所有链接无层级堆在侧栏里，读者每次都要从头扫到尾。`,
      nextStep: `在装调面板把「侧栏索引结构」切到「锚点 + 分组」，建立主导航与元数据区的清晰层级。`,
    };
  }

  // 生成单真源实时 CSS 代码（带精准行内诊注）
  const wrapComment = !state.wrap
    ? " /* × 关了换行：窄容器直接挤扁主区 */"
    : permanentlyStacked
      ? ` /* × 临界 ${live.wrapThreshold}px 过高：桌面也竖叠 */`
      : ` /* ✓ 临界线 W_wrap = ${live.wrapThreshold}px */`;

  const basisComment = basisTooWide
    ? ` /* × 偏胖：建议 ${sc.basisRange[0]}–${sc.basisRange[1]}px */`
    : basisTooNarrow
      ? ` /* × 过窄：建议 ${sc.basisRange[0]}–${sc.basisRange[1]}px */`
      : " /* ✓ 稳定参照宽度 */";

  const sideGrowComment =
    state.sideGrow === 0
      ? " /* × 折行后不拉伸，右留死空 */"
      : " /* ✓ 折行后撑满 100% */";

  const mainGrowComment =
    state.mainGrow < 50
      ? " /* × 与侧栏 1:1 抢占宽屏余量 */"
      : " /* ✓ 宽屏独吞 99.9% 余量 */";

  const minComment =
    state.minMainPct < 45
      ? " /* × 过低：窄屏挤成细条也不折 */"
      : permanentlyStacked
        ? " /* × 过高：宽屏也无法并排 */"
        : " /* ✓ 跌破即自动折行 */";

  const sideSelector = state.sidePos === "left" ? "> :first-child" : "> :last-child";
  const mainSelector = state.sidePos === "left" ? "> :last-child" : "> :first-child";

  const cssCode = `.with-sidebar {
  display: flex;
  flex-wrap: ${state.wrap ? "wrap" : "nowrap"};${wrapComment}
  gap: ${state.gap}px;
}
.with-sidebar ${sideSelector} { /* ${sc.sideName} */
  flex-basis: ${state.basis}px;${basisComment}
  flex-grow: ${state.sideGrow};${sideGrowComment}
}
.with-sidebar ${mainSelector} { /* ${sc.mainName} */
  flex-basis: 0;
  flex-grow: ${state.mainGrow};${mainGrowComment}
  min-inline-size: ${state.minMainPct}%;${minComment}
}`;

  // 对应原海报左脊三枚锚点状态 + 三行设计要点状态
  const notes = {
    anchor: {
      ok: !basisTooWide && !basisTooNarrow && fullWidthStackOk,
      status: !fullWidthStackOk
        ? "折后留空"
        : basisTooWide
          ? `过胖 ${state.basis}px`
          : basisTooNarrow
            ? `过窄 ${state.basis}px`
            : `稳守 ${state.basis}px`,
    },
    index: {
      ok: !needGrouping && !basisTooNarrow,
      status: needGrouping
        ? "平铺杂乱"
        : basisTooNarrow
          ? "标签挤断"
          : state.scene === "docs"
            ? "两组清晰"
            : "结构利落",
    },
    hierarchy: {
      ok: hierarchyOk && quantumWrapOk,
      status: neverWraps
        ? "窄屏挤死"
        : permanentlyStacked
          ? "宽屏竖叠"
          : mainGrowTooSmall
            ? "1:1 失衡"
            : live.wrapped
              ? "全宽堆叠"
              : `主占 ${Math.round(live.mainShare * 100)}%`,
    },
  };

  return {
    scene: sc,
    live,
    wide,
    narrow,
    checks,
    score,
    primaryIssue,
    cssCode,
    notes,
    flags: {
      neverWraps,
      permanentlyStacked,
      minFloorTooLow,
      narrowCrushed,
      mainGrowTooSmall,
      wideBloated,
      basisTooWide,
      basisTooNarrow,
      needGrouping,
      deadVoidNow: live.wrapped && live.deadVoid > 8,
      crushedNow: !live.wrapped && live.mainW < sc.minSafeMain,
      bloatedNow: !live.wrapped && live.sideShare > sc.maxSideShareWide,
    },
  };
}

// 06 节眼力练习：四份中性方案全部经由 solveAtWidth 实算，只差一个 CSS 变量
export const QUIZ_WIDE = 760;
export const QUIZ_NARROW = 380;
export const QUIZ_GAP = 16;

const QUIZ_BASE = {
  scene: "docs",
  gap: QUIZ_GAP,
  wrap: true,
  sidePos: "left",
  navStructure: "grouped",
};

export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    code: "sidebar: 200px / grow 1 · main: 0 / grow 1 / min 55%",
    cfg: { ...QUIZ_BASE, basis: 200, sideGrow: 1, mainGrow: 1, minMainPct: 55 },
    correct: false,
    explain: (w, n) =>
      `主区把 flex-grow 写成了 1（与侧栏相同）。在 ${QUIZ_WIDE}px 宽页里，剩余自由空间被 1:1 对分，原本 200px 的目录暴涨到 ${w.sideW}px（占 ${Math.round(w.sideShare * 100)}%），反客为主挤占了正文。`,
  },
  {
    id: "B",
    label: "方案 B",
    code: "sidebar: 200px / grow 0 · main: 0 / grow 999 / min 55%",
    cfg: { ...QUIZ_BASE, basis: 200, sideGrow: 0, mainGrow: 999, minMainPct: 55 },
    correct: false,
    explain: (w, n) =>
      `宽页下 ${w.sideW}px + ${w.mainW}px 很整齐，但侧栏把 flex-grow 写成了 0。进入 ${QUIZ_NARROW}px 窄抽屉折行后，侧栏停在 ${n.sideW}px 不愿伸展，右侧露出 ${n.deadVoid}px 难看的空缺。`,
  },
  {
    id: "C",
    label: "方案 C",
    code: "sidebar: 200px / grow 1 · main: 0 / grow 999 / min 55%",
    cfg: { ...QUIZ_BASE, basis: 200, sideGrow: 1, mainGrow: 999, minMainPct: 55 },
    correct: true,
    explain: (w, n) =>
      `正确！临界折行线 W_wrap = (200 + 16) / (1 - 0.55) = ${w.wrapThreshold}px。在 ${QUIZ_WIDE}px 宽页下，999:1 让侧栏稳守 ${w.sideW}px、主区独享 ${w.mainW}px；在 ${QUIZ_NARROW}px 窄抽屉里，低于 ${w.wrapThreshold}px 自动翻折且双双撑满 ${n.sideW}px。`,
  },
  {
    id: "D",
    label: "方案 D",
    code: "sidebar: 200px / grow 1 · main: 0 / grow 999 / min 75%",
    cfg: { ...QUIZ_BASE, basis: 200, sideGrow: 1, mainGrow: 999, minMainPct: 75 },
    correct: false,
    explain: (w, n) =>
      `主区 min-inline-size 设到了 75%，临界折行线飙升至 W_wrap = (200 + 16) / 0.25 = ${w.wrapThreshold}px。结果连 ${QUIZ_WIDE}px 的宽页都低于门槛，目录和正文在桌面端也被迫永久上下堆叠。`,
  },
].map((opt) => ({
  ...opt,
  wide: solveAtWidth(opt.cfg, QUIZ_WIDE),
  narrow: solveAtWidth(opt.cfg, QUIZ_NARROW),
}));
