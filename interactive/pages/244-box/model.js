// 244 盒子 BOX — 单真源几何与诊断模型
// 画布绘制、算式读数、实时 CSS、四栏支柱灯与白话诊单全部从 evaluateBox() 派生

export const SLOT_W = 320;
export const LIMITS = {
  width: { min: 160, max: 360, step: 2 },
  padding: { min: 0, max: 56, step: 2 },
  border: { min: 0, max: 16, step: 1 },
  margin: { min: -16, max: 44, step: 2 },
};

// 经验参考带（所有文案中明确标注「经验参考」）
export const BANDS = {
  paddingMin: 12,
  paddingMax: 36,
  borderMax: 6,
  marginMin: 0,
  marginMax: 16,
  contentMin: 150,
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报盒",
    baseContentH: 132,
    title: "内容",
    sub: "CONTENT",
  },
  notice: {
    id: "notice",
    label: "提示卡片",
    baseContentH: 122,
    title: "导出已完成",
    sub: "文件已写入本地，随时可双击离线打开。",
  },
  button: {
    id: "button",
    label: "主要按钮",
    baseContentH: 64,
    title: "保存盒模型设置",
    sub: "APPLY BOX",
  },
};

export const LAYERS = [
  { id: "margin", zh: "外边距", en: "MARGIN", posterDesc: "边框与外部元素之间的空白区域" },
  { id: "border", zh: "边框", en: "BORDER", posterDesc: "包围内容和内边距的线条" },
  { id: "padding", zh: "内边距", en: "PADDING", posterDesc: "内容与边框之间的空白区域" },
  { id: "content", zh: "内容区", en: "CONTENT", posterDesc: "实际内容显示的区域" },
];

export function initialState() {
  return {
    width: 300,
    padding: 4,
    border: 10,
    margin: 26,
    boxSizing: "content-box",
    transparentOutline: false,
    theme: "poster",
    viewMode: "flat", // "flat" | "exploded"
    highContrast: false,
    activeLayer: "content",
  };
}

export const PRESETS = {
  broken: {
    label: "复原 0/4 错态",
    patch: {
      width: 300,
      padding: 4,
      border: 10,
      margin: 26,
      boxSizing: "content-box",
      transparentOutline: false,
      highContrast: false,
    },
  },
  poster: {
    label: "原海报平衡解",
    patch: {
      width: 288,
      padding: 24,
      border: 4,
      margin: 12,
      boxSizing: "border-box",
      transparentOutline: false,
      highContrast: false,
    },
  },
  everylayout: {
    label: "无框护边解",
    patch: {
      width: 320,
      padding: 22,
      border: 0,
      margin: 0,
      boxSizing: "border-box",
      transparentOutline: true,
    },
  },
  compact: {
    label: "紧凑卡片解",
    patch: {
      width: 300,
      padding: 16,
      border: 2,
      margin: 8,
      boxSizing: "border-box",
      transparentOutline: false,
      highContrast: false,
    },
  },
  trapHc: {
    label: "试错：高对比失踪",
    patch: {
      width: 300,
      padding: 22,
      border: 0,
      margin: 0,
      boxSizing: "border-box",
      transparentOutline: false,
      highContrast: true,
    },
  },
  trapNeg: {
    label: "试错：负边距咬框",
    patch: {
      width: 320,
      padding: 18,
      border: 3,
      margin: -14,
      boxSizing: "border-box",
      transparentOutline: false,
      highContrast: false,
    },
  },
};

export function clampParam(key, val) {
  const lim = LIMITS[key];
  if (!lim) return val;
  const n = Math.round(Number(val));
  if (!Number.isFinite(n)) return lim.min;
  return Math.max(lim.min, Math.min(lim.max, n));
}

export function normalizeState(raw) {
  return {
    ...raw,
    width: clampParam("width", raw.width),
    padding: clampParam("padding", raw.padding),
    border: clampParam("border", raw.border),
    margin: clampParam("margin", raw.margin),
    boxSizing: raw.boxSizing === "border-box" ? "border-box" : "content-box",
    transparentOutline: Boolean(raw.transparentOutline),
    theme: THEMES[raw.theme] ? raw.theme : "poster",
    viewMode: raw.viewMode === "exploded" ? "exploded" : "flat",
    highContrast: Boolean(raw.highContrast),
    activeLayer: LAYERS.some((l) => l.id === raw.activeLayer) ? raw.activeLayer : "content",
  };
}

