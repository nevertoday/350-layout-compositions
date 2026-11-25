// 295 画布外模式 · 纯状态、响应式断点与单一几何真值源模型（供主舞台 DOM、Canvas 透视层与诊断带共用）

export const BREAKPOINTS = {
  mobileMax: 639,
  tabletMin: 640,
  desktopMin: 960,
};

export const ARTICLES = [
  {
    id: "bleed",
    chapter: "01 边界特稿",
    tag: "越界",
    kicker: "ISSUE 295 · BLEED",
    title: "屏幕边框不是墙，而是可推开的门",
    lead: "当导航与筛选工具退居可视画布之外，窄屏首页立刻腾出完整阅读纵深；只要边缘线索清晰，手指一划便能把隐藏层拉进来。",
    meta: "阅读约 4 分钟 · 空间架构",
    cards: [
      { id: "c1", tag: "越界", title: "左翼导航停靠带", note: "窄屏藏在 -240px 外，宽屏自动入列" },
      { id: "c2", tag: "裁切", title: "右侧半露 18% 留痕", note: "露出一点主内容边，告诉用户往回划" },
      { id: "c3", tag: "张力", title: "双侧不对称重心", note: "一次只展开一翼，避免主区被夹成窄缝" },
    ],
  },
  {
    id: "crop",
    chapter: "02 裁切手记",
    tag: "裁切",
    kicker: "ISSUE 295 · CROP",
    title: "为什么刻意裁掉一截，反而更容易被发现？",
    lead: "完全藏进图标后的功能常常被遗忘；如果列表边缘或抽屉拉手露出五分之一，人眼会自动补完边界之外的延续空间。",
    meta: "阅读约 3 分钟 · 发现机制",
    cards: [
      { id: "c4", tag: "裁切", title: "横向卡片半露法", note: "右缘留出 20% 截断卡，比小圆点更直观" },
      { id: "c5", tag: "越界", title: "顶部三条线 + 动词", note: "写上「目录」二字，减少盲猜成本" },
      { id: "c6", tag: "张力", title: "深蓝遮罩压低背景", note: "浮层滑出时，把视线稳稳留在抽屉里" },
    ],
  },
  {
    id: "tension",
    chapter: "03 动效力学",
    tag: "张力",
    kicker: "ISSUE 295 · TENSION",
    title: "推挤、浮层与掀开：三次不同的空间位移",
    lead: "同样是从画布外进入，推挤保留平面连续性，浮层保证主画布零重排，掀开则制造舞台帷幕般的层次纵深。",
    meta: "阅读约 5 分钟 · 交互物理",
    cards: [
      { id: "c7", tag: "张力", title: "GPU 合成位移", note: "只改 transform，不碰 width 避免跳行" },
      { id: "c8", tag: "越界", title: "inert 焦点隔离", note: "模态展开时锁住底层，防键盘溜出抽屉" },
      { id: "c9", tag: "裁切", title: "360dp 宽屏上限", note: "抽屉太宽会遮断方向感，保持可一眼扫完" },
    ],
  },
  {
    id: "archive",
    chapter: "04 断点归档",
    tag: "越界",
    kicker: "ISSUE 295 · ARCHIVE",
    title: "375 → 768 → 1180：三列如何一步步走出画布外",
    lead: "画布外模式的精髓不是永远隐藏，而是随视口宽度动态重排：手机两翼皆在外，平板左翼进场，桌面三列齐平。",
    meta: "阅读约 3 分钟 · 响应式演进",
    cards: [
      { id: "c10", tag: "越界", title: "375px 单列主舞台", note: "左右两翼均停泊在画布外，按需呼出" },
      { id: "c11", tag: "裁切", title: "768px 左栏常驻", note: "目录走进视野，筛选仍留在右侧边界外" },
      { id: "c12", tag: "张力", title: "1180px 三列展开", note: "零隐藏税，所有模块同屏协作" },
    ],
  },
];

export function createModel() {
  return {
    vw: 375,          // 320..1200 模拟视口宽
    mode: "push",     // "push" | "overlay" | "reveal"
    xray: true,       // true = 透视画布外区域; false = 真实裁切 overflow:hidden
    progress: 0,      // -1 (右筛选展开) .. 0 (关闭) .. +1 (左导航展开)
    target: 0,        // 目标位置（松手吸附）
    dragging: false,
    articleId: "bleed",
    filterTag: "全部",
    introDone: false,
  };
}

export function tierOf(vw) {
  if (vw < BREAKPOINTS.tabletMin) return "mobile";
  if (vw < BREAKPOINTS.desktopMin) return "tablet";
  return "desktop";
}

// 不同断点下，左右哪一侧还能拉出来
export function allowedRange(vw) {
  const tier = tierOf(vw);
  if (tier === "mobile") return { min: -1, max: 1, leftOff: true, rightOff: true };
  if (tier === "tablet") return { min: -1, max: 0, leftOff: false, rightOff: true };
  return { min: 0, max: 0, leftOff: false, rightOff: false };
}

