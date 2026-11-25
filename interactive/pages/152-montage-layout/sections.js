// 152 蒙太奇版式 · 正文 01–06 节独立互动模块
// 每节采用不同交互形式，相邻节控件不重复。

// ---------- 01 节：库里肖夫并置对照台 ----------
const KULESHOV_PAIRS = {
  soup: {
    id: "soup",
    label: "热汤瓷碗",
    code: "PAIR A · 渴望",
    leftNote: "同一幅无五官静默侧影（未改一像素）",
    rightNote: "冒着细气的一碗浓汤",
    third: "读出「饥饿与期盼」",
    explain: "人物剪影始终是同一张中性轮廓，但并置碎片一换上热汤，观众就会自动把人物姿态读成「凝视食物」，替剪影补上渴望情绪。",
    tension: "温和 · 生理共鸣",
    accent: "#E28115",
    rightSvg: `
      <rect width="220" height="170" fill="#181513"/>
      <ellipse cx="110" cy="116" rx="64" ry="20" fill="#551014"/>
      <path d="M52 106 Q110 156 168 106 Z" fill="#F2E1CB"/>
      <ellipse cx="110" cy="106" rx="58" ry="15" fill="#E28115"/>
      <path d="M88 86 Q82 68 92 52 M110 82 Q104 62 116 44 M132 86 Q126 68 136 52" stroke="#FAF3E8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.85"/>
    `,
  },
  storm: {
    id: "storm",
    label: "暴雨孤楼",
    code: "PAIR B · 压迫",
    leftNote: "同一幅无五官静默侧影（未改一像素）",
    rightNote: "密集斜雨切割冷硬高楼",
    third: "读出「孤立与压迫」",
    explain: "把热汤换成大雨里的垂直高楼，原本平静的侧影立刻显得沉重而渺小。冷硬直线与人体弧线并置，制造出强烈的环境压迫感。",
    tension: "高张力 · 空间对抗",
    accent: "#551014",
    rightSvg: `
      <rect width="220" height="170" fill="#121110"/>
      <rect x="26" y="42" width="44" height="128" fill="#2A2624"/>
      <rect x="78" y="20" width="54" height="150" fill="#551014"/>
      <rect x="140" y="54" width="50" height="116" fill="#231F1D"/>
      <g stroke="#DFC7AD" stroke-width="1.4" opacity="0.6">
        <line x1="36" y1="8" x2="10" y2="162"/>
        <line x1="76" y1="8" x2="50" y2="162"/>
        <line x1="116" y1="8" x2="90" y2="162"/>
        <line x1="156" y1="8" x2="130" y2="162"/>
        <line x1="196" y1="8" x2="170" y2="162"/>
      </g>
    `,
  },
  clock: {
    id: "clock",
    label: "裂纹时钟",
    code: "PAIR C · 焦灼",
    leftNote: "同一幅无五官静默侧影（未改一像素）",
    rightNote: "逼近零点的倾斜表盘",
    third: "读出「倒计时与焦虑」",
    explain: "人像与指针并置，空间瞬间被注入时间流逝的压迫感。即使画面里没有一行标语，读者也会读出「来不及了」的紧迫叙事。",
    tension: "急促 · 时间催逼",
    accent: "#B3261E",
    rightSvg: `
      <rect width="220" height="170" fill="#551014"/>
      <circle cx="110" cy="85" r="56" fill="#FAF3E8" stroke="#121110" stroke-width="4"/>
      <line x1="110" y1="85" x2="110" y2="42" stroke="#121110" stroke-width="4"/>
      <line x1="110" y1="85" x2="146" y2="70" stroke="#E28115" stroke-width="4.5"/>
      <path d="M58 46 L102 82 L88 106 L154 134" stroke="#551014" stroke-width="2" fill="none" stroke-dasharray="5 3"/>
      <circle cx="110" cy="85" r="5" fill="#121110"/>
    `,
  },
  lamp: {
    id: "lamp",
    label: "破晓书灯",
    code: "PAIR D · 思索",
    leftNote: "同一幅无五官静默侧影（未改一像素）",
    rightNote: "暗桌上亮着的一盏暖灯",
    third: "读出「沉思与守望」",
    explain: "暖橘光锥与暗调轮廓并置，把静默转译为「深夜伏案的专注」。这就是爱森斯坦所说的「两个独立画面相撞，产出第三概念」。",
    tension: "沉静 · 暖冷平衡",
    accent: "#1B6B5C",
    rightSvg: `
      <rect width="220" height="170" fill="#121110"/>
      <polygon points="110,48 48,158 172,158" fill="#E28115" opacity="0.28"/>
      <path d="M84 52 L136 52 L124 30 L96 30 Z" fill="#F2E1CB"/>
      <line x1="110" y1="0" x2="110" y2="30" stroke="#DFC7AD" stroke-width="2.5"/>
      <circle cx="110" cy="54" r="7" fill="#F7A13B"/>
      <rect x="44" y="138" width="132" height="12" fill="#551014"/>
    `,
  },
};

