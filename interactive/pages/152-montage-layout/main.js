// 152 蒙太奇版式 · 主入口（活体暗房剪辑台 + 六节互动总装配）
import { loop, reducedMotion } from "../../lib/stage.js";
import {
  SCRIPTS,
  TONE_LABELS,
  SCALE_LABELS,
  createBrokenState,
  createPosterSolution,
  createAltSolution,
  diagnose,
} from "./model.js";
import { renderMontageStage, hitTestFrame } from "./artwork.js";
import {
  initKuleshovSection,
  initAnatomySection,
  initHistorySection,
  initScenarioSection,
  initQuizSection,
  initPosterLightbox,
} from "./sections.js";

const canvas = document.getElementById("montage-canvas");
const spliceTrack = document.getElementById("splice-track");
const spliceThumb = document.getElementById("splice-thumb");
const spliceFill = document.getElementById("splice-fill");
const spliceLabelEl = document.getElementById("splice-readout");
const filmstripEl = document.getElementById("filmstrip-slots");
const topStatusBadge = document.getElementById("top-status-badge");

// 诊单元素
const diagCard = document.getElementById("diag-card");
const diagBadge = document.getElementById("diag-badge");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const diagMeaning = document.getElementById("diag-meaning");
const mOverlap = document.getElementById("m-overlap");
const mRatio = document.getElementById("m-ratio");
const mContrast = document.getElementById("m-contrast");
const mAccent = document.getElementById("m-accent");
const sixListEl = document.getElementById("six-live-list");

// 顶部剧本与动作按钮
const scriptBtns = [...document.querySelectorAll("[data-script]")];
const btnSolveA = document.getElementById("btn-solve-poster");
const btnSolveB = document.getElementById("btn-solve-alt");
const btnReset = document.getElementById("btn-reset-broken");
const btnLines = document.getElementById("btn-toggle-lines");

