// 176 左对齐右参差 · 正文 01–07 节全部独立互动模块
// 每一节使用完全不同的交互控件，与开场排字修边台形成层次递进。

// ---------- 01 节：回扫落点步进对比器（SVG 矢量轨迹） ----------
const SWEEP_CASES = {
  left: {
    name: "左对齐右参差",
    en: "FLUSH LEFT",
    verdict: "落点零抖动 · 词距恒定 1.0×",
    verdictKind: "good",
    desc: "每一行都在左侧同一条垂线（x = 0）起笔。眼睛从行尾斜向回扫时，无需每行重新判断水平落点；同时右侧每行结束位置各不相同，帮大脑凭行尾轮廓区分行次，不易漏行或重读。",
    lines: [
      { x: 0, w: 0.88, gaps: [] },
      { x: 0, w: 0.74, gaps: [] },
      { x: 0, w: 0.92, gaps: [] },
      { x: 0, w: 0.80, gaps: [] },
      { x: 0, w: 0.62, gaps: [] },
    ],
    jitterLabel: "起点抖动 0px",
    riverLabel: "白缝河流 0 条",
  },
  center: {
    name: "居中排版",
    en: "CENTERED",
    verdict: "每行重找起点 · 回扫易偏航",
    verdictKind: "bad",
    desc: "左右两端同时参差，每一行的起点都随本行字数左右飘移。Parker 与 Slattery（2019）指出回扫本就容易欠扫，缺少固定左锚线后，读长段几乎每行都要补一次找起点的纠正眼跳。",
    lines: [
      { x: 0.06, w: 0.88, gaps: [] },
      { x: 0.16, w: 0.68, gaps: [] },
      { x: 0.03, w: 0.94, gaps: [] },
      { x: 0.21, w: 0.58, gaps: [] },
      { x: 0.12, w: 0.76, gaps: [] },
    ],
    jitterLabel: "起点左右漂移 ±38px",
    riverLabel: "缺少左锚轴",
  },
  right: {
    name: "右对齐左参差",
    en: "FLUSH RIGHT",
    verdict: "左缘参差 · 起笔落点忽远忽近",
    verdictKind: "bad",
    desc: "把平直边留给读完后的行尾，把起伏参差丢给最需要精准定位的行首。只适合贴靠图片左侧的短图注或数字列，超过三四行就会拖慢回扫速度。",
    lines: [
      { x: 0.12, w: 0.88, gaps: [] },
      { x: 0.28, w: 0.72, gaps: [] },
      { x: 0.07, w: 0.93, gaps: [] },
      { x: 0.22, w: 0.78, gaps: [] },
      { x: 0.36, w: 0.64, gaps: [] },
    ],
    jitterLabel: "起点落差达 52px",
    riverLabel: "逆反左向右读序",
  },
  justify: {
    name: "窄栏两端对齐",
    en: "NARROW JUSTIFIED",
    verdict: "强拉词距 · 裂出纵向白色河流",
    verdictKind: "bad",
    desc: "左起线虽然整齐，但为凑齐右边线不得不把剩余白空硬塞进词与词之间。相邻行的扩张白缝一旦上下串联，就会在段落里切出刺眼的「白色河流」，打断眼球平顺推进。",
    lines: [
      { x: 0, w: 1.0, gaps: [0.34, 0.71] },
      { x: 0, w: 1.0, gaps: [0.37, 0.68] },
      { x: 0, w: 1.0, gaps: [0.35, 0.73] },
      { x: 0, w: 1.0, gaps: [0.38, 0.69] },
      { x: 0, w: 0.54, gaps: [] },
    ],
    jitterLabel: "起线虽齐但白缝裂开",
    riverLabel: "纵向河流 2 条（示意）",
  },
};

