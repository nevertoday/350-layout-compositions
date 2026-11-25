// 156 侧栏版式 · 单真源几何与诊断模型
// 所有画面分栏坐标、主文估算行宽、390px 窄屏余宽、五项侧栏功能状态灯与四维诊断结论
// 全部由此模块同一套状态与几何算法导出，画布渲染与文字读数绝不出现第二套口径。

export const SWEET_RATIO = { min: 20, max: 36, poster: 32, docs: 25 };
export const SIDEBAR_RANGE = { min: 12, max: 66 };
export const REF_DESKTOP_W = 1280;
export const REF_MOBILE_W = 390;

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 山日画册",
    shortLabel: "原海报",
    defaultSide: "right",
    mainTitle: "山色与旭日",
    mainEn: "CONTENT FIRST",
    coreLabel: "山日主画幅",
    coreSub: "暖日 · 远山 · 层浪主视觉",
    mainExcerpt: "将次要注释与导航让渡到一侧，主画幅和核心论述获得开阔呼吸。",
    sidebarHeading: "侧栏功能",
    sidebarHeadingEn: "SIDEBAR FUNCTIONS",
    cleanModules: [
      { id: "notes", title: "侧边注释", desc: "名词解释与构图提示", tag: "SIDE NOTES" },
      { id: "nav", title: "导航指引", desc: "01 主旨 · 02 比例 · 03 对比", tag: "NAVIGATION" },
      { id: "contrast", title: "色阶标注", desc: "暖纸主面 × 深靛辅轨", tag: "CONTRAST" },
      { id: "support", title: "延伸标签", desc: "层次清晰 · 阅读流畅 · 聚焦", tag: "SUPPORT" },
    ],
    noiseModules: [
      { id: "noise1", title: "限时弹窗广告", desc: "与正文无关的闪烁横幅", tag: "噪点" },
      { id: "noise2", title: "猜你喜欢 18 条", desc: "强行截流的无关推荐流", tag: "噪点" },
    ],
  },
  docs: {
    id: "docs",
    label: "技术文档 · 左侧目录",
    shortLabel: "技术文档",
    defaultSide: "left",
    mainTitle: "栅格与断行规范",
    mainEn: "LAYOUT API GUIDE",
    coreLabel: "核心 API 代码与说明",
    coreSub: "flex-basis + min-inline-size 实测段",
    mainExcerpt: "主文区承载连续参数表与代码片段，左侧固定细窄目录支撑跨节秒跳。",
    sidebarHeading: "章节目录",
    sidebarHeadingEn: "DOCUMENT NAV",
    cleanModules: [
      { id: "notes", title: "快速上手", desc: "安装 · 基础容器 · 间距", tag: "START" },
      { id: "nav", title: "布局原语", desc: "侧栏 · 堆叠 · 网格 · 开关", tag: "PRIMITIVES" },
      { id: "contrast", title: "无障碍重排", desc: "WCAG 1.4.10 · 320px 检验", tag: "A11Y" },
      { id: "support", title: "版本变更", desc: "v2.4 内在折行修复记录", tag: "CHANGELOG" },
    ],
    noiseModules: [
      { id: "noise1", title: "营销悬浮问卷", desc: "高频弹出遮挡目录树", tag: "噪点" },
      { id: "noise2", title: "社区热帖榜单", desc: "无关话题分散检索焦点", tag: "噪点" },
    ],
  },
  editorial: {
    id: "editorial",
    label: "深度专栏 · 右侧注记",
    shortLabel: "深度专栏",
    defaultSide: "right",
    mainTitle: "纸页边界的百年演进",
    mainEn: "EDITORIAL FEATURE",
    coreLabel: "主叙事与版心剖图",
    coreSub: "1800 字连贯长文 + 关键图版",
    mainExcerpt: "长文主栏保持稳定行长避免串行，右侧窄轨静静伴随词条释义与书目。",
    sidebarHeading: "伴读边栏",
    sidebarHeadingEn: "COMPANION RAIL",
    cleanModules: [
      { id: "notes", title: "术语释义", desc: "版心 · 外切口 · 视线回归", tag: "GLOSSARY" },
      { id: "nav", title: "本文小节", desc: "缘起 · 比例 · 移动端折叠", tag: "OUTLINE" },
      { id: "contrast", title: "引用书目", desc: "Bringhurst 1992 · Every Layout", tag: "SOURCES" },
      { id: "support", title: "相关编号", desc: "157 边注 · 154 区块 · 155 插页", tag: "RELATED" },
    ],
    noiseModules: [
      { id: "noise1", title: "全站促销角标", desc: "橙红闪烁贴片破坏读感", tag: "噪点" },
      { id: "noise2", title: "随机推荐卡片", desc: "打断专心阅读的无关链接", tag: "噪点" },
    ],
  },
};

