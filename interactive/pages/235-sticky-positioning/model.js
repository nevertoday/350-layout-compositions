// 235 · 粘性定位布局 单真源几何模型与诊断引擎
// 开场舞台（活体阅读器 + 2D Canvas 轨道示波器 + 阶段轴 + 实时 CSS 语法盒 + 白话诊单）全部共享这份状态与几何常数。

export const VIEWPORT_H = 344;
export const INTRO_H = 92;
export const HEADER_H = 44;
export const CARD_H = 74;
export const CARD_GAP = 10;
export const SEC_PAD_TOP = 10;
export const SEC_PAD_BOTTOM = 16;
export const SEC_GAP = 16;
export const TAIL_H = 126;

export const SECTIONS_META = [
  {
    id: "sec1",
    num: "01",
    title: "阅读分区一",
    en: "SECTION 1",
    cards: [
      { code: "01", title: "内容卡片 01", sub: "文档流占位不塌陷", icon: "mountain" },
      { code: "02", title: "内容卡片 02", sub: "随卷动平稳向上滑过", icon: "circle" },
      { code: "03", title: "内容卡片 03", sub: "穿过吸顶标头下方", icon: "pie" },
    ],
  },
  {
    id: "sec2",
    num: "02",
    title: "阅读分区二",
    en: "SECTION 2",
    cards: [
      { code: "04", title: "内容卡片 04", sub: "前一分区底边逼近顶出", icon: "mountain" },
      { code: "05", title: "内容卡片 05", sub: "分区二标头无缝接棒", icon: "circle" },
      { code: "06", title: "内容卡片 06", sub: "保持当前章节坐标参照", icon: "pie" },
    ],
  },
  {
    id: "sec3",
    num: "03",
    title: "阅读分区三",
    en: "SECTION 3",
    cards: [
      { code: "07", title: "内容卡片 07", sub: "父容器边界决定退场点", icon: "mountain" },
      { code: "08", title: "内容卡片 08", sub: "不再永久占据整页视口", icon: "circle" },
      { code: "09", title: "内容卡片 09", sub: "阅读尾声自然释放顶部", icon: "pie" },
    ],
  },
];

// 计算每个分区在文档流里的精确纵坐标
export const SECTION_H =
  HEADER_H +
  SEC_PAD_TOP +
  3 * CARD_H +
  2 * CARD_GAP +
  SEC_PAD_BOTTOM; // 44 + 10 + 222 + 20 + 16 = 312px

export const SECTIONS_GEOM = SECTIONS_META.map((sec, i) => {
  const top = INTRO_H + i * (SECTION_H + SEC_GAP);
  return {
    ...sec,
    index: i,
    top,
    height: SECTION_H,
    bottom: top + SECTION_H,
  };
});

export const CONTENT_H =
  SECTIONS_GEOM[SECTIONS_GEOM.length - 1].bottom + TAIL_H; // 92 + 3*312 + 2*16 + 126 = 1186px
export const MAX_SCROLL = Math.max(1, CONTENT_H - VIEWPORT_H); // 842px

// 初始 0/4 经典失灵翻车态（分区一已随文档流滑出顶沿，顶部清晰露出未吸合残影框）
export function createBrokenState() {
  return {
    scrollY: 142,
    topMode: "auto",        // 'auto' | '0' | '12' | '148'
    overflowMode: "hidden", // 'hidden' | 'visible' | 'clip' | 'auto-trap'
    parentMode: "wrapper",  // 'wrapper' | 'section'
    layerMode: "bleed",     // 'bleed' | 'solid' | 'heavy'
  };
}

// 原海报标准合规解
export function createPosterSolution(scrollY = 188) {
  return {
    scrollY,
    topMode: "0",
    overflowMode: "clip",
    parentMode: "section",
    layerMode: "solid",
  };
}

// 第二组正当解：微呼吸缝 + overflow: visible
export function createBreathSolution(scrollY = 210) {
  return {
    scrollY,
    topMode: "12",
    overflowMode: "visible",
    parentMode: "section",
    layerMode: "solid",
  };
}

