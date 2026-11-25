// 028 偏轴构图 · 交互主控模块
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ANCHOR_MODES,
  APP_SCENES,
  CINEMA_SCENES,
  LINEAGE_ITEMS,
  LOGIC_PRESETS,
  QUIZ_ITEMS,
  SLOPE_MODES,
  clamp,
  createInitialHero,
  evaluateHero,
  evaluateLogicGrid,
} from "./model.js";
import {
  drawApplicationScene,
  drawCinemaStage,
  drawCurtainDemo,
  drawHeroStage,
  drawLineageDiagram,
  drawLogicBoard,
  drawQuizThumb,
  getHeroMetrics,
  heroToPx,
  pxToHero,
} from "./scenes.js";

// 手机端按 GUIDE.md 控制像素比上限 1.5，兼顾清晰度与软件渲染流畅度
const dpr = () => pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);

// ======================== 1. 开场主角玩具：圆窗移轴取景台 ========================
const heroState = createInitialHero();
const heroCanvas = document.getElementById("hero-canvas");
const scorePill = document.getElementById("hero-score-pill");
const titleAxisDot = document.getElementById("title-axis-dot");

const chipEls = {
  offset: document.getElementById("chip-offset"),
  balance: document.getElementById("chip-balance"),
  emphasis: document.getElementById("chip-emphasis"),
  dynamism: document.getElementById("chip-dynamism"),
};

const diagBadge = document.getElementById("diag-badge");
const diagTitle = document.getElementById("diag-title");
const diagBody = document.getElementById("diag-body");
const diagNext = document.getElementById("diag-next");
const tipLive = document.getElementById("tip-live");

const mAxis = document.getElementById("m-axis");
const mLead = document.getElementById("m-lead");
const mSpan = document.getElementById("m-span");
const mLever = document.getElementById("m-lever");

const btnFlip = document.getElementById("btn-flip");
const btnAnchor = document.getElementById("btn-anchor");
const btnSlope = document.getElementById("btn-slope");
const btnClutter = document.getElementById("btn-clutter");
const btnGuides = document.getElementById("btn-guides");
const btnReset = document.getElementById("btn-reset");
const sceneBtns = [...document.querySelectorAll("[data-scene]")];
const pillarRows = [...document.querySelectorAll("[data-pillar]")];

let heroEval = evaluateHero(heroState);
let heroDrag = null; // null | { kind: "axis"|"anchor", startX, startY, origAxisX, origAnchorX, origAnchorY, moved, pointerId, rect }
let heroDirty = true;
let heroUiDirty = true;
let heroEnterT = 0;
let heroBoxCache = null;
let lastDragUiMs = 0;
let lastDiagCode = heroEval.diag.code;

const setTxt = (el, v) => {
  if (el && el.textContent !== v) el.textContent = v;
};
const setCls = (el, v) => {
  if (el && el.className !== v) el.className = v;
};

function measureHeroBox() {
  const r = heroCanvas.getBoundingClientRect();
  heroBoxCache = { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) };
  return heroBoxCache;
}

