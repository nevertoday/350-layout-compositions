// 294 微调模式 · 单真源几何状态与偏差核算模型
// 所有画布绘制、8× 放大镜像素覆盖率、左脊三圆徽检定与白话诊断均由此文件同一份状态算出。

export const MODES = {
  poster: {
    id: "poster",
    label: "原海报标本",
    en: "POSTER SPECIMEN",
    caption: "01 基线「设计改变认知」 · 02 三形间距 · 04 描边居中",
    baselineLabel: "基线 BASELINE",
    items: [
      { id: "g0", label: "设", kind: "glyph", dy: -1.5, dx: 0.0, note: "首字「设」上浮" },
      { id: "g1", label: "计", kind: "glyph", dy: 0.0, dx: 0.0, note: "「计」字" },
      { id: "g2", label: "改", kind: "glyph", dy: 1.0, dx: 0.0, note: "「改」字下沉" },
      { id: "g3", label: "变", kind: "glyph", dy: 0.0, dx: 0.0, note: "「变」字" },
      { id: "g4", label: "认", kind: "glyph", dy: 0.0, dx: 0.0, note: "「认」字" },
      { id: "g5", label: "知", kind: "glyph", dy: 0.0, dx: 0.3, note: "末字「知」亚像素偏移" },
    ],
    blocks: [
      { id: "b0", shape: "square", label: "方模块" },
      { id: "b1", shape: "circle", label: "圆模块" },
      { id: "b2", shape: "bar", label: "条模块" },
    ],
    initGaps: [13, 23],
    initStrokeOffset: 2,
    initFocus: "g0",
    defaultIdealGap: 20,
  },
  nav: {
    id: "nav",
    label: "导航栏组件",
    en: "UI NAVBAR",
    caption: "真实网页顶栏：标识与菜单基线 · 项间 4px 节拍 · 按钮描边",
    baselineLabel: "导航文字基线",
    items: [
      { id: "g0", label: "标", kind: "badge", dy: -2.0, dx: 0.0, note: "品牌徽标偏高" },
      { id: "g1", label: "总览", kind: "nav", dy: 0.0, dx: 0.0, note: "导航「总览」" },
      { id: "g2", label: "文档", kind: "nav", dy: 1.5, dx: 0.0, note: "导航「文档」下沉" },
      { id: "g3", label: "定价", kind: "nav", dy: 0.0, dx: 0.0, note: "导航「定价」" },
      { id: "g4", label: "更新", kind: "nav", dy: -1.0, dx: 0.0, note: "导航「更新」偏高" },
      { id: "g5", label: "开始", kind: "cta", dy: 0.0, dx: 0.4, note: "主按钮亚像素发虚" },
    ],
    blocks: [
      { id: "b0", shape: "pill", label: "标签 A" },
      { id: "b1", shape: "pill", label: "标签 B" },
      { id: "b2", shape: "pill", label: "主操作" },
    ],
    initGaps: [11, 22],
    initStrokeOffset: -2,
    initFocus: "g0",
    defaultIdealGap: 16,
  },
  tweaks: {
    id: "tweaks",
    label: "跨屏微调",
    en: "TINY TWEAKS",
    caption: "Luke Wroblewski 2012 同源：单栏骨架不动，仅微调字距、留白与对齐",
    baselineLabel: "单栏正文 4px 基线",
    items: [
      { id: "g0", label: "栏", kind: "eyebrow", dy: -1.5, dx: 0.0, note: "眉标基线偏高" },
      { id: "g1", label: "单", kind: "glyph", dy: 0.0, dx: 0.0, note: "主标「单」" },
      { id: "g2", label: "栏", kind: "glyph", dy: 1.0, dx: 0.0, note: "主标「栏」下沉" },
      { id: "g3", label: "微", kind: "glyph", dy: 0.0, dx: 0.0, note: "主标「微」" },
      { id: "g4", label: "调", kind: "glyph", dy: 0.0, dx: 0.0, note: "主标「调」" },
      { id: "g5", label: "页", kind: "glyph", dy: 0.0, dx: 0.3, note: "末字边缘 0.3px 发虚" },
    ],
    blocks: [
      { id: "b0", shape: "card", label: "窄屏 375" },
      { id: "b1", shape: "card", label: "中屏 768" },
      { id: "b2", shape: "card", label: "宽屏 1280" },
    ],
    initGaps: [14, 26],
    initStrokeOffset: 2,
    initFocus: "g0",
    defaultIdealGap: 24,
  },
};

