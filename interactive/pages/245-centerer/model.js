// 245 居中器 CENTERER · 单真源几何与诊断模型
// 画布绘制、顶栏自示范标尺、三栏状态卡、实算 CSS 与白话诊单全部从此模块读取同一组计算结果。

export const VIEWPORT_MIN_W = 320;
export const VIEWPORT_MAX_W = 1320;
export const VIEWPORT_MIN_H = 210;
export const VIEWPORT_MAX_H = 440;

export const DESKTOP_REF_W = 1280;
export const MOBILE_REF_W = 360;
export const SHORT_REF_H = 268;
export const FIXED_MARGIN_EACH = 220; // 写死左右边距的典型反例

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报靶盒",
    en: "POSTER",
    contentH: 300,
    caption: "1:1 承袭 245 原海报深松绿方框、柔粉圆心与四向白刻线。",
  },
  article: {
    id: "article",
    label: "长文专栏",
    en: "ARTICLE",
    contentH: 318,
    caption: "真实中文段落随当前行宽折行，一眼看清行长与左缘锯齿。",
  },
  dialog: {
    id: "dialog",
    label: "居中弹窗",
    en: "DIALOG",
    contentH: 316,
    caption: "矮窗压顶时直观对比 unsafe center 吞顶与 safe center 保顶。",
  },
};

export const INITIAL_STATE = {
  viewportW: 1140,
  viewportH: 268,
  maxInline: 0, // 0 表示 none（未设最大宽）
  gutter: 0, // padding-inline (px)
  xMode: "auto-text-center", // auto-left | auto-text-center | fixed-margin
  yMode: "unsafe-center", // unsafe-center | safe-center | optical-lift
  boxSizing: "content-box", // content-box | border-box
  scene: "poster",
};

