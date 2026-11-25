// 042 金字塔构图 · 页面总控入口
import { createHeroStage } from "./heroStage.js";
import {
  setupAntiPatterns,
  setupArenaLab,
  setupAscentLab,
  setupGravityLab,
  setupHistoryLab,
  setupPosterLightbox,
  setupQuiz,
  setupTierCountLab,
} from "./labs.js";
import {
  applySingleFix,
  cloneState,
  evaluate,
  INITIAL_STATE,
  PRESETS,
  swapSlots,
} from "./model.js";

const state = cloneState(INITIAL_STATE);

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const statusPills = [...document.querySelectorAll("[data-live-pill]")];
const titleGlyphBars = [...document.querySelectorAll("[data-title-bar]")];
const probeEls = {
  hierarchy: document.getElementById("probe-hierarchy"),
  stability: document.getElementById("probe-stability"),
  focus: document.getElementById("probe-focus"),
  ascent: document.getElementById("probe-ascent"),
};
const verdictBadge = document.getElementById("verdict-badge");
const verdictHeadline = document.getElementById("verdict-headline");
const verdictBody = document.getElementById("verdict-body");
const verdictAction = document.getElementById("verdict-action");
const verdictFixBtn = document.getElementById("verdict-fix-btn");
const metricRatio = document.getElementById("metric-ratio");
const metricCog = document.getElementById("metric-cog");
const metricSlope = document.getElementById("metric-slope");
const metricGrade = document.getElementById("metric-grade");
const orderRack = document.getElementById("tier-order-rack");
const sightlineBtn = document.getElementById("btn-sightline");
const stepCards = [...document.querySelectorAll("[data-step-card]")];
const summaryLive = document.getElementById("summary-live-note");

let currentFixId = null;
let lastRackKey = "";

function renderOrderRack(evalRes) {
  if (!orderRack) return;
  const rackKey = `${state.scenario}|${state.toneMode}|${state.selectedSlot}|${state.order.join(",")}|${evalRes.tiers.map((t) => (t.overhangsBelow || t.misplaced ? 1 : 0)).join("")}`;
  if (rackKey === lastRackKey && orderRack.children.length === 4) {
    // 拖拽调宽时仅原地更新 4 处宽度数字，避免重建 DOM 引起重排
    evalRes.tiers.forEach((tr, i) => {
      const wEl = orderRack.children[i]?.querySelector(".tier-chip-w");
      if (wEl) wEl.textContent = `${tr.widthPct}%`;
    });
    return;
  }
  lastRackKey = rackKey;
  orderRack.innerHTML = evalRes.tiers
    .map((tr, i) => {
      const sel = state.selectedSlot === i;
      const errCls = tr.overhangsBelow || tr.misplaced ? " is-warn" : "";
      return `
        <div class="tier-chip${sel ? " is-selected" : ""}${errCls}">
          <span class="tier-swatch" style="background:${tr.color.front}"></span>
          <span class="tier-chip-info">
            <strong>${i + 1}. ${tr.name}</strong>
            <span class="tier-chip-w">${tr.widthPct}%</span>
          </span>
          <span class="tier-chip-acts">
            <button type="button" class="tier-move" data-move-slot="${i}" data-move-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="把第 ${i + 1} 层「${tr.name}」上移一层">↑</button>
            <button type="button" class="tier-move" data-move-slot="${i}" data-move-dir="1" ${i === 3 ? "disabled" : ""} aria-label="把第 ${i + 1} 层「${tr.name}」下移一层">↓</button>
          </span>
        </div>`;
    })
    .join("");
}

