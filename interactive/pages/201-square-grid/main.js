// 201 方格网格（SQUARE GRID）入口：单真源同步开场 8×8 制图台、标题陶土方框、四要点章、诊单与各节交互。

import { createHeroCanvas } from "./heroCanvas.js";
import {
  GRID_N,
  THEMES,
  applyPreset,
  clampAspect,
  createState,
  evaluate,
} from "./model.js";
import { initSections } from "./sections.js";

const state = createState("broken");

const dom = {
  stripStatus: document.getElementById("strip-status"),
  titleFrame: document.getElementById("title-frame"),
  ratioTag: document.getElementById("hero-ratio-tag"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagHead: document.getElementById("diag-head"),
  diagWhy: document.getElementById("diag-why"),
  diagHint: document.getElementById("diag-hint"),
  mAspect: document.getElementById("m-aspect"),
  mGutter: document.getElementById("m-gutter"),
  mScale: document.getElementById("m-scale"),
  mBalance: document.getElementById("m-balance"),
  ptUnit: document.getElementById("pt-state-unit"),
  ptBalance: document.getElementById("pt-state-balance"),
  ptGutter: document.getElementById("pt-state-gutter"),
  ptAlign: document.getElementById("pt-state-align"),
  rngAspect: document.getElementById("rng-aspect"),
  lblAspect: document.getElementById("lbl-aspect"),
  lblSelected: document.getElementById("lbl-selected"),
  btnSnapToggle: document.getElementById("btn-snap-toggle"),
};

const heroCanvasEl = document.getElementById("hero-canvas");
const hero = createHeroCanvas(heroCanvasEl, state, syncUI);

function setPillState(el, ok, text) {
  el.textContent = text;
  el.classList.toggle("is-ok", ok);
  el.classList.toggle("is-err", !ok);
}

function syncUI() {
  const ev = evaluate(state);

  // 顶眉状态
  dom.stripStatus.textContent = ev.isOk ? "4 / 4 秩序成立" : `${ev.passedCount} / 4 待校准`;
  dom.stripStatus.classList.toggle("is-ok", ev.isOk);
  dom.stripStatus.classList.toggle("is-err", !ev.isOk);

  // 标题自示范：陶土橘红正方形框随单元宽高比实时伸缩
  const visualFrameW = Math.max(0.68, Math.min(1.42, ev.aspect));
  dom.titleFrame.style.setProperty("--frame-w", visualFrameW.toFixed(3));
  dom.titleFrame.classList.toggle("is-ok", ev.unitOk);
  dom.titleFrame.classList.toggle("is-distorted", !ev.unitOk);
  dom.ratioTag.textContent = `${ev.aspect.toFixed(2)} : 1`;
  dom.ratioTag.classList.toggle("is-ok", ev.unitOk);

  // 左侧原海报 4 枚要点实况短签
  setPillState(dom.ptUnit, ev.unitOk, ev.pointBadges.unit);
  setPillState(dom.ptBalance, ev.balanceOk, ev.pointBadges.balance);
  setPillState(dom.ptGutter, ev.gutterOk, ev.pointBadges.gutter);
  setPillState(dom.ptAlign, ev.alignOk, ev.pointBadges.align);

  // 单真源诊单
  dom.diagCard.classList.toggle("is-ok", ev.isOk);
  dom.diagCard.classList.toggle("is-err", !ev.isOk);
  dom.diagBadge.textContent = ev.badge;
  dom.diagHead.textContent = ev.headline;
  dom.diagWhy.textContent = ev.why;
  dom.diagHint.textContent = ev.nextHint;

  dom.mAspect.textContent = `${ev.aspect.toFixed(2)} : 1`;
  dom.mGutter.textContent = ev.gutter.ratioText;
  dom.mScale.textContent = `${ev.scaleRatio.toFixed(1)}×`;
  dom.mBalance.textContent = `${ev.balanceLabel} · 留白 ${Math.round(ev.whitespace * 100)}%`;

  // 四格图例微控同步
  dom.rngAspect.value = ev.aspect.toFixed(2);
  dom.lblAspect.textContent = `${ev.aspect.toFixed(2)} : 1`;

  const sel = state.tiles.find((t) => t.id === state.selectedId) || state.tiles[0];
  const themeTiles = (THEMES[state.theme] || THEMES.poster).tiles;
  dom.lblSelected.textContent = `${themeTiles[sel.id].title} · ${sel.w}×${sel.h}`;

  document.querySelectorAll("[data-span]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.span === `${sel.w}x${sel.h}`);
  });
  document.querySelectorAll("[data-gutter]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.gutter === state.gutterMode);
  });
  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.theme === state.theme);
  });

  dom.btnSnapToggle.classList.toggle("is-active", state.snapEnabled);
  dom.btnSnapToggle.setAttribute("aria-pressed", String(state.snapEnabled));
  dom.btnSnapToggle.textContent = `交点磁吸：${state.snapEnabled ? "开" : "关"}`;
}

