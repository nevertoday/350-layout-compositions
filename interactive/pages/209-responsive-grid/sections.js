// 209 响应式网格 — 正文 01–08 节独立交互模块（相邻章节各用不同交互控件）

export function initSections() {
  initSec01Breakpoints();
  initSec02ReflowOrder();
  initSec03ContainerQuery();
  initSec04HierarchyOrder();
  initSec05Timeline();
  initSec06Triage();
  initSec07Quiz();
  initSec08Lightbox();
}

/* ---------- 01 断点该由内容决定 ---------- */
function initSec01Breakpoints() {
  const range = document.getElementById("bp-lab-range");
  const wOut = document.getElementById("bp-lab-w");
  const sandbox = document.getElementById("bp-sandbox");
  const readout = document.getElementById("bp-lab-readout");
  const flagsEl = document.getElementById("bp-ruler-flags");
  const btnDevice = document.getElementById("bp-mode-device");
  const btnContent = document.getElementById("bp-mode-content");
  const btnFlag = document.getElementById("bp-flag-btn");

  let mode = "device"; // "device" | "content"
  const flags = [];

  function render() {
    const w = Number(range.value);
    wOut.textContent = `${w}px`;
    const shellW = sandbox.parentElement.clientWidth - 28;
    const visualW = Math.min(shellW, Math.max(250, Math.round((w / 1240) * shellW)));
    sandbox.style.width = `${visualW}px`;

    const bps = mode === "device" ? [768, 1024] : [600, 940];
    const cols = w >= bps[1] ? 3 : w >= bps[0] ? 2 : 1;
    sandbox.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    const colPx = Math.round((w - 28 - (cols - 1) * 12) / cols);
    const estChars = Math.max(6, Math.round((colPx - 24) / 14));
    let verdict = "";
    if (estChars > 34) {
      verdict = `估算每行约 ${estChars} 汉字（经验示意，偏长易串行）——内容已经呼唤提前分列。`;
    } else if (estChars < 14) {
      verdict = `估算每行仅约 ${estChars} 汉字（经验示意，偏碎）——单栏过窄，应该减少列数。`;
    } else {
      verdict = `估算每行约 ${estChars} 汉字（经验示意，落入 18–32 字舒适区间），阅读节奏稳健。`;
    }

    const modeName = mode === "device" ? "套死 768 / 1024 机型断点" : "按内容行宽设 600 / 940 断点";
    readout.textContent = `当前容器 ${w}px（${modeName}）→ ${cols} 列，单栏实宽约 ${colPx}px：${verdict}`;
  }

  function renderFlags() {
    if (!flags.length) {
      flagsEl.innerHTML = `<span class="flag-chip">拖动滑轨找到阅读变别扭的宽度，点「在此宽插旗标破点」记下属于你的内容断点</span>`;
      return;
    }
    flagsEl.innerHTML = flags
      .map((f) => `<span class="flag-chip">已标破点 ${f.w}px（${f.cols}列 · 约${f.chars}字）</span>`)
      .join("");
  }

  range.addEventListener("input", render);
  btnDevice.addEventListener("click", () => {
    mode = "device";
    btnDevice.classList.add("is-active");
    btnContent.classList.remove("is-active");
    render();
  });
  btnContent.addEventListener("click", () => {
    mode = "content";
    btnContent.classList.add("is-active");
    btnDevice.classList.remove("is-active");
    render();
  });
  btnFlag.addEventListener("click", () => {
    const w = Number(range.value);
    const bps = mode === "device" ? [768, 1024] : [600, 940];
    const cols = w >= bps[1] ? 3 : w >= bps[0] ? 2 : 1;
    const colPx = Math.round((w - 28 - (cols - 1) * 12) / cols);
    const chars = Math.max(6, Math.round((colPx - 24) / 14));
    if (!flags.some((f) => f.w === w)) {
      flags.push({ w, cols, chars });
      flags.sort((a, b) => a.w - b.w);
      if (flags.length > 5) flags.shift();
    }
    renderFlags();
  });

  window.addEventListener("resize", render);
  renderFlags();
  render();
}

