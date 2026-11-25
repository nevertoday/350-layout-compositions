// 078 虫视构图 · 主入口：统筹开场真三维剧场、侧视剖面仪、自示范双箭头大标、单真源读数、正文各节与原海报灯箱

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { analyzeView, clamp, INITIAL_STATE, PRESETS, SCENES } from "./model.js";
import { renderHeroCanvas, renderSideRig } from "./stage-hero.js";
import {
  initSec01PerspectiveScale,
  initSec02LensLab,
  initSec03FiveRules,
  initSec04History,
  initSec05WhenNot,
  initSec06Practice,
} from "./sections-demos.js";

const state = { ...INITIAL_STATE };
// 平滑动画插值目标（键盘、预设与横拖时丝滑过渡；reducedMotion 时直接一步到位）
const target = { height: state.height, pitch: state.pitch, focal: state.focal };

// DOM 引用
const heroCanvas = document.getElementById("hero-canvas");
const rigCanvas = document.getElementById("rig-canvas");
const heroWrap = document.getElementById("hero-stage-wrap");
const titleRoot = document.getElementById("title");

const elHudHeight = document.getElementById("hud-height");
const elHudPitch = document.getElementById("hud-pitch");
const elHudFocal = document.getElementById("hud-focal");
const elHudConv = document.getElementById("hud-conv");
const elStatusPill = document.getElementById("hero-status-pill");

const elDiagBadge = document.getElementById("diag-badge");
const elDiagTitle = document.getElementById("diag-title");
const elDiagBody = document.getElementById("diag-body");
const elDiagTip = document.getElementById("diag-tip");
const elMetricConv = document.getElementById("m-conv");
const elMetricTaper = document.getElementById("m-taper");
const elMetricSky = document.getElementById("m-sky");
const elMetricHead = document.getElementById("m-head");

const slHeight = document.getElementById("sl-height");
const slPitch = document.getElementById("sl-pitch");
const slFocal = document.getElementById("sl-focal");
const outHeight = document.getElementById("val-height");
const outPitch = document.getElementById("val-pitch");
const outFocal = document.getElementById("val-focal");

const btnClutter = document.getElementById("btn-clutter");
const btnGuides = document.getElementById("btn-guides");
const lightBtns = [...document.querySelectorAll("[data-light]")];
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const ringBtns = [...document.querySelectorAll("[data-ring]")];
const stripItems = [...document.querySelectorAll("[data-strip]")];
const checkItems = [...document.querySelectorAll("[data-check-rule]")];

let lastHit = { wiresRect: null, lightPos: null };
let lastRigHit = { camHandle: null };
let dirty = true;
let introDone = false;

function resizeCanvas(c) {
  if (!c) return false;
  const r = c.getBoundingClientRect();
  // 手机窄屏适度控像素比（390px 用 1.25、平板 1.5、桌面 2），软渲染与慢手机均可稳住高帧率
  const maxDpr = window.innerWidth <= 480 ? 1.25 : window.innerWidth <= 768 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const nw = Math.max(120, Math.round(r.width * dpr));
  const nh = Math.max(120, Math.round(r.height * dpr));
  if (c.width !== nw || c.height !== nh) {
    c.width = nw;
    c.height = nh;
    return true;
  }
  return false;
}

