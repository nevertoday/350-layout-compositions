// 253 悬浮层 · 单真源几何、光影与层级诊断模型
// 开场 3D 透视画布、左下轴测图、三点实时探针、诊单与实时 CSS 全部只读这里算出的同一组数据。

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报三层",
    en: "POSTER TRIAD",
    focusTitle: "重要信息",
    focusSub: "在悬浮层中突出",
    focusEn: "FOCUS CONTENT",
    secTitle: "辅助信息",
    secSub: "次要内容置于次层",
    secEn: "SECONDARY CONTENT",
    bgTag: "BACKGROUND · Z0",
  },
  modal: {
    id: "modal",
    label: "确认弹窗 Modal",
    en: "MODAL DIALOG",
    focusTitle: "发布版本 v2.4？",
    focusSub: "上线后将即时替换线上文档",
    focusEn: "CONFIRM ACTION",
    secTitle: "版本变更清单",
    secSub: "含 3 项布局原语与阴影校准",
    secEn: "SIDE INSPECTOR",
    bgTag: "WORKSPACE · DOCS",
  },
  popover: {
    id: "popover",
    label: "商品浮卡 Popover",
    en: "ANCHORED POPOVER",
    focusTitle: "雾紫陶瓷杯 · ¥168",
    focusSub: "手工哑光釉 · 现货 48 小时发",
    focusEn: "QUICK PREVIEW",
    secTitle: "筛选与排序",
    secSub: "按器型 · 釉色 · 库存筛选",
    secEn: "FILTER SHELF",
    bgTag: "CATALOG · GRID",
  },
};

export const LAYERS_META = {
  bg: { id: "bg", name: "背景层", en: "BACKGROUND LAYER", dot: "#B2A4CD", fill: "#5D4774" },
  secondary: { id: "secondary", name: "次级层", en: "SECONDARY LAYER", dot: "#A8C8BB", fill: "#A8C8BB" },
  focus: { id: "focus", name: "悬浮层", en: "FLOATING LAYER", dot: "#EC72A2", fill: "#ECE6E0" },
};

// 开场刻意停在「层级倒挂 + 0dp 贴地 + 0% 无遮罩」的复合坏态
export function initialState() {
  return {
    scene: "poster",
    order: ["bg", "focus", "secondary"], // 底 -> 顶：焦点层被压在次级层下面
    elevation: 0,      // 焦点层海拔 (0..36 dp)
    secElevation: 0,   // 次级层海拔 (0..24 dp)
    scrim: 0,          // 背景遮罩压暗 (0..92 %)
    peel: 18,          // Z 轴剖视角度 (0..52 °)，默认接近原海报微侧透视
    focusShift: 0,     // 焦点层左右偏移 (-0.52..+0.44)，可试错脱节或吞没
    selected: "focus",
  };
}

