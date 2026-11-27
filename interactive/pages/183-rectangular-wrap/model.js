// 183 矩形绕排 · 单真源几何排版与诊断模型
// 所有画布实绘行段、避让框、绕排示意箭头、五词探针与白话诊单均从 evaluateWrap(state) 读取同一份结果。

export const COLS_CHAR = 28; // 标准通栏每行容字数（全角中文基准）
export const TOTAL_ROWS = 13; // 版心基准行数

export const CONTEXTS = {
  poster: {
    id: "poster",
    label: "原海报 · 黄金色块",
    shortLabel: "原海报",
    blockTag: "核心色块",
    blockSub: "RECTANGULAR CORE",
    caption: "1:1 承袭 183 原海报深松绿展底、暖金矩形块与完整正文。",
    intro:
      "矩形绕排是一种以矩形图块为核心的版式方法，文字根据图块的边界进行环绕排布，使内容与图形形成稳定的视觉关系，同时提升信息的阅读效率与层次感。",
    leftPara:
      "在实际设计中，矩形图块可以是图片、色块或信息容器。通过设定图块的尺寸与位置，正文自动环绕其外侧，形成明确的阅读路径与空间分区。",
    rightPara:
      "这种版式能够有效组织较多的文字信息，避免版面单调，增强节奏与平衡感。它广泛应用于杂志内页、信息图表、课件内容页等多种场景中。",
    outro:
      "在排版时，需注意图块与文字之间的间距、行长控制以及对齐方式，以保持版面的统一性与专业感。合理的留白与环绕节奏，是实现高质量矩形绕排的关键。",
  },
  magazine: {
    id: "magazine",
    label: "杂志内页 · 建筑摄影",
    shortLabel: "杂志内页",
    blockTag: "摄影图块",
    blockSub: "FIG. 04 · SWISS PAVILION",
    caption: "模拟建筑季刊内页：矩形摄影图块贴齐栏边，护住长文回扫左缘。",
    intro:
      "苏黎世旧印刷厂改造而成的展厅保留了规整的混凝土柱网，采光天窗把正午光线切成清晰的矩形光斑，落在浅灰水磨石地面上。",
    leftPara:
      "摄影师刻意采用平视正立面构图，让窗框的横竖线条与页面的网格栏线相互呼应。进入杂志内页后，照片沿定界框与正文拉开固定避让距。",
    rightPara:
      "编辑部在单栏与双栏之间反复校样：当图片占据约四成栏宽并贴右停靠时，左侧正文始终保持笔直的阅读起点，视线无需来回寻找行首。",
    outro:
      "图注紧贴图片底缘并与正文基线网格对齐，下方续接段落在整倍行距处平稳恢复通栏宽度，让图文在克制的几何秩序里自然呼吸。",
  },
  courseware: {
    id: "courseware",
    label: "课件页面 · 要点信息盒",
    shortLabel: "课件页面",
    blockTag: "要点信息盒",
    blockSub: "KEY CONCEPT BOX",
    caption: "矩形图块不必只是照片——信息盒、公式卡与术语框同样遵循矩形绕排。",
    intro:
      "版式基础课程第三讲重点比较规则绕排与不规则绕排的工程成本。课堂讲义既要容纳概念解释，又要在同屏钉住一组核心检查数值。",
    leftPara:
      "把高优先级的核心原则收进一枚实底矩形信息盒，能够让听众先抓纲领再读展开。矩形外缘比斜边曲线更容易对齐课件的网格基准线。",
    rightPara:
      "讲义制作时最常见的失误，是把信息盒随意丢进段落正中却不设避让距，结果文字贴边撞框，细窄的侧栏把完整句子切得支离破碎。",
    outro:
      "只要锁定四边避让距并把侧边行长守在舒适区间，讲义就能在密集的课堂信息里建立清晰的模块分区与稳定可扫读的视觉层次。",
  },
};

// 开场默认错态：0/4 啃边劈栏（居中单流劈栏 + 2px 啃边 + 6字牙签行 + 底缘错拍）
export const INITIAL_STATE = {
  context: "poster",
  mode: "both", // "both" 跨栏单流 | "single" 贴边单侧 | "twocol" 双栏夹图 | "jump" 跳行排布
  bx: 0.5, // 图块中心归一化 X（0..1）
  by: 0.255, // 图块顶部归一化 Y（0..1，故意不落整数行）
  bw: 0.5, // 图块宽度占比（0.18..0.82）
  bh: 0.49, // 图块高度占比（0.20..0.68）
  standoffX: 2, // 横向避让距 px（0..44）
  standoffY: 2, // 纵向避让距 px（0..40）
  align: "left", // "left" 左齐右参差 176 | "justify" 两端对齐 179
  baselineLock: false, // 基线网锁 188
};

