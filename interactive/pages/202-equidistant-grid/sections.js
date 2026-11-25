// 202 等距网格 · 正文 01–07 互动模块与原海报灯箱

const SIBLING_URL = (id) => `https://layout.xiaoxiaodong.ai/${id}/play/`;

// =========================================================================
// 01 节：双轴分裂解剖镜（三态切屏 + 纯留白沟道透视开关）
// =========================================================================
function initSection01() {
  const root = document.getElementById("s01-lab");
  if (!root) return;

  const MODES = {
    cols: {
      gx: 32,
      gy: 6,
      label: "列缝过宽：裂成竖条",
      ratio: "5.33×",
      readout: "列缝 32px 是行缝 6px 的五倍多。相邻两行上下紧贴，眼睛自动沿垂直方向抱团，12 块被劈成四条互不来往的竖带。",
    },
    rows: {
      gx: 6,
      gy: 32,
      label: "行缝过宽：切成横带",
      ratio: "5.33×",
      readout: "行缝 32px 远大于列缝 6px。同一行四张卡紧紧粘成一条横杠，页面被横向切成三段独立抽屉，垂直对齐感几乎消失。",
    },
    equal: {
      gx: 18,
      gy: 18,
      label: "横竖等距：形成整阵",
      ratio: "1.00×",
      readout: "横竖沟道锁定同一单位 18px，纵横扫视阻力完全一致。人眼不必在每条缝前重新猜距离，12 块立刻收拢成一个稳定矩阵。",
    },
  };

  let active = "cols";
  let xray = false;

  const gridEl = root.querySelector("#s01-grid");
  const readoutEl = root.querySelector("#s01-readout");
  const metricEl = root.querySelector("#s01-metric");
  const xrayBtn = root.querySelector("#s01-xray");
  const modeBtns = [...root.querySelectorAll("[data-s01-mode]")];

  function render() {
    const m = MODES[active];
    gridEl.style.setProperty("--s01-gx", `${m.gx}px`);
    gridEl.style.setProperty("--s01-gy", `${m.gy}px`);
    gridEl.classList.toggle("is-xray", xray);
    gridEl.classList.toggle("is-equal", active === "equal");

    for (const b of modeBtns) {
      const on = b.dataset.s01Mode === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    xrayBtn.classList.toggle("is-active", xray);
    xrayBtn.setAttribute("aria-pressed", String(xray));
    xrayBtn.textContent = xray ? "纯留白透视：开（隐藏内容）" : "纯留白透视：关（显示模块）";

    metricEl.textContent = `列距 ${m.gx}px · 行距 ${m.gy}px · 纵横比 ${m.ratio}`;
    readoutEl.textContent = xray
      ? `${m.readout} 隐藏卡片图形后更明显：人眼其实先读取的是白色沟道切出的结构，而不是框里的内容。`
      : m.readout;
  }

  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      active = b.dataset.s01Mode;
      render();
    });
  }
  xrayBtn.addEventListener("click", () => {
    xray = !xray;
    render();
  });

  render();
}

