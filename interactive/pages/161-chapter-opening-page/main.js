import { loop, reducedMotion } from "../../lib/stage.js";
import {
  ANATOMY_ROLES,
  CONTEXT_SPECS,
  HISTORY_ERAS,
  PRESETS,
  QUIZ_OPTIONS,
  SKIP_SCENARIOS,
  buildThumbBook,
  computeBudget,
  createInitialState,
  evaluate,
} from "./model.js";
import { createSpreadRenderer } from "./renderer.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// ==================== HERO WORKBENCH ====================
const state = createInitialState();
const canvas = $("#spread-canvas");
const renderer = createSpreadRenderer(canvas);

let evalCache = evaluate(state);
let dirty = true;
let introDone = false;
let introProgress = 0;

function setState(patch) {
  Object.assign(state, patch);
  evalCache = evaluate(state);
  dirty = true;
  syncUI();
  stageLoop.draw();
}

function syncUI() {
  const ev = evalCache;
  const s = ev.state;

  // 1. 顶栏状态与刊头微型推门徽
  const pill = $("#hero-pill");
  pill.textContent = ev.badge;
  pill.dataset.tone = ev.severity;

  // 微型松绿拱门内门扇实时随 doorOpen 推开
  const open = ev.doorOpen;
  const edgeX = 18 + open * 12; // 18..30
  const topY = 20 - open * 4;
  $("#ma-glow").setAttribute("points", `14,22 ${edgeX.toFixed(1)},${topY.toFixed(1)} ${edgeX.toFixed(1)},52 14,50`);
  $("#ma-leaf").setAttribute("points", `${edgeX.toFixed(1)},${topY.toFixed(1)} 43,${(14 - open * 5).toFixed(1)} 43,55 ${edgeX.toFixed(1)},52`);

  // 2. 跨页灰度落差仪
  $("#im-prev").style.width = `${ev.prevChapterInk}%`;
  $("#im-prev-val").textContent = `${ev.prevChapterInk}%`;
  const curBar = $("#im-cur");
  curBar.style.width = `${ev.openerInk}%`;
  curBar.classList.toggle("is-pass", ev.deltaInk >= 18 && ev.severity === "pass");
  $("#im-cur-val").textContent = `${ev.openerInk}%`;
  $("#im-next").style.width = `${ev.nextChapterInk}%`;
  $("#im-next-val").textContent = `${ev.nextChapterInk}%`;
  const deltaEl = $("#im-delta");
  deltaEl.textContent =
    ev.deltaInk >= 18
      ? `降灰 ${ev.deltaInk}% · 重置清晰`
      : ev.deltaInk > 0
        ? `仅降 ${ev.deltaInk}% · 未拉开`
        : "零降灰 · 与正文一样密";
  deltaEl.classList.toggle("is-pass", ev.deltaInk >= 18);

  // 3. 单真源诊单
  const card = $("#diag-card");
  card.dataset.tone = ev.severity;
  $("#diag-badge").textContent = ev.badge;
  $("#diag-head").textContent = ev.headline;
  $("#diag-reason").textContent = ev.reason;
  $("#diag-next").textContent = `试着改一步：${ev.nextStep}`;
  $("#m-sink").textContent = `${s.sink}%`;
  $("#m-delta").textContent = ev.deltaInk > 0 ? `-${ev.deltaInk}%` : ev.deltaInk === 0 ? "0%" : `+${Math.abs(ev.deltaInk)}%`;
  $("#m-scale").textContent = `${s.scale.toFixed(1)}×`;
  $("#m-white").textContent = `${ev.netWhite}%`;

  // 4. 控件回显
  $("#ctrl-sink").value = String(s.sink);
  $("#out-sink").textContent = `${s.sink}%`;
  $("#ctrl-scale").value = String(s.scale);
  $("#out-scale").textContent = `${s.scale.toFixed(2)}×`;
  $("#ctrl-flow").value = String(Math.round(s.flow * 100));

  for (const btn of $$("[data-theme]")) {
    const on = btn.dataset.theme === s.theme;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  for (const btn of $$("[data-placement]")) {
    const on = btn.dataset.placement === s.placement;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  for (const btn of $$("[data-cue]")) {
    const on = btn.dataset.cue === s.cueMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }

  const headBtn = $("#tog-head");
  headBtn.textContent = s.runningHead ? "旧书眉：留" : "旧书眉：隐";
  headBtn.setAttribute("aria-pressed", String(s.runningHead));
  headBtn.classList.toggle("is-clean", !s.runningHead);

  const folioBtn = $("#tog-folio");
  const folioLabel = s.folio === "top" ? "页码：顶角" : s.folio === "bottom" ? "页码：底心" : "页码：隐藏";
  folioBtn.textContent = folioLabel;
  folioBtn.setAttribute("aria-pressed", String(s.folio === "top"));
  folioBtn.classList.toggle("is-clean", s.folio !== "top");

  const indBtn = $("#tog-indent");
  indBtn.textContent = s.firstIndent ? "首段：缩进" : "首段：顶格";
  indBtn.setAttribute("aria-pressed", String(s.firstIndent && s.placement !== "spread"));
  indBtn.classList.toggle("is-clean", !s.firstIndent || s.placement === "spread");

  // 5. 底沿手撕毛边深松绿五词实况带
  for (const kw of ev.keywords) {
    const li = $(`[data-kw="${kw.id}"]`);
    const tag = $(`[data-live="${kw.id}"]`);
    if (li) li.classList.toggle("is-ok", kw.ok);
    if (tag) tag.textContent = kw.tag;
  }
}

// 渲染循环（空闲时零浪费重绘；开场前 0.7s 平滑落定；拖动时逐帧 60fps 重绘）
const stageLoop = loop(canvas, (t, dt, { still }) => {
  if (still) {
    introDone = true;
    introProgress = 1;
    renderer.render(evalCache, 0);
    dirty = false;
    return;
  }
  if (!introDone) {
    introProgress = Math.min(1, t / 0.65);
    const ease = 1 - Math.pow(1 - introProgress, 3);
    // 开场前 0.65 秒有极克制的翻页余韵落位（-0.18 -> 0），任何时刻截屏都端正好看
    const previewEv = introProgress < 1 && state.flow === 0
      ? evaluate({ ...state, flow: -0.16 * (1 - ease) })
      : evalCache;
    renderer.render(previewEv, t);
    if (introProgress >= 1) {
      introDone = true;
      dirty = false;
    }
    return;
  }
  if (dirty) {
    renderer.render(evalCache, t);
    dirty = false;
  }
});

// 画布交互：左右横拖翻阅上下章（兼容鼠标与触屏 `perf.mjs`） + 直点红标就地修错 + 键盘微调
let dragActive = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartFlow = 0;
let dragSpan = 160;

function beginDrag(clientX) {
  introDone = true;
  dragActive = true;
  dragMoved = false;
  dragStartX = clientX;
  dragStartFlow = state.flow;
  dragSpan = Math.max(110, canvas.getBoundingClientRect().width * 0.42);
}

function moveDrag(clientX) {
  if (!dragActive) return;
  const dx = clientX - dragStartX;
  if (Math.abs(dx) > 3) dragMoved = true;
  const nextFlow = Math.max(-1, Math.min(1, dragStartFlow + dx / dragSpan));
  if (Math.abs(nextFlow - state.flow) > 0.001) {
    state.flow = nextFlow;
    evalCache.state.flow = nextFlow;
    evalCache.flowLabel =
      nextFlow < -0.28 ? "向左回翻 · 对照第一章密排正文" : nextFlow > 0.28 ? "向右掀进 · 检验第二章正文承接" : "正在编排 · 第二章扉页跨页";
    dirty = true;
  }
}

function endDrag(clientX, clientY) {
  if (!dragActive) return;
  const wasClick = !dragMoved;
  dragActive = false;
  if (wasClick && clientX != null && clientY != null) {
    const hit = renderer.hitTest(clientX, clientY);
    if (hit) {
      setState(hit.patch);
      return;
    }
  }
  evalCache = evaluate(state);
  dirty = true;
  syncUI();
  stageLoop.draw();
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触屏走原生 touch 事件以完全兼容 perf.mjs
  if (e.button !== 0) return;
  beginDrag(e.clientX);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  moveDrag(e.clientX);
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  endDrag(e.clientX, e.clientY);
});
canvas.addEventListener("pointercancel", () => { dragActive = false; });

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  beginDrag(e.touches[0].clientX);
}, { passive: true });
canvas.addEventListener("touchmove", (e) => {
  if (!dragActive || e.touches.length !== 1) return;
  moveDrag(e.touches[0].clientX);
}, { passive: true });
canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  endDrag(t ? t.clientX : null, t ? t.clientY : null);
});

canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setState({ flow: Math.max(-1, +(state.flow - 0.15).toFixed(2)) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setState({ flow: Math.min(1, +(state.flow + 0.15).toFixed(2)) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setState({ sink: Math.max(0, state.sink - 4) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setState({ sink: Math.min(62, state.sink + 4) });
  }
});

// 控件事件绑定
for (const btn of $$("[data-theme]")) {
  btn.addEventListener("click", () => setState({ theme: btn.dataset.theme }));
}
for (const btn of $$("[data-placement]")) {
  btn.addEventListener("click", () => setState({ placement: btn.dataset.placement, flow: 0 }));
}
for (const btn of $$("[data-cue]")) {
  btn.addEventListener("click", () => {
    const cueMode = btn.dataset.cue;
    const extra = cueMode === "balanced" && state.scale < 2.2 ? { scale: 2.9 } : cueMode === "flat" ? { scale: 1.15 } : {};
    setState({ cueMode, flow: 0, ...extra });
  });
}
$("#ctrl-sink").addEventListener("input", (e) => setState({ sink: Number(e.target.value), flow: 0 }));
$("#ctrl-scale").addEventListener("input", (e) => setState({ scale: Number(e.target.value), flow: 0 }));
$("#ctrl-flow").addEventListener("input", (e) => setState({ flow: Number(e.target.value) / 100 }));
for (const btn of $$("[data-flow]")) {
  btn.addEventListener("click", () => setState({ flow: Number(btn.dataset.flow) }));
}
$("#tog-head").addEventListener("click", () => setState({ runningHead: !state.runningHead, flow: 0 }));
$("#tog-folio").addEventListener("click", () => {
  const next = state.folio === "top" ? "bottom" : state.folio === "bottom" ? "hidden" : "top";
  setState({ folio: next, flow: 0 });
});
$("#tog-indent").addEventListener("click", () => setState({ firstIndent: !state.firstIndent, flow: 0 }));

for (const btn of $$("[data-preset]")) {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState({ ...p.state });
  });
}

window.addEventListener("resize", () => {
  renderer.resize();
  dirty = true;
  stageLoop.draw();
});

syncUI();
if (reducedMotion.matches) stageLoop.draw();

// ==================== 01 五重功能剖视 ====================
function selectAnatomy(roleId) {
  const role = ANATOMY_ROLES.find((r) => r.id === roleId) || ANATOMY_ROLES[0];
  for (const btn of $$("#anatomy-tabs .anat-btn")) {
    const on = btn.dataset.role === role.id;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  }
  for (const g of $$("#anat-svg .anat-hl")) {
    g.classList.toggle("is-on", g.id === `anat-hl-${role.zone}`);
  }
  $("#an-no").textContent = `${role.no} · ${role.en}`;
  $("#an-metric").textContent = role.metric;
  $("#an-title").textContent = role.zh;
  $("#an-sum").textContent = role.summary;
  $("#an-det").textContent = role.detail;
}
for (const btn of $$("#anatomy-tabs .anat-btn")) {
  btn.addEventListener("click", () => selectAnatomy(btn.dataset.role));
}
selectAnatomy("transition");

// ==================== 02 历史四时代标本 ====================
function eraSVG(id) {
  if (id === "rubric") {
    return `<svg viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="260" fill="#F2E4CE"/>
      <rect x="20" y="20" width="180" height="220" fill="none" stroke="#8C3227" stroke-opacity="0.35"/>
      <text x="32" y="48" fill="#A62626" font-family="Cormorant Garamond, serif" font-style="italic" font-size="13" font-weight="600">INCIPIT CAPITULUM II</text>
      <rect x="32" y="60" width="44" height="44" fill="#A62626"/>
      <text x="54" y="93" text-anchor="middle" fill="#FAF3E8" font-family="Cormorant Garamond, serif" font-size="34" font-weight="700">Q</text>
      <g fill="#2B2620" fill-opacity="0.72">
        <rect x="84" y="64" width="104" height="4"/><rect x="84" y="74" width="96" height="4"/>
        <rect x="84" y="84" width="102" height="4"/><rect x="84" y="94" width="90" height="4"/>
        <rect x="32" y="114" width="156" height="4"/><rect x="32" y="124" width="148" height="4"/>
        <rect x="32" y="134" width="154" height="4"/><rect x="32" y="144" width="140" height="4"/>
        <rect x="32" y="160" width="156" height="4"/><rect x="32" y="170" width="150" height="4"/>
        <rect x="32" y="180" width="144" height="4"/><rect x="32" y="190" width="110" height="4"/>
      </g>
    </svg>`;
  }
  if (id === "recto") {
    return `<svg viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="260" fill="#FAF3E8"/>
      <line x1="196" y1="16" x2="196" y2="96" stroke="#384435" stroke-width="1"/>
      <text x="190" y="60" text-anchor="end" fill="#384435" font-family="JetBrains Mono, monospace" font-size="9">SINK 32%</text>
      <text x="110" y="98" text-anchor="middle" fill="#8C3227" font-family="Cormorant Garamond, serif" font-size="13" letter-spacing="2">CHAPTER II</text>
      <text x="110" y="124" text-anchor="middle" fill="#121417" font-family="Noto Serif SC, serif" font-size="19" font-weight="900">纸页间的停顿</text>
      <line x1="88" y1="138" x2="132" y2="138" stroke="#384435" stroke-width="1.2"/>
      <g fill="#222522" fill-opacity="0.68">
        <rect x="36" y="156" width="148" height="4"/><rect x="36" y="167" width="144" height="4"/>
        <rect x="36" y="178" width="148" height="4"/><rect x="36" y="189" width="136" height="4"/>
        <rect x="36" y="200" width="148" height="4"/><rect x="36" y="211" width="102" height="4"/>
      </g>
      <text x="110" y="242" text-anchor="middle" fill="#3B4339" font-family="JetBrains Mono, monospace" font-size="10">21</text>
    </svg>`;
  }
  if (id === "swiss") {
    return `<svg viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="260" fill="#F7F1E5"/>
      <line x1="68" y1="16" x2="68" y2="244" stroke="#384435" stroke-opacity="0.24" stroke-dasharray="3 3"/>
      <line x1="20" y1="92" x2="200" y2="92" stroke="#384435" stroke-opacity="0.24" stroke-dasharray="3 3"/>
      <text x="26" y="114" fill="#8C3227" font-family="JetBrains Mono, monospace" font-size="22" font-weight="500">02</text>
      <text x="74" y="112" fill="#121417" font-family="Noto Serif SC, serif" font-size="18" font-weight="900">比例与沉降</text>
      <text x="74" y="128" fill="#384435" font-family="Archivo, sans-serif" font-size="9" letter-spacing="1">PROPORTION &amp; SINK</text>
      <g fill="#222522" fill-opacity="0.65">
        <rect x="74" y="150" width="118" height="4"/><rect x="74" y="161" width="114" height="4"/>
        <rect x="74" y="172" width="118" height="4"/><rect x="74" y="183" width="108" height="4"/>
        <rect x="74" y="194" width="90" height="4"/>
      </g>
    </svg>`;
  }
  return `<svg viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
    <rect width="220" height="260" fill="#EFDAC1"/>
    <path d="M98 228 V100 A64 60 0 0 1 220 100 V260 L98 228 Z" fill="#384435"/>
    <polygon points="126,108 164,92 164,238 126,226" fill="#FAF3E8"/>
    <polygon points="164,92 220,56 220,260 164,238" fill="#121417"/>
    <rect x="18" y="64" width="24" height="3" fill="#384435"/>
    <text x="18" y="92" fill="#121417" font-family="Noto Serif SC, serif" font-size="17" font-weight="900">新章启程</text>
    <text x="18" y="110" fill="#384435" font-family="Archivo, sans-serif" font-size="8.5">THRESHOLD</text>
    <path d="M0 260 L0 210 Q56 204 82 260 Z" fill="#D7968F" fill-opacity="0.5"/>
  </svg>`;
}

function selectEra(id) {
  const era = HISTORY_ERAS.find((e) => e.id === id) || HISTORY_ERAS[0];
  for (const btn of $$("#era-list .era-btn")) {
    const on = btn.dataset.era === era.id;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  }
  $("#era-plate").innerHTML = eraSVG(era.id);
  $("#era-kicker").textContent = `${era.year} · ${era.tag}`;
  $("#era-title").textContent = era.title;
  $("#era-desc").textContent = era.desc;
  $("#era-spec").textContent = `版面特征：${era.spec}`;
}
for (const btn of $$("#era-list .era-btn")) {
  btn.addEventListener("click", () => selectEra(btn.dataset.era));
}
selectEra("rubric");

// ==================== 03 书口速翻节律仪 ====================
let thumbMode = "none";
let scanTimer = 0;

function renderThumbBook(modeId) {
  thumbMode = modeId;
  const data = buildThumbBook(modeId);
  for (const btn of $$("#thumb-modes .dark-chip")) {
    const on = btn.dataset.tmode === modeId;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  const strip = $("#thumb-strip");
  strip.innerHTML = data.pages
    .map((p) => {
      const cls = p.kind === "opener" ? "is-opener" : p.kind === "verso-rest" ? "is-verso" : "";
      const h = Math.max(8, Math.round((p.ink / 52) * 100));
      return `<div class="tp-col" data-pg="${p.page}">
        <div class="tp-sheet ${cls}" title="第 ${p.page} 页 · 灰度 ${p.ink}%">
          <div class="tp-ink" style="height:${h}%"></div>
        </div>
        <span class="tp-num">${p.page}</span>
      </div>`;
    })
    .join("");
  $("#tr-body").textContent = "45%";
  $("#tr-opener").textContent = `${data.mode.openerInk}%`;
  $("#tr-contrast").textContent = `${data.maxContrast}%`;
  $("#tr-note").textContent = data.mode.note;
}

for (const btn of $$("#thumb-modes .dark-chip")) {
  btn.addEventListener("click", () => {
    clearInterval(scanTimer);
    renderThumbBook(btn.dataset.tmode);
  });
}

$("#btn-flip-sim").addEventListener("click", () => {
  clearInterval(scanTimer);
  const cols = $$("#thumb-strip .tp-col");
  if (reducedMotion.matches) {
    cols.forEach((c) => c.classList.toggle("is-scan", c.dataset.pg === "9" || c.dataset.pg === "17"));
    return;
  }
  let idx = 0;
  scanTimer = setInterval(() => {
    cols.forEach((c, i) => c.classList.toggle("is-scan", i === idx));
    idx++;
    if (idx >= cols.length) {
      clearInterval(scanTimer);
      setTimeout(() => cols.forEach((c) => c.classList.remove("is-scan")), 320);
    }
  }, 115);
});
renderThumbBook("none");

// ==================== 04 印张页耗与中缝安全测算台 ====================
let budgetStrategy = "recto";
let budgetChapters = 12;

function renderBudget() {
  const res = computeBudget(budgetStrategy, budgetChapters);
  for (const btn of $$("#bc-strategy .chip")) {
    const on = btn.dataset.strat === budgetStrategy;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  $("#bc-ch-out").textContent = `${budgetChapters} 章`;
  $("#bc-name").textContent = res.title;
  $("#bc-extra").textContent = res.extraPages === 0 ? "0 页（零额外空白）" : `约 +${res.extraPages} 页`;
  $("#bc-risk").textContent = res.gutterRisk;
  $("#bc-verdict").textContent = res.verdict;

  const svg = $("#bc-svg");
  if (budgetStrategy === "recto") {
    svg.innerHTML = `
      <rect x="20" y="20" width="150" height="170" fill="#FAF3E8" stroke="#384435"/>
      <rect x="170" y="20" width="150" height="170" fill="#FFFDF9" stroke="#384435"/>
      <rect x="163" y="20" width="14" height="170" fill="#384435" fill-opacity="0.14"/>
      <text x="95" y="108" text-anchor="middle" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="11">空白左页（Verso）</text>
      <text x="245" y="76" text-anchor="middle" fill="#8C3227" font-family="Cormorant Garamond, serif" font-size="11">CHAPTER II</text>
      <text x="245" y="98" text-anchor="middle" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="15">右页沉降起章</text>
      <rect x="198" y="114" width="94" height="4" fill="#384435" fill-opacity="0.5"/>
      <rect x="198" y="124" width="88" height="4" fill="#384435" fill-opacity="0.4"/>
      <rect x="78" y="170" width="184" height="17" fill="#FFFDF9" fill-opacity="0.92" stroke="#1D6344" stroke-opacity="0.35"/>
      <text x="170" y="182" text-anchor="middle" fill="#1D6344" font-family="JetBrains Mono, monospace" font-size="9.5">中缝完全安全 · 无字跨脊</text>
    `;
  } else if (budgetStrategy === "anypage") {
    svg.innerHTML = `
      <rect x="20" y="20" width="150" height="170" fill="#F5E8D6" stroke="#384435"/>
      <rect x="170" y="20" width="150" height="170" fill="#FFFDF9" stroke="#384435"/>
      <rect x="163" y="20" width="14" height="170" fill="#384435" fill-opacity="0.14"/>
      <g fill="#384435" fill-opacity="0.48">
        <rect x="38" y="42" width="110" height="4"/><rect x="38" y="52" width="106" height="4"/>
        <rect x="38" y="62" width="112" height="4"/><rect x="38" y="72" width="84" height="4"/>
      </g>
      <text x="95" y="108" text-anchor="middle" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="10.5">上章自然收尾</text>
      <text x="245" y="78" text-anchor="middle" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="14">另起新页沉降</text>
      <rect x="198" y="96" width="94" height="4" fill="#384435" fill-opacity="0.5"/>
      <rect x="198" y="106" width="88" height="4" fill="#384435" fill-opacity="0.4"/>
      <rect x="78" y="170" width="184" height="17" fill="#FFFDF9" fill-opacity="0.92" stroke="#1D6344" stroke-opacity="0.35"/>
      <text x="170" y="182" text-anchor="middle" fill="#1D6344" font-family="JetBrains Mono, monospace" font-size="9.5">零空白页耗 · 成本最省</text>
    `;
  } else {
    svg.innerHTML = `
      <rect x="20" y="20" width="150" height="170" fill="#EFDAC1" stroke="#384435"/>
      <rect x="170" y="20" width="150" height="170" fill="#384435" stroke="#384435"/>
      <rect x="160" y="20" width="20" height="170" fill="#A62626" fill-opacity="0.22"/>
      <line x1="160" y1="20" x2="160" y2="190" stroke="#A62626" stroke-dasharray="4 3"/>
      <line x1="180" y1="20" x2="180" y2="190" stroke="#A62626" stroke-dasharray="4 3"/>
      <text x="86" y="94" text-anchor="middle" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="14">字留左页</text>
      <polygon points="222,58 274,40 274,170 222,158" fill="#FAF3E8"/>
      <polygon points="274,40 320,20 320,190 274,170" fill="#121417"/>
      <rect x="66" y="170" width="208" height="17" fill="#FFFDF9" fill-opacity="0.94" stroke="#8C3227" stroke-opacity="0.4"/>
      <text x="170" y="182" text-anchor="middle" fill="#8C3227" font-family="JetBrains Mono, monospace" font-size="9.5">避开红线装订沟（8–14mm）</text>
    `;
  }
}

for (const btn of $$("#bc-strategy .chip")) {
  btn.addEventListener("click", () => {
    budgetStrategy = btn.dataset.strat;
    renderBudget();
  });
}
$("#bc-chapters").addEventListener("input", (e) => {
  budgetChapters = Number(e.target.value);
  renderBudget();
});
renderBudget();

// ==================== 05 五种出版物蓝图 ====================
function contextSVG(id) {
  if (id === "novel") {
    return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="220" fill="#F4E7D7"/>
      <rect x="18" y="16" width="162" height="188" fill="#FAF3E8" stroke="#384435"/>
      <rect x="180" y="16" width="162" height="188" fill="#FFFDF9" stroke="#384435"/>
      <text x="261" y="72" text-anchor="middle" fill="#8C3227" font-family="Cormorant Garamond, serif" font-size="13" letter-spacing="2">II</text>
      <text x="261" y="96" text-anchor="middle" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="16">潮汐之前的静默</text>
      <text x="261" y="116" text-anchor="middle" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="10">「停步之处，远行始生。」</text>
      <g fill="#222" fill-opacity="0.6"><rect x="206" y="136" width="110" height="3.5"/><rect x="206" y="145" width="106" height="3.5"/><rect x="206" y="154" width="110" height="3.5"/><rect x="206" y="163" width="82" height="3.5"/></g>
      <text x="261" y="192" text-anchor="middle" fill="#3B4339" font-family="JetBrains Mono, monospace" font-size="9">41</text>
    </svg>`;
  }
  if (id === "textbook") {
    return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="220" fill="#F4E7D7"/>
      <rect x="18" y="16" width="162" height="188" fill="#EFE4D4" stroke="#384435"/>
      <rect x="180" y="16" width="162" height="188" fill="#FFFDF9" stroke="#384435"/>
      <text x="198" y="54" fill="#8C3227" font-family="JetBrains Mono, monospace" font-size="20" font-weight="700">CH.02</text>
      <text x="198" y="78" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="15">网格与版面节奏</text>
      <rect x="198" y="92" width="126" height="62" fill="#F4E7D7" stroke="#384435" stroke-opacity="0.35"/>
      <text x="206" y="109" fill="#2B3B28" font-family="Noto Serif SC, serif" font-weight="700" font-size="9.5">本章导学目标：</text>
      <text x="206" y="124" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="9">· 区分单页沉降与跨页门扉</text>
      <text x="206" y="137" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="9">· 核算印张空白页成本</text>
      <text x="206" y="150" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="9">· 规避书脊装订吞字</text>
      <rect x="198" y="168" width="122" height="3.5" fill="#222" fill-opacity="0.55"/>
      <rect x="198" y="177" width="102" height="3.5" fill="#222" fill-opacity="0.55"/>
    </svg>`;
  }
  if (id === "artbook") {
    return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="220" fill="#F4E7D7"/>
      <rect x="18" y="16" width="162" height="188" fill="#384435" stroke="#384435"/>
      <polygon points="72,62 124,42 124,174 72,162" fill="#FAF3E8"/>
      <polygon points="124,42 180,16 180,204 124,174" fill="#121417"/>
      <rect x="180" y="16" width="162" height="188" fill="#FAF3E8" stroke="#384435"/>
      <text x="204" y="114" fill="#8C3227" font-family="Archivo, sans-serif" font-size="10" letter-spacing="1.5">PART 02 · 1928–1965</text>
      <text x="204" y="140" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="17">光进入混凝土</text>
      <line x1="204" y1="152" x2="244" y2="152" stroke="#384435" stroke-width="1.5"/>
    </svg>`;
  }
  if (id === "annual") {
    return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="220" fill="#F4E7D7"/>
      <rect x="18" y="16" width="324" height="188" fill="#384435"/>
      <rect x="18" y="16" width="110" height="188" fill="#232C21"/>
      <text x="42" y="122" fill="#F0B6AD" font-family="Cormorant Garamond, serif" font-size="52" font-weight="700">02</text>
      <text x="150" y="92" fill="#FAF3E8" font-family="Noto Serif SC, serif" font-weight="900" font-size="20">公共阅读空间尺规</text>
      <text x="150" y="116" fill="#F0B6AD" font-family="Archivo, sans-serif" font-size="10" letter-spacing="1.5">SECTION TWO · SPATIAL AUDIT</text>
      <line x1="150" y1="130" x2="292" y2="130" stroke="#F0B6AD" stroke-opacity="0.5"/>
      <text x="150" y="150" fill="#E5DCCE" font-family="Noto Serif SC, serif" font-size="11">六座新馆的光照、静度与入口过渡实测</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="220" fill="#F4E7D7"/>
    <rect x="115" y="12" width="130" height="196" rx="10" fill="#121417"/>
    <rect x="122" y="22" width="116" height="176" fill="#FAF3E8"/>
    <rect x="122" y="22" width="116" height="26" fill="#384435"/>
    <text x="132" y="39" fill="#F0B6AD" font-family="JetBrains Mono, monospace" font-size="9">CHAPTER 02</text>
    <text x="132" y="76" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="14">纸页间的停顿</text>
    <line x1="132" y1="86" x2="162" y2="86" stroke="#8C3227" stroke-width="1.5"/>
    <g fill="#222" fill-opacity="0.62">
      <rect x="132" y="102" width="94" height="3.5"/><rect x="132" y="112" width="90" height="3.5"/>
      <rect x="132" y="122" width="94" height="3.5"/><rect x="132" y="132" width="84" height="3.5"/>
      <rect x="132" y="148" width="94" height="3.5"/><rect x="132" y="158" width="76" height="3.5"/>
    </g>
    <text x="180" y="188" text-anchor="middle" fill="#1D6344" font-family="Noto Serif SC, serif" font-size="8.5">首屏即见正文首段，不留白屏</text>
  </svg>`;
}

function selectContext(id) {
  const c = CONTEXT_SPECS.find((x) => x.id === id) || CONTEXT_SPECS[0];
  for (const btn of $$("#ctx-tabs .ctx-tab")) {
    const on = btn.dataset.ctx === c.id;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  }
  $("#ctx-diagram").innerHTML = contextSVG(c.id);
  $("#ctx-en").textContent = c.en;
  $("#ctx-title").textContent = c.label;
  $("#ctx-sink").textContent = c.sink;
  $("#ctx-layout").textContent = c.layout;
  $("#ctx-elements").textContent = c.elements;
  $("#ctx-avoid").textContent = c.avoid;
  $("#ctx-note").textContent = c.note;
}
for (const btn of $$("#ctx-tabs .ctx-tab")) {
  btn.addEventListener("click", () => selectContext(btn.dataset.ctx));
}
selectContext("novel");

// ==================== 06 什么时候别用 ====================
function selectSkip(id) {
  const item = SKIP_SCENARIOS.find((x) => x.id === id) || SKIP_SCENARIOS[0];
  for (const btn of $$("#skip-pills .skip-btn")) {
    const on = btn.dataset.skip === item.id;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  }
  $("#sc-bad-title").textContent = item.badTitle;
  $("#sc-bad-desc").textContent = item.badDesc;
  $("#sc-bad-foot").textContent = `阅读代价：${item.frictionBad}`;
  $("#sc-good-title").textContent = item.goodTitle;
  $("#sc-good-desc").textContent = item.goodDesc;
  $("#sc-good-foot").textContent = `实际效果：${item.frictionGood}`;
}
for (const btn of $$("#skip-pills .skip-btn")) {
  btn.addEventListener("click", () => selectSkip(btn.dataset.skip));
}
selectSkip("short-memo");

// ==================== 07 练一练（四份单变量差错扉页） ====================
let quizAnswered = false;

function quizSpreadSVG(opt, reveal) {
  const sinkY = opt.runningHead ? 40 : 24 + opt.sink * 1.5;
  const headEl = opt.runningHead
    ? `<text x="152" y="23" fill="${reveal ? "#A62626" : "#555"}" font-family="Noto Serif SC, serif" font-size="7.5">第一章 · 边界</text>
       <text x="242" y="23" text-anchor="end" fill="${reveal ? "#A62626" : "#555"}" font-family="JetBrains Mono, monospace" font-size="7.5">21</text>
       <line x1="152" y1="28" x2="242" y2="28" stroke="${reveal ? "#A62626" : "#777"}" stroke-opacity="0.5"/>`
    : `<text x="197" y="162" text-anchor="middle" fill="#464C46" font-family="JetBrains Mono, monospace" font-size="7.5">21</text>`;

  const titleEl = opt.gutterCut
    ? `<text x="136" y="${sinkY + 12}" text-anchor="middle" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="14">纸页间的停顿</text>
       <rect x="133" y="${sinkY - 4}" width="6" height="24" fill="#121417" fill-opacity="0.34"/>`
    : `<text x="152" y="${sinkY}" fill="#8C3227" font-family="Cormorant Garamond, serif" font-size="8.5" letter-spacing="1.2">CHAPTER II</text>
       <text x="152" y="${sinkY + 16}" fill="#121417" font-family="Noto Serif SC, serif" font-weight="900" font-size="13.5">纸页间的停顿</text>
       <line x1="152" y1="${sinkY + 23}" x2="178" y2="${sinkY + 23}" stroke="#384435" stroke-width="1.2"/>`;

  const bodyEl = opt.spoiler
    ? `<g fill="#3B4339">
         <rect x="152" y="${sinkY + 29}" width="88" height="3"/><rect x="152" y="${sinkY + 36}" width="84" height="3"/>
         <rect x="152" y="${sinkY + 43}" width="88" height="3"/><rect x="152" y="${sinkY + 50}" width="80" height="3"/>
         <rect x="152" y="${sinkY + 57}" width="88" height="3"/><rect x="152" y="${sinkY + 64}" width="82" height="3"/>
         <rect x="152" y="${sinkY + 72}" width="40" height="17" fill="#D7968F" fill-opacity="0.48"/>
         <rect x="198" y="${sinkY + 72}" width="42" height="17" fill="#384435" fill-opacity="0.38"/>
       </g>`
    : opt.gutterCut
      ? `<text x="197" y="${sinkY + 34}" text-anchor="middle" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="8">「停下脚步，方见新境。」</text>`
      : `<text x="152" y="${sinkY + 35}" fill="#3B4339" font-family="Noto Serif SC, serif" font-size="8">「停下脚步，方见新境。」</text>
         <g fill="#222" fill-opacity="0.56">
           <rect x="152" y="${sinkY + 48}" width="88" height="3"/><rect x="152" y="${sinkY + 56}" width="84" height="3"/>
           <rect x="152" y="${sinkY + 64}" width="88" height="3"/><rect x="152" y="${sinkY + 72}" width="66" height="3"/>
         </g>`;

  let overlay = "";
  if (reveal) {
    if (opt.runningHead) {
      overlay = `<rect x="148" y="14" width="98" height="20" fill="#A62626" fill-opacity="0.16" stroke="#A62626" stroke-dasharray="3 2"/>
                 <text x="197" y="150" text-anchor="middle" fill="#A62626" font-family="Noto Serif SC, serif" font-weight="700" font-size="8.5">沉降仅 4% · 旧书眉未清</text>`;
    } else if (opt.spoiler) {
      overlay = `<rect x="148" y="${sinkY + 26}" width="96" height="80" fill="#A62626" fill-opacity="0.14" stroke="#A62626" stroke-dasharray="3 2"/>
                 <text x="197" y="150" text-anchor="middle" fill="#A62626" font-family="Noto Serif SC, serif" font-weight="700" font-size="8.5">灰度 ${opt.ink}% · 剧透挤满</text>`;
    } else if (opt.gutterCut) {
      overlay = `<rect x="128" y="12" width="16" height="156" fill="#A62626" fill-opacity="0.2" stroke="#A62626" stroke-dasharray="3 2"/>
                 <text x="197" y="150" text-anchor="middle" fill="#A62626" font-family="Noto Serif SC, serif" font-weight="700" font-size="8.5">主标题跨脊吞字</text>`;
    } else {
      overlay = `<line x1="246" y1="16" x2="246" y2="${sinkY}" stroke="#1D6344" stroke-width="1.4"/>
                 <text x="197" y="150" text-anchor="middle" fill="#1D6344" font-family="Noto Serif SC, serif" font-weight="700" font-size="8.5">沉降 30% · 灰度 ${opt.ink}% · 成立</text>`;
    }
  }

  return `<svg viewBox="0 0 272 180" xmlns="http://www.w3.org/2000/svg">
    <rect width="272" height="180" fill="#E6D2B7"/>
    <rect x="14" y="12" width="122" height="156" fill="#EFDAC1" stroke="#384435" stroke-opacity="0.6"/>
    <rect x="136" y="12" width="122" height="156" fill="#FAF3E8" stroke="#384435" stroke-opacity="0.6"/>
    <line x1="136" y1="12" x2="136" y2="168" stroke="#121417" stroke-opacity="0.25" stroke-width="2"/>
    <path d="M56 90 A22 22 0 1 1 94 106" fill="none" stroke="#D7968F" stroke-opacity="0.55" stroke-width="1"/>
    ${headEl}${titleEl}${bodyEl}${overlay}
  </svg>`;
}

function renderQuiz(chosenId = null) {
  const grid = $("#quiz-grid");
  grid.innerHTML = QUIZ_OPTIONS.map((opt) => {
    const isChosen = chosenId === opt.id;
    const cls = [
      "quiz-card",
      isChosen ? "is-chosen" : "",
      isChosen && opt.correct ? "is-right" : "",
      quizAnswered && opt.correct ? "is-revealed-right" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const tag = !quizAnswered ? "点击作答" : opt.correct ? "✓ 成立" : isChosen ? "× 失分点" : `灰度 ${opt.ink}%`;
    return `<button type="button" class="${cls}" data-quiz="${opt.id}" aria-pressed="${isChosen}">
      ${quizSpreadSVG(opt, quizAnswered)}
      <span class="quiz-label"><span>${opt.label}</span><span class="quiz-tag">${tag}</span></span>
    </button>`;
  }).join("");

  for (const btn of $$("#quiz-grid .quiz-card")) {
    btn.addEventListener("click", () => {
      quizAnswered = true;
      const opt = QUIZ_OPTIONS.find((x) => x.id === btn.dataset.quiz);
      renderQuiz(opt.id);
      const box = $("#quiz-verdict");
      box.dataset.tone = opt.correct ? "pass" : "err";
      $("#qv-title").textContent = opt.verdictTitle;
      $("#qv-text").textContent = opt.verdictText;
    });
  }
}
renderQuiz();

// ==================== 08 原海报放大、拖动与 Esc 关闭 ====================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const posterBtn = $("#poster-btn");
let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbSX = 0;
let lbSY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  $("#lb-zoom-reset").textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => { lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2)); applyLbTransform(); });
$("#lb-zoom-out").addEventListener("click", () => { lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2)); applyLbTransform(); });
$("#lb-zoom-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.6, Math.min(3, +(lbScale + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbDrag = true;
  lbSX = e.clientX - lbX;
  lbSY = e.clientY - lbY;
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbSX;
  lbY = e.clientY - lbSY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = false; });
lbStage.addEventListener("pointercancel", () => { lbDrag = false; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});
