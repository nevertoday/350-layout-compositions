import { loop, reducedMotion } from "../../lib/stage.js";
import { analyzePoster, clamp, DEFAULT_STATE, LIMITS, TITLE_WEIGHTS } from "./model.js";
import { createPosterStage } from "./poster-stage.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);

const board = $("poster-board");
const svgHost = $("poster-svg-host");
const callout = $("poster-callout");
const titleEl = $("title");
const titleBlock = $("poster-title-block");
const circleGrip = $("circle-grip");
const arcGrip = $("arc-grip");
const dotsHit = $("dots-hit");
const hatchesHit = $("hatches-hit");
const weightBtn = $("weight-cycle-btn");
const resetBtn = $("poster-reset");

const state = { ...DEFAULT_STATE };

// 开场动画：正常模式下珊瑚圆与左下暗弧从轻盈收起态顺滑展开至原海报比例（0.08s ~ 0.85s），
// 0.9s 截图时已稳稳停在原海报偏心状态；减少动态效果下直接画终点。
const animateIntro = !reducedMotion.matches;
const shown = {
  circleR: animateIntro ? 0.065 : DEFAULT_STATE.circleR,
  arcThick: animateIntro ? 0.14 : DEFAULT_STATE.arcThick,
};

const stage = createPosterStage(svgHost);
let activeDrag = ""; // "" | "circle" | "arc"
let userTouched = false;
let lastMetrics = null;
let boardW = 1160;
let boardH = 610;

function isPortraitBoard() {
  return boardW / Math.max(1, boardH) < 1.15;
}

function getCalloutAnchor() {
  if (!callout || isPortraitBoard()) return null;
  const sr = svgHost.getBoundingClientRect();
  const cr = callout.getBoundingClientRect();
  if (!cr.width || !cr.height) return null;
  return {
    x: cr.right - sr.left + 8,
    y: cr.top - sr.top + 18,
  };
}

function syncTextAndControls(info) {
  const s = info.state;

  // 标题真实字重响应（不仅改状态数值，版面上的标题墨量真的变轻/变重）
  titleEl.style.fontWeight = String(s.titleWeight);
  titleBlock.dataset.weight = String(s.titleWeight);
  board.dataset.zone = info.zone;

  // 引线标注读数（桌面端直接在海报内，手机端紧贴海报底沿）
  const badge = $("co-badge");
  badge.textContent = info.badge;
  badge.dataset.zone = info.zone;
  $("co-ecc").textContent = `合成重心偏离 ${info.eccPct}%`;
  $("co-counter").textContent = info.counterText;
  $("co-headline").textContent = info.headline;
  $("co-reason").textContent = info.reason;

  // 直接贴在元素旁/下方速控条的同步显示
  const wLabel = s.titleWeight === 400 ? "细 400" : s.titleWeight === 700 ? "粗 700" : "极粗 900";
  weightBtn.textContent = `字重 ${wLabel}`;
  weightBtn.setAttribute("aria-label", `标题字重当前为 ${wLabel}，点击切换细、粗、极粗`);

  dotsHit.setAttribute("aria-pressed", String(s.showDots));
  dotsHit.dataset.on = String(s.showDots);
  $("dots-tag").textContent = s.showDots ? "点阵 · 开" : "点阵 · 关";

  hatchesHit.setAttribute("aria-pressed", String(s.showHatches));
  hatchesHit.dataset.on = String(s.showHatches);
  $("hatches-tag").textContent = s.showHatches ? "斜线 · 开" : "斜线 · 关";

  // 手机与键盘快捷条同步
  const dockWeight = $("dock-weight");
  const dockDots = $("dock-dots");
  const dockHatches = $("dock-hatches");
  const dockCircleVal = $("dock-circle-val");
  const dockArcVal = $("dock-arc-val");
  if (dockWeight) dockWeight.textContent = `标题 ${wLabel}`;
  if (dockDots) {
    dockDots.setAttribute("aria-pressed", String(s.showDots));
    dockDots.textContent = s.showDots ? "点阵：开" : "点阵：关";
  }
  if (dockHatches) {
    dockHatches.setAttribute("aria-pressed", String(s.showHatches));
    dockHatches.textContent = s.showHatches ? "斜线：开" : "斜线：关";
  }
  if (dockCircleVal) dockCircleVal.textContent = `${info.circlePct}%`;
  if (dockArcVal) dockArcVal.textContent = s.arcThick <= 0.01 ? "收起" : `${info.arcPct}%`;

  // 无障碍读数
  circleGrip.setAttribute("aria-valuenow", String(info.circlePct));
  circleGrip.setAttribute("aria-valuetext", `珊瑚圆大小 ${info.circlePct}%，${info.badge}，${info.counterText}`);
  arcGrip.setAttribute("aria-valuenow", String(info.arcPct));
  arcGrip.setAttribute("aria-valuetext", `左下暗弧厚度 ${info.arcPct}%，${info.badge}，${info.counterText}`);

  // 复原按钮状态
  const isDefault =
    Math.abs(s.circleR - DEFAULT_STATE.circleR) < 0.004 &&
    Math.abs(s.arcThick - DEFAULT_STATE.arcThick) < 0.02 &&
    s.titleWeight === DEFAULT_STATE.titleWeight &&
    s.showDots === DEFAULT_STATE.showDots &&
    s.showHatches === DEFAULT_STATE.showHatches;
  if (resetBtn) resetBtn.disabled = isDefault;
  const dockReset = $("dock-reset");
  if (dockReset) dockReset.disabled = isDefault;
}