export function evaluateBox(rawState) {
  const s = normalizeState(rawState);
  const theme = THEMES[s.theme];

  // 严格按 W3C CSS Box Model 计算水平几何
  let contentW;
  let paddingBoxW;
  let borderBoxW;
  if (s.boxSizing === "content-box") {
    contentW = s.width;
    paddingBoxW = contentW + 2 * s.padding;
    borderBoxW = paddingBoxW + 2 * s.border;
  } else {
    // border-box：padding 和 border 向内吸收，内容宽最低缩到 0（不出现负宽）
    contentW = Math.max(0, s.width - 2 * s.padding - 2 * s.border);
    paddingBoxW = contentW + 2 * s.padding;
    borderBoxW = paddingBoxW + 2 * s.border;
  }
  const outerW = borderBoxW + 2 * s.margin;

  // 高度随题材与内容区窄化微幅增高（模拟文字被挤窄后折行变高）
  const wrapExtraH =
    s.theme === "notice" && contentW < 180
      ? Math.round((180 - contentW) * 0.45)
      : s.theme === "button" && contentW < 150
        ? Math.round((150 - contentW) * 0.35)
        : 0;
  const contentH = theme.baseContentH + wrapExtraH;
  const paddingBoxH = contentH + 2 * s.padding;
  const borderBoxH = paddingBoxH + 2 * s.border;
  const outerH = Math.max(borderBoxH, borderBoxH + 2 * s.margin);

  const borderOverflow = Math.max(0, borderBoxW - SLOT_W);
  const totalOverflow = Math.max(0, outerW - SLOT_W);
  const sparePx = SLOT_W - outerW;
  const contentRatio = borderBoxW > 0 ? contentW / borderBoxW : 0;
  const padRatio = borderBoxW > 0 ? (2 * s.padding) / borderBoxW : 0;

  // 四个原海报支柱实况（单真源判定）
  const contentOverflow = totalOverflow > 0;
  const contentCrushed = contentW < BANDS.contentMin;
  const contentOk = !contentOverflow && !contentCrushed;
  const contentTag = contentOverflow
    ? `爆槽 +${totalOverflow}px`
    : contentCrushed
      ? `压扁 ${contentW}px`
      : `合槽 ${contentW}px`;

  const padTight = s.padding < BANDS.paddingMin;
  const padBloated = s.padding > BANDS.paddingMax || padRatio > 0.44;
  const paddingOk = !padTight && !padBloated;
  const paddingTag = padTight
    ? `贴边 ${s.padding}px`
    : padBloated
      ? `虚胖 ${s.padding}px`
      : `舒适 ${s.padding}px`;

  const borderHeavy = s.border > BANDS.borderMax;
  const borderHcLost = s.border === 0 && !s.transparentOutline;
  const borderOk = !borderHeavy && !borderHcLost;
  const borderTag = borderHeavy
    ? `粗框 ${s.border}px`
    : borderHcLost
      ? "高对比失踪"
      : s.border === 0
        ? "透明护边"
        : `清晰 ${s.border}px`;

  const marginNeg = s.margin < 0;
  const marginTooWide = s.margin > BANDS.marginMax;
  const marginPushesOut = s.margin > 0 && borderBoxW <= SLOT_W && outerW > SLOT_W;
  const marginOk = !marginNeg && !marginTooWide && !marginPushesOut;
  const marginTag = marginNeg
    ? `负值 ${s.margin}px`
    : marginTooWide
      ? `越界 ${s.margin}px`
      : marginPushesOut
        ? `顶出 +${totalOverflow}px`
        : s.margin === 0
          ? "零外边距"
          : `克制 ${s.margin}px`;

  const pillars = {
    content: {
      id: "content",
      zh: "内容区",
      en: "CONTENT",
      ok: contentOk,
      tag: contentTag,
      valueText: `${contentW}px`,
    },
    padding: {
      id: "padding",
      zh: "内边距",
      en: "PADDING",
      ok: paddingOk,
      tag: paddingTag,
      valueText: `${s.padding}px`,
    },
    border: {
      id: "border",
      zh: "边框",
      en: "BORDER",
      ok: borderOk,
      tag: borderTag,
      valueText: s.border === 0 && s.transparentOutline ? "0 + 护边" : `${s.border}px`,
    },
    margin: {
      id: "margin",
      zh: "外边距",
      en: "MARGIN",
      ok: marginOk,
      tag: marginTag,
      valueText: `${s.margin}px`,
    },
  };

  const passCount = Object.values(pillars).filter((p) => p.ok).length;

  // 白话诊单（按最严重的结构问题排序，永远说明「为什么」与「试着改一步」）
  let diagnosis;
  if (marginNeg) {
    diagnosis = {
      code: "negative-margin",
      severity: "error",
      badge: `错态 · 负边距咬框 (${passCount}/4)`,
      headline: `外边距跌成 ${s.margin}px，盒子往外反咬邻居的地盘`,
      body: `外边距写成负值时，边框被强行拉出自身槽位，和相邻元素发生重叠或裁切。除非是刻意做的视觉叠层，否则常规布局盒子应把外边距保持在 0 或温和正值。`,
      hint: `向右拖回外边距（或点击「零外边距」），把 margin 调回 0px–16px。`,
    };
  } else if (s.boxSizing === "content-box" && totalOverflow > 0) {
    diagnosis = {
      code: "content-box-overflow",
      severity: "error",
      badge: `错态 · 算宽撑爆 (${passCount}/4)`,
      headline: `content-box 把宽撑到 ${outerW}px，冲破 320px 父槽 +${totalOverflow}px`,
      body: `声明 width: ${s.width}px 只算了深翠青内容区；内边距（2×${s.padding}px）、边框（2×${s.border}px）和外边距（2×${s.margin}px）全往外加，总占宽比你以为的多出 ${outerW - s.width}px，放进栏位立刻溢出或折行。`,
      hint: `先把「算宽模式」切到 border-box，或者直接向左拖画布上的深翠青内容核收窄声明宽度。`,
    };
  } else if (totalOverflow > 0) {
    diagnosis = {
      code: "slot-overflow",
      severity: "error",
      badge: `错态 · 外廓超槽 (${passCount}/4)`,
      headline: `总占宽 ${outerW}px 超出 320px 父槽 +${totalOverflow}px`,
      body: `虽然已是 border-box，但边界盒宽 ${borderBoxW}px 加上左右外边距 ${2 * s.margin}px 仍大于父容器提供的 320px 空间。盒子不该替父级背着过宽的外边距，把外间距交给外部布局原语更稳。`,
      hint: `把外边距缩到 0px–12px，或把声明宽度收进 ${Math.max(160, SLOT_W - 2 * Math.max(0, s.margin))}px 以内。`,
    };
  } else if (contentCrushed) {
    diagnosis = {
      code: "content-crushed",
      severity: "error",
      badge: `错态 · 内容压扁 (${passCount}/4)`,
      headline: `padding 与 border 吃掉 ${borderBoxW - contentW}px，内容只剩 ${contentW}px`,
      body: `在 border-box 下，内边距和边框向内生长。当两侧加起来吞掉大半宽度时，深翠青内容区被夹成一根细窄竖条，正文频繁折行、按钮文案挤成两排。`,
      hint: `把内边距收进 12px–32px，或适当拉宽声明宽度，让内容区至少留出 150px 以上。`,
    };
  } else if (padTight) {
    diagnosis = {
      code: "padding-tight",
      severity: "error",
      badge: `错态 · 内边距窒息 (${passCount}/4)`,
      headline: `内边距只有 ${s.padding}px，内容死死贴在黑框内壁上`,
      body: `内边距是内容和边界之间的缓冲气囊。少于约 12px（经验参考）时，文字和图形的边缘会和边框视觉粘连，读者一眼觉得局促拥挤，按钮也更难精准点击。`,
      hint: `在画布上拖开暖奶油内边距带（或拉动「内边距」滑杆），推到 12px–32px。`,
    };
  } else if (padBloated) {
    diagnosis = {
      code: "padding-bloated",
      severity: "error",
      badge: `错态 · 内边距虚胖 (${passCount}/4)`,
      headline: `内边距推到 ${s.padding}px，空白占去盒宽 ${Math.round(padRatio * 100)}%`,
      body: `留白不是越多越好。当四壁内边距占掉将近一半宽度时，内容像掉进过大的包装箱里，信息密度骤降，在 390px 手机屏上尤其浪费横向空间。`,
      hint: `把内边距收回到 12px–36px 经验参考带，让内容重新成为主角。`,
    };
  } else if (borderHcLost) {
    diagnosis = {
      code: "hc-invisible",
      severity: "error",
      badge: `错态 · 高对比失踪 (${passCount}/4)`,
      headline: `边框为 0px 且缺透明护边，高对比模式下盒子边界彻底消失`,
      body: `平时靠底色色块也能看清卡片边界，但 Windows 高对比 / forced-colors 模式会把背景色一律剥平。如果没有实线边框，又没写 outline: 2px solid transparent，盒子就会化为一团散文字。`,
      hint: `给盒子留 1px–4px 实线边框，或打开「透明 outline 护边」（Every Layout 经典解法），再点「高对比 X 光」验真。`,
    };
  } else if (borderHeavy) {
    diagnosis = {
      code: "border-heavy",
      severity: "error",
      badge: `错态 · 粗框压主 (${passCount}/4)`,
      headline: `边框厚达 ${s.border}px，粗黑外框抢走了内容的视线`,
      body: `边框的作用是划界，不是盖过内容。超过约 6px 的实心黑框会让容器显得笨重压抑，而且在两侧白白占用 ${2 * s.border}px 空间。`,
      hint: `把边框减薄到 1px–6px，或者设为 0px 并配合透明 outline 护边。`,
    };
  } else if (marginTooWide) {
    diagnosis = {
      code: "margin-leak",
      severity: "error",
      badge: `错态 · 外边距越权 (${passCount}/4)`,
      headline: `盒子自身背着 ${s.margin}px 外边距，换个父槽就容易顶偏`,
      body: `可复用的盒子组件应专注管好「边界以里」的留白与背景；把过大的外边距写死在盒子自己身上，会和父容器的 gap 或相邻块外边距打架。`,
      hint: `把外边距收进 0px–16px（推荐 0px，把块间距离交给 243 堆栈或父级 gap）。`,
    };
  } else {
    // 4/4 全过：区分多种正当解
    let styleName = "原海报平衡解";
    let body = `边界盒占宽 ${borderBoxW}px、总占宽 ${outerW}px 稳落在 320px 槽内，${s.padding}px 内边距给内容留足呼吸，${s.border}px 边框清晰不抢戏，四层比例各司其职。`;
    if (s.border === 0 && s.transparentOutline) {
      styleName = "Every Layout 无框护边解";
      body = `总宽 ${outerW}px 贴合父槽且零外边距越权；平时以纯色面区分区域，同时凭借 outline: 2px solid transparent 在系统高对比模式下自动现出完整边界。`;
    } else if (s.boxSizing === "content-box") {
      styleName = "content-box 精算达标解";
      body = `哪怕留在默认 content-box，只要你提前把内容宽收在 ${contentW}px、算准加上内边距与边框后总宽 ${outerW}px ≤ 320px，一样能严谨落槽——只是换用 border-box 会省去每次重算。`;
    } else if (s.margin === 0) {
      styleName = "零外边距满槽原语解";
      body = `盒子自身不带任何外边距（margin: 0），完全服从父容器槽宽（${outerW}px / 320px），放进堆栈、簇群或网格都不会撑歪对齐线。`;
    }
    diagnosis = {
      code: "valid",
      severity: "ok",
      badge: `达标 · ${styleName} (4/4)`,
      headline: `四层职责分明：总宽 ${outerW}px 稳落 320px 父槽，内容宽 ${contentW}px`,
      body,
      hint: `试试切到「立体剥层」看四层嵌套深度，或打开「高对比 X 光」验证无底色时的边界表现。`,
    };
  }

  // 实时算式与真实 CSS（同一组数据直接拼出）
  const formulaLine =
    s.boxSizing === "content-box"
      ? `宽 ${contentW} + 内 2×${s.padding} + 框 2×${s.border} + 外 2×${s.margin} = ${outerW}px`
      : `盒 ${borderBoxW}（含内 2×${s.padding} 框 2×${s.border} → 内容 ${contentW}）+ 外 2×${s.margin} = ${outerW}px`;

  const cssLines = [
    `.box {`,
    `  box-sizing: ${s.boxSizing};`,
    `  width: ${s.width}px;`,
    `  padding: ${s.padding}px;`,
    s.border > 0
      ? `  border: ${s.border}px solid #080A09;`
      : `  border: 0;`,
  ];
  if (s.transparentOutline) {
    cssLines.push(`  outline: 2px solid transparent;`);
    cssLines.push(`  outline-offset: -2px; /* 高对比护边 */`);
  }
  cssLines.push(`  margin: ${s.margin}px;`);
  cssLines.push(`} /* 实占 ${outerW}px / 父槽 ${SLOT_W}px */`);

  return {
    state: s,
    slotW: SLOT_W,
    contentW,
    paddingBoxW,
    borderBoxW,
    outerW,
    contentH,
    paddingBoxH,
    borderBoxH,
    outerH,
    borderOverflow,
    totalOverflow,
    sparePx,
    contentRatio,
    padRatio,
    pillars,
    passCount,
    diagnosis,
    formulaLine,
    cssText: cssLines.join("\n"),
  };
}
