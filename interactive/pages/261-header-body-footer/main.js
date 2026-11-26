// 261 页眉—主体—页脚 主控脚本
// 连接单真源 model.js、开场 2D Canvas 舞台与七个知识交互模块。

import {
  MODULES,
  MODULE_ORDER,
  PRESETS,
  ZONE_KEYS,
  ZONE_LABELS,
  cloneState,
  computeLayout,
  createInitialState,
  findModuleZone,
  moveModule,
} from "./model.js";
import { createHeroStage } from "./stage.js";

// ==================== 1. 开场主角玩具状态与单真源联动 ====================
let state = createInitialState();

const heroCanvas = document.getElementById("heroCanvas");
const heroStatusPill = document.getElementById("heroStatusPill");
const tdbH = document.getElementById("tdbH");
const tdbB = document.getElementById("tdbB");
const tdbF = document.getElementById("tdbF");

const probeFraming = document.getElementById("probeFraming");
const probeFramingBadge = document.getElementById("probeFramingBadge");
const probeFramingMetric = document.getElementById("probeFramingMetric");
const probeSequence = document.getElementById("probeSequence");
const probeSequenceBadge = document.getElementById("probeSequenceBadge");
const probeSequenceMetric = document.getElementById("probeSequenceMetric");
const probeClosure = document.getElementById("probeClosure");
const probeClosureBadge = document.getElementById("probeClosureBadge");

const rosterList = document.getElementById("rosterList");
const moveTargetName = document.getElementById("moveTargetName");
const moveBtns = [...document.querySelectorAll("[data-move-zone]")];
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const stickyBtns = [...document.querySelectorAll("[data-sticky]")];
const lengthBtns = [...document.querySelectorAll("[data-length]")];
const stickyFooterBtn = document.getElementById("stickyFooterBtn");
const tourBtn = document.getElementById("tourBtn");

const diagHeadline = document.getElementById("diagHeadline");
const diagBody = document.getElementById("diagBody");
const diagHint = document.getElementById("diagHint");
const chkValFraming = document.getElementById("chkValFraming");
const chkValSequence = document.getElementById("chkValSequence");
const chkValClosure = document.getElementById("chkValClosure");
const chkValHierarchy = document.getElementById("chkValHierarchy");
const checksRows = [...document.querySelectorAll("#posterChecksList li")];
const emblemDots = document.getElementById("emblemDots");
const emblemCaption = document.getElementById("emblemCaption");

// 初始化右下包豪斯 5×5 金点阵 SVG
const dotNodes = [];
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(104 + c * 14));
    circle.setAttribute("cy", String(20 + r * 14));
    circle.setAttribute("r", "2.6");
    circle.setAttribute("fill", "#3C423A");
    emblemDots.append(circle);
    dotNodes.push(circle);
  }
}

let lastUiKey = "";
let lastTourRunning = false;

function setState(next, opts = {}) {
  state = next;
  const layout = computeLayout(state);
  syncHeroUI(layout);
  if (!opts.silentStage) stage.markDirty();
}

const stage = createHeroStage(heroCanvas, () => state, setState);

function syncHeroUI(layout) {
  const touring = stage.isTouring();
  if (touring !== lastTourRunning) {
    lastTourRunning = touring;
    tourBtn.classList.toggle("is-running", touring);
    tourBtn.textContent = touring ? "停止巡检 Space" : "滚动巡检 Space";
  }

  // 仅当结构、模块、模式或选中项真的变化时才写 DOM；纯滚动拖移（只变 scrollNorm）做到 0 DOM 写入、0 回流
  const uiKey = [
    state.scene,
    state.stickyMode,
    state.docLength,
    state.stickyFooter ? 1 : 0,
    state.selectedMod || "",
    state.highlightBand || "",
    state.zones.header.join(","),
    state.zones.body.join(","),
    state.zones.footer.join(","),
    layout.header.h,
    layout.body.h,
    layout.footer.h,
    layout.sticky.height,
    layout.statusTag,
  ].join("|");
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;

  // 顶带状态章 + 自示范三段比例条
  heroStatusPill.textContent = layout.statusTag;
  heroStatusPill.classList.toggle("is-ok", layout.passCount === 4);

  const hPct = Math.max(layout.header.pctDoc, 0);
  const fPct = Math.max(layout.footer.pctDoc, 0);
  const bPct = Math.max(0, 100 - hPct - fPct);
  tdbH.textContent = `眉 ${hPct}%`;
  tdbB.textContent = `主 ${bPct}%`;
  tdbF.textContent = `脚 ${fPct}%`;
  tdbH.style.flexGrow = String(Math.max(12, hPct));
  tdbB.style.flexGrow = String(Math.max(24, bPct));
  tdbF.style.flexGrow = String(Math.max(12, fPct));

  // 三大原海报探针同步（全部单真源读数）
  const [cF, cS, cC, cH] = layout.checks;
  probeFramingBadge.textContent = cF.badge;
  probeFramingBadge.className = `probe-state ${cF.ok ? "is-ok" : "is-bad"}`;
  probeFramingMetric.textContent = `实测页眉 ${layout.header.h}px · 占视口 ${layout.header.pctVp}%${layout.sticky.height ? ` · 吸顶 ${layout.sticky.height}px` : ""}`;

  probeSequenceBadge.textContent = cS.badge;
  probeSequenceBadge.className = `probe-state ${cS.ok ? "is-ok" : "is-bad"}`;
  probeSequenceMetric.textContent = `首屏主体 ${layout.body.pctFirstFold}% · 滚屏净窗 ${layout.sticky.clearPct}%`;

  probeClosureBadge.textContent = cC.badge;
  probeClosureBadge.className = `probe-state ${cC.ok ? "is-ok" : "is-bad"}`;

  // 高亮按钮按下态
  probeFraming.setAttribute("aria-pressed", String(state.highlightBand === "header"));
  probeSequence.setAttribute("aria-pressed", String(state.highlightBand === "body"));
  probeClosure.setAttribute("aria-pressed", String(state.highlightBand === "footer"));

  // 底带诊断文案
  diagHeadline.textContent = layout.headline;
  diagBody.textContent = layout.explanation;
  diagHint.textContent = layout.nextHint;

  // 四条金点协同原则灯
  const vals = [chkValFraming, chkValSequence, chkValClosure, chkValHierarchy];
  layout.checks.forEach((chk, i) => {
    checksRows[i].classList.toggle("is-ok", chk.ok);
    vals[i].textContent = chk.badge;
  });

  // 包豪斯 5×5 金点阵按 0..4 分逐排点亮
  const litRows = layout.passCount === 4 ? 5 : layout.passCount;
  dotNodes.forEach((node, idx) => {
    const row = Math.floor(idx / 5);
    const active = row < litRows;
    node.setAttribute("fill", active ? "#F6B719" : "#3C423A");
  });
  emblemCaption.textContent = `${layout.passCount} / 4 ALIGNED`;

  // 场景、吸顶、篇幅、粘底按钮同步
  sceneBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
  stickyBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.sticky === state.stickyMode));
  lengthBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.length === state.docLength));
  stickyFooterBtn.setAttribute("aria-pressed", String(state.stickyFooter));
  stickyFooterBtn.textContent = `粘底锁：${state.stickyFooter ? "开" : "关"}`;
  tourBtn.classList.toggle("is-running", stage.isTouring());
  tourBtn.textContent = stage.isTouring() ? "停止巡检 Space" : "滚动巡检 Space";

  // 6 枚部件归位清单
  const sel = state.selectedMod || MODULE_ORDER[0];
  rosterList.innerHTML = MODULE_ORDER.map((id, idx) => {
    const m = MODULES[id];
    const z = findModuleZone(state, id);
    const isOk = z === m.ideal || (id === "search" && z === "footer");
    const isSel = id === sel;
    return `<button type="button" class="roster-item ${isSel ? "is-selected" : ""} ${isOk ? "" : "is-wrong"}" data-pick-mod="${id}">
      <span class="ri-name"><span class="ri-num">${idx + 1}</span>${m.title}</span>
      <span class="ri-zone ${isOk ? "is-ok" : "is-bad"}">${z ? ZONE_LABELS[z].zh : "未放"}</span>
    </button>`;
  }).join("");

  const selZone = findModuleZone(state, sel);
  moveTargetName.textContent = `已选：${MODULES[sel].title}（当前在${selZone ? ZONE_LABELS[selZone].zh : "空"}）`;
  moveBtns.forEach((b) => b.classList.toggle("is-current", b.dataset.moveZone === selZone));
}

