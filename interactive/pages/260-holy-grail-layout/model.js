// 260 圣杯布局 — 单真源几何、折行与诊断模型
// 画布绘制、左侧外挂标注脊、四枚原则探针、底部诊单与数值卡全部读取同一份 computeFrame() 结果。

export const SCENES = {
  portal: {
    id: "portal",
    label: "原海报 · 综合门户",
    brand: "品牌 / LOGO",
    navTop: ["首页", "课程", "资源", "关于"],
    leftTitle: "左侧栏",
    leftSub: "SIDEBAR LEFT",
    leftItems: ["功能导航", "分类目录", "快捷入口", "学习路径", "收藏夹"],
    leftBox: "专题快捷入口",
    mainTitle: "主内容区",
    mainSub: "MAIN CONTENT",
    mainLead: "主要内容展示区：承载核心信息，篇幅与重点突出。",
    mainBody:
      "圣杯布局由头部、底部与主体三栏构成。中央主内容区保持流式延展，把最宽敞的阅读带留给核心文章与视觉重点，两侧边栏只承接目录、筛选与相关补充，不与正文争抢第一眼注意力。",
    mainCards: [
      { title: "框架稳定", desc: "分区边界清晰" },
      { title: "视线有序", desc: "先中后翼浏览" },
      { title: "灵活伸缩", desc: "侧栏按需折收" },
    ],
    rightTitle: "右侧栏",
    rightSub: "SIDEBAR RIGHT",
    rightItems: [
      { title: "补充信息", desc: "延伸阅读与背景" },
      { title: "相关推荐", desc: "同类课程与案例" },
      { title: "公告通知", desc: "本周更新与答疑" },
    ],
    rightNote: "提示 / 广告或重要补充信息",
    footerBrand: "版权 © 品牌名称 保留所有权利",
    footerLinks: ["隐私政策", "使用条款", "帮助中心", "联系我们"],
  },
  docs: {
    id: "docs",
    label: "技术文档系统",
    brand: "DOCS · 指南",
    navTop: ["指南", "API", "示例", "更新"],
    leftTitle: "文档目录",
    leftSub: "NAVIGATION",
    leftItems: ["快速上手", "网格容器", "命名区域", "断点策略", "无障碍规范"],
    leftBox: "版本 v4.2 切换",
    mainTitle: "grid-template-areas 实战",
    mainSub: "DOCUMENTATION",
    mainLead: "用三行三列命名矩阵声明圣杯骨架，保持语义化源码顺序。",
    mainBody:
      "在文档系统中，读者高频在左侧章节树与中间正文之间往返，右侧只保留当前页的二级小节锚点。只要中栏宽度守住 520px 至 840px 区间，代码块与长段说明都能一气呵成读完而不必频繁横向滚动。",
    mainCards: [
      { title: "语义标签", desc: "header / nav / main" },
      { title: "源码优先", desc: "主区靠前更利读屏" },
      { title: "等高贴底", desc: "min-height 100vh" },
    ],
    rightTitle: "本页大纲",
    rightSub: "ON THIS PAGE",
    rightItems: [
      { title: "1. 轨道定义", desc: "两侧定宽中栏 1fr" },
      { title: "2. 断点折翼", desc: "平板先收右侧大纲" },
      { title: "3. 粘性页脚", desc: "短文不悬空不遮挡" },
    ],
    rightNote: "提示：窄屏可将本页大纲折入文首",
    footerBrand: "文档许可 CC BY 4.0 · 开源协议",
    footerLinks: ["编辑此页", "反馈问题", "变更日志", "社区"],
  },
  course: {
    id: "course",
    label: "课程学习平台",
    brand: "学院 · COURSE",
    navTop: ["课表", "作业", "笔记", "答疑"],
    leftTitle: "章节大纲",
    leftSub: "SYLLABUS",
    leftItems: ["01 结构起源", "02 五区配比", "03 断点收折", "04 源码顺序", "05 实战测验"],
    leftBox: "学习进度 64%",
    mainTitle: "第 3 讲：多端骨架平衡",
    mainSub: "LESSON VIEW",
    mainLead: "视频与讲义稳居视野中央，目录与随堂笔记分列两翼随时呼应。",
    mainBody:
      "在线学习需要长时间专注主讲义，同时又要一键跳转上一节或记录疑问。圣杯布局让左栏锚定课程坐标、右栏承接随堂问答与资料下载；当学员切换全屏听课时，可一键折叠侧栏把画幅还给主区。",
    mainCards: [
      { title: "主讲讲义", desc: "占宽过半不逼仄" },
      { title: "左导锚点", desc: "随时查看总章节" },
      { title: "右翼笔记", desc: "不打断主线进度" },
    ],
    rightTitle: "随堂辅助",
    rightSub: "STUDY TOOLS",
    rightItems: [
      { title: "讲义下载", desc: "PDF 与示例源文件" },
      { title: "同学提问", desc: "本节高频 6 条解答" },
      { title: "课后练习", desc: "三道架构辨析题" },
    ],
    rightNote: "学习提示：听课专注时可隐藏右栏",
    footerBrand: "学院课程中心 · 持续更新",
    footerLinks: ["学习公约", "助教通道", "常见问题", "联系我们"],
  },
};

