// 237 覆盖布局（OVERLAY LAYOUT）单真源状态与评判模型
// 画布绘制、白话诊单、实时 CSS 预览与各节实验全部从本文件核算，无硬编码不一致读数。

export const PALETTE = {
  night: "#060916",
  nightDeep: "#0B1024",
  nightPanel: "#101833",
  cyan: "#34BBE0",
  cyanBright: "#53EFFC",
  cyanGlass: "#135F85",
  magenta: "#EB59A1",
  magentaDot: "#E44F90",
  magentaMid: "#CD539A",
  violet: "#705FB4",
  violetDot: "#9865C5",
  ice: "#F5F6F8",
  frameWhite: "#E8E7E6",
  pass: "#5EEBD4",
  fail: "#FF7B89",
};

// 经验参考遮罩不透明度带（35%–75%），所有界面文案、诊单与判分共用此常量
export const SCRIM_MIN = 35;
export const SCRIM_MAX = 75;
export const COVER_MAX = 84;

export const SCENARIOS = {
  modal: {
    id: "modal",
    label: "确认弹窗",
    en: "MODAL DIALOG",
    title: "发布 v2.4 到生产环境",
    sub: "将覆盖当前 12 个运行节点，请确认版本号后继续。",
    primaryBtn: "确认发布",
    secondaryBtn: "取消",
    baseCoverage: 34, // 正常弹窗占视口面积百分比
    normalRect: { x: 0.22, y: 0.14, w: 0.56, h: 0.56 },
  },
  drawer: {
    id: "drawer",
    label: "侧边抽屉",
    en: "SIDE DRAWER",
    title: "筛选与图层属性",
    sub: "保留左侧主画面作为参照，在右侧快速调整参数。",
    primaryBtn: "应用筛选",
    secondaryBtn: "重置",
    baseCoverage: 44,
    normalRect: { x: 0.54, y: 0.06, w: 0.42, h: 0.88 },
  },
  sheet: {
    id: "sheet",
    label: "预览灯箱",
    en: "LIGHTBOX SHEET",
    title: "237 视觉稿检视",
    sub: "放大查看局部细节，按 Esc 或点幕布随时退回列表。",
    primaryBtn: "导出成稿",
    secondaryBtn: "返回列表",
    baseCoverage: 52,
    normalRect: { x: 0.16, y: 0.16, w: 0.68, h: 0.68 },
  },
};

export const LAYER_MODES = {
  trap: {
    id: "trap",
    label: "transform 牢笼",
    short: "牢笼反穿",
    zText: "父 transform · z:9999 被 z:20 压",
    ok: false,
    aboveHeader: false,
  },
  z_low: {
    id: "z_low",
    label: "根层 z:10",
    short: "层级倒挂",
    zText: "Root z:10 < 顶栏 z:20",
    ok: false,
    aboveHeader: false,
  },
  z_high: {
    id: "z_high",
    label: "根层 z:40",
    short: "根层高位",
    zText: "Root z:40 > 顶栏 z:20",
    ok: true,
    aboveHeader: true,
  },
  top_layer: {
    id: "top_layer",
    label: "Top Layer 顶层",
    short: "原生顶层",
    zText: "<dialog> Top Layer（无视 z-index）",
    ok: true,
    aboveHeader: true,
  },
};

export const FOCUS_MODES = {
  broken: {
    id: "broken",
    label: "套娃 + 无退出",
    hasNested: true,
    hasExit: false,
    oversize: false,
    ok: false,
  },
  nested: {
    id: "nested",
    label: "双弹套娃",
    hasNested: true,
    hasExit: true,
    oversize: false,
    ok: false,
  },
  no_exit: {
    id: "no_exit",
    label: "藏起退出",
    hasNested: false,
    hasExit: false,
    oversize: false,
    ok: false,
  },
  oversize: {
    id: "oversize",
    label: "90% 全屏闷死",
    hasNested: false,
    hasExit: true,
    oversize: true,
    ok: false,
  },
  clean: {
    id: "clean",
    label: "单层 + Esc 退出",
    hasNested: false,
    hasExit: true,
    oversize: false,
    ok: true,
  },
};

