// 016 居中构图 · 主控脚本
// 负责开场三维/降级共用舞台、阿恩海姆力场叠加层、键盘/鼠标/触屏交互与滚屏渐显

import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import {
  arnheimForce,
  clamp,
  classify,
  GEOMETRIC_CENTER,
  GUIDES,
  LIMITS,
  OPTICAL_CENTER,
  snapTarget,
  SUBJECTS,
  visualCentroid,
} from "./model.js";
import { PALETTE } from "./palette.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

document.documentElement.classList.add("js-ready");

// ---------- 开场主角舞台 ----------
const stage = $("hero-stage");
const host = $("hero-canvas-host");
const overlay = $("hero-overlay");
const handle = $("hero-handle");
const readout = $("hero-readout");

const state = {
  pos: { u: GEOMETRIC_CENTER.u, v: GEOMETRIC_CENTER.v },
  subject: "sphere",
  guide: "crosshair",
  clutter: false,
};

// 开场从微偏位置丝滑滑向中心，每一帧（包括 0.9 秒截图）都交代「从偏离回归聚焦」的动态
const shown = { u: 0.65, v: 0.56 };
let userInteracted = false;
let dragging = false;
let stageW = 600;
let stageH = 440;
let lastOverlayKey = "";

let renderer;
try {
  renderer = webgl() ? createScene3D(host) : null;
} catch {
  renderer = null;
}
if (!renderer) {
  renderer = createSceneFlat(host);
  stage.classList.add("is-flat");
}

function drawOverlay(u, v) {
  const W = stageW;
  const H = stageH;
  const key = `${W}|${H}|${Math.round(u * 600)}|${Math.round(v * 600)}|${state.guide}|${state.clutter}|${state.subject}`;
  if (key === lastOverlayKey) return;
  lastOverlayKey = key;

  overlay.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const cx = W * 0.5;
  const cy = H * 0.5;
  const optY = H * OPTICAL_CENTER.v;
  const sx = u * W;
  const sy = v * H;
  const dGeo = Math.hypot(u - 0.5, v - 0.5);
  const locked = dGeo < 0.026 && !state.clutter && state.subject !== "boat";

  const frag = new DocumentFragment();

  // 1. 复刻海报 016 的四角朱红取景折角：靠近中心时轻轻向内收拢锁紧；矮屏下避开顶/底 HUD 标签
  const spread = Math.min(0.06, dGeo * 0.22);
  const bx = W * (0.2 - spread);
  const by = Math.max(H < 290 ? 44 : 38, H * (0.14 - spread * 0.7));
  const bw = W - bx * 2;
  const bh = H - by * 2;
  const bl = Math.max(14, Math.min(28, Math.min(W, H) * 0.065));
  frag.append(
    svgEl("path", {
      d: `M${bx},${by + bl}V${by}H${bx + bl} M${bx + bw - bl},${by}H${bx + bw}V${by + bl} M${bx},${by + bh - bl}V${by + bh}H${bx + bl} M${bx + bw - bl},${by + bh}H${bx + bw}V${by + bh - bl}`,
      fill: "none",
      stroke: PALETTE.vermilion,
      "stroke-width": locked ? 3 : 2.2,
      "stroke-linecap": "square",
    })
  );

  // 2. 参考线层
  if (state.guide === "crosshair" || state.guide === "optical") {
    frag.append(
      svgEl("line", {
        x1: cx,
        y1: H * 0.06,
        x2: cx,
        y2: H * 0.94,
        stroke: PALETTE.ink,
        "stroke-width": 1.6,
        "stroke-opacity": 0.78,
        "stroke-dasharray": "7 7",
      }),
      svgEl("line", {
        x1: W * 0.08,
        y1: cy,
        x2: W * 0.92,
        y2: cy,
        stroke: PALETTE.ink,
        "stroke-width": 1.6,
        "stroke-opacity": 0.78,
        "stroke-dasharray": "7 7",
      }),
      // 正中粗十字（海报同款）
      svgEl("path", {
        d: `M${cx - 10},${cy}H${cx + 10} M${cx},${cy - 10}V${cy + 10}`,
        stroke: PALETTE.ink,
        "stroke-width": 2.8,
        "stroke-linecap": "round",
      })
    );
  }

  if (state.guide === "optical") {
    // 光学中心线（略高 3.5% 经验值）
    frag.append(
      svgEl("line", {
        x1: W * 0.14,
        y1: optY,
        x2: W * 0.86,
        y2: optY,
        stroke: PALETTE.vermilion,
        "stroke-width": 1.4,
        "stroke-dasharray": "3 4",
      }),
      svgEl("circle", {
        cx,
        cy: optY,
        r: 4.2,
        fill: PALETTE.paper,
        stroke: PALETTE.vermilion,
        "stroke-width": 2,
      })
    );
  }

  if (state.guide === "arnheim") {
    // 阿恩海姆隐性骨架（对角线 + 中线 + 中心力场圆 + 实时拉扯箭头）
    frag.append(
      svgEl("line", { x1: 0, y1: 0, x2: W, y2: H, stroke: PALETTE.ink, "stroke-opacity": 0.18, "stroke-width": 1, "stroke-dasharray": "5 5" }),
      svgEl("line", { x1: W, y1: 0, x2: 0, y2: H, stroke: PALETTE.ink, "stroke-opacity": 0.18, "stroke-width": 1, "stroke-dasharray": "5 5" }),
      svgEl("line", { x1: cx, y1: 0, x2: cx, y2: H, stroke: PALETTE.ink, "stroke-opacity": 0.3, "stroke-width": 1.2, "stroke-dasharray": "6 6" }),
      svgEl("line", { x1: 0, y1: cy, x2: W, y2: cy, stroke: PALETTE.ink, "stroke-opacity": 0.3, "stroke-width": 1.2, "stroke-dasharray": "6 6" }),
      svgEl("circle", { cx, cy, r: Math.min(W, H) * 0.24, fill: "none", stroke: PALETTE.vermilion, "stroke-opacity": 0.25, "stroke-width": 1.2, "stroke-dasharray": "3 4" })
    );
    const f = arnheimForce(u, v);
    if (f.mag > 0.04) {
      const norm = Math.max(0.001, Math.hypot(f.fx, f.fy));
      const nx = f.fx / norm;
      const ny = f.fy / norm;
      const len = 26 + f.mag * 64;
      const x2 = sx + nx * len;
      const y2 = sy + ny * len;
      const ang = Math.atan2(ny, nx);
      const ah = 10;
      frag.append(
        svgEl("line", { x1: sx, y1: sy, x2, y2, stroke: PALETTE.ink, "stroke-width": 2.4, "stroke-linecap": "round" }),
        svgEl("polygon", {
          points: `${x2},${y2} ${x2 - ah * Math.cos(ang - 0.5)},${y2 - ah * Math.sin(ang - 0.5)} ${x2 - ah * Math.cos(ang + 0.5)},${y2 - ah * Math.sin(ang + 0.5)}`,
          fill: PALETTE.ink,
        })
      );
    }
  }

  // 3. 当打开边缘干扰物时，用细线标出「综合视觉重心」被拉偏的位置
  if (state.clutter) {
    const c = visualCentroid({ u, v }, true);
    const gx = c.u * W;
    const gy = c.v * H;
    frag.append(
      svgEl("line", { x1: sx, y1: sy, x2: gx, y2: gy, stroke: PALETTE.ink, "stroke-width": 1.8, "stroke-dasharray": "3 3" }),
      svgEl("circle", { cx: gx, cy: gy, r: 6.5, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 2.2 }),
      svgEl("circle", { cx: gx, cy: gy, r: 2.2, fill: PALETTE.vermilion })
    );
  }

  overlay.replaceChildren(frag);
}