function syncHeroUI() {
  heroEval = evaluateHero(heroState);
  const { pillars, passedCount, solved, diag, axisPct, offsetPct, leadRoomPct, sightSpanPct, sightAngleDeg, leverLabel, activeClutterCount } = heroEval;

  // 顶眉分数胶囊（差异写入，避免无效 DOM 重排）
  setTxt(scorePill, solved ? "4 / 4 偏轴成立" : `${passedCount} / 4 待偏轴`);
  setCls(scorePill, `score-pill ${solved ? "is-ok" : passedCount >= 2 ? "is-mid" : "is-err"}`);

  // 标题示范刻度点实时联动
  if (titleAxisDot) {
    const lp = `${axisPct}%`;
    if (titleAxisDot.style.left !== lp) titleAxisDot.style.left = lp;
    const bg = pillars.offset.ok ? "var(--sage)" : "var(--vermilion)";
    if (titleAxisDot.style.background !== bg) titleAxisDot.style.background = bg;
  }

  // 四枚原则圆徽状态
  for (const key of ["offset", "balance", "emphasis", "dynamism"]) {
    const el = chipEls[key];
    if (!el) continue;
    setTxt(el, pillars[key].chip);
    setCls(el, `pillar-chip ${pillars[key].ok ? "is-ok" : "is-err"}`);
  }

  // 诊单与四项实算读数
  setTxt(diagBadge, diag.badge);
  setCls(diagBadge, `diag-badge ${solved ? "is-ok" : "is-err"}`);
  setTxt(diagTitle, diag.title);
  setTxt(diagBody, diag.body);
  setTxt(diagNext, diag.next);
  setTxt(tipLive, diag.tip);

  const signStr = offsetPct > 0 ? `+${offsetPct}%` : `${offsetPct}%`;
  setTxt(mAxis, `${axisPct}%（${signStr}）`);
  setTxt(mLead, `${leadRoomPct}%`);
  setTxt(mSpan, heroState.anchorMode === "none" ? "无锚点" : `${sightSpanPct}% · ${sightAngleDeg}°`);
  setTxt(mLever, leverLabel);

  // 按钮状态同步
  setTxt(btnFlip, heroState.facing > 0 ? "朝向：朝右" : "朝向：朝左");
  setCls(btnFlip, `tool-btn ${heroEval.pillars.dynamism.ok ? "is-good" : heroEval.diag.code === "facing-wall" ? "is-warn" : ""}`);

  const aLabel = ANCHOR_MODES[heroState.anchorMode].label;
  setTxt(btnAnchor, `呼应：${aLabel}`);
  setCls(btnAnchor, `tool-btn ${heroState.anchorMode === "light" ? "is-good" : "is-warn"}`);

  setTxt(btnSlope, `坡度：${SLOPE_MODES[heroState.slopeMode].label.split(" ")[0]}`);
  setTxt(btnClutter, activeClutterCount > 0 ? `清杂物 (${activeClutterCount})` : "杂物已清");
  setCls(btnClutter, `tool-btn ${activeClutterCount > 0 ? "is-warn" : "is-good"}`);

  setTxt(btnGuides, heroState.showGuides ? "标线：开" : "标线：关");
  if (btnGuides.getAttribute("aria-pressed") !== String(heroState.showGuides)) {
    btnGuides.setAttribute("aria-pressed", String(heroState.showGuides));
  }

  for (const b of sceneBtns) {
    const active = b.dataset.scene === heroState.scene;
    if (b.classList.contains("is-active") !== active) {
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  }

  for (const row of pillarRows) {
    const hl = heroState.highlightPillar === row.dataset.pillar;
    if (row.classList.contains("is-hl") !== hl) {
      row.classList.toggle("is-hl", hl);
      row.setAttribute("aria-pressed", String(hl));
    }
  }

  heroUiDirty = false;
  heroDirty = true;
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  if (still) {
    heroEnterT = 1;
    if (heroUiDirty) syncHeroUI();
    drawHeroStage(heroCanvas, heroState, heroEval, { dpr: dpr(), t: 0, enter: 1, dragKind: null, size: heroBoxCache || measureHeroBox() });
    heroDirty = false;
    return;
  }
  if (heroEnterT < 1) {
    heroEnterT = Math.min(1, heroEnterT + (dt || 0.016) * 1.8);
    heroDirty = true;
  }
  if (!heroDirty && !heroUiDirty) return;
  const sz = heroBoxCache || measureHeroBox();
  if (heroUiDirty) {
    const nowMs = performance.now();
    const codeChanged = heroEval.diag.code !== lastDiagCode;
    if (!heroDrag || codeChanged || nowMs - lastDragUiMs >= 90) {
      lastDragUiMs = nowMs;
      lastDiagCode = heroEval.diag.code;
      syncHeroUI();
    }
  }
  drawHeroStage(heroCanvas, heroState, heroEval, {
    dpr: dpr(),
    t,
    enter: heroEnterT,
    dragKind: heroDrag ? heroDrag.kind : null,
    size: sz,
  });
  heroDirty = false;
});

function getCanvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top, w: rect.width, h: rect.height };
}

