// 264 底部导航布局 — 主入口：单真源状态联动 + 2D Canvas 手机台 + 七节交互 + 原海报灯箱

import { loop } from "../../lib/stage.js";
import { ARCHETYPES, PRESETS, createInitialState, evaluateState } from "./model.js";
import { createHeroRenderer } from "./hero-canvas.js";
import {
  initArchetypeTheater,
  initErgoSection,
  initQuizSection,
  initRulerSection,
  initTimelineSection,
  initTriageSection,
} from "./sections.js";

const state = createInitialState();
let dirty = true;

// DOM 引用
const canvas = document.getElementById("hero-stage");
const topStatusPill = document.getElementById("top-status-pill");
const stageMetrics = document.getElementById("stage-metrics");
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagTier = document.getElementById("diag-tier");
const diagTitle = document.getElementById("diag-title");
const diagReason = document.getElementById("diag-reason");
const diagAction = document.getElementById("diag-action");

const btnHand = document.getElementById("btn-hand");
const btnThumbMap = document.getElementById("btn-thumb-map");
const btnScrollSim = document.getElementById("btn-scroll-sim");
const btnBench = document.getElementById("btn-bench");
const btnFixPoster = document.getElementById("btn-fix-poster");
const btnResetBad = document.getElementById("btn-reset-bad");
const btnQuickDock = document.getElementById("btn-quick-dock");

const btnPlaceTop = document.getElementById("btn-place-top");
const btnPlaceBottom = document.getElementById("btn-place-bottom");
const btnPinned = document.getElementById("btn-pinned");
const btnItemMinus = document.getElementById("btn-item-minus");
const btnItemPlus = document.getElementById("btn-item-plus");
const valItemCount = document.getElementById("val-item-count");
const btnVpPhone = document.getElementById("btn-vp-phone");
const btnVpDesktop = document.getElementById("btn-vp-desktop");

const btnActiveInd = document.getElementById("btn-active-ind");
const btnLabels = document.getElementById("btn-labels");
const btnCenterFab = document.getElementById("btn-center-fab");
const btnBadgeFlood = document.getElementById("btn-badge-flood");
const rangeBarHeight = document.getElementById("range-bar-height");
const valBarHeight = document.getElementById("val-bar-height");

