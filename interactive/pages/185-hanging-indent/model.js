// 悬挂缩进（No. 185）状态模型与教学数据
// 所有交互画布和控件共享同一份纯数据：缩进量以 em 为单位（-2.5..5.0），统一归一化到 0..1 供手柄定位。

export const INDENT_MIN = -2.5;
export const INDENT_MAX = 5.0;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const indentToU = (em) => clamp((em - INDENT_MIN) / (INDENT_MAX - INDENT_MIN), 0, 1);
export const uToIndent = (u) => INDENT_MIN + clamp(u, 0, 1) * (INDENT_MAX - INDENT_MIN);
export const fmtEm = (em) => `${em > 0 ? "+" : ""}${em.toFixed(1)} em`;

export const PRESETS = {
  poster: {
    id: "poster",
    label: "原海报五词条",
    shortLabel: "原海报",
    sweet: 2.8,
    snapPoints: [-2.0, 0, 2.8],
    note: "原海报以「圆点 + 术语」坐镇左侧基线，续行整体右退至释义首字下方，五条核心概念一眼排开。",
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
    sweet: 2.4,
    snapPoints: [-2.0, 0, 2.4],
    note: "APA、MLA 与芝加哥规范均要求参考文献采用 0.5 英寸悬挂缩进，让作者姓氏从左侧探出，按字母表一秒查到。",
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
    sweet: 2.0,
    snapPoints: [-2.0, 0, 2.0],
    note: "词典正文极其密集，没有整行段距可挥霍；全靠词头顶格、释义内缩撑开每一条的起止边界。",
    entries: [
      {
        marker: "",
        head: "【悬】xuán",
        body: "① 挂在空中，不着地面。② 版式术语，指首行探出基线而后续各行向内收束的排法。",
      },
      {
        marker: "",
        head: "【缩】suō",
        body: "① 向后退，往里收。② 排版中将行首自版心左缘向内推入固定字距，用来区分层级或段落。",
      },
      {
        marker: "",
        head: "【检】jiǎn",
        body: "① 查核、翻找。② 读者不逐字通读，而沿左侧基准线快速下扫，定位目标词头的过程。",
      },
    ],
  },
  clause: {
    id: "clause",
    label: "编号条款",
    shortLabel: "条款",
    sweet: 2.6,
    snapPoints: [-2.0, 0, 2.6],
    note: "带序号的目录与条文里，把续行退到编号右侧，所有编号便自动组成一条干脆的索引栏。",
    entries: [
      {
        marker: "[01]",
        head: "首行锚定",
        body: "每条首行紧贴左侧对齐基线，让序号与关键词暴露在最外侧，形成稳定的垂向入口。",
      },
      {
        marker: "[02]",
        head: "续行退让",
        body: "第二行及以后统一向右内缩，在左缘下方留出连续空白走廊，避免正文遮挡下一条编号。",
      },
      {
        marker: "[03]",
        head: "宽度节制",
        body: "缩进深度需配合栏宽取舍；经验上一般控制在 1.5 至 2.5 个字宽，或精确对齐编号之后。",
      },
    ],
  },
};

export function snapIndent(presetId, rawEm) {
  const preset = PRESETS[presetId] || PRESETS.poster;
  const clamped = clamp(rawEm, INDENT_MIN, INDENT_MAX);
  for (const pt of preset.snapPoints) {
    if (Math.abs(clamped - pt) < 0.24) {
      return { em: pt, snapped: true, snapKind: pt === 0 ? "zero" : pt < 0 ? "first" : "sweet" };
    }
  }
  return { em: Math.round(clamped * 10) / 10, snapped: false, snapKind: "free" };
}