// 同步所有界面读数、四枚原海报圆环、底部四图标带与自示范标题箭头长度
function syncUI(analysis) {
  if (!analysis) return;

  // 自示范巨型标题「虫」「图」两字顶端的白色矢量箭头随当前仰角与收敛角实时伸展！
  if (titleRoot) {
    titleRoot.style.setProperty("--title-lift", analysis.titleLift.toFixed(3));
  }

  // 顶沿光学条
  elHudHeight.textContent = `${state.height.toFixed(2)}m`;
  elHudPitch.textContent = `+${Math.round(state.pitch)}°`;
  elHudFocal.textContent = `${Math.round(state.focal)}mm`;
  elHudConv.textContent = `${analysis.convergenceDeg.toFixed(1)}°`;

  elStatusPill.textContent = analysis.badge;
  elStatusPill.dataset.ok = String(analysis.ok);

  // 单真源实况诊单
  elDiagBadge.textContent = analysis.badge;
  elDiagBadge.dataset.ok = String(analysis.ok);
  elDiagTitle.textContent = analysis.headline;
  elDiagBody.textContent = analysis.body;
  elDiagTip.textContent = analysis.tip;

  elMetricConv.textContent = `${analysis.convergenceDeg.toFixed(1)}°`;
  elMetricTaper.textContent = `${analysis.taperRatio.toFixed(1)}×`;
  elMetricHead.textContent = analysis.tipClipped ? "切头" : `${analysis.skyHeadroomPct}%`;
  elMetricSky.textContent = `${analysis.skyAreaPct}%`;

  // 滑杆数值同步
  slHeight.value = state.height.toFixed(2);
  slPitch.value = String(Math.round(state.pitch));
  slFocal.value = String(Math.round(state.focal));
  outHeight.textContent = `${state.height.toFixed(2)} m`;
  outPitch.textContent = `+${Math.round(state.pitch)}°`;
  outFocal.textContent = `${Math.round(state.focal)} mm`;

  // 开关与光源按钮状态
  btnClutter.setAttribute("aria-pressed", String(!state.clutter));
  btnClutter.textContent = state.clutter ? "天空：有杂线（点此清）" : "天空：净空留白";
  btnGuides.setAttribute("aria-pressed", String(state.guides));
  btnGuides.textContent = state.guides ? "透视线：开" : "透视线：关";

  lightBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.light === state.light)));
  sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scene === state.scene)));

  // 同步原海报右侧四枚圆环状态 + 底部四栏图标带
  const map = {
    lowAngle: analysis.rings.lowAngle,
    tall: analysis.rings.tall,
    impact: analysis.rings.impact,
    drama: analysis.rings.drama,
  };
  ringBtns.forEach((btn) => {
    const k = btn.dataset.ring;
    const info = map[k];
    if (!info) return;
    btn.dataset.ok = String(info.ok);
    const pill = btn.querySelector(".ring-pill");
    if (pill) pill.textContent = info.warn;
  });
  stripItems.forEach((item) => {
    const k = item.dataset.strip;
    const info = map[k];
    if (!info) return;
    item.dataset.ok = String(info.ok);
    const tag = item.querySelector(".strip-live");
    if (tag) tag.textContent = info.metric;
  });
  if (analysis.checklist) {
    checkItems.forEach((li) => {
      const k = li.dataset.checkRule;
      if (k in analysis.checklist) li.dataset.ok = String(analysis.checklist[k]);
    });
  }
}

function setTargets(patch, immediate = false, deferDraw = false) {
  if (patch.scene !== undefined) state.scene = patch.scene;
  if (patch.light !== undefined) state.light = patch.light;
  if (patch.clutter !== undefined) state.clutter = patch.clutter;
  if (patch.guides !== undefined) state.guides = patch.guides;
  if (patch.height !== undefined) target.height = clamp(patch.height, 0.1, 2.0);
  if (patch.pitch !== undefined) target.pitch = clamp(patch.pitch, 0, 85);
  if (patch.focal !== undefined) target.focal = clamp(patch.focal, 14, 85);
  if (immediate || reducedMotion.matches) {
    state.height = target.height;
    state.pitch = target.pitch;
    state.focal = target.focal;
  }
  dirty = true;
  // 拖拽过程中交由 loop() 的 rAF 每帧只绘制一次，防止同一帧内 pointermove+touchmove 重复绘制拖垮软渲染帧率
  if (!deferDraw || reducedMotion.matches) {
    heroLoop.draw();
  }
}

// =========================================================================
// 主循环（遵循 lib/stage.js 省电与 reducedMotion 规则）
// =========================================================================
let lastUiSignature = "";
let lastUiSyncTime = 0;
let isDraggingHero = false;
let rigDrawnSig = "";

function currentRigSig() {
  return `${state.height.toFixed(2)}|${Math.round(state.pitch)}|${Math.round(state.focal)}|${rigCanvas?.width || 0}x${rigCanvas?.height || 0}`;
}

function drawRigIfNeeded(force = false) {
  if (!rigCanvas) return;
  const resized = resizeCanvas(rigCanvas);
  const sig = currentRigSig();
  if (!force && !resized && sig === rigDrawnSig) return;
  rigDrawnSig = sig;
  lastRigHit = renderSideRig(rigCanvas, state);
}

