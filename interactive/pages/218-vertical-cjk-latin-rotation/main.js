// 218 直排中西文转向 · 主控入口
import {
  FAULTS,
  INITIAL_STATE,
  NUMERAL_MODES,
  PUNCT_MODES,
  SOLUTIONS,
  auditState,
  normalizeAngle,
} from "./model.js";
import { createHeroStage } from "./stage-hero.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

const state = { ...INITIAL_STATE };
let stage = null;
let uiTimer = 0;
const domCache = {};

function setTextDiff(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function getAudit() {
  const geom = stage ? stage.getGeometry() : null;
  if (!geom) return null;
  return auditState(state, geom);
}

// 同步全部 DOM 读数、诊单、按钮高亮与四枚原海报原则探针（带差量判断，拖动零无效重排）
function syncUI() {
  if (!stage) return;
  const audit = getAudit();
  if (!audit) return;

  const stState = audit.passed === 4 ? "ok" : "err";
  for (const el of domCache.stamps) {
    setTextDiff(el, audit.statusStamp);
    if (el.dataset.state !== stState) el.dataset.state = stState;
  }

  setTextDiff(domCache.hEl, audit.headline);
  setTextDiff(domCache.wEl, audit.why);
  setTextDiff(domCache.howEl, audit.how);
  setTextDiff(domCache.fixBtn, audit.fixLabel);
  if (domCache.playBtn) {
    setTextDiff(domCache.playBtn, state.flowPlaying ? "暂停视线 (Space)" : "演播视线 (Space)");
    const ps = String(state.flowPlaying);
    if (domCache.playBtn.getAttribute("aria-pressed") !== ps) domCache.playBtn.setAttribute("aria-pressed", ps);
  }

  setTextDiff(domCache.mAngle, audit.metrics.angleText);
  setTextDiff(domCache.mAxis, audit.metrics.axisText);
  setTextDiff(domCache.mGutter, audit.metrics.gutterText);
  setTextDiff(domCache.mScale, audit.metrics.scaleText);
  setTextDiff(domCache.mPosture, audit.metrics.postureLabel);

  const angStr = String(normalizeAngle(state.latinAngle));
  const shStr = String(state.baselineShift);
  const scStr = String(Math.round(state.latinScale * 100));
  if (domCache.sAngle && domCache.sAngle.value !== angStr) domCache.sAngle.value = angStr;
  if (domCache.sShift && domCache.sShift.value !== shStr) domCache.sShift.value = shStr;
  if (domCache.sScale && domCache.sScale.value !== scStr) domCache.sScale.value = scStr;
  setTextDiff(domCache.vAngle, audit.metrics.angleText);
  setTextDiff(domCache.vShift, `${state.baselineShift > 0 ? "+" : ""}${state.baselineShift}px`);
  setTextDiff(domCache.vScale, `${scStr}%`);

  for (const b of domCache.specBtns) {
    const on = b.dataset.specimen === state.specimen;
    if (b.classList.contains("is-active") !== on) {
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }
  for (const b of domCache.numBtns) {
    const on = b.dataset.numMode === state.numeralMode;
    if (b.classList.contains("is-active") !== on) {
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }
  for (const b of domCache.punctBtns) {
    const on = b.dataset.punctMode === state.punctMode;
    if (b.classList.contains("is-active") !== on) {
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
  }

  for (const key of ["flow", "rotation", "rhythm", "hierarchy"]) {
    const p = domCache.probes[key];
    const info = audit.probes[key];
    if (p?.badge && info) {
      setTextDiff(p.badge, info.badge);
      const ns = info.pass ? "ok" : "err";
      if (p.badge.dataset.state !== ns) p.badge.dataset.state = ns;
    }
    if (p?.card) {
      const pass = !!info?.pass;
      const hl = state.highlightProbe === key;
      if (p.card.classList.contains("is-pass") !== pass) p.card.classList.toggle("is-pass", pass);
      if (p.card.classList.contains("is-highlight") !== hl) {
        p.card.classList.toggle("is-highlight", hl);
        p.card.setAttribute("aria-pressed", String(hl));
      }
    }
  }
}

function mutate(patch, throttling = false) {
  Object.assign(state, patch);
  if (patch.latinAngle != null) state.latinAngle = normalizeAngle(patch.latinAngle);
  stage?.markDirty();
  if (throttling) {
    if (!uiTimer) {
      uiTimer = window.setTimeout(() => {
        uiTimer = 0;
        syncUI();
      }, 80);
    }
  } else {
    if (uiTimer) {
      clearTimeout(uiTimer);
      uiTimer = 0;
    }
    syncUI();
  }
}

function init() {
  domCache.stamps = [...document.querySelectorAll("[data-status-stamp]")];
  domCache.hEl = document.getElementById("audit-headline");
  domCache.wEl = document.getElementById("audit-why");
  domCache.howEl = document.getElementById("audit-how");
  domCache.fixBtn = document.getElementById("btn-fix");
  domCache.playBtn = document.getElementById("btn-play");
  domCache.mAngle = document.getElementById("m-angle");
  domCache.mAxis = document.getElementById("m-axis");
  domCache.mGutter = document.getElementById("m-gutter");
  domCache.mScale = document.getElementById("m-scale");
  domCache.mPosture = document.getElementById("m-posture");
  domCache.sAngle = document.getElementById("ctrl-angle");
  domCache.sShift = document.getElementById("ctrl-shift");
  domCache.sScale = document.getElementById("ctrl-scale");
  domCache.vAngle = document.getElementById("val-angle");
  domCache.vShift = document.getElementById("val-shift");
  domCache.vScale = document.getElementById("val-scale");
  domCache.specBtns = [...document.querySelectorAll("[data-specimen]")];
  domCache.numBtns = [...document.querySelectorAll("[data-num-mode]")];
  domCache.punctBtns = [...document.querySelectorAll("[data-punct-mode]")];
  domCache.probes = Object.fromEntries(
    ["flow", "rotation", "rhythm", "hierarchy"].map((k) => [
      k,
      {
        card: document.querySelector(`[data-probe="${k}"]`),
        badge: document.querySelector(`[data-probe-badge="${k}"]`),
      },
    ])
  );
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas) {
    stage = createHeroStage(heroCanvas, () => state, getAudit, mutate, syncUI);
  }

  // 标本切签
  document.querySelectorAll("[data-specimen]").forEach((b) =>
    b.addEventListener("click", () => mutate({ specimen: b.dataset.specimen }))
  );

  // 一键校准 / 演播视线 / 复原开场
  document.getElementById("btn-fix")?.addEventListener("click", () => {
    const audit = getAudit();
    if (audit && audit.fixPatch) {
      mutate({ ...audit.fixPatch });
    } else {
      mutate({ flowPlaying: true });
    }
  });
  document.getElementById("btn-play")?.addEventListener("click", () => {
    mutate({ flowPlaying: !state.flowPlaying });
  });
  document.getElementById("btn-reset")?.addEventListener("click", () => {
    mutate({ ...INITIAL_STATE, specimen: state.specimen, highlightProbe: null });
  });

  // 三个精密滑块
  document.getElementById("ctrl-angle")?.addEventListener("input", (e) => {
    mutate({ latinAngle: Number(e.target.value) });
  });
  document.getElementById("ctrl-shift")?.addEventListener("input", (e) => {
    mutate({ baselineShift: Number(e.target.value) });
  });
  document.getElementById("ctrl-scale")?.addEventListener("input", (e) => {
    mutate({ latinScale: Number(e.target.value) / 100 });
  });

  // 数字与标点快捷组
  document.querySelectorAll("[data-num-mode]").forEach((b) =>
    b.addEventListener("click", () => mutate({ numeralMode: b.dataset.numMode }))
  );
  document.querySelectorAll("[data-punct-mode]").forEach((b) =>
    b.addEventListener("click", () => mutate({ punctMode: b.dataset.punctMode }))
  );

  // 多组合法解与反向试错按钮
  document.querySelectorAll("[data-solution]").forEach((b) =>
    b.addEventListener("click", () => {
      const s = SOLUTIONS[b.dataset.solution];
      if (s) mutate({ ...s.patch });
    })
  );
  document.querySelectorAll("[data-fault]").forEach((b) =>
    b.addEventListener("click", () => {
      const f = FAULTS[b.dataset.fault];
      if (f) mutate({ ...f.patch });
    })
  );

  // 底栏四原则探针（点按高亮画布对应参考线）
  document.querySelectorAll("[data-probe]").forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.probe;
      mutate({ highlightProbe: state.highlightProbe === k ? null : k });
    })
  );

  // 键盘精细控制：←/→ 调角度 5°，↑/↓ 调基线偏距 1px，Space 开关视线演播
  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (!document.getElementById("lightbox")?.hidden) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      mutate({ latinAngle: state.latinAngle + 5 });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      mutate({ latinAngle: state.latinAngle - 5 });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      mutate({ baselineShift: Math.max(-12, state.baselineShift - 1) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      mutate({ baselineShift: Math.min(12, state.baselineShift + 1) });
    } else if (e.key === " " && document.activeElement?.tagName !== "BUTTON") {
      e.preventDefault();
      mutate({ flowPlaying: !state.flowPlaying });
    }
  });

  syncUI();
  window.addEventListener("resize", () => syncUI());

  // 初始化正文七节
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}

init();