// 开场默认 0/4 灾难错态：绝不先给答案
export function createInitialState() {
  return {
    scenario: "modal",
    view: "front", // "front" (0° 正视) | "iso" (32° Z轴侧剖)
    layerMode: "trap",
    scrim: 6, // 0..100
    blur: 0, // 0 | 6
    inert: false,
    focusMode: "broken",
    activeLayer: null, // null | "fg" | "mid" | "bg"
    leakCount: 0,
    shieldCount: 0,
    lastEvent: "",
  };
}

// 合法解预设（原海报原生 Top Layer 解 / 根层隔离解）
export const PRESETS = {
  broken: () => createInitialState(),
  posterTopLayer: (scenario = "modal") => ({
    scenario,
    view: "front",
    layerMode: "top_layer",
    scrim: 54,
    blur: 6,
    inert: true,
    focusMode: "clean",
    activeLayer: null,
    leakCount: 0,
    shieldCount: 0,
    lastEvent: "",
  }),
  rootHighZ: (scenario = "drawer") => ({
    scenario,
    view: "front",
    layerMode: "z_high",
    scrim: 48,
    blur: 0,
    inert: true,
    focusMode: "clean",
    activeLayer: null,
    leakCount: 0,
    shieldCount: 0,
    lastEvent: "",
  }),
};

// ---------- 物理色度与 WCAG 2.1 SC 1.4.3 真实对比度计算 ----------
export function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function blendRgb(fg, bg, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return [
    Math.round(fg[0] * a + bg[0] * (1 - a)),
    Math.round(fg[1] * a + bg[1] * (1 - a)),
    Math.round(fg[2] * a + bg[2] * (1 - a)),
  ];
}

export function relLuminance([r, g, b]) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1);
  const l2 = relLuminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ---------- 舞台几何矩形单真源（0..1 归一化） ----------
export function getStageRects(state) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.modal;
  const fm = FOCUS_MODES[state.focusMode] || FOCUS_MODES.broken;
  const fg = fm.oversize
    ? { x: 0.045, y: 0.055, w: 0.91, h: 0.89 }
    : { ...sc.normalRect };
  const coveragePct = Math.round(fg.w * fg.h * 100);
  // 背景顶部固定导航栏（z-index: 20），故意与弹窗上沿交叠，让「牢笼反穿」肉眼立见
  const header = { x: 0.04, y: 0.07, w: 0.92, h: 0.13 };
  // 背景中刻意露出的危险操作按钮，供用户实点测试是否穿透（避开底沿遮罩滑轨）
  const dangerBtn =
    state.scenario === "drawer"
      ? { x: 0.06, y: 0.72, w: 0.30, h: 0.11 }
      : { x: 0.06, y: 0.75, w: 0.29, h: 0.11 };
  // 前景关闭按钮热区
  const closeBtn = {
    x: fg.x + fg.w - 0.08,
    y: fg.y + 0.025,
    w: 0.06,
    h: 0.08,
  };
  // 套娃二级弹窗热区（压在前景右下角）
  const nestedModal = {
    x: Math.min(0.56, fg.x + fg.w * 0.36),
    y: Math.min(0.50, fg.y + fg.h * 0.44),
    w: 0.39,
    h: 0.32,
  };
  return { header, fg, dangerBtn, closeBtn, nestedModal, coveragePct };
}