export const CONTRAST_MODES = {
  loud: { id: "loud", label: "亮橘抢戏", ok: false, tier: "反压主区" },
  invisible: { id: "invisible", label: "同底无界", ok: false, tier: "主次糊连" },
  navy: { id: "navy", label: "深靛分界", ok: true, tier: "原海报强对比" },
  tinted: { id: "tinted", label: "柔纸细线", ok: true, tier: "轻雅弱对比" },
};

export const MOBILE_MODES = {
  fixed: { id: "fixed", label: "390px 硬并排", ok: false },
  hidden: { id: "hidden", label: "直接隐藏删掉", ok: false },
  drawer: { id: "drawer", label: "顶栏折叠抽屉", ok: true },
  stack: { id: "stack", label: "流式下沉堆叠", ok: true },
};

export const PRESETS = {
  broken: {
    scenario: "poster",
    side: "right",
    sidebarPct: 56,
    coreInSidebar: true,
    sidebarItems: 4,
    hasNoise: true,
    contrast: "loud",
    mobileMode: "fixed",
    viewportPreview: "desktop",
    showFlow: false,
  },
  poster: {
    scenario: "poster",
    side: "right",
    sidebarPct: 32,
    coreInSidebar: false,
    sidebarItems: 4,
    hasNoise: false,
    contrast: "navy",
    mobileMode: "drawer",
    viewportPreview: "desktop",
    showFlow: false,
  },
  docs: {
    scenario: "docs",
    side: "left",
    sidebarPct: 25,
    coreInSidebar: false,
    sidebarItems: 3,
    hasNoise: false,
    contrast: "tinted",
    mobileMode: "stack",
    viewportPreview: "desktop",
    showFlow: false,
  },
};

export function createInitialState() {
  return { ...PRESETS.broken };
}

export function clampSidebarPct(v) {
  return Math.max(SIDEBAR_RANGE.min, Math.min(SIDEBAR_RANGE.max, Math.round(v)));
}

export function snapSidebarPct(raw, enableSnap = true) {
  const clamped = clampSidebarPct(raw);
  if (!enableSnap) return clamped;
  for (const target of [SWEET_RATIO.poster, SWEET_RATIO.docs]) {
    if (Math.abs(clamped - target) <= 1.2) return target;
  }
  return clamped;
}

