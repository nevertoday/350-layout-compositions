import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  HERO_SLIDES,
  DEFAULT_WRONG_STATE,
  evaluateHero,
  evaluatePeekLab,
  RUNYON_WEIGHTS,
  DECAY_ITEMS,
  AUTOPLAY_CARDS,
  TRIAGE_CASES,
  QUIZ_FEEDBACK,
} from "./model.js";

// ============================================================
// 原海报几何景观插画（5 张同语汇无五官现代几何卡片，宽幅不变形且永不切圆顶）
// ============================================================
function cardArtSvg(art) {
  if (art === "mint-hills") {
    return `<svg viewBox="0 0 560 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="560" height="200" fill="#E8F1EC"/>
      <circle cx="235" cy="70" r="36" fill="#8CCBBF"/>
      <path d="M-80 124 C60 98 180 156 320 166 C420 172 500 152 640 144 L640 205 L-80 205 Z" fill="#92CFC4"/>
    </svg>`;
  }
  if (art === "teal-peak") {
    return `<svg viewBox="0 0 560 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="560" height="200" fill="#149C9C"/>
      <circle cx="212" cy="76" r="44" fill="#FBF9F5"/>
      <polygon points="148,202 332,58 510,202" fill="#03384F"/>
    </svg>`;
  }
  if (art === "amber-dune") {
    return `<svg viewBox="0 0 560 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="560" height="200" fill="#FDEECA"/>
      <rect x="148" y="42" width="76" height="72" fill="#FAD66E"/>
      <path d="M180 205 C235 112 348 80 560 96 L560 205 Z" fill="#FBD879"/>
    </svg>`;
  }
  if (art === "slate-arch") {
    return `<svg viewBox="0 0 560 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="560" height="200" fill="#E2EFEF"/>
      <path d="M150 202 L150 108 A68 68 0 0 1 286 108 L286 202 Z" fill="#086968"/>
      <path d="M262 202 L262 132 A52 52 0 0 1 366 132 L366 202 Z" fill="#51B6B1"/>
      <circle cx="386" cy="64" r="24" fill="#FBF9F5"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 560 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect width="560" height="200" fill="#EBF3EE"/>
    <circle cx="364" cy="62" r="28" fill="#FAD66E"/>
    <rect x="0" y="122" width="560" height="80" fill="#92CFC4"/>
    <polygon points="0,150 320,150 374,202 0,202" fill="#149C9C"/>
    <rect x="0" y="176" width="560" height="26" fill="#03384F"/>
  </svg>`;
}

// ============================================================
// 开场：活体轮播轨道 + 2D Canvas 顶沿露边测绘尺
// ============================================================
const state = { ...DEFAULT_WRONG_STATE };
const heroStage = document.getElementById("hero-stage");
const heroTrack = document.getElementById("hero-track");
const heroPrev = document.getElementById("hero-prev");
const heroNext = document.getElementById("hero-next");
const heroDots = document.getElementById("hero-dots");
const heroDotsBar = document.getElementById("hero-dots-bar");
const heroDotsCount = document.getElementById("hero-dots-count");
const rulerCanvas = document.getElementById("hero-ruler");
const rulerCtx = rulerCanvas.getContext("2d");
const rulerReadout = document.getElementById("ruler-readout");
const autoBanner = document.getElementById("auto-banner");
const autoBadge = document.getElementById("auto-badge");
const autoFill = document.getElementById("auto-fill");
const autoPauseBtn = document.getElementById("auto-pause-btn");

const ctlCardPct = document.getElementById("ctl-card-pct");
const valCardPct = document.getElementById("val-card-pct");
const topScore = document.getElementById("top-score");
const mintBoard = document.querySelector(".mint-board");
const diagTag = document.getElementById("diag-tag");
const diagMetrics = document.getElementById("diag-metrics");
const diagTitle = document.getElementById("diag-title");
const diagWhy = document.getElementById("diag-why");
const diagAction = document.getElementById("diag-action");
const demoGlyph = document.getElementById("title-demo-glyph");

// 预构建 5 张活体卡片节点
const slideEls = HERO_SLIDES.map((s) => {
  const el = document.createElement("article");
  el.className = "c-slide";
  el.dataset.id = String(s.id);
  el.dataset.theme = s.theme;
  el.innerHTML = `
    <div class="c-art">${cardArtSvg(s.art)}</div>
    <div class="c-body">
      <div class="c-title-line">
        <h3 class="c-title">${s.tag}</h3>
        <span class="c-idx" lang="en">0${s.id + 1} / 0${HERO_SLIDES.length}</span>
      </div>
      <span class="c-bar" aria-hidden="true"></span>
      <p class="c-desc">${s.body}</p>
      <div class="c-chips">${s.chips.map((c) => `<span class="c-chip" lang="en">${c}</span>`).join("")}</div>
    </div>
  `;
  heroTrack.appendChild(el);
  return el;
});

// 缓存几何与连续动画物理量（不每帧触发布局回流）
let stageW = heroStage.clientWidth || 1000;
let stageH = heroStage.clientHeight || 360;
let rulerW = rulerCanvas.clientWidth || 1000;
let rulerH = rulerCanvas.clientHeight || 34;

let currentPos = state.index; // 连续浮点索引，拖动与松手吸附都驱动它
let dragActive = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPos = state.index;
let dragMoved = false;
let dragHorizontal = null;
let lastPointerX = 0;
let pointerVel = 0;
let hoverStage = false;
let focusInsideStage = false;
let autoElapsed = 0;
let introProgress = 0;
let needsRender = true;
let lastEval = null;

function measureStage() {
  stageW = heroStage.clientWidth || 1000;
  stageH = heroStage.clientHeight || 360;
  rulerW = rulerCanvas.clientWidth || stageW;
  rulerH = rulerCanvas.clientHeight || 34;
  const dpr = pixelRatio(1.5);
  const pw = Math.max(1, Math.round(rulerW * dpr));
  const ph = Math.max(1, Math.round(rulerH * dpr));
  if (rulerCanvas.width !== pw || rulerCanvas.height !== ph) {
    rulerCanvas.width = pw;
    rulerCanvas.height = ph;
  }
  needsRender = true;
}

new ResizeObserver(() => {
  measureStage();
  syncUI();
  heroLoop.draw();
}).observe(heroStage);

function renderDots(evalData) {
  const count = evalData.ctrl.dots;
  heroDotsBar.classList.toggle("is-hidden", count === 0);
  if (count === 0) return;
  heroDots.classList.toggle("is-overload", count > 5);
  const existing = heroDots.children.length;
  if (existing !== count) {
    heroDots.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dot-btn";
      btn.role = "tab";
      btn.setAttribute("aria-label", `切到第 ${i + 1} 张`);
      btn.innerHTML = `<span class="dot-pip"></span>`;
      btn.addEventListener("click", () => {
        goTo(i % HERO_SLIDES.length, true);
      });
      heroDots.appendChild(btn);
    }
  }
  const activeDot = count > 5 ? state.index : state.index % count;
  [...heroDots.children].forEach((b, idx) => {
    b.setAttribute("aria-selected", idx === activeDot ? "true" : "false");
  });
  heroDotsCount.textContent = `${state.index + 1} / ${count}`;
}