export function initReturnSweepLab() {
  const root = document.getElementById("sweepLab");
  if (!root) return;
  const svg = root.querySelector("#sweepSvg");
  const titleEl = root.querySelector("#sweepCaseTitle");
  const verdictEl = root.querySelector("#sweepCaseVerdict");
  const descEl = root.querySelector("#sweepCaseDesc");
  const stat1El = root.querySelector("#sweepStat1");
  const stat2El = root.querySelector("#sweepStat2");
  const stepEl = root.querySelector("#sweepStepLabel");
  const modeBtns = [...root.querySelectorAll("[data-sweep-mode]")];
  const prevBtn = root.querySelector("#sweepPrev");
  const nextBtn = root.querySelector("#sweepNext");

  let mode = "left";
  let step = 4; // 1..4 显示走到第几次回扫

  function render() {
    const data = SWEEP_CASES[mode];
    modeBtns.forEach((b) => {
      const on = b.dataset.sweepMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    titleEl.textContent = `${data.name} · ${data.en}`;
    verdictEl.textContent = data.verdict;
    verdictEl.className = `sweep-verdict ${data.verdictKind === "good" ? "is-good" : "is-bad"}`;
    descEl.textContent = data.desc;
    stat1El.textContent = data.jitterLabel;
    stat2El.textContent = data.riverLabel;
    stepEl.textContent = `回扫步进：第 ${step} / 4 次换行`;

    const padX = 36;
    const colW = 348;
    const startY = 34;
    const rowH = 38;
    const parts = [];

    // 纸面底框
    parts.push(`<rect x="12" y="10" width="396" height="206" fill="#FAFCF8" stroke="rgba(17,24,21,0.16)" stroke-width="1"/>`);
    // 左起线参考轴
    const leftLineColor = mode === "left" ? "#1A6342" : mode === "justify" ? "#111815" : "#EA3D16";
    const dash = mode === "left" ? "" : `stroke-dasharray="4 4"`;
    parts.push(`<line x1="${padX}" y1="18" x2="${padX}" y2="206" stroke="${leftLineColor}" stroke-width="1.6" ${dash}/>`);
    parts.push(`<rect x="${padX - 1}" y="18" width="22" height="3.5" fill="#EA3D16"/>`);

    // 河流示意通道（仅 justify）
    if (mode === "justify") {
      [0.36, 0.70].forEach((gx) => {
        const rx = padX + gx * colW;
        parts.push(`<path d="M ${rx - 4} ${startY - 2} C ${rx + 10} ${startY + rowH}, ${rx - 8} ${startY + rowH * 2}, ${rx + 4} ${startY + rowH * 3 + 12}" fill="none" stroke="rgba(234,61,22,0.42)" stroke-width="12" stroke-linecap="round"/>`);
      });
    }

    // 文本行条
    data.lines.forEach((ln, i) => {
      const lx = padX + ln.x * colW;
      const lw = ln.w * colW;
      const ly = startY + i * rowH;
      if (ln.gaps.length) {
        // 拆成几段模拟被白缝撕开的词块
        let cur = 0;
        const pts = [...ln.gaps, 1];
        pts.forEach((g, gi) => {
          const segStart = cur;
          const segEnd = gi < ln.gaps.length ? g - 0.032 : 1;
          const sx = lx + segStart * lw;
          const sw = Math.max(10, (segEnd - segStart) * lw);
          parts.push(`<rect x="${sx.toFixed(1)}" y="${ly}" width="${sw.toFixed(1)}" height="12" fill="#1D2622" opacity="0.86"/>`);
          if (gi < ln.gaps.length) {
            const gx = lx + (g - 0.032) * lw;
            parts.push(`<rect x="${gx.toFixed(1)}" y="${ly - 2}" width="${(0.064 * lw).toFixed(1)}" height="16" fill="rgba(234,61,22,0.22)"/>`);
          }
          cur = g + 0.032;
        });
      } else {
        parts.push(`<rect x="${lx.toFixed(1)}" y="${ly}" width="${lw.toFixed(1)}" height="12" fill="#1D2622" opacity="0.86"/>`);
      }
      // 起点标点
      const dotCol = mode === "left" ? "#1A6342" : mode === "justify" ? "#111815" : "#EA3D16";
      parts.push(`<circle cx="${lx.toFixed(1)}" cy="${ly + 6}" r="3.2" fill="${dotCol}"/>`);
    });

    // 画出 1..step 次斜向回扫轨迹
    for (let k = 0; k < step; k++) {
      const a = data.lines[k];
      const b = data.lines[k + 1];
      const ax = padX + (a.x + a.w) * colW;
      const ay = startY + k * rowH + 6;
      const bx = padX + b.x * colW;
      const by = startY + (k + 1) * rowH + 6;
      const isCurrent = k === step - 1;
      const stroke = data.verdictKind === "good" ? (isCurrent ? "#1A6342" : "rgba(26,99,66,0.42)") : isCurrent ? "#EA3D16" : "rgba(234,61,22,0.42)";
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5 + 11;
      parts.push(`<path d="M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${isCurrent ? 2.2 : 1.3}" stroke-dasharray="${isCurrent ? "none" : "4 3"}"/>`);
      if (isCurrent) {
        parts.push(`<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="7" fill="none" stroke="${stroke}" stroke-width="1.8"/>`);
        parts.push(`<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="3.5" fill="${stroke}"/>`);
      }
    }

    svg.innerHTML = parts.join("");
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.sweepMode; render(); }));
  prevBtn?.addEventListener("click", () => { step = step <= 1 ? 4 : step - 1; render(); });
  nextBtn?.addEventListener("click", () => { step = step >= 4 ? 1 : step + 1; render(); });
  render();
}