// 计算实绘几何与单真源指标
export function computeMetrics(state) {
  const sidebarPct = clampSidebarPct(state.sidebarPct);
  const mainPct = 100 - sidebarPct;

  const mainPx = Math.round((REF_DESKTOP_W * mainPct) / 100);
  const sidebarPx = REF_DESKTOP_W - mainPx;

  // 扣除合理左右内边距后的估算中文行宽（示意：18.5px 约含字距与段内呼吸）
  const mainInnerPx = Math.max(120, mainPx - 124);
  const mainCPL = Math.max(8, Math.round(mainInnerPx / 18.5));

  const sidebarInnerPx = Math.max(60, sidebarPx - 36);
  const sidebarCharsPerLine = Math.max(2, Math.floor(sidebarInnerPx / 15));

  const noiseCount = state.hasNoise ? 2 : 0;
  const totalSidebarBlocks = state.sidebarItems + noiseCount + (state.coreInSidebar ? 1 : 0);

  // 移动端 390px 实宽估算
  let mobileMainPx = REF_MOBILE_W;
  let mobileOverflowPx = 0;
  let mobileInfoLoss = false;
  if (state.mobileMode === "fixed") {
    const mobileSidePx = Math.round((REF_MOBILE_W * sidebarPct) / 100);
    mobileMainPx = REF_MOBILE_W - mobileSidePx;
    // 侧栏如果强保留最小可读宽 200px，390 视口会横向撑爆
    mobileOverflowPx = Math.max(0, mobileSidePx + Math.max(220, mobileMainPx) - REF_MOBILE_W);
  } else if (state.mobileMode === "hidden") {
    mobileMainPx = REF_MOBILE_W;
    mobileInfoLoss = true;
  }
  const mobileMainCPL = Math.max(4, Math.floor(Math.max(40, mobileMainPx - 28) / 15));

  // 四维判据
  const ratioTooWide = sidebarPct > SWEET_RATIO.max;
  const ratioTooNarrow = sidebarPct < SWEET_RATIO.min;
  const ratioOk = !ratioTooWide && !ratioTooNarrow;

  const roleCoreWrong = Boolean(state.coreInSidebar);
  const roleOverloaded = Boolean(state.hasNoise) || totalSidebarBlocks > 4;
  const roleEmpty = state.sidebarItems < 2 && !state.hasNoise && !state.coreInSidebar;
  const roleOk = !roleCoreWrong && !roleOverloaded && !roleEmpty;

  const contrastOk = state.contrast === "navy" || state.contrast === "tinted";
  const mobileOk = state.mobileMode === "drawer" || state.mobileMode === "stack";

  const checks = { ratioOk, roleOk, contrastOk, mobileOk };
  const passed = [ratioOk, roleOk, contrastOk, mobileOk].filter(Boolean).length;

  // 视觉权力定性档位（不做假精确百分比）
  let dominanceTier = "主次分明";
  if (ratioTooWide || state.contrast === "loud" || roleCoreWrong) {
    dominanceTier = "侧栏压主";
  } else if (state.contrast === "invisible") {
    dominanceTier = "主次糊连";
  } else if (ratioTooNarrow) {
    dominanceTier = "侧栏窒息";
  } else if (roleOverloaded) {
    dominanceTier = "边栏拥堵";
  } else if (roleEmpty) {
    dominanceTier = "空栏耗地";
  } else if (!mobileOk) {
    dominanceTier = "窄屏失守";
  }

  // 行宽可读定性档位（示意）
  let measureTier = "舒适";
  if (mainCPL < 26) measureTier = "偏窄";
  else if (mainCPL > 44) measureTier = "偏长";

  // 诊断结论（单真源，按严重度排序，8 类失误 + 达标多解反馈）
  let diag;
  if (ratioTooWide) {
    diag = {
      ok: false,
      code: "sidebar-usurp",
      badge: `错态 · 喧宾夺主 (${passed}/4)`,
      title: `侧栏占了 ${sidebarPct}%，反过来压扁主内容`,
      why: `1280px 桌面上主区被挤到只剩 ${mainPx}px（估算每行约 ${mainCPL} 字，示意），视线一进页就被半壁江山的侧栏拖走。侧栏一旦跨过 36% 经验参考带，就不再是辅道，而是第二主角。`,
      action: `向左拖动画布中央分割刃（或按 ← 键），把侧栏收进 20%–36% 经验参考带（例如原海报 32% 或文档 25%）。`,
    };
  } else if (ratioTooNarrow) {
    diag = {
      ok: false,
      code: "sidebar-crushed",
      badge: `错态 · 侧栏窒息 (${passed}/4)`,
      title: `侧栏只剩 ${sidebarPct}%（约 ${sidebarPx}px），文字被压断`,
      why: `侧栏缩到 20% 以下后，扣除留白每行只能塞进约 ${sidebarCharsPerLine} 个字，导航和注释被迫竖排断词；同时主区飙到 ${mainPct}%（约 ${mainCPL} 字/行，示意），太宽反倒容易读串行。`,
      action: `把分割刃往回拉进 20%–36% 经验参考带，让侧栏条目能从容排成整句。`,
    };
  } else if (roleCoreWrong) {
    diag = {
      ok: false,
      code: "core-misplaced",
      badge: `错态 · 主次错装 (${passed}/4)`,
      title: `核心主内容被误塞进侧栏，主区反而唱空城`,
      why: `侧栏只该放「不看也不影响读懂主线，看了能帮得上忙」的辅助信息。把核心主图或主论点塞进窄边栏，既委屈了主角的展示空间，又让读者在宽主区里找不到视觉锚点。`,
      action: `直接点击画布侧栏里带红框的「核心模块」（或点下方「核心归主区」），把它移回主内容区。`,
    };
  } else if (roleOverloaded) {
    diag = {
      ok: false,
      code: "sidebar-overloaded",
      badge: `错态 · 边栏过载 (${passed}/4)`,
      title: `侧栏堆了 ${totalSidebarBlocks} 个杂乱模块${state.hasNoise ? "（含 2 条无关噪点）" : ""}`,
      why: `太多毫无关系的挂件、推荐和弹窗塞满边道，会让读者在余光里持续被干扰——久而久之大脑直接启动「边栏屏蔽」，连真正有用的目录与注释也一起跳过。`,
      action: `直接点画布里的红色噪点卡片清掉它们，并把侧栏精简到 2–4 组清晰模块。`,
    };
  } else if (roleEmpty) {
    diag = {
      ok: false,
      code: "sidebar-empty",
      badge: `错态 · 空栏浪费 (${passed}/4)`,
      title: `侧栏几乎空着（仅 ${state.sidebarItems} 组），却白占 ${sidebarPct}% 宽度`,
      why: `为了「有侧栏」而硬切出一条几乎空白的边轨，等于平白浪费了 ${sidebarPx}px 版面宽度。如果辅助信息不足 2 组，不如直接改用单栏版式或行内提示。`,
      action: `把侧栏内容补足到 2–4 组真实辅助信息（注释、目录、标签或支持）。`,
    };
  } else if (state.contrast === "loud") {
    diag = {
      ok: false,
      code: "contrast-loud",
      badge: `错态 · 抢色喧哗 (${passed}/4)`,
      title: `高饱和亮橘侧栏比主内容还刺眼`,
      why: `侧栏需要与主区区分开，但靠高饱和暖色大面积铺满侧栏，会在明度与彩度上同时压倒暖纸主区，强行把眼球拽向辅助栏，违背了「内容优先」和「视觉协调」。`,
      action: `把对比体系切到「深靛分界（原海报解）」或「柔纸细线（轻出版解）」，让边界清晰而克制。`,
    };
  } else if (state.contrast === "invisible") {
    diag = {
      ok: false,
      code: "contrast-invisible",
      badge: `错态 · 主次无界 (${passed}/4)`,
      title: `同底色又无分隔线，主区和侧栏糊成一团`,
      why: `左右两栏共用同色暖纸、没有细线也没有色面反差，眼睛在扫读行尾时会顺势滑进侧栏文字，把辅助注释当成正文下一句，层次瞬间失效。`,
      action: `切到「深靛分界」或「柔纸细线」，为边道建立明确但不喧闹的视觉分界。`,
    };
  } else if (state.mobileMode === "fixed") {
    diag = {
      ok: false,
      code: "mobile-crushed",
      badge: `错态 · 窄屏挤扁 (${passed}/4)`,
      title: `桌面看着顺眼，到了 390px 手机上直接崩行`,
      why: `手机竖屏宽仅 390px，硬保留并排侧栏会把主文压到约 ${mobileMainPx}px（每行仅约 ${mobileMainCPL} 字）或挤出横向滚动条，直接触碰 WCAG 2.1 的 1.4.10 重排红线。`,
      action: `把移动端适配切到「顶栏折叠抽屉」或「流式下沉堆叠」，看底沿 390px 监看条立刻恢复整行可读。`,
    };
  } else if (state.mobileMode === "hidden") {
    diag = {
      ok: false,
      code: "mobile-loss",
      badge: `错态 · 隐藏丢信息 (${passed}/4)`,
      title: `移动端直接 display: none，把目录和注释彻底删没了`,
      why: `原海报写「移动端可折叠或隐藏，按需呈现」，前提是「按需仍能打开」。若只写隐藏却不留折叠入口，手机读者就永远失去了目录与术语释义，属于信息丢失。`,
      action: `改用「顶栏折叠抽屉（按需展开）」或「流式下沉堆叠（顺主文后呈现）」。`,
    };
  } else {
    const styleName =
      state.contrast === "navy"
        ? "原海报深靛强对比解"
        : "极简柔纸细线解";
    const railNote =
      state.side === "left"
        ? "左侧栏顺应左倾扫读习惯，适合目录高频跳转。"
        : "右侧栏让暖纸主区独占左半首眼焦点，注释与支持静静伴读。";
    diag = {
      ok: true,
      code: "pass",
      badge: `已校齐 · 4 / 4 层次清晰`,
      title: `${mainPct}% : ${sidebarPct}% ${styleName}成立`,
      why: `主区占 ${mainPx}px（估算约 ${mainCPL} 字/行，${measureTier}，示意），承载核心内容；侧栏占 ${sidebarPx}px，干净收纳 ${state.sidebarItems} 组辅助信息；390px 移动端通过${state.mobileMode === "drawer" ? "顶栏折叠抽屉按需呼出" : "流式下沉自然排在主文之后"}，零横向溢出。${railNote}`,
      action: `你可以继续换「柔纸细线 / 深靛分界」、切左右边位或故意拖爆比例，观察不同合法解与失误形态。`,
    };
  }

  // 对应原海报右侧 5 项「侧栏功能」的实时状态灯
  const functionsStatus = [
    {
      id: "main",
      title: "主内容区",
      en: "MAIN CONTENT",
      body: "呈现核心信息，占据主要视觉空间，引导阅读流向。",
      ok: ratioOk && !roleCoreWrong,
      chip: roleCoreWrong
        ? "核心被抢"
        : ratioTooWide
          ? `仅剩 ${mainPct}%`
          : ratioTooNarrow
            ? `过宽 ${mainPct}%`
            : `占 ${mainPct}%`,
    },
    {
      id: "notes",
      title: "侧边注释",
      en: "SIDE NOTES",
      body: "提供补充说明、定义、案例或提示，辅助理解主内容。",
      ok: !roleCoreWrong && !roleEmpty && !roleOverloaded,
      chip: roleCoreWrong
        ? "错塞主图"
        : roleOverloaded
          ? `${totalSidebarBlocks} 块过载`
          : roleEmpty
            ? "空栏浪费"
            : `${state.sidebarItems} 组清晰`,
    },
    {
      id: "nav",
      title: "导航指引",
      en: "NAVIGATION",
      body: "包含目录、链接或章节导航，帮助用户快速定位与跳转。",
      ok: !ratioTooNarrow && !state.hasNoise,
      chip: ratioTooNarrow
        ? "过窄断字"
        : state.hasNoise
          ? "噪点干扰"
          : state.side === "left"
            ? "左轨直达"
            : "右轨伴读",
    },
    {
      id: "contrast",
      title: "对比强化",
      en: "CONTRAST",
      body: "通过色彩与结构对比，区分主次内容，增强信息识别度。",
      ok: contrastOk,
      chip: CONTRAST_MODES[state.contrast].tier,
    },
    {
      id: "support",
      title: "信息支持",
      en: "SUPPORT",
      body: "展示标签、相关资源或行动建议，强化内容的延伸价值。",
      ok: mobileOk && !state.hasNoise,
      chip: !mobileOk
        ? state.mobileMode === "fixed"
          ? "390px 挤扁"
          : "窄屏丢失"
        : state.hasNoise
          ? "夹杂广告"
          : MOBILE_MODES[state.mobileMode].label,
    },
  ];

  return {
    sidebarPct,
    mainPct,
    mainPx,
    sidebarPx,
    mainCPL,
    measureTier,
    sidebarCharsPerLine,
    totalSidebarBlocks,
    mobileMainPx,
    mobileMainCPL,
    mobileOverflowPx,
    mobileInfoLoss,
    dominanceTier,
    checks,
    passed,
    diag,
    functionsStatus,
  };
}

