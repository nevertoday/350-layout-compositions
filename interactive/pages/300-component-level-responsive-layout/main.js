// 300 组件级响应布局 · 主交互控制器
import { loop } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  COMPONENTS,
  PRESETS,
  BP_MIN,
  BP_MAX,
  SPLIT_MIN,
  SPLIT_MAX,
  clamp,
  evaluate,
} from "./model.js";
import { createHeroRenderer, createContainmentRenderer } from "./stage-canvas.js";

// ==================== 状态与开场主控 ====================
const state = { ...INITIAL_STATE };
const heroCanvas = document.getElementById("hero-canvas");
const heroRenderer = createHeroRenderer(heroCanvas);

const ui = {
  statusPill: document.getElementById("hero-status-pill"),
  emblemCaption: document.getElementById("emblem-caption"),
  insightPanel: document.getElementById("insight-panel"),
  insightTag: document.getElementById("insight-tag"),
  insightTitle: document.getElementById("insight-title"),
  insightWhy: document.getElementById("insight-why"),
  insightFixHint: document.getElementById("insight-fix-hint"),
  btnSmartFix: document.getElementById("btn-smart-fix"),
  btnSwapSlots: document.getElementById("btn-swap-slots"),
  bpSlider: document.getElementById("bp-slider"),
  bpOutput: document.getElementById("bp-output"),
  bpSafeHint: document.getElementById("bp-safe-hint"),
  btnDropInfo: document.getElementById("btn-drop-info"),
  btnFlipOrder: document.getElementById("btn-flip-order"),
  liveCss: document.getElementById("live-css"),
  compTabs: [...document.querySelectorAll("[data-comp]")],
  modeBtns: [...document.querySelectorAll("[data-qmode]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
};

let currentEval = evaluate(state);
let lastAction = null;
let heroDirty = true;
let uiDirty = false;
let heroAnimating = true;
let lastHeroSize = "";
let lastDomKey = "";

function syncHeroUI(force = false) {
  currentEval = evaluate(state);
  const r = currentEval;
  lastAction = r.fixAction;

  // 轻量变更判定：拖动过程中如果只改像素数，避免每帧重复写未变化的 DOM 节点
  const flexBadge = r.principles[2].badge;
  const domKey = `${r.statusPill}|${r.headline}|${r.state.breakpoint}|${r.state.dropInfo}|${r.state.flipOrder}|${r.state.component}|${r.state.queryMode}|${flexBadge}`;
  if (!force && domKey === lastDomKey) return;
  lastDomKey = domKey;

  // 顶沿状态胶囊
  ui.statusPill.textContent = r.statusPill;
  ui.statusPill.className = `status-pill ${r.ok ? "is-ok" : r.primary.severity === "error" ? "is-bad" : "is-warn"}`;

  // 右上活体图符标注
  if (ui.emblemCaption) {
    ui.emblemCaption.textContent = r.ok
      ? `${r.spec.label} · ${r.left.mode === "wide" ? "横" : "竖"} / ${r.right.mode === "wide" ? "横" : "竖"} 自治`
      : `${r.spec.label} · ${r.primary.shortTag}`;
  }

  // 四枚原海报核心原则状态灯
  for (const p of r.principles) {
    const el = document.querySelector(`[data-p-badge="${p.id}"]`);
    if (!el) continue;
    el.textContent = p.badge;
    el.className = `p-badge ${p.status === "ok" ? "is-ok" : p.status === "warn" ? "is-warn" : "is-bad"}`;
  }

  // 组件切签
  for (const btn of ui.compTabs) {
    const active = btn.dataset.comp === state.component;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  }

  // 查询机制按钮
  for (const btn of ui.modeBtns) {
    const active = btn.dataset.qmode === state.queryMode;
    btn.classList.toggle("is-active", active);
    btn.classList.toggle("is-media", btn.dataset.qmode === "media");
    btn.classList.toggle("is-container", btn.dataset.qmode === "container");
    btn.setAttribute("aria-pressed", String(active));
  }

  // 洞察面板
  ui.insightPanel.className = `insight-panel ${r.ok ? "is-ok" : r.primary.severity === "error" ? "is-bad" : "is-warn"}`;
  ui.insightTag.textContent = r.ok ? "自治平衡成立" : r.primary.shortTag;
  ui.insightTitle.textContent = r.headline;
  ui.insightWhy.textContent = r.why;
  ui.insightFixHint.textContent = r.fixHint;

  if (r.fixLabel) {
    ui.btnSmartFix.hidden = false;
    ui.btnSmartFix.textContent = r.fixLabel;
  } else {
    ui.btnSmartFix.hidden = true;
  }

  // 断点滑轨与说明
  ui.bpSlider.value = String(state.breakpoint);
  ui.bpOutput.textContent = `${state.breakpoint}px`;
  ui.bpSafeHint.textContent = `经验区间 ${r.spec.minWideW}–${r.spec.earlyCollapseW - 20}px`;

  // 保真开关
  ui.btnDropInfo.classList.toggle("is-on", state.dropInfo);
  ui.btnDropInfo.setAttribute("aria-pressed", String(state.dropInfo));
  ui.btnDropInfo.textContent = `窄态删减信息：${state.dropInfo ? "开（错态）" : "关"}`;

  ui.btnFlipOrder.classList.toggle("is-on", state.flipOrder);
  ui.btnFlipOrder.setAttribute("aria-pressed", String(state.flipOrder));
  ui.btnFlipOrder.textContent = `打乱元素顺序：${state.flipOrder ? "开（错态）" : "关"}`;

  // 实时同步 CSS 代码块
  ui.liveCss.textContent = r.cssRule;
}

const heroLoop = loop(heroCanvas, (t, dt, meta) => {
  const sizeKey = `${heroCanvas.clientWidth}x${heroCanvas.clientHeight}`;
  if (sizeKey !== lastHeroSize) {
    lastHeroSize = sizeKey;
    heroDirty = true;
  }
  if (uiDirty) {
    uiDirty = false;
    syncHeroUI();
  }
  if (!heroDirty && !heroAnimating && !meta.still) return;
  heroDirty = false;
  const res = heroRenderer.render(currentEval, t, dt, meta);
  heroAnimating = Boolean(res?.animating);
});

function patchState(patch, { deferFrame = false } = {}) {
  Object.assign(state, patch);
  heroDirty = true;
  if (deferFrame) {
    currentEval = evaluate(state);
    uiDirty = true;
    return;
  }
  syncHeroUI();
  heroLoop.draw();
}

// 组件切换（切组件时若当前在 @container 合法解下，自动保留体验或保持用户自设断点）
for (const btn of ui.compTabs) {
  btn.addEventListener("click", () => {
    const nextComp = btn.dataset.comp;
    const patch = { component: nextComp };
    if (currentEval.ok) {
      patch.breakpoint = COMPONENTS[nextComp].recommendedBp;
    }
    patchState(patch);
  });
}

for (const btn of ui.modeBtns) {
  btn.addEventListener("click", () => {
    patchState({ queryMode: btn.dataset.qmode });
  });
}

ui.bpSlider.addEventListener("input", () => {
  patchState({ breakpoint: Number(ui.bpSlider.value) });
});

ui.btnDropInfo.addEventListener("click", () => {
  patchState({ dropInfo: !state.dropInfo });
});

ui.btnFlipOrder.addEventListener("click", () => {
  patchState({ flipOrder: !state.flipOrder });
});

ui.btnSmartFix.addEventListener("click", () => {
  if (lastAction) patchState(lastAction);
});

ui.btnSwapSlots.addEventListener("click", () => {
  patchState({ split: clamp(1 - state.split, SPLIT_MIN, SPLIT_MAX) });
});

for (const btn of ui.presetBtns) {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    const patch = p.patchFor ? p.patchFor(state.component) : p.patch;
    patchState(patch);
  });
}