// ---------- 单真源四维核算与 8 类失误诊断 ----------
export function evaluate(state) {
  const lm = LAYER_MODES[state.layerMode] || LAYER_MODES.trap;
  const fm = FOCUS_MODES[state.focusMode] || FOCUS_MODES.broken;
  const rects = getStageRects(state);
  const scrimPct = Math.round(Math.max(0, Math.min(100, state.scrim)));
  const alpha = scrimPct / 100;

  // 计算实绘光学分离度：前景电青框/白字与“穿透中景遮罩后的底层高亮紫卡”之间的实算对比度
  const bgBrightCard = hexToRgb("#8D7DD1"); // 背景层中最亮的一张紫卡
  const scrimTint = hexToRgb("#080B1C"); // 午夜暗幕
  const veiledBg = blendRgb(scrimTint, bgBrightCard, alpha);
  const fgCardSurface = hexToRgb("#0F243D");
  const fgTitleInk = hexToRgb("#F5F6F8");
  // 如果遮罩很淡，视觉上前景白字还要对抗背后透出来的浅紫干扰色
  const perceivedBehindTitle = blendRgb(fgCardSurface, veiledBg, 0.38 + alpha * 0.56);
  const titleContrast = contrastRatio(fgTitleInk, perceivedBehindTitle);
  // 前景白框与被遮罩压暗后的背景之间的轮廓分离比
  const frameSeparation = contrastRatio(hexToRgb("#53EFFC"), veiledBg);

  const layerOk = lm.ok;
  const depthOk = scrimPct >= SCRIM_MIN && scrimPct <= SCRIM_MAX;
  const inertOk = Boolean(state.inert);
  const focusOk = fm.ok && rects.coveragePct <= COVER_MAX;

  const score = [layerOk, depthOk, inertOk, focusOk].filter(Boolean).length;
  const passed = score === 4;

  // 按严重程度定位主错态（8 类实测失误）
  let errorCode = "ok";
  let badge = "已校准 · 4 / 4";
  let headline = "三层秩序成立：前景清透、底层可感、退路干净";
  let detail =
    lm.id === "top_layer"
      ? `浮层位于浏览器原生 Top Layer，完全不受祖先 transform 影响；${scrimPct}% 遮罩既把背景干扰压低（轮廓分离 ${frameSeparation.toFixed(1)}:1），又隐约留住底页语境，加上 inert 锁背与 Esc 退出闭环，用户进退都不迷路。`
      : `浮层位于根层叠上下文（z-index: 40 > 顶栏 20），避开了局部层叠牢笼；${scrimPct}% 遮罩与 inert 阻断配合单层退出闭环，同样是一组稳妥解法。`;
  let actionHint = "试着点背景左下「清空草稿」验证阻断，或切「32° Z 轴侧剖」透视三层深度。";

  if (!layerOk && lm.id === "trap") {
    errorCode = "trapped";
    badge = `错态 · 层叠牢笼（${score}/4）`;
    headline = "写了 z-index: 9999，仍被底层 z:20 顶栏一刀劈穿";
    detail =
      "前景浮层被写进了带 transform 的父卡片里，浏览器会为该父卡片建起封闭的局部层叠上下文（权重仅 0）。子元素把 z-index 写到 9999 也飞不出父容器天花板，只能眼睁睁被外层 z:20 顶栏压在底下。";
    actionHint = "在下方「① 层叠机制」切到原生 Top Layer（<dialog>）或移回「根层 z:40」。";
  } else if (!layerOk && lm.id === "z_low") {
    errorCode = "z_under";
    badge = `错态 · 层级倒挂（${score}/4）`;
    headline = "浮层 z-index: 10 低于顶栏 20，前景反而缩进背后";
    detail =
      "即使已经回到根层叠上下文，覆盖层的堆叠层级依然必须高于页面里的固定顶栏与悬浮工具条，否则顶部内容会被导航栏硬生生截断。";
    actionHint = "把「① 层叠机制」抬到「根层 z:40」，或直接交给「Top Layer 顶层」。";
  } else if (!depthOk && scrimPct < SCRIM_MIN) {
    errorCode = "scrim_thin";
    badge = `错态 · 缺幕透字（${score}/4）`;
    headline = `中景遮罩仅 ${scrimPct}%，背景亮块与前景文字打成一团`;
    detail = `遮罩低于 ${SCRIM_MIN}% 经验下限时，底层亮紫卡片与按钮全速透出，前景青框与背景分离度仅 ${frameSeparation.toFixed(1)}:1。眼睛不得不同时解码两层画面，反而找不到焦点。`;
    actionHint = `在主画布上向右横拖（或调下方遮罩档），把遮罩拉进 ${SCRIM_MIN}%–${SCRIM_MAX}% 经验参考带。`;
  } else if (!depthOk && scrimPct > SCRIM_MAX) {
    errorCode = "scrim_wall";
    badge = `错态 · 黑墙断联（${score}/4）`;
    headline = `中景遮罩高达 ${scrimPct}%，把底层语境彻底抹成了黑墙`;
    detail = `覆盖布局之所以不是“跳转新页面”，是因为它保留了背后原页面的微弱轮廓。遮罩超过 ${SCRIM_MAX}% 后背景完全消失，用户会以为跳到了新页、瞬间失去返回方向感。`;
    actionHint = `向左拖回画布，把遮罩降到 ${SCRIM_MIN}%–${SCRIM_MAX}%，让底层页面隐约可辨。`;
  } else if (!inertOk) {
    errorCode = "leak_through";
    badge = `错态 · 点击穿透（${score}/4）`;
    headline = "遮罩只是画了张图，点空白处仍会穿透误触底层按钮";
    detail =
      "视觉上看着盖住了，交互上却没有给底层加 inert 隔离：手滑点到前景外侧会直接触发底层「清空草稿」，键盘按 Tab 焦点也会溜回背景控件。";
    actionHint = "先点画布左下「清空草稿」亲测穿透，再打开「③ 背景阻断：inert 锁背」。";
  } else if (fm.id === "oversize" || rects.coveragePct > COVER_MAX) {
    errorCode = "over_cover";
    badge = `错态 · 面积闷死（${score}/4）`;
    headline = `前景占满 ${rects.coveragePct}% 视口，把「显露」彻底闷死了`;
    detail =
      "覆盖层一旦膨胀到接近整屏，既不留语境、又平白多了一层关闭负担。装下这么多内容时，应该直接做独立页面，而不是硬套弹窗外壳。";
    actionHint = "在「④ 焦点与退出」切回「单层 + Esc 退出」，把前景收回克制比例。";
  } else if (fm.hasNested) {
    errorCode = "nested_overload";
    badge = `错态 · 套娃叠弹（${score}/4）`;
    headline = "弹窗之上又盖促销浮窗，两层互抢焦点让人只想关网页";
    detail =
      "确认任务还没做完，第二层覆盖又劈头盖脸压上来——这就是 NN/g 点名的「覆盖过载（Overlay Overload）」。每次叠加都会把退出成本翻倍。";
    actionHint = "直接点画布里斜压的二级弹窗消掉它，或在下方切到「单层 + Esc 退出」。";
  } else if (!fm.hasExit) {
    errorCode = "no_exit";
    badge = `错态 · 无出口锁死（${score}/4）`;
    headline = "藏起了 × 关闭钮又屏蔽 Esc，用户进得去却退不回";
    detail =
      "W3C WAI-ARIA 对话框模式明确要求模态层提供显式关闭入口并响应 Esc 键。没有清晰退路的覆盖层，会立刻把聚焦感变成被困感。";
    actionHint = "在「④ 焦点与退出」恢复「单层 + Esc 退出」，再按键盘 Esc 试退一次。";
  }

  // 三彩圆（原海报 LAYER / DEPTH / EMPHASIS）实时短标
  const layerTag = layerOk
    ? lm.id === "top_layer"
      ? "Top Layer"
      : "根层 z:40"
    : lm.id === "trap"
      ? "牢笼反穿"
      : "z:10 倒挂";
  const depthTag = depthOk
    ? `遮罩 ${scrimPct}%`
    : scrimPct < SCRIM_MIN
      ? `过淡 ${scrimPct}%`
      : `黑墙 ${scrimPct}%`;
  const emphasisTag =
    inertOk && focusOk
      ? "单层闭环"
      : !inertOk
        ? "背景穿透"
        : fm.id === "oversize"
          ? `占屏 ${rects.coveragePct}%`
          : fm.hasNested
            ? "双弹套娃"
            : "无退出锁死";

  // 实时同步 CSS / HTML 代码片段
  const codeSnippet = buildCodeSnippet(state, lm, fm, scrimPct);

  return {
    score,
    passed,
    errorCode,
    badge,
    headline,
    detail,
    actionHint,
    checks: { layerOk, depthOk, inertOk, focusOk },
    tags: { layerTag, depthTag, emphasisTag },
    metrics: {
      stackLabel: lm.short,
      scrimPct,
      blurPx: state.blur,
      titleContrast: Number(titleContrast.toFixed(1)),
      frameSeparation: Number(frameSeparation.toFixed(1)),
      coveragePct: rects.coveragePct,
      bgVisibilityPct: Math.max(0, 100 - scrimPct),
      inertLabel: inertOk ? "已锁背 (inert)" : "可穿透 (危险)",
      exitLabel: fm.hasExit ? (fm.hasNested ? "被套娃干扰" : "× 与 Esc 畅通") : "出口被屏蔽",
    },
    rects,
    codeSnippet,
  };
}

