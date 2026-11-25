// 297 顺序重排 SEQUENTIAL REORDER — 入口脚本
// 统一管理开场单真源状态、蓝图画布、自示范阶梯大标、四原则状态带与 01–07 节交互。

import { SCENARIOS, SHAPES, SLOT_CIRCLES, evaluateOrder } from "./model.js";
import { createHeroCanvas } from "./hero-canvas.js";
import { initSections, shapeSvg } from "./sections.js";

const state = {
  scenarioId: "product",
  order: [...SCENARIOS.product.initialOrder], // 开场停在原海报「原始顺序（信息分散）」
  mode: "dom", // "dom" | "css-order"
  selectedId: SCENARIOS.product.initialOrder[0],
};

let currentEval = evaluateOrder(state.scenarioId, state.order, state.mode);

// ---------- DOM 引用 ----------
const titleEl = document.getElementById("title");
const statusPill = document.getElementById("hero-status-pill");
const goalTabs = document.getElementById("goal-tabs");
const diagBox = document.getElementById("hero-diag");
const diagGoal = document.getElementById("diag-goal");
const diagBadge = document.getElementById("diag-badge");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const diagFixBtn = document.getElementById("diag-fix");
const selReadout = document.getElementById("sel-readout");
const moveLeftBtn = document.getElementById("move-left");
const moveRightBtn = document.getElementById("move-right");
const modeToggleBtn = document.getElementById("mode-toggle");
const presetWrap = document.getElementById("hero-presets");
const principlesEl = document.getElementById("poster-principles");
const heroCanvas = document.getElementById("hero-canvas");

function recompute() {
  currentEval = evaluateOrder(state.scenarioId, state.order, state.mode);
}

/** 同步更新大标自示范阶梯、左侧单真源诊单、操控条与原海报四原则栏 */
function renderHeroUI() {
  const ev = currentEval;
  const sc = ev.scenario;

  // 1. 自示范大标「顺序重排」：四字下方活体阶梯块随当前 4 个槽位的优先级实时错落或对齐
  if (titleEl) {
    const steps = titleEl.querySelectorAll(".title-char");
    steps.forEach((span, idx) => {
      const rank = ev.titleRanks[idx]; // 0 = 最高优, 3 = 最末扩展
      const tag = span.querySelector(".char-step");
      if (tag) tag.textContent = SLOT_CIRCLES[rank];
      span.dataset.rank = String(rank);
      span.classList.toggle("is-match", ev.slotMatches[idx]);
    });
    titleEl.classList.toggle("is-aligned", ev.isSequenceValid && !ev.hasCssTrap);
  }

  // 2. 顶部状态徽与场景切签
  if (statusPill) {
    statusPill.textContent = ev.badge;
    statusPill.dataset.state = ev.status;
  }
  goalTabs?.querySelectorAll("button[data-scenario]").forEach((btn) => {
    const on = btn.dataset.scenario === state.scenarioId;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  // 3. 单真源白话诊断盒
  if (diagBox) diagBox.dataset.state = ev.status;
  if (diagGoal) diagGoal.textContent = `当前目标：${sc.goal}`;
  if (diagBadge) diagBadge.textContent = ev.badge;
  if (diagHead) diagHead.textContent = ev.headline;
  if (diagBody) diagBody.textContent = ev.body;
  if (diagHint) diagHint.textContent = ev.actionHint;
  if (diagFixBtn) diagFixBtn.textContent = ev.quickFixLabel;

  // 4. 选中模块挪位条
  const selPos = state.order.indexOf(state.selectedId);
  const selMod = sc.modules[state.selectedId];
  if (selReadout && selMod) {
    selReadout.innerHTML = `<span class="sel-ico">${shapeSvg(state.selectedId, 13)}</span> 选中：<strong>${selMod.name}</strong>（第 ${selPos + 1} 位）`;
  }
  if (moveLeftBtn) moveLeftBtn.disabled = selPos <= 0;
  if (moveRightBtn) moveRightBtn.disabled = selPos >= 3;

  // 5. DOM / CSS order 切换按钮
  if (modeToggleBtn) {
    const isCss = state.mode === "css-order";
    modeToggleBtn.textContent = isCss ? "重排方式：仅 CSS order" : "重排方式：同步 DOM";
    modeToggleBtn.classList.toggle("is-warn", isCss);
    modeToggleBtn.setAttribute("aria-pressed", String(isCss));
  }

  // 6. 快捷预设高亮
  presetWrap?.querySelectorAll("button[data-preset]").forEach((btn) => {
    const presetOrder = sc.presets[btn.dataset.preset];
    const match = presetOrder && presetOrder.every((id, i) => id === state.order[i]);
    btn.classList.toggle("is-active", !!match);
  });

  // 7. 原海报四条核心原则实时带（● 优先级前置 / ■ 顺序切换 / ▲ 信息连贯 / ≡ 流程清晰）
  if (principlesEl) {
    principlesEl.innerHTML = ev.principles
      .map(
        (p) => `
        <div class="pp-item${p.ok ? " is-ok" : " is-warn"}">
          <div class="pp-icon">${shapeSvg(p.id, 22)}</div>
          <div class="pp-copy">
            <div class="pp-top">
              <strong>${p.title}</strong>
              <span class="pp-en" lang="en">${p.en}</span>
            </div>
            <p class="pp-desc">${p.posterBody}</p>
            <p class="pp-meter">${p.meter}</p>
          </div>
        </div>
      `
      )
      .join("");
  }
}

// ---------- 画布初始化 ----------
const canvasCtrl = heroCanvas
  ? createHeroCanvas(heroCanvas, {
      getEval: () => currentEval,
      getSelectedId: () => state.selectedId,
      onSelect: (id) => {
        state.selectedId = id;
        renderHeroUI();
      },
      onReorder: (nextOrder, activeId) => {
        state.order = nextOrder;
        if (activeId) state.selectedId = activeId;
        recompute();
        renderHeroUI();
      },
    })
  : null;

function applyChange({ snap = false } = {}) {
  recompute();
  renderHeroUI();
  if (snap) canvasCtrl?.snap();
  else canvasCtrl?.draw();
}

// ---------- 控件绑定 ----------
goalTabs?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-scenario]");
  if (!btn) return;
  const id = btn.dataset.scenario;
  if (!SCENARIOS[id]) return;
  state.scenarioId = id;
  state.order = [...SCENARIOS[id].initialOrder];
  state.selectedId = state.order[0];
  state.mode = "dom";
  applyChange({ snap: false });
});

