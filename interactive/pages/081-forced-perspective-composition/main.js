// 081 强制透视构图 · 主控脚本
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PRESETS, SCENES, clamp, computeMetrics, createInitialState } from "./model.js";
import { renderMainStage, renderTruthPlan } from "./stage.js";
import { initPosterLightbox, initSec01Optical, initSec02Parallax, initSec03VpPicker, initSec04History, initSec05Avoid, initSec06Quiz } from "./sections.js";

const heroEl = document.getElementById("hero-stage-wrap");
const canvas = document.getElementById("hero-canvas");
const planCanvas = document.getElementById("plan-canvas");
const ctx = canvas.getContext("2d");
const planCtx = planCanvas.getContext("2d");

let state = createInitialState("corridor");
let animIntro = reducedMotion.matches ? 1 : 0;
let dirty = true;
let hoverPart = null;
let lastPlanGeo = null;
let lastMetrics = null;
let stageW = 840;
let stageH = 525;

// DOM 引用
const els = {
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  pillarBtns: [...document.querySelectorAll("[data-pillar]")],
  statusBadge: document.getElementById("top-status-badge"),
  wedgeTri: document.getElementById("hero-wedge-tri"),
  stageHint: document.getElementById("stage-hint"),
  focalSlider: document.getElementById("ctrl-focal"),
  focalVal: document.getElementById("ctrl-focal-val"),
  nearSlider: document.getElementById("ctrl-near"),
  nearVal: document.getElementById("ctrl-near-val"),
  nearLabel: document.getElementById("ctrl-near-label"),
  farSlider: document.getElementById("ctrl-far"),
  farVal: document.getElementById("ctrl-far-val"),
  farLabel: document.getElementById("ctrl-far-label"),
  taperWrap: document.getElementById("ctrl-taper-wrap"),
  taperSlider: document.getElementById("ctrl-taper"),
  taperVal: document.getElementById("ctrl-taper-val"),
  offsetWrap: document.getElementById("ctrl-offset-wrap"),
  offsetSlider: document.getElementById("ctrl-offset"),
  offsetVal: document.getElementById("ctrl-offset-val"),
  clutterBtn: document.getElementById("ctrl-clutter"),
  apertureBtn: document.getElementById("ctrl-aperture"),
  xrayBtn: document.getElementById("ctrl-xray"),
  resetBtn: document.getElementById("ctrl-reset"),
  // 诊单区（位于 45° 切角朱红底栏内，单真源刷新）
  diagPill: document.getElementById("diag-pill"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  kpCount: document.getElementById("kp-count"),
  mRatio: document.getElementById("metric-ratio"),
  mFov: document.getElementById("metric-fov"),
  mDist: document.getElementById("metric-dist"),
  mTension: document.getElementById("metric-tension"),
  pVp: document.getElementById("pillar-vp-stat"),
  pDepth: document.getElementById("pillar-depth-stat"),
  pScale: document.getElementById("pillar-scale-stat"),
  pTension: document.getElementById("pillar-tension-stat"),
  kpItems: [...document.querySelectorAll("[data-kp-index]")],
};

function resizeCanvases() {
  const dpr = pixelRatio(2);
  const r = canvas.getBoundingClientRect();
  stageW = Math.max(260, Math.round(r.width));
  stageH = Math.max(200, Math.round(r.height));
  if (canvas.width !== Math.round(stageW * dpr) || canvas.height !== Math.round(stageH * dpr)) {
    canvas.width = Math.round(stageW * dpr);
    canvas.height = Math.round(stageH * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pr = planCanvas.getBoundingClientRect();
  const pw = Math.max(260, Math.round(pr.width));
  const ph = Math.max(52, Math.round(pr.height));
  if (planCanvas.width !== Math.round(pw * dpr) || planCanvas.height !== Math.round(ph * dpr)) {
    planCanvas.width = Math.round(pw * dpr);
    planCanvas.height = Math.round(ph * dpr);
  }
  planCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dirty = true;
}

function syncControlsFromState() {
  const cfg = SCENES[state.scene];
  els.sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scene === state.scene)));
  if (els.stageHint) els.stageHint.textContent = cfg.hint;

  // 焦段滑轨
  els.focalSlider.min = String(cfg.focalRange[0]);
  els.focalSlider.max = String(cfg.focalRange[1]);
  els.focalSlider.value = String(Math.round(state.focal));
  els.focalVal.textContent = `${Math.round(state.focal)}mm`;

  // 近景滑轨
  els.nearSlider.min = String(cfg.nearRange[0]);
  els.nearSlider.max = String(cfg.nearRange[1]);
  els.nearSlider.step = state.scene === "align" ? "0.02" : "0.1";
  els.nearSlider.value = String(state.nearZ);
  els.nearVal.textContent = state.scene === "align" ? `${state.nearZ.toFixed(2)}m` : `${state.nearZ.toFixed(1)}m`;
  els.nearLabel.textContent = state.scene === "align" ? "手掌距镜" : state.scene === "spada" ? "观察步距" : "近人距镜";

  // 远景滑轨
  const farFixed = cfg.farRange[0] === cfg.farRange[1];
  els.farSlider.disabled = farFixed;
  els.farSlider.min = String(cfg.farRange[0]);
  els.farSlider.max = String(cfg.farRange[1]);
  els.farSlider.value = String(state.farZ);
  els.farVal.textContent = `${state.farZ.toFixed(1)}m`;
  els.farLabel.textContent = state.scene === "align" ? "远塔距离" : state.scene === "spada" ? "假廊实长" : "远人距镜";

  // 按题材显现专属微控
  els.taperWrap.hidden = state.scene === "align";
  els.taperSlider.value = String(state.taperDeg);
  els.taperVal.textContent = `${state.taperDeg.toFixed(1)}°`;

  els.offsetWrap.hidden = state.scene === "corridor";
  els.offsetSlider.value = String(state.camOffsetX);
  els.offsetVal.textContent = `${Math.round(state.camOffsetX * 100)}cm`;

  els.clutterBtn.hidden = state.scene !== "corridor";
  els.clutterBtn.setAttribute("aria-pressed", String(state.clutter));
  els.clutterBtn.textContent = state.clutter ? "通道杂物：开" : "通道杂物：关";

  els.apertureBtn.hidden = state.scene !== "align";
  els.apertureBtn.setAttribute("aria-pressed", String(state.aperture === "deep"));
  els.apertureBtn.textContent = state.aperture === "deep" ? "光圈：f/16 深焦双清" : "光圈：f/1.8 浅景深";

  els.xrayBtn.hidden = state.scene !== "spada";
  els.xrayBtn.setAttribute("aria-pressed", String(state.xray));
  els.xrayBtn.textContent = state.xray ? "透视结构线：显形" : "透视结构线：隐藏";

  // 预设按钮按当前题材筛选（保持简洁清晰）
  els.presetBtns.forEach((b) => {
    const p = PRESETS[b.dataset.preset];
    b.hidden = p.scene !== state.scene;
  });

  els.pillarBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(state.activeLayer === b.dataset.pillar));
  });
}