export const PRESETS = {
  reading: {
    label: "标准阅读解",
    note: "608px（38ic）· 24px 护边 · 左对齐正文 · safe center",
    patch: {
      maxInline: 608,
      gutter: 24,
      xMode: "auto-left",
      yMode: "safe-center",
      boxSizing: "content-box",
    },
  },
  compact: {
    label: "紧凑卡片解",
    note: "464px（29ic）· 16px 护边 · 光学微抬 46%",
    patch: {
      maxInline: 464,
      gutter: 16,
      xMode: "auto-left",
      yMode: "optical-lift",
      boxSizing: "content-box",
    },
  },
  wide: {
    label: "宽版图文解",
    note: "720px（45ic）· 32px 护边 · safe center",
    patch: {
      maxInline: 720,
      gutter: 32,
      xMode: "auto-left",
      yMode: "safe-center",
      boxSizing: "content-box",
    },
  },
  pitfallFixed: {
    label: "试错：定边距",
    note: "写死 margin: 0 220px，窄屏立刻挤爆",
    patch: {
      viewportW: 390,
      maxInline: 608,
      gutter: 16,
      xMode: "fixed-margin",
      yMode: "safe-center",
    },
  },
  pitfallUnsafe: {
    label: "试错：矮窗吞顶",
    note: "裸 align-items: center 在矮窗把顶边推入负坐标",
    patch: {
      viewportW: 860,
      viewportH: 226,
      scene: "dialog",
      maxInline: 560,
      gutter: 24,
      xMode: "auto-left",
      yMode: "unsafe-center",
    },
  },
  reset: {
    label: "复原 0/4 错态",
    note: "回到初始四处问题并存状态",
    patch: { ...INITIAL_STATE },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function solveHorizontal(vpW, state) {
  const g = state.gutter;
  if (state.xMode === "fixed-margin") {
    const minNeeded = FIXED_MARGIN_EACH * 2 + 240;
    const outerRaw = vpW - FIXED_MARGIN_EACH * 2;
    const overflowPx = Math.max(0, minNeeded - vpW);
    const outerW = Math.max(120, outerRaw);
    const contentW = Math.max(40, outerW - g * 2);
    return {
      outerW,
      contentW,
      marginEach: FIXED_MARGIN_EACH,
      overflowPx,
      gutterEach: g,
    };
  }

  let outerW;
  if (state.maxInline <= 0) {
    outerW = vpW;
  } else if (state.boxSizing === "content-box") {
    outerW = Math.min(vpW, state.maxInline + g * 2);
  } else {
    outerW = Math.min(vpW, state.maxInline);
  }
  const contentW = Math.max(40, outerW - g * 2);
  const marginEach = Math.max(0, (vpW - outerW) / 2);
  return {
    outerW,
    contentW,
    marginEach,
    overflowPx: 0,
    gutterEach: g,
  };
}

export function viewportTag(w) {
  if (w < 480) return "手机窄屏";
  if (w < 900) return "平板中屏";
  return "桌面宽屏";
}

export function evaluate(rawState) {
  const state = {
    ...INITIAL_STATE,
    ...rawState,
    viewportW: Math.round(clamp(rawState.viewportW ?? INITIAL_STATE.viewportW, VIEWPORT_MIN_W, VIEWPORT_MAX_W)),
    viewportH: Math.round(clamp(rawState.viewportH ?? INITIAL_STATE.viewportH, VIEWPORT_MIN_H, VIEWPORT_MAX_H)),
    maxInline: rawState.maxInline > 0 ? Math.round(clamp(rawState.maxInline, 220, 1040)) : 0,
    gutter: Math.round(clamp(rawState.gutter ?? INITIAL_STATE.gutter, 0, 64)),
  };

  const sceneInfo = SCENES[state.scene] || SCENES.poster;
  const contentH = sceneInfo.contentH;

  // 当前视口实算几何
  const cur = solveHorizontal(state.viewportW, state);
  // 1280px 宽屏体检与 360px 窄屏体检（避免只在某一个视口宽度下“碰巧没露馅”）
  const desk = solveHorizontal(DESKTOP_REF_W, state);
  const mob = solveHorizontal(MOBILE_REF_W, state);

  const icCur = Math.round(cur.contentW / 16);
  const icDesk = Math.round(desk.contentW / 16);
  const chDesk = Math.round(desk.contentW / 8.8);

  // 纵轴计算
  const freeH = state.viewportH - contentH;
  let boxTop;
  let verticalClipTop = 0;
  let opticalShiftPct = 0;
  if (state.yMode === "unsafe-center") {
    boxTop = freeH / 2;
    verticalClipTop = Math.max(0, Math.round(-boxTop));
  } else if (state.yMode === "optical-lift") {
    if (freeH > 24) {
      boxTop = freeH * 0.43;
      opticalShiftPct = -3.5;
    } else {
      boxTop = 10;
    }
  } else {
    // safe-center
    boxTop = freeH >= 20 ? freeH / 2 : 10;
  }

  // 矮屏 268px 压力体检
  const stressClipTop = state.yMode === "unsafe-center" ? Math.max(0, Math.round((contentH - SHORT_REF_H) / 2)) : 0;

  // 四条核心规则（单真源判定）
  const fixedCrash = state.xMode === "fixed-margin";
  const measureOk = !fixedCrash && state.maxInline > 0 && desk.contentW >= 320 && desk.contentW <= 760;
  const gutterOk = !fixedCrash && state.gutter >= 12 && state.gutter <= 48 && mob.contentW >= 240;
  const verticalOk = state.yMode === "safe-center" || state.yMode === "optical-lift";
  const textAlignOk = state.xMode === "auto-left";

  const checks = [
    { key: "measure", label: "行宽上限", ok: measureOk },
    { key: "gutter", label: "窄屏护边", ok: gutterOk },
    { key: "vertical", label: "安全纵轴", ok: verticalOk },
    { key: "text", label: "块文分离", ok: textAlignOk },
  ];
  const passedCount = checks.filter((c) => c.ok).length;

  // 优先诊断最致命的错态
  const faults = [];
  if (fixedCrash) {
    faults.push({
      id: "fixed_margin",
      badge: "错态 · 定边距挤爆",
      title: `左右写死 ${FIXED_MARGIN_EACH}px 边距，360px 窄屏直接挤爆`,
      body: `宽屏下看起来居中，可一旦把视口拖窄到手机尺寸，固定外边距会吞掉整条屏幕宽度，只剩负空间或横向溢出 ${mob.overflowPx}px。居中器必须把余白交给 auto 自动分配。`,
      next: "把水平策略改回「块居中 · 文左齐」（margin-inline: auto），再横拖视口边墙检验窄屏。",
    });
  }
  if (!fixedCrash && state.maxInline === 0) {
    faults.push({
      id: "no_max",
      badge: "错态 · 满屏拉丝",
      title: `未设最大宽，1280px 宽屏被拉到 ${desk.contentW}px（约 ${icDesk} 汉字/行）`,
      body: `没有 max-inline-size 封顶时，元素占满 100% 视口，左右 X 轴自动余白归零。中文单行超过 45 字后，眼球从行尾跳回下一行开头极易串行。`,
      next: "拉动下方「最大行宽」滑块到 460–720px（约 29–45ic），或直接点击画布上的红标修复。",
    });
  } else if (!fixedCrash && desk.contentW > 760) {
    faults.push({
      id: "too_wide",
      badge: "错态 · 行宽过散",
      title: `宽屏芯宽达 ${desk.contentW}px（约 ${icDesk} 汉字），视线跨度偏长`,
      body: `行宽超过经验舒适带（中文约 20–45 字，英文 45–75 字符）后，版心横向松散，左右 X 轴引导焦点的聚拢力变弱。`,
      next: "把「最大行宽」收进 320–760px 之间，观察左右 auto 余白把焦点重新托住。",
    });
  } else if (!fixedCrash && desk.contentW < 320) {
    faults.push({
      id: "too_narrow",
      badge: "错态 · 狭缝碎行",
      title: `最大宽只剩 ${desk.contentW}px（约 ${icDesk} 字），句子被迫频繁断行`,
      body: `行宽收得过窄时，每行只能塞十几个字，读者眼球几乎不停折返换行，节奏变得细碎焦躁。`,
      next: "把「最大行宽」适当放宽到 360px 以上（经验常用 460–680px）。",
    });
  }

  if (!fixedCrash && state.gutter < 12) {
    faults.push({
      id: "gutter_zero",
      badge: "错态 · 窄屏贴壁",
      title: `内护边仅 ${state.gutter}px，一到手机窄屏文字就紧贴屏幕硬边`,
      body: `宽屏靠两侧 auto 余白看似有呼吸，可只要你把画布边墙向左拖到 480px 以下，auto 归零，内容立刻零缝顶死视口边框。`,
      next: "把「内护边 padding-inline」调到 16–32px，再把画布视口拖窄到 360px 验看。",
    });
  } else if (!fixedCrash && (state.gutter > 48 || mob.contentW < 240)) {
    faults.push({
      id: "gutter_huge",
      badge: "错态 · 护边吞芯",
      title: `双侧护边合计 ${state.gutter * 2}px，360px 手机芯宽被挤到 ${mob.contentW}px`,
      body: `内护边是为了防贴壁，不是为了在手机上造宽边。小屏单侧超过 48px 会吃掉将近三分之一屏幕。`,
      next: "把「内护边」收回 16–36px 区间，让 360px 手机保有至少 240px 以上可读芯宽。",
    });
  }

  if (!verticalOk) {
    const showClip = verticalClipTop > 0 ? verticalClipTop : stressClipTop;
    faults.push({
      id: "unsafe_y",
      badge: "错态 · 矮屏吞顶",
      title:
        verticalClipTop > 0
          ? `unsafe center 把顶边推入负坐标 -${verticalClipTop}px，向上永远滚不回去`
          : `垂直用了裸 center，矮窗（268px）下顶边会被裁掉 ${showClip}px`,
      body: `裸写 align-items: center 或 translateY(-50%) 会把溢出平分到上下两端；超出顶部负坐标的内容属于 W3C 所称的数据丢失，用户怎么拖滚动条都看不到标题和关闭钮。`,
      next: "把「纵轴策略」切到「安全居中 safe center」或「光学微抬」，立刻保住顶边可滚。",
    });
  }

  if (!fixedCrash && !textAlignOk) {
    faults.push({
      id: "ragged_text",
      badge: "错态 · 长文锯齿",
      title: `正文误开 text-align: center，每行左起点来回漂移`,
      body: `居中器要居中的是「整个版心盒子」，不是把多行正文每行都居中。超过三行的居中段落会让左侧失去整齐的锚线，眼睛每次换行都要重新寻找起点。`,
      next: "把「水平与对齐」切到「块居中 · 文左齐」，守住笔直的左缘阅读轨。",
    });
  }

  let diagnosis;
  if (faults.length === 0) {
    const modeNote =
      state.yMode === "optical-lift"
        ? "纵轴开启光学微抬（约 46% 视觉重心），并保留矮屏自动回退顶边保护。"
        : "纵轴采用 safe center，宽裕时稳居正中、矮屏时自动靠顶不吞字。";
    const boxNote =
      state.boxSizing === "content-box"
        ? `采用 content-box：${state.gutter}px 护边长在行宽外，保证正文芯宽足额 ${desk.contentW}px。`
        : `采用 border-box：${state.gutter * 2}px 护边从总宽里扣除，实际芯宽为 ${desk.contentW}px。`;
    diagnosis = {
      ok: true,
      badge: `已校准 · ${passedCount}/4 全部过关`,
      title: `宽屏稳居焦点（约 ${icDesk} 字/行），360px 手机留足 ${state.gutter}px 护边`,
      body: `当前在 ${state.viewportW}px 视口中，左右 auto 余白各 ${Math.round(cur.marginEach)}px，实绘芯宽 ${Math.round(cur.contentW)}px。${boxNote}${modeNote}`,
      next: "试试左右横拖画布边墙从 1320px 挤到 320px，或切到「长文专栏 / 居中弹窗」验收这套规则在任意屏幕下的表现。",
    };
  } else {
    const first = faults[0];
    diagnosis = {
      ok: false,
      badge: `${first.badge} (${passedCount}/4)`,
      title: first.title,
      body: first.body,
      next: first.next,
    };
  }

  // 生成与画面严格一致的 CSS
  const maxStr = state.maxInline > 0 ? `${state.maxInline}px /* ≈ ${Math.round(state.maxInline / 16)}ic */` : "none /* 提示：未封顶 */";
  const marginLine =
    state.xMode === "fixed-margin"
      ? `  margin-inline: ${FIXED_MARGIN_EACH}px; /* 提示：窄屏挤爆 */`
      : `  margin-inline: auto;`;
  const textLine =
    state.xMode === "auto-text-center"
      ? `  text-align: center; /* 提示：正文锯齿 */`
      : `  text-align: start; /* 块居中、文左齐 */`;
  const yLine =
    state.yMode === "unsafe-center"
      ? `  align-content: center; /* 提示：矮屏吞顶 */`
      : state.yMode === "optical-lift"
        ? `  align-content: safe center; /* + 光学微抬 */`
        : `  align-content: safe center;`;

  const css = [
    `.centerer {`,
    `  box-sizing: ${state.boxSizing};`,
    `  max-inline-size: ${maxStr};`,
    marginLine,
    `  padding-inline: ${state.gutter}px;`,
    textLine,
    yLine,
    `}`,
  ].join("\n");

  // 原海报底带三支柱的实时状态（水平居中 ALIGN / 垂直居中 CENTER / 对齐焦点 FOCUS）
  const triadStatus = {
    align: {
      ok: measureOk && gutterOk,
      tag: fixedCrash
        ? "定边距挤爆"
        : !measureOk
          ? state.maxInline === 0
            ? "满屏无上限"
            : desk.contentW > 760
              ? `过宽 ${icDesk}ic`
              : `过窄 ${icDesk}ic`
          : !gutterOk
            ? state.gutter < 12
              ? "贴壁 0 护边"
              : "护边过大"
            : `${Math.round(cur.contentW)}px · 护边 ${state.gutter}px`,
    },
    center: {
      ok: verticalOk,
      tag: verticalOk
        ? state.yMode === "optical-lift"
          ? "安全 · 光学微抬"
          : "安全 safe center"
        : verticalClipTop > 0
          ? `吞顶 -${verticalClipTop}px`
          : `矮屏隐患 -${stressClipTop}px`,
    },
    focus: {
      ok: textAlignOk && measureOk,
      tag: !textAlignOk
        ? "正文锯齿"
        : !measureOk
          ? "焦点发散"
          : `${viewportTag(state.viewportW)} · ${icCur}字/行`,
    },
  };

  return {
    state,
    sceneInfo,
    contentH,
    cur,
    desk,
    mob,
    icCur,
    icDesk,
    chDesk,
    boxTop,
    verticalClipTop,
    stressClipTop,
    opticalShiftPct,
    checks,
    passedCount,
    faults,
    diagnosis,
    css,
    triadStatus,
  };
}
