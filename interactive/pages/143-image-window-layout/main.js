// 143 图片 窗口版式 — 主交互引擎（开场墙面开窗裁景台 + 八节互动）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  APERTURE_SHAPES,
  CURTAIN_SCENES,
  HISTORY_PLATES,
  INITIAL_BROKEN_WINDOWS,
  LIMITS,
  POSTER_REF_WINDOWS,
  QUIZ_OPTIONS,
  SHAPES,
  SHAPE_ORDER,
  SPREAD_CASES,
  clampWindow,
  cloneWindows,
  evaluateWall,
  findNewWindowSlot,
  pointInWindow,
} from "./model.js";
import {
  createStageCache,
  renderCurtainScene,
  renderStressCanvas,
  renderTitleMiniWindow,
  renderWallStage,
} from "./artwork.js";

// =========================================================
// 1. 开场「墙面开窗裁景台」状态与核心交互
// =========================================================
const wallFrame = document.getElementById("wall-frame");
const wallCanvas = document.getElementById("wall-canvas");
const resizeHandle = document.getElementById("win-resize");
const sealFloat = document.getElementById("win-seal-float");
const miniWinDesktop = document.getElementById("title-mini-win");
const miniWinMobile = document.getElementById("title-mini-win-m");

const diagBadge = document.getElementById("diag-badge");
const diagScore = document.getElementById("diag-score");
const diagHeadline = document.getElementById("diag-headline");
const diagWhy = document.getElementById("diag-why");
const mOpen = document.getElementById("m-open");
const mRatio = document.getElementById("m-ratio");
const mCount = document.getElementById("m-count");
const scheduleList = document.getElementById("schedule-list");
const kwLamps = document.getElementById("kw-lamps");

const shapeBtns = [...document.querySelectorAll(".shape-btn")];
const btnAddWin = document.getElementById("btn-add-win");
const btnSealWin = document.getElementById("btn-seal-win");
const btnXray = document.getElementById("btn-xray");
const btnReset = document.getElementById("btn-reset");
const btnRef = document.getElementById("btn-ref");

let nextWinSeq = 7;

const heroState = {
  windows: cloneWindows(INITIAL_BROKEN_WINDOWS),
  activeId: "w1", // 默认选中左上窗，其右下角拉框柄落在画布水平中心附近
  xrayOn: false,
  xrayAlpha: 0,
  introProgress: 0.72, // 首帧即清晰可见，开场柔和展开至 1
  dirty: true,
};

let stageCache = null;
let lastEval = evaluateWall(heroState.windows);

function ensureWallCanvasSize() {
  const rect = wallFrame.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const tw = Math.max(240, Math.round(rect.width * dpr));
  const th = Math.max(250, Math.round(rect.height * dpr));
  if (wallCanvas.width !== tw || wallCanvas.height !== th || !stageCache) {
    wallCanvas.width = tw;
    wallCanvas.height = th;
    stageCache = createStageCache(tw, th);
    heroState.dirty = true;
  }
}

function getActiveWindow() {
  return heroState.windows.find((w) => w.id === heroState.activeId) || null;
}

function syncHandlesPosition() {
  const win = getActiveWindow();
  if (!win) {
    resizeHandle.hidden = true;
    sealFloat.hidden = true;
    return;
  }
  resizeHandle.hidden = false;
  sealFloat.hidden = false;
  // 把手落在当前窗口右下角（留出安全边距防止贴出画面）
  const rx = Math.max(0.06, Math.min(0.95, win.x + win.w));
  const ry = Math.max(0.06, Math.min(0.95, win.y + win.h));
  resizeHandle.style.left = `${rx * 100}%`;
  resizeHandle.style.top = `${ry * 100}%`;

  const sx = Math.max(0.06, Math.min(0.95, win.x + win.w));
  const sy = Math.max(0.06, Math.min(0.94, win.y));
  sealFloat.style.left = `${sx * 100}%`;
  sealFloat.style.top = `${sy * 100}%`;
}