/* ---------- 02 12/8/4 阶梯列网与 SVG Tab 焦点轨迹回放 ---------- */
function initSec02ReflowOrder() {
  const board = document.getElementById("reflow-board");
  const tracks = document.getElementById("reflow-tracks");
  const itemsWrap = document.getElementById("reflow-items");
  const svg = document.getElementById("reflow-svg");
  const readout = document.getElementById("reflow-readout");
  const tierBtns = [...document.querySelectorAll("[data-reflow-tier]")];
  const orderBtn = document.getElementById("btn-order-mess");
  const blocks = [...itemsWrap.querySelectorAll(".rf-block")];

  let tier = "desktop";
  let messed = false;

  const TIER_SPEC = {
    desktop: { trackCols: 12, itemCols: 4, span: 3, label: "桌面 12 列（每块跨 3 列）" },
    tablet: { trackCols: 8, itemCols: 2, span: 4, label: "平板 8 列（每块跨 4 列，形成 2×2）" },
    mobile: { trackCols: 4, itemCols: 1, span: 4, label: "手机 4 列（每块满跨 4 列，单列顺排）" },
  };

  function drawPaths() {
    const br = board.getBoundingClientRect();
    if (br.width < 20) return;
    const pts = blocks.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.right - br.left - 24,
        y: r.top - br.top + 24,
        dom: el.dataset.dom,
      };
    });

    const stroke = messed ? "#C0261D" : "#0F6B43";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }

    const circles = pts
      .map(
        (p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="11" fill="${stroke}" stroke="#FFFFFF" stroke-width="2"/>
      <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="DM Mono, monospace" font-weight="600">${i + 1}</text>`
      )
      .join("");

    svg.setAttribute("viewBox", `0 0 ${br.width} ${br.height}`);
    svg.innerHTML = `
      <path d="${d}" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-dasharray="${messed ? "6 4" : "none"}" stroke-linecap="round" stroke-linejoin="round"/>
      ${circles}
    `;
  }

  function render() {
    const spec = TIER_SPEC[tier];
    tracks.style.gridTemplateColumns = `repeat(${spec.trackCols}, minmax(0, 1fr))`;
    tracks.innerHTML = Array.from({ length: spec.trackCols }, () => "<span></span>").join("");
    itemsWrap.style.gridTemplateColumns = `repeat(${spec.itemCols}, minmax(0, 1fr))`;

    const orders = messed ? [3, 1, 4, 2] : [1, 2, 3, 4];
    blocks.forEach((b, i) => {
      b.style.order = String(orders[i]);
    });

    orderBtn.textContent = `模拟 CSS order 乱调序：${messed ? "开（焦点跳乱）" : "关"}`;
    orderBtn.setAttribute("aria-pressed", String(messed));
    orderBtn.classList.toggle("is-danger", messed);

    readout.textContent = messed
      ? `${spec.label}，但用 CSS order 把视觉位置打乱：键盘 Tab 仍按 DOM 的 1→2→3→4 顺序跳跃，红虚线在块间往返交叉，键盘与读屏用户极易迷失。`
      : `${spec.label}：视觉轨迹与 DOM 顺序同为 1 → 2 → 3 → 4，绿实线顺畅推进，既重排了几何又保住了阅读逻辑。`;

    requestAnimationFrame(drawPaths);
  }

  tierBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tier = btn.dataset.reflowTier;
      tierBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  orderBtn.addEventListener("click", () => {
    messed = !messed;
    render();
  });

  window.addEventListener("resize", () => requestAnimationFrame(drawPaths));
  render();
}

/* ---------- 03 暗室：@media vs @container 组件搬家台 ---------- */
function initSec03ContainerQuery() {
  const modeBtns = [...document.querySelectorAll("[data-cq-mode]")];
  const slotBtns = [...document.querySelectorAll("[data-cq-slot]")];
  const slotMain = document.getElementById("cq-slot-main");
  const slotSide = document.getElementById("cq-slot-side");
  const hostMain = document.getElementById("cq-host-main");
  const hostSide = document.getElementById("cq-host-side");
  const readout = document.getElementById("cq-readout");
  const codeEl = document.getElementById("cq-code");

  let mode = "media"; // "media" | "container"
  let slot = "main"; // "main" | "side"

  function cardMarkup(cls) {
    return `<div class="cq-demo-card ${cls}">
      <div class="cq-thumb" aria-hidden="true">
        <svg viewBox="0 0 64 48" width="56" height="42">
          <polygon points="8,42 26,14 40,34 48,24 58,42" fill="#0B0B09"/>
          <circle cx="46" cy="14" r="5" fill="#0B0B09"/>
        </svg>
      </div>
      <div>
        <h4>同一张可复用卡片组件</h4>
        <p>网格组件常被同时放进宽主栏与窄侧边栏，它该听窗口还是听父容器？</p>
        <span class="cq-demo-btn">查看详情 →</span>
      </div>
    </div>`;
  }

  function render() {
    slotMain.classList.toggle("is-occupied", slot === "main");
    slotSide.classList.toggle("is-occupied", slot === "side");

    let cls = "is-row";
    if (slot === "side") {
      cls = mode === "container" ? "is-col" : "is-squished";
    }

    if (slot === "main") {
      hostMain.innerHTML = cardMarkup(cls);
      hostSide.innerHTML = `<p class="cq-empty-hint">点上方「搬进窄侧栏（260px）」把卡片挪过来验伤</p>`;
    } else {
      hostMain.innerHTML = `<p class="cq-empty-hint">宽主栏当前空置，点「放进宽主栏（680px）」搬回</p>`;
      hostSide.innerHTML = cardMarkup(cls);
    }

    if (slot === "main") {
      readout.textContent = "在 680px 宽主栏里，两种方式都呈现左右横排，还看不出差别；把这张卡片搬进 260px 窄侧栏，差异立刻显现。";
    } else if (mode === "media") {
      readout.textContent = "翻车了：浏览器整个窗口依然是 1440px 宽，@media 误以为空间充裕，强行在 260px 窄侧栏里维持左右横排，图文立刻被挤成碎条！";
    } else {
      readout.textContent = "稳稳过关：@container 直接量出父槽实宽仅 260px（低于 400px 阈值），哪怕整屏 1440px，卡片也自动切为上下堆叠，彻底告别组件挤烂。";
    }

    codeEl.textContent =
      mode === "media"
        ? `/* 只看整屏宽度：无视 260px 侧栏 */\n@media (min-width: 768px) {\n  .card { grid-template-columns: 120px 1fr; }\n}`
        : `/* 2023 Baseline 容器查询：看父容器实宽 */\n.slot { container-type: inline-size; }\n@container (min-width: 400px) {\n  .card { grid-template-columns: 120px 1fr; }\n}`;
  }

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.cqMode;
      modeBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      render();
    });
  });

  slotBtns.forEach((b) => {
    b.addEventListener("click", () => {
      slot = b.dataset.cqSlot;
      slotBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      render();
    });
  });

  render();
}

/* ---------- 04 小屏不该丢掉主角（移动优先四模块排序） ---------- */
function initSec04HierarchyOrder() {
  const listEl = document.getElementById("hier-list");
  const prevEl = document.getElementById("hier-preview");
  const readout = document.getElementById("hier-readout");

  const items = [
    { id: "hero", label: "主标题与行动入口", desc: "讲清这是什么、下一步点哪", cls: "is-hero" },
    { id: "visual", label: "核心主视觉图", desc: "一眼建立主题识别度", cls: "is-visual" },
    { id: "cards", label: "四项核心特性卡片", desc: "补充结构化卖点说明", cls: "is-cards" },
    { id: "foot", label: "辅助说明与页脚", desc: "版权与延伸链接", cls: "is-foot" },
  ];

  function move(idx, dir) {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    [items[idx], items[next]] = [items[next], items[idx]];
    render();
  }

  function render() {
    listEl.innerHTML = items
      .map(
        (it, i) => `
      <div class="hier-row">
        <span class="hier-rank">${i + 1}</span>
        <div class="hier-info">
          <strong>${it.label}</strong>
          <small>${it.desc}</small>
        </div>
        <div class="hier-arrows">
          <button type="button" data-hier-move="${i}:-1" aria-label="上移${it.label}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-hier-move="${i}:1" aria-label="下移${it.label}" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>`
      )
      .join("");

    listEl.querySelectorAll("[data-hier-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [idx, dir] = btn.dataset.hierMove.split(":").map(Number);
        move(idx, dir);
      });
    });

    const mobileChips = items
      .map((it, i) => {
        const fold = i === 2 ? `<div class="hp-fold">▲ 375px 首屏折线（以下需滚屏）</div>` : "";
        return `${fold}<div class="hp-chip ${it.cls}"><span>${i + 1}. ${it.label}</span><span>${i < 2 ? "首屏可见" : "二屏"}</span></div>`;
      })
      .join("");

    const desktopChips = items
      .map((it, i) => `<div class="hp-chip ${it.cls}"><span>${i + 1}. ${it.label}</span><span>${i < 3 ? "宽屏同见" : "页底"}</span></div>`)
      .join("");

    prevEl.innerHTML = `
      <div class="hp-device">
        <div class="hp-head"><span>移动端 375px</span><span>单列优先序</span></div>
        <div class="hp-stack">${mobileChips}</div>
      </div>
      <div class="hp-device">
        <div class="hp-head"><span>桌面端 1280px</span><span>同源展开</span></div>
        <div class="hp-stack">${desktopChips}</div>
      </div>
    `;

    const heroPos = items.findIndex((it) => it.id === "hero");
    const visualPos = items.findIndex((it) => it.id === "visual");
    if (heroPos <= 1 && visualPos <= 1) {
      readout.textContent = "层级清晰：主标题入口与核心主图稳占手机 375px 首屏折线以上，展开到桌面 1280px 后同样一眼直达主题。";
    } else if (heroPos >= 2) {
      readout.textContent = `层级失守：主标题与行动入口掉到了第 ${heroPos + 1} 位，手机端已被挤到首屏折线以下，读者打开页面看不到主题。`;
    } else {
      readout.textContent = `主标题仍在首屏，但核心主视觉被压到第 ${visualPos + 1} 位，弱化了小屏第一眼的图形识别。`;
    }
  }

  render();
}

