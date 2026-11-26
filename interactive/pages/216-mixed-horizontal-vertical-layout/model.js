// 216 横直混排 · 单真源几何排版与诊断引擎
// 画布绘制、交界净空卡尺、视线路径、左栏五项设计要点、白话诊单全部读取同一份 computeLayout() 结果。

export const SPECIMENS = {
  city: {
    id: "city",
    label: "原海报 · 城市更新",
    tagEn: "CITY FUTURE",
    title: "城市的更新与未来",
    kicker: "可持续 · 人本 · 创新",
    body: "在快速变化的时代，城市更新不仅是空间的重塑，更是生活方式与价值观的进化。我们需要以更包容的视角，构建可持续发展的未来城市。",
    railZh: "共建美好生活",
    railEn: "CITY FUTURE",
    visualKind: "city",
    items: [
      { title: "生态", en: "ECOLOGY", desc: "绿色空间 · 低碳发展" },
      { title: "人本", en: "PEOPLE", desc: "公共参与 · 社区活力" },
      { title: "创新", en: "INNOVATION", desc: "智慧技术 · 未来交通" },
    ],
  },
  exhibit: {
    id: "exhibit",
    label: "美术馆 · 器物与光",
    tagEn: "VESSEL & LIGHT",
    title: "器物与光的日常秩序",
    kicker: "造物 · 材质 · 空间",
    body: "日常器物并不喧哗，它们在清晨斜照的光影里显出器壁的弧度与手的温度。本次特展汇集四十二件当代陶木作品，重新审视生活里的静默之美。",
    railZh: "秋季特展导览",
    railEn: "AUTUMN SHOW",
    visualKind: "exhibit",
    items: [
      { title: "泥土", en: "CLAY", desc: "柴烧胎质 · 肌理微光" },
      { title: "木构", en: "TIMBER", desc: "榫卯穿插 · 轻盈承重" },
      { title: "光影", en: "SHADOW", desc: "天窗采光 · 随日流转" },
    ],
  },
  arch: {
    id: "arch",
    label: "建筑志 · 留白之城",
    tagEn: "VOID & FORM",
    title: "留白之城的公共尺度",
    kicker: "尺度 · 街巷 · 呼吸",
    body: "真正让人愿意停下脚步的街道，往往不是塞满地标的广场，而是廊檐与院落之间恰到好处的缝隙。留白让风、树影与行人重新拥有交流的余地。",
    railZh: "年度建筑特刊",
    railEn: "ISSUE NO.16",
    visualKind: "arch",
    items: [
      { title: "廊檐", en: "EAVES", desc: "灰空间过渡 · 遮阳避雨" },
      { title: "院落", en: "COURT", desc: "围合生静 · 邻里相望" },
      { title: "步行", en: "WALK", desc: "慢行尺度 · 街角驻留" },
    ],
  },
};

export const MODULE_META = {
  title: { name: "主标题", role: "视觉第一入口", ideal: "H" },
  kicker: { name: "导语副标", role: "承上启下副主题", ideal: "H" },
  body: { name: "说明正文", role: "长段连续阅读信息", ideal: "H" },
  rail: { name: "侧边导视", role: "强调、标签与视线引导", ideal: "V" },
  footer: { name: "底沿要点", role: "并列快扫摘要", ideal: "H" },
};

// 开场刻意停在 0/5 复合错态：长文误竖 + 导视放横 + 50:50 五五开 + 零过渡撞车 + 层级拉平
export function createInitialState() {
  return {
    specimen: "city",
    ratio: 0.5, // 横流主区占比（0.24 - 0.84）
    dirs: {
      title: "H",
      kicker: "H",
      body: "V", // 错：长段说明文强塞竖排
      rail: "H", // 错：导视标签放平横排
      footer: "H",
    },
    transition: "none", // none | rule | hatch | space
    hierarchy: "flat", // flat | clear
    showGuides: true,
    selected: "body",
  };
}

