// 045 方形构图 · 主入口：连接单真源 model.js、主画布 hero-canvas.js 与 01–07 节交互组件

import {
  applyFixStep,
  CELL_EMPTY,
  clamp,
  computeGeometry,
  createInitialState,
  evaluate,
  PRESETS,
  SKIN_META,
} from "./model.js";
import { createHeroStage } from "./hero-canvas.js";
import {
  initArnheimFieldWidget,
  initBuildStepsWidget,
  initFitCompareWidget,
  initFourMethodsWidget,
  initHistoryWidget,
  initPosterLightbox,
  initQuizWidget,
} from "./widgets.js";

const state = createInitialState();

const heroCanvas = document.getElementById("hero-canvas");
const statusStamp = document.getElementById("hero-status-stamp");
const titleSeal = document.getElementById("title-seal");
const diagCard = document.getElementById("hero-diag");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagBody = document.getElementById("diag-body");
const diagHint = document.getElementById("diag-hint");
const btnFixStep = document.getElementById("btn-fix-step");

const mAspect = document.getElementById("m-aspect");
const mSym = document.getElementById("m-sym");
const mSpace = document.getElementById("m-space");
const mPosture = document.getElementById("m-posture");

const ctrlAspect = document.getElementById("ctrl-aspect");
const ctrlMargin = document.getElementById("ctrl-margin");
const ctrlBias = document.getElementById("ctrl-bias");
const ctrlBorder = document.getElementById("ctrl-border");
const valAspect = document.getElementById("val-aspect");
const valMargin = document.getElementById("val-margin");
const valBias = document.getElementById("val-bias");
const valBorder = document.getElementById("val-border");

const btnMirror = document.getElementById("btn-mirror");
const btnGuides = document.getElementById("btn-guides");
const skinCaption = document.getElementById("skin-caption");

const skinBtns = [...document.querySelectorAll("[data-skin]")];
const brushBtns = [...document.querySelectorAll("[data-brush]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const calloutBtns = [...document.querySelectorAll("[data-pillar]")];
const kwItems = [...document.querySelectorAll("[data-kw]")];
const tipItems = [...document.querySelectorAll("[data-tip]")];

let currentActionType = "fix_aspect";

import { reducedMotion } from "../../lib/stage.js";

const stage = createHeroStage(heroCanvas, state, (reason) => {
  syncAll(reason);
});

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncAll(reason = "init") {
  // 拖动过程中由 rAF 统一每帧绘制一次，杜绝单帧双画；减少动态效果下立即绘制一帧
  stage.draw(reason !== "drag" || reducedMotion.matches);
  const sz = stage.getSize();
  const geom = computeGeometry(state, sz.w, sz.h);
  const res = evaluate(state, geom);

  // 顶部状态印章 & 标题方印外环
  setText(statusStamp, res.badgeText);
  statusStamp.classList.toggle("is-pass", res.isPass);
  statusStamp.classList.toggle("is-warn", !res.isPass);
  titleSeal?.classList.toggle("is-pass", res.isPass);

  // 单真源白话诊单匣
  diagCard.classList.toggle("is-pass", res.isPass);
  setText(diagBadge, res.badgeText);
  diagBadge.classList.toggle("is-pass", res.isPass);
  diagBadge.classList.toggle("is-warn", !res.isPass);

  if (res.isPass) {
    setText(diagHeadline, res.matchedMethod.headline);
    setText(diagBody, res.matchedMethod.body);
    setText(diagHint, "可以切换其他构图法或关掉镜像锁，故意破坏一边试试系统会报什么错。");
    setText(btnFixStep, "复原开场错态再试");
    currentActionType = "reset_broken";
  } else {
    const p = res.primary;
    setText(diagHeadline, p.headline);
    setText(diagBody, p.body);
    setText(diagHint, p.hint);
    setText(btnFixStep, p.actionLabel);
    currentActionType = p.actionType;
  }

  // 四项单真源读数
  setText(mAspect, `${geom.measuredAspect.toFixed(2)}:1`);
  setText(mSym, `${geom.symScore}%`);
  setText(mSpace, `${geom.whitespacePct}%（格占 ${geom.gridFillPct}%）`);
  setText(mPosture, res.posture);

  // 滑轨数值同步
  const aspectStr = String(state.aspect);
  if (ctrlAspect.value !== aspectStr) ctrlAspect.value = aspectStr;
  const marginStr = String(state.margin);
  if (ctrlMargin.value !== marginStr) ctrlMargin.value = marginStr;
  const biasStr = String(state.biasX);
  if (ctrlBias.value !== biasStr) ctrlBias.value = biasStr;
  const borderStr = String(state.borderW);
  if (ctrlBorder.value !== borderStr) ctrlBorder.value = borderStr;

  setText(valAspect, `${geom.measuredAspect.toFixed(2)}:1`);
  setText(valMargin, `${geom.margins.basePct}%`);
  setText(valBias, state.biasX === 0 ? "0%（居中）" : `${state.biasX > 0 ? "+" : ""}${Math.round(state.biasX * 100)}%`);
  setText(valBorder, `${geom.frame.borderPct}%`);

  // 开关按钮同步
  btnMirror.classList.toggle("is-active", state.mirror);
  btnMirror.setAttribute("aria-pressed", String(state.mirror));
  setText(btnMirror, state.mirror ? "四向镜像锁：开" : "四向镜像锁：关");

  btnGuides.classList.toggle("is-active", state.guides);
  btnGuides.setAttribute("aria-pressed", String(state.guides));
  setText(btnGuides, state.guides ? "中轴对角线：开" : "中轴对角线：关");

  // 四条原海报圆点引注实时探针
  for (const btn of calloutBtns) {
    const key = btn.dataset.pillar;
    const p = res.pillars[key];
    if (!p) continue;
    btn.classList.toggle("is-ok", p.ok);
    const active = state.highlightPillar === key;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
    const tag = btn.querySelector(".callout-tag");
    setText(tag, p.tag);
  }

  // 5 枚核心关键词活体灯
  for (const el of kwItems) {
    const k = el.dataset.kw;
    const info = res.keywords[k];
    if (!info) continue;
    el.classList.toggle("is-ok", info.ok);
    el.classList.toggle("is-warn", !info.ok);
  }

  // 底沿深墨绿 TIPS 通栏实况对勾
  res.tips.forEach((tip, i) => {
    const li = tipItems[i];
    if (!li) return;
    li.classList.toggle("is-ok", tip.ok);
    setText(li.querySelector(".tip-check"), tip.ok ? "✓" : "!");
    setText(li.querySelector(".tip-note"), tip.note);
  });

  // 皮肤切签与说明
  skinBtns.forEach((b) => {
    const on = b.dataset.skin === state.skin;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  const sm = SKIN_META[state.skin];
  if (sm && skinCaption) {
    setText(skinCaption, `横拖画布校准 1:1 正方 · 轻点 3×3 格位落印 · 当前皮肤：${sm.name}`);
  }

  // 落印笔刷切签
  brushBtns.forEach((b) => {
    const on = Number(b.dataset.brush) === state.brush;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

// ---------- 事件绑定 ----------
ctrlAspect.addEventListener("input", () => {
  let v = Number(ctrlAspect.value);
  if (Math.abs(v - 1) < 0.015) v = 1;
  state.aspect = v;
  syncAll();
});

ctrlMargin.addEventListener("input", () => {
  state.margin = Number(ctrlMargin.value);
  syncAll();
});

ctrlBias.addEventListener("input", () => {
  let v = Number(ctrlBias.value);
  if (Math.abs(v) < 0.008) v = 0;
  state.biasX = v;
  syncAll();
});

ctrlBorder.addEventListener("input", () => {
  state.borderW = Number(ctrlBorder.value);
  syncAll();
});

btnMirror.addEventListener("click", () => {
  state.mirror = !state.mirror;
  syncAll();
});

btnGuides.addEventListener("click", () => {
  state.guides = !state.guides;
  syncAll();
});

btnFixStep.addEventListener("click", () => {
  if (currentActionType === "reset_broken") {
    Object.assign(state, PRESETS.broken.patch, { cells: [...PRESETS.broken.patch.cells] });
  } else {
    applyFixStep(state, currentActionType);
  }
  syncAll();
});

skinBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.skin = b.dataset.skin;
    syncAll();
  });
});

brushBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.brush = Number(b.dataset.brush);
    syncAll();
  });
});

presetBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    Object.assign(state, p.patch, { cells: [...p.patch.cells] });
    state.highlightPillar = null;
    syncAll();
  });
});

calloutBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const key = b.dataset.pillar;
    state.highlightPillar = state.highlightPillar === key ? null : key;
    syncAll();
  });
});

// 画布键盘交互：←/→ 调框比，↑/↓ 调内留白，空格在选中格落印/清空，1-9 切换选中格
heroCanvas.addEventListener("keydown", (ev) => {
  if (ev.key === "ArrowLeft") {
    ev.preventDefault();
    state.aspect = +clamp(state.aspect - 0.04, 0.72, 1.42).toFixed(2);
    if (Math.abs(state.aspect - 1) < 0.025) state.aspect = 1;
    syncAll();
  } else if (ev.key === "ArrowRight") {
    ev.preventDefault();
    state.aspect = +clamp(state.aspect + 0.04, 0.72, 1.42).toFixed(2);
    if (Math.abs(state.aspect - 1) < 0.025) state.aspect = 1;
    syncAll();
  } else if (ev.key === "ArrowUp") {
    ev.preventDefault();
    state.margin = +clamp(state.margin + 0.01, 0.03, 0.22).toFixed(2);
    syncAll();
  } else if (ev.key === "ArrowDown") {
    ev.preventDefault();
    state.margin = +clamp(state.margin - 0.01, 0.03, 0.22).toFixed(2);
    syncAll();
  } else if (ev.key === " " || ev.key === "Enter") {
    ev.preventDefault();
    const idx = state.selectedCell;
    state.cells[idx] = state.cells[idx] === state.brush ? CELL_EMPTY : state.brush;
    syncAll();
  } else if (/^[1-9]$/.test(ev.key)) {
    state.selectedCell = Number(ev.key) - 1;
    syncAll();
  }
});

// 初始化正文 01–07 节全部差异化交互组件
initBuildStepsWidget();
initArnheimFieldWidget();
initFourMethodsWidget();
initHistoryWidget();
initFitCompareWidget();
initQuizWidget();
initPosterLightbox();

syncAll();
