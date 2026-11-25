import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import { analyze, clampPos, COUNTERWEIGHTS, PRESETS, snapPos, SUBJECTS } from "./model.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);

const stage = $("hero-stage");
const canvasHost = $("hero-canvas-host");
const handle = $("hero-handle");
const readout = $("hero-readout");

const state = {
  pos: { ...PRESETS.offcenter },
  subject: "orb",
  counterweight: "arc",
};

// 开场动画：正常模式下从画面正中缓缓滑向海报的右上偏心甜区（0.15s~1.05s），
// 减少动态效果下直接停在终点，每一刻画面都完整清楚。
const animateIntro = !reducedMotion.matches;
const shown = {
  u: animateIntro ? PRESETS.center.u : PRESETS.offcenter.u,
  v: animateIntro ? PRESETS.center.v : PRESETS.offcenter.v,
};

let dragging = false;
let userTouched = false;
let lastHudKey = "";

// 优先 WebGL 三维浮雕舞台；关掉 WebGL 时无缝退回同状态 SVG
let renderer = null;
try {
  renderer = webgl() ? createScene3D(canvasHost) : null;
} catch {
  renderer = null;
}
if (!renderer) {
  renderer = createSceneFlat(canvasHost);
  stage.classList.add("is-flat");
}

function updateReadout() {
  const info = analyze(state);
  const badge = $("ro-badge");
  badge.textContent = info.badge;
  badge.dataset.zone = info.zone;
  $("ro-headline").textContent = info.headline;
  $("ro-body").textContent = info.body;
  $("ro-extra").textContent = info.dirNote;
  $("ro-ecc").textContent = `${info.eccPct}%`;
  $("ro-torque").textContent = `${info.torquePct}`;
  $("ro-open").textContent = `${info.openPct}%`;

  const sub = SUBJECTS[state.subject];
  const cw = COUNTERWEIGHTS[state.counterweight];
  $("hud-mode").textContent = `${sub.en} · ${cw.en}`;
  $("hud-status").textContent = info.badge;
  $("hud-status").dataset.zone = info.zone;

  stage.dataset.zone = info.zone;
  handle.setAttribute("aria-valuenow", String(Math.round(state.pos.u * 100)));
  handle.setAttribute(
    "aria-valuetext",
    `${sub.label}，水平 ${Math.round(state.pos.u * 100)}%，垂直 ${Math.round(state.pos.v * 100)}%，${info.badge}`
  );

  // 高亮匹配的三态快捷按钮
  document.querySelectorAll("[data-hero-preset]").forEach((btn) => {
    const p = PRESETS[btn.dataset.heroPreset];
    const active = p && Math.hypot(state.pos.u - p.u, state.pos.v - p.v) < 0.04;
    btn.setAttribute("aria-pressed", String(Boolean(active)));
  });
}

function paintHandle(u, v) {
  handle.style.left = `${(u * 100).toFixed(2)}%`;
  handle.style.top = `${(v * 100).toFixed(2)}%`;
  const key = `${Math.round(u * 100)}-${Math.round(v * 100)}`;
  if (key !== lastHudKey) {
    lastHudKey = key;
    const dx = Math.round((u - 0.5) * 100);
    const dy = Math.round((v - 0.5) * 100);
    const sx = dx >= 0 ? `+${dx}` : `${dx}`;
    const sy = dy >= 0 ? `+${dy}` : `${dy}`;
    $("hud-coord").textContent = `ΔX ${sx}%  ΔY ${sy}%`;
  }
}

const view = loop(stage, (t, dt, { still }) => {
  if (still) {
    shown.u = state.pos.u;
    shown.v = state.pos.v;
  } else if (animateIntro && !userTouched && t < 1.15) {
    // 平滑三阶缓出：从正中滑到右上偏心位，0.9 秒截图时已落至偏心甜区附近
    const p = Math.min(1, Math.max(0, (t - 0.1) / 0.85));
    const ease = 1 - Math.pow(1 - p, 3);
    shown.u = PRESETS.center.u + (state.pos.u - PRESETS.center.u) * ease;
    shown.v = PRESETS.center.v + (state.pos.v - PRESETS.center.v) * ease;
  } else {
    const k = dt ? 1 - Math.exp(-dt * (dragging ? 34 : 11)) : 1;
    shown.u += (state.pos.u - shown.u) * k;
    shown.v += (state.pos.v - shown.v) * k;
  }

  paintHandle(shown.u, shown.v);
  const shownInfo = analyze({ ...state, pos: { u: shown.u, v: shown.v } });
  renderer.render(
    {
      u: shown.u,
      v: shown.v,
      subject: state.subject,
      counterweight: state.counterweight,
      info: shownInfo,
      still,
    },
    still ? 0 : t
  );
});

