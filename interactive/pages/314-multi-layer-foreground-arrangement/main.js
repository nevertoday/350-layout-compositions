// 314 多层前景调度 — 交互主控（遵循 lib/stage.js 省电与减少动态效果规矩）

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  BROKEN_STATE,
  FOCUS_MODES,
  APERTURE_MODES,
  HISTORY_ERAS,
  SIBLING_STAGING,
  QUIZ_OPTIONS,
  clamp,
  createState,
  evaluateState,
} from "./model.js";
import {
  renderHeroStage,
  renderCutawayMonitor,
  getLayerHandles,
  renderScaleLab,
  renderApertureCanvas,
  renderHistoryCanvas,
} from "./stage-render.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ==================== 主角多平面剧场状态与渲染 ====================
const state = createState();
const heroCanvas = $("#hero-canvas");
const cutawayCanvas = $("#cutaway-canvas");
const parallaxTrack = $("#parallax-track");
const pxThumb = $("#px-thumb");
const camReadout = $("#cam-readout");
const hudScene = $("#hud-scene");
const hudFocus = $("#hud-focus");
const mobileScore = $("#mobile-score");

const lampFg = $("#lamp-fg");
const lampOv = $("#lamp-ov");
const lampDp = $("#lamp-dp");
const lampEm = $("#lamp-em");
const diagBox = $("#diag-box");
const diagBadge = $("#diag-badge");
const diagHeadline = $("#diag-headline");
const diagReason = $("#diag-reason");
const diagHint = $("#diag-hint");
const mOcc = $("#m-occ");
const mFg = $("#m-fg");
const mJamb = $("#m-jamb");
const mChain = $("#m-chain");

let introProgress = reducedMotion.matches ? 1 : 0.25;
let lastEval = null;

function heroAspect() {
  const r = heroCanvas.getBoundingClientRect();
  return r.height > 10 ? r.width / r.height : 1.6;
}

function updateHeroUI(ev) {
  const pct = Math.round(state.camX * 100);
  const meters = (state.camX * 0.9).toFixed(2);
  const sign = pct > 0 ? "+" : "";
  camReadout.textContent = `CAM ${sign}${pct}% · ${sign}${meters}m`;
  const thumbPct = 8 + ((state.camX + 1) / 2) * 84;
  pxThumb.style.left = `${thumbPct}%`;
  parallaxTrack.setAttribute("aria-valuenow", String(pct));
  parallaxTrack.setAttribute("aria-valuetext", `机位横移 ${sign}${pct}%`);

  hudScene.textContent = state.sceneMode === "cinema" ? "片场走廊" : "原海报建筑";
  const fm = FOCUS_MODES[state.focus] || FOCUS_MODES.L4;
  hudFocus.textContent = state.focus === "deep" ? "DEEP FOCUS · f/11" : `FOCUS ${state.focus} · ${fm.targetZ}m`;

  lampFg.dataset.ok = String(ev.checks.foreground);
  lampOv.dataset.ok = String(ev.checks.overlap);
  lampDp.dataset.ok = String(ev.checks.depth);
  lampEm.dataset.ok = String(ev.checks.emphasis);

  mobileScore.textContent = ev.score === 4 ? "4 / 4 成立" : `${ev.score} / 4 待调`;
  diagBox.dataset.ok = String(ev.score === 4);
  diagBadge.textContent = ev.badge;
  diagHeadline.textContent = ev.headline;
  diagReason.textContent = ev.reason;
  diagHint.textContent = ev.nextHint;

  mOcc.textContent = `${ev.subjectOcclusionPct}%`;
  mFg.textContent = `${ev.fgCoveragePct}%`;
  mJamb.textContent = ev.inOpening ? `${ev.jambMarginPct >= 0 ? "+" : ""}${ev.jambMarginPct.toFixed(1)}%` : "在框外";
  mChain.textContent = `${ev.overlapLinks} / 3`;

  $$("#layer-pills .pill-btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.layer === state.activeLayer));
  });
  $$("#focus-pills .pill-btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.focus === state.focus));
  });
  const btnScene = $("#btn-scene");
  btnScene.setAttribute("aria-pressed", String(state.sceneMode === "cinema"));
  btnScene.textContent = state.sceneMode === "cinema" ? "切「原海报建筑」" : "切「片场走廊」";
  $("#btn-guide").setAttribute("aria-pressed", String(state.showGuide));
}

