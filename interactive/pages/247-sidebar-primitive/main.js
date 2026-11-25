// 247 侧栏原语 · 主控逻辑
import {
  SCENES,
  PRESETS,
  QUIZ_OPTIONS,
  QUIZ_WIDE,
  QUIZ_NARROW,
  createInitialState,
  evaluate,
} from "./model.js";
import { mountChamber } from "./stage-canvas.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// =====================================================================
// 1. 开场主角：活体量子侧栏实验舱 + 双向绑定
// =====================================================================
const state = createInitialState();

const elCanvas = $("#hero-canvas");
const elScoreBadge = $("#hero-score-badge");
const elMobileScore = $("#mobile-score-pill");
const elSpineLive = $("#spine-live-readout");
const elMW = $("#m-w");
const elMWrap = $("#m-wrap");
const elMMode = $("#m-mode");

const elDiagCard = $("#diag-card");
const elDiagBadge = $("#diag-badge");
const elDiagTitle = $("#diag-title");
const elDiagWhy = $("#diag-why");
const elDiagNext = $("#diag-next");
const elLiveCss = $("#live-css");

const slBasis = $("#sl-basis");
const slMin = $("#sl-min");
const slGap = $("#sl-gap");
const slW = $("#sl-w");
const valBasis = $("#val-basis");
const valMin = $("#val-min");
const valGap = $("#val-gap");
const valW = $("#val-w");

const ctrlNavRow = $("#ctrl-nav-row");

const actions = {
  setContainerW(w) {
    state.containerW = w;
    syncHeroUI();
  },
  setBasis(b) {
    state.basis = b;
    syncHeroUI();
  },
  setNav(id) {
    state.activeNav = id;
    syncHeroUI();
  },
  markWrapped() {
    state.everWrapped = true;
  },
  applyQuickFix(action) {
    const sc = SCENES[state.scene] || SCENES.docs;
    if (action === "fixWrap") {
      state.wrap = true;
      if (state.minMainPct < 50) state.minMainPct = sc.defaultMinMain;
    } else if (action === "fixSideGrow") {
      state.sideGrow = 1;
    } else if (action === "fixMainGrow") {
      state.mainGrow = 999;
    } else if (action === "fixPermStack") {
      state.minMainPct = sc.defaultMinMain;
      if (state.basis > sc.basisRange[1]) state.basis = sc.defaultBasis;
    }
    syncHeroUI();
  },
};

const chamber = mountChamber(elCanvas, () => state, actions);

function syncHeroUI() {
  const ev = evaluate(state);
  const { live, primaryIssue, notes } = ev;

  // 顶部与左脊实时读数
  elScoreBadge.textContent = primaryIssue.badge;
  elScoreBadge.classList.toggle("is-ok", ev.score === 4);
  elScoreBadge.classList.toggle("is-err", ev.score < 4);

  elMobileScore.textContent = primaryIssue.badge;
  elMobileScore.classList.toggle("is-ok", ev.score === 4);

  const wrapStr = Number.isFinite(live.wrapThreshold) ? `${live.wrapThreshold}px` : "无换行";
  elMW.textContent = `${live.W}px`;
  elMWrap.textContent = wrapStr;
  elMMode.textContent = live.wrapped ? "上下堆叠" : "左右并排";
  elSpineLive.textContent = `W ${live.W}px · 临界 ${wrapStr}`;

  // 左脊三枚锚点状态
  const setPillar = (rowId, stId, item) => {
    const row = $(rowId);
    const st = $(stId);
    if (row) row.classList.toggle("is-ok", item.ok);
    if (st) st.textContent = item.status;
  };
  setPillar("#pillar-anchor", "#st-anchor", notes.anchor);
  setPillar("#pillar-index", "#st-index", notes.index);
  setPillar("#pillar-hierarchy", "#st-hierarchy", notes.hierarchy);

  // 原海报 01/02/03 设计要点表状态
  const setNote = (rowId, stId, item) => {
    const r = $(rowId);
    const s = $(stId);
    if (r) r.classList.toggle("is-ok", item.ok);
    if (s) s.textContent = item.status;
  };
  setNote("#note-row-1", "#note-st-1", notes.anchor);
  setNote("#note-row-2", "#note-st-2", notes.index);
  setNote("#note-row-3", "#note-st-3", notes.hierarchy);

  // 单真源白话诊单
  elDiagCard.classList.toggle("is-ok", ev.score === 4);
  elDiagCard.classList.toggle("is-err", ev.score < 4);
  elDiagBadge.textContent = primaryIssue.badge;
  elDiagTitle.textContent = primaryIssue.title;
  elDiagWhy.textContent = primaryIssue.why;
  elDiagNext.textContent = primaryIssue.nextStep;

  // 实时 CSS 源码
  elLiveCss.textContent = ev.cssCode;

  // 控件状态同步
  $$(".scene-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
  $$(".mini-toggle").forEach((b) => b.classList.toggle("is-active", b.dataset.sidepos === state.sidePos));

  $$(".seg-btn").forEach((b) => {
    const k = b.dataset.ctrl;
    const v = b.dataset.val;
    const cur = String(state[k]);
    b.classList.toggle("is-active", cur === v);
  });

  if (ctrlNavRow) ctrlNavRow.hidden = state.scene !== "docs";

  slBasis.value = String(state.basis);
  valBasis.textContent = `${state.basis}px`;
  slMin.value = String(state.minMainPct);
  valMin.textContent = `${state.minMainPct}%`;
  slGap.value = String(state.gap);
  valGap.textContent = `${state.gap}px`;
  slW.value = String(state.containerW);
  valW.textContent = `${state.containerW}px`;

  chamber.draw();
}

// 绑定题材、左右置、预设、分段按钮与滑块
$$(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.scene;
    if (!SCENES[next] || next === state.scene) return;
    state.scene = next;
    state.activeNav = 0;
    // 若当前已达标则平滑切到该题材的合理基准宽，保留错态用户探索体验
    const sc = SCENES[next];
    if (evaluate(state).score === 4) {
      state.basis = sc.defaultBasis;
      state.minMainPct = sc.defaultMinMain;
      state.gap = sc.defaultGap;
    }
    syncHeroUI();
  });
});