export const STEP_OPTIONS = [
  { id: 0.1, label: "0.1px 亚像素" },
  { id: 1, label: "1px 方向键" },
  { id: 4, label: "4px 模数" },
];

export const MODULUS_MARKS = [4, 8, 12, 16, 20, 24, 28, 32];

export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原错态",
    kind: "reset",
    apply(state) {
      const m = MODES[state.mode];
      state.items = m.items.map((it) => ({ ...it }));
      state.gaps = [...m.initGaps];
      state.strokeOffset = m.initStrokeOffset;
      state.focus = m.initFocus;
      state.step = 1;
    },
  },
  compact: {
    id: "compact",
    label: "紧凑 12px 解",
    kind: "good",
    apply(state) {
      state.items.forEach((it) => { it.dy = 0; it.dx = 0; });
      state.gaps = [12, 12];
      state.strokeOffset = 0;
    },
  },
  poster20: {
    id: "poster20",
    label: "原海报 20px 解",
    kind: "good",
    apply(state) {
      state.items.forEach((it) => { it.dy = 0; it.dx = 0; });
      state.gaps = [20, 20];
      state.strokeOffset = 0;
    },
  },
  airy28: {
    id: "airy28",
    label: "宽舒 28px 解",
    kind: "good",
    apply(state) {
      state.items.forEach((it) => { it.dy = 0; it.dx = 0; });
      state.gaps = [28, 28];
      state.strokeOffset = 0;
    },
  },
  trapSubpixel: {
    id: "trapSubpixel",
    label: "试错：0.3px 模糊",
    kind: "bad",
    apply(state) {
      state.items.forEach((it) => { it.dy = 0; it.dx = 0; });
      state.items[state.items.length - 1].dx = 0.3;
      state.gaps = [20, 20];
      state.strokeOffset = 0;
      state.focus = state.items[state.items.length - 1].id;
      state.step = 0.1;
    },
  },
  trapLoose: {
    id: "trapLoose",
    label: "试错：过散 40px",
    kind: "bad",
    apply(state) {
      state.items.forEach((it) => { it.dy = 0; it.dx = 0; });
      state.gaps = [40, 40];
      state.strokeOffset = 0;
      state.focus = "gap1";
    },
  },
};

export function createState(mode = "poster") {
  const m = MODES[mode] || MODES.poster;
  return {
    mode: m.id,
    items: m.items.map((it) => ({ ...it })),
    gaps: [...m.initGaps], // [gap1, gap2] in px (4..44)
    strokeOffset: m.initStrokeOffset, // -3..+3 px
    focus: m.initFocus, // "g0".."g5" | "gap1" | "gap2" | "stroke"
    step: 1, // 0.1 | 1 | 4
    showGrid: true,
    linkGaps: false,
    lastNudgeDir: "",
    lastNudgeTime: 0,
  };
}

export function switchMode(state, modeId) {
  const next = createState(modeId);
  Object.assign(state, next);
}

const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isGlyphId = (id) => /^g\d+$/.test(id);

export function fracPart(v) {
  const f = Math.abs(v - Math.round(v));
  return r1(f);
}

export function isMult4(v) {
  return fracPart(v) <= 0.05 && Math.round(v) % 4 === 0;
}

export function formatSigned(v, unit = "px") {
  const n = r1(v);
  if (Math.abs(n) < 0.05) return `0${unit}`;
  const s = Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(1);
  return `${n > 0 ? "+" : "-"}${s}${unit}`;
}