// 画布指针/触摸横拖（触屏垂直滚动不卡死，横向拖拽平滑调分栏并支持 perf 基准测试）
let dragInfo = null;

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  dragInfo = {
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    startSplit: state.split,
    locked: e.pointerType === "mouse",
    isSpine: Math.abs(e.clientX - heroCanvas.getBoundingClientRect().left - heroRenderer.geometry.spineX) < 34,
  };
  if (dragInfo.locked || dragInfo.isSpine) {
    dragInfo.locked = true;
    heroRenderer.setDragging(true);
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
    if (dragInfo.isSpine) {
      patchState({ split: heroRenderer.clientXToSplit(e.clientX) });
    }
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || dragInfo.id !== e.pointerId) return;
  const dx = e.clientX - dragInfo.startX;
  const dy = e.clientY - dragInfo.startY;
  if (!dragInfo.locked) {
    if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
      dragInfo.locked = true;
      heroRenderer.setDragging(true);
      try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
    } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      dragInfo = null;
      return;
    } else {
      return;
    }
  }
  const rect = heroCanvas.getBoundingClientRect();
  const nextSplit = dragInfo.isSpine
    ? heroRenderer.clientXToSplit(e.clientX)
    : clamp(dragInfo.startSplit + dx / Math.max(160, rect.width - 36), SPLIT_MIN, SPLIT_MAX);
  patchState({ split: nextSplit }, { deferFrame: true });
});

