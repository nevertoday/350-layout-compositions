// 101 色彩对比 · 主入口（原海报对称六维控件 + 0–180° 色相轨 + 面积分缝 + 抽成灰度）

import { reducedMotion } from "../../lib/stage.js";
import { AXIS_PRESETS, bestInkOn, clamp, computeHeroColors, describeHero, MOOD_MODES, snapDelta } from "./color.js";
import { createHero } from "./hero.js";
import { initAlbersLab, initAreaLab, initCvdLab, initLightbox, initQuiz, initReveal, initSixLab, initTempLab } from "./labs.js";

const $ = (id) => document.getElementById(id);
if (!reducedMotion.matches) document.documentElement.classList.add("motion");

const state = {
  axis: "complementary",
  delta: 180,
  satLeft: 90,
  satRight: 92,
  lumSpread: 0,
  ratio: 50,
  mood: "calm",
  gray: false,
  userMoved: false,
};

const board = $("poster-board");
const leaderSvg = $("leader-svg");
const stage = $("stage");
const canvas = $("hero-canvas");
const hueHandle = $("hero-handle");
const splitHandle = $("split-handle");
const grayBtn = $("hero-gray");
const grayLbl = $("hero-gray-lbl");
const titleDui = $("title-dui");
const titleBi = $("title-bi");

const satLeftRange = $("ctrl-sat-left");
const lumRange = $("ctrl-lum");
const ratioRange = $("ctrl-ratio");

const desktopMQ = matchMedia("(min-width: 1080px)");

let geom = {
  hueX: 300,
  ty: 360,
  x0: 40,
  x1: 300,
  splitX: 170,
  barY: 260,
  cx: 170,
  cy: 170,
  R: 110,
  orbitR: 136,
};

let sixLab = null;

// 桌面端画出原海报 6 条镜像对称虚线折线引线（连接等高齐平的左右 6 条标注与中央大圆外圈虚线环）
const LEADER_ANGLES = {
  warmcool: -Math.PI * 0.78,
  complementary: Math.PI,
  saturation: Math.PI * 0.78,
  brightness: -Math.PI * 0.22,
  proportion: 0,
  mood: Math.PI * 0.22,
};

function drawLeaders() {
  if (!desktopMQ.matches) {
    leaderSvg.innerHTML = "";
    return;
  }
  const br = board.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  if (!br.width || !sr.width) return;

  const cx = sr.left - br.left + geom.cx;
  const cy = sr.top - br.top + geom.cy;
  const or = geom.orbitR;

  const parts = [];
  board.querySelectorAll(".callout").forEach((card) => {
    const axis = card.dataset.axis;
    const side = card.dataset.side;
    const btn = card.querySelector(".callout-btn");
    if (!btn) return;
    const cr = btn.getBoundingClientRect();
    const isActive = axis === state.axis;

    const sy = cr.top - br.top + 38;
    const sx = side === "left" ? cr.right - br.left + 8 : cr.left - br.left - 8;
    const ang = LEADER_ANGLES[axis];
    const tx = cx + Math.cos(ang) * or;
    const ty = cy + Math.sin(ang) * or;

    let d;
    if (axis === "complementary" || axis === "proportion") {
      if (Math.abs(sy - ty) <= 22) {
        d = `M ${sx.toFixed(1)} ${ty.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)}`;
      } else {
        const mx = side === "left" ? Math.min(sx + 48, tx - 28) : Math.max(sx - 48, tx + 28);
        d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${mx.toFixed(1)} ${sy.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)}`;
      }
    } else {
      const dy = Math.abs(ty - sy);
      const kx =
        side === "left"
          ? clamp(tx - dy * 0.85, sx + 18, tx - 18)
          : clamp(tx + dy * 0.85, tx + 18, sx - 18);
      d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${kx.toFixed(1)} ${sy.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)}`;
    }

    const stroke = isActive ? "#10100e" : "rgba(16, 16, 14, 0.36)";
    const sw = isActive ? "1.6" : "1";
    const dash = isActive ? "5 3" : "3 3";
    parts.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${dash}"/>`);
    parts.push(
      `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${isActive ? 4 : 2.6}" fill="${isActive ? "#10100e" : "rgba(16, 16, 14, 0.44)"}"/>`
    );
  });

  leaderSvg.innerHTML = parts.join("");
}