let state = createBrokenState("poster");
let introDone = reducedMotion.matches;
let introProgress = reducedMotion.matches ? 1 : 0.15;
let dirty = true;
let lastDiag = null;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function updateUI(diag) {
  lastDiag = diag;

  // 顶栏实况徽
  if (topStatusBadge) {
    topStatusBadge.textContent = diag.passedCount === 4 ? "4/4 蒙太奇成立" : `${diag.passedCount}/4 待剪辑`;
    topStatusBadge.classList.toggle("is-ok", diag.passedCount === 4);
  }

  // 底沿 35mm 咬合拖轨位置（滑块严格收在轨框之内，绝不探出左右边界）
  if (spliceThumb && spliceFill) {
    const ratio = clamp(state.splice, 0, 1);
    const pct = ratio * 100;
    spliceThumb.style.left = `calc(36px + (100% - 72px) * ${ratio.toFixed(4)})`;
    spliceFill.style.width = `${pct}%`;
    spliceTrack.setAttribute("aria-valuenow", String(Math.round(pct)));
    spliceTrack.setAttribute("aria-valuetext", `叠合率 ${diag.overlapPct}%`);
    spliceThumb.textContent = `↔ ${diag.overlapPct}%`;
    spliceThumb.classList.toggle("is-ok", diag.spliceOk);
    spliceThumb.classList.toggle("is-err", !diag.spliceOk);
  }
  if (spliceLabelEl) {
    const tag = diag.overlapPct < 11 ? "零叠退化网格" : diag.overlapPct > 42 || diag.maxCoreOccludedPct > 34 ? "过叠糊死核心" : "接缝咬合甜区";
    spliceLabelEl.textContent = `${diag.overlapPct}% · ${tag}`;
    spliceLabelEl.classList.toggle("is-ok", diag.spliceOk);
  }

  // 炭黑暗房白话诊单
  if (diagCard) {
    diagCard.classList.toggle("is-ok", diag.primary.ok);
    diagBadge.textContent = diag.primary.badge;
    diagHeadline.textContent = diag.primary.headline;
    diagWhy.textContent = diag.primary.why;
    diagAction.textContent = diag.primary.action;
    diagMeaning.textContent = diag.thirdMeaning;

    mOverlap.textContent = `${diag.overlapPct}%`;
    mOverlap.classList.toggle("is-ok", diag.spliceOk);
    mRatio.textContent = `${diag.scaleRatio.toFixed(1)}×`;
    mRatio.classList.toggle("is-ok", diag.rhythmOk);
    mContrast.textContent = `${diag.contrastRatio}:1`;
    mContrast.classList.toggle("is-ok", diag.darkCount >= 1 && diag.lightCount >= 1 && diag.contrastRatio >= 6);
    mAccent.textContent = `${diag.accentCount} 处`;
    mAccent.classList.toggle("is-ok", diag.accentCount === 1);
  }

  // 右下深酒红 6 维原海报实况清单
  if (sixListEl) {
    diag.sixPoints.forEach((p) => {
      const row = sixListEl.querySelector(`[data-six="${p.id}"]`);
      if (!row) return;
      row.classList.toggle("is-ok", p.ok);
      row.classList.toggle("is-hl", state.highlightMetric === p.id);
      const st = row.querySelector(".six-status");
      if (st) st.textContent = p.status;
    });
  }

  // 剧本切换高亮
  scriptBtns.forEach((b) => {
    const on = b.dataset.script === state.scriptId;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  if (btnLines) {
    btnLines.setAttribute("aria-pressed", String(state.showLines));
    btnLines.textContent = state.showLines ? "视线折线：开" : "视线折线：关";
  }

  // 渲染 4 帧胶片齿孔操盘槽
  renderFilmstrip();
}

let lastFilmSig = "";

function renderFilmstrip() {
  if (!filmstripEl) return;
  const sig = `${state.scriptId}|${state.activeId}|${state.frames.map((f) => `${f.id}:${f.scale}:${f.tone}:${f.accent ? 1 : 0}`).join(",")}`;
  if (sig === lastFilmSig) return;
  lastFilmSig = sig;
  const tones = ["dark", "maroon", "paper"];
  const scales = ["S", "M", "L"];

  filmstripEl.innerHTML = state.frames
    .map((f, i) => {
      const isActive = f.id === state.activeId;
      return `
        <div class="film-slot ${isActive ? "is-selected" : ""}" data-slot-id="${f.id}">
          <div class="film-slot-top">
            <button type="button" class="film-select-btn" data-act="select" data-id="${f.id}" aria-pressed="${isActive}">
              <span class="film-num">0${i + 1}</span>
              <span class="film-name">${f.name}</span>
            </button>
            ${i < state.frames.length - 1 ? `<button type="button" class="film-swap-btn" data-act="swap" data-idx="${i}" aria-label="对调第 ${i + 1} 帧与第 ${i + 2} 帧" title="与下一帧换序">⇄</button>` : `<span class="film-role-tag">${f.tag.slice(0, 1)}</span>`}
          </div>
          <div class="film-slot-ctrl">
            <button type="button" class="chip-btn" data-act="scale" data-id="${f.id}" title="切换景别尺度">${f.scale}·${SCALE_LABELS[f.scale].slice(0, 2)}</button>
            <button type="button" class="chip-btn tone-${f.tone}" data-act="tone" data-id="${f.id}" title="切换明暗极性">${TONE_LABELS[f.tone].slice(0, 2)}</button>
            <button type="button" class="chip-btn ${f.accent ? "is-amber" : ""}" data-act="accent" data-id="${f.id}" aria-pressed="${f.accent}" title="开关焦糖橘高光标记">${f.accent ? "橘标开" : "橘标关"}</button>
          </div>
        </div>
      `;
    })
    .join("");

  filmstripEl.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "swap") {
        const idx = Number(btn.dataset.idx);
        const arr = [...state.frames];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        state.frames = arr;
        markDirty();
        return;
      }
      const id = btn.dataset.id;
      const frame = state.frames.find((x) => x.id === id);
      if (!frame) return;
      state.activeId = id;
      if (act === "scale") {
        const next = scales[(scales.indexOf(frame.scale) + 1) % scales.length];
        frame.scale = next;
      } else if (act === "tone") {
        const next = tones[(tones.indexOf(frame.tone) + 1) % tones.length];
        frame.tone = next;
      } else if (act === "accent") {
        frame.accent = !frame.accent;
      }
      markDirty();
    });
  });
}

