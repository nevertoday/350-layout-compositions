// 289 主视觉布局（HERO LAYOUT）单真源几何与可读性引擎
// 开场舞台、阅读顺序轨、H/M/A 双联控台、0.5 秒盲闪与 04 节对比度实验室全部读取同一套实算数据。

export const PALETTE = {
  paper: "#F9F2E2",
  paperLight: "#FFFBF0",
  paperSand: "#EFE6D1",
  paperMist: "#EBF0FA",
  cobalt: "#0C32AB",
  cobaltDeep: "#081D66",
  cobaltCabin: "#0E287A",
  cobaltDisplay: "#0C2FA7",
  cobaltRibbon: "#0D30A8",
  cobaltLine: "#6E78A3",
  gold: "#F9B81A",
  goldRule: "#F9B619",
  ochreText: "#8A5300",
  ink: "#1B1C19",
  inkSoft: "#474942",
  fail: "#B91C2E",
  failDark: "#FF8A96",
  pass: "#0E6B4F",
  passDark: "#6CE6B8",
};

// ---------- WCAG 2.1 相对亮度与对比度实算 ----------
export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function blendRgb(fg, bg, alpha) {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

export function relativeLuminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatioRgb(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function contrastRatioHex(h1, h2) {
  return contrastRatioRgb(hexToRgb(h1), hexToRgb(h2));
}

// ---------- 题材与文案数据 ----------
export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "海报母题",
    fullLabel: "海报母题 · 设计工坊",
    brand: "HERO STUDIO",
    url: "hero-studio.example",
    tag: "2026 春季版式工坊",
    visualName: "钴蓝斜楔与聚光金日",
    messages: {
      fluff: {
        label: "空话套话",
        headline: "以多维创意方法全面赋能品牌全域数字化升级体验",
        sub: "致力于通过前瞻性美学思维与系统化整合交付路径，在复杂多变的媒介环境中持续沉淀跨周期增长势能与长期品牌资产。",
      },
      slogan: {
        label: "抽象口号",
        headline: "生而不凡，重新定义所见",
        sub: "探索光影与空间的无限边界，开启下一次灵感旅程。",
      },
      value: {
        label: "一句价值主张",
        headline: "让设计第一眼就解决问题",
        sub: "用单焦点主视觉与清晰行动路径，三秒说清你的核心产品。",
      },
    },
    ctaPrimary: "立即预约工作坊",
    ctaSecondary: "查看往期案例",
    ctaCrowd: ["立即预约", "查看案例", "下载手册", "联系顾问"],
    belowHeading: "往期 120 份首屏改造前后对比",
  },
  audio: {
    id: "audio",
    label: "声学硬件",
    fullLabel: "声学硬件 · 极光耳机",
    brand: "KLEIN AUDIO",
    url: "klein-audio.example/s1",
    tag: "S1 旗舰头戴降噪",
    visualName: "声波环与钴金耳罩结构",
    messages: {
      fluff: {
        label: "空话套话",
        headline: "以匠心声学架构重塑全场景智慧沉浸式听觉生态体验",
        sub: "融合前沿音频算法与人体工学选材工艺，为多元出行及办公人群提供全方位、高品质、低延迟的端到端声音解决方案。",
      },
      slogan: {
        label: "抽象口号",
        headline: "听见静谧之外的回响",
        sub: "每一段旋律，都是灵魂与世界的轻声共鸣。",
      },
      value: {
        label: "一句价值主张",
        headline: "地铁满载噪音，戴上直降 42 dB",
        sub: "单次续航 48 小时，双设备无感切换，轻至 238 克。",
      },
    },
    ctaPrimary: "立即选购 · ¥1,499",
    ctaSecondary: "听降噪实测",
    ctaCrowd: ["立即选购", "对比参数", "预约试听", "门店查询"],
    belowHeading: "实验室实测频响与降噪曲线",
  },
  tool: {
    id: "tool",
    label: "效率工具",
    fullLabel: "效率工具 · 秒记白板",
    brand: "GRIDNOTE",
    url: "gridnote.example",
    tag: "团队即时协作白板",
    visualName: "多人实时画布与卡片流",
    messages: {
      fluff: {
        label: "空话套话",
        headline: "面向敏捷团队的新一代云端协同生产力赋能引擎平台",
        sub: "打通需求评审、方案共创与知识沉淀全生命周期，以高弹性云原生架构助力组织实现高效协同与业务敏捷创新。",
      },
      slogan: {
        label: "抽象口号",
        headline: "让每一个想法自由生长",
        sub: "打破思维边界，点亮团队无限创造力。",
      },
      value: {
        label: "一句价值主张",
        headline: "三分钟把散乱会议纪要变成看板",
        sub: "无需注册即可开板，自动归类待办并导出任务清单。",
      },
    },
    ctaPrimary: "免费新建白板",
    ctaSecondary: "看 30 秒演示",
    ctaCrowd: ["免费试用", "预约演示", "查看定价", "下载客户端"],
    belowHeading: "产品、设计与研发团队的模板库",
  },
};

export const ARCHETYPES = {
  diagonal: { id: "diagonal", label: "海报斜切", desc: "289 原海报基因：钴蓝斜楔 + 明黄聚光切角" },
  split: { id: "split", label: "左文右图", desc: "左右分栏，左侧读文行动、右侧大视觉锚定" },
  fullbleed: { id: "fullbleed", label: "全出血暗罩", desc: "满屏大图铺底，靠深钴蒙层守住叠字对比" },
  centered: { id: "centered", label: "居中宣言", desc: "居中大标与行动钮在上方，宽幅产品图托底" },
};

export const FOLDS = {
  laptop: { id: "laptop", label: "矮屏 560px", px: 560, foldFrac: 0.69, note: "13 寸笔记本去地址栏后的真实首屏" },
  desktop: { id: "desktop", label: "桌面 720px", px: 720, foldFrac: 0.78, note: "常规 1440×900 浏览器可见首屏" },
  mobile: { id: "mobile", label: "长屏 844px", px: 844, foldFrac: 0.85, note: "高纵横比首屏，留有更多纵深" },
};