function redrawHero(p = introProgress) {
  const dpr = pixelRatio(2);
  const aspect = heroAspect();
  lastEval = evaluateState(state, aspect);
  renderHeroStage(heroCanvas, state, lastEval, dpr, p);
  if (cutawayCanvas.offsetWidth > 10 && cutawayCanvas.offsetHeight > 10) {
    renderCutawayMonitor(cutawayCanvas, state, lastEval, dpr);
  }
  updateHeroUI(lastEval);
}

// 用 lib/stage.js 的 loop() 管理开场入画动效（停稳后按需重绘，绝不空转耗电）
const heroLoop = loop(heroCanvas, (_t, dt, { still }) => {
  if (still) {
    introProgress = 1;
    redrawHero(1);
    return;
  }
  if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.45);
    redrawHero(introProgress);
  }
});

// 初次立即绘制一帧，确保 0.9s 截图及无动画模式完整呈现
redrawHero(introProgress);

// 选中景片应用位移增量（并做合理吸附：靠近完美对齐拱门中心时微吸附）
function applyLayerDelta(layerKey, dx, dy) {
  if (layerKey === "palm") {
    state.palmX = clamp(state.palmX + dx, 0.08, 0.92);
    state.palmY = clamp(state.palmY + dy, 0.34, 1.06);
  } else if (layerKey === "wall") {
    state.wallX = clamp(state.wallX + dx, -0.22, 0.22);
    state.wallY = clamp(state.wallY + dy, 0.28, 0.96);
  } else if (layerKey === "arch") {
    let next = clamp(state.archX + dx, 0.22, 0.78);
    if (Math.abs(next - state.subX) < 0.014) next = state.subX;
    state.archX = next;
  } else if (layerKey === "subject") {
    let next = clamp(state.subX + dx, 0.24, 0.76);
    if (Math.abs(next - state.archX) < 0.014) next = state.archX;
    state.subX = next;
  }
  introProgress = 1;
  redrawHero(1);
}

// ---------- 画布直拖 L1–L4 景片（指针命中锚标或按图层自由拖） ----------
let canvasDrag = null;

function hitLayerHandle(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  const lx = clientX - rect.left;
  const ly = clientY - rect.top;
  const ev = lastEval || evaluateState(state, heroAspect());
  const handles = getLayerHandles(state, ev, rect.width, rect.height);
  let best = null;
  let bestD = 34;
  for (const hd of handles) {
    const d = Math.hypot(lx - hd.x, ly - hd.y);
    if (d < bestD) {
      bestD = d;
      best = hd.key;
    }
  }
  return { best, rect, lx, ly };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const { best, rect } = hitLayerHandle(e.clientX, e.clientY);
  // 触屏只在点中锚标或左右拖时接管，避免拦住竖向滚页；鼠标可直接拖当前选中景片
  if (e.pointerType === "touch" && !best) return;
  if (best) state.activeLayer = best;
  canvasDrag = {
    id: e.pointerId,
    layer: state.activeLayer,
    lastX: e.clientX,
    lastY: e.clientY,
    w: rect.width,
    h: rect.height,
  };
  heroCanvas.classList.add("dragging");
  try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  redrawHero(1);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!canvasDrag || e.pointerId !== canvasDrag.id) return;
  const dx = (e.clientX - canvasDrag.lastX) / Math.max(1, canvasDrag.w);
  const dy = (e.clientY - canvasDrag.lastY) / Math.max(1, canvasDrag.h);
  canvasDrag.lastX = e.clientX;
  canvasDrag.lastY = e.clientY;
  applyLayerDelta(canvasDrag.layer, dx, dy);
});

const endCanvasDrag = (e) => {
  if (canvasDrag && e.pointerId === canvasDrag.id) {
    canvasDrag = null;
    heroCanvas.classList.remove("dragging");
  }
};
heroCanvas.addEventListener("pointerup", endCanvasDrag);
heroCanvas.addEventListener("pointercancel", endCanvasDrag);

// ---------- 机位视差滑轨（data-perf-drag）：同时支持 Pointer、Touch 与键盘 ----------
let trackDragId = null;

function setCamFromClientX(clientX) {
  const rect = parallaxTrack.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  let cam = ratio * 2 - 1;
  if (Math.abs(cam) < 0.03) cam = 0;
  state.camX = cam;
  introProgress = 1;
  redrawHero(1);
}

