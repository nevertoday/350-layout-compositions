// 049 弧形构图 · 页面总入口（单真源同步 + 轻量脏值更新保 60fps）
import { reducedMotion } from "../../lib/stage.js";
import { CONTINUITY_MODES, INITIAL_STATE, PRESETS, evaluateArc } from "./model.js";
import { createHeroStage } from "./stage-hero.js";
import {
  initAntiCasesLab,
  initAppRhythmLab,
  initAssociationLab,
  initOrientationCompass,
  initOriginsDeck,
  initPosterLightbox,
  initQuiz,
} from "./labs.js";

const state = {
  ...INITIAL_STATE,
  focus: { ...INITIAL_STATE.focus },
};

// 缓存 DOM 节点与上次渲染值，拖拽期间绝不重复重写未变化文本，确保慢手机 60fps
const dom = {
  canvas: document.getElementById("hero-canvas"),
  hudMetrics: document.getElementById("hud-metrics"),
  hudStatus: document.getElementById("hud-status"),
  hudTip: document.getElementById("hud-tip"),
  titleArcPath: document.getElementById("title-live-arc"),
  titleArcDot: document.getElementById("title-live-dot"),
  mobileBadge: document.getElementById("mobile-status-badge"),
  verdictBadge: document.getElementById("verdict-badge"),
  verdictTitle: document.getElementById("verdict-title"),
  verdictDetail: document.getElementById("verdict-detail"),
  verdictHint: document.getElementById("verdict-hint"),
  fixBtn: document.getElementById("btn-quick-fix"),
  cometBtn: document.getElementById("btn-launch-comet"),
  mSweep: document.getElementById("m-sweep"),
  mSpan: document.getElementById("m-span"),
  mCradle: document.getElementById("m-cradle"),
  mTaper: document.getElementById("m-taper"),
  mPosture: document.getElementById("m-posture"),
  inBulge: document.getElementById("in-bulge"),
  inBulgeVal: document.getElementById("in-bulge-val"),
  inSpan: document.getElementById("in-span"),
  inSpanVal: document.getElementById("in-span-val"),
  inTaper: document.getElementById("in-taper"),
  inTaperVal: document.getElementById("in-taper-val"),
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  modeBtns: [...document.querySelectorAll("[data-continuity]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  kwBtns: [...document.querySelectorAll("[data-kw-layer]")],
  probeCards: new Map([...document.querySelectorAll("[data-probe-key]")].map((el) => [
    el.dataset.probeKey,
    { el, tag: el.querySelector(".probe-tag") },
  ])),
};

const prev = new Map();
function setText(key, el, text) {
  if (!el || prev.get(key) === text) return;
  prev.set(key, text);
  el.textContent = text;
}
function setAttr(key, el, attr, val) {
  if (!el || prev.get(key) === val) return;
  prev.set(key, val);
  el.setAttribute(attr, val);
}

let currentFixPatch = null;

function syncUI() {
  const ev = evaluateArc(state);
  const { geo } = ev;

  // 1. 标题下方自示范杏桃活弧：弯度实时跟着主弧呼应！
  const arcRise = Math.max(-12, Math.min(20, Math.round(state.bulge * 18)));
  const kinkTop = 22 - Math.max(8, Math.abs(arcRise));
  const dStr = state.continuity === "kinked"
    ? `M 4 22 L 88 22 L 114 ${kinkTop} L 146 ${kinkTop} L 172 22 L 252 22`
    : `M 4 24 Q 130 ${24 - arcRise} 252 20`;
  setAttr("title-arc-d", dom.titleArcPath, "d", dStr);
  setAttr("title-arc-dash", dom.titleArcPath, "stroke-dasharray", state.continuity === "dashed" ? "8 9" : "none");
  setAttr("title-dot-cy", dom.titleArcDot, "cy", state.continuity === "kinked" ? "22" : "20");

  // 2. 状态徽标与深靛 TIPS 单真源诊单（含画布叠层 HUD 胶囊）
  const tone = ev.ok ? "ok" : "err";
  const tipMap = {
    kinked: "× 中段硬折 · 下方切「粗细韵律」并横拖弯弧",
    dashed: "× 断续割裂 · 切回连贯主弧",
    flat: "← 横拖大弧拉出 55°–155° 自然弯度 →",
    closed: "× 过弯封口 · 回拉松开包角",
    sliced: "× 弧脊斩焦 · 把焦点拖进凹侧弯心",
    convex: "× 凸背弹飞 · 把焦点拖过弧线进凹侧",
    edge: "× 焦点出窝 · 拖回弯心怀抱区",
    short: "× 跨幅局促 · 拖弧尖拉展至 ≥58%",
    uniform: "× 均粗呆板 · 调高收锋比出节奏",
  };
  setText("hud-m", dom.hudMetrics, `包角 ${geo.sweepDeg}° · 跨幅 ${geo.spanPct}% · 收锋 ${ev.taperRatio.toFixed(1)}×`);
  setText("hud-s", dom.hudStatus, ev.shortBadge);
  setAttr("hud-st", dom.hudStatus, "data-tone", tone);
  if (dom.hudTip) {
    if (dom.hudTip.hidden !== ev.ok) dom.hudTip.hidden = ev.ok;
    if (!ev.ok) setText("hud-t", dom.hudTip, tipMap[ev.primaryCode] || "横拖弯曲大弧");
  }
  setText("mob-badge", dom.mobileBadge, ev.shortBadge);
  setAttr("mob-tone", dom.mobileBadge, "data-tone", tone);
  setText("v-badge", dom.verdictBadge, ev.shortBadge);
  setAttr("v-tone", dom.verdictBadge, "data-tone", tone);
  setText("v-title", dom.verdictTitle, ev.headline);
  setText("v-detail", dom.verdictDetail, ev.detail);
  setText("v-hint", dom.verdictHint, ev.actionHint);

  currentFixPatch = ev.fixAction ? ev.fixAction.patch : null;
  if (dom.fixBtn) {
    const showFix = !!ev.fixAction;
    if (dom.fixBtn.hidden !== !showFix) dom.fixBtn.hidden = !showFix;
    if (showFix) setText("fix-label", dom.fixBtn, ev.fixAction.label);
  }

  // 3. 四枚实测单真源读数 + 态势档位
  setText("m-sweep", dom.mSweep, `${geo.sweepDeg}°`);
  setText("m-span", dom.mSpan, `${geo.spanPct}%`);
  setText("m-cradle", dom.mCradle, ev.cradleLabel);
  setText("m-taper", dom.mTaper, `${ev.taperRatio.toFixed(1)}×`);
  setText("m-posture", dom.mPosture, ev.posture);

  // 4. 滑杆数值同步
  const bulgeStr = String(Math.round(state.bulge * 100));
  if (dom.inBulge && dom.inBulge.value !== bulgeStr) dom.inBulge.value = bulgeStr;
  setText("in-bulge-v", dom.inBulgeVal, `${geo.sweepDeg}°${state.bulge < 0 ? "（下凹）" : "（上拱）"}`);

  const spanStr = String(Math.round(state.span * 100));
  if (dom.inSpan && dom.inSpan.value !== spanStr) dom.inSpan.value = spanStr;
  setText("in-span-v", dom.inSpanVal, `${geo.spanPct}%`);

  const taperStr = String(Math.round(state.taper * 100));
  if (dom.inTaper && dom.inTaper.value !== taperStr) dom.inTaper.value = taperStr;
  setText("in-taper-v", dom.inTaperVal, `${ev.taperRatio.toFixed(1)}×`);

  // 5. 右侧五枚弧形错列圆徽探针
  for (const p of ev.probes) {
    const card = dom.probeCards.get(p.key);
    if (!card) continue;
    setAttr(`p-ok-${p.key}`, card.el, "data-state", p.ok ? "ok" : "err");
    setAttr(`p-hl-${p.key}`, card.el, "data-active", state.highlightLayer === p.key ? "true" : "false");
    setText(`p-tag-${p.key}`, card.tag, p.tag);
  }

  // 6. 按钮按下态同步
  for (const btn of dom.sceneBtns) {
    setAttr(`sc-${btn.dataset.scene}`, btn, "aria-pressed", String(btn.dataset.scene === state.scene));
  }
  for (const btn of dom.modeBtns) {
    setAttr(`md-${btn.dataset.continuity}`, btn, "aria-pressed", String(btn.dataset.continuity === state.continuity));
  }
  for (const btn of dom.kwBtns) {
    setAttr(`kw-${btn.dataset.kwLayer}`, btn, "aria-pressed", String(btn.dataset.kwLayer === state.highlightLayer));
  }
}

function applyPatch(patch) {
  if (patch.focus) {
    state.focus = { ...state.focus, ...patch.focus };
  }
  for (const [k, v] of Object.entries(patch)) {
    if (k !== "focus") state[k] = v;
  }
  syncUI();
  heroStage.markDirty();
  if (reducedMotion.matches) heroStage.draw();
}

const heroStage = createHeroStage(
  dom.canvas,
  () => state,
  applyPatch,
  () => {
    if (dom.cometBtn) dom.cometBtn.textContent = "放行视线流";
  },
);

// 绑定场景切签
for (const btn of dom.sceneBtns) {
  btn.addEventListener("click", () => applyPatch({ scene: btn.dataset.scene }));
}

// 绑定四态 TIPS 连续性切签（对应原海报底沿 ✓ ✓ × ×）
for (const btn of dom.modeBtns) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.continuity;
    if (!CONTINUITY_MODES[mode]) return;
    const patch = { continuity: mode };
    if (mode === "taper" && state.taper < 2.2) patch.taper = 2.6;
    if (mode === "smooth" && state.taper < 1.5) patch.taper = 1.75;
    if (mode === "kinked") patch.taper = 1.05;
    applyPatch(patch);
  });
}

