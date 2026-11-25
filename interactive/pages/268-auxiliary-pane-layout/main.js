import { reducedMotion } from "../../lib/stage.js";
import { createHero } from "./hero.js";
import {
  initEnterModeLab,
  initLightbox,
  initLinkLab,
  initModalLab,
  initQuiz,
  initReveal,
  initScenariosLab,
  initStressLab,
} from "./labs.js";
import {
  clamp,
  describeWidth,
  MAX_AUX_PX,
  REF_VIEWPORT_PX,
  SCENARIOS,
  snapAuxPx,
  SWEET_AUX_PX,
} from "./model.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  scenario: "analysis",
  auxPx: SWEET_AUX_PX,
  collapsed: false,
  lastAuxPx: SWEET_AUX_PX,
  filterOn: false,
  focusIdx: 0,
  activeAux: "notes",
  dragging: false,
};

const stage = $("hero-stage");
const canvas = $("hero-canvas");
const sash = $("hero-sash");
const auxPaneEl = $("hero-aux-pane");

let geom = { fx: 16, fy: 14, fw: 560, fh: 300, splitX: 420, rulerY: 336 };
let lastSashTf = "";
let lastSashH = "";

const hero = createHero(canvas, stage, state, (g) => {
  geom = g;
  const x = clamp(g.splitX, g.fx + 10, g.fx + g.fw - 10).toFixed(1);
  const y = (g.fy + g.fh * 0.5).toFixed(1);
  const tf = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  const hStr = `${Math.max(110, g.fh - 16).toFixed(0)}px`;
  if (tf !== lastSashTf) { sash.style.transform = tf; lastSashTf = tf; }
  if (hStr !== lastSashH) { sash.style.height = hStr; lastSashH = hStr; }
});

let lastUiKey = "";
let lastFocusKey = "";
let lastAuxPaneKey = "";
let lastStatusKey = "";
let lastPxKey = "";

function pulseAuxLive() {
  if (reducedMotion.matches) return;
  const body = $("aux-live-body");
  if (!body) return;
  body.classList.remove("flash");
  void body.offsetWidth;
  body.classList.add("flash");
}

