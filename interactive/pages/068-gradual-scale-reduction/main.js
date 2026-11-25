// 068 尺度递减构图 · 主入口与单真源状态总控

import { PALETTE } from "./palette.js";
import {
  createInitialState,
  PRESETS,
  evaluate,
  clamp,
} from "./model.js";
import { createHeroStage } from "./hero-canvas.js";
import {
  initSection01,
  initSection02,
  initSection03,
  initSection04,
  initSection05,
  initSection06,
  initLightbox,
} from "./sections.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

const state = createInitialState();

// DOM 引用
const topStatus = document.getElementById("top-status");
const heroChars = [...document.querySelectorAll("#hero-title .t-char")];
const diagBox = document.getElementById("diag-box");
const diagTag = document.getElementById("diag-tag");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagFix = document.getElementById("diag-fix");
const mSpan = document.getElementById("m-span");
const mStep = document.getElementById("m-step");
const mGap = document.getElementById("m-gap");
const mDepth = document.getElementById("m-depth");
const dcItems = {
  scale: document.getElementById("dc-scale"),
  gradation: document.getElementById("dc-gradation"),
  depth: document.getElementById("dc-depth"),
  rhythm: document.getElementById("dc-rhythm"),
};

const kwBadges = {
  scale: document.getElementById("kw-scale-badge"),
  gradation: document.getElementById("kw-gradation-badge"),
  depth: document.getElementById("kw-depth-badge"),
  rhythm: document.getElementById("kw-rhythm-badge"),
};

const ratioRail = document.getElementById("ratio-rail");
const railFill = document.getElementById("rail-fill");
const railThumb = document.getElementById("rail-thumb");
const thumbNum = document.getElementById("thumb-num");
const scaleRatioReadout = document.getElementById("scale-ratio-readout");
const scaleLawNote = document.getElementById("scale-law-note");
const scaleRulerDots = document.getElementById("scale-ruler-dots");
const stageSelectedPill = document.getElementById("stage-selected-pill");

const btnCone = document.getElementById("btn-cone");
const btnPresetPoster = document.getElementById("btn-preset-poster");
const btnPresetHarmonic = document.getElementById("btn-preset-harmonic");
const btnReset = document.getElementById("btn-reset");
const btnBleed = document.getElementById("btn-bleed");
const btnFixRev = document.getElementById("btn-fix-reversal");
const btnCountDec = document.getElementById("btn-count-dec");
const btnCountInc = document.getElementById("btn-count-inc");
const countVal = document.getElementById("count-val");

const tipDirBadge = document.getElementById("tip-dir-badge");
const tipDepthBadge = document.getElementById("tip-depth-badge");
const tipRhythmBadge = document.getElementById("tip-rhythm-badge");
const miniSvgDir = document.getElementById("mini-svg-dir");
const miniSvgDepth = document.getElementById("mini-svg-depth");

const themeBtns = [...document.querySelectorAll("[data-theme]")];
const pathBtns = [...document.querySelectorAll("[data-path]")];
const spacingBtns = [...document.querySelectorAll("[data-spacing]")];
const lawBtns = [...document.querySelectorAll("[data-law]")];

const heroCanvas = document.getElementById("hero-canvas");
const stage = createHeroStage(heroCanvas, {
  onRatioChange(r, instant) {
    state.ratio = Number(r.toFixed(3));
    if (state.law === "poster") state.law = "geometric";
    sync(instant);
  },
  onCircleClick(index) {
    state.selected = index;
    const hasOv = state.overrides[index] != null && Math.abs(state.overrides[index] - 1) > 0.02;
    if (hasOv) {
      delete state.overrides[index];
    } else if (index > 0) {
      // 点击正常圆可主动触发反弹以做试错压测，再点一次恢复
      state.overrides[index] = 1.38;
    }
    sync(false);
  },
  onNudgeSelected(delta) {
    const idx = state.selected;
    const cur = state.overrides[idx] ?? 1;
    const next = clamp(cur + delta, 0.55, 1.5);
    if (Math.abs(next - 1) < 0.06) delete state.overrides[idx];
    else state.overrides[idx] = Number(next.toFixed(2));
    sync(false);
  },
  onSelect(index) {
    state.selected = index;
    sync(false);
  },
});

