// 027 中轴构图 · 交互与单一真源控制器
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  clamp,
  round1,
  CLUTTER_DEFS,
  SCALE_TOKENS,
  SCALE_SLOTS,
  QUIZ_BANK,
  createBrokenHeroState,
  evaluateHero,
  evaluateScalePuzzle,
  evaluateBlindTest,
} from "./model.js";
import {
  drawHeroStage,
  drawScaleCanvas,
  drawBlindCanvas,
  drawEraBlueprint,
  drawExampleCard,
  drawAntiExample,
  drawQuizThumb,
} from "./scenes.js";

// 通用高分屏 Canvas 尺寸同步器（仅在尺寸变化时重配 buffer，避免拖动掉帧）
function fitCanvas(canvas) {
  const dpr = pixelRatio(2);
  const w = Math.max(10, Math.round(canvas.clientWidth));
  const h = Math.max(10, Math.round(canvas.clientHeight));
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ============================================================
// 开场：通天中轴天平剧场
// ============================================================
const heroState = createBrokenHeroState("mountain");
const heroCanvas = document.getElementById("heroCanvas");
const fulcrumTrack = document.getElementById("fulcrumTrack");
const fulcrumThumb = document.getElementById("fulcrumThumb");
const thumbLabel = document.getElementById("thumbLabel");
const fulcrumRead = document.getElementById("fulcrumRead");

const topScoreBadge = document.getElementById("topScoreBadge");
const hudAxis = document.getElementById("hudAxis");
const hudTilt = document.getElementById("hudTilt");
const hudSubj = document.getElementById("hudSubj");
const hudBeam = document.getElementById("hudBeam");

const leftCountVal = document.getElementById("leftCountVal");
const rightCountVal = document.getElementById("rightCountVal");
const straightenBtn = document.getElementById("straightenBtn");
const snapSubjectBtn = document.getElementById("snapSubjectBtn");
const clearClutterBtn = document.getElementById("clearClutterBtn");
const toggleGuidesBtn = document.getElementById("toggleGuidesBtn");
const toggleShadeBtn = document.getElementById("toggleShadeBtn");

const tipBanner = document.getElementById("tipBanner");
const diagBadge = document.getElementById("diagBadge");
const diagHeadline = document.getElementById("diagHeadline");
const diagWhy = document.getElementById("diagWhy");
const diagAction = document.getElementById("diagAction");

const stepAxisEl = document.getElementById("step-axis");
const stepSubjectEl = document.getElementById("step-subject");
const stepBalanceEl = document.getElementById("step-balance");
const mAxis = document.getElementById("mAxis");
const mSubj = document.getElementById("mSubj");
const mTorque = document.getElementById("mTorque");
const mBeam = document.getElementById("mBeam");

let lastEval = evaluateHero(heroState);
// 开场阻尼缓动（进入瞬间从轻微摆动自然落到 0/4 翻车态，每帧都好看）
const heroAnim = {
  beamAngleDeg: lastEval.beamAngleDeg + 2.2,
  wavePhase: 0,
};

function syncHeroUI() {
  const ev = evaluateHero(heroState);
  lastEval = ev;

  const pct = Math.round(heroState.axisX * 100);
  const trackRatio = clamp((heroState.axisX - 0.24) / (0.76 - 0.24), 0, 1);
  fulcrumThumb.style.left = `${(trackRatio * 100).toFixed(2)}%`;
  thumbLabel.textContent = `${pct}%`;
  fulcrumTrack.setAttribute("aria-valuenow", String(pct));

  fulcrumRead.textContent = ev.pillars.stabilityOk
    ? `${pct}% · 中轴垂直立正`
    : Math.abs(heroState.axisTilt) > 0.8
      ? `${pct}% · 歪斜 ${heroState.axisTilt > 0 ? "+" : ""}${heroState.axisTilt}°`
      : ev.absAxisOffset > 10.5
        ? `${pct}% · 已滑入偏轴区`
        : `${pct}% · 假中轴偏${ev.axisOffsetPct > 0 ? "右" : "左"} ${ev.axisOffsetPct > 0 ? "+" : ""}${ev.axisOffsetPct}%`;
  fulcrumRead.classList.toggle("is-ok", ev.pillars.stabilityOk);

  topScoreBadge.textContent = ev.score === 4 ? "4 / 4 中轴立稳" : `${ev.score} / 4 待立轴`;
  topScoreBadge.classList.toggle("is-ok", ev.score === 4);
  topScoreBadge.classList.toggle("is-err", ev.score < 4);

  hudAxis.textContent = `中轴 ${pct}%`;
  hudTilt.textContent = heroState.axisTilt === 0 ? "垂直 0°" : `歪斜 ${heroState.axisTilt > 0 ? "+" : ""}${heroState.axisTilt}°`;
  hudSubj.textContent = ev.absSubjDelta <= 1.8 ? "主体骑轴" : `脱轴 ${ev.subjectDeltaPct > 0 ? "+" : ""}${Math.round(ev.subjectDeltaPct)}%`;
  hudBeam.textContent = `天平 ${ev.beamAngleDeg > 0 ? "+" : ""}${ev.beamAngleDeg.toFixed(1)}°`;

  const unitWord = heroState.scene === "mountain" ? "株" : "件";
  leftCountVal.textContent = `${heroState.leftCount} ${unitWord}`;
  rightCountVal.textContent = `${heroState.rightCount} ${unitWord}`;

  straightenBtn.textContent = heroState.axisTilt === 0 ? "轴线已垂直 0°" : `轴线归直 0°`;
  straightenBtn.classList.toggle("is-done", heroState.axisTilt === 0);

  snapSubjectBtn.textContent = ev.absSubjDelta <= 1.8 ? "主体已骑轴" : "主体骑轴";
  snapSubjectBtn.classList.toggle("is-done", ev.absSubjDelta <= 1.8);

  clearClutterBtn.textContent = ev.clutterCount > 0 ? `清杂块 (${ev.clutterCount})` : "角落已清净";
  clearClutterBtn.classList.toggle("is-done", ev.clutterCount === 0);

  // 原海报四枚深蓝圆徽实时同步
  for (const key of ["symmetry", "balance", "focus", "stability"]) {
    const li = document.getElementById(`pillar-${key}`);
    const val = document.getElementById(`pval-${key}`);
    const info = ev.pillarStatus[key];
    li.dataset.ok = String(info.ok);
    val.textContent = info.tag;
  }

  // 深海军蓝 TIP 诊单与三步进度
  tipBanner.dataset.level = ev.diag.level;
  diagBadge.textContent = ev.diag.badge;
  diagHeadline.textContent = ev.diag.headline;
  diagWhy.textContent = ev.diag.why;
  diagAction.textContent = ev.diag.action;

  stepAxisEl.classList.toggle("is-done", ev.steps.axis);
  stepSubjectEl.classList.toggle("is-done", ev.steps.subject);
  stepBalanceEl.classList.toggle("is-done", ev.steps.balance);

  mAxis.textContent = `${ev.axisOffsetPct > 0 ? "+" : ""}${ev.axisOffsetPct.toFixed(1)}%`;
  mSubj.textContent = `${ev.subjectDeltaPct > 0 ? "+" : ""}${ev.subjectDeltaPct.toFixed(1)}%`;
  mTorque.textContent = `${ev.leftTorque.toFixed(1)} / ${ev.rightTorque.toFixed(1)}`;
  mBeam.textContent = `${ev.beamAngleDeg > 0 ? "+" : ""}${ev.beamAngleDeg.toFixed(1)}°`;
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const { ctx, w, h } = fitCanvas(heroCanvas);
  if (still) {
    heroAnim.beamAngleDeg = lastEval.beamAngleDeg;
    heroAnim.wavePhase = 0;
  } else {
    heroAnim.wavePhase = t * 1.4;
    const alpha = dt > 0 ? 1 - Math.exp(-10 * dt) : 0.35;
    heroAnim.beamAngleDeg += (lastEval.beamAngleDeg - heroAnim.beamAngleDeg) * alpha;
  }
  drawHeroStage(ctx, w, h, heroState, lastEval, heroAnim);
});