function drawRuler(evalData, pos) {
  const dpr = rulerCanvas.width / Math.max(1, rulerW);
  const ctx = rulerCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rulerW, rulerH);

  const pad = 2;
  const w = rulerW - pad * 2;
  const h = rulerH;
  const centerX = pad + w / 2;
  const fracShift = (state.index - pos) * (evalData.stepPx / Math.max(1, evalData.vw)) * w;
  const cardSpan = (evalData.cardW / evalData.vw) * w;
  const gapSpan = (evalData.gapPx / evalData.vw) * w;
  const cLeft = centerX - cardSpan / 2 + fracShift;
  const cRight = centerX + cardSpan / 2 + fracShift;

  // 底层标尺轨
  ctx.fillStyle = "#EFF5F3";
  ctx.fillRect(pad, 6, w, h - 12);

  // 居中主卡跨度块
  ctx.fillStyle = evalData.pillars.focus.ok ? "#149C9C" : "#6B8B96";
  ctx.fillRect(Math.max(pad, cLeft), 6, Math.max(2, Math.min(pad + w, cRight) - Math.max(pad, cLeft)), h - 12);

  // 左右真实露边区标注色块
  const peekColor = evalData.pillars.preview.ok ? "#51B6B1" : "#D45848";
  const lPeekEnd = Math.max(pad, cLeft - gapSpan);
  if (lPeekEnd > pad + 1) {
    ctx.fillStyle = peekColor;
    ctx.fillRect(pad, 9, lPeekEnd - pad, h - 18);
  }
  const rPeekStart = Math.min(pad + w, cRight + gapSpan);
  if (pad + w - rPeekStart > 1) {
    ctx.fillStyle = peekColor;
    ctx.fillRect(rPeekStart, 9, pad + w - rPeekStart, h - 18);
  }

  // 中心基准上下短针尖（绝不穿过中央数字）
  ctx.strokeStyle = "#072130";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(centerX, 1);
  ctx.lineTo(centerX, 5.5);
  ctx.moveTo(centerX, h - 5.5);
  ctx.lineTo(centerX, h - 1);
  ctx.stroke();

  // 中央简短标字
  ctx.font = `600 11px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  if (cardSpan > 78) {
    ctx.fillText(`主卡 ${Math.round(evalData.cardPct)}%`, Math.max(pad + 42, Math.min(pad + w - 42, (cLeft + cRight) / 2)), h / 2 + 0.5);
  }
  if (lPeekEnd - pad > 44) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`露 ${Math.round(evalData.peekPx)}px`, (pad + lPeekEnd) / 2, h / 2 + 0.5);
  }
  if (pad + w - rPeekStart > 44) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`露 ${Math.round(evalData.peekPx)}px`, (rPeekStart + pad + w) / 2, h / 2 + 0.5);
  }
  ctx.restore();
}

function layoutSlides(evalData, pos, introEase) {
  const cardH = Math.min(stageH - 28, Math.max(206, stageH * 0.87));
  const cW = Math.round(evalData.cardW);
  const cH = Math.round(cardH);

  // 动态调整左右骑边圆箭的位置，紧贴居中主卡左右边沿
  const edgeOffset = Math.max(10, Math.round((stageW - cW) / 2 - 22));
  heroPrev.style.left = `${edgeOffset}px`;
  heroNext.style.right = `${edgeOffset}px`;

  for (let i = 0; i < slideEls.length; i++) {
    const el = slideEls[i];
    const rel = i - pos;
    const dist = Math.abs(rel);
    const tScale = Math.min(1, dist);
    const scale = 1 + (evalData.sideScale - 1) * tScale;
    const opacity = (1 + (evalData.sideOpacity - 1) * tScale) * introEase;
    const tx = rel * evalData.stepPx;
    const ty = (1 - introEase) * 14 * (1 + dist * 0.35);

    el.style.width = `${cW}px`;
    el.style.height = `${cH}px`;
    el.style.transform = `translate3d(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px), 0) scale(${scale.toFixed(4)})`;
    el.style.opacity = opacity.toFixed(3);
    el.style.zIndex = String(10 - Math.round(dist * 3));

    const isCenter = i === state.index;
    el.classList.toggle("is-active", isCenter);
    el.setAttribute("aria-hidden", dist > 1.45 ? "true" : "false");

    if (isCenter) {
      const sh = evalData.shadowLevel;
      el.style.boxShadow =
        sh === 0
          ? "0 3px 12px rgba(7, 33, 48, 0.05)"
          : sh === 1
          ? "0 10px 26px rgba(7, 33, 48, 0.11)"
          : sh === 2
          ? "0 16px 36px rgba(3, 56, 79, 0.17)"
          : "0 22px 46px rgba(3, 56, 79, 0.25)";
    } else {
      el.style.boxShadow = "0 3px 10px rgba(7, 33, 48, 0.05)";
    }
  }
}

function syncUI() {
  const ev = evaluateHero(state, stageW);
  lastEval = ev;

  // 顶眉分数与按钮激活状态
  topScore.textContent = ev.score === 4 ? "4 / 4 校准完成" : `${ev.score} / 4 待调校`;
  topScore.classList.toggle("is-ok", ev.score === 4);
  topScore.classList.toggle("is-err", ev.score < 4);

  ctlCardPct.value = String(state.cardPct);
  valCardPct.textContent = `${state.cardPct}%`;

  document.querySelectorAll("[data-focus]").forEach((b) => {
    const on = b.dataset.focus === state.focusMode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-nav]").forEach((b) => {
    const on = b.dataset.nav === state.controls;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-pace]").forEach((b) => {
    const on = b.dataset.pace === state.pace;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  });

  // 标题示范微缩徽标同步变形
  const sideW = Math.round(Math.max(2, Math.min(18, (ev.peekRatioPct / 24) * 16)));
  const centerW = Math.round(Math.max(20, Math.min(44, (ev.cardPct / 100) * 44)));
  const sideH = Math.round(26 / ev.focusScale);
  const gSides = demoGlyph.querySelectorAll(".tdg-side");
  gSides.forEach((s) => {
    s.style.width = `${sideW}px`;
    s.style.height = `${sideH}px`;
    s.style.opacity = ev.peekPx < 2 ? "0.2" : String(ev.sideOpacity);
  });
  const gCenter = demoGlyph.querySelector(".tdg-center");
  gCenter.style.width = `${centerW}px`;

  // 导航箭头显隐与边界禁用
  heroPrev.classList.toggle("is-hidden", !ev.ctrl.arrows);
  heroNext.classList.toggle("is-hidden", !ev.ctrl.arrows);
  heroPrev.disabled = state.index <= 0;
  heroNext.disabled = state.index >= HERO_SLIDES.length - 1;
  renderDots(ev);

  // 自动播放细条状态
  const isAuto = state.pace !== "manual";
  autoBanner.classList.toggle("is-hidden", !isAuto);
  autoBanner.classList.toggle("is-safe", state.pace === "slow");
  autoPauseBtn.hidden = state.pace !== "slow";
  if (state.pace === "fast") {
    autoBadge.textContent = "1.8s 强制自播中（无暂停）";
  } else if (state.pace === "slow") {
    const stopped = state.paused || hoverStage || focusInsideStage;
    autoBadge.textContent = stopped ? "已悬停 / 暂停" : "5s 慢播中（悬停即停）";
    autoPauseBtn.textContent = state.paused ? "继续" : "暂停";
  }

  // 顶部测绘尺文字
  rulerReadout.textContent = `PEEK ${Math.round(ev.peekPx)}px (${ev.peekRatioPct.toFixed(1)}%) · FOCUS ${ev.focusScale.toFixed(2)}× · ${state.index + 1} / ${ev.ctrl.dots || HERO_SLIDES.length}`;

  // 浅薄荷诊单与原海报四原则检核
  mintBoard.classList.toggle("is-err", ev.diag.level === "err");
  diagTag.textContent = ev.score === 4 ? "4 / 4 达标" : `${ev.score} / 4 待调校`;
  diagTag.classList.toggle("is-ok", ev.score === 4);
  diagTag.classList.toggle("is-err", ev.score < 4);
  diagMetrics.textContent = `单侧露边 ${Math.round(ev.peekPx)}px · 主/侧面积 ${ev.areaRatio.toFixed(2)}×`;
  diagTitle.textContent = ev.diag.title;
  diagWhy.textContent = ev.diag.why;
  diagAction.textContent = ev.diag.action;

  const map = [
    ["focus", "pillar-focus", "st-focus"],
    ["flow", "pillar-flow", "st-flow"],
    ["preview", "pillar-preview", "st-preview"],
    ["nav", "pillar-nav", "st-nav"],
  ];
  for (const [key, boxId, stId] of map) {
    const p = ev.pillars[key];
    document.getElementById(boxId).classList.toggle("is-err", !p.ok);
    document.getElementById(stId).textContent = p.badge;
  }

  needsRender = true;
}

function goTo(nextIdx, fromUser = false) {
  const clamped = Math.max(0, Math.min(HERO_SLIDES.length - 1, nextIdx));
  state.index = clamped;
  autoElapsed = 0;
  if (fromUser && state.pace === "slow") {
    state.paused = true;
  }
  syncUI();
  heroLoop.draw();
}

// 卡片点击：点露出侧卡直接切过去
slideEls.forEach((el, idx) => {
  el.addEventListener("click", () => {
    if (dragMoved) return;
    if (idx !== state.index) goTo(idx, true);
  });
});

// 真实可拖拽轨道（兼容鼠标 + 触屏 + CDP touch 事件，竖向滚屏完全放行）
function startDrag(x, y) {
  dragActive = true;
  dragStartX = x;
  dragStartY = y;
  lastPointerX = x;
  pointerVel = 0;
  dragStartPos = currentPos;
  dragMoved = false;
  dragHorizontal = null;
  heroStage.classList.add("is-dragging");
  needsRender = true;
}

function moveDrag(x, y, prevent) {
  if (!dragActive) return;
  const dx = x - dragStartX;
  const dy = y - dragStartY;
  if (dragHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    dragHorizontal = Math.abs(dx) >= Math.abs(dy) * 0.85;
  }
  if (dragHorizontal === false) return;
  if (prevent && dragHorizontal) prevent();
  if (Math.abs(dx) > 4) dragMoved = true;

  const step = Math.max(120, lastEval ? lastEval.stepPx : stageW * 0.65);
  pointerVel = (x - lastPointerX) / step;
  lastPointerX = x;
  let nextPos = dragStartPos - dx / step;
  // 首尾轻阻尼橡皮筋
  if (nextPos < 0) nextPos *= 0.35;
  if (nextPos > HERO_SLIDES.length - 1) {
    nextPos = HERO_SLIDES.length - 1 + (nextPos - (HERO_SLIDES.length - 1)) * 0.35;
  }
  currentPos = nextPos;
  needsRender = true;
}

function endDrag() {
  if (!dragActive) return;
  dragActive = false;
  heroStage.classList.remove("is-dragging");
  if (dragHorizontal !== false && dragMoved) {
    const deltaPos = currentPos - dragStartPos;
    let target;
    if (Math.abs(deltaPos) >= 0.22 || Math.abs(pointerVel) >= 0.04) {
      const dir = Math.abs(deltaPos) >= 0.12 ? Math.sign(deltaPos) : -Math.sign(pointerVel);
      target = Math.round(dragStartPos) + dir;
    } else {
      target = Math.round(currentPos);
    }
    target = Math.max(0, Math.min(HERO_SLIDES.length - 1, target));
    goTo(target, true);
  }
  setTimeout(() => { dragMoved = false; }, 40);
  needsRender = true;
}

heroStage.addEventListener("mousedown", (e) => {
  if (e.target.closest("button")) return;
  startDrag(e.clientX, e.clientY);
});
window.addEventListener("mousemove", (e) => {
  if (!dragActive) return;
  moveDrag(e.clientX, e.clientY, () => e.preventDefault());
});
window.addEventListener("mouseup", endDrag);

heroStage.addEventListener("touchstart", (e) => {
  if (e.target.closest("button") || e.touches.length !== 1) return;
  const t = e.touches[0];
  startDrag(t.clientX, t.clientY);
}, { passive: true });
heroStage.addEventListener("touchmove", (e) => {
  if (!dragActive || e.touches.length !== 1) return;
  const t = e.touches[0];
  moveDrag(t.clientX, t.clientY, () => { if (e.cancelable) e.preventDefault(); });
}, { passive: false });
heroStage.addEventListener("touchend", endDrag, { passive: true });
heroStage.addEventListener("touchcancel", endDrag, { passive: true });

heroStage.addEventListener("mouseenter", () => { hoverStage = true; syncUI(); });
heroStage.addEventListener("mouseleave", () => { hoverStage = false; syncUI(); });
heroStage.addEventListener("focusin", () => { focusInsideStage = true; syncUI(); });
heroStage.addEventListener("focusout", () => { focusInsideStage = false; syncUI(); });

heroStage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); goTo(state.index - 1, true); }
  else if (e.key === "ArrowRight") { e.preventDefault(); goTo(state.index + 1, true); }
});

heroPrev.addEventListener("click", () => goTo(state.index - 1, true));
heroNext.addEventListener("click", () => goTo(state.index + 1, true));
autoPauseBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  syncUI();
  heroLoop.draw();
});

ctlCardPct.addEventListener("input", () => {
  state.cardPct = Number(ctlCardPct.value);
  syncUI();
  heroLoop.draw();
});
document.querySelectorAll("[data-focus]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.focusMode = btn.dataset.focus;
    syncUI();
    heroLoop.draw();
  });
});
document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.controls = btn.dataset.nav;
    syncUI();
    heroLoop.draw();
  });
});
document.querySelectorAll("[data-pace]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.pace = btn.dataset.pace;
    state.paused = false;
    autoElapsed = 0;
    syncUI();
    heroLoop.draw();
  });
});
document.getElementById("btn-reset-wrong").addEventListener("click", () => {
  Object.assign(state, DEFAULT_WRONG_STATE);
  autoElapsed = 0;
  syncUI();
  heroLoop.draw();
});

// 主动画循环（lib/stage.js 省电 + reduced-motion 支持）
const heroLoop = loop(heroStage, (_t, dt, { still }) => {
  if (!lastEval) syncUI();
  const ev = lastEval;

  // 开场平滑淡入（每一刻都清晰完整，0.5s 走完）
  if (still) {
    introProgress = 1;
    currentPos = state.index;
  } else if (introProgress < 1) {
    introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 2.2);
    needsRender = true;
  }

  // 松手弹性回弹到目标索引
  if (!dragActive) {
    const diff = state.index - currentPos;
    if (Math.abs(diff) > 0.0015) {
      currentPos += diff * Math.min(1, Math.max(dt, 0.016) * 12);
      needsRender = true;
    } else if (currentPos !== state.index) {
      currentPos = state.index;
      needsRender = true;
    }
  }

  // 自动播放时间轴推进（fast 模式不顾悬停强推，slow 模式悬停/聚焦/暂停立刻冻结）
  const shouldTickAuto =
    !still &&
    !dragActive &&
    ev.pace.intervalMs > 0 &&
    (state.pace === "fast" || (!state.paused && !hoverStage && !focusInsideStage));

  if (still && ev.pace.intervalMs > 0) {
    autoFill.style.width = "38%";
  } else if (shouldTickAuto && dt > 0) {
    autoElapsed += dt * 1000;
    const frac = Math.min(1, autoElapsed / ev.pace.intervalMs);
    autoFill.style.width = `${(frac * 100).toFixed(1)}%`;
    if (autoElapsed >= ev.pace.intervalMs) {
      autoElapsed = 0;
      state.index = (state.index + 1) % HERO_SLIDES.length;
      syncUI();
    }
  }

  if (needsRender) {
    const ease = 0.65 + 0.35 * (1 - (1 - introProgress) ** 3);
    layoutSlides(lastEval, currentPos, ease);
    drawRuler(lastEval, currentPos);
    needsRender = false;
  }
});

measureStage();
syncUI();
heroLoop.draw();

// ============================================================
// 01 节：多设备视口露边实验
// ============================================================
let peekDevice = "phone";
const peekRange = document.getElementById("peek-lab-range");
const peekPctEl = document.getElementById("peek-lab-pct");
const peekVp = document.getElementById("peek-viewport");
const peekStrip = document.getElementById("peek-strip");
const peekBadgeL = document.getElementById("peek-badge-l");
const peekBadgeR = document.getElementById("peek-badge-r");
const peekVerdict = document.getElementById("peek-verdict");
const peekVHead = document.getElementById("peek-v-head");
const peekVBody = document.getElementById("peek-v-body");

function updatePeekLab() {
  const pct = Number(peekRange.value);
  const r = evaluatePeekLab(peekDevice, pct);
  peekPctEl.textContent = `${pct}%`;

  const maxDisplayW = peekDevice === "phone" ? 360 : peekDevice === "tablet" ? 560 : 720;
  peekVp.style.maxWidth = `${maxDisplayW}px`;
  const scaledGap = Math.max(8, Math.round((r.dev.gap / r.dev.width) * maxDisplayW));
  peekStrip.style.gap = `${scaledGap}px`;

  peekStrip.querySelectorAll(".pk-card").forEach((c) => {
    c.style.width = `${pct}%`;
  });

  const label = `露 ${Math.round(r.peekPx)}px`;
  peekBadgeL.textContent = label;
  peekBadgeR.textContent = label;

  peekVerdict.classList.toggle("is-err", r.verdict === "err");
  peekVerdict.classList.toggle("is-warn", r.verdict === "warn");
  peekVHead.textContent = r.heading;
  peekVBody.textContent = r.note;
}

document.querySelectorAll("[data-device]").forEach((btn) => {
  btn.addEventListener("click", () => {
    peekDevice = btn.dataset.device;
    document.querySelectorAll("[data-device]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updatePeekLab();
  });
});
peekRange.addEventListener("input", updatePeekLab);
updatePeekLab();

// ============================================================
// 02 节：居中聚焦三旋钮 + 2D Canvas 视觉权重示意曲线
// ============================================================
const focusOpts = { scale: false, elev: false, dim: false };
const focusTrio = document.getElementById("focus-trio");
const curveCanvas = document.getElementById("focus-curve-canvas");
const curveCtx = curveCanvas.getContext("2d");
const curveLevel = document.getElementById("focus-curve-level");
const curveNote = document.getElementById("focus-curve-note");

function drawFocusCurve() {
  const w = curveCanvas.clientWidth || 320;
  const h = curveCanvas.clientHeight || 120;
  const dpr = pixelRatio(1.5);
  if (curveCanvas.width !== Math.round(w * dpr) || curveCanvas.height !== Math.round(h * dpr)) {
    curveCanvas.width = Math.round(w * dpr);
    curveCanvas.height = Math.round(h * dpr);
  }
  const ctx = curveCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const count = [focusOpts.scale, focusOpts.elev, focusOpts.dim].filter(Boolean).length;
  const centerPeak = 0.48 + (focusOpts.scale ? 0.18 : 0) + (focusOpts.elev ? 0.14 : 0) + (focusOpts.dim ? 0.12 : 0);
  const sidePeak = 0.46 - (focusOpts.scale ? 0.08 : 0) - (focusOpts.elev ? 0.05 : 0) - (focusOpts.dim ? 0.14 : 0);

  // 辅助底线
  ctx.strokeStyle = "#DDE7E3";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, h - 22);
  ctx.lineTo(w - 12, h - 22);
  ctx.stroke();

  // 三峰高斯权重示意曲线
  const sample = (u) => {
    const gL = sidePeak * Math.exp(-(((u - 0.16) / 0.11) ** 2));
    const gC = centerPeak * Math.exp(-(((u - 0.5) / 0.15) ** 2));
    const gR = sidePeak * Math.exp(-(((u - 0.84) / 0.11) ** 2));
    return Math.min(0.95, gL + gC + gR);
  };

  ctx.beginPath();
  ctx.moveTo(12, h - 22);
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const x = 12 + u * (w - 24);
    const y = h - 22 - sample(u) * (h - 36);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w - 12, h - 22);
  ctx.closePath();
  ctx.fillStyle = count >= 2 ? "rgba(20, 156, 156, 0.18)" : "rgba(184, 49, 33, 0.13)";
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const x = 12 + u * (w - 24);
    const y = h - 22 - sample(u) * (h - 36);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = count >= 2 ? "#0D7C7B" : "#B83121";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.font = `600 11px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = "#4F6874";
  ctx.textAlign = "center";
  ctx.fillText("左预览", 12 + 0.16 * (w - 24), h - 6);
  ctx.fillStyle = "#072130";
  ctx.fillText("居中主卡", 12 + 0.5 * (w - 24), h - 6);
  ctx.fillStyle = "#4F6874";
  ctx.fillText("右预览", 12 + 0.84 * (w - 24), h - 6);
  ctx.restore();

  if (count === 0) {
    curveLevel.textContent = "三卡平权 · 焦点分散";
    curveNote.textContent = "三座波峰几乎等高：左右露出的亮块与主卡平起平坐，眼睛进场没有明确第一落点。";
  } else if (count === 1) {
    curveLevel.textContent = "单维微弱 · 仍易分心";
    curveNote.textContent = "只靠单一维度的轻微区分，在彩色配图复杂时很容易被旁卡的高饱和色块抵消。";
  } else if (count === 2) {
    curveLevel.textContent = "双维协同 · 主次清晰";
    curveNote.textContent = "两个温和信号叠加后，中央波峰明显高于两侧，读者无需思考就能锁住当前帧。";
  } else {
    curveLevel.textContent = "三钮合奏 · 焦稳而不喧";
    curveNote.textContent = "放大、浮影与旁卡轻柔退让各走一小步，不用荧光粗框也能建立极干净的单主角秩序。";
  }
}

