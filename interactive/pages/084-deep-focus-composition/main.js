import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  APERTURE_STOPS,
  INITIAL_STATE,
  PRESETS,
  QUIZ_QUESTIONS,
  applyStepFix,
  clamp,
  evaluate,
  focusToNorm,
  formatDist,
  hyperfocalM,
  normToFocus,
} from "./model.js";
import {
  renderClutterSplitCanvas,
  renderLayerPeelCanvas,
  renderMainStage,
  renderMiniDeepFocus,
  renderOpticsLabCanvas,
} from "./scene.js";

// ==================== 1. 主舞台状态与交互 ====================
let state = { ...INITIAL_STATE };
let dirty = true;
let pulsePhase = 0;

const heroCanvas = document.getElementById("hero-canvas");
const statusPill = document.getElementById("hero-status-pill");
const diagCard = document.getElementById("diag-card");
const diagHeadline = document.getElementById("diag-headline");
const diagReason = document.getElementById("diag-reason");
const diagHint = document.getElementById("diag-hint");
const btnStepFix = document.getElementById("btn-step-fix");
const mHyper = document.getElementById("m-hyper");
const mFgBlur = document.getElementById("m-fg-blur");
const mOcc = document.getElementById("m-occ");
const mAiry = document.getElementById("m-airy");
const valFocal = document.getElementById("val-focal");
const valAperture = document.getElementById("val-aperture");
const valFocus = document.getElementById("val-focus");
const valTone = document.getElementById("val-tone");
const slAperture = document.getElementById("sl-aperture");
const slFocus = document.getElementById("sl-focus");
const slTone = document.getElementById("sl-tone");
const btnHyperfocal = document.getElementById("btn-hyperfocal");
const btnFgToggle = document.getElementById("btn-fg-toggle");
const btnGuides = document.getElementById("btn-guides");
const rulerSummary = document.getElementById("ruler-summary");
const rulerZone = document.getElementById("ruler-zone");
const pinHyper = document.getElementById("pin-hyper");
const pinFocus = document.getElementById("pin-focus");
const checkScore = document.getElementById("check-score");