export const CONTENT_LEN = {
  short: { label: "短文", factor: 0.48 },
  standard: { label: "标准", factor: 1.0 },
  long: { label: "长文", factor: 1.45 },
};

// 开场刻意停在 0/4 复合破局态：
// 880px 窄窗下双翼各 256px 夹扁主区 + 短文关等高粘底导致参差与页脚悬空 + 关响应式折翼 + 源码左栏优先
export const BROKEN_STATE = {
  scene: "portal",
  viewportW: 880,
  leftW: 256,
  rightW: 256,
  leftOpen: true,
  rightOpen: true,
  headerH: 58,
  equalSticky: false,
  responsive: false,
  sourceOrder: "nav-first", // "main-first" | "nav-first"
  contentLen: "short", // "short" | "standard" | "long"
  showSourceOverlay: false,
  focusZone: null, // null | "header" | "body" | "footer" | "left" | "main" | "right"
};

// 多组合法解（全部 4/4 通过）
export const VALID_PRESETS = {
  classic: {
    label: "原海报经典三列解",
    desc: "1280px 桌面 · 左 216 + 流式主区 + 右 228 · 等高粘底",
    patch: {
      viewportW: 1280,
      leftW: 216,
      rightW: 228,
      leftOpen: true,
      rightOpen: true,
      headerH: 58,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
  docsTwoCol: {
    label: "收右翼文档解",
    desc: "1040px 笔记本 · 留左导 212px、按需隐藏右栏保正文宽敞",
    patch: {
      viewportW: 1040,
      leftW: 212,
      rightW: 220,
      leftOpen: true,
      rightOpen: false,
      headerH: 56,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
  tablet: {
    label: "平板 820px 降级解",
    desc: "820px 平板 · 响应式自动折收右栏，左导 196 + 主区流式",
    patch: {
      viewportW: 820,
      leftW: 196,
      rightW: 210,
      leftOpen: true,
      rightOpen: true,
      headerH: 56,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
  mobile: {
    label: "手机 390px 单列解",
    desc: "390px 手机 · 双翼折收为单列流，主内容直排首屏",
    patch: {
      viewportW: 390,
      leftW: 210,
      rightW: 210,
      leftOpen: true,
      rightOpen: true,
      headerH: 52,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
};

// 反向试错（用于验证双向失衡，全部刻意触发真实错态）
export const ANTI_PRESETS = {
  thinWings: {
    label: "试错：侧栏过窄折字",
    patch: {
      viewportW: 1200,
      leftW: 112,
      rightW: 116,
      leftOpen: true,
      rightOpen: true,
      headerH: 58,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
  overwide: {
    label: "试错：双关无控超长行",
    patch: {
      viewportW: 1360,
      leftW: 210,
      rightW: 210,
      leftOpen: false,
      rightOpen: false,
      headerH: 58,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
  rigidMobile: {
    label: "试错：窄屏硬撑三列",
    patch: {
      viewportW: 620,
      leftW: 185,
      rightW: 185,
      leftOpen: true,
      rightOpen: true,
      headerH: 56,
      equalSticky: true,
      responsive: false,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
  bloatedHead: {
    label: "试错：页眉臃肿夺屏",
    patch: {
      viewportW: 1220,
      leftW: 216,
      rightW: 220,
      leftOpen: true,
      rightOpen: true,
      headerH: 138,
      equalSticky: true,
      responsive: true,
      sourceOrder: "main-first",
      contentLen: "standard",
    },
  },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// 统一的模拟视口基准高度（用于等高与粘底页脚计算，所有读数与画布共用）
export const SIM_VIEWPORT_H = 540;
export const FOOTER_H = 44;
export const COL_GAP = 14;
export const FRAME_PAD = 14;

/**
 * 单真源布局求解：给定 state，输出模拟浏览器内五区的精确物理几何、折行字数、错态列表、
 * 四项原海报探针状态与白话诊断。
 */
export function computeFrame(state) {
  const vw = Math.round(clamp(state.viewportW, 360, 1360));
  const rawLeft = Math.round(clamp(state.leftW, 100, 340));
  const rawRight = Math.round(clamp(state.rightW, 100, 340));
  const headerH = Math.round(clamp(state.headerH, 42, 150));
  const footerH = FOOTER_H;
  const innerW = vw - FRAME_PAD * 2;

  // 判断当前实际呈现模式：3col | 2col-left | 2col-right | 1col-stacked | 1col-clean
  let mode = "3col";
  let showLeftCol = state.leftOpen;
  let showRightCol = state.rightOpen;
  let stackedMobile = false;
  let autoFoldedRight = false;
  let autoFoldedBoth = false;

  if (state.responsive) {
    if (vw < 640) {
      stackedMobile = true;
      showLeftCol = false;
      showRightCol = false;
      autoFoldedBoth = state.leftOpen || state.rightOpen;
      mode = "mobile-stack";
    } else if (vw < 940 && showLeftCol && showRightCol) {
      showRightCol = false;
      autoFoldedRight = true;
      mode = "tablet-2col";
    }
  }

  // 计算实际像素宽
  let effLeftW = showLeftCol ? rawLeft : 0;
  let effRightW = showRightCol ? rawRight : 0;
  const activeCols = (showLeftCol ? 1 : 0) + 1 + (showRightCol ? 1 : 0);
  const totalGaps = (activeCols - 1) * COL_GAP;
  let effMainW = innerW - effLeftW - effRightW - totalGaps;

  // 若窄屏硬撑三列出现负宽，保底 48px 并记溢出
  const mainOverflowPx = effMainW < 64 ? Math.round(64 - effMainW) : 0;
  effMainW = Math.max(48, Math.round(effMainW));

  if (!stackedMobile) {
    if (showLeftCol && showRightCol) mode = "3col";
    else if (showLeftCol && !showRightCol) mode = autoFoldedRight ? "tablet-2col" : "2col-left";
    else if (!showLeftCol && showRightCol) mode = "2col-right";
    else mode = "1col-wide";
  }

  const leftPct = Math.round((effLeftW / innerW) * 100);
  const rightPct = Math.round((effRightW / innerW) * 100);
  const mainPct = Math.max(0, 100 - leftPct - rightPct);
  const wingsPct = leftPct + rightPct;

  // 主内容文本区实测可排版像素宽（扣除左右内边距 20px×2，窄态等比缩）
  const mainTextPad = effMainW < 260 ? 12 : 24;
  const usableTextW = Math.max(24, effMainW - mainTextPad * 2);
  // 假定正文标准阅读字号 15px（经验汉字全角宽 ≈ 15.2px）
  const charsPerLine = Math.max(2, Math.round(usableTextW / 15.2));

  // 三列自然高度（用于真实计算参差落差 ΔH 与粘底页脚悬空量）
  const bodyBudgetH = SIM_VIEWPORT_H - headerH - footerH - FRAME_PAD * 2;
  const lenCfg = CONTENT_LEN[state.contentLen] || CONTENT_LEN.standard;

  // 左侧栏自然内容高（导航项 + 底部块）
  const natLeftH = showLeftCol ? 318 : 0;
  // 右侧栏自然内容高（三推荐 + 提示虚线框）
  const natRightH = showRightCol ? 276 : 0;
  // 主区自然内容高随正文篇幅与列宽折行变化
  const wrapBoost = effMainW < 420 ? 1.24 : effMainW > 860 ? 0.88 : 1.0;
  const natMainH = Math.round(
    state.contentLen === "short"
      ? 222 * wrapBoost
      : state.contentLen === "long"
        ? 392 * wrapBoost
        : 342 * wrapBoost
  );

  // 计算实际呈现高度与参差落差
  const activeHeights = [natMainH];
  if (showLeftCol) activeHeights.push(natLeftH);
  if (showRightCol) activeHeights.push(natRightH);
  const rawMaxH = Math.max(...activeHeights);
  const rawMinH = Math.min(...activeHeights);

  // 实际渲染高度（开启等高粘底锁时，三列齐平至 max(rawMaxH, bodyBudgetH)，页脚贴底）
  let colHLeft = showLeftCol ? natLeftH : 0;
  let colHMain = natMainH;
  let colHRight = showRightCol ? natRightH : 0;
  let stageContentH = rawMaxH;
  let heightGap = 0;
  let footerGap = 0;

  if (stackedMobile) {
    // 手机单列堆叠：页眉 -> 主内容 -> 折叠左导/右辅 -> 页脚
    const stackH = Math.round(natMainH + 104);
    stageContentH = state.equalSticky ? Math.max(bodyBudgetH, stackH) : stackH;
    colHMain = natMainH;
    heightGap = 0;
    footerGap = state.equalSticky ? 0 : Math.max(0, bodyBudgetH - stackH);
  } else if (state.equalSticky) {
    const unified = Math.max(bodyBudgetH, rawMaxH);
    if (showLeftCol) colHLeft = unified;
    colHMain = unified;
    if (showRightCol) colHRight = unified;
    stageContentH = unified;
    heightGap = 0;
    footerGap = 0;
  } else {
    heightGap = activeHeights.length > 1 ? Math.round(rawMaxH - rawMinH) : 0;
    stageContentH = rawMaxH;
    footerGap = Math.max(0, Math.round(bodyBudgetH - rawMaxH));
  }

  // 页眉占比
  const headerPct = Math.round((headerH / SIM_VIEWPORT_H) * 100);

  // ==================== 单真源 8 类双向错态核算 ====================
  const issues = [];

  // 1. 窄屏硬撑三列（响应式折翼缺失）
  const rigidNarrowFail = !state.responsive && ((vw < 640 && (showLeftCol || showRightCol)) || (vw < 900 && showLeftCol && showRightCol));
  if (rigidNarrowFail) {
    issues.push({
      id: "rigid-narrow",
      severity: 100,
      probe: "distribution",
      shortTag: `窄屏硬撑 ${vw}px`,
      title: `视口缩到 ${vw}px 仍硬撑多栏，主区被活活夹垮`,
      why: `在 ${vw}px 宽的屏幕里强行保留固定侧栏，中央主内容只剩 ${effMainW}px（每行约 ${charsPerLine} 字），卡片与标题叠挤碎裂。圣杯布局在平板（< 940px 经验阈值）应先折收右侧栏，在手机（< 640px）转为单列堆叠。`,
      hint: "打开「响应式折翼」开关，或向右把视口拉回 1120px 以上桌面宽度。",
      fixLabel: "开启响应式折翼并校准",
      fixType: "responsive",
    });
  }

  // 2. 夹心窒息（主区被双翼压太窄；独立挂在 balance 探针上，确保与 distribution 各自诚实反映病灶）
  const mainSqueezed = !stackedMobile && (effMainW < 460 || (showLeftCol && showRightCol && mainPct < 46));
  if (mainSqueezed) {
    issues.push({
      id: "main-squeezed",
      severity: rigidNarrowFail ? 94 : 95,
      probe: "balance",
      shortTag: `夹心仅 ${mainPct}%`,
      title: `双侧栏合占 ${wingsPct}%，把主内容挤成 ${effMainW}px 夹心缝`,
      why: `圣杯布局把主内容摆在视觉中央，就是为了让它成为绝对主角。现在两侧边栏分别占 ${effLeftW}px 与 ${effRightW}px，主区只剩 ${effMainW}px（约 ${charsPerLine} 字/行），正文被迫频繁折行，两侧辅助栏反而喧宾夺主。`,
      hint: "把双侧栏往外拖窄到 180–240px（或点右上角收起右侧栏），或拉宽视口，让主区回到 52% 以上。",
      fixLabel: "收窄双翼把主区还给正文",
      fixType: "balance",
    });
  }

  // 3. 反向试错：侧栏过窄折字（展开状态下 < 145px）
  const leftTooThin = showLeftCol && effLeftW < 145;
  const rightTooThin = showRightCol && effRightW < 145;
  if (leftTooThin || rightTooThin) {
    const minSide = Math.min(leftTooThin ? effLeftW : 999, rightTooThin ? effRightW : 999);
    issues.push({
      id: "sidebar-crushed",
      severity: 88,
      probe: "utility",
      shortTag: `侧栏过窄 ${minSide}px`,
      title: `侧栏窄到 ${minSide}px，导航项与摘要被迫截断折字`,
      why: `侧栏不是越窄越好。经验上中文目录与辅助卡片至少需要 160–240px 才能单行放清入口；低于 145px 后，文字要么折成难读的竖条，要么直接被裁成省略号。如果真的不需要这一栏，直接隐藏比硬留一条细缝干净得多。`,
      hint: "把过窄的侧栏拉回 175–240px，或直接点顶角「收起」将它隐藏。",
      fixLabel: "把侧栏拉回舒适宽",
      fixType: "wings",
    });
  }

  // 4. 反向试错：双翼全关且超宽屏无最大行宽（行宽失控 > 960px / > 54字）
  const overwideMain = !stackedMobile && !showLeftCol && !showRightCol && effMainW > 960;
  if (overwideMain) {
    issues.push({
      id: "main-overwide",
      severity: 82,
      probe: "balance",
      shortTag: `爆宽 ${charsPerLine}字/行`,
      title: `双翼全关后正文横跨 ${effMainW}px（约 ${charsPerLine} 字/行），回扫极易串行`,
      why: `当左右侧栏同时收起且视口高达 ${vw}px 时，如果不限制正文最大宽，一行排下超过 50 个汉字，眼睛读到行尾再折返下一行极易找错行。此时要么恢复至少一侧功能栏平衡版面，要么改用带最大行宽约束的单列页面。`,
      hint: "重新展开至少一侧边栏（如左导 216px），或把视口收回到舒适阅读带宽。",
      fixLabel: "展开左导恢复平衡",
      fixType: "restore-left",
    });
  }

  // 5. 三列参差不等高 + 页脚悬空
  const unevenOrFloat = heightGap > 18 || footerGap > 18;
  if (unevenOrFloat) {
    issues.push({
      id: "uneven-footer",
      severity: 86,
      probe: "framework",
      shortTag: footerGap > 18 ? `悬空 ${footerGap}px` : `参差 ${heightGap}px`,
      title:
        footerGap > 18
          ? `短文下页脚悬空 ${footerGap}px，三列底沿落差 ${heightGap}px`
          : `三列底沿参差相差 ${heightGap}px，框架下缘出现断崖`,
      why: `这是当年圣杯布局最难啃的两块硬骨头：一栏短、一栏长时，侧栏背景色会在半腰戛然而止；内容不够一屏时，深梅紫页脚会浮在半空中露出大片无主的白底，整个「框架稳定」立刻散架。`,
      hint: "开启「等高与粘底锁」（现代 CSS Grid / Flexbox 只需 min-height: 100vh + 1fr 即可彻底解决）。",
      fixLabel: "开启等高与粘底锁",
      fixType: "sticky",
    });
  }

  // 6. 页眉臃肿夺屏
  const bloatedHeader = headerH > 102 || headerPct > 19;
  if (bloatedHeader) {
    issues.push({
      id: "bloated-header",
      severity: 76,
      probe: "framework",
      shortTag: `页眉过厚 ${headerH}px`,
      title: `页眉撑到 ${headerH}px（占屏高 ${headerPct}%），把主体压下首屏`,
      why: `头部负责品牌识别与顶层入口，经验高度通常控制在 48–76px。一旦页眉臃肿超百像素，还没看到主体三栏，首屏宝贵高度就已经被吃掉近四分之一。`,
      hint: "把页眉高度调回 52–72px，把垂直空间还给中央主体。",
      fixLabel: "收紧页眉至 58px",
      fixType: "header",
    });
  }

  // 7. 源码顺序倒挂（左栏导航先读，主内容靠后）
  const sourceOrderBad = state.sourceOrder !== "main-first";
  if (sourceOrderBad) {
    issues.push({
      id: "source-order",
      severity: 70,
      probe: "utility",
      shortTag: "源码左栏先读",
      title: "HTML 源码把左栏排在主内容之前，键盘与读屏得先绕完导航",
      why: "「圣杯」之所以不同于普通三列，关键一条约束就是源码顺序：画面上左栏在左，但 HTML 里应优先呈现 <main> 主内容（或配合清晰的语义与跳过导航），让搜索引擎、屏幕阅读器与慢网速设备第一时间拿到核心正文。",
      hint: "将「源码顺序」切为「主内容优先」，并按空格键打开源码阅读流透视线对比 ①→⑤ 路径。",
      fixLabel: "切为主内容优先源码序",
      fixType: "source",
    });
  }

  // 8. 双侧栏比例极度失衡（单侧过胖 > 280px，即便主区勉强过 460px）
  const fatSingleWing =
    !stackedMobile &&
    !mainSqueezed &&
    !rigidNarrowFail &&
    ((showLeftCol && effLeftW > 285) || (showRightCol && effRightW > 285));
  if (fatSingleWing) {
    const fatW = Math.max(showLeftCol ? effLeftW : 0, showRightCol ? effRightW : 0);
    issues.push({
      id: "fat-wing",
      severity: 74,
      probe: "distribution",
      shortTag: `单翼过胖 ${fatW}px`,
      title: `单侧边栏宽达 ${fatW}px，功能翼体量接近正文`,
      why: `左右侧栏定位为轻量辅助区，经验宽度一般在 180–260px。撑过 285px 后，侧栏卡片会过度膨胀，在视觉上与主内容平起平坐，削弱中心聚焦。`,
      hint: "拖动栏界轨，把侧栏收回到 180–250px 的克制区间。",
      fixLabel: "把过胖侧栏收回到 220px",
      fixType: "wings",
    });
  }

  issues.sort((a, b) => b.severity - a.severity);

  // ==================== 原海报四大核心概念探针 ====================
  const probeIssues = {
    framework: issues.filter((x) => x.probe === "framework"),
    balance: issues.filter((x) => x.probe === "balance"),
    utility: issues.filter((x) => x.probe === "utility"),
    distribution: issues.filter((x) => x.probe === "distribution"),
  };

  const probes = [
    {
      id: "framework",
      zh: "框架稳定",
      en: "FRAMEWORK",
      ok: probeIssues.framework.length === 0,
      badge:
        probeIssues.framework.length === 0
          ? "等高贴底"
          : probeIssues.framework[0].shortTag,
      focus: "footer",
    },
    {
      id: "balance",
      zh: "视觉平衡",
      en: "BALANCE",
      ok: probeIssues.balance.length === 0,
      badge:
        probeIssues.balance.length === 0
          ? `主区 ${mainPct}%`
          : probeIssues.balance[0].shortTag,
      focus: "main",
    },
    {
      id: "utility",
      zh: "实用高效",
      en: "UTILITY",
      ok: probeIssues.utility.length === 0,
      badge:
        probeIssues.utility.length === 0
          ? "主区先读"
          : probeIssues.utility[0].shortTag,
      focus: "left",
    },
    {
      id: "distribution",
      zh: "合理分布",
      en: "DISTRIBUTION",
      ok: probeIssues.distribution.length === 0,
      badge:
        probeIssues.distribution.length === 0
          ? mode === "mobile-stack"
            ? "单列折翼"
            : mode === "tablet-2col"
              ? "平板折右"
              : `${leftPct}:${mainPct}:${rightPct}`
          : probeIssues.distribution[0].shortTag,
      focus: "body",
    },
  ];

  const passedCount = probes.filter((p) => p.ok).length;
  const primary = issues[0] || null;

  // 成功时的具体合法解定性
  let verdictTitle = "";
  let verdictWhy = "";
  let verdictHint = "";
  let statusBadge = "";

  if (!primary) {
    statusBadge = `4/4 · ${mode === "mobile-stack" ? "手机单列解" : mode === "tablet-2col" ? "平板折右解" : !showLeftCol || !showRightCol ? "灵活收翼解" : "圣杯平衡解"}`;
    if (mode === "mobile-stack") {
      verdictTitle = `390–639px 窄屏自动折翼，主内容优先直占首屏`;
      verdictWhy = `在 ${vw}px 手机视口下，圣杯布局主动卸下左右定宽翼，按「头部 → 主内容 → 折叠目录/辅助 → 页脚」单列重排，每行约 ${charsPerLine} 字，既守住阅读体验又保住页脚贴底。`;
      verdictHint = "试着向右拖宽视口跨过 640px 和 940px 断点，看两翼怎样按优先级逐一长出来。";
    } else if (mode === "tablet-2col" || (!showRightCol && showLeftCol)) {
      verdictTitle = `留左导收右翼，主区宽敞占 ${mainPct}%（${effMainW}px）`;
      verdictWhy = `原海报第四要点强调「可根据需求调整侧栏宽度或隐藏」。当前左栏 ${effLeftW}px 稳住导航，主内容拥有 ${effMainW}px（约 ${charsPerLine} 字/行）舒适带宽，三列等高且页脚稳稳贴底。`;
      verdictHint = "可尝试继续拖窄到 <640px 看手机折翼，或试一试下方「反向试错」观察破局临界点。";
    } else if (showLeftCol && showRightCol) {
      verdictTitle = `五区圣杯骨架成立：主区 ${mainPct}% 居中领衔，两翼各安其位`;
      verdictWhy = `在 ${vw}px 视口下，左导 ${effLeftW}px（${leftPct}%）+ 主区 ${effMainW}px（${mainPct}%，约 ${charsPerLine} 字/行）+ 右辅 ${effRightW}px（${rightPct}%）构成稳固三角；等高粘底锁住底沿，主内容在源码中排在最前。`;
      verdictHint = "现在试着把视口往左拖到 820px 或 390px，或按空格键观察 ①→⑤ 源码读取流。";
    } else {
      verdictTitle = `右辅配合流式主区，版面保持 ${mainPct}% 居中焦点`;
      verdictWhy = `主区占 ${effMainW}px（约 ${charsPerLine} 字/行），右栏 ${effRightW}px 承接目录或推荐，等高粘底与主区优先源码序同时成立。`;
      verdictHint = "可打开左侧栏体验完整三列，或拖动视口宽度测试断点切换。";
    }
  } else {
    statusBadge = `${passedCount}/4 · ${primary.shortTag}`;
    verdictTitle = primary.title;
    verdictWhy = primary.why;
    verdictHint = primary.hint;
  }

  // 源码读取顺序列表（用于画布透视与左侧说明）
  const domSequence =
    state.sourceOrder === "main-first"
      ? [
          { step: "①", zone: "header", name: "头部 Header" },
          { step: "②", zone: "main", name: "主内容 Main" },
          ...(showLeftCol || stackedMobile ? [{ step: "③", zone: "left", name: "左侧栏 Nav" }] : []),
          ...(showRightCol || stackedMobile ? [{ step: showLeftCol || stackedMobile ? "④" : "③", zone: "right", name: "右侧栏 Aside" }] : []),
          { step: showLeftCol && showRightCol ? "⑤" : showLeftCol || showRightCol || stackedMobile ? (stackedMobile ? "⑤" : "④") : "③", zone: "footer", name: "底部 Footer" },
        ]
      : [
          { step: "①", zone: "header", name: "头部 Header" },
          ...(showLeftCol || stackedMobile ? [{ step: "②", zone: "left", name: "左侧栏 Nav（先读）" }] : []),
          { step: showLeftCol || stackedMobile ? "③" : "②", zone: "main", name: "主内容 Main" },
          ...(showRightCol || stackedMobile ? [{ step: showLeftCol || stackedMobile ? "④" : "③", zone: "right", name: "右侧栏 Aside" }] : []),
          { step: showLeftCol && showRightCol ? "⑤" : showLeftCol || showRightCol || stackedMobile ? (stackedMobile ? "⑤" : "④") : "③", zone: "footer", name: "底部 Footer" },
        ];

  return {
    vw,
    innerW,
    headerH,
    headerPct,
    footerH,
    mode,
    stackedMobile,
    showLeftCol,
    showRightCol,
    autoFoldedRight,
    autoFoldedBoth,
    effLeftW,
    effMainW,
    effRightW,
    mainOverflowPx,
    leftPct,
    mainPct,
    rightPct,
    wingsPct,
    charsPerLine,
    natLeftH,
    natMainH,
    natRightH,
    colHLeft,
    colHMain,
    colHRight,
    bodyBudgetH,
    stageContentH,
    heightGap,
    footerGap,
    issues,
    primary,
    probes,
    passedCount,
    statusBadge,
    verdictTitle,
    verdictWhy,
    verdictHint,
    domSequence,
    lenLabel: lenCfg.label,
  };
}

/**
 * 一步修复当前首要错态（而不是直接覆盖所有用户自选参数，保留用户探索上下文；若要全修也能逐项修完）
 */
export function buildPrimaryFix(state, frame) {
  if (!frame.primary) return null;
  switch (frame.primary.fixType) {
    case "responsive":
      return { responsive: true };
    case "balance":
      return {
        leftW: Math.min(state.leftW, 212),
        rightW: Math.min(state.rightW, 216),
        viewportW: Math.max(state.viewportW, 1180),
      };
    case "wings":
      return {
        leftW: clamp(state.leftW, 192, 232),
        rightW: clamp(state.rightW, 196, 236),
      };
    case "restore-left":
      return { leftOpen: true, leftW: 216, rightOpen: true, rightW: 224 };
    case "sticky":
      return { equalSticky: true };
    case "header":
      return { headerH: 58 };
    case "source":
      return { sourceOrder: "main-first" };
    default:
      return VALID_PRESETS.classic.patch;
  }
}