export function clampProgress(vw, p) {
  const { min, max } = allowedRange(vw);
  return Math.max(min, Math.min(max, p));
}

export function snapTarget(vw, p) {
  const clamped = clampProgress(vw, p);
  if (clamped > 0.34) return 1;
  if (clamped < -0.34) return -1;
  return 0;
}

// 单一真值源：同时算出 DOM transform 位移、遮罩透明度与所有读数百分比，杜绝读数与画布脱节
export function computeStageGeometry(state, frameW, wingW, compact = false) {
  const { leftOff, rightOff } = allowedRange(state.vw);
  const p = clampProgress(state.vw, state.progress);
  const absP = Math.abs(p);
  const safeFrameW = Math.max(1, frameW);
  const safeWingW = Math.max(1, wingW);
  const pushGap = compact ? 2 : 14;

  let mainX = 0;
  let leftX = -safeWingW;
  let rightX = safeWingW;
  let scrimAlpha = 0;
  let leftVisible = true;
  let rightVisible = true;

  if (state.mode === "push") {
    if (leftOff && p > 0) {
      mainX = p * safeWingW;
      leftX = (p - 1) * safeWingW;
      rightX = safeWingW + mainX + pushGap;
      scrimAlpha = p * 0.14;
    } else if (rightOff && p < 0) {
      mainX = p * safeWingW;
      rightX = (1 + p) * safeWingW;
      leftX = -safeWingW + mainX - pushGap;
      scrimAlpha = -p * 0.14;
    }
  } else if (state.mode === "overlay") {
    if (leftOff && p > 0) {
      leftX = (p - 1) * safeWingW;
      scrimAlpha = Math.min(0.54, Math.pow(p, 0.72) * 0.54);
    } else if (rightOff && p < 0) {
      rightX = (1 + p) * safeWingW;
      scrimAlpha = Math.min(0.54, Math.pow(-p, 0.72) * 0.54);
    }
  } else if (state.mode === "reveal") {
    // 掀开模式：抽屉本就静卧在视口框内底层，滑动时是上层主画布整块向右/左掀起出界
    leftX = 0;
    rightX = 0;
    if (leftOff && p > 0) {
      mainX = p * safeWingW;
      scrimAlpha = p * 0.08;
      rightVisible = !rightOff;
    } else if (rightOff && p < 0) {
      mainX = p * safeWingW;
      scrimAlpha = -p * 0.08;
      leftVisible = !leftOff;
    } else {
      leftVisible = !leftOff;
      rightVisible = !rightOff;
    }
  }

  // 实际落入/露在可视视口框内的抽屉像素宽度
  let drawerInFramePx = 0;
  if (leftOff && p > 0) {
    drawerInFramePx =
      state.mode === "reveal"
        ? Math.max(0, Math.min(safeWingW, mainX))
        : Math.max(0, Math.min(safeFrameW, leftX + safeWingW));
  } else if (rightOff && p < 0) {
    drawerInFramePx =
      state.mode === "reveal"
        ? Math.max(0, Math.min(safeWingW, -mainX))
        : Math.max(0, Math.min(safeFrameW, safeWingW - rightX));
  }

  const drawerInFramePct = Math.round((drawerInFramePx / safeWingW) * 100);
  const pushedPct = Math.round((Math.abs(mainX) / safeFrameW) * 100);
  const coveredPct = Math.round((drawerInFramePx / safeFrameW) * 100);
  const occupiedPct = state.mode === "overlay" ? coveredPct : pushedPct;
  const remainPct = Math.max(0, 100 - occupiedPct);

  return {
    p,
    absP,
    frameW: safeFrameW,
    wingW: safeWingW,
    mainX,
    leftX,
    rightX,
    scrimAlpha,
    leftVisible,
    rightVisible,
    drawerInFramePx,
    drawerInFramePct,
    pushedPct,
    coveredPct,
    remainPct,
    activeSide: p > 0.02 ? "left" : p < -0.02 ? "right" : "none",
  };
}

