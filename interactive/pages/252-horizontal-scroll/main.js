// 252 横向卷轴 · 主控器：联结单真源模型、片窗舞台、三栏控制台与七节互动
import { evaluate, INITIAL_STATE, PRESETS, THEMES } from "./model.js";
import { createReelStage } from "./stage.js";
import { initSections } from "./sections.js";

const $ = (id) => document.getElementById(id);

const state = { ...INITIAL_STATE };
let latestDiag = null;
let lastSyncText = "";

const canvas = $("reel-canvas");
const btnPrev = $("btn-prev");
const btnNext = $("btn-next");
const dotRail = $("dot-rail");
const btnXray = $("btn-xray");
const ctlRatio = $("ctl-ratio");
const outRatio = $("out-ratio");
const btnFix = $("btn-fix");
const btnCssToggle = $("btn-css-toggle");
const liveCssPanel = $("live-css-panel");
const liveCssCode = $("live-css-code");

const arrowShaft = $("title-arrow-shaft");
const arrowHead = $("title-arrow-head");
const arrowDash = $("title-arrow-dash");

const gestureBar = $("gesture-bar");
const gestureTelemetry = $("gesture-telemetry");

function buildDots() {
  const cards = THEMES[state.theme].cards;
  dotRail.innerHTML = "";
  cards.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "rail-dot";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `滑到第 ${c.num} 卡：${c.zh}`);
    b.addEventListener("click", () => stage.scrollToIndex(i));
    dotRail.appendChild(b);
  });
}

function updateTitleArrow(progress) {
  // 标题右侧珊瑚粉长箭随卷轴进度在 x=92..196 之间伸展，标题自己就是横向卷轴的活示范！
  const tipX = Math.round(108 + progress * 86);
  arrowShaft.setAttribute("x2", String(tipX - 14));
  arrowHead.setAttribute("points", `${tipX - 18},4 ${tipX},14 ${tipX - 18},24`);
  arrowDash.setAttribute("x1", String(Math.min(246, tipX + 12)));
}

function syncButtons() {
  ctlRatio.value = String(Math.round(state.cardRatio * 100));
  outRatio.textContent = `${Math.round(state.cardRatio * 100)}%`;

  document.querySelectorAll("[data-theme]").forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-snap]").forEach((b) => {
    const on = b.dataset.snap === state.snap;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-pad]").forEach((b) => {
    const on = +b.dataset.pad === state.edgePad;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-cues]").forEach((b) => {
    const on = b.dataset.cues === state.cues;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-physics]").forEach((b) => {
    const on = b.dataset.physics === state.physics;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  btnXray.setAttribute("aria-pressed", String(state.xray));
  btnXray.textContent = state.xray ? "透视窗外：开" : "纯真视窗（遮窗外）";

  const showArrows = state.cues === "full";
  btnPrev.hidden = !showArrows;
  btnNext.hidden = !showArrows;
  dotRail.classList.toggle("is-hidden", state.cues === "none");
}

function syncReadout(geom, moving = false) {
  const diag = evaluate(state, geom, { moving });
  latestDiag = diag;

  updateTitleArrow(geom.progress);

  // 更新进度点激活状态
  const activeIdx = geom.leadCard.index;
  dotRail.querySelectorAll(".rail-dot").forEach((d, i) => {
    d.classList.toggle("is-active", i === activeIdx);
    d.setAttribute("aria-selected", String(i === activeIdx));
  });

  // 节流文本 DOM 写入（滑动中只写有变化的字段，保证 60fps 零布局抖动）
  const sig = `${diag.status}|${diag.badge}|${diag.headline}|${geom.peekPct}|${geom.focusIntegrity}|${geom.phoneCardW}|${diag.pillars.flow.tag}|${diag.pillars.window.tag}|${diag.pillars.continuity.tag}`;
  if (sig === lastSyncText) return;
  lastSyncText = sig;

  const pill = $("hero-status");
  pill.dataset.level = diag.status;
  $("hero-status-text").textContent = diag.badge;

  const box = $("diag-box");
  box.dataset.level = diag.status;
  $("diag-headline").textContent = diag.headline;
  $("diag-body").textContent = diag.body;

  $("m-peek").textContent = geom.focusIntegrity < 84
    ? "中缝腰斩"
    : geom.atEnd
      ? "抵终点"
      : `${geom.peekPct}% (${geom.peekPx}px)`;
  $("m-focus").textContent = `${geom.focusIntegrity}%`;
  $("m-phone").textContent = `${geom.phoneCardW}px`;

  const setPillar = (id, p) => {
    const el = $(id);
    el.dataset.level = p.state;
    el.textContent = p.tag;
  };
  setPillar("badge-flow", diag.pillars.flow);
  setPillar("badge-window", diag.pillars.window);
  setPillar("badge-cue", diag.pillars.continuity);

  if (diag.action) {
    btnFix.hidden = false;
    btnFix.textContent = diag.action.label;
  } else {
    btnFix.hidden = true;
  }

  liveCssCode.textContent = diag.cssCode;
}

