import { loop, reducedMotion } from "../../lib/stage.js";
import { INITIAL_STATE, PRESETS, clamp, evaluate, evaluateCutLab } from "./model.js";
import { renderCutLab, renderFloorRadar, renderHeroStage } from "./stage-canvas.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// ==================== 1. 开场：双人走位 × 180° 轴线机位同步台 ====================
const target = { ...INITIAL_STATE };
const current = { ...INITIAL_STATE };

const ui = {
  selectedActor: null,
  hoveredActor: null,
  dragging: null, // "A" | "B" | "orbit"
  radarDragging: null, // "A" | "B"
  hitBoxes: null,
  radarGeo: null,
  activePreset: null,
};

const stageCanvas = $("#stage-canvas");
const radarCanvas = $("#radar-canvas");
const titleAxis = $("#title-axis");
const verdictStamp = $("#hero-verdict-stamp");
const btnCutPreview = $("#btn-cut-preview");

const rngOrbit = $("#rng-orbit");
const rngSpan = $("#rng-span");
const rngDepth = $("#rng-depth");
const rngCamB = $("#rng-camb");

const valOrbit = $("#val-orbit");
const valSpan = $("#val-span");
const valDepth = $("#val-depth");
const valCamB = $("#val-cam-b");

const diagBadge = $("#diag-badge");
const diagTitle = $("#diag-title");
const diagBody = $("#diag-body");
const diagHint = $("#diag-hint");
const btnDiagFix = $("#btn-diag-fix");
const mGap = $("#m-gap");
const mRatio = $("#m-ratio");
const mBalance = $("#m-balance");
const mMood = $("#m-mood");

const LERP_KEYS = ["ax", "az", "ay", "bx", "bz", "by", "aPitch", "bPitch", "camOrbit", "camBAngle"];
let lastDomEvalKey = "";
let currentFixAction = "fixAllSym";
let heroDirty = true;
let cutDirty = true;

function markHeroDirty() {
  heroDirty = true;
  if (reducedMotion.matches) heroLoop.draw();
}
function markCutDirty() {
  cutDirty = true;
  if (reducedMotion.matches) cutLoop.draw();
}

const gazePillEls = $$(".mini-pill[data-gaze-pair]");
const sceneTabEls = $$(".tab-btn[data-scene]");
const varCardEls = $$(".var-card[data-preset]");
const principleTagEls = {
  hierarchy: $("#ptag-hierarchy"),
  axis: $("#ptag-axis"),
  eyeline: $("#ptag-eyeline"),
  breathing: $("#ptag-breathing"),
  balance: $("#ptag-balance"),
};

let radarOnScreen = true;
new IntersectionObserver(([entry]) => {
  radarOnScreen = entry.isIntersecting;
  if (radarOnScreen) markHeroDirty();
}).observe(radarCanvas);

function syncControlsFromTarget(light = false) {
  const orb = Math.round(target.camOrbit);
  const spanPct = Math.round(clamp(Math.abs(target.bx - target.ax) * 100, 14, 90));
  const depthPct = Math.round(clamp((target.bz - target.az) * 50, -42, 42));
  const camb = Math.round(target.camBAngle);

  const orbTxt = `${orb >= 0 ? "+" : ""}${orb}°`;
  if (valOrbit.textContent !== orbTxt) {
    rngOrbit.value = String(orb);
    valOrbit.textContent = orbTxt;
  }
  const spanTxt = `${spanPct}%`;
  if (valSpan.textContent !== spanTxt) {
    rngSpan.value = String(spanPct);
    valSpan.textContent = spanTxt;
  }
  const depTxt = `${depthPct >= 0 ? "+" : ""}${depthPct}%`;
  if (valDepth.textContent !== depTxt) {
    rngDepth.value = String(depthPct);
    valDepth.textContent = depTxt;
  }
  const cambTxt = `副机 B：${camb >= 0 ? "+" : ""}${camb}°`;
  if (valCamB.textContent !== cambTxt) {
    rngCamB.value = String(camb);
    valCamB.textContent = cambTxt;
  }
  if (light) return;

  // 视线按钮高亮
  let pair = "custom";
  if (target.aGaze === "toward" && target.bGaze === "toward") pair = "toward";
  else if (target.aGaze === "same-right" && target.bGaze === "same-right") pair = "same-right";
  else if (target.aGaze === "same-left" && target.bGaze === "same-left") pair = "same-left";
  else if (target.aGaze === "away" && target.bGaze === "away") pair = "away";
  gazePillEls.forEach((b) => b.classList.toggle("is-active", b.dataset.gazePair === pair));

  // 正反打切镜按钮
  const isB = target.activeCam === "B";
  btnCutPreview.setAttribute("aria-pressed", String(isB));
  btnCutPreview.textContent = isB ? "正反打切镜：副机 B" : "正反打切镜：主机 A";

  // 情景切签
  sceneTabEls.forEach((b) => {
    const on = b.dataset.scene === target.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });

  // 五格形式按钮高亮
  varCardEls.forEach((b) => b.classList.toggle("is-active", b.dataset.preset === ui.activePreset));
}

function updateDomFromEval(res) {
  const key = `${res.score}|${res.diag.badge}|${res.metrics.gapPct}|${res.metrics.areaRatio}|${res.metrics.comOffsetPct}|${res.axisCrossed}|${target.activeCam}`;
  if (key === lastDomEvalKey) return;
  lastDomEvalKey = key;

  // 非拖拽时更新标题轴宽，避免拖拽每帧触发顶栏布局重排
  if (!ui.dragging) {
    const gapPx = clamp(36 + Math.max(0, res.metrics.gapPct) * 0.58, 36, 68);
    titleAxis.style.setProperty("--axis-gap", `${Math.round(gapPx)}px`);
  }
  titleAxis.classList.toggle("is-error", !res.principles.axis.ok || !res.principles.breathing.ok);
  titleAxis.classList.toggle("is-pass", res.principles.axis.ok && res.principles.breathing.ok);

  const isPass = res.score === 5;
  verdictStamp.textContent = res.diag.badge;
  verdictStamp.className = `verdict-stamp ${isPass ? "is-pass" : "is-error"}`;

  diagBadge.textContent = res.diag.badge;
  diagBadge.className = `diag-badge ${isPass ? "is-pass" : "is-error"}`;
  diagTitle.textContent = res.diag.title;
  diagBody.textContent = res.diag.body;
  diagHint.textContent = res.diag.hint;
  btnDiagFix.textContent = res.diag.fixLabel;
  currentFixAction = res.diag.fixAction;

  mGap.textContent = res.isSameDir ? `前空 ${res.metrics.leadRoomPct}%` : `${res.metrics.gapPct}%`;
  mRatio.textContent = `${res.metrics.areaRatio.toFixed(2)}×`;
  const com = res.metrics.comOffsetPct;
  mBalance.textContent = Math.abs(com) <= 2 ? "居中 0%" : `${com > 0 ? "右偏" : "左偏"} ${Math.abs(com)}%`;
  mMood.textContent = res.metrics.moodBand;

  for (const [k, p] of Object.entries(res.principles)) {
    const el = principleTagEls[k];
    if (!el) continue;
    if (el.textContent !== p.tag) el.textContent = p.tag;
    const cls = `p-tag ${p.ok ? "is-pass" : "is-error"}`;
    if (el.className !== cls) el.className = cls;
  }
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  Object.assign(target, p.state);
  ui.activePreset = p.valid ? name : null;
  syncControlsFromTarget();
  markHeroDirty();
}

