// 140 图片主导版式 · 主入口（开场裁切标注台 + 7 节交互 + 原海报灯箱）
import { loop } from "../../lib/stage.js";
import { clamp, clonePreset, createInitialState } from "./model.js";
import { createHeroStage } from "./hero-canvas.js";
import { initShutterLab, initCropLab, initAnnotationLab, initLineageLab, initDontUseCards, initQuizLab } from "./labs.js";

const state = createInitialState();

const heroCanvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const ratioImgSeg = document.getElementById("ratio-img-seg");
const ratioTxtSeg = document.getElementById("ratio-txt-seg");

const verdictTag = document.getElementById("verdict-tag");
const verdictTitle = document.getElementById("verdict-title");
const verdictBody = document.getElementById("verdict-body");
const verdictAction = document.getElementById("verdict-action");

const mVis = document.getElementById("m-vis");
const mCrop = document.getElementById("m-crop");
const mCover = document.getElementById("m-cover");
const mCross = document.getElementById("m-cross");

const rScale = document.getElementById("r-scale");
const rCut = document.getElementById("r-cut");
const rCopy = document.getElementById("r-copy");
const oScale = document.getElementById("o-scale");
const oCut = document.getElementById("o-cut");
const oCopy = document.getElementById("o-copy");

const pbPriority = document.getElementById("pb-priority");
const pbCropping = document.getElementById("pb-cropping");
const pbCenter = document.getElementById("pb-center");
const pbAnnotation = document.getElementById("pb-annotation");

let drawHero = () => {};
let lastUiSig = "";

function syncUI(geo) {
  if (!geo) return;
  const { metrics, dims, primary, passCount } = geo;
  const sig = `${passCount}|${primary.pill}|${metrics.visibleSubjectPct}|${metrics.totalCroppedPct}|${metrics.recognizableCorePct}|${metrics.textCoverSubjectPct}|${metrics.crossCount}|${state.scale.toFixed(2)}|${state.cutDepth.toFixed(2)}|${state.copyScale.toFixed(2)}`;
  if (sig === lastUiSig) return;
  lastUiSig = sig;

  // 顶栏状态徽标与自示范图文占比条
  statusPill.textContent = primary.pill;
  statusPill.classList.toggle("is-pass", passCount === 4);

  const imgW = clamp(metrics.imageShare, 24, 78);
  ratioImgSeg.style.width = `${imgW}%`;
  ratioImgSeg.textContent = `图 ${metrics.imageShare}%`;
  ratioTxtSeg.textContent = `字 ${metrics.textShare}%`;

  // 单真源诊断工单
  verdictTag.textContent = primary.tag;
  verdictTag.classList.toggle("is-pass", passCount === 4);
  verdictTitle.textContent = primary.title;
  verdictBody.textContent = primary.detail;
  verdictAction.textContent = primary.action;

  // 四格实测读数
  mVis.textContent = `${metrics.visibleSubjectPct}%`;
  mVis.className = `metric-v ${dims.priority.ok ? "is-ok" : "is-bad"}`;
  mCrop.textContent = `${metrics.totalCroppedPct}% / ${metrics.recognizableCorePct}%`;
  mCrop.className = `metric-v ${dims.cropping.ok ? "is-ok" : "is-bad"}`;
  mCover.textContent = `${metrics.textCoverSubjectPct}%`;
  mCover.className = `metric-v ${dims.center.ok ? "is-ok" : "is-bad"}`;
  mCross.textContent = `${metrics.crossCount} 处`;
  mCross.className = `metric-v ${dims.annotation.ok ? "is-ok" : "is-bad"}`;

  // 滑杆同步
  rScale.value = state.scale.toFixed(2);
  oScale.textContent = `${state.scale.toFixed(2)}×`;
  rCut.value = state.cutDepth.toFixed(2);
  oCut.textContent = `${Math.round(state.cutDepth * 100)}%`;
  rCopy.value = state.copyScale.toFixed(2);
  oCopy.textContent = `${state.copyScale.toFixed(2)}×`;

  // 四列原海报原则探针
  const setPb = (el, d) => {
    el.textContent = d.badge;
    el.classList.toggle("is-ok", d.ok);
  };
  setPb(pbPriority, dims.priority);
  setPb(pbCropping, dims.cropping);
  setPb(pbCenter, dims.center);
  setPb(pbAnnotation, dims.annotation);
}

const stage = createHeroStage(heroCanvas, state, () => {
  heroLoop.draw();
});

const heroLoop = loop(heroCanvas, (t, dt, opts) => {
  const geo = stage.render(t, dt, opts);
  if (geo) syncUI(geo);
});
drawHero = () => {
  stage.touch();
  heroLoop.draw();
};
drawHero();