// 多组合法解（不只一种标准答案）
export const SOLUTIONS = {
  rightFlush: {
    id: "rightFlush",
    label: "贴右直缘解",
    note: "单栏最稳：图块贴右，正文左缘从头到尾笔直不抖动。",
    patch: {
      mode: "single",
      bx: 0.81,
      by: 3 / TOTAL_ROWS,
      bw: 0.38,
      bh: 6 / TOTAL_ROWS,
      standoffX: 18,
      standoffY: 14,
      align: "left",
      baselineLock: true,
    },
  },
  leftFlush: {
    id: "leftFlush",
    label: "贴左稳排解",
    note: "图块贴左作视觉锚点，右侧保留 15 字稳定单侧绕排。",
    patch: {
      mode: "single",
      bx: 0.19,
      by: 3 / TOTAL_ROWS,
      bw: 0.38,
      bh: 6 / TOTAL_ROWS,
      standoffX: 18,
      standoffY: 14,
      align: "left",
      baselineLock: true,
    },
  },
  twoCol: {
    id: "twoCol",
    label: "双栏夹图解",
    note: "两栏各自独立绕排居中窄图，不跨图跳句（原海报思路的舒适版）。",
    patch: {
      mode: "twocol",
      bx: 0.5,
      by: 3 / TOTAL_ROWS,
      bw: 0.28,
      bh: 7 / TOTAL_ROWS,
      standoffX: 14,
      standoffY: 14,
      align: "left",
      baselineLock: true,
    },
  },
  jumpWide: {
    id: "jumpWide",
    label: "大图跳行解",
    note: "图块宽过 60% 时果断跳行上下排布，拒绝侧边牙签窄行。",
    patch: {
      mode: "jump",
      bx: 0.5,
      by: 3 / TOTAL_ROWS,
      bw: 0.7,
      bh: 4 / TOTAL_ROWS,
      standoffX: 16,
      standoffY: 16,
      align: "left",
      baselineLock: true,
    },
  },
};

