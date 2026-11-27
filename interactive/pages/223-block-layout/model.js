// 223 · 块级布局 BLOCK LAYOUT — 单一事实源（Single Source of Truth）
// 所有开场装配舱的容器尺寸、七段水平恒等式、外边距穿透、溢底、4 项原海报原则验收、
// 8 类双向错态诊单以及正文 01–06 节数据均从此处计算，UI、Canvas 测绘层与 CSS 读数共用同一结果。

export const CONTEXTS = {
  poster: {
    id: "poster",
    tab: "原海报 · 模块标本",
    shortTab: "原海报",
    containerLabel: "容器 CONTAINER",
    moduleLabel: "模块 MODULE",
    headerZh: "头部模块",
    headerEn: "HEADER MODULE",
    contentZh: "内容区",
    contentEn: "CONTENT",
    contentSub: "独立矩形 · 核心视觉与正文主槽",
    sideItems: [
      { zh: "侧栏区", en: "SIDEBAR", meta: "补充说明" },
      { zh: "导航区", en: "NAVIGATION", meta: "路径索引" },
      { zh: "辅助区", en: "AUXILIARY", meta: "工具 / 标签" },
      { zh: "注释区", en: "FOOTNOTE", meta: "扩展模块 04" },
      { zh: "关联区", en: "RELATED", meta: "扩展模块 05" },
      { zh: "归档区", en: "ARCHIVE", meta: "扩展模块 06" },
      { zh: "尾签区", en: "BADGE", meta: "扩展模块 07" },
    ],
    footerZh: "底部模块",
    footerEn: "FOOTER MODULE",
    showArt: true,
  },
  blog: {
    id: "blog",
    tab: "博客 · 长文骨架",
    shortTab: "博客页",
    containerLabel: "文章外容器 <main>",
    moduleLabel: "主体区 <article>",
    headerZh: "刊头导航条",
    headerEn: "SITE HEADER",
    contentZh: "正文专栏",
    contentEn: "ARTICLE BODY",
    contentSub: "每段自带换行与独立外边距，阅读视线笔直向下。",
    sideItems: [
      { zh: "章节目录", en: "TOC", meta: "当前阅读定位" },
      { zh: "作者名片", en: "AUTHOR", meta: "独立信息卡" },
      { zh: "延展阅读", en: "LINKS", meta: "相邻专题" },
      { zh: "版本记录", en: "CHANGELOG", meta: "扩展模块 04" },
      { zh: "引用列表", en: "SOURCES", meta: "扩展模块 05" },
      { zh: "订阅提醒", en: "DIGEST", meta: "扩展模块 06" },
      { zh: "标签云", en: "TAGS", meta: "扩展模块 07" },
    ],
    footerZh: "版权与站点索引",
    footerEn: "SITE FOOTER",
    showArt: false,
  },
  dashboard: {
    id: "dashboard",
    tab: "产品 · 后台面板",
    shortTab: "工作台",
    containerLabel: "画布外框 .shell",
    moduleLabel: "工作面 .workspace",
    headerZh: "顶栏状态与检索",
    headerEn: "TOP BAR",
    contentZh: "核心趋势画板",
    contentEn: "PRIMARY CANVAS",
    contentSub: "占据视觉主权，边框与内距严守父容器边界。",
    sideItems: [
      { zh: "指标概览", en: "KPI CARD", meta: "实时读数" },
      { zh: "筛选条件", en: "FILTERS", meta: "独立控件组" },
      { zh: "快捷操作", en: "ACTIONS", meta: "高频入口" },
      { zh: "告警日志", en: "ALERTS", meta: "扩展模块 04" },
      { zh: "队列状态", en: "QUEUE", meta: "扩展模块 05" },
      { zh: "权限摘要", en: "ACCESS", meta: "扩展模块 06" },
      { zh: "导出记录", en: "EXPORTS", meta: "扩展模块 07" },
    ],
    footerZh: "系统版本与状态栏",
    footerEn: "STATUS BAR",
    showArt: false,
  },
};

export const PATTERNS = {
  twoCol: { id: "twoCol", label: "主次双栏", short: "双栏", posterNote: "原海报主图（左主内容 + 右三叠辅助）" },
  single: { id: "single", label: "单栏纯块", short: "单栏", posterNote: "纯 CSS display: block 原生纵向堆叠" },
  threeCol: { id: "threeCol", label: "三栏组合", short: "三栏", posterNote: "原海报示例三（窄容器下最易挤塌）" },
  classic: { id: "classic", label: "头 + 中 + 底", short: "头中底", posterNote: "原海报示例四（经典三段纵向骨架）" },
};