function positionDirectControls(m) {
  // 珊瑚圆边缘拖柄：精准锚在圆的右沿 (cx + cr, cy)，向右拖放大、向左拖缩小，彻底远离中央重心符号
  circleGrip.style.left = `${(m.cx + m.cr).toFixed(1)}px`;
  circleGrip.style.top = `${m.cy.toFixed(1)}px`;

  // 左下暗弧边缘拖柄：精准锚在 45° 外沿
  arcGrip.style.left = `${m.arcGripX.toFixed(1)}px`;
  arcGrip.style.top = `${m.arcGripY.toFixed(1)}px`;

  // 5×5 点阵原生点击热区（不小于 44×44）
  const dw = Math.max(48, m.dotSpan + 20);
  const dh = Math.max(48, m.dotSpan + 20);
  dotsHit.style.left = `${(m.dotX0 + m.dotSpan / 2 - dw / 2).toFixed(1)}px`;
  dotsHit.style.top = `${(m.dotY0 + m.dotSpan / 2 - dh / 2).toFixed(1)}px`;
  dotsHit.style.width = `${dw.toFixed(1)}px`;
  dotsHit.style.height = `${dh.toFixed(1)}px`;

  // 右下 45° 斜线原生点击热区
  const hw = Math.max(54, m.hSize + 14);
  const hh = Math.max(54, m.hSize + 14);
  hatchesHit.style.left = `${(m.hx0 + m.hSize - hw + 6).toFixed(1)}px`;
  hatchesHit.style.top = `${(m.hy0 - hh + 6).toFixed(1)}px`;
  hatchesHit.style.width = `${hw.toFixed(1)}px`;
  hatchesHit.style.height = `${hh.toFixed(1)}px`;
}

function renderNow(t, dt, still) {
  if (still) {
    shown.circleR = state.circleR;
    shown.arcThick = state.arcThick;
  } else if (animateIntro && !userTouched && t < 0.92) {
    const p = clamp((t - 0.06) / 0.74, 0, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    shown.circleR = 0.065 + (state.circleR - 0.065) * ease;
    shown.arcThick = 0.14 + (state.arcThick - 0.14) * ease;
  } else {
    const k = dt ? 1 - Math.exp(-dt * (activeDrag ? 42 : 16)) : 1;
    shown.circleR += (state.circleR - shown.circleR) * k;
    shown.arcThick += (state.arcThick - shown.arcThick) * k;
  }

  const shownInfo = analyzePoster(
    { ...state, circleR: shown.circleR, arcThick: shown.arcThick },
    isPortraitBoard()
  );
  lastMetrics = stage.render(shownInfo, {
    dragging: activeDrag,
    calloutAnchor: getCalloutAnchor(),
  });
  positionDirectControls(lastMetrics);

  // 静置后若已收敛则不再改 DOM（省电且让 perf 静置页干净）
  if (
    !still &&
    (userTouched || t >= 0.92) &&
    Math.abs(shown.circleR - state.circleR) < 0.0004 &&
    Math.abs(shown.arcThick - state.arcThick) < 0.001
  ) {
    shown.circleR = state.circleR;
    shown.arcThick = state.arcThick;
  }
}

// 驱动开场与缓动；无变化时极轻，拖动手柄时每帧立即重绘
let needsPaint = true;
const view = loop(board, (t, dt, { still }) => {
  const settling =
    !still &&
    ((animateIntro && !userTouched && t < 0.95) ||
      Math.abs(shown.circleR - state.circleR) >= 0.0004 ||
      Math.abs(shown.arcThick - state.arcThick) >= 0.001);
  if (!needsPaint && !settling && !activeDrag) return;
  needsPaint = false;
  renderNow(t, dt, still);
});

function commitChange(patch) {
  userTouched = true;
  Object.assign(state, patch);
  state.circleR = clamp(state.circleR, LIMITS.circleMin, LIMITS.circleMax);
  state.arcThick = clamp(state.arcThick, LIMITS.arcMin, LIMITS.arcMax);
  if (reducedMotion.matches || activeDrag) {
    shown.circleR = state.circleR;
    shown.arcThick = state.arcThick;
  }
  const info = analyzePoster(state, isPortraitBoard());
  syncTextAndControls(info);
  needsPaint = true;
  view.draw();
}

function resizeBoard() {
  const r = svgHost.getBoundingClientRect();
  boardW = Math.max(240, Math.round(r.width));
  boardH = Math.max(180, Math.round(r.height));
  stage.resize(boardW, boardH);
  const info = analyzePoster(state, isPortraitBoard());
  syncTextAndControls(info);
  needsPaint = true;
  view.draw();
}
new ResizeObserver(resizeBoard).observe(svgHost);

// ---------- 1. 拖珊瑚圆右缘调大小（向右拉大、向左收小；桌面 1:1 贴合圆缘，手机放宽手势行程） ----------
let circleStartX = 0;
let circleStartR = DEFAULT_STATE.circleR;

function updateCircleFromClient(clientX) {
  if (!lastMetrics) return;
  if (isPortraitBoard()) {
    const nextR = clamp(
      circleStartR + (clientX - circleStartX) / (lastMetrics.W * 1.95),
      LIMITS.circleMin,
      LIMITS.circleMax
    );
    commitChange({ circleR: nextR });
    return;
  }
  const sr = svgHost.getBoundingClientRect();
  const px = clientX - sr.left;
  const desiredR = Math.max(12, px - lastMetrics.cx);
  const nextCircleR = clamp(desiredR / (lastMetrics.base * 1.04), LIMITS.circleMin, LIMITS.circleMax);
  commitChange({ circleR: nextCircleR });
}

circleGrip.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  try { circleGrip.setPointerCapture(e.pointerId); } catch {}
  circleGrip.focus({ preventScroll: true });
  activeDrag = "circle";
  circleStartX = e.clientX;
  circleStartR = state.circleR;
  board.classList.add("is-dragging");
  callout?.setAttribute("aria-live", "off");
});
circleGrip.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.008 : 0.02;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    commitChange({ circleR: state.circleR + step });
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    commitChange({ circleR: state.circleR - step });
  }
});