function syncDiagnostics(m) {
  // 顶眉徽章
  els.statusBadge.textContent = m.badge;
  els.statusBadge.dataset.state = m.ok ? "ok" : "warn";

  // 标题右方原海报深青楔形三角：随当前视角实时开合（标题本身就是示范！）
  if (els.wedgeTri) {
    const span = clamp((m.hFovDeg - 16) / 86, 0.18, 1);
    const tipY = Math.round(18 + span * 26);
    const rightX = Math.round(28 + span * 32);
    els.wedgeTri.setAttribute("points", `0,14 ${rightX},14 0,${tipY}`);
  }

  // 四枚原海报圆徽实时读数
  const map = [
    [els.pVp, m.pillars.vp],
    [els.pDepth, m.pillars.depth],
    [els.pScale, m.pillars.scale],
    [els.pTension, m.pillars.tension],
  ];
  for (const [el, info] of map) {
    if (!el) continue;
    el.textContent = info.text;
    el.dataset.ok = String(info.ok);
  }

  // 核心四项单真源指标
  els.mRatio.textContent = m.ratioDisplay;
  els.mFov.textContent = `${Math.round(state.focal)}mm / ${Math.round(m.hFovDeg)}°`;
  els.mDist.textContent = state.scene === "align"
    ? `${state.nearZ.toFixed(2)}m · ${state.farZ.toFixed(0)}m`
    : state.scene === "spada"
    ? `实 ${m.realLen}m · 视 ${m.apparentLen.toFixed(0)}m`
    : `${state.nearZ.toFixed(1)}m · ${state.farZ.toFixed(0)}m`;
  els.mTension.textContent = m.tensionTier;

  // 底部 45° 斜切应用要点 4 格实时状态
  const okCount = m.keyPoints.filter((k) => k.ok).length;
  if (els.kpCount) els.kpCount.textContent = `${okCount}/4 达标`;
  els.kpItems.forEach((item, idx) => {
    const kp = m.keyPoints[idx];
    if (!kp) return;
    item.dataset.ok = String(kp.ok);
    const stEl = item.querySelector(".kp-live");
    if (stEl) stEl.textContent = kp.status;
  });

  // 诊单白话（单真源，说清「为什么」与「怎么调」）
  if (m.ok) {
    els.diagPill.textContent = "透视成立";
    els.diagPill.dataset.state = "ok";
    if (state.scene === "corridor") {
      els.diagTitle.textContent = `近远身高差拉开到 ${m.ratioDisplay}，单点走廊纵深完全成立`;
      els.diagWhy.textContent = `两名同样 1.75m 的剪影人，因物距相差 ${(state.farZ / state.nearZ).toFixed(1)} 倍，配合 ${Math.round(state.focal)}mm 镜头与净空通道，眼睛立刻沿着地砖与窗檐一路冲向消失点。`;
      els.diagAction.textContent = "现在试试拉近到 1.1m（撞镜切头）或拧回 95mm（长焦压扁），亲眼看看两头过界会怎样失效。";
    } else if (state.scene === "align") {
      els.diagTitle.textContent = "唯一观察点咬合 + f/16 前后双清，掌托远塔错觉生效";
      els.diagWhy.textContent = `相隔 ${Math.round(state.farZ - state.nearZ)} 米的手掌与尖塔，在针孔视线上严丝合缝且同样清晰，大脑被迫把它们合并到同一平面。`;
      els.diagAction.textContent = "轻拖画布把相机侧移十几厘米，或切回 f/1.8 浅景深，看看错觉如何瞬间露馅。";
    } else {
      els.diagTitle.textContent = `仅 8.6m 的真短廊，在唯一轴心上变出了约 ${m.apparentLen.toFixed(0)}m 的深邃柱廊`;
      els.diagWhy.textContent = "靠地板抬升、拱顶压低与立柱渐缩，0.60 米高的小像在画面里看起来像退在三四十米外的真人雕像。";
      els.diagAction.textContent = "点开「透视结构线」或把画布横拖偏离中轴，立刻拆穿 1653 年博罗米尼的梯形机关。";
    }
    els.diagFixBtn.hidden = true;
  } else {
    const p = m.primaryIssue;
    els.diagPill.textContent = `${m.issues.length} 处待调`;
    els.diagPill.dataset.state = "warn";
    els.diagTitle.textContent = p.title;
    els.diagWhy.textContent = p.why;
    els.diagAction.textContent = p.action;
    els.diagFixBtn.hidden = false;
    els.diagFixBtn.textContent = p.fixLabel;
  }
}