document.querySelectorAll("[data-fopt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.fopt;
    focusOpts[k] = !focusOpts[k];
    btn.setAttribute("aria-pressed", String(focusOpts[k]));
    focusTrio.classList.toggle("has-scale", focusOpts.scale);
    focusTrio.classList.toggle("has-elev", focusOpts.elev);
    focusTrio.classList.toggle("has-dim", focusOpts.dim);
    drawFocusCurve();
  });
});
new ResizeObserver(drawFocusCurve).observe(curveCanvas);
drawFocusCurve();

// ============================================================
// 03 节：Erik Runyon (2013) 衰减排位沙盘
// ============================================================
// 故意初始把「春季核心新品发布」塞到第 3 帧，让用户亲眼看到衰减落差
let decayOrder = [DECAY_ITEMS[1], DECAY_ITEMS[2], DECAY_ITEMS[0], DECAY_ITEMS[3], DECAY_ITEMS[4]];
let compareStaticHero = false;
const decayListEl = document.getElementById("decay-list");
const decaySummaryEl = document.getElementById("decay-summary");
const decayToggleBtn = document.getElementById("decay-toggle-hero");

function renderDecay() {
  decayListEl.innerHTML = "";
  decayOrder.forEach((item, idx) => {
    const share = compareStaticHero ? (idx === 0 ? 100 : 0) : RUNYON_WEIGHTS[idx];
    const li = document.createElement("li");
    li.className = `decay-row${item.id === "launch" ? " is-star" : ""}`;
    li.innerHTML = `
      <span class="decay-slot" lang="en">#${idx + 1}</span>
      <div class="decay-info">
        <strong>${item.title}</strong>
        <span>${item.role}</span>
      </div>
      <div class="decay-bar-wrap">
        <div class="decay-bar-bg"><div class="decay-bar-fill" style="width:${share}%"></div></div>
        <span class="decay-pct" lang="en">${compareStaticHero ? (idx === 0 ? "独享首屏" : "移至下方网格") : `占轮播点击 ~${share}%`}</span>
      </div>
      <div class="decay-move">
        <button type="button" class="move-btn" data-dir="-1" data-i="${idx}" aria-label="上移一位" ${idx === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="move-btn" data-dir="1" data-i="${idx}" aria-label="下移一位" ${idx === decayOrder.length - 1 ? "disabled" : ""}>↓</button>
      </div>
    `;
    decayListEl.appendChild(li);
  });

  decayListEl.querySelectorAll(".move-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      const d = Number(btn.dataset.dir);
      const j = i + d;
      if (j < 0 || j >= decayOrder.length) return;
      [decayOrder[i], decayOrder[j]] = [decayOrder[j], decayOrder[i]];
      renderDecay();
    });
  });

  const starPos = decayOrder.findIndex((x) => x.id === "launch");
  const starShare = RUNYON_WEIGHTS[starPos];
  if (compareStaticHero) {
    decaySummaryEl.className = "decay-summary";
    decaySummaryEl.innerHTML = `
      <h4>静态主视觉方案：把唯一主目标放首屏</h4>
      <p>将「${decayOrder[0].title}」做成清晰静止的 <a href="https://layout.xiaoxiaodong.ai/289/play/" target="_blank" rel="noopener">289 Hero 主视觉</a>，其余 4 条移到首屏下方的卡片网格并行展示。</p>
      <p>不再赌用户会不会点翻页箭头，也没有后置帧沦为「几乎零触达」的隐患。</p>
    `;
  } else if (starPos === 0) {
    decaySummaryEl.className = "decay-summary";
    decaySummaryEl.innerHTML = `
      <h4>核心新品回到第 1 帧（占轮播点击约 ${starShare}%）</h4>
      <p>如果首页确实要用轮播，务必把唯一最高优先级的目标锁死在第 1 帧，把第 2–5 帧当成「锦上添花的补充探索」，而不是把关键业务藏在后面。</p>
      <p>参考：Erik Runyon 2013 年对圣母大学官网的追踪显示，第 1 帧拿走约 84% 的轮播点击，后四帧每帧仅分得 2%–4%。</p>
    `;
  } else {
    decaySummaryEl.className = "decay-summary is-warn";
    decaySummaryEl.innerHTML = `
      <h4>警报：最高目标「春季核心新品」被埋在第 ${starPos + 1} 帧</h4>
      <p>按 2013 年圣母大学实测衰减分布，排在第 ${starPos + 1} 帧的条目大约只能分到 <strong>${starShare}%</strong> 的轮播互动——相比放第 1 帧（约 84%），触达几乎跌去一个数量级。</p>
      <p>点排位行上的「↑」把它推回 #1，或者点「改用静态单主视觉对比」按钮查看替代方案。</p>
    `;
  }
}