// ---------- 02 节：参差轮廓剪影透视开关（剥离文字看黑条与红轮廓） ----------
export function initRagAnatomy() {
  const sec = document.getElementById("sec-rag");
  if (!sec) return;
  const toggleBtn = sec.querySelector("#ragXrayToggle");
  const statusEl = sec.querySelector("#ragXrayStatus");
  let xray = false;

  function apply() {
    sec.classList.toggle("is-xray", xray);
    toggleBtn.setAttribute("aria-pressed", String(xray));
    toggleBtn.textContent = xray ? "恢复文字阅读视图" : "剥离文字 · 只看右缘剪影";
    statusEl.textContent = xray
      ? "剪影模式已开启：撇开字义，右缘的波浪、凹坑、斜坡与孤词尾巴一眼暴露"
      : "当前为正常文本视图：点击上方开关可瞬间压黑字条，用排字师的「眯眼法」检查右缘轮廓";
  }

  toggleBtn?.addEventListener("click", () => {
    xray = !xray;
    apply();
  });
  apply();
}

// ---------- 03 节：中文 vs 混排 vs 英文 窄宽联动对比拉幕 ----------
const SCRIPT_SAMPLES = {
  cjk: {
    label: "纯中文段落",
    text: "汉字原本就是等宽方块，在宽度充裕的书页里，两端对齐能顺理成章排出整洁的纵横字格。但当栏宽收窄到手机侧栏或导语卡片时，只要某一行末尾碰上引号或顿号，为了把右边拉齐，整行汉字之间仍会被硬生生扯出松散的白缝。",
    note: "纯中文在宽栏（≥24 字/行）下，两端对齐几乎不产生河流；只有当栏宽缩得很窄时，行末禁则标点才会把字距扯开。",
  },
  mixed: {
    label: "中英混排（最易崩裂）",
    text: "在设计系统文档中，只要中文段落里夹杂 typography、accessibility、WCAG 1.4.8 或 flush-left 这类较长英文词，强行两端对齐立刻会因为长词整块掉到下一行，把上一行撕开刺眼的稀疏字缝，切回左对齐右参差问题瞬间消失。",
    note: "这是数字阅读里最常见也最容易翻车的场景：中文一旦混入不可拆分的英文单词、编号或 URL，窄栏两端对齐立刻崩溃。",
  },
  latin: {
    label: "纯英文段落",
    text: "Unequal word lengths are inherent to alphabetic writing. When a narrow column forces full justification without careful hyphenation, word spaces expand erratically into pale vertical rivers that distract the eye and slow down comprehension.",
    note: "拉丁文由长短不一的单词构成，空格是天然的断点。Bringhurst 与 W3C WCAG 1.4.8 都明确指出：窄栏与屏幕网页优先采用左对齐右参差。",
  },
};