function setAxisX(nx, snap = true) {
  let v = clamp(nx, 0.24, 0.76);
  if (snap && Math.abs(v - 0.5) < 0.014) v = 0.5;
  heroState.axisX = round1(v * 100) / 100;
  syncHeroUI();
  heroLoop.draw();
}

// 1) 铅垂滑槽交互（兼容鼠标 Pointer + 触控 Touch，供 perf.mjs 的 data-perf-drag 稳定高频触发）
let railDragging = false;
function updateAxisFromClientX(clientX, snap = true) {
  const rect = fulcrumTrack.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  setAxisX(0.24 + ratio * (0.76 - 0.24), snap);
}

fulcrumTrack.addEventListener("pointerdown", (e) => {
  railDragging = true;
  fulcrumTrack.setPointerCapture?.(e.pointerId);
  updateAxisFromClientX(e.clientX, false);
});
fulcrumTrack.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  updateAxisFromClientX(e.clientX, false);
});
fulcrumTrack.addEventListener("pointerup", (e) => {
  if (!railDragging) return;
  railDragging = false;
  updateAxisFromClientX(e.clientX, true);
});
fulcrumTrack.addEventListener("pointercancel", () => {
  railDragging = false;
});
// 额外保底原生 Touch 事件，确保合成 touchStart/touchMove 每次必触发重绘
fulcrumTrack.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length) return;
    railDragging = true;
    updateAxisFromClientX(e.touches[0].clientX, false);
  },
  { passive: true },
);
fulcrumTrack.addEventListener(
  "touchmove",
  (e) => {
    if (!railDragging || !e.touches.length) return;
    updateAxisFromClientX(e.touches[0].clientX, false);
  },
  { passive: true },
);
fulcrumTrack.addEventListener(
  "touchend",
  () => {
    if (!railDragging) return;
    railDragging = false;
    setAxisX(heroState.axisX, true);
  },
  { passive: true },
);