// =========================================================================
// 02 节：活体 DOM 拼跨列工作台（合并/拆分 + 规范 kW+(k-1)X vs 误算 kW + 基数步进）
// =========================================================================
function initSection02() {
  const root = document.getElementById("s02-builder");
  if (!root) return;

  const state = {
    baseX: 8,
    mult: 2, // gutter = baseX * mult
    spanMerged: true,
    formulaOk: false, // 初始展示漏算 1X 的反例，点一下立刻补齐
  };

  const baseBtns = [...root.querySelectorAll("[data-s02-base]")];
  const multBtns = [...root.querySelectorAll("[data-s02-mult]")];
  const spanBtn = root.querySelector("#s02-toggle-span");
  const formulaBtn = root.querySelector("#s02-toggle-formula");
  const canvasEl = root.querySelector("#s02-grid");
  const cardMain = root.querySelector("#s02-span-card");
  const cardPartner = root.querySelector("#s02-partner-card");
  const formulaOut = root.querySelector("#s02-formula-out");
  const tokensOut = root.querySelector("#s02-tokens");
  const deficitTag = root.querySelector("#s02-deficit-tag");

  function render() {
    const g = state.baseX * state.mult;
    const inner = Math.max(4, Math.min(g - 4, state.baseX));
    const outer = state.baseX * (state.mult + 1);

    for (const b of baseBtns) {
      const on = Number(b.dataset.s02Base) === state.baseX;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of multBtns) {
      const on = Number(b.dataset.s02Mult) === state.mult;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }

    canvasEl.style.setProperty("--s02-gap", `${g}px`);
    canvasEl.style.setProperty("--s02-pad", `${inner}px`);

    cardMain.classList.toggle("is-span-2", state.spanMerged);
    cardMain.classList.toggle("is-span-bug", state.spanMerged && !state.formulaOk);
    cardPartner.hidden = state.spanMerged;

    spanBtn.textContent = state.spanMerged ? "跨列卡：已合并 2 列（点此拆分）" : "跨列卡：已拆为单列（点此合并 2 列）";
    spanBtn.setAttribute("aria-pressed", String(state.spanMerged));

    formulaBtn.disabled = !state.spanMerged;
    formulaBtn.classList.toggle("is-active", state.formulaOk);
    formulaBtn.textContent = state.formulaOk ? "跨缝算法：规范 2W + 1X" : "跨缝算法：误算 2W（缺 1X）";
    formulaBtn.setAttribute("aria-pressed", String(state.formulaOk));

    deficitTag.hidden = !(state.spanMerged && !state.formulaOk);
    deficitTag.textContent = `缺口 −${g}px`;

    // 阶梯标尺更新
    tokensOut.innerHTML = [
      { k: "0.5X", v: `${state.baseX * 0.5}px`, use: "图标与微标签" },
      { k: "1X", v: `${state.baseX}px`, use: "卡片内边距" },
      { k: `${state.mult}X`, v: `${g}px`, use: "主网格等距缝" },
      { k: `${state.mult + 1}X`, v: `${outer}px`, use: "外边距 / 区块隔" },
    ]
      .map(
        (t) =>
          `<div class="s02-tok"><span class="tok-k">${t.k}</span><strong class="tok-v">${t.v}</strong><span class="tok-u">${t.use}</span></div>`
      )
      .join("");

    if (!state.spanMerged) {
      formulaOut.innerHTML = `<strong>单列等分状态</strong>：三列等宽 <code>1W</code>，行距与列距同步为 <code>${g}px</code>（<code>${state.mult}X</code>），卡内距 <code>${inner}px</code> 严格紧于外部沟道。`;
    } else if (state.formulaOk) {
      formulaOut.innerHTML = `<strong class="ok-ink">规范跨缝对齐</strong>：跨 2 列宽度 = <code>2W + ${g}px</code>（含中间 1 条沟道）。右边缘与第二列底卡的竖直轴线严丝合缝，CSS Grid 写 <code>grid-column: span 2</code> 即自动按此计算。`;
    } else {
      formulaOut.innerHTML = `<strong class="err-ink">漏算沟道出错</strong>：手工把跨列卡写成 <code>2W</code>，丢掉了中间那条 <code>${g}px</code> 沟道！注意看主卡右缘凭空短进一截，整条第二列右边界当场断线。`;
    }
  }

  for (const b of baseBtns) {
    b.addEventListener("click", () => {
      state.baseX = Number(b.dataset.s02Base);
      render();
    });
  }
  for (const b of multBtns) {
    b.addEventListener("click", () => {
      state.mult = Number(b.dataset.s02Mult);
      render();
    });
  }
  spanBtn.addEventListener("click", () => {
    state.spanMerged = !state.spanMerged;
    render();
  });
  formulaBtn.addEventListener("click", () => {
    state.formulaOk = !state.formulaOk;
    render();
  });

  render();
}