// 开场默认停在 0/4 四重块级翻车错态（非答案）
export const BROKEN_STATE = {
  context: "poster",
  pattern: "twoCol",
  containerW: 500,        // px（合法推拉范围 280..680）
  contentDisplay: "inline", // inline | inline-block | block
  widthMode: "pct-content", // pct-content | pct-border | auto
  sealMode: "open",       // open（无内距无边框致顶边距穿透） | padded | flow-root
  heightMode: "fixed",    // fixed（辅助区写死 64px 爆盒） | auto
  auxCount: 3,            // 1..7
  containerPad: 0,        // 0..64（sealMode === "open" 时为 0）
  xray: false,
};

// 多组合法解预设（不止一种答案）
export const SOLUTIONS = {
  posterClassic: {
    id: "posterClassic",
    label: "原海报典范解",
    note: "width: auto + 16px 容器封口 + height: auto，540px 主次双栏。",
    patch: {
      pattern: "twoCol",
      containerW: 540,
      contentDisplay: "block",
      widthMode: "auto",
      sealMode: "padded",
      containerPad: 16,
      heightMode: "auto",
      auxCount: 3,
    },
  },
  borderBoxStrict: {
    id: "borderBoxStrict",
    label: "border-box 严丝解",
    note: "width: 100% 配 border-box，边框内距向内扣除，一样零溢出。",
    patch: {
      pattern: "twoCol",
      containerW: 520,
      contentDisplay: "block",
      widthMode: "pct-border",
      sealMode: "flow-root",
      containerPad: 14,
      heightMode: "auto",
      auxCount: 3,
    },
  },
  singleMobile: {
    id: "singleMobile",
    label: "窄屏单栏纯块解",
    note: "340px 窄容器切回单栏纯块流，每块独占整行不挤字。",
    patch: {
      pattern: "single",
      containerW: 340,
      contentDisplay: "block",
      widthMode: "auto",
      sealMode: "padded",
      containerPad: 12,
      heightMode: "auto",
      auxCount: 2,
    },
  },
  extendedFour: {
    id: "extendedFour",
    label: "扩展四块长卷解",
    note: "600px 宽容器下扩展到 4 个辅助块，height: auto 顺流推开底部。",
    patch: {
      pattern: "twoCol",
      containerW: 600,
      contentDisplay: "block",
      widthMode: "auto",
      sealMode: "padded",
      containerPad: 18,
      heightMode: "auto",
      auxCount: 4,
    },
  },
};

// 双向试错预设（用户可以主动造错，看系统如何反向检出）
export const FAULTS = {
  resetBroken: {
    id: "resetBroken",
    label: "开场四错态",
    patch: { ...BROKEN_STATE, xray: false },
  },
  overflowWall: {
    id: "overflowWall",
    label: "撑破右墙",
    patch: {
      pattern: "twoCol",
      containerW: 480,
      contentDisplay: "block",
      widthMode: "pct-content",
      sealMode: "padded",
      containerPad: 16,
      heightMode: "auto",
      auxCount: 3,
    },
  },
  narrowThree: {
    id: "narrowThree",
    label: "窄屏塞三栏",
    patch: {
      pattern: "threeCol",
      containerW: 320,
      contentDisplay: "block",
      widthMode: "auto",
      sealMode: "padded",
      containerPad: 12,
      heightMode: "auto",
      auxCount: 3,
    },
  },
  overSplit: {
    id: "overSplit",
    label: "过碎拆 7 块",
    patch: {
      pattern: "twoCol",
      containerW: 520,
      contentDisplay: "block",
      widthMode: "auto",
      sealMode: "padded",
      containerPad: 16,
      heightMode: "auto",
      auxCount: 7,
    },
  },
  padChoke: {
    id: "padChoke",
    label: "厚内距挤扁",
    patch: {
      pattern: "twoCol",
      containerW: 340,
      contentDisplay: "block",
      widthMode: "auto",
      sealMode: "padded",
      containerPad: 62,
      heightMode: "auto",
      auxCount: 2,
    },
  },
};

