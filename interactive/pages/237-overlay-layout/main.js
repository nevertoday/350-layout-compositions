import { loop, reducedMotion } from "../../lib/stage.js";
import {
  createInitialState,
  PRESETS,
  evaluate,
  evalStackingLab,
  evalScrimLab,
  OVERLAY_PATTERNS,
  QUIZ_ITEMS,
} from "./model.js";
import { createHeroStage } from "./stage.js";

// ==================== 1. 首屏活体三层光学覆盖台 ====================
let state = createInitialState();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const heroCanvas = $("#heroCanvas");
const railStatus = $("#railStatus");
const heroTitle = $("#heroTitle");
const tagLayer = $("#tagLayer");
const tagDepth = $("#tagDepth");
const tagEmphasis = $("#tagEmphasis");
const diagBox = $("#diagBox");
const diagBadge = $("#diagBadge");
const diagTitle = $("#diagTitle");
const diagDetail = $("#diagDetail");
const diagHint = $("#diagHint");
const diagEvent = $("#diagEvent");
const mStack = $("#mStack");
const mScrim = $("#mScrim");
const mSep = $("#mSep");
const mCover = $("#mCover");
const scrimRange = $("#scrimRange");
const scrimVal = $("#scrimVal");
const btnBlur = $("#btnBlur");
const btnView = $("#btnView");
const liveCode = $("#liveCode");

const scenarioBtns = $$("[data-scenario]");
const layerBtns = $$("[data-layer]");
const scrimBtns = $$("[data-scrim]");
const inertBtns = $$("[data-inert]");
const focusBtns = $$("[data-focus]");
const depthBtns = $$("[data-depth]");

const setTxt = (el, txt) => {
  if (el.textContent !== txt) el.textContent = txt;
};
const setCls = (el, cls) => {
  if (el.className !== cls) el.className = cls;
};

let stageCtrl = null;
let heroLoop = null;