function updateHeroReadout() {
  lastEval = evaluateWall(heroState.windows);
  const r = lastEval;

  diagBadge.textContent = r.badge;
  diagBadge.dataset.kind = r.statusKind;
  diagScore.textContent = `体检 ${r.passCount}/4`;
  diagHeadline.textContent = r.headline;
  diagWhy.textContent = r.why;

  mOpen.textContent = `${r.openPct}%`;
  mOpen.className = `mono ${r.openRatio >= LIMITS.openMin && r.openRatio <= LIMITS.openMax ? "is-ok" : "is-bad"}`;

  mRatio.textContent = r.ratioText;
  mRatio.className = `mono ${r.count === 1 || (r.count >= 2 && r.heroToSecondRatio >= LIMITS.minHierarchyRatio) ? "is-ok" : "is-bad"}`;

  mCount.textContent = `${r.count} 扇`;
  mCount.className = `mono ${r.count >= 1 && r.count <= LIMITS.maxWindows ? "is-ok" : "is-bad"}`;

  // 四枚原海报关键词体检灯
  for (const li of kwLamps.querySelectorAll("li[data-check]")) {
    const key = li.dataset.check;
    li.dataset.pass = String(!!r.checks[key]);
  }

  // 同步当前窗型按钮与禁用状态
  const activeWin = getActiveWindow();
  shapeBtns.forEach((btn) => {
    const on = activeWin && activeWin.shape === btn.dataset.shape;
    btn.setAttribute("aria-pressed", String(!!on));
    btn.disabled = !activeWin;
  });
  btnSealWin.disabled = !activeWin;
  btnAddWin.disabled = heroState.windows.length >= 6;
  btnXray.setAttribute("aria-pressed", String(heroState.xrayOn));

  // 渲染建筑窗表清单（结构不变时就地更新，拖动期间零 DOM 重建抖动）
  const sig = r.details.map((d) => `${d.id}:${d.rank}:${d.shape}:${Math.round(d.area * 100)}:${d.roleLabel}:${d.id === heroState.activeId}:${d.colliding || d.isSliced}`).join("|");
  if (scheduleList.__sig !== sig) {
    scheduleList.__sig = sig;
    scheduleList.innerHTML = "";
    if (!r.details.length) {
      const empty = document.createElement("span");
      empty.className = "sch-empty";
      empty.textContent = "当前墙面无开口，点「+ 开窗」开始裁景";
      scheduleList.appendChild(empty);
    } else {
      for (const d of r.details) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sch-chip";
        btn.dataset.winId = d.id;
        btn.dataset.active = String(d.id === heroState.activeId);
        btn.dataset.issue = String(d.colliding || d.isSliced);
        btn.setAttribute("aria-pressed", String(d.id === heroState.activeId));
        const areaPct = Math.round(d.area * 100);
        btn.innerHTML = `<span class="mono">${String(d.rank).padStart(2, "0")}</span><span>${SHAPES[d.shape].short} ${areaPct}%</span><span class="sch-role">${d.roleLabel}</span>`;
        btn.addEventListener("click", () => {
          heroState.activeId = d.id;
          commitHeroChange();
        });
        scheduleList.appendChild(btn);
      }
    }
  }

  syncHandlesPosition();
  const miniSource = r.gazeOrder[0] || activeWin;
  renderTitleMiniWindow(miniWinDesktop, stageCache, miniSource);
  renderTitleMiniWindow(miniWinMobile, stageCache, miniSource);
}

function commitHeroChange() {
  heroState.dirty = true;
  updateHeroReadout();
  heroLoop.draw();
}

// ---------- 素墙直接交互（点选、窗内拖移、角柄缩放、触摸、键盘） ----------
let dragMode = null; // { type: 'move'|'resize', id, startX, startY, orig }

function clientToNorm(clientX, clientY) {
  const rect = wallCanvas.getBoundingClientRect();
  return {
    nx: (clientX - rect.left) / rect.width,
    ny: (clientY - rect.top) / rect.height,
  };
}

function findTopWindowAt(nx, ny) {
  // 优先命中当前选中窗，否则逆序命中
  const active = getActiveWindow();
  if (active && pointInWindow(nx, ny, active)) return active;
  for (let i = heroState.windows.length - 1; i >= 0; i--) {
    if (pointInWindow(nx, ny, heroState.windows[i])) return heroState.windows[i];
  }
  return null;
}

wallCanvas.addEventListener("pointerdown", (e) => {
  const { nx, ny } = clientToNorm(e.clientX, e.clientY);
  const hit = findTopWindowAt(nx, ny);
  if (!hit) return;
  heroState.activeId = hit.id;
  dragMode = { type: "move", id: hit.id, startX: nx, startY: ny, orig: { ...hit } };
  if (e.pointerType !== "touch") {
    wallCanvas.setPointerCapture(e.pointerId);
  }
  commitHeroChange();
});

wallCanvas.addEventListener("pointermove", (e) => {
  if (!dragMode || dragMode.type !== "move") return;
  const { nx, ny } = clientToNorm(e.clientX, e.clientY);
  const idx = heroState.windows.findIndex((w) => w.id === dragMode.id);
  if (idx < 0) return;
  const moved = clampWindow({
    ...dragMode.orig,
    x: dragMode.orig.x + (nx - dragMode.startX),
    y: dragMode.orig.y + (ny - dragMode.startY),
  });
  heroState.windows[idx] = moved;
  commitHeroChange();
});

wallCanvas.addEventListener("pointerup", () => { dragMode = null; });
wallCanvas.addEventListener("pointercancel", () => { dragMode = null; });

// 右下角拉框柄（带 data-perf-drag，兼容鼠标、触屏与 perf 测试的 touch 事件）
function startResize(clientX, clientY) {
  const win = getActiveWindow();
  if (!win) return;
  const { nx, ny } = clientToNorm(clientX, clientY);
  dragMode = { type: "resize", id: win.id, startX: nx, startY: ny, orig: { ...win } };
}

function moveResize(clientX, clientY) {
  if (!dragMode || dragMode.type !== "resize") return;
  const { nx, ny } = clientToNorm(clientX, clientY);
  const idx = heroState.windows.findIndex((w) => w.id === dragMode.id);
  if (idx < 0) return;
  const dx = nx - dragMode.startX;
  const dy = ny - dragMode.startY;
  const maxW = 1 - LIMITS.wallPad - dragMode.orig.x;
  const maxH = 1 - LIMITS.wallPad - dragMode.orig.y;
  const nextW = Math.max(LIMITS.minWinW, Math.min(maxW, dragMode.orig.w + dx));
  const nextH = Math.max(LIMITS.minWinH, Math.min(maxH, dragMode.orig.h + dy));
  heroState.windows[idx] = { ...dragMode.orig, w: nextW, h: nextH };
  commitHeroChange();
}

resizeHandle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  startResize(e.clientX, e.clientY);
  resizeHandle.setPointerCapture(e.pointerId);
});
resizeHandle.addEventListener("pointermove", (e) => {
  if (!dragMode || dragMode.type !== "resize") return;
  e.preventDefault();
  moveResize(e.clientX, e.clientY);
});
resizeHandle.addEventListener("pointerup", () => { dragMode = null; });
resizeHandle.addEventListener("pointercancel", () => { dragMode = null; });

