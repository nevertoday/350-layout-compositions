// 悬挂缩进（No. 185）状态模型与教学数据
// 开场采用 Word / InDesign 式双游标标尺模型：
//   firstEm（▽ 首行缩进）与 restEm（△ 左缩进 / 续行）各自独立，差值 hangEm = restEm - firstEm。
//   最佳对齐点一律由画布 / DOM 实测「圆点 + 词头 + 间隔」宽度得出，不再硬编码固定 em。

export const RULER_MIN_EM = -1.5;
export const RULER_MAX_EM = 10.5;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const round1 = (v) => Math.round(v * 10) / 10;
export const fmtEm = (em) => `${em > 0 ? "+" : ""}${em.toFixed(1)} em`;
export const fmtPos = (em) => `${em.toFixed(1)} em`;

export const PRESETS = {
  poster: {
    id: "poster",
    label: "原海报五词条",
    shortLabel: "原海报",
    alignMode: "exact",
    normHangEm: 4.1,
    gapEm: 1.0,
    note: "原海报以「圆点 + 两字术语」坐镇左侧基线，续行按实测词头宽度退至释义首字正下方，五条概念一眼排开。",
    entries: [
      {
        marker: "●",
        head: "版式",
        body: "在有限空间中组织文字与图形的方式与逻辑，以建立信息层级与视觉秩序，提升可读性与专注度。",
      },
      {
        marker: "●",
        head: "对比",
        body: "通过大小、粗细、色彩、形状等差异突出重点，引导视线并强化信息的层级关系。",
      },
      {
        marker: "●",
        head: "对齐",
        body: "将元素沿同一基线或边缘对齐，建立稳定与统一，减少视觉噪音，令版面更清晰。",
      },
      {
        marker: "●",
        head: "留白",
        body: "有意识地保留空白区域，为内容提供呼吸感，增强可读性，并传达简洁与克制的气质。",
      },
      {
        marker: "●",
        head: "层级",
        body: "用大小、位置与对比区分主次关系，帮助受众快速理解信息结构与阅读路径。",
      },
    ],
  },
  bib: {
    id: "bib",
    label: "学术参考文献",
    shortLabel: "参考文献",
    alignMode: "norm",
    normHangEm: 2.6,
    gapEm: 0.45,
    note: "参考文献作者姓氏长短不一，不按最长姓氏硬对齐，而是遵循 APA / MLA / 芝加哥规范取统一 0.5 英寸（约 2.5–3.0 em）悬挂，让姓氏前半段探出左缘便于按字母纵扫。",
    entries: [
      {
        marker: "",
        head: "De Vinne, T. L.",
        body: "(1901). The Practice of Typography: Correct Composition. New York: The Century Co.",
      },
      {
        marker: "",
        head: "Bringhurst, R.",
        body: "(1992). The Elements of Typographic Style. Vancouver: Hartley & Marks.",
      },
      {
        marker: "",
        head: "Johnson, S.",
        body: "(1755). A Dictionary of the English Language. London: W. Strahan.",
      },
      {
        marker: "",
        head: "GB/T 7714-2015",
        body: "信息与文献 参考文献著录规则[S]. 北京：中国标准出版社，2015。",
      },
    ],
  },
  lexicon: {
    id: "lexicon",
    label: "辞书释义",
    shortLabel: "辞书",
    alignMode: "exact",
    normHangEm: 3.8,
    gapEm: 0.85,
    note: "词典正文极其密集，没有整行段距可挥霍；把续行精准退到词头【】右侧的拼音首字母下方，一条条释义立刻边界分明。",
    entries: [
      {
        marker: "",
        head: "【悬】",
        bodyLead: "xuán",
        body: "① 挂在空中，不着地面。② 版式术语，指首行探出基线而后续各行向内收束的排法。",
      },
      {
        marker: "",
        head: "【缩】",
        bodyLead: "suō",
        body: "① 向后退，往里收。② 排版中将行首自版心左缘向内推入固定字距，用来区分层级或段落。",
      },
      {
        marker: "",
        head: "【检】",
        bodyLead: "jiǎn",
        body: "① 查核、翻找。② 读者不逐字通读，而沿左侧基准线快速下扫，定位目标词头的过程。",
      },
    ],
  },
  clause: {
    id: "clause",
    label: "编号条款",
    shortLabel: "条款",
    alignMode: "exact",
    normHangEm: 3.1,
    gapEm: 0.75,
    note: "带序号的目录与条文里，按编号实测宽度把续行退到条款首字正下方，所有编号便自动组成一条干脆的索引栏。",
    entries: [
      {
        marker: "[01]",
        head: "",
        bodyLead: "首行锚定：",
        body: "每条首行紧贴左侧对齐基线，让序号与关键词暴露在最外侧，形成稳定的垂向入口。",
      },
      {
        marker: "[02]",
        head: "",
        bodyLead: "续行退让：",
        body: "第二行及以后统一退到编号右侧，在左缘下方留出连续空白走廊，避免正文遮挡下一条编号。",
      },
      {
        marker: "[03]",
        head: "",
        bodyLead: "宽度节制：",
        body: "缩进深度需配合栏宽取舍；先让过编号或词头，再检查续行剩余宽度是否足够舒展。",
      },
    ],
  },
};

