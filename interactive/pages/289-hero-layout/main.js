// 289 主视觉布局（HERO LAYOUT）主入口
import { loop, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, evaluateHero, clamp } from "./model.js";
import { createHeroStage } from "./stage-hero.js";
import {
  initChainLab,
  initEvidenceLab,
  initArchetypeLab,
  initScrimLab,
  initAntiCaseLab,
  initQuizLab,
  initPosterLightbox,
} from "./labs.js";

const state = { ...INITIAL_STATE };
const canvas = document.getElementById("hero-stage");

// DOM 元素缓存
const statusPill = document.getElementById("hero-status-pill");
const ordH = document.getElementById("ord-h");
const ordM = document.getElementById("ord-m");
const ordA = document.getElementById("ord-a");
const orderSteps = document.querySelectorAll(".order-step");

const cvBadge = document.getElementById("cv-badge");
const cvText = document.getElementById("cv-text");

const shareSlider = document.getElementById("ctrl-share");
const shareVal = document.getElementById("val-share");
const btnCarousel = document.getElementById("btn-carousel");
const btnScrim = document.getElementById("btn-scrim");
const btnScan = document.getElementById("btn-scan");
const btnFlash = document.getElementById("btn-flash");

const keysTier = document.getElementById("keys-tier");
const keyH = document.getElementById("key-h");
const keyM = document.getElementById("key-m");
const keyA = document.getElementById("key-a");
const metH = document.getElementById("met-h");
const metM = document.getElementById("met-m");
const metA = document.getElementById("met-a");
const keysHint = document.getElementById("keys-hint");

let heroLoop = null;
let stage = null;

function syncUI() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width > 40 ? Math.round(rect.width) : 920;
  const h = rect.height > 40 ? Math.round(rect.height) : 440;
  const info = evaluateHero(state, w, h);

  // 顶部状态胶囊
  statusPill.textContent = `${info.passCount}/3 ${info.tier}`;
  statusPill.dataset.pass = String(info.allPass);

  // 289 原海报右上「阅读顺序 ①②③」实况
  ordH.textContent = info.hPass ? `${info.actualVisualPct}% 焦点稳` : info.hIssues[0].short;
  ordM.textContent = info.mPass ? `${info.headlineChars}字 · 清晰` : info.mIssues[0].short;
  ordA.textContent = info.aPass ? `折线上 +${info.ctaMarginPx}px` : info.aIssues[0].short;

  orderSteps.forEach((el) => {
    const s = el.dataset.step;
    el.dataset.ok = String(s === "H" ? info.hPass : s === "M" ? info.mPass : info.aPass);
  });

  // 窄屏精简结论条
  cvBadge.textContent = `${info.passCount}/3`;
  cvText.textContent = info.verdictTitle;

  // 左框 H/M/A 控件同步
  const roundedShare = Math.round(state.visualShare);
  shareSlider.value = String(roundedShare);
  shareVal.textContent = `${info.actualVisualPct}%`;

  document.querySelectorAll("#scenario-bar button[data-scenario]").forEach((b) => {
    const on = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#ctrl-arch button[data-arch]").forEach((b) => {
    const on = b.dataset.arch === state.archetype;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#ctrl-msg button[data-msg]").forEach((b) => {
    const on = b.dataset.msg === state.messageMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#ctrl-cta button[data-cta]").forEach((b) => {
    const on = b.dataset.cta === state.ctaMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("#ctrl-fold button[data-fold]").forEach((b) => {
    const on = b.dataset.fold === state.fold;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  btnCarousel.textContent = state.carousel ? "轮播干扰：开" : "轮播干扰：关";
  btnCarousel.classList.toggle("is-danger", state.carousel);
  btnCarousel.setAttribute("aria-pressed", String(state.carousel));

  btnScrim.textContent = state.scrim ? "深钴暗罩：开" : "深钴暗罩：关";
  btnScrim.classList.toggle("is-on", state.scrim);
  btnScrim.setAttribute("aria-pressed", String(state.scrim));

  btnScan.textContent = state.showScan ? "视线路径：开" : "视线路径：关";
  btnScan.classList.toggle("is-on", state.showScan);
  btnScan.setAttribute("aria-pressed", String(state.showScan));

  // 右框：好的 Hero 布局 = 3 个关键
  keysTier.textContent = `${info.passCount}/3 · ${info.tier}`;
  keysTier.dataset.ok = String(info.allPass);
  keyH.dataset.ok = String(info.hPass);
  keyM.dataset.ok = String(info.mPass);
  keyA.dataset.ok = String(info.aPass);

  metH.textContent = info.hPass ? `${info.actualVisualPct}% 焦点稳固` : info.hIssues[0].short;
  metM.textContent = info.mPass ? `${info.headlineChars}字 · ${info.headlineContrast}:1` : info.mIssues[0].short;
  metA.textContent = info.aPass ? `折线上 +${info.ctaMarginPx}px` : info.aIssues[0].short;
  keysHint.textContent = info.nextHint;
}

function updateAndDraw() {
  syncUI();
  heroLoop?.draw();
}

function handleStageAction(kind, payload) {
  if (kind === "drag-share") {
    state.visualShare = clamp(payload, 14, 84);
    stage?.closeFlash();
    updateAndDraw();
    return;
  }
  if (kind === "close-flash") {
    stage?.closeFlash();
    updateAndDraw();
    return;
  }
  if (kind === "flash-done") {
    heroLoop?.draw();
    return;
  }
  if (kind === "fix-h" || kind === "visual") {
    if (state.carousel) state.carousel = false;
    else if (state.visualShare < 36 || state.visualShare > 72) state.visualShare = 56;
    else state.carousel = true;
    updateAndDraw();
    return;
  }
  if (kind === "fix-m" || kind === "message") {
    if (state.archetype === "fullbleed" && !state.scrim) {
      state.scrim = true;
    } else {
      const seq = ["fluff", "slogan", "value"];
      state.messageMode = seq[(seq.indexOf(state.messageMode) + 1) % seq.length];
    }
    updateAndDraw();
    return;
  }
  if (kind === "fix-a" || kind === "cta") {
    if (state.ctaMode !== "clear") state.ctaMode = "clear";
    else if (state.visualShare > 74) state.visualShare = 58;
    else state.ctaMode = "crowded";
    updateAndDraw();
  }
}

stage = createHeroStage(canvas, () => state, handleStageAction);
heroLoop = loop(canvas, (t, dt, meta) => {
  stage.render(t, dt, meta);
});

// 按钮与滑杆绑定
document.getElementById("scenario-bar")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-scenario]");
  if (!b) return;
  state.scenario = b.dataset.scenario;
  stage.closeFlash();
  updateAndDraw();
});