// =========================================================================
// 03 节：印刷暗室四种翻车诊室（4 案切换 + 错例/修正拨片 + 红线标尺开关）
// =========================================================================
function initSection03() {
  const root = document.getElementById("s03-room");
  if (!root) return;

  const CASES = [
    {
      id: "invert",
      num: "01",
      title: "内外倒挂",
      en: "INNER ≥ OUTER",
      badHead: "卡内距 20px > 卡外缝 8px：标题粘向了隔壁卡",
      goodHead: "卡内距 8px < 卡外缝 16px：每张卡自成整体",
      badNote: "图与字之间的空隙比两张卡片之间的沟道还大，眼睛按邻近距离重新配对，上面那张卡的说明字反倒像下面那张图的标题。",
      goodNote: "把卡内距收进 1X（8px）、外部沟道放到 2X（16px），内部紧抱、外部清界，不用加粗边框也能一眼看懂归属。",
    },
    {
      id: "random",
      num: "02",
      title: "零散手调值",
      en: "ARBITRARY PIXELS",
      badHead: "13px / 19px / 27px：每条缝都在凭感觉猜",
      goodHead: "统一锁定 16px（2X）：一尺通管全局",
      badNote: "设计稿里混入五六个相差几像素的手调值，开发标注要逐条量取，改一处就要连环返工，海报所说「降低决策成本」完全落空。",
      goodNote: "所有横竖沟道归入基数 8px 的整倍标尺，新插组件只需选 1X 或 2X，无需每次开会争论「到底空 14 还是 17」。",
    },
    {
      id: "tilewall",
      num: "03",
      title: "单调瓷砖墙",
      en: "FLAT TILE WALL",
      badHead: "6 块尺寸权重全一样：秩序变成了乏味瓷砖",
      goodHead: "等距缝不变，用 2×1 跨列主卡拉出主次层级",
      badNote: "等距管的是「缝隙相等」，不要求「所有盒子都一样大」。如果每个模块都做成同尺寸同体量，读者一进画面找不到第一落眼点。",
      goodNote: "保持所有沟道严格等于 X，把核心信息合并跨 2 列（宽 2W+X），既有瑞士网格的克制秩序，又有明确的视觉主角。",
    },
    {
      id: "optical",
      num: "04",
      title: "视错觉失衡",
      en: "OPTICAL COMPENSATION",
      badHead: "圆形和文字行盒机械对齐：看着反而偏小偏矮",
      goodHead: "外轨锁死 X，圆徽微探 1–2px 视觉齐平",
      badNote: "圆形只有四个切点碰边框，文字行盒上下还有看不见的半行距（leading）。数学上完全相等的 16px，在细微处可能显得圆缩水、字偏远。",
      goodNote: "宏观沟道仍严格遵守基数 X 绝不动摇，在组件内部对圆形徽标与文字顶部做 0.25X–0.5X 的视觉微调，兼顾理性与肉眼舒适。",
    },
  ];

  let current = 0;
  let fixed = false;
  let ruler = true;

  const tabs = [...root.querySelectorAll("[data-s03-case]")];
  const toggleBtn = root.querySelector("#s03-fix-toggle");
  const rulerBtn = root.querySelector("#s03-ruler-toggle");
  const stageEl = root.querySelector("#s03-stage");
  const headEl = root.querySelector("#s03-head");
  const noteEl = root.querySelector("#s03-note");
  const badgeEl = root.querySelector("#s03-badge");

  function stageMarkup(c) {
    const rCls = ruler ? "show-ruler" : "";
    if (c.id === "invert") {
      return `
        <div class="s03-demo s03-demo-invert ${fixed ? "is-fixed" : "is-bad"} ${rCls}">
          <div class="s03-icard">
            <div class="s03-ishape"></div>
            <div class="s03-itxt">A01 · 展厅导览</div>
          </div>
          <div class="s03-icard">
            <div class="s03-ishape is-circle"></div>
            <div class="s03-itxt">A02 · 开放时间</div>
          </div>
          <div class="s03-icard">
            <div class="s03-ishape is-tri"></div>
            <div class="s03-itxt">B01 · 预约通道</div>
          </div>
          <div class="s03-icard">
            <div class="s03-ishape is-bars"></div>
            <div class="s03-itxt">B02 · 语音解说</div>
          </div>
          ${ruler ? `<span class="s03-rtag s03-rtag-top">${fixed ? "外缝 16px > 内距 8px" : "外缝 8px < 内距 20px"}</span>` : ""}
        </div>`;
    }
    if (c.id === "random") {
      const gaps = fixed ? ["16px", "16px", "16px"] : ["13px", "27px", "9px"];
      return `
        <div class="s03-demo s03-demo-random ${fixed ? "is-fixed" : "is-bad"} ${rCls}">
          <div class="s03-rcells">
            <div class="s03-rcell">01</div>
            <div class="s03-rgap">${ruler ? gaps[0] : ""}</div>
            <div class="s03-rcell">02</div>
            <div class="s03-rgap">${ruler ? gaps[1] : ""}</div>
            <div class="s03-rcell">03</div>
            <div class="s03-rgap">${ruler ? gaps[2] : ""}</div>
            <div class="s03-rcell">04</div>
          </div>
          <div class="s03-rfoot">${fixed ? "统一尺度 · X=8px · 全部 2X=16px" : "手调零散 · 3 处沟道 3 个互不整除的数值"}</div>
        </div>`;
    }
    if (c.id === "tilewall") {
      return `
        <div class="s03-demo s03-demo-tile ${fixed ? "is-fixed" : "is-bad"} ${rCls}">
          <div class="s03-tcard ${fixed ? "is-hero" : ""}">
            <strong>${fixed ? "主专题 · 跨 2 列 (2W+X)" : "模块 01"}</strong>
            <span>${fixed ? "等距不变，面积拉开 2.1×" : "同尺寸 · 同权重"}</span>
          </div>
          ${fixed ? "" : `<div class="s03-tcard"><strong>模块 02</strong><span>同尺寸 · 同权重</span></div>`}
          <div class="s03-tcard"><strong>模块 03</strong><span>辅助信息</span></div>
          <div class="s03-tcard"><strong>模块 04</strong><span>辅助信息</span></div>
          <div class="s03-tcard"><strong>模块 05</strong><span>辅助信息</span></div>
          <div class="s03-tcard"><strong>模块 06</strong><span>辅助信息</span></div>
        </div>`;
    }
    // optical
    return `
      <div class="s03-demo s03-demo-optical ${fixed ? "is-fixed" : "is-bad"} ${rCls}">
        <div class="s03-oprow">
          <div class="s03-opsq" aria-hidden="true"></div>
          <div class="s03-opcir" aria-hidden="true"></div>
          <div class="s03-optxt">
            <strong>GRID 202</strong>
            <span>${fixed ? "圆徽外扩 +3% 视补偿，肉眼等高齐平" : "严格同框 56×56px，圆形肉眼偏小且文字行盒上浮"}</span>
          </div>
        </div>
        ${ruler ? `<div class="s03-opline-top"></div><div class="s03-opline-bot"></div>` : ""}
      </div>`;
  }

  function render() {
    const c = CASES[current];
    for (let i = 0; i < tabs.length; i++) {
      const on = i === current;
      tabs[i].classList.toggle("is-active", on);
      tabs[i].setAttribute("aria-selected", String(on));
    }
    toggleBtn.classList.toggle("is-fixed", fixed);
    toggleBtn.setAttribute("aria-pressed", String(fixed));
    toggleBtn.textContent = fixed ? "当前：修正后（切回错例）" : "当前：翻车错例（点看修正）";

    rulerBtn.classList.toggle("is-active", ruler);
    rulerBtn.setAttribute("aria-pressed", String(ruler));
    rulerBtn.textContent = ruler ? "红线标尺：开" : "红线标尺：关";

    badgeEl.textContent = fixed ? `修正 · ${c.en}` : `错例 · ${c.en}`;
    badgeEl.className = `s03-badge ${fixed ? "is-ok" : "is-err"}`;
    headEl.textContent = fixed ? c.goodHead : c.badHead;
    noteEl.textContent = fixed ? c.goodNote : c.badNote;
    stageEl.innerHTML = stageMarkup(c);
  }

  tabs.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      current = idx;
      fixed = false;
      render();
    });
  });
  toggleBtn.addEventListener("click", () => {
    fixed = !fixed;
    render();
  });
  rulerBtn.addEventListener("click", () => {
    ruler = !ruler;
    render();
  });

  render();
}

