// 137 通版跨页 · 主控模块（串联 model.js、heroCanvas.js 与全部互动小节）

import {
  INITIAL_STATE,
  PRESETS,
  clamp,
  evaluateSpread,
} from "./model.js";
import { mountHeroCanvas } from "./heroCanvas.js";
import {
  initBindingSection,
  initBlueprintLab,
  initCurtainLab,
  initHistoryTimeline,
  initPosterLightbox,
  initQuiz,
  initTriageLab,
} from "./sections.js";

const state = { ...INITIAL_STATE };
let cachedEval = evaluateSpread(state);
let lastDomSignature = "";

// 常用 DOM 引用
const $ = (id) => document.getElementById(id);

const els = {
  canvas: $("hero-canvas"),
  statusPillTop: $("hero-status-pill"),
  statusPillMobile: $("hero-status-pill-m"),
  specimenBtns: document.querySelectorAll("[data-specimen]"),
  bindingBtns: document.querySelectorAll("[data-binding]"),
  presetBtns: document.querySelectorAll("[data-preset]"),
  probeBtns: document.querySelectorAll("[data-probe]"),
  // 诊单元素
  diagCard: $("diag-card"),
  diagBadge: $("diag-badge"),
  diagPosture: $("diag-posture"),
  diagHeadline: $("diag-headline"),
  diagBody: $("diag-body"),
  diagTip: $("diag-tip"),
  diagFixBtn: $("diag-fix-btn"),
  diagPulseBtn: $("diag-pulse-btn"),
  metricShear: $("metric-shear"),
  metricSpan: $("metric-span"),
  metricField: $("metric-field"),
  metricGutter: $("metric-gutter"),
  // 滑块与开关
  rangeShear: $("range-shear"),
  valShear: $("val-shear"),
  rangeSpan: $("range-span"),
  valSpan: $("val-span"),
  rangeTitle: $("range-title"),
  valTitle: $("val-title"),
  rangeWidth: $("range-width"),
  valWidth: $("val-width"),
  toggleGround: $("toggle-ground"),
  toggleBodyCross: $("toggle-body-cross"),
  toggleGuides: $("toggle-guides"),
  pulseNote: $("pulse-note"),
};

// 安全更新文本（防无意义 DOM 抖动，提升拖动帧率）
function setText(el, txt) {
  if (el && el.textContent !== txt) el.textContent = txt;
}

function syncHeroDOM() {
  const ev = cachedEval;
  const sig = [
    state.specimen,
    ev.shearMm,
    ev.spanPct,
    ev.titleOffsetPct,
    ev.ribbonWidthPct,
    state.binding,
    state.unifyGround,
    state.bodyCross,
    state.showGuides,
    state.highlightDim,
    ev.score,
    ev.badgeText,
  ].join("|");
  if (sig === lastDomSignature) return;
  lastDomSignature = sig;

  const isPass = ev.score === 4;

  // 顶部与移动端评定章
  [els.statusPillTop, els.statusPillMobile].forEach((p) => {
    if (!p) return;
    setText(p, ev.badgeText);
    p.dataset.pass = isPass ? "1" : "0";
  });

  // 标本按钮状态
  els.specimenBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.specimen === state.specimen));
  });

  // 装订按钮状态
  els.bindingBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.binding === state.binding));
  });

  // 诊单卡（全由 model.js 单真源生成）
  if (els.diagCard) els.diagCard.dataset.pass = isPass ? "1" : "0";
  setText(els.diagBadge, ev.badgeText);
  setText(els.diagPosture, ev.postureLabel);
  setText(els.diagHeadline, ev.headline);
  setText(els.diagBody, ev.body);
  setText(els.diagTip, ev.tip);
  setText(els.diagFixBtn, ev.quickActionLabel);
  if (els.diagFixBtn) els.diagFixBtn.dataset.pass = isPass ? "1" : "0";

  // 四项单真源实测读数
  setText(els.metricShear, ev.shearMm === 0 ? "0 mm" : `${ev.shearMm > 0 ? "+" : ""}${ev.shearMm} mm`);
  setText(els.metricSpan, `${ev.spanPct}%`);
  setText(els.metricField, `${ev.fieldWhitePct}%`);
  setText(els.metricGutter, `${ev.bind.gutterMm} mm`);

  // 滑块同步
  if (els.rangeShear) els.rangeShear.value = String(Math.round(state.seamShear * 1000));
  setText(els.valShear, ev.shearMm === 0 ? "0 mm" : `${ev.shearMm > 0 ? "+" : ""}${ev.shearMm} mm`);

  if (els.rangeSpan) els.rangeSpan.value = String(Math.round(state.spanReach * 100));
  setText(els.valSpan, `${ev.spanPct}%`);

  if (els.rangeTitle) els.rangeTitle.value = String(Math.round(state.titleOffset * 1000));
  setText(
    els.valTitle,
    ev.titleOffsetPct === 0 ? "骑脊 0%" : `${ev.titleOffsetPct > 0 ? "右偏 +" : "左偏 "}${ev.titleOffsetPct}%`,
  );

  if (els.rangeWidth) els.rangeWidth.value = String(Math.round(state.ribbonWidth * 100));
  setText(els.valWidth, `${ev.ribbonWidthPct}%`);

  // 开关按钮同步
  if (els.toggleGround) {
    const unified = state.unifyGround === "unified";
    els.toggleGround.setAttribute("aria-pressed", String(unified));
    setText(els.toggleGround, unified ? "双页底场：统一" : "双页底场：割裂");
  }
  if (els.toggleBodyCross) {
    els.toggleBodyCross.setAttribute("aria-pressed", String(!state.bodyCross));
    setText(els.toggleBodyCross, state.bodyCross ? "细正文：跨中缝" : "细正文：避脊栏");
  }
  if (els.toggleGuides) {
    els.toggleGuides.setAttribute("aria-pressed", String(state.showGuides));
    setText(els.toggleGuides, state.showGuides ? "参考标尺：开" : "参考标尺：关");
  }

  // 四枚原海报薄荷探针实时更新
  ev.probes.forEach((p) => {
    const btn = document.querySelector(`[data-probe="${p.id}"]`);
    if (!btn) return;
    btn.dataset.ok = p.ok ? "1" : "0";
    btn.setAttribute("aria-pressed", String(state.highlightDim === p.id));
    const tagEl = btn.querySelector(".probe-tag");
    setText(tagEl, p.tag);
  });
}