// 兼容 CDP TouchEvent（tools/perf.mjs 直接派发 touchStart/touchMove）
resizeHandle.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  if (!t) return;
  e.preventDefault();
  startResize(t.clientX, t.clientY);
}, { passive: false });
resizeHandle.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  if (!t || !dragMode) return;
  e.preventDefault();
  moveResize(t.clientX, t.clientY);
}, { passive: false });
resizeHandle.addEventListener("touchend", () => { dragMode = null; });

// 封掉当前选中窗
function sealActiveWindow() {
  if (!heroState.activeId) return;
  heroState.windows = heroState.windows.filter((w) => w.id !== heroState.activeId);
  heroState.activeId = heroState.windows[0]?.id || null;
  commitHeroChange();
}

sealFloat.addEventListener("click", (e) => {
  e.stopPropagation();
  sealActiveWindow();
});
btnSealWin.addEventListener("click", sealActiveWindow);

// + 开一扇新窗
btnAddWin.addEventListener("click", () => {
  if (heroState.windows.length >= 6) return;
  const slot = findNewWindowSlot(heroState.windows);
  const id = `w${nextWinSeq++}`;
  heroState.windows.push(clampWindow({ id, ...slot }));
  heroState.activeId = id;
  commitHeroChange();
});

// 切换窗型
shapeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const win = getActiveWindow();
    if (!win) return;
    win.shape = btn.dataset.shape;
    commitHeroChange();
  });
});

// 透视墙后（点击切换 + 支持空格键）
btnXray.addEventListener("click", () => {
  heroState.xrayOn = !heroState.xrayOn;
  commitHeroChange();
});

// 复原错版 & 原海报四窗参考
btnReset.addEventListener("click", () => {
  heroState.windows = cloneWindows(INITIAL_BROKEN_WINDOWS);
  heroState.activeId = "w1";
  heroState.xrayOn = false;
  commitHeroChange();
});

btnRef.addEventListener("click", () => {
  heroState.windows = cloneWindows(POSTER_REF_WINDOWS);
  heroState.activeId = "w1";
  heroState.xrayOn = false;
  commitHeroChange();
});

// 键盘操作（画布或拉框柄聚焦时：方向键移窗，Shift+方向键缩放，Delete封窗，C切窗型，Space透视）
function handleWallKeydown(e) {
  const win = getActiveWindow();
  const step = 0.03;
  if (e.code === "Space") {
    e.preventDefault();
    heroState.xrayOn = !heroState.xrayOn;
    commitHeroChange();
    return;
  }
  if (!win) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
    const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
    const idx = heroState.windows.findIndex((w) => w.id === win.id);
    if (e.shiftKey) {
      heroState.windows[idx] = clampWindow({ ...win, w: win.w + dx, h: win.h + dy });
    } else {
      heroState.windows[idx] = clampWindow({ ...win, x: win.x + dx, y: win.y + dy });
    }
    commitHeroChange();
  } else if (e.key === "Backspace" || e.key === "Delete") {
    e.preventDefault();
    sealActiveWindow();
  } else if (e.key === "c" || e.key === "C") {
    const next = SHAPE_ORDER[(SHAPE_ORDER.indexOf(win.shape) + 1) % SHAPE_ORDER.length];
    win.shape = next;
    commitHeroChange();
  }
}
wallCanvas.addEventListener("keydown", handleWallKeydown);
resizeHandle.addEventListener("keydown", handleWallKeydown);

// 主画布渲染循环（通过 lib/stage.js 统一管休眠与 prefers-reduced-motion）
const heroLoop = loop(wallCanvas, (t, dt, { still }) => {
  ensureWallCanvasSize();
  let needsDraw = heroState.dirty;

  if (still) {
    heroState.introProgress = 1;
    heroState.xrayAlpha = heroState.xrayOn ? 1 : 0;
    needsDraw = true;
  } else {
    if (heroState.introProgress < 1) {
      heroState.introProgress = Math.min(1, heroState.introProgress + dt * 0.9);
      needsDraw = true;
    }
    const targetXray = heroState.xrayOn ? 1 : 0;
    if (Math.abs(heroState.xrayAlpha - targetXray) > 0.005) {
      heroState.xrayAlpha += (targetXray - heroState.xrayAlpha) * Math.min(1, dt * 11);
      needsDraw = true;
    } else {
      heroState.xrayAlpha = targetXray;
    }
    // 成立态且多窗时，轻微流动虚线视线路径
    if (lastEval.statusKind === "ok" && lastEval.gazeOrder.length >= 2) {
      needsDraw = true;
    }
  }

  if (needsDraw) {
    const ctx = wallCanvas.getContext("2d");
    renderWallStage(ctx, wallCanvas.width, wallCanvas.height, heroState, lastEval, stageCache, t, heroState.introProgress);
    heroState.dirty = false;
  }
});

ensureWallCanvasSize();
updateHeroReadout();
heroLoop.draw();

let resizeRaf = 0;
window.addEventListener("resize", () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    ensureWallCanvasSize();
    syncHandlesPosition();
    heroLoop.draw();
    drawCurtain();
    stressLoop.draw();
  });
});