function runFixAction(action) {
  ui.activePreset = null;
  if (action === "toggleCut") {
    target.activeCam = target.activeCam === "A" ? "B" : "A";
  } else if (action === "fixOverlap") {
    target.camOrbit = clamp(target.camOrbit, -32, 32);
    if (Math.abs(target.bx - target.ax) < 0.45) {
      target.ax = -0.28;
      target.bx = 0.28;
    }
  } else if (action === "fixAxis") {
    target.camBAngle = target.camBAngle >= 0 ? 44 : -44;
  } else if (action === "fixSplit") {
    target.ax = -0.32;
    target.bx = 0.32;
    target.aGaze = "toward";
    target.bGaze = "toward";
    target.aPitch = 0;
    target.bPitch = 0;
  } else if (action === "fixEyeline") {
    target.aGaze = "toward";
    target.bGaze = "toward";
    target.aPitch = 0;
    target.bPitch = 0;
  } else if (action === "fixSameDir") {
    applyPreset("samedir");
    return;
  } else if (action === "fixBalance") {
    const half = clamp(Math.abs(target.bx - target.ax) * 0.5, 0.24, 0.34);
    target.ax = -half;
    target.bx = half;
  } else if (action === "fixHierarchy") {
    applyPreset("layered");
    return;
  } else {
    applyPreset("symmetrical");
    return;
  }
  syncControlsFromTarget();
  markHeroDirty();
}

const heroLoop = loop(stageCanvas, (_t, dt, { still }) => {
  let moving = false;
  const rate = still ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 14);
  for (const k of LERP_KEYS) {
    const diff = target[k] - current[k];
    if (Math.abs(diff) >= 0.0005) {
      current[k] = still ? target[k] : current[k] + diff * rate;
      if (Math.abs(target[k] - current[k]) < 0.0005) current[k] = target[k];
      moving = true;
    }
  }
  if (
    current.scene !== target.scene ||
    current.aGaze !== target.aGaze ||
    current.bGaze !== target.bGaze ||
    current.activeCam !== target.activeCam ||
    current.overlay !== target.overlay
  ) {
    current.scene = target.scene;
    current.aGaze = target.aGaze;
    current.bGaze = target.bGaze;
    current.activeCam = target.activeCam;
    current.overlay = target.overlay;
    moving = true;
  }

  if (!heroDirty && !moving && !still) return;
  heroDirty = false;

  const res = evaluate(current);
  ui.hitBoxes = renderHeroStage(stageCanvas, current, res, ui);
  if (radarOnScreen) ui.radarGeo = renderFloorRadar(radarCanvas, current, res);
  if (!ui.dragging || Math.abs(current.ax - target.ax) < 0.015) {
    updateDomFromEval(res);
  }
});

// 主舞台指针交互（拖人物调间距与高低；拖空白/中段绕拍 180° 轨道；轻点人物切朝向）
let dragStart = null;
let dragMoved = false;

function hitActor(pt) {
  if (!ui.hitBoxes) return null;
  for (const id of ["A", "B"]) {
    const box = ui.hitBoxes[id];
    if (box && pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h) {
      return id;
    }
  }
  return null;
}

function localPt(el, e) {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
}

stageCanvas.addEventListener("pointerdown", (e) => {
  const pt = localPt(stageCanvas, e);
  const actor = hitActor(pt);
  ui.dragging = actor || "orbit";
  ui.selectedActor = actor;
  dragMoved = false;
  dragStart = {
    x: pt.x,
    y: pt.y,
    w: pt.w,
    h: pt.h,
    ax: target.ax,
    ay: target.ay,
    bx: target.bx,
    by: target.by,
    camOrbit: target.camOrbit,
    camBAngle: target.camBAngle,
  };
  stageCanvas.setPointerCapture?.(e.pointerId);
});

stageCanvas.addEventListener("pointermove", (e) => {
  const pt = localPt(stageCanvas, e);
  if (!ui.dragging || !dragStart) {
    ui.hoveredActor = hitActor(pt);
    stageCanvas.style.cursor = ui.hoveredActor ? "move" : "grab";
    return;
  }
  const dx = pt.x - dragStart.x;
  const dy = pt.y - dragStart.y;
  if (Math.hypot(dx, dy) > 4) dragMoved = true;

  ui.activePreset = null;
  if (ui.dragging === "A") {
    target.ax = clamp(dragStart.ax + (dx / dragStart.w) * 1.15, -0.46, 0.42);
    target.ay = clamp(dragStart.ay - (dy / dragStart.h) * 0.55, -0.14, 0.24);
  } else if (ui.dragging === "B") {
    target.bx = clamp(dragStart.bx + (dx / dragStart.w) * 1.15, -0.42, 0.46);
    target.by = clamp(dragStart.by - (dy / dragStart.h) * 0.55, -0.14, 0.24);
  } else {
    // 空白处/中央横拖：平滑绕拍机位角（支持 perf.mjs 中心左右拖动实测重绘！）
    const degDelta = (dx / dragStart.w) * 145;
    if (target.activeCam === "B") {
      target.camBAngle = clamp(dragStart.camBAngle + degDelta, -175, 175);
    } else {
      target.camOrbit = clamp(dragStart.camOrbit + degDelta, -68, 68);
    }
  }
  syncControlsFromTarget(true);
  markHeroDirty();
});

