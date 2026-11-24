import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import { clamp, describe, LIMITS, nearestSnap, PRESETS, SNAP_RADIUS } from "./model.js";
import { PALETTE } from "./palette.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initFigures } from "./figures.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

document.documentElement.classList.add("js-ready");

// ---------- 开场三维透视舞台 ----------
const stage = $("hero-stage");
const host = $("hero-canvas-host");
const overlay = $("hero-overlay");
const handle = $("hero-vp");

const state = {
  scene: "corridor",
  vp: { u: PRESETS.poster.u, v: PRESETS.poster.v },
  focal: "aligned",
  guides: true,
  flow: true,
};
// 画面显示值平滑追踪目标值；开场从正中滑向海报的偏右聚焦点，每一帧都清楚好看
const shown = { u: 0.5, v: 0.44 };
let userMoved = false;
let dragging = false;
let stageW = 600;
let stageH = 400;

let renderer;
try {
  renderer = webgl() ? createScene3D(host) : null;
} catch {
  renderer = null;
}
if (!renderer) {
  renderer = createSceneFlat(host);
  stage.classList.add("flat");
}

function drawOverlay(u, v) {
  const W = stageW;
  const H = stageH;
  const vx = u * W;
  const vy = v * H;
  overlay.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const f = new DocumentFragment();
  if (state.guides) {
    // 细地平线
    f.append(svgEl("line", {
      x1: 0, y1: vy, x2: W, y2: vy,
      stroke: PALETTE.cream, "stroke-width": 1, "stroke-opacity": 0.28, "stroke-dasharray": "4 6",
    }));
    // 透视收敛虚线（呼应海报的虚线箭头）
    const starts = [
      [0, H * 0.92],
      [W * 0.14, H],
      [W * 0.44, H],
      [W, H * 0.92],
      [0, H * 0.14],
      [W, H * 0.14],
    ];
    for (const [sx, sy] of starts) {
      f.append(svgEl("line", {
        x1: sx, y1: sy, x2: vx, y2: vy,
        stroke: PALETTE.orangeHi, "stroke-width": 1.15, "stroke-opacity": 0.52, "stroke-dasharray": "5 5",
      }));
    }
    // 海报同款十字准星外刻度
    const gap = 26;
    const len = 11;
    f.append(svgEl("path", {
      d: `M${vx},${vy - gap - len}V${vy - gap} M${vx},${vy + gap}V${vy + gap + len} M${vx - gap - len},${vy}H${vx - gap} M${vx + gap},${vy}H${vx + gap + len}`,
      stroke: PALETTE.creamBright, "stroke-width": 1.4, "stroke-opacity": 0.85,
    }));
  }

  // 主体错位模式：标出「空消失点」与「偏离主体」之间的拉扯虚线
  if (state.focal === "offset") {
    const sx = u > 0.5 ? W * 0.24 : W * 0.76;
    f.append(svgEl("line", {
      x1: sx, y1: vy, x2: vx, y2: vy,
      stroke: PALETTE.creamBright, "stroke-width": 1.6, "stroke-dasharray": "3 4",
    }));
    f.append(svgEl("circle", {
      cx: sx, cy: vy, r: 10, fill: "none", stroke: PALETTE.creamBright, "stroke-width": 1.6,
    }));
    const lbl = svgEl("text", {
      x: sx, y: vy - 18, "text-anchor": "middle",
      fill: PALETTE.creamBright, "font-size": 12, "font-family": "Noto Sans SC, sans-serif",
    });
    lbl.textContent = "主体在这里";
    const lbl2 = svgEl("text", {
      x: vx, y: vy - 38, "text-anchor": "middle",
      fill: PALETTE.orangeHi, "font-size": 12, "font-family": "Noto Sans SC, sans-serif",
    });
    lbl2.textContent = "线条汇向这里（空）";
    f.append(lbl, lbl2);
  }
  overlay.replaceChildren(f);
}

function syncHandle(u, v) {
  handle.style.left = `${u * 100}%`;
  handle.style.top = `${v * 100}%`;
}

function updateReadout() {
  const info = describe(state);
  const pu = Math.round(state.vp.u * 100);
  const pv = Math.round(state.vp.v * 100);
  const coord = `VP ${pu}% · ${pv}%`;
  $("hero-chip").textContent = info.chip;
  $("hero-coord").textContent = coord;
  $("hero-path").textContent = info.path;
  $("hero-text").textContent = info.text;
  $("hud-vp").textContent = coord;
  $("hud-scene").textContent = state.scene === "corridor" ? "CORRIDOR" : "HIGHWAY";
  $("hud-eye").textContent = state.focal === "offset" ? "EYE-PATH × MISALIGNED" : "EYE-PATH → FOCUS";
  handle.setAttribute("aria-valuenow", String(pu));
  handle.setAttribute("aria-valuetext", `横向 ${pu}%，纵向 ${pv}%，${info.chip}`);
}