decayToggleBtn.addEventListener("click", () => {
  compareStaticHero = !compareStaticHero;
  decayToggleBtn.classList.toggle("is-on", compareStaticHero);
  decayToggleBtn.textContent = compareStaticHero ? "切回 5 帧轮播衰减" : "改用静态单主视觉对比";
  renderDecay();
});
renderDecay();

// ============================================================
// 04 节：真实「读完这一句」自动轮播限时体验器
// ============================================================
let apMode = "fast";
let apIdx = 0;
let apElapsed = 0;
let apHover = false;
let apFocus = false;
let apManualPaused = false;
const apStage = document.getElementById("ap-stage");
const apBar = document.getElementById("ap-bar");
const apBadge = document.getElementById("ap-badge");
const apTitle = document.getElementById("ap-title");
const apBody = document.getElementById("ap-body");
const apCta = document.getElementById("ap-cta");
const apStatus = document.getElementById("ap-status");
const apResult = document.getElementById("ap-result");

function renderApCard() {
  const c = AUTOPLAY_CARDS[apIdx];
  apBadge.textContent = c.badge;
  apTitle.textContent = c.title;
  apBody.textContent = c.body;
  apCta.textContent = c.cta;
  apStage.classList.toggle("is-safe", apMode !== "fast");
  apStatus.classList.toggle("is-ok", apMode !== "fast");
  if (apMode === "fast") {
    apStatus.textContent = "2.2s 强制切页中：鼠标悬停也不会停";
  } else if (apMode === "hover") {
    apStatus.textContent = apHover || apFocus || apManualPaused ? "悬停 / 聚焦 / 手动触发 → 已自动暂停" : "5s 慢速推进中（移入卡片立刻暂停）";
  } else {
    apStatus.textContent = "纯手动翻页：节奏完全由你掌控";
  }
}