function renderFrame(t, dt, { still }) {
  if (still) {
    animIntro = 1;
  } else if (animIntro < 1) {
    animIntro = Math.min(1, animIntro + Math.max(dt, 0.016) * 1.45);
    dirty = true;
  }
  if (!dirty && animIntro >= 1) return;
  dirty = false;

  lastMetrics = computeMetrics(state, stageW, stageH);
  renderMainStage(ctx, stageW, stageH, state, lastMetrics, animIntro, hoverPart);
  const pr = planCanvas.getBoundingClientRect();
  lastPlanGeo = renderTruthPlan(planCtx, Math.max(260, Math.round(pr.width)), Math.max(52, Math.round(pr.height)), state, lastMetrics);
  syncDiagnostics(lastMetrics);
}

const runner = loop(heroEl, renderFrame);

function updateState(patch, syncInputs = true) {
  state = { ...state, ...patch };
  if (syncInputs) syncControlsFromState();
  dirty = true;
  runner.draw();
}

// ========== 主画布直接交互（横拖推拉纵深/视差，直拖近人/消失点，触屏垂直滚动友好） ==========
let dragSession = null;

function hitTestCanvas(x, y) {
  if (!lastMetrics) return "pan";
  if (state.scene === "corridor") {
    const { vpX, vpY } = lastMetrics.proj;
    if (Math.hypot(x - vpX, y - vpY) <= 22) return "vp";
    const nb = lastMetrics.nearBox;
    // 只在精准按中近景红人躯干内部时进入近人定位拖拽，确保画布中心及空白走廊区域横拖 100% 驱动纵深主轴
    if (x >= nb.cx - nb.w * 0.44 && x <= nb.cx + nb.w * 0.44 && y >= Math.max(4, nb.topY + nb.h * 0.06) && y <= nb.botY - nb.h * 0.06) {
      return "near";
    }
  }
  return "pan";
}