/* ---------- 05 历史演进时间线（严格基于已核实史实） ---------- */
function initSec05Timeline() {
  const NODES = [
    {
      year: "2000",
      short: "网页之道",
      date: "2000 年 4 月 7 日",
      title: "John Allsopp 发表《A Dao of Web Design》",
      body: "早在智能手机普及之前，John Allsopp 就在 A List Apart 撰文指出：网页不是纸张，设计师若死守印刷式的绝对像素控制，就会与媒介本性对抗；真正顺应网页的做法是把适应权交还给用户的屏幕与字号设置。",
      source: "出处：John Allsopp, A Dao of Web Design, A List Apart (2000-04-07)",
      svg: `<svg viewBox="0 0 240 120" width="100%"><rect x="14" y="18" width="90" height="84" fill="#FFFFFF" stroke="#0B0B09" stroke-width="2"/><line x1="26" y1="36" x2="92" y2="36" stroke="#0B0B09" stroke-width="3"/><line x1="26" y1="52" x2="86" y2="52" stroke="#767162" stroke-width="2"/><text x="59" y="92" text-anchor="middle" font-size="10" font-family="DM Mono">960px 锁死</text><path d="M112 60h18M125 55l5 5-5 5" fill="none" stroke="#0B0B09" stroke-width="2"/><rect x="138" y="18" width="88" height="84" rx="6" fill="#FCC300" stroke="#0B0B09" stroke-width="2" stroke-dasharray="5 3"/><text x="182" y="64" text-anchor="middle" font-size="11" font-weight="700">顺应视口</text></svg>`,
    },
    {
      year: "2010",
      short: "正式命名",
      date: "2010 年 5 月 25 日",
      title: "Ethan Marcotte 提出「响应式网页设计」",
      body: "Ethan Marcotte 在 A List Apart 第 306 期发表《Responsive Web Design》，正式把「流体网格、弹性图片、CSS 媒体查询」三项已有技术融为一套方法论，并在 2011 年由 A Book Apart 推出同名专著，让跨屏网格走出为手机另建 m 站的旧时代。",
      source: "出处：Ethan Marcotte, Responsive Web Design, A List Apart #306 (2010-05-25) / A Book Apart (2011)",
      svg: `<svg viewBox="0 0 240 120" width="100%"><rect x="12" y="24" width="66" height="72" rx="4" fill="#FCC300" stroke="#0B0B09" stroke-width="2"/><text x="45" y="64" text-anchor="middle" font-size="10" font-weight="700">流体网格</text><rect x="87" y="24" width="66" height="72" rx="4" fill="#FFFFFF" stroke="#0B0B09" stroke-width="2"/><text x="120" y="64" text-anchor="middle" font-size="10" font-weight="700">弹性媒体</text><rect x="162" y="24" width="66" height="72" rx="4" fill="#0B0B09"/><text x="195" y="64" text-anchor="middle" font-size="10" font-weight="700" fill="#FCC300">@media</text></svg>`,
    },
    {
      year: "2011",
      short: "移动优先",
      date: "2011 年 10 月",
      title: "Luke Wroblewski 出版《Mobile First》",
      body: "A Book Apart 出版了 Luke Wroblewski 的《Mobile First》，推动设计团队反过来先为小屏厘清信息主次，再用渐进增强向平板与桌面展开网格——这正是本页原海报底部「以内容优先 → 建立网格 → 设定断点」的思想根基。",
      source: "出处：Luke Wroblewski, Mobile First, A Book Apart (2011-10)",
      svg: `<svg viewBox="0 0 240 120" width="100%"><rect x="20" y="34" width="32" height="64" rx="4" fill="#FCC300" stroke="#0B0B09" stroke-width="2"/><path d="M58 66h14M68 62l4 4-4 4" fill="none" stroke="#0B0B09" stroke-width="2"/><rect x="78" y="24" width="54" height="74" rx="4" fill="#FFFFFF" stroke="#0B0B09" stroke-width="2"/><path d="M138 66h14M148 62l4 4-4 4" fill="none" stroke="#0B0B09" stroke-width="2"/><rect x="158" y="16" width="66" height="82" rx="4" fill="#0B0B09"/><rect x="166" y="26" width="50" height="22" fill="#FCC300"/></svg>`,
    },
    {
      year: "2012",
      short: "媒体查询",
      date: "2012 年 6 月 19 日",
      title: "W3C《Media Queries》成为正式推荐标准",
      body: "W3C 正式发布 Media Queries（Level 3）推荐标准，将 min-width、max-width、orientation 等视口特征条件写入通用规范，断点切换由此成为全行业稳定可靠的底层基石。",
      source: "出处：W3C Recommendation, Media Queries (2012-06-19)",
      svg: `<svg viewBox="0 0 240 120" width="100%"><line x1="16" y1="60" x2="224" y2="60" stroke="#0B0B09" stroke-width="2.5"/><circle cx="72" cy="60" r="8" fill="#FCC300" stroke="#0B0B09" stroke-width="2"/><circle cx="164" cy="60" r="8" fill="#0B0B09"/><text x="72" y="38" text-anchor="middle" font-size="10" font-family="DM Mono">768px</text><text x="164" y="38" text-anchor="middle" font-size="10" font-family="DM Mono">1280px</text><text x="120" y="96" text-anchor="middle" font-size="10" font-family="DM Mono">@media (min-width)</text></svg>`,
    },
    {
      year: "2017",
      short: "原生网格",
      date: "2017 年 3 月",
      title: "CSS Grid Level 1 在主流浏览器同步落地",
      body: "W3C 于 2017 年 2 月 9 日将 CSS Grid Layout Module Level 1 推进至候选推荐标准；紧接着 3 月内，Firefox 52、Chrome 57、Safari 10.1 罕见地同步默认开启原生支持，fr 单位与 minmax() 让二维响应式网格告别浮动拼凑。",
      source: "出处：W3C CSS Grid Layout Module Level 1 (CR 2017-02-09; 2017-03 跨浏览器发布)",
      svg: `<svg viewBox="0 0 240 120" width="100%"><rect x="18" y="16" width="60" height="40" fill="#FCC300" stroke="#0B0B09" stroke-width="2"/><rect x="86" y="16" width="136" height="40" fill="#FFFFFF" stroke="#0B0B09" stroke-width="2"/><rect x="18" y="64" width="60" height="40" fill="#0B0B09"/><rect x="86" y="64" width="64" height="40" fill="#FFFFFF" stroke="#0B0B09" stroke-width="2"/><rect x="158" y="64" width="64" height="40" fill="#FCC300" stroke="#0B0B09" stroke-width="2"/></svg>`,
    },
    {
      year: "2018–23",
      short: "无障碍与容器",
      date: "2018-06-05 / 2023",
      title: "WCAG 1.4.10 重排准则与 @container 容器查询",
      body: "2018 年 6 月 5 日发布的 WCAG 2.1 正式推荐标准在 1.4.10 Reflow 中明确：除二维强依赖内容外，在 320 CSS 像素宽（等同 1280px 放大 400%）下不应出现双向滚动；2023 年 CSS 容器查询 @container 达成跨浏览器 Baseline，把响应能力下放到每个独立组件。",
      source: "出处：W3C WCAG 2.1 SC 1.4.10 (2018-06-05) / CSS Containment Level 3 (Baseline 2023)",
      svg: `<svg viewBox="0 0 240 120" width="100%"><rect x="18" y="16" width="204" height="88" rx="6" fill="#FFFFFF" stroke="#0B0B09" stroke-width="2"/><rect x="28" y="28" width="118" height="64" rx="4" fill="#FCC300" stroke="#0B0B09" stroke-width="1.5"/><rect x="154" y="28" width="58" height="64" rx="4" fill="#0B0B09"/><text x="87" y="64" text-anchor="middle" font-size="10" font-weight="700">@container 宽</text><text x="183" y="64" text-anchor="middle" font-size="10" font-weight="700" fill="#FCC300">窄</text></svg>`,
    },
  ];

  const tabsEl = document.getElementById("tl-tabs");
  const dateEl = document.getElementById("tl-date");
  const titleEl = document.getElementById("tl-title");
  const bodyEl = document.getElementById("tl-body");
  const sourceEl = document.getElementById("tl-source");
  const diagEl = document.getElementById("tl-diagram");

  let active = 1; // 默认落在 2010 命名里程碑

  function render() {
    tabsEl.innerHTML = NODES.map(
      (n, i) => `
      <button type="button" class="tl-tab ${i === active ? "is-active" : ""}" role="tab" aria-selected="${i === active}" data-tl="${i}">
        <span>${n.year}</span>
        <small>${n.short}</small>
      </button>`
    ).join("");

    tabsEl.querySelectorAll("[data-tl]").forEach((btn) => {
      btn.addEventListener("click", () => {
        active = Number(btn.dataset.tl);
        render();
      });
    });

    const cur = NODES[active];
    dateEl.textContent = cur.date;
    titleEl.textContent = cur.title;
    bodyEl.textContent = cur.body;
    sourceEl.textContent = cur.source;
    diagEl.innerHTML = cur.svg;
  }

  render();
}

