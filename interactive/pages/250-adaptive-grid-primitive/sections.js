// 正文 01–07 节交互组件（相邻两节绝不复用同一类控件与玩法）

// ---------- 01 节：原海报三大剖面卡（模块伸缩 / 对齐基线 / 响应变化） ----------
const S1_TABS = {
  module: {
    code: "MODULE · CONTENT GROWS",
    title: "模块伸缩：内容长高一寸，整排跟着长高一寸",
    quote: "模块可按内容自动扩展，保持网格节奏。",
    explain:
      "在静态稿里，设计师习惯把所有卡片画成一样高；可网页里的标题会换行、多语言会变长、用户会把字号调大。自适应网格把每个模块放进隐式行轨里，只要不写死 height，内容多出一行，该行自动撑开，同排其余模块跟着齐底拉伸。",
    formula: "grid-auto-rows: auto; /* 同排自动取最高卡片对齐 */",
    svg: `
      <svg viewBox="0 0 420 220" class="s1-svg" aria-hidden="true">
        <rect x="0" y="0" width="420" height="220" fill="#EEE8D6"/>
        <text x="20" y="28" fill="#171A18" font-family="'IBM Plex Sans', sans-serif" font-size="11" font-weight="700">2 × 2 初始模组</text>
        <g transform="translate(20,42)">
          <rect x="0" y="0" width="110" height="84" fill="#F7F3E7" stroke="#171A18" stroke-width="1.4"/>
          <line x1="55" y1="0" x2="55" y2="84" stroke="#171A18" stroke-width="1"/>
          <line x1="0" y1="42" x2="110" y2="42" stroke="#171A18" stroke-width="1"/>
          <rect x="1" y="43" width="53" height="40" fill="#1551C1"/>
        </g>
        <path d="M148 84 H182 M174 77 L182 84 L174 91" fill="none" stroke="#171A18" stroke-width="2"/>
        <text x="200" y="28" fill="#1041A0" font-family="'IBM Plex Sans', sans-serif" font-size="11" font-weight="700">4 × 2 内容增长扩展</text>
        <g transform="translate(200,42)">
          <rect x="0" y="0" width="200" height="84" fill="#F7F3E7" stroke="#171A18" stroke-width="1.4"/>
          <line x1="50" y1="0" x2="50" y2="84" stroke="#171A18" stroke-width="1"/>
          <line x1="100" y1="0" x2="100" y2="84" stroke="#171A18" stroke-width="1"/>
          <line x1="150" y1="0" x2="150" y2="84" stroke="#171A18" stroke-width="1"/>
          <line x1="0" y1="42" x2="200" y2="42" stroke="#171A18" stroke-width="1"/>
          <rect x="1" y="43" width="148" height="40" fill="#1551C1"/>
          <line x1="50" y1="43" x2="50" y2="83" stroke="#EEE8D6" stroke-width="1" stroke-dasharray="3 3"/>
          <line x1="100" y1="43" x2="100" y2="83" stroke="#EEE8D6" stroke-width="1" stroke-dasharray="3 3"/>
        </g>
        <rect x="20" y="148" width="380" height="52" fill="#11754F"/>
        <text x="36" y="170" fill="#FAF8F0" font-family="'DM Mono', monospace" font-size="11">CONTENT GROWS → MODULE EXPANDS</text>
        <text x="36" y="189" fill="#D4F2E4" font-family="'Noto Sans SC', sans-serif" font-size="11">横向按列轨伸展，纵向按最高内容撑齐，不破坏网格节奏</text>
      </svg>
    `,
  },
  align: {
    code: "ALIGN · BASELINE ORDER",
    title: "对齐基线：字形高矮不一，脚底踩在同一条线",
    quote: "文本与元素基于基线对齐，形成稳定视觉秩序。",
    explain:
      "原海报中央专门画了一个大写的 A 和小写的 g：A 坐在蓝线上，g 的降部（descender）从蓝线垂下去，但两者的阅读基准牢牢扣在同一条水平蓝线上。哪怕模块里字号、徽章、配图不尽相同，只要关键文字与边框锚在共同基线和列线上，扫视路径就稳而不乱。",
    formula: "align-items: baseline; /* 文字脚底齐平，不是盒顶硬对齐 */",
    svg: `
      <svg viewBox="0 0 420 220" class="s1-svg" aria-hidden="true">
        <rect x="0" y="0" width="420" height="220" fill="#EEE8D6"/>
        <line x1="24" y1="46" x2="396" y2="46" stroke="#75786D" stroke-width="1.2" stroke-dasharray="5 4"/>
        <text x="26" y="38" fill="#414842" font-family="'DM Mono', monospace" font-size="10">CAP HEIGHT 大写顶线</text>
        <line x1="24" y1="138" x2="396" y2="138" stroke="#1551C1" stroke-width="2.4"/>
        <text x="26" y="160" fill="#1041A0" font-family="'DM Mono', monospace" font-size="10.5" font-weight="500">BASELINE 共同基线（A 与 g 共同落脚）</text>
        <line x1="24" y1="176" x2="396" y2="176" stroke="#B03208" stroke-width="1" stroke-dasharray="3 4"/>
        <text x="256" y="192" fill="#B03208" font-family="'DM Mono', monospace" font-size="10">DESCENDER 降部下探</text>
        <text x="116" y="138" fill="#171A18" font-family="'Space Grotesk', sans-serif" font-size="112" font-weight="700">A</text>
        <text x="234" y="138" fill="#171A18" font-family="'Space Grotesk', sans-serif" font-size="112" font-weight="500">g</text>
        <circle cx="24" cy="138" r="4" fill="#1551C1"/>
        <circle cx="396" cy="138" r="4" fill="#1551C1"/>
      </svg>
    `,
  },
  flex: {
    code: "FLEX · RESPONSIVE FLOW",
    title: "响应变化：同一条公式，自动长出桌/平/手三套形态",
    quote: "列数与模块尺寸可响应不同屏幕与场景。",
    explain:
      "传统做法要针对 1200px、768px、480px 各写一段媒体查询；一旦同一个组件放进侧栏或弹窗，屏幕很宽、组件很窄，媒体查询就失灵了。自适应网格原语只看「容器自己的宽度」除以「最小列宽 + 间距」，放哪儿都能自动算对列数。",
    formula: "cols = floor((容器宽 + gap) / (minWidth + gap))",
    svg: `
      <svg viewBox="0 0 420 220" class="s1-svg" aria-hidden="true">
        <rect x="0" y="0" width="420" height="220" fill="#EEE8D6"/>
        <g transform="translate(20,24)">
          <text x="0" y="12" fill="#171A18" font-family="'Noto Sans SC', sans-serif" font-size="11" font-weight="700">桌面 980px → 4 列</text>
          <rect x="0" y="22" width="160" height="72" fill="#F7F3E7" stroke="#171A18" stroke-width="1.3"/>
          <line x1="40" y1="22" x2="40" y2="94" stroke="#171A18"/><line x1="80" y1="22" x2="80" y2="94" stroke="#171A18"/><line x1="120" y1="22" x2="120" y2="94" stroke="#171A18"/>
          <line x1="0" y1="58" x2="160" y2="58" stroke="#171A18"/>
          <rect x="1" y="59" width="78" height="34" fill="#1551C1"/>
        </g>
        <g transform="translate(206,24)">
          <text x="0" y="12" fill="#171A18" font-family="'Noto Sans SC', sans-serif" font-size="11" font-weight="700">平板 640px → 3 列</text>
          <rect x="0" y="22" width="114" height="72" fill="#F7F3E7" stroke="#171A18" stroke-width="1.3"/>
          <line x1="38" y1="22" x2="38" y2="94" stroke="#171A18"/><line x1="76" y1="22" x2="76" y2="94" stroke="#171A18"/>
          <line x1="0" y1="58" x2="114" y2="58" stroke="#171A18"/>
          <rect x="1" y="59" width="74" height="34" fill="#1551C1"/>
        </g>
        <g transform="translate(344,24)">
          <text x="0" y="12" fill="#171A18" font-family="'Noto Sans SC', sans-serif" font-size="11" font-weight="700">手机</text>
          <rect x="0" y="22" width="54" height="106" fill="#F7F3E7" stroke="#171A18" stroke-width="1.3"/>
          <line x1="27" y1="22" x2="27" y2="128" stroke="#171A18"/>
          <line x1="0" y1="48" x2="54" y2="48" stroke="#171A18"/><line x1="0" y1="75" x2="54" y2="75" stroke="#171A18"/><line x1="0" y1="102" x2="54" y2="102" stroke="#171A18"/>
          <rect x="1" y="49" width="25" height="52" fill="#1551C1"/>
        </g>
        <rect x="20" y="148" width="380" height="52" fill="#11754F"/>
        <text x="36" y="170" fill="#FAF8F0" font-family="'DM Mono', monospace" font-size="11">0 条 @media 断点 · 临界宽 = n × min + (n-1) × gap</text>
        <text x="36" y="189" fill="#D4F2E4" font-family="'Noto Sans SC', sans-serif" font-size="11">例：min=210px, gap=16px → 436px 升 2 列 · 662px 升 3 列 · 888px 升 4 列</text>
      </svg>
    `,
  },
};