// 绑定开场交互事件
[probeFraming, probeSequence, probeClosure].forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.highlight;
    setState({ ...state, highlightBand: state.highlightBand === target ? null : target });
  });
});

sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => setState({ ...state, scene: btn.dataset.scene }));
});

stickyBtns.forEach((btn) => {
  btn.addEventListener("click", () => setState({ ...state, stickyMode: btn.dataset.sticky }));
});

lengthBtns.forEach((btn) => {
  btn.addEventListener("click", () => setState({ ...state, docLength: btn.dataset.length, scrollNorm: btn.dataset.length === "short" ? 0 : state.scrollNorm }));
});

stickyFooterBtn.addEventListener("click", () => {
  setState({ ...state, stickyFooter: !state.stickyFooter });
});

tourBtn.addEventListener("click", () => {
  stage.toggleTour();
  syncHeroUI(computeLayout(state));
});

rosterList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-pick-mod]");
  if (!btn) return;
  setState({ ...state, selectedMod: btn.dataset.pickMod });
});

moveBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modId = state.selectedMod || MODULE_ORDER[0];
    setState(moveModule(state, modId, btn.dataset.moveZone));
  });
});

document.getElementById("fixClassicBtn").addEventListener("click", () => {
  setState(cloneState(PRESETS.classic.state));
});

document.getElementById("resetBrokenBtn").addEventListener("click", () => {
  setState(cloneState(PRESETS.broken.state));
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState(cloneState(p.state));
  });
});

// 键盘操作：1-6 选部件，↑/↓ 跨段移动选中部件，←/→ 微调滚动位置，Space 自动巡检
window.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  if (!document.getElementById("lightbox").hidden) {
    if (e.key === "Escape") closeLightbox();
    return;
  }
  const num = Number(e.key);
  if (num >= 1 && num <= 6) {
    setState({ ...state, selectedMod: MODULE_ORDER[num - 1] });
    return;
  }
  if (e.code === "Space" && document.activeElement?.tagName !== "BUTTON") {
    const rect = heroCanvas.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      e.preventDefault();
      stage.toggleTour();
      syncHeroUI(computeLayout(state));
    }
    return;
  }
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    const rect = heroCanvas.getBoundingClientRect();
    if (state.selectedMod && rect.top < window.innerHeight && rect.bottom > 0 && document.activeElement === heroCanvas) {
      e.preventDefault();
      const curZ = findModuleZone(state, state.selectedMod) || "body";
      const idx = ZONE_KEYS.indexOf(curZ);
      const nextIdx = Math.max(0, Math.min(2, idx + (e.key === "ArrowDown" ? 1 : -1)));
      setState(moveModule(state, state.selectedMod, ZONE_KEYS[nextIdx]));
    }
  } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && document.activeElement === heroCanvas) {
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 0.08 : -0.08;
    setState({ ...state, scrollNorm: Math.max(0, Math.min(1, state.scrollNorm + step)) });
  }
});

// 让画布支持键盘聚焦
heroCanvas.setAttribute("tabindex", "0");
syncHeroUI(computeLayout(state));

// ==================== 2. 01 节：三层解剖视图切换 ====================
const ANATOMY_LAYERS = {
  visual: {
    header: {
      desc: "高对比色带或清晰顶线在第一眼框定全站身份：标志回首页、主导航指方向、搜索接住明确意图。它像书的封面与书眉，轻而稳，从不抢占首屏主角。",
      meta: "经验预算：约 52–96px（首屏占比 ≤16%）",
    },
    body: {
      desc: "整页唯一属于当前页面的独特内容。先立核心主张与主图，再以卡片、列表或段落展开细节，让视线顺着竖轴自然推进，中途不被站级杂项打断。",
      meta: "经验预算：首屏有效区 ≥62%，整页主干 ≥55%",
    },
    footer: {
      desc: "明度骤降或虚线隔断的底带向大脑发出「正文到此结束」的清晰信号，同时接住滑到底却还没找到答案的读者：次级目录、联系客服、隐私与版权凭据。",
      meta: "经验预算：克制收束，短页须稳贴视口底沿",
    },
  },
  mental: {
    header: {
      desc: "回答读者的第一问：「我到了哪家网站？能去哪些大栏目？」一致的页眉让用户跨页面跳转时不必重新摸索，显著降低认知负担。",
      meta: "心智角色：空间坐标与全站路由（Framing）",
    },
    body: {
      desc: "回答核心问题：「这一页要告诉我什么？」单向清晰的层次节奏减少回扫与犹豫，让阅读精力全部花在理解内容本身。",
      meta: "心智角色：核心叙事与任务主舞台（Sequence）",
    },
    footer: {
      desc: "回答收尾问题：「读完了下一步去哪？这家站点可信吗？」研究表明用户频繁直奔页底寻找客服、帮助或次级入口（NN/g，2019）。",
      meta: "心智角色：兜底安全网与信任闭合（Closure）",
    },
  },
  semantic: {
    header: {
      desc: "使用顶层 <header>（隐式对应 WAI-ARIA role=\"banner\"），全页通常只设一个，集中放站点标志、主导航 <nav> 与全站搜索。",
      meta: "DOM 地标：<header> → banner（W3C HTML5 / ARIA 1.0）",
    },
    body: {
      desc: "使用唯一的 <main>（隐式对应 role=\"main\"），包裹本页独有主体内容。屏幕阅读器用户和键盘党可借跳过链接直达此处。",
      meta: "DOM 地标：<main> → main（每页仅一个可见主地标）",
    },
    footer: {
      desc: "使用顶层 <footer>（隐式对应 role=\"contentinfo\"），承载版权、隐私协议、站级声明与延伸链接，与正文 <main> 清晰解耦。",
      meta: "DOM 地标：<footer> → contentinfo（顶层页脚地标）",
    },
  },
};

const layerTabBtns = [...document.querySelectorAll("[data-layer]")];
layerTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.layer;
    layerTabBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    const data = ANATOMY_LAYERS[key];
    for (const band of ["header", "body", "footer"]) {
      const card = document.querySelector(`.anatomy-card[data-band="${band}"]`);
      card.querySelector('[data-field="desc"]').textContent = data[band].desc;
      card.querySelector('[data-field="meta"]').textContent = data[band].meta;
    }
  });
});