fulcrumTrack.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setAxisX(heroState.axisX - 0.01, false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setAxisX(heroState.axisX + 0.01, false);
  }
});

// 2) 画布内直接拖拽：铅垂轴锤、核心主体、左/右翼配重力臂 + 点击清杂块
let canvasDragTarget = null;
function canvasRel(e) {
  const r = heroCanvas.getBoundingClientRect();
  return {
    nx: clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1),
    ny: clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1),
    w: r.width,
    h: r.height,
  };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const { nx, ny, w, h } = canvasRel(e);

  // 先检测是否点中抢戏杂块
  for (let i = 0; i < CLUTTER_DEFS.length; i++) {
    if (!heroState.clutter[i]) continue;
    const dx = (nx - CLUTTER_DEFS[i].x) * w;
    const dy = (ny - CLUTTER_DEFS[i].y) * h;
    if (Math.hypot(dx, dy) < 34) {
      heroState.clutter[i] = false;
      syncHeroUI();
      heroLoop.draw();
      return;
    }
  }

  // 检测顶部朱橘轴锤或底端天平支点
  const nearAxis = Math.abs(nx - heroState.axisX) < 0.055 && (ny < 0.24 || ny > 0.78);
  if (nearAxis) {
    canvasDragTarget = "axis";
  } else if (Math.abs(nx - heroState.subjectX) < 0.13 && ny >= 0.2 && ny <= 0.74) {
    canvasDragTarget = "subject";
  } else if (heroState.leftCount > 0 && nx < heroState.axisX - 0.06 && ny > 0.35) {
    canvasDragTarget = "leftWing";
  } else if (heroState.rightCount > 0 && nx > heroState.axisX + 0.06 && ny > 0.35) {
    canvasDragTarget = "rightWing";
  } else {
    canvasDragTarget = "axis";
  }
  heroCanvas.setPointerCapture?.(e.pointerId);
  applyCanvasDrag(nx, false);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!canvasDragTarget) return;
  applyCanvasDrag(canvasRel(e).nx, false);
});
heroCanvas.addEventListener("pointerup", (e) => {
  if (!canvasDragTarget) return;
  applyCanvasDrag(canvasRel(e).nx, true);
  canvasDragTarget = null;
});
heroCanvas.addEventListener("pointercancel", () => {
  canvasDragTarget = null;
});

function applyCanvasDrag(nx, snap) {
  if (canvasDragTarget === "axis") {
    setAxisX(nx, snap);
  } else if (canvasDragTarget === "subject") {
    let sx = clamp(nx, 0.22, 0.78);
    if (snap && Math.abs(sx - heroState.axisX) < 0.022) sx = heroState.axisX;
    heroState.subjectX = round1(sx * 100) / 100;
    syncHeroUI();
    heroLoop.draw();
  } else if (canvasDragTarget === "leftWing") {
    heroState.leftArm = round1(clamp(heroState.axisX - nx, 0.15, 0.42) * 100) / 100;
    syncHeroUI();
    heroLoop.draw();
  } else if (canvasDragTarget === "rightWing") {
    heroState.rightArm = round1(clamp(nx - heroState.axisX, 0.15, 0.42) * 100) / 100;
    syncHeroUI();
    heroLoop.draw();
  }
}