const view = loop(stage, (t, dt, { still }) => {
  if (still) {
    shown.u = state.vp.u;
    shown.v = state.vp.v;
  } else if (!userMoved && t < 1.35) {
    // 开场前 1.35 秒从正中平滑展开到海报经典偏右汇聚，0.9s 截图正好落在优美的过渡位
    const p = 1 - Math.pow(1 - Math.min(1, t / 1.35), 3);
    shown.u = 0.5 + (state.vp.u - 0.5) * p;
    shown.v = 0.44 + (state.vp.v - 0.44) * p;
  } else {
    const k = dt ? 1 - Math.exp(-dt * (dragging ? 28 : 10)) : 1;
    shown.u += (state.vp.u - shown.u) * k;
    shown.v += (state.vp.v - shown.v) * k;
  }
  syncHandle(shown.u, shown.v);
  drawOverlay(shown.u, shown.v);
  renderer.render(
    {
      scene: state.scene,
      vp: { u: shown.u, v: shown.v },
      focal: state.focal,
      flow: state.flow && !still,
    },
    still ? 0.35 : t
  );
});

function resizeStage() {
  const r = stage.getBoundingClientRect();
  stageW = Math.max(1, Math.round(r.width));
  stageH = Math.max(1, Math.round(r.height));
  renderer.resize(stageW, stageH);
  view.draw();
}
new ResizeObserver(resizeStage).observe(stage);

function setVP(u, v, { snap = false } = {}) {
  userMoved = true;
  let nu = clamp(u, LIMITS.uMin, LIMITS.uMax);
  let nv = clamp(v, LIMITS.vMin, LIMITS.vMax);
  if (snap) {
    const n = nearestSnap(nu, nv);
    if (n && n.d < SNAP_RADIUS) {
      nu = n.u;
      nv = n.v;
    }
  }
  state.vp.u = nu;
  state.vp.v = nv;
  if (reducedMotion.matches) {
    shown.u = nu;
    shown.v = nv;
  }
  clearPresetButtons();
  updateReadout();
  view.draw();
}

function clearPresetButtons() {
  document.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
}

function pointFromEvent(e) {
  const r = stage.getBoundingClientRect();
  return {
    u: (e.clientX - r.left) / Math.max(1, r.width),
    v: (e.clientY - r.top) / Math.max(1, r.height),
  };
}

// 拖动准星把手（支持鼠标与触屏；touch-action: none 仅在把手上，页面上下滚动顺畅）
handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handle.setPointerCapture(e.pointerId);
  handle.focus({ preventScroll: true });
  dragging = true;
  stage.classList.add("dragging");
  $("hero-read").setAttribute("aria-live", "off");
});
handle.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = pointFromEvent(e);
  setVP(p.u, p.v);
});
const finishDrag = () => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("dragging");
  $("hero-read").setAttribute("aria-live", "polite");
  setVP(state.vp.u, state.vp.v, { snap: true });
};
handle.addEventListener("pointerup", finishDrag);
handle.addEventListener("pointercancel", finishDrag);
handle.addEventListener("click", (e) => e.stopPropagation());

// 桌面端也支持直接点按或拖动画布改变消失点；触屏单击可跳点，滑动交给页面滚动
let stageDrag = false;
stage.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#hero-vp")) return;
  if (e.pointerType === "mouse") {
    stageDrag = true;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
    const p = pointFromEvent(e);
    setVP(p.u, p.v);
  }
});
stage.addEventListener("pointermove", (e) => {
  if (!stageDrag) return;
  const p = pointFromEvent(e);
  setVP(p.u, p.v);
});
const endStageDrag = () => {
  if (!stageDrag) return;
  stageDrag = false;
  dragging = false;
  stage.classList.remove("dragging");
  setVP(state.vp.u, state.vp.v, { snap: true });
};
stage.addEventListener("pointerup", endStageDrag);
stage.addEventListener("pointercancel", endStageDrag);
stage.addEventListener("click", (e) => {
  if (e.target.closest("#hero-vp")) return;
  const p = pointFromEvent(e);
  setVP(p.u, p.v, { snap: true });
});

// 键盘操作准星
handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.02 : 0.06;
  const delta = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }[e.key];
  if (!delta) return;
  e.preventDefault();
  setVP(state.vp.u + delta[0], state.vp.v + delta[1]);
});

// 场景切换按钮
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    document.querySelectorAll("[data-scene]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b === btn))
    );
    updateReadout();
    view.draw();
  });
});

// 机位与焦点预设按钮
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    userMoved = true;
    state.vp.u = p.u;
    state.vp.v = p.v;
    state.focal = p.focal;
    if (reducedMotion.matches) {
      shown.u = p.u;
      shown.v = p.v;
    }
    document.querySelectorAll("[data-preset]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b === btn))
    );
    updateReadout();
    view.draw();
  });
});

$("hero-guides").addEventListener("change", (e) => {
  state.guides = e.target.checked;
  view.draw();
});
$("hero-flow").addEventListener("change", (e) => {
  state.flow = e.target.checked;
  view.draw();
});

updateReadout();
resizeStage();
initFigures();