export function initSection1() {
  const btns = [...document.querySelectorAll("[data-s1-tab]")];
  const diagram = document.getElementById("s1-diagram");
  const codeEl = document.getElementById("s1-code");
  const titleEl = document.getElementById("s1-title");
  const quoteEl = document.getElementById("s1-quote");
  const explainEl = document.getElementById("s1-explain");
  const formulaEl = document.getElementById("s1-formula");

  function setTab(key) {
    const data = S1_TABS[key] || S1_TABS.module;
    btns.forEach((b) => {
      const on = b.dataset.s1Tab === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    diagram.innerHTML = data.svg;
    codeEl.textContent = data.code;
    titleEl.textContent = data.title;
    quoteEl.textContent = data.quote;
    explainEl.textContent = data.explain;
    formulaEl.textContent = data.formula;
  }

  btns.forEach((b) => b.addEventListener("click", () => setTab(b.dataset.s1Tab)));
  setTab("module");
}

// ---------- 02 节：真 DOM 双轨对比槽（auto-fit vs auto-fill + min(100%) 安全阀） ----------
export function initSection2() {
  const widthSlider = document.getElementById("s2-width");
  const widthVal = document.getElementById("s2-width-val");
  const minSlider = document.getElementById("s2-min");
  const minVal = document.getElementById("s2-min-val");
  const countVal = document.getElementById("s2-count-val");
  const decBtn = document.getElementById("s2-dec");
  const incBtn = document.getElementById("s2-inc");
  const guardBtn = document.getElementById("s2-guard");
  const fitTrack = document.getElementById("s2-fit-grid");
  const fillTrack = document.getElementById("s2-fill-grid");
  const fitWrap = document.getElementById("s2-fit-wrap");
  const fillWrap = document.getElementById("s2-fill-wrap");
  const fitNote = document.getElementById("s2-fit-note");
  const fillNote = document.getElementById("s2-fill-note");
  const verdictEl = document.getElementById("s2-verdict");

  const st = { width: 680, min: 170, count: 2, guard: true };
  const CARD_NAMES = ["A 模块", "B 模块", "C 模块", "D 模块", "E 模块", "F 模块"];

  function render() {
    widthVal.textContent = `${st.width}px`;
    minVal.textContent = `${st.min}px`;
    countVal.textContent = `${st.count} 张`;
    decBtn.disabled = st.count <= 1;
    incBtn.disabled = st.count >= 6;
    guardBtn.setAttribute("aria-pressed", String(st.guard));
    guardBtn.textContent = st.guard ? "min(100%, …) 护栏：开" : "min(100%, …) 护栏：关（可爆框）";
    guardBtn.classList.toggle("is-warn", !st.guard);

    const gap = 12;
    // 真实视口宽映射到可用槽宽：保持真实计算结果，不让页面溢出
    const outerMax = Math.max(200, fitWrap.parentElement.clientWidth - 2);
    const scale = st.width > outerMax ? outerMax / st.width : 1;
    const renderW = Math.round(st.width * scale);
    const effMin = st.guard ? Math.min(st.width, st.min) : st.min;
    const overflow = !st.guard && st.width < st.min ? st.min - st.width : 0;

    const rawCols = Math.max(1, Math.floor((st.width + gap) / (effMin + gap)));
    const fitCols = Math.min(rawCols, st.count);
    const fillCols = rawCols;
    const emptyCols = Math.max(0, fillCols - st.count);

    const fitCardW = overflow > 0 ? st.min : Math.round((st.width - (fitCols - 1) * gap) / fitCols);
    const fillCardW = overflow > 0 ? st.min : Math.round((st.width - (fillCols - 1) * gap) / fillCols);

    fitWrap.style.width = `${renderW}px`;
    fillWrap.style.width = `${renderW}px`;
    fitWrap.classList.toggle("has-overflow", overflow > 0);
    fillWrap.classList.toggle("has-overflow", overflow > 0);

    const scaledMin = Math.max(40, Math.round(effMin * scale));
    const scaledGap = Math.max(6, Math.round(gap * scale));
    const minExpr = st.guard ? `min(100%, ${scaledMin}px)` : `${scaledMin}px`;

    fitTrack.style.gap = `${scaledGap}px`;
    fillTrack.style.gap = `${scaledGap}px`;
    fitTrack.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minExpr}, 1fr))`;
    fillTrack.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minExpr}, 1fr))`;

    const buildCards = (isFill) => {
      let html = "";
      for (let i = 0; i < st.count; i++) {
        const wText = isFill ? fillCardW : fitCardW;
        html += `<div class="s2-card"><b>${CARD_NAMES[i]}</b><span>${wText}px</span></div>`;
      }
      if (isFill && emptyCols > 0 && overflow === 0) {
        for (let e = 0; e < emptyCols; e++) {
          html += `<div class="s2-ghost" aria-hidden="true"><span>空轨 ${fillCardW}px</span></div>`;
        }
      }
      return html;
    };

    fitTrack.innerHTML = buildCards(false);
    fillTrack.innerHTML = buildCards(true);

    fitNote.textContent =
      overflow > 0
        ? `溢出 +${overflow}px！单列硬撑到 ${st.min}px`
        : `${fitCols} 列 · 每卡 ${fitCardW}px（空轨已收拢为 0px）`;
    fillNote.textContent =
      overflow > 0
        ? `溢出 +${overflow}px！单列硬撑到 ${st.min}px`
        : `${fillCols} 轨 · 每卡 ${fillCardW}px${emptyCols > 0 ? `（保留 ${emptyCols} 条空轨）` : "（已排满）"}`;

    if (overflow > 0) {
      verdictEl.textContent = `因为关掉了 min(100%, …)，容器宽 ${st.width}px 小于下限 ${st.min}px 时，两条网格都向右爆出了 +${overflow}px！重新打开护栏，窄屏才会自动回落到 100% 宽度。`;
      verdictEl.className = "s2-verdict is-bad";
    } else if (emptyCols > 0) {
      verdictEl.textContent = `眼下只有 ${st.count} 张卡，而 ${st.width}px 容器原本放得下 ${rawCols} 列：auto-fit 把多余的 ${emptyCols} 条空轨压成 0，把每张卡拉宽到 ${fitCardW}px；auto-fill 保留空轨，把每张卡守在 ${fillCardW}px——商品目录怕单卡拉扁时，优先选 auto-fill。`;
      verdictEl.className = "s2-verdict is-diff";
    } else {
      verdictEl.textContent = `当前 ${st.count} 张卡已经把 ${rawCols} 列排满，没有空轨可折叠，所以 auto-fit 与 auto-fill 表现完全一致（每卡 ${fitCardW}px）。把卡片减到 1–2 张，就能立刻看出两者的分水岭。`;
      verdictEl.className = "s2-verdict";
    }
  }

  widthSlider.addEventListener("input", () => {
    st.width = Number(widthSlider.value);
    render();
  });
  minSlider.addEventListener("input", () => {
    st.min = Number(minSlider.value);
    render();
  });
  decBtn.addEventListener("click", () => {
    if (st.count > 1) {
      st.count--;
      render();
    }
  });
  incBtn.addEventListener("click", () => {
    if (st.count < 6) {
      st.count++;
      render();
    }
  });
  guardBtn.addEventListener("click", () => {
    st.guard = !st.guard;
    render();
  });

  const ro = new ResizeObserver(() => render());
  ro.observe(fitWrap.parentElement);
  render();
}