// =========================================================
// 2. 01 节：非模态补全遮挡拉帘
// =========================================================
const curtainCanvas = document.getElementById("curtain-canvas");
const curtainRange = document.getElementById("curtain-range");
const curtainVal = document.getElementById("curtain-val");
const curtainNote = document.getElementById("curtain-note");
const curtainTabs = [...document.querySelectorAll("[data-curtain-scene]")];

let curtainSceneId = "pottery";

function drawCurtain() {
  const occ = Number(curtainRange.value) / 100;
  const pct = Math.round(occ * 100);
  const scene = CURTAIN_SCENES.find((s) => s.id === curtainSceneId) || CURTAIN_SCENES[0];

  let band = "窗口甜区 · 经验值";
  let note = scene.sweetNote;
  if (pct < 24) {
    band = "近乎全露 · 预览感弱";
    note = scene.fullNote;
  } else if (pct > 72) {
    band = "针孔过闭 · 难触发补全";
    note = scene.pinholeNote;
  }
  curtainVal.textContent = `${pct}%（${band}）`;
  curtainNote.textContent = note;

  renderCurtainScene(curtainCanvas, curtainSceneId, occ);
}

curtainRange.addEventListener("input", drawCurtain);
curtainTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    curtainSceneId = btn.dataset.curtainScene;
    curtainTabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    drawCurtain();
  });
});
drawCurtain();

// =========================================================
// 3. 02 节：四型取景镜切换墙（同景异窗 SVG）
// =========================================================
const apertureSvg = document.getElementById("aperture-svg");
const apAxis = document.getElementById("ap-axis");
const apName = document.getElementById("ap-name");
const apFit = document.getElementById("ap-fit");
const apCaution = document.getElementById("ap-caution");
const shapeCards = [...document.querySelectorAll("[data-aperture]")];

function renderAperturePreview(shapeId) {
  const item = APERTURE_SHAPES.find((s) => s.id === shapeId) || APERTURE_SHAPES[0];
  apAxis.textContent = item.axis;
  apName.textContent = `${item.name} · ${item.en}`;
  apFit.textContent = item.fit;
  apCaution.textContent = `避坑提醒：${item.caution}`;

  let clipMarkup = `<rect x="130" y="42" width="300" height="276" rx="28"/>`;
  let guideMarkup = `<path d="M130 180h-26M430 180h26M280 42v-22M280 318v22" stroke="#215351" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  if (shapeId === "arch") {
    clipMarkup = `<path d="M180 326V146a100 100 0 0 1 200 0v180a12 12 0 0 1-12 12H192a12 12 0 0 1-12-12z"/>`;
    guideMarkup = `<path d="M280 324V66M268 82L280 62L292 82" fill="none" stroke="#E8E3DA" stroke-width="2.2" stroke-dasharray="5 4"/>`;
  } else if (shapeId === "strip") {
    clipMarkup = `<rect x="46" y="114" width="468" height="132" rx="24"/>`;
    guideMarkup = `<path d="M84 180H476M460 168L478 180L460 192" fill="none" stroke="#E8E3DA" stroke-width="2.2" stroke-dasharray="6 4"/>`;
  } else if (shapeId === "circle") {
    clipMarkup = `<circle cx="280" cy="180" r="134"/>`;
    guideMarkup = `<circle cx="280" cy="180" r="146" fill="none" stroke="#215351" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  }

  apertureSvg.innerHTML = `
    <defs>
      <clipPath id="ap-clip">${clipMarkup}</clipPath>
    </defs>
    <rect width="560" height="360" fill="#E6E9E8"/>
    <g opacity="0.22">
      <rect width="560" height="360" fill="#44807A"/>
      <circle cx="348" cy="112" r="42" fill="#E8E3DA"/>
      <path d="M0 196 Q160 120 320 202 T560 160 L560 360 L0 360 Z" fill="#19393C"/>
      <path d="M0 264 Q180 210 370 250 T560 226 L560 360 L0 360 Z" fill="#9FBEB3"/>
      <path d="M350 252 C240 274 260 310 330 330 C390 345 360 360 290 360 L370 360 C435 344 420 304 352 292 C310 284 328 266 402 252 Z" fill="#E8E3DA"/>
    </g>
    <g clip-path="url(#ap-clip)">
      <rect width="560" height="360" fill="#44807A"/>
      <circle cx="348" cy="112" r="42" fill="#E8E3DA"/>
      <path d="M0 196 Q160 120 320 202 T560 160 L560 360 L0 360 Z" fill="#19393C"/>
      <path d="M0 264 Q180 210 370 250 T560 226 L560 360 L0 360 Z" fill="#9FBEB3"/>
      <path d="M350 252 C240 274 260 310 330 330 C390 345 360 360 290 360 L370 360 C435 344 420 304 352 292 C310 284 328 266 402 252 Z" fill="#E8E3DA"/>
    </g>
    <g fill="none" stroke="#19393C" stroke-width="3">${clipMarkup}</g>
    ${guideMarkup}
  `;
}

shapeCards.forEach((btn) => {
  btn.addEventListener("click", () => {
    shapeCards.forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
    renderAperturePreview(btn.dataset.aperture);
  });
});
renderAperturePreview("rounded");

// =========================================================
// 4. 03 节：深松青暗房 · 窗数与主次压测
// =========================================================
const stressCanvas = document.getElementById("stress-canvas");
const stressReadout = document.getElementById("stress-readout");
const countBtns = [...document.querySelectorAll("[data-stress-count]")];
const unequalBtns = [...document.querySelectorAll("[data-stress-unequal]")];

let stressCount = 4;
let stressUnequal = true;

