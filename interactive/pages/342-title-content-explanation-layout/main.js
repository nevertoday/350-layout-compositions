// 342 内容与标题说明 幻灯片版式 — 主入口与状态同步

import { FAILURE_PRESETS, INITIAL_STATE, SOLUTIONS, isOrderAscending } from "./model.js";
import { createHeroStage } from "./stage.js";
import {
  initHistorySection,
  initPayloadSection,
  initPosterLightbox,
  initQuizSection,
  initRewriteSection,
  initTriageSection,
  initXraySection,
} from "./sections.js";

const state = {
  ...INITIAL_STATE,
  stepOrder: [...INITIAL_STATE.stepOrder],
};

const els = {
  canvas: document.getElementById("hero-canvas"),
  statusPill: document.getElementById("hero-status-pill"),
  heroTitle: document.getElementById("hero-title"),
  verdictStrip: document.getElementById("verdict-strip"),
  verdictTag: document.getElementById("verdict-tag"),
  verdictLoad: document.getElementById("verdict-load"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictWhy: document.getElementById("verdict-why"),
  verdictFix: document.getElementById("verdict-fix"),
  btnScan: document.getElementById("btn-scan"),
  btnFixAll: document.getElementById("btn-fix-all"),
  btnResetBad: document.getElementById("btn-reset-bad"),
  rngMargin: document.getElementById("rng-margin"),
  valMargin: document.getElementById("val-margin"),
  rngJitter: document.getElementById("rng-jitter"),
  valJitter: document.getElementById("val-jitter"),
  pillarStates: {
    hierarchy: document.getElementById("p-state-hierarchy"),
    alignment: document.getElementById("p-state-alignment"),
    rhythm: document.getElementById("p-state-rhythm"),
    emphasis: document.getElementById("p-state-emphasis"),
  },
  deckBtns: [...document.querySelectorAll(".deck-btn")],
  scriptBtns: [...document.querySelectorAll(".script-btn")],
  pillarBtns: [...document.querySelectorAll(".pillar-item")],
  headBtns: [...document.querySelectorAll("[data-head]")],
  stepBtns: [...document.querySelectorAll("[data-step]")],
  supBtns: [...document.querySelectorAll("[data-sup]")],
  accBtns: [...document.querySelectorAll("[data-acc]")],
  solBtns: [...document.querySelectorAll("[data-sol]")],
  failBtns: [...document.querySelectorAll("[data-fail]")],
};

let lastUiSig = "";

const stage = createHeroStage(
  els.canvas,
  () => state,
  (patch, opts = {}) => {
    Object.assign(state, patch);
    if (patch.stepOrder) state.stepOrder = [...patch.stepOrder];
    if (!opts.silent) syncUI();
    stage.markDirty();
  },
);

function mutate(patch) {
  Object.assign(state, patch);
  if (patch.stepOrder) state.stepOrder = [...patch.stepOrder];
  syncUI();
  stage.markDirty();
}

function syncUI() {
  const { layout, evalRes } = stage.getMetrics();
  const sig = JSON.stringify({
    s: state.scriptId,
    d: state.deckSlide,
    h: state.headlineMode,
    o: state.stepOrder,
    f: state.stepFormat,
    u: state.supportMode,
    a: state.accentMode,
    j: Math.round(state.alignJitter * 100),
    m: Math.round(state.marginRatio * 1000),
    fp: state.focusPillar,
    sc: state.scanActive,
    p: evalRes.passCount,
  });
  if (sig === lastUiSig) return;
  lastUiSig = sig;

  const isOk = evalRes.passCount === 4;

  // 顶栏状态胶囊
  els.statusPill.textContent = evalRes.pillShort;
  els.statusPill.className = `status-pill ${isOk ? "is-ok" : "is-bad"}`;

  // 自示范主标微联动：层级成立时紧致有力，塌平时轻微松散提示
  els.heroTitle.style.letterSpacing = evalRes.pillars.hierarchy.ok ? "-0.02em" : "0.02em";

  // 单真源白话诊单
  els.verdictStrip.classList.toggle("is-ok", isOk);
  els.verdictTag.textContent = isOk ? "4/4 成立" : `${evalRes.passCount}/4 失守`;
  els.verdictTag.className = `verdict-tag ${isOk ? "is-ok" : "is-bad"}`;
  els.verdictLoad.textContent = evalRes.loadLevel;
  els.verdictTitle.textContent = evalRes.verdictTitle;
  els.verdictWhy.textContent = evalRes.verdictWhy;
  els.verdictFix.textContent = evalRes.verdictFix;

  // 滑尺同步
  const mPct = +(state.marginRatio * 100).toFixed(1);
  els.rngMargin.value = String(mPct);
  els.valMargin.textContent = `${mPct.toFixed(1)}%`;

  const jPct = Math.round(state.alignJitter * 100);
  els.rngJitter.value = String(jPct);
  els.valJitter.textContent = `${jPct}%`;

  // 左侧 4 枚原海报绿色圆徽探针
  for (const key of ["hierarchy", "alignment", "rhythm", "emphasis"]) {
    const info = evalRes.pillars[key];
    const span = els.pillarStates[key];
    if (span) {
      span.textContent = info.badge;
      span.className = `pillar-state ${info.ok ? "is-ok" : "is-bad"}`;
    }
    const btn = els.pillarBtns.find((b) => b.dataset.pillar === key);
    if (btn) {
      btn.classList.toggle("is-ok", info.ok);
      btn.classList.toggle("is-focused", state.focusPillar === key);
      btn.setAttribute("aria-pressed", String(state.focusPillar === key));
    }
  }

  // 翻页与剧本按钮态
  els.deckBtns.forEach((b) => {
    const on = Number(b.dataset.deck) === state.deckSlide;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  els.scriptBtns.forEach((b) => {
    const on = b.dataset.script === state.scriptId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 四个原地开关态
  els.headBtns.forEach((b) => {
    const on = b.dataset.head === state.headlineMode;
    b.classList.toggle("is-active", on && state.headlineMode === "assertion");
    b.classList.toggle("is-bad-active", on && state.headlineMode !== "assertion");
  });

  const stepMode = state.stepFormat === "flat" ? "flat" : isOrderAscending(state.stepOrder) ? "order" : "reverse";
  els.stepBtns.forEach((b) => {
    const on = b.dataset.step === stepMode;
    b.classList.toggle("is-active", on && stepMode === "order");
    b.classList.toggle("is-bad-active", on && stepMode !== "order");
  });

  els.supBtns.forEach((b) => {
    const on = b.dataset.sup === state.supportMode;
    const good = state.supportMode === "poster4" || state.supportMode === "focus2";
    b.classList.toggle("is-active", on && good);
    b.classList.toggle("is-bad-active", on && !good);
  });

  els.accBtns.forEach((b) => {
    const on = b.dataset.acc === state.accentMode;
    b.classList.toggle("is-active", on && state.accentMode === "single");
    b.classList.toggle("is-bad-active", on && state.accentMode !== "single");
  });
}

// 绑定事件
els.deckBtns.forEach((b) => b.addEventListener("click", () => mutate({ deckSlide: Number(b.dataset.deck), scanActive: false })));
els.scriptBtns.forEach((b) => b.addEventListener("click", () => mutate({ scriptId: b.dataset.script, deckSlide: 1, scanActive: false })));

els.pillarBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const k = b.dataset.pillar;
    mutate({ deckSlide: 1, focusPillar: state.focusPillar === k ? null : k });
  }),
);

els.btnScan.addEventListener("click", () => {
  mutate({ deckSlide: 1, scanActive: true, scanTime: 0 });
});

els.btnFixAll.addEventListener("click", () => mutate({ ...SOLUTIONS.poster.patch, scanActive: false, focusPillar: null }));
els.btnResetBad.addEventListener("click", () => mutate({ ...FAILURE_PRESETS.disaster.patch, scanActive: false, focusPillar: null }));

els.rngMargin.addEventListener("input", () => {
  mutate({ deckSlide: 1, marginRatio: Number(els.rngMargin.value) / 100 });
});
els.rngJitter.addEventListener("input", () => {
  mutate({ deckSlide: 1, alignJitter: Number(els.rngJitter.value) / 100 });
});

els.headBtns.forEach((b) => b.addEventListener("click", () => mutate({ deckSlide: 1, headlineMode: b.dataset.head, focusPillar: "hierarchy" })));
els.stepBtns.forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.step === "order") mutate({ deckSlide: 1, stepFormat: "flow", stepOrder: [0, 1, 2], focusPillar: "rhythm" });
    else if (b.dataset.step === "reverse") mutate({ deckSlide: 1, stepFormat: "flow", stepOrder: [2, 0, 1], focusPillar: "rhythm" });
    else mutate({ deckSlide: 1, stepFormat: "flat", focusPillar: "rhythm" });
  }),
);
els.supBtns.forEach((b) => b.addEventListener("click", () => mutate({ deckSlide: 1, supportMode: b.dataset.sup, focusPillar: "rhythm" })));
els.accBtns.forEach((b) => b.addEventListener("click", () => mutate({ deckSlide: 1, accentMode: b.dataset.acc, focusPillar: "emphasis" })));

els.solBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const s = SOLUTIONS[b.dataset.sol];
    if (s) mutate({ ...s.patch, scanActive: false, focusPillar: null });
  }),
);
els.failBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const f = FAILURE_PRESETS[b.dataset.fail];
    if (f) mutate({ ...f.patch, scanActive: false, focusPillar: null });
  }),
);

// 键盘操作：Space 播放 5 秒扫视，左右方向键翻页（未聚焦在输入控件时）
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = document.getElementById("lightbox");
  if (lb && !lb.hidden) return;
  if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    e.preventDefault();
    mutate({ deckSlide: 1, scanActive: true, scanTime: 0 });
  } else if (e.key === "ArrowLeft") {
    mutate({ deckSlide: Math.max(0, state.deckSlide - 1), scanActive: false });
  } else if (e.key === "ArrowRight") {
    mutate({ deckSlide: Math.min(2, state.deckSlide + 1), scanActive: false });
  }
});

// 初始化其余 7 个章节与首次同步
syncUI();
initXraySection();
initRewriteSection();
initPayloadSection();
initHistorySection();
initTriageSection();
initQuizSection();
initPosterLightbox();
