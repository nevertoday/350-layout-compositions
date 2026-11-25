// 186 首行缩进 · 活字排字手盘模型、整字格避头尾断行器与实时视觉诊断
// 2D Canvas 排字盘、原海报「缩进示意」透视图与底部读数带共用同一份排版计算结果。

export const MAX_QUADS = 4;
export const INITIAL_QUADS = [0, 0, 0, 0];

// 四段纯全角汉字样稿：
// 第 1、2 段各恰好 60 字（30 字/栏 = 2 满行，20 字/栏 = 3 满行，且无行首禁则标点），
// 0 铅空时自然齐尾满行、与下段无缝粘连——不用任何假拉伸。
export const GALLEY_PARAGRAPHS = [
  "在版式设计与日常排版中，首行缩进是最基础的文本组织方式，它把段落第一行向内退让，形成清晰视觉起点，帮助读者快速辨识结构。",
  "在长文阅读与连续文本里，首行缩进替字里行间留出呼吸节奏，它不靠额外装饰，也不必插入空行，仅靠左缘缺口就能稳稳建立起秩序。",
  "在纸书正文与报刊专栏里，合理使用段首缩进能让页面保持平稳均匀的灰色肌理，读起来更专注顺畅。",
  "掌握这一细节，能让你的文字排版更具呼吸感，也更符合读者的阅读习惯。"
];

// 东亚基本行首/行尾禁则标点
const NO_LINE_START = new Set([
  "，", "。", "、", "；", "：", "！", "？", "）", "》", "」", "』", "”", "’", "】", "—", "…"
]);
const NO_LINE_END = new Set([
  "（", "《", "「", "『", "“", "‘", "【"
]);

// 按整数格宽（cols 字/栏）对一段纯中文做 1:1 真实断行
export function wrapChineseParagraph(text, cols, indentEm) {
  const chars = [...text];
  const lines = [];
  const firstIndent = Math.max(0, Math.min(MAX_QUADS, indentEm));
  let cur = "";
  let used = 0;
  let limit = Math.max(4, cols - firstIndent);
  let startIdx = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (used + 1 <= limit + 0.001 || !cur) {
      cur += ch;
      used += 1;
    } else {
      // 避头点：如果下一字是行首禁则标点，把上一行末字拖到下一行同走（避免挂出破坏整字格）
      if (NO_LINE_START.has(ch) && cur.length > 2) {
        const pull = cur[cur.length - 1];
        if (!NO_LINE_START.has(pull)) {
          const cut = cur.slice(0, -1);
          lines.push({
            text: cut,
            charCount: [...cut].length,
            startIdx,
            endIdx: i - 1,
            indent: lines.length === 0 ? firstIndent : 0,
            isFirst: lines.length === 0
          });
          startIdx = i - 1;
          cur = pull + ch;
          used = 2;
          limit = cols;
          continue;
        }
      }
      // 避尾点：开引号/左括号不留在行尾
      const prev = cur[cur.length - 1];
      if (NO_LINE_END.has(prev) && cur.length > 2) {
        const cut = cur.slice(0, -1);
        lines.push({
          text: cut,
          charCount: [...cut].length,
          startIdx,
          endIdx: i - 1,
          indent: lines.length === 0 ? firstIndent : 0,
          isFirst: lines.length === 0
        });
        startIdx = i - 1;
        cur = prev + ch;
        used = 2;
        limit = cols;
        continue;
      }

      lines.push({
        text: cur,
        charCount: [...cur].length,
        startIdx,
        endIdx: i,
        indent: lines.length === 0 ? firstIndent : 0,
        isFirst: lines.length === 0
      });
      startIdx = i;
      cur = ch;
      used = 1;
      limit = cols;
    }
  }

  if (cur) {
    lines.push({
      text: cur,
      charCount: [...cur].length,
      startIdx,
      endIdx: chars.length,
      indent: lines.length === 0 ? firstIndent : 0,
      isFirst: lines.length === 0
    });
  }

  return lines.map((ln) => ({
    ...ln,
    fillRatio: Math.min(1, (ln.indent + ln.charCount) / cols)
  }));
}

