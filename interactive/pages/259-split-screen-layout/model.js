// 259 分屏布局（SPLIT-SCREEN LAYOUT）单真源几何与极性核算模型
// 画布绘制、四项要点探针、单真源诊单、实时比例标尺全部只读这一份核算结果。

export const TONES = {
  obsidian: {
    id: "obsidian",
    label: "纯黑",
    en: "OBSIDIAN",
    bg: "#0F0F0F",
    fg: "#F2F3EE",
    sub: "#B5B8AE",
    accent: "#BEEB4B",
    accentFg: "#0F0F0F",
    rule: "#2B2D28",
    cardBg: "#191A17",
    motifMain: "#BEEB4B",
    motifSub: "#2E351A",
    isHighChroma: false,
  },
  slate: {
    id: "slate",
    label: "炭灰",
    en: "SLATE",
    bg: "#444542",
    bgAlt: "#4F504C",
    fg: "#F2F3EE",
    sub: "#C6C9C0",
    accent: "#BEEB4B",
    accentFg: "#0F0F0F",
    rule: "#5F615C",
    cardBg: "#393A37",
    motifMain: "#BEEB4B",
    motifSub: "#5A5C56",
    isHighChroma: false,
  },
  concrete: {
    id: "concrete",
    label: "浅灰",
    en: "CONCRETE",
    bg: "#D6D6D6",
    fg: "#0F0F0F",
    sub: "#343632",
    accent: "#0F0F0F",
    accentFg: "#F4F5F1",
    rule: "#A5A7A1",
    cardBg: "#C9CAC5",
    motifMain: "#0F0F0F",
    motifSub: "#8B8D87",
    isHighChroma: false,
  },
  lime: {
    id: "lime",
    label: "酸绿",
    en: "ACID LIME",
    bg: "#BEEB4B",
    fg: "#0F0F0F",
    sub: "#223005",
    accent: "#0F0F0F",
    accentFg: "#BEEB4B",
    rule: "#8DB32F",
    cardBg: "#B1DD3F",
    motifMain: "#0F0F0F",
    motifSub: "#64801E",
    isHighChroma: true,
  },
};

export const TONE_ORDER = ["obsidian", "concrete", "lime", "slate"];

export const SPECIMENS = {
  vs: {
    id: "vs",
    label: "VS 优势 / 挑战",
    shortLabel: "优势 / 挑战",
    bridgeGlyph: "VS",
    left: {
      badge: "check",
      title: "优势",
      en: "STRENGTHS",
      items: [
        { icon: "rocket", text: "提升效率" },
        { icon: "target", text: "目标明确" },
        { icon: "team", text: "团队协作" },
      ],
      extraItems: [
        { icon: "dot", text: "节点实时同步" },
        { icon: "dot", text: "跨端组件复用" },
        { icon: "dot", text: "版本一键回溯" },
      ],
    },
    right: {
      badge: "cross",
      title: "挑战",
      en: "CHALLENGES",
      items: [
        { icon: "clock", text: "时间压力" },
        { icon: "warn", text: "资源限制" },
        { icon: "shuffle", text: "不确定性" },
      ],
      extraItems: [
        { icon: "dot", text: "预算临时收紧" },
        { icon: "dot", text: "需求中途变更" },
        { icon: "dot", text: "多方评审拉锯" },
      ],
    },
  },
  and: {
    id: "and",
    label: "& 自然 / 设计",
    shortLabel: "自然 / 设计",
    bridgeGlyph: "&",
    left: {
      title: "自然",
      en: "NATURE",
      copy: "自然以有机的秩序创造生命与平衡，给予人类灵感与能量。",
      extraCopy: "昼夜节律、风向流线、生长分形与季节更迭构成无穷变化，却始终在动态中维系整体秩序。",
      motif: "nature",
    },
    right: {
      title: "设计",
      en: "DESIGN",
      copy: "设计以理性的思维优化功能与体验，让美好自然融入生活。",
      extraCopy: "比例网格、材质对比、功能层级与动线规划经过反复推演，将复杂需求收束为清晰界面。",
      motif: "design",
    },
  },
  polarity: {
    id: "polarity",
    label: "↔ 极性构成",
    shortLabel: "原海报图式",
    bridgeGlyph: "↔",
    left: {
      title: "左极场",
      en: "LEFT FIELD",
      tag: "底色承托 · 反色焦点",
      extraTags: ["附加色标 A", "辅助角注 B", "次级边框 C", "冗余引导 D"],
    },
    right: {
      title: "右极场",
      en: "RIGHT FIELD",
      tag: "极性反转 · 视线呼应",
      extraTags: ["附加色标 E", "辅助角注 F", "次级边框 G", "冗余引导 H"],
    },
  },
};