export function initKuleshovSection() {
  const btns = [...document.querySelectorAll("[data-kuleshov]")];
  const rightSvg = document.getElementById("kuleshov-right-svg");
  const codeEl = document.getElementById("kuleshov-code");
  const thirdEl = document.getElementById("kuleshov-third");
  const explainEl = document.getElementById("kuleshov-explain");
  const tensionEl = document.getElementById("kuleshov-tension");
  const rightCap = document.getElementById("kuleshov-right-cap");
  if (!btns.length || !rightSvg) return;

  function select(id) {
    const item = KULESHOV_PAIRS[id] || KULESHOV_PAIRS.soup;
    btns.forEach((b) => {
      const on = b.dataset.kuleshov === item.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    rightSvg.innerHTML = item.rightSvg;
    codeEl.textContent = item.code;
    thirdEl.textContent = item.third;
    explainEl.textContent = item.explain;
    tensionEl.textContent = item.tension;
    rightCap.textContent = item.rightNote;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.kuleshov)));
  select("soup");
}

// ---------- 02 节：六条骨架 SVG 解剖剥离器 ----------
const ANATOMY_ITEMS = {
  juxtaposition: {
    zh: "并置对比",
    en: "JUXTAPOSITION",
    quote: "通过元素并置制造张力与差异",
    plain: "把不同材质、尺度或语义的素材摆进同一视野，不让它们互相客气。冷硬建筑配流动曲线、理性点阵配手刷粗笔触，差异越大，接缝处的火花越响亮。",
    tip: "实操检查：把相邻两帧捂住一半看，如果材质和情绪完全相同，就说明只是重复平铺，还没形成并置。",
  },
  layering: {
    zh: "层叠构建",
    en: "LAYERING",
    quote: "元素前后叠加，建立空间层次",
    plain: "平面画纸本来只有上下左右，让一块压住另一块的边角，大脑立刻读出「谁在前、谁在后」。经验上让接缝咬合控制在 15%–35%，既接通关系又不捂死底层信息。",
    tip: "实操检查：永远把最关键的主体或字块留在上层或完整露出，绝不为了叠层牺牲核心信息。",
  },
  fragment: {
    zh: "碎片组合",
    en: "FRAGMENT",
    quote: "打破完整，重组碎片形成新秩序",
    plain: "不必把每张素材从头到脚完整塞进版面。大胆裁掉多余背景，只留最具辨识度的局部（一只手、半个圆、一段等高线），让读者的想象去补完边界之外的世界。",
    tip: "说清楚一点：打破完整不等于切得越碎越好。一页里 3 到 5 个强辨识度碎片通常已够撑起秩序，超过 7 块极易滑向杂乱（经验值）。",
  },
  rhythm: {
    zh: "节奏变化",
    en: "RHYTHM",
    quote: "大小、疏密、方向的变化形成节奏",
    plain: "把全景大帧、中景过渡与特写小帧交替排布，让最大与最小片段拉开约 2 倍以上的面积级差，再穿插水平与微斜方向，版面就会生出像电影剪辑一样的呼吸快慢。",
    tip: "实操检查：眯起眼睛看整页灰块，如果每块面积差不多大，说明节奏已经被抹平了。",
  },
  contrast: {
    zh: "对比强化",
    en: "CONTRAST",
    quote: "色彩、形状、粗细的对比突出重点",
    plain: "像 152 原海报一样，先用炭黑与深酒红压住暖宣纸，建立强烈的明暗骨架；再把高饱和焦糖橘留给全页唯一一处视觉爆点（例如大 X 或落日），一眼锁定焦点。",
    tip: "实操检查：高饱和亮色只给 1 个主锚点；一旦全页处处抢眼，对比强化就会倒退为噪声。",
  },
  narrative: {
    zh: "叙事表达",
    en: "NARRATIVE",
    quote: "元素组合传递信息，构建故事线",
    plain: "所有碎片必须服务同一条主线，让眼睛顺着 ①→②→③→④ 走完「起势—转折—冲突—落点」。如果删掉其中一块，故事仍然完整，说明这块只是多余装饰，应该果断拿掉。",
    tip: "实操检查：试着用一句话把四块碎片串成故事；如果串不起来，说明还在拼素材，还没在讲内容。",
  },
};