// 计算整张排字手盘的实时布局（同时算出相对 0 铅空增加了多少行、有几处真实满行粘连）
export function layoutGalley(paragraphs, quadsPerPara, cols, animIndents = null) {
  const baseline = paragraphs.map((p) => wrapChineseParagraph(p, cols, 0));
  const baseTotalLines = baseline.reduce((s, ls) => s + ls.length, 0);

  const result = paragraphs.map((text, idx) => {
    const q = Math.max(0, Math.min(MAX_QUADS, Math.round(quadsPerPara[idx] || 0)));
    const visualInd = animIndents ? Math.max(0, Math.min(MAX_QUADS, animIndents[idx])) : q;
    // 断行按逻辑整数铅空（或动画中已过半格时）即时推落，保证视觉与字符格严丝合缝
    const wrapInd = Math.round(visualInd);
    const lines = wrapChineseParagraph(text, cols, wrapInd);
    // 把首行视觉缩进设为平滑值，渲染时首行字整体轻滑，同时不越出右界
    if (lines.length) {
      lines[0] = {
        ...lines[0],
        visualIndent: visualInd
      };
    }
    const lastLine = lines[lines.length - 1];
    return {
      index: idx,
      quads: q,
      visualIndent: visualInd,
      lines,
      baseLines: baseline[idx].length,
      addedLines: lines.length - baseline[idx].length,
      lastFill: lastLine ? lastLine.fillRatio : 0
    };
  });

  // 真实满行粘连判定：上段末行自然排满（>= 96% 栏宽）且下段 0 铅空
  const fusedPairs = [];
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].lastFill >= 0.96 && result[i + 1].quads === 0) {
      fusedPairs.push(i); // i 与 i+1 粘连
    }
  }

  const totalLines = result.reduce((s, p) => s + p.lines.length, 0);
  const extraLines = totalLines - baseTotalLines;
  const totalQuads = result.reduce((s, p) => s + p.quads, 0);
  const maxQuad = Math.max(...result.map((p) => p.quads));
  const maxRatioPct = Math.round((maxQuad / cols) * 100);

  return {
    cols,
    paragraphs: result,
    totalLines,
    baseTotalLines,
    extraLines,
    fusedPairs,
    fusedCount: fusedPairs.length,
    totalQuads,
    maxQuad,
    maxRatioPct
  };
}

// 对比旧版断行与新版断行，找出哪些行首字是「刚从上一行行尾被推落下来」的
export function diffDroppedChars(prevLines, nextLines) {
  const dropped = new Set(); // key: `${lineIdx}:${charIdxInLine}`
  if (!prevLines || !nextLines) return dropped;
  for (let l = 1; l < nextLines.length; l++) {
    const prevStart = l < prevLines.length ? prevLines[l].startIdx : Infinity;
    const curLine = nextLines[l];
    if (curLine.startIdx < prevStart) {
      const count = Math.min(curLine.charCount, prevStart - curLine.startIdx);
      for (let c = 0; c < count; c++) {
        dropped.add(`${l}:${c}`);
      }
    }
  }
  return dropped;
}

