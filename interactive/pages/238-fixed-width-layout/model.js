// 238 固定宽度布局 — 单真源几何、跨屏压测与诊断模型
// 画布绘制、顶眉灯、白话诊单、数值读数与 CSS 代码全部从此模块实时计算。

export const VIEWPORT_PRESETS = [
  { id: "mobile", width: 375, label: "手机", short: "375", desc: "常见手机竖屏" },
  { id: "tablet", width: 768, label: "平板", short: "768", desc: "竖屏平板" },
  { id: "classic", width: 1024, label: "经典", short: "1024", desc: "960 时代标准屏" },
  { id: "desktop", width: 1440, label: "桌面", short: "1440", desc: "主流笔记本/桌面" },
  { id: "wide", width: 1920, label: "超宽", short: "1920", desc: "全高清/大显示器" },
];

export const WIDTH_MIN = 420;
export const WIDTH_MAX = 1380;
export const SNAP_BENCHMARKS = [680, 720, 960, 1080, 1120, 1200];

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报三栏",
    en: "POSTER SPECIMEN",
    sweetMin: 860,
    sweetMax: 1160,
    fontSize: 15,
    cols: 3,
    sweetHint: "860–1160px（三栏舒展且左右留白安定，经验带）",
    pillars: [
      { title: "宽度恒定", body: "内容区域宽度固定\n避免阅读路径变化", tag: "FIXED" },
      { title: "边距稳定", body: "左右留白一致\n保持视觉平衡", tag: "MARGIN" },
      { title: "内容居中", body: "信息在容器内居中\n提升阅读效率", tag: "CONTROL" },
    ],
    miniCards: ["固定容器", "左右留白", "稳定阅读"],
  },
  article: {
    id: "article",
    label: "单栏长文",
    en: "LONG-FORM READING",
    sweetMin: 580,
    sweetMax: 760,
    fontSize: 16,
    cols: 1,
    sweetHint: "580–760px（约 32–42 汉字/行，贴合长文回扫带）",
    headline: "为什么书页从来不铺满整张书桌？",
    lead: "读完一行文字再回扫下一行开头时，行宽一旦拉得太长，眼睛很容易落偏串行；锁住最大宽度，就是给视线搭一条稳固的轨道。",
    meta: "专栏 · 排印测度 · 16px 正文",
  },
  landing: {
    id: "landing",
    label: "产品官网",
    en: "PRODUCT LANDING",
    sweetMin: 960,
    sweetMax: 1200,
    fontSize: 15,
    cols: 3,
    sweetHint: "960–1200px（官网首屏与三卡功能区常见上限带）",
    heroTitle: "用固定容器，守住品牌页的视觉秩序",
    heroSub: "居中容器承接核心卖点，外侧留白平静托举页面重心。",
    features: [
      { k: "01", t: "首屏聚焦", d: "核心口号与按钮落在中心视野" },
      { k: "02", t: "整数栏网", d: "12 列等分模块，跨页对齐稳定" },
      { k: "03", t: "窄屏回退", d: "max-width 护栏确保手机零横滚" },
    ],
  },
};

