// 307 客观视角构图 · 主控脚本
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SCENES,
  FOCAL_OPTIONS,
  INITIAL_BROKEN,
  SOLUTIONS,
  FAIL_PRESETS,
  clamp,
  createState,
  evaluate,
} from "./model.js";
import { renderHeroStage } from "./stage-hero.js";
import {
  initSection01Compare,
  initSection02History,
  initSection03StagingLab,
  initSection04Scenarios,
  initSection05Avoid,
  initSection06Quiz,
  initPosterLightbox,
} from "./sections.js";

const state = createState();
let dirty = true;
let introDone = false;
let introProgress = reducedMotion.matches ? 1 : 0;
let lastEval = null;
let dragMode = null; // "camera" | "lead"
let dragStart = null;
let canvasW = 1200;
let canvasH = 470;

const $ = (id) => document.getElementById(id);

const heroCanvas = $("hero-canvas");
const ctx = heroCanvas ? heroCanvas.getContext("2d") : null;

// DOM 控件引用
const dom = {
  titleRule: $("title-level-line"),
  titleAngleTag: $("title-angle-tag"),
  eyePupil: $("eye-pupil"),
  eyeRing: $("eye-ring"),
  eyeBadge: $("eye-score-badge"),
  rulerThumb: $("ruler-camera-thumb"),
  rulerTrack: $("ruler-track"),
  rulerReadout: $("ruler-dist-readout"),
  diagBox: $("diag-box"),
  diagBadge: $("diag-badge"),
  diagCount: $("diag-count"),
  diagHeadline: $("diag-headline"),
  diagBody: $("diag-body"),
  diagFix: $("diag-fix"),
  mDist: $("m-dist"),
  mPitch: $("m-pitch"),
  mFocal: $("m-focal"),
  mActors: $("m-actors"),
  ctrlDist: $("ctrl-distance"),
  ctrlPitch: $("ctrl-pitch"),
  ctrlTilt: $("ctrl-tilt"),
  ctrlLeadX: $("ctrl-leadx"),
  valDist: $("val-distance"),
  valPitch: $("val-pitch"),
  valTilt: $("val-tilt"),
  valLeadX: $("val-leadx"),
  btnPlay: $("btn-play"),
  btnPlayMobile: $("btn-play-mobile"),
  btnFix: $("btn-fix"),
  btnReset: $("btn-reset"),
  btnPeek: $("btn-peek"),
};

const heroDpr = () => pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);

function resizeHeroCanvas() {
  if (!heroCanvas) return;
  const r = heroCanvas.getBoundingClientRect();
  const w = Math.max(280, Math.round(r.width || 1100));
  const h = Math.max(200, Math.round(r.height || 430));
  const dpr = heroDpr();
  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
  }
  canvasW = w;
  canvasH = h;
  dirty = true;
}

// 差量写入缓存：使用 WeakMap / Map，绝不写额外 DOM dataset 属性，值未变时不触碰 DOM
const uiCache = new Map();
const clsCache = new WeakMap();
function setText(el, val) {
  if (!el) return;
  if (uiCache.get(el) === val) return;
  uiCache.set(el, val);
  el.textContent = val;
}
function setClass(el, cls, on) {
  if (!el) return;
  let m = clsCache.get(el);
  if (!m) { m = new Map(); clsCache.set(el, m); }
  if (m.get(cls) === on) return;
  m.set(cls, on);
  el.classList.toggle(cls, on);
}
function setDataState(el, val) {
  if (!el) return;
  const k = `ds_${el.id}`;
  if (uiCache.get(k) === val) return;
  uiCache.set(k, val);
  el.dataset.state = val;
}

