// 054 离心式构图 · 入口主控脚本（严格单真源同步）
import { BROKEN_STATE, PRESETS, createInitialState, evaluateState } from "./model.js";
import { initHeroStage } from "./hero.js";
import { initAnatomy, initCousinCompare, initHistory, initAppShowcase, initAntiPatterns, initQuiz, initPosterLightbox } from "./sections.js";

const state = createInitialState();

const heroCanvas = document.getElementById("hero-canvas");
const statusChips = [...document.querySelectorAll("[data-status-chip]")];
const tabBtns = [...document.querySelectorAll("[data-scenario]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const resetBrokenBtns = [...document.querySelectorAll("[data-reset-broken]")];
const pulseBtns = [...document.querySelectorAll("[data-pulse]")];
const guidesBtn = document.getElementById("btn-guides");
const calmOuterBtn = document.getElementById("btn-calm-outer");

const rImpulse = document.getElementById("range-impulse");
const rImpulseQuick = document.getElementById("range-impulse-quick");
const rDecay = document.getElementById("range-decay");
const rAnchor = document.getElementById("range-anchor");
const rRhythm = document.getElementById("range-rhythm");

const valImpulseEls = [...document.querySelectorAll("[data-val-impulse]")];
const valDecayEl = document.getElementById("val-decay");
const valAnchorEl = document.getElementById("val-anchor");
const valRhythmEl = document.getElementById("val-rhythm");

const diagBox = document.getElementById("diag-box");
const diagTier = document.getElementById("diag-tier");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagNext = document.getElementById("diag-next");

const mobileQuick = document.getElementById("mobile-quick");
const mqVerdict = document.getElementById("mq-verdict");
const mqSub = document.getElementById("mq-sub");

let heroCtrl = null;
let activePresetKey = null;

// 差量 DOM 写入，避免拖动时每帧触发无意义的 DOM 重排（优化慢手机与软件渲染帧率）
const setText = (el, txt) => { if (el && el.textContent !== txt) el.textContent = txt; };
const setVal = (el, val) => { const s = String(val); if (el && el.value !== s) el.value = s; };
const setToggle = (el, cls, on) => { if (el && el.classList.contains(cls) !== on) el.classList.toggle(cls, on); };

// 预缓存探针与圆徽节点
const probeNodes = new Map();
for (const li of document.querySelectorAll("[data-probe]")) {
  probeNodes.set(li.dataset.probe, { li, badge: li.querySelector(".probe-badge") });
}
const badgeNodes = new Map();
for (const box of document.querySelectorAll("[data-badge]")) {
  badgeNodes.set(box.dataset.badge, { box, metric: box.querySelector(".kw-metric") });
}

function syncUI() {
  const size = heroCtrl ? heroCtrl.getSize() : { w: 880, h: 560 };
  const audit = evaluateState(state, size.w, size.h);

  // 1. 顶部与移动端状态胶囊
  for (const el of statusChips) {
    setText(el, audit.shortTag);
    setToggle(el, "is-pass", audit.isPass);
    setToggle(el, "is-bad", !audit.isPass);
  }

  // 2. 滑轨数值与滑块位置
  setVal(rImpulse, state.impulse);
  setVal(rImpulseQuick, state.impulse);
  setVal(rDecay, state.decay);
  setVal(rAnchor, state.anchorSize);
  setVal(rRhythm, state.rhythm);

  const impTxt = `${state.impulse}%`;
  for (const el of valImpulseEls) setText(el, impTxt);
  setText(valDecayEl, `${state.decay >= 0 ? "+" : ""}${state.decay}%`);
  setText(valAnchorEl, `${state.anchorSize}%`);
  setText(valRhythmEl, `${state.rhythm}%`);

  // 3. 语境切签与轨道线开关
  for (const b of tabBtns) {
    const active = b.dataset.scenario === state.scenario;
    setToggle(b, "is-active", active);
    if (b.getAttribute("aria-pressed") !== String(active)) b.setAttribute("aria-pressed", String(active));
  }
  if (guidesBtn) {
    setText(guidesBtn, `轨道线：${state.guides ? "开" : "关"}`);
    if (guidesBtn.getAttribute("aria-pressed") !== String(state.guides)) {
      guidesBtn.setAttribute("aria-pressed", String(state.guides));
    }
  }

  // 4. 预设药丸高亮
  for (const b of presetBtns) {
    if (b.classList.contains("chip-btn")) {
      setToggle(b, "is-active", b.dataset.preset === activePresetKey);
    }
  }

  // 5. 底部原海报钴蓝圆角灯泡诊单匣
  setToggle(diagBox, "is-pass", audit.isPass);
  setToggle(diagBox, "is-bad", !audit.isPass);
  setText(diagTier, audit.tierLabel);
  setText(diagHeadline, audit.headline);
  setText(diagWhy, audit.why);
  setText(diagNext, audit.next);

  if (calmOuterBtn) {
    const n = audit.metrics.heavyRebelCount;
    setText(calmOuterBtn, n > 0 ? `卸除喧宾黑块 (${n})` : "喧宾黑块已清零 ✓");
    if (calmOuterBtn.disabled !== (n === 0)) calmOuterBtn.disabled = n === 0;
  }

  // 6. 手机端折线内快捷诊单
  setToggle(mobileQuick, "is-pass", audit.isPass);
  setToggle(mobileQuick, "is-bad", !audit.isPass);
  setText(mqVerdict, audit.headline);
  setText(mqSub, audit.next);

  // 7. 左翼 5 条原海报要点实时活体探针
  for (const p of audit.probes) {
    const node = probeNodes.get(p.id);
    if (!node) continue;
    setToggle(node.li, "is-ok", p.ok);
    setToggle(node.li, "is-bad", !p.ok);
    setText(node.badge, p.badge);
  }

  // 8. 底部 4 枚原海报实心彩色圆徽实时读数
  for (const b of audit.badges) {
    const node = badgeNodes.get(b.id);
    if (!node) continue;
    setToggle(node.box, "is-ok", b.ok);
    setToggle(node.box, "is-bad", !b.ok);
    setText(node.metric, b.metric);
  }
}

let uiQueued = false;
function scheduleSyncUI() {
  if (uiQueued) return;
  uiQueued = true;
  requestAnimationFrame(() => {
    uiQueued = false;
    syncUI();
  });
}

function updateState(patch, { presetKey = null, fromCanvas = false } = {}) {
  Object.assign(state, patch);
  if (patch.heavyOuter) state.heavyOuter = [...patch.heavyOuter];
  activePresetKey = presetKey;
  if (fromCanvas) scheduleSyncUI();
  else syncUI();
  heroCtrl?.markDirty();
}

// 初始化开场离心抛射实验盘
if (heroCanvas) {
  heroCtrl = initHeroStage(heroCanvas, () => state, (patch, opts) => updateState(patch, opts));
}

// 绑定语境切签
for (const b of tabBtns) {
  b.addEventListener("click", () => {
    updateState({ scenario: b.dataset.scenario }, { presetKey: activePresetKey });
  });
}

// 绑定四条滑轨
const onImpulseInput = (val) => {
  const v = Number(val);
  // 顺带微调双主箭伸展以保证手感直觉，用户随后仍可单独拖箭锋
  const reach = Math.round(Math.max(30, Math.min(104, 24 + v * 0.98)));
  updateState({ impulse: v, redReach: reach, blueReach: Math.max(28, reach - 2) });
};
rImpulse?.addEventListener("input", () => onImpulseInput(rImpulse.value));
rImpulseQuick?.addEventListener("input", () => onImpulseInput(rImpulseQuick.value));
rDecay?.addEventListener("input", () => updateState({ decay: Number(rDecay.value) }));
rAnchor?.addEventListener("input", () => updateState({ anchorSize: Number(rAnchor.value) }));
rRhythm?.addEventListener("input", () => updateState({ rhythm: Number(rRhythm.value) }));

// 绑定预设与复原
for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const key = b.dataset.preset;
    const p = PRESETS[key];
    if (!p) return;
    updateState(
      {
        impulse: p.impulse,
        decay: p.decay,
        anchorSize: p.anchorSize,
        rhythm: p.rhythm,
        redReach: p.redReach,
        blueReach: p.blueReach,
        axisSplit: p.axisSplit,
        heavyOuter: [...p.heavyOuter],
        guides: p.guides
      },
      { presetKey: key }
    );
  });
}