export function clampScroll(y) {
  return Math.max(0, Math.min(MAX_SCROLL, Math.round(y)));
}

export function thresholdValue(state) {
  if (state.topMode === "auto") return null;
  if (state.topMode === "0") return 0;
  if (state.topMode === "12") return 12;
  return 148;
}

export function extraChromeHeight(state) {
  // 'heavy' 模式下额外叠加胖公告条 52px + 胖筛选栏 48px = 100px
  return state.layerMode === "heavy" ? 100 : 0;
}

// 核心物理计算：完全对齐 W3C CSS Positioned Layout Level 3 的粘性包含块算法
export function evaluateSticky(state) {
  const scrollY = clampScroll(state.scrollY);
  const rawThreshold = thresholdValue(state);
  const extraChrome = extraChromeHeight(state);
  const effectiveThreshold = rawThreshold === null ? null : rawThreshold + extraChrome;

  const hasThreshold = rawThreshold !== null;
  const overflowOk = state.overflowMode === "visible" || state.overflowMode === "clip";
  const parentOk = state.parentMode === "section";
  const thresholdInZone = rawThreshold === 0 || rawThreshold === 12;
  const layerOk = state.layerMode === "solid";

  // 粘性机制是否在规范层面真正启动（缺 top 或祖先建了滚动容器都直接失灵）
  const engineActive = hasThreshold && overflowOk;
  // 在合法父盒里的滑行行程（px）
  const runwayPx = parentOk ? SECTION_H - HEADER_H : 0;

  // 各分区的几何计算
  const sections = SECTIONS_GEOM.map((sec) => {
    const flowY = sec.top;
    const naturalViewY = flowY - scrollY;
    const boxBottom = parentOk ? sec.bottom : sec.top + HEADER_H;
    const maxStickyViewY = boxBottom - HEADER_H - scrollY;

    let actualViewY = naturalViewY;
    let phase = "flow"; // 'flow' | 'approaching' | 'stuck' | 'pushing' | 'passed' | 'escaped'

    if (engineActive && effectiveThreshold !== null) {
      const clampedTop = Math.max(naturalViewY, effectiveThreshold);
      actualViewY = Math.min(clampedTop, maxStickyViewY);

      if (naturalViewY > effectiveThreshold + 28) {
        phase = "flow";
      } else if (naturalViewY > effectiveThreshold) {
        phase = "approaching";
      } else if (maxStickyViewY > effectiveThreshold) {
        phase = "stuck";
      } else if (maxStickyViewY > -HEADER_H) {
        phase = "pushing";
      } else {
        phase = "passed";
      }
    } else {
      // 未启动粘性，完全随文档流滚走
      const refLine = effectiveThreshold ?? 0;
      if (naturalViewY > refLine + 28) {
        phase = "flow";
      } else if (naturalViewY > refLine) {
        phase = "approaching";
      } else if (naturalViewY > -HEADER_H) {
        phase = "escaped";
      } else {
        phase = "passed";
      }
    }

    // 标头吸附后相对于自身原本流位置的平移量（用于精准驱动 DOM transform）
    const deltaY = actualViewY - naturalViewY;

    // 轨道上的吸附区间（用 scrollY 表示）
    const stickStartScroll =
      engineActive && effectiveThreshold !== null
        ? Math.max(0, sec.top - effectiveThreshold)
        : null;
    const stickEndScroll =
      engineActive && effectiveThreshold !== null
        ? Math.max(stickStartScroll, boxBottom - HEADER_H - effectiveThreshold)
        : null;
    const pushEndScroll =
      stickEndScroll !== null ? stickEndScroll + HEADER_H : null;

    return {
      ...sec,
      naturalViewY,
      actualViewY,
      deltaY,
      phase,
      runwayPx: Math.max(0, boxBottom - sec.top - HEADER_H),
      stickStartScroll,
      stickEndScroll,
      pushEndScroll,
      isStuck: phase === "stuck",
      isPushing: phase === "pushing",
      isEscaped: phase === "escaped",
    };
  });

  // 选出当前最受关注的焦点分区（若粘性未启动且已有分区越过 0 线脱轨，优先标出脱轨态）
  const escapedAny = !engineActive && sections.find((s) => s.naturalViewY < 0);
  const focus =
    sections.find((s) => s.phase === "stuck") ||
    sections.find((s) => s.phase === "pushing") ||
    sections.find((s) => s.phase === "escaped") ||
    (escapedAny ? { ...escapedAny, phase: "escaped" } : null) ||
    sections.find((s) => s.phase === "approaching") ||
    sections.find((s) => s.naturalViewY >= -HEADER_H) ||
    sections[sections.length - 1];

  // 计算吸顶总占用高度与净阅读区占比
  const activeStickyBarH =
    sections.some((s) => s.phase === "stuck" || s.phase === "pushing")
      ? HEADER_H
      : 0;
  const totalPinnedH = extraChrome + (activeStickyBarH || HEADER_H);
  const pinnedRatio = Math.round((totalPinnedH / VIEWPORT_H) * 100);
  const readableRatio = 100 - pinnedRatio;

  // 穿字检测：当标头处于吸顶/交棒状态且处于透明无层级模式时，下方卡片是否直接与标头重叠
  let bleedOverlap = false;
  if (state.layerMode === "bleed" && (focus.phase === "stuck" || focus.phase === "pushing")) {
    const hdrTop = focus.actualViewY;
    const hdrBot = hdrTop + HEADER_H;
    for (const sec of SECTIONS_GEOM) {
      for (let ci = 0; ci < 3; ci++) {
        const cardTop = sec.top + HEADER_H + SEC_PAD_TOP + ci * (CARD_H + CARD_GAP) - scrollY;
        const cardBot = cardTop + CARD_H;
        if (cardBot > hdrTop + 4 && cardTop < hdrBot - 4) {
          bleedOverlap = true;
          break;
        }
      }
      if (bleedOverlap) break;
    }
  }

  // 四维过关核算
  const checks = {
    threshold: hasThreshold && thresholdInZone,
    overflow: overflowOk,
    parent: parentOk,
    layer: layerOk,
  };
  const passCount = Object.values(checks).filter(Boolean).length;

  // 生成高优先级白话诊单（覆盖 8 类错态 + 多组合法解）
  let diag;
  if (!overflowOk && state.overflowMode === "hidden") {
    diag = {
      severity: "error",
      tag: "错态 · 祖先截断",
      headline: "外层套了 overflow: hidden，粘性标题当场失灵",
      why: "规范规定 position: sticky 只盯住「最近的滚动祖先」。祖先写了 overflow: hidden 会暗中建立一个不能滚动的滚动容器，浏览器以为你从未滚动过，标题只能跟着正文直接滑出屏幕。",
      action: "把「祖先容器 overflow」切到 overflow: clip（现代裁切正解）或 overflow: visible，把滚动参照还给视口。",
    };
  } else if (!overflowOk && state.overflowMode === "auto-trap") {
    diag = {
      severity: "error",
      tag: "错态 · 嵌套滚轴陷阱",
      headline: "祖先设了 overflow: auto 矮盒，外层滚卷彻底失效",
      why: "外层包裹开了内部滚动条后，粘性标题改成只听这个矮盒的滚轮，不再响应外层主页面。用户上下滑动页面时，标题跟着整块容器跑出视野，还会撞出尴尬的双滚动条。",
      action: "把「祖先容器 overflow」改回 overflow: visible 或 overflow: clip，消除多余的嵌套滚动容器。",
    };
  } else if (!hasThreshold) {
    diag = {
      severity: "error",
      tag: "错态 · 缺失阈值",
      headline: "写了 position: sticky 却忘了设 top 阈值",
      why: "没有声明 top / bottom / left / right 中的任意一个偏移值时，浏览器不知道「滚到哪条线才吸住」。按 W3C 规范，缺阈值的粘性元素直接退化为普通相对定位，毫无吸附效果。",
      action: "在「触发阈值 top」里选 top: 0px（贴顶原海报解）或 top: 12px（轻留呼吸缝），先画出红色触发线。",
    };
  } else if (rawThreshold >= 120) {
    diag = {
      severity: "error",
      tag: "错态 · 阈值悬腰",
      headline: `top: ${rawThreshold}px 设得太深，标题悬空把正文拦腰斩断`,
      why: `粉红标头死死钉在视口中段 ${rawThreshold}px 处，上下两头同时漏出滚动文字。视线每往下扫一行都要跨过悬浮标题条，阅读连贯性被硬生生切断。`,
      action: "把「触发阈值 top」收回到 0px 或 12px（经验常驻顶带），让标题紧贴视口上沿当参照。",
    };
  } else if (!parentOk) {
    diag = {
      severity: "error",
      tag: "错态 · 父盒无行程",
      headline: "父容器只包了标题自己，滑行余量 0px 刚吸就掉",
      why: "粘性元素永远不能越出自己包含块的底边。当标题被单独套进一个仅 44px 高的包装 div 时，父盒底边紧贴标题脚下，刚碰到阈值线就立刻被父盒拽出视口。",
      action: `把「父容器包裹范围」切回「完整分区 section」，让标题和三张卡片住在同一个父盒里，获得 ${SECTION_H - HEADER_H}px 滑行轨道。`,
    };
  } else if (state.layerMode === "bleed") {
    diag = {
      severity: "error",
      tag: "错态 · 透明穿字",
      headline: "z-index 过低且缺实底，下方卡片文字直接穿透标头",
      why: "粘性元素吸住后，后续内容卡片会从它背后持续滑过。没有更高的 z-index 和不透明背景色兜底时，卡片里的文字和图标会和分区标题叠成一团糊字。",
      action: "把「层叠与吸顶占空」切到「z: 10 实底单条」，给标头立起层叠门槛与实色衬底。",
    };
  } else if (state.layerMode === "heavy") {
    diag = {
      severity: "error",
      tag: "错态 · 叠层过胖",
      headline: `三层吸顶吃掉 ${pinnedRatio}% 视口，正文只剩一条窄缝`,
      why: `同时把公告栏、筛选栏和分区标头全设成吸顶，固定占高飙到 ${totalPinnedH}px（经验宜控制在 25% 以内），净阅读区仅剩 ${readableRatio}%，在手机横屏下甚至一行完整卡片都装不下。`,
      action: "切回「z: 10 实底单条」，只保留最能帮读者定位当前章节的一层吸顶标头。",
    };
  } else {
    // 4/4 全达标：根据当前滚动阶段给出动态实时白话解释！
    const phaseNote =
      focus.phase === "flow"
        ? `当前处于「阶段 01 正常流程」：${focus.title}距阈值线还有 ${Math.round(focus.naturalViewY - effectiveThreshold)}px，像普通块级元素一样在文档流中占住位置。`
        : focus.phase === "approaching"
        ? `当前处于「阶段 02 过渡状态」：${focus.title}距粉红阈值线仅剩 ${Math.max(0, Math.round(focus.naturalViewY - effectiveThreshold))}px，即将触发吸合。`
        : focus.phase === "stuck"
        ? `当前处于「阶段 03 吸附顶部」：${focus.title}稳稳吸在 top: ${rawThreshold}px，父盒还剩 ${Math.max(0, Math.round(focus.bottom - HEADER_H - scrollY - effectiveThreshold))}px 滑行行程供卡片从下方穿行。`
        : `当前处于「阶段 04 顶出交棒」：${focus.title}已抵达父盒底边，正被平滑顶出视口，下一分区标头顺势接管顶部。`;

    const solutionLabel =
      state.overflowMode === "clip" && rawThreshold === 0
        ? "原海报标准解 · overflow: clip"
        : state.overflowMode === "clip"
        ? "呼吸缝合法解 · overflow: clip"
        : "经典合法解 · overflow: visible";

    diag = {
      severity: "ok",
      tag: `达标 4/4 · ${solutionLabel}`,
      headline: `粘性链路全通，净阅读区保留 ${readableRatio}%`,
      why: phaseNote,
      action: "继续左右拖上方轨道（或滚轮滑动），完整观察三个分区「正常流动 → 触发阈值 → 吸附固定 → 顶出交棒」的全周期。",
    };
  }

  // 实时生成与当前参数完全一致的 CSS 代码行（紧凑单行，宽窄屏均不溢出）
  const cssLines = [
    {
      text:
        state.overflowMode === "hidden"
          ? ".shell { overflow: hidden; }  /* [!] 截断 sticky */"
          : state.overflowMode === "auto-trap"
          ? ".shell { overflow: auto; }    /* [!] 矮盒双滚轴 */"
          : state.overflowMode === "clip"
          ? ".shell { overflow: clip; }    /* [✓] 裁切不建滚盒 */"
          : ".shell { overflow: visible; } /* [✓] 参照还给视口 */",
      tone: overflowOk ? "ok" : "err",
    },
    {
      text: parentOk
        ? `.section { /* [✓] 包裹标题+卡片，行程 ${SECTION_H - HEADER_H}px */ }`
        : ".wrap { height: 44px; /* [!] 仅包标题，行程 0 */ }",
      tone: parentOk ? "ok" : "err",
    },
    {
      text: ".sticky-header { position: sticky;",
      tone: "accent",
    },
    {
      text:
        rawThreshold === null
          ? "  /* top 未声明！[!] 缺阈值，退化为 relative */"
          : rawThreshold >= 120
          ? `  top: ${rawThreshold}px;      /* [!] 过深，悬腰切断正文 */`
          : `  top: ${rawThreshold}px;        /* [✓] 顶边触发阈值 */`,
      tone: checks.threshold ? "ok" : "err",
    },
    {
      text:
        state.layerMode === "bleed"
          ? "  z-index: 0; background: none; /* [!] 穿字 */ }"
          : state.layerMode === "heavy"
          ? `  z-index: 10; /* [!] 三层胖叠共占 ${pinnedRatio}% */ }`
          : "  z-index: 10; background: #DB3E6D; /* [✓] */ }",
      tone: layerOk ? "ok" : "err",
    },
  ];

  // 四阶段轴当前激活项（对应原海报 01 / 02 / 03 + 扩展 04）
  let stageActive = "01";
  if (focus.phase === "approaching") stageActive = "02";
  else if (focus.phase === "stuck") stageActive = "03";
  else if (focus.phase === "pushing") stageActive = "04";
  else if (focus.phase === "escaped") stageActive = "err";

  return {
    scrollY,
    progress: scrollY / MAX_SCROLL,
    rawThreshold,
    effectiveThreshold,
    extraChrome,
    engineActive,
    runwayPx,
    sections,
    focus,
    totalPinnedH,
    pinnedRatio,
    readableRatio,
    bleedOverlap,
    checks,
    passCount,
    stageActive,
    diag,
    cssLines,
  };
}