function syncUI() {
  const scen = SCENARIOS[state.scenario] || SCENARIOS.analysis;
  const focus = scen.focusItems[state.focusIdx] || scen.focusItems[0];
  const info = describeWidth(state.auxPx, state.collapsed);
  const uiKey = `${state.scenario}|${info.auxPx}|${state.collapsed}|${state.focusIdx}|${state.filterOn}|${state.dragging}`;
  const focusKey = `${state.scenario}|${state.focusIdx}|${state.filterOn}`;
  const auxPaneKey = `${focusKey}|${state.collapsed}`;
  const statusKey = `${info.status}|${state.collapsed}`;
  const pxKey = `${info.auxPx}|${state.collapsed}`;

  if (uiKey === lastUiKey) {
    if (!state.dragging || reducedMotion.matches) hero.draw();
    return;
  }
  const shouldPulse = lastFocusKey !== "" && focusKey !== lastFocusKey;
  lastUiKey = uiKey;
  lastFocusKey = focusKey;

  // 1. 状态档位变化时才改状态徽标、折叠态、底卡标题/原理与手柄样式
  if (statusKey !== lastStatusKey) {
    lastStatusKey = statusKey;
    const titleStatus = $("title-status");
    titleStatus.textContent = info.badge;
    titleStatus.dataset.status = info.status;
    $("title-demo").dataset.collapsed = String(state.collapsed);
    $("ro-title").textContent = info.title;
    $("ro-why").textContent = info.whyFixed;
    sash.classList.toggle("collapsed", state.collapsed);
    sash.classList.toggle("sweet", info.status === "sweet");
  }

  // 2. 像素值变化时仅更新极小范围文本（避免拖动时重绘整个辅助窗格）
  if (pxKey !== lastPxKey) {
    lastPxKey = pxKey;
    $("title-aux-px").textContent = state.collapsed ? "已折叠 0 px" : `辅助 ${info.auxPx} px`;
    $("title-aux-pct").textContent = state.collapsed ? "主区 100%" : `占 ${info.auxPct}%`;
    $("ro-text").textContent = info.text;
  }

  // 3. 场景 / 焦点 / 筛选 / 折叠态变化时才刷新右侧辅助窗格主体（拖动中零触碰）
  if (auxPaneKey !== lastAuxPaneKey) {
    lastAuxPaneKey = auxPaneKey;
    auxPaneEl.dataset.collapsed = String(state.collapsed);
    $("aux-pane-title").textContent = scen.auxTitle;
    $("aux-follow-pill").textContent = state.collapsed ? "已折叠 · 待命" : `跟随：${focus.label}`;
    $("aux-follow-pill").dataset.collapsed = String(state.collapsed);

    $("aux-scen-tabs").querySelectorAll("[role='tab']").forEach((btn) => {
      btn.setAttribute("aria-selected", String(btn.dataset.scen === state.scenario));
    });

    const filterBtn = $("aux-live-filter");
    filterBtn.setAttribute("aria-pressed", String(state.filterOn));
    $("aux-filter-label").textContent = focus.filterLabel;
    $("aux-filter-state").textContent = state.filterOn ? "已开启" : "未开启";
    $("aux-filter-note").textContent = state.filterOn ? focus.filterOnNote : focus.filterOffNote;

    const tagsEl = $("aux-live-tags");
    tagsEl.innerHTML = focus.tags.map((tag) => `<span class="aux-chip">${tag}</span>`).join("");

    $("aux-live-context").textContent = focus.context;
    $("aux-relation-title").textContent = focus.relationTitle;
    $("aux-collapsed-bar").hidden = !state.collapsed;

    const colBtn = $("btn-collapse");
    colBtn.setAttribute("aria-pressed", String(state.collapsed));
    colBtn.querySelector(".btn-label").textContent = state.collapsed ? "展开窗格" : "折叠窗格";
  }

  if (!state.dragging) {
    sash.setAttribute(
      "aria-label",
      `拖动分隔线调整辅助窗格宽度：当前主区弹性 ${info.mainPx} px，辅助窗格 ${info.auxPx} px（占 ${info.auxPct}%），${info.badge}。左右方向键微调 20 px，空格折叠或展开，按 0 回到 360 px。`,
    );
  }

  if (shouldPulse) pulseAuxLive();
  if (!state.dragging || reducedMotion.matches) hero.draw();
}

function setAuxPx(rawPx, useSnap = true) {
  if (useSnap) {
    const r = snapAuxPx(rawPx);
    state.collapsed = r.collapsed;
    state.auxPx = r.auxPx;
    if (!r.collapsed) state.lastAuxPx = r.auxPx;
  } else {
    const v = clamp(Math.round(rawPx), 0, MAX_AUX_PX);
    state.collapsed = v < 24;
    state.auxPx = state.collapsed ? 0 : v;
    if (!state.collapsed && v >= 180) state.lastAuxPx = v;
  }
  syncUI();
}

function toggleCollapse() {
  if (state.collapsed) {
    state.collapsed = false;
    state.auxPx = clamp(state.lastAuxPx || SWEET_AUX_PX, 260, 380);
  } else {
    if (state.auxPx >= 200) state.lastAuxPx = state.auxPx;
    state.collapsed = true;
    state.auxPx = 0;
  }
  syncUI();
}

function selectFocus(idx) {
  const scen = SCENARIOS[state.scenario] || SCENARIOS.analysis;
  const safeIdx = clamp(idx, 0, scen.focusItems.length - 1);
  state.focusIdx = safeIdx;
  state.activeAux = scen.focusItems[safeIdx].auxKey || "notes";
  syncUI();
}

// 右侧辅助窗格顶部的场景标签
$("aux-scen-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[role='tab']");
  if (!btn) return;
  state.scenario = btn.dataset.scen;
  state.focusIdx = 0;
  state.activeAux = SCENARIOS[state.scenario].focusItems[0].auxKey;
  syncUI();
});

// 右侧辅助窗格内的实时筛选开关（反向驱动左侧蓝图主内容区）
$("aux-live-filter").addEventListener("click", () => {
  state.filterOn = !state.filterOn;
  state.activeAux = "filter";
  if (state.collapsed) {
    state.collapsed = false;
    state.auxPx = clamp(state.lastAuxPx || SWEET_AUX_PX, 260, 380);
  }
  syncUI();
});