function endDrag(e) {
  if (!dragInfo || (e && dragInfo.id !== e.pointerId)) return;
  dragInfo = null;
  heroRenderer.setDragging(false);
  heroDirty = true;
  syncHeroUI();
  heroLoop.draw();
}
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

// 键盘完整可操作
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    patchState({ split: clamp(state.split - 0.04, SPLIT_MIN, SPLIT_MAX) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    patchState({ split: clamp(state.split + 0.04, SPLIT_MIN, SPLIT_MAX) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    patchState({ breakpoint: clamp(state.breakpoint + 20, BP_MIN, BP_MAX) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    patchState({ breakpoint: clamp(state.breakpoint - 20, BP_MIN, BP_MAX) });
  } else if (e.key === " ") {
    e.preventDefault();
    patchState({ queryMode: state.queryMode === "media" ? "container" : "media" });
  } else if (e.key === "1") {
    patchState({ component: "card" });
  } else if (e.key === "2") {
    patchState({ component: "stats" });
  } else if (e.key === "3") {
    patchState({ component: "list" });
  }
});

// ==================== 01 节：原生 CSS @container 搬家实验室 ====================
const HOSTS = {
  main: {
    name: "宿主：宽主栏容器",
    width: "620px",
    branch: "wide",
    branchLabel: "命中 ≥ 430px（横排）",
    explain: "当前宿主跨过 430px 横排门槛：主图居左占 40%，文字与三枚操作钮居右展开，视线横向一扫而过。",
  },
  grid: {
    name: "宿主：双栏网格槽",
    width: "410px",
    branch: "mid",
    branchLabel: "命中 246–429px（竖排舒展）",
    explain: "放入双栏格后低于 430px 横排门槛：组件自动退回上图下文竖排，主图与完整摘要、星级、三枚操作按钮都清晰保留。",
  },
  sidebar: {
    name: "宿主：窄侧边栏",
    width: "270px",
    branch: "mid",
    branchLabel: "命中 246–429px（竖排紧凑）",
    explain: "搬进窄侧边栏时，外界页面还是宽屏桌面，但卡片自己测得父容器变窄，自动收拢内距保持整洁，完全不需要额外写 .sidebar 覆盖规则。",
  },
  drawer: {
    name: "宿主：极窄抽屉面板",
    width: "215px",
    branch: "base",
    branchLabel: "命中 ≤ 245px（极紧凑纵向操作）",
    explain: "在极窄抽屉里，三枚并排按钮会被压扁——容器查询自动把操作钮折成全宽纵列，并收起冗余描述，保住标题、评分与全部点击入口。",
  },
};

const hostShell = document.getElementById("host-shell");
const cqDemoHost = hostShell.querySelector(".cq-demo-host");
const hostShellName = document.getElementById("host-shell-name");
const hostShellWidth = document.getElementById("host-shell-width");
const cqActiveBranch = document.getElementById("cq-active-branch");
const hostExplain = document.getElementById("host-explain");
const hostBtns = [...document.querySelectorAll("[data-host].host-btn")];
const codeLines = [...document.querySelectorAll("[data-branch]")];
let activeHostKey = "main";

function syncHostReadoutFromRealWidth() {
  const h = HOSTS[activeHostKey];
  if (!h || !cqDemoHost) return;
  const realW = Math.round(cqDemoHost.getBoundingClientRect().width);
  const targetW = parseInt(h.width, 10);
  const clamped = realW > 0 && realW < targetW - 36;
  const actualBranch = realW >= 430 ? "wide" : realW <= 245 ? "base" : "mid";

  hostShellName.textContent = h.name;
  hostShellWidth.textContent = realW > 0 ? `实宽 ${realW}px` : h.width;
  for (const ln of codeLines) ln.classList.toggle("is-hit", ln.dataset.branch === actualBranch);

  if (clamped) {
    cqActiveBranch.textContent = actualBranch === "base" ? "实测 ≤ 245px（极紧凑）" : "实测 246–429px（竖排）";
    hostExplain.textContent = `当前设备屏宽限制了外层最大宽度，容器实测净宽为 ${realW}px（低于 430px 横排门槛），因此卡片诚实地保持竖排——组件永远以真实可用容器宽为准。`;
  } else {
    cqActiveBranch.textContent = h.branchLabel;
    hostExplain.textContent = h.explain;
  }
}

for (const btn of hostBtns) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.host;
    if (!HOSTS[key]) return;
    activeHostKey = key;
    hostShell.dataset.host = key;
    for (const b of hostBtns) b.classList.toggle("is-active", b === btn);
    syncHostReadoutFromRealWidth();
    setTimeout(syncHostReadoutFromRealWidth, 360);
  });
}