// 模块固定测绘参数（单真源，DOM 与 Canvas 严格共用）
export const MODULE_METRICS = {
  headerMarginTop: 20,      // 头部模块顶边距（未封口时会穿透父容器）
  headerH: 38,
  footerH: 36,
  contentPadX: 20,          // 主内容块左右内边距
  contentBorderX: 4,        // 主内容块左右边框
  contentMarginX: 0,
  auxCardH: 42,             // 每个辅助子块自然高度
  auxGap: 8,
  auxFixedH: 64,            // 定死高度陷阱值
  mainNaturalH: 154,
  colGap: 12,
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 从状态算出所有真实块级几何数据、七段等式、四项验收和白话诊单
export function evaluate(state) {
  const cw = Math.round(clamp(state.containerW, 280, 680));
  const outerBorder = state.sealMode === "open" ? 0 : 4;
  const pad = state.sealMode === "open" ? 0 : Math.round(clamp(state.containerPad, 8, 64));
  const innerAvail = Math.max(120, cw - outerBorder * 2 - pad * 2);
  const padRatio = (outerBorder * 2 + pad * 2) / cw;

  // 列宽分配（根据组合模式决定主内容槽宽与辅助槽宽）
  const isSingle = state.pattern === "single" || state.pattern === "classic";
  const isThree = state.pattern === "threeCol";
  const gap = MODULE_METRICS.colGap;

  let mainSlotW = innerAvail;
  let sideSlotW = innerAvail;
  let navSlotW = 0;

  if (state.pattern === "twoCol") {
    mainSlotW = Math.round((innerAvail - gap) * 0.63);
    sideSlotW = Math.max(60, innerAvail - gap - mainSlotW);
  } else if (isThree) {
    navSlotW = Math.round((innerAvail - gap * 2) * 0.24);
    sideSlotW = Math.round((innerAvail - gap * 2) * 0.24);
    mainSlotW = Math.max(64, innerAvail - gap * 2 - navSlotW - sideSlotW);
  }

  // 主内容块的水平七段等式计算（CSS1 §4.1.2）
  const mL = MODULE_METRICS.contentMarginX;
  const mR = MODULE_METRICS.contentMarginX;
  const bL = MODULE_METRICS.contentBorderX;
  const bR = MODULE_METRICS.contentBorderX;
  const pL = MODULE_METRICS.contentPadX;
  const pR = MODULE_METRICS.contentPadX;
  const chromeX = bL + bR + pL + pR; // 48px

  let contentBoxW = mainSlotW;
  let totalRenderW = mainSlotW;
  let overflowPx = 0;

  if (state.contentDisplay === "inline") {
    // 行内盒忽略 width / height，按文字自然行宽折断
    contentBoxW = Math.min(mainSlotW - 24, 148);
    totalRenderW = contentBoxW + chromeX;
    overflowPx = Math.max(0, totalRenderW - mainSlotW);
  } else if (state.contentDisplay === "inline-block") {
    // 收缩包裹内容，不占满整行
    contentBoxW = Math.min(mainSlotW - chromeX, 172);
    totalRenderW = contentBoxW + chromeX;
    overflowPx = Math.max(0, totalRenderW - mainSlotW);
  } else {
    // display: block 严格遵循七段水平等式
    if (state.widthMode === "pct-content") {
      // width: 100% + content-box → content = mainSlotW，加上左右 border+padding 必溢出！
      contentBoxW = mainSlotW;
      totalRenderW = contentBoxW + chromeX + mL + mR;
      overflowPx = Math.max(0, totalRenderW - mainSlotW);
    } else if (state.widthMode === "pct-border") {
      // width: 100% + border-box → 总宽锁在 mainSlotW，内容区自动缩减
      totalRenderW = mainSlotW;
      contentBoxW = Math.max(24, mainSlotW - chromeX);
      overflowPx = 0;
    } else {
      // width: auto → 七段恒等式自动扣掉 m/b/p，零溢出
      totalRenderW = mainSlotW;
      contentBoxW = Math.max(24, mainSlotW - chromeX - mL - mR);
      overflowPx = 0;
    }
  }

  // 顶边距穿透检测（CSS 2.1 §8.3.1 父子第一子块外边距折叠）
  const marginEscapePx = state.sealMode === "open" ? MODULE_METRICS.headerMarginTop : 0;

  // 辅助区可扩展性与定高溢底检测
  const auxCount = Math.round(clamp(state.auxCount, 1, 7));
  const auxNeededH = auxCount * MODULE_METRICS.auxCardH + Math.max(0, auxCount - 1) * MODULE_METRICS.auxGap;
  const auxBoxH = state.heightMode === "fixed" ? MODULE_METRICS.auxFixedH : auxNeededH;
  const auxOverflowPx = Math.max(0, auxNeededH - auxBoxH);

  // 主内容高度与面积主次占比
  const mainH = state.contentDisplay === "inline"
    ? 34
    : state.contentDisplay === "inline-block"
      ? 92
      : Math.max(MODULE_METRICS.mainNaturalH, isSingle ? 132 : Math.min(230, auxNeededH));

  const mainArea = Math.min(totalRenderW, mainSlotW) * mainH;
  const sideArea = state.pattern === "classic"
    ? 0
    : (isThree ? (sideSlotW + navSlotW) : sideSlotW) * auxNeededH;
  const chromeArea = innerAvail * (MODULE_METRICS.headerH + MODULE_METRICS.footerH);
  const totalContentArea = Math.max(1, mainArea + sideArea + chromeArea * 0.45);
  const mainSharePct = Math.round((mainArea / totalContentArea) * 100);

  // 最窄栏宽（检测窄容器硬塞多栏）
  const colMinW = isSingle ? innerAvail : isThree ? Math.min(navSlotW, sideSlotW, mainSlotW) : Math.min(mainSlotW, sideSlotW);

  // 检出全部 8 类正反错态
  const issues = [];
  if (state.contentDisplay === "inline") {
    issues.push({
      code: "inline_collapse",
      short: "行内塌陷",
      title: "主内容块设成了 display: inline，独立矩形骨架当场瓦解",
      why: "行内盒会忽略 width 与 height，也无法独占一行——人眼进页面找不到主内容大块，只能看到一行被边框和内距挤糊的文字条。",
      action: "点画布上的「内容区」红标（或下方刀闸），把它切回 display: block，恢复独立矩形轮廓。",
    });
  }
  if (overflowPx > 0) {
    issues.push({
      code: "box_overflow",
      short: `溢墙 +${overflowPx}px`,
      title: `width: 100% 配 content-box 把模块撑出右墙 +${overflowPx}px`,
      why: `按 CSS1 水平七段等式，100% 只算内容宽 ${contentBoxW}px，左右内边距（${pL + pR}px）与边框（${bL + bR}px）再往外叠，实际冲破父容器右壁，模块边界的「独立性」立刻失守。`,
      action: "把宽度策略改回「width: auto」（七段等式自动留余量），或切到「100% + border-box」把内距边框收进盒内。",
    });
  }
  if (marginEscapePx > 0) {
    issues.push({
      code: "margin_escape",
      short: `顶距穿透 ${marginEscapePx}px`,
      title: `头部块的 ${marginEscapePx}px 顶边距直接穿出容器顶部`,
      why: "外层容器既无顶部边框也无顶部内边距，也没建立独立流根（225），按 CSS 2.1 外边距折叠规则，首子块的 margin-top 会漏到容器外面，把整张容器拉下移并撕出顶部红缝。",
      action: "给外容器开启「加内距边框封口」或「flow-root 隔离」，立刻把顶部外边距兜回容器内部。",
    });
  }
  if (auxOverflowPx > 0) {
    issues.push({
      code: "fixed_height_clip",
      short: `定高溢底 +${auxOverflowPx}px`,
      title: `辅助区写死 height: ${auxBoxH}px，${auxCount} 个模块多出 +${auxOverflowPx}px 直接撞上底部块`,
      why: "块级布局靠「可扩展」立足——内容增删时块高应自然撑开并顺流推开下方模块。把容器高度锁成固定像素后，每多加一块都会溢底叠压到底部模块上。",
      action: "把辅助区高度切回「height: auto」，再试试点「+ 增块」看它如何安稳推开炭黑底部块。",
    });
  }
  if (colMinW < 96) {
    issues.push({
      code: "narrow_three_col",
      short: `窄栏仅 ${colMinW}px`,
      title: `在 ${cw}px 窄容器里硬塞「${PATTERNS[state.pattern].label}」，最窄一栏被压成 ${colMinW}px 细条`,
      why: "分块不是越多栏越高级：当容器宽度不足时，横向并排会把每个矩形模块挤成无法容纳标题与内容的竖纸条，反而毁掉信息可读性。",
      action: "向右拖宽朱红容器壁到 480px 以上，或点「单栏纯块」让窄屏回归纵向独占堆叠。",
    });
  }
  if (padRatio >= 0.42) {
    issues.push({
      code: "over_padded",
      short: `内距占 ${Math.round(padRatio * 100)}%`,
      title: `容器四周内距吃掉 ${Math.round(padRatio * 100)}% 宽度，框比内容还厚`,
      why: `当前容器宽 ${cw}px，但左右内边距加边框就占去 ${outerBorder * 2 + pad * 2}px，中间有效槽宽只剩 ${innerAvail}px，模块被压得喘不过气。`,
      action: "把「容器内距」调回 12–24px，或向右推宽容器，让内容区重新拿回主角空间。",
    });
  }
  if (auxCount > 5) {
    issues.push({
      code: "over_fragmented",
      short: `过碎 ${auxCount} 块`,
      title: `一屏塞进 ${auxCount} 个零散辅助子块，视觉滑向碎片化`,
      why: "海报强调「清晰分块、有序呈现」：把原本相关的小信息过度拆成 6–7 个独立小框，会产生大量边界噪音，让读者在零碎方格里迷失主次。",
      action: "点「- 删块」把同屏辅助块收束到 2–5 个核心模块，重新稳住大块面节奏。",
    });
  }
  if (state.contentDisplay === "inline-block" || (state.contentDisplay === "block" && mainSharePct < 40)) {
    issues.push({
      code: "weak_hierarchy",
      short: state.contentDisplay === "inline-block" ? "收缩不占行" : `主区仅 ${mainSharePct}%`,
      title: state.contentDisplay === "inline-block"
        ? "inline-block 让主内容收缩包裹，空出右半截无法撑满主槽"
        : `主内容区视觉占比仅 ${mainSharePct}%，层级被辅助块拉平`,
      why: state.contentDisplay === "inline-block"
        ? "inline-block 会像文字一样按内容宽度收缩，失去块级容器主动铺满可用宽度、建立稳定骨架的力量。"
        : "海报「层级 HIERARCHY」要求通过大小与位置建立优先级；辅助模块太满或主区太窄时，第一眼分不清主次。",
      action: state.contentDisplay === "inline-block"
        ? "把主内容块切回「display: block」，让它稳稳铺满主内容槽。"
        : "适当删减冗余辅助块或切到主次双栏/单栏，把主内容区占比拉回 42% 以上。",
    });
  }

  // 四项单真源验收灯（严密对应 223 原海报三原则 + 核心概念层级）
  const checks = {
    independent: state.contentDisplay === "block" && overflowPx === 0 && marginEscapePx === 0,
    composable: state.contentDisplay === "block" && colMinW >= 96 && padRatio < 0.42,
    extensible: auxOverflowPx === 0 && auxCount >= 1 && auxCount <= 5,
    hierarchy: state.contentDisplay === "block" && mainSharePct >= 40 && contentBoxW >= 120,
  };
  const passed = Object.values(checks).filter(Boolean).length;

  // 状态总评与视觉独立度（0..1，供刊头「块级布局」四字自示范联动）
  const coherence = passed / 4;
  let gradeLabel = "结构成立";
  let headline = "四项块级规则全部成立：边界独立、组合从容、扩展稳妥";
  let why = `当前容器宽 ${cw}px，主内容净宽 ${contentBoxW}px、渲染总宽 ${totalRenderW}px（零溢出），外边距全留在容器内，${auxCount} 个辅助块按 height: auto 自然排开，主次占比 ${mainSharePct}% 一眼分明。`;
  let action = "试着按 Space 开启盒尺 X-Ray 透视，或点击「+ 增块」与左右拖墙，检验任意容器宽度下它为何始终不崩。";

  if (issues.length > 0) {
    const top = issues[0];
    gradeLabel = top.short;
    headline = top.title;
    why = top.why;
    action = top.action;
  }

  // 实时生成的 4 行核心 CSS 代码（与画布状态 100% 同步）
  const eqComment = state.contentDisplay !== "block"
    ? `/* 非块级：收缩实绘 ${totalRenderW}px（未占满槽宽 ${mainSlotW}px） */`
    : overflowPx > 0
      ? `/* 七段等式：${mL}+${bL}+${pL}+${contentBoxW}+${pR}+${bR}+${mR} = ${totalRenderW}px（超槽 +${overflowPx}px） */`
      : `/* 七段等式：${mL}+${bL}+${pL}+${contentBoxW}+${pR}+${bR}+${mR} = ${totalRenderW}px = 槽宽 ${mainSlotW}px */`;

  const cssLines = [
    `.container { width: ${cw}px; ${state.sealMode === "open" ? "padding: 0; border: 0;" : state.sealMode === "flow-root" ? `display: flow-root; padding: ${pad}px;` : `padding: ${pad}px; border: 4px solid #D65119;`} }`,
    `.content   { display: ${state.contentDisplay}; box-sizing: ${state.widthMode === "pct-border" ? "border-box" : "content-box"}; width: ${state.widthMode === "auto" ? "auto" : "100%"}; }`,
    `.auxiliary { height: ${state.heightMode === "fixed" ? `${auxBoxH}px /* 溢底 +${auxOverflowPx}px */` : "auto"}; /* 当前 ${auxCount} 个子块 */ }`,
    eqComment,
  ];

  // 自示范判定：不同合法解给出具体认可语
  let solutionName = "";
  if (passed === 4) {
    if (state.pattern === "single" || state.pattern === "classic") {
      solutionName = "原生纵向纯块解";
    } else if (state.widthMode === "pct-border") {
      solutionName = "border-box 严丝解";
    } else if (auxCount >= 4) {
      solutionName = "可扩展长卷解";
    } else {
      solutionName = "width: auto 典范解";
    }
  }

  return {
    cw,
    outerBorder,
    pad,
    innerAvail,
    padRatio,
    mainSlotW,
    sideSlotW,
    navSlotW,
    mL, bL, pL, contentBoxW, pR, bR, mR,
    totalRenderW,
    overflowPx,
    marginEscapePx,
    auxCount,
    auxNeededH,
    auxBoxH,
    auxOverflowPx,
    mainH,
    mainSharePct,
    colMinW,
    checks,
    passed,
    coherence,
    issues,
    gradeLabel,
    headline,
    why,
    action,
    cssLines,
    solutionName,
  };
}

// ---------- 正文 01 节：三态切片对照数据 ----------
export const DISPLAY_MODES = {
  block: {
    id: "block",
    code: "display: block",
    zh: "块级盒（默认独占整行）",
    summary: "哪怕只写了三个字，也独立占满父容器一整行；width、height 与上下左右 margin/padding 全部生效，前后自动换行。",
    ruleTag: "外：block / 内：flow",
    props: [
      { k: "行内占位", v: "前后断行，独立成块" },
      { k: "默认宽度", v: "auto → 自动填满父容器剩余宽度" },
      { k: "宽高与外距", v: "四向 margin / padding 与 width / height 全生效" },
    ],
    useNote: "适合作为标题、段落、卡片、侧栏与页脚等大结构容器。",
  },
  inline: {
    id: "inline",
    code: "display: inline",
    zh: "行内盒（顺文字流排开）",
    summary: "只包住文字本身，不打断当前行；设定的 width 与 height 会被浏览器忽略，上下 padding 虽会画出来却不会推开上下行。",
    ruleTag: "外：inline / 内：flow",
    props: [
      { k: "行内占位", v: "紧挨同行文字，自动随行尾折断" },
      { k: "默认宽度", v: "由内部文字决定，width / height 无效" },
      { k: "宽高与外距", v: "仅左右 margin 推开邻居，上下 margin 无效" },
    ],
    useNote: "属于 224 行内布局的主场：强调词、超链接、文本内徽标。",
  },
  flex: {
    id: "flex",
    code: "display: flex",
    zh: "块级外壳 + 弹性内舱",
    summary: "按 CSS Display Level 3 的双值视角，flex 本质是 block flex：对外部邻居仍像块级一样独占一行，仅把内部子项交给弹性轴分配。",
    ruleTag: "外：block / 内：flex",
    props: [
      { k: "行内占位", v: "外轮廓仍是块级，前后换行占满整行" },
      { k: "内部排布", v: "子模块沿主轴并排，可均分空白与垂直居中" },
      { k: "外边距折叠", v: "内部弹性子项的垂直外边距不再发生折叠" },
    ],
    useNote: "当块级容器内部需要横向并排（如双栏、导航条）时，交给 226 弹性盒或 227 网格。",
  },
};

// ---------- 正文 03 节：原海报底部 4 种模块组合真与偏 ----------
export const POSTER_EXAMPLES = [
  {
    id: "single",
    title: "单栏布局",
    en: "SINGLE COLUMN",
    badge: "纯 display: block 原生就能做到",
    isPureBlock: true,
    blocks: [
      { role: "header", label: "头部模块", area: "1 / 1 / 2 / 2" },
      { role: "main", label: "内容模块", area: "2 / 1 / 3 / 2" },
      { role: "footer", label: "底部模块", area: "3 / 1 / 4 / 2" },
    ],
    pureDesc: "三块全是原生 display: block，不用写一行额外排版代码，浏览器就按文档顺序自上而下稳稳堆成单栏——这也是手机竖屏最可靠的默认骨架。",
    modernDesc: "只要用 max-width 控住行长、margin-inline: auto 居中，它就是最纯粹、零兼容隐患的块级布局。",
    cssPure: ".page > * { display: block; width: auto; }",
    cssModern: ".page { max-width: 720px; margin-inline: auto; }",
  },
  {
    id: "twoCol",
    title: "双栏布局",
    en: "TWO COLUMNS",
    badge: "说多了一点 · 需外层容器配合分栏",
    isPureBlock: false,
    blocks: [
      { role: "header", label: "头部", area: "1 / 1 / 2 / 3" },
      { role: "main", label: "主内容", area: "2 / 1 / 3 / 2" },
      { role: "side", label: "侧栏", area: "2 / 2 / 3 / 3" },
    ],
    pureDesc: "如果把两块内容都只写 display: block，第二个块必然掉到第一块正下方，绝不会自己并到右边。",
    modernDesc: "外层骨架仍是块级（头部、主体容器、底部纵向堆叠），但「主体容器」内部改由 226 弹性盒或 227 网格把两块摆到左右并排。",
    cssPure: "/* 仅写 block 时：侧栏必然掉在主内容下面 */",
    cssModern: ".body-wrap { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }",
  },
  {
    id: "threeCol",
    title: "三栏布局",
    en: "THREE COLUMNS",
    badge: "说多了一点 · 窄屏需退回单栏块流",
    isPureBlock: false,
    blocks: [
      { role: "header", label: "头部", area: "1 / 1 / 2 / 4" },
      { role: "side", label: "左导", area: "2 / 1 / 3 / 2" },
      { role: "main", label: "主内容", area: "2 / 2 / 3 / 3" },
      { role: "side", label: "右辅", area: "2 / 3 / 3 / 4" },
    ],
    pureDesc: "早期网页靠 231 浮动布局硬拼三栏，还要防父容器塌陷；现代做法是让外层块容器用网格或弹性盒承接三栏。",
    modernDesc: "一旦屏幕缩窄到手机宽度，通过媒体查询或 242 容器查询撤掉网格列，三块立刻退回原生单栏块级纵堆——这就是块级作为底层托盘的价值。",
    cssPure: "/* 仅写 block 时：三栏竖排成一长列 */",
    cssModern: ".tri { display: grid; grid-template-columns: 180px 1fr 220px; }",
  },
  {
    id: "classic",
    title: "头部 + 内容 + 底部",
    en: "HEADER · MAIN · FOOTER",
    badge: "最经典的文档三段块级结构",
    isPureBlock: true,
    blocks: [
      { role: "header", label: "头部模块", area: "1 / 1 / 2 / 2" },
      { role: "main", label: "主内容模块（居中宽幅）", area: "2 / 1 / 3 / 2" },
      { role: "footer", label: "底部模块", area: "3 / 1 / 4 / 2" },
    ],
    pureDesc: "三大语义块 <header>、<main>、<footer> 天生都是块级容器：各自独占整行，头部定导航、中部自然生长、底部自然垫后。",
    modernDesc: "哪怕正文从 3 段涨到 30 段，底部模块也会老老实实被顺流推下去，绝不会撞车——这就是块级布局「结构稳定与一致」的根基。",
    cssPure: "header, main, footer { display: block; }",
    cssModern: "main { min-height: 60vh; } /* 内容少时也撑住呼吸感 */",
  },
];

// ---------- 正文 04 节：核实历史时间线 ----------
export const TIMELINE = [
  {
    year: "1995",
    date: "1995 年 11 月",
    spec: "HTML 2.0（IETF RFC 1866）",
    authors: "Tim Berners-Lee · Dan Connolly",
    headline: "把网页文本切成标题、段落与列表结构单元",
    body: "早期超文本标准尚未用「block vs inline」的全局二分命名，但已在 SGML 内容模型中确立了段落 <p>、标题 <h1>–<h6> 与列表 <ul> 等自成段落的块状文档结构，为后续块级渲染打下语义底稿。",
    diagram: "doc-blocks",
    tag: "语义雏形",
  },
  {
    year: "1996",
    date: "1996 年 12 月 17 日",
    spec: "W3C CSS1 推荐标准（第 4.1 节）",
    authors: "Håkon Wium Lie · Bert Bos",
    headline: "首次写下块级格式化模型与七段水平恒等式",
    body: "CSS1 第 4.1 节正式定义块级元素（Block-level elements）：4.1.1 节规定相邻块级垂直外边距取大值折叠，4.1.2 节写定左右外距 + 边框 + 内距 + 内容宽必等于父宽的七段恒等式。",
    diagram: "css1-eq",
    tag: "模型立规",
  },
  {
    year: "1998–99",
    date: "1998 年 5 月 / 1999 年 12 月",
    spec: "CSS2（1998）与 HTML 4.01（1999）",
    authors: "W3C CSS / HTML 工作组",
    headline: "确立块级与行内二分，提出块格式化上下文",
    body: "1998 年 5 月 12 日发布的 CSS2 第 9.4.1 节正式提出「块格式化上下文（BFC）」；1999 年 12 月 24 日发布的 HTML 4.01 将正文元素明确划分为块级（block-level）与行内（inline）两大类。",
    diagram: "bfc-split",
    tag: "BFC 确立",
  },
  {
    year: "2011–18",
    date: "2011 年 6 月 / 2018 年 6 月",
    spec: "CSS 2.1（2011）与 CSS3 UI（2018）",
    authors: "W3C CSS 工作组",
    headline: "精修外边距折叠细则，将 border-box 纳入标准",
    body: "2011 年 6 月 7 日 CSS 2.1 成为推荐标准，系统厘清父子与空块的外边距折叠条件；2018 年 6 月 21 日 CSS Basic User Interface Level 3 正式确立 box-sizing: border-box，化解 100% 宽度加内距撑破容器的老痛点。",
    diagram: "border-box",
    tag: "盒尺定型",
  },
  {
    year: "Level 3",
    date: "CSS Display Module Level 3",
    spec: "W3C 候选推荐标准（CR）",
    authors: "Elika J. Etemad · Tab Atkins Jr.",
    headline: "把 display 拆成「外角色 + 内引擎」双值语法",
    body: "现代规范不再把所有性质揉成一个词，而是把 display 拆为外部显示类型（block / inline）与内部布局模型（flow / flow-root / flex / grid）：传统 display: block 就是 display: block flow，而 display: flex 则是 block flex。",
    diagram: "two-value",
    tag: "双值解耦",
  },
];

// ---------- 正文 05 节：场景分诊 ----------
export const TRIAGE_CASES = [
  {
    id: "article",
    prompt: "一篇带小标题、配图、引用卡和页脚的长技术文章",
    verdict: "适合纯块级布局",
    ok: true,
    reason: "信息天然从上到下线性推进，每块各自独占整行、高度随段落自然伸缩，正是块级布局的本命主场（搭配 222 普通流）。",
    linkId: "222",
    linkLabel: "222 普通流布局",
  },
  {
    id: "badge",
    prompt: "一段中文正文里紧跟着两个彩色小标签和一段斜体注释",
    verdict: "别硬用 block · 交给 224 行内布局",
    ok: false,
    reason: "一旦把标签设成 display: block，它会当场把句子拦腰截断换行；需要贴着文字基线顺排的元素必须走行内流。",
    linkId: "224",
    linkLabel: "224 行内布局",
  },
  {
    id: "toolbar",
    prompt: "顶部导航栏：左徽标、中间菜单水平等距、右端按钮垂直居中",
    verdict: "外用块级占位 · 内交 226 弹性盒",
    ok: false,
    reason: "整条导航栏对外仍是一个块级头模块，但内部单轴对齐与弹性空白分配不要靠纯块级硬凑，直接交给 Flexbox。",
    linkId: "226",
    linkLabel: "226 弹性盒布局",
  },
  {
    id: "bento",
    prompt: "数据大屏里跨两行两列的拼板图表与多列等高卡片",
    verdict: "外用块级占位 · 内交 227 网格布局",
    ok: false,
    reason: "二维行列同时对齐与跨格占位超出了单向块级堆叠的能力，硬用块级嵌套只会写出冗长的套娃 div。",
    linkId: "227",
    linkLabel: "227 网格布局",
  },
  {
    id: "card-reuse",
    prompt: "同一张商品卡既塞进宽主栏，又塞进窄侧栏，想按自身宽度自动变排版",
    verdict: "块做容器 · 断点交 242 容器查询",
    ok: false,
    reason: "卡片外壳仍然是独立块容器，但让它根据自身宽而非整屏宽切换内部排布，应该用 @container 查询。",
    linkId: "242",
    linkLabel: "242 容器查询布局",
  },
];

// ---------- 正文 06 节：单变量小测 ----------
export const QUIZ = {
  question: "一个 600px 宽的父容器里要放一张独立说明卡，要求四边内边距 24px、边框 4px，既严丝合缝撑满容器宽度、零横向溢出，又在文字变长时自动撑高不挡住下方页脚。下面四组写法中，哪一组最稳妥？",
  answer: "B",
  options: [
    {
      key: "A",
      code: "display: block;\nwidth: 100%;\nbox-sizing: content-box;\nheight: auto;",
      meta: "方案 A · width: 100% / content-box",
      diagram: "overflow",
      feedback: "这正是开场最常见的翻车坑：content-box 下 width: 100% 把内容区定成 600px，再加上左右 24px 内边距与 4px 边框，实际总宽变成 656px，硬生生撑破容器右墙 +56px。",
    },
    {
      key: "B",
      code: "display: block;\nwidth: auto;\nbox-sizing: content-box;\nheight: auto;",
      meta: "方案 B · width: auto / content-box",
      diagram: "ideal",
      feedback: "正确答案！根据 CSS1 第 4.1.2 节七段水平恒等式，块级元素在 width: auto 时会先扣除左右边框（8px）与内边距（48px），把剩余 544px 分配给内容区，总宽严丝合缝等于 600px（零溢出），且 height: auto 保证内容增减时自然生长推开底部块。",
    },
    {
      key: "C",
      code: "display: block;\nwidth: 100%;\nbox-sizing: border-box;\nheight: 120px;",
      meta: "方案 C · width: 100% / border-box",
      diagram: "clip",
      feedback: "水平方向靠 border-box 稳住了 600px 零溢出，但把 height 写死成 120px 违背了块级「可扩展」原则：文字一多就会溢底撞上下方页脚，或者被强行裁切。",
    },
    {
      key: "D",
      code: "display: inline;\npadding: 24px;\nborder: 4px solid;\nheight: auto;",
      meta: "方案 D · display: inline / padding",
      diagram: "inline",
      feedback: "切成 display: inline 后失去了块级独占整行的独立性：width 与 height 失效，上下 24px 内边距和边框不会把相邻块推开，而是直接糊盖到上下方的模块内容上。",
    },
  ],
};