parallaxTrack.addEventListener("pointerdown", (e) => {
  trackDragId = e.pointerId;
  try { parallaxTrack.setPointerCapture(e.pointerId); } catch {}
  setCamFromClientX(e.clientX);
});

parallaxTrack.addEventListener("pointermove", (e) => {
  if (trackDragId !== e.pointerId) return;
  setCamFromClientX(e.clientX);
});

const endTrackDrag = (e) => {
  if (trackDragId === e.pointerId) trackDragId = null;
};
parallaxTrack.addEventListener("pointerup", endTrackDrag);
parallaxTrack.addEventListener("pointercancel", endTrackDrag);

// 兼容 CDP 原始 touch 事件（确保 perf.mjs 触屏横拖帧率每帧真实重绘）
parallaxTrack.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length) setCamFromClientX(e.touches[0].clientX);
  },
  { passive: true }
);
parallaxTrack.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length) {
      e.preventDefault();
      setCamFromClientX(e.touches[0].clientX);
    }
  },
  { passive: false }
);

parallaxTrack.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.16 : 0.06;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.camX = clamp(state.camX - step, -1, 1);
    redrawHero(1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    state.camX = clamp(state.camX + step, -1, 1);
    redrawHero(1);
  }
});

// ---------- 景片切换、方向微调、对焦环、场景切换、复原错态 ----------
$$("#layer-pills .pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeLayer = btn.dataset.layer;
    redrawHero(1);
  });
  btn.addEventListener("keydown", (e) => {
    const step = 0.035;
    if (e.key === "ArrowLeft") { e.preventDefault(); applyLayerDelta(state.activeLayer, -step, 0); }
    else if (e.key === "ArrowRight") { e.preventDefault(); applyLayerDelta(state.activeLayer, step, 0); }
    else if (e.key === "ArrowUp") { e.preventDefault(); applyLayerDelta(state.activeLayer, 0, -step); }
    else if (e.key === "ArrowDown") { e.preventDefault(); applyLayerDelta(state.activeLayer, 0, step); }
  });
});

$$(".nudge-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const [dx, dy] = btn.dataset.nudge.split(",").map(Number);
    applyLayerDelta(state.activeLayer, dx * 0.04, dy * 0.04);
  });
});

$$("#focus-pills .pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.focus = btn.dataset.focus;
    introProgress = 1;
    redrawHero(1);
  });
});

$("#btn-scene").addEventListener("click", () => {
  state.sceneMode = state.sceneMode === "poster" ? "cinema" : "poster";
  introProgress = 1;
  redrawHero(1);
});

$("#btn-guide").addEventListener("click", () => {
  state.showGuide = !state.showGuide;
  redrawHero(1);
});

$("#btn-reset").addEventListener("click", () => {
  Object.assign(state, BROKEN_STATE);
  introProgress = 1;
  redrawHero(1);
});

// ==================== 第 01 节：四层等轴景片逐层剥离 ====================
const peelChecks = $$("input[data-peel]");
const peelStat = $("#peel-stat");
const peelMsg = $("#peel-msg");

function updatePeel() {
  const on = {};
  peelChecks.forEach((chk) => {
    const k = chk.dataset.peel;
    on[k] = chk.checked;
    const g = $(`#peel-${k}`);
    if (g) g.style.display = chk.checked ? "" : "none";
  });
  const count = Object.values(on).filter(Boolean).length;
  const j12 = on.l1 && on.l2;
  const j23 = on.l2 && on.l3;
  const j34 = on.l3 && on.l4;
  const jCount = [j12, j23, j34].filter(Boolean).length;
  $("#junc-12").style.display = j12 ? "" : "none";
  $("#junc-23").style.display = j23 ? "" : "none";
  $("#junc-34").style.display = j34 ? "" : "none";

  peelStat.textContent = `${count} 层开启 · ${jCount} 处叠压交界`;
  if (count === 4) {
    peelMsg.textContent = "四层齐备：极前景叶压深松阶墙、阶墙压陶红拱门、拱门托焦点球，三处叠压交界把平面撑出纵深。";
  } else if (!on.l1 && !on.l2 && on.l3 && on.l4) {
    peelMsg.textContent = "撤掉两层前景后只剩拱门和球：主体没动，但镜头前的「门槛」消失，纵深感骤降一半。";
  } else if (!on.l3 && on.l4) {
    peelMsg.textContent = "抽掉中层陶红拱门后，前景暗墙与深处焦点之间出现断层，视线失去画内框的汇聚通道。";
  } else if (!on.l4) {
    peelMsg.textContent = "没有深处焦点，前面再多景片也只是空壳——多层前景必须为最终焦点服务。";
  } else {
    peelMsg.textContent = `当前仅剩 ${jCount} 处有效前后叠压交界；补齐相邻景层即可重新拉出层层递进的纵深感。`;
  }
}