export const INITIAL_STATE = {
  specimen: "vs",
  split: 0.74, // 开场刻意停在 74:26 极偏失衡
  leftTone: "slate", // 开场左右同为炭灰，几乎无反差
  rightTone: "slate",
  bridge: "broken", // 无桥接标 + 对照行错位 +28px
  density: "packed", // 半屏塞入 6 组内容，留白过载
  viewportMode: "desktop", // "desktop" | "mobile390"
  mobileMode: "sideBySide", // 390px 下 "sideBySide"（错）| "stack"（对）
  showGuides: true,
};

export const PRESETS = {
  classicBlackGray: {
    label: "50:50 黑灰经典解",
    kind: "valid",
    patch: {
      split: 0.5,
      leftTone: "obsidian",
      rightTone: "concrete",
      bridge: "linked",
      density: "focused",
      viewportMode: "desktop",
      mobileMode: "stack",
    },
  },
  asymmetricLead: {
    label: "42:58 主次张力解",
    kind: "valid",
    patch: {
      split: 0.42,
      leftTone: "obsidian",
      rightTone: "concrete",
      bridge: "linked",
      density: "focused",
      viewportMode: "desktop",
      mobileMode: "stack",
    },
  },
  blackLimePolarity: {
    label: "50:50 黑绿极性解",
    kind: "valid",
    patch: {
      split: 0.5,
      leftTone: "obsidian",
      rightTone: "lime",
      bridge: "linked",
      density: "focused",
      viewportMode: "desktop",
      mobileMode: "stack",
    },
  },
  trapDoubleLime: {
    label: "试错：双绿互炸",
    kind: "trap",
    patch: {
      split: 0.5,
      leftTone: "lime",
      rightTone: "lime",
      bridge: "linked",
      density: "focused",
      viewportMode: "desktop",
    },
  },
  trapWall: {
    label: "试错：厚墙割裂",
    kind: "trap",
    patch: {
      split: 0.5,
      leftTone: "obsidian",
      rightTone: "concrete",
      bridge: "wall",
      density: "focused",
      viewportMode: "desktop",
    },
  },
  trapExtremeSkew: {
    label: "试错：极偏 22:78",
    kind: "trap",
    patch: {
      split: 0.22,
      leftTone: "obsidian",
      rightTone: "concrete",
      bridge: "linked",
      density: "focused",
      viewportMode: "desktop",
    },
  },
  trapMobileHardSplit: {
    label: "试错：手机硬分屏",
    kind: "trap",
    patch: {
      split: 0.5,
      leftTone: "obsidian",
      rightTone: "concrete",
      bridge: "linked",
      density: "focused",
      viewportMode: "mobile390",
      mobileMode: "sideBySide",
    },
  },
};

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const l1 = relLuminance(hexA);
  const l2 = relLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function resolvePanePalette(state) {
  const left = TONES[state.leftTone] || TONES.obsidian;
  const rightBase = TONES[state.rightTone] || TONES.concrete;
  const sameSlate = state.leftTone === "slate" && state.rightTone === "slate";
  const right = sameSlate ? { ...rightBase, bg: rightBase.bgAlt } : rightBase;
  return { left, right };
}

export function clampSplit(v) {
  return Math.max(0.18, Math.min(0.82, v));
}

export function snapSplit(v) {
  const anchors = [0.5, 0.42, 0.58, 0.4, 0.6];
  for (const a of anchors) {
    if (Math.abs(v - a) <= 0.013) return a;
  }
  return v;
}

