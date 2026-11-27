// 181 非对称字体排版 · 总控入口（单真源同步画布、自示范标题、诊单、三探针与所有小节）
import {
  INITIAL_STATE,
  SOLUTIONS,
  FAILURE_PRESETS,
  deriveCounterPositions,
  evaluateLayout,
} from "./model.js";
import { mountHeroStage } from "./scene-canvas.js";
import {
  initSection01Compare,
  initSection02Mass,
  initSection03Xray,
  initSection04History,
  initSection05UseCases,
  initSection06Quiz,
  initPosterLightbox,
} from "./figures.js";

const state = { ...INITIAL_STATE };

const canvas = document.getElementById("hero-canvas");
const titleL2 = document.getElementById("hero-title-l2");
const statusPill = document.getElementById("hero-status-pill");
const hudLine = document.getElementById("hud-line");

const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagTier = document.getElementById("diag-tier");
const diagHeadline = document.getElementById("diag-headline");
const diagReason = document.getElementById("diag-reason");
const diagHint = document.getElementById("diag-hint");

const probeAsym = document.getElementById("probe-asym");
const probeHier = document.getElementById("probe-hier");
const probeMotion = document.getElementById("probe-motion");

const ctrlShift = document.getElementById("ctrl-shift");
const ctrlHier = document.getElementById("ctrl-hier");
const ctrlTilt = document.getElementById("ctrl-tilt");
const ctrlWeight = document.getElementById("ctrl-weight");

const valShift = document.getElementById("val-shift");
const valHier = document.getElementById("val-hier");
const valTilt = document.getElementById("val-tilt");
const valWeight = document.getElementById("val-weight");

const btnGrid = document.getElementById("toggle-grid");
const btnMass = document.getElementById("toggle-mass");
const btnCalibrate = document.getElementById("btn-calibrate");
const btnReset = document.getElementById("btn-reset");
const btnScan = document.getElementById("btn-scan");

let stage;

function mutate(patch) {
  Object.assign(state, patch);
  // 若非手动定位模式，蓝圆/巨字/导语跟随 axisShift 同步更新以便读数绝对一致
  if (!state.manualPositions) {
    const p = deriveCounterPositions(state.axisShift);
    state.blueX = p.blueX;
    state.blueY = p.blueY;
    state.giantX = p.giantX;
    state.giantY = p.giantY;
    state.quoteX = p.quoteX;
    state.quoteY = p.quoteY;
  }
  syncUI();
  stage?.draw();
}

