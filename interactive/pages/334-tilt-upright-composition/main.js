// 334 欲正关系构图（敧正关系构图）——主入口，统一由 model.js 单真源驱动全页状态

import { INITIAL_STATE, PRESETS, LIMITS, clamp, evaluate } from "./model.js";
import { mountHeroStage } from "./stage-canvas.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initPosterLightbox,
} from "./sections.js";

const state = { ...INITIAL_STATE };

const canvas = document.getElementById("hero-canvas");
const tiltWord = document.getElementById("hero-tilt-word");
const degReadout = document.getElementById("hero-deg-readout");
const statusPill = document.getElementById("hero-status-pill");
const sceneCap = document.getElementById("hero-scene-cap");

const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagAction = document.getElementById("diag-action");
const diagFixBtn = document.getElementById("diag-fix-btn");

const mTilt = document.getElementById("m-tilt");
const mDelta = document.getElementById("m-delta");
const mWeight = document.getElementById("m-weight");
const mSupport = document.getElementById("m-support");

const ctrlTilt = document.getElementById("ctrl-tilt");
const ctrlTiltVal = document.getElementById("ctrl-tilt-val");
const ctrlBall = document.getElementById("ctrl-ball");
const ctrlBallVal = document.getElementById("ctrl-ball-val");
const ctrlWeight = document.getElementById("ctrl-weight");
const ctrlWeightVal = document.getElementById("ctrl-weight-val");

const btnUprightSkew = document.getElementById("btn-upright-skew");
const btnVectors = document.getElementById("btn-vectors");
const btnScan = document.getElementById("btn-scan");

const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const pillarItems = [...document.querySelectorAll("[data-pillar]")];
const formulaItems = [...document.querySelectorAll("[data-formula]")];

let stageCtrl = null;
let currentFixState = null;

function syncUI() {
  const ev = evaluate(state);
  const g = ev.geometry;

  // 1) 顶部自示范标题随斜碑倾角做克制联动倾斜（限制 ±10° 以防裁切溢出）
  if (tiltWord) {
    const titleDeg = clamp(g.tiltDeg * 0.28, -9, 10);
    tiltWord.style.transform = `rotate(${titleDeg.toFixed(1)}deg)`;
  }
  if (degReadout) {
    degReadout.textContent = `${g.tiltDeg > 0 ? "+" : ""}${Math.round(g.tiltDeg)}°`;
  }
  if (statusPill) {
    statusPill.textContent = ev.badge;
    statusPill.dataset.ok = String(ev.ok);
  }

  // 2) 左侧原海报五枚黑圆徽 + 底沿五项公式条同步单真源实况
  for (const item of pillarItems) {
    const key = item.dataset.pillar;
    const p = ev.pillars[key];
    if (!p) continue;
    item.dataset.ok = String(p.ok);
    const tag = item.querySelector(".pillar-tag");
    if (tag) tag.textContent = p.tag;
  }
  for (const fItem of formulaItems) {
    const key = fItem.dataset.formula;
    const p = ev.pillars[key];
    if (!p) continue;
    fItem.dataset.ok = String(p.ok);
  }

  // 3) 实黑碑基单真源诊单
  if (diagBadge) {
    diagBadge.textContent = ev.badge;
    diagBadge.dataset.ok = String(ev.ok);
  }
  if (diagHeadline) diagHeadline.textContent = ev.headline;
  if (diagBody) diagBody.textContent = ev.body;
  if (diagAction) diagAction.textContent = ev.action;

  currentFixState = ev.fixState;
  if (diagFixBtn) {
    if (ev.fixState) {
      diagFixBtn.hidden = false;
      diagFixBtn.textContent = ev.fixLabel;
    } else {
      diagFixBtn.hidden = true;
    }
  }

  // 4) 四格实测指标
  if (mTilt) mTilt.textContent = ev.metrics.tiltText;
  if (mDelta) mDelta.textContent = ev.metrics.deltaText;
  if (mWeight) mWeight.textContent = ev.metrics.weightText;
  if (mSupport) mSupport.textContent = ev.metrics.supportText;

  // 5) 控件同步
  if (ctrlTilt) ctrlTilt.value = String(Math.round(state.tiltDeg));
  if (ctrlTiltVal) ctrlTiltVal.textContent = `${g.tiltDeg > 0 ? "+" : ""}${Math.round(g.tiltDeg)}°`;

  if (ctrlBall) ctrlBall.value = String(Math.round(state.ballOffset * 100));
  if (ctrlBallVal) {
    const v = Math.round(state.ballOffset * 100);
    ctrlBallVal.textContent = Math.abs(v) <= 2 ? "居中承托" : v > 0 ? `偏右 +${v}%` : `偏左 ${v}%`;
  }

  if (ctrlWeight) ctrlWeight.value = String(Math.round(state.uprightWeight * 100));
  if (ctrlWeightVal) ctrlWeightVal.textContent = `${Math.round(g.uprightShare * 100)}%`;

  if (btnUprightSkew) {
    const skewed = Math.abs(state.uprightTiltDeg) > 1;
    btnUprightSkew.textContent = skewed ? "正柱：已歪 16°（点此扶正）" : "正柱：端正 0°（点此歪斜）";
    btnUprightSkew.setAttribute("aria-pressed", String(skewed));
    btnUprightSkew.dataset.warn = String(skewed);
  }
  if (btnVectors) {
    btnVectors.textContent = state.showVectors ? "力学线：开" : "力学线：关";
    btnVectors.setAttribute("aria-pressed", String(state.showVectors));
  }

  for (const b of sceneBtns) {
    const active = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  }

  if (sceneCap) {
    const map = {
      poster: "暖宣正柱垂立定轴 × 玄墨巨碑斜倚承球",
      pine: "直壁垂瀑定正轴 × 苍黑古松斜探出崖",
      editorial: "端正书栏稳版心 × 斜切黑版拉动势",
      tower: "垂直主塔担结构 × 斜倾塔翼破天际",
    };
    sceneCap.textContent = map[state.scene] || map.poster;
  }
}

