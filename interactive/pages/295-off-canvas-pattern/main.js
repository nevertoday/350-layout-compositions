// 295 画布外模式 · 主控脚本（首屏透视画布外工作台 + 六个分节实验 + 年代演进联动图 + 原海报灯箱）

import {
  ARTICLES,
  allowedRange,
  clampProgress,
  computeStageGeometry,
  createModel,
  diagnose,
  snapTarget,
  tierOf,
} from "./model.js";
import { mountCanvasStage } from "./stage.js";

const state = createModel();

/* ================= 1. HERO: 透视画布外工作台 ================= */
const arena = document.getElementById("stage-arena");
const canvas = document.getElementById("stage-canvas");
const vpFrame = document.getElementById("vp-frame");
const vpCanvas = document.getElementById("vp-canvas");
const vpScrim = document.getElementById("vp-scrim");
const wingLeft = document.getElementById("wing-left");
const wingRight = document.getElementById("wing-right");
const dragBar = document.getElementById("vp-drag-bar");
const dragStatus = document.getElementById("drag-status");

const vwSlider = document.getElementById("vw-slider");
const vwReadout = document.getElementById("vw-readout");
const vpTierTag = document.getElementById("vp-tier-tag");
const vpWingTag = document.getElementById("vp-wing-tag");
const leftNote = document.getElementById("left-state-note");
const rightNote = document.getElementById("right-state-note");
const btnOpenLeft = document.getElementById("btn-open-left");
const btnOpenRight = document.getElementById("btn-open-right");
const btnCloseLeft = document.getElementById("close-left");
const btnCloseRight = document.getElementById("close-right");
const btnXray = document.getElementById("btn-xray");

const artKicker = document.getElementById("art-kicker");
const artTitle = document.getElementById("art-title");
const artLead = document.getElementById("art-lead");
const artCards = document.getElementById("art-cards");
const artMeta = document.getElementById("art-meta");
const filterBadge = document.getElementById("filter-badge");

const vBadge = document.getElementById("v-badge");
const vSpec = document.getElementById("v-spec");
const vHeadline = document.getElementById("v-headline");
const vBody = document.getElementById("v-body");

const bpButtons = [...document.querySelectorAll("button[data-bp]")];
const modeButtons = [...document.querySelectorAll("button[data-mode]")];
const navItems = [...document.querySelectorAll(".nav-item")];
const fltButtons = [...document.querySelectorAll(".flt-btn")];

let cachedMetrics = null;
let cachedMetricsKey = "";

function computeFrameMetrics() {
  const arenaW = arena.clientWidth || 360;
  const key = `${arenaW}|${state.vw}`;
  if (key === cachedMetricsKey && cachedMetrics) return cachedMetrics;
  cachedMetricsKey = key;
  const tier = tierOf(state.vw);

  let frameW;
  let wingW;
  let compactWings = false;

  if (arenaW < 520) {
    // 手机竖屏：手机框占 50–53%，把左右双翼抽屉按比例收成完整可见的窄条，三者同排零截断
    if (tier === "mobile") {
      frameW = Math.round(arenaW * 0.51);
      const sideAvail = Math.floor((arenaW - frameW) / 2);
      // 预留开场 32% 推挤位移 + 2px 缝，确保左抽屉、手机框、推出正文与右抽屉完整装进一屏
      wingW = Math.max(60, Math.min(72, Math.floor((sideAvail - 4) / 1.34)));
      compactWings = true;
    } else if (tier === "tablet") {
      frameW = Math.round(arenaW * 0.74);
      const sideAvail = Math.floor((arenaW - frameW) / 2);
      wingW = Math.max(60, Math.min(76, sideAvail - 4));
      compactWings = true;
    } else {
      frameW = Math.round(arenaW * 0.96);
      wingW = Math.max(62, Math.round(frameW * 0.22));
      compactWings = true;
    }
  } else if (arenaW < 900) {
    // 中屏/横屏手机/竖屏平板（如 768×1024、844×390）：确保双翼在开场与待命下也不被舞台边缘截切
    const t = (state.vw - 320) / (1200 - 320);
    const minW = Math.round(arenaW * 0.43);
    const maxW = Math.min(820, arenaW - 28);
    frameW = Math.round(minW + (maxW - minW) * t);
    if (tier === "desktop") {
      wingW = Math.max(132, Math.min(186, Math.round(frameW * 0.22)));
    } else {
      const sideAvail = Math.max(88, Math.floor((arenaW - frameW) / 2));
      wingW = Math.max(118, Math.min(168, Math.floor((sideAvail - 18) / 1.48)));
      compactWings = wingW < 138;
    }
  } else {
    // 桌面宽屏（1024 / 1440 / 2560）
    const t = (state.vw - 320) / (1200 - 320);
    const minW = Math.min(390, Math.round(arenaW * 0.36));
    const maxW = Math.min(1220, arenaW - 44);
    frameW = Math.round(minW + (maxW - minW) * t);
    wingW =
      tier === "desktop"
        ? Math.max(150, Math.min(204, Math.round(frameW * 0.22)))
        : Math.max(168, Math.min(216, Math.round(frameW * 0.56)));
  }

  cachedMetrics = { frameW, wingW, compactWings };
  return cachedMetrics;
}

function getViewportBox() {
  // 纯数学推算居中视口框（与 CSS flex center 精确一致），避免帧循环内强制同步布局
  const arenaW = arena.clientWidth || 360;
  const arenaH = arena.clientHeight || 420;
  const { frameW } = computeFrameMetrics();
  const frameH = vpFrame.offsetHeight || Math.min(420, arenaH - 32);
  const left = (arenaW - frameW) * 0.5;
  const top = (arenaH - frameH) * 0.5;
  return {
    left,
    right: left + frameW,
    top,
    bottom: top + frameH,
    width: frameW,
    height: frameH,
  };
}