function nearestApertureIdx(ap) {
  let best = 0;
  let dist = Infinity;
  APERTURE_STOPS.forEach((v, i) => {
    const d = Math.abs(v - ap);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

const setTxt = (el, v) => {
  const s = String(v);
  if (el && el.textContent !== s) el.textContent = s;
};

function syncUI(ev) {
  // 顶栏状态徽章
  setTxt(statusPill, ev.diagnosis.shortStatus);
  statusPill.classList.toggle("is-ok", ev.allPass);
  statusPill.classList.toggle("is-warn", !ev.allPass);

  // 顶部四枚原海报圆徽
  document.querySelectorAll(".medallion").forEach((el) => {
    const key = el.dataset.badge;
    el.classList.toggle("is-lit", !!ev.badges[key]);
  });

  // 左侧三景引出栏实测芯片
  const chipBg = document.getElementById("chip-bg");
  const chipMg = document.getElementById("chip-mg");
  const chipFg = document.getElementById("chip-fg");
  setTxt(
    chipBg,
    ev.diffractionFail
      ? "衍射软"
      : ev.planes.bg.sharp
        ? `清晰 ${ev.planes.bg.opt.total.toFixed(3)}mm`
        : `失焦 ${ev.planes.bg.opt.total.toFixed(3)}mm`,
  );
  chipBg.classList.toggle("is-ok", ev.planes.bg.sharp);

  setTxt(
    chipMg,
    ev.geo.occlusionPct > 14
      ? `被遮 ${ev.geo.occlusionPct}%`
      : ev.diffractionFail
        ? "衍射软"
        : ev.planes.mg.sharp
          ? `清晰 ${ev.planes.mg.opt.total.toFixed(3)}mm`
          : `失焦 ${ev.planes.mg.opt.total.toFixed(3)}mm`,
  );
  chipMg.classList.toggle("is-ok", ev.planes.mg.sharp && ev.geo.occlusionPct <= 14);

  setTxt(
    chipFg,
    !state.fgEnabled
      ? "已撤空"
      : ev.diffractionFail
        ? "衍射软"
        : ev.planes.fg.sharp
          ? `清晰 ${ev.planes.fg.opt.total.toFixed(3)}mm`
          : `失焦 ${ev.planes.fg.opt.total.toFixed(3)}mm`,
  );
  chipFg.classList.toggle("is-ok", ev.planes.fg.sharp);

  document.querySelectorAll(".plane-row").forEach((btn) => {
    const active = btn.dataset.plane === state.activePlane;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  // 场景与显示模式按钮
  document.querySelectorAll("[data-scene]").forEach((b) => b.classList.toggle("is-active", b.dataset.scene === state.scene));
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("is-active", b.dataset.view === state.viewMode));
  setTxt(btnGuides, state.showGuides ? "引出线：开" : "引出线：关");
  btnGuides.setAttribute("aria-pressed", state.showGuides ? "true" : "false");

  // 景深标尺
  setTxt(rulerSummary, `合焦 ${formatDist(state.focusM)} · 清晰带 ${formatDist(ev.dof.near)} – ${formatDist(ev.dof.far)} · 超焦距 H ${ev.dof.H.toFixed(2)} m`);
  const nearPct = `${(focusToNorm(ev.dof.near) * 100).toFixed(1)}%`;
  const farW = `${Math.max(1.2, (ev.dof.far === Infinity ? 100 : focusToNorm(ev.dof.far) * 100) - focusToNorm(ev.dof.near) * 100).toFixed(1)}%`;
  if (rulerZone.style.left !== nearPct) rulerZone.style.left = nearPct;
  if (rulerZone.style.width !== farW) rulerZone.style.width = farW;
  rulerZone.classList.toggle("is-diff", ev.diffractionFail);
  const hLeft = `${clamp(focusToNorm(ev.dof.H) * 100, 2, 98).toFixed(1)}%`;
  const fLeft = `${clamp(focusToNorm(state.focusM) * 100, 2, 98).toFixed(1)}%`;
  if (pinHyper.style.left !== hLeft) pinHyper.style.left = hLeft;
  if (pinFocus.style.left !== fLeft) pinFocus.style.left = fLeft;

  // 诊单与读数
  diagCard.classList.toggle("is-pass", ev.allPass);
  setTxt(diagHeadline, ev.diagnosis.headline);
  setTxt(diagReason, ev.diagnosis.reason);
  setTxt(diagHint, ev.diagnosis.actionHint);
  setTxt(btnStepFix, ev.diagnosis.fixLabel);

  setTxt(mHyper, `${ev.dof.H.toFixed(2)} m`);
  setTxt(mFgBlur, state.fgEnabled ? `${ev.planes.fg.opt.total.toFixed(3)} mm` : "前景缺位");
  setTxt(mOcc, `${ev.geo.occlusionPct}%`);
  setTxt(mAiry, `${Math.round(ev.airy * 1000)} μm`);

  // 控件同步
  setTxt(valFocal, `${state.focalMm} mm`);
  document.querySelectorAll("[data-focal]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.focal) === state.focalMm));
  const apIdx = String(nearestApertureIdx(state.aperture));
  if (slAperture.value !== apIdx) slAperture.value = apIdx;
  const evSign = ev.evCost > 0 ? `+${ev.evCost}` : `${ev.evCost}`;
  setTxt(valAperture, `f/${state.aperture} · ${evSign} EV`);
  const fNorm = String(Math.round(focusToNorm(state.focusM) * 200) / 2);
  if (slFocus.value !== fNorm) slFocus.value = fNorm;
  setTxt(valFocus, formatDist(state.focusM));
  const toneStr = String(Math.round(state.toneSep * 100));
  if (slTone.value !== toneStr) slTone.value = toneStr;
  setTxt(valTone, `${toneStr}%`);
  setTxt(btnFgToggle, state.fgEnabled ? "前景锚点：开" : "前景锚点：关");
  btnFgToggle.classList.toggle("is-on", state.fgEnabled);
  btnFgToggle.setAttribute("aria-pressed", state.fgEnabled ? "true" : "false");

  // 右侧 5 项快速检查清单
  setTxt(checkScore, `${ev.passCount} / 5`);
  ev.checklist.forEach((item) => {
    const li = document.querySelector(`#check-list li[data-check="${item.id}"]`);
    if (!li) return;
    li.classList.toggle("is-ok", item.ok);
    const v = li.querySelector(".chk-val");
    setTxt(v, item.tag);
  });
}

let lastEval = evaluate(state);
syncUI(lastEval);

// 拖拽期间合并至每帧最多一次绘制 + 移动端像素比上限 1.5（确保软件渲染慢手机也稳定 ≥50fps）
const stageDpr = () => (window.innerWidth <= 680 ? pixelRatio(1.5) : pixelRatio(2));
let uiDirty = false;
let pendingFrame = 0;

function flushVisualFrame(pulse = 0) {
  lastEval = evaluate(state);
  if (uiDirty) {
    syncUI(lastEval);
    uiDirty = false;
  }
  renderMainStage(heroCanvas, state, lastEval, { dpr: stageDpr(), pulse });
  dirty = false;
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const animateIntro = !still && t < 1.6;
  if (!dirty && !animateIntro) return;
  pulsePhase = animateIntro ? 0.5 + 0.5 * Math.sin(t * 4.5) : 0;
  flushVisualFrame(pulsePhase);
});

function setState(patch, { coalesce = false } = {}) {
  state = { ...state, ...patch };
  dirty = true;
  uiDirty = true;
  if (coalesce) {
    if (!pendingFrame) {
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        if (dirty) flushVisualFrame(0);
      });
    }
    return;
  }
  lastEval = evaluate(state);
  syncUI(lastEval);
  uiDirty = false;
  heroLoop.draw();
}

// 直接在画布上拖移前景/中景/远景（兼容鼠标与触屏横向拖拽，保持页面竖向滚动畅通；严禁 pointer+touch 双重触发）
let dragInfo = null;
function pickPlaneByY(normY) {
  if (state.viewMode === "split") {
    if (normY < 0.33) return "bg";
    if (normY < 0.66) return "mg";
    return "fg";
  }
  if (normY < 0.38) return "bg";
  if (normY < 0.64) return "mg";
  return state.fgEnabled ? "fg" : "mg";
}

function getPlaneOffset(plane) {
  if (plane === "bg") return state.bgOffset;
  if (plane === "mg") return state.mgOffset;
  return state.fgOffset;
}

function setPlaneOffset(plane, val, opts = {}) {
  if (plane === "bg") setState({ bgOffset: clamp(+val.toFixed(3), -0.24, 0.24), activePlane: "bg" }, opts);
  else if (plane === "mg") setState({ mgOffset: clamp(+val.toFixed(3), -0.26, 0.26), activePlane: "mg" }, opts);
  else setState({ fgOffset: clamp(+val.toFixed(3), -0.30, 0.30), activePlane: "fg" }, opts);
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return; // 触屏交由下方 touch 事件统一处理，避免每帧重画两次
  const r = heroCanvas.getBoundingClientRect();
  const normY = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1);
  const plane = pickPlaneByY(normY);
  dragInfo = {
    id: e.pointerId,
    plane,
    startX: e.clientX,
    startVal: getPlaneOffset(plane),
    width: Math.max(120, r.width),
  };
  heroCanvas.setPointerCapture(e.pointerId);
  if (state.activePlane !== plane) setState({ activePlane: plane });
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || dragInfo.id !== e.pointerId) return;
  const dx = e.clientX - dragInfo.startX;
  setPlaneOffset(dragInfo.plane, dragInfo.startVal + dx / dragInfo.width, { coalesce: true });
});