// ---------- 第 01 节：三态同步滚筒模型（Relative vs Sticky vs Fixed） ----------
export function computeCompareTriad(scrollRatio) {
  const trackH = 220;
  const contentH = 560;
  const maxS = contentH - trackH; // 340
  const scrollY = Math.round(Math.max(0, Math.min(1, scrollRatio)) * maxS);
  const blockH = 34;
  const startY = 86;
  const secBottom = 320;
  const threshold = 10;

  // 1. Relative：保持原位占位，随内容直滚出顶
  const relY = startY - scrollY;
  const relState = relY + blockH < 0 ? "已滚出视口" : "随流上移";

  // 2. Sticky：到 10px 吸住，到 secBottom-blockH 被父盒顶走
  const stNat = startY - scrollY;
  const stMax = secBottom - blockH - scrollY;
  const stY = Math.min(Math.max(stNat, threshold), stMax);
  let stState = "阶段 01 · 正常流动";
  if (stNat <= threshold && stMax > threshold) stState = "阶段 03 · 阈值吸顶";
  else if (stMax <= threshold && stMax > -blockH) stState = "阶段 04 · 父盒顶走";
  else if (stMax <= -blockH) stState = "已交棒退场";
  else if (stNat <= threshold + 24) stState = "阶段 02 · 逼近阈值";

  // 3. Fixed：从第 0px 起就脱离流压在顶部，永不退场
  const fixY = threshold;
  const fixState = scrollY < 32 ? "压住首行正文" : "全程锁死视口";

  return {
    scrollY,
    maxS,
    rel: { y: relY, state: relState },
    sticky: { y: stY, state: stState, secTop: startY - scrollY, secH: secBottom - startY },
    fixed: { y: fixY, state: fixState },
  };
}