peelChecks.forEach((chk) => chk.addEventListener("change", updatePeel));
updatePeel();

// ==================== 第 02 节：光圈虚实 + 明度阶梯双滑块 ====================
const scaleCanvas = $("#scale-canvas");
const rngFstop = $("#rng-fstop");
const rngTonal = $("#rng-tonal");
const valFstop = $("#val-fstop");
const valTonal = $("#val-tonal");
const scaleVerdict = $("#scale-verdict");

function updateScaleLab() {
  const f = parseFloat(rngFstop.value);
  const t = parseInt(rngTonal.value, 10);
  const blurDesc = f <= 2.8 ? "前景柔焦" : f <= 7.1 ? "适度景深" : "前后全锐";
  valFstop.textContent = `f/${f.toFixed(1)} · ${blurDesc}`;
  valTonal.textContent = `${t}% 分离`;

  if (t < 30 && f > 8) {
    scaleVerdict.textContent = "明度糊在一起又前后全锐：四层景片彻底粘成一张灰纸，根本分不出焦点在哪。";
  } else if (t < 30) {
    scaleVerdict.textContent = "虽然大光圈虚化了前景，但四层明度太接近，画面缺乏明暗阶梯，焦点的跳脱感依然偏弱。";
  } else if (f > 9) {
    scaleVerdict.textContent = "全景深下极前景叶脉和焦点一样锐利，全靠清晰的前暗后亮明度差勉强维持层次。";
  } else {
    scaleVerdict.textContent = "明度与景深双分离：极前景暗而柔、中框暖而稳、深处焦点亮而锐，视线一眼穿到底。";
  }
  renderScaleLab(scaleCanvas, f, t, pixelRatio(2));
}

rngFstop.addEventListener("input", updateScaleLab);
rngTonal.addEventListener("input", updateScaleLab);
updateScaleLab();

// ==================== 第 03 节：中层框架四种模式 ====================
const apertureCanvas = $("#aperture-canvas");
let currentAperture = "arch";

function updateAperture(id) {
  currentAperture = id;
  const info = APERTURE_MODES[id] || APERTURE_MODES.arch;
  $$("#aperture-tabs .ap-tab").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.ap === id));
  });
  $("#ap-en").textContent = info.en;
  $("#ap-name").textContent = info.name;
  $("#ap-meta").textContent = `洞口占比约 ${info.openPct}% · ${info.mood}`;
  $("#ap-desc").textContent = info.desc;
  renderApertureCanvas(apertureCanvas, id, pixelRatio(2));
}

$$("#aperture-tabs .ap-tab").forEach((btn) => {
  btn.addEventListener("click", () => updateAperture(btn.dataset.ap));
});
updateAperture("arch");

// ==================== 第 04 节：历史演进动态演示 ====================
const historyCanvas = $("#history-canvas");
let currentEra = "vermeer";

function updateEraMeta(id) {
  currentEra = id;
  const item = HISTORY_ERAS.find((x) => x.id === id) || HISTORY_ERAS[0];
  $$("#era-list .era-card").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.era === id));
  });
  $("#era-src").textContent = `${item.year} · ${item.source}`;
  $("#era-title").textContent = item.title;
  $("#era-desc").textContent = item.desc;
  historyLoop.draw();
}

const historyLoop = loop(historyCanvas, (t, _dt, { still }) => {
  renderHistoryCanvas(historyCanvas, currentEra, still ? 0.6 : t, pixelRatio(2));
});

$$("#era-list .era-card").forEach((btn) => {
  btn.addEventListener("click", () => updateEraMeta(btn.dataset.era));
});
updateEraMeta("vermeer");

// ==================== 第 05 节：同小类五种调度法双联简图 ====================
const sibSvg = $("#sib-svg");