// ---------- 03 节（深翠暗室）：真实 DOM 基线测量与等高对齐台 ----------
export function initSection3() {
  const modeBtns = [...document.querySelectorAll("[data-s3-mode]")];
  const cardActions = [...document.querySelectorAll("[data-s3-card]")];
  const stage = document.getElementById("s3-cards");
  const svgOverlay = document.getElementById("s3-overlay");
  const readoutEl = document.getElementById("s3-readout");
  const driftVal = document.getElementById("s3-drift");

  const st = {
    mode: "loose", // "loose" | "stretch" | "baseline" | "subgrid"
    longTitle1: false,
    extraBadge2: true,
    tallMedia0: true,
  };

  function drawOverlay() {
    const stageRect = stage.getBoundingClientRect();
    const titles = [...stage.querySelectorAll(".s3-card-title")];
    const metas = [...stage.querySelectorAll(".s3-card-meta")];
    if (!titles.length || stageRect.width < 10) return;

    const w = Math.round(stageRect.width);
    const h = Math.round(stageRect.height);
    svgOverlay.setAttribute("viewBox", `0 0 ${w} ${h}`);

    // 只在多列同排时衡量水平基线（手机单列时测第一与第二张卡的局部顶距，照样清晰说明）
    const boxes = titles.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x1: r.left - stageRect.left,
        x2: r.right - stageRect.left,
        y: r.bottom - stageRect.top - 2,
      };
    });
    const metaBoxes = metas.map((el) => {
      const r = el.getBoundingClientRect();
      return { x1: r.left - stageRect.left, x2: r.right - stageRect.left, y: r.top - stageRect.top };
    });

    const sameRow = boxes.length >= 2 && Math.abs(boxes[0].x1 - boxes[1].x1) > 40;
    const titleDrift = sameRow ? Math.round(Math.max(...boxes.map((b) => b.y)) - Math.min(...boxes.map((b) => b.y))) : 0;
    const metaDrift = sameRow ? Math.round(Math.max(...metaBoxes.map((b) => b.y)) - Math.min(...metaBoxes.map((b) => b.y))) : 0;

    let lines = "";
    if (sameRow) {
      if (titleDrift <= 2) {
        const y = boxes[0].y;
        lines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#82B3FF" stroke-width="2"/>`;
        lines += `<circle cx="6" cy="${y}" r="4" fill="#82B3FF"/>`;
      } else {
        const d = boxes.map((b, i) => `${i === 0 ? "M" : "L"}${b.x1.toFixed(1)} ${b.y.toFixed(1)} L${b.x2.toFixed(1)} ${b.y.toFixed(1)}`).join(" ");
        lines += `<path d="${d}" fill="none" stroke="#FF8A80" stroke-width="2" stroke-dasharray="5 3"/>`;
      }
      if (st.mode === "subgrid") {
        const my = metaBoxes[0].y;
        lines += `<line x1="0" y1="${my}" x2="${w}" y2="${my}" stroke="#6EE5B0" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      }
    }
    svgOverlay.innerHTML = lines;

    if (!sameRow) {
      driftVal.textContent = "窄屏单列堆叠";
    } else if (st.mode === "subgrid") {
      driftVal.textContent = `标题差 ${titleDrift}px · 底栏差 ${metaDrift}px（跨卡全齐）`;
    } else {
      driftVal.textContent = `标题基线差 ${titleDrift}px · 底栏落差 ${metaDrift}px`;
    }

    const msgMap = {
      loose:
        "各自独立排布（align-items: start）：卡片 01 配图偏高、卡片 02 标题行数变动、卡片 03 顶部多一行眉标，三张卡片的标题基线错开成锯齿，底边也参差不齐。",
      stretch:
        "网格默认等高拉伸（align-items: stretch）：外框底边齐平了，卡片外形稳住；但内部各自排版，标题与底部标签线依然上下错落。",
      baseline:
        "首行基线对齐（align-items: baseline）：浏览器按首行标题基线把三张卡对齐到同一条蓝色水平线上（对应原海报 A g 蓝线），眼睛横向扫标题毫不跳行。",
      subgrid:
        "跨卡子网格（grid-template-rows: subgrid）：每张卡内部共享父网格的 3 条水平行轨——图区、标题区、底栏三条线全部跨卡齐平，哪怕卡片 02 标题突然多出两行，其余卡片也会同步让位。",
    };
    readoutEl.textContent = msgMap[st.mode];
  }

  function apply() {
    stage.dataset.mode = st.mode;
    modeBtns.forEach((b) => {
      const on = b.dataset.s3Mode === st.mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const media0 = document.getElementById("s3-media-0");
    const title1 = document.getElementById("s3-title-1");
    const badge2 = document.getElementById("s3-badge-2");
    if (media0) media0.classList.toggle("is-tall", st.tallMedia0);
    if (title1) {
      title1.textContent = st.longTitle1
        ? "当某个模块的标题在真实业务里突然拉长到两三行时"
        : "模块标题随内容增长";
    }
    if (badge2) badge2.hidden = !st.extraBadge2;

    cardActions.forEach((b) => {
      const kind = b.dataset.s3Card;
      const active =
        (kind === "tall0" && st.tallMedia0) ||
        (kind === "long1" && st.longTitle1) ||
        (kind === "badge2" && st.extraBadge2);
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });

    requestAnimationFrame(drawOverlay);
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => {
    st.mode = b.dataset.s3Mode;
    apply();
  }));

  cardActions.forEach((b) => b.addEventListener("click", () => {
    const kind = b.dataset.s3Card;
    if (kind === "tall0") st.tallMedia0 = !st.tallMedia0;
    if (kind === "long1") st.longTitle1 = !st.longTitle1;
    if (kind === "badge2") st.extraBadge2 = !st.extraBadge2;
    apply();
  }));

  const ro = new ResizeObserver(() => requestAnimationFrame(drawOverlay));
  ro.observe(stage);
  apply();
}

// ---------- 04 节：四纪元历史时间轴（1981 → 2010 → 2017 → 2019） ----------
const S4_ERAS = {
  "1981": {
    year: "1981",
    person: "约瑟夫·米勒-布罗克曼（Josef Müller-Brockmann）",
    work: "《平面设计中的网格系统》（Grid Systems in Graphic Design, Niggli Verlag）",
    desc: "把瑞士国际主义印刷模数写成完整手册：纸张尺寸固定，设计师把版面拆成 8 到 32 个格田，模块可跨格组合，文字全部锚在行距基线上。这是「网格节奏与统一对齐」的源头，但它面向的是不会改变宽度的纸页。",
    code: `/* 印刷模数思路：画幅固定，人工算好栏宽与栏距 */\n版面宽 = 2 × 边距 + n × 栏宽 + (n - 1) × 栏距`,
    diagram: `<svg viewBox="0 0 280 120" aria-hidden="true"><rect x="10" y="10" width="260" height="100" fill="#FAF8F0" stroke="#171A18" stroke-width="1.4"/><g stroke="#B8B29F" stroke-width="0.9"><line x1="75" y1="10" x2="75" y2="110"/><line x1="140" y1="10" x2="140" y2="110"/><line x1="205" y1="10" x2="205" y2="110"/><line x1="10" y1="60" x2="270" y2="60"/></g><rect x="14" y="14" width="122" height="42" fill="#1551C1"/><rect x="144" y="64" width="57" height="42" fill="#E64D16"/></svg>`,
  },
  "2010": {
    year: "2010",
    person: "伊桑·马科特（Ethan Marcotte）",
    work: "《Responsive Web Design》，发表于 A List Apart（2010 年 5 月 25 日）",
    desc: "智能手机普及后，网页画幅彻底失去固定宽度。马科特整合「流式百分比网格、弹性媒体、CSS 媒体查询」三件套，提出响应式网页设计。网页终于能适配多屏，但代价是工程师要为 480 / 768 / 1024 / 1280 等断点维护大量手写列数规则。",
    code: `.card { width: 100%; float: left; }\n@media (min-width: 768px)  { .card { width: 50%; } }\n@media (min-width: 1120px) { .card { width: 25%; } }`,
    diagram: `<svg viewBox="0 0 280 120" aria-hidden="true"><rect x="10" y="14" width="120" height="92" fill="#FAF8F0" stroke="#171A18" stroke-width="1.3"/><rect x="18" y="24" width="30" height="72" fill="#1551C1"/><rect x="55" y="24" width="30" height="72" fill="#1551C1"/><rect x="92" y="24" width="30" height="72" fill="#1551C1"/><text x="142" y="64" fill="#B03208" font-family="'DM Mono', monospace" font-size="11">@media</text><rect x="196" y="14" width="74" height="92" fill="#FAF8F0" stroke="#171A18" stroke-width="1.3"/><rect x="204" y="24" width="58" height="32" fill="#E64D16"/><rect x="204" y="64" width="58" height="32" fill="#E64D16"/></svg>`,
  },
  "2017": {
    year: "2016–2018",
    person: "W3C CSS 工作组 · 瑞秋·安德鲁（Rachel Andrew）· 珍·西蒙斯（Jen Simmons）",
    work: "CSS Grid Layout Level 1（2016 年 9 月 CR，2017 年 3 月三主流浏览器同步落地）与 2018 年「内在网页设计」演讲",
    desc: "Firefox 52、Chrome 57、Safari 10.1 在 2017 年 3 月三周内相继上线原生 CSS Grid，网页首次拥有真正的二维行/列轨道、fr 弹性单位与 repeat(auto-fit, minmax())。次年珍·西蒙斯在 An Event Apart 提出「内在网页设计（Intrinsic Web Design）」，主张让内容与空间自己协商尺寸。",
    code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 1rem;\n}`,
    diagram: `<svg viewBox="0 0 280 120" aria-hidden="true"><rect x="10" y="10" width="260" height="100" fill="#11754F"/><rect x="20" y="20" width="74" height="36" fill="#EEE8D6"/><rect x="103" y="20" width="74" height="36" fill="#1551C1"/><rect x="186" y="20" width="74" height="36" fill="#EEE8D6"/><rect x="20" y="64" width="74" height="36" fill="#E64D16"/><rect x="103" y="64" width="74" height="36" fill="#EEE8D6"/><rect x="186" y="64" width="74" height="36" fill="#EEE8D6"/></svg>`,
  },
  "2019": {
    year: "2019",
    person: "海顿·皮克林（Heydon Pickering）& 安迪·贝尔（Andy Bell）",
    work: "《Every Layout: Relearn CSS Layout, by Example》中的「The Grid」布局原语",
    desc: "两人把现代 CSS 提炼为一组可嵌套的「布局原语（Layout Primitives）」，并为自适应网格补上最关键的一步——把 minmax() 下限包进 min(100%, var(--min))。从此无论把网格塞进宽屏主栏还是 240px 窄抽屉，一条声明自动折列、绝不横向溢出。",
    code: `.grid {\n  display: grid;\n  gap: var(--s1);\n  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));\n}`,
    diagram: `<svg viewBox="0 0 280 120" aria-hidden="true"><rect x="10" y="10" width="260" height="100" fill="#11754F"/><line x1="96" y1="10" x2="96" y2="110" stroke="#5AC295" stroke-dasharray="4 3"/><line x1="184" y1="10" x2="184" y2="110" stroke="#5AC295" stroke-dasharray="4 3"/><rect x="18" y="18" width="70" height="84" fill="#EEE8D6"/><circle cx="53" cy="60" r="18" fill="#1551C1"/><rect x="104" y="18" width="72" height="84" fill="#EEE8D6"/><path d="M104 102 A38 38 0 0 1 142 64 L142 102 Z" fill="#E64D16"/><rect x="192" y="18" width="70" height="84" fill="#EEE8D6"/><line x1="206" y1="42" x2="248" y2="42" stroke="#171A18" stroke-width="2"/><line x1="206" y1="56" x2="242" y2="56" stroke="#171A18" stroke-width="2"/><line x1="206" y1="74" x2="250" y2="74" stroke="#1551C1" stroke-width="2.4"/></svg>`,
  },
};

