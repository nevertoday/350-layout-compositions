// 116 邻近性原则 · 主装配入口
import { createInitialState, PRESETS, diagnose, clamp } from "./model.js";
import { mountHeroStage } from "./hero-canvas.js";
import { initAllSections } from "./sections.js";

const state = createInitialState();
let stageSize = { W: 680, H: 460 };
let cachedDiag = diagnose(state, stageSize.W, stageSize.H);

// DOM 引用
const demoTitle = document.getElementById("page-title");
const diagBlock = document.getElementById("diag-block");
const diagTag = document.getElementById("diag-tag");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const mRatio = document.getElementById("m-ratio");
const mClusters = document.getElementById("m-clusters");
const mConf = document.getElementById("m-conf");

const rangeOuter = document.getElementById("range-outer");
const rangeInner = document.getElementById("range-inner");
const valOuter = document.getElementById("val-outer");
const valInner = document.getElementById("val-inner");

const caliperAxis = document.getElementById("caliper-axis");
const calKnob = document.getElementById("cal-knob");
const calReadout = document.getElementById("cal-readout");

const btnStray = document.getElementById("btn-stray");
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const colorBtns = [...document.querySelectorAll("[data-color]")];
const kwBtns = [...document.querySelectorAll("[data-inspect]")];

const ksCluster = document.getElementById("ks-cluster");
const ksDistance = document.getElementById("ks-distance");
const ksGrouping = document.getElementById("ks-grouping");
const ksHierarchy = document.getElementById("ks-hierarchy");

function syncUI() {
  cachedDiag = diagnose(state, stageSize.W, stageSize.H);
  const d = cachedDiag;
  const g = d.geom;

  // 1. 自示范大标题「邻近性  原则」随离合比实时聚散！
  // 均质态：字间全等；拉开后：词内收紧、词间推开
  const titleIn = (0.015 + state.innerGap * 0.12).toFixed(3);
  const titleOut = (0.02 + state.outerGap * 0.34).toFixed(3);
  demoTitle.style.setProperty("--title-in", `${titleIn}em`);
  demoTitle.style.setProperty("--title-out", `${titleOut}em`);

  // 2. 单真源白话诊单
  diagBlock.dataset.tone = d.tone;
  diagTag.textContent = d.badge;
  diagHead.textContent = d.headline;
  diagBody.textContent = d.body;
  diagHint.textContent = d.hint;

  mRatio.textContent = `${g.ratio.toFixed(2)}×`;
  mClusters.textContent = `${g.clusters} 块`;
  mConf.textContent = `${g.confidence}%`;

  // 3. 滑杆与竖向虚线卡尺
  const outerPct = Math.round(state.outerGap * 100);
  const innerPct = Math.round(state.innerGap * 100);
  rangeOuter.value = String(outerPct);
  rangeInner.value = String(innerPct);
  valOuter.textContent = `${outerPct}%`;
  valInner.textContent = `${innerPct}%`;

  calReadout.textContent = `组内 ${innerPct}%`;
  caliperAxis.setAttribute("aria-valuenow", String(innerPct));
  const isHorizCaliper = caliperAxis.getBoundingClientRect().width > caliperAxis.getBoundingClientRect().height;
  const knobPos = 14 + state.innerGap * 72;
  if (isHorizCaliper) {
    calKnob.style.left = `${knobPos}%`;
    calKnob.style.top = "50%";
  } else {
    calKnob.style.left = "50%";
    calKnob.style.top = `${knobPos}%`;
  }

  // 4. 底部原海报四关键词实时检核徽
  ksCluster.textContent = d.checks.cluster ? "呼吸稳" : g.minEdgeIn < 2 ? "挤撞" : "过散";
  ksDistance.textContent = `${g.ratio.toFixed(2)}×`;
  ksGrouping.textContent = d.checks.grouping ? `${d.targetGroups} 组清` : `${g.clusters} 块`;
  ksHierarchy.textContent = d.checks.hierarchy ? `${g.hierarchySpread.toFixed(2)}× 阶` : "平权";

  kwBtns.forEach((b) => {
    const k = b.dataset.inspect;
    b.dataset.ok = String(!!d.checks[k]);
    b.setAttribute("aria-pressed", String(state.inspectKey === k));
  });

  // 5. 题材与颜色切换按钮
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  colorBtns.forEach((b) => {
    const on = b.dataset.color === state.colorMode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  btnStray.setAttribute("aria-pressed", String(state.stray.active));
  btnStray.textContent = state.stray.active ? "收回游离点" : "放游离点";
  btnStray.hidden = state.scene !== "poster";
}

const heroStage = mountHeroStage(
  document.getElementById("hero-canvas"),
  () => state,
  () => cachedDiag,
  {
    onSizeChange(W, H) {
      stageSize = { W, H };
      syncUI();
    },
    onDragGaps(nextOuter, nextInner) {
      state.outerGap = clamp(nextOuter, 0, 1);
      state.innerGap = clamp(nextInner, 0, 1);
      syncUI();
      heroStage.invalidate();
    },
    onGroupClick(g) {
      state.hierarchy[g] = ((state.hierarchy[g] ?? 1) + 1) % 3;
      syncUI();
      heroStage.invalidate();
    },
    onStrayMove(u, v) {
      state.stray.u = u;
      state.stray.v = v;
      syncUI();
      heroStage.invalidate();
    },
  }
);

// 滑杆绑定
rangeOuter.addEventListener("input", () => {
  state.outerGap = Number(rangeOuter.value) / 100;
  syncUI();
  heroStage.invalidate();
});

rangeInner.addEventListener("input", () => {
  state.innerGap = Number(rangeInner.value) / 100;
  syncUI();
  heroStage.invalidate();
});

// 原海报双向虚线距离卡尺直拖 + 键盘支持
let calDrag = false;
function updateCaliperFromClient(clientX, clientY) {
  const r = caliperAxis.getBoundingClientRect();
  const horiz = r.width > r.height;
  const t = horiz ? (clientX - r.left) / Math.max(1, r.width) : (clientY - r.top) / Math.max(1, r.height);
  state.innerGap = clamp((t - 0.1) / 0.8, 0, 1);
  syncUI();
  heroStage.invalidate();
}

caliperAxis.addEventListener("pointerdown", (e) => {
  calDrag = true;
  caliperAxis.setPointerCapture(e.pointerId);
  updateCaliperFromClient(e.clientX, e.clientY);
});
caliperAxis.addEventListener("pointermove", (e) => {
  if (calDrag) updateCaliperFromClient(e.clientX, e.clientY);
});
caliperAxis.addEventListener("pointerup", () => (calDrag = false));
caliperAxis.addEventListener("pointercancel", () => (calDrag = false));
caliperAxis.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    state.innerGap = clamp(state.innerGap + 0.06, 0, 1);
    syncUI();
    heroStage.invalidate();
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    state.innerGap = clamp(state.innerGap - 0.06, 0, 1);
    syncUI();
    heroStage.invalidate();
  }
});

