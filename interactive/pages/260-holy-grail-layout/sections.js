// 260 圣杯布局 — 正文 01–07 七大节专属互动组件
// 每节使用不同的交互范式，不与开场或相邻小节重复。

const ERAS = [
  {
    id: "2001",
    year: "2001",
    tag: "早期纯 CSS 破局",
    who: "Rob Chandanais (BlueRobot) & Eric Costello (Glish.com)",
    lines: "约 45 行 CSS + 浏览器补丁",
    constraints: [
      { label: "中央流式 + 两侧定宽", ok: true },
      { label: "HTML 主内容源码优先", ok: false },
      { label: "三列天然等高", ok: false },
      { label: "短文页脚不遮挡不悬空", ok: false },
    ],
    fragile: "绝对定位侧栏脱离文档流：一旦左右侧栏比中间正文更高，页脚就会直接撞进侧栏底部。",
    summary: "2001 年 BlueRobot 与 Glish.com 率先甩掉 HTML <table> 与 JS 定位，Eric Costello 将这套极难纯 CSS 完美实现的三栏夹心架构命名为「The Holy Grail（圣杯）」。",
    code: `.left  { position: absolute; left: 0; top: 80px; width: 200px; }
.right { position: absolute; right: 0; top: 80px; width: 200px; }
.main  { margin: 0 210px; }
/* 致命脆点：侧栏高于主区时，footer 会被压穿 */`,
    svgMode: "absolute",
  },
  {
    id: "2006",
    year: "2006",
    tag: "负边距圣杯经典配方",
    who: "Matthew Levine · A List Apart 第 211 期（2006-01-30）",
    lines: "约 38 行 CSS + 负边距拉回",
    constraints: [
      { label: "中央流式 + 两侧定宽", ok: true },
      { label: "HTML 主内容源码优先", ok: true },
      { label: "三列等高（需伪等高技巧）", ok: true },
      { label: "任意缩窄不乱行", ok: false },
    ],
    fragile: "依赖容器内边距与 -100% 负边距精准抵消；一旦主栏宽小于左侧栏，整个三栏会突然换行崩溃，等高还常需配合 Dan Cederholm（2004）的 Faux Columns 假列背景。",
    summary: "Matthew Levine 借鉴 Alex Robinson 的思路，把 <main> 放进源码首位，用 float + margin-left: -100% + position: relative 硬生生把左栏拉回左侧，奠定「圣杯布局」经典名号。",
    code: `.container { padding-left: 200px; padding-right: 220px; }
.main  { float: left; width: 100%; }
.left  { float: left; width: 200px; margin-left: -100%; right: 200px; position: relative; }
.right { float: left; width: 220px; margin-right: -220px; }`,
    svgMode: "negmargin",
  },
  {
    id: "2013",
    year: "2013",
    tag: "Flexbox 告别负边距",
    who: "Philip Walton · Solved by Flexbox（2013）",
    lines: "约 16 行 CSS · 一维双层嵌套",
    constraints: [
      { label: "中央流式 + 两侧定宽", ok: true },
      { label: "HTML 主内容源码优先", ok: true },
      { label: "三列天然等高", ok: true },
      { label: "短文粘底页脚", ok: true },
    ],
    fragile: "仍需外层纵轴 Flex + 中层横轴 Flex 两层容器配合；用 order: -1 调整视觉次序时，要留意键盘 Tab 焦点仍按 DOM 顺序移动。",
    summary: "2013 年 Philip Walton 在 Solved by Flexbox 中示范：外层 flex-direction: column 配合 min-height: 100vh 锁住页脚，中层 flex: 1 让三列天生等高，彻底终结负边距黑魔法。",
    code: `.page { display: flex; flex-direction: column; min-height: 100vh; }
.body { display: flex; flex: 1; }
.main { flex: 1; }
.left { flex: 0 0 216px; order: -1; }
.right{ flex: 0 0 228px; }`,
    svgMode: "flexbox",
  },
  {
    id: "2017",
    year: "2017",
    tag: "CSS Grid 终结圣杯之谜",
    who: "W3C CSS Grid Layout Level 1（2011 草案 / 2017 候选推荐普及）",
    lines: "8 行声明 · 单容器二维矩阵",
    constraints: [
      { label: "中央流式 + 两侧定宽", ok: true },
      { label: "HTML 主内容源码优先", ok: true },
      { label: "三列天然等高 + 粘底页脚", ok: true },
      { label: "断点重排无需改 HTML", ok: true },
    ],
    fragile: "几乎零结构脆点；唯一需要注意的是给中栏写 minmax(0, 1fr) 而非纯 1fr，避免超长无空格代码块把中栏撑破视口。",
    summary: "CSS Grid 用 grid-template-areas 直接把页面画成三行三列文字蓝图；从桌面到平板与手机，只需在媒体查询里重写几行区域名即可丝滑折翼。",
    code: `.grail {
  display: grid; min-height: 100vh;
  grid-template: auto 1fr auto / 216px minmax(0, 1fr) 228px;
  grid-template-areas:
    "head head head"
    "nav  main aside"
    "foot foot foot";
}`,
    svgMode: "grid",
  },
];

