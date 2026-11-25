// 210 破格网格 BROKEN GRID — 主控逻辑入口
// 所有开场读数、四枚原海报圆徽状态、底部公式条、自示范标题联动均来自 model.js 的单真源 evaluate(state)。

import {
  HOME_SLOTS,
  PRESETS,
  THEMES,
  MODULE_ORDER,
  createInitialState,
  clampModule,
  evaluate,
} from "./model.js";
import { mountHeroStage } from "./hero-stage.js";
import {
  mountXrayLab,
  mountMovesLab,
  mountBudgetLab,
  mountEraLab,
  mountScenarioLab,
  mountQuiz,
  mountPosterLightbox,
} from "./sections-viz.js";

const state = createInitialState();
let currentEval = evaluate(state);

const els = {
  titleBand: document.getElementById("title-band"),
  topStatusPill: document.getElementById("top-status-pill"),
  sheetSpec: document.getElementById("sheet-spec"),
  btnGuides: document.getElementById("btn-guides"),
  btnShatter: document.getElementById("btn-shatter"),
  diagBox: document.getElementById("diag-box"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagFixRow: document.getElementById("diag-fix-row"),
  diagFixBtn: document.getElementById("diag-fix-btn"),
  mRatio: document.getElementById("m-ratio"),
  mWhitespace: document.getElementById("m-whitespace"),
  mTextCover: document.getElementById("m-textcover"),
  mTension: document.getElementById("m-tension"),
  fOrder: document.getElementById("f-order"),
  fBreak: document.getElementById("f-break"),
  fPurpose: document.getElementById("f-purpose"),
  railChunks: [...document.querySelectorAll(".edge-rail .rail-chunk")],
  themeBtns: [...document.querySelectorAll(".theme-btn")],
  modChips: [...document.querySelectorAll("#module-chips .chip-btn")],
  actBtns: [...document.querySelectorAll(".act-btn")],
  presetBtns: [...document.querySelectorAll(".preset-btn")],
  heroCanvas: document.getElementById("hero-canvas"),
};

const domCache = new WeakMap();
function setText(el, val) {
  if (!el || domCache.get(el) === val) return;
  domCache.set(el, val);
  el.textContent = val;
}
const clsCache = new WeakMap();
function setClass(el, val) {
  if (!el || clsCache.get(el) === val) return;
  clsCache.set(el, val);
  el.className = val;
}

function syncAllUI(fromDrag = false) {
  currentEval = evaluate(state);
  const ev = currentEval;

  // 顶部自示范大标：只有破格成立时「格」字下沉出格并转朱红
  const nextBroken = String(ev.passed);
  if (els.titleBand.dataset.broken !== nextBroken) els.titleBand.dataset.broken = nextBroken;

  // 顶沿实况徽
  setText(els.topStatusPill, ev.badge);
  setClass(els.topStatusPill, `status-pill ${ev.passed ? "is-ok" : "is-err"}`);

  // 印张顶条单真源读数
  setText(els.sheetSpec, `5×6 GRID · ${ev.brokenCount} BROKEN · FREE ${ev.whitespacePct}%`);

  // 诊单卡片（单真源）
  setClass(els.diagBox, `diag-box ${ev.passed ? "is-ok" : "is-err"}`);
  setText(els.diagBadge, ev.badge);
  setText(els.diagTitle, ev.title);
  setText(els.diagBody, ev.body);
  if (ev.fixLabel) {
    if (els.diagFixRow.hidden) els.diagFixRow.hidden = false;
    setText(els.diagFixBtn, ev.fixLabel);
    if (els.diagFixBtn.dataset.action !== ev.fixAction) els.diagFixBtn.dataset.action = ev.fixAction;
  } else if (!els.diagFixRow.hidden) {
    els.diagFixRow.hidden = true;
  }

  setText(els.mRatio, `${ev.brokenCount} 破 / ${ev.alignedCount} 守`);
  setText(els.mWhitespace, `${ev.whitespacePct}%`);
  setText(els.mTextCover, `${ev.textCoverPct}%`);
  setText(els.mTension, ev.tensionGrade);

  // 原海报四枚核心逻辑几何圆徽实时状态灯
  for (const key of ["disruption", "emphasis", "contrast", "tension"]) {
    const li = document.getElementById(`pillar-${key}`);
    const tag = document.getElementById(`tag-${key}`);
    const p = ev.pillars[key];
    if (li && tag && p) {
      const nextSt = p.ok ? "ok" : "warn";
      if (li.dataset.state !== nextSt) li.dataset.state = nextSt;
      setText(tag, p.tag);
    }
  }

  // 原海报底沿国际蓝星号公式三项亮灯
  setClass(els.fOrder, `f-term ${ev.formula.order ? "is-ok" : "is-miss"}`);
  setClass(els.fBreak, `f-term ${ev.formula.breakMove ? "is-ok" : "is-miss"}`);
  setClass(els.fPurpose, `f-term ${ev.formula.purpose ? "is-ok" : "is-miss"}`);

  if (!fromDrag) {
    // 同步选中模块按钮高亮
    for (const chip of els.modChips) {
      const on = chip.dataset.mod === state.selected;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", String(on));
    }

    // 同步网格开关状态
    els.btnGuides.classList.toggle("is-active", state.showGuides);
    els.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
    setText(els.btnGuides, state.showGuides ? "虚线底格：开" : "虚线底格：隐");

    const shattered = state.gridIntegrity === "shattered";
    els.btnShatter.classList.toggle("is-danger", shattered);
    els.btnShatter.setAttribute("aria-pressed", String(shattered));
    setText(els.btnShatter, shattered ? "恢复底层秩序" : "拆散底层秩序");

    stage.draw();
  } else {
    stage.markDirty();
  }
}

function applyPreset(presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  state.gridIntegrity = p.gridIntegrity;
  state.selected = p.selected;
  state.modules = structuredClone(p.modules);
  syncAllUI();
}

// 对当前选中模块施加单一破格动作
function applyModuleAction(act) {
  const id = state.selected || "circle";
  const cur = state.modules[id];
  const home = HOME_SLOTS[id];
  let next = { ...cur };

  if (act === "snap") {
    next = { ...home };
  } else if (act === "bleed") {
    if (id === "circle") {
      next = { gx: 2.9, gy: -0.46, gw: 2.45, gh: 2.45, rot: 0 };
    } else if (id === "blackBlock") {
      next = { gx: 3.32, gy: 2.2, gw: 2.2, gh: 2.5, rot: cur.rot };
    } else if (id === "redBar") {
      next = { gx: -0.45, gy: 4.65, gw: 2.8, gh: 1.35, rot: 0 };
    } else if (id === "headline") {
      next = { gx: -0.4, gy: 1.2, gw: 3.1, gh: 1.9, rot: 0 };
    } else {
      next = { ...cur, gx: cur.gx < 2 ? -0.42 : 3.45 };
    }
  } else if (act === "span") {
    const grown = cur.gw >= home.gw + 0.85;
    if (grown) {
      next = { ...cur, gw: home.gw, gh: home.gh };
    } else {
      const addW = id === "circle" ? 0.65 : 1.15;
      const addH = id === "circle" ? 0.65 : 0.42;
      next = { ...cur, gw: home.gw + addW, gh: home.gh + addH };
    }
  } else if (act === "offset") {
    const offNow = Math.abs(cur.gx - Math.round(cur.gx)) >= 0.2;
    if (offNow) {
      next = { ...cur, gx: Math.round(cur.gx), gy: Math.round(cur.gy) };
    } else {
      const dir = cur.gx >= 2.5 ? 0.42 : -0.38;
      next = { ...cur, gx: home.gx + dir, gy: home.gy - 0.35 };
    }
  } else if (act === "tilt") {
    if (id === "circle") {
      // 圆形旋转无视觉变化：自动切给纯黑体块做经典 +17° 斜切，或弹出越界放大
      state.selected = "blackBlock";
      const bk = state.modules.blackBlock;
      state.modules.blackBlock = clampModule("blackBlock", {
        ...bk,
        rot: bk.rot === 0 ? 17 : bk.rot > 0 ? -15 : 0,
      });
      syncAllUI();
      return;
    }
    next = { ...cur, rot: cur.rot === 0 ? 17 : cur.rot > 0 ? -15 : 0 };
  }

  state.modules[id] = clampModule(id, next);
  syncAllUI();
}

// 诊单内的一键纠偏动作
function runFixAction(actionStr) {
  if (!actionStr) return;
  if (actionStr === "restoreGrid") {
    state.gridIntegrity = "intact";
    syncAllUI();
    return;
  }
  if (actionStr === "clearText") {
    // 把可能压住左半文字区的黑块、红块、红圆移回安全位置并保留右半破格
    state.modules.blackBlock = { gx: 3.18, gy: 2.24, gw: 2.2, gh: 2.55, rot: 17 };
    state.modules.redBar = { gx: 0.62, gy: 4.58, gw: 2.72, gh: 1.42, rot: 0 };
    state.modules.circle = { gx: 2.9, gy: -0.46, gw: 2.45, gh: 2.45, rot: 0 };
    state.selected = "blackBlock";
    syncAllUI();
    return;
  }
  if (actionStr.startsWith("preset:")) {
    applyPreset(actionStr.slice("preset:".length));
    return;
  }
  if (actionStr.startsWith("snap:")) {
    const id = actionStr.slice("snap:".length);
    if (HOME_SLOTS[id]) {
      state.modules[id] = { ...HOME_SLOTS[id] };
      state.selected = id;
      syncAllUI();
    }
    return;
  }
  if (actionStr.startsWith("boldBreak:")) {
    const id = actionStr.slice("boldBreak:".length);
    if (HOME_SLOTS[id]) {
      state.selected = id;
      applyModuleAction(id === "blackBlock" ? "tilt" : "bleed");
    }
  }
}

const stage = mountHeroStage(
  els.heroCanvas,
  () => state,
  () => currentEval,
  {
    onSelect(id) {
      state.selected = id;
      syncAllUI();
    },
    onMoveModule(id, nextBox, fromDrag = false) {
      state.modules[id] = nextBox;
      syncAllUI(fromDrag);
    },
  }
);

// 绑定题材切换
for (const btn of els.themeBtns) {
  btn.addEventListener("click", () => {
    const th = btn.dataset.theme;
    if (!THEMES[th]) return;
    state.theme = th;
    for (const b of els.themeBtns) {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    syncAllUI();
  });
}

// 绑定模块选定芯片
for (const chip of els.modChips) {
  chip.addEventListener("click", () => {
    const id = chip.dataset.mod;
    if (!MODULE_ORDER.includes(id)) return;
    state.selected = id;
    syncAllUI();
  });
}

// 绑定破格手法按钮
for (const btn of els.actBtns) {
  btn.addEventListener("click", () => applyModuleAction(btn.dataset.act));
}

// 绑定多解 / 试错预设按钮
for (const btn of els.presetBtns) {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
}

// 绑定网格线显示与底层秩序开关
els.btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncAllUI();
});
els.btnShatter.addEventListener("click", () => {
  state.gridIntegrity = state.gridIntegrity === "shattered" ? "intact" : "shattered";
  syncAllUI();
});

// 绑定诊单纠偏按钮
els.diagFixBtn.addEventListener("click", () => runFixAction(els.diagFixBtn.dataset.action));

// 首次同步并初始化 01–07 全部独立小节交互
syncAllUI();
mountXrayLab();
mountMovesLab();
mountBudgetLab();
mountEraLab();
mountScenarioLab();
mountQuiz();
mountPosterLightbox();
