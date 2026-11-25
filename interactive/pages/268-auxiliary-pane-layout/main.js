import { reducedMotion } from "../../lib/stage.js";
import { createHero } from "./hero.js";
import {
  initBreakpointLab,
  initLightbox,
  initLinkLab,
  initModalLab,
  initQuiz,
  initReveal,
  initScenariosLab,
  initStressLab,
} from "./labs.js";
import { clamp, describeSplit, MAX_RATIO, SCENARIOS, snapRatio, SWEET_RATIO } from "./model.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  scenario: "analysis",
  ratio: SWEET_RATIO,
  collapsed: false,
  lastRatio: SWEET_RATIO,
  filterOn: false,
  showLinks: true,
  focusIdx: 0,
  activeAux: "notes",
  dragging: false,
};

const stage = $("hero-stage");
const canvas = $("hero-canvas");
const sash = $("hero-sash");
const range = $("ratio-range");

let geom = { fx: 16, fy: 14, fw: 560, fh: 300, splitX: 400, rulerY: 336 };

const hero = createHero(canvas, stage, state, (g) => {
  geom = g;
  const clampedX = clamp(g.splitX, g.fx + 10, g.fx + g.fw - 10);
  sash.style.left = `${clampedX.toFixed(1)}px`;
  sash.style.top = `${(g.fy + g.fh * 0.5).toFixed(1)}px`;
  sash.style.height = `${Math.max(120, g.fh - 16).toFixed(0)}px`;
});

function syncUI() {
  const scen = SCENARIOS[state.scenario];
  const info = describeSplit(state.ratio, state.collapsed);

  // 标题自身示范：实时同步标题里的主/辅比例块
  $("title-main-pct").textContent = `${info.mainPct}%`;
  $("title-aux-pct").textContent = `${info.auxPct}%`;
  $("title-demo").dataset.collapsed = String(state.collapsed);
  $("title-demo").style.setProperty("--t-aux", `${Math.max(14, info.auxPct)}%`);

  // 画布内 HUD 与状态徽章
  $("hud-scen").textContent = scen.label;
  $("hud-ratio").textContent = `${info.mainPct} : ${info.auxPct}`;
  $("hud-badge").textContent = info.badge;
  $("hud-badge").dataset.status = info.status;

  // 右侧辅助控制面板读数
  range.value = String(info.auxPct);
  $("ratio-out").textContent = `${info.auxPct}%`;
  $("ro-title").textContent = info.title;
  $("ro-badge").textContent = info.badge;
  $("ro-badge").dataset.status = info.status;
  $("ro-text").textContent = info.text;
  $("ro-note").textContent = scen.focusNotes[state.focusIdx] || info.note;

  // 按钮状态
  const colBtn = $("btn-collapse");
  colBtn.setAttribute("aria-pressed", String(state.collapsed));
  colBtn.querySelector(".btn-label").textContent = state.collapsed ? "展开窗格" : "折叠窗格";

  const linkBtn = $("btn-links");
  linkBtn.setAttribute("aria-pressed", String(state.showLinks));

  const filtBtn = $("btn-filter");
  filtBtn.setAttribute("aria-pressed", String(state.filterOn));

  sash.classList.toggle("collapsed", state.collapsed);
  sash.classList.toggle("sweet", info.status === "sweet");
  sash.setAttribute(
    "aria-label",
    `拖动分隔线调整辅助窗格宽度：当前主内容 ${info.mainPct}%，辅助窗格 ${info.auxPct}%，${info.badge}。左右方向键微调，Home 回到 30%，空格折叠或展开。`,
  );

  hero.draw();
}

function setRatio(raw, useSnap = true) {
  if (useSnap) {
    const r = snapRatio(raw);
    state.collapsed = r.collapsed;
    state.ratio = r.ratio;
    if (!r.collapsed) state.lastRatio = r.ratio;
  } else {
    const v = clamp(raw, 0, MAX_RATIO);
    state.collapsed = v < 0.02;
    state.ratio = state.collapsed ? 0 : v;
    if (!state.collapsed && v >= 0.12) state.lastRatio = v;
  }
  syncUI();
}

