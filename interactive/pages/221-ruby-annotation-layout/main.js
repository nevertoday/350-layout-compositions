// 221 旁注（Ruby）排版 · 总控入口（单真源状态 + Hero 联动 + 正文各节挂载）
import {
  INITIAL_STATE,
  VALID_SOLUTIONS,
  FAIL_CASES,
  SPECIMENS,
  INK_MODES,
  clamp,
} from "./model.js";
import { mountHeroStage } from "./stage-hero.js";
import { mountSections } from "./sections.js";

function createStore() {
  let state = { ...INITIAL_STATE };
  let lastAudit = null;
  const listeners = new Set();
  const auditListeners = new Set();
  const scanListeners = new Set();

  return {
    getState: () => state,
    getAudit: () => lastAudit,
    patch(partial) {
      state = { ...state, ...partial };
      listeners.forEach((fn) => fn(state));
    },
    reset() {
      const keepSpec = state.specimen;
      state = { ...INITIAL_STATE, specimen: keepSpec };
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    publishAudit(layout, ev) {
      lastAudit = { layout, ev };
      auditListeners.forEach((fn) => fn(layout, ev, state));
    },
    onAudit(fn) {
      auditListeners.add(fn);
    },
    setScanning(active) {
      scanListeners.forEach((fn) => fn(active));
    },
    onScanning(fn) {
      scanListeners.add(fn);
    },
  };
}

function init() {
  const store = createStore();
  const heroCanvas = document.getElementById("hero-canvas");

  // Hero 控件引用
  const ratioRange = document.getElementById("ctrl-ratio");
  const gapRange = document.getElementById("ctrl-gap");
  const lhRange = document.getElementById("ctrl-lh");
  const ratioVal = document.getElementById("val-ratio");
  const gapVal = document.getElementById("val-gap");
  const lhVal = document.getElementById("val-lh");
  const overhangBtn = document.getElementById("ctrl-overhang");
  const scanBtn = document.getElementById("btn-scan");
  const fixBtn = document.getElementById("btn-fix");
  const resetBtn = document.getElementById("btn-reset");
  const sunBtn = document.getElementById("hero-sun-btn");
  const sunRing = document.getElementById("hero-sun-ring");
  const titleRuby = document.getElementById("title-live-ruby");

  const statusPill = document.getElementById("hero-status-pill");
  const diagScore = document.getElementById("diag-score");
  const diagTitle = document.getElementById("diag-title");
  const diagWhy = document.getElementById("diag-why");
  const diagAction = document.getElementById("diag-action");
  const specDesc = document.getElementById("spec-desc");

  const specBtns = [...document.querySelectorAll("[data-specimen]")];
  const alignBtns = [...document.querySelectorAll("[data-align]")];
  const inkBtns = [...document.querySelectorAll("[data-ink]")];
  const solBtns = [...document.querySelectorAll("[data-solution]")];
  const failBtns = [...document.querySelectorAll("[data-fail]")];
  const probeCards = [...document.querySelectorAll("[data-probe]")];

  // 同步所有 DOM 控件与单真源读数
  function syncControls(st) {
    ratioRange.value = String(Math.round(st.rubyRatio * 100));
    gapRange.value = String(Math.round(st.gapEm * 100));
    lhRange.value = String(st.lineHeight.toFixed(2));
    ratioVal.textContent = `${Math.round(st.rubyRatio * 100)}%`;
    gapVal.textContent = `${Math.round(st.gapEm * 100)}%`;
    lhVal.textContent = `${st.lineHeight.toFixed(2)}×`;

    overhangBtn.textContent = st.overhang ? "悬挑借位：开" : "悬挑借位：关";
    overhangBtn.classList.toggle("is-on", st.overhang);
    overhangBtn.setAttribute("aria-pressed", String(st.overhang));

    specBtns.forEach((b) => {
      const act = b.dataset.specimen === st.specimen;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    alignBtns.forEach((b) => {
      const act = b.dataset.align === st.alignMode;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    inkBtns.forEach((b) => {
      const act = b.dataset.ink === st.inkMode;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    probeCards.forEach((c) => {
      c.classList.toggle("is-focused", c.dataset.probe === st.highlightDim);
    });

    const spec = SPECIMENS[st.specimen];
    if (specDesc && spec) specDesc.textContent = spec.desc;

    // 标题本身自示范：主标「旁注」头顶的活体拼音随状态微妙联动（但绝不破坏标题清晰度）
    if (titleRuby) {
      const ink = INK_MODES[st.inkMode] || INK_MODES.vermilion;
      const scaleEm = clamp(st.rubyRatio * 0.56, 0.22, 0.44);
      const liftPx = Math.round(clamp(st.gapEm * 14, 0, 7));
      titleRuby.style.fontSize = `${scaleEm.toFixed(2)}em`;
      titleRuby.style.marginBottom = `${liftPx}px`;
      titleRuby.style.color = st.inkMode === "faint" ? "#9C928B" : ink.color;
    }
  }

  store.onAudit((layout, ev, st) => {
    syncControls(st);

    if (statusPill) {
      statusPill.textContent = ev.statusLabel;
      statusPill.classList.toggle("is-pass", ev.isPass);
    }
    if (diagScore) {
      diagScore.textContent = ev.statusLabel;
      diagScore.classList.toggle("is-pass", ev.isPass);
    }
    if (diagTitle) diagTitle.textContent = ev.headline;
    if (diagWhy) diagWhy.textContent = ev.why;
    if (diagAction) diagAction.textContent = ev.action;

    // 右上红日进度弧（0/4 -> 4/4）
    if (sunRing) {
      const circ = 2 * Math.PI * 36;
      sunRing.style.strokeDasharray = `${circ}`;
      sunRing.style.strokeDashoffset = `${circ * (1 - ev.passedCount / 4)}`;
      sunRing.style.stroke = ev.isPass ? "#196B52" : "#C4302B";
    }

    // 柔杏四栏原海报要点探针实时更新
    probeCards.forEach((card) => {
      const key = card.dataset.probe;
      const c = ev.checks[key];
      if (!c) return;
      const badge = card.querySelector(".probe-badge");
      if (badge) {
        badge.textContent = c.badge;
        badge.classList.toggle("is-ok", c.ok);
        badge.classList.toggle("is-bad", !c.ok);
      }
      card.classList.toggle("is-pass", c.ok);
    });
  });

  // 挂载开场 2D Canvas
  const hero = mountHeroStage(heroCanvas, store);

  store.onScanning((active) => {
    if (scanBtn) {
      scanBtn.textContent = active ? "停止扫读 Space" : "扫读演播 Space";
      scanBtn.classList.toggle("is-active", active);
    }
  });

  // 绑定所有控件事件
  ratioRange.addEventListener("input", () => {
    store.patch({ rubyRatio: +(Number(ratioRange.value) / 100).toFixed(2) });
  });
  gapRange.addEventListener("input", () => {
    store.patch({ gapEm: +(Number(gapRange.value) / 100).toFixed(2) });
  });
  lhRange.addEventListener("input", () => {
    store.patch({ lineHeight: +Number(lhRange.value).toFixed(2) });
  });
  overhangBtn.addEventListener("click", () => {
    store.patch({ overhang: !store.getState().overhang });
  });

  specBtns.forEach((b) =>
    b.addEventListener("click", () => {
      store.patch({ specimen: b.dataset.specimen, verticalMain: false });
    })
  );
  alignBtns.forEach((b) =>
    b.addEventListener("click", () => {
      store.patch({ alignMode: b.dataset.align });
    })
  );
  inkBtns.forEach((b) =>
    b.addEventListener("click", () => {
      store.patch({ inkMode: b.dataset.ink });
    })
  );
  solBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const sol = VALID_SOLUTIONS[b.dataset.solution];
      if (sol) store.patch({ ...sol.patch, highlightDim: null });
    })
  );
  failBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const fc = FAIL_CASES[b.dataset.fail];
      if (fc) store.patch({ ...fc.patch, highlightDim: null });
    })
  );
  probeCards.forEach((card) => {
    card.addEventListener("click", () => {
      const cur = store.getState().highlightDim;
      store.patch({ highlightDim: cur === card.dataset.probe ? null : card.dataset.probe });
    });
  });

  fixBtn.addEventListener("click", () => {
    store.patch({ ...VALID_SOLUTIONS.poster.patch, highlightDim: null });
  });
  resetBtn.addEventListener("click", () => {
    store.reset();
  });
  scanBtn.addEventListener("click", () => hero.triggerScan());
  sunBtn?.addEventListener("click", () => hero.triggerScan());

  // 键盘微调（避免劫持表单输入焦点以外的正常浏览，仅在非输入态或画布聚焦时生效）
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const st = store.getState();

    if (e.code === "Space" && document.activeElement?.tagName !== "BUTTON") {
      // 仅在首屏可见时响应空格扫读
      const r = heroCanvas.getBoundingClientRect();
      if (r.bottom > 80 && r.top < window.innerHeight - 60) {
        e.preventDefault();
        hero.triggerScan();
      }
    } else if (e.key === "ArrowLeft") {
      const r = heroCanvas.getBoundingClientRect();
      if (r.bottom > 80 && r.top < window.innerHeight) {
        e.preventDefault();
        store.patch({ rubyRatio: +clamp(st.rubyRatio - 0.02, 0.24, 0.95).toFixed(2) });
      }
    } else if (e.key === "ArrowRight") {
      const r = heroCanvas.getBoundingClientRect();
      if (r.bottom > 80 && r.top < window.innerHeight) {
        e.preventDefault();
        store.patch({ rubyRatio: +clamp(st.rubyRatio + 0.02, 0.24, 0.95).toFixed(2) });
      }
    } else if (e.key === "ArrowUp") {
      const r = heroCanvas.getBoundingClientRect();
      if (r.bottom > 80 && r.top < window.innerHeight && document.activeElement === heroCanvas) {
        e.preventDefault();
        store.patch({ gapEm: +clamp(st.gapEm + 0.02, -0.04, 0.48).toFixed(2) });
      }
    } else if (e.key === "ArrowDown") {
      const r = heroCanvas.getBoundingClientRect();
      if (r.bottom > 80 && r.top < window.innerHeight && document.activeElement === heroCanvas) {
        e.preventDefault();
        store.patch({ gapEm: +clamp(st.gapEm - 0.02, -0.04, 0.48).toFixed(2) });
      }
    } else if (e.key === "v" || e.key === "V") {
      store.patch({ verticalMain: !st.verticalMain });
    }
  });

  // 挂载正文 01–07 节全部交互
  mountSections();

  // 供调试脚本只读检查单真源状态
  window.__ruby221 = {
    getState: () => store.getState(),
    getAudit: () => store.getAudit(),
  };
}

init();