function handleHeroDown(clientX, clientY, pointerId = 0) {
  const rect = heroCanvas.getBoundingClientRect();
  heroBoxCache = { w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) };
  const pt = { x: clientX - rect.left, y: clientY - rect.top, w: rect.width, h: rect.height };
  const m = getHeroMetrics(pt.w, pt.h);

  // 1. 优先命中带红圈的杂块（点击清除）
  for (const c of heroState.clutter) {
    if (!c.active) continue;
    const cp = heroToPx(c.x, c.y, m);
    if (Math.hypot(pt.x - cp.x, pt.y - cp.y) <= 32) {
      c.active = false;
      syncHeroUI();
      heroLoop.draw();
      return;
    }
  }

  // 2. 命中远端呼应锚点 -> 直接拖拽锚点位置
  if (heroState.anchorMode !== "none") {
    const ap = heroToPx(heroState.anchorX, heroState.anchorY, m);
    if (Math.hypot(pt.x - ap.x, pt.y - ap.y) <= 34) {
      heroDrag = {
        kind: "anchor",
        startX: pt.x,
        startY: pt.y,
        origAnchorX: heroState.anchorX,
        origAnchorY: heroState.anchorY,
        moved: false,
        pointerId,
        rect,
      };
      return;
    }
  }

  // 3. 命中主体 -> 若只轻点未拖则转身，若左右拖动则移轴
  const subFoot = heroToPx(heroEval.geom.sx, heroEval.geom.footY, m);
  const subMidY = (subFoot.y + heroToPx(heroEval.geom.sx, heroEval.geom.headY, m).y) * 0.5;
  const hitSubject = Math.hypot(pt.x - subFoot.x, pt.y - subMidY) <= 44;

  heroDrag = {
    kind: "axis",
    hitSubject,
    startX: pt.x,
    startY: pt.y,
    origAxisX: heroState.axisX,
    moved: false,
    pointerId,
    rect,
  };
}

function handleHeroMove(clientX, clientY) {
  if (!heroDrag) return;
  const rect = heroDrag.rect;
  const pt = { x: clientX - rect.left, y: clientY - rect.top, w: rect.width, h: rect.height };
  const m = getHeroMetrics(pt.w, pt.h);
  const dx = pt.x - heroDrag.startX;
  const dy = pt.y - heroDrag.startY;
  if (Math.hypot(dx, dy) > 5) heroDrag.moved = true;

  if (heroDrag.kind === "anchor") {
    const n = pxToHero(pt.x, pt.y, m);
    heroState.anchorX = clamp(n.x, 0.12, 0.88);
    heroState.anchorY = clamp(n.y, 0.16, 0.62);
  } else {
    const deltaNorm = dx / Math.max(120, m.frame.w);
    heroState.axisX = clamp(heroDrag.origAxisX + deltaNorm, 0.1, 0.9);
  }
  heroEval = evaluateHero(heroState);
  heroUiDirty = true;
  heroDirty = true;
  // 拖动期间交由 rAF 单次合并重绘与 DOM 差异更新，彻底避免每帧强制同步回流（FSL）
  if (reducedMotion.matches) {
    syncHeroUI();
    heroLoop.draw();
  }
}

function handleHeroUp() {
  if (!heroDrag) return;
  if (heroDrag.kind === "axis" && heroDrag.hitSubject && !heroDrag.moved) {
    heroState.facing = heroState.facing > 0 ? -1 : 1;
  }
  heroDrag = null;
  syncHeroUI();
  heroLoop.draw();
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  heroCanvas.setPointerCapture?.(e.pointerId);
  handleHeroDown(e.clientX, e.clientY, e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!heroDrag) return;
  handleHeroMove(e.clientX, e.clientY);
});

heroCanvas.addEventListener("pointerup", () => handleHeroUp());
heroCanvas.addEventListener("pointercancel", () => {
  heroDrag = null;
});

// 触控兜底（确保 CDP touchStart/touchMove 精确触发拖动与实时重画）
heroCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches.length || heroDrag) return;
    const tc = e.touches[0];
    handleHeroDown(tc.clientX, tc.clientY, tc.identifier);
  },
  { passive: true },
);

heroCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!heroDrag || !e.touches.length) return;
    const tc = e.touches[0];
    handleHeroMove(tc.clientX, tc.clientY);
  },
  { passive: true },
);

heroCanvas.addEventListener("touchend", () => handleHeroUp());

// 键盘操控：← → 精细移轴，Shift 步进 5%，F 翻转朝向
heroCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.05 : 0.02;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    heroState.axisX = clamp(heroState.axisX - step, 0.1, 0.9);
    syncHeroUI();
    heroLoop.draw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    heroState.axisX = clamp(heroState.axisX + step, 0.1, 0.9);
    syncHeroUI();
    heroLoop.draw();
  } else if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    heroState.facing = heroState.facing > 0 ? -1 : 1;
    syncHeroUI();
    heroLoop.draw();
  }
});

// 工具栏按钮绑定
for (const b of sceneBtns) {
  b.addEventListener("click", () => {
    heroState.scene = b.dataset.scene;
    syncHeroUI();
    heroLoop.draw();
  });
}

btnFlip.addEventListener("click", () => {
  heroState.facing = heroState.facing > 0 ? -1 : 1;
  syncHeroUI();
  heroLoop.draw();
});