export function initScriptComparator() {
  const root = document.getElementById("scriptCompare");
  if (!root) return;
  const tabBtns = [...root.querySelectorAll("[data-script-tab]")];
  const slider = root.querySelector("#scriptWidthSlider");
  const widthLabel = root.querySelector("#scriptWidthVal");
  const justBox = root.querySelector("#scriptJustifyBox");
  const leftBox = root.querySelector("#scriptLeftBox");
  const justMetric = root.querySelector("#scriptJustifyMetric");
  const leftMetric = root.querySelector("#scriptLeftMetric");
  const noteEl = root.querySelector("#scriptNote");

  let active = "mixed";
  let colPct = 54; // 46..100 (% of available container)

  function update() {
    const sample = SCRIPT_SAMPLES[active];
    tabBtns.forEach((b) => {
      const on = b.dataset.scriptTab === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    // 真实设置两栏完全相同的宽度，只有 text-align 不同
    const emWidth = active === "latin" ? Math.round(16 + (colPct - 46) * 0.36) : Math.round(11 + (colPct - 46) * 0.28);
    const widthUnit = active === "latin" ? `${emWidth} ch` : `约 ${emWidth} 汉字/行`;
    widthLabel.textContent = widthUnit;

    justBox.textContent = sample.text;
    leftBox.textContent = sample.text;
    const cssMaxW = `${colPct}%`;
    justBox.style.maxWidth = cssMaxW;
    leftBox.style.maxWidth = cssMaxW;
    justBox.className = `cmp-prose is-justify is-${active}`;
    leftBox.className = `cmp-prose is-left is-${active}`;

    // 根据语种与实测栏宽档位给出诚实、非假精确的定性判断
    if (active === "cjk" && colPct >= 76) {
      justMetric.textContent = "汉字等宽 · 字距平稳（纯中文宽栏优势）";
      justMetric.className = "cmp-metric is-ok";
    } else if (active === "cjk") {
      justMetric.textContent = "窄栏遇标点折行 · 局部字距被拉开";
      justMetric.className = "cmp-metric is-warn";
    } else if (active === "mixed") {
      justMetric.textContent = colPct < 74 ? "长英文词整块掉行 · 上行被撕出大白缝" : "偶发中英交界处字距松紧不均";
      justMetric.className = colPct < 74 ? "cmp-metric is-bad" : "cmp-metric is-warn";
    } else {
      justMetric.textContent = colPct < 78 ? "词间白缝明显扩张 · 易连成河流" : "宽栏缓和，但局部词距仍有起伏";
      justMetric.className = colPct < 78 ? "cmp-metric is-bad" : "cmp-metric is-warn";
    }

    leftMetric.textContent = colPct < 54
      ? "词距恒定 1.0×，但栏过窄导致右缘锯齿偏重"
      : "左起线笔直 · 词距恒定 1.0× · 右缘自然透气";
    leftMetric.className = colPct < 54 ? "cmp-metric is-warn" : "cmp-metric is-ok";
    noteEl.textContent = sample.note;
  }

  tabBtns.forEach((b) => b.addEventListener("click", () => { active = b.dataset.scriptTab; update(); }));
  slider?.addEventListener("input", () => { colPct = Number(slider.value); update(); });
  update();
}

// ---------- 04 节：百年历史排印翻检匣 ----------
const HISTORY_ITEMS = [
  {
    year: "1928",
    who: "扬·奇肖尔德（Jan Tschichold）",
    work: "《新排版术》（Die neue Typographie）",
    place: "柏林",
    quote: "打破延续数百年的装饰性中轴对称，主张版面服务于快速清晰的现代信息传达：用无衬线字、明确层级与统一左起线建立动态的不对称秩序。",
    specimenClass: "spec-1928",
    specimenHtml: `<div class="sp-bar"></div><div class="sp-h">DIE NEUE TYPOGRAPHIE</div><div class="sp-p">功能先于对称。放弃强行居中，让所有信息挂靠在同一根清晰的左侧结构线上。</div>`,
  },
  {
    year: "1931",
    who: "埃里克·吉尔（Eric Gill）",
    work: "《排印随笔》（An Essay on Typography）",
    place: "伦敦 · Sheed & Ward",
    quote: "在自己手工排印的整本书里直接采用等词距、右参差排法，直指强迫每行等长的两端对齐像「普罗克拉斯提斯之床」，为了凑齐右边而牺牲了词距均匀与阅读尊严。",
    specimenClass: "spec-1931",
    specimenHtml: `<div class="sp-p-serif">“Now uneven space is in itself objectionable—more objectionable than uneven length of lines… But even spacing is of more importance typographically than equal length.”</div>`,
  },
  {
    year: "1967",
    who: "埃米尔·鲁德尔（Emil Ruder）",
    work: "《排印学》（Typographie）",
    place: "瑞士 · 托伊芬（Niggli）/ 巴塞尔",
    quote: "将左对齐右参差系统写进瑞士国际主义网格教学，强调行尾参差形成的不规则白场不是剩余废料，而是激活整页视觉节奏的呼吸空间。",
    specimenClass: "spec-1967",
    specimenHtml: `<div class="sp-grid"><span>01</span><div><strong>Typographie</strong><br>左齐锚定秩序，右缘留白承担节奏，不以机械齐整扼杀版面生命力。</div></div>`,
  },
  {
    year: "1992",
    who: "罗伯特·布林赫斯特（Robert Bringhurst）",
    work: "《排印风格要素》（The Elements of Typographic Style）",
    place: "加拿大 · Hartley & Marks",
    quote: "归纳经典阅读行长经验值（单栏 45–75 字符、常以 66 字符为理想均值），提倡在窄栏、无衬线与等宽字体中使用「硬参差（Hard Rag）」，保持词距不变并克制连字符。",
    specimenClass: "spec-1992",
    specimenHtml: `<div class="sp-p-serif">45–75 characters per line (66 ideal). Set ragged right whenever narrow measures or modern faces demand constant word spacing.</div>`,
  },
  {
    year: "2008–2018",
    who: "W3C 无障碍工作组",
    work: "WCAG 2.0 / 2.1 成功标准 1.4.8（AAA）",
    place: "Web 国际标准",
    quote: "明确要求正文块不采用两端对齐（避免词间河流干扰阅读障碍与低视力读者），并限定单行不超过 80 字符（中日韩 CJK 不超过 40 字）、行距不低于 1.5 倍。",
    specimenClass: "spec-2018",
    specimenHtml: `<div class="sp-wcag"><code>SC 1.4.8 · AAA</code><p>text-align: left; max-width: 40ch (CJK) / 80ch (Latin); line-height ≥ 1.5;</p></div>`,
  },
];

export function initHistoryDrawer() {
  const root = document.getElementById("historyDrawer");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-hist-idx]")];
  const yearEl = root.querySelector("#histYear");
  const whoEl = root.querySelector("#histWho");
  const workEl = root.querySelector("#histWork");
  const quoteEl = root.querySelector("#histQuote");
  const specEl = root.querySelector("#histSpecimen");

  let idx = 0;

  function render() {
    const it = HISTORY_ITEMS[idx];
    btns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    yearEl.textContent = `${it.year} · ${it.place}`;
    whoEl.textContent = it.who;
    workEl.textContent = it.work;
    quoteEl.textContent = it.quote;
    specEl.className = `hist-specimen ${it.specimenClass}`;
    specEl.innerHTML = it.specimenHtml;
  }

  btns.forEach((b) => b.addEventListener("click", () => { idx = Number(b.dataset.histIdx); render(); }));
  render();
}

// ---------- 05 节：什么时候别用（4 场景正误对比卡） ----------
const ANTI_CASES = {
  multicol: {
    badTitle: "硬套左对齐右参差",
    badReason: "栏缝本来就窄，左栏右侧长短起伏后，两栏之间的垂直沟槽被参差吃掉，视线容易横跨串进右栏。",
    goodTitle: "改用两端对齐 + 合理栏缝",
    goodReason: "纯中文多栏报刊与词典中，汉字天生等宽，两端对齐能切出笔直的栏沟，显著提升密集版面的分栏清晰度。",
    link: { id: "179", name: "179 两端对齐" },
    badHtml: `<div class="anti-cols is-left"><div>汉字排在极窄的双栏报刊中，每行右端如果起伏不定，中间原本纤细的栏缝会显得宽窄飘忽。</div><div>读者目光扫到行尾时，很容易在空白处误跳进右侧相邻的文字栏，造成跨栏串读。</div></div>`,
    goodHtml: `<div class="anti-cols is-justify"><div>汉字排在极窄的双栏报刊中，借助汉字天生等宽的方块优势，两端对齐能切出笔直清晰的栏间沟槽。</div><div>左右两栏界线分明，在高密度报刊、百科与纯中文长书里能保持极佳的版心秩序。</div></div>`,
  },
  ceremony: {
    badTitle: "硬套左对齐右参差",
    badReason: "只有三四行简短铭文却靠左排，右边留下大片失衡白空，瞬间失去庄重仪式感，显得像一张行政通知。",
    goodTitle: "改用居中排版",
    goodReason: "婚礼请柬、展馆碑铭、书籍扉页等短文本不靠快速长读，居中对称能立刻凝聚集中的庄严气场。",
    link: { id: "178", name: "178 居中排版" },
    badHtml: `<div class="anti-card is-left"><small>EXHIBITION INVITATION</small><strong>秋日活字特展</strong><span>2026 年 10 月 18 日 · 市立美术馆三楼</span></div>`,
    goodHtml: `<div class="anti-card is-center"><small>EXHIBITION INVITATION</small><strong>秋日活字特展</strong><span>2026 年 10 月 18 日 · 市立美术馆三楼</span></div>`,
  },
  caption: {
    badTitle: "硬套左对齐右参差",
    badReason: "图注摆在配图左侧时，右缘参差会在文字和图片之间撕开一道不规则的白沟，文字与图片彼此脱节。",
    goodTitle: "改用右对齐左参差",
    goodReason: "文字紧贴右侧配图边缘对齐，视觉上像被磁铁吸在图片旁，一眼就能认出这是它的专属图注。",
    link: { id: "177", name: "177 右对齐左参差" },
    badHtml: `<div class="anti-cap"><div class="anti-cap-txt is-left">图 04 · 1928 年《新排版术》首版扉页，采用不对称网格。</div><div class="anti-cap-img" aria-hidden="true"><span>FIG.04</span></div></div>`,
    goodHtml: `<div class="anti-cap"><div class="anti-cap-txt is-right">图 04 · 1928 年《新排版术》首版扉页，采用不对称网格。</div><div class="anti-cap-img" aria-hidden="true"><span>FIG.04</span></div></div>`,
  },
  poster: {
    badTitle: "硬套左对齐右参差",
    badReason: "当海报只有两三个强冲击标语字块或需要围绕主图形流动时，机械左齐会浪费图形轮廓的张力。",
    goodTitle: "按造型目标换用绕排或强制齐边",
    goodReason: "极短标语可用强制两端对齐撑满张力，配不规则插图可用轮廓绕排或路径文字让图文咬合共生。",
    link: { id: "180", name: "180 强制两端对齐" },
    badHtml: `<div class="anti-poster is-left"><span>NEW</span><span>SWISS</span><span>TYPE</span></div>`,
    goodHtml: `<div class="anti-poster is-force"><span>N E W</span><span>S W I S S</span><span>T Y P E</span></div>`,
  },
};

export function initAntiExamples() {
  const root = document.getElementById("antiLab");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-anti]")];
  const badTitle = root.querySelector("#antiBadTitle");
  const badReason = root.querySelector("#antiBadReason");
  const badPreview = root.querySelector("#antiBadPreview");
  const goodTitle = root.querySelector("#antiGoodTitle");
  const goodReason = root.querySelector("#antiGoodReason");
  const goodPreview = root.querySelector("#antiGoodPreview");
  const linkEl = root.querySelector("#antiLink");

  let key = "multicol";

  function render() {
    const it = ANTI_CASES[key];
    btns.forEach((b) => {
      const on = b.dataset.anti === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    badTitle.textContent = it.badTitle;
    badReason.textContent = it.badReason;
    badPreview.innerHTML = it.badHtml;
    goodTitle.textContent = it.goodTitle;
    goodReason.textContent = it.goodReason;
    goodPreview.innerHTML = it.goodHtml;
    linkEl.href = `https://layout.xiaoxiaodong.ai/${it.link.id}/play/`;
    linkEl.textContent = `延伸阅读：${it.link.name} →`;
  }

  btns.forEach((b) => b.addEventListener("click", () => { key = b.dataset.anti; render(); }));
  render();
}

// ---------- 06 节：深林墨暗室考场（两道高辨别度单变量练习） ----------
const QUIZ_BANK = [
  {
    id: 0,
    stem: "第 1 题（单变量：对齐与右缘参差形态）· 同栏宽、同字号、同文案，哪一栏读起来最顺畅且右缘最健康？",
    correct: "C",
    options: [
      {
        key: "A",
        mode: "justify",
        lines: [
          { t: "左对齐在  Flush   Left   混排专栏里，", spread: true },
          { t: "能让每行   起笔稳稳   钉在左轴上，", spread: true },
          { t: "同时保持   均匀词距   与自然节奏，", spread: true },
          { t: "避免河流撕裂，读来更轻松。", spread: false },
        ],
        explain: "方案 A 是窄栏强行两端对齐：为了凑齐右边线，混入英文词后硬生生把行内撕出多道稀疏白缝（河流），打断了连贯扫读。",
      },
      {
        key: "B",
        mode: "hole",
        lines: [
          { t: "左对齐在 Flush Left 混排专栏里", w: 94 },
          { t: "能稳住起点，", w: 46 },
          { t: "同时保持自然均匀的词距与阅读节奏，", w: 96 },
          { t: "避免河流裂开，让长文阅读更轻松", w: 88 },
          { t: "些。", w: 12 },
        ],
        explain: "方案 B 虽然是左对齐，但第 2 行骤然短进一大截（深凹缺口），末行还掉出一个孤零零的单字尾巴「些。」，属于典型的失控坏参差。",
      },
      {
        key: "C",
        mode: "good",
        lines: [
          { t: "左对齐在 Flush Left 混排专栏里，", w: 91 },
          { t: "能让每行起笔稳稳钉在左轴上，", w: 80 },
          { t: "同时保持自然均匀的词距与节奏，", w: 88 },
          { t: "避免白色河流撕裂，读来更轻松。", w: 84 },
        ],
        explain: "答对了！方案 C 左起线严丝对齐、词距恒定 1.0×、右缘呈「长—略短—长—略短」的温和波浪（起伏克制在约 12%），且无孤词尾巴。",
      },
      {
        key: "D",
        mode: "stair",
        lines: [
          { t: "左对齐在 Flush Left 混排专栏里能稳住", w: 97 },
          { t: "每一行的起笔位置与均匀词距，", w: 84 },
          { t: "右侧不用机械强行拉齐边线，", w: 73 },
          { t: "从而避免白色河流裂开，", w: 62 },
          { t: "让整体阅读更省力。", w: 50 },
        ],
        explain: "方案 D 虽为左对齐，但连续 5 行顺着同一方向逐行递减，右缘切出一道僵硬的「楼梯斜坡」，把整栏视觉重心斜拉向左下方。",
      },
    ],
  },
  {
    id: 1,
    stem: "第 2 题（单变量：栏宽与行距组合）· 四张全是左对齐右参差且同字号，哪一栏最符合长文回扫舒适区？",
    correct: "D",
    options: [
      {
        key: "A",
        mode: "narrow-q",
        lines: [
          { t: "左对齐给每次", w: 52 },
          { t: "回扫钉住固定", w: 48 },
          { t: "起点，右侧留", w: 50 },
          { t: "出自然起伏，", w: 44 },
          { t: "读来轻快。", w: 38 },
        ],
        explain: "方案 A 栏宽过窄（仅约 6–7 汉字/行），眼睛刚读两三个词就被迫折返换行，节奏切碎、锯齿感过强。",
      },
      {
        key: "B",
        mode: "wide-q",
        lines: [
          { t: "左对齐给每一次换行后的回扫眼跳钉住不变的起点，但单行若一味拉得过宽且行距偏紧，眼球回扫时极易偏航串行。", w: 100 },
          { t: "行尾距离下一行开头太远，哪怕左缘对齐，视线在漫长的斜向回跳途中还是很容易不小心跳回同一行或漏读一行。", w: 96 },
        ],
        explain: "方案 B 单行塞进超过 50 个汉字（远超 WCAG 1.4.8 建议的 ≤40 CJK 上限）且行距紧压，长距离回扫极易串行。",
      },
      {
        key: "C",
        mode: "tight-q",
        lines: [
          { t: "左对齐给每次回扫钉住不变起点，", w: 86 },
          { t: "右侧留出自然参差保住均匀词距，", w: 90 },
          { t: "但行距压得太紧会让上下行粘连，", w: 84 },
          { t: "回扫途中视线仍容易被邻行勾走。", w: 88 },
        ],
        explain: "方案 C 栏宽合适，但行距压到 1.15，上下两行字脚几乎相撞，违背了 WCAG 1.4.8 ≥1.5 倍行距的清晰航道原则。",
      },
      {
        key: "D",
        mode: "ideal-q",
        lines: [
          { t: "左对齐给每次回扫钉住不变起点，", w: 86 },
          { t: "右侧自然参差保住均匀词距，", w: 78 },
          { t: "配上适中栏宽与 1.65 舒展行距，", w: 89 },
          { t: "视线逐行推进几乎毫无阻力。", w: 80 },
        ],
        explain: "答对了！方案 D 同时守住了左起线统一、自然波浪参差、适中行长与 1.65 舒展行距，左右扫视和斜向回扫都有充裕航道。",
      },
    ],
  },
];

export function initQuiz() {
  const root = document.getElementById("quizLab");
  if (!root) return;
  const qBtns = [...root.querySelectorAll("[data-quiz-q]")];
  const stemEl = root.querySelector("#quizStem");
  const gridEl = root.querySelector("#quizGrid");
  const fbEl = root.querySelector("#quizFeedback");

  let qIdx = 0;
  const picked = {};

  function render() {
    const q = QUIZ_BANK[qIdx];
    const choice = picked[qIdx] || null;

    qBtns.forEach((b, i) => {
      const on = i === qIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    stemEl.textContent = q.stem;

    gridEl.innerHTML = q.options
      .map((opt) => {
        const isPicked = choice === opt.key;
        const isRight = choice && opt.key === q.correct;
        const isWrong = isPicked && opt.key !== q.correct;
        const cls = ["quiz-opt", isPicked ? "is-picked" : "", isRight ? "is-right" : "", isWrong ? "is-wrong" : ""].filter(Boolean).join(" ");
        const sampleHtml = opt.lines
          .map((ln) => {
            if (opt.mode === "justify" && ln.spread) {
              return `<span class="q-line is-spread">${ln.t.replace(/  +/g, '<i class="q-gap"></i>')}</span>`;
            }
            return `<span class="q-line" style="max-width:${ln.w || 100}%">${ln.t}</span>`;
          })
          .join("");
        return `
          <button type="button" class="${cls}" data-opt="${opt.key}" aria-pressed="${isPicked}">
            <div class="quiz-opt-head">
              <span class="quiz-opt-code">方案 ${opt.key}</span>
              ${choice ? `<span class="quiz-opt-mark">${opt.key === q.correct ? "✓ 最佳排法" : isPicked ? "× 存在缺陷" : ""}</span>` : ""}
            </div>
            <div class="quiz-sample mode-${opt.mode}">
              ${sampleHtml}
            </div>
          </button>`;
      })
      .join("");

    gridEl.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[qIdx] = btn.dataset.opt;
        render();
      });
    });

    if (!choice) {
      fbEl.className = "quiz-feedback";
      fbEl.innerHTML = `<p>仔细观察上方四块真实排样，点选你认为读起来最轻松顺畅的一栏（选完立即拆解每一栏的排印成因）。</p>`;
    } else {
      const chosen = q.options.find((o) => o.key === choice);
      const ok = choice === q.correct;
      fbEl.className = `quiz-feedback ${ok ? "is-right" : "is-wrong"}`;
      fbEl.innerHTML = `
        <p class="quiz-fb-title">${ok ? `选择正确 · 方案 ${choice}` : `再看一眼 · 你选了方案 ${choice}（最佳是方案 ${q.correct}）`}</p>
        <p>${chosen.explain}</p>
      `;
    }
  }

  qBtns.forEach((b) => b.addEventListener("click", () => { qIdx = Number(b.dataset.quizQ); render(); }));
  render();
}