// =========================================================================
// 04 节：历史年代标本片切换台（4 个已核实里程碑 + 微缩蓝图标本）
// =========================================================================
function initSection04() {
  const root = document.getElementById("s04-history");
  if (!root) return;

  const ERAS = [
    {
      year: "1964",
      who: "卡尔·格斯特纳 · Karl Gerstner",
      workEn: "Designing Programmes",
      workZh: "初版 Arthur Niggli；Lars Müller 再版",
      desc: "格斯特纳把排版从「凭直觉单页手绘」推向「先定数学程序与统一参数」。只要底层模数与间距步长定准，同一套规则能衍生出成百上千种彼此呼应的版面，这正是「降低决策成本」的思想源头。",
      specLabel: "PROGRAMME MATRIX · 1964",
      visual: "gerstner",
    },
    {
      year: "1981",
      who: "约瑟夫·米勒-布罗克曼 · Josef Müller-Brockmann",
      workEn: "Rastersysteme für die visuelle Gestaltung / Grid Systems in Graphic Design",
      workZh: "Niggli Verlag 出版",
      desc: "瑞士国际主义排版奠基手册，系统演示了从 8 格到 32 格的二维与三维网格体系。书中反复强调：水平与垂直字段之间必须靠统一沟槽维持客观秩序，让读者专注于信息本身。",
      specLabel: "SWISS FIELD GRID · 1981",
      visual: "brockmann",
    },
    {
      year: "2014+",
      who: "Google Material Design & IBM Carbon 2x Grid",
      workEn: "8dp Baseline Grid & 8px Square Mini Unit",
      workZh: "配 4dp 图标与排版基线微调",
      desc: "进入高分屏与多端界面时代，Google Material Design 以 8dp 基准网格（小组件与排版基线用 4dp）统一间距，IBM Carbon 则以 8px 正方形 mini unit 乘除推导所有边距、内距与沟道——把印刷网格彻底落成了工程 Design Tokens。",
      specLabel: "8DP / 8PX MINI UNIT · TOKENS",
      visual: "tokens",
    },
    {
      year: "W3C",
      who: "W3C CSS Grid Layout Level 1 & CSS Box Alignment Level 3",
      workEn: "row-gap / column-gap / gap",
      workZh: "浏览器原生双轴等距沟槽规范",
      desc: "在浏览器原生层，W3C 先在 CSS Grid 规范引入网格沟道，再由 CSS Box Alignment Level 3 统一为 row-gap、column-gap 与简写 gap：只写一行 gap: 16px 就同时锁死行距与列距，跨列元素也自动计入内部沟道，告别了脆弱的负 margin 补丁。",
      specLabel: "CSS NATIVE GAP · W3C SPEC",
      visual: "cssgap",
    },
  ];

  let idx = 0;
  const btns = [...root.querySelectorAll("[data-s04-era]")];
  const yearEl = root.querySelector("#s04-year");
  const whoEl = root.querySelector("#s04-who");
  const workEl = root.querySelector("#s04-work");
  const descEl = root.querySelector("#s04-desc");
  const bpEl = root.querySelector("#s04-blueprint");
  const specLabelEl = root.querySelector("#s04-spec-label");

  function blueprintMarkup(kind) {
    if (kind === "gerstner") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="1964 程序网格矩阵示意">
          <rect x="8" y="8" width="304" height="160" fill="#FAF6F0" stroke="#0B0F0F" stroke-width="1.5"/>
          <g stroke="#C9C1B6" stroke-dasharray="2 3">
            <line x1="68" y1="8" x2="68" y2="168"/><line x1="128" y1="8" x2="128" y2="168"/>
            <line x1="188" y1="8" x2="188" y2="168"/><line x1="248" y1="8" x2="248" y2="168"/>
            <line x1="8" y1="62" x2="312" y2="62"/><line x1="8" y1="114" x2="312" y2="114"/>
          </g>
          <rect x="20" y="20" width="96" height="32" fill="#0B0F0F"/>
          <rect x="140" y="20" width="156" height="32" fill="#F3552B"/>
          <rect x="20" y="72" width="36" height="84" fill="#F3552B"/>
          <rect x="80" y="72" width="96" height="32" fill="#0B0F0F"/>
          <rect x="200" y="72" width="96" height="84" fill="none" stroke="#0B0F0F" stroke-width="1.5"/>
          <rect x="80" y="124" width="96" height="32" fill="#DFD7CC"/>
        </svg>`;
    }
    if (kind === "brockmann") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="1981 瑞士字段网格示意">
          <rect x="8" y="8" width="304" height="160" fill="#FAF6F0" stroke="#0B0F0F" stroke-width="1.5"/>
          <g fill="rgba(243,85,43,0.18)">
            <rect x="104" y="18" width="14" height="140"/><rect x="202" y="18" width="14" height="140"/>
            <rect x="20" y="64" width="280" height="14"/><rect x="20" y="114" width="280" height="14"/>
          </g>
          <g fill="none" stroke="#0B0F0F" stroke-width="1">
            <rect x="20" y="18" width="84" height="46"/><rect x="118" y="18" width="84" height="46"/><rect x="216" y="18" width="84" height="46"/>
            <rect x="20" y="78" width="84" height="36"/><rect x="118" y="78" width="182" height="36" fill="#0B0F0F"/>
            <rect x="20" y="128" width="182" height="30" fill="#F3552B" stroke="none"/><rect x="216" y="128" width="84" height="30"/>
          </g>
          <rect x="104" y="64" width="14" height="14" fill="#F3552B"/>
          <rect x="202" y="114" width="14" height="14" fill="#F3552B"/>
        </svg>`;
    }
    if (kind === "tokens") {
      return `
        <svg viewBox="0 0 320 176" role="img" aria-label="8dp 与 8px 基准阶梯示意">
          <rect x="8" y="8" width="304" height="160" fill="#FAF6F0" stroke="#0B0F0F" stroke-width="1.5"/>
          <rect x="26" y="34" width="8" height="8" fill="#F3552B"/>
          <text x="42" y="42" font-size="11" font-family="DM Mono, monospace" fill="#0B0F0F">1X = 8px (mini unit)</text>
          <rect x="26" y="62" width="16" height="16" fill="#F3552B"/>
          <text x="52" y="74" font-size="11" font-family="DM Mono, monospace" fill="#0B0F0F">2X = 16px (gutter)</text>
          <rect x="26" y="96" width="24" height="24" fill="#F3552B"/>
          <text x="60" y="112" font-size="11" font-family="DM Mono, monospace" fill="#0B0F0F">3X = 24px (margin)</text>
          <rect x="26" y="132" width="32" height="24" fill="#0B0F0F"/>
          <text x="68" y="148" font-size="11" font-family="DM Mono, monospace" fill="#0B0F0F">4X = 32px (section)</text>
        </svg>`;
    }
    return `
      <div class="s04-code-spec">
        <pre><code>.equidistant-grid {
  --x: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(var(--x) * 2); /* 行距 = 列距 = 16px */
}
.card { padding: var(--x); } /* 内距 8px &lt; 外缝 16px */
.feature { grid-column: span 2; } /* 自动含 16px 缝 */</code></pre>
      </div>`;
  }

  function render() {
    const e = ERAS[idx];
    btns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    yearEl.textContent = e.year;
    whoEl.textContent = e.who;
    workEl.innerHTML = `<em lang="en">${e.workEn}</em><span class="s04-work-zh"> · ${e.workZh}</span>`;
    descEl.textContent = e.desc;
    specLabelEl.textContent = e.specLabel;
    bpEl.innerHTML = blueprintMarkup(e.visual);
  }

  btns.forEach((b, i) => {
    b.addEventListener("click", () => {
      idx = i;
      render();
    });
  });

  render();
}