function renderSiblingSvg(id) {
  // 左半（0–240）：俯视机位图；右半（270–505）：镜头画面轮廓
  const baseFrame = `
    <text x="16" y="22" fill="#C9BCB0" font-size="11" font-family="DM Mono, monospace">TOP PLAN · 俯视机位</text>
    <text x="276" y="22" fill="#C9BCB0" font-size="11" font-family="DM Mono, monospace">FRAME · 镜头成片</text>
    <rect x="16" y="32" width="224" height="142" fill="#0D1F1B" stroke="rgba(243,234,224,0.22)"/>
    <rect x="276" y="32" width="228" height="142" fill="#EDE1D3" stroke="rgba(243,234,224,0.28)"/>
  `;
  const plans = {
    310: `
      <polygon points="128,162 42,46 214,46" fill="rgba(215,153,142,0.14)"/>
      <circle cx="96" cy="126" r="8" fill="#E8A69C"/><circle cx="132" cy="92" r="7" fill="#F3EAE0"/><circle cx="164" cy="58" r="6" fill="#C9BCB0"/>
      <rect x="118" y="158" width="20" height="10" fill="#F3EAE0"/>
      <rect x="308" y="88" width="32" height="86" fill="#18322E"/><rect x="382" y="108" width="20" height="66" fill="#944037"/><rect x="442" y="124" width="12" height="50" fill="#4A625A"/>
    `,
    311: `
      <line x1="40" y1="74" x2="216" y2="74" stroke="#E8A69C" stroke-width="2.5"/>
      <line x1="128" y1="158" x2="128" y2="78" stroke="#F3EAE0" stroke-dasharray="3 3"/>
      <rect x="118" y="158" width="20" height="10" fill="#F3EAE0"/>
      <rect x="296" y="54" width="60" height="96" fill="#18322E"/><circle cx="394" cy="102" r="30" fill="#D58279"/><rect x="444" y="54" width="40" height="96" fill="#33493D"/>
    `,
    312: `
      <polygon points="128,62 76,126 180,126" fill="none" stroke="#E8A69C" stroke-width="2"/>
      <circle cx="128" cy="62" r="8" fill="#E8A69C"/><circle cx="76" cy="126" r="7" fill="#F3EAE0"/><circle cx="180" cy="126" r="7" fill="#F3EAE0"/>
      <rect x="118" y="158" width="20" height="10" fill="#F3EAE0"/>
      <polygon points="390,54 316,158 464,158" fill="none" stroke="#944037" stroke-width="2" stroke-dasharray="4 3"/>
      <circle cx="390" cy="64" r="12" fill="#944037"/><rect x="318" y="114" width="24" height="52" fill="#18322E"/><rect x="438" y="114" width="24" height="52" fill="#18322E"/>
    `,
    313: `
      <line x1="36" y1="96" x2="220" y2="96" stroke="#E8A69C" stroke-width="2"/>
      <circle cx="60" cy="96" r="6" fill="#F3EAE0"/><circle cx="104" cy="96" r="6" fill="#F3EAE0"/><circle cx="152" cy="96" r="6" fill="#E8A69C"/><circle cx="196" cy="96" r="6" fill="#F3EAE0"/>
      <path d="M88 158 H168" stroke="#8ED1B8" stroke-width="2"/><rect x="118" y="153" width="20" height="10" fill="#F3EAE0"/>
      <line x1="286" y1="114" x2="494" y2="114" stroke="#944037" stroke-width="2"/>
      <rect x="302" y="92" width="16" height="44" fill="#18322E"/><rect x="348" y="92" width="16" height="44" fill="#18322E"/><rect x="412" y="92" width="16" height="44" fill="#944037"/><rect x="460" y="92" width="16" height="44" fill="#18322E"/>
    `,
    314: `
      <line x1="48" y1="136" x2="128" y2="136" stroke="#8ED1B8" stroke-width="3"/>
      <line x1="44" y1="112" x2="176" y2="112" stroke="#C9BCB0" stroke-width="3"/>
      <line x1="66" y1="86" x2="190" y2="86" stroke="#E8A69C" stroke-width="3"/>
      <circle cx="128" cy="60" r="8" fill="#D58279"/>
      <rect x="118" y="158" width="20" height="10" fill="#F3EAE0"/>
      <circle cx="390" cy="108" r="16" fill="#D58279"/>
      <path fill-rule="evenodd" fill="#D7998E" d="M332 54 H448 V162 H332 Z M362 162 V102 A28 28 0 0 1 418 102 V162 Z"/>
      <path fill="#18322E" d="M276 118 L342 132 L428 154 L504 168 V174 H276 Z"/>
      <path fill="#0A2824" d="M316 174 C308 150 322 136 334 128 C332 148 336 162 344 174 Z"/>
    `,
  };
  sibSvg.innerHTML = baseFrame + (plans[id] || plans[314]);
}