// 题材切换
document.querySelectorAll("[data-subject]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.subject = btn.dataset.subject;
    document.querySelectorAll("[data-subject]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    drawHero();
  });
});

// 滑杆精控
rScale.addEventListener("input", () => {
  state.scale = Number(rScale.value);
  const tRight = clamp((state.scale - 0.66) / 0.62, 0, 1);
  state.cx = Math.round((0.50 + tRight * 0.14) * 1000) / 1000;
  drawHero();
});
rCut.addEventListener("input", () => {
  state.cutDepth = Number(rCut.value);
  drawHero();
});
rCopy.addEventListener("input", () => {
  state.copyScale = Number(rCopy.value);
  drawHero();
});

// 一键校准、复原错态、多组合法解与双向试错
function applyPreset(key) {
  const next = clonePreset(key, state.subject);
  Object.assign(state, next);
  drawHero();
}

document.getElementById("btn-fix-classic").addEventListener("click", () => applyPreset("classic"));
document.getElementById("btn-reset-broken").addEventListener("click", () => applyPreset("broken"));
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});

// 13ms 闪看验真
function triggerGlance() {
  state.glanceRemaining = state.glanceDuration;
  drawHero();
}
document.getElementById("btn-glance").addEventListener("click", triggerGlance);

// 标尺开关
const btnGuides = document.getElementById("btn-guides");
btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  btnGuides.textContent = state.showGuides ? "标尺：开" : "标尺：关";
  drawHero();
});

// 底部四列探针点击高亮对应维度
const probeItems = [...document.querySelectorAll(".probe-item")];
probeItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    const dim = btn.dataset.dim;
    state.activeDim = state.activeDim === dim ? null : dim;
    probeItems.forEach((x) => x.classList.toggle("is-selected", x.dataset.dim === state.activeDim));
    drawHero();
  });
});

// 键盘操作（方向键微调主图尺度/斜切深度，Space 触发 13ms 闪看）
window.addEventListener("keydown", (e) => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (!document.getElementById("lightbox").hidden) return;
  if (e.code === "Space") {
    e.preventDefault();
    triggerGlance();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.scale = Math.round(clamp(state.scale + 0.04, 0.40, 1.80) * 100) / 100;
    const tRight = clamp((state.scale - 0.66) / 0.62, 0, 1);
    state.cx = Math.round((0.50 + tRight * 0.14) * 1000) / 1000;
    drawHero();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.scale = Math.round(clamp(state.scale - 0.04, 0.40, 1.80) * 100) / 100;
    const tRight = clamp((state.scale - 0.66) / 0.62, 0, 1);
    state.cx = Math.round((0.50 + tRight * 0.14) * 1000) / 1000;
    drawHero();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.cutDepth = Math.round(clamp(state.cutDepth + 0.03, 0.02, 0.60) * 100) / 100;
    drawHero();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.cutDepth = Math.round(clamp(state.cutDepth - 0.03, 0.02, 0.60) * 100) / 100;
    drawHero();
  }
});

/* ==================== 07 · 原海报放大灯箱（复用唯一 #poster.src） ==================== */
function initLightbox() {
  const poster = document.getElementById("poster");
  const trigger = document.getElementById("poster-trigger");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const zoomVal = document.getElementById("lb-zoom-val");

  let zoom = 1, ox = 0, oy = 0, drag = null;

  function apply() {
    lbImg.style.transform = `translate(${ox}px, ${oy}px) scale(${zoom})`;
    zoomVal.textContent = `${Math.round(zoom * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = poster.src;
    zoom = 1; ox = 0; oy = 0;
    apply();
    lb.hidden = false;
    document.getElementById("lb-close").focus();
  }

  function close() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-zoom-in").addEventListener("click", () => { zoom = clamp(zoom + 0.35, 0.6, 4); apply(); });
  document.getElementById("lb-zoom-out").addEventListener("click", () => { zoom = clamp(zoom - 0.35, 0.6, 4); apply(); });
  document.getElementById("lb-reset").addEventListener("click", () => { zoom = 1; ox = 0; oy = 0; apply(); });

  lbStage.addEventListener("click", (e) => { if (e.target === lbStage) close(); });
  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = clamp(zoom + (e.deltaY < 0 ? 0.18 : -0.18), 0.6, 4);
    apply();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    drag = { x: e.clientX, y: e.clientY, ox, oy };
    lbStage.setPointerCapture?.(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    ox = drag.ox + (e.clientX - drag.x);
    oy = drag.oy + (e.clientY - drag.y);
    apply();
  });
  lbStage.addEventListener("pointerup", () => { drag = null; });
  lbStage.addEventListener("pointercancel", () => { drag = null; });

  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
}

// 启动全部 7 节交互
initShutterLab();
initCropLab();
initAnnotationLab();
initLineageLab();
initDontUseCards();
initQuizLab();
initLightbox();