function toggleCollapse() {
  if (state.collapsed) {
    state.collapsed = false;
    state.ratio = clamp(state.lastRatio || SWEET_RATIO, 0.22, 0.36);
  } else {
    if (state.ratio >= 0.14) state.lastRatio = state.ratio;
    state.collapsed = true;
    state.ratio = 0;
  }
  syncUI();
}

// 场景切换
$("scen-seg").addEventListener("change", (e) => {
  state.scenario = e.target.value;
  state.focusIdx = 0;
  state.activeAux = "notes";
  syncUI();
});

// 滑块联动
range.addEventListener("input", () => {
  setRatio(+range.value / 100, false);
});
range.addEventListener("change", () => {
  setRatio(+range.value / 100, true);
});

// 工具按钮
$("btn-collapse").addEventListener("click", toggleCollapse);
$("btn-links").addEventListener("click", () => {
  state.showLinks = !state.showLinks;
  syncUI();
});
$("btn-filter").addEventListener("click", () => {
  state.filterOn = !state.filterOn;
  state.activeAux = "filter";
  if (state.collapsed) toggleCollapse();
  else syncUI();
});
$("btn-sweet").addEventListener("click", () => {
  state.collapsed = false;
  state.ratio = SWEET_RATIO;
  state.lastRatio = SWEET_RATIO;
  syncUI();
});

// 拖动手柄（支持鼠标与触屏水平拖动，且不阻塞页面其他区域上下滚动）
let dragId = null;
function ratioFromClientX(clientX) {
  const r = stage.getBoundingClientRect();
  const lx = clientX - r.left;
  const rightEdge = geom.fx + geom.fw;
  return (rightEdge - lx) / Math.max(120, geom.fw);
}

sash.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  try { sash.setPointerCapture(e.pointerId); } catch {}
  sash.focus({ preventScroll: true });
  dragId = e.pointerId;
  state.dragging = true;
  stage.classList.add("dragging");
  setRatio(ratioFromClientX(e.clientX), false);
});

const onSashMove = (e) => {
  if (dragId === null || e.pointerId !== dragId) return;
  setRatio(ratioFromClientX(e.clientX), false);
};

const endSashDrag = (e) => {
  if (dragId === null || e.pointerId !== dragId) return;
  dragId = null;
  state.dragging = false;
  stage.classList.remove("dragging");
  setRatio(state.collapsed ? 0 : state.ratio, true);
};
window.addEventListener("pointermove", onSashMove);
window.addEventListener("pointerup", endSashDrag);
window.addEventListener("pointercancel", endSashDrag);

// 键盘操作分隔手柄
sash.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.06 : 0.02;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setRatio((state.collapsed ? 0.14 : state.ratio) + step, false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setRatio((state.collapsed ? 0 : state.ratio) - step, false);
  } else if (e.key === "Home") {
    e.preventDefault();
    state.collapsed = false;
    state.ratio = SWEET_RATIO;
    syncUI();
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    toggleCollapse();
  }
});

// 点击画布：可点主卡片/辅助项触发联动，或点标尺跳到对应宽度
canvas.addEventListener("click", (e) => {
  const r = stage.getBoundingClientRect();
  const lx = e.clientX - r.left;
  const ly = e.clientY - r.top;

  // 点在底部标尺带上，直接设比例
  if (Math.abs(ly - geom.rulerY) <= 24) {
    setRatio(ratioFromClientX(e.clientX), true);
    return;
  }

  const hit = hero.hitTest(lx, ly);
  if (!hit) return;
  if (hit.kind === "uncollapse") {
    toggleCollapse();
  } else if (hit.kind === "main") {
    state.focusIdx = hit.idx;
    state.activeAux = hit.idx === 0 ? "notes" : hit.idx === 1 ? "filter" : "relation";
    syncUI();
  } else if (hit.kind === "aux") {
    state.activeAux = hit.key;
    if (hit.key === "filter") state.filterOn = !state.filterOn;
    else if (hit.key === "notes") state.focusIdx = 0;
    else if (hit.key === "tags") state.focusIdx = 1;
    else if (hit.key === "relation") state.focusIdx = 2;
    syncUI();
  }
});

syncUI();
initLinkLab();
initModalLab();
initStressLab();
initBreakpointLab();
initScenariosLab();
initQuiz();
initLightbox();
initReveal();