// 3) 顶栏与单行微操按钮事件
document.querySelectorAll(".scene-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.scene = btn.dataset.scene;
    document.querySelectorAll(".scene-tab").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    syncHeroUI();
    heroLoop.draw();
  });
});

toggleGuidesBtn.addEventListener("click", () => {
  heroState.showGuides = !heroState.showGuides;
  toggleGuidesBtn.classList.toggle("is-on", heroState.showGuides);
  toggleGuidesBtn.setAttribute("aria-pressed", String(heroState.showGuides));
  toggleGuidesBtn.textContent = heroState.showGuides ? "标尺：显" : "标尺：隐";
  heroLoop.draw();
});

toggleShadeBtn.addEventListener("click", () => {
  heroState.shadingMode = heroState.shadingMode === "subtle" ? "mirror" : "subtle";
  const isSubtle = heroState.shadingMode === "subtle";
  toggleShadeBtn.classList.toggle("is-on", isSubtle);
  toggleShadeBtn.setAttribute("aria-pressed", String(isSubtle));
  toggleShadeBtn.textContent = isSubtle ? "微破光影" : "纯平镜像";
  syncHeroUI();
  heroLoop.draw();
});

document.getElementById("resetBrokenBtn").addEventListener("click", () => {
  Object.assign(heroState, createBrokenHeroState(heroState.scene));
  toggleGuidesBtn.classList.add("is-on");
  toggleGuidesBtn.textContent = "标尺：显";
  toggleShadeBtn.classList.remove("is-on");
  toggleShadeBtn.textContent = "微破光影";
  syncHeroUI();
  heroLoop.draw();
});

document.getElementById("leftMinusBtn").addEventListener("click", () => {
  heroState.leftCount = clamp(heroState.leftCount - 1, 0, 4);
  syncHeroUI();
  heroLoop.draw();
});
document.getElementById("leftPlusBtn").addEventListener("click", () => {
  heroState.leftCount = clamp(heroState.leftCount + 1, 0, 4);
  syncHeroUI();
  heroLoop.draw();
});
document.getElementById("rightMinusBtn").addEventListener("click", () => {
  heroState.rightCount = clamp(heroState.rightCount - 1, 0, 4);
  syncHeroUI();
  heroLoop.draw();
});
document.getElementById("rightPlusBtn").addEventListener("click", () => {
  heroState.rightCount = clamp(heroState.rightCount + 1, 0, 4);
  syncHeroUI();
  heroLoop.draw();
});

straightenBtn.addEventListener("click", () => {
  heroState.axisTilt = heroState.axisTilt === 0 ? 5 : 0;
  syncHeroUI();
  heroLoop.draw();
});
snapSubjectBtn.addEventListener("click", () => {
  heroState.subjectX = heroState.axisX;
  syncHeroUI();
  heroLoop.draw();
});
clearClutterBtn.addEventListener("click", () => {
  const hasAny = heroState.clutter.some(Boolean);
  heroState.clutter = hasAny ? [false, false] : [true, true];
  syncHeroUI();
  heroLoop.draw();
});

// ============================================================
// 01 节：视觉砝码配平槽
// ============================================================
const scaleCanvas = document.getElementById("scaleCanvas");
const tokenGrid = document.getElementById("tokenGrid");
const scaleVerdict = document.getElementById("scaleVerdict");
const slotTokens = [null, null, null];
let activeSlot = 0;

function renderTokenButtons() {
  tokenGrid.innerHTML = "";
  SCALE_TOKENS.forEach((tok) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "token-btn";
    btn.dataset.token = tok.id;
    btn.innerHTML = `<span class="token-top"><span>${tok.name}</span><span class="token-swatch" style="background:${tok.color}"></span></span><span class="token-w">视觉重 ${tok.visualWeight.toFixed(1)}</span>`;
    btn.addEventListener("click", () => {
      slotTokens[activeSlot] = slotTokens[activeSlot] === tok.id ? null : tok.id;
      renderScale();
    });
    tokenGrid.appendChild(btn);
  });
}

