// 072 三点透视 · 主入口（WebGL / 2D 降级联动、手势与键盘操控、全页实验与海报灯箱）
import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import {
  clamp,
  createState,
  diagnose,
  LIMITS,
  pitchToHorizPct,
  pitchToPct,
  PRESETS,
  THRESHOLDS,
} from "./model.js";
import { createScene3D } from "./scene3d.js";
import { createScene2D } from "./scene2d.js";
import {
  createMiniRadar,
  initPractice,
  initShiftLab,
  initStepLab,
  initTiltLab,
  initTriangleLab,
} from "./labs.js";

// ---------- 1. 初始化首屏主角舞台（开场停在 +10° 微仰起始态，不提前给答案） ----------
const state = createState();
const target = { ...state };
const introStartPitch = 4;
let introDone = reducedMotion.matches;
let dirty = true;

const stageEl = document.getElementById("hero-stage");
const renderer = webgl() ? createScene3D(stageEl) : createScene2D(stageEl);
const radar = createMiniRadar(document.getElementById("radar-svg"));

// 右栏竖向俯仰倾角仪
const pitchRange = document.getElementById("pitch-range");
const pitchOut = document.getElementById("pitch-out");
const clinoTrack = document.getElementById("clino-track");
const clinoKnob = document.getElementById("clino-knob");

// 移动端（≤600px）首屏横向俯仰倾角条
const pitchRangeMobile = document.getElementById("pitch-range-mobile");
const pitchOutMobile = document.getElementById("pitch-out-mobile");
const clinoHTrack = document.getElementById("clino-h-track");
const clinoHKnob = document.getElementById("clino-h-knob");

const focalRange = document.getElementById("focal-range");
const focalOut = document.getElementById("focal-out");
const raysToggle = document.getElementById("rays-toggle");
const resetBtn = document.getElementById("hero-reset");

