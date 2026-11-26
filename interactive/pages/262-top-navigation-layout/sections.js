// 262 顶部导航布局 · 01–07 节互动实验模块（相邻两节绝不重复同一种交互控件）

// ---------- 01 节：双赛道点击寻路计时 + 记忆组块扫视演示 ----------
export function initSection01() {
  const TARGETS = ["课程体系", "学习资源", "实践项目", "个人中心"];
  let targetIdx = 2; // 初始目标：实践项目
  let laneStart = { visible: 0, hidden: 0 };
  let laneClicks = { visible: 0, hidden: 0 };

  const targetEl = document.getElementById("race-target-name");
  const statVis = document.getElementById("stat-visible");
  const statHid = document.getElementById("stat-hidden");
  const burgerBtn = document.getElementById("mock-burger-btn");
  const drawerPop = document.getElementById("mock-drawer-pop");
  const newTargetBtn = document.getElementById("race-new-target");

  function resetRace(nextIdx) {
    targetIdx = nextIdx;
    targetEl.textContent = TARGETS[targetIdx];
    laneStart = { visible: performance.now(), hidden: 0 };
    laneClicks = { visible: 0, hidden: 0 };
    statVis.textContent = "直点上方目标开始计步";
    statHid.textContent = "先点「菜单」展开再找";
    drawerPop.hidden = true;
    burgerBtn.setAttribute("aria-expanded", "false");
    document.querySelectorAll(".mock-link, .mock-drawer-link").forEach((b) => b.classList.remove("is-hit"));
  }

  newTargetBtn.addEventListener("click", () => {
    resetRace((targetIdx + 1) % TARGETS.length);
  });

  burgerBtn.addEventListener("click", () => {
    const open = drawerPop.hidden;
    drawerPop.hidden = !open;
    burgerBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      if (!laneStart.hidden) laneStart.hidden = performance.now();
      laneClicks.hidden += 1;
      statHid.textContent = `已点 ${laneClicks.hidden} 步 · 请在下拉里寻找「${TARGETS[targetIdx]}」`;
    }
  });

  document.querySelectorAll(".mock-link, .mock-drawer-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lane = btn.dataset.lane;
      const item = btn.dataset.item;
      const goal = TARGETS[targetIdx];
      laneClicks[lane] += 1;
      if (item === goal) {
        btn.classList.add("is-hit");
        if (lane === "visible") {
          statVis.textContent = `命中！仅 ${laneClicks.visible} 次点击直达`;
        } else {
          const dt = laneStart.hidden ? Math.max(80, Math.round(performance.now() - laneStart.hidden)) : 320;
          statHid.textContent = `命中：共 ${laneClicks.hidden} 步（展开后耗时 ${dt}ms）`;
        }
      } else {
        const el = lane === "visible" ? statVis : statHid;
        el.textContent = `点成了「${item}」，目标仍是「${goal}」`;
      }
    });
  });

  // 入口数量与扫视负荷演示
  const CHUNK_ITEMS = [
    "首页", "课程体系", "学习资源", "实践项目", "个人中心",
    "社区讨论", "认证考试", "关于我们", "更新日志", "隐私条款", "商务合作",
  ];
  const CHUNK_NOTES = {
    4: "4 项入口：落入 Cowan（2001）指出的短时工作记忆核心区（约 4 组块），单眼一眼扫完，几乎零比较成本。",
    5: "5 项入口（262 原海报示例）：兼顾站点概览与单行留白，在 1024px–1440px 桌面屏上视觉节奏从容。",
    7: "7 项入口（常见经验上限）：接近桌面单行宽度的呼吸临界线，再多就必须仔细缩减字数或收敛次级项。",
    11: "11 项入口（典型过载）：超出单次工作记忆扫视舒适区，且窄桌面下被迫折行；虚线项本应退入页脚或二级菜单。",
  };

  const preview = document.getElementById("chunk-bar-preview");
  const caption = document.getElementById("chunk-caption");
  const chunkBtns = document.querySelectorAll("#chunk-controls [data-chunks]");

  function renderChunks(n) {
    preview.innerHTML = CHUNK_ITEMS.slice(0, n)
      .map((label, i) => `<span class="chunk-pill${i >= 7 ? " is-extra" : ""}">${label}</span>`)
      .join("");
    caption.textContent = CHUNK_NOTES[n];
    chunkBtns.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.chunks) === n));
  }

  chunkBtns.forEach((btn) => {
    btn.addEventListener("click", () => renderChunks(Number(btn.dataset.chunks)));
  });

  resetRace(2);
  renderChunks(5);
}