/* ---------- 06 什么时候别硬套响应式（分诊翻牌） ---------- */
function initSec06Triage() {
  const CASES = [
    {
      title: "跨端专题与新闻文档站",
      desc: "同一批长文、配图与推荐列表每天在电脑、平板和手机上被反复阅读。",
      fit: true,
      verdict: "强烈适用响应式网格",
      detail: "内容以线性阅读和列表浏览为主，桌面展开多列、手机收回单列能最大化可读性并满足无障碍重排。",
    },
    {
      title: "城市地铁全网交互线路图",
      desc: "站点之间的东南西北拓扑与换乘交叉必须保持二维空间相对位置。",
      fit: false,
      verdict: "别硬套列数重排",
      detail: "强行把线路拆成单列会彻底破坏地理方位感。WCAG 1.4.10 也明确将地图与图表列为例外，改用平移缩放画布加独立站点搜索更合理。",
    },
    {
      title: "实体印刷展板与杂志折页",
      desc: "裁切尺寸、出血与装订中缝已由纸厂和印机物理锁死，绝不会动态拉伸。",
      fit: false,
      verdict: "不适用响应式，改用固定网格",
      detail: "既然幅面固定不变，直接用 207 固定网格或 196 模块化网格把字号、行距与页边距锁到毫米级精度才最扎实。",
    },
    {
      title: "多列金融行情对比总表",
      desc: "十余项指标需要横向并排对照同一行标的数据，拆行后失去同行比对意义。",
      fit: false,
      verdict: "切忌把表格硬拆成碎卡",
      detail: "应保留二维行列关系：给表格容器单独开启局部横向滚动并冻结首列标的名称，其余页面外框继续使用响应式网格。",
    },
  ];

  const grid = document.getElementById("triage-grid");
  const opened = new Set([0, 1]); // 默认展开一正一反，同排齐平零空洞同时保留后两项探索

  function render() {
    grid.innerHTML = CASES.map(
      (c, i) => `
      <article class="triage-card">
        <div class="triage-top">
          <h3>${c.title}</h3>
          <button type="button" class="triage-toggle" data-triage="${i}" aria-expanded="${opened.has(i)}">${opened.has(i) ? "收起判定" : "看判定"}</button>
        </div>
        <p class="triage-desc">${c.desc}</p>
        ${
          opened.has(i)
            ? `<div class="triage-verdict ${c.fit ? "is-yes" : "is-no"}"><strong>${c.verdict}</strong>${c.detail}</div>`
            : ""
        }
      </article>`
    ).join("");

    grid.querySelectorAll("[data-triage]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.triage);
        if (opened.has(idx)) opened.delete(idx);
        else opened.add(idx);
        render();
      });
    });
  }

  render();
}