btnAnchor.addEventListener("click", () => {
  const order = ["rival", "light", "none"];
  const next = order[(order.indexOf(heroState.anchorMode) + 1) % order.length];
  heroState.anchorMode = next;
  // 切回轻巧呼应时，若之前在中心正上方重叠，温和给一个初始可见位置但仍留给用户微调空间
  syncHeroUI();
  heroLoop.draw();
});

btnSlope.addEventListener("click", () => {
  const order = ["level", "gentle", "steep"];
  heroState.slopeMode = order[(order.indexOf(heroState.slopeMode) + 1) % order.length];
  syncHeroUI();
  heroLoop.draw();
});

btnClutter.addEventListener("click", () => {
  const anyActive = heroState.clutter.some((c) => c.active);
  for (const c of heroState.clutter) c.active = !anyActive;
  syncHeroUI();
  heroLoop.draw();
});

btnGuides.addEventListener("click", () => {
  heroState.showGuides = !heroState.showGuides;
  syncHeroUI();
  heroLoop.draw();
});

btnReset.addEventListener("click", () => {
  Object.assign(heroState, createInitialHero());
  syncHeroUI();
  heroLoop.draw();
});

for (const row of pillarRows) {
  row.addEventListener("click", () => {
    const key = row.dataset.pillar;
    heroState.highlightPillar = heroState.highlightPillar === key ? null : key;
    syncHeroUI();
    heroLoop.draw();
  });
}

// ======================== 2. 01 节：双帧同步独帆对照器 ========================
const curtainCanvas = document.getElementById("curtain-canvas");
const curtainRange = document.getElementById("curtain-range");
const curtainPct = document.getElementById("curtain-pct");
const btnCurtainPaths = document.getElementById("btn-curtain-paths");

let curtainAxis = 0.24;
let curtainShowPaths = true;
let curtainDragging = false;
let curtainDirty = true;

function renderCurtain(t = 0) {
  curtainPct.textContent = `${Math.round(curtainAxis * 100)}%`;
  drawCurtainDemo(curtainCanvas, curtainAxis, curtainShowPaths, dpr(), t);
  curtainDirty = false;
}

const curtainLoop = loop(curtainCanvas, (t, _dt, { still }) => {
  if (still || curtainDirty) renderCurtain(still ? 0 : t);
});

curtainRange.addEventListener("input", () => {
  curtainAxis = Number(curtainRange.value) / 100;
  renderCurtain(0);
});

btnCurtainPaths.addEventListener("click", () => {
  curtainShowPaths = !curtainShowPaths;
  btnCurtainPaths.setAttribute("aria-pressed", String(curtainShowPaths));
  btnCurtainPaths.textContent = curtainShowPaths ? "视线轨迹：显示" : "视线轨迹：隐藏";
  renderCurtain(0);
});

curtainCanvas.addEventListener("pointerdown", (e) => {
  const r = curtainCanvas.getBoundingClientRect();
  const rel = (e.clientX - r.left) / r.width;
  if (rel < 0.5) return; // 左帧为固定参照，拖右帧改变偏轴位
  curtainDragging = true;
  curtainCanvas.setPointerCapture?.(e.pointerId);
  curtainAxis = clamp((rel - 0.51) / 0.49, 0.18, 0.82);
  curtainRange.value = String(Math.round(curtainAxis * 100));
  renderCurtain(0);
});

curtainCanvas.addEventListener("pointermove", (e) => {
  if (!curtainDragging) return;
  const r = curtainCanvas.getBoundingClientRect();
  const rel = (e.clientX - r.left) / r.width;
  curtainAxis = clamp((rel - 0.51) / 0.49, 0.18, 0.82);
  curtainRange.value = String(Math.round(curtainAxis * 100));
  renderCurtain(0);
});

curtainCanvas.addEventListener("pointerup", () => {
  curtainDragging = false;
});

// ======================== 3. 02 节：构图逻辑方格配重板 ========================
const logicCanvas = document.getElementById("logic-canvas");
const logicVerdict = document.getElementById("logic-verdict");
const logicExplain = document.getElementById("logic-explain");
const logicPresetNote = document.getElementById("logic-preset-note");
const logicBtns = [...document.querySelectorAll("[data-logic]")];

let logicState = {
  presetId: "poster",
  subject: { ...LOGIC_PRESETS.poster.subject },
  weightBox: { ...LOGIC_PRESETS.poster.weightBox },
  kind: LOGIC_PRESETS.poster.kind,
};