// 渲染下方原海报三联「应用技巧」卡片内的实时微缩矢量图
function renderMiniSvgs(evalRes) {
  // 1. 建立方向微图（复刻原海报：渐小四圆 + 虚线指向实心靶圆）
  if (miniSvgDir) {
    miniSvgDir.innerHTML = "";
    const ok = evalRes.checks.rhythmOk;
    const col = ok ? PALETTE.olive : PALETTE.err;
    const radii = [16, 12, 8.5, 5.5];
    const xs = [26, 58, 84, 104];
    const ys = state.pathMode === "derailed" ? [28, 17, 37, 22] : [28, 28, 28, 28];
    radii.forEach((r, i) => {
      miniSvgDir.append(svgEl("circle", { cx: xs[i], cy: ys[i], r, fill: col }));
    });
    const endY = state.pathMode === "derailed" ? 41 : 28;
    miniSvgDir.append(svgEl("line", {
      x1: 118, y1: ys[3], x2: 196, y2: endY,
      stroke: col, "stroke-width": 1.6, "stroke-dasharray": "5 4",
    }));
    // 远端焦点圆
    miniSvgDir.append(svgEl("circle", { cx: 222, cy: 28, r: 16, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.5 }));
    miniSvgDir.append(svgEl("circle", { cx: 222, cy: 28, r: 7, fill: ok ? PALETTE.ink : PALETTE.err }));
  }

  // 2. 增强深度微图（复刻原海报：上下双切线包裹 6 枚渐小圆）
  if (miniSvgDepth) {
    miniSvgDepth.innerHTML = "";
    const ok = evalRes.checks.depthOk && state.headAnchor === "bleed";
    const col = ok ? PALETTE.olive : PALETTE.err;
    const n = 6;
    const rs = [19, 14, 10.5, 7.8, 5.8, 4.2];
    const xs = state.spacingMode === "perspective"
      ? [30, 74, 110, 139, 162, 181]
      : state.spacingMode === "wide"
        ? [28, 54, 86, 124, 170, 224]
        : [30, 68, 106, 144, 182, 220];

    // 上下双包络切线
    miniSvgDepth.append(svgEl("line", { x1: xs[0], y1: 28 - rs[0], x2: 248, y2: 26, stroke: PALETTE.oliveLine, "stroke-width": 1.2 }));
    miniSvgDepth.append(svgEl("line", { x1: xs[0], y1: 28 + rs[0], x2: 248, y2: 30, stroke: PALETTE.oliveLine, "stroke-width": 1.2 }));

    for (let i = 0; i < n; i++) {
      miniSvgDepth.append(svgEl("circle", { cx: xs[i], cy: 28, r: rs[i], fill: col }));
    }
  }
}

// 渲染奶黄卡片里的 8 枚实体活体比例圆（点击可选中或修补）
function renderRulerDots(evalRes) {
  const showItems = evalRes.items.slice(0, 8);
  const revSet = new Set(evalRes.layout.reversals.map((r) => r.index));
  scaleRulerDots.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const it = showItems[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ruler-dot-btn";
    if (!it) {
      btn.disabled = true;
      btn.innerHTML = `<span class="rd-circle-wrap"></span><span class="rd-label" lang="en">—</span>`;
      scaleRulerDots.append(btn);
      continue;
    }
    const isRev = revSet.has(i);
    if (state.selected === i) btn.classList.add("is-selected");
    if (isRev) btn.classList.add("is-reversal");
    const dia = clamp(Math.round(34 * it.scale), 4, 36);
    btn.setAttribute("aria-label", `第 ${i + 1} 级，相对比例 ${it.label}${isRev ? "（反弹破序）" : ""}`);
    btn.innerHTML = `<span class="rd-circle-wrap"><span class="rd-circle" style="width:${dia}px;height:${dia}px"></span></span><span class="rd-label" lang="en">${it.label}</span>`;
    btn.addEventListener("click", () => {
      state.selected = i;
      if (state.overrides[i] != null && Math.abs(state.overrides[i] - 1) > 0.02) {
        delete state.overrides[i];
      }
      sync(false);
    });
    scaleRulerDots.append(btn);
  }
}