// 实时排字诊断：100% 由 layoutGalley 算出的真实排印状态生成
export function diagnoseGalley(quads, layout, lastEvent = null) {
  const qStr = quads.join(" · ") + " 字";
  const fused = layout.fusedCount;
  const extra = layout.extraLines;
  const cols = layout.cols;
  const allZero = quads.every((q) => q === 0);
  const allSame = quads.every((q) => q === quads[0]);
  const firstFlushRestSame = quads[0] === 0 && quads.slice(1).every((q) => q === quads[1] && q > 0);
  const maxQ = layout.maxQuad;

  const metrics = {
    quadsStr: qStr,
    fusedStr: `${fused} 处`,
    fusedCount: fused,
    linesStr: extra > 0 ? `${layout.totalLines} 行 (+${extra})` : `${layout.totalLines} 行`
  };

  // 1. 初始全 0 铅空：两处自然齐尾满行粘连
  if (allZero) {
    return {
      tone: "danger",
      badge: "满行粘连 · 未放铅空",
      headline: `第 1、2 段末字自然顶齐右缘，出现 ${fused} 处满行粘连`,
      body: `眼下四段都未放铅空，也无段间空行——第 1、2 段恰好凑满 ${cols} 字/行，句号贴在右边界，与下段焊成了一堵字墙。从上方铅空字盘拖起蓝色铅空放进第 2 段首，亲眼看行尾字掉向下一行、把粘连拆开。`,
      metrics
    };
  }

  // 2. 存在过深铅空（3 或 4 字）
  if (maxQ >= 3) {
    const deepIdx = quads.findIndex((q) => q === maxQ) + 1;
    const pct = Math.round((maxQ / cols) * 100);
    return {
      tone: "warn",
      badge: "铅空过深 · 首行发空",
      headline: `第 ${deepIdx} 段嵌了 ${maxQ} 字铅空（占栏宽 ${pct}%），首行被推得失衡`,
      body: `往段首一口气塞进 ${maxQ} 块全角铅空，左缘缺口宽得抢戏，首行被猛推到右侧、整页连续阅读的平稳灰度被打碎。点一下那几块蓝铅空取出多余的块，收回 2 字再看。`,
      metrics
    };
  }

  // 3. 仍有满行粘连没拆开
  if (fused > 0) {
    const pairLabels = layout.fusedPairs.map((i) => `第 ${i + 1}–${i + 2} 段`).join("、");
    const dropHint = lastEvent && lastEvent.droppedCount > 0
      ? `刚才往第 ${lastEvent.para + 1} 段推入铅空，已把 ${lastEvent.droppedCount} 个行尾字挤落到下行；`
      : "";
    return {
      tone: "warn",
      badge: `尚余 ${fused} 处满行粘连`,
      headline: `${pairLabels} 仍无缩进，末行齐尾粘连还在`,
      body: `${dropHint}只要下方段落还空着 0 铅空，上段排满右缘时眼睛回扫左缘依然分不出换段。把蓝色铅空继续拖进其余段首，看全页四段怎么一一拆开。`,
      metrics
    };
  }

  // 4. 四段全 2 字：中文标准完成态
  if (allSame && quads[0] === 2) {
    return {
      tone: "ok",
      badge: "中文标准 · 四段空二字",
      headline: `四段齐齐左空 2 字（占栏宽 ${layout.maxRatioPct}%），满行粘连归零`,
      body: `每段首行各嵌两块全角铅空，行尾多出的字自然落入下行（共多出 ${extra} 行），左缘形成笔直成列的缺口——不用插入多余空行，也能在连续长文里一眼锁定每段起点。`,
      metrics
    };
  }

  // 5. 首段顶格 + 续段齐缩（[0,2,2,2] 或 [0,1,1,1]）
  if (firstFlushRestSame) {
    const q = quads[1];
    return {
      tone: "ok",
      badge: q === 2 ? "首段顶格 · 续段空二字" : "首段顶格 · 续段空一字",
      headline: `开篇第 1 段顶格稳住左上角，后三段统一缩进 ${q} 字`,
      body: `这种排法呼应西文书籍（Bringhurst §2.3.1）与部分现代中文杂志：标题下第一段起点本就明确，顶格更利落；第 2 段起用 ${q} 字铅空接力切段，全页 0 粘连。`,
      metrics
    };
  }

  // 6. 四段全 1 字
  if (allSame && quads[0] === 1) {
    return {
      tone: "alt",
      badge: "全篇 1 字轻缩进",
      headline: `四段各空 1 字（占栏宽 ${layout.maxRatioPct}%），满行粘连已解开`,
      body: `1 字缩进足以拆开齐尾粘连，也是日文书刊（JLREQ §3.5.1）与中文多栏窄幅（CLREQ §6.2.1.1）的常见深度；在眼前 ${cols} 字宽的中文书页里，再添 1 块到 2 字会更舒展耐读。`,
      metrics
    };
  }

  // 7. 其余混排：各段缩进深浅不一
  const minQ = Math.min(...quads);
  const dropNote = lastEvent && lastEvent.droppedCount > 0
    ? `第 ${lastEvent.para + 1} 段刚有 ${lastEvent.droppedCount} 个行尾字被推落下行，`
    : "";
  return {
    tone: "warn",
    badge: "各段铅空深浅不一",
    headline: `四段缩进为 ${qStr}，左缘起跳点参差不齐`,
    body: `${dropNote}满行粘连虽然拆开了，但各段缩进从 ${minQ} 字跳到 ${maxQ} 字，读者每换一段都要重新校准视线。把各段铅空配齐（如全 2 字，或首段 0 + 续段 2 字），左缘节奏立刻稳下来。`,
    metrics
  };
}