export function createInitialState() {
  // 开场刻意停在 0/4 经典老派固定宽翻车态：
  // 硬锁 1280px（导致手机/平板/1024 三屏溢出，且 1440 宽屏过宽）+ 左贴 margin:0 + 零内垫 0px
  return {
    containerWidth: 1280,
    lockMode: "hard", // "hard" | "max" | "min"
    align: "left", // "left" | "center" | "right"
    gutter: 0, // 0..96
    viewport: 1440,
    scenario: "poster",
  };
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function snapWidth(rawWidth, enableSnap = true) {
  const clamped = Math.round(clamp(rawWidth, WIDTH_MIN, WIDTH_MAX));
  if (!enableSnap) return clamped;
  for (const mark of SNAP_BENCHMARKS) {
    if (Math.abs(clamped - mark) <= 10) return mark;
  }
  return clamped;
}

export function computeViewportLayout(state, vpWidth) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const targetW = clamp(Math.round(state.containerWidth), WIDTH_MIN, WIDTH_MAX);
  const gutter = clamp(Math.round(state.gutter), 0, 96);

  let boxW = targetW;
  let overflowPx = 0;
  let innerContentW = 0;
  let innerPad = gutter;

  if (state.lockMode === "hard") {
    boxW = targetW;
    overflowPx = Math.max(0, boxW - vpWidth);
    innerContentW = Math.max(40, boxW - 2 * gutter);
    innerPad = gutter;
  } else if (state.lockMode === "max") {
    boxW = Math.min(targetW, vpWidth);
    overflowPx = 0;
    innerContentW = Math.max(40, boxW - 2 * gutter);
    innerPad = gutter;
  } else {
    // width: min(Wpx, 100% - 2*gutter)
    const capByVp = Math.max(120, vpWidth - 2 * gutter);
    boxW = Math.min(targetW, capByVp);
    overflowPx = 0;
    // 外边距已留出安全呼吸空隙；框内另给轻度版心参考（按 boxW 实算）
    innerPad = 0;
    innerContentW = Math.max(40, boxW);
  }

  const freeSpace = Math.max(0, vpWidth - boxW);
  let leftMargin = 0;
  let rightMargin = 0;
  if (overflowPx > 0) {
    leftMargin = 0;
    rightMargin = 0;
  } else if (state.align === "center") {
    leftMargin = freeSpace / 2;
    rightMargin = freeSpace / 2;
  } else if (state.align === "left") {
    leftMargin = 0;
    rightMargin = freeSpace;
  } else {
    leftMargin = freeSpace;
    rightMargin = 0;
  }

  const skewPx = Math.round(Math.abs(leftMargin - rightMargin));
  const marginRatio = vpWidth > 0 ? Math.max(0, (leftMargin + rightMargin) / vpWidth) : 0;

  // 在窄屏下内容离屏幕玻璃的真实最小距离
  const leftEdgeClearance = Math.round(leftMargin + innerPad);
  const rightEdgeClearance = overflowPx > 0 ? 0 : Math.round(rightMargin + innerPad);
  const minEdgeClearance = Math.min(leftEdgeClearance, rightEdgeClearance);

  // 内容列宽与估算每行汉字数（按场景真实排版结构计算）
  const activeCols = sc.cols === 1 ? 1 : (boxW < 640 && state.lockMode !== "hard" ? 1 : 3);
  const colGap = activeCols > 1 ? 20 : 0;
  const colW = Math.max(48, (innerContentW - colGap * (activeCols - 1)) / activeCols);

  // 主阅读行宽：单栏长文用全内宽；三栏题材按顶部主文案/摘要行宽（约占内宽 78%）或单列宽
  const readingW = sc.cols === 1 ? innerContentW : innerContentW;
  const cjkPerLine = Math.max(6, Math.round(readingW / sc.fontSize));
  const colCjkPerLine = Math.max(4, Math.round(colW / sc.fontSize));

  return {
    vpWidth,
    boxW: Math.round(boxW),
    visibleW: Math.round(Math.min(boxW, vpWidth)),
    overflowPx: Math.round(overflowPx),
    overflowRatio: vpWidth > 0 ? overflowPx / vpWidth : 0,
    leftMargin: Math.round(leftMargin),
    rightMargin: Math.round(rightMargin),
    skewPx,
    marginRatio,
    innerPad,
    innerContentW: Math.round(innerContentW),
    leftEdgeClearance,
    rightEdgeClearance,
    minEdgeClearance,
    activeCols,
    colW: Math.round(colW),
    cjkPerLine,
    colCjkPerLine,
    wcagFail: overflowPx > 0,
  };
}