function sync(instant = false) {
  const aspect = stage.getAspect();
  const evalRes = evaluate(state, aspect);
  const { metrics, primary, keywords, checks, allOk, passedCount } = evalRes;

  // 1. 顶眉胶囊
  topStatus.textContent = allOk ? "4 / 4 秩序成立" : `${passedCount} / 4 待理序`;
  topStatus.classList.toggle("is-ok", allOk);
  topStatus.classList.toggle("is-err", !allOk);

  // 2. 活体阶梯示范大标「尺度递减构图」：随衰减比轻度呈现阶梯秩序
  const revExists = evalRes.layout.reversals.length > 0;
  const titleDecay = clamp(1 - (1 - metrics.avgStepRatio) * 0.14, 0.94, 0.995);
  heroChars.forEach((ch, idx) => {
    let sc = Math.pow(titleDecay, idx);
    if (revExists && idx === 3) sc = Math.min(1.06, sc * 1.12);
    ch.style.transform = `scale(${sc.toFixed(3)})`;
    ch.style.color = revExists && idx === 3 ? PALETTE.err : "";
  });

  // 3. 原海报四组关键词实况徽
  for (const key of ["scale", "gradation", "depth", "rhythm"]) {
    const elBadge = kwBadges[key];
    const info = keywords[key];
    if (!elBadge || !info) continue;
    elBadge.textContent = info.badge;
    elBadge.classList.toggle("is-ok", info.ok);
    elBadge.classList.toggle("is-err", !info.ok);
  }

  // 4. 白话单真源实测诊单
  diagBox.classList.toggle("is-ok", allOk);
  diagBox.classList.toggle("is-err", !allOk);
  diagTag.textContent = primary.tag;
  diagHeadline.textContent = primary.headline;
  diagWhy.textContent = primary.why;
  diagFix.textContent = primary.fix;

  mSpan.textContent = `${metrics.spanRatio.toFixed(1)}×`;
  mStep.textContent = `${metrics.avgStepRatio.toFixed(2)}×`;
  mGap.textContent = `${Math.round(metrics.gapConvergence * 100)}%`;
  mDepth.textContent = `${metrics.endDistRatio.toFixed(1)}×`;

  const checkMap = {
    scale: checks.scaleOk,
    gradation: checks.gradationOk,
    depth: checks.depthOk,
    rhythm: checks.rhythmOk,
  };
  for (const [k, ok] of Object.entries(checkMap)) {
    const li = dcItems[k];
    if (!li) continue;
    li.classList.toggle("is-ok", ok);
    li.classList.toggle("is-err", !ok);
  }

  // 5. 奶黄比例尺滑轨位置与实况读数
  const pct = clamp(((state.ratio - 0.42) / (0.97 - 0.42)) * 100, 0, 100);
  railFill.style.width = `${pct}%`;
  railThumb.style.left = `${clamp(pct, 6, 94)}%`;
  const ratioInSweet = state.ratio >= 0.64 && state.ratio <= 0.84;
  railThumb.classList.toggle("is-ok", ratioInSweet && !revExists);
  railThumb.classList.toggle("is-err", !ratioInSweet);
  thumbNum.textContent = state.ratio.toFixed(2);
  scaleRatioReadout.textContent = `r = ${state.ratio.toFixed(2)}`;
  scaleLawNote.textContent = `拖轨实时雕刻衰减比 · 当前均步 ${metrics.avgStepRatio.toFixed(2)}× · 跨比 ${metrics.spanRatio.toFixed(1)}×`;
  ratioRail.setAttribute("aria-valuenow", String(Math.round(state.ratio * 100)));
  ratioRail.setAttribute("aria-valuetext", `衰减比 ${state.ratio.toFixed(2)}`);

  renderRulerDots(evalRes);

  // 6. 工具条与三联技巧卡状态同步
  stageSelectedPill.textContent = `已选 #${state.selected + 1}`;
  btnCone.textContent = state.showCone ? "视线锥: 开" : "视线锥: 关";
  btnCone.setAttribute("aria-pressed", state.showCone ? "true" : "false");
  btnCone.classList.toggle("is-active", state.showCone);

  themeBtns.forEach((b) => {
    const on = b.dataset.theme === state.theme;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });

  pathBtns.forEach((b) => {
    const on = b.dataset.path === state.pathMode;
    b.classList.toggle("is-active", on && state.pathMode !== "derailed");
    b.classList.toggle("is-err-active", on && state.pathMode === "derailed");
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });

  spacingBtns.forEach((b) => {
    const on = b.dataset.spacing === state.spacingMode;
    b.classList.toggle("is-active", on && state.spacingMode === "perspective");
    b.classList.toggle("is-err-active", on && state.spacingMode !== "perspective");
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });

  lawBtns.forEach((b) => {
    const on = b.dataset.law === state.law;
    b.classList.toggle("is-active", on && state.law !== "linear");
    b.classList.toggle("is-err-active", on && state.law === "linear");
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });

  const bleedOn = state.headAnchor === "bleed";
  btnBleed.textContent = bleedOn ? "前景出血: 开" : "前景出血: 关";
  btnBleed.setAttribute("aria-pressed", bleedOn ? "true" : "false");
  btnBleed.classList.toggle("is-active", bleedOn);
  btnBleed.classList.toggle("is-err-active", !bleedOn);

  const hasRev = evalRes.layout.reversals.length > 0;
  btnFixRev.textContent = hasRev ? "修补反弹" : "单调无反弹";
  btnFixRev.classList.toggle("is-clean", !hasRev);
  countVal.textContent = `${state.count} 级`;

  // 三联技巧卡徽章
  tipDirBadge.textContent = checks.rhythmOk ? "动线顺畅" : keywords.rhythm.badge;
  tipDirBadge.classList.toggle("is-ok", checks.rhythmOk);
  tipDirBadge.classList.toggle("is-err", !checks.rhythmOk);

  const depthPairOk = checks.depthOk && bleedOn;
  tipDepthBadge.textContent = depthPairOk ? "纵深成立" : `${keywords.depth.badge}${bleedOn ? "" : " · 失锚"}`;
  tipDepthBadge.classList.toggle("is-ok", depthPairOk);
  tipDepthBadge.classList.toggle("is-err", !depthPairOk);

  tipRhythmBadge.textContent = checks.gradationOk ? `均比 ${metrics.avgStepRatio.toFixed(2)}×` : keywords.gradation.badge;
  tipRhythmBadge.classList.toggle("is-ok", checks.gradationOk);
  tipRhythmBadge.classList.toggle("is-err", !checks.gradationOk);

  renderMiniSvgs(evalRes);

  // 7. 推送同一份单真源结果给开场画布
  stage.update(state, evalRes, instant);
}