function syncUI(ev) {
  // 1. 自示范大标题水平基准线（倾角不为 0 时线体微斜，归 0 端正）
  const levelOk = Math.abs(state.tilt) <= 3;
  if (dom.titleRule) {
    const tr = `rotate(${(clamp(state.tilt, -16, 16) * 0.22).toFixed(2)}deg)`;
    if (uiCache.get("titleTr") !== tr) {
      uiCache.set("titleTr", tr);
      dom.titleRule.style.transform = tr;
    }
    setClass(dom.titleRule, "is-level", levelOk);
  }
  setText(dom.titleAngleTag, levelOk ? "水平 0°" : `倾角 ${state.tilt > 0 ? "+" : ""}${Math.round(state.tilt)}°`);
  setClass(dom.titleAngleTag, "is-ok", levelOk);

  // 2. 右上原海报同款观测眼印章（4/4 金眼端坐，错态时瞳孔偏移）
  if (dom.eyePupil) {
    const px = clamp((state.leadX / 3) * 4.5 + (state.tilt / 16) * 3.5, -7, 7);
    const py = clamp((state.pitch / 24) * 4.5, -5, 5);
    const ep = `translate(${px.toFixed(1)}, ${py.toFixed(1)})`;
    if (uiCache.get("eyeP") !== ep) {
      uiCache.set("eyeP", ep);
      dom.eyePupil.setAttribute("transform", ep);
    }
  }
  if (dom.eyeRing) {
    const er = `rotate(${(ev.rulerNorm * 40 - 20).toFixed(1)}deg)`;
    if (uiCache.get("eyeR") !== er) {
      uiCache.set("eyeR", er);
      dom.eyeRing.style.transform = er;
    }
  }
  setText(dom.eyeBadge, `${ev.score}/4`);
  setClass(dom.eyeBadge, "is-ok", ev.diagnosis.ok);

  // 3. 原海报底部双向虚线相机标尺实时位标
  if (dom.rulerThumb) {
    const leftPct = `${(ev.rulerNorm * 100).toFixed(1)}%`;
    if (uiCache.get("thumbL") !== leftPct) {
      uiCache.set("thumbL", leftPct);
      dom.rulerThumb.style.left = leftPct;
      dom.rulerThumb.setAttribute("aria-valuenow", state.distance.toFixed(1));
    }
    setClass(dom.rulerThumb, "is-ok", ev.cards[3].ok);
  }
  setText(dom.rulerReadout, `${state.distance.toFixed(1)} m · 主体占画高 ${ev.leadHeightPct}%`);

  // 4. 深普鲁士海蓝白话诊单条
  setClass(dom.diagBox, "is-pass", ev.diagnosis.ok);
  setText(dom.diagBadge, ev.diagnosis.badge);
  setClass(dom.diagBadge, "is-ok", ev.diagnosis.ok);
  setText(
    dom.diagCount,
    ev.diagnosis.ok
      ? "四项客观维度全部达标（示意实测）"
      : `当前存在 ${ev.issues.length} 处主观介入或残缺（示意实测）`
  );
  setText(dom.diagHeadline, ev.diagnosis.headline);
  setText(dom.diagBody, ev.diagnosis.body);
  setText(dom.diagFix, ev.diagnosis.fix);

  // 5. 四项实测读数格子（全部来自单真源 evaluate）
  setText(dom.mDist, `${state.distance.toFixed(1)} m`);
  setDataState(dom.mDist, ev.cards[3].ok ? "ok" : "bad");
  setText(dom.mPitch, `俯仰 ${state.pitch >= 0 ? "+" : ""}${Math.round(state.pitch)}° / 倾 ${state.tilt >= 0 ? "+" : ""}${Math.round(state.tilt)}°`);
  setDataState(dom.mPitch, ev.cards[0].ok ? "ok" : "bad");
  setText(dom.mFocal, `${state.focal}mm · ${ev.bgBlurPx >= 3.2 ? `后景糊 ${ev.bgBlurPx}px` : "深焦清晰"}`);
  setDataState(dom.mFocal, ev.cards[1].ok ? "ok" : "bad");
  setText(dom.mActors, `见 ${ev.visibleCount}/6 人 · 偏载 ${ev.balancePct}%`);
  setDataState(dom.mActors, ev.cards[2].ok && ev.cards[4].ok ? "ok" : "bad");

  // 6. 滑轨同步
  const dStr = state.distance.toFixed(1);
  if (dom.ctrlDist && dom.ctrlDist.value !== dStr) dom.ctrlDist.value = dStr;
  const pStr = String(Math.round(state.pitch));
  if (dom.ctrlPitch && dom.ctrlPitch.value !== pStr) dom.ctrlPitch.value = pStr;
  const tStr = String(Math.round(state.tilt));
  if (dom.ctrlTilt && dom.ctrlTilt.value !== tStr) dom.ctrlTilt.value = tStr;
  const xStr = state.leadX.toFixed(2);
  if (dom.ctrlLeadX && dom.ctrlLeadX.value !== xStr) dom.ctrlLeadX.value = xStr;
  setText(dom.valDist, `${dStr} m`);
  setText(dom.valPitch, `${state.pitch >= 0 ? "+" : ""}${pStr}°`);
  setText(dom.valTilt, `${state.tilt >= 0 ? "+" : ""}${tStr}°`);
  setText(dom.valLeadX, state.leadX === 0 ? "居中 0.0m" : `${state.leadX > 0 ? "偏右 +" : "偏左 "}${state.leadX.toFixed(1)}m`);

  // 7. 焦段、场景、偷窥、播放按钮态（仅在变更时更新）
  const modeKey = `${state.scene}|${state.focal}|${state.peek}|${state.playing}`;
  if (uiCache.get("modeKey") !== modeKey) {
    uiCache.set("modeKey", modeKey);
    document.querySelectorAll("[data-scene]").forEach((b) => {
      const on = b.dataset.scene === state.scene;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-focal]").forEach((b) => {
      const on = Number(b.dataset.focal) === state.focal;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (dom.btnPeek) {
      dom.btnPeek.classList.toggle("is-active", state.peek);
      dom.btnPeek.setAttribute("aria-pressed", String(state.peek));
      dom.btnPeek.textContent = state.peek ? "关闭偷窥柱" : "试错：偷窥挡镜";
    }
    const playLabel = state.playing ? "暂停长镜头" : "演播长镜头";
    if (dom.btnPlay) {
      dom.btnPlay.classList.toggle("is-active", state.playing);
      dom.btnPlay.setAttribute("aria-pressed", String(state.playing));
      dom.btnPlay.querySelector(".btn-play-label").textContent = playLabel;
    }
    if (dom.btnPlayMobile) {
      dom.btnPlayMobile.classList.toggle("is-active", state.playing);
      dom.btnPlayMobile.setAttribute("aria-pressed", String(state.playing));
      dom.btnPlayMobile.textContent = playLabel;
    }
  }

  // 8. 原海报五联极细框档案卡实时状态（差量更新）
  ev.cards.forEach((c) => {
    const el = document.querySelector(`[data-probe-card="${c.id}"]`);
    if (!el) return;
    setClass(el, "is-ok", c.ok);
    setClass(el, "is-bad", !c.ok);
    setClass(el, "is-hl", state.highlightCard === c.id);
    const pill = el.querySelector(".probe-status");
    setText(pill, c.status);
  });

  // 9. 底部琥珀金四步链路实时亮灯
  ev.chain.forEach((step) => {
    const node = document.querySelector(`[data-chain-step="${step.id}"]`);
    setClass(node, "is-lit", step.ok);
  });
}

function patchState(patch, opts = {}) {
  Object.assign(state, patch);
  state.distance = clamp(state.distance, 4.0, 34.0);
  state.pitch = clamp(state.pitch, -24, 26);
  state.tilt = clamp(state.tilt, -16, 16);
  state.leadX = clamp(state.leadX, -4.6, 4.6);
  if (opts.snap) {
    if (Math.abs(state.pitch) <= 1.6) state.pitch = 0;
    if (Math.abs(state.tilt) <= 1.6) state.tilt = 0;
    if (Math.abs(state.leadX) <= 0.18) state.leadX = 0;
  }
  dirty = true;
  // 正常动态模式下交给 rAF 主循环合并至每帧最多一次绘制；仅在 reduced-motion 或显式 immediate 时同步绘制
  if (heroLoop && (reducedMotion.matches || opts.immediate)) heroLoop.draw();
}

// =========================================================================
// 主画布直接拖拽交互（兼容鼠标 + 触屏 + perf 左右拖检测）
// =========================================================================
function bindHeroPointer() {
  if (!heroCanvas) return;

  heroCanvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由下方独立 touch 监听，避免同一手势双重触发
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const r = heroCanvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;

    // 检查是否直接点中前景主角剪影（允许直接拖拽主角调场面调度！）
    let hitLead = false;
    if (lastEval?.lead?.visibleAtAll && e.pointerType === "mouse") {
      const ld = lastEval.lead;
      const bw = Math.max(26, ld.wPx * 0.9);
      if (Math.abs(px - ld.mid.sx) <= bw && py >= ld.head.sy - 14 && py <= ld.foot.sy + 14) {
        hitLead = true;
      }
    }

    dragMode = hitLead ? "lead" : "camera";
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType,
      distance: state.distance,
      pitch: state.pitch,
      leadX: state.leadX,
    };
    heroCanvas.setPointerCapture(e.pointerId);
    heroCanvas.classList.add("is-dragging");
    dirty = true;
  });

  heroCanvas.addEventListener("pointermove", (e) => {
    if (!dragStart) return;
    const r = heroCanvas.getBoundingClientRect();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragMode === "lead") {
      const nextX = dragStart.leadX + (dx / Math.max(180, r.width)) * 11.0;
      patchState({ leadX: nextX }, { snap: true });
    } else {
      // 横拖推拉观察距离（向右拖退远进入客观，向左拖贴近）
      const nextDist = dragStart.distance + (dx / Math.max(180, r.width)) * 26.0;
      if (dragStart.pointerType === "touch") {
        // 触屏优先水平推拉，避免与页面竖向滚动打架
        patchState({ distance: nextDist });
      } else {
        // 鼠标同时支持纵拖俯仰角（向上拖俯拍、向下拖仰拍）
        const nextPitch = dragStart.pitch + (dy / Math.max(160, r.height)) * 42.0;
        patchState({ distance: nextDist, pitch: nextPitch }, { snap: true });
      }
    }
  });

  const endDrag = () => {
    if (!dragStart) return;
    dragStart = null;
    dragMode = null;
    heroCanvas.classList.remove("is-dragging");
    dirty = true;
    if (heroLoop) heroLoop.draw();
  };
  heroCanvas.addEventListener("pointerup", endDrag);
  heroCanvas.addEventListener("pointercancel", endDrag);

  // 触屏双保险：同步响应原生的 touchmove（perf.mjs 使用 CDP dispatchTouchEvent 触发）
  let touchStart = null;
  heroCanvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, distance: state.distance };
  }, { passive: true });
  heroCanvas.addEventListener("touchmove", (e) => {
    if (!touchStart || e.touches.length !== 1) return;
    const r = heroCanvas.getBoundingClientRect();
    const dx = e.touches[0].clientX - touchStart.x;
    patchState({ distance: touchStart.distance + (dx / Math.max(180, r.width)) * 26.0 });
  }, { passive: true });
  heroCanvas.addEventListener("touchend", () => { touchStart = null; }, { passive: true });
}