export function initAnatomySection() {
  const btns = [...document.querySelectorAll("[data-anatomy]")];
  const xrayBtn = document.getElementById("anatomy-xray-btn");
  const svg = document.getElementById("anatomy-svg");
  const titleEl = document.getElementById("anatomy-title");
  const enEl = document.getElementById("anatomy-en");
  const quoteEl = document.getElementById("anatomy-quote");
  const plainEl = document.getElementById("anatomy-plain");
  const tipEl = document.getElementById("anatomy-tip");
  if (!btns.length || !svg) return;

  let active = "juxtaposition";
  let xray = false;

  function render() {
    const item = ANATOMY_ITEMS[active];
    btns.forEach((b) => {
      const on = b.dataset.anatomy === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    titleEl.textContent = item.zh;
    enEl.textContent = item.en;
    quoteEl.textContent = `原海报原话：「${item.quote}」`;
    plainEl.textContent = item.plain;
    tipEl.textContent = item.tip;
    svg.dataset.mode = active;
    svg.classList.toggle("is-xray", xray);
    if (xrayBtn) {
      xrayBtn.setAttribute("aria-pressed", String(xray));
      xrayBtn.textContent = xray ? "关闭 X-Ray 透视" : "开启 X-Ray 透视接缝";
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => { active = b.dataset.anatomy; render(); }));
  if (xrayBtn) {
    xrayBtn.addEventListener("click", () => { xray = !xray; render(); });
  }
  render();
}

// ---------- 03 节：暗房胶片年代检视器（全经核实的权威史实） ----------
const HISTORY_ERAS = {
  dada: {
    year: "1915–1920",
    name: "柏林达达 · 摄影蒙太奇",
    people: "汉娜·霍赫（Hannah Höch）、约翰·哈特菲尔德（John Heartfield）",
    work: "《用餐刀切开魏玛最后一个啤酒肚文化纪元》（1919–1920）",
    text: "一战前后，柏林达达派开始把报纸照片、广告裁片与大号标题拆解重组，用刺眼的尺度反差与荒诞并置讽刺战争与社会秩序。英语里的 photomontage 一词也由此成为平面抗议与媒介批判的利器。",
    grammar: "构图语法：打破单一透视，用极大特写压小人物，倾斜裁切制造冲突感。",
    svg: `
      <rect width="360" height="210" fill="#1B1816"/>
      <rect x="26" y="24" width="134" height="156" fill="#DFC7AD" transform="rotate(-4 93 102)"/>
      <circle cx="96" cy="92" r="38" fill="#121110"/>
      <rect x="64" y="136" width="66" height="12" fill="#551014" transform="rotate(-4 97 142)"/>
      <polygon points="150,36 332,20 318,136 144,118" fill="#551014"/>
      <text x="168" y="88" fill="#FAF3E8" font-family="Syne, sans-serif" font-weight="800" font-size="30" transform="rotate(-4 168 88)">DADA!</text>
      <rect x="192" y="108" width="136" height="76" fill="#F2E1CB" transform="rotate(3 260 146)"/>
      <circle cx="242" cy="146" r="22" fill="#E28115"/>
      <line x1="210" y1="120" x2="310" y2="174" stroke="#121110" stroke-width="5"/>
    `,
  },
  construct: {
    year: "1910s末–1923",
    name: "库里肖夫与构成主义",
    people: "列夫·库里肖夫（Lev Kuleshov）、亚历山大·罗德琴科（Aleksandr Rodchenko）",
    work: "莫斯科电影实验 & 马雅可夫斯基《关于这个》（Pro eto，1923）",
    text: "库里肖夫在莫斯科证明：同一张无表情人脸接在不同画面旁，观众会读出截然不同的情绪。1923 年，罗德琴科把摄影蒙太奇引入书籍与海报，以几何斜线、强烈黑白红对比与空间跃动组织现代阅读秩序。",
    grammar: "构图语法：强对角动势、黑红米三色几何分割，碎片服务清晰的信息方向。",
    svg: `
      <rect width="360" height="210" fill="#141211"/>
      <polygon points="22,188 182,22 254,188" fill="#551014"/>
      <circle cx="248" cy="86" r="52" fill="#F2E1CB"/>
      <polygon points="94,54 256,92 126,128" fill="#E28115"/>
      <rect x="28" y="30" width="96" height="22" fill="#FAF3E8"/>
      <rect x="28" y="60" width="66" height="10" fill="#DFC7AD"/>
      <line x1="16" y1="176" x2="344" y2="38" stroke="#FAF3E8" stroke-width="2" stroke-dasharray="6 4"/>
    `,
  },
  bauhaus: {
    year: "1925–1928",
    name: "照片塑形与新字体排印",
    people: "莫霍利-纳吉（László Moholy-Nagy）、扬·奇肖尔德（Jan Tschichold）",
    work: "《绘画、摄影、电影》（1925）&《新字体排印》（1928）",
    text: "包豪斯导师莫霍利-纳吉在 1925 年提出「照片塑形（Fotoplastik）」，把负片叠影、几何线条与摄影碎片编织成通透的空间结构；1928 年奇肖尔德在《新字体排印》中将非对称与摄影图文结合整理成现代平面设计方法。",
    grammar: "构图语法：大片透气留白 + 精准几何引线 + 摄影剪裁块与无衬线标题咬合。",
    svg: `
      <rect width="360" height="210" fill="#F2E1CB"/>
      <rect x="24" y="22" width="128" height="166" fill="#121110"/>
      <circle cx="88" cy="96" r="36" fill="none" stroke="#F2E1CB" stroke-width="2.5"/>
      <line x1="88" y1="30" x2="296" y2="162" stroke="#E28115" stroke-width="3.5"/>
      <rect x="128" y="54" width="108" height="72" fill="#551014" opacity="0.92"/>
      <rect x="210" y="96" width="120" height="84" fill="#FAF3E8" stroke="#121110" stroke-width="2"/>
      <circle cx="286" cy="134" r="18" fill="#121110"/>
      <rect x="224" y="156" width="84" height="8" fill="#551014"/>
    `,
  },
  eisenstein: {
    year: "1929",
    name: "爱森斯坦冲突蒙太奇",
    people: "谢尔盖·爱森斯坦（Sergei Eisenstein）",
    work: "《电影原理与表意文字》《辩证的电影形式观》（1929）",
    text: "爱森斯坦把蒙太奇推向理论高峰：他反对把剪辑只当成顺滑串联，认为镜头是彼此独立的细胞，必须通过尺度、方向与观念的剧烈「碰撞（collision）」产生火花——就像汉字会意「口 + 犬 = 吠」，由两块碎片撞出全新概念。",
    grammar: "构图语法：A（正题）× B（反题）在接缝处对冲，催生超越两者的第三意义 C。",
    svg: `
      <rect width="360" height="210" fill="#141211"/>
      <rect x="24" y="34" width="118" height="142" fill="#F2E1CB"/>
      <polygon points="38,160 83,58 128,160" fill="#121110"/>
      <rect x="122" y="48" width="118" height="126" fill="#551014"/>
      <circle cx="181" cy="111" r="34" fill="#121110"/>
      <line x1="154" y1="84" x2="208" y2="138" stroke="#E28115" stroke-width="7"/>
      <line x1="208" y1="84" x2="154" y2="138" stroke="#E28115" stroke-width="7"/>
      <rect x="226" y="30" width="110" height="150" fill="#FAF3E8"/>
      <circle cx="281" cy="78" r="22" fill="#E28115"/>
      <rect x="246" y="122" width="70" height="10" fill="#121110"/>
      <rect x="246" y="140" width="48" height="10" fill="#551014"/>
    `,
  },
};

export function initHistorySection() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const svgWrap = document.getElementById("history-svg");
  const yearEl = document.getElementById("history-year");
  const nameEl = document.getElementById("history-name");
  const peopleEl = document.getElementById("history-people");
  const workEl = document.getElementById("history-work");
  const textEl = document.getElementById("history-text");
  const grammarEl = document.getElementById("history-grammar");
  if (!btns.length || !svgWrap) return;

  function select(id) {
    const e = HISTORY_ERAS[id] || HISTORY_ERAS.dada;
    btns.forEach((b) => {
      const on = b.dataset.era === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    svgWrap.innerHTML = e.svg;
    yearEl.textContent = e.year;
    nameEl.textContent = e.name;
    peopleEl.textContent = e.people;
    workEl.textContent = e.work;
    textEl.textContent = e.text;
    grammarEl.textContent = e.grammar;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("dada");
}

// ---------- 04 节：何时用 / 何时别用 · 场景压测对比器 ----------
const SCENARIOS = {
  festival: {
    label: "独立电影节主视觉",
    verdict: "适合蒙太奇",
    good: true,
    montageDesc: "观众看海报只有 2 秒停留。将胶片帧、城市剪影、片名宣言与单一焦糖橘场记号层叠并置，瞬间传递「多声部影像交汇」的气质，记忆点远强于平铺剧照。",
    gridDesc: "若改用规整四格剧照平铺，信息虽然工整，却像普通影片目录，丢失了电影节应有的戏剧张力和情绪入口。",
    montageMetrics: { fit: "高匹配", scan: "一眼定调", risk: "低误读" },
    gridMetrics: { fit: "偏平淡", scan: "像片单目录", risk: "辨识度弱" },
    montageSvg: `
      <rect width="280" height="160" fill="#F2E1CB"/>
      <rect x="18" y="16" width="128" height="106" fill="#121110"/>
      <circle cx="94" cy="64" r="34" fill="#551014"/>
      <rect x="114" y="42" width="144" height="98" fill="#551014"/>
      <line x1="158" y1="62" x2="218" y2="122" stroke="#E28115" stroke-width="10"/>
      <line x1="218" y1="62" x2="158" y2="122" stroke="#E28115" stroke-width="10"/>
      <rect x="104" y="34" width="38" height="11" fill="#CD752A" transform="rotate(14 123 39)"/>
      <rect x="26" y="132" width="108" height="14" fill="#121110"/>
    `,
    gridSvg: `
      <rect width="280" height="160" fill="#FAF3E8"/>
      <rect x="18" y="16" width="114" height="58" fill="#DFC7AD" stroke="#9E8B76"/>
      <rect x="148" y="16" width="114" height="58" fill="#DFC7AD" stroke="#9E8B76"/>
      <rect x="18" y="86" width="114" height="58" fill="#DFC7AD" stroke="#9E8B76"/>
      <rect x="148" y="86" width="114" height="58" fill="#DFC7AD" stroke="#9E8B76"/>
    `,
  },
  er: {
    label: "急诊室分诊导视牌",
    verdict: "千万别用蒙太奇",
    good: false,
    montageDesc: "紧急情况下患者与家属需要 0.5 秒找到箭头和科室。层叠、斜切、异质破碎会强行制造解码成本，极易引起焦虑与走错通道——在这里炫技就是事故。",
    gridDesc: "高对比分区、固定阅读基线、清晰方向箭头与严格信息分级，把视觉噪声降到零，让最焦急的人也能一秒看懂去向。",
    montageMetrics: { fit: "严重误用", scan: "视线迷路", risk: "高延误风险" },
    gridMetrics: { fit: "正确选择", scan: "秒级识别", risk: "零解码阻力" },
    montageSvg: `
      <rect width="280" height="160" fill="#F2E1CB"/>
      <rect x="20" y="16" width="142" height="110" fill="#551014" transform="rotate(-5 91 71)"/>
      <rect x="96" y="32" width="150" height="104" fill="#121110" transform="rotate(6 171 84)"/>
      <text x="122" y="92" fill="#E28115" font-family="Noto Serif SC, serif" font-weight="900" font-size="22" transform="rotate(6 122 92)">急诊 / 药房?</text>
      <line x1="34" y1="138" x2="250" y2="28" stroke="#FAF3E8" stroke-width="3" stroke-dasharray="6 4"/>
    `,
    gridSvg: `
      <rect width="280" height="160" fill="#FAF3E8"/>
      <rect x="16" y="16" width="248" height="44" fill="#551014"/>
      <text x="32" y="44" fill="#FAF3E8" font-family="Noto Serif SC, serif" font-weight="900" font-size="18">急诊抢救室  →</text>
      <rect x="16" y="72" width="248" height="32" fill="#EFE0CA" stroke="#121110" stroke-width="1.5"/>
      <text x="32" y="93" fill="#121110" font-family="Noto Serif SC, serif" font-weight="700" font-size="14">挂号与分诊台  ↑ 直行 15m</text>
      <rect x="16" y="114" width="248" height="30" fill="#EFE0CA" stroke="#121110" stroke-width="1.5"/>
      <text x="32" y="134" fill="#121110" font-family="Noto Serif SC, serif" font-weight="700" font-size="14">24 小时药房  ← 左转</text>
    `,
  },
  editorial: {
    label: "城市记忆专题跨页",
    verdict: "适合蒙太奇",
    good: true,
    montageDesc: "老街等高线、新建筑剪影与口述历史引文同框交叠，让读者在读正文前就先感受到「新旧城市在同一片土地上折叠」的复杂时间层次。",
    gridDesc: "纯等宽栏格虽然干净，但会把「过去」与「现在」硬生生隔在两栏里，失去了时间交错的戏剧氛围。",
    montageMetrics: { fit: "高匹配", scan: "叙事代入强", risk: "留白可控" },
    gridMetrics: { fit: "中规中矩", scan: "情绪平淡", risk: "缺乏亮点" },
    montageSvg: `
      <rect width="280" height="160" fill="#F2E1CB"/>
      <rect x="18" y="18" width="116" height="122" fill="#DFC7AD"/>
      <path d="M18 110 Q72 62 134 94 M18 128 Q76 80 134 114" stroke="#551014" stroke-width="1.6" fill="none"/>
      <rect x="108" y="28" width="148" height="90" fill="#121110"/>
      <circle cx="212" cy="68" r="24" fill="#E28115"/>
      <rect x="148" y="96" width="114" height="48" fill="#551014"/>
      <rect x="162" y="112" width="76" height="6" fill="#FAF3E8"/>
      <rect x="162" y="126" width="54" height="5" fill="#DFC7AD"/>
    `,
    gridSvg: `
      <rect width="280" height="160" fill="#FAF3E8"/>
      <rect x="18" y="18" width="116" height="124" fill="#EFE0CA" stroke="#B7A38D"/>
      <rect x="146" y="18" width="116" height="124" fill="#EFE0CA" stroke="#B7A38D"/>
      <rect x="30" y="34" width="90" height="8" fill="#6E151B"/>
      <rect x="158" y="34" width="90" height="8" fill="#121110"/>
    `,
  },
  pricing: {
    label: "SaaS 套餐价格对比表",
    verdict: "千万别用蒙太奇",
    good: false,
    montageDesc: "用户做购买决策时，需要横向逐项比对功能与月费。一旦把三个套餐做成大小不一、前后叠压的碎片，横向对齐基准消失，用户立刻产生「是不是在藏条款」的不信任感。",
    gridDesc: "严格对齐的等高并列栏让每一行权益都落在同一条水平扫描线上，只用一个清晰徽标突出推荐项即可。",
    montageMetrics: { fit: "严重误用", scan: "无法横比", risk: "损毁信任" },
    gridMetrics: { fit: "正确选择", scan: "逐行速比", risk: "决策透明" },
    montageSvg: `
      <rect width="280" height="160" fill="#F2E1CB"/>
      <rect x="18" y="24" width="108" height="114" fill="#121110" transform="rotate(-4 72 81)"/>
      <text x="36" y="72" fill="#FAF3E8" font-family="IBM Plex Mono, monospace" font-size="16">¥99</text>
      <rect x="94" y="16" width="116" height="118" fill="#551014" transform="rotate(3 152 75)"/>
      <text x="122" y="72" fill="#E28115" font-family="IBM Plex Mono, monospace" font-size="22">¥299</text>
      <rect x="166" y="42" width="98" height="102" fill="#DFC7AD" transform="rotate(-3 215 93)"/>
      <text x="190" y="96" fill="#121110" font-family="IBM Plex Mono, monospace" font-size="15">¥899</text>
    `,
    gridSvg: `
      <rect width="280" height="160" fill="#FAF3E8"/>
      <rect x="16" y="20" width="76" height="122" fill="#EFE0CA" stroke="#121110"/>
      <rect x="102" y="20" width="76" height="122" fill="#551014"/>
      <rect x="188" y="20" width="76" height="122" fill="#EFE0CA" stroke="#121110"/>
      <text x="32" y="54" fill="#121110" font-family="IBM Plex Mono, monospace" font-size="14">¥99</text>
      <text x="114" y="54" fill="#F7A13B" font-family="IBM Plex Mono, monospace" font-size="14">¥299</text>
      <text x="200" y="54" fill="#121110" font-family="IBM Plex Mono, monospace" font-size="14">¥899</text>
      <line x1="16" y1="78" x2="264" y2="78" stroke="#9E8B76" stroke-dasharray="3 3"/>
      <line x1="16" y1="106" x2="264" y2="106" stroke="#9E8B76" stroke-dasharray="3 3"/>
    `,
  },
};

export function initScenarioSection() {
  const scBtns = [...document.querySelectorAll("[data-scenario]")];
  const modeBtns = [...document.querySelectorAll("[data-sc-mode]")];
  const svgEl = document.getElementById("scenario-svg");
  const verdictEl = document.getElementById("scenario-verdict");
  const descEl = document.getElementById("scenario-desc");
  const mFit = document.getElementById("sc-m-fit");
  const mScan = document.getElementById("sc-m-scan");
  const mRisk = document.getElementById("sc-m-risk");
  if (!scBtns.length || !svgEl) return;

  let curId = "festival";
  let curMode = "montage";

  function render() {
    const s = SCENARIOS[curId] || SCENARIOS.festival;
    scBtns.forEach((b) => {
      const on = b.dataset.scenario === curId;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modeBtns.forEach((b) => {
      const on = b.dataset.scMode === curMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const isMontage = curMode === "montage";
    svgEl.innerHTML = isMontage ? s.montageSvg : s.gridSvg;
    const isMatch = (isMontage && s.good) || (!isMontage && !s.good);
    verdictEl.textContent = `${s.verdict} · 当前预览：${isMontage ? "蒙太奇版" : "秩序网格版"}`;
    verdictEl.classList.toggle("is-good", isMatch);
    verdictEl.classList.toggle("is-bad", !isMatch);
    descEl.textContent = isMontage ? s.montageDesc : s.gridDesc;
    const met = isMontage ? s.montageMetrics : s.gridMetrics;
    mFit.textContent = met.fit;
    mScan.textContent = met.scan;
    mRisk.textContent = met.risk;
  }

  scBtns.forEach((b) => b.addEventListener("click", () => { curId = b.dataset.scenario; render(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { curMode = b.dataset.scMode; render(); }));
  render();
}

// ---------- 05 节：两题递进实战练习（纯中性选项，只差单变量） ----------
const QUIZZES = [
  {
    id: 0,
    stem: "第 1 / 2 题：用同一组 4 块「暗夜圆、点阵卡、酒红宣言、焦糖橘标点」做城市展览主海报，哪一个方案构成了成立的蒙太奇版式？",
    correct: "B",
    options: [
      {
        key: "A",
        meta: "四块等大 · 等宽白缝排布",
        reason: "方案 A 的四个碎片面积完全相同、彼此留出等宽白缝零叠合，结构上已经退化为规整四格面板，缺少大小节奏与接缝连接。",
        svg: `
          <rect width="200" height="136" fill="#F2E1CB"/>
          <rect x="14" y="14" width="80" height="50" fill="#121110"/>
          <circle cx="54" cy="39" r="14" fill="#551014"/>
          <rect x="106" y="14" width="80" height="50" fill="#DFC7AD"/>
          <rect x="14" y="72" width="80" height="50" fill="#551014"/>
          <rect x="106" y="72" width="80" height="50" fill="#121110"/>
          <circle cx="156" cy="96" r="10" fill="#E28115"/>
        `,
      },
      {
        key: "B",
        meta: "大中小阶梯 · 边角咬合 · 单橘锚点",
        reason: "正确！方案 B 拉开了全景大帧、中景过渡与小帧的尺度节奏，相邻边适度咬合且用胶带接通空间，炭黑与酒红压住暖纸，并只把唯一焦糖橘落点留给右下高潮帧。",
        svg: `
          <rect width="200" height="136" fill="#F2E1CB"/>
          <rect x="12" y="12" width="96" height="78" fill="#121110"/>
          <circle cx="68" cy="48" r="24" fill="#551014"/>
          <circle cx="88" cy="64" r="11" fill="#F2E1CB"/>
          <rect x="92" y="20" width="82" height="52" fill="#FAF3E8" stroke="#CCB69A"/>
          <rect x="44" y="76" width="70" height="46" fill="#551014"/>
          <rect x="102" y="64" width="84" height="58" fill="#121110"/>
          <line x1="128" y1="76" x2="164" y2="112" stroke="#E28115" stroke-width="6"/>
          <line x1="164" y1="76" x2="128" y2="112" stroke="#E28115" stroke-width="6"/>
          <rect x="94" y="66" width="24" height="8" fill="#CD752A" transform="rotate(14 106 70)"/>
        `,
      },
      {
        key: "C",
        meta: "尺度拉开 · 核心区重度叠压",
        reason: "方案 C 虽然有大小差异和单点橘色，但四个片段都挤在画面中央，叠压超过一半面积，把底层圆与中层文字完全遮挡，层次变成了互相捂死。",
        svg: `
          <rect width="200" height="136" fill="#F2E1CB"/>
          <rect x="46" y="18" width="102" height="82" fill="#121110"/>
          <rect x="58" y="28" width="84" height="62" fill="#FAF3E8" stroke="#CCB69A"/>
          <rect x="64" y="38" width="76" height="58" fill="#551014"/>
          <rect x="70" y="46" width="82" height="62" fill="#121110"/>
          <line x1="94" y1="60" x2="132" y2="96" stroke="#E28115" stroke-width="6"/>
          <line x1="132" y1="60" x2="94" y2="96" stroke="#E28115" stroke-width="6"/>
        `,
      },
      {
        key: "D",
        meta: "尺度与咬合相近 · 浅纸配三处橘标",
        reason: "方案 D 的叠合与尺寸级差其实都对，但四块全用相近浅暖灰纸（缺炭黑/酒红明度骨架），又在三张帧上同时涂满高饱和焦糖橘，焦点互相抢戏。",
        svg: `
          <rect width="200" height="136" fill="#F2E1CB"/>
          <rect x="12" y="12" width="96" height="78" fill="#DFC7AD" stroke="#C5AD91"/>
          <circle cx="56" cy="48" r="14" fill="#E28115"/>
          <rect x="92" y="20" width="82" height="52" fill="#EFE0CA" stroke="#C5AD91"/>
          <line x1="120" y1="30" x2="150" y2="58" stroke="#E28115" stroke-width="6"/>
          <line x1="150" y1="30" x2="120" y2="58" stroke="#E28115" stroke-width="6"/>
          <rect x="44" y="76" width="70" height="46" fill="#E5D1B8" stroke="#C5AD91"/>
          <rect x="102" y="64" width="84" height="58" fill="#DFC7AD" stroke="#C5AD91"/>
          <circle cx="144" cy="92" r="14" fill="#E28115"/>
        `,
      },
    ],
  },
  {
    id: 1,
    stem: "第 2 / 2 题：设计周准备制作「主展厅安全出口与楼层路线图」，团队交来四个提案，哪一种处理最符合「信息的取舍」？",
    correct: "C",
    options: [
      {
        key: "A",
        meta: "把展品剧照与出口箭头叠层斜切",
        reason: "导视与安全出口图的首要任务是秒级认路。把艺术照片和方向箭头做斜切叠层，会直接拉高识别阻力，属于把蒙太奇用错了场合。",
        svg: `
          <rect width="200" height="136" fill="#F2E1CB"/>
          <rect x="16" y="18" width="110" height="96" fill="#551014" transform="rotate(-6 71 66)"/>
          <rect x="76" y="28" width="108" height="84" fill="#121110" transform="rotate(7 130 70)"/>
          <path d="M58 96 L154 46" stroke="#E28115" stroke-width="6"/>
        `,
      },
      {
        key: "B",
        meta: "在 6 个楼层块全部加上高饱和橘叉",
        reason: "六个并列层级同时使用最高饱和警示色，等于没有重点，在紧急疏散时会掩盖真正的出口方向。",
        svg: `
          <rect width="200" height="136" fill="#F2E1CB"/>
          <g fill="#E28115">
            <rect x="16" y="16" width="52" height="46"/><rect x="74" y="16" width="52" height="46"/><rect x="132" y="16" width="52" height="46"/>
            <rect x="16" y="72" width="52" height="46"/><rect x="74" y="72" width="52" height="46"/><rect x="132" y="72" width="52" height="46"/>
          </g>
        `,
      },
      {
        key: "C",
        meta: "放弃蒙太奇，改用高对比清晰分栏导视",
        reason: "正确！正如 152 原海报底栏所说「关键不在于复杂，而在于关系的组织与信息的取舍」。安全导视必须果断放弃蒙太奇，让位给清晰直白的秩序层级。",
        svg: `
          <rect width="200" height="136" fill="#FAF3E8"/>
          <rect x="14" y="14" width="172" height="34" fill="#121110"/>
          <text x="26" y="36" fill="#F7A13B" font-family="IBM Plex Mono, monospace" font-weight="700" font-size="13">EXIT  →  1F NORTH</text>
          <rect x="14" y="58" width="172" height="28" fill="#EFE0CA" stroke="#121110"/>
          <rect x="14" y="94" width="172" height="28" fill="#EFE0CA" stroke="#121110"/>
        `,
      },
      {
        key: "D",
        meta: "保留楼层文字但把出口图标缩成 15% 角标",
        reason: "把最核心的逃生出口符号降级为角落微标，主次完全倒置，违背导视设计最基本的层级原则。",
        svg: `
          <rect width="200" height="136" fill="#FAF3E8"/>
          <rect x="14" y="14" width="172" height="86" fill="#DFC7AD"/>
          <rect x="26" y="30" width="110" height="10" fill="#551014"/>
          <rect x="26" y="50" width="140" height="8" fill="#6E5A48"/>
          <rect x="26" y="66" width="124" height="8" fill="#6E5A48"/>
          <rect x="152" y="108" width="34" height="16" fill="#121110"/>
        `,
      },
    ],
  },
];

export function initQuizSection() {
  const tabBtns = [...document.querySelectorAll("[data-quiz-tab]")];
  const stemEl = document.getElementById("quiz-stem");
  const gridEl = document.getElementById("quiz-grid");
  const feedbackEl = document.getElementById("quiz-feedback");
  const scoreEl = document.getElementById("quiz-score");
  if (!stemEl || !gridEl) return;

  let curQ = 0;
  const answers = {};

  function renderScore() {
    const right = QUIZZES.filter((q) => answers[q.id] === q.correct).length;
    const done = Object.keys(answers).length;
    scoreEl.textContent = `已作答 ${done} / ${QUIZZES.length} · 正确 ${right}`;
  }

  function render() {
    const q = QUIZZES[curQ];
    tabBtns.forEach((b) => {
      const on = Number(b.dataset.quizTab) === curQ;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stemEl.textContent = q.stem;
    const picked = answers[q.id];

    gridEl.innerHTML = q.options
      .map((opt) => {
        const isPicked = picked === opt.key;
        const isCorrect = picked && opt.key === q.correct;
        const isWrong = isPicked && opt.key !== q.correct;
        const cls = [
          "quiz-card",
          isPicked ? "is-picked" : "",
          isCorrect ? "is-right" : "",
          isWrong ? "is-wrong" : "",
        ].filter(Boolean).join(" ");
        return `
          <button type="button" class="${cls}" data-quiz-opt="${opt.key}" aria-pressed="${isPicked ? "true" : "false"}">
            <div class="quiz-card-head">
              <span class="quiz-letter">方案 ${opt.key}</span>
              <span class="quiz-meta">${opt.meta}</span>
            </div>
            <svg class="quiz-svg" viewBox="0 0 200 136" aria-hidden="true">${opt.svg}</svg>
          </button>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[q.id] = btn.dataset.quizOpt;
        render();
      });
    });

    if (picked) {
      const chosen = q.options.find((o) => o.key === picked);
      const ok = picked === q.correct;
      feedbackEl.className = `quiz-feedback ${ok ? "is-right" : "is-wrong"}`;
      feedbackEl.innerHTML = `
        <strong>${ok ? `判别准确（方案 ${picked}）` : `再看一遍变量（你选了方案 ${picked}，正解是方案 ${q.correct}）`}</strong>
        <p>${chosen.reason}</p>
        ${!ok ? `<p class="quiz-correct-note">正解说明：${q.options.find((o) => o.key === q.correct).reason}</p>` : ""}
      `;
    } else {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = `<strong>尚未作答</strong><p>点选上方任一方案（方案 A / B / C / D），四个选项各只改变一个核心变量，选后立即拆解原因。</p>`;
    }

    renderScore();
  }

  tabBtns.forEach((b) => b.addEventListener("click", () => { curQ = Number(b.dataset.quizTab); render(); }));
  render();
}

// ---------- 06 节：原海报高清灯箱（缩放 + 拖拽 + Esc 关） ----------
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-modal-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const resetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");
  if (!posterImg || !modal || !modalImg || !stage) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0;
  let opener = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }
  function reset() {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }
  function open(trigger) {
    opener = trigger || openBtn;
    modalImg.src = posterImg.src;
    reset();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }
  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    opener?.focus();
  }

  posterImg.addEventListener("click", () => open(posterImg));
  openBtn?.addEventListener("click", () => open(openBtn));
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target === stage) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  zoomInBtn?.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = Math.max(0.8, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } applyTransform(); });
  resetBtn?.addEventListener("click", reset);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.8, Math.min(3.2, +(scale - Math.sign(e.deltaY) * 0.18).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  modalImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    modalImg.setPointerCapture(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endDrag = () => { dragging = false; };
  modalImg.addEventListener("pointerup", endDrag);
  modalImg.addEventListener("pointercancel", endDrag);
}