const heroLoop = loop(heroWrap, (t, dt, { still }) => {
  const r1 = resizeCanvas(heroCanvas);
  const r2 = resizeCanvas(rigCanvas);

  // 开场 0.9 秒透视线从塔顶向天顶平稳画入（每帧都好看，still 时直接到 1）
  const intro = still ? 1 : clamp(t / 0.85, 0.25, 1);
  if (intro < 1) dirty = true;
  else if (!introDone) { introDone = true; dirty = true; }

  // 数值平滑缓动
  const step = still ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 14);
  const dh = target.height - state.height;
  const dp = target.pitch - state.pitch;
  const df = target.focal - state.focal;
  if (Math.abs(dh) > 0.002 || Math.abs(dp) > 0.05 || Math.abs(df) > 0.05) {
    state.height += dh * step;
    state.pitch += dp * step;
    state.focal += df * step;
    dirty = true;
  } else if (dh !== 0 || dp !== 0 || df !== 0) {
    state.height = target.height;
    state.pitch = target.pitch;
    state.focal = target.focal;
    dirty = true;
  }

  // 即使静止，只在 dirty、resize 或开场微脉动期间重画，兼顾高帧率与低功耗
  if (!dirty && !r1 && !r2 && introDone && !still) {
    return;
  }
  dirty = false;

  const now = performance.now();
  const needUiSync = !isDraggingHero || now - lastUiSyncTime >= 150 || still;
  const hit = renderHeroCanvas(heroCanvas, state, { intro, pulse: t, fast: !needUiSync });
  lastHit = hit;
  // 侧视剖面仪：首帧始终绘出（避免手机竖屏滚到下面时白板）；拖拽主画布且它在屏下时跳过以保满帧，进屏时由 IntersectionObserver 自动补绘
  const rigRect = rigCanvas.getBoundingClientRect();
  const rigVisible = rigRect.bottom > -40 && rigRect.top < window.innerHeight + 60;
  if (!rigDrawnSig || rigVisible || !isDraggingHero) {
    drawRigIfNeeded(r2);
  }

  if (needUiSync) {
    const sig = [
      state.scene,
      state.height.toFixed(2),
      Math.round(state.pitch),
      Math.round(state.focal),
      state.light,
      state.clutter,
      state.guides,
      hit.analysis.convergenceDeg.toFixed(1),
    ].join("|");
    if (sig !== lastUiSignature || still) {
      lastUiSignature = sig;
      lastUiSyncTime = now;
      syncUI(hit.analysis);
    }
  }
});

