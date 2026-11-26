// 044 菱形构图 · 入口脚本（单一真源状态仓库 + 主舞台 + 01–07 全部组件联动）
import { INITIAL_STATE, PRESETS, evaluate, normalizeState } from "./model.js";
import { mountHeroStage } from "./hero-canvas.js";
import {
  mountMachDial,
  mountImpliedDiamond,
  mountHistoryExplorer,
  mountFamilyMorph,
  mountStressTest,
  mountQuiz,
  mountLightbox,
} from "./widgets.js";

function createStore(initial) {
  let state = normalizeState(initial);
  const listeners = new Set();
  return {
    get: () => state,
    patch(partial) {
      state = normalizeState({ ...state, ...partial });
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const store = createStore(INITIAL_STATE);

// ---------- DOM 引用 ----------
const topStatus = document.getElementById("top-status");
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const btnNextFix = document.getElementById("btn-next-fix");

const mRot = document.getElementById("m-rot");
const mAspect = document.getElementById("m-aspect");
const mSkew = document.getElementById("m-skew");
const mConv = document.getElementById("m-conv");

const egCornerRoom = document.getElementById("eg-corner-room");
const egFoot = document.getElementById("eg-foot");
const egBars = [0, 1, 2, 3].map((i) => document.getElementById(`eg-b${i}`));
const egVals = [0, 1, 2, 3].map((i) => document.getElementById(`eg-v${i}`));

const ctlRot = document.getElementById("ctl-rot");
const ctlAspect = document.getElementById("ctl-aspect");
const ctlSkew = document.getElementById("ctl-skew");
const ctlScale = document.getElementById("ctl-scale");
const valRot = document.getElementById("val-rot");
const valAspect = document.getElementById("val-aspect");
const valSkew = document.getElementById("val-skew");
const valScale = document.getElementById("val-scale");

const btnClutter = document.getElementById("btn-clutter");
const btnFlow = document.getElementById("btn-flow");
const btnCenterFocus = document.getElementById("btn-center-focus");

const sceneBtns = [...document.querySelectorAll("#scene-tabs .scene-btn")];
const stepBtns = [...document.querySelectorAll("#build-steps .step-card")];
const presetBtns = [...document.querySelectorAll(".preset-btn")];

let latestEval = evaluate(store.get());

function syncUI(state) {
  const ev = evaluate(state);
  latestEval = ev;
  const { geom, pillars, passed, steps, diagnosis, convergenceBand } = ev;
  const isPass = passed === 4;

  // 顶栏状态 + 诊单头
  topStatus.textContent = diagnosis.statusBadge;
  topStatus.classList.toggle("is-ok", isPass);
  topStatus.classList.toggle("is-warn", !isPass);

  diagCard.classList.toggle("is-ok", isPass);
  diagBadge.textContent = diagnosis.statusBadge;
  diagBadge.classList.toggle("is-ok", isPass);
  diagBadge.classList.toggle("is-warn", !isPass);
  diagHeadline.textContent = diagnosis.headline;
  diagBody.textContent = diagnosis.body;
  diagHint.textContent = diagnosis.hint;
  btnNextFix.textContent = diagnosis.fixLabel;

  // 4 枚单真源实测读数
  mRot.textContent = `${Math.round(state.rot)}°`;
  mAspect.textContent = `${state.aspect.toFixed(2)}:1`;
  mSkew.textContent = `${Math.round(geom.edgeSpreadPct)}%`;
  mConv.textContent = convergenceBand;

  // 左栏四边实测等长仪（从同一份 geom.edges 核算）
  if (egCornerRoom && egBars[0]) {
    egCornerRoom.textContent = `四角留白 ${Math.round(geom.cornerRoomPct)}%`;
    const maxE = Math.max(...geom.edges, 0.001);
    const equalOk = geom.edgeSpreadPct <= 8.5;
    geom.edges.forEach((len, i) => {
      const pct = Math.round((len / maxE) * 100);
      egBars[i].style.width = `${pct}%`;
      egBars[i].classList.toggle("is-ok", equalOk);
      egBars[i].classList.toggle("is-warn", !equalOk);
      egVals[i].textContent = `${pct}%`;
    });
    egFoot.textContent = equalOk
      ? `四边等长成立（最大差仅 ${Math.round(geom.edgeSpreadPct)}%），左右上下拉力对称。`
      : `当前最短边仅为最长边的 ${Math.round((Math.min(...geom.edges) / maxE) * 100)}%，偏斜拉坏对称平衡。`;
  }

  // 四周四条原海报弧线标注联动
  for (const key of ["convergence", "diagonal", "balance", "focus"]) {
    const p = pillars[key];
    const badge = document.getElementById(`badge-${key}`);
    const card = document.querySelector(`.arc-note[data-pillar="${key}"]`);
    if (badge) {
      badge.textContent = p.tag;
      badge.classList.toggle("is-ok", p.ok);
      badge.classList.toggle("is-warn", !p.ok);
    }
    if (card) card.classList.toggle("is-ok", p.ok);
  }

  // 滑块同步
  ctlRot.value = String(Math.round(state.rot));
  valRot.textContent = `${Math.round(state.rot)}°`;
  ctlAspect.value = String(state.aspect.toFixed(2));
  valAspect.textContent = state.aspect.toFixed(2);
  const skewPct = Math.round(state.skew * 100);
  ctlSkew.value = String(skewPct);
  valSkew.textContent = `${skewPct > 0 ? "+" : ""}${skewPct}%`;
  const scalePct = Math.round(state.scale * 100);
  ctlScale.value = String(scalePct);
  valScale.textContent = `${scalePct}%`;

  // 开关按钮同步
  btnClutter.textContent = `四角杂物：${state.clutter ? "开" : "清"}`;
  btnClutter.setAttribute("aria-pressed", String(state.clutter));
  btnClutter.classList.toggle("is-warn-on", state.clutter);

  btnFlow.textContent = `视线光流：${state.showFlow ? "开" : "关"}`;
  btnFlow.setAttribute("aria-pressed", String(state.showFlow));
  btnFlow.classList.toggle("is-on", state.showFlow);

  // 题材按钮同步
  sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  // 底部四步构建图符进度同步
  steps.forEach((st, i) => {
    const el = stepBtns[i];
    if (el) el.classList.toggle("is-done", st.done);
  });
}

// ---------- 控件事件绑定 ----------
ctlRot.addEventListener("input", () => store.patch({ rot: Number(ctlRot.value) }));
ctlAspect.addEventListener("input", () => store.patch({ aspect: Number(ctlAspect.value) }));
ctlSkew.addEventListener("input", () => store.patch({ skew: Number(ctlSkew.value) / 100 }));
ctlScale.addEventListener("input", () => store.patch({ scale: Number(ctlScale.value) / 100 }));

btnClutter.addEventListener("click", () => store.patch({ clutter: !store.get().clutter }));
btnFlow.addEventListener("click", () => store.patch({ showFlow: !store.get().showFlow }));
btnCenterFocus.addEventListener("click", () => store.patch({ focusX: 0, focusY: 0 }));

btnNextFix.addEventListener("click", () => {
  if (latestEval.diagnosis.fixPatch) store.patch(latestEval.diagnosis.fixPatch);
});

sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => store.patch({ scene: btn.dataset.scene }));
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) store.patch(p.patch);
  });
});

stepBtns.forEach((btn, idx) => {
  btn.addEventListener("click", () => {
    const st = latestEval.steps[idx];
    if (st && st.fix) store.patch(st.fix);
  });
});

// 挂载主舞台与全部小节组件
const heroCanvas = document.getElementById("hero-canvas");
if (heroCanvas) mountHeroStage(heroCanvas, store);

store.subscribe(syncUI);
syncUI(store.get());

mountMachDial();
mountImpliedDiamond();
mountHistoryExplorer();
mountFamilyMorph();
mountStressTest();
mountQuiz();
mountLightbox();