// 多组合法解，证明横直混排没有唯一死板公式
export const PRESET_SOLUTIONS = {
  classic: {
    label: "原海报经典解",
    note: "横主 72% 载文 × 竖辅 28% 导视 × 斜线过渡",
    patch: {
      ratio: 0.72,
      dirs: { title: "H", kicker: "H", body: "H", rail: "V", footer: "H" },
      transition: "hatch",
      hierarchy: "clear",
    },
  },
  vertTitle: {
    label: "竖标领衔解",
    note: "主标竖立破势 × 长文与要点横排稳读 × 细线过渡",
    patch: {
      ratio: 0.7,
      dirs: { title: "V", kicker: "H", body: "H", rail: "V", footer: "H" },
      transition: "rule",
      hierarchy: "clear",
    },
  },
  wideMinimal: {
    label: "宽境留白解",
    note: "横主 78% 舒展阅读 × 极简竖签 22% × 宽留白过渡",
    patch: {
      ratio: 0.78,
      dirs: { title: "H", kicker: "H", body: "H", rail: "V", footer: "H" },
      transition: "space",
      hierarchy: "clear",
    },
  },
  kickerAnchor: {
    label: "双竖立脊解",
    note: "主标与导语左翼双竖立脊 × 正文与要点顺畅横读（仅 1 次转向）",
    patch: {
      ratio: 0.74,
      dirs: { title: "V", kicker: "V", body: "H", rail: "H", footer: "H" },
      transition: "rule",
      hierarchy: "clear",
    },
  },
};