// ---------- 第 03 节：四大失效暗坑病历数据 ----------
export const CLINIC_CASES = [
  {
    id: "overflow",
    tab: "病历 01 · 祖先 overflow",
    title: "祖先套了 overflow: hidden 裁圆角",
    symptom: "明明写了 position: sticky; top: 0，整段滚过去标题却纹丝不动跟着跑。",
    cause: "W3C 规范把任何 overflow 非 visible/clip 的祖先视为滚动容器。即使它本身没有滚动条，sticky 也会错误地把吸附基准锁在它身上。",
    brokenCode: ".card-shell {\n  border-radius: 16px;\n  overflow: hidden; /* ← 罪魁祸首 */\n}\n.sub-head { position: sticky; top: 0; }",
    fixedCode: ".card-shell {\n  border-radius: 16px;\n  overflow: clip;   /* ✓ 只裁切，不建滚动祖先 */\n}\n.sub-head { position: sticky; top: 0; }",
    fixBtn: "把 hidden 改成 overflow: clip",
    brokenNote: "祖先建了假滚动容器 → 标题直接滑跑",
    fixedNote: "overflow: clip 保留圆角且不拦 sticky → 稳稳吸顶",
  },
  {
    id: "flex",
    tab: "病历 02 · Flex 拉伸",
    title: "Flex / Grid 侧边栏默认等高拉伸",
    symptom: "右侧目录写了 position: sticky; top: 16px，滚动文章时目录却死死粘在原处跟着整页滚走。",
    cause: "Flex 与 Grid 容器默认的 align-items: stretch 会把短目录强行拉到和左侧长文章一样高——父盒高等于自身高，滑行余量是 0px。",
    brokenCode: ".article-grid {\n  display: flex;\n  align-items: stretch; /* ← 默认拉满等高 */\n}\n.toc { position: sticky; top: 16px; }",
    fixedCode: ".article-grid {\n  display: flex;\n  align-items: flex-start; /* ✓ 回归自身内容高度 */\n}\n.toc { position: sticky; top: 16px; }",
    fixBtn: "改为 align-items: flex-start",
    brokenNote: "目录被拉成和正文同高 → 行程 0px 无法滑行",
    fixedNote: "目录收回自身高度 → 拥有整段正文滑行轨道",
  },
  {
    id: "inset",
    tab: "病历 03 · 漏写阈值",
    title: "只声明 position: sticky 忘了写 top",
    symptom: "检查元素看到 position: sticky 确实生效，祖先也全干净，可滚动时就是毫无反应。",
    cause: "四边偏移默认全是 auto。不指定 top / bottom / left / right 中至少一个具体值，浏览器就没有任何触发线可吸附。",
    brokenCode: ".filter-bar {\n  position: sticky;\n  /* 忘写 top，默认为 auto */\n  z-index: 10;\n}",
    fixedCode: ".filter-bar {\n  position: sticky;\n  top: 0;           /* ✓ 声明顶边触发线 */\n  z-index: 10;\n}",
    fixBtn: "补上 top: 0 触发阈值",
    brokenNote: "top 为 auto → 规范直接按 relative 渲染",
    fixedNote: "声明 top: 0 → 触线瞬间切换为吸附态",
  },
  {
    id: "tall",
    tab: "病历 04 · 超高粘性块",
    title: "粘性目录自身比视口还高",
    symptom: "把 30 条超长目录整块设成 top: 0 吸顶，结果底部那 10 条链接永远露不出来、点不到。",
    cause: "粘性块一触顶就卡死在 top: 0，如果它自己的高度大于视口，超出的下半截在父盒顶走它之前根本无法进入视野。",
    brokenCode: ".mega-toc {\n  position: sticky;\n  top: 0;\n  /* 高度 520px > 视口 300px，底部永不可见 */\n}",
    fixedCode: ".mega-toc {\n  position: sticky;\n  top: 0;\n  max-height: calc(100svh - 24px);\n  overflow-y: auto; /* ✓ 给自身限高并允许内滚 */\n}",
    fixBtn: "加 max-height 与内部滚动",
    brokenNote: "目录超出视口底部 45%，尾部链接被永远截断",
    fixedNote: "限高 + 内部轻滚，头部吸顶且尾部全部可达",
  },
];

