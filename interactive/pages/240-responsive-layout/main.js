// 240 响应式布局 · 页面交互控制层
import {
  ANTI_CASES,
  CONTENT_PRESETS,
  HISTORY_STEPS,
  INITIAL_STATE,
  PILLAR_FAULTS,
  QUIZ_CONFIG,
  REORDER_PATTERNS,
  clampBreakpoints,
  compareBreakpointStrategies,
  evaluateAll,
  quizPreviewAt,
} from "./model.js";
import { createMediaCanvas, createRulerCanvas } from "./hero-canvas.js";

// ==================== 全局开场状态 ====================
const state = {
  bp1: INITIAL_STATE.bp1,
  bp2: INITIAL_STATE.bp2,
  preset: INITIAL_STATE.preset,
  wireframe: INITIAL_STATE.wireframe,
  activeDevice: INITIAL_STATE.activeDevice,
  hasInteracted: false, // 至少拖动或步进过断点后，才露出低调的「参考校准」按钮
  openMenus: { desktop: false, tablet: false, mobile: false },
  evalRes: null,
};
state.evalRes = evaluateAll(state.bp1, state.bp2, state.preset);

// 原海报主视觉包豪斯小图 SVG
function bauhausMiniSvg() {
  return `<svg viewBox="0 0 180 100" width="180" height="100" aria-hidden="true">
    <path d="M 96 10 A 46 46 0 0 1 142 56 L 96 56 Z" fill="#11956D"/>
    <polygon points="96,56 96,94 46,94" fill="#0C4DB7"/>
    <circle cx="64" cy="40" r="16" fill="#111514"/>
    <g fill="#111514">
      <circle cx="110" cy="66" r="2.2"/><circle cx="122" cy="66" r="2.2"/><circle cx="134" cy="66" r="2.2"/><circle cx="146" cy="66" r="2.2"/>
      <circle cx="110" cy="78" r="2.2"/><circle cx="122" cy="78" r="2.2"/><circle cx="134" cy="78" r="2.2"/><circle cx="146" cy="78" r="2.2"/>
      <circle cx="110" cy="90" r="2.2"/><circle cx="122" cy="90" r="2.2"/><circle cx="134" cy="90" r="2.2"/><circle cx="146" cy="90" r="2.2"/>
    </g>
  </svg>`;
}

