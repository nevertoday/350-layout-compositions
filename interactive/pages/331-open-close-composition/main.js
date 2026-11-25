// 331 开合构图 — 主入口：连接 model.js 单真源、双扉透视舞台与 01–07 节交互
import { loop } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, evaluate, PORTAL, clamp } from "./model.js";
import { createHeroStage } from "./stage.js";
import {
  initTopologyBoard,
  initSplitCurtain,
  initScrollBlueprint,
  initScenarioStudio,
  initAntiExamples,
  initQuiz,
  initPosterLightbox,
} from "./figures.js";

const state = { ...INITIAL_STATE };

const canvas = document.getElementById("portal-canvas");
const heroTitle = document.getElementById("hero-title");
const gateSeal = document.getElementById("gate-seal");

// 单真源 DOM 读数节点
const elTopBadge = document.getElementById("hero-status-pill");
const elDiagBadge = document.getElementById("diag-badge");
const elDiagHead = document.getElementById("diag-head");
const elDiagWhy = document.getElementById("diag-why");
const elDiagAct = document.getElementById("diag-action");
const elQuickFix = document.getElementById("diag-fix-btn");

// 三条原海报知识点实况标签
const elPtOpen = document.getElementById("pt-open-state");
const elPtClose = document.getElementById("pt-close-state");
const elPtContrast = document.getElementById("pt-contrast-state");

// 四枚原海报设计价值实测读数
const elValRelease = document.getElementById("val-release");
const elValControl = document.getElementById("val-control");
const elValContrast = document.getElementById("val-contrast");
const elValRhythm = document.getElementById("val-rhythm");

// 操轨控件
const btnLinked = document.getElementById("ctrl-linked");
const btnTopVent = document.getElementById("ctrl-top-vent");
const btnBotVent = document.getElementById("ctrl-bot-vent");
const btnRays = document.getElementById("ctrl-rays");
const rangeLeft = document.getElementById("range-left");
const rangeRight = document.getElementById("range-right");
const valLeft = document.getElementById("val-left");
const valRight = document.getElementById("val-right");
const rightGroup = document.getElementById("range-right-wrap");
const labelLeft = document.getElementById("label-left");

const themeBtns = document.querySelectorAll("[data-theme]");
const presetBtns = document.querySelectorAll("[data-preset]");

let lastEval = null;
let stageLoop = null;

function syncUI() {
  const res = evaluate(state);
  lastEval = res;
  const g = res.metrics;

  // 1) 标题自示范：字距与两侧朱红门翼符号随真实中庭开度微幅呼吸（不换行、不溢出）
  if (heroTitle) {
    const tNorm = clamp((g.aperturePct - 18) / 62, 0, 1);
    const openGap = (-0.015 + tNorm * 0.14).toFixed(3);
    const wingScale = clamp(1.15 - tNorm * 0.85, 0.25, 1.15).toFixed(2);
    heroTitle.style.setProperty("--open-gap", `${openGap}em`);
    heroTitle.style.setProperty("--wing-scale", wingScale);
  }

  // 右下原海报四向门枢徽同步微转，呼应开度
  if (gateSeal) {
    const rot = Math.round(((state.leftAngle + state.rightAngle) * 0.5 - PORTAL.minAngle) * 0.45);
    gateSeal.style.transform = `rotate(${rot}deg)`;
  }

  // 2) 顶部与诊单单真源状态
  const statusKind = res.ok ? "ok" : "warn";
  if (elTopBadge) {
    elTopBadge.textContent = res.badge;
    elTopBadge.dataset.state = statusKind;
  }
  if (elDiagBadge) {
    elDiagBadge.textContent = res.badge;
    elDiagBadge.dataset.state = statusKind;
  }
  if (elDiagHead) elDiagHead.textContent = res.headline;
  if (elDiagWhy) elDiagWhy.textContent = res.why;
  if (elDiagAct) elDiagAct.textContent = res.action;
  if (elQuickFix) {
    if (res.quickFix && res.quickFixLabel) {
      elQuickFix.hidden = false;
      elQuickFix.textContent = res.quickFixLabel;
    } else {
      elQuickFix.hidden = true;
    }
  }

  // 3) 原海报三条「知识要点」实况签
  if (elPtOpen) {
    elPtOpen.textContent = res.openStatus;
    elPtOpen.dataset.state = g.openVents === 0 ? "warn" : g.wingAreaPct < 14 ? "warn" : "ok";
  }
  if (elPtClose) {
    elPtClose.textContent = res.closeStatus;
    elPtClose.dataset.state = g.minClearancePct < 3 || g.wingAreaPct < 14 ? "warn" : "ok";
  }
  if (elPtContrast) {
    elPtContrast.textContent = res.contrastStatus;
    elPtContrast.dataset.state = statusKind;
  }

  // 4) 原海报四枚「设计价值」实测数据
  if (elValRelease) elValRelease.textContent = `气口 ${g.openVents}/2 · 开放 ${g.releasePct}%`;
  if (elValControl) elValControl.textContent = `围合 ${g.wingAreaPct}% · 净空 ${g.minClearancePct}%`;
  if (elValContrast) elValContrast.textContent = `中庭 ${g.aperturePct}%`;
  if (elValRhythm) elValRhythm.textContent = res.rhythmLabel;

  // 5) 同步操轨控件
  if (btnLinked) {
    btnLinked.setAttribute("aria-pressed", String(!state.linked));
    btnLinked.textContent = state.linked ? "联动双扉" : "独扇偏开";
  }
  if (btnTopVent) {
    btnTopVent.setAttribute("aria-pressed", String(!state.topShut));
    btnTopVent.textContent = state.topShut ? "上口：封死" : "上口：打开";
    btnTopVent.dataset.shut = String(state.topShut);
  }
  if (btnBotVent) {
    btnBotVent.setAttribute("aria-pressed", String(!state.botShut));
    btnBotVent.textContent = state.botShut ? "下口：封死" : "下口：打开";
    btnBotVent.dataset.shut = String(state.botShut);
  }
  if (btnRays) {
    btnRays.setAttribute("aria-pressed", String(state.showRays));
    btnRays.textContent = state.showRays ? "视线流：开" : "视线流：关";
  }

  if (rangeLeft) rangeLeft.value = String(Math.round(state.leftAngle));
  if (valLeft) valLeft.textContent = `${Math.round(state.leftAngle)}°`;
  if (rangeRight) rangeRight.value = String(Math.round(state.rightAngle));
  if (valRight) valRight.textContent = `${Math.round(state.rightAngle)}°`;
  if (labelLeft) labelLeft.textContent = state.linked ? "双扉开角" : "左扉开角";
  if (rightGroup) rightGroup.hidden = state.linked;

  themeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === state.theme)));
}