function syncHeroUI() {
  const ev = evaluate(state);

  setTxt(railStatus, ev.passed ? "4 / 4 已理层" : `${ev.score} / 4 待理层`);
  setCls(railStatus, `rail-pill ${ev.passed ? "is-pass" : "is-fail"}`);

  setCls(heroTitle, `hero-title ${ev.passed ? "is-pass" : "is-broken"}`);

  setTxt(tagLayer, ev.tags.layerTag);
  setCls(tagLayer, `tri-badge ${ev.checks.layerOk ? "is-pass" : "is-fail"}`);
  setTxt(tagDepth, ev.tags.depthTag);
  setCls(tagDepth, `tri-badge ${ev.checks.depthOk ? "is-pass" : "is-fail"}`);
  setTxt(tagEmphasis, ev.tags.emphasisTag);
  setCls(tagEmphasis, `tri-badge ${ev.checks.inertOk && ev.checks.focusOk ? "is-pass" : "is-fail"}`);

  setCls(diagBox, `diag-box ${ev.passed ? "is-pass" : "is-fail"}`);
  setTxt(diagBadge, ev.badge);
  setTxt(diagTitle, ev.headline);
  setTxt(diagDetail, ev.detail);
  setTxt(diagHint, ev.actionHint);

  if (state.lastEvent) {
    if (diagEvent.hidden) diagEvent.hidden = false;
    setTxt(diagEvent, state.lastEvent);
  } else if (!diagEvent.hidden) {
    diagEvent.hidden = true;
  }

  setTxt(mStack, ev.metrics.stackLabel);
  setTxt(mScrim, `${ev.metrics.scrimPct}%`);
  setTxt(mSep, `${ev.metrics.frameSeparation}:1`);
  setTxt(mCover, `${ev.metrics.coveragePct}%`);

  const scrimStr = String(ev.metrics.scrimPct);
  if (scrimRange.value !== scrimStr) scrimRange.value = scrimStr;
  setTxt(scrimVal, `${ev.metrics.scrimPct}%`);

  setTxt(btnBlur, state.blur > 0 ? `轻模糊: ${state.blur}px` : "轻模糊: 关");
  btnBlur.setAttribute("aria-pressed", String(state.blur > 0));
  btnBlur.classList.toggle("is-selected", state.blur > 0);
  btnBlur.classList.toggle("is-good", state.blur > 0);

  setTxt(btnView, state.view === "iso" ? "回到 0° 正视" : "32° Z 轴侧剖");
  btnView.setAttribute("aria-pressed", String(state.view === "iso"));

  scenarioBtns.forEach((b) => {
    const on = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  layerBtns.forEach((b) => {
    const on = b.dataset.layer === state.layerMode;
    b.classList.toggle("is-selected", on);
    b.classList.toggle("is-good", on && ev.checks.layerOk);
    b.setAttribute("aria-pressed", String(on));
  });

  scrimBtns.forEach((b) => {
    const v = Number(b.dataset.scrim);
    const on = Math.abs(state.scrim - v) <= 2;
    b.classList.toggle("is-selected", on);
    b.classList.toggle("is-good", on && ev.checks.depthOk);
  });

  inertBtns.forEach((b) => {
    const on = (b.dataset.inert === "on") === state.inert;
    b.classList.toggle("is-selected", on);
    b.classList.toggle("is-good", on && state.inert);
    b.setAttribute("aria-pressed", String(on));
  });

  focusBtns.forEach((b) => {
    const on = b.dataset.focus === state.focusMode;
    b.classList.toggle("is-selected", on);
    b.classList.toggle("is-good", on && ev.checks.focusOk);
    b.setAttribute("aria-pressed", String(on));
  });

  depthBtns.forEach((b) => {
    const on = b.dataset.depth === state.activeLayer;
    b.setAttribute("aria-pressed", String(on));
  });

  setTxt(liveCode, ev.codeSnippet);
  if (stageCtrl) stageCtrl.markDirty();
  if (heroLoop && reducedMotion.matches) heroLoop.draw();
}

function setState(patch) {
  state = { ...state, ...patch };
  syncHeroUI();
}

stageCtrl = createHeroStage(heroCanvas, () => state, {
  onScrimChange(next) {
    if (next === state.scrim) return;
    state = { ...state, scrim: next };
    syncHeroUI();
  },
  onToggleView() {
    setState({ view: state.view === "iso" ? "front" : "iso" });
  },
  onDismissNested() {
    const nextFocus = state.focusMode === "broken" ? "no_exit" : "clean";
    setState({
      focusMode: nextFocus,
      lastEvent:
        nextFocus === "no_exit"
          ? "已清除二级套娃弹窗！但主弹窗还缺少 × 关闭入口，请在下方恢复「单层+Esc」。"
          : "已清除二级套娃弹窗，焦点重新回到唯一主任务层。",
    });
  },
  onLeakHit() {
    setState({
      leakCount: state.leakCount + 1,
      lastEvent: `穿透实测（第 ${state.leakCount + 1} 次）：背景未设 inert，刚才这一下已经误点到底层「清空草稿」！`,
    });
  },
  onShieldHit() {
    setState({
      shieldCount: state.shieldCount + 1,
      lastEvent: `阻断实测（第 ${state.shieldCount + 1} 次）：inert 生效，底层按钮已被安全隔离，不会误触。`,
    });
  },
  onEvent(msg) {
    setState({ lastEvent: msg });
  },
});

heroLoop = loop(heroCanvas, (t, dt, meta) => {
  stageCtrl.draw(t, dt, meta);
});

window.addEventListener("resize", () => {
  stageCtrl.resize();
  heroLoop.draw();
});

// 绑定首屏所有按钮与滑块
$$("[data-scenario]").forEach((btn) =>
  btn.addEventListener("click", () => setState({ scenario: btn.dataset.scenario, lastEvent: "" }))
);
btnView.addEventListener("click", () =>
  setState({ view: state.view === "iso" ? "front" : "iso", lastEvent: "" })
);
$("#btnPresetOk").addEventListener("click", () => {
  state = PRESETS.posterTopLayer(state.scenario);
  syncHeroUI();
});
$("#btnPresetReset").addEventListener("click", () => {
  state = PRESETS.broken();
  syncHeroUI();
});

$$("[data-layer]").forEach((btn) =>
  btn.addEventListener("click", () => setState({ layerMode: btn.dataset.layer, lastEvent: "" }))
);
scrimRange.addEventListener("input", () =>
  setState({ scrim: Number(scrimRange.value), lastEvent: "" })
);
$$("[data-scrim]").forEach((btn) =>
  btn.addEventListener("click", () => setState({ scrim: Number(btn.dataset.scrim), lastEvent: "" }))
);
btnBlur.addEventListener("click", () =>
  setState({ blur: state.blur > 0 ? 0 : 6, lastEvent: "" })
);
$$("[data-inert]").forEach((btn) =>
  btn.addEventListener("click", () => setState({ inert: btn.dataset.inert === "on", lastEvent: "" }))
);
$("#btnTestLeak").addEventListener("click", () => {
  if (!state.inert) {
    stageCtrl.addRipple(0.18, 0.85, "leak", "点击穿透！误触底层「清空」");
    setState({
      leakCount: state.leakCount + 1,
      lastEvent: `穿透实测（第 ${state.leakCount + 1} 次）：未设 inert，外部点击直接误触底层「清空草稿」！`,
    });
  } else {
    stageCtrl.addRipple(0.18, 0.85, "shield", "inert 拦截成功，底层安全");
    setState({
      shieldCount: state.shieldCount + 1,
      lastEvent: `阻断实测（第 ${state.shieldCount + 1} 次）：背景 inert 已拦截误触，底层安全无恙。`,
    });
  }
});
$$("[data-focus]").forEach((btn) =>
  btn.addEventListener("click", () => setState({ focusMode: btn.dataset.focus, lastEvent: "" }))
);
$$("[data-depth]").forEach((btn) =>
  btn.addEventListener("click", () =>
    setState({
      activeLayer: state.activeLayer === btn.dataset.depth ? null : btn.dataset.depth,
    })
  )
);

syncHeroUI();

// ==================== 2. 01 节：四代演进时间轴 ====================
const ERAS = {
  "1975": {
    title: "1975–1981 · Xerox PARC：BitBlt 让重叠窗口成为可能",
    body: "1970 年代中期，Alan Kay 领导的学习研究组在 Xerox Alto 上推进 Smalltalk 图形界面；1975 年 Dan Ingalls 发明 BitBlt（位块传输）算法，使计算机能高速保存与复原被盖住的像素块，重叠窗口与瞬时弹出菜单才真正流畅起来，并于 1981 年 8 月在《BYTE》杂志 Smalltalk-80 专刊公之于众。",
    source: "核实来源：Dan Ingalls, 'The Smalltalk Graphics Kernel', BYTE Magazine, August 1981 / Computer History Museum",
    svg: `<svg viewBox="0 0 360 190" width="100%" height="180" aria-hidden="true">
      <rect x="20" y="24" width="175" height="120" fill="#1b1840" stroke="#9865C5" stroke-width="2"/>
      <rect x="20" y="24" width="175" height="22" fill="#705FB4"/>
      <text x="30" y="39" fill="#F5F6F8" font-size="11" font-family="DM Mono, monospace">WINDOW A · SMALLTALK</text>
      <rect x="112" y="54" width="185" height="110" fill="#0d2a42" stroke="#53EFFC" stroke-width="2"/>
      <rect x="112" y="54" width="185" height="22" fill="#135F85"/>
      <text x="122" y="69" fill="#F5F6F8" font-size="11" font-family="DM Mono, monospace">OVERLAPPING WINDOW B</text>
      <rect x="218" y="90" width="116" height="62" fill="#2c1230" stroke="#EB59A1" stroke-width="2"/>
      <text x="228" y="114" fill="#FFD6E9" font-size="11" font-family="Noto Sans SC, sans-serif">BitBlt 瞬时保存</text>
      <text x="228" y="134" fill="#FF9AC9" font-size="10.5" font-family="DM Mono, monospace">POP-UP MENU</text>
    </svg>`,
  },
  "1998": {
    title: "1998 · W3C CSS2：正式确立 z-index 与层叠上下文",
    body: "1998 年 5 月 12 日发布的 W3C CSS2 推荐标准（第 9.9 节 Layered presentation）首次把 Z 轴引入网页排版：定位元素通过 z-index 排序，同时规定元素可以建立原子的「局部层叠上下文（Stacking Context）」，外部元素不能插队穿入内部。",
    source: "核实来源：W3C CSS2 Recommendation (REC-CSS2-19980512), Section 9.9.1 'z-index'",
    svg: `<svg viewBox="0 0 360 190" width="100%" height="180" aria-hidden="true">
      <polygon points="40,148 250,148 310,118 100,118" fill="rgba(112,95,180,0.45)" stroke="#9865C5" stroke-width="1.6"/>
      <polygon points="40,104 250,104 310,74 100,74" fill="rgba(235,89,161,0.34)" stroke="#EB59A1" stroke-width="1.6"/>
      <polygon points="40,60 250,60 310,30 100,30" fill="rgba(19,95,133,0.68)" stroke="#53EFFC" stroke-width="2"/>
      <line x1="28" y1="154" x2="28" y2="24" stroke="#53EFFC" stroke-width="1.6"/>
      <text x="16" y="18" fill="#53EFFC" font-size="11" font-family="DM Mono, monospace">Z</text>
      <text x="122" y="48" fill="#F5F6F8" font-size="11.5" font-family="DM Mono, monospace">z-index: 20 · FOREGROUND</text>
      <text x="122" y="92" fill="#FFD3E8" font-size="11.5" font-family="DM Mono, monospace">z-index: 10 · SCRIM</text>
      <text x="122" y="136" fill="#DDD2FF" font-size="11.5" font-family="DM Mono, monospace">z-index: 0 · ROOT FLOW</text>
    </svg>`,
  },
  "2010": {
    title: "2010s · 组件化时代：z-index: 99999 军备竞赛",
    body: "随着单页应用与 CSS 动画普及，卡片里随手写的 transform、opacity、filter 暗中制造了大量局部层叠上下文。弹窗、下拉菜单、提示框彼此互盖，开发者被迫把弹窗搬运到 body 末尾（Portal）或狂写 z-index: 999999，依然屡屡被第三方挂件压穿。",
    source: "工程共识：MDN CSS Stacking Context 规范条目与前端组件库 Portal 实践",
    svg: `<svg viewBox="0 0 360 190" width="100%" height="180" aria-hidden="true">
      <rect x="26" y="34" width="290" height="36" fill="#3a1632" stroke="#FF8593" stroke-width="2"/>
      <text x="40" y="57" fill="#FFD6DC" font-size="12" font-family="DM Mono, monospace">sticky-nav { z-index: 20 }</text>
      <rect x="52" y="84" width="238" height="84" fill="rgba(112,95,180,0.22)" stroke="#FF8593" stroke-dasharray="5 4" stroke-width="1.6"/>
      <text x="64" y="102" fill="#FFB3BD" font-size="11" font-family="DM Mono, monospace">.card { transform: translateZ(0) }</text>
      <rect x="86" y="114" width="174" height="42" fill="#0d2a42" stroke="#53EFFC" stroke-width="1.6"/>
      <text x="98" y="139" fill="#B8F4FF" font-size="11.5" font-family="DM Mono, monospace">.modal { z-index: 9999 }</text>
    </svg>`,
  },
  "2025": {
    title: "2022–2025 · 原生 Top Layer：<dialog> 与 Popover API",
    body: "HTML <dialog>（Baseline 2022）与 Popover API（Baseline 2025）把覆盖层直接送上浏览器管理的「Top Layer 顶层通道」——彻底跳过所有祖先 overflow: hidden 与层叠上下文，同时原生奉送 ::backdrop 遮罩、背景 inert、Esc 退出与轻关（Light-Dismiss）。",
    source: "核实来源：WHATWG HTML Living Standard / MDN Top layer & Popover API (Baseline 2025)",
    svg: `<svg viewBox="0 0 360 190" width="100%" height="180" aria-hidden="true">
      <rect x="24" y="112" width="312" height="58" fill="rgba(112,95,180,0.25)" stroke="#9865C5" stroke-width="1.5"/>
      <text x="38" y="144" fill="#D5C8FA" font-size="11.5" font-family="DM Mono, monospace">DOCUMENT TREE (任意 z-index / overflow)</text>
      <line x1="24" y1="96" x2="336" y2="96" stroke="#EB59A1" stroke-dasharray="6 4" stroke-width="1.6"/>
      <text x="230" y="90" fill="#FF94C8" font-size="10.5" font-family="DM Mono, monospace">::backdrop</text>
      <rect x="48" y="20" width="264" height="60" fill="#0d3550" stroke="#5EEBD4" stroke-width="2.2"/>
      <text x="64" y="46" fill="#5EEBD4" font-size="12" font-family="Space Grotesk, sans-serif" font-weight="700">BROWSER TOP LAYER</text>
      <text x="64" y="66" fill="#E9FAFF" font-size="11" font-family="DM Mono, monospace">&lt;dialog&gt;.showModal() / [popover]</text>
    </svg>`,
  },
};

const eraCopy = $("#eraCopy");
const eraDiagram = $("#eraDiagram");

function renderEra(key) {
  const item = ERAS[key] || ERAS["1975"];
  eraCopy.innerHTML = `<h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><div class="era-source">${esc(item.source)}</div>`;
  eraDiagram.innerHTML = item.svg;
  $$(".era-tab").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

$$(".era-tab").forEach((b) => b.addEventListener("click", () => renderEra(b.dataset.era)));
renderEra("1975");

// ==================== 3. 02 节：层叠牢笼 X 光树 ====================
const chkTransform = $("#chkTransform");
const chkOpacity = $("#chkOpacity");
const chkFilter = $("#chkFilter");
const chkIsolation = $("#chkIsolation");
const chkTopLayer = $("#chkTopLayer");
const stCard = $("#stCard");
const stModal = $("#stModal");
const stHeader = $("#stHeader");
const stackVerdict = $("#stackVerdict");
const stackLadder = $("#stackLadder");

function updateStackingLab() {
  const cfg = {
    transform: chkTransform.checked,
    opacity: chkOpacity.checked,
    filter: chkFilter.checked,
    isolation: chkIsolation.checked,
    topLayer: chkTopLayer.checked,
  };
  const res = evalStackingLab(cfg);

  // 真用 CSS 渲染出被压穿或脱困的直观效果！
  stCard.style.transform = cfg.transform && !cfg.topLayer ? "translateY(0)" : "none";
  stCard.style.opacity = cfg.opacity && !cfg.topLayer ? "0.99" : "1";
  stCard.style.filter = cfg.filter && !cfg.topLayer ? "blur(0px)" : "none";
  stCard.style.isolation = cfg.isolation && !cfg.topLayer ? "isolate" : "auto";
  stCard.style.zIndex = cfg.topLayer ? "auto" : "auto";

  // Top Layer 模拟：让弹窗直接压过 z-index: 20 的顶栏（z-index 抬高并移除父级陷阱）
  if (cfg.topLayer) {
    stHeader.style.zIndex = "10";
    stModal.style.zIndex = "9999";
    stModal.style.borderColor = "#5eebd4";
    stModal.innerHTML = `<strong>&lt;dialog&gt; Top Layer</strong><span>无视父级牢笼 · 稳居顶层</span>`;
  } else {
    stHeader.style.zIndex = "20";
    stModal.style.zIndex = "9999";
    stModal.style.borderColor = res.modalWins ? "#53effc" : "#ff8593";
    stModal.innerHTML = `<strong>.modal 确认浮层</strong><span>z-index: 9999${res.cardCreatesContext ? "（被父壳锁死）" : ""}</span>`;
  }

  stackVerdict.className = `stack-verdict ${res.modalWins ? "is-win" : ""}`;
  stackVerdict.innerHTML = `<strong>${esc(res.verdictTitle)}</strong><p>${esc(res.verdictBody)}</p>`;

  stackLadder.innerHTML = res.order
    .map(
      (row) => `<li class="is-${row.role}">
        <span class="lad-rank">#${row.rank}</span>
        <span><strong>${esc(row.name)}</strong> · ${esc(row.ctx)}</span>
        <span class="lad-z">${esc(row.z)}</span>
      </li>`
    )
    .join("");
}

[chkTransform, chkOpacity, chkFilter, chkIsolation, chkTopLayer].forEach((el) =>
  el.addEventListener("change", updateStackingLab)
);
updateStackingLab();

// ==================== 4. 03 节：大图覆文遮罩与 WCAG 对比度 ====================
const labOpacity = $("#labOpacity");
const labBlur = $("#labBlur");
const labOpacityVal = $("#labOpacityVal");
const labBlurVal = $("#labBlurVal");
const scrimVeil = $("#scrimVeil");
const wcagRatio = $("#wcagRatio");
const wcagAA = $("#wcagAA");
const wcagPhoto = $("#wcagPhoto");
const scrimSummary = $("#scrimSummary");

let scrimMode = "flat";

function updateScrimLab() {
  const opacity = Number(labOpacity.value);
  const blur = Number(labBlur.value);
  labOpacityVal.textContent = `${opacity}%`;
  labBlurVal.textContent = `${blur}px`;

  const res = evalScrimLab({ opacity, mode: scrimMode, blur });
  const aBot = res.bottomAlpha.toFixed(2);
  const aTop = res.topAlpha.toFixed(2);

  if (scrimMode === "gradient") {
    scrimVeil.style.background = `linear-gradient(180deg, rgba(6,9,22,${aTop}) 0%, rgba(6,9,22,${(res.bottomAlpha * 0.42).toFixed(2)}) 48%, rgba(6,9,22,${aBot}) 100%)`;
  } else if (scrimMode === "violet") {
    scrimVeil.style.background = `rgba(27, 18, 58, ${aBot})`;
  } else {
    scrimVeil.style.background = `rgba(6, 9, 22, ${aBot})`;
  }
  scrimVeil.style.backdropFilter = blur > 0 ? `blur(${blur}px)` : "none";

  wcagRatio.textContent = `${res.textRatio}:1`;
  wcagRatio.className = res.aaNormal ? "is-pass" : "is-fail";
  wcagAA.textContent = res.aaNormal ? "通过 AA" : res.aaLarge ? "仅大字通过" : "未达标";
  wcagAA.className = res.aaNormal ? "is-pass" : "is-fail";
  wcagPhoto.textContent = `${res.highlightKeptPct}%`;
  scrimSummary.textContent = res.summary;
}

$$("[data-smode]").forEach((btn) =>
  btn.addEventListener("click", () => {
    scrimMode = btn.dataset.smode;
    $$("[data-smode]").forEach((b) => {
      const on = b.dataset.smode === scrimMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateScrimLab();
  })
);
labOpacity.addEventListener("input", updateScrimLab);
labBlur.addEventListener("input", updateScrimLab);
updateScrimLab();

// ==================== 5. 04 节：四种覆盖实操台 ====================
const miniViewport = $("#miniViewport");
const miniLayer = $("#miniLayer");
const patternSpec = $("#patternSpec");

function renderPattern(key) {
  const p = OVERLAY_PATTERNS[key] || OVERLAY_PATTERNS.modal;
  miniViewport.dataset.active = key;

  const layerCopy = {
    modal: `<h4>确认删除发布分支？</h4><p>底层页面已被暗幕压低并设为 inert，必须处理完此框才能回去。</p><span class="mini-layer-tag">阻塞 · 锁焦点 · Esc 退</span>`,
    drawer: `<h4>筛选与属性</h4><p>紧贴右缘滑入，左侧一半工作区依然清晰可见，方便边看边筛。</p><span class="mini-layer-tag">侧边抽屉 · 保留参照</span>`,
    popover: `<h4>快捷切换视图</h4><p>无暗幕、不锁底层，点任意空白或按 Esc 即刻轻关。</p><span class="mini-layer-tag">非模态 · Light-Dismiss</span>`,
    toast: `<h4>已保存版本草稿</h4><p>停在角落不挡操作、不抢键盘焦点，数秒后自动退场。</p>`,
  };
  miniLayer.innerHTML = layerCopy[key];

  patternSpec.innerHTML = `
    <span class="ps-en">${esc(p.en)}</span>
    <h3>${esc(p.name)}</h3>
    <dl class="ps-dl">
      <div><dt>底层阻断</dt><dd>${esc(p.blocking)}</dd></div>
      <div><dt>焦点策略</dt><dd>${esc(p.focus)}</dd></div>
      <div><dt>退出路径</dt><dd>${esc(p.dismiss)}</dd></div>
      <div><dt>遮罩建议</dt><dd>${esc(p.scrim)}</dd></div>
      <div><dt>适用情境</dt><dd>${esc(p.when)}</dd></div>
    </dl>
    <pre class="ps-code">${esc(p.code)}</pre>
  `;

  $$("[data-pat]").forEach((b) => {
    const on = b.dataset.pat === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

$$("[data-pat]").forEach((b) => b.addEventListener("click", () => renderPattern(b.dataset.pat)));
renderPattern("modal");

// ==================== 6. 05 节：什么时候别用覆盖 ====================
const ANTI_DATA = {
  overload: {
    badDesc: "刚进网站 0 秒就连续弹出 Cookie、订阅、客服三层遮罩，用户连主内容都没看清就先被迫找三个关闭按钮。",
    goodDesc: "改法：首屏先让人读到内容；低优先级通知改为顶/底非阻断页内横条，高意图引导延后至用户真正互动后触发。",
    badSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="10" width="232" height="70" fill="#171432" stroke="#705FB4"/><rect x="38" y="16" width="110" height="44" fill="#3a1230" stroke="#FF8593" stroke-width="1.5"/><rect x="74" y="26" width="110" height="44" fill="#4d1438" stroke="#FF8593" stroke-width="1.5"/><rect x="110" y="34" width="110" height="40" fill="#63173e" stroke="#FF8593" stroke-width="2"/><text x="122" y="58" fill="#FFE5EC" font-size="11">三连套娃弹窗!</text></svg>`,
    goodSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="10" width="232" height="70" fill="#132238" stroke="#5EEBD4"/><rect x="24" y="20" width="212" height="32" fill="#1b324e"/><text x="34" y="40" fill="#D9F6FF" font-size="11">清晰首屏主内容（零打断）</text><rect x="24" y="58" width="212" height="16" fill="#0d4a46" stroke="#5EEBD4"/><text x="34" y="70" fill="#9AF7E5" font-size="10">页内轻量提示条 · 不抢焦点</text></svg>`,
  },
  longform: {
    badDesc: "把十几项填写、上传与协议塞进小弹窗，还要在弹窗里双层滚动；用户手滑点到遮罩外部，填了五分钟的数据瞬间归零。",
    goodDesc: "改法：多字段录入与多步向导应直接用独立页面路由，支持浏览器前进后退与草稿自动保存，不借弹窗外壳。",
    badSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="8" width="232" height="74" fill="#0d1022" stroke="#705FB4"/><rect x="66" y="14" width="128" height="62" fill="#2c1430" stroke="#FF8593" stroke-width="1.8"/><rect x="78" y="24" width="90" height="8" fill="#FF8593"/><rect x="78" y="38" width="90" height="8" fill="#B55B7A"/><rect x="78" y="52" width="90" height="8" fill="#B55B7A"/><rect x="178" y="22" width="6" height="46" fill="#FF8593"/></svg>`,
    goodSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="8" width="232" height="74" fill="#10253a" stroke="#5EEBD4" stroke-width="1.6"/><text x="26" y="26" fill="#5EEBD4" font-size="10.5" font-family="DM Mono, monospace">/checkout/step-2</text><rect x="26" y="34" width="132" height="12" fill="#1c4160"/><rect x="26" y="52" width="132" height="12" fill="#1c4160"/><rect x="174" y="34" width="58" height="36" fill="#0d4a46" stroke="#5EEBD4"/></svg>`,
  },
  validation: {
    badDesc: "表单少填了一个手机号就弹出整屏模态框报错：用户必须先关掉弹窗，再凭记忆回头找刚才报错的是哪一栏。",
    goodDesc: "改法：校验错误就近写在出错输入框下方（行内反馈），同时自动聚焦到第一个错误字段，眼手零跳转。",
    badSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="8" width="232" height="74" fill="#15132e" stroke="#705FB4"/><rect x="46" y="24" width="168" height="44" fill="#42122d" stroke="#FF8593" stroke-width="2"/><text x="64" y="50" fill="#FFE0E7" font-size="11">弹窗盖住了出错输入框</text></svg>`,
    goodSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="8" width="232" height="74" fill="#10253a" stroke="#5EEBD4"/><rect x="28" y="22" width="204" height="22" fill="#19334d" stroke="#FF8593" stroke-width="1.5"/><text x="28" y="60" fill="#5EEBD4" font-size="11">→ 就近行内提示：请填写 11 位手机号</text></svg>`,
  },
  fullscreen: {
    badDesc: "把弹窗拉到占满 95% 屏幕，背后一点语境都不剩，却还留着一道虚弱的边缝和关闭叉号，平白增加认知负担。",
    goodDesc: "改法：既然任务需要整屏施展，就大大方方进入独立详情页或平铺网格视图，用标准导航返回即可。",
    badSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="6" width="232" height="78" fill="#15132e" stroke="#705FB4"/><rect x="20" y="11" width="220" height="68" fill="#3a1533" stroke="#FF8593" stroke-width="2"/><text x="58" y="50" fill="#FFD6DF" font-size="11">95% 盖满 · 毫无显露语境</text></svg>`,
    goodSvg: `<svg viewBox="0 0 260 90" width="100%" height="90"><rect x="14" y="6" width="232" height="78" fill="#10253a" stroke="#5EEBD4" stroke-width="1.6"/><text x="26" y="24" fill="#5EEBD4" font-size="10.5">← 返回列表 · 独立页面视图</text><rect x="26" y="34" width="98" height="40" fill="#1c4160"/><rect x="134" y="34" width="98" height="40" fill="#183854"/></svg>`,
  },
};

function renderAntiCard(card) {
  const key = card.dataset.anti;
  const fixed = card.dataset.fixed === "true";
  const d = ANTI_DATA[key];
  card.querySelector(".anti-tag").textContent = fixed ? "更好改法" : "滥用覆盖";
  const btn = card.querySelector(".anti-toggle");
  btn.textContent = fixed ? "切回反例" : "看正确改法";
  btn.setAttribute("aria-pressed", String(fixed));
  card.querySelector(".anti-fig").innerHTML = fixed ? d.goodSvg : d.badSvg;
  card.querySelector(".anti-desc").textContent = fixed ? d.goodDesc : d.badDesc;
}

$$(".anti-card").forEach((card) => {
  renderAntiCard(card);
  card.querySelector(".anti-toggle").addEventListener("click", () => {
    card.dataset.fixed = card.dataset.fixed === "true" ? "false" : "true";
    renderAntiCard(card);
  });
});

// ==================== 7. 06 节：单变量诊断练习 ====================
const quizGrid = $("#quizGrid");
const quizFeedback = $("#quizFeedback");

quizGrid.innerHTML = QUIZ_ITEMS.map((item) => {
  const veilBg = `rgba(6, 9, 22, ${item.scrimOpacity})`;
  return `<button type="button" class="quiz-card" data-quiz="${item.id}" aria-pressed="false">
    <div class="quiz-mini" aria-hidden="true">
      <div class="qm-bg-row"><span>项目：2026 秋季发布</span><span>编辑中</span></div>
      <div class="qm-bg-cards"><span>文档 18 份</span><span>成员 6 位</span></div>
      <span class="qm-bg-foot">清空历史</span>
      <div class="qm-veil" style="background:${veilBg}"></div>
      <div class="qm-modal">
        <strong>删除整个项目？</strong>
        <div class="qm-modal-btns"><i>确认删除</i><b>取消</b></div>
      </div>
    </div>
    <span class="quiz-label">
      <span>${item.label}</span>
      <span class="quiz-meta">遮罩 ${Math.round(item.scrimOpacity * 100)}%</span>
    </span>
  </button>`;
}).join("");

$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const picked = QUIZ_ITEMS.find((q) => q.id === card.dataset.quiz);
    $$(".quiz-card").forEach((c) => {
      const it = QUIZ_ITEMS.find((q) => q.id === c.dataset.quiz);
      c.setAttribute("aria-pressed", String(c === card));
      c.classList.remove("is-correct", "is-wrong");
      if (c === card) c.classList.add(it.correct ? "is-correct" : "is-wrong");
      else if (it.correct) c.classList.add("is-correct");
    });
    quizFeedback.hidden = false;
    quizFeedback.className = `quiz-feedback ${picked.correct ? "is-correct" : "is-wrong"}`;
    quizFeedback.innerHTML = `<strong>${picked.label} · ${picked.correct ? "判断正确" : "再看一遍差异"}：</strong>${picked.reason}`;
  });
});

// ==================== 8. 07 节：原海报原生 <dialog> Top Layer 放大器 ====================
const posterImg = $("#poster");
const posterOpen = $("#posterOpen");
const posterDialog = $("#posterDialog");
const pdViewport = $("#pdViewport");
const pdImg = $("#pdImg");
const pdZoomIn = $("#pdZoomIn");
const pdZoomOut = $("#pdZoomOut");
const pdReset = $("#pdReset");
const pdClose = $("#pdClose");

let pScale = 1;
let pX = 0;
let pY = 0;
let pDragging = false;
let pStartX = 0;
let pStartY = 0;

function applyPosterTransform() {
  pdImg.style.transform = `translate(${pX}px, ${pY}px) scale(${pScale})`;
}

posterOpen.addEventListener("click", () => {
  pdImg.src = posterImg.src;
  pScale = 1;
  pX = 0;
  pY = 0;
  applyPosterTransform();
  if (typeof posterDialog.showModal === "function") posterDialog.showModal();
  else posterDialog.setAttribute("open", "");
});

pdClose.addEventListener("click", () => posterDialog.close());
pdZoomIn.addEventListener("click", () => {
  pScale = Math.min(3, +(pScale + 0.35).toFixed(2));
  applyPosterTransform();
});
pdZoomOut.addEventListener("click", () => {
  pScale = Math.max(0.75, +(pScale - 0.35).toFixed(2));
  applyPosterTransform();
});
pdReset.addEventListener("click", () => {
  pScale = 1;
  pX = 0;
  pY = 0;
  applyPosterTransform();
});

posterDialog.addEventListener("click", (e) => {
  if (e.target === posterDialog) posterDialog.close();
});
posterDialog.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && posterDialog.open) {
    e.preventDefault();
    posterDialog.close();
  }
});

pdViewport.addEventListener("pointerdown", (e) => {
  pDragging = true;
  pStartX = e.clientX - pX;
  pStartY = e.clientY - pY;
  pdViewport.setPointerCapture(e.pointerId);
});
pdViewport.addEventListener("pointermove", (e) => {
  if (!pDragging) return;
  pX = e.clientX - pStartX;
  pY = e.clientY - pStartY;
  applyPosterTransform();
});
pdViewport.addEventListener("pointerup", () => {
  pDragging = false;
});
pdViewport.addEventListener("pointercancel", () => {
  pDragging = false;
});