// ==================== 绑定奶黄比例尺 data-perf-drag（同时丝滑支持鼠标与触摸拖拽） ====================
function setRatioFromClientX(clientX) {
  const rect = ratioRail.getBoundingClientRect();
  if (!rect.width) return;
  const frac = clamp((clientX - rect.left) / rect.width, 0, 1);
  const next = 0.42 + frac * (0.97 - 0.42);
  state.ratio = Number(next.toFixed(3));
  if (state.law === "poster") state.law = "geometric";
  sync(true);
}

let railPointerId = null;
ratioRail.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触摸走原生 touch 事件以完全兼容 CDP Input.dispatchTouchEvent
  railPointerId = e.pointerId;
  try { ratioRail.setPointerCapture(e.pointerId); } catch {}
  setRatioFromClientX(e.clientX);
});
ratioRail.addEventListener("pointermove", (e) => {
  if (railPointerId === null || e.pointerId !== railPointerId) return;
  setRatioFromClientX(e.clientX);
});
const releaseRail = (e) => {
  if (railPointerId !== null && e.pointerId === railPointerId) railPointerId = null;
};
ratioRail.addEventListener("pointerup", releaseRail);
ratioRail.addEventListener("pointercancel", releaseRail);

let touchDrag = null;
ratioRail.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  if (!t) return;
  touchDrag = { x: t.clientX, y: t.clientY, lockedH: false };
  setRatioFromClientX(t.clientX);
}, { passive: true });