export function evaluateIndent(em, presetId = "poster") {
  const preset = PRESETS[presetId] || PRESETS.poster;
  if (em <= -0.45) {
    return {
      status: "reverse",
      badge: "反了 · 首行缩进",
      title: "首行退进去了，词头被续行吞没",
      text: `当前为 ${em.toFixed(1)} em，首行内缩而续行顶格——这是连续正文用的「首行缩进」。拿来排条目时，视线沿左缘往下扫，最先撞见的是上一条的残句，目标词头反而缩在凹槽里。`,
      hint: "把珊瑚红游标往右拖过 0 em，看看词头怎样从正文里「站出来」。",
    };
  }
  if (Math.abs(em) < 0.45) {
    return {
      status: "flat",
      badge: "0 em · 齐左密墙",
      title: "所有行平齐，条目边界化进一片灰",
      text: "首行与续行落在同一条竖线上。若不额外拉开很大的段距，五条内容就会粘成一块密不透风的文字砖，找「对齐」或「留白」必须逐行慢读。",
      hint: `继续往右拖到约 +${preset.sweet.toFixed(1)} em，打开左侧检索走廊。`,
    };
  }
  if (em < 1.25) {
    return {
      status: "shallow",
      badge: "探出偏浅",
      title: "台阶太微弱，余光还分不清主次",
      text: `只内缩 +${em.toFixed(1)} em，续行退让幅度不到一个半汉字。快扫时，首行探出的「把手」不够显眼，稍微拉远一点看就会重新混成齐左边缘。`,
      hint: `再往右拉到 +${preset.sweet.toFixed(1)} em 附近，左侧走廊会立刻成形。`,
    };
  }
  if (em <= 3.2) {
    const exact = Math.abs(em - preset.sweet) < 0.25;
    return {
      status: "sweet",
      badge: exact ? "最佳悬挂区" : "清晰可扫",
      title: exact ? "首行立在基线上，检索走廊彻底打开" : "首行探出利落，续行秩序稳定",
      text: `续行内缩 +${em.toFixed(1)} em，在每条词头下方留出一条连贯的垂直空白通道。眼睛可以贴着左基线一路直落，只看探出来的词头，找到目标再向右展开读释义。`,
      hint: preset.note,
    };
  }
  return {
    status: "deep",
    badge: "过深 · 续行挤碎",
    title: "左缘空出一大条，续行被挤成窄烟囱",
    text: `内缩高达 +${em.toFixed(1)} em，续行可用行宽被吃掉太多。结果每一条都被迫多折一两行，右侧锯齿变剧烈，整版拉长，反而拖慢了对比效率。`,
    hint: `往左收回至 +${preset.sweet.toFixed(1)} em（经验区间 1.5–2.8 em），平衡检索走廊与行长。`,
  };
}

// Section 03: Depth × Measure Calibrator evaluator
export function evaluateCalibrator(indentEm, measureEm, mode) {
  const ratio = indentEm / measureEm;
  const remain = Math.max(4, measureEm - indentEm);
  if (indentEm < 0.5) {
    return {
      tag: "接近齐左",
      status: "warn",
      summary: `缩进仅 ${indentEm.toFixed(1)} em（占栏宽 ${Math.round(ratio * 100)}%）：几乎看不出台阶，条目标题无法脱离续行独立被扫描。`,
    };
  }
  if (indentEm < 1.3) {
    return {
      tag: "偏浅",
      status: "warn",
      summary: `缩进 ${indentEm.toFixed(1)} em：中文条目下少于 1.5 个字宽时，探出量略显拘谨；${mode === "marker" ? "而且还不足以让过序号宽度，续行会缩在编号底下。" : "快速纵扫时停顿感不够干脆。"}`,
    };
  }
  if (ratio > 0.32) {
    return {
      tag: "挤压行宽",
      status: "bad",
      summary: `缩进吃掉了 ${Math.round(ratio * 100)}% 的栏宽，续行只剩约 ${remain.toFixed(1)} em。窄栏里（如手机竖屏）千万别照搬桌面端的大缩进，否则续行会碎成极短的断片。`,
    };
  }
  if (mode === "marker" && Math.abs(indentEm - 2.6) > 0.55) {
    return {
      tag: "未对准正文",
      status: "warn",
      summary: `带编号条目建议让续行精确落在正文首字正下方（本例编号「[01]」加空隙约 2.6 em）。目前偏离了对齐线，左缘会出现第三条多余的垂直折痕。`,
    };
  }
  return {
    tag: "比例舒适",
    status: "good",
    summary: `缩进 ${indentEm.toFixed(1)} em、续行仍保住 ${remain.toFixed(1)} em（占栏宽 ${Math.round((1 - ratio) * 100)}%）：左侧检索通道一眼可见，右侧文字换行也保持平稳呼吸。`,
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