export function diagnose(state, geom) {
  const tier = tierOf(state.vw);
  const { leftOff, rightOff } = allowedRange(state.vw);
  const g = geom || computeStageGeometry(state, 375, 200, false);
  const p = g.p;
  const absP = g.absP;

  const tierLabel =
    tier === "mobile"
      ? `窄屏手机 · ${state.vw} px`
      : tier === "tablet"
        ? `中屏平板 · ${state.vw} px`
        : `宽屏桌面 · ${state.vw} px`;

  const offCount = (leftOff ? 1 : 0) + (rightOff ? 1 : 0);
  const wingSummary =
    offCount === 2
      ? "左右两翼均在画布外"
      : offCount === 1
        ? "左导航已入画布 · 右筛选仍在画布外"
        : "三列全部落进画布 · 无需抽屉";

  const modeNames = {
    push: "推挤 Push",
    overlay: "浮层 Overlay",
    reveal: "掀开 Reveal",
  };

  if (tier === "desktop") {
    return {
      badge: "三列同屏 · 零隐藏税",
      tone: "teal",
      tierLabel,
      wingSummary,
      modeLabel: modeNames[state.mode],
      headline: "视口已够宽，所有面板主动走出「画布外」",
      body: `当前模拟 ${state.vw} px 桌面宽屏：原本停在左右边界外的导航栏与筛选栏都已落进画布变成常驻侧栏。如果宽屏上仍硬把它们藏进汉堡图标，反而会平白增加点击步数。`,
    };
  }

  if (absP < 0.08) {
    if (tier === "tablet") {
      return {
        badge: "单翼画布外 · 半展开",
        tone: "navy",
        tierLabel,
        wingSummary,
        modeLabel: modeNames[state.mode],
        headline: "左导航已常驻画布，右侧筛选仍按需候场",
        body: state.xray
          ? "开启「透视画布外」能透过右侧半透明纸雾与网点看见筛选栏正贴在实线视口外候命；向左拖拉底部越界把手或点右上「筛选」，即可把它拉进画布。"
          : "在真实裁切模式下，右缘之外的筛选栏被视口干净裁掉，主阅读区保留宽敞行宽；点击右上角「筛选」或向左拖动即可呼出。",
      };
    }
    return {
      badge: "双翼候场 · 主文满屏",
      tone: "navy",
      tierLabel,
      wingSummary,
      modeLabel: modeNames[state.mode],
      headline: "主内容独占窄屏，次级导航与筛选退居左右边界外",
      body: state.xray
        ? state.mode === "reveal"
          ? "当前为掀开模式：两翼抽屉已预先压在主画布底层，实线框内只见完整主文；左右拖动底部把手把主画布像纸页一样掀向画布外纸雾区，即可露出底层抽屉。"
          : "实线框内是手机用户真正看到的 100% 明亮屏幕；左右半透明纸雾与青绿网点之下，是停泊在画布外的两翼抽屉。向右拉出左导航，向左拉出右筛选，体会「边界 ≠ 终点」。"
        : "已切回真实浏览器裁切状态：画布外的两翼被完全裁出屏幕，用户只能靠顶栏「≡ 目录」「筛选」与边缘手势发现它们——这也正是要严防「藏得太深」的原因。",
    };
  }

  const sideName = p > 0 ? "左翼导航抽屉" : "右翼筛选抽屉";
  const oppDir = p > 0 ? "右侧" : "左侧";
  const pct = g.drawerInFramePct;

  if (state.mode === "push") {
    return {
      badge: `${sideName} · 推挤 ${pct}%`,
      tone: "coral",
      tierLabel,
      wingSummary,
      modeLabel: modeNames.push,
      headline: p > 0 ? "导航把主画布向右推出边界，对侧留下「返回留痕」" : "筛选栏把主画布向左推挤，空间关系连续不断裂",
      body: `推挤模式下，${sideName}自身已有 ${pct}% 跨进实线视口，并把主画布顺势推出${oppDir}边界约 ${g.pushedPct}%（框内保留 ${g.remainPct}% 明亮正文，越界部分落入半透明纸雾）。框内被实线切齐的那一截正文就是天然「返回锚点」——眼睛一眼就知道还在原页，往回一划即可收起。`,
    };
  }

  if (state.mode === "overlay") {
    return {
      badge: `${sideName} · 浮层 ${pct}%`,
      tone: "coral",
      tierLabel,
      wingSummary,
      modeLabel: modeNames.overlay,
      headline: "抽屉凌空滑入，深蓝遮罩稳住焦点、主画布零重排",
      body: `浮层模式下，主画布停在原地纹丝不动（${oppDir}边界外干净无溢出、零文字重排），${sideName}自身滑入 ${pct}% 并带着深海蓝阴影覆盖视口宽度约 ${g.coveredPct}%，其余 ${g.remainPct}% 区域由深蓝遮罩压暗。真实代码里记得给底层加 inert，并支持点遮罩与 Esc 退出。`,
    };
  }

  return {
    badge: `${sideName} · 掀开 ${pct}%`,
    tone: "teal",
    tierLabel,
    wingSummary,
    modeLabel: modeNames.reveal,
    headline: "主画布像帷幕般滑走，露出压在底层的隐藏抽屉",
    body: `掀开模式下，${sideName}早已固定在视口底层（对应外侧没有尾巴伸出边界），上层主画布带着折页书脊线向${oppDir}掀出视口约 ${g.pushedPct}%，露出底层抽屉 ${pct}%、框内仍留 ${g.remainPct}% 主画布边缘供随手拉回。`,
  };
}
