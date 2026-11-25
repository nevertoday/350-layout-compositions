// 311 平面调度 · 主入口（串联开场调度桌、镜头立面游标、四向圆点引注、键盘操作与全页实验）

import { createHeroStage } from "./hero-stage.js";
import {
  initAnatomyLab,
  initAvoidLab,
  initHistoryLab,
  initLensLab,
  initLeverLab,
  initQuizLab,
  initRhythmLab,
} from "./labs.js";
import {
  PIECE_DEFS,
  PIECE_ORDER,
  RULES,
  clampPiecePos,
  clonePreset,
  evaluatePlanar,
} from "./model.js";
import { initPosterLightbox } from "./poster.js";

function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const initData = clonePreset("skewed");
  const state = {
    cameraAngle: initData.cameraAngle,
    pieces: initData.pieces,
    selectedId: "warmBar",
    mode: "poster", // "poster" | "cinema"
    showRefOverlay: false,
  };

  let cachedEval = evaluatePlanar(state);

  // DOM 引用
  const modeBtns = [...document.querySelectorAll("[data-stage-mode]")];
  const pieceBtns = [...document.querySelectorAll("[data-select-piece]")];
  const presetBtns = [...document.querySelectorAll("[data-hero-preset]")];
  const refToggle = document.getElementById("hero-ref-toggle");

  // 四向圆点虚线引注
  const calloutEls = {
    align: {
      wrap: document.getElementById("callout-align"),
      val: document.getElementById("callout-align-val"),
      sub: document.getElementById("callout-align-sub"),
    },
    balance: {
      wrap: document.getElementById("callout-balance"),
      val: document.getElementById("callout-balance-val"),
      sub: document.getElementById("callout-balance-sub"),
    },
    contrast: {
      wrap: document.getElementById("callout-contrast"),
      val: document.getElementById("callout-contrast-val"),
      sub: document.getElementById("callout-contrast-sub"),
    },
    rhythm: {
      wrap: document.getElementById("callout-rhythm"),
      val: document.getElementById("callout-rhythm-val"),
      sub: document.getElementById("callout-rhythm-sub"),
    },
  };

  // 镜头立面角自定义精密游标（标有 data-perf-drag）
  const angleTrack = document.getElementById("angle-track");
  const angleThumb = document.getElementById("angle-thumb");
  const angleFill = document.getElementById("angle-fill");
  const angleReadout = document.getElementById("angle-readout");

  // 诊断带 & 正圆徽记内平衡线
  const diagBox = document.getElementById("hero-diag");
  const diagTag = document.getElementById("hero-diag-tag");
  const diagHead = document.getElementById("hero-diag-head");
  const diagBody = document.getElementById("hero-diag-body");
  const diagCount = document.getElementById("hero-diag-count");
  const sealLine = document.getElementById("seal-balance-line");
  const leverDot = document.getElementById("hero-lever-dot");
  const leverText = document.getElementById("hero-lever-text");

  const stage = createHeroStage(canvas, {
    getState: () => state,
    getEval: () => cachedEval,
    onPieceMove: (id, u, v) => {
      state.pieces[id] = { u, v };
      updateAll();
    },
    onSelectPiece: (id) => {
      state.selectedId = id;
      updateAll();
    },
  });

  function setCameraAngle(rawDeg, allowSnap = true) {
    let a = Math.max(-34, Math.min(34, rawDeg));
    if (allowSnap && Math.abs(a) <= RULES.snapAngleDeg) a = 0;
    state.cameraAngle = Math.round(a * 10) / 10;
    updateAll();
  }

  function updateAll() {
    cachedEval = evaluatePlanar(state);
    const ev = cachedEval;

    // 1) 更新四向圆点虚线引注
    for (const key of ["align", "balance", "contrast", "rhythm"]) {
      const c = ev.callouts[key];
      const el = calloutEls[key];
      if (!el.wrap) continue;
      el.wrap.dataset.ok = c.ok ? "true" : "false";
      if (el.val) el.val.textContent = c.value;
      if (el.sub) el.sub.textContent = c.detail;
    }

    // 2) 更新镜头游标位置（范围 -34° .. +34°，0° 在正中 50%）
    const pct = ((state.cameraAngle + 34) / 68) * 100;
    if (angleThumb) {
      angleThumb.style.left = `${pct}%`;
      angleThumb.setAttribute("aria-valuenow", String(Math.round(state.cameraAngle)));
      angleThumb.setAttribute(
        "aria-valuetext",
        ev.planeOk ? "0度 垂直立面已归正" : `偏斜 ${state.cameraAngle > 0 ? "+" : ""}${Math.round(state.cameraAngle)}度`
      );
      angleThumb.dataset.ok = ev.planeOk ? "true" : "false";
    }
    if (angleFill) {
      const left = Math.min(50, pct);
      const width = Math.abs(pct - 50);
      angleFill.style.left = `${left}%`;
      angleFill.style.width = `${width}%`;
      angleFill.dataset.ok = ev.planeOk ? "true" : "false";
    }
    if (angleReadout) {
      angleReadout.textContent = ev.planeOk
        ? "0° · 垂直立面"
        : `${state.cameraAngle > 0 ? "+" : ""}${Math.round(state.cameraAngle)}° · 斜拍透视`;
      angleReadout.dataset.ok = ev.planeOk ? "true" : "false";
    }

    // 3) 更新右上正圆印章里的微平衡横线
    if (sealLine) {
      const tilt = Math.max(-14, Math.min(14, ev.dxPct * 0.55));
      sealLine.style.transform = `rotate(${tilt}deg)`;
    }

    // 4) 更新阿恩海姆重心微尺
    if (leverDot) {
      const clampX = Math.max(10, Math.min(90, 50 + ev.dxPct * 1.4));
      leverDot.style.left = `${clampX}%`;
      leverDot.dataset.ok = ev.balanceOk ? "true" : "false";
    }
    if (leverText) {
      leverText.textContent = ev.balanceOk
        ? `重心 ${ev.dxPct >= 0 ? "+" : ""}${ev.dxPct}%（平衡带内）`
        : `重心 ${ev.dxPct >= 0 ? "右偏 +" : "左偏 "}${ev.dxPct}%`;
    }

    // 5) 更新白话诊断带
    if (diagBox) diagBox.dataset.level = ev.diagnosis.level;
    if (diagTag) diagTag.textContent = ev.diagnosis.tag;
    if (diagHead) diagHead.textContent = ev.diagnosis.headline;
    if (diagBody) diagBody.textContent = ev.diagnosis.body;
    if (diagCount) diagCount.textContent = `${ev.passedCount} / 5 成立`;

    // 6) 更新场景模式 & 构件选择钮
    const isCinema = state.mode === "cinema";
    modeBtns.forEach((b) => {
      const on = b.dataset.stageMode === state.mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    pieceBtns.forEach((b) => {
      const id = b.dataset.selectPiece;
      const def = PIECE_DEFS[id];
      const on = state.selectedId === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      const nameNode = b.querySelector(".piece-btn-name");
      if (nameNode && def) nameNode.textContent = isCinema ? def.cinemaLabel : def.label;
    });

    // 7) 通关后解锁「叠加 311 原海报参考轮廓」
    if (refToggle) {
      if (!ev.allOk) {
        state.showRefOverlay = false;
        refToggle.disabled = true;
        refToggle.setAttribute("aria-pressed", "false");
        refToggle.textContent = "原海报轮廓（待成序）";
      } else {
        refToggle.disabled = false;
        refToggle.setAttribute("aria-pressed", String(state.showRefOverlay));
        refToggle.textContent = state.showRefOverlay ? "隐藏原海报轮廓" : "叠看原海报轮廓";
      }
    }

    stage.draw();
  }

  // 镜头立面游标拖拽（同时支持鼠标、触屏和 perf.mjs 的 touchMove 拖动）
  if (angleTrack && angleThumb) {
    let draggingTrack = false;
    const angleFromClientX = (clientX) => {
      const rect = angleTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return -34 + ratio * 68;
    };

    const startTrack = (e) => {
      e.preventDefault();
      draggingTrack = true;
      angleTrack.setPointerCapture(e.pointerId);
      setCameraAngle(angleFromClientX(e.clientX), true);
    };
    const moveTrack = (e) => {
      if (!draggingTrack) return;
      e.preventDefault();
      setCameraAngle(angleFromClientX(e.clientX), true);
    };
    const endTrack = (e) => {
      if (!draggingTrack) return;
      draggingTrack = false;
      try {
        angleTrack.releasePointerCapture(e.pointerId);
      } catch {}
    };

    angleTrack.addEventListener("pointerdown", startTrack);
    angleTrack.addEventListener("pointermove", moveTrack);
    angleTrack.addEventListener("pointerup", endTrack);
    angleTrack.addEventListener("pointercancel", endTrack);

    // 兼容只派发 touch* 事件的触控环境（perf.mjs 用 Input.dispatchTouchEvent）
    angleTrack.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches.length) return;
        e.preventDefault();
        setCameraAngle(angleFromClientX(e.touches[0].clientX), true);
      },
      { passive: false }
    );
    angleTrack.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches.length) return;
        e.preventDefault();
        setCameraAngle(angleFromClientX(e.touches[0].clientX), true);
      },
      { passive: false }
    );

    // 游标键盘支持
    angleThumb.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 5 : 2;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCameraAngle(state.cameraAngle - step, false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCameraAngle(state.cameraAngle + step, false);
      } else if (e.key === "0") {
        e.preventDefault();
        setCameraAngle(0, true);
      }
    });
  }

  // 模式切换（海报构成 ↔ 电影立面）
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.mode = b.dataset.stageMode;
      updateAll();
    })
  );

  // 构件选择钮 & 微调方向按钮
  pieceBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.selectedId = b.dataset.selectPiece;
      updateAll();
    })
  );

  // 键盘微调选中构件（聚焦在画布或构件钮上时可用方向键移动）
  const handlePieceKey = (e) => {
    const step = e.shiftKey ? 0.04 : 0.015;
    let du = 0;
    let dv = 0;
    if (e.key === "ArrowLeft") du = -step;
    else if (e.key === "ArrowRight") du = step;
    else if (e.key === "ArrowUp") dv = -step;
    else if (e.key === "ArrowDown") dv = step;
    else return;
    e.preventDefault();
    const pos = state.pieces[state.selectedId];
    state.pieces[state.selectedId] = clampPiecePos(state.selectedId, pos.u + du, pos.v + dv);
    updateAll();
  };
  canvas.addEventListener("keydown", handlePieceKey);
  pieceBtns.forEach((b) => b.addEventListener("keydown", handlePieceKey));

  // 错态标本按钮（复原斜拍挤堆 / 试看死板均分）
  presetBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const name = b.dataset.heroPreset;
      const fresh = clonePreset(name);
      state.cameraAngle = fresh.cameraAngle;
      state.pieces = fresh.pieces;
      state.showRefOverlay = false;
      updateAll();
    })
  );

  // 通关后原海报参考轮廓叠加
  refToggle?.addEventListener("click", () => {
    if (!cachedEval.allOk) return;
    state.showRefOverlay = !state.showRefOverlay;
    updateAll();
  });

  // 手机上提供轻点方向微调钮（给选中的构件加精准触控挪动支持）
  document.querySelectorAll("[data-nudge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [du, dv] = btn.dataset.nudge.split(",").map(Number);
      const pos = state.pieces[state.selectedId];
      state.pieces[state.selectedId] = clampPiecePos(state.selectedId, pos.u + du, pos.v + dv);
      updateAll();
    });
  });

  updateAll();
}

function boot() {
  initHero();
  initLensLab();
  initAnatomyLab();
  initLeverLab();
  initRhythmLab();
  initHistoryLab();
  initAvoidLab();
  initQuizLab();
  initPosterLightbox();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