const archCards = [...document.querySelectorAll(".arch-card")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const probePills = {
  stability: document.getElementById("probe-stability"),
  reach: document.getElementById("probe-reach"),
  switching: document.getElementById("probe-switching"),
  focus: document.getElementById("probe-focus"),
};

function syncUI() {
  const ev = evaluateState(state);
  const allOk = ev.score === 4;

  // 顶部与画布抬头读数（全部来自同一 evaluateState）
  topStatusPill.textContent = ev.fault.badge;
  topStatusPill.classList.toggle("is-ok", allOk);

  const placeTxt = ev.isDesktop ? "宽屏底栏" : state.placement === "bottom" ? "贴底" : "顶置";
  stageMetrics.textContent = `${placeTxt} · ${ev.navCount} 项${ev.hasFab ? "+1浮钮" : ""} · 单格 ${Math.round(ev.slotW)}pt · 栏高 ${ev.barH}pt`;

  // 单真源诊单卡
  diagCard.dataset.state = allOk ? "ok" : "bad";
  diagBadge.textContent = ev.fault.badge;
  diagTier.textContent = ev.effortTier;
  diagTitle.textContent = ev.fault.headline;
  diagReason.textContent = ev.fault.reason;
  diagAction.textContent = ev.fault.action;

  // 快捷停靠按钮按状态换文案
  btnQuickDock.textContent = state.placement === "top" ? "拉回底部停靠" : "切换顶置对比";

  // 四枚原海报圆徽实时探针
  for (const [k, el] of Object.entries(probePills)) {
    const p = ev.pillars[k];
    el.textContent = p.tag;
    el.classList.toggle("is-ok", p.ok);
  }

  // 控件状态同步
  btnHand.textContent = state.hand === "right" ? "右手握持" : "左手握持";
  btnThumbMap.textContent = `热区弧：${state.showThumbMap ? "开" : "关"}`;
  btnThumbMap.setAttribute("aria-pressed", String(state.showThumbMap));

  btnScrollSim.classList.toggle("is-scrolled", state.scrollOffset > 20);
  btnScrollSim.textContent = state.scrollOffset > 20 ? "滚回页面顶部" : "模拟下滚内容";

  btnPlaceTop.classList.toggle("is-active", state.placement === "top");
  btnPlaceBottom.classList.toggle("is-active", state.placement === "bottom");

  btnPinned.setAttribute("aria-pressed", String(state.pinned));
  btnPinned.textContent = state.pinned ? "固定贴底 · 始终可见" : "未固定 · 会滚走";

  valItemCount.textContent = `${ev.navCount} 项`;
  btnVpPhone.classList.toggle("is-active", state.viewportMode === "phone");
  btnVpDesktop.classList.toggle("is-active", state.viewportMode === "desktop");

  btnActiveInd.setAttribute("aria-pressed", String(state.showActive));
  btnActiveInd.textContent = `当前态高亮：${state.showActive ? "开" : "关"}`;

  btnLabels.setAttribute("aria-pressed", String(state.showLabels));
  btnLabels.textContent = `文字标签：${state.showLabels ? "开" : "关"}`;

  btnCenterFab.setAttribute("aria-pressed", String(state.centerFab));
  btnCenterFab.textContent = `居中 + 浮钮：${state.centerFab ? "开" : "关"}`;

  btnBadgeFlood.setAttribute("aria-pressed", String(state.badgeFlood));
  btnBadgeFlood.classList.toggle("is-danger", true);
  btnBadgeFlood.textContent = `红点泛滥：${state.badgeFlood ? "开" : "关"}`;

  rangeBarHeight.value = String(state.barHeight);
  valBarHeight.textContent = `${state.barHeight}pt`;

  archCards.forEach((c) => c.classList.toggle("is-active", c.dataset.arch === state.archetype));
}

function mutate(patch, opts = {}) {
  Object.assign(state, patch);
  dirty = true;
  if (!opts.silent) syncUI();
  else syncUI();
  heroLoop.draw();
}

const heroRenderer = createHeroRenderer(canvas, () => state, mutate);

// 节电且丝滑的渲染循环：开场前 1.1s 温和定场，之后仅在交互/拖动/实测或指肚碰撞提醒时重绘
const heroLoop = loop(canvas, (t, dt, { still }) => {
  if (still) {
    dirty = false;
    heroRenderer.draw(0, 0, { still: true });
    return;
  }
  const benchOn = heroRenderer.isBenchmarking();
  const introOn = t < 1.05;
  if (dirty || benchOn || introOn) {
    dirty = false;
    heroRenderer.draw(t, dt, { still: false });
  }
});

// 画布尺寸变化时立刻补画一帧（绝不拉伸变形）
new ResizeObserver(() => {
  dirty = true;
  heroLoop.draw();
}).observe(canvas);

// ---------- 绑定 Hero 控件 ----------
btnHand.addEventListener("click", () => {
  const nextHand = state.hand === "right" ? "left" : "right";
  mutate({ hand: nextHand, thumbU: nextHand === "right" ? 0.72 : 0.28 });
});

btnThumbMap.addEventListener("click", () => {
  mutate({ showThumbMap: !state.showThumbMap });
});

btnScrollSim.addEventListener("click", () => {
  mutate({ scrollOffset: state.scrollOffset > 20 ? 0 : 128 });
});

btnBench.addEventListener("click", () => {
  heroRenderer.startBench();
  dirty = true;
  heroLoop.draw();
});

btnFixPoster.addEventListener("click", () => {
  mutate({ ...PRESETS.poster4.patch });
});

btnResetBad.addEventListener("click", () => {
  mutate({ ...PRESETS.errInitial.patch });
});

btnQuickDock.addEventListener("click", () => {
  if (state.placement === "top") {
    mutate({ placement: "bottom", pinned: true, scrollOffset: 0, thumbV: 0.91 });
  } else {
    mutate({ placement: "top", scrollOffset: 0 });
  }
});

btnPlaceTop.addEventListener("click", () => mutate({ placement: "top", scrollOffset: 0 }));
btnPlaceBottom.addEventListener("click", () => mutate({ placement: "bottom", scrollOffset: 0 }));
btnPinned.addEventListener("click", () => mutate({ pinned: !state.pinned, scrollOffset: 0 }));

btnItemMinus.addEventListener("click", () => {
  if (state.itemIds.length <= 2) return;
  // 优先裁掉末尾低频杂项
  const next = state.itemIds.slice(0, -1);
  const nextActive = next.includes(state.activeId) ? state.activeId : next[0];
  mutate({ itemIds: next, activeId: nextActive });
});

btnItemPlus.addEventListener("click", () => {
  const pool = ARCHETYPES[state.archetype].items.map((it) => it.id);
  const addable = pool.find((id) => !state.itemIds.includes(id));
  if (!addable) return;
  mutate({ itemIds: [...state.itemIds, addable] });
});

btnVpPhone.addEventListener("click", () => mutate({ viewportMode: "phone" }));
btnVpDesktop.addEventListener("click", () => mutate({ viewportMode: "desktop" }));

btnActiveInd.addEventListener("click", () => mutate({ showActive: !state.showActive }));
btnLabels.addEventListener("click", () => mutate({ showLabels: !state.showLabels }));
btnCenterFab.addEventListener("click", () => mutate({ centerFab: !state.centerFab }));
btnBadgeFlood.addEventListener("click", () => mutate({ badgeFlood: !state.badgeFlood }));

rangeBarHeight.addEventListener("input", () => {
  mutate({ barHeight: Number(rangeBarHeight.value) });
});

// 切换三套原海报产品原型（保留用户当前位置/固定态以便自由试错，仅替换对应频道词库）
archCards.forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.arch;
    const arch = ARCHETYPES[key];
    const desiredCount = Math.min(arch.items.length, Math.max(3, state.itemIds.length));
    const nextIds = arch.items.slice(0, desiredCount).map((it) => it.id);
    mutate({
      archetype: key,
      itemIds: nextIds,
      activeId: nextIds[0],
      centerFab: key === "tasks" ? true : false,
    });
  });
});