// ---------- 第 04 节：真实核实史料时间线 ----------
export const TIMELINE_NODES = [
  {
    year: "2002",
    label: "OEBPS 表头先声",
    title: "电子书标准最早提出「滚页驻留表头」设想",
    body: "早在 2002 年，电子书开放标准 OEBPS（EPUB 的前身）社区讨论中就曾浮现过让长表格表头随滚页停驻边缘的构想；Edward O'Connor 在 2012 年的正式 CSS 提案邮件里专门回溯了这段先声，只是当时浏览器渲染管线尚未具备原生落地土壤。",
    badge: "先声构想",
  },
  {
    year: "2008",
    label: "iOS 通讯录普及",
    title: "iPhone OS 2.0 让分段交棒成为大众直觉",
    body: "2008 年随 iPhone OS 2.0 发布的 UITableViewStylePlain（如原生通讯录与音乐列表）把「字母分组吸顶、下一组向上顶走上一组」带进了 3.5 寸小屏。人们第一次发现：无需回顶也能时刻知道自己身处哪个分区。",
    badge: "移动端范式",
  },
  {
    year: "2012",
    label: "W3C 正式提案",
    title: "Edward O'Connor 在 www-style 提案并落地 WebKit",
    body: "2012 年 6 月 26 日，Apple 工程师 Edward O'Connor 在 W3C www-style 邮件列表提交 Sticky Positioning 提案，直指当时用 JavaScript scroll 监听切换 fixed 会破坏浏览器异步硬件滚屏、引发明显抖动（jank）。同年 8 月，WebKit 率先实现 -webkit-sticky。",
    badge: "标准起航",
  },
  {
    year: "2014–2017",
    label: "双核跨端定型",
    title: "Firefox 32 首发无前缀，Chrome 56 重写合成器回归",
    body: "2014 年 Firefox 32 率先默认开启无前缀 position: sticky；而 Chrome 曾因早期合成层架构缺陷在 2013–2014 年间一度撤回实验实现，历时数年重整 Blink 滚动管线后，终于在 2017 年 1 月 Chrome 56 正式稳定回归。",
    badge: "全端普及",
  },
  {
    year: "2022–2025",
    label: "现代生态补全",
    title: "overflow: clip 跨端合流，scroll-state(stuck) 免脚本感应",
    body: "2022 年 9 月 Safari 16 跟进使 overflow: clip 达成全浏览器 Baseline，彻底终结「裁圆角与粘性吸顶二选一」的十年老坑；2025 年 Chrome 133 推出 @container scroll-state(stuck: top) 滚动状态容器查询，连「吸住后才亮起阴影」也无需再写 JS 哨兵。",
    badge: "当代进化",
  },
];