const hudPitch = document.getElementById("hud-pitch");
const hudFocal = document.getElementById("hud-focal");
const diagBox = document.getElementById("diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagVp = document.getElementById("diag-vp");

const presetBtns = [...document.querySelectorAll("[data-preset]")];
const sceneBtns = [...document.querySelectorAll("[data-scene]")];

// 所有倾角仪刻度、警示带与 0° 线严格由 pitchToPct / pitchToHorizPct 统一生成（绝不写死错位）
function layoutClinometers() {
  // 1) 竖向倾角仪
  if (clinoTrack) {
    const upTop = pitchToPct(THRESHOLDS.awkwardMax);
    const upBot = pitchToPct(THRESHOLDS.levelEps);
    const dnTop = pitchToPct(-THRESHOLDS.levelEps);
    const dnBot = pitchToPct(-THRESHOLDS.awkwardMax);

    const warnUp = clinoTrack.querySelector('[data-warn="up"]');
    const warnDn = clinoTrack.querySelector('[data-warn="down"]');
    const zeroLine = document.getElementById("clino-zero-line");

    if (warnUp) {
      warnUp.style.top = `${upTop.toFixed(2)}%`;
      warnUp.style.height = `${(upBot - upTop).toFixed(2)}%`;
    }
    if (warnDn) {
      warnDn.style.top = `${dnTop.toFixed(2)}%`;
      warnDn.style.height = `${(dnBot - dnTop).toFixed(2)}%`;
    }
    if (zeroLine) {
      zeroLine.style.top = `${pitchToPct(0).toFixed(2)}%`;
    }
    for (const tick of clinoTrack.querySelectorAll(".clino-tick[data-pitch]")) {
      const deg = Number(tick.dataset.pitch);
      tick.style.setProperty("--p", `${pitchToPct(deg).toFixed(2)}%`);
    }
  }

  // 2) 移动端横向俯仰倾角条
  const horiz = document.getElementById("clino-horiz");
  if (horiz && clinoHTrack) {
    const dnLeft = pitchToHorizPct(-THRESHOLDS.awkwardMax);
    const dnRight = pitchToHorizPct(-THRESHOLDS.levelEps);
    const upLeft = pitchToHorizPct(THRESHOLDS.levelEps);
    const upRight = pitchToHorizPct(THRESHOLDS.awkwardMax);

    const hWarnDn = clinoHTrack.querySelector('[data-h-warn="down"]');
    const hWarnUp = clinoHTrack.querySelector('[data-h-warn="up"]');
    const hZero = document.getElementById("clino-h-zero");

    if (hWarnDn) {
      hWarnDn.style.left = `${dnLeft.toFixed(2)}%`;
      hWarnDn.style.width = `${(dnRight - dnLeft).toFixed(2)}%`;
    }
    if (hWarnUp) {
      hWarnUp.style.left = `${upLeft.toFixed(2)}%`;
      hWarnUp.style.width = `${(upRight - upLeft).toFixed(2)}%`;
    }
    if (hZero) {
      hZero.style.left = `${pitchToHorizPct(0).toFixed(2)}%`;
    }
    for (const tick of horiz.querySelectorAll(".clino-h-tick[data-hpitch]")) {
      const deg = Number(tick.dataset.hpitch);
      tick.style.setProperty("--hp", `${pitchToHorizPct(deg).toFixed(2)}%`);
    }
  }
}
layoutClinometers();

function snapPitch(p) {
  const snaps = [0, 44, -42];
  for (const s of snaps) if (Math.abs(p - s) < 2.2) return s;
  return p;
}

function syncUI(vps, cam) {
  const p = Math.round(state.pitch);
  const f = Math.round(state.focal);
  const y = Math.round(state.yaw);
  const d = diagnose(state, vps, cam);
  const pStr = `${p > 0 ? "+" : ""}${p}°`;

  // 同步竖向倾角仪
  pitchRange.value = String(p);
  pitchOut.textContent = pStr;
  pitchOut.dataset.tone = d.tone;
  clinoKnob.style.top = `${clamp(pitchToPct(state.pitch), 2, 98).toFixed(2)}%`;
  clinoKnob.dataset.tone = d.tone;

  // 同步移动端横向倾角条
  if (pitchRangeMobile) pitchRangeMobile.value = String(p);
  if (pitchOutMobile) {
    pitchOutMobile.textContent = pStr;
    pitchOutMobile.dataset.tone = d.tone;
  }
  if (clinoHKnob) {
    clinoHKnob.style.left = `${clamp(pitchToHorizPct(state.pitch), 1, 99).toFixed(2)}%`;
    clinoHKnob.dataset.tone = d.tone;
  }

  focalRange.value = String(f);
  focalOut.textContent = `${f} mm`;

  hudPitch.textContent = `PITCH ${pStr} · YAW ${y > 0 ? "+" : ""}${y}°`;
  const modeShort = vps.isLevel ? "2-PT" : "3-PT";
  hudFocal.textContent = `${f}mm · ${vps.vertical.label} · ${modeShort}`;

  radar.update(vps);

  diagBox.dataset.tone = d.tone;
  diagBadge.textContent = d.badge;
  diagTitle.textContent = d.headline;
  diagBody.textContent = `${d.body} ${d.yawNote}`;
  diagVp.textContent = d.vpStatus;

  for (const b of presetBtns) {
    b.setAttribute("aria-pressed", String(state.preset === b.dataset.preset));
  }
  for (const b of sceneBtns) {
    b.setAttribute("aria-pressed", String(state.scene === b.dataset.scene));
  }
  raysToggle.setAttribute("aria-pressed", String(state.showRays));
  raysToggle.textContent = state.showRays ? "消失线：开" : "消失线：关";
}

function setTarget(patch, presetId = "") {
  introDone = true;
  Object.assign(target, patch);
  target.pitch = clamp(target.pitch, LIMITS.pitchMin, LIMITS.pitchMax);
  target.yaw = clamp(target.yaw, LIMITS.yawMin, LIMITS.yawMax);
  target.focal = clamp(target.focal, LIMITS.focalMin, LIMITS.focalMax);
  state.preset = presetId;
  if ("scene" in patch) state.scene = patch.scene;
  if ("showRays" in patch) state.showRays = patch.showRays;
  dirty = true;
  heroLoop.draw();
}

// ---------- 2. 渲染主循环（严格遵循 loop 的 still 约定与省电规则） ----------
let lastUiTick = -1;
let dragState = null;
let clinoDragging = false;
let clinoHDragging = false;
const heroLoop = loop(stageEl, (t, dt, { still }) => {
  if (still) {
    introDone = true;
    state.pitch = target.pitch;
    state.yaw = target.yaw;
    state.focal = target.focal;
    const { cam, vps } = renderer.render(state, 1);
    syncUI(vps, cam);
    dirty = false;
    return;
  }

  let moving = false;
  let reveal = 1;

  if (!introDone) {
    // 轻柔扫出透视辅助线并停在 +10° 微仰起始态，不自动滑到 +44° 答案
    const dur = 0.85;
    const k = clamp(t / dur, 0, 1);
    const ease = 1 - Math.pow(1 - k, 3);
    state.pitch = introStartPitch + (target.pitch - introStartPitch) * ease;
    state.yaw = target.yaw;
    state.focal = target.focal;
    reveal = clamp(k * 1.2, 0.25, 1);
    moving = k < 1;
    if (k >= 1) introDone = true;
  } else {
    const alpha = dt > 0 ? 1 - Math.exp(-15 * dt) : 1;
    const dp = target.pitch - state.pitch;
    const dy = target.yaw - state.yaw;
    const df = target.focal - state.focal;
    if (Math.abs(dp) > 0.04 || Math.abs(dy) > 0.04 || Math.abs(df) > 0.04) {
      state.pitch += dp * alpha;
      state.yaw += dy * alpha;
      state.focal += df * alpha;
      moving = true;
    } else if (dirty) {
      state.pitch = target.pitch;
      state.yaw = target.yaw;
      state.focal = target.focal;
    }
  }

  if (moving || dirty) {
    const { cam, vps } = renderer.render(state, reveal);
    const draggingNow = Boolean(dragState || clinoDragging || clinoHDragging);
    if (t - lastUiTick > 0.07 || (!moving && !draggingNow)) {
      syncUI(vps, cam);
      lastUiTick = t;
    }
    dirty = false;
  }
});

new ResizeObserver(() => {
  renderer.resize();
  dirty = true;
  heroLoop.draw();
}).observe(stageEl);

// ---------- 3. 舞台手势（触屏横向绕转不抢滚屏，鼠标双轴自由俯仰绕转） ----------
stageEl.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  introDone = true;
  const rect = stageEl.getBoundingClientRect();
  dragState = {
    id: e.pointerId,
    isTouch: e.pointerType === "touch",
    x0: e.clientX,
    y0: e.clientY,
    w: Math.max(180, rect.width),
    h: Math.max(180, rect.height),
    yaw0: target.yaw,
    pitch0: target.pitch,
    locked: e.pointerType !== "touch",
  };
  stageEl.classList.add("dragging");
  try { stageEl.setPointerCapture(e.pointerId); } catch {}
});