const endHeroDrag = (e) => {
  if (dragInfo && dragInfo.id === e.pointerId) dragInfo = null;
};
heroCanvas.addEventListener("pointerup", endHeroDrag);
heroCanvas.addEventListener("pointercancel", endHeroDrag);

// 触屏拖拽（含 perf.mjs 的 touch 事件），横向拖景层、纵向自然滚页，合帧渲染保证 60fps
let touchDrag = null;
heroCanvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  const r = heroCanvas.getBoundingClientRect();
  const normY = clamp((t.clientY - r.top) / Math.max(1, r.height), 0, 1);
  const plane = pickPlaneByY(normY);
  touchDrag = {
    plane,
    startX: t.clientX,
    startY: t.clientY,
    startVal: getPlaneOffset(plane),
    width: Math.max(120, r.width),
    locked: false,
  };
}, { passive: true });

heroCanvas.addEventListener("touchmove", (e) => {
  if (!touchDrag || e.touches.length !== 1) return;
  const t = e.touches[0];
  const dx = t.clientX - touchDrag.startX;
  const dy = t.clientY - touchDrag.startY;
  if (!touchDrag.locked) {
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    if (Math.abs(dy) > Math.abs(dx) * 1.35) {
      touchDrag = null;
      return;
    }
    touchDrag.locked = true;
  }
  setPlaneOffset(touchDrag.plane, touchDrag.startVal + dx / touchDrag.width, { coalesce: true });
}, { passive: true });

heroCanvas.addEventListener("touchend", () => {
  touchDrag = null;
  if (uiDirty || dirty) flushVisualFrame(0);
}, { passive: true });

// 键盘操作主画布：←/→ 移当前景层、↑/↓ 调光圈、空格切剖片
heroCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 0.04 : -0.04;
    setPlaneOffset(state.activePlane, getPlaneOffset(state.activePlane) + step);
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const cur = nearestApertureIdx(state.aperture);
    const next = clamp(cur + (e.key === "ArrowUp" ? 1 : -1), 0, APERTURE_STOPS.length - 1);
    setState({ aperture: APERTURE_STOPS[next] });
  } else if (e.key === " ") {
    e.preventDefault();
    setState({ viewMode: state.viewMode === "unified" ? "split" : "unified" });
  }
});

// 绑定主舞台控件
document.querySelectorAll(".plane-row").forEach((btn) => {
  btn.addEventListener("click", () => setState({ activePlane: btn.dataset.plane }));
});
document.querySelectorAll("[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ scene: btn.dataset.scene }));
});
document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ viewMode: btn.dataset.view }));
});
btnGuides.addEventListener("click", () => setState({ showGuides: !state.showGuides }));
btnStepFix.addEventListener("click", () => setState(applyStepFix(state, lastEval)));