// ---------- 02 节：三种布局变体实时架构试衣 ----------
export function initSection02() {
  const DATA = {
    center: {
      cls: "is-center",
      css: `display: flex;\nalign-items: center;\n.nav { margin-inline: auto; }`,
      balance: [
        { k: "左侧", v: 26 },
        { k: "中部", v: 56 },
        { k: "右侧", v: 18 },
      ],
      note: "适合 3–5 项内容的品牌官网、课程展示与作品集。频道整体居中形成对称秩序，右侧不堆叠过多操作按钮时最耐看。",
      render: () => `
        <div class="vbar-demo is-center">
          <div class="vbar-brand">北极星学堂</div>
          <div class="vbar-track">
            <span class="vbar-item is-cur">首页</span>
            <span class="vbar-item">课程体系</span>
            <span class="vbar-item">学习资源</span>
            <span class="vbar-item">实践项目</span>
            <span class="vbar-item">个人中心</span>
          </div>
        </div>`,
    },
    right: {
      cls: "is-right",
      css: `display: flex;\njustify-content: space-between;\n.nav { margin-left: auto; }`,
      balance: [
        { k: "左侧", v: 36 },
        { k: "中部", v: 14 },
        { k: "右侧", v: 50 },
      ],
      note: "中间故意留出大片空白带，把左侧品牌标与右侧入口组明显拉开。适合强调品牌识别、入口紧凑集中在一侧的落地页。",
      render: () => `
        <div class="vbar-demo is-right">
          <div class="vbar-brand">北极星学堂</div>
          <div class="vbar-track">
            <span class="vbar-item is-cur">首页</span>
            <span class="vbar-item">课程体系</span>
            <span class="vbar-item">学习资源</span>
            <span class="vbar-item">实践项目</span>
            <span class="vbar-item">个人中心</span>
          </div>
        </div>`,
    },
    split: {
      cls: "is-split",
      css: `display: grid;\ngrid-template-columns: auto 1fr auto;\n/* 品牌左 · 频道中 · 工具右 */`,
      balance: [
        { k: "左侧", v: 24 },
        { k: "中部", v: 46 },
        { k: "右侧", v: 30 },
      ],
      note: "现代学习平台与 SaaS 最常用的三段式分工：左看「这是哪」、中选「去哪个频道」、右做「搜索 / 通知 / 账户」动作，心智模型最清楚。",
      render: () => `
        <div class="vbar-demo is-split">
          <div class="vbar-brand">北极星学堂</div>
          <div class="vbar-track">
            <div class="vbar-mid">
              <span class="vbar-item is-cur">首页</span>
              <span class="vbar-item">课程体系</span>
              <span class="vbar-item">学习资源</span>
            </div>
            <div class="vbar-actions">
              <span class="vbar-action-chip">搜索</span>
              <span class="vbar-action-chip">通知</span>
              <span class="vbar-action-chip">个人中心</span>
            </div>
          </div>
        </div>`,
    },
    spread: {
      cls: "is-spread",
      css: `/* 反例：不分主次均匀拉满 */\njustify-content: space-between;`,
      balance: [
        { k: "左侧", v: 33 },
        { k: "中部", v: 34 },
        { k: "右侧", v: 33 },
      ],
      note: "反例警示：把频道与搜索、登录按相同间距拉满整条 1440px 宽栏后，相邻文字间距过大、组块感消失，视线被迫大幅左右甩头才能扫完。",
      render: () => `
        <div class="vbar-demo is-spread">
          <div class="vbar-brand">北极星</div>
          <div class="vbar-track">
            <span class="vbar-item is-cur">首页</span>
            <span class="vbar-item">搜索</span>
            <span class="vbar-item">课程体系</span>
            <span class="vbar-item">登录</span>
            <span class="vbar-item">学习资源</span>
            <span class="vbar-item">关于</span>
          </div>
        </div>`,
    },
  };

  const frame = document.getElementById("variant-bar-frame");
  const cssEl = document.getElementById("vm-css");
  const balEl = document.getElementById("vm-balance");
  const noteEl = document.getElementById("vm-note");
  const tabs = document.querySelectorAll("#s02-studio [data-vkey]");

  function selectVariant(key) {
    const d = DATA[key];
    frame.innerHTML = d.render();
    cssEl.textContent = d.css;
    balEl.innerHTML = d.balance
      .map(
        (b) => `<div class="bal-row"><span>${b.k}</span><span class="bal-track"><span class="bal-fill" style="width:${b.v}%"></span></span><span>${b.v}%</span></div>`
      )
      .join("");
    noteEl.textContent = d.note;
    tabs.forEach((t) => {
      const act = t.dataset.vkey === key;
      t.classList.toggle("is-active", act);
      t.setAttribute("aria-selected", String(act));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => selectVariant(t.dataset.vkey)));
  selectVariant("center");
}

// ---------- 03 节：5 区解剖 × 三层金字塔 × WAI-ARIA 语义透视 ----------
export function initSection03() {
  const PARTS = {
    brand: {
      kicker: "STRUCTURE ZONE 01 · 品牌区",
      title: "品牌区 · 站点身份与一键归位",
      quote: "原海报注记：「强化识别，支持返回主页。」",
      desc: "固定占据顶栏最左端（从左向右阅读语境）。在 262 原海报里，它用独立松青色块托起双半圆徽标，一眼定调站点身份，也是用户迷路时点击率最高的「逃生出口」。",
      doText: "品牌标志或简短站名；点击无条件返回首页；给 <a> 写清可访问名称。",
      dontText: "不要把品牌区做成不可点击的纯图片，也不要塞满大段口号挤占导航横宽。",
      code: `<a href="/" class="brand" aria-label="北极星学堂首页">\n  <svg aria-hidden="true">...</svg>\n  <span>北极星学堂</span>\n</a>`,
      tier: "tier1",
    },
    active: {
      kicker: "STRUCTURE ZONE 02 · 当前状态",
      title: "当前状态 · 视觉与语义双重锚定",
      quote: "原海报注记：「高亮显示，增强定位感。」",
      desc: "除了视觉上的亮青底线、字重或胶囊底色，还必须同步写入 W3C WAI-ARIA 规范定义的 aria-current=\"page\"，让屏幕阅读器同样播报「当前页面」。",
      doText: "同时用颜色 + 形状（底线/边框/加粗）标出当前页，避免仅靠颜色区分色弱用户。",
      dontText: "不要同时高亮两个一级入口，也不要把当前页从导航条里藏掉。",
      code: `<a href="/courses" aria-current="page" class="is-active">\n  课程体系\n</a>`,
      tier: "tier1",
    },
    items: {
      kicker: "STRUCTURE ZONE 03 · 导航项",
      title: "导航项 · 4–7 项核心频道骨架",
      quote: "原海报注记：「核心功能入口，保持简洁清晰。」",
      desc: "一级导航承担整站信息地图的角色。优先用 2–4 个字的名词或动宾短词，按用户任务先后自然分组，把隐私声明、招聘等低频链接请回页脚。",
      doText: "用原生 <nav> + <ul><li><a> 组织，保证键盘 Tab 与读屏软件能直接跳过或按列表朗读。",
      dontText: "不要为了省事全写成 <div> 点击事件，也不要用生造营销黑话代替直白频道名。",
      code: `<nav aria-label="主导航">\n  <ul>\n    <li><a href="/courses">课程体系</a></li>\n    <li><a href="/resources">学习资源</a></li>\n  </ul>\n</nav>`,
      tier: "tier1",
    },
    global: {
      kicker: "STRUCTURE ZONE 04 · 全局一致",
      title: "全局一致 · 跨页坐标纹丝不动",
      quote: "原海报注记：「在所有页面中保持一致位置。」",
      desc: "Steve Krug（2000）指出，持久导航的最大回报是「用户只需学习一次」。切到任意子页时，一级入口的数量、顺序、高度和位置都应保持稳定。",
      doText: "跨频道共用同一份顶栏组件；进入深层子页时用二级子导航或面包屑承接细分。",
      dontText: "不要在 A 页面有 5 项、切到 B 页面突然变成 3 项或把顺序重新洗牌。",
      code: `<!-- 一级顶栏全站不变，子分类交由二级导航承接 -->\n<nav aria-label="主导航">...</nav>\n<nav aria-label="课程子分类">...</nav>`,
      tier: "tier2",
    },
    access: {
      kicker: "STRUCTURE ZONE 05 · 易于访问",
      title: "易于访问 · 高频动作与多端触控",
      quote: "原海报注记：「放置常用或重要功能入口。」",
      desc: "把搜索、个人中心、登录等高频全局动作稳定放在右侧末端，确保每个点击热区高度 ≥ 40–44px，并提供「跳至主要内容」快捷键供键盘访客越过重复顶栏。",
      doText: "保留清晰的 :focus-visible 键盘焦点框；390px 窄屏平滑折叠进带文字标签的菜单按钮。",
      dontText: "不要把栏高压扁到 36px 以下，也不要在桌面端把全部入口缩进无文字的三条杠。",
      code: `<a class="skip-link" href="#main">跳至主要内容</a>\n<button aria-expanded="false" aria-controls="drawer">\n  菜单\n</button>`,
      tier: "tier1",
    },
    tier1: {
      kicker: "HIERARCHY TIER 01 · 一级导航",
      title: "一级导航 · 回答「全站能去哪儿」",
      quote: "原海报金字塔顶层：「核心模块（全局导航）」",
      desc: "位于信息金字塔最顶端，入口数量最少但覆盖面最广。每新增一个一级入口，都会摊薄其余入口的注意力与横宽预算，因此必须严守 4–7 项经验红线。",
      doText: "只放跨任务高频切换的顶级频道（如首页、课程体系、学习资源、实践项目）。",
      dontText: "不要把三级子页面直接提拔到一级横栏里凑数。",
      code: `<header>\n  <nav aria-label="全局主导航"><!-- 4-7 核心入口 --></nav>\n</header>`,
      tier: "tier1",
    },
    tier2: {
      kicker: "HIERARCHY TIER 02 · 二级导航",
      title: "二级导航 · 按需展开子模块分类",
      quote: "原海报金字塔中层：「子模块 / 分类（可选）」",
      desc: "只有当某个一级频道内部存在 3 个以上明确子分类时才启用，可用轻量的点击下拉面板、页面内子标签或左侧局部目录承接，绝不把所有二级分类常年堆成双层厚顶栏。",
      doText: "点击或明确聚焦时展开，提供清晰分组标题，支持 Esc 一键收起。",
      dontText: "避免多层脆弱悬停级联菜单（鼠标斜滑 1 像素就整层塌掉）。",
      code: `<nav aria-label="学习资源分类">\n  <a href="?cat=guide" aria-current="page">规范手册</a>\n  <a href="?cat=cases">真实案例</a>\n</nav>`,
      tier: "tier2",
    },
    tier3: {
      kicker: "HIERARCHY TIER 03 · 内容区域",
      title: "内容区域 · 专注「看什么与怎么学」",
      quote: "原海报灯泡提示：「顶部导航关注“去哪儿”，内容区域解决“看什么与怎么学”。」",
      desc: "顶栏让出整页 100% 横向宽度后，内容主体区（<main>）才能从容布置课程正文、筛选条件、图表与实操画布。把局部筛选、排序、分页留在这里，顶栏才能始终轻盈。",
      doText: "用原生 <main id=\"main\"> 包裹主体内容，让视线在 64px 顶栏下方立刻见到核心标题。",
      dontText: "不要在顶栏里塞进长串筛选器、公告横幅和广告条把首屏压出视口。",
      code: `<main id="main">\n  <h1>课程体系 · 信息架构路径</h1>\n  <!-- 局部筛选、卡片列表与正文主体 -->\n</main>`,
      tier: "tier3",
    },
  };

  const zones = document.querySelectorAll("#s03-anatomy .dissect-zone");
  const tiers = document.querySelectorAll("#s03-anatomy .pyr-tier");
  const elKicker = document.getElementById("insp-kicker");
  const elTitle = document.getElementById("insp-title");
  const elQuote = document.getElementById("insp-quote");
  const elDesc = document.getElementById("insp-desc");
  const elDo = document.getElementById("insp-do");
  const elDont = document.getElementById("insp-dont");
  const elCode = document.getElementById("insp-code");

  function showPart(key) {
    const p = PARTS[key];
    if (!p) return;
    elKicker.textContent = p.kicker;
    elTitle.textContent = p.title;
    elQuote.textContent = p.quote;
    elDesc.textContent = p.desc;
    elDo.textContent = p.doText;
    elDont.textContent = p.dontText;
    elCode.textContent = p.code;

    zones.forEach((z) => z.classList.toggle("is-active", z.dataset.part === key));
    tiers.forEach((t) => t.classList.toggle("is-active", t.dataset.tier === (key.startsWith("tier") ? key : p.tier)));
  }

  zones.forEach((z) => z.addEventListener("click", () => showPart(z.dataset.part)));
  tiers.forEach((t) => {
    t.addEventListener("click", () => showPart(t.dataset.tier));
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showPart(t.dataset.tier);
      }
    });
  });

  showPart("brand");
}