// 第 02 节：四时代演化标本
export const ERAS = [
  {
    id: "pilcrow",
    year: "12–15 世纪",
    name: "朱笔段落符 ¶",
    en: "Rubricated Pilcrow",
    caption: "手稿与摇篮本早期：正文紧连不换行，由朱笔抄写员（rubricator）在行中手绘红色 ¶ 标出新意群。",
    note: "源流：古希腊页边短线 paragraphos → 罗马 capitulum → 中世纪朱笔 ¶（Keith Houston, Shady Characters, 2013）。",
    mode: "inline-pilcrow"
  },
  {
    id: "printGap",
    year: "15–16 世纪",
    name: "印刷赶工留下的空白",
    en: "The Unfilled Quad",
    caption: "活字印刷印速飙升，朱笔手绘赶不上进度，段首预留给 ¶ 的那块空白干脆不再补画——读者照样秒懂换段，首行缩进由此定型。",
    note: "留白本身成了符号：排字工只需在段首嵌一块全角或半角金属铅空（em / en quad）。",
    mode: "latin-flush-first"
  },
  {
    id: "cn1920",
    year: "1920 年 2 月",
    name: "「每段开端，必须低两格」",
    en: "Vertical Two-Cell Drop",
    caption: "传统古籍多连排无现代分段，偶以「抬头」示敬。1919 年马裕藻、朱希祖、钱玄同、刘复、周作人、胡适六学者联名提交《请颁行新式标点符号议案》，1920 年 2 月教育部颁行，附则（丙）定下竖排每段低两格。",
    note: "当时仍是竖排（参看 192 垂直文字排版），「低两格」即自上往下空出两字方格。",
    mode: "vertical-cn"
  },
  {
    id: "modern",
    year: "现代规范",
    name: "左空二字 · text-indent: 2em",
    en: "GB/T 9704 & W3C CLREQ",
    caption: "中文改为横排后，「低两格」顺理成章成为「左空二字，回行顶格」（GB/T 9704—2012 第 7.3.3 条）。W3C CLREQ §6.2.1.1 记为 2 em，日文 JLREQ §3.5.1 原则为 1 em，网页由 CSS text-indent 接棒。",
    note: "一块虚拟铅空跟着字号弹性缩放，不再依赖笨重的手敲空格。",
    mode: "modern-cn"
  }
];