// 双向试错预设（验证各种玩错都会被模型实测检出）
export const FAULT_PRESETS = {
  opening: {
    id: "opening",
    label: "啃边劈栏",
    patch: { ...INITIAL_STATE },
  },
  collision: {
    id: "collision",
    label: "零距啃边",
    patch: {
      mode: "single",
      bx: 0.81,
      by: 3 / TOTAL_ROWS,
      bw: 0.38,
      bh: 6 / TOTAL_ROWS,
      standoffX: 0,
      standoffY: 0,
      align: "left",
      baselineLock: true,
    },
  },
  toothpick: {
    id: "toothpick",
    label: "牙签窄行",
    patch: {
      mode: "single",
      bx: 0.67,
      by: 3 / TOTAL_ROWS,
      bw: 0.66,
      bh: 6 / TOTAL_ROWS,
      standoffX: 16,
      standoffY: 14,
      align: "left",
      baselineLock: true,
    },
  },
  overGap: {
    id: "overGap",
    label: "留白漏气",
    patch: {
      mode: "single",
      bx: 0.81,
      by: 3 / TOTAL_ROWS,
      bw: 0.38,
      bh: 5 / TOTAL_ROWS,
      standoffX: 42,
      standoffY: 38,
      align: "left",
      baselineLock: true,
    },
  },
  river: {
    id: "river",
    label: "窄栏白河",
    patch: {
      mode: "single",
      bx: 0.74,
      by: 3 / TOTAL_ROWS,
      bw: 0.52,
      bh: 6 / TOTAL_ROWS,
      standoffX: 16,
      standoffY: 14,
      align: "justify",
      baselineLock: true,
    },
  },
  microStamp: {
    id: "microStamp",
    label: "邮票失核",
    patch: {
      mode: "single",
      bx: 0.89,
      by: 4 / TOTAL_ROWS,
      bw: 0.22,
      bh: 0.24,
      standoffX: 16,
      standoffY: 14,
      align: "left",
      baselineLock: true,
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function normalizeState(raw) {
  const s = { ...INITIAL_STATE, ...raw };
  s.bw = clamp(Number(s.bw) || 0.4, 0.2, 0.8);
  s.bh = clamp(Number(s.bh) || 0.46, 0.22, 0.68);
  s.standoffX = Math.round(clamp(Number(s.standoffX) || 0, 0, 44));
  s.standoffY = Math.round(clamp(Number(s.standoffY) || 0, 0, 40));

  const halfW = s.bw / 2;
  const minX = halfW;
  const maxX = 1 - halfW;
  s.bx = clamp(Number(s.bx) || 0.5, minX, maxX);

  // 贴边单侧模式下，靠近左右缘 0.045 内轻吸附，保持工程利落感
  if (s.mode === "single") {
    if (s.bx - minX < 0.045) s.bx = minX;
    else if (maxX - s.bx < 0.045) s.bx = maxX;
  }

  // 基线锁开启时，纵向起止吸附整数行
  const rowStep = 1 / TOTAL_ROWS;
  if (s.baselineLock) {
    const startRow = clamp(Math.round(s.by * TOTAL_ROWS), 0, TOTAL_ROWS - 3);
    const spanRows = clamp(Math.round(s.bh * TOTAL_ROWS), 3, Math.min(9, TOTAL_ROWS - startRow));
    s.by = startRow * rowStep;
    s.bh = spanRows * rowStep;
  } else {
    s.by = clamp(Number(s.by) || 0.24, 0, 1 - s.bh);
  }
  return s;
}

// 标点避头微调：取 n 个字符组成一行，避免行首落孤立句读
function takeChars(text, cursor, maxChars) {
  if (cursor >= text.length || maxChars <= 0) return { str: "", next: cursor };
  let count = Math.min(maxChars, text.length - cursor);
  let end = cursor + count;
  const openPunct = "「『（《【";
  const closePunct = "，。、；：！？）》」』";
  if (end < text.length && closePunct.includes(text[end]) && count > 2) {
    // 若下一字是收尾标点，适度收进本行或退一字避免行首落标点
    if (count + 1 <= maxChars + 1 && count >= 4) {
      end += 1;
    } else {
      end -= 1;
    }
  }
  if (end > cursor + 1 && openPunct.includes(text[end - 1])) {
    end -= 1;
  }
  return { str: text.slice(cursor, end), next: end };
}

// 计算单真源的实绘几何、行段数组与全量诊断
export function evaluateWrap(rawState) {
  const state = normalizeState(rawState);
  const ctx = CONTEXTS[state.context] || CONTEXTS.poster;

  // 图块归一化外边界 [0..1]
  const blockLeft = state.bx - state.bw / 2;
  const blockRight = state.bx + state.bw / 2;
  const blockTop = state.by;
  const blockBottom = state.by + state.bh;

  // 停靠判断（相对左右栏边）
  const flushLeft = blockLeft <= 0.015;
  const flushRight = blockRight >= 0.985;
  const dockSide = flushLeft ? "left" : flushRight ? "right" : blockLeft < 1 - blockRight ? "near-left" : blockRight > 1 - blockLeft ? "near-right" : "center";

  // 避让距折算为归一化比例（基于参考标准版心宽 620px、行高 32px）
  const REF_COL_PX = 620;
  const REF_ROW_PX = 32;
  const padXNorm = state.standoffX / REF_COL_PX;
  const padYNorm = state.standoffY / (TOTAL_ROWS * REF_ROW_PX);

  // 避让外框（外边缘贴栏时不向栏外推）
  const exclLeft = flushLeft ? 0 : clamp(blockLeft - padXNorm, 0, 1);
  const exclRight = flushRight ? 1 : clamp(blockRight + padXNorm, 0, 1);
  const exclTop = blockTop <= 0.01 ? 0 : clamp(blockTop - padYNorm, 0, 1);
  const exclBottom = blockBottom >= 0.99 ? 1 : clamp(blockBottom + padYNorm, 0, 1);

  // 哪些行与避让外框相交
  const rowH = 1 / TOTAL_ROWS;
  const wrapRows = [];
  for (let r = 0; r < TOTAL_ROWS; r++) {
    const rTop = r * rowH + rowH * 0.14;
    const rBot = (r + 1) * rowH - rowH * 0.14;
    const hits = rBot > exclTop && rTop < exclBottom;
    wrapRows.push(hits);
  }

  const firstWrapRow = wrapRows.indexOf(true);
  const lastWrapRow = wrapRows.lastIndexOf(true);
  const topFullRows = firstWrapRow === -1 ? TOTAL_ROWS : firstWrapRow;
  const bottomFullRows = lastWrapRow === -1 ? 0 : TOTAL_ROWS - 1 - lastWrapRow;
  const wrappedRowCount = wrapRows.filter(Boolean).length;

  // 可用左右宽度（归一化）
  const leftAvail = exclLeft;
  const rightAvail = 1 - exclRight;

  // 按模式生成每行的文字槽位 slots[]
  // 每个 slot: { row, x0, x1, charsCap, side: "full"|"left"|"right"|"colL"|"colR", stream: 0|1|2 }
  const rowSlots = [];
  let hasSplitSentence = false;
  let activeWrapSides = { top: topFullRows > 0, bottom: bottomFullRows > 0, left: false, right: false };

  for (let r = 0; r < TOTAL_ROWS; r++) {
    if (!wrapRows[r]) {
      rowSlots.push([{ row: r, x0: 0, x1: 1, side: "full", stream: r < firstWrapRow ? 0 : 2 }]);
      continue;
    }

    if (state.mode === "jump") {
      rowSlots.push([]); // 跳行：两侧不排字
      continue;
    }

    if (state.mode === "twocol") {
      const slots = [];
      const gutter = 0.03;
      const lEnd = Math.min(exclLeft, 0.5 - gutter / 2);
      const rStart = Math.max(exclRight, 0.5 + gutter / 2);
      if (lEnd >= 0.08) {
        slots.push({ row: r, x0: 0, x1: lEnd, side: "colL", stream: 1 });
        activeWrapSides.left = true;
      }
      if (1 - rStart >= 0.08) {
        slots.push({ row: r, x0: rStart, x1: 1, side: "colR", stream: 3 });
        activeWrapSides.right = true;
      }
      rowSlots.push(slots);
      continue;
    }

    if (state.mode === "single") {
      // 单侧绕排：只挑较宽的一侧排字（对应 InDesign Wrap to Largest Area / CSS float）
      if (leftAvail >= rightAvail && leftAvail >= 0.09) {
        rowSlots.push([{ row: r, x0: 0, x1: exclLeft, side: "left", stream: 1 }]);
        activeWrapSides.left = true;
      } else if (rightAvail >= 0.09) {
        rowSlots.push([{ row: r, x0: exclRight, x1: 1, side: "right", stream: 1 }]);
        activeWrapSides.right = true;
      } else {
        rowSlots.push([]);
      }
      continue;
    }

    // mode === "both"（跨栏单流：左右两侧只要够放 ≥ 2 字都塞字，极易触发居中劈栏跳槽！）
    const slots = [];
    if (leftAvail >= 0.085) {
      slots.push({ row: r, x0: 0, x1: exclLeft, side: "left", stream: 1 });
      activeWrapSides.left = true;
    }
    if (rightAvail >= 0.085) {
      slots.push({ row: r, x0: exclRight, x1: 1, side: "right", stream: 1 });
      activeWrapSides.right = true;
    }
    if (slots.length === 2) hasSplitSentence = true;
    rowSlots.push(slots);
  }

  // 把真实正文逐行灌进槽位，生成实绘 lines[]（带阅读顺序 idx）
  const lines = [];
  let seq = 0;

  if (state.mode === "twocol") {
    // 顶部通栏导语
    let c0 = 0;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (const sl of rowSlots[r]) {
        if (sl.stream === 0) {
          const cap = Math.max(1, Math.floor((sl.x1 - sl.x0) * COLS_CHAR));
          const { str, next } = takeChars(ctx.intro, c0, cap);
          c0 = next;
          if (str) lines.push({ ...sl, text: str, cap, chars: str.length, order: seq++ });
        }
      }
    }
    // 左独立栏（读完左栏全部行，再进入右独立栏——不跨图跳句！）
    let cL = 0;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (const sl of rowSlots[r]) {
        if (sl.stream === 1) {
          const cap = Math.max(1, Math.floor((sl.x1 - sl.x0) * COLS_CHAR));
          const { str, next } = takeChars(ctx.leftPara, cL, cap);
          cL = next;
          if (str) lines.push({ ...sl, text: str, cap, chars: str.length, order: seq++ });
        }
      }
    }
    // 右独立栏
    let cR = 0;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (const sl of rowSlots[r]) {
        if (sl.stream === 3) {
          const cap = Math.max(1, Math.floor((sl.x1 - sl.x0) * COLS_CHAR));
          const { str, next } = takeChars(ctx.rightPara, cR, cap);
          cR = next;
          if (str) lines.push({ ...sl, text: str, cap, chars: str.length, order: seq++ });
        }
      }
    }
    // 底部通栏收尾
    let c2 = 0;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (const sl of rowSlots[r]) {
        if (sl.stream === 2) {
          const cap = Math.max(1, Math.floor((sl.x1 - sl.x0) * COLS_CHAR));
          const { str, next } = takeChars(ctx.outro, c2, cap);
          c2 = next;
          if (str) lines.push({ ...sl, text: str, cap, chars: str.length, order: seq++ });
        }
      }
    }
  } else {
    // 单流顺序排布（full top -> wrapped rows -> full bottom）
    const fullText = ctx.intro + ctx.leftPara + ctx.rightPara + ctx.outro;
    let cursor = 0;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      const slots = rowSlots[r];
      for (let si = 0; si < slots.length; si++) {
        const sl = slots[si];
        const cap = Math.max(1, Math.floor((sl.x1 - sl.x0) * COLS_CHAR));
        const { str, next } = takeChars(fullText, cursor, cap);
        cursor = next;
        if (str) {
          lines.push({
            ...sl,
            text: str,
            cap,
            chars: str.length,
            order: seq++,
            splitJump: slots.length === 2 && si === 0,
          });
        }
      }
    }
  }

  // 从实绘 lines[] 统计关键排印指标（单真源！）
  const wrappedLines = lines.filter((l) => l.side !== "full");
  const fullLines = lines.filter((l) => l.side === "full");
  const wrappedCaps = wrappedLines.map((l) => l.cap);
  const minWrapChars = wrappedCaps.length ? Math.min(...wrappedCaps) : COLS_CHAR;
  const maxWrapChars = wrappedCaps.length ? Math.max(...wrappedCaps) : COLS_CHAR;
  const avgWrapChars = wrappedCaps.length
    ? +(wrappedCaps.reduce((a, b) => a + b, 0) / wrappedCaps.length).toFixed(1)
    : COLS_CHAR;

  const colLCaps = wrappedLines.filter((l) => l.side === "colL").map((l) => l.cap);
  const colRCaps = wrappedLines.filter((l) => l.side === "colR").map((l) => l.cap);
  const colLChars = colLCaps.length ? Math.min(...colLCaps) : 0;
  const colRChars = colRCaps.length ? Math.min(...colRCaps) : 0;

  // 左缘回扫跳变次数（评估左起跑线是否笔直）
  let leftMarginJumps = 0;
  let prevX0 = null;
  for (const l of lines) {
    if (prevX0 !== null && Math.abs(l.x0 - prevX0) > 0.02) leftMarginJumps++;
    prevX0 = l.x0;
  }

  // 检查是否产生尴尬的微缝空档（单侧模式下图块悬在半空未贴边，另一侧留下死白条）
  const unusedGap = state.mode === "single"
    ? Math.min(blockLeft, 1 - blockRight)
    : 0;
  const hasAwkwardFloatingGap = state.mode === "single" && unusedGap > 0.045 && unusedGap < 0.28;

  // 检查基线错拍（归一化起止是否贴近整数行）
  const topDrift = Math.abs(state.by * TOTAL_ROWS - Math.round(state.by * TOTAL_ROWS));
  const botDrift = Math.abs((state.by + state.bh) * TOTAL_ROWS - Math.round((state.by + state.bh) * TOTAL_ROWS));
  const baselineDriftRows = +Math.max(topDrift, botDrift).toFixed(2);
  const baselineAligned = state.baselineLock || baselineDriftRows <= 0.14;

  // 图块占比与留白占比
  const blockAreaPct = Math.round(state.bw * state.bh * 100);
  const blockWidthPct = Math.round(state.bw * 100);
  const standoffRatioEm = +(state.standoffX / 16).toFixed(2); // 以 16px 正文基准折算 em

  // 单行孤行检测（图块上方或下方刚好卡着 1 行孤行）
  const hasOrphanBand = (topFullRows === 1 || bottomFullRows === 1) && wrappedRowCount > 0;

  // 窄栏两端对齐白河检测
  const hasJustifyRiver = state.align === "justify" && state.mode !== "jump" && minWrapChars < 14;

  // 双向检出 8+ 类具体错态（按严重度排序）
  const faults = [];

  if (hasSplitSentence) {
    faults.push({
      id: "split-sentence",
      axis: "path",
      tag: "居中劈栏跳槽",
      title: `单段正文被矩形拦腰劈成左右两截（每侧仅 ${minWrapChars} 字）`,
      why: "同一句话被迫跳过中间的黄金矩形去右侧续读，眼睛会在「往下读左栏」还是「跨图读右栏」之间反复犹豫，阅读路径当场断链。",
      fix: "把矩形拖到左缘或右缘并切到「贴边单侧」，或者改用「双栏夹图」让左右各自成为独立段落。",
    });
  }

  if (state.mode === "twocol" && (colLChars < 8 || colRChars < 8)) {
    const narrowSide = colLChars < colRChars ? "左栏" : colRChars < colLChars ? "右栏" : "左右两栏";
    faults.push({
      id: "twocol-collapse",
      axis: "path",
      tag: "双栏偏塌",
      title: `双栏夹图下${narrowSide}被压到仅 ${Math.min(colLChars, colRChars)} 字/行`,
      why: "双栏夹图要求矩形足够修长且居于中缝附近；图块过宽或偏心时，窄栏会立刻退化成碎行。",
      fix: "把图块拖回中轴并将宽幅收窄到 26%–32%，或直接改为「贴边单侧」。",
    });
  }

  if (hasAwkwardFloatingGap) {
    faults.push({
      id: "floating-gap",
      axis: "path",
      tag: "悬空死白条",
      title: `图块未贴齐栏边，外侧悬出 ${Math.round(unusedGap * 100)}% 的无意义空条`,
      why: "单侧绕排把图块悬在离栏边差一点的位置，外缘留下一道既放不下字、又不成留白节奏的尴尬夹缝，破坏模块边界。",
      fix: "直接把黄金矩形拖到最左缘或最右缘贴齐版心边界。",
    });
  }

  // 避让距检测（跳行模式看纵向，其余模式横纵均看）
  const tooTightX = state.mode !== "jump" && state.standoffX < 8;
  const tooTightY = (topFullRows > 0 || bottomFullRows > 0) && state.standoffY < 8;
  const tooLooseX = state.mode !== "jump" && state.standoffX > 36;
  const tooLooseY = state.standoffY > 34;

  if (tooTightX || tooTightY) {
    faults.push({
      id: "collision",
      axis: "standoff",
      tag: "啃边碰撞",
      title: `避让距仅横 ${state.standoffX}px / 纵 ${state.standoffY}px，字脚紧贴矩形边缘`,
      why: "文字与图块缺少缓冲气口，笔画直接黏在色块硬边上，图底界线混在一起，视觉压迫感极强。",
      fix: "拖动图块外围虚线避让框（或推高避让距滑轨）到 12–24px（约 0.75–1.5em 经验区间）。",
    });
  } else if (tooLooseX || tooLooseY) {
    faults.push({
      id: "over-gap",
      axis: "standoff",
      tag: "留白漏气",
      title: `避让距拉到横 ${state.standoffX}px / 纵 ${state.standoffY}px，图块像孤岛脱离正文`,
      why: "过大的外推留白切断了图块与周边文字的亲密关系，还白白吞掉本可用于排字的宝贵行宽。",
      fix: "把横纵避让距收回 12–26px 区间，让留白刚好透气又不散架。",
    });
  }

  // 行长与模式匹配检测
  const measureMin = state.mode === "twocol" ? 9 : 11;
  if (state.mode !== "jump" && minWrapChars < measureMin) {
    faults.push({
      id: "toothpick",
      axis: "measure",
      tag: "牙签窄行",
      title: `侧边绕排行长压到仅 ${minWrapChars} 字/行，形成碎裂「牙签条」`,
      why: "行宽太窄时，每读三五个字就得急刹车折返下一行，中文词组频繁被拦腰截断，眼球回扫疲劳成倍上升。",
      fix: "把黄金矩形拖窄到 34%–44% 宽（让侧边行长回到 12 字以上），或者直接切到「跳行排布」上下排开。",
    });
  } else if (state.mode === "jump" && state.bw < 0.48) {
    faults.push({
      id: "small-jump",
      axis: "measure",
      tag: "小图空跳",
      title: `图块宽仅 ${blockWidthPct}% 却用跳行排布，左右大块留白空转`,
      why: "跳行排布适合宽过半栏的大图；小矩形强行占满整段高度，会让版面中间裂出大片无意义的空洞。",
      fix: "拉宽图块到 58% 以上撑住通栏气势，或切回「贴边单侧」让文字顺势填满旁侧。",
    });
  }

  if (hasJustifyRiver) {
    faults.push({
      id: "justify-river",
      axis: "measure",
      tag: "窄栏白河",
      title: `仅 ${minWrapChars} 字的窄绕排强开「两端对齐」，行内拉出不匀白缝`,
      why: "两端对齐需要足够字数去摊薄行末余白；侧边行长不足 14 字时强行拉齐，标点与字缝会被撑出突兀的空白通道。",
      fix: "把窄侧绕排改回「左齐右参差 (176)」，或收窄图块把行长扩到 14 字以上。",
    });
  }

  if (hasOrphanBand) {
    faults.push({
      id: "orphan-band",
      axis: "measure",
      tag: "孤行卡边",
      title: `图块${topFullRows === 1 ? "上方" : "下方"}仅剩 1 行孤立正文卡在边缘`,
      why: "单独一行孤零零贴在版头或版底，会让图块的起止显得像随手一放，破坏区块的稳定落脚感。",
      fix: "上下轻拖图块，让上方/下方要么干脆贴顶贴底，要么保留至少 2 行完整承接。",
    });
  }

  const totalRenderedChars = lines.reduce((sum, l) => sum + l.chars, 0);

  // 模块体量与基线检测
  if (blockAreaPct < 13) {
    faults.push({
      id: "too-small",
      axis: "module",
      tag: "图块过微",
      title: `矩形图块仅占版心 ${blockAreaPct}%，小如邮票撑不起模块核心`,
      why: "矩形绕排的核心是用图块建立主次与空间分区；图块缩得太微弱，反而只增加了文字拐弯的麻烦却没有换来视觉锚点。",
      fix: "拖大矩形宽或高，使核心占比落到 16%–44% 之间。",
    });
  } else if (blockAreaPct > 48 || totalRenderedChars < 120) {
    faults.push({
      id: "too-huge",
      axis: "module",
      tag: "图块塞爆",
      title: `图块霸占版心 ${blockAreaPct}%，正文被挤出可读空间`,
      why: "图块过大吞噬了过多文字行，整页变成单图海报而非图文共生的矩形绕排。",
      fix: "收窄或压低矩形图块，把至少一半以上版心还给正文流。",
    });
  }

  if (!baselineAligned) {
    faults.push({
      id: "off-baseline",
      axis: "module",
      tag: "基线错拍",
      title: `图块起止偏离行距网格约 ${Math.round(baselineDriftRows * 100)}% 行高`,
      why: "图块高度与上下避让距若不成整倍行距，下方恢复通栏的那一行就会半悬在网格之间，整页韵律出现微弱顿挫。",
      fix: "开启「基线网锁 (188)」，让图块顶齐帽高、底落整倍行距基线。",
    });
  }

  // 汇总四项主检（单真源，直接驱动 0/4..4/4 与五词探针）
  const pathOk = !faults.some((f) => f.axis === "path");
  const standoffOk = !faults.some((f) => f.axis === "standoff");
  const measureOk = !faults.some((f) => f.axis === "measure");
  const moduleOk = !faults.some((f) => f.axis === "module");

  const score = [pathOk, standoffOk, measureOk, moduleOk].filter(Boolean).length;
  const passed = score === 4;

  // 识别当前命中的合法解风格
  let passVariant = "稳排成立";
  let passTitle = "四项规则齐备，图块与正文形成清晰的模块秩序";
  let passWhy = "文字沿规整的矩形外边界利落绕排，避让距透气均匀，每行字数落在舒适区间且底缘精准落回基线网格。";
  if (passed) {
    if (state.mode === "jump") {
      passVariant = "大图跳行解";
      passTitle = `宽幅 ${blockWidthPct}% 图块采用跳行排布，通栏读感零断碎`;
      passWhy = "当图块超过半栏宽度时，果断放弃侧边窄条、让正文在上下整倍行距处断续，是版式工程中最克制也最稳妥的选择。";
    } else if (state.mode === "twocol") {
      passVariant = "双栏夹图解";
      passTitle = `双栏独立夹住 ${blockWidthPct}% 中央矩形，两栏各守 ${minWrapChars} 字以上`;
      passWhy = "左右两栏各自独立流动、不跨图跳句——这正是把 183 原海报概念升级为真实杂志跨栏版式的正确路径。";
    } else if (flushRight) {
      passVariant = "贴右直缘解";
      passTitle = `图块贴右、左缘全程笔直（绕排 ${minWrapChars} 字/行）`;
      passWhy = "贴右停靠保住了中文阅读最关键的左侧垂直起跑线，眼睛每次换行回扫都落在同一条竖线上，同时右侧由暖金矩形锚定重心。";
    } else if (flushLeft) {
      passVariant = "贴左稳排解";
      passTitle = `图块贴左定锚，右侧单侧绕排 ${minWrapChars} 字/行秩序清晰`;
      passWhy = "图块贴齐左栏外缘，只引入一次干脆的直线内缩，远比不规则轮廓绕排（182）的锯齿阶梯更易扫读。";
    }
  }

  const primary = faults[0] || null;
  const statusShort = passed ? `4/4 · ${passVariant}` : `${score}/4 · ${primary.tag}`;

  // 秩序档位（不伪精确：使用明确档位 + 示意标注）
  const orderTier = passed
    ? "清晰有序"
    : score === 3
      ? "接近稳排"
      : score === 2
        ? "局部受阻"
        : score === 1
          ? "秩序松动"
          : "严重破序";

  // 映射原海报 5 个关键词（区块 / 模块 / 留白 / 环绕 / 秩序）实时状态
  const blockAreaOk = blockAreaPct >= 13 && blockAreaPct <= 48 && totalRenderedChars >= 120;
  const keywordsStatus = [
    {
      word: "区块",
      ok: blockAreaOk,
      reading: blockAreaPct < 13 ? `偏微 ${blockAreaPct}%` : blockAreaPct > 48 || totalRenderedChars < 120 ? `塞爆 ${blockAreaPct}%` : `占比 ${blockAreaPct}%`,
    },
    {
      word: "模块",
      ok: baselineAligned && !hasAwkwardFloatingGap,
      reading: !baselineAligned ? "未锁基线" : hasAwkwardFloatingGap ? "未贴栏边" : "对齐网格",
    },
    {
      word: "留白",
      ok: standoffOk,
      reading: !standoffOk ? (tooTightX || tooTightY ? `啃边 ${state.standoffX}px` : `漏气 ${state.standoffX}px`) : `${state.standoffX}×${state.standoffY}px`,
    },
    {
      word: "环绕",
      ok: measureOk && pathOk,
      reading: hasSplitSentence
        ? "跨图劈栏"
        : !measureOk
          ? (state.mode === "jump" ? "小图空跳" : hasJustifyRiver ? "窄栏白河" : `${minWrapChars}字过窄`)
          : state.mode === "jump"
            ? "上下跳行"
            : `${minWrapChars}字/行`,
    },
    {
      word: "秩序",
      ok: passed,
      reading: orderTier,
    },
  ];

  // 四条顺时针绕排示意箭头状态（1:1 驱动右侧「绕排示意」SVG！）
  const schematicArrows = {
    top: {
      active: activeWrapSides.top,
      status: !activeWrapSides.top ? "idle" : tooTightY ? "err" : tooLooseY ? "warn" : topFullRows === 1 ? "warn" : "ok",
    },
    right: {
      active: activeWrapSides.right,
      status: !activeWrapSides.right
        ? "idle"
        : hasSplitSentence || tooTightX || (state.mode !== "jump" && minWrapChars < measureMin && (activeWrapSides.right && (state.mode === "twocol" ? colRChars < 9 : !activeWrapSides.left)))
          ? "err"
          : tooLooseX || hasJustifyRiver
            ? "warn"
            : "ok",
    },
    bottom: {
      active: activeWrapSides.bottom,
      status: !activeWrapSides.bottom ? "idle" : tooTightY || !baselineAligned ? "err" : tooLooseY || bottomFullRows === 1 ? "warn" : "ok",
    },
    left: {
      active: activeWrapSides.left,
      status: !activeWrapSides.left
        ? "idle"
        : hasSplitSentence || tooTightX || (state.mode !== "jump" && minWrapChars < measureMin && (activeWrapSides.left && (state.mode === "twocol" ? colLChars < 9 : !activeWrapSides.right)))
          ? "err"
          : tooLooseX || hasJustifyRiver
            ? "warn"
            : "ok",
    },
  };

  return {
    state,
    ctx,
    rect: { left: blockLeft, right: blockRight, top: blockTop, bottom: blockBottom, width: state.bw, height: state.bh },
    excl: { left: exclLeft, right: exclRight, top: exclTop, bottom: exclBottom },
    dockSide,
    flushLeft,
    flushRight,
    lines,
    wrapRows,
    topFullRows,
    bottomFullRows,
    wrappedRowCount,
    minWrapChars,
    maxWrapChars,
    avgWrapChars,
    colLChars,
    colRChars,
    leftMarginJumps,
    blockAreaPct,
    blockWidthPct,
    standoffRatioEm,
    baselineAligned,
    baselineDriftRows,
    hasSplitSentence,
    hasJustifyRiver,
    hasOrphanBand,
    faults,
    primary,
    axes: { pathOk, standoffOk, measureOk, moduleOk },
    score,
    passed,
    statusShort,
    orderTier,
    headline: passed ? passTitle : primary.title,
    explanation: passed ? passWhy : primary.why,
    actionHint: passed
      ? "按 Space（或点「视线验真」）观察完整扫视轨迹；也可以试着切到「双栏夹图」或「大图跳行」体验别的合法解。"
      : primary.fix,
    keywordsStatus,
    schematicArrows,
  };
}