function renderScale() {
  const ev = evaluateScalePuzzle(slotTokens);
  SCALE_SLOTS.forEach((s, idx) => {
    const cur = document.getElementById(`slotCur${idx}`);
    const tok = SCALE_TOKENS.find((t) => t.id === slotTokens[idx]);
    cur.textContent = tok ? `${tok.name} (${tok.visualWeight})` : "空";
  });
  document.querySelectorAll(".slot-btn").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.slot) === activeSlot);
  });
  scaleVerdict.textContent = ev.verdict;
  const { ctx, w, h } = fitCanvas(scaleCanvas);
  drawScaleCanvas(ctx, w, h, slotTokens, activeSlot, ev);
}

document.querySelectorAll(".slot-btn").forEach((b) => {
  b.addEventListener("click", () => {
    activeSlot = Number(b.dataset.slot);
    renderScale();
  });
});
document.getElementById("scaleClearBtn").addEventListener("click", () => {
  slotTokens.fill(null);
  renderScale();
});
renderTokenButtons();

// ============================================================
// 02 节：肉眼定轴盲测仪
// ============================================================
const blindCanvas = document.getElementById("blindCanvas");
const blindFeedback = document.getElementById("blindFeedback");
const blindRevealBtn = document.getElementById("blindRevealBtn");
let blindShape = "sail";
let blindShift = 0.14; // 初始故意偏离，避免先给答案
let blindRevealed = false;
let blindDragging = false;
let blindDragStartX = 0;
let blindShiftStart = 0;

function renderBlind() {
  const { ctx, w, h } = fitCanvas(blindCanvas);
  drawBlindCanvas(ctx, w, h, blindShape, blindShift, blindRevealed);
  blindRevealBtn.setAttribute("aria-pressed", String(blindRevealed));
  if (blindRevealed) {
    const ev = evaluateBlindTest(blindShape, blindShift);
    blindFeedback.textContent = ev.judgment;
  } else {
    blindFeedback.textContent = "中轴参考线已隐藏。左右拖动画面里的形体（或点微调按钮），凭肉眼把它摆到「看起来正中」的位置，再按「落垂线验真」。";
  }
}

blindCanvas.addEventListener("pointerdown", (e) => {
  blindDragging = true;
  blindDragStartX = e.clientX;
  blindShiftStart = blindShift;
  blindCanvas.setPointerCapture?.(e.pointerId);
});
blindCanvas.addEventListener("pointermove", (e) => {
  if (!blindDragging) return;
  const rect = blindCanvas.getBoundingClientRect();
  const dx = (e.clientX - blindDragStartX) / Math.max(1, rect.width);
  blindShift = round1(clamp(blindShiftStart + dx, -0.22, 0.22) * 1000) / 1000;
  renderBlind();
});
blindCanvas.addEventListener("pointerup", () => {
  blindDragging = false;
});
blindCanvas.addEventListener("pointercancel", () => {
  blindDragging = false;
});

document.querySelectorAll("[data-blind]").forEach((btn) => {
  btn.addEventListener("click", () => {
    blindShape = btn.dataset.blind;
    blindShift = blindShape === "pagoda" ? -0.13 : 0.14;
    blindRevealed = false;
    document.querySelectorAll("[data-blind]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderBlind();
  });
});

document.getElementById("blindNudgeL").addEventListener("click", () => {
  blindShift = clamp(blindShift - 0.015, -0.22, 0.22);
  renderBlind();
});
document.getElementById("blindNudgeR").addEventListener("click", () => {
  blindShift = clamp(blindShift + 0.015, -0.22, 0.22);
  renderBlind();
});
blindRevealBtn.addEventListener("click", () => {
  blindRevealed = true;
  renderBlind();
});
document.getElementById("blindGeomBtn").addEventListener("click", () => {
  blindShift = 0;
  blindRevealed = true;
  renderBlind();
});
document.getElementById("blindResetBtn").addEventListener("click", () => {
  blindShift = blindShape === "pagoda" ? -0.14 : 0.14;
  blindRevealed = false;
  renderBlind();
});

// ============================================================
// 03 节：四时代中轴蓝图剖视
// ============================================================
const eraCanvas = document.getElementById("eraCanvas");
const eraYearTag = document.getElementById("eraYearTag");
const eraCaption = document.getElementById("eraCaption");
const ERA_COPY = {
  vitruvius: {
    tag: "公元前 1 世纪 · 罗马",
    html: "<strong>古罗马纵轴神庙秩序（维特鲁威《建筑十书》）</strong>：入口台阶、门廊柱列与内殿神像串联在唯一纵轴上，行进路径与视线路径合二为一。",
  },
  beijing: {
    tag: "13 世纪至今 · 2024 UNESCO",
    html: "<strong>北京中轴线（7.8 公里）</strong>：北起钟鼓楼、南至永定门，故宫居中、左祖右社呼应，以《考工记》都城中轴礼制统摄整座历史都城。",
  },
  palladio: {
    tag: "1570 · 威尼斯《建筑四书》",
    html: "<strong>帕拉第奥圆厅别墅（Villa Rotonda）</strong>：方形主体内嵌中央圆厅，四向相同柱廊沿两条正交中轴展开，向四周乡野均衡敞开。",
  },
  tschichold: {
    tag: "1928 柏林 → 1947 伦敦",
    html: "<strong>扬·奇肖尔德的世纪反转</strong>：1928 年在《新字体排印》中反对僵化居中；1947 年重塑英国企鹅图书时，又让古典中轴回归书扉与封面——各有归属。",
  },
};
let activeEra = "vitruvius";

const eraLoop = loop(eraCanvas, (t, _dt, { still }) => {
  const { ctx, w, h } = fitCanvas(eraCanvas);
  drawEraBlueprint(ctx, w, h, activeEra, still ? 0 : t);
});

document.querySelectorAll(".era-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeEra = btn.dataset.era;
    document.querySelectorAll(".era-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    eraYearTag.textContent = ERA_COPY[activeEra].tag;
    eraCaption.innerHTML = ERA_COPY[activeEra].html;
    eraLoop.draw();
  });
});