export function snapFirstMarker(rawEm, restEm, maxEm) {
  const clamped = clamp(rawEm, RULER_MIN_EM, maxEm);
  const targets = [
    { em: 0, kind: "zero" },
    { em: restEm, kind: "flush" },
    { em: restEm + 2.0, kind: "first-indent" },
  ];
  for (const t of targets) {
    if (t.em >= RULER_MIN_EM && t.em <= maxEm && Math.abs(clamped - t.em) < 0.22) {
      return { em: round1(t.em), snapped: true, snapKind: t.kind };
    }
  }
  return { em: round1(clamped), snapped: false, snapKind: "free" };
}

export function snapRestMarker(rawEm, firstEm, metrics, maxEm) {
  const clamped = clamp(rawEm, RULER_MIN_EM, maxEm);
  const alignTarget = firstEm + metrics.alignEm;
  const targets = [
    { em: alignTarget, kind: "align" },
    { em: firstEm, kind: "flush" },
    { em: 0, kind: "zero" },
  ];
  for (const t of targets) {
    if (t.em >= RULER_MIN_EM && t.em <= maxEm && Math.abs(clamped - t.em) < 0.24) {
      return { em: round1(t.em), snapped: true, snapKind: t.kind };
    }
  }
  return { em: round1(clamped), snapped: false, snapKind: "free" };
}