export const PRESET_TRAPS = {
  allHoriz: {
    label: "试错：全横退化",
    patch: {
      ratio: 0.72,
      dirs: { title: "H", kicker: "H", body: "H", rail: "H", footer: "H" },
      transition: "hatch",
      hierarchy: "clear",
    },
  },
  split50: {
    label: "试错：五五分裂",
    patch: {
      ratio: 0.5,
      dirs: { title: "H", kicker: "H", body: "H", rail: "V", footer: "H" },
      transition: "rule",
      hierarchy: "clear",
    },
  },
  collide: {
    label: "试错：贴脸撞车",
    patch: {
      ratio: 0.72,
      dirs: { title: "H", kicker: "H", body: "H", rail: "V", footer: "H" },
      transition: "none",
      hierarchy: "clear",
    },
  },
  zigzag: {
    label: "试错：方向乱切",
    patch: {
      ratio: 0.68,
      dirs: { title: "V", kicker: "H", body: "V", rail: "H", footer: "V" },
      transition: "rule",
      hierarchy: "clear",
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 东亚标点竖排替换
export function toVerticalPunct(ch) {
  switch (ch) {
    case "，": return "、";
    case "—": return "｜";
    case "（": return "︵";
    case "）": return "︶";
    case "「": return "﹁";
    case "」": return "﹂";
    default: return ch;
  }
}

// 真实按字符格折行（横排）
export function wrapHorizontal(text, maxChars) {
  const n = Math.max(4, Math.floor(maxChars));
  const lines = [];
  let cur = "";
  for (const ch of text) {
    if (cur.length >= n && !/[，。、；：！？·]/.test(ch)) {
      lines.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// 真实按字符格分列（竖排，自右向左读列）
export function wrapVertical(text, maxPerCol) {
  const n = Math.max(3, Math.floor(maxPerCol));
  const cols = [];
  let cur = [];
  for (const ch of text) {
    if (cur.length >= n && !/[，。、；：！？·]/.test(ch)) {
      cols.push(cur);
      cur = [toVerticalPunct(ch)];
    } else {
      cur.push(toVerticalPunct(ch));
    }
  }
  if (cur.length) cols.push(cur);
  return cols;
}

/**
 * 单真源布局计算：由画布尺寸 (W, H) 和状态算出所有实绘矩形与精确排版指标
 */
export function computeLayout(state, W, H) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.city;
  const padX = Math.max(18, Math.round(W * 0.045));
  const padTop = Math.max(26, Math.round(H * 0.068));
  const padBottom = Math.max(22, Math.round(H * 0.055));

  const card = {
    x: padX,
    y: padTop,
    w: Math.max(240, W - padX * 2),
    h: Math.max(220, H - padTop - padBottom),
  };

  const innerPad = Math.max(12, Math.round(Math.min(card.w, card.h) * 0.036));
  const inner = {
    x: card.x + innerPad,
    y: card.y + innerPad,
    w: card.w - innerPad * 2,
    h: card.h - innerPad * 2,
  };

  // 底沿要点带（约占内高 21%）
  const footerH = Math.round(clamp(inner.h * 0.21, 56, 86));
  const footerRuleY = inner.y + inner.h - footerH;
  const upperH = footerRuleY - inner.y - 8;

  // 过渡媒介占用真实物理宽度
  const seamWidthMap = { none: 4, rule: 18, hatch: 28, space: 36 };
  const seamW = seamWidthMap[state.transition] ?? 18;

  const ratio = clamp(state.ratio, 0.24, 0.84);
  const usableW = inner.w - seamW;
  const leftW = Math.round(usableW * ratio);
  const rightW = Math.max(46, usableW - leftW);

  const leftBox = { x: inner.x, y: inner.y, w: leftW, h: upperH };
  const seamBox = { x: leftBox.x + leftBox.w, y: inner.y, w: seamW, h: upperH };
  const rightBox = { x: seamBox.x + seamBox.w, y: inner.y, w: rightW, h: upperH };

  // 字号尺度体系（层级拉平 vs 清晰反差）
  const baseUnit = clamp(Math.min(card.w, card.h * 1.18) / 36, 9.5, 16.5);
  const clear = state.hierarchy === "clear";

  const titleFs = Math.round(baseUnit * (clear ? 2.15 : 1.24));
  const kickerFs = Math.round(baseUnit * (clear ? 1.05 : 1.08));
  const bodyFs = Math.round(baseUnit * (clear ? 0.94 : 1.06));
  const railZhFs = Math.round(baseUnit * (clear ? 1.28 : 1.05));
  const railEnFs = Math.round(baseUnit * (clear ? 1.48 : 1.05));
  const footerTitleFs = Math.round(baseUnit * (clear ? 1.04 : 1.02));
  const footerDescFs = Math.round(baseUnit * 0.78);

  // 实测主标与正文尺度比
  const scaleRatio = +(titleFs / Math.max(1, bodyFs)).toFixed(2);

  // 划分左区 4 个子块：title / kicker / body / visual
  // 若主标题竖排，左区内部拆成「左竖标脊 + 右承接区」，真实体现竖标领衔结构
  const dirs = state.dirs;
  let titleRect, kickerRect, bodyRect, visualRect;
  const gap = Math.max(6, Math.round(baseUnit * 0.55));
  const visualH = Math.round(clamp(upperH * 0.28, 52, 112));

  if (dirs.title === "V") {
    const titleColW = Math.round(clamp(titleFs * 2.15, 42, leftBox.w * 0.32));
    titleRect = {
      x: leftBox.x,
      y: leftBox.y,
      w: titleColW,
      h: upperH - visualH - gap,
      dir: "V",
    };
    const subX = titleRect.x + titleRect.w + gap;
    const subW = Math.max(54, leftBox.w - titleColW - gap);
    if (dirs.kicker === "V") {
      const kW = Math.round(clamp(kickerFs * 2.1, 24, subW * 0.26));
      kickerRect = { x: subX, y: leftBox.y, w: kW, h: upperH - visualH - gap, dir: "V" };
      bodyRect = {
        x: subX + kW + gap,
        y: leftBox.y,
        w: Math.max(40, subW - kW - gap),
        h: upperH - visualH - gap,
        dir: dirs.body,
      };
    } else {
      const kH = Math.round(kickerFs * 1.9);
      kickerRect = { x: subX, y: leftBox.y, w: subW, h: kH, dir: "H" };
      bodyRect = {
        x: subX,
        y: leftBox.y + kH + gap,
        w: subW,
        h: Math.max(44, upperH - visualH - kH - gap * 2),
        dir: dirs.body,
      };
    }
    visualRect = {
      x: leftBox.x,
      y: leftBox.y + upperH - visualH,
      w: leftBox.w,
      h: visualH,
      dir: "H",
    };
  } else {
    // 主标题横排
    const titleLinesEst = Math.max(1, Math.min(2, Math.ceil((spec.title.length * titleFs * 1.04) / Math.max(40, leftBox.w - 8))));
    const titleH = Math.round(titleLinesEst * titleFs * 1.24 + 8);
    titleRect = { x: leftBox.x, y: leftBox.y, w: leftBox.w, h: titleH, dir: "H" };

    const remainTop = titleRect.y + titleRect.h + gap;
    const remainH = Math.max(48, upperH - titleH - visualH - gap * 2);

    if (dirs.kicker === "V") {
      const kW = Math.round(clamp(kickerFs * 2.2, 26, leftBox.w * 0.22));
      kickerRect = { x: leftBox.x, y: remainTop, w: kW, h: remainH, dir: "V" };
      bodyRect = {
        x: leftBox.x + kW + gap,
        y: remainTop,
        w: Math.max(44, leftBox.w - kW - gap),
        h: remainH,
        dir: dirs.body,
      };
    } else {
      const kH = Math.round(kickerFs * 1.75);
      kickerRect = { x: leftBox.x, y: remainTop, w: leftBox.w, h: kH, dir: "H" };
      bodyRect = {
        x: leftBox.x,
        y: remainTop + kH + Math.round(gap * 0.7),
        w: leftBox.w,
        h: Math.max(36, remainH - kH - Math.round(gap * 0.7)),
        dir: dirs.body,
      };
    }

    visualRect = {
      x: leftBox.x,
      y: leftBox.y + upperH - visualH,
      w: leftBox.w,
      h: visualH,
      dir: "H",
    };
  }

  const railRect = {
    x: rightBox.x,
    y: rightBox.y,
    w: rightBox.w,
    h: rightBox.h,
    dir: dirs.rail,
  };

  const footerRect = {
    x: inner.x,
    y: footerRuleY + 4,
    w: inner.w,
    h: footerH - 4,
    dir: dirs.footer,
  };

  // 计算正文真实折行数据（单真源）
  let bodyLines = [];
  let bodyCols = [];
  let bodyCharsPerLine = 0;
  let bodyOverflow = false;

  if (dirs.body === "H") {
    const stepX = bodyFs * 1.04;
    const maxChars = Math.max(4, Math.floor((bodyRect.w - 10) / stepX));
    bodyLines = wrapHorizontal(spec.body, maxChars);
    bodyCharsPerLine = bodyLines.length ? Math.round(spec.body.length / bodyLines.length) : 0;
    const neededH = bodyLines.length * bodyFs * 1.48;
    bodyOverflow = neededH > bodyRect.h + bodyFs * 0.5;
  } else {
    const stepY = bodyFs * 1.12;
    const maxPerCol = Math.max(3, Math.floor((bodyRect.h - 10) / stepY));
    bodyCols = wrapVertical(spec.body, maxPerCol);
    bodyCharsPerLine = maxPerCol;
    const colPitch = bodyFs * 1.38;
    const neededW = bodyCols.length * colPitch;
    bodyOverflow = neededW > bodyRect.w + bodyFs * 0.3;
  }

  // 实测交界物理净空（过渡缝扣掉贴边内扩或零过渡入侵）
  const bleedIntoSeam = state.transition === "none" ? 2 : 0;
  const seamGapPx = Math.max(2, seamW - bleedIntoSeam * 2);

  // 统计五个可控文字块的方向与面积权重
  const textBlocks = [
    { id: "title", rect: titleRect, dir: dirs.title, weight: 3 },
    { id: "kicker", rect: kickerRect, dir: dirs.kicker, weight: 1.4 },
    { id: "body", rect: bodyRect, dir: dirs.body, weight: 3.4 },
    { id: "rail", rect: railRect, dir: dirs.rail, weight: 2.2 },
    { id: "footer", rect: footerRect, dir: dirs.footer, weight: 2 },
  ];

  const hCount = textBlocks.filter((b) => b.dir === "H").length;
  const vCount = textBlocks.filter((b) => b.dir === "V").length;

  // 真实空间占比：横流主区占卡片有效宽度的实测百分比
  const leftSharePct = Math.round((leftBox.w / Math.max(1, leftBox.w + rightBox.w)) * 100);
  const rightSharePct = 100 - leftSharePct;

  // 按视觉阅读顺序计算 90° 方向折转次数（title -> kicker -> body -> rail -> footer）
  const scanOrder = ["title", "kicker", "body", "rail", "footer"];
  const scanNodes = scanOrder.map((id) => {
    const r = { title: titleRect, kicker: kickerRect, body: bodyRect, rail: railRect, footer: footerRect }[id];
    return {
      id,
      dir: dirs[id],
      cx: r.x + r.w * 0.5,
      cy: r.y + r.h * 0.5,
      rect: r,
    };
  });
  let turns = 0;
  for (let i = 1; i < scanNodes.length; i++) {
    if (scanNodes[i].dir !== scanNodes[i - 1].dir) turns++;
  }

  // 纵栏挤压度：检测侧边导视在当前宽度下的最小字宽是否被压扁
  const railMinNeed = dirs.rail === "V" ? railZhFs * 2.5 : railZhFs * 5.2;
  const railCramped = rightBox.w < railMinNeed;

  // 十字坐标交点（相对画布宽度的归一化位置，供页面顶沿原海报十字轴联动）
  const axisXNorm = (seamBox.x + seamBox.w * 0.5) / Math.max(1, W);

  return {
    W,
    H,
    spec,
    card,
    inner,
    leftBox,
    seamBox,
    rightBox,
    footerRuleY,
    rects: {
      title: titleRect,
      kicker: kickerRect,
      body: bodyRect,
      visual: visualRect,
      rail: railRect,
      footer: footerRect,
    },
    fonts: {
      baseUnit,
      titleFs,
      kickerFs,
      bodyFs,
      railZhFs,
      railEnFs,
      footerTitleFs,
      footerDescFs,
    },
    bodyLines,
    bodyCols,
    bodyCharsPerLine,
    bodyOverflow,
    seamGapPx,
    hCount,
    vCount,
    leftSharePct,
    rightSharePct,
    scaleRatio,
    scanNodes,
    turns,
    railCramped,
    axisXNorm,
  };
}

/**
 * 单真源诊断：完全从 computeLayout() 实算值推导 7 类双向错态 + 5 条原海报设计要点状态
 */
export function auditLayout(layout, state) {
  const { dirs, transition } = state;
  const {
    hCount,
    vCount,
    leftSharePct,
    rightSharePct,
    seamGapPx,
    scaleRatio,
    turns,
    bodyCharsPerLine,
    bodyOverflow,
    railCramped,
  } = layout;

  const isSingleDir = hCount === 0 || vCount === 0;
  const isAllH = vCount === 0;
  const isAllV = hCount === 0;

  const isBodyVert = dirs.body === "V";
  const isRailNotVert = dirs.rail === "H" && dirs.title === "H" && dirs.kicker === "H";
  const isFiftyFifty = leftSharePct >= 44 && leftSharePct <= 58;
  const isLeftTooNarrow = leftSharePct < 44;
  const isRightTooNarrow = rightSharePct < 15 || (dirs.rail === "V" && railCramped);
  const isCollision = transition === "none" || seamGapPx < 14;
  const isFlatHierarchy = scaleRatio < 1.5;
  const isZigzag = turns >= 4;
  const isBodyTooShort = dirs.body === "H" && bodyCharsPerLine < 10;

  // 对应原海报左绿旗的 5 条设计要点：实时亮灯
  const pMixOk = !isSingleDir && !isBodyVert;
  const pContrastOk = !isSingleDir && !isFiftyFifty && !isLeftTooNarrow && !isRightTooNarrow;
  const pHierarchyOk = !isFlatHierarchy && !isBodyVert;
  const isRhythmInverted = isBodyVert && dirs.rail === "H";
  const pRhythmOk = !isSingleDir && !isZigzag && !isBodyTooShort && !bodyOverflow && !isRhythmInverted;
  const pTransitionOk = !isCollision;

  const principles = [
    {
      key: "mix",
      title: "混合",
      en: "MIX",
      ok: pMixOk,
      badge: isSingleDir
        ? isAllH ? "退化纯横" : "退化纯竖"
        : isBodyVert ? "长文误竖" : `${hCount}横×${vCount}竖`,
    },
    {
      key: "contrast",
      title: "对比",
      en: "CONTRAST",
      ok: pContrastOk,
      badge: isSingleDir
        ? "无方向差"
        : isFiftyFifty
          ? `五五开 ${leftSharePct}:${rightSharePct}`
          : isLeftTooNarrow
            ? `横区过窄 ${leftSharePct}%`
            : isRightTooNarrow
              ? `纵栏挤瘪 ${rightSharePct}%`
              : `主次 ${leftSharePct}:${rightSharePct}`,
    },
    {
      key: "hierarchy",
      title: "层级",
      en: "HIERARCHY",
      ok: pHierarchyOk,
      badge: isFlatHierarchy ? `拉平 ${scaleRatio}×` : isBodyVert ? "主读受阻" : `反差 ${scaleRatio}×`,
    },
    {
      key: "rhythm",
      title: "节奏",
      en: "RHYTHM",
      ok: pRhythmOk,
      badge: isSingleDir
        ? "单调平铺"
        : isRhythmInverted
          ? "节奏倒置"
          : isZigzag
            ? `急转 ${turns}次`
            : isBodyTooShort
              ? `每行${bodyCharsPerLine}字`
              : bodyOverflow
                ? "段尾拥挤"
                : `顺转 ${turns}次`,
    },
    {
      key: "transition",
      title: "过渡",
      en: "TRANSITION",
      ok: pTransitionOk,
      badge: isCollision ? `撞车 ${seamGapPx}px` : `${{ rule: "细界线", hatch: "斜线带", space: "宽留白", none: "无" }[transition]} ${seamGapPx}px`,
    },
  ];

  const score = principles.filter((p) => p.ok).length;
  const passed = score === 5;

  // 按严重程度给出最优先的一条白话诊断 + 一键纠偏动作
  let statusTag = "";
  let headline = "";
  let reason = "";
  let fixHint = "";
  let fixLabel = "";
  let fixAction = null;

  if (isSingleDir) {
    statusTag = `${score}/5 · ${isAllH ? "退化纯横" : "退化纯竖"}`;
    headline = isAllH
      ? "5 个模块全是横排，已经退化成普通单向版面"
      : "5 个模块全是竖排，长文与要点全被拉成窄柱";
    reason = isAllH
      ? "没有竖排导视或竖排锚点去截断视线，读者一路平扫到底，失去了横直混排特有的停顿和节奏。"
      : "全页清一色竖排缺少横向基准，信息主次全部压进同一种方向里，反而丢失了方向对比的力量。";
    fixHint = isAllH
      ? "点击右侧「导视栏」把它翻成竖排（V），立刻立出纵向视觉锚点。"
      : "点击「说明正文」和「底沿要点」切回横排（H），让长阅读恢复水平流畅。";
    fixLabel = isAllH ? "把侧边导视翻为竖排" : "恢复横主竖辅分工";
    fixAction = (s) =>
      isAllH
        ? { ...s, dirs: { ...s.dirs, rail: "V" }, selected: "rail" }
        : { ...s, dirs: { title: "H", kicker: "H", body: "H", rail: "V", footer: "H" }, selected: "body" };
  } else if (isCollision) {
    statusTag = `${score}/5 · 贴脸撞车`;
    headline = `交界净空只有 ${seamGapPx}px，横排尾巴直接撞进竖列`;
    reason =
      "横排文字水平扫到行尾，与右侧竖排区之间没有留白或线条缓冲，眼睛在十字路口顺势串行打架，左右两个方向互相污染。";
    fixHint = "把交界过渡切到「斜线带」「细界线」或「宽留白」，给横直两条流划出明确安全区。";
    fixLabel = "加上原海报斜线过渡带";
    fixAction = (s) => ({ ...s, transition: "hatch" });
  } else if (isBodyVert) {
    statusTag = `${score}/5 · 长文误竖`;
    headline = `说明正文被硬塞进竖排（每列仅 ${bodyCharsPerLine} 字），读起来极碎`;
    reason =
      "横排适合连续读取说明段落，竖排适合短标签和导航。把整段说明文字翻成竖排后，视线不停上下折返，连贯语义被切得支离破碎。";
    fixHint = "直接点击画布里的「说明正文」把它翻回横排（H），再把「侧边导视」翻成竖排（V）。";
    fixLabel = "把正文翻回横排、导视立竖";
    fixAction = (s) => ({
      ...s,
      dirs: { ...s.dirs, body: "H", rail: "V" },
      selected: "body",
    });
  } else if (isFiftyFifty) {
    statusTag = `${score}/5 · 主次分裂`;
    headline = `横区 ${leftSharePct}% 与纵区 ${rightSharePct}% 五五开，两条轴抢主场`;
    reason =
      "横直混排最忌讳横纵平分秋色。现在左右面积几乎对半，读者进画面不知道该按横向主读还是纵向扫视，整张纸被劈成两张打架的小海报。";
    fixHint = "向右拖动中央深松绿分界轴，把横流主区拉到 64%–80%，让纵区退到清晰的引导辅位。";
    fixLabel = "把主次比拉到 72 : 28";
    fixAction = (s) => ({ ...s, ratio: 0.72 });
  } else if (isLeftTooNarrow || isBodyTooShort) {
    statusTag = `${score}/5 · 横区过窄`;
    headline = `主读横区只剩 ${leftSharePct}%（约 ${bodyCharsPerLine} 字/行），正文被挤成碎条`;
    reason =
      "纵流区反客为主占去大半幅面，横排主文被迫每行只塞几个字就断行，眼睛频繁回扫，反而不如干脆纯竖排清爽。";
    fixHint = "向右拖动中央分界轴，把横流主区扩回 65%–80%，让正文行宽回到舒适区。";
    fixLabel = "拓宽横流主区至 72%";
    fixAction = (s) => ({ ...s, ratio: 0.72 });
  } else if (isRightTooNarrow) {
    statusTag = `${score}/5 · 纵栏挤瘪`;
    headline = `右侧纵栏被压到只剩 ${rightSharePct}%，导视字列喘不过气`;
    reason =
      "纵流辅区虽然不该抢主位，但也需要能立稳一列大字和呼吸边距的宽度；挤得太扁后，竖排标签贴边发紧，节奏锚点就失效了。";
    fixHint = "向左轻拉中央分界轴，给纵栏留出 18%–34% 的呼吸宽度。";
    fixLabel = "给纵栏留出 26% 宽度";
    fixAction = (s) => ({ ...s, ratio: 0.74 });
  } else if (isZigzag) {
    statusTag = `${score}/5 · 急转过频`;
    headline = `单页方向反复 90° 急转 ${turns} 次，节奏碎成迷宫`;
    reason =
      "混排的节奏来自大块面的对比，而不是每隔两行就翻一次方向。连续交替横→竖→横→竖，读者每次换区都要重新校准阅读方向，疲劳感倍增。";
    fixHint = "把相邻的同类模块归顺到同一方向，把整页 90° 转向收敛到 1–3 次以内。";
    fixLabel = "收敛方向转向次数";
    fixAction = (s) => ({
      ...s,
      dirs: { title: "H", kicker: "H", body: "H", rail: "V", footer: "H" },
    });
  } else if (isFlatHierarchy) {
    statusTag = `${score}/5 · 层级拉平`;
    headline = `主标与正文尺度比仅 ${scaleRatio}×，只换方向没拉开主次`;
    reason =
      "方向只是骨架，大小与粗细才是权重。现在主标、副标、正文和竖排导视字号差不多，虽然横直都有，眼睛却抓不住第一落点。";
    fixHint = "开启「清晰层级反差」，让主标重量领跑、正文安静展开、竖排导视自成一格。";
    fixLabel = "拉开大小粗细层级";
    fixAction = (s) => ({ ...s, hierarchy: "clear" });
  } else if (isRailNotVert && dirs.footer === "V") {
    statusTag = `${score}/5 · 落点偏重`;
    headline = "底沿要点翻成竖排后重心下沉，侧栏仍平放";
    reason = "底沿三项并列要点天生适合横向快扫，把竖排锚点挪回右侧导视栏更顺手。";
    fixHint = "点底沿要点切回横排，点侧边导视立成竖排。";
    fixLabel = "切换标准横主竖导";
    fixAction = (s) => ({
      ...s,
      dirs: { ...s.dirs, rail: "V", footer: "H" },
    });
  } else {
    // 达标多解识别
    let solveName = "平衡混排解";
    let solveDesc = "横纵分工清楚、主次比例稳健、交界缓冲充足，视线能顺着清晰的层级与一次舒缓转向读完全页。";
    if (dirs.title === "V" && dirs.kicker === "V" && dirs.body === "H") {
      solveName = "双竖立脊解";
      solveDesc =
        "主标题与导语副标并立成左翼竖排脊柱，其余说明正文与要点统归横向流，全页只在入画后平缓转折一次，兼顾强烈东亚书卷气与长文流畅度。";
    } else if (dirs.title === "V" && dirs.body === "H") {
      solveName = "竖标领衔解";
      solveDesc =
        "主标题竖排如立柱定下视觉第一锚，说明正文与要点横向顺畅展开，再由右侧竖栏收束——这是画册封面与展览海报很爱用的强张力解法。";
    } else if (leftSharePct >= 76 && transition === "space") {
      solveName = "宽境留白解";
      solveDesc =
        "以约八成宽幅承托主读信息，只用一列克制的竖排边注与宽呼吸留白制造方向停顿，极简却很有东方出版气质。";
    } else if (transition === "hatch" && dirs.title === "H" && dirs.rail === "V") {
      solveName = "原海报经典解";
      solveDesc =
        "完全呼应 216 原海报《城市的更新与未来》：横排承载标题、说明与底沿三要点，斜线过渡带干净隔出右侧竖排导视，秩序与节奏兼得。";
    }

    statusTag = `5/5 · ${solveName}`;
    headline = `成立：${solveName}（横 ${leftSharePct}% : 纵 ${rightSharePct}%）`;
    reason = solveDesc;
    fixHint = "试试点击「主标题」或「导语」翻转成竖排，或切换三种过渡介质，体验不止一种合法解。";
    fixLabel = "再演练一遍视线流";
    fixAction = null;
  }

  // 动态单真源 CSS 片段
  const railMode = dirs.rail === "V" ? "vertical-rl" : "horizontal-tb";
  const bodyMode = dirs.body === "V" ? "vertical-rl" : "horizontal-tb";
  const cssSnippet =
    `.spread { display: grid; grid-template-columns: ${leftSharePct}fr ${seamGapPx}px ${rightSharePct}fr; }\n` +
    `.body   { writing-mode: ${bodyMode}; }  .rail { writing-mode: ${railMode}; }`;

  // 整体态势档位（不用假精确百分比）
  const posture = passed
    ? "秩序稳固"
    : score >= 3
      ? "局部待修"
      : "方向打架";

  return {
    score,
    passed,
    statusTag,
    headline,
    reason,
    fixHint,
    fixLabel,
    fixAction,
    principles,
    posture,
    metrics: {
      ratioText: `${leftSharePct}% : ${rightSharePct}%`,
      seamText: `${seamGapPx}px`,
      turnsText: `${turns} 次`,
      scaleText: `${scaleRatio}×`,
      bodyLineText: dirs.body === "H" ? `${bodyCharsPerLine} 字/行` : `${bodyCharsPerLine} 字/列`,
    },
    cssSnippet,
  };
}