function renderLogic() {
  const ev = evaluateLogicGrid(logicState.subject, logicState.weightBox, logicState.kind);
  logicVerdict.textContent = ev.verdict;
  logicVerdict.className = ev.balanced ? "verdict-ok" : "verdict-err";
  logicExplain.textContent = ev.explain;
  drawLogicBoard(logicCanvas, logicState.subject, logicState.weightBox, logicState.kind, ev, dpr());
}

for (const b of logicBtns) {
  b.addEventListener("click", () => {
    const p = LOGIC_PRESETS[b.dataset.logic];
    if (!p) return;
    logicState = {
      presetId: p.id,
      subject: { ...p.subject },
      weightBox: { ...p.weightBox },
      kind: p.kind,
    };
    logicPresetNote.textContent = p.note;
    for (const o of logicBtns) {
      const act = o === b;
      o.classList.toggle("is-active", act);
      o.setAttribute("aria-pressed", String(act));
    }
    renderLogic();
  });
}

logicCanvas.addEventListener("click", (e) => {
  const r = logicCanvas.getBoundingClientRect();
  const px = e.clientX - r.left;
  const py = e.clientY - r.top;
  const pad = 16;
  const bw = r.width - pad * 2;
  const bh = r.height * 0.72 - pad;
  if (px < pad || px > pad + bw || py < pad || py > pad + bh) return;
  const col = clamp(Math.floor(((px - pad) / bw) * 6), 0, 6 - logicState.weightBox.w);
  const row = clamp(Math.floor(((py - pad) / bh) * 4), 0, 4 - logicState.weightBox.h);
  logicState.weightBox = { ...logicState.weightBox, col, row };
  renderLogic();
});

// ======================== 4. 03 节：2.39:1 电影朝向剧场 ========================
const cinemaCanvas = document.getElementById("cinema-canvas");
const cinemaTabs = [...document.querySelectorAll("[data-cinema]")];
const btnCinemaFacing = document.getElementById("btn-cinema-facing");
const btnCinemaSide = document.getElementById("btn-cinema-side");
const cinemaTag = document.getElementById("cinema-tag");
const cinemaNote = document.getElementById("cinema-note");

const cinemaState = {
  sceneId: "runner",
  axisIndex: 0, // 0: 0.26 左偏, 1: 0.50 居中, 2: 0.74 右偏
  facingMode: "open", // "open" | "short"
};
const CINEMA_AXES = [
  { val: 0.26, label: "左偏 26%" },
  { val: 0.5, label: "居中 50%" },
  { val: 0.74, label: "右偏 74%" },
];

function syncCinemaUI(t = 0) {
  const sc = CINEMA_SCENES[cinemaState.sceneId];
  const ax = CINEMA_AXES[cinemaState.axisIndex];
  const isCenter = ax.val === 0.5;
  const isShort = cinemaState.facingMode === "short" && !isCenter;

  btnCinemaFacing.textContent = cinemaState.facingMode === "open" ? "当前：面朝宽边（开放）" : "当前：面朝窄边（反留白）";
  btnCinemaSide.textContent = `轴位：${ax.label}`;

  const openDir = ax.val <= 0.5 ? 1 : -1;
  const facing = cinemaState.facingMode === "open" ? openDir : -openDir;
  const leadPct = Math.round((facing > 0 ? 1 - ax.val : ax.val) * 100);
  const dirWord = facing > 0 ? "右" : "左";

  if (isCenter) {
    cinemaTag.textContent = "居中对称 · 静态中立";
    cinemaTag.className = "dark-pill is-warn";
    cinemaNote.textContent = "人物站回 50% 正中后，左右空间完全均分，无论是向前奔跑还是制造悬疑压迫，方向张力都会明显回落。";
  } else if (isShort) {
    cinemaTag.textContent = cinemaState.sceneId === "thriller" ? "刻意短边 · 悬疑压迫" : "短边撞框 · 视线堵死";
    cinemaTag.className = "dark-pill is-warn";
    cinemaNote.textContent = sc.shortNote(leadPct);
  } else {
    cinemaTag.textContent = "正向留白 · 开放预期";
    cinemaTag.className = "dark-pill is-good";
    cinemaNote.textContent = sc.openNote(leadPct, dirWord);
  }

  for (const b of cinemaTabs) {
    const act = b.dataset.cinema === cinemaState.sceneId;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  }
  drawCinemaStage(cinemaCanvas, cinemaState.sceneId, ax.val, cinemaState.facingMode, dpr(), t);
}