// 合法多解与双向试错按钮
presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) mutate({ ...p.patch });
  });
});

// 键盘操作：画布方向键微调拇指落点、Space 启动单手实测
canvas.addEventListener("keydown", (e) => {
  const step = 0.06;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    mutate({ thumbU: Math.max(0.06, state.thumbU - step) });
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    mutate({ thumbU: Math.min(0.94, state.thumbU + step) });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mutate({ thumbV: Math.max(0.1, state.thumbV - step) });
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    mutate({ thumbV: Math.min(0.95, state.thumbV + step) });
  } else if (e.code === "Space") {
    e.preventDefault();
    heroRenderer.startBench();
    dirty = true;
    heroLoop.draw();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.target.closest("button, input, a, textarea, select, [role='dialog']")) {
    const rect = canvas.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      e.preventDefault();
      heroRenderer.startBench();
      dirty = true;
      heroLoop.draw();
    }
  }
});

// Hero 底沿四项自示范底栏高亮联动
const pbarItems = [...document.querySelectorAll(".pbar-item")];
pbarItems.forEach((a) => {
  a.addEventListener("click", () => {
    pbarItems.forEach((x) => x.classList.toggle("is-current", x === a));
  });
});

// ---------- 原海报放大灯箱（复用 #poster.src，支持缩放、拖动、Esc 关闭） ----------
function initLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const box = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const stage = document.getElementById("lb-stage");
  const scaleEl = document.getElementById("lb-scale");

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    scaleEl.textContent = `${Math.round(zoom * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    document.getElementById("lb-close").focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-zoom-in").addEventListener("click", () => {
    zoom = Math.min(3.5, +(zoom + 0.35).toFixed(2));
    applyTransform();
  });
  document.getElementById("lb-zoom-out").addEventListener("click", () => {
    zoom = Math.max(0.6, +(zoom - 0.35).toFixed(2));
    applyTransform();
  });
  document.getElementById("lb-reset").addEventListener("click", () => {
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      zoom = Math.max(0.6, Math.min(3.5, +(zoom + delta).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage) {
      close();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    panning = false;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}

// 初始化全部模块
syncUI();
heroLoop.draw();
initErgoSection();
initRulerSection();
initArchetypeTheater();
initTimelineSection();
initTriageSection();
initQuizSection();
initLightbox();