for (const b of resetBrokenBtns) {
  b.addEventListener("click", () => {
    updateState({
      ...BROKEN_STATE,
      scenario: state.scenario,
      heavyOuter: [...BROKEN_STATE.heavyOuter]
    });
  });
}

calmOuterBtn?.addEventListener("click", () => {
  updateState({ heavyOuter: [] });
});

guidesBtn?.addEventListener("click", () => {
  updateState({ guides: !state.guides }, { presetKey: activePresetKey });
});

for (const b of pulseBtns) {
  b.addEventListener("click", () => heroCtrl?.triggerPulse());
}

// 键盘操作：Space 发射冲量，方向键微调推力与衰减（不抢输入框、灯箱或正文滚动焦点）
window.addEventListener("keydown", (e) => {
  const modal = document.getElementById("poster-modal");
  if (modal && !modal.hidden) return;
  const active = document.activeElement;
  const tag = (active?.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const onHero = active === heroCanvas || window.scrollY < 420;
  if (!onHero) return;

  if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
    e.preventDefault();
    heroCtrl?.triggerPulse();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    onImpulseInput(Math.min(100, state.impulse + 4));
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    onImpulseInput(Math.max(6, state.impulse - 4));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    updateState({ decay: Math.min(100, state.decay + 6) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    updateState({ decay: Math.max(-60, state.decay - 6) });
  }
});

// 初始化正文七节与灯箱
syncUI();
initAnatomy();
initCousinCompare();
initHistory();
initAppShowcase();
initAntiPatterns();
initQuiz();
initPosterLightbox();