function endStageDrag(e) {
  if (!ui.dragging) return;
  // 若是轻点某人物，切换该人物的视线朝向并自动归平俯仰
  if (!dragMoved && (ui.dragging === "A" || ui.dragging === "B")) {
    const cycle = ["toward", "same-right", "same-left", "away"];
    const key = ui.dragging === "A" ? "aGaze" : "bGaze";
    const pitchKey = ui.dragging === "A" ? "aPitch" : "bPitch";
    target[key] = cycle[(cycle.indexOf(target[key]) + 1) % cycle.length];
    target[pitchKey] = 0;
    ui.activePreset = null;
  }
  ui.dragging = null;
  dragStart = null;
  lastDomEvalKey = "";
  syncControlsFromTarget(false);
  markHeroDirty();
  if (e?.pointerId != null) {
    try { stageCanvas.releasePointerCapture(e.pointerId); } catch {}
  }
}
stageCanvas.addEventListener("pointerup", endStageDrag);
stageCanvas.addEventListener("pointercancel", endStageDrag);

// 键盘操作主银幕（←/→ 绕拍机位，↑/↓ 调双人间距，Space 切正反打）
stageCanvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 6 : -6;
    target.camOrbit = clamp(target.camOrbit + step, -68, 68);
    ui.activePreset = null;
    syncControlsFromTarget();
    markHeroDirty();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const delta = e.key === "ArrowUp" ? 0.03 : -0.03;
    target.ax = clamp(target.ax - delta, -0.45, -0.04);
    target.bx = clamp(target.bx + delta, 0.04, 0.45);
    ui.activePreset = null;
    syncControlsFromTarget();
    markHeroDirty();
  } else if (e.key === " ") {
    e.preventDefault();
    target.activeCam = target.activeCam === "A" ? "B" : "A";
    syncControlsFromTarget();
    markHeroDirty();
  }
});

// 俯视 180° 轴线机位盘拖动（直拖机位 1 或机位 2）
function radarAngleFromPointer(pt) {
  const g = ui.radarGeo;
  if (!g) return 0;
  const deg = (Math.atan2(pt.x - g.cx, pt.y - g.cy) * 180) / Math.PI;
  return clamp(Math.round(deg), -175, 175);
}