function renderArticle() {
  const art = ARTICLES.find((a) => a.id === state.articleId) || ARTICLES[0];
  artKicker.textContent = art.kicker;
  artTitle.textContent = art.title;
  artLead.textContent = art.lead;
  artMeta.textContent = art.meta;
  filterBadge.textContent = state.filterTag;

  const list =
    state.filterTag === "全部"
      ? art.cards
      : art.cards.filter((c) => c.tag === state.filterTag);

  artCards.innerHTML = list
    .map(
      (c) => `
      <div class="mini-card" data-tag="${c.tag}">
        <span class="mini-card-tag">${c.tag}</span>
        <b>${c.title}</b>
        <span class="mini-card-note">${c.note}</span>
      </div>`
    )
    .join("");

  navItems.forEach((b) => {
    const active = b.dataset.article === state.articleId;
    b.classList.toggle("is-active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });

  fltButtons.forEach((b) => {
    const active = b.dataset.tag === state.filterTag;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}

let prevStaticKey = "";
let prevDiagKey = "";

function setTxt(el, val) {
  if (el.textContent !== val) el.textContent = val;
}

function syncStageDOM() {
  const tier = tierOf(state.vw);
  const { leftOff, rightOff } = allowedRange(state.vw);
  state.progress = clampProgress(state.vw, state.progress);

  const { frameW, wingW, compactWings } = computeFrameMetrics();
  // .vp-frame 左右各有 2px 实线边框，主画布实际视口内宽为 frameW - 4
  const innerFrameW = Math.max(1, frameW - 4);
  const geom = computeStageGeometry(state, innerFrameW, wingW, compactWings);
  const p = geom.p;

  const staticKey = `${frameW}|${wingW}|${compactWings}|${tier}|${state.mode}|${state.xray}|${state.vw}`;

  if (staticKey !== prevStaticKey) {
    prevStaticKey = staticKey;
    vpFrame.style.setProperty("--vp-w", `${frameW}px`);
    vpFrame.style.setProperty("--wing-w", `${wingW}px`);

    arena.dataset.tier = tier;
    arena.dataset.mode = state.mode;
    arena.dataset.xray = String(state.xray);
    arena.dataset.compactWings = String(compactWings);

    wingLeft.classList.toggle("is-off-canvas", leftOff);
    wingLeft.classList.toggle("is-docked", !leftOff);
    wingRight.classList.toggle("is-off-canvas", rightOff);
    wingRight.classList.toggle("is-docked", !rightOff);

    btnOpenLeft.classList.toggle("is-hidden", !leftOff);
    btnOpenRight.classList.toggle("is-hidden", !rightOff);

    setTxt(vwReadout, `${state.vw}px`);
    vwSlider.value = String(state.vw);
    setTxt(
      vpTierTag,
      compactWings ? `${state.vw} PX` : `${tier.toUpperCase()} · ${state.vw} PX`
    );
    setTxt(
      vpWingTag,
      compactWings
        ? tier === "mobile"
          ? "双翼在画布外"
          : tier === "tablet"
            ? "右翼画布外"
            : "三列常驻"
        : tier === "mobile"
          ? "左右两翼在画布外"
          : tier === "tablet"
            ? "左栏常驻 · 右翼在画布外"
            : "三列全部落进画布"
    );

    const canDrag = leftOff || rightOff;
    dragBar.classList.toggle("is-disabled", !canDrag);

    bpButtons.forEach((b) => {
      const bp = Number(b.dataset.bp);
      const active =
        (bp === 375 && tier === "mobile") ||
        (bp === 768 && tier === "tablet") ||
        (bp === 1180 && tier === "desktop");
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    modeButtons.forEach((b) => {
      const active = b.dataset.mode === state.mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    btnXray.classList.toggle("is-active", state.xray);
    btnXray.setAttribute("aria-pressed", String(state.xray));
  }

  arena.dataset.activeSide = geom.activeSide;

  const leftParked = leftOff && p <= 0.02;
  const rightParked = rightOff && p >= -0.02;
  wingLeft.classList.toggle("is-parked", leftParked);
  wingRight.classList.toggle("is-parked", rightParked);
  wingLeft.classList.toggle("is-under-hidden", leftOff && !geom.leftVisible);
  wingRight.classList.toggle("is-under-hidden", rightOff && !geom.rightVisible);

  // GPU 位移完全取自 computeStageGeometry()，与读数共用唯一真值源
  vpCanvas.style.transform = `translate3d(${geom.mainX.toFixed(1)}px, 0, 0)`;
  wingLeft.style.transform = leftOff ? `translate3d(${geom.leftX.toFixed(1)}px, 0, 0)` : "none";
  wingRight.style.transform = rightOff ? `translate3d(${geom.rightX.toFixed(1)}px, 0, 0)` : "none";

  vpScrim.style.opacity = geom.scrimAlpha.toFixed(3);
  const scrimOn = Math.abs(p) > 0.08;
  vpScrim.classList.toggle("is-active", scrimOn);
  if (vpScrim.tabIndex !== (scrimOn ? 0 : -1)) vpScrim.tabIndex = scrimOn ? 0 : -1;

  // 整数百分比变化时才更新文案与 ARIA，降低拖动时的 DOM 写入频次
  const pctSigned = p >= 0 ? geom.drawerInFramePct : -geom.drawerInFramePct;
  const diagKey = `${staticKey}|${pctSigned}|${geom.pushedPct}|${geom.coveredPct}`;
  if (diagKey === prevDiagKey) return;
  prevDiagKey = diagKey;

  btnOpenLeft.setAttribute("aria-expanded", String(p > 0.3));
  btnOpenRight.setAttribute("aria-expanded", String(p < -0.3));

  const pct = geom.drawerInFramePct;
  setTxt(
    leftNote,
    leftOff
      ? p > 0.05
        ? compactWings
          ? `入画 ${pct}%`
          : `已拉入画布 ${pct}%`
        : compactWings
          ? "画布外"
          : "停泊在视口左缘之外"
      : compactWings
        ? "常驻"
        : "已入画布 · 常驻左栏"
  );

  setTxt(
    rightNote,
    rightOff
      ? p < -0.05
        ? compactWings
          ? `入画 ${pct}%`
          : `已拉入画布 ${pct}%`
        : compactWings
          ? "画布外"
          : "停泊在视口右缘之外"
      : compactWings
        ? "常驻"
        : "已入画布 · 常驻右栏"
  );

  const canDrag = leftOff || rightOff;
  dragBar.setAttribute("aria-valuenow", String(pctSigned));
  if (!canDrag) {
    setTxt(dragStatus, compactWings ? "三列已常驻" : "宽屏三列已常驻 · 切回 375/768 可拉抽屉");
  } else if (p > 0.08) {
    setTxt(dragStatus, compactWings ? `左目录入画 ${pct}%` : `左翼导航已拉入 ${pct}%`);
  } else if (p < -0.08) {
    setTxt(dragStatus, compactWings ? `右筛选入画 ${pct}%` : `右翼筛选已拉入 ${pct}%`);
  } else {
    setTxt(
      dragStatus,
      compactWings
        ? tier === "tablet"
          ? "← 左拉筛选"
          : "⇄ 拖拉抽屉"
        : tier === "tablet"
          ? "← 向左拖拉：拉出右翼筛选"
          : "⇄ 拖动拉出画布外"
    );
  }

  const diag = diagnose(state, geom);
  setTxt(vBadge, diag.badge);
  if (vBadge.dataset.tone !== diag.tone) vBadge.dataset.tone = diag.tone;
  setTxt(vSpec, `${diag.modeLabel} · ${diag.wingSummary}`);
  setTxt(vHeadline, diag.headline);
  setTxt(vBody, diag.body);
}

state._onFrameSync = syncStageDOM;
const stageCanvas = mountCanvasStage(canvas, arena, state, getViewportBox);

window.addEventListener("resize", () => {
  cachedMetricsKey = "";
  syncStageDOM();
  stageCanvas.invalidateBg();
  stageCanvas.draw();
});

function setVw(nextVw) {
  state.introDone = true;
  state.vw = Math.max(320, Math.min(1200, Math.round(nextVw)));
  state.progress = clampProgress(state.vw, state.progress);
  state.target = clampProgress(state.vw, state.target);
  cachedMetricsKey = "";
  syncStageDOM();
  stageCanvas.invalidateBg();
  stageCanvas.draw();
}

function setTarget(nextTarget) {
  state.introDone = true;
  state.target = clampProgress(state.vw, nextTarget);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    state.progress = state.target;
  }
  syncStageDOM();
  stageCanvas.draw();
}

bpButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setVw(Number(btn.dataset.bp));
    state.target = clampProgress(state.vw, 0);
    syncStageDOM();
    stageCanvas.draw();
  });
});

vwSlider.addEventListener("input", () => setVw(Number(vwSlider.value)));

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.introDone = true;
    state.mode = btn.dataset.mode;
    const { leftOff, rightOff } = allowedRange(state.vw);
    if (Math.abs(state.target) < 0.1 && (leftOff || rightOff)) {
      state.target = leftOff ? 1 : -1;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        state.progress = state.target;
      }
    }
    syncStageDOM();
    stageCanvas.invalidateBg();
    stageCanvas.draw();
  });
});