function resizeStage() {
  const r = stage.getBoundingClientRect();
  renderer.resize(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)));
  view.draw();
}
new ResizeObserver(resizeStage).observe(stage);

function setPos(u, v, { snap = false } = {}) {
  userTouched = true;
  let next = clampPos(u, v);
  if (snap) next = snapPos(next.u, next.v);
  state.pos.u = next.u;
  state.pos.v = next.v;
  if (reducedMotion.matches) {
    shown.u = next.u;
    shown.v = next.v;
  }
  updateReadout();
  view.draw();
}

function posFromPointer(e) {
  const r = stage.getBoundingClientRect();
  return {
    u: (e.clientX - r.left) / Math.max(1, r.width),
    v: (e.clientY - r.top) / Math.max(1, r.height),
  };
}

// 仅在把手上禁用默认触屏滚动（touch-action: none），保证手机端滑屏顺畅
handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handle.setPointerCapture(e.pointerId);
  handle.focus({ preventScroll: true });
  dragging = true;
  userTouched = true;
  stage.classList.add("is-dragging");
  readout?.setAttribute("aria-live", "off");
});
handle.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = posFromPointer(e);
  setPos(p.u, p.v, { snap: false });
});
const endHandleDrag = () => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("is-dragging");
  readout?.setAttribute("aria-live", "polite");
  setPos(state.pos.u, state.pos.v, { snap: true });
};
handle.addEventListener("pointerup", endHandleDrag);
handle.addEventListener("pointercancel", endHandleDrag);
handle.addEventListener("click", (e) => e.stopPropagation());

// 桌面端鼠标在画框内任意位置直接点拖；触屏轻点移位、纵滑交给页面滚动
let stageDrag = false;
stage.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#hero-handle")) return;
  if (e.pointerType === "mouse") {
    stageDrag = true;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
    const p = posFromPointer(e);
    setPos(p.u, p.v, { snap: false });
  }
});
stage.addEventListener("pointermove", (e) => {
  if (!stageDrag) return;
  const p = posFromPointer(e);
  setPos(p.u, p.v, { snap: false });
});
const endStageDrag = () => {
  if (!stageDrag) return;
  stageDrag = false;
  dragging = false;
  stage.classList.remove("is-dragging");
  setPos(state.pos.u, state.pos.v, { snap: true });
};
stage.addEventListener("pointerup", endStageDrag);
stage.addEventListener("pointercancel", endStageDrag);
stage.addEventListener("click", (e) => {
  if (e.target.closest("#hero-handle")) return;
  const p = posFromPointer(e);
  setPos(p.u, p.v, { snap: true });
});

// 键盘操控：方向键移动（Shift 精调 1%），Home 回到偏心甜区，C 跳正中
handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.01 : 0.04;
  const delta = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }[e.key];
  if (delta) {
    e.preventDefault();
    setPos(state.pos.u + delta[0], state.pos.v + delta[1], { snap: false });
  } else if (e.key === "Home") {
    e.preventDefault();
    setPos(PRESETS.offcenter.u, PRESETS.offcenter.v, { snap: false });
  } else if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    setPos(PRESETS.center.u, PRESETS.center.v, { snap: false });
  }
});

// 单选与三态速切
document.querySelectorAll('input[name="hero-subject"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    state.subject = r.value;
    updateReadout();
    view.draw();
  });
});

document.querySelectorAll('input[name="hero-cw"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    state.counterweight = r.value;
    updateReadout();
    view.draw();
  });
});

document.querySelectorAll("[data-hero-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.heroPreset];
    if (!p) return;
    setPos(p.u, p.v, { snap: false });
  });
});

updateReadout();
resizeStage();
initLabs();