$$(".mini-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.sidePos = btn.dataset.sidepos;
    syncHeroUI();
  });
});

$$(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, p.patch(state));
    state.activeNav = 0;
    syncHeroUI();
  });
});

$$(".seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.ctrl;
    const v = btn.dataset.val;
    if (k === "wrap") state.wrap = v === "true";
    else if (k === "sideGrow" || k === "mainGrow") state[k] = Number(v);
    else state[k] = v;
    syncHeroUI();
  });
});

slBasis.addEventListener("input", () => {
  state.basis = Number(slBasis.value);
  syncHeroUI();
});
slMin.addEventListener("input", () => {
  state.minMainPct = Number(slMin.value);
  syncHeroUI();
});
slGap.addEventListener("input", () => {
  state.gap = Number(slGap.value);
  syncHeroUI();
});
slW.addEventListener("input", () => {
  state.containerW = Number(slW.value);
  syncHeroUI();
});

syncHeroUI();

// =====================================================================
// 2. 第 01 节：原生浏览器 CSS Flexbox 活体沙盒（实读 getBoundingClientRect）
// =====================================================================
const s1State = { wrap: true, sideGrow: true, mainGrow: true, minSize: true, w: 680 };
const s1Box = $("#s1-real-box");
const s1Side = $("#s1-real-side");
const s1Main = $("#s1-real-main");
const s1SidePx = $("#s1-side-px");
const s1MainPx = $("#s1-main-px");
const s1TargetVal = $("#s1-target-val");
const s1WidthInput = $("#s1-width");
const s1Verdict = $("#s1-verdict");

function measureS1() {
  if (!s1Box) return;
  const br = s1Box.getBoundingClientRect();
  const sr = s1Side.getBoundingClientRect();
  const mr = s1Main.getBoundingClientRect();
  const wrapped = Math.abs(sr.top - mr.top) > 10;
  const sw = Math.round(sr.width);
  const mw = Math.round(mr.width);
  const bw = Math.round(br.width);

  s1SidePx.textContent = `实测 ${sw}px (${Math.round((sw / Math.max(1, bw - 24)) * 100)}%)`;
  s1MainPx.textContent = `实测 ${mw}px (${Math.round((mw / Math.max(1, bw - 24)) * 100)}%)`;

  const off = [];
  if (!s1State.wrap) off.push("flex-wrap: wrap");
  if (!s1State.sideGrow) off.push("side flex-grow: 1");
  if (!s1State.mainGrow) off.push("main flex-grow: 999");
  if (!s1State.minSize) off.push("min-inline-size: 55%");

  s1Verdict.classList.toggle("is-err", off.length > 0);
  if (off.length === 0) {
    s1Verdict.textContent = wrapped
      ? `四行全开 · 实测容器 ${bw}px 已触发折行：侧栏 ${sw}px 与主区 ${mw}px 双双满宽对齐。`
      : `四行全开 · 实测容器 ${bw}px 处于并排态：侧栏稳守 ${sw}px，主区独享 ${mw}px。`;
  } else if (!s1State.wrap) {
    s1Verdict.textContent = `关掉了 flex-wrap（现仅剩 ${mw}px 主区）：把滑尺往左拉到 340px，浏览器会硬把两栏挤在同一行，绝不换行。`;
  } else if (!s1State.sideGrow && wrapped) {
    s1Verdict.textContent = `关掉了侧栏 flex-grow: 1：现在已折行，侧栏停在 ${sw}px，右侧白白空出一截无法对齐。`;
  } else if (!s1State.mainGrow && !wrapped) {
    s1Verdict.textContent = `关掉了主区 flex-grow: 999（改为 1:1）：宽态剩余空间被对半分走，侧栏暴涨到 ${sw}px，几乎与主区 ${mw}px 一样胖！`;
  } else if (!s1State.minSize) {
    s1Verdict.textContent = `把主区底线降到 15%：拖到 340px 窄容器时主区已缩至 ${mw}px，却依然迟迟不肯折行。`;
  } else {
    s1Verdict.textContent = `已关闭 ${off.join("、")}：试着在「宽态 720px」与「窄态 340px」之间来回切，立刻能看出漏掉这行代码的后果。`;
  }
}