// =========================================================================
// 05 节：真实项目适配判定器（6 个具体项目，区分该用 / 降档用 / 别用）
// =========================================================================
function initSection05() {
  const root = document.getElementById("s05-fit");
  if (!root) return;

  const BRIEFS = [
    {
      id: "dashboard",
      name: "SaaS 数据看板",
      verdict: "直接用等距网格",
      tone: "ok",
      scores: [92, 95, 25],
      reason: "指标卡片结构高度一致、经常增删模块。用 X=8px（沟道 16px、内距 12px）能保证任意增卡都不乱，跨 2 列图表卡按 2W+16px 自动严齐。",
      alt: null,
    },
    {
      id: "exhibit",
      name: "美术馆展讯目录",
      verdict: "直接用等距网格",
      tone: "ok",
      scores: [86, 80, 35],
      reason: "十余场平行展览需要平等浏览、快速对比日期与展厅。统一 20px–24px 横竖等距沟道既显克制画廊感，也让图文卡片呼吸均匀。",
      alt: null,
    },
    {
      id: "mobile2",
      name: "360px 电商双列流",
      verdict: "缩小 X 倍率后使用",
      tone: "warn",
      scores: [88, 90, 30],
      reason: "小屏绝不能照搬桌面 24px 沟道，否则每张商品卡被压成细条。保持基数 X=4px，把横竖沟道同步降档到 8px–12px（2X–3X），并随视口配合流体弹性列宽。",
      alt: { id: "209", name: "209 响应式网格" },
    },
    {
      id: "novel",
      name: "长篇文学与学术专著",
      verdict: "别用等距网格",
      tone: "skip",
      scores: [15, 20, 15],
      reason: "连续长文靠单栏版心、舒适行长与固定行距让眼睛沉浸流淌，硬切进横竖等距方块只会把阅读流打碎成碎片。",
      alt: { id: "194", name: "194 手稿网格" },
    },
    {
      id: "festival",
      name: "先锋音乐节主海报",
      verdict: "别用等距网格",
      tone: "skip",
      scores: [25, 20, 95],
      reason: "等距网格天生中性、客观、安静；当主题本身需要撕裂感、反差和情绪爆发时，横竖相等的秩序反而会削弱冲击力。",
      alt: { id: "210", name: "210 破格网格" },
    },
    {
      id: "masonry",
      name: "横竖混杂摄影图墙",
      verdict: "慎用 / 换结构",
      tone: "skip",
      scores: [28, 70, 65],
      reason: "超宽全景与细长竖片比例悬殊，强塞进等距规整格子要么裁掉一半画面、要么留下尴尬空洞；若想围绕中心展开叙事，也可看放射或非对称方案。",
      alt: { id: "200", name: "200 非对称网格" },
    },
  ];

  let active = 0;
  const btns = [...root.querySelectorAll("[data-s05-brief]")];
  const verdictEl = root.querySelector("#s05-verdict");
  const titleEl = root.querySelector("#s05-title");
  const reasonEl = root.querySelector("#s05-reason");
  const altEl = root.querySelector("#s05-alt");
  const bars = [
    root.querySelector("#s05-b0"),
    root.querySelector("#s05-b1"),
    root.querySelector("#s05-b2"),
  ];

  function render() {
    const b = BRIEFS[active];
    btns.forEach((btn, i) => {
      const on = i === active;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    verdictEl.textContent = b.verdict;
    verdictEl.className = `s05-verdict is-${b.tone}`;
    titleEl.textContent = b.name;
    reasonEl.textContent = b.reason;
    b.scores.forEach((sc, i) => {
      bars[i].style.width = `${sc}%`;
    });
    if (b.alt) {
      altEl.hidden = false;
      altEl.innerHTML = `更合适的参照：<a href="${SIBLING_URL(b.alt.id)}" target="_blank" rel="noopener">${b.alt.name} ↗</a>`;
    } else {
      altEl.hidden = true;
    }
  }

  btns.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      active = i;
      render();
    });
  });

  render();
}