document.querySelectorAll("[data-focal]").forEach((btn) => {
  btn.addEventListener("click", () => setState({ focalMm: Number(btn.dataset.focal) }));
});
slAperture.addEventListener("input", () => {
  const ap = APERTURE_STOPS[Number(slAperture.value)] ?? 11;
  setState({ aperture: ap });
});
slFocus.addEventListener("input", () => {
  setState({ focusM: normToFocus(Number(slFocus.value) / 100) });
});
btnHyperfocal.addEventListener("click", () => {
  const H = hyperfocalM(state.focalMm, state.aperture);
  setState({ focusM: clamp(+(H * 1.03).toFixed(2), 0.6, 120) });
});
slTone.addEventListener("input", () => {
  setState({ toneSep: Number(slTone.value) / 100 });
});
btnFgToggle.addEventListener("click", () => setState({ fgEnabled: !state.fgEnabled }));

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (p) setState({ ...p.patch, scene: state.scene });
  });
});

// ==================== 2. 第 01 节：三层剥离演示 ====================
const peelCanvas = document.getElementById("peel-canvas");
const peelBadge = document.getElementById("peel-badge");
const peelReadout = document.getElementById("peel-readout");
const peelFlags = { fg: true, mg: true, bg: true };

function drawPeel() {
  renderLayerPeelCanvas(peelCanvas, peelFlags);
  const { fg, mg, bg } = peelFlags;
  const n = [fg, mg, bg].filter(Boolean).length;
  if (n === 3) {
    peelBadge.textContent = "三层完整";
    peelReadout.textContent = "三层齐全时，视线顺着脚下花径踏上中景石桥，再越过湖面望向雪峰，画面立刻生出可步入的立体纵深。";
  } else if (!fg && mg && bg) {
    peelBadge.textContent = "缺少前景";
    peelReadout.textContent = "抽掉前景栏杆与花草后，观众失去脚下的尺度参照，整张图退化成远处平淡的风景明信片。";
  } else if (fg && !mg && bg) {
    peelBadge.textContent = "中景断层";
    peelReadout.textContent = "抽掉中景石桥与河岸后，眼前花草直接跳到远处雪峰，画面中部出现空荡断层，故事和路径都断了。";
  } else if (fg && mg && !bg) {
    peelBadge.textContent = "缺少远景";
    peelReadout.textContent = "抽掉远景雪峰与天际线后，画面被堵在一堵闷墙里，既没有空间延展，也交代不出场景所处的地理氛围。";
  } else if (n === 0) {
    peelBadge.textContent = "全部抽空";
    peelReadout.textContent = "三层都已关闭。逐层重新打开，体会前景、中景、远景如何一级级搭出深焦骨架。";
  } else {
    peelBadge.textContent = `仅剩 ${n} 层`;
    peelReadout.textContent = "只保留单层信息无法构成由近到远的纵深对话，至少需要前、中、远彼此呼应才能建立深焦空间感。";
  }
}

document.querySelectorAll("[data-peel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.peel;
    peelFlags[k] = !peelFlags[k];
    btn.classList.toggle("is-on", peelFlags[k]);
    btn.setAttribute("aria-pressed", peelFlags[k] ? "true" : "false");
    drawPeel();
  });
});

// ==================== 3. 第 02 节：清晰≠杂乱拉幕对比 ====================
const clutterCanvas = document.getElementById("clutter-canvas");
const slCurtain = document.getElementById("sl-curtain");
const clutterBadge = document.getElementById("clutter-badge");
const clutterReadout = document.getElementById("clutter-readout");
const levers = { offset: true, tone: true, temp: true, line: true };
let curtainPos = 0.46;

function drawClutter() {
  renderClutterSplitCanvas(clutterCanvas, curtainPos, levers);
  const count = Object.values(levers).filter(Boolean).length;
  clutterBadge.textContent = `已启用 ${count}/4 秩序杠杆`;
  if (count === 4) {
    clutterReadout.textContent = "四维杠杆全部打开时，不用一丝虚化，人眼照样能瞬间分辨「深暖木栏在前 → 明快石桥居中 → 清凉雪峰在后」。";
  } else if (count === 0) {
    clutterReadout.textContent = "四项非虚化秩序全关后，右侧退化得和左侧一样：前中远全清却互相遮挡、明暗撞车，这就是深焦最容易翻车的「全清杂乱」。";
  } else {
    const offNames = [
      !levers.offset && "错位避遮挡",
      !levers.tone && "明暗阶梯",
      !levers.temp && "前景暖·远景冷",
      !levers.line && "S 形路径引导",
    ].filter(Boolean);
    clutterReadout.textContent = `当前关闭了「${offNames.join("、")}」。向左拉动中缝对比，能直观看到缺了这些非虚化秩序后，深焦画面的清晰度反而增加阅读负担。`;
  }
}

slCurtain.addEventListener("input", () => {
  curtainPos = Number(slCurtain.value) / 100;
  drawClutter();
});