shareSlider?.addEventListener("input", () => {
  state.visualShare = Number(shareSlider.value);
  stage.closeFlash();
  updateAndDraw();
});

document.getElementById("ctrl-arch")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-arch]");
  if (!b) return;
  state.archetype = b.dataset.arch;
  stage.closeFlash();
  updateAndDraw();
});

document.getElementById("ctrl-msg")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-msg]");
  if (!b) return;
  state.messageMode = b.dataset.msg;
  stage.closeFlash();
  updateAndDraw();
});

document.getElementById("ctrl-cta")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-cta]");
  if (!b) return;
  state.ctaMode = b.dataset.cta;
  stage.closeFlash();
  updateAndDraw();
});

document.getElementById("ctrl-fold")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-fold]");
  if (!b) return;
  state.fold = b.dataset.fold;
  stage.closeFlash();
  updateAndDraw();
});

btnCarousel?.addEventListener("click", () => {
  state.carousel = !state.carousel;
  stage.closeFlash();
  updateAndDraw();
});

btnScrim?.addEventListener("click", () => {
  state.scrim = !state.scrim;
  stage.closeFlash();
  updateAndDraw();
});

btnScan?.addEventListener("click", () => {
  state.showScan = !state.showScan;
  updateAndDraw();
});

btnFlash?.addEventListener("click", () => {
  stage.triggerFlash(reducedMotion.matches);
  heroLoop.draw();
});

document.getElementById("ctrl-presets")?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-preset]");
  if (!b) return;
  const preset = PRESETS[b.dataset.preset];
  if (!preset) return;
  Object.assign(state, preset);
  stage.closeFlash();
  updateAndDraw();
});

// 画布键盘操作（左右箭头调视觉占比，空格触发 0.5 秒盲闪）
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.visualShare = clamp(state.visualShare + 4, 14, 84);
    stage.closeFlash();
    updateAndDraw();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.visualShare = clamp(state.visualShare - 4, 14, 84);
    stage.closeFlash();
    updateAndDraw();
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    stage.triggerFlash(reducedMotion.matches);
    heroLoop.draw();
  }
});

// 窗口尺寸变化时同步画布与单真源读数
let resizeRaf = 0;
window.addEventListener("resize", () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    updateAndDraw();
  });
});

// 初始化正文 01–07 实验室与原海报灯箱
initChainLab();
initEvidenceLab();
initArchetypeLab();
initScrimLab();
initAntiCaseLab();
initQuizLab();
initPosterLightbox();

// 首次同步并绘首帧
updateAndDraw();