function startMainDrag(clientX, clientY, pointerId = null) {
  const r = canvas.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;
  const part = hitTestCanvas(x, y);
  dragSession = {
    pointerId,
    part,
    x0: clientX,
    y0: clientY,
    nearZ0: state.nearZ,
    farZ0: state.farZ,
    focal0: state.focal,
    nearX0: state.nearX,
    vpU0: state.vpU,
    vpV0: state.vpV,
    offset0: state.camOffsetX,
    lockedAxis: part === "vp" || part === "near" ? "free" : null,
  };
}

function moveMainDrag(clientX, clientY, ev) {
  if (!dragSession) return;
  const dx = clientX - dragSession.x0;
  const dy = clientY - dragSession.y0;
  if (!dragSession.lockedAxis) {
    if (Math.hypot(dx, dy) < 5) return;
    // 触屏时若明显竖直滑动，交还浏览器滚动页面，不劫持垂直滚动
    if (Math.abs(dy) > Math.abs(dx) * 1.25 && ev && ev.type === "touchmove") {
      dragSession = null;
      return;
    }
    dragSession.lockedAxis = "h";
  }
  if (ev && ev.cancelable) ev.preventDefault();

  const w = Math.max(260, stageW);
  const h = Math.max(200, stageH);

  if (dragSession.part === "vp") {
    updateState({
      vpU: clamp(dragSession.vpU0 + dx / w, 0.14, 0.90),
      vpV: clamp(dragSession.vpV0 + dy / h, 0.10, 0.72),
    });
    return;
  }

  if (dragSession.part === "near" && state.scene === "corridor") {
    // 拖近景红人：上下拖拉近/推远物距，左右拖微调水平站位（可测前景挡远景！）
    const newNearZ = clamp(dragSession.nearZ0 - (dy / h) * 14, 1.1, 18.0);
    const newNearX = clamp(dragSession.nearX0 + (dx / w) * 3.2, -1.75, 1.55);
    updateState({ nearZ: +newNearZ.toFixed(2), nearX: +newNearX.toFixed(2) });
    return;
  }

  // 主画布空白处横拖（含 perf 触控测试）：按题材执行最核心的强制透视物理动作！
  if (state.scene === "corridor") {
    // 横拖进度：向右推拉「逼近前景 + 展开广角 + 推远背景」，向左回退「长焦压扁」，拖过头可触碰「撞镜切头」错态！
    const step = dx / (w * 0.42);
    const newNearZ = clamp(dragSession.nearZ0 - step * 11.4, 1.1, 18.0);
    const newFocal = clamp(dragSession.focal0 - step * 75, 16, 135);
    const newFarZ = clamp(dragSession.farZ0 + step * 29, 8.0, 62.0);
    updateState({
      nearZ: +newNearZ.toFixed(2),
      focal: Math.round(newFocal),
      farZ: +newFarZ.toFixed(1),
    });
  } else if (state.scene === "align") {
    // 横拖直接平移相机测试借位视差
    const newOff = clamp(dragSession.offset0 - (dx / w) * 0.85, -0.45, 0.45);
    updateState({ camOffsetX: +newOff.toFixed(3) });
  } else if (state.scene === "spada") {
    // 横拖侧移机位拆穿 8.6m 梯形机关
    const newOff = clamp(dragSession.offset0 - (dx / w) * 1.6, -0.95, 0.95);
    updateState({ camOffsetX: +newOff.toFixed(2) });
  }
}