document.querySelectorAll("[data-ap]").forEach((btn) => {
  btn.addEventListener("click", () => {
    apMode = btn.dataset.ap;
    apIdx = 0;
    apElapsed = 0;
    apManualPaused = false;
    document.querySelectorAll("[data-ap]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    apBar.style.width = apMode === "manual" ? "0%" : "10%";
    apResult.classList.remove("is-err");
    apResult.textContent =
      apMode === "fast"
        ? "已切到 2.2s 狂飙模式：试着完整读完第 1 帧再点「领取试喝装」，看它会不会在手落下去前溜走。"
        : apMode === "hover"
        ? "现在把鼠标移进卡片或按 Tab 聚焦，推进条会立刻停住，符合 WCAG 2.2.2 对悬停/聚焦即停的要求。"
        : "纯手动模式下，你可以从容读完每个字，再决定要不要点下方按钮翻看下一条。";
    renderApCard();
  });
});

apStage.addEventListener("mouseenter", () => { apHover = true; renderApCard(); });
apStage.addEventListener("mouseleave", () => { apHover = false; renderApCard(); });
apStage.addEventListener("focusin", () => { apFocus = true; renderApCard(); });
apStage.addEventListener("focusout", () => { apFocus = false; renderApCard(); });

document.getElementById("ap-prev").addEventListener("click", () => {
  apIdx = (apIdx - 1 + AUTOPLAY_CARDS.length) % AUTOPLAY_CARDS.length;
  apElapsed = 0;
  if (apMode === "hover") apManualPaused = true;
  renderApCard();
});
document.getElementById("ap-next").addEventListener("click", () => {
  apIdx = (apIdx + 1) % AUTOPLAY_CARDS.length;
  apElapsed = 0;
  if (apMode === "hover") apManualPaused = true;
  renderApCard();
});
apCta.addEventListener("click", () => {
  const c = AUTOPLAY_CARDS[apIdx];
  if (c.target) {
    apResult.classList.remove("is-err");
    apResult.textContent =
      apMode === "fast"
        ? "你手速很快点中了第 1 帧，但刚才读正文时是不是一直在和进度条赛跑？多数普通访客会直接放弃追赶。"
        : "稳稳点中目标「领取试喝装」！没有进度条催促时，阅读和决策过程零焦虑。";
  } else {
    apResult.classList.add("is-err");
    apResult.textContent = `误触到了第 ${apIdx + 1} 帧「${c.cta}」！这就是自动轮播最经典的「移动靶」伤害：用户看准的是上一张卡，手落下时页面刚好跳走了。`;
  }
});

loop(apStage, (_t, dt, { still }) => {
  if (still) {
    apBar.style.width = apMode === "manual" ? "0%" : "35%";
    return;
  }
  if (apMode === "manual") {
    apBar.style.width = "0%";
    return;
  }
  if (apMode === "hover" && (apHover || apFocus || apManualPaused)) return;
  const dur = apMode === "fast" ? 2200 : 5000;
  apElapsed += dt * 1000;
  apBar.style.width = `${Math.min(100, (apElapsed / dur) * 100).toFixed(1)}%`;
  if (apElapsed >= dur) {
    apElapsed = 0;
    apIdx = (apIdx + 1) % AUTOPLAY_CARDS.length;
    renderApCard();
  }
});
renderApCard();

// ============================================================
// 05 节：4 类真实需求分诊
// ============================================================
const triagePanel = document.getElementById("triage-panel");
function renderTriage(id) {
  const item = TRIAGE_CASES.find((c) => c.id === id) || TRIAGE_CASES[0];
  const linksHtml = item.links
    .map((l) => `<a href="https://layout.xiaoxiaodong.ai/${l.num}/play/" target="_blank" rel="noopener">${l.name}</a>`)
    .join(" · ");
  triagePanel.innerHTML = `
    <div class="triage-top">
      <span class="triage-badge ${item.tone === "ok" ? "is-ok" : "is-err"}">${item.verdict}</span>
      <strong>${item.label}</strong>
    </div>
    <p><strong>需求场景：</strong>${item.need}</p>
    <p><strong>判断理由：</strong>${item.reason}</p>
    <p><strong>相关对照页：</strong>${linksHtml}</p>
  `;
}
document.querySelectorAll("[data-triage]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-triage]").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderTriage(tab.dataset.triage);
  });
});
renderTriage(TRIAGE_CASES[0].id);