btnXray.addEventListener("click", () => {
  state.introDone = true;
  state.xray = !state.xray;
  syncStageDOM();
  stageCanvas.invalidateBg();
  stageCanvas.draw();
});

btnOpenLeft.addEventListener("click", () => setTarget(state.target > 0.5 ? 0 : 1));
btnOpenRight.addEventListener("click", () => setTarget(state.target < -0.5 ? 0 : -1));
btnCloseLeft.addEventListener("click", () => setTarget(0));
btnCloseRight.addEventListener("click", () => setTarget(0));
vpScrim.addEventListener("click", () => setTarget(0));

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.articleId = btn.dataset.article;
    renderArticle();
    if (tierOf(state.vw) === "mobile") setTarget(0);
  });
});

fltButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.filterTag = btn.dataset.tag;
    renderArticle();
    if (tierOf(state.vw) !== "desktop") setTarget(0);
  });
});

// 统一指针 + 触摸横向拖拉（同时支持鼠标、触屏、perf.mjs dispatchTouchEvent；纵滑不抢滚屏）
function bindHorizontalDrag(el) {
  let active = false;
  let startX = 0;
  let startY = 0;
  let startP = 0;
  let lockedAxis = "";
  let ptrId = null;

  function begin(x, y) {
    const { leftOff, rightOff } = allowedRange(state.vw);
    if (!leftOff && !rightOff) return false;
    state.introDone = true;
    active = true;
    startX = x;
    startY = y;
    startP = state.progress;
    lockedAxis = el === dragBar ? "x" : "";
    state.dragging = lockedAxis === "x";
    return true;
  }

  function move(x, y, ev) {
    if (!active) return;
    const dx = x - startX;
    const dy = y - startY;
    if (!lockedAxis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      if (lockedAxis === "y") {
        active = false;
        state.dragging = false;
        return;
      }
      state.dragging = true;
    }
    if (ev && ev.cancelable) ev.preventDefault();
    const { wingW } = computeFrameMetrics();
    const dragSpan = Math.max(96, wingW);
    const next = clampProgress(state.vw, startP + dx / dragSpan);
    state.progress = next;
    state.target = next;
    syncStageDOM();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stageCanvas.draw();
    }
  }

  function end() {
    if (!active) return;
    active = false;
    state.dragging = false;
    state.target = snapTarget(state.vw, state.progress);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      state.progress = state.target;
    }
    syncStageDOM();
    stageCanvas.draw();
  }

  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("button")) return;
    if (!begin(e.clientX, e.clientY)) return;
    ptrId = e.pointerId;
    try { el.setPointerCapture(ptrId); } catch {}
  });
  el.addEventListener("pointermove", (e) => {
    if (ptrId !== null && e.pointerId !== ptrId) return;
    move(e.clientX, e.clientY, e);
  });
  el.addEventListener("pointerup", (e) => {
    if (ptrId !== null && e.pointerId !== ptrId) return;
    ptrId = null;
    end();
  });
  el.addEventListener("pointercancel", () => {
    ptrId = null;
    end();
  });

  // 触屏兜底（保障 CDP dispatchTouchEvent 百分百响应）
  el.addEventListener("touchstart", (e) => {
    if (ptrId !== null || e.target.closest("button") || !e.touches.length) return;
    begin(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  el.addEventListener("touchmove", (e) => {
    if (!active || ptrId !== null || !e.touches.length) return;
    move(e.touches[0].clientX, e.touches[0].clientY, e);
  }, { passive: false });
  el.addEventListener("touchend", () => {
    if (ptrId !== null) return;
    end();
  });
}

bindHorizontalDrag(dragBar);
bindHorizontalDrag(vpCanvas);

dragBar.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    setTarget(state.target < 0 ? 0 : 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    setTarget(state.target > 0 ? 0 : -1);
  } else if (e.key === "Escape") {
    setTarget(0);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (!lightbox.hidden) return;
  if (e.key === "Escape") {
    if (Math.abs(state.target) > 0.05) setTarget(0);
    if (a11yOpen) closeA11yDrawer("via-esc");
  } else if ((e.key === "x" || e.key === "X") && !e.metaKey && !e.ctrlKey && !e.altKey) {
    state.introDone = true;
    state.xray = !state.xray;
    syncStageDOM();
    stageCanvas.invalidateBg();
    stageCanvas.draw();
  }
});

renderArticle();
syncStageDOM();

/* ================= 2. SECTION 01: 双面读法切换 ================= */
const LENS_COPY = {
  ui: {
    bleed: "不是装饰图形伸出纸边，而是导航、筛选或目录面板真实地停泊在浏览器可视视口（Viewport）之外；当用户点击或滑动时，它们跨过视口边界进入工作区。",
    crop: "窄屏视口按屏幕宽度做硬裁切：主内容独占 100% 视野，避免三栏硬塞导致每行只剩几个字；推挤展开时对侧被裁掉一截的主画布，反过来充当「点击即可返回」的锚点。",
    tension: "当抽屉拉入、主画布退让或被深蓝遮罩压暗时，界面形成清晰的「临时前景 vs 休眠背景」层次张力，提醒用户办完事就能退回原位。",
    summary: "在响应式网页 UI 里，画布外模式解决的是「窄屏装不下多栏、宽屏又不想浪费空间」的结构矛盾。",
  },
  graphic: {
    bleed: "海报 295 借用了印刷排版的「出血（Bleed）」思路：标题紧贴左缘、青绿圆弧与 OFF 大字直接切出画框，制造「画外还有更大版面」的延伸感。",
    crop: "刻意只露半只圆环、半截英文单词与局部网点，省去冗余外框，让观众的大脑自动在心里把残缺的图形补完。",
    tension: "把重量压向四条边线而非居中摆稳，打破对称静止感，让斜插色块与虚线箭头把视线猛地拉向边缘。",
    summary: "如果只照平面海报字面理解，很容易把「画布外模式」误当成单纯的「大图出血排版」——在 UI 体系里要记得它背后的交互结构。",
  },
  bridge: {
    bleed: "像海报右上角那块探出右缘的朱红三条线拉手：在界面边缘放一枚明确抓手（≡ 目录 / 侧边挂耳），让「边界之外还有空间」被用户看见，而不是藏得毫无痕迹。",
    crop: "在移动端横向卡片轨或抽屉边缘故意裁掉 15%–25%（经验值），利用完形闭合心理让用户本能地伸手往里拉，几乎不需要写「左滑查看更多」。",
    tension: "展开抽屉时保留 15%–20% 的主画布窄边并压暗，用边缘的不平衡张力告诉用户：你没有跳转新页面，轻点窄边就能回到刚才读的那一行。",
    summary: "把海报的三词翻译回界面语言：「越界」是空间调度，「裁切」是发现线索，「张力」是进退方位感。",
  },
};

const lensTabs = [...document.querySelectorAll(".lens-tab")];
const lensLab = document.getElementById("lens-lab");
const lensBleed = document.getElementById("lens-bleed");
const lensCrop = document.getElementById("lens-crop");
const lensTension = document.getElementById("lens-tension");
const lensSummary = document.getElementById("lens-summary");

function setLens(key) {
  const data = LENS_COPY[key] || LENS_COPY.ui;
  lensLab.dataset.lens = key;
  lensBleed.textContent = data.bleed;
  lensCrop.textContent = data.crop;
  lensTension.textContent = data.tension;
  lensSummary.textContent = data.summary;
  lensTabs.forEach((b) => {
    const on = b.dataset.lens === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

lensTabs.forEach((b) => b.addEventListener("click", () => setLens(b.dataset.lens)));
setLens("ui");

/* ================= 2.5 SECTION 02: 时间线粘性演进图解联动 ================= */
const ERA_META = {
  "1981": {
    no: "1981",
    tag: "XEROX STAR 8010 · NORM COX",
    caption: "Norm Cox 在 16×16 像素格子里画下三条平行横线，用来向用户示意「这里折叠着一叠菜单选项」。",
  },
  "2011": {
    no: "2011",
    tag: "PATH 2.0 & FACEBOOK IOS",
    caption: "320px 手机装不下桌面多栏顶栏：Path 2.0 把主菜单与好友流同时放进左右画布外，整屏留给时间流。",
  },
  "2012": {
    no: "2012",
    tag: "LUKE WROBLEWSKI · OFF CANVAS",
    caption: "定名「Off Canvas」并明确响应式演进：窄屏双翼在画布外，平板左翼进场，桌面三列齐平展开。",
  },
  "2016": {
    no: "2016",
    tag: "NN/G HIDDEN NAVIGATION STUDY",
    caption: "实测敲响警钟：桌面宽屏硬藏导航会让使用率从 48%–50% 跌到 27%，主观难度高出 21%。",
  },
  "2021": {
    no: "2021+",
    tag: "MATERIAL DESIGN 3 & HTML INERT",
    caption: "M3 给出 360dp 模态抽屉上限；原生 inert 属性锁住底层页面，Esc 与遮罩点击把焦点稳稳还给触发钮。",
  },
};

const tlVisual = document.getElementById("tl-visual");
const tlItems = [...document.querySelectorAll(".tl-item")];
const tlTriggers = [...document.querySelectorAll(".tl-trigger")];
const tlvTabs = [...document.querySelectorAll(".tlv-tab")];
const tlvSvgs = [...document.querySelectorAll(".tlv-svg")];
const tlvEraNo = document.getElementById("tlv-era-no");
const tlvEraTag = document.getElementById("tlv-era-tag");
const tlvCaption = document.getElementById("tlv-caption");

let tlManualUntil = 0;

function setTimelineEra(era, manual = false) {
  const info = ERA_META[era] || ERA_META["1981"];
  if (manual) tlManualUntil = performance.now() + 1200;
  tlVisual.dataset.era = era;
  tlvEraNo.textContent = info.no;
  tlvEraTag.textContent = info.tag;
  tlvCaption.textContent = info.caption;

  tlItems.forEach((li) => li.classList.toggle("is-active", li.dataset.era === era));
  tlTriggers.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.era === era)));
  tlvTabs.forEach((btn) => {
    const on = btn.dataset.eraBtn === era;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  });
  tlvSvgs.forEach((svg) => svg.classList.toggle("is-active", svg.dataset.eraSvg === era));
}

tlTriggers.forEach((btn) => btn.addEventListener("click", () => setTimelineEra(btn.dataset.era, true)));
tlvTabs.forEach((btn) => btn.addEventListener("click", () => setTimelineEra(btn.dataset.eraBtn, true)));

function syncTimelineFromScroll() {
  if (performance.now() < tlManualUntil) return;
  const anchorY = Math.max(110, window.innerHeight * 0.28);
  let bestEra = "";
  let bestDist = Infinity;
  for (const li of tlItems) {
    const r = li.getBoundingClientRect();
    if (r.bottom < 20 || r.top > window.innerHeight - 20) continue;
    const center = r.top + Math.min(r.height * 0.35, 60);
    const d = Math.abs(center - anchorY);
    if (d < bestDist) {
      bestDist = d;
      bestEra = li.dataset.era;
    }
  }
  if (bestEra && tlVisual.dataset.era !== bestEra) {
    setTimelineEra(bestEra, false);
  }
}

if ("IntersectionObserver" in window) {
  const tlObs = new IntersectionObserver(
    () => syncTimelineFromScroll(),
    { rootMargin: "-4% 0px -45% 0px", threshold: [0, 0.25, 0.6] }
  );
  tlItems.forEach((li) => tlObs.observe(li));
}
let tlScrollTick = 0;
window.addEventListener("scroll", () => {
  if (tlScrollTick) return;
  tlScrollTick = requestAnimationFrame(() => {
    tlScrollTick = 0;
    syncTimelineFromScroll();
  });
}, { passive: true });
setTimelineEra("1981", false);

/* ================= 3. SECTION 03: 四种进场动作慢动作实验台 ================= */
const mlToggle = document.getElementById("ml-toggle");
const mlScrub = document.getElementById("ml-scrub");
const mlPct = document.getElementById("ml-pct");
const mlCards = [...document.querySelectorAll(".ml-card")];

let mlVal = 0;
let mlAnimRaf = 0;

function renderMotionLab(pct) {
  mlVal = Math.max(0, Math.min(100, pct));
  const u = mlVal / 100;
  mlScrub.value = String(Math.round(mlVal));
  mlPct.textContent = `${Math.round(mlVal)}%`;
  mlToggle.setAttribute("aria-pressed", String(mlVal > 50));
  mlToggle.textContent = mlVal > 50 ? "收起 4 组抽屉" : "展开 4 组抽屉";

  for (const card of mlCards) {
    const mech = card.dataset.mech;
    const drawer = card.querySelector('[data-part="drawer"]');
    const main = card.querySelector('[data-part="main"]');
    const scrim = card.querySelector('[data-part="scrim"]');

    if (mech === "push") {
      drawer.style.transform = `translate3d(${(-100 + u * 100).toFixed(1)}%, 0, 0)`;
      main.style.transform = `translate3d(${(u * 44).toFixed(1)}%, 0, 0)`;
    } else if (mech === "overlay") {
      drawer.style.transform = `translate3d(${(-100 + u * 100).toFixed(1)}%, 0, 0)`;
      main.style.transform = "translate3d(0, 0, 0)";
      // 与开场浮层同款深海蓝 #042548 半透明遮罩（48% 处约 0.50，满开 0.58，杜绝平淡浅灰感）
      if (scrim) scrim.style.opacity = u <= 0.01 ? "0" : Math.min(0.58, 0.42 + u * 0.16).toFixed(2);
    } else if (mech === "reveal") {
      drawer.style.transform = "translate3d(0, 0, 0)";
      main.style.transform = `translate3d(${(u * 44).toFixed(1)}%, 0, 0)`;
    } else if (mech === "squeeze") {
      drawer.style.transform = `translate3d(${(-100 + u * 100).toFixed(1)}%, 0, 0)`;
      main.style.width = `${(100 - u * 44).toFixed(1)}%`;
    }
  }
}

mlScrub.addEventListener("input", () => {
  cancelAnimationFrame(mlAnimRaf);
  renderMotionLab(Number(mlScrub.value));
});

mlToggle.addEventListener("click", () => {
  cancelAnimationFrame(mlAnimRaf);
  const goal = mlVal > 50 ? 0 : 100;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    renderMotionLab(goal);
    return;
  }
  const start = mlVal;
  const t0 = performance.now();
  const dur = 520;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - k, 3);
    renderMotionLab(start + (goal - start) * ease);
    if (k < 1) mlAnimRaf = requestAnimationFrame(step);
  };
  mlAnimRaf = requestAnimationFrame(step);
});