function renderEraSvg(mode) {
  if (mode === "absolute") {
    return `<svg viewBox="0 0 360 220" class="era-svg" role="img" aria-label="2001 绝对定位压穿示意图">
      <rect x="12" y="10" width="336" height="30" rx="5" fill="#4B2A4E"/>
      <text x="180" y="29" text-anchor="middle" fill="#FAF4F6" font-size="11" font-weight="700">HEADER（满宽）</text>
      <rect x="96" y="48" width="168" height="82" rx="4" fill="#FBF4E8" stroke="#C8B4C4"/>
      <text x="180" y="92" text-anchor="middle" fill="#171019" font-size="11" font-weight="700">MAIN（短正文）</text>
      <rect x="12" y="138" width="336" height="28" rx="5" fill="#4E2A4F"/>
      <text x="180" y="156" text-anchor="middle" fill="#FAF4F6" font-size="10.5" font-weight="700">FOOTER（随主区上提）</text>
      <rect x="12" y="48" width="76" height="148" rx="4" fill="#E8DAE6" fill-opacity="0.92" stroke="#B52B3A" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text x="50" y="102" text-anchor="middle" fill="#4B2A4E" font-size="10" font-weight="700">LEFT</text>
      <text x="50" y="116" text-anchor="middle" fill="#B52B3A" font-size="9">absolute</text>
      <rect x="272" y="48" width="76" height="114" rx="4" fill="#DFCFDB" fill-opacity="0.9" stroke="#9372A2"/>
      <text x="310" y="102" text-anchor="middle" fill="#4B2A4E" font-size="10" font-weight="700">RIGHT</text>
      <rect x="12" y="138" width="76" height="28" fill="rgba(181,43,58,0.28)" stroke="#B52B3A" stroke-width="1.5"/>
      <text x="180" y="206" text-anchor="middle" fill="#B52B3A" font-size="11" font-weight="700">× 绝对定位长侧栏直接撞穿页脚</text>
    </svg>`;
  }
  if (mode === "negmargin") {
    return `<svg viewBox="0 0 360 220" class="era-svg" role="img" aria-label="2006 负边距拉回机制示意图">
      <rect x="12" y="10" width="336" height="28" rx="5" fill="#4B2A4E"/>
      <text x="180" y="28" text-anchor="middle" fill="#FAF4F6" font-size="11" font-weight="700">HEADER</text>
      <rect x="12" y="46" width="336" height="114" rx="5" fill="none" stroke="#9372A2" stroke-dasharray="4 3"/>
      <rect x="92" y="54" width="176" height="98" rx="4" fill="#FBF4E8" stroke="#4B2A4E" stroke-width="1.4"/>
      <text x="180" y="96" text-anchor="middle" fill="#171019" font-size="11" font-weight="700">① MAIN（源码第 1 · width 100%）</text>
      <rect x="18" y="54" width="68" height="98" rx="4" fill="#E8DAE6" stroke="#562A59" stroke-width="1.4"/>
      <text x="52" y="98" text-anchor="middle" fill="#4B2A4E" font-size="10" font-weight="700">② LEFT</text>
      <rect x="274" y="54" width="68" height="98" rx="4" fill="#DFCFDB" stroke="#562A59" stroke-width="1.4"/>
      <text x="308" y="98" text-anchor="middle" fill="#4B2A4E" font-size="10" font-weight="700">③ RIGHT</text>
      <path d="M 264 70 C 200 44, 118 44, 58 68" fill="none" stroke="#B52B3A" stroke-width="2" stroke-dasharray="4 3"/>
      <polygon points="54,70 64,63 63,74" fill="#B52B3A"/>
      <text x="160" y="45" text-anchor="middle" fill="#B52B3A" font-size="9.5" font-weight="700">margin-left: -100% 强行拉回左槽</text>
      <rect x="12" y="168" width="336" height="26" rx="5" fill="#4E2A4F"/>
      <text x="180" y="185" text-anchor="middle" fill="#FAF4F6" font-size="10.5" font-weight="700">FOOTER（clear: both）</text>
      <text x="180" y="210" text-anchor="middle" fill="#562A59" font-size="10.5" font-weight="700">源码保主区优先，但窗口过窄时负边距会折断崩溃</text>
    </svg>`;
  }
  if (mode === "flexbox") {
    return `<svg viewBox="0 0 360 220" class="era-svg" role="img" aria-label="2013 Flexbox 双层弹性盒示意图">
      <rect x="12" y="10" width="336" height="184" rx="8" fill="#FAF2E9" stroke="#562A59" stroke-width="1.5"/>
      <rect x="20" y="18" width="320" height="26" rx="4" fill="#4B2A4E"/>
      <text x="180" y="35" text-anchor="middle" fill="#FAF4F6" font-size="10.5" font-weight="700">HEADER（外层 column flex）</text>
      <rect x="20" y="50" width="320" height="106" rx="5" fill="rgba(147,114,162,0.1)" stroke="#9372A2" stroke-dasharray="4 3"/>
      <rect x="26" y="58" width="68" height="90" rx="4" fill="#E8DAE6"/>
      <text x="60" y="98" text-anchor="middle" fill="#4B2A4E" font-size="10" font-weight="700">LEFT</text>
      <text x="60" y="114" text-anchor="middle" fill="#562A59" font-size="9">order: -1</text>
      <rect x="102" y="58" width="156" height="90" rx="4" fill="#FBF4E8" stroke="#1D6B52" stroke-width="1.4"/>
      <text x="180" y="98" text-anchor="middle" fill="#171019" font-size="11" font-weight="700">MAIN · flex: 1</text>
      <text x="180" y="114" text-anchor="middle" fill="#1D6B52" font-size="9.5">三列天生等高对齐</text>
      <rect x="266" y="58" width="68" height="90" rx="4" fill="#DFCFDB"/>
      <text x="300" y="98" text-anchor="middle" fill="#4B2A4E" font-size="10" font-weight="700">RIGHT</text>
      <text x="300" y="114" text-anchor="middle" fill="#562A59" font-size="9">0 0 228px</text>
      <rect x="20" y="162" width="320" height="24" rx="4" fill="#4E2A4F"/>
      <text x="180" y="178" text-anchor="middle" fill="#FAF4F6" font-size="10.5" font-weight="700">FOOTER（min-height: 100vh 自动推底）</text>
      <text x="180" y="211" text-anchor="middle" fill="#1D6B52" font-size="10.5" font-weight="700">✓ 告别负边距黑魔法，需要两层嵌套 Flex 容器</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 360 220" class="era-svg" role="img" aria-label="2017 CSS Grid 二维命名矩阵示意图">
    <rect x="12" y="10" width="336" height="184" rx="8" fill="#FAF2E9" stroke="#1D6B52" stroke-width="1.6"/>
    <rect x="20" y="18" width="320" height="28" rx="4" fill="#4B2A4E"/>
    <text x="180" y="36" text-anchor="middle" fill="#FAF4F6" font-size="11" font-weight="700">"head   head   head"</text>
    <rect x="20" y="54" width="76" height="100" rx="4" fill="#E8DAE6" stroke="#562A59" stroke-width="1.2"/>
    <text x="58" y="100" text-anchor="middle" fill="#4B2A4E" font-size="11" font-weight="700">"nav"</text>
    <text x="58" y="116" text-anchor="middle" fill="#59485C" font-size="9.5">216px</text>
    <rect x="104" y="54" width="152" height="100" rx="4" fill="#FBF4E8" stroke="#1D6B52" stroke-width="1.6"/>
    <text x="180" y="98" text-anchor="middle" fill="#171019" font-size="11.5" font-weight="700">"main"</text>
    <text x="180" y="115" text-anchor="middle" fill="#1D6B52" font-size="9.5">minmax(0, 1fr)</text>
    <rect x="264" y="54" width="76" height="100" rx="4" fill="#DFCFDB" stroke="#562A59" stroke-width="1.2"/>
    <text x="302" y="100" text-anchor="middle" fill="#4B2A4E" font-size="11" font-weight="700">"aside"</text>
    <text x="302" y="116" text-anchor="middle" fill="#59485C" font-size="9.5">228px</text>
    <rect x="20" y="162" width="320" height="24" rx="4" fill="#4E2A4F"/>
    <text x="180" y="178" text-anchor="middle" fill="#FAF4F6" font-size="11" font-weight="700">"foot   foot   foot"</text>
    <text x="180" y="211" text-anchor="middle" fill="#1D6B52" font-size="10.5" font-weight="700">✓ 单层二维网格：8 行代码直观落位，断点重排零改 HTML</text>
  </svg>`;
}

export function initSec01EraTimeline() {
  const tabsEl = document.getElementById("era-tabs");
  const panelEl = document.getElementById("era-panel");
  if (!tabsEl || !panelEl) return;

  let active = "2017";

  function render() {
    const era = ERAS.find((e) => e.id === active) || ERAS[3];
    tabsEl.querySelectorAll("button[data-era]").forEach((btn) => {
      const on = btn.dataset.era === active;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });

    panelEl.innerHTML = `
      <div class="era-grid">
        <div class="era-code-col">
          <div class="era-meta">
            <span class="era-pill">${era.year} · ${era.tag}</span>
            <span class="era-lines">${era.lines}</span>
          </div>
          <p class="era-who">${era.who}</p>
          <p class="era-summary">${era.summary}</p>
          <pre class="era-code"><code>${era.code.replace(/</g, "&lt;")}</code></pre>
          <p class="era-fragile"><strong>当年的硬伤：</strong>${era.fragile}</p>
        </div>
        <div class="era-vis-col">
          ${renderEraSvg(era.svgMode)}
          <ul class="era-checklist">
            ${era.constraints
              .map(
                (c) =>
                  `<li class="${c.ok ? "is-ok" : "is-no"}"><span class="chk-mark">${c.ok ? "✓" : "×"}</span>${c.label}</li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
    `;
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-era]");
    if (!btn) return;
    active = btn.dataset.era;
    render();
  });
  render();
}

// ==================== 02 五区职权装配体检盘 ====================
const ROLE_PRESETS = {
  standard: {
    label: "标准五区归位",
    map: { header: "brand", left: "nav", main: "article", right: "toc", footer: "legal" },
  },
  adHijack: {
    label: "反例：重广告抢占左栏",
    map: { header: "brand", left: "promo", main: "article", right: "nav", footer: "legal" },
  },
  navCenter: {
    label: "反例：目录塞进主区",
    map: { header: "brand", left: "toc", main: "nav", right: "article", footer: "legal" },
  },
  topHeavy: {
    label: "反例：版权与大纲堆顶栏",
    map: { header: "toc", left: "legal", main: "article", right: "brand", footer: "nav" },
  },
};

const MODULES = {
  brand: { name: "品牌与搜索", ideal: "header", desc: "身份识别与全局检索" },
  nav: { name: "站内目录导航", ideal: "left", desc: "固定坐标与一级分类" },
  article: { name: "核心正文长篇", ideal: "main", desc: "页面 60%+ 视觉权重" },
  toc: { name: "页内大纲与推荐", ideal: "right", desc: "辅助跳转与延伸内容" },
  legal: { name: "版权与协议链接", ideal: "footer", desc: "低频收尾与信任兜底" },
  promo: { name: "闪烁推广横幅", ideal: "none", desc: "高噪干扰物，不宜常驻左导" },
};

const ZONES_META = [
  { id: "header", label: "头部 HEADER", ideal: "brand" },
  { id: "left", label: "左侧栏 LEFT", ideal: "nav" },
  { id: "main", label: "主内容 MAIN", ideal: "article" },
  { id: "right", label: "右侧栏 RIGHT", ideal: "toc" },
  { id: "footer", label: "底部 FOOTER", ideal: "legal" },
];

export function initSec02RoleAudit() {
  const wrap = document.getElementById("role-audit-app");
  if (!wrap) return;

  let current = { ...ROLE_PRESETS.adHijack.map };
  let pickedZone = null;

  function evaluate(map) {
    let score = 0;
    const notes = [];
    for (const z of ZONES_META) {
      const mId = map[z.id];
      const mod = MODULES[mId];
      if (mId === z.ideal) {
        score++;
      } else if (mId === "promo") {
        notes.push(`${z.label}放了「${mod.name}」：左侧本来是读者找坐标的锚点，塞满闪烁推广会让导航视线在第一秒就跑偏。`);
      } else if (z.id === "main" && mId !== "article") {
        notes.push(`主内容区被「${mod.name}」占走，真正该唱主角的正文被挤到窄侧栏，读者被迫在细条里辛苦换行。`);
      } else {
        notes.push(`${z.label}放了「${mod.name}」，与常见阅读习惯错位，增加每次查找入口的扫视折返。`);
      }
    }
    const hops = 5 - score;
    const load = score === 5 ? "低（顺流直达）" : score >= 3 ? "中（需二次找路）" : "高（视线反复折返）";
    return { score, hops, load, notes };
  }

  function render() {
    const res = evaluate(current);
    const presetBtns = Object.entries(ROLE_PRESETS)
      .map(
        ([k, p]) =>
          `<button type="button" class="chip-btn ${JSON.stringify(p.map) === JSON.stringify(current) ? "is-active" : ""}" data-role-preset="${k}">${p.label}</button>`
      )
      .join("");

    const slotCard = (zId) => {
      const z = ZONES_META.find((x) => x.id === zId);
      const mId = current[zId];
      const mod = MODULES[mId];
      const ok = mId === z.ideal;
      const sel = pickedZone === zId;
      return `
        <button type="button" class="zone-slot zone-slot--${zId} ${ok ? "is-ok" : "is-bad"} ${sel ? "is-picked" : ""}" data-slot="${zId}">
          <span class="zone-slot-k">${z.label}</span>
          <strong class="zone-slot-v">${mod.name}</strong>
          <span class="zone-slot-tag">${sel ? "再点另一区交换" : ok ? "✓ 职权归位" : "× 错位"}</span>
        </button>`;
    };

    wrap.innerHTML = `
      <div class="role-toolbar">
        <div class="chip-row">${presetBtns}</div>
        <p class="role-tip">点任意两个分区即可互换其中的功能模块，测试错位怎样拖慢视线。</p>
      </div>
      <div class="role-stage">
        <div class="role-wireframe">
          ${slotCard("header")}
          <div class="role-middle">
            ${slotCard("left")}
            ${slotCard("main")}
            ${slotCard("right")}
          </div>
          ${slotCard("footer")}
        </div>
        <div class="role-report">
          <div class="role-report-top">
            <span class="status-pill ${res.score === 5 ? "is-ok" : "is-err"}">${res.score}/5 职权归位</span>
            <span class="mono-note">认知负荷（示意）：${res.load}</span>
          </div>
          <h3 class="role-report-title">${
            res.score === 5
              ? "五个分区各安其位，用户凭直觉就能找到入口"
              : `有 ${5 - res.score} 个分区错配，视线需要额外折返 ${res.hops} 次（示意）`
          }</h3>
          <ul class="role-notes">
            ${
              res.notes.length
                ? res.notes.map((n) => `<li>${n}</li>`).join("")
                : "<li>品牌置顶、左导锚定、正文居中占大头、右辅轻承推荐、版权稳压底梁——这正是圣杯布局成为跨站通用语言的原因。</li>"
            }
          </ul>
        </div>
      </div>
    `;
  }

  wrap.addEventListener("click", (e) => {
    const pBtn = e.target.closest("button[data-role-preset]");
    if (pBtn) {
      current = { ...ROLE_PRESETS[pBtn.dataset.rolePreset].map };
      pickedZone = null;
      render();
      return;
    }
    const sBtn = e.target.closest("button[data-slot]");
    if (sBtn) {
      const id = sBtn.dataset.slot;
      if (!pickedZone) {
        pickedZone = id;
      } else if (pickedZone === id) {
        pickedZone = null;
      } else {
        const tmp = current[pickedZone];
        current[pickedZone] = current[id];
        current[id] = tmp;
        pickedZone = null;
      }
      render();
    }
  });

  render();
}

// ==================== 03 深梅紫暗室：断点折翼与源码序对照台 ====================
export function initSec03BreakpointLab() {
  const wrap = document.getElementById("bp-lab");
  if (!wrap) return;

  let width = 820;
  let mainFirst = true;

  function render() {
    const tier =
      width >= 1100
        ? { id: "desktop", name: "宽屏桌面 ≥1100px", desc: "完整五区展开：左导 + 流式主区 + 右侧大纲并肩呈现。" }
        : width >= 768
          ? { id: "tablet", name: "平板区间 768–1099px", desc: "第一级折翼：先卸下右侧辅助栏（沉至文末或收进抽屉），保住左导与主区 70% 宽敞阅读带。" }
          : { id: "mobile", name: "手机竖屏 <768px", desc: "第二级折翼：双翼全数折收为单列流，左导收进顶栏菜单钮，主内容直占首屏全部宽度。" };

    const domList = mainFirst
      ? [
          { tag: "<header>", desc: "品牌 + 跳到正文链接", rank: 1, cls: "is-head" },
          { tag: "<main>", desc: "核心正文最先到达", rank: 2, cls: "is-main" },
          { tag: "<nav>", desc: "左侧目录（视觉排左）", rank: 3, cls: "is-side" },
          { tag: "<aside>", desc: "右侧推荐与大纲", rank: 4, cls: "is-side" },
          { tag: "<footer>", desc: "底部版权与协议", rank: 5, cls: "is-head" },
        ]
      : [
          { tag: "<header>", desc: "品牌 + 顶栏菜单", rank: 1, cls: "is-head" },
          { tag: "<nav>", desc: "18 条左栏链接先读完…", rank: 2, cls: "is-warn" },
          { tag: "<main>", desc: "主正文被迫排在第 3 位", rank: 3, cls: "is-main" },
          { tag: "<aside>", desc: "右侧推荐与大纲", rank: 4, cls: "is-side" },
          { tag: "<footer>", desc: "底部版权与协议", rank: 5, cls: "is-head" },
        ];

    const previewHtml =
      tier.id === "desktop"
        ? `<div class="bp-frame bp-frame--desktop">
             <div class="bp-hdr">HEADER · ${width}px</div>
             <div class="bp-cols bp-cols--3">
               <div class="bp-col bp-nav">左导 216px</div>
               <div class="bp-col bp-main">主内容 1fr<br><span>占宽 ${Math.round(((width - 472) / width) * 100)}%</span></div>
               <div class="bp-col bp-aside">右辅 228px</div>
             </div>
             <div class="bp-ftr">FOOTER（贴底）</div>
           </div>`
        : tier.id === "tablet"
          ? `<div class="bp-frame bp-frame--tablet">
               <div class="bp-hdr">HEADER · ${width}px（自动折右）</div>
               <div class="bp-cols bp-cols--2">
                 <div class="bp-col bp-nav">左导 200px</div>
                 <div class="bp-col bp-main">主内容 1fr<br><span>占宽 ${Math.round(((width - 224) / width) * 100)}%</span></div>
               </div>
               <div class="bp-folded">↓ 原右侧栏自动折入正文下方</div>
               <div class="bp-ftr">FOOTER（贴底）</div>
             </div>`
          : `<div class="bp-frame bp-frame--mobile">
               <div class="bp-hdr">HEADER · 菜单抽屉 · ${width}px</div>
               ${
                 mainFirst
                   ? `<div class="bp-col bp-main bp-mob-main">主内容直占首屏 100%</div>
                      <div class="bp-folded">左导收进顶栏抽屉 · 右辅沉至文末</div>`
                   : `<div class="bp-folded bp-folded--warn">⚠ 左栏未收折时，18 项导航先占满整张手机首屏</div>
                      <div class="bp-col bp-main bp-mob-main">主内容被挤到第二屏</div>`
               }
               <div class="bp-ftr">FOOTER（贴底）</div>
             </div>`;

    const rangeEl = wrap.querySelector("#bp-range");
    const outEl = wrap.querySelector("#bp-out");
    if (rangeEl) rangeEl.value = String(width);

    wrap.querySelectorAll("button[data-bp-w]").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.bpW) === width);
    });
    wrap.querySelectorAll("button[data-bp-order]").forEach((b) => {
      const isM = b.dataset.bpOrder === "main";
      b.classList.toggle("is-active", isM === mainFirst);
      b.setAttribute("aria-pressed", String(isM === mainFirst));
    });

    const valSpan = wrap.querySelector("#bp-width-val");
    if (valSpan) valSpan.textContent = `${width}px`;

    if (outEl) {
      outEl.innerHTML = `
        <div class="bp-out-grid">
          <div class="bp-preview-card">
            <div class="bp-tier-head">
              <strong>${tier.name}</strong>
              <span class="bp-tier-note">${tier.desc}</span>
            </div>
            ${previewHtml}
          </div>
          <div class="bp-dom-card">
            <div class="bp-dom-head">
              <strong>DOM 源码阅读流</strong>
              <span class="bp-dom-badge ${mainFirst ? "is-ok" : "is-warn"}">${mainFirst ? "主内容优先" : "左栏抢先"}</span>
            </div>
            <ol class="bp-dom-list">
              ${domList
                .map(
                  (d) =>
                    `<li class="${d.cls}"><span class="dom-idx">${d.rank}</span><code>${d.tag.replace(/</g, "&lt;")}</code><span>${d.desc}</span></li>`
                )
                .join("")}
            </ol>
            <p class="bp-dom-foot">${
              mainFirst
                ? "屏幕阅读器与键盘用户在跳过顶栏后一步抵达正文；CSS Grid 在宽屏仍能把 &lt;nav&gt; 摆在视觉最左侧。"
                : "读屏器和键盘 Tab 必须先逐项听完所有左侧分类，窄屏默认流下更会把正文顶出首屏。"
            }</p>
          </div>
        </div>
      `;
    }
  }

  wrap.addEventListener("input", (e) => {
    if (e.target.id === "bp-range") {
      width = Number(e.target.value);
      render();
    }
  });
  wrap.addEventListener("click", (e) => {
    const wb = e.target.closest("button[data-bp-w]");
    if (wb) {
      width = Number(wb.dataset.bpW);
      render();
      return;
    }
    const ob = e.target.closest("button[data-bp-order]");
    if (ob) {
      mainFirst = ob.dataset.bpOrder === "main";
      render();
    }
  });

  render();
}

// ==================== 04 同族骨架三问决策器 ====================
export function initSec04DecisionTree() {
  const wrap = document.getElementById("decision-app");
  if (!wrap) return;

  const ans = { nav: true, aside: true, intent: "info" }; // nav: bool, aside: bool, intent: "info" | "visual"

  function decide() {
    if (ans.intent === "visual") {
      return {
        primary: {
          code: "259",
          name: "分屏布局 / 261 页眉—主体—页脚",
          url: "https://layout.xiaoxiaodong.ai/259/play/",
          why: "强视觉或品牌展示页面需要完整画幅来造势，双侧栏会把主图框成小卡片。左右对比选 259 分屏布局，整幅垂展选 261 页眉—主体—页脚。",
          svg: "visual",
        },
        alt: {
          code: "261",
          name: "261 页眉—主体—页脚",
          url: "https://layout.xiaoxiaodong.ai/261/play/",
        },
      };
    }
    if (ans.nav && ans.aside) {
      return {
        primary: {
          code: "260",
          name: "260 圣杯布局（本页主角）",
          url: "https://layout.xiaoxiaodong.ai/260/play/",
          why: "既需要左侧常驻目录定位，又需要右侧页内大纲、推荐或工具辅助，同时中央要承载长篇正文——这正是圣杯布局的绝对主场。",
          svg: "grail",
        },
        alt: {
          code: "268",
          name: "268 辅助窗格布局",
          url: "https://layout.xiaoxiaodong.ai/268/play/",
        },
      };
    }
    if (ans.nav && !ans.aside) {
      return {
        primary: {
          code: "258",
          name: "258 侧边栏页面",
          url: "https://layout.xiaoxiaodong.ai/258/play/",
          why: "只需要一侧常驻导航目录而不需要第三列凑数时，直接用 258 侧边栏页面更清爽，避免右边留出尴尬空栏。",
          svg: "sidebar",
        },
        alt: {
          code: "267",
          name: "267 列表—详情布局",
          url: "https://layout.xiaoxiaodong.ai/267/play/",
        },
      };
    }
    if (!ans.nav && ans.aside) {
      return {
        primary: {
          code: "256",
          name: "256 双列页面 / 268 辅助窗格布局",
          url: "https://layout.xiaoxiaodong.ai/256/play/",
          why: "无全局侧导、只需正文配一栏辅助信息或检查器时，用 256 双列页面或 268 辅助窗格布局即可，不必硬凑三列。",
          svg: "twocol",
        },
        alt: {
          code: "268",
          name: "268 辅助窗格布局",
          url: "https://layout.xiaoxiaodong.ai/268/play/",
        },
      };
    }
    return {
      primary: {
        code: "255",
        name: "255 单列页面",
        url: "https://layout.xiaoxiaodong.ai/255/play/",
        why: "既无需常驻导航也无侧翼补充，直接用 255 单列页面收束行宽、专注阅读，比强行加两根边栏效率高得多。",
        svg: "single",
      },
      alt: {
        code: "262",
        name: "262 顶部导航布局",
        url: "https://layout.xiaoxiaodong.ai/262/play/",
      },
    };
  }

  function miniSvg(kind) {
    if (kind === "grail") {
      return `<svg viewBox="0 0 180 112" class="dec-svg" aria-hidden="true">
        <rect x="6" y="6" width="168" height="16" rx="3" fill="#4B2A4E"/>
        <rect x="6" y="27" width="34" height="58" rx="3" fill="#E8DAE6"/>
        <rect x="45" y="27" width="90" height="58" rx="3" fill="#FBF4E8" stroke="#4B2A4E" stroke-width="1.4"/>
        <rect x="140" y="27" width="34" height="58" rx="3" fill="#DFCFDB"/>
        <rect x="6" y="90" width="168" height="16" rx="3" fill="#4E2A4F"/>
      </svg>`;
    }
    if (kind === "sidebar") {
      return `<svg viewBox="0 0 180 112" class="dec-svg" aria-hidden="true">
        <rect x="6" y="6" width="42" height="100" rx="3" fill="#4B2A4E"/>
        <rect x="54" y="6" width="120" height="100" rx="3" fill="#FBF4E8" stroke="#9372A2"/>
      </svg>`;
    }
    if (kind === "twocol") {
      return `<svg viewBox="0 0 180 112" class="dec-svg" aria-hidden="true">
        <rect x="6" y="6" width="168" height="16" rx="3" fill="#4B2A4E"/>
        <rect x="6" y="27" width="116" height="79" rx="3" fill="#FBF4E8" stroke="#9372A2"/>
        <rect x="128" y="27" width="46" height="79" rx="3" fill="#DFCFDB"/>
      </svg>`;
    }
    if (kind === "visual") {
      return `<svg viewBox="0 0 180 112" class="dec-svg" aria-hidden="true">
        <rect x="6" y="6" width="81" height="100" rx="3" fill="#4B2A4E"/>
        <rect x="93" y="6" width="81" height="100" rx="3" fill="#E8DAE6"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 180 112" class="dec-svg" aria-hidden="true">
      <rect x="6" y="6" width="168" height="14" rx="3" fill="#4B2A4E"/>
      <rect x="38" y="26" width="104" height="62" rx="3" fill="#FBF4E8" stroke="#9372A2"/>
      <rect x="6" y="93" width="168" height="13" rx="3" fill="#4E2A4F"/>
    </svg>`;
  }

  function render() {
    const res = decide();
    wrap.querySelectorAll("button[data-q]").forEach((btn) => {
      const q = btn.dataset.q;
      const v = btn.dataset.v;
      const cur = String(ans[q]);
      btn.classList.toggle("is-active", cur === v);
      btn.setAttribute("aria-pressed", String(cur === v));
    });
    const out = wrap.querySelector("#decision-result");
    if (out) {
      out.innerHTML = `
        <div class="dec-res-inner">
          ${miniSvg(res.primary.svg)}
          <div class="dec-res-copy">
            <span class="dec-rec-k">推荐骨架</span>
            <h3 class="dec-rec-title">${res.primary.name}</h3>
            <p>${res.primary.why}</p>
            <div class="dec-links">
              ${
                res.primary.code === "260"
                  ? `<span class="dec-here">你正在看的 260 圣杯布局就是最稳解</span>`
                  : `<a class="inline-ext" href="${res.primary.url}" target="_blank" rel="noopener">去看 ${res.primary.name} 在线互动页 →</a>`
              }
              <a class="inline-ext inline-ext--sub" href="${res.alt.url}" target="_blank" rel="noopener">备选：${res.alt.name} →</a>
            </div>
          </div>
        </div>
      `;
    }
  }

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-q]");
    if (!btn) return;
    const q = btn.dataset.q;
    const v = btn.dataset.v;
    ans[q] = v === "true" ? true : v === "false" ? false : v;
    render();
  });
  render();
}

// ==================== 05 什么时候别用（四组反例 ⇄ 改用方案对比台） ====================
const MISUSES = [
  {
    id: "landing",
    label: "品牌首屏发布页",
    badTitle: "硬套圣杯：主视觉被双侧栏夹成邮票",
    goodTitle: "卸掉双翼：改用 261 页眉—主体—页脚",
    badMetric: "主视觉有效宽仅 54% · 干扰入口 9 处",
    goodMetric: "主视觉铺满 100% · 唯一行动聚焦",
    why: "新品发布与作品集靠第一屏大气势说服人。两侧常驻灰紫栏既吃掉宽屏张力，又分散核心按钮的点击率。",
    altUrl: "https://layout.xiaoxiaodong.ai/261/play/",
    altName: "261 页眉—主体—页脚",
    svgKind: "landing",
  },
  {
    id: "checkout",
    label: "下单结账流程",
    badTitle: "硬套圣杯：左右链接诱发中途跳出",
    goodTitle: "收束焦点：改用 255 单列页面",
    badMetric: "侧栏可点外链 11 个 · 流程易中断",
    goodMetric: "零干扰外链 · 表单一气呵成填完",
    why: "结账、注册、问卷属于线性高转化任务，页面上每多一个侧栏推荐或导航入口，都在把用户拉离提交按钮。",
    altUrl: "https://layout.xiaoxiaodong.ai/255/play/",
    altName: "255 单列页面",
    svgKind: "checkout",
  },
  {
    id: "short",
    label: "短通知与确认页",
    badTitle: "硬套圣杯：为了对称硬塞空壳侧栏",
    goodTitle: "轻装居中：改用简洁卡片或单列页",
    badMetric: "左右侧栏信息空置率 78%",
    goodMetric: "视线直落结论 · 留白自然从容",
    why: "页面只有三行说明与一个确认键时，为了凑齐三列往左右硬塞「热门文章」和「客服广告」，只会制造噪音。",
    altUrl: "https://layout.xiaoxiaodong.ai/255/play/",
    altName: "255 单列页面",
    svgKind: "short",
  },
  {
    id: "narrow",
    label: "手机竖屏长文",
    badTitle: "硬撑三列：正文碎成 4 字竖条",
    goodTitle: "折叠双翼：改用 263 导航抽屉 + 单列",
    badMetric: "中栏仅 116px · 每行不足 6 字",
    goodMetric: "正文独享 358px · 每行约 22 字",
    why: "390px 竖屏根本装不下三列。圣杯在手机端必须彻底折翼，把左导收进 263 导航抽屉、右辅沉到文末。",
    altUrl: "https://layout.xiaoxiaodong.ai/263/play/",
    altName: "263 导航抽屉布局",
    svgKind: "narrow",
  },
];

function renderMisuseSvg(kind, good) {
  if (!good) {
    return `<svg viewBox="0 0 240 144" class="mis-svg" aria-hidden="true">
      <rect x="6" y="6" width="228" height="20" rx="4" fill="#4B2A4E"/>
      <rect x="6" y="31" width="52" height="82" rx="3" fill="#E8DAE6" stroke="#B52B3A" stroke-dasharray="3 2"/>
      <rect x="64" y="31" width="112" height="82" rx="3" fill="#FBF4E8" stroke="#B52B3A" stroke-width="1.3"/>
      <rect x="182" y="31" width="52" height="82" rx="3" fill="#DFCFDB" stroke="#B52B3A" stroke-dasharray="3 2"/>
      <rect x="6" y="118" width="228" height="20" rx="4" fill="#4E2A4F"/>
      <text x="32" y="74" text-anchor="middle" fill="#B52B3A" font-size="9" font-weight="700">${kind === "short" ? "凑数" : "分心"}</text>
      <text x="120" y="74" text-anchor="middle" fill="#171019" font-size="9.5" font-weight="700">${kind === "narrow" ? "碎行" : "被框小"}</text>
      <text x="208" y="74" text-anchor="middle" fill="#B52B3A" font-size="9" font-weight="700">${kind === "short" ? "空栏" : "干扰"}</text>
    </svg>`;
  }
  if (kind === "landing") {
    return `<svg viewBox="0 0 240 144" class="mis-svg" aria-hidden="true">
      <rect x="6" y="6" width="228" height="18" rx="4" fill="#4B2A4E"/>
      <rect x="6" y="29" width="228" height="86" rx="4" fill="#E4D5DF" stroke="#1D6B52" stroke-width="1.5"/>
      <polygon points="22,115 92,48 162,115" fill="#AE91B9"/>
      <polygon points="104,115 168,58 228,115" fill="#C2A9CA"/>
      <circle cx="192" cy="50" r="10" fill="#FAF2E9"/>
      <rect x="6" y="120" width="228" height="18" rx="4" fill="#4E2A4F"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 240 144" class="mis-svg" aria-hidden="true">
    <rect x="6" y="6" width="228" height="18" rx="4" fill="#4B2A4E"/>
    <rect x="44" y="30" width="152" height="84" rx="4" fill="#FBF4E8" stroke="#1D6B52" stroke-width="1.5"/>
    <rect x="60" y="46" width="120" height="10" rx="2" fill="#4B2A4E"/>
    <rect x="60" y="64" width="100" height="7" rx="2" fill="#C6B6C4"/>
    <rect x="60" y="77" width="112" height="7" rx="2" fill="#C6B6C4"/>
    <rect x="84" y="92" width="72" height="14" rx="3" fill="#1D6B52"/>
    <rect x="6" y="120" width="228" height="18" rx="4" fill="#4E2A4F"/>
  </svg>`;
}

export function initSec05MisuseCompare() {
  const wrap = document.getElementById("misuse-app");
  if (!wrap) return;
  let active = "landing";

  function render() {
    const item = MISUSES.find((m) => m.id === active) || MISUSES[0];
    wrap.querySelectorAll("button[data-mis]").forEach((b) => {
      const on = b.dataset.mis === active;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const stage = wrap.querySelector("#misuse-stage");
    if (stage) {
      stage.innerHTML = `
        <div class="mis-pair">
          <article class="mis-card mis-card--bad">
            <span class="mis-tag mis-tag--bad">硬套圣杯</span>
            <h3>${item.badTitle}</h3>
            ${renderMisuseSvg(item.svgKind, false)}
            <p class="mis-metric">${item.badMetric}</p>
          </article>
          <article class="mis-card mis-card--good">
            <span class="mis-tag mis-tag--good">换对骨架</span>
            <h3>${item.goodTitle}</h3>
            ${renderMisuseSvg(item.svgKind, true)}
            <p class="mis-metric">${item.goodMetric}</p>
          </article>
        </div>
        <div class="mis-explain">
          <p>${item.why}</p>
          <a class="inline-ext" href="${item.altUrl}" target="_blank" rel="noopener">延伸参考：${item.altName} →</a>
        </div>
      `;
    }
  }

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mis]");
    if (!btn) return;
    active = btn.dataset.mis;
    render();
  });
  render();
}

// ==================== 06 深梅紫考场：3 题单变量架构辨析 ====================
// 铁律：选项只写 A/B/C/D + 中性几何参数，绝不在选项里泄露「平衡/失衡/挤压」等评价词！
const QUIZ_ITEMS = [
  {
    id: "q1",
    variable: "唯一变量：三栏像素宽配比（1280px 桌面文档页）",
    prompt: "一个 1280px 宽的技术文档页，左侧是章目录，中间是图文正文与代码，右侧是本页小节锚点。以下四组「左 / 主 / 右」像素分配，哪一组最适合长时间查阅？",
    answer: "B",
    options: [
      { key: "A", title: "320px / 640px / 320px", sub: "比例 25% : 50% : 25%", dims: [25, 50, 25] },
      { key: "B", title: "220px / 820px / 240px", sub: "比例 17% : 64% : 19%", dims: [17, 64, 19] },
      { key: "C", title: "105px / 1070px / 105px", sub: "比例 8% : 84% : 8%", dims: [8, 84, 8] },
      { key: "D", title: "410px / 460px / 410px", sub: "比例 32% : 36% : 32%", dims: [32, 36, 32] },
    ],
    explain:
      "选 B。经验上文档页双侧栏控制在 180–250px 就足以单行清晰排下目录与页内大纲，把超过六成宽幅（约 820px）留给中央正文；A 的两侧各占 320px 过于臃肿，C 的 105px 侧栏会让中文目录频频折行截断，D 则把正文夹成 460px 的窄缝。",
  },
  {
    id: "q2",
    variable: "唯一变量：820px 平板视口下的收折策略",
    prompt: "同一套三栏文档页在 820px 宽的平板屏幕上打开。若要兼顾章节切换与正文可读性，下面哪种响应策略最稳妥？",
    answer: "B",
    options: [
      { key: "A", title: "三栏按比例同缩为 140 / 510 / 140px", sub: "保持三列同行并排", mode: "squeeze3" },
      { key: "B", title: "保留左导 208px，右栏大纲折至正文下方", sub: "收为两列 + 文末模块", mode: "foldR" },
      { key: "C", title: "隐藏左侧目录，保留正文与右侧大纲 220px", sub: "隐藏导航留辅助栏", mode: "foldL" },
      { key: "D", title: "固定 1280px 宽度，开启页面整体横向滚动", sub: "保留桌面像素尺寸", mode: "hscroll" },
    ],
    explain:
      "选 B。平板宽度已装不下完整三列，优先折收信息优先级较低的右侧辅助栏（或收入顶角按钮），既让左侧全局导航持续锚定坐标，又把约 70% 宽幅交还主正文；A 压碎双侧栏，C 丢掉了跨章导航，D 的横向滚动在平板上最损体验。",
  },
  {
    id: "q3",
    variable: "唯一变量：HTML 源码顺序与短文容器高度",
    prompt: "一页内容不足一屏的短篇帮助文档，需要同时照顾键盘/屏幕阅读器用户，以及宽屏下的视觉底梁稳定。哪一组代码结构最契合圣杯原则？",
    answer: "C",
    options: [
      { key: "A", title: "源码左栏排在正文前 + 容器高度随内容自动收缩", sub: "默认流高 · 左导先出", mode: "q3a" },
      { key: "B", title: "源码右栏排在最前 + 外框 height: 100vh 且裁切溢出", sub: "定高裁切 · 右栏先出", mode: "q3b" },
      { key: "C", title: "源码主区靠前（配跳过导航）+ 容器 min-height: 100vh", sub: "满屏推底 · 主区优先", mode: "q3c" },
      { key: "D", title: "源码页脚置顶 + position: fixed 永久悬浮在屏幕底沿", sub: "悬浮压底 · 源码倒置", mode: "q3d" },
    ],
    explain:
      "选 C。min-height: 100vh 配合 1fr 中部轨道（Grid 或 Flexbox）能让短文时页脚稳稳贴底、长文时自然下推而不遮正文；同时源码里优先呈现主内容或提供清晰跳过导航，让键盘与读屏用户不必每次穿过一整串侧栏链接。",
  },
];

function renderQuizThumb(opt) {
  if (opt.dims) {
    const [l, m, r] = opt.dims;
    const total = 156;
    const lw = Math.round((total * l) / 100);
    const rw = Math.round((total * r) / 100);
    const mw = total - lw - rw - 6;
    return `<svg viewBox="0 0 172 68" class="qz-svg" aria-hidden="true">
      <rect x="5" y="4" width="162" height="10" rx="2" fill="#7D5082"/>
      <rect x="5" y="18" width="${lw}" height="32" rx="2" fill="#B79BB8"/>
      <rect x="${8 + lw}" y="18" width="${mw}" height="32" rx="2" fill="#FBF4E8"/>
      <rect x="${11 + lw + mw}" y="18" width="${rw}" height="32" rx="2" fill="#A585A8"/>
      <rect x="5" y="54" width="162" height="10" rx="2" fill="#7D5082"/>
    </svg>`;
  }
  if (opt.mode === "squeeze3") {
    return `<svg viewBox="0 0 172 68" class="qz-svg" aria-hidden="true">
      <rect x="26" y="4" width="120" height="10" rx="2" fill="#7D5082"/>
      <rect x="26" y="18" width="22" height="32" rx="2" fill="#B79BB8"/>
      <rect x="51" y="18" width="70" height="32" rx="2" fill="#FBF4E8"/>
      <rect x="124" y="18" width="22" height="32" rx="2" fill="#A585A8"/>
      <rect x="26" y="54" width="120" height="10" rx="2" fill="#7D5082"/>
    </svg>`;
  }
  if (opt.mode === "foldR") {
    return `<svg viewBox="0 0 172 68" class="qz-svg" aria-hidden="true">
      <rect x="26" y="4" width="120" height="9" rx="2" fill="#7D5082"/>
      <rect x="26" y="16" width="32" height="26" rx="2" fill="#B79BB8"/>
      <rect x="62" y="16" width="84" height="26" rx="2" fill="#FBF4E8"/>
      <rect x="26" y="45" width="120" height="9" rx="2" fill="#A585A8"/>
      <rect x="26" y="57" width="120" height="7" rx="2" fill="#7D5082"/>
    </svg>`;
  }
  if (opt.mode === "foldL") {
    return `<svg viewBox="0 0 172 68" class="qz-svg" aria-hidden="true">
      <rect x="26" y="4" width="120" height="10" rx="2" fill="#7D5082"/>
      <rect x="26" y="18" width="82" height="32" rx="2" fill="#FBF4E8"/>
      <rect x="112" y="18" width="34" height="32" rx="2" fill="#A585A8"/>
      <rect x="26" y="54" width="120" height="10" rx="2" fill="#7D5082"/>
    </svg>`;
  }
  if (opt.mode === "hscroll") {
    return `<svg viewBox="0 0 172 68" class="qz-svg" aria-hidden="true">
      <rect x="26" y="4" width="120" height="60" rx="3" fill="none" stroke="#CBB7CC" stroke-dasharray="3 2"/>
      <rect x="26" y="8" width="142" height="9" rx="2" fill="#7D5082"/>
      <rect x="26" y="21" width="34" height="28" rx="2" fill="#B79BB8"/>
      <rect x="64" y="21" width="76" height="28" rx="2" fill="#FBF4E8"/>
      <rect x="144" y="21" width="24" height="28" rx="2" fill="#A585A8"/>
      <rect x="34" y="55" width="60" height="4" rx="2" fill="#DFC4E6"/>
    </svg>`;
  }
  // q3 variants
  const footY = opt.mode === "q3a" ? 39 : 54;
  return `<svg viewBox="0 0 172 68" class="qz-svg" aria-hidden="true">
    <rect x="12" y="4" width="148" height="60" rx="3" fill="none" stroke="rgba(250,242,233,0.35)"/>
    <rect x="16" y="7" width="140" height="9" rx="2" fill="#7D5082"/>
    <rect x="16" y="19" width="28" height="${opt.mode === "q3a" ? 17 : 32}" rx="2" fill="#B79BB8"/>
    <rect x="48" y="19" width="76" height="${opt.mode === "q3a" ? 17 : 32}" rx="2" fill="#FBF4E8"/>
    <rect x="128" y="19" width="28" height="${opt.mode === "q3a" ? 17 : 32}" rx="2" fill="#A585A8"/>
    <rect x="16" y="${footY}" width="140" height="9" rx="2" fill="#7D5082"/>
  </svg>`;
}

export function initSec06Quiz() {
  const wrap = document.getElementById("quiz-app");
  if (!wrap) return;

  let idx = 0;
  const picks = {};

  function render() {
    const q = QUIZ_ITEMS[idx];
    const chosen = picks[q.id] || null;
    const answeredCount = Object.keys(picks).length;
    const correctCount = QUIZ_ITEMS.filter((item) => picks[item.id] === item.answer).length;

    wrap.innerHTML = `
      <div class="qz-top">
        <div class="qz-steps">
          ${QUIZ_ITEMS.map(
            (item, i) =>
              `<button type="button" class="qz-step ${i === idx ? "is-cur" : ""} ${
                picks[item.id] ? (picks[item.id] === item.answer ? "is-ok" : "is-no") : ""
              }" data-qz-idx="${i}">第 ${i + 1} 题</button>`
          ).join("")}
        </div>
        <span class="qz-score">已答 ${answeredCount}/3 · 答对 ${correctCount}</span>
      </div>
      <div class="qz-card">
        <p class="qz-var">${q.variable}</p>
        <h3 class="qz-prompt">${q.prompt}</h3>
        <div class="qz-options">
          ${q.options
            .map((opt) => {
              let cls = "";
              if (chosen) {
                if (opt.key === q.answer) cls = "is-correct";
                else if (opt.key === chosen) cls = "is-wrong";
              }
              return `<button type="button" class="qz-opt ${cls}" data-qz-opt="${opt.key}">
                <div class="qz-opt-head"><span class="qz-key">${opt.key}</span><strong>${opt.title}</strong></div>
                ${renderQuizThumb(opt)}
                <span class="qz-opt-sub">${opt.sub}</span>
              </button>`;
            })
            .join("")}
        </div>
        ${
          chosen
            ? `<div class="qz-feedback ${chosen === q.answer ? "is-ok" : "is-no"}">
                 <strong>${chosen === q.answer ? `✓ 判断准确（选 ${q.answer}）` : `× 你选了 ${chosen}，更稳妥的是 ${q.answer}`}</strong>
                 <p>${q.explain}</p>
                 <div class="qz-actions">
                   ${idx < QUIZ_ITEMS.length - 1 ? `<button type="button" class="btn-light" data-qz-next="1">下一题 →</button>` : `<button type="button" class="btn-light" data-qz-reset="1">重新测一遍</button>`}
                 </div>
               </div>`
            : `<p class="qz-pending">从 A / B / C / D 中选出你认为最合理的一组参数，选完立刻展开解析。</p>`
        }
      </div>
    `;
  }

  wrap.addEventListener("click", (e) => {
    const step = e.target.closest("button[data-qz-idx]");
    if (step) {
      idx = Number(step.dataset.qzIdx);
      render();
      return;
    }
    const opt = e.target.closest("button[data-qz-opt]");
    if (opt) {
      picks[QUIZ_ITEMS[idx].id] = opt.dataset.qzOpt;
      render();
      return;
    }
    if (e.target.closest("button[data-qz-next]")) {
      idx = Math.min(QUIZ_ITEMS.length - 1, idx + 1);
      render();
      return;
    }
    if (e.target.closest("button[data-qz-reset]")) {
      for (const k of Object.keys(picks)) delete picks[k];
      idx = 0;
      render();
    }
  });
  render();
}

// ==================== 07 原海报灯箱（放大 + 拖拽 + Esc 关） ====================
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const lb = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const zoomLabel = document.getElementById("lb-zoom-label");
  if (!thumb || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  thumb.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);

  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.classList.contains("lb-stage")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lb.addEventListener(
    "wheel",
    (e) => {
      if (lb.hidden) return;
      e.preventDefault();
      scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  lbImg.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbImg.setPointerCapture(e.pointerId);
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => {
    dragging = false;
  });
  lbImg.addEventListener("pointercancel", () => {
    dragging = false;
  });
}