// 题材与颜色切换
sceneBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.scene = b.dataset.scene;
    if (state.scene !== "poster") state.stray.active = false;
    syncUI();
    heroStage.invalidate();
  });
});

colorBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.colorMode = b.dataset.color;
    syncUI();
    heroStage.invalidate();
  });
});

// 四关键词检视按钮
kwBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const k = b.dataset.inspect;
    state.inspectKey = state.inspectKey === k ? null : k;
    syncUI();
    heroStage.invalidate();
  });
});

// 快捷动作
function applyPreset(p) {
  state.outerGap = p.outerGap;
  state.innerGap = p.innerGap;
  state.hierarchy = [...p.hierarchy];
  state.colorMode = p.colorMode;
  state.stray = { ...p.stray };
  syncUI();
  heroStage.invalidate();
}

document.getElementById("btn-poster").addEventListener("click", () => applyPreset(PRESETS.poster));
document.getElementById("btn-invert").addEventListener("click", () => applyPreset(PRESETS.inverted));
document.getElementById("btn-reset").addEventListener("click", () => applyPreset(PRESETS.broken));
btnStray.addEventListener("click", () => {
  state.stray.active = !state.stray.active;
  if (state.stray.active) {
    // 放进中线尴尬区，并确保画布处于清晰分组与呼吸状态，使游离点现象立刻凸显
    if (state.outerGap < 0.60) state.outerGap = 0.78;
    if (state.innerGap < 0.36 || state.innerGap > 0.72) state.innerGap = 0.44;
    state.stray.u = 0.43;
    state.stray.v = 0.54;
  }
  syncUI();
  heroStage.invalidate();
});

window.addEventListener("resize", syncUI);

// 启动全部正文交互与初始渲染
stageSize = heroStage.getSize();
syncUI();
heroStage.invalidate();
initAllSections();