function patchState(patch) {
  Object.assign(state, patch);
  syncUI();
  stageCtrl?.redraw();
}

// 挂载开场主舞台
if (canvas) {
  stageCtrl = mountHeroStage(
    canvas,
    () => state,
    (patch) => {
      Object.assign(state, patch);
      syncUI();
    }
  );
}

// 绑定场景切签
for (const b of sceneBtns) {
  b.addEventListener("click", () => patchState({ scene: b.dataset.scene }));
}

// 绑定滑轨
ctrlTilt?.addEventListener("input", () => patchState({ tiltDeg: Number(ctrlTilt.value) }));
ctrlBall?.addEventListener("input", () => patchState({ ballOffset: Number(ctrlBall.value) / 100 }));
ctrlWeight?.addEventListener("input", () => patchState({ uprightWeight: Number(ctrlWeight.value) / 100 }));

// 绑定状态按钮
btnUprightSkew?.addEventListener("click", () => {
  patchState({ uprightTiltDeg: Math.abs(state.uprightTiltDeg) > 1 ? 0 : 16 });
});
btnVectors?.addEventListener("click", () => {
  patchState({ showVectors: !state.showVectors });
});
btnScan?.addEventListener("click", () => {
  stageCtrl?.triggerScan();
});
diagFixBtn?.addEventListener("click", () => {
  if (currentFixState) patchState(currentFixState);
});

// 绑定预设解与试错按钮
for (const b of presetBtns) {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (p) patchState({ ...p.state });
  });
}

// 键盘操作：聚焦在画布上时支持方向键调倾角/滑支点、空格演播视线、R 复原
canvas?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    patchState({ tiltDeg: clamp(Math.round(state.tiltDeg) + 2, LIMITS.tiltMin, LIMITS.tiltMax) });
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    patchState({ tiltDeg: clamp(Math.round(state.tiltDeg) - 2, LIMITS.tiltMin, LIMITS.tiltMax) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    patchState({ ballOffset: clamp(+(state.ballOffset - 0.03).toFixed(2), LIMITS.ballMin, LIMITS.ballMax) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    patchState({ ballOffset: clamp(+(state.ballOffset + 0.03).toFixed(2), LIMITS.ballMin, LIMITS.ballMax) });
  } else if (e.key === " ") {
    e.preventDefault();
    stageCtrl?.triggerScan();
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    patchState({ ...PRESETS.opening.state });
  }
});

syncUI();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