// 根据双游标位置 + 实测词头宽度，生成准确可读的版面诊断
export function evaluateDualIndent(firstEm, restEm, presetId = "poster", metrics = {}) {
  const preset = PRESETS[presetId] || PRESETS.poster;
  const headEndEm = metrics.headEndEm ?? 3.0;
  const alignEm = metrics.alignEm ?? preset.normHangEm;
  const measureEm = metrics.measureEm ?? 28;
  const hangEm = restEm - firstEm;
  const remainEm = Math.max(4, measureEm - restEm);
  const ratio = hangEm / Math.max(12, measureEm - Math.min(0, firstEm));
  const outdentNote =
    firstEm < -0.15
      ? `（首行游标 ▽ 已向左探出 0 基线 ${Math.abs(firstEm).toFixed(1)} em，形成书籍版式里的外挂/凸出式悬挂。）`
      : "";

  if (hangEm <= -0.35) {
    return {
      status: "reverse",
      badge: "反了 · 首行缩进",
      title: "▽ 跑到了 △ 右边，词头被续行吞没",
      text: `首行游标 ▽（${fmtPos(firstEm)}）比左缩进 △（${fmtPos(restEm)}）更靠右，形成 ${Math.abs(hangEm).toFixed(1)} em 的「首行缩进」。拿来排条目时，左缘最显眼的是上一条残句，词头反而缩在凹槽里。`,
      hint: "把 ▽ 拉回 0.0 em、把 △ 拖到 ▽ 右侧，看看词头怎样立刻从正文里站出来。",
    };
  }

  if (Math.abs(hangEm) < 0.35) {
    return {
      status: "flat",
      badge: "齐左密墙",
      title: "▽ 与 △ 重合，条目边界化进一片灰",
      text: `首行与续行几乎落在同一条竖线上（差值 ${hangEm.toFixed(1)} em）。没有左右错开，五条内容就会粘成一块密不透风的文字砖，找目标词头只能逐行慢读。`,
      hint:
        preset.alignMode === "exact"
          ? `把下方 △ 游标往右拖到 ${(firstEm + alignEm).toFixed(1)} em（释义首字正下方），就能切出一条干净的空白走廊。`
          : `把下方 △ 游标往右拖到 ${(firstEm + alignEm).toFixed(1)} em 左右，打开左侧姓氏检索走廊。`,
    };
  }

  if (preset.alignMode === "exact") {
    if (hangEm < headEndEm - 0.1) {
      return {
        status: "shallow",
        badge: "钻入词头底下",
        title: "缩进小于词头宽度，续行把词头埋掉了",
        text: `当前悬挂深度仅 +${hangEm.toFixed(1)} em，小于「圆点/编号 + 词头」的实测宽度（约 ${headEndEm.toFixed(1)} em）。续行直接钻到词头底下、把词头下半截糊成一团，左侧还没露出干净的空白走廊。`,
        hint: `继续把 △ 往右拖到 ${(firstEm + alignEm).toFixed(1)} em，让续行越过词头与间隔、精准对准释义首字。`,
      };
    }

    if (hangEm < alignEm - 0.18) {
      return {
        status: "shallow",
        badge: "刚过词头 · 偏左",
        title: "刚避开词头末尾，但还比释义首字靠左",
        text: `悬挂 +${hangEm.toFixed(1)} em 刚好越过词头末端（${headEndEm.toFixed(1)} em），却还没退到释义首字下方（${alignEm.toFixed(1)} em），续行与词头贴得偏紧，虚线通道显得拘谨。`,
        hint: `再向右轻推至 ${(firstEm + alignEm).toFixed(1)} em，续行就会与释义首字严丝合缝对齐。`,
      };
    }

    if (Math.abs(hangEm - alignEm) <= 0.18 && ratio <= 0.36) {
      return {
        status: "sweet",
        badge: "严格对齐释义",
        title: "续行对准释义首字，空白走廊彻底打开",
        text: `首行立在 ${fmtPos(firstEm)}，续行按实测词头宽度退让 +${hangEm.toFixed(1)} em，正好落在释义首字正下方；左侧留出一条干净利落的空白走廊，虚线稳稳落在词头与释义之间的空隙里，绝不压字。${outdentNote}`,
        hint: preset.note,
      };
    }

    if (ratio > 0.34 || remainEm < 10 || hangEm > alignEm + 3.2) {
      return {
        status: "deep",
        badge: "过深 · 续行挤碎",
        title: "左缘空出一大条，续行被挤成窄烟囱",
        text: `续行内缩高达 +${hangEm.toFixed(1)} em（超出词头对齐点 ${(hangEm - alignEm).toFixed(1)} em），右侧仅剩约 ${remainEm.toFixed(1)} em 可用行宽。每条都被迫多折行，整版拉长，反而拖慢了浏览节奏。`,
        hint: `把 △ 收回到 ${(firstEm + alignEm).toFixed(1)} em（或点「对齐释义」），保住行宽与走廊平衡。`,
      };
    }

    return {
      status: "wide",
      badge: "走廊偏宽",
      title: "比释义首字多退了一截，走廊宽敞但占行宽",
      text: `悬挂深度 +${hangEm.toFixed(1)} em 已超出实测词头加间隔宽度（${alignEm.toFixed(1)} em），续行比释义首字更往里退了 ${(hangEm - alignEm).toFixed(1)} em——类似原海报为强化台阶感而多退的那半格，但右侧有效行宽开始收窄。${outdentNote}`,
      hint: `若追求最利落的垂直对齐线，可点「对齐释义」回到 ${(firstEm + alignEm).toFixed(1)} em。`,
    };
  }

  // 参考文献模式（作者姓氏变长，遵循固定规范 0.5 英寸 ≈ 2.4–3.0 em）
  if (hangEm < 1.3) {
    return {
      status: "shallow",
      badge: "探出偏浅",
      title: "台阶太微弱，姓氏混在续行边缘里",
      text: `仅退让 +${hangEm.toFixed(1)} em，不到一个半字宽。纵扫书目时，作者姓氏探出的「把手」太短，视线很容易被下方书名和出版社文字带偏。`,
      hint: `把 △ 往右拖到 ${(firstEm + alignEm).toFixed(1)} em 左右（对应文献规范 0.5 英寸比例）。`,
    };
  }

  if (ratio > 0.34 || remainEm < 10 || hangEm > 4.2) {
    return {
      status: "deep",
      badge: "过深 · 续行挤碎",
      title: "书目不需要躲开整段姓氏，缩太深反会挤碎",
      text: `参考文献的作者名长短不一，若退让高达 +${hangEm.toFixed(1)} em，右侧只剩约 ${remainEm.toFixed(1)} em 栏宽，书名与出版地会碎成短窄几行。`,
      hint: `把 △ 收回到 ${(firstEm + alignEm).toFixed(1)} em 附近，让姓氏前半段探出即可。`,
    };
  }

  return {
    status: "sweet",
    badge: Math.abs(hangEm - alignEm) <= 0.25 ? "规范悬挂区" : "清晰可扫",
    title: "作者姓氏探出左缘，书目列表一眼可查",
    text: `续行统一内缩 +${hangEm.toFixed(1)} em，既在左侧切出连贯的空白走廊、让 De Vinne / Bringhurst / Johnson 等姓氏探出来，又给书名与出版社留足约 ${remainEm.toFixed(1)} em 舒展行宽。${outdentNote}`,
    hint: preset.note,
  };
}