renderMotionLab(48);

/* ================= 4. SECTION 04: 隐藏税与发现提示模拟器 ================= */
const CUE_DATA = {
  bare: {
    disc: "偏低（易被忽略）",
    noise: "极低",
    desk: "不建议（桌面慎藏主导航）",
    title: "孤立三条线图标：最省面积，也最容易被忘掉",
    desc: "只有一枚无字汉堡图标时，新访客必须先「猜里面有什么」再花一次点击打开验证。在窄屏上勉强可用，但如果直接照搬到桌面端，根据 NN/g 实测会让导航使用率明显跳水。",
    rule: "经验判断：只适合老用户极高频、且界面已塞不下两个汉字的极窄顶栏。",
    top: `<span class="cp-pill ghost">≡</span><span>设计周刊</span><span></span>`,
    body: `<div class="cp-lines"><i></i><i></i><i></i><i></i></div><p style="margin:auto 0 0;font-size:11px;color:#2C4663">顶栏只剩三条线，看不出站内还有哪些栏目。</p>`,
    bottom: "",
  },
  label: {
    disc: "中高（含义直白）",
    noise: "低",
    desk: "仅适合次级筛选，不藏一级导航",
    title: "图标 + 明确动词与激活计数：把「盲盒」变透明",
    desc: "仅仅在三条线旁边补上「目录」二字，或在筛选按钮上标出「筛选 (3)」，就能省去用户猜测「里面到底装了什么、刚才选的条件生没生效」的心理负担。",
    rule: "经验判断：筛选抽屉一定要在触发按钮上露出已选条件数量，关掉抽屉后状态依然可见。",
    top: `<span class="cp-pill">≡ 目录</span><span>设计周刊</span><span class="cp-pill ghost">筛选 (3)</span>`,
    body: `<div class="cp-lines"><i></i><i></i><i></i></div><p style="margin:auto 0 0;font-size:11px;color:#0E7E7A;font-weight:700">已用 3 条筛选条件 · 点右上角随时改</p>`,
    bottom: "",
  },
  combo: {
    disc: "高（NN/g 实测稳健）",
    noise: "低",
    desk: "桌面应直接展开常驻主栏",
    title: "组合导航：高频露在画布内，低频退守画布外",
    desc: "把使用率最高的 3–4 个核心入口常驻在底部标签栏或顶部主栏，只把「归档、设置、帮助、深层目录」放进画布外抽屉。既保住了首屏清净，又没有交出主任务的发现成本。",
    rule: "经验判断：这是绝大多数移动应用与内容站的黄金平衡点。",
    top: `<span>设计周刊</span><span class="cp-pill">≡ 更多</span>`,
    body: `<div class="cp-lines"><i></i><i></i><i></i></div><p style="margin:auto 0 0;font-size:11px;color:#2C4663">高频 4 项就在拇指边，低频收纳进右上抽屉。</p>`,
    bottom: `<div class="cp-tabbar"><span>首页</span><span>专题</span><span>图库</span><span>我的</span></div>`,
  },
  peek: {
    disc: "高（视觉直觉驱动）",
    noise: "中低",
    desk: "桌面同样有效（横向轨/拉耳）",
    title: "半露一角（刻意裁切）：让边界本身开口说话",
    desc: "直接借用海报 295 的「裁切 CROP」手法：让右侧卡片或侧边抽屉边缘在边界处故意露出 15%–25%（经验值）。大脑面对被截断的图形会产生天然补全冲动，不用写提示语用户就会伸手往里滑。",
    rule: "经验判断：半露一定要「明确截断」而非刚好齐平，齐平会让用户以为后面没有了。",
    top: `<span class="cp-pill">≡ 目录</span><span>设计周刊</span><span></span>`,
    body: `<div class="cp-lines"><i></i><i></i></div><div class="cp-rail"><div class="cp-card">第 01 篇<br>边界与留白</div><div class="cp-card cropped">第 02 篇<br>右缘裁掉 25% →</div></div>`,
    bottom: "",
  },
};

