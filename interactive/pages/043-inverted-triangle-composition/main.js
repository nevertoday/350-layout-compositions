// 043 倒三角构图 · 主入口（单真源同步刊头翼线、三列舞台、底部规格舱与全部七节交互）

import { loop } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, evaluate, clamp } from "./model.js";
import { createHeroStage } from "./hero-canvas.js";
import {
  initCompareWidget,
  initAnatomyWidget,
  initLineageWidget,
  initAppsWidget,
  initAntiPatternWidget,
  initQuizWidget,
  initLightbox,
} from "./widgets.js";

const state = { ...INITIAL_STATE };
let currentEval = evaluate(state);

const canvas = document.getElementById("hero-canvas");
const crownWingLine = document.getElementById("crown-wing-line");
const statusPill = document.getElementById("hero-status-pill");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagDetail = document.getElementById("diag-detail");
const diagHint = document.getElementById("diag-hint");
const diagFixBtn = document.getElementById("diag-fix-btn");
const mqdHeadline = document.getElementById("mqd-headline");
const mqdFixBtn = document.getElementById("mqd-fix-btn");
const stageHint = document.getElementById("stage-hint");

const mRatio = document.getElementById("m-ratio");
const mAngle = document.getElementById("m-angle");
const mCentroid = document.getElementById("m-centroid");
const mTier = document.getElementById("m-tier");

const slTop = document.getElementById("sl-top");
const slMouth = document.getElementById("sl-mouth");
const slApex = document.getElementById("sl-apex");
const slHorizon = document.getElementById("sl-horizon");
const valTop = document.getElementById("val-top");
const valMouth = document.getElementById("val-mouth");
const valApex = document.getElementById("val-apex");
const valHorizon = document.getElementById("val-horizon");
const toggleGuides = document.getElementById("toggle-guides");

const coEls = {
  openness: document.getElementById("co-openness"),
  guidance: document.getElementById("co-guidance"),
  focus: document.getElementById("co-focus"),
};
const msEls = {
  guidance: document.getElementById("ms-tension"),
  focus: document.getElementById("ms-contrast"),
  openness: document.getElementById("ms-openness"),
  balance: document.getElementById("ms-balance"),
};

let ticker = null;

function syncUI() {
  const ev = currentEval;
  const s = ev.state;
  const m = ev.metrics;

  // 刊头自示范倒梯翼：平口散框时双翼几乎竖直，收束为倒三角时自然向内折拢成原海报经典倒梯翼
  const inset = clamp(36 + Math.max(0, m.convergeDeg) * 1.15, 34, 132);
  crownWingLine.setAttribute("points", `${inset.toFixed(1)},108 32,3 888,3 ${(920 - inset).toFixed(1)},108`);

  // 顶部与诊单状态胶囊
  statusPill.textContent = ev.badgeText;
  statusPill.classList.toggle("is-ok", ev.ok);
  statusPill.classList.toggle("is-fault", !ev.ok);

  diagBadge.textContent = ev.badgeText;
  diagBadge.classList.toggle("is-ok", ev.ok);
  diagHeadline.textContent = ev.headline;
  diagDetail.textContent = ev.detail;
  diagHint.textContent = ev.hint;
  mqdHeadline.textContent = ev.headline;
  if (stageHint) {
    stageHint.textContent = ev.ok
      ? "可继续拖动底部发光落点测试偏心倾覆，或拉动双翼感受不同收束张力"
      : "向右横拖画布收束倒三角 · 拖顶角调展翼 · 拖底点校重心 · 拖水线留呼吸";
  }

  if (ev.fixPatch) {
    diagFixBtn.hidden = false;
    diagFixBtn.textContent = ev.fixLabel;
    mqdFixBtn.hidden = false;
    mqdFixBtn.textContent = ev.fixShort || "一键纠偏";
  } else {
    diagFixBtn.hidden = true;
    mqdFixBtn.hidden = true;
  }

  // 四格单真源实测读数
  mRatio.textContent = `${m.upperLowerRatio.toFixed(2)}×`;
  mAngle.textContent = `${m.convergeDeg}°`;
  mCentroid.textContent = `${m.centroidHeightPct}%`;
  mTier.textContent = ev.tierLabel;

  // 左侧三条青色虚线标注实时同步
  for (const key of ["openness", "guidance", "focus"]) {
    const p = ev.pillars[key];
    coEls[key].textContent = p.tag;
    const item = coEls[key].closest(".callout-item");
    item.classList.toggle("is-ok", p.ok);
    item.classList.toggle("is-fault", !p.ok);
  }

  // 右侧四枚圆形徽章实时同步
  for (const key of ["guidance", "focus", "openness", "balance"]) {
    const p = ev.pillars[key];
    msEls[key].textContent = p.tag;
    const item = msEls[key].closest(".medal-item");
    item.classList.toggle("is-ok", p.ok);
    item.classList.toggle("is-fault", !p.ok);
  }

  // 滑轨与数值同步
  slTop.value = String(m.topSpanPct);
  slMouth.value = String(m.mouthPct);
  slApex.value = String(Math.round(s.apexX * 100));
  slHorizon.value = String(Math.round(s.horizonY * 100));
  valTop.textContent = `${m.topSpanPct}%`;
  valMouth.textContent = m.mouthPct === 0 ? "收尖 0%" : `${m.mouthPct}%`;
  valApex.textContent = m.plumbOffsetPct === 0 ? "居中 0%" : `${m.plumbOffsetPct < 0 ? "偏左" : "偏右"} ${m.absPlumb}%`;
  valHorizon.textContent = `${m.headroomPct}%`;

  // 场景按钮、落点强度按钮、参考线按钮同步
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.scene === s.scene);
  });
  document.querySelectorAll("[data-anchor]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.anchor === s.anchorLevel);
  });
  toggleGuides.setAttribute("aria-pressed", String(s.showGuides));
  toggleGuides.textContent = `参考线：${s.showGuides ? "开" : "关"}`;
}