function updateStressText(res) {
  const ratioStr = res.count === 1 ? "独窗（无竞争）" : `${res.ratio.toFixed(1)}×`;
  if (res.cleanHierarchy) {
    stressReadout.innerHTML = `<strong>层级清晰 · ${res.count} 扇窗（主次面积比 ${ratioStr}）</strong>${
      res.count === 1
        ? "单窗直给焦点，视线一秒定格，适合强故事感主图。"
        : "大主窗先接住第一眼（①），其余小辅窗顺着面积递减展开（② → ③），素墙在窗间留出清楚的停顿节奏。"
    }`;
  } else if (res.count > 4) {
    stressReadout.innerHTML = `<strong class="bad">窗数过碎 · ${res.count} 扇窗（主次比 ${ratioStr}）</strong>开口数量超过经验上限（4 扇），整幅连续画卷被切成了细碎格子，视线在多个相似洞口间弹跳，建议封窗合并或改用多面板版式。`;
  } else {
    stressReadout.innerHTML = `<strong class="bad">主次平权 · ${res.count} 扇等大窗（主次比 ${ratioStr}）</strong>窗数本来不算多，但每扇窗面积完全相同，没有绝对主角，第一眼无从下手。把其中一扇拉大到次大窗的 1.7 倍以上，秩序立刻回来。`;
  }
}

const stressLoop = loop(stressCanvas, (t, _dt, { still }) => {
  const res = renderStressCanvas(stressCanvas, stressCount, stressUnequal, still ? 0 : t);
  if (stressCanvas.__lastKey !== `${stressCount}-${stressUnequal}`) {
    stressCanvas.__lastKey = `${stressCount}-${stressUnequal}`;
    updateStressText(res);
  }
});

countBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    stressCount = Number(btn.dataset.stressCount);
    countBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    stressCanvas.__lastKey = "";
    stressLoop.draw();
  });
});
unequalBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    stressUnequal = btn.dataset.stressUnequal === "true";
    unequalBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    stressCanvas.__lastKey = "";
    stressLoop.draw();
  });
});
stressLoop.draw();

// =========================================================
// 5. 04 节：三类真实场景校样台
// =========================================================
const spreadMock = document.getElementById("spread-mock");
const spreadTag = document.getElementById("spread-tag");
const spreadDTitle = document.getElementById("spread-d-title");
const spreadDWhy = document.getElementById("spread-d-why");
const spreadTabs = [...document.querySelectorAll("[data-spread]")];
const spreadFlip = document.getElementById("spread-flip");

let curSpreadId = "product";
let spreadBad = false;