// ==================== 3. 02 节：历史源流与屏幕阅读器地标视角 ====================
const ERAS = {
  print: {
    title: "印刷书的书眉（Running Head）与页码（Folio）",
    p1: "早在文艺复兴时期的印刷书籍里，版面设计师就用顶部「书眉」标出书名或章节、中部排正文、底部落页码。版心上下两条细带既像路标，又把书页从空白纸边里锚定下来。",
    p2: "Robert Bringhurst 在《字体排印风格要素》（The Elements of Typographic Style，1992 首版）中形容，书眉在跨页重复出现，是为了提醒读者「此刻正造访哪片知识街区」——但像连贯小说这类单线叙事，若结构已自明，就不必硬添多余书眉。",
    source: "核实来源：Robert Bringhurst, The Elements of Typographic Style（Hartley & Marks，1992 首版）",
    sighted: [
      { cls: "xb-h", tag: "书眉 · RUNNING HEAD", role: "第四章 · 比例与节奏", err: false },
      { cls: "xb-b", tag: "书页正文版心", role: "连续段落与章节层级，四周保留古典页边留白。", err: false },
      { cls: "xb-f", tag: "页码 · FOLIO", role: "— 148 —", err: false },
    ],
    sr: [
      { cls: "xb-blind", tag: "纸本印刷时代", role: "仅靠视觉位置区分", err: false },
      { cls: "xb-b", tag: "人眼扫读习惯已定型", role: "顶看章节、中读正文、底查页码的肌肉记忆，后来直接迁移到第一代网页浏览器。", err: false },
    ],
    metricSighted: "视觉特征：顶部轻标语境、中部留给文本、底部放页码定位。",
    metricSr: "关键启发：网页直接继承了读者几百年来「上坐标—中正文—下收尾」的阅读预期。",
  },
  divsoup: {
    title: "早期表格排版与 <div id=\"header\"> 匿名盒子时代",
    p1: "20 世纪末到 2000 年代中期，网页先用 <table> 拼出顶行、主单元格和底行，后来演进为 CSS 配合 <div id=\"header\">、<div id=\"content\">、<div id=\"footer\">。",
    p2: "肉眼看去三段清清楚楚，但对浏览器和屏幕阅读器来说，<div> 没有任何语义——每打开一个新页面，盲人用户不得不从头逐条听完十几个顶栏链接，才能艰难摸到正文第一行。",
    source: "核实来源：W3C HTML5 制定背景（从无语义 div 向结构元素演进）",
    sighted: [
      { cls: "xb-h", tag: "顶部蓝条（div#header）", role: "Logo + 12 个导航链接", err: false },
      { cls: "xb-b", tag: "中间正文区（div#content）", role: "肉眼可见的主体文章与图片卡片", err: false },
      { cls: "xb-f", tag: "底部灰条（div#footer）", role: "版权声明与友情链接", err: false },
    ],
    sr: [
      { cls: "xb-blind", tag: "无语义通用容器 <div>", role: "跳过失败 · 需连按 14 次 Tab（示意）", err: true },
      { cls: "xb-blind", tag: "无语义通用容器 <div>", role: "读屏无法识别这里才是主内容", err: true },
      { cls: "xb-blind", tag: "无语义通用容器 <div>", role: "读屏无法直达隐私与联系页脚", err: true },
    ],
    metricSighted: "外观达标：三段视觉边界已经成型，但底层标记只是三个匿名盒子。",
    metricSr: "无障碍隐患：缺少地标角色，键盘与读屏用户每次换页都被困在重复导航里。",
  },
  html5: {
    title: "2014 年双标准落地：HTML5 与 WAI-ARIA 1.0 地标",
    p1: "2014 年 3 月，W3C 正式发布 WAI-ARIA 1.0 推荐标准，确立了 banner、main、contentinfo 等页面地标角色；同年 10 月 28 日，HTML5 正式成为 W3C 推荐标准（<main> 约在 2012 年进入草案并固化）。",
    p2: "顶层的 <header>、<main>、<footer> 从此不再只是写给程序员看的注释，而是自动映射到无障碍地标树：辅助工具可以一键列出整页三个地标，按一次快捷键就越过页眉直奔主体。",
    source: "核实来源：W3C WAI-ARIA 1.0（2014-03-20）与 W3C HTML5 Recommendation（2014-10-28）",
    sighted: [
      { cls: "xb-h", tag: "<header>", role: "顶栏品牌与导航", err: false },
      { cls: "xb-b", tag: "<main>", role: "页面独有主体内容，唯一主焦点", err: false },
      { cls: "xb-f", tag: "<footer>", role: "次级路由、联系与隐私声明", err: false },
    ],
    sr: [
      { cls: "xb-h", tag: "地标 1 · banner", role: "自动映射 <header>", err: false },
      { cls: "xb-b", tag: "地标 2 · main（一键直达）", role: "只需 1 步快捷键跳过页眉直奔正文第一句！", err: false },
      { cls: "xb-f", tag: "地标 3 · contentinfo", role: "自动映射 <footer>", err: false },
    ],
    metricSighted: "结构升级：视觉三段与文档语义树第一次严丝合缝。",
    metricSr: "无障碍收益：从十余次 Tab 盲摸，缩短为 1 次地标直达（示意）。",
  },
  modern: {
    title: "当代响应与动态布局：Flex / Grid 锁稳三段",
    p1: "如今 WHATWG HTML Living Standard 持续维护 <header>、<main>、<footer> 的嵌套规范（例如放在 <article> 内部的 <header> 不会抢占全页 banner 地标）。",
    p2: "配合 CSS Grid（grid-template-rows: auto 1fr auto）或 Flexbox（min-height: 100svh + flex: 1），三段式架构不再需要陈旧的负外边距技巧，就能在手机、平板与超宽屏上同时稳住紧凑页眉与粘底页脚。",
    source: "核实来源：WHATWG HTML Living Standard §4.3.8 / §4.3.9 / §4.4.14",
    sighted: [
      { cls: "xb-h", tag: "header { grid-row: auto }", role: "紧凑响应顶栏", err: false },
      { cls: "xb-b", tag: "main { grid-row: 1fr }", role: "短页自动撑高，长页顺畅滚动", err: false },
      { cls: "xb-f", tag: "footer { grid-row: auto }", role: "永远稳压底沿、不浮空", err: false },
    ],
    sr: [
      { cls: "xb-h", tag: "唯一 banner 地标", role: "外加「跳至正文」隐藏链接", err: false },
      { cls: "xb-b", tag: "唯一 main 地标", role: "内部 <article> 的小 header 不污染全页地标", err: false },
      { cls: "xb-f", tag: "唯一 contentinfo 地标", role: "跨全站保持一致，随时可按地标跳转兜底", err: false },
    ],
    metricSighted: "工程完备：3 行现代 CSS 即可解决过去困扰前端十年的短页页脚悬空问题。",
    metricSr: "规范提醒：不要在 <main> 里再乱嵌套多余的 role=\"banner\"，保持每页三个顶层地标清晰唯一。",
  },
};

let currentEra = "print";
let currentXrayView = "sighted";
const eraCopyEl = document.getElementById("eraCopy");
const xrayScreenEl = document.getElementById("xrayScreen");
const xrayMetricEl = document.getElementById("xrayMetric");

function renderEra() {
  const e = ERAS[currentEra];
  eraCopyEl.innerHTML = `<h3>${e.title}</h3><p>${e.p1}</p><p>${e.p2}</p><p class="era-source">${e.source}</p>`;
  const rows = currentXrayView === "sighted" ? e.sighted : e.sr;
  xrayScreenEl.innerHTML = rows
    .map(
      (r) => `<div class="xray-band ${r.cls}">
      <span class="xray-tag">${r.tag}</span>
      <span class="xray-role ${r.err ? "is-err" : ""}">${r.role}</span>
    </div>`
    )
    .join("");
  xrayMetricEl.textContent = currentXrayView === "sighted" ? e.metricSighted : e.metricSr;
}

document.querySelectorAll("[data-era]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentEra = btn.dataset.era;
    document.querySelectorAll("[data-era]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra();
  });
});

document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentXrayView = btn.dataset.view;
    document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderEra();
  });
});
renderEra();