// =========================================================================
// 主角画布直接交互：
// 1) 横向拖动（touch-action: pan-y，绝不阻断手机竖滑）连续推拉「平视 ↔ 贴地大仰拍」
//    并实时联动机位高度、仰角与焦段；
// 2) 直接点击天空杂乱电线清除杂物；点击右上光源图标循环切换 强侧光/逆光/平光；
// 3) 键盘方向键（↑↓ 调仰角，←→ 调焦段，W/S 调机位高）完整可访问。
// =========================================================================
function bindHeroPointer() {
  if (!heroCanvas) return;
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startH = 0;
  let startPitch = 0;
  let startFocal = 0;
  let lockedAxis = null; // "x" | "y" | null

  function getLocal(ev) {
    const r = heroCanvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height };
  }

  heroCanvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    dragging = true;
    isDraggingHero = true;
    moved = false;
    lockedAxis = null;
    startX = ev.clientX;
    startY = ev.clientY;
    startH = target.height;
    startPitch = target.pitch;
    startFocal = target.focal;
    heroCanvas.setPointerCapture?.(ev.pointerId);
  });

  heroCanvas.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (!lockedAxis && Math.hypot(dx, dy) > 6) {
      // 触屏上竖直滑动放行给页面滚动，只锁横向拖拽；鼠标则全接管
      if (ev.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.2) {
        dragging = false;
        return;
      }
      lockedAxis = "x";
    }
    if (lockedAxis === "x") {
      moved = true;
      const span = Math.max(220, heroCanvas.clientWidth * 0.72);
      const frac = dx / span; // 向右拖 = 蹲低贴地 + 增大仰角 + 拉广焦段；向左拖 = 站回平视
      const newPitch = clamp(startPitch + frac * 62, 0, 85);
      const newH = clamp(startH - frac * 1.65, 0.1, 2.0);
      const newF = clamp(startFocal - frac * 42, 14, 85);
      setTargets({ height: newH, pitch: newPitch, focal: newF }, true, true);
    }
  });

  const endDrag = (ev) => {
    if (!dragging) return;
    dragging = false;
    isDraggingHero = false;
    lastUiSignature = "";
    dirty = true;
    heroLoop.draw();
    if (!moved) {
      const pt = getLocal(ev);
      // 1) 点到杂乱电线胶囊标牌或天空上方电线区 → 清除电线
      if (state.clutter && lastHit.wiresRect) {
        const wr = lastHit.wiresRect;
        if (pt.x >= wr.x - 16 && pt.x <= wr.x + wr.w + 16 && pt.y >= wr.y - 16 && pt.y <= wr.y + wr.h + 16) {
          setTargets({ clutter: false });
          return;
        }
      }
      // 2) 点到右上光源图标 → 循环切换 强侧光 / 顶逆光 / 平光
      if (lastHit.lightPos) {
        const lp = lastHit.lightPos;
        if (Math.hypot(pt.x - lp.x, pt.y - lp.y) <= lp.r + 12) {
          const order = ["side", "rim", "flat"];
          const next = order[(order.indexOf(state.light) + 1) % order.length];
          setTargets({ light: next });
          return;
        }
      }
    }
  };
  heroCanvas.addEventListener("pointerup", endDrag);
  heroCanvas.addEventListener("pointercancel", () => { dragging = false; });

  // 兼容 touch 事件（确保 perf.mjs 注入的 CDP Input.dispatchTouchEvent 100% 持续驱动实时重绘！）
  let touchActive = false;
  let tStartX = 0, tStartY = 0, tStartH = 0, tStartPitch = 0, tStartFocal = 0;
  heroCanvas.addEventListener("touchstart", (ev) => {
    if (ev.touches.length !== 1) return;
    const t0 = ev.touches[0];
    touchActive = true;
    isDraggingHero = true;
    tStartX = t0.clientX;
    tStartY = t0.clientY;
    tStartH = target.height;
    tStartPitch = target.pitch;
    tStartFocal = target.focal;
  }, { passive: true });

  heroCanvas.addEventListener("touchmove", (ev) => {
    if (!touchActive || ev.touches.length !== 1) return;
    const t0 = ev.touches[0];
    const dx = t0.clientX - tStartX;
    const dy = t0.clientY - tStartY;
    if (Math.abs(dx) >= Math.abs(dy) * 0.8 && Math.abs(dx) > 3) {
      const span = Math.max(180, heroCanvas.clientWidth * 0.65);
      const frac = dx / span;
      setTargets({
        height: clamp(tStartH - frac * 1.65, 0.1, 2.0),
        pitch: clamp(tStartPitch + frac * 62, 0, 85),
        focal: clamp(tStartFocal - frac * 42, 14, 85),
      }, true, true);
    }
  }, { passive: true });

  heroCanvas.addEventListener("touchend", () => {
    touchActive = false;
    isDraggingHero = false;
    lastUiSignature = "";
    dirty = true;
    heroLoop.draw();
  }, { passive: true });

  // 键盘直接控制
  heroCanvas.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setTargets({ pitch: target.pitch + 4, height: target.height - 0.12 });
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setTargets({ pitch: target.pitch - 4, height: target.height + 0.12 });
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      setTargets({ focal: target.focal + 4 });
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      setTargets({ focal: target.focal - 4 });
    } else if (ev.key === " " || ev.key === "Enter") {
      ev.preventDefault();
      setTargets({ clutter: !state.clutter });
    }
  });
}

// =========================================================================
// 左侧「侧视机位剖面仪」直接上下拖拽相机把手
// =========================================================================
function bindSideRigPointer() {
  if (!rigCanvas) return;
  let dragging = false;

  function applyPointer(ev) {
    const r = rigCanvas.getBoundingClientRect();
    const y = ev.clientY - r.top;
    const x = ev.clientX - r.left;
    const hInfo = lastRigHit.camHandle || { groundY: r.height * 0.84, maxPx: r.height * 0.34 };
    const ratio = clamp((hInfo.groundY - y) / Math.max(20, hInfo.maxPx), 0.05, 1.0);
    const newH = clamp(ratio * 2.0, 0.1, 2.0);
    // 越靠近地面自动略抬仰角，但仍尊重用户拖动趋势
    const pitchAuto = clamp(70 - ratio * 64, 4, 74);
    const focalAdj = x > r.width * 0.55 ? clamp(target.focal, 14, 34) : target.focal;
    setTargets({ height: newH, pitch: pitchAuto, focal: focalAdj }, true);
  }

  rigCanvas.addEventListener("pointerdown", (ev) => {
    dragging = true;
    rigCanvas.setPointerCapture?.(ev.pointerId);
    applyPointer(ev);
  });
  rigCanvas.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    applyPointer(ev);
  });
  rigCanvas.addEventListener("pointerup", () => { dragging = false; });
  rigCanvas.addEventListener("pointercancel", () => { dragging = false; });
}