if (typeof ResizeObserver !== "undefined" && cqDemoHost) {
  new ResizeObserver(() => syncHostReadoutFromRealWidth()).observe(cqDemoHost);
}
syncHostReadoutFromRealWidth();

// ==================== 02 节：三大组件同步/锁定拉伸廊 ====================
const trioSlider = document.getElementById("trio-width");
const trioOut = document.getElementById("trio-width-out");
const trioQuickBtns = [...document.querySelectorAll("[data-trio-w]")];
const lockBtns = [...document.querySelectorAll("[data-lock]")];

const trioState = {
  globalW: 540,
  locked: { card: false, stats: false, list: false },
  widths: { card: 540, stats: 540, list: 540 },
  bps: { card: 380, stats: 450, list: 400 },
  labels: {
    card: { wide: "横排并列", compact: "纵向堆叠" },
    stats: { wide: "单行四列", compact: "2×2 网格" },
    list: { wide: "行级排布", compact: "卡片堆叠" },
  },
};

function syncTrio() {
  trioSlider.value = String(trioState.globalW);
  trioOut.textContent = `${trioState.globalW}px`;
  for (const key of ["card", "stats", "list"]) {
    if (!trioState.locked[key]) trioState.widths[key] = trioState.globalW;
    const w = trioState.widths[key];
    const isCompact = w < trioState.bps[key];
    const el = document.getElementById(`spec-${key}`);
    const wEl = document.querySelector(`[data-pw="${key}"]`);
    const sEl = document.querySelector(`[data-ps="${key}"]`);
    if (el) {
      el.style.maxWidth = `${w}px`;
      el.classList.toggle("is-compact", isCompact);
    }
    if (wEl) wEl.textContent = `${w}px`;
    if (sEl) {
      sEl.textContent = isCompact ? trioState.labels[key].compact : trioState.labels[key].wide;
      sEl.className = `meter-state ${isCompact ? "is-compact" : "is-wide"}`;
    }
  }
}

trioSlider.addEventListener("input", () => {
  trioState.globalW = Number(trioSlider.value);
  syncTrio();
});

for (const b of trioQuickBtns) {
  b.addEventListener("click", () => {
    trioState.globalW = Number(b.dataset.trioW);
    syncTrio();
  });
}

for (const b of lockBtns) {
  b.addEventListener("click", () => {
    const k = b.dataset.lock;
    trioState.locked[k] = !trioState.locked[k];
    b.classList.toggle("is-locked", trioState.locked[k]);
    b.setAttribute("aria-pressed", String(trioState.locked[k]));
    b.textContent = trioState.locked[k] ? `已锁 ${trioState.widths[k]}px` : "锁定对照";
    syncTrio();
  });
}

// ==================== 03 节：遏制切断循环依赖 Canvas ====================
const containCanvas = document.getElementById("contain-canvas");
const containRenderer = createContainmentRenderer(containCanvas);
const containReadout = document.getElementById("contain-readout");
const cmBtns = [...document.querySelectorAll("[data-cm]")];
let containMode = "inline";

const CONTAIN_TEXT = {
  loop: "<strong>死循环悖论：</strong>如果不遏制子元素撑宽父容器，父宽触发子切横排→子把父撑宽→规则又反转触发，浏览器布局引擎会陷入无限震荡。",
  inline: "<strong>标准正解：</strong><code>container-type: inline-size</code> 只切断「子宽 → 父宽」的水平回环，保留垂直高度由内容自然撑开，覆盖绝大多数卡片、统计与列表组件。",
  size: "<strong>高度塌陷大坑：</strong><code>container-type: size</code> 会把水平和垂直两轴同时遏制——如果父容器没有写死明确高度，它会瞬间塌成 <code>0px</code>，内部组件直接溢出重叠。",
};

const containLoop = loop(containCanvas, (t, _dt, meta) => {
  containRenderer.render(containMode, t, meta);
});

for (const btn of cmBtns) {
  btn.addEventListener("click", () => {
    containMode = btn.dataset.cm;
    for (const b of cmBtns) {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    }
    containReadout.innerHTML = CONTAIN_TEXT[containMode];
    containLoop.draw();
  });
}