// ============================================================
// 04 节：原海报四景中轴解剖
// ============================================================
const exampleLayers = { axis: true, mass: true, flow: false };
const exCanvases = [...document.querySelectorAll(".ex-canvas")];

function renderExamples() {
  exCanvases.forEach((cv) => {
    const { ctx, w, h } = fitCanvas(cv);
    drawExampleCard(ctx, w, h, cv.dataset.ex, exampleLayers);
  });
}

document.querySelectorAll(".layer-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    exampleLayers[k] = !exampleLayers[k];
    btn.classList.toggle("is-active", exampleLayers[k]);
    btn.setAttribute("aria-pressed", String(exampleLayers[k]));
    renderExamples();
  });
});

// ============================================================
// 05 节：强行中轴翻车对照闸
// ============================================================
const antiCanvas = document.getElementById("antiCanvas");
const antiCaption = document.getElementById("antiCaption");
const ANTI_COPY = {
  essay: {
    forced: "<strong>硬套中轴的长段正文</strong>：六行文字全部居中，左缘像锯齿一样来回跳动，视线每次换行都要重新寻找起笔点。",
    better: "<strong>改为左对齐正文</strong>：只保留清晰左缘锚线，视线换行一落即准；中轴留给书扉或三行以内的独立题签。",
  },
  sprint: {
    forced: "<strong>硬套中轴的冲刺帆艇</strong>：船身被钉在正中，前方与后方空间一样宽，速度感瞬间被冻成静态标本。",
    better: "<strong>改为偏轴前向留白</strong>：帆艇退居左侧三分位并微微前倾，前方留出 65% 开阔水域，动势立刻奔涌而出。",
  },
  spec: {
    forced: "<strong>硬套中轴的参数卡片</strong>：文字长短不一却强行居中堆叠，规格项与数值对不齐，用户一眼扫不到重点。",
    better: "<strong>改为双轴左图右表</strong>：左侧一条视觉轴稳住器皿，右侧一条文字锚线整齐列出规格，美观与效率兼得。",
  },
};
let antiScene = "essay";
let antiMode = "forced";

function renderAnti() {
  const { ctx, w, h } = fitCanvas(antiCanvas);
  drawAntiExample(ctx, w, h, antiScene, antiMode);
  antiCaption.innerHTML = ANTI_COPY[antiScene][antiMode];
}

document.querySelectorAll("[data-anti]").forEach((btn) => {
  btn.addEventListener("click", () => {
    antiScene = btn.dataset.anti;
    document.querySelectorAll("[data-anti]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderAnti();
  });
});
document.querySelectorAll("[data-antimode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    antiMode = btn.dataset.antimode;
    document.querySelectorAll("[data-antimode]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    renderAnti();
  });
});

// ============================================================
// 06 节：单变量挑一挑实战练习
// ============================================================
const quizPrompt = document.getElementById("quizPrompt");
const quizGrid = document.getElementById("quizGrid");
const quizExplain = document.getElementById("quizExplain");
let quizIndex = 0;
let pickedKey = null;