// ---------- 第 05 节：多屏设备粘性占空计算器 ----------
export const DEVICES = {
  desktop: { id: "desktop", name: "桌面端", w: 1440, h: 900 },
  mobileV: { id: "mobileV", name: "手机竖屏", w: 390, h: 844 },
  mobileH: { id: "mobileH", name: "手机横屏", w: 844, h: 390 },
};

export const STICKY_LAYERS = [
  { id: "nav", label: "主导航栏", h: 56 },
  { id: "sec", label: "分区标题", h: 44 },
  { id: "filter", label: "筛选工具栏", h: 52 },
  { id: "promo", label: "活动公告条", h: 46 },
];

export function evaluateBudget({ deviceId, layers, autoUnstick }) {
  const dev = DEVICES[deviceId] || DEVICES.mobileH;
  const active = STICKY_LAYERS.filter((l) => layers[l.id]);
  const rawPinned = active.reduce((sum, l) => sum + l.h, 0);
  // 响应式解粘：在视口高度 <= 480px 时只保留最轻单层或全部释放
  const unstickTriggered = autoUnstick && dev.h <= 480;
  const effectivePinned = unstickTriggered ? 0 : rawPinned;
  const ratio = Math.round((effectivePinned / dev.h) * 100);
  const netH = dev.h - effectivePinned;

  let status = "ok";
  let verdict = `吸顶共 ${effectivePinned}px（占屏高 ${ratio}%），净阅读区 ${netH}px 充裕清晰。`;
  if (unstickTriggered) {
    status = "ok";
    verdict = `已触发 @media (max-height: 480px) 自动解粘，释放全部 ${rawPinned}px 空间给横屏正文（净高 ${netH}px）。`;
  } else if (ratio > 30) {
    status = "error";
    verdict = `吸顶叠加高达 ${effectivePinned}px（占屏高 ${ratio}%，超过 25%–30% 经验上限），净阅读区仅剩 ${netH}px，正文被夹成细缝。`;
  } else if (ratio > 22) {
    status = "warn";
    verdict = `吸顶已占 ${ratio}%（${effectivePinned}px），接近舒适红线，建议合并筛选栏或在矮屏解粘。`;
  }

  return { dev, active, rawPinned, effectivePinned, ratio, netH, unstickTriggered, status, verdict };
}

