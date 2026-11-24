import { reducedMotion, webgl } from "../../lib/stage.js";
import { PALETTE, clamp, describe, layout, snapFocus } from "./model.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initFigures } from "./figures.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  count: 3,
  focusU: 0.5,
  variation: "varied",
  showPath: true,
};

const stage = $("stage");
const handle = $("handle");
const readout = $("readout");
let current = layout(state);

// 标题旁的动态几何节拍徽记：实时示范当前数量的奇偶节奏
function renderTitleRhythm(L) {
  const host = $("title-rhythm");
  const n = Math.min(L.count, 7);
  const w = Math.max(76, n * 18 + 20);
  const h = 40;
  const shapes = [];
  const gap = n > 1 ? (w - 28) / (n - 1) : 0;
  for (let i = 0; i < n; i++) {
    const it = L.items[i];
    const cx = n === 1 ? w / 2 : 14 + i * gap;
    const isDom = it.isDom;
    const r = isDom ? 7.5 : 4.8;
    const cy = isDom ? 22 : 26;
    if (it.shape === "cube") {
      shapes.push(`<rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="1.5" fill="${it.color}"/>`);
    } else if (it.shape === "cone") {
      shapes.push(`<polygon points="${cx.toFixed(1)},${(cy - r * 1.1).toFixed(1)} ${(cx + r * 1.1).toFixed(1)},${(cy + r).toFixed(1)} ${(cx - r * 1.1).toFixed(1)},${(cy + r).toFixed(1)}" fill="${it.color}"/>`);
    } else {
      shapes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${it.color}"/>`);
    }
  }
  const guide = L.hasDominant && n >= 3
    ? `<path d="M14,20 Q${(w / 2).toFixed(1)},2 ${(w - 14).toFixed(1)},20" fill="none" stroke="${PALETTE.pink}" stroke-width="1.5" stroke-dasharray="3 3"/>`
    : L.inEvenSeam
      ? `<line x1="${(w / 2).toFixed(1)}" y1="6" x2="${(w / 2).toFixed(1)}" y2="36" stroke="${PALETTE.lavender}" stroke-width="1.5" stroke-dasharray="3 3"/>`
      : "";
  host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${guide}${shapes.join("")}</svg>`;
}

let view = null;
const placeHandle = () => {
  if (!view) return;
  const dom = current.hasDominant ? current.items[current.domIndex] : null;
  const targetV = dom ? dom.v - 0.02 : 0.56;
  const p = view.projectFocus(state.focusU, targetV);
  const w = stage.clientWidth || 360;
  const h = stage.clientHeight || 360;
  const cx = clamp(p.x, 30, w - 30);
  const cy = clamp(p.y, 46, h - 68);
  handle.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
};

try {
  view = webgl() ? createScene3D(stage, { onFrame: placeHandle }) : null;
} catch {
  view = null;
}
if (!view) {
  view = createSceneFlat(stage, { onFrame: placeHandle });
}

const pillButtons = [...document.querySelectorAll("#count-pills .cp")];

function render() {
  current = layout(state);
  view.set(current, { showPath: state.showPath });
  placeHandle();
  renderTitleRhythm(current);

  const d = describe(current);
  $("hud-count").textContent = `N = ${state.count}`;
  $("hud-parity").textContent = current.isCrowd ? "群组" : current.isOdd ? "奇数" : "偶数";
  $("hud-eye").textContent = d.eye;
  $("stage-pill").textContent = `${state.count} 个元素`;
  $("count-out").textContent = `${state.count}`;
  $("count-range").value = String(state.count);

  $("btn-dec").disabled = state.count <= 1;
  $("btn-inc").disabled = state.count >= 9;
  $("btn-path").setAttribute("aria-pressed", String(state.showPath));

  for (const b of pillButtons) {
    b.setAttribute("aria-pressed", String(+b.dataset.n === state.count));
  }

  $("ro-badge").textContent = d.badge;
  $("ro-struct").textContent = d.structure;
  $("ro-eye").textContent = d.eye;
  $("ro-text").textContent = d.text;

  readout.classList.toggle("is-even", d.kind === "even" || d.kind === "even-forced");
  readout.classList.toggle("is-crowd", d.kind === "crowd");
  readout.classList.toggle("is-flat", d.kind === "flat");
  handle.classList.toggle("is-odd", d.kind === "odd");
  handle.classList.toggle("is-even", d.kind === "even");
  handle.setAttribute(
    "aria-label",
    `焦点把手：当前 ${state.count} 个元素，焦点横向 ${Math.round(state.focusU * 100)}%，${d.badge}。左右方向键移动焦点，上下方向键增减元素。`
  );
}

function setCount(n) {
  const next = clamp(Math.round(n), 1, 9);
  state.count = next;
  state.focusU = 0.5; // 切换数量时焦点回正中，最直观看出奇数自动落主角、偶数落空缝
  render();
}

$("btn-dec").addEventListener("click", () => setCount(state.count - 1));
$("btn-inc").addEventListener("click", () => setCount(state.count + 1));
$("btn-path").addEventListener("click", () => {
  state.showPath = !state.showPath;
  render();
});
$("btn-reset").addEventListener("click", () => {
  state.count = 3;
  state.focusU = 0.5;
  state.variation = "varied";
  state.showPath = true;
  for (const r of document.querySelectorAll('input[name="variation"]')) {
    r.checked = r.value === "varied";
  }
  render();
});

for (const b of pillButtons) {
  b.addEventListener("click", () => setCount(+b.dataset.n));
}
$("count-range").addEventListener("input", (e) => setCount(+e.target.value));
$("variation").addEventListener("change", (e) => {
  state.variation = e.target.value;
  render();
});

// 焦点圆环：真实鼠标/触摸拖动 + 键盘微调
let drag = null;
handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handle.setPointerCapture(e.pointerId);
  handle.focus({ preventScroll: true });
  readout.setAttribute("aria-live", "off");
  drag = { x: e.clientX, u: state.focusU };
});
handle.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const spanPx = Math.max(180, view.stageWidth() * 0.78);
  state.focusU = clamp(drag.u + (e.clientX - drag.x) / spanPx, 0.08, 0.92);
  render();
});
const endDrag = () => {
  if (!drag) return;
  drag = null;
  readout.setAttribute("aria-live", "polite");
  state.focusU = snapFocus(state.count, state.focusU);
  render();
};
handle.addEventListener("pointerup", endDrag);
handle.addEventListener("pointercancel", endDrag);

handle.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.shiftKey ? 0.025 : 0.08;
    const dir = e.key === "ArrowLeft" ? -1 : 1;
    state.focusU = clamp(state.focusU + dir * step, 0.08, 0.92);
    render();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setCount(state.count + 1);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    setCount(state.count - 1);
  } else if (e.key === "Home") {
    e.preventDefault();
    state.count = 3;
    state.focusU = 0.5;
    render();
  }
});

// 点画布里的任意形体直接把焦点切过去
stage.addEventListener("click", (e) => {
  if (e.target.closest(".stage-tools") || e.target.closest(".handle")) return;
  const hit = view.hitTest(e.clientX, e.clientY);
  if (hit >= 0) {
    state.focusU = current.items[hit].u;
    render();
  }
});

new ResizeObserver(placeHandle).observe(stage);

render();
initFigures();
