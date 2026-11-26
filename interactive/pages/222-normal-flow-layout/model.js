// 222 普通流布局 · 单真源文档流布局引擎（画面绘制、DOM 诊断卡、01/02/03 实时探针共用同一份几何计算）

export const SPECIMENS = {
  poster: {
    id: "poster",
    name: "原海报长文",
    short: "原海报",
    caption: "单列内容自然流动的典型示例",
    blocks: [
      {
        domIdx: 0,
        id: "h1",
        tag: "<h1>",
        label: "主标题",
        shortTag: "标题",
        kind: "heading",
        text: "普通流布局：让阅读顺着水势走",
      },
      {
        domIdx: 1,
        id: "lead",
        tag: "<p>",
        label: "导语段",
        shortTag: "导语",
        kind: "paragraph",
        text: "内容按自然顺序自上而下依次展开，读者无需在画面里寻找下一站，每一行折行后自然把下方段落推开，绝不会彼此遮挡。",
      },
      {
        domIdx: 2,
        id: "fig",
        tag: "<figure>",
        label: "双峰插图",
        shortTag: "插图",
        kind: "figure",
        motif: "mountain",
        figCaption: "图 1 · 随流占位的插图块",
      },
      {
        domIdx: 3,
        id: "body",
        tag: "<p>",
        label: "承接段",
        shortTag: "承接",
        kind: "paragraph",
        text: "标题、段落与留白构成稳定的节拍，当插图乖乖留在文档流里占位，文字总在安全距离外接续阅读，理解与记忆因此连成一条线。",
      },
      {
        domIdx: 4,
        id: "note",
        tag: "<aside>",
        label: "要点提示",
        shortTag: "要点",
        kind: "takeaway",
        text: "要点提示：文章、说明文与报告最宜顺着普通流单列展开，让视线专注而省力。",
      },
    ],
  },
  docs: {
    id: "docs",
    name: "技术文档",
    short: "文档",
    caption: "技术手册中的顺序步骤与代码说明流",
    blocks: [
      {
        domIdx: 0,
        id: "h1",
        tag: "<h1>",
        label: "接口标题",
        shortTag: "标题",
        kind: "heading",
        text: "快速开始：零定位搭建文档页",
      },
      {
        domIdx: 1,
        id: "lead",
        tag: "<p>",
        label: "前置说明",
        shortTag: "前置",
        kind: "paragraph",
        text: "先按逻辑写好语义化 HTML 骨架，让键盘 Tab 与读屏器顺着源码顺序访问，再为单列正文容器加上舒适的最大行宽上限。",
      },
      {
        domIdx: 2,
        id: "fig",
        tag: "<figure>",
        label: "流向图示",
        shortTag: "图示",
        kind: "figure",
        motif: "diagram",
        figCaption: "图 1 · BFC 块轴纵向堆叠示意图",
      },
      {
        domIdx: 3,
        id: "body",
        tag: "<p>",
        label: "步骤正文",
        shortTag: "步骤",
        kind: "paragraph",
        text: "保持所有内容块默认 static 与自动高度，当接口说明增删一行文字或用户在手机端放大字号时，整页会自动重排而不发生遮盖。",
      },
      {
        domIdx: 4,
        id: "note",
        tag: "<aside>",
        label: "迁移提醒",
        shortTag: "提醒",
        kind: "takeaway",
        text: "要点提示：只有确认需要并排或悬浮时，再局部引入弹性盒、网格或定位。",
      },
    ],
  },
  report: {
    id: "report",
    name: "研究报告",
    short: "报告",
    caption: "长篇分析报告的单一论证脉络",
    blocks: [
      {
        domIdx: 0,
        id: "h1",
        tag: "<h1>",
        label: "报告标题",
        shortTag: "标题",
        kind: "heading",
        text: "单列线性叙事对精读专注的影响",
      },
      {
        domIdx: 1,
        id: "lead",
        tag: "<p>",
        label: "摘要段",
        shortTag: "摘要",
        kind: "paragraph",
        text: "面向深度阅读的研究报告往往包含论点、数据图与推论。单列顺序排布能消除多栏分岔的跳转犹豫，让论证链条环环相扣。",
      },
      {
        domIdx: 2,
        id: "fig",
        tag: "<figure>",
        label: "趋势附图",
        shortTag: "附图",
        kind: "figure",
        motif: "chart",
        figCaption: "图 1 · 随行宽变化的换行回扫负载示意",
      },
      {
        domIdx: 3,
        id: "body",
        tag: "<p>",
        label: "结论段",
        shortTag: "结论",
        kind: "paragraph",
        text: "把单行中文控制在约十八至三十六字之间，并让标题上留白大于下留白，读者在滚动翻页时便能清晰辨认章节起止。",
      },
      {
        domIdx: 4,
        id: "note",
        tag: "<aside>",
        label: "研究建议",
        shortTag: "建议",
        kind: "takeaway",
        text: "要点提示：把结语放在论证之后，避免视觉强行提置造成语义与源码顺序分裂。",
      },
    ],
  },
};