const hero = createHero(canvas, stage, state, (g) => {
  geom = g;
  hueHandle.style.transform = `translate3d(${g.hueX.toFixed(1)}px, ${g.ty.toFixed(1)}px, 0) translate(-50%, -50%)`;
  hueHandle.style.setProperty("--h-col", g.colB);
  hueHandle.style.setProperty("--h-ink", g.inkB);
  splitHandle.style.transform = `translate3d(${g.splitX.toFixed(1)}px, ${g.barY.toFixed(1)}px, 0) translate(-50%, -50%)`;
  drawLeaders();
});

let lastPanelSync = 0;

function syncUI(draggingFast = false) {
  const colors = computeHeroColors(state);

  if (draggingFast) {
    hero.draw();
    const now = performance.now();
    if (now - lastPanelSync < 95) return;
    lastPanelSync = now;
  } else {
    lastPanelSync = performance.now();
  }

  const info = describeHero(state, colors);
  const meta = AXIS_PRESETS[state.axis] || AXIS_PRESETS.complementary;

  // 标题本身就是示范：「对」「比」实时跟随左右色值（包含抽成灰度）
  titleDui.style.backgroundColor = colors.dispHexA;
  titleDui.style.color = bestInkOn(colors.dispRgbA);
  titleBi.style.backgroundColor = colors.dispHexB;
  titleBi.style.color = bestInkOn(colors.dispRgbB);

  // 六条标注选中状态
  board.querySelectorAll(".callout").forEach((card) => {
    const on = card.dataset.axis === state.axis;
    card.classList.toggle("on", on);
    const btn = card.querySelector(".callout-btn");
    if (btn) btn.setAttribute("aria-pressed", String(on));
  });

  // 色样条与醒目明度对比度读数
  $("sw-a").style.background = colors.dispHexA;
  $("sw-a-hex").textContent = colors.dispHexA.toUpperCase();
  $("sw-b").style.background = colors.dispHexB;
  $("sw-b-hex").textContent = colors.dispHexB.toUpperCase();
  $("hero-cr").textContent = `亮度 ${colors.lumRatio.toFixed(2)}:1`;
  const crTag = $("hero-cr-tag");
  crTag.textContent = info.crTag;
  crTag.dataset.kind = info.crKind;

  // 抽成灰度开关状态
  grayBtn.classList.toggle("on", state.gray);
  grayBtn.setAttribute("aria-pressed", String(state.gray));
  grayLbl.textContent = state.gray ? "恢复彩色" : "抽成灰度";

  // 下方通栏读数与「为什么」说明
  $("dock-axis-tag").textContent = `${meta.zh} · ${meta.en}`;
  $("dock-motto").textContent = meta.motto;
  $("dock-metric").textContent = info.metric;
  const dockBadge = $("dock-badge");
  dockBadge.textContent = info.badge;
  dockBadge.dataset.kind = info.kind;
  $("dock-why").textContent = info.why;

  // 仅在需要二次微调的标注下显露对应的单个行内控件，绝不重复色相滑块
  $("dock-ctrl-sat").hidden = state.axis !== "saturation";
  $("dock-ctrl-bright").hidden = state.axis !== "brightness";
  $("dock-ctrl-area").hidden = state.axis !== "proportion";
  $("dock-ctrl-mood").hidden = state.axis !== "mood";

  satLeftRange.value = String(Math.round(state.satLeft));
  $("out-sat-left").textContent = `${Math.round(state.satLeft)}%`;
  lumRange.value = String(Math.round(state.lumSpread));
  $("out-lum").textContent = `${Math.round(state.lumSpread)}%`;
  ratioRange.value = String(Math.round(state.ratio));
  $("out-ratio").textContent = `${Math.round(state.ratio)}:${100 - Math.round(state.ratio)}`;

  document.querySelectorAll(".mood-chip").forEach((chip) => {
    const on = chip.dataset.mood === state.mood;
    chip.classList.toggle("on", on);
    chip.setAttribute("aria-pressed", String(on));
  });

  // 无障碍读数
  hueHandle.setAttribute("aria-valuenow", String(Math.round(state.delta)));
  hueHandle.setAttribute(
    "aria-label",
    `0 到 180 度色相夹角手柄：当前 ${colors.sep} 度，亮度对比 ${colors.lumRatio.toFixed(2)} 比 1。左右拖动或按方向键调节。`
  );
  splitHandle.setAttribute("aria-valuenow", String(Math.round(state.ratio)));
  splitHandle.setAttribute(
    "aria-label",
    `左右面积分缝手柄：当前冷色 ${Math.round(state.ratio)}% 比暖色 ${100 - Math.round(state.ratio)}%。左右拖动或按方向键调节主次。`
  );

  hero.draw();
  requestAnimationFrame(drawLeaders);
}

