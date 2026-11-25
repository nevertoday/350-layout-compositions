import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import { MIN_GAP, PRESETS, ROMAN, clampLevels, describeState, snapHandle, tonalMetrics } from "./model.js";
import { clamp, lerp, levelRgb, rgbCss } from "./palette.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);

const stage = $("stage");
const sceneHost = $("scene-host");
const track = $("levels-track");
const lvHist = $("lv-hist");
const lvZones = $("lv-zones");
const lvSpan = $("lv-span");
const knobBlack = $("knob-black");
const knobMid = $("knob-mid");
const knobWhite = $("knob-white");
const kzBlack = $("kz-black");
const kzMid = $("kz-mid");
const kzWhite = $("kz-white");
const readout = $("readout");

const DEFAULT_PRESET = PRESETS[0];
const state = {
  black: DEFAULT_PRESET.black,
  white: DEFAULT_PRESET.white,
  key: DEFAULT_PRESET.key,
  scene: "split",
  gradation: "notan",
  dot: true,
};

// 开场由低反差中灰柔和推开至海报级明暗两极；减少动态效果时直接停在终点
const shown = {
  black: reducedMotion.matches ? state.black : 0.34,
  white: reducedMotion.matches ? state.white : 0.64,
  key: state.key,
  openK: reducedMotion.matches ? 1 : 0.62,
};

// 将 [0..1] 色阶值精确映射到 11 格色阶条的格心坐标，保证 Zone 境界线与格缝严格对齐
const trackPct = (v) => ((clamp(v, 0, 1) * 10 + 0.5) / 11) * 100;
const posFromClientX = (clientX, rect) => {
  const u = (clientX - rect.left) / Math.max(rect.width, 1);
  return clamp((u * 11 - 0.5) / 10, 0, 1);
};

// 建立暗房十一阶独立直方图行（实心墨柱 + 朱红峰值）与色阶条（Zone 0..X 严格单调明度）
const histBars = ROMAN.map((r, idx) => {
  const hcol = document.createElement("div");
  hcol.className = "lv-hcol";
  const bar = document.createElement("i");
  bar.className = "lv-hbar";
  hcol.append(bar);
  lvHist.append(hcol);

  const cell = document.createElement("div");
  cell.className = "lv-cell";
  cell.style.background = rgbCss(levelRgb(idx / 10));
  cell.style.color = idx < 5 ? "#efe7dc" : "#10110e";
  const tag = document.createElement("span");
  tag.className = "lv-z";
  tag.setAttribute("lang", "en");
  tag.textContent = r;
  cell.append(tag);
  lvZones.append(cell);
  return { cell, bar };
});

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

let activeDrag = null; // { which: "black"|"mid"|"white"|"stage", el, pointerId, rect, startX, startY, startKey, locked }
let suppressTrackClick = false;
let dirty = true;
let readoutDirty = true;
let opened = reducedMotion.matches;
let lastZones = { b: -1, m: -1, w: -1 };

function syncKnobZones(zLo, zMid, zHi) {
  if (lastZones.b !== zLo) {
    kzBlack.textContent = `Zone ${ROMAN[zLo]}`;
    lastZones.b = zLo;
  }
  if (lastZones.m !== zMid) {
    kzMid.textContent = `Zone ${ROMAN[zMid]}`;
    lastZones.m = zMid;
  }
  if (lastZones.w !== zHi) {
    kzWhite.textContent = `Zone ${ROMAN[zHi]}`;
    lastZones.w = zHi;
  }
}

function paintLevels(cur) {
  const midPos = lerp(cur.black, cur.white, cur.key);
  const bPct = trackPct(cur.black);
  const mPct = trackPct(midPos);
  const wPct = trackPct(cur.white);
  knobBlack.style.left = `${bPct.toFixed(2)}%`;
  knobMid.style.left = `${mPct.toFixed(2)}%`;
  knobWhite.style.left = `${wPct.toFixed(2)}%`;

  lvSpan.style.left = `${bPct.toFixed(2)}%`;
  lvSpan.style.width = `${Math.max(0, wPct - bPct).toFixed(2)}%`;

  const m = tonalMetrics(cur);
  syncKnobZones(m.zLo, m.zMid, m.zHi);

  let maxH = 0;
  for (let i = m.zLo; i <= m.zHi; i++) {
    if (m.histogram[i] > maxH) maxH = m.histogram[i];
  }
  for (let i = 0; i < 11; i++) {
    const inRange = i >= m.zLo && i <= m.zHi;
    const h = m.histogram[i];
    histBars[i].cell.classList.toggle("out", !inRange);
    histBars[i].bar.style.transform = `scaleY(${h.toFixed(3)})`;
    histBars[i].bar.classList.toggle("is-peak", inRange && maxH > 0.1 && h >= maxH - 0.025);
  }
}