function buildCodeSnippet(state, lm, fm, scrimPct) {
  const alphaStr = (scrimPct / 100).toFixed(2);
  const blurLine = state.blur > 0 ? `\n  backdrop-filter: blur(${state.blur}px);` : "";
  const scrimWarn =
    scrimPct < SCRIM_MIN
      ? " /* [!] 过淡易透字 */"
      : scrimPct > SCRIM_MAX
        ? " /* [!] 过暗断语境 */"
        : "";
  const inertLine = state.inert
    ? `/* 背景已 inert，禁止点击与 Tab 穿透 */`
    : `/* [!] 缺 inert：点击与焦点会穿透底层 */`;
  const exitComment = !fm.hasExit
    ? `\n/* [!] 缺失关闭钮且拦截 Esc */`
    : fm.hasNested
      ? `\n/* [!] 嵌套第二个弹窗造成焦点分裂 */`
      : fm.oversize
        ? `\n/* [!] 宽高逼近 90%，应改用独立页面 */`
        : "";

  if (lm.id === "top_layer") {
    return `<!-- 原生顶层：脱离一切祖先层叠上下文 -->
<dialog id="confirm" aria-modal="true">…</dialog>
dialog::backdrop {
  background: rgba(6, 9, 22, ${alphaStr});${scrimWarn}${blurLine}
}
${inertLine}${exitComment}`;
  }
  if (lm.id === "trap") {
    return `.page-header { position: sticky; z-index: 20; }
.card-wrap   { transform: translateZ(0); } /* [!] 建起局部层叠牢笼 */
.card-wrap .overlay { z-index: 9999; }     /* [!] 仍被 z:20 顶栏反压 */
.scrim { background: rgba(6, 9, 22, ${alphaStr});${scrimWarn}${blurLine} }
${inertLine}${exitComment}`;
  }
  const zVal = lm.id === "z_low" ? 10 : 40;
  const zWarn = lm.id === "z_low" ? " /* [!] 小于顶栏 20 */" : " /* 高于顶栏 20 */";
  return `.page-header { position: sticky; z-index: 20; }
.overlay-root { position: fixed; inset: 0; z-index: ${zVal}; }${zWarn}
.scrim { background: rgba(6, 9, 22, ${alphaStr});${scrimWarn}${blurLine} }
${inertLine}${exitComment}`;
}