function syncUI() {
  const aspect = stage ? stage.getAspect() : 1.05;
  const ev = evaluateLayout(state, aspect);
  const allOk = ev.passedCount === 4;

  // 自示范大标题：第二行随偏轴张力轻微错位，展现非对称韵律（限制幅度防溢出）
  if (titleL2) {
    const shiftPx = Math.round(state.axisShift * 14);
    titleL2.style.transform = `translateX(${shiftPx}px)`;
  }

  // 状态徽标与画布顶 HUD
  statusPill.textContent = ev.badgeText;
  statusPill.dataset.ok = String(allOk);

  const shiftLabel = Math.abs(state.axisShift) < 0.08
    ? "居中 0%"
    : `${state.axisShift > 0 ? "偏左挂轴" : "偏右挂轴"} ${ev.absShiftPct}%`;
  hudLine.textContent = `${shiftLabel} · 级差 ${ev.hRatio.toFixed(1)}× · 留白 ${ev.whitespacePct}% · 重心 ${Math.round(ev.cogX * 100)}%`;

  // 单真源诊单卡
  diagCard.dataset.ok = String(allOk);
  diagBadge.textContent = ev.badgeText;
  diagBadge.dataset.ok = String(allOk);
  diagTier.textContent = ev.tensionTier;
  diagHeadline.textContent = ev.headline;
  diagReason.textContent = ev.reason;
  diagHint.textContent = ev.actionHint;

  // 原海报三枚几何探针（● 不对称 / ■ 层级 / ▶ 视觉动势）
  probeAsym.textContent = ev.probes.asymmetry;
  probeAsym.dataset.ok = String(ev.checks.asymmetry);

  probeHier.textContent = ev.probes.hierarchy;
  probeHier.dataset.ok = String(ev.checks.hierarchy);

  probeMotion.textContent = ev.probes.motion;
  probeMotion.dataset.ok = String(ev.checks.motion && ev.checks.balance);

  // 滑轨数值同步
  ctrlShift.value = String(Math.round(state.axisShift * 100));
  valShift.textContent = `${state.axisShift >= 0 ? "+" : ""}${Math.round(state.axisShift * 100)}%`;

  ctrlHier.value = String(Math.round(state.hierarchy * 100));
  valHier.textContent = `${state.hierarchy.toFixed(2)}×`;

  ctrlTilt.value = String(Math.round(state.tiltDeg));
  valTilt.textContent = `${state.tiltDeg > 0 ? "+" : ""}${Math.round(state.tiltDeg)}°`;

  ctrlWeight.value = String(Math.round(state.weightScale * 100));
  valWeight.textContent = `${Math.round(state.weightScale * 100)}%`;

  // 切签与图层开关同步
  document.querySelectorAll("[data-scene]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.scene === state.scene));
  });
  btnGrid.setAttribute("aria-pressed", String(state.showGrid));
  btnMass.setAttribute("aria-pressed", String(state.showMass));
}

stage = mountHeroStage(canvas, () => state, mutate);

// 语境切签
document.querySelectorAll("[data-scene]").forEach((b) => {
  b.addEventListener("click", () => mutate({ scene: b.dataset.scene }));
});

// 滑轨控制
ctrlShift.addEventListener("input", () => {
  mutate({ axisShift: Number(ctrlShift.value) / 100, manualPositions: false });
});
ctrlHier.addEventListener("input", () => {
  mutate({ hierarchy: Number(ctrlHier.value) / 100 });
});
ctrlTilt.addEventListener("input", () => {
  mutate({ tiltDeg: Number(ctrlTilt.value) });
});
ctrlWeight.addEventListener("input", () => {
  mutate({ weightScale: Number(ctrlWeight.value) / 100 });
});

// 图层开关
btnGrid.addEventListener("click", () => mutate({ showGrid: !state.showGrid }));
btnMass.addEventListener("click", () => mutate({ showMass: !state.showMass }));

// 校准、复原、视线动势验真
btnCalibrate.addEventListener("click", () => mutate({ ...SOLUTIONS.posterClassic.patch }));
btnReset.addEventListener("click", () => mutate({ ...INITIAL_STATE, scene: state.scene }));
btnScan.addEventListener("click", () => stage.triggerScan());

// 多组合法解
document.querySelectorAll("[data-solution]").forEach((b) => {
  b.addEventListener("click", () => {
    const sol = SOLUTIONS[b.dataset.solution];
    if (sol) mutate({ ...sol.patch });
  });
});

// 双向试错预设
document.querySelectorAll("[data-fail]").forEach((b) => {
  b.addEventListener("click", () => {
    const fail = FAILURE_PRESETS[b.dataset.fail];
    if (fail) mutate({ ...fail.patch, scene: state.scene });
  });
});

// 全局 Space 快捷键（当焦点不在输入框或按钮上时触发视线扫视验真）
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.target.closest("button, input, textarea, select, a")) {
    const heroRect = document.getElementById("hero-section")?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > 80 && heroRect.top < window.innerHeight - 60) {
      e.preventDefault();
      stage.triggerScan();
    }
  }
});

// 初始化全部正文互动节
syncUI();
initSection01Compare();
initSection02Mass();
initSection03Xray();
initSection04History();
initSection05UseCases();
initSection06Quiz();
initPosterLightbox();