export function formatNum(v) {
  const n = r1(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// 统一微调操作：支持方向键 / 3×3 Nudge 按钮 / 画布拖拽
// 注意：遵循原海报 03 模块直觉——上移(dirY = -1 屏幕向上)减小视觉 y 偏移；若需要归零传 center
export function nudge(state, dxSign, dySign, customStep) {
  const step = customStep ?? state.step;
  const f = state.focus;

  if (isGlyphId(f)) {
    const item = state.items.find((it) => it.id === f);
    if (!item) return;
    if (dxSign !== 0) {
      let nx = r1(item.dx + dxSign * step);
      if (step >= 1 && Math.abs(nx - Math.round(nx)) > 0.01 && Math.abs(item.dx) < 1) {
        // 用 1px 步进把 0.3px 往回推时允许贴回整数 0
        nx = Math.round(nx);
      }
      item.dx = clamp(nx, -4, 4);
    }
    if (dySign !== 0) {
      // dy < 0 means visually higher (+pt above baseline like poster); dy > 0 means lower
      let ny = r1(item.dy + dySign * step);
      if (Math.abs(ny) < 0.15) ny = 0;
      item.dy = clamp(ny, -4, 4);
    }
    return;
  }

  if (f === "gap1" || f === "gap2") {
    const idx = f === "gap1" ? 0 : 1;
    const delta = (dxSign !== 0 ? dxSign : -dySign) * step;
    if (delta !== 0) {
      const nv = clamp(r1(state.gaps[idx] + delta), 4, 44);
      state.gaps[idx] = nv;
      if (state.linkGaps) state.gaps[1 - idx] = nv;
    }
    return;
  }

  if (f === "stroke") {
    const delta = (dxSign !== 0 ? dxSign : dySign) * step;
    if (delta !== 0) {
      let nv = r1(state.strokeOffset + delta);
      if (Math.abs(nv) < 0.15) nv = 0;
      state.strokeOffset = clamp(nv, -3, 3);
    }
  }
}

// 中央蓝格「中心 0px, 0px」：把当前选中项归零对齐到最近合法值
export function centerActive(state) {
  const f = state.focus;
  if (isGlyphId(f)) {
    const item = state.items.find((it) => it.id === f);
    if (item) {
      item.dy = 0;
      item.dx = 0;
    }
    return;
  }
  if (f === "gap1" || f === "gap2") {
    const ideal = MODES[state.mode].defaultIdealGap;
    const avg = (state.gaps[0] + state.gaps[1]) / 2;
    const snapped = clamp(Math.round(avg / 4) * 4, 12, 28) || ideal;
    state.gaps = [snapped, snapped];
    return;
  }
  if (f === "stroke") {
    state.strokeOffset = 0;
  }
}

export function setGapBoth(state, val) {
  const v = clamp(r1(val), 4, 44);
  state.gaps = [v, v];
}

// 辅助函数：把单个检定维度的错误一键校准（不自动全修，只修当前最紧迫的一项）
export function fixCurrentIssue(state) {
  const ev = evaluate(state);
  if (ev.primaryKind === "align") {
    state.items.forEach((it) => { it.dy = 0; });
    state.focus = ev.firstOffAlignId || "g0";
  } else if (ev.primaryKind === "spacing") {
    const ideal = MODES[state.mode].defaultIdealGap;
    state.gaps = [ideal, ideal];
    state.focus = "gap1";
  } else if (ev.primaryKind === "subpixel") {
    state.items.forEach((it) => {
      it.dx = Math.round(it.dx);
      it.dy = Math.round(it.dy);
    });
    state.gaps = state.gaps.map((g) => Math.round(g));
    state.strokeOffset = Math.round(state.strokeOffset);
    state.focus = ev.firstSubpixelId || "g5";
  } else if (ev.primaryKind === "stroke") {
    state.strokeOffset = 0;
    state.focus = "stroke";
  }
}

// 获取当前焦点元件的亚像素量与标签，直接喂给 8× 放大镜
export function getLoupeData(state) {
  const f = state.focus;
  if (isGlyphId(f)) {
    const item = state.items.find((it) => it.id === f) || state.items[0];
    const fx = fracPart(item.dx);
    const fy = fracPart(item.dy);
    const worst = fx >= fy ? fx : fy;
    return {
      targetLabel: `字形「${item.label}」`,
      dx: item.dx,
      dy: item.dy,
      subpixel: worst,
      axis: fx >= fy ? "x" : "y",
      isSharp: worst <= 0.05,
      metricText: `X ${formatSigned(item.dx)} · Y ${formatSigned(-item.dy, "pt")}`,
    };
  }
  if (f === "gap1" || f === "gap2") {
    const idx = f === "gap1" ? 0 : 1;
    const g = state.gaps[idx];
    const fg = fracPart(g);
    return {
      targetLabel: idx === 0 ? "左间距卡尺" : "右间距卡尺",
      dx: g,
      dy: 0,
      subpixel: fg,
      axis: "x",
      isSharp: fg <= 0.05,
      metricText: `间距 ${formatNum(g)}px${isMult4(g) ? " (4n)" : " (非4n)"}`,
    };
  }
  const so = state.strokeOffset;
  const fso = fracPart(so);
  return {
    targetLabel: "描边居中环",
    dx: so,
    dy: 0,
    subpixel: fso,
    axis: "x",
    isSharp: Math.abs(so) <= 0.25 && fso <= 0.05,
    metricText: `偏心 ${formatSigned(so)}`,
  };
}

// 单真源全面检定：直接从 items / gaps / strokeOffset 算全部 3 根支柱与双向失误
export function evaluate(state) {
  // 1. 对齐 (ALIGN): 基线偏差
  const offAlignItems = state.items.filter((it) => Math.abs(it.dy) > 0.25);
  const maxBaselineErr = state.items.reduce((m, it) => Math.max(m, Math.abs(it.dy)), 0);
  const alignOk = offAlignItems.length === 0;

  // 2. 间距 (SPACING): 4px 模数、等距、双向边界 (<8 过挤, >32 过散)
  const [g1, g2] = state.gaps;
  const gapDiff = r1(Math.abs(g1 - g2));
  const minGap = Math.min(g1, g2);
  const maxGap = Math.max(g1, g2);
  const both4n = isMult4(g1) && isMult4(g2);

  let spacingIssue = "ok";
  let spacingShort = `${formatNum(g1)}px · 4n`;
  let spacingTier = "";
  if (minGap < 8) {
    spacingIssue = "cramped";
    spacingShort = `过挤 ${formatNum(minGap)}px`;
  } else if (maxGap > 32) {
    spacingIssue = "scattered";
    spacingShort = `过散 ${formatNum(maxGap)}px`;
  } else if (gapDiff > 0.5) {
    spacingIssue = "uneven";
    spacingShort = `不等 ${formatNum(g1)}/${formatNum(g2)}px`;
  } else if (!both4n) {
    spacingIssue = "off4n";
    spacingShort = `非4n · ${formatNum(g1)}px`;
  } else {
    if (g1 <= 12) spacingTier = "紧凑节拍解";
    else if (g1 <= 20) spacingTier = "标准平衡解";
    else spacingTier = "宽舒呼吸解";
    spacingShort = `${formatNum(g1)}px · ${spacingTier.slice(0, 2)}`;
  }
  const spacingOk = spacingIssue === "ok";

  // 3. 校正 (TUNE): 亚像素落整 + 描边居中
  const subpixelItems = state.items.filter((it) => fracPart(it.dx) > 0.05 || fracPart(it.dy) > 0.05);
  const gapSubpixel = fracPart(g1) > 0.05 || fracPart(g2) > 0.05;
  const maxSubpixel = Math.max(
    ...state.items.map((it) => Math.max(fracPart(it.dx), fracPart(it.dy))),
    fracPart(g1),
    fracPart(g2),
    fracPart(state.strokeOffset)
  );
  const strokeErr = r1(Math.abs(state.strokeOffset));
  const strokeOk = strokeErr <= 0.25;
  const subpixelOk = subpixelItems.length === 0 && !gapSubpixel && fracPart(state.strokeOffset) <= 0.05;
  const tuneOk = subpixelOk && strokeOk;

  let tuneShort = "0px 锐利居中";
  if (!subpixelOk && !strokeOk) tuneShort = `${formatNum(maxSubpixel)}px 虚 · 偏心`;
  else if (!subpixelOk) tuneShort = `${formatNum(maxSubpixel)}px 发虚`;
  else if (!strokeOk) tuneShort = `描边偏 ${formatSigned(state.strokeOffset)}`;

  let alignShort = "0pt 基线齐平";
  if (!alignOk) {
    const worst = offAlignItems.reduce((a, b) => (Math.abs(b.dy) > Math.abs(a.dy) ? b : a));
    alignShort = `「${worst.label}」${formatSigned(-worst.dy, "pt")}`;
  }

  // 合成白话工程研判（按视觉破坏优先级给出首要诊断）
  const issues = [];
  if (!alignOk) {
    const names = offAlignItems.map((it) => `「${it.label}」(${formatSigned(-it.dy, "pt")})`).join("、");
    issues.push({
      kind: "align",
      badge: "基线参差",
      headline: `${names} 脱离基线，视线横扫时上下颠簸`,
      why: "人眼横扫文字时靠底部隐形基线保持匀速；哪怕只有 1–1.5pt 的上下跳动，读者也会在潜意识里觉得整行字没排稳，像临时拼出来的草稿。",
      hint: `点选画布上的 ${names}，按「↓ / ↑」方向键或中央蓝色「中心 0px」键把它们落回 0pt 基线。`,
      fixLabel: "一键对齐全部基线",
      focusTarget: offAlignItems[0].id,
    });
  }
  if (!spacingOk) {
    if (spacingIssue === "cramped") {
      issues.push({
        kind: "spacing",
        badge: "间距过挤",
        headline: `模块间距压到 ${formatNum(minGap)}px，相邻边界黏成一团`,
        why: "低于 8px 时，三个独立元素会因为格式塔接近性融成一块杂乱色块，不仅层级消失，在手机触屏上也容易误点。",
        hint: "把间距向右拖到 12px–28px 内的 4px 倍数（如 16px 或 20px），给每个元素留出喘气缝。",
        fixLabel: `校准至 ${MODES[state.mode].defaultIdealGap}px`,
        focusTarget: "gap1",
      });
    } else if (spacingIssue === "scattered") {
      issues.push({
        kind: "spacing",
        badge: "间距过散",
        headline: `模块间距拉到 ${formatNum(maxGap)}px，同一组元素散架了`,
        why: "微调不是缝越大越高级。间距超过 32px 后，同组块面之间的联系断裂，看起来像彼此无关的孤岛。",
        hint: "把间距收回到 12px–28px 区间内的 4px 模数，让三个元素重新收拢成一组。",
        fixLabel: `收回至 ${MODES[state.mode].defaultIdealGap}px`,
        focusTarget: "gap1",
      });
    } else if (spacingIssue === "uneven") {
      issues.push({
        kind: "spacing",
        badge: "间距不等",
        headline: `左右实测 ${formatNum(g1)}px 与 ${formatNum(g2)}px，节奏一紧一松`,
        why: "同一排并列元素本该代表同等权重；左边差 10px 右边宽一截，大脑会自动把较近的两个当成一对、把第三个排斥在外。",
        hint: "在下方 4px 模数尺直接点 16 / 20 / 24px，或选中左右间距块用方向键拉成相等的 4px 倍数。",
        fixLabel: `统一为 ${MODES[state.mode].defaultIdealGap}px`,
        focusTarget: "gap1",
      });
    } else {
      issues.push({
        kind: "spacing",
        badge: "偏离 4px 模数",
        headline: `当前间距 ${formatNum(g1)}px 不是 4px 倍数，难以复用与缩放`,
        why: "零碎像素（如 13px、15px）在 1.5× 缩放屏上会折算出半个物理像素，而且团队协作时无法形成稳定节拍；原海报建议以 4px 倍数建立间距刻度。",
        hint: "把间距微调到最近的 4px 倍数（12 / 16 / 20 / 24 / 28px 任一合法档位）。",
        fixLabel: `吸附到 ${MODES[state.mode].defaultIdealGap}px`,
        focusTarget: "gap1",
      });
    }
  }
  if (!subpixelOk) {
    const badItem = subpixelItems[0];
    const who = badItem ? `「${badItem.label}」` : "标尺间距";
    issues.push({
      kind: "subpixel",
      badge: "亚像素发虚",
      headline: `${who} 存在 ${formatNum(maxSubpixel)}px 小数偏移，边缘抗锯齿灰化`,
      why: "屏幕由整颗物理像素组成。线条或字块落在 0.3px 这类小数坐标时，渲染器只能把黑墨分摊给相邻两列像素，边缘立刻发灰发糊——看右上 8× 放大镜里的灰格就一目了然。",
      hint: `点选 ${who}（看 8× 放大镜），用 1px 步进或中央「中心 0px」键把它吸附回整像素。`,
      fixLabel: "整像素对齐消糊",
      focusTarget: badItem ? badItem.id : "gap1",
    });
  }
  if (!strokeOk) {
    const dir = state.strokeOffset > 0 ? "偏右" : "偏左";
    issues.push({
      kind: "stroke",
      badge: "描边偏心",
      headline: `描边圆环视觉${dir} ${formatNum(strokeErr)}px，左右重量失衡`,
      why: "封闭几何体对中心偏移极其敏感：外框和内芯只要错开 1.5px，一侧显得沉重拥挤、另一侧空虚，组件精致度瞬间掉档。",
      hint: "点选右下描边圆环，按 ← / → 方向键逐像素推回 0px 居中位置。",
      fixLabel: "描边居中归位",
      focusTarget: "stroke",
    });
  }

  const allPass = issues.length === 0;
  const primary = issues[0] || {
    kind: "ok",
    badge: spacingTier || "精度达标",
    headline: `三项校准全部成立：基线 0pt、间距 ${formatNum(g1)}px（${spacingTier}）、像素与描边居中`,
    why:
      g1 <= 12
        ? "你调出了一套「紧凑 4px 节拍解」：高密度信息条与工具栏用 8–12px 能兼顾紧凑与清晰，同时像素与基线零毛刺。"
        : g1 <= 20
        ? "你调出了「标准平衡解」：这正是 294 原海报与大多数界面组件的黄金节拍，字行稳、亲疏明、边缘如刀切。"
        : "你调出了「宽舒呼吸解」：24–32px 模数适合单栏品牌页与编辑展示，留白从容却未打破同组联系。你也可以试着点下方试错标本或故意调偏 0.3px 对比差别。",
    hint: "可以换「导航栏组件」或「跨屏微调」标本继续实操，或切到 0.1px 步进亲手制造亚像素模糊对比。",
    fixLabel: "",
    focusTarget: state.focus,
  };

  return {
    allPass,
    issueCount: issues.length,
    primaryKind: primary.kind,
    badge: primary.badge,
    headline: primary.headline,
    why: primary.why,
    hint: primary.hint,
    fixLabel: primary.fixLabel,
    focusTarget: primary.focusTarget,
    firstOffAlignId: offAlignItems[0]?.id || null,
    firstSubpixelId: subpixelItems[0]?.id || null,
    maxBaselineErr: r1(maxBaselineErr),
    maxSubpixel: r1(maxSubpixel),
    strokeErr,
    spacingTier,
    pillars: {
      spacing: { ok: spacingOk, short: spacingShort, issue: spacingIssue },
      align: { ok: alignOk, short: alignShort },
      tune: { ok: tuneOk, short: tuneShort, subpixelOk, strokeOk },
    },
  };
}