// ==================== 4. 03 节：真实可滚微网页吸顶与粘底实验室 ====================
const mechViewport = document.getElementById("mechViewport");
const mechScrollBox = document.getElementById("mechScrollBox");
const mechDoc = document.getElementById("mechDoc");
const mdHeader = document.getElementById("mdHeader");
const mdHExtra = document.getElementById("mdHExtra");
const mdMain = document.getElementById("mdMain");
const mechCssCode = document.getElementById("mechCssCode");
const mechVerdict = document.getElementById("mechVerdict");
const mechExplain = document.getElementById("mechExplain");
const mechHudPos = document.getElementById("mechHudPos");
const mechHudClear = document.getElementById("mechHudClear");

const mechState = {
  device: "mobile",
  sticky: "bloated", // static | bloated | compact | reveal
  doc: "long", // long | short-no-lock | short-locked
  lastScroll: 0,
  hiddenUp: false,
};

const LONG_CARDS = [
  ["一、页眉只放高频路由", "Page Laubheimer（NN/g，2021）指出，吸顶栏每一像素都从正文嘴里抢来；如果用户滚屏时很少点它，就别让它粘在顶上。"],
  ["二、压缩吸顶高度", "真需要吸顶时，把副横幅、大搜索框收起，只保留约 44–56px 的单行标识与核心入口。"],
  ["三、高对比不串色", "滚动经过浅色正文与深色大图时，吸顶页眉必须自带不透明底色与清晰底线，避免字压字。"],
  ["四、半持久上滑再现", "向下读正文时隐藏页眉让出 100% 视口，一旦用户轻轻向上回拉，页眉立刻温和回归。"],
  ["五、页脚负责兜底收束", "读完全文到底部，深色高对比页脚明确告诉视线「故事到此结束」，并提供隐私与联系出口。"],
];

const SHORT_CARDS = [
  ["操作已提交", "您的预约回执编号为 #261-09。只有三行字时，最能检验页面有没有做好粘底页脚。"],
];

function renderMech() {
  mechViewport.classList.toggle("is-mobile", mechState.device === "mobile");
  mechViewport.classList.toggle("is-desktop", mechState.device === "desktop");

  const isShort = mechState.doc !== "long";
  const cards = isShort ? SHORT_CARDS : LONG_CARDS;
  mdMain.innerHTML = cards.map(([h, p]) => `<div class="md-card"><h4>${h}</h4><p>${p}</p></div>`).join("");

  mechDoc.classList.toggle("is-sticky-footer", mechState.doc === "short-locked");

  const showExtra = mechState.sticky === "bloated";
  mdHExtra.hidden = !showExtra;

  const isStickyCss = mechState.sticky !== "static";
  mdHeader.classList.toggle("is-sticky", isStickyCss);
  if (mechState.sticky !== "reveal") {
    mechState.hiddenUp = false;
    mdHeader.classList.remove("is-hidden-up");
  }

  // 实时计算实测高度与 CSS 代码
  const vpH = mechScrollBox.clientHeight || 360;
  const hH = mdHeader.offsetHeight || (showExtra ? 112 : 44);
  const occPct = isStickyCss && !mechState.hiddenUp ? Math.round((hH / vpH) * 100) : 0;
  const clearPct = 100 - occPct;

  if (mechState.doc === "short-no-lock") {
    mechCssCode.textContent = `body {\n  /* 未设最小高度撑满 */\n  display: block;\n}\n/* 结果：短页下页脚悬在视口半腰 */`;
    mechVerdict.textContent = "短页页脚悬空";
    mechVerdict.className = "code-badge";
    mechExplain.textContent = "内容只有一张小卡时，页脚紧贴在正文下面飘在半空中，底部留出一大片无意义的空白断层。";
  } else if (mechState.doc === "short-locked") {
    mechCssCode.textContent = `.page {\n  min-height: 100%;\n  display: grid;\n  grid-template-rows: auto 1fr auto;\n}`;
    mechVerdict.textContent = "1fr 稳稳粘底";
    mechVerdict.className = "code-badge is-ok";
    mechExplain.textContent = "只要把主体轨道设为 1fr（或 Flex 的 flex: 1），内容再短也会把页脚稳稳推到视口底沿，绝不悬空。";
  } else if (mechState.sticky === "bloated") {
    mechCssCode.textContent = `header {\n  position: sticky; top: 0;\n  /* 搜索框+促销条全塞进去，高达 ${hH}px */\n}`;
    mechVerdict.textContent = `吸顶吞屏 ${occPct}%`;
    mechVerdict.className = "code-badge";
    mechExplain.textContent = `厚重吸顶持续吃掉 ${occPct}% 视口高度，在手机屏上正文只剩一条窄缝，迫使用户频繁短促划屏。`;
  } else if (mechState.sticky === "compact") {
    mechCssCode.textContent = `header {\n  position: sticky; top: 0;\n  height: 44px; /* 收起副栏，留出 ${clearPct}% 阅读区 */\n}`;
    mechVerdict.textContent = `紧凑吸顶 · 净窗 ${clearPct}%`;
    mechVerdict.className = "code-badge is-ok";
    mechExplain.textContent = "剥离促销条与大搜索框后，页眉缩成单行细条，随时可导航又不压迫正文。";
  } else if (mechState.sticky === "reveal") {
    mechCssCode.textContent = `/* 下滑阅读时隐藏，轻轻上滑立刻回归 */\nheader.is-hidden-up {\n  transform: translateY(-100%);\n}`;
    mechVerdict.textContent = "上滑再现 · 下滑 100% 净窗";
    mechVerdict.className = "code-badge is-ok";
    mechExplain.textContent = "这是 NN/g（2021）推荐的半持久策略：往下读时把 100% 屏幕还给文章，刚往回划一点，导航就迎上来。";
  } else {
    mechCssCode.textContent = `header {\n  position: static;\n  /* 随页面自然滚出视口，0% 遮挡 */\n}`;
    mechVerdict.textContent = "随滚离开 · 净窗 100%";
    mechVerdict.className = "code-badge is-ok";
    mechExplain.textContent = "不滥用吸顶，是最轻盈的默认选择——长文与展示页滚下来后整块屏幕全部归正文所有。";
  }

  updateMechHud();
}

function updateMechHud() {
  const st = Math.round(mechScrollBox.scrollTop);
  const vpH = mechScrollBox.clientHeight || 360;
  const hH = mdHeader.offsetHeight || 44;
  const stickyActive = mechState.sticky !== "static" && st > 4 && !mechState.hiddenUp;
  const topUsed = stickyActive ? hH : Math.max(0, hH - st);
  const clearPct = Math.max(0, Math.min(100, Math.round(((vpH - topUsed) / vpH) * 100)));
  mechHudPos.textContent = `已滚 ${st}px`;
  mechHudClear.textContent = `净阅读区 ${clearPct}%`;
}

mechScrollBox.addEventListener("scroll", () => {
  const cur = mechScrollBox.scrollTop;
  if (mechState.sticky === "reveal") {
    if (cur > mechState.lastScroll + 6 && cur > 40) {
      mechState.hiddenUp = true;
      mdHeader.classList.add("is-hidden-up");
    } else if (cur < mechState.lastScroll - 4 || cur <= 16) {
      mechState.hiddenUp = false;
      mdHeader.classList.remove("is-hidden-up");
    }
  }
  mechState.lastScroll = cur;
  updateMechHud();
});