// 迷你线框 SVG（严格与真实排布结构一致：1列 / 1+2首卡置顶 / 2×2 / 3列 / 4列）
function wireframeMiniSvg(cols, accent, status, leadSpansFull) {
  const stroke = status === "error" ? "#B4281E" : status === "warn" ? "#915206" : accent === "green" ? "#11956D" : "#0C4DB7";
  const fill = status === "error" ? "#F7C5BF" : status === "warn" ? "#F7DFB3" : accent === "green" ? "#9CCCB7" : "#9DB2D6";
  const rects = [];
  if (cols === 4) {
    rects.push(`<rect x="4" y="13" width="8.2" height="14" fill="none" stroke="${stroke}" stroke-width="1.3"/>`);
    rects.push(`<rect x="14.6" y="13" width="8.2" height="14" fill="none" stroke="${stroke}" stroke-width="1.3"/>`);
    rects.push(`<rect x="25.2" y="13" width="8.2" height="14" fill="none" stroke="${stroke}" stroke-width="1.3"/>`);
    rects.push(`<rect x="35.8" y="13" width="8.2" height="14" fill="none" stroke="${stroke}" stroke-width="1.3"/>`);
  } else if (cols === 3) {
    rects.push(`<rect x="4" y="13" width="11" height="14" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="18.5" y="13" width="11" height="14" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="33" y="13" width="11" height="14" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
  } else if (cols === 2 && leadSpansFull) {
    rects.push(`<rect x="4" y="12.5" width="40" height="6" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="4" y="20.5" width="18.5" height="7" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="25.5" y="20.5" width="18.5" height="7" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
  } else if (cols === 2) {
    rects.push(`<rect x="4" y="13" width="18.5" height="6.2" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="25.5" y="13" width="18.5" height="6.2" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="4" y="21" width="18.5" height="6.2" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="25.5" y="21" width="18.5" height="6.2" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
  } else {
    rects.push(`<rect x="4" y="13" width="40" height="6" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
    rects.push(`<rect x="4" y="21" width="40" height="6" fill="none" stroke="${stroke}" stroke-width="1.4"/>`);
  }
  return `<svg viewBox="0 0 48 36" width="48" height="36">
    <rect x="1" y="1" width="46" height="34" fill="#FFFFFF" stroke="${stroke}" stroke-width="1.5"/>
    <rect x="4" y="4" width="40" height="6" fill="${fill}"/>
    ${rects.join("")}
    <rect x="4" y="30" width="40" height="3" fill="${fill}"/>
  </svg>`;
}

// 渲染三台活体设备内部 DOM（同区间三端严格套用同一套 CSS 结构）
const elMqPill = document.getElementById("mq-pill");
const elBp1Val = document.getElementById("bp1-val");
const elBp2Val = document.getElementById("bp2-val");
const elEmblem = document.getElementById("hero-emblem");
const elLoom = document.getElementById("loom");
const elTrio = document.getElementById("device-trio");
const elDiag = document.getElementById("loom-diag");
const elDiagPill = document.getElementById("diag-pill");
const elDiagTitle = document.getElementById("diag-title");
const elDiagText = document.getElementById("diag-text");
const btnCalibrate = document.getElementById("btn-calibrate");

function renderDeviceScreen(devRes, preset) {
  const { showInlineLinks, showCtaDot, showBurger } = devRes.nav;
  const menuOpen = showBurger && !!state.openMenus[devRes.id];

  const cardsHtml = preset.cards
    .map((c, idx) => {
      const leadSpan = devRes.leadSpansFull && idx === 0;
      const cramped = devRes.cardsCramped && !leadSpan;
      const tooWide = (devRes.multiTooWide || devRes.singleTooWide) && !cramped;
      const cls = [
        "sim-card",
        leadSpan ? "is-lead-span" : "",
        cramped ? "is-cramped" : "",
        tooWide ? "is-too-wide" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<div class="${cls}">
        <div class="sim-card-head"><i class="sc-ico sc-${c.shape}" aria-hidden="true"></i><span>${c.title}</span></div>
        <p class="sim-card-desc">${c.desc}</p>
      </div>`;
    })
    .join("");

  const titleHtml =
    devRes.heroDir === "stack"
      ? preset.headlineInline
      : `${preset.headline[0]}<br>${preset.headline[1]}`;

  return `<div class="sim-page">
    <div class="sim-nav${devRes.navCramped ? " is-cramped" : ""}" data-nav-mode="${devRes.navMode}">
      <span class="sim-brand" lang="en">${preset.brand}</span>
      ${showInlineLinks ? `<div class="sim-links">${preset.nav.map((n) => `<span>${n}</span>`).join("")}</div>` : ""}
      ${showCtaDot ? `<span class="sim-nav-cta" aria-hidden="true"></span>` : ""}
      ${showBurger ? `<button type="button" class="sim-burger" data-burger="${devRes.id}" aria-expanded="${menuOpen}" aria-label="展开${devRes.name}菜单"><svg viewBox="0 0 16 12" width="14" height="11" aria-hidden="true"><rect y="0" width="16" height="2" fill="currentColor"/><rect y="5" width="16" height="2" fill="currentColor"/><rect y="10" width="16" height="2" fill="currentColor"/></svg></button>` : ""}
    </div>
    ${showBurger ? `<div class="sim-drawer" ${menuOpen ? "" : "hidden"}>${preset.nav.map((n) => `<span>${n}</span>`).join("")}</div>` : ""}
    <div class="sim-hero" data-dir="${devRes.heroDir}">
      <div class="sim-copy">
        <p class="sim-h">${titleHtml}</p>
        <p class="sim-lead">${preset.lead}</p>
        <span class="sim-cta">${preset.cta} →</span>
      </div>
      <div class="sim-art">${bauhausMiniSvg()}</div>
    </div>
    <div class="sim-cards" style="--cols:${devRes.cols}">${cardsHtml}</div>
  </div>`;
}

// 用结构签名避免拖动期间重复重建相同列的 DOM，让 6× CPU 节流下同样 60fps
const lastScreenKey = {};
const setText = (el, txt) => {
  if (el && el.textContent !== txt) el.textContent = txt;
};

function syncHeroUI(skipRuler = false) {
  state.evalRes = evaluateAll(state.bp1, state.bp2, state.preset);
  const res = state.evalRes;

  setText(elMqPill, `@media (min-width: ${state.bp1}px) / (min-width: ${state.bp2}px)`);
  setText(elBp1Val, `${state.bp1}px`);
  setText(elBp2Val, `${state.bp2}px`);
  if (elEmblem.dataset.state !== res.tone) elEmblem.dataset.state = res.tone;
  elLoom.classList.toggle("is-wireframe", state.wireframe);
  if (btnCalibrate.hidden !== !state.hasInteracted) btnCalibrate.hidden = !state.hasInteracted;

  for (const d of res.devices) {
    if (!d.nav.showBurger && state.openMenus[d.id]) state.openMenus[d.id] = false;

    const unit = elTrio.querySelector(`[data-device="${d.id}"]`);
    if (unit.dataset.status !== d.status) unit.dataset.status = d.status;
    setText(unit.querySelector(`[data-badge="${d.id}"]`), d.badge);
    setText(unit.querySelector(`[data-stat="${d.id}"]`), d.statText);

    const sKey = `${state.preset}|${d.tier}|${d.cols}|${d.navMode}|${d.status}|${d.leadSpansFull}|${d.cardsCramped}|${d.navCramped}|${d.multiTooWide}|${d.singleTooWide}|${state.openMenus[d.id]}`;
    if (lastScreenKey[d.id] !== sKey) {
      lastScreenKey[d.id] = sKey;
      unit.querySelector(`[data-screen="${d.id}"]`).innerHTML = renderDeviceScreen(d, res.preset);
      unit.querySelector(`[data-wire="${d.id}"]`).innerHTML = wireframeMiniSvg(d.cols, d.accent, d.status, d.leadSpansFull);
    }

    const dot = document.querySelector(`[data-dot="${d.id}"]`);
    const sub = document.querySelector(`[data-sub="${d.id}"]`);
    if (dot && dot.dataset.st !== d.status) dot.dataset.st = d.status;
    setText(sub, d.badge);
  }

  if (elDiag.dataset.tone !== res.tone) elDiag.dataset.tone = res.tone;
  setText(elDiagPill, res.tone === "ok" ? "测试过关" : res.tone === "warn" ? "行宽待调" : "单卡挤碎");
  setText(elDiagTitle, res.headline);
  setText(elDiagText, res.explanation);

  if (!skipRuler && rulerCtl) rulerCtl.redraw();
}

function markInteracted() {
  if (!state.hasInteracted) state.hasInteracted = true;
}

const rulerCanvas = document.getElementById("bp-ruler");
const rulerCtl = createRulerCanvas(
  rulerCanvas,
  () => state,
  (bp1, bp2) => {
    markInteracted();
    state.bp1 = bp1;
    state.bp2 = bp2;
    syncHeroUI(true);
  }
);

// 标尺键盘操作（左右微调 BP1，Shift+左右微调 BP2）
rulerCanvas.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  markInteracted();
  const delta = e.key === "ArrowRight" ? 20 : -20;
  const next = e.shiftKey
    ? clampBreakpoints(state.bp1, state.bp2 + delta)
    : clampBreakpoints(state.bp1 + delta, state.bp2);
  state.bp1 = next.bp1;
  state.bp2 = next.bp2;
  syncHeroUI();
});

// 步进按钮微调
document.querySelectorAll(".st-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    markInteracted();
    const kind = btn.dataset.step;
    const delta = Number(btn.dataset.delta);
    const next =
      kind === "bp1"
        ? clampBreakpoints(state.bp1 + delta, state.bp2)
        : clampBreakpoints(state.bp1, state.bp2 + delta);
    state.bp1 = next.bp1;
    state.bp2 = next.bp2;
    syncHeroUI();
  });
});

// 内容压力切换
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.preset = btn.dataset.preset;
    document.querySelectorAll("[data-preset]").forEach((b) => b.classList.toggle("is-active", b === btn));
    syncHeroUI();
  });
});

// 线框透视开关
const btnWireframe = document.getElementById("btn-wireframe");
btnWireframe.addEventListener("click", () => {
  state.wireframe = !state.wireframe;
  btnWireframe.setAttribute("aria-pressed", String(state.wireframe));
  syncHeroUI();
});

// 参考校准（仅在用户亲手拖/步进过断点之后显现，作为对照用）
btnCalibrate.addEventListener("click", () => {
  const p = CONTENT_PRESETS[state.preset] || CONTENT_PRESETS.poster;
  state.bp1 = p.recommendedBp1;
  state.bp2 = p.recommendedBp2;
  syncHeroUI();
});

// 复原初始事故态
document.getElementById("btn-reset").addEventListener("click", () => {
  state.bp1 = INITIAL_STATE.bp1;
  state.bp2 = INITIAL_STATE.bp2;
  state.preset = INITIAL_STATE.preset;
  state.wireframe = false;
  state.hasInteracted = false;
  state.openMenus = { desktop: false, tablet: false, mobile: false };
  btnWireframe.setAttribute("aria-pressed", "false");
  document.querySelectorAll("[data-preset]").forEach((b) => b.classList.toggle("is-active", b.dataset.preset === state.preset));
  syncHeroUI();
});

// 设备内部真汉堡菜单点开/收起（事件委托）
elTrio.addEventListener("click", (e) => {
  const burger = e.target.closest("[data-burger]");
  if (!burger) return;
  const id = burger.dataset.burger;
  state.openMenus[id] = !state.openMenus[id];
  syncHeroUI(true);
});

// 手机竖屏顶部三端切签
document.querySelectorAll(".mtab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeDevice = tab.dataset.dev;
    elTrio.dataset.activeDev = state.activeDevice;
    document.querySelectorAll(".mtab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  });
});

syncHeroUI();

// ==================== 01 节：三支柱拆柱实验 ====================
const faultStage = document.getElementById("fault-stage");
const fvWLabel = document.getElementById("fv-w-label");
const fvTag = document.getElementById("fv-tag");
const faultExplain = document.getElementById("fault-explain");

function renderFault(key) {
  const cfg = PILLAR_FAULTS[key] || PILLAR_FAULTS.all;
  faultStage.dataset.fault = key;
  fvWLabel.textContent = key === "noFluid" ? "模拟视口 820px（卡在两档之间）" : "模拟视口 375px";
  fvTag.textContent = cfg.tag;
  faultExplain.textContent = cfg.summary;
}
document.querySelectorAll(".f-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".f-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderFault(btn.dataset.fault);
  });
});
renderFault("all");

// ==================== 02 节：历史演进轨 ====================
const elTlTag = document.getElementById("tl-tag");
const elTlWho = document.getElementById("tl-who");
const elTlWork = document.getElementById("tl-work");
const elTlNote = document.getElementById("tl-note");
const elTlVp = document.getElementById("tl-vp-desc");
const elTlScr = document.getElementById("tl-phone-scr");

function renderHistory(idx) {
  const step = HISTORY_STEPS[idx] || HISTORY_STEPS[0];
  elTlTag.textContent = step.tag;
  elTlWho.textContent = `${step.year} · ${step.who}`;
  elTlWork.textContent = step.work;
  elTlNote.textContent = step.note;
  elTlVp.textContent = step.viewportDesc;

  const modes = {
    fixed980: `<span class="tp-tag tp-bad">800px 死宽表格</span>
      <div class="tp-bars"><div class="tp-row"><span class="tp-blk danger"></span><span class="tp-blk danger"></span></div></div>
      <p class="tp-note">右半截内容被挡在屏外，必须来回拖底部横向滚动条。</p>`,
    mediaDraft: `<span class="tp-tag tp-mid">W3C 候选草案</span>
      <div class="tp-bars"><div class="tp-row"><span class="tp-blk blue"></span><span class="tp-blk"></span></div></div>
      <p class="tp-note">规范已提出 min-width 查询语法，静待移动浏览器浪潮接棒。</p>`,
    shrink980: `<span class="tp-tag tp-bad">980px 整页硬缩</span>
      <div class="tp-bars"><div class="tp-row"><span class="tp-blk danger" style="height:12px"></span><span class="tp-blk danger" style="height:12px"></span><span class="tp-blk danger" style="height:12px"></span></div></div>
      <p class="tp-note">整张桌面页缩成 38% 挤进 375px，每次阅读都要双指放大。</p>`,
    rwd2010: `<span class="tp-tag tp-ok">RWD 单列重排</span>
      <div class="tp-bars"><span class="tp-blk"></span><span class="tp-blk blue"></span><span class="tp-blk"></span></div>
      <p class="tp-note">一份 HTML 顺应视口：窄屏垂直聚焦，宽屏自动展开多列。</p>`,
    wcag320: `<span class="tp-tag tp-ok">320px / 400% 重排</span>
      <div class="tp-bars"><span class="tp-blk"></span><span class="tp-blk"></span><span class="tp-blk blue"></span></div>
      <p class="tp-note">桌面端放大 400% 仍保持单列流畅，惠及低视力与小屏用户。</p>`,
  };
  elTlScr.innerHTML = modes[step.phoneMode] || modes.rwd2010;
}

document.querySelectorAll(".tl-node").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tl-node").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderHistory(Number(btn.dataset.step));
  });
});
renderHistory(0);

// ==================== 03 节：内容驱动 vs 机型断点 PK ====================
let pkSubject = "news";
let pkWidth = 710;
const pkRange = document.getElementById("pk-width-range");
const pkWidthOut = document.getElementById("pk-width-out");
const pkDevCol = document.getElementById("pk-device-col");
const pkCntCol = document.getElementById("pk-content-col");
const pkDevPill = document.getElementById("pk-dev-pill");
const pkCntPill = document.getElementById("pk-cnt-pill");
const pkDevGrid = document.getElementById("pk-dev-grid");
const pkCntGrid = document.getElementById("pk-cnt-grid");
const pkDevNote = document.getElementById("pk-dev-note");
const pkCntNote = document.getElementById("pk-cnt-note");

function renderPkCards(cols, cardW, subj) {
  return Array.from({ length: 3 }, (_, i) => `<div class="pk-card">
    <span class="pk-card-w" lang="en">CARD #${i + 1} · ${cardW}px</span>
    <h4>${subj.sampleTitle}</h4>
    <p>${subj.sampleMeta}</p>
  </div>`).join("");
}

function renderPk() {
  const res = compareBreakpointStrategies(pkWidth, pkSubject);
  pkWidthOut.textContent = `${pkWidth}px`;

  pkDevCol.dataset.status = res.device.status;
  pkDevPill.textContent = `${res.device.cols} 列 · 单卡 ${res.device.cardW}px`;
  pkDevGrid.style.setProperty("--pk-cols", String(res.device.cols));
  pkDevGrid.innerHTML = renderPkCards(res.device.cols, res.device.cardW, res.subject);
  pkDevNote.textContent = res.device.note;

  pkCntCol.dataset.status = res.content.status;
  pkCntPill.textContent = `${res.content.cols} 列 · 单卡 ${res.content.cardW}px`;
  pkCntGrid.style.setProperty("--pk-cols", String(res.content.cols));
  pkCntGrid.innerHTML = renderPkCards(res.content.cols, res.content.cardW, res.subject);
  pkCntNote.textContent = res.content.note;
}

document.querySelectorAll(".pk-sub-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    pkSubject = btn.dataset.subj;
    document.querySelectorAll(".pk-sub-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderPk();
  });
});
pkRange.addEventListener("input", () => {
  pkWidth = Number(pkRange.value);
  renderPk();
});
renderPk();

// ==================== 04 节：三种经典重排模式 + Tab 序校验 ====================
let patId = "mostlyFluid";
let patSz = "wide";
let tabTimer = 0;
const patCanvas = document.getElementById("pat-canvas");
const patTitle = document.getElementById("pat-title");
const patDesc = document.getElementById("pat-desc");
const traceSeq = document.getElementById("trace-seq");

function renderPattern(focusIndex = -1) {
  const pat = REORDER_PATTERNS[patId];
  const blocks = pat.layouts[patSz];
  patCanvas.dataset.sz = patSz;
  patTitle.textContent = `${pat.zh}（${pat.name}）`;
  patDesc.textContent = pat.desc;

  const domOrder = ["A", "B", "C", "D"];
  const focusedId = focusIndex >= 0 ? domOrder[focusIndex] : "";

  patCanvas.innerHTML = blocks
    .map((b) => `<div class="pat-blk${b.id === focusedId ? " is-focused" : ""}" data-tone="${b.tone}" style="grid-column:${b.grid};grid-row:${b.row}">
      <div class="pat-blk-top">
        <span class="pat-id" lang="en">${b.id}</span>
        <span class="pat-tag">${b.tag}</span>
      </div>
      <span class="pat-blk-name">${b.title}</span>
    </div>`)
    .join("");

  if (focusIndex < 0) {
    const visualOrder = blocks.map((b) => b.id).join(" → ");
    const mismatch = visualOrder !== "A → B → C → D";
    traceSeq.textContent = mismatch
      ? `HTML 源码 A → B → C → D，但此刻视觉呈现为 ${visualOrder}（乱用 CSS order 会造成焦点反跳！）`
      : `HTML 源码 A → B → C → D，与当前视觉流向完全一致。`;
  } else {
    traceSeq.textContent = `Tab 第 ${focusIndex + 1} 步落在区块 ${focusedId}（源码顺序永远按 A → B → C → D 走）`;
  }
}

document.querySelectorAll(".pat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearInterval(tabTimer);
    patId = btn.dataset.pat;
    document.querySelectorAll(".pat-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderPattern();
  });
});
document.querySelectorAll(".sz-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearInterval(tabTimer);
    patSz = btn.dataset.sz;
    document.querySelectorAll(".sz-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderPattern();
  });
});
document.getElementById("btn-tab-sim").addEventListener("click", () => {
  clearInterval(tabTimer);
  let step = 0;
  renderPattern(0);
  tabTimer = setInterval(() => {
    step += 1;
    if (step >= 4) {
      clearInterval(tabTimer);
      renderPattern(-1);
    } else {
      renderPattern(step);
    }
  }, 650);
});
renderPattern();

// ==================== 05 节：弹性媒体与视口声明 ====================
const mediaState = { mode: "scale", hasViewport: true };
const mediaCaption = document.getElementById("media-caption");
const mediaCanvas = document.getElementById("media-canvas");
const mediaCtl = createMediaCanvas(mediaCanvas, () => mediaState);

function syncMediaUI() {
  if (!mediaState.hasViewport) {
    mediaCaption.textContent = "当前：漏写 viewport meta！手机按 980px 渲染后再整页缩成 38%，小屏断点全部失效，读者必须双指捏合放大。";
  } else if (mediaState.mode === "scale") {
    mediaCaption.textContent = "当前：已声明 viewport，但 16:9 横图直接等比缩小，手机上核心几何主体面积示意约 19%，视觉分量变轻。";
  } else {
    mediaCaption.textContent = "当前：使用 <picture> 艺术指导按断点切换紧凑裁切，手机屏核心主体面积示意升至约 46%，构图冲击力不打折。";
  }
  mediaCtl.redraw();
}

document.querySelectorAll(".mc-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    mediaState.mode = btn.dataset.mmode;
    document.querySelectorAll(".mc-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    syncMediaUI();
  });
});
document.getElementById("chk-viewport").addEventListener("change", (e) => {
  mediaState.hasViewport = e.target.checked;
  syncMediaUI();
});
syncMediaUI();

// ==================== 06 节：什么时候别硬套响应式（几何块面示意，不再依赖等宽空格对齐） ====================
const elAntiBadT = document.getElementById("anti-bad-title");
const elAntiBadD = document.getElementById("anti-bad-desc");
const elAntiBadV = document.getElementById("anti-bad-viz");
const elAntiGoodT = document.getElementById("anti-good-title");
const elAntiGoodD = document.getElementById("anti-good-desc");
const elAntiGoodV = document.getElementById("anti-good-viz");

const ANTI_VIZ = {
  datatable: {
    bad: `<div class="ad-stack">
      <div class="ad-row ad-bad"><b>品名 A</b><span>Q1: 120 · Q2: 145 · Q3: 180</span></div>
      <div class="ad-row ad-bad"><b>品名 B</b><span>Q1: 98 · Q2: 110 · Q3: 132</span></div>
      <div class="ad-cap">竖排卡片后，眼睛无法沿同一列纵向比价</div>
    </div>`,
    good: `<div class="ad-table">
      <span class="ad-th ad-pin">品名</span><span class="ad-th">Q1</span><span class="ad-th">Q2</span><span class="ad-th">Q3 →</span>
      <span class="ad-td ad-pin">A</span><span class="ad-td">120</span><span class="ad-td">145</span><span class="ad-td">180</span>
      <span class="ad-td ad-pin">B</span><span class="ad-td">98</span><span class="ad-td">110</span><span class="ad-td">132</span>
    </div>`,
  },
  canvas: {
    bad: `<div class="ad-stack">
      <div class="ad-bar ad-bad">工具栏挤占 45% 屏高</div>
      <div class="ad-bar ad-bad">属性面板占 40% 屏高</div>
      <div class="ad-bar ad-thin">画布只剩 15% 缝隙</div>
    </div>`,
    good: `<div class="ad-stack">
      <div class="ad-bar ad-tall ad-ok">全屏二维工作画布（占主视域）</div>
      <div class="ad-bar ad-sub">底部折叠工具抽屉 · 按需拉起</div>
    </div>`,
  },
  forked: {
    bad: `<div class="ad-stack">
      <div class="ad-row ad-bad"><b>同一页塞入 40 项后台录入</b></div>
      <div class="ad-row ad-bad"><b>手机端写 20 条 display: none 硬藏</b></div>
    </div>`,
    good: `<div class="ad-split">
      <div class="ad-box ad-ok"><b>桌面端</b><span>批量录入工作台</span></div>
      <div class="ad-box ad-ok"><b>移动端</b><span>精简扫码核销流</span></div>
    </div>`,
  },
  embed: {
    bad: `<div class="ad-stack">
      <div class="ad-row ad-bad"><b>@media (min-width: 1200px)</b><span>命中！</span></div>
      <div class="ad-cap">260px 窄侧栏里的挂件却硬套横排大字直接爆框</div>
    </div>`,
    good: `<div class="ad-stack">
      <div class="ad-row ad-ok"><b>@container (min-width: 340px)</b><span>按父盒宽</span></div>
      <div class="ad-cap">只看父容器宽度：放进 260px 侧栏自动切竖版</div>
    </div>`,
  },
};

function renderAnti(idx) {
  const item = ANTI_CASES[idx] || ANTI_CASES[0];
  const viz = ANTI_VIZ[item.id];
  elAntiBadT.textContent = item.badTitle;
  elAntiBadD.textContent = item.badDesc;
  elAntiBadV.innerHTML = viz.bad;
  elAntiGoodT.textContent = item.goodTitle;
  elAntiGoodD.textContent = item.goodDesc;
  elAntiGoodV.innerHTML = viz.good;
}

document.querySelectorAll(".anti-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".anti-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderAnti(Number(tab.dataset.anti));
  });
});
renderAnti(0);

// ==================== 07 节：小练习 ====================
const quizGrid = document.getElementById("quiz-grid");
const quizFeedback = document.getElementById("quiz-feedback");
const qfBadge = document.getElementById("qf-badge");
const qfTitle = document.getElementById("qf-title");
const qfBody = document.getElementById("qf-body");
const qfTable = document.getElementById("qf-table");

const SAMPLE_WIDTHS = [600, 768, 900, 1280];

function buildQuiz() {
  quizGrid.innerHTML = QUIZ_CONFIG.options
    .map((opt) => {
      const rows = [600, 768, 900]
        .map((w) => {
          const p = quizPreviewAt(opt, w);
          const cells = Array.from({ length: p.cols }, () => `<span class="q-cell"></span>`).join("");
          return `<div class="q-row"><span class="q-row-w" lang="en">${w}</span><div class="q-cols" style="grid-template-columns:repeat(${p.cols},1fr)">${cells}</div></div>`;
        })
        .join("");
      return `<button type="button" class="q-opt" data-opt="${opt.id}">
        <div class="q-opt-head">
          <span class="q-letter" lang="en">${opt.id}</span>
          <span class="q-spec">${opt.label}</span>
        </div>
        <span class="q-spec">${opt.spec}</span>
        <div class="q-mini-bars" aria-hidden="true">${rows}</div>
      </button>`;
    })
    .join("");

  quizGrid.querySelectorAll(".q-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = QUIZ_CONFIG.options.find((o) => o.id === btn.dataset.opt);
      quizGrid.querySelectorAll(".q-opt").forEach((b) => {
        b.classList.remove("is-picked-ok", "is-picked-bad");
      });
      btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-bad");

      quizFeedback.hidden = false;
      quizFeedback.dataset.ok = String(opt.correct);
      qfBadge.textContent = opt.correct ? "判断正确" : "再算一步";
      qfTitle.textContent = `${opt.label}（${opt.spec}）—— ${opt.verdict}`;
      qfBody.textContent = opt.calc + (opt.correct ? "" : " 正确答案是方案 B（600px / 900px），刚好在单卡 ≥ 260px 时换挡。");
      qfTable.innerHTML = SAMPLE_WIDTHS.map((w) => {
        const p = quizPreviewAt(opt, w);
        return `<div class="qf-cell"><b>${w}px 视口</b><span>${p.cols} 列 · 单卡 ${p.cardW}px</span></div>`;
      }).join("");
    });
  });
}
buildQuiz();

// ==================== 08 节：原海报灯箱（可放大、可拖、Esc 关） ====================
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbScaleEl = document.getElementById("lb-scale");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDragging = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-trigger").focus();
}

document.getElementById("poster-trigger").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.25).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = Math.max(0.75, +(lbScale - 0.25).toFixed(2));
  applyLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.15 : -0.15;
  lbScale = Math.max(0.75, Math.min(3, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbDragging = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDragging) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDragging = false; });
lbStage.addEventListener("pointercancel", () => { lbDragging = false; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