// ---------- 04 节：历史演进时间轴 ----------
export function initSection04() {
  const ERAS = {
    1954: {
      tag: "1954 · 运动控制心理学基础",
      title: "Paul Fitts 提出指向时间与目标宽度的数学关系",
      text: "心理学家 Paul Fitts 在《Journal of Experimental Psychology》发表论文，量化了人类快速指向目标的规律：目标越大、距离越近，命中越快。三十年后，这条规律成为图形界面把全局菜单牢牢钉在屏幕顶边的核心依据。",
      source: "核实文献：Paul M. Fitts (1954), The Information Capacity of the Human Motor System in Controlling the Amplitude of Movement.",
      svg: `<svg viewBox="0 0 320 170"><rect x="12" y="14" width="296" height="142" rx="8" fill="#FCF9F3" stroke="#9EB5AE"/><rect x="12" y="14" width="296" height="28" rx="6" fill="#041B36"/><text x="160" y="32" text-anchor="middle" fill="#3AE0D2" font-size="11.5" font-weight="700">屏幕顶边止停 · 指针冲不出去</text><circle cx="96" cy="118" r="10" fill="#02777D"/><path d="M104 108 L154 46" stroke="#041B36" stroke-width="2" stroke-dasharray="4 3"/><polygon points="154,46 146,52 156,56" fill="#041B36"/><text x="160" y="138" text-anchor="middle" fill="#374F61" font-size="11">Fitts 定律：有效目标高度沿顶边无限延伸</text></svg>`,
    },
    1984: {
      tag: "1984 · 桌面图形界面的顶边定型",
      title: "Apple Macintosh 将全局菜单栏固定在屏幕最顶端",
      text: "1984 年发布的 Apple Macintosh System 1（承接前作 Lisa）把全局菜单条紧贴显示器顶边放置。Apple 界面先驱 Bruce Tognazzini 后来总结：指针甩向屏幕顶部会被物理边界自动截停，不必减速微调，从而让「顶部横条 = 全局指令入口」成为整代人的数字直觉。",
      source: "核实来源：Apple Macintosh System 1 (1984)；Bruce Tognazzini 关于 Fitts 定律与顶边菜单栏的界面设计论述。",
      svg: `<svg viewBox="0 0 320 170"><rect x="16" y="16" width="288" height="138" rx="8" fill="#FFFFFF" stroke="#041B36" stroke-width="1.5"/><rect x="16" y="16" width="288" height="26" rx="6" fill="#041B36"/><text x="30" y="33" fill="#3AE0D2" font-size="11" font-weight="700">File   Edit   View   Special</text><rect x="34" y="56" width="160" height="82" rx="4" fill="#ECF3F0" stroke="#9EB5AE"/><rect x="34" y="56" width="160" height="16" fill="#02777D"/><rect x="208" y="64" width="76" height="62" rx="4" fill="#F5F5F0" stroke="#CBD8D3"/></svg>`,
    },
    1998: {
      tag: "1998 · 网页信息架构体系化",
      title: "Rosenfeld & Morville 在「北极熊书」界定全局导航系统",
      text: "Louis Rosenfeld 与 Peter Morville 于 1998 年出版《Information Architecture for the World Wide Web》（O'Reilly 首版），系统区分了全局导航、局部导航与上下文导航。他们指出：访客经常通过搜索引擎直接空降到深层子页，只有全站一致的全局导航才能避免用户被困在信息孤岛里。",
      source: "核实文献：Louis Rosenfeld & Peter Morville (1998), Information Architecture for the World Wide Web, O'Reilly & Associates.",
      svg: `<svg viewBox="0 0 320 170"><rect x="20" y="18" width="280" height="26" rx="5" fill="#02777D"/><text x="160" y="35" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="700">GLOBAL NAVIGATION · 全局横向主轨</text><line x1="80" y1="44" x2="80" y2="76" stroke="#041B36" stroke-width="1.4"/><line x1="160" y1="44" x2="160" y2="76" stroke="#041B36" stroke-width="1.4"/><line x1="240" y1="44" x2="240" y2="76" stroke="#041B36" stroke-width="1.4"/><rect x="36" y="76" width="88" height="32" rx="5" fill="#041B36"/><rect x="116" y="76" width="88" height="32" rx="5" fill="#041B36"/><rect x="196" y="76" width="88" height="32" rx="5" fill="#041B36"/><text x="80" y="96" text-anchor="middle" fill="#E0ECE8" font-size="10.5">频道 A</text><text x="160" y="96" text-anchor="middle" fill="#3AE0D2" font-size="10.5">频道 B</text><text x="240" y="96" text-anchor="middle" fill="#E0ECE8" font-size="10.5">频道 C</text><text x="160" y="142" text-anchor="middle" fill="#374F61" font-size="11">任意深链着陆，仍可一眼横向跨频道移动</text></svg>`,
    },
    2000: {
      tag: "2000 · 网页可用性通识成形",
      title: "Steve Krug 将持久导航比作「沉稳的定心丸」",
      text: "Steve Krug 在 2000 年首版的《Don't Make Me Think》（New Riders）第 6 章中梳理了持久导航的标准构成：站点标识、主频道、工具区、搜索与回首页路径。他同时点明两条例外：首页结构特殊，以及结账与表单流程中应撤去干扰入口。",
      source: "核实文献：Steve Krug (2000), Don't Make Me Think: A Common Sense Approach to Web Usability, New Riders.",
      svg: `<svg viewBox="0 0 320 170"><rect x="18" y="24" width="284" height="34" rx="6" fill="#041B36"/><rect x="18" y="24" width="66" height="34" rx="6" fill="#02777D"/><text x="51" y="45" text-anchor="middle" fill="#FFFFFF" font-size="10.5" font-weight="700">站点 ID</text><text x="162" y="45" text-anchor="middle" fill="#FFFFFF" font-size="10.5">频道 1   频道 2   频道 3</text><rect x="246" y="31" width="46" height="20" rx="4" fill="#1C9293"/><text x="269" y="45" text-anchor="middle" fill="#FFFFFF" font-size="10">搜索</text><rect x="18" y="72" width="284" height="72" rx="6" fill="#FFFFFF" stroke="#9EB5AE" stroke-dasharray="4 3"/><text x="160" y="104" text-anchor="middle" fill="#041B36" font-size="12" font-weight="700">「它一直在那里，且用法永远相同」</text><text x="160" y="124" text-anchor="middle" fill="#374F61" font-size="10.5">例外：结账与专注表单流程应精简出口</text></svg>`,
    },
    "2010s": {
      tag: "2010s 至今 · 响应式降级与无障碍语义",
      title: "桌面摊开、窄屏优雅降级，并接入 ARIA 语义标准",
      text: "智能手机普及后，360–430px 竖屏无法平铺 5–7 个横向入口，催生了「宽屏顶部导航 + 窄屏交接给抽屉或优先级折叠」的响应范式；与此同时，HTML5 <nav> 地标与 W3C WAI-ARIA aria-current=\"page\" 让视觉定位与无障碍读屏真正同步。",
      source: "核实来源：W3C WAI-ARIA 1.2 规范、MDN <nav> 文档、NN/g 桌面与移动端菜单研究。",
      svg: `<svg viewBox="0 0 320 170"><rect x="14" y="22" width="186" height="126" rx="6" fill="#FFFFFF" stroke="#041B36"/><rect x="14" y="22" width="186" height="24" rx="5" fill="#041B36"/><rect x="14" y="22" width="38" height="24" rx="5" fill="#02777D"/><text x="122" y="38" text-anchor="middle" fill="#3AE0D2" font-size="9.5">宽屏：5 项明牌摊开</text><text x="107" y="96" text-anchor="middle" fill="#374F61" font-size="10.5">1280px 桌面</text><rect x="220" y="22" width="84" height="126" rx="10" fill="#FFFFFF" stroke="#02777D" stroke-width="1.5"/><rect x="220" y="22" width="84" height="24" rx="8" fill="#041B36"/><rect x="220" y="22" width="24" height="24" rx="6" fill="#02777D"/><text x="268" y="38" text-anchor="middle" fill="#FFFFFF" font-size="9.5">菜单</text><line x1="286" y1="30" x2="296" y2="30" stroke="#3AE0D2" stroke-width="1.4"/><line x1="286" y1="34" x2="296" y2="34" stroke="#3AE0D2" stroke-width="1.4"/><line x1="286" y1="38" x2="296" y2="38" stroke="#3AE0D2" stroke-width="1.4"/><text x="262" y="96" text-anchor="middle" fill="#015D63" font-size="10.5">390px 折叠</text></svg>`,
    },
  };

  const nodes = document.querySelectorAll("#s04-history .tl-node");
  const dia = document.getElementById("era-diagram");
  const tag = document.getElementById("era-tag");
  const title = document.getElementById("era-title");
  const text = document.getElementById("era-text");
  const source = document.getElementById("era-source");

  function showEra(key) {
    const e = ERAS[key];
    dia.innerHTML = e.svg;
    tag.textContent = e.tag;
    title.textContent = e.title;
    text.textContent = e.text;
    source.textContent = e.source;
    nodes.forEach((n) => {
      const act = n.dataset.era === key;
      n.classList.toggle("is-active", act);
      n.setAttribute("aria-selected", String(act));
    });
  }

  nodes.forEach((n) => n.addEventListener("click", () => showEra(n.dataset.era)));
  showEra("1954");
}

