// 023 对角线构图 · 主控入口
// 统一驱动开场「斜轨导引与配重调度台」、正文 01–07 节互动以及第 08 节原海报放大灯箱。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluate, EXP_BOUNDS, INITIAL_STATE } from "./model.js";
import { renderHeroCanvas } from "./hero-render.js";
import { initSec01, initSec02, initSec03, initSec04, initSec05, initSec06, initSec07 } from "./sections.js";

function initHero() {
  const canvas = document.getElementById("hero-canvas");
  const frame = document.getElementById("hero-canvas-frame");
  const dialRail = document.getElementById("angle-dial-rail");
  const dialThumb = document.getElementById("dial-thumb");
  const dialRange = document.getElementById("angle-range");
  const dialVal = document.getElementById("dial-angle-val");
  const titleSlash = document.getElementById("title-slash-bar");

  const hudAngle = document.getElementById("hud-angle");
  const hudLength = document.getElementById("hud-length");
  const scoreBadge = document.getElementById("hero-score-badge");
  const scoreBadgeMobile = document.getElementById("hero-badge-mobile");
  const kpComRead = document.getElementById("kp-com-read");

  const diagBox = document.getElementById("diag-box");
  const diagTag = document.getElementById("diag-tag");
  const diagTitle = document.getElementById("diag-title");
  const diagBody = document.getElementById("diag-body");
  const diagTip = document.getElementById("diag-tip");

  const sceneBtns = [...document.querySelectorAll(".scene-btn")];
  const rhythmBtns = [...document.querySelectorAll("[data-rhythm]")];
  const btnVectors = document.getElementById("btn-vectors");
  const btnReset = document.getElementById("btn-reset");

  if (!canvas || !frame) return;

  const state = { ...INITIAL_STATE };
  let activeDrag = null; // "arrow" | "cw" | "dial" | null
  let lastHandles = null;
  let canvasW = 960;
  let canvasH = 600;
  let canvasDpr = 1;
  let sizeDirty = true;
  let lastEv = null;
  let cachedDialRect = null;
  let cachedCanvasRect = null;
  const heroCtx = canvas.getContext("2d");

  function syncCanvasSize() {
    const rect = frame.getBoundingClientRect();
    // 手机小屏用 1.25 DPR 兼顾清晰度与 SwiftShader 慢机软件渲染 60fps，桌面保持 2
    const maxDpr = window.innerWidth <= 680 ? 1.25 : 2;
    const dpr = pixelRatio(maxDpr);
    const w = Math.max(260, Math.round(rect.width || 960));
    const h = Math.max(180, Math.round(rect.height || 600));
    canvasW = w;
    canvasH = h;
    canvasDpr = dpr;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    sizeDirty = false;
  }

  function measureCanvas() {
    if (sizeDirty) syncCanvasSize();
    heroCtx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
    return { ctx: heroCtx, w: canvasW, h: canvasH };
  }

  const setText = (el, txt) => { if (el && el.textContent !== txt) el.textContent = txt; };

  function syncUI(ev) {
    lastEv = ev;
    const signStr = `${ev.angleDeg > 0 ? "+" : ""}${ev.angleDeg}°`;

    // 标题旁示范信号黄斜锋线与斜轨倾角实时联动（CSS rotate 顺时针为正，故取负角）
    if (titleSlash) {
      titleSlash.style.transform = `rotate(${-ev.angleDeg}deg)`;
    }

    // 拨轨游标位置（-72..+72 → 0%..100%）
    const pct = ((ev.angleDeg - EXP_BOUNDS.minDeg) / (EXP_BOUNDS.maxDeg - EXP_BOUNDS.minDeg)) * 100;
    if (dialThumb) dialThumb.style.left = `${clamp(pct, 2, 98).toFixed(2)}%`;
    if (dialRange && Number(dialRange.value) !== ev.angleDeg) {
      dialRange.value = String(ev.angleDeg);
    }
    setText(dialVal, signStr);

    // 画布顶角 HUD
    setText(hudAngle, `${signStr} · ${ev.angleBand}`);
    setText(hudLength, `轨长 ${ev.seg.segLenRatioW.toFixed(2)}× 框宽`);

    // 校准章
    const passText = ev.passCount === 4 ? "4 / 4 成立" : `${ev.passCount} / 4 待校准`;
    [scoreBadge, scoreBadgeMobile].forEach((el) => {
      if (!el) return;
      setText(el, passText);
      el.classList.toggle("is-pass", ev.passCount === 4);
    });
    setText(kpComRead, `质心偏 ${ev.comOffsetPct}%`);

    // 四枚原海报核心原则圆徽
    for (const p of ev.principles) {
      const li = document.querySelector(`.kp-item[data-kp="${p.id}"]`);
      const st = document.getElementById(`kp-status-${p.id}`);
      const rd = document.getElementById(`kp-read-${p.id}`);
      if (li) li.classList.toggle("is-ok", p.ok);
      setText(st, p.ok ? "成立" : "待调");
      setText(rd, p.reading);
    }

    // 黄标诊断盒
    if (diagBox) {
      diagBox.classList.toggle("is-error", ev.diag.level === "error");
      diagBox.classList.toggle("is-warn", ev.diag.level === "warn");
      diagBox.classList.toggle("is-ok", ev.diag.level === "ok");
    }
    setText(diagTag, ev.diag.tag);
    setText(diagTitle, ev.diag.headline);
    setText(diagBody, ev.diag.body);
    setText(diagTip, ev.diag.nextTip);

    // 同步按钮态
    sceneBtns.forEach((b) => {
      const on = b.dataset.scene === state.scene;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    rhythmBtns.forEach((b) => {
      const on = b.dataset.rhythm === state.rhythm;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (btnVectors) {
      btnVectors.classList.toggle("is-on", state.showVectors);
      btnVectors.setAttribute("aria-pressed", String(state.showVectors));
      setText(btnVectors, state.showVectors ? "力线标靶：开" : "力线标靶：关");
    }
  }

  let uiDirty = true;

  const ctrl = loop(canvas, (t, _dt, { still }) => {
    const { ctx, w, h } = measureCanvas();
    const aspect = w / Math.max(1, h);
    const ev = evaluate(state, aspect);
    if (uiDirty || !lastEv) {
      syncUI(ev);
      uiDirty = false;
    }
    lastHandles = renderHeroCanvas(ctx, w, h, state, ev, t, still, activeDrag);
  });

  function touchState(immediate = false) {
    uiDirty = true;
    // 常规动画运行中交由 rAF 合并每帧只画 1 次，避免拖动时双画与回流；仅在减少动态效果或显式要求时立即画
    if (immediate || reducedMotion.matches) {
      ctrl.draw();
    }
  }

  // 把客户端 X 坐标映射到斜角罗盘轨（-72..+72）
  function setAngleFromDialClientX(clientX) {
    const rect = cachedDialRect || dialRail.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const next = Math.round(EXP_BOUNDS.minDeg + ratio * (EXP_BOUNDS.maxDeg - EXP_BOUNDS.minDeg));
    if (next === state.angleDeg) return;
    state.angleDeg = next;
    touchState(false);
  }

  // 底沿斜角罗盘拨轨（data-perf-drag）：仅在起手测一次 rect，拖动过程零回流且交由 rAF 单次合并渲染
  if (dialRail) {
    dialRail.addEventListener("pointerdown", (e) => {
      activeDrag = "dial";
      cachedDialRect = dialRail.getBoundingClientRect();
      setAngleFromDialClientX(e.clientX);
      try { dialRail.setPointerCapture(e.pointerId); } catch {}
    });
    dialRail.addEventListener("pointermove", (e) => {
      if (activeDrag !== "dial") return;
      setAngleFromDialClientX(e.clientX);
    });
    const endDial = () => {
      if (activeDrag === "dial") {
        activeDrag = null;
        cachedDialRect = null;
      }
    };
    dialRail.addEventListener("pointerup", endDial);
    dialRail.addEventListener("pointercancel", endDial);

    // 兜底 touch 事件（当 pointer 事件未覆盖时）
    dialRail.addEventListener("touchstart", (e) => {
      if (!e.touches.length) return;
      activeDrag = "dial";
      cachedDialRect = dialRail.getBoundingClientRect();
      setAngleFromDialClientX(e.touches[0].clientX);
    }, { passive: true });
    dialRail.addEventListener("touchmove", (e) => {
      if (!e.touches.length || activeDrag !== "dial") return;
      setAngleFromDialClientX(e.touches[0].clientX);
    }, { passive: true });
    dialRail.addEventListener("touchend", endDial, { passive: true });
  }

  if (dialRange) {
    dialRange.addEventListener("input", () => {
      const next = Number(dialRange.value);
      if (next === state.angleDeg) return;
      state.angleDeg = next;
      touchState(false);
    });
  }

  // 画布内直接拖拽：拖信号黄箭柄扫动主斜轨角度，或拖配重圆锚调整力矩平衡
  function canvasCoords(clientX, clientY) {
    const r = cachedCanvasRect || canvas.getBoundingClientRect();
    return {
      x: clientX - r.left,
      y: clientY - r.top,
      w: Math.max(1, r.width),
      h: Math.max(1, r.height),
    };
  }

  function applyCanvasDrag(clientX, clientY) {
    const pt = canvasCoords(clientX, clientY);
    if (activeDrag === "cw") {
      state.cwU = clamp(pt.x / pt.w, 0.08, 0.92);
      state.cwV = clamp(pt.y / pt.h, 0.10, 0.88);
      touchState(false);
    } else if (activeDrag === "arrow") {
      const cx = 0.50 * pt.w;
      const cy = 0.54 * pt.h;
      const dx = pt.x - cx;
      const dy = cy - pt.y;
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;
      const next = clamp(Math.round(deg), EXP_BOUNDS.minDeg, EXP_BOUNDS.maxDeg);
      if (next === state.angleDeg) return;
      state.angleDeg = next;
      touchState(false);
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    cachedCanvasRect = canvas.getBoundingClientRect();
    const pt = canvasCoords(e.clientX, e.clientY);
    const hdl = lastHandles || { arrow: { x: pt.w * 0.78, y: pt.h * 0.5, r: 28 }, cw: { x: state.cwU * pt.w, y: state.cwV * pt.h, r: 28 } };
    const dCw = Math.hypot(pt.x - hdl.cw.x, pt.y - hdl.cw.y);
    const dArr = Math.hypot(pt.x - hdl.arrow.x, pt.y - hdl.arrow.y);

    if (dCw <= 44 && dCw <= dArr + 6) {
      activeDrag = "cw";
    } else if (dArr <= 56) {
      activeDrag = "arrow";
    } else {
      activeDrag = dCw < dArr ? "cw" : "arrow";
    }
    canvas.classList.add("is-dragging");
    applyCanvasDrag(e.clientX, e.clientY);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!activeDrag || activeDrag === "dial") return;
    applyCanvasDrag(e.clientX, e.clientY);
  });

  const endCanvasDrag = () => {
    if (activeDrag === "cw" || activeDrag === "arrow") {
      activeDrag = null;
      cachedCanvasRect = null;
      canvas.classList.remove("is-dragging");
      touchState(true);
    }
  };
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // 键盘支持：聚焦画布时 ←/→ 调倾角，Shift + 方向键移配重锚点
  canvas.addEventListener("keydown", (e) => {
    if (e.shiftKey) {
      const step = 0.04;
      if (e.key === "ArrowLeft") { state.cwU = clamp(state.cwU - step, 0.08, 0.92); e.preventDefault(); touchState(); }
      else if (e.key === "ArrowRight") { state.cwU = clamp(state.cwU + step, 0.08, 0.92); e.preventDefault(); touchState(); }
      else if (e.key === "ArrowUp") { state.cwV = clamp(state.cwV - step, 0.10, 0.88); e.preventDefault(); touchState(); }
      else if (e.key === "ArrowDown") { state.cwV = clamp(state.cwV + step, 0.10, 0.88); e.preventDefault(); touchState(); }
    } else {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        state.angleDeg = clamp(state.angleDeg + 3, EXP_BOUNDS.minDeg, EXP_BOUNDS.maxDeg);
        e.preventDefault();
        touchState();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        state.angleDeg = clamp(state.angleDeg - 3, EXP_BOUNDS.minDeg, EXP_BOUNDS.maxDeg);
        e.preventDefault();
        touchState();
      }
    }
  });

  // 题材切换
  sceneBtns.forEach((b) => {
    b.addEventListener("click", () => {
      state.scene = b.dataset.scene;
      touchState();
    });
  });

  // 沿线疏密节奏切换
  rhythmBtns.forEach((b) => {
    b.addEventListener("click", () => {
      state.rhythm = b.dataset.rhythm;
      touchState();
    });
  });

  // 力线与质心标靶开关
  if (btnVectors) {
    btnVectors.addEventListener("click", () => {
      state.showVectors = !state.showVectors;
      touchState();
    });
  }

  // 复原错态（不设一键通关）
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      Object.assign(state, INITIAL_STATE);
      touchState();
    });
  }

  window.addEventListener("resize", () => {
    sizeDirty = true;
    cachedDialRect = null;
    cachedCanvasRect = null;
    touchState(true);
  });

  // 首帧同步
  touchState(true);
}

/* ==================== 08 原海报放大灯箱（复用 #poster.src，仅内联一次） ==================== */
function initLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!trigger || !poster || !lb || !lbImg || !lbStage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0, sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function openLb() {
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function closeLb() {
    lb.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", openLb);
  btnClose.addEventListener("click", closeLb);
  btnIn.addEventListener("click", () => { scale = clamp(scale + 0.35, 0.6, 4); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = clamp(scale - 0.35, 0.6, 4); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.6, 4);
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1) {
      closeLb();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-panning");
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endPan = () => {
    panning = false;
    lbStage.classList.remove("is-panning");
  };
  lbStage.addEventListener("pointerup", endPan);
  lbStage.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") closeLb();
  });
}

initHero();
initSec01();
initSec02();
initSec03();
initSec04();
initSec05();
initSec06();
initSec07();
initLightbox();
