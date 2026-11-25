import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import { PRESETS, describeState, snapPoint } from "./model.js";
import { clamp } from "./palette.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);

const stage = $("stage");
const sceneHost = $("scene-host");
const reticle = $("reticle");
const readout = $("readout");

// 初始目标为原海报明暗极对比定标（u = 0.78, v = 0.50）
const DEFAULT_PRESET = PRESETS[0];
const state = {
  u: DEFAULT_PRESET.u,
  v: DEFAULT_PRESET.v,
  scene: "split",
  gradation: "notan",
  dot: true,
};

// 开场由低反差中灰柔和推开至海报级明暗对立；减少动态效果时直接停在终点
const shown = {
  u: reducedMotion.matches ? state.u : 0.24,
  v: state.v,
  openK: reducedMotion.matches ? 1 : 0.55,
};

let renderer;
try {
  renderer = webgl() ? createScene3D(sceneHost) : null;
} catch {
  renderer = null;
}
if (!renderer) {
  renderer = createSceneFlat(sceneHost);
  stage.classList.add("is-flat");
}

let dragging = false;
let dirty = true;
let opened = reducedMotion.matches;

function paintReticle() {
  reticle.style.left = `${(shown.u * 100).toFixed(2)}%`;
  reticle.style.top = `${(shown.v * 100).toFixed(2)}%`;
  $("axis-v").style.left = `${(shown.u * 100).toFixed(2)}%`;
  $("axis-h").style.top = `${(shown.v * 100).toFixed(2)}%`;
}

function updateReadout() {
  const info = describeState(state);
  $("hud-ratio").textContent = info.rTxt;
  $("hud-zone").textContent = info.zoneLabel;
  $("hud-key").textContent = info.keyName;

  $("ro-title").textContent = info.title;
  const badge = $("ro-badge");
  badge.textContent = info.badge;
  badge.dataset.status = info.status;
  $("ro-text").textContent = info.text;
  $("ro-note").textContent = info.note;

  $("btn-dot").setAttribute("aria-pressed", String(state.dot));
  reticle.setAttribute(
    "aria-label",
    `明暗控制点：反差 ${Math.round(state.u * 100)}%，调性 ${info.keyName}，对比度 ${info.rTxt}。拖动或按方向键调节，Home 回到海报定标。`,
  );

  // 高亮已靠近的预设标点
  stage.querySelectorAll(".preset-pin").forEach((pin) => {
    const p = PRESETS.find((x) => x.id === pin.dataset.preset);
    if (!p) return;
    const hot = Math.hypot(state.u - p.u, state.v - p.v) < 0.04;
    pin.classList.toggle("hot", hot);
  });
}