function updateSibling(id) {
  const item = SIBLING_STAGING[id] || SIBLING_STAGING[314];
  $$("#sib-bar .sib-btn").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.sib === String(id)));
  });
  $("#sib-en").textContent = item.en;
  $("#sib-name").textContent = item.name;
  $("#sib-focus").textContent = item.focus;
  $("#sib-diff").textContent = item.diff;
  const cta = $("#sib-cta");
  if (item.url) {
    cta.hidden = false;
    cta.href = item.url;
    cta.textContent = `打开 ${item.id} 在线互动版 →`;
  } else {
    cta.hidden = true;
  }
  renderSiblingSvg(id);
}

$$("#sib-bar .sib-btn").forEach((btn) => {
  btn.addEventListener("click", () => updateSibling(btn.dataset.sib));
});
updateSibling("314");

// ==================== 第 06 节：什么时候别用翻面对照 ====================
$$("#avoid-grid .avoid-card").forEach((card) => {
  const btn = card.querySelector(".flip-btn");
  btn.addEventListener("click", () => {
    const next = card.dataset.fixed !== "true";
    card.dataset.fixed = String(next);
    btn.setAttribute("aria-pressed", String(next));
    btn.textContent = next ? "看回「硬叠翻车」" : "切「撤层正解」";
  });
});

// ==================== 第 07 节：小练习四选一 ====================
const quizGrid = $("#quiz-grid");
const qvTitle = $("#qv-title");
const qvBody = $("#qv-body");

$$("#quiz-grid .quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const choice = card.dataset.quiz;
    const data = QUIZ_OPTIONS[choice];
    quizGrid.classList.add("answered");
    $$("#quiz-grid .quiz-card").forEach((c) => {
      const k = c.dataset.quiz;
      c.setAttribute("aria-pressed", String(k === choice));
      c.classList.toggle("is-correct", QUIZ_OPTIONS[k].correct);
      c.classList.toggle("is-wrong", k === choice && !QUIZ_OPTIONS[k].correct);
    });
    qvTitle.textContent = data.title;
    qvBody.textContent = data.detail;
  });
});

// ==================== 第 08 节：原海报放大、拖动与 Esc 关闭灯箱 ====================
const posterImg = $("#poster");
const posterBtn = $("#poster-btn");
const lightbox = $("#lightbox");
const lbViewport = $("#lb-viewport");
const lbImg = $("#lb-img");

let lbZoom = 1;
let lbPanX = 0;
let lbPanY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbPanX}px, ${lbPanY}px) scale(${lbZoom})`;
  $("#lb-zoom-reset").textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbZoom = 1.45;
  lbPanX = 0;
  lbPanY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbZoom = clamp(lbZoom + 0.35, 1, 3.2);
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.35, 1, 3.2);
  if (lbZoom <= 1.02) { lbPanX = 0; lbPanY = 0; }
  applyLbTransform();
});
$("#lb-zoom-reset").addEventListener("click", () => {
  lbZoom = 1;
  lbPanX = 0;
  lbPanY = 0;
  applyLbTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, sx: e.clientX - lbPanX, sy: e.clientY - lbPanY };
  lbViewport.classList.add("panning");
  try { lbViewport.setPointerCapture(e.pointerId); } catch {}
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbPanX = e.clientX - lbDrag.sx;
  lbPanY = e.clientY - lbDrag.sy;
  applyLbTransform();
});
const endLbDrag = (e) => {
  if (lbDrag && e.pointerId === lbDrag.id) {
    lbDrag = null;
    lbViewport.classList.remove("panning");
  }
};
lbViewport.addEventListener("pointerup", endLbDrag);
lbViewport.addEventListener("pointercancel", endLbDrag);

lbViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
    applyLbTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 视口尺寸变化时按需重绘各画布 ====================
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    redrawHero(1);
    updateScaleLab();
    updateAperture(currentAperture);
    historyLoop.draw();
  }, 60);
});