function selectAxis(axis) {
  const p = AXIS_PRESETS[axis];
  if (!p) return;
  state.userMoved = true;
  state.axis = axis;
  state.delta = p.delta;
  state.satLeft = p.satLeft;
  state.satRight = p.satRight;
  state.lumSpread = p.lumSpread;
  state.ratio = p.ratio;
  if (axis === "mood") state.mood = "calm";
  if (sixLab) sixLab.setDim(axis);
  syncUI();
}

function setDelta(raw, useSnap = true, draggingFast = false) {
  const d = useSnap ? snapDelta(raw).delta : clamp(raw, 0, 180);
  if (!useSnap && state.userMoved && Math.abs(d - state.delta) < 0.05) return;
  state.userMoved = true;
  state.delta = d;
  if (state.axis !== "complementary" && state.axis !== "warmcool" && state.axis !== "brightness") {
    state.axis = "complementary";
  }
  syncUI(draggingFast);
}

function setRatio(raw, draggingFast = false) {
  const r = clamp(Math.round(raw), 15, 85);
  if (draggingFast && state.userMoved && r === state.ratio && state.axis === "proportion") return;
  state.userMoved = true;
  state.axis = "proportion";
  state.ratio = r;
  syncUI(draggingFast);
}

// 1) 六条原海报标注即控件
board.querySelectorAll(".callout-btn").forEach((btn) => {
  btn.addEventListener("click", () => selectAxis(btn.dataset.axis));
});

// 2) 抽成灰度开关
grayBtn.addEventListener("click", () => {
  state.userMoved = true;
  state.gray = !state.gray;
  syncUI();
});

// 3) 行内专属控件（饱和 / 明度 / 面积 / 情绪）
satLeftRange.addEventListener("input", () => {
  state.userMoved = true;
  state.axis = "saturation";
  state.satLeft = +satLeftRange.value;
  syncUI();
});

lumRange.addEventListener("input", () => {
  state.userMoved = true;
  state.axis = "brightness";
  state.lumSpread = +lumRange.value;
  syncUI();
});

ratioRange.addEventListener("input", () => {
  setRatio(+ratioRange.value, false);
});

document.querySelectorAll(".mood-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const m = MOOD_MODES[chip.dataset.mood];
    if (!m) return;
    state.userMoved = true;
    state.axis = "mood";
    state.mood = m.id;
    state.delta = m.delta;
    state.satLeft = m.satLeft;
    state.satRight = m.satRight;
    state.lumSpread = m.lumSpread;
    state.ratio = m.ratio;
    syncUI();
  });
});