function updateReadout() {
  const info = describeState(state);
  $("hud-ratio").textContent = info.rTxt;
  $("hud-zone").textContent = info.zoneLabel;
  $("hud-split").textContent = `${info.lightPct} / ${info.darkPct}`;
  $("hud-key").textContent = info.keyName;
  $("lv-vals").textContent = `黑场 Zone ${ROMAN[info.zLo]} (${info.darkHex}) · 亮占 ${info.lightPct}% · 白场 Zone ${ROMAN[info.zHi]} (${info.lightHex})`;
  syncKnobZones(info.zLo, info.zMid, info.zHi);

  $("ro-title").textContent = info.title;
  const badge = $("ro-badge");
  badge.textContent = info.badge;
  badge.dataset.status = info.status;
  $("ro-text").textContent = info.text;
  $("ro-note").textContent = info.note;

  knobBlack.setAttribute("aria-valuenow", String(Math.round(state.black * 100)));
  knobBlack.setAttribute("aria-valuetext", `Zone ${ROMAN[info.zLo]} ${info.darkHex}`);
  knobMid.setAttribute("aria-valuenow", String(info.lightPct));
  knobMid.setAttribute("aria-valuetext", `${info.keyName}，亮部占比 ${info.lightPct}%`);
  knobWhite.setAttribute("aria-valuenow", String(Math.round(state.white * 100)));
  knobWhite.setAttribute("aria-valuetext", `Zone ${ROMAN[info.zHi]} ${info.lightHex}`);

  $("btn-dot").setAttribute("aria-pressed", String(state.dot));

  document.querySelectorAll(".pill-btn[data-preset]").forEach((btn) => {
    const p = PRESETS.find((x) => x.id === btn.dataset.preset);
    if (!p) return;
    const matched = Math.abs(state.black - p.black) < 0.025 && Math.abs(state.white - p.white) < 0.025 && Math.abs(state.key - p.key) < 0.035;
    btn.setAttribute("aria-pressed", String(matched));
  });
}

const view = loop(stage, (t, dt, { still }) => {
  if (still) {
    shown.black = state.black;
    shown.white = state.white;
    shown.key = state.key;
    shown.openK = 1;
    opened = true;
    paintLevels(state);
    updateReadout();
    renderer.render(state, 1);
    dirty = false;
    readoutDirty = false;
    return;
  }

  let moving = false;
  if (!opened) {
    // 0.85 秒开场：从灰雾平稳推开黑场与白场至完整海报对比
    const p = clamp(t / 0.85, 0, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    shown.openK = 0.62 + 0.38 * ease;
    if (!activeDrag) {
      shown.black = lerp(0.34, state.black, ease);
      shown.white = lerp(0.64, state.white, ease);
      shown.key = state.key;
    }
    moving = true;
    if (p >= 1) opened = true;
  } else if (activeDrag) {
    shown.black = state.black;
    shown.white = state.white;
    shown.key = state.key;
  } else {
    const k = dt ? 1 - Math.exp(-dt * 14) : 1;
    const db = state.black - shown.black;
    const dw = state.white - shown.white;
    const dk = state.key - shown.key;
    if (Math.abs(db) > 0.0005 || Math.abs(dw) > 0.0005 || Math.abs(dk) > 0.0005) {
      shown.black += db * k;
      shown.white += dw * k;
      shown.key += dk * k;
      moving = true;
    } else {
      shown.black = state.black;
      shown.white = state.white;
      shown.key = state.key;
    }
  }

  if (dirty || moving) {
    const cur = { ...state, black: shown.black, white: shown.white, key: shown.key };
    paintLevels(cur);
    if (readoutDirty) {
      updateReadout();
      readoutDirty = false;
    }
    renderer.render(cur, shown.openK);
    dirty = false;
  }
});

function resize() {
  const r = stage.getBoundingClientRect();
  const w = Math.round(r.width);
  const h = Math.round(r.height);
  if (w < 1 || h < 1) return;
  renderer.resize(w, h);
  dirty = true;
  view.draw();
}
new ResizeObserver(resize).observe(stage);

function applyLevels(nextBlack, nextWhite, nextKey) {
  opened = true;
  shown.openK = 1;
  const clamped = clampLevels(nextBlack, nextWhite, nextKey);
  state.black = clamped.black;
  state.white = clamped.white;
  state.key = clamped.key;
  dirty = true;
  readoutDirty = true;
  if (reducedMotion.matches) view.draw();
}

function setFromTrackPos(which, f, doSnap = false) {
  const cf = clamp(f, 0, 1);
  if (which === "black") {
    let v = Math.min(cf, state.white - MIN_GAP);
    if (doSnap) v = Math.min(snapHandle("black", v), state.white - MIN_GAP);
    applyLevels(v, state.white, state.key);
  } else if (which === "white") {
    let v = Math.max(cf, state.black + MIN_GAP);
    if (doSnap) v = Math.max(snapHandle("white", v), state.black + MIN_GAP);
    applyLevels(state.black, v, state.key);
  } else {
    const span = Math.max(MIN_GAP, state.white - state.black);
    let k = clamp((cf - state.black) / span, 0.12, 0.88);
    if (doSnap) k = clamp(snapHandle("key", k), 0.12, 0.88);
    applyLevels(state.black, state.white, k);
  }
}

// 绑定三个暗房色阶拨钳：pointermove/pointerup 挂在 window 上，鼠标高速甩动与触屏拖拽都稳不脱手
function bindKnob(el, which) {
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    el.focus({ preventScroll: true });
    [knobBlack, knobMid, knobWhite].forEach((k) => k.classList.remove("is-front"));
    el.classList.add("is-front", "is-dragging");
    track.classList.add("is-dragging");
    readout.setAttribute("aria-live", "off");
    activeDrag = { which, el, pointerId: e.pointerId, rect: track.getBoundingClientRect() };
    opened = true;
    shown.openK = 1;
  });

  // 标准 slider 键盘操控（方向键微调，Shift 精细调节）
  el.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.015 : 0.04;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      if (which === "black") applyLevels(Math.min(state.black - step, state.white - MIN_GAP), state.white, state.key);
      else if (which === "white") applyLevels(state.black, Math.max(state.white - step, state.black + MIN_GAP), state.key);
      else applyLevels(state.black, state.white, state.key - step);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (which === "black") applyLevels(Math.min(state.black + step, state.white - MIN_GAP), state.white, state.key);
      else if (which === "white") applyLevels(state.black, Math.max(state.white + step, state.black + MIN_GAP), state.key);
      else applyLevels(state.black, state.white, state.key + step);
    }
  });
}