export const INITIAL_BROKEN_STATE = {
  specimen: "poster",
  measurePct: 96, // 通栏超宽（≈ 54 汉字/行）
  rhythm: 4, // 节拍粘连 4px
  visualOrder: [0, 4, 1, 2, 3], // ⑤ 结语被视觉强行提至 ② 导语之前（逆流交叉）
  figureFlow: "absolute", // ③ 插图脱离普通流，④ 承接段向上撞进图底
  fixedHeight: false,
  multiCol: false,
  equalHeadingGap: false,
};

export const VALID_PRESETS = {
  standard: {
    id: "standard",
    label: "原海报标准流",
    patch: {
      measurePct: 62,
      rhythm: 20,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  compact: {
    id: "compact",
    label: "紧致文档流",
    patch: {
      measurePct: 54,
      rhythm: 14,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  airy: {
    id: "airy",
    label: "舒朗长文流",
    patch: {
      measurePct: 68,
      rhythm: 30,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
};

export const FAIL_PRESETS = {
  overlap: {
    id: "overlap",
    label: "插图脱流",
    patch: {
      measurePct: 62,
      rhythm: 20,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "absolute",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  reverse: {
    id: "reverse",
    label: "顺序逆流",
    patch: {
      measurePct: 62,
      rhythm: 20,
      visualOrder: [0, 4, 1, 2, 3],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  wide: {
    id: "wide",
    label: "通栏超宽",
    patch: {
      measurePct: 97,
      rhythm: 20,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  narrow: {
    id: "narrow",
    label: "狭栏断句",
    patch: {
      measurePct: 30,
      rhythm: 20,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  fixedH: {
    id: "fixedH",
    label: "定高溢出",
    patch: {
      measurePct: 50,
      rhythm: 18,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: true,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
  crushed: {
    id: "crushed",
    label: "节拍断层",
    patch: {
      measurePct: 62,
      rhythm: 52,
      visualOrder: [0, 1, 2, 3, 4],
      figureFlow: "static",
      fixedHeight: false,
      multiCol: false,
      equalHeadingGap: false,
    },
  },
};

export function createInitialState() {
  return {
    ...INITIAL_BROKEN_STATE,
    visualOrder: [...INITIAL_BROKEN_STATE.visualOrder],
  };
}

// 真实折行函数（按中英文宽度换算，严格受限于当前画布内实际可用像素宽，绝不超出蓝色微网页边界）
function charWeight(ch) {
  if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) return 1.02;
  if (ch === " ") return 0.36;
  return 0.58;
}

export function wrapChineseText(text, maxUnits) {
  const limit = Math.max(6, maxUnits);
  const lines = [];
  let cur = "";
  let w = 0;
  for (const ch of text) {
    const cw = charWeight(ch);
    if (w + cw > limit && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      w = cw;
    } else {
      cur += ch;
      w += cw;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// 依据真实状态算出：每个块的像素矩形、折行数、逆流交叉数、实测叠压面积、四项状态与白话诊单
export function computeFlowLayout(state, view = { w: 720, h: 490, compact: false }) {
  const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
  const compact = !!view.compact || view.w < 460;

  // 画布内坐标系：左留 DOM 流序轨，顶留栏宽标尺，中右为单列微网页卡片
  const railW = compact ? 50 : 78;
  const topRulerH = compact ? 36 : 42;
  const padR = compact ? 16 : 22;
  const maxDocW = Math.max(210, view.w - railW - padR - 14);
  const minDocW = Math.round(maxDocW * 0.32);

  // measurePct (28..100) 映射到物理微网页栏宽与对应真实桌面等效宽度（180..960px / 12..56 汉字/行）
  const pct = Math.max(28, Math.min(100, Number(state.measurePct) || 62));
  const norm = (pct - 28) / 72;
  const docW = Math.round(minDocW + norm * (maxDocW - minDocW));
  const docX = Math.round(railW + 10 + (maxDocW - docW) * (compact ? 0.30 : 0.42));
  const docY = topRulerH + 10;

  const equivPx = Math.round(180 + norm * 780);
  const charsPerLine = Math.round(12 + norm * 44);
  const innerPadX = compact ? 11 : 18;
  const innerPadY = compact ? 11 : 15;
  const contentW = Math.max(100, docW - innerPadX * 2);

  // 竖向节拍（4..56px 映射到画布逻辑像素）
  const rhythmPx = Math.max(4, Math.min(56, Math.round(Number(state.rhythm) || 4)));
  const gapScale = compact ? 0.46 : 0.62;
  const baseGap = Math.max(3, Math.round(rhythmPx * gapScale));
  const headTopGap = state.equalHeadingGap ? baseGap : Math.round(baseGap * 1.38);
  const headBotGap = state.equalHeadingGap ? baseGap : Math.max(3, Math.round(baseGap * 0.68));

  // 按实际像素宽度折行，确保文字永远严丝合缝落在微网页卡片内部！
  const paraFontPx = compact ? 9.5 : 11;
  const headFontPx = compact ? 11.5 : 13.5;
  const noteFontPx = compact ? 9.5 : 10.5;
  const lineH = compact ? 12.5 : 14.5;

  const order = Array.isArray(state.visualOrder) && state.visualOrder.length === 5
    ? state.visualOrder
    : [0, 1, 2, 3, 4];

  // 预检是否有顺序逆流，供 takeaway 预留顶部标签条防压字
  let preInversions = 0;
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[i] > order[j]) preInversions++;
    }
  }

  const blocks = [];
  let cursorY = docY + innerPadY;
  let ghostFigureRect = null;

  const isMultiCol = !!state.multiCol;
  const colGap = 10;
  const halfW = Math.floor((contentW - colGap) / 2);

  let leftColY = cursorY;
  let rightColY = cursorY;

  order.forEach((domIdx, visIdx) => {
    const src = spec.blocks[domIdx];
    const isAbsFig = src.kind === "figure" && state.figureFlow === "absolute";
    const isFixedPara = src.kind === "paragraph" && state.fixedHeight;

    let x = docX + innerPadX;
    let w = contentW;
    let lines = [];
    let naturalH = 34;

    if (isMultiCol && visIdx >= 1 && visIdx <= 3) {
      w = halfW;
      x = visIdx % 2 === 1 ? docX + innerPadX : docX + innerPadX + halfW + colGap;
    }

    if (src.kind === "heading") {
      const units = Math.max(7, Math.floor((w - 6) / headFontPx));
      lines = wrapChineseText(src.text, units);
      naturalH = Math.round((compact ? 17 : 21) + lines.length * (compact ? 14 : 16));
    } else if (src.kind === "paragraph") {
      const units = Math.max(7, Math.floor((w - 10) / paraFontPx));
      lines = wrapChineseText(src.text, units);
      naturalH = Math.round(11 + lines.length * lineH);
    } else if (src.kind === "figure") {
      const figH = Math.round(Math.max(compact ? 60 : 76, Math.min(compact ? 84 : 112, w * 0.28)));
      naturalH = figH;
    } else if (src.kind === "takeaway") {
      const units = Math.max(7, Math.floor((w - 30) / noteFontPx));
      lines = wrapChineseText(src.text, units);
      const invertedExtra = preInversions > 0 && visIdx !== domIdx ? 20 : 0;
      naturalH = Math.round(14 + invertedExtra + lines.length * lineH);
    }

    const lockedH = isFixedPara ? (compact ? 26 : 32) : naturalH;
    const boxH = isFixedPara ? Math.min(naturalH, lockedH) : naturalH;
    const overflowPx = isFixedPara ? Math.max(0, naturalH - lockedH) : 0;

    let y = cursorY;
    if (isMultiCol && visIdx >= 1 && visIdx <= 3) {
      if (visIdx === 1) {
        leftColY = cursorY;
        rightColY = cursorY;
      }
      if (visIdx % 2 === 1) {
        y = leftColY;
        leftColY += boxH + baseGap;
      } else {
        y = rightColY;
        rightColY += boxH + baseGap;
      }
      if (visIdx === 3) {
        cursorY = Math.max(leftColY, rightColY);
      }
    } else if (isAbsFig) {
      const pinnedY = docY + innerPadY + (compact ? 82 : 92);
      const figW = Math.round(Math.min(contentW * 0.84, Math.max(144, contentW * 0.72)));
      const figX = Math.round(docX + innerPadX + (contentW - figW) * 0.56);
      ghostFigureRect = { x: docX + innerPadX, y: cursorY - 2, w: contentW, h: 12 };
      blocks.push({
        ...src,
        visIdx,
        x: figX,
        y: pinnedY,
        w: figW,
        h: naturalH,
        textBottomY: pinnedY + naturalH,
        lines,
        overflowPx: 0,
        outOfFlow: true,
        fixedClamped: false,
      });
      return;
    } else {
      if (visIdx > 0) {
        const prevSrc = spec.blocks[order[visIdx - 1]];
        const prevWasHeading = prevSrc && prevSrc.kind === "heading";
        const prevWasAbs = prevSrc && prevSrc.kind === "figure" && state.figureFlow === "absolute";
        if (!prevWasAbs) {
          cursorY += prevWasHeading ? headBotGap : (src.kind === "heading" ? headTopGap : baseGap);
        }
      }
      y = cursorY;
      cursorY += boxH;
    }

    blocks.push({
      ...src,
      visIdx,
      x,
      y,
      w,
      h: boxH,
      textBottomY: y + naturalH,
      lines,
      overflowPx,
      outOfFlow: false,
      fixedClamped: isFixedPara && overflowPx > 0,
    });
  });

  const maxBlockBottom = blocks.reduce((m, b) => Math.max(m, b.textBottomY, b.y + b.h), docY + 120);
  const docH = Math.round(maxBlockBottom - docY + innerPadY);

  // 1) 真实几何重叠检测（正确识别被压住的「流内受害块」，绝不再把插图自身误报为被压块！）
  const overlaps = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      const aBot = Math.max(a.y + a.h, a.textBottomY);
      const bBot = Math.max(b.y + b.h, b.textBottomY);
      const ix0 = Math.max(a.x, b.x);
      const iy0 = Math.max(a.y, b.y);
      const ix1 = Math.min(a.x + a.w, b.x + b.w);
      const iy1 = Math.min(aBot, bBot);
      if (ix1 - ix0 > 2 && iy1 - iy0 > 2) {
        const area = (ix1 - ix0) * (iy1 - iy0);
        const victim = a.outOfFlow ? b : (b.outOfFlow ? a : b);
        const vBot = Math.max(victim.y + victim.h, victim.textBottomY);
        const victimArea = Math.max(1, victim.w * Math.max(1, vBot - victim.y));
        const ratio = Math.min(100, Math.round((area / victimArea) * 100));
        overlaps.push({
          aId: a.id,
          bId: b.id,
          victimId: victim.id,
          victimLabel: victim.label,
          cause: (a.outOfFlow || b.outOfFlow) ? "absolute" : "overflow",
          rect: { x: ix0, y: iy0, w: ix1 - ix0, h: iy1 - iy0 },
          ratio,
        });
      }
    }
  }

  // 2) 真实 DOM 序 vs 视觉序逆流交叉检测
  const byDom = [...blocks].sort((a, b) => a.domIdx - b.domIdx);
  let inversions = 0;
  const invertedIds = new Set();
  for (let i = 0; i < byDom.length; i++) {
    for (let j = i + 1; j < byDom.length; j++) {
      if (byDom[i].y > byDom[j].y + 4) {
        inversions++;
        invertedIds.add(byDom[i].id);
        invertedIds.add(byDom[j].id);
      }
    }
  }

  // 3) 4 项单真源检查（双向可错）
  const orderOk = inversions === 0;
  const containmentOk = overlaps.length === 0 && state.figureFlow === "static" && blocks.every((b) => b.overflowPx === 0);
  const rhythmOk = rhythmPx >= 12 && rhythmPx <= 38 && !state.equalHeadingGap;
  const measureOk = !isMultiCol && charsPerLine >= 18 && charsPerLine <= 36;

  const passedCount = [orderOk, containmentOk, rhythmOk, measureOk].filter(Boolean).length;

  // 4) 精准 8 类错态分级
  let primaryIssue = "valid";
  let badge = "4/4 · 自然顺流";
  let headline = "普通流成立：顺序、占位、节拍与行长同频";
  let detail = `五个块严格按 DOM #1→#5 单列推进，零叠压、块距 ${rhythmPx}px、约 ${charsPerLine} 汉字/行，视线、键盘与读屏器共享同一条清晰路径。`;
  let actionHint = "继续横拖栏宽或点「试错」按钮，观察普通流在哪些边界条件下会被打破。";

  if (!containmentOk) {
    const absOvs = overlaps.filter((o) => o.cause === "absolute");
    const fixedOv = blocks.find((b) => b.overflowPx > 0);
    if (state.figureFlow === "absolute") {
      primaryIssue = "out_of_flow";
      const worst = absOvs.sort((x, y) => y.ratio - x.ratio)[0];
      const names = [...new Set(absOvs.map((o) => o.victimLabel))].slice(0, 2).join("与");
      badge = `${passedCount}/4 · 脱流${worst ? `压字 ${worst.ratio}%` : ""}`;
      headline = worst
        ? `插图脱离普通流，直接压住「${names}」（遮挡 ${worst.ratio}%）`
        : "插图设为 position: absolute 脱离普通流，失去占位";
      detail = "一旦脱离普通流，浏览器就不再为插图保留垂直高度。下方的正文块顺势顶了上来，直接钻进图片背面——这就是不用普通流占位时最常见的遮字事故。";
      actionHint = "点画布里插图上的红色「点此归流」标签（或按 F 键），把插图请回普通流。";
    } else if (fixedOv) {
      primaryIssue = "fixed_overflow";
      badge = `${passedCount}/4 · 定高溢出 ${fixedOv.overflowPx}px`;
      headline = `段落锁死固定高度，折行后文字溢出 ${fixedOv.overflowPx}px 撞进下一块`;
      detail = "普通流之所以永不叠字，靠的是块默认使用 height: auto——内容变长或栏宽变窄时，盒高会自动撑开并把兄弟块往下推。强行写死像素高度就毁掉了自动让位机制。";
      actionHint = "关闭「定高陷阱」开关（或点击画布上的红色溢出标签），恢复 height: auto。";
    }
  } else if (!orderOk) {
    primaryIssue = "order_reversed";
    badge = `${passedCount}/4 · 逆流 ${inversions} 处`;
    headline = `视觉顺序违背 DOM 源码顺序，流线出现 ${inversions} 处回折`;
    detail = "源码里「要点提示 #5」在文末，视觉上却被强行提到了「导语段 #2」前面。鼠标阅读、键盘 Tab 与屏幕阅读器（WCAG 1.3.2）走出相反顺序，逻辑瞬间断裂。";
    actionHint = "点击画布里带红标「逆流」的块（或按 O 键），将视觉顺序对齐回 DOM #1→#5。";
  } else if (isMultiCol) {
    primaryIssue = "multi_col";
    badge = `${passedCount}/4 · 双栏断流`;
    headline = "强行拆成双栏后，单列连续阅读路径被打成左右分岔";
    detail = "原本顺着一条纵轴自然推进的导语、插图与承接段被硬拆到左右两列，读者必须停下来判断先看左还是先看右，连续理解被打断。";
    actionHint = "关闭「强制双栏」开关，把长文内容收拢回单一自然阅读流。";
  } else if (!measureOk) {
    if (charsPerLine > 36) {
      primaryIssue = "too_wide";
      badge = `${passedCount}/4 · 超宽 ${charsPerLine} 字/行`;
      headline = `通栏拉到约 ${charsPerLine} 汉字/行，换行回扫极易串行`;
      detail = "纯普通流如果不加 max-inline-size 限制，块级元素会默认撑满 100% 宽度。超过 WCAG 1.4.8 建议的 40 汉字上限后，眼睛从行尾折回下一行开头时容易找错行。";
      actionHint = "在画布上向左横拖（或调低「单列栏宽」滑杆），把行长收进 18–36 汉字/行。";
    } else {
      primaryIssue = "too_narrow";
      badge = `${passedCount}/4 · 狭栏 ${charsPerLine} 字/行`;
      headline = `栏宽挤到约 ${charsPerLine} 汉字/行，长句被切得支离破碎`;
      detail = "行宽过窄时，一句话被迫断成五六行短截，眼睛每读三四个字就要频繁换行，垂直滚动距离翻倍，阅读节奏变得急促零碎。";
      actionHint = "在画布上向右横拖（或拉大「单列栏宽」滑杆），舒展到 18–36 汉字/行。";
    }
  } else if (!rhythmOk) {
    if (rhythmPx < 12) {
      primaryIssue = "rhythm_crushed";
      badge = `${passedCount}/4 · 粘连 ${rhythmPx}px`;
      headline = `块间留白压扁到 ${rhythmPx}px，标题、段落与插图糊成一片`;
      detail = "普通流虽然自带先后顺序，但如果缺少垂直呼吸间距，视觉停顿会消失——读者一眼望去分不出哪里是章节切换、哪里是段落收束。";
      actionHint = "把「垂直节拍」滑杆拉到 14–36px 区间，给标题与段落留出清晰的节奏停顿。";
    } else if (rhythmPx > 38) {
      primaryIssue = "rhythm_fractured";
      badge = `${passedCount}/4 · 断层 ${rhythmPx}px`;
      headline = `块间空隙拉开到 ${rhythmPx}px，上下段像互不相关的孤岛`;
      detail = "垂直间距过大时，插图和承接段之间的视觉亲密性被拉断，读者滚一屏只能看到寥寥两块，连贯感反而被空洞稀释。";
      actionHint = "把「垂直节拍」滑杆回调到 14–36px，让内容既透气又紧密相接。";
    } else {
      primaryIssue = "rhythm_equal";
      badge = `${passedCount}/4 · 标题失归属`;
      headline = "标题上下间距完全相等，看不清它属于上一段还是下一段";
      detail = "健康的普通流节奏需要标题「上大下小」的不对称留白，靠亲密性把标题牢牢粘在它统领的正文上方。";
      actionHint = "恢复标题不对称间距（上大下小），立刻明确章节归属。";
    }
  }

  const pillars = {
    order: {
      ok: orderOk && containmentOk,
      tag: !containmentOk
        ? (state.figureFlow === "absolute" ? "插图脱流" : "定高撞段")
        : (!orderOk ? `逆流 ${inversions} 处` : "DOM #1→#5 顺流"),
    },
    rhythm: {
      ok: rhythmOk,
      tag: rhythmPx < 12
        ? `粘连 ${rhythmPx}px`
        : rhythmPx > 38
          ? `断层 ${rhythmPx}px`
          : state.equalHeadingGap
            ? "上下等距"
            : `节拍 ${rhythmPx}px`,
    },
    continuity: {
      ok: measureOk && containmentOk,
      tag: isMultiCol
        ? "双栏分岔"
        : charsPerLine > 36
          ? `超宽 ${charsPerLine} 字/行`
          : charsPerLine < 18
            ? `狭栏 ${charsPerLine} 字/行`
            : `${charsPerLine} 字/行 · 单列`,
    },
  };

  const sweepPath = byDom.map((b) => ({
    domIdx: b.domIdx,
    id: b.id,
    label: b.label,
    x: b.x + Math.min(b.w * 0.5, 110),
    y: b.y + Math.min(b.h * 0.5, 28),
    topY: b.y,
    botY: b.y + b.h,
    outOfFlow: b.outOfFlow,
    inverted: invertedIds.has(b.id),
  }));

  return {
    spec,
    view,
    compact,
    railW,
    topRulerH,
    docX,
    docY,
    docW,
    docH,
    minDocW,
    maxDocW,
    innerPadX,
    innerPadY,
    equivPx,
    charsPerLine,
    rhythmPx,
    paraFontPx,
    headFontPx,
    noteFontPx,
    lineH,
    blocks,
    byDom,
    ghostFigureRect,
    overlaps,
    inversions,
    invertedIds,
    sweepPath,
    checks: { orderOk, containmentOk, rhythmOk, measureOk },
    passedCount,
    isValid: passedCount === 4,
    primaryIssue,
    badge,
    headline,
    detail,
    actionHint,
    pillars,
  };
}