radarCanvas.addEventListener("pointerdown", (e) => {
  if (!ui.radarGeo) return;
  const pt = localPt(radarCanvas, e);
  const dA = Math.hypot(pt.x - ui.radarGeo.pCamA.x, pt.y - ui.radarGeo.pCamA.y);
  const dB = Math.hypot(pt.x - ui.radarGeo.pCamB.x, pt.y - ui.radarGeo.pCamB.y);
  ui.radarDragging = dA < dB && dA < 30 ? "A" : "B";
  radarCanvas.setPointerCapture?.(e.pointerId);
  const deg = radarAngleFromPointer(pt);
  if (ui.radarDragging === "A") target.camOrbit = clamp(deg, -68, 68);
  else target.camBAngle = deg;
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

radarCanvas.addEventListener("pointermove", (e) => {
  if (!ui.radarDragging) return;
  const pt = localPt(radarCanvas, e);
  const deg = radarAngleFromPointer(pt);
  if (ui.radarDragging === "A") target.camOrbit = clamp(deg, -68, 68);
  else target.camBAngle = deg;
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

const endRadarDrag = (e) => {
  ui.radarDragging = null;
  if (e?.pointerId != null) {
    try { radarCanvas.releasePointerCapture(e.pointerId); } catch {}
  }
};
radarCanvas.addEventListener("pointerup", endRadarDrag);
radarCanvas.addEventListener("pointercancel", endRadarDrag);

// 滑轨与按钮绑定
rngOrbit.addEventListener("input", () => {
  target.camOrbit = Number(rngOrbit.value);
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

rngSpan.addEventListener("input", () => {
  const span = Number(rngSpan.value) / 100;
  const mid = clamp((target.ax + target.bx) * 0.5, -0.18, 0.18);
  target.ax = clamp(mid - span * 0.5, -0.46, 0.35);
  target.bx = clamp(mid + span * 0.5, -0.35, 0.46);
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

rngDepth.addEventListener("input", () => {
  const half = Number(rngDepth.value) / 100;
  target.az = -half;
  target.bz = half;
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

rngCamB.addEventListener("input", () => {
  target.camBAngle = Number(rngCamB.value);
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

$$(".mini-pill[data-gaze-pair]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.gazePair;
    target.aGaze = mode;
    target.bGaze = mode;
    target.aPitch = 0;
    target.bPitch = 0;
    ui.activePreset = null;
    syncControlsFromTarget();
    markHeroDirty();
  });
});

$$(".tab-btn[data-scene]").forEach((btn) => {
  btn.addEventListener("click", () => {
    target.scene = btn.dataset.scene;
    syncControlsFromTarget();
    markHeroDirty();
  });
});

btnCutPreview.addEventListener("click", () => {
  target.activeCam = target.activeCam === "A" ? "B" : "A";
  syncControlsFromTarget();
  markHeroDirty();
});

btnDiagFix.addEventListener("click", () => runFixAction(currentFixAction));

$("#btn-reset-hero").addEventListener("click", () => {
  const sc = target.scene;
  Object.assign(target, INITIAL_STATE, { scene: sc });
  ui.activePreset = null;
  syncControlsFromTarget();
  markHeroDirty();
});

$$(".principle-item[data-overlay]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.overlay;
    target.overlay = target.overlay === key ? "all" : key;
    $$(".principle-item[data-overlay]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.overlay === target.overlay))
    );
    markHeroDirty();
  });
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});

// 统一雕塑感无五官侧影路径（与 302 原海报和 2D 画布造型严格一致）
const SVG_WOMAN = "M-14 -212 C4 -222 19 -208 17 -192 L21 -185 L16 -180 Q17 -173 9 -170 L7 -158 C22 -145 27 -120 24 -96 L54 -92 C64 -90 66 -80 60 -68 L74 -22 L92 -14 Q88 -6 70 -10 L52 -46 L56 -6 L72 0 L44 0 L36 -64 L-26 -62 C-30 -102 -24 -144 -14 -162 C-28 -172 -28 -202 -14 -212 Z";
const SVG_MAN = "M-12 -218 C6 -225 19 -213 18 -196 L22 -188 L17 -183 Q17 -176 10 -173 L8 -160 C24 -148 30 -118 28 -94 L62 -90 C72 -88 72 -74 66 -54 L78 -10 L94 -2 L92 3 L66 2 L52 -52 L48 -8 L64 2 L36 2 L30 -62 L-28 -60 C-32 -104 -28 -148 -14 -165 C-22 -176 -23 -208 -12 -218 Z";
const figSvg = (path, x, y, sx, sy, fill = "#33241A") =>
  `<g transform="translate(${x},${y}) scale(${sx},${sy})" fill="${fill}"><path d="${path}"/></g>`;

// ==================== 2. 01 节：四类戏剧潜台词关系矩阵 ====================
const REL_DATA = {
  equal: {
    prox: "社交近区 · 均势",
    weight: "体量比 1 : 1 · 眼线齐平",
    title: "等高对坐，棋逢对手",
    desc: "两位人物在画幅左右对称分列，头高一致、视线水平相连，中间留出约三分之一屏宽的负空间。观众会立刻读出「地位平等、有来有往」的谈判或坦诚对谈感。",
    svg: `
      <rect width="420" height="220" fill="#FBF1E3"/>
      <polygon points="65,176 355,176 420,220 0,220" fill="#D56535"/>
      <rect x="28" y="138" width="68" height="44" fill="#33241A"/>
      <rect x="324" y="138" width="68" height="44" fill="#33241A"/>
      ${figSvg(SVG_WOMAN, 74, 180, 0.56, 0.56, "#33241A")}
      ${figSvg(SVG_MAN, 346, 180, -0.56, 0.56, "#33241A")}
      <line x1="102" y1="74" x2="318" y2="74" stroke="#D56535" stroke-width="2" stroke-dasharray="6 5"/>
      <line x1="210" y1="24" x2="210" y2="196" stroke="#33241A" stroke-opacity="0.25" stroke-dasharray="4 4"/>
      <text x="210" y="60" text-anchor="middle" font-size="12" font-weight="700" fill="#963911">水平视线轴 · 0°</text>
      <text x="210" y="158" text-anchor="middle" font-size="12" font-weight="700" fill="#33241A">+ 负空间 38%</text>
    `,
  },
  power: {
    prox: "个人边界 · 强弱差",
    weight: "体量比 1.6 : 1 · 高低落差",
    title: "前景压低景，话语权一目了然",
    desc: "主导者占前景更大面积且眼位偏高，回应者退在后景且略矮。即使两人还没开口，斜向下的视线轴已经把「审视与承压」的权力结构刻进了画面里。",
    svg: `
      <rect width="420" height="220" fill="#FBF1E3"/>
      <polygon points="30,176 390,152 420,220 0,220" fill="#D56535"/>
      <rect x="24" y="132" width="84" height="58" fill="#33241A"/>
      <rect x="310" y="142" width="60" height="32" fill="#573E30"/>
      ${figSvg(SVG_WOMAN, 76, 192, 0.72, 0.72, "#33241A")}
      ${figSvg(SVG_MAN, 336, 174, -0.46, 0.46, "#573E30")}
      <line x1="108" y1="58" x2="314" y2="86" stroke="#D56535" stroke-width="2.2" stroke-dasharray="6 5"/>
      <polygon points="314,86 303,80 302,89" fill="#D56535"/>
      <text x="225" y="52" text-anchor="middle" font-size="12" font-weight="700" fill="#963911">俯压斜轴 · 主导视角</text>
    `,
  },
  rift: {
    prox: "社交远区 · 割裂张力",
    weight: "体量相等 · 中段空白放大",
    title: "背离外望，中段空隙变成一堵墙",
    desc: "把两人推向画框两侧并让视线朝外错开，中间大片负空间不再是舒服的呼吸感，而是难以逾越的心理沟壑——专用于冷战、猜忌或各怀心事的桥段。",
    svg: `
      <rect width="420" height="220" fill="#FBF1E3"/>
      <polygon points="60,176 360,176 420,220 0,220" fill="#D56535"/>
      <rect x="44" y="138" width="60" height="44" fill="#33241A"/>
      <rect x="316" y="138" width="60" height="44" fill="#33241A"/>
      ${figSvg(SVG_WOMAN, 78, 180, -0.54, 0.54, "#33241A")}
      ${figSvg(SVG_MAN, 342, 180, 0.54, 0.54, "#33241A")}
      <line x1="56" y1="76" x2="12" y2="76" stroke="#A61F15" stroke-width="2" stroke-dasharray="5 4"/>
      <line x1="364" y1="76" x2="408" y2="76" stroke="#A61F15" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="132" y="42" width="156" height="124" fill="rgba(166,31,21,0.08)" stroke="#A61F15" stroke-dasharray="4 4"/>
      <text x="210" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#A61F15">背离无交汇 · 心理隔阂</text>
    `,
  },
  allies: {
    prox: "亲密/个人区 · 并肩",
    weight: "双人合体 · 右侧大留白",
    title: "肩并肩望向同一侧，视线共享远方",
    desc: "两人紧靠却不互相打扰，共同把目光投向画幅空旷的一侧。这时候视觉重心并不在两人中间，而是借由两道平行的视线，把前方大片留白纳入了他们的共同目标。",
    svg: `
      <rect width="420" height="220" fill="#FBF1E3"/>
      <polygon points="40,176 380,176 420,220 0,220" fill="#D56535"/>
      <rect x="34" y="138" width="142" height="44" fill="#33241A"/>
      ${figSvg(SVG_WOMAN, 76, 180, 0.57, 0.57, "#33241A")}
      ${figSvg(SVG_MAN, 148, 178, 0.52, 0.52, "#573E30")}
      <line x1="176" y1="78" x2="380" y2="78" stroke="#D56535" stroke-width="2.2" stroke-dasharray="6 5"/>
      <polygon points="380,78 369,73 369,83" fill="#D56535"/>
      <text x="292" y="60" text-anchor="middle" font-size="12" font-weight="700" fill="#963911">共同视线延伸区 · 46% 留白</text>
    `,
  },
};

function renderRel(key) {
  const d = REL_DATA[key];
  if (!d) return;
  $("#rel-svg").innerHTML = d.svg;
  $("#rel-prox").textContent = d.prox;
  $("#rel-weight").textContent = d.weight;
  $("#rel-title").textContent = d.title;
  $("#rel-desc").textContent = d.desc;
  $$(".rel-btn").forEach((b) => {
    const on = b.dataset.rel === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
$$(".rel-btn").forEach((b) => b.addEventListener("click", () => renderRel(b.dataset.rel)));

// ==================== 3. 02 节：五种常见双人形式骨架解剖 ====================
const FORM_DATA = {
  symmetrical: {
    en: "SYMMETRICAL DIALOGUE",
    title: "对称对话",
    summary: "两人分坐中轴两侧，体量、高度与留白均等。它是秩序感最强的双人构图，像一座左右配重精准的天平，把观众注意力引到台词交锋本身。",
    weight: "左 50% vs 右 50%（均势平衡）",
    gaze: "水平 0° 互相对望，双箭锁定",
    use: "平等谈判、双人专访、正面摊牌、喜剧冷面幽默",
    swap: "左右互换后几何权重几乎不变，但在从左到右阅读习惯下，左方人物仍略先被扫视。",
  },
  offset: {
    en: "OFFSET DIALOGUE",
    title: "错位对话",
    summary: "打破死板的水平对称，让一人坐低、一人站高或错开半步。视线随之倾斜，瞬间打破呆板，让对话产生高低起伏的节奏与轻重主次。",
    weight: "低位近景重锚 × 高位远景呼应",
    gaze: "斜角 12°–18° 对望，自然引导扫视",
    use: "生活化交谈、强弱转换、楼梯/吧台等高低错落空间",
    swap: "互换后斜线由「左下→右上」翻为「左上→右下」，视觉动势从上升探问变为压迫收束。",
  },
  layered: {
    en: "LAYERED DEPTH",
    title: "前后层次",
    summary: "把两人沿镜头纵轴（Z 轴）拉远：前景剪影大而近，后景人物小而完整。不用切镜头就能同时呈现「观察者」和「被观察者」，层次感极强。",
    weight: "前景主导（面积约 1.6×–2.2×）× 后景回应",
    gaze: "沿纵深透视线贯通，避免正侧面遮挡",
    use: "心理悬疑、窃听/注视、过肩镜头（OTS）、长镜头调度",
    swap: "把前景主体换到右侧后，观众会先扫过空旷左侧再撞上前景重块，悬念感更强。",
  },
  samedir: {
    en: "SAME DIRECTION",
    title: "同向观看",
    summary: "两人不再面对面，而是并肩或前后错落望向同一画外目标。重点在于把两人收在画幅一侧，把另一侧大片留白让给他们共同注视的方向。",
    weight: "双人合并为一个体块 × 大片前方留白反平衡",
    gaze: "两条平行视线射向同一侧画外",
    use: "并肩看海/候车、搭档结盟、共同面对未知危机",
    swap: "整组镜像翻转后，视线从顺阅读方向（朝右展望）变为逆向回望（朝左驻足/怀旧感）。",
  },
  diagonal: {
    en: "DIAGONAL BALANCE",
    title: "对角线构图",
    summary: "把两位人物分别压在对角两端，用最长的一条画框对角线拉紧视线。它比水平对称更具动感，哪怕两人相距甚远，斜向张力也能把整幅画牢牢拽住。",
    weight: "对角力矩平衡（高远 × 低近）",
    gaze: "25°–35° 强斜轴贯通画幅中心",
    use: "楼梯追逐/隔层对话、海报错落双主角、戏剧冲突升级",
    swap: "互换对角方向会改变画面动势坡度，从「上坡仰望」切换为「下坡俯冲」。",
  },
};

const anatState = { form: "symmetrical", guides: true, swap: false };

function renderAnatomy() {
  const f = FORM_DATA[anatState.form];
  $("#anat-en").textContent = f.en;
  $("#anat-title").textContent = f.title;
  $("#anat-summary").textContent = f.summary;
  $("#anat-weight").textContent = f.weight;
  $("#anat-gaze").textContent = f.gaze;
  $("#anat-use").textContent = f.use;
  $("#anat-swap-note").textContent = f.swap;

  $$(".anat-tab").forEach((b) => {
    const on = b.dataset.form === anatState.form;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("#btn-anat-guides").classList.toggle("is-on", anatState.guides);
  $("#btn-anat-guides").setAttribute("aria-pressed", String(anatState.guides));
  $("#btn-anat-guides").textContent = anatState.guides ? "结构线：显" : "结构线：隐";

  $("#btn-anat-swap").classList.toggle("is-on", anatState.swap);
  $("#btn-anat-swap").setAttribute("aria-pressed", String(anatState.swap));
  $("#btn-anat-swap").textContent = anatState.swap ? "左右互换：已镜像" : "左右互换：原序";

  const flip = anatState.swap ? `transform="translate(520,0) scale(-1,1)"` : "";
  const gShow = anatState.guides;

  let body = "";
  if (anatState.form === "symmetrical") {
    body = `
      <polygon points="78,236 442,236 520,290 0,290" fill="#D56535"/>
      <rect x="28" y="182" width="90" height="60" fill="#33241A"/>
      <rect x="402" y="182" width="90" height="60" fill="#33241A"/>
      ${figSvg(SVG_WOMAN, 92, 238, 0.74, 0.74, "#33241A")}
      ${figSvg(SVG_MAN, 428, 238, -0.74, 0.74, "#33241A")}
      ${gShow ? `
        <line x1="260" y1="22" x2="260" y2="266" stroke="#33241A" stroke-opacity="0.3" stroke-dasharray="5 5"/>
        <line x1="126" y1="100" x2="394" y2="100" stroke="#D56535" stroke-width="2.4" stroke-dasharray="7 5"/>
        <rect x="172" y="68" width="176" height="148" fill="rgba(213,101,53,0.08)" stroke="#D56535" stroke-dasharray="4 4"/>
        <path d="M252 172h16M260 164v16" stroke="#D56535" stroke-width="2.2"/>
      ` : ""}
    `;
  } else if (anatState.form === "offset") {
    body = `
      <polygon points="0,248 520,164 520,290 0,290" fill="#4C382D"/>
      ${figSvg(SVG_WOMAN, 108, 250, 0.72, 0.72, "#33241A")}
      ${figSvg(SVG_MAN, 412, 186, -0.58, 0.58, "#33241A")}
      ${gShow ? `
        <line x1="140" y1="118" x2="386" y2="76" stroke="#D56535" stroke-width="2.4" stroke-dasharray="7 5"/>
        <line x1="140" y1="118" x2="386" y2="118" stroke="#33241A" stroke-opacity="0.28" stroke-dasharray="4 4"/>
        <circle cx="262" cy="97" r="5" fill="#D56535"/>
      ` : ""}
    `;
  } else if (anatState.form === "layered") {
    body = `
      <rect x="0" y="222" width="520" height="68" fill="#D56535"/>
      ${figSvg(SVG_WOMAN, 114, 294, 1.15, 1.15, "#33241A")}
      ${figSvg(SVG_MAN, 392, 224, -0.56, 0.56, "#573E30")}
      ${gShow ? `
        <line x1="158" y1="82" x2="366" y2="120" stroke="#D56535" stroke-width="2.4" stroke-dasharray="7 5"/>
        <rect x="38" y="34" width="144" height="190" fill="none" stroke="#33241A" stroke-width="1.5" stroke-dasharray="5 4"/>
        <rect x="348" y="96" width="84" height="128" fill="none" stroke="#D56535" stroke-width="1.5" stroke-dasharray="5 4"/>
      ` : ""}
    `;
  } else if (anatState.form === "samedir") {
    body = `
      <rect x="0" y="222" width="520" height="68" fill="#D56535"/>
      <rect x="32" y="182" width="194" height="44" fill="#33241A"/>
      ${figSvg(SVG_WOMAN, 92, 224, 0.72, 0.72, "#33241A")}
      ${figSvg(SVG_MAN, 184, 222, 0.66, 0.66, "#573E30")}
      ${gShow ? `
        <line x1="214" y1="96" x2="476" y2="96" stroke="#D56535" stroke-width="2.5" stroke-dasharray="7 5"/>
        <polygon points="476,96 464,90 464,102" fill="#D56535"/>
        <rect x="246" y="42" width="246" height="162" fill="rgba(30,96,68,0.08)" stroke="#1C5D41" stroke-dasharray="5 4"/>
      ` : ""}
    `;
  } else {
    body = `
      ${figSvg(SVG_WOMAN, 96, 146, 0.52, 0.52, "#573E30")}
      ${figSvg(SVG_MAN, 424, 276, -0.68, 0.68, "#33241A")}
      ${gShow ? `
        <line x1="120" y1="54" x2="394" y2="148" stroke="#D56535" stroke-width="2.5" stroke-dasharray="7 5"/>
        <line x1="36" y1="24" x2="484" y2="266" stroke="#33241A" stroke-opacity="0.22" stroke-dasharray="4 4"/>
        <path d="M252 117h16M260 109v16" stroke="#D56535" stroke-width="2.2"/>
      ` : ""}
    `;
  }

  $("#anat-svg").innerHTML = `
    <rect width="520" height="290" fill="#F7E5D0"/>
    <path d="M74 234 A186 186 0 0 1 446 234 Z" fill="#FBF1E3"/>
    <g ${flip}>${body}</g>
  `;
}

$$(".anat-tab").forEach((b) =>
  b.addEventListener("click", () => {
    anatState.form = b.dataset.form;
    renderAnatomy();
  })
);
$("#btn-anat-guides").addEventListener("click", () => {
  anatState.guides = !anatState.guides;
  renderAnatomy();
});
$("#btn-anat-swap").addEventListener("click", () => {
  anatState.swap = !anatState.swap;
  renderAnatomy();
});

// ==================== 4. 03 节：360° 轴线沙盘 + 实时正反打切镜监视器 ====================
const cutCanvas = $("#cut-canvas");
const rngCutDeg = $("#rng-cut-deg");
const valCutDeg = $("#val-cut-deg");
const cutVerdict = $("#cut-verdict");
const cutHeadline = $("#cut-headline");
const cutDetail = $("#cut-detail");
const btnCutAuto = $("#btn-cut-auto");

const cutState = {
  angleB: 42,
  eyeMismatch: 0,
  activeShot: 1,
  autoPlay: false,
  autoAcc: 0,
  geo: null,
  dragging: false,
};

function updateCutUI() {
  const res = evaluateCutLab(cutState);
  rngCutDeg.value = String(Math.round(cutState.angleB));
  valCutDeg.textContent = `${cutState.angleB >= 0 ? "+" : ""}${Math.round(cutState.angleB)}°`;
  cutVerdict.className = `cutlab-verdict is-${res.verdict}`;
  cutHeadline.textContent = res.headline;
  cutDetail.textContent = res.detail;
  $$(".dark-pill[data-eye-mm]").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.eyeMm) === cutState.eyeMismatch)
  );
  btnCutAuto.setAttribute("aria-pressed", String(cutState.autoPlay));
  btnCutAuto.textContent = cutState.autoPlay ? "自动轮切：开" : "自动轮切：关";
}

const cutLoop = loop(cutCanvas, (_t, dt, { still }) => {
  if (cutState.autoPlay && !still) {
    cutState.autoAcc += dt;
    if (cutState.autoAcc >= 1.35) {
      cutState.autoAcc = 0;
      cutState.activeShot = cutState.activeShot === 1 ? 2 : 1;
      cutDirty = true;
    }
  }
  if (!cutDirty && !still) return;
  cutDirty = false;
  cutState.geo = renderCutLab(cutCanvas, cutState);
});

function cutDegFromEvent(e) {
  if (!cutState.geo) return cutState.angleB;
  const pt = localPt(cutCanvas, e);
  const deg = (Math.atan2(pt.x - cutState.geo.cx, pt.y - cutState.geo.cy) * 180) / Math.PI;
  return clamp(Math.round(deg), -175, 175);
}

cutCanvas.addEventListener("pointerdown", (e) => {
  if (!cutState.geo) return;
  const pt = localPt(cutCanvas, e);
  if (Math.hypot(pt.x - cutState.geo.cx, pt.y - cutState.geo.cy) <= cutState.geo.R + 34) {
    cutState.dragging = true;
    cutState.activeShot = 2;
    cutState.angleB = cutDegFromEvent(e);
    cutCanvas.setPointerCapture?.(e.pointerId);
    updateCutUI();
    markCutDirty();
  }
});

cutCanvas.addEventListener("pointermove", (e) => {
  if (!cutState.dragging) return;
  cutState.angleB = cutDegFromEvent(e);
  updateCutUI();
  markCutDirty();
});

const endCutDrag = (e) => {
  cutState.dragging = false;
  if (e?.pointerId != null) {
    try { cutCanvas.releasePointerCapture(e.pointerId); } catch {}
  }
};
cutCanvas.addEventListener("pointerup", endCutDrag);
cutCanvas.addEventListener("pointercancel", endCutDrag);

rngCutDeg.addEventListener("input", () => {
  cutState.angleB = Number(rngCutDeg.value);
  cutState.activeShot = 2;
  updateCutUI();
  markCutDirty();
});

$$(".dark-pill[data-eye-mm]").forEach((b) => {
  b.addEventListener("click", () => {
    cutState.eyeMismatch = Number(b.dataset.eyeMm);
    cutState.activeShot = 2;
    updateCutUI();
    markCutDirty();
  });
});

$("#btn-cut-step").addEventListener("click", () => {
  cutState.activeShot = cutState.activeShot === 1 ? 2 : 1;
  markCutDirty();
});

btnCutAuto.addEventListener("click", () => {
  cutState.autoPlay = !cutState.autoPlay;
  cutState.autoAcc = 0;
  updateCutUI();
  markCutDirty();
});

$("#btn-cut-jump").addEventListener("click", () => {
  cutState.angleB = 145;
  cutState.eyeMismatch = 0;
  cutState.activeShot = 2;
  updateCutUI();
  markCutDirty();
});

// ==================== 5. 04 节：历史时间轴展开 ====================
const ERA_DATA = {
  depth: {
    kicker: "1910s–1950s · STAGING IN DEPTH",
    title: "不靠切镜，用前后景深讲完一场对手戏",
    body: "早在默片时代，法国导演路易·费雅德（Louis Feuillade）与日本导演沟口健二（Kenji Mizoguchi）就已熟练在单一长镜头里沿纵深调度两位人物——利用门框、走廊与前后景大小变化完成主次切换，无需切进特写。1941 年《公民凯恩》更以深焦镜头将前景人物与远景人物同时保持锐利，确立了「前后层次」双人构图的典范。",
    cite: "参考：David Bordwell, Figures Traced in Light: On Cinematic Staging, University of California Press, 2005。",
    svg: `
      <rect width="280" height="180" fill="#FBF1E3"/>
      <polygon points="140,162 42,26 238,26" fill="rgba(213,101,53,0.14)" stroke="#D56535" stroke-dasharray="4 3"/>
      <circle cx="116" cy="112" r="14" fill="#33241A"/>
      <circle cx="176" cy="54" r="9" fill="#573E30"/>
      <line x1="116" y1="112" x2="176" y2="54" stroke="#D56535" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="128" y="150" width="24" height="14" fill="#33241A"/>
      <text x="116" y="116" text-anchor="middle" font-size="11" font-weight="700" fill="#F7E5D0">A</text>
      <text x="176" y="58" text-anchor="middle" font-size="10" font-weight="700" fill="#F7E5D0">B</text>
      <text x="140" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="#963911">纵深 Z 轴双层调度</text>
    `,
  },
  continuity: {
    kicker: "1910s–1991 · CONTINUITY & LINE OF ACTION",
    title: "把机位锁在同一半圆，正反打才不会跳轴",
    body: "好莱坞古典连续性剪辑在 1910–1930 年代成熟后，确立了以「180° 轴线」和「视线匹配」组织双人对话的工业标准。Steven D. Katz 在 1991 年出版的经典分镜手册中用平面机位图系统阐明了这套机制，并指出过轴并非绝对禁令，而需要借助人物走位、连续推轨或轴线中性镜头来帮观众重新建立方向。",
    cite: "参考：Steven D. Katz, Film Directing Shot by Shot, Michael Wiese Productions, 1991。",
    svg: `
      <rect width="280" height="180" fill="#FBF1E3"/>
      <path d="M56 92 A84 84 0 0 0 224 92 Z" fill="rgba(28,93,65,0.13)"/>
      <line x1="34" y1="92" x2="246" y2="92" stroke="#D56535" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="96" cy="92" r="10" fill="#33241A"/>
      <circle cx="184" cy="92" r="10" fill="#963911"/>
      <circle cx="92" cy="148" r="9" fill="#1C5D41"/>
      <circle cx="188" cy="148" r="9" fill="#1C5D41"/>
      <text x="96" y="96" text-anchor="middle" font-size="10" font-weight="700" fill="#F7E5D0">A</text>
      <text x="184" y="96" text-anchor="middle" font-size="10" font-weight="700" fill="#F7E5D0">B</text>
      <text x="140" y="172" text-anchor="middle" font-size="11" font-weight="700" fill="#1C5D41">180° 同侧安全机位弧</text>
    `,
  },
  ozu: {
    kicker: "1953 · 1988 · OZU'S 360-DEGREE SPACE",
    title: "规则的清醒例外：小津安二郎的 360° 空间",
    body: "小津安二郎在《东京物语》（1953）等名作中屡屡突破好莱坞 180° 轴线，围绕人物在完整 360° 房间内切镜，甚至让对话双方几乎直面镜头开口。电影学者 David Bordwell 指出，小津之所以不让人晕头转向，是因为他改用严谨的建筑对称、一致的低机位与图形呼应重新稳住了空间秩序——规则永远服务于表达。",
    cite: "参考：David Bordwell, Ozu and the Poetics of Cinema, Princeton University Press, 1988。",
    svg: `
      <rect width="280" height="180" fill="#FBF1E3"/>
      <circle cx="140" cy="92" r="62" fill="none" stroke="#D56535" stroke-width="1.8" stroke-dasharray="5 4"/>
      <circle cx="114" cy="92" r="9" fill="#33241A"/>
      <circle cx="166" cy="92" r="9" fill="#963911"/>
      <circle cx="140" cy="30" r="8" fill="#33241A"/>
      <circle cx="140" cy="154" r="8" fill="#33241A"/>
      <circle cx="78" cy="92" r="8" fill="#D56535"/>
      <circle cx="202" cy="92" r="8" fill="#D56535"/>
      <text x="140" y="173" text-anchor="middle" font-size="11" font-weight="700" fill="#963911">360° 环绕与图形匹配</text>
    `,
  },
  proxemics: {
    kicker: "1966–2010 · PROXEMICS & VISUAL STORY",
    title: "把人际距离与镜头对比写进视觉语法",
    body: "1966 年人类学家 Edward T. Hall 提出空间关系学（Proxemics），阐明两人之间的物理空隙就是非语言信息；此后 Bruce Block（2001）从空间、明度与动势的「对比与亲和」分析相邻镜头的视觉张力，Gustavo Mercado（2010）则系统梳理了双人镜头（Two-Shot）在建立情绪距离、避免过度剪辑上的实拍准则。",
    cite: "参考：Edward T. Hall, The Hidden Dimension (Doubleday, 1966)；Bruce Block, The Visual Story (Focal Press, 2001)；Gustavo Mercado, The Filmmaker's Eye (Focal Press, 2010)。",
    svg: `
      <rect width="280" height="180" fill="#FBF1E3"/>
      <circle cx="94" cy="92" r="56" fill="none" stroke="rgba(51,36,26,0.2)" stroke-dasharray="4 4"/>
      <circle cx="94" cy="92" r="34" fill="rgba(213,101,53,0.14)" stroke="#D56535"/>
      <circle cx="94" cy="92" r="10" fill="#33241A"/>
      <circle cx="182" cy="92" r="10" fill="#963911"/>
      <line x1="106" y1="92" x2="170" y2="92" stroke="#D56535" stroke-width="2"/>
      <text x="140" y="168" text-anchor="middle" font-size="11" font-weight="700" fill="#33241A">亲密 · 个人 · 社交负空间尺度</text>
    `,
  },
};

function renderEra(key) {
  const d = ERA_DATA[key];
  if (!d) return;
  $("#tl-svg").innerHTML = d.svg;
  $("#tl-kicker").textContent = d.kicker;
  $("#tl-title").textContent = d.title;
  $("#tl-body").textContent = d.body;
  $("#tl-cite").textContent = d.cite;
  $$(".tl-node").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
$$(".tl-node").forEach((b) => b.addEventListener("click", () => renderEra(b.dataset.era)));

// ==================== 6. 05 节：拍摄情景决策开关 ====================
const SCEN_DATA = {
  react: {
    verdict: "建议：保留双人同框（推荐错位或对称中景）",
    explain: "沉默五秒的戏剧张力恰恰来自「说完话的低头」与「刚听懂的抬眼」同时发生。如果切成两个单人近景，观众就看不到两者动作的时间差与中间凝固的空气。",
  },
  tears: {
    verdict: "建议：拆成单人特写（交给 301 单人构图）",
    explain: "对手戏演员已经退到门边不再主导情绪，硬留双人全景只会稀释主角的表情浓度。切到单人近景或特写，把整块银幕让给这一刻的内心决断。",
  },
  third: {
    verdict: "建议：升级为三角站位（交给 303 三人构图）",
    explain: "调解人介入后，视线不再是一条双向线段，而是三方博弈的三角形。继续套用双人对话构图会把第三人挤成边缘路人，反而交代不清话语权转移。",
  },
  wide: {
    verdict: "建议：先一镜交代距离，随即转正反打或大远景",
    explain: "二十米以上的硬拉双人同框会把两位演员缩成微小轮廓，情绪完全看不清。先用一个远景建立空间隔阂，再严格守住 180° 轴线切单人中近景完成喊话对切。",
  },
};

function renderScenario(key) {
  const d = SCEN_DATA[key];
  if (!d) return;
  $("#scen-verdict").textContent = d.verdict;
  $("#scen-explain").textContent = d.explain;
  $$(".scen-card").forEach((b) => {
    const on = b.dataset.scen === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
$$(".scen-card").forEach((b) => b.addEventListener("click", () => renderScenario(b.dataset.scen)));

// ==================== 7. 06 节：单变量四选一审片练习 ====================
const QUIZ_FEEDBACK = {
  A: {
    ok: true,
    title: "判断准确：方案 A 同时立住了主次、负空间与对话轴线",
    body: "左方上司 A 位于前景且体量放大至 1.4×、眼位略高，天然形成主导气势；右方下属 B 退居中景倾听，两人之间保留约 34% 的呼吸负空间，并由微斜对话轴线自然相连，完全贴合「上下级谈判」的叙事目标。",
  },
  B: {
    ok: false,
    title: "差了一个变量：方案 B 把负空间压扁到了 4%",
    body: "方案 B 的主次体量和斜向视线与 A 完全相同，但两人几乎膝盖碰膝盖，失去了职场对话应有的缓冲带——画面既闷又会误读成过于私密的贴耳密谈。拉开至约 30%–40% 负空间（即方案 A）就立刻舒展。",
  },
  C: {
    ok: false,
    title: "差了一个变量：方案 C 断掉了对话轴线",
    body: "方案 C 保留了 1.4× 主次层次和 34% 舒适负空间，却把右方下属改成背向右外侧望出画外。视线不再相交，观众读到的不是「被动倾听」，而是「拒绝沟通、各自走神」。让 B 回望接住 A 的目光才是方案 A。",
  },
  D: {
    ok: false,
    title: "差了一个变量：方案 D 拉平了主次关系",
    body: "方案 D 构图本身工整成立（它正是最标准的对称对话），但 1:1 完全等大平视传递的是「棋逢对手、势均力敌」，反而抹掉了题目要求的「左方上司主导气势」。拉开前景与高矮层次（方案 A）才能把强弱差演出来。",
  },
};

const quizFeedback = $("#quiz-feedback");
$$(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const pick = card.dataset.choice;
    const fb = QUIZ_FEEDBACK[pick];
    $$(".quiz-card").forEach((c) => {
      c.classList.remove("is-correct", "is-wrong");
      if (c.dataset.choice === "A") c.classList.add("is-correct");
      else if (c.dataset.choice === pick && !fb.ok) c.classList.add("is-wrong");
    });
    quizFeedback.hidden = false;
    quizFeedback.className = `quiz-feedback ${fb.ok ? "is-correct" : "is-wrong"}`;
    $("#qf-title").textContent = fb.title;
    $("#qf-body").textContent = fb.body;
  });
});

$("#btn-quiz-retry").addEventListener("click", () => {
  $$(".quiz-card").forEach((c) => c.classList.remove("is-correct", "is-wrong"));
  quizFeedback.hidden = true;
});

// ==================== 8. 07 节：原海报放大灯箱 ====================
const lightbox = $("#poster-lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbScaleEl = $("#lb-scale");
const posterEl = $("#poster");

const lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
  lbScaleEl.textContent = `${Math.round(lb.scale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterEl.src; // 复用唯一内联海报，绝不重复打包
  lb.scale = 1;
  lb.x = 0;
  lb.y = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  $("#btn-open-poster").focus();
}

$("#btn-open-poster").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lb.scale = clamp(+(lb.scale + 0.35).toFixed(2), 0.7, 3.2);
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lb.scale = clamp(+(lb.scale - 0.35).toFixed(2), 0.7, 3.2);
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lb.scale = 1;
  lb.x = 0;
  lb.y = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lb.scale = clamp(+(lb.scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2), 0.7, 3.5);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lb.dragging = true;
  lb.sx = e.clientX;
  lb.sy = e.clientY;
  lb.ox = lb.x;
  lb.oy = lb.y;
  lbStage.setPointerCapture?.(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lb.dragging) return;
  lb.x = lb.ox + (e.clientX - lb.sx);
  lb.y = lb.oy + (e.clientY - lb.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lb.dragging = false; });
lbStage.addEventListener("pointercancel", () => { lb.dragging = false; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// 窗口尺寸变化时重绘画布
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    heroDirty = true;
    cutDirty = true;
    heroLoop.draw();
    cutLoop.draw();
  }, 60);
});

// ==================== 初始渲染 ====================
syncControlsFromTarget();
renderRel("equal");
renderAnatomy();
updateCutUI();
renderEra("depth");
renderScenario("react");
heroDirty = true;
cutDirty = true;
heroLoop.draw();
cutLoop.draw();

if (reducedMotion.matches) {
  heroDirty = true;
  cutDirty = true;
  heroLoop.draw();
  cutLoop.draw();
}