export const PRESETS = {
  broken: {
    label: "复原错态",
    state: { order: ["bg", "focus", "secondary"], elevation: 0, secElevation: 0, scrim: 0, peel: 18, focusShift: 0 },
  },
  posterTriad: {
    label: "原海报三阶",
    state: { order: ["bg", "secondary", "focus"], elevation: 18, secElevation: 6, scrim: 28, peel: 20, focusShift: 0 },
  },
  modalFocus: {
    label: "模态弹窗解",
    state: { order: ["bg", "secondary", "focus"], elevation: 22, secElevation: 4, scrim: 52, peel: 10, focusShift: 0.06 },
  },
  lightPopover: {
    label: "轻浮卡解",
    state: { order: ["bg", "secondary", "focus"], elevation: 12, secElevation: 2, scrim: 8, peel: 16, focusShift: -0.04 },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 归一化的三张卡片逻辑坐标（宽高均在 [-1, 1] x [-0.74, 0.74] 空间）
export function computeRects(state) {
  const shift = clamp(state.focusShift || 0, -0.52, 0.44);
  if (state.scene === "modal") {
    return {
      bg: { x: -0.66, y: -0.54, w: 1.32, h: 1.08, r: 0.045 },
      secondary: { x: 0.06, y: -0.34, w: 0.56, h: 0.86, r: 0.04 },
      focus: { x: -0.34 + shift, y: -0.34, w: 0.68, h: 0.66, r: 0.048 },
    };
  }
  if (state.scene === "popover") {
    return {
      bg: { x: -0.66, y: -0.52, w: 1.32, h: 1.06, r: 0.045 },
      secondary: { x: -0.58, y: 0.16, w: 1.16, h: 0.34, r: 0.035 },
      focus: { x: -0.28 + shift, y: -0.38, w: 0.64, h: 0.66, r: 0.048 },
    };
  }
  // 原海报 253 精确比例关系
  return {
    bg: { x: -0.08, y: -0.56, w: 0.76, h: 1.04, r: 0.048 },
    secondary: { x: -0.06, y: -0.02, w: 0.60, h: 0.64, r: 0.044 },
    focus: { x: -0.46 + shift, y: -0.40, w: 0.68, h: 0.78, r: 0.048 },
  };
}

function rectArea(a) {
  return Math.max(0, a.w) * Math.max(0, a.h);
}

function intersectArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
}

// 两个矩形并集与目标矩形的交集面积（精确容斥）
function unionIntersectArea(target, a, b) {
  const ia = intersectArea(target, a);
  const ib = intersectArea(target, b);
  const x0 = Math.max(target.x, a.x, b.x);
  const y0 = Math.max(target.y, a.y, b.y);
  const x1 = Math.min(target.x + target.w, a.x + a.w, b.x + b.w);
  const y1 = Math.min(target.y + target.h, a.y + a.h, b.y + b.h);
  const iab = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  return ia + ib - iab;
}

// 由海拔 dp 派生真实物理三层投影（参考 Material Design 本影 / 半影 / 环境光结构）
export function shadowTokens(dp) {
  const d = clamp(dp, 0, 36);
  if (d < 0.5) {
    return {
      umbra: "none",
      css: "none",
      layers: [],
    };
  }
  const uY = +(d * 0.46).toFixed(1);
  const uB = +(d * 0.62).toFixed(1);
  const uS = +(-d * 0.22).toFixed(1);
  const pY = +(d * 0.92).toFixed(1);
  const pB = +(d * 1.48).toFixed(1);
  const aY = +(d * 0.36).toFixed(1);
  const aB = +(d * 1.85).toFixed(1);
  const muddy = d > 28 ? 1 + (d - 28) * 0.04 : 1;
  const css = [
    `0 ${uY}px ${uB}px ${uS}px rgba(14, 8, 24, ${(0.34 * muddy).toFixed(2)})`,
    `0 ${pY}px ${pB}px 1px rgba(14, 8, 24, ${(0.24 * muddy).toFixed(2)})`,
    `0 ${aY}px ${aB}px 3px rgba(14, 8, 24, ${(0.16 * muddy).toFixed(2)})`,
  ].join(",\n    ");
  return {
    css,
    layers: [
      { ox: d * 0.12, oy: d * 0.36, pad: d * 0.05, alpha: 0.30 * muddy },
      { ox: d * 0.24, oy: d * 0.68, pad: d * 0.22, alpha: 0.19 * muddy },
      { ox: d * 0.36, oy: d * 1.02, pad: d * 0.44, alpha: 0.12 * muddy },
      { ox: d * 0.46, oy: d * 1.32, pad: d * 0.72, alpha: 0.07 * muddy },
    ],
  };
}

// 计算相对亮度 (WCAG 2.1)
function relLum(r, g, b) {
  const f = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(rgbA, rgbB) {
  const l1 = relLum(...rgbA);
  const l2 = relLum(...rgbB);
  return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(1);
}

// 焦点暖瓷白 (#ECE6E0) 与经遮罩压暗后的背景层 (#5D4774 混入 #120B1E) 的真实明度对比
export function effectiveContrast(scrimPct) {
  const a = clamp(scrimPct, 0, 95) / 100;
  const bg = [
    Math.round(93 * (1 - a) + 18 * a),
    Math.round(71 * (1 - a) + 11 * a),
    Math.round(116 * (1 - a) + 30 * a),
  ];
  return contrastRatio([236, 230, 224], bg);
}

// 单真源诊断：结合真实叠序、几何遮挡、海拔与遮罩参数给出完整研判
export function analyze(state) {
  const rects = computeRects(state);
  const zBg = state.order.indexOf("bg");
  const zSec = state.order.indexOf("secondary");
  const zFocus = state.order.indexOf("focus");

  const focusArea = rectArea(rects.focus);
  const secArea = rectArea(rects.secondary);

  // 计算压在焦点层之上的所有层对焦点层的遮挡面积
  const aboveFocus = state.order.slice(zFocus + 1);
  let occludedArea = 0;
  if (aboveFocus.length === 1) {
    occludedArea = intersectArea(rects.focus, rects[aboveFocus[0]]);
  } else if (aboveFocus.length === 2) {
    occludedArea = unionIntersectArea(rects.focus, rects[aboveFocus[0]], rects[aboveFocus[1]]);
  }
  const occludedPct = Math.round((occludedArea / focusArea) * 100);

  // 焦点层与底层（背景+次级）的重叠度
  const overlapLower = unionIntersectArea(rects.focus, rects.bg, rects.secondary);
  const overlapPct = Math.round((overlapLower / focusArea) * 100);

  // 次级层被焦点层遮挡的比例（焦点在上时）
  const secHiddenPct = zFocus > zSec ? Math.round((intersectArea(rects.secondary, rects.focus) / secArea) * 100) : 0;

  // 有效上下文留存率（背景可见度随遮罩衰减）
  const contextPct = Math.round(clamp(100 - state.scrim * 0.92 - secHiddenPct * 0.25, 0, 100));
  const lumContrast = effectiveContrast(state.scrim);
  const elevGap = state.elevation - state.secElevation;

  // 各维度实时真值判定
  const faults = [];
  if (zFocus < zSec || zFocus < zBg) {
    faults.push({
      id: "inverted",
      badge: `倒挂 · 遮 ${occludedPct}%`,
      title: `焦点层被压在下层，关键内容已被遮挡 ${occludedPct}%`,
      why: `当前叠序把「${LAYERS_META[state.order[2]].name}」摆在最顶层，暖白焦点卡落到第 ${zFocus + 1} 层。眼睛一进画面先撞上次要信息，正文被上层卡片直接腰斩——这就是网页里最典型的 z-index 层级倒挂。`,
      hint: "点击画布里的暖白焦点卡，或点下方「焦点置顶」，先把焦点层升到最高 Z 轴。",
      fixLabel: "把焦点层提至最顶",
      fixAction: "promoteFocus",
    });
  }
  if (zFocus === 2 && state.secElevation >= 14 && elevGap <= 6) {
    faults.push({
      id: "competing",
      badge: "双浮层争焦",
      title: `次级层海拔 ${state.secElevation}dp，与焦点层 ${state.elevation}dp 同台抢眼`,
      why: `两张卡片几乎漂在同一高度（高差仅 ${Math.max(0, elevGap)}dp），阴影浓淡相近，读者会同时看到两个「最高优先级」信号——就像弹窗背后又飘着一块高海拔抽屉，注意力被一分为二。`,
      hint: "把次级层海拔降回 6dp 以下，让焦点层独享高位。",
      fixLabel: "压稳次级层至 6dp",
      fixAction: "calmSecondary",
    });
  }
  if (zFocus === 2 && state.elevation < 6 && state.scrim < 18) {
    faults.push({
      id: "flat",
      badge: `${state.elevation}dp 贴地`,
      title: `海拔只有 ${state.elevation}dp 且无背景退让，卡片贴在同一个平面`,
      why: "虽然叠序对了，但缺少投影落差和遮罩缓冲时，人眼会把三块图形当成贴在同一张纸上的拼贴色块，分不清哪一层是「可关掉的临时浮层」、哪一层是「底层画布」。",
      hint: "把「焦点海拔」拉到 10–24dp（或在模态场景增加 25%–55% 遮罩），让阴影真正托起卡片。",
      fixLabel: "抬升至 18dp 经典海拔",
      fixAction: "liftFocus",
    });
  }
  if (state.elevation > 28) {
    faults.push({
      id: "muddy",
      badge: `${state.elevation}dp 脏影`,
      title: `海拔拉到 ${state.elevation}dp，投影散成脏雾、卡片飘离载体`,
      why: "Material Design 规范把常规静止组件上限锚定在 24dp 左右。海拔继续硬推后，阴影扩散半径过宽、边缘糊成大片灰黑雾气，反倒弄脏背景并让浮层显得像断线风筝。",
      hint: "把焦点海拔收回到 12–24dp 区间，让本影紧贴底部、半影柔和过渡。",
      fixLabel: "收回至 18dp 清晰投影",
      fixAction: "liftFocus",
    });
  }
  if (state.scrim > 76) {
    faults.push({
      id: "blackout",
      badge: `遮罩 ${state.scrim}% 黑死`,
      title: `背景遮罩高达 ${state.scrim}%，底层承托已经完全黑死`,
      why: "悬浮层和跳转新页面的核心区别，在于保留「我仍留在原页面」的上下文安全感。遮罩超过 76% 后，底层的背景卡与次级层几乎不可辨认，「背景承托」彻底失效。",
      hint: "把遮罩降回 20%–60% 区间（轻浮卡甚至可为 0%–15%），让背景退后一步而不是消失。",
      fixLabel: "放轻遮罩至 32%",
      fixAction: "easeScrim",
    });
  }
  if (overlapPct < 8) {
    faults.push({
      id: "detached",
      badge: `重叠仅 ${overlapPct}%`,
      title: `焦点卡与底层几乎脱离（重叠 ${overlapPct}%），已退化成平排分栏`,
      why: "悬浮层靠的是「跨过底层边界、在 Z 轴覆盖其上」来暗示临时性与更高权重。一旦完全挪开零重叠，它就不再是悬浮层，而是普通的并列卡片布局。",
      hint: "把「水平错位」拨回居中区间，让焦点层重新骑跨在背景与次级层上方。",
      fixLabel: "收回叠压区",
      fixAction: "centerFocus",
    });
  }
  if (zFocus > zSec && secHiddenPct > 84) {
    faults.push({
      id: "swallowed",
      badge: `次层被吞 ${secHiddenPct}%`,
      title: `次级层被完全压住 ${secHiddenPct}%，层级阶梯缩水成两层`,
      why: "如果悬浮层严丝合缝地把次级层全部盖住，画面里只剩「顶卡 + 远景底」，中间那级承上启下的过渡层次就看不见了。",
      hint: "稍微错开焦点层的水平位置，让次级层露出一角作为视觉阶梯。",
      fixLabel: "错开露出次级层",
      fixAction: "centerFocus",
    });
  }

  // 生成三要点实况探针状态
  const overlayOk = zFocus === 2 && overlapPct >= 8 && secHiddenPct <= 84;
  const emphasisOk = zFocus === 2 && state.elevation >= 6 && state.elevation <= 28 && !(state.secElevation >= 14 && elevGap <= 6);
  const supportOk = state.scrim <= 76 && (state.scrim >= 18 || (state.elevation >= 8 && lumContrast >= 5.5));

  const ok = faults.length === 0;
  let modeName = "多处待修";
  let title = "";
  let why = "";
  let hint = "";
  let fixLabel = "";
  let fixAction = "";

  if (!ok) {
    const primary = faults[0];
    modeName = faults.length > 1 ? `${faults.length} 处失衡 · ${primary.badge}` : primary.badge;
    title = primary.title;
    why = primary.why;
    hint = primary.hint;
    fixLabel = primary.fixLabel;
    fixAction = primary.fixAction;
  } else if (state.scrim >= 36 && state.elevation >= 16) {
    modeName = "模态强聚焦 · 成立";
    title = `高海拔 ${state.elevation}dp 配 ${state.scrim}% 遮罩，视线瞬间锁定确认动作`;
    why = `这是典型的模态悬浮解：暖白焦点层与压暗背景的亮度对比达 ${lumContrast}:1，本影与半影把卡片托离平面，同时保留约 ${contextPct}% 底层语境，用户做完决定就能安全回到原位。`;
    hint = "可拖动上方画布左右剥开 Z 轴（0°↔52°），观察三层真实的高程间距与投影偏移。";
  } else if (state.scrim <= 18 && state.elevation >= 8 && state.elevation <= 16) {
    modeName = "轻量浮卡 · 成立";
    title = `不锁背景：靠 ${state.elevation}dp 清晰投影与 ${lumContrast}:1 明度差自然浮起`;
    why = "非模态的 Popover 或快捷预览卡不需要厚重遮罩。只要焦点表面足够明快、投影干净利落、且与次级层保持阶差，用户既能看清浮卡，又随时能点回背后页面继续工作。";
    hint = "试试把「次层海拔」切到争焦 20dp，感受两张浮卡同时飘高时的视线打架。";
  } else {
    modeName = "三阶纵深 · 成立";
    title = `三层秩序分明：背景 0dp → 次级 ${state.secElevation}dp → 悬浮 ${state.elevation}dp`;
    why = `焦点层以 ${overlapPct}% 面积稳稳骑跨在次级层与背景层之上，亮度对比 ${lumContrast}:1、背景遮罩 ${state.scrim}%，原海报「层级叠加、悬浮焦点、背景承托」三条法则同时闭环。`;
    hint = "左右横拖画布把视角拉到 45° 以上，可以直接剖开检查三层的 Z 轴空气层。";
  }

  // 真实可复制 CSS（由当前实测海拔与叠序直接生成）
  const zVals = {
    bg: (zBg + 1) * 10,
    secondary: (zSec + 1) * 10,
    focus: (zFocus + 1) * 10,
  };
  const sh = shadowTokens(state.elevation);
  const cssCode = `/* 由当前实验台实时生成 · 海拔 ${state.elevation}dp / 遮罩 ${state.scrim}% */
.layer-bg        { z-index: ${zVals.bg}; }
.layer-secondary { z-index: ${zVals.secondary}; /* ${state.secElevation}dp */ }
.layer-focus {
  position: relative;
  z-index: ${zVals.focus};
  box-shadow:
    ${sh.css};
}
.layer-scrim {
  background: rgba(18, 11, 30, ${(state.scrim / 100).toFixed(2)});
}`;

  return {
    ok,
    faults,
    faultCount: faults.length,
    modeName,
    title,
    why,
    hint,
    fixLabel,
    fixAction,
    rects,
    zIndexOrder: { bg: zBg, secondary: zSec, focus: zFocus },
    occludedPct,
    overlapPct,
    secHiddenPct,
    contextPct,
    lumContrast,
    elevGap,
    shadow: sh,
    cssCode,
    probes: {
      overlay: {
        ok: overlayOk,
        text: zFocus < 2 ? `倒挂 · 遮 ${occludedPct}%` : overlapPct < 8 ? `脱节 ${overlapPct}%` : secHiddenPct > 84 ? `吞没 ${secHiddenPct}%` : `叠压 ${overlapPct}%`,
      },
      emphasis: {
        ok: emphasisOk,
        text: zFocus < 2 ? "被压失焦" : state.elevation > 28 ? `${state.elevation}dp 脏影` : state.secElevation >= 14 && elevGap <= 6 ? "双层争焦" : `${state.elevation}dp · ${lumContrast}:1`,
      },
      support: {
        ok: supportOk,
        text: state.scrim > 76 ? `黑死 ${state.scrim}%` : state.scrim === 0 && state.elevation < 6 ? "无退让" : `遮罩 ${state.scrim}% · 留 ${contextPct}%`,
      },
    },
  };
}