document.querySelectorAll("[data-device]").forEach((b) => {
  b.addEventListener("click", () => {
    mechState.device = b.dataset.device;
    document.querySelectorAll("[data-device]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderMech();
  });
});
document.querySelectorAll("[data-msticky]").forEach((b) => {
  b.addEventListener("click", () => {
    mechState.sticky = b.dataset.msticky;
    document.querySelectorAll("[data-msticky]").forEach((x) => x.classList.toggle("is-active", x === b));
    renderMech();
  });
});
document.querySelectorAll("[data-mdoc]").forEach((b) => {
  b.addEventListener("click", () => {
    mechState.doc = b.dataset.mdoc;
    document.querySelectorAll("[data-mdoc]").forEach((x) => x.classList.toggle("is-active", x === b));
    mechScrollBox.scrollTop = 0;
    renderMech();
  });
});
document.getElementById("mechScrollTop").addEventListener("click", () => { mechScrollBox.scrollTop = 0; updateMechHud(); });
document.getElementById("mechScrollMid").addEventListener("click", () => { mechScrollBox.scrollTop = Math.round(mechScrollBox.scrollHeight * 0.36); updateMechHud(); });
document.getElementById("mechScrollBot").addEventListener("click", () => { mechScrollBox.scrollTop = mechScrollBox.scrollHeight; updateMechHud(); });
renderMech();

// ==================== 5. 04 节：NN/g 2019 四类页脚任务配对工坊 ====================
const FOOTER_PATTERNS = {
  checkout: {
    pattern: "极简版权条（Minimal Footer）",
    headerText: "仅留品牌标 + 安全支付锁（隐藏全站多级菜单）",
    bodyText: "收货地址 · 支付方式 · 订单金额汇总 · 唯一主按钮「立即付款」",
    footerHtml: `<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span>© 安心商城 · 隐私政策 · 退换条款</span><span>客服 400-000-0261</span></div>`,
    why: "结账、注册等高聚焦转化页最怕节外生枝。页脚只保留法律底线、加密信任标识和紧急客服，绝不塞进博客、招聘或商品分类，避免把准备付款的人拉出漏斗。",
    avoid: "反面踩坑：在结账页底塞入 4 栏 30 个营销链接，用户顺手点去「品牌故事」，购物车直接流失。",
  },
  portal: {
    pattern: "多栏门垫式页脚（Fat / Doormat Footer）",
    headerText: "品牌标 · 产品 · 解决方案 · 文档 · 定价 · 搜索",
    bodyText: "主推专题与多层知识目录（大型网站的一级导航放不下所有深层入口）",
    footerHtml: `<div class="fm-f-cols">
      <div><strong>产品矩阵</strong><span>设计系统</span><span>组件规范</span><span>更新日志</span></div>
      <div><strong>支持与帮助</strong><span>常见问题</span><span>工单客服</span><span>服务状态</span></div>
      <div><strong>关于机构</strong><span>加入我们</span><span>媒体资料</span><span>隐私与合规</span></div>
    </div><div style="border-top:1px solid #3C423A;padding-top:6px;font-size:11px;color:#D5CCB9">© 站点档案 · 清晰分栏、直白标题，不堆整站死链接</div>`,
    why: "大型文档、电商与企业站信息层级深，用户在顶栏没找到入口时常直接拉到底找「安全网」。NN/g（2019）指出，把次级链接按大白话分栏归组，能大幅提升查找成功率（但除非全站不到 25 页，否则别把完整站点地图生搬硬塞进去）。",
    avoid: "反面踩坑：用晦涩文艺词当栏目标题，或把几十条杂乱链接无分组堆成一面文字墙。",
  },
  feed: {
    pattern: "微型辅助页脚（Mini / Side Utility Footer）",
    headerText: "品牌标 · 推荐 / 关注切换 · 检索框",
    bodyText: "动态加载的信息流卡片（往下滑不断续出新内容，传统页底永远追不到）",
    footerHtml: `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span style="color:#F6B719;font-weight:700">侧边常驻微脚 / 底部展开条</span><span>关于 · 条款 · 隐私 · 举报 · © 2026</span></div>`,
    why: "无限滚动流里，传统页脚每次刚露头就被新加载的卡片顶飞。必须把必要条款与帮助抽离成轻量微型页脚（或置于侧栏底部），或者改用「加载更多」按钮给页脚留出可停驻的着陆点。",
    avoid: "反面踩坑：明知页面无限滚动，仍把客服电话和退订入口藏在永远够不着的传统页脚里。",
  },
  member: {
    pattern: "语境化页脚（Contextual Footer）",
    headerText: "工作台标识 · 当前项目 · 账号菜单",
    bodyText: "不同频道或登录态下，用户读到页尾时下一步需求并不相同",
    footerHtml: `<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span><strong>当前语境（已登录）：</strong>快捷键表 · API 状态 · 联系专属顾问</span><span style="color:#F6B719">切换语言 · 隐私与许可</span></div>`,
    why: "同一座网站里，未登录访客在页尾需要的是「试用入口与案例」，而已登录会员需要的是「工单、文档状态与快捷键」。在保持底部一致骨架的前提下，微调次级任务区能显著提高页脚实用度。",
    avoid: "反面踩坑：每换一个频道就把页脚位置、颜色和法律链接彻底改样，破坏用户的全局记忆。",
  },
};

const footerMatchPanel = document.getElementById("footerMatchPanel");
function renderFooterMatch(key) {
  const f = FOOTER_PATTERNS[key];
  footerMatchPanel.innerHTML = `
    <div class="fm-blueprint">
      <div class="fm-mini-h"><span>页眉 HEADER</span><span>${f.headerText}</span></div>
      <div class="fm-mini-b"><strong>主体 BODY：</strong>${f.bodyText}</div>
      <div class="fm-mini-f">${f.footerHtml}</div>
    </div>
    <div class="fm-copy">
      <h3>推荐：${f.pattern}</h3>
      <p>${f.why}</p>
      <div class="fm-avoid">${f.avoid}</div>
    </div>`;
}
document.querySelectorAll("[data-task]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-task]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderFooterMatch(btn.dataset.task);
  });
});
renderFooterMatch("checkout");