let curtainDrag = false;
const moveCurtainByClientX = (clientX) => {
  const r = clutterCanvas.getBoundingClientRect();
  curtainPos = clamp((clientX - r.left) / Math.max(1, r.width), 0.1, 0.9);
  slCurtain.value = String(Math.round(curtainPos * 100));
  drawClutter();
};
clutterCanvas.addEventListener("pointerdown", (e) => {
  curtainDrag = true;
  if (e.pointerType === "mouse") clutterCanvas.setPointerCapture(e.pointerId);
  moveCurtainByClientX(e.clientX);
});
clutterCanvas.addEventListener("pointermove", (e) => {
  if (curtainDrag) moveCurtainByClientX(e.clientX);
});
clutterCanvas.addEventListener("pointerup", () => { curtainDrag = false; });
clutterCanvas.addEventListener("pointercancel", () => { curtainDrag = false; });

document.querySelectorAll("[data-lever]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.lever;
    levers[k] = !levers[k];
    btn.classList.toggle("is-on", levers[k]);
    btn.setAttribute("aria-pressed", levers[k] ? "true" : "false");
    drawClutter();
  });
});

// ==================== 4. 第 03 节：超焦距与衍射相图光学台 ====================
const opticsCanvas = document.getElementById("optics-canvas");
const labStatus = document.getElementById("lab-status");
const labReadout = document.getElementById("lab-readout");
const labAp = document.getElementById("lab-ap");
const labFocus = document.getElementById("lab-focus");
const labApVal = document.getElementById("lab-ap-val");
const labFocusVal = document.getElementById("lab-focus-val");
const labSnapH = document.getElementById("lab-snap-h");

const lab = { focalMm: 24, aperture: 11, focusM: 1.85 };
let labMapRect = null;

function drawOpticsLab() {
  const res = renderOpticsLabCanvas(opticsCanvas, lab.focalMm, lab.aperture, lab.focusM);
  labMapRect = res.mapRectCss;
  const ev = evaluate({ ...INITIAL_STATE, focalMm: lab.focalMm, aperture: lab.aperture, focusM: lab.focusM, fgOffset: -0.25, mgOffset: 0.08, bgOffset: 0.06 });
  labAp.value = String(nearestApertureIdx(lab.aperture));
  labFocus.value = String(Math.round(focusToNorm(lab.focusM) * 200) / 2);
  labApVal.textContent = `f/${lab.aperture}`;
  labFocusVal.textContent = formatDist(lab.focusM);
  document.querySelectorAll("[data-lab-focal]").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.labFocal) === lab.focalMm));

  const sweet = !ev.diffractionFail && ev.planes.fg.sharp && ev.planes.mg.sharp && ev.planes.bg.sharp;
  const tag = ev.diffractionFail ? "落入衍射发软区" : sweet ? "命中青柠深焦甜区" : !ev.planes.fg.sharp ? "前景 1.5m 失焦" : "远景 ∞ 失焦";
  labStatus.textContent = `${lab.focalMm}mm · f/${lab.aperture} · u = ${formatDist(lab.focusM)} · H = ${ev.dof.H.toFixed(2)}m · ${tag}`;

  if (ev.diffractionFail) {
    labReadout.textContent = `缩到 f/${lab.aperture} 时艾里斑直径已达 ${Math.round(ev.airy * 1000)} μm，右侧相图进入暖赤色衍射区：景深虽拉满，三层微反差却同步发肉。把光圈放回 f/8–f/14 即可恢复锐利。`;
  } else if (sweet) {
    labReadout.textContent = `命中青柠甜区！清晰带覆盖 ${formatDist(ev.dof.near)} – ${formatDist(ev.dof.far)}，艾里斑仅 ${Math.round(ev.airy * 1000)} μm，前中远三层同时清晰且保持扎实锐度。`;
  } else {
    labReadout.textContent = `当前清晰带仅覆盖 ${formatDist(ev.dof.near)} – ${formatDist(ev.dof.far)}，未能同时包住 1.5 m 前景与 ∞ 远景。点击相图青柠区或点「落到当前超焦距 H」观察光路变化。`;
  }
}

document.querySelectorAll("[data-lab-focal]").forEach((b) => {
  b.addEventListener("click", () => {
    lab.focalMm = Number(b.dataset.labFocal);
    drawOpticsLab();
  });
});
labAp.addEventListener("input", () => {
  lab.aperture = APERTURE_STOPS[Number(labAp.value)] ?? 11;
  drawOpticsLab();
});
labFocus.addEventListener("input", () => {
  lab.focusM = normToFocus(Number(labFocus.value) / 100);
  drawOpticsLab();
});
labSnapH.addEventListener("click", () => {
  lab.focusM = clamp(+(hyperfocalM(lab.focalMm, lab.aperture) * 1.03).toFixed(2), 0.6, 120);
  drawOpticsLab();
});