// =========================================================================
// 绑定面板控件、四枚原海报圆环、预设与灯箱
// =========================================================================
function bindControls() {
  slHeight?.addEventListener("input", () => setTargets({ height: Number(slHeight.value) }, true));
  slPitch?.addEventListener("input", () => setTargets({ pitch: Number(slPitch.value) }, true));
  slFocal?.addEventListener("input", () => setTargets({ focal: Number(slFocal.value) }, true));

  btnClutter?.addEventListener("click", () => setTargets({ clutter: !state.clutter }));
  btnGuides?.addEventListener("click", () => setTargets({ guides: !state.guides }));

  lightBtns.forEach((b) => {
    b.addEventListener("click", () => setTargets({ light: b.dataset.light }));
  });
  sceneBtns.forEach((b) => {
    b.addEventListener("click", () => setTargets({ scene: b.dataset.scene }));
  });
  presetBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const p = PRESETS[b.dataset.preset];
      if (!p) return;
      setTargets({
        height: p.height,
        pitch: p.pitch,
        focal: p.focal,
        light: p.light,
        clutter: p.clutter,
      });
    });
  });

  // 点原海报四枚圆环，直接修正对应单一维度（方便体验每一维怎么改善画面，同时保留随时玩错的能力）
  ringBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.ring;
      if (k === "lowAngle") setTargets({ height: 0.22, pitch: 58 });
      else if (k === "tall") setTargets({ focal: 18, pitch: clamp(state.pitch, 46, 66) });
      else if (k === "impact") setTargets({ clutter: false, focal: Math.min(state.focal, 22) });
      else if (k === "drama") setTargets({ light: state.light === "side" ? "rim" : "side" });
    });
  });
}

// =========================================================================
// 原海报放大灯箱（复用 #poster.src，支持放大、拖拽平移、Esc 关闭，draggable=false）
// =========================================================================
function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const thumb = document.getElementById("poster");
  const modal = document.getElementById("lightbox");
  const bigImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomBtn = document.getElementById("lb-zoom");
  if (!trigger || !thumb || !modal || !bigImg) return;

  let zoomed = false;
  let tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

  function applyTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoomed ? 1.85 : 1})`;
    bigImg.dataset.zoomed = String(zoomed);
    if (zoomBtn) zoomBtn.textContent = zoomed ? "还原 1×" : "放大 1.8×";
  }

  function open() {
    if (!bigImg.src) bigImg.src = thumb.src;
    zoomed = false;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  zoomBtn?.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  });

  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) close();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) close();
  });

  bigImg.addEventListener("pointerdown", (ev) => {
    if (!zoomed) return;
    dragging = true;
    sx = ev.clientX;
    sy = ev.clientY;
    ox = tx;
    oy = ty;
    bigImg.setPointerCapture?.(ev.pointerId);
  });
  bigImg.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    tx = clamp(ox + (ev.clientX - sx), -420, 420);
    ty = clamp(oy + (ev.clientY - sy), -520, 520);
    applyTransform();
  });
  bigImg.addEventListener("pointerup", () => { dragging = false; });
  bigImg.addEventListener("pointercancel", () => { dragging = false; });
  bigImg.addEventListener("dblclick", () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  });
}

// =========================================================================
// 启动全部模块
// =========================================================================
bindHeroPointer();
bindSideRigPointer();
bindControls();
initSec01PerspectiveScale();
initSec02LensLab();
initSec03FiveRules();
initSec04History();
initSec05WhenNot();
initSec06Practice();
initPosterLightbox();

// 立即首帧绘制并更新读数，确保打开第一瞬即完整可读
heroLoop.draw();
if (rigCanvas && typeof IntersectionObserver !== "undefined") {
  new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) drawRigIfNeeded(false);
  }, { rootMargin: "120px" }).observe(rigCanvas);
}
window.addEventListener("resize", () => {
  dirty = true;
  heroLoop.draw();
});