function syncHandle(u, v) {
  handle.style.left = `${u * 100}%`;
  handle.style.top = `${v * 100}%`;
}

function updateReadout() {
  const info = classify(state);
  const dxStr = info.offsetX === 0 ? "0%" : `${info.offsetX > 0 ? "+" : ""}${info.offsetX}%`;
  const dyStr = info.offsetY === 0 ? "0%" : `${info.offsetY > 0 ? "+" : ""}${info.offsetY}%`;

  $("hud-mode").textContent = `${SUBJECTS[state.subject].en} · ${GUIDES[state.guide].hud}`;
  $("hud-coord").textContent = `ΔX ${dxStr}  ΔY ${dyStr}`;
  $("hud-status").textContent = info.badge;
  $("hud-status").dataset.locked = String(info.locked);

  $("ro-badge").textContent = info.badge;
  $("ro-badge").dataset.zone = info.zone;
  $("ro-coord").textContent = `距正中 ${info.distPct}%`;
  $("ro-headline").textContent = info.headline;
  $("ro-body").textContent = info.body;
  $("ro-extra").textContent = info.extra;

  stage.classList.toggle("is-locked", info.locked);
  handle.setAttribute("aria-valuenow", String(Math.round(state.pos.u * 100)));
  handle.setAttribute(
    "aria-valuetext",
    `${SUBJECTS[state.subject].label}，横向偏移 ${dxStr}，纵向偏移 ${dyStr}，${info.badge}`
  );
}

const view = loop(stage, (t, dt, { still }) => {
  if (still) {
    shown.u = state.pos.u;
    shown.v = state.pos.v;
  } else if (!userInteracted && t < 1.25) {
    // 前 1.25 秒从微偏处柔和回正到画心
    const p = 1 - Math.pow(1 - Math.min(1, t / 1.25), 3);
    shown.u = 0.65 + (state.pos.u - 0.65) * p;
    shown.v = 0.56 + (state.pos.v - 0.56) * p;
  } else {
    const k = dt ? 1 - Math.exp(-dt * (dragging ? 30 : 12)) : 1;
    shown.u += (state.pos.u - shown.u) * k;
    shown.v += (state.pos.v - shown.v) * k;
  }

  syncHandle(shown.u, shown.v);
  drawOverlay(shown.u, shown.v);
  renderer.render(
    {
      u: shown.u,
      v: shown.v,
      subject: state.subject,
      clutter: state.clutter,
      still,
    },
    still ? 0 : t
  );
});