let labDragging = false;
function mapPointerToLab(e) {
  if (!labMapRect) return;
  const r = opticsCanvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x < labMapRect.x - 12 || x > labMapRect.x + labMapRect.w + 12) return;
  const tx = clamp((x - labMapRect.x) / Math.max(1, labMapRect.w), 0, 1);
  const ty = clamp(1 - (y - labMapRect.y) / Math.max(1, labMapRect.h), 0, 1);
  const rawAp = Math.exp(Math.log(2.0) + tx * (Math.log(32.0) - Math.log(2.0)));
  lab.aperture = APERTURE_STOPS[nearestApertureIdx(rawAp)];
  lab.focusM = normToFocus(ty);
  drawOpticsLab();
}
opticsCanvas.addEventListener("pointerdown", (e) => {
  labDragging = true;
  if (e.pointerType === "mouse") opticsCanvas.setPointerCapture(e.pointerId);
  mapPointerToLab(e);
});
opticsCanvas.addEventListener("pointermove", (e) => {
  if (labDragging) mapPointerToLab(e);
});
opticsCanvas.addEventListener("pointerup", () => { labDragging = false; });
opticsCanvas.addEventListener("pointercancel", () => { labDragging = false; });

// ==================== 5. 第 04 节：深焦历史三幕检视带 ====================
const HISTORY_DATA = {
  f64: {
    kicker: "1932 年 11 月 15 日 · 旧金山笛洋纪念美术馆",
    title: "以大画幅最小光圈命名，向柔焦画意摄影宣战",
    body: "1932 年 11 月 15 日，安塞尔·亚当斯、爱德华·韦斯顿、伊莫金·坎宁安等 11 位美国西海岸摄影师在旧金山笛洋纪念美术馆举办首展，成立「f/64 小组」（Group f/64）。这个名字直接取自当时大画幅座机镜头的最小光圈 f/64：大画幅底片画幅巨大，需要极小光圈与直接接触印相，才能让近处岩石纹理到远山云影通体锐利，拒绝模仿油画的柔焦修饰。",
    source: "核实出处：Lisa Hostetler, \"Group f/64\", 大都会艺术博物馆 Heilbrunn 艺术史年表（metmuseum.org）。",
    svg: `<svg viewBox="0 0 360 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="14" width="332" height="182" stroke="#2B523E" stroke-width="1.5"/>
      <circle cx="110" cy="105" r="56" stroke="#D8DC56" stroke-width="2"/>
      <circle cx="110" cy="105" r="38" stroke="#4A7860" stroke-dasharray="4 3"/>
      <circle cx="110" cy="105" r="8" fill="#EDE85F"/>
      <path d="M110 49l18 48M166 105l-48 18M110 161l-18-48M54 105l48-18" stroke="#D8DC56" stroke-width="1.2" opacity="0.75"/>
      <text x="195" y="76" fill="#EDE85F" font-family="Fraunces, serif" font-size="34" font-weight="700" font-style="italic">f/64</text>
      <text x="195" y="106" fill="#F3F2E5" font-family="Noto Serif SC, serif" font-size="13">大画幅直接摄影</text>
      <text x="195" y="128" fill="#A6C0B0" font-family="Space Mono, monospace" font-size="11">8×10 CONTACT PRINT</text>
      <text x="195" y="152" fill="#D4E0D2" font-family="Noto Serif SC, serif" font-size="12">近岩至远峰全画幅锐利</text>
    </svg>`,
  },
  kane: {
    kane: true,
    kicker: "1941 年 · 雷电华摄影棚 · 格雷格·托兰德与奥逊·威尔斯",
    title: "24mm 镀膜广角 + Super-XX 胶片 + 碳弧灯，造出七层同框名场面",
    body: "《公民凯恩》（1941）并没有「凭空发明」深焦，但摄影指导格雷格·托兰德把当时几项最新技术拧成一股绳：抗反射镀膜 24mm 广角镜头、柯达高速 Super-XX 黑白胶片、高强度碳弧灯与 f/8–f/16 小光圈，再配上带帆布天花板的封闭布景。于是前景书桌契约、中景双人争执与远景雪地玩耍的孩童，第一次在同一长镜头里全部清晰落地。",
    source: "核实出处：Gregg Toland 1941 年 2 月《American Cinematographer》撰文与大卫·波德维尔电影史考证。",
    svg: `<svg viewBox="0 0 360 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="14" width="332" height="182" stroke="#2B523E" stroke-width="1.5"/>
      <path d="M14 14L142 62M346 14L218 62M14 196L142 140M346 196L218 140" stroke="#36614A" stroke-width="1.2"/>
      <rect x="142" y="54" width="76" height="62" fill="#173D2B" stroke="#D8DC56" stroke-width="1.6"/>
      <circle cx="180" cy="86" r="5" fill="#F3F2E5"/>
      <rect x="175" y="93" width="10" height="16" fill="#F3F2E5"/>
      <circle cx="96" cy="92" r="9" fill="#C7D168"/>
      <path d="M80 156l6-50h20l6 50H80z" fill="#C7D168"/>
      <rect x="236" y="128" width="88" height="46" fill="#234836" stroke="#EDE85F" stroke-width="1.6"/>
      <line x1="248" y1="144" x2="310" y2="144" stroke="#F3F2E5" stroke-width="2"/>
      <line x1="248" y1="156" x2="296" y2="156" stroke="#A6C0B0" stroke-width="2"/>
      <text x="26" y="36" fill="#EDE85F" font-family="Space Mono, monospace" font-size="11">24mm · f/11 · SUPER-XX</text>
      <text x="150" y="132" fill="#D4E0D2" font-family="Noto Serif SC, serif" font-size="11">远景窗外</text>
      <text x="72" y="176" fill="#D4E0D2" font-family="Noto Serif SC, serif" font-size="11">中景对峙</text>
      <text x="252" y="190" fill="#EDE85F" font-family="Noto Serif SC, serif" font-size="11">前景契约</text>
    </svg>`,
  },
  bazin: {
    kicker: "1950–1958 年 · 安德烈·巴赞《电影语言的演进》",
    title: "把「先看哪里」的目光主权还给观众",
    body: "法国电影理论家安德烈·巴赞在 1950 至 1955 年间撰写、1958 年收入《电影是什么？》（加州大学出版社英译初版 1967 年）的经典长文《电影语言的演进》中指出：传统分切剪辑像替观众拿主意，硬把特写推到眼前；而深焦结合长镜头保留了空间的连续与多义，观众可以主动在前景与远景之间来回扫视，自己拼出人物关系的潜台词。",
    source: "核实出处：André Bazin, What Is Cinema? Vol. I（trans. Hugh Gray, University of California Press）。",
    svg: `<svg viewBox="0 0 360 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="14" width="144" height="182" stroke="#4A7860" stroke-dasharray="4 3"/>
      <rect x="30" y="54" width="48" height="44" fill="#173D2B" stroke="#A6C0B0"/>
      <rect x="94" y="54" width="48" height="44" fill="#173D2B" stroke="#A6C0B0"/>
      <rect x="62" y="114" width="48" height="44" fill="#173D2B" stroke="#A6C0B0"/>
      <text x="28" y="38" fill="#A6C0B0" font-family="Noto Serif SC, serif" font-size="12">传统剪辑：轮流特写</text>
      <rect x="180" y="14" width="166" height="182" fill="#0F2F20" stroke="#D8DC56" stroke-width="1.8"/>
      <text x="194" y="38" fill="#EDE85F" font-family="Noto Serif SC, serif" font-size="12">深焦同框：视线自由游走</text>
      <circle cx="222" cy="148" r="18" fill="#2A5840" stroke="#EDE85F" stroke-width="1.6"/>
      <circle cx="272" cy="108" r="13" fill="#2A5840" stroke="#EDE85F" stroke-width="1.6"/>
      <circle cx="312" cy="70" r="8" fill="#2A5840" stroke="#EDE85F" stroke-width="1.6"/>
      <path d="M222 148Q246 118 272 108T312 70" stroke="#EDE85F" stroke-width="1.8" stroke-dasharray="5 4"/>
    </svg>`,
  },
};