function applyS1() {
  s1Box.style.setProperty("--s1-w", `${s1State.w}px`);
  s1Box.classList.toggle("no-wrap", !s1State.wrap);
  s1Box.classList.toggle("no-side-grow", !s1State.sideGrow);
  s1Box.classList.toggle("no-main-grow", !s1State.mainGrow);
  s1Box.classList.toggle("no-min-size", !s1State.minSize);
  s1TargetVal.textContent = `${s1State.w}px`;
  s1WidthInput.value = String(s1State.w);
  $$(".rule-chip").forEach((c) => c.classList.toggle("is-on", s1State[c.dataset.s1]));
  requestAnimationFrame(measureS1);
}

$$(".rule-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.s1;
    s1State[k] = !s1State[k];
    applyS1();
  });
});

s1WidthInput.addEventListener("input", () => {
  s1State.w = Number(s1WidthInput.value);
  applyS1();
});

$$(".s1-jump").forEach((btn) => {
  btn.addEventListener("click", () => {
    s1State.w = Number(btn.dataset.s1w);
    applyS1();
  });
});

new ResizeObserver(() => measureS1()).observe(s1Box);
applyS1();

// =====================================================================
// 3. 第 02 节：@media vs 侧栏原语容器对决 + 精确临界方程
// =====================================================================
const SLOTS = {
  page: {
    w: 780,
    mediaSt: "视口 1280px › 768px · 强制并排",
    mediaErr: false,
    mediaNote: "放进整页 780px 主列时，容器够宽，媒体查询暂时看不出破绽。",
    primNote: "在宽主列里，侧栏原语同样稳稳并排；如果外层屏幕本身很窄，它也会顺势自动折行。",
  },
  card: {
    w: 420,
    mediaSt: "× 视口仍 1280px · 拒绝换行！",
    mediaErr: true,
    mediaNote: "装进双栏右卡（420px）后，浏览器视口仍是 1280px，@media 完全没察觉，正文被挤成窄缝。",
    primNote: "侧栏原语只看自身容器实宽，跌破临界门槛原地翻折，卡片内阅读依旧舒畅。",
  },
  drawer: {
    w: 310,
    mediaSt: "× 视口仍 1280px · 严重挤压！",
    mediaErr: true,
    mediaNote: "塞进 310px 窄抽屉时，@media 仍以为在宽屏桌面，正文只剩几字宽彻底崩坏。",
    primNote: "同一套 CSS 零改动进入窄抽屉，自动维持上下满宽，真正做到「写一次、到处可用」。",
  },
};

const s2MediaBox = $("#s2-media-box");
const s2PrimBox = $("#s2-prim-box");
const s2MediaStatus = $("#s2-media-status");
const s2PrimStatus = $("#s2-prim-status");
const s2MediaNote = $("#s2-media-note");
const s2PrimNote = $("#s2-prim-note");

function measureS2Prim() {
  if (!s2PrimBox || s2PrimBox.children.length < 2) return;
  const br = s2PrimBox.getBoundingClientRect();
  const r0 = s2PrimBox.children[0].getBoundingClientRect();
  const r1 = s2PrimBox.children[1].getBoundingClientRect();
  const bw = Math.round(br.width);
  const stacked = Math.abs(r0.top - r1.top) > 10;
  s2PrimStatus.textContent = stacked
    ? `✓ 实测容器 ${bw}px · 已自动满宽折行`
    : `✓ 实测容器 ${bw}px · 优雅并排`;
}