// ==================== 6. 05 节：什么时候别用三段式（双态翻转对照） ====================
const ANTI_CASES = [
  {
    id: "canvas",
    title: "全屏地图、白板与创作画布",
    badText: "<strong>硬套三段：</strong>厚重页眉与高页脚从上下夹扁画布，缩放拖拽空间支离破碎，用户根本不需要滚到底看版权。",
    goodText: "<strong>破局解法：</strong>让画布占满 100% 视口，仅用轻量悬浮工具条与角落图例，把法律信息收进角落「关于」弹窗。",
    badSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect width="460" height="30" fill="#F6B719"/><text x="230" y="19" text-anchor="middle" font-size="12" font-weight="700" fill="#141412">厚页眉（占去宝贵上方视野）</text><rect x="0" y="30" width="460" height="58" fill="#FAF5EC"/><line x1="20" y1="59" x2="440" y2="59" stroke="#C8BDB0" stroke-dasharray="5 4"/><text x="230" y="63" text-anchor="middle" font-size="12" fill="#B52B1E" font-weight="700">地图 / 画布被上下夹成细窄一条</text><rect x="0" y="88" width="460" height="36" fill="#171A16"/><text x="230" y="110" text-anchor="middle" font-size="12" fill="#F6B719">多栏页脚（挤压交互画布）</text></svg>`,
    goodSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect width="460" height="124" fill="#FAF5EC"/><path d="M18 98 Q120 26 240 70 T442 26" fill="none" stroke="#D99F15" stroke-width="3.5"/><circle cx="240" cy="70" r="5" fill="#141412"/><rect x="14" y="12" width="136" height="26" fill="#171A16"/><text x="82" y="29" text-anchor="middle" font-size="11" fill="#F6B719" font-weight="700">轻量悬浮搜索与工具</text><rect x="348" y="92" width="98" height="22" fill="#EDDDC2" stroke="#141412"/><text x="397" y="107" text-anchor="middle" font-size="11" fill="#141412" font-weight="600">缩放 · 关于弹窗</text></svg>`,
  },
  {
    id: "infinite",
    title: "无限滚动的社交与资讯流",
    badText: "<strong>硬套三段：</strong>用户刚瞄见页脚就被新加载的帖子推走，变成「永远追不上的海市蜃楼」，投诉无门。",
    goodText: "<strong>破局解法：</strong>要么改用「点击加载更多」让页脚可停靠，要么把精简版条款与帮助移到固定侧边栏底部。",
    badSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect width="460" height="22" fill="#F6B719"/><rect x="34" y="28" width="392" height="22" fill="#FAF5EC" stroke="#C8BDB0"/><rect x="34" y="56" width="392" height="22" fill="#FAF5EC" stroke="#C8BDB0"/><rect x="34" y="84" width="392" height="20" fill="#FDECE9" stroke="#B52B1E" stroke-dasharray="4 3"/><text x="230" y="98" text-anchor="middle" font-size="11" fill="#B52B1E" font-weight="700">↓ 新内容不断加载，把页脚无限顶出屏幕 ↓</text><rect x="0" y="110" width="460" height="14" fill="#171A16"/></svg>`,
    goodSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect width="460" height="22" fill="#F6B719"/><rect x="16" y="30" width="292" height="24" fill="#FAF5EC" stroke="#C8BDB0"/><rect x="16" y="60" width="292" height="24" fill="#FAF5EC" stroke="#C8BDB0"/><rect x="16" y="90" width="292" height="24" fill="#171A16"/><text x="162" y="106" text-anchor="middle" font-size="11" fill="#F6B719" font-weight="700">加载更多按钮（页脚可稳稳停靠）</text><rect x="320" y="30" width="124" height="84" fill="#EDDDC2" stroke="#141412"/><text x="382" y="64" text-anchor="middle" font-size="11.5" fill="#141412" font-weight="700">侧栏微型页脚</text><text x="382" y="84" text-anchor="middle" font-size="10.5" fill="#4A453D">隐私 · 条款 · 帮助</text></svg>`,
  },
  {
    id: "funnel",
    title: "单步聚焦的结账与认证页",
    badText: "<strong>硬套三段：</strong>完整全局顶栏 + 臃肿门垫页脚放出几十个外跳出口，用户一点分心就再也回不到付款流程。",
    goodText: "<strong>破局解法：</strong>拆掉干扰性全局导航，顶部只留标志与步骤进度，底部压成一行安全凭证与客服电话。",
    badSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect width="460" height="26" fill="#F6B719"/><text x="230" y="17" text-anchor="middle" font-size="11" fill="#B52B1E" font-weight="700">首页 · 活动 · 博客 · 社区 · 招聘 · 下载（全是流失口）</text><rect x="108" y="34" width="244" height="44" fill="#FAF5EC" stroke="#141412"/><text x="230" y="60" text-anchor="middle" font-size="12" fill="#141412" font-weight="700">付款表单</text><rect x="0" y="86" width="460" height="38" fill="#171A16"/><text x="230" y="109" text-anchor="middle" font-size="11" fill="#FF8778">4 栏 28 条无关营销链接继续拉走视线</text></svg>`,
    goodSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect width="460" height="22" fill="#F8C84B"/><text x="230" y="15" text-anchor="middle" font-size="11" fill="#141412" font-weight="700">品牌标  ·  步骤 2 / 3 确认支付</text><rect x="92" y="30" width="276" height="66" fill="#FAF5EC" stroke="#1B6644" stroke-width="1.5"/><text x="230" y="58" text-anchor="middle" font-size="12" fill="#141412" font-weight="700">无干扰表单 + 唯一主行动按钮</text><rect x="172" y="68" width="116" height="20" fill="#1B6644"/><text x="230" y="82" text-anchor="middle" font-size="11" fill="#FAF5EC" font-weight="700">确认付款</text><rect x="0" y="104" width="460" height="20" fill="#171A16"/><text x="230" y="118" text-anchor="middle" font-size="10.5" fill="#6CD4A0">加密支付 · 隐私条款 · 紧急客服热线</text></svg>`,
  },
  {
    id: "mobileapp",
    title: "高频切换的原生形态移动 App",
    badText: "<strong>硬套三段：</strong>把核心菜单塞进顶部页眉、再把次级入口压到滑半天才到头的页脚，单手大拇指全程够不着。",
    goodText: "<strong>破局解法：</strong>采用固定在拇指热区的底部标签栏切一级视图（见 264 底部导航布局），或双面并行工具用分屏结构。",
    badSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect x="164" y="4" width="132" height="116" fill="#FAF5EC" stroke="#141412" stroke-width="1.5"/><rect x="164" y="4" width="132" height="24" fill="#F6B719"/><text x="230" y="20" text-anchor="middle" font-size="10.5" fill="#B52B1E" font-weight="700">拇指够不着的顶栏</text><text x="230" y="65" text-anchor="middle" font-size="11" fill="#4A453D">长滚信息列表…</text><rect x="164" y="98" width="132" height="22" fill="#171A16"/><text x="230" y="113" text-anchor="middle" font-size="10" fill="#FF8778">滑到底才有页脚</text></svg>`,
    goodSvg: `<svg viewBox="0 0 460 124" aria-hidden="true"><rect x="164" y="4" width="132" height="116" fill="#FAF5EC" stroke="#1B6644" stroke-width="1.5"/><rect x="164" y="4" width="132" height="16" fill="#EDDDC2"/><text x="230" y="15" text-anchor="middle" font-size="9.5" fill="#141412" font-weight="600">轻量标题栏</text><text x="230" y="58" text-anchor="middle" font-size="11.5" fill="#141412" font-weight="700">核心交互视图</text><rect x="164" y="94" width="132" height="26" fill="#171A16"/><circle cx="192" cy="107" r="4.5" fill="#F6B719"/><circle cx="230" cy="107" r="4.5" fill="#FAF5EC"/><circle cx="268" cy="107" r="4.5" fill="#FAF5EC"/></svg>`,
  },
];

const antiFlipped = new Set();
const antiGrid = document.getElementById("antiGrid");

function renderAntiGrid() {
  antiGrid.innerHTML = ANTI_CASES.map((c) => {
    const fixed = antiFlipped.has(c.id);
    return `<article class="anti-card">
      <div class="anti-top">
        <h3>${c.title}</h3>
        <button type="button" class="anti-flip ${fixed ? "is-fixed" : ""}" data-anti="${c.id}">
          ${fixed ? "查看：硬套三段" : "切到：破局解法"}
        </button>
      </div>
      <div class="anti-diagram">${fixed ? c.goodSvg : c.badSvg}</div>
      <p class="anti-desc">${fixed ? c.goodText : c.badText}</p>
    </article>`;
  }).join("");
}

antiGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-anti]");
  if (!btn) return;
  const id = btn.dataset.anti;
  if (antiFlipped.has(id)) antiFlipped.delete(id);
  else antiFlipped.add(id);
  renderAntiGrid();
});
renderAntiGrid();

// ==================== 7. 06 节：双题单变量看图辨析练习 ====================
const QUIZZES = [
  {
    prompt: "题 1（变量：滚动中的页眉高度预算与形态）：同一篇 390px 手机端技术专栏已向下滚动到文章中段，下面 A / B / C / D 四种三段框架处理，哪一种兼顾了「随时可定位」与「正文轻松读」？",
    answer: "B",
    options: [
      {
        id: "A",
        caption: "A · 页眉保持 156px 原高度吸顶（含标志、两行菜单与搜索框），底沿贴住正文。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="72" fill="#F6B719"/><circle cx="20" cy="18" r="8" fill="#141412"/><rect x="34" y="13" width="60" height="9" fill="#141412"/><rect x="12" y="32" width="136" height="14" fill="#FAF5EC" stroke="#141412"/><rect x="12" y="52" width="136" height="12" fill="#141412"/><rect x="12" y="82" width="136" height="44" fill="#FAF5EC" stroke="#99918B"/><rect x="20" y="92" width="90" height="7" fill="#141412"/><rect x="20" y="105" width="118" height="4" fill="#7E766B"/><rect x="20" y="114" width="102" height="4" fill="#7E766B"/><rect x="12" y="134" width="136" height="38" fill="#FAF5EC" stroke="#99918B"/><rect x="0" y="178" width="160" height="22" fill="#171A16"/></svg>`,
        reason: "A 选项让 156px 的完整页眉全高吸顶，在手机屏上直接切走近三分之一视野，正文只剩一条窄缝。",
      },
      {
        id: "B",
        caption: "B · 滚屏时页眉自动收拢为 52px 单行顶条（标志+菜单入口），正文占满中段，底端保留完整页脚。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="24" fill="#F6B719"/><circle cx="16" cy="12" r="6" fill="#141412"/><rect x="28" y="9" width="46" height="6" fill="#141412"/><rect x="132" y="9" width="16" height="2.2" fill="#141412"/><rect x="132" y="14" width="16" height="2.2" fill="#141412"/><rect x="12" y="34" width="136" height="58" fill="#FAF5EC" stroke="#99918B"/><rect x="20" y="44" width="94" height="8" fill="#141412"/><rect x="20" y="58" width="118" height="4.5" fill="#7E766B"/><rect x="20" y="68" width="112" height="4.5" fill="#7E766B"/><rect x="20" y="78" width="84" height="4.5" fill="#7E766B"/><rect x="12" y="100" width="136" height="66" fill="#FAF5EC" stroke="#99918B"/><rect x="20" y="110" width="76" height="8" fill="#141412"/><rect x="20" y="124" width="116" height="4.5" fill="#7E766B"/><rect x="20" y="134" width="108" height="4.5" fill="#7E766B"/><rect x="20" y="144" width="96" height="4.5" fill="#7E766B"/><rect x="0" y="176" width="160" height="24" fill="#171A16"/><circle cx="16" cy="188" r="4.5" fill="#F6B719"/><rect x="28" y="186" width="54" height="3.5" fill="#F4EBDE"/></svg>`,
        reason: "B 选项正确：滚屏后页眉收拢到约 52px 紧凑单行，既保留坐标与返回入口，又把 85% 以上的有效视口让给正文，且底端保留清晰页脚闭合。",
      },
      {
        id: "C",
        caption: "C · 彻底移除页眉与页脚，整块视口 100% 只放连续段落文本，上下无任何站级入口。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect x="12" y="10" width="136" height="180" fill="#FAF5EC" stroke="#99918B"/><rect x="20" y="22" width="114" height="5" fill="#7E766B"/><rect x="20" y="34" width="118" height="5" fill="#7E766B"/><rect x="20" y="46" width="108" height="5" fill="#7E766B"/><rect x="20" y="66" width="116" height="5" fill="#7E766B"/><rect x="20" y="78" width="118" height="5" fill="#7E766B"/><rect x="20" y="90" width="100" height="5" fill="#7E766B"/><rect x="20" y="110" width="116" height="5" fill="#7E766B"/><rect x="20" y="122" width="112" height="5" fill="#7E766B"/><rect x="20" y="134" width="94" height="5" fill="#7E766B"/><rect x="20" y="154" width="114" height="5" fill="#7E766B"/><rect x="20" y="166" width="88" height="5" fill="#7E766B"/></svg>`,
        reason: "C 选项把页眉和页脚同时删光，专栏文章变成孤立的纯文本切片——从外链点进来的读者不知道站点归属，读完也找不到目录和联系兜底。",
      },
      {
        id: "D",
        caption: "D · 将页眉压缩至 24px 极细横条，内部并排塞入标志、五项文字链接与搜索图标。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="12" fill="#F6B719"/><rect x="6" y="4" width="18" height="4" fill="#141412"/><rect x="28" y="4" width="18" height="4" fill="#141412"/><rect x="50" y="4" width="18" height="4" fill="#141412"/><rect x="72" y="4" width="18" height="4" fill="#141412"/><rect x="94" y="4" width="18" height="4" fill="#141412"/><rect x="116" y="4" width="18" height="4" fill="#141412"/><rect x="140" y="3" width="12" height="6" fill="#141412"/><rect x="12" y="22" width="136" height="146" fill="#FAF5EC" stroke="#99918B"/><rect x="20" y="36" width="96" height="8" fill="#141412"/><rect x="20" y="52" width="118" height="5" fill="#7E766B"/><rect x="20" y="64" width="114" height="5" fill="#7E766B"/><rect x="20" y="76" width="102" height="5" fill="#7E766B"/><rect x="0" y="176" width="160" height="24" fill="#171A16"/></svg>`,
        reason: "D 选项走向另一端极端：24px 的极窄顶条远低于移动端舒适触控高度（通常需 ≥40px），五项链接挤作一团极易误触。",
      },
    ],
  },
  {
    prompt: "题 2（变量：信息部件的三段归属）：下面 A / B / C / D 四张官网页面的页眉、主体、页脚高度完全相同，唯一区别是四类核心部件摆在哪一段。哪套分工最清晰顺手？",
    answer: "C",
    options: [
      {
        id: "A",
        caption: "A · 页眉放版权号与隐私条款；主体放主图与产品介绍；页脚放品牌标志与一级主导航。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="30" fill="#F6B719"/><text x="80" y="19" text-anchor="middle" font-size="9.5" font-weight="700" fill="#141412">© 版权与隐私条款</text><rect x="12" y="40" width="136" height="114" fill="#FAF5EC" stroke="#99918B"/><rect x="22" y="52" width="116" height="46" fill="#141412"/><circle cx="48" cy="70" r="8" fill="#F6B719"/><text x="80" y="120" text-anchor="middle" font-size="10" font-weight="700" fill="#141412">产品核心价值与卡片</text><rect x="0" y="164" width="160" height="36" fill="#171A16"/><text x="80" y="186" text-anchor="middle" font-size="9.5" font-weight="700" fill="#F6B719">品牌标 · 一级主导航</text></svg>`,
        reason: "A 选项头脚颠倒：把低频法律声明抬到第一眼位置，却把决定整站方向的品牌与一级导航埋进页底。",
      },
      {
        id: "B",
        caption: "B · 页眉塞进全部 18 条公司/帮助/友链菜单；主体仅放无按钮简介；页脚只留一行空白装饰条。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="30" fill="#F6B719"/><text x="80" y="13" text-anchor="middle" font-size="8" font-weight="700" fill="#141412">首页·功能·定价·招聘·媒体·法务</text><text x="80" y="24" text-anchor="middle" font-size="8" font-weight="700" fill="#141412">隐私·协议·客服·友链·备案·地图</text><rect x="12" y="40" width="136" height="114" fill="#FAF5EC" stroke="#99918B"/><text x="80" y="96" text-anchor="middle" font-size="10" font-weight="700" fill="#4A453D">纯文字简介（无行动出口）</text><rect x="0" y="164" width="160" height="36" fill="#171A16"/><text x="80" y="186" text-anchor="middle" font-size="9.5" fill="#D5CCB9">纯黑装饰空条</text></svg>`,
        reason: "B 选项把原本该归页脚兜底的次级链接全倒进页眉，造成首屏信息过载，而页脚却沦为空壳。",
      },
      {
        id: "C",
        caption: "C · 页眉放品牌与精简主导航；主体放核心价值、三联特性与主行动按钮；页脚放分栏帮助与版权隐私。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="30" fill="#F6B719"/><text x="80" y="19" text-anchor="middle" font-size="9.5" font-weight="700" fill="#141412">品牌标 · 产品 · 定价 · 文档</text><rect x="12" y="40" width="136" height="114" fill="#FAF5EC" stroke="#99918B"/><rect x="22" y="50" width="116" height="40" fill="#141412"/><circle cx="48" cy="66" r="7" fill="#F6B719"/><text x="80" y="110" text-anchor="middle" font-size="9.5" font-weight="700" fill="#141412">核心叙事 + 三联要点</text><rect x="44" y="122" width="72" height="20" fill="#F6B719" stroke="#141412"/><text x="80" y="136" text-anchor="middle" font-size="9.5" font-weight="800" fill="#141412">主行动按钮</text><rect x="0" y="164" width="160" height="36" fill="#171A16"/><text x="80" y="186" text-anchor="middle" font-size="9.5" font-weight="700" fill="#F6B719">帮助分栏 · 隐私与版权</text></svg>`,
        reason: "C 选项正确：定位入口、核心转化任务与次级安全网严格落在页眉、主体、页脚三段，完全契合用户的预期路线。",
      },
      {
        id: "D",
        caption: "D · 页眉放品牌与主导航；主体只放产品图与文字，把唯一「立即开始」主行动按钮放到页脚末行。",
        svg: `<svg viewBox="0 0 160 200"><rect width="160" height="200" fill="#F4EBDE"/><rect width="160" height="30" fill="#F6B719"/><text x="80" y="19" text-anchor="middle" font-size="9.5" font-weight="700" fill="#141412">品牌标 · 产品 · 定价 · 文档</text><rect x="12" y="40" width="136" height="114" fill="#FAF5EC" stroke="#99918B"/><rect x="22" y="52" width="116" height="46" fill="#141412"/><text x="80" y="124" text-anchor="middle" font-size="9.5" fill="#4A453D">只有介绍文字，无主行动</text><rect x="0" y="164" width="160" height="36" fill="#171A16"/><rect x="40" y="172" width="80" height="20" fill="#F6B719"/><text x="80" y="186" text-anchor="middle" font-size="9.5" font-weight="800" fill="#141412">唯一主行动按钮</text></svg>`,
        reason: "D 选项把最核心的主行动出口推迟并藏到页脚，用户看完主体心生兴趣却当场找不到入口，转化链路断裂。",
      },
    ],
  },
];