function syncUI() {
  const ev = evaluate(state);
  const pillText = `${ev.passedCount}/4 · ${ev.shortTag}`;

  statusPills.forEach((el) => {
    el.textContent = pillText;
    el.classList.toggle("is-pass", ev.severity === "pass");
    el.classList.toggle("is-fail", ev.severity !== "pass");
  });

  // 自示范主标四道阶梯条：宽度与颜色直接联动当前 4 层实况！
  titleGlyphBars.forEach((bar, i) => {
    const tr = ev.tiers[i];
    if (!tr) return;
    bar.style.width = `${Math.round(tr.width * 100)}%`;
    bar.style.backgroundColor = tr.color.front;
  });

  // 左侧 4 枚原海报圆徽实时状态
  ev.probes.forEach((p) => {
    const card = probeEls[p.id];
    if (!card) return;
    card.classList.toggle("is-ok", p.ok);
    card.classList.toggle("is-warn", !p.ok);
    const badge = card.querySelector(".probe-tag");
    if (badge) badge.textContent = p.status;
  });

  // 石基单真源诊单
  if (verdictBadge) {
    verdictBadge.textContent = pillText;
    verdictBadge.className = `verdict-badge ${ev.severity === "pass" ? "is-pass" : "is-fail"}`;
  }
  if (verdictHeadline) verdictHeadline.textContent = ev.headline;
  if (verdictBody) verdictBody.textContent = ev.body;
  if (verdictAction) verdictAction.textContent = ev.actionHint;

  currentFixId = ev.quickFix ? ev.quickFix.id : null;
  if (verdictFixBtn) {
    if (ev.quickFix) {
      verdictFixBtn.hidden = false;
      verdictFixBtn.textContent = ev.quickFix.label;
    } else {
      verdictFixBtn.hidden = true;
    }
  }

  // 四项单真源实测读数
  if (metricRatio) metricRatio.textContent = `${ev.taperRatio.toFixed(2)}×`;
  if (metricCog) metricCog.textContent = `${ev.visualCogPct}%`;
  if (metricSlope) metricSlope.textContent = `${ev.slopeDeg}°`;
  if (metricGrade) metricGrade.textContent = ev.stabilityGrade;

  // 底部要点总结卡的实况副句
  if (summaryLive) {
    summaryLive.textContent =
      ev.passedCount === 4
        ? `当前已达成「${ev.shortTag}」：底宽 ${ev.baseWidthPct}% → 顶宽 ${ev.topWidthPct}%，视觉重心稳落 ${ev.visualCogPct}%。`
        : `当前进度 ${ev.passedCount}/4（底宽 ${ev.baseWidthPct}% · 顶宽 ${ev.topWidthPct}% · 重心 ${ev.visualCogPct}%）：按上方诊单逐项调宽、换序或校准明暗。`;
  }

  // 底部 1:1 原海报四步构建图 ①→②→③→④ 活体亮灯
  stepCards.forEach((card, i) => {
    const st = ev.steps[i];
    if (!st) return;
    card.classList.toggle("is-done", st.done);
    const stateTag = card.querySelector(".step-state");
    if (stateTag) stateTag.textContent = st.done ? "已达成" : "待校准";
  });

  // 场景、明暗、砌缝与辅助线按钮高亮
  document.querySelectorAll("[data-scenario]").forEach((btn) => {
    const on = btn.dataset.scenario === state.scenario;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-tone]").forEach((btn) => {
    const on = btn.dataset.tone === state.toneMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-gap]").forEach((btn) => {
    const on = btn.dataset.gap === state.gapMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  if (sightlineBtn) {
    sightlineBtn.textContent = state.showSightline ? "视线轨迹：显" : "视线轨迹：隐";
    sightlineBtn.classList.toggle("is-active", state.showSightline);
    sightlineBtn.setAttribute("aria-pressed", String(state.showSightline));
  }

  renderOrderRack(ev);
}

// 启动开场主画布
const stage = heroCanvas ? createHeroStage(heroCanvas, state, () => syncUI()) : null;

// 绑定单层 ↑/↓ 换序委托
if (orderRack) {
  orderRack.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-move-slot]");
    if (!btn || btn.disabled) return;
    const slot = Number(btn.dataset.moveSlot);
    const dir = Number(btn.dataset.moveDir);
    swapSlots(state, slot, slot + dir);
    syncUI();
    stage?.draw();
  });
}

// 绑定场景切换
document.querySelectorAll("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scenario = btn.dataset.scenario;
    syncUI();
    stage?.draw();
  });
});

// 绑定明暗重量模式
document.querySelectorAll("[data-tone]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.toneMode = btn.dataset.tone;
    syncUI();
    stage?.draw();
  });
});

// 绑定砌缝模式
document.querySelectorAll("[data-gap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gapMode = btn.dataset.gap;
    syncUI();
    stage?.draw();
  });
});

// 绑定视线轨迹开关
if (sightlineBtn) {
  sightlineBtn.addEventListener("click", () => {
    state.showSightline = !state.showSightline;
    syncUI();
    stage?.draw();
  });
}

// 绑定单步纠偏建议按钮
if (verdictFixBtn) {
  verdictFixBtn.addEventListener("click", () => {
    if (!currentFixId) return;
    applySingleFix(state, currentFixId);
    syncUI();
    stage?.draw();
  });
}

// 绑定多解示范与试错预设
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.widths = [...p.patch.widths];
    state.order = [...p.patch.order];
    state.toneMode = p.patch.toneMode;
    state.gapMode = p.patch.gapMode;
    state.selectedSlot = -1;
    syncUI();
    stage?.draw();
  });
});

// 初次同步 + 初始化正文 01–08 节交互实验台
syncUI();
setupTierCountLab();
setupGravityLab();
setupAscentLab();
setupHistoryLab();
setupArenaLab();
setupAntiPatterns();
setupQuiz();
setupPosterLightbox();