// ---------- 05 节：什么时候别用顶栏（分诊卡线框翻转） ----------
export function initSection05() {
  const WIREFRAMES = {
    erp: {
      bad: `<svg viewBox="0 0 320 112"><rect x="4" y="4" width="312" height="104" rx="6" fill="#FFFFFF" stroke="#C42E24" stroke-dasharray="4 3"/><rect x="4" y="4" width="312" height="44" rx="5" fill="#041B36"/><text x="160" y="22" text-anchor="middle" fill="#FFB0AA" font-size="9.5">采购 仓储 财务 审批 报表 权限 资产 合同 审计</text><text x="160" y="39" text-anchor="middle" fill="#FFB0AA" font-size="9.5">日志 发票 客户 绩效 排班 公告 接口 系统 监控</text><text x="160" y="82" text-anchor="middle" fill="#B4261E" font-size="11.5" font-weight="700">× 硬塞 18 项：双行拥挤 + 脆弱多级悬停</text></svg>`,
      alt: `<svg viewBox="0 0 320 112"><rect x="4" y="4" width="312" height="104" rx="6" fill="#FFFFFF" stroke="#02777D"/><rect x="4" y="4" width="84" height="104" rx="5" fill="#041B36"/><text x="46" y="28" text-anchor="middle" fill="#3AE0D2" font-size="10" font-weight="700">侧边树形目录</text><rect x="16" y="38" width="60" height="8" rx="2" fill="#02777D"/><rect x="16" y="52" width="52" height="7" rx="2" fill="#335370"/><rect x="16" y="65" width="56" height="7" rx="2" fill="#335370"/><rect x="16" y="78" width="48" height="7" rx="2" fill="#335370"/><text x="200" y="62" text-anchor="middle" fill="#046854" font-size="11.5" font-weight="700">✓ 改用 258 侧边栏：纵向轻松分组折叠</text></svg>`,
    },
    thumb: {
      bad: `<svg viewBox="0 0 320 112"><rect x="112" y="4" width="96" height="104" rx="12" fill="#FFFFFF" stroke="#C42E24" stroke-dasharray="4 3"/><rect x="112" y="4" width="96" height="22" rx="8" fill="#041B36"/><text x="160" y="19" text-anchor="middle" fill="#FFB0AA" font-size="9">顶栏远离拇指</text><circle cx="176" cy="84" r="14" fill="rgba(196,46,36,0.15)" stroke="#C42E24"/><text x="160" y="56" text-anchor="middle" fill="#B4261E" font-size="10" font-weight="700">× 单手够不着</text></svg>`,
      alt: `<svg viewBox="0 0 320 112"><rect x="112" y="4" width="96" height="104" rx="12" fill="#FFFFFF" stroke="#02777D"/><text x="160" y="48" text-anchor="middle" fill="#046854" font-size="10.5" font-weight="700">✓ 264 底部导航</text><rect x="112" y="84" width="96" height="24" rx="8" fill="#041B36"/><text x="160" y="100" text-anchor="middle" fill="#3AE0D2" font-size="9.5">首页 分类 订单 我的</text></svg>`,
    },
    checkout: {
      bad: `<svg viewBox="0 0 320 112"><rect x="4" y="4" width="312" height="104" rx="6" fill="#FFFFFF" stroke="#C42E24" stroke-dasharray="4 3"/><rect x="4" y="4" width="312" height="24" rx="5" fill="#041B36"/><text x="160" y="20" text-anchor="middle" fill="#FFB0AA" font-size="9.5">新品   特惠   社区   课程   限时活动   个人中心</text><rect x="76" y="40" width="168" height="54" rx="5" fill="#F5F5F0" stroke="#CBD8D3"/><text x="160" y="71" text-anchor="middle" fill="#B4261E" font-size="11" font-weight="700">× 支付页保留满排诱惑出口</text></svg>`,
      alt: `<svg viewBox="0 0 320 112"><rect x="4" y="4" width="312" height="104" rx="6" fill="#FFFFFF" stroke="#02777D"/><rect x="4" y="4" width="312" height="22" rx="5" fill="#ECF3F0"/><text x="26" y="19" fill="#015D63" font-size="10" font-weight="700">← 返回</text><text x="160" y="19" text-anchor="middle" fill="#041B36" font-size="10" font-weight="700">① 确认订单 → ② 支付</text><rect x="86" y="38" width="148" height="58" rx="5" fill="#ECF3F0" stroke="#02777D"/><text x="160" y="71" text-anchor="middle" fill="#046854" font-size="11" font-weight="700">✓ 极简单列专注完成转化</text></svg>`,
    },
    local: {
      bad: `<svg viewBox="0 0 320 112"><rect x="4" y="4" width="312" height="104" rx="6" fill="#FFFFFF" stroke="#C42E24" stroke-dasharray="4 3"/><rect x="4" y="4" width="312" height="26" rx="5" fill="#041B36"/><text x="160" y="21" text-anchor="middle" fill="#FFB0AA" font-size="9.5">首页  课程  规格参数  用户评价  常见问答  详情</text><text x="160" y="68" text-anchor="middle" fill="#B4261E" font-size="11" font-weight="700">× 全局频道与单页局部标签混在一起</text></svg>`,
      alt: `<svg viewBox="0 0 320 112"><rect x="4" y="4" width="312" height="104" rx="6" fill="#FFFFFF" stroke="#02777D"/><rect x="4" y="4" width="312" height="22" rx="5" fill="#041B36"/><text x="160" y="19" text-anchor="middle" fill="#E0ECE8" font-size="9.5">全局顶栏只留：首页 · 课程 · 资源 · 项目</text><rect x="24" y="38" width="272" height="24" rx="4" fill="#ECF3F0"/><text x="160" y="54" text-anchor="middle" fill="#015D63" font-size="10" font-weight="700">[规格参数]   用户评价   常见问答（265 标签页）</text><text x="160" y="88" text-anchor="middle" fill="#046854" font-size="11" font-weight="700">✓ 全局「去哪儿」与局部「看什么」分层清晰</text></svg>`,
    },
  };

  document.querySelectorAll("#s05-triage .triage-card").forEach((card) => {
    const key = card.dataset.triage;
    const wf = card.querySelector(".triage-wireframe");
    const btn = card.querySelector(".triage-flip-btn");
    let showAlt = false;

    const render = () => {
      wf.innerHTML = showAlt ? WIREFRAMES[key].alt : WIREFRAMES[key].bad;
      card.classList.toggle("is-alt", showAlt);
      btn.setAttribute("aria-pressed", String(showAlt));
      btn.textContent = showAlt ? "看硬塞反例" : "看替代方案";
    };

    btn.addEventListener("click", () => {
      showAlt = !showAlt;
      render();
    });
    render();
  });
}

