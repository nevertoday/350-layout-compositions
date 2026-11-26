// 170 扩张系统 · 主入口与状态同步
import { INITIAL_STATE, PRESETS, LAWS, BRIDGES, clampState } from "./model.js";
import { createHeroStage } from "./hero-canvas.js";
import {
  initSec01Growth,
  initSec02ArcLab,
  initSec03History,
  initSec04Compare,
  initSec05Avoid,
  initSec06Quiz,
  initSec07Lightbox,
} from "./sections.js";

let state = { ...INITIAL_STATE };
let stage = null;

// DOM 引用缓存
const dom = {
  heroTitle: document.getElementById("hero-title-demo"),
  topStatus: document.getElementById("top-status-pill"),
  diagBox: document.getElementById("diag-box"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  mOuter: document.getElementById("m-outer"),
  mGap: document.getElementById("m-gap"),
  mCurv: document.getElementById("m-curv"),
  mTier: document.getElementById("m-tier"),
  // 手机首屏紧贴诊单条
  mobDiagText: document.getElementById("mob-diag-text"),
  mobFixBtn: document.getElementById("mob-fix-btn"),
  // 操控控件
  ratioSlider: document.getElementById("ctrl-ratio"),
  ratioVal: document.getElementById("ctrl-ratio-val"),
  coreSlider: document.getElementById("ctrl-core"),
  coreVal: document.getElementById("ctrl-core-val"),
  ringsSlider: document.getElementById("ctrl-rings"),
  ringsVal: document.getElementById("ctrl-rings-val"),
  flipBtn: document.getElementById("ctrl-flip"),
  pulseBtn: document.getElementById("ctrl-pulse"),
  guidesBtn: document.getElementById("ctrl-guides"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  lawBtns: [...document.querySelectorAll("[data-law]")],
  bridgeBtns: [...document.querySelectorAll("[data-bridge]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  traitCards: [...document.querySelectorAll("[data-trait-id]")],
  sideCards: [...document.querySelectorAll("[data-side-id]")],
  principleCards: [...document.querySelectorAll("[data-principle-id]")],
};

let currentFixPatch = null;

function syncUI(ev) {
  const s = ev.state;
  currentFixPatch = ev.verdict.fixPatch;

  // 自示范巨标：字距与缩放随扩张倍率微妙呼应（绝不溢出）
  if (dom.heroTitle) {
    const spread = ((s.ratio - 1.08) / 0.54) * 0.14;
    dom.heroTitle.style.setProperty("--title-spread", `${spread.toFixed(3)}em`);
  }

  // 顶部状态胶囊
  if (dom.topStatus) {
    dom.topStatus.textContent = ev.verdict.badge;
    dom.topStatus.classList.toggle("is-ok", ev.isSolved);
    dom.topStatus.classList.toggle("is-warn", !ev.isSolved);
  }

  // 主诊单匣
  if (dom.diagBox) {
    dom.diagBox.classList.toggle("is-ok", ev.isSolved);
    dom.diagBox.classList.toggle("is-warn", !ev.isSolved);
    dom.diagBadge.textContent = ev.verdict.badge;
    dom.diagTitle.textContent = ev.verdict.title;
    dom.diagWhy.textContent = ev.verdict.why;
    dom.diagAction.textContent = ev.verdict.action;
    dom.diagFixBtn.textContent = ev.verdict.fixLabel;
  }

  // 4 格单真源实测读数
  if (dom.mOuter) dom.mOuter.textContent = `${Math.round(ev.outerNorm * 100)}%`;
  if (dom.mGap) dom.mGap.textContent = `${ev.minGapPx}px`;
  if (dom.mCurv) dom.mCurv.textContent = `${ev.worstDegPerChar.toFixed(1)}°/字`;
  if (dom.mTier) dom.mTier.textContent = ev.rhythmTier;

  // 手机首屏紧贴诊单首句
  if (dom.mobDiagText) dom.mobDiagText.textContent = ev.verdict.title;
  if (dom.mobFixBtn) dom.mobFixBtn.textContent = ev.verdict.fixLabel;

  // 左侧 4 枚原海报酸柠图符体检列
  ev.traits.forEach((tr) => {
    const el = dom.traitCards.find((x) => x.dataset.traitId === tr.id);
    if (!el) return;
    el.classList.toggle("is-ok", tr.ok);
    el.classList.toggle("is-warn", !tr.ok);
    el.classList.toggle("is-focus", s.focusRing === tr.ringTarget);
    const chip = el.querySelector(".trait-chip");
    if (chip) chip.textContent = tr.status;
  });

  // 右翼 3 枚桃粉细框错落卡
  ev.sideNotes.forEach((sn) => {
    const el = dom.sideCards.find((x) => x.dataset.sideId === sn.id);
    if (!el) return;
    el.classList.toggle("is-ok", sn.ok);
    el.classList.toggle("is-warn", !sn.ok);
    const chip = el.querySelector(".side-chip");
    if (chip) chip.textContent = sn.chip;
  });

  // 底部金线圆角横框「扩张原则」4 栏
  ev.principles.forEach((pr) => {
    const el = dom.principleCards.find((x) => x.dataset.principleId === pr.id);
    if (!el) return;
    el.classList.toggle("is-ok", pr.ok);
    el.classList.toggle("is-warn", !pr.ok);
    const m = el.querySelector(".principle-metric");
    if (m) m.textContent = pr.metric;
  });

  // 同步滑杆与开关状态
  if (dom.ratioSlider && document.activeElement !== dom.ratioSlider) {
    dom.ratioSlider.value = s.ratio.toFixed(2);
  }
  if (dom.ratioVal) dom.ratioVal.textContent = `${s.ratio.toFixed(2)}×`;

  if (dom.coreSlider && document.activeElement !== dom.coreSlider) {
    dom.coreSlider.value = String(Math.round(s.corePct * 100));
  }
  if (dom.coreVal) dom.coreVal.textContent = `${Math.round(s.corePct * 100)}%`;

  if (dom.ringsSlider && document.activeElement !== dom.ringsSlider) {
    dom.ringsSlider.value = String(s.rings);
  }
  if (dom.ringsVal) dom.ringsVal.textContent = `${s.rings} 圈`;

  if (dom.flipBtn) {
    dom.flipBtn.textContent = s.bottomFlip ? "下弧翻正：开" : "下弧翻正：关(倒立)";
    dom.flipBtn.classList.toggle("is-active", s.bottomFlip);
    dom.flipBtn.setAttribute("aria-pressed", String(s.bottomFlip));
  }
  if (dom.guidesBtn) {
    dom.guidesBtn.textContent = s.showGuides ? "标尺：显" : "标尺：隐";
    dom.guidesBtn.classList.toggle("is-active", s.showGuides);
    dom.guidesBtn.setAttribute("aria-pressed", String(s.showGuides));
  }

  dom.sceneBtns.forEach((b) => {
    const on = b.dataset.scene === s.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  dom.lawBtns.forEach((b) => {
    const on = b.dataset.law === s.law;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  dom.bridgeBtns.forEach((b) => {
    const on = b.dataset.bridge === s.bridges;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

function updateState(patch) {
  state = clampState({ ...state, ...patch });
  stage?.draw();
}

function applyFixStep() {
  if (currentFixPatch) {
    updateState(currentFixPatch);
    stage?.triggerPulse();
  } else {
    stage?.triggerPulse();
  }
}

function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  stage = createHeroStage(canvas, {
    getState: () => state,
    setState: (next) => {
      state = clampState(next);
    },
    onEvaluate: syncUI,
  });

  dom.ratioSlider?.addEventListener("input", () => {
    updateState({ ratio: parseFloat(dom.ratioSlider.value) });
  });
  dom.coreSlider?.addEventListener("input", () => {
    updateState({ corePct: parseInt(dom.coreSlider.value, 10) / 100 });
  });
  dom.ringsSlider?.addEventListener("input", () => {
    updateState({ rings: parseInt(dom.ringsSlider.value, 10) });
  });
  dom.flipBtn?.addEventListener("click", () => {
    updateState({ bottomFlip: !state.bottomFlip });
  });
  dom.guidesBtn?.addEventListener("click", () => {
    updateState({ showGuides: !state.showGuides });
  });
  dom.pulseBtn?.addEventListener("click", () => {
    stage?.triggerPulse();
  });
  dom.diagFixBtn?.addEventListener("click", applyFixStep);
  dom.mobFixBtn?.addEventListener("click", applyFixStep);

  dom.sceneBtns.forEach((b) => {
    b.addEventListener("click", () => updateState({ scene: b.dataset.scene }));
  });
  dom.lawBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const nextLaw = b.dataset.law;
      // 仅切换扩张律，保留其他设置让用户看清律动差异
      updateState({ law: nextLaw });
    });
  });
  dom.bridgeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      updateState({ bridges: b.dataset.bridge });
      stage?.triggerPulse();
    });
  });
  dom.presetBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const preset = PRESETS[b.dataset.preset];
      if (!preset) return;
      updateState(preset.patch);
      if (preset.kind === "good") stage?.triggerPulse();
    });
  });

  // 点左侧特质卡或右侧引线卡高亮对应圈层
  dom.traitCards.forEach((el) => {
    el.addEventListener("click", () => {
      const target = parseInt(el.dataset.ringTarget || "0", 10);
      const clamped = Math.min(state.rings, Math.max(0, target));
      updateState({ focusRing: state.focusRing === clamped ? -1 : clamped });
      if (clamped === 0) stage?.triggerPulse();
    });
  });
  dom.sideCards.forEach((el) => {
    el.addEventListener("click", () => {
      const target = parseInt(el.dataset.ringTarget || "2", 10);
      const clamped = Math.min(state.rings, Math.max(1, target));
      updateState({ focusRing: state.focusRing === clamped ? -1 : clamped });
    });
  });

  stage.draw();
}

initHero();
initSec01Growth();
initSec02ArcLab();
initSec03History();
initSec04Compare();
initSec05Avoid();
initSec06Quiz();
initSec07Lightbox();