function syncTelemetry({ phase, deltaPx, velPx }) {
  gestureBar.dataset.phase = phase;
  gestureBar.querySelectorAll(".g-step").forEach((el) => {
    el.classList.toggle("is-lit", el.dataset.step === phase);
  });
  if (phase === "hold") {
    gestureTelemetry.textContent = "1/3 按住内容 HOLD · 准备拖动";
  } else if (phase === "drag") {
    gestureTelemetry.textContent = `2/3 拖动中 位移 ${deltaPx >= 0 ? "+" : ""}${deltaPx}px · 速度 ${Math.abs(velPx)}px/s`;
  } else if (phase === "release") {
    gestureTelemetry.textContent = `3/3 松手惯性滑行 · 衰减 ${Math.abs(velPx)}px/s`;
  } else {
    gestureTelemetry.textContent = "待命 · 按住画布左拖右甩实时测速";
  }
}

const stage = createReelStage(canvas, () => state, {
  onStateSync: syncReadout,
  onTelemetry: syncTelemetry,
});

function applyPatch(patch, snapScroll = false) {
  stage.stopMotion();
  const { scrollIndex: nextIdx, ...rest } = patch;
  Object.assign(state, rest);
  syncButtons();
  if (snapScroll && nextIdx !== undefined) {
    stage.scrollToIndex(nextIdx, false);
  } else {
    if (nextIdx !== undefined) state.scrollIndex = nextIdx;
    syncReadout(stage.getGeometry(), false);
    stage.draw();
  }
}

// ---------- 控件事件绑定 ----------
document.querySelectorAll("[data-theme]").forEach((b) =>
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    buildDots();
    syncButtons();
    syncReadout(stage.getGeometry(), false);
    stage.draw();
  })
);

ctlRatio.addEventListener("input", () => {
  stage.stopMotion();
  state.cardRatio = Number(ctlRatio.value) / 100;
  outRatio.textContent = `${ctlRatio.value}%`;
  syncReadout(stage.getGeometry(), false);
  stage.draw();
});

document.querySelectorAll("[data-snap]").forEach((b) =>
  b.addEventListener("click", () => {
    const mode = b.dataset.snap;
    applyPatch({ snap: mode });
    if (mode === "mandatory") {
      stage.scrollToIndex(Math.round(state.scrollIndex));
    }
  })
);

document.querySelectorAll("[data-pad]").forEach((b) =>
  b.addEventListener("click", () => applyPatch({ edgePad: Number(b.dataset.pad) }))
);

document.querySelectorAll("[data-cues]").forEach((b) =>
  b.addEventListener("click", () => applyPatch({ cues: b.dataset.cues }))
);

document.querySelectorAll("[data-physics]").forEach((b) =>
  b.addEventListener("click", () => applyPatch({ physics: b.dataset.physics }))
);

btnXray.addEventListener("click", () => applyPatch({ xray: !state.xray }));

btnPrev.addEventListener("click", () => stage.nudge(-1));
btnNext.addEventListener("click", () => stage.nudge(1));

btnFix.addEventListener("click", () => {
  if (!latestDiag?.action?.patch) return;
  applyPatch(latestDiag.action.patch, true);
});

btnCssToggle.addEventListener("click", () => {
  const open = liveCssPanel.hidden;
  liveCssPanel.hidden = !open;
  btnCssToggle.setAttribute("aria-expanded", String(open));
  btnCssToggle.textContent = open ? "收起实时 CSS" : "看实时 CSS";
});

document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    applyPatch(p.patch, true);
  })
);

canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    stage.nudge(1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    stage.nudge(-1);
  } else if (e.key === "PageDown") {
    e.preventDefault();
    stage.nudge(2);
  } else if (e.key === "PageUp") {
    e.preventDefault();
    stage.nudge(-2);
  }
});

// 初始化
buildDots();
syncButtons();
syncReadout(stage.getGeometry(), false);
stage.draw();
initSections();