// =========================================================================
// 原海报同款底沿双向虚线相机标尺交互
// =========================================================================
function bindCameraRuler() {
  const track = dom.rulerTrack;
  if (!track) return;
  let active = false;

  function setFromClientX(clientX) {
    const r = track.getBoundingClientRect();
    const norm = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
    patchState({ distance: 4.0 + norm * 30.0 });
  }

  track.addEventListener("pointerdown", (e) => {
    active = true;
    track.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  });
  track.addEventListener("pointermove", (e) => {
    if (!active) return;
    setFromClientX(e.clientX);
  });
  const stop = () => { active = false; };
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);

  // 相机图标键盘可调
  dom.rulerThumb?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); patchState({ distance: state.distance + 1.0 }); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); patchState({ distance: state.distance - 1.0 }); }
  });
}

// =========================================================================
// 绑定全部表单控件、快捷预设、五联档案卡与键盘快捷键
// =========================================================================
function bindControls() {
  document.querySelectorAll("[data-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (SCENES[btn.dataset.scene]) patchState({ scene: btn.dataset.scene });
    });
  });

  document.querySelectorAll("[data-focal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mm = Number(btn.dataset.focal);
      if (FOCAL_OPTIONS.some((f) => f.mm === mm)) patchState({ focal: mm });
    });
  });

  dom.ctrlDist?.addEventListener("input", () => patchState({ distance: Number(dom.ctrlDist.value) }));
  dom.ctrlPitch?.addEventListener("input", () => patchState({ pitch: Number(dom.ctrlPitch.value) }, { snap: true }));
  dom.ctrlTilt?.addEventListener("input", () => patchState({ tilt: Number(dom.ctrlTilt.value) }, { snap: true }));
  dom.ctrlLeadX?.addEventListener("input", () => patchState({ leadX: Number(dom.ctrlLeadX.value) }, { snap: true }));

  const togglePlay = () => {
    if (reducedMotion.matches) {
      // 减少动态效果时推进一帧静拍步进，避免纯静无反应
      patchState({ playTime: state.playTime + 1.4, playing: false });
      return;
    }
    patchState({ playing: !state.playing });
  };
  dom.btnPlay?.addEventListener("click", togglePlay);
  dom.btnPlayMobile?.addEventListener("click", togglePlay);

  dom.btnFix?.addEventListener("click", () => {
    patchState({ ...SOLUTIONS.poster.patch });
  });
  dom.btnReset?.addEventListener("click", () => {
    patchState({ ...INITIAL_BROKEN, scene: state.scene, playing: false, playTime: 0, highlightCard: null });
  });
  dom.btnPeek?.addEventListener("click", () => {
    patchState({ peek: !state.peek });
  });

  // 多组合法 4/4 解按钮
  document.querySelectorAll("[data-solution]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = SOLUTIONS[btn.dataset.solution];
      if (s) patchState({ ...s.patch });
    });
  });

  // 反向边界试错按钮
  document.querySelectorAll("[data-fail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = FAIL_PRESETS[btn.dataset.fail];
      if (f) patchState({ ...f.patch });
    });
  });

  // 五联档案卡点击切换画布几何高亮
  document.querySelectorAll("[data-probe-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.probeCard;
      patchState({ highlightCard: state.highlightCard === id ? null : id });
    });
  });

  // 全局键盘支持（不抢占输入框和弹窗）
  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (!$("lightbox")?.hidden) return;

    if (e.code === "Space" && tag !== "BUTTON" && tag !== "A") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      patchState({ distance: state.distance - 1.2 });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      patchState({ distance: state.distance + 1.2 });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      patchState({ pitch: state.pitch + 2 }, { snap: true });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      patchState({ pitch: state.pitch - 2 }, { snap: true });
    } else if (e.key === "q" || e.key === "Q") {
      patchState({ tilt: state.tilt - 2 }, { snap: true });
    } else if (e.key === "e" || e.key === "E") {
      patchState({ tilt: state.tilt + 2 }, { snap: true });
    } else if (e.key === "r" || e.key === "R") {
      patchState({ ...INITIAL_BROKEN, scene: state.scene, playing: false, playTime: 0, highlightCard: null });
    }
  });
}

