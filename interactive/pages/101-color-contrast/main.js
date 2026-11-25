// 101 色彩对比 · 主入口

import { reducedMotion } from "../../lib/stage.js";
import { bestInkOn, clamp, computeHeroColors, describeHero, HERO_PRESETS, snapDelta } from "./color.js";
import { createHero } from "./hero.js";
import { initAlbersLab, initAreaLab, initCvdLab, initLightbox, initQuiz, initReveal, initSixLab, initTempLab } from "./labs.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  preset: "poster",
  delta: 180,
  sat: 90,
  ratio: 50,
  mono: false,
  userMoved: false,
};

const stage = $("stage");
const canvas = $("hero-canvas");
const handle = $("hero-handle");
const deltaRange = $("ctrl-delta");
const satRange = $("ctrl-sat");
const ratioRange = $("ctrl-ratio");
const titleDui = $("title-dui");
const titleBi = $("title-bi");

let track = { x0: 40, x1: 300, y: 340, cx: 170, cy: 170, orbitR: 120 };

const hero = createHero(canvas, stage, state, (g) => {
  track = g;
  handle.style.transform = `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  handle.style.setProperty("--h-col", g.colB);
  handle.style.setProperty("--h-ink", g.inkB);
});

let lastPanelSync = 0;
let lastHudSep = -1;

function syncUI(draggingFast = false) {
  const colors = computeHeroColors(state);

  // 高频拖动中：画布每帧满速重绘，非画布 DOM 读数节流更新（每 110ms 一次），松手后立刻全量刷新，避免软件渲染整页重排
  if (draggingFast) {
    if (colors.sep !== lastHudSep) {
      lastHudSep = colors.sep;
      $("hud-angle").textContent = `ΔH ${colors.sep}°`;
    }
    hero.draw();
    const now = performance.now();
    if (now - lastPanelSync < 110) return;
    lastPanelSync = now;
  } else {
    lastPanelSync = performance.now();
  }

  const info = describeHero(state, colors);

  // 标题本身就是示范：「对」「比」两枚色块实时跟随左右色相，并自动切换高对比字色
  titleDui.style.backgroundColor = colors.hexA;
  titleDui.style.color = bestInkOn(colors.rgbA);
  titleBi.style.backgroundColor = colors.hexB;
  titleBi.style.color = bestInkOn(colors.rgbB);

  // 画布角标 HUD
  lastHudSep = colors.sep;
  $("hud-angle").textContent = state.mono ? "ΔH 0° · 同色" : `ΔH ${colors.sep}°`;
  $("hud-badge").textContent = info.badge;
  $("hud-badge").dataset.status = info.status;

  // 滑块与读数同步
  deltaRange.value = String(Math.round(state.delta));
  $("out-delta").textContent = `${colors.sep}°`;
  satRange.value = String(state.sat);
  $("out-sat").textContent = `${state.sat}%`;
  ratioRange.value = String(state.ratio);
  $("out-ratio").textContent = `${state.ratio}:${100 - state.ratio}`;

  // 预设按钮高亮
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    const on = btn.dataset.preset === state.preset;
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("on", on);
  });

  // 色样条与文字读数
  $("sw-a").style.background = colors.hexA;
  $("sw-a-hex").textContent = colors.hexA.toUpperCase();
  $("sw-b").style.background = colors.hexB;
  $("sw-b-hex").textContent = colors.hexB.toUpperCase();
  $("sw-cr").textContent = `CR ${colors.lumRatio.toFixed(2)}:1`;

  $("ro-title").textContent = info.headline;
  $("ro-badge").textContent = info.badge;
  $("ro-badge").dataset.status = info.status;
  $("ro-body").textContent = info.body;
  $("ro-note").textContent = info.note;

  handle.setAttribute("aria-valuenow", String(Math.round(state.delta)));
  handle.setAttribute(
    "aria-label",
    `全色轮色差手柄：当前色相夹角 ${colors.sep} 度，${info.badge}。左右拖动探索绿青与红紫两翼，Home 回到 180 度海报经典互补。`
  );

  hero.draw();
}

function setDelta(raw, useSnap = true, draggingFast = false) {
  const d = useSnap ? snapDelta(raw).delta : clamp(raw, 0, 360);
  if (!useSnap && state.userMoved && !state.mono && Math.abs(d - state.delta) < 0.05) return;
  state.userMoved = true;
  state.mono = false;
  state.preset = "";
  state.delta = d;
  if (Math.abs(d - 180) < 0.6 && state.sat >= 88 && state.ratio === 50) state.preset = "poster";
  syncUI(draggingFast);
}

// 预设方案
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = HERO_PRESETS[btn.dataset.preset];
    if (!p) return;
    state.userMoved = true;
    state.preset = p.id;
    state.delta = p.delta;
    state.sat = p.sat;
    state.ratio = p.ratio;
    state.mono = p.mono;
    syncUI();
  });
});

// 三个滑块
deltaRange.addEventListener("input", () => setDelta(+deltaRange.value, true));
satRange.addEventListener("input", () => {
  state.userMoved = true;
  state.preset = "";
  state.sat = +satRange.value;
  syncUI();
});
ratioRange.addEventListener("input", () => {
  state.userMoved = true;
  state.preset = "";
  state.ratio = +ratioRange.value;
  syncUI();
});

// 手柄拖动（鼠标 + 触摸；缓存 stage 边界避免每次 pointermove 触发强制回流）
let drag = null;
function deltaFromClientX(clientX, rect) {
  const r = rect || stage.getBoundingClientRect();
  const lx = clientX - r.left;
  const span = Math.max(40, track.x1 - track.x0);
  return ((lx - track.x0) / span) * 360;
}

handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  handle.setPointerCapture(e.pointerId);
  handle.focus({ preventScroll: true });
  const rect = stage.getBoundingClientRect();
  drag = { id: e.pointerId, rect };
  setDelta(deltaFromClientX(e.clientX, rect), false, true);
});
handle.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  setDelta(deltaFromClientX(e.clientX, drag.rect), false, true);
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  drag = null;
  setDelta(state.delta, true, false);
};
handle.addEventListener("pointerup", endDrag);
handle.addEventListener("pointercancel", endDrag);

// 点击轨道区域直接跳到对应色差；点击圆盘上半轨道也可按角度设色差
canvas.addEventListener("pointerdown", (e) => {
  const r = stage.getBoundingClientRect();
  const lx = e.clientX - r.left;
  const ly = e.clientY - r.top;
  if (Math.abs(ly - track.y) < 34) {
    setDelta(deltaFromClientX(e.clientX), true);
    return;
  }
  const dist = Math.hypot(lx - track.cx, ly - track.cy);
  if (dist >= track.orbitR * 0.72 && dist <= track.orbitR * 1.32) {
    const ang = Math.atan2(ly - track.cy, lx - track.cx); // -PI..PI，左侧(-PI)为0°，右侧(0)为180°
    const deg = ((ang + Math.PI) / (Math.PI * 2)) * 360;
    setDelta(deg, true);
  }
});

// 键盘操控手柄（方向键微调，Shift 大步，Home 回到海报原色）
handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 15 : 5;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setDelta(state.delta - step, false);
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setDelta(state.delta + step, false);
  } else if (e.key === "Home") {
    e.preventDefault();
    const p = HERO_PRESETS.poster;
    state.userMoved = true;
    state.preset = p.id;
    state.delta = p.delta;
    state.sat = p.sat;
    state.ratio = p.ratio;
    state.mono = p.mono;
    syncUI();
  }
});

syncUI();
initAlbersLab();
initSixLab();
initTempLab();
initAreaLab();
initCvdLab();
initQuiz();
initLightbox();
initReveal();