let cinemaDirty = true;
const cinemaLoop = loop(cinemaCanvas, (t, _dt, { still }) => {
  if (still || cinemaDirty) {
    syncCinemaUI(still ? 0 : t);
    cinemaDirty = false;
  }
});

for (const b of cinemaTabs) {
  b.addEventListener("click", () => {
    cinemaState.sceneId = b.dataset.cinema;
    // 切到悬疑镜头时默认展示反留白张力
    cinemaState.facingMode = cinemaState.sceneId === "thriller" ? "short" : "open";
    syncCinemaUI(0);
  });
}

btnCinemaFacing.addEventListener("click", () => {
  cinemaState.facingMode = cinemaState.facingMode === "open" ? "short" : "open";
  syncCinemaUI(0);
});

btnCinemaSide.addEventListener("click", () => {
  cinemaState.axisIndex = (cinemaState.axisIndex + 1) % CINEMA_AXES.length;
  syncCinemaUI(0);
});

// ======================== 5. 04 节：史料脉络展签 ========================
const lineageCanvas = document.getElementById("lineage-canvas");
const lineageTabs = [...document.querySelectorAll("[data-lineage]")];
const lineageEls = {
  era: document.getElementById("lineage-era"),
  title: document.getElementById("lineage-title"),
  en: document.getElementById("lineage-en"),
  meta: document.getElementById("lineage-meta"),
  summary: document.getElementById("lineage-summary"),
  takeaway: document.getElementById("lineage-takeaway"),
  axis: document.getElementById("lineage-axis-tag"),
};

let lineageIndex = 0;

function renderLineage() {
  const item = LINEAGE_ITEMS[lineageIndex];
  lineageEls.era.textContent = item.era;
  lineageEls.title.textContent = item.title;
  lineageEls.en.textContent = item.en;
  lineageEls.meta.textContent = item.meta;
  lineageEls.summary.textContent = item.summary;
  lineageEls.takeaway.textContent = item.takeaway;
  lineageEls.axis.textContent = item.axis;

  for (const b of lineageTabs) {
    const act = Number(b.dataset.lineage) === lineageIndex;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-selected", String(act));
  }
  drawLineageDiagram(lineageCanvas, item, dpr());
}

for (const b of lineageTabs) {
  b.addEventListener("click", () => {
    lineageIndex = Number(b.dataset.lineage);
    renderLineage();
  });
}

// ======================== 6. 05 节：原海报四大应用场景 ========================
const appCanvas = document.getElementById("app-canvas");
const appItems = [...document.querySelectorAll("[data-app]")];
const appModeBtns = [...document.querySelectorAll("[data-app-mode]")];
const appDetailTitle = document.getElementById("app-detail-title");
const appDetailText = document.getElementById("app-detail-text");

let appIndex = 0;
let appIsGood = true;

function renderApp() {
  const item = APP_SCENES[appIndex];
  appDetailTitle.textContent = appIsGood ? item.goodTitle : item.badTitle;
  appDetailText.textContent = appIsGood ? item.goodText : item.badText;

  for (const b of appItems) {
    const act = Number(b.dataset.app) === appIndex;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-selected", String(act));
  }
  for (const b of appModeBtns) {
    const act = (b.dataset.appMode === "good") === appIsGood;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-pressed", String(act));
  }
  drawApplicationScene(appCanvas, item.id, appIsGood, dpr());
}

for (const b of appItems) {
  b.addEventListener("click", () => {
    appIndex = Number(b.dataset.app);
    renderApp();
  });
}

for (const b of appModeBtns) {
  b.addEventListener("click", () => {
    appIsGood = b.dataset.appMode === "good";
    renderApp();
  });
}

// ======================== 7. 06 节：什么时候别用（SVG 微图示切换） ========================
const antiState = { ceremony: false, tiny: false, dense: false, noisy: false };

const ANTI_LABELS = {
  ceremony: ["当前：错用偏轴 · 点看改用中轴", "当前：改用中轴对称 · 点回看错例"],
  tiny: ["当前：错用偏轴 · 点看改用居中", "当前：改用居中稳识 · 点回看错例"],
  dense: ["当前：错用偏轴 · 点看均衡网格", "当前：改用均衡表单 · 点回看错例"],
  noisy: ["当前：错用偏轴 · 点看近景压满", "当前：改用居中压满 · 点回看错例"],
};