function shiftSelected(delta) {
  const idx = state.order.indexOf(state.selectedId);
  const nextIdx = idx + delta;
  if (idx === -1 || nextIdx < 0 || nextIdx > 3) return;
  const next = [...state.order];
  [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
  state.order = next;
  applyChange();
}

moveLeftBtn?.addEventListener("click", () => shiftSelected(-1));
moveRightBtn?.addEventListener("click", () => shiftSelected(1));

modeToggleBtn?.addEventListener("click", () => {
  state.mode = state.mode === "dom" ? "css-order" : "dom";
  applyChange();
});

diagFixBtn?.addEventListener("click", () => {
  const ev = currentEval;
  state.order = [...ev.quickFixOrder];
  state.mode = ev.quickFixMode;
  state.selectedId = state.order[0];
  applyChange();
});

presetWrap?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-preset]");
  if (!btn) return;
  const sc = SCENARIOS[state.scenarioId];
  const target = sc.presets[btn.dataset.preset];
  if (!target) return;
  state.order = [...target];
  state.selectedId = state.order[0];
  if (btn.dataset.preset === "broken" || btn.dataset.preset === "solved") {
    state.mode = "dom";
  }
  applyChange();
});

// 画布聚焦后的键盘操作：←/→ 移动选中卡片，Tab / ↑ / ↓ 切换选中的卡片
heroCanvas?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    shiftSelected(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    shiftSelected(1);
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const idx = state.order.indexOf(state.selectedId);
    const nextIdx = (idx + (e.key === "ArrowDown" ? 1 : 3)) % 4;
    state.selectedId = state.order[nextIdx];
    renderHeroUI();
    canvasCtrl?.draw();
  }
});

// 首次渲染 + 初始化 01–07 节
recompute();
renderHeroUI();
canvasCtrl?.draw();
initSections();
