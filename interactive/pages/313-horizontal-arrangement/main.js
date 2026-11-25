// 313 横向调度 · 主入口模块
import {
  alignAllToHorizon,
  clamp,
  createBrokenNodes,
  createClotheslineNodes,
  createInitialState,
  evaluate,
  flipNodeDir,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  initAspectCurtainLab,
  initHistoryScrollLab,
  initPosterLightbox,
  initPracticeLab,
  initRhythmSequencerLab,
  initSiblingsLab,
  initSightlineLab,
  initVerticalCrashLab,
} from "./labs.js";

const state = createInitialState();

// DOM 引用（全部由 model.js 单一真源同步）
const heroCanvas = document.getElementById("hero-canvas");
const dollyTrack = document.getElementById("dolly-track");
const dollyThumb = document.getElementById("dolly-thumb");
const dollyVal = document.getElementById("dolly-val");

const pillarExp = document.getElementById("pillar-exp");
const pillarExpState = document.getElementById("pillar-exp-state");
const motifExpBar = document.getElementById("motif-exp-bar");

const pillarFlow = document.getElementById("pillar-flow");
const pillarFlowState = document.getElementById("pillar-flow-state");

const pillarRhy = document.getElementById("pillar-rhy");
const pillarRhyState = document.getElementById("pillar-rhy-state");
const motifRhyGold = document.getElementById("motif-rhy-gold");

const titleRuleLine = document.getElementById("title-rule-line");
const heroScoreChip = document.getElementById("hero-score-chip");

const eyePanel = document.getElementById("eye-panel");
const eyePupilGroup = document.getElementById("eye-pupil-group");
const diagTag = document.getElementById("diag-tag");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagTip = document.getElementById("diag-tip");

const mSpan = document.getElementById("m-span");
const mYSpread = document.getElementById("m-yspread");
const mBalance = document.getElementById("m-balance");
const mStab = document.getElementById("m-stab");

const aspectBtns = [...document.querySelectorAll("[data-aspect]")];
const skinBtns = [...document.querySelectorAll("[data-skin]")];
const btnFlipSelected = document.getElementById("btn-flip-selected");
const btnAlignHorizon = document.getElementById("btn-align-horizon");
const btnTryClothesline = document.getElementById("btn-try-clothesline");
const btnResetBroken = document.getElementById("btn-reset-broken");

function syncUI() {
  const ev = evaluate(state);

  // 顶部三栏要点灯眉
  pillarExp.dataset.ok = String(ev.checks.expansion.ok);
  pillarExpState.textContent = ev.checks.expansion.badge;
  motifExpBar.style.width = `${clamp(Math.round(ev.span * 100), 14, 92)}%`;

  pillarFlow.dataset.ok = String(ev.checks.flow.ok);
  pillarFlowState.textContent = ev.checks.flow.badge;

  pillarRhy.dataset.ok = String(ev.checks.rhythm.ok);
  pillarRhyState.textContent = ev.checks.rhythm.badge;
  motifRhyGold.style.width = `${clamp(Math.round((1 - ev.cv) * 85), 18, 92)}%`;

  // 标题即示范：大标下方的水平延伸线长度直接映射当前展幅
  if (titleRuleLine) {
    titleRuleLine.style.width = `${clamp(Math.round(ev.span * 105), 22, 95)}%`;
    titleRuleLine.style.backgroundColor = ev.score === 4 ? "var(--ok)" : "var(--steel-deep)";
  }

  // 画布右上/底部总分签
  if (heroScoreChip) {
    heroScoreChip.textContent = ev.score === 4 ? "4 / 4 成立" : `${ev.score} / 4 待调`;
    heroScoreChip.dataset.ok = String(ev.score === 4);
  }

  // 右侧眼睛实况诊单
  if (eyePanel) {
    eyePanel.dataset.state = ev.score === 4 ? "ok" : "warn";
  }
  diagTag.textContent = ev.primaryTag;
  diagTitle.textContent = ev.primaryTitle;
  diagBody.textContent = ev.primaryBody;
  diagTip.textContent = ev.primaryTip;

  // 眼睛瞳孔随推轨与视流重心轻轻左右扫视（最大 ±9px，绝不越出眼眶）
  if (eyePupilGroup) {
    const gazeShift = clamp(state.pan * 8 + (ev.centerX - 0.5) * 14, -9, 9);
    eyePupilGroup.setAttribute("transform", `translate(${gazeShift.toFixed(1)}, 0)`);
  }

  // 四项实测小读数
  mSpan.textContent = `${Math.round(ev.span * 100)}%`;
  mYSpread.textContent = `${Math.round(ev.ySpread * 100)}%`;
  const balPct = Math.round(Math.abs(ev.balanceOffset) * 100);
  mBalance.textContent = balPct <= 1 ? "居中 0%" : `${ev.balanceOffset < 0 ? "左" : "右"} ${balPct}%`;
  mStab.textContent = ev.checks.stability.short;

  // 按钮激活态
  aspectBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.aspect === state.aspect)));
  skinBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.skin === state.skin)));

  // 推轨游标位置与读数
  syncDollyDisplay();
}