// ==================== 04 节：演进史四纪元切换 ====================
const ERAS = {
  "2010": {
    meta: "2010 年 5 月 25 日 · A List Apart 第 306 期",
    heading: "Ethan Marcotte 提出「响应式网页设计」",
    body: "Ethan Marcotte 首次将流式网格、弹性图片与 CSS 媒体查询合为一套方法论，让一套页面能同时适配桌面与手机屏幕。这是页面级响应的起点，但所有断点仍然锚定在浏览器视口宽度上。",
    code: `/* 2010 典型写法：一切绑定整屏视口 */\n@media (max-width: 768px) {\n  .page-grid { display: block; }\n  .card { flex-direction: column; }\n}`,
  },
  "2013": {
    meta: "2013 年 4 月（Ian Storm Taylor）· 同年 6 月（Brad Frost）",
    heading: "痛点觉醒：「媒体查询只是权宜补丁」与原子设计",
    body: "2013 年 4 月，Ian Storm Taylor 撰文《Media Queries Are a Hack》，直指媒体查询让组件变成「到处打补丁」而非「写一次处处用」，呼吁基于元素自身空间的查询；两个月后 Brad Frost 提出「原子设计」（2016 年成书），推动界面全面走向组件化。",
    code: `/* 2013–2020 的无奈补丁：按父级类名穷举 */\n.sidebar .card,\n.modal .card,\n.footer-col .card {\n  flex-direction: column;\n}`,
  },
  "2022": {
    meta: "2022 年 8–9 月 · Chrome 105 / Safari 16",
    heading: "W3C 规范破局，Miriam Suzanne 推动容器查询落地",
    body: "以 Miriam Suzanne 为核心起草的容器查询方案（最初属 W3C CSS Containment Module Level 3，后部分并入 Conditional Rules Level 5），用 inline-size 尺寸遏制解开十年死循环难题，于 2022 年秋率先登陆 Chrome 105 与 Safari 16。",
    code: `/* 2022 原生容器查询语法落地 */\n.card-slot { container-type: inline-size; }\n@container (min-width: 400px) {\n  .card { display: grid; grid-template-columns: 40% 1fr; }\n}`,
  },
  "2023": {
    meta: "2023 年 2 月 · Firefox 110 跟进 · Baseline 达成",
    heading: "全引擎 Baseline，组件级响应成为生产日常",
    body: "2023 年 2 月 Firefox 110 正式支持尺寸容器查询与 cqi/cqw 容器相对单位，跨浏览器基线全部打通。设计系统终于可以把宏观布局交给 @media，把组件内部形态完全交还给 @container。",
    code: `/* 现代分工：页面管宏观，组件管自治 */\n@media (min-width: 1024px) { .layout { grid-template-columns: 1fr 300px; } }\n.slot { container-type: inline-size; }\n@container (min-width: 380px) { .card { flex-direction: row; } }`,
  },
};

const tlTabs = [...document.querySelectorAll("[data-era]")];
const tlMeta = document.getElementById("tl-meta");
const tlHeading = document.getElementById("tl-heading");
const tlBody = document.getElementById("tl-body");
const tlCode = document.getElementById("tl-code");

for (const tab of tlTabs) {
  tab.addEventListener("click", () => {
    const d = ERAS[tab.dataset.era];
    if (!d) return;
    for (const t of tlTabs) {
      const act = t === tab;
      t.classList.toggle("is-active", act);
      t.setAttribute("aria-selected", String(act));
    }
    tlMeta.textContent = d.meta;
    tlHeading.textContent = d.heading;
    tlBody.textContent = d.body;
    tlCode.textContent = d.code;
  });
}

// ==================== 05 节：四场景选型分诊器 ====================
const TRIAGE = {
  "reusable-card": {
    use: true,
    pill: "推荐：组件级 @container",
    title: "这正是组件级响应的主战场",
    body: "同一组件要同时住进宽主栏、窄边栏和弹窗抽屉，父容器宽度与整屏宽度毫无固定换算关系。把断点收敛在组件内部，外层只管分栏，组件自己负责优雅变形。",
    rule: "实操口诀：给宿主容器加 container-type: inline-size，按组件内容可读底线设断点（不要照抄设备像素 768/1024）。",
  },
  "global-nav": {
    use: false,
    pill: "别用容器查询：交回 @media",
    title: "整页宏观骨架必须统一听视口指挥",
    body: "顶栏切汉堡菜单、全局多栏切单栏、暗色模式或打印样式关乎整个屏幕的统筹节奏。把它们拆成零散容器查询，只会让各块断点步调不一，整页显得支离破碎。",
    rule: "实操口诀：宏观页面骨架、顶栏与画布外抽屉归 @media，局部可复用模块归 @container。",
  },
  "intrinsic-pill": {
    use: false,
    pill: "禁用：会直接塌成 0px 宽",
    title: "靠文字撑宽的行内组件不能设为 inline-size 容器",
    body: "药丸标签、短按钮、随字数自适应宽度的徽章依赖内部文字把外框撑开。一旦对它开启 container-type: inline-size，浏览器会切断内容撑宽能力，盒子瞬间缩成 0px 宽。",
    rule: "实操口诀：只对「宽度由外层网格或父列确定」的包裹槽设 container-type，绝不加在靠文字撑宽的元素自身。",
  },
  "dense-table": {
    use: false,
    pill: "慎用：优先局部横滚或统一槽宽",
    title: "高密度对账表强拆卡片会毁掉纵向比对；邻卡差 10px 折态会碎裂节律",
    body: "18 列财务明细的核心阅读动作是沿着纵列快速扫比数字，硬折成堆叠卡片反而读不清，保留表头冻结与局部横向滚动更诚实；同排并列的卡片也应保证等宽，避免左右紧挨着却一张横排一张竖排。",
    rule: "实操口诀：先问重排后是否依然「可扫描性优先」，若破坏比对结构，局部滚动比硬拆更好用。",
  },
};