// 绑定题材切签
document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    syncUI();
    hero.redraw();
  });
});

// 绑定预设解 / 复原错态 / 压测按钮
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(state, btn.dataset.preset);
    syncUI();
    hero.redraw();
  });
});

// 绑定四枚要点章（点按在画布高亮对应维度）
document.querySelectorAll(".point-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const rule = btn.dataset.rule;
    state.highlightRule = state.highlightRule === rule ? null : rule;
    document.querySelectorAll(".point-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.rule === state.highlightRule));
    });
    hero.redraw();
  });
});

// 绑定单元比例滑杆与 1:1 归正键
dom.rngAspect.addEventListener("input", () => {
  let v = clampAspect(Number(dom.rngAspect.value));
  if (Math.abs(v - 1.0) <= 0.02) v = 1.0;
  state.aspect = v;
  syncUI();
  hero.redraw();
});

document.getElementById("btn-unit-11").addEventListener("click", () => {
  state.aspect = 1.0;
  syncUI();
  hero.redraw();
});

// 绑定当前选中模块跨格快捷按钮
document.querySelectorAll("[data-span]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [sw, sh] = btn.dataset.span.split("x").map(Number);
    const sel = state.tiles.find((t) => t.id === state.selectedId);
    if (!sel) return;
    sel.w = sw;
    sel.h = sh;
    sel.x = Math.min(sel.x, GRID_N - sel.w);
    sel.y = Math.min(sel.y, GRID_N - sel.h);
    syncUI();
    hero.redraw();
  });
});

// 绑定缝隙模式
document.querySelectorAll("[data-gutter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.gutterMode = btn.dataset.gutter;
    syncUI();
    hero.redraw();
  });
});

// 绑定交点磁吸开关、一键齐交点、试半格脱轨
dom.btnSnapToggle.addEventListener("click", () => {
  state.snapEnabled = !state.snapEnabled;
  syncUI();
});

document.getElementById("btn-snap-all").addEventListener("click", () => {
  // 把全部模块吸附到最近整数交点，若有压叠则沿空白格轻挪解叠
  const occupied = new Set();
  for (const t of state.tiles) {
    let x = Math.max(0, Math.min(GRID_N - t.w, Math.round(t.x)));
    let y = Math.max(0, Math.min(GRID_N - t.h, Math.round(t.y)));
    const fits = (cx, cy) => {
      for (let dy = 0; dy < t.h; dy++) {
        for (let dx = 0; dx < t.w; dx++) {
          if (occupied.has(`${cx + dx},${cy + dy}`)) return false;
        }
      }
      return true;
    };
    if (!fits(x, y)) {
      outer: for (let r = 0; r <= GRID_N - t.h; r++) {
        for (let c = 0; c <= GRID_N - t.w; c++) {
          if (fits(c, r)) {
            x = c;
            y = r;
            break outer;
          }
        }
      }
    }
    t.x = x;
    t.y = y;
    for (let dy = 0; dy < t.h; dy++) {
      for (let dx = 0; dx < t.w; dx++) occupied.add(`${x + dx},${y + dy}`);
    }
  }
  syncUI();
  hero.redraw();
});

document.getElementById("btn-nudge-off").addEventListener("click", () => {
  const sel = state.tiles.find((t) => t.id === state.selectedId) || state.tiles[0];
  sel.x = Math.min(GRID_N - sel.w - 0.1, Math.floor(sel.x) + 0.45);
  sel.y = Math.min(GRID_N - sel.h - 0.1, Math.floor(sel.y) + 0.35);
  syncUI();
  hero.redraw();
});

// 初始化正文各节与同步首屏读数
initSections();
syncUI();
hero.redraw();