// ---------- 第 06 节：单变量代码审查练习题 ----------
export const QUIZ_OPTIONS = [
  {
    key: "A",
    label: "方案 A",
    code: ".page { overflow-x: hidden; }\n.main { display: flex; align-items: flex-start; }\n.toc  { position: sticky; top: 24px; }",
    correct: false,
    diff: "差异变量：.page 使用 overflow-x: hidden",
    reason: "按 CSS Overflow 规范，只要单轴设为 hidden，另一轴（overflow-y）的计算值会从 visible 静默变成 auto，等于把 .page 变成了隐藏滚动祖先——右侧 .toc 立刻失去对视口的吸附参照。",
  },
  {
    key: "B",
    label: "方案 B",
    code: ".page { overflow-x: clip; }\n.main { display: flex; align-items: stretch; }\n.toc  { position: sticky; top: 24px; }",
    correct: false,
    diff: "差异变量：.main 使用 align-items: stretch",
    reason: "overflow-x: clip 本身没错，但 Flex 的 align-items: stretch 会把右侧 .toc 强行拉到和左侧长文章一样高。目录自身高度等于父容器高度，滑行余量为 0px，根本动不了。",
  },
  {
    key: "C",
    label: "方案 C",
    code: ".page { overflow-x: clip; }\n.main { display: flex; align-items: flex-start; }\n.toc  { position: sticky; top: 24px; }",
    correct: true,
    diff: "差异变量：clip 裁边 + flex-start 留行程 + top 阈值齐全",
    reason: "唯一全部过关的写法：overflow-x: clip 阻止横图撑宽却不建滚动容器；align-items: flex-start 让 .toc 保持自身矮高度、在长文父盒里拥有完整滑行轨道；top: 24px 明确给出顶边吸合阈值，滚完正文还会随 .main 自然退场不压页脚。",
  },
  {
    key: "D",
    label: "方案 D",
    code: ".page { overflow-x: clip; }\n.main { display: flex; align-items: flex-start; }\n.toc  { position: sticky; z-index: 10; }",
    correct: false,
    diff: "差异变量：.toc 仅写 z-index: 10，未声明 top",
    reason: "外层和 Flex 都没踩坑，但 .toc 漏掉了 top: 24px 等任何 inset 阈值。没有触发线时，规范要求它始终按普通相对定位原地跟着文章滚走，z-index: 10 并不能激活吸附。",
  },
];
