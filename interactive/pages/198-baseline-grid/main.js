// 198 基线网格 BASELINE GRID · 入口装配
import {
  PARTS,
  createBrokenState,
  createPresetState,
  evaluate,
  fmtMult,
  fmtPt,
  fmtSigned,
  snapMultiple,
} from "./model.js";
import { mountHeroStage, updateAnatomyBanner } from "./stage-hero.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

let state = createBrokenState("poster");

const getState = () => state;
const setState = (patch) => {
  state = { ...state, ...patch };
};

const canvas = document.getElementById("hero-canvas");
const anatomyEl = document.getElementById("hero-anatomy");
const topStatus = document.getElementById("top-status");
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagHead = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagAct = document.getElementById("diag-action");

const statDrift = document.getElementById("stat-drift");
const statGrid = document.getElementById("stat-grid");
const statPass = document.getElementById("stat-pass");
const statComfort = document.getElementById("stat-comfort");
const gridSlider = document.getElementById("grid-step-range");
const gridReadout = document.getElementById("grid-step-val");
const toggleLinesBtn = document.getElementById("btn-toggle-lines");
const toggleSmallBtn = document.getElementById("btn-small-note");

const partRows = [...document.querySelectorAll("[data-part-row]")];
const sceneBtns = [...document.querySelectorAll("[data-scene-btn]")];
const gridPresetBtns = [...document.querySelectorAll("[data-grid-btn]")];

function syncUI() {
  const res = evaluate(state);
  const g = state.grid;

  // 顶眉徽章
  if (topStatus) {
    topStatus.textContent = res.tone === "ok" ? "4 / 4 跨栏齐平" : `${res.passed} / 4 待对行`;
    topStatus.dataset.tone = res.tone;
  }

  // 顶沿五线解剖活体同步
  updateAnatomyBanner(anatomyEl, g);

  // 白话诊单
  if (diagCard) diagCard.dataset.tone = res.tone;
  if (diagBadge) diagBadge.textContent = res.badge;
  if (diagHead) diagHead.textContent = res.headline;
  if (diagWhy) diagWhy.textContent = res.why;
  if (diagAct) diagAct.textContent = res.action;

  // 底沿 4 枚精简实时读数
  if (statDrift) statDrift.textContent = fmtPt(res.layout.metrics.maxCrossDrift);
  if (statGrid) statGrid.textContent = `${g}pt (${res.layout.metrics.bodyRatio.toFixed(2)}×)`;
  if (statPass) statPass.textContent = `${res.passed} / 4`;
  if (statComfort) statComfort.textContent = res.comfortLabel;

  // 步长滑杆与快捷刻度钮
  if (gridSlider) gridSlider.value = String(g);
  if (gridReadout) gridReadout.textContent = `${g}pt`;
  gridPresetBtns.forEach((b) => {
    const on = Number(b.dataset.gridBtn) === g;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 场景按钮
  sceneBtns.forEach((b) => {
    const on = b.dataset.sceneBtn === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 开关按钮
  if (toggleLinesBtn) {
    toggleLinesBtn.textContent = state.showLines ? "基线：显" : "基线：隐";
    toggleLinesBtn.setAttribute("aria-pressed", String(state.showLines));
  }
  if (toggleSmallBtn) {
    toggleSmallBtn.classList.toggle("is-active", state.lockSmallNote);
    toggleSmallBtn.setAttribute("aria-pressed", String(state.lockSmallNote));
    toggleSmallBtn.textContent = state.lockSmallNote ? "小字强锁：开（压测中）" : "压测：小字强锁";
  }

  // 四构件微调行
  const checkMap = {
    rightLead: { ok: res.checks.leadOk, err: res.layout.metrics.leadDiff },
    titleBlock: { ok: res.checks.titleOk, err: res.layout.metrics.titleErr },
    paraGap: { ok: res.checks.gapOk, err: res.layout.metrics.gapErr },
    boxHeight: { ok: res.checks.boxOk, err: res.layout.metrics.boxErr },
  };

  partRows.forEach((row) => {
    const key = row.dataset.partRow;
    const val = state[key];
    const info = checkMap[key];
    const isSel = state.activePart === key;

    row.classList.toggle("is-selected", isSel);
    row.dataset.status = info.ok ? "ok" : "err";

    const valNode = row.querySelector("[data-part-val]");
    const multNode = row.querySelector("[data-part-mult]");
    if (valNode) valNode.textContent = `${val}pt`;
    if (multNode) {
      multNode.textContent = info.ok
        ? `${fmtMult(val, g)} ✓`
        : `${fmtMult(val, g)} · ${fmtSigned(info.err)}`;
    }
  });
}

const heroCtl = mountHeroStage({
  canvas,
  getState,
  setState,
  onStateChange: syncUI,
});

function mutate(patch) {
  setState(patch);
  syncUI();
  heroCtl.redraw();
}

// 绑定四构件行：点击选中 + 减/加/一键回整倍
partRows.forEach((row) => {
  const key = row.dataset.partRow;
  const meta = PARTS[key];
  row.querySelector("[data-part-select]")?.addEventListener("click", () => {
    mutate({ activePart: key });
  });
  row.querySelector("[data-part-dec]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    mutate({ activePart: key, [key]: Math.max(meta.min, state[key] - 1) });
  });
  row.querySelector("[data-part-inc]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    mutate({ activePart: key, [key]: Math.min(meta.max, state[key] + 1) });
  });
  row.querySelector("[data-part-snap]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const g = state.grid;
    const target =
      key === "rightLead"
        ? g
        : key === "paraGap"
          ? snapMultiple(Math.max(g, state[key]), g, 1, 2)
          : snapMultiple(state[key], g, 2, 4);
    mutate({ activePart: key, [key]: target });
  });
});

// 绑定步长滑杆与 16/20/24/28/32 刻度按钮
gridSlider?.addEventListener("input", () => {
  mutate({ grid: Number(gridSlider.value) });
});

gridPresetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    mutate({ grid: Number(btn.dataset.gridBtn) });
  });
});

// 场景切换
sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    mutate({ scene: btn.dataset.sceneBtn });
  });
});

// 显隐基线 & 小字强锁压测
toggleLinesBtn?.addEventListener("click", () => {
  mutate({ showLines: !state.showLines });
});
toggleSmallBtn?.addEventListener("click", () => {
  mutate({ lockSmallNote: !state.lockSmallNote });
});

// 快捷预设按钮
document.getElementById("btn-reset-broken")?.addEventListener("click", () => {
  state = createBrokenState(state.scene);
  syncUI();
  heroCtl.redraw();
});
document.getElementById("btn-preset-24")?.addEventListener("click", () => {
  state = createPresetState("poster24", state.scene);
  syncUI();
  heroCtl.redraw();
});
document.getElementById("btn-preset-20")?.addEventListener("click", () => {
  state = createPresetState("book20", state.scene);
  syncUI();
  heroCtl.redraw();
});

// 启动全部 7 节互动实验与灯箱
syncUI();
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();