let heroView = null;

function mutate(patch) {
  Object.assign(state, patch);
  cachedEval = evaluateSpread(state);
  syncHeroDOM();
  if (heroView) heroView.redraw();
}

// 挂载开场跨缝接缝画布
if (els.canvas) {
  heroView = mountHeroCanvas(
    els.canvas,
    () => state,
    () => cachedEval,
    (patch) => mutate(patch),
    (passed) => {
      if (!els.pulseNote) return;
      els.pulseNote.textContent = passed
        ? "薄荷光流已无阻滑抵右页外切边——通版叙事成立。"
        : "光流在中缝错牙处撞断或提前停滞，请先对齐接缝并拉展至外缘。";
    },
  );
}

// 绑定开场全部原生控件
els.specimenBtns.forEach((b) => {
  b.addEventListener("click", () => mutate({ specimen: b.dataset.specimen }));
});

els.bindingBtns.forEach((b) => {
  b.addEventListener("click", () => mutate({ binding: b.dataset.binding }));
});

els.presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) mutate(p.patch);
  });
});

els.probeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const id = b.dataset.probe;
    mutate({ highlightDim: state.highlightDim === id ? null : id });
  });
});

els.diagFixBtn?.addEventListener("click", () => {
  if (cachedEval.quickActionPatch) {
    mutate(cachedEval.quickActionPatch);
  } else {
    heroView?.triggerPulse();
  }
});

els.diagPulseBtn?.addEventListener("click", () => {
  if (els.pulseNote) els.pulseNote.textContent = "正在沿色带中心线释放薄荷光流…";
  heroView?.triggerPulse();
});

els.rangeShear?.addEventListener("input", () => {
  let v = Number(els.rangeShear.value) / 1000;
  if (Math.abs(v) < 0.014) v = 0;
  mutate({ seamShear: clamp(v, -0.26, 0.26) });
});

els.rangeSpan?.addEventListener("input", () => {
  mutate({ spanReach: clamp(Number(els.rangeSpan.value) / 100, 0.36, 1.0) });
});

els.rangeTitle?.addEventListener("input", () => {
  let v = Number(els.rangeTitle.value) / 1000;
  if (Math.abs(v) < 0.01) v = 0;
  mutate({ titleOffset: clamp(v, -0.26, 0.26) });
});

els.rangeWidth?.addEventListener("input", () => {
  mutate({ ribbonWidth: clamp(Number(els.rangeWidth.value) / 100, 0.08, 0.56) });
});

els.toggleGround?.addEventListener("click", () => {
  mutate({ unifyGround: state.unifyGround === "unified" ? "split" : "unified" });
});

els.toggleBodyCross?.addEventListener("click", () => {
  mutate({ bodyCross: !state.bodyCross });
});

els.toggleGuides?.addEventListener("click", () => {
  mutate({ showGuides: !state.showGuides });
});

// 画布聚焦或全局快捷键：↑/↓ 调中缝错牙，←/→ 调贯穿延展，Space 演练薄荷光流
window.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const lb = document.getElementById("poster-lightbox");
  if (lb && !lb.hidden) return;

  if (e.code === "Space" && document.activeElement?.tagName !== "BUTTON") {
    e.preventDefault();
    heroView?.triggerPulse();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    let v = clamp(state.seamShear - 0.025, -0.26, 0.26);
    if (Math.abs(v) < 0.015) v = 0;
    mutate({ seamShear: Number(v.toFixed(3)) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    let v = clamp(state.seamShear + 0.025, -0.26, 0.26);
    if (Math.abs(v) < 0.015) v = 0;
    mutate({ seamShear: Number(v.toFixed(3)) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    mutate({ spanReach: Number(clamp(state.spanReach + 0.06, 0.36, 1.0).toFixed(3)) });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutate({ spanReach: Number(clamp(state.spanReach - 0.06, 0.36, 1.0).toFixed(3)) });
  }
});

// 初始同步
syncHeroDOM();

// 挂载正文全部 7 节互动实验与灯箱
initCurtainLab();
initBindingSection();
initBlueprintLab();
initHistoryTimeline();
initTriageLab();
initQuiz();
initPosterLightbox();