export function initSection4() {
  const btns = [...document.querySelectorAll("[data-s4-era]")];
  const yearEl = document.getElementById("s4-year");
  const personEl = document.getElementById("s4-person");
  const workEl = document.getElementById("s4-work");
  const descEl = document.getElementById("s4-desc");
  const codeEl = document.getElementById("s4-code");
  const diagEl = document.getElementById("s4-diagram");

  function setEra(k) {
    const e = S4_ERAS[k] || S4_ERAS["2019"];
    btns.forEach((b) => {
      const on = b.dataset.s4Era === k;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    yearEl.textContent = e.year;
    personEl.textContent = e.person;
    workEl.textContent = e.work;
    descEl.textContent = e.desc;
    codeEl.textContent = e.code;
    diagEl.innerHTML = e.diagram;
  }

  btns.forEach((b) => b.addEventListener("click", () => setEra(b.dataset.s4Era)));
  setEra("2019");
}

// ---------- 05 节：什么时候别用它（4 场景错配诊断器） ----------
const S5_CASES = {
  sidebar: {
    name: "固定主次双栏",
    wrongTitle: "硬套自适应等宽网格：侧栏与正文被迫五五平分",
    wrongText: "自适应网格默认所有轨道均分剩余空间（1fr）。把 220px 导航目录和主文章塞进去，目录被拉宽到一半屏宽，正文反被挤得喘不过气。",
    rightTitle: "换用「侧栏原语」：窄栏守住定宽，正文独享余量",
    rightText: "侧栏固定基准宽、主内容吃掉全部剩余空间；缩到极窄屏再整体折成上下排布。",
    linkLabel: "247 侧栏原语",
    linkHref: "https://layout.xiaoxiaodong.ai/247/play/",
    wrongSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#E8E1CE"/><rect x="12" y="14" width="162" height="102" fill="#EEE8D6" stroke="#A81B12" stroke-width="1.6"/><text x="24" y="38" fill="#A81B12" font-size="11" font-weight="700">目录被迫拉成 50%</text><rect x="24" y="52" width="60" height="6" fill="#9A9686"/><rect x="24" y="66" width="52" height="6" fill="#9A9686"/><rect x="186" y="14" width="162" height="102" fill="#FAF8F0" stroke="#A81B12" stroke-width="1.6"/><text x="198" y="38" fill="#171A18" font-size="11" font-weight="700">正文只剩半幅</text><rect x="198" y="52" width="134" height="6" fill="#171A18"/><rect x="198" y="66" width="126" height="6" fill="#171A18"/><rect x="198" y="80" width="130" height="6" fill="#171A18"/></svg>`,
    rightSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#11754F"/><rect x="12" y="14" width="88" height="102" fill="#EEE8D6"/><text x="22" y="38" fill="#1041A0" font-size="11" font-weight="700">定宽侧栏</text><rect x="22" y="52" width="58" height="6" fill="#1551C1"/><rect x="22" y="66" width="48" height="6" fill="#9A9686"/><rect x="112" y="14" width="236" height="102" fill="#FAF8F0"/><text x="126" y="38" fill="#0C5E3E" font-size="11" font-weight="700">主正文区独享剩余宽</text><rect x="126" y="52" width="204" height="6" fill="#171A18"/><rect x="126" y="66" width="192" height="6" fill="#171A18"/><rect x="126" y="80" width="200" height="6" fill="#171A18"/></svg>`,
  },
  orphan: {
    name: "三步流程 / 四个要点",
    wrongTitle: "硬套自适应网格：中屏折出「上 3 下 1」孤儿卡",
    wrongText: "4 个同等重要的步骤或定价卡，缩到中等屏宽时自适应网格会先变成 3 列，第 4 张卡孤零零掉在第二行，破坏对称比较感。",
    rightTitle: "换用「切换器」：要么整组横排，要么一步直落全竖排",
    rightText: "对 2–4 个并列要点，设一个共同阈值：高于阈值全部横排，低于阈值同时切为单列，绝不留孤儿卡。",
    linkLabel: "248 切换器",
    linkHref: "https://layout.xiaoxiaodong.ai/248/play/",
    wrongSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#E8E1CE"/><rect x="12" y="12" width="104" height="48" fill="#FAF8F0" stroke="#171A18"/><rect x="128" y="12" width="104" height="48" fill="#FAF8F0" stroke="#171A18"/><rect x="244" y="12" width="104" height="48" fill="#FAF8F0" stroke="#171A18"/><rect x="12" y="70" width="104" height="48" fill="#FAF8F0" stroke="#A81B12" stroke-width="1.8"/><text x="24" y="98" fill="#A81B12" font-size="11" font-weight="700">04 孤儿落单</text><rect x="128" y="70" width="220" height="48" fill="none" stroke="#A81B12" stroke-dasharray="4 3"/><text x="190" y="98" fill="#A81B12" font-size="11">大块空缺破坏对称</text></svg>`,
    rightSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#11754F"/><rect x="12" y="14" width="78" height="102" fill="#EEE8D6"/><rect x="98" y="14" width="78" height="102" fill="#EEE8D6"/><rect x="184" y="14" width="78" height="102" fill="#EEE8D6"/><rect x="270" y="14" width="78" height="102" fill="#EEE8D6"/><text x="36" y="68" fill="#0C5E3E" font-size="11" font-weight="700">01</text><text x="122" y="68" fill="#0C5E3E" font-size="11" font-weight="700">02</text><text x="208" y="68" fill="#0C5E3E" font-size="11" font-weight="700">03</text><text x="294" y="68" fill="#0C5E3E" font-size="11" font-weight="700">04</text></svg>`,
  },
  chips: {
    name: "长短悬殊的标签组",
    wrongTitle: "硬套等宽网格：两个字的标签背着巨幅空白",
    wrongText: "筛选项里既有「AI」也有「响应式无断点布局原语」，等宽轨道只能按最长那项给宽，短标签四周全是尴尬空洞。",
    rightTitle: "换用「簇群」：每个标签贴合自身文字宽度自然换行",
    rightText: "簇群（flex-wrap + gap）让元素各按内容固有宽度排开、只统一间距，长短词混排依然紧致自然。",
    linkLabel: "246 簇群",
    linkHref: "https://layout.xiaoxiaodong.ai/246/play/",
    wrongSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#E8E1CE"/><rect x="12" y="18" width="162" height="36" fill="#FAF8F0" stroke="#A81B12" stroke-width="1.5"/><text x="24" y="40" fill="#171A18" font-size="12">AI</text><text x="104" y="40" fill="#A81B12" font-size="10">大量空洞</text><rect x="186" y="18" width="162" height="36" fill="#FAF8F0" stroke="#171A18"/><text x="196" y="40" fill="#171A18" font-size="11">无断点自适应网格</text><rect x="12" y="66" width="162" height="36" fill="#FAF8F0" stroke="#A81B12" stroke-width="1.5"/><text x="24" y="88" fill="#171A18" font-size="12">网格</text><rect x="186" y="66" width="162" height="36" fill="#FAF8F0" stroke="#A81B12" stroke-width="1.5"/><text x="196" y="88" fill="#171A18" font-size="12">CSS</text></svg>`,
    rightSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#11754F"/><rect x="16" y="24" width="44" height="34" fill="#EEE8D6"/><text x="30" y="45" fill="#171A18" font-size="12" font-weight="700">AI</text><rect x="72" y="24" width="142" height="34" fill="#EEE8D6"/><text x="84" y="45" fill="#171A18" font-size="11" font-weight="700">无断点自适应网格</text><rect x="226" y="24" width="60" height="34" fill="#EEE8D6"/><text x="242" y="45" fill="#171A18" font-size="12" font-weight="700">网格</text><rect x="16" y="70" width="56" height="34" fill="#EEE8D6"/><text x="28" y="91" fill="#171A18" font-size="12" font-weight="700">CSS</text><rect x="84" y="70" width="110" height="34" fill="#1551C1"/><text x="98" y="91" fill="#FAF8F0" font-size="11" font-weight="700">贴合内容宽</text></svg>`,
  },
  reel: {
    name: "多图商品画廊（手机不欲拉长）",
    wrongTitle: "硬套自适应网格：12 张图在手机折成 12 屏长龙",
    wrongText: "在信息密集的首页或频道页，把十几张同级推荐图全放进自适应网格，手机端一折成单列，用户要连续翻四五屏才能到达下一板块。",
    rightTitle: "换用「横向卷轴」：锁住纵高，横向露半张引导滑动",
    rightText: "需要克制页面总长度、只占一条横向带时，把多张同规格卡片收进可横滑的卷轴里更轻快。",
    linkLabel: "252 横向卷轴",
    linkHref: "https://layout.xiaoxiaodong.ai/252/play/",
    wrongSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#E8E1CE"/><rect x="115" y="8" width="130" height="24" fill="#FAF8F0" stroke="#A81B12"/><rect x="115" y="38" width="130" height="24" fill="#FAF8F0" stroke="#A81B12"/><rect x="115" y="68" width="130" height="24" fill="#FAF8F0" stroke="#A81B12"/><rect x="115" y="98" width="130" height="24" fill="#FAF8F0" stroke="#A81B12"/><text x="260" y="68" fill="#A81B12" font-size="11" font-weight="700">↓ 无限拉长</text></svg>`,
    rightSvg: `<svg viewBox="0 0 360 130" aria-hidden="true"><rect width="360" height="130" fill="#11754F"/><rect x="12" y="18" width="96" height="82" fill="#EEE8D6"/><rect x="118" y="18" width="96" height="82" fill="#EEE8D6"/><rect x="224" y="18" width="96" height="82" fill="#EEE8D6"/><rect x="330" y="18" width="30" height="82" fill="#E64D16"/><rect x="12" y="110" width="160" height="5" fill="#FAF8F0"/><rect x="172" y="110" width="176" height="5" fill="#0B4E34"/></svg>`,
  },
};

export function initSection5() {
  const caseBtns = [...document.querySelectorAll("[data-s5-case]")];
  const toggleBtn = document.getElementById("s5-toggle");
  const visual = document.getElementById("s5-visual");
  const badge = document.getElementById("s5-badge");
  const titleEl = document.getElementById("s5-title");
  const textEl = document.getElementById("s5-text");
  const linkEl = document.getElementById("s5-link");

  const st = { key: "sidebar", fixed: false };

  function render() {
    const c = S5_CASES[st.key] || S5_CASES.sidebar;
    caseBtns.forEach((b) => {
      const on = b.dataset.s5Case === st.key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    visual.innerHTML = st.fixed ? c.rightSvg : c.wrongSvg;
    badge.textContent = st.fixed ? "换对原语" : "硬套自适应网格";
    badge.className = `s5-badge ${st.fixed ? "is-ok" : "is-bad"}`;
    titleEl.textContent = st.fixed ? c.rightTitle : c.wrongTitle;
    textEl.textContent = st.fixed ? c.rightText : c.wrongText;
    toggleBtn.textContent = st.fixed ? "切回看硬套网格的毛病" : `一键换用「${c.linkLabel}」`;
    toggleBtn.setAttribute("aria-pressed", String(st.fixed));
    linkEl.textContent = `延伸阅读：${c.linkLabel} →`;
    linkEl.href = c.linkHref;
  }

  caseBtns.forEach((b) =>
    b.addEventListener("click", () => {
      st.key = b.dataset.s5Case;
      st.fixed = false;
      render();
    }),
  );
  toggleBtn.addEventListener("click", () => {
    st.fixed = !st.fixed;
    render();
  });
  render();
}

// ---------- 06 节：四选一实战练习（纯中性 A/B/C/D，单变量差异） ----------
const S6_ANSWERS = {
  A: {
    ok: false,
    title: "选 A 不稳：列数写死 4 列，580px 下每张卡压扁到 133px",
    reason:
      "A 和正解 B 的其余参数完全一样（gap 16px、内容自动伸高），只差在它用了 repeat(4, 1fr)。放进 580px 侧栏后，(580 - 3×16) / 4 = 133px，远低于 170px 易读底线，标题会被折成碎条。",
  },
  B: {
    ok: true,
    title: "答对了！选 B：一套公式自动落 2 列 × 282px，长卡等高、缩屏不溢",
    reason:
      "repeat(auto-fit, minmax(min(100%, 210px), 1fr)) 在 580px 容器里自动算出 2 列（每列 282px，正好落在 170–260px 之上且舒展）；不写死高度，第 2 张长标题卡会带动同行自然伸展；套了 min(100%, …) 护栏，就算再缩到 200px 窄端也不会横向爆框。",
  },
  C: {
    ok: false,
    title: "选 C 会裁字：写死 height: 84px 把第 2 张长标题卡拦腰截断",
    reason:
      "C 和正解 B 的列轨与间距完全一致，只差在给每张卡锁死了固定高度并 overflow: hidden。一旦第 2 张卡片标题多出两行，底部文字直接消失，违背「模块可按内容自动扩展」。",
  },
  D: {
    ok: false,
    title: "选 D 丢节奏：gap: 0px 粘连且单卡各自写 margin-top 破坏统一基线",
    reason:
      "D 和正解 B 的列数算法和内容高度都一样，只差在把统一 gap 归零、又在个别卡片上加了不同的外边距。卡片边缘互相贴死、同行基线错齿，违背「统一对齐」与「节奏与间距」。",
  },
};

export function initSection6() {
  const cards = [...document.querySelectorAll("[data-quiz-opt]")];
  const verdict = document.getElementById("s6-verdict");
  const titleEl = document.getElementById("s6-v-title");
  const textEl = document.getElementById("s6-v-text");
  const resetBtn = document.getElementById("s6-reset");

  function pick(opt) {
    const info = S6_ANSWERS[opt];
    if (!info) return;
    cards.forEach((c) => {
      const k = c.dataset.quizOpt;
      c.setAttribute("aria-pressed", String(k === opt));
      c.classList.add("is-revealed");
      c.classList.toggle("is-picked", k === opt);
      c.classList.toggle("is-correct", k === "B");
      c.classList.toggle("is-wrong", k === opt && k !== "B");
    });
    verdict.classList.add("is-answered");
    verdict.classList.toggle("is-ok", info.ok);
    verdict.classList.toggle("is-bad", !info.ok);
    titleEl.textContent = info.title;
    textEl.textContent = info.reason;
    resetBtn.hidden = false;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.quizOpt)));
  resetBtn.addEventListener("click", () => {
    cards.forEach((c) => {
      c.setAttribute("aria-pressed", "false");
      c.classList.remove("is-revealed", "is-picked", "is-correct", "is-wrong");
    });
    verdict.classList.remove("is-answered", "is-ok", "is-bad");
    titleEl.textContent = "先凭结构直觉选出一套。";
    textEl.textContent = "四套方案只各自改了一个变量：列轨算法、高度策略或间距对齐。选完以后会亮出隐藏网格尺与逐项解析。";
    resetBtn.hidden = true;
  });
}

// ---------- 07 节：原海报灯箱（点击放大、拖动看细节、缩放、Esc 关） ----------
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-in");
  const zoomOutBtn = document.getElementById("lb-out");
  const resetBtn = document.getElementById("lb-reset");
  const stage = document.getElementById("lb-stage");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    resetBtn.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function close() {
    dialog.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!dialog.hidden && e.key === "Escape") close();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  resetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    try {
      lbImg.setPointerCapture(e.pointerId);
    } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  lbImg.addEventListener("pointerup", (e) => {
    dragging = false;
    try {
      lbImg.releasePointerCapture(e.pointerId);
    } catch {}
  });
  lbImg.addEventListener("pointercancel", () => {
    dragging = false;
  });
}