function resizeStage() {
  const r = stage.getBoundingClientRect();
  stageW = Math.max(1, Math.round(r.width));
  stageH = Math.max(1, Math.round(r.height));
  lastOverlayKey = "";
  renderer.resize(stageW, stageH);
  view.draw();
}
new ResizeObserver(resizeStage).observe(stage);

function setPosition(u, v, { snap = false } = {}) {
  userInteracted = true;
  let nu = clamp(u, LIMITS.uMin, LIMITS.uMax);
  let nv = clamp(v, LIMITS.vMin, LIMITS.vMax);
  if (snap) {
    const s = snapTarget(nu, nv, state.guide);
    if (s) {
      nu = s.u;
      nv = s.v;
    }
  }
  state.pos.u = nu;
  state.pos.v = nv;
  if (reducedMotion.matches) {
    shown.u = nu;
    shown.v = nv;
  }
  updateReadout();
  view.draw();
}

function pointFromEvent(e) {
  const r = stage.getBoundingClientRect();
  return {
    u: (e.clientX - r.left) / Math.max(1, r.width),
    v: (e.clientY - r.top) / Math.max(1, r.height),
  };
}

// 拖动中心准星把手（仅把手声明 touch-action: none，手机上下滚动完全不受阻）
handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handle.setPointerCapture(e.pointerId);
  handle.focus({ preventScroll: true });
  dragging = true;
  stage.classList.add("is-dragging");
  readout?.setAttribute("aria-live", "off");
});
handle.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = pointFromEvent(e);
  setPosition(p.u, p.v, false);
});
const finishDrag = () => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("is-dragging");
  readout?.setAttribute("aria-live", "polite");
  setPosition(state.pos.u, state.pos.v, { snap: true });
};
handle.addEventListener("pointerup", finishDrag);
handle.addEventListener("pointercancel", finishDrag);
handle.addEventListener("click", (e) => e.stopPropagation());

// 桌面鼠标点击或拖动画布；触屏点按定位，纵向滑动交给页面滚动
let mouseDrag = false;
stage.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#hero-handle")) return;
  if (e.pointerType === "mouse") {
    mouseDrag = true;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
    const p = pointFromEvent(e);
    setPosition(p.u, p.v, false);
  }
});
stage.addEventListener("pointermove", (e) => {
  if (!mouseDrag) return;
  const p = pointFromEvent(e);
  setPosition(p.u, p.v, false);
});
const finishStageDrag = () => {
  if (!mouseDrag) return;
  mouseDrag = false;
  dragging = false;
  stage.classList.remove("is-dragging");
  setPosition(state.pos.u, state.pos.v, { snap: true });
};
stage.addEventListener("pointerup", finishStageDrag);
stage.addEventListener("pointercancel", finishStageDrag);
stage.addEventListener("click", (e) => {
  if (e.target.closest("#hero-handle")) return;
  const p = pointFromEvent(e);
  setPosition(p.u, p.v, { snap: true });
});

// 键盘方向键（Shift 精细 1% 步长；Home / Space 一键归中）
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
    setPosition(state.pos.u + delta[0], state.pos.v + delta[1], { snap: false });
  } else if (e.key === "Home" || e.key === " ") {
    e.preventDefault();
    const target = state.guide === "optical" ? OPTICAL_CENTER : GEOMETRIC_CENTER;
    setPosition(target.u, target.v, { snap: false });
  }
});

// 控件绑定：主体 / 参考线 / 干扰物 / 一键归中
document.querySelectorAll('input[name="hero-subject"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    state.subject = r.value;
    lastOverlayKey = "";
    updateReadout();
    view.draw();
  });
});

document.querySelectorAll('input[name="hero-guide"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    state.guide = r.value;
    lastOverlayKey = "";
    updateReadout();
    view.draw();
  });
});

$("btn-clutter")?.addEventListener("click", (e) => {
  const btn = e.currentTarget;
  state.clutter = !state.clutter;
  btn.setAttribute("aria-pressed", String(state.clutter));
  btn.textContent = state.clutter ? "已开：边缘干扰物" : "加入边缘干扰物";
  lastOverlayKey = "";
  updateReadout();
  view.draw();
});

$("btn-recenter")?.addEventListener("click", () => {
  const target = state.guide === "optical" ? OPTICAL_CENTER : GEOMETRIC_CENTER;
  setPosition(target.u, target.v, { snap: false });
});

// 滚屏渐显（尊重 prefers-reduced-motion）
const reveals = [...document.querySelectorAll(".reveal")];
if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}

// 启动
updateReadout();
resizeStage();
initLabs();