// ---------- 02 节：层叠上下文 X 光树计算 ----------
export function evalStackingLab(cfg) {
  // cfg: { transform, opacity, filter, isolation, topLayer }
  const triggers = [];
  if (cfg.transform) triggers.push("transform: translateY(0)");
  if (cfg.opacity) triggers.push("opacity: 0.99");
  if (cfg.filter) triggers.push("filter: blur(0px)");
  if (cfg.isolation) triggers.push("isolation: isolate");

  const cardCreatesContext = triggers.length > 0;
  const modalWins = cfg.topLayer || !cardCreatesContext;

  let verdictTitle = "";
  let verdictBody = "";
  let order = [];

  if (cfg.topLayer) {
    verdictTitle = "原生 Top Layer 越狱成功：无视一切父级层叠上下文";
    verdictBody =
      "调用 <dialog>.showModal() 或 popover 后，浏览器把元素移入独立于文档根的「顶层渲染通道（Top Layer）」。哪怕外层卡片同时写满 transform、opacity 与 isolation，浮层依然稳居最前。";
    order = [
      { rank: 1, name: "Top Layer · <dialog>", ctx: "浏览器顶层", z: "Top Layer", role: "fg", win: true },
      { rank: 2, name: "<header> 固定顶栏", ctx: "Root 根上下文", z: "z-index: 20", role: "header", win: false },
      { rank: 3, name: "<section.card> 内容卡", ctx: cardCreatesContext ? "局部上下文 (z:0)" : "Root 普通流", z: "z-index: auto", role: "bg", win: false },
    ];
  } else if (cardCreatesContext) {
    verdictTitle = `弹窗被关进局部层叠上下文：z-index: 9999 败给顶栏 20`;
    verdictBody = `因为父容器写了 ${triggers.join(" + ")}，它在根层叠上下文里自动结成了一个“原子壳”（权重等同于 0）。弹窗的 z-index: 9999 只在壳内排第一，走出壳外对比时，0 小于顶栏的 20，顶栏直接盖穿弹窗！`;
    order = [
      { rank: 1, name: "<header> 固定顶栏（劈穿前景）", ctx: "Root 根上下文", z: "z-index: 20", role: "header", win: true },
      { rank: 2, name: "<section.card> 牢笼壳", ctx: "Root → 局部上下文", z: "外部权重 = 0", role: "trap", win: false },
      { rank: 3, name: "  └ .modal 弹窗（被困）", ctx: "仅在卡片内部生效", z: "内部 z: 9999", role: "fg", win: false },
    ];
  } else {
    verdictTitle = "父容器透明无壳：弹窗直接进入 Root 根上下文竞争";
    verdictBody =
      "父卡片没有声明任何会建立新层叠上下文的 CSS 属性，于是弹窗的 z-index: 9999 直接参与根上下文排序，顺利压过 z-index: 20 的顶栏——但这很脆弱，日后谁顺手给卡片加一句动画 transform，弹窗就会突然被顶栏压穿。";
    order = [
      { rank: 1, name: ".modal 弹窗", ctx: "Root 根上下文", z: "z-index: 9999", role: "fg", win: true },
      { rank: 2, name: "<header> 固定顶栏", ctx: "Root 根上下文", z: "z-index: 20", role: "header", win: false },
      { rank: 3, name: "<section.card> 内容卡", ctx: "Root 普通流", z: "无新上下文", role: "bg", win: false },
    ];
  }

  return { triggers, cardCreatesContext, modalWins, verdictTitle, verdictBody, order };
}