let stageLoop = null;
function markDirty(immediate = true) {
  dirty = true;
  if (immediate && stageLoop) stageLoop.draw();
}

// 1. 绑定主舞台循环（省电：不在屏幕上或切走标签自动停；拖拽时节流合并到 RAF 帧率，避免单帧内重复重画）
if (canvas) {
  stageLoop = loop(canvas, (t, dt, { still }) => {
    if (still) {
      introProgress = 1;
      introDone = true;
      const d = renderMontageStage(canvas, state, 1);
      if (d) updateUI(d);
      dirty = false;
      return;
    }
    if (!introDone) {
      introProgress = Math.min(1, introProgress + (dt > 0 ? dt * 1.45 : 0.04));
      if (introProgress >= 1) introDone = true;
      dirty = true;
    }
    if (dirty) {
      const d = renderMontageStage(canvas, state, introProgress);
      if (d) updateUI(d);
      dirty = false;
    }
  });

  // 首帧立绘（不等待慢触发）
  const d0 = renderMontageStage(canvas, state, introProgress);
  if (d0) updateUI(d0);
  window.addEventListener("resize", () => markDirty(false));
}

// 2. 底沿 35mm 接缝咬合拖轨（标有 data-perf-drag，支持鼠标、触屏与键盘）
if (spliceTrack) {
  let trackDragging = false;
  let trackRect = null;
  const setFromClientX = (clientX) => {
    const r = trackRect || spliceTrack.getBoundingClientRect();
    const ratio = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
    const next = +ratio.toFixed(3);
    if (next === state.splice) return;
    state.splice = next;
    // 只标脏，交由 loop() 的 requestAnimationFrame 在下一帧统一绘制（拖动绝不卡主线程）
    dirty = true;
    if (reducedMotion.matches) markDirty(true);
  };

  spliceTrack.addEventListener("pointerdown", (e) => {
    trackDragging = true;
    trackRect = spliceTrack.getBoundingClientRect();
    spliceTrack.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  });
  spliceTrack.addEventListener("pointermove", (e) => {
    if (!trackDragging) return;
    setFromClientX(e.clientX);
  });
  const endTrack = () => { trackDragging = false; trackRect = null; };
  spliceTrack.addEventListener("pointerup", endTrack);
  spliceTrack.addEventListener("pointercancel", endTrack);

  // 同时支持原生 Touch 事件以兼容 CDP touch 压测
  spliceTrack.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    trackDragging = true;
    trackRect = spliceTrack.getBoundingClientRect();
    setFromClientX(e.touches[0].clientX);
  }, { passive: true });
  spliceTrack.addEventListener("touchmove", (e) => {
    if (!trackDragging || !e.touches.length) return;
    setFromClientX(e.touches[0].clientX);
  }, { passive: true });
  spliceTrack.addEventListener("touchend", endTrack, { passive: true });

  spliceTrack.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.04;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.splice = clamp(+(state.splice + step).toFixed(3), 0, 1);
      markDirty(true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.splice = clamp(+(state.splice - step).toFixed(3), 0, 1);
      markDirty(true);
    }
  });
}