const view = loop(stage, (t, dt, { still }) => {
  if (still) {
    shown.u = state.u;
    shown.v = state.v;
    shown.openK = 1;
    opened = true;
    paintReticle();
    renderer.render({ ...state, u: shown.u, v: shown.v }, 1);
    dirty = false;
    return;
  }

  let moving = false;
  if (!opened) {
    // 0.85 秒开场从柔灰平滑拉开到完整海报明暗（每一帧都清晰完整）
    const p = clamp(t / 0.85, 0, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    shown.openK = 0.55 + 0.45 * ease;
    if (!dragging) {
      shown.u = 0.24 + (state.u - 0.24) * ease;
      shown.v = state.v;
    }
    moving = true;
    if (p >= 1) opened = true;
  } else {
    const k = dt ? 1 - Math.exp(-dt * (dragging ? 34 : 11)) : 1;
    const du = state.u - shown.u;
    const dv = state.v - shown.v;
    if (Math.abs(du) > 0.0005 || Math.abs(dv) > 0.0005) {
      shown.u += du * k;
      shown.v += dv * k;
      moving = true;
    } else {
      shown.u = state.u;
      shown.v = state.v;
    }
  }

  if (dirty || moving || dragging) {
    paintReticle();
    renderer.render({ ...state, u: shown.u, v: shown.v }, shown.openK);
    dirty = false;
  }
});

function resize() {
  const r = stage.getBoundingClientRect();
  renderer.resize(Math.max(240, Math.round(r.width)), Math.max(200, Math.round(r.height)));
  dirty = true;
  view.draw();
}
new ResizeObserver(resize).observe(stage);

function setTarget(u, v, useSnap = false) {
  opened = true;
  shown.openK = 1;
  if (useSnap) {
    const s = snapPoint(u, v);
    state.u = s.u;
    state.v = s.v;
  } else {
    state.u = clamp(u, 0.06, 0.95);
    state.v = clamp(v, 0.1, 0.9);
  }
  dirty = true;
  updateReadout();
  if (reducedMotion.matches) view.draw();
}

function coordsFromEvent(e) {
  const r = stage.getBoundingClientRect();
  return {
    u: (e.clientX - r.left) / Math.max(r.width, 1),
    v: (e.clientY - r.top) / Math.max(r.height, 1),
  };
}

// 拖拽把手（指针捕获，支持鼠标与触屏；触屏不阻止画框外竖向滚屏）
reticle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  reticle.setPointerCapture(e.pointerId);
  reticle.focus({ preventScroll: true });
  dragging = true;
  opened = true;
  shown.openK = 1;
  stage.classList.add("is-dragging");
  readout.setAttribute("aria-live", "off");
});

reticle.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const { u, v } = coordsFromEvent(e);
  setTarget(u, v, false);
  // 拖动时同步紧跟，保证 60fps 跟手感与 perf 采样准确
  shown.u = state.u;
  shown.v = state.v;
  paintReticle();
  renderer.render(state, 1);
  dirty = false;
});

const finishDrag = () => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("is-dragging");
  readout.setAttribute("aria-live", "polite");
  setTarget(state.u, state.v, true);
};
reticle.addEventListener("pointerup", finishDrag);
reticle.addEventListener("pointercancel", finishDrag);

// 点击画布任意处直接移动并吸附
stage.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  const { u, v } = coordsFromEvent(e);
  setTarget(u, v, true);
});

// 点击预设点直接跳去对应明暗状态
stage.querySelectorAll(".preset-pin").forEach((pin) => {
  pin.addEventListener("click", (e) => {
    e.stopPropagation();
    const p = PRESETS.find((x) => x.id === pin.dataset.preset);
    if (p) setTarget(p.u, p.v, false);
  });
});

// 键盘控制（方向键微调，Shift 精细调节，Home 回到海报原设）
reticle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.025 : 0.08;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setTarget(state.u - step, state.v, false);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setTarget(state.u + step, state.v, false);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setTarget(state.u, state.v - step, false);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setTarget(state.u, state.v + step, false);
  } else if (e.key === "Home") {
    e.preventDefault();
    setTarget(DEFAULT_PRESET.u, DEFAULT_PRESET.v, false);
  }
});

// 题材、层次、红点与复位控件
document.querySelectorAll('input[name="hero-scene"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    state.scene = input.value;
    dirty = true;
    updateReadout();
    view.draw();
  });
});

document.querySelectorAll('input[name="hero-grad"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    state.gradation = input.value;
    dirty = true;
    updateReadout();
    view.draw();
  });
});

$("btn-dot").addEventListener("click", () => {
  state.dot = !state.dot;
  dirty = true;
  updateReadout();
  view.draw();
});

$("btn-reset").addEventListener("click", () => {
  state.scene = "split";
  state.gradation = "notan";
  state.dot = true;
  const sRadio = document.querySelector('input[name="hero-scene"][value="split"]');
  const gRadio = document.querySelector('input[name="hero-grad"][value="notan"]');
  if (sRadio) sRadio.checked = true;
  if (gRadio) gRadio.checked = true;
  setTarget(DEFAULT_PRESET.u, DEFAULT_PRESET.v, false);
});

updateReadout();
resize();
initLabs();