const triageBtns = [...document.querySelectorAll("[data-triage]")];
const vPill = document.getElementById("verdict-pill");
const vTitle = document.getElementById("verdict-title");
const vBody = document.getElementById("verdict-body");
const vRule = document.getElementById("verdict-rule");

for (const btn of triageBtns) {
  btn.addEventListener("click", () => {
    const item = TRIAGE[btn.dataset.triage];
    if (!item) return;
    for (const b of triageBtns) b.classList.toggle("is-active", b === btn);
    vPill.textContent = item.pill;
    vPill.className = `verdict-pill ${item.use ? "is-use" : "is-avoid"}`;
    vTitle.textContent = item.title;
    vBody.textContent = item.body;
    vRule.textContent = item.rule;
  });
}

// ==================== 06 节：眼力小练习（严格单一变量，中性无提示标签） ====================
const QUIZZES = [
  {
    prompt: "桌面视口 1440px，但右侧边栏容器只有 280px 宽。四张图素材完全相同，只差一个内部重排变量——哪一张最符合组件级响应原则？",
    answer: "B",
    options: [
      {
        letter: "A",
        meta: "280px · 左图右文",
        desc: "维持左 50% 配图、右 50% 标题与按钮的横向排布。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="6" y="6" width="168" height="116" rx="8" fill="#EFE9E4"/>
          <rect x="14" y="18" width="70" height="92" rx="5" fill="#97D8B0"/>
          <polygon points="20,98 44,68 62,88 76,74 80,98" fill="#569577"/>
          <rect x="92" y="20" width="74" height="8" rx="3" fill="#9B7FE8"/>
          <rect x="92" y="34" width="68" height="5" rx="2" fill="#BDB3DA"/>
          <rect x="92" y="44" width="60" height="5" rx="2" fill="#BDB3DA"/>
          <rect x="92" y="54" width="52" height="5" rx="2" fill="#BDB3DA"/>
          <text x="92" y="76" fill="#569577" font-size="10">★★★★</text>
          <rect x="92" y="88" width="26" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="122" y="88" width="26" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="152" y="88" width="26" height="14" rx="3" fill="#9B7FE8"/>
        </svg>`,
        reason: "A 仍按 1440px 视口硬撑横排，280px 窄槽里右侧文案被挤成窄缝、第三枚按钮冲出右边缘。",
      },
      {
        letter: "B",
        meta: "280px · 上图下文",
        desc: "切为纵向堆叠：主图居上，标题摘要居中，星级与三按钮居下。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="26" y="6" width="128" height="116" rx="8" fill="#EFE9E4"/>
          <rect x="35" y="14" width="110" height="44" rx="5" fill="#97D8B0"/>
          <polygon points="44,54 76,26 100,48 114,36 136,54" fill="#569577"/>
          <circle cx="104" cy="24" r="5" fill="#569577"/>
          <rect x="35" y="64" width="84" height="7" rx="3" fill="#9B7FE8"/>
          <rect x="35" y="76" width="104" height="5" rx="2" fill="#BDB3DA"/>
          <text x="35" y="94" fill="#569577" font-size="10">★★★★</text>
          <rect x="35" y="100" width="33" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="73" y="100" width="33" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="111" y="100" width="34" height="14" rx="3" fill="#9B7FE8"/>
        </svg>`,
        reason: "B 正确：按父容器 280px 切换纵向堆叠，同时守住「元素优先级不变」与「信息完整、按钮不丢」。",
      },
      {
        letter: "C",
        meta: "280px · 按钮置顶",
        desc: "切为纵向堆叠：三枚按钮移至最顶，标题居中，主图沉到底部。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="26" y="6" width="128" height="116" rx="8" fill="#EFE9E4"/>
          <rect x="35" y="14" width="33" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="73" y="14" width="33" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="111" y="14" width="34" height="14" rx="3" fill="#9B7FE8"/>
          <rect x="35" y="34" width="84" height="7" rx="3" fill="#9B7FE8"/>
          <rect x="35" y="46" width="104" height="5" rx="2" fill="#BDB3DA"/>
          <text x="35" y="63" fill="#569577" font-size="10">★★★★</text>
          <rect x="35" y="70" width="110" height="44" rx="5" fill="#97D8B0"/>
          <polygon points="44,110 76,82 100,104 114,92 136,110" fill="#569577"/>
        </svg>`,
        reason: "C 虽未溢出，却把操作按钮顶到主图和标题上方，打乱了「先识别内容、再决定操作」的视觉优先级。",
      },
      {
        letter: "D",
        meta: "280px · 仅留图题",
        desc: "切为纵向堆叠：保留主图与标题，隐藏评分与三枚操作按钮。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="26" y="6" width="128" height="116" rx="8" fill="#EFE9E4"/>
          <rect x="35" y="16" width="110" height="60" rx="5" fill="#97D8B0"/>
          <polygon points="44,70 76,34 100,58 114,44 136,70" fill="#569577"/>
          <rect x="35" y="86" width="84" height="8" rx="3" fill="#9B7FE8"/>
          <rect x="35" y="100" width="96" height="5" rx="2" fill="#BDB3DA"/>
        </svg>`,
        reason: "D 直接砍掉了评分和操作入口，窄槽里的用户既看不到评价也点不了收藏，破坏了信息与交互的完整一致。",
      },
    ],
  },
  {
    prompt: "四项同等权重的数据统计组件装进 300px 窄侧栏。数据与微图内容一致，只差子项网格组织方式——哪一张最利于快速扫读？",
    answer: "B",
    options: [
      {
        letter: "A",
        meta: "300px · 1×4 单行",
        desc: "保持四列单行横排，缩小数字并贴近纵线塞进一行。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="8" y="28" width="164" height="72" rx="8" fill="#EFE9E4"/>
          <line x1="49" y1="36" x2="49" y2="92" stroke="#C5BDD9"/>
          <line x1="90" y1="36" x2="90" y2="92" stroke="#C5BDD9"/>
          <line x1="131" y1="36" x2="131" y2="92" stroke="#C5BDD9"/>
          <g fill="#160A3E" font-size="8.5" font-weight="700" text-anchor="middle">
            <text x="28" y="54">128k</text><text x="69" y="54">3.6%</text><text x="110" y="54">742</text><text x="152" y="54">¥23.8w</text>
          </g>
          <rect x="16" y="72" width="24" height="12" rx="2" fill="#9B7FE8"/>
          <rect x="57" y="72" width="24" height="12" rx="2" fill="#9B7FE8"/>
          <rect x="98" y="72" width="24" height="12" rx="2" fill="#9B7FE8"/>
          <rect x="139" y="72" width="24" height="12" rx="2" fill="#9B7FE8"/>
        </svg>`,
        reason: "A 强塞四列，每个数字紧贴边线，¥23.8w 极易折行或截断，可扫描性大幅下降。",
      },
      {
        letter: "B",
        meta: "300px · 2×2 均等",
        desc: "重排为 2×2 四宫格，四项指标保持对齐与趋势微图。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="18" y="8" width="144" height="112" rx="8" fill="#EFE9E4"/>
          <line x1="90" y1="16" x2="90" y2="112" stroke="#C5BDD9"/>
          <line x1="26" y1="64" x2="154" y2="64" stroke="#C5BDD9"/>
          <g fill="#160A3E" font-size="11.5" font-weight="700" text-anchor="middle">
            <text x="54" y="34">128k</text><text x="126" y="34">3.6%</text>
            <text x="54" y="88">742</text><text x="126" y="88">¥23.8w</text>
          </g>
          <polyline points="34,54 46,46 56,50 72,40" fill="none" stroke="#160A3E" stroke-width="1.6"/>
          <rect x="108" y="44" width="7" height="12" fill="#9B7FE8"/><rect x="119" y="40" width="7" height="16" fill="#9B7FE8"/><rect x="130" y="46" width="7" height="10" fill="#9B7FE8"/>
          <polyline points="34,108 46,102 58,104 72,95" fill="none" stroke="#160A3E" stroke-width="1.6"/>
          <rect x="108" y="99" width="7" height="11" fill="#9B7FE8"/><rect x="119" y="94" width="7" height="16" fill="#9B7FE8"/><rect x="130" y="100" width="7" height="10" fill="#9B7FE8"/>
        </svg>`,
        reason: "B 正确：四项同权指标从单行 4 列折为 2×2 均等网格，字号充裕、纵横对齐、关联性与微图一目了然。",
      },
      {
        letter: "C",
        meta: "300px · 3+1 两行",
        desc: "上行挤入三项，第四项独自铺满整条底行。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="18" y="8" width="144" height="112" rx="8" fill="#EFE9E4"/>
          <line x1="66" y1="16" x2="66" y2="62" stroke="#C5BDD9"/>
          <line x1="114" y1="16" x2="114" y2="62" stroke="#C5BDD9"/>
          <line x1="26" y1="64" x2="154" y2="64" stroke="#C5BDD9"/>
          <g fill="#160A3E" font-size="9.5" font-weight="700" text-anchor="middle">
            <text x="42" y="36">128k</text><text x="90" y="36">3.6%</text><text x="138" y="36">742</text>
            <text x="90" y="90" font-size="13">¥23.8w</text>
          </g>
          <rect x="52" y="98" width="76" height="10" rx="2" fill="#9B7FE8"/>
        </svg>`,
        reason: "C 的 3+1 折法让首行三项偏挤，又把末项独自拉成三倍宽，制造出虚假的权重失衡，破坏了均等对比。",
      },
      {
        letter: "D",
        meta: "300px · 仅留两项",
        desc: "拆成两列大字，直接隐藏订单数与营收两项指标。",
        svg: `<svg viewBox="0 0 180 128" aria-hidden="true">
          <rect x="18" y="24" width="144" height="80" rx="8" fill="#EFE9E4"/>
          <line x1="90" y1="34" x2="90" y2="94" stroke="#C5BDD9"/>
          <g fill="#160A3E" font-size="13" font-weight="700" text-anchor="middle">
            <text x="54" y="56">128k</text><text x="126" y="56">3.6%</text>
          </g>
          <polyline points="32,82 50,72 72,66" fill="none" stroke="#160A3E" stroke-width="1.8"/>
          <rect x="108" y="70" width="9" height="16" fill="#9B7FE8"/><rect x="122" y="64" width="9" height="22" fill="#9B7FE8"/>
        </svg>`,
        reason: "D 丢失了后两项核心营收与订单数据，用截断指标来换大字号违背了数据统计组件的信息完整底线。",
      },
    ],
  },
];

const quizPromptEl = document.getElementById("quiz-prompt");
const quizOptionsEl = document.getElementById("quiz-options");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const qTabBtns = [...document.querySelectorAll("[data-qid]")];
let activeQid = 0;

function renderQuiz(qid) {
  activeQid = qid;
  const q = QUIZZES[qid];
  quizPromptEl.textContent = q.prompt;
  quizFeedbackEl.hidden = true;
  quizOptionsEl.innerHTML = "";

  for (const b of qTabBtns) {
    const act = Number(b.dataset.qid) === qid;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  }

  for (const opt of q.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.dataset.letter = opt.letter;
    btn.innerHTML = `
      <div class="quiz-opt-head">
        <span class="quiz-letter">${opt.letter}</span>
        <span class="quiz-neutral-meta">${opt.meta}</span>
      </div>
      <div class="quiz-svg-box">${opt.svg}</div>
      <p class="quiz-opt-desc">${opt.desc}</p>
    `;
    btn.addEventListener("click", () => handleQuizPick(opt.letter));
    quizOptionsEl.appendChild(btn);
  }
}

function handleQuizPick(letter) {
  const q = QUIZZES[activeQid];
  const isRight = letter === q.answer;
  const cards = [...quizOptionsEl.querySelectorAll(".quiz-card")];
  for (const c of cards) {
    const l = c.dataset.letter;
    c.setAttribute("aria-checked", String(l === letter));
    c.classList.toggle("is-right", l === q.answer);
    c.classList.toggle("is-wrong", l === letter && !isRight);
  }
  quizFeedbackEl.hidden = false;
  quizFeedbackEl.className = `quiz-feedback ${isRight ? "" : "is-wrong"}`;
  const listHtml = q.options.map((o) => `<li><strong>${o.letter}：</strong>${o.reason}</li>`).join("");
  quizFeedbackEl.innerHTML = `
    <h3>${isRight ? `选对了！${q.answer} 正是组件级响应的正确解` : `你选了 ${letter}，正确答案是 ${q.answer}`}</h3>
    <p>${q.options.find((o) => o.letter === letter).reason}</p>
    <ul>${listHtml}</ul>
  `;
}

for (const b of qTabBtns) {
  b.addEventListener("click", () => renderQuiz(Number(b.dataset.qid)));
}

// ==================== 07 节：原海报灯箱（复用同一份 img.src，不重复内联） ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbClose = document.getElementById("lb-close");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbZoomReset = document.getElementById("lb-zoom-reset");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoomReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.7, 3.2); applyLbTransform(); });
lbZoomOut.addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.7, 3.2); applyLbTransform(); });
lbZoomReset.addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.2);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || lbDrag.id !== e.pointerId) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化 ====================
syncHeroUI();
syncTrio();
renderQuiz(0);
heroLoop.draw();
containLoop.draw();