// =========================================================================
// 启动主循环（遵循 lib/stage.js 省电与 reduced-motion 规范）
// =========================================================================
let heroLoop = null;

function initHero() {
  if (!heroCanvas || !ctx) return;
  resizeHeroCanvas();
  bindHeroPointer();
  bindCameraRuler();
  bindControls();

  heroLoop = loop(heroCanvas, (_t, dt, { still }) => {
    if (still) {
      introProgress = 1;
      introDone = true;
      dirty = true;
    } else if (!introDone) {
      introProgress = clamp(introProgress + Math.max(dt, 0.016) / 0.65, 0, 1);
      if (introProgress >= 1) introDone = true;
      dirty = true;
    }

    if (state.playing && !still) {
      state.playTime += dt;
      dirty = true;
    }

    if (!dirty) return;
    dirty = false;

    const dpr = heroDpr();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ev = evaluate(state, canvasW, canvasH);
    lastEval = ev;
    renderHeroStage(ctx, canvasW, canvasH, state, ev, {
      progress: introProgress,
      draggingLead: dragMode === "lead",
    });
    syncUI(ev);
  });

  // 立即绘制首帧，确保任何时刻打开页面都不空白
  heroLoop.draw();

  window.addEventListener("resize", () => {
    resizeHeroCanvas();
    heroLoop.draw();
  });
}

// 启动全部模块
initHero();
initSection01Compare();
initSection02History();
initSection03StagingLab();
initSection04Scenarios();
initSection05Avoid();
initSection06Quiz();
initPosterLightbox();