// ---------- 07 节：原海报放大灯箱（支持滚轮/按钮缩放、拖动平移、Esc 关） ----------
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("posterZoomBtn");
  const dialog = document.getElementById("posterModal");
  if (!poster || !dialog) return;

  const modalImg = dialog.querySelector("#posterModalImg");
  const closeBtn = dialog.querySelector("#posterClose");
  const zoomInBtn = dialog.querySelector("#posterZoomIn");
  const zoomOutBtn = dialog.querySelector("#posterZoomOut");
  const resetBtn = dialog.querySelector("#posterZoomReset");
  const viewport = dialog.querySelector("#posterViewport");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    modalImg.src = poster.currentSrc || poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (ev) => { if (ev.target === dialog) close(); });
  document.addEventListener("keydown", (ev) => { if (!dialog.hidden && ev.key === "Escape") close(); });

  zoomInBtn?.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = Math.max(1, +(scale - 0.35).toFixed(2)); if (scale === 1) { tx = 0; ty = 0; } applyTransform(); });
  resetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  viewport?.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    scale = Math.max(1, Math.min(3, +(scale + (ev.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  viewport?.addEventListener("pointerdown", (ev) => {
    dragging = true;
    sx = ev.clientX;
    sy = ev.clientY;
    stx = tx;
    sty = ty;
    try { viewport.setPointerCapture(ev.pointerId); } catch {}
  });
  viewport?.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    tx = stx + (ev.clientX - sx);
    ty = sty + (ev.clientY - sy);
    applyTransform();
  });
  const end = (ev) => {
    dragging = false;
    try { viewport.releasePointerCapture(ev.pointerId); } catch {}
  };
  viewport?.addEventListener("pointerup", end);
  viewport?.addEventListener("pointercancel", end);
}