function renderSpreadMock() {
  const item = SPREAD_CASES.find((s) => s.id === curSpreadId) || SPREAD_CASES[0];
  spreadFlip.setAttribute("aria-pressed", String(spreadBad));
  spreadFlip.textContent = spreadBad ? "切回合理开窗示范" : "查看失误开窗对照";

  spreadTag.textContent = spreadBad ? "失误开窗 · 预览感或裁切失效" : "合理开窗 · 预览与层级兼得";
  spreadTag.className = `spread-tag mono ${spreadBad ? "is-bad" : ""}`;
  spreadDTitle.textContent = spreadBad ? item.badTitle : item.goodTitle;
  spreadDWhy.textContent = spreadBad ? item.badWhy : item.goodWhy;

  let windowsMarkup = "";
  let sceneMarkup = "";

  if (curSpreadId === "product") {
    sceneMarkup = `
      <rect x="280" y="0" width="400" height="410" fill="#C4D4CE"/>
      <rect x="280" y="302" width="400" height="108" fill="#2A4046"/>
      <ellipse cx="486" cy="316" rx="88" ry="12" fill="#19393C" opacity="0.4"/>
      <path d="M412 248 C372 238 368 176 340 156" fill="none" stroke="#215351" stroke-width="15" stroke-linecap="round"/>
      <path d="M552 176 C614 176 614 266 548 270" fill="none" stroke="#19393C" stroke-width="14" stroke-linecap="round"/>
      <path d="M442 138 C396 180 396 270 434 306 H546 C584 270 584 180 538 138 Z" fill="#32726E"/>
      <rect x="444" y="114" width="92" height="24" rx="8" fill="#E8E3DA"/>
      <circle cx="490" cy="104" r="11" fill="#19393C"/>
      <path d="M448 174 Q430 218 448 266" fill="none" stroke="#E8E3DA" stroke-width="8" stroke-linecap="round" opacity="0.82"/>
      <path d="M336 164 C324 226 322 292 332 346" fill="none" stroke="#E8E3DA" stroke-width="5" stroke-linecap="round"/>
      <path d="M300 330 H374 L366 368 H308 Z" fill="#E8E3DA"/>
      <path d="M306 336 H368" stroke="#367876" stroke-width="4"/>
      <ellipse cx="430" cy="350" rx="22" ry="6" fill="#9FBEB3" opacity="0.7"/>
      <rect x="408" y="346" width="44" height="22" rx="4" fill="#367876"/>
      <rect x="468" y="340" width="76" height="28" rx="4" fill="#E8E3DA" opacity="0.88"/>
      <text x="506" y="358" text-anchor="middle" font-family="Space Mono, monospace" font-size="10" font-weight="700" fill="#19393C">1280℃</text>
    `;
    windowsMarkup = spreadBad
      ? `<rect x="304" y="42" width="102" height="326" rx="10"/><rect x="424" y="42" width="102" height="326" rx="10"/><rect x="544" y="42" width="102" height="326" rx="10"/>`
      : `<path d="M390 286V116a110 110 0 0 1 220 0v170a14 14 0 0 1-14 14H404a14 14 0 0 1-14-14z"/><rect x="294" y="314" width="268" height="68" rx="14"/>`;
  } else if (curSpreadId === "case") {
    sceneMarkup = `
      <rect x="280" y="0" width="400" height="410" fill="#44807A"/>
      <rect x="392" y="84" width="194" height="224" fill="#E8E3DA"/>
      <path d="M280 0H680V410H280Z M406 312V188a84 84 0 0 1 168 0v124z" fill="#19393C" fill-rule="evenodd"/>
      <polygon points="406,240 554,158 584,284 440,368" fill="#E8E3DA" opacity="0.72"/>
      <path d="M360 318H612M334 344H636M310 370H660" stroke="#9FBEB3" stroke-width="4"/>
    `;
    windowsMarkup = spreadBad
      ? `<rect x="292" y="20" width="372" height="370" rx="8"/>`
      : `<rect x="360" y="34" width="286" height="232" rx="18"/><rect x="304" y="170" width="102" height="206" rx="14"/>`;
  } else {
    sceneMarkup = `
      <rect x="280" y="0" width="400" height="410" fill="#46827C"/>
      <circle cx="574" cy="116" r="40" fill="#E8E3DA"/>
      <rect x="280" y="216" width="400" height="194" fill="#19393C"/>
      <path d="M280 218 Q400 198 510 222 T680 212 L680 250 L280 250 Z" fill="#9FBEB3"/>
      <path d="M280 284 Q420 262 544 294 T680 278" fill="none" stroke="#E8E3DA" stroke-width="7" opacity="0.75"/>
      <path d="M430 340 Q482 260 540 340 Z" fill="#2B4249"/>
    `;
    windowsMarkup = spreadBad
      ? `<rect x="306" y="42" width="106" height="148" rx="10"/><rect x="426" y="42" width="106" height="148" rx="10"/><rect x="546" y="42" width="106" height="148" rx="10"/><rect x="306" y="210" width="106" height="148" rx="10"/><rect x="426" y="210" width="106" height="148" rx="10"/><rect x="546" y="210" width="106" height="148" rx="10"/>`
      : `<rect x="308" y="166" width="342" height="186" rx="22"/><circle cx="572" cy="112" r="58"/>`;
  }

  const outlineColor = spreadBad ? "#9A3B2D" : "#19393C";
  const dashAttr = spreadBad ? `stroke-dasharray="6 4"` : "";

  spreadMock.innerHTML = `
    <svg viewBox="0 0 680 410" class="spread-svg" aria-label="${item.title} ${spreadBad ? "失误" : "合理"}开窗校样">
      <defs><clipPath id="sp-clip">${windowsMarkup}</clipPath></defs>
      <rect width="680" height="410" fill="#E6E9E8"/>
      <text x="28" y="54" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#215351">${item.eyebrow}</text>
      <text x="28" y="108" font-family="Noto Sans SC, sans-serif" font-size="28" font-weight="900" fill="#232829">${item.title}</text>
      <rect x="28" y="128" width="38" height="4" rx="2" fill="#367876"/>
      <text x="28" y="166" font-family="Noto Sans SC, sans-serif" font-size="13.5" fill="#435254">${item.subtitle}</text>
      <text x="28" y="360" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#215351">${item.meta}</text>
      <g clip-path="url(#sp-clip)">${sceneMarkup}</g>
      <g fill="none" stroke="${outlineColor}" stroke-width="2.5" ${dashAttr}>${windowsMarkup}</g>
    </svg>
  `;
}

spreadTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    curSpreadId = btn.dataset.spread;
    spreadTabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    renderSpreadMock();
  });
});
spreadFlip.addEventListener("click", () => {
  spreadBad = !spreadBad;
  renderSpreadMock();
});
renderSpreadMock();

// =========================================================
// 6. 05 节：五代开窗史图谱
// =========================================================
const histSvg = document.getElementById("hist-svg");
const histTag = document.getElementById("hist-tag");
const histTitle = document.getElementById("hist-title");
const histWork = document.getElementById("hist-work");
const histSummary = document.getElementById("hist-summary");
const histSteps = [...document.querySelectorAll("[data-hist]")];