stageEl.addEventListener("pointermove", (e) => {
  if (!dragState || e.pointerId !== dragState.id) return;
  const dx = e.clientX - dragState.x0;
  const dy = e.clientY - dragState.y0;
  if (!dragState.locked) {
    if (Math.hypot(dx, dy) < 5) return;
    if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
      dragState.locked = true;
    } else {
      dragState = null;
      stageEl.classList.remove("dragging");
      return;
    }
  }
  const nextYaw = clamp(dragState.yaw0 + (dx / dragState.w) * 84, LIMITS.yawMin, LIMITS.yawMax);
  const nextPitch = dragState.isTouch
    ? target.pitch
    : clamp(dragState.pitch0 - (dy / dragState.h) * 96, LIMITS.pitchMin, LIMITS.pitchMax);

  target.yaw = nextYaw;
  state.yaw = nextYaw;
  if (!dragState.isTouch) {
    target.pitch = nextPitch;
    state.pitch = nextPitch;
  }
  state.preset = "";
  dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
});

const endStageDrag = (e) => {
  if (!dragState || e.pointerId !== dragState.id) return;
  if (!dragState.isTouch) {
    const snapped = snapPitch(target.pitch);
    if (snapped !== target.pitch) setTarget({ pitch: snapped });
  }
  dragState = null;
  stageEl.classList.remove("dragging");
  dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
};
stageEl.addEventListener("pointerup", endStageDrag);
stageEl.addEventListener("pointercancel", endStageDrag);

stageEl.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 1 : 4;
  if (e.key === "ArrowLeft") { e.preventDefault(); setTarget({ yaw: target.yaw - step }); }
  else if (e.key === "ArrowRight") { e.preventDefault(); setTarget({ yaw: target.yaw + step }); }
  else if (e.key === "ArrowUp") { e.preventDefault(); setTarget({ pitch: target.pitch + step }); }
  else if (e.key === "ArrowDown") { e.preventDefault(); setTarget({ pitch: target.pitch - step }); }
  else if (e.key === "r" || e.key === "R") { e.preventDefault(); applyPreset("poster"); }
});

// ---------- 4. 竖向俯仰倾角仪（右栏） + 横向俯仰倾角条（手机首屏） ----------
function setPitchDirect(p) {
  introDone = true;
  const clamped = clamp(p, LIMITS.pitchMin, LIMITS.pitchMax);
  target.pitch = clamped;
  state.pitch = clamped;
  state.preset = "";
  dirty = true;
  heroLoop.draw();
}

function pitchFromTrackY(clientY) {
  const r = clinoTrack.getBoundingClientRect();
  const ratio = clamp((clientY - r.top) / r.height, 0, 1);
  return LIMITS.pitchMax - ratio * (LIMITS.pitchMax - LIMITS.pitchMin);
}

clinoTrack.addEventListener("pointerdown", (e) => {
  clinoDragging = true;
  try { clinoTrack.setPointerCapture(e.pointerId); } catch {}
  setPitchDirect(pitchFromTrackY(e.clientY));
});
clinoTrack.addEventListener("pointermove", (e) => {
  if (!clinoDragging) return;
  const p = pitchFromTrackY(e.clientY);
  target.pitch = p;
  state.pitch = p;
  state.preset = "";
  dirty = true;
  if (reducedMotion.matches) heroLoop.draw();
});
const endClino = () => {
  if (!clinoDragging) return;
  clinoDragging = false;
  setTarget({ pitch: snapPitch(target.pitch) });
};
clinoTrack.addEventListener("pointerup", endClino);
clinoTrack.addEventListener("pointercancel", endClino);