// ---------- 2. 拖左下暗弧外沿调厚薄（可拖到 0 收起） ----------
function updateArcFromClient(clientX, clientY) {
  if (!lastMetrics) return;
  const sr = svgHost.getBoundingClientRect();
  const px = clientX - sr.left;
  const py = clientY - sr.top;
  const distFromCorner = Math.hypot(Math.max(0, px), Math.max(0, lastMetrics.H - py));
  const span = Math.max(10, lastMetrics.arcMaxOut - lastMetrics.arcIn);
  const raw = (distFromCorner - lastMetrics.arcIn) / span;
  const nextThick = raw < 0.14 ? 0 : clamp((raw - 0.14) / 0.86, 0, 1);
  commitChange({ arcThick: nextThick });
}

arcGrip.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  try { arcGrip.setPointerCapture(e.pointerId); } catch {}
  arcGrip.focus({ preventScroll: true });
  activeDrag = "arc";
  board.classList.add("is-dragging");
  callout?.setAttribute("aria-live", "off");
});

// 统一在 window 上接管拖动中的 pointermove / pointerup，快甩鼠标也不丢帧不脱手
window.addEventListener("pointermove", (e) => {
  if (activeDrag === "circle") updateCircleFromClient(e.clientX);
  else if (activeDrag === "arc") updateArcFromClient(e.clientX, e.clientY);
});
const endAnyDrag = () => {
  if (!activeDrag) return;
  activeDrag = "";
  board.classList.remove("is-dragging");
  callout?.setAttribute("aria-live", "polite");
  needsPaint = true;
  view.draw();
};
window.addEventListener("pointerup", endAnyDrag);
window.addEventListener("pointercancel", endAnyDrag);
arcGrip.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.05 : 0.12;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    commitChange({ arcThick: state.arcThick + step });
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    commitChange({ arcThick: state.arcThick - step });
  }
});

// ---------- 3. 点击直接改标题字重、切换点阵、切换斜线、复原海报 ----------
function cycleTitleWeight() {
  const idx = TITLE_WEIGHTS.indexOf(state.titleWeight);
  const next = TITLE_WEIGHTS[(idx + 1) % TITLE_WEIGHTS.length];
  commitChange({ titleWeight: next });
}

weightBtn.addEventListener("click", cycleTitleWeight);
titleEl.addEventListener("click", cycleTitleWeight);

dotsHit.addEventListener("click", () => commitChange({ showDots: !state.showDots }));
hatchesHit.addEventListener("click", () => commitChange({ showHatches: !state.showHatches }));

function resetPoster() {
  commitChange({ ...DEFAULT_STATE });
}
resetBtn?.addEventListener("click", resetPoster);

// 手机端紧接海报底沿的同屏触控条（同样支持桌面键盘）
$("dock-circle-dec")?.addEventListener("click", () => commitChange({ circleR: state.circleR - 0.025 }));
$("dock-circle-inc")?.addEventListener("click", () => commitChange({ circleR: state.circleR + 0.025 }));
$("dock-arc-dec")?.addEventListener("click", () => commitChange({ arcThick: state.arcThick <= 0.18 ? 0 : state.arcThick - 0.2 }));
$("dock-arc-inc")?.addEventListener("click", () => commitChange({ arcThick: state.arcThick + 0.2 }));
$("dock-weight")?.addEventListener("click", cycleTitleWeight);
$("dock-dots")?.addEventListener("click", () => commitChange({ showDots: !state.showDots }));
$("dock-hatches")?.addEventListener("click", () => commitChange({ showHatches: !state.showHatches }));
$("dock-reset")?.addEventListener("click", resetPoster);

resizeBoard();
initLabs();