const histVisual = document.getElementById("history-visual");
const histKicker = document.getElementById("hist-kicker");
const histTitle = document.getElementById("hist-title");
const histBody = document.getElementById("hist-body");
const histSource = document.getElementById("hist-source");

function renderHistory(era) {
  const d = HISTORY_DATA[era] || HISTORY_DATA.f64;
  histVisual.innerHTML = d.svg;
  histKicker.textContent = d.kicker;
  histTitle.textContent = d.title;
  histBody.textContent = d.body;
  histSource.textContent = d.source;
  document.querySelectorAll(".film-tab").forEach((b) => {
    const on = b.dataset.era === era;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
}
renderHistory("f64");
document.querySelectorAll(".film-tab").forEach((b) => {
  b.addEventListener("click", () => renderHistory(b.dataset.era));
});

// ==================== 6. 第 05 节：片场情境决策卡 ====================
const BRIEFS = {
  valley: {
    avoid: false,
    badge: "判断：推荐深焦",
    title: "推荐深焦 · 24mm · f/11 · 超焦距 1.8m",
    ev: "进光充裕 · 三脚架稳拍",
    body: "三脚架与晴光轻松消化 f/11 的曝光代价，前景栈道与野花提供入画尺度，中景溪谷承接，远景雪峰延展全貌，是深焦构图的教科书舞台。",
  },
  night: {
    avoid: true,
    badge: "判断：不宜硬用深焦",
    title: "建议改用大光圈快门 · 35mm · f/2.0",
    ev: "缩到 f/11 需慢 32 倍快门（极易拍糊）",
    body: "手持暗光里硬缩 f/11 会丢掉 5 档进光量，摊主动作会拖影，背后杂乱人流全拍清也会毁掉主体。优先保证快门速度与主体脱颖而出。",
  },
  drama: {
    avoid: false,
    badge: "判断：推荐深焦",
    title: "推荐深焦 · 28mm · f/11 · 影棚补足照度",
    ev: "可控布光 · 同框双线叙事",
    body: "前景签字的手与远景门外窃听者的反应同时保持清晰，一个镜头就能讲完剪辑原本要切三刀才能交代的戏剧张力，记得把前景和远景横向错位避开遮挡。",
  },
  market: {
    avoid: true,
    badge: "判断：换浅景深更好",
    title: "建议换浅景深 · 50mm 或 85mm · f/2.0",
    ev: "背景无法通过走位清场",
    body: "背后紧贴停车牌与空调外机时，全清只会把杂物焊接在咖啡杯边上。改用大光圈或长焦虚化掉背景，画面瞬间干净得多。",
  },
};

const briefBadge = document.getElementById("brief-verdict-badge");
const briefResult = document.getElementById("brief-result");
const brTitle = document.getElementById("br-title");
const brEv = document.getElementById("br-ev");
const brBody = document.getElementById("br-body");

document.querySelectorAll("[data-brief]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const b = BRIEFS[btn.dataset.brief];
    if (!b) return;
    document.querySelectorAll("[data-brief]").forEach((x) => x.classList.toggle("is-active", x === btn));
    briefBadge.textContent = b.badge;
    briefResult.classList.toggle("is-avoid", b.avoid);
    brTitle.textContent = b.title;
    brEv.textContent = b.ev;
    brBody.textContent = b.body;
  });
});