// 右侧辅助窗格内的虚线关联卡（点击跳转到左侧对应图表/数据点）
$("aux-live-relation").addEventListener("click", () => {
  const scen = SCENARIOS[state.scenario] || SCENARIOS.analysis;
  const focus = scen.focusItems[state.focusIdx] || scen.focusItems[0];
  if (state.collapsed) {
    state.collapsed = false;
    state.auxPx = clamp(state.lastAuxPx || SWEET_AUX_PX, 260, 380);
  }
  selectFocus(focus.relationTarget);
});

// 折叠态时，辅助窗格内一键展开回 360 px
$("aux-expand-btn").addEventListener("click", () => {
  state.collapsed = false;
  state.auxPx = SWEET_AUX_PX;
  state.lastAuxPx = SWEET_AUX_PX;
  syncUI();
});

// 框下唯一快捷钮：折叠 / 展开
$("btn-collapse").addEventListener("click", toggleCollapse);

// 拖动手柄（支持鼠标与触屏水平拖动，按 px 计量，不阻断页面纵向滚动）
let dragId = null;
let dragStageLeft = null;
function auxPxFromClientX(clientX, cachedLeft = null) {
  const left = cachedLeft ?? stage.getBoundingClientRect().left;
  const lx = clientX - left;
  const rightEdge = geom.fx + geom.fw;
  const ratio = (rightEdge - lx) / Math.max(120, geom.fw);
  return ratio * REF_VIEWPORT_PX;
}

sash.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  try { sash.setPointerCapture(e.pointerId); } catch {}
  sash.focus({ preventScroll: true });
  dragId = e.pointerId;
  dragStageLeft = stage.getBoundingClientRect().left;
  state.dragging = true;
  stage.classList.add("dragging");
  setAuxPx(auxPxFromClientX(e.clientX, dragStageLeft), false);
});

const onSashMove = (e) => {
  if (dragId === null || e.pointerId !== dragId) return;
  setAuxPx(auxPxFromClientX(e.clientX, dragStageLeft), false);
};

const endSashDrag = (e) => {
  if (dragId === null || e.pointerId !== dragId) return;
  dragId = null;
  dragStageLeft = null;
  state.dragging = false;
  stage.classList.remove("dragging");
  setAuxPx(state.collapsed ? 0 : state.auxPx, true);
};
window.addEventListener("pointermove", onSashMove);
window.addEventListener("pointerup", endSashDrag);
window.addEventListener("pointercancel", endSashDrag);

// 键盘操作分隔手柄（按 px 步进，0 回到 360 px，空格折叠/展开）
sash.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 60 : 20;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setAuxPx((state.collapsed ? 200 : state.auxPx) + step, false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setAuxPx((state.collapsed ? 0 : state.auxPx) - step, false);
  } else if (e.key === "0") {
    e.preventDefault();
    state.collapsed = false;
    state.auxPx = SWEET_AUX_PX;
    state.lastAuxPx = SWEET_AUX_PX;
    syncUI();
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    toggleCollapse();
  }
});

// 点击蓝图画布：点主区图表/拐点直接刷新右侧辅助窗格，点画布右侧条触发筛选或焦点，点标尺直接设宽度
canvas.addEventListener("click", (e) => {
  const r = stage.getBoundingClientRect();
  const lx = e.clientX - r.left;
  const ly = e.clientY - r.top;

  if (Math.abs(ly - geom.rulerY) <= 24) {
    setAuxPx(auxPxFromClientX(e.clientX), true);
    return;
  }

  const hit = hero.hitTest(lx, ly);
  if (!hit) return;
  if (hit.kind === "uncollapse") {
    toggleCollapse();
  } else if (hit.kind === "main") {
    selectFocus(hit.idx);
  } else if (hit.kind === "aux") {
    state.activeAux = hit.key;
    if (hit.key === "filter") state.filterOn = !state.filterOn;
    else if (hit.key === "notes") state.focusIdx = 0;
    else if (hit.key === "tags") state.focusIdx = 1;
    else if (hit.key === "relation") state.focusIdx = 3;
    syncUI();
  }
});

syncUI();
initLinkLab();
initModalLab();
initStressLab();
initEnterModeLab();
initScenariosLab();
initQuiz();
initLightbox();
initReveal();