ratioRail.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  if (!t || !touchDrag) return;
  const dx = Math.abs(t.clientX - touchDrag.x);
  const dy = Math.abs(t.clientY - touchDrag.y);
  if (touchDrag.lockedH || dx >= dy * 0.8) {
    touchDrag.lockedH = true;
    setRatioFromClientX(t.clientX);
  }
}, { passive: true });

ratioRail.addEventListener("touchend", () => { touchDrag = null; }, { passive: true });
ratioRail.addEventListener("touchcancel", () => { touchDrag = null; }, { passive: true });

ratioRail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.ratio = clamp(Number((state.ratio - 0.02).toFixed(3)), 0.42, 0.97);
    if (state.law === "poster") state.law = "geometric";
    sync(false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.ratio = clamp(Number((state.ratio + 0.02).toFixed(3)), 0.42, 0.97);
    if (state.law === "poster") state.law = "geometric";
    sync(false);
  }
});

// ==================== 绑定题材、技巧槽与预设按钮 ====================
themeBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    sync(false);
  });
});

btnCone.addEventListener("click", () => {
  state.showCone = !state.showCone;
  sync(false);
});

btnPresetPoster.addEventListener("click", () => {
  Object.assign(state, PRESETS.poster.state, { overrides: {} });
  sync(false);
});

btnPresetHarmonic.addEventListener("click", () => {
  Object.assign(state, PRESETS.harmonic.state, { overrides: {} });
  sync(false);
});

btnReset.addEventListener("click", () => {
  Object.assign(state, createInitialState());
  sync(false);
});

pathBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.pathMode = b.dataset.path;
    sync(false);
  });
});

spacingBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.spacingMode = b.dataset.spacing;
    sync(false);
  });
});

btnBleed.addEventListener("click", () => {
  state.headAnchor = state.headAnchor === "bleed" ? "floating" : "bleed";
  sync(false);
});

btnFixRev.addEventListener("click", () => {
  if (Object.keys(state.overrides).length > 0) {
    state.overrides = {};
  } else {
    state.overrides = { 3: 1.38 };
    state.selected = 3;
  }
  sync(false);
});

lawBtns.forEach((b) => {
  b.addEventListener("click", () => {
    state.law = b.dataset.law;
    if (state.law === "poster") state.ratio = 0.72;
    sync(false);
  });
});

btnCountDec.addEventListener("click", () => {
  state.count = clamp(state.count - 1, 3, 11);
  state.selected = Math.min(state.selected, state.count - 1);
  sync(false);
});

btnCountInc.addEventListener("click", () => {
  state.count = clamp(state.count + 1, 3, 11);
  sync(false);
});

// 初始化首屏与 01–07 全节互动
sync(false);
initSection01();
initSection02();
initSection03();
initSection04();
initSection05();
initSection06();
initLightbox();