// ==================== 7. 第 06 节：三题单变量视觉练习 ====================
let activeQ = 0;
const answered = new Map();
const quizPrompt = document.getElementById("quiz-prompt");
const quizVar = document.getElementById("quiz-var");
const quizFeedback = document.getElementById("quiz-feedback");

function renderQuiz(idx) {
  activeQ = idx;
  const q = QUIZ_QUESTIONS[idx];
  quizPrompt.textContent = q.prompt;
  quizVar.textContent = q.variable;
  document.querySelectorAll(".quiz-tab").forEach((b) => {
    const on = Number(b.dataset.q) === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });

  const picked = answered.get(idx);
  q.options.forEach((opt) => {
    const card = document.querySelector(`.quiz-card[data-opt="${opt.key}"]`);
    const sub = document.querySelector(`[data-qsub="${opt.key}"]`);
    const cv = document.querySelector(`[data-qcanvas="${opt.key}"]`);
    if (sub) sub.textContent = opt.caption;
    if (cv) renderMiniDeepFocus(cv, opt.state, { showGuides: false, showHud: false });
    if (card) {
      card.classList.remove("is-right", "is-wrong");
      if (picked) {
        if (opt.key === q.answer) card.classList.add("is-right");
        else if (opt.key === picked) card.classList.add("is-wrong");
      }
    }
  });

  if (!picked) {
    quizFeedback.className = "quiz-feedback";
    quizFeedback.textContent = "仔细观察四张画面里的前景花径、中景石桥与远景雪峰，点击你认为最成立的一张。";
  } else if (picked === q.answer) {
    quizFeedback.className = "quiz-feedback is-right";
    quizFeedback.textContent = `答对了，选 ${q.answer}！${q.explain}`;
  } else {
    quizFeedback.className = "quiz-feedback is-wrong";
    quizFeedback.textContent = `你选了 ${picked}，更佳答案是 ${q.answer}。${q.explain}`;
  }
}

document.querySelectorAll(".quiz-tab").forEach((b) => {
  b.addEventListener("click", () => renderQuiz(Number(b.dataset.q)));
});

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    answered.set(activeQ, card.dataset.opt);
    renderQuiz(activeQ);
  });
});

// ==================== 8. 第 07 节：原海报放大灯箱 ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbViewport = document.getElementById("lb-viewport");
const lbImg = document.getElementById("lb-img");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbZoomReset = document.getElementById("lb-zoom-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbPan = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbZoomReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 1, 3.2); applyLbTransform(); });
lbZoomOut.addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 1, 3.2); if (lbScale === 1) { lbTx = 0; lbTy = 0; } applyLbTransform(); });
lbZoomReset.addEventListener("click", () => { lbScale = 1; lbTx = 0; lbTy = 0; applyLbTransform(); });

lbViewport.addEventListener("wheel", (e) => {
  if (lightbox.hidden) return;
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
  if (lbScale === 1) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  lbPan = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
  lbViewport.setPointerCapture(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbPan || lbPan.id !== e.pointerId) return;
  lbTx = lbPan.tx + (e.clientX - lbPan.x);
  lbTy = lbPan.ty + (e.clientY - lbPan.y);
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbPan = null; });
lbViewport.addEventListener("pointercancel", () => { lbPan = null; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 9. 懒绘制副画布与视口缩放重绘 ====================
function drawAllSubCanvases() {
  drawPeel();
  drawClutter();
  drawOpticsLab();
  renderQuiz(activeQ);
}

// 首次立即可见一帧（保证 reduced-motion 与无滚屏测试不空白）
heroLoop.draw();
drawAllSubCanvases();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    dirty = true;
    heroLoop.draw();
    drawAllSubCanvases();
  }, 90);
});

reducedMotion.addEventListener("change", () => {
  dirty = true;
  heroLoop.draw();
});