// 计算画布内部各矩形区，供绘制与点击命中共享同一真源坐标
export function computeCanvasLayout(state, w, h) {
  const pad = Math.max(10, Math.round(Math.min(w, h) * 0.028));
  const stripH = h >= 320 ? 52 : 42;
  const gapY = 8;
  const spreadRect = {
    x: pad,
    y: pad,
    w: w - pad * 2,
    h: h - pad * 2 - stripH - gapY,
  };
  const stripRect = {
    x: pad,
    y: spreadRect.y + spreadRect.h + gapY,
    w: spreadRect.w,
    h: stripH,
  };

  if (state.viewportPreview === "mobile") {
    // 手机竖屏实机压测框：居中 390 比例小屏
    const phoneW = Math.min(spreadRect.w * 0.62, Math.max(210, spreadRect.h * 0.62));
    const phoneX = spreadRect.x + (spreadRect.w - phoneW) / 2;
    const phoneRect = { x: phoneX, y: spreadRect.y, w: phoneW, h: spreadRect.h };
    const ratio = clampSidebarPct(state.sidebarPct) / 100;
    const sideW = Math.round(phoneW * ratio);
    const mainW = phoneW - sideW;
    const isLeft = state.side === "left";
    const mainRect =
      state.mobileMode === "fixed"
        ? { x: isLeft ? phoneX + sideW : phoneX, y: phoneRect.y, w: mainW, h: phoneRect.h }
        : { x: phoneX, y: phoneRect.y, w: phoneW, h: state.mobileMode === "stack" ? Math.round(phoneRect.h * 0.64) : phoneRect.h };
    const sidebarRect =
      state.mobileMode === "fixed"
        ? { x: isLeft ? phoneX : phoneX + mainW, y: phoneRect.y, w: sideW, h: phoneRect.h }
        : state.mobileMode === "stack"
          ? { x: phoneX, y: phoneRect.y + mainRect.h, w: phoneW, h: phoneRect.h - mainRect.h }
          : { x: phoneX, y: phoneRect.y, w: phoneW, h: 36 };
    const sashX = isLeft ? phoneX + sideW : phoneX + mainW;
    return {
      isMobileView: true,
      spreadRect,
      phoneRect,
      mainRect,
      sidebarRect,
      stripRect,
      sashX,
      sashHit: { x: sashX - 22, y: phoneRect.y, w: 44, h: phoneRect.h },
    };
  }

  const ratio = clampSidebarPct(state.sidebarPct) / 100;
  const sideW = Math.round(spreadRect.w * ratio);
  const mainW = spreadRect.w - sideW;
  const isLeft = state.side === "left";
  const mainRect = {
    x: isLeft ? spreadRect.x + sideW : spreadRect.x,
    y: spreadRect.y,
    w: mainW,
    h: spreadRect.h,
  };
  const sidebarRect = {
    x: isLeft ? spreadRect.x : spreadRect.x + mainW,
    y: spreadRect.y,
    w: sideW,
    h: spreadRect.h,
  };
  const sashX = isLeft ? spreadRect.x + sideW : spreadRect.x + mainW;

  return {
    isMobileView: false,
    spreadRect,
    phoneRect: null,
    mainRect,
    sidebarRect,
    stripRect,
    sashX,
    sashHit: { x: sashX - 22, y: spreadRect.y, w: 44, h: spreadRect.h },
  };
}