// 单真源全面核算：所有像素、对比度、留白与文案均由实际绘制参数计算。
export function auditState(state) {
  const { left, right } = resolvePanePalette(state);
  const ratio = contrastRatio(left.bg, right.bg);
  const lumDelta = Math.abs(relLuminance(left.bg) - relLuminance(right.bg));
  const simW = state.viewportMode === "mobile390" ? 390 : 1280;
  const stacked = state.viewportMode === "mobile390" && state.mobileMode === "stack";
  const wallPx = state.bridge === "wall" ? 44 : 0;
  const splitPctL = Math.round(state.split * 100);
  const splitPctR = 100 - splitPctL;

  const leftPx = stacked ? simW : Math.round((simW - wallPx) * state.split);
  const rightPx = stacked ? simW : Math.round((simW - wallPx) * (1 - state.split));
  const narrowPx = Math.min(leftPx, rightPx);
  const charsPerLine = Math.max(4, Math.floor((narrowPx - 44) / 14));
  const rowDeltaPx = state.bridge === "broken" ? 28 : 0;

  // 估算实绘留白占比（依据模拟宽度折行膨胀 + 密度项数）
  const wrapPenalty = stacked ? 0 : Math.max(0, Math.round((360 - narrowPx) / 26));
  const baseSpace = state.density === "packed" ? 22 : 44;
  const whitespacePct = Math.max(10, Math.min(58, baseSpace - wrapPenalty));

  // 1. 对比 CONTRAST
  let contrastStatus = "pass";
  let contrastTag = `反差 ${ratio.toFixed(1)}:1`;
  let contrastReason = `左右屏亮度反差达 ${ratio.toFixed(1)}:1，双极场域一眼分开。`;
  if (state.leftTone === "lime" && state.rightTone === "lime") {
    contrastStatus = "clash";
    contrastTag = "双绿互炸";
    contrastReason = "左右两屏都满铺高饱和酸青绿，缺少暗部或中性灰承托，视觉互相刺眼抢焦。";
  } else if (ratio < 2.6) {
    contrastStatus = "flat";
    contrastTag = `同底 ${ratio.toFixed(1)}:1`;
    contrastReason = `左右两屏亮度反差只有 ${ratio.toFixed(1)}:1（明度差 ΔL ${lumDelta.toFixed(2)}），分区边界糊成一片。`;
  }

  // 2. 对话 DIALOGUE
  let dialogueStatus = "pass";
  let dialogueTag = stacked ? "折层桥接" : `${SPECIMENS[state.specimen].bridgeGlyph} 齐行呼应`;
  let dialogueReason = `中缝骑跨「${SPECIMENS[state.specimen].bridgeGlyph}」桥接标，左右对照行落差 0px，两极构成对话。`;
  if (state.bridge === "broken") {
    dialogueStatus = "broken";
    dialogueTag = `错行 +${rowDeltaPx}px`;
    dialogueReason = `中缝既无桥接标记，右屏对照行还整体下沉 +${rowDeltaPx}px，两边各自说话无法横向对读。`;
  } else if (state.bridge === "wall") {
    dialogueStatus = "wall";
    dialogueTag = `厚墙 ${wallPx}px`;
    dialogueReason = `中缝被砌成 ${wallPx}px 宽实心隔墙且断掉桥接，把一页硬生生切成两张互不相干的孤立海报。`;
  }

  // 3. 张力 TENSION
  let tensionStatus = "pass";
  let tensionTag = stacked ? "上下双层" : `${splitPctL}:${splitPctR}`;
  let tensionReason = stacked
    ? "390px 窄屏自动转为上下双层等宽铺排，保住色彩极性与阅读宽度。"
    : splitPctL === 50
      ? "50:50 等宽交锋，左右体量势均力敌，对立与比较张力最强。"
      : `${splitPctL}:${splitPctR} 稳健非对称分屏，主次牵引清晰且窄侧仍保有 ${narrowPx}px 舒适空间。`;
  if (!stacked) {
    if (state.split > 0.65) {
      tensionStatus = "leftHeavy";
      tensionTag = `左肥 ${splitPctL}:${splitPctR}`;
      tensionReason = `左屏抢占 ${splitPctL}% 宽度，右屏被压成仅 ${rightPx}px（约 ${charsPerLine} 字/行）的细条，退化成畸形侧边栏。`;
    } else if (state.split < 0.35) {
      tensionStatus = "rightHeavy";
      tensionTag = `右肥 ${splitPctL}:${splitPctR}`;
      tensionReason = `右屏吞掉 ${splitPctR}% 宽度，左屏只剩 ${leftPx}px（约 ${charsPerLine} 字/行），双屏对话变成单边压制。`;
    }
  }

  // 4. 清晰 CLARITY
  let clarityStatus = "pass";
  let clarityTag = `留白 ${whitespacePct}%`;
  let clarityReason = `每屏收敛在核心要点内，实测留白约 ${whitespacePct}%，视线能一眼捕捉重点。`;
  if (state.viewportMode === "mobile390" && state.mobileMode === "sideBySide") {
    clarityStatus = "mobileCrush";
    clarityTag = `窄条 ${narrowPx}px`;
    clarityReason = `390px 手机竖屏强行左右硬分屏，单侧仅剩 ${narrowPx}px（约 ${charsPerLine} 字/行），文字被挤成破碎竖列。`;
  } else if (state.density === "packed") {
    clarityStatus = "packed";
    clarityTag = `过载 ${whitespacePct}%`;
    clarityReason = `半屏只有整屏一半宽，硬塞 6 组密排项与多余标签后留白跌至 ${whitespacePct}%，左右同时轰炸注意力。`;
  }

  const axes = {
    contrast: { ok: contrastStatus === "pass", status: contrastStatus, tag: contrastTag, reason: contrastReason },
    dialogue: { ok: dialogueStatus === "pass", status: dialogueStatus, tag: dialogueTag, reason: dialogueReason },
    tension: { ok: tensionStatus === "pass", status: tensionStatus, tag: tensionTag, reason: tensionReason },
    clarity: { ok: clarityStatus === "pass", status: clarityStatus, tag: clarityTag, reason: clarityReason },
  };

  const score = Object.values(axes).filter((a) => a.ok).length;

  // 主诊断与上下文一键纠偏（按最醒目的问题给出具体解释和下一步动作）
  let headline = "";
  let body = "";
  let actionHint = "";
  let fixLabel = "";
  let fixPatch = null;
  let badge = "";

  if (!axes.contrast.ok) {
    if (contrastStatus === "clash") {
      badge = `${score}/4 · 双绿互炸`;
      headline = "左右两屏同时满铺酸青绿，视觉互相刺眼打架";
      body = "高饱和亮色必须配深黑或中性灰才立得住。两半都开满亮绿时，眼睛没有落脚的暗面缓冲，反而丢失对比层次。";
      actionHint = "把左屏切回「纯黑」或「浅灰」，让高饱和酸绿只守一极。";
      fixLabel = "左屏切回纯黑";
      fixPatch = { leftTone: "obsidian", rightTone: "lime" };
    } else {
      badge = `${score}/4 · 同底 ${ratio.toFixed(1)}:1`;
      headline = `两屏亮度反差仅 ${ratio.toFixed(1)}:1，分屏糊成一整块灰`;
      body = "分屏布局靠左右两极的明暗或色相落差第一时间划分阵营。现在左右底色亮度过于接近，读者要读完正文才意识到这是对照。";
      actionHint = "直接点击画布两屏的换色角标，或切换左黑 × 右浅灰 / 右酸绿，把反差拉到 2.6:1 以上。";
      fixLabel = "拉开黑灰极性反差";
      fixPatch = { leftTone: "obsidian", rightTone: "concrete" };
    }
  } else if (!axes.tension.ok) {
    if (tensionStatus === "leftHeavy") {
      badge = `${score}/4 · 左肥 ${splitPctL}:${splitPctR}`;
      headline = `左屏占了 ${splitPctL}%，右屏被挤成 ${rightPx}px 窄条`;
      body = "当分屏比例偏过 65:35 时，较窄那侧不再像平等对手，而像被压扁的辅助栏——真正需要窄导航栏时该用 258 侧边栏，而非硬套分屏。";
      actionHint = "向左拖动中央虚线中缝，把比例收回 38:62 至 62:38 区间（如 50:50 或 42:58）。";
      fixLabel = "把中缝拉回 50:50";
      fixPatch = { split: 0.5 };
    } else {
      badge = `${score}/4 · 右肥 ${splitPctL}:${splitPctR}`;
      headline = `右屏占了 ${splitPctR}%，左屏被压到仅 ${leftPx}px`;
      body = "左侧内容被迫频繁折行（每行约 " + charsPerLine + " 字），两屏之间的视觉势能失衡，读者会直接忽略被挤扁的左屏。";
      actionHint = "向右拖动中央中缝，把比例收回 38:62 至 62:38 区间。";
      fixLabel = "把中缝拉回 50:50";
      fixPatch = { split: 0.5 };
    }
  } else if (!axes.dialogue.ok) {
    if (dialogueStatus === "wall") {
      badge = `${score}/4 · 厚墙 ${wallPx}px`;
      headline = `中缝砌出 ${wallPx}px 实心厚墙，两半变成两张孤立海报`;
      body = "分屏既要切分边界，更要让左右隔缝呼应。过厚的隔离带打断了横向扫视路径，读者无法确认两侧是在谈同一命题。";
      actionHint = "点击中缝或切换为「对齐桥接」，用轻巧虚线与 VS / & 徽章重新扣合两屏。";
      fixLabel = "恢复中缝桥接与齐行";
      fixPatch = { bridge: "linked" };
    } else {
      badge = `${score}/4 · 错行 +${rowDeltaPx}px`;
      headline = `中缝缺少桥接标，且左右对照行错位 +${rowDeltaPx}px`;
      body = "对比信息最怕横向找不到对应行。现在没有 VS / & / ↔ 关系提示，右屏还整体下沉了 28px，视线跨过中缝后会落空重找。";
      actionHint = "直接点击画布中缝标记，接通语义桥接并把左右对照行校准到同一基线。";
      fixLabel = "接通中缝桥接并齐行";
      fixPatch = { bridge: "linked" };
    }
  } else if (!axes.clarity.ok) {
    if (clarityStatus === "mobileCrush") {
      badge = `${score}/4 · 手机硬切`;
      headline = `390px 窄屏强行左右硬分，单侧只剩 ${narrowPx}px`;
      body = "桌面端好用的左右分屏在手机竖屏会被腰斩成两条细缝（每行约 " + charsPerLine + " 字）。正确做法是在窄屏自动折叠为上下双层，保留色块反差与桥接标。";
      actionHint = "把移动端策略切到「390 折叠上下」，或切回桌面 1280 视口观察。";
      fixLabel = "390px 改上下折叠";
      fixPatch = { mobileMode: "stack" };
    } else {
      badge = `${score}/4 · 半屏过载`;
      headline = `半屏硬塞 6 组密排项，实测留白跌至 ${whitespacePct}%`;
      body = "分屏每侧只有整页一半的宽度预算。把两套密集清单同时摊在左右两半，会制造双倍视觉噪声，读者根本不知道先看哪一侧。";
      actionHint = "把内容负荷切为「克制 3 组」，只保留最能拉开差异的核心要点。";
      fixLabel = "精简为 3 组核心要点";
      fixPatch = { density: "focused" };
    }
  } else {
    const modeTitle = stacked
      ? "390px 窄屏优雅折层，极性与对话都在"
      : splitPctL === 50
        ? `50:50 双极对峙成立（反差 ${ratio.toFixed(1)}:1）`
        : `${splitPctL}:${splitPctR} 非对称分屏张力成立（反差 ${ratio.toFixed(1)}:1）`;
    badge = `4/4 · ${stacked ? "窄屏折层" : `${splitPctL}:${splitPctR}`}`;
    headline = modeTitle;
    body = `左右底色反差 ${ratio.toFixed(1)}:1、中缝「${SPECIMENS[state.specimen].bridgeGlyph}」齐行呼应、窄侧保留 ${narrowPx}px 呼吸空间且留白约 ${whitespacePct}%。按空格可演播跨缝视线对读，也可切不同标本或试错反向陷阱。`;
    actionHint = "试试切换到「& 自然 / 设计」或点击右侧反向试错，看看打破任意一维会发生什么。";
    fixLabel = "演播跨缝视线";
    fixPatch = null; // 4/4 时按钮触发视线演播
  }

  return {
    left,
    right,
    ratio,
    lumDelta,
    simW,
    stacked,
    wallPx,
    splitPctL,
    splitPctR,
    leftPx,
    rightPx,
    narrowPx,
    charsPerLine,
    rowDeltaPx,
    whitespacePct,
    axes,
    score,
    badge,
    headline,
    body,
    actionHint,
    fixLabel,
    fixPatch,
  };
}