// =========================================================================
// 06 节：眼力测验（A/B/C/D 严格单变量对照 + 中性标签 + 红线标尺验真）
// =========================================================================
function initSection06() {
  const root = document.getElementById("s06-quiz");
  if (!root) return;

  const OPTIONS = {
    A: {
      correct: false,
      title: "方案 A · 横竖缝宽不一致（列距 18px ≠ 行距 8px）",
      why: "仔细看卡片之间的白缝：竖向列缝比横向行缝宽了两倍多，两排卡片（占满 6 格）被上下粘成了三条竖柱，而且 18px 也不是常见基数 8px 的整数倍。",
    },
    B: {
      correct: false,
      title: "方案 B · 内松外紧倒挂（卡内距 16px > 外部沟道 12px）",
      why: "它的列距和行距确实都是 12px，但卡片内部留白撑到了 16px，比卡片之间的缝还宽——导致每张卡里的标题看起来更贴近下一行卡片。",
    },
    C: {
      correct: true,
      title: "答对了！方案 C 完整满足等距网格四项条件",
      why: "以 X=8px 为基数，横向列距与纵向行距严格等于 16px（2X）；卡内距 8px（1X）紧于外缝；顶排跨 2 列主卡按 2W+16px 补齐中间沟道，右边缘和底排精准对齐。",
    },
    D: {
      correct: false,
      title: "方案 D · 跨列主卡漏算中间 1X 缝隙（右缘短缺 16px）",
      why: "它的列距、行距（16px）和卡内距（8px）全对，偏偏顶排跨 2 列主卡只给了 2W、漏加了中间 16px 沟道，让右边界凭空缩进一截，破坏了整条右对齐轴。",
    },
  };

  let picked = null;
  let showRuler = false;

  const cards = [...root.querySelectorAll("[data-quiz-opt]")];
  const fbEl = root.querySelector("#s06-feedback");
  const fbHead = root.querySelector("#s06-fb-head");
  const fbBody = root.querySelector("#s06-fb-body");
  const rulerBtn = root.querySelector("#s06-ruler");
  const resetBtn = root.querySelector("#s06-reset");

  function render() {
    const revealSpec = picked !== null || showRuler;
    root.classList.toggle("is-ruler", showRuler);
    root.classList.toggle("is-revealed", revealSpec);
    rulerBtn.classList.toggle("is-active", showRuler);
    rulerBtn.setAttribute("aria-pressed", String(showRuler));
    rulerBtn.textContent = showRuler ? "红线标尺验真：开" : "打开红线标尺验真";

    cards.forEach((btn) => {
      const id = btn.dataset.quizOpt;
      const isPicked = picked === id;
      btn.classList.toggle("is-picked", isPicked);
      btn.classList.toggle("is-right", picked !== null && OPTIONS[id].correct);
      btn.classList.toggle("is-wrong", isPicked && !OPTIONS[id].correct);
      btn.setAttribute("aria-pressed", String(isPicked));
      const specEl = btn.querySelector(".quiz-spec");
      if (specEl) {
        specEl.textContent = revealSpec ? specEl.dataset.reveal : specEl.dataset.neutral;
      }
    });

    if (picked) {
      const info = OPTIONS[picked];
      fbEl.hidden = false;
      fbEl.className = `s06-feedback ${info.correct ? "is-ok" : "is-err"}`;
      fbHead.textContent = info.title;
      fbBody.textContent = info.why;
      resetBtn.hidden = false;
    } else {
      fbEl.hidden = true;
      resetBtn.hidden = true;
    }
  }

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      picked = btn.dataset.quizOpt;
      render();
    });
  });

  rulerBtn.addEventListener("click", () => {
    showRuler = !showRuler;
    render();
  });

  resetBtn.addEventListener("click", () => {
    picked = null;
    showRuler = false;
    render();
  });

  render();
}

// =========================================================================
// 07 节：原海报灯箱（点击放大、拖动平移、滚轮/按钮缩放、Esc 关闭）
// =========================================================================
function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const imgSrcEl = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const viewport = document.getElementById("poster-viewport");
  if (!trigger || !modal || !modalImg || !imgSrcEl) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    modalImg.src = imgSrcEl.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeModal();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.75, Math.min(3.5, +(scale + delta).toFixed(2)));
    applyTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, tx0: tx, ty0: ty };
    try { viewport.setPointerCapture(e.pointerId); } catch {}
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = drag.tx0 + (e.clientX - drag.x0);
    ty = drag.ty0 + (e.clientY - drag.y0);
    applyTransform();
  });
  viewport.addEventListener("pointerup", () => { drag = null; });
  viewport.addEventListener("pointercancel", () => { drag = null; });
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}