// 4) 底部 0–180° 色相夹角手柄拖动 + 键盘微调
let hueDrag = null;
function deltaFromClientX(clientX, rect) {
  const r = rect || stage.getBoundingClientRect();
  const lx = clientX - r.left;
  const span = Math.max(40, geom.x1 - geom.x0);
  return ((lx - geom.x0) / span) * 180;
}

hueHandle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  hueHandle.setPointerCapture(e.pointerId);
  hueHandle.focus({ preventScroll: true });
  const rect = stage.getBoundingClientRect();
  hueDrag = { id: e.pointerId, rect };
  setDelta(deltaFromClientX(e.clientX, rect), false, true);
});
hueHandle.addEventListener("pointermove", (e) => {
  if (!hueDrag || e.pointerId !== hueDrag.id) return;
  setDelta(deltaFromClientX(e.clientX, hueDrag.rect), false, true);
});
const endHueDrag = (e) => {
  if (!hueDrag || e.pointerId !== hueDrag.id) return;
  hueDrag = null;
  setDelta(state.delta, true, false);
};
hueHandle.addEventListener("pointerup", endHueDrag);
hueHandle.addEventListener("pointercancel", endHueDrag);

hueHandle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 15 : 5;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setDelta(state.delta - step, false);
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setDelta(state.delta + step, false);
  }
});

// 5) 圆内竖向面积分缝手柄拖动 + 键盘微调（标有 data-perf-drag，位于屏幕正中，左右对称拖拉）
let splitDrag = null;
function ratioFromClientX(clientX, rect) {
  const r = rect || stage.getBoundingClientRect();
  const lx = clientX - r.left;
  const span = Math.max(60, geom.R * 2);
  return ((lx - (geom.cx - geom.R)) / span) * 100;
}

splitHandle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  splitHandle.setPointerCapture(e.pointerId);
  splitHandle.focus({ preventScroll: true });
  const rect = stage.getBoundingClientRect();
  splitDrag = { id: e.pointerId, rect };
  setRatio(ratioFromClientX(e.clientX, rect), true);
});
splitHandle.addEventListener("pointermove", (e) => {
  if (!splitDrag || e.pointerId !== splitDrag.id) return;
  setRatio(ratioFromClientX(e.clientX, splitDrag.rect), true);
});
const endSplitDrag = (e) => {
  if (!splitDrag || e.pointerId !== splitDrag.id) return;
  splitDrag = null;
  syncUI(false);
};
splitHandle.addEventListener("pointerup", endSplitDrag);
splitHandle.addEventListener("pointercancel", endSplitDrag);

splitHandle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 10 : 4;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setRatio(state.ratio - step, false);
  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setRatio(state.ratio + step, false);
  }
});

// 6) 点击画布底部 0–180° 轨道或外圈上半虚线弧，直接落位色相夹角
canvas.addEventListener("pointerdown", (e) => {
  const r = stage.getBoundingClientRect();
  const lx = e.clientX - r.left;
  const ly = e.clientY - r.top;
  if (Math.abs(ly - geom.ty) < 32) {
    setDelta(deltaFromClientX(e.clientX, r), true);
    return;
  }
  const dist = Math.hypot(lx - geom.cx, ly - geom.cy);
  if (dist >= geom.orbitR * 0.72 && dist <= geom.orbitR * 1.32 && ly <= geom.cy + 14) {
    const ang = Math.atan2(ly - geom.cy, lx - geom.cx); // -PI..0
    const deg = clamp(((ang + Math.PI) / Math.PI) * 180, 0, 180);
    setDelta(deg, true);
  }
});

desktopMQ.addEventListener("change", () => {
  drawLeaders();
});
new ResizeObserver(() => drawLeaders()).observe(board);

sixLab = initSixLab();
sixLab.setDim(state.axis);
syncUI();
initAlbersLab();
initTempLab();
initAreaLab();
initCvdLab();
initQuiz();
initLightbox();
initReveal();