function patch(partial) {
  Object.assign(state, partial);
  if (state.linked && "leftAngle" in partial && !("rightAngle" in partial)) {
    state.rightAngle = state.leftAngle;
  } else if (state.linked && "rightAngle" in partial && !("leftAngle" in partial)) {
    state.leftAngle = state.rightAngle;
  }
  syncUI();
  stageLoop?.draw();
}

// 初始化开场画布与 loop() 省电调度
if (canvas) {
  const hero = createHeroStage(canvas, {
    getState: () => state,
    onPatch: patch,
  });
  stageLoop = loop(canvas, (t, dt, meta) => hero.render(t, dt, meta));
  window.addEventListener("resize", () => stageLoop.draw());
}

// 绑定操轨控件事件
btnLinked?.addEventListener("click", () => {
  const nextLinked = !state.linked;
  if (nextLinked) {
    const avg = Math.round((state.leftAngle + state.rightAngle) * 0.5);
    patch({ linked: true, leftAngle: avg, rightAngle: avg });
  } else {
    patch({ linked: false });
  }
});

btnTopVent?.addEventListener("click", () => patch({ topShut: !state.topShut }));
btnBotVent?.addEventListener("click", () => patch({ botShut: !state.botShut }));
btnRays?.addEventListener("click", () => patch({ showRays: !state.showRays }));

rangeLeft?.addEventListener("input", () => {
  const v = Number(rangeLeft.value);
  patch(state.linked ? { leftAngle: v, rightAngle: v } : { leftAngle: v });
});
rangeRight?.addEventListener("input", () => {
  patch({ rightAngle: Number(rangeRight.value) });
});

elQuickFix?.addEventListener("click", () => {
  if (lastEval?.quickFix) patch(lastEval.quickFix);
});

themeBtns.forEach((b) =>
  b.addEventListener("click", () => {
    patch({ theme: b.dataset.theme });
  })
);

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    patch({
      leftAngle: p.leftAngle,
      rightAngle: p.rightAngle,
      linked: p.linked,
      topShut: p.topShut,
      botShut: p.botShut,
    });
  })
);

// 初始渲染同步
syncUI();
stageLoop?.draw();

// 初始化 01–07 节各自独立交互装置
initTopologyBoard();
initSplitCurtain();
initScrollBlueprint();
initScenarioStudio();
initAntiExamples();
initQuiz();
initPosterLightbox();