function applySlot(key) {
  const cfg = SLOTS[key];
  if (!cfg) return;
  $$(".duel-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.slot === key));
  s2MediaBox.style.setProperty("--slot-w", `${cfg.w}px`);
  s2PrimBox.style.setProperty("--slot-w", `${cfg.w}px`);
  s2MediaBox.classList.toggle("is-crushed", cfg.mediaErr);
  s2MediaStatus.textContent = cfg.mediaSt;
  s2MediaStatus.classList.toggle("is-err", cfg.mediaErr);
  s2MediaNote.textContent = cfg.mediaNote;
  s2PrimNote.textContent = cfg.primNote;
  requestAnimationFrame(measureS2Prim);
}

new ResizeObserver(() => measureS2Prim()).observe(s2PrimBox);
$$(".duel-btn").forEach((b) => b.addEventListener("click", () => applySlot(b.dataset.slot)));
applySlot("page");

// 精确临界线推演器
const fBasis = $("#f-basis");
const fGap = $("#f-gap");
const fPct = $("#f-pct");
const fvB = $("#fv-b");
const fvG = $("#fv-g");
const fvP = $("#fv-p");
const s2Eq = $("#s2-eq");
const s2FBadge = $("#s2-f-badge");
const s2FNote = $("#s2-f-note");
const fmStack = $("#fm-stack");
const fmPin = $("#fm-pin");
const fmPinVal = $("#fm-pin-val");

function updateFormula() {
  const B = Number(fBasis.value);
  const G = Number(fGap.value);
  const P = Number(fPct.value);
  const denom = 1 - P / 100;
  const Wwrap = Math.round((B + G) / denom);

  fvB.textContent = `${B}px`;
  fvG.textContent = `${G}px`;
  fvP.textContent = `${P}%`;
  s2Eq.innerHTML = `W_wrap = (${B} + ${G}) ÷ (1 − ${(P / 100).toFixed(2)}) = <strong>${Wwrap}px</strong>`;

  const pctPos = Math.max(8, Math.min(92, (Wwrap / 1000) * 100));
  fmStack.style.width = `${pctPos}%`;
  fmPin.style.left = `${pctPos}%`;
  fmPinVal.textContent = `${Wwrap}px`;

  if (Wwrap > 760) {
    s2FBadge.textContent = `偏高 (${Wwrap}px) · 桌面也易永久竖叠`;
    s2FBadge.classList.add("is-err");
    s2FNote.textContent = `临界线已经高过常见桌面主列（760px）。在大多数容器里两栏都找不到并排的机会，请缩小基准宽 B 或降低主区底线 P。`;
  } else if (Wwrap < 360) {
    s2FBadge.textContent = `偏低 (${Wwrap}px) · 窄屏易挤压主区`;
    s2FBadge.classList.add("is-err");
    s2FNote.textContent = `容器必须挤到 ${Wwrap}px 以下才肯换行——手机和窄卡片里主区会被压得很窄，建议把主区底线 P 提高到 50%–62%。`;
  } else {
    s2FBadge.textContent = `健康区间 (${Wwrap}px) · 宽并排 / 窄堆叠`;
    s2FBadge.classList.remove("is-err");
    s2FNote.textContent = `经验参考：当前临界宽 ${Wwrap}px 落在 380–700px 舒展带，桌面宽页保持稳健双栏，进入窄卡或手机立即无断点折行。`;
  }
}

[fBasis, fGap, fPct].forEach((el) => el.addEventListener("input", updateFormula));
updateFormula();

// =====================================================================
// 4. 第 03 节：一套规则四种变身（一条滑尺挤压四个真实 CSS 原语微件）
// =====================================================================
const s3Slider = $("#s3-slider");
const s3WVal = $("#s3-w-val");
const s3Configs = [
  { id: "s3-demo-0", stId: "s3-st-0", threshold: 436 },
  { id: "s3-demo-1", stId: "s3-st-1", threshold: 316 },
  { id: "s3-demo-2", stId: "s3-st-2", threshold: 302 },
  { id: "s3-demo-3", stId: "s3-st-3", threshold: 429 },
];

function updateS3(val) {
  s3Slider.value = String(val);
  s3WVal.textContent = `${val}px`;
  for (const cfg of s3Configs) {
    const el = document.getElementById(cfg.id);
    if (el) el.style.setProperty("--s3-w", `${val}px`);
  }
  requestAnimationFrame(measureS3);
}

function measureS3() {
  for (const cfg of s3Configs) {
    const el = document.getElementById(cfg.id);
    const tag = document.getElementById(cfg.stId);
    if (!el || !tag || el.children.length < 2) continue;
    const r0 = el.children[0].getBoundingClientRect();
    const r1 = el.children[1].getBoundingClientRect();
    const stacked = Math.abs(r0.top - r1.top) > 10;
    tag.textContent = `临界 ${cfg.threshold}px · ${stacked ? "已折行堆叠" : "双栏并排"}`;
    tag.classList.toggle("is-stacked", stacked);
  }
}

s3Slider.addEventListener("input", () => updateS3(Number(s3Slider.value)));
$$(".s3-btn").forEach((b) => b.addEventListener("click", () => updateS3(Number(b.dataset.s3w))));
window.addEventListener("resize", () => requestAnimationFrame(measureS3));
updateS3(620);

// =====================================================================
// 5. 第 05 节：什么时候别用（四张诊卡正反切换）
// =====================================================================
$$(".avoid-card").forEach((card) => {
  const btn = $(".avoid-flip", card);
  btn.addEventListener("click", () => {
    const fixed = card.classList.toggle("is-fixed");
    btn.setAttribute("aria-pressed", String(fixed));
    btn.textContent = fixed ? "看回错用现场" : "查看替代方案";
  });
});

// =====================================================================
// 6. 第 06 节：眼力练习（完全由 model.js QUIZ_OPTIONS 实算驱动）
// =====================================================================
const quizGrid = $("#quiz-grid");
const quizFeedback = $("#quiz-feedback");

function wireHTML(sol, totalW) {
  if (sol.wrapped) {
    const sidePct = Math.round((sol.sideW / totalW) * 100);
    return `
      <div class="qw-frame is-stack">
        <div class="qw-stack-row">
          <div class="qw-side" style="width:${sidePct}%">${sol.sideW}px</div>
          ${sol.deadVoid > 8 ? `<div class="qw-void" title="死空 ${sol.deadVoid}px"></div>` : ""}
        </div>
        <div class="qw-main" style="width:100%">${sol.mainW}px</div>
      </div>
    `;
  }
  const sidePct = Math.round((sol.sideW / totalW) * 100);
  const mainPct = Math.max(10, 100 - sidePct);
  return `
    <div class="qw-frame">
      <div class="qw-side" style="width:${sidePct}%">${sol.sideW}</div>
      <div class="qw-main" style="width:${mainPct}%">${sol.mainW}</div>
    </div>
  `;
}

QUIZ_OPTIONS.forEach((opt) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "quiz-opt";
  btn.dataset.quiz = opt.id;
  btn.setAttribute("role", "radio");
  btn.setAttribute("aria-checked", "false");
  btn.innerHTML = `
    <div class="quiz-opt-head">
      <span class="quiz-opt-label">${opt.label}</span>
      <span class="quiz-opt-code">${opt.code}</span>
    </div>
    <div class="quiz-wire-pair">
      <div class="qw-cell">
        <span class="qw-cap">宽页 ${QUIZ_WIDE}px</span>
        ${wireHTML(opt.wide, QUIZ_WIDE)}
      </div>
      <div class="qw-cell">
        <span class="qw-cap">窄抽屉 ${QUIZ_NARROW}px</span>
        ${wireHTML(opt.narrow, QUIZ_NARROW)}
      </div>
    </div>
  `;

  btn.addEventListener("click", () => {
    $$(".quiz-opt", quizGrid).forEach((el) => {
      el.classList.remove("is-picked-ok", "is-picked-err");
      el.setAttribute("aria-checked", "false");
    });
    btn.setAttribute("aria-checked", "true");
    btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
    quizFeedback.classList.toggle("is-ok", opt.correct);
    quizFeedback.classList.toggle("is-err", !opt.correct);
    quizFeedback.innerHTML = `<strong>${opt.label} · ${opt.correct ? "回答正确" : "这里有陷阱"}</strong>：${opt.explain(opt.wide, opt.narrow)}`;
  });

  quizGrid.appendChild(btn);
});

// =====================================================================
// 7. 第 07 节：原海报放大漫游灯箱（单次引用 #poster.src，不重复内联）
// =====================================================================
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const posterImg = $("#poster");
const posterOpen = $("#poster-open");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lb.hidden) return;
  lb.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-in").addEventListener("click", () => {
  lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-out").addEventListener("click", () => {
  lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbScale = Math.max(0.6, Math.min(3.4, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbStage.classList.add("is-dragging");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
const stopLbDrag = () => {
  lbDrag = false;
  lbStage.classList.remove("is-dragging");
};
lbStage.addEventListener("pointerup", stopLbDrag);
lbStage.addEventListener("pointercancel", stopLbDrag);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});