pitchRange.addEventListener("input", () => setPitchDirect(Number(pitchRange.value)));

// 移动端横向倾角条交互（点击/拖动轨道 + 键盘/无障碍原生 range）
if (clinoHTrack) {
  const pitchFromTrackX = (clientX) => {
    const r = clinoHTrack.getBoundingClientRect();
    const ratio = clamp((clientX - r.left) / r.width, 0, 1);
    return LIMITS.pitchMin + ratio * (LIMITS.pitchMax - LIMITS.pitchMin);
  };
  clinoHTrack.addEventListener("pointerdown", (e) => {
    clinoHDragging = true;
    try { clinoHTrack.setPointerCapture(e.pointerId); } catch {}
    setPitchDirect(pitchFromTrackX(e.clientX));
  });
  clinoHTrack.addEventListener("pointermove", (e) => {
    if (!clinoHDragging) return;
    const p = pitchFromTrackX(e.clientX);
    target.pitch = p;
    state.pitch = p;
    state.preset = "";
    dirty = true;
    if (reducedMotion.matches) heroLoop.draw();
  });
  const endClinoH = () => {
    if (!clinoHDragging) return;
    clinoHDragging = false;
    setTarget({ pitch: snapPitch(target.pitch) });
  };
  clinoHTrack.addEventListener("pointerup", endClinoH);
  clinoHTrack.addEventListener("pointercancel", endClinoH);
}
if (pitchRangeMobile) {
  pitchRangeMobile.addEventListener("input", () => setPitchDirect(Number(pitchRangeMobile.value)));
}

// ---------- 5. 焦距、场景、消失线与四预设 ----------
focalRange.addEventListener("input", () => {
  introDone = true;
  const f = Number(focalRange.value);
  target.focal = f;
  state.focal = f;
  state.preset = "";
  dirty = true;
  heroLoop.draw();
});

function applyPreset(id) {
  const p = PRESETS[id];
  if (!p) return;
  setTarget({ pitch: p.pitch, yaw: p.yaw, focal: p.focal }, id);
}

for (const b of presetBtns) b.addEventListener("click", () => applyPreset(b.dataset.preset));
for (const b of sceneBtns) b.addEventListener("click", () => setTarget({ scene: b.dataset.scene }, state.preset));

raysToggle.addEventListener("click", () => setTarget({ showRays: !state.showRays }, state.preset));
resetBtn.addEventListener("click", () => {
  setTarget({ pitch: PRESETS.poster.pitch, yaw: PRESETS.poster.yaw, focal: PRESETS.poster.focal, scene: "monolith", showRays: true }, "poster");
});

// ---------- 6. 初始化正文四个交互实验与小练习 ----------
initTiltLab();
initTriangleLab();
initStepLab();
initShiftLab();
initPractice();

// ---------- 7. 原海报灯箱（复用 #poster.src，不重复内联图片） ----------
const posterBtn = document.getElementById("poster-btn");
const posterImg = document.getElementById("poster");
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbView = document.getElementById("lb-viewport");
const lbClose = document.getElementById("lb-close");
const lbZoom = document.getElementById("lb-zoom");

let lbScale = 1, lbX = 0, lbY = 0, lbDrag = null;
const applyLb = () => {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoom.textContent = lbScale > 1 ? "还原 1×" : "放大 1.8×";
};

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1; lbX = 0; lbY = 0;
  applyLb();
  lb.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}
function closeLightbox() {
  lb.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoom.addEventListener("click", () => {
  lbScale = lbScale > 1 ? 1 : 1.8;
  if (lbScale === 1) { lbX = 0; lbY = 0; }
  applyLb();
});
lbView.addEventListener("click", (e) => { if (e.target === lbView) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLightbox(); });

lbView.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, x0: e.clientX - lbX, y0: e.clientY - lbY };
  lbView.classList.add("dragging");
  try { lbView.setPointerCapture(e.pointerId); } catch {}
});
lbView.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbX = e.clientX - lbDrag.x0;
  lbY = e.clientY - lbDrag.y0;
  applyLb();
});
const endLbDrag = () => { lbDrag = null; lbView.classList.remove("dragging"); };
lbView.addEventListener("pointerup", endLbDrag);
lbView.addEventListener("pointercancel", endLbDrag);

// ---------- 8. 滚动渐显 ----------
const reveals = [...document.querySelectorAll(".reveal")];
if (reducedMotion.matches) {
  for (const r of reveals) r.classList.add("in");
} else {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    }
  }, { rootMargin: "0px 0px -6% 0px" });
  for (const r of reveals) io.observe(r);
}