// ---------- 03 节：大图覆文遮罩与 WCAG 2.1 SC 1.4.3 实时对比度核算 ----------
export function evalScrimLab(cfg) {
  // cfg: { opacity: 0..95, mode: "flat" | "gradient" | "violet", blur: 0..16 }
  // 模拟一张高光亮部（雪山/云光）#E8EDF5 与中景彩斑 #D872B8 的头图，文字位于画面下半部
  const brightPhotoSpot = hexToRgb("#DDE6F2"); // 文字下方最亮像素
  const upperPhotoSpot = hexToRgb("#DCEAF4"); // 上半部高光主景
  const scrimColor = cfg.mode === "violet" ? hexToRgb("#1B123A") : hexToRgb("#060916");
  const textWhite = hexToRgb("#F7F8FA");

  // 底部渐变模式在文字区（底部）保持完整遮罩浓度，但在画面上半部退让至仅 8%，既保 contrast 又保图透亮！
  const bottomAlpha = cfg.opacity / 100;
  const topAlpha = cfg.mode === "gradient" ? Math.min(0.12, bottomAlpha * 0.14) : bottomAlpha;

  const behindTextRgb = blendRgb(scrimColor, brightPhotoSpot, bottomAlpha);
  const topHighlightRgb = blendRgb(scrimColor, upperPhotoSpot, topAlpha);

  const textRatio = contrastRatio(textWhite, behindTextRgb);
  const aaNormal = textRatio >= 4.5;
  const aaLarge = textRatio >= 3.0;
  const highlightKeptPct = Math.round((1 - topAlpha) * 100);

  let status = "pass";
  let summary = "";
  if (!aaLarge) {
    status = "fail";
    summary = `正文对比度仅 ${textRatio.toFixed(1)}:1，连 WCAG 2.1 AA 大字底线（3.0:1）都没过，浅亮背景直接吃掉了白色标题。`;
  } else if (!aaNormal) {
    status = "warn";
    summary = `对比度 ${textRatio.toFixed(1)}:1，勉强够大标题（≥ 3.0:1），但正文副标未达 4.5:1 标准，建议把遮罩再提一点或改用底部渐变。`;
  } else if (cfg.mode !== "gradient" && cfg.opacity >= 78) {
    status = "warn";
    summary = `文字对比度高达 ${textRatio.toFixed(1)}:1 绝对够看，但整幅平涂把上方主体明度也压死到 ${highlightKeptPct}%，换成「底部渐变幕」就能两全。`;
  } else if (cfg.mode === "gradient") {
    status = "pass";
    summary = `文字区对比度 ${textRatio.toFixed(1)}:1 稳过 WCAG 2.1 AA（≥ 4.5:1），同时画面上半部保留了 ${highlightKeptPct}% 原图透亮度——局部渐变幕是大图覆文的黄金解法。`;
  } else {
    status = "pass";
    summary = `文字区对比度 ${textRatio.toFixed(1)}:1 稳过 WCAG 2.1 AA（≥ 4.5:1），全屏压暗 ${cfg.opacity}% 适合需要整体降温的弹窗或封面底。`;
  }

  return {
    textRatio: Number(textRatio.toFixed(1)),
    aaNormal,
    aaLarge,
    highlightKeptPct,
    status,
    summary,
    topAlpha,
    bottomAlpha,
  };
}