// ============================================================
// 06 节：原生 CSS Scroll Snap 沙盒
// ============================================================
const snapState = { type: "x mandatory", align: "center", width: "72%" };
const snapRail = document.getElementById("snap-rail");
const snapCode = document.getElementById("snap-code");
const snapPos = document.getElementById("snap-pos");

function applySnap() {
  snapRail.style.scrollSnapType = snapState.type;
  const pad = snapState.width === "100%" ? "0px" : "14%";
  snapRail.style.paddingLeft = pad;
  snapRail.style.paddingRight = pad;
  snapRail.querySelectorAll(".snap-card").forEach((c) => {
    c.style.flex = `0 0 ${snapState.width}`;
    c.style.scrollSnapAlign = snapState.align;
  });
  snapPos.textContent = `SNAP: ${snapState.type} · align: ${snapState.align} · card: ${snapState.width}`;
  snapCode.textContent = `.carousel-rail {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: ${snapState.type};
  padding-inline: ${pad}; /* 为居中停靠与两侧露边留出余量 */
}
.carousel-card {
  flex: 0 0 ${snapState.width};
  scroll-snap-align: ${snapState.align};
}`;
}

function bindSnapGroup(attr, key) {
  document.querySelectorAll(`[${attr}]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      snapState[key] = btn.getAttribute(attr);
      document.querySelectorAll(`[${attr}]`).forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      applySnap();
    });
  });
}
bindSnapGroup("data-snap-type", "type");
bindSnapGroup("data-snap-align", "align");
bindSnapGroup("data-snap-width", "width");

document.getElementById("snap-prev").addEventListener("click", () => {
  const step = snapRail.clientWidth * 0.72;
  snapRail.scrollLeft = Math.max(0, snapRail.scrollLeft - step);
});
document.getElementById("snap-next").addEventListener("click", () => {
  const step = snapRail.clientWidth * 0.72;
  snapRail.scrollLeft = Math.min(snapRail.scrollWidth, snapRail.scrollLeft + step);
});
applySnap();

// ============================================================
// 07 节：单变量客观四选一练习
// ============================================================
const quizFeedback = document.getElementById("quiz-feedback");
document.querySelectorAll("#lab-quiz .quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const ch = card.dataset.choice;
    const fb = QUIZ_FEEDBACK[ch];
    document.querySelectorAll("#lab-quiz .quiz-card").forEach((c) => {
      c.classList.remove("is-picked-ok", "is-picked-err");
      c.setAttribute("aria-pressed", c === card ? "true" : "false");
    });
    card.classList.add(fb.ok ? "is-picked-ok" : "is-picked-err");
    quizFeedback.hidden = false;
    quizFeedback.classList.toggle("is-err", !fb.ok);
    quizFeedback.innerHTML = `<strong>${fb.title}</strong><p>${fb.body}</p>`;
  });
});

// ============================================================
// 08 节：原海报放大拖拽灯箱（只复用 #poster 的 src，绝不二次内联）
// ============================================================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const plb = document.getElementById("poster-lightbox");
const plbStage = document.getElementById("plb-stage");
const plbImg = document.getElementById("plb-img");
const plbZoomEl = document.getElementById("plb-zoom");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = false;
let lbSX = 0;
let lbSY = 0;

function applyLbTransform() {
  plbImg.style.transform = `translate3d(${lbX}px, ${lbY}px, 0) scale(${lbScale})`;
  plbZoomEl.textContent = `${Math.round(lbScale * 100)}%`;
}
function openPosterLb() {
  if (!plbImg.src) plbImg.src = posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  plb.hidden = false;
  document.getElementById("plb-close").focus();
}
function closePosterLb() {
  plb.hidden = true;
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openPosterLb);
document.getElementById("plb-close").addEventListener("click", closePosterLb);
document.getElementById("plb-in").addEventListener("click", () => { lbScale = Math.min(3.5, +(lbScale + 0.35).toFixed(2)); applyLbTransform(); });
document.getElementById("plb-out").addEventListener("click", () => { lbScale = Math.max(0.6, +(lbScale - 0.35).toFixed(2)); applyLbTransform(); });
document.getElementById("plb-reset").addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLbTransform(); });

plbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = Math.max(0.6, Math.min(3.5, +(lbScale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
  applyLbTransform();
}, { passive: false });

plbStage.addEventListener("pointerdown", (e) => {
  lbDrag = true;
  lbSX = e.clientX - lbX;
  lbSY = e.clientY - lbY;
  plbStage.classList.add("is-dragging");
  plbStage.setPointerCapture?.(e.pointerId);
});
plbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbSX;
  lbY = e.clientY - lbSY;
  applyLbTransform();
});
plbStage.addEventListener("pointerup", () => { lbDrag = false; plbStage.classList.remove("is-dragging"); });
plbStage.addEventListener("pointercancel", () => { lbDrag = false; plbStage.classList.remove("is-dragging"); });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !plb.hidden) closePosterLb();
});