/* ---------- 07 四选一小练习（中性标签，只差断点重排策略一个变量） ---------- */
function initSec07Quiz() {
  const OPTIONS = [
    {
      id: "A",
      name: "方案 A",
      spec: "1200px 固定 4 列",
      summary: "桌面、平板与手机共用同一套 1200px 宽四列容器，小屏依靠横向滑动浏览完整版面。",
      correct: false,
      reason: "方案 A 错在没有响应重排：768px 平板与 375px 手机都会向右严重溢出，读者每读一行都要来回横向拖动，直接违背 WCAG 2.1 1.4.10 单向滚动要求。",
      svg: quizThumbSvg("fixed"),
    },
    {
      id: "B",
      name: "方案 B",
      spec: "4 列 → 2×2 → 1 列",
      summary: "1280px 采用左文右图加 4 列；768px 切为上图下文加 2×2 网格；375px 收敛为垂直堆叠与单列列表。",
      correct: true,
      reason: "选对了！方案 B 在三端只随可用宽度改变网格列数与头图叠放方向：桌面充分利用横幅，平板双列不拥挤，手机零溢出且主角稳居首屏。",
      svg: quizThumbSvg("sound"),
    },
    {
      id: "C",
      name: "方案 C",
      spec: "4 列 → 4 列 → 2×2",
      summary: "桌面与平板都保留 4 列，375px 手机维持左文右图和 2×2 双列卡片以减少纵向滚屏。",
      correct: false,
      reason: "方案 C 错在断点滞后、窄屏强塞多列：768px 塞 4 列、375px 塞双列并保持左文右图，单卡宽度和正文宽度都会被压碎，字行断得支离破碎。",
      svg: quizThumbSvg("cramped"),
    },
    {
      id: "D",
      name: "方案 D",
      spec: "1 列 → 1 列 → 1 列",
      summary: "从 375px 到 1280px 全部保持单列纵向堆叠，不设列数变化断点。",
      correct: false,
      reason: "方案 D 错在宽屏不展开：虽然手机端不会溢出，但到 1280px 桌面时单行文字被拉得过长，眼睛扫行极易串行，也浪费了宽屏的对比浏览效率。",
      svg: quizThumbSvg("single"),
    },
  ];

  const grid = document.getElementById("quiz-grid");
  const fb = document.getElementById("quiz-feedback");
  let chosen = null;

  function render() {
    grid.innerHTML = OPTIONS.map((op) => {
      let stateCls = "";
      if (chosen === op.id) stateCls = op.correct ? "is-right" : "is-wrong";
      return `
        <button type="button" class="quiz-opt ${stateCls}" data-quiz="${op.id}" aria-pressed="${chosen === op.id}">
          <div class="quiz-opt-head">
            <strong>${op.name}</strong>
            <span>${op.spec}</span>
          </div>
          <div class="quiz-svg-wrap" aria-hidden="true">${op.svg}</div>
          <p>${op.summary}</p>
        </button>`;
    }).join("");

    grid.querySelectorAll("[data-quiz]").forEach((btn) => {
      btn.addEventListener("click", () => {
        chosen = btn.dataset.quiz;
        const op = OPTIONS.find((x) => x.id === chosen);
        fb.textContent = op.reason;
        fb.classList.toggle("is-right", op.correct);
        fb.classList.toggle("is-wrong", !op.correct);
        render();
      });
    });
  }

  render();
}