function renderHistoryPlate(id) {
  const item = HISTORY_PLATES.find((h) => h.id === id) || HISTORY_PLATES[0];
  histTag.textContent = `${item.year} · ${item.tag}`;
  histTitle.textContent = item.who;
  histWork.textContent = item.work;
  histSummary.textContent = item.summary;

  const plates = {
    alberti: `
      <rect width="320" height="220" fill="#F2F4F3"/>
      <rect x="54" y="28" width="212" height="164" fill="#DCE3E0" stroke="#19393C" stroke-width="3"/>
      <line x1="54" y1="28" x2="160" y2="112" stroke="#367876" stroke-width="1.4" stroke-dasharray="4 4"/>
      <line x1="266" y1="28" x2="160" y2="112" stroke="#367876" stroke-width="1.4" stroke-dasharray="4 4"/>
      <line x1="54" y1="192" x2="160" y2="112" stroke="#367876" stroke-width="1.4" stroke-dasharray="4 4"/>
      <line x1="266" y1="192" x2="160" y2="112" stroke="#367876" stroke-width="1.4" stroke-dasharray="4 4"/>
      <line x1="54" y1="112" x2="266" y2="112" stroke="#215351" stroke-width="1.5"/>
      <circle cx="160" cy="112" r="5" fill="#19393C"/>
      <text x="160" y="209" text-anchor="middle" font-family="Space Mono, monospace" font-size="10.5" fill="#215351">FINESTRA APERTA · 1435</text>
    `,
    jicheng: `
      <rect width="320" height="220" fill="#E6E9E8"/>
      <path d="M78 188V96a82 82 0 0 1 164 0v92z" fill="#44807A" stroke="#19393C" stroke-width="3"/>
      <path d="M126 188 Q138 124 156 68 M158 188 Q166 132 184 86" fill="none" stroke="#19393C" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="144" cy="94" rx="18" ry="5" transform="rotate(-24 144 94)" fill="#E8E3DA"/>
      <ellipse cx="176" cy="112" rx="16" ry="5" transform="rotate(20 176 112)" fill="#B9CDC2"/>
      <rect x="24" y="188" width="272" height="10" fill="#2B4249"/>
      <text x="160" y="212" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#215351">粉墙开洞 · 尺幅窗框景</text>
    `,
    ogilvy: `
      <rect width="320" height="220" fill="#F2F4F3"/>
      <rect x="64" y="16" width="192" height="188" fill="#E6E9E8" stroke="#232829" stroke-width="1.5"/>
      <rect x="76" y="26" width="168" height="104" rx="4" fill="#367876"/>
      <circle cx="204" cy="56" r="16" fill="#E8E3DA"/>
      <path d="M76 112 Q144 76 244 106 L244 130 L76 130 Z" fill="#19393C"/>
      <rect x="76" y="138" width="110" height="6" rx="2" fill="#215351"/>
      <rect x="76" y="152" width="154" height="10" rx="2" fill="#232829"/>
      <rect x="76" y="170" width="76" height="4" fill="#435254"/><rect x="164" y="170" width="76" height="4" fill="#435254"/>
      <rect x="76" y="180" width="76" height="4" fill="#435254"/><rect x="164" y="180" width="52" height="4" fill="#435254"/>
    `,
    munari: `
      <rect width="320" height="220" fill="#DCE3E0"/>
      <rect x="44" y="26" width="140" height="168" fill="#F2F4F3" stroke="#19393C" stroke-width="1.5"/>
      <rect x="136" y="26" width="140" height="168" fill="#E6E9E8" stroke="#19393C" stroke-width="1.5"/>
      <circle cx="206" cy="96" r="28" fill="#44807A" stroke="#19393C" stroke-width="2"/>
      <path d="M188 106 L206 76 L224 106 Z" fill="#E8E3DA"/>
      <rect x="168" y="144" width="76" height="24" rx="12" fill="#19393C"/>
      <text x="114" y="114" text-anchor="middle" font-family="Space Mono, monospace" font-size="11" fill="#435254">PAGE N</text>
    `,
    kanizsa: `
      <rect width="320" height="220" fill="#F2F4F3"/>
      <rect x="38" y="28" width="116" height="164" rx="8" fill="#44807A"/>
      <circle cx="154" cy="110" r="40" fill="#E8E3DA" stroke="#215351" stroke-width="2" stroke-dasharray="5 4"/>
      <rect x="114" y="28" width="84" height="164" fill="#E6E9E8" stroke="#19393C" stroke-width="1.5"/>
      <rect x="198" y="60" width="84" height="100" rx="8" fill="#19393C"/>
      <path d="M126 110 H186" stroke="#215351" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="156" y="210" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#215351">遮挡墙背后：大脑自动续写连续轮廓</text>
    `,
  };
  histSvg.innerHTML = plates[id] || plates.alberti;
}

histSteps.forEach((btn) => {
  btn.addEventListener("click", () => {
    histSteps.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    renderHistoryPlate(btn.dataset.hist);
  });
});
renderHistoryPlate("alberti");

// =========================================================
// 7. 06 节：反例卡片聚焦切换
// =========================================================
const antiCards = [...document.querySelectorAll(".anti-card")];
antiCards.forEach((card) => {
  card.addEventListener("click", () => {
    const wasOpen = card.getAttribute("aria-expanded") === "true";
    antiCards.forEach((c) => c.setAttribute("aria-expanded", "false"));
    card.setAttribute("aria-expanded", String(!wasOpen));
  });
});

// =========================================================
// 8. 07 节：严格单变量小练习（同底图、同文字、同 3 窗）
// =========================================================
const quizGrid = document.getElementById("quiz-grid");
const qvTitle = document.getElementById("qv-title");
const qvText = document.getElementById("qv-text");

