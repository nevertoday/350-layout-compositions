import { reducedMotion, webgl } from "../../lib/stage.js";
import { onBonsai } from "./bonsai.js";
import { initFigures } from "./figures.js";
import { heroFlatSVG, svgEl } from "./flat.js";
import { createHero3D } from "./hero3d.js";
import { SCENES, clamp, describeView, snapCamera } from "./model.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  scene: "garden",
  cam: { x: 0.0, y: 0.02 },
  dist: 0.45,
  softFocus: false,
  darkRim: false,
};

const stage = $("stage");
const handle = $("handle");

// WebGL 关闭时的 2D SVG 降级舞台（与 3D 共用同一份 state 与交互逻辑）
function createFlatStage() {
  const svg = svgEl(400, 500);
  svg.setAttribute("aria-label", "框中框构图机位演示画布");
  stage.prepend(svg);
  let cur = state;
  const paint = () => {
    svg.innerHTML = heroFlatSVG(cur);
  };
  onBonsai(paint);
  return {
    kind: "flat",
    set(next) {
      cur = next;
      paint();
    },
  };
}

function updateCam(nx, ny) {
  const s = snapCamera(state.scene, nx, ny);
  state.cam = { x: s.x, y: s.y };
  render();
}

const view = webgl()
  ? createHero3D(stage, {
      onUserDrag: (nx, ny) => updateCam(nx, ny),
    })
  : createFlatStage();

function placeHandle() {
  const w = stage.clientWidth || 320;
  const h = stage.clientHeight || 400;
  // 把归一化机位 cam (x ∈ [-1,1], y ∈ [-0.75,0.75]) 映射到舞台可视区
  const px = clamp(state.cam.x * w * 0.34, -w * 0.38, w * 0.38);
  const py = clamp(state.cam.y * h * 0.34, -h * 0.34, h * 0.34);
  handle.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
}

function render() {
  view.set({ ...state, cam: { ...state.cam } });
  placeHandle();

  const d = describeView(state);
  const sc = SCENES[state.scene];

  $("hud-scene").textContent = sc.label;
  $("hud-state").textContent = d.badge;
  $("hud-state").classList.toggle("locked", d.status === "locked");

  $("ro-status").textContent = d.badge;
  $("ro-cover").textContent = d.coverPct;
  $("ro-depth").textContent = d.depthLabel;
  $("ro-text").textContent = d.text;
  $("ro-tip").hidden = !d.tip;
  $("ro-tip").textContent = d.tip;

  const stepMeters = (1.6 + state.dist * 2.4).toFixed(1);
  $("dist-out").textContent = `${stepMeters} m`;

  handle.classList.toggle("snapped", d.status === "locked");
  handle.setAttribute(
    "aria-label",
    `机位准星，当前${sc.label}，${d.badge}，水平 ${state.cam.x.toFixed(2)}，高度 ${state.cam.y.toFixed(2)}`,
  );
}

// 场景切换
$("scene-seg").addEventListener("change", (e) => {
  state.scene = e.target.value;
  const sc = SCENES[state.scene];
  state.cam = { ...sc.target };
  render();
});

// 机位远近滑块
$("dist-range").addEventListener("input", (e) => {
  state.dist = +e.target.value;
  render();
});

// 前景虚化 / 暗框压光 / 复位机位
const softBtn = $("btn-soft");
softBtn.addEventListener("click", () => {
  state.softFocus = !state.softFocus;
  softBtn.setAttribute("aria-pressed", String(state.softFocus));
  render();
});

const darkBtn = $("btn-dark");
darkBtn.addEventListener("click", () => {
  state.darkRim = !state.darkRim;
  darkBtn.setAttribute("aria-pressed", String(state.darkRim));
  render();
});

$("btn-reset").addEventListener("click", () => {
  const sc = SCENES[state.scene];
  state.cam = { ...sc.target };
  state.dist = 0.45;
  $("dist-range").value = "0.45";
  render();
});

// 机位把手：鼠标/触屏拖动 + 方向键微调
let drag = null;
handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handle.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, cx: state.cam.x, cy: state.cam.y };
});
handle.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const w = Math.max(stage.clientWidth * 0.34, 80);
  const h = Math.max(stage.clientHeight * 0.34, 80);
  updateCam(drag.cx + (e.clientX - drag.x) / w, drag.cy + (e.clientY - drag.y) / h);
});
const endHandle = () => (drag = null);
handle.addEventListener("pointerup", endHandle);
handle.addEventListener("pointercancel", endHandle);

handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.22 : 0.08;
  const map = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  if (e.key === "Home") {
    e.preventDefault();
    const sc = SCENES[state.scene];
    state.cam = { ...sc.target };
    render();
    return;
  }
  const delta = map[e.key];
  if (!delta) return;
  e.preventDefault();
  // 如果当前吸附在中心，走大一步跳出吸附圈
  let nx = state.cam.x + delta[0];
  let ny = state.cam.y + delta[1];
  for (let i = 2; i <= 4; i++) {
    const s = snapCamera(state.scene, nx, ny);
    if (s.x !== state.cam.x || s.y !== state.cam.y) break;
    nx = state.cam.x + delta[0] * i;
    ny = state.cam.y + delta[1] * i;
  }
  updateCam(nx, ny);
});

new ResizeObserver(() => placeHandle()).observe(stage);

render();
initFigures();