function quizThumbSvg(kind) {
  // 三台同等比例的精致小设备 SVG，保证四选项外观精致度一致，仅布局规则不同
  const dCards =
    kind === "single"
      ? `<rect x="16" y="48" width="96" height="8" rx="1.5" fill="#D5D2C8"/><rect x="16" y="60" width="96" height="8" rx="1.5" fill="#D5D2C8"/>`
      : `<rect x="16" y="48" width="21" height="22" rx="1.5" fill="#D5D2C8"/><rect x="41" y="48" width="21" height="22" rx="1.5" fill="#D5D2C8"/><rect x="66" y="48" width="21" height="22" rx="1.5" fill="#D5D2C8"/><rect x="91" y="48" width="21" height="22" rx="1.5" fill="#D5D2C8"/>`;

  const dHero =
    kind === "single"
      ? `<rect x="16" y="18" width="96" height="10" rx="1.5" fill="#0B0B09"/><rect x="16" y="31" width="96" height="13" rx="1.5" fill="#FCC300"/>`
      : `<rect x="16" y="20" width="44" height="20" rx="1.5" fill="#0B0B09"/><rect x="66" y="18" width="46" height="24" rx="1.5" fill="#FCC300"/>`;

  let tBody = "";
  if (kind === "fixed") {
    tBody = `<rect x="142" y="18" width="66" height="22" fill="#FCC300"/><rect x="142" y="46" width="68" height="24" fill="#D5D2C8"/><line x1="196" y1="14" x2="196" y2="74" stroke="#9B968A" stroke-width="1.5" stroke-dasharray="3 2"/>`;
  } else if (kind === "sound") {
    tBody = `<rect x="142" y="18" width="48" height="20" rx="1.5" fill="#FCC300"/><rect x="142" y="43" width="22" height="12" rx="1.5" fill="#D5D2C8"/><rect x="168" y="43" width="22" height="12" rx="1.5" fill="#D5D2C8"/><rect x="142" y="58" width="22" height="12" rx="1.5" fill="#D5D2C8"/><rect x="168" y="58" width="22" height="12" rx="1.5" fill="#D5D2C8"/>`;
  } else if (kind === "cramped") {
    tBody = `<rect x="142" y="18" width="22" height="20" rx="1" fill="#0B0B09"/><rect x="167" y="18" width="23" height="20" rx="1" fill="#FCC300"/><rect x="142" y="46" width="10" height="24" fill="#D5D2C8"/><rect x="155" y="46" width="10" height="24" fill="#D5D2C8"/><rect x="168" y="46" width="10" height="24" fill="#D5D2C8"/><rect x="181" y="46" width="9" height="24" fill="#D5D2C8"/>`;
  } else {
    tBody = `<rect x="142" y="18" width="48" height="18" rx="1.5" fill="#FCC300"/><rect x="142" y="42" width="48" height="10" rx="1.5" fill="#D5D2C8"/><rect x="142" y="56" width="48" height="10" rx="1.5" fill="#D5D2C8"/>`;
  }

  let mBody = "";
  if (kind === "fixed") {
    mBody = `<rect x="220" y="18" width="52" height="22" fill="#FCC300"/><rect x="220" y="46" width="52" height="22" fill="#D5D2C8"/><line x1="252" y1="14" x2="252" y2="74" stroke="#9B968A" stroke-width="1.5" stroke-dasharray="3 2"/>`;
  } else if (kind === "sound" || kind === "single") {
    mBody = `<rect x="220" y="18" width="28" height="16" rx="1.5" fill="#FCC300"/><rect x="220" y="38" width="28" height="7" rx="1" fill="#D5D2C8"/><rect x="220" y="48" width="28" height="7" rx="1" fill="#D5D2C8"/><rect x="220" y="58" width="28" height="7" rx="1" fill="#D5D2C8"/>`;
  } else {
    mBody = `<rect x="220" y="18" width="12" height="18" rx="1" fill="#0B0B09"/><rect x="235" y="18" width="13" height="18" rx="1" fill="#FCC300"/><rect x="220" y="42" width="12" height="11" fill="#D5D2C8"/><rect x="236" y="42" width="12" height="11" fill="#D5D2C8"/><rect x="220" y="56" width="12" height="11" fill="#D5D2C8"/><rect x="236" y="56" width="12" height="11" fill="#D5D2C8"/>`;
  }

  return `<svg viewBox="0 0 280 86" width="100%">
    <rect x="8" y="10" width="112" height="68" rx="4" fill="#FFFFFF" stroke="#585449" stroke-width="1.5"/>
    ${dHero}${dCards}
    <rect x="134" y="10" width="64" height="68" rx="4" fill="#FFFFFF" stroke="#585449" stroke-width="1.5"/>
    ${tBody}
    <rect x="214" y="10" width="40" height="68" rx="4" fill="#FFFFFF" stroke="#585449" stroke-width="1.5"/>
    ${mBody}
  </svg>`;
}

/* ---------- 08 原海报高清灯箱（可缩放、拖动平移、Esc 关闭，只复用 #poster 的 src） ---------- */
function initSec08Lightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const vp = document.getElementById("lb-viewport");
  const pctEl = document.getElementById("lb-pct");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    pctEl.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  vp.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    scale = Math.max(0.6, Math.min(3.2, +(scale + (ev.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  vp.addEventListener("pointerdown", (ev) => {
    pan = { sx: ev.clientX, sy: ev.clientY, ox: tx, oy: ty, id: ev.pointerId };
    vp.setPointerCapture?.(ev.pointerId);
  });
  vp.addEventListener("pointermove", (ev) => {
    if (!pan) return;
    tx = pan.ox + (ev.clientX - pan.sx);
    ty = pan.oy + (ev.clientY - pan.sy);
    applyTransform();
  });
  vp.addEventListener("pointerup", () => { pan = null; });
  vp.addEventListener("pointercancel", () => { pan = null; });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !box.hidden) close();
  });
}