function antiSVG(kind, fixed) {
  if (kind === "ceremony") {
    return fixed
      ? `<svg viewBox="0 0 160 120"><line x1="80" y1="8" x2="80" y2="112" stroke="#1B665D" stroke-dasharray="4 3" stroke-width="1.3"/><polygon points="80,22 104,50 56,50" fill="#372540"/><rect x="60" y="52" width="40" height="44" fill="#372540"/><circle cx="80" cy="70" r="9" fill="#F05A3B"/><rect x="46" y="96" width="68" height="8" fill="#5A4963"/></svg>`
      : `<svg viewBox="0 0 160 120"><line x1="36" y1="8" x2="36" y2="112" stroke="#B4341C" stroke-dasharray="4 3" stroke-width="1.3"/><polygon points="36,24 58,50 14,50" fill="#372540"/><rect x="18" y="52" width="36" height="44" fill="#372540"/><circle cx="36" cy="70" r="8" fill="#F05A3B"/><rect x="10" y="96" width="52" height="8" fill="#5A4963"/></svg>`;
  }
  if (kind === "tiny") {
    return fixed
      ? `<svg viewBox="0 0 160 120"><rect x="46" y="26" width="68" height="68" rx="14" fill="#372540"/><circle cx="80" cy="60" r="18" fill="#F05A3B"/><circle cx="80" cy="60" r="6" fill="#FAF5F3"/></svg>`
      : `<svg viewBox="0 0 160 120"><rect x="46" y="26" width="68" height="68" rx="14" fill="#372540"/><circle cx="62" cy="74" r="13" fill="#F05A3B"/><line x1="80" y1="26" x2="80" y2="94" stroke="#FF7B61" stroke-dasharray="3 3" stroke-width="1.1"/></svg>`;
  }
  if (kind === "dense") {
    return fixed
      ? `<svg viewBox="0 0 160 120"><rect x="14" y="16" width="132" height="16" fill="#372540"/><rect x="14" y="40" width="62" height="28" fill="#FAF5F3" stroke="#372540"/><rect x="84" y="40" width="62" height="28" fill="#FAF5F3" stroke="#372540"/><rect x="14" y="76" width="132" height="28" fill="#FAF5F3" stroke="#1B665D" stroke-width="1.5"/></svg>`
      : `<svg viewBox="0 0 160 120"><rect x="14" y="16" width="46" height="14" fill="#372540"/><rect x="14" y="36" width="46" height="14" fill="#FAF5F3" stroke="#B4341C"/><rect x="14" y="56" width="46" height="14" fill="#FAF5F3" stroke="#B4341C"/><rect x="14" y="76" width="46" height="14" fill="#FAF5F3" stroke="#B4341C"/><rect x="14" y="96" width="46" height="12" fill="#FAF5F3" stroke="#B4341C"/><line x1="72" y1="14" x2="146" y2="106" stroke="#B4341C" stroke-dasharray="4 4" stroke-width="1.2"/></svg>`;
  }
  return fixed
    ? `<svg viewBox="0 0 160 120"><rect x="10" y="12" width="140" height="96" fill="#DDD4DC"/><circle cx="80" cy="58" r="34" fill="#372540"/><circle cx="80" cy="58" r="14" fill="#F05A3B"/></svg>`
    : `<svg viewBox="0 0 160 120"><rect x="10" y="12" width="140" height="96" fill="#DDD4DC"/><circle cx="38" cy="64" r="18" fill="#372540"/><rect x="72" y="22" width="22" height="36" fill="#7D6B85"/><rect x="104" y="30" width="18" height="48" fill="#5A4963"/><circle cx="132" cy="42" r="12" fill="#B4341C"/><rect x="76" y="70" width="58" height="16" fill="#6F5C78"/></svg>`;
}

function renderAnti(kind) {
  const fixed = antiState[kind];
  const box = document.getElementById(`anti-svg-${kind}`);
  const btn = document.querySelector(`[data-anti-toggle="${kind}"]`);
  if (box) box.innerHTML = antiSVG(kind, fixed);
  if (btn) {
    btn.setAttribute("aria-pressed", String(fixed));
    btn.textContent = ANTI_LABELS[kind][fixed ? 1 : 0];
  }
}

for (const kind of Object.keys(antiState)) {
  renderAnti(kind);
  const btn = document.querySelector(`[data-anti-toggle="${kind}"]`);
  btn?.addEventListener("click", () => {
    antiState[kind] = !antiState[kind];
    renderAnti(kind);
  });
}

// ======================== 8. 07 节：眼力测验（纯中性选项单变量盲测） ========================
const quizRoot = document.getElementById("quiz-root");
const quizPicked = {}; // { q1: null | "A"|"B"|"C"|"D" }

