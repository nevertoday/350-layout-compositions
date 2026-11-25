// 119 图底关系原则 · 主控入口
// 单真源驱动：阴刻自示范大标、主画布、双嵌套反演镜、白话诊单与原海报四徽实时同步

import { reducedMotion } from "../../lib/stage.js";
import { PRESETS, SCENES, createInitialState, evaluate } from "./model.js";
import { mountHeroCanvas } from "./stage-hero.js";
import {
  initPosterLightbox,
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
} from "./sections.js";

const state = createInitialState();

// DOM 索引
const el = {
  // 刊头自示范大标与状态章
  statusChip: document.getElementById("hero-status-chip"),
  titleTileFig: document.getElementById("title-tile-fig"),
  titleTileGnd: document.getElementById("title-tile-gnd"),

  // 画布
  mainCanvas: document.getElementById("hero-canvas"),
  mirrorCanvas: document.getElementById("mirror-canvas"),

  // 右侧实时参数
  wcagBig: document.getElementById("mirror-wcag-big"),
  wcagGrade: document.getElementById("mirror-wcag-grade"),
  areaRatioText: document.getElementById("mirror-area-text"),
  focusText: document.getElementById("mirror-focus-text"),

  // 滑轨与读数
  balanceSlider: document.getElementById("ctrl-balance"),
  balanceVal: document.getElementById("val-balance"),
  balanceLabel: document.getElementById("label-balance"),
  contrastSlider: document.getElementById("ctrl-contrast"),
  contrastVal: document.getElementById("val-contrast"),

  // 按钮群
  sceneBtns: [...document.querySelectorAll("[data-scene]")],
  goalBtns: [...document.querySelectorAll("[data-goal]")],
  noiseBtns: [...document.querySelectorAll("[data-noise]")],
  paletteBtns: [...document.querySelectorAll("[data-palette]")],
  presetBtns: [...document.querySelectorAll("[data-preset]")],
  invertBtns: [...document.querySelectorAll("[data-action='invert']")],
  frameBtn: document.getElementById("ctrl-frame-toggle"),
  normalBtn: document.getElementById("ctrl-normal-toggle"),

  // 白话单真源诊单
  diagBox: document.getElementById("hero-diag-box"),
  diagBadge: document.getElementById("diag-badge"),
  diagHeadline: document.getElementById("diag-headline"),
  diagExplain: document.getElementById("diag-explain"),
  diagAction: document.getElementById("diag-action"),

  // 原海报底沿四枚实况图徽
  pillsWrap: document.getElementById("poster-pills-row"),
};

let heroCtrl = null;
const setText = (node, text) => {
  if (node && node.textContent !== text) node.textContent = text;
};
let lastUiKey = "";