export function evaluate(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const screens = VIEWPORT_PRESETS.map((p) => ({
    ...p,
    ...computeViewportLayout(state, p.width),
  }));
  const current = computeViewportLayout(state, state.viewport);
  const wcag320 = computeViewportLayout(state, 320);
  const mobile375 = screens[0];
  const desktop1440 = screens[3];
  const wide1920 = screens[4];

  const overflowScreens = screens.filter((s) => s.overflowPx > 0);

  // 四大核心支柱校验（单真源，与画布和诊单一致）
  const widthOk = state.containerWidth >= sc.sweetMin && state.containerWidth <= sc.sweetMax;
  const guardOk = overflowScreens.length === 0 && wcag320.overflowPx === 0;
  const centerOk = state.align === "center";
  // 边距稳定：既要求有安全护垫（16–44px），又要求 375px 手机内宽不被吃光且两侧不贴玻璃
  const gutterOk = state.gutter >= 16 && state.gutter <= 44 && mobile375.minEdgeClearance >= 16 && mobile375.innerContentW >= 240;

  const pillars = {
    widthOk,
    guardOk,
    centerOk,
    gutterOk,
  };
  const score = [widthOk, guardOk, centerOk, gutterOk].filter(Boolean).length;

  // 8 类失误 + 达标识别（按严重度排优先级，永远说出「为什么」和下一步动作）
  let kind = "pass";
  let severity = "pass"; // "error" | "warn" | "pass"
  let badge = "4 / 4 达标";
  let headline = "";
  let reason = "";
  let hint = "";

  if (!guardOk) {
    kind = "hard-overflow";
    severity = "error";
    badge = `错态 · 硬宽溢出 (${score}/4)`;
    const clippedPct = Math.round((mobile375.overflowPx / state.containerWidth) * 100);
    headline = `硬锁 width: ${state.containerWidth}px 把手机屏直接切掉 ${clippedPct}%`;
    reason = `固定写死 width 而不设上限护栏，在 375px 手机上会横向冲出 +${mobile375.overflowPx}px（共 ${overflowScreens.length} 块屏幕触发横向滚动条），违背 WCAG 2.1 的 1.4.10 重排准则，读者每看一行都要手指左右来回拖。`;
    hint = "把下方「② 宽度锁法」切到 max-width 或 CSS min()，让宽屏定宽、窄屏自动收进视口。";
  } else if (!centerOk) {
    kind = state.align === "left" ? "left-stuck" : "right-stuck";
    severity = "error";
    badge = `错态 · 贴边失衡 (${score}/4)`;
    const side = state.align === "left" ? "左侧" : "右侧";
    const emptySide = state.align === "left" ? "右侧" : "左侧";
    headline = `容器死贴${side}，1440px 桌面上${emptySide}白白悬空 ${desktop1440.skewPx}px`;
    reason = `没有水平居中（margin-inline: auto）时，左右留白变成 ${desktop1440.leftMargin}px 对 ${desktop1440.rightMargin}px（1920px 超宽屏下更偏出 ${wide1920.skewPx}px）。视觉重心整块歪向一边，脖子与视线被迫偏轴扫读。`;
    hint = "把「③ 水平对齐」切到「居中 auto」，立刻把剩余空间均分到左右两侧。";
  } else if (state.gutter < 16 || mobile375.minEdgeClearance < 16) {
    kind = "zero-gutter";
    severity = "error";
    badge = `错态 · 零垫贴壁 (${score}/4)`;
    headline = `内边距仅 ${state.gutter}px，窄屏文字直接擦着屏幕玻璃走`;
    reason = `就算改用了 max-width，一旦视口收窄到容器宽以内（如 375px 手机或分屏窗口），容器外侧留白归零。少了 16–40px 的安全护垫，首尾汉字直接撞在边框或手机黑边上，一眼看去压迫窒息。`;
    hint = "把「④ 安全护垫」调到 24px 或 36px，给窄屏和边框留出呼吸空隙。";
  } else if (state.gutter > 44 || mobile375.innerContentW < 240) {
    kind = "bloated-gutter";
    severity = "error";
    badge = `错态 · 巨垫吞栏 (${score}/4)`;
    headline = `单侧护垫飙到 ${state.gutter}px，手机正文被挤剩 ${mobile375.innerContentW}px 细条`;
    reason = `左右各扣掉 ${state.gutter}px 后，375px 手机屏幕几乎一半面积被空壳吃掉，每行只能塞进约 ${mobile375.cjkPerLine} 个汉字，句子碎成竖条，翻屏次数暴增。`;
    hint = "把「④ 安全护垫」收回到 16–40px 舒适带（24px 是常见甜区）。";
  } else if (state.containerWidth > sc.sweetMax) {
    kind = "too-wide";
    severity = "error";
    badge = `错态 · 超宽串行 (${score}/4)`;
    headline = `${sc.label}拉宽到 ${state.containerWidth}px，读完一行回扫容易跳行`;
    reason =
      state.scenario === "article"
        ? `当前是单栏长文，${state.containerWidth}px 容器在 16px 字号下每行高达约 ${desktop1440.cjkPerLine} 个汉字，超出 WCAG 1.4.8 建议的 40 汉字上限，眼珠从行尾扫回下一行开头时极易落偏重读。`
        : `容器逼近 1440px 屏幕边缘（左右留白仅各 ${desktop1440.leftMargin}px），三栏跨距拉散、左右留白护岸几乎消失，固定宽度原本「收拢视线、安定边界」的优势荡然无存。`;
    hint = `在画布上向左拖动容器边线，把宽幅收进 ${sc.sweetHint}。`;
  } else if (state.containerWidth < sc.sweetMin) {
    kind = "too-narrow";
    severity = "error";
    badge = `错态 · 过窄挤碎 (${score}/4)`;
    headline = `容器压扁到 ${state.containerWidth}px，桌面两侧空出 ${Math.round(desktop1440.marginRatio * 100)}% 荒原`;
    reason =
      sc.cols === 3
        ? `把三栏内容硬塞进 ${state.containerWidth}px，每栏净宽仅剩 ${desktop1440.colW}px，标题和短句被迫频繁折行，而 1440px 屏幕左右却各空出 ${desktop1440.leftMargin}px。`
        : `单栏宽不足 ${sc.sweetMin}px 时，每行只有约 ${desktop1440.cjkPerLine} 个汉字，眼睛频繁换行折返，阅读节奏被打成碎步。`;
    hint = `在画布上向右拖动容器边线，把宽幅推入 ${sc.sweetHint}。`;
  } else {
    // 全部 4 项达标！识别具体属于哪类合法解
    severity = "pass";
    let solutionName = "自定义合规解";
    if (state.scenario === "article" && state.containerWidth >= 640 && state.containerWidth <= 720) {
      solutionName = "长文专注 680–720 解";
    } else if (state.containerWidth >= 940 && state.containerWidth <= 980) {
      solutionName = "经典 960 网格解";
    } else if (state.containerWidth >= 1080 && state.containerWidth <= 1160) {
      solutionName = "现代宽版容器解";
    }
    badge = `4 / 4 达标 · ${solutionName}`;
    headline = `宽屏稳住 ${state.containerWidth}px 阅读轨道，五屏全线 0px 溢出`;
    const wideNote =
      state.viewport === 1920 && wide1920.marginRatio > 0.62 && state.scenario === "article"
        ? `在 1920px 超宽屏下左右各留 ${wide1920.leftMargin}px 净空，长文依然稳守约 ${desktop1440.cjkPerLine} 字/行，不被大屏拉散。`
        : `1440px 桌面上左右留白精准对称（各 ${desktop1440.leftMargin}px），切到 375px 手机时由 ${state.lockMode === "min" ? "min()" : "max-width"} 护栏接管并守住 ${mobile375.minEdgeClearance}px 边垫。`;
    reason = wideNote;
    hint = "可点画布底部五块设备剖面切屏检验，或切换「单栏长文 / 产品官网」看不同题材的合理上限。";
  }

  // 生成单真源实时 CSS 代码（直接反映当前全部 4 项参数）
  const cssLines = buildCssPreview(state, { widthOk, guardOk, centerOk, gutterOk });

  // 三枚原海报底部支柱徽章实况
  const legendStatus = {
    fixed: {
      ok: widthOk && guardOk,
      text: !guardOk
        ? `硬锁溢出`
        : state.containerWidth > sc.sweetMax
          ? `过宽 ${state.containerWidth}px`
          : state.containerWidth < sc.sweetMin
            ? `过窄 ${state.containerWidth}px`
            : `稳锁 ${state.containerWidth}px`,
    },
    margin: {
      ok: gutterOk && centerOk,
      text: !centerOk
        ? `偏斜 ${desktop1440.skewPx}px`
        : state.gutter < 16
          ? `贴壁 ${state.gutter}px`
          : state.gutter > 44
            ? `过厚 ${state.gutter}px`
            : `对称 · 垫 ${state.gutter}px`,
    },
    control: {
      ok: centerOk && guardOk,
      text: !centerOk
        ? state.align === "left"
          ? "左贴失衡"
          : "右贴失衡"
        : !guardOk
          ? `窄屏切边`
          : `居中 · 0 溢出`,
    },
  };

  return {
    scenario: sc,
    screens,
    current,
    wcag320,
    mobile375,
    desktop1440,
    wide1920,
    overflowScreens,
    pillars,
    score,
    kind,
    severity,
    badge,
    headline,
    reason,
    hint,
    cssLines,
    legendStatus,
  };
}