function renderQuiz() {
  const q = QUIZ_BANK[quizIndex];
  quizPrompt.textContent = q.prompt;
  quizGrid.innerHTML = "";

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.opt = opt.key;
    if (pickedKey) {
      if (opt.key === pickedKey) btn.classList.add(opt.correct ? "is-picked-ok" : "is-picked-err");
      else if (opt.correct) btn.classList.add("is-reveal-ok");
    }

    const cv = document.createElement("canvas");
    cv.className = "quiz-canvas";
    cv.setAttribute("aria-label", `构图候选方案 ${opt.key}`);

    const foot = document.createElement("div");
    foot.className = "quiz-card-foot";
    const statusText = pickedKey ? (opt.correct ? "稳妥方案" : "存在偏失") : "点击选择";
    foot.innerHTML = `<span>方案 ${opt.key}</span><span class="quiz-tag">${statusText}</span>`;

    btn.append(cv, foot);
    btn.addEventListener("click", () => {
      pickedKey = opt.key;
      renderQuiz();
    });
    quizGrid.appendChild(btn);

    // 同步绘制缩样
    requestAnimationFrame(() => {
      const { ctx, w, h } = fitCanvas(cv);
      drawQuizThumb(ctx, w, h, opt);
    });
  });

  if (!pickedKey) {
    quizExplain.textContent = "先仔细观察四张草图里的中轴、主体、两翼配重与底栏文字，选出你认为立得最稳的一张（只标方案 A–D，不含剧透提示）。";
  } else {
    const picked = q.options.find((o) => o.key === pickedKey);
    const items = q.options
      .map(
        (o) =>
          `<li><strong>方案 ${o.key}</strong>（${Object.values(o.metrics).join(" · ")}）：${o.reason}</li>`,
      )
      .join("");
    quizExplain.innerHTML = `<p style="margin:0"><strong>${picked.correct ? `选对了，正是方案 ${picked.key}！` : `你选了方案 ${picked.key}，再对照一下各方案唯一的变量差：`}</strong></p><ul>${items}</ul>`;
  }
}

document.querySelectorAll("[data-quiz]").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizIndex = Number(btn.dataset.quiz);
    pickedKey = null;
    document.querySelectorAll("[data-quiz]").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderQuiz();
  });
});

// ============================================================
// 07 节：原海报灯箱（复用 #poster.src，绝不二次内联）
// ============================================================
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("posterLightbox");
const lbImg = document.getElementById("lbImg");
const lbViewport = document.getElementById("lbViewport");
const lbZoomVal = document.getElementById("lbZoomVal");

let lbZoom = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbZoom})`;
  lbZoomVal.textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbZoom = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lbClose").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("posterOpenBtn").focus();
}

document.getElementById("posterOpenBtn").addEventListener("click", openLightbox);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbZoomIn").addEventListener("click", () => {
  lbZoom = clamp(lbZoom + 0.3, 0.7, 3.4);
  applyLbTransform();
});
document.getElementById("lbZoomOut").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.3, 0.7, 3.4);
  applyLbTransform();
});
document.getElementById("lbReset").addEventListener("click", () => {
  lbZoom = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
});

lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.4);
    applyLbTransform();
  },
  { passive: false },
);

lbViewport.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbStartX = e.clientX - lbX;
  lbStartY = e.clientY - lbY;
  lbViewport.setPointerCapture?.(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbStartX;
  lbY = e.clientY - lbStartY;
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbDrag = false;
});
lbViewport.addEventListener("pointercancel", () => {
  lbDrag = false;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ============================================================
// 初始化与窗口尺寸变化响应
// ============================================================
function renderAllStatic() {
  syncHeroUI();
  heroLoop.draw();
  renderScale();
  renderBlind();
  eraLoop.draw();
  renderExamples();
  renderAnti();
  // 重绘练习卡片画布
  const q = QUIZ_BANK[quizIndex];
  quizGrid.querySelectorAll(".quiz-canvas").forEach((cv, idx) => {
    if (!q.options[idx]) return;
    const { ctx, w, h } = fitCanvas(cv);
    drawQuizThumb(ctx, w, h, q.options[idx]);
  });
}

renderQuiz();
renderAllStatic();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderAllStatic, 80);
});
reducedMotion.addEventListener("change", renderAllStatic);
