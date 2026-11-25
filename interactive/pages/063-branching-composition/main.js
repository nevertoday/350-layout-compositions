import {
  createInitialState,
  clonePreset,
  detachNode,
  toggleCycleEdge,
  untangleBranches,
  SCALE_MODES,
  NODE_MAP,
} from "./model.js";
import { mountHeroStage } from "./hero-canvas.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initSection07,
  initPosterLightbox,
} from "./sections.js";

const state = createInitialState();

const canvas = document.getElementById("hero-canvas");
const stageWrap = document.getElementById("hero-stage-wrap");
const spanRail = document.getElementById("span-rail");
const spanThumb = document.getElementById("span-thumb");
const spanReadout = document.getElementById("span-readout");
const stageHint = document.getElementById("stage-hint");
const detachBtn = document.getElementById("btn-detach");
const cycleBtn = document.getElementById("btn-cycle");
const untangleBtn = document.getElementById("btn-untangle");
const resetBtn = document.getElementById("btn-reset");
const mobileScore = document.getElementById("mobile-score");

// 圆角黑框诊单节点
const diagBox = document.getElementById("diag-box");
const diagIcon = document.getElementById("diag-icon");
const diagTag = document.getElementById("diag-tag");
const diagScore = document.getElementById("diag-score");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const diagMetrics = document.getElementById("diag-metrics");

// 四关键词图腾实时状态节点
const kwCells = {
  trunk: document.querySelector('[data-kw="trunk"]'),
  branching: document.querySelector('[data-kw="branching"]'),
  hierarchy: document.querySelector('[data-kw="hierarchy"]'),
  extension: document.querySelector('[data-kw="extension"]'),
};