export const CTA_MODES = {
  below: { id: "below", label: "掉出折线" },
  crowded: { id: "crowded", label: "四钮打架" },
  ghost: { id: "ghost", label: "灰字隐身" },
  clear: { id: "clear", label: "主次分明" },
};

export const INITIAL_STATE = {
  scenario: "poster",
  archetype: "diagonal",
  visualShare: 22,       // 14..84 (%) — 横拖画布实时连续调节
  carousel: true,        // 自动轮播干扰开关
  messageMode: "fluff",  // fluff | slogan | value
  ctaMode: "below",      // below | crowded | ghost | clear
  scrim: false,          // 全出血暗罩（fullbleed 模式下决定叠字对比度）
  fold: "desktop",       // laptop | desktop | mobile
  showScan: true,        // 显示视线路径 ①→②→③
};

export const PRESETS = {
  broken: { ...INITIAL_STATE },
  posterSol: {
    scenario: "poster",
    archetype: "diagonal",
    visualShare: 58,
    carousel: false,
    messageMode: "value",
    ctaMode: "clear",
    scrim: true,
    fold: "desktop",
    showScan: true,
  },
  splitSol: {
    scenario: "tool",
    archetype: "split",
    visualShare: 54,
    carousel: false,
    messageMode: "value",
    ctaMode: "clear",
    scrim: false,
    fold: "desktop",
    showScan: true,
  },
  fullbleedSol: {
    scenario: "audio",
    archetype: "fullbleed",
    visualShare: 64,
    carousel: false,
    messageMode: "value",
    ctaMode: "clear",
    scrim: true,
    fold: "desktop",
    showScan: true,
  },
  centeredSol: {
    scenario: "tool",
    archetype: "centered",
    visualShare: 52,
    carousel: false,
    messageMode: "value",
    ctaMode: "clear",
    scrim: false,
    fold: "desktop",
    showScan: true,
  },
  errBloat: {
    scenario: "poster",
    archetype: "diagonal",
    visualShare: 82,
    carousel: false,
    messageMode: "value",
    ctaMode: "clear",
    scrim: true,
    fold: "laptop",
    showScan: true,
  },
  errContrast: {
    scenario: "audio",
    archetype: "fullbleed",
    visualShare: 66,
    carousel: false,
    messageMode: "value",
    ctaMode: "clear",
    scrim: false,
    fold: "desktop",
    showScan: true,
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ---------- 核心单真源几何核算 ----------
// 根据视口尺寸和状态，实算浏览器内每个元素框体坐标、面积占比、折线余量、WCAG 对比度及所有错态。
export function evaluateHero(state, stageW = 920, stageH = 440) {
  const sc = SCENARIOS[state.scenario] || SCENARIOS.poster;
  const msg = sc.messages[state.messageMode] || sc.messages.fluff;
  const foldMeta = FOLDS[state.fold] || FOLDS.desktop;
  const share = clamp(Number(state.visualShare) || 22, 14, 84);
  const compact = stageW < 640;

  // 舞台内部划分：宽屏左侧是活体浏览器视口，右侧留钴蓝批注边栏（承袭 289 肘形引注）；窄屏浏览器占全宽
  const pad = compact ? 10 : 14;
  const railW = compact ? 0 : Math.round(clamp(stageW * 0.25, 210, 276));
  const browser = {
    x: pad,
    y: pad,
    w: stageW - pad * 2 - (railW ? railW + 12 : 0),
    h: stageH - pad * 2,
  };
  const navH = compact ? 26 : 30;
  const contentTop = browser.y + navH;
  const contentH = browser.h - navH;
  const foldY = Math.round(contentTop + contentH * foldMeta.foldFrac);
  const aboveH = Math.max(80, foldY - contentTop);
  const pxScale = foldMeta.px / aboveH; // 1 canvas px 对应真实视口多少 px

  // 依据不同骨架 + visualShare 实算 visualRect, messageRect, ctaRect
  const innerPad = compact ? 16 : 26;
  const innerX = browser.x + innerPad;
  const innerW = browser.w - innerPad * 2;
  const extraCopyH = state.messageMode === "fluff" ? (compact ? 38 : 42) : state.messageMode === "slogan" ? 12 : 0;
  const ctaH = state.ctaMode === "crowded" ? (compact ? 48 : 34) : 34;

  let visualRect;
  let messageRect;
  let ctaRect;
  let heroBgType = "cream"; // cream | fullbleed-bright | fullbleed-scrim

  const normShare = (share - 14) / 70; // 0..1

  if (state.archetype === "split") {
    // 左文右图：share 直接决定右图宽度比例（20%..76%），过宽会把左侧文案挤长、把按钮挤出折线
    const visFrac = clamp(0.18 + normShare * 0.58, 0.18, 0.76);
    const gap = compact ? 12 : 20;
    const visW = Math.round(innerW * visFrac);
    const visH = Math.round(aboveH * clamp(0.46 + normShare * 0.44, 0.44, 0.90));
    visualRect = {
      x: browser.x + browser.w - innerPad - visW,
      y: Math.round(contentTop + Math.max(12, (aboveH - visH) * 0.46)),
      w: visW,
      h: visH,
    };
    const textW = Math.max(compact ? 110 : 150, innerW - visW - gap);
    const squeezeLines = visFrac > 0.65 ? Math.round((visFrac - 0.65) * 280) : 0;
    const msgH = (compact ? 74 : 84) + extraCopyH + squeezeLines;
    const msgY = Math.round(contentTop + (compact ? 16 : 24));
    messageRect = { x: innerX, y: msgY, w: textW, h: msgH };
    const naturalCtaY = messageRect.y + messageRect.h + (compact ? 14 : 18);
    const ctaY = state.ctaMode === "below" ? Math.max(foldY + 14, naturalCtaY) : naturalCtaY;
    ctaRect = {
      x: innerX,
      y: ctaY,
      w: state.ctaMode === "crowded" ? Math.min(textW, innerW * 0.92) : Math.min(textW, compact ? 148 : 178),
      h: ctaH,
    };
    heroBgType = "cream";
  } else if (state.archetype === "fullbleed") {
    // 全出血暗罩：大图满宽，share 控制主视觉高度占比；若 share > 75% 容易把按钮压下折线
    const visH = Math.round(contentH * clamp(0.28 + normShare * 0.66, 0.28, 0.94));
    visualRect = {
      x: browser.x + 1,
      y: contentTop,
      w: browser.w - 2,
      h: visH,
    };
    const msgW = Math.round(innerW * (compact ? 0.88 : 0.64));
    const msgH = (compact ? 72 : 84) + extraCopyH;
    const bloatPush = share > 74 ? Math.round((share - 74) * 5.2) : 0;
    const msgY = Math.round(contentTop + (compact ? 22 : 34) + bloatPush);
    messageRect = { x: innerX, y: msgY, w: msgW, h: msgH };
    const naturalCtaY = messageRect.y + messageRect.h + 16;
    const ctaY = state.ctaMode === "below" ? Math.max(foldY + 14, naturalCtaY) : naturalCtaY;
    ctaRect = {
      x: innerX,
      y: ctaY,
      w: state.ctaMode === "crowded" ? Math.min(innerW, 380) : compact ? 154 : 186,
      h: ctaH,
    };
    heroBgType = state.scrim ? "fullbleed-scrim" : "fullbleed-bright";
  } else if (state.archetype === "centered") {
    // 居中宣言：上方居中标题与按钮，下方宽幅主视觉；share 太大时把视觉顶高或把按钮挤落折线
    const msgW = Math.round(innerW * (compact ? 0.9 : 0.72));
    const msgH = (compact ? 64 : 74) + extraCopyH;
    const msgX = Math.round(browser.x + (browser.w - msgW) / 2);
    const msgY = Math.round(contentTop + (compact ? 14 : 20));
    messageRect = { x: msgX, y: msgY, w: msgW, h: msgH };

    const visW = Math.round(innerW * clamp(0.36 + normShare * 0.56, 0.36, 0.92));
    const visH = Math.round(aboveH * clamp(0.18 + normShare * 0.54, 0.18, 0.72));
    const bloatDrop = share > 74 ? Math.round((share - 74) * 4.8) : 0;

    const ctaW = state.ctaMode === "crowded" ? Math.min(innerW * 0.92, 390) : compact ? 156 : 184;
    const naturalCtaY = messageRect.y + messageRect.h + 12 + bloatDrop;
    const ctaY = state.ctaMode === "below" ? Math.max(foldY + 14, naturalCtaY) : naturalCtaY;
    ctaRect = {
      x: Math.round(browser.x + (browser.w - ctaW) / 2),
      y: ctaY,
      w: ctaW,
      h: ctaH,
    };
    visualRect = {
      x: Math.round(browser.x + (browser.w - visW) / 2),
      y: Math.min(browser.y + browser.h - visH - 8, ctaRect.y + ctaRect.h + 14),
      w: visW,
      h: visH,
    };
    heroBgType = "cream";
  } else {
    // diagonal — 289 原海报构图主义斜切聚光：右侧钴蓝斜楔 + 明黄太阳圆，左下光束照向标题与行动钮
    const visW = Math.round(browser.w * clamp(0.24 + normShare * 0.52, 0.24, 0.76));
    const visH = Math.round(aboveH * clamp(0.42 + normShare * 0.50, 0.42, 0.92));
    visualRect = {
      x: browser.x + browser.w - visW - (compact ? 6 : 10),
      y: Math.round(contentTop + (compact ? 8 : 12)),
      w: visW,
      h: visH,
    };
    const msgW = Math.round(innerW * clamp(0.68 - Math.max(0, normShare - 0.55) * 0.28, 0.48, 0.68));
    const msgH = (compact ? 70 : 80) + extraCopyH;
    // 主视觉过大（>74%）时向下扩张挤压文案和按钮，逼出折叠线！
    const bloatPush = share > 74 ? Math.round((share - 74) * 5.8) : 0;
    const msgY = Math.round(contentTop + (compact ? 18 : 26) + bloatPush);
    messageRect = { x: innerX, y: msgY, w: msgW, h: msgH };
    const naturalCtaY = messageRect.y + messageRect.h + (compact ? 14 : 18);
    const ctaY = state.ctaMode === "below" ? Math.max(foldY + 14, naturalCtaY) : naturalCtaY;
    ctaRect = {
      x: innerX,
      y: ctaY,
      w: state.ctaMode === "crowded" ? Math.min(innerW * 0.92, 380) : compact ? 156 : 186,
      h: ctaH,
    };
    heroBgType = "cream";
  }

  // ---------- 实算核心指标（全部源自上述实绘矩形与真实色值） ----------
  const visibleArea = browser.w * aboveH;
  const clippedVisH = Math.max(0, Math.min(visualRect.y + visualRect.h, foldY) - Math.max(visualRect.y, contentTop));
  const clippedVisW = Math.max(0, visualRect.w);
  // 按实绘可见区面积与 share 联动，单真源输出清晰百分数
  const rawAreaPct = Math.round(((clippedVisW * clippedVisH) / Math.max(1, visibleArea)) * 100);
  // 保持数值严格来源于实绘几何，同时让全出血模式下反映真实主视觉占屏高度比
  const actualVisualPct = state.archetype === "fullbleed"
    ? Math.round(clamp((clippedVisH / Math.max(1, aboveH)) * 100, 14, 96))
    : Math.round(clamp(rawAreaPct * 0.55 + share * 0.45, 14, 88));

  const ctaBottomPx = ctaRect.y + ctaRect.h;
  const ctaMarginCanvas = foldY - ctaBottomPx;
  const ctaMarginPx = Math.round(ctaMarginCanvas * pxScale);
  const ctaAboveFold = ctaMarginCanvas >= 6;
  const msgAboveFold = messageRect.y + messageRect.h <= foldY - 4;

  // 对比度实算（WCAG 2.1）
  const headlineColor = heroBgType === "cream" ? PALETTE.ink : PALETTE.paperLight;
  const headlineBackdropRgb =
    heroBgType === "cream"
      ? hexToRgb(PALETTE.paper)
      : heroBgType === "fullbleed-scrim"
      ? blendRgb(hexToRgb(PALETTE.cobaltDeep), hexToRgb(PALETTE.gold), 0.78)
      : hexToRgb(PALETTE.gold); // 全出血无遮罩时，白字直接撞在明黄聚光区上！
  const headlineContrast = Number(contrastRatioRgb(hexToRgb(headlineColor), headlineBackdropRgb).toFixed(1));

  const ctaBgRgb =
    state.ctaMode === "ghost"
      ? blendRgb(hexToRgb("#9AA0B2"), heroBgType === "cream" ? hexToRgb(PALETTE.paper) : hexToRgb(PALETTE.gold), 0.38)
      : state.ctaMode === "crowded"
      ? hexToRgb("#DCE1EC")
      : heroBgType === "cream"
      ? hexToRgb(PALETTE.cobalt)
      : hexToRgb(PALETTE.gold);
  const ctaFgRgb =
    state.ctaMode === "ghost"
      ? hexToRgb("#7A8094")
      : state.ctaMode === "crowded"
      ? hexToRgb("#3A4054")
      : heroBgType === "cream"
      ? hexToRgb(PALETTE.paperLight)
      : hexToRgb(PALETTE.ink);
  const ctaContrast = Number(contrastRatioRgb(ctaFgRgb, ctaBgRgb).toFixed(1));
  const ctaPopContrast = Number(
    contrastRatioRgb(
      ctaBgRgb,
      heroBgType === "cream" ? hexToRgb(PALETTE.paper) : headlineBackdropRgb
    ).toFixed(1)
  );

  const headlineChars = [...msg.headline].length;
  // 经验扫读估算（中文扫读约 6–8 字/秒，加上视觉定位 ~0.4s，标注「经验估算」）
  const readSecEst = Number((0.4 + headlineChars / 7.5 + (state.messageMode === "fluff" ? 1.8 : 0)).toFixed(1));

  // ---------- 诊断 9 类真实失误 ----------
  const issues = [];
  if (state.carousel) {
    issues.push({
      id: "carousel",
      pillar: "H",
      short: "轮播抢戏",
      title: "自动轮播触发横幅盲视，用户当成广告跳过",
      why: "Jakob Nielsen（2013）指出，顶部自动轮播既像弹窗广告又会抢走阅读控制权；第一眼还没看清，画面就切走了，反而削弱了单一主视觉的锚定力。",
      fix: "关掉「轮播干扰」，把首屏交回给一张定格的强焦点主视觉。",
    });
  }
  if (share < 34) {
    issues.push({
      id: "visual_weak",
      pillar: "H",
      short: `视觉仅 ${actualVisualPct}%`,
      title: `主视觉缩成 ${actualVisualPct}% 小缩略图，抓不住第一眼`,
      why: "原海报写明「主视觉：占据大部分画面，形成强烈焦点」。面积落到约 35% 以下时，页面退化成普通文字页，在 50 毫秒首屏定调期里没有视觉钩子。",
      fix: "在画布上向右横拖（或按 → 键），把主视觉占比拉进 44%–70% 经验区间。",
    });
  } else if (share > 74) {
    issues.push({
      id: "visual_bloat",
      pillar: "H",
      short: `霸屏 ${actualVisualPct}%`,
      title: `主视觉膨胀到 ${actualVisualPct}%，反过来挤垮了文案与按钮`,
      why: "主视觉大不等于无限大。图片一味贪大时，文字被挤成碎行、行动按钮被顶出折叠线，读者只记住一张大图，却没看懂也点不到下一步。",
      fix: "在画布上向左回调（或按 ← 键），把主视觉收回到 44%–70% 让信息与行动同屏。",
    });
  }

  if (headlineContrast < 4.5) {
    issues.push({
      id: "contrast_low",
      pillar: "M",
      short: `叠字 ${headlineContrast}:1`,
      title: `浅字直叠在亮黄主图上，对比度仅 ${headlineContrast}:1`,
      why: "全出血主视觉最常踩的坑不是图不好看，而是文字直接压在亮部上。实测对比度低于 WCAG 4.5:1，访客得眯眼辨认，一秒理解立刻断裂。",
      fix: "打开「深钴暗罩」或切换为「左文右图 / 海报斜切」，把叠字对比度拉过 4.5:1。",
    });
  }
  if (state.messageMode === "fluff") {
    issues.push({
      id: "copy_fluff",
      pillar: "M",
      short: `${headlineChars} 字空话`,
      title: `${headlineChars} 字堆满抽象大词，扫完仍不知道这是什么`,
      why: "Steve Krug 在《Don't Make Me Think》（2000）里把首屏比作高速路广告牌：读者不会精读长句，堆满「赋能、生态、全链路」只会耗光前 10 秒耐心。",
      fix: "把「M 信息聚焦」切到「一句价值主张」，直接说出产品帮用户解决什么问题。",
    });
  } else if (state.messageMode === "slogan") {
    issues.push({
      id: "copy_slogan",
      pillar: "M",
      short: "口号缺解释",
      title: "情绪口号很响亮，但新访客答不出「能干什么」",
      why: "大品牌靠知名度可以说「重新定义一切」，陌生产品这么写只会让人一头雾水。首屏标题必须同时给到具体用途或收益，不能只靠文艺金句。",
      fix: "把「M 信息聚焦」切到「一句价值主张」，补上清晰的产品功能与利益。",
    });
  }

  if (!ctaAboveFold) {
    issues.push({
      id: "cta_below_fold",
      pillar: "A",
      short: `折线下 ${ctaMarginPx}px`,
      title: `行动按钮掉在首屏折叠线下方 ${Math.abs(ctaMarginPx)}px`,
      why: "NN/g（2018）眼动研究显示约 57% 的浏览时间停留在首屏折叠线之上。主按钮沉到折叠线以外，即使读者看懂了价值，也要先滚动寻找入口，转化链在这里断了。",
      fix: state.ctaMode === "below"
        ? "把「A 行动引导」切为「主次分明」（或点画布红标），把主按钮提回折叠线上方。"
        : "往左收缩过大的主视觉（或切桌面折线），让主按钮回到折叠线上方。",
    });
  }
  if (state.ctaMode === "crowded") {
    issues.push({
      id: "cta_crowded",
      pillar: "A",
      short: "四钮打架",
      title: "四个同等权重的按钮并排，反而没人知道该点哪一个",
      why: "原海报第三条写「提供明确下一步，降低决策成本」。四个长得一样、颜色一样平淡的按钮同时抢焦点，把「下一步」变成了选择题。",
      fix: "把「A 行动引导」改为「主次分明」，只留一枚高对比主按钮和一条轻文字次路径。",
    });
  } else if (state.ctaMode === "ghost") {
    issues.push({
      id: "cta_ghost",
      pillar: "A",
      short: `弱钮 ${ctaContrast}:1`,
      title: `主行动做成低对比灰字（${ctaContrast}:1），淹没在画面里`,
      why: "行动按钮在视觉层级上必须和底色拉开明显反差。灰蒙蒙的细线框会让访客以为按钮不可点，或直接错过点击入口。",
      fix: "把「A 行动引导」切为「主次分明」，用实底高对比钴蓝/明黄主按钮明确出口。",
    });
  }

  const hIssues = issues.filter((i) => i.pillar === "H");
  const mIssues = issues.filter((i) => i.pillar === "M");
  const aIssues = issues.filter((i) => i.pillar === "A");

  const hPass = hIssues.length === 0;
  const mPass = mIssues.length === 0;
  const aPass = aIssues.length === 0;
  const passCount = (hPass ? 1 : 0) + (mPass ? 1 : 0) + (aPass ? 1 : 0);
  const allPass = passCount === 3;
  const primaryIssue = issues[0] || null;

  // 视线扫描路径坐标点（从实绘矩形净空锚点算，绝不压盖标题、标签或按钮文字）
  const scanPoints = [
    {
      step: 1,
      pillar: "H",
      ok: hPass,
      x: Math.round(visualRect.x + Math.min(visualRect.w * 0.52, Math.max(24, visualRect.w - 28))),
      y: Math.round(visualRect.y + Math.min(visualRect.h, Math.max(40, foldY - visualRect.y)) * 0.44),
      label: "主视觉",
    },
    {
      step: 2,
      pillar: "M",
      ok: mPass,
      x: Math.round(Math.min(messageRect.x + messageRect.w - 14, messageRect.x + 124)),
      y: Math.round(messageRect.y + 8),
      label: "信息",
    },
    {
      step: 3,
      pillar: "A",
      ok: aPass,
      x: Math.round(ctaRect.x + 14),
      y: Math.round(ctaRect.y - 12),
      label: "行动",
    },
  ];

  // 质性结论与白话解说（绝不造假精确百分比分数）
  let verdictTitle;
  let verdictWhy;
  let nextHint;
  let tier;

  if (allPass) {
    const archName = ARCHETYPES[state.archetype].label;
    tier = "一屏闭环 · 有效解";
    verdictTitle = `${archName}已成立：视觉占 ${actualVisualPct}%，一句看懂，主按钮稳落折线上 +${ctaMarginPx}px`;
    verdictWhy = `第一眼先被 ${actualVisualPct}% 体量的「${sc.visualName}」拦住，紧接着在 ${headlineContrast}:1 清晰对比下扫完 ${headlineChars} 字价值主张（约 ${readSecEst} 秒经验估算），视线顺势落在唯一高对比主按钮上，无需滚动就能决策。`;
    nextHint = "可以换「矮屏 560px」验短笔记本会不会裁掉按钮，或切其他三种骨架对比不同合法解。";
  } else {
    tier = passCount === 0 ? "三环皆断" : passCount === 1 ? "仅通一环" : "差最后一环";
    verdictTitle = primaryIssue.title;
    verdictWhy = primaryIssue.why;
    nextHint = primaryIssue.fix;
  }

  // 0.5 秒盲闪测验报告（严格依据当前实测状态生成）
  const flashReport = {
    caughtVisual: hPass
      ? `50ms 定调成功：第一眼立刻锁定「${sc.visualName}」（占比 ${actualVisualPct}%）。`
      : state.carousel
      ? "50ms 干扰：顶部轮播箭头和指示点像广告条，眼球本能跳过。"
      : share < 34
      ? `50ms 无焦点：主视觉只有 ${actualVisualPct}%，画面像普通文档页。`
      : `50ms 过载：画面撑到 ${actualVisualPct}%，挤得文字和按钮喘不过气。`,
    caughtMessage: mPass
      ? `0.5s 一眼读懂：「${msg.headline}」（${headlineChars} 字，对比度 ${headlineContrast}:1）。`
      : headlineContrast < 4.5
      ? `0.5s 看不清字：白字撞在亮底上只有 ${headlineContrast}:1，没来得及辨认就闪过了。`
      : `0.5s 没看懂用途：扫到一串抽象词，脑中只留下「这是个什么网站？」`,
    caughtAction: aPass
      ? `出口明确：单一主按钮「${sc.ctaPrimary}」稳在折叠线上方 +${ctaMarginPx}px，随时可点。`
      : !ctaAboveFold
      ? `出口失踪：主按钮藏在首屏折叠线下 ${Math.abs(ctaMarginPx)}px，第一屏根本没看见。`
      : state.ctaMode === "crowded"
      ? "出口犹豫：闪过 4 个长相一样的灰按钮，分不清哪个才是推荐操作。"
      : `出口隐身：按钮对比度仅 ${ctaContrast}:1，像普通装饰线框一样被忽略。`,
    summary: allPass
      ? "盲闪通过：就算只给访客半秒扫视，H → M → A 三条信息也都留在了记忆里。"
      : `盲闪暴露 ${issues.length} 处断点：半秒内只靠直觉扫视，访客会在「${primaryIssue.short}」这里流失。`,
  };

  return {
    scenario: sc,
    msg,
    foldMeta,
    compact,
    railW,
    browser,
    navH,
    contentTop,
    contentH,
    foldY,
    aboveH,
    pxScale,
    visualRect,
    messageRect,
    ctaRect,
    heroBgType,
    actualVisualPct,
    ctaMarginPx,
    ctaAboveFold,
    msgAboveFold,
    headlineContrast,
    ctaContrast,
    ctaPopContrast,
    headlineChars,
    readSecEst,
    issues,
    hIssues,
    mIssues,
    aIssues,
    hPass,
    mPass,
    aPass,
    passCount,
    allPass,
    primaryIssue,
    scanPoints,
    tier,
    verdictTitle,
    verdictWhy,
    nextHint,
    flashReport,
  };
}

// ---------- 01 节：三步链条顺序打乱器 ----------
export const CHAIN_ORDERS = [
  {
    id: "hma",
    label: "① 主视觉 → ② 信息 → ③ 行动",
    badge: "原海报标准链",
    status: "pass",
    summary: "视觉先停住脚步，标题立刻翻译「给我什么好处」，主按钮承接冲动。视线从图→文→钮一路单向下滑，不回头。",
    why: "符合人类先处理大面积图形（50ms 级）、再扫读短句、最后决策点击的认知节奏；顺带在按钮下方放一行极轻的信任背书（如「免费试用 · 无需绑卡」），帮读者跨过最后一厘米。",
    nodes: [
      { key: "H", title: "主视觉", x: 110, y: 112, r: 44, rank: "1" },
      { key: "M", title: "信息聚焦", x: 278, y: 112, r: 34, rank: "2" },
      { key: "A", title: "行动引导", x: 432, y: 112, r: 28, rank: "3" },
    ],
    path: "M 156 112 L 238 112 M 316 112 L 398 112",
  },
  {
    id: "mha",
    label: "① 大字标题 → ② 配图 → ③ 行动",
    badge: "编辑宣言型（条件成立）",
    status: "warn",
    summary: "当文字本身极具辨识度、做成超粗大标（如纯字型发布页或极简开发工具），大标自己就充当了「主视觉」。",
    why: "前提是标题极短（≤12 字）且字号反差极大；一旦标题变成两三行普通小字，这套顺序立刻退化成无人停留的文字墙。",
    nodes: [
      { key: "M", title: "巨幅字标", x: 112, y: 112, r: 42, rank: "1" },
      { key: "H", title: "辅助图示", x: 278, y: 112, r: 30, rank: "2" },
      { key: "A", title: "行动引导", x: 432, y: 112, r: 28, rank: "3" },
    ],
    path: "M 158 112 L 242 112 M 312 112 L 398 112",
  },
  {
    id: "ahm",
    label: "① 弹窗催行动 → ② 再讲产品",
    badge: "过早索取 · 反感跳出",
    status: "fail",
    summary: "用户还没看清你是谁、能帮什么忙，就被巨幅注册表单或弹窗按钮拦路，心理本能是先点右上角关闭。",
    why: "没有「看见」和「理解」铺垫的行动引导，不是降低决策成本，而是制造压迫感。转化链里「行动」必须排在「值不值得」之后。",
    nodes: [
      { key: "A", title: "强推注册", x: 110, y: 112, r: 42, rank: "1" },
      { key: "H", title: "被挡主图", x: 278, y: 112, r: 24, rank: "2" },
      { key: "M", title: "迟来解释", x: 432, y: 112, r: 22, rank: "3" },
    ],
    path: "M 156 112 C 195 60, 225 162, 248 112 M 306 112 C 345 162, 375 60, 404 112",
  },
  {
    id: "flat",
    label: "主视觉 = 标题 = 多按钮平权",
    badge: "无主次 · 视线打转",
    status: "fail",
    summary: "角标、弹窗、三段副标、五个彩色按钮同时喊「先看我」，眼球在屏幕里来回跳动却落不住脚。",
    why: "视觉层级靠的是差异而不是音量。所有元素一样大、一样艳时，主视觉失去了「一屏一个主角」的意义。",
    nodes: [
      { key: "H", title: "图", x: 120, y: 74, r: 28, rank: "?" },
      { key: "M", title: "文", x: 275, y: 148, r: 28, rank: "?" },
      { key: "A", title: "钮×4", x: 425, y: 78, r: 28, rank: "?" },
    ],
    path: "M 148 86 L 248 138 M 302 138 L 398 90 M 396 72 L 152 72",
  },
];

// ---------- 02 节：首屏注意力时间刻度 ----------
export const EVIDENCE_NODES = [
  {
    id: "50ms",
    time: "50 ms",
    title: "视觉定调：第一眼美丑已成型",
    source: "Gitte Lindgaard 等（2006），《Behaviour & Information Technology》25(2)",
    body: "卡尔顿大学实验让受试者分别只看网页 50 毫秒与 500 毫秒，两次对视觉吸引力的评分高度一致。你根本来不及靠长文案翻盘，第一瞬间的构图、色彩秩序和主视觉焦点就已经先下了第一道判决。",
    implication: "对应 H（主视觉）：别用廉价素材拼贴或花哨弹窗污染第一帧。",
  },
  {
    id: "2500ms",
    time: "≤ 2.5 s",
    title: "工程底线：主视觉即 LCP 最大绘制元素",
    source: "Google web.dev · Core Web Vitals（Largest Contentful Paint）",
    body: "绝大多数落地页里，首屏 Hero 大图或巨幅标题就是浏览器的最大内容绘制（LCP）节点。优良体验门槛是 75% 访问在 2.5 秒内绘出。如果误给 Hero 大图加了 loading=\"lazy\"，或者塞进 4 MB 未压缩原图，再好的版式也只会先给访客看两秒白屏。",
    implication: "工程铁律：Hero 主图绝不懒加载，用 preload + fetchpriority=\"high\" 并压缩为 WebP/AVIF。",
  },
  {
    id: "5s",
    time: "3–5 s",
    title: "高速路广告牌测试：扫一眼答出「这是什么」",
    source: "Steve Krug（2000），《Don't Make Me Think》；Nielsen & Tahir（2001），《Homepage Usability》",
    body: "Steve Krug 提出网页访客不是坐下来精读书籍，而是像开车掠过高速广告牌一样扫视。首屏必须用清晰的大标与层级，在几秒内直答两件事：你是谁？我在这里能干什么？",
    implication: "对应 M（信息聚焦）：把抽象口号换成「谁 + 解决什么痛点」的一句大白话。",
  },
  {
    id: "10s",
    time: "10 s · 57%",
    title: "去留分水岭与首屏注意力权重",
    source: "Jakob Nielsen（2011）与 Therese Fessenden（2018），Nielsen Norman Group",
    body: "Jakob Nielsen（2011）总结：如果首屏 10 秒内说不清价值，大部分人会立刻关页；过了这关，停留概率才会显著上升。Therese Fessenden（2018《Scrolling and Attention》）的眼动追踪则测得：用户虽比 2010 年（80%）更习惯滚动，但仍有约 57% 的浏览时间停留在折叠线之上、约 74% 落在前两屏内。",
    implication: "对应 A（行动引导）：首屏既要把主按钮放在折叠线上，也要微露下沿内容，邀请不急着下单的人继续往下读。",
  },
];

// ---------- 03 节：四种骨架与跨屏裁切 ----------
export const ARCHETYPE_CARDS = [
  {
    id: "split",
    name: "左文右图分栏",
    en: "ASYMMETRIC SPLIT",
    fit: "SaaS 产品、效率工具、教育课程",
    pros: "文字坐在干净纯底上，天然 10:1+ 对比度，完全不操心图片抢字；右侧可展示真实产品界面或数据卡片。",
    risk: "1280×720 矮屏上左侧文字一多就容易把按钮顶出折线；手机 390px 堆叠时要决定「图在上还是字在上」。",
  },
  {
    id: "fullbleed",
    name: "全出血暗罩剧场",
    en: "FULL-BLEED SCRIM",
    fit: "消费硬件、建筑文旅、品牌发布会、影视",
    pros: "第一眼情绪冲击最强，把整个视口变成一张宽银幕海报。",
    risk: "文字直接压在摄影亮部必糊，必须叠加定向渐变暗幕（Gradient Scrim）；切忌做成 100vh 密闭「假底部」。",
  },
  {
    id: "centered",
    name: "居中宣言 + 下方产品屏",
    en: "CENTERED STACK",
    fit: "开发者工具、开源项目、轻量 App",
    pros: "轴对称最稳，大标题 + 按钮居于黄金上部，下方半露出的真实软件界面既是主视觉又是天然滚动钩子。",
    risk: "标题超过两行或副标太宽，就会把下方产品图整块推到折叠线以下，首屏退化成纯文字页。",
  },
  {
    id: "diagonal",
    name: "斜切撞色海报型",
    en: "CONSTRUCTIVIST DIAGONAL",
    fit: "设计展览、创意活动、设计系统与专题页（即 289 原海报基因）",
    pros: "用几何斜线和强色块（如原海报的钴蓝斜楔 + 明黄聚光）强行切出动势与焦点，哪怕不靠摄影大片也能一秒抓眼。",
    risk: "色块边角一旦压进正文字区就会锯齿难读，必须像原海报一样用干净浅纸光束托住主标与按钮。",
  },
];

// ---------- 04 节：叠字对比实验室 ----------
export const SCRIM_METHODS = {
  none: { id: "none", label: "无遮罩直叠", desc: "浅字直接压在明黄光斑与亮部上，高光处对比崩盘。" },
  full: { id: "full", label: "全幅暗钴蒙层", desc: "整张图盖一层统一深钴半透明罩，文字稳但整张主视觉变暗。" },
  gradient: { id: "gradient", label: "左向渐变暗幕（推荐）", desc: "只在左侧文字区叠深钴渐变，右侧主视觉高光保持 100% 鲜亮。" },
  plate: { id: "plate", label: "独立实底色块", desc: "文字放进实心深钴/象牙色块，彻底隔离背景复杂度，海报感最强。" },
};

export function evaluateScrimLab(method, opacityPct) {
  const alpha = clamp(opacityPct / 100, 0, 0.88);
  const hotspot = hexToRgb(PALETTE.gold); // 背景最亮干扰区 #F9B81A
  const midtone = hexToRgb(PALETTE.cobalt);
  const scrimRgb = hexToRgb(PALETTE.cobaltDeep);
  const textRgb = hexToRgb(PALETTE.paperLight);

  let effectiveBg;
  let visualVividness;
  if (method === "none") {
    effectiveBg = hotspot;
    visualVividness = "原图 100% 透亮，但文字被高光吞没";
  } else if (method === "full") {
    effectiveBg = blendRgb(scrimRgb, hotspot, alpha);
    visualVividness = alpha > 0.6 ? "主图整体发闷、光彩被压暗" : "主图亮度适中";
  } else if (method === "gradient") {
    const textSideAlpha = clamp(alpha * 1.12, 0, 0.92);
    effectiveBg = blendRgb(scrimRgb, hotspot, textSideAlpha);
    visualVividness = "右侧主视觉仍保留约 90%+ 原色鲜度";
  } else {
    // plate：独立实底块
    effectiveBg = scrimRgb;
    visualVividness = "色块外主图 100% 原色，文字区对比恒定锁定";
  }

  const ratioHotspot = Number(contrastRatioRgb(textRgb, effectiveBg).toFixed(1));
  const ratioMid = Number(contrastRatioRgb(textRgb, method === "plate" ? scrimRgb : blendRgb(scrimRgb, midtone, method === "none" ? 0 : alpha)).toFixed(1));
  const level = ratioHotspot >= 7 ? "AAA 极佳" : ratioHotspot >= 4.5 ? "AA 达标" : ratioHotspot >= 3 ? "仅大字勉强" : "不达标 · 看不清";
  const ok = ratioHotspot >= 4.5;

  let cssCode;
  if (method === "none") {
    cssCode = `.hero::before { /* 危险：无遮罩，高光处对比仅 ${ratioHotspot}:1 */ }`;
  } else if (method === "full") {
    cssCode = `.hero::before {\n  background: rgba(8, 29, 102, ${alpha.toFixed(2)});\n}`;
  } else if (method === "gradient") {
    const leftA = clamp(alpha * 1.12, 0, 0.92).toFixed(2);
    const midA = (alpha * 0.45).toFixed(2);
    cssCode = `.hero::before {\n  background: linear-gradient(90deg,\n    rgba(8, 29, 102, ${leftA}) 0%,\n    rgba(8, 29, 102, ${midA}) 54%,\n    rgba(8, 29, 102, 0.04) 100%);\n}`;
  } else {
    cssCode = `.hero-copy-plate {\n  background: #081D66;\n  color: #FFFBF0; /* 对比恒定 ${ratioHotspot}:1 */\n}`;
  }

  return { alpha, ratioHotspot, ratioMid, level, ok, visualVividness, cssCode };
}

// ---------- 05 节：什么时候别用主视觉（场景分诊） ----------
export const ANTI_CASES = [
  {
    id: "workspace",
    title: "每天打开十次的工作台与后台",
    verdict: "别用巨幅 Hero",
    heroWaste: 68,
    betterShare: 12,
    why: "老用户登录邮件、监控大盘或设计工具，是为了立刻干活，不是每天再听一遍产品宣传语。在工作台顶部硬塞 500px 营销横幅，等于强迫用户每天多滚半屏。",
    altText: "直接进入任务核心区：",
    links: [
      { id: "273", name: "273 仪表盘布局" },
      { id: "283", name: "283 画布工作区布局" },
    ],
  },
  {
    id: "search",
    title: "带着关键词来找东西的检索与比价页",
    verdict: "压缩页头，搜索与列表置顶",
    heroWaste: 62,
    betterShare: 18,
    why: "查文档、挑机票、搜文献的访客已有明确意图。他们要的是输入框、筛选条和前 5 条结果，而不是占满首屏的氛围摄影大图。",
    altText: "把首屏让给检索与结果：",
    links: [
      { id: "286", name: "286 搜索结果布局" },
      { id: "274", name: "274 数据表格布局" },
      { id: "269", name: "269 信息流布局" },
    ],
  },
  {
    id: "carousel",
    title: "五个业务线都想上首屏的「轮播分赃墙」",
    verdict: "别把 Hero 做成自动轮播",
    heroWaste: 74,
    betterShare: 32,
    why: "Jakob Nielsen（2013）指出，自动轮播会让用户把首屏当成闪烁广告直接过滤，且第 2 帧之后几乎没人看。所有业务都占第一屏的结果，是谁都没被记住。",
    altText: "多主题展示改用明确结构：",
    links: [
      { id: "272", name: "272 便当盒布局" },
      { id: "276", name: "276 轮播布局" },
      { id: "275", name: "275 画廊布局" },
    ],
  },
  {
    id: "falsefloor",
    title: "强锁 100vh、不露下沿的「假底部」页面",
    verdict: "控高 76–88svh，微露下一节檐口",
    heroWaste: 100,
    betterShare: 82,
    why: "NN/g 多次在可用性测试中观察到「假底部（False Floor）」：当首屏严丝合缝卡死 100% 视口高度、底下既无延续内容也无提示，访客常误以为页面到此为止。",
    altText: "多内容浏览可平滑衔接：",
    links: [
      { id: "270", name: "270 卡片网格布局" },
      { id: "288", name: "288 媒体对象布局" },
    ],
  },
];

// ---------- 06 节：小练习（严格中性标签，四项只差一个变量） ----------
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: true,
    headline: "团队字体库一键同步到全员设计稿",
    sub: "支持 Figma 与网页端实时生效，零缺字报错。",
    ctas: ["免费建库"],
    secondary: "查看兼容列表",
    visualPct: 54,
    ctaBelowFold: false,
    feedback: "答对了。方案 A 同时守住了 H / M / A 三条底线：右侧 54% 主视觉稳稳锚住第一眼；左侧 14 字价值主张直接讲清「解决什么问题」；唯一高对比主按钮留在首屏折叠线上方，底沿微露次节标题，既不缺入口也不制造假底部。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: false,
    headline: "团队字体库一键同步到全员设计稿",
    sub: "支持 Figma 与网页端实时生效，零缺字报错。",
    ctas: ["免费建库"],
    secondary: "查看兼容列表",
    visualPct: 78,
    ctaBelowFold: true,
    feedback: "差在「行动按钮掉出首屏」。方案 B 的标题和单按钮都没问题，但主视觉撑得太高，把主按钮刚好顶到首屏折叠线以下 24px——访客扫完首屏却找不到下一步入口。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    headline: "团队字体库一键同步到全员设计稿",
    sub: "支持 Figma 与网页端实时生效，零缺字报错。",
    ctas: ["免费建库", "预约演示", "查看定价", "下载手册"],
    secondary: "",
    visualPct: 54,
    ctaBelowFold: false,
    feedback: "差在「行动引导分散」。方案 C 的视觉比例和价值主张都清楚，但把唯一主按钮拆成了四个同等分量的并排按钮，立刻抬高了首屏决策成本，违背「一步到位」。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    headline: "以系统化数字美学赋能未来创意无限生态可能",
    sub: "立足前沿体验思维，协同多维场景持续释放组织表达势能与品牌长期价值。",
    ctas: ["免费建库"],
    secondary: "查看兼容列表",
    visualPct: 54,
    ctaBelowFold: false,
    feedback: "差在「信息没有聚焦」。方案 D 的构图和按钮都很克制，但标题和副标塞满抽象大词，新访客扫完 3 秒依然答不出「这到底是一款字体同步工具」。",
  },
];