// ---------- 04 节：四种覆盖形态对照数据 ----------
export const OVERLAY_PATTERNS = {
  modal: {
    id: "modal",
    name: "模态弹窗",
    en: "MODAL · <dialog>",
    blocking: "完全阻断底层（inert）",
    focus: "锁定焦点环 + 关后回焦点",
    dismiss: "确认/取消钮 + Esc",
    scrim: "45%–65% 半透明暗幕",
    when: "删除数据、支付确认、权限授权等高代价决策。",
    code: "dialog.showModal(); // 原生 Top Layer + ::backdrop + inert",
  },
  drawer: {
    id: "drawer",
    name: "侧边抽屉",
    en: "DRAWER / SHEET",
    blocking: "半阻断或轻阻断（留一侧参照）",
    focus: "进入抽屉，点空白或 Esc 收起",
    dismiss: "点半透明侧幕 + × + Esc",
    scrim: "35%–55% 轻暗幕",
    when: "列表筛选、详情速览、购物车——需要边看背后内容边操作。",
    code: ".drawer { position: fixed; inset: 0 0 0 auto; width: min(420px, 86vw); }",
  },
  popover: {
    id: "popover",
    name: "轻弹层",
    en: "POPOVER API",
    blocking: "非模态（背景仍可继续交互）",
    focus: "不锁死底层，按需流转",
    dismiss: "点任意外部即关（Light-Dismiss）+ Esc",
    scrim: "无暗幕，靠亮边描框与投影分离",
    when: "下拉菜单、快捷设置卡、成员名片等低打断辅助面板。",
    code: '<div id="menu" popover="auto">…</div> <!-- Baseline 2025 -->',
  },
  toast: {
    id: "toast",
    name: "轻提示",
    en: "TOAST / STATUS",
    blocking: "零阻断，不挡主操作区",
    focus: "不抢键盘焦点（用 aria-live 播报）",
    dismiss: "短时自动收起 + 手动可关",
    scrim: "无遮罩",
    when: "「已保存草稿」「链接已复制」等无需打断流程的状态回执。",
    code: '<aside role="status" aria-live="polite">已保存变更</aside>',
  },
};

// ---------- 06 节：单变量诊断练习（仅中景遮罩与背景隔离不同） ----------
export const QUIZ_ITEMS = [
  {
    id: "A",
    label: "方案 A",
    scrimOpacity: 0,
    inert: false,
    correct: false,
    reason:
      "0% 全透明且未阻断背景：确认框与底下编辑列表视觉混成一片，用户手滑点偏就会直接点到背后按钮，既没聚焦也不安全。",
  },
  {
    id: "B",
    label: "方案 B",
    scrimOpacity: 0.55,
    inert: true,
    correct: true,
    reason:
      "正确。55% 半透明遮罩落在经验参考带内，既把底层视觉噪声压静、让不可逆删除确认跳出焦点，又隐约留住背后项目名称供核对，同时用 inert 防止误触穿透。",
  },
  {
    id: "C",
    label: "方案 C",
    scrimOpacity: 1.0,
    inert: true,
    correct: false,
    reason:
      "100% 实黑把背景页面彻底抹掉：用户点开删除确认的瞬间反而看不见自己正在删哪个项目，丢掉了覆盖布局「保留语境」的核心价值。",
  },
  {
    id: "D",
    label: "方案 D",
    scrimOpacity: 0.12,
    inert: false,
    correct: false,
    reason:
      "12% 极淡透膜既拉不开前后明度差，又没有锁住底层滚动和点击——高危删除确认不能使用半吊子遮罩。",
  },
];