// 第 03 节：语种与栏宽尺度配置
export const LANG_SPECS = {
  zh: {
    name: "中文（CLREQ / 国标）",
    unit: "字 (em)",
    defaultIndent: 2.0,
    idealMin: 1.0,
    idealMax: 2.0,
    standardText: "常规书页与公文以 2 em（左空二字）为标准；杂志等多栏每栏字数较少时，时有改用 1 em 的做法（W3C CLREQ §6.2.1.1）。",
    text: [
      "一块全角铅空的宽度恰好等于一个汉字。书页版心宽到三十余字时，空出两字像在门廊里迈进两步，既稳重又不显突兀。",
      "若栏宽收窄到十二三字，两字就吃掉近六分之一行宽；若换成四字，首行便像被削去半截。尺度永远要替这一栏的宽度说话。"
    ]
  },
  ja: {
    name: "日文（W3C JLREQ）",
    unit: "字 (em)",
    defaultIndent: 1.0,
    idealMin: 1.0,
    idealMax: 1.5,
    standardText: "W3C 日文排版需求（JLREQ §3.5.1）规定段落字下げ原则为 1 em（一全角字宽）。",
    text: [
      "日本語の組版では、段落の先頭を一字下げにするのが基本である。仮名と漢字が織り交ざる紙面は、一字分の空白だけで十分に段落の切り替わりが伝わる。",
      "二字以上下げると行頭が不自然に深く見えやすく、小説でも論説でも一字下げが長く標準として受け継がれてきた。"
    ]
  },
  en: {
    name: "西文（Bringhurst / Butterick）",
    unit: "em",
    defaultIndent: 1.5,
    idealMin: 1.0,
    idealMax: 2.5,
    standardText: "Bringhurst §2.3.2 建议至少 1 en（常见 1–2 em）；Butterick 经验区间为 1–4 倍字号，窄栏取小、宽栏取大。",
    text: [
      "In continuous English prose, a modest indent of one to two ems creates a quiet notch on the left margin without breaking the even grey rhythm of the page.",
      "Because Latin letters vary in width, pushing the indent beyond four times the point size makes narrow columns feel ragged and disconnected."
    ]
  }
};

// 第 05 节：何时用 / 何时别用 场景体检
export const SCENARIOS = [
  {
    id: "novel",
    verdict: "use",
    tag: "该用 · 连续长文",
    title: "纸书 / 电子书长篇阅读",
    summary: "成百上千个自然段首尾相接，用 2 em 首行缩进 + 0 段距，既一眼分段又不浪费版面空间，视线连续不断气。",
    defaultOn: true,
    onNote: "标准书页节奏：每段省去一整行段间空隙，密实连贯不浪纸，长读眼不跳。",
    offNote: "去掉缩进且不空行后，满行处立刻发生段落粘连，长读极易串行。"
  },
  {
    id: "official",
    verdict: "use",
    tag: "该用 · 规范文书",
    title: "中文公文与学位论文",
    summary: "GB/T 9704—2012 第 7.3.3 条明确规定正文「每个自然段左空二字，回行顶格」，庄重严谨、层级清晰，读者一眼识别自然段。",
    defaultOn: true,
    onNote: "完全符合 GB/T 9704—2012 规范：左空二字、回行顶格。",
    offNote: "公文去掉段首缩进后，条文块界限模糊，也不合正式排版标准。"
  },
  {
    id: "magazine",
    verdict: "use",
    tag: "该用 · 多栏报刊",
    title: "报纸 / 杂志多栏深读",
    summary: "常在跨栏标题下方分多栏连排；窄栏用 1–1.5 em 首行缩进，无需拉大段距即可在紧凑栏高里清晰分段。",
    defaultOn: true,
    onNote: "多栏紧凑高密，1.5 字缩进清楚切开段落，同时守住各栏齐脚。",
    offNote: "多栏若不用缩进改用整行段距，相邻两栏的底线立刻参差难对齐。"
  },
  {
    id: "ppt",
    verdict: "skip",
    tag: "别用 · 温和修正海报",
    title: "PPT 要点页与课程短卡",
    summary: "186 号原海报提到 PPT 也适用段首缩进——但演示页多是两三行要点或并列卡片，强加缩进反而让左缘平白塌一块。",
    defaultOn: false,
    onNote: "看！三张两行要点硬缩两格后，左缘像被啃了缺口，既不像列表也不像段落。",
    offNote: "左对齐顶格 + 适度条目间距：投影仪远处一眼扫清三条核心结论。"
  },
  {
    id: "webcard",
    verdict: "skip",
    tag: "别用 · 屏幕扫读",
    title: "手机短评 / 网页信息卡片",
    summary: "手机屏幕窄且多为碎片扫读，每一段只有 2–4 行；直接顶格左对齐 + 段落间距，比段首凹进更干脆利落。",
    defaultOn: false,
    onNote: "窄屏短段既凹进又分卡，左边多出无意义的锯齿，反而拖慢扫读。",
    offNote: "顶格左对齐 + 清晰段距：拇指一滑，一眼一块信息，干净利落。"
  },
  {
    id: "centered",
    verdict: "skip",
    tag: "别用 · 居中与窄表",
    title: "居中题词、表格与窄标签",
    summary: "居中排版没有固定左缘，加首行缩进会把第一行硬往右推歪；表格单元格和窄侧栏更经不起白白浪费两字宽度。",
    defaultOn: false,
    onNote: "惨案现场：居中铭文加上 2 em 缩进，第一行整个向右偏歪，对称轴彻底毁掉！",
    offNote: "居中版式保持纯居中，零首行缩进，视觉中轴才能笔直。"
  }
];