// 3. 画布内直接点击选中 & 拖移任意片段（触屏空白区域允许正常滚页！）
if (canvas) {
  let dragFrame = null;
  let startX = 0, startY = 0, origDx = 0, origDy = 0;

  const getNorm = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return {
      u: (clientX - r.left) / Math.max(1, r.width),
      v: (clientY - r.top) / Math.max(1, r.height),
      w: Math.max(1, r.width),
      h: Math.max(1, r.height),
    };
  };

  canvas.addEventListener("pointerdown", (e) => {
    const p = getNorm(e.clientX, e.clientY);
    const hit = hitTestFrame(state, p.u, p.v);
    if (!hit) return;
    state.activeId = hit.id;
    dragFrame = state.frames.find((x) => x.id === hit.id);
    startX = e.clientX;
    startY = e.clientY;
    origDx = dragFrame.dx || 0;
    origDy = dragFrame.dy || 0;
    canvas.setPointerCapture(e.pointerId);
    markDirty(true);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragFrame) return;
    const r = canvas.getBoundingClientRect();
    const du = (e.clientX - startX) / Math.max(1, r.width);
    const dv = (e.clientY - startY) / Math.max(1, r.height);
    dragFrame.dx = clamp(+(origDx + du).toFixed(3), -0.28, 0.28);
    dragFrame.dy = clamp(+(origDy + dv).toFixed(3), -0.26, 0.26);
    markDirty(true);
  });

  const endFrameDrag = () => { dragFrame = null; };
  canvas.addEventListener("pointerup", endFrameDrag);
  canvas.addEventListener("pointercancel", endFrameDrag);

  // 画布获得键盘焦点时，支持方向键微移当前选中帧、Tab 或 [ ] 换序
  canvas.addEventListener("keydown", (e) => {
    const f = state.frames.find((x) => x.id === state.activeId);
    if (!f) return;
    const step = 0.025;
    if (e.key === "ArrowLeft") { e.preventDefault(); f.dx = clamp(+(f.dx - step).toFixed(3), -0.28, 0.28); markDirty(true); }
    else if (e.key === "ArrowRight") { e.preventDefault(); f.dx = clamp(+(f.dx + step).toFixed(3), -0.28, 0.28); markDirty(true); }
    else if (e.key === "ArrowUp") { e.preventDefault(); f.dy = clamp(+(f.dy - step).toFixed(3), -0.26, 0.26); markDirty(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); f.dy = clamp(+(f.dy + step).toFixed(3), -0.26, 0.26); markDirty(true); }
    else if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      const idx = state.frames.findIndex((x) => x.id === f.id);
      const next = e.key === "[" ? idx - 1 : idx + 1;
      if (next >= 0 && next < state.frames.length) {
        const arr = [...state.frames];
        [arr[idx], arr[next]] = [arr[next], arr[idx]];
        state.frames = arr;
        markDirty(true);
      }
    }
  });
}

// 4. 剧本切换、快捷参考解、复原错态、视线折线与六维高亮
scriptBtns.forEach((b) => {
  b.addEventListener("click", () => {
    const nextId = b.dataset.script;
    if (!SCRIPTS[nextId]) return;
    // 保留当前用户调好的参数（splice/尺度/极性/爆点），只换题材与对应角色名称
    const newFrames = SCRIPTS[nextId].frames;
    const byRole = Object.fromEntries(newFrames.map((x) => [x.role, x]));
    state.scriptId = nextId;
    state.frames = state.frames.map((old) => ({
      ...old,
      ...byRole[old.role],
      scale: old.scale,
      tone: old.tone,
      accent: old.accent,
      dx: old.dx,
      dy: old.dy,
    }));
    markDirty(true);
  });
});

btnSolveA?.addEventListener("click", () => {
  state = createPosterSolution(state.scriptId);
  markDirty(true);
});

btnSolveB?.addEventListener("click", () => {
  state = createAltSolution(state.scriptId);
  markDirty(true);
});

btnReset?.addEventListener("click", () => {
  state = createBrokenState(state.scriptId);
  markDirty(true);
});

btnLines?.addEventListener("click", () => {
  state.showLines = !state.showLines;
  markDirty(true);
});

if (sixListEl) {
  sixListEl.querySelectorAll("[data-six]").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.six;
      state.highlightMetric = state.highlightMetric === id ? null : id;
      markDirty(true);
    });
  });
}

// 5. 初始化正文 01–06 节互动
initKuleshovSection();
initAnatomySection();
initHistorySection();
initScenarioSection();
initQuizSection();
initPosterLightbox();