const scaleBtns = [...document.querySelectorAll("[data-scale]")];
const themeBtns = [...document.querySelectorAll("[data-theme]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

function syncControlsUI(model) {
  // 1. 顶部操作提示与选中节点上下文动作
  if (state.selectedId) {
    const node = NODE_MAP[state.selectedId];
    const label = node ? `${node.id}（${node.labels[state.theme]}）` : state.selectedId;
    if (state.selectedId === "R") {
      stageHint.textContent = "主干 R 是整棵树的唯一入口，不能改挂。请改点其他节点来嫁接分叉。";
      detachBtn.hidden = true;
    } else {
      stageHint.textContent = `已选中 ${label}：再点画布上任意另一节点即可改挂父枝，或点旁边按钮断开成孤岛。`;
      detachBtn.hidden = false;
    }
  } else {
    stageHint.textContent = "点击任意节点再点目标父节点嫁接分叉 · 拖动底沿拉尺调节展幅";
    detachBtn.hidden = true;
  }

  // 2. 延伸拉尺读数
  if (spanReadout) {
    const band = model.actualSpanPct < 56 ? "偏窄挤撞" : model.actualSpanPct > 88 ? "过满贴边" : "舒适延展";
    spanReadout.textContent = `${model.actualSpanPct}% · ${band}`;
    spanReadout.classList.toggle("is-ok", model.checks.extension.ok);
    spanReadout.classList.toggle("is-err", !model.checks.extension.ok);
  }

  // 3. 回环边按钮文案
  if (cycleBtn) {
    const hasExtra = state.extraEdges.length > 0;
    cycleBtn.textContent = hasExtra ? "移除回环边" : "添回环变网";
    cycleBtn.classList.toggle("is-warn", hasExtra);
    cycleBtn.setAttribute("aria-pressed", String(hasExtra));
  }

  // 4. 缩放体量、题材、错态按钮激活态
  scaleBtns.forEach((b) => {
    const active = b.dataset.scale === state.scaleMode;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  themeBtns.forEach((b) => {
    const active = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  presetBtns.forEach((b) => {
    const active = b.dataset.preset === state.preset;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 5. 四枚原海报关键词图腾实况
  for (const [key, cell] of Object.entries(kwCells)) {
    if (!cell) continue;
    const c = model.checks[key];
    cell.classList.toggle("is-ok", c.ok);
    cell.classList.toggle("is-err", !c.ok);
    const valEl = cell.querySelector(".kw-live");
    if (valEl) valEl.textContent = c.metric;
  }

  // 6. 原海报圆角黑框诊单
  const d = model.diagnosis;
  const allOk = model.passCount === 4;
  diagBox.classList.toggle("is-ok", allOk);
  diagBox.classList.toggle("is-err", !allOk);
  diagIcon.innerHTML = allOk
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 8" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5v7M12 17.5h.01" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>';
  diagTag.textContent = d.tag;
  diagScore.textContent = `${model.passCount} / 4`;
  diagHead.textContent = d.headline;
  diagBody.textContent = d.body;
  diagHint.textContent = d.hint;

  if (mobileScore) {
    mobileScore.textContent = `${model.passCount} / 4 · ${allOk ? "清晰成树" : d.tag.replace(/^错态\s*·\s*/, "")}`;
    mobileScore.classList.toggle("is-ok", allOk);
    mobileScore.classList.toggle("is-err", !allOk);
  }

  if (diagMetrics) {
    diagMetrics.innerHTML = `
      <div><span>根 / 叶半径比</span><strong>${model.radiusRatio}×</strong></div>
      <div><span>枝线交叉</span><strong>${model.crossings.length} 处</strong></div>
      <div><span>最大扇出</span><strong>${model.topo.maxFanout} 枝</strong></div>
      <div><span>实测展幅</span><strong>${model.actualSpanPct}%</strong></div>
    `;
  }
}

const hero = mountHeroStage({
  canvas,
  stageWrap,
  spanRail,
  spanThumb,
  state,
  onChange: syncControlsUI,
});

// 控件事件绑定
scaleBtns.forEach((b) => {
  b.addEventListener("click", () => {
    if (!SCALE_MODES[b.dataset.scale]) return;
    state.scaleMode = b.dataset.scale;
    state.preset = "custom";
    hero.refresh(true);
  });
});

themeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    hero.refresh(true);
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const next = clonePreset(b.dataset.preset, state.theme);
    Object.assign(state, next);
    hero.refresh(true);
  });
});

if (detachBtn) {
  detachBtn.addEventListener("click", () => {
    if (state.selectedId && detachNode(state, state.selectedId)) {
      state.selectedId = null;
      hero.refresh(true);
    }
  });
}

if (cycleBtn) {
  cycleBtn.addEventListener("click", () => {
    toggleCycleEdge(state);
    hero.refresh(true);
  });
}

if (untangleBtn) {
  untangleBtn.addEventListener("click", () => {
    untangleBranches(state);
    state.selectedId = null;
    hero.refresh(true);
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    const next = clonePreset("broken", state.theme);
    Object.assign(state, next);
    hero.refresh(true);
  });
}

// 键盘在画布上也可直接循环选节点、按 Delete/Backspace 断枝、按 Esc 取消
canvas.addEventListener("keydown", (e) => {
  const ids = ["R", "B1", "B2", "B3", "C1", "C2", "C3", "C4", "C5", "C6", "L1", "L2", "L3", "L4", "L5", "L6"];
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    const idx = ids.indexOf(state.selectedId);
    state.selectedId = ids[(idx + 1) % ids.length];
    hero.refresh(true);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    const idx = ids.indexOf(state.selectedId);
    state.selectedId = ids[(idx <= 0 ? ids.length - 1 : idx - 1)];
    hero.refresh(true);
  } else if (e.key === "Escape") {
    state.selectedId = null;
    hero.refresh(true);
  } else if ((e.key === "Backspace" || e.key === "Delete") && state.selectedId && state.selectedId !== "R") {
    e.preventDefault();
    detachNode(state, state.selectedId);
    state.selectedId = null;
    hero.refresh(true);
  }
});

// 初始化正文各节交互与灯箱
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initSection07();
initPosterLightbox();