bindKnob(knobBlack, "black");
bindKnob(knobMid, "mid");
bindKnob(knobWhite, "white");

// 舞台本体仅接受横向轻扫（CSS touch-action: pan-y，触屏竖滑页面绝不卡顿）
stage.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  activeDrag = {
    which: "stage",
    el: stage,
    pointerId: e.pointerId,
    rect: stage.getBoundingClientRect(),
    startX: e.clientX,
    startY: e.clientY,
    startKey: state.key,
    locked: false,
  };
});

window.addEventListener("pointermove", (e) => {
  if (!activeDrag || activeDrag.pointerId !== e.pointerId) return;
  if (activeDrag.which === "stage") {
    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;
    if (!activeDrag.locked) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        activeDrag = null;
        return;
      }
      if (Math.abs(dx) < 6) return;
      activeDrag.locked = true;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {}
      stage.classList.add("is-dragging");
      readout.setAttribute("aria-live", "off");
    }
    const delta = dx / Math.max(activeDrag.rect.width * 0.72, 220);
    applyLevels(state.black, state.white, clamp(activeDrag.startKey + delta, 0.12, 0.88));
    return;
  }
  const f = posFromClientX(e.clientX, activeDrag.rect);
  setFromTrackPos(activeDrag.which, f, false);
});

const finishAnyDrag = (e) => {
  if (!activeDrag || activeDrag.pointerId !== e.pointerId) return;
  const drag = activeDrag;
  activeDrag = null;
  readout.setAttribute("aria-live", "polite");
  if (drag.which === "stage") {
    stage.classList.remove("is-dragging");
    if (drag.locked) applyLevels(state.black, state.white, snapHandle("key", state.key));
    return;
  }
  drag.el.classList.remove("is-dragging");
  track.classList.remove("is-dragging");
  suppressTrackClick = true;
  setTimeout(() => {
    suppressTrackClick = false;
  }, 40);
  const f = posFromClientX(e.clientX, drag.rect);
  setFromTrackPos(drag.which, f, true);
};
window.addEventListener("pointerup", finishAnyDrag);
window.addEventListener("pointercancel", finishAnyDrag);

// 点击色阶轨道空白处，将最近的拨钳平滑移过去
track.addEventListener("click", (e) => {
  if (suppressTrackClick || e.target.closest(".lv-knob")) return;
  const r = track.getBoundingClientRect();
  const f = posFromClientX(e.clientX, r);
  const midPos = lerp(state.black, state.white, state.key);
  const dists = [
    ["black", Math.abs(f - state.black)],
    ["mid", Math.abs(f - midPos)],
    ["white", Math.abs(f - state.white)],
  ].sort((a, b) => a[1] - b[1]);
  setFromTrackPos(dists[0][0], f, true);
});

// 快捷预设、题材、阶调、红点与复位
document.querySelectorAll(".pill-btn[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS.find((x) => x.id === btn.dataset.preset);
    if (p) applyLevels(p.black, p.white, p.key);
  });
});

document.querySelectorAll('input[name="hero-scene"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    state.scene = input.value;
    dirty = true;
    readoutDirty = true;
    view.draw();
  });
});

document.querySelectorAll('input[name="hero-grad"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    state.gradation = input.value;
    dirty = true;
    readoutDirty = true;
    view.draw();
  });
});

$("btn-dot").addEventListener("click", () => {
  state.dot = !state.dot;
  dirty = true;
  readoutDirty = true;
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
  applyLevels(DEFAULT_PRESET.black, DEFAULT_PRESET.white, DEFAULT_PRESET.key);
});

updateReadout();
paintLevels(shown);
resize();
initLabs();