// Section 01: 20 条真实排版与印前术语表（用于「找词头」两轮实测计时；每条宽屏下均稳定折成 2 行以上）
export const GLOSSARY_TERMS = [
  { term: "版心", def: "书页四周留出页边距后，实际用于容纳正文、插图、表格与脚注的核心图文区域，决定了全书的基本视野比例与留白尺度。" },
  { term: "天头", def: "书页上边缘到版心最顶行文字之间的上方空白带，传统书籍常用来放置书眉或供读者眉批，宽度多略窄于下方的地脚留白。" },
  { term: "地脚", def: "版心最末一行文字到书页下边缘之间的底部空白带，通常比天头更宽以托住视觉重心，并用来安放页码或脚注尾行。" },
  { term: "订口", def: "书籍靠近书脊装订一侧的内页边距；胶装书与厚本平装书翻开时会向中缝下陷，往往需要额外加宽订口以免吞字。" },
  { term: "切口", def: "书籍翻阅外侧的边口留白，既是读者翻页时拇指持书的安全握持区，也常用来排布旁注、边码与章节检索标贴。" },
  { term: "书眉", def: "排印在版心上方天头处、用来标示书名、篇名或当前章节名称的导航小字，帮助读者在快速翻页时立刻确认所在位置。" },
  { term: "鱼尾", def: "传统线装古籍版口中缝处形似鱼尾的黑色折记装饰，既标示书叶对折时的中心基准，也常在其上下分列书名与卷次页码。" },
  { term: "出血", def: "满版底色、色块或跨边图片向外多延出成品裁切线约 3 毫米的冗余面积，用来吸收裁纸机的微小误差，防止成品露出白边。" },
  { term: "字偶距", def: "针对特定一对相邻字符（如拉丁字母 AV、To 或特定标点组合）单独微调的字间距，用以消除视觉空洞、令整行密度更匀称。" },
  { term: "行距", def: "相邻两行文字基线之间的垂直距离，直接决定段落整体的灰黑密度以及读者视线从行末回扫到下一行开头时的顺畅程度。" },
  { term: "基线网格", def: "贯穿整张页面的等距水平隐形参考线，所有正文行脚都吸附其上，使多栏版面与左右对页的文字行始终保持水平齐平。" },
  { term: "孤行", def: "段落第一行被孤零零留在上一页最底部、其余各行全部跳到下一页开头的断页瑕疵，会打断段落起始的整体视觉节奏。" },
  { term: "寡行", def: "段落最后一行只剩三两个短字单独落在下一页顶部的排版毛病，看起来像一截残尾，通常需通过微调字距或行文收拢消化。" },
  { term: "避头尾", def: "中文排版中的禁则规则：禁止句号、逗号、顿号与后引号落到行首，也禁止前引号、前括号与前书名号孤悬在行末。" },
  { term: "齐行", def: "通过微调行内词距或字距，使一段文字的左右两端同时严丝合缝贴紧版心边线的排法，常见于报纸、期刊与传统精装书籍。" },
  { term: "中宫", def: "汉字外框以内核心笔画所围成的结构松紧度；中宫宽放的字体开朗饱满、小字号清晰，中宫收紧的字体则显秀挺隽永。" },
  { term: "字怀", def: "字形笔画在内部围合出的负空间面积；字怀足够通透开阔时，即使在低分辨率屏幕或小字号印品里也不容易糊成一团黑墨。" },
  { term: "铅字", def: "传统活版印刷中以铅锡锑合金铸成的单字凸版金属字粒，排字工按稿件逐字从字架拣入字盘，拼齐成行后上机施印。" },
  { term: "活版", def: "将可独立移动的单个金属或木刻字粒组合成整版图文、印完后再拆散复用的凸版印刷工艺，区别于整块刻制的雕版印刷。" },
  { term: "脚码", def: "排在书页地脚外侧或版心正下方的页码数字，通常与顶部的书眉互为上下呼应，为长篇读物建立清晰稳定的翻页坐标。" },
];