let curQuizIdx = 0;
const quizPicked = [null, null];
const quizPromptEl = document.getElementById("quizPrompt");
const quizOptionsEl = document.getElementById("quizOptions");
const quizFeedbackEl = document.getElementById("quizFeedback");

function renderQuiz() {
  const q = QUIZZES[curQuizIdx];
  const picked = quizPicked[curQuizIdx];
  quizPromptEl.textContent = q.prompt;

  quizOptionsEl.innerHTML = q.options
    .map((o) => {
      let cls = "";
      if (picked) {
        if (o.id === picked) cls = o.id === q.answer ? "is-picked-ok" : "is-picked-bad";
        else if (o.id === q.answer) cls = "is-answer-reveal";
      }
      return `<button type="button" class="q-card ${cls}" role="radio" aria-checked="${picked === o.id}" data-pick-opt="${o.id}">
        <span class="q-letter">选项 ${o.id}</span>
        <div class="q-svg-wrap">${o.svg}</div>
        <p class="q-caption">${o.caption}</p>
      </button>`;
    })
    .join("");

  if (picked) {
    const right = picked === q.answer;
    quizFeedbackEl.hidden = false;
    quizFeedbackEl.innerHTML = `
      <div class="qf-head">
        <strong class="${right ? "is-ok" : "is-bad"}">${right ? `选对了！答案正是 ${q.answer}` : `选的是 ${picked}，更稳的结构是 ${q.answer}`}</strong>
        <button type="button" class="mbtn" id="quizRetryBtn">重选此题</button>
      </div>
      <ul class="qf-list">
        ${q.options.map((o) => `<li><strong>${o.id}：</strong>${o.reason}</li>`).join("")}
      </ul>`;
    document.getElementById("quizRetryBtn").addEventListener("click", () => {
      quizPicked[curQuizIdx] = null;
      renderQuiz();
    });
  } else {
    quizFeedbackEl.hidden = true;
  }
}