function buildQuizSvg(optId, revealed) {
  // 统一底图：青釉长颈瓶 + 器底落款与釉片细节（严格锁定在同一坐标！）
  const vaseScene = `
    <rect x="108" y="0" width="152" height="190" fill="#B5C9C1"/>
    <rect x="108" y="152" width="152" height="38" fill="#2A4046"/>
    <ellipse cx="182" cy="158" rx="44" ry="8" fill="#19393C" opacity="0.35"/>
    <path d="M172 34 H192 L195 72 C216 86 220 128 202 156 H162 C144 128 148 86 169 72 Z" fill="#276260"/>
    <ellipse cx="182" cy="34" rx="12" ry="4" fill="#E8E3DA"/>
    <path d="M171 84 Q159 112 169 140" fill="none" stroke="#E8E3DA" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="176" cy="64" r="3" fill="#E8E3DA"/>
    <rect x="134" y="158" width="38" height="12" rx="3" fill="#E8E3DA" opacity="0.82"/>
    <path d="M140 164 H166" stroke="#215351" stroke-width="2"/>
    <path d="M204 156 Q216 166 232 158 M208 168 Q222 174 236 166" fill="none" stroke="#9FBEB3" stroke-width="2"/>
  `;

  // 四套只差窗口比例与裁切落点（全都是 3 扇窗！）
  const masks = {
    A: `<rect x="122" y="18" width="122" height="44" rx="8"/><rect x="122" y="72" width="122" height="44" rx="8"/><rect x="122" y="126" width="122" height="44" rx="8"/>`,
    B: `<rect x="114" y="8" width="138" height="148" rx="10"/><rect x="114" y="162" width="66" height="20" rx="5"/><rect x="186" y="162" width="66" height="20" rx="5"/>`,
    C: `<path d="M132 126V60a50 50 0 0 1 100 0v66a8 8 0 0 1-8 8H140a8 8 0 0 1-8-8z"/><rect x="122" y="144" width="62" height="32" rx="7"/><rect x="192" y="144" width="52" height="32" rx="7"/>`,
    D: `<path d="M132 146V102a50 50 0 0 1 100 0v44a8 8 0 0 1-8 8H140a8 8 0 0 1-8-8z"/><rect x="122" y="160" width="56" height="22" rx="6"/><rect x="186" y="160" width="56" height="22" rx="6"/>`,
  };

  let stroke = "#19393C";
  let extra = "";
  if (revealed) {
    if (optId === "C") {
      stroke = "#215351";
    } else {
      stroke = "#9A3B2D";
      if (optId === "D") {
        // 标出被顶框劈断的瓶颈高光
        extra = `<line x1="126" y1="52" x2="238" y2="52" stroke="#9A3B2D" stroke-width="2" stroke-dasharray="4 3"/>`;
      }
    }
  }

  return `
    <svg viewBox="0 0 260 190" aria-hidden="true">
      <defs><clipPath id="q-clip-${optId}">${masks[optId]}</clipPath></defs>
      <rect width="260" height="190" fill="#E6E9E8"/>
      <text x="14" y="34" font-family="Space Mono, monospace" font-size="8.5" font-weight="700" fill="#215351">VOL. 04</text>
      <text x="14" y="64" font-family="Noto Sans SC, sans-serif" font-size="16" font-weight="900" fill="#232829">青釉</text>
      <text x="14" y="84" font-family="Noto Sans SC, sans-serif" font-size="16" font-weight="900" fill="#232829">长颈瓶</text>
      <rect x="14" y="96" width="24" height="3" rx="1.5" fill="#367876"/>
      <rect x="14" y="112" width="66" height="4" rx="2" fill="#435254" opacity="0.5"/>
      <rect x="14" y="122" width="54" height="4" rx="2" fill="#435254" opacity="0.4"/>
      <rect x="14" y="156" width="44" height="4" rx="2" fill="#215351" opacity="0.6"/>
      <g clip-path="url(#q-clip-${optId})">${vaseScene}</g>
      <g fill="none" stroke="${stroke}" stroke-width="1.8">${masks[optId]}</g>
      ${extra}
    </svg>
  `;
}

let quizAnsweredId = null;

function renderQuiz() {
  quizGrid.innerHTML = "";
  const revealed = quizAnsweredId !== null;
  for (const opt of QUIZ_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.opt = opt.id;
    btn.setAttribute("aria-pressed", String(quizAnsweredId === opt.id));
    if (revealed) {
      if (opt.correct) btn.dataset.state = "right";
      else if (quizAnsweredId === opt.id) btn.dataset.state = "wrong";
    }
    const mark = revealed ? (opt.correct ? "最佳方案 ✓" : quizAnsweredId === opt.id ? "此项有硬伤 ×" : "对照") : "";
    btn.innerHTML = `
      ${buildQuizSvg(opt.id, revealed)}
      <div class="quiz-head">
        <span class="quiz-label">${opt.label}</span>
        <span class="quiz-mark mono">${mark}</span>
      </div>
      <p class="quiz-meta mono">${revealed ? opt.metrics : "点击选择"}</p>
    `;
    btn.addEventListener("click", () => {
      quizAnsweredId = opt.id;
      renderQuiz();
      qvTitle.textContent = `${opt.label} · ${opt.verdict}`;
      qvTitle.className = `qv-title ${opt.correct ? "" : "is-wrong"}`;
      qvText.textContent = opt.explain;
    });
    quizGrid.appendChild(btn);
  }
}
renderQuiz();

// =========================================================
// 9. 08 节：原海报灯箱（复用唯一 <img id="poster"> src，不二次内联）
// =========================================================
const posterImg = document.getElementById("poster");
const posterOpen = document.getElementById("poster-open");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbZoom = document.getElementById("lb-zoom");
const lbIn = document.getElementById("lb-in");
const lbOut = document.getElementById("lb-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbZoom.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
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
lbIn.addEventListener("click", () => { lbScale = Math.min(3.5, lbScale + 0.35); applyLbTransform(); });
lbOut.addEventListener("click", () => { lbScale = Math.max(0.7, lbScale - 0.35); applyLbTransform(); });
lbReset.addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.7, Math.min(3.5, lbScale + (e.deltaY < 0 ? 0.15 : -0.15)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1.05) {
    closeLightbox();
    return;
  }
  lbDrag = { sx: e.clientX, sy: e.clientY, ox: lbX, oy: lbY };
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = lbDrag.ox + (e.clientX - lbDrag.sx);
  lbY = lbDrag.oy + (e.clientY - lbDrag.sy);
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) {
    e.preventDefault();
    closeLightbox();
  }
});