// 绑定多组合法解与双向试错按钮
for (const btn of dom.presetBtns) {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    applyPatch({ ...p.patch, focus: { ...p.patch.focus } });
  });
}

// 绑定左侧五枚深靛胶囊词与右侧五枚圆徽联动高亮
function toggleLayer(layer) {
  applyPatch({ highlightLayer: state.highlightLayer === layer ? null : layer });
}
for (const btn of dom.kwBtns) {
  btn.addEventListener("click", () => toggleLayer(btn.dataset.kwLayer));
}
for (const [key, { el }] of dom.probeCards.entries()) {
  el.addEventListener("click", () => toggleLayer(key));
}

// 绑定精控滑杆
dom.inBulge?.addEventListener("input", () => {
  applyPatch({ bulge: Number((Number(dom.inBulge.value) / 100).toFixed(2)) });
});
dom.inSpan?.addEventListener("input", () => {
  applyPatch({ span: Number((Number(dom.inSpan.value) / 100).toFixed(2)) });
});
dom.inTaper?.addEventListener("input", () => {
  const tVal = Number((Number(dom.inTaper.value) / 100).toFixed(2));
  const patch = { taper: tVal };
  if (tVal >= 1.5 && state.continuity === "kinked") patch.continuity = "taper";
  applyPatch(patch);
});

// 一键纠偏与放行视线光彗
dom.fixBtn?.addEventListener("click", () => {
  if (currentFixPatch) {
    applyPatch(currentFixPatch.focus ? { ...currentFixPatch, focus: { ...currentFixPatch.focus } } : currentFixPatch);
  }
});
dom.cometBtn?.addEventListener("click", () => {
  dom.cometBtn.textContent = "视线滑行中…";
  heroStage.launchComet();
});

// 全局快捷键：仅在非输入态且英雄舞台在视口内按空格演播视线流
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement === document.body) {
    const r = dom.canvas.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      e.preventDefault();
      dom.cometBtn.textContent = "视线滑行中…";
      heroStage.launchComet();
    }
  }
});

// 初始化首次状态与 01–07 节互动台
syncUI();
heroStage.draw();
initAssociationLab();
initOrientationCompass();
initOriginsDeck();
initAppRhythmLab();
initAntiCasesLab();
initQuiz();
initPosterLightbox();