// 同时兼容 Mouse / Pointer / Touch（确保 tools/perf.mjs 的 dispatchTouchEvent 每一帧都精准触发重绘！）
canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return;
  canvas.setPointerCapture(e.pointerId);
  startMainDrag(e.clientX, e.clientY, e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  if (dragSession && dragSession.pointerId === e.pointerId) {
    moveMainDrag(e.clientX, e.clientY, e);
  } else {
    const r = canvas.getBoundingClientRect();
    const part = hitTestCanvas(e.clientX - r.left, e.clientY - r.top);
    const nextHover = part === "pan" ? null : part;
    canvas.style.cursor = part === "pan" ? "ew-resize" : "grab";
    if (nextHover !== hoverPart) {
      hoverPart = nextHover;
      dirty = true;
      runner.draw();
    }
  }
});
const stopPointer = (e) => {
  if (dragSession && dragSession.pointerId === e.pointerId) dragSession = null;
};
canvas.addEventListener("pointerup", stopPointer);
canvas.addEventListener("pointercancel", stopPointer);

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  startMainDrag(t.clientX, t.clientY, "touch");
}, { passive: true });
canvas.addEventListener("touchmove", (e) => {
  if (!dragSession || dragSession.pointerId !== "touch" || !e.touches.length) return;
  const t = e.touches[0];
  moveMainDrag(t.clientX, t.clientY, e);
}, { passive: false });
canvas.addEventListener("touchend", () => {
  if (dragSession?.pointerId === "touch") dragSession = null;
}, { passive: true });
canvas.addEventListener("touchcancel", () => {
  if (dragSession?.pointerId === "touch") dragSession = null;
}, { passive: true });

// 键盘操控主画布
canvas.addEventListener("keydown", (e) => {
  if (state.scene === "corridor") {
    if (e.key === "ArrowRight") { e.preventDefault(); updateState({ nearZ: clamp(+(state.nearZ - 0.8).toFixed(2), 1.1, 18), focal: clamp(state.focal - 6, 16, 135) }); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); updateState({ nearZ: clamp(+(state.nearZ + 0.8).toFixed(2), 1.1, 18), focal: clamp(state.focal + 6, 16, 135) }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); updateState({ farZ: clamp(+(state.farZ + 4).toFixed(1), 8, 62) }); }
    else if (e.key === "ArrowDown") { e.preventDefault(); updateState({ farZ: clamp(+(state.farZ - 4).toFixed(1), 8, 62) }); }
  } else {
    const step = state.scene === "align" ? 0.03 : 0.08;
    const lim = state.scene === "align" ? 0.45 : 0.95;
    if (e.key === "ArrowRight") { e.preventDefault(); updateState({ camOffsetX: clamp(+(state.camOffsetX + step).toFixed(3), -lim, lim) }); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); updateState({ camOffsetX: clamp(+(state.camOffsetX - step).toFixed(3), -lim, lim) }); }
  }
});