// Section 03: 真实排版文献书目（姓氏长短不一，演示版心栏宽 × 缩进深度的拉锯）
export const BIB_SAMPLES = [
  {
    author: "Lupton, E.",
    year: "(2010).",
    title: "Thinking with Type: A Critical Guide for Designers, Writers, Editors, and Students",
    rest: " (2nd ed.). New York: Princeton Architectural Press.",
  },
  {
    author: "Bringhurst, R.",
    year: "(2012).",
    title: "The Elements of Typographic Style",
    rest: " (4th ed.). Seattle: Hartley & Marks.",
  },
  {
    author: "Tschichold, J.",
    year: "(1991).",
    title: "The Form of the Book: Essays on the Morality of Good Design",
    rest: " (H. Hadeler, Trans.). Point Roberts: Hartley & Marks.",
  },
  {
    author: "Hochuli, J., & Kinross, R.",
    year: "(1996).",
    title: "Designing Books: Practice and Theory",
    rest: ". London: Hyphen Press.",
  },
];

// Section 03: 版心栏宽 × 缩进深度 评估（姓氏长短不一的真实书目）
export function evaluateMeasureDepth(indentEm, measureEm, totalLines = 12) {
  const ratio = indentEm / measureEm;
  const pct = Math.round(ratio * 100);
  const remain = Math.max(6, measureEm - indentEm);

  if (indentEm < 1.0) {
    return {
      tag: "台阶过浅",
      status: "warn",
      summary: `当前缩进仅 ${indentEm.toFixed(1)} em（占栏宽 ${pct}%）：四条书目虽折成 ${totalLines} 行，但 Lupton、Bringhurst、Tschichold 等姓氏几乎没有探出左缘，纵扫时容易和下方书名混成一片。`,
    };
  }
  if (ratio > 0.28 || remain < 13) {
    return {
      tag: "窄栏被挤碎",
      status: "bad",
      summary: `缩进 ${indentEm.toFixed(1)} em 已吃掉 ${pct}% 的版心宽度（续行仅剩 ${remain.toFixed(1)} em），四条书目被迫拉长到 ${totalLines} 行。栏宽收窄时绝不能硬保死数值，应同步收小缩进深度。`,
    };
  }
  if (indentEm > 4.2) {
    return {
      tag: "走廊偏空",
      status: "warn",
      summary: `缩进 ${indentEm.toFixed(1)} em 试图躲开更长的著者名（如 Hochuli & Kinross），但书目本就无需退过完整姓氏——左侧空出 ${pct}% 栏宽，四条共折 ${totalLines} 行，右侧续行明显偏瘦。`,
    };
  }
  if (measureEm <= 22 && indentEm > 2.6) {
    return {
      tag: "窄栏偏紧",
      status: "warn",
      summary: `在 ${measureEm} em 的窄栏（接近手机竖屏）里，${indentEm.toFixed(1)} em 缩进已占 ${pct}%（续行宽 ${remain.toFixed(1)} em，共 ${totalLines} 行）。移动端可酌情收紧到 1.5–2.2 em 保住阅读节奏。`,
    };
  }
  return {
    tag: "比例舒适",
    status: "good",
    summary: `栏宽 ${measureEm} em 配 ${indentEm.toFixed(1)} em 悬挂（仅占 ${pct}%，续行宽 ${remain.toFixed(1)} em，共 ${totalLines} 行）：姓氏前半段利落探出左缘便于按字母纵扫，书名与出版信息仍有充裕展开空间。`,
  };
}

// Section 07: Practice Quiz
export const QUIZ_OPTIONS = {
  A: {
    correct: false,
    title: "A 是「首行缩进」，刚好用反了",
    text: "作者姓氏退进了段落里，而出版年份、出版社这些次要续行反而顶在最左边缘。读者想按字母表查 Bringhurst 或 Johnson 时，眼睛在左边界上抓不到入口——这是连续散文的分段法，不适合参考文献。",
  },
  B: {
    correct: false,
    title: "B 的悬挂缩进过深，吃掉了近一半栏宽",
    text: "虽然首行探出来了，但续行缩进占了接近 45% 的版心宽度。结果每条书目被硬生生挤成瘦高窄条，右侧参差剧烈、垂直篇幅暴增，牺牲了阅读节奏。",
  },
  C: {
    correct: true,
    title: "答对了！C 是标准的悬挂缩进",
    text: "首行顶格突出作者姓氏，续行统一内缩约 2 em（印刷文献规范为 0.5 英寸），既在左缘切出干净的垂直检索走廊，又给续行留足舒展的栏宽，三条书目层次一目了然。",
  },
  D: {
    correct: false,
    title: "D 是「手动回车 + 敲空格」硬拼出来的假悬挂",
    text: "版心稍微收窄或换字号后，硬回车把完整句子拦腰截断，冒出孤零零的短词换行，续行左缘也参差不齐。真正可靠的悬挂缩进必须交给段落样式或 CSS 自动计算。",
  },
};