function buildCssPreview(state, flags) {
  const lines = [".container {"];
  if (state.lockMode === "hard") {
    lines.push(`  width: ${state.containerWidth}px; /* [!] 硬锁：窄屏横向溢出 */`);
  } else if (state.lockMode === "max") {
    lines.push(`  width: 100%;`);
    lines.push(`  max-width: ${state.containerWidth}px;${flags.widthOk ? "" : " /* [!] 宽幅越出当前题材舒适带 */"}`);
  } else {
    const sub = state.gutter * 2;
    lines.push(
      `  width: ${sub > 0 ? `min(${state.containerWidth}px, 100% - ${sub}px)` : `min(${state.containerWidth}px, 100%)`};${flags.widthOk ? "" : " /* [!] 宽幅越出舒适带 */"}`,
    );
  }

  if (state.align === "center") {
    lines.push(`  margin-inline: auto;`);
  } else if (state.align === "left") {
    lines.push(`  margin: 0; /* [!] 贴左：宽屏右侧空悬 */`);
  } else {
    lines.push(`  margin-left: auto; /* [!] 贴右：重心右倾 */`);
  }

  if (state.lockMode !== "min") {
    const padNote = state.gutter < 16 ? " /* [!] 零垫：窄屏文字贴壁 */" : state.gutter > 44 ? " /* [!] 过厚：手机内容被挤碎 */" : "";
    lines.push(`  padding-inline: ${state.gutter}px;${padNote}`);
  } else if (state.gutter < 16) {
    lines.push(`  /* [!] 100% 未预留双侧安全边垫 */`);
  } else if (state.gutter > 44) {
    lines.push(`  /* [!] 100% - ${state.gutter * 2}px 在手机端吃掉过多宽度 */`);
  }

  lines.push("}");
  return lines;
}

// 04 节：960 整除因子分析单真源函数
export function analyzeGridDivisors(containerPx, cols, gutterPx = 20) {
  const totalGutter = gutterPx * cols; // 960.gs 模式：每列左右各半沟（10px + 10px）
  const rawCol = containerPx / cols;
  const netCol = (containerPx - totalGutter) / cols;
  const exactOuter = containerPx % cols === 0;
  const exactInner = (containerPx - totalGutter) % cols === 0 && netCol > 0;
  return {
    containerPx,
    cols,
    gutterPx,
    rawCol,
    netCol,
    exactOuter,
    exactInner,
    rawLabel: exactOuter ? `${rawCol}px` : `${rawCol.toFixed(2)}px`,
    netLabel: exactInner ? `${netCol}px` : `${netCol.toFixed(2)}px`,
  };
}