const cueTabs = [...document.querySelectorAll(".cue-tab")];
const cpTop = document.getElementById("cp-top");
const cpBody = document.getElementById("cp-body");
const cpBottom = document.getElementById("cp-bottom");
const cueDisc = document.getElementById("cue-disc");
const cueNoise = document.getElementById("cue-noise");
const cueDesk = document.getElementById("cue-desk");
const cueTitle = document.getElementById("cue-title");
const cueDesc = document.getElementById("cue-desc");
const cueRule = document.getElementById("cue-rule");

function setCue(key) {
  const d = CUE_DATA[key] || CUE_DATA.combo;
  cpTop.innerHTML = d.top;
  cpBody.innerHTML = d.body;
  cpBottom.innerHTML = d.bottom;
  cueDisc.textContent = d.disc;
  cueNoise.textContent = d.noise;
  cueDesk.textContent = d.desk;
  cueTitle.textContent = d.title;
  cueDesc.textContent = d.desc;
  cueRule.textContent = d.rule;
  cueTabs.forEach((b) => {
    const on = b.dataset.cue === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

cueTabs.forEach((b) => b.addEventListener("click", () => setCue(b.dataset.cue)));
setCue("combo");

/* ================= 5. SECTION 05: 响应式五大家族同步缩屏对照 ================= */
const FAM_DATA = {
  "295": {
    title: "295 画布外模式（本页）",
    text: "屏宽缩小后，并不把导航 A 和辅栏 C 堆到页面最底端让用户翻半天，而是把它们停泊在可视视口左右之外；主文 B 独占整屏，用户随时按需拉出 A 或 C。",
    link: "当前就在本页——最适合「多列功能齐全、但手机首屏必须干净聚焦」的产品界面。",
    fates: { desktop: "三栏全部常驻", tablet: "A 常驻 · C 退至右界外", mobile: "A / C 退居边界外" },
  },
  "291": {
    title: "291 大体流动模式（Mostly Fluid）",
    text: "大屏锁定容器最大宽度并留出外边距，中屏小幅收缩，到了手机窄屏再顺流折成一列。结构变动最温和，所有模块都一直留在画布里。",
    link: `深入玩法与示例见专页：<a href="https://layout.xiaoxiaodong.ai/291/play/" target="_blank" rel="noopener">前往 291 大体流动模式 →</a>`,
    fates: { desktop: "定宽居中留白", tablet: "B 顶栏 · A/C 并排", mobile: "框内顺流纵叠" },
  },
  "292": {
    title: "292 列下落模式（Column Drop）",
    text: "多栏页面变窄时，不靠缩窄文字硬扛，而是把最靠边的一列整块「落」到下方，所有内容依然靠纵向滚动全部可见，无需开关抽屉。",
    link: `深入玩法与示例见专页：<a href="https://layout.xiaoxiaodong.ai/292/play/" target="_blank" rel="noopener">前往 292 列下落模式 →</a>`,
    fates: { desktop: "三列等高横排", tablet: "C 整列先落底", mobile: "整列依次落底" },
  },
  "293": {
    title: "293 布局切换模式（Layout Shifter）",
    text: "在手机、平板、桌面之间变动最大——不只是下落或隐藏，而是针对不同设备直接重组模块网格与视觉结构，设计开发成本最高。",
    link: `深入玩法与示例见专页：<a href="https://layout.xiaoxiaodong.ai/293/play/" target="_blank" rel="noopener">前往 293 布局切换模式 →</a>`,
    fates: { desktop: "左栏 + 右双层", tablet: "A 顶栏 + B/C 并排", mobile: "按断点重组阵型" },
  },
  "294": {
    title: "294 微调模式（Tiny Tweaks）",
    text: "页面本身就是单列纵排，跨设备时根本不需要挪动列或藏进画布外，只需要温和调整字号、图片尺寸和左右留白。",
    link: `深入玩法与示例见专页：<a href="https://layout.xiaoxiaodong.ai/294/play/" target="_blank" rel="noopener">前往 294 微调模式 →</a>`,
    fates: { desktop: "单列宽留白", tablet: "单列收紧边距", mobile: "始终单列仅调距" },
  },
};

const famLab = document.getElementById("fam-lab");
const famWall = document.getElementById("fam-wall");
const famCards = [...document.querySelectorAll(".fam-card")];
const famBpBtns = [...document.querySelectorAll("button[data-fam-vw]")];
const famVwSlider = document.getElementById("fam-vw-slider");
const famVwVal = document.getElementById("fam-vw-val");
const famTitle = document.getElementById("fam-title");
const famText = document.getElementById("fam-text");
const famLink = document.getElementById("fam-link");

function setFamWidth(vw) {
  const clamped = Math.max(375, Math.min(1200, Math.round(vw)));
  const tier = clamped < 640 ? "mobile" : clamped < 960 ? "tablet" : "desktop";
  const pct = 56 + ((clamped - 375) / (1200 - 375)) * 44;

  famLab.dataset.bpTier = tier;
  famWall.dataset.tier = tier;
  famWall.style.setProperty("--fam-w", `${pct.toFixed(1)}%`);
  famVwVal.textContent = `${clamped}px`;
  famVwSlider.value = String(clamped);

  famBpBtns.forEach((b) => {
    const bp = Number(b.dataset.famVw);
    const on =
      (bp === 375 && tier === "mobile") ||
      (bp === 768 && tier === "tablet") ||
      (bp === 1200 && tier === "desktop");
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });

  for (const [id, data] of Object.entries(FAM_DATA)) {
    const el = document.getElementById(`fate-${id}`);
    if (el) el.textContent = data.fates[tier];
  }
}

function setFam(id) {
  const d = FAM_DATA[id] || FAM_DATA["295"];
  famLab.dataset.selected = id;
  famTitle.textContent = d.title;
  famText.textContent = d.text;
  famLink.innerHTML = d.link;
  famCards.forEach((b) => {
    const on = b.dataset.fam === id;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

famBpBtns.forEach((b) => b.addEventListener("click", () => setFamWidth(Number(b.dataset.famVw))));
famVwSlider.addEventListener("input", () => setFamWidth(Number(famVwSlider.value)));
famCards.forEach((b) => b.addEventListener("click", () => setFam(b.dataset.fam)));
setFamWidth(375);
setFam("295");

/* ================= 6. SECTION 06: 无障碍与焦点陷阱体检器 ================= */
const a11yLab = document.getElementById("a11y-lab");
const a11yGoodBtn = document.getElementById("a11y-good");
const a11yBadBtn = document.getElementById("a11y-bad");
const a11yOpenBtn = document.getElementById("a11y-open-btn");
const a11yCloseBtn = document.getElementById("a11y-close-btn");
const a11yDrawer = document.getElementById("a11y-drawer");
const a11yScrim = document.getElementById("a11y-scrim");
const a11yBehind = document.getElementById("a11y-behind");
const a11ySimTab = document.getElementById("a11y-sim-tab");
const a11ySimEsc = document.getElementById("a11y-sim-esc");
const a11yLog = document.getElementById("a11y-log");
const a11yDrawerItems = [a11yCloseBtn, ...a11yDrawer.querySelectorAll(".a11y-d-link")];
const a11yBgBtns = [...a11yBehind.querySelectorAll(".a11y-ghost-btn")];

let a11ySafe = true;
let a11yOpen = false;
let a11yTabIdx = 0;

function clearA11yHighlights() {
  a11yDrawerItems.forEach((el) => el.classList.remove("is-focused-safe"));
  a11yBgBtns.forEach((el) => el.classList.remove("is-focused-leak"));
}

function setA11yMode(safe) {
  a11ySafe = safe;
  a11yLab.dataset.safe = String(safe);
  a11yGoodBtn.classList.toggle("is-active", safe);
  a11yGoodBtn.setAttribute("aria-pressed", String(safe));
  a11yBadBtn.classList.toggle("is-active", !safe);
  a11yBadBtn.setAttribute("aria-pressed", String(!safe));
  if (a11yOpen) {
    a11yBehind.inert = safe;
  }
  clearA11yHighlights();
  a11yLog.classList.remove("is-danger");
  a11yLog.textContent = safe
    ? "当前为「规范版」：打开抽屉后会给底层加 inert、锁住 Tab 焦点、支持 Esc 与点遮罩关闭。"
    : "当前已切到「缺陷版」：底层未加 inert 且未绑 Esc。点「打开测试抽屉」后再连按「模拟按 Tab」，看焦点怎么穿墙漏到背后！";
}

function openA11yDrawer() {
  a11yOpen = true;
  a11yTabIdx = 0;
  a11yLab.dataset.open = "true";
  a11yDrawer.hidden = false;
  a11yScrim.hidden = false;
  a11yBehind.inert = a11ySafe;
  clearA11yHighlights();
  a11yDrawerItems[0].classList.add("is-focused-safe");
  a11yLog.classList.remove("is-danger");
  a11yLog.textContent = a11ySafe
    ? "抽屉已打开，底层已启用 inert 隔离，键盘焦点已自动落到抽屉顶部「关闭 ×」。继续点「模拟按 Tab」验证循环。"
    : "缺陷版抽屉已打开（底层未设 inert）。继续点「模拟按 Tab」3 次，看看键盘焦点会不会溜到底层危险按钮上！";
}

function closeA11yDrawer(reason) {
  if (!a11yOpen) return;
  if (!a11ySafe && (reason === "via-esc" || reason === "via-scrim")) {
    a11yLog.classList.add("is-danger");
    a11yLog.textContent =
      reason === "via-esc"
        ? "Esc 没反应！缺陷版忘了监听 Escape 键，键盘用户被困在抽屉里出不去。"
        : "点遮罩没反应！缺陷版没给遮罩绑定关闭事件，手机用户只能满屏找小叉号。";
    return;
  }
  a11yOpen = false;
  a11yLab.dataset.open = "false";
  a11yDrawer.hidden = true;
  a11yScrim.hidden = true;
  a11yBehind.inert = false;
  clearA11yHighlights();
  a11yLog.classList.remove("is-danger");
  a11yLog.textContent =
    reason === "via-esc"
      ? "规范通过：按 Esc 立刻关掉抽屉，底层恢复可交互，焦点稳稳还给「≡ 打开测试抽屉」按钮。"
      : "规范通过：抽屉已关闭，焦点归还触发按钮，用户无需从页面最顶重新 Tab 一遍。";
}

a11yGoodBtn.addEventListener("click", () => setA11yMode(true));
a11yBadBtn.addEventListener("click", () => setA11yMode(false));
a11yOpenBtn.addEventListener("click", openA11yDrawer);
a11yCloseBtn.addEventListener("click", () => closeA11yDrawer("via-close"));
a11yScrim.addEventListener("click", () => closeA11yDrawer("via-scrim"));

a11ySimTab.addEventListener("click", () => {
  if (!a11yOpen) {
    a11yLog.classList.remove("is-danger");
    a11yLog.textContent = "抽屉还没打开呢——先点测试框里的「≡ 打开测试抽屉」再测试 Tab 焦点。";
    return;
  }
  clearA11yHighlights();
  if (a11ySafe) {
    a11yTabIdx = (a11yTabIdx + 1) % a11yDrawerItems.length;
    const cur = a11yDrawerItems[a11yTabIdx];
    cur.classList.add("is-focused-safe");
    a11yLog.classList.remove("is-danger");
    a11yLog.textContent = `焦点锁在抽屉内循环（第 ${a11yTabIdx + 1}/${a11yDrawerItems.length} 项：${cur.textContent.trim()}），底层危险按钮被 inert 牢牢挡住。`;
  } else {
    const all = [...a11yDrawerItems, ...a11yBgBtns];
    a11yTabIdx = (a11yTabIdx + 1) % all.length;
    const cur = all[a11yTabIdx];
    if (a11yBgBtns.includes(cur)) {
      cur.classList.add("is-focused-leak");
      a11yLog.classList.add("is-danger");
      a11yLog.textContent = `焦点穿墙泄漏！键盘 Tab 已经溜到被遮罩盖住的「${cur.dataset.bgBtn}」——盲人读屏用户此时按回车就会误触发！`;
    } else {
      cur.classList.add("is-focused-safe");
      a11yLog.classList.remove("is-danger");
      a11yLog.textContent = `焦点走到抽屉内「${cur.textContent.trim()}」——再按一次「模拟按 Tab」，看看会不会穿墙漏出去！`;
    }
  }
});

a11ySimEsc.addEventListener("click", () => {
  if (!a11yOpen) {
    a11yLog.textContent = "抽屉当前是关闭状态，先打开再测 Esc。";
    return;
  }
  closeA11yDrawer("via-esc");
});

/* ================= 7. SECTION 07: 小练习四选一（严格单变量对照与逐项复盘） ================= */
const QUIZ_ANSWERS = {
  A: {
    ok: false,
    title: "方案 A 不合适：只错了一个变量——「宽屏隐藏策略」",
    text: "它的 375px 手机端与正确答案 C 完全一致（80% 抽屉 + 20% 返回缝），但到了 1280px 桌面宽屏仍把高频一级目录藏进左上角汉堡图标，白白交了 NN/g 实测指出的桌面端「隐藏税」。",
  },
  B: {
    ok: false,
    title: "方案 B 不合适：只错了一个变量——「窄屏返回锚点」",
    text: "它的 1280px 桌面端与正确答案 C 完全一致（高频目录常驻左栏、低频筛选按需呼出），但 375px 手机端抽屉 100% 封死整屏，既没有留出被压暗的主画布窄边，也缺关闭钮，彻底切断了方位感。",
  },
  C: {
    ok: true,
    title: "答对了！方案 C 在三个变量上全部成立",
    text: "375px 手机端展开目录时占 80%、保留 20% 深蓝压暗主画布作返回锚点；1280px 桌面端把高频一级「目录」释放为常驻左栏，仅将低频「筛选」留给按需呼出，兼顾可读性、零隐藏税与正确主次优先级。",
  },
  D: {
    ok: false,
    title: "方案 D 不合适：只错了一个变量——「宽屏主次优先级」",
    text: "它的 375px 手机端与正确答案 C 完全一致，1280px 桌面也确实展开了一侧常驻栏；但错在把低频「筛选」常驻钉在右侧，反倒让高频一级「目录」继续待在左上角画布外抽屉里，主次完全倒置。",
  },
};

const QUIZ_BREAKDOWN = [
  { opt: "A", ok: false, varName: "错在变量：宽屏隐藏策略", note: "375px 正确；但 1280px 顶栏空置却仍把一级目录藏进画布外汉堡图标。" },
  { opt: "B", ok: false, varName: "错在变量：窄屏返回锚点", note: "1280px 正确；但 375px 抽屉 100% 铺满无返回缝与关闭钮，丢失原页锚点。" },
  { opt: "D", ok: false, varName: "错在变量：宽屏主次优先级", note: "375px 与 C 相同；但 1280px 把低频筛选常驻右侧，反让高频目录留在画布外。" },
  { opt: "C", ok: true, varName: "唯一全对：三变量兼顾", note: "375px 留 20% 返回缝，1280px 释放高频目录常驻、低频筛选按需拉出。" },
];

const quizGrid = document.getElementById("quiz-grid");
const quizCards = [...quizGrid.querySelectorAll(".q-card")];
const qvTitle = document.getElementById("qv-title");
const qvText = document.getElementById("qv-text");
const qvBreakdown = document.getElementById("qv-breakdown");

quizCards.forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const ans = QUIZ_ANSWERS[opt];
    quizGrid.classList.add("is-answered");
    quizCards.forEach((c) => {
      const k = c.dataset.opt;
      const isRight = QUIZ_ANSWERS[k].ok;
      c.setAttribute("aria-pressed", String(k === opt));
      c.classList.toggle("is-right", isRight);
      c.classList.toggle("is-wrong", !isRight);
      c.querySelector(".q-mark").textContent = isRight ? "✓ 最佳方案" : "× 踩坑";
    });
    qvTitle.textContent = ans.title;
    qvText.textContent = ans.text;
    qvBreakdown.innerHTML = QUIZ_BREAKDOWN.map(
      (item) => `
      <li class="${item.ok ? "is-ok" : "is-err"}${item.opt === opt ? " is-picked" : ""}">
        <span class="qvb-opt mono">方案 ${item.opt}</span>
        <strong>${item.varName}</strong>
        <span>${item.note}</span>
      </li>`
    ).join("");
    qvBreakdown.hidden = false;
  });
});

/* ================= 8. SECTION 08: 原海报全屏看图灯箱 ================= */
const posterBtn = document.getElementById("poster-btn");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbZoom = document.getElementById("lb-zoom");
const lbClose = document.getElementById("lb-close");

let lbZoomed = false;
let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbMoved = false;
let lbStartX = 0;
let lbStartY = 0;

function applyLbTransform() {
  lbStage.dataset.zoomed = String(lbZoomed);
  lbZoom.setAttribute("aria-pressed", String(lbZoomed));
  lbZoom.textContent = lbZoomed ? "还原 1×" : "放大 1.8×";
  lbImg.style.transform = lbZoomed
    ? `translate3d(${lbTx}px, ${lbTy}px, 0) scale(1.8)`
    : "translate3d(0, 0, 0) scale(1)";
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbZoomed = false;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoom.addEventListener("click", () => {
  lbZoomed = !lbZoomed;
  if (!lbZoomed) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  if (!lbZoomed) return;
  lbDrag = true;
  lbMoved = false;
  lbStartX = e.clientX - lbTx;
  lbStartY = e.clientY - lbTy;
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  const nx = e.clientX - lbStartX;
  const ny = e.clientY - lbStartY;
  if (Math.hypot(nx - lbTx, ny - lbTy) > 4) lbMoved = true;
  lbTx = Math.max(-420, Math.min(420, nx));
  lbTy = Math.max(-520, Math.min(520, ny));
  applyLbTransform();
});

lbStage.addEventListener("pointerup", () => { lbDrag = false; });

lbImg.addEventListener("click", (e) => {
  e.stopPropagation();
  if (lbMoved) { lbMoved = false; return; }
  lbZoomed = !lbZoomed;
  if (!lbZoomed) { lbTx = 0; lbTy = 0; }
  applyLbTransform();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.hidden && e.key === "Escape") closeLightbox();
});