function patchState(patch) {
  Object.assign(state, patch);
  currentEval = evaluate(state);
  Object.assign(state, currentEval.state);
  syncUI();
  if (ticker) ticker.draw();
}

const stage = createHeroStage(canvas, {
  getState: () => ({ state, eval: currentEval }),
  onChange: (patch) => patchState(patch),
  onSelectZone: () => {},
});

// 由 lib/stage.js 驱动省电渲染循环：离屏/隐藏自动暂停，reducedMotion 时画完整静止帧
ticker = loop(canvas, (t, _dt, { still }) => {
  stage.draw(t, currentEval, { still });
});

// 滑轨事件
slTop.addEventListener("input", () => patchState({ topSpan: Number(slTop.value) / 100 }));
slMouth.addEventListener("input", () => patchState({ bottomMouth: Number(slMouth.value) / 100 }));
slApex.addEventListener("input", () => patchState({ apexX: Number(slApex.value) / 100 }));
slHorizon.addEventListener("input", () => patchState({ horizonY: Number(slHorizon.value) / 100 }));

// 一键纠偏（桌面诊单 + 手机快诊单共用同一单真源 fixPatch）
const applyFix = () => {
  if (currentEval.fixPatch) patchState(currentEval.fixPatch);
};
diagFixBtn.addEventListener("click", applyFix);
mqdFixBtn.addEventListener("click", applyFix);

// 左侧三条引注点击即可针对该维度直接纠偏或体验
document.querySelectorAll(".callout-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.callout;
    if (key === "openness") patchState({ topSpan: Math.max(state.topSpan, 0.76), horizonY: 0.45 });
    else if (key === "guidance") patchState({ topSpan: 0.76, bottomMouth: 0.0 });
    else if (key === "focus") patchState({ bottomMouth: 0.0, apexX: 0.50, anchorLevel: "focus" });
  });
});

// 场景切签、落点光影、预设按钮、参考线开关
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => patchState({ scene: btn.dataset.scene }));
});
document.querySelectorAll("[data-anchor]").forEach((btn) => {
  btn.addEventListener("click", () => patchState({ anchorLevel: btn.dataset.anchor }));
});
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) patchState(p.state);
  });
});
toggleGuides.addEventListener("click", () => patchState({ showGuides: !state.showGuides }));

// 画布键盘操作（←/→ 调收束与展翼，↑/↓ 调吃水留白，[/] 调底部落点横位）
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    patchState({
      topSpan: clamp(state.topSpan + 0.04, 0.14, 0.90),
      bottomMouth: clamp(state.bottomMouth - 0.06, 0.0, 0.68),
    });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    patchState({
      topSpan: clamp(state.topSpan - 0.04, 0.14, 0.90),
      bottomMouth: clamp(state.bottomMouth + 0.06, 0.0, 0.68),
    });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    patchState({ horizonY: clamp(state.horizonY - 0.02, 0.27, 0.64) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    patchState({ horizonY: clamp(state.horizonY + 0.02, 0.27, 0.64) });
  } else if (e.key === "[") {
    e.preventDefault();
    patchState({ apexX: clamp(state.apexX - 0.025, 0.22, 0.78) });
  } else if (e.key === "]") {
    e.preventDefault();
    patchState({ apexX: clamp(state.apexX + 0.025, 0.22, 0.78) });
  }
});

// 初始化首次同步与 01–07 全部交互组件
syncUI();
ticker.draw();
initCompareWidget();
initAnatomyWidget();
initLineageWidget();
initAppsWidget();
initAntiPatternWidget();
initQuizWidget();
initLightbox();