document.querySelectorAll("[data-quiz]").forEach((btn) => {
  btn.addEventListener("click", () => {
    curQuizIdx = Number(btn.dataset.quiz);
    document.querySelectorAll("[data-quiz]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderQuiz();
  });
});

quizOptionsEl.addEventListener("click", (e) => {
  const card = e.target.closest("[data-pick-opt]");
  if (!card) return;
  quizPicked[curQuizIdx] = card.dataset.pickOpt;
  renderQuiz();
});
renderQuiz();

// ==================== 8. 07 节：原海报关键词联动 + 放大拖动灯箱 ====================
const KW_EXPLAINS = {
  framing: "对应海报最上段亮芥末金黄通栏：用高识别色域、左大标与右黑圆页眉图标，再借底部正中 ▼ 指针先把页面边界与阅读预期定住。",
  sequence: "对应海报中段暖燕麦宣纸区：左侧 3×3 金心点阵点明「秩序中的焦点」，右侧网页画框用黑夜金日主图 → 三联几何卡 → 双列列表递进展开。",
  closure: "对应海报最下段深曜炭墨通栏：顶部 ▲ 楔咬合主体底沿，用明度落差与金圈三杠徽标交代收尾边界，并压上一道亮金底线完成闭合。",
  hierarchy: "对应整张海报的三色通栏自示范：亮金（起）→ 暖纸（承）→ 深墨（合），三段轻重分明、互不越界，右下包豪斯扇面与点阵收束全篇节奏。",
};

const kwExplain = document.getElementById("kwExplain");
document.querySelectorAll("[data-kw]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-kw]").forEach((b) => b.classList.toggle("is-active", b === btn));
    kwExplain.textContent = KW_EXPLAINS[btn.dataset.kw];
  });
});

// 灯箱（只读已有 #poster.src，不重复内联图片）
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbCanvas = document.getElementById("lbCanvas");
const lbImg = document.getElementById("lbImg");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbSx = 0;
let lbSy = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("posterOpenBtn").focus();
}

document.getElementById("posterOpenBtn").addEventListener("click", openLightbox);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => { lbScale = Math.min(3.5, lbScale + 0.4); applyLbTransform(); });
document.getElementById("lbZoomOut").addEventListener("click", () => { lbScale = Math.max(0.7, lbScale - 0.4); applyLbTransform(); });
document.getElementById("lbZoomReset").addEventListener("click", () => { lbScale = 1; lbTx = 0; lbTy = 0; applyLbTransform(); });

lbCanvas.addEventListener("click", (e) => {
  if (e.target === lbCanvas) closeLightbox();
});
lbCanvas.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = true;
  lbSx = e.clientX - lbTx;
  lbSy = e.clientY - lbTy;
  lbCanvas.classList.add("is-dragging");
  lbCanvas.setPointerCapture?.(e.pointerId);
});
lbCanvas.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbSx;
  lbTy = e.clientY - lbSy;
  applyLbTransform();
});
lbCanvas.addEventListener("pointerup", () => {
  lbDrag = false;
  lbCanvas.classList.remove("is-dragging");
});
lbCanvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.7, Math.min(3.5, lbScale + (e.deltaY < 0 ? 0.18 : -0.18)));
  applyLbTransform();
}, { passive: false });