// 第 06 节：三道盲测眼力练习（每题 4 选 1，中性标签，严格单变量对比）
export const QUIZ_ITEMS = [
  {
    id: "q1",
    prompt: "题 1 · 一本 300 页中文长篇小说内文（常宽版心），只比较段落分隔手法，哪一页最耐读？",
    options: [
      {
        key: "A",
        label: "方案 A",
        previewClass: "qz-novel-shallow",
        lines: [
          "暮色降临前，钟楼的最后一声余韵落在青石阶上，街口茶摊正准备收起帆布棚，行人步履渐缓。",
          "他把折好的信塞进外衣内袋，转身拐进窄巷，连影子都被路灯拉长了半截，悄无声息融进夜色。"
        ],
        ok: false,
        feedback: "方案 A 只缩进了 0.5 em（半个汉字宽）：缺口太浅，连续翻读时容易看成排版微偏，分段信号不够果断。"
      },
      {
        key: "B",
        label: "方案 B",
        previewClass: "qz-novel-clean",
        lines: [
          "暮色降临前，钟楼的最后一声余韵落在青石阶上，街口茶摊正准备收起帆布棚，行人步履渐缓。",
          "他把折好的信塞进外衣内袋，转身拐进窄巷，连影子都被路灯拉长了半截，悄无声息融进夜色。"
        ],
        ok: true,
        feedback: "方案 B 是「首行缩进 2 em + 0 段距」：两字缺口清晰果断，又不插多余空行，300 页小说纸面紧实连贯、长读不累。"
      },
      {
        key: "C",
        label: "方案 C",
        previewClass: "qz-novel-belt",
        lines: [
          "暮色降临前，钟楼的最后一声余韵落在青石阶上，街口茶摊正准备收起帆布棚，行人步履渐缓。",
          "他把折好的信塞进外衣内袋，转身拐进窄巷，连影子都被路灯拉长了半截，悄无声息融进夜色。"
        ],
        ok: false,
        feedback: "方案 C 同时用了「2 em 首行缩进 + 1 行段距」（皮带加背带）：两条信号重复开工，300 页长篇会显得松散断气并白白增厚。"
      },
      {
        key: "D",
        label: "方案 D",
        previewClass: "qz-novel-deep",
        lines: [
          "暮色降临前，钟楼的最后一声余韵落在青石阶上，街口茶摊正准备收起帆布棚，行人步履渐缓。",
          "他把折好的信塞进外衣内袋，转身拐进窄巷，连影子都被路灯拉长了半截，悄无声息融进夜色。"
        ],
        ok: false,
        feedback: "方案 D 缩进深达 4 em：左缘掏出过大的缺口，首行被猛推到右半侧，整页平稳的灰色纹理被拉散。"
      }
    ]
  },
  {
    id: "q2",
    prompt: "题 2 · 报刊多栏专栏（每栏 12 字宽），只调首行缩进深度，哪一栏最稳？",
    options: [
      {
        key: "A",
        label: "方案 A",
        previewClass: "qz-narrow-half",
        lines: [
          "晨雾散尽，早班渡轮缓缓靠上老码头的木桥。",
          "旅客折好早报，顺着左缘飞快读完这栏消息。"
        ],
        ok: false,
        feedback: "方案 A 只缩了 0.5 em（半个汉字宽，占栏宽 4%）：缺口太浅，读快时容易看成字位微偏，换段信号不够明确。"
      },
      {
        key: "B",
        label: "方案 B",
        previewClass: "qz-narrow-one",
        lines: [
          "晨雾散尽，早班渡轮缓缓靠上老码头的木桥。",
          "旅客折好早报，顺着左缘飞快读完这栏消息。"
        ],
        ok: true,
        feedback: "方案 B 收束为 1 em（空一字，占 12 字栏宽的 8.3%）：正合 W3C CLREQ §6.2.1.1 所述「杂志等多栏每栏字数较少时，视觉上缩排两字将显突兀，时有改用缩排一字的做法」，既清脆分段又保住首行字数。"
      },
      {
        key: "C",
        label: "方案 C",
        previewClass: "qz-narrow-two",
        lines: [
          "晨雾散尽，早班渡轮缓缓靠上老码头的木桥。",
          "旅客折好早报，顺着左缘飞快读完这栏消息。"
        ],
        ok: false,
        feedback: "方案 C 套用了常宽书页的 2 em：在仅 12 字宽的窄栏里一下吃掉六分之一（16.7%）行宽，首行凹得显眼发空，显得偏突兀。"
      },
      {
        key: "D",
        label: "方案 D",
        previewClass: "qz-narrow-three",
        lines: [
          "晨雾散尽，早班渡轮缓缓靠上老码头的木桥。",
          "旅客折好早报，顺着左缘飞快读完这栏消息。"
        ],
        ok: false,
        feedback: "方案 D 缩进 3 em，直接吃掉四分之一（25%）栏宽，首行被推到偏右侧，窄栏版心明显发虚失衡。"
      }
    ]
  },
  {
    id: "q3",
    prompt: "题 3 · 西文书评开篇（小标题下方紧接两段正文），只比较首段与续段的缩进配比，专业书刊常用哪一页？",
    options: [
      {
        key: "A",
        label: "方案 A",
        previewClass: "qz-en-none",
        heading: "Chapter IV",
        lines: [
          "A calm book page breathes through quiet proportion rather than ornament.",
          "Every notch on the left margin signals where a fresh line of thought begins."
        ],
        ok: false,
        feedback: "方案 A 首段和续段都为 0 em 且无空行：一旦前段排满右缘，续段起点便无从辨认。"
      },
      {
        key: "B",
        label: "方案 B",
        previewClass: "qz-en-both-deep",
        heading: "Chapter IV",
        lines: [
          "A calm book page breathes through quiet proportion rather than ornament.",
          "Every notch on the left margin signals where a fresh line of thought begins."
        ],
        ok: false,
        feedback: "方案 B 首段与续段全都缩进 3.2 em：紧跟标题的首段本无需缩进，过深的缩进更让开篇左上角显得空落。"
      },
      {
        key: "C",
        label: "方案 C",
        previewClass: "qz-en-ok",
        heading: "Chapter IV",
        lines: [
          "A calm book page breathes through quiet proportion rather than ornament.",
          "Every notch on the left margin signals where a fresh line of thought begins."
        ],
        ok: true,
        feedback: "方案 C 遵循 Bringhurst §2.3.1 与 §2.3.2：紧跟标题的首段顶格（0 em）稳住开篇角点，续段缩进 1.5 em 清晰切段。"
      },
      {
        key: "D",
        label: "方案 D",
        previewClass: "qz-en-flip",
        heading: "Chapter IV",
        lines: [
          "A calm book page breathes through quiet proportion rather than ornament.",
          "Every notch on the left margin signals where a fresh line of thought begins."
        ],
        ok: false,
        feedback: "方案 D 正好排反了：紧接标题的首段缩了 1.5 em，真正需要标明换段的第二段反而 0 em 顶格粘在下面。"
      }
    ]
  }
];