function buildQuiz() {
  quizRoot.innerHTML = "";
  for (const q of QUIZ_ITEMS) {
    const card = document.createElement("article");
    card.className = "quiz-card";
    card.dataset.quiz = q.id;
    card.innerHTML = `
      <div class="quiz-head">
        <strong>第 ${q.index} 题</strong>
        <span class="quiz-var">${q.variable}</span>
      </div>
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-grid"></div>
      <div class="quiz-feedback" id="fb-${q.id}" hidden aria-live="polite">
        <p class="quiz-fb-text"></p>
        <button type="button" class="chip-btn" data-quiz-reset="${q.id}">重做本题</button>
      </div>
    `;
    const grid = card.querySelector(".quiz-grid");
    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.dataset.q = q.id;
      btn.dataset.opt = opt.key;
      btn.innerHTML = `
        <canvas class="quiz-thumb" data-mode="${opt.mode}" aria-hidden="true"></canvas>
        <span class="quiz-opt-label">方案 ${opt.key}</span>
      `;
      btn.addEventListener("click", () => {
        quizPicked[q.id] = opt.key;
        syncQuizCard(q, card);
      });
      grid.append(btn);
    }
    card.querySelector(`[data-quiz-reset="${q.id}"]`).addEventListener("click", () => {
      delete quizPicked[q.id];
      syncQuizCard(q, card);
    });
    quizRoot.append(card);
    syncQuizCard(q, card);
  }
}

function syncQuizCard(q, card) {
  const picked = quizPicked[q.id];
  const revealed = Boolean(picked);
  const fb = card.querySelector(`#fb-${q.id}`);
  const fbText = fb.querySelector(".quiz-fb-text");

  for (const btn of card.querySelectorAll(".quiz-opt")) {
    const k = btn.dataset.opt;
    btn.classList.remove("is-picked-ok", "is-picked-err", "is-answer-hint");
    if (revealed) {
      if (k === picked && k === q.answer) btn.classList.add("is-picked-ok");
      else if (k === picked) btn.classList.add("is-picked-err");
      else if (k === q.answer) btn.classList.add("is-answer-hint");
    }
    const cv = btn.querySelector("canvas");
    drawQuizThumb(cv, cv.dataset.mode, dpr(), revealed);
  }

  if (!revealed) {
    fb.hidden = true;
    return;
  }
  const opt = q.options.find((o) => o.key === picked);
  const right = picked === q.answer;
  fb.hidden = false;
  fb.className = `quiz-feedback ${right ? "is-ok" : "is-err"}`;
  fbText.textContent = `${right ? "选对了" : `你选了方案 ${picked}（正解为方案 ${q.answer}）`}：${opt.why}`;
}

// ======================== 9. 08 节：原海报放大灯箱 ========================
const posterImg = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const lbClose = document.getElementById("lb-close");
const lbIn = document.getElementById("lb-zoom-in");
const lbOut = document.getElementById("lb-zoom-out");
const lbReset = document.getElementById("lb-zoom-reset");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLightboxTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterOpen.focus();
}

posterOpen.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbIn.addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 1, 3.2);
  applyLightboxTransform();
});
lbOut.addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 1, 3.2);
  if (lbScale <= 1.01) {
    lbTx = 0;
    lbTy = 0;
  }
  applyLightboxTransform();
});
lbReset.addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target === lbViewport && lbScale <= 1.01) {
    closeLightbox();
    return;
  }
  lbDrag = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  lbViewport.setPointerCapture?.(e.pointerId);
});

lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbDrag.x;
  lbTy = e.clientY - lbDrag.y;
  applyLightboxTransform();
});

lbViewport.addEventListener("pointerup", () => {
  lbDrag = null;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ======================== 10. 初始化与窗口自适应重绘 ========================
function redrawAllStatic() {
  heroBoxCache = null;
  heroDirty = true;
  heroUiDirty = true;
  curtainDirty = true;
  cinemaDirty = true;
  heroLoop.draw();
  renderCurtain(0);
  renderLogic();
  syncCinemaUI(0);
  renderLineage();
  renderApp();
  for (const q of QUIZ_ITEMS) {
    const card = quizRoot.querySelector(`[data-quiz="${q.id}"]`);
    if (card) syncQuizCard(q, card);
  }
}

syncHeroUI();
buildQuiz();
redrawAllStatic();

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(redrawAllStatic, 80);
});

reducedMotion.addEventListener("change", () => redrawAllStatic());