// ---------- 06 节：单变量控制实战练习 ----------
export function initSection06() {
  const QUESTIONS = [
    {
      prompt: "场景：1280px 桌面端在线学习平台，用户此刻正浏览「课程体系」页面。以下四条顶栏配色、字号与总宽完全一致，只差入口密度与状态呈现，哪一条最符合顶部导航布局原则？",
      correct: "C",
      options: [
        {
          id: "A",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect y="12" width="320" height="44" fill="#041B36"/><rect y="12" width="44" height="44" fill="#02777D"/><circle cx="22" cy="34" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/><text x="74" y="38" fill="#EEF6FA" font-size="11">首页</text><text x="114" y="38" fill="#EEF6FA" font-size="11">课程体系</text><text x="174" y="38" fill="#EEF6FA" font-size="11">学习资源</text><text x="234" y="38" fill="#EEF6FA" font-size="11">实践项目</text><text x="288" y="38" fill="#EEF6FA" font-size="10">我的</text></svg>`,
          feedback: "方案 A 入口精简且单行工整，但缺失「定位感」：用户正处于「课程体系」页，顶栏却没有任何高亮或底线提示，无法一秒确认当前位置。",
        },
        {
          id: "B",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect y="4" width="320" height="60" fill="#041B36"/><rect y="4" width="44" height="60" fill="#02777D"/><circle cx="22" cy="34" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/><text x="58" y="26" fill="#EEF6FA" font-size="10">首页</text><text x="92" y="26" fill="#3AE0D2" font-size="10" font-weight="700">课程体系</text><rect x="92" y="30" width="40" height="2" fill="#1ACEBF"/><text x="142" y="26" fill="#EEF6FA" font-size="10">隐私条款</text><text x="192" y="26" fill="#EEF6FA" font-size="10">关于我们</text><text x="244" y="26" fill="#EEF6FA" font-size="10">学习资源</text><text x="58" y="52" fill="#EEF6FA" font-size="10">更新日志</text><text x="110" y="52" fill="#EEF6FA" font-size="10">实践项目</text><text x="162" y="52" fill="#EEF6FA" font-size="10">招聘启事</text><text x="214" y="52" fill="#EEF6FA" font-size="10">商务合作</text><text x="266" y="52" fill="#EEF6FA" font-size="10">个人中心</text></svg>`,
          feedback: "方案 B 虽然标亮了当前页，但混入了 5 项页脚低频链接导致顶栏膨胀成两行，破坏了「概览性」与「精简选项」原则，也侵占了首屏高度。",
        },
        {
          id: "C",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect y="12" width="320" height="44" fill="#041B36"/><rect y="12" width="44" height="44" fill="#02777D"/><circle cx="22" cy="34" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/><text x="74" y="38" fill="#DCE8F2" font-size="11">首页</text><text x="114" y="38" fill="#3AE0D2" font-size="11" font-weight="700">课程体系</text><rect x="114" y="47" width="44" height="3" fill="#1ACEBF"/><text x="174" y="38" fill="#DCE8F2" font-size="11">学习资源</text><text x="234" y="38" fill="#DCE8F2" font-size="11">实践项目</text><text x="288" y="38" fill="#DCE8F2" font-size="10">我的</text></svg>`,
          feedback: "回答正确！方案 C 保留 5 项逻辑清晰的核心入口、单行舒展不折行，并以亮青底线加字重明确标出「课程体系」的当前定位状态，同时满足四项设计原则。",
        },
        {
          id: "D",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect y="12" width="320" height="44" fill="#041B36"/><rect y="12" width="44" height="44" fill="#02777D"/><circle cx="22" cy="34" r="9" fill="none" stroke="#FFFFFF" stroke-width="2"/><rect x="272" y="21" width="36" height="26" rx="4" fill="none" stroke="#3AE0D2" stroke-width="1.4"/><line x1="281" y1="29" x2="299" y2="29" stroke="#FFFFFF" stroke-width="1.6"/><line x1="281" y1="34" x2="299" y2="34" stroke="#FFFFFF" stroke-width="1.6"/><line x1="281" y1="39" x2="299" y2="39" stroke="#FFFFFF" stroke-width="1.6"/></svg>`,
          feedback: "方案 D 在宽敞的 1280px 桌面屏上强行隐藏全部主导航，白白浪费横宽、剥夺了站点概览地图，并强迫用户每次跳转都多点一次菜单图标。",
        },
      ],
    },
    {
      prompt: "场景：同一套 5 项顶栏进入 390px 手机竖屏。以下四种窄屏适配方案品牌与内容区相同，只差顶部导航处理方式，哪一种最合理？",
      correct: "C",
      options: [
        {
          id: "A",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect x="64" y="10" width="192" height="48" rx="6" fill="#041B36"/><rect x="64" y="10" width="34" height="48" rx="5" fill="#02777D"/><circle cx="81" cy="34" r="7" fill="none" stroke="#FFFFFF" stroke-width="1.8"/><text x="106" y="38" fill="#3AE0D2" font-size="10.5">首页</text><text x="134" y="38" fill="#EEF6FA" font-size="10.5">课程体系</text><text x="182" y="38" fill="#EEF6FA" font-size="10.5">学习资源</text><text x="230" y="38" fill="#EEF6FA" font-size="10.5">实践</text><line x1="256" y1="10" x2="256" y2="58" stroke="#FF8A82" stroke-width="3"/></svg>`,
          feedback: "方案 A 在 390px 屏宽下不做折叠硬排文字，右侧「实践项目」「个人中心」直接被裁出视口边界，手机访客根本无法触达。",
        },
        {
          id: "B",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect x="64" y="10" width="192" height="48" rx="6" fill="#041B36"/><rect x="64" y="10" width="24" height="48" rx="5" fill="#02777D"/><circle cx="76" cy="34" r="5" fill="none" stroke="#FFFFFF" stroke-width="1.5"/><text x="93" y="37" fill="#3AE0D2" font-size="7.5">首页</text><text x="114" y="37" fill="#EEF6FA" font-size="7.5">课程体系</text><text x="150" y="37" fill="#EEF6FA" font-size="7.5">学习资源</text><text x="186" y="37" fill="#EEF6FA" font-size="7.5">实践项目</text><text x="222" y="37" fill="#EEF6FA" font-size="7.5">个人中心</text></svg>`,
          feedback: "方案 B 硬把字号压到微缩级别强塞单行，不仅阅读吃力，而且相邻触控区远小于 40–44px，手指一点就会同时误触两项。",
        },
        {
          id: "C",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect x="64" y="10" width="192" height="48" rx="6" fill="#041B36"/><rect x="64" y="10" width="38" height="48" rx="5" fill="#02777D"/><circle cx="83" cy="34" r="8" fill="none" stroke="#FFFFFF" stroke-width="1.8"/><text x="114" y="38" fill="#3AE0D2" font-size="11" font-weight="700">课程体系</text><rect x="188" y="19" width="58" height="30" rx="5" fill="rgba(255,255,255,0.12)" stroke="#3AE0D2" stroke-width="1.3"/><text x="208" y="38" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">菜单</text><line x1="226" y1="29" x2="238" y2="29" stroke="#FFFFFF" stroke-width="1.5"/><line x1="226" y1="34" x2="238" y2="34" stroke="#FFFFFF" stroke-width="1.5"/><line x1="226" y1="39" x2="238" y2="39" stroke="#FFFFFF" stroke-width="1.5"/></svg>`,
          feedback: "回答正确！方案 C 保留品牌归位与当前位置提示，并把完整频道列表优雅交接给带文字标签（「菜单」）、热区充足的响应式抽屉按钮。",
        },
        {
          id: "D",
          svg: `<svg viewBox="0 0 320 68"><rect width="320" height="68" fill="#FCF9F3"/><rect x="64" y="10" width="192" height="48" rx="6" fill="#FFFFFF" stroke="#9EB5AE" stroke-dasharray="4 3"/><text x="160" y="38" text-anchor="middle" fill="#374F61" font-size="11">（移动端移除顶栏，请滚到底部页脚）</text></svg>`,
          feedback: "方案 D 直接删掉移动端顶栏、逼用户滚完长页去页脚找入口，彻底丢失了顶部导航的全局可达性与定位感。",
        },
      ],
    },
  ];

  let curQ = 0;
  const answers = {};
  const tabs = document.querySelectorAll("#quiz-tabs [data-q]");
  const promptEl = document.getElementById("quiz-prompt");
  const optsEl = document.getElementById("quiz-options");
  const expEl = document.getElementById("quiz-explain");
  const verdictEl = document.getElementById("quiz-verdict");
  const reasonEl = document.getElementById("quiz-reason");
  const progEl = document.getElementById("quiz-progress");

  function renderQ(idx) {
    curQ = idx;
    const q = QUESTIONS[idx];
    promptEl.textContent = q.prompt;
    const picked = answers[idx];

    optsEl.innerHTML = q.options
      .map((o) => {
        let cls = "q-opt";
        let mark = "";
        if (picked) {
          if (o.id === picked && picked === q.correct) { cls += " is-picked-ok"; mark = "✓ 已选（正确）"; }
          else if (o.id === picked) { cls += " is-picked-bad"; mark = "× 已选"; }
          else if (o.id === q.correct) { cls += " is-picked-ok"; mark = "✓ 推荐方案"; }
        }
        return `<button type="button" class="${cls}" data-oid="${o.id}">
          <span class="q-opt-head"><span class="q-opt-label">方案 ${o.id}</span><span>${mark}</span></span>
          <span class="q-opt-svg">${o.svg}</span>
        </button>`;
      })
      .join("");

    if (picked) {
      const chosen = q.options.find((o) => o.id === picked);
      const isOk = picked === q.correct;
      expEl.hidden = false;
      expEl.classList.toggle("is-bad", !isOk);
      verdictEl.textContent = isOk ? `选对了：方案 ${picked}` : `再看一眼：你选了方案 ${picked}，最佳为方案 ${q.correct}`;
      reasonEl.textContent = chosen.feedback;
    } else {
      expEl.hidden = true;
    }

    tabs.forEach((t) => {
      const act = Number(t.dataset.q) === idx;
      t.classList.toggle("is-active", act);
      t.setAttribute("aria-selected", String(act));
    });
    const doneCount = Object.keys(answers).length;
    progEl.textContent = `已答 ${doneCount} / ${QUESTIONS.length} 题`;

    optsEl.querySelectorAll(".q-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[idx] = btn.dataset.oid;
        renderQ(idx);
      });
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => renderQ(Number(t.dataset.q))));
  renderQ(0);
}

// ---------- 07 节：原海报放大灯箱（支持缩放、拖拽平移、Esc 关闭） ----------
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const lb = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const zoomVal = document.getElementById("lb-zoom-val");
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
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    resetView();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnReset.addEventListener("click", resetView);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, +(scale + 0.35).toFixed(2)); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.7, +(scale - 0.35).toFixed(2)); applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.7, Math.min(3.4, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) { close(); return; }
    pan = { sx: e.clientX - tx, sy: e.clientY - ty };
    lbStage.classList.add("is-dragging");
    lbStage.setPointerCapture?.(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.sx;
    ty = e.clientY - pan.sy;
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => {
    pan = null;
    lbStage.classList.remove("is-dragging");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