function syncUI(forceDraw = false) {
  const uiKey = `${state.scene}|${state.goal}|${state.palette}|${Math.round(state.balance * 100)}|${state.contrast}|${state.noise}|${state.frameOpen}|${state.inverted}|${state.focusSide}|${state.showNormals}`;
  if (uiKey === lastUiKey && !forceDraw) return;
  lastUiKey = uiKey;

  const ev = evaluate(state);
  const sceneMeta = SCENES[state.scene];

  // 1. 顶部状态章
  if (el.statusChip) {
    setText(el.statusChip, ev.badge);
    el.statusChip.classList.toggle("is-ok", ev.tone === "ok");
    el.statusChip.classList.toggle("is-err", ev.tone !== "ok");
  }

  // 2. 标题自示范：「图」「底」双格始终用高反差原海报藏青×象牙，随反演极性锐利互换！
  if (el.titleTileFig && el.titleTileGnd) {
    const hiBg = state.inverted ? "#0E2044" : "#FEF9F3";
    const hiFg = state.inverted ? "#FEF9F3" : "#0E2044";
    const loBg = state.inverted ? "#FEF9F3" : "#0E2044";
    const loFg = state.inverted ? "#0E2044" : "#FEF9F3";

    el.titleTileFig.style.backgroundColor = hiBg;
    el.titleTileFig.style.color = hiFg;
    el.titleTileFig.style.borderColor = "#FEF9F3";

    el.titleTileGnd.style.backgroundColor = loBg;
    el.titleTileGnd.style.color = loFg;
    el.titleTileGnd.style.borderColor = "#FEF9F3";
  }

  // 3. 控件同步
  if (el.balanceSlider) {
    const v = String(Math.round(state.balance * 100));
    if (el.balanceSlider.value !== v) el.balanceSlider.value = v;
  }
  setText(el.balanceVal, `${ev.geom.innerPct}%`);
  setText(el.balanceLabel, sceneMeta.axisLabel);

  if (el.contrastSlider) {
    const cv = String(state.contrast);
    if (el.contrastSlider.value !== cv) el.contrastSlider.value = cv;
  }
  setText(el.contrastVal, `${ev.ratio.toFixed(1)}:1`);

  el.sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  el.goalBtns.forEach((b) => {
    const on = b.dataset.goal === state.goal;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  el.noiseBtns.forEach((b) => {
    const on = Number(b.dataset.noise) === state.noise;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  el.paletteBtns.forEach((b) => {
    const on = b.dataset.palette === state.palette;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  el.invertBtns.forEach((b) => {
    b.setAttribute("aria-pressed", String(state.inverted));
    if (b.dataset.invertLabel === "full") {
      setText(b, state.inverted ? "图⇄底反演：反相" : "图⇄底反演：原相");
    }
  });
  if (el.frameBtn) {
    setText(el.frameBtn, state.frameOpen ? "外框：破缺泄气" : "外框：完整闭合");
    el.frameBtn.classList.toggle("is-warn", state.frameOpen);
    el.frameBtn.classList.toggle("is-ok", !state.frameOpen);
    el.frameBtn.setAttribute("aria-pressed", String(!state.frameOpen));
  }
  if (el.normalBtn) {
    setText(el.normalBtn, state.showNormals ? "边界法线：开" : "边界法线：关");
    el.normalBtn.setAttribute("aria-pressed", String(state.showNormals));
  }

  // 4. 右侧反演镜读数（全部来自同一 evaluate() 单真源）
  if (el.wcagBig) {
    setText(el.wcagBig, `${ev.ratio.toFixed(1)}:1`);
    el.wcagBig.classList.toggle("is-ok", ev.checks.contrastOk);
    el.wcagBig.classList.toggle("is-err", !ev.checks.contrastOk);
  }
  setText(el.wcagGrade, ev.wcagGrade);
  setText(el.areaRatioText, `${ev.geom.innerPct}% : ${ev.geom.outerPct}%`);
  setText(el.focusText, state.focusSide === "center" ? sceneMeta.lightName : sceneMeta.darkName);

  // 5. 白话单真源诊单
  if (el.diagBox) {
    el.diagBox.classList.toggle("is-ok", ev.tone === "ok");
    el.diagBox.classList.toggle("is-err", ev.tone !== "ok");
  }
  setText(el.diagBadge, ev.badge);
  setText(el.diagHeadline, ev.headline);
  setText(el.diagExplain, ev.explain);
  setText(el.diagAction, ev.action);

  // 6. 原海报底沿四枚实况图徽（图形 / 背景 / 正负形 / 转换）
  if (el.pillsWrap) {
    ev.pills.forEach((p) => {
      const node = el.pillsWrap.querySelector(`[data-pill="${p.key}"]`);
      if (!node) return;
      node.classList.toggle("is-ok", p.ok);
      node.classList.toggle("is-err", !p.ok);
      setText(node.querySelector(".pill-status"), p.status);
    });
  }

  if (forceDraw || reducedMotion.matches) heroCtrl?.draw();
}

function patchState(patch) {
  Object.assign(state, patch);
  syncUI();
}

// 绑定事件
el.sceneBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const nextScene = b.dataset.scene;
    // 切换到图文海报时自然默认到「清晰主从」便于理解日常排版，也可随时手动再切换
    if (nextScene === "poster") {
      patchState({ scene: nextScene, goal: "clear" });
    } else {
      patchState({ scene: nextScene });
    }
  })
);
el.goalBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ goal: b.dataset.goal }))
);
el.noiseBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ noise: Number(b.dataset.noise) }))
);
el.paletteBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ palette: b.dataset.palette }))
);
el.invertBtns.forEach((b) =>
  b.addEventListener("click", () => patchState({ inverted: !state.inverted }))
);
el.frameBtn?.addEventListener("click", () => patchState({ frameOpen: !state.frameOpen }));
el.normalBtn?.addEventListener("click", () => patchState({ showNormals: !state.showNormals }));

el.balanceSlider?.addEventListener("input", () => {
  patchState({ balance: Number(el.balanceSlider.value) / 100 });
});
el.contrastSlider?.addEventListener("input", () => {
  patchState({ contrast: Number(el.contrastSlider.value) });
});

el.presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const preset = PRESETS[b.dataset.preset];
    if (preset) patchState({ ...preset.state });
  })
);

// 挂载开场双画布引擎
if (el.mainCanvas) {
  heroCtrl = mountHeroCanvas({
    mainCanvas: el.mainCanvas,
    mirrorCanvas: el.mirrorCanvas,
    getState: () => state,
    onUpdate: patchState,
  });
}

// 挂载 01–07 节全部独立交互
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initPosterLightbox();

// 首次渲染
syncUI(true);