// ========== 顶视真距离蓝图剖面轨拖拽交互 ==========
let planDrag = null;
planCanvas.addEventListener("pointerdown", (e) => {
  if (!lastPlanGeo) return;
  const r = planCanvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const dNear = Math.abs(x - lastPlanGeo.nx);
  const dFar = Math.abs(x - lastPlanGeo.fx);
  const target = state.scene === "spada" ? "near" : dNear <= dFar ? "near" : "far";
  planCanvas.setPointerCapture(e.pointerId);
  planDrag = { id: e.pointerId, target };
  applyPlanPointer(x);
});
planCanvas.addEventListener("pointermove", (e) => {
  if (!planDrag || planDrag.id !== e.pointerId) return;
  const r = planCanvas.getBoundingClientRect();
  applyPlanPointer(e.clientX - r.left);
});
const endPlan = (e) => { if (planDrag && planDrag.id === e.pointerId) planDrag = null; };
planCanvas.addEventListener("pointerup", endPlan);
planCanvas.addEventListener("pointercancel", endPlan);

function applyPlanPointer(x) {
  if (!lastPlanGeo) return;
  const cfg = SCENES[state.scene];
  const z = ((x - lastPlanGeo.padL) / lastPlanGeo.usableW) * lastPlanGeo.maxZ;
  if (planDrag.target === "near") {
    const nz = clamp(z, cfg.nearRange[0], Math.min(cfg.nearRange[1], state.farZ - 0.5));
    updateState({ nearZ: +(state.scene === "align" ? nz.toFixed(2) : nz.toFixed(1)) });
  } else if (cfg.farRange[0] !== cfg.farRange[1]) {
    const fz = clamp(z, Math.max(cfg.farRange[0], state.nearZ + 1.0), cfg.farRange[1]);
    updateState({ farZ: +fz.toFixed(1) });
  }
}

// ========== 控件绑定 ==========
els.sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state = createInitialState(btn.dataset.scene);
    syncControlsFromState();
    dirty = true;
    runner.draw();
  });
});

els.presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    if (p.scene !== state.scene) state = createInitialState(p.scene);
    updateState(p.patch);
  });
});

els.pillarBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.pillar;
    updateState({ activeLayer: state.activeLayer === key ? "all" : key });
  });
});

els.focalSlider.addEventListener("input", () => updateState({ focal: Number(els.focalSlider.value) }));
els.nearSlider.addEventListener("input", () => updateState({ nearZ: Number(els.nearSlider.value) }));
els.farSlider.addEventListener("input", () => updateState({ farZ: Number(els.farSlider.value) }));
els.taperSlider.addEventListener("input", () => updateState({ taperDeg: Number(els.taperSlider.value) }));
els.offsetSlider.addEventListener("input", () => updateState({ camOffsetX: Number(els.offsetSlider.value) }));

els.clutterBtn.addEventListener("click", () => updateState({ clutter: !state.clutter }));
els.apertureBtn.addEventListener("click", () => updateState({ aperture: state.aperture === "deep" ? "shallow" : "deep" }));
els.xrayBtn.addEventListener("click", () => updateState({ xray: !state.xray }));
els.resetBtn.addEventListener("click", () => {
  state = createInitialState(state.scene);
  syncControlsFromState();
  dirty = true;
  runner.draw();
});

els.diagFixBtn.addEventListener("click", () => {
  if (lastMetrics?.primaryIssue?.fixPatch) {
    updateState(lastMetrics.primaryIssue.fixPatch);
  }
});

// 初始化所有正文节与响应式重绘
const redrawers = [
  initSec01Optical(),
  initSec02Parallax(),
  initSec03VpPicker(),
  initSec04History(),
  initSec05Avoid(),
  initSec06Quiz(),
];
initPosterLightbox();

syncControlsFromState();
resizeCanvases();
runner.draw();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvases();
    runner.draw();
    for (const fn of redrawers) if (typeof fn === "function") fn();
  }, 80);
});