function syncDollyDisplay() {
  if (!dollyTrack || !dollyThumb || !dollyVal) return;
  const pct = (state.pan + 1) / 2; // 0..1
  const safePct = 8 + pct * 84; // 让 66px 滑柄贴在轨道内部不溢出
  dollyThumb.style.left = `${safePct.toFixed(2)}%`;
  const signed = Math.round(state.pan * 100);
  dollyVal.textContent = signed > 0 ? `+${signed}%` : `${signed}%`;
  dollyTrack.setAttribute("aria-valuenow", String(signed));
}

// 启动开场宽银幕 2D Canvas 舞台
const heroStage = mountHeroStage({
  canvas: heroCanvas,
  state,
  onChange: syncUI,
});

// 绑定底沿横向机位推轨滑轨（同时支持鼠标 Pointer、触屏 Touch（供 perf.mjs）与键盘 ←/→）
if (dollyTrack) {
  let draggingDolly = false;

  const updatePanFromClientX = (clientX) => {
    const rect = dollyTrack.getBoundingClientRect();
    if (!rect.width) return;
    const raw = (clientX - rect.left) / rect.width;
    state.pan = clamp(raw * 2 - 1, -1, 1);
    syncDollyDisplay();
    if (eyePupilGroup) {
      const gazeShift = clamp(state.pan * 9, -9, 9);
      eyePupilGroup.setAttribute("transform", `translate(${gazeShift.toFixed(1)}, 0)`);
    }
    heroStage.draw();
  };

  dollyTrack.addEventListener("pointerdown", (e) => {
    draggingDolly = true;
    dollyTrack.setPointerCapture(e.pointerId);
    updatePanFromClientX(e.clientX);
  });

  dollyTrack.addEventListener("pointermove", (e) => {
    if (!draggingDolly) return;
    updatePanFromClientX(e.clientX);
  });

  const endDolly = (e) => {
    draggingDolly = false;
    try { dollyTrack.releasePointerCapture(e.pointerId); } catch {}
  };
  dollyTrack.addEventListener("pointerup", endDolly);
  dollyTrack.addEventListener("pointercancel", endDolly);

  // 显式兼容 CDP Input.dispatchTouchEvent（tools/perf.mjs 触屏拖拽测试）
  dollyTrack.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    draggingDolly = true;
    updatePanFromClientX(e.touches[0].clientX);
  }, { passive: true });

  dollyTrack.addEventListener("touchmove", (e) => {
    if (!draggingDolly || !e.touches.length) return;
    e.preventDefault();
    updatePanFromClientX(e.touches[0].clientX);
  }, { passive: false });

  dollyTrack.addEventListener("touchend", () => {
    draggingDolly = false;
  });

  dollyTrack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.pan = clamp(state.pan - 0.1, -1, 1);
      syncUI();
      heroStage.draw();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.pan = clamp(state.pan + 0.1, -1, 1);
      syncUI();
      heroStage.draw();
    }
  });
}

// 操控按钮绑定
aspectBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.aspect = b.dataset.aspect;
    syncUI();
    heroStage.draw();
  });
});

skinBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.skin = b.dataset.skin;
    syncUI();
    heroStage.draw();
  });
});

btnFlipSelected?.addEventListener("click", () => {
  flipNodeDir(state, state.selected);
  syncUI();
  heroStage.draw();
});

btnAlignHorizon?.addEventListener("click", () => {
  alignAllToHorizon(state);
  syncUI();
  heroStage.draw();
});

btnTryClothesline?.addEventListener("click", () => {
  state.aspect = "2.39";
  state.nodes = createClotheslineNodes();
  syncUI();
  heroStage.draw();
});

btnResetBroken?.addEventListener("click", () => {
  state.aspect = "2.39";
  state.pan = 0;
  state.selected = 0;
  state.nodes = createBrokenNodes();
  syncUI();
  heroStage.draw();
});

// 暴露只读测试钩子（供 probe 脚本核验几何真源与 UI 读数一致性，绝不影响正常页面）
window.__XXD313__ = {
  getState: () => JSON.parse(JSON.stringify(state)),
  getEval: () => evaluate(state),
};

// 初始化开场与正文全部 8 节实验
syncUI();
heroStage.draw();

initAspectCurtainLab();
initRhythmSequencerLab();
initSightlineLab();
initHistoryScrollLab();
initSiblingsLab();
initVerticalCrashLab();
initPracticeLab();
initPosterLightbox();
